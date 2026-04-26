# Settings Access Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/settings` area opened from the sidebar cog, with normal user profile settings and a superadmin-only Access Management tab for inspecting roles, permissions, and assigning roles to users.

**Architecture:** Implement settings as its own lazy-loaded feature under `src/app/features/settings`. The shell owns the tabs and route layout; profile and access management are route-level views. Access management uses small presentational components for the Roles/Permissions panel and user-role assignment panel, with a focused API service isolated behind `settings-admin-api.service.ts`.

**Tech Stack:** Angular 21 standalone components, Angular router, signals/computed, PrimeNG `p-button`, `p-select`, `pInputText`, optional `p-checkbox`, Tailwind CSS utility classes, existing `AuthService` and `PermissionService`.

---

## Current Context

- `src/app/layout/sidebar.ts` has an inert cog button. It should route to `/settings`.
- `src/app/features/features.routing.ts` owns authenticated feature routes and should lazy-load the new settings feature.
- `AuthService.user()` currently exposes `id`, `name`, `email`, and `permissions`.
- `PermissionService` treats `*` as wildcard. Use that to gate Access Management until backend exposes explicit roles.
- Backend endpoints for role/user management are not present in this repo. Build the frontend API service around expected portal endpoints, but keep the first UI resilient with loading/error/empty states.
- Preserve existing uncommitted work in the repo. Before editing, inspect `git status --short --untracked-files=all` and do not revert unrelated user changes.

## File Structure

- Modify: `src/app/layout/sidebar.ts`
  - Add `routerLink="/settings"` to the settings cog.
  - Set explicit PrimeNG button `severity="secondary"`.
- Modify: `src/app/features/features.routing.ts`
  - Add a lazy route for `settings`.
- Create: `src/app/features/settings/settings.routes.ts`
  - Routes for shell, profile, and access management.
- Create: `src/app/features/settings/views/settings-shell.component.ts`
  - Tabbed settings shell.
- Create: `src/app/features/settings/views/settings-profile.component.ts`
  - Normal user profile summary.
- Create: `src/app/features/settings/views/settings-access-management.component.ts`
  - Superadmin access management view.
- Create: `src/app/features/settings/components/role-permissions-panel.component.ts`
  - Presentational roles + assigned permissions panel.
- Create: `src/app/features/settings/components/user-role-assignment-panel.component.ts`
  - Presentational users table, filters, pagination, role checkboxes.
- Create: `src/app/features/settings/services/settings-admin-api.service.ts`
  - API calls for roles, users, and role assignment.
- Create: `src/app/features/settings/types/settings-admin.types.ts`
  - Feature-specific contracts.
- Create tests:
  - `src/app/features/settings/views/settings-shell.component.spec.ts`
  - `src/app/features/settings/views/settings-profile.component.spec.ts`
  - `src/app/features/settings/views/settings-access-management.component.spec.ts`
  - `src/app/features/settings/components/role-permissions-panel.component.spec.ts`
  - `src/app/features/settings/components/user-role-assignment-panel.component.spec.ts`
  - `src/app/features/settings/services/settings-admin-api.service.spec.ts`

---

### Task 1: Add Settings Routing and Sidebar Navigation

**Files:**
- Modify: `src/app/layout/sidebar.ts`
- Modify: `src/app/features/features.routing.ts`
- Create: `src/app/features/settings/settings.routes.ts`
- Create: `src/app/features/settings/views/settings-shell.component.ts`

- [ ] **Step 1: Add settings routes**

Create `src/app/features/settings/settings.routes.ts`:

```typescript
import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/settings-shell.component').then((m) => m.SettingsShellComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./views/settings-profile.component').then((m) => m.SettingsProfileComponent),
      },
      {
        path: 'access',
        loadComponent: () => import('./views/settings-access-management.component').then((m) => m.SettingsAccessManagementComponent),
      },
    ],
  },
];
```

- [ ] **Step 2: Wire settings into authenticated feature routing**

Modify `src/app/features/features.routing.ts`:

```typescript
{
  path: 'settings',
  loadChildren: () => import('./settings/settings.routes').then((m) => m.routes),
},
```

Place it with the other top-level authenticated feature routes.

- [ ] **Step 3: Create the shell component**

