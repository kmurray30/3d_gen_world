# Writing catalog figures

Every vocabulary word gets a figure drawn by code: a short spec that the game turns into a paper cutout, origami,
a 3D toy and a sculpted cel-shaded model (the favourite). You write specs; the renderers do the rest.

Read `src/shared/figure/catalog/examples.ts` first: 16 worked examples covering every technique below.

## Your job

- You own exactly one chunk: `src/shared/figure/catalog/<chunk>.ts`. Its words are in
  `src/shared/figure/catalog/assign/<chunk>.tsv` (word, type, height in metres, a few synonyms).
- Put one entry per word into the file's `ENTRIES` array: `e('<word exactly as in the tsv>', '<district>', '<group>', () => <figure>)`.
- Edit **no other file**. Do not run git, the build, the test suite or a server. Only the two scripts below.
- Coverage first: every word should get an entry. A simple, recognisable figure beats a missing one.

## Check and look

```
npx tsx scripts/check-catalog.ts <chunk>                       # builds and sculpts every entry, lists missing words and errors
npx tsx scripts/preview-catalog.ts <chunk> 0 48 /tmp/<chunk>-0.png   # contact sheet of 48 sculpted models, numbered
```

Open the PNG with the Read tool and fix anything unrecognisable, broken, floating apart or wrongly coloured. Sheets
show a front-left view from slightly above (profile figures from the side), with thin parts thickened. Work in
batches: write ~40 entries, check, preview, fix, continue. Finish with a clean check (exit code 0).

## Quality bar

- Recognisable at a glance from silhouette and colour, like a toy or a game prop. Cute proportions are fine.
- Real size in metres, close to the tsv height (the checker warns beyond 4x; ignore a warning only if the tsv
  height is clearly wrong, e.g. "well 10 m"). Huge things (ships, buildings, mountains, planets) can be built at a
  modest size (3 to 15 m); the Atlas rescales anyway.
- Usually 3 to 25 parts. Parts that touch or overlap; nothing floating unless it should (a cloud, a halo).
- Colours that read: use palette names or hex. Distinct parts in distinct colours.
- Things stand on y = 0 (feet, wheels, base). Flying things (a kite, a balloon, a cloud) can start higher.
- At least one chunky part. The cel model melts together only parts whose thinnest side is at least about 7% of
  the figure's largest size; thinner parts (rods, cards, poles, blades) ride along as separate smooth pieces.
  A figure made only of thin parts "sculpts to almost nothing" in the checker, so give flat and spindly things a
  base, a stand, a slab or a thicker body. (Preview sheets thicken thin parts, so they look fine there anyway.)
- Known limits: `segs` (facets) only shows in the paper, origami and 3D looks; the cel model is always smooth.
  There is no partial ring, curved tube or see-through glass yet: build arcs from short rods.

## Coordinates

Metres. Feet on y = 0, +y up, **+z is the front** (faces the viewer), +x is the thing's left (viewer's right).
`at` is always the centre of the solid in figure space. `rot` turns a solid about its centre, in degrees, applied
X then Y then Z (`rot: [90, 0, 0]` lays a y-axis rod along +z; `rot: [0, 0, 90]` lays it along x).

## The model builder (`import { m, around } from '../dsl'`)

```ts
m(key, { view?: 'front' | 'side' })   // 'side' for things seen best in profile: vehicles, long animals
  .ball(size, at, o?)        // ellipsoid; size [w, h, d] or one number for a sphere
  .box(size, at, o?)         // rounded box (o.round 0..1, default 0.25; 0 = sharp)
  .cyl(size, at, o?)         // cylinder along y: [diameter x, height, diameter z]; o.taper = top radius fraction; o.segs = sides
  .cone(size, at, o?)        // cone pointing up (cyl with taper 0); turn it with rot
  .capsule(size, at, o?)     // rounded rod along y: [diameter, length, depth]
  .torus(size, at, o?)       // ring in the x-y plane (a wheel facing you): [outer diameter, outer height, thickness]; o.tube
  .wedge(size, at, o?)       // triangular prism: triangle across x (apex up), extruded along z; o.apex -0.5..0.5 moves the apex
  .rod(a, b, thick, color?, o?)    // rounded rod from point a to point b (legs, handles, branches, poles)
  .stick(a, b, thick, color?, o?)  // flat-ended cylinder from a to b
  .label(text, [w, h], at, o?)     // a card with printed text on its front (letters, numbers, signs, book spines)
  .star(size, at, o?)        // five-pointed star standing up facing +z
  .heart(size, at, o?)       // heart standing up facing +z
  .pair((s) => ...)          // call twice with s = 1 and -1: mirror x positions and turns with s
  .each(n, (i) => ...)       // repeat
  .done()                    // -> Figure
```

