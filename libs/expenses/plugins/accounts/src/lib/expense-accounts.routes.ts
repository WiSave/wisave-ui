import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views').then((m) => m.AccountsComponent),
    children: [
      {
        path: 'add',
        loadComponent: () => import('./views/add-account.component').then((m) => m.AddAccountComponent),
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./views/edit-account.component').then((m) => m.EditAccountComponent),
      },
    ],
  },
];
