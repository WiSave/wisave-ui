import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, of, type Observable } from 'rxjs';

import { getApiBaseUrl } from '@wisave/platform/config';
import type { Currency } from '@wisave/shared/model';

import type {
  IOpenStockPositionAccepted,
  IStockBroker,
  IStockPortfolio,
  IStockPortfolioWritePayload,
  IStockPosition,
  IStockPositionEditPayload,
  IStockPositionOrder,
  IStockPositionWritePayload,
} from '../types/stock-portfolio.types';

export interface IStockPortfolioWorkspace {
  portfolios: IStockPortfolio[];
  positions: IStockPosition[];
}

interface IStockPortfolioApiDto {
  id: string;
  name: string;
  currency: string;
}

interface IStockBrokerApiDto {
  id: string;
  name: string;
  url: string | null;
}

interface IStockPositionApiDto {
  id: string;
  portfolioId: string;
  brokerId: string;
  symbol: string;
  isin: string;
  name: string | null;
  currency: string;
  allocationTag: string | null;
  orders?: IStockPositionOrderApiDto[];
  quantity: number;
  isOpen: boolean;
}

interface IStockPositionOrderApiDto {
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

@Injectable({ providedIn: 'root' })
export class StockPortfolioService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = `${getApiBaseUrl()}/stocks`;

  #portfolios: IStockPortfolio[] = [];
  #positions: IStockPosition[] = [];

  getWorkspace(): Observable<IStockPortfolioWorkspace> {
    return this.#http.get<IStockPortfolioApiDto[]>(`${this.#apiUrl}/portfolios`).pipe(
      map((portfolios) => ({
        portfolios: portfolios.map((portfolio) => this.#mapPortfolio(portfolio)),
        positions: [],
      })),
    );
  }

  addPortfolio(payload: IStockPortfolioWritePayload): Observable<IStockPortfolio> {
    return this.#http.post<IStockPortfolioApiDto>(`${this.#apiUrl}/portfolios`, payload).pipe(map((portfolio) => this.#mapPortfolio(portfolio)));
  }

  getBrokers(): Observable<IStockBroker[]> {
    return this.#http.get<IStockBrokerApiDto[]>(`${this.#apiUrl}/brokers`).pipe(map((brokers) => brokers.map((broker) => this.#mapBroker(broker))));
  }

  getPositions(portfolioId: string): Observable<IStockPosition[]> {
    return this.#http.get<IStockPositionApiDto[]>(`${this.#apiUrl}/positions`, { params: { portfolioId } }).pipe(map((positions) => positions.map((position) => this.#mapPosition(position))));
  }

  updatePortfolio(id: string, payload: IStockPortfolioWritePayload): Observable<IStockPortfolio> {
    const existing = this.#portfolios.find((portfolio) => portfolio.id === id);
    const portfolio: IStockPortfolio = {
      ...(existing ?? this.#emptyPortfolio(id, payload.currency)),
      name: payload.name,
      currency: payload.currency,
    };

    this.#portfolios = this.#portfolios.map((item) => (item.id === id ? portfolio : item));
    return of({ ...portfolio });
  }

  deletePortfolio(id: string): Observable<null> {
    return this.#http.delete<null>(`${this.#apiUrl}/portfolios/${id}`);
  }

  addPosition(payload: IStockPositionWritePayload): Observable<IOpenStockPositionAccepted> {
    return this.#http.post<IOpenStockPositionAccepted>(`${this.#apiUrl}/positions`, payload);
  }

  updatePosition(id: string, payload: IStockPositionEditPayload): Observable<IStockPosition> {
    const position = this.#positionFromPayload(id, payload);
    this.#positions = this.#positions.map((item) => (item.id === id ? position : item));
    return of({ ...position, chart: position.chart.map((point) => ({ ...point })) });
  }

  #mapPortfolio(portfolio: IStockPortfolioApiDto): IStockPortfolio {
    const currency = portfolio.currency as Currency;

    return {
      id: portfolio.id,
      name: portfolio.name,
      currency,
      totalValue: { amount: 0, currency },
      realizedProfitLoss: { amount: 0, currency },
      unrealizedProfitLoss: { amount: 0, currency },
      taxYear: new Date().getFullYear(),
    };
  }

