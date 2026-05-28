import { Component, computed, inject, type OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { TableModule } from 'primeng/table';

import { IncomesTableComponent, type IFilterAppliedEvent } from '../components/incomes-table/incomes-table.component';
import { MonthlyIncomeChartComponent } from '../components/monthly-income-chart/monthly-income-chart.component';
import { INCOMES_ROUTES } from '../constants/incomes-routes.constant';
import { incomesPageEvents } from '../+store/incomes/incomes.events';
import { IncomesStatsStore } from '../+store/stats/incomes-stats.store';
import { IncomesStore } from '../+store/incomes/incomes.store';
import { injectDispatch } from '@ngrx/signals/events';

import { ChartCardComponent } from '@wisave/shared/ui';
import { AppDialogComponent } from '@wisave/shared/ui';
import { SegmentedToggleComponent, type ISegmentedToggleOption } from '@wisave/shared/ui';
import { StatGroupComponent } from '@wisave/shared/ui';
import { formatAmount } from '@wisave/shared/ui';
import { type IPageNavigationEvent, type IPageSizeChangeEvent, type IStatItem } from '@wisave/shared/model';

import { type IncomeId } from '@wisave/incomes/data-access';

@Component({
  selector: 'app-incomes',
  imports: [TableModule, SegmentedToggleComponent, IncomesTableComponent, StatGroupComponent, ChartCardComponent, MonthlyIncomeChartComponent, AppDialogComponent, RouterOutlet],
  template: `
    <div class="flex h-full min-w-0 flex-1 gap-8 p-4">
      <div class="flex min-w-0 flex-2 flex-col gap-4 2xl:flex-3">
        <div class="flex items-start justify-between gap-4">
          <header class="space-y-1">
            <p class="text-secondary-500 dark:text-dark-secondary-400 text-xs font-semibold uppercase tracking-[0.24em]">Incomes</p>
          </header>
          <app-segmented-toggle [options]="statsScopeOptions" [value]="statsScope()" (valueChange)="onStatsScopeChange($event)" />
        </div>
        <app-stat-group [items]="statItems()" />
        <app-incomes-table
          [isLoading]="isLoading()"
          [data]="incomes()"
          [totalRecords]="pagination().totalRecords"
          [rows]="pagination().rows"
          [currentPage]="pagination().currentPage"
          [pageInfo]="pagination().pageInfo"
          (navigatePage)="onNavigatePage($event)"
          (editClicked)="onEdit($event)"
          (importClicked)="onImport()"
          (addClicked)="onAdd()"
          (pageSizeChange)="onPageSizeChange($event)"
          (filtersApplied)="onFilterApplied($event)"
          (filtersCleared)="onFiltersClear()" />
      </div>
      <div class="min-w-0 flex-1">
        @defer (on viewport) {
          <app-chart-card title="Yearly income">
            <app-monthly-income-chart
              [stats]="monthlyStats()"
              [loading]="monthlyStatsLoading()"
              [year]="monthlyStatsYear()"
              (navigate)="onMonthlyStatsYearChange($event)" />
          </app-chart-card>
        } @placeholder {
          <div class="bg-white dark:bg-dark-primary-850 border border-secondary-200 dark:border-dark-divider rounded-2xl shadow-xs h-72 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-secondary-400 text-xl"></i>
          </div>
        }
      </div>
    </div>
    <app-dialog [visible]="isChildRouteActive()" (visibleChange)="onDialogClose()">
      <router-outlet></router-outlet>
    </app-dialog>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class IncomesComponent implements OnInit {
  readonly #store = inject(IncomesStore);
  readonly #statsStore = inject(IncomesStatsStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #dispatch = injectDispatch(incomesPageEvents);

  readonly isChildRouteActive = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#route.children.length > 0),
    ),
    { initialValue: false },
  );

  readonly statsScopeOptions: ISegmentedToggleOption[] = [
    { label: 'Recurring', value: 'recurring' },
    { label: 'All', value: 'all' },
  ];


  readonly isLoading = computed(() => this.#store.isLoading());
  readonly pagination = computed(() => this.#store.pagination());
  readonly incomes = computed(() => this.#store.entities());
  readonly statsScope = computed(() => this.#statsStore.statsScope());
  readonly monthlyStats = computed(() => this.#statsStore.monthlyStats());
  readonly monthlyStatsLoading = computed(() => this.#statsStore.monthlyStatsLoading());
  readonly monthlyStatsYear = computed(() => this.#statsStore.monthlyStatsYear());

  readonly statItems = computed((): IStatItem[] => {
    const stats = this.#statsStore.stats();

    if (!stats) {
      return [];
    }

    const lastYear = new Date().getFullYear() - 1;
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

    return [
      {
        title: 'Last year',
        value: formatAmount(stats.lastYearTotal),
        description: `total ${lastYear}`,
      },
      {
        title: 'This year',
        value: formatAmount(stats.thisYearTotal),
        description: 'year to date',
      },
      {
        title: 'This month',
        value: formatAmount(stats.thisMonthTotal),
        description: currentMonth,
      },
      {
        title: 'Avg last 3 months',
        value: formatAmount(stats.last3MonthsAverage),
        description: 'full months only',
      },
      {
        title: 'Avg last year',
        value: formatAmount(stats.lastYearMonthlyAverage),
        description: `monthly avg ${lastYear}`,
      },
    ];
  });

  ngOnInit(): void {
    this.#dispatch.opened();
  }

  onNavigatePage(event: IPageNavigationEvent): void {
    this.#dispatch.navigatePage({ direction: event.direction, cursor: event.cursor, pageSize: event.pageSize });
  }

  onAdd(): void {
    void this.#router.navigate([INCOMES_ROUTES.ADD], { relativeTo: this.#route });
  }

  onImport(): void {
    void this.#router.navigate([INCOMES_ROUTES.IMPORT], { relativeTo: this.#route });
  }

  onEdit(id: IncomeId): void {
    void this.#router.navigate([INCOMES_ROUTES.EDIT, id], { relativeTo: this.#route });
  }

  onDialogClose(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route });
  }

  onPageSizeChange(event: IPageSizeChangeEvent): void {
    this.#dispatch.pageSizeChanged({ rows: event.rows });
  }

  onFilterApplied(event: IFilterAppliedEvent): void {
    this.#dispatch.filterApplied({ filter: event.filter });
  }

  onFiltersClear(): void {
    this.#dispatch.filtersCleared();
  }

  onStatsScopeChange(scope: string): void {
    if (scope !== 'recurring' && scope !== 'all') {
      return;
    }

    if (this.statsScope() === scope) {
      return;
    }

    this.#dispatch.statsScopeChanged({ scope });
  }

  onMonthlyStatsYearChange(direction: 'back' | 'forward'): void {
    this.#dispatch.monthlyStatsYearChanged({ direction });
  }
}
