import { HttpErrorResponse } from '@angular/common/http';

import { type IStoreError } from '@wisave/shared/model';

export const toStoreError = (err: unknown): IStoreError => {
  if (err instanceof HttpErrorResponse) {
    const category = err.status === 0 ? 'network' : err.status >= 400 && err.status < 500 ? 'validation' : 'server';
    const message = typeof err.error?.message === 'string' ? err.error.message : err.message;
    return { message, category };
  }

  return { message: err instanceof Error ? err.message : 'Unknown error', category: 'server' };
};