Create `src/app/features/settings/views/settings-shell.component.ts`:

```typescript
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PermissionService } from '@core/services/auth/permission.service';

@Component({
  selector: 'app-settings-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="flex h-full min-w-0 flex-col p-6">
      <header class="mb-6">
        <p class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold uppercase tracking-[0.22em]">Settings</p>
        <h1 class="text-secondary-950 dark:text-dark-secondary-50 mt-2 text-2xl font-semibold">Settings</h1>
      </header>

      <nav class="border-secondary-200 dark:border-dark-divider mb-6 flex gap-1 border-b">
        <a
          routerLink="profile"
          routerLinkActive="active"
          class="text-secondary-500 hover:text-secondary-950 dark:text-dark-secondary-400 dark:hover:text-dark-secondary-50 border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold transition-colors [&.active]:border-secondary-700 [&.active]:text-secondary-950 dark:[&.active]:border-dark-secondary-100 dark:[&.active]:text-dark-secondary-50">
          Profile
        </a>
        @if (canManageAccess()) {
          <a
            routerLink="access"
            routerLinkActive="active"
            class="text-secondary-500 hover:text-secondary-950 dark:text-dark-secondary-400 dark:hover:text-dark-secondary-50 border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold transition-colors [&.active]:border-secondary-700 [&.active]:text-secondary-950 dark:[&.active]:border-dark-secondary-100 dark:[&.active]:text-dark-secondary-50">
            Access Management
          </a>
        }
      </nav>

      <router-outlet />
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class SettingsShellComponent {
  readonly #permissionService = inject(PermissionService);
  readonly canManageAccess = computed(() => this.#permissionService.hasPermission('*'));
}
```

- [ ] **Step 4: Route sidebar cog to settings**

Modify the settings button in `src/app/layout/sidebar.ts`:

```html
<p-button
  class="p-button-xs sidebar-btn"
  variant="text"
  icon="pi pi-cog"
  size="small"
  severity="secondary"
  ariaLabel="Settings"
  routerLink="/settings" />
```

`RouterLink` is already imported by `SidebarComponent`.

- [ ] **Step 5: Run targeted route/sidebar verification**

Run:

```bash
yarn lint
```

Expected: no new lint errors from settings route or sidebar changes.

---

### Task 2: Implement Profile Settings View

**Files:**
- Create: `src/app/features/settings/views/settings-profile.component.ts`
- Create: `src/app/features/settings/views/settings-profile.component.spec.ts`

- [ ] **Step 1: Write profile view test**

Create `src/app/features/settings/views/settings-profile.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '@core/services/auth/auth.service';

import { SettingsProfileComponent } from './settings-profile.component';

describe('SettingsProfileComponent', () => {
  let fixture: ComponentFixture<SettingsProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsProfileComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: () => ({
              id: 'user-1',
              name: 'Test User',
              email: 'test@example.com',
              permissions: ['incomes:read'],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsProfileComponent);
    fixture.detectChanges();
  });

  it('renders current user profile information', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Test User');
    expect(text).toContain('test@example.com');
    expect(text).toContain('user-1');
  });

  it('renders current user permissions', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('incomes:read');
  });
});
```

- [ ] **Step 2: Implement profile view**

Create `src/app/features/settings/views/settings-profile.component.ts`:

```typescript
import { Component, computed, inject } from '@angular/core';

import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-settings-profile',
  template: `
    <div class="grid max-w-5xl grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border">
        <div class="border-secondary-100 dark:border-dark-divider border-b px-4 py-3">
          <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Profile</h2>
        </div>
        <dl class="divide-secondary-100 dark:divide-dark-divider divide-y px-4">
          <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-3">
            <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold uppercase tracking-wide">Name</dt>
            <dd class="text-secondary-950 dark:text-dark-secondary-50 min-w-0 truncate text-sm">{{ user()?.name ?? '-' }}</dd>
          </div>
          <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-3">
            <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold uppercase tracking-wide">Email</dt>
            <dd class="text-secondary-950 dark:text-dark-secondary-50 min-w-0 truncate text-sm">{{ user()?.email ?? '-' }}</dd>
          </div>
          <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-3">
            <dt class="text-secondary-500 dark:text-dark-secondary-400 text-[11px] font-bold uppercase tracking-wide">User ID</dt>
            <dd class="text-secondary-950 dark:text-dark-secondary-50 min-w-0 truncate text-sm">{{ user()?.id ?? '-' }}</dd>
          </div>
        </dl>
      </section>

      <section class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border">
        <div class="border-secondary-100 dark:border-dark-divider border-b px-4 py-3">
          <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Permissions</h2>
        </div>
        <div class="flex flex-wrap gap-2 p-4">
          @for (permission of permissions(); track permission) {
            <span class="bg-secondary-100 text-secondary-700 dark:bg-dark-primary-700 dark:text-dark-secondary-100 rounded-full px-2.5 py-1 text-xs font-semibold">
              {{ permission }}
            </span>
          } @empty {
            <span class="text-secondary-500 dark:text-dark-secondary-400 text-sm">No permissions assigned.</span>
          }
        </div>
      </section>
    </div>
  `,
})
export class SettingsProfileComponent {
  readonly #authService = inject(AuthService);

  readonly user = computed(() => this.#authService.user());
  readonly permissions = computed(() => this.user()?.permissions ?? []);
}
```

- [ ] **Step 3: Run profile test**

Run:

```bash
yarn test --include src/app/features/settings/views/settings-profile.component.spec.ts
```

Expected: profile tests pass.

---

### Task 3: Add Settings Admin Types and API Service

**Files:**
- Create: `src/app/features/settings/types/settings-admin.types.ts`
- Create: `src/app/features/settings/services/settings-admin-api.service.ts`
- Create: `src/app/features/settings/services/settings-admin-api.service.spec.ts`

- [ ] **Step 1: Define types**

Create `src/app/features/settings/types/settings-admin.types.ts`:

```typescript
export interface IRolePermission {
  id: number;
  roleId: string;
  claimType: string;
  claimValue: string;
}

export interface IAccessRole {
  id: string;
  name: string;
  normalizedName: string;
  concurrencyStamp: string;
  permissions: IRolePermission[];
}

export interface IAccessUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface IUserSearchResult {
  users: IAccessUser[];
  totalRecords: number;
}

export interface IUserSearchQuery {
  search?: string;
  role?: string;
  page: number;
  pageSize: number;
}

export interface IUpdateUserRolesRequest {
  roles: string[];
}
```

- [ ] **Step 2: Write API service test**

Create `src/app/features/settings/services/settings-admin-api.service.spec.ts`:

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SettingsAdminApiService } from './settings-admin-api.service';

describe('SettingsAdminApiService', () => {
  let service: SettingsAdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SettingsAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads roles with assigned permissions', () => {
    service.getRoles().subscribe((roles) => {
      expect(roles).toEqual([]);
    });

    const request = httpMock.expectOne('/api/admin/roles');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads users with filters and pagination', () => {
    service.getUsers({ search: 'anna', role: 'plan:standard', page: 2, pageSize: 10 }).subscribe((result) => {
      expect(result.totalRecords).toBe(0);
    });

    const request = httpMock.expectOne('/api/admin/users?search=anna&role=plan%3Astandard&page=2&pageSize=10');
    expect(request.request.method).toBe('GET');
    request.flush({ users: [], totalRecords: 0 });
  });

  it('updates user roles', () => {
    service.updateUserRoles('user-1', { roles: ['plan:premium'] }).subscribe();

    const request = httpMock.expectOne('/api/admin/users/user-1/roles');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ roles: ['plan:premium'] });
    request.flush({});
  });
});
```

- [ ] **Step 3: Implement API service**

Create `src/app/features/settings/services/settings-admin-api.service.ts`:

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { getApiBaseUrl } from '@core/config/runtime-config';

import { type IAccessRole, type IUpdateUserRolesRequest, type IUserSearchQuery, type IUserSearchResult } from '../types/settings-admin.types';

@Injectable({ providedIn: 'root' })
export class SettingsAdminApiService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = `${getApiBaseUrl()}/admin`;

  getRoles(): Observable<IAccessRole[]> {
    return this.#http.get<IAccessRole[]>(`${this.#apiUrl}/roles`);
  }

  getUsers(query: IUserSearchQuery): Observable<IUserSearchResult> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.role) {
      params = params.set('role', query.role);
    }

    return this.#http.get<IUserSearchResult>(`${this.#apiUrl}/users`, { params });
  }

  updateUserRoles(userId: string, request: IUpdateUserRolesRequest): Observable<void> {
    return this.#http.put<void>(`${this.#apiUrl}/users/${userId}/roles`, request);
  }
}
```

- [ ] **Step 4: Run service test**

Run:

```bash
yarn test --include src/app/features/settings/services/settings-admin-api.service.spec.ts
```

Expected: API service tests pass.

---

### Task 4: Build Roles and Permissions Panel

**Files:**
- Create: `src/app/features/settings/components/role-permissions-panel.component.ts`
- Create: `src/app/features/settings/components/role-permissions-panel.component.spec.ts`

- [ ] **Step 1: Write component test**

Create `src/app/features/settings/components/role-permissions-panel.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolePermissionsPanelComponent } from './role-permissions-panel.component';

