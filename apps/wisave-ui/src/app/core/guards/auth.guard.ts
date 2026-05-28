import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@core/services/auth/auth.service';

/**
 * Bootstraps the session from /api/auth/me if not yet initialized,
 * then checks server-validated auth state.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    return authService.isAuthenticated() ? true : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  return authService.initialize().pipe(
    map((result) => {
      if (result.kind === 'authenticated') {
        return true;
      }

      if (result.kind === 'unauthenticated') {
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }

      return router.createUrlTree(['/session-unavailable'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

/**
 * Prevents authenticated users from accessing login/register pages.
 * Also bootstraps the session if not yet initialized.
 */
export const guestGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    return authService.isAuthenticated() ? router.createUrlTree(['/incomes']) : true;
  }

  return authService.initialize().pipe(
    map((result) => {
      if (result.kind === 'authenticated') {
        return router.createUrlTree(['/incomes']);
      }

      if (result.kind === 'unauthenticated') {
        return true;
      }

      return router.createUrlTree(['/session-unavailable'], { queryParams: { returnUrl: state.url } });
    }),
  );
};
