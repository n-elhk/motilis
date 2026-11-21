import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TOAST_CONFIG, TOAST_DATA, ToastConfig, ToastData } from './toast-config';
import { ToastRef } from './toast-ref';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [
        { provide: ToastRef, useValue: { close: () => undefined } },
        { provide: TOAST_CONFIG, useValue: new ToastConfig() },
        { provide: TOAST_DATA, useValue: { ...new ToastData(), text: 'Bravo' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
