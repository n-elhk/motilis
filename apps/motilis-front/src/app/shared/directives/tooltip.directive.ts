import {
  Overlay,
  OverlayRef,
  OverlayPositionBuilder,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { TooltipComponent } from '../../components/tooltip/tooltip.component';

@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'showlistner()',
    '(mouseout)': 'hide()',
  },
})
export class TooltipDirective {
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private readonly overlayPositionBuilder = inject(OverlayPositionBuilder);

  readonly text = input('', { alias: 'appTooltip' });

  readonly disabled = input(false, { transform: booleanAttribute });

  readonly withClick = input(false, { transform: booleanAttribute });

  private overlayRef: OverlayRef | undefined = undefined;

  private get canOpenTooltip() {
    if (!this.disabled() && !this.overlayRef) {
      return true;
    }
    return false;
  }

  private get overlayOption(): FlexibleConnectedPositionStrategy {
    return this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ]);
  }

  public show(): void {
    if (!this.canOpenTooltip) {
      return;
    }

    const positionStrategy = this.overlayOption;

    this.overlayRef = this.overlay.create({ positionStrategy });

    const tooltipRef = this.overlayRef.attach(
      new ComponentPortal(TooltipComponent),
    );
    tooltipRef.instance.text = this.text();
  }

  showlistner(): void {
    if (this.withClick() || !this.canOpenTooltip) {
      return;
    }
    this.show();
  }

  hide(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }

    this.overlayRef = undefined;
  }
}
