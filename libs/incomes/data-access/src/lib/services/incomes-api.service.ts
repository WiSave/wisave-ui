import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, of, throwError, type Observable } from 'rxjs';

import { getApiBaseUrl } from '@wisave/platform/config';

import type { IIncomeApiDto, IIncomesResponseDto } from '../types/incomes-api.types';
import type { IIncomesQueryParams, IIncomesQueryResult } from '../types/incomes-query.types';
import type { IIncomeMonthlyStats, IIncomesFilter, IIncomeStats } from '../types/incomes-state.types';
import type { IIncome, IncomeId } from '../types/incomes.interfaces';
import { IncomesMapperService } from './incomes-mapper.service';

@Injectable({ providedIn: 'root' })
export class IncomesApiService {
  #http = inject(HttpClient);
  #mapper = inject(IncomesMapperService);

  readonly #apiUrl = `${getApiBaseUrl()}/incomes`;

  getAllWithPagination(params: IIncomesQueryParams): Observable<IIncomesQueryResult> {
    return this.#http.get<IIncomesResponseDto>(this.#apiUrl, { params: this.#buildQueryParams(params) }).pipe(
      map((response) => ({
        incomes: this.#mapper.mapToIncomes(response.incomes),
        totalCount: response.totalCount,
        pageInfo: response.pageInfo,
      })),
    );
  }

  getById(id: IncomeId): Observable<IIncome | null> {
    return this.#http.get<IIncomeApiDto>(`${this.#apiUrl}/${id}`).pipe(
      map((document) => this.#mapper.mapToIncome(document)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      }),
    );
  }

  getTotalAmount(currency?: string): Observable<number> {
    let queryParams = new HttpParams();

    if (currency) {
      queryParams = queryParams.set('currency', currency);
    }

    return this.#http.get<number>(`${this.#apiUrl}/total-amount`, { params: queryParams });
  }

  getCategories(): Observable<string[]> {
    return this.#http.get<string[]>(`${this.#apiUrl}/categories`);
  }

  getIncomeStats(includeNonRecurring = false): Observable<IIncomeStats> {
    const queryParams = new HttpParams().set('includeNonRecurring', includeNonRecurring.toString());
    return this.#http.get<IIncomeStats>(`${this.#apiUrl}/stats`, { params: queryParams });
  }

  getIncomeMonthlyStats(year: number): Observable<IIncomeMonthlyStats[]> {
    const queryParams = new HttpParams().set('year', year.toString());
    return this.#http.get<IIncomeMonthlyStats[]>(`${this.#apiUrl}/monthly-stats`, { params: queryParams });
  }

  #buildQueryParams(params: IIncomesQueryParams): HttpParams {
    const { direction, cursor, pageSize, filter, sort } = params;

    let queryParams = new HttpParams().set('direction', direction).set('pageSize', pageSize.toString());

    if (cursor) {
      queryParams = queryParams.set('cursor', cursor);
    }

    if (filter) {
      queryParams = this.#appendFilterParams(queryParams, filter);
    }

    if (sort) {
      queryParams = queryParams.set('sortField', sort.field).set('sortDirection', sort.direction);
    }

    return queryParams;
  }

  #appendFilterParams(queryParams: HttpParams, filter: IIncomesFilter): HttpParams {
    let next = queryParams;

    if (filter.dateRange.from) {
      next = next.set('from', filter.dateRange.from.toISOString());
    }

    if (filter.dateRange.to) {
      next = next.set('to', filter.dateRange.to.toISOString());
    }

    if (filter.searchQuery.trim()) {
      next = next.set('search', filter.searchQuery.trim());
    }

    for (const category of filter.categories) {
      next = next.append('categories', category);
    }

    if (filter.recurring !== null) {
      next = next.set('recurring', filter.recurring.toString());
    }

    return next;
  }
}
