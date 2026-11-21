import { Schema } from 'effect';
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from 'effect/http-api';
import { IsoDate, WordNotFound, WordOfTheDay } from './motilis.ts';

export const API_PREFIX = '/api';

/** Flux SSE émis à chaque changement de mot (payload : id du nouveau mot). */
export const WORD_CHANGED_PATH = `${API_PREFIX}/word-changed`;

/** Réponse de la rotation manuelle : on ne renvoie pas la solution en clair. */
export const RotatedWord = Schema.Struct({ id: Schema.Int, date: IsoDate });
export type RotatedWord = typeof RotatedWord.Type;

export class MotilisApiGroup extends HttpApiGroup.make('motilis').add(
  HttpApiEndpoint.get('word', '/word', {
    query: { date: Schema.optional(IsoDate) },
    success: WordOfTheDay,
    error: WordNotFound,
  }),
  HttpApiEndpoint.get('updateWord', '/update-word', {
    success: RotatedWord,
  }),
) {}

export class MotilisApi extends HttpApi.make('motilis')
  .add(MotilisApiGroup)
  .prefix(API_PREFIX) {}
