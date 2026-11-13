# Writing catalog figures (v2)

Every vocabulary word has a figure drawn by code: a short spec that the game turns into a sculpted cel-shaded
model (the look players love), a 3D toy, origami and a paper cutout. The figures now go into a walkable town at
their **real size, next to real-size people**, and every one of them **does something when you click it**.

Read `src/shared/figure/catalog/examples.ts` first: a toaster that toasts bread (then burns it), a yam whose slice
comes off, a city bus with a door that opens, a biplane whose propeller starts, a fridge with milk inside, a chef,
a dog that fetches, a lamp that switches, a sailboat, a fish, a wheelbarrow. Copy those patterns.

## Your job in this pass

You own one chunk: `src/shared/figure/catalog/<chunk>.ts` (words and synonyms in `assign/<chunk>.tsv`). It already
has an entry for every word. **Go through every entry and make it good**:

1. **Real size, fits people.** A person is 1.7 m. A bus is 12 m long and 3.2 m tall and a person fits through its
   door; a chair seat is 0.45 m high; a car is 4.5 m long. Many entries were built at toy size: fix them all (see
   the size table). Preview sheets now show a grey 1.7 m person beside everything between 0.35 m and 80 m tall:
   if the person could not sit in it, ride it, open it or use it, it is the wrong size.
2. **Thoughtful shapes.** Recognisable at a glance and *right*: proportions, the details that define it, the
   parts it really has. Vehicles, aircraft, ships, buildings, machines, appliances and furniture deserve the most
   care: use lofts for hulls, fuselages and car bodies, give vehicles windows, doors, lights, wheels on axles and
   seats inside, give buildings doors, windows, roofs and trim. 10 to 40 parts for a vehicle or a building is
   normal; a pea needs 1. Rebuild anything rudimentary.
3. **Edges by discretion.** Choose per part (or per figure) whether it is crisp or soft (see Edges).
4. **Real parts.** Name the parts that move (`mover`), the pieces that come off (`piece`), and the spots where
   other things go (`socket`).
5. **One act each.** What it does when clicked: unique, or at least fitting its kind (see Acts). Every entry
   needs one; the checker fails without it.

Keep each entry's district and group as they are (the town uses a separate list of places).

Rules: edit **only your chunk file**. Do not run git, the build, tests or a server. Put any helper scripts or
scratch files in a private temp dir (`d=$(mktemp -d)`), never in shared names. Work in batches of about 25:
revise, check, preview, fix, continue. Finish with a clean check (exit code 0) and **no warnings you can fix**.

## Check and look

```
npx tsx scripts/check-catalog.ts <chunk>                            # builds, sculpts and runs every act; errors and warnings
npx tsx scripts/check-catalog.ts <chunk> --acts                     # also prints what each act does
npx tsx scripts/preview-catalog.ts <chunk> 0 48 /tmp/<chunk>-0.png  # contact sheet, a 1.7 m person beside each thing
npx tsx scripts/preview-act.ts <chunk> "<word>" /tmp/act.png 4      # an act frame by frame (4 frames per click)
```

Open PNGs with the Read tool. Look at every sheet, and at act strips for anything with moving parts, pieces or a
setup. Check that pieces really come off, doors really swing the right way about their hinge, things put in a
socket sit where they should.

## Sizes (metres)