  #mapBroker(broker: IStockBrokerApiDto): IStockBroker {
    return {
      id: broker.id,
      name: broker.name,
      url: broker.url,
    };
  }

  #mapPosition(position: IStockPositionApiDto): IStockPosition {
    const currency = position.currency as Currency;
    const allocationGroup = position.allocationTag ?? 'Unassigned';
    const orders = (position.orders ?? []).map((order) => this.#mapPositionOrder(order));
    const buyOrders = orders.filter((order) => order.side.toLowerCase() === 'buy');
    const buyQuantity = buyOrders.reduce((sum, order) => sum + order.quantity, 0);
    const buyNetValue = buyOrders.reduce((sum, order) => sum + order.netValue, 0);
    const averageCost = buyQuantity > 0 ? buyNetValue / buyQuantity : 0;
    const currentValue = position.quantity * averageCost;

    return {
      id: position.id,
      portfolioId: position.portfolioId,
      brokerId: position.brokerId,
      allocationTag: position.allocationTag,
      symbol: position.symbol,
      name: position.name ?? position.symbol,
      isin: position.isin,
      quantity: position.quantity,
      currency,
      averageCost,
      marketPrice: averageCost,
      marketValue: { amount: currentValue, currency },
      reportingValue: { amount: currentValue, currency },
      unrealizedProfitLoss: { amount: 0, currency },
      unrealizedProfitLossPercent: 0,
      allocationGroup,
      isOpen: position.isOpen,
      chart: [],
      orders,
    };
  }

  #mapPositionOrder(order: IStockPositionOrderApiDto): IStockPositionOrder {
    return {
      id: order.id,
      side: order.side,
      orderedAtUtc: order.orderedAtUtc,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      fees: order.fees,
      grossValue: order.grossValue,
      netValue: order.netValue,
      brokerOrderId: order.brokerOrderId,
    };
  }

  #emptyPortfolio(id: string, currency: Currency): IStockPortfolio {
    return {
      id,
      name: '',
      currency,
      totalValue: { amount: 0, currency },
      realizedProfitLoss: { amount: 0, currency },
      unrealizedProfitLoss: { amount: 0, currency },
      taxYear: new Date().getFullYear(),
    };
  }

  #positionFromPayload(id: string, payload: IStockPositionEditPayload): IStockPosition {
    const marketValueAmount = payload.quantity * payload.marketPrice;
    const cost = payload.quantity * payload.averageCost;
    const profitLoss = marketValueAmount - cost;
    const profitLossPercent = cost > 0 ? (profitLoss / cost) * 100 : 0;

    return {
      id,
      portfolioId: payload.portfolioId,
      symbol: payload.symbol.toUpperCase(),
      name: payload.name,
      isin: payload.isin.toUpperCase(),
      quantity: payload.quantity,
      currency: payload.currency,
      averageCost: payload.averageCost,
      marketPrice: payload.marketPrice,
      marketValue: { amount: marketValueAmount, currency: payload.currency },
      reportingValue: { amount: marketValueAmount, currency: payload.currency },
      unrealizedProfitLoss: { amount: profitLoss, currency: payload.currency },
      unrealizedProfitLossPercent: profitLossPercent,
      allocationGroup: payload.allocationGroup,
      isOpen: true,
      chart: [
        { date: '2026-01-01', value: cost },
        { date: '2026-02-01', value: cost + profitLoss * 0.35 },
        { date: '2026-03-01', value: cost + profitLoss * 0.7 },
        { date: '2026-04-01', value: marketValueAmount },
      ],
    };
  }
}
