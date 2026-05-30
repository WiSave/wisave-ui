# Expenses Shell Plugin Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the expenses domain from app-composed feature libraries to a domain shell that composes expenses feature/plugin slices.

**Architecture:** `wisave-ui` should lazy-load `@wisave/expenses/shell` only. The expenses shell owns the `/expenses` child route composition and delegates to same-domain slices: `@wisave/expenses/plugins/list`, `@wisave/expenses/plugins/budget`, and `@wisave/expenses/plugins/accounts`. This follows the shell library pattern from Angular.love: a shell is the bounded-context entry point/glue, while Nx tags enforce dependency direction.

**Tech Stack:** Angular 21 standalone routes/components, Nx 22 project graph, Vitest via `@nx/vitest`, ESLint flat config with `@nx/enforce-module-boundaries`, Yarn 4.

**Source Basis:**

- https://angular.love/shell-library-patterns-with-nx-and-monorepo-architectures
- https://angular.love/beyond-clean-code-building-a-scalable-angular-frontend-architecture-with-nx-monorepos
- https://angular.love/hide-boilerplate-nx-files-in-vscode-webstorm

---

## Target Topology

Current:

```text
apps/wisave-ui
  -> @wisave/expenses/feature-list
  -> @wisave/expenses/feature-budget
  -> @wisave/expenses/feature-accounts

libs/expenses/feature-list
libs/expenses/feature-budget
libs/expenses/feature-accounts
libs/expenses/data-access
```

Target:

```text
apps/wisave-ui
  -> @wisave/expenses/shell

libs/expenses/shell             # routes + domain shell component
libs/expenses/plugins/list      # former feature-list
libs/expenses/plugins/budget    # former feature-budget
libs/expenses/plugins/accounts  # former feature-accounts
libs/expenses/data-access
```

Nx project names:

```text
expenses-shell
expenses-list
expenses-budget
expenses-accounts
expenses-data-access
```

Boundary intent:

```text
app -> expenses-shell
expenses-shell -> expenses-list | expenses-budget | expenses-accounts
expenses-list | expenses-budget | expenses-accounts -> expenses-data-access | shared | platform
expenses plugin slice -x-> sibling expenses plugin slice
expenses-data-access -x-> shell/plugin slices
```

Keep plugin slices tagged as `type:feature`. "Plugin" is the domain language and folder convention; Nx still uses standard feature/data-access tags.

---

## Files To Modify Or Create

- Create: `libs/expenses/shell/project.json`
- Create: `libs/expenses/shell/src/index.ts`
- Create: `libs/expenses/shell/src/lib/expenses.routes.ts`
- Create: `libs/expenses/shell/src/lib/expenses.routes.spec.ts`
- Move: `libs/expenses/feature-list/src/lib/views/expenses-shell.component.ts` -> `libs/expenses/shell/src/lib/views/expenses-shell.component.ts`
- Create: `libs/expenses/shell/src/test-setup.ts`
- Create: `libs/expenses/shell/tsconfig.json`
- Create: `libs/expenses/shell/tsconfig.lib.json`
- Create: `libs/expenses/shell/tsconfig.spec.json`
- Create: `libs/expenses/shell/vite.config.ts`
- Move: `libs/expenses/feature-list` -> `libs/expenses/plugins/list`
- Move: `libs/expenses/feature-budget` -> `libs/expenses/plugins/budget`
- Move: `libs/expenses/feature-accounts` -> `libs/expenses/plugins/accounts`
- Modify: `apps/wisave-ui/src/app/app.routes.ts`
- Create: `apps/wisave-ui/src/app/app.routes.spec.ts`
- Modify: `apps/wisave-ui/project.json`
- Modify: `libs/platform/shell/project.json`
- Modify: `tsconfig.base.json`
- Modify: `eslint.config.mjs`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/features/expenses.md`
- Create: `.vscode/settings.json`

---

### Task 1: Add App Route Contract Test

**Files:**

- Create: `apps/wisave-ui/src/app/app.routes.spec.ts`

- [ ] **Step 1: Write the failing app route test**

Create `apps/wisave-ui/src/app/app.routes.spec.ts`:

```typescript
import { type Route } from '@angular/router';

import { routes as expensesShellRoutes } from '@wisave/expenses/shell';

import { routes } from './app.routes';

