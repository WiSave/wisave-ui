import { inject } from '@angular/core';
import { catchError, exhaustMap, filter, map, of, switchMap } from 'rxjs';

import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { StockPortfolioService } from '@wisave/stock/data-access';

import { stockPortfolioApiEvents, stockPortfolioPageEvents } from './stock-portfolio.events';

export function withStockPortfolioEventHandlers() {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _api: inject(StockPortfolioService),
    })),
    withEventHandlers((store) => ({
      loadWorkspace$: store._events.on(stockPortfolioPageEvents.opened).pipe(
        exhaustMap(() =>
          store._api.getWorkspace().pipe(
            map(({ portfolios, positions }) => stockPortfolioApiEvents.loadedSuccess({ portfolios, positions })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.loadedFailure({ message: err instanceof Error ? err.message : 'Unable to load stock portfolio.' }))),
          ),
        ),
      ),

      loadInitialPositions$: store._events.on(stockPortfolioApiEvents.loadedSuccess).pipe(
        map(({ payload }) => payload.portfolios[0]?.id),
        filter((portfolioId): portfolioId is string => Boolean(portfolioId)),
        switchMap((portfolioId) =>
          store._api.getPositions(portfolioId).pipe(
            map((positions) => stockPortfolioApiEvents.positionsLoaded({ portfolioId, positions })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.loadedFailure({ message: err instanceof Error ? err.message : 'Unable to load stock positions.' }))),
          ),
        ),
      ),

      loadSelectedPortfolioPositions$: store._events.on(stockPortfolioPageEvents.portfolioSelected).pipe(
        switchMap(({ payload }) =>
          store._api.getPositions(payload.id).pipe(
            map((positions) => stockPortfolioApiEvents.positionsLoaded({ portfolioId: payload.id, positions })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.loadedFailure({ message: err instanceof Error ? err.message : 'Unable to load stock positions.' }))),
          ),
        ),
      ),

      addPortfolio$: store._events.on(stockPortfolioPageEvents.addPortfolio).pipe(
        exhaustMap(({ payload }) =>
          store._api.addPortfolio(payload.portfolio).pipe(
            map((portfolio) => stockPortfolioApiEvents.portfolioSaved({ portfolio })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.commandFailure({ message: err instanceof Error ? err.message : 'Unable to save portfolio.' }))),
          ),
        ),
      ),

      updatePortfolio$: store._events.on(stockPortfolioPageEvents.updatePortfolio).pipe(
        exhaustMap(({ payload }) =>
          store._api.updatePortfolio(payload.id, payload.portfolio).pipe(
            map((portfolio) => stockPortfolioApiEvents.portfolioSaved({ portfolio })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.commandFailure({ message: err instanceof Error ? err.message : 'Unable to save portfolio.' }))),
          ),
        ),
      ),

      deletePortfolio$: store._events.on(stockPortfolioPageEvents.deletePortfolio).pipe(
        exhaustMap(({ payload }) =>
          store._api.deletePortfolio(payload.id).pipe(
            map(() => stockPortfolioApiEvents.portfolioDeleted({ id: payload.id })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.commandFailure({ message: err instanceof Error ? err.message : 'Unable to delete portfolio.' }))),
          ),
        ),
      ),

      addPosition$: store._events.on(stockPortfolioPageEvents.addPosition).pipe(
        exhaustMap(({ payload }) =>
          store._api.addPosition(payload.position).pipe(
            map((accepted) => stockPortfolioApiEvents.positionOpenAccepted(accepted)),
            catchError((err: unknown) => of(stockPortfolioApiEvents.commandFailure({ message: err instanceof Error ? err.message : 'Unable to save position.' }))),
          ),
        ),
      ),

      updatePosition$: store._events.on(stockPortfolioPageEvents.updatePosition).pipe(
        exhaustMap(({ payload }) =>
          store._api.updatePosition(payload.id, payload.position).pipe(
            map((position) => stockPortfolioApiEvents.positionSaved({ position })),
            catchError((err: unknown) => of(stockPortfolioApiEvents.commandFailure({ message: err instanceof Error ? err.message : 'Unable to save position.' }))),
          ),
        ),
      ),
    })),
  );
}
