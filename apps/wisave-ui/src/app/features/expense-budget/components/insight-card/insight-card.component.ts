import { Component, computed, input } from '@angular/core';

import type { IInsight, InsightSeverity } from '@core/types/expense-budget.interface';

const SEVERITY_STYLES: Record<InsightSeverity, { icon: string; borderClass: string; iconClass: string }> = {
  warning: {
    icon: 'pi pi-exclamation-triangle',
    borderClass: 'border-warning-500/30',
    iconClass: 'text-warning-500 dark:text-dark-warning-400',
  },
  info: {
    icon: 'pi pi-info-circle',
    borderClass: 'border-info-500/30',
    iconClass: 'text-info-500 dark:text-dark-info-400',
  },
  positive: {
    icon: 'pi pi-check-circle',
    borderClass: 'border-positive-500/30',
    iconClass: 'text-positive-500 dark:text-dark-positive-400',
  },
};

@Component({
  selector: 'app-insight-card',
  styles: `:host { display: block; }`,
  template: `
    <div
      class="bg-white dark:bg-dark-primary-850 border-secondary-200 dark:border-dark-divider rounded-lg border px-4 py-3 text-sm"
      [class]="style().borderClass">
      <span [class]="style().iconClass"><i [class]="style().icon" class="mr-2 text-sm"></i></span>
      <span class="text-secondary-700 dark:text-dark-secondary-200">{{ insight().message }}</span>
    </div>
  `,
})
export class InsightCardComponent {
  readonly insight = input.required<IInsight>();

  readonly style = computed(() => SEVERITY_STYLES[this.insight().severity]);
}
