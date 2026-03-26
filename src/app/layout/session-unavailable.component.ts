import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Button } from 'primeng/button';

@Component({
  selector: 'app-session-unavailable',
  imports: [Button, RouterLink],
  template: `
    <section class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 class="text-secondary-900 dark:text-dark-secondary-50 text-2xl font-bold">We couldn't restore your session</h1>
      <p class="text-secondary-600 dark:text-dark-secondary-300">
        The server did not confirm whether you are still signed in. Retry before signing in again.
      </p>
      <p-button type="button" label="Retry" severity="secondary" (onClick)="retry()" />
      <a class="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 text-sm font-semibold transition-colors" [queryParams]="{ returnUrl: returnUrl }" routerLink="/auth/login">
        Go to sign in
      </a>
    </section>
  `,
})
export class SessionUnavailableComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/incomes';

  retry(): void {
    void this.#router.navigateByUrl(this.returnUrl);
  }
}
