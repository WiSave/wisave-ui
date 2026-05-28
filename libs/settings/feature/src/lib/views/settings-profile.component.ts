import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';

import { Button } from 'primeng/button';
import { Password } from 'primeng/password';

import { AuthService } from '@wisave/platform/auth';

const passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
  const newPassword = group.get('newPassword')?.value as string;
  const confirmPassword = group.get('confirmPassword')?.value as string;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-settings-profile',
  imports: [ReactiveFormsModule, Button, Password],
  template: `
    <div class="flex min-w-0 flex-col gap-4">
      <section class="border-secondary-200 dark:border-dark-divider bg-white/80 dark:bg-dark-primary-850/80 rounded-lg border p-5">
        <div class="grid gap-6 xl:grid-cols-[minmax(240px,0.45fr)_minmax(420px,0.55fr)]">
          <div class="flex max-w-md flex-col gap-2">
            <p class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.2em]">
              User profile
            </p>
            <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-base font-semibold">Account details</h2>
            <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm leading-6">
              Account identity details used across WiSave.
            </p>
          </div>

          <dl class="border-secondary-200 dark:border-dark-divider grid gap-4 rounded-lg border bg-secondary-50/60 p-4 dark:bg-dark-primary-900/40 md:grid-cols-2">
            <div>
              <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.18em]">
                Name
              </dt>
              <dd class="text-secondary-900 dark:text-dark-secondary-50 mt-1 truncate text-sm font-medium">{{ displayName() }}</dd>
            </div>
            <div>
              <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.18em]">
                Email
              </dt>
              <dd class="text-secondary-900 dark:text-dark-secondary-50 mt-1 truncate text-sm font-medium">{{ email() }}</dd>
            </div>
            <div class="md:col-span-2">
              <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.18em]">
                User ID
              </dt>
              <dd class="text-secondary-900 dark:text-dark-secondary-50 mt-1 truncate text-sm font-medium">{{ userId() }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="border-secondary-200 dark:border-dark-divider bg-white/80 dark:bg-dark-primary-850/80 rounded-lg border p-5">
        <div class="grid gap-6 xl:grid-cols-[minmax(240px,0.45fr)_minmax(420px,0.55fr)]">
          <div class="flex max-w-md flex-col gap-2">
            <p class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.18em]">
              Security
            </p>
            <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-base font-semibold">Change password</h3>
            <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm leading-6">
              Keep your account password current. Use at least 8 characters.
            </p>
          </div>

          <div class="border-secondary-200 dark:border-dark-divider rounded-lg border bg-secondary-50/60 p-4 dark:bg-dark-primary-900/40">
            @if (passwordStatus() === 'success') {
              <div class="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                Password changed.
              </div>
            } @else if (passwordError()) {
              <div class="mb-4 rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 dark:bg-dark-danger-900-20 dark:text-dark-danger-400">
                {{ passwordError() }}
              </div>
            }

            <form class="grid gap-4 md:grid-cols-2" [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
              <div class="flex min-w-0 flex-col gap-2 md:col-span-2">
                <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="current-password">Current password</label>
                <p-password
                  inputId="current-password"
                  formControlName="currentPassword"
                  [feedback]="false"
                  [toggleMask]="true"
                  [fluid]="true"
                  inputStyleClass="w-full"
                  autocomplete="current-password"
                  placeholder="Current password" />
                <span class="text-xs text-danger-600 dark:text-dark-danger-400" [class.invisible]="!isPasswordInvalid('currentPassword')">
                  Current password is required.
                </span>
              </div>

              <div class="flex min-w-0 flex-col gap-2">
                <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="new-password">New password</label>
                <p-password
                  inputId="new-password"
                  formControlName="newPassword"
                  [toggleMask]="true"
                  [fluid]="true"
                  inputStyleClass="w-full"
                  autocomplete="new-password"
                  placeholder="Min. 8 characters" />
                <span class="text-xs text-danger-600 dark:text-dark-danger-400" [class.invisible]="!isPasswordInvalid('newPassword')">
                  @if (passwordForm.controls.newPassword.errors?.['required']) {
                    New password is required.
                  } @else {
                    New password must be at least 8 characters.
                  }
                </span>
              </div>

              <div class="flex min-w-0 flex-col gap-2">
                <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="confirm-password">Confirm password</label>
                <p-password
                  inputId="confirm-password"
                  formControlName="confirmPassword"
                  [feedback]="false"
                  [toggleMask]="true"
                  [fluid]="true"
                  inputStyleClass="w-full"
                  autocomplete="new-password"
                  placeholder="Repeat new password" />
                <span
                  class="text-xs text-danger-600 dark:text-dark-danger-400"
                  [class.invisible]="!(passwordForm.hasError('passwordMismatch') && passwordForm.controls.confirmPassword.touched)">
                  Passwords do not match.
                </span>
              </div>

              <div class="flex justify-end md:col-span-2">
                <p-button
                  type="submit"
                  label="Update password"
                  icon="pi pi-lock"
                  size="small"
                  severity="secondary"
                  [loading]="passwordStatus() === 'submitting'"
                  [disabled]="passwordForm.invalid || passwordStatus() === 'submitting'" />
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SettingsProfileComponent {
  readonly #authService = inject(AuthService);

  readonly passwordStatus = signal<'idle' | 'submitting' | 'success'>('idle');
  readonly passwordError = signal<string | null>(null);
  readonly user = computed(() => this.#authService.user());
  readonly displayName = computed(() => this.user()?.name || 'Unknown user');
  readonly email = computed(() => this.user()?.email || 'No email');
  readonly userId = computed(() => this.user()?.id || 'Unknown');

  readonly passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [passwordMatchValidator] },
  );

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordStatus.set('submitting');
    this.passwordError.set(null);

    this.#authService
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.passwordStatus.update((status) => (status === 'submitting' ? 'idle' : status))))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordStatus.set('success');
        },
        error: () => {
          this.passwordError.set('Unable to change password. Check the current password and try again.');
        },
      });
  }

  isPasswordInvalid(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
    const control = this.passwordForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
