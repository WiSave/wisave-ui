import { Injectable } from '@angular/core';

import { Currency } from '@core/types/currency.enum';
import { type IExpense, type IExpenseApiDto } from '@core/types/expense.interface';
import { type IExpenseCategory, type IExpenseCategoryApiDto } from '@core/types/expense-category.interface';
import { asExpenseAccountId, asExpenseCategoryId, asExpenseId, asExpenseSubcategoryId } from '@core/types/expense-id.types';
import { createMoney } from '@core/types/money.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesMapperService {
  mapToExpense(dto: IExpenseApiDto): IExpense {
    return {
      id: asExpenseId(dto.id),
      date: new Date(dto.date),
      description: dto.description,
      amount: createMoney(dto.amount, this.mapCurrency(dto.currency)),
      accountId: asExpenseAccountId(dto.accountId),
      categoryId: asExpenseCategoryId(dto.categoryId),
      subcategoryId: dto.subcategoryId ? asExpenseSubcategoryId(dto.subcategoryId) : undefined,
      recurring: dto.recurring || undefined,
    };
  }

  mapToExpenses(dtos: IExpenseApiDto[]): IExpense[] {
    return dtos.map((dto) => this.mapToExpense(dto));
  }

  mapToCategory(dto: IExpenseCategoryApiDto): IExpenseCategory {
    return {
      id: asExpenseCategoryId(dto.id),
      name: dto.name,
      subcategories: dto.subcategories.map((sub) => ({
        id: asExpenseSubcategoryId(sub.id),
        name: sub.name,
      })),
    };
  }

  mapToCategories(dtos: IExpenseCategoryApiDto[]): IExpenseCategory[] {
    return dtos.map((dto) => this.mapToCategory(dto));
  }

  mapCurrency(value: string): Currency {
    return (Object.values(Currency) as string[]).includes(value) ? (value as Currency) : Currency.PLN;
  }
}