People: adult 1.6-1.85 (eye 1.6), child 1.1-1.35, baby 0.7. Doorway 2.05 x 0.9. Ceiling 2.6.
Furniture: chair seat 0.45 (back 0.9), sofa seat 0.42 (2 m wide), table 0.75, desk 0.75, counter 0.9, bar 1.05,
bed 0.5 high x 2 x 1.5, bunk 1.6, wardrobe 2, bookshelf 1.8, fridge 1.8, oven 0.9, toilet seat 0.42, bathtub
0.55 x 1.7, sink 0.85, piano 1-1.5. Door handles at 1.0, light switches at 1.2.
Vehicles: bicycle 1.0 tall 1.7 long (wheels 0.7); motorbike 1.1 x 2.1; car 1.45 tall, 4.5 long, 1.8 wide (wheels
0.65, seat 0.5, roof 1.45); SUV 1.8 x 4.8; van 2.3 x 5.5; bus 3.2 x 12 x 2.55 (door 2.0 high, floor 0.4, wheels
1.0); truck cab 3.2, semi trailer 4 x 16; fire engine 3.3 x 10; tractor 2.8 (rear wheels 1.8); train car 4 x 20,
locomotive 4.5 x 20; tram 3.5 x 25; boats: rowboat 0.6 x 3.5, sailboat mast 12 on a 9 m hull, yacht 4 x 15,
fishing boat 6 x 18, ship / liner / carrier / submarine: build their real proportions but at most 80 m long;
aircraft: small plane 2.7 x 8 x 11 wingspan, biplane 2.7 x 7 x 9, jet 12 x 40 x 36, helicopter 4 x 12 (rotor 11),
fighter jet 5 x 18 x 12, hot-air balloon 20 tall, blimp 15 x 60; rocket 50-60; spaceship 20-40.
Buildings: house 7-9 (storey 3), shop 4-6 with a 4 m frontage or more, barn 9, church 15 (steeple 25), lighthouse
20, castle 25, skyscraper and towers: build them at most 80 m tall; landmarks (Eiffel tower, pyramid, Big Ben):
their real proportions, at most 80 m (the town shows them in a miniature park). Mountains, volcanoes, cliffs:
a 30-40 m hill version. Planets, the sun, the moon, galaxies: a 1-3 m model (a planetarium shows them).
Animals: real size (mouse 0.05 tall, cat 0.3, dog 0.5-0.8, sheep 0.9, cow 1.5, horse 1.6 at the withers, camel
2.1, elephant 3.2, giraffe 5, whale up to 25 long, shark 3-6 long); insects their real 0.5-5 cm (cases in the
town show small things; do not enlarge them).
Small things: coin 0.024, phone 0.15, book 0.24, mug 0.1, plate 0.26, bottle 0.3, guitar 1.0, sword 0.9.

The checker warns when a figure is more than 4x off the tsv height. The tsv is sometimes wrong (it gives a wing
12 m, an oasis 0.1 m): then real size wins and the warning may stay, but say why in a comment on that entry.

## Edges

The cel model melts **soft** parts together with rounded seams (people, animals, food, plants, cushions, clothes,
anything organic or moulded). **Sharp** parts keep crisp edges and flat faces and are drawn as their own pieces:
use them for things that are made: furniture, appliances, electronics, buildings, boxes, books, crates, tools'
metal heads, blades, signs, panels, vehicles' trim and glass. Nothing should be razor sharp: give sharp boxes a
small `round` (0.05-0.2) so their edges catch the light. Mix within a figure: a sharp wooden table with a soft
cushion; a soft car body (a loft) with sharp windows, bumpers and lights; soft tyres.

```ts
m('bookcase', { edge: 'sharp' })          // every part sharp unless it says edge: 'soft'
  .box(size, at, { edge: 'soft' })        // this one melts instead
  .box(size, at, { blend: 0 })            // melted, but with a clean seam to its parent (no fillet)
```

## The builder (`import { m, around, A, withAct, withParts, withSockets } from '../dsl'`)

