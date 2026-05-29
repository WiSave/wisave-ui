import { type Routes } from '@angular/router';

import { ExpensesShellComponent } from './views/expenses-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ExpensesShellComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', loadChildren: () => import('@wisave/expenses/list').then((m) => m.routes) },
      { path: 'budget', loadChildren: () => import('@wisave/expenses/budget').then((m) => m.budgetRoutes) },
      { path: 'accounts', loadChildren: () => import('@wisave/expenses/accounts').then((m) => m.routes) },
      { path: 'insights', loadChildren: () => import('@wisave/expenses/budget').then((m) => m.insightsRoutes) },
    ],
  },
];
