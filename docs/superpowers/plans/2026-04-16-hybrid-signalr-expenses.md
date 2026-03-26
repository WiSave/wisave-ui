# Hybrid SignalR Expenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver authoritative expenses-domain entity events to the Angular client over SignalR. HTTP 202 clears submit state / closes dialog as today. SignalR events deliver new/updated/removed entities (client re-fetches by id through existing HTTP + mapper path). `CommandFailed` surfaces as a generic toast. Redis backplane prepares for multi-replica Kubernetes rollout.

**Architecture:** The portal wraps each MassTransit integration event into a `RealtimeEnvelope` carrying `{ eventId, domain, eventType, entityId, payload }` — **no `correlationId`**. A Redis SignalR backplane makes hub delivery replica-safe. Frontend runs one `PortalSignalRService` (core transport, auth-gated with initial-connect retry) plus one `ExpensesSignalRService` (domain adapter). Each store has a `with*SignalR(...)` feature that reacts to entity events by re-fetching the affected entity through the existing `getById` service (the mapper runs as normal); deletes just remove by id. Commands keep the current `commandStatus` semantics — no per-command pending map, no correlationId matching. `CommandFailed` envelopes are surfaced via a core notification service as a generic toast. Optimistic expense mutations are deleted; the loading indicator + 202 + SignalR path becomes the only authoritative write flow.

**Tech Stack:** .NET 10, ASP.NET SignalR, MassTransit 8, `Microsoft.AspNetCore.SignalR.StackExchangeRedis`, xUnit v3 (portal), Angular 21 zoneless, NgRx Signal Store (`@ngrx/signals`) + `@ngrx/signals/events`, `@microsoft/signalr` 10, PrimeNG for toast.

**Source spec:** [docs/superpowers/specs/2026-04-15-hybrid-signalr-expenses-design.md](../specs/2026-04-15-hybrid-signalr-expenses-design.md)

**Repos touched:**
- `/Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-portal` (envelope, consumer, backplane)
- `/Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-ui` (transport, adapter, per-store features, remove optimistic mutations)

**`wisave-expenses` is not modified.** No correlationId plumbing, no contract changes. The event-sourced forwarder keeps emitting events as-is; the portal's envelope just wraps them.

---

## File Structure

### Backend — `wisave-portal`
- Create: `src/WiSave.Portal/Hubs/Realtime/RealtimeEnvelope.cs`
- Create: `src/WiSave.Portal/Hubs/Realtime/RealtimeEventType.cs`
- Modify: `src/WiSave.Portal/Messaging/NotificationConsumer.cs` — emit envelopes on single `realtimeEvent` method
- Modify: `src/WiSave.Portal/Hubs/Extensions.cs` — accept `IConfiguration`, wire Redis backplane
- Modify: `src/WiSave.Portal/WiSave.Portal.csproj` — add `Microsoft.AspNetCore.SignalR.StackExchangeRedis`
- Modify: `src/WiSave.Portal/Program.cs` — pass `builder.Configuration` to `AddPortalSignalR`
- Create: `tests/WiSave.Portal.UnitTests/Messaging/NotificationConsumerEnvelopeTests.cs`
- Create: `tests/WiSave.Portal.UnitTests/Hubs/SignalRBackplaneRegistrationTests.cs`
- Create: `tests/WiSave.Portal.IntegrationTests/Hubs/RedisBackplaneCrossInstanceTests.cs` (reuses authenticated hub + bus helpers from `ConsumerSignalRTests.cs`)

### Frontend — `wisave-ui`
- Create: `src/app/core/realtime/realtime-envelope.types.ts`
- Create: `src/app/core/realtime/connection-status.types.ts`
- Create: `src/app/core/realtime/portal-signalr.service.ts`
- Create: `src/app/core/realtime/portal-signalr.service.spec.ts`
- Create: `src/app/features/expenses/types/expenses-signalr.types.ts`
- Create: `src/app/features/expenses/services/expenses-signalr.service.ts`
- Create: `src/app/features/expenses/services/expenses-signalr.service.spec.ts`
- Create: `src/app/features/expenses/+store/expenses/with-expenses-signalr.feature.ts`
- Create: `src/app/features/expenses/+store/expenses/with-expenses-signalr.feature.spec.ts`
- Create: `src/app/features/expense-accounts/+store/accounts/with-accounts-signalr.feature.ts`
- Create: `src/app/features/expense-accounts/+store/accounts/with-accounts-signalr.feature.spec.ts`
- Create: `src/app/features/expense-budget/+store/budget/with-budget-signalr.feature.ts`
- Create: `src/app/features/expense-budget/+store/budget/with-budget-signalr.feature.spec.ts`
- Modify: `src/app/features/expenses/+store/expenses/expenses.event-handlers.ts` — delete optimistic add/update/remove; dispatch refetch events
- Modify: `src/app/features/expenses/+store/expenses/expenses.events.ts` — add `*FromRealtime` / `refetched` events; delete old optimistic `*Success` events that embedded fake entities
- Modify: `src/app/features/expenses/+store/expenses/expenses.store.ts` — update reducer
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.events.ts` — add `*FromRealtime` + `refetchedAccount` events
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.store.ts` — wire feature; reducer additions (keep existing `commandStatus`)
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts` — react to `*FromRealtime` by re-fetching
- Modify: `src/app/features/expense-budget/+store/budget/budget.events.ts` / `budget.store.ts` / `budget.event-handlers.ts` — same pattern as accounts

**Not modified:** `AccountsCommandStatus` stays. No `pendingCommands`. API services signatures unchanged (no correlationId in response).

---

## Phase 1 — Backend: envelope + consumer

### Task 1: Define `RealtimeEnvelope` and `RealtimeEventType`

**Files:**
- Create: `wisave-portal/src/WiSave.Portal/Hubs/Realtime/RealtimeEnvelope.cs`
- Create: `wisave-portal/src/WiSave.Portal/Hubs/Realtime/RealtimeEventType.cs`
- Create: `wisave-portal/tests/WiSave.Portal.UnitTests/Hubs/Realtime/RealtimeEnvelopeTests.cs`

- [ ] **Step 1.1: Write failing test for envelope shape**

```csharp
// wisave-portal/tests/WiSave.Portal.UnitTests/Hubs/Realtime/RealtimeEnvelopeTests.cs
using System.Text.Json;
using WiSave.Portal.Hubs.Realtime;
using Xunit;

namespace WiSave.Portal.UnitTests.Hubs.Realtime;

