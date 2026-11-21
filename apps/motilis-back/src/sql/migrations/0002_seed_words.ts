import { Array as Arr, Effect } from 'effect';
import { SqlClient } from 'effect/sql';
import { CHRISTIAN_WORDS } from '../words.ts';

/**
 * Remplace l'ancien endpoint `GET /create-word` : insère tous les mots et leur
 * attribue une date passée (le dernier est le mot du jour), pour que les
 * archives du front aient un mot pour chaque jour.
 */
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const last = CHRISTIAN_WORDS.length - 1;
  const today = Temporal.Now.plainDateISO();

  yield* sql`INSERT INTO words ${sql.insert(
    Arr.map(CHRISTIAN_WORDS, (solution, i) => ({
      solution,
      status: i === last ? 'inprogress' : 'available',
    })),
  )}`;

  const displays = CHRISTIAN_WORDS.map((solution, i) => ({
    solution,
    displayed_on: today.subtract({ days: last - i }).toString(),
  }));

  yield* sql`
    INSERT INTO word_displays (displayed_on, word_id)
    SELECT d.displayed_on::date, w.id
    FROM jsonb_to_recordset(${JSON.stringify(displays)}::jsonb)
      AS d (solution text, displayed_on text)
    JOIN words w USING (solution)
  `;
});
