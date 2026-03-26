# Expense Accounts Domain And UX Design

Prepared 2026-04-12.

## Goal

Redesign the `expense-accounts` feature so it behaves like a relationship-aware accounts domain instead of a flat CRUD list, while aligning the frontend with an eventually consistent, command-driven backend.

## Context

The current `/expenses/accounts` feature is functional but structurally weak in four ways:

- the page is visually sparse and reads more like a temporary admin screen than a money/accounts view
- card relationships are under-modeled in the UI and form flow
- the store behaves like synchronous CRUD even though the backend direction is async command + eventual read-model convergence
- transport naming such as `linkedBankAccountId` leaks into frontend semantics

The backend integration context also confirms that account writes return `202 Accepted` with a `correlationId`, which means the frontend must stop treating command acceptance as final read-model truth.

## Approved Direction

Use an incremental evolution approach:

- improve the current feature instead of replacing it wholesale
- redesign the frontend around a clearer domain model
- keep Phase 1 realistic for the current codebase
- prepare a clean path for DDD/event-driven backend evolution without requiring full real-time infrastructure now

## 1. Domain Semantics

The feature should model two concepts inside one accounts domain:

- funding accounts: `bank_account`, `cash`
- card instruments: `debit_card`, `credit_card`

### Mandatory Card Relationship

`originAccountUid` is mandatory for both card types.

Meaning by card type:

- `debit_card`: the funding account whose balance the card spends from
- `credit_card`: the funding account used to settle the card debt

This is a business relationship, not just a convenience field. Cards cannot exist unbound.

### Naming Rule

The frontend UI and frontend domain layer should use `originAccountUid`.

If the backend still exposes `linkedBankAccountId`, the mapper should translate between:

- frontend/domain: `originAccountUid`
- current backend transport: `linkedBankAccountId`

This keeps the UI language aligned with the business model while allowing gradual backend evolution.

### Domain Integrity Implications

These operations must be treated as meaningful relationship changes, not trivial field edits:

- binding a card to an origin account
- rebinding a card to a different origin account
- deleting a funding account that has dependent cards

## 2. Page UX Design

The `/expenses/accounts` page should be hybrid: part overview, part management.

### Product Goal

The page should optimize for:

- portfolio overview first enough to understand where money and debt live
- account management second enough to support fast edit/create/delete flows

### Current UX Problems

Observed issues in the current design:

- large areas of unused whitespace
- weak information hierarchy
- cards rendered as isolated items instead of related financial instruments
- no overview strip for totals or health
- no explicit explanation of card-to-account relationships
- initial loading and background processing are not clearly separated

### Target Layout

#### Top Summary Strip

Add a compact overview row containing:

- total liquid funds
- total credit debt
- effective available funds
- count of funding accounts
- count of cards

This should provide immediate orientation before the user scans individual records.

#### Main Content Groups

Render two primary sections:

- `Funding Accounts`
- `Cards`

Within these groups, the UI should expose relationships instead of hiding them:

- each card shows the origin account name
- each funding account shows whether cards depend on it
- credit cards visually emphasize debt, available credit, and settlement context

#### Management Actions

Keep the management affordances lightweight:

- `Add Account` remains primary and visible
- edit/delete remain secondary actions on each card
- empty states should suggest what to create next instead of showing only a generic empty message

### Loading, Error, And Processing Behavior

The loading model must distinguish between initial loading and post-submit processing.

#### Initial Page Load

On first page open:

- show a blocking loader until the first accounts projection is loaded
- do not render overview totals or account groups with stale or partial data before the first load completes

#### Post-Submit Processing

After account commands:

- keep existing data visible when possible
- show scoped processing feedback instead of reverting to a blank full-page loader
- do not automatically drop into polling or targeted re-fetch in Phase 1

#### Failure

If the first load fails:

- show an explicit error state
- provide a retry action
- do not leave the screen in an endless spinner state

## 3. Add/Edit Form Design

The current form already uses account type as the primary branch point. That structure stays, but the relationship modeling must become explicit.

### Form Rules

- `type` remains an early field because it controls the rest of the flow
- when `debit_card` or `credit_card` is selected, show a required origin-account selector immediately
- the selector label should reflect domain meaning:
  - `debit_card`: `Funding account`
  - `credit_card`: `Settlement account`