describe('app routes', () => {
  function findMainChild(path: string): Route | undefined {
    const mainRoute = routes.find((route) => route.path === '');
    return mainRoute?.children?.find((route) => route.path === path);
  }

  it('delegates expenses composition to the expenses shell library', async () => {
    const expensesRoute = findMainChild('expenses');

    expect(expensesRoute?.loadChildren).toBeDefined();
    expect(expensesRoute?.loadComponent).toBeUndefined();
    expect(expensesRoute?.children).toBeUndefined();

    const loadedRoutes = await (expensesRoute?.loadChildren as () => Promise<unknown>)();

    expect(loadedRoutes).toBe(expensesShellRoutes);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
yarn nx test wisave-ui --skip-nx-cache
```

Expected: FAIL because `@wisave/expenses/shell` does not exist yet.

- [ ] **Step 3: Keep the failing test for the next task**

Do not commit this failing state. Task 2 creates the shell library and commits the now-passing contract test with the implementation.

---

### Task 2: Create Expenses Shell Library

**Files:**

- Create: `libs/expenses/shell/project.json`
- Create: `libs/expenses/shell/src/index.ts`
- Create: `libs/expenses/shell/src/lib/expenses.routes.ts`
- Create: `libs/expenses/shell/src/lib/expenses.routes.spec.ts`
- Move: `libs/expenses/feature-list/src/lib/views/expenses-shell.component.ts` -> `libs/expenses/shell/src/lib/views/expenses-shell.component.ts`
- Create: `libs/expenses/shell/src/test-setup.ts`
- Create: `libs/expenses/shell/tsconfig.json`
- Create: `libs/expenses/shell/tsconfig.lib.json`
- Create: `libs/expenses/shell/tsconfig.spec.json`
- Create: `libs/expenses/shell/vite.config.ts`
- Modify: `libs/expenses/feature-list/src/index.ts`
- Modify: `apps/wisave-ui/src/app/app.routes.ts`
- Modify: `apps/wisave-ui/project.json`
- Modify: `tsconfig.base.json`
- Modify: `libs/platform/shell/project.json`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Move the shell component**

Run:

```bash
mkdir -p libs/expenses/shell/src/lib/views
git mv libs/expenses/feature-list/src/lib/views/expenses-shell.component.ts libs/expenses/shell/src/lib/views/expenses-shell.component.ts
```

Remove the shell export from `libs/expenses/feature-list/src/index.ts` so it contains only:

```typescript
export { routes } from './lib/expenses.routes';
```

- [ ] **Step 2: Create shell project metadata**

Create `libs/expenses/shell/project.json`:

```json
{
  "name": "expenses-shell",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "tags": ["scope:expenses", "type:shell"],
  "implicitDependencies": ["expenses-feature-list", "expenses-feature-budget", "expenses-feature-accounts"],
  "sourceRoot": "libs/expenses/shell/src",
  "prefix": "app",
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/expenses/shell/**/*.ts", "libs/expenses/shell/**/*.html"]
      }
    },
    "test": {
      "executor": "@nx/vitest:test",
      "options": {
        "configFile": "libs/expenses/shell/vite.config.ts",
        "reportsDirectory": "coverage/libs/expenses/shell",
        "passWithNoTests": true
      }
    }
  }
}
```

Create `libs/expenses/shell/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc/libs/expenses/shell"
  },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }, { "path": "./tsconfig.spec.json" }]
}
```

Create `libs/expenses/shell/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc/libs/expenses/shell/lib",
    "types": []
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "src/test-setup.ts"]
}
```

Create `libs/expenses/shell/tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc/libs/expenses/shell/spec",
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*.spec.ts", "src/test-setup.ts"]
}
```

- [ ] **Step 3: Create shell Vitest setup**

Create `libs/expenses/shell/src/test-setup.ts`:

```typescript
import '@analogjs/vitest-angular/setup-zone';
```

Create `libs/expenses/shell/vite.config.ts`:

```typescript
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';

const config: UserConfig & { test: InlineConfig } = {
  cacheDir: '../../../node_modules/.vite/libs/expenses/shell',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/expenses/shell',
    },
  },
};

export default config;
```

- [ ] **Step 4: Add shell public API and routes**

Create `libs/expenses/shell/src/index.ts`:

```typescript
export { routes } from './lib/expenses.routes';
export { ExpensesShellComponent } from './lib/views/expenses-shell.component';
```

Create `libs/expenses/shell/src/lib/expenses.routes.ts`:

```typescript
import { type Routes } from '@angular/router';

