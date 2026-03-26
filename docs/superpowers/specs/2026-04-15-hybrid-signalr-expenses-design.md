# Hybrid SignalR Expenses Design

**Date:** 2026-04-15

## Goal

Introduce a production-safe SignalR architecture for WiSave that supports the expenses domain first, while keeping the transport and frontend integration extensible enough for additional domains without refactoring the core realtime layer.

## Scope

This design covers:

- backend realtime delivery in `wisave-portal`
- frontend SignalR transport and domain adapters in `wisave-ui`
- integration with existing NgRx Signal Store feature stores
- async command handling for `202 Accepted` write flows

This design does not cover:

- a generic cross-domain notification center UI
- non-expenses domains beyond the extension points needed to add them later
- replacing the existing MassTransit or YARP architecture

## Current Context

`WiSave.Portal` already exposes an authenticated `NotificationsHub` at `/hubs/notifications` and forwards expenses-domain MassTransit events to connected users. The hub groups connections by authenticated user id and sends raw event names such as `ExpenseRecorded`, `AccountOpened`, and `CommandFailed`.

The Angular app already uses NgRx Signal Store per domain and already depends on `@microsoft/signalr`, but there is no active SignalR client integration yet. Expenses, accounts, and budget flows already use store events and async event handlers, which provides a good integration seam for realtime updates.

Today the portal runs as a single instance, so SignalR delivery is local to one node and that is fine. The planned rollout to Kubernetes will introduce multiple portal replicas, at which point an event consumed on one replica would not reach clients connected to another. The design therefore prepares for that multi-replica future rather than solving a live production incident.

## Design Decisions

### 1. Overall Direction

Use a hybrid design:

- implement expenses-domain realtime support first
- keep a single shared portal hub
- define stable client-facing realtime contracts now
- isolate frontend transport from domain state
- make domain expansion additive rather than requiring core rewrites

### 2. Async Command Contract

For any backend command endpoint that returns `202 Accepted`, the frontend will wait for SignalR confirmation before mutating authoritative business state.

This means:

- no default optimistic entity updates for `202` flows
- the store records pending command state locally
- success domain events from SignalR apply authoritative data changes
- `CommandFailed` resolves pending commands into failure state

This is the default behavior for expenses-domain async commands because balances, budgets, and account state are financially sensitive and should not briefly display invented values.

The expenses event handlers currently apply optimistic updates on HTTP success — for example, `expenses.event-handlers.ts` mutates store state immediately after `add`, `update`, and `delete` API calls resolve. Those optimistic mutations will be removed as part of this rollout so that all authoritative changes flow through SignalR confirmation. The rollout phase that adds `withExpensesSignalR(...)` is the point at which optimistic mutations get deleted, not a later cleanup pass.

### 3. Frontend Boundary

Realtime transport lives in services, not in the stores themselves.

Use:

- one shared transport service for the portal hub connection
- one expenses-domain adapter service that translates portal hub messages into typed domain events
- one Signal Store feature per bounded context that integrates those typed events into store state

The naming convention should make the transport explicit:

- `PortalSignalRService`
- `ExpensesSignalRService`
- `withExpensesSignalR(...)`
- `withAccountsSignalR(...)`
- `withBudgetSignalR(...)`

## Backend Design

### Responsibilities

Keep `NotificationsHub` transport-focused:

- authenticate the connection
- manage connection lifecycle
- route each connection into the correct per-user delivery channel

Do not treat raw CLR contract names as the long-term client contract. The portal should translate backend events into stable client-facing realtime messages before sending them to the browser.

### Client-Facing Event Envelope

Introduce a small envelope for outbound hub messages. Each realtime message should include:

- `eventId` — stable unique id per event emission, used by clients to dedupe
- `domain` such as `expenses`
- `eventType` such as `expense.recorded`, `account.opened`, `budget.updated`, or `command.failed`
- `occurredAt`
- `correlationId` — required for any event that completes a `202 Accepted` command flow; optional for events not tied to a specific command
- `entityId` when available
- `payload`

The envelope creates a stable frontend contract even if the backend event class names or namespaces later change.

`correlationId` is produced by the portal when a command is accepted and returned to the caller in the `202 Accepted` response body. The client stores it alongside its pending command entry so that the matching SignalR event — success or `CommandFailed` — can reconcile unambiguously even when multiple tabs submit similar commands.

