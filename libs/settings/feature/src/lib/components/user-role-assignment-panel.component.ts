import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { Select } from 'primeng/select';

import { type ISettingsPageSizeOption, type ISettingsRole, type ISettingsUser } from '@wisave/settings/data-access';

@Component({
  selector: 'app-user-role-assignment-panel',
  imports: [FormsModule, Button, Select],
  template: `
    <section
      class="border-secondary-200 dark:border-dark-divider bg-secondary-50/60 dark:bg-dark-primary-900/40 flex h-full min-h-0 flex-col overflow-hidden rounded-lg border"
      data-testid="user-role-assignment-panel">
      <div class="border-secondary-200 dark:border-dark-divider flex shrink-0 flex-col gap-3 border-b p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Users</h3>
            <p class="text-secondary-500 dark:text-dark-secondary-300 mt-1 text-sm">Filter users and change role membership.</p>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative w-full sm:w-72">
              <i class="pi pi-search text-secondary-400 absolute top-1/2 left-3 -translate-y-1/2 text-xs"></i>
              <input
                [value]="query()"
                (input)="onQueryChange($any($event.target).value)"
                class="border-secondary-200 text-secondary-900 placeholder:text-secondary-400 dark:border-dark-divider dark:bg-dark-primary-850 dark:text-dark-secondary-50 focus:border-secondary-500 h-9 w-full rounded-md border bg-white pr-3 pl-8 text-sm transition outline-none"
                type="search"
                placeholder="Search users" />
            </div>

            <p-select [options]="pageSizeOptions" [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)" styleClass="w-full sm:w-40" optionLabel="label" optionValue="value" size="small" />
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]" data-testid="user-role-assignment-scroll">
        <table class="min-w-full table-fixed text-left text-sm">
          <thead class="bg-secondary-50 dark:bg-dark-primary-900/70 text-secondary-500 dark:text-dark-secondary-300 sticky top-0 z-10">
            <tr>
              <th class="w-[34%] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">User</th>
              <th class="w-[42%] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Roles</th>
              <th class="w-[24%] px-4 py-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Permissions</th>
            </tr>
          </thead>
          <tbody class="divide-secondary-200 dark:divide-dark-divider divide-y">
            @for (user of pagedUsers(); track user.id) {
              <tr class="align-top">
                <td class="px-4 py-4">
                  <div class="min-w-0">
                    <div class="text-secondary-950 dark:text-dark-secondary-50 truncate font-semibold">{{ user.name }}</div>
                    <div class="text-secondary-500 dark:text-dark-secondary-300 mt-1 truncate text-xs">{{ user.email }}</div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="grid gap-2 sm:grid-cols-2">
                    @for (role of roles(); track role.id) {
                      <label class="text-secondary-700 dark:text-dark-secondary-100 flex items-center gap-2 text-xs font-semibold">
                        <input
                          [name]="'user-role-' + user.id"
                          [checked]="hasRole(user, role.id)"
                          [disabled]="isRoleCheckboxDisabled(user, role)"
                          (change)="onRoleSelected(user, role.id)"
                          class="accent-secondary-700 h-4 w-4"
                          type="radio" />
                        <span class="truncate">{{ roleLabel(role.name) }}</span>
                      </label>
                    }
                  </div>
                  @if (unsavedChangeCount(user) > 0) {
                    <div class="border-secondary-200 dark:border-dark-divider mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span class="text-secondary-600 dark:text-dark-secondary-300 text-xs font-semibold">
                        {{ unsavedChangeCount(user) }} {{ unsavedChangeCount(user) === 1 ? 'change' : 'changes' }} pending
                      </span>
                      <div class="flex gap-2">
                        <p-button [text]="true" [disabled]="savingUserId() === user.id" (onClick)="discardRoleDraft(user)" label="Cancel" size="small" severity="secondary" />
                        <p-button [loading]="savingUserId() === user.id" (onClick)="saveRoleDraft(user)" label="Save changes" icon="pi pi-save" size="small" severity="secondary" />
                      </div>
                    </div>
                  }
                </td>
                <td class="px-4 py-4">
                  <span class="bg-secondary-100 text-secondary-700 dark:bg-dark-primary-800 dark:text-dark-secondary-100 rounded-full px-2.5 py-1 text-xs font-semibold">
                    {{ user.permissions.length }} permissions
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td class="text-secondary-500 dark:text-dark-secondary-300 px-4 py-8 text-center" colspan="3">No users match the current filters.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <footer class="border-secondary-200 dark:border-dark-divider flex shrink-0 items-center justify-between border-t px-4 py-3">
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-xs">Showing {{ firstVisibleIndex() }}-{{ lastVisibleIndex() }} of {{ filteredUsers().length }}</p>
        <div class="flex items-center gap-2">
          <button
            [disabled]="page() === 1"
            (click)="page.set(page() - 1)"
            class="border-secondary-200 text-secondary-700 dark:border-dark-divider dark:text-dark-secondary-100 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            type="button">
            Previous
          </button>
          <span class="text-secondary-500 dark:text-dark-secondary-300 text-xs">Page {{ page() }} of {{ totalPages() }}</span>
          <button
            [disabled]="page() === totalPages()"
            (click)="page.set(page() + 1)"
            class="border-secondary-200 text-secondary-700 dark:border-dark-divider dark:text-dark-secondary-100 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            type="button">
            Next
          </button>
        </div>
      </footer>
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
      min-width: 0;
    }
  `,
})
export class UserRoleAssignmentPanelComponent {
  readonly roles = input.required<ISettingsRole[]>();
  readonly users = input.required<ISettingsUser[]>();
  readonly canManagePrivilegedRoles = input(false);
  readonly savingUserId = input<string | null>(null);
  readonly rolesChanged = output<{ user: ISettingsUser; roleIds: string[] }>();

