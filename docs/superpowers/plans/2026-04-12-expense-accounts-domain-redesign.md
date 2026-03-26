# Expense Accounts Domain Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the expense accounts feature so it uses `originAccountUid`, enforces required card-to-account relationships, shows a hybrid overview/management UI, and handles async account commands without pretending projections update immediately.

**Architecture:** Keep the existing feature structure and evolve it in place. Introduce a frontend-domain bridge around `originAccountUid`, split initial loading from post-submit accepted-command state, and redesign the accounts page/components around funding accounts versus cards without adding polling or SignalR yet.

**Tech Stack:** Angular 21 standalone components, Reactive Forms, `@ngrx/signals`, `@ngrx/signals/events`, PrimeNG 21, Tailwind CSS 4, Angular TestBed + HttpTestingController, ESLint

---

## File Structure

- Modify: `src/app/core/types/expense-account.interface.ts`
  - Canonical frontend-domain account shape; add `originAccountUid` and stop using transport-shaped relationship naming in the UI layer.
- Modify: `src/app/core/services/expense-accounts-mapper.service.ts`
  - Map backend `linkedBankAccountId` to frontend `originAccountUid` and serialize the inverse for existing backend compatibility.
- Create: `src/app/core/services/expense-accounts-mapper.service.spec.ts`
  - Lock the domain/transport bridge in tests before feature refactors depend on it.
- Modify: `src/app/features/expense-accounts/types/account-form.types.ts`
  - Rename the relationship form control to `originAccountUid`.
- Modify: `src/app/features/expense-accounts/components/account-form/account-form.component.ts`
  - Make the origin account selector required for debit/credit cards and relabel it by domain meaning.
- Create: `src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`
  - Cover card validation rules and emitted payload shape.
- Modify: `src/app/features/expense-accounts/types/accounts-state.types.ts`
  - Add helper types for command status and overview stats.
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.state.ts`
  - Add `hasLoaded` and `commandStatus`.
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.events.ts`
  - Replace optimistic CRUD-success semantics with accepted-command events.
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts`
  - Stop generating fake entities for `202 Accepted` writes.
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.store.ts`
  - Keep projections authoritative; separate initial load from accepted commands.
- Modify: `src/app/features/expense-accounts/views/add-account.component.ts`
  - Close on accepted create, not on invented local entity insertion.
- Modify: `src/app/features/expense-accounts/views/edit-account.component.ts`
  - Close on accepted update and read selected account from projections.
- Modify: `src/app/features/expense-accounts/views/accounts.component.ts`
  - Render the hybrid page, initial blocking loader, summary strip, error state, and relationship-aware sections.
- Modify: `src/app/features/expense-accounts/components/account-card/account-card.component.ts`
  - Show origin account context and better card/funding-account summaries.
- Create: `src/app/features/expense-accounts/views/accounts.component.spec.ts`
  - Cover initial loader, error state, and grouped relationship-aware rendering.
- Modify: `docs/features/expense-accounts.md`
  - Reflect the new semantics and Phase 1 eventual-consistency boundary.

### Task 1: Bridge Frontend Domain Naming To `originAccountUid`

**Files:**
- Create: `src/app/core/services/expense-accounts-mapper.service.spec.ts`
- Modify: `src/app/core/types/expense-account.interface.ts`
- Modify: `src/app/core/services/expense-accounts-mapper.service.ts`
- Test: `src/app/core/services/expense-accounts-mapper.service.spec.ts`

- [ ] **Step 1: Write the failing mapper tests**

