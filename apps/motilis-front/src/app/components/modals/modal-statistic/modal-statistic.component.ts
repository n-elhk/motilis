import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, computed, inject, viewChild } from '@angular/core';
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
import { pluralize } from '../../../shared/utils';

@Component({
  templateUrl: './modal-statistic.component.html',
  styleUrl: './modal-statistic.component.css',
  imports: [SvgIcon, TooltipDirective, ClipboardModule, CountdownComponent],
})
export class ModalStatisticComponent {
  private readonly motilisStore = inject(MotilisStore);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  readonly dialogRef = inject(DialogRef);
  readonly data = inject<MotilisStat>(DIALOG_DATA);

  readonly tooltip = viewChild.required(TooltipDirective);

  readonly remainingTime = this.motilisStore.remainingTime;
  readonly isWaiting = this.motilisStore.isWaiting;
  readonly solution = this.motilisStore.solution;
  readonly status = this.motilisStore.gameStatus;

  readonly bestStreak = bestStreak(this.data.games)[0];
  readonly currentStreak = currentStreak(this.data.games);
  readonly performances = bestAttempts(this.data.games).map(
    (count, i, all) => {
      const isLoss = i === all.length - 1;
      return {
        count,
        isLoss,
        label: isLoss
          ? 'Parties perdues'
          : pluralize(i + 1, {
              one: 'Gagnées en {count} essai',
              other: 'Gagnées en {count} essais',
            }),
        valueText: pluralize(count, {
          one: '{count} partie',
          other: '{count} parties',
        }),
      };
    },
  );

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
    this.liveAnnouncer.announce('Lien copié', 'polite');
    setTimeout(() => this.tooltip().hide(), 500);
  }
}