```ts
m(key, { view?: 'front' | 'side', edge?: 'sharp' | 'soft' })   // 'side': vehicles, long animals (nose to +z)
  .ball(size, at, o?)          // ellipsoid; size [w, h, d] or one number
  .box(size, at, o?)           // box, o.round 0..1 (default 0.25)
  .cyl(size, at, o?)           // cylinder along y [diameter, height, depth]; o.taper top fraction; o.segs sides
  .cone(size, at, o?)          // cone pointing up
  .prism(size, at, sides, o?)  // hexagonal nut, octagonal sign, pencil (flat sides, now honoured in the cel model)
  .pyramid(size, at, sides?, o?)  // pyramid (4 sides by default)
  .capsule(size, at, o?)       // rounded rod along y
  .torus(size, at, o?)         // ring in the x-y plane (a wheel facing you)
  .arc(size, at, o?)           // part of a ring centred on +y: o.arc degrees (180 arch, 270 horseshoe); handles,
                               // arches, horseshoes, rainbows, headphones, a magnet, a croissant (turn it with rot)
  .dome(size, at, o?)          // top half of an ellipsoid, flat side down: cupolas, caps, jellyfish, igloos
  .loft(size, at, profile, o?) // a smooth body along z through cross-sections: fuselages, hulls (o.cut 'bottom'),
                               // car bodies (o.boxy 0.5-0.8), fish, submarines, bottles and cans lying down, loaves
  .wedge(size, at, o?)         // triangular prism (gable roof): the triangle spans size[0] wide and size[1] high, extruded along size[2] (a sail is [length, height, thickness], not the other way round)
  .rod(a, b, thick, color?, o?) / .stick(a, b, thick, color?, o?)   // between two points
  .label(text, [w, h], at, o?) // printed card; o.depth sets its thickness (default 0.02; 0.003 for a sticker)
  .star(size, at, o?)          // o.rot now turns the whole star (rot [90, 0, 0] lays it flat)
  .heart(size, at, o?)
  .pair((s) => ...) / .each(n, (i) => ...)
  .socket(name, at, kind, o?)  // where other things go (see Sockets)
  .act({ setup?, click })      // what it does when clicked (see Acts)
  .done()
```

Loft profile: `[t, width, height, centre y]` from the back (t = 0, at -z) to the front (t = 1), the last three as
fractions of `size`. Example fuselage: `.loft([3.6, 3.8, 38], [0, 3, 0], [[0, 0.1, 0.25, 0.25], [0.15, 0.85, 0.9,
0.05], [0.5, 1, 1, 0], [0.92, 0.9, 0.9, 0], [1, 0.3, 0.35, -0.05]])`. A loft lies along z; turn it with rot.

Part options `o`: `color`, `rot`, `round`, `taper`, `segs`, `tube`, `apex`, `arc`, `boxy`, `cut`, `depth`, `noInk`,
`glow` (unlit: lights, flames, screens), `eye` (blinks), `name`, `parent`, `pivot` (the joint: a door's hinge, a
lid's back edge), `scale`, `edge`, `blend`, `piece`, `mover`.

Colour names: white black gray darkgray lightgray red darkred orange yellow gold green darkgreen lime teal cyan blue
navy skyblue purple violet pink magenta brown darkbrown tan beige cream peach maroon olive silver metal steel iron
copper bronze brass wood darkwood lightwood bark glass water ice stone rock sand dirt grass leaf snow fire flame
rubber plastic paper leather denim wool chocolate bread crust cheese meat tomato lettuce banana honey milk coffee tea
skin1 .. skin5, or `#rrggbb` (`#rgb` works too).

Coordinates: metres, feet on y = 0, +y up, **+z is the front**, +x the thing's left (viewer's right). `at` is the
solid's centre in figure space, even under a parent. `rot` degrees, X then Y then Z.

Thin parts: the cel model melts only parts at least about 7% of the figure's largest size thick; thinner ones (and
every sharp part, piece and mover) are drawn as their own crisp pieces. A figure can be made of pieces only.

