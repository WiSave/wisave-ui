import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AuthService } from '@core/services/auth/auth.service';
import { PortalSignalRService } from './portal-signalr.service';

describe('PortalSignalRService', () => {
  let auth: { isAuthenticated: ReturnType<typeof signal>; isInitialized: ReturnType<typeof signal> };

  beforeEach(() => {
    auth = { isAuthenticated: signal(false), isInitialized: signal(false) };
    TestBed.configureTestingModule({
      providers: [PortalSignalRService, { provide: AuthService, useValue: auth }],
    });
  });

  it('starts in idle status before auth initializes', () => {
    const svc = TestBed.inject(PortalSignalRService);
    expect(svc.status()).toBe('idle');
  });

  it('does not connect while auth is uninitialized', () => {
    const svc = TestBed.inject(PortalSignalRService);
    auth.isAuthenticated.set(true);
    TestBed.tick();
    expect(svc.status()).toBe('idle');
  });
});
