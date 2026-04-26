import { Component, computed, input, output, signal } from '@angular/core';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { type ISettingsRole, type ISettingsRoleViewModel, type PermissionDomain } from '@features/settings/types/settings-admin.types';

@Component({
  selector: 'app-role-permissions-panel',
  imports: [Button, InputText],
  template: `
    <section class="border-secondary-200 dark:border-dark-divider rounded-lg border bg-secondary-50/60 dark:bg-dark-primary-900/40">
      <div class="border-secondary-200 dark:border-dark-divider flex flex-col gap-3 border-b p-4">
        <div>
          <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Roles</h3>
          <p class="text-secondary-500 dark:text-dark-secondary-300 mt-1 text-sm">Assigned permissions grouped by role.</p>
        </div>

        <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative w-full lg:max-w-64">
            <i class="pi pi-search text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs"></i>
            <input
              class="border-secondary-200 text-secondary-900 placeholder:text-secondary-400 dark:border-dark-divider dark:bg-dark-primary-850 dark:text-dark-secondary-50 h-9 w-full rounded-md border bg-white pl-8 pr-3 text-sm outline-none transition focus:border-secondary-500"
              type="search"
              placeholder="Filter roles"
              [value]="query()"
              (input)="query.set($any($event.target).value)" />
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              class="h-9 w-full sm:w-56"
              pInputText
              type="text"
              placeholder="New custom role"
              [value]="newRoleName()"
              (input)="newRoleName.set($any($event.target).value)" />
            <p-button
              label="Create"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              [disabled]="!newRoleName().trim() || isCreatingRole()"
              [loading]="isCreatingRole()"
              (onClick)="onCreateRole()" />
          </div>
        </div>
      </div>

      <div class="divide-secondary-200 dark:divide-dark-divider divide-y">
        @for (role of filteredRoles(); track role.id) {
          <article class="bg-white/50 p-4 dark:bg-dark-primary-850/30">
            <button
              class="flex w-full items-center justify-between gap-3 text-left"
              type="button"
              [attr.aria-expanded]="isExpanded(role.id)"
              (click)="toggleRole(role.id)">
              <span class="min-w-0">
                <span class="text-secondary-950 dark:text-dark-secondary-50 block truncate text-sm font-semibold">
                  {{ role.displayName }}
                </span>
                <span class="text-secondary-500 dark:text-dark-secondary-300 mt-0.5 block truncate text-xs">
                  {{ role.name }} / {{ role.normalizedName }}
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-3">
                <span class="bg-secondary-100 text-secondary-700 dark:bg-dark-primary-800 dark:text-dark-secondary-100 rounded-full px-2.5 py-1 text-xs font-semibold">
                  {{ role.permissions.length }} {{ role.permissions.length === 1 ? 'permission' : 'permissions' }}
                </span>
                <i class="pi text-secondary-500 text-xs" [class.pi-chevron-down]="!isExpanded(role.id)" [class.pi-chevron-up]="isExpanded(role.id)"></i>
              </span>
            </button>

            @if (isExpanded(role.id)) {
              <div class="mt-4">
                <h3 class="text-secondary-500 dark:text-dark-secondary-400 text-[10px] font-semibold uppercase tracking-[0.18em]">
                  Assigned permissions
                </h3>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  @for (permission of availablePermissions(); track permission) {
                    <label class="text-secondary-700 dark:text-dark-secondary-100 flex items-center gap-2 text-xs font-semibold">
                      <input
                        class="accent-secondary-700 h-4 w-4"
                        type="checkbox"
                        [checked]="hasPermission(role, permission)"
                        [disabled]="savingRoleId() === role.id"
                        (change)="onPermissionToggle(role, permission, $any($event.target).checked)" />
                      <span class="rounded-full px-2.5 py-1" [class]="permissionClass(permission)">
                        {{ permission }}
                      </span>
                    </label>
                  } @empty {
                    <span class="text-secondary-500 dark:text-dark-secondary-300 text-sm">No permissions available.</span>
                  }
                </div>

                @if (unsavedChangeCount(role) > 0) {
                  <div class="border-secondary-200 dark:border-dark-divider mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span class="text-secondary-600 dark:text-dark-secondary-300 text-xs font-semibold">
                      {{ unsavedChangeCount(role) }} {{ unsavedChangeCount(role) === 1 ? 'change' : 'changes' }} pending
                    </span>
                    <div class="flex gap-2">
                      <p-button
                        label="Cancel"
                        size="small"
                        severity="secondary"
                        [text]="true"
                        [disabled]="savingRoleId() === role.id"
                        (onClick)="discardPermissionDraft(role)" />
                      <p-button
                        label="Save changes"
                        icon="pi pi-save"
                        size="small"
                        severity="secondary"
                        [loading]="savingRoleId() === role.id"
                        (onClick)="savePermissionDraft(role)" />
                    </div>
                  </div>
                }
              </div>
            }
          </article>
        } @empty {
          <div class="text-secondary-500 dark:text-dark-secondary-300 p-6 text-center text-sm">No roles match the current filter.</div>
        }
      </div>
    </section>
  `,
})
export class RolePermissionsPanelComponent {
  readonly roles = input.required<ISettingsRole[]>();
  readonly availablePermissions = input.required<string[]>();
  readonly savingRoleId = input<string | null>(null);
  readonly isCreatingRole = input(false);
  readonly permissionsChanged = output<{ role: ISettingsRole; permissions: string[] }>();
  readonly roleCreated = output<string>();
  readonly query = signal('');
  readonly newRoleName = signal('');
  readonly permissionDrafts = signal<Record<string, string[]>>({});
  readonly expandedRoleIds = signal<ReadonlySet<string>>(new Set());

