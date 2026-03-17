import { type ISidebarNavItem } from '@layout/types/sidebar-navigation.interface';

export const SIDEBAR_NAV_ITEMS: ISidebarNavItem[] = [
  { route: '/dashboard', label: 'Dashboard', exact: true, icon: 'pi pi-home' },
  { route: '/incomes', label: 'Incomes', exact: false, icon: 'pi pi-money-bill' },
  {
    route: '/stock',
    label: 'Stock',
    exact: false,
    icon: 'pi pi-chart-bar',
    children: [
      { route: '/stock/overview', label: 'Overview' },
      { route: '/stock/portfolio', label: 'Portfolio' },
      { route: '/stock/watchlists', label: 'Watchlists' },
      { route: '/stock/opportunities', label: 'Opportunities' },
      { route: '/stock/research', label: 'Research' },
    ],
  },
  { route: '/expenses', label: 'Expenses', exact: false, icon: 'pi pi-credit-card' },
  { route: '/calendar', label: 'Calendar', exact: false, icon: 'pi pi-calendar' },
  { route: '/documents', label: 'Documents', exact: false, icon: 'pi pi-file' },
  { route: '/reports', label: 'Reports', exact: false, icon: 'pi pi-chart-line' },
];
