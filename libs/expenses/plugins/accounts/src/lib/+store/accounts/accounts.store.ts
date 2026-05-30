import { withDevtools, withGlitchTracking, withTrackedReducer } from '@angular-architects/ngrx-toolkit';
import { signalStore, withState } from '@ngrx/signals';
import { removeEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { on } from '@ngrx/signals/events';
import type { IExpenseAccount } from '@wisave/shared/model';

import type { AccountsCommandStatus } from '../../types/accounts-state.types';
import { withAccountsEventHandlers } from './accounts.event-handlers';
import { accountsApiEvents, accountsPageEvents, accountsSignalREvents } from './accounts.events';
import { withAccountsSignalR } from './accounts.signalr.event-handlers';
import { initialState } from './accounts.state';

export const ExpenseAccountsStore = signalStore(
  { providedIn: 'root' },
  withDevtools('ExpenseAccounts', withGlitchTracking()),
  withState(initialState),
  withEntities<IExpenseAccount>(),
  withTrackedReducer(
    on(accountsPageEvents.opened, () => ({ isLoading: true, hasLoaded: false, error: null, commandStatus: 'idle' as AccountsCommandStatus })),
    on(accountsPageEvents.add, () => ({ isLoading: true, error: null, commandStatus: 'submitting' as AccountsCommandStatus })),
    on(accountsPageEvents.update, () => ({ isLoading: true, error: null, commandStatus: 'submitting' as AccountsCommandStatus })),
    on(accountsPageEvents.remove, () => ({ isLoading: true, error: null, commandStatus: 'submitting' as AccountsCommandStatus })),
    on(accountsPageEvents.selectAccount, () => ({ isLoading: true, selectedAccount: null, error: null, commandStatus: 'idle' as AccountsCommandStatus })),
    on(accountsApiEvents.loadedSuccess, ({ payload }) => [
      setAllEntities<IExpenseAccount>(payload.accounts),
      () => ({ isLoading: false, hasLoaded: true, error: null, commandStatus: 'idle' as AccountsCommandStatus }),
    ]),
    on(accountsApiEvents.loadedFailure, ({ payload }) => ({ isLoading: false, hasLoaded: true, error: payload.error, commandStatus: 'idle' as AccountsCommandStatus })),
    on(accountsApiEvents.addAccepted, () => ({ isLoading: false, error: null, commandStatus: 'accepted' as AccountsCommandStatus })),
    on(accountsApiEvents.addedFailure, ({ payload }) => ({ isLoading: false, error: payload.error, commandStatus: 'failed' as AccountsCommandStatus })),
    on(accountsApiEvents.updateAccepted, () => ({ isLoading: false, error: null, commandStatus: 'accepted' as AccountsCommandStatus })),
    on(accountsApiEvents.updatedFailure, ({ payload }) => ({ isLoading: false, error: payload.error, commandStatus: 'failed' as AccountsCommandStatus })),
    on(accountsApiEvents.removeAccepted, () => ({ isLoading: false, error: null, commandStatus: 'accepted' as AccountsCommandStatus })),
    on(accountsApiEvents.removedFailure, ({ payload }) => ({ isLoading: false, error: payload.error, commandStatus: 'failed' as AccountsCommandStatus })),
    on(accountsApiEvents.selectedAccountLoaded, ({ payload }) => [
      setEntity<IExpenseAccount>(payload.account),
      () => ({ isLoading: false, error: null, selectedAccount: payload.account, commandStatus: 'idle' as AccountsCommandStatus }),
    ]),
    on(accountsSignalREvents.accountUpsertedSignalR, ({ payload }, state) => [
      setEntity<IExpenseAccount>(payload.account),
      () => ({
        selectedAccount: state.selectedAccount?.id === payload.account.id ? payload.account : state.selectedAccount,
      }),
    ]),
    on(accountsSignalREvents.accountRemovedSignalR, ({ payload }, state) => [
      removeEntity(payload.id),
      () => ({
        selectedAccount: state.selectedAccount?.id === payload.id ? null : state.selectedAccount,
      }),
    ]),
  ),
  withAccountsEventHandlers(),
  withAccountsSignalR(),
);
