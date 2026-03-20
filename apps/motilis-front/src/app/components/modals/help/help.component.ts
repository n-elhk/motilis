import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { SvgIcon } from '../../icon';

@Component({
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIcon]
})
export class HelpComponent {
  readonly dialogRef = inject(DialogRef);
}
