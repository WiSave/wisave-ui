import { withDevtools, withGlitchTracking, withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStore, withFeature, withState } from '@ngrx/signals';
import { on } from '@ngrx/signals/events';

import type { ICategoryBudget } from '@wisave/shared/model';

import { withBudgetEventHandlers } from './budget.event-handlers';
import { withBudgetSignalR } from './with-budget-signalr.feature';
import { budgetApiEvents, budgetPageEvents } from './budget.events';
import { type BudgetState, initialState } from './budget.state';

export const ExpenseBudgetStore = signalStore(
  { providedIn: 'root' },
  withDevtools('ExpenseBudget', withGlitchTracking()),
  withState(initialState),
  withTrackedReducer(
    on(budgetPageEvents.opened, () => ({ isLoading: true, error: null })),
    on(budgetPageEvents.monthChanged, ({ payload }) => ({
      isLoading: true,
      error: null,
      selectedMonth: payload.month,
      selectedYear: payload.year,
    })),
    on(budgetApiEvents.budgetLoadedSuccess, ({ payload }) => ({
      currentBudget: payload.budget,
      isLoading: false,
      error: null,
    })),
    on(budgetApiEvents.budgetLoadedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
    on(budgetApiEvents.summaryLoadedSuccess, ({ payload }) => ({
      spendingSummaries: payload.summaries,
    })),
    on(budgetApiEvents.categoriesLoadedSuccess, ({ payload }) => ({
      availableCategories: payload.categories,
    })),
    on(budgetApiEvents.monthlyStatsLoadedSuccess, ({ payload }) => ({
      monthlyStats: payload.stats,
    })),
    on(budgetApiEvents.limitUpdatedSuccess, ({ payload }) => ({
      currentBudget: payload.budget,
      isLoading: false,
      error: null,
    })),
    on(budgetApiEvents.limitUpdatedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
    on(budgetApiEvents.categoryBudgetUpdatedSuccess, ({ payload }, state) => {
      const budgetState = state as BudgetState;
      if (!budgetState.currentBudget) return {};

      const existing = budgetState.currentBudget.categoryBudgets.findIndex(
        (cb: ICategoryBudget) => cb.categoryId === payload.categoryBudget.categoryId,
      );
      const categoryBudgets =
        existing >= 0
          ? budgetState.currentBudget.categoryBudgets.map((cb: ICategoryBudget, i: number) => (i === existing ? payload.categoryBudget : cb))
          : [...budgetState.currentBudget.categoryBudgets, payload.categoryBudget];

      return {
        currentBudget: { ...budgetState.currentBudget, categoryBudgets },
        isLoading: false,
        error: null,
      };
    }),
    on(budgetApiEvents.categoryBudgetRemovedSuccess, ({ payload }, state) => {
      const budgetState = state as BudgetState;
      if (!budgetState.currentBudget) return {};

      return {
        currentBudget: {
          ...budgetState.currentBudget,
          categoryBudgets: budgetState.currentBudget.categoryBudgets.filter(
            (cb: ICategoryBudget) => cb.categoryId !== payload.categoryId,
          ),
        },
        isLoading: false,
        error: null,
      };
    }),
    on(budgetApiEvents.budgetAutoCreated, ({ payload }) => ({
      currentBudget: payload.budget,
      isLoading: false,
      error: null,
    })),
    on(budgetApiEvents.budgetNotFound, () => ({
      currentBudget: null,
      isLoading: false,
      error: null,
    })),
    on(budgetApiEvents.operationFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
  ),
  withFeature((store) => withBudgetEventHandlers(store)),
  withBudgetSignalR(),
);
