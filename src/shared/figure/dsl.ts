/**
 * The authoring language for the catalog: thousands of things described in a few lines each.
 *
 *   m('teapot', 'kitchen', 'teaware')
 *     .ball([0.22, 0.17, 0.22], [0, 0.1, 0], { color: 'white' })
 *     .cyl([0.1, 0.03, 0.1], [0, 0.19, 0], { color: 'white' })
 *     .rod([0.1, 0.1, 0], [0.19, 0.17, 0], 0.025, 'white')
 *     .torus([0.1, 0.1, 0.02], [-0.12, 0.1, 0], { color: 'white', rot: [0, 90, 0] })
 *     .done()
 *
 * Sizes and positions are metres in figure space: feet on y = 0, +y up, +z the front (it faces you), +x its
 * left (your right). `at` is a solid's centre, always in figure space, even under a parent. `rot` turns the solid
 * about its centre. A `name` makes a part something clips can move (lid, wheel, door, top, head...); `parent`
 * makes it ride on another named part, and `pivot` is where it turns (a lid's hinge; default its centre).
 */
import type { FigAct, FigPart, Figure, Mover, Rig, Shape, Socket, SocketKind, Vec3 } from './types';
import { Parts, figure } from './kit';
import { apply, euler, measure, mul, solve, transpose } from './math';
import { normalizeAct, type ActDef } from './act';
import { toEuler } from './pose';

import { C, col } from './colors';
export { C };


export interface PartOpts {
  color?: string;
  name?: string;
  parent?: string;
  /** Where the part turns, in figure space (default: its centre). */
  pivot?: Vec3;
  /** Turns the solid about its centre, degrees. */
  rot?: Vec3;
  round?: number;
  taper?: number;
  segs?: number;
  tube?: number;
  apex?: number;
  noInk?: boolean;
  glow?: boolean;
  eye?: boolean;
  layer?: number;
  /** Rest size multiplier of the solid (0 = hidden until a clip grows it). */
  scale?: number;
  only?: 'paper' | 'toon';
  /** Cel model: 'sharp' for crisp edges and flat faces, 'soft' to melt into its neighbours (see FigPart.edge). */
  edge?: 'sharp' | 'soft';
  /** Fillet where it melts into its parent, times the default (0 = a clean seam). */
  blend?: number;
  /** A separate piece that can come off or move cleanly (see FigPart.piece). */
  piece?: boolean;
  /** Something can operate it: { kind: 'swing' | 'spin' | 'slide' | 'light', axis, amount, on }. Give it a
   *  `pivot` at its hinge for swings. */
  mover?: Mover;
  /** arc: degrees of ring (default 180, an arch). */
  arc?: number;
  /** loft: how square its sections are (0 round .. 1 boxy). */
  boxy?: number;
  /** loft: keep only the bottom (hull) or top half of each section. */
  cut?: 'top' | 'bottom';
  /** label: card thickness in metres (default 0.02). */
  depth?: number;
}

export type Size = Vec3 | number;
const sz = (s: Size): Vec3 => (typeof s === 'number' ? [s, s, s] : s);

export interface ModelOpts {
  view?: 'front' | 'side';
  rig?: Rig;
  /** Default edge style of every part (sharp for buildings, furniture, machines, boxes, books, electronics). */
  edge?: 'sharp' | 'soft';
}

export class M {
  readonly parts = new Parts();
  private count = 0;
  private readonly abs = new Map<string, Vec3>();
  private readonly sockets: Socket[] = [];
  private actDef: FigAct | undefined;

  constructor(
    readonly key: string,
    private readonly opts: ModelOpts = {},
  ) {}

