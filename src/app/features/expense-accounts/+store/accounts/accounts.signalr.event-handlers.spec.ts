import { Currency } from '@core/types/currency.enum';

import { mapFundingAccountFromSignalR } from './accounts.signalr.event-handlers';

describe('accounts.signalr.event-handlers', () => {
  it('maps funding account events as funding account snapshots', () => {
    const account = mapFundingAccountFromSignalR({
      fundingAccountId: 'funding-1',
      userId: 'user-1',
      name: 'Checking',
      kind: 'BankAccount',
      currency: 'PLN',
      openingBalance: 250,
      color: '#10b981',
      timestamp: '2026-04-19T10:00:00Z',
    });

    expect(account).toEqual({
      id: 'funding-1',
      name: 'Checking',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: Currency.PLN,
      balance: 250,
      isActive: true,
      paymentInstruments: [],
      color: '#10b981',
    });
  });
});
