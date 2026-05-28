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
        loadComponent: () => import('@wisave/expenses/feature-list').then((m) => m.ExpensesShellComponent),
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', loadChildren: () => import('@wisave/expenses/feature-list').then((m) => m.routes) },
          { path: 'budget', loadChildren: () => import('@wisave/expenses/feature-budget').then((m) => m.budgetRoutes) },
          { path: 'accounts', loadChildren: () => import('@wisave/expenses/feature-accounts').then((m) => m.routes) },
          { path: 'insights', loadChildren: () => import('@wisave/expenses/feature-budget').then((m) => m.insightsRoutes) },
        ],
      },
      {
        path: 'settings',
        loadChildren: () => import('@wisave/settings/feature').then((m) => m.routes),
      },
    ],
  },
];
