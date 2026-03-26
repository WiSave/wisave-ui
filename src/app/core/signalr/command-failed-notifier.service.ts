import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

import { ExpensesSignalRService } from './expenses-signalr.service';

@Injectable({ providedIn: 'root' })
export class CommandFailedNotifierService {
  readonly #realtime = inject(ExpensesSignalRService);
  readonly #messages = inject(MessageService);

  constructor() {
    this.#realtime.commandFailed$.subscribe((env) => {
      const reason = (env.payload as { reason?: string } | null)?.reason;
      this.#messages.add({
        severity: 'error',
        summary: 'Action failed',
        detail: reason ?? "Your last action couldn't be completed.",
        life: 5000,
      });
    });
  }
}
