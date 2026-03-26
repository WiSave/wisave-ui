import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '@core/services/auth/auth.service';
import { ThemeIconButtonComponent } from '@shared/components/button';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, NgOptimizedImage, ThemeIconButtonComponent],
  template: `
    <div class="flex min-h-screen">
      <!-- Decorative brand panel -->
      <div
        class="bg-secondary-800 dark:bg-dark-primary-900 relative hidden w-120 flex-col items-center justify-center overflow-hidden lg:flex">
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-linear-to-br from-accent-900/30 via-transparent to-accent-800/20"></div>
        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 24px 24px;"></div>

        <div class="relative z-10 flex flex-col items-center gap-6 px-12">
          <img class="h-28 w-auto drop-shadow-lg" priority [ngSrc]="'/logo2.png'" width="768" height="768" alt="WiSave" />
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight text-white">WiSave</h1>
            <p class="mt-2 max-w-70 text-sm leading-relaxed text-secondary-300 dark:text-dark-secondary-300">
              Take control of your finances with smart tracking, insights, and planning tools.
            </p>
          </div>

          <!-- Decorative accent line -->
          <div class="mt-4 h-px w-16 bg-linear-to-r from-transparent via-accent-500/60 to-transparent"></div>
        </div>

        <!-- Corner accents -->
        <div class="absolute bottom-8 left-8 h-16 w-16 rounded-full border border-accent-500/10"></div>
        <div class="absolute right-12 top-12 h-24 w-24 rounded-full border border-accent-500/10"></div>
      </div>

      <!-- Content panel -->
      <main class="bg-white dark:bg-dark-primary-950 relative flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <!-- Mobile logo (hidden on lg+) -->
        <div class="mb-10 flex flex-col items-center gap-2 lg:hidden">
          <img class="h-20 w-auto" priority [ngSrc]="'/logo2.png'" width="768" height="768" alt="WiSave" />
        </div>

        <router-outlet />

        <div class="absolute right-6 top-6">
          <app-theme-icon-button />
        </div>
      </main>
    </div>
  `,
})
export class AuthLayoutComponent {
  readonly #authService = inject(AuthService);

  constructor() {
    this.#authService.bootstrapAntiforgery().subscribe();
  }
}
