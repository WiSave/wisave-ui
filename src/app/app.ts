import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
  `,
})
export class AppComponent {}
