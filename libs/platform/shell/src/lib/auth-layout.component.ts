import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '@wisave/platform/auth';
import { ThemeIconButtonComponent } from '@wisave/shared/ui';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, NgOptimizedImage, ThemeIconButtonComponent],
  template: `
    <div class="flex min-h-screen">
      <!-- Decorative brand panel -->
      <div class="bg-secondary-800 dark:bg-dark-primary-900 relative hidden w-120 flex-col items-center justify-center overflow-hidden lg:flex">
        <!-- Gradient overlay -->
        <div class="from-accent-900/30 to-accent-800/20 absolute inset-0 bg-linear-to-br via-transparent"></div>
        <!-- Subtle grid pattern -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 24px 24px;"></div>

        <div class="relative z-10 flex flex-col items-center gap-6 px-12">
          <img [ngSrc]="'/logo2.png'" class="h-28 w-auto drop-shadow-lg" priority width="768" height="768" alt="WiSave" />
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight text-white">WiSave</h1>
            <p class="text-secondary-300 dark:text-dark-secondary-300 mt-2 max-w-70 text-sm leading-relaxed">Take control of your finances with smart tracking, insights, and planning tools.</p>
          </div>

          <!-- Decorative accent line -->
          <div class="via-accent-500/60 mt-4 h-px w-16 bg-linear-to-r from-transparent to-transparent"></div>
        </div>

        <!-- Corner accents -->
        <div class="border-accent-500/10 absolute bottom-8 left-8 h-16 w-16 rounded-full border"></div>
        <div class="border-accent-500/10 absolute top-12 right-12 h-24 w-24 rounded-full border"></div>
      </div>

      <!-- Content panel -->
      <main class="dark:bg-dark-primary-950 relative flex flex-1 flex-col items-center justify-center bg-white p-6 sm:p-10">
        <!-- Mobile logo (hidden on lg+) -->
        <div class="mb-10 flex flex-col items-center gap-2 lg:hidden">
          <img [ngSrc]="'/logo2.png'" class="h-20 w-auto" priority width="768" height="768" alt="WiSave" />
        </div>

        <router-outlet />

        <div class="absolute top-6 right-6">
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
