import { Component, input, output } from '@angular/core';

import { Button } from 'primeng/button';

import { CurrencyLocale, formatMoney } from '@wisave/shared/model';
import { type IStockPosition } from '@wisave/stock/data-access';

@Component({
  selector: 'app-stock-positions-table',
  imports: [Button],
  template: `
    <section class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
      <header class="border-secondary-100 dark:border-dark-divider flex items-center justify-between gap-4 border-b px-4 py-3">
        <div class="min-w-0">
          <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Positions</h3>
          <p class="text-secondary-500 dark:text-dark-secondary-400 mt-1 text-xs">Select rows to focus the chart on one or more holdings.</p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-2" data-testid="stock-positions-header-actions">
          <p-button label="Open" icon="pi pi-filter" severity="secondary" size="small" />
          <p-button [outlined]="true" label="Closed" icon="pi pi-history" severity="secondary" size="small" />
          <p-button (onClick)="addPosition.emit()" label="Add Position" icon="pi pi-plus" severity="success" size="small" />
        </div>
      </header>

      <div class="min-h-0 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]" data-testid="stock-positions-scroll">
        <table class="w-full min-w-[87.5rem] table-fixed text-left text-sm">
          <thead class="bg-secondary-50 dark:bg-dark-primary-900/70 text-secondary-500 dark:text-dark-secondary-300">
            <tr>
              <th class="w-[5.5rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Chart</th>
              <th class="w-[8rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Symbol</th>
              <th class="w-[18rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Name</th>
              <th class="w-[7rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Qty</th>
              <th class="w-[9rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Avg Cost</th>
              <th class="w-[9rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Market</th>
              <th class="w-[10rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Value</th>
              <th class="w-[8rem] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">P/L</th>
              <th class="w-[13rem] px-4 py-3 text-right text-[10px] font-semibold tracking-[0.16em] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-secondary-100 dark:divide-dark-divider divide-y">
            @for (position of positions(); track position.id) {
              <tr class="hover:bg-secondary-50/80 dark:hover:bg-dark-primary-800/40 align-middle transition-colors">
                <td class="px-4 py-3">
                  <button
                    [attr.aria-pressed]="isCharted(position.id)"
                    [attr.aria-label]="'Toggle chart for ' + position.symbol"
                    [class.bg-secondary-900]="isCharted(position.id)"
                    [class.text-white]="isCharted(position.id)"
                    [class.dark:bg-dark-secondary-100]="isCharted(position.id)"
                    [class.dark:text-dark-primary-950]="isCharted(position.id)"
                    (click)="onChartToggle(position.id)"
                    class="border-secondary-300 dark:border-dark-divider inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] transition"
                    type="button">
                    @if (isCharted(position.id)) {
                      <i class="pi pi-check text-[10px]"></i>
                    }
                  </button>
                </td>
                <td class="text-secondary-950 dark:text-dark-secondary-50 px-4 py-3 font-semibold">{{ position.symbol }}</td>
                <td class="text-secondary-500 dark:text-dark-secondary-300 truncate px-4 py-3">{{ position.name }}</td>
                <td class="text-secondary-700 dark:text-dark-secondary-100 px-4 py-3">{{ position.quantity }}</td>
                <td class="text-secondary-700 dark:text-dark-secondary-100 px-4 py-3">{{ formatPrice(position.averageCost, position.currency) }}</td>
                <td class="text-secondary-700 dark:text-dark-secondary-100 px-4 py-3">{{ formatPrice(position.marketPrice, position.currency) }}</td>
                <td class="text-secondary-700 dark:text-dark-secondary-100 px-4 py-3">{{ formatMoneyValue(position.marketValue) }}</td>
                <td [class.text-success-600]="position.unrealizedProfitLossPercent >= 0" [class.text-danger-600]="position.unrealizedProfitLossPercent < 0" class="px-4 py-3 font-semibold">
                  {{ formatPercent(position.unrealizedProfitLossPercent) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1">
                    <p-button [text]="true" label="Buy" severity="secondary" size="small" />
                    <p-button [text]="true" label="Sell" severity="secondary" size="small" />
                    <p-button [text]="true" (onClick)="editPosition.emit(position.id)" icon="pi pi-pencil" severity="secondary" size="small" ariaLabel="Edit position" />
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td class="px-4 py-12 text-center" colspan="9">
                  <div class="flex flex-col items-center gap-2">
                    <i class="pi pi-chart-line text-secondary-300 dark:text-dark-secondary-500 text-3xl"></i>
                    <p class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">No positions in this portfolio</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class StockPositionsTableComponent {
  readonly positions = input.required<IStockPosition[]>();
  readonly chartPositionIds = input<string[]>([]);

  readonly addPosition = output<void>();
  readonly chartPositionToggled = output<string>();
  readonly editPosition = output<string>();

  readonly formatMoneyValue = formatMoney;

  onChartToggle(id: string): void {
    this.chartPositionToggled.emit(id);
  }

  isCharted(id: string): boolean {
    return this.chartPositionIds().includes(id);
  }

  formatPrice(value: number, currency: IStockPosition['currency']): string {
    return new Intl.NumberFormat(CurrencyLocale[currency], {
      style: 'currency',
      currency,
      maximumFractionDigits: 6,
    }).format(value);
  }

  formatPercent(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
