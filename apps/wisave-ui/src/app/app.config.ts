import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { APP_INITIALIZER, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { provideStoreDevtools } from '@ngrx/store-devtools';
import { authInterceptor } from '@wisave/platform/auth';
import { CommandFailedNotifierService } from '@wisave/platform/signalr';

import WiSaveTheme from '../theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    providePrimeNG({
      translation: {
        dateFormat: 'dd/mm/yy',
      },
      theme: {
        preset: WiSaveTheme,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideHttpClient(withInterceptors([authInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    MessageService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [CommandFailedNotifierService],
      useFactory: () => () => Promise.resolve(),
    },
  ],
};
