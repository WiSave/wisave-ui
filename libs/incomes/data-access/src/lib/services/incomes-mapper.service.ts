import { Injectable } from '@angular/core';

import { Currency, type IMoney } from '@wisave/shared/model';

import { asIncomeId } from '../types/income-id.type';
import type { IIncomeApiDto } from '../types/incomes-api.types';
import type { IIncome } from '../types/incomes.interfaces';

@Injectable({ providedIn: 'root' })
export class IncomesMapperService {
  mapToIncome(document: IIncomeApiDto): IIncome {
    return {
      id: asIncomeId(document.id),
      date: new Date(document.date),
      description: document.description,
      category: document.categories,
      amount: this.#mapToMoney(document.amount, document.currency),
      recurring: document.recurring || undefined,
    };
  }

  mapToIncomes(documents: IIncomeApiDto[]): IIncome[] {
    return documents.map((doc) => this.mapToIncome(doc));
  }

  #mapToMoney(amount: number, currency: string): IMoney {
    return {
      amount,
      currency: this.#mapToCurrency(currency),
    };
  }

  #mapToCurrency(currency: string): Currency {
    const currencyMap: Record<string, Currency> = {
      PLN: Currency.PLN,
      EUR: Currency.EUR,
      USD: Currency.USD,
      GBP: Currency.GBP,
      CHF: Currency.CHF,
    };

    return currencyMap[currency] ?? Currency.PLN;
  }
}
