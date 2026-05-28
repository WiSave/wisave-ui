import { TestBed } from '@angular/core/testing';

import { Currency } from '@wisave/shared/model';
import { asExpenseAccountId, asFundingPaymentInstrumentId } from '@wisave/shared/model';

import { ExpenseAccountsMapperService } from './expense-accounts-mapper.service';

describe('ExpenseAccountsMapperService', () => {
  let service: ExpenseAccountsMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseAccountsMapperService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('maps funding-account read models to funding account entities', () => {
    const result = service.mapToFundingAccount({
      id: 'funding-1',
      userId: 'user-1',
      name: 'Checking',
      kind: 'BankAccount',
      currency: Currency.PLN,
      balance: 1500,
      color: '#3b82f6',
      isActive: true,
      createdAt: '2026-04-17T00:00:00Z',
      updatedAt: null,
    });

    expect(result).toEqual({
      id: asExpenseAccountId('funding-1'),
      name: 'Checking',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: Currency.PLN,
      balance: 1500,
      color: '#3b82f6',
      isActive: true,
      paymentInstruments: [],
    });
  });

  it('maps funding payment instruments', () => {
    const result = service.mapToPaymentInstrument({
      id: 'instrument-1',
      fundingAccountId: 'funding-1',
      userId: 'user-1',
      name: 'Visa Debit',
      kind: 'DebitCard',
      lastFourDigits: '2201',
      network: 'Visa',
      color: '#10b981',
      isActive: true,
      createdAt: '2026-04-17T00:00:00Z',
      updatedAt: null,
    });

    expect(result).toEqual({
      id: asFundingPaymentInstrumentId('instrument-1'),
      fundingAccountId: asExpenseAccountId('funding-1'),
      name: 'Visa Debit',
      kind: 'DebitCard',
      lastFourDigits: '2201',
      network: 'Visa',
      color: '#10b981',
      isActive: true,
    });
  });

  it('serializes funding account requests without stale generic account fields', () => {
    expect(service.mapFundingAccountToApiRequest({
      name: 'Checking',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: Currency.PLN,
      openingBalance: 1500,
      color: '#3b82f6',
    }, true)).toEqual({
      name: 'Checking',
      kind: 'BankAccount',
      currency: Currency.PLN,
      openingBalance: 1500,
      color: '#3b82f6',
    });
  });
});
