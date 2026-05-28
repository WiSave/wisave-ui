import { Component, computed, input, output } from '@angular/core';

import { Button } from 'primeng/button';

import type { IBudget, IDelta } from '@core/types/expense-budget.interface';
import { createMoney, formatMoney } from '@core/types/money.interface';

@Component({
  selector: 'app-budget-overview-card',
  imports: [Button],
  template: `
    <section
      class="bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider flex flex-col gap-2 rounded-xl border p-3">
      <div class="flex items-center justify-between">
        <span class="text-secondary-600 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-wider">Monthly Budget</span>
        <p-button [text]="true" icon="pi pi-pencil" severity="secondary" size="small" ariaLabel="Edit" (onClick)="editClicked.emit()" />
      </div>
      <div class="flex items-end justify-between">
        <div class="flex items-baseline gap-1.5">
          <span class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-bold">{{ formattedSpent() }}</span>
          <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px]">/ {{ formattedLimit() }}</span>
        </div>
        <div class="text-right">
          @if (isOverBudget()) {
            <span class="text-sm font-bold text-rose-500">{{ formattedRemaining() }}</span>
            <span class="text-[10px] text-rose-500"> over</span>
          } @else {
            <span class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-bold">{{ formattedRemaining() }}</span>
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px]"> left</span>
          }
        </div>
      </div>
      <div class="bg-secondary-200 dark:bg-dark-primary-700 h-1 w-full overflow-hidden rounded-full">
        <div
          class="h-full rounded-full transition-all duration-300"
          [class]="isOverBudget() ? 'bg-rose-500' : 'bg-progress dark:bg-dark-progress'"
          [style.width.%]="progressPercent()"></div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-secondary-500 dark:text-dark-secondary-500 text-xs">{{ progressPercent().toFixed(0) }}% used</span>
        @if (delta(); as d) {
          <span [class]="d.direction === 'down' ? 'text-emerald-700' : d.direction === 'up' ? 'text-rose-500' : 'text-secondary-400'" class="text-xs">
            {{ d.direction === 'down' ? '↓' : d.direction === 'up' ? '↑' : '–' }} {{ d.percent }}% vs {{ deltaLabel() }}
          </span>
        }
      </div>
    </section>
  `,
})
export class BudgetOverviewCardComponent {
  readonly budget = input.required<IBudget>();
  readonly totalSpent = input.required<number>();
  readonly delta = input<IDelta | null>(null);
  readonly deltaLabel = input<string>('');
  readonly editClicked = output<void>();

  readonly isOverBudget = computed(() => this.totalSpent() > this.budget().totalLimit);

  readonly progressPercent = computed(() => {
    const limit = this.budget().totalLimit;
    if (limit <= 0) return 0;
    return Math.min((this.totalSpent() / limit) * 100, 100);
  });

  readonly remainingAmount = computed(() => Math.abs(this.budget().totalLimit - this.totalSpent()));

  readonly formattedSpent = computed(() => formatMoney(createMoney(this.totalSpent(), this.budget().currency)));
  readonly formattedLimit = computed(() => formatMoney(createMoney(this.budget().totalLimit, this.budget().currency)));
  readonly formattedRemaining = computed(() => formatMoney(createMoney(this.remainingAmount(), this.budget().currency)));
}