### Delivery Model

Continue routing by authenticated user id. A single user may have multiple tabs or devices connected; all should receive the same expenses-domain updates. The hub should remain push-only for this phase.

### Scale-Out Preparation (Kubernetes)

The portal is expected to move to Kubernetes with multiple replicas. Add distributed SignalR support in the portal ahead of that migration so the realtime layer is already replica-safe when K8s rollout happens, rather than racing the cutover.

Preferred first step:

- use a Redis SignalR backplane because Redis is already part of the portal infrastructure

Expected result:

- if a MassTransit consumer on portal replica A emits an event, clients connected to portal replica B still receive it

This closes the gap between already-distributed auth/session storage and hub delivery once multiple replicas exist.

### Translation Boundary

Keep translation from backend integration events to frontend realtime events inside the portal boundary. The Angular app should not need to understand MassTransit message topology, backend namespaces, or transport-specific event names.

## Frontend Design

### Shared Transport Layer

Create `PortalSignalRService` under `src/app/core/realtime/`. It owns:

- hub URL construction
- connection start/stop
- reconnect policy
- auth-aware lifecycle
- connection status
- inbound raw envelope stream

It must start only after auth initialization completes and the user is authenticated. It must stop and clear subscriptions on logout.

### Domain Adapter Layer

Create `ExpensesSignalRService` under `src/app/features/expenses/services/` as the expenses-domain adapter over the shared portal connection. The boundaries plugin already allows `+store/` and containers to import from `features/<feature>/services/`, so this placement does not require any boundary-rule changes.

It owns:

- filtering portal envelopes to the expenses domain
- mapping envelope payloads into typed frontend events
- exposing streams or signals for:
  - account events
  - expense events
  - budget events
  - `CommandFailed`

This service is where a future second domain can be added without touching the shared connection service.

### Signal Store Integration

Do not create one global realtime store. Instead, add store features that integrate SignalR with each existing domain store.

Recommended features:

- `withExpensesSignalR(...)`
- `withAccountsSignalR(...)`
- `withBudgetSignalR(...)`

Each feature should:

- inject the relevant domain SignalR service
- subscribe to typed domain events
- map those events into reducer updates or internal store events
- reconcile pending commands for that store only

This preserves current store boundaries:

- page events represent user intent
- API events represent HTTP results
- SignalR-driven events represent authoritative async completion

### Pending Command Handling

The accounts store already has a simple `commandStatus` flag with values `idle`, `submitting`, `accepted`, and `failed`. That flag is the seed of the richer pending-command model described here and will be replaced by it rather than run in parallel — no store should carry two overlapping status concepts. Introducing `withAccountsSignalR(...)` is the point at which the existing flag is removed in favor of pending entries.

Each store that sends async commands should track pending entries with enough data to reconcile later. A pending entry should include:

- command kind
- correlation id (required for 202 flows, read from the response body)
- entity id when known
- creation timestamp
- UI status such as `pending`, `failed`, or `delayed`

Stores should key pending entries by correlation id so that lookups on SignalR arrival are O(1) and unambiguous across concurrent commands.

Store behavior:

- HTTP command sent
- if response is `202`, record pending command state
- do not mutate authoritative entity state
- wait for SignalR success or `CommandFailed`
- on success, apply authoritative state change and clear the pending item
- on failure, clear or mark the pending item failed and expose the error

### UX Rules

For `202 Accepted` flows:

- keep current business data visible until confirmation arrives
- show command progress in the relevant view
- disable duplicate submissions where appropriate
- allow forms to close after acceptance only if the parent view clearly shows pending state
- if confirmation takes too long, mark the command as delayed instead of silently hanging

This gives users clear feedback without pretending the backend state has already changed.

## SignalR + Signal Store Flow

The intended flow is:

1. User triggers a page event in a feature store.
2. Store event handler sends the HTTP command.
3. Backend responds with `202 Accepted`.
4. Store records pending command state.
5. Portal later emits a stable expenses-domain SignalR envelope.
6. `ExpensesSignalRService` translates the envelope into a typed domain event.
7. The corresponding `withExpensesSignalR(...)`, `withAccountsSignalR(...)`, or `withBudgetSignalR(...)` store feature applies the authoritative update and resolves pending state.

