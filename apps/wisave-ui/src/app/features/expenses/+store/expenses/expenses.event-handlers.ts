import { type Signal, inject } from '@angular/core';
import { catchError, exhaustMap, map, merge, of, switchMap, tap } from 'rxjs';

import { signalStoreFeature, withProps } from '@ngrx/signals';
import { type EntityMap } from '@ngrx/signals/entities';
import { Events, withEventHandlers } from '@ngrx/signals/events';

import type { IExpenseAccount } from '@wisave/shared/model';
import type { IExpenseCategory } from '@wisave/shared/model';
import type { IExpense } from '@wisave/shared/model';
import { type IPagination, type CursorDirection } from '@wisave/shared/model';
import { toStoreError } from '@wisave/shared/ui';
import { ExpensesApiService, type IExpensesQueryParams } from '@services/expenses/expenses-api.service';
import { ExpenseAccountsApiService } from '@services/expense-accounts/expense-accounts-api.service';

import { type IExpensesFilter, type IExpensesSortOrder } from '../../types/expenses-state.types';
import { expensesApiEvents, expensesPageEvents } from './expenses.events';
import { emptyFilter } from '../../types/expenses-state.types';

export interface ExpensesStoreSlice {
  filter: Signal<IExpensesFilter>;
  sort: Signal<IExpensesSortOrder>;
  pagination: Signal<IPagination>;
  entityMap: Signal<EntityMap<IExpense>>;
  availableCategories: Signal<IExpenseCategory[]>;
  availableAccounts: Signal<IExpenseAccount[]>;
}

export function withExpensesEventHandlers(store: ExpensesStoreSlice) {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _api: inject(ExpensesApiService),
      _accountsApi: inject(ExpenseAccountsApiService),
    })),
    withEventHandlers((props) => {
      const loadExpenses$ = (params: IExpensesQueryParams) =>
        props._api.getAllWithPagination(params).pipe(
          map((result) =>
            expensesApiEvents.loadedSuccess({
              expenses: result.expenses,
              totalCount: result.totalCount,
              pageInfo: result.pageInfo,
            }),
          ),
          catchError((err) => of(expensesApiEvents.loadedFailure({ error: toStoreError(err) }))),
        );

      const loadCategories$ = () =>
        props._api.getCategories().pipe(
          map((categories) => expensesApiEvents.categoriesLoadedSuccess({ categories })),
          catchError((err) => of(expensesApiEvents.categoriesLoadedFailure({ error: toStoreError(err) }))),
        );

      const loadAccounts$ = () =>
        props._accountsApi.getAll().pipe(
          map((accounts) => expensesApiEvents.accountsLoadedSuccess({ accounts })),
          catchError((err) => of(expensesApiEvents.accountsLoadedFailure({ error: toStoreError(err) }))),
        );

      const getQueryParams = (pageSize: number, direction: CursorDirection, cursor: string | null, filter?: IExpensesFilter, sort?: IExpensesSortOrder): IExpensesQueryParams => ({
        direction,
        cursor,
        pageSize,
        filter,
        sort,
      });

      return {
        loadExpenses$: props._events.on(expensesPageEvents.opened).pipe(
          exhaustMap(() =>
            merge(
              loadExpenses$(getQueryParams(store.pagination().rows, 'first', null, store.filter(), store.sort())),
              loadCategories$(),
              loadAccounts$(),
            ),
          ),
        ),

        navigatePage$: props._events
          .on(expensesPageEvents.navigatePage)
          .pipe(switchMap(({ payload }) => loadExpenses$(getQueryParams(payload.pageSize, payload.direction, payload.cursor, store.filter(), store.sort())))),

        pageSizeChanged$: props._events
          .on(expensesPageEvents.pageSizeChanged)
          .pipe(switchMap(({ payload }) => loadExpenses$(getQueryParams(payload.rows, 'first', null, store.filter(), store.sort())))),

        filterApplied$: props._events.on(expensesPageEvents.filterApplied).pipe(
          switchMap(({ payload }) => {
            const updatedFilter = { ...store.filter(), ...payload.filter };
            return loadExpenses$(getQueryParams(store.pagination().rows, 'first', null, updatedFilter, store.sort()));
          }),
        ),

        filtersCleared$: props._events
          .on(expensesPageEvents.filtersCleared)
          .pipe(switchMap(() => loadExpenses$(getQueryParams(store.pagination().rows, 'first', null, emptyFilter, store.sort())))),

        sortChanged$: props._events
          .on(expensesPageEvents.sortChanged)
          .pipe(switchMap(({ payload }) => loadExpenses$(getQueryParams(store.pagination().rows, 'first', null, store.filter(), payload.sort)))),

        selectExpense$: props._events.on(expensesPageEvents.selectExpense).pipe(
          exhaustMap(({ payload }) => {
            const cached = store.entityMap()[payload.id];
            if (cached) {
              return of(expensesApiEvents.fetchByIdSuccess({ expense: cached }));
            }
            return props._api.getById(payload.id).pipe(
              map((expense) => {
                if (!expense) {
                  return expensesApiEvents.fetchByIdFailure({ error: { message: 'Expense not found', category: 'validation' } });
                }
                return expensesApiEvents.fetchByIdSuccess({ expense });
              }),
              catchError((err) => of(expensesApiEvents.fetchByIdFailure({ error: toStoreError(err) }))),
            );
          }),
        ),

        logErrors$: props._events
          .on(
            expensesApiEvents.loadedFailure,
            expensesApiEvents.addedFailure,
            expensesApiEvents.updatedFailure,
            expensesApiEvents.removedFailure,
            expensesApiEvents.fetchByIdFailure,
            expensesApiEvents.categoriesLoadedFailure,
            expensesApiEvents.accountsLoadedFailure,
          )
          .pipe(tap(({ payload }) => console.error('[Expenses API Error]', payload.error.category, payload.error.message))),
      };
    }),
  );
}
