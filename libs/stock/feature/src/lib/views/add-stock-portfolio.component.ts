import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { injectDispatch } from '@ngrx/signals/events';
import { type IStockPortfolioWritePayload } from '@wisave/stock/data-access';

import { stockPortfolioPageEvents } from '../+store/portfolio/stock-portfolio.events';
import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { StockPortfolioFormComponent } from '../components/stock-portfolio-form/stock-portfolio-form.component';

@Component({
  selector: 'app-add-stock-portfolio',
  imports: [StockPortfolioFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Add portfolio</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Create a portfolio workspace for a group of positions.</p>
      </div>

      <app-stock-portfolio-form [portfolio]="null" [isLoading]="isLoading()" (submitted)="onSubmit($event)" (cancelled)="onCancel()" submitLabel="Confirm" submitIcon="" />
    </div>
  `,
})
export class AddStockPortfolioComponent {
  readonly #store = inject(StockPortfolioStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(stockPortfolioPageEvents);
  readonly #submitted = signal(false);

  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());

  constructor() {
    effect(() => {
      if (this.#submitted() && this.commandStatus() === 'accepted' && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  onSubmit(portfolio: IStockPortfolioWritePayload): void {
    this.#submitted.set(true);
    this.#dispatch.addPortfolio({ portfolio });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
