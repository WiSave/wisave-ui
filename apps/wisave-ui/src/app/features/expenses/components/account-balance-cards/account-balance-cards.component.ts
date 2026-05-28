import { Component, computed, input } from '@angular/core';

import type { IExpenseAccount } from '@core/types/expense-account.interface';
import { createMoney, formatMoney } from '@core/types/money.interface';

@Component({
  selector: 'app-account-balance-cards',
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-secondary-500 dark:text-dark-secondary-400 text-xs font-semibold uppercase tracking-wider">Account Balances</span>

      @for (account of topLevelAccounts(); track account.id) {
        <div
          class="bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider rounded-xl border p-3"
          [style.border-left-width]="'3px'"
          [style.border-left-color]="account.color ?? 'hsl(215, 14%, 46%)'">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-semibold">{{ account.name }}</div>
              <div class="text-secondary-500 dark:text-dark-secondary-400 text-xs">{{ typeLabel(account.type) }}</div>
            </div>
            <div class="text-secondary-900 dark:text-dark-secondary-50 text-base font-bold">{{ formatBalance(account) }}</div>
          </div>
        </div>
      } @empty {
        <div class="text-secondary-500 dark:text-dark-secondary-400 py-4 text-center text-sm">No accounts configured</div>
      }
    </div>
  `,
})
export class AccountBalanceCardsComponent {
  readonly accounts = input.required<IExpenseAccount[]>();

  readonly topLevelAccounts = computed(() =>
    this.accounts().filter((a) => a.type === 'bank_account' || a.type === 'cash'),
  );

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      bank_account: 'Funding Account',
      cash: 'Funding Account',
    };
    return labels[type] ?? type;
  }

  formatBalance(account: IExpenseAccount): string {
    return formatMoney(createMoney(account.balance, account.currency));
  }
}
