import { type ISidebarNavItem } from '../types/sidebar-navigation.interface';

export const SIDEBAR_NAV_ITEMS: ISidebarNavItem[] = [
  { route: '/dashboard', label: 'Dashboard', exact: true, icon: 'pi pi-home' },
  { route: '/incomes', label: 'Incomes', exact: false, icon: 'pi pi-money-bill', requiredPermission: 'incomes' },
  {
    route: '/stock',
    label: 'Stock',
    exact: false,
    icon: 'pi pi-chart-bar',
    requiredPermission: 'stocks',
    children: [
      { route: '/stock/overview', label: 'Overview' },
      { route: '/stock/portfolio', label: 'Portfolio' },
      { route: '/stock/watchlists', label: 'Watchlists' },
      { route: '/stock/opportunities', label: 'Opportunities' },
      { route: '/stock/research', label: 'Research' },
    ],
  },
  {
    route: '/expenses',
    label: 'Expenses',
    exact: false,
    icon: 'pi pi-wallet',
    requiredPermission: 'expenses',
    children: [
      { route: '/expenses/list', label: 'Expenses' },
      { route: '/expenses/budget', label: 'Budget' },
      { route: '/expenses/accounts', label: 'Funding & Cards' },
      { route: '/expenses/insights', label: 'Insights' },
    ],
  },
  { route: '/calendar', label: 'Calendar', exact: false, icon: 'pi pi-calendar' },
  { route: '/documents', label: 'Documents', exact: false, icon: 'pi pi-file' },
  { route: '/reports', label: 'Reports', exact: false, icon: 'pi pi-chart-line' },
];
