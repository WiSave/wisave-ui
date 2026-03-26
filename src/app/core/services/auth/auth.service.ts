import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, type Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { getApiBaseUrl } from '@core/config/runtime-config';
import { type IAuthResponse, type ILoginRequest, type IRegisterRequest, type IUser } from '@core/types/auth.types';

export type AuthBootstrapResult =
  | { kind: 'authenticated'; user: IUser }
  | { kind: 'unauthenticated' }
  | { kind: 'unavailable'; status: number };

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #router = inject(Router);
  readonly #apiUrl = `${getApiBaseUrl()}/auth`;
  #antiforgeryReady$: Observable<void> | null = null;

  readonly #user = signal<IUser | null>(null);
  readonly #initialized = signal(false);

  readonly isAuthenticated = computed(() => !!this.#user());
  readonly isInitialized = computed(() => this.#initialized());
  readonly user = computed(() => this.#user());

  ensureAntiforgeryReady(forceRefresh = false): Observable<void> {
    if (forceRefresh || !this.#antiforgeryReady$) {
      this.#antiforgeryReady$ = this.#fetchAntiforgeryToken().pipe(
        tap({
          error: () => {
            this.#antiforgeryReady$ = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.#antiforgeryReady$;
  }

  bootstrapAntiforgery(): Observable<void> {
    return this.ensureAntiforgeryReady();
  }

  initialize(): Observable<AuthBootstrapResult> {
    return this.#http.get<IUser>(`${this.#apiUrl}/me`).pipe(
      map((user) => ({ kind: 'authenticated', user }) as const),
      tap(({ user }) => {
        this.#user.set(user);
        this.#initialized.set(true);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.#user.set(null);
          this.#initialized.set(true);
          return of({ kind: 'unauthenticated' } as const);
        }

        this.#initialized.set(false);
        return of({ kind: 'unavailable', status: err.status } as const);
      }),
    );
  }

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    return this.#withAntiforgery(this.#http.post<IAuthResponse>(`${this.#apiUrl}/login`, credentials)).pipe(
      tap((res) => {
        this.#user.set(res.user);
        this.#initialized.set(true);
      }),
    );
  }

  register(data: IRegisterRequest): Observable<IAuthResponse> {
    return this.#withAntiforgery(this.#http.post<IAuthResponse>(`${this.#apiUrl}/register`, data)).pipe(
      tap((res) => {
        this.#user.set(res.user);
        this.#initialized.set(true);
      }),
    );
  }

  logout(): void {
    this.#logoutRequest().subscribe({
      next: () => {
        this.#user.set(null);
        void this.#router.navigate(['/auth/login']);
      },
      error: () => {
        this.#user.set(null);
        this.#initialized.set(false);
        this.#antiforgeryReady$ = null;
        void this.#router.navigate(['/auth/login']);
      },
    });
  }

  #fetchAntiforgeryToken(): Observable<void> {
    return this.#http
      .get(`${this.#apiUrl}/antiforgery-token`, {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(map(() => void 0));
  }

  #logoutRequest(): Observable<void> {
    return this.#withAntiforgery(this.#http.post<void>(`${this.#apiUrl}/logout`, {})).pipe(
      tap(() => {
        this.#user.set(null);
        this.#initialized.set(true);
        this.#antiforgeryReady$ = null;
      }),
      switchMap(() => this.ensureAntiforgeryReady(true)),
    );
  }

  #withAntiforgery<T>(request: Observable<T>): Observable<T> {
    return this.ensureAntiforgeryReady().pipe(
      switchMap(() => request),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400) {
          this.#antiforgeryReady$ = null;
        }

        return throwError(() => err);
      }),
    );
  }
}
