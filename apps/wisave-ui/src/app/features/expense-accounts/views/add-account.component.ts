import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { accountsPageEvents } from '@features/expense-accounts/+store/accounts/accounts.events';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';
import { AccountFormComponent } from '@features/expense-accounts/components/account-form/account-form.component';
import { injectDispatch } from '@ngrx/signals/events';

import { type IExpenseAccountWritePayload } from '@core/types/expense-account.interface';

@Component({
  selector: 'app-add-account',
  imports: [AccountFormComponent],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Add account</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Create a new expense account.</p>
      </div>

      <app-account-form [account]="null" [bankAccounts]="bankAccounts()" [isLoading]="isLoading()" (submitted)="onSubmit($event)" (cancelled)="onCancel()" />
    </div>
  `,
})
export class AddAccountComponent {
  readonly #store = inject(ExpenseAccountsStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(accountsPageEvents);
  readonly #submitted = signal(false);

  readonly bankAccounts = computed(() => this.#store.entities().filter((a) => a.type === 'bank_account'));
  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());

  constructor() {
    effect(() => {
      const status = this.commandStatus();
      if (this.#submitted() && status === 'accepted' && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  onSubmit(account: IExpenseAccountWritePayload): void {
    this.#submitted.set(true);
    this.#dispatch.add({ account });
  }

  onCancel(): void {
    this.#closeDialog();
  }

  #closeDialog(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route.parent });
  }
}
