import { TestBed } from '@angular/core/testing';

import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';

import { Currency } from '@core/types';

import { type IStockPortfolio, type IStockPosition } from '../../types/stock-portfolio.types';
import { stockPortfolioApiEvents, stockPortfolioPageEvents } from './stock-portfolio.events';
import { StockPortfolioStore } from './stock-portfolio.store';

describe('StockPortfolioStore', () => {
  let store: InstanceType<typeof StockPortfolioStore>;
  let dispatcher: Dispatcher;

  const portfolios: IStockPortfolio[] = [
    {
      id: 'portfolio-core',
      name: 'Core Portfolio',
      currency: Currency.PLN,
      totalValue: { amount: 42840, currency: Currency.PLN },
      realizedProfitLoss: { amount: 1240, currency: Currency.PLN },
      unrealizedProfitLoss: { amount: 2820, currency: Currency.PLN },
      taxYear: 2026,
    },
    {
      id: 'portfolio-growth',
      name: 'Growth',
      currency: Currency.USD,
      totalValue: { amount: 18420, currency: Currency.USD },
      realizedProfitLoss: { amount: 860, currency: Currency.USD },
      unrealizedProfitLoss: { amount: 1920, currency: Currency.USD },
      taxYear: 2026,
    },
  ];

  const positions: IStockPosition[] = [
    {
      id: 'position-aapl',
      portfolioId: 'portfolio-core',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      isin: 'US0378331005',
      quantity: 12,
      currency: Currency.USD,
      averageCost: 185.1,
      marketPrice: 193.2,
      marketValue: { amount: 2318.4, currency: Currency.USD },
      reportingValue: { amount: 9300, currency: Currency.PLN },
      unrealizedProfitLoss: { amount: 97.2, currency: Currency.USD },
      unrealizedProfitLossPercent: 8.4,
      allocationGroup: 'US Tech',
      isOpen: true,
      chart: [
        { date: '2026-01-01', value: 8600 },
        { date: '2026-02-01', value: 9100 },
      ],
    },
    {
      id: 'position-vwce',
      portfolioId: 'portfolio-core',
      symbol: 'VWCE',
      name: 'Vanguard FTSE All-World',
      isin: 'IE00BK5BQT80',
      quantity: 31,
      currency: Currency.EUR,
      averageCost: 107.4,
      marketPrice: 110.7,
      marketValue: { amount: 3431.7, currency: Currency.EUR },
      reportingValue: { amount: 15100, currency: Currency.PLN },
      unrealizedProfitLoss: { amount: 102.3, currency: Currency.EUR },
      unrealizedProfitLossPercent: 3.1,
      allocationGroup: 'ETF Core',
      isOpen: true,
      chart: [
        { date: '2026-01-01', value: 14600 },
        { date: '2026-02-01', value: 15100 },
      ],
    },
    {
      id: 'position-msft',
      portfolioId: 'portfolio-growth',
      symbol: 'MSFT',
      name: 'Microsoft',
      isin: 'US5949181045',
      quantity: 6,
      currency: Currency.USD,
      averageCost: 412.3,
      marketPrice: 458.5,
      marketValue: { amount: 2751, currency: Currency.USD },
      reportingValue: { amount: 2751, currency: Currency.USD },
      unrealizedProfitLoss: { amount: 277.2, currency: Currency.USD },
      unrealizedProfitLossPercent: 11.2,
      allocationGroup: 'US Tech',
      isOpen: true,
      chart: [
        { date: '2026-01-01', value: 2460 },
        { date: '2026-02-01', value: 2751 },
      ],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideDispatcher()],
    });

    store = TestBed.inject(StockPortfolioStore);
    dispatcher = TestBed.inject(Dispatcher);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('selects the first portfolio and its positions after loading', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));

    expect(store.selectedPortfolio()?.id).toBe('portfolio-core');
    expect(store.selectedPortfolioPositions().map((position) => position.id)).toEqual(['position-aapl', 'position-vwce']);
    expect(store.chartScope()).toBe('portfolio');
    expect(store.chartPositions().map((position) => position.id)).toEqual(['position-aapl', 'position-vwce']);
  });

  it('uses selected table rows as chart scope', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));

    dispatcher.dispatch(stockPortfolioPageEvents.chartPositionToggled({ id: 'position-aapl' }));

    expect(store.chartScope()).toBe('selected');
    expect(store.chartPositionIds()).toEqual(['position-aapl']);
    expect(store.chartPositions().map((position) => position.id)).toEqual(['position-aapl']);

    dispatcher.dispatch(stockPortfolioPageEvents.chartPositionToggled({ id: 'position-vwce' }));

    expect(store.chartPositionIds()).toEqual(['position-aapl', 'position-vwce']);
    expect(store.chartPositions().map((position) => position.id)).toEqual(['position-aapl', 'position-vwce']);
  });

  it('clears selected chart rows when switching portfolio', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));
    dispatcher.dispatch(stockPortfolioPageEvents.chartPositionToggled({ id: 'position-aapl' }));

    dispatcher.dispatch(stockPortfolioPageEvents.portfolioSelected({ id: 'portfolio-growth' }));

    expect(store.selectedPortfolio()?.id).toBe('portfolio-growth');
    expect(store.chartScope()).toBe('portfolio');
    expect(store.chartPositionIds()).toEqual([]);
    expect(store.selectedPortfolioPositions().map((position) => position.id)).toEqual(['position-msft']);
  });

  it('replaces positions for the selected portfolio when backend positions load', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));
    dispatcher.dispatch(stockPortfolioPageEvents.portfolioSelected({ id: 'portfolio-core' }));

    dispatcher.dispatch(
      stockPortfolioApiEvents.positionsLoaded({
        portfolioId: 'portfolio-core',
        positions: [
          {
            id: 'position-xtb',
            portfolioId: 'portfolio-core',
            brokerId: 'broker-xtb',
            allocationTag: 'Poland',
            symbol: 'XTB',
            name: 'XTB S.A.',
            isin: 'PLXTRDM00011',
            quantity: 4,
            currency: Currency.PLN,
            averageCost: 0,
            marketPrice: 0,
            marketValue: { amount: 0, currency: Currency.PLN },
            reportingValue: { amount: 0, currency: Currency.PLN },
            unrealizedProfitLoss: { amount: 0, currency: Currency.PLN },
            unrealizedProfitLossPercent: 0,
            allocationGroup: 'Poland',
            isOpen: true,
            chart: [],
          },
        ],
      }),
    );

    expect(store.positions().map((position) => position.id)).toEqual(['position-msft', 'position-xtb']);
    expect(store.selectedPortfolioPositions().map((position) => position.id)).toEqual(['position-xtb']);
    expect(store.chartScope()).toBe('portfolio');
    expect(store.chartPositionIds()).toEqual([]);
  });

  it('accepts open-position commands without appending a projected row', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));
    dispatcher.dispatch(stockPortfolioPageEvents.addPosition({
      position: {
        portfolioId: 'portfolio-core',
        brokerId: 'broker-1',
        symbol: 'AAPL',
        isin: 'US0378331005',
        name: 'Apple Inc.',
        currency: Currency.USD,
        allocationTag: 'US Tech',
        orderedAtUtc: '2026-05-01T10:30:00.000Z',
        quantity: 12,
        unitPrice: 185.1,
        fees: 1.5,
        brokerOrderId: null,
      },
    }));

    expect(store.commandStatus()).toBe('submitting');

    dispatcher.dispatch(stockPortfolioApiEvents.positionOpenAccepted({ correlationId: 'correlation-1' }));

    expect(store.commandStatus()).toBe('accepted');
    expect(store.positions().map((position) => position.id)).toEqual(['position-aapl', 'position-vwce', 'position-msft']);
  });

  it('removes a deleted portfolio and its positions', () => {
    dispatcher.dispatch(stockPortfolioApiEvents.loadedSuccess({ portfolios, positions }));
    dispatcher.dispatch(stockPortfolioPageEvents.portfolioSelected({ id: 'portfolio-core' }));

    dispatcher.dispatch(stockPortfolioPageEvents.deletePortfolio({ id: 'portfolio-core' }));

    expect(store.commandStatus()).toBe('submitting');

    dispatcher.dispatch(stockPortfolioApiEvents.portfolioDeleted({ id: 'portfolio-core' }));

    expect(store.commandStatus()).toBe('accepted');
    expect(store.portfolios().map((portfolio) => portfolio.id)).toEqual(['portfolio-growth']);
    expect(store.positions().map((position) => position.id)).toEqual(['position-msft']);
    expect(store.selectedPortfolio()?.id).toBe('portfolio-growth');
    expect(store.chartScope()).toBe('portfolio');
    expect(store.chartPositionIds()).toEqual([]);
  });
});
