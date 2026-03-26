import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';

import { ConfirmationService } from 'primeng/api';
import { Button, ButtonDirective, ButtonIcon } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Ripple } from 'primeng/ripple';
import { TableModule } from 'primeng/table';

import type { IExpenseAccount } from '@core/types/expense-account.interface';
import type { IExpenseCategory } from '@core/types/expense-category.interface';
import type { ExpenseId } from '@core/types/expense-id.types';
import type { IExpense } from '@core/types/expense.interface';

import { Currency } from '@core/types';
import { ButtonBarDatepickerComponent } from '@shared/components/datepicker/button-bar-datepicker';
import { CursorPaginationComponent } from '@shared/components/pagination';
import { type IPageInfo, type IPageNavigationEvent, type IPageSizeChangeEvent } from '@shared/types';

import type { IExpensesFilter } from '../../types/expenses-state.types';

export interface IExpenseFilterAppliedEvent {
  filter: Partial<IExpensesFilter>;
}

@Component({
  selector: 'app-expenses-table',
  imports: [CurrencyPipe, DatePipe, Button, ButtonDirective, ButtonIcon, Chip, ConfirmPopupModule, Ripple, TableModule, ButtonBarDatepickerComponent, CursorPaginationComponent],
  providers: [ConfirmationService],
  templateUrl: './expenses-table.component.html',
  styles: `
    :host {
      display: flex;
      flex: 1;
    }
  `,
})
export class ExpensesTableComponent {
  readonly #confirmationService = inject(ConfirmationService);

  readonly #categoryMap = computed(() => {
    const map = new Map<string, IExpenseCategory>();
    for (const cat of this.categories()) {
      map.set(cat.id, cat);
    }
    return map;
  });

  readonly #accountMap = computed(() => {
    const map = new Map<string, IExpenseAccount>();
    for (const acc of this.accounts()) {
      map.set(acc.id, acc);
    }
    return map;
  });

  readonly isLoading = input.required<boolean>();
  readonly data = input.required<IExpense[]>();
  readonly totalRecords = input<number>(0);
  readonly rows = input<number>(10);
  readonly currentPage = input<number>(1);
  readonly pageInfo = input.required<IPageInfo>();
  readonly categories = input<IExpenseCategory[]>([]);
  readonly accounts = input<IExpenseAccount[]>([]);

  readonly navigatePage = output<IPageNavigationEvent>();
  readonly pageSizeChange = output<IPageSizeChangeEvent>();
  readonly filtersApplied = output<IExpenseFilterAppliedEvent>();
  readonly filtersCleared = output<void>();

  readonly editClicked = output<ExpenseId>();
  readonly deleteClicked = output<ExpenseId>();
  readonly addClicked = output<void>();

  readonly datesFilter = signal<Date[] | null>(
    (() => {
      const now = new Date();
      return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    })(),
  );

  readonly totalAmount = computed(() => this.data().reduce((sum, expense) => sum + expense.amount.amount, 0));
  readonly totalCurrency = computed(() => this.data()[0]?.amount.currency ?? Currency.PLN);

  getCategoryName(categoryId: string): string {
    return this.#categoryMap().get(categoryId)?.name ?? '';
  }

  getSubcategoryName(categoryId: string, subcategoryId: string | undefined): string {
    if (!subcategoryId) {
      return '';
    }
    const category = this.#categoryMap().get(categoryId);
    return category?.subcategories.find((s) => s.id === subcategoryId)?.name ?? '';
  }

  getAccountName(accountId: string): string {
    return this.#accountMap().get(accountId)?.name ?? '';
  }

  getAccountColor(accountId: string): string | null {
    return this.#accountMap().get(accountId)?.color ?? null;
  }

  onDatesFilterChange(dates: Date[] | null): void {
    this.datesFilter.set(dates);
  }

  filter(): void {
    const dates = this.datesFilter();

    if (!dates || dates.length === 0) {
      return;
    }

    this.filtersApplied.emit({
      filter: {
        dateRange: {
          from: dates?.[0] ?? null,
          to: dates?.[1] ?? null,
        },
      },
    });
  }

  clearFilters(): void {
    this.datesFilter.set(null);
    this.filtersCleared.emit();
  }

  addNewExpense(): void {
    this.addClicked.emit();
  }

  editExpense(_expense: IExpense): void {
    this.editClicked.emit(_expense.id);
  }

  onRowDelete(event: Event, expense: IExpense): void {
    this.#confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Delete "${expense.description}"?`,
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
        this.deleteClicked.emit(expense.id);
      },
    });
  }
}