import { ExpensesShellComponent } from './views/expenses-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ExpensesShellComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', loadChildren: () => import('@wisave/expenses/feature-list').then((m) => m.routes) },
      { path: 'budget', loadChildren: () => import('@wisave/expenses/feature-budget').then((m) => m.budgetRoutes) },
      { path: 'accounts', loadChildren: () => import('@wisave/expenses/feature-accounts').then((m) => m.routes) },
      { path: 'insights', loadChildren: () => import('@wisave/expenses/feature-budget').then((m) => m.insightsRoutes) },
    ],
  },
];
```

Create `libs/expenses/shell/src/lib/expenses.routes.spec.ts`:

```typescript
import { type Route } from '@angular/router';

import { routes as accountRoutes } from '@wisave/expenses/feature-accounts';
import { budgetRoutes, insightsRoutes } from '@wisave/expenses/feature-budget';
import { routes as listRoutes } from '@wisave/expenses/feature-list';

import { routes } from './expenses.routes';
import { ExpensesShellComponent } from './views/expenses-shell.component';

describe('expenses shell routes', () => {
  function child(path: string): Route | undefined {
    return routes[0]?.children?.find((route) => route.path === path);
  }

  it('hosts expenses plugin routes under the shell component', () => {
    expect(routes[0]?.path).toBe('');
    expect(routes[0]?.component).toBe(ExpensesShellComponent);
    expect(routes[0]?.children?.map((route) => route.path)).toEqual(['', 'list', 'budget', 'accounts', 'insights']);
  });

  it('delegates list, budget, accounts, and insights to expenses plugin libraries', async () => {
    await expect((child('list')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(listRoutes);
    await expect((child('budget')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(budgetRoutes);
    await expect((child('accounts')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(accountRoutes);
    await expect((child('insights')?.loadChildren as () => Promise<unknown>)()).resolves.toBe(insightsRoutes);
  });
});
```

- [ ] **Step 5: Add shell alias**

Modify `tsconfig.base.json` paths:

```json
"@wisave/expenses/shell": ["./libs/expenses/shell/src/index.ts"],
"@wisave/expenses/data-access": ["./libs/expenses/data-access/src/index.ts"],
"@wisave/expenses/feature-accounts": ["./libs/expenses/feature-accounts/src/index.ts"],
"@wisave/expenses/feature-budget": ["./libs/expenses/feature-budget/src/index.ts"],
"@wisave/expenses/feature-list": ["./libs/expenses/feature-list/src/index.ts"]
```

- [ ] **Step 6: Route the app through the shell**

Replace the current `expenses` route in `apps/wisave-ui/src/app/app.routes.ts` with:

```typescript
{
  path: 'expenses',
  loadChildren: () => import('@wisave/expenses/shell').then((m) => m.routes),
},
```

Modify `apps/wisave-ui/project.json` so the expenses part of `implicitDependencies` is:

```json
"expenses-shell"
```

and remove:

```json
"expenses-feature-list",
"expenses-feature-budget",
"expenses-feature-accounts"
```

- [ ] **Step 7: Split platform layout from domain shell tags**

Modify `libs/platform/shell/project.json` tags:

```json
"tags": ["scope:platform", "type:layout"]
```

Modify `eslint.config.mjs` type constraints:

```typescript
{
  sourceTag: 'type:app',
  onlyDependOnLibsWithTags: [
    'type:layout',
    'type:shell',
    'type:feature',
    'type:auth',
    'type:signalr',
    'type:util',
  ],
},
{ sourceTag: 'type:layout', onlyDependOnLibsWithTags: ['type:ui', 'type:auth', 'type:util', 'type:model'] },
{
  sourceTag: 'type:shell',
  onlyDependOnLibsWithTags: [
    'type:feature',
    'type:ui',
    'type:auth',
    'type:signalr',
    'type:util',
    'type:model',
  ],
},
```

Keep `type:feature` allowed from `type:app` for this pilot because other domains still expose feature libraries directly. Remove that allowance only after all app-facing domains have shell libraries.

- [ ] **Step 8: Verify shell creation**

Run:

```bash
yarn nx test expenses-shell --skip-nx-cache
yarn nx test wisave-ui --skip-nx-cache
yarn nx lint expenses-shell --skip-nx-cache
yarn nx lint wisave-ui --skip-nx-cache
```

Expected: all commands pass.

- [ ] **Step 9: Commit shell creation**

```bash
git add apps/wisave-ui libs/expenses/shell libs/expenses/feature-list tsconfig.base.json eslint.config.mjs libs/platform/shell/project.json
git commit -m "refactor: add expenses shell library"
```

---

### Task 3: Rename Expenses Feature Slices To Plugin-Style Names

**Files:**

- Move: `libs/expenses/feature-list` -> `libs/expenses/plugins/list`
- Move: `libs/expenses/feature-budget` -> `libs/expenses/plugins/budget`
- Move: `libs/expenses/feature-accounts` -> `libs/expenses/plugins/accounts`
- Modify: `libs/expenses/plugins/list/project.json`
- Modify: `libs/expenses/plugins/budget/project.json`
- Modify: `libs/expenses/plugins/accounts/project.json`
- Modify: `libs/expenses/plugins/list/tsconfig.json`
- Modify: `libs/expenses/plugins/budget/tsconfig.json`
- Modify: `libs/expenses/plugins/accounts/tsconfig.json`
- Modify: `libs/expenses/plugins/accounts/vite.config.ts`
- Modify: `libs/expenses/shell/project.json`
- Modify: `libs/expenses/shell/src/lib/expenses.routes.ts`
- Modify: `libs/expenses/shell/src/lib/expenses.routes.spec.ts`
- Modify: `tsconfig.base.json`

- [ ] **Step 1: Move the library folders**

Run:

```bash
git mv libs/expenses/feature-list libs/expenses/plugins/list
git mv libs/expenses/feature-budget libs/expenses/plugins/budget
git mv libs/expenses/feature-accounts libs/expenses/plugins/accounts
```

- [ ] **Step 2: Rename project metadata**

Modify `libs/expenses/plugins/list/project.json`:

```json
{
  "name": "expenses-list",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "tags": ["scope:expenses", "type:feature"],
  "sourceRoot": "libs/expenses/plugins/list/src",
  "prefix": "app",
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/expenses/plugins/list/**/*.ts", "libs/expenses/plugins/list/**/*.html"]
      }
    }
  }
}
```

Modify `libs/expenses/plugins/budget/project.json`:

```json
{
  "name": "expenses-budget",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "tags": ["scope:expenses", "type:feature"],
  "sourceRoot": "libs/expenses/plugins/budget/src",
  "prefix": "app",
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/expenses/plugins/budget/**/*.ts", "libs/expenses/plugins/budget/**/*.html"]
      }
    }
  }
}
```

Modify `libs/expenses/plugins/accounts/project.json`:

```json
{
  "name": "expenses-accounts",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "tags": ["scope:expenses", "type:feature"],
  "sourceRoot": "libs/expenses/plugins/accounts/src",
  "prefix": "app",
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/expenses/plugins/accounts/**/*.ts", "libs/expenses/plugins/accounts/**/*.html"]
      }
    },
    "test": {
      "executor": "@nx/vitest:test",
      "options": {
        "configFile": "libs/expenses/plugins/accounts/vite.config.ts",
        "reportsDirectory": "coverage/libs/expenses/plugins/accounts",
        "passWithNoTests": true
      }
    }
  }
}
```

- [ ] **Step 3: Update TypeScript output paths**

Set these values:

```json
// libs/expenses/plugins/list/tsconfig.json
"outDir": "../../../../dist/out-tsc/libs/expenses/plugins/list"

