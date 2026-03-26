# Expense Features — Backend Integration Context

> Prepared 2026-04-06. Use this as context when fixing frontend ↔ backend integration for all expense features (expenses, accounts, budgets, categories).

---

## 1. Request Flow

```
Browser → /api/expenses/** → Angular HttpClient
       → http://localhost:5100/api/expenses/** (Portal/YARP gateway)
       → YARP strips /api prefix → /expenses/**
       → http://localhost:5200/expenses/** (Expenses microservice)
```

**Key points:**
- Portal listens on port **5100**
- Expenses WebApi listens on port **5200**
- YARP route pattern: `/api/expenses/{**remainder}` → strips `/api` → forwards `/expenses/{remainder}` to expenses-cluster
- All proxied requests require authentication (cookie session)
- Portal injects `X-User-Id`, `X-User-Email`, `X-User-Roles`, `X-User-Permissions` headers
- CSRF protection: `X-XSRF-TOKEN` header required on POST/PUT/DELETE/PATCH

---

## 2. Backend Endpoints (Expenses Microservice)

All endpoints below are relative to the microservice root (`http://localhost:5200`).
After YARP prefix stripping, the frontend path `/api/expenses/...` becomes `/expenses/...`.

### 2a. Expenses (`/expenses`)

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| **POST** | `/expenses` | `RecordExpenseRequest` | `{ correlationId: Guid }` | **202 Accepted** — async command |
| **PUT** | `/expenses/{id}` | `UpdateExpenseRequest` | `{ correlationId: Guid }` | **202 Accepted** — async command |
| **DELETE** | `/expenses/{id}` | — | `{ correlationId: Guid }` | **202 Accepted** — async command |
| **GET** | `/expenses` | query params | `{ expenses[], totalCount, pageInfo }` | Cursor-based pagination |
| **GET** | `/expenses/{id}` | — | `ExpenseReadModel` or 404 | |

**RecordExpenseRequest:**
```json
{
  "accountId": "string",
  "categoryId": "string",
  "subcategoryId": "string?",
  "amount": 285.50,
  "currency": "PLN",
  "date": "2026-04-01",        // DateOnly
  "description": "Groceries",
  "recurring": false,
  "metadata": null
}
```

**UpdateExpenseRequest:**
```json
{
  "amount": 300.00,
  "currency": "PLN",
  "date": "2026-04-01",
  "description": "Updated",
  "categoryId": "string?",
  "subcategoryId": "string?",
  "recurring": false,
  "metadata": null
}
```

**GET /expenses query params:**
- `cursor` (string?) — pagination cursor
- `pageSize` (int, default 20)
- `direction` ("next" | "prev", default "next")
- `from` (DateOnly?) — filter start
- `to` (DateOnly?) — filter end
- `search` (string?) — description search
- `categoryIds` (string?) — comma-separated
- `accountIds` (string?) — comma-separated
- `recurring` (bool?)
- `sortField` ("date" | "amount" | "description", default "date")
- `sortDirection` ("asc" | "desc", default "desc")

**ExpenseReadModel:**
```json
{
  "id": "string",
  "userId": "string",
  "accountId": "string",
  "categoryId": "string",
  "subcategoryId": "string?",
  "amount": 285.50,
  "currency": "PLN",
  "date": "2026-04-01",
  "description": "Groceries",
  "recurring": false,
  "metadataJson": "string?",
  "isDeleted": false,
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": null
}
```

### 2b. Accounts (`/expenses/accounts`)

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| **POST** | `/expenses/accounts` | `OpenAccountRequest` | `{ correlationId }` | 202 Accepted |
| **PUT** | `/expenses/accounts/{id}` | `UpdateAccountRequest` | `{ correlationId }` | 202 Accepted |
| **DELETE** | `/expenses/accounts/{id}` | — | `{ correlationId }` | 202 Accepted |
| **GET** | `/expenses/accounts` | — | `AccountReadModel[]` | |
| **GET** | `/expenses/accounts/{id}` | — | `AccountReadModel` or 404 | |

