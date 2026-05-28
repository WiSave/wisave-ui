import { type Currency, type IMoney } from '@core/types';

export type StockPortfolioId = string;
export type StockPositionId = string;
export type StockChartScope = 'portfolio' | 'selected' | 'compare';
export type StockCommandStatus = 'idle' | 'submitting' | 'accepted' | 'failed';

export interface IStockChartPoint {
  date: string;
  value: number;
}

export interface IStockPortfolio {
  id: StockPortfolioId;
  name: string;
  currency: Currency;
  totalValue: IMoney;
  realizedProfitLoss: IMoney;
  unrealizedProfitLoss: IMoney;
  taxYear: number;
}

export interface IStockPositionOrder {
  id: string;
  side: string;
  orderedAtUtc: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  grossValue: number;
  netValue: number;
  brokerOrderId: string | null;
}

export interface IStockPosition {
  id: StockPositionId;
  portfolioId: StockPortfolioId;
  brokerId?: string;
  allocationTag?: string | null;
  symbol: string;
  name: string;
  isin: string;
  quantity: number;
  currency: Currency;
  averageCost: number;
  marketPrice: number;
  marketValue: IMoney;
  reportingValue: IMoney;
  unrealizedProfitLoss: IMoney;
  unrealizedProfitLossPercent: number;
  allocationGroup: string;
  isOpen: boolean;
  chart: IStockChartPoint[];
  orders?: IStockPositionOrder[];
}

export interface IStockPortfolioWritePayload {
  name: string;
  currency: Currency;
}

export interface IStockPositionWritePayload {
  portfolioId: StockPortfolioId;
  brokerId: string;
  symbol: string;
  isin: string;
  name: string | null;
  currency: Currency;
  allocationTag: string | null;
  orderedAtUtc: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  brokerOrderId: string | null;
}

export interface IStockBroker {
  id: string;
  name: string;
  url: string | null;
}

export interface IOpenStockPositionAccepted {
  correlationId: string;
}

export interface IStockPositionEditPayload {
  portfolioId: StockPortfolioId;
  symbol: string;
  name: string;
  isin: string;
  quantity: number;
  currency: Currency;
  averageCost: number;
  marketPrice: number;
  allocationGroup: string;
}

export interface IStockAllocationItem {
  label: string;
  value: number;
  percent: number;
}
