import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Currency } from '@wisave/shared/model';

import { StockPortfolioService } from './stock-portfolio.service';

describe('StockPortfolioService', () => {
  let service: StockPortfolioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StockPortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('fetches logged-user portfolios from the stock API', async () => {
    const result = firstValueFrom(service.getWorkspace());

    const request = httpMock.expectOne('/api/stocks/portfolios');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        userId: '018f7b38-d9a1-77f1-9c38-c1f02af5f191',
        name: 'Long term',
        currency: 'PLN',
        createdOn: '2026-05-01T12:00:00Z',
        updatedOn: '2026-05-01T12:00:00Z',
      },
    ]);

    const workspace = await result;

    expect(workspace.portfolios).toEqual([
      {
        id: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        name: 'Long term',
        currency: Currency.PLN,
        totalValue: { amount: 0, currency: Currency.PLN },
        realizedProfitLoss: { amount: 0, currency: Currency.PLN },
        unrealizedProfitLoss: { amount: 0, currency: Currency.PLN },
        taxYear: new Date().getFullYear(),
      },
    ]);
    expect(workspace.positions).toEqual([]);
  });

  it('creates a portfolio through the stock API', async () => {
    const result = firstValueFrom(service.addPortfolio({ name: 'Long term', currency: Currency.PLN }));

    const request = httpMock.expectOne('/api/stocks/portfolios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Long term', currency: Currency.PLN });
    request.flush(
      {
        id: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        userId: '018f7b38-d9a1-77f1-9c38-c1f02af5f191',
        name: 'Long term',
        currency: 'PLN',
        createdOn: '2026-05-01T12:00:00Z',
        updatedOn: '2026-05-01T12:00:00Z',
      },
      { status: 201, statusText: 'Created' },
    );

    expect(await result).toEqual({
      id: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
      name: 'Long term',
      currency: Currency.PLN,
      totalValue: { amount: 0, currency: Currency.PLN },
      realizedProfitLoss: { amount: 0, currency: Currency.PLN },
      unrealizedProfitLoss: { amount: 0, currency: Currency.PLN },
      taxYear: new Date().getFullYear(),
    });
  });

  it('deletes a portfolio through the stock API', async () => {
    const result = firstValueFrom(service.deletePortfolio('018f7b38-d9a1-77f1-9c38-c1f02af5f190'));

    const request = httpMock.expectOne('/api/stocks/portfolios/018f7b38-d9a1-77f1-9c38-c1f02af5f190');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeNull();
  });

  it('fetches brokers from the stock API', async () => {
    const result = firstValueFrom(service.getBrokers());

    const request = httpMock.expectOne('/api/stocks/brokers');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: '018f7b38-d9a1-77f1-9c38-c1f02af5f192',
        name: 'Interactive Brokers',
        url: 'https://interactivebrokers.com',
        createdOn: '2026-05-01T12:00:00Z',
        updatedOn: '2026-05-01T12:00:00Z',
      },
    ]);

    expect(await result).toEqual([
      {
        id: '018f7b38-d9a1-77f1-9c38-c1f02af5f192',
        name: 'Interactive Brokers',
        url: 'https://interactivebrokers.com',
      },
    ]);
  });

  it('fetches positions for a selected portfolio from the stock API', async () => {
    const result = firstValueFrom(service.getPositions('018f7b38-d9a1-77f1-9c38-c1f02af5f190'));

    const request = httpMock.expectOne('/api/stocks/positions?portfolioId=018f7b38-d9a1-77f1-9c38-c1f02af5f190');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: '019de5e9-e730-7770-9c3a-8d191958ab87',
        userId: '43949118-f1d1-48bb-abde-2b78b40dc12e',
        portfolioId: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        brokerId: 'a30ae9b5-40fa-4276-ab63-5e5bf39df61c',
        symbol: 'NOKIA.FI',
        isin: 'FI0009000681',
        name: 'Nokia',
        currency: 'PLN',
        allocationTag: 'EU Tech Stock',
        orders: [
          {
            id: '019de5e9-f4a8-767c-8c2c-33118c7110dd',
            side: 'Buy',
            orderedAtUtc: '2026-03-17T00:39:00+00:00',
            quantity: 20,
            unitPrice: 7.384,
            fees: 0,
            grossValue: 147.68,
            netValue: 147.68,
            brokerOrderId: null,
          },
        ],
        quantity: 20,
        isOpen: true,
        createdAt: '2026-05-01T23:40:08.231738+00:00',
        updatedAt: null,
        closedAt: null,
      },
    ]);

    expect(await result).toEqual([
      {
        id: '019de5e9-e730-7770-9c3a-8d191958ab87',
        portfolioId: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        brokerId: 'a30ae9b5-40fa-4276-ab63-5e5bf39df61c',
        allocationTag: 'EU Tech Stock',
        symbol: 'NOKIA.FI',
        name: 'Nokia',
        isin: 'FI0009000681',
        quantity: 20,
        currency: Currency.PLN,
        averageCost: 7.384,
        marketPrice: 7.384,
        marketValue: { amount: 147.68, currency: Currency.PLN },
        reportingValue: { amount: 147.68, currency: Currency.PLN },
        unrealizedProfitLoss: { amount: 0, currency: Currency.PLN },
        unrealizedProfitLossPercent: 0,
        allocationGroup: 'EU Tech Stock',
        isOpen: true,
        chart: [],
        orders: [
          {
            id: '019de5e9-f4a8-767c-8c2c-33118c7110dd',
            side: 'Buy',
            orderedAtUtc: '2026-03-17T00:39:00+00:00',
            quantity: 20,
            unitPrice: 7.384,
            fees: 0,
            grossValue: 147.68,
            netValue: 147.68,
            brokerOrderId: null,
          },
        ],
      },
    ]);
  });

  it('opens a position through the fire-and-forget stock API command', async () => {
    const result = firstValueFrom(
      service.addPosition({
        portfolioId: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
        brokerId: '018f7b38-d9a1-77f1-9c38-c1f02af5f192',
        symbol: 'AAPL',
        isin: 'US0378331005',
        name: 'Apple Inc.',
        currency: Currency.USD,
        allocationTag: 'US Tech',
        orderedAtUtc: '2026-05-01T10:30:00.000Z',
        quantity: 12,
        unitPrice: 185.1,
        fees: 1.5,
        brokerOrderId: 'IB-123',
      }),
    );

    const request = httpMock.expectOne('/api/stocks/positions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      portfolioId: '018f7b38-d9a1-77f1-9c38-c1f02af5f190',
      brokerId: '018f7b38-d9a1-77f1-9c38-c1f02af5f192',
      symbol: 'AAPL',
      isin: 'US0378331005',
      name: 'Apple Inc.',
      currency: Currency.USD,
      allocationTag: 'US Tech',
      orderedAtUtc: '2026-05-01T10:30:00.000Z',
      quantity: 12,
      unitPrice: 185.1,
      fees: 1.5,
      brokerOrderId: 'IB-123',
    });
    request.flush({ correlationId: '018f7b38-d9a1-77f1-9c38-c1f02af5f199' }, { status: 202, statusText: 'Accepted' });

    expect(await result).toEqual({ correlationId: '018f7b38-d9a1-77f1-9c38-c1f02af5f199' });
  });
});
