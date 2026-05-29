import { type Route } from '@angular/router';

import { routes } from './expenses.routes';
import { ExpensesShellComponent } from './views/expenses-shell.component';

describe('expenses shell routes', () => {
  function child(path: string): Route | undefined {
    return routes[0]?.children?.find((route) => route.path === path);
  }

  it('hosts expenses plugin routes under the shell component', () => {
    expect(routes[0]?.path).toBe('');
    expect(routes[0]?.component).toBe(ExpensesShellComponent);
    expect(routes[0]?.children?.map((route) => route.path)).toEqual(['', 'list', 'budget', 'accounts', 'insights']);
  });

  it('delegates list, budget, accounts, and insights to expenses plugin libraries', async () => {
    const [{ routes: listRoutes }, { budgetRoutes, insightsRoutes }, { routes: accountRoutes }] = await Promise.all([
      import('@wisave/expenses/feature-list'),
      import('@wisave/expenses/feature-budget'),
      import('@wisave/expenses/feature-accounts'),
    ]);

    await expect((child('list')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(listRoutes);
    await expect((child('budget')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(budgetRoutes);
    await expect((child('accounts')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(accountRoutes);
    await expect((child('insights')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(insightsRoutes);
  });
});