// libs/expenses/plugins/budget/tsconfig.json
"outDir": "../../../../dist/out-tsc/libs/expenses/plugins/budget"

// libs/expenses/plugins/accounts/tsconfig.json
"outDir": "../../../../dist/out-tsc/libs/expenses/plugins/accounts"
```

- [ ] **Step 4: Update accounts Vitest paths**

Modify `libs/expenses/plugins/accounts/vite.config.ts`:

```typescript
const config: UserConfig & { test: InlineConfig } = {
  cacheDir: '../../../../node_modules/.vite/libs/expenses/plugins/accounts',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/expenses/plugins/accounts',
    },
  },
};
```

- [ ] **Step 5: Rename public aliases**

Modify `tsconfig.base.json` expenses paths:

```json
"@wisave/expenses/plugins/accounts": ["./libs/expenses/plugins/accounts/src/index.ts"],
"@wisave/expenses/plugins/budget": ["./libs/expenses/plugins/budget/src/index.ts"],
"@wisave/expenses/data-access": ["./libs/expenses/data-access/src/index.ts"],
"@wisave/expenses/plugins/list": ["./libs/expenses/plugins/list/src/index.ts"],
"@wisave/expenses/shell": ["./libs/expenses/shell/src/index.ts"]
```

Remove:

```json
"@wisave/expenses/feature-accounts"
"@wisave/expenses/feature-budget"
"@wisave/expenses/feature-list"
```

- [ ] **Step 6: Update shell dependencies and imports**

Modify `libs/expenses/shell/project.json`:

```json
"implicitDependencies": [
  "expenses-list",
  "expenses-budget",
  "expenses-accounts"
]
```

Modify `libs/expenses/shell/src/lib/expenses.routes.ts` imports:

```typescript
{ path: 'list', loadChildren: () => import('@wisave/expenses/plugins/list').then((m) => m.routes) },
{ path: 'budget', loadChildren: () => import('@wisave/expenses/plugins/budget').then((m) => m.budgetRoutes) },
{ path: 'accounts', loadChildren: () => import('@wisave/expenses/plugins/accounts').then((m) => m.routes) },
{ path: 'insights', loadChildren: () => import('@wisave/expenses/plugins/budget').then((m) => m.insightsRoutes) },
```

Modify `libs/expenses/shell/src/lib/expenses.routes.spec.ts` imports:

```typescript
import { routes as accountRoutes } from '@wisave/expenses/plugins/accounts';
import { budgetRoutes, insightsRoutes } from '@wisave/expenses/plugins/budget';
import { routes as listRoutes } from '@wisave/expenses/plugins/list';
```

- [ ] **Step 7: Replace remaining old expenses aliases**

Run:

```bash
rg -n "@wisave/expenses/feature-|expenses-feature-|libs/expenses/feature-" apps libs tsconfig.base.json eslint.config.mjs README.md AGENTS.md CLAUDE.md docs
```

Expected: matches only in historical `docs/superpowers/*` archives, or no matches if those paths are excluded.

- [ ] **Step 8: Verify renamed projects**

Run:

```bash
NX_DAEMON=false yarn nx show projects
yarn nx test expenses-shell --skip-nx-cache
yarn nx test expenses-accounts --skip-nx-cache
yarn nx lint expenses-shell --skip-nx-cache
yarn nx lint expenses-list --skip-nx-cache
yarn nx lint expenses-budget --skip-nx-cache
yarn nx lint expenses-accounts --skip-nx-cache
```

Expected projects include:

```text
expenses-shell
expenses-list
expenses-budget
expenses-accounts
expenses-data-access
```

Expected old project names are absent:

```text
expenses-feature-list
expenses-feature-budget
expenses-feature-accounts
```

- [ ] **Step 9: Commit plugin-style rename**

```bash
git add libs/expenses tsconfig.base.json
git commit -m "refactor: rename expenses feature slices"
```

---

### Task 4: Enforce App-To-Shell Boundary For Expenses

**Files:**

- Modify: `eslint.config.mjs`
- Modify: `apps/wisave-ui/project.json`

- [ ] **Step 1: Add app-level restricted imports for expenses plugin aliases**

Add a flat-config block after the base TypeScript config in `eslint.config.mjs`:

```typescript
{
  files: ['apps/wisave-ui/**/*.ts'],
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'rxjs',
            importNames: ['BehaviorSubject'],
            message: 'Avoid BehaviorSubject for state; prefer Signal Store or signals.',
          },
        ],
        patterns: [
          {
            group: ['@wisave/expenses/plugins/list', '@wisave/expenses/plugins/budget', '@wisave/expenses/plugins/accounts'],
            message: 'The app must import @wisave/expenses/shell instead of individual expenses plugin slices.',
          },
        ],
      },
    ],
  },
},
```

This keeps the pilot enforceable while `type:app` still temporarily allows `type:feature` for other domains.

- [ ] **Step 2: Confirm app implicit dependency is shell-only for expenses**

Confirm `apps/wisave-ui/project.json` contains:

```json
"implicitDependencies": [
  "auth-feature",
  "incomes-feature",
  "stock-feature",
  "expenses-shell",
  "settings-feature"
]
```

- [ ] **Step 3: Verify lint catches direct app imports**

Temporarily add this import to `apps/wisave-ui/src/app/app.routes.ts`:

```typescript
import '@wisave/expenses/plugins/list';
```

Run:

```bash
yarn nx lint wisave-ui --skip-nx-cache
```

Expected: FAIL with the restricted import message.

Remove the temporary import.

Run:

```bash
yarn nx lint wisave-ui --skip-nx-cache
```

Expected: PASS.

- [ ] **Step 4: Commit boundary enforcement**

```bash
git add eslint.config.mjs apps/wisave-ui/project.json
git commit -m "chore: enforce expenses app shell boundary"
```

---

### Task 5: Update Documentation For Shell/Plugin Topology

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/features/expenses.md`

