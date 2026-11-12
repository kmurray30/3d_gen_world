# Paper World

Speak something into existence. A first-person paper-cutout world where you type a command
("water the sprout", "a dog walks up to me", "the house catches fire") and an LLM turns it into a
script of actions that play out with 2D cutout sprites on a flat 3D ground.

## Playing

Open the hosted URL and enter the passcode once per device. The start screen offers the story
village, the visuals demo, an empty meadow, or the world you were last in. Every world lives at
`/w/<slug>`, and that link is the save file: open it on any device to continue, or share it. Type what should
happen in the box ("water the flower", "a dragon flies in and breathes fire at the house", "make
it huge" while looking at something). Desktop: click to look, WASD to walk, Shift to run, `/` to
type. Phone: left thumb walks, right thumb looks, tap a thing to name it. Clicking or tapping a
thing also pokes it: objects jiggle, animals and people turn to you and answer, and built things
work the piece you clicked: one of a house's doors or windows (its walls do nothing), a mailbox's door
or flag, a bin's lid, a well's bucket, a lamp's light, a fountain's water (a click anywhere on a small
prop works its main piece). The menu has Worlds (tap
the title too), Undo, Reset and Copy link. Worlds lists every world you have opened on this device,
starts a new one, and opens any world from its link or name. The demos are reused per device:
choosing the village or the visuals demo again reopens yours (Reset restores it). `?dev=1` opens a
console that runs hand-written scripts.

**Views.** The buttons at the top right (or `V`, `R`, `B`, `T` on a keyboard) switch between first
person, third person and a free camera that flies with WASD, Space and C; cycle the third-person
angle (behind, high, bird, top: the last one is an overhead 2.5D view); turn wall fading on or off;
and change the time of day (dawn, day, sunset, night). With fading on, any wall or roof between the
camera and your character goes see-through, so you can follow yourself into a house. At night the
lamps, windows and the lighthouse light up. `Tab` (or `Alt`) frees the mouse without `Esc`; click
the scene to look around again (the hint line says so; nothing covers the scene). While looking
around, a dot in the middle of the screen shows what a click will poke, ringed when it rests on
something.

**Paper in the world.** Cutouts no longer turn to face the camera: each has a yaw in the world, so
you can walk around one and see its edge. They always stand upright: looking up or down never tips
them (or your own character); only scripted moves like pouring or falling over lean them. Your own
character is the exception to the yaw: like Paper Mario, it always lies flat to the camera and
flips, with a quick paper turn, to face the way you walk across the screen. Things spawn facing
you, walkers turn their paper along their path, and anything living turns, wanders a few steps around home, or fidgets on its own when
no command is using it, favouring orientations you can see. Buildings can be changed in place
("add a story to the house", "paint the cottage blue"): the model sets new generator parameters
and the structure regenerates with the rest kept.

**Look.** The Look button (or `L`) switches how things that have a code-drawn figure are shown:
the original sprites, layered paper cutouts (2D), folded origami (2.5D), 3D, or sculpted cel-shaded
models. Your own character follows it in third person
and walks and runs with real leg and arm motion in paper and 3D.

**Visuals demo.** Every code-drawn figure stands five times in labelled rows: its old sprite, the
paper cutout, the origami, the 3D model and the sculpted cel model. Click or tap one to make it react. The dragons hover
over their row, and three more circle high overhead, one in each code-drawn style.

**Village.** Worlds -> "+ New village" (or `?preset=village`) generates a new village from a random
seed: rolling hills, a river with a bridge where the road crosses it, a lake with a lighthouse on its
shore, sometimes a duck pond, a plaza with a fountain, roads out of it lined with houses that face
them, a fenced garden, a gingerbread house, a bunker on the highest hill, a witch's hut deep in the
woods at the end of a winding path, trees, lamps and villagers. Reset rebuilds the same village.

## Code-drawn figures

The sprites are AI-drawn images. Figures are drawn by code instead: a small tree of parts, each a
joint carrying one simple solid (ball, capsule, rounded box, cylinder or cone, ring, triangular
prism). The same spec renders four ways.

- **Paper** (`src/client/render/figure/paper.ts`): every part is flattened to its outline on the
  paper plane, coloured with the crayon grain and inked. The pieces are re-laid every frame from
  the 3D pose, so a swinging arm shortens and passes in front of or behind the body. From behind
  the layers reverse, the face disappears and the back of the hair shows. People are drawn from the
  front and animals in profile, like the cutouts. Round things (trees, rocks, barrels) stand as two
  crossed cutouts so they never go edge-on.
- **Origami** (`toon.ts`, origami mode): the solids folded from paper. A ball is an icosahedron
  and a rod a five-sided spindle. Every facet is flat-shaded with a slightly different tone, folds
  show as faint crease lines, and the face is a drawn paper sticker on the head.
- **3D** (`src/client/render/figure/toon.ts`): the solids themselves, with a three-band toon ramp,
  a soft rim light, outlines in a darker shade of each part's colour, and the face painted onto the
  head. Joints are real pivots, so the same animation clips pose it.

- **Cel** (`src/client/render/figure/cel.ts`, built by `src/shared/figure/sculpt.ts`): a proper
  model instead of stitched solids. Every part becomes a signed distance function; the field is
  their union, with smooth fillets only where a part meets its parent and only near the joint between
  them (a neck flows into the head, but a hanging arm does not web onto the body). Surface nets turn
  the field into one closed mesh, and skin weights come from distance, so it bends at elbows, knees
  and necks as one skin. Figures are sculpted in an A-pose (arms out, like a modeller would) and the
  bones bring the arms down. Shading is cel: sun or shadow with a crisp edge, cool-tinted shadows,
  a thin rim light, and an ink outline that follows the skin. Thin, glowing or tiny details (eyes,
  claws, wing membranes, blades, the flame) ride on their bones as separate smooth pieces. Sculpting
  takes 5 to 170 ms per figure, so it runs in a web worker (lighter on phones) and the 3D style
  stands in until each model arrives.

A part can be posed differently on paper. The dragon's wings stick out sideways in 3D, which on a
profile cutout would collapse to slivers, so on paper they stand in the paper's plane and their
flap swings within it. Parts can also be sized by a clip: the dragon's flame is hidden in its mouth
until it breathes fire. Anything in the air with a hover clip hovers and flies instead of standing
and walking, and a figure whose entity has `state.orbit` (a radius) flies circles around its spot,
banking into the turn.

`src/shared/figure/` holds the spec and needs no browser: `kit.ts` has parametric builders (a
person from height, skin, hair style and clothes; a four-legged animal from proportions, ears and
tail; a bird; a dragon with jointed wings), `items.ts` has the 27 sample figures (5 people, 7 animals, 5 nature, 6 village, 4
things) plus a dragon, and `anim.ts` has the clips. People have idle, walk and run loops, 16 reactions (wave,
cheer, ta-da, point, shrug, jump, dance, think, scared, clap, bow, facepalm, stomp, laugh, love,
yawn) and 12 facial expressions, plus blinking and talking. Animals hop, wag, look, shake, graze
and rear. The dragon hovers, flies, roars, breathes fire, flaps and barrel-rolls in the air, and walks with
its wings folded on the ground. Props jiggle, and some do more: the house door opens, the well crank lowers its bucket,
the wheelbarrow rolls. A click plays a random reaction with a face that suits it. Walking and
running are picked from how fast the thing moves.

Figures are stored as code and rendered on demand (drawings are cached per figure), so a style is
just a renderer. Screenshot scripts for checking them: `scripts/shots-figures.mjs` (every trio,
close up and from the side), `scripts/shots-anims.mjs` (reaction clips) and
`scripts/shots-look.mjs` (the village under each Look, and the avatar walking) and
`scripts/shots-dragon.mjs` (the dragon in every style, mid-flap and breathing fire).

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

Decor is drawn (the 3,700 cutouts) and stands as flat paper; only trees and bushes become origami
crosses. Structures are built: a handful of flat-faced shapes (box, wall with doorways, n-gon prism or
cone, hollow ring, a prism laid on its side, gable/hip/shed roof, stairs, a paper strip, a sticker for
doors, windows and signs) with a tinted crayon tile and an ink outline. No image generation is involved.

Street props are built the same way, so they are solid from every side: a fountain (an octagonal
basin you can wade into, a column, paper water arcs, one or two tiers), lamp posts whose lanterns glow
with a halo at night, mailboxes with their door toward the road, signposts, wells, benches, birdbaths,
bins and columns (`src/shared/structure/gen/props.ts`). Their words build them ("a red mailbox" builds
a red one); detailed things (statues, scarecrows, people, animals) stay drawings, and the model can
lay out parts for another simple fixture. On a slope a prop stands level on a round stone plinth.
`scripts/shots-props.ts` shows each prop up close, `scripts/shots-village-props.mjs` the ones in a
village.

**Moving pieces.** Built things have joints: parts that move together on a hinge, a slide, a
stretch (a well rope paying out), a spin, or that shrink away (a fountain's jets) or switch off (a
lamp). Each moving piece has two named states (`closed`/`open`, `down`/`up`, `on`/`off`) kept in
the entity's state as `open_<piece>`; the model moves them with
`{"op":"operate","id":"mailbox_1","part":"door","to":"open"}` and sees them in the world context
("door (closed), flag (up), windows (2 of 12 open), roof, chimney"). Mailboxes open their door and
raise their flag, bins flip their lid, wells lower the bucket as the crank turns, lamp posts and the
lighthouse switch off, fountains stop. House windows are cut into a frame and two sashes that swing
out over a real hole in the wall, so you see into the room; some houses have plank shutters that
swing shut over them (a window opening opens its shutters). Every door opens on its own (a
lighthouse's tower door and its cottage door are `door` and `door_1`; "doors" reaches both). Holes are
cut from where doors and windows sit (`src/shared/structure/openings.ts`): through walls and wall
boards, and through towers and the lighthouse, which are hollow so you can walk in through their
doors. Older saved worlds get the holes when they are drawn. Named parts (`roof`, `chimney`, `door`, `lantern`, `lid`,
`bucket`, `hat`, `sign`) come off with `detach` as structures of their own, slide off and land, and
go back with `reattach`; anim `apart` floats every part out from the middle and back.
`cd scripts && npx tsx shots-parts.ts http://localhost:8787 OUT` shows all of it.

- `src/shared/structure/` is the kit: `types.ts` (parts), `geometry.ts` (parts -> mesh data with
  metre-based UVs, face shading and outline edges), `collide.ts` (walls push, patios and stairs
  support), and `gen/` with one generator per family: `house` (also `randomHouse` and the
  gingerbread house), `fence`/`yard`, `tower`/`lighthouse`, `witchHut`, `bunker`, `props`, and
  `custom`, which lays out parts the model describes by relation ("a cone on the base") so nothing
  floats. `joints.ts` names the moving pieces, matches words to them ("lower the bucket", "the
  shutters") and lists what comes off.
- The LLM never places coordinates. Spawning a building word (`house`, `cottage`, `barn`, `tower`,
  `fence`, `yard`, `fire station`...) builds a structure; the `build` action adds a look
  (`params: {color: "blue", roof: "hip", stories: 2}`) or a parts list for one-offs. A word nobody
  drew ("quantum bakery") goes to the classifier: Jev when `TYPESAFE_API_KEY` is set, otherwise a
  keyword heuristic; a yes builds a random house with a sign, a no shows the usual card.
- Materials are drawn on a canvas at runtime (`src/client/render/materials.ts`) and tinted per
  part, so AI-drawn tiles can replace them later by name without touching the structures.
- `node scripts/shots-village.mjs http://localhost:8787 out/` screenshots a generated village: an
  overview, each special structure, third-person and top-down views, sunset and night;
  `scripts/shots-door.mjs` shows doors closed and poked open, and `scripts/shots-facing.mjs`
  shows cutouts from the side and after a stretch of idle life.

## Puppets: drawings cut into pieces

Rigged drawings are cut into their paper pieces in the browser and move like a paper puppet: a head,
arms, hands, legs, tails, ears, wings, wheels, clock hands and windmill blades, each turning on its
own joint. A rig is one small JSON file (`assets/rigs/<word>.json`) with every piece's exact pixel mask;
20 starter rigs ship, 156 KB in all. The browser only stamps the drawing through the masks and never reads
pixels back, because browsers that guard against fingerprinting (Safari now does by default) add noise to
canvas reads. Drawings without a rig still move as one card.

- **Idle life.** Rigged things breathe, sway, blink and glance around; walkers swing their legs (or
  lift them, seen from the front); tails wag, ears twitch, clock hands tick and blades turn.
- **Faces.** The drawn face stays as drawn. Expressions (`happy`, `sad`, `angry`, `surprised`,
  `scared`, `sleepy`, `laughing`, `confused`) swap the drawn mouth for an inked one, close the
  eyes with paper lids, and add eyebrows only when the expression needs them (a character whose
  drawing has brows moves its own). Talking moves the mouth while a speech bubble is up.
- **Gestures.** `wave`, `point`, `clap`, `shrug`, `thumbs_up`, `cover_eyes`, `hands_on_hips`,
  `arms_up`, `dance`, `bow`, `nod`, `shake_head`, `wink`, `laugh`, `cry`, `gasp`, `look_around`,
  `wag`, `flap` and `apart` (the pieces float out into an exploded view and back) are anims the
  model can use like `jump` or `spin`.
- **Parts.** `{"op":"detach","id":"farmer_1","part":"hat"}` takes a piece off as a thing of its
  own: it hops clear, falls, can be picked up, thrown or named like anything else, and
  `{"op":"reattach","id":"hat_1"}` puts it back. The world context lists each rigged thing's parts,
  so "knock his hat off" or "the dog's tail falls off" work.
- **Clicks.** A poke reacts to the piece under the dot: a hat is knocked off, a hand waves, a head
  nods, a tail wags, a loose piece goes back on.

Rigs are made offline (`words_and_images/rig/`, Python with numpy, scipy and Pillow):
`segment.py <word> --out DIR` splits a drawing into regions along its ink and writes an overlay
with rulers; a label file (`labels/<word>.json`) names the regions per piece in 0-1000 coordinates,
with cut lines, automatic wrist, leg and sleeve splits, outline polygons and face marks; and
`build_rig.py labels/*.json --review DIR` writes the rigs plus a review sheet per drawing.
`auto_rig.py` labels the whole set with a vision model running locally (Ollama or LM Studio): `pilot` tries two
models on 40 drawings side by side, `run` does everything, resumably. See `words_and_images/rig/README.md`.
`node scripts/shots-puppets.mjs http://localhost:8787 OUT boy dog` shows rigs idling, gesturing,
walking, making faces, talking and coming apart.

## Sound and music

`src/client/audio/` plays the world: your footsteps and those of people and animals nearby on whatever is
underfoot (grass, the gravel of roads and paths, plaza stone, sand by the water, wading, wooden floors and
bridges), doors, windows, shutters and the other moving pieces, animal calls by word, things landing by
weight, effects (explosions, sparkles, splashes), things popping in and out, moves and gestures (claps, wing
flaps, boings), and the command box. Music cross-fades with the time of day under ambience: birds by day,
crickets at night, a stream or a lake shore when water is near, wind on the hills, and loops at fountains,
fires and rain.

People talk in babble: each syllable of a speech bubble is a short sung vowel in the character's own voice
(children high, giants gruff, robots square), shaped by their expression (happy lifts, sad sinks, angry
growls, a question rises), with laughs, sobs, gasps, grumbles and hums of their own. It is generated, so it
needs no files. The Sound button (or `M`) switches between everything, no music, and off, remembered per
device; sound starts with the first click or key, as browsers require.

The recordings are all CC0 and come from `words_and_images/audio/` (Kenney's packs and Freesound): run
`fetch_audio.py` there to download them into `assets/audio/`; see its README. Until then only the babble
plays.

## Terrain, water and villages

- `src/shared/terrain/field.ts`: a world's terrain is a saved recipe (`world.terrain`): seeded hills,
  a rim of hills round the valley, roads and building pads that flatten the ground, rivers and ponds
  carved below one water level. It is baked into a height grid that the engine (placing, walking,
  landing), the player and the renderer all share, interpolated over the same triangles the mesh
  draws. Worlds without a recipe are the flat meadow.
- `src/shared/village.ts`: one seed decides a whole village, in an order where each step respects
  the ones before it (river and lake, plaza, roads, lots facing the roads, the special buildings in
  fitting spots, bridges at crossings, door paths, trees, lamps, people).
- Structures built on slopes stand on a stone foundation with steps up to the door; fences follow
  the ground; bridges are a structure (`gen: "bridge"`) you walk across.
- The renderer paints the ground (grass, sand banks, roads, paths, the plaza) and draws one water
  sheet at the water level with an ink line where it meets the shore. The sky is a CSS gradient per
  time of day with a paper sun and moon and stars; night tints every material through one shader
  uniform and lets windows and lamps glow. The model can change the time with `{"op":"sky"}`.

## Sprites and vocabulary

`words_and_images/` holds the Python asset pipeline (word list, image generation, background
removal). Game sprites are WebP files committed under `assets/sprites/{512,256}/` and described by
`assets/manifest.json`, built with `npm run manifest`. See `words_and_images/README.md`.

## Deploy

One Node service on Railway built from the `Dockerfile`, a volume mounted at `/data`, and the
environment variables above. `railway.json` sets the health check (`/api/health`).
