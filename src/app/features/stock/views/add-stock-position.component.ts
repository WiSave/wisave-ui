import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Button } from 'primeng/button';

import { injectDispatch } from '@ngrx/signals/events';

import { stockPortfolioPageEvents } from '../+store/portfolio/stock-portfolio.events';
import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { StockPositionFormComponent } from '../components/stock-position-form/stock-position-form.component';
import { StockPortfolioService } from '../services/stock-portfolio.service';
import { type IStockBroker, type IStockPositionWritePayload } from '../types/stock-portfolio.types';

@Component({
  selector: 'app-add-stock-position',
  imports: [Button, StockPositionFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Add stock</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Add an open position to the selected portfolio.</p>
      </div>

      @if (selectedPortfolio()) {
        @if (brokerLoadError()) {
          <div class="border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700/40 dark:bg-warning-900/20 dark:text-warning-200 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span>{{ brokerLoadError() }}</span>
            <p-button [text]="true" (onClick)="loadBrokers()" label="Retry" severity="secondary" size="small" />
          </div>
        }
        <app-stock-position-form
          [portfolioId]="selectedPortfolio()!.id"
          [brokers]="brokers()"
          [position]="null"
          [isLoading]="isLoading()"
          [isBrokerLoading]="isBrokerLoading()"
          (submitted)="onSubmit($event)"
          (cancelled)="onCancel()" />
      } @else {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
          <i class="pi pi-folder-open text-secondary-300 dark:text-dark-secondary-500 text-xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Select a portfolio first</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">A stock position needs a portfolio destination.</p>
          <p-button (onClick)="onCancel()" label="Close" severity="secondary" size="small" />
        </div>
      }
    </div>
  `,
})
export class AddStockPositionComponent {
  readonly #store = inject(StockPortfolioStore);
  readonly #api = inject(StockPortfolioService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #dispatch = injectDispatch(stockPortfolioPageEvents);
  readonly #submitted = signal(false);

  readonly selectedPortfolio = computed(() => this.#store.selectedPortfolio());
  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());
  readonly brokers = signal<IStockBroker[]>([]);
  readonly isBrokerLoading = signal(false);
  readonly brokerLoadError = signal<string | null>(null);

  constructor() {
    this.loadBrokers();

    effect(() => {
      if (this.#submitted() && this.commandStatus() === 'accepted' && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  loadBrokers(): void {
    this.isBrokerLoading.set(true);
    this.brokerLoadError.set(null);

    this.#api
      .getBrokers()
      .pipe(
        finalize(() => this.isBrokerLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (brokers) => this.brokers.set(brokers),
        error: () => this.brokerLoadError.set('Unable to load brokers.'),
      });
  }

  onSubmit(position: IStockPositionWritePayload): void {
    this.#submitted.set(true);
    this.#dispatch.addPosition({ position });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
