# Paper World

Speak something into existence. A first-person paper-cutout world where you type a command
("water the sprout", "a dog walks up to me", "the house catches fire") and an LLM turns it into a
script of actions that play out with 2D cutout sprites on a flat 3D ground.

## Playing

Open the hosted URL, enter the passcode once per device, and you get a fresh world at `/w/<slug>`.
That link is the save file: open it on any device to continue, or share it. Type what should
happen in the box ("water the flower", "a dragon flies in and breathes fire at the house", "make
it huge" while looking at something). Desktop: click to look, WASD to walk, Shift to run, `/` to
type. Phone: left thumb walks, right thumb looks, tap a thing to name it. The menu has Undo,
Reset and Copy link. `?dev=1` opens a console that runs hand-written scripts.

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
npm run e2e                  # Playwright smoke tests (needs npm run build first)
MOCK_LLM=1 npm run dev       # canned scripts instead of the model
XAI_API_KEY=... npx tsx scripts/eval-prompt.ts   # run 20 commands against Grok and report quality
```

## How a command becomes a scene

1. The client sends the command plus a compact description of the nearby world (ids, words,
   distances, what you are looking at) to `POST /api/worlds/:slug/command`.
2. The server streams Grok's JSON. Each step is cut out of the stream as soon as it closes,
   validated (`src/shared/schema.ts`), given real ids and vocabulary words (`src/server/llm/`),
   and sent to the client as one NDJSON line, so the first action starts while the model is
   still writing the rest.
3. The engine (`src/shared/engine/`, no DOM, unit tested) runs scripts concurrently: steps run in
   order, `par` groups together, tweens on the same entity channel preempt each other, places are
   resolved by a solver that keeps things from overlapping, movers stop at their target's edge,
   dropped things land on whatever is below, and bumping into things triggers reactions.
4. The renderer draws entities as upright paper cutouts, named effects as particles, and speech
   as bubbles. The world is saved to SQLite after each scene settles.

## Sprites and vocabulary

`words_and_images/` holds the Python asset pipeline (word list, image generation, background
removal). Game sprites are WebP files committed under `assets/sprites/{512,256}/` and described by
`assets/manifest.json`, built with `npm run manifest`. See `words_and_images/README.md`.

## Deploy

One Node service on Railway built from the `Dockerfile`, a volume mounted at `/data`, and the
environment variables above. `railway.json` sets the health check (`/api/health`).
