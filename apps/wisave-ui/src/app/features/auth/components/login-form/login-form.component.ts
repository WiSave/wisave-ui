import { Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';

@Component({
  selector: 'app-login-form',
  host: { class: 'block w-full' },
  imports: [ReactiveFormsModule, Button, IconField, InputIcon, InputText, Password],
  template: `
    <div class="flex flex-col gap-10">
      <div class="text-center">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-3xl font-bold tracking-tight">Welcome back</h2>
        <p class="text-secondary-600 dark:text-dark-secondary-300 mt-3 text-sm">Sign in to continue managing your finances</p>
      </div>

      @if (error()) {
        <div class="flex items-start gap-3 rounded-xl bg-danger-50 p-4 text-sm text-danger-700 dark:bg-dark-danger-900-20 dark:text-dark-danger-400" role="alert" aria-live="polite">
          <i class="pi pi-exclamation-circle mt-0.5 text-base"></i>
          <span>{{ error() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6" autocomplete="off" data-lpignore="true" data-1p-ignore data-form-type="other">
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="login-email">Email address</label>
          <p-iconfield>
            <p-inputicon class="pi pi-envelope" />
            <input
              id="login-email"
              [attr.aria-describedby]="isInvalid('email') ? 'login-email-error' : null"
              class="w-full"
              pInputText
              type="email"
              name="email"
              autocomplete="off"
              data-lpignore="true"
              data-1p-ignore
              formControlName="email"
              placeholder="you@example.com" />
          </p-iconfield>
          <span id="login-email-error" class="text-xs text-danger-600 dark:text-dark-danger-400" [class.invisible]="!isInvalid('email')">
            @if (form.controls.email.errors?.['required']) {
              Email is required.
            } @else {
              Please enter a valid email address.
            }
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="login-password">Password</label>
          </div>
          <p-password
            inputId="login-password"
            formControlName="password"
            [feedback]="false"
            [toggleMask]="true"
            [fluid]="true"
            inputStyleClass="w-full"
            autocomplete="off"
            placeholder="Enter your password"
            [pt]="{ pcInputText: { root: { 'aria-describedby': isInvalid('password') ? 'login-password-error' : null } } }" />

          <span id="login-password-error" class="text-xs text-danger-600 dark:text-dark-danger-400" [class.invisible]="!isInvalid('password')">Password is required.</span>
        </div>

        <p-button
          [loading]="isLoading()"
          [disabled]="form.invalid || isLoading()"
          type="submit"
          label="Sign in"
          severity="success"
          styleClass="w-full mt-4 !py-3.5 !text-base !font-semibold disabled:!cursor-not-allowed disabled:!opacity-50" />
      </form>
    </div>
  `,
})
export class LoginFormComponent {
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<{ email: string; password: string }>();
  readonly registerClicked = output<void>();

  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitted.emit({ email, password });
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