Part options `o`: `color`, `rot`, `round`, `taper`, `segs`, `tube`, `apex`, `noInk` (no outline: spots, stripes,
painted details), `glow` (unlit, glows at night: flames, lamps, screens, neon), `eye` (blinks), `name`, `parent`,
`pivot`, `scale`.

Colour names: white black gray darkgray lightgray red darkred orange yellow gold green darkgreen lime teal cyan blue
navy skyblue purple violet pink magenta brown darkbrown tan beige cream peach maroon olive silver metal steel iron
copper bronze brass wood darkwood lightwood bark glass water ice stone rock sand dirt grass leaf snow fire flame
rubber plastic paper leather denim wool chocolate bread crust cheese meat tomato lettuce banana honey milk coffee tea
skin1 (lightest) .. skin5 (darkest). Or any `#rrggbb`.

Moving parts: give a part one of these names and it animates. `wheel` (rolls when poked or moving; one per
figure), `rotor` (always spins about vertical: helicopter blades, ceiling fan), `fan` (always spins facing you:
windmill sails, propeller, pinwheel), `door` (swings open when poked; set `pivot` on its hinge edge), `lid` (opens
when poked; set `pivot` on its back edge), `crank`, `top` (sways gently: a plant's crown), `head` (a flower head
sways). Children of a named part ride with it (`parent: 'lid'`). Names must be unique within a figure.

## People (`import { who, hat, face, wear, body, held } from '../accessories'`)

```ts
who('firefighter', { h?, skin?, hair?, style?, top?, bottom?, shoes?, skirt?, legs?, long?, build?, beard?, glasses?, acc: [...] })
```
Anything not given is picked from the word (skin, hair, clothes vary), so specify what defines the role: outfit
colours, `long: true` for long sleeves, `skirt` for a skirt or dress. `h`: metres, or 'kid', 'baby', 'tall', 'short'.
`style`: short long ponytail pigtails bun spiky bald none. `build`: 0.8 slim .. 1.4 broad.

Accessories (each takes an optional colour; `held` also takes side 'L' or 'R'):
- `hat(k)`: cap top crown helmet hard cowboy wizard beanie chef beret bowler sombrero tiara headband hood halo pirate
  fez grad police turban bandana santa party viking astronaut nurse flower bow horns catears bunnyears antennae
  military straw jester veil headphones mohawk afro
- `face(k)`: beard longbeard mustache glasses sunglasses goggles monocle eyepatch mask clownnose snorkel
- `wear(k)`: cape cloak apron coat labcoat robe toga vest lifejacket suit tie bowtie belt 'tool belt' backpack scarf
  necklace medal whistle stethoscope badge armor tutu overalls sash
- `body(k)`: angelwings batwings fairywings devitail cattail tail fishtail shell jetpack
- `held(k)`: sword knife staff spear trident pitchfork broom mop rake shovel flag torch cane net sign wand baton
  pointer drumsticks paintbrush umbrella balloon briefcase bag basket lantern gift book clipboard phone map letter
  scroll mic cup trophy icecream ball hammer axe pickaxe wrench club bat gavel shield spatula pan racket magnifier
  guitar violin trumpet camera compass bouquet bow 'fishing rod' whip lasso hose leash blaster saw chainsaw scissors
  syringe pizza tray skateboard surfboard

Famous or fictional people (abraham lincoln, link, wonder woman): suggest them with outfit, colours and props.
Creatures that are mostly human (vampire, zombie, robot, mermaid) are `who` with skin colour and accessories
(`body('fishtail')`, green skin, `hat('horns')`...). Groups ("justice league", "conjoined twins") may be built with
`m()` from two or three simplified people, or one representative person.

## Animals

