import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { Button } from 'primeng/button';

import { injectDispatch } from '@ngrx/signals/events';

import { stockPortfolioPageEvents } from '../+store/portfolio/stock-portfolio.events';
import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { StockPortfolioFormComponent } from '../components/stock-portfolio-form/stock-portfolio-form.component';
import { type IStockPortfolioWritePayload } from '../types/stock-portfolio.types';

@Component({
  selector: 'app-edit-stock-portfolio',
  imports: [Button, StockPortfolioFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Edit portfolio</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Update portfolio name and reporting currency.</p>
      </div>

      @if (isFetchingPortfolio()) {
        <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
          <i class="pi pi-spinner pi-spin text-lg"></i>
          <span>Loading portfolio...</span>
        </div>
      } @else if (portfolio()) {
        <app-stock-portfolio-form [portfolio]="portfolio()" [isLoading]="isLoading()" (submitted)="onSubmit($event)" (cancelled)="onCancel()" />
      } @else {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
          <i class="pi pi-exclamation-triangle text-warning-500 text-xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Portfolio not found</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">This portfolio is not available in the current workspace.</p>
          <p-button (onClick)="onCancel()" label="Close" severity="secondary" size="small" />
        </div>
      }
    </div>
  `,
})
export class EditStockPortfolioComponent {
  readonly #store = inject(StockPortfolioStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(stockPortfolioPageEvents);
  readonly #submitted = signal(false);

  readonly portfolioId = toSignal(this.#route.paramMap.pipe(map((params) => params.get('id'))), { initialValue: null });
  readonly portfolio = computed(() => this.#store.portfolios().find((item) => item.id === this.portfolioId()) ?? null);
  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());
  readonly isFetchingPortfolio = computed(() => Boolean(this.portfolioId()) && !this.portfolio() && this.#store.isLoading());

  constructor() {
    effect(() => {
      if (this.#submitted() && this.commandStatus() === 'accepted' && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  onSubmit(portfolio: IStockPortfolioWritePayload): void {
    const id = this.portfolioId();
    if (!id) {
      return;
    }

    this.#submitted.set(true);
    this.#dispatch.updatePortfolio({ id, portfolio });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
