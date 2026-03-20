import { patchState, WritableStateSource } from "@ngrx/signals";
import { produce } from "immer";
import { BoardState, RequestStatus, MotilisStoreType } from "./motilis.state";
import { inject } from "@angular/core";
import { StorageService } from "../services/storage/storage.service";
import { StorageKey } from "../models/storage";
import { checkWord, descryptSolution, getEvaluations, isDateSuperiorThanToday } from "./motilis.fn";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";
import { pipe, tap, switchMap, lastValueFrom } from "rxjs";
import { Board, Gameplay, GameStatus } from "../models";
import { ApiService } from "../services/api/api.service";
import { BOARD } from "../mocks";
import { MockApiService } from "../services/api/mock-api.service";
import { Dialog } from "@angular/cdk/dialog";
import { ModalStatisticComponent } from "../../components";
import { MotilisStat } from "../models/statistic";

export const chooseLetterMethod = (
  store: MotilisStoreType,
  letter: string,
  storageService = inject(StorageService)) => {
  patchState(store, state =>
    produce(state, draft => {
      const { rowIndex, attempts } = state.boardState;
      draft.boardState.attempts[rowIndex] = attempts[rowIndex] + letter;
      if (store.gameplay() === Gameplay.today) {
        storageService.setStorage(StorageKey.BoardState, draft.boardState);
      }
    })
  );
};

export const deleteLetterMethod = (store: MotilisStoreType, storageService = inject(StorageService)) => {
  patchState(store, state =>
    produce(state, draft => {
      const { rowIndex, attempts } = state.boardState;
      draft.boardState.attempts[rowIndex] = attempts[rowIndex].slice(
        0,
        -1
      );
      if (store.gameplay() === Gameplay.today) {
        storageService.setStorage(StorageKey.BoardState, draft.boardState);
      }
    })
  );
};

export const validWordMethod = (store: MotilisStoreType, storageService = inject(StorageService), dialog = inject(Dialog)) => {
  patchState(store, state =>
    produce(state, draft => {
      const boardChecked = checkWord(
        state.boardState,
        state.solution
      );

      if (boardChecked.gameStatus !== GameStatus.inProgress) {
        storageService.updateStat(
          boardChecked.gameStatus,
          boardChecked.rowIndex + 1
        );
        openStatDialogFn(dialog, storageService);
      }

      draft.boardState = boardChecked;

      if (store.gameplay() === Gameplay.today) {
        storageService.setStorage(StorageKey.BoardState, boardChecked);
      }
    })
  );
};

export const loadWordServerMethod = (
  store: WritableStateSource<BoardState>,
  apiService = inject(ApiService),
  storageService = inject(StorageService)) => {
  return rxMethod<void>(
    pipe(
      tap(() => patchState(store, { status: RequestStatus.LOADING })),
      switchMap(() => {
        return apiService.getMotilisToday().pipe(
          tapResponse({
            next: ({ solution, remainingTime }) => {
              patchState(store, state =>
                produce(state, draft => {
                  const solutionDecrypted = descryptSolution(solution)
                  const gameBoard = storageService.getStorage<Board>(
                    StorageKey.BoardState
                  );
                  draft.status = RequestStatus.LOADED;
                  draft.boardState = gameBoard;
                  draft.remainingTime = remainingTime;
                  draft.solution = solutionDecrypted;
                  draft.selectedDate = new Date();
                  draft.gameplay = Gameplay.today;
                  draft.boardState.evaluations = getEvaluations(
                    solutionDecrypted,
                    gameBoard.evaluations
                  );
                })
              );
            },
            error: err => {
              patchState(store, { status: RequestStatus.ERROR });
              console.error(err);
            },
          })
        );
      })
    )
  )
};

export const loadWordLocalyMethod = (
  store: WritableStateSource<BoardState>,
  mockApiService: MockApiService
) => {
  patchState(store, state =>
    produce(state, draft => {
      const solution = mockApiService.getMotilis();
      const boardState = { ...BOARD }

      draft.solution = solution;
      draft.gameplay = Gameplay.local
      draft.boardState = boardState;
      draft.boardState.evaluations = getEvaluations(
        solution,
        boardState.evaluations
      );
    })
  );
};



export const loadWordWithDateMethod = async (
  store: MotilisStoreType,
  apiService: ApiService
) => {
  try {
    patchState(store, { status: RequestStatus.LOADING });
    const solutionEncrypted = await lastValueFrom(apiService.getMotilisWithDate(store.selectedDate()));
    const solution = descryptSolution(solutionEncrypted);
    patchState(store, state =>
      produce(state, draft => {
        const boardState = { ...BOARD }
        draft.status = RequestStatus.LOADED;
        draft.gameplay = Gameplay.date
        draft.boardState = boardState;
        draft.solution = solution;
        draft.boardState.evaluations = getEvaluations(
          solution,
          boardState.evaluations
        );
      })
    );
  } catch (error) {
    patchState(store, { status: RequestStatus.ERROR });
    console.error(error);
  }

};

export const increaseDateMethod = async (
  store: MotilisStoreType,
  apiService: ApiService
) => {

  if (isDateSuperiorThanToday(store.selectedDate())) { return }

  patchState(store, state =>
    produce(state, draft => {
      const selectedDate = store.selectedDate();
      selectedDate.setDate(selectedDate.getDate() + 1);
      const nextDay = new Date(selectedDate);
      draft.selectedDate = nextDay
      draft.gameplay = Gameplay.date;
    })
  );

  await loadWordWithDateMethod(store, apiService);
};

export const deceaseDateMethod = async (
  store: MotilisStoreType,
  apiService: ApiService
) => {
  patchState(store, state =>
    produce(state, draft => {
      const selectedDate = store.selectedDate();
      selectedDate.setDate(selectedDate.getDate() - 1);
      const previousDay = new Date(selectedDate);
      draft.selectedDate = previousDay
      draft.gameplay = Gameplay.date;
    })
  );

  await loadWordWithDateMethod(store, apiService);
};


export const updateRemainingTimeMethod = async (
  store: MotilisStoreType,
) => {
  patchState(store, state =>
    produce(state, draft => {
      draft.remainingTime = state.remainingTime - 1000;
    })
  );
};

export const openStatDialogFn = (dialog: Dialog, storageService: StorageService) => {
  const motilisStat = storageService.getStorage<MotilisStat>(StorageKey.Stat);
  dialog.open(ModalStatisticComponent, {
    hasBackdrop: true,
    width: '500px',
    panelClass: 'popup',
    data: motilisStat,
  });
}

