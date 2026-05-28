import { Injectable, inject } from '@angular/core';
import { filter, share, type Observable } from 'rxjs';

import { PortalSignalRService } from './portal-signalr.service';
import type { ISignalREnvelope } from './signalr-envelope.types';

import {
  ExpensesEventType,
  type TExpensesEnvelope,
  type TExpensesEventType,
  type IExpenseRecordedPayload,
  type IExpenseUpdatedPayload,
  type IExpenseDeletedPayload,
  type IFundingAccountOpenedPayload,
  type IFundingAccountUpdatedPayload,
  type IFundingAccountClosedPayload,
  type ICommandFailedPayload,
} from './expenses-signalr.types';

@Injectable({ providedIn: 'root' })
export class ExpensesSignalRService {
  readonly #portal = inject(PortalSignalRService);

  readonly expenses$: Observable<TExpensesEnvelope> = this.#portal.messages$.pipe(
    filter((env): env is TExpensesEnvelope => env.domain === 'expenses'),
    share(),
  );

  readonly expenseRecorded$ = this.#byType<IExpenseRecordedPayload>(ExpensesEventType.ExpenseRecorded);
  readonly expenseUpdated$ = this.#byType<IExpenseUpdatedPayload>(ExpensesEventType.ExpenseUpdated);
  readonly expenseDeleted$ = this.#byType<IExpenseDeletedPayload>(ExpensesEventType.ExpenseDeleted);
  readonly fundingAccountOpened$ = this.#byType<IFundingAccountOpenedPayload>(ExpensesEventType.FundingAccountOpened);
  readonly fundingAccountUpdated$ = this.#byType<IFundingAccountUpdatedPayload>(ExpensesEventType.FundingAccountUpdated);
  readonly fundingAccountClosed$ = this.#byType<IFundingAccountClosedPayload>(ExpensesEventType.FundingAccountClosed);
  readonly fundingPaymentInstrumentAdded$ = this.#byType(ExpensesEventType.FundingPaymentInstrumentAdded);
  readonly fundingPaymentInstrumentUpdated$ = this.#byType(ExpensesEventType.FundingPaymentInstrumentUpdated);
  readonly fundingPaymentInstrumentRemoved$ = this.#byType(ExpensesEventType.FundingPaymentInstrumentRemoved);
  readonly fundingTransferPosted$ = this.#byType(ExpensesEventType.FundingTransferPosted);
  readonly budgetCreated$ = this.#byType(ExpensesEventType.BudgetCreated);
  readonly budgetCopiedFromPrevious$ = this.#byType(ExpensesEventType.BudgetCopiedFromPrevious);
  readonly overallLimitSet$ = this.#byType(ExpensesEventType.OverallLimitSet);
  readonly categoryLimitSet$ = this.#byType(ExpensesEventType.CategoryLimitSet);
  readonly categoryLimitRemoved$ = this.#byType(ExpensesEventType.CategoryLimitRemoved);
  readonly commandFailed$ = this.#byType<ICommandFailedPayload>(ExpensesEventType.CommandFailed);

  #byType<TPayload = unknown>(type: TExpensesEventType): Observable<ISignalREnvelope<TPayload>> {
    return this.expenses$.pipe(
      filter((env) => env.eventType === type),
    ) as Observable<ISignalREnvelope<TPayload>>;
  }
}
