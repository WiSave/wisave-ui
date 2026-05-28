import { Component, computed, inject, type OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AccountBalanceCardsComponent } from '@features/expenses/components/account-balance-cards/account-balance-cards.component';
import { ExpensesTableComponent, type IExpenseFilterAppliedEvent } from '@features/expenses/components/expenses-table/expenses-table.component';
import { expensesPageEvents } from '@features/expenses/+store/expenses/expenses.events';
import { ExpensesStore } from '@features/expenses/+store/expenses/expenses.store';
import { injectDispatch } from '@ngrx/signals/events';

import { AppDialogComponent } from '@wisave/shared/ui';
import { type IPageNavigationEvent, type IPageSizeChangeEvent } from '@wisave/shared/model';

@Component({
  selector: 'app-expenses',
  imports: [ExpensesTableComponent, AccountBalanceCardsComponent, AppDialogComponent, RouterOutlet],
  template: `
    <div class="flex h-full min-w-0 flex-1 gap-8">
      <div class="flex min-w-0 flex-2 flex-col gap-4 2xl:flex-3">
        <app-expenses-table
          [isLoading]="isLoading()"
          [data]="expenses()"
          [totalRecords]="pagination().totalRecords"
          [rows]="pagination().rows"
          [currentPage]="pagination().currentPage"
          [pageInfo]="pagination().pageInfo"
          [categories]="availableCategories()"
          [accounts]="availableAccounts()"
          (navigatePage)="onNavigatePage($event)"
          (deleteClicked)="onDelete()"
          (editClicked)="onEdit()"
          (addClicked)="onAdd()"
          (pageSizeChange)="onPageSizeChange($event)"
          (filtersApplied)="onFilterApplied($event)"
          (filtersCleared)="onFiltersClear()" />
      </div>
      <div class="min-w-0 flex-1">
        <app-account-balance-cards [accounts]="availableAccounts()" />
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
export class ExpensesComponent implements OnInit {
  readonly #store = inject(ExpensesStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #dispatch = injectDispatch(expensesPageEvents);

  readonly isChildRouteActive = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#route.children.length > 0),
    ),
    { initialValue: false },
  );

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly pagination = computed(() => this.#store.pagination());
  readonly expenses = computed(() => this.#store.entities());
  readonly availableCategories = computed(() => this.#store.availableCategories());
  readonly availableAccounts = computed(() => this.#store.availableAccounts());

  ngOnInit(): void {
    this.#dispatch.opened();
  }

  onNavigatePage(event: IPageNavigationEvent): void {
    this.#dispatch.navigatePage({ direction: event.direction, cursor: event.cursor, pageSize: event.pageSize });
  }

  onDelete(): void {
    // Expense command endpoints were removed; this projection view is read-only.
  }

  onAdd(): void {
    // Expense command endpoints were removed; this projection view is read-only.
  }

  onEdit(): void {
    // Expense command endpoints were removed; this projection view is read-only.
  }

  onDialogClose(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route });
  }

  onPageSizeChange(event: IPageSizeChangeEvent): void {
    this.#dispatch.pageSizeChanged({ rows: event.rows });
  }

  onFilterApplied(event: IExpenseFilterAppliedEvent): void {
    this.#dispatch.filterApplied({ filter: event.filter });
  }

  onFiltersClear(): void {
    this.#dispatch.filtersCleared();
  }
}
