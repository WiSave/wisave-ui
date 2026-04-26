import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'incomes',
    loadChildren: () => import('./incomes/incomes.routes').then((m) => m.routes),
  },
  {
    path: 'stock',
    loadChildren: () => import('./stock/stock.routes').then((m) => m.routes),
  },
  {
    path: 'expenses',
    loadComponent: () => import('./expenses/views/expenses-shell.component').then((m) => m.ExpensesShellComponent),
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', loadChildren: () => import('./expenses/expenses.routes').then((m) => m.routes) },
      { path: 'budget', loadChildren: () => import('./expense-budget/expense-budget.routes').then((m) => m.routes) },
      { path: 'accounts', loadChildren: () => import('./expense-accounts/expense-accounts.routes').then((m) => m.routes) },
      { path: 'insights', loadChildren: () => import('./expense-budget/insights.routes').then((m) => m.routes) },
    ],
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes').then((m) => m.routes),
  },
];
