import { Component, computed, input } from '@angular/core';
import { padStart } from '../../shared/services/api/api.service';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
})
export class CountdownComponent {
  readonly remainingTime = input.required<number>();

  readonly countdown = computed(() => {
    const { hours, minutes, seconds } = this.countdownToDate(
      this.remainingTime(),
    );
    return `${padStart(hours, '0')}:${padStart(minutes, '0')}:${padStart(seconds, '0')}`;
  });

  private countdownToDate(remainingTime: number) {
    // Convertir la différence en heures, minutes et secondes
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor(
      (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
    );
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    // Afficher le décompte
    return { hours, minutes, seconds };
  }
}