**OpenAccountRequest:**
```json
{
  "name": "mBank Main",
  "type": "BankAccount",          // BankAccount | DebitCard | CreditCard | Cash
  "currency": "PLN",
  "balance": 12450.00,
  "linkedBankAccountId": null,
  "creditLimit": null,
  "billingCycleDay": null,
  "color": "#3B82F6",
  "lastFourDigits": null
}
```

**AccountReadModel:**
```json
{
  "id": "string",
  "userId": "string",
  "name": "mBank Main",
  "type": "BankAccount",
  "currency": "PLN",
  "balance": 12450.00,
  "creditLimit": null,
  "billingCycleDay": null,
  "currentDebt": null,
  "linkedBankAccountId": null,
  "color": "#3B82F6",
  "lastFourDigits": null,
  "isActive": true,
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": null
}
```

### 2c. Categories (`/expenses/categories`)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| **GET** | `/expenses/categories` | — | `Category[]` with subcategories |
| **POST** | `/expenses/categories` | `{ name, sortOrder? }` | `{ id, name, sortOrder }` |
| **PUT** | `/expenses/categories/{id}` | `{ name, sortOrder? }` | `{ id, name, sortOrder }` |
| **DELETE** | `/expenses/categories/{id}` | — | 204 |
| **POST** | `/expenses/categories/{id}/subcategories` | `{ name, sortOrder? }` | `{ id, name, sortOrder }` |
| **DELETE** | `/expenses/categories/{id}/subcategories/{subId}` | — | 204 |

**GET /expenses/categories response:**
```json
[
  {
    "id": "string",
    "name": "Food",
    "sortOrder": 1,
    "subcategories": [
      { "id": "string", "name": "Groceries", "sortOrder": 1 }
    ]
  }
]
```

### 2d. Budgets (`/expenses/budgets`)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| **POST** | `/expenses/budgets` | `CreateBudgetRequest` | `{ correlationId }` (202) |
| **POST** | `/expenses/budgets/copy` | `{ month, year }` | `{ correlationId }` (202) |
| **PUT** | `/expenses/budgets/{id}/limit` | `{ totalLimit }` | `{ correlationId }` (202) |
| **PUT** | `/expenses/budgets/{id}/categories/{categoryId}` | `{ limit }` | `{ correlationId }` (202) |
| **DELETE** | `/expenses/budgets/{id}/categories/{categoryId}` | — | `{ correlationId }` (202) |
| **GET** | `/expenses/budgets` | `?month=4&year=2026` | `{ budget, categoryLimits }` |
| **GET** | `/expenses/budgets/summary` | `?month=4&year=2026` | `SpendingSummaryReadModel[]` |
| **GET** | `/expenses/budgets/monthly-stats` | `?year=2026` | `MonthlyStatsReadModel[]` |

**CreateBudgetRequest:**
```json
{ "month": 4, "year": 2026, "totalLimit": 8000, "currency": "PLN", "recurring": true }
```

**GET /expenses/budgets response:**
```json
{
  "budget": {
    "id": "string",
    "userId": "string",
    "month": 4,
    "year": 2026,
    "totalLimit": 8000.00,
    "currency": "PLN",
    "recurring": true,
    "createdAt": "...",
    "updatedAt": null
  },
  "categoryLimits": [
    { "id": 1, "budgetId": "string", "categoryId": "string", "limit": 2500.00 }
  ]
}
```

**SpendingSummaryReadModel:**
```json
{ "id": 1, "userId": "string", "month": 4, "year": 2026, "categoryId": "string", "categoryName": "Food", "totalSpent": 1250.00 }
```

**MonthlyStatsReadModel:**
```json
{ "id": 1, "userId": "string", "year": 2026, "month": 3, "totalSpent": 6800.00, "currency": "PLN" }
```

---

## 3. CRITICAL MISMATCHES — Frontend vs Backend

### 3a. URL Path Mismatches

