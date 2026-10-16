# Paper World

Speak something into existence. A first-person paper-cutout world where you type a command
("water the sprout", "a dog walks up to me", "the house catches fire") and an LLM turns it into a
script of actions that play out with 2D cutout sprites on a flat 3D ground.

## Run locally

```
npm install
npm run dev          # Vite client on :5173 (proxies /api to the server), server on :8787
```

Environment (all optional in development, see `src/server/env.ts`):

| Variable | Purpose |
|---|---|
| `XAI_API_KEY` | Grok access for real commands (`MOCK_LLM=1` plays canned scripts instead) |
| `APP_PASSCODE` | Shared passcode for the hosted app (empty = no gate) |
| `COOKIE_SECRET` | Signs the auth cookie |
| `DB_PATH` | SQLite file (default `data/world.db`; `/data/world.db` on Railway) |
| `DAILY_COMMAND_CAP` | Global daily LLM command cap (default 500) |

```
npm run build && npm start   # production build (dist/) and server
npm test                     # vitest unit + server tests
npm run e2e                  # Playwright smoke test
```

## Sprites and vocabulary

`words_and_images/` holds the Python asset pipeline (word list, image generation, background
removal). Game sprites are WebP files committed under `assets/sprites/{512,256}/` and described by
`assets/manifest.json`, built with `npm run manifest`. See `words_and_images/README.md`.

## Deploy

One Node service on Railway built from the `Dockerfile`, a volume mounted at `/data`, and the
environment variables above. `railway.json` sets the health check (`/api/health`).
