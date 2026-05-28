import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views').then((m) => m.StockComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        path: 'overview',
        loadComponent: () => import('./views/stock-overview.component').then((m) => m.StockOverviewComponent),
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./views/stock-portfolio.component').then((m) => m.StockPortfolioComponent),
        children: [
          {
            path: 'portfolios/add',
            loadComponent: () => import('./views/add-stock-portfolio.component').then((m) => m.AddStockPortfolioComponent),
          },
          {
            path: 'portfolios/:id/edit',
            loadComponent: () => import('./views/edit-stock-portfolio.component').then((m) => m.EditStockPortfolioComponent),
          },
          {
            path: 'positions/add',
            loadComponent: () => import('./views/add-stock-position.component').then((m) => m.AddStockPositionComponent),
          },
          {
            path: 'positions/:id/edit',
            loadComponent: () => import('./views/edit-stock-position.component').then((m) => m.EditStockPositionComponent),
          },
        ],
      },
      {
        path: 'watchlists',
        loadComponent: () => import('./views/stock-watchlists.component').then((m) => m.StockWatchlistsComponent),
      },
      {
        path: 'opportunities',
        loadComponent: () => import('./views/stock-opportunities.component').then((m) => m.StockOpportunitiesComponent),
      },
      {
        path: 'research',
        loadComponent: () => import('./views/stock-research.component').then((m) => m.StockResearchComponent),
      },
    ],
  },
];
