import { ClipboardModule } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { SvgIcon } from '../../icon';
import {
  bestAttempts,
  bestStreak,
  currentStreak,
  percentWin,
} from './modal-statistic.fn';
import { CountdownComponent } from '../../countdown/countdown.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TooltipDirective } from '../../../shared/directives';
import { SquareAttempt } from '../../../shared/models';
import { MotilisStat } from '../../../shared/models/statistic';
import { MotilisStore } from '../../../shared/store';

@Component({
  templateUrl: './modal-statistic.component.html',
  styleUrl: './modal-statistic.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIcon, TooltipDirective, ClipboardModule, CountdownComponent],
})
export class ModalStatisticComponent {
  private readonly motilisStore = inject(MotilisStore);
  readonly dialogRef = inject(DialogRef);
  readonly data = inject<MotilisStat>(DIALOG_DATA);

  readonly tooltip = viewChild.required(TooltipDirective);

  readonly remainingTime = this.motilisStore.remainingTime;
  readonly isWainting = this.motilisStore.isWainting;
  readonly solution = this.motilisStore.solution;
  readonly status = this.motilisStore.gameStatus;

  readonly bestStreak = bestStreak(this.data.games)[0];
  readonly currentStreak = currentStreak(this.data.games);
  readonly bestAttempts = bestAttempts(this.data.games);

  readonly percentWin = Math.round(percentWin(this.data.games));

  readonly url = computed(() => {
    const evaluations = this.motilisStore.evaluations();
    const rowIndex = this.motilisStore.rowIndex();
    let tweetText = `wordle (@wordle) ${rowIndex}/${evaluations.length} \n`;

    for (let index = 0; index < rowIndex + 1; index++) {
      const attempts = evaluations[index];
      attempts.forEach(
        (attempt) => (tweetText = tweetText + SquareAttempt[attempt]),
      );
      tweetText = tweetText + `\n`;
    }
    return `https://twitter.com/intent/tweet?text=${tweetText}&related=tusmo_xyz,neurosis_44`;
  });

  public clipBord(): void {
    this.tooltip().show();
    setTimeout(() => this.tooltip().hide(), 500);
  }
}