public class RealtimeEnvelopeTests
{
    [Fact]
    public void Envelope_serializes_with_camelCase_contract_fields()
    {
        var env = new RealtimeEnvelope(
            EventId: Guid.CreateVersion7(),
            Domain: "expenses",
            EventType: RealtimeEventType.ExpenseRecorded,
            OccurredAt: new DateTime(2026, 4, 16, 12, 0, 0, DateTimeKind.Utc),
            EntityId: "expense-123",
            Payload: new { amount = 100 });

        var json = JsonSerializer.Serialize(env, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        Assert.Contains("\"eventId\"", json);
        Assert.Contains("\"domain\":\"expenses\"", json);
        Assert.Contains("\"eventType\":\"expense.recorded\"", json);
        Assert.Contains("\"entityId\":\"expense-123\"", json);
        Assert.Contains("\"payload\"", json);
        Assert.DoesNotContain("\"correlationId\"", json);
    }

    [Fact]
    public void Envelope_allows_null_entityId()
    {
        var env = new RealtimeEnvelope(
            EventId: Guid.CreateVersion7(),
            Domain: "expenses",
            EventType: RealtimeEventType.CommandFailed,
            OccurredAt: DateTime.UtcNow,
            EntityId: null,
            Payload: new { });

        Assert.Null(env.EntityId);
    }
}
```

- [ ] **Step 1.2: Run — confirm compile failure**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-portal
dotnet test tests/WiSave.Portal.UnitTests --filter "FullyQualifiedName~RealtimeEnvelopeTests"
```

- [ ] **Step 1.3: Create `RealtimeEventType`**

```csharp
// wisave-portal/src/WiSave.Portal/Hubs/Realtime/RealtimeEventType.cs
namespace WiSave.Portal.Hubs.Realtime;

public static class RealtimeEventType
{
    public const string AccountOpened = "account.opened";
    public const string AccountUpdated = "account.updated";
    public const string AccountClosed = "account.closed";
    public const string ExpenseRecorded = "expense.recorded";
    public const string ExpenseUpdated = "expense.updated";
    public const string ExpenseDeleted = "expense.deleted";
    public const string BudgetCreated = "budget.created";
    public const string BudgetCopiedFromPrevious = "budget.copiedFromPrevious";
    public const string OverallLimitSet = "budget.overallLimitSet";
    public const string CategoryLimitSet = "budget.categoryLimitSet";
    public const string CategoryLimitRemoved = "budget.categoryLimitRemoved";
    public const string CommandFailed = "command.failed";
}
```

- [ ] **Step 1.4: Create `RealtimeEnvelope` record**

```csharp
// wisave-portal/src/WiSave.Portal/Hubs/Realtime/RealtimeEnvelope.cs
namespace WiSave.Portal.Hubs.Realtime;

public record RealtimeEnvelope(
    Guid EventId,
    string Domain,
    string EventType,
    DateTime OccurredAt,
    string? EntityId,
    object Payload);
```

- [ ] **Step 1.5: Run — confirm green**

```bash
dotnet test tests/WiSave.Portal.UnitTests --filter "FullyQualifiedName~RealtimeEnvelopeTests"
```

- [ ] **Step 1.6: Commit**

```bash
git add src/WiSave.Portal/Hubs/Realtime tests/WiSave.Portal.UnitTests/Hubs/Realtime
git commit -m "feat(hubs): add realtime envelope DTO and event type constants"
```

---

### Task 2: Update `NotificationConsumer` to emit envelopes via single `realtimeEvent` method

**Files:**
- Modify: `wisave-portal/src/WiSave.Portal/Messaging/NotificationConsumer.cs`
- Create: `wisave-portal/tests/WiSave.Portal.UnitTests/Messaging/NotificationConsumerEnvelopeTests.cs`

- [ ] **Step 2.1: Write failing test**

```csharp
// wisave-portal/tests/WiSave.Portal.UnitTests/Messaging/NotificationConsumerEnvelopeTests.cs
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NSubstitute;
using WiSave.Expenses.Contracts.Events.Expenses;
using WiSave.Expenses.Contracts.Models;
using WiSave.Portal.Hubs;
using WiSave.Portal.Hubs.Realtime;
using WiSave.Portal.Messaging;
using Xunit;

namespace WiSave.Portal.UnitTests.Messaging;

public class NotificationConsumerEnvelopeTests
{
    [Fact]
    public async Task ExpenseRecorded_sent_as_realtimeEvent_envelope_with_entityId()
    {
        var hub = Substitute.For<IHubContext<NotificationsHub>>();
        var clients = Substitute.For<IHubClients>();
        var group = Substitute.For<IClientProxy>();
        hub.Clients.Returns(clients);
        clients.Group(Arg.Any<string>()).Returns(group);

        var consumer = new NotificationConsumer(hub);
        var userId = Guid.NewGuid().ToString();
        var expenseId = Guid.NewGuid().ToString();

        var msg = new ExpenseRecorded(
            ExpenseId: expenseId, UserId: userId, AccountId: "acc-1",
            CategoryId: "cat-1", SubcategoryId: null,
            Amount: 10m, Currency: Currency.PLN,
            Date: DateOnly.FromDateTime(DateTime.UtcNow), Description: "x",
            Recurring: false, Metadata: null, Timestamp: DateTimeOffset.UtcNow);

        var ctx = Substitute.For<ConsumeContext<ExpenseRecorded>>();
        ctx.Message.Returns(msg);
        ctx.CancellationToken.Returns(CancellationToken.None);

        await consumer.Consume(ctx);

        await group.Received(1).SendCoreAsync(
            "realtimeEvent",
            Arg.Is<object?[]>(args =>
                args.Length == 1 &&
                args[0] is RealtimeEnvelope env &&
                env.Domain == "expenses" &&
                env.EventType == RealtimeEventType.ExpenseRecorded &&
                env.EntityId == expenseId),
            Arg.Any<CancellationToken>());

        clients.Received().Group(userId);
    }
}
```

- [ ] **Step 2.2: Run — confirm failure**

```bash
dotnet test tests/WiSave.Portal.UnitTests --filter "FullyQualifiedName~NotificationConsumerEnvelopeTests"
```

- [ ] **Step 2.3: Update `Messaging/NotificationConsumer.cs`**

```csharp
// wisave-portal/src/WiSave.Portal/Messaging/NotificationConsumer.cs
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using WiSave.Expenses.Contracts.Events;
using WiSave.Expenses.Contracts.Events.Accounts;
using WiSave.Expenses.Contracts.Events.Budgets;
using WiSave.Expenses.Contracts.Events.Expenses;
using WiSave.Portal.Hubs;
using WiSave.Portal.Hubs.Realtime;

namespace WiSave.Portal.Messaging;

public class NotificationConsumer(IHubContext<NotificationsHub> hub) :
    IConsumer<AccountOpened>, IConsumer<AccountUpdated>, IConsumer<AccountClosed>,
    IConsumer<ExpenseRecorded>, IConsumer<ExpenseUpdated>, IConsumer<ExpenseDeleted>,
    IConsumer<BudgetCreated>, IConsumer<BudgetCopiedFromPrevious>,
    IConsumer<OverallLimitSet>, IConsumer<CategoryLimitSet>, IConsumer<CategoryLimitRemoved>,
    IConsumer<CommandFailed>
{
    public Task Consume(ConsumeContext<AccountOpened> ctx) =>
        Push(ctx, RealtimeEventType.AccountOpened, ctx.Message.UserId, ctx.Message.AccountId);

    public Task Consume(ConsumeContext<AccountUpdated> ctx) =>
        Push(ctx, RealtimeEventType.AccountUpdated, ctx.Message.UserId, ctx.Message.AccountId);

    public Task Consume(ConsumeContext<AccountClosed> ctx) =>
        Push(ctx, RealtimeEventType.AccountClosed, ctx.Message.UserId, ctx.Message.AccountId);

    public Task Consume(ConsumeContext<ExpenseRecorded> ctx) =>
        Push(ctx, RealtimeEventType.ExpenseRecorded, ctx.Message.UserId, ctx.Message.ExpenseId);

    public Task Consume(ConsumeContext<ExpenseUpdated> ctx) =>
        Push(ctx, RealtimeEventType.ExpenseUpdated, ctx.Message.UserId, ctx.Message.ExpenseId);

    public Task Consume(ConsumeContext<ExpenseDeleted> ctx) =>
        Push(ctx, RealtimeEventType.ExpenseDeleted, ctx.Message.UserId, ctx.Message.ExpenseId);

    public Task Consume(ConsumeContext<BudgetCreated> ctx) =>
        Push(ctx, RealtimeEventType.BudgetCreated, ctx.Message.UserId, ctx.Message.BudgetId);

    public Task Consume(ConsumeContext<BudgetCopiedFromPrevious> ctx) =>
        Push(ctx, RealtimeEventType.BudgetCopiedFromPrevious, ctx.Message.UserId, ctx.Message.BudgetId);

    public Task Consume(ConsumeContext<OverallLimitSet> ctx) =>
        Push(ctx, RealtimeEventType.OverallLimitSet, ctx.Message.UserId, ctx.Message.BudgetId);

    public Task Consume(ConsumeContext<CategoryLimitSet> ctx) =>
        Push(ctx, RealtimeEventType.CategoryLimitSet, ctx.Message.UserId, ctx.Message.BudgetId);

    public Task Consume(ConsumeContext<CategoryLimitRemoved> ctx) =>
        Push(ctx, RealtimeEventType.CategoryLimitRemoved, ctx.Message.UserId, ctx.Message.BudgetId);

    public Task Consume(ConsumeContext<CommandFailed> ctx) =>
        Push(ctx, RealtimeEventType.CommandFailed, ctx.Message.UserId, entityId: null);

    private Task Push<T>(ConsumeContext<T> ctx, string eventType, string userId, string? entityId)
        where T : class
    {
        var env = new RealtimeEnvelope(
            EventId: Guid.CreateVersion7(),
            Domain: "expenses",
            EventType: eventType,
            OccurredAt: DateTime.UtcNow,
            EntityId: entityId,
            Payload: ctx.Message!);
        return hub.Clients.Group(userId).SendAsync("realtimeEvent", env, ctx.CancellationToken);
    }
}
```

- [ ] **Step 2.4: Run — confirm green**

```bash
dotnet test tests/WiSave.Portal.UnitTests
```

- [ ] **Step 2.5: Commit**

```bash
git add src/WiSave.Portal/Messaging/NotificationConsumer.cs tests/WiSave.Portal.UnitTests/Messaging/NotificationConsumerEnvelopeTests.cs
git commit -m "feat(hubs): emit realtime envelopes on single realtimeEvent hub method"
```

---

## Phase 2 — Backend: Redis SignalR backplane

### Task 3: Add Redis backplane package + wire it up

**Files:**
- Modify: `wisave-portal/src/WiSave.Portal/WiSave.Portal.csproj`
- Modify: `wisave-portal/src/WiSave.Portal/Hubs/Extensions.cs`
- Modify: `wisave-portal/src/WiSave.Portal/Program.cs`
- Create: `wisave-portal/tests/WiSave.Portal.UnitTests/Hubs/SignalRBackplaneRegistrationTests.cs`

- [ ] **Step 3.1: Failing test**

```csharp
// wisave-portal/tests/WiSave.Portal.UnitTests/Hubs/SignalRBackplaneRegistrationTests.cs
using Microsoft.AspNetCore.SignalR.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using WiSave.Portal.Hubs;
using Xunit;

namespace WiSave.Portal.UnitTests.Hubs;

public class SignalRBackplaneRegistrationTests
{
    [Fact]
    public void AddPortalSignalR_wires_Redis_backplane_when_connection_string_present()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Redis:ConnectionString"] = "localhost:6379" })
            .Build();

        services.AddPortalSignalR(config);

        var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptions<RedisOptions>>();
        Assert.NotNull(options.Value.Configuration);
    }

    [Fact]
    public void AddPortalSignalR_runs_without_backplane_when_connection_string_absent()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();

        var ex = Record.Exception(() => services.AddPortalSignalR(config));
        Assert.Null(ex);
    }
}
```

- [ ] **Step 3.2: Run — confirm failure.**

- [ ] **Step 3.3: Add the NuGet package**

```xml
<!-- wisave-portal/src/WiSave.Portal/WiSave.Portal.csproj -->
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="10.0.6" />
```

- [ ] **Step 3.4: Update `AddPortalSignalR`**

```csharp
// wisave-portal/src/WiSave.Portal/Hubs/Extensions.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace WiSave.Portal.Hubs;

public static class Extensions
{
    public static IServiceCollection AddPortalSignalR(this IServiceCollection services, IConfiguration configuration)
    {
        var builder = services.AddSignalR();

        var redisConnection = configuration["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            builder.AddStackExchangeRedis(redisConnection, options =>
            {
                options.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("WiSave.SignalR");
            });
        }

        return services;
    }

    public static IEndpointRouteBuilder MapPortalHubs(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHub<NotificationsHub>("/hubs/notifications");
        return endpoints;
    }
}
```

- [ ] **Step 3.5: Update `Program.cs`**

```csharp
// wisave-portal/src/WiSave.Portal/Program.cs — replace AddPortalSignalR call
builder.Services.AddPortalSignalR(builder.Configuration);
```

- [ ] **Step 3.6: Run — confirm green. Commit.**

```bash
dotnet test tests/WiSave.Portal.UnitTests
git add src/WiSave.Portal/WiSave.Portal.csproj src/WiSave.Portal/Hubs/Extensions.cs src/WiSave.Portal/Program.cs tests/WiSave.Portal.UnitTests/Hubs/SignalRBackplaneRegistrationTests.cs
git commit -m "feat(hubs): wire Redis SignalR backplane behind Redis:ConnectionString"
```

---

### Task 4: Cross-instance integration test

**Files:**
- Create: `wisave-portal/tests/WiSave.Portal.IntegrationTests/Hubs/RedisBackplaneCrossInstanceTests.cs`

- [ ] **Step 4.1: Read `tests/WiSave.Portal.IntegrationTests/.../ConsumerSignalRTests.cs` lines 75–209 and identify the authenticated hub-client helper and the bus publish helper.**

- [ ] **Step 4.2: Write the test by reusing those helpers**

Structure: build two `WebApplicationFactory<Program>` instances both configured with `Redis:ConnectionString`. Connect the authenticated client to instance B. Publish an `ExpenseRecorded` through instance A's bus helper. Assert the client receives a `realtimeEvent` envelope with `eventType == "expense.recorded"` within a 15s timeout. Use the real string-based contract shapes.

Do **not** invent parallel test auth / harness plumbing — reuse the existing helpers.

- [ ] **Step 4.3: Run with Redis up**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-portal
docker compose up -d redis
dotnet test tests/WiSave.Portal.IntegrationTests --filter "FullyQualifiedName~RedisBackplaneCrossInstanceTests"
```

- [ ] **Step 4.4: Commit**

```bash
git add tests/WiSave.Portal.IntegrationTests/Hubs/RedisBackplaneCrossInstanceTests.cs
git commit -m "test(hubs): cross-instance envelope delivery via Redis backplane"
```

---

## Phase 3 — Frontend: core realtime transport

### Task 5: Envelope + connection-status types

**Files:**
- Create: `wisave-ui/src/app/core/realtime/realtime-envelope.types.ts`
- Create: `wisave-ui/src/app/core/realtime/connection-status.types.ts`

- [ ] **Step 5.1: Create envelope type**

```typescript
// src/app/core/realtime/realtime-envelope.types.ts
export interface IRealtimeEnvelope<TPayload = unknown> {
  eventId: string;
  domain: string;
  eventType: string;
  occurredAt: string;
  entityId: string | null;
  payload: TPayload;
}

export const REALTIME_HUB_METHOD = 'realtimeEvent' as const;
```

- [ ] **Step 5.2: Create connection-status type**

```typescript
// src/app/core/realtime/connection-status.types.ts
export type TConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
```

- [ ] **Step 5.3: Commit**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-ui
git add src/app/core/realtime
git commit -m "feat(realtime): add envelope and connection-status types"
```

---

### Task 6: `PortalSignalRService` with auth-gated lifecycle + initial-connect retry

**Files:**
- Create: `wisave-ui/src/app/core/realtime/portal-signalr.service.ts`
- Create: `wisave-ui/src/app/core/realtime/portal-signalr.service.spec.ts`

- [ ] **Step 6.1: Failing tests**

```typescript
// src/app/core/realtime/portal-signalr.service.spec.ts
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PortalSignalRService } from './portal-signalr.service';
import { AuthService } from '@core/services/auth/auth.service';

describe('PortalSignalRService', () => {
  let auth: { isAuthenticated: ReturnType<typeof signal>; isInitialized: ReturnType<typeof signal> };

  beforeEach(() => {
    auth = { isAuthenticated: signal(false), isInitialized: signal(false) };
    TestBed.configureTestingModule({
      providers: [PortalSignalRService, { provide: AuthService, useValue: auth }],
    });
  });

  it('starts in idle status', () => {
    expect(TestBed.inject(PortalSignalRService).status()).toBe('idle');
  });

  it('does not connect while auth is uninitialized', () => {
    const svc = TestBed.inject(PortalSignalRService);
    auth.isAuthenticated.set(true);
    expect(svc.status()).toBe('idle');
  });

  it('stops and returns to idle on logout', fakeAsync(() => {
    const svc = TestBed.inject(PortalSignalRService);
    auth.isInitialized.set(true);
    auth.isAuthenticated.set(true);
    tick();
    auth.isAuthenticated.set(false);
    tick();
    expect(svc.status()).toBe('idle');
  }));
});
```

- [ ] **Step 6.2: Run — confirm failure.**

- [ ] **Step 6.3: Implement**

```typescript
// src/app/core/realtime/portal-signalr.service.ts
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject, type Observable } from 'rxjs';

import { AuthService } from '@core/services/auth/auth.service';
import { getApiBaseUrl } from '@core/config/runtime-config';

import { REALTIME_HUB_METHOD, type IRealtimeEnvelope } from './realtime-envelope.types';
import type { TConnectionStatus } from './connection-status.types';

const INITIAL_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PortalSignalRService {
  readonly #auth = inject(AuthService);
  readonly #status = signal<TConnectionStatus>('idle');
  readonly #messages$ = new Subject<IRealtimeEnvelope>();
  #connection: HubConnection | null = null;
  #retryHandle: ReturnType<typeof setTimeout> | null = null;
  #retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
  #shouldBeConnected = false;

  readonly status = computed(() => this.#status());
  readonly messages$: Observable<IRealtimeEnvelope> = this.#messages$.asObservable();

  constructor() {
    effect(() => {
      const initialized = this.#auth.isInitialized();
      const authed = this.#auth.isAuthenticated();

      if (initialized && authed) {
        this.#shouldBeConnected = true;
        if (!this.#connection && !this.#retryHandle) void this.#start();
      } else {
        this.#shouldBeConnected = false;
        this.#clearRetry();
        if (this.#connection) void this.#stop();
      }
    });
  }

  async #start(): Promise<void> {
    this.#status.set('connecting');
    const hubUrl = `${getApiBaseUrl().replace(/\/api$/, '')}/hubs/notifications`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => this.#status.set('reconnecting'));
    connection.onreconnected(() => {
      this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
      this.#status.set('connected');
    });
    connection.onclose(() => {
      this.#status.set('disconnected');
      this.#connection = null;
      if (this.#shouldBeConnected) this.#scheduleRetry();
    });

    connection.on(REALTIME_HUB_METHOD, (env: IRealtimeEnvelope) => this.#messages$.next(env));

    try {
      await connection.start();
      if (connection.state === HubConnectionState.Connected) {
        this.#connection = connection;
        this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
        this.#status.set('connected');
      } else {
        this.#status.set('disconnected');
        if (this.#shouldBeConnected) this.#scheduleRetry();
      }
    } catch {
      this.#connection = null;
      this.#status.set('disconnected');
      if (this.#shouldBeConnected) this.#scheduleRetry();
    }
  }

  #scheduleRetry(): void {
    if (this.#retryHandle) return;
    const delay = this.#retryDelayMs;
    this.#retryDelayMs = Math.min(this.#retryDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    this.#retryHandle = setTimeout(() => {
      this.#retryHandle = null;
      if (this.#shouldBeConnected && !this.#connection) void this.#start();
    }, delay);
  }

  #clearRetry(): void {
    if (this.#retryHandle) {
      clearTimeout(this.#retryHandle);
      this.#retryHandle = null;
    }
    this.#retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
  }

  async #stop(): Promise<void> {
    const conn = this.#connection;
    this.#connection = null;
    this.#clearRetry();
    if (conn) {
      try { await conn.stop(); } catch { /* ignore */ }
    }
    this.#status.set('idle');
  }
}
```

- [ ] **Step 6.4: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/core/realtime/portal-signalr.service.spec.ts
git add src/app/core/realtime/portal-signalr.service.ts src/app/core/realtime/portal-signalr.service.spec.ts
git commit -m "feat(realtime): PortalSignalRService with auth-gated lifecycle and initial-connect retry"
```

---

## Phase 4 — Frontend: expenses domain adapter

### Task 7: Expenses realtime event types

**Files:**
- Create: `wisave-ui/src/app/features/expenses/types/expenses-signalr.types.ts`

- [ ] **Step 7.1: Create the type file**

```typescript
// src/app/features/expenses/types/expenses-signalr.types.ts
import type { IRealtimeEnvelope } from '@core/realtime/realtime-envelope.types';

export const ExpensesEventType = {
  ExpenseRecorded: 'expense.recorded',
  ExpenseUpdated: 'expense.updated',
  ExpenseDeleted: 'expense.deleted',
  AccountOpened: 'account.opened',
  AccountUpdated: 'account.updated',
  AccountClosed: 'account.closed',
  BudgetCreated: 'budget.created',
  BudgetCopiedFromPrevious: 'budget.copiedFromPrevious',
  OverallLimitSet: 'budget.overallLimitSet',
  CategoryLimitSet: 'budget.categoryLimitSet',
  CategoryLimitRemoved: 'budget.categoryLimitRemoved',
  CommandFailed: 'command.failed',
} as const;

export type TExpensesEventType = (typeof ExpensesEventType)[keyof typeof ExpensesEventType];

export type TExpensesEnvelope = IRealtimeEnvelope<unknown> & { domain: 'expenses' };
```

- [ ] **Step 7.2: Commit**

```bash
git add src/app/features/expenses/types/expenses-signalr.types.ts
git commit -m "feat(expenses): add realtime event-type constants"
```

---

### Task 8: `ExpensesSignalRService` — filter + per-type streams

**Files:**
- Create: `wisave-ui/src/app/features/expenses/services/expenses-signalr.service.ts`
- Create: `wisave-ui/src/app/features/expenses/services/expenses-signalr.service.spec.ts`

- [ ] **Step 8.1: Failing test**

```typescript
// src/app/features/expenses/services/expenses-signalr.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PortalSignalRService } from '@core/realtime/portal-signalr.service';
import type { IRealtimeEnvelope } from '@core/realtime/realtime-envelope.types';
import { ExpensesSignalRService } from './expenses-signalr.service';
import { ExpensesEventType } from '../types/expenses-signalr.types';

describe('ExpensesSignalRService', () => {
  let messages$: Subject<IRealtimeEnvelope>;

  beforeEach(() => {
    messages$ = new Subject();
    TestBed.configureTestingModule({
      providers: [
        ExpensesSignalRService,
        { provide: PortalSignalRService, useValue: { messages$: messages$.asObservable() } },
      ],
    });
  });

  it('routes expenses-domain envelopes to their per-type streams', (done) => {
    const svc = TestBed.inject(ExpensesSignalRService);
    svc.expenseRecorded$.subscribe((env) => {
      expect(env.eventType).toBe(ExpensesEventType.ExpenseRecorded);
      expect(env.entityId).toBe('e1');
      done();
    });
    messages$.next({ eventId: 'a', domain: 'other', eventType: ExpensesEventType.ExpenseRecorded, occurredAt: '', entityId: null, payload: {} });
    messages$.next({ eventId: 'b', domain: 'expenses', eventType: ExpensesEventType.ExpenseRecorded, occurredAt: '', entityId: 'e1', payload: {} });
  });
});
```

- [ ] **Step 8.2: Run — confirm failure.**

- [ ] **Step 8.3: Implement**

```typescript
// src/app/features/expenses/services/expenses-signalr.service.ts
import { Injectable, inject } from '@angular/core';
import { filter, share, type Observable } from 'rxjs';

import { PortalSignalRService } from '@core/realtime/portal-signalr.service';
import type { IRealtimeEnvelope } from '@core/realtime/realtime-envelope.types';

import { ExpensesEventType, type TExpensesEventType, type TExpensesEnvelope } from '../types/expenses-signalr.types';

@Injectable({ providedIn: 'root' })
export class ExpensesSignalRService {
  readonly #portal = inject(PortalSignalRService);

