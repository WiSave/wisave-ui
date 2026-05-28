import { Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { Currency, CurrencySymbol } from '@wisave/shared/model';

import { type IStockBroker, type IStockPosition, type IStockPositionWritePayload } from '../../types/stock-portfolio.types';

const CURRENCY_OPTIONS = (Object.values(Currency) as Currency[]).map((currency) => ({
  label: `${currency} (${CurrencySymbol[currency]})`,
  value: currency,
}));

@Component({
  selector: 'app-stock-position-form',
  imports: [ReactiveFormsModule, Button, DatePicker, InputNumber, InputText, Select],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex min-h-0 min-w-0 flex-col gap-5">
      <div data-testid="stock-position-identity-fields" class="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-12">
        <div data-testid="stock-position-symbol-field" class="flex min-w-0 flex-col gap-2 md:col-span-3">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-symbol">Symbol</label>
          <input id="stock-symbol" class="w-full min-w-0 uppercase" pInputText type="text" formControlName="symbol" placeholder="AAPL" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('symbol')) {
              <span class="text-danger-600 dark:text-danger-400">Symbol is required.</span>
            }
          </div>
        </div>

        <div data-testid="stock-position-name-field" class="flex min-w-0 flex-col gap-2 md:col-span-6">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-name">Name</label>
          <input id="stock-name" class="w-full min-w-0" pInputText type="text" formControlName="name" placeholder="Apple Inc." />
          <div class="min-h-5" aria-hidden="true"></div>
        </div>

        <div data-testid="stock-position-currency-field" class="flex min-w-0 flex-col gap-2 md:col-span-3">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-currency">Currency</label>
          <p-select class="w-full min-w-0" [options]="currencyOptions" inputId="stock-currency" formControlName="currency" optionLabel="label" optionValue="value" appendTo="body" placeholder="Select currency" />
          <div class="min-h-5" aria-hidden="true"></div>
        </div>

        <div data-testid="stock-position-broker-field" class="flex min-w-0 flex-col gap-2 md:col-span-4">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-broker">Broker</label>
          <p-select
            class="w-full min-w-0"
            [options]="brokerOptions()"
            [loading]="isBrokerLoading()"
            inputId="stock-broker"
            formControlName="brokerId"
            optionLabel="label"
            optionValue="value"
            appendTo="body"
            placeholder="Select broker" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('brokerId')) {
              <span class="text-danger-600 dark:text-danger-400">Broker is required.</span>
            }
          </div>
        </div>

        <div data-testid="stock-position-isin-field" class="flex min-w-0 flex-col gap-2 md:col-span-4">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-isin">ISIN</label>
          <input id="stock-isin" class="w-full min-w-0 uppercase" pInputText type="text" formControlName="isin" placeholder="US0378331005" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('isin')) {
              <span class="text-danger-600 dark:text-danger-400">ISIN is required.</span>
            }
          </div>
        </div>

        <div data-testid="stock-position-ordered-at-field" class="flex min-w-0 flex-col gap-2 md:col-span-4">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-ordered-at">Ordered at</label>
          <p-datepicker
            class="w-full min-w-0"
            [showIcon]="true"
            [showTime]="true"
            [showButtonBar]="true"
            [readonlyInput]="true"
            [fluid]="true"
            inputStyleClass="w-full !py-[0.625rem]"
            inputId="stock-ordered-at"
            formControlName="orderedAtUtc"
            appendTo="body" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('orderedAtUtc')) {
              <span class="text-danger-600 dark:text-danger-400">Order date is required.</span>
            }
          </div>
        </div>
      </div>

      <div data-testid="stock-position-allocation-tag-field" class="flex min-w-0 flex-col gap-2 md:max-w-sm">
        <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-allocation-tag">Allocation tag</label>
        <input id="stock-allocation-tag" class="w-full min-w-0" pInputText type="text" formControlName="allocationTag" placeholder="US Tech" />
        <div class="min-h-5" aria-hidden="true"></div>
      </div>

      <div data-testid="stock-position-pricing-fields" class="border-secondary-200 dark:border-dark-divider grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 border-t pt-4 md:grid-cols-3">
        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-quantity">Quantity</label>
          <p-inputNumber class="w-full min-w-0" inputStyleClass="w-full" [min]="0.000001" [maxFractionDigits]="6" inputId="stock-quantity" formControlName="quantity" mode="decimal" placeholder="0" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('quantity')) {
              <span class="text-danger-600 dark:text-danger-400">Quantity must be greater than zero.</span>
            }
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-unit-price">Unit price</label>
          <p-inputNumber class="w-full min-w-0" inputStyleClass="w-full" [min]="0.000001" [maxFractionDigits]="6" inputId="stock-unit-price" formControlName="unitPrice" mode="decimal" placeholder="0.000000" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('unitPrice')) {
              <span class="text-danger-600 dark:text-danger-400">Unit price must be greater than zero.</span>
            }
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium" for="stock-fees">Fees</label>
          <p-inputNumber class="w-full min-w-0" inputStyleClass="w-full" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" inputId="stock-fees" formControlName="fees" mode="decimal" placeholder="0.00" />
          <div class="min-h-5 text-xs leading-5">
            @if (isInvalid('fees')) {
              <span class="text-danger-600 dark:text-danger-400">Fees cannot be negative.</span>
            }
          </div>
        </div>
      </div>

      <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-end gap-2 border-t pt-5">
        <p-button [disabled]="isLoading()" [text]="true" (onClick)="cancelled.emit()" type="button" label="Cancel" severity="secondary" size="small" />
        <p-button [loading]="isLoading()" [disabled]="form.invalid || isLoading()" type="submit" label="Save" severity="success" size="small" />
      </div>
    </form>
  `,
})
export class StockPositionFormComponent {
  readonly portfolioId = input.required<string>();
  readonly brokers = input<IStockBroker[]>([]);
  readonly position = input<IStockPosition | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly isBrokerLoading = input<boolean>(false);

  readonly submitted = output<IStockPositionWritePayload>();
  readonly cancelled = output<void>();

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly brokerOptions = computed(() => this.brokers().map((broker) => ({ label: broker.name, value: broker.id })));

  readonly form = new FormGroup({
    brokerId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    symbol: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    name: new FormControl('', { nonNullable: true }),
    allocationTag: new FormControl('', { nonNullable: true }),
    isin: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    quantity: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.000001)] }),
    currency: new FormControl<Currency>(Currency.PLN, { nonNullable: true, validators: [Validators.required] }),
    orderedAtUtc: new FormControl<Date | null>(new Date(), { validators: [Validators.required] }),
    unitPrice: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    fees: new FormControl<number | null>(0, { validators: [Validators.required, Validators.min(0)] }),
  });

  constructor() {
    effect(() => {
      const position = this.position();
      this.form.reset(
        {
          brokerId: position?.brokerId ?? this.brokers()[0]?.id ?? '',
          symbol: position?.symbol ?? '',
          name: position?.name ?? '',
          allocationTag: position?.allocationTag ?? position?.allocationGroup ?? '',
          isin: position?.isin ?? '',
          quantity: position?.quantity ?? null,
          currency: position?.currency ?? Currency.PLN,
          orderedAtUtc: new Date(),
          unitPrice: position?.averageCost ?? null,
          fees: 0,
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
    if (value.quantity === null || value.unitPrice === null || value.fees === null || value.orderedAtUtc === null) {
      return;
    }

    const name = value.name.trim();
    const allocationTag = value.allocationTag.trim();

    this.submitted.emit({
      portfolioId: this.portfolioId(),
      brokerId: value.brokerId,
      symbol: value.symbol.trim().toUpperCase(),
      isin: value.isin.trim().toUpperCase(),
      name: name.length > 0 ? name : null,
      currency: value.currency,
      allocationTag: allocationTag.length > 0 ? allocationTag : null,
      orderedAtUtc: value.orderedAtUtc.toISOString(),
      quantity: value.quantity,
      unitPrice: value.unitPrice,
      fees: value.fees,
      brokerOrderId: null,
    });
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
