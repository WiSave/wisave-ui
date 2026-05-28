import type { ExpenseAccountId, ExpenseCategoryId } from '@wisave/shared/model';

export interface IDateRangeFilter {
  from: Date | null;
  to: Date | null;
}

export interface IExpensesFilter {
  dateRange: IDateRangeFilter;
  searchQuery: string;
  categoryIds: ExpenseCategoryId[];
  accountIds: ExpenseAccountId[];
  recurring: boolean | null;
}

export interface IExpensesSortOrder {
  field: 'date' | 'amount' | 'description' | 'createdAt';
  direction: 'asc' | 'desc';
}

export function createInitialFilter(): IExpensesFilter {
  const now = new Date();
  return {
    dateRange: {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    },
    searchQuery: '',
    categoryIds: [],
    accountIds: [],
    recurring: null,
  };
}

export const initialFilter: IExpensesFilter = createInitialFilter();

export const emptyFilter: IExpensesFilter = {
  dateRange: { from: null, to: null },
  searchQuery: '',
  categoryIds: [],
  accountIds: [],
  recurring: null,
};

export const initialSort: IExpensesSortOrder = { field: 'date', direction: 'desc' };
