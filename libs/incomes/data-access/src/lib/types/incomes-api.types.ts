import type { IPageInfo } from '@wisave/shared/model';

export interface IIncomeApiDto {
  id: string;
  date: string;
  description: string;
  categories: string[];
  amount: number;
  currency: string;
  recurring: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface IIncomesResponseDto {
  incomes: IIncomeApiDto[];
  totalCount: number;
  pageInfo: IPageInfo;
}
