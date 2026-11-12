/** Catalog chunk animals-b: the words in assign/animals-b.tsv. */
import { e, type CatalogEntry } from './types';
import { m, type M } from '../dsl';
import { ani, beast, type AniExtra } from '../accessories';
import { bird, figure, Parts, type BirdOpts } from '../kit';
import { bug, fish, snake } from '../creatures';
import { measure } from '../math';
import { col } from '../colors';
import type { FigPart, Figure, Shape, Vec3 } from '../types';

/* ----- local helpers: extra solids on kit figures ----- */

type PO = Partial<FigPart>;
let uid = 0;
const D = Math.PI / 180;
/** Joint rotation turning a y-axis solid onto direction d (the DSL rod convention). */
const aim = (d: Vec3): Vec3 => {
  const n = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  return [Math.atan2(d[2] / n, d[1] / n) / D, 0, -Math.asin(Math.max(-1, Math.min(1, d[0] / n))) / D];
};
/** A solid hung on a kit part; `at` is in that part's frame (body and head frames are level). */
const add = (p: Parts, parent: string | undefined, shape: Shape, size: Vec3, at: Vec3, color: string, o: PO = {}) =>
  p.add({ name: `q${uid++}`, parent, at, shape, size, color: col(color), layer: 2, ...o });
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const sub = (a: Vec3, b: Vec3): Vec3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
/** Rounded rod from a to b in a parent's frame. */
const rodP = (p: Parts, parent: string | undefined, a: Vec3, b: Vec3, t: number, color: string, o: PO = {}) =>
  add(p, parent, 'capsule', [t, Math.hypot(...sub(a, b)) + t, t], mid(a, b), color, { srot: aim(sub(a, b)), ...o });
/** Cone with its base at a and its tip at b. */
const coneP = (p: Parts, parent: string | undefined, a: Vec3, b: Vec3, w: number, color: string, o: PO = {}) =>
  add(p, parent, 'cyl', [w, Math.hypot(...sub(a, b)), w], mid(a, b), color, { taper: 0, srot: aim(sub(a, b)), ...o });
/** Chain of rods through points. */
const chainP = (p: Parts, parent: string | undefined, pts: Vec3[], t: number | number[], color: string | string[], o: PO = {}) => {
  for (let i = 0; i + 1 < pts.length; i++) rodP(p, parent, pts[i], pts[i + 1], Array.isArray(t) ? t[i] : t, Array.isArray(color) ? color[i % color.length] : color, o);
};
/** Edit a finished kit figure: change parts, add parts, then measure again. */
const fx = (f: Figure, fn: (p: Parts, g: (n: string) => FigPart) => void): Figure => {
  const p = new Parts();
  p.list.push(...f.parts.map((q) => ({ ...q })));
  fn(p, (n) => {
    const q = p.list.find((x) => x.name === n);
    if (!q) throw new Error(`${f.key}: no part ${n}`);
    return q;
  });
  return measure({ ...f, parts: p.list });
};
const cut = (p: Parts, ...names: string[]) => {
  for (const n of names) {
    const i = p.list.findIndex((x) => x.name === n);
    if (i >= 0) p.list.splice(i, 1);
  }
};
/** Several kit figures standing together (a pair of pets, a hen and her rooster). */
const herd = (key: string, view: 'front' | 'side', items: Array<[Figure, number, number]>): Figure => {
  const parts: FigPart[] = [];
  items.forEach(([f, dx, dz], i) => {
    for (const q of f.parts) parts.push({ ...q, name: `${q.name}_${i}`, parent: q.parent ? `${q.parent}_${i}` : undefined, at: q.parent ? q.at : [q.at[0] + dx, q.at[1], q.at[2] + dz] });
  });
  return measure({ key, view, rig: 'prop', parts, group: 'animals' });
};
/** Parts in a turned frame (a ray banking up so its back shows). Positions are in the turned frame. */
const turned = (key: string, view: 'front' | 'side', at: Vec3, rot: Vec3, build: (s: (shape: Shape, size: Vec3, pos: Vec3, color: string, o?: PO) => void, r: (a: Vec3, b: Vec3, t: number, color: string, o?: PO) => void) => void): Figure => {
  const p = new Parts();
  p.add({ name: 'body', at, rot, shape: 'ball', size: [0.01, 0.01, 0.01], color: '#000000', scale: 0 });
  build(
    (shape, size, pos, color, o = {}) => void add(p, 'body', shape, size, pos, color, { layer: Math.round(pos[2] * 20), ...o }),
    (a, b, t, color, o = {}) => void rodP(p, 'body', a, b, t, color, { layer: Math.round(mid(a, b)[2] * 20), ...o }),
  );
  return figure(key, 'animals', 'fish', view, p);
};
/** Point on an ellipsoid surface (centre c, half extents h) in direction d, pulled in by k. */
const surf = (c: Vec3, h: Vec3, d: Vec3, k = 1): Vec3 => {
  const t = k / Math.hypot(d[0] / h[0], d[1] / h[1], d[2] / h[2]);
  return [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
};

/* ----- animal extras (beast acc) ----- */

const roundEars = (size: number, color?: string, inner?: string): AniExtra => (p) => {
  for (const [n, s] of [['earL', 1], ['earR', -1]] as const) {
    const q = p.list.find((x) => x.name === n);
    if (!q) continue;
    Object.assign(q, { shape: 'ball', size: [size, size, size * 0.4], off: [0, size * 0.3, 0], rot: [0, 0, -s * 15] });
    if (color) q.color = col(color);
    if (inner) add(p, n, 'ball', [size * 0.62, size * 0.62, size * 0.2], [0, size * 0.3, size * 0.1], inner, { noInk: true, layer: 2 });
  }
};
const catEyes = (color: string): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const [n, s] of [['eyeL', 1], ['eyeR', -1]] as const) {
    const q = p.list.find((x) => x.name === n);
    if (!q) continue;
    q.color = col(color);
    add(p, n, 'ball', [hw * 0.06, hh * 0.19, hl * 0.06], [s * hw * 0.045, 0, hl * 0.045], '#141210', { role: 'eye', layer: 5, noInk: true });
  }
};
const mask = (color: string, k = 1, only?: 1 | -1): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const s of only ? [only] : [1, -1]) add(p, 'head', 'ball', [hw * 0.32 * k, hh * 0.38 * k, hl * 0.26 * k], [s * hw * 0.32, hh * 0.27, hl * 0.28], color, { layer: 3, noInk: true });
};
/** A band of colour over the eyes (raccoon). */
const bandit = (color: string): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  add(p, 'head', 'ball', [hw * 1.03, hh * 0.32, hl * 0.62], [0, hh * 0.25, hl * 0.16], color, { layer: 3, noInk: true });
};
const blaze = (color: string): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  add(p, 'head', 'ball', [hw * 0.24, hh * 0.5, hl * 0.62], [0, hh * 0.36, hl * 0.3], color, { layer: 4, noInk: true });
};
const tuft = (color: string, k = 1): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  add(p, 'head', 'ball', [hw * 0.8 * k, hh * 0.5 * k, hl * 0.5 * k], [0, hh * 0.62, -hl * 0.02], color);
};
const bow = (color: string): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const s of [1, -1]) add(p, 'head', 'ball', [hw * 0.3, hh * 0.22, hl * 0.14], [s * hw * 0.15, hh * 0.78, hl * 0.02], color, { srot: [0, 0, s * 20] });
  add(p, 'head', 'ball', [hw * 0.12, hh * 0.12, hl * 0.12], [0, hh * 0.78, hl * 0.04], color);
};
/** Long hair hanging round the body (maltese, shih tzu, yorkie). */
const coat = (color: string, k = 1): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  add(p, 'body', 'ball', [W * 1.22, H * 1.15 * k, L * 1.06], [0, -H * 0.2 * k, 0], color, { layer: 1 });
};
const saddle = (color: string, y = 0.28, k = 1): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  add(p, 'body', 'ball', [W * 0.92 * k, H * 0.6, L * 0.7 * k], [0, H * y, -L * 0.04], color, { noInk: true, layer: 3 });
};
const hump = (color: string, k = 1, z = 0.25): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  add(p, 'body', 'ball', [W * 0.78, H * 0.62 * k, L * 0.38], [0, H * 0.38, L * z], color);
};
/** Ball on the chest (a ruff, a bib, a chest patch). */
const chest = (color: string, k = 1, y = 0.05): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  add(p, 'body', 'ball', [W * 0.9 * k, H * 0.85 * k, L * 0.3 * k], [0, H * y, L * 0.4], color, { layer: 3 });
};
const collar = (color: string, nl: number, nw: number, tag?: string): AniExtra => (p) => {
  add(p, 'neck', 'torus', [nw * 1.3, nw * 1.3, nw * 0.36], [0, nl * 0.3, 0], color, { srot: [90, 0, 0], tube: 0.32, layer: 3 });
  if (tag) add(p, 'neck', 'ball', [nw * 0.3, nw * 0.3, nw * 0.12], [0, nl * 0.3 - nw * 0.1, nw * 0.68], tag, { layer: 4 });
};
const tailTip = (color: string, kind: 'long' | 'fluffy' | 'stub'): AniExtra => (p, d) => {
  const [L, , W] = d.body;
  if (kind === 'stub') add(p, 'tail', 'ball', [W * 0.2, W * 0.18, W * 0.2], [0, W * 0.24, 0], color, { layer: -1 });
  else if (kind === 'long') add(p, 'tail', 'ball', [W * 0.17, L * 0.1, W * 0.17], [0, L * 0.49, 0], color, { layer: -1 });
  else add(p, 'tail', 'ball', [W * 0.28, L * 0.14, W * 0.28], [0, L * 0.42, 0], color, { layer: -1 });
};
/** Rings round a 'long' or 'fluffy' tail. */
const tailRings = (color: string, n: number, kind: 'long' | 'fluffy'): AniExtra => (p, d) => {
  const [L, , W] = d.body;
  const dia = kind === 'fluffy' ? W * 0.31 : W * 0.14;
  const span = kind === 'fluffy' ? 0.44 : 0.5;
  for (let i = 0; i < n; i++) add(p, 'tail', 'torus', [dia, dia, L * 0.05], [0, L * (0.06 + (span * (i + 0.6)) / (n + 0.4)), 0], color, { srot: [90, 0, 0], tube: 0.45, noInk: true, layer: 0 });
};
/** A tail of rods through points (body frame: the body centre is the origin). */
const ropeTail = (color: string, t: number | number[], pts: Vec3[]): AniExtra => (p) => chainP(p, 'body', pts, t, color, { layer: -1 });
/** Tapering tail cone from the rump back to the ground (lizards, otters, salamanders). */
const coneTail = (len: number, w: number, color: string, drop: number): AniExtra => (p, d) => {
  const [L, H] = d.body;
  coneP(p, 'body', [0, -H * 0.05, -L * 0.36], [0, -H * 0.05 - drop, -L * 0.36 - len], w, color, { layer: -1 });
};
/** Ringed tail curling up over the back in a question mark (lemur, red panda). */
const curlTail = (n: number, len: number, t: number, c1: string, c2: string, start = 70, bend = -9): AniExtra => (p, d) => {
  const [L, H] = d.body;
  let pt: Vec3 = [0, H * 0.2, -L * 0.46];
  let a = start;
  for (let i = 0; i < n; i++) {
    const nx: Vec3 = [0, pt[1] + Math.cos(a * D) * len, pt[2] - Math.sin(a * D) * len];
    rodP(p, 'body', pt, nx, t * (1 - i * 0.02), i % 2 ? c2 : c1, { layer: -1 });
    pt = nx;
    a += bend;
  }
};
const ridge = (color: string, n: number, h: number, from = 0.35, to = -0.4, y = 0.46): AniExtra => (p, d) => {
  const [L, H] = d.body;
  for (let i = 0; i < n; i++) add(p, 'body', 'cyl', [h * 0.45, h, h * 0.6], [0, H * y + h * 0.3, L * (from + ((to - from) * i) / Math.max(1, n - 1))], color, { taper: 0, segs: 4 });
};
const teeth = (color: string, sn: { len: number; h: number; w: number }, down = 1, long = 1): AniExtra => (p, d) => {
  const [hl, hh] = d.head;
  for (const s of [1, -1]) {
    const top: Vec3 = [s * sn.w * 0.16, -hh * 0.12 - sn.h * 0.3, hl * 0.35 + sn.len * 0.66];
    coneP(p, 'head', top, [top[0], top[1] - sn.h * 0.75 * long * down, top[2] + sn.len * 0.05], sn.w * 0.13 * long, color, { layer: 4 });
  }
};
const buckTeeth = (color: string, sn: { len: number; h: number; w: number }): AniExtra => (p, d) => {
  const [hl, hh] = d.head;
  for (const s of [1, -1]) add(p, 'head', 'box', [sn.w * 0.17, sn.h * 0.55, sn.len * 0.12], [s * sn.w * 0.1, -hh * 0.12 - sn.h * 0.42, hl * 0.35 + sn.len * 0.72], color, { round: 0.3, layer: 4 });
};
/** Branching deer antlers; k scales them. */
const antlers = (color: string, k: number, spread = 1): AniExtra => (p, d) => {
  const [hl, hh] = d.head;
  for (const s of [1, -1]) {
    const b: Vec3[] = [[s * 0.05 * k, hh * 0.45, -hl * 0.1], [s * 0.2 * k * spread, hh * 0.45 + 0.28 * k, -hl * 0.1 - 0.12 * k], [s * 0.3 * k * spread, hh * 0.45 + 0.6 * k, -hl * 0.1 - 0.06 * k], [s * 0.26 * k * spread, hh * 0.45 + 0.85 * k, -hl * 0.1 + 0.1 * k]];
    chainP(p, 'head', b, [0.06 * k, 0.05 * k, 0.04 * k], color);
    rodP(p, 'head', [s * 0.1 * k, hh * 0.45 + 0.1 * k, -hl * 0.12], [s * 0.12 * k, hh * 0.45 + 0.2 * k, hl * 0.1 + 0.15 * k], 0.04 * k, color);
    rodP(p, 'head', b[1], [s * 0.26 * k * spread, b[1][1] + 0.2 * k, b[1][2] + 0.16 * k], 0.035 * k, color);
    rodP(p, 'head', b[2], [s * 0.4 * k * spread, b[2][1] + 0.18 * k, b[2][2] + 0.1 * k], 0.03 * k, color);
    rodP(p, 'head', b[2], [s * 0.22 * k * spread, b[2][1] + 0.2 * k, b[2][2] - 0.05 * k], 0.03 * k, color);
  }
};
const palmAntlers = (color: string, k: number): AniExtra => (p, d) => {
  const [hl, hh] = d.head;
  for (const s of [1, -1]) {
    rodP(p, 'head', [s * 0.08 * k, hh * 0.45, -hl * 0.08], [s * 0.32 * k, hh * 0.62, -hl * 0.1], 0.08 * k, color);
    add(p, 'head', 'ball', [0.6 * k, 0.07 * k, 0.4 * k], [s * 0.58 * k, hh * 0.72, -hl * 0.08], color, { srot: [0, 0, s * 20] });
    for (let i = 0; i < 4; i++) add(p, 'head', 'cyl', [0.06 * k, 0.17 * k, 0.06 * k], [s * (0.42 + i * 0.12) * k, hh * 0.72 + (0.06 + i * 0.045) * k, (-0.12 + i * 0.04) * k], color, { taper: 0, srot: [0, 0, -s * 12] });
  }
};

const brows = (color: string, k = 1): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const s of [1, -1]) add(p, 'head', 'box', [hw * 0.3 * k, hh * 0.12 * k, hl * 0.22], [s * hw * 0.24, hh * 0.47, hl * 0.32], color, { round: 0.6, srot: [0, 0, -s * 12], layer: 4 });
};
const cheeks = (color: string, k = 1): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const s of [1, -1]) add(p, 'head', 'ball', [hw * 0.34 * k, hh * 0.32 * k, hl * 0.32 * k], [s * hw * 0.3, -hh * 0.06, hl * 0.32], color, { layer: 3, noInk: true });
};
/** Long horns curving out and up (cattle, yak). */
const bullHorns = (color: string, k = 1): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const s of [1, -1]) chainP(p, 'head', [[s * hw * 0.3, hh * 0.45, -hl * 0.05], [s * hw * (0.3 + 0.5 * k), hh * (0.5 + 0.1 * k), -hl * 0.05], [s * hw * (0.3 + 0.7 * k), hh * (0.5 + 0.6 * k), hl * 0.02]], [hw * 0.16, hw * 0.11], color, { layer: 1 });
};

/* ----- kits on top of the kits ----- */

type Tail = 'long' | 'curl' | 'tuft' | 'stub' | 'fluffy';
type Ears = 'floppy' | 'pointy' | 'long' | 'side';
interface DogO {
  s: number; color: string; legK?: number; bodyK?: number; headK?: number; snoutK?: number; fat?: number;
  snout?: string; snoutShape?: 'ball' | 'box' | 'cyl'; ears?: Ears; earK?: number; earColor?: string;
  tail?: Tail; tailColor?: string; tailAngle?: number; belly?: string; legColor?: string; headColor?: string;
  hoof?: string; hoofH?: number; nose?: string; acc?: AniExtra[];
}
/** A dog about 0.7 m tall at s = 1. */
const dog = (key: string, o: DogO) => {
  const s = o.s, f = o.fat ?? 1, hk = o.headK ?? 1;
  return beast(key, {
    color: o.color, body: [0.72 * s * (o.bodyK ?? 1), 0.3 * s * f, 0.26 * s * f], legL: 0.3 * s * (o.legK ?? 1), legW: 0.075 * s * f,
    hoof: o.hoof, hoofH: o.hoofH, neckL: 0.13 * s, neckLean: 35, neckW: 0.15 * s * f,
    head: [0.24 * s * hk, 0.21 * s * hk, 0.2 * s * hk], snout: { len: 0.13 * s * hk * (o.snoutK ?? 1), h: 0.1 * s * hk, w: 0.11 * s * hk, color: o.snout, shape: o.snoutShape },
    nose: o.nose ?? '#231f1d', ears: o.ears ?? 'floppy', earSize: 0.13 * s * hk * (o.earK ?? 1), earColor: o.earColor,
    tail: o.tail ?? 'long', tailColor: o.tailColor, tailAngle: o.tailAngle ?? 120, belly: o.belly, legColor: o.legColor, headColor: o.headColor, acc: o.acc,
  });
};
const dogCollar = (s: number, color: string, tag?: string, fat = 1) => collar(color, 0.13 * s, 0.15 * s * fat, tag);

/** A bear on all fours, about 1.5 m tall at s = 1. */
const bear = (key: string, s: number, color: string, o: { hk?: number; snout?: string; legColor?: string; acc?: AniExtra[] } = {}) => {
  const hk = o.hk ?? 1;
  return beast(key, {
    color, body: [2.0 * s, 0.95 * s, 0.8 * s], legL: 0.55 * s, legW: 0.26 * s, legColor: o.legColor, neckL: 0.32 * s, neckLean: 62, neckW: 0.45 * s,
    head: [0.5 * s * hk, 0.42 * s * hk, 0.46 * s * hk], snout: { len: 0.22 * s * hk, h: 0.18 * s * hk, w: 0.2 * s * hk, color: o.snout }, nose: '#1e1c1c',
    ears: 'pointy', earSize: 0.13 * s * hk, tail: 'stub', acc: [roundEars(0.14 * s * hk), hump(color, 0.45, 0.28), ...(o.acc ?? [])],
  });
};
const panda = (key: string, s: number, hk: number) =>
  beast(key, {
    color: '#f4f2ec', legColor: '#1f1f22', bodyShape: 'ball', body: [1.2 * s, 0.75 * s, 0.75 * s], legL: 0.28 * s, legW: 0.22 * s, neckL: 0.08 * s, neckLean: 60, neckW: 0.4 * s,
    head: [0.5 * s * hk, 0.44 * s * hk, 0.5 * s * hk], snout: { len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.2 * s * hk, color: '#f4f2ec' }, nose: '#1f1f22',
    ears: 'pointy', earSize: 0.17 * s * hk, earColor: '#1f1f22', tail: 'stub',
    acc: [roundEars(0.17 * s * hk), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.04, H * 1.04, L * 0.4], [0, H * 0.02, L * 0.22], '#1f1f22', { layer: 3 });
      const [hl, hh, hw] = d.head;
      for (const k of [1, -1]) add(p, 'head', 'ball', [hw * 0.3, hh * 0.42, hl * 0.26], [k * hw * 0.3, hh * 0.24, hl * 0.3], '#1f1f22', { srot: [0, 0, -k * 35], layer: 3, noInk: true });
    }],
  });

interface CatO {
  s: number; color: string; hk?: number; legK?: number; bodyK?: number; fat?: number; earK?: number; belly?: string; snout?: string; nose?: string;
  tail?: Tail; tailAngle?: number; tailColor?: string; eyes?: string; headColor?: string; legColor?: string; acc?: AniExtra[];
}
/** A cat about 1.2 m tall at s = 1 (a lion); house cats are s 0.2. */
const feline = (key: string, o: CatO) => {
  const s = o.s, hk = o.hk ?? 1, f = o.fat ?? 1;
  return beast(key, {
    color: o.color, body: [1.5 * s * (o.bodyK ?? 1), 0.55 * s * f, 0.48 * s * f], legL: 0.55 * s * (o.legK ?? 1), legW: 0.15 * s * f,
    neckL: 0.16 * s, neckLean: 50, neckW: 0.3 * s * f, head: [0.42 * s * hk, 0.38 * s * hk, 0.42 * s * hk],
    snout: { len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.24 * s * hk, color: o.snout }, nose: o.nose ?? '#b5655a',
    ears: 'pointy', earSize: 0.11 * s * hk * (o.earK ?? 1), tail: o.tail ?? 'long', tailAngle: o.tailAngle ?? 125, tailColor: o.tailColor,
    belly: o.belly, headColor: o.headColor, legColor: o.legColor, acc: [catEyes(o.eyes ?? '#d9a520'), ...(o.acc ?? [])],
  });
};

interface HorseO { s: number; color: string; mane: string; hoof?: string; snout?: string; legK?: number; hk?: number; legColor?: string; headColor?: string; tuft?: boolean; acc?: AniExtra[] }
/** A horse about 1.9 m to the ears at s = 1. */
const horse = (key: string, o: HorseO) => {
  const s = o.s, hk = o.hk ?? 1.15;
  return beast(key, {
    color: o.color, body: [1.55 * s, 0.68 * s, 0.55 * s], legL: 0.8 * s * (o.legK ?? 1), legW: 0.12 * s, hoof: o.hoof ?? '#3a2c22', hoofH: 0.1 * s,
    neckL: 0.6 * s, neckLean: 32, neckW: 0.3 * s, head: [0.55 * s * hk, 0.27 * s * hk, 0.24 * s * hk],
    snout: { len: 0.22 * s * hk, h: 0.2 * s * hk, w: 0.2 * s * hk, color: o.snout }, nose: '#2a2220', ears: 'pointy', earSize: 0.14 * s * hk,
    tail: o.tuft ? 'tuft' : 'long', tailColor: o.tuft ? undefined : o.mane, tailAngle: 155, legColor: o.legColor, headColor: o.headColor,
    acc: [ani.mane(o.mane), ...(o.acc ?? [])],
  });
};

