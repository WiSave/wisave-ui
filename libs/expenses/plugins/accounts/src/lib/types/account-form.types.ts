import type { FormControl } from '@angular/forms';

import type { Currency, ExpenseAccountType } from '@wisave/shared/model';

export interface AccountFormModel {
  name: FormControl<string>;
  type: FormControl<ExpenseAccountType>;
  currency: FormControl<Currency>;
  balance: FormControl<number | null>;
  color: FormControl<string>;
}
