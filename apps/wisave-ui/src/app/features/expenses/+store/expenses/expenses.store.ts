import { withDevtools, withGlitchTracking, withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStore, withFeature, withState } from '@ngrx/signals';
import { removeEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { on } from '@ngrx/signals/events';

import type { IExpense } from '@wisave/shared/model';

import { withExpensesEventHandlers as withEventHandlers } from './expenses.event-handlers';
import { withExpensesSignalR } from './expenses.signalr.event-handlers';
import { expensesApiEvents, expensesPageEvents, expensesSignalREvents } from './expenses.events';
import { initialState } from './expenses.state';
import { emptyFilter } from '../../types/expenses-state.types';

export const ExpensesStore = signalStore(
  { providedIn: 'root' },
  withDevtools('Expenses', withGlitchTracking()),
  withState(initialState),
  withEntities<IExpense>(),
  withTrackedReducer(
    on(expensesPageEvents.opened, () => ({ isLoading: true, error: null })),
    on(expensesPageEvents.navigatePage, ({ payload }, state) => {
      const currentPage = state.pagination.currentPage;
      const newPage = payload.direction === 'next' ? currentPage + 1 : payload.direction === 'previous' ? Math.max(1, currentPage - 1) : 1;

      return {
        isLoading: true,
        error: null,
        pagination: {
          ...state.pagination,
          pendingPage: newPage,
        },
      };
    }),
    on(expensesPageEvents.pageSizeChanged, ({ payload }, state) => ({
      isLoading: true,
      error: null,
      pagination: {
        ...state.pagination,
        pendingPage: null,
        rows: payload.rows,
        currentPage: 1,
      },
    })),
    on(expensesPageEvents.selectExpense, () => ({ isLoading: true, error: null })),
    on(expensesPageEvents.add, () => ({ isLoading: true, error: null })),
    on(expensesPageEvents.update, () => ({ isLoading: true, error: null })),
    on(expensesPageEvents.remove, () => ({ isLoading: true, error: null })),
    on(expensesPageEvents.filterApplied, ({ payload }, state) => ({
      isLoading: true,
      error: null,
      filter: {
        ...state.filter,
        ...payload.filter,
      },
      pagination: {
        ...state.pagination,
        pendingPage: null,
        currentPage: 1,
      },
    })),
    on(expensesPageEvents.filtersCleared, (_, state) => ({
      isLoading: true,
      error: null,
      filter: emptyFilter,
      pagination: {
        ...state.pagination,
        pendingPage: null,
        currentPage: 1,
      },
    })),
    on(expensesPageEvents.sortChanged, ({ payload }, state) => ({
      isLoading: true,
      error: null,
      sort: payload.sort,
      pagination: {
        ...state.pagination,
        pendingPage: null,
        currentPage: 1,
      },
    })),
    on(expensesApiEvents.loadedSuccess, ({ payload }, state) => [
      setAllEntities<IExpense>(payload.expenses),
      () => ({
        isLoading: false,
        error: null,
        pagination: {
          ...state.pagination,
          pendingPage: null,
          currentPage: state.pagination.pendingPage ?? state.pagination.currentPage,
          totalRecords: payload.totalCount,
          pageInfo: payload.pageInfo,
        },
      }),
    ]),
    on(expensesApiEvents.addAccepted, () => ({ isLoading: false, error: null })),
    on(expensesApiEvents.updateAccepted, () => ({ isLoading: false, error: null })),
    on(expensesApiEvents.removeAccepted, () => ({ isLoading: false, error: null })),

    on(expensesSignalREvents.expenseUpsertedSignalR, ({ payload }, state) => [
      setEntity<IExpense>(payload.expense),
      () => ({
        selectedExpense: state.selectedExpense?.id === payload.expense.id ? payload.expense : state.selectedExpense,
      }),
    ]),
    on(expensesSignalREvents.expenseRemovedSignalR, ({ payload }) => [removeEntity(payload.id)]),
    on(expensesApiEvents.fetchByIdSuccess, ({ payload }) => [setEntity<IExpense>(payload.expense), () => ({ isLoading: false, error: null, selectedExpense: payload.expense })]),
    on(expensesApiEvents.fetchByIdFailure, ({ payload }) => ({ isLoading: false, error: payload.error, selectedExpense: null })),

    on(expensesApiEvents.loadedFailure, ({ payload }, state) => ({
      isLoading: false,
      error: payload.error,
      pagination: {
        ...state.pagination,
        pendingPage: null,
      },
    })),
    on(expensesApiEvents.addedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
    on(expensesApiEvents.updatedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),
    on(expensesApiEvents.removedFailure, ({ payload }) => ({
      isLoading: false,
      error: payload.error,
    })),

    // Categories
    on(expensesApiEvents.categoriesLoadedSuccess, ({ payload }) => ({
      availableCategories: payload.categories,
      categoriesLoading: false,
    })),
    on(expensesApiEvents.categoriesLoadedFailure, ({ payload }) => ({
      categoriesLoading: false,
      error: payload.error,
    })),

    // Accounts
    on(expensesApiEvents.accountsLoadedSuccess, ({ payload }) => ({
      availableAccounts: payload.accounts,
      accountsLoading: false,
    })),
    on(expensesApiEvents.accountsLoadedFailure, ({ payload }) => ({
      accountsLoading: false,
      error: payload.error,
    })),
  ),
  withFeature((store) => withEventHandlers(store)),
  withExpensesSignalR(),
);
