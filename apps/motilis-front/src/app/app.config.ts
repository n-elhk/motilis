import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';


import { DomSanitizer } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IconRegistery } from './components';
import { provideToast } from './shared/toast/toast.providers';

export function initializeIcon(
  iconRegistery: IconRegistery,
  domSanitizer: DomSanitizer,
) {
  return () => {
    const baseSvg = 'icons';

    const icons = [
      { name: 'keyboard_return', path: `${baseSvg}/keyboard_return.svg` },
      { name: 'delete', path: `${baseSvg}/delete.svg` },
      { name: 'chevron_right', path: `${baseSvg}/chevron_right.svg` },
      { name: 'chevron_left', path: `${baseSvg}/chevron_left.svg` },

      { name: 'backspace', path: `${baseSvg}/backspace.svg` },
      { name: 'shuffle', path: `${baseSvg}/shuffle.svg` },
      { name: 'calendar', path: `${baseSvg}/calendar.svg` },
      { name: 'bar_chart', path: `${baseSvg}/bar_chart.svg` },
      { name: 'help', path: `${baseSvg}/help.svg` },
      { name: 'close', path: `${baseSvg}/close.svg` },
    ];

    icons.forEach((icon) => {
      return iconRegistery.addSvgIcon(
        icon.name,
        domSanitizer.bypassSecurityTrustResourceUrl(icon.path),
      );
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),

    provideHttpClient(withFetch()),
    provideToast(),
    provideAppInitializer(() => {
      const initializerFn = initializeIcon(
        inject(IconRegistery),
        inject(DomSanitizer),
      );
      return initializerFn();
    }),
  ],
};
