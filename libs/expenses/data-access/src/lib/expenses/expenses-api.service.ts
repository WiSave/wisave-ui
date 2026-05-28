import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getApiBaseUrl } from '@wisave/platform/config';
import { type IExpenseMonthlyStats, type IExpenseMonthlyStatsApiDto } from '@wisave/shared/model';
import { type IExpenseCategoryApiDto } from '@wisave/shared/model';
import { type ExpenseCategoryId, type ExpenseId } from '@wisave/shared/model';
import { type IExpense, type IExpenseApiDto, type IExpensePageInfo, type IExpensesResponseDto } from '@wisave/shared/model';
import { type IExpenseCategory } from '@wisave/shared/model';

import { ExpensesMapperService } from './expenses-mapper.service';

// Inlined pagination types (core cannot import from shared)
type CursorDirection = 'next' | 'previous' | 'first';

interface ICursorPaginationParams {
  direction: CursorDirection;
  cursor: string | null;
  pageSize: number;
}

export interface IExpensesQueryParams extends ICursorPaginationParams {
  filter?: {
    dateRange?: { from: Date | null; to: Date | null };
    searchQuery?: string;
    categoryIds?: ExpenseCategoryId[];
    accountIds?: string[];
    recurring?: boolean | null;
  };
  sort?: { field: string; direction: 'asc' | 'desc' };
}

export interface IExpensesQueryResult {
  expenses: IExpense[];
  totalCount: number;
  pageInfo: IExpensePageInfo;
}

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  #http = inject(HttpClient);
  #mapper = inject(ExpensesMapperService);
  readonly #apiUrl = `${getApiBaseUrl()}/expenses`;

  getAllWithPagination(params: IExpensesQueryParams): Observable<IExpensesQueryResult> {
    return this.#http.get<IExpensesResponseDto>(this.#apiUrl, { params: this.#buildQueryParams(params) }).pipe(
      map((response) => ({
        expenses: this.#mapper.mapToExpenses(response.expenses),
        totalCount: response.totalCount,
        pageInfo: response.pageInfo,
      })),
    );
  }

  getById(id: ExpenseId): Observable<IExpense> {
    return this.#http.get<IExpenseApiDto>(`${this.#apiUrl}/${id}`).pipe(map((dto) => this.#mapper.mapToExpense(dto)));
  }

  getCategories(): Observable<IExpenseCategory[]> {
    return this.#http.get<IExpenseCategoryApiDto[]>(`${this.#apiUrl}/categories`).pipe(map((dtos) => this.#mapper.mapToCategories(dtos)));
  }

  createCategory(name: string): Observable<IExpenseCategory> {
    return this.#http.post<IExpenseCategoryApiDto>(`${this.#apiUrl}/categories`, { name }).pipe(map((dto) => this.#mapper.mapToCategory(dto)));
  }

  updateCategory(id: ExpenseCategoryId, name: string): Observable<IExpenseCategory> {
    return this.#http.put<IExpenseCategoryApiDto>(`${this.#apiUrl}/categories/${id}`, { name }).pipe(map((dto) => this.#mapper.mapToCategory(dto)));
  }

  addSubcategory(categoryId: ExpenseCategoryId, name: string): Observable<IExpenseCategory> {
    return this.#http.post<IExpenseCategoryApiDto>(`${this.#apiUrl}/categories/${categoryId}/subcategories`, { name }).pipe(map((dto) => this.#mapper.mapToCategory(dto)));
  }

  getMonthlyStats(year: number): Observable<IExpenseMonthlyStats[]> {
    const queryParams = new HttpParams().set('year', year.toString());
    return this.#http
      .get<IExpenseMonthlyStatsApiDto[]>(`${getApiBaseUrl()}/expenses/budgets/monthly-stats`, { params: queryParams })
      .pipe(
        map((dtos) =>
          dtos.map((dto) => ({
            year: dto.year,
            month: dto.month,
            total: dto.totalSpent,
            currency: this.#mapper.mapCurrency(dto.currency),
          })),
        ),
      );
  }

  #mapDirection(direction: CursorDirection): string {
    switch (direction) {
      case 'first': return 'next';
      case 'previous': return 'prev';
      default: return direction;
    }
  }

  #buildQueryParams(params: IExpensesQueryParams): HttpParams {
    const { direction, cursor, pageSize, filter, sort } = params;

    let queryParams = new HttpParams().set('direction', this.#mapDirection(direction)).set('pageSize', pageSize.toString());

    if (cursor && direction !== 'first') {
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

  #appendFilterParams(queryParams: HttpParams, filter: NonNullable<IExpensesQueryParams['filter']>): HttpParams {
    let next = queryParams;

    if (filter.dateRange?.from) {
      next = next.set('from', filter.dateRange.from.toISOString());
    }

    if (filter.dateRange?.to) {
      next = next.set('to', filter.dateRange.to.toISOString());
    }

    if (filter.searchQuery?.trim()) {
      next = next.set('search', filter.searchQuery.trim());
    }

    if (filter.categoryIds) {
      for (const id of filter.categoryIds) {
        next = next.append('categoryIds', id);
      }
    }

    if (filter.accountIds) {
      for (const id of filter.accountIds) {
        next = next.append('accountIds', id);
      }
    }

    if (filter.recurring !== null && filter.recurring !== undefined) {
      next = next.set('recurring', filter.recurring.toString());
    }

    return next;
  }
}
