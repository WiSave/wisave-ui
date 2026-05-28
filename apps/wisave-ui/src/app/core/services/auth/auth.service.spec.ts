import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authInterceptor } from '@core/interceptors/auth.interceptor';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateSpy = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigate: navigateSpy,
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for antiforgery bootstrap before login', () => {
    service.login({ email: 'user@example.com', password: 'Password123!' }).subscribe();

    const xsrfRequest = httpMock.expectOne('/api/auth/antiforgery-token');
    httpMock.expectNone('/api/auth/login');

    xsrfRequest.flush('');
    const loginRequest = httpMock.expectOne('/api/auth/login');
    loginRequest.flush({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'user@example.com',
        permissions: ['expenses:read'],
      },
    });
  });

  it('classifies 500 from /me as unavailable instead of logged out', () => {
    let result: unknown;

    service.initialize().subscribe((value) => {
      result = value;
    });

    const request = httpMock.expectOne('/api/auth/me');
    request.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(result).toEqual({ kind: 'unavailable', status: 500 });
    expect(service.isInitialized()).toBe(false);
  });

  it('refreshes antiforgery after logout completes', () => {
    service.logout();

    const xsrfRequest = httpMock.expectOne('/api/auth/antiforgery-token');
    xsrfRequest.flush('');

    const logoutRequest = httpMock.expectOne('/api/auth/logout');
    logoutRequest.flush({});

    const refreshedXsrfRequest = httpMock.expectOne('/api/auth/antiforgery-token');
    refreshedXsrfRequest.flush('');
  });

  it('waits for antiforgery bootstrap before changing password', () => {
    service.changePassword({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' }).subscribe();

    const xsrfRequest = httpMock.expectOne('/api/auth/antiforgery-token');
    httpMock.expectNone('/api/auth/change-password');

    xsrfRequest.flush('');
    const changePasswordRequest = httpMock.expectOne('/api/auth/change-password');
    expect(changePasswordRequest.request.method).toBe('POST');
    expect(changePasswordRequest.request.body).toEqual({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword123!',
    });
    changePasswordRequest.flush({});
  });
});
