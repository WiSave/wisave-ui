import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { Currency, CurrencySymbol } from '@wisave/shared/model';

import { type IStockPortfolio, type IStockPortfolioWritePayload } from '@wisave/stock/data-access';

const CURRENCY_OPTIONS = (Object.values(Currency) as Currency[]).map((currency) => ({
  label: `${currency} (${CurrencySymbol[currency]})`,
  value: currency,
}));

@Component({
  selector: 'app-stock-portfolio-form',
  imports: [ReactiveFormsModule, Button, InputText, Select],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex min-h-0 flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-portfolio-name">Name</label>
          <input id="stock-portfolio-name" class="w-full" pInputText type="text" formControlName="name" placeholder="Portfolio name" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('name')) {
              <span class="text-danger-600 dark:text-danger-400">Portfolio name is required.</span>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-portfolio-currency">Reporting currency</label>
          <p-select [options]="currencyOptions" inputId="stock-portfolio-currency" formControlName="currency" optionLabel="label" optionValue="value" appendTo="body" placeholder="Select currency" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('currency')) {
              <span class="text-danger-600 dark:text-danger-400">Currency is required.</span>
            }
          </div>
        </div>
      </div>

      <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-end gap-2 border-t pt-5">
        <p-button [disabled]="isLoading()" [text]="true" (onClick)="cancelled.emit()" type="button" label="Cancel" severity="secondary" size="small" />
        <p-button [loading]="isLoading()" [disabled]="form.invalid || isLoading()" [label]="submitLabel()" [icon]="submitIcon()" type="submit" severity="success" size="small" />
      </div>
    </form>
  `,
})
export class StockPortfolioFormComponent {
  readonly portfolio = input<IStockPortfolio | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly submitLabel = input<string>('Save');
  readonly submitIcon = input<string>('pi pi-check');

  readonly submitted = output<IStockPortfolioWritePayload>();
  readonly cancelled = output<void>();

  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    currency: new FormControl<Currency>(Currency.PLN, { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const portfolio = this.portfolio();
      this.form.reset(
        {
          name: portfolio?.name ?? '',
          currency: portfolio?.currency ?? Currency.PLN,
        },
        { emitEvent: false },
      );
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
    this.submitted.emit({
      name: value.name.trim(),
      currency: value.currency,
    });
  }

  isInvalid(controlName: 'name' | 'currency'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
