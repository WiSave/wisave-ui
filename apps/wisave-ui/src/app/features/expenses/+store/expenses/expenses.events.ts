import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { IExpenseAccount } from '@wisave/shared/model';
import type { IExpenseCategory } from '@wisave/shared/model';
import type { ExpenseId } from '@wisave/shared/model';
import type { IExpense, IExpensePageInfo } from '@wisave/shared/model';
import type { IStoreError } from '@wisave/shared/model';

import type { IExpensesFilter, IExpensesSortOrder } from '../../types/expenses-state.types';

import type { CursorDirection } from '@wisave/shared/model';

// UI/Component events - commands from user interactions
export const expensesPageEvents = eventGroup({
  source: 'Expenses Page',
  events: {
    opened: type<void>(),
    navigatePage: type<{ direction: CursorDirection; cursor: string | null; pageSize: number }>(),
    pageSizeChanged: type<{ rows: number }>(),
    add: type<{ expense: Omit<IExpense, 'id'> }>(),
    update: type<{ id: ExpenseId; changes: Partial<IExpense> }>(),
    remove: type<{ id: ExpenseId }>(),
    filterApplied: type<{ filter: Partial<IExpensesFilter> }>(),
    filtersCleared: type<void>(),
    sortChanged: type<{ sort: IExpensesSortOrder }>(),
    selectExpense: type<{ id: ExpenseId }>(),
  },
});

// API response events - results from async operations
export const expensesApiEvents = eventGroup({
  source: 'Expenses API',
  events: {
    loadedSuccess: type<{ expenses: IExpense[]; totalCount: number; pageInfo: IExpensePageInfo }>(),
    loadedFailure: type<{ error: IStoreError }>(),
    addAccepted: type<void>(),
    addedFailure: type<{ error: IStoreError }>(),
    updateAccepted: type<void>(),
    updatedFailure: type<{ id: ExpenseId; error: IStoreError }>(),
    removeAccepted: type<void>(),
    removedFailure: type<{ id: ExpenseId; error: IStoreError }>(),
    categoriesLoadedSuccess: type<{ categories: IExpenseCategory[] }>(),
    categoriesLoadedFailure: type<{ error: IStoreError }>(),
    accountsLoadedSuccess: type<{ accounts: IExpenseAccount[] }>(),
    accountsLoadedFailure: type<{ error: IStoreError }>(),
    fetchByIdSuccess: type<{ expense: IExpense }>(),
    fetchByIdFailure: type<{ error: IStoreError }>(),
  },
});

// SignalR events - pushed from backend via the realtime hub
export const expensesSignalREvents = eventGroup({
  source: 'Expenses SignalR',
  events: {
    expenseUpsertedSignalR: type<{ expense: IExpense }>(),
    expenseRemovedSignalR: type<{ id: ExpenseId }>(),
  },
});
