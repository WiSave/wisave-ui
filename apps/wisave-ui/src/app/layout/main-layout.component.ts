import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '@core/services/auth/auth.service';
import { SidebarComponent } from '@layout/sidebar';

@Component({
  selector: 'app-main-layout',
  imports: [SidebarComponent, RouterOutlet],
  template: `
    <app-sidebar />
    <main class="min-w-0 flex-1">
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: row;
      height: 100%;
    }
  `,
})
export class MainLayoutComponent {
  readonly #authService = inject(AuthService);

  constructor() {
    this.#authService.bootstrapAntiforgery().subscribe();
  }
}
