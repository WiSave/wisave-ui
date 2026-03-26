# Expense Budget Feature

Monthly budget tracking with per-category limits, month navigation, comparison deltas, trend insights, and a dedicated insights page.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/expenses/budget` | `BudgetComponent` | Monthly budget view with cards + charts |
| `/expenses/insights` | `InsightsComponent` | Cross-month analysis page |

## Stores

### ExpenseBudgetStore

Root-provided. Manages budget CRUD and month navigation.

**State:** `currentBudget` (IBudget), `spendingSummaries`, `monthlyStats`, `availableCategories`, `selectedMonth`, `selectedYear`, `isLoading`, `error`.

**Page events:** `opened`, `monthChanged`, `setOverallLimit`, `addCategoryBudget`, `updateCategoryBudget`, `removeCategoryBudget`

### BudgetAnalysisStore

Root-provided. Handles cross-month comparisons and insights.

**State:** `previousBudget`, `previousSummaries`, `selectedRange` (3|6|12), `categoryComparison`, `rangeMonthlyStats`, `rangeSummaries`, `isLoading`, `error`.

**Computeds:** `hasPreviousData`, `previousTotalSpent`, `categoryDeltas`, `previousMonthLabel`

**Events:** `comparisonRequested`, `insightsPageOpened`, `rangeChanged`

## Components

- `BudgetOverviewCardComponent` — total spent/limit with progress bar + delta badge
- `CategoryBudgetCardComponent` — per-category spent/limit with delta line
- `BudgetChartsComponent` — doughnut (spending by category with custom legend) + bar chart (monthly trend) + delta column
- `InsightCardComponent` — severity-colored insight card (warning/info/positive)
- `CategoryComparisonTableComponent` — month-over-month category breakdown table

## Features

### Month Navigation
- `< March 2026 >` arrows in header, "Current" badge
- Forward arrow disabled on current month
- Past-month info banner + edit confirmation guards

### Recurring Budgets
- Budgets auto-copy from previous month (category structure + limits, spent reset to 0)
- `IBudget.recurring` flag controls auto-copy behavior

### Inline Comparison Deltas
- Analysis store fetches previous month data
- Delta badges on overview card, category cards, and chart legend ("↓ 12% vs Feb")

### Trend Insights
- 4 types: `overspend`, `savings`, `total_delta`, `consecutive_trend`
- Computed client-side in `insights.helper.ts`
- Top 3 shown on budget view (below charts), all shown on insights page

### Insights Page
- Range selector (3m / 6m / 12m)
- All insight cards
- Category comparison table (clickable rows filter trend chart)
- Trend bar chart with per-category filtering

## API

`ExpenseBudgetApiService` → `/expense-budgets`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expense-budgets?month=&year=` | Budget for month |
| PUT | `/expense-budgets` | Set overall limit |
| POST | `/expense-budgets/copy` | Copy budget from previous month |
| PUT | `/expense-budgets/:id/categories/:catId` | Set category limit |
| DELETE | `/expense-budgets/:id/categories/:catId` | Remove category limit |
| GET | `/expense-budgets/summary?month=&year=` | Spending per category |

## Helpers

- `month.helper.ts` — `getPreviousMonth`, `getNextMonth`, `isCurrentMonth`, `formatMonthLabel`, `getMonthRange`
- `insights.helper.ts` — `computeAllInsights`, `computeOverspendInsights`, `computeSavingsInsights`, `computeTotalDeltaInsight`, `computeConsecutiveTrendInsights`

## Key Types

- `IBudget` — id, month, year, totalLimit, currency, recurring, categoryBudgets[]
- `ICategoryBudget` — categoryId, limit, spent
- `ICategorySpendingSummary` — categoryId, categoryName, spent, limit
- `IInsight` — type, categoryId?, categoryName?, message, severity, value
- `IDelta` — amount, percent, direction ('up'|'down'|'flat')
