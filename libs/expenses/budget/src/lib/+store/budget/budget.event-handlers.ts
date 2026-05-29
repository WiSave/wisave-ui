import { type Signal, inject } from '@angular/core';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, exhaustMap, map, merge, of, switchMap, tap } from 'rxjs';

import type { IBudget } from '@wisave/shared/model';
import { ExpenseBudgetApiService } from '@wisave/expenses/data-access';
import { ExpensesApiService } from '@wisave/expenses/data-access';
import { toStoreError } from '@wisave/shared/ui';

import { budgetApiEvents, budgetPageEvents } from './budget.events';

export interface BudgetStoreSlice {
  currentBudget: Signal<IBudget | null>;
  selectedMonth: Signal<number>;
  selectedYear: Signal<number>;
}

export function withBudgetEventHandlers(store: BudgetStoreSlice) {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _budgetApi: inject(ExpenseBudgetApiService),
      _expensesApi: inject(ExpensesApiService),
    })),
    withEventHandlers((props) => {
      const loadBudget$ = (month: number, year: number) =>
        props._budgetApi.getBudget(month, year).pipe(
          map((budget) => budgetApiEvents.budgetLoadedSuccess({ budget })),
          catchError((err) => of(budgetApiEvents.budgetLoadedFailure({ error: toStoreError(err) }))),
        );

      const loadSummary$ = (month: number, year: number) =>
        props._budgetApi.getSpendingSummary(month, year).pipe(
          map((summaries) => budgetApiEvents.summaryLoadedSuccess({ summaries })),
          catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
        );

      const loadCategories$ = () =>
        props._expensesApi.getCategories().pipe(
          map((categories) => budgetApiEvents.categoriesLoadedSuccess({ categories })),
          catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
        );

      const loadMonthlyStats$ = (year: number) =>
        props._expensesApi.getMonthlyStats(year).pipe(
          map((stats) => budgetApiEvents.monthlyStatsLoadedSuccess({ stats })),
          catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
        );

      return {
        loadOnOpen$: props._events.on(budgetPageEvents.opened).pipe(
          exhaustMap(() => {
            const month = store.selectedMonth();
            const year = store.selectedYear();

            return merge(
              loadBudget$(month, year),
              loadSummary$(month, year),
              loadCategories$(),
              loadMonthlyStats$(year),
            );
          }),
        ),

        loadOnMonthChange$: props._events.on(budgetPageEvents.monthChanged).pipe(
          switchMap(({ payload }) =>
            merge(
              loadBudget$(payload.month, payload.year),
              loadSummary$(payload.month, payload.year),
              loadMonthlyStats$(payload.year),
            ),
          ),
        ),

        setOverallLimit$: props._events.on(budgetPageEvents.setOverallLimit).pipe(
          exhaustMap(({ payload }) => {
            const budget = store.currentBudget();
            if (!budget) {
              return of(budgetApiEvents.operationFailure({ error: { message: 'No budget loaded', category: 'validation' } }));
            }
            return props._budgetApi.setOverallLimit(budget.id, payload.limit).pipe(
              map(() => {
                const optimistic: IBudget = { ...budget, totalLimit: payload.limit };
                return budgetApiEvents.limitUpdatedSuccess({ budget: optimistic });
              }),
              catchError((err) => of(budgetApiEvents.limitUpdatedFailure({ error: toStoreError(err) }))),
            );
          }),
        ),

        addCategoryBudget$: props._events.on(budgetPageEvents.addCategoryBudget).pipe(
          exhaustMap(({ payload }) => {
            const budgetId = store.currentBudget()?.id;
            if (!budgetId) {
              return of(budgetApiEvents.operationFailure({ error: { message: 'No budget loaded', category: 'validation' } }));
            }
            return props._budgetApi.setCategoryBudget(budgetId, payload.categoryId, payload.limit).pipe(
              map(() => budgetApiEvents.categoryBudgetUpdatedSuccess({ categoryBudget: { categoryId: payload.categoryId, limit: payload.limit, spent: 0 } })),
              catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
            );
          }),
        ),

        updateCategoryBudget$: props._events.on(budgetPageEvents.updateCategoryBudget).pipe(
          exhaustMap(({ payload }) => {
            const budgetId = store.currentBudget()?.id;
            if (!budgetId) {
              return of(budgetApiEvents.operationFailure({ error: { message: 'No budget loaded', category: 'validation' } }));
            }
            return props._budgetApi.setCategoryBudget(budgetId, payload.categoryId, payload.limit).pipe(
              map(() => budgetApiEvents.categoryBudgetUpdatedSuccess({ categoryBudget: { categoryId: payload.categoryId, limit: payload.limit, spent: 0 } })),
              catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
            );
          }),
        ),

        removeCategoryBudget$: props._events.on(budgetPageEvents.removeCategoryBudget).pipe(
          exhaustMap(({ payload }) => {
            const budgetId = store.currentBudget()?.id;
            if (!budgetId) {
              return of(budgetApiEvents.operationFailure({ error: { message: 'No budget loaded', category: 'validation' } }));
            }
            return props._budgetApi.removeCategoryBudget(budgetId, payload.categoryId).pipe(
              map(() => budgetApiEvents.categoryBudgetRemovedSuccess({ categoryId: payload.categoryId })),
              catchError((err) => of(budgetApiEvents.operationFailure({ error: toStoreError(err) }))),
            );
          }),
        ),

        logErrors$: props._events
          .on(budgetApiEvents.budgetLoadedFailure, budgetApiEvents.limitUpdatedFailure, budgetApiEvents.operationFailure)
          .pipe(tap(({ payload }) => console.error('[Budget API Error]', payload.error.category, payload.error.message))),
      };
    }),
  );
}
