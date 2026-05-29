import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@wisave/platform/auth';

import { RegisterAccountStepComponent } from '../components/register-account-step/register-account-step.component';
import { RegisterPlanStepComponent } from '../components/register-plan-step/register-plan-step.component';
import { AVAILABLE_PLANS } from '../constants/plans.constant';
import { type IAccountStepData, type IPlan } from '../types/auth.types';

@Component({
  selector: 'app-register-view',
  host: { class: 'block w-full max-w-5xl px-4' },
  imports: [RouterLink, RegisterAccountStepComponent, RegisterPlanStepComponent],
  template: `
    <!-- Step indicator with labels -->
    <div class="mb-10 flex items-center justify-center">
      @for (step of steps; track step; let i = $index) {
        <div class="flex items-center">
          <div class="flex flex-col items-center gap-2">
            <div
              [class]="i <= currentStep() ? 'bg-accent-500 text-dark-primary-950 shadow-sm' : 'bg-secondary-200 dark:bg-dark-primary-700 text-secondary-500 dark:text-dark-secondary-400'"
              class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300">
              @if (i < currentStep()) {
                <i class="pi pi-check text-sm"></i>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span
              [class]="i <= currentStep() ? 'text-accent-600 dark:text-accent-400' : 'text-secondary-600 dark:text-dark-secondary-300'"
              class="text-[11px] font-semibold tracking-widest uppercase transition-colors">
              {{ step }}
            </span>
          </div>
          @if (i < steps.length - 1) {
            <div [class]="i < currentStep() ? 'bg-accent-500' : 'bg-secondary-200 dark:bg-dark-primary-700'" class="mx-4 mb-6 h-0.5 w-16 rounded-full transition-colors duration-300"></div>
          }
        </div>
      }
    </div>

    <!-- Card container -->
    <div
      [class]="currentStep() === 1 ? 'max-w-5xl' : 'max-w-3xl'"
      class="dark:bg-dark-primary-900 border-secondary-200 dark:border-dark-primary-700 mx-auto flex min-h-136 rounded-2xl border bg-white p-8 shadow-xl transition-all duration-300 sm:p-10">
      @switch (currentStep()) {
        @case (0) {
          <app-register-account-step [initialData]="accountData()" (completed)="onAccountCompleted($event)" />
        }
        @case (1) {
          <app-register-plan-step [plans]="plans" [selectedPlanId]="selectedPlan()?.id ?? null" [isLoading]="isLoading()" [error]="error()" (confirmed)="onConfirm($event)" (back)="onBack()" />
        }
      }
    </div>

    <div class="mt-6 text-center">
      <span class="text-secondary-500 dark:text-dark-secondary-400 text-sm">Already have an account? </span>
      <a
        [queryParams]="loginQueryParams()"
        class="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 text-sm font-semibold transition-colors"
        routerLink="/auth/login">
        Sign in
      </a>
    </div>
  `,
})
export class RegisterViewComponent {
  readonly #authService = inject(AuthService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly steps = ['Account', 'Plan'];
  readonly plans = AVAILABLE_PLANS;

  readonly currentStep = signal(0);
  readonly accountData = signal<IAccountStepData | null>(null);
  readonly selectedPlan = signal<IPlan | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  onAccountCompleted(data: IAccountStepData): void {
    this.accountData.set(data);
    this.currentStep.set(1);
  }

  onBack(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
  }

  onConfirm(plan: IPlan): void {
    const account = this.accountData();
    if (!account) return;

    this.selectedPlan.set(plan);
    this.isLoading.set(true);
    this.error.set(null);

    this.#authService.register({ ...account, planId: plan.id }).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.#router.navigateByUrl(this.returnUrl());
      },
      error: (err: { status?: number; error?: { errors?: string[]; message?: string } }) => {
        this.isLoading.set(false);
        if (err.status === 400) {
          this.error.set('Security validation expired. Please try again.');
          return;
        }

        this.error.set(err?.error?.errors?.join(' ') ?? err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }

  readonly returnUrl = () => this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/incomes';

  readonly loginQueryParams = () => {
    const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl ? { returnUrl } : {};
  };
}
