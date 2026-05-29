import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  type IOpenStockPositionAccepted,
  type IStockPortfolio,
  type IStockPortfolioWritePayload,
  type IStockPosition,
  type IStockPositionEditPayload,
  type IStockPositionWritePayload,
  type StockChartScope,
} from '@wisave/stock/data-access';

export const stockPortfolioPageEvents = eventGroup({
  source: 'Stock Portfolio Page',
  events: {
    opened: type<void>(),
    portfolioSelected: type<{ id: string }>(),
    chartScopeChanged: type<{ scope: StockChartScope }>(),
    chartPositionToggled: type<{ id: string }>(),
    chartSelectionCleared: type<void>(),
    addPortfolio: type<{ portfolio: IStockPortfolioWritePayload }>(),
    updatePortfolio: type<{ id: string; portfolio: IStockPortfolioWritePayload }>(),
    deletePortfolio: type<{ id: string }>(),
    addPosition: type<{ position: IStockPositionWritePayload }>(),
    updatePosition: type<{ id: string; position: IStockPositionEditPayload }>(),
  },
});

export const stockPortfolioApiEvents = eventGroup({
  source: 'Stock Portfolio API',
  events: {
    loadedSuccess: type<{ portfolios: IStockPortfolio[]; positions: IStockPosition[] }>(),
    loadedFailure: type<{ message: string }>(),
    positionsLoaded: type<{ portfolioId: string; positions: IStockPosition[] }>(),
    portfolioSaved: type<{ portfolio: IStockPortfolio }>(),
    portfolioDeleted: type<{ id: string }>(),
    positionOpenAccepted: type<IOpenStockPositionAccepted>(),
    positionSaved: type<{ position: IStockPosition }>(),
    commandFailure: type<{ message: string }>(),
  },
});