```ts
import { TestBed } from '@angular/core/testing';

import { asExpenseAccountId } from '@core/types/expense-id.types';
import { Currency } from '@core/types/currency.enum';

import { ExpenseAccountsMapperService } from './expense-accounts-mapper.service';

describe('ExpenseAccountsMapperService', () => {
  let service: ExpenseAccountsMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseAccountsMapperService);
  });

  it('maps backend linkedBankAccountId into frontend originAccountUid', () => {
    const result = service.mapToAccount({
      id: 'card-1',
      name: 'Visa Gold',
      type: 'CreditCard',
      currency: 'PLN',
      balance: 0,
      linkedBankAccountId: 'bank-1',
      creditLimit: 5000,
      billingCycleDay: 12,
      currentDebt: 1200,
      color: '#123456',
      lastFourDigits: '4242',
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: null,
    });

    expect(result.originAccountUid).toBe(asExpenseAccountId('bank-1'));
    expect(result.type).toBe('credit_card');
  });

  it('serializes originAccountUid back to linkedBankAccountId for the backend', () => {
    const payload = service.mapToApiRequest({
      name: 'Visa Gold',
      type: 'credit_card',
      currency: Currency.PLN,
      balance: 0,
      originAccountUid: asExpenseAccountId('bank-1'),
      creditLimit: 5000,
      billingCycleDay: 12,
      color: '#123456',
      lastFourDigits: '4242',
    });

    expect(payload['linkedBankAccountId']).toBe('bank-1');
    expect(payload['type']).toBe('CreditCard');
  });
});
```

- [ ] **Step 2: Run the mapper spec to verify it fails**

Run: `yarn ng test --watch=false --include src/app/core/services/expense-accounts-mapper.service.spec.ts`

Expected: FAIL with TypeScript errors or assertion failures because `IExpenseAccount` and the mapper do not expose `originAccountUid` yet.

- [ ] **Step 3: Implement the domain/transport bridge**

```ts
// src/app/core/types/expense-account.interface.ts
export interface IExpenseAccount {
  id: ExpenseAccountId;
  name: string;
  type: ExpenseAccountType;
  currency: Currency;
  balance: number;
  originAccountUid?: ExpenseAccountId;
  creditLimit?: number;
  billingCycleDay?: number;
  currentDebt?: number;
  color?: string;
  lastFourDigits?: string;
}
```

```ts
// src/app/core/services/expense-accounts-mapper.service.ts
mapToAccount(dto: IExpenseAccountApiDto): IExpenseAccount {
  return {
    id: asExpenseAccountId(dto.id),
    name: dto.name,
    type: this.#mapAccountType(dto.type),
    currency: this.#mapCurrency(dto.currency),
    balance: dto.balance,
    originAccountUid: dto.linkedBankAccountId ? asExpenseAccountId(dto.linkedBankAccountId) : undefined,
    creditLimit: dto.creditLimit ?? undefined,
    billingCycleDay: dto.billingCycleDay ?? undefined,
    currentDebt: dto.currentDebt ?? undefined,
    color: dto.color ?? undefined,
    lastFourDigits: dto.lastFourDigits ?? undefined,
  };
}

mapToApiRequest(account: Omit<IExpenseAccount, 'id'>): Record<string, unknown> {
  return {
    name: account.name,
    type: this.#mapAccountTypeToApi(account.type),
    currency: account.currency,
    balance: account.balance,
    linkedBankAccountId: account.originAccountUid ?? null,
    creditLimit: account.creditLimit ?? null,
    billingCycleDay: account.billingCycleDay ?? null,
    color: account.color ?? null,
    lastFourDigits: account.lastFourDigits ?? null,
  };
}

mapPartialToApiRequest(changes: Partial<IExpenseAccount>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...changes };

  if (changes.type) {
    result['type'] = this.#mapAccountTypeToApi(changes.type);
  }

  if (changes.originAccountUid !== undefined) {
    result['linkedBankAccountId'] = changes.originAccountUid ?? null;
    delete result['originAccountUid'];
  }

  delete result['id'];
  return result;
}
```

- [ ] **Step 4: Run the mapper spec to verify the bridge passes**

Run: `yarn ng test --watch=false --include src/app/core/services/expense-accounts-mapper.service.spec.ts`

Expected: PASS with both mapper bridge tests green.