  /** Any solid. Most authors use the shorthands below. */
  part(shape: Shape, size: Size, at: Vec3, o: PartOpts = {}, extra: Partial<FigPart> = {}): this {
    const name = o.name ?? `${shape}${this.count++}`;
    const pivot = o.pivot ?? at;
    let jointAt: Vec3 = pivot;
    let off: Vec3 = [at[0] - pivot[0], at[1] - pivot[1], at[2] - pivot[2]];
    if (o.parent) {
      // express the joint and the solid in the parent's (rest) frame
      const frames = solve({ key: this.key, view: 'front', rig: 'prop', parts: this.parts.list, heightM: 1, halfW: 1, halfD: 1, group: 'things' });
      const pf = frames.get(o.parent);
      if (!pf) throw new Error(`${this.key}: parent "${o.parent}" is not defined yet`);
      const Rt = transpose(pf.R);
      jointAt = apply(Rt, [pivot[0] - pf.T[0], pivot[1] - pf.T[1], pivot[2] - pf.T[2]]);
      off = apply(Rt, off);
    }
    const p: FigPart = {
      name,
      parent: o.parent,
      at: jointAt,
      off: off[0] || off[1] || off[2] ? off : undefined,
      srot: o.rot,
      shape,
      size: sz(size),
      color: col(o.color),
      round: o.round,
      taper: o.taper,
      segs: o.segs,
      tube: o.tube,
      apex: o.apex,
      noInk: o.noInk,
      layer: o.layer ?? Math.round(at[2] * 20),
      role: o.glow ? 'glow' : o.eye ? 'eye' : undefined,
      scale: o.scale,
      only: o.only,
      ...(o.edge ? { edge: o.edge } : {}),
      ...(o.blend !== undefined ? { blend: o.blend } : {}),
      ...(o.piece ? { piece: true } : {}),
      ...(o.mover ? { mover: o.mover } : {}),
      ...(o.arc !== undefined ? { arc: o.arc } : {}),
      ...(o.boxy !== undefined ? { boxy: o.boxy } : {}),
      ...(o.cut ? { cut: o.cut } : {}),
      ...extra,
    };
    this.parts.add(p);
    this.abs.set(name, at);
    return this;
  }

  ball(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('ball', size, at, o);
  }
  box(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('box', size, at, { round: 0.25, ...o });
  }
  /** Cylinder: size [diameter, height, depth]. Tapered with `taper` (top radius fraction). */
  cyl(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('cyl', size, at, o);
  }
  /** Cone pointing up (turn it with rot): size [base diameter, height, base depth]. */
  cone(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('cyl', size, at, { ...o, taper: 0 });
  }
  /** Rounded rod along y: size [diameter, length, depth]. */
  capsule(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('capsule', size, at, o);
  }
  /** Ring standing in the x-y plane (a wheel facing you): size [outer diameter, outer height, thickness]. */
  torus(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('torus', size, at, { tube: 0.25, ...o });
  }
  /** Triangular prism: triangle across x (base at the bottom), extruded along z. A gable roof. */
  wedge(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('wedge', size, at, o);
  }
  /** Prism with `sides` flat sides standing up (a hex nut, an octagonal stop sign lying flat, a pencil): size
   *  [across, height, across]. Taper it with o.taper. */
  prism(size: Size, at: Vec3, sides: number, o?: PartOpts): this {
    return this.part('cyl', size, at, { ...o, segs: Math.max(3, Math.min(16, Math.round(sides))) });
  }
  /** Pyramid with `sides` sides (default 4) pointing up: size [base across, height, base across]. */
  pyramid(size: Size, at: Vec3, sides = 4, o?: PartOpts): this {
    return this.part('cyl', size, at, { ...o, taper: o?.taper ?? 0, segs: Math.max(3, Math.min(16, Math.round(sides))) });
  }
  /** The top half of an ellipsoid, flat side down: size [width, height, depth] (a cupola, a cap, a jelly). */
  dome(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('dome', size, at, o);
  }
  /** Part of a ring in the x-y plane, centred on +y: size [outer width, outer height, thickness]; o.arc degrees
   *  (180 = an arch, 270 = a horseshoe), o.tube the thickness as a fraction of the radius. Turn it with rot. */
  arc(size: Size, at: Vec3, o?: PartOpts): this {
    return this.part('arc', size, at, { tube: 0.25, arc: 180, ...o });
  }
  /**
   * A smooth body along z (its length) through cross-sections: a fuselage, a boat hull, a car body, a fish, a
   * submarine, a bottle lying down. size [max width, max height, length]; profile: [t, width, height, centre y]
   * from the back (t = 0) to the front (t = 1), as fractions of size (centre y -0.5..0.5). o.boxy squares the
   * sections, o.cut keeps only the bottom (a hull) or top half.
   *   .loft([3.6, 3.8, 38], [0, 2.4, 0], [[0, 0.1, 0.25, 0.2], [0.15, 0.8, 0.9, 0.05], [0.5, 1, 1, 0], [0.92, 0.85, 0.85, 0], [1, 0.2, 0.3, -0.05]])
   */
  loft(size: Size, at: Vec3, profile: Array<[number, number, number, number?]>, o?: PartOpts): this {
    return this.part('loft', size, at, o, { profile });
  }

