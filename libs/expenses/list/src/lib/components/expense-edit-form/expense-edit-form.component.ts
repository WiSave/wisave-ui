import { Component, computed, effect, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';

import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

import {
  createMoney,
  Currency,
  CurrencySymbol,
  type ExpenseAccountId,
  type ExpenseCategoryId,
  type ExpenseSubcategoryId,
  type IExpense,
  type IExpenseAccount,
  type IExpenseCategory,
} from '@wisave/shared/model';

import type { ExpenseFormModel, MetadataEntryModel } from '../../types/expense-form.types';

const DEFAULT_CURRENCY = Currency.PLN;

const CURRENCY_OPTIONS: { label: string; value: Currency }[] = (Object.values(Currency) as Currency[]).map((currency) => ({
  label: `${currency} (${CurrencySymbol[currency]})`,
  value: currency,
}));

const INITIAL_FORM_VALUE = {
  date: null as Date | null,
  description: '',
  categoryId: null as ExpenseCategoryId | null,
  subcategoryId: null as ExpenseSubcategoryId | null,
  accountId: null as ExpenseAccountId | null,
  amount: null as number | null,
  currency: DEFAULT_CURRENCY,
  recurring: false,
};

const trimmedRequired = (control: AbstractControl): ValidationErrors | null => {
  const { value } = control;
  return typeof value === 'string' && value.trim().length > 0 ? null : { required: true };
};

@Component({
  selector: 'app-expense-edit-form',
  imports: [ReactiveFormsModule, Button, DatePicker, InputNumber, InputText, Select, ToggleSwitch],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex min-h-0 flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-date">Date</label>
          <p-datepicker
            [attr.aria-describedby]="isInvalid('date') ? 'expense-date-error' : null"
            [showIcon]="true"
            [showButtonBar]="true"
            [readonlyInput]="true"
            [fluid]="true"
            inputStyleClass="!py-[0.625rem]"
            inputId="expense-date"
            formControlName="date"
            appendTo="body" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('date')) {
              <span id="expense-date-error" class="text-danger-600 dark:text-danger-400">Date is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-description">Description</label>
          <input
            id="expense-description"
            [attr.aria-describedby]="isInvalid('description') ? 'expense-description-error' : null"
            class="w-full"
            pInputText
            type="text"
            formControlName="description"
            placeholder="Groceries, rent, utilities" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('description')) {
              <span id="expense-description-error" class="text-danger-600 dark:text-danger-400">Description is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-category">Category</label>
          <p-select
            [attr.aria-describedby]="isInvalid('categoryId') ? 'expense-category-error' : null"
            [options]="categoryOptions()"
            [showClear]="true"
            class="w-full"
            inputId="expense-category"
            formControlName="categoryId"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select category" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('categoryId')) {
              <span id="expense-category-error" class="text-danger-600 dark:text-danger-400">Category is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-subcategory">Subcategory</label>
          <p-select
            [options]="subcategoryOptions()"
            [showClear]="true"
            [disabled]="!form.controls.categoryId.value"
            class="w-full"
            inputId="expense-subcategory"
            formControlName="subcategoryId"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select subcategory" />
          <div class="min-h-5" aria-hidden="true"></div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-account">Account</label>
          <p-select
            [attr.aria-describedby]="isInvalid('accountId') ? 'expense-account-error' : null"
            [options]="accountOptions()"
            [showClear]="true"
            class="w-full"
            inputId="expense-account"
            formControlName="accountId"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select account" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('accountId')) {
              <span id="expense-account-error" class="text-danger-600 dark:text-danger-400">Account is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-amount">Amount</label>
          <p-inputNumber
            [attr.aria-describedby]="isInvalid('amount') ? 'expense-amount-error' : null"
            [min]="0.01"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            class="w-full"
            inputId="expense-amount"
            formControlName="amount"
            mode="decimal"
            placeholder="0.00" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('amount')) {
              <span id="expense-amount-error" class="text-danger-600 dark:text-danger-400">Amount is required and must be greater than 0.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-currency">Currency</label>
          <p-select
            [attr.aria-describedby]="isInvalid('currency') ? 'expense-currency-error' : null"
            [options]="currencyOptions"
            class="w-full"
            inputId="expense-currency"
            formControlName="currency"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select currency" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('currency')) {
              <span id="expense-currency-error" class="text-danger-600 dark:text-danger-400">Currency is required.</span>
            }
          </div>
        </div>

        <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-between gap-4 self-start rounded-xl border p-3">
          <div class="flex flex-col">
            <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="expense-recurring">Recurring</label>
            <span class="text-secondary-500 dark:text-dark-secondary-300 text-xs">Mark if this expense repeats.</span>
          </div>
          <p-toggleswitch inputId="expense-recurring" formControlName="recurring" />
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Metadata</span>
            <span class="text-secondary-500 dark:text-dark-secondary-300 text-xs">Add custom key-value data (optional).</span>
          </div>
          <p-button [disabled]="isLoading()" [text]="true" (click)="addMetadataEntry()" type="button" label="Add field" icon="pi pi-plus" severity="secondary" size="small" />
        </div>
        @for (entry of form.controls.metadata.controls; track entry; let i = $index) {
          <div class="flex items-start gap-2">
            <div class="flex flex-1 flex-col gap-1">
              <input [formControl]="entry.controls.key" class="w-full" pInputText type="text" placeholder="Key (e.g. vendor)" />
              <div class="min-h-5 text-xs leading-5">
                @if (entry.controls.key.invalid && (entry.controls.key.dirty || entry.controls.key.touched)) {
                  <span class="text-danger-600 dark:text-danger-400">Key is required.</span>
                }
              </div>
            </div>
            <div class="flex flex-1 flex-col gap-1">
              <input [formControl]="entry.controls.value" class="w-full" pInputText type="text" placeholder="Value (e.g. Biedronka)" />
              <div class="min-h-5 text-xs leading-5">
                @if (entry.controls.value.invalid && (entry.controls.value.dirty || entry.controls.value.touched)) {
                  <span class="text-danger-600 dark:text-danger-400">Value is required.</span>
                }
              </div>
            </div>
            <p-button
              [disabled]="isLoading()"
              [text]="true"
              [rounded]="true"
              (click)="removeMetadataEntry(i)"
              type="button"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              ariaLabel="Remove metadata entry" />
          </div>
        }
      </div>

      <div class="border-secondary-200 dark:border-dark-divider mt-2 flex items-center justify-end gap-2 border-t pt-5">
        <p-button [disabled]="isLoading()" (click)="onCancel()" type="button" label="Cancel" icon="pi pi-times" severity="secondary" size="small" />
        <p-button [loading]="isLoading()" [disabled]="form.invalid || isLoading()" type="submit" label="Save" icon="pi pi-check" severity="success" size="small" />
      </div>
    </form>
  `,
})
export class ExpenseEditFormComponent {
  readonly expense = input<IExpense | null>(null);
  readonly categories = input<IExpenseCategory[]>([]);
  readonly accounts = input<IExpenseAccount[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<Omit<IExpense, 'id'>>();
  readonly cancelled = output<void>();

  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly categoryOptions = computed(() => this.categories().map((cat) => ({ label: cat.name, value: cat.id })));

  readonly subcategoryOptions = computed(() => {
    const selectedCategoryId = this.form.controls.categoryId.value;
    if (!selectedCategoryId) {
      return [];
    }
    const category = this.categories().find((c) => c.id === selectedCategoryId);
    return category?.subcategories.map((sub) => ({ label: sub.name, value: sub.id })) ?? [];
  });

  readonly accountOptions = computed(() => this.accounts().map((acc) => ({ label: acc.name, value: acc.id })));

  readonly form = new FormGroup<ExpenseFormModel>({
    date: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [trimmedRequired] }),
    categoryId: new FormControl<ExpenseCategoryId | null>(null, { validators: [Validators.required] }),
    subcategoryId: new FormControl<ExpenseSubcategoryId | null>(null),
    accountId: new FormControl<ExpenseAccountId | null>(null, { validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<Currency>(DEFAULT_CURRENCY, { nonNullable: true, validators: [Validators.required] }),
    recurring: new FormControl(false, { nonNullable: true }),
    metadata: new FormArray<FormGroup<MetadataEntryModel>>([]),
  });

  constructor() {
    effect(() => {
      const expense = this.expense();

      if (!expense) {
        this.form.reset(INITIAL_FORM_VALUE, { emitEvent: false });
        this.#clearMetadata();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        return;
      }

      this.form.reset(
        {
          date: expense.date,
          description: expense.description,
          categoryId: expense.categoryId,
          subcategoryId: expense.subcategoryId ?? null,
          accountId: expense.accountId,
          amount: expense.amount.amount,
          currency: expense.amount.currency,
          recurring: expense.recurring ?? false,
        },
        { emitEvent: false },
      );
      this.#clearMetadata();
      if (expense.metadata) {
        for (const [key, value] of Object.entries(expense.metadata)) {
          this.addMetadataEntry(key, value);
        }
      }
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

    const value = this.form.getRawValue();

    if (!value.date || value.amount === null || value.amount <= 0 || !value.categoryId || !value.accountId) {
      return;
    }

    const metadata: Record<string, string> = {};
    for (const entry of this.form.controls.metadata.controls) {
      const key = entry.controls.key.value.trim();
      const val = entry.controls.value.value.trim();
      if (key && val) {
        metadata[key] = val;
      }
    }

    this.submitted.emit({
      date: value.date,
      description: value.description.trim(),
      categoryId: value.categoryId,
      subcategoryId: value.subcategoryId ?? undefined,
      accountId: value.accountId,
      amount: createMoney(value.amount, value.currency),
      recurring: value.recurring,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  addMetadataEntry(key = '', value = ''): void {
    this.form.controls.metadata.push(
      new FormGroup<MetadataEntryModel>({
        key: new FormControl(key, { nonNullable: true, validators: [trimmedRequired] }),
        value: new FormControl(value, { nonNullable: true, validators: [trimmedRequired] }),
      }),
    );
  }

  removeMetadataEntry(index: number): void {
    this.form.controls.metadata.removeAt(index);
  }

  isInvalid(controlName: keyof ExpenseFormModel): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  #clearMetadata(): void {
    this.form.controls.metadata.clear();
  }
}
