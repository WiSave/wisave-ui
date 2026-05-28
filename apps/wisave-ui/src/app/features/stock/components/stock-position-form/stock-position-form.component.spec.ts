import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { InputNumber } from 'primeng/inputnumber';

import { Currency } from '@wisave/shared/model';

import { StockPositionFormComponent } from './stock-position-form.component';

describe('StockPositionFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockPositionFormComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(StockPositionFormComponent);
    fixture.componentRef.setInput('portfolioId', 'portfolio-1');
    fixture.componentRef.setInput('brokers', [{ id: 'broker-1', name: 'Interactive Brokers', url: 'https://interactivebrokers.com' }]);
    fixture.detectChanges();

    return fixture;
  }

  it('groups identity and pricing fields into a scan-friendly dialog layout', () => {
    const fixture = createComponent();

    const identityFields = fixture.nativeElement.querySelector('[data-testid="stock-position-identity-fields"]') as HTMLElement;
    const pricingFields = fixture.nativeElement.querySelector('[data-testid="stock-position-pricing-fields"]') as HTMLElement;
    const symbolField = fixture.nativeElement.querySelector('[data-testid="stock-position-symbol-field"]') as HTMLElement;
    const nameField = fixture.nativeElement.querySelector('[data-testid="stock-position-name-field"]') as HTMLElement;
    const currencyField = fixture.nativeElement.querySelector('[data-testid="stock-position-currency-field"]') as HTMLElement;
    const isinField = fixture.nativeElement.querySelector('[data-testid="stock-position-isin-field"]') as HTMLElement;
    const brokerField = fixture.nativeElement.querySelector('[data-testid="stock-position-broker-field"]') as HTMLElement;
    const orderedAtField = fixture.nativeElement.querySelector('[data-testid="stock-position-ordered-at-field"]') as HTMLElement;
    const allocationTagField = fixture.nativeElement.querySelector('[data-testid="stock-position-allocation-tag-field"]') as HTMLElement;

    expect(identityFields.className).toContain('min-w-0');
    expect(identityFields.className).toContain('md:grid-cols-12');
    expect(pricingFields.className).toContain('md:grid-cols-3');
    expect(symbolField.className).toContain('min-w-0');
    expect(symbolField.className).toContain('md:col-span-3');
    expect(nameField.className).toContain('md:col-span-6');
    expect(currencyField.className).toContain('md:col-span-3');
    expect(brokerField.className).toContain('md:col-span-4');
    expect(isinField.className).toContain('md:col-span-4');
    expect(orderedAtField.className).toContain('md:col-span-4');
    expect(allocationTagField.className).toContain('min-w-0');
    expect(allocationTagField.className).toContain('md:max-w-sm');
  });

  it('renders PrimeNG select and numeric controls full width', () => {
    const fixture = createComponent();

    const currencySelect = fixture.nativeElement.querySelector('p-select') as HTMLElement;
    const numberInputs = [...fixture.nativeElement.querySelectorAll('p-inputnumber')] as HTMLElement[];

    expect(currencySelect.className).toContain('w-full');
    expect(currencySelect.className).toContain('min-w-0');
    expect(numberInputs).toHaveLength(3);
    expect(numberInputs.every((input) => input.className.includes('w-full'))).toBe(true);
    expect(numberInputs.every((input) => input.className.includes('min-w-0'))).toBe(true);
  });

  it('allows stock unit prices with more than two decimal places', () => {
    const fixture = createComponent();

    const inputNumbers = fixture.debugElement.queryAll(By.directive(InputNumber)).map((element) => element.componentInstance as InputNumber);
    const unitPrice = inputNumbers.find((inputNumber) => inputNumber.inputId === 'stock-unit-price');
    const fees = inputNumbers.find((inputNumber) => inputNumber.inputId === 'stock-fees');

    expect(unitPrice?.maxFractionDigits).toBe(6);
    expect(fees?.maxFractionDigits).toBe(2);
  });

  it('uses order fields instead of derived valuation fields', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Broker');
    expect(text).toContain('Ordered at');
    expect(text).toContain('Allocation tag');
    expect(text).toContain('Unit price');
    expect(text).toContain('Fees');
    expect(text).not.toContain('Broker order ID');
    expect(text).not.toContain('Average cost');
    expect(text).not.toContain('Market price');
    expect(text).not.toContain('Allocation group');
  });

  it('emits the open-position request payload shape', () => {
    const fixture = createComponent();
    const emitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(emitted);

    fixture.componentInstance.form.setValue({
      brokerId: 'broker-1',
      symbol: 'aapl',
      name: 'Apple Inc.',
      allocationTag: ' US Tech ',
      isin: 'us0378331005',
      quantity: 12,
      currency: Currency.USD,
      orderedAtUtc: new Date('2026-05-01T10:30:00.000Z'),
      unitPrice: 185.1,
      fees: 1.5,
    });

    fixture.componentInstance.onSubmit();

    expect(emitted).toHaveBeenCalledWith({
      portfolioId: 'portfolio-1',
      brokerId: 'broker-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      allocationTag: 'US Tech',
      isin: 'US0378331005',
      quantity: 12,
      currency: Currency.USD,
      orderedAtUtc: '2026-05-01T10:30:00.000Z',
      unitPrice: 185.1,
      fees: 1.5,
      brokerOrderId: null,
    });
  });

  it('emits a null allocation tag when the optional field is blank', () => {
    const fixture = createComponent();
    const emitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(emitted);

    fixture.componentInstance.form.setValue({
      brokerId: 'broker-1',
      symbol: 'aapl',
      name: 'Apple Inc.',
      allocationTag: '   ',
      isin: 'us0378331005',
      quantity: 12,
      currency: Currency.USD,
      orderedAtUtc: new Date('2026-05-01T10:30:00.000Z'),
      unitPrice: 185.1,
      fees: 1.5,
    });

    fixture.componentInstance.onSubmit();

    expect(emitted).toHaveBeenCalledWith(expect.objectContaining({ allocationTag: null }));
  });

  it('uses quiet cancel and a single primary submit action', () => {
    const fixture = createComponent();

    const cancelButton = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.includes('Cancel'));
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(cancelButton?.className).toContain('p-button-text');
    expect(cancelButton?.className).not.toContain('p-button-outlined');
    expect(cancelButton?.querySelector('.pi-times')).toBeNull();
    expect(submitButton.className).toContain('p-button-success');
    expect(submitButton.querySelector('.pi-check')).toBeNull();
  });
});
