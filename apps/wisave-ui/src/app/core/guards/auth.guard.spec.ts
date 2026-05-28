import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type UrlTree } from '@angular/router';
import { firstValueFrom, of, type Observable } from 'rxjs';

import { AuthService } from '@core/services/auth/auth.service';

import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  let router: Router;
  let authServiceMock: {
    isInitialized: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      isInitialized: vi.fn(),
      isAuthenticated: vi.fn(),
      initialize: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('redirects unauthenticated users to login with returnUrl', async () => {
    authServiceMock.isInitialized.mockReturnValue(false);
    authServiceMock.initialize.mockReturnValue(of({ kind: 'unauthenticated' }));

    const result = await TestBed.runInInjectionContext(async () =>
      firstValueFrom(authGuard({} as never, { url: '/expenses/budgets' } as never) as Observable<UrlTree>),
    );

    expect(router.serializeUrl(result)).toBe('/auth/login?returnUrl=%2Fexpenses%2Fbudgets');
  });

  it('redirects guest-guard bootstrap failures to the unguarded session-unavailable route', async () => {
    authServiceMock.isInitialized.mockReturnValue(false);
    authServiceMock.initialize.mockReturnValue(of({ kind: 'unavailable', status: 500 }));

    const result = await TestBed.runInInjectionContext(async () =>
      firstValueFrom(guestGuard({} as never, { url: '/auth/login' } as never) as Observable<UrlTree>),
    );

    expect(router.serializeUrl(result)).toBe('/session-unavailable?returnUrl=%2Fauth%2Flogin');
  });
});
