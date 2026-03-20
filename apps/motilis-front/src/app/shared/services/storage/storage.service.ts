import { Injectable } from '@angular/core';
import { MotilisStat } from '../../models/statistic';
import { StorageKey, StorageValues } from '../../models/storage';
import { getMotilisMock } from '../../mocks';
import { GameStatusType } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  public removeAndReload(key: StorageValues): void {
    localStorage.removeItem(key);
    window.location.reload();
  }

  public resetStorage(key: StorageValues): void {
    this.setStorage(key, getMotilisMock()[key]);
  }

  public removeItem(name: StorageValues): void {
    localStorage.removeItem(name);
  }

  public getStorage<T>(key: StorageValues): T {
    try {
      const ls = localStorage.getItem(key);
      if (ls) {
        return JSON.parse(ls) as T;
      }
      throw new Error(`No storage ${key} founded`);
    } catch {
      this.resetStorage(key);
      return this.getStorage(key);
    }
  }

  public setStorage<T>(key: StorageValues, st: T): void {
    localStorage.setItem(key, JSON.stringify(st));
  }

  public updateStat(res: GameStatusType, nbAttempts: number): void {
    const st = this.getStorage<MotilisStat>(StorageKey.Stat);
    const won = res === 'win';
    const game = { date: Date.now(), won, nbAttempts };
    st.games.push(game);
    this.setStorage(StorageKey.Stat, st);
  }

  private isTodayAtLeastOneDayAhead(timestamp: number): boolean {
    const date = new Date(timestamp),
      today = new Date(),
      oneDay = 24 * 60 * 60 * 1000; // Nombre de millisecondes dans une journée

    /**
     * Compare les dates avec l'écart d'une journée
     * 3_000 car il y a un petit écart sinon 0
     */
    if (date.getTime() + oneDay - today.getTime() < 3_000) {
      return true;
    }

    return false;
  }
}
