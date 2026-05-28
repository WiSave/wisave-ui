import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';

import { provideDispatcher } from '@ngrx/signals/events';

import type { IExpenseAccountWritePayload } from '@core/types/expense-account.interface';
import { asExpenseAccountId } from '@core/types/expense-id.types';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';

import { EditAccountComponent } from './edit-account.component';

describe('EditAccountComponent', () => {
  const navigate = vi.fn(() => Promise.resolve(true));
  const paramMap$ = new ReplaySubject<ReturnType<typeof convertToParamMap>>(1);

  const accountOne = {
    id: asExpenseAccountId('account-1'),
    name: 'Account one',
    type: 'bank_account' as const,
    kind: 'BankAccount' as const,
    currency: 'PLN' as const,
    balance: 100,
    isActive: true,
    paymentInstruments: [],
  };

  const accountTwo = {
    id: asExpenseAccountId('account-2'),
    name: 'Account two',
    type: 'bank_account' as const,
    kind: 'BankAccount' as const,
    currency: 'PLN' as const,
    balance: 200,
    isActive: true,
    paymentInstruments: [],
  };

  const storeStub = {
    entities: signal([accountOne, accountTwo]),
    selectedAccount: signal<typeof accountOne | typeof accountTwo | null>(accountOne),
    commandStatus: signal<'idle' | 'submitting' | 'accepted' | 'failed'>('idle'),
    isLoading: signal(false),
    error: signal(null),
  };

  beforeEach(async () => {
    navigate.mockClear();
    paramMap$.next(convertToParamMap({ id: 'account-1' }));
    storeStub.entities.set([accountOne, accountTwo]);
    storeStub.selectedAccount.set(accountOne);
    storeStub.commandStatus.set('idle');
    storeStub.isLoading.set(false);
    storeStub.error.set(null);

    await TestBed.configureTestingModule({
      imports: [EditAccountComponent],
      providers: [
        provideDispatcher(),
        { provide: ExpenseAccountsStore, useValue: storeStub },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable(), parent: {} } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does not close a newly opened edit dialog when a previous account update is accepted later', () => {
    const fixture = TestBed.createComponent(EditAccountComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSubmit({
      name: 'Updated account one',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: 'PLN',
      openingBalance: 150,
    } as IExpenseAccountWritePayload);

    paramMap$.next(convertToParamMap({ id: 'account-2' }));
    storeStub.selectedAccount.set(accountTwo);
    fixture.detectChanges();

    storeStub.commandStatus.set('accepted');
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
  });
});
