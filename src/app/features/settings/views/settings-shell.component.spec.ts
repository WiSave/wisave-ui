import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PermissionService } from '@core/services/auth/permission.service';

import { SettingsShellComponent } from './settings-shell.component';

describe('SettingsShellComponent', () => {
  it('shows access management for wildcard users', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsShellComponent],
      providers: [provideRouter([]), { provide: PermissionService, useValue: { hasPermission: () => true } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Profile');
    expect(fixture.nativeElement.textContent).toContain('Access Management');
  });

  it('hides access management for normal users', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsShellComponent],
      providers: [provideRouter([]), { provide: PermissionService, useValue: { hasPermission: () => false } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Profile');
    expect(fixture.nativeElement.textContent).not.toContain('Access Management');
  });
});
