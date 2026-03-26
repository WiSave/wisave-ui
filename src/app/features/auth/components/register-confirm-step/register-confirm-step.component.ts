import { Component, input, output } from '@angular/core';

import { Button } from 'primeng/button';

import { type IAccountStepData, type IPlan } from '../../types/auth.types';

@Component({
  selector: 'app-register-confirm-step',
  host: { class: 'block w-full' },
  imports: [Button],
  template: `
    <div class="flex flex-col gap-8">
      <div class="text-center">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-2xl font-bold tracking-tight">Almost there</h2>
        <p class="text-secondary-600 dark:text-dark-secondary-300 mt-2 text-sm">Review your details before creating your account</p>
      </div>

      <div class="min-h-18" aria-live="polite">
        @if (error()) {
          <div class="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
            <i class="pi pi-exclamation-circle mt-0.5 text-base"></i>
            <span>{{ error() }}</span>
          </div>
        }
      </div>

      <div class="border-secondary-200 dark:border-dark-primary-700 flex flex-col gap-0 overflow-hidden rounded-xl border">
        <!-- Account section -->
        <div class="bg-secondary-100/60 dark:bg-dark-primary-800 flex items-center gap-4 p-5">
          <div class="bg-accent-100 dark:bg-accent-900/30 flex h-11 w-11 items-center justify-center rounded-xl">
            <i class="pi pi-user text-accent-600 dark:text-accent-400 text-lg"></i>
          </div>
          <div class="flex-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold tracking-widest uppercase">Account</span>
            <p class="text-secondary-900 dark:text-dark-secondary-50 mt-0.5 text-sm font-semibold">{{ accountData().name }}</p>
            <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">{{ accountData().email }}</p>
          </div>
        </div>

        <div class="border-secondary-200 dark:border-dark-primary-700 border-t"></div>

        <!-- Plan section -->
        <div class="bg-secondary-100/60 dark:bg-dark-primary-800 flex items-center gap-4 p-5">
          <div class="bg-accent-100 dark:bg-accent-900/30 flex h-11 w-11 items-center justify-center rounded-xl">
            <i class="pi pi-credit-card text-accent-600 dark:text-accent-400 text-lg"></i>
          </div>
          <div class="flex-1">
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold tracking-widest uppercase">Plan</span>
            <div class="mt-0.5 flex items-baseline gap-2">
              <p class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-semibold">{{ selectedPlan().name }}</p>
              @if (selectedPlan().price !== null) {
                <span class="text-accent-600 dark:text-accent-400 text-sm font-semibold"> \${{ selectedPlan().price }}/{{ selectedPlan().interval }} </span>
              } @else {
                <span class="bg-secondary-200 dark:bg-dark-primary-700 text-secondary-600 dark:text-dark-secondary-300 rounded-md px-2 py-0.5 text-xs font-semibold"> Free </span>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="mt-auto flex gap-3">
        <p-button [disabled]="isLoading()" (onClick)="back.emit()" label="Back" severity="secondary" icon="pi pi-arrow-left" styleClass="flex-1 !py-3 !font-semibold" />
        <p-button [loading]="isLoading()" [disabled]="isLoading()" (onClick)="confirmed.emit()" label="Create account" severity="success" icon="pi pi-check" styleClass="flex-1 !py-3 !font-semibold !text-white disabled:!cursor-not-allowed disabled:!opacity-50" />
      </div>
    </div>
  `,
})
export class RegisterConfirmStepComponent {
  readonly accountData = input.required<IAccountStepData>();
  readonly selectedPlan = input.required<IPlan>();
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<void>();
  readonly back = output<void>();
}
