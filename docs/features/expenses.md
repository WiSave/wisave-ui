# Expenses Feature

Expense transaction management — recording, filtering, sorting, and paginating spending entries.

## Nx Libraries

- `libs/expenses/shell` owns the `/expenses` shell component and child route composition.
- `libs/expenses/plugins/list` owns the transaction list projection view, table/cards components, and list store.
- `libs/expenses/plugins/budget` owns budget and insights views/stores.
- `libs/expenses/plugins/accounts` owns funding account views, dialogs, account store, and account tests.
- `libs/expenses/data-access` owns expenses, budget, and account API services/mappers.

## Routes

| Path             | Component           | Description                           |
| ---------------- | ------------------- | ------------------------------------- |
| `/expenses/list` | `ExpensesComponent` | Main table with account balance cards |

## Store

`ExpensesStore` — root-provided, entity-based.

**State:** `isLoading`, `error`, `pagination` (cursor-based), `filter` (`IExpensesFilter`), `sort` (`IExpensesSortOrder`), `availableCategories`, `availableAccounts`, `selectedExpense`, entities (`IExpense[]`).

**Page events:** `opened`, `navigatePage`, `pageSizeChanged`, `add`, `update`, `remove`, `filterApplied`, `filtersCleared`, `sortChanged`, `selectExpense`

## Components

- `ExpensesTableComponent` — PrimeNG table with inline filtering, sorting, row actions
- `AccountBalanceCardsComponent` — top-level account balances summary
- `ExpenseEditFormComponent` — reactive form with metadata key-value pairs

## API

`ExpensesApiService` → `/expenses`

| Method | Endpoint               | Description                                   |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/expenses`            | Cursor-paginated list with filter/sort params |
| GET    | `/expenses/:id`        | Single expense                                |
| POST   | `/expenses`            | Create expense                                |
| PUT    | `/expenses/:id`        | Update expense                                |
| DELETE | `/expenses/:id`        | Delete expense                                |
| GET    | `/expenses/categories` | Category list                                 |

## Key Types

- `IExpense` — id, date, description, categoryId, subcategoryId, accountId, amount (IMoney), recurring, metadata
- `IExpensesFilter` — dateRange, searchQuery, categoryIds, accountIds, recurring
- `IExpensesSortOrder` — field (date|amount|description|createdAt), direction