| Frontend URL | After YARP strip | Backend expects | Status |
|-------------|-------------------|-----------------|--------|
| `/api/expenses` | `/expenses` | `/expenses` | ✅ OK |
| `/api/expenses/categories` | `/expenses/categories` | `/expenses/categories` | ✅ OK |
| `/api/expense-accounts` | `/expense-accounts` | `/expenses/accounts` | ❌ **MISMATCH** — no YARP route matches `/api/expense-accounts` |
| `/api/expense-budgets` | `/expense-budgets` | `/expenses/budgets` | ❌ **MISMATCH** — no YARP route matches `/api/expense-budgets` |
| `/api/expense-budgets/summary` | `/expense-budgets/summary` | `/expenses/budgets/summary` | ❌ **MISMATCH** |
| `/api/expenses/monthly-stats` | `/expenses/monthly-stats` | `/expenses/budgets/monthly-stats` | ❌ **MISMATCH** — stats are under budgets |

**Fix:** The frontend services must use paths under `/expenses/...` so YARP can route them:
- `expense-accounts-api.service.ts`: change base URL from `${getApiBaseUrl()}/expense-accounts` → `${getApiBaseUrl()}/expenses/accounts`
- `expense-budget-api.service.ts`: change base URL from `${getApiBaseUrl()}/expense-budgets` → `${getApiBaseUrl()}/expenses/budgets`
- `expenses-api.service.ts`: change monthly-stats path from `/expenses/monthly-stats` → `/expenses/budgets/monthly-stats`

### 3b. HTTP Method Mismatches

| Operation | Frontend sends | Backend expects | Status |
|-----------|---------------|-----------------|--------|
| Update expense | **PATCH** `/expenses/{id}` | **PUT** `/expenses/{id}` | ❌ **MISMATCH** |
| Update account | **PATCH** `/expense-accounts/{id}` | **PUT** `/expenses/accounts/{id}` | ❌ **MISMATCH** |
| Update category | **PATCH** `/expenses/categories/{id}` | **PUT** `/expenses/categories/{id}` | ❌ **MISMATCH** |

**Fix:** Change all update methods from `this.#http.patch(...)` to `this.#http.put(...)`.

### 3c. Response Shape Mismatches

**Write operations (POST/PUT/DELETE):**
- Frontend expects the **created/updated entity** back (maps DTO → domain model)
- Backend returns **`{ correlationId: Guid }`** with **202 Accepted** (async CQRS command)
- This is the biggest architectural gap — the backend uses event sourcing, so writes are eventually consistent

**Budget GET:**
- Frontend expects a single `IBudgetApiDto` with embedded `categoryBudgets[]`
- Backend returns `{ budget: BudgetReadModel, categoryLimits: BudgetCategoryLimitReadModel[] }` — budget and limits are separate objects

**Budget setOverallLimit:**
- Frontend: `PUT /expense-budgets` with `{ month, year, totalLimit }`
- Backend: `PUT /expenses/budgets/{id}/limit` with `{ totalLimit }` — requires budget ID, not month/year

**Budget setCategoryBudget:**
- Frontend expects response `{ categoryId, limit, spent }` with spent amount
- Backend returns `{ correlationId }` (async command)

**SpendingSummary:**
- Frontend expects: `{ categoryId, categoryName, spent, limit }`
- Backend returns: `{ id, userId, month, year, categoryId, categoryName, totalSpent }` — field is `totalSpent` not `spent`, no `limit` field

**MonthlyStats:**
- Frontend expects: `{ year, month, total, currency }`
- Backend returns: `{ id, userId, year, month, totalSpent, currency }` — field is `totalSpent` not `total`

### 3d. Pagination Direction Values

- Frontend sends: `'first'` | `'next'` | `'previous'`
- Backend accepts: `'next'` | `'prev'`
- The value `'first'` doesn't exist on the backend
- The value `'previous'` should be `'prev'`

### 3e. Account Type Enum Values

- Frontend DTO uses: `'bank_account'` | `'debit_card'` | `'credit_card'` | `'cash'` (snake_case)
- Backend uses: `'BankAccount'` | `'DebitCard'` | `'CreditCard'` | `'Cash'` (PascalCase)
- Mapper must handle this conversion

