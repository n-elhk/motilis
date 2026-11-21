import { Injector, PLATFORM_ID, Service, inject, injectAsync, onIdle, runInInjectionContext } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type DictionaryService from './dictionary.service';

/**
 * Charge à la demande le dictionnaire (~255 kB), qui reste ainsi hors du bundle initial.
 * Un seul chargeur est partagé par toute l'application : le préchargement et les
 * validations attendent la même promesse.
 *
 * Ce fichier ne doit importer `./dictionary.service` qu'en type ou via `import()`.
 */
@Service()
export class DictionaryLoader {
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loader = this.createLoader();

  /** Télécharge le dictionnaire quand le navigateur est inactif (jamais côté serveur). */
  prefetch(): void {
    if (!this.isBrowser) {
      return;
    }
    runInInjectionContext(this.injector, () => onIdle())
      .then(() => this.load())
      .catch(() => {
        // L'échec est retenté au prochain `load()`.
      });
  }

  async load(): Promise<DictionaryService> {
    try {
      return await this.loader();
    } catch (error) {
      // Le chargeur mémorise sa promesse : on le recrée pour pouvoir réessayer.
      this.loader = this.createLoader();
      throw error;
    }
  }

  private createLoader() {
    return runInInjectionContext(this.injector, () =>
      injectAsync(() => import('./dictionary.service')),
    );
  }
}
