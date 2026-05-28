import { Component, computed, input, output } from '@angular/core';

import { Button } from 'primeng/button';

import { Currency } from '@wisave/shared/model';
import type { IDelta } from '@wisave/shared/model';
import { createMoney, formatMoney } from '@wisave/shared/model';

@Component({
  selector: 'app-category-budget-card',
  imports: [Button],
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
  template: `
    <section
      [class]="
        isOverBudget() ? 'bg-white dark:bg-dark-primary-850 border-rose-400 dark:border-rose-500/50' : 'bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider'
      "
      class="flex h-full flex-col gap-2 rounded-xl border p-3 transition-colors">
      <div class="flex items-start justify-between">
        <span class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-semibold">{{ categoryName() }}</span>
        <div class="flex gap-0.5">
          <p-button [text]="true" (onClick)="editClicked.emit()" icon="pi pi-pencil" severity="secondary" size="small" ariaLabel="Edit" />
          <p-button [text]="true" (onClick)="removeClicked.emit($event)" icon="pi pi-trash" severity="danger" size="small" ariaLabel="Remove" />
        </div>
      </div>
      <div class="mt-auto">
        <div class="flex items-baseline gap-1">
          <span class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-bold">{{ formattedSpent() }}</span>
          <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px]">/ {{ formattedLimit() }}</span>
        </div>
        <div class="bg-secondary-200 dark:bg-dark-primary-700 mt-1.5 h-1 w-full overflow-hidden rounded-full">
          <div
            [class]="isOverBudget() ? 'bg-rose-500' : 'bg-progress dark:bg-dark-progress'"
            [style.width.%]="progressPercent()"
            class="h-full rounded-full transition-all duration-300"></div>
        </div>
        <div class="mt-1 flex items-center justify-between">
          @if (isOverBudget()) {
            <p class="text-xs font-medium text-rose-500">{{ formattedOver() }} over</p>
          } @else {
            <p class="text-secondary-500 dark:text-dark-secondary-400 text-xs">{{ formattedRemaining() }} left</p>
          }
          @if (delta(); as d) {
            <span [class]="d.direction === 'down' ? 'text-emerald-700' : d.direction === 'up' ? 'text-rose-500' : 'text-secondary-400'" class="text-xs">
              {{ d.direction === 'down' ? '↓' : d.direction === 'up' ? '↑' : '–' }} {{ d.percent }}% vs {{ deltaLabel() }}
            </span>
          }
        </div>
      </div>
    </section>
  `,
})
export class CategoryBudgetCardComponent {
  readonly #currencyEnum = computed(() => (this.currency() as Currency) ?? Currency.PLN);

  readonly categoryName = input.required<string>();
  readonly spent = input.required<number>();
  readonly limit = input.required<number>();
  readonly currency = input<string>('PLN');
  readonly delta = input<IDelta | null>(null);
  readonly deltaLabel = input<string>('');

  readonly editClicked = output<void>();
  readonly removeClicked = output<Event>();

  readonly isOverBudget = computed(() => this.spent() > this.limit());

  readonly progressPercent = computed(() => {
    const lim = this.limit();
    if (lim <= 0) return 0;
    return Math.min((this.spent() / lim) * 100, 100);
  });

  readonly formattedSpent = computed(() => formatMoney(createMoney(this.spent(), this.#currencyEnum())));
  readonly formattedLimit = computed(() => formatMoney(createMoney(this.limit(), this.#currencyEnum())));
  readonly formattedRemaining = computed(() => formatMoney(createMoney(this.limit() - this.spent(), this.#currencyEnum())));
  readonly formattedOver = computed(() => formatMoney(createMoney(this.spent() - this.limit(), this.#currencyEnum())));
}
