import { type IMoney } from '@wisave/shared/model';

import type { IncomeId } from './income-id.type';

export interface IIncome {
  id: IncomeId;
  date: Date;
  description: string;
  category: string[];
  amount: IMoney;
  recurring?: boolean;
  metadata?: Record<string, string>;
}

export type { IncomeId };
