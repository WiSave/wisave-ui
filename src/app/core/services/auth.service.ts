import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, type Observable, of, tap } from 'rxjs';

import { getApiBaseUrl } from '@core/config/runtime-config';
import { type IAuthResponse, type ILoginRequest, type IRegisterRequest, type IUser } from '@core/types/auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #router = inject(Router);
  readonly #apiUrl = `${getApiBaseUrl()}/auth`;

  readonly #user = signal<IUser | null>(null);
  readonly #initialized = signal(false);

  readonly isAuthenticated = computed(() => !!this.#user());
  readonly isInitialized = computed(() => this.#initialized());
  readonly user = computed(() => this.#user());

  initialize(): Observable<IUser | null> {
    return this.#http.get<IUser>(`${this.#apiUrl}/me`).pipe(
      tap((user) => {
        this.#user.set(user);
        this.#initialized.set(true);
      }),
      catchError(() => {
        this.#user.set(null);
        this.#initialized.set(true);
        return of(null);
      }),
    );
  }

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    return this.#http.post<IAuthResponse>(`${this.#apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.#user.set(res.user);
      }),
    );
  }

  register(data: IRegisterRequest): Observable<IAuthResponse> {
    return this.#http.post<IAuthResponse>(`${this.#apiUrl}/register`, data).pipe(
      tap((res) => {
        this.#user.set(res.user);
      }),
    );
  }

  logout(): void {
    this.#http.post(`${this.#apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.#user.set(null);
        void this.#router.navigate(['/auth/login']);
      },
      error: () => {
        this.#user.set(null);
        void this.#router.navigate(['/auth/login']);
      },
    });
  }
}
