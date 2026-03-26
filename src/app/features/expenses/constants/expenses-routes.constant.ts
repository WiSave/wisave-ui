export const EXPENSES_ROUTES = {
  ADD: 'add',
  EDIT: 'edit',
} as const;

export type ExpenseRoute = (typeof EXPENSES_ROUTES)[keyof typeof EXPENSES_ROUTES];
