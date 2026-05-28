import { Injectable } from '@angular/core';

import { Currency } from '@wisave/shared/model';
import {
  type IExpenseAccount,
  type IExpenseAccountUpdateChanges,
  type IExpenseAccountWritePayload,
  type IFundingAccount,
  type IFundingAccountApiDto,
  type IFundingAccountWritePayload,
  type IFundingPaymentInstrument,
  type IFundingPaymentInstrumentApiDto,
  type IFundingPaymentInstrumentWritePayload,
  type IFundingTransferWritePayload,
} from '@wisave/shared/model';
import { asExpenseAccountId, asFundingPaymentInstrumentId } from '@wisave/shared/model';

@Injectable({ providedIn: 'root' })
export class ExpenseAccountsMapperService {
  mapToFundingAccount(dto: IFundingAccountApiDto, paymentInstruments: IFundingPaymentInstrument[] = []): IFundingAccount {
    const id = asExpenseAccountId(dto.id);
    const base = {
      id,
      name: dto.name,
      currency: this.#mapCurrency(dto.currency),
      balance: dto.balance,
      isActive: dto.isActive,
      paymentInstruments: paymentInstruments.filter((instrument) => instrument.fundingAccountId === id),
      ...(dto.color && { color: dto.color }),
    };

    return dto.kind === 'Cash'
      ? { ...base, type: 'cash', kind: 'Cash' }
      : { ...base, type: 'bank_account', kind: 'BankAccount' };
  }

  mapToPaymentInstrument(dto: IFundingPaymentInstrumentApiDto): IFundingPaymentInstrument {
    return {
      id: asFundingPaymentInstrumentId(dto.id),
      fundingAccountId: asExpenseAccountId(dto.fundingAccountId),
      name: dto.name,
      kind: dto.kind,
      isActive: dto.isActive,
      ...(dto.lastFourDigits && { lastFourDigits: dto.lastFourDigits }),
      ...(dto.network && { network: dto.network }),
      ...(dto.color && { color: dto.color }),
    };
  }

  mapToAccounts(fundingDtos: IFundingAccountApiDto[]): IExpenseAccount[] {
    return fundingDtos.map((dto) => this.mapToFundingAccount(dto));
  }

  mapFundingAccountToApiRequest(account: IFundingAccountWritePayload, includeOpeningBalance: boolean): Record<string, unknown> {
    return {
      name: account.name,
      kind: account.kind,
      currency: account.currency,
      ...(includeOpeningBalance ? { openingBalance: account.openingBalance } : {}),
      color: account.color ?? null,
    };
  }

  mapPaymentInstrumentToApiRequest(payload: IFundingPaymentInstrumentWritePayload): Record<string, unknown> {
    return {
      name: payload.name,
      kind: payload.kind,
      lastFourDigits: payload.lastFourDigits ?? null,
      network: payload.network ?? null,
      color: payload.color ?? null,
    };
  }

  mapTransferToApiRequest(payload: IFundingTransferWritePayload): Record<string, unknown> {
    return {
      amount: payload.amount,
      postedAtUtc: payload.postedAtUtc ?? null,
    };
  }

  mapToApiRequest(account: IExpenseAccountWritePayload): Record<string, unknown> {
    return this.mapFundingAccountToApiRequest(account, true);
  }

  mapPartialToApiRequest(changes: IExpenseAccountUpdateChanges): Record<string, unknown> {
    const result: Record<string, unknown> = { ...changes };
    delete result['type'];
    delete result['openingBalance'];
    return result;
  }

  #mapCurrency(value: string): Currency {
    return (Object.values(Currency) as string[]).includes(value) ? (value as Currency) : Currency.PLN;
  }
}
