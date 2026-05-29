import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { provideDispatcher } from '@ngrx/signals/events';
import { Currency } from '@wisave/shared/model';

import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { AddStockPortfolioComponent } from './add-stock-portfolio.component';

describe('AddStockPortfolioComponent', () => {
  const navigate = vi.fn(() => Promise.resolve(true));

  const storeStub = {
    commandStatus: signal<'idle' | 'submitting' | 'accepted' | 'failed'>('idle'),
    error: signal<string | null>(null),
  };

  beforeEach(async () => {
    navigate.mockClear();
    storeStub.commandStatus.set('idle');
    storeStub.error.set(null);

    await TestBed.configureTestingModule({
      imports: [AddStockPortfolioComponent],
      providers: [provideDispatcher(), { provide: StockPortfolioStore, useValue: storeStub }, { provide: Router, useValue: { navigate } }, { provide: ActivatedRoute, useValue: { parent: {} } }],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses quiet cancel and plain confirm copy for the submit button', () => {
    const fixture = TestBed.createComponent(AddStockPortfolioComponent);
    fixture.detectChanges();

    const cancelButton = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.includes('Cancel'));
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(cancelButton?.className).toContain('p-button-text');
    expect(cancelButton?.className).not.toContain('p-button-outlined');
    expect(cancelButton?.querySelector('.pi-times')).toBeNull();
    expect(submitButton.textContent).toContain('Confirm');
    expect(submitButton.textContent).not.toContain('Save');
    expect(submitButton.textContent).not.toContain('Add portfolio');
    expect(submitButton.querySelector('.pi-folder-plus')).toBeNull();
    expect(submitButton.className).toContain('p-button-success');
  });

  it('disables fields and buttons while submitting', () => {
    storeStub.commandStatus.set('submitting');

    const fixture = TestBed.createComponent(AddStockPortfolioComponent);
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#stock-portfolio-name') as HTMLInputElement;
    const cancelButton = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) => button.textContent?.includes('Cancel')) as HTMLButtonElement;
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(nameInput.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.className).toContain('p-button-loading');
  });

  it('closes after a submitted portfolio is accepted by the backend', () => {
    const fixture = TestBed.createComponent(AddStockPortfolioComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSubmit({ name: 'Long term', currency: Currency.PLN });
    storeStub.commandStatus.set('accepted');
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['.'], { relativeTo: {} });
  });
});
