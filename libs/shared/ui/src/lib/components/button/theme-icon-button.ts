import { Component, inject } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-theme-icon-button',
  imports: [ButtonModule],
  template: `
    <p-button
      [icon]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
      [ariaLabel]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="themeService.toggleTheme()"
      class="p-button-xs"
      variant="text"
      size="small" />
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class ThemeIconButtonComponent {
  public themeService = inject(ThemeService);
}
