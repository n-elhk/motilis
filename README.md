# Motilis

Monorepo pnpm (sans Nx).

| Paquet | Dossier | Stack |
| --- | --- | --- |
| `@motilis/front` | `apps/motilis-front` | Angular 21 (SSR) |
| `@motilis/back` | `apps/motilis-back` | Effect 4 (`effect/http-api`, `@effect/sql-pg`) |
| `@motilis/models` | `libs/motilis-models` | Contrat d'API partagé (Effect Schema), consommé en source TS |

## Démarrage

```sh
pnpm install
cp apps/motilis-back/.env.example apps/motilis-back/.env
pnpm db:up        # Postgres sur localhost:5432
pnpm dev          # back sur :3000, front sur :4200 (proxy /api -> :3000)
```

Les migrations (création des tables et seed des mots) sont jouées automatiquement au démarrage du back.

## Commandes

```sh
pnpm -r build | typecheck | lint | test   # tous les paquets
pnpm --filter @motilis/back dev           # un seul paquet
```

## API

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/word?date=YYYY-MM-DD` | Mot du jour (solution et lien en base64), 400 si la date n'existe pas, 404 si aucun mot à cette date |
| GET | `/api/update-word` | Remplace le mot du jour (route publique, à retirer) |
| GET | `/api/word-changed` | Flux SSE (`data: <id>`) à chaque changement de mot |
| GET | `/api/openapi.json` | Spécification OpenAPI |

Le mot change automatiquement chaque nuit à minuit (fuseau défini par `TZ`). Au démarrage, le serveur tire le mot du jour s'il manque.

## Docker

```sh
docker compose --profile app up --build   # Postgres + back
```
