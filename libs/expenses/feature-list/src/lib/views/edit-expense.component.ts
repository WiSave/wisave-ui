import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { Button } from 'primeng/button';

import { ExpenseEditFormComponent } from '../components/expense-edit-form/expense-edit-form.component';
import { expensesPageEvents } from '../+store/expenses/expenses.events';
import { ExpensesStore } from '../+store/expenses/expenses.store';
import { asExpenseId } from '@wisave/shared/model';
import { type IExpense } from '@wisave/shared/model';
import { injectDispatch } from '@ngrx/signals/events';

@Component({
  selector: 'app-edit-expense',
  imports: [ExpenseEditFormComponent, Button],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Edit expense</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Update expense details and save your changes.</p>
      </div>

      @if (isFetchingExpense()) {
        <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
          <i class="pi pi-spinner pi-spin text-lg"></i>
          <span>Loading expense...</span>
        </div>
      } @else if (expense()) {
        <app-expense-edit-form
          [expense]="expense()"
          [categories]="categories()"
          [accounts]="accounts()"
          [isLoading]="isBusy()"
          (submitted)="onSubmit($event)"
          (cancelled)="onCancel()" />
      } @else {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
          <i class="pi pi-exclamation-triangle text-warning-500 text-xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Expense not found</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">This expense might have been removed or is not available.</p>
          <p-button (click)="onCancel()" label="Close" severity="secondary" />
        </div>
      }
    </div>
  `,
})
export class EditExpenseComponent {
  readonly #store = inject(ExpensesStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(expensesPageEvents);
  readonly #submitted = signal(false);

  readonly expenseId = toSignal(
    this.#route.paramMap.pipe(
      map((params) => params.get('id')),
      map((id) => (id ? asExpenseId(id) : null)),
    ),
    { initialValue: null },
  );

  readonly expense = computed(() => this.#store.selectedExpense());
  readonly categories = computed(() => this.#store.availableCategories());
  readonly accounts = computed(() => this.#store.availableAccounts());
  readonly isBusy = computed(() => this.#store.isLoading() || this.#store.categoriesLoading() || this.#store.accountsLoading());
  readonly isFetchingExpense = computed(() => Boolean(this.expenseId()) && !this.expense() && this.isBusy());

  constructor() {
    effect(() => {
      const id = this.expenseId();
      if (id) {
        this.#dispatch.selectExpense({ id });
      }
    });

    let wasLoading = false;
    effect(() => {
      const loading = this.#store.isLoading();
      if (wasLoading && !loading && this.#submitted() && !this.#store.error()) {
        this.#closeDialog();
      }
      wasLoading = loading;
    });
  }

  onSubmit(changes: Omit<IExpense, 'id'>): void {
    const id = this.expenseId();

    if (!id) {
      return;
    }

    this.#submitted.set(true);
    this.#dispatch.update({ id, changes });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
