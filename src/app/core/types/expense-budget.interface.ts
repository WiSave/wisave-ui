import type { Currency } from './currency.enum';
import type { BudgetId, ExpenseCategoryId } from './expense-id.types';

export interface ICategoryBudget {
  categoryId: ExpenseCategoryId;
  limit: number;
  spent: number;
}

export interface IBudget {
  id: BudgetId;
  month: number;
  year: number;
  totalLimit: number;
  currency: Currency;
  categoryBudgets: ICategoryBudget[];
  recurring: boolean;
}

export interface ICategorySpendingSummary {
  categoryId: ExpenseCategoryId;
  categoryName: string;
  spent: number;
  limit: number | null;
}

export interface IExpenseMonthlyStats {
  year: number;
  month: number;
  total: number;
  currency: Currency;
}

export interface IBudgetReadModelDto {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalLimit: number;
  currency: string;
  recurring: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface IBudgetCategoryLimitDto {
  id: number;
  budgetId: string;
  categoryId: string;
  limit: number;
}

export interface IBudgetApiResponse {
  budget: IBudgetReadModelDto;
  categoryLimits: IBudgetCategoryLimitDto[];
}

export interface ICategorySpendingSummaryApiDto {
  id: number;
  userId: string;
  month: number;
  year: number;
  categoryId: string;
  categoryName: string;
  totalSpent: number;
}

export interface IExpenseMonthlyStatsApiDto {
  id: number;
  userId: string;
  year: number;
  month: number;
  totalSpent: number;
  currency: string;
}

export type InsightType = 'consecutive_trend' | 'overspend' | 'savings' | 'total_delta';
export type InsightSeverity = 'info' | 'warning' | 'positive';

export interface IInsight {
  type: InsightType;
  categoryId?: ExpenseCategoryId;
  categoryName?: string;
  message: string;
  severity: InsightSeverity;
  value: number;
}

export interface ICategoryMonthComparison {
  categoryId: ExpenseCategoryId;
  categoryName: string;
  months: {
    month: number;
    year: number;
    spent: number;
    limit: number | null;
    delta: number | null;
  }[];
}

export interface IDelta {
  amount: number;
  percent: number;
  direction: 'up' | 'down' | 'flat';
}
