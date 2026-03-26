import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@core/services/auth.service';

/**
 * Bootstraps the session from /api/auth/me if not yet initialized,
 * then checks server-validated auth state.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    return authService.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
  }

  return authService.initialize().pipe(map(() => (authService.isAuthenticated() ? true : router.createUrlTree(['/auth/login']))));
};

/**
 * Prevents authenticated users from accessing login/register pages.
 * Also bootstraps the session if not yet initialized.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    return authService.isAuthenticated() ? router.createUrlTree(['/incomes']) : true;
  }

  return authService.initialize().pipe(map(() => (authService.isAuthenticated() ? router.createUrlTree(['/incomes']) : true)));
};
