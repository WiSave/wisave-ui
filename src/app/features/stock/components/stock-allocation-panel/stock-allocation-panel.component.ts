import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { type IStockAllocationItem } from '../../types/stock-portfolio.types';

const COLORS = ['hsl(215, 28%, 24%)', 'hsl(198, 62%, 38%)', 'hsl(160, 48%, 36%)', 'hsl(38, 78%, 44%)', 'hsl(345, 52%, 48%)'];

@Component({
  selector: 'app-stock-allocation-panel',
  imports: [CommonModule],
  template: `
    <section class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 flex min-h-0 flex-col rounded-lg border bg-white p-4">
      <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Allocation</h3>
      <div class="flex flex-1 flex-col justify-center gap-5">
        <div [style.background]="donutBackground()" class="mx-auto h-36 w-36 rounded-full">
          <div class="grid h-full place-items-center">
            <div class="dark:bg-dark-primary-850 h-20 w-20 rounded-full bg-white"></div>
          </div>
        </div>

        <div class="grid gap-2">
          @for (item of items(); track item.label; let i = $index) {
            <div class="flex items-center justify-between gap-3 text-sm">
              <div class="flex min-w-0 items-center gap-2">
                <span [style.background]="colorAt(i)" class="h-2.5 w-2.5 shrink-0 rounded-full"></span>
                <span class="text-secondary-700 dark:text-dark-secondary-100 truncate">{{ item.label }}</span>
              </div>
              <span class="text-secondary-950 dark:text-dark-secondary-50 shrink-0 font-semibold">{{ item.percent | number: '1.0-0' }}%</span>
            </div>
          } @empty {
            <p class="text-secondary-500 dark:text-dark-secondary-400 text-sm">No allocation data.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class StockAllocationPanelComponent {
  readonly items = input.required<IStockAllocationItem[]>();

  readonly donutBackground = computed(() => {
    const items = this.items();
    if (items.length === 0) {
      return 'conic-gradient(hsl(215, 14%, 82%) 0 100%)';
    }

    let cursor = 0;
    const stops = items.map((item, index) => {
      const start = cursor;
      cursor += item.percent;
      return `${this.colorAt(index)} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  });

  colorAt(index: number): string {
    return COLORS[index % COLORS.length];
  }
}
