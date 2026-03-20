import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  withHooks,
  withProps,
} from '@ngrx/signals';

import { Gameplay, GameStatus } from '../models';
import { BOARD } from '../mocks';
import { computed, inject } from '@angular/core';
import { type BoardState, RequestStatus } from './motilis.state';
import {
  chooseLetterMethod,
  deceaseDateMethod,
  deleteLetterMethod,
  increaseDateMethod,
  loadWordLocalyMethod,
  loadWordServerMethod,
  updateRemainingTimeMethod,
  validWordMethod,
} from './motilis.methods';
import { MockApiService } from '../services/api/mock-api.service';
import { ApiService, convertDate } from '../services/api/api.service';
import { interval, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const initialState: BoardState = {
  boardState: { ...BOARD },
  solution: '',
  selectedDate: new Date(),
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
  })),
  withComputed(({ boardState, gameplay, selectedDate }) => ({
    currentBoard: computed(() => {
      const { rowIndex, attempts } = boardState();
      return attempts[rowIndex];
    }),

    attempts: computed(() => boardState().attempts),
    gameStatus: computed(() => boardState().gameStatus),
    isWainting: computed(
      () => boardState().gameStatus !== GameStatus.inProgress,
    ),
    rowIndex: computed(() => boardState().rowIndex),
    evaluations: computed(() => boardState().evaluations),
    correctLetters: computed(() => boardState().correctLetters),
    partialLetters: computed(() => boardState().partialLetters),
    absentLetters: computed(() => boardState().absentLetters),
    canShowDate: computed(() => gameplay() === Gameplay.date),
    convertedDate: computed(() => convertDate(selectedDate())),
    colIndex: computed(() => {
      const { rowIndex, attempts } = boardState();
      return attempts[rowIndex].length - 1;
    }),
  })),
  withMethods((store) => ({
    chooseLetter: (letter: string) => chooseLetterMethod(store, letter),
    deleteLetter: () => deleteLetterMethod(store),
    validWord: () => validWordMethod(store),
    loadWordServer: loadWordServerMethod(store),
    loadWordLocaly: () => loadWordLocalyMethod(store, store._mockApiService),
    increaseDate: async () => increaseDateMethod(store, store._apiService),
    updateRemainingTime: async () => updateRemainingTimeMethod(store),
    decreaseDate: async () => deceaseDateMethod(store, store._apiService),
  })),
  withHooks((store) => {
    return {
      onInit: () => {
        // store.loadWordServer();

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
