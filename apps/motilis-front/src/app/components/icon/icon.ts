import {
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';
import { IconRegistery } from './icon-registery';
import { tap } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  template: '<ng-content />',
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'svg-icon',
  exportAs: 'svgIcon',
  styleUrls: ['./icon.css'],
  host: {
    role: 'img',
    class: 'svg-icon notranslate',
  },
  encapsulation: ViewEncapsulation.None,
})
export class SvgIcon {
  private _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private iconRegistery = inject(IconRegistery);

  readonly svgName = input.required<string>();

  readonly svgResource = rxResource({
    params: () => ({ svgName: this.svgName() }),
    stream: ({ params }) => this.loadRequestSvg(params.svgName),
  });

  loadRequestSvg(svgName: string) {
    return this.iconRegistery.getNamedSvgIcon(svgName).pipe(
      tap(() => this._clearSvgElement()),
      tap((svg) => this._setSvgElement(svg)),
    );
  }

  private _clearSvgElement(): void {
    const layoutElement: HTMLElement = this._elementRef.nativeElement;
    let childCount = layoutElement.childNodes.length;

    // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
    // we can't use innerHTML, because IE will throw if the element has a data binding.
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];

      // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
      // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
        child.remove();
      }
    }
  }

  private _setSvgElement(svg: SVGElement): void {
    this._clearSvgElement();

    this._elementRef.nativeElement.appendChild(svg);
  }
}
