import type { IBudget, ICategoryMonthComparison, ICategorySpendingSummary, IExpenseMonthlyStats, IStoreError } from '@wisave/shared/model';

export interface AnalysisState {
  previousBudget: IBudget | null;
  previousSummaries: ICategorySpendingSummary[];
  selectedRange: 3 | 6 | 12;
  categoryComparison: ICategoryMonthComparison[];
  rangeMonthlyStats: IExpenseMonthlyStats[];
  rangeSummaries: Record<string, ICategorySpendingSummary[]>;
  isLoading: boolean;
  error: IStoreError | null;
}

export const initialAnalysisState: AnalysisState = {
  previousBudget: null,
  previousSummaries: [],
  selectedRange: 3,
  categoryComparison: [],
  rangeMonthlyStats: [],
  rangeSummaries: {},
  isLoading: false,
  error: null,
};
