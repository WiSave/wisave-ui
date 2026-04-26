import { type Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'session-unavailable',
    loadComponent: () => import('./core/views/session-unavailable.component').then((m) => m.SessionUnavailableComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () => import('./features/features.routing').then((m) => m.routes),
  },
];
