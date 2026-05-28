import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject, take, toArray } from 'rxjs';

import { PortalSignalRService } from './portal-signalr.service';
import type { ISignalREnvelope } from './signalr-envelope.types';

import { ExpensesSignalRService } from './expenses-signalr.service';
import { ExpensesEventType } from './expenses-signalr.types';

describe('ExpensesSignalRService', () => {
  let messages$: Subject<ISignalREnvelope>;

  beforeEach(() => {
    messages$ = new Subject<ISignalREnvelope>();
    TestBed.configureTestingModule({
      providers: [
        ExpensesSignalRService,
        { provide: PortalSignalRService, useValue: { messages$: messages$.asObservable() } },
      ],
    });
  });

  it('routes expenses-domain envelopes to the per-type stream', async () => {
    const svc = TestBed.inject(ExpensesSignalRService);
    const first = firstValueFrom(svc.expenseRecorded$);
    messages$.next({ eventId: 'a', domain: 'other', eventType: ExpensesEventType.ExpenseRecorded, occurredAt: '', entityId: null, payload: {} });
    messages$.next({ eventId: 'b', domain: 'expenses', eventType: ExpensesEventType.ExpenseRecorded, occurredAt: '', entityId: 'e1', payload: {} });
    const env = await first;
    expect(env.eventType).toBe(ExpensesEventType.ExpenseRecorded);
    expect(env.entityId).toBe('e1');
  });

  it('filters out events with a different eventType', async () => {
    const svc = TestBed.inject(ExpensesSignalRService);
    const collected = firstValueFrom(svc.fundingAccountOpened$.pipe(take(1), toArray()));
    messages$.next({ eventId: 'x', domain: 'expenses', eventType: ExpensesEventType.ExpenseRecorded, occurredAt: '', entityId: null, payload: {} });
    messages$.next({ eventId: 'y', domain: 'expenses', eventType: ExpensesEventType.FundingAccountOpened, occurredAt: '', entityId: 'a1', payload: {} });
    const arr = await collected;
    expect(arr.length).toBe(1);
    expect(arr[0].entityId).toBe('a1');
  });
});
