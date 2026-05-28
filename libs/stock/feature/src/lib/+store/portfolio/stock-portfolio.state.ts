import { type IStockPortfolio, type IStockPosition, type StockChartScope, type StockCommandStatus } from '@wisave/stock/data-access';

export interface StockPortfolioState {
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  commandStatus: StockCommandStatus;
  portfolios: IStockPortfolio[];
  positions: IStockPosition[];
  selectedPortfolioId: string | null;
  chartScope: StockChartScope;
  chartPositionIds: string[];
}

export const initialState: StockPortfolioState = {
  isLoading: false,
  hasLoaded: false,
  error: null,
  commandStatus: 'idle',
  portfolios: [],
  positions: [],
  selectedPortfolioId: null,
  chartScope: 'portfolio',
  chartPositionIds: [],
};