  readonly expenses$: Observable<TExpensesEnvelope> = this.#portal.messages$.pipe(
    filter((env): env is TExpensesEnvelope => env.domain === 'expenses'),
    share(),
  );

  readonly expenseRecorded$ = this.#byType(ExpensesEventType.ExpenseRecorded);
  readonly expenseUpdated$ = this.#byType(ExpensesEventType.ExpenseUpdated);
  readonly expenseDeleted$ = this.#byType(ExpensesEventType.ExpenseDeleted);
  readonly accountOpened$ = this.#byType(ExpensesEventType.AccountOpened);
  readonly accountUpdated$ = this.#byType(ExpensesEventType.AccountUpdated);
  readonly accountClosed$ = this.#byType(ExpensesEventType.AccountClosed);
  readonly budgetCreated$ = this.#byType(ExpensesEventType.BudgetCreated);
  readonly budgetCopiedFromPrevious$ = this.#byType(ExpensesEventType.BudgetCopiedFromPrevious);
  readonly overallLimitSet$ = this.#byType(ExpensesEventType.OverallLimitSet);
  readonly categoryLimitSet$ = this.#byType(ExpensesEventType.CategoryLimitSet);
  readonly categoryLimitRemoved$ = this.#byType(ExpensesEventType.CategoryLimitRemoved);
  readonly commandFailed$ = this.#byType(ExpensesEventType.CommandFailed);

