# Stock Feature

Stock portfolio management — early stage with stub components.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/stock` | redirect | Redirects to `/stock/overview` |
| `/stock/overview` | `StockOverviewComponent` | Market overview (stub) |
| `/stock/portfolio` | `StockPortfolioComponent` | Holdings (stub) |
| `/stock/watchlists` | `StockWatchlistsComponent` | Watchlists (stub) |
| `/stock/opportunities` | `StockOpportunitiesComponent` | Opportunities (stub) |
| `/stock/research` | `StockResearchComponent` | Research (stub) |

## Shell

`StockComponent` provides tab navigation (same pattern as `ExpensesShellComponent`).

## Status

Placeholder components with no store, API, or business logic. To be built after the expenses backend microservice is stable.
