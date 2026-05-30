import { inject } from '@angular/core';
import { catchError, forkJoin, map, merge, of, switchMap } from 'rxjs';

import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { ExpenseBudgetApiService, ExpensesApiService } from '@wisave/expenses/data-access';
import type { ExpenseCategoryId, IBudget, ICategoryMonthComparison, ICategorySpendingSummary } from '@wisave/shared/model';
import { toStoreError } from '@wisave/shared/ui';

import { getMonthRange, getPreviousMonth } from '../../helpers/month.helper';
import { budgetPageEvents } from '../budget/budget.events';
import { analysisApiEvents, analysisPageEvents } from './analysis.events';

export function withAnalysisEventHandlers() {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _budgetApi: inject(ExpenseBudgetApiService),
      _expensesApi: inject(ExpensesApiService),
    })),
    withEventHandlers((props) => {
      const loadComparison$ = (month: number, year: number) => {
        const prev = getPreviousMonth(month, year);
        return forkJoin({
          budget: props._budgetApi.getBudget(prev.month, prev.year).pipe(catchError(() => of(null as IBudget | null))),
          summaries: props._budgetApi.getSpendingSummary(prev.month, prev.year).pipe(catchError(() => of([] as ICategorySpendingSummary[]))),
        }).pipe(map(({ budget, summaries }) => analysisApiEvents.comparisonLoadedSuccess({ budget, summaries })));
      };

      const loadRange$ = (months: number) => {
        const range = getMonthRange(months);
        const currentYear = new Date().getFullYear();

        const summaryRequests = range.map((r) =>
          props._budgetApi.getSpendingSummary(r.month, r.year).pipe(
            map((summaries) => ({ key: `${r.year}-${String(r.month).padStart(2, '0')}`, month: r.month, year: r.year, summaries })),
            catchError(() => of({ key: `${r.year}-${String(r.month).padStart(2, '0')}`, month: r.month, year: r.year, summaries: [] as ICategorySpendingSummary[] })),
          ),
        );

        return forkJoin({
          monthSummaries: forkJoin(summaryRequests),
          stats: props._expensesApi.getMonthlyStats(currentYear),
        }).pipe(
          map(({ monthSummaries, stats }) => {
            const summaries: Record<string, ICategorySpendingSummary[]> = {};
            for (const ms of monthSummaries) {
              summaries[ms.key] = ms.summaries;
            }

            const categoryIds = new Map<string, string>();
            for (const ms of monthSummaries) {
              for (const s of ms.summaries) {
                categoryIds.set(s.categoryId as string, s.categoryName);
              }
            }

            const comparison: ICategoryMonthComparison[] = [...categoryIds.entries()].map(([id, name]) => ({
              categoryId: id as ExpenseCategoryId,
              categoryName: name,
              months: monthSummaries.map((ms) => {
                const s = ms.summaries.find((cs) => (cs.categoryId as string) === id);
                return {
                  month: ms.month,
                  year: ms.year,
                  spent: s?.spent ?? 0,
                  limit: s?.limit ?? null,
                  delta: null,
                };
              }),
            }));

            return analysisApiEvents.rangeDataLoadedSuccess({ comparison, stats, summaries });
          }),
          catchError((err) => of(analysisApiEvents.rangeDataLoadedFailure({ error: toStoreError(err) }))),
        );
      };

      const now = new Date();
      const defaultMonth = now.getMonth() + 1;
      const defaultYear = now.getFullYear();

      return {
        loadComparisonOnOpen$: props._events.on(budgetPageEvents.opened).pipe(switchMap(() => loadComparison$(defaultMonth, defaultYear))),

        loadComparisonOnMonthChange$: props._events.on(budgetPageEvents.monthChanged).pipe(switchMap(({ payload }) => loadComparison$(payload.month, payload.year))),

        loadRangeData$: merge(
          props._events.on(analysisPageEvents.insightsPageOpened).pipe(map(() => 3 as const)),
          props._events.on(analysisPageEvents.rangeChanged).pipe(map(({ payload }) => payload.months)),
        ).pipe(switchMap((months) => loadRange$(months))),
      };
    }),
  );
}
