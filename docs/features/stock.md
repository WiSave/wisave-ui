# Stock Feature

Stock portfolio management is currently a frontend workspace being wired to the stock backend incrementally. Portfolio and position reads use the real logged-user API; valuation data is still represented with zeroed placeholders until backend projections expose it.

## Routes

| Path                                   | Component                     | Description                        |
| -------------------------------------- | ----------------------------- | ---------------------------------- |
| `/stock`                               | redirect                      | Redirects to `/stock/overview`     |
| `/stock/overview`                      | `StockOverviewComponent`      | Market overview (stub)             |
| `/stock/portfolio`                     | `StockPortfolioComponent`     | Desktop portfolio workspace        |
| `/stock/portfolio/portfolios/add`      | `AddStockPortfolioComponent`  | Route-backed add portfolio dialog  |
| `/stock/portfolio/portfolios/:id/edit` | `EditStockPortfolioComponent` | Route-backed edit portfolio dialog |
| `/stock/portfolio/positions/add`       | `AddStockPositionComponent`   | Route-backed add stock dialog      |
| `/stock/portfolio/positions/:id/edit`  | `EditStockPositionComponent`  | Route-backed edit stock dialog     |
| `/stock/watchlists`                    | `StockWatchlistsComponent`    | Watchlists (stub)                  |
| `/stock/opportunities`                 | `StockOpportunitiesComponent` | Opportunities (stub)               |
| `/stock/research`                      | `StockResearchComponent`      | Research (stub)                    |

## Shell

`StockComponent` owns the stock feature header, tab navigation, and child route outlet. Child views should not duplicate the shell header or top-level padding.

## Portfolio Workspace

`StockPortfolioComponent` is a desktop-first horizontal workspace:

- top toolbar with portfolio switcher plus add/edit actions
- summary strip for total value, unrealized P/L, realized P/L, and position count
- top analytics row with `StockPerformanceChartComponent` and `StockAllocationPanelComponent`
- bottom `StockPositionsTableComponent` optimized for a small number of current holdings
- row selection in the positions table drives chart scope for one or more selected positions
- chart scope supports `portfolio`, `selected`, and `compare`

Dialogs are hosted by `AppDialogComponent` and use nested routes under `/stock/portfolio`.

## State

The portfolio workspace uses `StockPortfolioStore` under `libs/stock/feature/src/lib/+store/portfolio/`.

- `stock-portfolio.events.ts` defines page and API events.
- `stock-portfolio.event-handlers.ts` calls `StockPortfolioService`.
- `stock-portfolio.store.ts` owns portfolio selection, chart scope, selected chart rows, command status, and derived allocation/chart position data.

Presentational components receive signal inputs and emit outputs. They do not inject the store.

## API Boundary

`StockPortfolioService.getWorkspace()` fetches portfolios from `GET /stocks/portfolios` through the runtime API base URL. Portfolio selection is store-driven: `stockPortfolioPageEvents.portfolioSelected` triggers `StockPortfolioService.getPositions(portfolioId)`, which calls `GET /stocks/positions?portfolioId={id}` and stores the returned positions for that portfolio.

- `getWorkspace()`
- `addPortfolio()`
- `updatePortfolio()`
- `deletePortfolio()`
- `getPositions()`
- `addPosition()`
- `updatePosition()`

Open-position commands include the optional `allocationTag` field. The position form trims it before submit and sends `null` when the field is blank, matching the stock API contract.

When backend endpoints are available, replace this service implementation while preserving the store-facing method contracts where possible.