  #byType(type: TExpensesEventType): Observable<IRealtimeEnvelope> {
    return this.expenses$.pipe(filter((env) => env.eventType === type));
  }
}
```

- [ ] **Step 8.4: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/features/expenses/services/expenses-signalr.service.spec.ts
git add src/app/features/expenses/services
git commit -m "feat(expenses): add ExpensesSignalRService domain adapter"
```

---

## Phase 5 — Frontend: per-store `with*SignalR` features

### Task 9: Accounts — `with-accounts-signalr.feature.ts` + re-fetch handlers

**Files:**
- Modify: `wisave-ui/src/app/features/expense-accounts/+store/accounts/accounts.events.ts` — add three `*FromRealtime` events + `refetchedAccount` / `refetchFailure`
- Modify: `wisave-ui/src/app/features/expense-accounts/+store/accounts/accounts.store.ts` — add reducers for `accountRemovedFromRealtime` (removeEntity by id) and `refetchedAccount` (setEntity)
- Modify: `wisave-ui/src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts` — react to `*FromRealtime` add/update events with `getById` re-fetch
- Create: `wisave-ui/src/app/features/expense-accounts/+store/accounts/with-accounts-signalr.feature.ts`
- Create: `wisave-ui/src/app/features/expense-accounts/+store/accounts/with-accounts-signalr.feature.spec.ts`

