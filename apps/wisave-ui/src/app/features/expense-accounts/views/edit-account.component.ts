import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { Button } from 'primeng/button';

import { accountsPageEvents } from '@features/expense-accounts/+store/accounts/accounts.events';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';
import { AccountFormComponent } from '@features/expense-accounts/components/account-form/account-form.component';
import { injectDispatch } from '@ngrx/signals/events';

import { type IExpenseAccountWritePayload } from '@core/types/expense-account.interface';
import { asExpenseAccountId } from '@core/types/expense-id.types';

@Component({
  selector: 'app-edit-account',
  imports: [AccountFormComponent, Button],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Edit account</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Update account details and save your changes.</p>
      </div>

      @if (isFetchingAccount()) {
        <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
          <i class="pi pi-spinner pi-spin text-lg"></i>
          <span>Loading account...</span>
        </div>
      } @else if (account()) {
        <app-account-form [account]="account()" [bankAccounts]="bankAccounts()" [isLoading]="isLoading()" (submitted)="onSubmit($event)" (cancelled)="onCancel()" />
      } @else {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
          <i class="pi pi-exclamation-triangle text-warning-500 text-xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Account not found</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">This account might have been removed or is not available.</p>
          <p-button (click)="onCancel()" label="Close" severity="secondary" />
        </div>
      }
    </div>
  `,
})
export class EditAccountComponent {
  readonly #store = inject(ExpenseAccountsStore);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #dispatch = injectDispatch(accountsPageEvents);
  readonly #submitted = signal(false);

  readonly accountId = toSignal(
    this.#route.paramMap.pipe(
      map((params) => params.get('id')),
      map((id) => (id ? asExpenseAccountId(id) : null)),
    ),
    { initialValue: null },
  );

  readonly account = computed(() => this.#store.selectedAccount());

  readonly bankAccounts = computed(() => this.#store.entities().filter((a) => a.type === 'bank_account'));
  readonly isLoading = computed(() => this.#store.commandStatus() === 'submitting');
  readonly commandStatus = computed(() => this.#store.commandStatus());
  readonly isFetchingAccount = computed(() => Boolean(this.accountId()) && !this.account() && this.#store.isLoading());

  constructor() {
    effect(() => {
      const id = this.accountId();
      this.#submitted.set(false);
      if (id) {
        this.#dispatch.selectAccount({ id });
      }
    });

    effect(() => {
      const status = this.commandStatus();
      if (status === 'accepted' && this.#submitted() && !this.#store.error()) {
        this.#closeDialog();
      }
    });
  }

  onSubmit(changes: IExpenseAccountWritePayload): void {
    const id = this.accountId();

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
