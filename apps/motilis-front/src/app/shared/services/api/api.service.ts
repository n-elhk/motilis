import { Service, inject } from '@angular/core';
import { map, Observable, retry } from 'rxjs';
import { StorageKey } from '../../models/storage';
import { StorageService } from '../storage/storage.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Motilis } from '../../models/motilis';
import { BOARD } from '../../mocks';

export const padStart = (num: number, char: string, places = 2) => {
  return String(num).padStart(places, char);
};

@Service()
export class ApiService {
  private readonly storageService = inject(StorageService);
  private readonly httpClient = inject(HttpClient);

  /**
   * @description Server is down, play localy
   * @returns Motilis object
   */
  public getMotilis(date?: Temporal.PlainDate) {
    const params = this.getDateParams(date);
    return this.httpClient.get<Motilis>('/api/word', { params });
  }

  /**
   * @description Server is down, play localy
   * @returns Motilis object
   */
  public getMotilisToday() {
    return this.getMotilis().pipe(
      map(({ solution, remainingTime }) => {
        const answer = this.storageService.getStorage(StorageKey.Answer);
        this.storageService.setStorage(StorageKey.Answer, solution);
        this.storageService.setStorage(StorageKey.RemainingTime, remainingTime);
        if (answer !== solution) {
          this.storageService.setStorage(StorageKey.BoardState, BOARD);
        }
        return { solution, remainingTime };
      }),
    );
  }

  /**
   * @description Server is down, play localy
   * @returns Motilis object
   */
  public getMotilisWithDate(date: Temporal.PlainDate): Observable<string> {
    return this.getMotilis(date).pipe(map(({ solution }) => solution));
  }

  getDateParams(date: Temporal.PlainDate = Temporal.Now.plainDateISO()) {
    return new HttpParams().set('date', date.toString());
  }

  openEventSource<T>(url: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const eventSource = new EventSource(url);
      eventSource.onmessage = (ev) => subscriber.next(ev.data);

      eventSource.onmessage = (event) => {
        const messageData: T = JSON.parse(event.data);
        subscriber.next(messageData);
      };
      eventSource.onerror = (ev) => subscriber.error(ev);

      return () => eventSource.close();
    });
  }

  wordChanged$<T>() {
    return (
      this.openEventSource<T>('api/word-changed')
        // retry the connection 5 times, with 500 milliseconds delay
        .pipe(retry({ count: 5, delay: 500 }))
    );
  }
}
