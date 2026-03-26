# Expense Accounts Feature

Manage financial sources — bank accounts, credit cards, debit cards, and cash.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/expenses/accounts` | `AccountsComponent` | Hybrid overview and management page for account projections |
| `/expenses/accounts/add` | `AddAccountComponent` | Dialog: create account |
| `/expenses/accounts/edit/:id` | `EditAccountComponent` | Dialog: edit account |

## Store

`ExpenseAccountsStore` — root-provided, entity-based.

Projection data is authoritative. Accepted commands do not fabricate local entity changes.

**State:** `isLoading`, `hasLoaded`, `error`, `commandStatus`, `selectedAccount`, entities (`IExpenseAccount[]`).

**Page events:** `opened`, `add`, `update`, `remove`, `selectAccount`

**Command status:** `idle | submitting | accepted | failed`

## Components

- `AccountCardComponent` — displays account with type-specific layout, relationship context, credit usage, and effective funding-account balance
- `AccountFormComponent` — reactive form with conditional fields based on account type and required card origin-account relationship
- `AddAccountComponent` / `EditAccountComponent` — dialog flows that close on accepted commands instead of optimistic entity mutation

## Layout

Hybrid accounts page:
- blocking loader until the first projection load completes
- explicit load-failure state with retry
- summary strip for liquid funds, credit debt, effective funds, and total account count
- **Funding Accounts** section for bank accounts and cash
- **Cards** section for debit and credit cards
- relationship-aware cards that show funding/settlement context

## API

`ExpenseAccountsApiService` → `/expense-accounts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expense-accounts` | All user accounts |
| GET | `/expense-accounts/:id` | Single account |
| POST | `/expense-accounts` | Create account |
| PUT | `/expense-accounts/:id` | Update account |
| DELETE | `/expense-accounts/:id` | Delete account |

## Eventual Consistency

- `GET /expense-accounts` on page open loads the current projection
- POST/PUT/DELETE are treated as accepted commands, not immediate read-model confirmation
- Phase 1 does not auto-refresh after submit
- user-visible projection convergence beyond page-open load is deferred to later SignalR work

## Key Types

- `IExpenseAccount` — id, name, type (`bank_account`|`debit_card`|`credit_card`|`cash`), currency, balance, `originAccountUid?`, `creditLimit?`, `billingCycleDay?`, `currentDebt?`, `color?`, `lastFourDigits?`
- `IExpenseAccountWritePayload` — dialog/form write model with required `originAccountUid: ExpenseAccountId | null`
