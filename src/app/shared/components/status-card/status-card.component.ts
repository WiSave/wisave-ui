import { Component, computed, input, output } from '@angular/core';

import { Button } from 'primeng/button';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [Button],
  template: `
    <div
      [attr.data-testid]="cardTestId()"
      [class.gap-4]="actionLabel()"
      [class.gap-3]="!actionLabel()"
      class="border-secondary-200 dark:border-dark-divider flex flex-col items-center justify-center rounded-xl border p-8 text-center">
      <i [class]="iconClasses()"></i>
      <div class="text-secondary-700 dark:text-dark-secondary-100 text-sm font-medium">{{ title() }}</div>
      @if (description()) {
        <p class="text-secondary-500 dark:text-dark-secondary-300 text-sm">{{ description() }}</p>
      }
      @if (actionLabel(); as label) {
        <p-button [label]="label" [icon]="actionIcon()" [severity]="actionSeverity()" (onClick)="actionClicked.emit()" size="small" />
      }
    </div>
  `,
})
export class StatusCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly icon = input.required<string>();
  readonly iconTone = input<'muted' | 'warning'>('muted');
  readonly actionLabel = input<string | null>(null);
  readonly actionIcon = input<string>('pi pi-refresh');
  readonly actionSeverity = input<'secondary' | 'success'>('secondary');
  readonly cardTestId = input<string | null>(null);

  readonly actionClicked = output<void>();

  readonly iconClasses = computed(() => {
    const toneClass = this.iconTone() === 'warning' ? 'text-warning-500' : 'text-secondary-400 dark:text-dark-secondary-500';

    return `${this.icon()} ${toneClass} text-3xl`;
  });
}
