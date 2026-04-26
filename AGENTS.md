# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

WiSaveUI is a personal finance management application built with Angular 21. It uses zoneless change detection for performance, NgRx Signal Store for state management, PrimeNG for UI components, Tailwind CSS for styling, and a REST API accessed through Angular `HttpClient`.

## Architecture Reference

Based on [Scalable Angular App Architecture](https://georgebyte.com/scalable-angular-app-architecture/) by George Byte, modernized for Angular 21 with signals and standalone components.

### Component Types

**Presentational Components** (`components/`):
- Handle only UI rendering and user interaction
- Receive data via signal inputs, emit events via outputs
- No business logic, no state mutations, no API calls
- Highly reusable

**Smart/Container Components** (`containers/`, `views/`):
- Connect stores with presentational components
- Know app state structure and store methods
- `views/` are routable containers that sync route params with store state

### One-Way Data Flow

```
Store → Container → Presentational → UI
         ↑                            |
         └──── events ────────────────┘
```

## Common Commands

```bash
# Development server (http://localhost:4200)
yarn start

# Production build
yarn build

# Development build (watch mode)
yarn watch

# Run all tests
yarn test

# Lint code
yarn lint

# Lint and auto-fix
yarn lint:fix

# ESLint only
yarn eslint

# ESLint auto-fix
yarn eslint:fix

# Format code with Prettier
yarn format

# Check formatting without changes
yarn format:check

# Dockerized local run
docker compose up --build

# Remote OrbStack deploy over SSH
bash scripts/deploy-orbstack.sh --backend-upstream http://192.168.1.50:5100
```

Remote deploy assumes SSH user `server`, Cloudflare-managed domain `wisave.app`, and a Cloudflare Tunnel token stored in a local `.cloudflared-token` file.

## Architecture

### State Management (NgRx Signal Store)

The app uses NgRx Signal Store (not traditional NgRx) with `@angular-architects/ngrx-toolkit`:

```typescript
signalStore({ providedIn: 'root' },
  withDevtools('StoreName'),
  withGlitchTracking(),
  withState(initialState)
)
```

Stores are located in `features/<feature>/+store/`. The `+` prefix signals that the directory is a framework-level integration layer (inspired by SvelteKit/Analog conventions) — it contains store definitions, events, reducers, state, and event handlers, but no UI components. Access store in components using `inject()`:
```typescript
#store = inject(IncomesStore);
incomes = this.#store.incomes();
```

#### Event Handlers & RxJS Flattening Operators

Event handlers use `@ngrx/signals/events` with `withEventHandlers`. Choose the flattening operator based on intent:

| Operator | Use When | Example |
|----------|----------|---------|
| `exhaustMap` | Trigger should be ignored while a request is in-flight (prevent duplicate loads) | Page opened, select by ID |
| `switchMap` | New parameter should cancel the in-flight request and start a fresh one | Filter/sort/page changes |

#### Typing Event Handlers

Use `signalStoreFeature` input constraints and `withProps` to avoid `any` on the store parameter:

```typescript
export function withFeatureEventHandlers() {
  return signalStoreFeature(
    { state: type<Pick<FeatureState, 'neededProp1' | 'neededProp2'>>() },
    withProps(() => ({
      _events: inject(Events),
      _api: inject(FeatureApiService),
    })),
    withEventHandlers((store) => ({
      // store is fully typed — no `any`
      load$: store._events.on(pageEvents.opened).pipe(
        exhaustMap(() => store._api.load(store.neededProp1())),
      ),
    })),
  );
}
```

### Component Patterns

All components are standalone (no NgModules). Key patterns:
- Signal-based inputs: `data = input.required<IIncome[]>()`
- Inject function: `#service = inject(ServiceName)`
- Private fields with `#` prefix for injected dependencies
- Prefer `output()` over `EventEmitter`

### Feature Module Structure

```
features/<feature>/
├── +store/         # NgRx Signal Store (events, reducers, state, event handlers)
├── components/     # Presentational components
├── containers/     # Smart components (state-connected)
├── types/          # Interfaces and types
├── views/          # Route-level components
├── services/       # Feature-specific services
├── helpers/        # Utility functions
└── <feature>.routes.ts
```

The `+store/` prefix convention marks the directory as a framework integration layer (not a UI layer). It may contain sub-stores (e.g., `+store/incomes/`, `+store/stats/`).

### Path Aliases

```typescript
@core/*      → src/app/core/*
@features/*  → src/app/features/*
@layout/*    → src/app/layout/*
@shared/*    → src/app/shared/*
@services/*  → src/app/core/services/*
@types/*     → src/app/core/types/*
```

### Routing

Features are lazy-loaded via router:
```typescript
{
  path: 'incomes',
  loadChildren: () => import('./incomes/incomes.routes').then((m) => m.routes),
}
```

### API Integration

- The app currently uses REST, not GraphQL.
- Prefer Angular `HttpClient` services under `features/<feature>/services/`.
- Runtime API base URL comes from `window.__env.API_BASE_URL`, generated from `/env.js`.
- Local dev default backend URL: `http://localhost:5100/api`
- Docker/public deployment default frontend API base URL: `/api`
- Public deployments are expected to expose only `wisave.app` through Cloudflare Tunnel.
- `/api/*` is disabled by default and only proxied internally when `BACKEND_UPSTREAM` is explicitly configured.
- Legacy `graphql/` directories may still exist in the tree, but they are not part of the active integration path and should not be used for new work.

## Styling

- **Tailwind CSS** for utility classes
- **PrimeNG** components with `tailwindcss-primeui` plugin
- **Custom theme** in `src/theme.ts` extending Aura preset
- **Design tokens** in `src/styles/colors.css` (HSL-based)
- **Dark mode** via `.dark` class and CSS custom properties

Theme toggle managed by `ThemeService` with localStorage persistence.

### PrimeNG Button Severity

Always set explicit `severity` on `<p-button>`. The default primary maps to accent (yellow) which clashes in most contexts.
- Primary actions (save, submit): `severity="secondary"` or `severity="success"`
- Cancel/dismiss: `severity="secondary"` with `[text]="true"`
- Destructive (delete, remove): `severity="danger"`
- Never leave severity unset — it renders yellow

### PrimeNG Chart Sizing

`p-chart` wraps a Chart.js canvas. CSS height/width on a parent div is unreliable — the canvas ignores it.
- Use `width` and `height` input props on `<p-chart>` for fixed-size charts (e.g. doughnut)
- For fluid charts, use a parent with explicit height and `class="w-full"` on `<p-chart>`
- Always set `responsive: true` and `maintainAspectRatio: false` in chart options
- Disable the default Chart.js legend (`legend: { display: false }`) when using a custom HTML legend

### Money Formatting

Use `createMoney()` and `formatMoney()` from `@core/types/money.interface` instead of Angular pipes (`DecimalPipe`, `CurrencyPipe`). Prefer computed properties over template pipes:
```typescript
readonly formattedBalance = computed(() => formatMoney(createMoney(this.balance(), this.currency())));
```

### Shell Components

Feature groups use a shell component (`*-shell.component.ts`) in `layout/` that provides:
- Feature header (uppercase tracking label)
- Tab-style `<nav>` with `RouterLink`/`RouterLinkActive` for sub-routes
- `<router-outlet>` for child views

Child views should NOT duplicate headers or padding — the shell owns those.
Active tab style: `bg-secondary-200 dark:bg-dark-primary-700` (not accent/yellow).

## Additional Docs

**Read these before working on a feature or making architectural decisions:**

- `docs/ARCHITECTURE.md` — full system architecture: gateway (YARP/Portal), auth (BFF/cookie model), deployment topology, Kubernetes plans, observability. Read when touching API integration, auth, or deployment.
- `docs/features/` — per-feature frontend documentation. Each file covers routes, stores, components, API contracts, and key types. **Read the relevant feature doc before modifying any feature.** Files:
  - `docs/features/expenses.md` — expense transactions (table, filtering, pagination)
  - `docs/features/expense-accounts.md` — account management (cards, bank accounts, grouped layout)
  - `docs/features/expense-budget.md` — budgets, month navigation, insights, analysis store
  - `docs/features/incomes.md` — income tracking, stats, monthly charts
  - `docs/features/stock.md` — stock portfolio (stub/placeholder)
  - `docs/features/auth.md` — login, registration wizard, guards
- `README.md` — project setup, Docker usage, runtime API configuration
- External documentation repo (`/Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-documentation/`):
  - `specs/` — feature design specs (e.g. `2026-03-26-expenses-feature-design.md`, `2026-03-28-expenses-microservice-design.md`)
  - `plans/` — implementation plans (e.g. `2026-03-26-expenses-feature-implementation.md`)
  - `architecture/` — architecture decisions
  - `adr/` — architecture decision records

## Testing

Tests run via Angular CLI (`ng test`) using the `@angular/build:unit-test` builder. Tests follow `*.spec.ts` pattern.

## Linting (ESLint)

ESLint is configured with flat config (`eslint.config.mjs`) and includes:

- **@angular-eslint** - Angular-specific rules
- **@typescript-eslint** - TypeScript rules
- **@rxlint** - RxJS best practices
- **eslint-plugin-boundaries** - Architectural boundary enforcement

### Architectural Boundaries

The boundaries plugin enforces layer separation:

| Layer | Can Import | Cannot Import |
|-------|------------|---------------|
| `core/` | core only | shared, features, layout |
| `shared/` | core, shared | features, layout |
| `layout/` | core, shared, layout | features |
| `feature/components/` | core, shared, types | **+store**, other features |
| `feature/containers/` | core, shared, types, components, +store | other features |
| `feature/views/` | all feature internals, core, shared | other features |
| `feature/+store/` | core, types, services, helpers | components, other features |

**Key rules:**
- Presentational components (`components/`) cannot access store
- Features cannot import from other features
- Cross-feature communication goes through `core/` (shared state/services)

## Key Types

```typescript
interface IMoney {
  amount: number;
  currency: Currency; // PLN, EUR, USD, GBP, CHF
}

interface IIncome {
  id: string;
  date: Date;
  description: string;
  category: string[];
  amount: IMoney;
  recurring?: boolean;
}
```

## Angular 21 Features in Use

- Zoneless change detection (`provideZonelessChangeDetection`)
- Signal-based inputs (`input()`, `input.required()`)
- Standalone components (no NgModules)
- `inject()` function for DI
- Built-in control flow (`@if`, `@for`, `@switch`)

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Component | `feature-name.component.ts` | `incomes-table.component.ts` |
| Service | `feature-name.service.ts` | `incomes.service.ts` |
| Store | `feature-name.store.ts` | `incomes.store.ts` |
| Interface | `feature-name.interface.ts` | `incomes.interface.ts` |
| Type | `feature-name.type.ts` | `incomes.type.ts` |
| Helper | `feature-name.helper.ts` | `currency.helper.ts` |
| Enum | `feature-name.enum.ts` | `currency.enum.ts` |

### Classes & Interfaces

- Components: `FeatureNameComponent`
- Services: `FeatureNameService`
- Stores: `FeatureNameStore`
- Interfaces: `IFeatureName` (prefix with `I`)
- Types: `TFeatureName` (prefix with `T`) or descriptive name
- Enums: `FeatureName` (PascalCase, no prefix)

## Git Workflow

### Branch Naming

```
feature/short-description
fix/short-description
refactor/short-description
chore/short-description
```

### Commit Message Format

```
<type>: <short description>

<optional body>
```

**Types:** `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**Examples:**
```
feat: add income filtering by category
fix: resolve currency conversion rounding error
refactor: extract table pagination to shared component
```

## Code Guidelines

### Do

- Use signal inputs: `data = input.required<T>()`
- Use `inject()` for dependency injection
- Use `#` prefix for private injected fields: `#store = inject(Store)`
- Use path aliases for imports: `@features/*`, `@core/*`
- Keep components small and focused (single responsibility)
- Use `output()` for event emitters
- Use `computed()` for derived state
- Use `effect()` sparingly, prefer declarative patterns
- Prefer built-in control flow (`@if`, `@for`, `@switch`) over `*ngIf`/`*ngFor`

### Don't

- Don't use `@Input()` decorator — use signal inputs
- Don't use constructor injection — use `inject()`
- Don't import from other features directly — use `core/` for shared state
- Don't access store from presentational components
- Don't rely on manual change detection (`ChangeDetectorRef`, `markForCheck`) — app is zoneless; prefer signals/async pipe patterns
- Don't use `BehaviorSubject` for state — use Signal Store
- Don't mutate state directly — use store methods
- Don't use `ngOnInit` for simple initialization — use `inject()` or field initializers
