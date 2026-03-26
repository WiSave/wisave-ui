# Auth Feature

User authentication — login, registration with multi-step wizard.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/auth` | redirect | Redirects to `/auth/login` |
| `/auth/login` | `LoginViewComponent` | Login form |
| `/auth/register` | `RegisterViewComponent` | Multi-step registration wizard |
| `/session-unavailable` | `SessionUnavailableComponent` | Retry screen when session bootstrap cannot determine auth state |

## Service

`AuthService` — not a store, uses direct signals.

**Signals:** `user` (IUser), `isAuthenticated`, `isInitialized`

**Methods:**
- `initialize()` — GET `/auth/me`, classifies the result as authenticated, unauthenticated (`401`), or unavailable (transport/server failure)
- `ensureAntiforgeryReady()` — GET `/auth/antiforgery-token`, caches the antiforgery bootstrap request for auth mutations
- `login(credentials)` — POST `/auth/login`
- `register(data)` — POST `/auth/register`
- `logout()` — POST `/auth/logout`

## Components

- `LoginFormComponent` — email + password form
- `RegisterAccountStepComponent` — name, email, password
- `RegisterPlanStepComponent` — plan selection (Free/Pro/Business)
- `RegisterConfirmStepComponent` — review + confirm

## Guards

- `authGuard` — protects authenticated routes, redirects to `/auth/login?returnUrl=...` on confirmed unauthenticated state
- `guestGuard` — protects auth routes from logged-in users, redirects to `/incomes`
- both guards route transient bootstrap failures to `/session-unavailable` instead of pretending the user is logged out

## Key Types

- `IUser` — id, name, email
- `ILoginRequest` — email, password
- `IRegisterRequest` — name, email, password, planId
- `IPlan` — id, name, price, currency, interval, features[], recommended

## Notes

Auth uses cookie/BFF model. Portal handles session management. The frontend never stores tokens — only session cookies managed by the browser.

### Auth bootstrap states

- Guest and authenticated shells both prewarm `GET /api/auth/antiforgery-token`, but login/register/logout do not rely on layout timing anymore; `AuthService` blocks auth mutations until antiforgery is ready.
- `GET /api/auth/me` returning `401` means the user is unauthenticated.
- non-`401` failures from `GET /api/auth/me` are treated as session bootstrap failures, not as logout.
- login and registration preserve `returnUrl` so users can land back on the protected page that triggered auth.
