import { type Routes } from '@angular/router';

import { AuthLayoutComponent, MainLayoutComponent } from '@wisave/platform/shell';
import { authGuard, guestGuard, SessionUnavailableComponent } from '@wisave/platform/auth';

export const routes: Routes = [
  {
    path: 'session-unavailable',
    component: SessionUnavailableComponent,
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./features/features.routing').then((m) => m.routes),
  },
];