  readonly query = signal('');
  readonly roleDrafts = signal<Record<string, string[]>>({});
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions: ISettingsPageSizeOption[] = [
    { label: '10 / page', value: 10 },
    { label: '25 / page', value: 25 },
    { label: '50 / page', value: 50 },
  ];

  readonly filteredUsers = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) return this.users();

    return this.users().filter(
      (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.roles.some((roleId) => this.#roleLabelById(roleId).toLowerCase().includes(query)),
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize())));
  readonly pagedUsers = computed(() => {
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });
  readonly firstVisibleIndex = computed(() => {
    if (this.filteredUsers().length === 0) return 0;
    return (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize() + 1;
  });
  readonly lastVisibleIndex = computed(() => Math.min(this.filteredUsers().length, this.firstVisibleIndex() + this.pagedUsers().length - 1));

  onQueryChange(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
  }

  hasRole(user: ISettingsUser, roleId: string): boolean {
    return this.roleValues(user).includes(roleId);
  }

  onRoleSelected(user: ISettingsUser, roleId: string): void {
    if (!user.canEditRoles) return;

    const role = this.roles().find((item) => item.id === roleId);
    if (!role || (!this.canManagePrivilegedRoles() && this.#isPrivilegedRole(role.name))) return;

    this.roleDrafts.update((drafts) => ({ ...drafts, [user.id]: [roleId] }));
  }

  roleValues(user: ISettingsUser): string[] {
    return this.roleDrafts()[user.id] ?? user.roles;
  }

  unsavedChangeCount(user: ISettingsUser): number {
    const draft = this.roleDrafts()[user.id];
    if (!draft) return 0;

    const existing = new Set(user.roles);
    const next = new Set(draft);
    return [...existing].filter((roleId) => !next.has(roleId)).length + [...next].filter((roleId) => !existing.has(roleId)).length;
  }

  discardRoleDraft(user: ISettingsUser): void {
    const { [user.id]: _discarded, ...rest } = this.roleDrafts();
    this.roleDrafts.set(rest);
  }

  saveRoleDraft(user: ISettingsUser): void {
    this.rolesChanged.emit({ user, roleIds: this.roleValues(user) });
  }

  isRoleCheckboxDisabled(user: ISettingsUser, role: ISettingsRole): boolean {
    return this.savingUserId() === user.id || !user.canEditRoles || (!this.canManagePrivilegedRoles() && this.#isPrivilegedRole(role.name));
  }

  roleLabel(roleName: string): string {
    if (roleName === 'plan:free') return 'Free plan';
    if (roleName === 'plan:standard') return 'Standard plan';
    if (roleName === 'plan:premium') return 'Premium plan';
    if (roleName === 'superadmin') return 'Super admin';
    if (roleName === 'admin') return 'Admin';
    return roleName;
  }

  #isPrivilegedRole(roleName: string): boolean {
    return roleName === 'admin' || roleName === 'superadmin';
  }

  #roleLabelById(roleId: string): string {
    return this.roleLabel(this.roles().find((role) => role.id === roleId)?.name ?? roleId);
  }
}
