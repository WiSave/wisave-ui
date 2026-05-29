import { Component, computed, inject, signal, type OnInit } from '@angular/core';

import { ChartModule } from 'primeng/chart';

import { BudgetAnalysisStore } from '../+store/analysis';
import { ExpenseBudgetStore } from '../+store/budget/budget.store';
import { CategoryComparisonTableComponent } from '../components/category-comparison-table';
import { InsightCardComponent } from '../components/insight-card';
import { computeAllInsights } from '../helpers/insights.helper';
import { injectDispatch } from '@ngrx/signals/events';

import { getChartThemeColors } from '@wisave/platform/config';
import type { ExpenseCategoryId } from '@wisave/shared/model';
import { ThemeService } from '@wisave/shared/ui';
import { ChartCardComponent } from '@wisave/shared/ui';

import { analysisPageEvents } from '../+store/analysis/analysis.events';

@Component({
  selector: 'app-insights',
  imports: [ChartModule, InsightCardComponent, CategoryComparisonTableComponent, ChartCardComponent],
  template: `
    <div class="flex min-w-0 flex-1 flex-col gap-6">
      <header class="flex items-center justify-between">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-bold">Insights</h2>
        <div class="bg-secondary-100 dark:bg-dark-primary-700 border-secondary-200 dark:border-dark-divider inline-flex gap-0.5 rounded-full border p-0.5">
          @for (opt of rangeOptions; track opt) {
            <button
              [class]="selectedRange() === opt ? 'bg-secondary-200 dark:bg-dark-primary-600 text-secondary-900 dark:text-dark-secondary-50' : 'text-secondary-500 dark:text-dark-secondary-400'"
              (click)="onRangeChange(opt)"
              class="rounded-full px-3 py-1 text-xs font-semibold transition-colors">
              {{ opt }}m
            </button>
          }
        </div>
      </header>

      @if (analysisStore.isLoading()) {
        <div class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-secondary-400 text-2xl"></i>
        </div>
      } @else {
        @if (allInsights().length > 0) {
          <div class="flex flex-wrap gap-2">
            @for (insight of allInsights(); track insight.message) {
              <app-insight-card [insight]="insight" class="flex-1 basis-56" />
            }
          </div>
        }

        @if (analysisStore.categoryComparison().length > 0) {
          <app-chart-card title="Category breakdown">
            <app-category-comparison-table
              [rows]="analysisStore.categoryComparison()"
              (categoryClicked)="onCategorySelected($event)" />
          </app-chart-card>
        }

        @defer (on viewport) {
          <app-chart-card [title]="trendChartTitle()">
            <div class="flex h-56 w-full xl:h-72">
              <p-chart [data]="trendChartData()" [options]="trendChartOptions()" class="w-full" type="bar" />
            </div>
          </app-chart-card>
        } @placeholder {
          <div class="bg-white dark:bg-dark-primary-850 border border-secondary-200 dark:border-dark-divider rounded-2xl shadow-xs h-72 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-secondary-400 text-xl"></i>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class InsightsComponent implements OnInit {
  readonly #budgetStore = inject(ExpenseBudgetStore);
  readonly #theme = inject(ThemeService);
  readonly #dispatch = injectDispatch(analysisPageEvents);
  readonly analysisStore = inject(BudgetAnalysisStore);

  readonly rangeOptions: (3 | 6 | 12)[] = [3, 6, 12];
  readonly selectedRange = computed(() => this.analysisStore.selectedRange());
  readonly selectedCategory = signal<ExpenseCategoryId | null>(null);

  readonly allInsights = computed(() => {
    const summaries = this.#budgetStore['spendingSummaries']();
    const currentTotal = summaries.reduce((sum, s) => sum + s.spent, 0);
    const prevTotal = this.analysisStore.previousTotalSpent();
    const prevBudget = this.analysisStore.previousBudget();
    const monthlyStats = this.analysisStore.rangeMonthlyStats();
    if (!prevBudget) return [];
    return computeAllInsights(summaries, currentTotal, prevTotal, prevBudget.month, monthlyStats);
  });

  readonly trendChartTitle = computed(() => {
    const cat = this.selectedCategory();
    return cat ? 'Category trend' : 'Spending trend';
  });

  readonly trendChartData = computed(() => {
    const stats = this.analysisStore.rangeMonthlyStats();
    const colors = getChartThemeColors(this.#theme.isDarkMode());
    const catId = this.selectedCategory();
    const summariesMap = this.analysisStore.rangeSummaries();

    const data = catId
      ? stats.map((s) => {
          const key = `${s.year}-${String(s.month).padStart(2, '0')}`;
          const summaries = summariesMap[key] ?? [];
          const match = summaries.find((cs) => cs.categoryId === catId);
          return match?.spent ?? 0;
        })
      : stats.map((s) => s.total);

    return {
      labels: stats.map((s) => {
        const date = new Date(s.year, s.month - 1, 1);
        return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
      }),
      datasets: [
        {
          label: catId ? 'Category Spending' : 'Spending',
          backgroundColor: colors.barFill,
          borderColor: colors.barBorder,
          borderRadius: 6,
          data,
        },
      ],
    };
  });

  readonly trendChartOptions = computed(() => {
    const colors = getChartThemeColors(this.#theme.isDarkMode());

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: colors.textMuted }, grid: { color: colors.grid } },
        y: { ticks: { color: colors.textMuted }, grid: { color: colors.grid } },
      },
    };
  });

  ngOnInit(): void {
    this.#dispatch.insightsPageOpened();
  }

  onRangeChange(months: 3 | 6 | 12): void {
    this.#dispatch.rangeChanged({ months });
  }

  onCategorySelected(categoryId: ExpenseCategoryId): void {
    this.selectedCategory.set(categoryId);
  }
}
