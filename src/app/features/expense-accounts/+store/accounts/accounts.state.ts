import type { IStoreError } from '@shared/types/error.types';
import type { IExpenseAccount } from '@core/types/expense-account.interface';

import type { AccountsCommandStatus } from '@features/expense-accounts/types/accounts-state.types';

export interface AccountsState {
  isLoading: boolean;
  hasLoaded: boolean;
  commandStatus: AccountsCommandStatus;
  error: IStoreError | null;
  selectedAccount: IExpenseAccount | null;
}

export const initialState: AccountsState = {
  isLoading: false,
  hasLoaded: false,
  commandStatus: 'idle',
  error: null,
  selectedAccount: null,
};
