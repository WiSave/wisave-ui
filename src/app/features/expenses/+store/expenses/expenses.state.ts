import type { IExpenseAccount } from '@core/types/expense-account.interface';
import type { IExpenseCategory } from '@core/types/expense-category.interface';
import type { IExpense } from '@core/types/expense.interface';
import { initialPagination, type IPagination, type IStoreError } from '@shared/types';

import { initialFilter, initialSort, type IExpensesFilter, type IExpensesSortOrder } from '../../types/expenses-state.types';

export interface ExpensesState {
  isLoading: boolean;
  error: IStoreError | null;
  filter: IExpensesFilter;
  sort: IExpensesSortOrder;
  pagination: IPagination;
  availableCategories: IExpenseCategory[];
  availableAccounts: IExpenseAccount[];
  categoriesLoading: boolean;
  accountsLoading: boolean;
  selectedExpense: IExpense | null;
}

export const initialState: ExpensesState = {
  isLoading: false,
  error: null,
  filter: initialFilter,
  sort: initialSort,
  pagination: initialPagination,
  availableCategories: [],
  availableAccounts: [],
  categoriesLoading: false,
  accountsLoading: false,
  selectedExpense: null,
};
