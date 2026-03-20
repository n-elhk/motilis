import {
  Directive,
  ElementRef,
  Injector,
  computed,
  inject,
} from '@angular/core';
import { enterLetter } from './keyboard.fn';
import { MotilisStore } from '../../../shared/store';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'button[wdKeyboard]',
  host: {
    '(click)': 'onClick()',
    '[class.correct]': 'correctLetters() && !partialLetters()',
    '[class.partial]': 'partialLetters()',
    '[class.absent]': 'absentLetters()',
  },
})
export class KeyboardDirective {
  private readonly injector = inject(Injector);
  private readonly motilisStore = inject(MotilisStore);
  private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);

  readonly correctLetters = computed(() =>
    this.motilisStore
      .correctLetters()
      .includes(this.element.nativeElement.value),
  );
  readonly partialLetters = computed(() =>
    this.motilisStore
      .partialLetters()
      .includes(this.element.nativeElement.value),
  );
  readonly absentLetters = computed(() =>
    this.motilisStore
      .absentLetters()
      .includes(this.element.nativeElement.value),
  );


  onClick() {
    enterLetter(this.element.nativeElement.value, this.injector);
  }
}
