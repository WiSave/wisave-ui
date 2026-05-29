import { type Route } from '@angular/router';

import { routes } from './app.routes';

describe('app routes', () => {
  function findMainChild(path: string): Route | undefined {
    const mainRoute = routes.find((route) => route.path === '');
    return mainRoute?.children?.find((route) => route.path === path);
  }

  it('delegates expenses composition to the expenses shell library', async () => {
    const expensesRoute = findMainChild('expenses');

    expect(expensesRoute?.loadChildren).toBeDefined();
    expect(expensesRoute?.loadComponent).toBeUndefined();
    expect(expensesRoute?.children).toBeUndefined();

    const [{ routes: expensesShellRoutes }, loadedRoutes] = await Promise.all([import('@wisave/expenses/shell'), (expensesRoute?.loadChildren as () => Promise<unknown>)()]);

    expect(loadedRoutes).toBe(expensesShellRoutes);
  });
});
