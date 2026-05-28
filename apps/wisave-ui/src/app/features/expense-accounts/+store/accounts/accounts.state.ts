import type { IStoreError } from '@wisave/shared/model';
import type { IExpenseAccount } from '@wisave/shared/model';

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
