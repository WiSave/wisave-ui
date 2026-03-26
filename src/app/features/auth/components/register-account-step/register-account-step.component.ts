import { Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';

import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';

import { type IAccountStepData } from '../../types/auth.types';

const passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return password === confirm ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register-account-step',
  host: { class: 'block w-full' },
  imports: [ReactiveFormsModule, Button, IconField, InputIcon, InputText],
  template: `
    <form [formGroup]="form" (ngSubmit)="onNext()" class="flex flex-col gap-8">
      <div class="text-center">
        <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-2xl font-bold tracking-tight">Create your account</h2>
        <p class="text-secondary-600 dark:text-dark-secondary-300 mt-2 text-sm">Fill in your details to get started</p>
      </div>

      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="register-name">Full name</label>
          <p-iconfield>
            <p-inputicon class="pi pi-user" />
            <input id="register-name" formControlName="name" name="name" autocomplete="name" data-lpignore="true" class="w-full" pInputText type="text" placeholder="John Doe" />
          </p-iconfield>
          <span class="text-xs text-red-600 dark:text-red-400" [class.invisible]="!isInvalid('name')">Full name is required.</span>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="register-email">Email address</label>
          <p-iconfield>
            <p-inputicon class="pi pi-envelope" />
            <input id="register-email" formControlName="email" name="email" autocomplete="username" class="w-full" pInputText type="email" placeholder="you@example.com" />
          </p-iconfield>
          <span class="text-xs text-red-600 dark:text-red-400" [class.invisible]="!isInvalid('email')">
            @if (form.controls.email.errors?.['required']) {
              Email is required.
            } @else {
              Please enter a valid email address.
            }
          </span>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="register-password">Password</label>
            <p-iconfield>
              <input
                id="register-password"
                [type]="showPassword() ? 'text' : 'password'"
                class="w-full"
                pInputText
                name="new-password"
                autocomplete="new-password"
                formControlName="password"
                (input)="onPasswordInput($event)"
                placeholder="Min. 8 characters" />
              <p-inputicon
                [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"
                class="cursor-pointer"
                role="button"
                tabindex="-1"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                (click)="showPassword.set(!showPassword())" />
            </p-iconfield>
            <span class="text-xs text-red-600 dark:text-red-400" [class.invisible]="!isInvalid('password')">
              @if (form.controls.password.errors?.['required']) {
                Password is required.
              } @else {
                Password must be at least 8 characters.
              }
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-semibold" for="register-confirm">Confirm password</label>
            <p-iconfield>
              <input
                id="register-confirm"
                [attr.aria-describedby]="form.hasError('passwordMismatch') && form.controls.confirmPassword.touched ? 'register-confirm-error' : null"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                class="w-full"
                pInputText
                name="confirm-password"
                autocomplete="new-password"
                data-lpignore="true"
                data-1p-ignore
                formControlName="confirmPassword"
                placeholder="Repeat your password" />
              <p-inputicon
                [class]="showConfirmPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"
                class="cursor-pointer"
                role="button"
                tabindex="-1"
                [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
                (click)="showConfirmPassword.set(!showConfirmPassword())" />
            </p-iconfield>
            <span
              id="register-confirm-error"
              class="text-xs text-red-600 dark:text-red-400"
              [class.invisible]="!(form.hasError('passwordMismatch') && form.controls.confirmPassword.touched)">
              Passwords do not match.
            </span>
          </div>
        </div>
      </div>

      <p-button
        [disabled]="form.invalid"
        type="submit"
        label="Continue"
        severity="success"
        icon="pi pi-arrow-right"
        iconPos="right"
        styleClass="w-full !py-3 !text-base !font-semibold !text-white disabled:!cursor-not-allowed disabled:!opacity-50" />
    </form>
  `,
})
export class RegisterAccountStepComponent {
  readonly initialData = input<IAccountStepData | null>(null);
  readonly completed = output<IAccountStepData>();

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [passwordMatchValidator] },
  );

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.form.patchValue({ name: data.name, email: data.email, password: data.password, confirmPassword: data.password }, { emitEvent: false });
      }
    });
  }

  onNext(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    this.completed.emit({ name, email, password });
  }

  onPasswordInput(event: Event): void {
    const ie = event as InputEvent;
    if (ie.inputType === 'insertText' || ie.inputType?.startsWith('delete')) return;

    const confirm = this.form.controls.confirmPassword;
    if (!confirm.dirty) {
      confirm.setValue(this.form.controls.password.value);
    }
  }

  isInvalid(controlName: 'name' | 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
