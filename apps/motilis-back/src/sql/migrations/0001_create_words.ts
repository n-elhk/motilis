import { Effect } from 'effect';
import { SqlClient } from 'effect/sql';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE words (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      solution text NOT NULL UNIQUE,
      link text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'inprogress', 'displayed'))
    )
  `;
  // Un seul mot « en cours » à la fois.
  yield* sql`
    CREATE UNIQUE INDEX words_single_inprogress ON words (status)
    WHERE status = 'inprogress'
  `;
  // Historique : quel mot a été affiché quel jour (un mot par jour).
  yield* sql`
    CREATE TABLE word_displays (
      displayed_on date PRIMARY KEY,
      word_id integer NOT NULL REFERENCES words (id) ON DELETE CASCADE
    )
  `;
  yield* sql`CREATE INDEX word_displays_word_id ON word_displays (word_id)`;
});
