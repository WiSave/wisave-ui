import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { withEventHandlers } from '@ngrx/signals/events';
import { filter, map, merge, pairwise } from 'rxjs';

import { ExpensesSignalRService } from '@wisave/platform/signalr';
import type {
  IFundingAccountOpenedPayload,
  IFundingAccountUpdatedPayload,
} from '@wisave/platform/signalr';
import { PortalSignalRService } from '@wisave/platform/signalr';
import { Currency } from '@wisave/shared/model';
import type { IFundingAccount } from '@wisave/shared/model';
import { asExpenseAccountId } from '@wisave/shared/model';

import { accountsPageEvents, accountsSignalREvents } from './accounts.events';

function mapCurrency(value: string | null | undefined): Currency {
  if (!value) return Currency.PLN;
  return (Object.values(Currency) as string[]).includes(value) ? (value as Currency) : Currency.PLN;
}

export function mapFundingAccountFromSignalR(payload: IFundingAccountOpenedPayload | IFundingAccountUpdatedPayload): IFundingAccount {
  const balance = 'openingBalance' in payload ? payload.openingBalance : 0;
  const base = {
    id: asExpenseAccountId(payload.fundingAccountId),
    name: payload.name,
    currency: mapCurrency(payload.currency),
    balance,
    isActive: true,
    paymentInstruments: [],
    ...(payload.color && { color: payload.color }),
  };

  return payload.kind === 'Cash'
    ? { ...base, type: 'cash', kind: 'Cash' }
    : { ...base, type: 'bank_account', kind: 'BankAccount' };
}

export function withAccountsSignalR() {
  return signalStoreFeature(
    withProps(() => ({
      _realtime: inject(ExpensesSignalRService),
      _portal: inject(PortalSignalRService),
    })),
    withEventHandlers((store) => ({
      accountUpserted$: merge(
        store._realtime.fundingAccountOpened$.pipe(map((env) => mapFundingAccountFromSignalR(env.payload as IFundingAccountOpenedPayload))),
        store._realtime.fundingAccountUpdated$.pipe(map((env) => mapFundingAccountFromSignalR(env.payload as IFundingAccountUpdatedPayload))),
      ).pipe(map((account) => accountsSignalREvents.accountUpsertedSignalR({ account }))),
      accountClosed$: store._realtime.fundingAccountClosed$.pipe(
        map((env) => env.payload?.fundingAccountId ?? env.entityId),
        filter((id): id is string => Boolean(id)),
        map((id) => accountsSignalREvents.accountRemovedSignalR({ id: asExpenseAccountId(id) })),
      ),
      accountProjectionChanged$: merge(
        store._realtime.fundingPaymentInstrumentAdded$,
        store._realtime.fundingPaymentInstrumentUpdated$,
        store._realtime.fundingPaymentInstrumentRemoved$,
        store._realtime.fundingTransferPosted$,
      ).pipe(map(() => accountsPageEvents.opened())),
      reconnectCatchUp$: toObservable(store._portal.status).pipe(
        pairwise(),
        filter(([prev, curr]) => (prev === 'reconnecting' || prev === 'disconnected') && curr === 'connected'),
        map(() => accountsPageEvents.opened()),
      ),
    })),
  );
}
