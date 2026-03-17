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
];
