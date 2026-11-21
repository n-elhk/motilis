import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotilisStat } from '../../../shared/models/statistic';
import { ModalStatisticComponent } from './modal-statistic.component';

describe('ModalStatisticComponent', () => {
  let component: ModalStatisticComponent;
  let fixture: ComponentFixture<ModalStatisticComponent>;

  const stats: MotilisStat = {
    games: [{ date: Date.UTC(2026, 10, 20), won: true, nbAttempts: 3 }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalStatisticComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DialogRef, useValue: { close: () => undefined } },
        { provide: DIALOG_DATA, useValue: stats },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalStatisticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
