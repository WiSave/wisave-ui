import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StatusCardComponent } from './status-card.component';

@Component({
  imports: [StatusCardComponent],
  template: `
    <app-status-card
      (actionClicked)="clicked = true"
      cardTestId="portfolio-status"
      title="Unable to load portfolio"
      description="Try loading the portfolio again."
      icon="pi pi-exclamation-triangle"
      iconTone="warning"
      actionLabel="Retry" />
  `,
})
class StatusCardHostComponent {
  clicked = false;
}

describe('StatusCardComponent', () => {
  it('renders compact status content and emits its optional action', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [StatusCardHostComponent],
    }).createComponent(StatusCardHostComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="portfolio-status"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="portfolio-status"]').className).toContain('rounded-xl');
    expect(fixture.nativeElement.querySelector('[data-testid="portfolio-status"]').className).toContain('border');
    expect(fixture.nativeElement.querySelector('[data-testid="portfolio-status"] i').className).toContain('text-3xl');
    expect(fixture.nativeElement.textContent).toContain('Unable to load portfolio');
    expect(fixture.nativeElement.textContent).toContain('Try loading the portfolio again.');

    fixture.nativeElement.querySelector('button').click();

    expect(fixture.componentInstance.clicked).toBe(true);
  });
});
