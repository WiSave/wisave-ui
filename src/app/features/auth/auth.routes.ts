import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./views/login.component').then((m) => m.LoginViewComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./views/register.component').then((m) => m.RegisterViewComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
