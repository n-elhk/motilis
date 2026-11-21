import {
  type RotatedWord,
  Word,
  WordNotFound,
  type WordOfTheDay,
} from '@motilis/models';
import { Context, Effect, Layer, Option, PubSub, Schema, Stream } from 'effect';
import { SqlClient, SqlSchema } from 'effect/sql';
import { SqlLive } from '../sql/Sql.ts';
import { timeToMidnight, todayIso } from './dates.ts';

const toBase64 = (value: string) => Buffer.from(value).toString('base64');

const WordContent = Schema.Struct({ solution: Schema.String, link: Schema.String });

export class Motilis extends Context.Service<
  Motilis,
  {
    /** Mot affiché à une date donnée (`YYYY-MM-DD`), avec solution et lien en base64. */
    findByDate(date: string): Effect.Effect<WordOfTheDay, WordNotFound>;
    /** Tire un nouveau mot pour `date` s'il n'en a pas encore (sans effet sinon). */
    ensureWordFor(date: string): Effect.Effect<void>;
    /** Remplace le mot d'aujourd'hui par un nouveau mot tiré au hasard et le notifie. */
    readonly rotate: Effect.Effect<RotatedWord>;
    /** Id du nouveau mot à chaque rotation. */
    readonly changes: Stream.Stream<number>;
  }
>()('motilis/Motilis') {
  static readonly layer = Layer.effect(
    Motilis,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const wordChanged = yield* PubSub.unbounded<number>();

      const findContentByDate = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: WordContent,
        execute: (date) => sql`
          SELECT w.solution, w.link
          FROM word_displays d
          JOIN words w ON w.id = d.word_id
          WHERE d.displayed_on = ${date}::date
        `,
      });

      const findWordIdByDate = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: Schema.Struct({ word_id: Schema.Int }),
        execute: (date) => sql`SELECT word_id FROM word_displays WHERE displayed_on = ${date}::date`,
      });

      const pickRandomAvailable = SqlSchema.findOneOption({
        Request: Schema.Void,
        Result: Word,
        execute: () => sql`
          SELECT id, solution, link, status FROM words
          WHERE status = 'available'
          ORDER BY random()
          LIMIT 1
        `,
      });

      const findByDate = Effect.fn('Motilis.findByDate')(function* (date: string) {
        const content = yield* findContentByDate(date).pipe(Effect.orDie);
        if (Option.isNone(content)) {
          return yield* new WordNotFound({ date });
        }
        return {
          solution: toBase64(content.value.solution),
          link: toBase64(content.value.link),
          remainingTime: timeToMidnight(),
        };
      });

      /**
       * Remplace le mot en cours par un mot tiré au hasard et l'enregistre pour `date`.
       * Si `date` a déjà un mot et que `replace` est faux, ne change rien (idempotent).
       */
      const rotateInTransaction = (date: string, replace: boolean) =>
        Effect.gen(function* () {
          // Sérialise les rotations concurrentes (cron, démarrage, appel manuel).
          yield* sql`SELECT pg_advisory_xact_lock(hashtext('motilis.rotate'))`;

          if (!replace) {
            const existing = yield* findWordIdByDate(date);
            if (Option.isSome(existing)) {
              return Option.none<RotatedWord>();
            }
          }

          const previous = yield* sql<{ id: number }>`
            UPDATE words SET status = 'displayed' WHERE status = 'inprogress' RETURNING id
          `;
          const previousId = previous[0]?.id;

          let next = yield* pickRandomAvailable(undefined);
          if (Option.isNone(next) && previousId !== undefined) {
            // Tous les mots ont été affichés : nouveau cycle, sans le mot qu'on vient de quitter.
            yield* sql`UPDATE words SET status = 'available' WHERE id <> ${previousId}`;
            next = yield* pickRandomAvailable(undefined);
          }
          if (Option.isNone(next)) {
            // Aucun mot précédent, ou table avec un seul mot.
            yield* sql`UPDATE words SET status = 'available'`;
            next = yield* pickRandomAvailable(undefined);
          }
          if (Option.isNone(next)) {
            return yield* Effect.die(new Error('La table words est vide'));
          }
          const word = next.value;

          yield* sql`UPDATE words SET status = 'inprogress' WHERE id = ${word.id}`;
          yield* sql`
            INSERT INTO word_displays (displayed_on, word_id)
            VALUES (${date}::date, ${word.id})
            ON CONFLICT (displayed_on) DO UPDATE SET word_id = EXCLUDED.word_id
          `;
          return Option.some<RotatedWord>({ id: word.id, date });
        });

      const runRotation = (date: string, replace: boolean) =>
        sql.withTransaction(rotateInTransaction(date, replace)).pipe(
          Effect.orDie,
          Effect.tap(
            Option.match({
              onNone: () => Effect.void,
              onSome: (word) =>
                PubSub.publish(wordChanged, word.id).pipe(
                  Effect.andThen(Effect.logInfo('Nouveau mot du jour', word)),
                ),
            }),
          ),
        );

      const ensureWordFor = Effect.fn('Motilis.ensureWordFor')(function* (date: string) {
        yield* runRotation(date, false);
      });

      const rotate = Effect.suspend(() => runRotation(todayIso(), true)).pipe(
        Effect.map(Option.getOrThrow),
        Effect.withSpan('Motilis.rotate'),
      );

      return Motilis.of({
        findByDate,
        ensureWordFor,
        rotate,
        changes: Stream.fromPubSub(wordChanged),
      });
    }),
  ).pipe(Layer.provide(SqlLive));
}
