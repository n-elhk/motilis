import {
  patchState,
  signalStore,
  withState,
  withMethods,
  withComputed,
  withHooks,
  withProps,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { produce } from 'immer';
import { interval, lastValueFrom, pipe, switchMap, tap } from 'rxjs';

import { ModalStatisticComponent } from '../../components/modals/modal-statistic/modal-statistic.component';
import { DictionaryLoader } from '../dictionary/dictionary-loader';
import { BOARD } from '../mocks';
import { type Board, Gameplay, GameStatus } from '../models';
import { StorageKey } from '../models/storage';
import type { MotilisStat } from '../models/statistic';
import { ApiService } from '../services/api/api.service';
import { MockApiService } from '../services/api/mock-api.service';
import { StorageService } from '../services/storage/storage.service';
import { ToastService } from '../toast/toast.service';
import { motilisEvents } from './motilis.events';
import { checkWord, describeRow, descryptSolution, getEvaluations, isTodayOrLater } from './motilis.fn';
import { type BoardState, RequestStatus } from './motilis.state';

export const initialState: BoardState = {
  boardState: { ...BOARD },
  solution: '',
  selectedDate: Temporal.Now.plainDateISO(),
  remainingTime: 0,
  gameplay: Gameplay.today,
  status: RequestStatus.INITIAL,
  error: '',
};

export const MotilisStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({
    _apiService: inject(ApiService),
    _mockApiService: inject(MockApiService),
    _storageService: inject(StorageService),
    _dialog: inject(Dialog),
    _dictionaryLoader: inject(DictionaryLoader),
    _dispatcher: inject(Dispatcher),
  })),
  withComputed(({ boardState, gameplay, selectedDate }) => ({
    currentBoard: computed(() => {
      const { rowIndex, attempts } = boardState();
      return attempts[rowIndex];
    }),

    attempts: computed(() => boardState().attempts),
    gameStatus: computed(() => boardState().gameStatus),
    isWaiting: computed(
      () => boardState().gameStatus !== GameStatus.inProgress,
    ),
    rowIndex: computed(() => boardState().rowIndex),
    evaluations: computed(() => boardState().evaluations),
    correctLetters: computed(() => boardState().correctLetters),
    partialLetters: computed(() => boardState().partialLetters),
    absentLetters: computed(() => boardState().absentLetters),
    canShowDate: computed(() => gameplay() === Gameplay.date),
    convertedDate: computed(() => selectedDate().toString()),
    colIndex: computed(() => {
      const { rowIndex, attempts } = boardState();
      return attempts[rowIndex].length - 1;
    }),
  })),
  withMethods((store) => {
    /** Sauvegarde le plateau, uniquement pour la partie du jour. */
    const saveBoardIfToday = (board: Board) => {
      if (store.gameplay() === Gameplay.today) {
        store._storageService.setStorage(StorageKey.BoardState, board);
      }
    };

    /** Met à jour la tentative en cours. */
    const updateCurrentAttempt = (update: (attempt: string) => string) => {
      patchState(store, (state) =>
        produce(state, (draft) => {
          const { rowIndex } = draft.boardState;
          draft.boardState.attempts[rowIndex] = update(draft.boardState.attempts[rowIndex]);
        }),
      );
      saveBoardIfToday(store.boardState());
    };

    return {
      chooseLetter: (letter: string) => updateCurrentAttempt((attempt) => attempt + letter),

      deleteLetter: () => updateCurrentAttempt((attempt) => attempt.slice(0, -1)),

      validWord: () => {
        const boardChecked = checkWord(store.boardState(), store.solution());

        patchState(store, { boardState: boardChecked });
        saveBoardIfToday(boardChecked);

        if (boardChecked.gameStatus !== GameStatus.inProgress) {
          store._storageService.updateStat(boardChecked.gameStatus, boardChecked.rowIndex + 1);
          store._dispatcher.dispatch(motilisEvents.gameEnded({ status: boardChecked.gameStatus }));
        }
      },

      openStats: () => {
        store._dialog.open(ModalStatisticComponent, {
          hasBackdrop: true,
          width: '500px',
          panelClass: 'popup',
          ariaLabelledBy: 'stat-dialog-title',
          data: store._storageService.getStorage<MotilisStat>(StorageKey.Stat),
        });
      },

      loadWordServer: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: RequestStatus.LOADING })),
          switchMap(() =>
            store._apiService.getMotilisToday().pipe(
              tapResponse({
                next: ({ solution, remainingTime }) => {
                  const solutionDecrypted = descryptSolution(solution);
                  const gameBoard = store._storageService.getStorage<Board>(StorageKey.BoardState);
                  patchState(store, (state) =>
                    produce(state, (draft) => {
                      draft.status = RequestStatus.LOADED;
                      draft.boardState = gameBoard;
                      draft.remainingTime = remainingTime;
                      draft.solution = solutionDecrypted;
                      draft.selectedDate = Temporal.Now.plainDateISO();
                      draft.gameplay = Gameplay.today;
                      draft.boardState.evaluations = getEvaluations(solutionDecrypted, gameBoard.evaluations);
                    }),
                  );
                },
                error: (err) => {
                  patchState(store, { status: RequestStatus.ERROR });
                  console.error(err);
                },
              }),
            ),
          ),
        ),
      ),

      loadWordLocaly: () => {
        const solution = store._mockApiService.getMotilis();
        patchState(store, (state) =>
          produce(state, (draft) => {
            draft.solution = solution;
            draft.gameplay = Gameplay.local;
            draft.boardState = { ...BOARD, evaluations: getEvaluations(solution, BOARD.evaluations) };
          }),
        );
      },

      _loadWordWithDate: async () => {
        try {
          patchState(store, { status: RequestStatus.LOADING });
          const solutionEncrypted = await lastValueFrom(
            store._apiService.getMotilisWithDate(store.selectedDate()),
          );
          const solution = descryptSolution(solutionEncrypted);
          patchState(store, (state) =>
            produce(state, (draft) => {
              draft.status = RequestStatus.LOADED;
              draft.gameplay = Gameplay.date;
              draft.solution = solution;
              draft.boardState = { ...BOARD, evaluations: getEvaluations(solution, BOARD.evaluations) };
            }),
          );
        } catch (error) {
          patchState(store, { status: RequestStatus.ERROR });
          console.error(error);
        }
      },

      updateRemainingTime: () => {
        patchState(store, (state) =>
          produce(state, (draft) => {
            draft.remainingTime = state.remainingTime - 1000;
          }),
        );
      },
    };
  }),
  withMethods((store) => ({
    increaseDate: async () => {
      if (isTodayOrLater(store.selectedDate())) {
        return;
      }
      patchState(store, (state) =>
        produce(state, (draft) => {
          draft.selectedDate = state.selectedDate.add({ days: 1 });
          draft.gameplay = Gameplay.date;
        }),
      );
      await store._loadWordWithDate();
    },

    decreaseDate: async () => {
      patchState(store, (state) =>
        produce(state, (draft) => {
          draft.selectedDate = state.selectedDate.subtract({ days: 1 });
          draft.gameplay = Gameplay.date;
        }),
      );
      await store._loadWordWithDate();
    },

    /**
     * Vérifie la tentative en cours dans le dictionnaire (chargé à la demande), puis la
     * valide. Le résultat est émis sous forme d'event (voir `motilisEvents`).
     */
    submitWord: async () => {
      const { rowIndex: row, attempts } = store.boardState();
      const word = attempts[row];

      const dictionary = await store._dictionaryLoader.load().catch((error: unknown) => {
        console.error(error);
        return null;
      });

      // La ligne a pu changer pendant le chargement (lettre effacée, double Entrée…).
      const current = store.boardState();
      if (current.gameStatus !== GameStatus.inProgress || current.rowIndex !== row || current.attempts[row] !== word) {
        return;
      }
      if (!dictionary) {
        store._dispatcher.dispatch(motilisEvents.dictionaryUnavailable());
        return;
      }
      if (!dictionary.has(word)) {
        store._dispatcher.dispatch(motilisEvents.wordRejected());
        return;
      }
      store.validWord();
      store._dispatcher.dispatch(
        motilisEvents.wordValidated({ word, evaluation: store.boardState().evaluations[row] }),
      );
    },
  })),
  withEventHandlers(
    (store, events = inject(Events), toast = inject(ToastService), announcer = inject(LiveAnnouncer)) => ({
      wordRejected$: events.on(motilisEvents.wordRejected).pipe(
        tap(() => toast.show({ data: { text: `Le mot n'est pas dans la liste`, type: 'warning' } })),
      ),
      dictionaryUnavailable$: events.on(motilisEvents.dictionaryUnavailable).pipe(
        tap(() =>
          toast.show({
            data: {
              text: `Impossible de charger le dictionnaire. Vérifiez votre connexion ou rechargez la page`,
              type: 'warning',
            },
          }),
        ),
      ),
      gameEnded$: events.on(motilisEvents.gameEnded).pipe(tap(() => store.openStats())),
      wordValidated$: events.on(motilisEvents.wordValidated).pipe(
        tap(({ payload }) => announcer.announce(describeRow(payload.word, payload.evaluation), 'polite')),
      ),
    }),
  ),
  withHooks((store) => {
    return {
      onInit: () => {
        interval(1_000)
          .pipe(
            tap(() => store.updateRemainingTime()),
            takeUntilDestroyed(),
          )
          .subscribe();

        store._apiService
          .wordChanged$()
          .pipe(
            tap(() => store.loadWordServer()),
            takeUntilDestroyed(),
          )
          .subscribe();
      },
    };
  }),
);
