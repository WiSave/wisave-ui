import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Button } from 'primeng/button';
import { ColorPicker } from 'primeng/colorpicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { type AccountFormModel } from '@features/expense-accounts/types/account-form.types';

import { Currency, CurrencySymbol } from '@wisave/shared/model';
import {
  type ExpenseAccountType,
  type IExpenseAccount,
  type IExpenseAccountWritePayload,
} from '@wisave/shared/model';
import { type ExpenseAccountId } from '@wisave/shared/model';

const DEFAULT_COLOR = '#6366f1';

const TYPE_OPTIONS: { label: string; value: ExpenseAccountType }[] = [
  { label: 'Funding account - bank', value: 'bank_account' },
  { label: 'Funding account - cash', value: 'cash' },
];

const CURRENCY_OPTIONS: { label: string; value: Currency }[] = (Object.values(Currency) as Currency[]).map((currency) => ({
  label: `${currency} (${CurrencySymbol[currency]})`,
  value: currency,
}));

@Component({
  selector: 'app-account-form',
  imports: [ReactiveFormsModule, Button, ColorPicker, InputNumber, InputText, Select],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex min-h-0 flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-name">Name</label>
          <input
            id="account-name"
            [attr.aria-describedby]="isInvalid('name') ? 'account-name-error' : null"
            class="w-full"
            pInputText
            type="text"
            formControlName="name"
            placeholder="e.g. Main checking account" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('name')) {
              <span id="account-name-error" class="text-danger-600 dark:text-danger-400">Name is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-type">Type</label>
          <p-select
            [attr.aria-describedby]="isInvalid('type') ? 'account-type-error' : null"
            [options]="typeOptions"
            class="w-full"
            inputId="account-type"
            formControlName="type"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select type" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('type')) {
              <span id="account-type-error" class="text-danger-600 dark:text-danger-400">Type is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-currency">Currency</label>
          <p-select
            [attr.aria-describedby]="isInvalid('currency') ? 'account-currency-error' : null"
            [options]="currencyOptions"
            class="w-full"
            inputId="account-currency"
            formControlName="currency"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select currency" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('currency')) {
              <span id="account-currency-error" class="text-danger-600 dark:text-danger-400">Currency is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-balance">Balance</label>
          <p-inputNumber
            [attr.aria-describedby]="isInvalid('balance') ? 'account-balance-error' : null"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            class="w-full"
            inputId="account-balance"
            formControlName="balance"
            mode="decimal"
            placeholder="0.00" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('balance')) {
              <span id="account-balance-error" class="text-danger-600 dark:text-danger-400">Balance is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-color">Color</label>
          <p-colorPicker inputId="account-color" formControlName="color" appendTo="body" />
          <div class="min-h-5" aria-hidden="true"></div>
        </div>
      </div>

      <div class="border-secondary-200 dark:border-dark-divider mt-2 flex items-center justify-end gap-2 border-t pt-5">
        <p-button [disabled]="isLoading()" (click)="onCancel()" type="button" label="Cancel" icon="pi pi-times" severity="secondary" size="small" />
        <p-button [loading]="isLoading()" [disabled]="form.invalid || isLoading()" type="submit" label="Save" icon="pi pi-check" severity="success" size="small" />
      </div>
    </form>
  `,
})
export class AccountFormComponent {
  readonly #currentAccountId = signal<ExpenseAccountId | null>(null);

  readonly account = input<IExpenseAccount | null>(null);
  readonly bankAccounts = input<IExpenseAccount[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<IExpenseAccountWritePayload>();
  readonly cancelled = output<void>();

  readonly typeOptions = TYPE_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly form = new FormGroup<AccountFormModel>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    type: new FormControl<ExpenseAccountType>('bank_account', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl<Currency>(Currency.PLN, { nonNullable: true, validators: [Validators.required] }),
    balance: new FormControl<number | null>(null, { validators: [Validators.required] }),
    color: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
  });

  readonly selectedType = computed(() => this.form.controls.type.value);

  constructor() {
    effect(() => {
      const account = this.account();

      if (!account) {
        this.#currentAccountId.set(null);
        this.form.reset(this.#emptyFormValue(), { emitEvent: false });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        return;
      }

      if (this.#currentAccountId() === account.id && this.form.dirty) {
        return;
      }

      this.#currentAccountId.set(account.id);
      this.form.reset(this.#formValueFromAccount(account), { emitEvent: false });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

    effect(() => {
      if (this.isLoading()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const base = {
      name: v.name.trim(),
      currency: v.currency,
      openingBalance: v.balance ?? 0,
      ...(v.color && { color: v.color }),
    };

    const payload: IExpenseAccountWritePayload = v.type === 'cash'
      ? { ...base, type: 'cash', kind: 'Cash' }
      : { ...base, type: 'bank_account', kind: 'BankAccount' };

    this.submitted.emit(payload);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  isInvalid(controlName: keyof AccountFormModel): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  #emptyFormValue(): ReturnType<typeof this.form.getRawValue> {
    return {
      name: '',
      type: 'bank_account',
      currency: Currency.PLN,
      balance: null,
      color: DEFAULT_COLOR,
    };
  }

  #formValueFromAccount(account: IExpenseAccount): ReturnType<typeof this.form.getRawValue> {
    return {
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      color: account.color ?? DEFAULT_COLOR,
    };
  }
}
