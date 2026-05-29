import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { injectDispatch } from '@ngrx/signals/events';
import { type IExpense } from '@wisave/shared/model';

import { expensesPageEvents } from '../+store/expenses/expenses.events';
import { ExpensesStore } from '../+store/expenses/expenses.store';
import { ExpenseEditFormComponent } from '../components/expense-edit-form/expense-edit-form.component';

@Component({
  selector: 'app-add-expense',
  imports: [ExpenseEditFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Add expense</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Create a new expense and save it.</p>
      </div>

      <app-expense-edit-form [expense]="null" [categories]="categories()" [accounts]="accounts()" [isLoading]="isBusy()" (submitted)="onSubmit($event)" (cancelled)="onCancel()" />
    </div>
  `,
})
export class AddExpenseComponent {
  readonly #store = inject(ExpensesStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(expensesPageEvents);

  readonly categories = computed(() => this.#store.availableCategories());
  readonly accounts = computed(() => this.#store.availableAccounts());
  readonly isBusy = computed(() => this.#store.isLoading() || this.#store.categoriesLoading() || this.#store.accountsLoading());

  constructor() {
    let wasLoading = false;
    effect(() => {
      const loading = this.#store.isLoading();
      if (wasLoading && !loading && !this.#store.error()) {
        this.#closeDialog();
      }
      wasLoading = loading;
    });
  }

  onSubmit(expense: Omit<IExpense, 'id'>): void {
    this.#dispatch.add({ expense });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
