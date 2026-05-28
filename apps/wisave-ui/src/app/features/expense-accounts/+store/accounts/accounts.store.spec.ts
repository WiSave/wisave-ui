import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { Currency } from '@wisave/shared/model';
import { type IExpenseAccount } from '@wisave/shared/model';
import { asExpenseAccountId } from '@wisave/shared/model';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { ExpenseAccountsApiService } from '@services/expense-accounts/expense-accounts-api.service';

import { accountsApiEvents, accountsPageEvents } from './accounts.events';
import { ExpenseAccountsStore } from './accounts.store';

describe('ExpenseAccountsStore', () => {
  let store: InstanceType<typeof ExpenseAccountsStore>;
  let dispatcher: Dispatcher;
  let api: Pick<ExpenseAccountsApiService, 'getById'> & { getById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideDispatcher(),
        {
          provide: ExpenseAccountsApiService,
          useValue: {
            getAll: vi.fn(() => of([])),
            getById: vi.fn(),
            create: vi.fn(() => of({})),
            update: vi.fn(() => of({})),
            delete: vi.fn(() => of({})),
          },
        },
      ],
    });

    store = TestBed.inject(ExpenseAccountsStore);
    dispatcher = TestBed.inject(Dispatcher);
    api = TestBed.inject(ExpenseAccountsApiService) as unknown as Pick<ExpenseAccountsApiService, 'getById'> & { getById: ReturnType<typeof vi.fn> };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('marks initial load as complete when accounts are loaded', () => {
    const accounts: IExpenseAccount[] = [
      {
        id: asExpenseAccountId('account-1'),
        name: 'Checking',
        type: 'bank_account',
        kind: 'BankAccount',
        currency: Currency.PLN,
        balance: 100,
        isActive: true,
        paymentInstruments: [],
      },
    ];

    dispatcher.dispatch(accountsApiEvents.loadedSuccess({ accounts }));

    expect(store.hasLoaded()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.commandStatus()).toBe('idle');
    expect(store.entities()).toHaveLength(1);
  });

  it('stores a fetched selected account in state', () => {
    const account: IExpenseAccount = {
      id: asExpenseAccountId('account-2'),
      name: 'Checking',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: Currency.PLN,
      balance: 1000,
      isActive: true,
      paymentInstruments: [],
      color: '#123456',
    };

    const selectedAccount$ = new Subject<IExpenseAccount>();
    api.getById.mockReturnValue(selectedAccount$.asObservable());

    dispatcher.dispatch(accountsPageEvents.selectAccount({ id: account.id }));
    expect(store.isLoading()).toBe(true);
    expect(store.selectedAccount()).toBeNull();

    selectedAccount$.next(account);
    selectedAccount$.complete();

    expect(store.selectedAccount()).toEqual(account);
    expect(store.entityMap()[account.id]).toEqual(account);
    expect(store.isLoading()).toBe(false);
    expect(store.commandStatus()).toBe('idle');
  });

  it('treats accepted commands as acknowledgements without mutating entities', () => {
    const account: IExpenseAccount = {
      id: asExpenseAccountId('account-3'),
      name: 'Wallet',
      type: 'cash',
      kind: 'Cash',
      currency: Currency.PLN,
      balance: 100,
      isActive: true,
      paymentInstruments: [],
      color: '#123456',
    };

    dispatcher.dispatch(accountsApiEvents.loadedSuccess({ accounts: [account] }));
    dispatcher.dispatch(accountsApiEvents.selectedAccountLoaded({ account }));

    dispatcher.dispatch(accountsApiEvents.updateAccepted());

    expect(store.commandStatus()).toBe('accepted');
    expect(store.entityMap()[account.id]).toEqual(account);
    expect(store.selectedAccount()).toEqual(account);

    dispatcher.dispatch(accountsApiEvents.addAccepted());
    dispatcher.dispatch(accountsApiEvents.removeAccepted());

    expect(store.commandStatus()).toBe('accepted');
    expect(store.entityMap()[account.id]).toEqual(account);
    expect(store.selectedAccount()).toEqual(account);
  });
});
