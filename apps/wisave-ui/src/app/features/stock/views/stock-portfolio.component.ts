import { Component, computed, inject, type OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { injectDispatch } from '@ngrx/signals/events';

import { formatMoney, type IMoney } from '@core/types';
import { AppDialogComponent } from '@shared/components/dialog';
import { StatusCardComponent } from '@shared/components/status-card';

import { stockPortfolioPageEvents } from '../+store/portfolio/stock-portfolio.events';
import { StockPortfolioStore } from '../+store/portfolio/stock-portfolio.store';
import { StockAllocationPanelComponent } from '../components/stock-allocation-panel/stock-allocation-panel.component';
import { StockPerformanceChartComponent } from '../components/stock-performance-chart/stock-performance-chart.component';
import { StockPositionsTableComponent } from '../components/stock-positions-table/stock-positions-table.component';
import { type StockChartScope, type StockPortfolioId, type StockPositionId } from '../types/stock-portfolio.types';

interface IPortfolioSummaryItem {
  label: string;
  value: string;
  detail: string;
  tone: 'default' | 'positive' | 'negative';
}

@Component({
  selector: 'app-stock-portfolio',
  imports: [Button, ConfirmPopupModule, RouterOutlet, AppDialogComponent, StatusCardComponent, StockPerformanceChartComponent, StockAllocationPanelComponent, StockPositionsTableComponent],
  providers: [ConfirmationService],
  template: `
    <p-confirmpopup
      [pt]="{
        icon: { class: 'text-sm' },
        message: { class: 'text-sm font-normal' },
        footer: { class: 'gap-2' },
      }" />
    <div data-testid="stock-portfolio-workspace" class="flex h-full min-w-0 flex-1 flex-col gap-4 overflow-x-auto">
      @if (isInitialLoading()) {
        <div class="flex min-h-72 items-center justify-center gap-3">
          <i class="pi pi-spin pi-spinner text-secondary-400 text-xl"></i>
          <span class="text-secondary-500 dark:text-dark-secondary-300 text-sm font-medium">Loading portfolio workspace...</span>
        </div>
      } @else if (error()) {
        <app-status-card
          [description]="loadFailureDescription"
          (actionClicked)="onReload()"
          cardTestId="stock-portfolio-status-card"
          title="Unable to load portfolio"
          icon="pi pi-exclamation-triangle"
          iconTone="warning"
          actionLabel="Retry" />
      } @else if (hasNoPortfolioData()) {
        <app-status-card
          (actionClicked)="onAddPortfolio()"
          cardTestId="stock-portfolio-status-card"
          title="No portfolio data"
          description="No portfolios were returned for the current user."
          icon="pi pi-folder-open"
          actionLabel="Add first portfolio"
          actionIcon="pi pi-folder-plus"
          actionSeverity="success" />
      } @else {
        <section class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 rounded-lg border bg-white p-3">
          <div class="flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
              <span class="text-secondary-500 dark:text-dark-secondary-400 shrink-0 text-xs font-semibold tracking-[0.18em] uppercase">Portfolios</span>
              <div class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-900 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border bg-white p-0.5">
                @for (portfolio of portfolios(); track portfolio.id) {
                  <button
                    [class.bg-secondary-900]="selectedPortfolioId() === portfolio.id"
                    [class.text-white]="selectedPortfolioId() === portfolio.id"
                    [class.text-secondary-600]="selectedPortfolioId() !== portfolio.id"
                    [class.dark:bg-dark-secondary-100]="selectedPortfolioId() === portfolio.id"
                    [class.dark:text-dark-primary-950]="selectedPortfolioId() === portfolio.id"
                    [class.dark:text-dark-secondary-300]="selectedPortfolioId() !== portfolio.id"
                    (click)="onPortfolioSelected(portfolio.id)"
                    class="rounded-full px-3 py-1.5 text-left text-xs font-semibold transition"
                    type="button">
                    <span class="block max-w-40 truncate">{{ portfolio.name }}</span>
                  </button>
                } @empty {
                  <span class="text-secondary-500 dark:text-dark-secondary-300 px-3 py-1.5 text-xs">No portfolios</span>
                }
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              @if (selectedPortfolio()) {
                <p-button [text]="true" (onClick)="onEditPortfolio()" label="Edit Portfolio" icon="pi pi-pencil" severity="secondary" size="small" />
                <p-button [text]="true" (onClick)="onDeletePortfolio($event)" label="Delete Portfolio" icon="pi pi-trash" severity="danger" size="small" />
              }
              <p-button (onClick)="onAddPortfolio()" label="New Portfolio" icon="pi pi-folder-plus" severity="success" size="small" />
            </div>
          </div>
        </section>

        <section class="grid shrink-0 grid-cols-4 gap-3">
          @for (item of summaryItems(); track item.label) {
            <div class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850 rounded-lg border bg-white p-4">
              <p class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-[0.16em] uppercase">{{ item.label }}</p>
              <p
                [class.text-secondary-950]="item.tone === 'default'"
                [class.dark:text-dark-secondary-50]="item.tone === 'default'"
                [class.text-success-600]="item.tone === 'positive'"
                [class.text-danger-600]="item.tone === 'negative'"
                class="mt-2 text-xl font-semibold">
                {{ item.value }}
              </p>
              <p class="text-secondary-500 dark:text-dark-secondary-400 mt-1 text-xs">{{ item.detail }}</p>
            </div>
          }
        </section>

        <section class="grid min-h-[22rem] min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_20rem] gap-4">
          <app-stock-performance-chart [positions]="chartPositions()" [scope]="chartScope()" (scopeChanged)="onChartScopeChanged($event)" (selectionCleared)="onChartSelectionCleared()" />
          <app-stock-allocation-panel [items]="allocationItems()" />
        </section>

        <app-stock-positions-table
          [positions]="selectedPortfolioPositions()"
          [chartPositionIds]="chartPositionIds()"
          (addPosition)="onAddPosition()"
          (chartPositionToggled)="onChartPositionToggled($event)"
          (editPosition)="onEditPosition($event)" />
      }
    </div>

    <app-dialog [visible]="isChildRouteActive()" [style]="{ width: 'min(56rem, 92vw)' }" (visibleChange)="onDialogClose()">
      <router-outlet></router-outlet>
    </app-dialog>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
    }
  `,
})
export class StockPortfolioComponent implements OnInit {
  readonly #store = inject(StockPortfolioStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #dispatch = injectDispatch(stockPortfolioPageEvents);
  readonly #confirmationService = inject(ConfirmationService);

  readonly isChildRouteActive = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.children.length > 0),
    ),
    { initialValue: false },
  );

  readonly portfolios = computed(() => this.#store.portfolios());
  readonly selectedPortfolio = computed(() => this.#store.selectedPortfolio());
  readonly selectedPortfolioId = computed(() => this.selectedPortfolio()?.id ?? null);
  readonly selectedPortfolioPositions = computed(() => this.#store.selectedPortfolioPositions());
  readonly chartPositions = computed(() => this.#store.chartPositions());
  readonly chartScope = computed(() => this.#store.chartScope());
  readonly chartPositionIds = computed(() => this.#store.chartPositionIds());
  readonly allocationItems = computed(() => this.#store.allocationItems());
  readonly isInitialLoading = computed(() => this.#store.isLoading() && !this.#store.hasLoaded());
  readonly error = computed(() => this.#store.error());
  readonly hasNoPortfolioData = computed(() => this.#store.hasLoaded() && !this.error() && this.portfolios().length === 0);
  readonly loadFailureDescription = 'Try refreshing the portfolio data and load the portfolios again.';

  readonly summaryItems = computed<IPortfolioSummaryItem[]>(() => {
    const portfolio = this.selectedPortfolio();

    if (!portfolio) {
      return [
        { label: 'Value', value: '-', detail: 'No portfolio selected', tone: 'default' },
        { label: 'Unrealized P/L', value: '-', detail: 'Open positions', tone: 'default' },
        { label: 'Realized P/L', value: '-', detail: 'Current tax year', tone: 'default' },
        { label: 'Positions', value: '0', detail: 'Open holdings', tone: 'default' },
      ];
    }

    const positions = this.selectedPortfolioPositions();

    return [
      { label: 'Value', value: this.#formatMoney(portfolio.totalValue), detail: `${positions.length} open holdings`, tone: 'default' },
      {
        label: 'Unrealized P/L',
        value: this.#formatMoney(portfolio.unrealizedProfitLoss),
        detail: 'Marked to market',
        tone: this.#moneyTone(portfolio.unrealizedProfitLoss),
      },
      {
        label: 'Realized P/L',
        value: this.#formatMoney(portfolio.realizedProfitLoss),
        detail: `Tax year ${portfolio.taxYear}`,
        tone: this.#moneyTone(portfolio.realizedProfitLoss),
      },
      { label: 'Positions', value: String(positions.length), detail: 'Visible in table', tone: 'default' },
    ];
  });

  ngOnInit(): void {
    this.#dispatch.opened();
  }

  onReload(): void {
    this.#dispatch.opened();
  }

  onPortfolioSelected(id: StockPortfolioId): void {
    this.#dispatch.portfolioSelected({ id });
  }

  onChartScopeChanged(scope: StockChartScope): void {
    this.#dispatch.chartScopeChanged({ scope });
  }

  onChartPositionToggled(id: StockPositionId): void {
    this.#dispatch.chartPositionToggled({ id });
  }

  onChartSelectionCleared(): void {
    this.#dispatch.chartSelectionCleared();
  }

  onAddPortfolio(): void {
    void this.#router.navigate(['portfolios', 'add'], { relativeTo: this.#route });
  }

  onEditPortfolio(): void {
    const portfolio = this.selectedPortfolio();
    if (!portfolio) {
      return;
    }

    void this.#router.navigate(['portfolios', portfolio.id, 'edit'], { relativeTo: this.#route });
  }

  onDeletePortfolio(event: Event): void {
    const portfolio = this.selectedPortfolio();
    if (!portfolio) {
      return;
    }

    this.#confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Delete "${portfolio.name}"?`,
      icon: 'pi pi-trash',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
        size: 'small',
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
        size: 'small',
      },
      accept: () => {
        this.#dispatch.deletePortfolio({ id: portfolio.id });
      },
    });
  }

  onAddPosition(): void {
    void this.#router.navigate(['positions', 'add'], { relativeTo: this.#route });
  }

  onEditPosition(id: StockPositionId): void {
    void this.#router.navigate(['positions', id, 'edit'], { relativeTo: this.#route });
  }

  onDialogClose(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route });
  }

  #formatMoney(value: IMoney): string {
    return formatMoney(value);
  }

  #moneyTone(value: IMoney): IPortfolioSummaryItem['tone'] {
    if (value.amount > 0) {
      return 'positive';
    }

    if (value.amount < 0) {
      return 'negative';
    }

    return 'default';
  }
}
