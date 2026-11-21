import { Component } from '@angular/core';

@Component({
  template: `<div animate.enter="fade-in" animate.leave="fade-out">{{ text }}</div>`,
  styles: [`
    :host { color: var(--text-color); }

    /* Classes d'entrée/sortie que Angular applique */
    .fade-in {
      animation: fadeIn 300ms ease forwards;
    }

    .fade-out {
      animation: fadeOut 300ms ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  `],
})
export class TooltipComponent {
  public text = '';
}