const wolf = (key: string, s: number, hk: number, color: string, light: string, back: string) =>
  beast(key, {
    color, belly: light, body: [1.0 * s * (hk > 1 ? 0.75 : 1), 0.38 * s, 0.32 * s], legL: 0.48 * s * (hk > 1 ? 0.7 : 1), legW: 0.09 * s, neckL: 0.18 * s, neckLean: 40, neckW: 0.24 * s,
    head: [0.3 * s * hk, 0.24 * s * hk, 0.24 * s * hk], snout: { len: 0.2 * s * hk * (hk > 1 ? 0.65 : 1), h: 0.11 * s * hk, w: 0.12 * s * hk, color: light }, nose: '#1e1c1c',
    ears: 'pointy', earSize: 0.12 * s * hk, tail: 'fluffy', tailAngle: 145, acc: [catEyes('#d8a830'), saddle(back, 0.3), cheeks(light)],
  });
const zebra = (key: string, s: number, hk: number, legK: number, stripe: string) =>
  horse(key, { s, hk, legK, color: '#f4f2ee', mane: '#1e1e1e', snout: '#2a2626', tuft: true, acc: [ani.stripes(stripe, 8), (p) => {
    const nl = 0.6 * s, nw = 0.3 * s, len = 0.8 * s * legK + 0.68 * s * 0.3, lw = 0.12 * s;
    for (let i = 0; i < 4; i++) add(p, 'neck', 'torus', [nw * 1.04, nw * 1.04, 0.05 * s], [0, nl * (0.08 + 0.24 * i), 0], stripe, { srot: [90, 0, 0], tube: 0.14, noInk: true, layer: 3 });
    for (const l of ['legFL', 'legFR', 'legBL', 'legBR']) for (let j = 0; j < 3; j++) add(p, l, 'torus', [lw * 1.06, lw * 1.06, 0.035 * s], [0, -len * (0.25 + 0.16 * j), 0], stripe, { srot: [90, 0, 0], tube: 0.2, noInk: true, layer: 3 });
    const q = p.list.find((x) => x.name.startsWith('ani_neck'));
    if (q) q.size = [q.size[0], q.size[1], q.size[2] * 1.4];
  }] });
const tigerAcc = (s: number): AniExtra[] => [ani.stripes('#1e1a18', 7), tailRings('#1e1a18', 4, 'long'), tailTip('#1e1a18', 'long'), cheeks('#f6efe2', 1.1), (p, d) => {
  const [hl, hh, hw] = d.head;
  for (const x of [-0.18, 0, 0.18]) add(p, 'head', 'capsule', [hw * 0.07, hh * 0.3, hl * 0.06], [x * hw, hh * 0.45, hl * 0.26], '#1e1a18', { srot: [-30, 0, 0], noInk: true, layer: 4 });
  void s;
}];

/** Tortoise or turtle with a domed shell and scutes, about 0.16 m tall at s = 1. */
const turtle = (key: string, s: number, shell: string, skin: string, scute: string, hk = 1, extra: AniExtra[] = []) =>
  beast(key, {
    color: skin, body: [0.3 * s, 0.1 * s, 0.22 * s], legL: 0.04 * s, legW: 0.06 * s, neckL: 0.05 * s, neckLean: 60, neckW: 0.05 * s,
    head: [0.08 * s * hk, 0.065 * s * hk, 0.07 * s * hk], snout: { len: 0.02 * s * hk, h: 0.035 * s * hk, w: 0.045 * s * hk }, nose: '#2a2a1e',
    ears: 'side', earSize: 0.003 * s, tail: 'stub',
    acc: [ani.shell(shell), (p, d) => {
      const [L, H, W] = d.body;
      for (const dir of [[0, 1, 0], [0.7, 0.8, 0.45], [-0.7, 0.8, 0.45], [0.7, 0.8, -0.45], [-0.7, 0.8, -0.45], [0, 0.8, 0.7], [0, 0.8, -0.7]] as Vec3[])
        add(p, 'body', 'ball', [W * 0.32, H * 0.3, L * 0.26], surf([0, H * 0.25, 0], [W * 0.625, H * 0.55, L * 0.55], dir, 0.93), scute, { noInk: true, layer: 4 });
    }, ...extra],
  });

/** Bird kit plus edits. Bird dims: legs 0.28 H, body 0.42 H tall, head frame level with its centre 0.12 H up. */
const birdx = (key: string, o: BirdOpts, fn?: (p: Parts, g: (n: string) => FigPart, H: number) => void) => fx(bird(key, o), (p, g) => fn?.(p, g, o.height));
const bBelly = (p: Parts, H: number, color: string, k = 1) => add(p, 'body', 'ball', [H * 0.38 * k, H * 0.32 * k, H * 0.36 * k], [0, -H * 0.05, H * 0.1], color, { layer: 1, noInk: true });
const bTail = (g: (n: string) => FigPart, H: number, k: number, n: number) => {
  for (let i = 0; i < n; i++) {
    const f = g(`feather${i}`);
    f.size = [f.size[0], H * 0.4 * k, f.size[2]];
    f.off = [0, H * 0.2 * k, 0];
  }
};
const bLegs = (g: (n: string) => FigPart, H: number, k: number) => {
  const legL = H * 0.28, dl = legL * (k - 1);
  const b = g('body');
  b.at = [b.at[0], b.at[1] + dl, b.at[2]];
  for (const s of ['L', 'R']) {
    const l = g('leg' + s);
    l.size = [l.size[0], l.size[1] + dl, l.size[2]];
    l.off = [0, -legL * k * 0.5, 0];
    g('toes' + s).at = [0, -legL * k, 0];
  }
};
const bHook = (p: Parts, g: (n: string) => FigPart, H: number, k = 1, color?: string) => {
  const b = g('beak');
  b.rot = [128, 0, 0];
  b.size = [H * 0.08 * k, H * 0.12 * k, H * 0.09 * k];
  b.at = [0, H * 0.12, H * 0.11];
  add(p, 'head', 'ball', [H * 0.085 * k, H * 0.09 * k, H * 0.09 * k], [0, H * 0.115, H * 0.12], color ?? b.color, { layer: 3 });
};

/** Owl from the front, s = 1 is 0.75 m. */
const owl = (key: string, s: number, c: { body: string; wing: string; face: string; chest: string; spots?: string }, tufts: boolean, eyeK = 1) => {
  const t = m(key, { view: 'front', rig: 'bird' });
  t.ball([0.34 * s, 0.42 * s, 0.3 * s], [0, 0.23 * s, 0], { color: c.body, name: 'body' })
    .ball([0.26 * s, 0.3 * s, 0.12 * s], [0, 0.21 * s, 0.1 * s], { color: c.chest, parent: 'body', noInk: true })
    .ball([0.35 * s, 0.31 * s, 0.28 * s], [0, 0.51 * s, 0.01 * s], { color: c.body, name: 'head', parent: 'body', pivot: [0, 0.42 * s, 0] })
    .cone([0.045 * s, 0.075 * s, 0.045 * s], [0, 0.47 * s, 0.165 * s], { color: '#4a3a2a', rot: [160, 0, 0], parent: 'head' });
  t.pair((k) => {
    t.ball([0.16 * s, 0.19 * s, 0.07 * s], [k * 0.075 * s, 0.505 * s, 0.12 * s], { color: c.face, parent: 'head' })
      .ball([0.095 * s * eyeK, 0.095 * s * eyeK, 0.04 * s], [k * 0.075 * s, 0.52 * s, 0.155 * s], { color: '#f2b62a', parent: 'head', noInk: true })
      .ball([0.055 * s * eyeK, 0.055 * s * eyeK, 0.03 * s], [k * 0.075 * s, 0.52 * s, 0.172 * s], { color: '#141210', parent: 'head', eye: true, noInk: true })
      .ball([0.015 * s * eyeK, 0.015 * s * eyeK, 0.01 * s], [k * 0.068 * s, 0.53 * s, 0.186 * s], { color: '#ffffff', parent: 'head', eye: true, noInk: true })
      .ball([0.09 * s, 0.34 * s, 0.24 * s], [k * 0.175 * s, 0.24 * s, -0.01 * s], { color: c.wing, name: k > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [k * 0.15 * s, 0.38 * s, 0] })
      .ball([0.07 * s, 0.035 * s, 0.09 * s], [k * 0.07 * s, 0.018 * s, 0.08 * s], { color: '#e8b830', parent: 'body' });
    if (tufts) t.cone([0.08 * s, 0.14 * s, 0.05 * s], [k * 0.12 * s, 0.68 * s, 0], { color: c.body, rot: [0, 0, -k * 24], parent: 'head' });
    if (c.spots) t.each(3, (i) => t.ball([0.03 * s, 0.022 * s, 0.02 * s], [k * (0.04 + (i % 2) * 0.03) * s, (0.3 - i * 0.07) * s, 0.155 * s], { color: c.spots!, parent: 'body', noInk: true }));
  });
  return t.done();
};

/** Whale or dolphin in profile, swimming toward +z, resting on the ground line. */
interface WhaleO { L: number; hk?: number; color: string; belly?: string; head?: 'round' | 'box' | 'beak'; dorsal?: 'tall' | 'fin' | 'hump' | 'none'; fluke?: string }
const whale = (key: string, o: WhaleO, more?: (t: M, d: { L: number; H: number; y: number }) => void) => {
  const L = o.L, H = L * (o.hk ?? 0.24), y = H * 0.55, c = o.color, head = o.head ?? 'round';
  const t = m(key, { view: 'side' });
  t.ball([H * 0.92, H, L * 0.62], [0, y, L * 0.08], { color: c })
    .ball([H * 0.62, H * 0.64, L * 0.46], [0, y + H * 0.04, -L * 0.26], { color: c })
    .ball([H * 0.3, H * 0.32, L * 0.24], [0, y + H * 0.08, -L * 0.44], { color: c })
    .pair((s) => t.ball([L * 0.16, H * 0.07, L * 0.09], [s * L * 0.075, y + H * 0.1, -L * 0.56], { color: o.fluke ?? c, rot: [0, s * 32, 0] }));
  if (o.belly) t.ball([H * 0.78, H * 0.55, L * 0.55], [0, y - H * 0.22, L * 0.1], { color: o.belly, noInk: true });
  if (head === 'box')
    t.box([H * 0.86, H * 0.84, L * 0.38], [0, y + H * 0.07, L * 0.25], { color: c, round: 0.8 }).rod([0, y - H * 0.4, L * 0.4], [0, y - H * 0.36, L * 0.14], H * 0.14, o.belly ?? c);
  if (head === 'beak')
    t.ball([H * 0.7, H * 0.72, L * 0.24], [0, y + H * 0.1, L * 0.3], { color: c }).rod([0, y - H * 0.1, L * 0.4], [0, y - H * 0.13, L * 0.52], H * 0.26, c);
  const ez = head === 'box' ? L * 0.16 : head === 'beak' ? L * 0.36 : L * 0.3;
  const ey = head === 'box' ? y - H * 0.16 : y - H * 0.04;
  t.pair((s) =>
    t.ball(H * 0.09, [s * H * (head === 'box' ? 0.43 : 0.36), ey, ez], { color: '#141414', eye: true, noInk: true })
      .ball([H * 0.06, H * 0.2, L * 0.15], [s * H * 0.42, y - H * 0.34, L * 0.17], { color: c, rot: [-35, s * 25, 0] }),
  );
  const dz = -L * 0.06;
  if (o.dorsal === 'tall') t.cone([L * 0.035, H * 0.8, L * 0.11], [0, y + H * 0.8, dz], { color: c, rot: [-8, 0, 0] });
  if (o.dorsal === 'fin') t.cone([L * 0.03, H * 0.38, L * 0.1], [0, y + H * 0.55, -L * 0.12], { color: c, rot: [-35, 0, 0] });
  if (o.dorsal === 'hump') t.ball([H * 0.22, H * 0.16, L * 0.1], [0, y + H * 0.4, -L * 0.2], { color: c });
  more?.(t, { L, H, y });
  return t.done();
};

/* ----- entries ----- */

