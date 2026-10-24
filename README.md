# Paper World

Speak something into existence. A first-person paper-cutout world where you type a command
("water the sprout", "a dog walks up to me", "the house catches fire") and an LLM turns it into a
script of actions that play out with 2D cutout sprites on a flat 3D ground.

## Playing

Open the hosted URL, enter the passcode once per device, and you get a fresh world at `/w/<slug>`.
That link is the save file: open it on any device to continue, or share it. Type what should
happen in the box ("water the flower", "a dragon flies in and breathes fire at the house", "make
it huge" while looking at something). Desktop: click to look, WASD to walk, Shift to run, `/` to
type. Phone: left thumb walks, right thumb looks, tap a thing to name it. Clicking or tapping a
thing also pokes it: objects jiggle, animals and people turn to you and answer, and a building's
door swings open or shut. The menu has Worlds (tap
the title too), Undo, Reset and Copy link. Worlds lists every world you have opened on this device,
starts a new one, and opens any world from its link or name; the bare site address reopens the
world you used last. `?dev=1` opens a console that runs hand-written scripts.

**Views.** The buttons at the top right (or `V`, `R`, `B` on a keyboard) switch between first
person, third person and a free camera that flies with WASD, Space and C; cycle the third-person
angle (behind, high, bird, top: the last one is an overhead 2.5D view); and turn wall fading on or
off. With fading on, any wall or roof between the camera and your character goes see-through, so
you can follow yourself into a house.

**Paper in the world.** Cutouts no longer turn to face the camera: each has a yaw in the world, so
you can walk around one and see its edge. Things spawn facing you, walkers turn their paper along
their path, and anything living turns, wanders a few steps around home, or fidgets on its own when
no command is using it, favouring orientations you can see. Buildings can be changed in place
("add a story to the house", "paint the cottage blue"): the model sets new generator parameters
and the structure regenerates with the rest kept.

**Village.** Worlds -> "+ New village" (or `?preset=village`) starts a meadow with one of each
structure: three houses, a fenced yard, a gingerbread house, a witch's hut with a hat for a roof, a
lighthouse and a three-level bunker with outside stairs you can climb. Reset brings the village back.

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
| `TYPESAFE_API_KEY` | Jev (TypeSafe's classifier) decides whether a word nobody drew is a building; empty = keyword heuristic |
| `AVATAR_WORD` | Vocabulary word drawn as you in third person (default `boy`) |

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

## Structures

Decor is drawn (the 3,700 cutouts). Structures are built: a handful of flat-faced shapes (box, wall
with doorways, n-gon prism or cone, gable/hip/shed roof, stairs, a sticker for doors, windows and
signs) with a tinted crayon tile and an ink outline. No image generation is involved.

- `src/shared/structure/` is the kit: `types.ts` (parts), `geometry.ts` (parts -> mesh data with
  metre-based UVs, face shading and outline edges), `collide.ts` (walls push, patios and stairs
  support), and `gen/` with one generator per family: `house` (also `randomHouse` and the
  gingerbread house), `fence`/`yard`, `tower`/`lighthouse`, `witchHut`, `bunker`, and `custom`,
  which lays out parts the model describes by relation ("a cone on the base") so nothing floats.
- The LLM never places coordinates. Spawning a building word (`house`, `cottage`, `barn`, `tower`,
  `fence`, `yard`, `fire station`...) builds a structure; the `build` action adds a look
  (`params: {color: "blue", roof: "hip", stories: 2}`) or a parts list for one-offs. A word nobody
  drew ("quantum bakery") goes to the classifier: Jev when `TYPESAFE_API_KEY` is set, otherwise a
  keyword heuristic; a yes builds a random house with a sign, a no shows the usual card.
- Materials are drawn on a canvas at runtime (`src/client/render/materials.ts`) and tinted per
  part, so AI-drawn tiles can replace them later by name without touching the structures.
- `node scripts/shots-village.mjs http://localhost:8787 out/` screenshots every structure in the
  village from the front, plus third-person, top-down, wall-fade and indoor views;
  `scripts/shots-door.mjs` shows doors closed and poked open, and `scripts/shots-facing.mjs`
  shows cutouts from the side and after a stretch of idle life.

## Sprites and vocabulary

`words_and_images/` holds the Python asset pipeline (word list, image generation, background
removal). Game sprites are WebP files committed under `assets/sprites/{512,256}/` and described by
`assets/manifest.json`, built with `npm run manifest`. See `words_and_images/README.md`.

## Deploy

One Node service on Railway built from the `Dockerfile`, a volume mounted at `/data`, and the
environment variables above. `railway.json` sets the health check (`/api/health`).
