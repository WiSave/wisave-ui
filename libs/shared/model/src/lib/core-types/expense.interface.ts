import type { ExpenseAccountId, ExpenseCategoryId, ExpenseId, ExpenseSubcategoryId } from './expense-id.types';
import type { IMoney } from './money.interface';

export interface IExpensePageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface IExpense {
  id: ExpenseId;
  date: Date;
  description: string;
  amount: IMoney;
  accountId: ExpenseAccountId;
  categoryId: ExpenseCategoryId;
  subcategoryId?: ExpenseSubcategoryId;
  recurring?: boolean;
  metadata?: Record<string, string>;
}

export interface IExpenseApiDto {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  accountId: string;
  categoryId: string;
  subcategoryId: string | null;
  recurring: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface IExpensesResponseDto {
  expenses: IExpenseApiDto[];
  totalCount: number;
  pageInfo: IExpensePageInfo;
}
