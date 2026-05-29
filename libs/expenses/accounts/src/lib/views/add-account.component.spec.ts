import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { provideDispatcher } from '@ngrx/signals/events';

import { ExpenseAccountsStore } from '../+store/accounts/accounts.store';

import { AddAccountComponent } from './add-account.component';

describe('AddAccountComponent', () => {
  const navigate = vi.fn(() => Promise.resolve(true));

  const storeStub = {
    entities: signal([]),
    commandStatus: signal<'idle' | 'submitting' | 'accepted' | 'failed'>('idle'),
    error: signal(null),
  };

  beforeEach(async () => {
    navigate.mockClear();
    storeStub.entities.set([]);
    storeStub.commandStatus.set('idle');
    storeStub.error.set(null);

    await TestBed.configureTestingModule({
      imports: [AddAccountComponent],
      providers: [
        provideDispatcher(),
        { provide: ExpenseAccountsStore, useValue: storeStub },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { parent: {} } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does not auto-close on entry from a stale accepted status before submit', () => {
    storeStub.commandStatus.set('accepted');

    TestBed.createComponent(AddAccountComponent).detectChanges();

    expect(navigate).not.toHaveBeenCalled();
  });
});
