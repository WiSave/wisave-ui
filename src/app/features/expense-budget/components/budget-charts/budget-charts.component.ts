import { Component, computed, inject, input } from '@angular/core';

import { ChartModule } from 'primeng/chart';

import { CATEGORY_CHART_PALETTE, CHART_TOOLTIP_STYLE, getChartThemeColors } from '@core/config/chart-colors.config';
import { ThemeService } from '@core/services/theme/theme.service';
import type { ICategorySpendingSummary, IDelta, IExpenseMonthlyStats } from '@core/types/expense-budget.interface';
import { ChartCardComponent } from '@shared/components/chart-card';

@Component({
  selector: 'app-budget-charts',
  standalone: true,
  imports: [ChartModule, ChartCardComponent],
  template: `
    <div class="flex flex-col gap-6">
      <app-chart-card title="Spending by category">
        <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div class="h-44 w-44 shrink-0">
            <p-chart [data]="pieChartData()" [options]="pieChartOptions()" [plugins]="doughnutPlugins" class="block h-full w-full" type="doughnut" />
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-2.5">
            @for (item of breakdownItems(); track item.name) {
              <div class="flex items-center gap-3">
                <span [style.background-color]="item.color" class="h-2.5 w-2.5 shrink-0 rounded-sm"></span>
                <span class="text-secondary-600 dark:text-dark-secondary-300 min-w-0 flex-1 truncate text-sm">{{ item.name }}</span>
                <span class="text-secondary-900 dark:text-dark-secondary-50 shrink-0 text-sm font-medium tabular-nums">
                  {{ item.formattedAmount }}
                </span>
                <span class="text-secondary-400 dark:text-dark-secondary-500 w-10 shrink-0 text-right text-xs tabular-nums"> {{ item.percent }}% </span>
                @if (item.delta) {
                  <span
                    [class]="item.delta.direction === 'down' ? 'text-emerald-700' : item.delta.direction === 'up' ? 'text-rose-500' : 'text-secondary-400'"
                    class="w-12 shrink-0 text-right text-[10px] tabular-nums">
                    {{ item.delta.direction === 'down' ? '↓' : item.delta.direction === 'up' ? '↑' : '–' }}{{ item.delta.percent }}%
                  </span>
                }
              </div>
              <div class="bg-secondary-100 dark:bg-dark-primary-700 ml-5.5 h-px"></div>
            }
          </div>
        </div>
      </app-chart-card>

      <app-chart-card title="Monthly spending trend">
        <div class="flex h-56 w-full xl:h-72 2xl:h-80">
          <p-chart [data]="barChartData()" [options]="barChartOptions()" class="w-full" type="bar" />
        </div>
      </app-chart-card>
    </div>
  `,
})
export class BudgetChartsComponent {
  readonly #theme = inject(ThemeService);

  readonly spendingSummaries = input.required<ICategorySpendingSummary[]>();
  readonly monthlyStats = input.required<IExpenseMonthlyStats[]>();
  readonly categoryDeltas = input<Map<string, IDelta>>(new Map());

  readonly breakdownItems = computed(() => {
    const summaries = this.spendingSummaries().filter((s) => s.spent > 0);
    const colors = this.#getCategoryColors(summaries.length);
    const total = summaries.reduce((sum, s) => sum + s.spent, 0);
    const deltas = this.categoryDeltas();

    return summaries.map((s, i) => ({
      name: s.categoryName,
      color: colors[i],
      formattedAmount: s.spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      percent: total > 0 ? ((s.spent / total) * 100).toFixed(1) : '0',
      delta: deltas.get(s.categoryId as string) ?? null,
    }));
  });

  readonly doughnutPlugins = [
    {
      id: 'centerTotal',
      beforeDraw: (chart: { ctx: CanvasRenderingContext2D; chartArea: { left: number; right: number; top: number; bottom: number }; data: { datasets: { data: number[] }[] } }) => {
        const { ctx, chartArea, data } = chart;
        const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;
        const colors = getChartThemeColors(this.#theme.isDarkMode());

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '600 18px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = colors.text;
        ctx.fillText(total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), cx, cy - 6);

        ctx.font = '400 11px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = colors.textMuted;
        ctx.fillText('total spent', cx, cy + 14);

        ctx.restore();
      },
    },
  ];

  readonly pieChartData = computed(() => {
    const summaries = this.spendingSummaries().filter((s) => s.spent > 0);
    const colors = this.#getCategoryColors(summaries.length);

    return {
      labels: summaries.map((s) => s.categoryName),
      datasets: [
        {
          data: summaries.map((s) => s.spent),
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4,
          spacing: 2,
        },
      ],
    };
  });

  readonly pieChartOptions = computed(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      layout: {
        padding: 4,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          ...CHART_TOOLTIP_STYLE,
          callbacks: {
            label: (context: { parsed: number; dataset: { data: number[] } }) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percent = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
              const value = context.parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return `${value} (${percent}%)`;
            },
          },
        },
      },
    };
  });

  readonly barChartData = computed(() => {
    const stats = this.monthlyStats();
    const colors = getChartThemeColors(this.#theme.isDarkMode());

    return {
      labels: stats.map((s) => this.#formatMonthLabel(s.year, s.month)),
      datasets: [
        {
          label: 'Spending',
          backgroundColor: colors.barFill,
          borderColor: colors.barBorder,
          borderRadius: 6,
          data: stats.map((s) => s.total),
        },
      ],
    };
  });

  readonly barChartOptions = computed(() => {
    const colors = getChartThemeColors(this.#theme.isDarkMode());

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: { parsed: { y: number } }) => {
              const value = context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return `Spending: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: colors.textMuted },
          grid: { color: colors.grid },
        },
        y: {
          ticks: { color: colors.textMuted },
          grid: { color: colors.grid },
        },
      },
    };
  });

  #formatMonthLabel(year: number, month: number): string {
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  }

  #getCategoryColors(count: number): string[] {
    return CATEGORY_CHART_PALETTE.slice(0, count);
  }
}
