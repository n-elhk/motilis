import { NodeHttpServer, NodeRuntime } from '@effect/platform-node';
import { Config, Effect, Layer, Schedule } from 'effect';
import { HttpRouter } from 'effect/http';
import { createServer } from 'node:http';
import { HttpLive } from './http.ts';
import { nearestMidnightDate, todayIso } from './motilis/dates.ts';
import { Motilis } from './motilis/Motilis.ts';

/**
 * Change le mot du jour chaque nuit à minuit (heure du serveur, variable `TZ`).
 * Au démarrage, tire le mot du jour s'il manque (serveur arrêté à minuit).
 */
const DailyRotation = Layer.effectDiscard(
  Effect.gen(function* () {
    const motilis = yield* Motilis;
    yield* motilis.ensureWordFor(todayIso());
    yield* Effect.suspend(() => motilis.ensureWordFor(nearestMidnightDate())).pipe(
      Effect.catchCause((cause) => Effect.logError('Échec du changement de mot', cause)),
      Effect.schedule(Schedule.cron('0 0 * * *')),
      Effect.orDie,
      Effect.forkScoped,
    );
  }),
);

const ServerLive = HttpRouter.serve(HttpLive).pipe(
  Layer.provide(
    NodeHttpServer.layerConfig(createServer, {
      port: Config.Port('PORT').pipe(Config.withDefault(3000)),
      host: Config.String('HOST').pipe(Config.withDefault('0.0.0.0')),
    }),
  ),
);

// Motilis est fourni ici, hors de `serve`, pour que le serveur HTTP et le cron
// partagent la même instance (et donc le même PubSub pour le SSE).
const MainLive = Layer.mergeAll(ServerLive, DailyRotation).pipe(
  Layer.provide(Motilis.layer),
);

Layer.launch(MainLive).pipe(NodeRuntime.runMain);