  /** A rounded rod from a to b (legs, handles, branches, poles). */
  rod(a: Vec3, b: Vec3, thick: number, color?: string, o?: PartOpts): this {
    return this.between('capsule', a, b, thick, color, o);
  }
  /** A flat-ended cylinder from a to b. */
  stick(a: Vec3, b: Vec3, thick: number, color?: string, o?: PartOpts): this {
    return this.between('cyl', a, b, thick, color, o);
  }
  private between(shape: Shape, a: Vec3, b: Vec3, thick: number, color?: string, o: PartOpts = {}): this {
    const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
    const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    // rotate y onto d: about z by -atan2(dx, dy') then about x... use yaw/pitch: tilt from y toward d
    const ux = d[0] / len, uy = d[1] / len, uz = d[2] / len;
    const rx = Math.atan2(uz, uy) * (180 / Math.PI);
    const rz = -Math.asin(Math.max(-1, Math.min(1, ux))) * (180 / Math.PI);
    const L = shape === 'capsule' ? len + thick : len;
    return this.part(shape, [thick, L, thick], mid, { ...o, color: color ?? o.color, rot: [rx, 0, rz] });
  }

  /** A card with text printed on its front: size [width, height] (thickness o.depth, default 2 cm). */
  label(text: string, size: [number, number], at: Vec3, o: PartOpts = {}): this {
    const name = o.name ?? `label${this.count++}`;
    this.part('box', [size[0], size[1], o.depth ?? 0.02], at, { round: 0.1, ...o, name });
    const p = this.parts.list[this.parts.list.length - 1];
    p.role = 'label';
    p.text = text;
    return this;
  }

