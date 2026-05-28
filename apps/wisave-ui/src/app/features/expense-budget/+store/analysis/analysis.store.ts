import { withDevtools, withGlitchTracking, withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { on } from '@ngrx/signals/events';

import type { ExpenseCategoryId } from '@wisave/shared/model';

import { withAnalysisEventHandlers } from './analysis.event-handlers';
import { analysisApiEvents, analysisPageEvents } from './analysis.events';
import { initialAnalysisState } from './analysis.state';

export const BudgetAnalysisStore = signalStore(
  { providedIn: 'root' },
  withDevtools('BudgetAnalysis', withGlitchTracking()),
  withState(initialAnalysisState),
  withTrackedReducer(
    on(analysisPageEvents.comparisonRequested, () => ({ isLoading: true, error: null })),
    on(analysisPageEvents.insightsPageOpened, () => ({ isLoading: true, error: null })),
    on(analysisPageEvents.rangeChanged, ({ payload }) => ({
      isLoading: true,
      error: null,
      selectedRange: payload.months,
    })),
    on(analysisApiEvents.comparisonLoadedSuccess, ({ payload }) => ({
      previousBudget: payload.budget,
      previousSummaries: payload.summaries,
      isLoading: false,
    })),
    on(analysisApiEvents.comparisonLoadedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
    on(analysisApiEvents.rangeDataLoadedSuccess, ({ payload }) => ({
      categoryComparison: payload.comparison,
      rangeMonthlyStats: payload.stats,
      rangeSummaries: payload.summaries,
      isLoading: false,
    })),
    on(analysisApiEvents.rangeDataLoadedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
  ),
  withComputed((store) => ({
    hasPreviousData: computed(() => store.previousBudget() !== null),

    previousTotalSpent: computed(() => {
      const summaries = store.previousSummaries();
      return summaries.reduce((sum, s) => sum + s.spent, 0);
    }),

    categoryDeltas: computed(() => {
      const prevSummaries = store.previousSummaries();
      const map = new Map<ExpenseCategoryId, { prevSpent: number }>();
      for (const s of prevSummaries) {
        map.set(s.categoryId, { prevSpent: s.spent });
      }
      return map;
    }),

    previousMonthLabel: computed(() => {
      const prev = store.previousBudget();
      if (!prev) return '';
      const date = new Date(prev.year, prev.month - 1, 1);
      return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    }),
  })),
  withAnalysisEventHandlers(),
);