- [ ] **Step 1: Update active architecture docs**

Document this rule in `AGENTS.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md`:

````markdown
### Domain Shell Libraries

Domains with multiple routed slices expose a shell library as the app-facing entry point.
The app imports the shell only. The shell composes same-domain feature/plugin slices.

Example:

```text
apps/wisave-ui -> @wisave/expenses/shell
@wisave/expenses/shell -> @wisave/expenses/plugins/list
@wisave/expenses/shell -> @wisave/expenses/plugins/budget
@wisave/expenses/shell -> @wisave/expenses/plugins/accounts
```
````

Feature/plugin slices must not import sibling slices. Shared state/contracts belong in `libs/shared/*`, `libs/platform/*`, or the domain data-access library when domain-specific.

````

- [ ] **Step 2: Update alias tables**

Replace old expenses aliases in docs:

```text
@wisave/expenses/feature-list
@wisave/expenses/feature-budget
@wisave/expenses/feature-accounts
````

with:

```text
@wisave/expenses/shell
@wisave/expenses/plugins/list
@wisave/expenses/plugins/budget
@wisave/expenses/plugins/accounts
```

- [ ] **Step 3: Update expenses feature doc**

In `docs/features/expenses.md`, describe the active structure:

```markdown
## Nx Libraries

- `libs/expenses/shell` owns the `/expenses` shell component and child route composition.
- `libs/expenses/plugins/list` owns transaction list views, transaction editing routes, and list store.
- `libs/expenses/plugins/budget` owns budget and insights views/stores.
- `libs/expenses/plugins/accounts` owns funding account views, dialogs, account store, and account tests.
- `libs/expenses/data-access` owns expenses, budget, and account API services/mappers.
```

- [ ] **Step 4: Verify active docs do not reference old expenses feature aliases**

Run:

```bash
rg -n "@wisave/expenses/feature-|expenses-feature-|libs/expenses/feature-" README.md AGENTS.md CLAUDE.md docs/ARCHITECTURE.md docs/features
```

Expected: no matches.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md AGENTS.md CLAUDE.md docs/ARCHITECTURE.md docs/features/expenses.md
git commit -m "docs: document expenses shell topology"
```

