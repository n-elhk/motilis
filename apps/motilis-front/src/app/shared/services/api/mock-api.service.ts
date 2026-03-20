import { Injectable } from '@angular/core';
import { CHRISTIAN_WORDS } from '../../dictionary/dictionary';

@Injectable({
  providedIn: 'root',
})
export class MockApiService {
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * @description Server is down, play localy
   * @returns Motilis object
   */
  public getMotilis(): string {
    const words = CHRISTIAN_WORDS.filter(w => w.length < 9);
    const random = this.getRandomNumber(0, words.length - 1);
    return  words[random];
  }
}
