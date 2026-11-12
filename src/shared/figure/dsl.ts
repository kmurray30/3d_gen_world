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
import type { FigPart, Figure, Rig, Shape, Vec3 } from './types';
import { Parts, figure } from './kit';
import { apply, solve, transpose } from './math';

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
}

export type Size = Vec3 | number;
const sz = (s: Size): Vec3 => (typeof s === 'number' ? [s, s, s] : s);

export interface ModelOpts {
  view?: 'front' | 'side';
  rig?: Rig;
}

export class M {
  readonly parts = new Parts();
  private count = 0;
  private readonly abs = new Map<string, Vec3>();

  constructor(
    readonly key: string,
    private readonly opts: ModelOpts = {},
  ) {}

  /** Any solid. Most authors use the shorthands below. */
  part(shape: Shape, size: Size, at: Vec3, o: PartOpts = {}): this {
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

  /** A card with text printed on its front: size [width, height] (thickness 2 cm). */
  label(text: string, size: [number, number], at: Vec3, o: PartOpts = {}): this {
    const name = o.name ?? `label${this.count++}`;
    this.part('box', [size[0], size[1], 0.02], at, { round: 0.1, ...o, name });
    const p = this.parts.list[this.parts.list.length - 1];
    p.role = 'label';
    p.text = text;
    return this;
  }

  /** A five-pointed star standing up, facing +z: size = point-to-point diameter. */
  star(size: number, at: Vec3, o: PartOpts = {}): this {
    const th = o.round ?? size * 0.12;
    this.part('cyl', [size * 0.42, th, size * 0.42], at, { ...o, rot: [90, 0, 0], segs: 5, name: o.name });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r = size * 0.3;
      this.part('cyl', [size * 0.24, size * 0.3, th], [at[0] + Math.sin(a) * r, at[1] + Math.cos(a) * r, at[2]], { ...o, name: undefined, taper: 0, segs: 3, rot: [0, 0, (-a * 180) / Math.PI] });
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

  done(): Figure {
    if (!this.parts.list.length) throw new Error(`${this.key}: no parts`);
    const rig = this.opts.rig ?? 'prop';
    return figure(this.key, rig === 'prop' ? 'things' : 'animals', rig, this.opts.view ?? 'front', this.parts);
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