- [ ] **Step 9.1: Add events**

```typescript
// accounts.events.ts — extend accountsApiEvents.events
accountOpenedFromRealtime: type<{ id: string }>(),
accountUpdatedFromRealtime: type<{ id: string }>(),
accountClosedFromRealtime: type<{ id: string }>(),
refetchedAccount: type<{ account: IExpenseAccount }>(),
refetchFailure: type<{ id: string; error: IStoreError }>(),
```

Keep the existing `addAccepted / updateAccepted / removeAccepted / *Failure / loadedSuccess / loadedFailure / selectedAccountLoaded` events unchanged — the existing `commandStatus` lifecycle stays.

- [ ] **Step 9.2: Failing test for the reducer**

```typescript
// accounts.store.spec.ts additions
it('refetchedAccount inserts the entity', () => {
  const store = TestBed.inject(ExpenseAccountsStore);
  TestBed.inject(Dispatcher).dispatch(accountsApiEvents.refetchedAccount({ account: { id: 'a-1', name: 'Checking' } as never }));
  expect(store.entityMap()['a-1'].name).toBe('Checking');
});

it('accountClosedFromRealtime removes the entity', () => {
  const store = TestBed.inject(ExpenseAccountsStore);
  TestBed.inject(Dispatcher).dispatch(accountsApiEvents.refetchedAccount({ account: { id: 'a-2', name: 'Savings' } as never }));
  TestBed.inject(Dispatcher).dispatch(accountsApiEvents.accountClosedFromRealtime({ id: 'a-2' }));
  expect(store.entityMap()['a-2']).toBeUndefined();
});
```

