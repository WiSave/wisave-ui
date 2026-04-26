import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RolePermissionsPanelComponent } from './role-permissions-panel.component';

describe('RolePermissionsPanelComponent', () => {
  let componentRef: ComponentRef<RolePermissionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePermissionsPanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(RolePermissionsPanelComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('availablePermissions', ['expenses:read', 'incomes:write', 'stocks:read']);
    componentRef.setInput('roles', [
      {
        id: 'role-plan-premium',
        name: 'plan:premium',
        normalizedName: 'PLAN:PREMIUM',
        permissions: ['expenses:read', 'incomes:write'],
      },
    ]);
    fixture.detectChanges();
  });

  it('uses product role names', () => {
    expect(componentRef.instance.roleViewModels()[0].displayName).toBe('Premium plan');
  });

  it('filters roles by assigned permission', () => {
    componentRef.instance.query.set('incomes');

    expect(componentRef.instance.filteredRoles()).toHaveLength(1);
  });

  it('tracks draft permission changes before save', () => {
    componentRef.instance.onPermissionToggle(componentRef.instance.roles()[0], 'stocks:read', true);

    expect(componentRef.instance.unsavedChangeCount(componentRef.instance.roles()[0])).toBe(1);
    expect(componentRef.instance.hasPermission(componentRef.instance.roles()[0], 'stocks:read')).toBe(true);
  });

  it('emits updated permissions when a draft is saved', () => {
    const emitted = vi.fn();
    componentRef.instance.permissionsChanged.subscribe(emitted);

    componentRef.instance.onPermissionToggle(componentRef.instance.roles()[0], 'stocks:read', true);
    componentRef.instance.savePermissionDraft(componentRef.instance.roles()[0]);

    expect(emitted).toHaveBeenCalledWith({
      role: componentRef.instance.roles()[0],
      permissions: ['expenses:read', 'incomes:write', 'stocks:read'],
    });
  });

  it('emits new role names', () => {
    const emitted = vi.fn();
    componentRef.instance.roleCreated.subscribe(emitted);

    componentRef.instance.newRoleName.set('auditor');
    componentRef.instance.onCreateRole();

    expect(emitted).toHaveBeenCalledWith('auditor');
    expect(componentRef.instance.newRoleName()).toBe('');
  });
});
