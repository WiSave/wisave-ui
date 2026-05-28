import { Injectable } from '@angular/core';

import { Currency } from '@wisave/shared/model';
import { type IBudget, type IBudgetApiResponse, type ICategorySpendingSummary, type ICategorySpendingSummaryApiDto } from '@wisave/shared/model';
import { asBudgetId, asExpenseCategoryId } from '@wisave/shared/model';

@Injectable({ providedIn: 'root' })
export class ExpenseBudgetMapperService {
  mapToBudget(dto: IBudgetApiResponse): IBudget {
    return {
      id: asBudgetId(dto.budget.id),
      month: dto.budget.month,
      year: dto.budget.year,
      totalLimit: dto.budget.totalLimit,
      currency: this.#mapCurrency(dto.budget.currency),
      categoryBudgets: dto.categoryLimits.map((cl) => ({
        categoryId: asExpenseCategoryId(cl.categoryId),
        limit: cl.limit,
        spent: 0,
      })),
      recurring: dto.budget.recurring ?? true,
    };
  }

  mapToSpendingSummaries(dtos: ICategorySpendingSummaryApiDto[]): ICategorySpendingSummary[] {
    return dtos.map((dto) => ({
      categoryId: asExpenseCategoryId(dto.categoryId),
      categoryName: dto.categoryName,
      spent: dto.totalSpent,
      limit: null,
    }));
  }

  #mapCurrency(value: string): Currency {
    return (Object.values(Currency) as string[]).includes(value) ? (value as Currency) : Currency.PLN;
  }
}