  readonly roleViewModels = computed<ISettingsRoleViewModel[]>(() =>
    this.roles().map((role) => ({
      ...role,
      displayName: this.#toRoleDisplayName(role.name),
    })),
  );

  readonly filteredRoles = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) return this.roleViewModels();

    return this.roleViewModels().filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.displayName.toLowerCase().includes(query) ||
        role.permissions.some((permission) => permission.toLowerCase().includes(query)),
    );
  });

  isExpanded(roleId: string): boolean {
    return this.expandedRoleIds().has(roleId);
  }

  toggleRole(roleId: string): void {
    const next = new Set(this.expandedRoleIds());
    if (next.has(roleId)) {
      next.delete(roleId);
    } else {
      next.add(roleId);
    }
    this.expandedRoleIds.set(next);
  }

  hasPermission(role: ISettingsRole, permission: string): boolean {
    return this.permissionValues(role).some((item) => item.toLowerCase() === permission.toLowerCase());
  }

  onPermissionToggle(role: ISettingsRole, permission: string, checked: boolean): void {
    const permissions = new Set(this.permissionValues(role));
    if (checked) {
      permissions.add(permission);
    } else {
      permissions.delete(permission);
    }
    this.permissionDrafts.update((drafts) => ({ ...drafts, [role.id]: [...permissions].sort() }));
  }

  permissionValues(role: ISettingsRole): string[] {
    return this.permissionDrafts()[role.id] ?? role.permissions;
  }

  unsavedChangeCount(role: ISettingsRole): number {
    const draft = this.permissionDrafts()[role.id];
    if (!draft) return 0;

    const existing = new Set(role.permissions.map((permission) => permission.toLowerCase()));
    const next = new Set(draft.map((permission) => permission.toLowerCase()));
    return [...existing].filter((permission) => !next.has(permission)).length + [...next].filter((permission) => !existing.has(permission)).length;
  }

  discardPermissionDraft(role: ISettingsRole): void {
    const { [role.id]: _discarded, ...rest } = this.permissionDrafts();
    this.permissionDrafts.set(rest);
  }

  savePermissionDraft(role: ISettingsRole): void {
    this.permissionsChanged.emit({ role, permissions: this.permissionValues(role) });
  }

  onCreateRole(): void {
    const roleName = this.newRoleName().trim();
    if (!roleName) return;
    this.roleCreated.emit(roleName);
    this.newRoleName.set('');
  }

  permissionClass(permission: string): string {
    const domain = this.#permissionDomain(permission);

    if (domain === 'expenses') return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200';
    if (domain === 'incomes') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    if (domain === 'stocks') return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
    return 'bg-secondary-100 text-secondary-700 dark:bg-dark-primary-800 dark:text-dark-secondary-100';
  }

  #permissionDomain(permission: string): PermissionDomain {
    if (permission.startsWith('expenses:')) return 'expenses';
    if (permission.startsWith('incomes:')) return 'incomes';
    if (permission.startsWith('stocks:')) return 'stocks';
    return 'other';
  }

  #toRoleDisplayName(roleName: string): string {
    if (roleName === 'plan:free') return 'Free plan';
    if (roleName === 'plan:standard') return 'Standard plan';
    if (roleName === 'plan:premium') return 'Premium plan';
    if (roleName === 'superadmin') return 'Super admin';
    if (roleName === 'admin') return 'Admin';
    return roleName;
  }
}
