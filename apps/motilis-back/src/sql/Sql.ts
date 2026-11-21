import { NodeServices } from '@effect/platform-node';
import { PgClient, PgMigrator } from '@effect/sql-pg';
import { Config, Layer } from 'effect';
import createWords from './migrations/0001_create_words.ts';
import seedWords from './migrations/0002_seed_words.ts';

const PgLive = PgClient.layerConfig({
  url: Config.Redacted('DATABASE_URL'),
});

const MigratorLive = PgMigrator.layer({
  loader: PgMigrator.fromRecord({
    '0001_create_words': createWords,
    '0002_seed_words': seedWords,
  }),
}).pipe(Layer.provide(NodeServices.layer));

/** Client Postgres, avec les migrations jouées au démarrage. */
export const SqlLive = MigratorLive.pipe(Layer.provideMerge(PgLive));
