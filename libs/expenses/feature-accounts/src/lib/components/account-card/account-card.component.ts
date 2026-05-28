import { Component, computed, input, output } from '@angular/core';

import { Button } from 'primeng/button';

import {
  type ExpenseAccountType,
  type IBankAccount,
  type ICashAccount,
  type IExpenseAccount,
} from '@wisave/shared/model';
import type { ExpenseAccountId } from '@wisave/shared/model';
import { createMoney, formatMoney } from '@wisave/shared/model';

const ACCOUNT_TYPE_LABELS: Record<ExpenseAccountType, string> = {
  bank_account: 'Funding Account',
  cash: 'Funding Account',
};

@Component({
  selector: 'app-account-card',
  imports: [Button],
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
  template: `
    <div
      [style.border-left-width]="'3px'"
      [style.border-left-color]="borderColor()"
      class="bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider relative flex h-44 flex-col overflow-hidden rounded-xl border p-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-0.5">
          <span class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-semibold">{{ account().name }}</span>
          <span class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] tracking-wider uppercase">{{ typeLabel() }} · {{ account().currency }}</span>
        </div>
        <div class="flex gap-0.5">
          <p-button [text]="true" (click)="editClicked.emit(account().id)" size="small" icon="pi pi-pencil" severity="secondary" ariaLabel="Edit" />
          <p-button [text]="true" (click)="deleteClicked.emit({ id: account().id, event: $event })" size="small" icon="pi pi-trash" severity="danger" ariaLabel="Delete" />
        </div>
      </div>
      <div class="mt-auto pt-3">
        <span class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-bold">{{ formattedBalance() }}</span>
        @if (paymentInstrumentCount() > 0) {
          <span class="text-secondary-500 dark:text-dark-secondary-400 mt-1 block text-xs">{{ paymentInstrumentCount() }} payment instruments</span>
        }
      </div>
    </div>
  `,
})
export class AccountCardComponent {
  readonly #withBalance = computed<IBankAccount | ICashAccount>(() => this.account());

  readonly account = input.required<IExpenseAccount>();
  readonly editClicked = output<ExpenseAccountId>();
  readonly deleteClicked = output<{ id: ExpenseAccountId; event: Event }>();

  readonly typeLabel = computed(() => ACCOUNT_TYPE_LABELS[this.account().type]);
  readonly borderColor = computed(() => this.account().color ?? 'hsl(215, 50%, 55%)');

  readonly paymentInstrumentCount = computed(() => this.#withBalance().paymentInstruments.length);

  readonly formattedBalance = computed(() => {
    const account = this.#withBalance();
    return formatMoney(createMoney(account.balance, account.currency));
  });
}
