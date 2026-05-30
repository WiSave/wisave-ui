import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { ExpenseAccountId, IExpenseAccount, IExpenseAccountWritePayload, IStoreError } from '@wisave/shared/model';

export const accountsPageEvents = eventGroup({
  source: 'Accounts Page',
  events: {
    opened: type<void>(),
    add: type<{ account: IExpenseAccountWritePayload }>(),
    update: type<{ id: ExpenseAccountId; changes: IExpenseAccountWritePayload }>(),
    remove: type<{ id: ExpenseAccountId }>(),
    selectAccount: type<{ id: ExpenseAccountId }>(),
  },
});

export const accountsApiEvents = eventGroup({
  source: 'Accounts API',
  events: {
    loadedSuccess: type<{ accounts: IExpenseAccount[] }>(),
    loadedFailure: type<{ error: IStoreError }>(),
    addAccepted: type<void>(),
    addedFailure: type<{ error: IStoreError }>(),
    updateAccepted: type<void>(),
    selectedAccountLoaded: type<{ account: IExpenseAccount }>(),
    updatedFailure: type<{ error: IStoreError }>(),
    removeAccepted: type<void>(),
    removedFailure: type<{ error: IStoreError }>(),
  },
});

export const accountsSignalREvents = eventGroup({
  source: 'Accounts SignalR',
  events: {
    accountUpsertedSignalR: type<{ account: IExpenseAccount }>(),
    accountRemovedSignalR: type<{ id: ExpenseAccountId }>(),
  },
});
