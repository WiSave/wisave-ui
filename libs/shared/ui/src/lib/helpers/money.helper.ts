import { createMoney, Currency, formatMoney } from '@wisave/shared/model';

export function formatAmount(amount: number, currency: Currency = Currency.PLN): string {
  return formatMoney(createMoney(amount, currency));
}
