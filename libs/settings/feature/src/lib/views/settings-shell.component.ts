import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PermissionService } from '@wisave/platform/auth';

@Component({
  selector: 'app-settings-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="flex h-full min-w-0 flex-col px-6 py-5">
      <header class="mb-5">
        <p class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold uppercase tracking-[0.22em]">
          Settings
        </p>
        <h1 class="text-secondary-950 dark:text-dark-secondary-50 mt-2 text-2xl font-semibold">Settings</h1>
      </header>

      <nav class="border-secondary-200 dark:border-dark-divider mb-6 flex gap-1 border-b">
        <a
          routerLink="profile"
          routerLinkActive="active"
          class="text-secondary-500 hover:text-secondary-950 dark:text-dark-secondary-400 dark:hover:text-dark-secondary-50 border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold transition-colors [&.active]:border-secondary-700 [&.active]:text-secondary-950 dark:[&.active]:border-dark-secondary-100 dark:[&.active]:text-dark-secondary-50">
          Profile
        </a>
        @if (canManageAccess()) {
          <a
            routerLink="access"
            routerLinkActive="active"
            class="text-secondary-500 hover:text-secondary-950 dark:text-dark-secondary-400 dark:hover:text-dark-secondary-50 border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold transition-colors [&.active]:border-secondary-700 [&.active]:text-secondary-950 dark:[&.active]:border-dark-secondary-100 dark:[&.active]:text-dark-secondary-50">
            Access Management
          </a>
        }
      </nav>

      <router-outlet />
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
    }
  `,
})
export class SettingsShellComponent {
  readonly #permissionService = inject(PermissionService);

  readonly canManageAccess = computed(() => this.#permissionService.hasPermission('*'));
}