---

### Task 6: Add Nx Boilerplate File Nesting For VS Code

**Files:**

- Create: `.vscode/settings.json`
- Modify: `README.md`

- [ ] **Step 1: Add workspace file nesting**

Create `.vscode/settings.json`:

```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js",
    "*.js": "${capture}.js.map, ${capture}.min.js, ${capture}.d.ts",
    "*.jsx": "${capture}.js",
    "*.tsx": "${capture}.ts",
    "package.json": "yarn.lock",
    "project.json": "*.md, *.ts, *.json, *.js",
    "tsconfig.json": "tsconfig.*.json"
  }
}
```

- [ ] **Step 2: Document WebStorm manual setup**

Add this short note to `README.md`:

````markdown
### IDE File Nesting

The workspace includes VS Code file nesting to collapse Nx boilerplate under `project.json`.
For WebStorm, configure file nesting manually with `project.json` as the parent suffix and:

```text
README.md; eslint.config.js; eslint.config.mjs; jest.config.ts; package.json; tsconfig.json; tsconfig.lib.json; tsconfig.spec.json; vite.config.ts
```
````

````

- [ ] **Step 3: Commit IDE nesting**

```bash
git add .vscode/settings.json README.md
git commit -m "chore: add Nx file nesting settings"
````

---

### Task 7: Final Graph, Affected, Build, Test, And Lint Verification

**Files:**

- No source edits.

- [ ] **Step 1: Verify project list**

Run:

```bash
NX_DAEMON=false yarn nx show projects
```

Expected expenses projects:

```text
expenses-shell
expenses-list
expenses-budget
expenses-accounts
expenses-data-access
```

- [ ] **Step 2: Verify graph edges**

Run:

```bash
NX_DAEMON=false yarn nx graph --print | node -e '
let s = "";
process.stdin.on("data", c => s += c);
process.stdin.on("end", () => {
  const g = JSON.parse(s);
  const deps = g.graph?.dependencies ?? g.dependencies ?? {};
  for (const source of Object.keys(deps).sort()) {
    if (source === "wisave-ui" || source.startsWith("expenses-")) {
      console.log(`${source}: ${deps[source].map(d => `${d.target}(${d.type})`).sort().join(", ") || "none"}`);
    }
  }
});
'
```

Expected shape:

```text
wisave-ui: expenses-shell(...)
expenses-shell: expenses-accounts(...), expenses-budget(...), expenses-list(...)
expenses-list: expenses-data-access(...), platform-signalr(...), shared-model(...), shared-ui(...)
expenses-budget: expenses-data-access(...), platform-config(...), platform-signalr(...), shared-model(...), shared-ui(...)
expenses-accounts: expenses-data-access(...), platform-signalr(...), shared-model(...), shared-ui(...)
expenses-data-access: platform-config(...), shared-model(...)
```

The exact dependency type can be `static`, `dynamic`, or `implicit`; the important behavior is dependency direction.

- [ ] **Step 3: Verify affected behavior**

Run:

```bash
printf 'EXPENSES_LIST\n'
NX_DAEMON=false yarn nx show projects --affected --files=libs/expenses/plugins/list/src/lib/expenses.routes.ts