Named parts the animations already know: `wheel*` (every part whose name starts `wheel` rolls when it moves),
`rotor*` (always spins flat: helicopter blades, ceiling fans), `fan*` (always spins facing you: windmills),
`door`, `lid`, `crank`, `top` (sways: a plant's crown), `head` (a flower head nods).

## Movers, pieces, sockets

```ts
// a part something can operate: swing (hinges: doors, lids, levers, flaps, a drawbridge), spin (propellers,
// engines, turntables, record players), slide (drawers, a toaster's lever, plungers, sliding doors), light
// (lamps, screens, headlights, a lighthouse lamp). axis in the part's own frame; a negative amount goes the other
// way; on: true starts it open / spinning / out / lit.
.box(size, at, { name: 'door', pivot: hingePoint, mover: { kind: 'swing', axis: 'y', amount: -100 } })
.box(size, at, { name: 'propeller', pivot: hub, mover: { kind: 'spin', axis: 'z', amount: 900 } })
.box(size, at, { name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.35 } })
.ball(size, at, { name: 'bulb', glow: true, mover: { kind: 'light', on: true } })

// a piece that can come off cleanly and go back (a slice of a yam, a cork, a lid, a hat, a sword in the stone)
.cyl(size, at, { name: 'slice', parent: 'body', piece: true })

// where other things go: slot (sinks in, sticking out: toaster, piggy bank, mailbox, card reader), inside (in it:
// fridge, oven, box, drawer: give part: 'drawer' to ride along), top (on it: table, shelf, plate, counter, bed),
// seat (someone sits: chair, saddle, car seat, throne; a person put there sits, hips and knees bent, lowered onto
// it), hand, hook (hangs below it), mouth. attach `where` takes a socket by name first, then a free one of that
// kind (a toaster's second slot when the first is full; "inside" also takes a slot).
.socket('slot', [0, 0.2, 0], 'slot', { size: 0.12 })
.socket('seat', [0, 0.45, 0.05], 'seat')
```

Kit figures (who, beast, bird, fish...) get the same with `withParts(fig, ['lid', 'wheel*'], { mover | piece |
edge })` and `withSockets(fig, [{ name, at, kind, part?, size? }])`, and an act with `withAct(fig, { click })`.

## Acts

An act is what the thing does when clicked, in the **same step language as every scripted scene** (and as what
players will ask for later), so keep it to real, reusable moves:

```ts
.act({
  setup: [A.spawn('milk', 'milk'), A.attach('milk', 'self', 'shelf')],   // optional: how the demo shows it
  click: [                                                            // one list, or several that alternate
    [A.operate('door', 'open'), A.say('Brrr!'), A.wait(2.5), A.operate('door', 'close')],
    [A.operate('freezer', 'open'), A.effect('snow', { dur: 1.5 }), A.wait(2), A.operate('freezer', 'close')],
  ],
})
```

Helpers (`A.*`), each a step: `pose(part, { rot?, move?, scale?, spin?, dur?, times? })` (values are targets from
rest: rot [0, 0, 0] puts it back; `times: n` goes there and back n times, `dur` each, and ends where it started,
for a wag, a peck or a flap in one step), `operate(part, 'open' | 'close' | 'on' | 'off' | 'out' | 'in' | 'up' | 'down')` (no
`to` toggles; an operate step lasts half a second, so open-then-close shows the open), `detach(part, ref?)`,
`reattach(part)`, `spawn(ref, word, at?, { scale? })`, `attach(id, to, where?)`,
`morph(word, id?)`, `set({ state, scale, tilt, expression, face })`, `say(text, dur?)`, `anim(name, times?)`,
`effect(name, { id?, dur?, loop? })`, `move(id, { rel, of, dist }, { speed, style })`, `remove(id, how?)`,
`drop(id)`, `face(target)`, `expr(name)`, `wait(seconds)`, `par(...steps)` (at the same time).
Ids: `'self'`, `'self.<socket>'` (whatever sits there; a step on it repeats for each), a spawn's or detach's ref,
`'player'`.

- `anim` names: hop wobble shake spin bounce fall_over pulse (the whole thing), and gestures wave point clap shrug
  thumbs_up cover_eyes hands_on_hips arms_up dance bow nod shake_head wink laugh cry gasp look_around wag flap,
  and the figures' own clips by name: people jump cheer tada think scared stomp love yawn facepalm; four-legged
  animals rear graze look; birds peck crow flutter; dragons roar breathe. A gesture moves an arm from hanging
  down: a person with a rest stance (holding a tray, arms crossed) lets go of it on that arm while the gesture
  plays, unless the act itself is posing that arm.
- A living thing that is clicked looks at the player while its act runs and then turns back; you do not need a
  `face('player')` step (it is turned into that look).
- `effect` names: fire smoke steam rain water_spray sparkle explosion snow hearts dust.
- expressions: neutral happy sad angry surprised scared sleepy laughing confused.
- `remove` how: pop fade sink fly_away explode. move speed: slow walk run fly instant; style walk hop slide fly.

What makes a good act:
- **It fits the thing** and, where possible, only that thing: the toaster toasts, the fridge opens, the
  biplane's engine starts, the yam's slice comes off, the piggy bank takes a coin in its slot, the umbrella opens
  (pose its canopy scale or ribs), the clock's hands turn, the cannon fires (smoke, a recoil `pose`), the kettle
  steams, the flower blooms (`pose` the head's scale up), a book's cover swings open, a die rolls (`anim spin`
  then `set` a tilt), a slot machine's reels spin. Semi-unique is fine for big families (every dog breed wags
  and barks, every car honks and blinks its lights) but vary what you can (a husky howls, a pug snorts).
- **People** play a gesture that fits their role, and **say a line that matches the gesture and the person**: a
  waiter bows and says "Your table is ready."; a firefighter points and says "Stand back!"; a magician makes a
  rabbit appear (spawn, then remove). Give people a fitting rest pose with `who(..., { pose })`: wave, arms_up,
  point, hold, hips, reach, cross, salute.
- **Animals** do what they do and make their sound in `say` ("Moo!", "Quack!"; a mark like "!" for quiet ones).
- **Short**: each click under ~8 seconds. 1 to 3 click entries.
- **Tidy**: things it spawns go away again (`remove`) or the next click clears them, so clicking does not pile up
  junk. Detached pieces come back on a later click (`reattach`).
- **Setups** only where they make the thing read better in the town: bread in the toaster, milk in the fridge,
  a coin by the piggy bank, flowers in the vase, food on the plate. Use vocabulary words for spawns; when none
  fits, add an act-only prop with `x('burnt toast', () => ...)` (at most ~12 per chunk; it also stands on its own
  once in the town, so tag it in `src/shared/city/tags.json`).
- Objects normally do not talk; a sound word is fine ("Ding!", "Honk!", "Tick tock").

## People (`import { who, hat, face, wear, body, held } from '../accessories'`)

```ts
who('firefighter', { h?, skin?, hair?, style?, top?, bottom?, shoes?, skirt?, legs?, shorts?, long?, build?, beard?,
  glasses?, head?, pose?, acc: [...] })
```
Anything not given is picked from the word. `h`: metres or 'kid', 'baby', 'tall', 'short'; `head`: head size
multiplier at any height; `shorts: true` shows bare shins; `pose`: wave arms_up point hold hips reach cross salute.
Accessories: `hat(k)`, `face(k)`, `wear(k)`, `body(k)`, `held(k, color?, side?)` as before (see accessories.ts for
the lists). Instruments (guitar, violin) now sit on the body. Build missing props with `m()` and join figures by
hand when needed.

## Animals

`beast(key, {...})` for four legs, `bird`, `fish`, `bug`, `snake`, `dragon` kits as before (see the kit sources
and the examples), all at real size. Whales and dolphins: the fish kit with the tail turned flat, or a loft body.

## Districts and groups

Keep the existing district and group of each entry. (For new act-only props, `x()` fills them in.)
