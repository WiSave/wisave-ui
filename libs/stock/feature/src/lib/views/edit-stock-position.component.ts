import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs';

import { Button } from 'primeng/button';

import { injectDispatch } from '@ngrx/signals/events';

import { stockPortfolioPageEvents } from '../+store/portfolio/stock-portfolio.events';
import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { StockPositionFormComponent } from '../components/stock-position-form/stock-position-form.component';
import { StockPortfolioService } from '@wisave/stock/data-access';
import { type IStockBroker, type IStockPositionEditPayload, type IStockPositionWritePayload } from '@wisave/stock/data-access';

@Component({
  selector: 'app-edit-stock-position',
  imports: [Button, StockPositionFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Edit stock</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Update quantity, prices, and allocation metadata.</p>
      </div>

      @if (isFetchingPosition()) {
        <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
          <i class="pi pi-spinner pi-spin text-lg"></i>
          <span>Loading stock...</span>
        </div>
      } @else if (position()) {
        <app-stock-position-form
          [portfolioId]="position()!.portfolioId"
          [brokers]="brokers()"
          [position]="position()"
          [isLoading]="isLoading()"
          [isBrokerLoading]="isBrokerLoading()"
          (submitted)="onSubmit($event)"
          (cancelled)="onCancel()" />
      } @else {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
          <i class="pi pi-exclamation-triangle text-warning-500 text-xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Stock not found</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">This position is not available in the selected portfolio.</p>
          <p-button (onClick)="onCancel()" label="Close" severity="secondary" size="small" />
        </div>
      }
    </div>
  `,
})
export class EditStockPositionComponent {
  readonly #store = inject(StockPortfolioStore);
  readonly #api = inject(StockPortfolioService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #dispatch = injectDispatch(stockPortfolioPageEvents);
  readonly #submitted = signal(false);

  readonly positionId = toSignal(this.#route.paramMap.pipe(map((params) => params.get('id'))), { initialValue: null });
  readonly position = computed(() => this.#store.positions().find((item) => item.id === this.positionId()) ?? null);
  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());
  readonly isFetchingPosition = computed(() => Boolean(this.positionId()) && !this.position() && this.#store.isLoading());
  readonly brokers = signal<IStockBroker[]>([]);
  readonly isBrokerLoading = signal(false);

  constructor() {
    this.#loadBrokers();

    effect(() => {
      if (this.#submitted() && this.commandStatus() === 'accepted' && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  onSubmit(position: IStockPositionWritePayload): void {
    const id = this.positionId();
    if (!id) {
      return;
    }

    const editPosition: IStockPositionEditPayload = {
      portfolioId: position.portfolioId,
      symbol: position.symbol,
      name: position.name ?? '',
      isin: position.isin,
      quantity: position.quantity,
      currency: position.currency,
      averageCost: position.unitPrice,
      marketPrice: position.unitPrice,
      allocationGroup: position.allocationTag ?? 'Unassigned',
    };

    this.#submitted.set(true);
    this.#dispatch.updatePosition({ id, position: editPosition });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #loadBrokers(): void {
    this.isBrokerLoading.set(true);

    this.#api
      .getBrokers()
      .pipe(
        finalize(() => this.isBrokerLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({ next: (brokers) => this.brokers.set(brokers), error: () => this.brokers.set([]) });
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
