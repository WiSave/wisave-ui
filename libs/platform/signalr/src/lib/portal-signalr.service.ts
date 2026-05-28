import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { type HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject, type Observable } from 'rxjs';

import { AuthService } from '@wisave/platform/auth';
import { getApiBaseUrl } from '@wisave/platform/config';

import { SIGNALR_HUB_METHOD, type ISignalREnvelope } from './signalr-envelope.types';
import type { TConnectionStatus } from './connection-status.types';

const INITIAL_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PortalSignalRService {
  readonly #auth = inject(AuthService);
  readonly #status = signal<TConnectionStatus>('idle');
  readonly #messages$ = new Subject<ISignalREnvelope>();
  #connection: HubConnection | null = null;
  #retryHandle: ReturnType<typeof setTimeout> | null = null;
  #retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
  #shouldBeConnected = false;

  readonly status = computed(() => this.#status());
  readonly messages$: Observable<ISignalREnvelope> = this.#messages$.asObservable();

  constructor() {
    effect(() => {
      const initialized = this.#auth.isInitialized();
      const authed = this.#auth.isAuthenticated();

      if (initialized && authed) {
        this.#shouldBeConnected = true;
        if (!this.#connection && !this.#retryHandle) void this.#start();
      } else {
        this.#shouldBeConnected = false;
        this.#clearRetry();
        if (this.#connection) void this.#stop();
      }
    });
  }

  async #start(): Promise<void> {
    this.#status.set('connecting');
    const hubUrl = `${getApiBaseUrl().replace(/\/api$/, '')}/hubs/notifications`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => this.#status.set('reconnecting'));
    connection.onreconnected(() => {
      this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
      this.#status.set('connected');
    });
    connection.onclose(() => {
      this.#status.set('disconnected');
      this.#connection = null;
      if (this.#shouldBeConnected) this.#scheduleRetry();
    });

    connection.on(SIGNALR_HUB_METHOD, (env: ISignalREnvelope) => this.#messages$.next(env));

    try {
      await connection.start();
      if (connection.state === HubConnectionState.Connected) {
        this.#connection = connection;
        this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
        this.#status.set('connected');
      } else {
        this.#status.set('disconnected');
        if (this.#shouldBeConnected) this.#scheduleRetry();
      }
    } catch {
      this.#connection = null;
      this.#status.set('disconnected');
      if (this.#shouldBeConnected) this.#scheduleRetry();
    }
  }

  #scheduleRetry(): void {
    if (this.#retryHandle) return;
    const delay = this.#retryDelayMs;
    this.#retryDelayMs = Math.min(this.#retryDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    this.#retryHandle = setTimeout(() => {
      this.#retryHandle = null;
      if (this.#shouldBeConnected && !this.#connection) void this.#start();
    }, delay);
  }

  #clearRetry(): void {
    if (this.#retryHandle) {
      clearTimeout(this.#retryHandle);
      this.#retryHandle = null;
    }
    this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
  }

  async #stop(): Promise<void> {
    const conn = this.#connection;
    this.#connection = null;
    this.#clearRetry();
    if (conn) {
      try { await conn.stop(); } catch { /* ignore */ }
    }
    this.#status.set('idle');
  }
}
