import {
  Directive,
  ElementRef,
  Injector,
  computed,
  inject,
} from '@angular/core';
import { enterLetter, STATE_LABELS } from './keyboard.fn';
import { MotilisStore } from '../../../shared/store';

const SPECIAL_KEY_LABELS: Record<string, string> = {
  enter: 'Valider',
  delete: 'Effacer',
};

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'button[wdKeyboard]',
  host: {
    '(click)': 'onClick()',
    // Keep focus off on-screen keys clicked with a pointer, so a later physical
    // Enter validates the word instead of re-activating the last clicked key.
    '(mousedown)': '$event.preventDefault()',
    '[attr.aria-label]': 'label()',
    '[class.correct]': 'correctLetters() && !partialLetters()',
    '[class.partial]': 'partialLetters()',
    '[class.absent]': 'absentLetters()',
  },
})
export class KeyboardDirective {
  private readonly injector = inject(Injector);
  private readonly motilisStore = inject(MotilisStore);
  private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);

  private readonly value = this.element.nativeElement.value;

  readonly correctLetters = computed(() =>
    this.motilisStore.correctLetters().includes(this.value),
  );
  readonly partialLetters = computed(() =>
    this.motilisStore.partialLetters().includes(this.value),
  );
  readonly absentLetters = computed(() =>
    this.motilisStore.absentLetters().includes(this.value),
  );

  /** Visible letter first (WCAG 2.5.3), then its state, which is otherwise only shown by colour. */
  readonly label = computed(() => {
    const special = SPECIAL_KEY_LABELS[this.value];
    if (special) {
      return special;
    }
    const state = this.partialLetters()
      ? STATE_LABELS.partial
      : this.correctLetters()
        ? STATE_LABELS.correct
        : this.absentLetters()
          ? STATE_LABELS.absent
          : undefined;
    const letter = this.value.toUpperCase();
    return state ? `${letter}, ${state}` : letter;
  });

  onClick() {
    enterLetter(this.value, this.injector);
  }
}
