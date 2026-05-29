import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';

import { BudgetAnalysisStore } from '../+store/analysis';
import { budgetPageEvents } from '../+store/budget/budget.events';
import { ExpenseBudgetStore } from '../+store/budget/budget.store';
import { BudgetChartsComponent } from '../components/budget-charts/budget-charts.component';
import { BudgetOverviewCardComponent } from '../components/budget-overview-card/budget-overview-card.component';
import { CategoryBudgetCardComponent } from '../components/category-budget-card/category-budget-card.component';
import { InsightCardComponent } from '../components/insight-card';
import { computeAllInsights } from '../helpers/insights.helper';
import { formatMonthLabel, getNextMonth, getPreviousMonth, isCurrentMonth as isCurrentMonthFn, isFutureMonth } from '../helpers/month.helper';
import { injectDispatch } from '@ngrx/signals/events';

import type { ICategoryBudget, ICategorySpendingSummary, IDelta } from '@wisave/shared/model';
import type { IExpenseCategory } from '@wisave/shared/model';
import type { ExpenseCategoryId } from '@wisave/shared/model';
import { AppDialogComponent } from '@wisave/shared/ui';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, Button, InputNumber, Select, ConfirmPopupModule, AppDialogComponent, BudgetOverviewCardComponent, CategoryBudgetCardComponent, BudgetChartsComponent, InsightCardComponent],
  providers: [ConfirmationService],
  template: `
    <p-confirmpopup
      [pt]="{
        icon: { class: 'text-sm' },
        message: { class: 'text-sm font-normal' },
        footer: { class: 'gap-2' },
      }" />
    <div class="flex h-full min-w-0 flex-1 gap-8">
      <div class="flex min-w-0 flex-2 flex-col gap-4 2xl:flex-3">
        <header class="flex items-center gap-3">
          <button
            (click)="onPrevMonth()"
            class="bg-secondary-100 dark:bg-dark-primary-700 border-secondary-200 dark:border-dark-divider hover:bg-secondary-200 dark:hover:bg-dark-primary-600 flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors"
            aria-label="Previous month">
            <i class="pi pi-chevron-left text-[10px]"></i>
          </button>
          <span class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-bold">{{ monthLabel() }}</span>
          <button
            [disabled]="isCurrentMonth()"
            (click)="onNextMonth()"
            class="bg-secondary-100 dark:bg-dark-primary-700 border-secondary-200 dark:border-dark-divider hover:bg-secondary-200 dark:hover:bg-dark-primary-600 flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month">
            <i class="pi pi-chevron-right text-[10px]"></i>
          </button>
          @if (isCurrentMonth()) {
            <span class="bg-info-500/10 text-info-500 dark:text-dark-info-400 rounded-full px-2 py-0.5 text-[10px] font-semibold">Current</span>
          }
        </header>

        @if (isPastMonth()) {
          <div class="bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider flex items-center gap-2 rounded-lg border px-3 py-2">
            <i class="pi pi-info-circle text-info-500 dark:text-dark-info-400 text-xs"></i>
            <span class="text-secondary-600 dark:text-dark-secondary-300 text-xs">
              Viewing <strong class="text-secondary-800 dark:text-dark-secondary-100">{{ monthLabel() }}</strong> — historical month. Edits will be flagged.
            </span>
          </div>
        }

        @if (budget(); as b) {
          <app-budget-overview-card [budget]="b" [totalSpent]="totalSpent()" [delta]="overallDelta()" [deltaLabel]="previousMonthLabel()" (editClicked)="openOverallLimitDialog()" />

          <div class="flex flex-col gap-3">
            <h3 class="text-secondary-700 dark:text-dark-secondary-300 text-xs font-semibold tracking-wider uppercase">Category Budgets</h3>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              @for (item of categoryBudgetSummaries(); track item.categoryId) {
                <app-category-budget-card
                  [categoryName]="item.categoryName"
                  [spent]="item.spent"
                  [limit]="item.limit"
                  [currency]="b.currency"
                  [delta]="getCategoryDelta(item.categoryId)"
                  [deltaLabel]="previousMonthLabel()"
                  (editClicked)="openEditCategoryDialog(item.categoryId, item.categoryName, item.limit)"
                  (removeClicked)="confirmRemoveCategory($event, item.categoryId, item.categoryName)" />
              }

              @if (uncategorizedSpent() > 0) {
                <section class="bg-white dark:bg-dark-primary-850 border-secondary-300 dark:border-dark-divider flex h-full flex-col gap-2 rounded-xl border border-dashed p-3">
                  <span class="text-secondary-600 dark:text-dark-secondary-400 text-xs font-medium">Unbudgeted spending</span>
                  <span class="text-secondary-900 dark:text-dark-secondary-50 text-sm font-bold"> {{ uncategorizedSpent() | number: '1.2-2' }} {{ b.currency }} </span>
                  <p class="text-secondary-500 dark:text-dark-secondary-300 text-[10px] leading-4">This amount belongs to categories without a budget yet.</p>
                  <div class="mt-auto pt-2">
                    <p-button [outlined]="true" (onClick)="openAddCategoryDialog()" label="Add category budget" icon="pi pi-plus" severity="secondary" size="small" />
                  </div>
                </section>
              }

              <button
                (click)="openAddCategoryDialog()"
                class="text-secondary-500 dark:text-dark-secondary-400 hover:text-secondary-700 dark:hover:text-dark-secondary-200 hover:border-secondary-400 dark:hover:border-dark-secondary-500 border-secondary-300 dark:border-dark-divider flex items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-xs font-medium transition-colors">
                <i class="pi pi-plus text-[10px]"></i>
                Add category budget
              </button>
            </div>
          </div>
        } @else if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <i class="pi pi-spin pi-spinner text-secondary-400 text-2xl"></i>
          </div>
        }
      </div>

      <div class="min-w-0 flex-1 flex flex-col gap-6">
        @defer (on viewport) {
          <app-budget-charts [spendingSummaries]="spendingSummaries()" [monthlyStats]="monthlyStats()" [categoryDeltas]="categoryDeltaMap()" />
        } @placeholder {
          <div class="bg-white dark:bg-dark-primary-850 border border-secondary-200 dark:border-dark-divider rounded-2xl shadow-xs h-72 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-secondary-400 text-xl"></i>
          </div>
        }

        @if (topInsights().length > 0) {
          <div class="flex flex-col gap-2">
            @for (insight of topInsights(); track insight.message) {
              <app-insight-card [insight]="insight" />
            }
          </div>
        }
      </div>
    </div>

    <!-- Edit Overall Limit Dialog -->
    <app-dialog [visible]="showOverallDialog()" [showHeader]="false" [style]="{ width: 'min(32rem, 92vw)' }" (visibleChange)="showOverallDialog.set($event)">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Edit monthly budget</h2>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Adjust the total spending cap for this month.</p>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="overall-limit">Monthly limit</label>
          <p-inputNumber
            [formControl]="overallLimitControl"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            [min]="0"
            class="w-full"
            inputStyleClass="!py-[0.625rem]"
            inputId="overall-limit"
            mode="decimal"
            placeholder="0.00" />
          <div class="min-h-5 text-xs leading-5">
            @if (overallLimitControl.invalid && overallLimitControl.touched) {
              <span class="text-danger-600 dark:text-danger-400">Enter a value greater than or equal to 0.</span>
            }
          </div>
        </div>
        <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-end gap-2 pt-4">
          <p-button [text]="true" (onClick)="showOverallDialog.set(false)" label="Cancel" severity="secondary" size="small" />
          <p-button [disabled]="overallLimitControl.invalid" (onClick)="saveOverallLimit()" label="Save limit" icon="pi pi-check" severity="secondary" size="small" />
        </div>
      </div>
    </app-dialog>

    <!-- Edit Category Budget Dialog -->
    <app-dialog [visible]="showCategoryDialog()" [showHeader]="false" [style]="{ width: 'min(32rem, 92vw)' }" (visibleChange)="showCategoryDialog.set($event)">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">{{ editCategoryDialogTitle() }}</h2>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Update the amount this category can spend this month.</p>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="category-limit">Budget limit</label>
          <p-inputNumber
            [formControl]="categoryLimitControl"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            [min]="0"
            class="w-full"
            inputStyleClass="!py-[0.625rem]"
            inputId="category-limit"
            mode="decimal"
            placeholder="0.00" />
          <div class="min-h-5 text-xs leading-5">
            @if (categoryLimitControl.invalid && categoryLimitControl.touched) {
              <span class="text-danger-600 dark:text-danger-400">Enter a value greater than or equal to 0.</span>
            }
          </div>
        </div>
        <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-end gap-2 pt-4">
          <p-button [text]="true" (onClick)="showCategoryDialog.set(false)" label="Cancel" severity="secondary" size="small" />
          <p-button [disabled]="categoryLimitControl.invalid" (onClick)="saveCategoryBudget()" label="Save limit" icon="pi pi-check" severity="secondary" size="small" />
        </div>
      </div>
    </app-dialog>

    <!-- Add Category Budget Dialog -->
    <app-dialog [visible]="showAddCategoryDialog()" [showHeader]="false" [style]="{ width: 'min(32rem, 92vw)' }" (visibleChange)="showAddCategoryDialog.set($event)">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <h2 class="text-secondary-900 dark:text-dark-secondary-50 text-lg font-semibold">Add category budget</h2>
          <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">Pick a category and set a monthly spending limit for it.</p>
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="add-category-select">Category</label>
            <p-select
              [formControl]="addCategorySelectControl"
              [options]="unbudgetedCategories()"
              class="w-full"
              inputId="add-category-select"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a category"
              appendTo="body" />
            <div class="min-h-5 text-xs leading-5">
              @if (addCategorySelectControl.invalid && addCategorySelectControl.touched) {
                <span class="text-danger-600 dark:text-danger-400">Select a category to budget.</span>
              }
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-secondary-700 dark:text-dark-secondary-200 text-xs font-semibold" for="add-category-limit">Budget limit</label>
            <p-inputNumber
              [formControl]="addCategoryLimitControl"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
              [min]="0"
              class="w-full"
              inputStyleClass="!py-[0.625rem]"
              inputId="add-category-limit"
              mode="decimal"
              placeholder="0.00" />
            <div class="min-h-5 text-xs leading-5">
              @if (addCategoryLimitControl.invalid && addCategoryLimitControl.touched) {
                <span class="text-danger-600 dark:text-danger-400">Enter a value greater than or equal to 0.</span>
              }
            </div>
          </div>
        </div>
        <div class="border-secondary-200 dark:border-dark-divider flex items-center justify-end gap-2 pt-4">
          <p-button [text]="true" (onClick)="showAddCategoryDialog.set(false)" label="Cancel" severity="secondary" size="small" />
          <p-button [disabled]="addCategorySelectControl.invalid || addCategoryLimitControl.invalid" (onClick)="saveAddCategoryBudget()" label="Add budget" icon="pi pi-plus" severity="secondary" size="small" />
        </div>
      </div>
    </app-dialog>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class BudgetComponent implements OnInit {
  readonly #store = inject(ExpenseBudgetStore);
  readonly #analysisStore = inject(BudgetAnalysisStore);
  readonly #dispatch = injectDispatch(budgetPageEvents);
  readonly #confirmationService = inject(ConfirmationService);
  #editingCategoryId: ExpenseCategoryId | null = null;

  readonly isLoading = computed(() => this.#store['isLoading']());
  readonly budget = computed(() => this.#store['currentBudget']());
  readonly spendingSummaries = computed(() => this.#store['spendingSummaries']());
  readonly monthlyStats = computed(() => this.#store['monthlyStats']());
  readonly availableCategories = computed(() => this.#store['availableCategories']());

  readonly isCurrentMonth = computed(() => isCurrentMonthFn(this.#store['selectedMonth'](), this.#store['selectedYear']()));
  readonly isPastMonth = computed(() => !this.isCurrentMonth());

  readonly totalSpent = computed(() => {
    const summaries = this.spendingSummaries();
    return summaries.reduce((sum: number, s: ICategorySpendingSummary) => sum + s.spent, 0);
  });

  readonly categoryBudgetSummaries = computed(() => {
    const b = this.budget();
    const summaries = this.spendingSummaries();
    if (!b) return [];

    return b.categoryBudgets.map((cb: ICategoryBudget) => {
      const summary = summaries.find((s: ICategorySpendingSummary) => s.categoryId === cb.categoryId);
      return {
        categoryId: cb.categoryId,
        categoryName: summary?.categoryName ?? 'Unknown',
        spent: cb.spent,
        limit: cb.limit,
      };
    });
  });

  readonly uncategorizedSpent = computed(() => {
    const b = this.budget();
    const summaries = this.spendingSummaries();
    if (!b) return 0;

    const categorizedIds = new Set(b.categoryBudgets.map((cb: ICategoryBudget) => cb.categoryId));
    return summaries.filter((s: ICategorySpendingSummary) => !categorizedIds.has(s.categoryId)).reduce((sum: number, s: ICategorySpendingSummary) => sum + s.spent, 0);
  });

  readonly monthLabel = computed(() => formatMonthLabel(this.#store['selectedMonth'](), this.#store['selectedYear']()));

  readonly previousMonthLabel = computed(() => this.#analysisStore.previousMonthLabel());

  readonly topInsights = computed(() => {
    if (!this.#analysisStore.hasPreviousData()) return [];
    const summaries = this.spendingSummaries();
    const currentTotal = this.totalSpent();
    const prevTotal = this.#analysisStore.previousTotalSpent();
    const prevBudget = this.#analysisStore.previousBudget();
    const stats = this.monthlyStats();
    if (!prevBudget) return [];
    return computeAllInsights(summaries, currentTotal, prevTotal, prevBudget.month, stats).slice(0, 3);
  });

  readonly overallDelta = computed<IDelta | null>(() => {
    if (!this.#analysisStore.hasPreviousData()) return null;
    const currentTotal = this.totalSpent();
    const prevTotal = this.#analysisStore.previousTotalSpent();
    if (prevTotal === 0) return null;
    const diff = currentTotal - prevTotal;
    const percent = Math.round(Math.abs((diff / prevTotal) * 100));
    return {
      amount: Math.abs(diff),
      percent,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
    };
  });

  readonly categoryDeltaMap = computed(() => {
    const prevMap = this.#analysisStore.categoryDeltas();
    const currentSummaries = this.spendingSummaries();
    const result = new Map<string, IDelta>();

    for (const s of currentSummaries) {
      const prev = prevMap.get(s.categoryId);
      if (!prev) continue;
      const diff = s.spent - prev.prevSpent;
      const percent = prev.prevSpent > 0 ? Math.round(Math.abs((diff / prev.prevSpent) * 100)) : 0;
      result.set(s.categoryId as string, {
        amount: Math.abs(diff),
        percent,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
      });
    }
    return result;
  });

  // Categories that don't have a budget yet
  readonly unbudgetedCategories = computed(() => {
    const b = this.budget();
    const categories = this.availableCategories();
    if (!b) return categories;
    const budgetedIds = new Set(b.categoryBudgets.map((cb: ICategoryBudget) => cb.categoryId));
    return categories.filter((c: IExpenseCategory) => !budgetedIds.has(c.id));
  });

  // --- Overall limit dialog ---
  readonly showOverallDialog = signal(false);
  readonly overallLimitControl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });

  // --- Edit category dialog ---
  readonly showCategoryDialog = signal(false);
  readonly editCategoryDialogTitle = signal('Edit category budget');
  readonly categoryLimitControl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });

  // --- Add category dialog ---
  readonly showAddCategoryDialog = signal(false);
  readonly addCategorySelectControl = new FormControl<ExpenseCategoryId | null>(null, { validators: [Validators.required] });
  readonly addCategoryLimitControl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });

  ngOnInit(): void {
    this.#dispatch.opened();
  }

  // --- Month navigation ---

  onPrevMonth(): void {
    const prev = getPreviousMonth(this.#store['selectedMonth'](), this.#store['selectedYear']());
    this.#dispatch.monthChanged(prev);
  }

  onNextMonth(): void {
    const next = getNextMonth(this.#store['selectedMonth'](), this.#store['selectedYear']());
    if (!isFutureMonth(next.month, next.year)) {
      this.#dispatch.monthChanged(next);
    }
  }

  getCategoryDelta(categoryId: string): IDelta | null {
    return this.categoryDeltaMap().get(categoryId) ?? null;
  }

  // --- Overall limit ---

  openOverallLimitDialog(): void {
    if (this.isPastMonth()) {
      this.#confirmPastMonthEdit(() => {
        this.overallLimitControl.reset(this.budget()?.totalLimit ?? null);
        this.showOverallDialog.set(true);
      });
      return;
    }
    this.overallLimitControl.reset(this.budget()?.totalLimit ?? null);
    this.showOverallDialog.set(true);
  }

  saveOverallLimit(): void {
    if (this.overallLimitControl.invalid) return;
    this.#dispatch.setOverallLimit({ limit: this.overallLimitControl.value! });
    this.showOverallDialog.set(false);
  }

  // --- Edit category ---

  openEditCategoryDialog(categoryId: ExpenseCategoryId, categoryName: string, currentLimit: number): void {
    const open = () => {
      this.#editingCategoryId = categoryId;
      this.editCategoryDialogTitle.set(`Edit budget — ${categoryName}`);
      this.categoryLimitControl.reset(currentLimit);
      this.showCategoryDialog.set(true);
    };
    if (this.isPastMonth()) {
      this.#confirmPastMonthEdit(open);
      return;
    }
    open();
  }

  saveCategoryBudget(): void {
    if (this.categoryLimitControl.invalid || !this.#editingCategoryId) return;
    this.#dispatch.updateCategoryBudget({ categoryId: this.#editingCategoryId, limit: this.categoryLimitControl.value! });
    this.showCategoryDialog.set(false);
    this.#editingCategoryId = null;
  }

  // --- Add category ---

  openAddCategoryDialog(): void {
    const open = () => {
      this.addCategorySelectControl.reset(null);
      this.addCategoryLimitControl.reset(null);
      this.showAddCategoryDialog.set(true);
    };
    if (this.isPastMonth()) {
      this.#confirmPastMonthEdit(open);
      return;
    }
    open();
  }

  saveAddCategoryBudget(): void {
    if (this.addCategorySelectControl.invalid || this.addCategoryLimitControl.invalid) return;
    this.#dispatch.addCategoryBudget({
      categoryId: this.addCategorySelectControl.value!,
      limit: this.addCategoryLimitControl.value!,
    });
    this.showAddCategoryDialog.set(false);
  }

  // --- Remove category ---

  confirmRemoveCategory(event: Event, categoryId: ExpenseCategoryId, categoryName: string): void {
    this.#confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Remove "${categoryName}" budget?`,
      icon: 'pi pi-trash',
      acceptButtonProps: { label: 'Remove', severity: 'danger', size: 'small' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', size: 'small', outlined: true },
      accept: () => this.#dispatch.removeCategoryBudget({ categoryId }),
    });
  }

  #confirmPastMonthEdit(onAccept: () => void): void {
    this.#confirmationService.confirm({
      message: "You're editing a past month's budget. Continue?",
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Continue', severity: 'secondary', size: 'small' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', size: 'small', outlined: true },
      accept: onAccept,
    });
  }
}
