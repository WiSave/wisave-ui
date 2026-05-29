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
    loadChildren: () => import('@wisave/auth/feature').then((m) => m.routes),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'incomes',
        loadChildren: () => import('@wisave/incomes/feature').then((m) => m.routes),
      },
      {
        path: 'stock',
        loadChildren: () => import('@wisave/stock/feature').then((m) => m.routes),
      },
      {
        path: 'expenses',
        loadChildren: () => import('@wisave/expenses/shell').then((m) => m.routes),
      },
      {
        path: 'settings',
        loadChildren: () => import('@wisave/settings/feature').then((m) => m.routes),
      },
    ],
  },
];
