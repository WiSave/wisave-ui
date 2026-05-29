# Full Nx Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert WiSave UI from a single Angular CLI workspace into a full integrated Nx workspace, remove the experimental Angular unit-test builder, and replace the custom `eslint-plugin-boundaries` setup with Nx project boundaries.

**Architecture:** The final workspace uses `apps/wisave-ui` as the only deployable Angular application and Nx libraries for shell, core, shared UI, data access, and each domain feature. The migration is staged so the app keeps building after the tooling move, then code is extracted into libraries in dependency order. Runtime deployment remains the same: Docker builds the Angular browser bundle and NGINX serves `/env.js` plus same-origin `/api`.

**Tech Stack:** Angular 21, Nx 22.x, Yarn 4, TypeScript 5.9, PrimeNG 21, Tailwind CSS 4, NgRx Signal Store, Vitest through Nx/Analog, ESLint flat config with `@nx/enforce-module-boundaries`.

---

## Scope And Decisions

This is a full Nx migration, not the lighter `nx init` adoption path.

Target decisions:

- Use a plain branch name: `feature/full-nx-migration`.
- Move app source from `src/` to `apps/wisave-ui/src/`.
- Move static app assets from `public/` to `apps/wisave-ui/public/`.
- Replace `ng` package scripts with `nx` package scripts.
- Remove `@angular/build:unit-test` from project configuration.
- Use Nx-managed Vitest with Angular support instead of Angular's experimental `unit-test` builder.
- Remove `eslint-plugin-boundaries` and `eslint-import-resolver-local-ts.cjs`.
- Add Nx project tags and enforce boundaries through `@nx/enforce-module-boundaries`.
- Keep `@angular/build:application` if Nx generation keeps it for Angular 21. It is the stable application builder and is not the experimental feature targeted by this migration.

Out of scope:

- No backend or gateway changes.
- No SSR, module federation, or Nx Cloud.
- No visual redesign.
- No route behavior changes.
- No API contract changes.

## Target File Structure

```text
wisave-ui/
  apps/
    wisave-ui/
      project.json
      src/
        app/
          app.config.ts
          app.routes.ts
          app.ts
        main.ts
        index.html
        styles.css
        styles/
        theme.ts
        types/window.d.ts
        test-setup.ts
      public/
        env.js
        favicon.ico
        logo2.png
      tsconfig.app.json
      tsconfig.spec.json
      vite.config.ts
  libs/
    shell/
      src/
    core/
      model/
        src/
      config/
        src/
      auth/
        src/
      signalr/
        src/
    shared/
      ui/
        src/
    data-access/
      expenses/
        src/
      expense-accounts/
        src/
      expense-budget/
        src/
      incomes/
        src/
      settings/
        src/
      stock/
        src/
    features/
      auth/
        src/
      incomes/
        src/
      expenses/
        src/
      expense-accounts/
        src/
      expense-budget/
        src/
      settings/
        src/
      stock/
        src/
  nx.json
  tsconfig.base.json
  eslint.config.mjs
  package.json
```

Library responsibility map:

- `libs/core/model`: `Currency`, `IMoney`, expense/account/budget/auth command model types, branded IDs, shared pagination and error model types.
- `libs/core/config`: runtime API config and chart color config.
- `libs/core/auth`: auth service, auth guards, permission service, auth interceptor, session unavailable view.
- `libs/core/signalr`: portal SignalR transport, expenses domain SignalR adapter, envelope/connection types, command failure notification service.
- `libs/shared/ui`: reusable presentational components, generic helpers, pipes, and app dialog/date/pagination/status/stat/chart UI.
- `libs/shell`: main layout, auth layout, sidebar, sidebar constants/types.
- `libs/data-access/*`: HTTP services and mappers that call `/api`.
- `libs/features/*`: routable feature libraries containing feature routes, views, components, stores, constants, helpers, and feature-only types.

## Task 1: Create A Safe Migration Branch And Baseline

**Files:**

- Inspect: `package.json`
- Inspect: `yarn.lock`
- Inspect: `angular.json`
- No source changes in this task.

- [ ] **Step 1: Check dirty state**

Run:

```bash
git status --short
git diff -- package.json yarn.lock
```

Expected before continuing: either a clean tree or only the existing Angular dependency bump in `package.json` and `yarn.lock`.

- [ ] **Step 2: If dependency bumps are still dirty, commit them separately**

Run only when `package.json` and `yarn.lock` still contain the existing Angular/NgRx/angular-eslint version bump:

```bash
git add package.json yarn.lock
git commit -m "chore: update Angular dependencies"
```

Expected: a standalone dependency update commit. Do not mix this with Nx migration changes.

- [ ] **Step 3: Create the migration branch**

Run:

```bash
git switch -c feature/full-nx-migration
```

Expected: current branch is `feature/full-nx-migration`.

- [ ] **Step 4: Install with the current lockfile**

Run:

```bash
corepack enable
yarn install --immutable
```

Expected: install succeeds without changing `yarn.lock`.

- [ ] **Step 5: Capture baseline Angular behavior**

Run:

```bash
yarn build
yarn lint
yarn test --watch=false
```

Expected:

- `yarn build` writes `dist/WiSaveUI/browser`.
- `yarn lint` passes or reports only pre-existing lint issues.
- `yarn test --watch=false` passes or reports only pre-existing test issues.

- [ ] **Step 6: Commit the verified baseline if Step 2 created no commit**

Run only when Step 2 did not create a commit and the tree is clean:

```bash
git status --short
```

Expected: no output. No commit is needed.

## Task 2: Initialize Nx Integrated Workspace Tooling

**Files:**

- Create: `nx.json`
- Create/modify: `.nx/` metadata if generated
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify or delete later: `angular.json`
- Create later: `apps/wisave-ui/project.json`