printf '\nEXPENSES_BUDGET\n'
NX_DAEMON=false yarn nx show projects --affected --files=libs/expenses/plugins/budget/src/lib/expense-budget.routes.ts

printf '\nEXPENSES_ACCOUNTS\n'
NX_DAEMON=false yarn nx show projects --affected --files=libs/expenses/plugins/accounts/src/lib/expense-accounts.routes.ts

printf '\nEXPENSES_DATA_ACCESS\n'
NX_DAEMON=false yarn nx show projects --affected --files=libs/expenses/data-access/src/lib/expenses/expenses-api.service.ts
```

Expected:

```text
EXPENSES_LIST includes expenses-list, expenses-shell, wisave-ui
EXPENSES_BUDGET includes expenses-budget, expenses-shell, wisave-ui
EXPENSES_ACCOUNTS includes expenses-accounts, expenses-shell, wisave-ui
EXPENSES_DATA_ACCESS includes expenses-data-access plus dependent expenses slices, expenses-shell, wisave-ui
```

- [ ] **Step 4: Run full quality gates**

Run:

```bash
yarn lint --skip-nx-cache
yarn test --skip-nx-cache
yarn build --skip-nx-cache
```

Expected: all pass.

- [ ] **Step 5: Verify stale references**

Run:

```bash
rg -n "@wisave/expenses/feature-|expenses-feature-|libs/expenses/feature-|src/app/features/expenses" apps libs tsconfig.base.json eslint.config.mjs package.json README.md AGENTS.md CLAUDE.md docs/ARCHITECTURE.md docs/features || true
```

Expected: no output.

- [ ] **Step 6: Verify clean worktree**

Run:

```bash
git status --short
```

Expected: no output.

If generated `dist`, `coverage`, or `.nx` files appear, remove generated output only:

```bash
rm -rf dist coverage .nx/cache
git status --short
```

Expected: no output.

---

## Follow-Up After Pilot

Only after the expenses pilot is merged and feels better in the graph:

1. Consider `stock/shell` if stock grows beyond portfolio into research, watchlists, and opportunities.
2. Consider `incomes/shell` only if incomes gets multiple independently routed slices.
3. Keep `auth` and `settings` as app-facing feature libraries until they show real subfeature complexity.
4. Once all app-facing domains have shell libraries, remove `type:feature` from the `type:app` allowed dependencies.
