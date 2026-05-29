import { Component, effect, input, output, signal } from '@angular/core';

import { Button } from 'primeng/button';

import { type IPlan } from '../../types/auth.types';

@Component({
  selector: 'app-register-plan-step',
  host: { class: 'block w-full' },
  imports: [Button],
  template: `
    <div class="flex flex-col gap-8">
      <div class="text-center">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-2xl font-bold tracking-tight">Choose your plan</h2>
        <p class="text-secondary-600 dark:text-dark-secondary-300 mt-2 text-sm">Start free and upgrade anytime as your needs grow</p>
      </div>

      @if (error()) {
        <div class="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert" aria-live="polite">
          <i class="pi pi-exclamation-circle mt-0.5 text-base"></i>
          <span>{{ error() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        @for (plan of plans(); track plan.id) {
          <div
            [class]="
              (plan.recommended ? 'md:z-10 md:-my-4 md:py-4 ' : '') +
              (selected() === plan.id
                ? 'border-accent-500 bg-accent-50/60 dark:bg-accent-950/20 ring-accent-500/20 shadow-lg ring-1'
                : plan.recommended
                  ? 'border-accent-300 dark:border-accent-700 bg-secondary-50 dark:bg-dark-primary-800 hover:border-accent-400 dark:hover:border-accent-600 hover:shadow-lg'
                  : 'border-secondary-200 dark:border-dark-primary-700 bg-secondary-50 dark:bg-dark-primary-800 hover:border-secondary-300 dark:hover:border-dark-primary-600 hover:shadow-md')
            "
            (click)="onSelect(plan)"
            class="group relative flex cursor-pointer rounded-2xl border-2 transition-all duration-200">
            @if (plan.recommended) {
              <span class="bg-accent-500 text-dark-primary-950 absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase shadow-sm">
                Recommended
              </span>
            }

            <!-- Mobile: compact horizontal layout -->
            <div class="flex w-full items-center gap-4 p-4 md:hidden">
              <div
                [class]="plan.id === 'free' ? 'bg-secondary-200 dark:bg-dark-primary-700' : plan.id === 'pro' ? 'bg-accent-100 dark:bg-accent-900/30' : 'bg-accent-200 dark:bg-accent-800/30'"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <i
                  [class]="
                    plan.id === 'free'
                      ? 'pi-bolt text-secondary-600 dark:text-dark-secondary-300'
                      : plan.id === 'pro'
                        ? 'pi-star text-accent-600 dark:text-accent-400'
                        : 'pi-crown text-accent-700 dark:text-accent-300'
                  "
                  class="pi text-lg"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-secondary-900 dark:text-dark-secondary-50 text-base font-bold">{{ plan.name }}</h3>
                <div class="flex items-baseline gap-1">
                  @if (plan.price !== null) {
                    <span class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-extrabold">\${{ plan.price }}</span>
                    <span class="text-secondary-600 dark:text-dark-secondary-300 text-xs font-medium">/{{ plan.interval }}</span>
                  } @else {
                    <span class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-extrabold">Free</span>
                  }
                </div>
              </div>
              <div class="flex items-center">
                @if (selected() === plan.id) {
                  <i class="pi pi-check-circle text-accent-500 text-xl"></i>
                } @else {
                  <i class="pi pi-circle text-secondary-300 dark:text-dark-primary-600 text-xl"></i>
                }
              </div>
            </div>

            <!-- Desktop: full vertical card -->
            <div class="hidden w-full flex-col p-7 md:flex">
              <div class="mb-5 flex items-center gap-3">
                <div
                  [class]="plan.id === 'free' ? 'bg-secondary-200 dark:bg-dark-primary-700' : plan.id === 'pro' ? 'bg-accent-100 dark:bg-accent-900/30' : 'bg-accent-200 dark:bg-accent-800/30'"
                  class="flex h-10 w-10 items-center justify-center rounded-xl">
                  <i
                    [class]="
                      plan.id === 'free'
                        ? 'pi-bolt text-secondary-600 dark:text-dark-secondary-300'
                        : plan.id === 'pro'
                          ? 'pi-star text-accent-600 dark:text-accent-400'
                          : 'pi-crown text-accent-700 dark:text-accent-300'
                    "
                    class="pi text-lg"></i>
                </div>
                <h3 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-bold">{{ plan.name }}</h3>
              </div>

              <div class="mb-6 flex items-baseline gap-1">
                @if (plan.price !== null) {
                  <span class="text-secondary-900 dark:text-dark-secondary-50 text-4xl font-extrabold tracking-tight"> \${{ plan.price }} </span>
                  <span class="text-secondary-600 dark:text-dark-secondary-300 text-sm font-medium">/{{ plan.interval }}</span>
                } @else {
                  <span class="text-secondary-900 dark:text-dark-secondary-50 text-4xl font-extrabold tracking-tight">Free</span>
                  <span class="text-secondary-600 dark:text-dark-secondary-300 text-sm font-medium">forever</span>
                }
              </div>

              <ul class="mb-7 flex flex-1 flex-col gap-3">
                @for (feature of plan.features; track feature) {
                  <li class="text-secondary-700 dark:text-dark-secondary-200 flex items-start gap-2.5 text-sm leading-snug">
                    <i class="pi pi-check-circle text-accent-500 mt-0.5 text-sm"></i>
                    {{ feature }}
                  </li>
                }
              </ul>

              <p-button
                [label]="selected() === plan.id ? 'Selected' : 'Select plan'"
                [severity]="selected() === plan.id ? 'success' : 'secondary'"
                [outlined]="selected() !== plan.id"
                [icon]="selected() === plan.id ? 'pi pi-check' : ''"
                styleClass="w-full !py-2.5 !font-semibold" />
            </div>
          </div>
        }
      </div>

      <div class="flex items-center justify-between">
        <p-button [disabled]="isLoading()" (onClick)="back.emit()" label="Back" severity="secondary" outlined icon="pi pi-arrow-left" styleClass="!py-3 !font-semibold" />
        <p-button
          [loading]="isLoading()"
          [disabled]="!selected() || isLoading()"
          (onClick)="onConfirm()"
          label="Create account"
          severity="success"
          icon="pi pi-check"
          styleClass="!py-3 !font-semibold !text-white disabled:!cursor-not-allowed disabled:!opacity-50" />
      </div>
    </div>
  `,
})
export class RegisterPlanStepComponent {
  readonly plans = input.required<IPlan[]>();
  readonly selectedPlanId = input<string | null>(null);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<IPlan>();
  readonly back = output<void>();

  readonly selected = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.selected.set(this.selectedPlanId());
    });
  }

  onSelect(plan: IPlan): void {
    this.selected.set(plan.id);
  }

  onConfirm(): void {
    const selectedId = this.selected();
    if (!selectedId) return;

    const plan = this.plans().find((item) => item.id === selectedId);
    if (plan) this.confirmed.emit(plan);
  }
}
