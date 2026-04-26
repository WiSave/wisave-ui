import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SettingsAdminApiService } from './settings-admin-api.service';

describe('SettingsAdminApiService', () => {
  let service: SettingsAdminApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsAdminApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SettingsAdminApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads access management data', () => {
    service.getAccessManagement().subscribe((response) => {
      expect(response.roles).toHaveLength(1);
      expect(response.users).toHaveLength(1);
    });

    const request = http.expectOne('/api/admin/access-management');
    expect(request.request.method).toBe('GET');
    request.flush({
      canManagePrivilegedRoles: false,
      availablePermissions: ['incomes:read'],
      roles: [{ id: 'role-plan-free', name: 'plan:free', normalizedName: 'PLAN:FREE', permissions: ['incomes:read'] }],
      users: [
        {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          roles: ['role-plan-free'],
          permissions: ['incomes:read'],
          canEditRoles: true,
        },
      ],
    });
  });

  it('updates user roles', () => {
    service.updateUserRoles('user 1', ['role-admin']).subscribe((user) => {
      expect(user.roles).toEqual(['role-admin']);
    });

    const request = http.expectOne('/api/admin/access-management/users/user%201/roles');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ roleIds: ['role-admin'] });
    request.flush({
      id: 'user 1',
      name: 'Admin User',
      email: 'admin@example.com',
      roles: ['role-admin'],
      permissions: ['*'],
      canEditRoles: true,
    });
  });

  it('creates roles', () => {
    service.createRole('auditor').subscribe((role) => {
      expect(role.name).toBe('auditor');
    });

    const request = http.expectOne('/api/admin/access-management/roles');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'auditor', permissions: [] });
    request.flush({
      id: 'role-auditor',
      name: 'auditor',
      normalizedName: 'AUDITOR',
      permissions: [],
    });
  });

  it('updates role permissions', () => {
    service.updateRolePermissions('role plan', ['incomes:read']).subscribe((role) => {
      expect(role.permissions).toEqual(['incomes:read']);
    });

    const request = http.expectOne('/api/admin/access-management/roles/role%20plan/permissions');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ permissions: ['incomes:read'] });
    request.flush({
      id: 'role plan',
      name: 'plan:free',
      normalizedName: 'PLAN:FREE',
      permissions: ['incomes:read'],
    });
  });
});
