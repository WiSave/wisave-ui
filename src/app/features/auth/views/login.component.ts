import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth/auth.service';

import { LoginFormComponent } from '../components/login-form/login-form.component';

@Component({
  selector: 'app-login-view',
  host: { class: 'block w-full max-w-3xl px-4' },
  imports: [RouterLink, LoginFormComponent],
  template: `
    <div class="bg-white dark:bg-dark-primary-900 border-secondary-200 dark:border-dark-primary-700 rounded-2xl border p-8 shadow-xl sm:p-10">
      <app-login-form [isLoading]="isLoading()" [error]="error()" (submitted)="onLogin($event)" (registerClicked)="onGoToRegister()" />
    </div>

    <div class="mt-6 text-center">
      <span class="text-secondary-600 dark:text-dark-secondary-300 text-sm">Don't have an account? </span>
      <a
        class="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 text-sm font-semibold transition-colors"
        [queryParams]="registerQueryParams()"
        routerLink="/auth/register">
        Create one
      </a>
    </div>
  `,
})
export class LoginViewComponent {
  readonly #authService = inject(AuthService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  onLogin(credentials: { email: string; password: string }): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.#router.navigateByUrl(this.returnUrl());
      },
      error: (err: { status?: number; error?: { errors?: string[]; message?: string } }) => {
        this.isLoading.set(false);
        if (err.status === 400) {
          this.error.set('Security validation expired. Please try again.');
        } else if (err.status === 401) {
          this.error.set('Invalid email or password.');
        } else {
          this.error.set(err?.error?.errors?.join(' ') ?? err?.error?.message ?? 'Login failed. Please try again.');
        }
      },
    });
  }

  onGoToRegister(): void {
    void this.#router.navigate(['/auth/register'], { queryParams: this.registerQueryParams() });
  }

  readonly returnUrl = () => this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/incomes';

  readonly registerQueryParams = () => {
    const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl ? { returnUrl } : {};
  };
}
