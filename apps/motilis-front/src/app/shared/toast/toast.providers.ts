import { makeEnvironmentProviders } from '@angular/core';
import { ToastConfig, TOAST_CONFIG } from './toast-config';

export const provideToast = (config = new ToastConfig()) => makeEnvironmentProviders([
  {
    provide: TOAST_CONFIG,
    useValue: { ...new ToastConfig(), ...config },
  }
]);