- [ ] **Step 9.3: Add reducer handlers**

```typescript
// accounts.store.ts — inside withTrackedReducer(...)
on(accountsApiEvents.refetchedAccount, ({ payload }) => [setEntity<IExpenseAccount>(payload.account)]),
on(accountsApiEvents.accountClosedFromRealtime, ({ payload }) => [removeEntity<IExpenseAccount>(payload.id)]),
```

(Imports: add `removeEntity` from `@ngrx/signals/entities`.)

- [ ] **Step 9.4: Add re-fetch event handlers**

```typescript
// accounts.event-handlers.ts — append inside withEventHandlers(...)
refetchOnAdded$: store._events.on(accountsApiEvents.accountOpenedFromRealtime).pipe(
  mergeMap(({ payload }) =>
    store._api.getById(payload.id).pipe(
      map((account) => accountsApiEvents.refetchedAccount({ account })),
      catchError((err) => of(accountsApiEvents.refetchFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),

refetchOnUpdated$: store._events.on(accountsApiEvents.accountUpdatedFromRealtime).pipe(
  mergeMap(({ payload }) =>
    store._api.getById(payload.id).pipe(
      map((account) => accountsApiEvents.refetchedAccount({ account })),
      catchError((err) => of(accountsApiEvents.refetchFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),
```

(Imports: add `mergeMap` from `rxjs`.)

- [ ] **Step 9.5: Failing feature test**

```typescript
// with-accounts-signalr.feature.spec.ts
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ExpensesSignalRService } from '@features/expenses/services/expenses-signalr.service';
import { ExpenseAccountsStore } from './accounts.store';
import type { IRealtimeEnvelope } from '@core/realtime/realtime-envelope.types';

describe('withAccountsSignalR', () => {
  let accountOpened$: Subject<IRealtimeEnvelope>;
  let accountUpdated$: Subject<IRealtimeEnvelope>;
  let accountClosed$: Subject<IRealtimeEnvelope>;

  beforeEach(() => {
    accountOpened$ = new Subject();
    accountUpdated$ = new Subject();
    accountClosed$ = new Subject();
    TestBed.configureTestingModule({
      providers: [{ provide: ExpensesSignalRService, useValue: {
        accountOpened$: accountOpened$.asObservable(),
        accountUpdated$: accountUpdated$.asObservable(),
        accountClosed$: accountClosed$.asObservable(),
      } }],
    });
  });

  it('removes the entity when account.closed envelope arrives', () => {
    const store = TestBed.inject(ExpenseAccountsStore);
    // seed
    // (add a stub entity via refetchedAccount or loadedSuccess)
    accountClosed$.next({ eventId: 'e-1', domain: 'expenses', eventType: 'account.closed', occurredAt: '', entityId: 'a-9', payload: {} });
    expect(store.entityMap()['a-9']).toBeUndefined();
  });
});
```

- [ ] **Step 9.6: Implement the feature**

```typescript
// with-accounts-signalr.feature.ts
import { inject } from '@angular/core';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { filter, map } from 'rxjs';

import { ExpensesSignalRService } from '@features/expenses/services/expenses-signalr.service';
import { accountsApiEvents } from './accounts.events';

export function withAccountsSignalR() {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _realtime: inject(ExpensesSignalRService),
    })),
    withEventHandlers((store) => ({
      accountOpened$: store._realtime.accountOpened$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => accountsApiEvents.accountOpenedFromRealtime({ id: env.entityId as string })),
      ),
      accountUpdated$: store._realtime.accountUpdated$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => accountsApiEvents.accountUpdatedFromRealtime({ id: env.entityId as string })),
      ),
      accountClosed$: store._realtime.accountClosed$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => accountsApiEvents.accountClosedFromRealtime({ id: env.entityId as string })),
      ),
    })),
  );
}
```

- [ ] **Step 9.7: Wire into the store**

```typescript
// accounts.store.ts
import { withAccountsSignalR } from './with-accounts-signalr.feature';
// …append after withAccountsEventHandlers():
withAccountsSignalR(),
```

