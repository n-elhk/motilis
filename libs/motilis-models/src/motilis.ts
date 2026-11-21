import { Schema } from 'effect';

/** `true` si `YYYY-MM-DD` désigne un jour qui existe (refuse `2024-02-30`, `2025-13-45`…). */
const isExistingDate = (value: string): boolean => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    year >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/** Date du jour au format `YYYY-MM-DD`. */
export const IsoDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.makeFilter(isExistingDate, { message: 'Date inexistante' }),
);

export const WordStatus = Schema.Literals(['available', 'inprogress', 'displayed']);
export type WordStatus = typeof WordStatus.Type;

export const Word = Schema.Struct({
  id: Schema.Int,
  solution: Schema.String,
  link: Schema.String,
  status: WordStatus,
});
export type Word = typeof Word.Type;

/** Mot d'une journée, renvoyé au front. `solution` et `link` sont encodés en base64. */
export const WordOfTheDay = Schema.Struct({
  solution: Schema.String,
  link: Schema.String,
  /** Millisecondes restantes avant minuit (heure du serveur). */
  remainingTime: Schema.Number,
});
export type WordOfTheDay = typeof WordOfTheDay.Type;

export class WordNotFound extends Schema.TaggedError<WordNotFound>()(
  'WordNotFound',
  { date: Schema.String },
  { httpApiStatus: 404 },
) {}
