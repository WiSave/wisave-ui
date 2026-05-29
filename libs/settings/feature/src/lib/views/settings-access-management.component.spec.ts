import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionService } from '@wisave/platform/auth';
import { SettingsAdminApiService } from '@wisave/settings/data-access';

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

  it('keeps the access cards in a fixed-height workspace', async () => {
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

    const workspace = fixture.nativeElement.querySelector('[data-testid="access-management-workspace"]') as HTMLElement;
    const rolesCard = fixture.nativeElement.querySelector('[data-testid="access-management-roles-card"]') as HTMLElement;
    const usersCard = fixture.nativeElement.querySelector('[data-testid="access-management-users-card"]') as HTMLElement;

    expect(workspace.className).toContain('flex-1');
    expect(workspace.className).toContain('min-h-0');
    expect(workspace.className).toContain('overflow-hidden');
    expect(rolesCard.className).toContain('basis-0');
    expect(rolesCard.className).toContain('grow-[1.25]');
    expect(rolesCard.className).toContain('overflow-hidden');
    expect(usersCard.className).toContain('basis-0');
    expect(usersCard.className).toContain('grow-[0.75]');
    expect(usersCard.className).toContain('overflow-hidden');
  });
});
