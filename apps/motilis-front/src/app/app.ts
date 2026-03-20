import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { SvgIcon, HelpComponent } from './components';
import { GameComponent } from './components/game/game.component';
import { Dialog } from '@angular/cdk/dialog';
import { Gameplay } from './shared/models';
import { StorageService } from './shared/services/storage/storage.service';
import { MotilisStore, RequestStatus } from './shared/store';
import { openStatDialogFn } from './shared/store/motilis.methods';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIcon, GameComponent],
})
export class App {
  private readonly dialog = inject(Dialog);
  private readonly vcr = inject(ViewContainerRef);
  private readonly motilisStore = inject(MotilisStore);
  private readonly storageService = inject(StorageService);

  readonly convertedDate = this.motilisStore.convertedDate;

  readonly canShowDate = this.motilisStore.canShowDate;

  readonly gameStatus = this.motilisStore.gameStatus;
  readonly status = this.motilisStore.status;

  readonly LOADED = RequestStatus.LOADED;

  constructor() {
    /** Initialize the application word after render because localStore is not available in ssr before*/
    afterNextRender(() => this.motilisStore.loadWordServer());
  }

  openStatDialog(): void {
    openStatDialogFn(this.dialog, this.storageService);
  }

  openHelpDialog(): void {
    this.dialog.open(HelpComponent, {
      width: '500px',
      panelClass: 'popup',
      viewContainerRef: this.vcr,
      hasBackdrop: true,
    });
  }

  increaseDate(): void {
    this.motilisStore.increaseDate();
  }

  decreaseDate(): void {
    this.motilisStore.decreaseDate();
  }

  loadWordWithDate(): void {
    if (this.motilisStore.gameplay() !== Gameplay.date) {
      this.motilisStore.decreaseDate();
    } else {
      this.motilisStore.loadWordServer();
    }
  }

  loadWordLocaly(): void {
    this.motilisStore.loadWordLocaly();
  }

  loadWordToDay(): void {
    this.motilisStore.loadWordServer();
  }
}
