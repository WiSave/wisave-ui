import { Component, computed, inject, type OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { accountsPageEvents } from '@features/expense-accounts/+store/accounts/accounts.events';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';
import { AccountCardComponent } from '@features/expense-accounts/components/account-card/account-card.component';
import { EXPENSE_ACCOUNTS_ROUTES } from '@features/expense-accounts/constants/expense-accounts-routes.constant';
import { injectDispatch } from '@ngrx/signals/events';

import { isFundingAccount } from '@core/types/expense-account.interface';
import { type ExpenseAccountId } from '@core/types/expense-id.types';
import { AppDialogComponent } from '@shared/components/dialog';

@Component({
  selector: 'app-accounts',
  imports: [AccountCardComponent, AppDialogComponent, RouterOutlet, Button, ConfirmPopupModule],
  providers: [ConfirmationService],
  template: `
    <p-confirmpopup
      [pt]="{
        icon: { class: 'text-sm' },
        message: { class: 'text-sm font-normal' },
        footer: { class: 'gap-2' },
      }" />
    <div class="flex h-full min-w-0 flex-1 flex-col gap-6">
      <div class="flex items-center justify-end">
        <p-button (click)="onAdd()" label="Add account" icon="pi pi-plus" size="small" severity="success" />
      </div>

      @if (showInitialLoader()) {
        <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
          <i class="pi pi-spinner pi-spin text-lg"></i>
          <span>Loading accounts...</span>
        </div>
      } @else if (showLoadError()) {
        <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center">
          <i class="pi pi-exclamation-triangle text-warning-500 text-3xl"></i>
          <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">Unable to load accounts</div>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Try refreshing the projections and load the accounts again.</p>
          <p-button (click)="onRetry()" label="Retry" icon="pi pi-refresh" size="small" severity="secondary" />
        </div>
      } @else if (hasLoaded()) {
        <div class="border-secondary-200 dark:border-dark-divider bg-white/80 dark:bg-dark-primary-850/80 grid grid-cols-2 gap-3 rounded-xl border p-4">
          <div class="flex flex-col gap-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-wider">Liquid Funds</span>
            <span class="text-secondary-900 dark:text-dark-secondary-50 text-base font-semibold">{{ formattedLiquidFunds() }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-wider">Funding Accounts</span>
            <span class="text-secondary-900 dark:text-dark-secondary-50 text-base font-semibold">{{ accountsCount() }}</span>
          </div>
        </div>

        @if (entities().length === 0) {
          <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
            <i class="pi pi-wallet text-secondary-400 dark:text-dark-secondary-500 text-3xl"></i>
            <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">No accounts yet</div>
            <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Add your first account to start tracking expenses.</p>
          </div>
        } @else {
          <section class="flex flex-col gap-3">
            <h3 class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-wider">Funding Accounts</h3>
            <div class="grid grid-cols-2 gap-3">
              @for (account of fundingAccounts(); track account.id) {
                <app-account-card
                  [account]="account"
                  (editClicked)="onEdit($event)"
                  (deleteClicked)="onDelete($event)" />
              }
            </div>
          </section>
        }
      }
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
export class AccountsComponent implements OnInit {
  readonly #store = inject(ExpenseAccountsStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #dispatch = injectDispatch(accountsPageEvents);
  readonly #confirmationService = inject(ConfirmationService);

  readonly isChildRouteActive = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#route.children.length > 0),
    ),
    { initialValue: false },
  );

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly hasLoaded = computed(() => this.#store.hasLoaded());
  readonly error = computed(() => this.#store.error());
  readonly entities = computed(() => this.#store.entities());

  readonly fundingAccounts = computed(() => this.entities().filter(isFundingAccount));
  readonly accountsCount = computed(() => this.fundingAccounts().length);
  readonly liquidFunds = computed(() => this.fundingAccounts().reduce((sum, account) => sum + account.balance, 0));
  readonly formattedLiquidFunds = computed(() => this.liquidFunds().toLocaleString());

  ngOnInit(): void {
    this.#dispatch.opened();
  }

  showInitialLoader(): boolean {
    return this.isLoading() && !this.hasLoaded();
  }

  showLoadError(): boolean {
    return this.hasLoaded() && this.error() !== null;
  }

  onAdd(): void {
    void this.#router.navigate([EXPENSE_ACCOUNTS_ROUTES.ADD], { relativeTo: this.#route });
  }

  onRetry(): void {
    this.#dispatch.opened();
  }

  onEdit(id: ExpenseAccountId): void {
    void this.#router.navigate([EXPENSE_ACCOUNTS_ROUTES.EDIT, id], { relativeTo: this.#route });
  }

  onDelete(payload: { id: ExpenseAccountId; event: Event }): void {
    const account = this.entities().find((item) => item.id === payload.id);

    this.#confirmationService.confirm({
      target: payload.event.currentTarget as EventTarget,
      message: account ? `Remove "${account.name}"?` : 'Remove account?',
      icon: 'pi pi-trash',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
        size: 'small',
      },
      acceptButtonProps: {
        label: 'Remove',
        severity: 'danger',
        size: 'small',
      },
      accept: () => {
        this.#dispatch.remove({ id: payload.id });
      },
    });
  }

  onDialogClose(): void {
    void this.#router.navigate(['.'], { relativeTo: this.#route });
  }
}
