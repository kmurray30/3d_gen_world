/**
 * Figures: things drawn by code instead of a sprite. A figure is a small tree of parts. Each part is a joint (a
 * pivot that animations rotate) carrying one simple solid. The same spec is rendered two ways: as layered paper
 * pieces (each solid flattened to its outline on the paper plane, re-projected every frame so limbs swing, shorten
 * and pass in front of or behind the body) and as a 3D toon model built from the solids themselves.
 *
 * Figure space: metres, feet on y = 0, +y up, +z is the figure's front (it faces you at yaw 0), +x is the
 * figure's left (your right when it faces you). Rotations are Euler degrees in XYZ order, like Three.js.
 */
export type Vec3 = [number, number, number];

/** ball: ellipsoid; capsule: rounded rod along y; box: (rounded) box; cyl: cylinder, tapered by `taper` (0 = cone);
 *  torus: ring in the x-y plane (a wheel seen from the front); wedge: triangular prism, triangle in x-y, ridge
 *  along z (a gable roof). */
export type Shape = 'ball' | 'capsule' | 'box' | 'cyl' | 'torus' | 'wedge';

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
  /** head: the face is painted on it in 3D. face: drawn face features (paper only). eye: blinks. glow: unlit. */
  role?: 'head' | 'face' | 'eye' | 'glow';
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
}

export type Rig = 'biped' | 'quad' | 'bird' | 'dragon' | 'prop';

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
}
