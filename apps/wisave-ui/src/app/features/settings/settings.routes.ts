import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/settings-shell.component').then((m) => m.SettingsShellComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./views/settings-profile.component').then((m) => m.SettingsProfileComponent),
      },
      {
        path: 'access',
        loadComponent: () =>
          import('./views/settings-access-management.component').then((m) => m.SettingsAccessManagementComponent),
      },
    ],
  },
];
