import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Button } from 'primeng/button';

import { AuthService } from '@core/services/auth.service';
import { SIDEBAR_NAV_ITEMS } from '@layout/constants/sidebar-navigation.constant';
import { type ISidebarNavItem } from '@layout/types/sidebar-navigation.interface';
import { ThemeIconButtonComponent } from '@shared/components/button';

@Component({
  selector: 'app-sidebar',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, Button, ThemeIconButtonComponent],
  template: `
    <aside class="bg-secondary-700 dark:bg-dark-primary-900 flex h-screen w-56 flex-col gap-8 px-2 py-4">
      <div class="flex items-center justify-center gap-2 p-2">
        <img class="h-24 w-auto" priority [ngSrc]="'/logo2.png'" width="768" height="768" alt="WiSave" />
      </div>

      <nav class="flex flex-1 flex-col justify-between">
        <ul class="flex flex-col gap-1">
          @for (item of navItems; track item.route) {
            <li class="flex flex-col gap-1">
              <a
                [routerLink]="item.route"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="group text-secondary-100 hover:bg-secondary-800 hover:text-secondary-50 dark:text-dark-secondary-200 dark:hover:bg-dark-primary-800 dark:hover:text-dark-secondary-50 [&.active]:bg-secondary-900 [&.active]:text-secondary-50 dark:[&.active]:bg-dark-primary-700 dark:[&.active]:text-dark-secondary-50 [&.active]:hover:bg-secondary-900 dark:[&.active]:hover:bg-dark-primary-700 grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                routerLinkActive="active">
                <i [class]="item.icon + ' text-base'"></i>
                <span class="block min-w-0 truncate font-medium leading-5">{{ item.label }}</span>
              </a>
              @if (item.children?.length) {
                <ul class="ml-7 flex flex-col gap-1 border-l border-secondary-600/80 pl-3 dark:border-dark-primary-700">
                  @for (child of item.children; track child.route) {
                    <li>
                      <a
                        [routerLink]="child.route"
                        class="group block rounded-lg px-2.5 py-2 text-secondary-300 hover:bg-secondary-800/80 hover:text-secondary-50 dark:text-dark-secondary-400 dark:hover:bg-dark-primary-800 dark:hover:text-dark-secondary-50 [&.active]:bg-secondary-800/80 [&.active]:text-secondary-50 dark:[&.active]:bg-dark-primary-800 dark:[&.active]:text-dark-secondary-50"
                        routerLinkActive="active">
                        <span class="block truncate text-[11px] font-semibold uppercase tracking-[0.18em]">{{ child.label }}</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-actions mt-auto flex flex-row justify-around gap-2">
        <p-button class="p-button-xs sidebar-btn" variant="text" icon="pi pi-sign-out" size="small" (onClick)="onLogout()" />
        <p-button class="p-button-xs sidebar-btn" variant="text" icon="pi pi-cog" size="small" />
        <app-theme-icon-button class="sidebar-btn" />
      </div>
    </aside>
  `,
  styles: ``,
})
export class SidebarComponent {
  readonly #authService = inject(AuthService);
  readonly navItems: ISidebarNavItem[] = SIDEBAR_NAV_ITEMS;

  onLogout(): void {
    this.#authService.logout();
  }
}
