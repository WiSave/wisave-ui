import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { ExpenseCategoryId, IBudget, ICategoryBudget, ICategorySpendingSummary, IExpenseCategory, IExpenseMonthlyStats, IStoreError } from '@wisave/shared/model';

export const budgetPageEvents = eventGroup({
  source: 'Budget Page',
  events: {
    opened: type<void>(),
    monthChanged: type<{ month: number; year: number }>(),
    setOverallLimit: type<{ limit: number }>(),
    addCategoryBudget: type<{ categoryId: ExpenseCategoryId; limit: number }>(),
    updateCategoryBudget: type<{ categoryId: ExpenseCategoryId; limit: number }>(),
    removeCategoryBudget: type<{ categoryId: ExpenseCategoryId }>(),
  },
});

export const budgetApiEvents = eventGroup({
  source: 'Budget API',
  events: {
    budgetLoadedSuccess: type<{ budget: IBudget }>(),
    budgetLoadedFailure: type<{ error: IStoreError }>(),
    summaryLoadedSuccess: type<{ summaries: ICategorySpendingSummary[] }>(),
    categoriesLoadedSuccess: type<{ categories: IExpenseCategory[] }>(),
    monthlyStatsLoadedSuccess: type<{ stats: IExpenseMonthlyStats[] }>(),
    limitUpdatedSuccess: type<{ budget: IBudget }>(),
    limitUpdatedFailure: type<{ error: IStoreError }>(),
    categoryBudgetUpdatedSuccess: type<{ categoryBudget: ICategoryBudget }>(),
    categoryBudgetRemovedSuccess: type<{ categoryId: ExpenseCategoryId }>(),
    budgetAutoCreated: type<{ budget: IBudget }>(),
    budgetNotFound: type<void>(),
    operationFailure: type<{ error: IStoreError }>(),
  },
});
