import { inject, type Signal } from '@angular/core';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { IncomesApiService, type IncomeStatsScope } from '@wisave/incomes/data-access';
import { toStoreError } from '@wisave/shared/ui';

import { incomesApiEvents, incomesPageEvents } from '../incomes/incomes.events';

export interface StatsStoreSlice {
  statsScope: Signal<IncomeStatsScope>;
  monthlyStatsYear: Signal<number>;
}

export function withIncomesStatsEventHandlers(store: StatsStoreSlice) {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _api: inject(IncomesApiService),
    })),
    withEventHandlers((props) => {
      const loadStats$ = (scope: IncomeStatsScope) =>
        props._api.getIncomeStats(scope === 'all').pipe(
          map((stats) => incomesApiEvents.statsLoadedSuccess({ stats })),
          catchError((err) => of(incomesApiEvents.statsLoadedFailure({ error: toStoreError(err) }))),
        );

      const loadMonthlyStats$ = (year: number) => {
        return props._api.getIncomeMonthlyStats(year).pipe(
          map((stats) => incomesApiEvents.monthlyStatsLoadedSuccess({ stats })),
          catchError((err) => of(incomesApiEvents.monthlyStatsLoadedFailure({ error: toStoreError(err) }))),
        );
      };

      return {
        loadStats$: props._events.on(incomesPageEvents.opened).pipe(exhaustMap(() => loadStats$(store.statsScope()))),

        loadMonthlyStats$: props._events.on(incomesPageEvents.opened).pipe(exhaustMap(() => loadMonthlyStats$(store.monthlyStatsYear()))),

        statsScopeChanged$: props._events.on(incomesPageEvents.statsScopeChanged).pipe(switchMap(({ payload }) => loadStats$(payload.scope))),

        monthlyStatsYearChanged$: props._events.on(incomesPageEvents.monthlyStatsYearChanged).pipe(switchMap(() => loadMonthlyStats$(store.monthlyStatsYear()))),

        logErrors$: props._events
          .on(incomesApiEvents.statsLoadedFailure, incomesApiEvents.monthlyStatsLoadedFailure)
          .pipe(tap(({ payload }) => console.error('[Income Stats API Error]', payload.error.category, payload.error.message))),
      };
    }),
  );
}
