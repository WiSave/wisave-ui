import type { FormControl } from '@angular/forms';
import type { Currency } from '@core/types/currency.enum';
import type { ExpenseAccountType } from '@core/types/expense-account.interface';

export interface AccountFormModel {
  name: FormControl<string>;
  type: FormControl<ExpenseAccountType>;
  currency: FormControl<Currency>;
  balance: FormControl<number | null>;
  color: FormControl<string>;
}
