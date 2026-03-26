import type { IBudget, ICategorySpendingSummary, IExpenseMonthlyStats } from '@core/types/expense-budget.interface';
import type { IExpenseCategory } from '@core/types/expense-category.interface';
import type { IStoreError } from '@shared/types/error.types';

export interface BudgetState {
  currentBudget: IBudget | null;
  spendingSummaries: ICategorySpendingSummary[];
  monthlyStats: IExpenseMonthlyStats[];
  availableCategories: IExpenseCategory[];
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
  error: IStoreError | null;
}

const now = new Date();

export const initialState: BudgetState = {
  currentBudget: null,
  spendingSummaries: [],
  monthlyStats: [],
  availableCategories: [],
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  isLoading: false,
  error: null,
};