- helper text should explain why the relationship is required
- `credit_card` retains its specific fields such as `creditLimit` and `billingCycleDay`
- both card types can keep identity fields such as `lastFourDigits`

### UX Intent

This is not just a conditional extra field. The form should make it clear that a card is a related instrument attached to another account, not a standalone store of value.

## 4. Frontend State Model

The frontend must stop treating accounts as synchronous CRUD with final local truth.

### Required State Behavior

- page open always fetches the latest accounts projection
- add/edit/delete submit dispatches a command request
- command acceptance is not the same as read-model success
- projection data remains the source of truth

### Store Direction

The store should separate:

- read-model data
- selection / view state
- command-processing state

Recommended event/state semantics:

- `loadAccountsRequested`
- `loadAccountsSucceeded`
- `loadAccountsFailed`
- `openAccountRequested`
- `openAccountAccepted`
- `updateAccountRequested`
- `updateAccountAccepted`
- `removeAccountRequested`
- `removeAccountAccepted`
- `commandFailed`

The important behavioral change is this:

- do not invent final local IDs or entities after a `202 Accepted`
- treat accepted commands as accepted commands, not confirmed projection updates
- let the user regain control without pretending the read model has already converged

## 5. Eventual Consistency Strategy

The initial implementation should support eventual consistency without overengineering.

### Phase 1 Strategy

Use three practical mechanisms:

1. basic `GET` on page open to load current projections
2. no targeted refresh after submit in Phase 1; the user can manually reload or reopen the page to get the latest projection
3. mention SignalR as the next planned step after this plan, not a current dependency

### UX Rules For Eventual Consistency

- simple changes can close the dialog after command acceptance, with the understanding that the projection may still lag
- relationship-changing actions such as card binding or rebinding should use more explicit processing feedback
- the UI should not fabricate final state while waiting for backend convergence

### Future Direction

SignalR is the next planned enhancement after this plan. It can later improve freshness, but it does not replace the need for:

- clear local command-processing state
- explicit accepted-vs-confirmed semantics
- robust fallback behavior when push delivery is unavailable

## 6. Backend Expansion Path

Phase 1 does not require a full aggregate redesign, but the design should support one.

### Short-Term Contract Alignment

- frontend/domain uses `originAccountUid`
- mapper translates to current backend transport shape if necessary
- frontend write flows assume `202 Accepted` without pretending the projection is immediately updated

### DDD/Event-Driven Evolution

The backend should move toward relationship-aware domain events instead of generic field mutation for card/account changes.

Useful future events and projection capabilities include:

- card bound to origin account
- card rebound to different origin account
- funding account dependency summary updated
- effective available funds recalculated
- debt settlement status updated

Future projections should support richer read models such as:

- origin account display data for cards
- attached cards counts on funding accounts
- aggregate debt summaries
- effective available balance summaries

## 7. Phase Boundaries

### Phase 1: Frontend And Contract-Alignment Fixes

Deliver now:

- redesign `/expenses/accounts` into a hybrid page with summary, grouped sections, and relationship cues
- add initial blocking loader and clearer error/empty/processing states
- redesign add/edit forms so cards require `originAccountUid`
- move frontend naming toward `originAccountUid`
- translate to current backend contract in the mapper if backend is not yet renamed
- stop relying on optimistic fake entity creation for account commands
- make accepted command state explicit without adding auto-refresh yet
- clean up accounts store semantics

### Phase 2: Backend Domain Preparation

Prepare next:

- evolve backend command contract toward `originAccountUid`
- emit explicit relationship-oriented domain events
- expand projections for relationship-aware display
- define rules for deleting or rebinding accounts with dependent cards

### Phase 3: Eventual Consistency Polish

Later enhancements:

- correlation-aware command tracking where useful
- projection-aware polling or command-status lookup if exposed
- SignalR push updates for projection freshness

## 8. Main Issues This Design Addresses

- weak information hierarchy on `/expenses/accounts`
- missing required relationship field for card creation/editing
- flat CRUD mental model that conflicts with DDD/event-driven backend direction
- fragile optimistic update behavior for async commands
- unclear loading, processing, and error behavior

## 9. Out Of Scope

The following are intentionally not part of this design:

- full microservice or aggregate decomposition beyond what accounts needs right now
- mandatory real-time infrastructure in Phase 1
- unrelated redesigns of the broader expenses or budget features
