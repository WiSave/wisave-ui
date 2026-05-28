import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  readonly #authService = inject(AuthService);

  readonly #permissions = computed(() => this.#authService.user()?.permissions ?? []);

  hasPermission(permission: string): boolean {
    const perms = this.#permissions();
    return perms.includes('*') || perms.includes(permission);
  }

  hasAnyPermission(prefix: string): boolean {
    const perms = this.#permissions();
    if (perms.includes('*')) return true;
    const prefixWithDelimiter = prefix + ':';
    return perms.some((p) => p.startsWith(prefixWithDelimiter));
  }
}
