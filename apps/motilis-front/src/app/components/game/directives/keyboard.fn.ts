import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { isInWordeList } from '../../../shared/dictionary/dictionary';
import { LETTERS } from '../../../shared/mocks';
import { KEY_TYPE } from '../../../shared/models';
import { MotilisStore } from '../../../shared/store';
import { ToastService } from '../../../shared/toast/toast.service';

export const enterLetter = (letter: string, injector?: Injector) => {
  if (!injector) {
    assertInInjectionContext(enterLetter);
  }

  const assertedInjector = injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    const store = inject(MotilisStore);
    const gameStatus = store.gameStatus();
    const currentBoard = store.currentBoard();
    const solution = store.solution();

    if (gameStatus !== 'inProgress') {
      return;
    }

    const key = letter.toUpperCase();
    if (key.match('BACKSPACE|DELETE|ESCAPE')) {
      store.deleteLetter();
      return;
    }

    if (currentBoard.length < solution.length) {
      if (LETTERS.indexOf(key) > -1) {
        store.chooseLetter(letter);
        return;
      }
    }

    if (KEY_TYPE.ENTER === key && currentBoard.length === solution.length) {
      if (!isInWordeList(currentBoard)) {
        inject(ToastService).show({
          data: { text: `Le mot n'est pas dans la liste`, type: 'warning' },
        });
        return;
      }
      store.validWord();
    }
  });
};
