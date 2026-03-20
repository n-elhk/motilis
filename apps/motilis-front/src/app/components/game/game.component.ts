import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
} from '@angular/core';

import { map, fromEvent, throttleTime } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyboardDirective } from './directives/keyboard.directive';
import { enterLetter } from './directives/keyboard.fn';
import { SvgIcon } from '../../components';
import { StorageKey } from '../../shared/models/storage';
import { StorageService } from '../../shared/services/storage/storage.service';
import { MotilisStore } from '../../shared/store';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIcon, KeyboardDirective],
  host: {
    // '(window:storage)': 'touch($event)',
  },
})
export class GameComponent {
  private readonly motilisStore = inject(MotilisStore);
  private readonly injector = inject(Injector);
  private readonly storageService = inject(StorageService);

  readonly evaluations = this.motilisStore.evaluations;
  readonly currentBoard = this.motilisStore.currentBoard;
  readonly boardColIndex = this.motilisStore.colIndex;
  readonly boardRowIndex = this.motilisStore.rowIndex;
  readonly solution = this.motilisStore.solution;

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown', { passive: true })
      .pipe(
        throttleTime(200, undefined, { leading: true, trailing: true }),
        map((ev) => enterLetter(ev.key, this.injector)),
      )
      .pipe(takeUntilDestroyed())
      .subscribe();
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
