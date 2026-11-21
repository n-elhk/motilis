import { Component, DOCUMENT, inject, Injector } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';

import { filter, fromEvent } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyboardDirective } from './directives/keyboard.directive';
import { enterLetter, STATE_LABELS } from './directives/keyboard.fn';
import { SvgIcon } from '../../components';
import { StorageKey } from '../../shared/models/storage';
import { StorageService } from '../../shared/services/storage/storage.service';
import { MotilisStore } from '../../shared/store';
import { DictionaryLoader } from '../../shared/dictionary/dictionary-loader';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [SvgIcon, KeyboardDirective],
  host: {
    // '(window:storage)': 'touch($event)',
  },
})
export class GameComponent {
  private readonly motilisStore = inject(MotilisStore);
  private readonly injector = inject(Injector);
  private readonly storageService = inject(StorageService);
  private readonly dialog = inject(Dialog);

  readonly evaluations = this.motilisStore.evaluations;
  readonly currentBoard = this.motilisStore.currentBoard;
  readonly boardColIndex = this.motilisStore.colIndex;
  readonly boardRowIndex = this.motilisStore.rowIndex;
  readonly solution = this.motilisStore.solution;

  readonly stateLabels: Record<string, string | undefined> = STATE_LABELS;

  constructor() {
    // Télécharge le dictionnaire dès que le navigateur est inactif, pour que la
    // première validation n'attende pas le réseau.
    inject(DictionaryLoader).prefetch();

    fromEvent<KeyboardEvent>(inject(DOCUMENT), 'keydown')
      .pipe(
        filter((ev) => this.isGameKey(ev)),
        takeUntilDestroyed(),
      )
      .subscribe((ev) => enterLetter(ev.key, this.injector));
  }

  /** Physical keyboard input belongs to the game only when nothing else should handle it. */
  private isGameKey(ev: KeyboardEvent): boolean {
    if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) {
      return false;
    }
    // Keys typed while a dialog is open must not edit the board behind it.
    if (this.dialog.openDialogs.length > 0) {
      return false;
    }
    // Enter on a focused control activates that control, not the word validation.
    const target = ev.target as Element | null;
    if (ev.key === 'Enter' && target?.closest('button, a, input, textarea, select')) {
      return false;
    }
    return true;
  }

  public displayLetter(value: string, index: number, index2: number): string {
    const attempts = this.motilisStore.attempts();
    const rowIndex = this.motilisStore.rowIndex();
    const letters = Array.from(value);
    if (index < rowIndex) {
      return Array.from(attempts[index])[index2];
    } else if (index === rowIndex) {
      return letters[index2] ? letters[index2] : '';
    }
    return '';
  }

  private touch(event: StorageEvent): void {
    if (event.key === StorageKey.BoardState) {
      this.storageService.removeAndReload(event.key);
    }
  }
}
