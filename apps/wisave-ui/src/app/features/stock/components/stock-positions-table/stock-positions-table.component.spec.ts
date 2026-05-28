import { type ComponentRef } from '@angular/core';
import { type ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { Currency } from '@wisave/shared/model';

import { type IStockPosition } from '../../types/stock-portfolio.types';
import { StockPositionsTableComponent } from './stock-positions-table.component';

describe('StockPositionsTableComponent', () => {
  let fixture: ComponentFixture<StockPositionsTableComponent>;
  let componentRef: ComponentRef<StockPositionsTableComponent>;

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
      chart: [{ date: '2026-01-01', value: 8600 }],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockPositionsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockPositionsTableComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('positions', positions);
    componentRef.setInput('chartPositionIds', []);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('emits chart row toggles', () => {
    const emitted = vi.fn();
    componentRef.instance.chartPositionToggled.subscribe(emitted);

    componentRef.instance.onChartToggle('position-aapl');

    expect(emitted).toHaveBeenCalledWith('position-aapl');
  });

  it('shows add position beside open and closed controls', () => {
    const emitted = vi.fn();
    componentRef.instance.addPosition.subscribe(emitted);

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const openIndex = buttons.findIndex((button) => button.textContent?.includes('Open'));
    const closedIndex = buttons.findIndex((button) => button.textContent?.includes('Closed'));
    const addPositionIndex = buttons.findIndex((button) => button.textContent?.includes('Add Position'));
    const addPositionButton = buttons[addPositionIndex];

    expect(openIndex).toBeGreaterThanOrEqual(0);
    expect(closedIndex).toBeGreaterThan(openIndex);
    expect(addPositionIndex).toBeGreaterThan(closedIndex);
    expect(addPositionButton.className).toContain('p-button-success');

    addPositionButton.click();

    expect(emitted).toHaveBeenCalledOnce();
  });

  it('fills the card while keeping an explicit scrollable desktop table width', () => {
    const scrollArea = fixture.nativeElement.querySelector('[data-testid="stock-positions-scroll"]') as HTMLElement;
    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const headerActions = fixture.nativeElement.querySelector('[data-testid="stock-positions-header-actions"]') as HTMLElement;

    expect(scrollArea.className).toContain('overflow-x-auto');
    expect(scrollArea.className).toContain('[scrollbar-gutter:stable]');
    expect(table.className).toContain('w-full');
    expect(table.className).toContain('min-w-[87.5rem]');
    expect(table.className).not.toContain('min-w-full');
    expect(headerActions.className).toContain('flex-wrap');
  });

  it('preserves stock price precision in price columns', () => {
    expect(componentRef.instance.formatPrice(7.384, Currency.PLN)).toContain('7,384');
  });
});
