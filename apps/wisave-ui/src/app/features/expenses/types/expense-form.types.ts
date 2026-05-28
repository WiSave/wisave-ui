import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { Currency } from '@core/types/currency.enum';
import type { ExpenseAccountId, ExpenseCategoryId, ExpenseSubcategoryId } from '@core/types/expense-id.types';

export interface MetadataEntryModel {
  key: FormControl<string>;
  value: FormControl<string>;
}

export interface ExpenseFormModel {
  date: FormControl<Date | null>;
  description: FormControl<string>;
  categoryId: FormControl<ExpenseCategoryId | null>;
  subcategoryId: FormControl<ExpenseSubcategoryId | null>;
  accountId: FormControl<ExpenseAccountId | null>;
  amount: FormControl<number | null>;
  currency: FormControl<Currency>;
  recurring: FormControl<boolean>;
  metadata: FormArray<FormGroup<MetadataEntryModel>>;
}
