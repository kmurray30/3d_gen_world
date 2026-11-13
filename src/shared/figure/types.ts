/**
 * Figures: things drawn by code instead of a sprite. A figure is a small tree of parts. Each part is a joint (a
 * pivot that animations rotate) carrying one simple solid. The same spec is rendered two ways: as layered paper
 * pieces (each solid flattened to its outline on the paper plane, re-projected every frame so limbs swing, shorten
 * and pass in front of or behind the body) and as a 3D toon model built from the solids themselves.
 *
 * Figure space: metres, feet on y = 0, +y up, +z is the figure's front (it faces you at yaw 0), +x is the
 * figure's left (your right when it faces you). Rotations are Euler degrees in XYZ order, like Three.js.
 */
import type { Step } from '../schema';

export type Vec3 = [number, number, number];

/** ball: ellipsoid; capsule: rounded rod along y; box: (rounded) box; cyl: cylinder, tapered by `taper` (0 = cone),
 *  with `segs` sides a prism or pyramid; torus: ring in the x-y plane (a wheel seen from the front); wedge:
 *  triangular prism, triangle in x-y, ridge along z (a gable roof); dome: the top half of an ellipsoid, flat side
 *  down (a cupola, a cap, a jelly); arc: part of a torus, centred on +y (an arch, a horseshoe, a handle); loft: a
 *  smooth body along z through cross-sections (a fuselage, a boat hull, a car body, a fish, a bottle on its side). */
export type Shape = 'ball' | 'capsule' | 'box' | 'cyl' | 'torus' | 'wedge' | 'dome' | 'arc' | 'loft';

/**
 * A part something can operate (`operate` in a script): swing turns it about its joint by `amount` degrees (doors,
 * lids, levers, flaps; default 100), spin keeps turning it at `amount` degrees a second (propellers, fans, wheels,
 * turntables; default 720), slide moves it `amount` metres (drawers, plungers, a toaster's lever; default 0.3),
 * light makes it glow (lamps, screens, headlights). `axis` is in the part's own joint frame; a negative amount
 * goes the other way. `on` starts it open / spinning / out / lit.
 */
export interface Mover {
  kind: 'swing' | 'spin' | 'slide' | 'light';
  axis?: 'x' | 'y' | 'z';
  amount?: number;
  on?: boolean;
}

/**
 * Where other things go on or in a figure: slot (slides down into it, sticking out: a toaster, a piggy bank, a
 * card reader), inside (hidden in it: a fridge, an oven, a box, a pocket), top (set on it: a table top, a shelf, a
 * plate, a counter), seat (someone sits: a chair, a saddle, a car seat), hand (held: a person's hands, a claw),
 * hook (hangs from it), mouth (in its mouth). `at` is the spot in figure space at rest; with `part` it rides
 * along when that part moves. `size` is about the largest thing that fits, in metres. `yaw` turns what sits there.
 */
export type SocketKind = 'slot' | 'inside' | 'top' | 'seat' | 'hand' | 'hook' | 'mouth';
export interface Socket {
  name: string;
  kind: SocketKind;
  /** In the frame of `part`'s joint when it has one, else figure space (the builder converts). */
  at: Vec3;
  part?: string;
  size?: number;
  yaw?: number;
}

/**
 * What the thing does when clicked, written in the same step language as every scripted scene (and as anything
 * the player asks for): `self` is the thing itself, refs name things the act spawns, and `self.<socket>` is
 * whatever sits in that socket. `setup` runs once when the thing is placed in a demo world (bread put in the
 * toaster). Each click runs the next entry of `click`, round and round.
 */
export interface FigAct {
  setup?: Step[];
  click: Step[][];
}

