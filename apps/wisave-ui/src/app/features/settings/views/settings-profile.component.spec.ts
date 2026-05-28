import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '@wisave/platform/auth';

import { SettingsProfileComponent } from './settings-profile.component';

describe('SettingsProfileComponent', () => {
  const changePassword = vi.fn(() => of(void 0));

  beforeEach(async () => {
    changePassword.mockClear();

    await TestBed.configureTestingModule({
      imports: [SettingsProfileComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: () => ({
              id: 'user-1',
              name: 'Test User',
              email: 'test@example.com',
              permissions: ['incomes:read'],
            }),
            changePassword,
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the current user profile', () => {
    const fixture = TestBed.createComponent(SettingsProfileComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Test User');
    expect(text).toContain('test@example.com');
    expect(text).not.toContain('incomes:read');
    expect(text).not.toContain('Permissions');
    expect(text).toContain('Change password');
  });

  it('submits password changes', () => {
    const fixture = TestBed.createComponent(SettingsProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });
    fixture.componentInstance.onChangePassword();

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword123!',
    });
  });
});
