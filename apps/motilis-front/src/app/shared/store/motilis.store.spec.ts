import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { patchState } from '@ngrx/signals';
import { Dispatcher } from '@ngrx/signals/events';
import { unprotected } from '@ngrx/signals/testing';
import { NEVER } from 'rxjs';
import { ModalStatisticComponent } from '../../components/modals/modal-statistic/modal-statistic.component';
import { DictionaryLoader } from '../dictionary/dictionary-loader';
import type DictionaryService from '../dictionary/dictionary.service';
import { BOARD } from '../mocks';
import { ApiService } from '../services/api/api.service';
import { MockApiService } from '../services/api/mock-api.service';
import { StorageService } from '../services/storage/storage.service';
import { ToastService } from '../toast/toast.service';
import { motilisEvents } from './motilis.events';
import { MotilisStore } from './motilis.store';

const dictionaryWith = (...words: string[]) =>
  ({ has: (word: string) => words.includes(word) }) as DictionaryService;

describe('MotilisStore', () => {
  let toast: { show: ReturnType<typeof vi.fn> };
  let announcer: { announce: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn>; openDialogs: unknown[] };
  let storage: { setStorage: ReturnType<typeof vi.fn>; updateStat: ReturnType<typeof vi.fn>; getStorage: ReturnType<typeof vi.fn> };
  let loader: { load: ReturnType<typeof vi.fn> };
  let dispatcher: Dispatcher;
  let store: InstanceType<typeof MotilisStore>;

  /** Place `attempt` sur la ligne `rowIndex`, avec `paix` comme solution. */
  const play = (attempt: string, rowIndex = 0) => {
    const attempts = ['', '', '', '', '', ''];
    attempts[rowIndex] = attempt;
    patchState(unprotected(store), { solution: 'paix', boardState: { ...BOARD, attempts, rowIndex } });
  };

  beforeEach(() => {
    toast = { show: vi.fn() };
    announcer = { announce: vi.fn() };
    dialog = { open: vi.fn(), openDialogs: [] };
    storage = { setStorage: vi.fn(), updateStat: vi.fn(), getStorage: vi.fn(() => ({ games: [] })) };
    loader = { load: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: { wordChanged$: () => NEVER } },
        { provide: MockApiService, useValue: {} },
        { provide: ToastService, useValue: toast },
        { provide: LiveAnnouncer, useValue: announcer },
        { provide: Dialog, useValue: dialog },
        { provide: StorageService, useValue: storage },
        { provide: DictionaryLoader, useValue: loader },
      ],
    });
    store = TestBed.inject(MotilisStore);
    dispatcher = TestBed.inject(Dispatcher);
    vi.spyOn(dispatcher, 'dispatch');
  });

  describe('submitWord', () => {
    it('valide un mot du dictionnaire et émet wordValidated', async () => {
      loader.load.mockResolvedValue(dictionaryWith('pain'));
      play('pain');

      await store.submitWord();

      expect(store.rowIndex()).toBe(1);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        motilisEvents.wordValidated({ word: 'pain', evaluation: ['correct', 'correct', 'correct', 'absent'] }),
      );
    });

    it('émet wordRejected pour un mot absent du dictionnaire', async () => {
      loader.load.mockResolvedValue(dictionaryWith('paix'));
      play('pain');

      await store.submitWord();

      expect(store.rowIndex()).toBe(0);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(motilisEvents.wordRejected());
    });

    it('émet dictionaryUnavailable si le dictionnaire ne se charge pas', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loader.load.mockRejectedValue(new Error('network'));
      play('pain');

      await store.submitWord();

      expect(store.rowIndex()).toBe(0);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(motilisEvents.dictionaryUnavailable());
    });

    it('ne fait rien si la ligne a changé pendant le chargement', async () => {
      let resolve!: (dictionary: DictionaryService) => void;
      loader.load.mockReturnValue(new Promise<DictionaryService>((r) => (resolve = r)));
      play('pain');

      const pending = store.submitWord();
      store.deleteLetter();
      resolve(dictionaryWith('pain', 'pai'));
      await pending;

      expect(store.rowIndex()).toBe(0);
      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('ne valide la ligne qu’une fois en cas de double Entrée', async () => {
      loader.load.mockResolvedValue(dictionaryWith('pain'));
      play('pain');

      await Promise.all([store.submitWord(), store.submitWord()]);

      expect(store.rowIndex()).toBe(1);
    });
  });

  describe('validWord', () => {
    it('émet gameEnded et enregistre la stat quand le mot est trouvé', () => {
      play('paix');

      store.validWord();

      expect(storage.updateStat).toHaveBeenCalledWith('win', 1);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(motilisEvents.gameEnded({ status: 'win' }));
    });

    it('émet gameEnded (perdu) après la dernière tentative', () => {
      play('pain', 5);

      store.validWord();

      expect(dispatcher.dispatch).toHaveBeenCalledWith(motilisEvents.gameEnded({ status: 'loose' }));
    });

    it("n'émet rien tant que la partie continue", () => {
      play('pain');

      store.validWord();

      expect(store.rowIndex()).toBe(1);
      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('handlers des events', () => {
    it('affiche un toast quand le mot est refusé', () => {
      dispatcher.dispatch(motilisEvents.wordRejected());

      expect(toast.show).toHaveBeenCalledWith({
        data: { text: `Le mot n'est pas dans la liste`, type: 'warning' },
      });
    });

    it('affiche un toast quand le dictionnaire est indisponible', () => {
      dispatcher.dispatch(motilisEvents.dictionaryUnavailable());

      expect(toast.show).toHaveBeenCalledWith({
        data: expect.objectContaining({ text: expect.stringContaining('rechargez la page') }),
      });
    });

    it('annonce la ligne validée aux lecteurs d’écran', () => {
      dispatcher.dispatch(
        motilisEvents.wordValidated({ word: 'pain', evaluation: ['correct', 'partial', 'absent', 'absent'] }),
      );

      expect(announcer.announce).toHaveBeenCalledWith(
        'PAIN : P bien placée, A mal placée, I absente, N absente',
        'polite',
      );
    });

    it('ouvre la modale de statistiques en fin de partie', () => {
      dispatcher.dispatch(motilisEvents.gameEnded({ status: 'win' }));

      expect(dialog.open).toHaveBeenCalledWith(
        ModalStatisticComponent,
        expect.objectContaining({ ariaLabelledBy: 'stat-dialog-title', data: { games: [] } }),
      );
    });
  });
});
