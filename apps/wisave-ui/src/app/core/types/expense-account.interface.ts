import type { Currency } from './currency.enum';
import type { ExpenseAccountId, FundingPaymentInstrumentId } from './expense-id.types';

export type FundingAccountKind = 'BankAccount' | 'Cash';
export type PaymentInstrumentKind = 'DebitCard' | 'VirtualDebitCard' | 'Other';

export type ExpenseAccountType = 'bank_account' | 'cash';
export type ExpenseAccountTypeApi = FundingAccountKind;

interface IAccountBase {
  id: ExpenseAccountId;
  name: string;
  currency: Currency;
  color?: string;
  isActive: boolean;
}

export interface IBankAccount extends IAccountBase {
  type: 'bank_account';
  kind: 'BankAccount';
  balance: number;
  paymentInstruments: IFundingPaymentInstrument[];
}

export interface ICashAccount extends IAccountBase {
  type: 'cash';
  kind: 'Cash';
  balance: number;
  paymentInstruments: IFundingPaymentInstrument[];
}

export type IFundingAccount = IBankAccount | ICashAccount;
export type IExpenseAccount = IFundingAccount;

export interface IFundingPaymentInstrument {
  id: FundingPaymentInstrumentId;
  fundingAccountId: ExpenseAccountId;
  name: string;
  kind: PaymentInstrumentKind;
  lastFourDigits?: string;
  network?: string;
  color?: string;
  isActive: boolean;
}

export function isFundingAccount(a: IExpenseAccount): a is IFundingAccount {
  return a.type === 'bank_account' || a.type === 'cash';
}

export function isBankAccount(a: IExpenseAccount): a is IBankAccount {
  return a.type === 'bank_account';
}

export interface IFundingAccountWritePayload {
  name: string;
  type: ExpenseAccountType;
  kind: FundingAccountKind;
  currency: Currency;
  openingBalance: number;
  color?: string;
}

export type IExpenseAccountWritePayload = IFundingAccountWritePayload;

export interface IFundingPaymentInstrumentWritePayload {
  name: string;
  kind: PaymentInstrumentKind;
  lastFourDigits?: string | null;
  network?: string | null;
  color?: string | null;
}

export interface IFundingTransferWritePayload {
  amount: number;
  postedAtUtc?: string | null;
}

export interface IExpenseAccountUpdateChanges {
  name?: string;
  type?: ExpenseAccountType;
  kind?: FundingAccountKind;
  currency?: Currency;
  openingBalance?: number | null;
  color?: string | null;
}

export interface IFundingAccountApiDto {
  id: string;
  userId: string;
  name: string;
  kind: FundingAccountKind;
  currency: string;
  balance: number;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface IFundingPaymentInstrumentApiDto {
  id: string;
  fundingAccountId: string;
  userId: string;
  name: string;
  kind: PaymentInstrumentKind;
  lastFourDigits: string | null;
  network: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type IExpenseAccountApiDto = IFundingAccountApiDto;