- [ ] **Step 1: Run Nx integrated initialization**

Run:

```bash
yarn dlx nx@latest init --integrated --interactive=false --nxCloud=false
```

Expected: Nx adds `nx`, `@nx/workspace`, detected Angular plugin support, and base workspace config.

If the installed Nx CLI rejects `--integrated`, use this command and continue with the manual app move in Task 3:

```bash
yarn dlx nx@latest init --interactive=false --nxCloud=false --plugins=@nx/angular,@nx/eslint,@nx/vite --cacheable=build,test,lint
```

- [ ] **Step 2: Install explicit Nx Angular, ESLint, and Vitest support**

Run:

```bash
yarn add -D nx @nx/angular @nx/workspace @nx/eslint @nx/eslint-plugin @nx/vite @nx/vitest @nx/js @analogjs/vite-plugin-angular @analogjs/vitest-angular vite
```

Expected: `package.json` includes Nx packages at the same major version and Angular Vitest support packages.

- [ ] **Step 3: Confirm Nx sees the original Angular project**

Run:

```bash
yarn nx show projects
yarn nx report
```

Expected: `WiSaveUI` or `wisave-ui` appears as a project. `nx report` shows Nx 22.x and Angular 21.x.

- [ ] **Step 4: Commit Nx tooling initialization**

Run:

```bash
git add package.json yarn.lock nx.json angular.json .gitignore
git commit -m "chore: initialize Nx workspace"
```

Expected: one commit containing only Nx tooling/config initialization, not source moves.

## Task 3: Move The Angular App Into `apps/wisave-ui`

**Files:**

- Move: `src/**` -> `apps/wisave-ui/src/**`
- Move: `public/**` -> `apps/wisave-ui/public/**`
- Create: `apps/wisave-ui/project.json`
- Move/modify: `tsconfig.app.json` -> `apps/wisave-ui/tsconfig.app.json`
- Move/modify: `tsconfig.spec.json` -> `apps/wisave-ui/tsconfig.spec.json`
- Modify: `tsconfig.json`
- Create/modify: `tsconfig.base.json`
- Modify/delete: `angular.json`
- Modify: `package.json`
- Modify: `Dockerfile`

- [ ] **Step 1: Create app directories**

Run:

```bash
mkdir -p apps/wisave-ui
git mv src apps/wisave-ui/src
git mv public apps/wisave-ui/public
git mv tsconfig.app.json apps/wisave-ui/tsconfig.app.json
git mv tsconfig.spec.json apps/wisave-ui/tsconfig.spec.json
```

Expected: app code lives under `apps/wisave-ui`.

- [ ] **Step 2: Create `apps/wisave-ui/project.json`**

Create `apps/wisave-ui/project.json` with:

```json
{
  "name": "wisave-ui",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/wisave-ui/src",
  "prefix": "app",
  "tags": ["scope:app", "type:app"],
  "targets": {
    "build": {
      "executor": "@angular/build:application",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/wisave-ui",
        "browser": "apps/wisave-ui/src/main.ts",
        "tsConfig": "apps/wisave-ui/tsconfig.app.json",
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/wisave-ui/public"
          }
        ],
        "styles": ["apps/wisave-ui/src/styles.css"]
      },
      "configurations": {
        "production": {
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "4mb",
              "maximumError": "5mb"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "4kB",
              "maximumError": "8kB"
            }
          ],
          "outputHashing": "all"
        },
        "development": {
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular/build:dev-server",
      "configurations": {
        "production": {
          "buildTarget": "wisave-ui:build:production"
        },
        "development": {
          "buildTarget": "wisave-ui:build:development",
          "proxyConfig": "proxy.conf.json"
        }
      },
      "defaultConfiguration": "development"
    }
  }
}
```

- [ ] **Step 3: Update root TypeScript config**

Create `tsconfig.base.json` with the root compiler options and update paths to app and future libraries:

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "paths": {
      "@core/*": ["./apps/wisave-ui/src/app/core/*"],
      "@features/*": ["./apps/wisave-ui/src/app/features/*"],
      "@layout/*": ["./apps/wisave-ui/src/app/layout/*"],
      "@shared/*": ["./apps/wisave-ui/src/app/shared/*"],
      "@services/*": ["./apps/wisave-ui/src/app/core/services/*"],
      "@types/*": ["./apps/wisave-ui/src/app/core/types/*"],
      "@testing/*": ["./apps/wisave-ui/src/app/testing/*"],
      "@views/*": ["./apps/wisave-ui/src/app/views/*"]
    },
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2024",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

Update `tsconfig.json` to:

```json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    {
      "path": "./apps/wisave-ui/tsconfig.app.json"
    },
    {
      "path": "./apps/wisave-ui/tsconfig.spec.json"
    }
  ]
}
```

- [ ] **Step 4: Update app tsconfigs**

Set `apps/wisave-ui/tsconfig.app.json` to:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/apps/wisave-ui/app",
    "rootDir": "./src",
    "types": []
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

