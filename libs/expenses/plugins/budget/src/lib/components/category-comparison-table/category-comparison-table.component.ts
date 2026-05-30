import { Component, computed, input, output } from '@angular/core';

import type { ExpenseCategoryId, ICategoryMonthComparison } from '@wisave/shared/model';

import { formatShortMonth } from '../../helpers/month.helper';

@Component({
  selector: 'app-category-comparison-table',
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="border-secondary-200 dark:border-dark-divider border-b">
            <th class="text-secondary-600 dark:text-dark-secondary-400 px-3 py-2 text-left font-semibold">Category</th>
            @for (col of monthColumns(); track col) {
              <th class="text-secondary-600 dark:text-dark-secondary-400 px-3 py-2 text-right font-semibold">{{ col }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.categoryId) {
            <tr
              (click)="categoryClicked.emit(row.categoryId)"
              class="border-secondary-100 dark:border-dark-divider hover:bg-secondary-100 dark:hover:bg-dark-primary-800 cursor-pointer border-b transition-colors">
              <td class="text-secondary-800 dark:text-dark-secondary-100 px-3 py-2 font-medium">{{ row.categoryName }}</td>
              @for (m of row.months; track m.month) {
                <td [class]="m.limit !== null && m.spent > m.limit ? 'text-rose-500' : 'text-secondary-700 dark:text-dark-secondary-200'" class="px-3 py-2 text-right tabular-nums">
                  {{ m.spent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
                  @if (m.limit !== null) {
                    <span class="text-secondary-400 dark:text-dark-secondary-500"> / {{ m.limit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }} </span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CategoryComparisonTableComponent {
  readonly rows = input.required<ICategoryMonthComparison[]>();
  readonly categoryClicked = output<ExpenseCategoryId>();

  readonly monthColumns = computed(() => {
    const rows = this.rows();
    if (rows.length === 0) return [];
    return rows[0].months.map((m) => formatShortMonth(m.month));
  });
}
