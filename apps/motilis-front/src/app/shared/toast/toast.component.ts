import { Component, inject, linkedSignal } from '@angular/core';
import { map, timer, merge, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { TOAST_CONFIG, TOAST_DATA } from './toast-config';
import { ToastRef } from './toast-ref';

export enum ToastAnimation {
  Default = 'default',
  Closing = 'closing',
}

@Component({
  templateUrl: './toast.component.html',
  styleUrls: ['toast.component.css'],

  // On bind les CSS vars au host (durées dynamiques)
  host: {
    class: 'toast-host',
    '[style.--fadeIn]': '(toastConfig.animation?.fadeIn ?? 150) + "ms"',
    '[style.--fadeOut]': '(toastConfig.animation?.fadeOut ?? 120) + "ms"',
  },
})
export class ToastComponent {
  private readonly ref = inject(ToastRef);
  readonly toastConfig = inject(TOAST_CONFIG);
  readonly data = inject(TOAST_DATA);

  readonly ToastAnimation = ToastAnimation;

  // Ton flux d'état existant
  private readonly animationState$ = merge(
    of(ToastAnimation.Default),
    timer(5000).pipe(map(() => ToastAnimation.Closing)),
  );

  readonly animationState = toSignal(this.animationState$, {
    requireSync: true,
  });

  // Visible = contrôle le rendu (et donc animate.leave)
  readonly visible = linkedSignal({
    source: () => this.animationState(),
    computation: (state) => state !== ToastAnimation.Closing,
  });

  /** fermeture “manuelle” (bouton, click, etc.) */
  startClose(): void {
    this.visible.set(false);
  }

  /** appelée quand l’anim de sortie finit */
  onAnimationEnd(event: AnimationEvent): void {
    // Ne fermer qu’à la fin du leave (fade-out)
    if (!event.animationName.includes('toastLeave')) return;

    // Si le toast est en train de sortir (visible=false), on ferme la ref
    if (!this.visible()) {
      this.ref.close();
    }
  }
}