This keeps transport, domain translation, and domain state clearly separated.

## Failure Modes and Recovery

### Connection Loss

The shared SignalR transport should expose `connecting`, `connected`, `reconnecting`, and `disconnected` states. Feature UIs should not each invent their own connection model.

### Reconnect Catch-Up

Per-user fanout only reaches currently-connected clients. Events emitted while a client is disconnected are lost to that client, and the portal does not replay missed events.

On the `reconnected` transport state, each active domain adapter should re-fetch the state the user is looking at. For expenses that means dispatching the existing `opened` page events so the normal HTTP load runs again and the store converges on authoritative backend state. Brief UI drift during the disconnected window is acceptable; the reconnect refresh is the catch-up mechanism.

Pending commands created before the disconnect are handled by the existing delayed-timeout rule: if no confirmation arrives after the timeout expires, the command is marked delayed and the user can retry.

### Multi-Tab Idempotency

A single user may be connected from several tabs or devices simultaneously, and the same envelope is delivered to each connection. Reconnects may also cause the server to redeliver an event the client already applied. Each store should track recently applied `eventId`s (bounded set per entity, or a small ring buffer per domain) and drop envelopes whose id has already been applied. The envelope's `eventId` is the single dedupe key; stores should not attempt to dedupe by payload shape or timestamp.

### Missing Confirmation

If a `202` command is accepted but no success or failure SignalR event arrives within a configured timeout window, mark the command `delayed`. Do not silently leave the UI in a permanent pending state.

The default timeout is 10 seconds. It is configurable per store so that commands with different expected latencies can opt into shorter or longer windows, but stores should not invent their own default.

### Logout/Auth Reset

On logout:

- stop the hub connection
- clear transport subscriptions
- clear pending command state that is no longer valid in the logged-out session

### Multi-Store Interest

If one backend event matters to multiple stores, the domain SignalR adapter fans it out. Stores should remain focused on their own state slices instead of reaching into each other.

## Testing Strategy

### Backend

- verify portal event translation from backend events to client envelopes
- verify authenticated hub access
- verify per-user routing remains correct
- verify distributed SignalR configuration wiring
- verify cross-instance delivery: run two portal instances against a shared Redis backplane, connect a client to instance A, publish an event that lands on instance B, and assert the client receives it
- add at least one test that exercises event delivery through the stabilized client contract rather than raw CLR naming

### Frontend

- unit test `PortalSignalRService` lifecycle and reconnect behavior
- unit test `ExpensesSignalRService` envelope-to-domain translation
- unit test `withExpensesSignalR(...)`, `withAccountsSignalR(...)`, and `withBudgetSignalR(...)`
- test pending-command success reconciliation
- test `CommandFailed` reconciliation
- test delayed timeout behavior for missing confirmations

### Integration Coverage

Add one higher-level frontend integration path where:

- a store issues a write command
- HTTP returns `202`
- pending state appears
- a mocked SignalR event arrives
- the store applies the authoritative update and clears pending state

## Rollout Strategy

Implement in phases:

1. Stabilize backend SignalR delivery and client-facing envelope contract, including `eventId` on every envelope and `correlationId` in the `202 Accepted` response body.
2. Add the Redis SignalR backplane in the portal so replica-safe delivery is in place before Kubernetes rollout.
3. Add shared frontend transport service under `core/realtime/`.
4. Add expenses-domain adapter service under `features/expenses/services/`.
5. Integrate SignalR into expenses, accounts, and budget stores through `withSthSignalR(...)` features, and replace the existing `commandStatus` flag with the pending-command model in the same step.
6. Remove the optimistic mutations currently applied in expenses HTTP event handlers once SignalR confirmation is the authoritative path.
7. Add timeout with the 10-second default, delayed-command UX, and reconnect refresh behavior.
8. Expand to other domains only after the expenses path is stable.

## Success Criteria

The design is successful when:

- multi-replica portal deployments on Kubernetes deliver realtime events reliably through the Redis backplane
- Angular uses one shared SignalR connection per authenticated session
- expenses-domain stores update only from authoritative SignalR completion for `202` flows
- pending command UX is visible and recoverable
- a second domain can be added by introducing a new domain adapter and store features without changing the shared transport layer
