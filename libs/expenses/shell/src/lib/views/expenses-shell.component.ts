import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-expenses-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-full min-w-0 flex-1 flex-col gap-6 p-4">
      <header class="space-y-1">
        <p class="text-secondary-600 dark:text-dark-secondary-400 text-xs font-semibold tracking-[0.24em] uppercase">Expenses</p>
      </header>

      <div class="space-y-3">
        <nav class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 inline-flex max-w-full flex-wrap gap-0.5 rounded-full border bg-white p-0.5">
          @for (section of sections; track section.route) {
            <a
              [routerLink]="section.route"
              class="text-secondary-600 dark:text-dark-secondary-400 hover:text-secondary-800 dark:hover:text-dark-secondary-100 [&.active]:bg-secondary-200 [&.active]:text-secondary-900 dark:[&.active]:bg-dark-primary-700 dark:[&.active]:text-dark-secondary-50 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              routerLinkActive="active">
              {{ section.label }}
            </a>
          }
        </nav>

        <div class="border-secondary-200/70 dark:border-dark-divider h-px w-full border-b"></div>
      </div>

      <router-outlet />
    </div>
  `,
})
export class ExpensesShellComponent {
  readonly sections = [
    { route: '/expenses/list', label: 'Expenses' },
    { route: '/expenses/budget', label: 'Budget' },
    { route: '/expenses/accounts', label: 'Funding & Cards' },
    { route: '/expenses/insights', label: 'Insights' },
  ];
}
