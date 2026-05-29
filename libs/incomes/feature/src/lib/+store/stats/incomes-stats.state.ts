import { type IIncomeMonthlyStats, type IIncomeStats, type IncomeStatsScope } from '@wisave/incomes/data-access';
import { type IStoreError } from '@wisave/shared/model';

export interface IncomesStatsState {
  error: IStoreError | null;
  stats: IIncomeStats | null;
  statsLoading: boolean;
  statsScope: IncomeStatsScope;
  monthlyStats: IIncomeMonthlyStats[];
  monthlyStatsLoading: boolean;
  monthlyStatsYear: number;
}

export const initialStatsState: IncomesStatsState = {
  error: null,
  stats: null,
  statsLoading: false,
  statsScope: 'recurring',
  monthlyStats: [],
  monthlyStatsLoading: false,
  monthlyStatsYear: new Date().getFullYear(),
};
