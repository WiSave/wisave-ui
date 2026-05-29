import type { IBudget, ICategorySpendingSummary, IExpenseMonthlyStats } from '@wisave/shared/model';
import type { IExpenseCategory } from '@wisave/shared/model';
import type { IStoreError } from '@wisave/shared/model';

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
