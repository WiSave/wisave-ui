import type { ISignalREnvelope } from './signalr-envelope.types';

export const ExpensesEventType = {
  ExpenseRecorded: 'expense.recorded',
  ExpenseUpdated: 'expense.updated',
  ExpenseDeleted: 'expense.deleted',
  FundingAccountOpened: 'FundingAccountOpened',
  FundingAccountUpdated: 'FundingAccountUpdated',
  FundingAccountClosed: 'FundingAccountClosed',
  FundingPaymentInstrumentAdded: 'FundingPaymentInstrumentAdded',
  FundingPaymentInstrumentUpdated: 'FundingPaymentInstrumentUpdated',
  FundingPaymentInstrumentRemoved: 'FundingPaymentInstrumentRemoved',
  FundingTransferPosted: 'FundingTransferPosted',
  BudgetCreated: 'budget.created',
  BudgetCopiedFromPrevious: 'budget.copiedFromPrevious',
  OverallLimitSet: 'budget.overallLimitSet',
  CategoryLimitSet: 'budget.categoryLimitSet',
  CategoryLimitRemoved: 'budget.categoryLimitRemoved',
  CommandFailed: 'command.failed',
} as const;

export type TExpensesEventType = (typeof ExpensesEventType)[keyof typeof ExpensesEventType];

export type TExpensesEnvelope<TPayload = unknown> = ISignalREnvelope<TPayload> & { domain: 'expenses' };

// Backend integration-event payload shapes. Field names mirror the MT contract after camelCase JSON serialization.

export interface IExpenseRecordedPayload {
  expenseId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subcategoryId: string | null;
  amount: number;
  currency: string;
  date: string; // DateOnly serialized as "YYYY-MM-DD"
  description: string;
  recurring: boolean;
  metadata: Record<string, string> | null;
  timestamp: string;
}

// Partial patch: only the fields that changed are non-null. AccountId is NOT
// carried on updates (updates cannot change the account).
export interface IExpenseUpdatedPayload {
  expenseId: string;
  userId: string;
  amount: number | null;
  currency: string | null;
  date: string | null;
  description: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  recurring: boolean | null;
  metadata: Record<string, string> | null;
  timestamp: string;
}

export interface IExpenseDeletedPayload {
  expenseId: string;
  userId: string;
  timestamp: string;
}

export interface IFundingAccountOpenedPayload {
  fundingAccountId: string;
  userId: string;
  name: string;
  kind: 'BankAccount' | 'Cash';
  currency: string;
  openingBalance: number;
  color: string | null;
  timestamp: string;
}

export interface IFundingAccountUpdatedPayload {
  fundingAccountId: string;
  userId: string;
  name: string;
  kind: 'BankAccount' | 'Cash';
  currency: string;
  color: string | null;
  timestamp: string;
}

export interface IFundingAccountClosedPayload {
  fundingAccountId: string;
  userId: string;
  timestamp: string;
}

export interface ICommandFailedPayload {
  correlationId: string;
  userId: string;
  commandType: string;
  reason: string;
  timestamp: string;
}
