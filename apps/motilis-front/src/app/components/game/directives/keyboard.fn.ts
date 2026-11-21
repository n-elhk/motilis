import {
  ErrorHandler,
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { LETTERS } from '../../../shared/mocks';
import { KEY_TYPE } from '../../../shared/models';
import { MotilisStore } from '../../../shared/store';

export { STATE_LABELS } from '../../../shared/store';

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
      store.submitWord().catch((error: unknown) =>
        assertedInjector.get(ErrorHandler).handleError(error),
      );
    }
  });
};
