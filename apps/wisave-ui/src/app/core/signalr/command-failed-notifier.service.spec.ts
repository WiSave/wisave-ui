import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

import type { ISignalREnvelope } from './signalr-envelope.types';
import { ExpensesSignalRService } from './expenses-signalr.service';
import { CommandFailedNotifierService } from './command-failed-notifier.service';

describe('CommandFailedNotifierService', () => {
  let commandFailed$: Subject<ISignalREnvelope>;
  let messageService: { add: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    commandFailed$ = new Subject<ISignalREnvelope>();
    messageService = { add: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        CommandFailedNotifierService,
        { provide: ExpensesSignalRService, useValue: { commandFailed$: commandFailed$.asObservable() } },
        { provide: MessageService, useValue: messageService },
      ],
    });
  });

  it('shows an error toast when a command.failed envelope arrives', () => {
    TestBed.inject(CommandFailedNotifierService);
    commandFailed$.next({
      eventId: 'e', domain: 'expenses', eventType: 'command.failed',
      occurredAt: '', entityId: null,
      payload: { reason: 'insufficient funds' },
    });
    expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'error',
      detail: 'insufficient funds',
    }));
  });

  it('falls back to a generic detail when reason is missing', () => {
    TestBed.inject(CommandFailedNotifierService);
    commandFailed$.next({
      eventId: 'e', domain: 'expenses', eventType: 'command.failed',
      occurredAt: '', entityId: null,
      payload: {},
    });
    expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'error',
    }));
    const call = messageService.add.mock.calls[0][0] as { detail: string };
    expect(call.detail.length).toBeGreaterThan(0);
  });
});
