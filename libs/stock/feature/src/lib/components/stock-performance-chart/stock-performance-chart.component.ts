import { Component, computed, inject, input, output } from '@angular/core';

import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

import { getChartThemeColors } from '@wisave/platform/config';
import { formatMoney } from '@wisave/shared/model';
import { ThemeService } from '@wisave/shared/ui';
import { type IStockPosition, type StockChartScope } from '@wisave/stock/data-access';

const SERIES_COLORS = ['hsl(215, 28%, 24%)', 'hsl(198, 62%, 38%)', 'hsl(160, 48%, 36%)', 'hsl(38, 78%, 44%)'];

@Component({
  selector: 'app-stock-performance-chart',
  imports: [Button, ChartModule],
  template: `
    <section class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 flex min-h-0 flex-col rounded-lg border bg-white p-4">
      <header class="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Portfolio performance</h3>
          <p class="text-secondary-500 dark:text-dark-secondary-400 mt-1 text-xs">{{ subtitle() }}</p>
        </div>
        <div class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-900 inline-flex rounded-full border bg-white p-0.5">
          @for (option of scopeOptions; track option.value) {
            <button
              [class.bg-secondary-900]="scope() === option.value"
              [class.text-white]="scope() === option.value"
              [class.text-secondary-600]="scope() !== option.value"
              [class.dark:bg-dark-secondary-100]="scope() === option.value"
              [class.dark:text-dark-primary-950]="scope() === option.value"
              [class.dark:text-dark-secondary-300]="scope() !== option.value"
              (click)="scopeChanged.emit(option.value)"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              type="button">
              {{ option.label }}
            </button>
          }
        </div>
      </header>

      <div class="min-h-64 flex-1">
        <p-chart [data]="chartData()" [options]="chartOptions()" class="block h-full w-full" type="line" />
      </div>

      <footer class="mt-3 flex items-center justify-between gap-3">
        <div class="flex min-w-0 flex-wrap gap-2">
          @for (position of positions(); track position.id) {
            <span class="border-secondary-200 dark:border-dark-divider text-secondary-700 dark:text-dark-secondary-100 rounded-full border px-2.5 py-1 text-xs font-semibold">
              {{ position.symbol }}
            </span>
          } @empty {
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-xs">No selected positions</span>
          }
        </div>
        @if (scope() !== 'portfolio') {
          <p-button [text]="true" (onClick)="selectionCleared.emit()" label="Clear" icon="pi pi-times" severity="secondary" size="small" />
        }
      </footer>
    </section>
  `,
})
export class StockPerformanceChartComponent {
  readonly #theme = inject(ThemeService);

  readonly positions = input.required<IStockPosition[]>();
  readonly scope = input.required<StockChartScope>();

  readonly scopeChanged = output<StockChartScope>();
  readonly selectionCleared = output<void>();

  readonly scopeOptions: { label: string; value: StockChartScope }[] = [
    { label: 'Portfolio', value: 'portfolio' },
    { label: 'Selected positions', value: 'selected' },
    { label: 'Compare', value: 'compare' },
  ];

  readonly subtitle = computed(() => {
    if (this.scope() === 'portfolio') {
      return 'Whole portfolio value trend';
    }

    const symbols = this.positions()
      .map((position) => position.symbol)
      .join(', ');
    return symbols ? `Charting ${symbols}` : 'Select table rows to focus the chart';
  });

  readonly chartData = computed(() => {
    const positions = this.positions();
    const labels = positions[0]?.chart.map((point) => this.#formatDate(point.date)) ?? [];

    if (this.scope() === 'compare') {
      return {
        labels,
        datasets: positions.map((position, index) => ({
          label: position.symbol,
          data: position.chart.map((point) => point.value),
          borderColor: SERIES_COLORS[index % SERIES_COLORS.length],
          backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: false,
        })),
      };
    }

    return {
      labels,
      datasets: [
        {
          label: this.scope() === 'portfolio' ? 'Portfolio' : 'Selected positions',
          data: labels.map((_, pointIndex) => positions.reduce((sum, position) => sum + (position.chart[pointIndex]?.value ?? 0), 0)),
          borderColor: SERIES_COLORS[0],
          backgroundColor: 'hsla(215, 28%, 24%, 0.16)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  });

  readonly chartOptions = computed(() => {
    const theme = getChartThemeColors(this.#theme.isDarkMode());
    const currency = this.positions()[0]?.reportingValue.currency;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: this.scope() === 'compare',
          labels: {
            color: theme.text,
            boxWidth: 10,
            font: {
              size: 11,
              weight: '600',
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
              const value = currency ? formatMoney({ amount: context.parsed.y, currency }) : context.parsed.y.toLocaleString();
              return `${context.dataset.label ?? 'Value'}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: theme.textMuted },
          grid: { color: theme.grid },
        },
        y: {
          ticks: { color: theme.textMuted },
          grid: { color: theme.grid },
        },
      },
    };
  });

  #formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(value));
  }
}