describe('RolePermissionsPanelComponent', () => {
  let fixture: ComponentFixture<RolePermissionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePermissionsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RolePermissionsPanelComponent);
    fixture.componentRef.setInput('roles', [
      {
        id: 'role-plan-premium',
        name: 'plan:premium',
        normalizedName: 'PLAN:PREMIUM',
        concurrencyStamp: 'stamp',
        permissions: [
          { id: 1, roleId: 'role-plan-premium', claimType: 'permission', claimValue: 'incomes:read' },
          { id: 2, roleId: 'role-plan-premium', claimType: 'permission', claimValue: 'expenses:read' },
        ],
      },
    ]);
    fixture.detectChanges();
  });

  it('renders product role names and assigned permissions', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Premium plan');
    expect(text).toContain('role-plan-premium / PLAN:PREMIUM');
    expect(text).toContain('incomes:read');
    expect(text).toContain('expenses:read');
  });
});
```

- [ ] **Step 2: Implement role permissions panel**

Create `src/app/features/settings/components/role-permissions-panel.component.ts`:

```typescript
import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { type IAccessRole } from '../types/settings-admin.types';

interface IFilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-role-permissions-panel',
  imports: [FormsModule, InputText, Select],
  template: `
    <section class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border">
      <header class="border-secondary-100 dark:border-dark-divider flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Roles</h2>
          <p class="text-secondary-500 dark:text-dark-secondary-400 mt-1 text-xs">Role definitions and their assigned permissions.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input class="w-full sm:w-64" pInputText type="text" placeholder="Search roles or permissions" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          <p-select [options]="domainOptions" [ngModel]="domain()" (ngModelChange)="domain.set($event)" optionLabel="label" optionValue="value" size="small" />
          <p-select [options]="roleTypeOptions" [ngModel]="roleType()" (ngModelChange)="roleType.set($event)" optionLabel="label" optionValue="value" size="small" />
        </div>
      </header>

      <div class="divide-secondary-100 dark:divide-dark-divider divide-y">
        @for (role of filteredRoles(); track role.id) {
          <details class="group">
            <summary class="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <span class="min-w-0">
                <span class="text-secondary-950 dark:text-dark-secondary-50 block truncate text-base font-semibold">{{ displayRoleName(role.name) }}</span>
                <span class="text-secondary-500 dark:text-dark-secondary-400 block truncate text-xs font-semibold">{{ role.id }} / {{ role.normalizedName }}</span>
              </span>
              <span class="bg-secondary-100 text-secondary-600 dark:bg-dark-primary-700 dark:text-dark-secondary-200 rounded-full px-2.5 py-1 text-xs font-bold">
                {{ role.permissions.length }} {{ role.permissions.length === 1 ? 'permission' : 'permissions' }}
              </span>
            </summary>
            <div class="flex flex-wrap gap-2 px-4 pb-4">
              @for (permission of role.permissions; track permission.id) {
                <span [class]="permissionClass(permission.claimValue)">{{ permission.claimValue }}</span>
              } @empty {
                <span class="text-secondary-500 dark:text-dark-secondary-400 text-sm">No assigned permissions.</span>
              }
            </div>
          </details>
        } @empty {
          <div class="text-secondary-500 dark:text-dark-secondary-400 p-6 text-sm">No roles match the selected filters.</div>
        }
      </div>
    </section>
  `,
})
export class RolePermissionsPanelComponent {
  readonly roles = input.required<IAccessRole[]>();

