import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import type { NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';

import { provideDispatcher } from '@ngrx/signals/events';

import { Currency } from '@wisave/shared/model';
import { asExpenseAccountId } from '@wisave/shared/model';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';

import { AccountsComponent } from './accounts.component';

describe('AccountsComponent', () => {
  const routerEvents$ = new Subject<NavigationEnd>();
  const navigate = vi.fn(() => Promise.resolve(true));

  const storeStub = {
    isLoading: signal(true),
    hasLoaded: signal(false),
    error: signal<{ message: string; category: string } | null>(null),
    commandStatus: signal<'idle' | 'submitting' | 'accepted' | 'failed'>('idle'),
    entities: signal([]),
    selectedAccount: signal(null),
  };

  beforeEach(async () => {
    navigate.mockClear();
    storeStub.isLoading.set(true);
    storeStub.hasLoaded.set(false);
    storeStub.error.set(null);
    storeStub.commandStatus.set('idle');
    storeStub.entities.set([]);
    storeStub.selectedAccount.set(null);

    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [
        provideDispatcher(),
        { provide: ExpenseAccountsStore, useValue: storeStub },
        { provide: Router, useValue: { events: routerEvents$.asObservable(), navigate } },
        { provide: ActivatedRoute, useValue: { children: [], parent: {}, snapshot: {}, firstChild: null } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows a blocking loader until the first projection load completes', () => {
    const fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading accounts...');
  });

  it('shows a retryable error state after the first load fails', () => {
    storeStub.isLoading.set(false);
    storeStub.hasLoaded.set(true);
    storeStub.error.set({ message: 'Projection failed', category: 'server' });

    const fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load accounts');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('renders funding account summary and list after load', () => {
    storeStub.isLoading.set(false);
    storeStub.hasLoaded.set(true);
    storeStub.entities.set([
      {
        id: asExpenseAccountId('bank-1'),
        name: 'Main bank',
        type: 'bank_account',
        kind: 'BankAccount',
        currency: Currency.PLN,
        balance: 1500,
        isActive: true,
        paymentInstruments: [],
      },
      {
        id: asExpenseAccountId('cash-1'),
        name: 'Wallet',
        type: 'cash',
        kind: 'Cash',
        currency: Currency.PLN,
        balance: 200,
        isActive: true,
        paymentInstruments: [],
      },
    ] as never);

    const fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Liquid Funds');
    expect(text).toContain('Funding Accounts');
    expect(text).toContain('Main bank');
    expect(text).toContain('Wallet');
  });
});