- [ ] **Step 5: Commit the mapper/domain bridge**

```bash
git add src/app/core/types/expense-account.interface.ts src/app/core/services/expense-accounts-mapper.service.ts src/app/core/services/expense-accounts-mapper.service.spec.ts
git commit -m "refactor(expense-accounts): bridge origin account domain naming"
```

### Task 2: Redesign The Account Form Around Required Card Relationships

**Files:**
- Create: `src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`
- Modify: `src/app/features/expense-accounts/types/account-form.types.ts`
- Modify: `src/app/features/expense-accounts/components/account-form/account-form.component.ts`
- Test: `src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

- [ ] **Step 1: Write failing form specs for card validation and emitted payload**

```ts
import { TestBed } from '@angular/core/testing';

import { Currency } from '@core/types/currency.enum';
import { asExpenseAccountId } from '@core/types/expense-id.types';

import { AccountFormComponent } from './account-form.component';

describe('AccountFormComponent', () => {
  it('requires originAccountUid for debit cards', async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFormComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountFormComponent);
    fixture.componentRef.setInput('bankAccounts', [
      { id: asExpenseAccountId('bank-1'), name: 'Main', type: 'bank_account', currency: Currency.PLN, balance: 1000 } as never,
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.patchValue({
      name: 'Card',
      type: 'debit_card',
      currency: Currency.PLN,
      balance: 0,
      originAccountUid: null,
    });

    expect(component.form.controls.originAccountUid.hasError('required')).toBe(true);
  });

  it('emits originAccountUid instead of linkedBankAccountId', async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFormComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountFormComponent);
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);

    fixture.componentInstance.form.setValue({
      name: 'Visa',
      type: 'credit_card',
      currency: Currency.PLN,
      balance: 0,
      originAccountUid: asExpenseAccountId('bank-1'),
      creditLimit: 5000,
      billingCycleDay: 12,
      lastFourDigits: '4242',
      color: '#6366f1',
    });

    fixture.componentInstance.onSubmit();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        originAccountUid: asExpenseAccountId('bank-1'),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the form spec to verify it fails**

Run: `yarn ng test --watch=false --include src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

Expected: FAIL because the form still uses `linkedBankAccountId`, labels it as “Linked Bank Account”, and emits the old field.

- [ ] **Step 3: Implement the form rename, labels, helper text, and validators**

```ts
// src/app/features/expense-accounts/types/account-form.types.ts
export interface AccountFormModel {
  name: FormControl<string>;
  type: FormControl<ExpenseAccountType>;
  currency: FormControl<Currency>;
  balance: FormControl<number | null>;
  originAccountUid: FormControl<ExpenseAccountId | null>;
  creditLimit: FormControl<number | null>;
  billingCycleDay: FormControl<number | null>;
  lastFourDigits: FormControl<string>;
  color: FormControl<string>;
}
```

```ts
// src/app/features/expense-accounts/components/account-form/account-form.component.ts
readonly originAccountLabel = computed(() => (this.form.controls.type.value === 'credit_card' ? 'Settlement account' : 'Funding account'));
readonly originAccountHelpText = computed(() =>
  this.form.controls.type.value === 'credit_card'
    ? 'Choose the bank account used to settle this card debt.'
    : 'Choose the bank account this card spends from.',
);

readonly form = new FormGroup<AccountFormModel>({
  name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
  type: new FormControl<ExpenseAccountType>('bank_account', { nonNullable: true, validators: [Validators.required] }),
  currency: new FormControl<Currency>(Currency.PLN, { nonNullable: true, validators: [Validators.required] }),
  balance: new FormControl<number | null>(null, { validators: [Validators.required] }),
  originAccountUid: new FormControl<ExpenseAccountId | null>(null),
  creditLimit: new FormControl<number | null>(null),
  billingCycleDay: new FormControl<number | null>(null),
  lastFourDigits: new FormControl('', { nonNullable: true }),
  color: new FormControl(DEFAULT_COLOR, { nonNullable: true }),
});

readonly showOriginAccountSelector = computed(() => {
  const type = this.form.controls.type.value;
  return type === 'debit_card' || type === 'credit_card';
});

this.form.controls.type.valueChanges.subscribe((type) => {
  const { originAccountUid, creditLimit, billingCycleDay, lastFourDigits } = this.form.controls;

  if (type === 'credit_card') {
    originAccountUid.setValidators([Validators.required]);
    creditLimit.setValidators([Validators.required, Validators.min(1)]);
    billingCycleDay.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
    lastFourDigits.setValidators([Validators.pattern(/^\d{4}$/)]);
  } else if (type === 'debit_card') {
    originAccountUid.setValidators([Validators.required]);
    creditLimit.clearValidators();
    billingCycleDay.clearValidators();
    lastFourDigits.setValidators([Validators.pattern(/^\d{4}$/)]);
  } else {
    originAccountUid.clearValidators();
    creditLimit.clearValidators();
    billingCycleDay.clearValidators();
    lastFourDigits.clearValidators();
  }

  originAccountUid.updateValueAndValidity();
});
```

```html
@if (showOriginAccountSelector()) {
  <div class="flex flex-col gap-2">
    <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="account-origin-account">
      {{ originAccountLabel() }}
    </label>
    <p-select
      inputId="account-origin-account"
      formControlName="originAccountUid"
      [options]="bankAccountOptions()"
      optionLabel="label"
      optionValue="value"
      appendTo="body"
      placeholder="Select bank account" />
    <p class="text-secondary-500 dark:text-dark-secondary-400 text-xs">
      {{ originAccountHelpText() }}
    </p>
  </div>
}
```

- [ ] **Step 4: Run the form spec to verify the redesign passes**

Run: `yarn ng test --watch=false --include src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

Expected: PASS with card validation and emitted payload using `originAccountUid`.

- [ ] **Step 5: Commit the form redesign**

```bash
git add src/app/features/expense-accounts/types/account-form.types.ts src/app/features/expense-accounts/components/account-form/account-form.component.ts src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts
git commit -m "feat(expense-accounts): require origin account for cards"
```

### Task 3: Rework Account Store Semantics Around Accepted Commands

**Files:**
- Modify: `src/app/features/expense-accounts/types/accounts-state.types.ts`
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.state.ts`
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.events.ts`
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts`
- Modify: `src/app/features/expense-accounts/+store/accounts/accounts.store.ts`
- Modify: `src/app/features/expense-accounts/views/add-account.component.ts`
- Modify: `src/app/features/expense-accounts/views/edit-account.component.ts`
- Test: `src/app/core/services/expense-accounts-mapper.service.spec.ts`
- Test: `src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

- [ ] **Step 1: Lock the no-fake-entity direction with a failing reducer/event rewrite**

```ts
// src/app/features/expense-accounts/types/accounts-state.types.ts
export type AccountsCommandStatus = 'idle' | 'submitting' | 'accepted' | 'failed';
```

```ts
// target behavior to implement in src/app/features/expense-accounts/+store/accounts/accounts.events.ts
export const accountsApiEvents = eventGroup({
  source: 'Accounts API',
  events: {
    loadedSuccess: type<{ accounts: IExpenseAccount[] }>(),
    loadedFailure: type<{ error: IStoreError }>(),
    addAccepted: type<void>(),
    addFailure: type<{ error: IStoreError }>(),
    updateAccepted: type<void>(),
    updateFailure: type<{ error: IStoreError }>(),
    removeAccepted: type<void>(),
    removeFailure: type<{ error: IStoreError }>(),
    selectedLoaded: type<{ account: IExpenseAccount }>(),
  },
});
```

Use the already-green mapper and form tests as guardrails while making the store compile-fail temporarily.

- [ ] **Step 2: Run the focused tests to capture the temporary breakage**

Run: `yarn ng test --watch=false --include src/app/core/services/expense-accounts-mapper.service.spec.ts --include src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

Expected: FAIL with compilation errors in the accounts store/events flow because the reducer still expects `addedSuccess`, `updatedSuccess`, and optimistic entities.

- [ ] **Step 3: Implement accepted-command state, initial-load state, and dialog-closing semantics**

```ts
// src/app/features/expense-accounts/+store/accounts/accounts.state.ts
export interface AccountsState {
  isLoading: boolean;
  hasLoaded: boolean;
  error: IStoreError | null;
  selectedAccount: IExpenseAccount | null;
  commandStatus: AccountsCommandStatus;
}

export const initialState: AccountsState = {
  isLoading: false,
  hasLoaded: false,
  error: null,
  selectedAccount: null,
  commandStatus: 'idle',
};
```

```ts
// src/app/features/expense-accounts/+store/accounts/accounts.store.ts
withTrackedReducer(
  on(accountsPageEvents.opened, () => ({ isLoading: true, error: null, commandStatus: 'idle' as const })),
  on(accountsPageEvents.add, () => ({ error: null, commandStatus: 'submitting' as const })),
  on(accountsPageEvents.update, () => ({ error: null, commandStatus: 'submitting' as const })),
  on(accountsPageEvents.remove, () => ({ error: null, commandStatus: 'submitting' as const })),
  on(accountsPageEvents.selectAccount, () => ({ isLoading: true, selectedAccount: null, error: null })),
  on(accountsApiEvents.loadedSuccess, ({ payload }) => [
    setAllEntities<IExpenseAccount>(payload.accounts),
    () => ({ isLoading: false, hasLoaded: true, error: null, commandStatus: 'idle' as const }),
  ]),
  on(accountsApiEvents.loadedFailure, ({ payload }) => ({ isLoading: false, hasLoaded: true, error: payload.error, commandStatus: 'failed' as const })),
  on(accountsApiEvents.addAccepted, () => ({ commandStatus: 'accepted' as const, error: null })),
  on(accountsApiEvents.updateAccepted, () => ({ commandStatus: 'accepted' as const, error: null })),
  on(accountsApiEvents.removeAccepted, () => ({ commandStatus: 'accepted' as const, error: null })),
  on(accountsApiEvents.addFailure, ({ payload }) => ({ commandStatus: 'failed' as const, error: payload.error })),
  on(accountsApiEvents.updateFailure, ({ payload }) => ({ commandStatus: 'failed' as const, error: payload.error })),
  on(accountsApiEvents.removeFailure, ({ payload }) => ({ commandStatus: 'failed' as const, error: payload.error })),
  on(accountsApiEvents.selectedLoaded, ({ payload }) => [
    updateEntity<IExpenseAccount>({ id: payload.account.id, changes: payload.account }),
    () => ({ isLoading: false, selectedAccount: payload.account, error: null }),
  ]),
)
```

```ts
// src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts
addAccount$: store._events.on(accountsPageEvents.add).pipe(
  exhaustMap(({ payload }) =>
    store._api.create(payload.account).pipe(
      map(() => accountsApiEvents.addAccepted()),
      catchError((err) => of(accountsApiEvents.addFailure({ error: toStoreError(err) }))),
    ),
  ),
),

updateAccount$: store._events.on(accountsPageEvents.update).pipe(
  exhaustMap(({ payload }) =>
    store._api.update(payload.id, payload.changes).pipe(
      map(() => accountsApiEvents.updateAccepted()),
      catchError((err) => of(accountsApiEvents.updateFailure({ error: toStoreError(err) }))),
    ),
  ),
),

removeAccount$: store._events.on(accountsPageEvents.remove).pipe(
  exhaustMap(({ payload }) =>
    store._api.delete(payload.id).pipe(
      map(() => accountsApiEvents.removeAccepted()),
      catchError((err) => of(accountsApiEvents.removeFailure({ error: toStoreError(err) }))),
    ),
  ),
),

selectAccount$: store._events.on(accountsPageEvents.selectAccount).pipe(
  switchMap(({ payload }) =>
    store._api.getById(payload.id).pipe(
      map((account) => accountsApiEvents.selectedLoaded({ account })),
      catchError((err) => of(accountsApiEvents.loadedFailure({ error: toStoreError(err) }))),
    ),
  ),
),
```

```ts
// src/app/features/expense-accounts/views/add-account.component.ts
readonly isSubmitting = computed(() => this.#store.commandStatus() === 'submitting');

effect(() => {
  if (this.#store.commandStatus() === 'accepted') {
    this.#closeDialog();
  }
});
```

```ts
// src/app/features/expense-accounts/views/edit-account.component.ts
readonly account = computed(() => this.#store.selectedAccount() ?? null);
readonly isSubmitting = computed(() => this.#store.commandStatus() === 'submitting');

effect(() => {
  if (this.#submitted() && this.#store.commandStatus() === 'accepted') {
    this.#closeDialog();
  }
});
```

- [ ] **Step 4: Re-run the focused tests to verify accepted-command refactors compile cleanly**

Run: `yarn ng test --watch=false --include src/app/core/services/expense-accounts-mapper.service.spec.ts --include src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`

Expected: PASS, proving the accounts store refactor did not break the new domain bridge or form contract.

- [ ] **Step 5: Commit the accepted-command state model**

```bash
git add src/app/features/expense-accounts/types/accounts-state.types.ts src/app/features/expense-accounts/+store/accounts/accounts.state.ts src/app/features/expense-accounts/+store/accounts/accounts.events.ts src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts src/app/features/expense-accounts/+store/accounts/accounts.store.ts src/app/features/expense-accounts/views/add-account.component.ts src/app/features/expense-accounts/views/edit-account.component.ts
git commit -m "refactor(expense-accounts): model accepted account commands explicitly"
```

### Task 4: Redesign The Accounts Page And Card Presentation

**Files:**
- Create: `src/app/features/expense-accounts/views/accounts.component.spec.ts`
- Modify: `src/app/features/expense-accounts/views/accounts.component.ts`
- Modify: `src/app/features/expense-accounts/components/account-card/account-card.component.ts`
- Test: `src/app/features/expense-accounts/views/accounts.component.spec.ts`

- [ ] **Step 1: Write failing page specs for loader, error state, and grouped rendering**

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AccountsComponent } from './accounts.component';
import { ExpenseAccountsStore } from '@features/expense-accounts/+store/accounts/accounts.store';

describe('AccountsComponent', () => {
  let fixture: ComponentFixture<AccountsComponent>;

  const storeStub = {
    isLoading: signal(true),
    hasLoaded: signal(false),
    error: signal(null),
    commandStatus: signal<'idle' | 'submitting' | 'accepted' | 'failed'>('idle'),
    entities: signal([]),
    selectedAccount: signal(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [{ provide: ExpenseAccountsStore, useValue: storeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsComponent);
  });

  it('shows a blocking loader until the first projection load completes', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading accounts...');
  });

  it('shows a retryable error state after the first load fails', () => {
    storeStub.isLoading.set(false);
    storeStub.hasLoaded.set(true);
    storeStub.error.set({ message: 'Projection failed', category: 'server' });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load accounts');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });
});
```

- [ ] **Step 2: Run the page spec to verify it fails**

Run: `yarn ng test --watch=false --include src/app/features/expense-accounts/views/accounts.component.spec.ts`

Expected: FAIL because `AccountsComponent` does not expose `hasLoaded`, no retry/error state exists, and the view is still a sparse two-column admin grid.

- [ ] **Step 3: Implement the hybrid page, summary strip, and relationship-aware cards**

```ts
// src/app/features/expense-accounts/views/accounts.component.ts
readonly hasLoaded = computed(() => this.#store.hasLoaded());
readonly commandStatus = computed(() => this.#store.commandStatus());
readonly loadError = computed(() => this.#store.error());
readonly fundingAccounts = computed(() => this.entities().filter((a) => a.type === 'bank_account' || a.type === 'cash'));
readonly cardAccounts = computed(() => this.entities().filter((a) => a.type === 'credit_card' || a.type === 'debit_card'));
readonly totalLiquidFunds = computed(() => this.fundingAccounts().reduce((sum, account) => sum + account.balance, 0));
readonly totalCreditDebt = computed(() => this.cardAccounts().reduce((sum, account) => sum + (account.currentDebt ?? 0), 0));
readonly effectiveAvailableFunds = computed(() => this.totalLiquidFunds() - this.totalCreditDebt());

readonly originAccountNameById = computed(() => {
  const lookup = new Map<string, string>();
  for (const account of this.fundingAccounts()) {
    lookup.set(account.id, account.name);
  }
  return lookup;
});

getOriginAccountName(originAccountUid?: ExpenseAccountId): string | null {
  return originAccountUid ? this.originAccountNameById().get(originAccountUid) ?? null : null;
}

retry(): void {
  this.#dispatch.opened();
}
```

```html
@if (isLoading() && !hasLoaded()) {
  <div class="flex min-h-[22rem] items-center justify-center gap-3">
    <i class="pi pi-spinner pi-spin text-lg"></i>
    <span>Loading accounts...</span>
  </div>
} @else if (loadError()) {
  <div class="flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-2xl border border-secondary-200 bg-white p-8 text-center">
    <i class="pi pi-exclamation-circle text-xl text-danger-500"></i>
    <div class="text-sm font-semibold">Unable to load accounts</div>
    <p class="text-sm text-secondary-500">The latest account projection could not be loaded.</p>
    <p-button label="Retry" icon="pi pi-refresh" severity="secondary" (click)="retry()" />
  </div>
} @else {
  <section class="grid grid-cols-1 gap-3 xl:grid-cols-4">
    <article class="rounded-2xl border border-secondary-200 bg-white p-4">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">Liquid Funds</div>
      <div class="mt-2 text-2xl font-semibold">{{ totalLiquidFunds() | number: '1.2-2' }}</div>
    </article>
    <article class="rounded-2xl border border-secondary-200 bg-white p-4">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">Credit Debt</div>
      <div class="mt-2 text-2xl font-semibold text-rose-500">{{ totalCreditDebt() | number: '1.2-2' }}</div>
    </article>
    <article class="rounded-2xl border border-secondary-200 bg-white p-4">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">Effective Funds</div>
      <div class="mt-2 text-2xl font-semibold">{{ effectiveAvailableFunds() | number: '1.2-2' }}</div>
    </article>
    <article class="rounded-2xl border border-secondary-200 bg-white p-4">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">Accounts</div>
      <div class="mt-2 text-2xl font-semibold">{{ fundingAccounts().length }} / {{ cardAccounts().length }}</div>
    </article>
  </section>
}
```

```ts
// src/app/features/expense-accounts/components/account-card/account-card.component.ts
readonly originAccountName = input<string | null>(null);
readonly attachedCardsCount = input<number>(0);
```

```html
@if (originAccountName()) {
  <span class="text-secondary-500 dark:text-dark-secondary-400 text-[11px]">
    {{ account().type === 'credit_card' ? 'Settlement account' : 'Funding account' }}: {{ originAccountName() }}
  </span>
}

@if (account().type === 'bank_account' && attachedCardsCount() > 0) {
  <span class="text-secondary-500 dark:text-dark-secondary-400 text-[11px]">
    {{ attachedCardsCount() }} linked card{{ attachedCardsCount() === 1 ? '' : 's' }}
  </span>
}
```

- [ ] **Step 4: Run the page spec to verify the redesign passes**

Run: `yarn ng test --watch=false --include src/app/features/expense-accounts/views/accounts.component.spec.ts`

Expected: PASS with blocking loader and explicit load-failure rendering covered.

- [ ] **Step 5: Commit the accounts page redesign**

```bash
git add src/app/features/expense-accounts/views/accounts.component.ts src/app/features/expense-accounts/components/account-card/account-card.component.ts src/app/features/expense-accounts/views/accounts.component.spec.ts
git commit -m "feat(expense-accounts): redesign accounts overview page"
```

### Task 5: Update Feature Documentation And Run Focused Verification

**Files:**
- Modify: `docs/features/expense-accounts.md`
- Test: `src/app/core/services/expense-accounts-mapper.service.spec.ts`
- Test: `src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts`
- Test: `src/app/features/expense-accounts/views/accounts.component.spec.ts`

- [ ] **Step 1: Update the feature doc to match Phase 1 behavior**

```md
## Store

`ExpenseAccountsStore` keeps projection data authoritative.

**State:** `isLoading`, `hasLoaded`, `error`, `commandStatus`, `selectedAccount`, entities (`IExpenseAccount[]`).

**Page events:** `opened`, `add`, `update`, `remove`, `selectAccount`

## Layout

Hybrid accounts page:
- summary strip (liquid funds, credit debt, effective funds, counts)
- funding accounts section
- cards section
- blocking loader for first projection load
- explicit load-failure state with retry

## Eventual Consistency

- `GET` on page open loads the current projection
- POST/PUT/DELETE are treated as accepted commands, not immediate read-model confirmation
- no auto-refresh after submit in Phase 1; user-visible freshness beyond page open is deferred to later SignalR work

## Key Types

- `IExpenseAccount` — `originAccountUid?`, `creditLimit?`, `billingCycleDay?`, `currentDebt?`, `color?`, `lastFourDigits?`
```

- [ ] **Step 2: Run the focused regression suite**

Run: `yarn ng test --watch=false --include src/app/core/services/expense-accounts-mapper.service.spec.ts --include src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts --include src/app/features/expense-accounts/views/accounts.component.spec.ts`

Expected: PASS with all new expense-accounts specs green.

- [ ] **Step 3: Run lint on the touched files**

Run: `yarn eslint src/app/core/types/expense-account.interface.ts src/app/core/services/expense-accounts-mapper.service.ts src/app/core/services/expense-accounts-mapper.service.spec.ts src/app/features/expense-accounts/types/account-form.types.ts src/app/features/expense-accounts/types/accounts-state.types.ts src/app/features/expense-accounts/components/account-form/account-form.component.ts src/app/features/expense-accounts/components/account-form/account-form.component.spec.ts src/app/features/expense-accounts/+store/accounts/accounts.state.ts src/app/features/expense-accounts/+store/accounts/accounts.events.ts src/app/features/expense-accounts/+store/accounts/accounts.event-handlers.ts src/app/features/expense-accounts/+store/accounts/accounts.store.ts src/app/features/expense-accounts/views/add-account.component.ts src/app/features/expense-accounts/views/edit-account.component.ts src/app/features/expense-accounts/views/accounts.component.ts src/app/features/expense-accounts/views/accounts.component.spec.ts src/app/features/expense-accounts/components/account-card/account-card.component.ts`

Expected: EXIT 0 with no lint errors.

- [ ] **Step 4: Commit the docs and verification pass**

```bash
git add docs/features/expense-accounts.md
git commit -m "docs(expense-accounts): document domain redesign behavior"
```

- [ ] **Step 5: Final manual verification**

Run:

```bash
yarn ng serve
```

Then verify in the browser:

- `/expenses/accounts` shows the blocking loader before the first projection resolves
- `/expenses/accounts/add` requires a funding/settlement account for debit/credit cards
- accepting create/update closes the dialog without inserting fake local data
- the accounts page shows summary cards plus relationship-aware funding account/card sections