  readonly search = signal('');
  readonly domain = signal('all');
  readonly roleType = signal('all');

  readonly domainOptions: IFilterOption[] = [
    { label: 'All domains', value: 'all' },
    { label: 'Incomes', value: 'incomes' },
    { label: 'Expenses', value: 'expenses' },
    { label: 'Stocks', value: 'stocks' },
  ];

  readonly roleTypeOptions: IFilterOption[] = [
    { label: 'All roles', value: 'all' },
    { label: 'Plan roles', value: 'plan' },
    { label: 'Admin roles', value: 'admin' },
  ];

  readonly filteredRoles = computed(() => {
    const search = this.search().trim().toLowerCase();
    const domain = this.domain();
    const roleType = this.roleType();

    return this.roles().filter((role) => {
      const roleMatchesType =
        roleType === 'all' ||
        (roleType === 'plan' && role.name.startsWith('plan:')) ||
        (roleType === 'admin' && (role.name === 'admin' || role.name === 'superadmin'));

      const roleMatchesDomain =
        domain === 'all' || role.permissions.some((permission) => permission.claimValue.startsWith(`${domain}:`));

      const roleMatchesSearch =
        search.length === 0 ||
        role.name.toLowerCase().includes(search) ||
        role.id.toLowerCase().includes(search) ||
        role.permissions.some((permission) => permission.claimValue.toLowerCase().includes(search));

      return roleMatchesType && roleMatchesDomain && roleMatchesSearch;
    });
  });

  displayRoleName(role: string): string {
    const names: Record<string, string> = {
      'plan:free': 'Free plan',
      'plan:standard': 'Standard plan',
      'plan:premium': 'Premium plan',
      admin: 'Admin',
      superadmin: 'Super admin',
    };

    return names[role] ?? role;
  }

