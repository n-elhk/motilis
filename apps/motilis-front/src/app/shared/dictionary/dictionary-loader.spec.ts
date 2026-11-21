import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DictionaryLoader } from './dictionary-loader';

describe('DictionaryLoader', () => {
  const setup = (platform: 'browser' | 'server') => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    return TestBed.inject(DictionaryLoader);
  };

  it('charge le dictionnaire à la demande', async () => {
    const dictionary = await setup('browser').load();

    expect(dictionary.has('bible')).toBe(true);
    expect(dictionary.has('zzzz')).toBe(false);
  });

  it('renvoie la même instance à chaque chargement', async () => {
    const loader = setup('browser');

    expect(await loader.load()).toBe(await loader.load());
  });

  it('ne précharge rien côté serveur (prérendu)', () => {
    const loader = setup('server');
    const load = vi.spyOn(loader, 'load');

    loader.prefetch();

    expect(load).not.toHaveBeenCalled();
  });
});