  /** A five-pointed star standing up, facing +z: size = point-to-point diameter. o.rot turns the whole star
   *  (rot [90, 0, 0] lays it flat, face up). */
  star(size: number, at: Vec3, o: PartOpts = {}): this {
    const th = o.round ?? size * 0.12;
    const R = euler(o.rot);
    const place = (local: Vec3, rot: Vec3): [Vec3, Vec3] => {
      const p = apply(R, local);
      return [[at[0] + p[0], at[1] + p[1], at[2] + p[2]], o.rot ? toEuler(mul(R, euler(rot))) : rot];
    };
    const [c, cr] = place([0, 0, 0], [90, 0, 0]);
    this.part('cyl', [size * 0.42, th, size * 0.42], c, { ...o, rot: cr, segs: 5, name: o.name });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r = size * 0.3;
      const [pp, pr] = place([Math.sin(a) * r, Math.cos(a) * r, 0], [0, 0, (-a * 180) / Math.PI]);
      this.part('cyl', [size * 0.24, size * 0.3, th], pp, { ...o, name: undefined, taper: 0, segs: 3, rot: pr });
    }
    return this;
  }

  /** A heart standing up, facing +z: size = width. */
  heart(size: number, at: Vec3, o: PartOpts = {}): this {
    const d = size * 0.3;
    this.pair((s) => this.ball([size * 0.55, size * 0.55, d], [at[0] + s * size * 0.22, at[1] + size * 0.12, at[2]], { ...o, name: undefined }));
    return this.cone([size * 0.78, size * 0.62, d], [at[0], at[1] - size * 0.22, at[2]], { ...o, rot: [180, 0, 0], name: o.name, segs: 4 });
  }

  /** Mirrored pair: fn(1) builds the left (+x) one, fn(-1) the right; use s to flip x positions and turns. */
  pair(fn: (s: 1 | -1) => void): this {
    fn(1);
    fn(-1);
    return this;
  }

  /** Repeat: fn(i) for i = 0..n-1 (rows of buttons, petals around a centre, slats). */
  each(n: number, fn: (i: number) => void): this {
    for (let i = 0; i < n; i++) fn(i);
    return this;
  }

  /**
   * Where other things go: name it ('slot', 'seat', 'top', 'shelf2'), give its spot in figure space and its kind
   * (slot, inside, top, seat, hand, hook, mouth). o.part makes it ride a moving part (a drawer's inside, a
   * toaster's lever carriage); o.size is about the biggest thing that fits; o.yaw turns what sits there.
   */
  socket(name: string, at: Vec3, kind: SocketKind, o: { part?: string; size?: number; yaw?: number } = {}): this {
    let local = at;
    if (o.part) {
      const frames = solve({ key: this.key, view: 'front', rig: 'prop', parts: this.parts.list, heightM: 1, halfW: 1, halfD: 1, group: 'things' });
      const pf = frames.get(o.part);
      if (!pf) throw new Error(`${this.key}: socket ${name} rides on "${o.part}", which is not defined yet`);
      local = apply(transpose(pf.R), [at[0] - pf.T[0], at[1] - pf.T[1], at[2] - pf.T[2]]);
    }
    this.sockets.push({ name, kind, at: local, ...(o.part ? { part: o.part } : {}), ...(o.size !== undefined ? { size: o.size } : {}), ...(o.yaw !== undefined ? { yaw: o.yaw } : {}) });
    return this;
  }

  /** What it does when clicked (see act.ts): { setup?, click: steps, or a list of step lists that alternate }. */
  act(def: ActDef): this {
    this.actDef = normalizeAct(def);
    return this;
  }

  done(): Figure {
    if (!this.parts.list.length) throw new Error(`${this.key}: no parts`);
    const rig = this.opts.rig ?? 'prop';
    const f = figure(this.key, rig === 'prop' ? 'things' : 'animals', rig, this.opts.view ?? 'front', this.parts);
    return {
      ...f,
      ...(this.opts.edge ? { edge: this.opts.edge } : {}),
      ...(this.sockets.length ? { sockets: this.sockets } : {}),
      ...(this.actDef ? { act: this.actDef } : {}),
    };
  }
}

/** Start a model. */
export function m(key: string, opts?: ModelOpts): M {
  return new M(key, opts);
}

/** Points around a circle in the x-z plane (for petals, legs of round tables, spokes): [x, z] pairs. */
export function around(n: number, r: number, start = 0): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}

export { col };


/* ----- the same extras for figures built by kits (who, beast, bird, fish...) ----- */

/** Add sockets to a finished figure; `at` in figure space (with `part`, it rides that part). */
export function withSockets(fig: Figure, list: Array<{ name: string; at: Vec3; kind: SocketKind; part?: string; size?: number; yaw?: number }>): Figure {
  const frames = solve(fig);
  const sockets = list.map((s) => {
    const pf = s.part ? frames.get(s.part) : undefined;
    if (s.part && !pf) throw new Error(`${fig.key}: socket ${s.name} rides on "${s.part}", which it does not have`);
    const at = pf ? apply(transpose(pf.R), [s.at[0] - pf.T[0], s.at[1] - pf.T[1], s.at[2] - pf.T[2]]) : s.at;
    return { ...s, at };
  });
  return { ...fig, sockets: [...(fig.sockets ?? []), ...sockets] };
}

/** Make named parts operable, pieces, or sharp (by name; a name ending in * matches every part starting so). */
export function withParts(fig: Figure, names: string[], o: { mover?: Mover; piece?: boolean; edge?: 'sharp' | 'soft'; blend?: number }): Figure {
  const hit = (n: string) => names.some((w) => (w.endsWith('*') ? n.startsWith(w.slice(0, -1)) : n === w));
  const parts = fig.parts.map((p) => (hit(p.name) ? { ...p, ...o } : p));
  if (!parts.some((p, i) => p !== fig.parts[i])) throw new Error(`${fig.key}: none of ${names.join(', ')} are parts of it`);
  return measure({ ...fig, parts });
}

/** Set a figure's default edge style (sharp for hard man-made things). */
export function withEdge(fig: Figure, edge: 'sharp' | 'soft'): Figure {
  return { ...fig, edge };
}

export { A, withAct } from './act';