  permissionClass(permission: string): string {
    const base = 'rounded-full px-2.5 py-1 text-xs font-semibold';
    if (permission.startsWith('expenses:')) return `${base} bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200`;
    if (permission.startsWith('stocks:')) return `${base} bg-secondary-100 text-secondary-700 dark:bg-dark-primary-700 dark:text-dark-secondary-100`;
    return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200`;
  }
}
```

- [ ] **Step 3: Run component test**

Run:

```bash
yarn test --include src/app/features/settings/components/role-permissions-panel.component.spec.ts
```

Expected: role permissions panel tests pass.

---

### Task 5: Build User Role Assignment Panel

**Files:**
- Create: `src/app/features/settings/components/user-role-assignment-panel.component.ts`
- Create: `src/app/features/settings/components/user-role-assignment-panel.component.spec.ts`

- [ ] **Step 1: Write assignment panel test**

Create `src/app/features/settings/components/user-role-assignment-panel.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRoleAssignmentPanelComponent } from './user-role-assignment-panel.component';

describe('UserRoleAssignmentPanelComponent', () => {
  let fixture: ComponentFixture<UserRoleAssignmentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoleAssignmentPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserRoleAssignmentPanelComponent);
    fixture.componentRef.setInput('users', [
      { id: 'user-1', name: 'Anna Nowak', email: 'anna@example.com', roles: ['plan:standard'] },
    ]);
    fixture.componentRef.setInput('availableRoles', ['plan:free', 'plan:standard', 'plan:premium', 'admin', 'superadmin']);
    fixture.componentRef.setInput('totalRecords', 42);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
  });

  it('renders users and role filters', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Anna Nowak');
    expect(text).toContain('anna@example.com');
    expect(text).toContain('Standard plan');
    expect(text).toContain('1-10 of 42 users');
  });
});
```

- [ ] **Step 2: Implement assignment panel**

Create `src/app/features/settings/components/user-role-assignment-panel.component.ts`:

```typescript
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { type IAccessUser } from '../types/settings-admin.types';

@Component({
  selector: 'app-user-role-assignment-panel',
  imports: [FormsModule, Button, Checkbox, InputText, Select],
  template: `
    <aside class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border">
      <header class="border-secondary-100 dark:border-dark-divider flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Assign roles to users</h2>
          <p class="text-secondary-500 dark:text-dark-secondary-400 mt-1 text-xs">Search users, filter by assigned role, then update the selected user.</p>
        </div>
      </header>

      <div class="border-secondary-100 dark:border-dark-divider flex flex-col gap-2 border-b p-4 sm:flex-row">
        <input class="w-full" pInputText type="text" placeholder="Search users" [ngModel]="search()" (ngModelChange)="searchChanged.emit($event)" />
        <p-select class="min-w-40" [options]="roleOptions()" [ngModel]="roleFilter()" (ngModelChange)="roleFilterChanged.emit($event)" optionLabel="label" optionValue="value" size="small" />
      </div>

      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-secondary-500 dark:text-dark-secondary-400 text-left text-[11px] font-bold uppercase tracking-wide">
            <th class="border-secondary-100 dark:border-dark-divider border-b px-4 py-2">User</th>
            <th class="border-secondary-100 dark:border-dark-divider border-b px-4 py-2">Email</th>
            <th class="border-secondary-100 dark:border-dark-divider border-b px-4 py-2">Roles</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr
              class="hover:bg-secondary-50 dark:hover:bg-dark-primary-800 cursor-pointer"
              [class.bg-secondary-50]="selectedUser()?.id === user.id"
              (click)="selectedUserId.set(user.id)">
              <td class="border-secondary-100 dark:border-dark-divider border-b px-4 py-3">{{ user.name }}</td>
              <td class="border-secondary-100 dark:border-dark-divider border-b px-4 py-3">{{ user.email }}</td>
              <td class="border-secondary-100 dark:border-dark-divider border-b px-4 py-3">
                @for (role of user.roles; track role) {
                  <span class="bg-secondary-100 text-secondary-700 dark:bg-dark-primary-700 dark:text-dark-secondary-100 mr-1 rounded-full px-2 py-1 text-xs font-semibold">
                    {{ displayRoleName(role) }}
                  </span>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td class="text-secondary-500 dark:text-dark-secondary-400 px-4 py-6 text-center" colspan="3">No users found.</td>
            </tr>
          }
        </tbody>
      </table>

      <footer class="border-secondary-100 dark:border-dark-divider flex items-center justify-between border-b px-4 py-3">
        <span class="text-secondary-500 dark:text-dark-secondary-400 text-xs">{{ pageRange() }}</span>
        <div class="flex gap-1">
          <p-button icon="pi pi-chevron-left" size="small" severity="secondary" [text]="true" [disabled]="page() === 1" (onClick)="previousPage.emit()" ariaLabel="Previous page" />
          <p-button icon="pi pi-chevron-right" size="small" severity="secondary" [text]="true" [disabled]="page() * pageSize() >= totalRecords()" (onClick)="nextPage.emit()" ariaLabel="Next page" />
        </div>
      </footer>

      <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        @for (role of availableRoles(); track role) {
          <label class="border-secondary-200 dark:border-dark-divider flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
            <p-checkbox [binary]="true" [ngModel]="selectedRoles().includes(role)" (ngModelChange)="toggleRole(role)" />
            {{ displayRoleName(role) }}
          </label>
        }
      </div>

      <div class="border-secondary-100 dark:border-dark-divider flex justify-end gap-2 border-t p-4">
        <p-button label="Reset" size="small" severity="secondary" [text]="true" (onClick)="resetRoles()" />
        <p-button label="Save roles" size="small" severity="success" [disabled]="!selectedUser()" (onClick)="saveRoles()" />
      </div>
    </aside>
  `,
})
export class UserRoleAssignmentPanelComponent {
  readonly users = input.required<IAccessUser[]>();
  readonly availableRoles = input.required<string[]>();
  readonly totalRecords = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly roleFilter = input<string>('all');

  readonly searchChanged = output<string>();
  readonly roleFilterChanged = output<string>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();
  readonly rolesSaved = output<{ userId: string; roles: string[] }>();

  readonly selectedUserId = signal<string | null>(null);
  readonly selectedRoles = signal<string[]>([]);

  readonly selectedUser = computed(() => this.users().find((user) => user.id === this.selectedUserId()) ?? this.users()[0] ?? null);

  readonly roleOptions = computed(() => [
    { label: 'Any role', value: 'all' },
    ...this.availableRoles().map((role) => ({ label: this.displayRoleName(role), value: role })),
  ]);

  readonly pageRange = computed(() => {
    const total = this.totalRecords();
    if (total === 0) return '0 users';

    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), total);
    return `${start}-${end} of ${total} users`;
  });

  toggleRole(role: string): void {
    const roles = this.selectedRoles();
    this.selectedRoles.set(roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]);
  }

  resetRoles(): void {
    this.selectedRoles.set(this.selectedUser()?.roles ?? []);
  }

  saveRoles(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.rolesSaved.emit({ userId: user.id, roles: this.selectedRoles() });
  }

  displayRoleName(role: string): string {
    const names: Record<string, string> = {
      'plan:free': 'Free plan',
      'plan:standard': 'Standard plan',
      'plan:premium': 'Premium plan',
      admin: 'Admin',
      superadmin: 'Super admin',
    };

    return names[role] ?? role;
  }
}
```

- [ ] **Step 3: Run assignment panel test**

Run:

```bash
yarn test --include src/app/features/settings/components/user-role-assignment-panel.component.spec.ts
```

Expected: assignment panel tests pass.

---

### Task 6: Implement Access Management View

**Files:**
- Create: `src/app/features/settings/views/settings-access-management.component.ts`
- Create: `src/app/features/settings/views/settings-access-management.component.spec.ts`

- [ ] **Step 1: Write access management view test**

Create `src/app/features/settings/views/settings-access-management.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionService } from '@core/services/auth/permission.service';

import { SettingsAdminApiService } from '../services/settings-admin-api.service';
import { SettingsAccessManagementComponent } from './settings-access-management.component';

describe('SettingsAccessManagementComponent', () => {
  let fixture: ComponentFixture<SettingsAccessManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccessManagementComponent],
      providers: [
        { provide: PermissionService, useValue: { hasPermission: () => true } },
        {
          provide: SettingsAdminApiService,
          useValue: {
            getRoles: () => of([]),
            getUsers: () => of({ users: [], totalRecords: 0 }),
            updateUserRoles: () => of(void 0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAccessManagementComponent);
    fixture.detectChanges();
  });

  it('renders access management sections for superadmin users', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Permissions');
    expect(text).toContain('Assign roles to users');
  });
});
```

- [ ] **Step 2: Implement access management view**

Create `src/app/features/settings/views/settings-access-management.component.ts`:

```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import { PermissionService } from '@core/services/auth/permission.service';

import { RolePermissionsPanelComponent } from '../components/role-permissions-panel.component';
import { UserRoleAssignmentPanelComponent } from '../components/user-role-assignment-panel.component';
import { SettingsAdminApiService } from '../services/settings-admin-api.service';
import { type IAccessRole, type IAccessUser } from '../types/settings-admin.types';

@Component({
  selector: 'app-settings-access-management',
  imports: [RolePermissionsPanelComponent, UserRoleAssignmentPanelComponent],
  template: `
    @if (!canManageAccess()) {
      <div class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border p-8 text-center">
        <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Access management is restricted</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-400 mt-2 text-sm">Only superadmin users can manage roles and permissions.</p>
      </div>
    } @else if (isLoading()) {
      <div class="text-secondary-500 dark:text-dark-secondary-300 flex min-h-56 items-center justify-center gap-3">
        <i class="pi pi-spinner pi-spin text-lg"></i>
        <span>Loading access management...</span>
      </div>
    } @else if (error()) {
      <div class="border-secondary-200 dark:border-dark-divider bg-white dark:bg-dark-primary-850 rounded-lg border p-8 text-center">
        <h2 class="text-secondary-950 dark:text-dark-secondary-50 text-sm font-semibold">Unable to load access management</h2>
        <p class="text-secondary-500 dark:text-dark-secondary-400 mt-2 text-sm">{{ error() }}</p>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <app-role-permissions-panel [roles]="roles()" />
        <app-user-role-assignment-panel
          [users]="users()"
          [availableRoles]="availableRoleNames()"
          [totalRecords]="totalUsers()"
          [page]="page()"
          [pageSize]="pageSize()"
          [roleFilter]="roleFilter()"
          (searchChanged)="onSearchChanged($event)"
          (roleFilterChanged)="onRoleFilterChanged($event)"
          (previousPage)="onPreviousPage()"
          (nextPage)="onNextPage()"
          (rolesSaved)="onRolesSaved($event)" />
      </div>
    }
  `,
})
export class SettingsAccessManagementComponent {
  readonly #api = inject(SettingsAdminApiService);
  readonly #permissionService = inject(PermissionService);

  readonly canManageAccess = computed(() => this.#permissionService.hasPermission('*'));
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly roles = signal<IAccessRole[]>([]);
  readonly users = signal<IAccessUser[]>([]);
  readonly totalUsers = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly roleFilter = signal('all');

  readonly availableRoleNames = computed(() => this.roles().map((role) => role.name));

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.canManageAccess()) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      roles: this.#api.getRoles(),
      users: this.#api.getUsers({
        search: this.search() || undefined,
        role: this.roleFilter() === 'all' ? undefined : this.roleFilter(),
        page: this.page(),
        pageSize: this.pageSize(),
      }),
    })
      .pipe(
        catchError(() => {
          this.error.set('Try again after the portal admin endpoints are available.');
          return of({ roles: [], users: { users: [], totalRecords: 0 } });
        }),
      )
      .subscribe(({ roles, users }) => {
        this.roles.set(roles);
        this.users.set(users.users);
        this.totalUsers.set(users.totalRecords);
        this.isLoading.set(false);
      });
  }

  onSearchChanged(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  onRoleFilterChanged(value: string): void {
    this.roleFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onPreviousPage(): void {
    this.page.update((page) => Math.max(1, page - 1));
    this.load();
  }

  onNextPage(): void {
    this.page.update((page) => page + 1);
    this.load();
  }

  onRolesSaved(event: { userId: string; roles: string[] }): void {
    this.#api.updateUserRoles(event.userId, { roles: event.roles }).subscribe(() => this.load());
  }
}
```

- [ ] **Step 3: Run access management test**

Run:

```bash
yarn test --include src/app/features/settings/views/settings-access-management.component.spec.ts
```

Expected: access management view tests pass.

---

### Task 7: Verify Integration and Build

**Files:**
- All settings files from previous tasks.

- [ ] **Step 1: Run targeted settings tests**

Run:

```bash
yarn test --include 'src/app/features/settings/**/*.spec.ts'
```

Expected: all settings tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
yarn lint
```

Expected: no lint errors from settings feature or sidebar route change.

- [ ] **Step 3: Run production build**

Run:

```bash
yarn build
```

Expected: Angular production build succeeds.

- [ ] **Step 4: Manual browser verification**

Run:

```bash
yarn start
```

Open:

```text
http://localhost:4200/settings
```

Expected:
- Sidebar cog routes to `/settings`.
- `/settings` redirects to `/settings/profile`.
- Normal users see Profile tab only.
- Users with wildcard permission `*` see Access Management tab.
- Access Management renders loading/error states cleanly if admin endpoints are not available.

---

## Follow-Up Backend Contract

The live Access Management screen depends on portal endpoints. If they do not exist yet, implement them in the portal before turning on real mutations:

```text
GET /api/admin/roles
GET /api/admin/users?search=&role=&page=&pageSize=
PUT /api/admin/users/{userId}/roles
```

Expected frontend response shapes:

```typescript
IAccessRole[]
IUserSearchResult
void
```

Keep `AspNetRoles` and `AspNetRoleClaims` as backend/database terminology only. UI labels should be `Roles`, `Permissions`, and `Assigned permissions`.

## Plan Self-Review

- Spec coverage: sidebar navigation, settings route, profile tab, superadmin tab, roles/permissions, filtering, user role assignment, pagination, tests, and backend contract are covered.
- Placeholder scan: no placeholder markers remain.
- Type consistency: `IAccessRole`, `IRolePermission`, `IAccessUser`, `IUserSearchQuery`, and `IUserSearchResult` are used consistently across service, view, and components.