- Four legs: `beast(key, { color, body: [length, height, width], bodyShape?: 'capsule' | 'ball' | 'box', legL, legW, hoof?, hoofH?, neckL, neckLean (deg), neckW?, head: [length, height, width], snout?: { len, h, w, color?, shape?: 'ball' | 'box' | 'cyl' }, nose?, ears: 'floppy' | 'pointy' | 'long' | 'side', earSize, earColor?, tail: 'long' | 'curl' | 'tuft' | 'stub' | 'fluffy', tailColor?, tailAngle?, belly?, legColor?, headColor?, acc: [ani.*] })`
  with `ani.horns(color, 'bull' | 'goat' | 'ram' | 'unicorn' | 'rhino')`, `ani.antlers()`, `ani.trunk()`, `ani.hump(color, two?)`,
  `ani.mane(color, lion?)`, `ani.spots(color, n, flat?)`, `ani.stripes(color, n)`, `ani.shell(color)`, `ani.quills(color)`,
  `ani.beard(color)`, `ani.wings(color)`. Use it for mammals, lizards (low legs, long tail), turtles (`ani.shell`), frogs.
  See the giraffe example. Sizes in metres (a mouse is 0.05 tall, an elephant 3).
- Birds: `bird(key, { height, color, wing, beak, legs, comb?, tail?: [colours] })` (`import { bird } from '../kit'`).
- Fish and sea life: `fish(key, { length, color, belly?, fin?, shape?: 'round' | 'long' | 'flat' | 'tall' | 'shark', stripes? })`.
  Whales, dolphins and sharks too (shape 'shark', big length). Octopus, jellyfish, crab, starfish: build with `m()`.
- Bugs and spiders: `bug(key, { length, color, legs?: 6 | 8, wings?: 'none' | 'clear' | 'beetle' | 'butterfly', wingColor?, antennae?, segments?: 2 | 3, stripes? })`.
- Snakes and worms: `snake(key, { length, color, belly?, bands?, hood?, girth? })` (`import { bug, fish, snake } from '../creatures'`).
- Dragons and other winged beasts: `dragon(key, { size, scales, belly, wing, spikes, horns })` (`import { dragon } from '../kit'`).
- Young animals (puppy, kitten, foal, calf): the adult recipe smaller, with a bigger head and shorter legs.

## Districts and groups

District (second argument) is where the thing lives in the Atlas world; group (third) is a short lower-case
shelf label within it, shared by similar things ("fruit", "power tools", "dog breeds"). Reuse groups.

| district | for |
|---|---|
| town | people: jobs, roles, family, famous and fictional people |
| fantasy | myths, monsters, magic creatures and magic items (wands, potions, unicorns, ghosts, dragons) |
| pets | dogs, cats and small pets (hamster, rabbit, goldfish bowl) |
| farm | farm animals and farm things (tractor parts go to garage; hay bale, trough, scarecrow here) |
| wild | wild land animals, including reptiles and amphibians |
| sea | fish, sea mammals, shellfish, coral, and seaside things (buoy, lighthouse model goes to places) |
| aviary | birds |
| bugs | insects, spiders, worms, snails |
| food | food and drink of every kind |
| kitchen | cookware, utensils, kitchen appliances, tableware |
| home | furniture, decor, bathroom, bedroom, cleaning, household things |
| wardrobe | clothes, shoes, hats, bags, jewellery, accessories |
| workshop | tools, hardware, building materials, construction things |
| garage | vehicles: cars, trucks, bikes, boats, aircraft, trains, spacecraft, and their parts |
| music | instruments and audio gear |
| sports | sports equipment, outdoor and camping gear, gym things |
| toys | toys, games, party and holiday things |
| study | books, stationery, school and office supplies, science lab things |
| tech | electronics, computers, machines, gadgets, robots-as-machines |
| armory | weapons and armour |
| garden | plants, flowers, trees, mushrooms, garden things |
| nature | rocks, landforms, weather, water, fire and other elements |
| sky | planets, stars, moon, sun, comets, constellations and zodiac signs, things that fly in the sky (kite, balloon) |
| places | buildings, rooms and landmarks as small models (a "pawnshop" is a little shop with a sign) |
| clinic | medicine, hospital things, body parts and organs |
| ideas | letters, numbers, shapes, symbols, signs, abstract ideas, emotions |

Abstract words (beauty, famine, genius, riddle, checkmate): pick the clearest symbol and build it, often with a
`label` or a `heart`/`star`, on a small plinth (a question mark for riddle, a crowned chess king for checkmate,
an empty bowl for famine, a lightbulb for genius). Letters and numbers: `label` cards on a stand. Weather: shapes
(a tornado is a stack of grey tapered rings, rain a cloud with blue drops).
