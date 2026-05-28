export type ExpenseId = string & { readonly __brand: 'ExpenseId' };
export const asExpenseId = (value: string): ExpenseId => value as ExpenseId;

export type ExpenseAccountId = string & { readonly __brand: 'ExpenseAccountId' };
export const asExpenseAccountId = (value: string): ExpenseAccountId => value as ExpenseAccountId;

export type ExpenseCategoryId = string & { readonly __brand: 'ExpenseCategoryId' };
export const asExpenseCategoryId = (value: string): ExpenseCategoryId => value as ExpenseCategoryId;

export type ExpenseSubcategoryId = string & { readonly __brand: 'ExpenseSubcategoryId' };
export const asExpenseSubcategoryId = (value: string): ExpenseSubcategoryId => value as ExpenseSubcategoryId;

export type FundingPaymentInstrumentId = string & { readonly __brand: 'FundingPaymentInstrumentId' };
export const asFundingPaymentInstrumentId = (value: string): FundingPaymentInstrumentId => value as FundingPaymentInstrumentId;

export type BudgetId = string & { readonly __brand: 'BudgetId' };
export const asBudgetId = (value: string): BudgetId => value as BudgetId;
