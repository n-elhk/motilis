import { ErrorHandler, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotilisStore } from '../../../shared/store';
import { enterLetter } from './keyboard.fn';

describe('enterLetter, touche Entrée', () => {
  const setup = (word: string, submitWord: () => Promise<void>) => {
    const errorHandler = { handleError: vi.fn() };
    const store = {
      gameStatus: signal('inProgress'),
      currentBoard: signal(word),
      solution: signal('paix'),
      submitWord: vi.fn(submitWord),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: MotilisStore, useValue: store },
        { provide: ErrorHandler, useValue: errorHandler },
      ],
    });
    return { store, errorHandler, injector: TestBed.inject(Injector) };
  };

  it('soumet le mot quand la ligne est complète', () => {
    const { store, injector } = setup('pain', async () => undefined);

    enterLetter('Enter', injector);

    expect(store.submitWord).toHaveBeenCalledOnce();
  });

  it('ne soumet rien quand la ligne est incomplète', () => {
    const { store, injector } = setup('pai', async () => undefined);

    enterLetter('Enter', injector);

    expect(store.submitWord).not.toHaveBeenCalled();
  });

  it("transmet à l'ErrorHandler une erreur levée pendant la soumission", async () => {
    const error = new Error('boom');
    const { errorHandler, injector } = setup('pain', () => Promise.reject(error));

    enterLetter('Enter', injector);
    await new Promise((resolve) => setTimeout(resolve));

    expect(errorHandler.handleError).toHaveBeenCalledWith(error);
  });
});