---

## 4. ASYNC COMMAND PATTERN (Event Sourcing)

The expenses microservice uses **CQRS with event sourcing**:

```
POST/PUT/DELETE → WebApi → publishes command to RabbitMQ → returns 202 + correlationId
                           ↓
                  Worker.Domain consumes command → appends event to KurrentDB
                           ↓
                  Worker.Projections updates PostgreSQL read models
                           ↓
                  Portal receives RabbitMQ event → pushes to frontend via SignalR
```

**Write operations do NOT return the entity.** The frontend must either:
1. **Optimistic update** — apply the change locally, then reconcile if SignalR sends a `CommandFailed` event
2. **Wait for SignalR** — listen for success event, then refresh from read model
3. **Re-fetch after delay** — poll the GET endpoint (not recommended)

**SignalR events pushed by Portal** (via `NotificationsHub`):
- `AccountOpened`, `AccountUpdated`, `AccountClosed`
- `ExpenseRecorded`, `ExpenseUpdated`, `ExpenseDeleted`
- `BudgetCreated`, `BudgetCopiedFromPrevious`
- `OverallLimitSet`, `CategoryLimitSet`, `CategoryLimitRemoved`
- `CommandFailed`

Hub URL: `/hubs/notifications` (on Portal, port 5100)

---

## 5. FILES TO MODIFY

### Frontend API Services:
- `src/app/core/services/expense-accounts-api.service.ts` — fix base URL, HTTP methods
- `src/app/core/services/expense-budget-api.service.ts` — fix base URL, endpoints, response mapping
- `src/app/core/services/expenses-api.service.ts` — fix monthly-stats URL, HTTP methods, response mapping
- `src/app/core/services/expenses-mapper.service.ts` — adjust DTO field names
- `src/app/core/services/expense-accounts-mapper.service.ts` — handle account type casing
- `src/app/core/services/expense-budget-mapper.service.ts` — adjust budget/summary DTO shapes

### Frontend Types:
- `src/app/core/types/expense.interface.ts` — update DTO interfaces
- `src/app/core/types/expense-account.interface.ts` — update DTO interfaces
- `src/app/core/types/expense-budget.interface.ts` — update DTO interfaces, add spending summary DTO

### Frontend Event Handlers (async command handling):
- `src/app/features/expenses/+store/expenses/expenses.event-handlers.ts` — handle 202 responses
- `src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts` — handle 202 responses
- `src/app/features/expense-budget/+store/budget/budget.event-handlers.ts` — handle 202 responses

### Shared types:
- `src/app/shared/types/` — pagination direction type may need `'prev'` instead of `'previous'`

---

## 6. PORTAL CONFIGURATION REFERENCE

**YARP Routes (appsettings.json):**
```json
{
  "ReverseProxy": {
    "Routes": {
      "expenses-route": {
        "ClusterId": "expenses-cluster",
        "Match": { "Path": "/api/expenses/{**remainder}" },
        "Transforms": [{ "PathRemovePrefix": "/api" }],
        "AuthorizationPolicy": "default"
      }
    },
    "Clusters": {
      "expenses-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://localhost:5200" }
        }
      }
    }
  }
}
```

**Docker override:** destination becomes `http://wisave-expenses-webapi:8080`

**Auth cookie:** `WiSave.Session` (HttpOnly, SameSite=Lax, 14-day sliding)
**CSRF cookie:** `XSRF-TOKEN` (JS-readable), header: `X-XSRF-TOKEN`

---

## 7. SUMMARY OF REQUIRED CHANGES

Priority order:
1. **Fix URL paths** — accounts and budgets routes won't even reach the backend currently
2. **Fix HTTP methods** — PUT vs PATCH on all update operations
3. **Fix response shapes** — mappers need to handle actual backend DTOs
4. **Handle async writes** — 202 + correlationId pattern needs SignalR integration or optimistic updates
5. **Fix pagination** — direction values and `'first'` handling
6. **Fix field name mismatches** — `totalSpent` vs `spent`/`total`, `totalLimit` vs `limit`
