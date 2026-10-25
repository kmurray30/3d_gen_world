/**
 * Structures: things built from a handful of flat-faced shapes with a tinted crayon material, as opposed to decor,
 * which is a drawn cutout. A structure lives on an entity as `entity.structure`; its parts are in the entity's local
 * frame (origin at the feet point, +y up, the "front" facing +z before the entity's yaw is applied), in metres.
 * Parts are the source of truth for rendering and collision; `gen` and `params` only record how they were made.
 */
import type { SpriteRef } from '../types';

/** Named crayon tiles; the client draws each one procedurally and tints it with the part's colour. */
export const MATERIALS = ['plaster', 'brick', 'plank', 'shingle', 'stone', 'thatch', 'concrete', 'gingerbread', 'icing', 'stripe', 'glass', 'metal', 'water', 'flat'] as const;
export type MaterialName = (typeof MATERIALS)[number];

interface PartBase {
  /** Centre of the part's footprint at its bottom, in structure-local metres. */
  pos: [number, number, number];
  /** Yaw in degrees about the part's own vertical axis (counter-clockwise seen from above). */
  rot?: number;
  mat: MaterialName;
  /** CSS hex colour the material tile is tinted with. */
  color: string;
  /** Skip the ink outline on this part (bands, decals and other things that read as one piece with their neighbour). */
  noInk?: boolean;
  /** Not solid: walked through, nothing lands on it (railings, hat brims that are just for looks). */
  ghost?: boolean;
  /** Solid but not drawn: collision only (the wall that keeps you on a bridge between its railings). */
  hidden?: boolean;
  /** Lit from inside at night: windows, lanterns, the lighthouse lamp. */
  glow?: boolean;
  /** The lighthouse lamp: sweeps a beam at night. */
  beacon?: boolean;
  /** A lamp: a soft halo of light round it at night (lantern glass, a lamp post's head). */
  halo?: boolean;
}

/** Axis-aligned box of w (x) by h (y) by d (z) before rotation. */
export interface BoxPart extends PartBase {
  t: 'box';
  w: number;
  h: number;
  d: number;
}

/** A doorway cut out of a wall: centred `at` metres from the wall's centre, reaching from the floor to `h`. */
export interface Opening {
  at: number;
  w: number;
  h: number;
}

/**
 * A wall of length w along its local x, thickness d, outward face toward +z, with doorways cut from the floor
 * up. Drawn as one slab (so only the real outline is inked); collides as the solid pieces between the doorways.
 */
export interface WallPart extends PartBase {
  t: 'wall';
  w: number;
  h: number;
  d: number;
  openings?: Opening[];
}

/** Regular n-gon prism (sides >= 3) with an elliptical footprint; `rTop` < r tapers it (a cone when 0). */
export interface PrismPart extends PartBase {
  t: 'prism';
  sides: number;
  r: number;
  h: number;
  rz?: number;
  rTop?: number;
  /** Offset of the top ring relative to the bottom one, for leaning cones (a bent hat tip). */
  lean?: [number, number];
  /** Inner radius: a hollow ring open at the top and bottom (a basin wall, a well), tapering with the outside. */
  hole?: number;
  /**
   * Laid on its side: the axis runs along local z (h long, centred on pos) and it rests on pos.y, r wide and rz
   * tall each side of the axis. `half` keeps only the upper half, flat side down (a mailbox's domed top).
   */
  lie?: boolean;
  half?: boolean;
}

/** Roof over a w by d rectangle: gable (ridge along x), hip (ridge along the longer axis), shed (slope down toward +z). */
export interface RoofPart extends PartBase {
  t: 'roof';
  style: 'gable' | 'hip' | 'shed';
  w: number;
  d: number;
  h: number;
  /** Material and colour for the vertical gable ends (default: the roof's own). */
  endMat?: MaterialName;
  endColor?: string;
}

/** Straight flight of stairs rising along +z (local) from the bottom front edge to the top back edge. */
export interface StairsPart extends PartBase {
  t: 'stairs';
  w: number;
  h: number;
  d: number;
  steps: number;
}

/** Flat sprite stuck on a wall: doors, windows, signs. Rendered as a quad facing +z (local), centred at pos + h/2 up. */
export interface DecalPart extends PartBase {
  t: 'decal';
  sprite: SpriteRef;
  w: number;
  h: number;
  /** Sign text drawn on a paper card instead of the sprite (sprite.file is null then). */
  text?: string;
  /** Doors swing open on a hinge when the player interacts with the building. */
  role?: 'door';
}

/**
 * A flat paper strip following a path in the part's local x-y plane (x outward, y up), `w` wide across the path
 * and narrowing or widening to `wEnd`: water arcs, banners. Never solid; both sides are drawn.
 */
export interface RibbonPart extends PartBase {
  t: 'ribbon';
  path: Array<[number, number]>;
  w: number;
  wEnd?: number;
}

export type Part = BoxPart | WallPart | PrismPart | RoofPart | StairsPart | DecalPart | RibbonPart;

export interface Structure {
  /** Generator name ("house", "fence", ...) or "custom" for a parts list the model laid out. */
  gen: string;
  params: Record<string, number | string | boolean>;
  parts: Part[];
  /** Local-space extents: x in [-w/2, w/2], y in [0, h], z in [-d/2, d/2]. */
  bounds: { w: number; h: number; d: number };
  /** Outline ink colour (default near-black; icing white for gingerbread). */
  ink?: string;
}

/** What a generator needs from the outside world: how to find a sprite for a decal word (door, window, sign). */
export type DecalResolver = (word: string) => SpriteRef | null;

export interface GenContext {
  rng: () => number;
  decal: DecalResolver;
}
