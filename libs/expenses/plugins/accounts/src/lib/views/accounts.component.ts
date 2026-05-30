import { Component, computed, inject, type OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { injectDispatch } from '@ngrx/signals/events';
import { isFundingAccount, type ExpenseAccountId } from '@wisave/shared/model';
import { AppDialogComponent, StatusCardComponent } from '@wisave/shared/ui';

import { accountsPageEvents } from '../+store/accounts/accounts.events';
import { ExpenseAccountsStore } from '../+store/accounts/accounts.store';
import { AccountCardComponent } from '../components/account-card/account-card.component';
import { EXPENSE_ACCOUNTS_ROUTES } from '../constants/expense-accounts-routes.constant';

@Component({
  selector: 'app-accounts',
  imports: [AccountCardComponent, AppDialogComponent, RouterOutlet, Button, ConfirmPopupModule, StatusCardComponent],
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
        <app-status-card
          (actionClicked)="onRetry()"
          title="Unable to load accounts"
          description="Try refreshing the projections and load the accounts again."
          icon="pi pi-exclamation-triangle"
          iconTone="warning"
          actionLabel="Retry" />
      } @else if (hasLoaded()) {
        <div class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850/80 grid grid-cols-2 gap-3 rounded-xl border bg-white/80 p-4">
          <div class="flex flex-col gap-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-wider uppercase">Liquid Funds</span>
            <span class="text-secondary-900 dark:text-dark-secondary-50 text-base font-semibold">{{ formattedLiquidFunds() }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-wider uppercase">Funding Accounts</span>
            <span class="text-secondary-900 dark:text-dark-secondary-50 text-base font-semibold">{{ accountsCount() }}</span>
          </div>
        </div>

        @if (entities().length === 0) {
          <app-status-card title="No accounts yet" description="Add your first account to start tracking expenses." icon="pi pi-wallet" />
        } @else {
          <section class="flex flex-col gap-3">
            <h3 class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-wider uppercase">Funding Accounts</h3>
            <div class="grid grid-cols-2 gap-3">
              @for (account of fundingAccounts(); track account.id) {
                <app-account-card [account]="account" (editClicked)="onEdit($event)" (deleteClicked)="onDelete($event)" />
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