Set `apps/wisave-ui/tsconfig.spec.json` to:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/apps/wisave-ui/spec",
    "rootDir": "./src",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts", "src/test-setup.ts"]
}
```

- [ ] **Step 5: Update package scripts**

Modify `package.json` scripts to:

```json
{
  "ng": "nx",
  "start": "nx serve wisave-ui",
  "build": "nx build wisave-ui",
  "watch": "nx build wisave-ui --watch --configuration development",
  "test": "nx test wisave-ui",
  "format": "prettier --write \"apps/**/*.{ts,html,scss,css,json}\" \"libs/**/*.{ts,html,scss,css,json}\"",
  "format:check": "prettier --check \"apps/**/*.{ts,html,scss,css,json}\" \"libs/**/*.{ts,html,scss,css,json}\"",
  "lint": "nx lint wisave-ui",
  "lint:fix": "nx lint wisave-ui --fix",
  "eslint": "eslint apps/**/*.ts apps/**/*.html libs/**/*.ts libs/**/*.html",
  "eslint:fix": "eslint apps/**/*.ts apps/**/*.html libs/**/*.ts libs/**/*.html --fix"
}
```

- [ ] **Step 6: Update Docker output path**

Modify `Dockerfile` build copy line from:

```dockerfile
COPY --from=build /app/dist/WiSaveUI/browser ./
```

to:

```dockerfile
COPY --from=build /app/dist/apps/wisave-ui/browser ./
```

- [ ] **Step 7: Verify app still builds from Nx location**

Run:

```bash
yarn nx build wisave-ui
```

Expected: output exists at `dist/apps/wisave-ui/browser/index.html`.

- [ ] **Step 8: Commit the app move**

Run:

```bash
git add apps tsconfig.json tsconfig.base.json package.json Dockerfile angular.json
git commit -m "refactor: move Angular app into Nx apps layout"
```

Expected: one commit containing app relocation and build-path updates.

## Task 4: Replace Experimental Angular Unit Test Builder

**Files:**

- Modify: `apps/wisave-ui/project.json`
- Create: `apps/wisave-ui/vite.config.ts`
- Create: `apps/wisave-ui/src/test-setup.ts`
- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Add Nx Vitest test target**

Add this `test` target to `apps/wisave-ui/project.json`:

```json
{
  "test": {
    "executor": "@nx/vitest:vitest",
    "outputs": ["{options.reportsDirectory}"],
    "options": {
      "config": "apps/wisave-ui/vite.config.ts",
      "reportsDirectory": "coverage/apps/wisave-ui"
    }
  }
}
```

Keep it inside the existing `targets` object beside `build` and `serve`.

- [ ] **Step 2: Create Angular Vitest config**

Create `apps/wisave-ui/vite.config.ts`:

```typescript
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: projectRoot,
  cacheDir: join(projectRoot, '../../node_modules/.vite/apps/wisave-ui'),
  plugins: [angular(), nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/wisave-ui',
    },
  },
});
```

- [ ] **Step 3: Create Angular testing setup**

Create `apps/wisave-ui/src/test-setup.ts`:

```typescript
import '@analogjs/vitest-angular/setup-zone';

