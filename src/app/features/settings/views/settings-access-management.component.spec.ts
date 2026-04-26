import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionService } from '@core/services/auth/permission.service';
import { SettingsAdminApiService } from '@features/settings/services/settings-admin-api.service';

import { SettingsAccessManagementComponent } from './settings-access-management.component';

describe('SettingsAccessManagementComponent', () => {
  it('loads roles and users for access managers', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccessManagementComponent],
      providers: [
        { provide: PermissionService, useValue: { hasPermission: () => true } },
        {
          provide: SettingsAdminApiService,
          useValue: {
            getAccessManagement: () =>
              of({
                canManagePrivilegedRoles: false,
                availablePermissions: ['incomes:read'],
                roles: [
                  {
                    id: 'role-plan-free',
                    name: 'plan:free',
                    normalizedName: 'PLAN:FREE',
                    permissions: ['incomes:read'],
                  },
                ],
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
              }),
            updateUserRoles: () =>
              of({
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                roles: ['role-plan-free'],
                permissions: ['incomes:read'],
                canEditRoles: true,
              }),
            updateRolePermissions: () =>
              of({
                id: 'role-plan-free',
                name: 'plan:free',
                normalizedName: 'PLAN:FREE',
                permissions: ['incomes:read'],
              }),
            createRole: () =>
              of({
                id: 'role-auditor',
                name: 'auditor',
                normalizedName: 'AUDITOR',
                permissions: [],
              }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsAccessManagementComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.roles()).toHaveLength(1);
    expect(fixture.componentInstance.users()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Roles');
    expect(fixture.nativeElement.textContent).toContain('Assign roles');
  });
});
