import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import type { AttempType, GameStatusType } from '../models';

/** Résultats d'une tentative, écoutés par les handlers du store (toasts, annonces, modale de statistiques). */
export const motilisEvents = eventGroup({
  source: 'Motilis',
  events: {
    wordValidated: type<{ word: string; evaluation: AttempType[] }>(),
    wordRejected: type<void>(),
    dictionaryUnavailable: type<void>(),
    gameEnded: type<{ status: Exclude<GameStatusType, 'inProgress'> }>(),
  },
});
