import { type HttpInterceptorFn } from '@angular/common/http';

import { getApiBaseUrl } from '@wisave/platform/config';

/**
 * Ensures cookies (session + XSRF) are sent with every API request.
 * XSRF header injection is handled by Angular's built-in withXsrfConfiguration().
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = getApiBaseUrl();

  if (req.url.startsWith(apiBase) || req.url.startsWith('/api')) {
    return next(req.clone({ withCredentials: true }));
  }

  return next(req);
};
