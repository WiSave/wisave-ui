import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Currency } from '@wisave/shared/model';
import type { IBankAccount } from '@wisave/shared/model';
import { asExpenseAccountId } from '@wisave/shared/model';

import { AccountFormComponent } from './account-form.component';

describe('AccountFormComponent', () => {
  const bankAccount: IBankAccount = {
    id: asExpenseAccountId('bank-1'),
    name: 'Main account',
    type: 'bank_account',
    kind: 'BankAccount',
    currency: Currency.PLN,
    balance: 1000,
    isActive: true,
    paymentInstruments: [],
  };

  async function createComponent(bankAccounts: IBankAccount[] = [bankAccount]) {
    await TestBed.configureTestingModule({ imports: [AccountFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AccountFormComponent);
    fixture.componentRef.setInput('bankAccounts', bankAccounts as never);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('emits a bank-account write payload on submit', async () => {
    const fixture = await createComponent();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);

    fixture.componentInstance.form.patchValue({
      name: 'Savings',
      type: 'bank_account',
      currency: Currency.PLN,
      balance: 1500,
      color: '#000000',
    });
    fixture.componentInstance.onSubmit();

    expect(submitted).toHaveBeenCalledWith({
      name: 'Savings',
      type: 'bank_account',
      kind: 'BankAccount',
      currency: Currency.PLN,
      openingBalance: 1500,
      color: '#000000',
    });
  });

  it('emits a cash-account write payload on submit', async () => {
    const fixture = await createComponent();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);

    fixture.componentInstance.form.patchValue({
      name: 'Wallet',
      type: 'cash',
      currency: Currency.PLN,
      balance: 200,
      color: '#10b981',
    });
    fixture.componentInstance.onSubmit();

    expect(submitted).toHaveBeenCalledWith({
      name: 'Wallet',
      type: 'cash',
      kind: 'Cash',
      currency: Currency.PLN,
      openingBalance: 200,
      color: '#10b981',
    });
  });

  it('loads existing funding account edit state into form fields', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('account', bankAccount);
    fixture.detectChanges();

    expect(component.form.controls.name.value).toBe('Main account');
    expect(component.form.controls.type.value).toBe('bank_account');
    expect(component.form.controls.balance.value).toBe(1000);
  });
});
