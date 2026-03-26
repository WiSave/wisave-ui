import type { ExpenseCategoryId, ExpenseSubcategoryId } from './expense-id.types';

export interface IExpenseCategory {
  id: ExpenseCategoryId;
  name: string;
  subcategories: IExpenseSubcategory[];
}

export interface IExpenseSubcategory {
  id: ExpenseSubcategoryId;
  name: string;
}

export interface IExpenseCategoryApiDto {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}