import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
```

- [ ] **Step 4: Remove the old Angular test builder**

Remove this old target if it still exists in `angular.json` or `apps/wisave-ui/project.json`:

```json
{
  "test": {
    "builder": "@angular/build:unit-test"
  }
}
```

- [ ] **Step 5: Run the app tests through Nx**

Run:

```bash
yarn nx test wisave-ui --run
```

Expected: all existing `*.spec.ts` files run under Vitest. Existing `vi.fn()` usage continues to work.

- [ ] **Step 6: Commit the stable test runner migration**

Run:

```bash
git add apps/wisave-ui/project.json apps/wisave-ui/vite.config.ts apps/wisave-ui/src/test-setup.ts package.json yarn.lock
git commit -m "test: replace Angular unit-test builder with Nx Vitest"
```

Expected: no `@angular/build:unit-test` target remains.

## Task 5: Replace Custom ESLint Boundaries With Nx Boundaries

**Files:**

- Modify: `eslint.config.mjs`
- Delete: `eslint-import-resolver-local-ts.cjs`
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `nx.json`

- [ ] **Step 1: Remove custom boundaries dependencies**

Run:

```bash
yarn remove eslint-plugin-boundaries
git rm eslint-import-resolver-local-ts.cjs
```

Expected: `eslint-plugin-boundaries` is removed from `package.json`; the local resolver file is deleted.

- [ ] **Step 2: Replace boundaries plugin imports in ESLint config**

In `eslint.config.mjs`, remove these imports:

```javascript
import boundariesPlugin from 'eslint-plugin-boundaries';
```

Add:

```javascript
import nxPlugin from '@nx/eslint-plugin';
```

- [ ] **Step 3: Replace plugin registration**

In the TypeScript config block, replace:

```javascript
boundaries: boundariesPlugin,
```

with:

```javascript
'@nx': nxPlugin,
```

- [ ] **Step 4: Remove custom resolver and boundary settings**

Delete these `settings` entries from `eslint.config.mjs`:

```javascript
'import/resolver': {
  './eslint-import-resolver-local-ts.cjs': {
    project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.spec.json'],
  },
  node: {
    extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.d.ts', '.json'],
  },
},
'boundaries/dependency-nodes': ['import', 'dynamic-import', 'export'],
'boundaries/elements': [
  // all existing custom boundary element definitions
],
'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts'],
```

Do not remove non-boundary ESLint rules.

- [ ] **Step 5: Remove custom boundaries rules**

Delete these rules from `eslint.config.mjs`:

```javascript
'boundaries/element-types': [
  'error',
  {
    default: 'disallow',
    rules: [
      // all existing custom layer rules
    ],
  },
],
'boundaries/no-unknown': 'error',
'boundaries/no-unknown-files': ['error'],
```

- [ ] **Step 6: Add Nx module boundary rule**

Add this rule to the TypeScript rules block in `eslint.config.mjs`:

```javascript
'@nx/enforce-module-boundaries': [
  'error',
  {
    enforceBuildableLibDependency: true,
    allow: [],
    depConstraints: [
      {
        sourceTag: 'type:app',
        onlyDependOnLibsWithTags: ['type:shell', 'type:feature', 'type:ui', 'type:data-access', 'type:util', 'type:model'],
      },
      {
        sourceTag: 'type:shell',
        onlyDependOnLibsWithTags: ['type:ui', 'type:auth', 'type:util', 'type:model'],
      },
      {
        sourceTag: 'type:feature',
        onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:auth', 'type:signalr', 'type:util', 'type:model'],
      },
      {
        sourceTag: 'type:data-access',
        onlyDependOnLibsWithTags: ['type:auth', 'type:signalr', 'type:util', 'type:model'],
      },
      {
        sourceTag: 'type:auth',
        onlyDependOnLibsWithTags: ['type:util', 'type:model'],
      },
      {
        sourceTag: 'type:signalr',
        onlyDependOnLibsWithTags: ['type:auth', 'type:util', 'type:model'],
      },
      {
        sourceTag: 'type:ui',
        onlyDependOnLibsWithTags: ['type:util', 'type:model'],
      },
      {
        sourceTag: 'type:util',
        onlyDependOnLibsWithTags: ['type:model'],
      },
      {
        sourceTag: 'type:model',
        onlyDependOnLibsWithTags: ['type:model'],
      }
    ],
  },
],
```

- [ ] **Step 7: Verify lint still runs before library extraction**

Run:

```bash
yarn eslint apps/wisave-ui/src/**/*.ts apps/wisave-ui/src/**/*.html
```

Expected: ESLint runs. The Nx boundary rule does not provide meaningful boundaries yet because feature code is still inside the app project.

- [ ] **Step 8: Commit ESLint boundary replacement**

Run:

```bash
git add eslint.config.mjs package.json yarn.lock
git commit -m "chore: replace custom ESLint boundaries with Nx boundaries"
```

Expected: custom `eslint-plugin-boundaries` setup is gone; Nx boundary rule is present.

## Task 6: Generate Foundational Nx Libraries

**Files:**

- Create: `libs/core/model/**`
- Create: `libs/core/config/**`
- Create: `libs/core/auth/**`
- Create: `libs/core/signalr/**`
- Create: `libs/shared/ui/**`
- Create: `libs/shell/**`
- Modify: `tsconfig.base.json`
- Modify: `nx.json`

- [ ] **Step 1: Generate model and utility libraries**

Run:

```bash
yarn nx g @nx/js:library libs/core/model --name=model --importPath=@wisave/core/model --unitTestRunner=vitest --tags=scope:core,type:model
yarn nx g @nx/js:library libs/core/config --name=config --importPath=@wisave/core/config --unitTestRunner=vitest --tags=scope:core,type:util
```

Expected: `core-model` and `core-config` projects exist.

- [ ] **Step 2: Generate Angular service and UI libraries**

Run:

```bash
yarn nx g @nx/angular:library libs/core/auth --name=auth --importPath=@wisave/core/auth --unitTestRunner=vitest-analog --tags=scope:core,type:auth
yarn nx g @nx/angular:library libs/core/signalr --name=signalr --importPath=@wisave/core/signalr --unitTestRunner=vitest-analog --tags=scope:core,type:signalr
yarn nx g @nx/angular:library libs/shared/ui --name=ui --importPath=@wisave/shared/ui --unitTestRunner=vitest-analog --tags=scope:shared,type:ui
yarn nx g @nx/angular:library libs/shell --name=shell --importPath=@wisave/shell --unitTestRunner=vitest-analog --tags=scope:shell,type:shell
```

Expected: Angular libraries exist with project tags.

- [ ] **Step 3: Remove generated placeholder files**

Run:

```bash
find libs -path '*/src/lib/*.component.*' -delete
find libs -path '*/src/lib/*.spec.ts' -delete
find libs -path '*/src/lib/*.css' -delete
```

Expected: generated placeholder components are removed. Existing app code will be moved into these libraries in later tasks.

- [ ] **Step 4: Commit foundational library scaffolding**

Run:

```bash
git add libs tsconfig.base.json nx.json package.json yarn.lock
git commit -m "chore: scaffold Nx core and shared libraries"
```

Expected: libraries exist but app behavior is unchanged.

## Task 7: Extract Core Model, Config, Auth, SignalR, Shared UI, And Shell

**Files:**

- Move from: `apps/wisave-ui/src/app/core/types/**`
- Move from: `apps/wisave-ui/src/app/core/config/**`
- Move from: `apps/wisave-ui/src/app/core/services/auth/**`
- Move from: `apps/wisave-ui/src/app/core/guards/**`
- Move from: `apps/wisave-ui/src/app/core/interceptors/**`
- Move from: `apps/wisave-ui/src/app/core/views/session-unavailable.component.ts`
- Move from: `apps/wisave-ui/src/app/core/signalr/**`
- Move from: `apps/wisave-ui/src/app/shared/**`
- Move from: `apps/wisave-ui/src/app/layout/**`
- Modify imports under: `apps/wisave-ui/src/**`
- Modify imports under: `libs/**`

- [ ] **Step 1: Move core model files**

Run:

```bash
mkdir -p libs/core/model/src/lib
git mv apps/wisave-ui/src/app/core/types libs/core/model/src/lib/core-types
git mv apps/wisave-ui/src/app/shared/types libs/core/model/src/lib/shared-types
```

Set `libs/core/model/src/index.ts` to:

```typescript
export * from './lib/core-types';
export * from './lib/shared-types';
```

- [ ] **Step 2: Move runtime and chart config**

Run:

```bash
mkdir -p libs/core/config/src/lib
git mv apps/wisave-ui/src/app/core/config libs/core/config/src/lib/config
```

Set `libs/core/config/src/index.ts` to:

```typescript
export * from './lib/config/runtime-config';
export * from './lib/config/chart-colors.config';
```

- [ ] **Step 3: Move auth code**

Run:

```bash
mkdir -p libs/core/auth/src/lib
git mv apps/wisave-ui/src/app/core/services/auth libs/core/auth/src/lib/services
git mv apps/wisave-ui/src/app/core/guards libs/core/auth/src/lib/guards
git mv apps/wisave-ui/src/app/core/interceptors libs/core/auth/src/lib/interceptors
git mv apps/wisave-ui/src/app/core/views libs/core/auth/src/lib/views
```

Set `libs/core/auth/src/index.ts` to:

```typescript
export * from './lib/services/auth.service';
export * from './lib/services/permission.service';
export * from './lib/guards/auth.guard';
export * from './lib/interceptors/auth.interceptor';
export * from './lib/views/session-unavailable.component';
```

- [ ] **Step 4: Move SignalR code**

Run:

```bash
mkdir -p libs/core/signalr/src/lib
git mv apps/wisave-ui/src/app/core/signalr libs/core/signalr/src/lib/signalr
```

Set `libs/core/signalr/src/index.ts` to:

```typescript
export * from './lib/signalr/command-failed-notifier.service';
export * from './lib/signalr/connection-status.types';
export * from './lib/signalr/expenses-signalr.service';
export * from './lib/signalr/expenses-signalr.types';
export * from './lib/signalr/portal-signalr.service';
export * from './lib/signalr/signalr-envelope.types';
```

- [ ] **Step 5: Move shared UI and helpers**

Run:

```bash
mkdir -p libs/shared/ui/src/lib
git mv apps/wisave-ui/src/app/shared/components libs/shared/ui/src/lib/components
git mv apps/wisave-ui/src/app/shared/helpers libs/shared/ui/src/lib/helpers
git mv apps/wisave-ui/src/app/shared/pipes libs/shared/ui/src/lib/pipes
```

Set `libs/shared/ui/src/index.ts` to:

```typescript
export * from './lib/components/button';
export * from './lib/components/chart-card';
export * from './lib/components/datepicker/button-bar-datepicker';
export * from './lib/components/dialog';
export * from './lib/components/pagination';
export * from './lib/components/segmented-toggle';
export * from './lib/components/stat-card';
export * from './lib/components/status-card';
export * from './lib/helpers/money.helper';
export * from './lib/helpers/store-error.helper';
export * from './lib/pipes/change-percent.pipe';
```

- [ ] **Step 6: Move app shell**

Run:

```bash
mkdir -p libs/shell/src/lib
git mv apps/wisave-ui/src/app/layout libs/shell/src/lib/layout
```

Set `libs/shell/src/index.ts` to:

```typescript
export * from './lib/layout/auth-layout.component';
export * from './lib/layout/main-layout.component';
export * from './lib/layout/sidebar';
export * from './lib/layout/constants/sidebar-navigation.constant';
export * from './lib/layout/types/sidebar-navigation.interface';
```

- [ ] **Step 7: Update imports to public Nx aliases**

Run these replacements and then manually fix any missed imports:

```bash
rg -l "@core/types|@types/" apps libs | xargs perl -0pi -e "s#\\@core/types/[A-Za-z0-9_./-]+#@wisave/core/model#g; s#\\@types/[A-Za-z0-9_./-]+#@wisave/core/model#g"
rg -l "@core/config" apps libs | xargs perl -0pi -e "s#\\@core/config/[A-Za-z0-9_./-]+#@wisave/core/config#g"
rg -l "@core/services/auth|@core/guards|@core/interceptors|@core/views" apps libs | xargs perl -0pi -e "s#\\@core/services/auth/[A-Za-z0-9_./-]+#@wisave/core/auth#g; s#\\@core/guards/[A-Za-z0-9_./-]+#@wisave/core/auth#g; s#\\@core/interceptors/[A-Za-z0-9_./-]+#@wisave/core/auth#g; s#\\@core/views/[A-Za-z0-9_./-]+#@wisave/core/auth#g"
rg -l "@core/signalr" apps libs | xargs perl -0pi -e "s#\\@core/signalr/[A-Za-z0-9_./-]+#@wisave/core/signalr#g"
rg -l "@shared/" apps libs | xargs perl -0pi -e "s#\\@shared/[A-Za-z0-9_./-]+#@wisave/shared/ui#g"
rg -l "@layout/" apps libs | xargs perl -0pi -e "s#\\@layout/[A-Za-z0-9_./-]+#@wisave/shell#g"
```

Expected after manual cleanup: no imports from `@core/*`, `@shared/*`, `@layout/*`, `@types/*`, or `@services/*` remain for moved code.

- [ ] **Step 8: Run lint and tests for extracted foundations**

Run:

```bash
yarn nx run-many -t lint,test --projects=core-model,core-config,core-auth,core-signalr,shared-ui,shell,wisave-ui
```

Expected: foundations and app pass lint/test.

- [ ] **Step 9: Commit foundational extraction**

Run:

```bash
git add apps libs tsconfig.base.json eslint.config.mjs package.json yarn.lock
git commit -m "refactor: extract core shared and shell Nx libraries"
```

Expected: app still builds, imports use Nx library entrypoints.

## Task 8: Extract Data Access Libraries

**Files:**

- Move from: `apps/wisave-ui/src/app/core/services/expenses/**`
- Move from: `apps/wisave-ui/src/app/core/services/expense-accounts/**`
- Move from: `apps/wisave-ui/src/app/core/services/expense-budget/**`
- Move from: `apps/wisave-ui/src/app/features/incomes/services/**`
- Move from: `apps/wisave-ui/src/app/features/settings/services/**`
- Move from: `apps/wisave-ui/src/app/features/stock/services/**`
- Create: `libs/data-access/*/src/index.ts`

- [ ] **Step 1: Generate data-access libraries**

Run:

```bash
yarn nx g @nx/angular:library libs/data-access/expenses --name=expenses-data-access --importPath=@wisave/data-access/expenses --unitTestRunner=vitest-analog --tags=scope:expenses,type:data-access
yarn nx g @nx/angular:library libs/data-access/expense-accounts --name=expense-accounts-data-access --importPath=@wisave/data-access/expense-accounts --unitTestRunner=vitest-analog --tags=scope:expense-accounts,type:data-access
yarn nx g @nx/angular:library libs/data-access/expense-budget --name=expense-budget-data-access --importPath=@wisave/data-access/expense-budget --unitTestRunner=vitest-analog --tags=scope:expense-budget,type:data-access
yarn nx g @nx/angular:library libs/data-access/incomes --name=incomes-data-access --importPath=@wisave/data-access/incomes --unitTestRunner=vitest-analog --tags=scope:incomes,type:data-access
yarn nx g @nx/angular:library libs/data-access/settings --name=settings-data-access --importPath=@wisave/data-access/settings --unitTestRunner=vitest-analog --tags=scope:settings,type:data-access
yarn nx g @nx/angular:library libs/data-access/stock --name=stock-data-access --importPath=@wisave/data-access/stock --unitTestRunner=vitest-analog --tags=scope:stock,type:data-access
```

- [ ] **Step 2: Move existing services into data-access libs**

Run:

```bash
git mv apps/wisave-ui/src/app/core/services/expenses libs/data-access/expenses/src/lib
git mv apps/wisave-ui/src/app/core/services/expense-accounts libs/data-access/expense-accounts/src/lib
git mv apps/wisave-ui/src/app/core/services/expense-budget libs/data-access/expense-budget/src/lib
git mv apps/wisave-ui/src/app/features/incomes/services libs/data-access/incomes/src/lib
git mv apps/wisave-ui/src/app/features/settings/services libs/data-access/settings/src/lib
git mv apps/wisave-ui/src/app/features/stock/services libs/data-access/stock/src/lib
```

- [ ] **Step 3: Create public exports**

Set each data-access `src/index.ts` to export its moved service and mapper files. For example, `libs/data-access/incomes/src/index.ts` must contain:

```typescript
export * from './lib/services/incomes-api.service';
export * from './lib/services/incomes-mapper.service';
```

Set `libs/data-access/stock/src/index.ts` to:

```typescript
export * from './lib/services/stock-portfolio.service';
```

- [ ] **Step 4: Update imports from old service paths**

Run:

```bash
rg -l "@core/services/expenses" apps libs | xargs perl -0pi -e "s#\\@core/services/expenses/[A-Za-z0-9_./-]+#@wisave/data-access/expenses#g"
rg -l "@core/services/expense-accounts" apps libs | xargs perl -0pi -e "s#\\@core/services/expense-accounts/[A-Za-z0-9_./-]+#@wisave/data-access/expense-accounts#g"
rg -l "@core/services/expense-budget" apps libs | xargs perl -0pi -e "s#\\@core/services/expense-budget/[A-Za-z0-9_./-]+#@wisave/data-access/expense-budget#g"
rg -l "@features/incomes/services" apps libs | xargs perl -0pi -e "s#\\@features/incomes/services/[A-Za-z0-9_./-]+#@wisave/data-access/incomes#g"
rg -l "@features/settings/services" apps libs | xargs perl -0pi -e "s#\\@features/settings/services/[A-Za-z0-9_./-]+#@wisave/data-access/settings#g"
rg -l "@features/stock/services" apps libs | xargs perl -0pi -e "s#\\@features/stock/services/[A-Za-z0-9_./-]+#@wisave/data-access/stock#g"
```

Expected: no imports from old service aliases remain.

- [ ] **Step 5: Verify data-access extraction**

Run:

```bash
yarn nx run-many -t lint,test --projects=expenses-data-access,expense-accounts-data-access,expense-budget-data-access,incomes-data-access,settings-data-access,stock-data-access,wisave-ui
```

Expected: data-access libs and app pass.

- [ ] **Step 6: Commit data-access extraction**

Run:

```bash
git add apps libs tsconfig.base.json package.json yarn.lock
git commit -m "refactor: extract data access Nx libraries"
```

Expected: HTTP/API services are no longer owned by app source or feature UI folders.

## Task 9: Extract Feature Libraries

**Files:**

- Move from: `apps/wisave-ui/src/app/features/auth/**`
- Move from: `apps/wisave-ui/src/app/features/incomes/**`
- Move from: `apps/wisave-ui/src/app/features/expenses/**`
- Move from: `apps/wisave-ui/src/app/features/expense-accounts/**`
- Move from: `apps/wisave-ui/src/app/features/expense-budget/**`
- Move from: `apps/wisave-ui/src/app/features/settings/**`
- Move from: `apps/wisave-ui/src/app/features/stock/**`
- Modify: `apps/wisave-ui/src/app/app.routes.ts`
- Delete: `apps/wisave-ui/src/app/features/features.routing.ts`

- [ ] **Step 1: Generate feature libraries**

Run:

```bash
yarn nx g @nx/angular:library libs/features/auth --name=feature-auth --importPath=@wisave/feature/auth --unitTestRunner=vitest-analog --tags=scope:auth,type:feature
yarn nx g @nx/angular:library libs/features/incomes --name=feature-incomes --importPath=@wisave/feature/incomes --unitTestRunner=vitest-analog --tags=scope:incomes,type:feature
yarn nx g @nx/angular:library libs/features/expenses --name=feature-expenses --importPath=@wisave/feature/expenses --unitTestRunner=vitest-analog --tags=scope:expenses,type:feature
yarn nx g @nx/angular:library libs/features/expense-accounts --name=feature-expense-accounts --importPath=@wisave/feature/expense-accounts --unitTestRunner=vitest-analog --tags=scope:expense-accounts,type:feature
yarn nx g @nx/angular:library libs/features/expense-budget --name=feature-expense-budget --importPath=@wisave/feature/expense-budget --unitTestRunner=vitest-analog --tags=scope:expense-budget,type:feature
yarn nx g @nx/angular:library libs/features/settings --name=feature-settings --importPath=@wisave/feature/settings --unitTestRunner=vitest-analog --tags=scope:settings,type:feature
yarn nx g @nx/angular:library libs/features/stock --name=feature-stock --importPath=@wisave/feature/stock --unitTestRunner=vitest-analog --tags=scope:stock,type:feature
```

- [ ] **Step 2: Move feature source**

Run:

```bash
git mv apps/wisave-ui/src/app/features/auth/* libs/features/auth/src/lib/
git mv apps/wisave-ui/src/app/features/incomes/* libs/features/incomes/src/lib/
git mv apps/wisave-ui/src/app/features/expenses/* libs/features/expenses/src/lib/
git mv apps/wisave-ui/src/app/features/expense-accounts/* libs/features/expense-accounts/src/lib/
git mv apps/wisave-ui/src/app/features/expense-budget/* libs/features/expense-budget/src/lib/
git mv apps/wisave-ui/src/app/features/settings/* libs/features/settings/src/lib/
git mv apps/wisave-ui/src/app/features/stock/* libs/features/stock/src/lib/
```

Expected: only `apps/wisave-ui/src/app/features/features.routing.ts` may remain before route rewrite.

- [ ] **Step 3: Export feature routes**

Set each feature library `src/index.ts` to export its route file. Example `libs/features/incomes/src/index.ts`:

```typescript
export * from './lib/incomes.routes';
```

Use the equivalent route file for each feature:

```typescript
export * from './lib/auth.routes';
export * from './lib/expenses.routes';
export * from './lib/expense-accounts.routes';
export * from './lib/expense-budget.routes';
export * from './lib/insights.routes';
export * from './lib/settings.routes';
export * from './lib/stock.routes';
```

For `expense-budget`, export both `expense-budget.routes` and `insights.routes`.

- [ ] **Step 4: Rewrite root routes to lazy-load feature libraries**

Update `apps/wisave-ui/src/app/app.routes.ts` to import only app-owned and library public entry points through dynamic imports:

```typescript
import { type Routes } from '@angular/router';

import { authGuard, guestGuard } from '@wisave/core/auth';

export const routes: Routes = [
  {
    path: 'session-unavailable',
    loadComponent: () => import('@wisave/core/auth').then((m) => m.SessionUnavailableComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('@wisave/shell').then((m) => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    loadChildren: () => import('@wisave/feature/auth').then((m) => m.routes),
  },
  {
    path: '',
    loadComponent: () => import('@wisave/shell').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'expenses', pathMatch: 'full' },
      { path: 'incomes', loadChildren: () => import('@wisave/feature/incomes').then((m) => m.routes) },
      { path: 'stock', loadChildren: () => import('@wisave/feature/stock').then((m) => m.routes) },
      {
        path: 'expenses',
        loadComponent: () => import('@wisave/feature/expenses').then((m) => m.ExpensesShellComponent),
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', loadChildren: () => import('@wisave/feature/expenses').then((m) => m.routes) },
          { path: 'budget', loadChildren: () => import('@wisave/feature/expense-budget').then((m) => m.routes) },
          { path: 'accounts', loadChildren: () => import('@wisave/feature/expense-accounts').then((m) => m.routes) },
          { path: 'insights', loadChildren: () => import('@wisave/feature/expense-budget').then((m) => m.insightsRoutes) },
        ],
      },
      { path: 'settings', loadChildren: () => import('@wisave/feature/settings').then((m) => m.routes) },
    ],
  },
];
```

Rename `routes` to `insightsRoutes` inside the moved `insights.routes.ts` to avoid exporting two `routes` constants from `@wisave/feature/expense-budget`.

- [ ] **Step 5: Delete old feature routing folder**

Run:

```bash
git rm apps/wisave-ui/src/app/features/features.routing.ts
rmdir apps/wisave-ui/src/app/features
```

Expected: app source no longer contains feature implementation folders.

- [ ] **Step 6: Replace remaining feature aliases**

Run:

```bash
rg -n "@features|@core|@shared|@layout|@services|@types" apps libs
```

Expected: no matches. If there are matches, replace them with `@wisave/*` public library imports or same-library relative imports.

- [ ] **Step 7: Verify feature extraction**

Run:

```bash
yarn nx run-many -t lint,test --all
yarn nx build wisave-ui
```

Expected: all projects pass lint/test; app builds.

- [ ] **Step 8: Commit feature extraction**

Run:

```bash
git add apps libs tsconfig.base.json package.json yarn.lock
git commit -m "refactor: extract feature Nx libraries"
```

Expected: all feature code is in Nx libraries.

## Task 10: Finalize Nx Workspace Configuration

**Files:**

- Modify: `nx.json`
- Modify: `.gitignore`
- Modify/delete: `angular.json`
- Modify: `package.json`
- Modify: `.prettierignore`

- [ ] **Step 1: Set Nx named inputs and target defaults**

Update `nx.json` to include:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/vite.config.ts", "!{projectRoot}/src/test-setup.ts"],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "^production"]
    }
  }
}
```

Preserve plugin entries that Nx generated.

- [ ] **Step 2: Remove Angular CLI workspace file if it is redundant**

Run:

```bash
yarn nx show projects
```

If all projects are discovered from `project.json` files and `angular.json` only duplicates old app config, delete it:

```bash
git rm angular.json
```

Expected: `yarn nx show projects` still lists all projects after deleting `angular.json`.

- [ ] **Step 3: Update `.gitignore`**

Add:

```gitignore
.nx/cache
.nx/workspace-data
```

- [ ] **Step 4: Update `.prettierignore`**

Remove `yarn.lock` from `.prettierignore` only if repository policy wants lockfile formatting checks. Otherwise keep it ignored.

Keep these ignores:

```gitignore
node_modules
coverage
.angular
dist
```

- [ ] **Step 5: Commit workspace finalization**

Run:

```bash
git add -A nx.json .gitignore .prettierignore package.json angular.json
git commit -m "chore: finalize Nx workspace configuration"
```

Expected: Nx project discovery and cache configuration are stable.

## Task 11: Update Documentation And Deployment References

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md` if it duplicates repo commands
- Modify: `docs/ARCHITECTURE.md` only if it mentions root `src/` or old build output
- Modify: `scripts/deploy-orbstack.sh` only if path assumptions appear

- [ ] **Step 1: Update common commands in README and AGENTS**

Replace Angular CLI command examples with:

```bash
yarn start
yarn build
yarn test
yarn lint
yarn nx graph
yarn nx affected -t lint,test,build
```

Document that app source is under `apps/wisave-ui/src` and reusable code is under `libs/`.

- [ ] **Step 2: Update migration-specific architecture guidance**

Add this note to the frontend architecture docs:

```markdown
Nx project boundaries are the source of truth for frontend library isolation. Use project tags and `@nx/enforce-module-boundaries` instead of `eslint-plugin-boundaries`.
```

- [ ] **Step 3: Verify deploy script still packages the whole workspace**

Run:

```bash
rg -n "src/|public/|dist/WiSaveUI|angular.json|ng " README.md AGENTS.md CLAUDE.md docs scripts Dockerfile docker-compose.yml
```

Expected: no stale references to root `src/`, root `public/`, `dist/WiSaveUI`, or `ng build` remain unless they describe historical context.

- [ ] **Step 4: Commit docs updates**

Run:

```bash
git add README.md AGENTS.md CLAUDE.md docs scripts Dockerfile docker-compose.yml
git commit -m "docs: document Nx workspace workflow"
```

Expected: commands and paths match the Nx workspace.

## Task 12: Full Verification

**Files:**

- No direct edits expected.

- [ ] **Step 1: Install from lockfile**

Run:

```bash
yarn install --immutable
```

Expected: no lockfile changes.

- [ ] **Step 2: Run full Nx verification**

Run:

```bash
yarn nx run-many -t lint,test,build --all
```

Expected: all projects pass.

- [ ] **Step 3: Verify project graph**

Run:

```bash
yarn nx graph --file=graph.html
```

Expected: `graph.html` is generated and shows `wisave-ui` depending on shell/core/feature libraries, with no feature-to-feature dependencies.

- [ ] **Step 4: Verify affected workflow**

Run:

```bash
yarn nx affected -t lint,test,build --base=main --head=HEAD
```

Expected: Nx computes affected projects and runs the requested targets.

- [ ] **Step 5: Verify Docker build**

Run:

```bash
docker build -t wisave-ui:nx-migration .
```

Expected: Docker build succeeds and copies `dist/apps/wisave-ui/browser` into NGINX.

- [ ] **Step 6: Verify local dev server**

Run:

```bash
yarn start
```

Expected: app serves on `http://localhost:4200` with the existing proxy config.

- [ ] **Step 7: Commit any final verification fixes**

Run only if verification required fixes:

```bash
git add .
git commit -m "fix: stabilize Nx migration verification"
```

Expected: all verification commands pass after the fix commit.

## Task 13: Final Review Checklist

**Files:**

- Inspect all migration commits.

- [ ] **Step 1: Confirm removed experimental test builder**

Run:

```bash
rg -n "@angular/build:unit-test|unit-test" angular.json apps libs nx.json package.json
```

Expected: no `@angular/build:unit-test` project target remains.

- [ ] **Step 2: Confirm custom boundaries are gone**

Run:

```bash
rg -n "eslint-plugin-boundaries|boundaries/|eslint-import-resolver-local-ts" package.json yarn.lock eslint.config.mjs .
```

Expected: no custom boundaries package, resolver, settings, or rules remain.

- [ ] **Step 3: Confirm Nx boundaries are active**

Run:

```bash
rg -n "@nx/enforce-module-boundaries|depConstraints|tags" eslint.config.mjs nx.json apps libs
```

Expected: Nx boundary rule exists and projects have tags.

- [ ] **Step 4: Confirm old aliases are gone**

Run:

```bash
rg -n "@core/|@features/|@layout/|@shared/|@services/|@types/" apps libs tsconfig.base.json
```

Expected: no old aliases remain. The app and libraries use `@wisave/*` public entrypoints or relative imports inside the same library.

- [ ] **Step 5: Confirm final status**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: clean worktree. Recent commits show the staged migration sequence.

## Self-Review

- Spec coverage: The plan covers full Nx integrated layout, test runner replacement, custom boundaries removal, library extraction, Docker path changes, documentation, and verification.
- Placeholder scan: No `TBD`, `TODO`, or unspecified implementation step remains.
- Scope check: This is large but cohesive because each task preserves a buildable or testable checkpoint. If execution becomes too slow, split after Task 5; Tasks 6-13 can become a second PR.
- Risk check: The riskiest areas are test runner conversion and import rewrites during library extraction. Both are isolated behind verification tasks before moving to the next phase.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-full-nx-migration.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task and review between tasks.
2. Inline Execution - execute tasks in this session using executing-plans with checkpoints.

Choose the approach before implementation starts.
