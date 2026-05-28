import { inject } from '@angular/core';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';

import { ExpenseAccountsApiService } from '@services/expense-accounts/expense-accounts-api.service';
import { toStoreError } from '@wisave/shared/ui';

import { accountsApiEvents, accountsPageEvents } from './accounts.events';

export function withAccountsEventHandlers() {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _api: inject(ExpenseAccountsApiService),
    })),
    withEventHandlers((store) => ({
      loadAccounts$: store._events.on(accountsPageEvents.opened).pipe(
        exhaustMap(() =>
          store._api.getAll().pipe(
            map((accounts) => accountsApiEvents.loadedSuccess({ accounts })),
            catchError((err) => of(accountsApiEvents.loadedFailure({ error: toStoreError(err) }))),
          ),
        ),
      ),

      addAccount$: store._events.on(accountsPageEvents.add).pipe(
        exhaustMap(({ payload }) =>
          store._api.create(payload.account).pipe(
            map(() => accountsApiEvents.addAccepted()),
            catchError((err) => of(accountsApiEvents.addedFailure({ error: toStoreError(err) }))),
          ),
        ),
      ),

      updateAccount$: store._events.on(accountsPageEvents.update).pipe(
        exhaustMap(({ payload }) =>
          store._api.update(payload.id, payload.changes).pipe(
            map(() => accountsApiEvents.updateAccepted()),
            catchError((err) => of(accountsApiEvents.updatedFailure({ error: toStoreError(err) }))),
          ),
        ),
      ),

      removeAccount$: store._events.on(accountsPageEvents.remove).pipe(
        exhaustMap(({ payload }) =>
          store._api.delete(payload.id).pipe(
            map(() => accountsApiEvents.removeAccepted()),
            catchError((err) => of(accountsApiEvents.removedFailure({ error: toStoreError(err) }))),
          ),
        ),
      ),

      selectAccount$: store._events.on(accountsPageEvents.selectAccount).pipe(
        switchMap(({ payload }) =>
          store._api.getById(payload.id).pipe(
            map((account) => accountsApiEvents.selectedAccountLoaded({ account })),
            catchError((err) => of(accountsApiEvents.loadedFailure({ error: toStoreError(err) }))),
          ),
        ),
      ),
    })),
  );
}
