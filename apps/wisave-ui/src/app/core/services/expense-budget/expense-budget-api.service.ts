import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getApiBaseUrl } from '@wisave/platform/config';
import type { ICommandResponse } from '@wisave/shared/model';
import { type IBudget, type IBudgetApiResponse, type ICategorySpendingSummary, type ICategorySpendingSummaryApiDto } from '@wisave/shared/model';
import { type BudgetId, type ExpenseCategoryId } from '@wisave/shared/model';

import { ExpenseBudgetMapperService } from './expense-budget-mapper.service';

@Injectable({ providedIn: 'root' })
export class ExpenseBudgetApiService {
  #http = inject(HttpClient);
  #mapper = inject(ExpenseBudgetMapperService);
  readonly #apiUrl = `${getApiBaseUrl()}/expenses/budgets`;

  getBudget(month: number, year: number): Observable<IBudget> {
    return this.#http.get<IBudgetApiResponse>(this.#apiUrl, { params: { month: month.toString(), year: year.toString() } }).pipe(map((dto) => this.#mapper.mapToBudget(dto)));
  }

  setOverallLimit(budgetId: BudgetId, limit: number): Observable<ICommandResponse> {
    return this.#http.put<ICommandResponse>(`${this.#apiUrl}/${budgetId}/limit`, { totalLimit: limit });
  }

  setCategoryBudget(budgetId: BudgetId, categoryId: ExpenseCategoryId, limit: number): Observable<ICommandResponse> {
    return this.#http.put<ICommandResponse>(`${this.#apiUrl}/${budgetId}/categories/${categoryId}`, { limit });
  }

  removeCategoryBudget(budgetId: BudgetId, categoryId: ExpenseCategoryId): Observable<ICommandResponse> {
    return this.#http.delete<ICommandResponse>(`${this.#apiUrl}/${budgetId}/categories/${categoryId}`);
  }

  copyBudgetFromPrevious(month: number, year: number): Observable<ICommandResponse> {
    return this.#http.post<ICommandResponse>(`${this.#apiUrl}/copy`, { month, year });
  }

  getSpendingSummary(month: number, year: number): Observable<ICategorySpendingSummary[]> {
    return this.#http.get<ICategorySpendingSummaryApiDto[]>(`${this.#apiUrl}/summary`, { params: { month: month.toString(), year: year.toString() } }).pipe(map((dtos) => this.#mapper.mapToSpendingSummaries(dtos)));
  }
}
