import { type HttpInterceptorFn } from '@angular/common/http';

import { getApiBaseUrl } from '@core/config/runtime-config';

/**
 * Ensures cookies are sent with every API request.
 * The gateway manages the session cookie — the SPA never handles tokens.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = getApiBaseUrl();

  if (req.url.startsWith(apiBase) || req.url.startsWith('/api')) {
    const cloned = req.clone({ withCredentials: true });
    return next(cloned);
  }

  return next(req);
};
