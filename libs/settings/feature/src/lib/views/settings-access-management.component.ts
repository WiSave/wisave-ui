import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { Button } from 'primeng/button';

import { PermissionService } from '@wisave/platform/auth';
import { SettingsAdminApiService, type ISettingsRole, type ISettingsUser } from '@wisave/settings/data-access';

import { RolePermissionsPanelComponent } from '../components/role-permissions-panel.component';
import { UserRoleAssignmentPanelComponent } from '../components/user-role-assignment-panel.component';

@Component({
  selector: 'app-settings-access-management',
  imports: [Button, RolePermissionsPanelComponent, UserRoleAssignmentPanelComponent],
  template: `
    @if (!canManageAccess()) {
      <section class="border-secondary-200 dark:border-dark-divider rounded-lg border p-6 text-center">
        <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-base font-semibold">Access Management</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-300 mt-2 text-sm">You do not have permission to manage access.</p>
      </section>
    } @else {
      <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden" data-testid="access-management-workspace">
        @if (isLoading()) {
          <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
            <i class="pi pi-spinner pi-spin text-lg"></i>
            <span>Loading access management...</span>
          </div>
        } @else if (error()) {
          <div class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center">
            <i class="pi pi-exclamation-triangle text-warning-500 text-2xl"></i>
            <div>
              <h3 class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-semibold">Unable to load access management</h3>
              <p class="text-secondary-500 dark:text-dark-secondary-300 mt-1 text-sm">{{ error() }}</p>
            </div>
            <p-button (onClick)="loadAccessManagement()" label="Retry" icon="pi pi-refresh" size="small" severity="secondary" />
          </div>
        } @else {
          <section
            class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850/80 flex min-h-0 grow-[1.25] basis-0 flex-col overflow-hidden rounded-lg border bg-white/80 p-5"
            data-testid="access-management-roles-card">
            <div class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(220px,22rem)_minmax(0,1fr)] xl:grid-rows-1">
              <div class="flex max-w-md flex-col gap-3">
                <div>
                  <p class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-[0.18em] uppercase">Access Management</p>
                  <h2 class="text-secondary-950 dark:text-dark-secondary-50 mt-2 text-base font-semibold">Roles and permissions</h2>
                  <p class="text-secondary-500 dark:text-dark-secondary-300 mt-2 text-sm leading-6">Review each role and the permissions forwarded to downstream services.</p>
                </div>
                <p-button [loading]="isLoading()" (onClick)="loadAccessManagement()" label="Refresh" icon="pi pi-refresh" size="small" severity="secondary" styleClass="w-fit" />
              </div>

              <app-role-permissions-panel
                [availablePermissions]="availablePermissions()"
                [roles]="roles()"
                [isCreatingRole]="isCreatingRole()"
                [savingRoleId]="savingRoleId()"
                (roleCreated)="onRoleCreated($event)"
                (permissionsChanged)="onRolePermissionsChanged($event.role, $event.permissions)"
                class="min-h-0 min-w-0" />
            </div>
          </section>

          <section
            class="border-secondary-200 dark:border-dark-divider dark:bg-dark-primary-850/80 flex min-h-0 grow-[0.75] basis-0 flex-col overflow-hidden rounded-lg border bg-white/80 p-5"
            data-testid="access-management-users-card">
            <div class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(220px,22rem)_minmax(0,1fr)] xl:grid-rows-1">
              <div class="flex max-w-md flex-col gap-2">
                <p class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold tracking-[0.18em] uppercase">User access</p>
                <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-base font-semibold">Assign roles</h2>
                <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm leading-6">Search users, change plan roles, and manage elevated access based on your role.</p>
              </div>

              <app-user-role-assignment-panel
                [canManagePrivilegedRoles]="canManagePrivilegedRoles()"
                [roles]="roles()"
                [users]="users()"
                [savingUserId]="savingUserId()"
                (rolesChanged)="onRolesChanged($event.user, $event.roleIds)"
                class="min-h-0 min-w-0" />
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
    }
  `,
})
export class SettingsAccessManagementComponent implements OnInit {
  readonly #api = inject(SettingsAdminApiService);
  readonly #permissionService = inject(PermissionService);

  readonly roles = signal<ISettingsRole[]>([]);
  readonly users = signal<ISettingsUser[]>([]);
  readonly availablePermissions = signal<string[]>([]);
  readonly canManagePrivilegedRoles = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isCreatingRole = signal(false);
  readonly savingRoleId = signal<string | null>(null);
  readonly savingUserId = signal<string | null>(null);
  readonly canManageAccess = computed(() => this.#permissionService.hasPermission('*'));

  ngOnInit(): void {
    if (this.canManageAccess()) {
      this.loadAccessManagement();
    }
  }

  loadAccessManagement(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#api
      .getAccessManagement()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.canManagePrivilegedRoles.set(response.canManagePrivilegedRoles);
          this.availablePermissions.set(response.availablePermissions);
          this.roles.set(response.roles);
          this.users.set(response.users);
        },
        error: () => {
          this.error.set('The portal admin API is not available or returned an error.');
        },
      });
  }

  onRolePermissionsChanged(role: ISettingsRole, permissions: string[]): void {
    this.savingRoleId.set(role.id);

    this.#api
      .updateRolePermissions(role.id, permissions)
      .pipe(finalize(() => this.savingRoleId.set(null)))
      .subscribe({
        next: (updatedRole) => {
          this.roles.update((roles) => roles.map((item) => (item.id === updatedRole.id ? updatedRole : item)));
          this.loadAccessManagement();
        },
        error: () => {
          this.error.set(`Unable to update permissions for ${role.name}.`);
        },
      });
  }

  onRoleCreated(roleName: string): void {
    this.isCreatingRole.set(true);

    this.#api
      .createRole(roleName)
      .pipe(finalize(() => this.isCreatingRole.set(false)))
      .subscribe({
        next: (createdRole) => {
          this.roles.update((roles) => [...roles, createdRole].sort((a, b) => a.name.localeCompare(b.name)));
          this.loadAccessManagement();
        },
        error: () => {
          this.error.set(`Unable to create role ${roleName}.`);
        },
      });
  }

  onRolesChanged(user: ISettingsUser, roleIds: string[]): void {
    this.savingUserId.set(user.id);

    this.#api
      .updateUserRoles(user.id, roleIds)
      .pipe(finalize(() => this.savingUserId.set(null)))
      .subscribe({
        next: (updatedUser) => {
          this.users.update((users) => users.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
        },
        error: () => {
          this.error.set(`Unable to update roles for ${user.email}.`);
        },
      });
  }
}