export interface FigPart {
  name: string;
  /** Parent part name; parts without one hang off the figure root. */
  parent?: string;
  /** Joint position in the parent's frame (or figure space for root parts). */
  at: Vec3;
  /** Rest rotation of the joint, degrees. Animation adds to this. */
  rot?: Vec3;
  shape: Shape;
  /** Full extents of the solid along its own x, y, z. capsule: diameter, length, depth. torus: outer diameter x,
   *  outer diameter y, thickness. */
  size: Vec3;
  /** Solid centre relative to the joint (an arm's solid hangs below its shoulder). */
  off?: Vec3;
  /** Solid orientation relative to the joint, degrees. */
  srot?: Vec3;
  color: string;
  /** box: corner rounding 0..1 of the smallest side. */
  round?: number;
  /** cyl: top radius as a fraction of the bottom (1 = straight, 0 = cone). */
  taper?: number;
  /** cyl: number of sides (default smooth). */
  segs?: number;
  /** wedge: where the apex sits along the base, -0.5 (over the left end: a right triangle) to 0.5. */
  apex?: number;
  /** torus: tube thickness as a fraction of the outer radius. */
  tube?: number;
  /** Paper: draw order nudge when parts sit at the same depth (higher = in front). */
  layer?: number;
  /** Paper: only on the front (faces) or back of the cutout. */
  side?: 'front' | 'back';
  /** head: the face is painted on it in 3D. face: drawn face features (paper only). eye: blinks. glow: unlit.
   *  label: a card with `text` printed on its front (letters, numbers, signs, book covers). */
  role?: 'head' | 'face' | 'eye' | 'glow' | 'label';
  /** label: the text printed on the card. */
  text?: string;
  /** Rest size of the solid (not its children); 0 hides it until a clip grows it (a dragon's flame). */
  scale?: number;
  /** Paper: rest rotation used instead of `rot` when flattened (a dragon's wings lie in the paper's plane). */
  paperRot?: Vec3;
  /** Paper: turn the clip's rotation about z (a wing flap) into a rotation about this axis, times k, so a flap
   *  that swings toward the viewer in 3D swings within the paper. */
  paperFlap?: { axis: 0 | 1 | 2; k: number };
  /** Skip in one renderer: details that only make sense flat or only in 3D. */
  only?: 'paper' | 'toon';
  /** No ink outline / no toon outline. */
  noInk?: boolean;
  /** arc: how much of the ring there is, in degrees, centred on +y (180 = an arch, 270 = a horseshoe). */
  arc?: number;
  /** loft: cross-sections from the back (t = 0, at -z) to the front (t = 1): [t, width, height, centre y], the
   *  last three as fractions of the size (centre y from -0.5 to 0.5, default 0). At least two sections. */
  profile?: Array<[number, number, number, number?]>;
  /** loft: how square the cross-sections are, 0 (round) to 1 (a rounded box). */
  boxy?: number;
  /** loft: keep only the bottom half of every section (a boat hull) or the top half (a car roof, a shell). */
  cut?: 'top' | 'bottom';
  /** The cel model: 'sharp' keeps crisp edges and flat faces (a book, a crate, a phone, a building, a blade);
   *  'soft' melts it into its neighbours with rounded seams. Default: the figure's `edge`, else soft. */
  edge?: 'sharp' | 'soft';
  /** Fillet where this part melts into its parent, times the default (0 = a clean seam, 2 = extra smooth). */
  blend?: number;
  /** A separate piece: never melted into the body, so it can come off or move (a slice cut from a yam, a cork,
   *  a removable lid, a sword in a stone). `detach` and `pose` move it cleanly. */
  piece?: boolean;
  /** Something can operate it: see Mover. Movers are separate pieces too. */
  mover?: Mover;
}

export type Rig = 'biped' | 'quad' | 'bird' | 'dragon' | 'fish' | 'bug' | 'snake' | 'prop';

export interface FaceSpec {
  skin: string;
  eyes: string;
  /** Cheek blush colour, or none. */
  blush?: string;
  /** Lip / mouth line colour. */
  mouth?: string;
  /** Brow colour (usually the hair). */
  brow: string;
  /** Freckles, beard stubble and similar. */
  beard?: string;
  /** Glasses frame colour. */
  glasses?: string;
}

export interface Figure {
  key: string;
  /** Paper projection: people and props are drawn from the front, animals in profile (facing left). */
  view: 'front' | 'side';
  rig: Rig;
  parts: FigPart[];
  /** Natural height in metres (top of the bounding box, computed). */
  heightM: number;
  /** Half extents of the footprint in metres (computed). */
  halfW: number;
  halfD: number;
  face?: FaceSpec;
  /** Category for the gallery. */
  group: 'people' | 'animals' | 'fantasy' | 'nature' | 'village' | 'things';
  /** Paper: round things (trees, rocks, barrels) stand as two crossed cutouts so they never go edge-on. */
  paperCross?: boolean;
  /** Default edge style of its parts in the cel model (see FigPart.edge). */
  edge?: 'sharp' | 'soft';
  sockets?: Socket[];
  act?: FigAct;
}
