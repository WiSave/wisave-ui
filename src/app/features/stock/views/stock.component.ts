import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-stock',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-full min-w-0 flex-1 flex-col gap-6 p-4">
      <header class="space-y-1">
        <p class="text-secondary-600 dark:text-dark-secondary-400 text-xs font-semibold uppercase tracking-[0.24em]">Stock</p>
      </header>

      <div class="space-y-3">
        <nav class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 inline-flex max-w-full flex-wrap gap-0.5 rounded-full border p-0.5">
          @for (section of sections; track section.route) {
            <a
              [routerLink]="section.route"
              class="text-secondary-600 dark:text-dark-secondary-300 hover:text-secondary-800 dark:hover:text-dark-secondary-100 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors [&.active]:bg-accent-500 [&.active]:text-dark-primary-950 [&.active]:shadow-sm"
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
export class StockComponent {
  readonly sections = [
    { route: '/stock/overview', label: 'Overview' },
    { route: '/stock/portfolio', label: 'Portfolio' },
    { route: '/stock/watchlists', label: 'Watchlists' },
    { route: '/stock/opportunities', label: 'Opportunities' },
    { route: '/stock/research', label: 'Research' },
  ];
}