export const ENTRIES: CatalogEntry[] = [
  e('ladybug', 'bugs', 'beetles', () => {
    const t = m('ladybug', { view: 'side' });
    const c: Vec3 = [0, 0.024, -0.004], h: Vec3 = [0.03, 0.021, 0.034];
    t.each(3, (i) => t.pair((s) => t.rod([s * 0.012, 0.012, 0.012 - i * 0.012], [s * 0.034, 0.002, 0.018 - i * 0.018], 0.005, '#1e1c1c')));
    t.ball([0.06, 0.042, 0.068], c, { color: '#d8231f' })
      .ball([0.003, 0.0436, 0.0685], c, { color: '#1e1c1c', noInk: true })
      .ball([0.034, 0.024, 0.022], [0, 0.019, 0.032], { color: '#1e1c1c' })
      .pair((s) => {
        t.ball([0.01, 0.007, 0.006], [s * 0.009, 0.025, 0.041], { color: '#f7f5ef', noInk: true }).rod([s * 0.006, 0.028, 0.04], [s * 0.014, 0.036, 0.052], 0.003, '#1e1c1c');
        for (const d of [[0.55, 1, 0.6], [0.9, 0.7, -0.15], [0.45, 1, -0.75]] as Vec3[]) t.ball(0.012, surf(c, h, [s * d[0], d[1], d[2]], 0.93), { color: '#1e1c1c', noInk: true });
      });
    return t.done();
  }),
  e('lamb (animal)', 'farm', 'sheep', () =>
    beast('lamb (animal)', { color: '#f4efe4', bodyShape: 'ball', body: [0.6, 0.38, 0.38], legL: 0.25, legW: 0.065, hoof: '#4a3c36', hoofH: 0.05, legColor: '#f1e4da', neckL: 0.1, neckLean: 30, neckW: 0.14, head: [0.22, 0.18, 0.16], headColor: '#f6e6dc', snout: { len: 0.08, h: 0.1, w: 0.1, color: '#f2d6cc' }, nose: '#b88080', ears: 'side', earSize: 0.11, earColor: '#f0c8c0', tail: 'stub', acc: [tuft('#f4efe4', 1.1)] }),
  ),
  e('larvae', 'bugs', 'grubs and worms', () => {
    const t = m('larvae', { view: 'side' });
    const grub = (x: number, z: number, r: number, T: number, yaw: number) => {
      const cy = 0.5 * r + T / 2;
      [210, 165, 120, 75, 30, -15].forEach((a, i) => {
        const k = r * Math.cos(a * D);
        t.ball(T * [0.8, 0.95, 1.05, 1.05, 1, 0.9][i], [x + Math.sin(yaw * D) * k, cy + r * Math.sin(a * D), z + Math.cos(yaw * D) * k], { color: '#f2e8cc' });
      });
      const k = r * Math.cos(-45 * D);
      t.ball(T * 0.72, [x + Math.sin(yaw * D) * k, cy + r * Math.sin(-45 * D), z + Math.cos(yaw * D) * k], { color: '#b0622a' });
    };
    grub(0, 0, 0.02, 0.019, 0);
    grub(0.05, -0.03, 0.016, 0.016, 40);
    grub(-0.05, 0.01, 0.017, 0.017, -35);
    return t.done();
  }),
  e('leech', 'bugs', 'grubs and worms', () => fx(snake('leech', { length: 0.18, color: '#3a3a26', bands: '#55502e', girth: 0.1 }), (p) => cut(p, 'tongue'))),
  e('lemming', 'wild', 'polar', () =>
    beast('lemming', { color: '#c48a4a', bodyShape: 'ball', body: [0.12, 0.075, 0.08], legL: 0.012, legW: 0.016, neckL: 0.006, neckLean: 60, neckW: 0.04, head: [0.05, 0.045, 0.05], headColor: '#3a2e28', snout: { len: 0.016, h: 0.024, w: 0.026, color: '#4a3a30' }, nose: '#e09a9a', ears: 'pointy', earSize: 0.014, tail: 'stub', belly: '#e8d0a8', acc: [roundEars(0.016), saddle('#3a2e28')] }),
  ),
  e('lemur', 'wild', 'jungle', () =>
    beast('lemur', { color: '#a19c97', belly: '#f0eeea', body: [0.42, 0.17, 0.16], legL: 0.2, legW: 0.045, neckL: 0.06, neckLean: 40, neckW: 0.07, head: [0.11, 0.1, 0.1], headColor: '#f0eeea', snout: { len: 0.07, h: 0.045, w: 0.05, color: '#2a2725' }, ears: 'pointy', earSize: 0.05, earColor: '#a19c97', tail: 'stub', tailColor: '#a19c97', acc: [mask('#2a2725', 1.2), catEyes('#e8901e'), curlTail(12, 0.045, 0.035, '#f0eeea', '#2a2725')] }),
  ),
  e('lice', 'bugs', 'crawling insects', () => {
    const louse = (L: number) =>
      bug('lice', { length: L, color: '#c9a77a', wings: 'none', segments: 3, extras: (p) => {
        const a = p.list.find((x) => x.name === 'abdomen')!;
        a.size = [L * 0.46, L * 0.22, L * 0.5];
      } });
    return herd('lice', 'side', [[louse(0.07), 0, 0], [louse(0.05), 0.065, -0.05]]);
  }),
  e('lion', 'wild', 'savanna', () => feline('lion', { s: 1, color: '#d9a55a', belly: '#ecd3a0', snout: '#f0dcb4', tail: 'tuft', acc: [ani.mane('#8a4f24'), (p, d) => void add(p, 'head', 'ball', [d.head[2] * 2.3, d.head[1] * 2.2, d.head[0] * 1.0], [0, d.head[1] * 0.1, -d.head[0] * 0.14], '#8a4f24', { layer: -1 })] })),
  e('lion cub', 'wild', 'savanna', () => feline('lion cub', { s: 0.45, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#dcb47a', belly: '#f0dcb8', snout: '#f2e2c4', tail: 'tuft', acc: [ani.spots('#c49a5c', 6)] })),
  e('lioness', 'wild', 'savanna', () => feline('lioness', { s: 0.92, color: '#d6a663', belly: '#efdcb4', snout: '#f2e2c4', tail: 'tuft' })),
  e('lizard', 'wild', 'reptiles', () =>
    beast('lizard', { color: '#5f9e3a', belly: '#b8d878', body: [0.3, 0.085, 0.11], legL: 0.03, legW: 0.032, legColor: '#4f8a30', neckL: 0.025, neckLean: 70, neckW: 0.06, head: [0.09, 0.055, 0.065], snout: { len: 0.035, h: 0.035, w: 0.045, color: '#6aaa42' }, nose: '#3a5a2a', ears: 'side', earSize: 0.012, tail: 'stub', acc: [coneTail(0.42, 0.07, '#5f9e3a', 0.05), ridge('#d8c84a', 6, 0.03), (p, d) => void add(p, 'head', 'ball', [0.012, 0.04, 0.045], [0, -d.head[1] * 0.45, d.head[0] * 0.25], '#c8b84a')] }),
  ),
  e('llama', 'farm', 'farm animals', () =>
    beast('llama', { color: '#efe4cf', body: [0.95, 0.5, 0.42], legL: 0.55, legW: 0.1, hoof: '#5a4a3a', hoofH: 0.06, neckL: 0.6, neckLean: 8, neckW: 0.2, head: [0.3, 0.2, 0.18], snout: { len: 0.12, h: 0.12, w: 0.12, color: '#e3d3b8' }, nose: '#4a3a30', ears: 'long', earSize: 0.15, tail: 'fluffy', tailAngle: 60, acc: [tuft('#efe4cf'), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.08, H * 0.9, L * 0.38], [0, H * 0.1, L * 0.02], '#c8322e', { layer: 3 });
      add(p, 'body', 'ball', [W * 1.1, H * 0.92, L * 0.08], [0, H * 0.1, L * 0.02], '#f2c230', { layer: 4 });
    }] }),
  ),
  e('lobster', 'sea', 'shellfish', () => {
    const t = m('lobster', { view: 'side' });
    const r = '#c8372d', d = '#9e2a22';
    t.each(4, (i) => t.pair((s) => t.rod([s * 0.025, 0.035, 0.05 - i * 0.022], [s * 0.06, 0.004, 0.04 - i * 0.026], 0.008, d)));
    t.ball([0.075, 0.065, 0.14], [0, 0.05, 0.03], { color: r })
      .cone([0.03, 0.05, 0.02], [0, 0.062, 0.115], { color: r, rot: [90, 0, 0] })
      .each(5, (i) => t.ball([0.07 - i * 0.006, 0.05 - i * 0.004, 0.045], [0, 0.045 - i * 0.003, -0.05 - i * 0.034], { color: i % 2 ? d : r }))
      .ball([0.035, 0.012, 0.05], [0, 0.03, -0.235], { color: r })
      .pair((s) => {
        t.ball([0.03, 0.01, 0.045], [s * 0.028, 0.03, -0.228], { color: d, rot: [0, s * 30, 0] })
          .rod([s * 0.01, 0.07, 0.09], [s * 0.016, 0.085, 0.1], 0.006, d)
          .ball(0.012, [s * 0.017, 0.088, 0.102], { color: '#1a1414', eye: true })
          .rod([s * 0.012, 0.065, 0.11], [s * 0.06, 0.11, 0.2], 0.005, d)
          .rod([s * 0.06, 0.11, 0.2], [s * 0.1, 0.12, 0.08], 0.004, d)
          .rod([s * 0.03, 0.04, 0.08], [s * 0.06, 0.045, 0.13], 0.016, r)
          .ball([0.05, 0.035, 0.085], [s * 0.07, 0.05, 0.19], { color: r })
          .rod([s * 0.075, 0.052, 0.225], [s * 0.08, 0.05, 0.27], 0.018, r)
          .rod([s * 0.06, 0.045, 0.225], [s * 0.058, 0.04, 0.26], 0.012, d);
      });
    return t.done();
  }),
  e('locust', 'bugs', 'crawling insects', () =>
    bug('locust', { length: 0.075, color: '#7a8a3a', wings: 'clear', wingColor: '#cfc48e', segments: 3, extras: (p, { L }) => {
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.24, L * 0.24, L * 0.62];
      a.off = [0, 0, -L * 0.22];
      for (const s of [1, -1]) {
        rodP(p, 'body', [s * L * 0.13, -L * 0.02, -L * 0.06], [s * L * 0.2, L * 0.16, -L * 0.36], L * 0.08, '#6a7a30');
        rodP(p, 'body', [s * L * 0.2, L * 0.16, -L * 0.36], [s * L * 0.2, -L * 0.32, -L * 0.42], L * 0.035, '#5a6a28');
      }
    } }),
  ),
  e('lynx', 'wild', 'forest', () =>
    feline('lynx', { s: 0.5, legK: 1.15, color: '#c4a27c', belly: '#efe4d2', snout: '#f2e8d8', tail: 'stub', earK: 1.4, eyes: '#c8b030', acc: [ani.spots('#7a5a3a', 8), tailTip('#2a2422', 'stub'), (p, d) => {
      const [hl, hh, hw] = d.head;
      const es = 0.11 * 0.5 * 1.4;
      for (const s of [1, -1]) {
        add(p, 'head', 'capsule', [es * 0.14, es * 0.55, es * 0.14], [s * (hw * 0.3 + es * 0.25), hh * 0.45 + es * 1.1, -hl * 0.05], '#2a2422', { srot: [0, 0, -s * 12] });
        add(p, 'head', 'ball', [hw * 0.36, hh * 0.42, hl * 0.4], [s * hw * 0.36, -hh * 0.18, hl * 0.06], '#efe4d2', { layer: 1 });
      }
    }] }),
  ),
  e('macaw', 'aviary', 'tropical birds', () =>
    birdx('macaw', { height: 0.85, color: '#d62828', wing: '#2a5fc0', beak: '#efe8dc', legs: '#7a7a80', tail: ['#d62828', '#2a5fc0', '#d62828'] }, (p, g, H) => {
      bTail(g, H, 1.9, 3);
      g('tail').rot = [-112, 0, 0];
      bHook(p, g, H, 1.1);
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.03, H * 0.12, H * 0.13], [s * H * 0.11, H * 0.1, H * 0.05], '#f6f2ec', { layer: 3, noInk: true });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.1, H * 0.2], [0, H * 0.06, H * 0.03], '#f2c230', { layer: 4, noInk: true });
    }),
  ),
  e('maggot', 'bugs', 'grubs and worms', () => {
    const t = m('maggot', { view: 'side' });
    [0.03, 0.035, 0.036, 0.035, 0.031, 0.025, 0.018].forEach((T, i) => t.ball([T, T, T * 0.9], [0, T / 2 + 0.001, -0.042 + i * 0.014], { color: '#f1ead2' }));
    t.ball(0.007, [0, 0.008, 0.05], { color: '#3a2a20' }).pair((s) => t.ball(0.006, [s * 0.006, 0.02, -0.056], { color: '#8a6a40', noInk: true }));
    return t.done();
  }),
  e('magpie', 'aviary', 'garden birds', () =>
    birdx('magpie', { height: 0.42, color: '#1c1c24', wing: '#22305a', beak: '#1c1c24', legs: '#2a2726', tail: ['#22305a', '#1c2a4a'] }, (p, g, H) => {
      bTail(g, H, 2.1, 2);
      g('tail').rot = [-100, 0, 0];
      bBelly(p, H, '#f4f2ee', 1.05);
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.12, H * 0.22], [0, H * 0.03, H * 0.04], '#f4f2ee', { layer: 4, noInk: true });
    }),
  ),
  e('maltese', 'pets', 'dog breeds', () => dog('maltese', { s: 0.36, legK: 0.6, color: '#f7f5f0', earK: 1.6, snoutK: 0.55, tail: 'fluffy', tailAngle: 25, acc: [coat('#f7f5f0'), bow('#f08ab0')] })),
  e('mammoth', 'wild', 'prehistoric', () =>
    beast('mammoth', { color: '#6b4426', body: [3.4, 2.1, 1.9], legL: 1.25, legW: 0.6, hoof: '#4a3020', hoofH: 0.25, neckL: 0.25, neckLean: 75, neckW: 1.0, head: [1.1, 1.3, 1.1], ears: 'side', earSize: 0.45, tail: 'tuft', acc: [
      (p, d) => {
        const [L, H, W] = d.body;
        add(p, 'body', 'ball', [W * 1.08, H * 0.75, L * 0.92], [0, -H * 0.28, 0], '#55351d', { layer: 1 });
        add(p, 'body', 'ball', [W * 0.75, H * 0.55, L * 0.35], [0, H * 0.45, L * 0.22], '#6b4426');
      },
      (p, d) => {
        const [hl, hh, hw] = d.head;
        add(p, 'head', 'ball', [hw * 0.8, hh * 0.6, hl * 0.6], [0, hh * 0.55, -hl * 0.1], '#6b4426');
        chainP(p, 'head', [[0, -0.1, 0.55], [0, -0.9, 0.85], [0, -1.6, 0.9], [0, -1.95, 1.05]], [0.38, 0.3, 0.24], '#6b4426', { layer: 4 });
        for (const s of [1, -1]) chainP(p, 'head', [[s * 0.3, -0.35, 0.5], [s * 0.45, -1.1, 0.95], [s * 0.4, -1.3, 1.6], [s * 0.2, -0.9, 2.0]], [0.2, 0.17, 0.13], '#efe6cf', { layer: 5 });
      },
    ] }),
  ),
  e('manatee', 'sea', 'sea mammals', () => {
    const t = m('manatee', { view: 'side' });
    const c = '#8d918e', l = '#a7aaa4';
    t.ball([1.25, 1.2, 2.6], [0, 0.66, 0], { color: c })
      .ball([0.95, 0.85, 1.4], [0, 0.62, -1.3], { color: c })
      .ball([1.35, 0.16, 1.05], [0, 0.6, -2.15], { color: c })
      .ball([0.82, 0.74, 0.82], [0, 0.8, 1.35], { color: c })
      .ball([0.64, 0.54, 0.46], [0, 0.64, 1.74], { color: l })
      .pair((s) =>
        t.ball(0.09, [s * 0.3, 0.92, 1.6], { color: '#1e1c1c', eye: true })
          .ball([0.06, 0.04, 0.05], [s * 0.1, 0.86, 1.9], { color: '#4a4a4a', noInk: true })
          .ball([0.12, 0.42, 0.28], [s * 0.62, 0.36, 0.8], { color: c, rot: [-35, 0, s * 25] })
          .each(3, (i) => t.ball(0.03, [s * (0.12 + i * 0.07), 0.6 + (i % 2) * 0.06, 1.93 - i * 0.03], { color: '#5a5a58', noInk: true })),
      );
    return t.done();
  }),
  e('manta ray', 'sea', 'rays', () =>
    turned('manta ray', 'front', [0, 1.05, 0], [38, 0, 0], (s, r) => {
      const c = '#2a3340';
      s('ball', [0.95, 0.38, 1.75], [0, 0, 0], c);
      s('ball', [0.88, 0.3, 1.62], [0, -0.07, 0.02], '#eeeeea', { noInk: true });
      for (const k of [1, -1]) {
        s('ball', [2.1, 0.14, 1.0], [k * 1.15, 0, -0.15], c, { srot: [0, k * 22, k * 8] });
        s('ball', [0.9, 0.08, 0.4], [k * 2.1, 0.12, -0.6], c, { srot: [0, k * 38, k * 12] });
        r([k * 0.32, 0, 0.72], [k * 0.3, -0.06, 1.15], 0.14, c);
        s('ball', [0.08, 0.08, 0.08], [k * 0.44, 0.08, 0.6], '#111111', { role: 'eye', noInk: true });
        s('ball', [0.5, 0.06, 0.42], [k * 0.4, 0.16, 0.15], '#c8ccd2', { noInk: true });
      }
      s('ball', [0.4, 0.12, 0.08], [0, -0.04, 0.86], '#14181e');
      r([0, 0, -0.8], [0, 0, -2.0], 0.06, c);
      s('cyl', [0.04, 0.18, 0.2], [0, 0.22, -0.72], c, { taper: 0, srot: [-40, 0, 0] });
    }),
  ),
  e('mantis', 'bugs', 'crawling insects', () => {
    const t = m('mantis', { view: 'side' });
    const g = '#7cb342', dg = '#5a8a2e';
    t.each(2, (i) => t.pair((s) => t.rod([s * 0.004, 0.024, -0.004 - i * 0.012], [s * 0.022, 0.014, -0.002 - i * 0.02], 0.003, dg).rod([s * 0.022, 0.014, -0.002 - i * 0.02], [s * 0.026, 0.001, -0.01 - i * 0.024], 0.0025, dg)));
    t.ball([0.016, 0.014, 0.05], [0, 0.024, -0.03], { color: g, rot: [8, 0, 0] })
      .ball([0.014, 0.006, 0.042], [0, 0.031, -0.026], { color: '#a8d468', rot: [8, 0, 0] })
      .rod([0, 0.024, 0.0], [0, 0.05, 0.016], 0.008, g)
      .ball([0.022, 0.013, 0.012], [0, 0.057, 0.022], { color: g })
      .pair((s) =>
        t.ball([0.009, 0.01, 0.009], [s * 0.01, 0.059, 0.022], { color: '#c8e070' })
          .ball([0.003, 0.004, 0.003], [s * 0.013, 0.06, 0.025], { color: '#1a1a14', eye: true, noInk: true })
          .rod([s * 0.003, 0.062, 0.025], [s * 0.012, 0.08, 0.035], 0.0015, dg)
          .rod([s * 0.004, 0.046, 0.016], [s * 0.006, 0.034, 0.03], 0.0045, g)
          .rod([s * 0.006, 0.034, 0.03], [s * 0.006, 0.047, 0.035], 0.004, g),
      );
    return t.done();
  }),
  e('mare', 'farm', 'horses', () => horse('mare', { s: 0.8, color: '#8b4a2b', mane: '#4a2614', acc: [blaze('#f4efe6')] })),
  e('mastiff', 'pets', 'dog breeds', () => dog('mastiff', { s: 1.08, fat: 1.25, headK: 1.2, snoutK: 0.6, snoutShape: 'box', color: '#c9a06a', snout: '#2e2824', earColor: '#3a302a', earK: 0.75, tailAngle: 140 })),
  e('megalodon', 'sea', 'sharks', () =>
    fish('megalodon', { length: 15, color: '#5e6b78', belly: '#e6e8ea', shape: 'shark', extras: (p, { L, H, W }) => {
      add(p, 'body', 'ball', [W * 0.55, H * 0.3, L * 0.12], [0, -H * 0.16, L * 0.33], '#5a1e22', { layer: 4 });
      for (let i = 0; i < 4; i++) for (const s of [1, -1]) {
        const x = s * W * (0.05 + i * 0.06), z = L * (0.385 - i * 0.012);
        coneP(p, 'body', [x, -H * 0.04, z], [x, -H * 0.15, z], W * 0.06, '#f6f4ec', { layer: 5 });
        coneP(p, 'body', [x, -H * 0.29, z - L * 0.01], [x, -H * 0.19, z - L * 0.01], W * 0.06, '#f6f4ec', { layer: 5 });
      }
      for (let i = 0; i < 3; i++) for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.03, H * 0.35, L * 0.012], [s * W * 0.43, -H * 0.02, L * (0.2 - i * 0.035)], '#3e4852', { noInk: true, layer: 4 });
    } }),
  ),
  e('moby dick', 'sea', 'whales', () =>
    whale('moby dick', { L: 13, hk: 0.28, color: '#f2f0ea', belly: '#e4e2dc', head: 'box', dorsal: 'hump' }, (t, { L, H, y }) => {
      for (const [x, z] of [[0.3, -0.04], [-0.2, -0.12]]) t.rod([x, y + H * 0.4, L * z], [x * 2.6, y + H * 0.4 + 1.7, L * z - 0.9], 0.09, '#6b4a2e').cone([0.16, 0.3, 0.16], [x * 0.9, y + H * 0.42, L * z + 0.05], { color: '#55595e', rot: [150, 0, 0] });
      t.pair((s) => t.each(3, (i) => t.capsule([0.05, 1.2, 0.05], [s * H * 0.44, y + H * (0.15 - i * 0.1), L * (0.05 - i * 0.07)], { color: '#b8b6b0', rot: [70, 0, 10], noInk: true })));
    }),
  ),
  e('monkey', 'wild', 'jungle', () => {
    const t = m('monkey');
    const c = '#8a5a32', f = '#e9c49a';
    t.ball([0.22, 0.26, 0.18], [0, 0.2, 0], { color: c })
      .ball([0.15, 0.17, 0.08], [0, 0.18, 0.06], { color: f, noInk: true })
      .ball([0.2, 0.18, 0.17], [0, 0.42, 0.02], { color: c })
      .ball([0.15, 0.13, 0.08], [0, 0.41, 0.08], { color: f })
      .ball([0.09, 0.06, 0.06], [0, 0.375, 0.115], { color: f })
      .ball([0.018, 0.01, 0.01], [0, 0.39, 0.145], { color: '#4a2e1a', noInk: true })
      .rod([-0.11, 0.28, 0], [-0.14, 0.12, 0.06], 0.05, c)
      .ball([0.05, 0.04, 0.05], [-0.13, 0.1, 0.09], { color: f })
      .rod([0.11, 0.28, 0], [0.13, 0.2, 0.1], 0.05, c)
      .rod([0.13, 0.2, 0.1], [0.07, 0.32, 0.13], 0.045, c)
      .ball(0.045, [0.06, 0.33, 0.14], { color: f })
      .rod([0.04, 0.3, 0.15], [0.02, 0.4, 0.17], 0.03, '#f6d24a')
      .rod([0.04, 0.3, 0.15], [0.09, 0.25, 0.14], 0.03, '#f6d24a')
      .pair((s) =>
        t.ball([0.025, 0.028, 0.012], [s * 0.035, 0.43, 0.12], { color: '#1e1410', eye: true, noInk: true })
          .ball([0.06, 0.07, 0.03], [s * 0.115, 0.43, 0.0], { color: f })
          .ball([0.07, 0.07, 0.14], [s * 0.08, 0.065, 0.06], { color: c })
          .ball([0.05, 0.03, 0.08], [s * 0.09, 0.02, 0.13], { color: f }),
      )
      .rod([0, 0.08, -0.08], [0.1, 0.04, -0.2], 0.03, c)
      .rod([0.1, 0.04, -0.2], [0.22, 0.1, -0.22], 0.028, c)
      .rod([0.22, 0.1, -0.22], [0.24, 0.22, -0.15], 0.025, c)
      .rod([0.24, 0.22, -0.15], [0.18, 0.26, -0.12], 0.022, c);
    return t.done();
  }),
  e('moose', 'wild', 'forest', () =>
    beast('moose', { color: '#4a3324', body: [1.9, 0.9, 0.7], legL: 1.05, legW: 0.13, legColor: '#8a7560', hoof: '#2a201a', hoofH: 0.1, neckL: 0.42, neckLean: 52, neckW: 0.36, head: [0.7, 0.4, 0.34], snout: { len: 0.36, h: 0.34, w: 0.3, color: '#3e2b1e', shape: 'box' }, nose: '#2a1e16', ears: 'side', earSize: 0.22, tail: 'stub', acc: [hump('#4a3324'), ani.beard('#3e2b1e'), palmAntlers('#c8b08a', 1.4)] }),
  ),
  e('moose calf', 'wild', 'forest', () =>
    beast('moose calf', { color: '#8a5a3a', body: [0.95, 0.45, 0.36], legL: 0.68, legW: 0.075, legColor: '#a07a5a', hoof: '#2a201a', hoofH: 0.06, neckL: 0.28, neckLean: 42, neckW: 0.2, head: [0.4, 0.24, 0.21], snout: { len: 0.18, h: 0.19, w: 0.17, color: '#704630', shape: 'box' }, nose: '#2a1e16', ears: 'side', earSize: 0.19, tail: 'stub' }),
  ),
  e('mosquito', 'bugs', 'flying insects', () =>
    bug('mosquito', { length: 0.06, color: '#3e3c40', stripes: '#e8e6e0', wings: 'clear', wingColor: '#d8e8f0', extras: (p, { L }) => {
      const g = (n: string) => p.list.find((x) => x.name === n)!;
      const ab = g('abdomen');
      ab.size = [L * 0.2, L * 0.18, L * 0.56];
      ab.off = [0, -L * 0.02, -L * 0.2];
      for (let i = 0; i < 3; i++) g(`stripe${i}`).size = [L * 0.21, L * 0.19, L * 0.045];
      for (const q of p.list) if (q.name.startsWith('leg')) { q.size = [q.size[0], q.size[1] * 1.9, q.size[2]]; q.off = [0, q.off![1] * 1.9, 0]; }
      g('body').at = [0, L * 0.5, 0];
      rodP(p, 'head', [0, -L * 0.02, L * 0.12], [0, -L * 0.14, L * 0.34], L * 0.022, '#2a2726');
    } }),
  ),
  e('moth', 'bugs', 'flying insects', () =>
    bug('moth', { length: 0.06, color: '#9a8a72', wings: 'butterfly', wingColor: '#b8a586', extras: (p, { L }) => {
      for (const [w, s] of [['wingL', 1], ['wingR', -1]] as const) {
        add(p, w, 'ball', [L * 0.16, L * 0.012, L * 0.16], [s * L * 0.62, L * 0.012, -L * 0.04], '#5a4a3a', { noInk: true, layer: 4 });
        add(p, w, 'ball', [L * 0.5, L * 0.012, L * 0.06], [s * L * 0.45, L * 0.012, L * 0.12], '#8a7a62', { noInk: true, layer: 4 });
      }
      for (const a of ['antennaL', 'antennaR']) add(p, a, 'ball', [L * 0.07, L * 0.2, L * 0.02], [0, L * 0.18, 0], '#6a5a48');
      add(p, 'body', 'ball', [L * 0.36, L * 0.32, L * 0.32], [0, 0, 0], '#b8a888');
    } }),
  ),
  e('mountain goat', 'wild', 'mountains', () =>
    beast('mountain goat', { color: '#f2efe8', body: [1.0, 0.55, 0.42], legL: 0.45, legW: 0.09, hoof: '#2a2522', hoofH: 0.06, neckL: 0.22, neckLean: 40, neckW: 0.22, head: [0.32, 0.2, 0.16], snout: { len: 0.12, h: 0.12, w: 0.1, color: '#ece8e0' }, nose: '#2a2522', ears: 'pointy', earSize: 0.09, tail: 'stub', acc: [(p, d) => { const [hl, hh, hw] = d.head; for (const s of [1, -1]) coneP(p, 'head', [s * hw * 0.25, hh * 0.42, -hl * 0.05], [s * hw * 0.32, hh * 1.45, -hl * 0.38], hw * 0.24, '#2a2522'); }, ani.beard('#f2efe8'), hump('#f2efe8', 1.1)] }),
  ),
  e('mountain lion', 'wild', 'mountains', () => feline('mountain lion', { s: 0.68, color: '#b98a58', belly: '#ecdcc0', snout: '#efe3cc', tailAngle: 115, acc: [tailTip('#3a2a20', 'long')] })),
  e('mouse', 'pets', 'small pets', () =>
    beast('mouse', { color: '#a09a94', belly: '#ece6de', bodyShape: 'ball', body: [0.085, 0.052, 0.055], legL: 0.008, legW: 0.011, legColor: '#e8b4b8', neckL: 0.005, neckLean: 55, neckW: 0.03, head: [0.042, 0.034, 0.036], snout: { len: 0.02, h: 0.018, w: 0.02 }, nose: '#e88a9a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.032, undefined, '#f0b0b8'), ropeTail('#e8b4b8', 0.005, [[0, -0.01, -0.04], [0.01, -0.025, -0.075], [0.03, -0.027, -0.11], [0.05, -0.022, -0.13]])] }),
  ),
  e('mussel', 'sea', 'shellfish', () => {
    const t = m('mussel');
    const sh = '#1c2238';
    t.ball([0.045, 0.02, 0.09], [0, 0.011, 0], { color: sh })
      .ball([0.037, 0.014, 0.076], [0, 0.019, 0.002], { color: '#f08c3c' })
      .ball([0.045, 0.011, 0.09], [-0.006, 0.035, 0], { color: sh, rot: [0, 0, 40] })
      .ball([0.04, 0.006, 0.082], [-0.003, 0.031, 0], { color: '#d9dce8', rot: [0, 0, 40], noInk: true })
      .ball([0.012, 0.02, 0.02], [-0.02, 0.02, -0.035], { color: '#2e3450' });
    return t.done();
  }),
  e('mutt', 'pets', 'dog breeds', () => dog('mutt', { s: 0.85, color: '#a8743f', belly: '#efe2c8', snout: '#efe2c8', earColor: '#6b4423', tailAngle: 70, acc: [ani.spots('#f2ece0', 4), mask('#6b4423', 1.2, 1), dogCollar(0.85, '#d6453a', '#e2b23a')] })),
  e('naked mole rat', 'wild', 'rodents', () =>
    beast('naked mole rat', { color: '#e8b0a0', body: [0.13, 0.045, 0.05], legL: 0.01, legW: 0.013, neckL: 0.005, neckLean: 70, neckW: 0.03, head: [0.042, 0.032, 0.036], snout: { len: 0.016, h: 0.02, w: 0.026, color: '#eebcae' }, nose: '#d88a8a', ears: 'side', earSize: 0.004, tail: 'long', tailAngle: 120, acc: [ani.stripes('#d89a88', 4), buckTeeth('#f2e8c8', { len: 0.016, h: 0.02, w: 0.026 })] }),
  ),
  e('narwhal', 'sea', 'whales', () =>
    whale('narwhal', { L: 5, hk: 0.27, color: '#8c96a0', belly: '#e6e8ea', head: 'round', dorsal: 'hump' }, (t, { L, H, y }) => {
      t.cone([0.13, 2.3, 0.13], [0.06, y + H * 0.02, L * 0.37 + 1.15], { color: '#efe8d6', rot: [88, 0, 0] });
      t.each(5, (i) => t.torus([0.12 - i * 0.02, 0.12 - i * 0.02, 0.03], [0.06, y + H * 0.02 + i * 0.008, L * 0.4 + 0.25 + i * 0.4], { color: '#c8bea8', noInk: true }));
      t.each(6, (i) => t.ball([H * 0.12, H * 0.06, L * 0.06], [((i % 3) - 1) * H * 0.22, y + H * 0.42, L * (0.18 - i * 0.07)], { color: '#5c6670', noInk: true }));
    }),
  ),
  e('nautilus', 'sea', 'octopus and squid', () => {
    const t = m('nautilus', { view: 'side' });
    t.ball([0.062, 0.18, 0.18], [0, 0.1, -0.02], { color: '#f3e6d0' })
      .pair((s) => {
        t.torus([0.085, 0.085, 0.02], [s * 0.025, 0.105, -0.01], { color: '#d9c8aa', rot: [0, 90, 0] }).ball([0.012, 0.03, 0.03], [s * 0.03, 0.105, -0.008], { color: '#a8743f' });
        for (const a of [20, 50, 80, 110, 140, 170]) {
          const r = 0.066, yy = 0.1 + Math.sin(a * D) * r, zz = -0.02 + Math.cos(a * D) * r;
          t.ball([0.008, 0.012, 0.04], [s * 0.021, yy, zz], { color: '#b5652e', rot: [-a, 0, 0], noInk: true });
        }
      })
      .ball([0.05, 0.07, 0.05], [0, 0.06, 0.07], { color: '#d8a888' })
      .pair((s) => t.ball(0.014, [s * 0.022, 0.075, 0.08], { color: '#1a1414', eye: true }))
      .each(8, (i) => {
        const x = ((i % 4) - 1.5) * 0.012, y0 = 0.035 + Math.floor(i / 4) * 0.025;
        t.rod([x, y0, 0.09], [x * 1.8, y0 - 0.025, 0.14 + (i % 3) * 0.01], 0.008, '#e0b496');
      });
    return t.done();
  }),
  e('octopus', 'sea', 'octopus and squid', () => {
    const t = m('octopus');
    const c = '#d9603b', d = '#b8482a';
    t.ball([0.55, 0.65, 0.5], [0, 0.7, -0.06], { color: c, rot: [-12, 0, 0] })
      .ball([0.4, 0.3, 0.4], [0, 0.42, 0.02], { color: c })
      .pair((s) =>
        t.ball([0.15, 0.16, 0.1], [s * 0.15, 0.5, 0.17], { color: '#f6f2ea' })
          .ball([0.07, 0.09, 0.05], [s * 0.15, 0.5, 0.22], { color: '#141414', eye: true, noInk: true })
          .each(2, (i) => t.ball([0.06, 0.05, 0.03], [s * (0.1 + i * 0.1), 0.82 - i * 0.12, 0.17 - i * 0.04], { color: '#f0906a', noInk: true })),
      )
      .each(8, (i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8, cx = Math.sin(a), cz = Math.cos(a);
        const pts: Vec3[] = [[cx * 0.12, 0.36, cz * 0.12], [cx * 0.42, 0.1, cz * 0.42], [cx * 0.68, 0.07, cz * 0.68], [cx * 0.8 - cz * 0.08, 0.2, cz * 0.8 + cx * 0.08]];
        for (let j = 0; j < 3; j++) t.rod(pts[j], pts[j + 1], [0.15, 0.11, 0.07][j], j === 2 ? d : c);
      });
    return t.done();
  }),
  e('opossum', 'wild', 'forest', () =>
    beast('opossum', { color: '#9a9a9c', body: [0.4, 0.16, 0.15], legL: 0.08, legW: 0.04, legColor: '#2a2725', neckL: 0.04, neckLean: 55, neckW: 0.08, head: [0.13, 0.085, 0.09], headColor: '#f2efe8', snout: { len: 0.09, h: 0.045, w: 0.045, color: '#f2efe8' }, nose: '#e8909a', ears: 'pointy', earSize: 0.045, tail: 'stub', acc: [roundEars(0.045, '#2a2725'), ropeTail('#ecc0c4', [0.022, 0.018, 0.015, 0.012], [[0, 0, -0.2], [0, -0.05, -0.3], [0.03, -0.11, -0.38], [0.07, -0.12, -0.45], [0.09, -0.08, -0.47]])] }),
  ),
  e('orangutan', 'wild', 'jungle', () => {
    const t = m('orangutan');
    const c = '#c8642a', d = '#a84e1e', f = '#8a6a55';
    t.pair((s) =>
      t.rod([s * 0.12, 0.45, 0], [s * 0.2, 0.25, 0.06], 0.13, c)
        .rod([s * 0.2, 0.25, 0.06], [s * 0.17, 0.05, 0.06], 0.11, c)
        .ball([0.1, 0.06, 0.16], [s * 0.17, 0.03, 0.1], { color: f })
        .rod([s * 0.25, 1.0, 0], [s * 0.44, 0.56, 0.06], 0.13, c)
        .rod([s * 0.44, 0.56, 0.06], [s * 0.47, 0.1, 0.12], 0.11, c)
        .capsule([0.12, 0.42, 0.1], [s * 0.4, 0.62, -0.02], { color: d, rot: [0, 0, s * 22] })
        .ball([0.12, 0.1, 0.14], [s * 0.47, 0.06, 0.14], { color: f }),
    );
    t.ball([0.52, 0.66, 0.42], [0, 0.76, 0], { color: c })
      .ball([0.32, 0.36, 0.12], [0, 0.72, 0.17], { color: d, noInk: true })
      .ball([0.3, 0.3, 0.28], [0, 1.16, 0.04], { color: c })
      .ball([0.46, 0.3, 0.1], [0, 1.13, 0.12], { color: '#5e463a' })
      .ball([0.2, 0.22, 0.12], [0, 1.13, 0.17], { color: f })
      .ball([0.13, 0.08, 0.08], [0, 1.06, 0.22], { color: '#9a7a62' })
      .pair((s) => t.ball([0.03, 0.035, 0.02], [s * 0.045, 1.17, 0.225], { color: '#1a1410', eye: true, noInk: true }));
    return t.done();
  }),
  e('orca', 'sea', 'whales', () =>
    whale('orca', { L: 8, hk: 0.27, color: '#1a1c22', belly: '#f4f4f2', head: 'round', dorsal: 'tall' }, (t, { L, H, y }) => {
      t.pair((s) => t.ball([H * 0.05, H * 0.18, L * 0.1], [s * H * 0.37, y + H * 0.12, L * 0.24], { color: '#f4f4f2', noInk: true }));
      t.ball([H * 0.5, H * 0.2, L * 0.12], [0, y + H * 0.44, -L * 0.14], { color: '#8a8e96', noInk: true });
    }),
  ),
  e('ostrich', 'aviary', 'ground birds', () => {
    const t = m('ostrich', { view: 'side', rig: 'bird' });
    const n = '#d8b2a2', lg = '#d9a08a';
    t.ball([0.6, 0.6, 0.92], [0, 1.25, -0.05], { color: '#2a2522', name: 'body' })
      .ball([0.42, 0.3, 0.3], [0, 1.42, -0.5], { color: '#f6f4ee', name: 'tail', parent: 'body' })
      .rod([0, 1.42, 0.3], [0, 2.22, 0.44], 0.11, n, { parent: 'body' })
      .ball([0.16, 0.15, 0.22], [0, 2.3, 0.48], { color: n, name: 'head', parent: 'body', pivot: [0, 2.2, 0.44] })
      .ball([0.09, 0.05, 0.16], [0, 2.27, 0.62], { color: '#e0b888', parent: 'head' });
    t.pair((s) => {
      t.ball([0.12, 0.4, 0.62], [s * 0.3, 1.3, -0.12], { color: '#2a2522', name: s > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [s * 0.25, 1.45, 0.1] })
        .ball([0.1, 0.22, 0.3], [s * 0.31, 1.2, -0.42], { color: '#f6f4ee', parent: s > 0 ? 'wingL' : 'wingR' })
        .ball(0.055, [s * 0.065, 2.33, 0.53], { color: '#1a1414', eye: true, parent: 'head' })
        .ball([0.18, 0.32, 0.24], [s * 0.15, 0.98, 0], { color: lg, name: s > 0 ? 'legL' : 'legR', parent: 'body', pivot: [s * 0.15, 1.1, 0] })
        .rod([s * 0.15, 0.86, 0.02], [s * 0.15, 0.06, 0.06], 0.075, lg, { parent: s > 0 ? 'legL' : 'legR' })
        .box([0.1, 0.06, 0.22], [s * 0.15, 0.03, 0.13], { color: lg, round: 0.8, parent: s > 0 ? 'legL' : 'legR' });
    });
    return t.done();
  }),
  e('otter', 'wild', 'rivers', () =>
    beast('otter', { color: '#6b4a2e', belly: '#b89a7a', body: [0.9, 0.22, 0.22], legL: 0.09, legW: 0.065, neckL: 0.12, neckLean: 30, neckW: 0.15, head: [0.17, 0.14, 0.15], snout: { len: 0.06, h: 0.08, w: 0.11, color: '#c4a888' }, nose: '#2a1e16', ears: 'side', earSize: 0.03, tail: 'stub', acc: [roundEars(0.035), coneTail(0.5, 0.12, '#6b4a2e', 0.15)] }),
  ),
  e('owl', 'aviary', 'birds of prey', () => owl('owl', 0.8, { body: '#8a6a4a', wing: '#6e5236', face: '#ecdcc0', chest: '#d4b88e', spots: '#6e5236' }, true)),
  e('owlet', 'aviary', 'birds of prey', () => owl('owlet', 0.36, { body: '#d8d0c4', wing: '#b8ac9c', face: '#f2eee6', chest: '#ece6dc' }, false, 1.2)),
  e('ox', 'farm', 'cattle', () =>
    beast('ox', { color: '#8a4e2a', body: [2.0, 1.0, 0.8], bodyShape: 'box', legL: 0.6, legW: 0.16, hoof: '#2a2018', hoofH: 0.1, neckL: 0.25, neckLean: 70, neckW: 0.45, head: [0.5, 0.42, 0.38], snout: { len: 0.2, h: 0.25, w: 0.3, color: '#e8c8b0' }, nose: '#5a4a40', ears: 'side', earSize: 0.2, tail: 'tuft', acc: [bullHorns('#efe6cf', 1.6), hump('#8a4e2a', 0.6, 0.3), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'box', [W * 1.7, 0.1, 0.14], [0, H * 0.62, L * 0.4], '#8a5a2a', { round: 0.5 });
      for (const s of [1, -1]) add(p, 'body', 'torus', [0.3, 0.42, 0.04], [s * W * 0.32, H * 0.42, L * 0.42], '#6b4423', { tube: 0.2 });
    }] }),
  ),
  e('panda', 'wild', 'forest', () => panda('panda', 1, 1)),
  e('panda cub', 'wild', 'forest', () => panda('panda cub', 0.32, 1.4)),
  e('panther', 'wild', 'jungle', () => feline('panther', { s: 0.72, color: '#25252c', snout: '#303038', nose: '#18181c', eyes: '#c8d040', tailAngle: 120 })),
  e('panther cub', 'wild', 'jungle', () => feline('panther cub', { s: 0.3, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#2e2e36', snout: '#3a3a42', nose: '#18181c', eyes: '#7ab0d0', tailAngle: 110 })),
  e('parrot', 'aviary', 'tropical birds', () =>
    birdx('parrot', { height: 0.35, color: '#3cae46', wing: '#2a7a3a', beak: '#e8e0c8', legs: '#7a7a80', tail: ['#3cae46', '#2a6ac0'] }, (p, g, H) => {
      g('tail').rot = [-105, 0, 0];
      bTail(g, H, 1.3, 2);
      bHook(p, g, H, 1.15);
      add(p, 'head', 'ball', [H * 0.18, H * 0.1, H * 0.16], [0, H * 0.22, H * 0.04], '#f2d23a', { layer: 3, noInk: true });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.08, H * 0.1], [0, H * 0.07, H * 0.06], '#e0402e', { layer: 4, noInk: true });
    }),
  ),
  e('peacock', 'aviary', 'ground birds', () =>
    birdx('peacock', { height: 1.0, color: '#1f4fa8', wing: '#a08a62', beak: '#c8b89a', legs: '#9a8a7a', tail: ['#2e7d4f'] }, (p, g, H) => {
      add(p, undefined, 'ball', [1.98, 1.58, 0.04], [0, 1.1, -0.47], '#b8a84a', { layer: -6 });
      add(p, undefined, 'ball', [1.9, 1.5, 0.06], [0, 1.1, -0.45], '#2e7d4f', { layer: -5 });
      for (const [f, a0, n] of [[0.84, -80, 9], [0.55, -60, 5], [0.25, -30, 3]] as const)
        for (let i = 0; i < n; i++) {
          const a = (a0 + (i * -2 * a0) / (n - 1)) * D, x = Math.sin(a) * 0.95 * f, y = 1.1 + Math.cos(a) * 0.75 * f;
          add(p, undefined, 'ball', [0.15, 0.17, 0.03], [x, y, -0.415], '#1fa0a0', { layer: -4, noInk: true });
          add(p, undefined, 'ball', [0.08, 0.09, 0.03], [x, y, -0.4], '#1d2f80', { layer: -3, noInk: true });
        }
      for (const x of [-0.03, 0, 0.03]) {
        rodP(p, 'head', [x, H * 0.22, 0], [x * 2.2, H * 0.36, -H * 0.03], H * 0.012, '#1f4fa8');
        add(p, 'head', 'ball', [H * 0.03, H * 0.03, H * 0.02], [x * 2.2, H * 0.37, -H * 0.03], '#2a8ac0');
      }
    }),
  ),
  e('pelican', 'aviary', 'sea birds', () =>
    birdx('pelican', { height: 1.05, color: '#f4f2ee', wing: '#e6e4de', beak: '#f0b860', legs: '#e8923a', tail: ['#f4f2ee'] }, (p, g, H) => {
      const b = g('beak');
      b.size = [H * 0.07, H * 0.5, H * 0.05];
      b.off = [0, H * 0.25, 0];
      b.taper = 0.45;
      add(p, 'head', 'ball', [H * 0.075, H * 0.12, H * 0.4], [0, H * 0.04, H * 0.32], '#f0a050', { layer: 2 });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.08, H * 0.18, H * 0.16], [0, -H * 0.06, -H * 0.14], '#2a2726', { layer: 4 });
    }),
  ),
  e('penguin (animal)', 'aviary', 'sea birds', () => {
    const t = m('penguin (animal)', { rig: 'bird' });
    const k = '#1e2128';
    t.ball([0.44, 0.86, 0.4], [0, 0.47, 0], { color: k, name: 'body' })
      .ball([0.36, 0.7, 0.22], [0, 0.43, 0.1], { color: '#f6f6f2', parent: 'body' })
      .ball([0.26, 0.12, 0.1], [0, 0.74, 0.16], { color: '#f7d774', parent: 'body', noInk: true })
      .ball([0.25, 0.25, 0.25], [0, 0.93, 0.03], { color: k, name: 'head', parent: 'body', pivot: [0, 0.82, 0] })
      .cone([0.055, 0.17, 0.045], [0, 0.9, 0.2], { color: k, rot: [100, 0, 0], parent: 'head' })
      .ball([0.025, 0.025, 0.08], [0, 0.885, 0.19], { color: '#f08a5a', parent: 'head' })
      .pair((s) =>
        t.ball([0.05, 0.12, 0.09], [s * 0.115, 0.86, 0.07], { color: '#f6b23a', parent: 'head', noInk: true })
          .ball([0.045, 0.045, 0.02], [s * 0.07, 0.96, 0.13], { color: '#f6f6f2', parent: 'head', noInk: true })
          .ball([0.025, 0.025, 0.012], [s * 0.072, 0.96, 0.142], { color: '#111111', parent: 'head', eye: true, noInk: true })
          .ball([0.07, 0.44, 0.15], [s * 0.23, 0.52, 0], { color: k, rot: [0, 0, s * 14], name: s > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [s * 0.2, 0.72, 0] })
          .ball([0.1, 0.04, 0.16], [s * 0.08, 0.02, 0.1], { color: '#e8892a', parent: 'body' }),
      );
    return t.done();
  }),
  e('pet', 'pets', 'small pets', () => dog('pet', { s: 0.42, headK: 1.2, color: '#c8873f', belly: '#f4efe6', snout: '#f4efe6', earColor: '#8a5428', tailAngle: 60, acc: [dogCollar(0.42, '#2a6ad0', '#e2b23a'), blaze('#f4efe6')] })),
  e('pets', 'pets', 'small pets', () =>
    herd('pets', 'side', [
      [dog('pets', { s: 0.4, headK: 1.3, legK: 0.85, color: '#e3b067', belly: '#f6e6c8', snout: '#f6e6c8', earColor: '#a8743f', tailAngle: 50, acc: [dogCollar(0.4, '#d6453a', '#e2b23a')] }), -0.16, 0],
      [feline('pets', { s: 0.2, hk: 1.4, earK: 1.4, color: '#9a9590', belly: '#f4f2ee', snout: '#f4f2ee', tailAngle: 40, eyes: '#8ac040', acc: [ani.stripes('#5a5650', 4)] }), 0.18, 0.04],
    ]),
  ),
  e('pigeon', 'aviary', 'garden birds', () =>
    birdx('pigeon', { height: 0.33, color: '#8a93a3', wing: '#a3abb8', beak: '#3a3a3a', legs: '#d0606a', tail: ['#6a7383'] }, (p, g, H) => {
      add(p, 'body', 'ball', [H * 0.34, H * 0.2, H * 0.2], [0, H * 0.13, H * 0.15], '#5a8a7a', { noInk: true, layer: 3 });
      add(p, 'head', 'ball', [H * 0.05, H * 0.035, H * 0.04], [0, H * 0.135, H * 0.13], '#efefef', { layer: 4 });
      for (const w of ['wingL', 'wingR']) for (const z of [-0.02, -0.08]) add(p, w, 'ball', [H * 0.09, H * 0.03, H * 0.12], [0, -H * 0.02, H * z], '#3a3e48', { noInk: true, layer: 4 });
    }),
  ),
  e('piglet', 'farm', 'pigs', () =>
    beast('piglet', { color: '#f2a7b0', bodyShape: 'ball', body: [0.45, 0.26, 0.28], legL: 0.08, legW: 0.065, hoof: '#c98a94', hoofH: 0.03, neckL: 0.03, neckLean: 70, neckW: 0.18, head: [0.22, 0.2, 0.2], snout: { len: 0.07, h: 0.09, w: 0.1, color: '#f5b8c0', shape: 'cyl' }, nose: '#e898a4', ears: 'pointy', earSize: 0.09, tail: 'curl', acc: [(p, d) => {
      const [hl, hh] = d.head;
      for (const s of [1, -1]) add(p, 'head', 'ball', [0.016, 0.022, 0.01], [s * 0.017, -hh * 0.12, hl * 0.35 + 0.07 * 0.8], '#a04a5a', { layer: 5, noInk: true });
    }] }),
  ),
  e('piranha', 'sea', 'river fish', () =>
    fish('piranha', { length: 0.3, color: '#8a96a0', belly: '#d8452e', fin: '#6a7380', shape: 'round', extras: (p, { L, H, W }) => {
      add(p, 'body', 'ball', [W * 0.62, H * 0.26, L * 0.16], [0, -H * 0.22, L * 0.31], '#d8452e', { layer: 3 });
      for (const x of [-0.12, -0.04, 0.04, 0.12]) coneP(p, 'body', [x * W, -H * 0.12, L * 0.375], [x * W, -H * 0.02, L * 0.38], W * 0.08, '#f8f6f0', { layer: 4 });
      for (let i = 0; i < 6; i++) add(p, 'body', 'ball', [W * 0.04, L * 0.02, L * 0.02], [(i % 2 ? 1 : -1) * W * 0.42, H * (0.15 - (i % 3) * 0.1), L * (0.1 - i * 0.04)], '#cfd6dc', { noInk: true, layer: 4 });
    } }),
  ),
  e('plankton', 'sea', 'reef life', () => {
    const t = m('plankton', { view: 'side' });
    const c = '#8fd0c4';
    t.ball([0.018, 0.02, 0.04], [0, 0.045, 0], { color: c })
      .ball([0.012, 0.014, 0.02], [0, 0.044, -0.026], { color: c })
      .ball(0.007, [0, 0.051, 0.017], { color: '#d6453a', eye: true })
      .pair((s) => {
        t.rod([s * 0.005, 0.05, 0.012], [s * 0.06, 0.058, 0.0], 0.0025, '#6ab0a4').rod([s * 0.004, 0.04, -0.034], [s * 0.012, 0.035, -0.056], 0.003, c);
        t.each(3, (i) => t.rod([s * 0.006, 0.038, 0.008 - i * 0.008], [s * 0.014, 0.026, 0.004 - i * 0.01], 0.002, '#6ab0a4'));
      })
      .cyl([0.026, 0.008, 0.026], [0.05, 0.03, 0.03], { color: '#7ab83a', rot: [70, 0, 20], glow: true })
      .capsule([0.009, 0.045, 0.009], [-0.05, 0.032, 0.025], { color: '#9ac84a', rot: [0, 0, 60], glow: true })
      .ball(0.016, [-0.035, 0.009, -0.035], { color: '#6ab03a' })
      .cyl([0.02, 0.006, 0.02], [0.035, 0.07, -0.03], { color: '#b8d84a', rot: [30, 0, -40], glow: true });
    return t.done();
  }),
  e('platypus', 'wild', 'australia', () =>
    beast('platypus', { color: '#7a5232', belly: '#b8916a', body: [0.42, 0.15, 0.2], legL: 0.035, legW: 0.045, legColor: '#4a3220', neckL: 0.01, neckLean: 80, neckW: 0.1, head: [0.11, 0.09, 0.11], snout: { len: 0.11, h: 0.025, w: 0.085, color: '#3a3836', shape: 'box' }, nose: '#2a2826', ears: 'side', earSize: 0.005, tail: 'stub', acc: [(p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'box', [W * 0.7, H * 0.22, L * 0.45], [0, -H * 0.1, -L * 0.62], '#6a4428', { round: 0.8 });
    }] }),
  ),
  e('polar bear', 'wild', 'polar', () => bear('polar bear', 1.05, '#f2eee2', { snout: '#ece6d6' })),
  e('polar bear cub', 'wild', 'polar', () => bear('polar bear cub', 0.42, '#f6f2e8', { hk: 1.45, snout: '#f0ece0' })),
  e('pomeranian', 'pets', 'dog breeds', () => dog('pomeranian', { s: 0.34, fat: 1.25, legK: 0.6, color: '#e0882e', snoutK: 0.45, ears: 'pointy', earK: 0.7, tail: 'fluffy', tailAngle: 15, acc: [ani.mane('#eaa04a', true), coat('#e0882e', 0.8)] })),
  e('poodle', 'pets', 'dog breeds', () =>
    dog('poodle', { s: 0.55, legK: 1.3, color: '#f4f1ec', snoutK: 1.25, earK: 1.3, tail: 'stub', tailAngle: 30, acc: [tuft('#f4f1ec', 1.5), tailTip('#f4f1ec', 'stub'), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.45, H * 1.45, L * 0.55], [0, H * 0.12, L * 0.22], '#f4f1ec');
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.55, H * 0.75, L * 0.25], [s * W * 0.3, -H * 0.05, -L * 0.32], '#f4f1ec');
      for (const q of p.list) if (q.name.startsWith('paw')) q.size = q.size.map((v) => v * 2.3) as Vec3;
    }] }),
  ),
  e('porcupine', 'wild', 'forest', () =>
    beast('porcupine', { color: '#4a3a2e', bodyShape: 'ball', body: [0.55, 0.35, 0.4], legL: 0.06, legW: 0.07, neckL: 0.03, neckLean: 70, neckW: 0.15, head: [0.16, 0.13, 0.14], snout: { len: 0.07, h: 0.07, w: 0.08, color: '#6a5a4a' }, ears: 'side', earSize: 0.02, tail: 'stub', acc: [(p, d) => {
      const [L, H, W] = d.body;
      let i = 0;
      for (const zr of [0.55, 0.2, -0.15, -0.5, -0.85])
        for (const a of [-75, -45, -15, 15, 45, 75]) {
          const dir: Vec3 = [Math.sin(a * D), Math.cos(a * D), zr];
          const b = surf([0, 0, 0], [W / 2, H / 2, L / 2], dir, 0.85);
          const n = Math.hypot(dir[0], dir[1], dir[2] - 0.7), len = 0.24 + (i % 3) * 0.05;
          coneP(p, 'body', b, [b[0] + (dir[0] / n) * len, b[1] + (dir[1] / n) * len, b[2] + ((dir[2] - 0.7) / n) * len], 0.036, i++ % 2 ? '#efe6d2' : '#c8b89a', { layer: 3 });
        }
    }] }),
  ),
  e('porpoise', 'sea', 'whales', () => whale('porpoise', { L: 1.8, hk: 0.26, color: '#7a8a99', belly: '#e0e4e8', head: 'beak', dorsal: 'fin' })),
  e('poultry', 'farm', 'poultry', () =>
    herd('poultry', 'side', [
      [birdx('poultry', { height: 0.55, color: '#c0522a', wing: '#8a3a1e', beak: '#e8b84a', legs: '#e8b84a', comb: '#d62828', tail: ['#1e4a3a', '#2a6a4a', '#1e3a2e'] }, (p, g, H) => {
        bTail(g, H, 1.4, 3);
        add(p, 'body', 'ball', [H * 0.3, H * 0.24, H * 0.2], [0, H * 0.15, H * 0.15], '#e8a03a', { noInk: true, layer: 3 });
      }), -0.2, 0],
      [bird('poultry', { height: 0.4, color: '#f4f0e6', wing: '#e8e2d6', beak: '#e8b84a', legs: '#e8b84a', comb: '#d62828' }), 0.2, 0.06],
      [bird('poultry', { height: 0.13, color: '#f6d24a', wing: '#f0c030', beak: '#f0923b', legs: '#f0923b' }), 0.04, 0.32],
    ]),
  ),
  e('prairie dog', 'wild', 'rodents', () => {
    const t = m('prairie dog');
    const c = '#c49a6a', l = '#e2c9a0';
    t.cyl([0.36, 0.07, 0.28], [0, 0.035, -0.09], { color: '#8a6a4a', taper: 0.6 })
      .ball([0.1, 0.02, 0.08], [0, 0.068, -0.12], { color: '#3a2a1e', noInk: true })
      .ball([0.15, 0.11, 0.13], [0, 0.065, 0.04], { color: c })
      .ball([0.13, 0.2, 0.11], [0, 0.15, 0.04], { color: c })
      .ball([0.09, 0.15, 0.06], [0, 0.14, 0.08], { color: l, noInk: true })
      .ball([0.09, 0.08, 0.085], [0, 0.27, 0.05], { color: c })
      .ball([0.05, 0.04, 0.04], [0, 0.258, 0.09], { color: l })
      .ball([0.016, 0.012, 0.01], [0, 0.268, 0.11], { color: '#3a2a20', noInk: true })
      .pair((s) =>
        t.ball([0.014, 0.016, 0.01], [s * 0.024, 0.285, 0.086], { color: '#141010', eye: true, noInk: true })
          .ball([0.02, 0.018, 0.012], [s * 0.04, 0.305, 0.04], { color: c })
          .rod([s * 0.035, 0.2, 0.09], [s * 0.022, 0.175, 0.115], 0.018, c)
          .ball([0.018, 0.014, 0.018], [s * 0.02, 0.17, 0.12], { color: l })
          .ball([0.04, 0.02, 0.065], [s * 0.045, 0.01, 0.08], { color: c }),
      )
      .rod([0, 0.04, -0.03], [0, 0.03, -0.075], 0.022, c)
      .ball(0.02, [0, 0.028, -0.088], { color: '#3a2a20' });
    return t.done();
  }),
  e('pterodactyl', 'wild', 'prehistoric', () => {
    const t = m('pterodactyl', { rig: 'bird' });
    const b = '#7a7f6a', w = '#c9925a';
    t.ball([0.17, 0.16, 0.34], [0, 0.5, 0], { color: b })
      .rod([0, 0.53, 0.12], [0, 0.6, 0.2], 0.08, b)
      .ball([0.12, 0.12, 0.16], [0, 0.62, 0.24], { color: b })
      .cone([0.06, 0.3, 0.05], [0, 0.605, 0.45], { color: '#d9c79a', rot: [92, 0, 0] })
      .cone([0.035, 0.24, 0.08], [0, 0.69, 0.12], { color: '#c0392b', rot: [-62, 0, 0] })
      .pair((s) =>
        t.ball(0.025, [s * 0.045, 0.64, 0.28], { color: '#141010', eye: true })
          .ball([0.7, 0.025, 0.3], [s * 0.38, 0.6, -0.02], { color: w, rot: [0, s * 8, s * 25] })
          .rod([s * 0.05, 0.54, 0.08], [s * 0.68, 0.84, 0.03], 0.035, b)
          .ball([0.45, 0.02, 0.14], [s * 0.86, 0.92, -0.04], { color: w, rot: [0, s * 20, s * 25] })
          .rod([s * 0.04, 0.45, -0.12], [s * 0.08, 0.38, -0.26], 0.025, b),
      );
    return t.done();
  }),
  e('puffin', 'aviary', 'sea birds', () =>
    birdx('puffin', { height: 0.3, color: '#1e1e24', wing: '#1e1e24', beak: '#e8572a', legs: '#f0782a', tail: ['#1e1e24'] }, (p, g, H) => {
      g('beak').size = [H * 0.08, H * 0.15, H * 0.17];
      add(p, 'head', 'ball', [H * 0.07, H * 0.14, H * 0.03], [0, H * 0.11, H * 0.125], '#5a6a8a', { layer: 4 });
      bBelly(p, H, '#f6f4ee', 1.05);
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.04, H * 0.15, H * 0.17], [s * H * 0.1, H * 0.11, H * 0.03], '#ecebe6', { noInk: true, layer: 3 });
    }),
  ),
  e('pug', 'pets', 'dog breeds', () => dog('pug', { s: 0.42, fat: 1.3, legK: 0.75, headK: 1.3, snoutK: 0.35, color: '#d9b98a', snout: '#2a2522', earColor: '#2a2522', earK: 0.55, tail: 'curl' })),
  e('puppy', 'pets', 'dog breeds', () => dog('puppy', { s: 0.4, headK: 1.5, legK: 0.8, snoutK: 0.6, color: '#e3b067', belly: '#f6e6c8', snout: '#f6e6c8', earColor: '#c58f45', earK: 1.15, tailAngle: 50 })),
  e('rabbit', 'pets', 'small pets', () =>
    beast('rabbit', { color: '#a8876a', belly: '#f2ece4', bodyShape: 'ball', body: [0.3, 0.2, 0.2], legL: 0.03, legW: 0.05, neckL: 0.03, neckLean: 40, neckW: 0.1, head: [0.12, 0.11, 0.1], snout: { len: 0.04, h: 0.05, w: 0.06, color: '#efe8e0' }, nose: '#e88a9a', ears: 'long', earSize: 0.13, tail: 'stub', tailColor: '#f6f4f0', acc: [(p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.4, H * 0.62, L * 0.45], [s * W * 0.32, -H * 0.14, -L * 0.18], '#a8876a');
      for (const n of ['earL', 'earR']) add(p, n, 'ball', [0.026, 0.1, 0.02], [0, 0.055, 0.013], '#f0b0b8', { noInk: true });
    }] }),
  ),
  e('raccoon', 'wild', 'forest', () =>
    beast('raccoon', { color: '#8a8580', belly: '#c8c4be', body: [0.55, 0.26, 0.25], legL: 0.1, legW: 0.06, legColor: '#3a3634', neckL: 0.05, neckLean: 50, neckW: 0.12, head: [0.17, 0.13, 0.16], snout: { len: 0.07, h: 0.06, w: 0.06, color: '#efebe5' }, ears: 'pointy', earSize: 0.07, tail: 'fluffy', tailAngle: 120, acc: [bandit('#2a2725'), brows('#efebe5', 0.9), tailRings('#2a2725', 4, 'fluffy'), tailTip('#2a2725', 'fluffy')] }),
  ),
  e('ram', 'farm', 'sheep', () =>
    beast('ram', { color: '#eee8da', bodyShape: 'ball', body: [0.95, 0.55, 0.55], legL: 0.3, legW: 0.08, legColor: '#e2d8cc', hoof: '#3a3330', hoofH: 0.05, neckL: 0.12, neckLean: 45, neckW: 0.2, head: [0.3, 0.22, 0.2], headColor: '#e8dccf', snout: { len: 0.12, h: 0.13, w: 0.12, color: '#e2d2c2' }, nose: '#8a6a60', ears: 'side', earSize: 0.09, tail: 'stub', acc: [tuft('#eee8da'), (p, d) => {
      const [hl, hh, hw] = d.head;
      for (const s of [1, -1]) add(p, 'head', 'torus', [hh * 1.2, hh * 1.2, hw * 0.3], [s * hw * 0.52, hh * 0.25, -hl * 0.05], '#b89a6a', { srot: [0, 90, 0], tube: 0.36 });
    }] }),
  ),
  e('raptor', 'aviary', 'birds of prey', () =>
    birdx('raptor', { height: 0.75, color: '#4a3424', wing: '#3e2a1c', beak: '#f2c230', legs: '#f2c230', tail: ['#f4f2ee'] }, (p, g, H) => {
      g('head').color = col('#f6f4ee');
      bHook(p, g, H, 1.25);
      add(p, 'head', 'box', [H * 0.2, H * 0.035, H * 0.08], [0, H * 0.18, H * 0.08], '#f6f4ee', { round: 0.8, layer: 4 });
      for (const s of ['L', 'R']) add(p, 'leg' + s, 'ball', [H * 0.1, H * 0.14, H * 0.1], [0, -H * 0.03, 0], '#4a3424');
    }),
  ),
  e('rat', 'wild', 'rodents', () =>
    beast('rat', { color: '#7a6a5e', belly: '#c8bcb0', body: [0.2, 0.09, 0.1], legL: 0.018, legW: 0.022, legColor: '#e0b0b0', neckL: 0.01, neckLean: 50, neckW: 0.05, head: [0.07, 0.055, 0.06], snout: { len: 0.04, h: 0.03, w: 0.032 }, nose: '#e88a9a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.032, undefined, '#f0b0b8'), ropeTail('#e0a8a8', [0.012, 0.01, 0.008], [[0, -0.01, -0.1], [0.02, -0.04, -0.18], [0.06, -0.05, -0.25], [0.1, -0.045, -0.29]])] }),
  ),
  e('rattlesnake', 'wild', 'reptiles', () =>
    fx(snake('rattlesnake', { length: 1.4, color: '#c2a06a', bands: '#6e4f2e', girth: 0.07 }), (p) => {
      const t = 1.4 * 0.07;
      for (let i = 0; i < 4; i++) add(p, 'seg0', 'ball', [t * (0.8 - i * 0.08), t * 0.45, t * (0.8 - i * 0.08)], [0, -t * 0.5 - i * t * 0.38, 0], '#e8d8b0', { layer: 1 });
    }),
  ),
  e('red panda', 'wild', 'forest', () =>
    beast('red panda', { color: '#c2502a', legColor: '#2a1e1a', belly: '#3a2620', body: [0.5, 0.22, 0.22], legL: 0.1, legW: 0.06, neckL: 0.05, neckLean: 50, neckW: 0.12, head: [0.16, 0.14, 0.17], headColor: '#c8582c', snout: { len: 0.05, h: 0.06, w: 0.08, color: '#f4efe8' }, nose: '#1e1a18', ears: 'pointy', earSize: 0.07, earColor: '#f4efe8', tail: 'fluffy', tailAngle: 115, acc: [tailRings('#8a3418', 4, 'fluffy'), cheeks('#f4efe8', 0.9), brows('#f4efe8', 0.8)] }),
  ),
  e('redbird', 'aviary', 'garden birds', () =>
    birdx('redbird', { height: 0.22, color: '#d42a2a', wing: '#b51f1f', beak: '#f08a3a', legs: '#8a6a5a', tail: ['#b51f1f'] }, (p, g, H) => {
      coneP(p, 'head', [0, H * 0.2, -H * 0.02], [0, H * 0.38, -H * 0.13], H * 0.12, '#d42a2a');
      add(p, 'head', 'ball', [H * 0.17, H * 0.12, H * 0.08], [0, H * 0.09, H * 0.1], '#1e1a1a', { layer: 3, noInk: true });
      g('beak').size = [H * 0.12, H * 0.11, H * 0.1];
    }),
  ),
  e('reindeer', 'wild', 'polar', () =>
    beast('reindeer', { color: '#7a5a40', belly: '#e8dcc8', body: [1.4, 0.65, 0.5], legL: 0.65, legW: 0.1, hoof: '#2a2018', hoofH: 0.08, neckL: 0.35, neckLean: 40, neckW: 0.24, head: [0.42, 0.24, 0.21], snout: { len: 0.16, h: 0.16, w: 0.14, color: '#5a4030' }, nose: '#2a2018', ears: 'side', earSize: 0.12, tail: 'stub', tailColor: '#f4efe6', acc: [antlers('#c8b08a', 0.75, 1.1), chest('#efe6d6', 1.1, 0.1)] }),
  ),
  e('rhinoceros', 'wild', 'savanna', () =>
    beast('rhinoceros', { color: '#8d8a85', body: [2.6, 1.3, 1.1], legL: 0.55, legW: 0.3, hoof: '#6a6762', hoofH: 0.12, neckL: 0.25, neckLean: 75, neckW: 0.6, head: [0.85, 0.5, 0.45], snout: { len: 0.25, h: 0.35, w: 0.35, shape: 'box' }, nose: '#5a5752', ears: 'pointy', earSize: 0.2, tail: 'tuft', acc: [ani.stripes('#7a7772', 2), (p, d) => {
      const [hl, hh] = d.head;
      coneP(p, 'head', [0, hh * 0.1, hl * 0.56], [0, hh * 1.5, hl * 0.64], 0.24, '#c9c0b0', { layer: 4 });
      coneP(p, 'head', [0, hh * 0.42, hl * 0.32], [0, hh * 1.0, hl * 0.32], 0.16, '#c9c0b0', { layer: 4 });
    }] }),
  ),
  e('roadrunner', 'aviary', 'ground birds', () =>
    birdx('roadrunner', { height: 0.42, color: '#7a6a52', wing: '#5a4a3a', beak: '#3a3430', legs: '#6a7a8a', tail: ['#4a3e30', '#5a4a3a', '#4a3e30'] }, (p, g, H) => {
      bTail(g, H, 2.2, 3);
      g('tail').rot = [-72, 0, 0];
      bLegs(g, H, 1.35);
      const b = g('beak');
      b.size = [b.size[0], b.size[1] * 1.7, b.size[2]];
      b.off = [0, H * 0.1, 0];
      for (const z of [0, -0.05]) coneP(p, 'head', [0, H * 0.2, H * z], [0, H * 0.33, H * (z - 0.1)], H * 0.07, '#4a3e30');
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.02, H * 0.05, H * 0.08], [s * H * 0.11, H * 0.13, -H * 0.02], '#4a8ad0', { noInk: true, layer: 5 });
      bBelly(p, H, '#e8dcc4');
      for (const w of ['wingL', 'wingR']) for (const z of [0.05, -0.03, -0.11]) add(p, w, 'ball', [H * 0.08, H * 0.03, H * 0.03], [0, H * (z * 0.5), H * z], '#efe6d2', { noInk: true, layer: 4 });
    }),
  ),
  e('robin (bird)', 'aviary', 'garden birds', () =>
    birdx('robin (bird)', { height: 0.2, color: '#5a5048', wing: '#4a4038', beak: '#e8b020', legs: '#8a6a50', tail: ['#3a3430'] }, (p, g, H) => {
      g('head').color = col('#2e2a28');
      bBelly(p, H, '#e2622a', 1.12);
      for (const s of [1, -1]) add(p, 'head', 'torus', [H * 0.06, H * 0.065, H * 0.02], [s * H * 0.1, H * 0.16, H * 0.06], '#f6f4ee', { srot: [0, 90, 0], tube: 0.3, noInk: true, layer: 5 });
    }),
  ),
  e('rodent', 'wild', 'rodents', () =>
    beast('rodent', { color: '#8a6a4a', belly: '#e2d2b8', bodyShape: 'ball', body: [0.16, 0.1, 0.1], legL: 0.015, legW: 0.02, neckL: 0.01, neckLean: 40, neckW: 0.05, head: [0.07, 0.06, 0.065], snout: { len: 0.03, h: 0.032, w: 0.036, color: '#b89a7a' }, nose: '#e08a8a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.03, undefined, '#e8b0a8'), buckTeeth('#fff6dc', { len: 0.03, h: 0.032, w: 0.036 }), ropeTail('#d8a8a0', 0.008, [[0, -0.02, -0.07], [0.02, -0.055, -0.12], [0.06, -0.06, -0.16]])] }),
  ),
  e('rottweiler', 'pets', 'dog breeds', () => dog('rottweiler', { s: 0.95, fat: 1.2, color: '#1f1c1c', snout: '#9a5a2a', hoof: '#9a5a2a', hoofH: 0.1, earK: 0.7, tail: 'stub', acc: [brows('#9a5a2a', 0.8), chest('#9a5a2a', 0.6, -0.1)] })),
  e('sabre toothed tiger', 'wild', 'prehistoric', () =>
    feline('sabre toothed tiger', { s: 0.95, fat: 1.15, color: '#c49a5e', belly: '#e8d4b0', snout: '#ecdcc0', tail: 'stub', acc: [ani.spots('#9a7040', 6), teeth('#f6f2e4', { len: 0.14 * 0.95, h: 0.16 * 0.95, w: 0.24 * 0.95 }, 1, 3)] }),
  ),
  e('salamander', 'wild', 'amphibians', () =>
    beast('salamander', { color: '#1e1e22', body: [0.17, 0.045, 0.05], legL: 0.018, legW: 0.016, neckL: 0.006, neckLean: 80, neckW: 0.035, head: [0.045, 0.03, 0.042], snout: { len: 0.012, h: 0.018, w: 0.034 }, ears: 'side', earSize: 0.002, tail: 'stub', acc: [coneTail(0.16, 0.035, '#1e1e22', 0.02), (p, d) => {
      const [L, H, W] = d.body;
      for (let i = 0; i < 6; i++) add(p, 'body', 'ball', [W * 0.3, H * 0.25, L * 0.12], [(i % 2 ? 1 : -1) * W * 0.22, H * 0.4, L * (0.3 - i * 0.12)], '#f2c21e', { noInk: true, layer: 3 });
      for (const s of [1, -1]) add(p, 'head', 'ball', [0.012, 0.008, 0.014], [s * 0.012, 0.016, 0.0], '#f2c21e', { noInk: true, layer: 3 });
    }] }),
  ),
  e('salmon', 'sea', 'river fish', () =>
    fish('salmon', { length: 0.75, color: '#8a9aa8', belly: '#f2a08e', fin: '#7a8a96', shape: 'shark', extras: (p, { L, H, W }) => {
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.12, H * 0.32, L * 0.02];
      for (let i = 0; i < 8; i++) add(p, 'body', 'ball', [W * 0.08, L * 0.015, L * 0.015], [(i % 2 ? 1 : -1) * W * 0.3, H * (0.3 - (i % 3) * 0.05), L * (0.2 - i * 0.05)], '#3a4450', { noInk: true, layer: 4 });
    } }),
  ),
  e('scallop', 'sea', 'shellfish', () => {
    const t = m('scallop');
    t.ball([0.1, 0.09, 0.024], [0, 0.06, -0.008], { color: '#d9824a' })
      .ball([0.1, 0.09, 0.02], [0, 0.06, 0], { color: '#f2a46a' })
      .box([0.05, 0.02, 0.016], [0, 0.02, 0], { color: '#e8904e', round: 0.4 })
      .each(9, (i) => {
        const b = (-72 + i * 18) * D;
        t.rod([0, 0.02, 0.006], [0.046 * Math.sin(b), 0.06 + 0.042 * Math.cos(b), 0.004], 0.006, '#e07a3a', { noInk: true });
      });
    return t.done();
  }),
  e('schnauzer', 'pets', 'dog breeds', () => dog('schnauzer', { s: 0.72, color: '#7d7d82', snout: '#d0d0d0', snoutShape: 'box', legColor: '#a8a8ac', ears: 'pointy', earK: 0.8, tail: 'stub', tailAngle: 30, acc: [ani.beard('#d8d8d8'), brows('#d8d8d8')] })),
  e('scorpion', 'bugs', 'spiders', () =>
    bug('scorpion', { length: 0.11, color: '#b07a30', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p) => {
      chainP(p, 'body', [[0, 0, -0.055], [0, 0.02, -0.075], [0, 0.045, -0.08], [0, 0.068, -0.068], [0, 0.08, -0.045], [0, 0.078, -0.026]], [0.016, 0.015, 0.014, 0.013, 0.012], '#b07a30');
      add(p, 'body', 'ball', [0.017, 0.017, 0.017], [0, 0.074, -0.018], '#9a6a28');
      coneP(p, 'body', [0, 0.07, -0.012], [0, 0.055, 0.002], 0.008, '#3a2a1a');
      for (const s of [1, -1]) {
        chainP(p, 'body', [[s * 0.012, -0.004, 0.016], [s * 0.035, -0.008, 0.04], [s * 0.03, -0.01, 0.062]], 0.009, '#b07a30');
        add(p, 'body', 'ball', [0.022, 0.015, 0.032], [s * 0.03, -0.01, 0.075], '#a06a28');
        rodP(p, 'body', [s * 0.034, -0.01, 0.088], [s * 0.03, -0.01, 0.105], 0.007, '#a06a28');
        rodP(p, 'body', [s * 0.024, -0.012, 0.088], [s * 0.022, -0.012, 0.1], 0.005, '#a06a28');
      }
    } }),
  ),
  e('sea anemone', 'sea', 'reef life', () => {
    const t = m('sea anemone');
    t.cyl([0.1, 0.09, 0.1], [0, 0.045, 0], { color: '#c0406a', taper: 0.85 })
      .cyl([0.11, 0.015, 0.11], [0, 0.092, 0], { color: '#e05a88' })
      .ball([0.03, 0.012, 0.03], [0, 0.1, 0], { color: '#7a2040' })
      .each(14, (i) => {
        const a = (i / 14) * 2 * Math.PI, r = 0.03 + (i % 2) * 0.014, x = Math.cos(a), z = Math.sin(a), h = 0.15 + (i % 3) * 0.015;
        t.rod([x * r, 0.095, z * r], [x * (r + 0.03), h, z * (r + 0.03)], 0.013, '#f07aa0').rod([x * (r + 0.03), h, z * (r + 0.03)], [x * (r + 0.055) - z * 0.012, h + 0.04, z * (r + 0.055) + x * 0.012], 0.011, '#f8b8cc');
      })
      .ball([0.025, 0.036, 0.06], [0.12, 0.12, 0.06], { color: '#f07a1e' })
      .each(2, (i) => t.ball([0.027, 0.038, 0.008], [0.12, 0.12, 0.072 - i * 0.025], { color: '#f8f6f0', noInk: true }))
      .cone([0.008, 0.03, 0.034], [0.12, 0.12, 0.02], { color: '#f07a1e', rot: [90, 0, 0] })
      .ball(0.008, [0.132, 0.128, 0.078], { color: '#141414', eye: true });
    return t.done();
  }),
  e('sea cucumber', 'sea', 'reef life', () => {
    const t = m('sea cucumber', { view: 'side' });
    t.capsule([0.09, 0.27, 0.085], [0, 0.045, 0], { color: '#7a3a2a', rot: [90, 0, 0] })
      .each(10, (i) => t.cone([0.018, 0.025, 0.018], [((i % 3) - 1) * 0.022, 0.09 - Math.abs((i % 3) - 1) * 0.008, 0.1 - i * 0.022], { color: '#b8603a' }))
      .each(6, (i) => {
        const a = (i / 6) * 2 * Math.PI, end: Vec3 = [Math.cos(a) * 0.032, 0.05 + Math.sin(a) * 0.032, 0.185];
        t.rod([0, 0.05, 0.14], end, 0.008, '#f2d080').ball(0.016, end, { color: '#f2d080' });
      });
    return t.done();
  }),
  e('sea snail', 'sea', 'reef life', () => {
    const t = m('sea snail', { view: 'side' });
    const sh = '#e8c89a', bd = '#c8a888';
    t.capsule([0.035, 0.09, 0.022], [0, 0.011, 0.01], { color: bd, rot: [90, 0, 0] })
      .each(4, (i) => t.ball(0.05 - i * 0.011, [0, 0.03 + i * 0.016, -0.005 - i * 0.013], { color: i % 2 ? '#c8864a' : sh }))
      .cone([0.016, 0.03, 0.016], [0, 0.098, -0.06], { color: sh, rot: [-40, 0, 0] })
      .rod([0, 0.025, 0.035], [0, 0.04, 0.06], 0.008, '#b88a6a')
      .pair((s) => t.rod([s * 0.006, 0.02, 0.045], [s * 0.014, 0.03, 0.065], 0.004, bd).ball(0.005, [s * 0.014, 0.031, 0.066], { color: '#1a1414', eye: true }));
    return t.done();
  }),
  e('sea snake', 'sea', 'sea reptiles', () =>
    fx(snake('sea snake', { length: 1.7, color: '#1f2a44', bands: '#d8e4ee', girth: 0.055 }), (p) => {
      const t = 1.7 * 0.055;
      add(p, 'seg0', 'ball', [t * 0.3, t * 1.4, t * 2.2], [0, -t * 0.5, -t * 0.6], '#1f2a44', { layer: 1 });
    }),
  ),
  e('sea sponge', 'sea', 'reef life', () => {
    const t = m('sea sponge');
    t.ball([0.17, 0.05, 0.15], [0, 0.02, 0], { color: '#9a8a7a' });
    for (const [x, z, h, w] of [[0, 0, 0.19, 0.075], [0.058, 0.03, 0.14, 0.062], [-0.052, 0.028, 0.12, 0.058]] as Array<[number, number, number, number]>) {
      t.cyl([w, h, w], [x, h / 2 + 0.01, z], { color: '#e8c440', taper: 1.12 }).cyl([w * 0.72, 0.012, w * 0.72], [x, h + 0.011, z], { color: '#7a5a1a' });
      t.each(3, (i) => t.ball(0.011, [x + (i - 1) * w * 0.25, h * (0.35 + i * 0.18), z + w * 0.5], { color: '#b8901e', noInk: true }));
    }
    return t.done();
  }),
  e('sea turtle', 'sea', 'sea reptiles', () => {
    const t = m('sea turtle', { view: 'side' });
    const sk = '#9aa86a';
    t.ball([0.78, 0.3, 1.0], [0, 0.27, 0], { color: '#6b7a3a' })
      .ball([0.72, 0.12, 0.92], [0, 0.17, 0.02], { color: '#e8dcb0' })
      .ball([0.22, 0.2, 0.28], [0, 0.3, 0.6], { color: sk })
      .pair((s) =>
        t.ball(0.05, [s * 0.09, 0.34, 0.68], { color: '#141414', eye: true })
          .ball([0.62, 0.05, 0.22], [s * 0.5, 0.17, 0.25], { color: sk, rot: [0, s * 35, -s * 12] })
          .ball([0.3, 0.05, 0.15], [s * 0.3, 0.15, -0.42], { color: sk, rot: [0, -s * 30, 0] }),
      );
    for (const [x, z] of [[0, 0.25], [0, 0], [0, -0.25], [0.2, 0.12], [-0.2, 0.12], [0.2, -0.13], [-0.2, -0.13]]) t.ball([0.2, 0.06, 0.2], surf([0, 0.27, 0], [0.39, 0.15, 0.5], [x * 2.2, 1, z * 1.6], 0.93), { color: '#8a9a4a', noInk: true });
    return t.done();
  }),
  e('sea urchin', 'sea', 'reef life', () => {
    const t = m('sea urchin');
    t.ball([0.065, 0.055, 0.065], [0, 0.03, 0], { color: '#3a2050' });
    for (let i = 0, n = 34; i < n; i++) {
      const y = 1 - ((i + 0.5) / n) * 1.3, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const d: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
      t.cone([0.008, 0.05, 0.008], [d[0] * 0.052, 0.03 + d[1] * 0.052, d[2] * 0.052], { color: '#5a3a7a', rot: aim(d) });
    }
    return t.done();
  }),
  e('seagull', 'aviary', 'sea birds', () =>
    birdx('seagull', { height: 0.38, color: '#f4f4f2', wing: '#a8b0b8', beak: '#f2c230', legs: '#f0b080', tail: ['#f4f4f2'] }, (p, g, H) => {
      for (const w of ['wingL', 'wingR']) {
        const q = g(w);
        q.size = [q.size[0], q.size[1], q.size[2] * 1.3];
        add(p, w, 'ball', [H * 0.07, H * 0.1, H * 0.16], [0, -H * 0.02, -H * 0.22], '#2a2726', { layer: 4 });
      }
      add(p, 'beak', 'ball', [H * 0.03, H * 0.03, H * 0.03], [0, H * 0.08, H * 0.015], '#d6453a', { noInk: true, layer: 4 });
    }),
  ),
  e('seahorse', 'sea', 'reef life', () => {
    const t = m('seahorse', { view: 'side' });
    const c = '#f0a030', d = '#d07a1e';
    t.ball([0.026, 0.03, 0.034], [0, 0.135, 0.008], { color: c })
      .rod([0, 0.132, 0.02], [0, 0.126, 0.058], 0.011, c)
      .cone([0.012, 0.016, 0.012], [0, 0.155, 0.0], { color: d })
      .rod([0, 0.128, -0.004], [0, 0.104, 0.008], 0.022, c)
      .ball([0.032, 0.062, 0.046], [0, 0.08, 0.012], { color: c })
      .ball([0.005, 0.024, 0.018], [0, 0.088, -0.014], { color: '#f8d070' })
      .rod([0, 0.055, 0.004], [0, 0.032, -0.008], 0.022, c)
      .rod([0, 0.032, -0.008], [0, 0.014, 0.0], 0.017, c)
      .rod([0, 0.014, 0.0], [0, 0.01, 0.016], 0.013, c)
      .rod([0, 0.01, 0.016], [0, 0.022, 0.024], 0.01, c)
      .rod([0, 0.022, 0.024], [0, 0.03, 0.016], 0.008, c)
      .pair((s) => t.ball(0.008, [s * 0.012, 0.139, 0.016], { color: '#141414', eye: true }))
      .each(4, (i) => t.ball([0.034, 0.003, 0.042], [0, 0.06 + i * 0.013, 0.014], { color: d, noInk: true }));
    return t.done();
  }),
  e('seal', 'sea', 'sea mammals', () => {
    const t = m('seal', { view: 'side' });
    const c = '#7a8088';
    t.ball([0.5, 0.42, 1.2], [0, 0.22, -0.05], { color: c })
      .ball([0.36, 0.26, 0.55], [0, 0.15, -0.62], { color: c })
      .ball([0.38, 0.36, 0.4], [0, 0.33, 0.36], { color: c })
      .ball([0.32, 0.3, 0.36], [0, 0.46, 0.5], { color: c })
      .ball([0.18, 0.14, 0.16], [0, 0.43, 0.68], { color: '#9aa0a8' })
      .ball([0.06, 0.04, 0.03], [0, 0.46, 0.76], { color: '#1e1c1c' })
      .pair((s) => {
        t.ball([0.13, 0.04, 0.24], [s * 0.1, 0.08, -0.92], { color: c, rot: [0, s * 20, 0] })
          .ball([0.07, 0.08, 0.05], [s * 0.11, 0.51, 0.62], { color: '#141414', eye: true })
          .ball([0.06, 0.2, 0.13], [s * 0.25, 0.1, 0.3], { color: c, rot: [-20, 0, s * 35] });
        for (const [y, z] of [[0.5, 0.2], [0.2, -0.1], [0.6, -0.3], [0.1, 0.35], [0.4, -0.5]]) t.ball(0.05, surf([0, 0.22, -0.05], [0.25, 0.21, 0.6], [s, y, z], 0.97), { color: '#4a5058', noInk: true });
      });
    return t.done();
  }),
  e('seal pup', 'sea', 'sea mammals', () => {
    const t = m('seal pup', { view: 'side' });
    const w = '#f6f4ee';
    t.ball([0.36, 0.32, 0.6], [0, 0.17, -0.02], { color: w })
      .ball([0.22, 0.16, 0.25], [0, 0.11, -0.33], { color: w })
      .ball([0.3, 0.28, 0.28], [0, 0.3, 0.28], { color: w })
      .ball([0.14, 0.1, 0.1], [0, 0.26, 0.41], { color: '#f2eee6' })
      .ball([0.045, 0.03, 0.02], [0, 0.285, 0.46], { color: '#1e1c1c' })
      .pair((s) =>
        t.ball([0.08, 0.03, 0.14], [s * 0.06, 0.05, -0.46], { color: '#e8e4dc', rot: [0, s * 20, 0] })
          .ball([0.07, 0.08, 0.04], [s * 0.08, 0.34, 0.39], { color: '#141414', eye: true })
          .ball([0.02, 0.02, 0.01], [s * 0.07, 0.355, 0.41], { color: '#ffffff', eye: true })
          .ball([0.05, 0.14, 0.1], [s * 0.17, 0.08, 0.12], { color: w, rot: [-20, 0, s * 35] }),
      );
    return t.done();
  }),
  e('shark', 'sea', 'sharks', () =>
    fish('shark', { length: 3.6, color: '#7a8a9a', belly: '#f0f0f0', shape: 'shark', extras: (p, { L, H, W }) => {
      add(p, 'body', 'ball', [W * 0.5, H * 0.08, L * 0.14], [0, -H * 0.2, L * 0.3], '#3a2024', { layer: 4 });
      for (const x of [-0.12, 0, 0.12]) coneP(p, 'body', [x * W, -H * 0.16, L * 0.36], [x * W, -H * 0.24, L * 0.365], W * 0.07, '#f8f6f0', { layer: 5 });
      for (let i = 0; i < 4; i++) for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.03, H * 0.32, L * 0.01], [s * W * 0.43, -H * 0.02, L * (0.2 - i * 0.03)], '#4a5866', { noInk: true, layer: 4 });
    } }),
  ),
  e('sheepdog', 'pets', 'dog breeds', () => dog('sheepdog', { s: 0.82, color: '#1e1e22', belly: '#f4f2ee', snout: '#f4f2ee', hoof: '#f4f2ee', hoofH: 0.075, ears: 'pointy', earK: 0.8, tail: 'fluffy', tailAngle: 140, acc: [blaze('#f4f2ee'), chest('#f4f2ee', 1.0, 0.0), tailTip('#f4f2ee', 'fluffy')] })),
  e('shetland sheepdog', 'pets', 'dog breeds', () => dog('shetland sheepdog', { s: 0.5, color: '#c07a32', belly: '#f4f2ee', snout: '#f4f2ee', snoutK: 1.25, hoof: '#f4f2ee', hoofH: 0.05, ears: 'pointy', earK: 0.75, tail: 'fluffy', tailAngle: 150, acc: [blaze('#f4f2ee'), coat('#c07a32', 0.7), chest('#f4f2ee', 1.4, 0.2), tailTip('#f4f2ee', 'fluffy')] })),
  e('shiba inu', 'pets', 'dog breeds', () => dog('shiba inu', { s: 0.58, color: '#d9822b', belly: '#f5e6cc', snout: '#f5e6cc', hoof: '#f5e6cc', hoofH: 0.05, ears: 'pointy', earK: 0.85, tail: 'curl', acc: [cheeks('#f5e6cc', 1.1), chest('#f5e6cc', 0.8, 0)] })),
  e('shih tzu', 'pets', 'dog breeds', () => dog('shih tzu', { s: 0.36, legK: 0.6, color: '#f2eee6', headColor: '#d4a05a', earColor: '#c08a48', earK: 1.5, snoutK: 0.4, snout: '#f2eee6', tail: 'fluffy', tailAngle: 20, tailColor: '#d4a05a', acc: [coat('#f2eee6'), tuft('#d4a05a', 1.1), bow('#e04a6a')] })),
  e('shrimp', 'sea', 'shellfish', () => {
    const t = m('shrimp', { view: 'side' });
    const c = '#f08a6a', d = '#e06a4a';
    const seg: Vec3[] = [[0, 0.058, 0.03], [0, 0.06, 0.0], [0, 0.056, -0.028], [0, 0.046, -0.052], [0, 0.032, -0.068]];
    t.ball([0.04, 0.042, 0.065], [0, 0.05, 0.055], { color: c })
      .each(5, (i) => t.ball([0.036 - i * 0.004, 0.036 - i * 0.004, 0.032], seg[i], { color: i % 2 ? d : c }))
      .cone([0.008, 0.04, 0.008], [0, 0.068, 0.1], { color: c, rot: [80, 0, 0] })
      .pair((s) => {
        t.ball([0.022, 0.006, 0.03], [s * 0.01, 0.018, -0.08], { color: c, rot: [-30, s * 25, 0] })
          .ball(0.01, [s * 0.012, 0.065, 0.085], { color: '#141414', eye: true })
          .rod([s * 0.008, 0.058, 0.09], [s * 0.04, 0.09, 0.2], 0.003, d)
          .rod([s * 0.04, 0.09, 0.2], [s * 0.06, 0.08, 0.24], 0.0025, d);
        t.each(4, (i) => t.rod([s * 0.01, 0.035, 0.05 - i * 0.018], [s * 0.022, 0.003, 0.055 - i * 0.02], 0.004, d));
      });
    return t.done();
  }),
  e('silkworm', 'bugs', 'grubs and worms', () => {
    const t = m('silkworm', { view: 'side' });
    t.ball([0.09, 0.006, 0.15], [0, 0.003, 0], { color: '#5aa553' });
    [0.018, 0.022, 0.024, 0.024, 0.024, 0.023, 0.021, 0.018].forEach((T, i) => t.ball([T, T, 0.016], [0, 0.006 + T / 2 + Math.sin(i * 0.8) * 0.002, 0.05 - i * 0.013], { color: '#f2efe2' }));
    t.ball([0.016, 0.016, 0.014], [0, 0.017, 0.062], { color: '#e8e2d0' })
      .pair((s) => t.ball(0.004, [s * 0.005, 0.02, 0.068], { color: '#141414', eye: true }).ball([0.004, 0.008, 0.006], [s * 0.011, 0.024, 0.037], { color: '#8a7a6a', noInk: true }))
      .cone([0.004, 0.01, 0.004], [0, 0.03, -0.044], { color: '#c8a888', rot: [-30, 0, 0] })
      .each(3, (i) => t.pair((s) => t.ball(0.005, [s * 0.008, 0.008, 0.04 - i * 0.012], { color: '#d8d0bc' })));
    return t.done();
  }),
  e('silverback gorilla', 'wild', 'jungle', () => {
    const t = m('silverback gorilla');
    const k = '#26262a', f = '#3a3a40';
    t.pair((s) => t.rod([s * 0.22, 0.62, -0.32], [s * 0.3, 0.35, -0.14], 0.22, k).rod([s * 0.3, 0.35, -0.14], [s * 0.26, 0.06, -0.22], 0.18, k).ball([0.18, 0.08, 0.3], [s * 0.26, 0.04, -0.14], { color: f }));
    t.ball([0.78, 0.8, 1.0], [0, 0.88, -0.08], { color: k, rot: [-28, 0, 0] })
      .ball([0.62, 0.38, 0.72], [0, 1.12, -0.25], { color: '#a8a8b0', rot: [-28, 0, 0] })
      .ball([0.66, 0.62, 0.45], [0, 1.0, 0.25], { color: k })
      .pair((s) => t.rod([s * 0.38, 1.12, 0.25], [s * 0.5, 0.6, 0.4], 0.25, k).rod([s * 0.5, 0.6, 0.4], [s * 0.46, 0.1, 0.45], 0.21, k).ball([0.2, 0.16, 0.22], [s * 0.46, 0.08, 0.47], { color: f }))
      .ball([0.36, 0.42, 0.36], [0, 1.38, 0.36], { color: k })
      .ball([0.26, 0.24, 0.3], [0, 1.55, 0.3], { color: k })
      .box([0.3, 0.07, 0.1], [0, 1.43, 0.53], { color: f, round: 0.8 })
      .ball([0.24, 0.18, 0.14], [0, 1.28, 0.53], { color: f })
      .pair((s) => t.ball([0.04, 0.03, 0.02], [s * 0.07, 1.38, 0.555], { color: '#120e0c', eye: true }).ball([0.04, 0.025, 0.02], [s * 0.04, 1.31, 0.6], { color: '#121212', noInk: true }));
    return t.done();
  }),
  e('skunk', 'wild', 'forest', () =>
    beast('skunk', { color: '#1e1e24', bodyShape: 'ball', body: [0.4, 0.2, 0.22], legL: 0.05, legW: 0.05, neckL: 0.03, neckLean: 55, neckW: 0.1, head: [0.13, 0.1, 0.11], snout: { len: 0.05, h: 0.045, w: 0.05 }, nose: '#141414', ears: 'side', earSize: 0.03, tail: 'stub', acc: [roundEars(0.035), (p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.2, H * 0.25, L * 0.85], [s * W * 0.16, H * 0.38, -L * 0.02], '#f6f6f2', { noInk: true, layer: 3 });
      const [hl, hh, hw] = d.head;
      add(p, 'head', 'ball', [hw * 0.2, hh * 0.3, hl * 0.62], [0, hh * 0.5, hl * 0.1], '#f6f6f2', { noInk: true, layer: 3 });
      add(p, 'body', 'ball', [0.16, 0.32, 0.15], [0, H * 0.4 + 0.12, -L * 0.5], '#1e1e24', { srot: [-25, 0, 0], layer: -1 });
      add(p, 'body', 'ball', [0.07, 0.3, 0.152], [0, H * 0.4 + 0.12, -L * 0.5], '#f6f6f2', { srot: [-25, 0, 0], layer: 0, noInk: true });
    }] }),
  ),
  e('sloth', 'wild', 'jungle', () => {
    const t = m('sloth');
    const c = '#9a8670';
    t.cyl([0.14, 1.15, 0.14], [-0.6, 0.575, 0], { color: '#7a5a3e' })
      .rod([-0.6, 0.98, 0], [0.5, 1.02, 0], 0.08, '#8a6a4a')
      .ball([0.52, 0.28, 0.3], [0, 0.72, 0], { color: c })
      .each(4, (i) => {
        const x = i < 2 ? 0.17 : -0.17, z = i % 2 ? 0.09 : -0.09;
        t.rod([x, 0.78, z], [x * 1.1, 0.99, z * 0.4], 0.07, c).rod([x * 1.1 + 0.01, 1.05, z * 0.4], [x * 1.1 + 0.035, 0.99, z * 0.4 + 0.035], 0.016, '#3a2e24');
      })
      .ball([0.21, 0.19, 0.2], [0.33, 0.66, 0.05], { color: c })
      .ball([0.17, 0.14, 0.07], [0.34, 0.65, 0.13], { color: '#efe4cf' })
      .pair((s) => t.ball([0.065, 0.03, 0.02], [0.34 + s * 0.04, 0.665, 0.16], { color: '#4a3a2a', rot: [0, 0, s * 20], noInk: true }).ball(0.02, [0.34 + s * 0.04, 0.665, 0.172], { color: '#111111', eye: true }))
      .ball([0.035, 0.022, 0.02], [0.34, 0.63, 0.17], { color: '#2a2020' });
    return t.done();
  }),
  e('slug', 'bugs', 'snails and slugs', () => {
    const t = m('slug', { view: 'side' });
    const c = '#c8752a';
    t.capsule([0.026, 0.1, 0.022], [0, 0.011, 0], { color: c, rot: [90, 0, 0] })
      .ball([0.028, 0.02, 0.04], [0, 0.021, 0.015], { color: '#b0602a' })
      .ball(0.005, [0.012, 0.024, 0.008], { color: '#5a3a1e', noInk: true })
      .pair((s) => t.rod([s * 0.005, 0.02, 0.04], [s * 0.01, 0.042, 0.052], 0.004, c).ball(0.006, [s * 0.01, 0.043, 0.053], { color: '#3a2a1e', eye: true }).rod([s * 0.005, 0.01, 0.045], [s * 0.008, 0.012, 0.058], 0.003, c));
    return t.done();
  }),
  e('snail', 'bugs', 'snails and slugs', () => {
    const t = m('snail', { view: 'side' });
    const b = '#c9b49a';
    t.capsule([0.03, 0.1, 0.024], [0, 0.012, 0.005], { color: b, rot: [90, 0, 0] })
      .rod([0, 0.015, 0.04], [0, 0.03, 0.055], 0.022, b)
      .ball([0.032, 0.07, 0.07], [0, 0.055, -0.01], { color: '#a0602a' })
      .pair((s) =>
        t.torus([0.05, 0.05, 0.012], [s * 0.013, 0.057, -0.008], { color: '#c8864a', rot: [0, 90, 0] })
          .ball([0.008, 0.016, 0.016], [s * 0.016, 0.058, -0.006], { color: '#7a4a1e' })
          .rod([s * 0.005, 0.035, 0.058], [s * 0.01, 0.06, 0.068], 0.004, b)
          .ball(0.007, [s * 0.01, 0.061, 0.069], { color: '#3a2a1e', eye: true }),
      );
    return t.done();
  }),
  e('snake', 'wild', 'reptiles', () => snake('snake', { length: 1.6, color: '#4a9a3a', bands: '#2e6a24', girth: 0.07 })),
  e('snapping turtle', 'wild', 'reptiles', () =>
    turtle('snapping turtle', 1.5, '#4a4a32', '#5a5a3a', '#3e3e28', 1.2, [coneTail(0.25, 0.05, '#5a5a3a', 0.04), (p, d) => {
      const [L, H, W] = d.body;
      for (const dir of [[0, 1, 0.5], [0, 1, 0], [0, 1, -0.5], [0.6, 0.8, 0.3], [-0.6, 0.8, 0.3], [0.6, 0.8, -0.3], [-0.6, 0.8, -0.3]] as Vec3[]) {
        const b = surf([0, H * 0.25, 0], [W * 0.625, H * 0.55, L * 0.55], dir, 0.98);
        coneP(p, 'body', b, [b[0], b[1] + H * 0.35, b[2] - H * 0.12], H * 0.3, '#3a3a26', { layer: 5 });
      }
      const [hl, hh] = d.head;
      coneP(p, 'head', [0, hh * 0.05, hl * 0.6], [0, -hh * 0.35, hl * 0.78], hh * 0.35, '#3a3a26', { layer: 4 });
    }]),
  ),
  e('snow leopard', 'wild', 'mountains', () =>
    feline('snow leopard', { s: 0.62, color: '#d6d3cb', belly: '#f0eee8', snout: '#f0eee8', eyes: '#a8c8c0', tail: 'fluffy', tailAngle: 128, acc: [ani.spots('#4a4a4a', 12), (p, d) => {
      const [L, , W] = d.body;
      const q = p.list.find((x) => x.name === 'tail')!;
      q.size = [W * 0.42, L * 0.78, W * 0.42];
      q.off = [0, L * 0.36, 0];
      for (let i = 0; i < 5; i++) add(p, 'tail', 'torus', [W * 0.44, W * 0.44, L * 0.05], [0, L * (0.12 + i * 0.13), 0], '#4a4a4a', { srot: [90, 0, 0], tube: 0.4, noInk: true, layer: 0 });
      const [hl, hh, hw] = d.head;
      for (const [x, y] of [[0.15, 0.4], [-0.15, 0.4], [0, 0.48], [0.3, 0.25], [-0.3, 0.25]]) add(p, 'head', 'ball', [hw * 0.08, hh * 0.08, hl * 0.06], [x * hw, y * hh, hl * 0.35], '#4a4a4a', { noInk: true, layer: 4 });
    }] }),
  ),
  e('sparrow', 'aviary', 'garden birds', () =>
    birdx('sparrow', { height: 0.15, color: '#a07a52', wing: '#7a5a3a', beak: '#4a3a2a', legs: '#c8a080', tail: ['#6a4a2e'] }, (p, g, H) => {
      bBelly(p, H, '#cfc6b6');
      add(p, 'head', 'ball', [H * 0.2, H * 0.12, H * 0.2], [0, H * 0.2, -H * 0.01], '#8a8a8a', { noInk: true, layer: 3 });
      add(p, 'head', 'ball', [H * 0.12, H * 0.1, H * 0.06], [0, H * 0.03, H * 0.1], '#2a2522', { noInk: true, layer: 3 });
      g('beak').size = [H * 0.09, H * 0.09, H * 0.08];
      for (const w of ['wingL', 'wingR']) for (const z of [0.04, -0.04]) add(p, w, 'ball', [H * 0.09, H * 0.025, H * 0.14], [0, H * (0.02 - z), H * z], '#4a3420', { noInk: true, layer: 4 });
    }),
  ),
  e('sperm whale', 'sea', 'whales', () =>
    whale('sperm whale', { L: 14, hk: 0.27, color: '#5f6670', belly: '#8a909a', head: 'box', dorsal: 'hump' }, (t, { L, H, y }) => {
      t.each(3, (i) => t.ball([H * 0.12, H * 0.08, L * 0.04], [0, y + H * 0.36 - i * H * 0.04, -L * (0.28 + i * 0.06)], { color: '#5f6670' }));
      t.pair((s) => t.each(3, (i) => t.capsule([0.05, 1.4, 0.05], [s * H * 0.42, y + H * (0.1 - i * 0.12), L * (0.02 - i * 0.06)], { color: '#4a5058', rot: [80, 0, 0], noInk: true })));
    }),
  ),
  e('spider', 'bugs', 'spiders', () =>
    bug('spider', { length: 0.06, color: '#2a2628', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      for (const q of p.list) if (q.name.startsWith('leg')) { q.size = [q.size[0] * 1.3, q.size[1] * 1.7, q.size[2] * 1.3]; q.off = [0, q.off![1] * 1.7, 0]; }
      const b = p.list.find((x) => x.name === 'body')!;
      b.at = [0, L * 0.45, 0];
      for (const s of [1, -1]) rodP(p, 'body', [s * L * 0.05, -L * 0.04, L * 0.15], [s * L * 0.07, -L * 0.1, L * 0.24], L * 0.035, '#2a2628');
      add(p, 'abdomen', 'ball', [L * 0.12, L * 0.16, L * 0.04], [0, L * 0.1, -L * 0.3], '#c0392b', { noInk: true, layer: 3 });
    } }),
  ),
  e('squid', 'sea', 'octopus and squid', () => {
    const t = m('squid');
    const c = '#e8a8a0', d = '#d07a72';
    t.capsule([0.075, 0.24, 0.075], [0, 0.25, 0], { color: c })
      .cone([0.07, 0.07, 0.07], [0, 0.39, 0], { color: c })
      .pair((s) => t.ball([0.07, 0.08, 0.015], [s * 0.045, 0.34, 0], { color: d, rot: [0, 0, s * 30] }).ball([0.032, 0.032, 0.02], [s * 0.032, 0.125, 0.012], { color: '#1a1414', eye: true }))
      .ball([0.065, 0.055, 0.065], [0, 0.12, 0], { color: c })
      .each(5, (i) => t.ball(0.012, [((i % 3) - 1) * 0.02, 0.2 + i * 0.03, 0.036], { color: d, noInk: true }))
      .each(8, (i) => {
        const a = (i / 8) * 2 * Math.PI + 0.3, x = Math.cos(a), z = Math.sin(a);
        t.rod([x * 0.015, 0.1, z * 0.015], [x * 0.07, 0.015, z * 0.07], 0.012, c).rod([x * 0.07, 0.015, z * 0.07], [x * 0.1, 0.008, z * 0.1 + 0.01], 0.009, d);
      })
      .pair((s) => t.rod([s * 0.01, 0.1, 0.02], [s * 0.045, 0.008, 0.16], 0.007, c).ball([0.02, 0.012, 0.03], [s * 0.046, 0.008, 0.17], { color: d }));
    return t.done();
  }),
  e('squirrel', 'wild', 'forest', () =>
    beast('squirrel', { color: '#b8642e', belly: '#f2e2c8', body: [0.2, 0.11, 0.1], legL: 0.035, legW: 0.03, neckL: 0.03, neckLean: 30, neckW: 0.06, head: [0.075, 0.07, 0.065], snout: { len: 0.025, h: 0.035, w: 0.04 }, nose: '#3a2a20', ears: 'pointy', earSize: 0.04, tail: 'stub', acc: [(p) => {
      add(p, 'body', 'ball', [0.08, 0.13, 0.08], [0, 0.03, -0.12], '#b8642e', { srot: [-30, 0, 0], layer: -1 });
      add(p, 'body', 'ball', [0.09, 0.14, 0.085], [0, 0.12, -0.14], '#c06e36', { layer: -1 });
      add(p, 'body', 'ball', [0.085, 0.11, 0.09], [0, 0.19, -0.1], '#c8783e', { srot: [40, 0, 0], layer: -1 });
    }] }),
  ),
  e('st bernard', 'pets', 'dog breeds', () =>
    dog('st bernard', { s: 1.05, fat: 1.3, headK: 1.2, color: '#f4efe6', headColor: '#9a4a1e', snout: '#f4efe6', earColor: '#9a4a1e', snoutK: 0.8, tailAngle: 145, acc: [saddle('#9a4a1e', 0.25, 1.1), blaze('#f4efe6'), dogCollar(1.05, '#c0392b', undefined, 1.3), (p, d) => {
      const [L, H] = d.body;
      add(p, 'body', 'cyl', [0.11, 0.15, 0.11], [0, -H * 0.05, L * 0.55], '#8a5a2a', { srot: [0, 0, 90], layer: 4 });
      for (const x of [-0.05, 0.05]) add(p, 'body', 'torus', [0.12, 0.12, 0.012], [x, -H * 0.05, L * 0.55], '#55595e', { srot: [0, 90, 0], tube: 0.2, layer: 5 });
    }] }),
  ),
  e('stag', 'wild', 'forest', () =>
    beast('stag', { color: '#9a5a32', belly: '#e8d8c0', body: [1.25, 0.55, 0.45], legL: 0.6, legW: 0.08, hoof: '#2a2018', hoofH: 0.07, neckL: 0.42, neckLean: 28, neckW: 0.2, head: [0.38, 0.19, 0.17], snout: { len: 0.14, h: 0.12, w: 0.11, color: '#7a4628' }, nose: '#2a2018', ears: 'long', earSize: 0.15, tail: 'stub', tailColor: '#f2ece2', acc: [antlers('#c8a878', 0.85, 0.9), chest('#7a4628', 0.9, 0.15)] }),
  ),
  e('starfish', 'sea', 'reef life', () => {
    const t = m('starfish');
    const C: Vec3 = [0, 0.064, 0];
    t.ball([0.045, 0.045, 0.024], C, { color: '#e8742a' }).each(5, (i) => {
      const a = (90 + i * 72) * D, dx = Math.cos(a), dy = Math.sin(a);
      t.cyl([0.034, 0.072, 0.02], [dx * 0.036, C[1] + dy * 0.036, 0], { color: '#e8742a', taper: 0.3, rot: [0, 0, a / D - 90] });
      t.each(3, (j) => t.ball(0.007, [dx * (0.016 + j * 0.017), C[1] + dy * (0.016 + j * 0.017), 0.011 - j * 0.0015], { color: '#f8b06a', noInk: true }));
    });
    return t.done();
  }),
  e('steed', 'farm', 'horses', () =>
    horse('steed', { s: 0.85, color: '#ebe7df', mane: '#cfc8bc', acc: [(p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.08, H * 0.82, L * 0.32], [0, H * 0.14, L * 0.06], '#b8282e', { layer: 3 });
      add(p, 'body', 'ball', [W * 0.72, H * 0.3, L * 0.26], [0, H * 0.48, L * 0.06], '#6b3a1f', { layer: 4 });
      for (const s of [1, -1]) {
        rodP(p, 'body', [s * W * 0.5, H * 0.1, L * 0.08], [s * W * 0.52, -H * 0.55, L * 0.08], 0.025, '#6b3a1f', { layer: 4 });
        add(p, 'body', 'torus', [0.1, 0.08, 0.02], [s * W * 0.52, -H * 0.6, L * 0.08], '#e2b23a', { srot: [0, 90, 0], layer: 4 });
      }
      const [hl, hh, hw] = d.head;
      add(p, 'head', 'torus', [hw * 1.08, hh * 1.0, hl * 0.06], [0, -hh * 0.05, hl * 0.42], '#6b3a1f', { tube: 0.15, layer: 4 });
    }] }),
  ),
  e('stegosaurus', 'wild', 'prehistoric', () =>
    beast('stegosaurus', { color: '#6f8f4a', belly: '#c8c890', body: [3.4, 1.6, 1.3], legL: 0.9, legW: 0.4, hoof: '#4a5a30', hoofH: 0.15, neckL: 0.7, neckLean: 105, neckW: 0.42, head: [0.55, 0.32, 0.3], snout: { len: 0.2, h: 0.18, w: 0.2 }, nose: '#2a3a1e', ears: 'side', earSize: 0.01, tail: 'stub', acc: [(p, d) => {
      const [L, H] = d.body;
      for (let i = 0; i < 9; i++) {
        const z = L * (0.28 - i * 0.082), h = 0.55 + 0.75 * Math.sin((Math.PI * (i + 0.5)) / 9);
        const top = (H / 2) * Math.sqrt(Math.max(0, 1 - (z / (L / 2)) ** 2));
        add(p, 'body', 'ball', [0.1, h, h * 0.7], [i % 2 ? 0.1 : -0.1, top + h * 0.36, z], '#c8642a', { layer: -1 });
      }
      chainP(p, 'body', [[0, H * 0.05, -L * 0.42], [0, H * 0.18, -L * 0.62], [0, H * 0.12, -L * 0.82], [0, -H * 0.02, -L * 0.98]], [0.75, 0.5, 0.3], '#6f8f4a', { layer: -1 });
      for (const z of [0.9, 0.97]) for (const s of [1, -1]) coneP(p, 'body', [s * 0.08, H * 0.05, -L * z], [s * 0.55, H * 0.38, -L * (z + 0.06)], 0.14, '#efe6cf', { layer: -1 });
    }] }),
  ),
  e('stingray', 'sea', 'rays', () =>
    turned('stingray', 'front', [0, 0.85, 0], [38, 0, 0], (s, r) => {
      const c = '#7a6a5a';
      s('ball', [1.0, 0.14, 0.95], [0, 0, 0], c);
      s('ball', [0.42, 0.2, 0.55], [0, 0.03, 0.05], c);
      s('ball', [0.92, 0.1, 0.88], [0, -0.04, 0], '#eeeae2', { noInk: true });
      for (const k of [1, -1]) {
        s('ball', [0.08, 0.06, 0.07], [k * 0.1, 0.12, 0.18], '#2a2420', { role: 'eye', noInk: true });
        for (const [x, z] of [[0.3, 0.1], [0.25, -0.15], [0.12, -0.3], [0.38, -0.05]]) s('ball', [0.05, 0.03, 0.05], [k * x, 0.06, z], '#5a4a3e', { noInk: true });
      }
      r([0, 0, -0.45], [0, 0, -1.4], 0.045, c);
      s('cyl', [0.03, 0.14, 0.03], [0, 0.035, -0.8], '#d8d0c0', { taper: 0, srot: [-80, 0, 0] });
    }),
  ),
  e('stork', 'aviary', 'water birds', () => {
    const t = m('stork', { view: 'side', rig: 'bird' });
    const w = '#f6f4ee', r = '#d8402e';
    t.ball([0.24, 0.26, 0.44], [0, 0.66, -0.02], { color: w, name: 'body' })
      .ball([0.12, 0.08, 0.16], [0, 0.66, -0.3], { color: w, name: 'tail', parent: 'body' })
      .rod([0, 0.72, 0.14], [0, 0.9, 0.2], 0.08, w, { parent: 'body' })
      .ball([0.1, 0.1, 0.13], [0, 0.95, 0.22], { color: w, name: 'head', parent: 'body', pivot: [0, 0.88, 0.2] })
      .cone([0.04, 0.24, 0.035], [0, 0.93, 0.39], { color: r, rot: [95, 0, 0], parent: 'head' })
      .pair((s) => {
        const wing = s > 0 ? 'wingL' : 'wingR', leg = s > 0 ? 'legL' : 'legR';
        t.ball(0.025, [s * 0.04, 0.97, 0.25], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.06, 0.2, 0.42], [s * 0.12, 0.68, -0.06], { color: w, name: wing, parent: 'body', pivot: [s * 0.1, 0.75, 0.1] })
          .ball([0.065, 0.14, 0.3], [s * 0.125, 0.64, -0.2], { color: '#1e1e22', parent: wing })
          .rod([s * 0.06, 0.58, 0], [s * 0.06, 0.02, 0.02], 0.025, r, { name: leg, parent: 'body', pivot: [s * 0.06, 0.58, 0] })
          .box([0.04, 0.02, 0.1], [s * 0.06, 0.01, 0.05], { color: r, round: 0.8, parent: leg });
      });
    return t.done();
  }),
  e('sunfish', 'sea', 'ocean fish', () => {
    const t = m('sunfish', { view: 'side' });
    const c = '#9aa3ac', l = '#c8ced4';
    t.ball([0.7, 2.4, 2.4], [0, 2.1, 0], { color: c })
      .ball([0.66, 1.2, 1.9], [0, 1.55, 0.1], { color: l, noInk: true })
      .ball([0.14, 1.5, 0.55], [0, 3.6, -0.55], { color: c, rot: [-12, 0, 0] })
      .ball([0.14, 1.5, 0.55], [0, 0.76, -0.55], { color: c, rot: [12, 0, 0] })
      .ball([0.3, 1.9, 0.45], [0, 2.1, -1.15], { color: l })
      .pair((s) => t.ball(0.18, [s * 0.28, 2.45, 0.85], { color: '#141414', eye: true }).ball([0.08, 0.35, 0.22], [s * 0.33, 2.15, 0.35], { color: c, rot: [-20, 0, 0] }))
      .ball([0.2, 0.16, 0.12], [0, 2.0, 1.2], { color: '#7a838c' });
    return t.done();
  }),
  e('swan', 'aviary', 'water birds', () => {
    const t = m('swan', { view: 'side', rig: 'bird' });
    const w = '#f8f8f4';
    t.ball([0.42, 0.36, 0.75], [0, 0.42, -0.05], { color: w, name: 'body' })
      .ball([0.2, 0.16, 0.2], [0, 0.55, -0.42], { color: w, name: 'tail', parent: 'body', rot: [30, 0, 0] })
      .rod([0, 0.52, 0.22], [0, 0.72, 0.3], 0.1, w, { parent: 'body' })
      .rod([0, 0.72, 0.3], [0, 0.92, 0.24], 0.09, w, { parent: 'body' })
      .rod([0, 0.92, 0.24], [0, 1.06, 0.26], 0.085, w, { parent: 'body' })
      .ball([0.11, 0.11, 0.16], [0, 1.1, 0.3], { color: w, name: 'head', parent: 'body', pivot: [0, 1.04, 0.26] })
      .cone([0.06, 0.14, 0.05], [0, 1.08, 0.43], { color: '#f0782a', rot: [100, 0, 0], parent: 'head' })
      .ball([0.05, 0.05, 0.05], [0, 1.11, 0.36], { color: '#1e1e22', parent: 'head' })
      .pair((s) => {
        const wing = s > 0 ? 'wingL' : 'wingR', leg = s > 0 ? 'legL' : 'legR';
        t.ball(0.025, [s * 0.045, 1.12, 0.32], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.12, 0.3, 0.6], [s * 0.18, 0.52, -0.1], { color: '#eeeeea', rot: [12, 0, -s * 15], name: wing, parent: 'body', pivot: [s * 0.16, 0.6, 0.15] })
          .rod([s * 0.08, 0.28, 0], [s * 0.09, 0.04, 0.02], 0.04, '#2a2726', { name: leg, parent: 'body', pivot: [s * 0.08, 0.28, 0] })
          .box([0.09, 0.025, 0.12], [s * 0.09, 0.013, 0.07], { color: '#2a2726', round: 0.8, parent: leg });
      });
    return t.done();
  }),
  e('swordfish', 'sea', 'ocean fish', () =>
    fish('swordfish', { length: 3.0, color: '#2e3e5e', belly: '#c8d0dc', fin: '#2e3e5e', shape: 'shark', extras: (p, { L, H, W }) => {
      coneP(p, 'body', [0, 0, L * 0.35], [0, -H * 0.02, L * 0.76], W * 0.22, '#3a4a6a', { layer: 3 });
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.2, H * 0.9, L * 0.02];
    } }),
  ),
  e('tabby', 'pets', 'cats', () =>
    feline('tabby', { s: 0.21, hk: 1.35, earK: 1.5, color: '#9a8670', belly: '#f2eee6', snout: '#f2eee6', tailAngle: 50, eyes: '#8ac040', nose: '#e0909a', acc: [ani.stripes('#4e4236', 5), tailRings('#4e4236', 3, 'long'), (p, d) => {
      const [hl, hh, hw] = d.head;
      for (const x of [-0.14, 0, 0.14]) add(p, 'head', 'capsule', [hw * 0.06, hh * 0.28, hl * 0.06], [x * hw, hh * 0.45, hl * 0.28], '#4e4236', { srot: [-30, 0, 0], noInk: true, layer: 4 });
    }] }),
  ),
  e('tadpole', 'wild', 'amphibians', () => {
    const t = m('tadpole', { view: 'side' });
    t.ball([0.032, 0.034, 0.038], [0, 0.018, 0.01], { color: '#3a3a2e' })
      .ball([0.006, 0.022, 0.058], [0, 0.019, -0.032], { color: '#6a6a52', rot: [-6, 0, 0] })
      .pair((s) => t.ball(0.008, [s * 0.012, 0.024, 0.022], { color: '#d8d0b0' }).ball(0.0045, [s * 0.0145, 0.025, 0.025], { color: '#141414', eye: true }));
    return t.done();
  }),
  e('tarantula', 'bugs', 'spiders', () =>
    bug('tarantula', { length: 0.12, color: '#4a3428', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      for (const q of p.list.filter((x) => x.name.startsWith('leg'))) {
        q.size = [L * 0.065, L * 0.5, L * 0.065];
        q.off = [0, -L * 0.22, 0];
        q.color = col('#3a2a20');
        add(p, q.name, 'ball', [L * 0.08, L * 0.06, L * 0.08], [0, -L * 0.2, 0], '#d8822a', { layer: 3 });
      }
      p.list.find((x) => x.name === 'body')!.at = [0, L * 0.4, 0];
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.42, L * 0.38, L * 0.5];
      a.color = col('#5a3e2c');
    } }),
  ),
  e('tasmanian devil', 'wild', 'australia', () =>
    beast('tasmanian devil', { color: '#1e1c1c', body: [0.5, 0.22, 0.22], legL: 0.06, legW: 0.06, neckL: 0.03, neckLean: 60, neckW: 0.13, head: [0.18, 0.15, 0.17], snout: { len: 0.06, h: 0.08, w: 0.1, color: '#2a2626' }, nose: '#e8909a', ears: 'pointy', earSize: 0.06, tail: 'stub', acc: [roundEars(0.065, '#e88a8a'), chest('#f4f2ee', 0.95, 0.05)] }),
  ),
  e('termite', 'bugs', 'crawling insects', () =>
    bug('termite', { length: 0.06, color: '#efe2c4', wings: 'none', segments: 3, extras: (p, { L }) => {
      const h = p.list.find((x) => x.name === 'head')!;
      h.color = col('#c8782a');
      h.size = [L * 0.24, L * 0.2, L * 0.26];
      for (const s of [1, -1]) rodP(p, 'head', [s * L * 0.04, -L * 0.02, L * 0.17], [s * L * 0.015, -L * 0.03, L * 0.28], L * 0.03, '#5a3a1e');
    } }),
  ),
  e('terrier', 'pets', 'dog breeds', () => dog('terrier', { s: 0.58, color: '#f2ede4', headColor: '#b8783a', earColor: '#8a5428', snout: '#f2ede4', earK: 0.7, tailAngle: 25, acc: [blaze('#f2ede4'), ani.spots('#b8783a', 3)] })),
  e('tick', 'bugs', 'spiders', () =>
    bug('tick', { length: 0.07, color: '#5a2a20', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.55, L * 0.3, L * 0.6];
      a.color = col('#7a3a2a');
      add(p, 'body', 'ball', [L * 0.26, L * 0.08, L * 0.3], [0, L * 0.12, 0], '#2a1a14', { layer: 3 });
      coneP(p, 'body', [0, 0, L * 0.15], [0, -L * 0.02, L * 0.26], L * 0.08, '#3a2018');
    } }),
  ),
  e('tiger', 'wild', 'jungle', () => feline('tiger', { s: 0.85, color: '#e07a2a', belly: '#f6efe2', snout: '#f6efe2', eyes: '#e0b030', acc: tigerAcc(0.85) })),
  e('tiger cub', 'wild', 'jungle', () => feline('tiger cub', { s: 0.42, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#e8862e', belly: '#f6efe2', snout: '#f6efe2', eyes: '#8ab0d0', acc: tigerAcc(0.42) })),
  e('tilapia', 'sea', 'river fish', () =>
    fish('tilapia', { length: 0.4, color: '#8a9a8a', belly: '#c8d0c4', fin: '#b86a5a', shape: 'round', extras: (p, { L, H }) => {
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.42, H * 0.32, L * 0.02];
      d.off = [0, H * 0.06, -L * 0.04];
    } }),
  ),
  e('toucan', 'aviary', 'tropical birds', () =>
    birdx('toucan', { height: 0.5, color: '#1a1a1e', wing: '#1a1a1e', beak: '#f29a1e', legs: '#6a8ac0', tail: ['#1a1a1e'] }, (p, g, H) => {
      const b = g('beak');
      b.size = [H * 0.13, H * 0.42, H * 0.17];
      b.off = [0, H * 0.2, 0];
      b.taper = 0.35;
      b.segs = undefined;
      add(p, 'beak', 'ball', [H * 0.05, H * 0.38, H * 0.03], [0, H * 0.2, -H * 0.075], '#e0402e', { noInk: true, layer: 4 });
      add(p, 'beak', 'ball', [H * 0.06, H * 0.08, H * 0.08], [0, H * 0.4, 0], '#1a1a1e', { layer: 4 });
      add(p, 'body', 'ball', [H * 0.3, H * 0.2, H * 0.16], [0, H * 0.12, H * 0.17], '#f6f0c8', { noInk: true, layer: 3 });
      for (const s of [1, -1]) add(p, 'head', 'torus', [H * 0.08, H * 0.08, H * 0.02], [s * H * 0.11, H * 0.16, H * 0.06], '#3a8ae0', { srot: [0, 90, 0], tube: 0.4, noInk: true, layer: 5 });
    }),
  ),
  e('tree frog', 'wild', 'amphibians', () => {
    const t = m('tree frog');
    const g = '#5ac43a';
    t.ball([0.045, 0.035, 0.055], [0, 0.025, -0.006], { color: g, rot: [-25, 0, 0] })
      .ball([0.036, 0.026, 0.03], [0, 0.018, 0.012], { color: '#f2f0e0', noInk: true })
      .ball([0.046, 0.028, 0.036], [0, 0.036, 0.02], { color: g })
      .pair((s) =>
        t.ball(0.017, [s * 0.017, 0.048, 0.024], { color: '#e02a1e' })
          .ball([0.006, 0.011, 0.004], [s * 0.02, 0.049, 0.031], { color: '#141414', eye: true })
          .ball([0.017, 0.022, 0.036], [s * 0.025, 0.016, -0.014], { color: g })
          .ball([0.014, 0.008, 0.03], [s * 0.03, 0.005, 0.0], { color: g })
          .ball(0.008, [s * 0.034, 0.004, 0.018], { color: '#f08a2a' })
          .rod([s * 0.016, 0.022, 0.022], [s * 0.02, 0.004, 0.032], 0.007, g)
          .ball(0.008, [s * 0.022, 0.004, 0.038], { color: '#f08a2a' })
          .ball([0.004, 0.012, 0.03], [s * 0.022, 0.026, -0.004], { color: '#3a6ad0', noInk: true }),
      );
    return t.done();
  }),
  e('triceratops', 'wild', 'prehistoric', () =>
    beast('triceratops', { color: '#9a7a5a', belly: '#c8b090', body: [3.4, 1.6, 1.5], legL: 0.8, legW: 0.45, hoof: '#5a4a38', hoofH: 0.15, neckL: 0.3, neckLean: 85, neckW: 0.7, head: [1.0, 0.65, 0.6], snout: { len: 0.4, h: 0.4, w: 0.35, color: '#8a6a4a', shape: 'box' }, nose: '#3a2e22', ears: 'side', earSize: 0.01, tail: 'stub', acc: [(p, d) => {
      const [hl, hh, hw] = d.head;
      add(p, 'head', 'ball', [1.8, 1.45, 0.16], [0, hh * 0.8, -hl * 0.22], '#c8642a', { srot: [-30, 0, 0], layer: -1 });
      add(p, 'head', 'ball', [1.55, 1.2, 0.14], [0, hh * 0.76, -hl * 0.18], '#a8824e', { srot: [-30, 0, 0], layer: 0, noInk: true });
      for (let i = 0; i < 7; i++) {
        const a = (-75 + i * 25) * D, b: Vec3 = [Math.sin(a) * 0.86, hh * 0.8 + Math.cos(a) * 0.62, -hl * 0.22 - Math.cos(a) * 0.36];
        coneP(p, 'head', b, [b[0] * 1.15, b[1] + Math.cos(a) * 0.18, b[2] - 0.08], 0.14, '#efe6cf', { layer: -1 });
      }
      for (const s of [1, -1]) coneP(p, 'head', [s * hw * 0.25, hh * 0.42, hl * 0.22], [s * hw * 0.42, hh * 1.5, hl * 1.35], 0.24, '#f4ecd8', { layer: 4 });
      coneP(p, 'head', [0, hh * 0.15, hl * 0.58], [0, hh * 0.6, hl * 0.72], 0.15, '#efe6cf', { layer: 4 });
      const [L, H] = d.body;
      chainP(p, 'body', [[0, H * 0.05, -L * 0.42], [0, 0, -L * 0.65], [0, -H * 0.15, -L * 0.85]], [0.6, 0.35], '#9a7a5a', { layer: -1 });
    }] }),
  ),
  e('tsetse fly', 'bugs', 'flying insects', () =>
    bug('tsetse fly', { length: 0.06, color: '#7a6a52', stripes: '#4a3e30', wings: 'clear', wingColor: '#d8d0b8', extras: (p, { L }) => {
      for (const [n, s] of [['wingL', 1], ['wingR', -1]] as const) {
        const w = p.list.find((x) => x.name === n)!;
        w.size = [L * 0.2, L * 0.02, L * 0.6];
        w.rot = [-5, s * 8, 0];
        w.off = [s * L * 0.02, L * 0.06, -L * 0.3];
      }
      rodP(p, 'head', [0, -L * 0.02, L * 0.12], [0, -L * 0.04, L * 0.3], L * 0.025, '#2a2726');
    } }),
  ),
  e('tuna (fish)', 'sea', 'ocean fish', () =>
    fish('tuna (fish)', { length: 2.0, color: '#1e2e5a', belly: '#d8dde6', fin: '#2a3a6a', shape: 'shark', extras: (p, { L, H }) => {
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.14, H * 0.4, L * 0.02];
      for (let i = 0; i < 5; i++) {
        const z = -L * (0.18 + i * 0.04), top = 0.5 * H * Math.sqrt(Math.max(0, 1 - (z / (0.39 * L)) ** 2));
        for (const s of [1, -1]) coneP(p, 'body', [0, s * top * 0.85, z], [0, s * (top * 0.85 + H * 0.12), z - L * 0.03], L * 0.025, '#f2c230', { layer: 2 });
      }
      for (const s of [1, -1]) coneP(p, 'body', [0, s * H * 0.38, -L * 0.1], [0, s * H * 0.75, -L * 0.16], L * 0.05, '#f2c230', { layer: 2 });
    } }),
  ),
  e('turkey (bird)', 'farm', 'poultry', () =>
    birdx('turkey (bird)', { height: 0.9, color: '#4a3424', wing: '#5a4030', beak: '#d8c09a', legs: '#c88a7a', comb: '#d42a2a', tail: ['#4a3424'] }, (p, g, H) => {
      const h = g('head');
      h.color = col('#7a9ac8');
      h.size = [H * 0.18, H * 0.2, H * 0.2];
      add(p, undefined, 'ball', [1.06, 0.82, 0.03], [0, 0.8, -0.37], '#e8d8b8', { layer: -7 });
      add(p, undefined, 'ball', [0.96, 0.74, 0.04], [0, 0.8, -0.355], '#2a1e16', { layer: -6 });
      add(p, undefined, 'ball', [0.86, 0.66, 0.05], [0, 0.8, -0.34], '#7a5232', { layer: -5 });
      for (let i = 0; i < 9; i++) {
        const a = (-80 + i * 20) * D;
        add(p, undefined, 'capsule', [0.012, 0.36, 0.01], [Math.sin(a) * 0.24, 0.8 + Math.cos(a) * 0.18, -0.31], '#4a3020', { srot: [0, 0, -a / D], noInk: true, layer: -4 });
      }
      for (const w of ['wingL', 'wingR']) for (const z of [0.05, -0.05, -0.15]) add(p, w, 'ball', [H * 0.08, H * 0.025, H * 0.04], [0, H * (z * 0.4 - 0.02), H * z], '#efe6d2', { noInk: true, layer: 4 });
      add(p, 'body', 'ball', [H * 0.2, H * 0.1, H * 0.1], [0, H * 0.06, H * 0.22], '#2a2018', { layer: 3 });
    }),
  ),
  e('turtle', 'wild', 'reptiles', () => turtle('turtle', 1.2, '#8a5a2a', '#8a9a52', '#b8843e')),
  e('turtle hatchling', 'wild', 'reptiles', () => turtle('turtle hatchling', 0.42, '#4a5a32', '#6a7a4a', '#5e6e3e', 1.6)),
  e('viper', 'wild', 'reptiles', () =>
    fx(snake('viper', { length: 1.0, color: '#7a6a3a', bands: '#3a2e1e', girth: 0.085 }), (_p, g) => {
      const h = g('head');
      h.size = [h.size[0] * 1.45, h.size[1], h.size[2] * 1.15];
    }),
  ),
  e('vulture', 'aviary', 'birds of prey', () =>
    birdx('vulture', { height: 0.8, color: '#3a2e28', wing: '#2a221e', beak: '#d8c8b0', legs: '#8a8078', tail: ['#2a221e'] }, (p, g, H) => {
      const h = g('head');
      h.color = col('#e8a090');
      h.size = [H * 0.17, H * 0.18, H * 0.2];
      bHook(p, g, H, 0.9, '#d8c8b0');
      add(p, 'body', 'ball', [H * 0.36, H * 0.18, H * 0.26], [0, H * 0.17, H * 0.14], '#efe8dc', { layer: 3 });
    }),
  ),
  e('walrus', 'sea', 'sea mammals', () => {
    const t = m('walrus', { view: 'side' });
    const c = '#a8705a', l = '#c89a80';
    t.ball([1.4, 1.2, 2.6], [0, 0.62, -0.25], { color: c })
      .ball([0.9, 0.62, 0.9], [0, 0.32, -1.4], { color: c })
      .ball([0.85, 0.8, 0.8], [0, 1.1, 1.0], { color: c })
      .pair((s) =>
        t.ball([0.28, 0.06, 0.45], [s * 0.22, 0.05, -1.85], { color: '#8a5a48', rot: [0, s * 25, 0] })
          .ball([0.34, 0.32, 0.32], [s * 0.16, 0.92, 1.36], { color: l })
          .cone([0.1, 0.72, 0.1], [s * 0.13, 0.5, 1.42], { color: '#f2ead8', rot: [172, 0, 0] })
          .ball(0.07, [s * 0.25, 1.22, 1.3], { color: '#141414', eye: true })
          .ball([0.16, 0.08, 0.5], [s * 0.6, 0.06, 0.55], { color: '#8a5a48', rot: [0, s * 30, 0] })
          .each(4, (i) => t.ball(0.03, [s * (0.1 + (i % 2) * 0.1), 0.88 + Math.floor(i / 2) * 0.1, 1.52], { color: '#6a4a3a', noInk: true })),
      );
    return t.done();
  }),
  e('wasp', 'bugs', 'flying insects', () =>
    bug('wasp', { length: 0.06, color: '#f2c21e', stripes: '#1e1e1e', wings: 'clear', wingColor: '#c8d8e8', extras: (p, { L }) => {
      const g = (n: string) => p.list.find((x) => x.name === n)!;
      g('body').color = col('#1e1e1e');
      const a = g('abdomen');
      a.size = [L * 0.22, L * 0.2, L * 0.55];
      a.off = [0, -L * 0.02, -L * 0.26];
      rodP(p, 'body', [0, 0, -L * 0.1], [0, -L * 0.01, -L * 0.2], L * 0.06, '#1e1e1e');
      [0.9, 0.99, 0.82].forEach((k, i) => {
        const st = g(`stripe${i}`);
        st.at = [0, -L * 0.02, -L * (0.17 + i * 0.13)];
        st.size = [L * 0.23 * k, L * 0.21 * k, L * 0.05];
      });
      coneP(p, 'body', [0, -L * 0.02, -L * 0.62], [0, -L * 0.05, -L * 0.74], L * 0.04, '#1e1e1e');
      for (const n of ['wingL', 'wingR']) { const w = g(n); w.size = [w.size[0], w.size[1], w.size[2] * 0.6]; }
    } }),
  ),
  e('weasel', 'wild', 'forest', () =>
    beast('weasel', { color: '#8a5a32', belly: '#f2e6cc', body: [0.3, 0.07, 0.07], legL: 0.03, legW: 0.025, neckL: 0.05, neckLean: 25, neckW: 0.05, head: [0.06, 0.045, 0.05], snout: { len: 0.02, h: 0.025, w: 0.03, color: '#8a5a32' }, nose: '#2a1e18', ears: 'side', earSize: 0.02, tail: 'long', tailAngle: 110, acc: [roundEars(0.022), chest('#f2e6cc', 0.9, -0.05), tailTip('#3a2a1e', 'long')] }),
  ),
  e('whale', 'sea', 'whales', () =>
    whale('whale', { L: 14, hk: 0.22, color: '#4a6a8a', belly: '#b8c8d8', head: 'round', dorsal: 'fin' }, (t, { L, H, y }) => {
      t.each(4, (i) => t.capsule([0.08, L * 0.25, 0.08], [(i - 1.5) * H * 0.12, y - H * 0.42, L * 0.2], { color: '#8a9ab0', rot: [90, 0, 0], noInk: true }));
      const top = y + H * 0.48;
      t.rod([0, top, L * 0.22], [0, top + 1.0, L * 0.22], 0.25, '#cfe8f8')
        .ball(0.7, [0, top + 1.6, L * 0.22], { color: '#cfe8f8' })
        .pair((s) => t.ball(0.5, [s * 0.45, top + 1.35, L * 0.22], { color: '#dff0fb' }))
        .ball(0.4, [0, top + 2.05, L * 0.22], { color: '#e8f6fd' });
    }),
  ),
  e('whale shark', 'sea', 'sharks', () =>
    fish('whale shark', { length: 12, color: '#3a4a5a', belly: '#e8e8e8', shape: 'shark', extras: (p, { L, H, W }) => {
      for (let i = 0; i < 28; i++) {
        const s = i % 2 ? 1 : -1, d: Vec3 = [s, ((i >> 1) % 4) * 0.35 - 0.05, (((i * 0.37) % 1) - 0.5) * 1.6];
        add(p, 'body', 'ball', [L * 0.018, L * 0.018, L * 0.018], surf([0, 0, 0], [W / 2, H / 2, L * 0.39], d, 0.98), '#f2f2ee', { noInk: true, layer: 4 });
      }
      add(p, 'body', 'ball', [W * 0.72, H * 0.06, L * 0.04], [0, -H * 0.06, L * 0.375], '#1e2630', { layer: 4 });
    } }),
  ),
  e('wildebeest', 'wild', 'savanna', () =>
    beast('wildebeest', { color: '#6e6a64', body: [1.6, 0.75, 0.6], legL: 0.7, legW: 0.09, hoof: '#2a2420', hoofH: 0.07, neckL: 0.3, neckLean: 55, neckW: 0.32, head: [0.5, 0.25, 0.22], headColor: '#3a3634', snout: { len: 0.22, h: 0.2, w: 0.2, color: '#2e2a28', shape: 'box' }, nose: '#1e1a18', ears: 'side', earSize: 0.12, tail: 'tuft', acc: [ani.mane('#1e1c1a'), ani.beard('#1e1c1a'), bullHorns('#3a3634', 0.9), hump('#6e6a64', 0.8, 0.28), ani.stripes('#5a5650', 5)] }),
  ),
  e('wolf', 'wild', 'forest', () => wolf('wolf', 1, 1, '#8a8a90', '#e8e4dc', '#5e5e66')),
  e('wolf cub', 'wild', 'forest', () => wolf('wolf cub', 0.38, 1.5, '#9a9088', '#efe8dc', '#7a7068')),
  e('wolverine', 'wild', 'forest', () =>
    beast('wolverine', { color: '#3a2a1e', body: [0.6, 0.26, 0.28], legL: 0.08, legW: 0.07, legColor: '#2a1e16', neckL: 0.04, neckLean: 55, neckW: 0.14, head: [0.16, 0.13, 0.15], snout: { len: 0.06, h: 0.07, w: 0.08, color: '#2a1e16' }, nose: '#141010', ears: 'pointy', earSize: 0.04, tail: 'fluffy', tailAngle: 130, acc: [roundEars(0.04), brows('#b8885a', 0.8), (p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.16, H * 0.32, L * 0.75], [s * W * 0.42, H * 0.06, -L * 0.05], '#b8885a', { noInk: true, layer: 3 });
    }] }),
  ),
  e('wombat', 'wild', 'australia', () =>
    beast('wombat', { color: '#7a6a5a', bodyShape: 'ball', body: [0.75, 0.42, 0.45], legL: 0.06, legW: 0.12, neckL: 0.04, neckLean: 70, neckW: 0.3, head: [0.26, 0.22, 0.26], snout: { len: 0.08, h: 0.13, w: 0.17 }, nose: '#2a2420', ears: 'pointy', earSize: 0.06, tail: 'stub', acc: [roundEars(0.065)] }),
  ),
  e('woodpecker', 'aviary', 'garden birds', () => {
    const f = birdx('woodpecker', { height: 0.3, color: '#1e1e22', wing: '#1e1e22', beak: '#4a4a4a', legs: '#6a6a6a', tail: ['#1e1e22'] }, (p, g, H) => {
      const b = g('beak');
      b.size = [H * 0.06, H * 0.2, H * 0.06];
      b.off = [0, H * 0.1, 0];
      add(p, 'head', 'ball', [H * 0.2, H * 0.12, H * 0.18], [0, H * 0.22, -H * 0.03], '#d42a2a', { layer: 3 });
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.02, H * 0.05, H * 0.16], [s * H * 0.115, H * 0.09, 0], '#f4f2ee', { noInk: true, layer: 5 });
      bBelly(p, H, '#f4f2ee');
      for (const w of ['wingL', 'wingR']) for (const z of [0.06, -0.02, -0.1]) add(p, w, 'ball', [H * 0.09, H * 0.03, H * 0.04], [0, H * (z * 0.4), H * z], '#f4f2ee', { noInk: true, layer: 4 });
    });
    return fx(f, (p) => {
      for (const q of p.list) if (!q.parent) q.at = [q.at[0], q.at[1] + 0.135, q.at[2]];
      add(p, undefined, 'cyl', [0.14, 0.4, 0.14], [0, 0.07, -0.02], '#7a5a3e', { srot: [90, 0, 0], layer: -2 });
      for (const z of [0.181, -0.221]) add(p, undefined, 'cyl', [0.11, 0.004, 0.11], [0, 0.07, z], '#c8a878', { srot: [90, 0, 0], noInk: true, layer: -2 });
    });
  }),
  e('worm', 'bugs', 'grubs and worms', () => fx(snake('worm', { length: 0.2, color: '#e8949a', bands: '#d87e86', girth: 0.08 }), (p) => cut(p, 'tongue'))),
  e('yak', 'farm', 'cattle', () =>
    beast('yak', { color: '#2e2420', body: [2.0, 1.1, 0.9], legL: 0.55, legW: 0.16, hoof: '#1a1410', hoofH: 0.1, neckL: 0.2, neckLean: 70, neckW: 0.5, head: [0.55, 0.4, 0.38], snout: { len: 0.2, h: 0.22, w: 0.25, color: '#3a302a' }, nose: '#1a1410', ears: 'side', earSize: 0.14, tail: 'fluffy', tailAngle: 150, acc: [bullHorns('#e8e0d0', 1.1), hump('#2e2420', 1.0, 0.25), tuft('#3a2e28', 1.2), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.12, H * 0.75, L * 0.95], [0, -H * 0.3, 0], '#241c18', { layer: 1 });
    }] }),
  ),
  e('yorkie', 'pets', 'dog breeds', () => dog('yorkie', { s: 0.36, legK: 0.75, color: '#4a5a6e', headColor: '#c8964a', legColor: '#c8964a', snout: '#c8964a', ears: 'pointy', earK: 0.9, earColor: '#c8964a', snoutK: 0.6, tail: 'stub', tailAngle: 30, acc: [coat('#4a5a6e', 0.9), bow('#d6453a')] })),
  e('zebra', 'wild', 'savanna', () => zebra('zebra', 0.75, 1.15, 1, '#1e1e1e')),
  e('zebra foal', 'wild', 'savanna', () => zebra('zebra foal', 0.48, 1.35, 1.2, '#4a3426')),
];
