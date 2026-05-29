import { Component } from '@angular/core';

@Component({
  selector: 'app-stock-opportunities',
  template: `
    <section class="bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-800 rounded-2xl border p-6 shadow-sm">
      <div class="space-y-1">
        <p class="text-secondary-500 dark:text-dark-secondary-400 text-xs font-semibold tracking-[0.2em] uppercase">Opportunities</p>
        <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-xl font-semibold">Ranked ideas</h2>
      </div>
    </section>
  `,
})
export class StockOpportunitiesComponent {}
