# Incomes Feature

Income tracking with stats, monthly charts, and import functionality.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/incomes` | `IncomesComponent` | Main table with stats and monthly chart |
| `/incomes/add` | `AddIncomeComponent` | Dialog: create income |
| `/incomes/edit/:id` | `EditIncomeComponent` | Dialog: edit income |
| `/incomes/import` | `ImportIncomesComponent` | Bulk import |

## Stores

### IncomesStore

Root-provided, entity-based.

**State:** `isLoading`, `error`, `filter`, `sort`, `pagination` (cursor-based), `availableCategories`, `selectedIncome`, entities (`IIncome[]`).

**Page events:** `opened`, `navigatePage`, `pageSizeChanged`, `add`, `update`, `remove`, `filterApplied`, `filtersCleared`, `sortChanged`, `selectIncome`

### IncomesStatsStore

Root-provided. Handles aggregated stats and monthly chart data.

**State:** `stats` (IIncomeStats), `statsLoading`, `statsScope` (recurring|all), `monthlyStats`, `monthlyStatsLoading`, `monthlyStatsYear`, `error`.

**Events:** `statsScopeChanged`, `monthlyStatsYearChanged`

## Components

- `IncomesTableComponent` — PrimeNG table with filtering, sorting, row actions
- `MonthlyIncomeChartComponent` — bar chart with year navigation arrows

## API

`IncomesApiService` → `/incomes`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/incomes` | Cursor-paginated list |
| GET | `/incomes/:id` | Single income |
| POST | `/incomes` | Create income |
| PUT | `/incomes/:id` | Update income |
| DELETE | `/incomes/:id` | Delete income |
| GET | `/incomes/categories` | Category list |
| GET | `/incomes/total-amount` | Total amount |
| GET | `/incomes/stats` | Aggregated stats |
| GET | `/incomes/monthly-stats?year=` | Monthly breakdown |

## Key Types

- `IIncome` — id, date, description, category[], amount (IMoney), recurring, metadata
- `IIncomeStats` — lastYearTotal, thisYearTotal, thisMonthTotal, last3MonthsAverage, lastYearMonthlyAverage
- `IIncomeMonthlyStats` — year, month, recurringTotal, nonRecurringTotal
