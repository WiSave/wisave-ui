import { Injectable } from '@angular/core';

import { Currency } from '@core/types/currency.enum';
import { type IBudget, type IBudgetApiResponse, type ICategorySpendingSummary, type ICategorySpendingSummaryApiDto } from '@core/types/expense-budget.interface';
import { asBudgetId, asExpenseCategoryId } from '@core/types/expense-id.types';

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
