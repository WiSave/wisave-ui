import { computed } from '@angular/core';

import { withDevtools, withGlitchTracking, withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { on } from '@ngrx/signals/events';

import { type IStockAllocationItem, type IStockPosition, type StockChartScope, type StockCommandStatus } from '../../types/stock-portfolio.types';
import { withStockPortfolioEventHandlers } from './stock-portfolio.event-handlers';
import { stockPortfolioApiEvents, stockPortfolioPageEvents } from './stock-portfolio.events';
import { initialState } from './stock-portfolio.state';

export const StockPortfolioStore = signalStore(
  { providedIn: 'root' },
  withDevtools('StockPortfolio', withGlitchTracking()),
  withState(initialState),
  withComputed(({ portfolios, positions, selectedPortfolioId, chartScope, chartPositionIds }) => {
    const selectedPortfolio = computed(() => portfolios().find((portfolio) => portfolio.id === selectedPortfolioId()) ?? portfolios()[0] ?? null);
    const selectedPortfolioPositions = computed(() => {
      const portfolio = selectedPortfolio();
      return portfolio ? positions().filter((position) => position.portfolioId === portfolio.id) : [];
    });

    const chartPositions = computed(() => {
      const visible = selectedPortfolioPositions();
      if (chartScope() === 'portfolio') {
        return visible;
      }

      const selectedIds = new Set(chartPositionIds());
      const selected = visible.filter((position) => selectedIds.has(position.id));
      return selected.length > 0 ? selected : visible;
    });

    const allocationItems = computed<IStockAllocationItem[]>(() => {
      const total = selectedPortfolioPositions().reduce((sum, position) => sum + position.reportingValue.amount, 0);
      const values = new Map<string, number>();

      for (const position of selectedPortfolioPositions()) {
        values.set(position.allocationGroup, (values.get(position.allocationGroup) ?? 0) + position.reportingValue.amount);
      }

      return [...values.entries()].map(([label, value]) => ({ label, value, percent: total > 0 ? (value / total) * 100 : 0 })).sort((a, b) => b.value - a.value);
    });

    return {
      selectedPortfolio,
      selectedPortfolioPositions,
      chartPositions,
      allocationItems,
    };
  }),
  withTrackedReducer(
    on(stockPortfolioPageEvents.opened, () => ({ isLoading: true, error: null, commandStatus: 'idle' as StockCommandStatus })),
    on(stockPortfolioPageEvents.portfolioSelected, ({ payload }) => ({
      selectedPortfolioId: payload.id,
      chartScope: 'portfolio' as StockChartScope,
      chartPositionIds: [],
    })),
    on(stockPortfolioPageEvents.chartScopeChanged, ({ payload }, state) => ({
      chartScope: payload.scope,
      chartPositionIds: payload.scope === 'portfolio' ? [] : state.chartPositionIds,
    })),
    on(stockPortfolioPageEvents.chartPositionToggled, ({ payload }, state) => {
      const exists = state.chartPositionIds.includes(payload.id);
      const chartPositionIds = exists ? state.chartPositionIds.filter((id) => id !== payload.id) : [...state.chartPositionIds, payload.id];

      return {
        chartScope: chartPositionIds.length > 0 ? ('selected' as StockChartScope) : ('portfolio' as StockChartScope),
        chartPositionIds,
      };
    }),
    on(stockPortfolioPageEvents.chartSelectionCleared, () => ({
      chartScope: 'portfolio' as StockChartScope,
      chartPositionIds: [],
    })),
    on(stockPortfolioPageEvents.addPortfolio, () => ({ commandStatus: 'submitting' as StockCommandStatus, error: null })),
    on(stockPortfolioPageEvents.updatePortfolio, () => ({ commandStatus: 'submitting' as StockCommandStatus, error: null })),
    on(stockPortfolioPageEvents.deletePortfolio, () => ({ commandStatus: 'submitting' as StockCommandStatus, error: null })),
    on(stockPortfolioPageEvents.addPosition, () => ({ commandStatus: 'submitting' as StockCommandStatus, error: null })),
    on(stockPortfolioPageEvents.updatePosition, () => ({ commandStatus: 'submitting' as StockCommandStatus, error: null })),
    on(stockPortfolioApiEvents.loadedSuccess, ({ payload }, state) => ({
      isLoading: false,
      hasLoaded: true,
      error: null,
      portfolios: payload.portfolios,
      positions: payload.positions,
      selectedPortfolioId: state.selectedPortfolioId ?? payload.portfolios[0]?.id ?? null,
      chartScope: 'portfolio' as StockChartScope,
      chartPositionIds: [],
    })),
    on(stockPortfolioApiEvents.loadedFailure, ({ payload }) => ({
      isLoading: false,
      hasLoaded: true,
      error: payload.message,
    })),
    on(stockPortfolioApiEvents.positionsLoaded, ({ payload }, state) => ({
      positions: [...state.positions.filter((position) => position.portfolioId !== payload.portfolioId), ...payload.positions],
      chartScope: 'portfolio' as StockChartScope,
      chartPositionIds: [],
      error: null,
    })),
    on(stockPortfolioApiEvents.portfolioSaved, ({ payload }, state) => {
      const exists = state.portfolios.some((portfolio) => portfolio.id === payload.portfolio.id);
      const portfolios = exists ? state.portfolios.map((portfolio) => (portfolio.id === payload.portfolio.id ? payload.portfolio : portfolio)) : [...state.portfolios, payload.portfolio];

      return {
        portfolios,
        selectedPortfolioId: payload.portfolio.id,
        commandStatus: 'accepted' as StockCommandStatus,
        error: null,
      };
    }),
    on(stockPortfolioApiEvents.portfolioDeleted, ({ payload }, state) => {
      const portfolios = state.portfolios.filter((portfolio) => portfolio.id !== payload.id);
      const positions = state.positions.filter((position) => position.portfolioId !== payload.id);
      const selectedPortfolioId = state.selectedPortfolioId === payload.id ? (portfolios[0]?.id ?? null) : state.selectedPortfolioId;

      return {
        portfolios,
        positions,
        selectedPortfolioId,
        chartScope: 'portfolio' as StockChartScope,
        chartPositionIds: [],
        commandStatus: 'accepted' as StockCommandStatus,
        error: null,
      };
    }),
    on(stockPortfolioApiEvents.positionOpenAccepted, () => ({
      commandStatus: 'accepted' as StockCommandStatus,
      error: null,
    })),
    on(stockPortfolioApiEvents.positionSaved, ({ payload }, state) => {
      const exists = state.positions.some((position) => position.id === payload.position.id);
      const positions: IStockPosition[] = exists ? state.positions.map((position) => (position.id === payload.position.id ? payload.position : position)) : [...state.positions, payload.position];

      return {
        positions,
        selectedPortfolioId: payload.position.portfolioId,
        commandStatus: 'accepted' as StockCommandStatus,
        error: null,
      };
    }),
    on(stockPortfolioApiEvents.commandFailure, ({ payload }) => ({
      commandStatus: 'failed' as StockCommandStatus,
      error: payload.message,
    })),
  ),
  withStockPortfolioEventHandlers(),
);
