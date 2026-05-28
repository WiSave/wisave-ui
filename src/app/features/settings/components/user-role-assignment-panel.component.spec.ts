import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UserRoleAssignmentPanelComponent } from './user-role-assignment-panel.component';

describe('UserRoleAssignmentPanelComponent', () => {
  let componentRef: ComponentRef<UserRoleAssignmentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleAssignmentPanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserRoleAssignmentPanelComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('roles', [
      { id: 'role-plan-free', name: 'plan:free', normalizedName: 'PLAN:FREE', permissions: ['incomes:read'] },
      { id: 'role-plan-standard', name: 'plan:standard', normalizedName: 'PLAN:STANDARD', permissions: ['expenses:read'] },
      { id: 'role-admin', name: 'admin', normalizedName: 'ADMIN', permissions: [] },
    ]);
    componentRef.setInput('users', [
      {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['role-plan-free'],
        permissions: ['incomes:read'],
        canEditRoles: true,
      },
    ]);
    fixture.detectChanges();
  });

  it('filters users by role label', () => {
    componentRef.instance.onQueryChange('free');

    expect(componentRef.instance.filteredUsers()).toHaveLength(1);
  });

  it('tracks role changes before save', () => {
    componentRef.setInput('canManagePrivilegedRoles', true);

    componentRef.instance.onRoleSelected(componentRef.instance.users()[0], 'role-admin');

    expect(componentRef.instance.unsavedChangeCount(componentRef.instance.users()[0])).toBe(2);
    expect(componentRef.instance.hasRole(componentRef.instance.users()[0], 'role-admin')).toBe(true);
  });

  it('emits the next role set when a draft is saved', () => {
    const emitted = vi.fn();
    componentRef.setInput('canManagePrivilegedRoles', true);
    componentRef.instance.rolesChanged.subscribe(emitted);

    componentRef.instance.onRoleSelected(componentRef.instance.users()[0], 'role-admin');
    componentRef.instance.saveRoleDraft(componentRef.instance.users()[0]);

    expect(emitted).toHaveBeenCalledWith({
      user: componentRef.instance.users()[0],
      roleIds: ['role-admin'],
    });
  });

  it('keeps only one selected role', () => {
    componentRef.instance.onRoleSelected(componentRef.instance.users()[0], 'role-plan-standard');

    expect(componentRef.instance.roleValues(componentRef.instance.users()[0])).toEqual(['role-plan-standard']);
  });

  it('keeps users inside a scrollable panel body', () => {
    const fixture = TestBed.createComponent(UserRoleAssignmentPanelComponent);
    fixture.componentRef.setInput('roles', [
      { id: 'role-plan-free', name: 'plan:free', normalizedName: 'PLAN:FREE', permissions: ['incomes:read'] },
      { id: 'role-plan-standard', name: 'plan:standard', normalizedName: 'PLAN:STANDARD', permissions: ['expenses:read'] },
    ]);
    fixture.componentRef.setInput('users', [
      {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['role-plan-free'],
        permissions: ['incomes:read'],
        canEditRoles: true,
      },
    ]);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[data-testid="user-role-assignment-panel"]') as HTMLElement;
    const scrollArea = fixture.nativeElement.querySelector('[data-testid="user-role-assignment-scroll"]') as HTMLElement;

    expect(panel.className).toContain('h-full');
    expect(panel.className).toContain('overflow-hidden');
    expect(scrollArea.className).toContain('flex-1');
    expect(scrollArea.className).toContain('overflow-y-auto');
  });
});
