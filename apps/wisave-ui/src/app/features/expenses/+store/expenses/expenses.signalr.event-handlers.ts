import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { withEventHandlers } from '@ngrx/signals/events';
import { filter, map, pairwise } from 'rxjs';

import { ExpensesSignalRService } from '@core/signalr/expenses-signalr.service';
import { PortalSignalRService } from '@core/signalr/portal-signalr.service';
import type { IExpenseRecordedPayload, IExpenseUpdatedPayload } from '@core/signalr/expenses-signalr.types';
import { Currency } from '@core/types/currency.enum';
import type { IExpense } from '@core/types/expense.interface';
import {
  asExpenseAccountId,
  asExpenseCategoryId,
  asExpenseId,
  asExpenseSubcategoryId,
} from '@core/types/expense-id.types';
import { createMoney } from '@core/types/money.interface';

import { expensesPageEvents, expensesSignalREvents } from './expenses.events';

function mapCurrency(value: string): Currency {
  return (Object.values(Currency) as string[]).includes(value) ? (value as Currency) : Currency.PLN;
}

export function mapExpenseFromSignalR(payload: IExpenseRecordedPayload): IExpense {
  return {
    id: asExpenseId(payload.expenseId),
    date: new Date(payload.date),
    description: payload.description,
    amount: createMoney(payload.amount, mapCurrency(payload.currency)),
    accountId: asExpenseAccountId(payload.accountId),
    categoryId: asExpenseCategoryId(payload.categoryId),
    subcategoryId: payload.subcategoryId ? asExpenseSubcategoryId(payload.subcategoryId) : undefined,
    recurring: payload.recurring || undefined,
    ...(payload.metadata !== undefined && payload.metadata !== null && { metadata: payload.metadata }),
  };
}

// ExpenseUpdated is a partial patch — only fields that changed are non-null. Merge
// the patch over the existing store entity rather than constructing a fresh one.
export function mergeExpenseUpdate(existing: IExpense, payload: IExpenseUpdatedPayload): IExpense {
  return {
    ...existing,
    ...(payload.date !== null && { date: new Date(payload.date) }),
    ...(payload.description !== null && { description: payload.description }),
    ...((payload.amount !== null || payload.currency !== null) && {
      amount: createMoney(
        payload.amount ?? existing.amount.amount,
        payload.currency !== null ? mapCurrency(payload.currency) : existing.amount.currency,
      ),
    }),
    ...(payload.categoryId !== null && { categoryId: asExpenseCategoryId(payload.categoryId) }),
    ...(payload.subcategoryId !== null && { subcategoryId: asExpenseSubcategoryId(payload.subcategoryId) }),
    ...(payload.recurring !== null && { recurring: payload.recurring || undefined }),
    ...(payload.metadata !== null && { metadata: payload.metadata }),
  };
}

interface IExpensesEntitySlice {
  entityMap: () => Record<string, IExpense>;
}

export function withExpensesSignalR() {
  return signalStoreFeature(
    withProps(() => ({
      _signalR: inject(ExpensesSignalRService),
      _portal: inject(PortalSignalRService),
    })),
    withEventHandlers((store) => {
      const slice = store as unknown as IExpensesEntitySlice;
      return {
        expenseRecorded$: store._signalR.expenseRecorded$.pipe(
          filter((env) => env.entityId !== null && env.payload !== null),
          map((env) => expensesSignalREvents.expenseUpsertedSignalR({
            expense: mapExpenseFromSignalR(env.payload as IExpenseRecordedPayload),
          })),
        ),
        expenseUpdated$: store._signalR.expenseUpdated$.pipe(
          filter((env) => env.entityId !== null && env.payload !== null),
          map((env) => {
            const payload = env.payload as IExpenseUpdatedPayload;
            const existing = slice.entityMap()[payload.expenseId];
            if (!existing) {
              // Patch for an entity we don't have cached — skip; next page load will pick it up.
              return null;
            }
            return expensesSignalREvents.expenseUpsertedSignalR({
              expense: mergeExpenseUpdate(existing, payload),
            });
          }),
          filter((evt): evt is NonNullable<typeof evt> => evt !== null),
        ),
        expenseDeleted$: store._signalR.expenseDeleted$.pipe(
          filter((env) => env.entityId !== null),
          map((env) => expensesSignalREvents.expenseRemovedSignalR({
            id: asExpenseId(env.entityId as string),
          })),
        ),
        reconnectCatchUp$: toObservable(store._portal.status).pipe(
          pairwise(),
          filter(([prev, curr]) => (prev === 'reconnecting' || prev === 'disconnected') && curr === 'connected'),
          map(() => expensesPageEvents.opened()),
        ),
      };
    }),
  );
}