- [ ] **Step 9.8: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/features/expense-accounts/**
git add src/app/features/expense-accounts
git commit -m "feat(accounts): react to realtime envelopes by re-fetching entity state"
```

---

### Task 10: Expenses — remove optimistic mutations + `with-expenses-signalr.feature.ts`

**Files:**
- Modify: `wisave-ui/src/app/features/expenses/+store/expenses/expenses.events.ts` — add `expenseRecordedFromRealtime({ id })`, `expenseUpdatedFromRealtime({ id })`, `expenseDeletedFromRealtime({ id })`, `refetchedExpense({ expense })`, `refetchFailure({ id, error })`; delete the payload from `addedSuccess`/`updatedSuccess`/`removedSuccess` (or remove them entirely, see below)
- Modify: `wisave-ui/src/app/features/expenses/+store/expenses/expenses.event-handlers.ts` — delete optimistic entity fabrication in `addExpense$` / `updateExpense$` / `removeExpense$`; react to `*FromRealtime` with re-fetch; `removeExpense$` still uses `removedSuccess({ id })` on HTTP success to set a loading/submit flag, but the store does NOT remove the entity until the signalr `expenseDeletedFromRealtime` arrives
- Modify: `wisave-ui/src/app/features/expenses/+store/expenses/expenses.store.ts` — replace optimistic reducers with `refetchedExpense` (setEntity) + `expenseDeletedFromRealtime` (removeEntity); keep any HTTP-success reducer that only flips an `isSubmitting` flag
- Modify: `wisave-ui/src/app/features/expenses/+store/expenses/expenses.state.ts` — add `isSubmitting: boolean` if not present
- Create: `wisave-ui/src/app/features/expenses/+store/expenses/with-expenses-signalr.feature.ts`
- Create: `wisave-ui/src/app/features/expenses/+store/expenses/with-expenses-signalr.feature.spec.ts`

- [ ] **Step 10.1: Failing test — `expensesPageEvents.add` does NOT add an entity on HTTP success; only `refetchedExpense` does**

```typescript
it('add does not insert an entity until a refetchedExpense arrives', () => {
  const store = TestBed.inject(ExpensesStore);
  TestBed.inject(Dispatcher).dispatch(expensesPageEvents.add({ expense: { amount: 10 } as never }));
  http.expectOne((r) => r.method === 'POST').flush({}, { status: 202, statusText: 'Accepted' });
  expect(Object.keys(store.entityMap()).length).toBe(0);

  TestBed.inject(Dispatcher).dispatch(expensesApiEvents.expenseRecordedFromRealtime({ id: 'exp-1' }));
  http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/exp-1')).flush({ id: 'exp-1', amount: 10 } as never);
  expect(store.entityMap()['exp-1']).toBeDefined();
});
```

- [ ] **Step 10.2: Update events**

```typescript
// expenses.events.ts — add:
expenseRecordedFromRealtime: type<{ id: string }>(),
expenseUpdatedFromRealtime: type<{ id: string }>(),
expenseDeletedFromRealtime: type<{ id: string }>(),
refetchedExpense: type<{ expense: IExpense }>(),
refetchFailure: type<{ id: string; error: IStoreError }>(),
```

Delete `addedSuccess({ expense })`, `updatedSuccess({ expense })`, `removedSuccess({ id })` if the only consumers are the optimistic reducers being removed. If those events are used for loading-indicator transitions, change their payload to `{}` and keep them for that purpose.

- [ ] **Step 10.3: Update event-handlers — remove optimistic fabrication; add re-fetch handlers**

```typescript
// expenses.event-handlers.ts — replace add/update/remove handlers
addExpense$: props._events.on(expensesPageEvents.add).pipe(
  exhaustMap(({ payload }) =>
    props._api.create(payload.expense).pipe(
      map(() => expensesApiEvents.addedSuccess()),   // payload-less: only resets isSubmitting
      catchError((err) => of(expensesApiEvents.addedFailure({ error: toStoreError(err) }))),
    ),
  ),
),

updateExpense$: props._events.on(expensesPageEvents.update).pipe(
  exhaustMap(({ payload }) =>
    props._api.update(payload.id, payload.changes).pipe(
      map(() => expensesApiEvents.updatedSuccess()),
      catchError((err) => of(expensesApiEvents.updatedFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),

removeExpense$: props._events.on(expensesPageEvents.remove).pipe(
  exhaustMap(({ payload }) =>
    props._api.delete(payload.id).pipe(
      map(() => expensesApiEvents.removedSuccess()),
      catchError((err) => of(expensesApiEvents.removedFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),

refetchOnRecorded$: props._events.on(expensesApiEvents.expenseRecordedFromRealtime).pipe(
  mergeMap(({ payload }) =>
    props._api.getById(asExpenseId(payload.id)).pipe(
      map((expense) => expensesApiEvents.refetchedExpense({ expense: expense! })),
      catchError((err) => of(expensesApiEvents.refetchFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),

refetchOnUpdatedRt$: props._events.on(expensesApiEvents.expenseUpdatedFromRealtime).pipe(
  mergeMap(({ payload }) =>
    props._api.getById(asExpenseId(payload.id)).pipe(
      map((expense) => expensesApiEvents.refetchedExpense({ expense: expense! })),
      catchError((err) => of(expensesApiEvents.refetchFailure({ id: payload.id, error: toStoreError(err) }))),
    ),
  ),
),
```

- [ ] **Step 10.4: Update reducer in `expenses.store.ts`**

```typescript
// Replace the old optimistic reducers with:
on(expensesApiEvents.refetchedExpense, ({ payload }) => [setEntity<IExpense>(payload.expense)]),
on(expensesApiEvents.expenseDeletedFromRealtime, ({ payload }) => [removeEntity<IExpense>(asExpenseId(payload.id))]),
```

If `isSubmitting` was added, wire it in the add/update/remove page events and reset on `addedSuccess`/`updatedSuccess`/`removedSuccess`/`*Failure`.

- [ ] **Step 10.5: Implement `with-expenses-signalr.feature.ts`**

```typescript
// with-expenses-signalr.feature.ts
import { inject } from '@angular/core';
import { signalStoreFeature, withProps } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { filter, map } from 'rxjs';

import { ExpensesSignalRService } from '@features/expenses/services/expenses-signalr.service';
import { expensesApiEvents } from './expenses.events';

export function withExpensesSignalR() {
  return signalStoreFeature(
    withProps(() => ({
      _events: inject(Events),
      _realtime: inject(ExpensesSignalRService),
    })),
    withEventHandlers((store) => ({
      expenseRecorded$: store._realtime.expenseRecorded$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => expensesApiEvents.expenseRecordedFromRealtime({ id: env.entityId as string })),
      ),
      expenseUpdated$: store._realtime.expenseUpdated$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => expensesApiEvents.expenseUpdatedFromRealtime({ id: env.entityId as string })),
      ),
      expenseDeleted$: store._realtime.expenseDeleted$.pipe(
        filter((env) => env.entityId !== null),
        map((env) => expensesApiEvents.expenseDeletedFromRealtime({ id: env.entityId as string })),
      ),
    })),
  );
}
```

- [ ] **Step 10.6: Wire into `expenses.store.ts`** — append `withExpensesSignalR()` after `withExpensesEventHandlers(...)`.

- [ ] **Step 10.7: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/features/expenses/**
git add src/app/features/expenses
git commit -m "refactor(expenses): remove optimistic mutations; re-fetch on realtime envelopes"
```

---

### Task 11: Budget — `with-budget-signalr.feature.ts` + re-fetch

**Files (modify + create):**
- `src/app/features/expense-budget/+store/budget/budget.events.ts` — add `budgetCreatedFromRealtime`, `budgetCopiedFromRealtime`, `overallLimitSetFromRealtime`, `categoryLimitSetFromRealtime`, `categoryLimitRemovedFromRealtime`, `refetchedBudget`, `refetchFailure`
- `src/app/features/expense-budget/+store/budget/budget.store.ts` — reducer for `refetchedBudget` + `withBudgetSignalR()`
- `src/app/features/expense-budget/+store/budget/budget.event-handlers.ts` — re-fetch via existing budget getter on each `*FromRealtime` event
- Create: `with-budget-signalr.feature.ts` + `.spec.ts`

- [ ] **Step 11.1: Failing reducer test.**

- [ ] **Step 11.2: Add events, reducer, event-handlers.**

- [ ] **Step 11.3: Implement feature — route `budgetCreated$` / `budgetCopiedFromPrevious$` / `overallLimitSet$` / `categoryLimitSet$` / `categoryLimitRemoved$` envelopes to corresponding `*FromRealtime` store events.**

- [ ] **Step 11.4: Append `withBudgetSignalR()` to the store.**

- [ ] **Step 11.5: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/features/expense-budget/**
git add src/app/features/expense-budget
git commit -m "feat(budget): react to realtime envelopes by re-fetching budget state"
```

---

## Phase 6 — Reconnect catch-up + CommandFailed toast

### Task 12: Re-dispatch `*PageEvents.opened` on transport `reconnected`

**Files:**
- Modify: all three `with-*-signalr.feature.ts` files

- [ ] **Step 12.1: Failing test** — when `PortalSignalRService.status` transitions from `reconnecting` or `disconnected` to `connected`, the feature dispatches its `opened` page event.

- [ ] **Step 12.2: Implement**

```typescript
// excerpt — add to each with*SignalR feature
import { pairwise } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { PortalSignalRService } from '@core/realtime/portal-signalr.service';

// in withProps: _portal: inject(PortalSignalRService)

reconnected$: toObservable(store._portal.status).pipe(
  pairwise(),
  filter(([prev, curr]) => (prev === 'reconnecting' || prev === 'disconnected') && curr === 'connected'),
  map(() => expensesPageEvents.opened()), // accountsPageEvents.opened() / budgetPageEvents.opened() per feature
),
```

- [ ] **Step 12.3: Run — confirm green. Commit.**

```bash
git add src/app/features
git commit -m "feat(realtime): re-dispatch opened page events on reconnect"
```

---

### Task 13: `CommandFailed` envelope → generic toast

**Files:**
- Modify: `wisave-ui/src/app/features/expenses/services/expenses-signalr.service.ts` — no change to streams; add a new root-level subscriber
- Create: `wisave-ui/src/app/core/realtime/command-failed-notifier.service.ts`
- Create: `wisave-ui/src/app/core/realtime/command-failed-notifier.service.spec.ts`

**Design:** A root-provided `CommandFailedNotifierService` subscribes to `ExpensesSignalRService.commandFailed$` in its constructor and shows a generic PrimeNG toast via `MessageService`. No per-store matching, no correlationId. Users see "Your last action couldn't be completed." with the reason from the envelope payload if present.

- [ ] **Step 13.1: Failing test — notifier calls MessageService.add with severity='error' when a commandFailed envelope is emitted**

```typescript
// src/app/core/realtime/command-failed-notifier.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ExpensesSignalRService } from '@features/expenses/services/expenses-signalr.service';
import { CommandFailedNotifierService } from './command-failed-notifier.service';
import type { IRealtimeEnvelope } from './realtime-envelope.types';

describe('CommandFailedNotifierService', () => {
  let commandFailed$: Subject<IRealtimeEnvelope>;
  let msg: { add: jest.Mock };

  beforeEach(() => {
    commandFailed$ = new Subject();
    msg = { add: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        CommandFailedNotifierService,
        { provide: ExpensesSignalRService, useValue: { commandFailed$: commandFailed$.asObservable() } },
        { provide: MessageService, useValue: msg },
      ],
    });
  });

  it('shows an error toast on command.failed envelope', () => {
    TestBed.inject(CommandFailedNotifierService);
    commandFailed$.next({ eventId: 'e', domain: 'expenses', eventType: 'command.failed', occurredAt: '', entityId: null, payload: { reason: 'boom' } });
    expect(msg.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
});
```

- [ ] **Step 13.2: Run — confirm failure.**

- [ ] **Step 13.3: Implement**

```typescript
// src/app/core/realtime/command-failed-notifier.service.ts
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { ExpensesSignalRService } from '@features/expenses/services/expenses-signalr.service';

@Injectable({ providedIn: 'root' })
export class CommandFailedNotifierService {
  readonly #realtime = inject(ExpensesSignalRService);
  readonly #messages = inject(MessageService);
  readonly #subscription: Subscription;

  constructor() {
    this.#subscription = this.#realtime.commandFailed$.subscribe((env) => {
      const reason = (env.payload as { reason?: string }).reason;
      this.#messages.add({
        severity: 'error',
        summary: 'Action failed',
        detail: reason ?? "Your last action couldn't be completed.",
        life: 5000,
      });
    });
  }
}
```

Core-boundary note: this service lives in `core/realtime/` but imports `ExpensesSignalRService` from `features/`. That is a boundary-rule violation. To keep boundaries clean, relocate this service to `features/expenses/services/command-failed-notifier.service.ts` and instantiate it once at app bootstrap via `APP_INITIALIZER` or an import in the root component.

**Correction**: place this file at `src/app/features/expenses/services/command-failed-notifier.service.ts` instead. Add an `APP_INITIALIZER` or root constructor injection to force instantiation.

- [ ] **Step 13.4: Provide the notifier at app bootstrap**

```typescript
// src/app/app.config.ts — add to providers
import { CommandFailedNotifierService } from '@features/expenses/services/command-failed-notifier.service';

// in providers array:
{ provide: APP_INITIALIZER, multi: true, useFactory: (n: CommandFailedNotifierService) => () => void n, deps: [CommandFailedNotifierService] },
```

Alternative: inject it once in `app.component.ts` constructor.

- [ ] **Step 13.5: Run — confirm green. Commit.**

```bash
yarn test --include=src/app/features/expenses/services/command-failed-notifier.service.spec.ts
git add src/app/features/expenses/services/command-failed-notifier.service.ts src/app/features/expenses/services/command-failed-notifier.service.spec.ts src/app/app.config.ts
git commit -m "feat(realtime): generic toast on CommandFailed envelopes"
```

---

## Phase 7 — Final sweep

### Task 14: Lint, full tests, manual smoke

- [ ] **Step 14.1: Lint**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-ui
yarn lint
```

- [ ] **Step 14.2: Frontend tests**

```bash
yarn test --watch=false
```

- [ ] **Step 14.3: Backend tests**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-portal
dotnet test
```

- [ ] **Step 14.4: Manual smoke**

```bash
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-portal && docker compose up -d
cd /Users/jakubchwastek/Desktop/Projects/wisave_project/wisave-ui && yarn start
```

Open http://localhost:4200. Submit an expense. Expected: submit button shows loading, dialog closes on 202, new row appears shortly after (via SignalR → re-fetch). No row appears before the backend confirms. If CommandFailed fires, see the generic error toast.

- [ ] **Step 14.5: Dead-reference sweep**

```bash
rg "addedSuccess|updatedSuccess|removedSuccess" src/ | grep -v "\.spec\."
```

Expected: only references that flip `isSubmitting`/`commandStatus`, no references that embed optimistic entities.

- [ ] **Step 14.6: Final commit**

```bash
git add -A
git commit -m "chore(expenses): lint fixes after signalr rollout"
```

---

## Appendix — Embedded decisions

- **No correlation id anywhere.** HTTP 202 ends the submit flow from the UI's perspective; SignalR delivers the entity independently.
- **Re-fetch on realtime event.** Each `*FromRealtime` event triggers a `getById` fetch through the existing mapper. Deletes remove the entity by id — no fetch needed.
- **`commandStatus` preserved.** Accounts store keeps its existing `commandStatus` semantics ('idle'|'submitting'|'accepted'|'failed'). Expenses/budget stores add an `isSubmitting` flag if they don't already have one.
- **`CommandFailed` → generic toast.** No per-command matching. One root-provided notifier subscribes to `commandFailed$` and calls `MessageService.add(...)`.
- **No pending-command map, no delayed-timeout, no periodic tick, no dedupe by eventId.** The simplified flow does not require any of them. Multi-tab duplicate delivery results in two `getById` fetches per event — both produce the same canonical state, so the extra fetch is wasted but harmless.
- **Reconnect catch-up** = re-dispatch each feature's existing `*PageEvents.opened`.
- **Redis backplane** stays — it's what makes multi-replica portal delivery work once Kubernetes is rolled out.

---

## Execution Handoff

Plan saved at `docs/superpowers/plans/2026-04-16-hybrid-signalr-expenses.md`. Inline execution mode (chosen by user). Tasks drop from 24 → 14.
