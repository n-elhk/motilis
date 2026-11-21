import { MotilisApi, WORD_CHANGED_PATH } from '@motilis/models';
import { Effect, Layer, Stream } from 'effect';
import { HttpRouter, HttpServerResponse } from 'effect/http';
import { HttpApiBuilder } from 'effect/http-api';
import { todayIso } from './motilis/dates.ts';
import { Motilis } from './motilis/Motilis.ts';

const MotilisHandlers = HttpApiBuilder.group(
  MotilisApi,
  'motilis',
  Effect.fn(function* (handlers) {
    const motilis = yield* Motilis;
    return handlers.handleAll({
      word: ({ query }) => motilis.findByDate(query.date ?? todayIso()),
      updateWord: () => motilis.rotate,
    });
  }),
);

/** Server-Sent Events : `data: <id>` à chaque changement de mot. */
const WordChangedRoute = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const motilis = yield* Motilis;
    const events = Stream.merge(
      motilis.changes.pipe(Stream.map((id) => `data: ${JSON.stringify(id)}\n\n`)),
      // Commentaire SSE périodique pour garder la connexion ouverte derrière un proxy.
      Stream.tick('30 seconds').pipe(Stream.map(() => ': ping\n\n')),
    );
    yield* router.add(
      'GET',
      WORD_CHANGED_PATH,
      HttpServerResponse.stream(events.pipe(Stream.encodeText), {
        contentType: 'text/event-stream',
        headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
      }),
    );
  }),
);

export const HttpLive = Layer.mergeAll(
  HttpApiBuilder.layer(MotilisApi, { openapiPath: '/api/openapi.json' }),
  WordChangedRoute,
  HttpRouter.cors(),
).pipe(Layer.provide(MotilisHandlers));
