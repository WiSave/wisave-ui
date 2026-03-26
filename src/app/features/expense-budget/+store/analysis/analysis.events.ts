import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { IBudget, ICategoryMonthComparison, ICategorySpendingSummary, IExpenseMonthlyStats } from '@core/types/expense-budget.interface';
import type { IStoreError } from '@shared/types/error.types';

export const analysisPageEvents = eventGroup({
  source: 'Analysis Page',
  events: {
    comparisonRequested: type<{ month: number; year: number }>(),
    insightsPageOpened: type<void>(),
    rangeChanged: type<{ months: 3 | 6 | 12 }>(),
  },
});

export const analysisApiEvents = eventGroup({
  source: 'Analysis API',
  events: {
    comparisonLoadedSuccess: type<{ budget: IBudget | null; summaries: ICategorySpendingSummary[] }>(),
    comparisonLoadedFailure: type<{ error: IStoreError }>(),
    rangeDataLoadedSuccess: type<{
      comparison: ICategoryMonthComparison[];
      stats: IExpenseMonthlyStats[];
      summaries: Record<string, ICategorySpendingSummary[]>;
    }>(),
    rangeDataLoadedFailure: type<{ error: IStoreError }>(),
  },
});
