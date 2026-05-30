import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, merge, pairwise } from 'rxjs';

import { signalStoreFeature, withProps } from '@ngrx/signals';
import { withEventHandlers } from '@ngrx/signals/events';
import { ExpensesSignalRService, PortalSignalRService } from '@wisave/platform/signalr';

import { budgetPageEvents } from './budget.events';

export function withBudgetSignalR() {
  return signalStoreFeature(
    withProps(() => ({
      _realtime: inject(ExpensesSignalRService),
      _portal: inject(PortalSignalRService),
    })),
    withEventHandlers((store) => ({
      // Any budget-domain SignalR event triggers a re-dispatch of the page `opened`
      // event, which reloads the budget for the currently selected month. Cheap and
      // simple — a cross-month event still refreshes the current view harmlessly.
      refreshOnBudgetEvent$: merge(
        store._realtime.budgetCreated$,
        store._realtime.budgetCopiedFromPrevious$,
        store._realtime.overallLimitSet$,
        store._realtime.categoryLimitSet$,
        store._realtime.categoryLimitRemoved$,
      ).pipe(map(() => budgetPageEvents.opened())),
      reconnectCatchUp$: toObservable(store._portal.status).pipe(
        pairwise(),
        filter(([prev, curr]) => (prev === 'reconnecting' || prev === 'disconnected') && curr === 'connected'),
        map(() => budgetPageEvents.opened()),
      ),
    })),
  );
}
