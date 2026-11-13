/** Catalog chunk animals-b: the words in assign/animals-b.tsv. */
import { e, x, type CatalogEntry } from './types';
import { A, m, withAct, withSockets, type M } from '../dsl';
import type { Step } from '../../schema';
import { ani, beast, type AniExtra } from '../accessories';
import { bird, figure, Parts, type BirdOpts } from '../kit';
import { bug, fish, snake } from '../creatures';
import { measure, solve } from '../math';
import { col } from '../colors';
import type { FigPart, Figure, Shape, SocketKind, Vec3 } from '../types';
// the sculpted (lofted) four-legged and fish builders from animals-a, for the big hoofed animals, big cats and
// sharks here, so they match their kin there (same joint names as the beast and fish kits)
import { QK, QHORSE, limbsQ, hornsQ, maneQ, chest as chestQ, blazeQ, socksQ, onHead, FK, fSpots, fLine, sharkFace, type Q as QR, type QMark, type FIMark } from './animals-a';

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
/** A jointed chain (a trunk, a tail) through points in the parent's frame: parts prefix1..n, each turning at its
 *  base and carrying the rest, so posing prefix1 swings the whole chain and prefix2.. curl it further. */
const jchain = (p: Parts, parent: string, prefix: string, pts: Vec3[], t: number | number[], color: string | string[], o: PO = {}) => {
  let prev = parent;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], d = sub(a, pts[i + 1]), th = Array.isArray(t) ? t[i] : t;
    p.add({ name: `${prefix}${i + 1}`, parent: prev, at: i === 0 ? a : sub(pts[i - 1], a), shape: 'capsule', size: [th, Math.hypot(...d) + th, th], off: [d[0] / 2, d[1] / 2, d[2] / 2], srot: aim(d), color: col(Array.isArray(color) ? color[i % color.length] : color), layer: 2, ...o });
    prev = `${prefix}${i + 1}`;
  }
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
/** Eight jointed spider legs (leg0L..leg3R, each bending at a raised knee) from the body out and down to the
 *  ground, instead of the bug kit's straight ones. bodyY: height of the body centre. */
const spiderLegs = (p: Parts, L: number, bodyY: number, t: number, color: string | string[], span = 1) => {
  cut(p, ...[0, 1, 2, 3].flatMap((i) => [`leg${i}L`, `leg${i}R`]));
  for (let i = 0; i < 4; i++)
    for (const s of [1, -1]) {
      const z = L * (0.09 - i * 0.06), fz = L * (0.5 - i * 0.3) * span;
      jchain(p, 'body', `leg${i}${s > 0 ? 'L' : 'R'}`, [[s * L * 0.1, -L * 0.02, z], [s * L * 0.36 * span, L * 0.14, z + (fz - z) * 0.45], [s * L * 0.6 * span, -bodyY + t * 0.4, fz]], [t, t * 0.8], color);
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
/** Long hair falling from the body to the ground like a skirt (maltese, shih tzu, yorkie); bodyY is the height
 *  of the body's centre, so the hem stops just above the ground. */
const skirt = (color: string, bodyY: number, k = 1): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  const h = bodyY + H * 0.5 * k;
  add(p, 'body', 'ball', [W * 1.3, h * 1.06, L * 1.1], [0, -bodyY + h * 0.53 + bodyY * 0.03, 0], color, { layer: 1 });
};
/** A thick plumed tail (carried over the back with a negative tailAngle): pomeranian, maltese, spitz dogs. */
const plume = (k = 1, color?: string): AniExtra => (p, d) => {
  const [L, , W] = d.body;
  const q = p.list.find((x) => x.name === 'tail');
  if (!q) return;
  q.shape = 'ball';
  q.size = [W * 0.62 * k, L * 0.5 * k, W * 0.5 * k];
  q.off = [0, L * 0.22 * k, 0];
  if (color) q.color = col(color);
};
/** Bigger, rounder eyes (pugs, owlets, cubs). */
const bigEyes = (k: number): AniExtra => (p) => {
  for (const n of ['eyeL', 'eyeR', 'glintL', 'glintR']) {
    const q = p.list.find((x) => x.name === n);
    if (q) q.size = q.size.map((v) => v * k) as Vec3;
  }
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
const coneTail = (len: number, w: number, color: string, drop: number, o: PO = {}): AniExtra => (p, d) => {
  const [L, H] = d.body;
  coneP(p, 'body', [0, -H * 0.05, -L * 0.36], [0, -H * 0.05 - drop, -L * 0.36 - len], w, color, { layer: -1, ...o });
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

/**
 * A lower jaw that opens (named 'jaw', hinged at the back of the mouth), with a dark mouth, a tongue and, for
 * hunters, fangs: the kit snout becomes a muzzle that can roar, bark, yawn or bleat.
 */
const jaw = (sn: { len: number; h: number; w: number }, color?: string, fangs?: string, k = 1): AniExtra => (p, d) => {
  const [hl, hh] = d.head;
  const y0 = -hh * 0.12, front = hl * 0.35 + sn.len * 0.74, rear = hl * 0.12, Lj = front - rear;
  const c = color ?? p.list.find((x) => x.name === 'snout')?.color ?? p.list.find((x) => x.name === 'head')!.color;
  add(p, 'head', 'ball', [sn.w * 0.62, sn.h * 0.5, Lj * 0.86], [0, y0 - sn.h * 0.3, (front + rear) / 2], '#5a2226', { noInk: true, layer: 2 });
  add(p, 'head', 'ball', [sn.w * 0.8 * k, sn.h * 0.42, Lj], [0, y0 - sn.h * 0.36, rear], c, { name: 'jaw', off: [0, -sn.h * 0.08, Lj * 0.5], layer: 3 });
  add(p, 'jaw', 'ball', [sn.w * 0.42, sn.h * 0.14, Lj * 0.62], [0, sn.h * 0.1, Lj * 0.42], '#d8707a', { noInk: true, layer: 4 });
  if (fangs) for (const s of [1, -1]) {
    coneP(p, 'head', [s * sn.w * 0.22, y0 - sn.h * 0.3, front - sn.len * 0.14], [s * sn.w * 0.2, y0 - sn.h * 0.62, front - sn.len * 0.12], sn.w * 0.1, fangs, { layer: 5 });
    coneP(p, 'jaw', [s * sn.w * 0.2, -sn.h * 0.02, Lj * 0.86], [s * sn.w * 0.18, sn.h * 0.2, Lj * 0.86], sn.w * 0.08, fangs, { layer: 5 });
  }
};

/* ----- kits on top of the kits ----- */

type Tail = 'long' | 'curl' | 'tuft' | 'stub' | 'fluffy';
type Ears = 'floppy' | 'pointy' | 'long' | 'side';
interface DogO {
  s: number; color: string; legK?: number; bodyK?: number; headK?: number; snoutK?: number; fat?: number;
  snout?: string; snoutShape?: 'ball' | 'box' | 'cyl'; ears?: Ears; earK?: number; earColor?: string;
  tail?: Tail; tailColor?: string; tailAngle?: number; belly?: string; legColor?: string; headColor?: string;
  hoof?: string; hoofH?: number; nose?: string; fangs?: boolean; acc?: AniExtra[];
}
/** A dog about 0.7 m tall at s = 1. */
const dog = (key: string, o: DogO) => {
  const s = o.s, f = o.fat ?? 1, hk = o.headK ?? 1;
  return beast(key, {
    color: o.color, body: [0.72 * s * (o.bodyK ?? 1), 0.3 * s * f, 0.26 * s * f], legL: 0.3 * s * (o.legK ?? 1), legW: 0.075 * s * f,
    hoof: o.hoof, hoofH: o.hoofH, neckL: 0.13 * s, neckLean: 35, neckW: 0.15 * s * f,
    head: [0.24 * s * hk, 0.21 * s * hk, 0.2 * s * hk], snout: { len: 0.13 * s * hk * (o.snoutK ?? 1), h: 0.1 * s * hk, w: 0.11 * s * hk, color: o.snout, shape: o.snoutShape },
    nose: o.nose ?? '#231f1d', ears: o.ears ?? 'floppy', earSize: 0.13 * s * hk * (o.earK ?? 1), earColor: o.earColor,
    tail: o.tail ?? 'long', tailColor: o.tailColor, tailAngle: o.tailAngle ?? 120, belly: o.belly, legColor: o.legColor, headColor: o.headColor,
    acc: [jaw({ len: 0.13 * s * hk * (o.snoutK ?? 1), h: 0.1 * s * hk, w: 0.11 * s * hk }, o.snout, o.fangs ? '#f6f2e8' : undefined), ...(o.acc ?? [])],
  });
};
const dogCollar = (s: number, color: string, tag?: string, fat = 1) => collar(color, 0.13 * s, 0.15 * s * fat, tag);

/** A bear on all fours, about 1.5 m tall at s = 1. */
const bear = (key: string, s: number, color: string, o: { hk?: number; snout?: string; legColor?: string; acc?: AniExtra[] } = {}) => {
  const hk = o.hk ?? 1;
  return beast(key, {
    color, body: [2.0 * s, 0.95 * s, 0.8 * s], legL: 0.55 * s, legW: 0.26 * s, legColor: o.legColor, neckL: 0.32 * s, neckLean: 62, neckW: 0.45 * s,
    head: [0.5 * s * hk, 0.42 * s * hk, 0.46 * s * hk], snout: { len: 0.22 * s * hk, h: 0.18 * s * hk, w: 0.2 * s * hk, color: o.snout }, nose: '#1e1c1c',
    ears: 'pointy', earSize: 0.13 * s * hk, tail: 'stub', acc: [roundEars(0.14 * s * hk), hump(color, 0.45, 0.28), jaw({ len: 0.22 * s * hk, h: 0.18 * s * hk, w: 0.2 * s * hk }, o.snout, '#f2ece0'), ...(o.acc ?? [])],
  });
};
const panda = (key: string, s: number, hk: number) =>
  beast(key, {
    color: '#f4f2ec', legColor: '#1f1f22', bodyShape: 'ball', body: [1.2 * s, 0.75 * s, 0.75 * s], legL: 0.28 * s, legW: 0.22 * s, neckL: 0.08 * s, neckLean: 60, neckW: 0.4 * s,
    head: [0.5 * s * hk, 0.44 * s * hk, 0.5 * s * hk], snout: { len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.2 * s * hk, color: '#f4f2ec' }, nose: '#1f1f22',
    ears: 'pointy', earSize: 0.17 * s * hk, earColor: '#1f1f22', tail: 'stub',
    acc: [roundEars(0.17 * s * hk), jaw({ len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.2 * s * hk }, '#f4f2ec'), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.04, H * 1.04, L * 0.4], [0, H * 0.02, L * 0.22], '#1f1f22', { layer: 3 });
      const [hl, hh, hw] = d.head;
      for (const k of [1, -1]) add(p, 'head', 'ball', [hw * 0.3, hh * 0.42, hl * 0.26], [k * hw * 0.3, hh * 0.24, hl * 0.3], '#1f1f22', { srot: [0, 0, -k * 35], layer: 3, noInk: true });
    }],
  });

interface CatO {
  s: number; color: string; hk?: number; legK?: number; bodyK?: number; fat?: number; earK?: number; belly?: string; snout?: string; nose?: string;
  tail?: Tail; tailAngle?: number; tailColor?: string; eyes?: string; headColor?: string; legColor?: string; fangs?: string; acc?: AniExtra[];
}
/** A cat about 1.2 m tall at s = 1 (a lion); house cats are s 0.2. */
const feline = (key: string, o: CatO) => {
  const s = o.s, hk = o.hk ?? 1, f = o.fat ?? 1;
  return beast(key, {
    color: o.color, body: [1.5 * s * (o.bodyK ?? 1), 0.55 * s * f, 0.48 * s * f], legL: 0.55 * s * (o.legK ?? 1), legW: 0.15 * s * f,
    neckL: 0.16 * s, neckLean: 50, neckW: 0.3 * s * f, head: [0.42 * s * hk, 0.38 * s * hk, 0.42 * s * hk],
    snout: { len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.24 * s * hk, color: o.snout }, nose: o.nose ?? '#b5655a',
    ears: 'pointy', earSize: 0.11 * s * hk * (o.earK ?? 1), tail: o.tail ?? 'long', tailAngle: o.tailAngle ?? 125, tailColor: o.tailColor,
    belly: o.belly, headColor: o.headColor, legColor: o.legColor,
    acc: [catEyes(o.eyes ?? '#d9a520'), jaw({ len: 0.14 * s * hk, h: 0.16 * s * hk, w: 0.24 * s * hk }, o.snout, o.fangs ?? '#f6f2e4'), ...(o.acc ?? [])],
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
    acc: [ani.mane(o.mane), jaw({ len: 0.22 * s * hk, h: 0.2 * s * hk, w: 0.2 * s * hk }, o.snout), ...(o.acc ?? [])],
  });
};

const wolf = (key: string, s: number, hk: number, color: string, light: string, back: string) =>
  beast(key, {
    color, belly: light, body: [1.0 * s * (hk > 1 ? 0.75 : 1), 0.38 * s, 0.32 * s], legL: 0.48 * s * (hk > 1 ? 0.7 : 1), legW: 0.09 * s, neckL: 0.18 * s, neckLean: 40, neckW: 0.24 * s,
    head: [0.3 * s * hk, 0.24 * s * hk, 0.24 * s * hk], snout: { len: 0.2 * s * hk * (hk > 1 ? 0.65 : 1), h: 0.11 * s * hk, w: 0.12 * s * hk, color: light }, nose: '#1e1c1c',
    ears: 'pointy', earSize: 0.12 * s * hk, tail: 'fluffy', tailAngle: 145, acc: [catEyes('#d8a830'), saddle(back, 0.3), cheeks(light), jaw({ len: 0.2 * s * hk * (hk > 1 ? 0.65 : 1), h: 0.11 * s * hk, w: 0.12 * s * hk }, light, '#f6f2e8')],
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
const birdx = (key: string, o: BirdOpts, fn?: (p: Parts, g: (n: string) => FigPart, H: number) => void) =>
  fx(bird(key, o), (p, g) => {
    // tail feathers lie flat and fan out sideways, like a real tail, instead of spreading up and down
    const fs = p.list.filter((q) => q.name.startsWith('feather'));
    fs.forEach((q, i) => {
      q.rot = [0, 0, (i - (fs.length - 1) / 2) * 12];
      q.size = [o.height * 0.13, q.size[1], o.height * 0.03];
    });
    fn?.(p, g, o.height);
  });
const bBelly = (p: Parts, H: number, color: string, k = 1) => add(p, 'body', 'ball', [H * 0.38 * k, H * 0.32 * k, H * 0.36 * k], [0, -H * 0.05, H * 0.1], color, { layer: 1, noInk: true });
const bTail = (g: (n: string) => FigPart, H: number, k: number, n: number, w = 1) => {
  for (let i = 0; i < n; i++) {
    const f = g(`feather${i}`);
    f.size = [f.size[0] * w, H * 0.4 * k, f.size[2]];
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
const owl = (key: string, s: number, c: { body: string; wing: string; face: string; chest: string; spots?: string }, tufts: boolean, eyeK = 1, wx = 0.175) => {
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
      .ball([0.09 * s, 0.34 * s, 0.24 * s], [k * wx * s, 0.24 * s, -0.01 * s], { color: c.wing, name: k > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [k * 0.15 * s, 0.38 * s, 0] })
      .ball([0.07 * s, 0.035 * s, 0.09 * s], [k * 0.07 * s, 0.018 * s, 0.08 * s], { color: '#e8b830', parent: 'body' });
    if (tufts) t.cone([0.08 * s, 0.14 * s, 0.05 * s], [k * 0.12 * s, 0.68 * s, 0], { color: c.body, rot: [0, 0, -k * 24], parent: 'head' });
    if (c.spots) t.each(3, (i) => t.ball([0.03 * s, 0.022 * s, 0.02 * s], [k * (0.04 + (i % 2) * 0.03) * s, (0.3 - i * 0.07) * s, 0.155 * s], { color: c.spots!, parent: 'body', noInk: true }));
  });
  return t.done();
};

/** A fish's lower jaw that drops open (named 'jaw'), with a dark mouth and, for sharks and piranhas, teeth. */
const fishJaw = (p: Parts, d: { L: number; H: number; W: number }, color: string, teeth?: string, k = 1) => {
  const { L, H, W } = d;
  add(p, 'body', 'ball', [W * 0.46 * k, H * 0.2, L * 0.12], [0, -H * 0.17, L * 0.33], '#4a1c20', { noInk: true, layer: 3 });
  add(p, 'body', 'ball', [W * 0.52 * k, H * 0.15, L * 0.17], [0, -H * 0.22, L * 0.23], color, { name: 'jaw', off: [0, -H * 0.04, L * 0.08], layer: 4 });
  if (teeth) for (let i = 0; i < 3; i++) for (const s of [1, -1]) {
    const x = s * W * (0.05 + i * 0.07) * k, z = L * (0.075 - i * 0.012);
    coneP(p, 'jaw', [x, -H * 0.02, z], [x, H * 0.07, z], W * 0.06, teeth, { layer: 5 });
  }
};

/**
 * Whale or dolphin in profile, swimming toward +z, resting on the ground line: a smooth lofted body and a separate
 * tail stock (named 'tail', it bends to slap) carrying the flukes, flippers, a dorsal fin or hump, and a blow
 * ('spout', hidden until it blows). Box heads (sperm whales) get a narrow lower 'jaw'.
 */
interface WhaleO { L: number; hk?: number; color: string; belly?: string; head?: 'round' | 'box' | 'beak'; dorsal?: 'tall' | 'fin' | 'hump' | 'none'; fluke?: string }
const whale = (key: string, o: WhaleO, more?: (t: M, d: { L: number; H: number; y: number }) => void) => {
  const L = o.L, H = L * (o.hk ?? 0.24), y = H * 0.55, c = o.color, head = o.head ?? 'round';
  const t = m(key, { view: 'side' });
  const nose: Array<[number, number, number, number?]> = head === 'box' ? [[0.86, 0.94, 0.95, 0.02], [1, 0.85, 0.9, 0.03]] : head === 'beak' ? [[0.84, 0.8, 0.8, 0.02], [1, 0.42, 0.42, 0.04]] : [[0.85, 0.9, 0.88, -0.02], [1, 0.45, 0.42, -0.08]];
  t.loft([H * 0.95, H, L * 0.74], [0, y, L * 0.13], [[0, 0.62, 0.66, 0.06], [0.3, 0.92, 0.96, 0.01], [0.6, 1, 1, 0], ...nose], { color: c, name: 'body' })
    .loft([H * 0.62, H * 0.66, L * 0.34], [0, y + H * 0.06, -L * 0.37], [[0, 0.22, 0.34, 0.16], [0.45, 0.55, 0.62, 0.06], [1, 0.95, 1, 0]], { color: c, name: 'tail', parent: 'body', pivot: [0, y + H * 0.06, -L * 0.22] })
    .pair((s) => t.ball([L * 0.17, H * 0.06, L * 0.09], [s * L * 0.08, y + H * 0.1, -L * 0.55], { color: o.fluke ?? c, rot: [0, s * 32, 0], parent: 'tail' }));
  if (o.belly) t.ball([H * 0.8, H * 0.52, L * 0.56], [0, y - H * 0.24, L * 0.1], { color: o.belly, noInk: true, parent: 'body' });
  if (head === 'box')
    t.box([H * 0.88, H * 0.86, L * 0.36], [0, y + H * 0.06, L * 0.32], { color: c, round: 0.8, parent: 'body' })
      .rod([0, y - H * 0.42, L * 0.14], [0, y - H * 0.45, L * 0.42], H * 0.14, o.belly ?? c, { name: 'jaw', parent: 'body', pivot: [0, y - H * 0.42, L * 0.14] });
  if (head === 'beak') t.rod([0, y - H * 0.1, L * 0.42], [0, y - H * 0.13, L * 0.54], H * 0.24, c, { parent: 'body' });
  const ez = head === 'box' ? L * 0.2 : head === 'beak' ? L * 0.38 : L * 0.36;
  const ey = head === 'box' ? y - H * 0.18 : y - H * 0.06;
  t.pair((s) =>
    t.ball(H * 0.09, [s * H * (head === 'box' ? 0.44 : 0.34), ey, ez], { color: '#141414', eye: true, noInk: true, parent: 'body' })
      .ball([H * 0.06, H * 0.22, L * 0.15], [s * H * 0.48, y - H * 0.36, L * 0.16], { color: c, rot: [-35, s * 25, 0], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * H * 0.4, y - H * 0.25, L * 0.2] }),
  );
  const dz = -L * 0.06;
  if (o.dorsal === 'tall') t.cone([L * 0.035, H * 0.8, L * 0.11], [0, y + H * 0.8, dz], { color: c, rot: [-8, 0, 0], parent: 'body' });
  if (o.dorsal === 'fin') t.cone([L * 0.03, H * 0.38, L * 0.1], [0, y + H * 0.55, -L * 0.12], { color: c, rot: [-35, 0, 0], parent: 'body' });
  if (o.dorsal === 'hump') t.ball([H * 0.22, H * 0.16, L * 0.1], [0, y + H * 0.42, -L * 0.18], { color: c, parent: 'body' });
  const bz = head === 'box' ? L * 0.46 : L * 0.24, top = y + H * (head === 'box' ? 0.5 : 0.47);
  t.cyl([H * 0.12, H * 1.1, H * 0.12], [0, top + H * 0.55, bz], { color: '#dff0fa', taper: 4, name: 'spout', parent: 'body', pivot: [0, top, bz], scale: 0, noInk: true });
  more?.(t, { L, H, y });
  return t.done();
};
/** Whale moves (whale() joints: body, tail, flipperL/R, spout, jaw). */
const W = {
  blow: (text: string): Step[] => [A.par(po('spout', R0, 0.3, { scale: 1 }), A.effect('water_spray', { dur: 1.4 }), sayP(text, 1.8)), po('spout', R0, 0.5, { scale: 0 })],
  slap: (text = '!'): Step[] => [A.par(po('tail', [22, 0, 0], 0.5), po('body', [6, 0, 0], 0.5)), A.par(po('tail', [-14, 0, 0], 0.15), A.effect('water_spray', { dur: 1 }), sayP(text, 1.2)), back('tail', 'body')],
  breach: (text: string, n = 1): Step[] => [A.par(po('body', [-22, 0, 0], 0.35), po('tail', [-12, 0, 0], 0.35)), A.par(A.anim('hop', n), A.effect('water_spray', { dur: 1.2 }), sayP(text, 1.6)), back('body', 'tail')],
  swim: (n = 4): Step[] => osc([['tail', [14, 0, 0], [-14, 0, 0]], ['flipperL', [0, 0, 12], [0, 0, -8]], ['flipperR', [0, 0, -12], [0, 0, 8]]], n, 0.45),
};

/* ----- whole-figure edits ----- */

/** The same figure k times bigger or smaller (insects at their real size, a calf from its parent). */
const scaleFig = (f: Figure, k: number): Figure =>
  measure({
    ...f,
    parts: f.parts.map((q) => ({ ...q, at: q.at.map((v) => v * k) as Vec3, off: q.off ? (q.off.map((v) => v * k) as Vec3) : undefined, size: q.size.map((v) => v * k) as Vec3 })),
    sockets: f.sockets?.map((s) => ({ ...s, at: s.at.map((v) => v * k) as Vec3, size: s.size !== undefined ? s.size * k : undefined })),
  });
/** A socket riding on a part (a dog's mouth on its jaw, a saddle on a horse's back): placed at the part's joint
 *  plus an offset along the figure's axes. */
const sockOn = (f: Figure, part: string, name: string, kind: SocketKind, d: Vec3, size?: number): Figure => {
  const T = solve(f).get(part)!.T;
  return withSockets(f, [{ name, at: [T[0] + d[0], T[1] + d[1], T[2] + d[2]], kind, part, ...(size ? { size } : {}) }]);
};

/* ----- acts: the moves animals make, in the step language ----- */

const R0: Vec3 = [0, 0, 0];
/** Turn a part (degrees from rest) over dur seconds; move shifts it (metres, parent frame), scale resizes it. */
const po = (part: string, rot: Vec3, dur = 0.35, o: { move?: Vec3; scale?: number; delay?: number } = {}): Step => A.pose(part, { rot, dur, ...o });
/** Parts back to rest. */
const back = (...parts: string[]): Step => A.par(...parts.map((p) => A.pose(p, { rot: R0, move: R0, dur: 0.45 })));
/** Several parts swinging between two turns n times together (a wag, a peck, a flutter), then back to rest. */
const osc = (list: Array<[string, Vec3, Vec3]>, n: number, dur = 0.18): Step[] => [
  ...Array.from({ length: n }, (_, i) => A.par(...list.map(([p, a, b]) => po(p, i % 2 ? b : a, dur)))),
  A.par(...list.map(([p]) => po(p, R0, dur))),
];
/** The same swings as osc, as timed poses (each with its delay) to drop into one par beside an effect, a hop or a
 *  line; a par holds at most 10 steps, so keep n x parts small. */
const oscT = (list: Array<[string, Vec3, Vec3]>, n: number, dur = 0.18, t0 = 0): Step[] => [
  ...Array.from({ length: n }, (_, i) => list.map(([p, a, b]) => po(p, i % 2 ? b : a, dur, { delay: t0 + i * dur }))).flat(),
  ...list.map(([p]) => po(p, R0, dur, { delay: t0 + n * dur })),
];
/** A step that starts t seconds into its par. */
const at = (t: number, s: Step): Step => ({ ...s, delay: t }) as Step;
const sayP = (text: string, dur = 1.8): Step => A.say(text, dur);
/** Something it eats or plays with appears in front of it, and goes again. */
const treat = (word: string, ref = 'food', dist = 'close'): Step => A.spawn(ref, word, { rel: 'front', of: 'self', dist });

/** Four-legged moves (kit joints: body, neck, head, jaw, tail, earL/R, legFL/FR/BL/BR). */
const Q = {
  /** Head down to the grass, a few nibbles, head up and a sound. */
  graze: (text: string, n = 4): Step[] => [A.par(po('neck', [52, 0, 0], 0.7), po('head', [24, 0, 0], 0.7)), ...osc([['head', [34, 0, 0], [18, 0, 0]]], n, 0.22).slice(0, -1), back('neck', 'head'), sayP(text, 1.6)],
  /** Head thrown back, mouth open: a howl or a bellow. */
  howl: (text: string, hold = 2.2, jaw = true): Step[] => [A.par(po('neck', [-28, 0, 0], 0.6), po('head', [-42, 0, 0], 0.6), ...(jaw ? [po('jaw', [22, 0, 0], 0.6)] : []), sayP(text, hold + 0.4)), A.wait(hold), back('neck', 'head', ...(jaw ? ['jaw'] : []))],
  /** Head forward and down, jaws wide. */
  roar: (text: string, k = 1): Step[] => [A.par(po('neck', [14, 0, 0], 0.3), po('head', [-18, 0, 0], 0.3), po('jaw', [34 * k, 0, 0], 0.3), sayP(text, 2)), A.anim('shake'), A.wait(0.6), back('neck', 'head', 'jaw')],
  /** Up on the hind legs, front paws in the air. */
  rear: (text: string, H: number, k = 1): Step[] => [
    A.par(po('body', [-34 * k, 0, 0], 0.5, { move: [0, H * 0.12 * k, -H * 0.1 * k] }), po('legBL', [34 * k, 0, 0], 0.5), po('legBR', [34 * k, 0, 0], 0.5), po('legFL', [-50 * k, 0, 0], 0.5), po('legFR', [-30 * k, 0, 0], 0.5), po('neck', [-10, 0, 0], 0.5), sayP(text, 2)),
    ...osc([['legFL', [-75 * k, 0, 0], [-40 * k, 0, 0]], ['legFR', [-35 * k, 0, 0], [-70 * k, 0, 0]]], 4, 0.22).slice(0, -1),
    back('body', 'legBL', 'legBR', 'legFL', 'legFR', 'neck'),
  ],
  /** Sit down on the haunches, look up. */
  sit: (H: number): Step[] => [A.par(po('body', [-28, 0, 0], 0.5, { move: [0, -H * 0.16, -H * 0.06] }), po('legBL', [-62, 0, 0], 0.5), po('legBR', [-62, 0, 0], 0.5), po('legFL', [28, 0, 0], 0.5), po('legFR', [28, 0, 0], 0.5), po('neck', [-8, 0, 0], 0.5), po('head', [14, 0, 0], 0.5))],
  stand: (): Step => back('body', 'legBL', 'legBR', 'legFL', 'legFR', 'neck', 'head'),
  /** Lie down, legs tucked. */
  lie: (H: number, k = 1): Step[] => [A.par(po('body', R0, 0.6, { move: [0, -H * 0.3 * k, 0] }), po('legFL', [-80, 0, 0], 0.6), po('legFR', [-80, 0, 0], 0.6), po('legBL', [-85, 0, 0], 0.6), po('legBR', [-85, 0, 0], 0.6))],
  /** One front paw scraping the ground, kicking up dust. */
  paw: (n = 4, leg = 'legFL'): Step[] => [A.par(A.effect('dust', { dur: n * 0.18 + 0.3 }), ...oscT([[leg, [-45, 0, 0], [12, 0, 0]]], n, 0.18))],
  /** Digging with both front paws, dust (or snow) flying. */
  dig: (n = 3, fx = 'dust'): Step[] => [A.par(po('body', [16, 0, 0], 0.3), po('neck', [30, 0, 0], 0.3)), A.par(A.effect(fx, { dur: 1.2 }), ...oscT([['legFL', [-50, 0, 0], [20, 0, 0]], ['legFR', [20, 0, 0], [-50, 0, 0]]], Math.min(n, 3), 0.16)), A.par(A.effect(fx, { dur: 1.2 }), ...oscT([['legFL', [-50, 0, 0], [20, 0, 0]], ['legFR', [20, 0, 0], [-50, 0, 0]]], Math.min(n, 3), 0.16)), back('body', 'neck')],
  /** Ears up and around. */
  ears: (n = 4, a = 25): Step[] => osc([['earL', [0, 0, a], [-a * 0.6, 0, 0]], ['earR', [-a * 0.6, 0, 0], [0, 0, -a]]], n, 0.15),
  /** Tail up and swishing. */
  swish: (n = 6, up = -30, side = 35): Step[] => osc([['tail', [up, side, 0], [up, -side, 0]]], n, 0.2),
  /** Crouch low, tail twitching, then spring forward. */
  pounce: (H: number): Step[] => [A.par(po('body', [6, 0, 0], 0.6, { move: [0, -H * 0.18, -H * 0.05] }), po('legFL', [-30, 0, 0], 0.6), po('legFR', [-30, 0, 0], 0.6), po('legBL', [-40, 0, 0], 0.6), po('legBR', [-40, 0, 0], 0.6), po('neck', [30, 0, 0], 0.6)), ...osc([['tail', [-10, 30, 0], [-10, -30, 0]]], 4, 0.15).slice(0, -1), back('body', 'legFL', 'legFR', 'legBL', 'legBR', 'neck', 'tail'), A.anim('hop')],
  /** Barks: the jaw snapping open and shut with each one. */
  bark: (text: string, n = 2, k = 1): Step[] => [A.par(sayP(text, 1.6), po('head', [-10, 0, 0], 0.15)), ...osc([['jaw', [28 * k, 0, 0], [0, 0, 0]]], n * 2, 0.12), back('head')],
  /** Shake off water. */
  shakeOff: (text: string): Step[] => [A.par(A.anim('shake', 2), A.effect('water_spray', { dur: 1.2 }), sayP(text, 1.5))],
  /** Head turned to the side and tilted: listening, curious. */
  tilt: (text: string): Step[] => [A.par(po('head', [0, 25, 22], 0.35), sayP(text, 1.5)), A.wait(0.8), po('head', [0, 25, -22], 0.35), A.wait(0.6), back('head')],
  /** Head down, a charge: a few steps forward and a toss of the head. */
  butt: (text: string): Step[] => [A.par(po('neck', [40, 0, 0], 0.4), po('head', [20, 0, 0], 0.4), sayP(text, 1.5)), A.par(A.anim('hop'), po('neck', [10, 0, 0], 0.3)), po('neck', [-20, 0, 0], 0.25), back('neck', 'head')],
};

/** Bird moves (kit joints: body, head, beak, wingL/R, tail, legL/R). */
const B = {
  /** Pecking the ground n times. */
  peck: (n = 3): Step[] => osc([['body', [34, 0, 0], [8, 0, 0]], ['head', [28, 0, 0], [0, 0, 0]]], n * 2, 0.16),
  /** Wings out and up, held, folded again. */
  spread: (a = 70, hold = 1.2, text?: string): Step[] => [A.par(po('wingL', [0, 0, a], 0.35), po('wingR', [0, 0, -a], 0.35), ...(text ? [sayP(text, hold + 0.6)] : [])), A.wait(hold), back('wingL', 'wingR')],
  /** Quick flaps on the spot. */
  flutter: (n = 6, a = 60): Step[] => osc([['wingL', [0, 0, a], [0, 0, a * 0.2]], ['wingR', [0, 0, -a], [0, 0, -a * 0.2]]], n, 0.12),
  /** Head up and a song. */
  sing: (text: string, hold = 1.6): Step[] => [A.par(po('head', [-30, 0, 0], 0.3), po('tail', [-15, 0, 0], 0.3), sayP(text, hold + 0.4)), ...osc([['head', [-34, 0, 6], [-26, 0, -6]]], 4, 0.2).slice(0, -1), back('head', 'tail')],
  /** Head turned right round to look behind. */
  look: (a = 110): Step[] => [po('head', [0, a, 0], 0.4), A.wait(0.6), po('head', [0, -a * 0.6, 0], 0.5), A.wait(0.4), back('head')],
  /** Tail cocked up and flicked. */
  flick: (n = 4): Step[] => osc([['tail', [-30, 0, 0], [0, 0, 0]]], n, 0.14),
};

/** Fish moves (kit joints: body, tail, dorsal, finL/R). */
const F = {
  swish: (n = 6, a = 30): Step[] => osc([['tail', [0, a, 0], [0, -a, 0]], ['finL', [0, 0, 25], [0, 0, -10]], ['finR', [0, 0, -25], [0, 0, 10]]], n, 0.14),
  /** A leap out of the water and a splash. */
  leap: (text = '!', times = 1): Step[] => [A.par(A.anim('hop', times), A.effect('water_spray', { dur: 1.2 }), sayP(text, 1.2), ...oscT([['tail', [0, 35, 0], [0, -35, 0]]], 4, 0.14))],
  bubbles: (n = 1): Step[] => [A.spawn('bub', 'bubble', { rel: 'above', of: 'self', dist: 'close' }), A.wait(0.6 * n), A.remove('bub', 'fly_away')],
};

/** Bug moves (kit joints: body, abdomen, head, wingL/R, leg0L..leg3R, antennaL/R). */
const G = {
  /** Up into the air on whirring wings and down again. */
  buzz: (text: string, n = 3): Step[] => [A.par(A.anim('hop', 2), sayP(text, 2), ...oscT([['wingL', [0, 0, 50], [0, 0, -20]], ['wingR', [0, 0, -50], [0, 0, 20]]], n, 0.08))],
  feel: (n = 4): Step[] => osc([['antennaL', [-25, 0, 10], [10, 0, -5]], ['antennaR', [10, 0, 5], [-25, 0, -10]]], n, 0.2),
  scuttle: (n = 6, x = ''): Step[] => osc([[`leg0L${x}`, [0, 25, 0], [0, -25, 0]], [`leg1R${x}`, [0, 25, 0], [0, -25, 0]], [`leg2L${x}`, [0, 25, 0], [0, -25, 0]], [`leg0R${x}`, [0, -25, 0], [0, 25, 0]], [`leg1L${x}`, [0, -25, 0], [0, 25, 0]], [`leg2R${x}`, [0, -25, 0], [0, 25, 0]]], n, 0.12),
};

/** Snake moves (kit joints: seg0..seg7 from the tail, head, tongue). */
const S = {
  flick: (n = 3): Step[] => [...Array.from({ length: n }, () => [po('tongue', [-20, 0, 0], 0.08, { scale: 1.8 }), po('tongue', [10, 0, 0], 0.08, { scale: 0.6 })]).flat(), po('tongue', R0, 0.1, { scale: 1 })],
  strike: (text: string): Step[] => [A.par(po('seg6', [-18, 0, 0], 0.4), po('seg7', [-24, 0, 0], 0.4), po('head', [-10, 0, 0], 0.4)), A.par(po('seg6', [16, 0, 0], 0.12), po('seg7', [22, 0, 0], 0.12), po('head', [26, 0, 0], 0.12), sayP(text, 1.5)), A.wait(0.3), back('seg6', 'seg7', 'head')],
  slither: (n = 4, a = 14): Step[] => osc(Array.from({ length: 8 }, (_, i) => [`seg${i}`, [0, 0, (i % 2 ? a : -a)] as Vec3, [0, 0, (i % 2 ? -a : a)] as Vec3]), n, 0.3),
};

const act = (f: Figure, ...click: Step[][]): Figure => withAct(f, { click });

/* ----- entries ----- */

export const ENTRIES: CatalogEntry[] = [
  // A seven-spot ladybird at its real 9 mm: the red wing cases are pieces of their own so they can lift, and the
  // clear flying wings unfold from under them.
  // Real size: the vocabulary's 0.1 m would be a ladybird ten times too big.
  e('ladybug', 'bugs', 'beetles', () => {
    const t = m('ladybug', { view: 'side' });
    t.ball([0.052, 0.028, 0.064], [0, 0.02, -0.004], { color: '#1e1c1c', name: 'body' })
      .each(3, (i) => t.pair((s) => t.rod([s * 0.012, 0.012, 0.012 - i * 0.012], [s * 0.032, 0.003, 0.018 - i * 0.018], 0.005, '#1e1c1c', { parent: 'body' }).rod([s * 0.032, 0.003, 0.018 - i * 0.018], [s * 0.036, 0.0015, 0.024 - i * 0.02], 0.004, '#1e1c1c', { parent: 'body' })))
      .ball([0.034, 0.024, 0.022], [0, 0.022, 0.032], { color: '#1e1c1c', parent: 'body' })
      .ball([0.024, 0.016, 0.014], [0, 0.018, 0.044], { color: '#1e1c1c', name: 'head', parent: 'body' })
      .pair((s) => {
        const sh = s > 0 ? 'shellL' : 'shellR', w = s > 0 ? 'wingL' : 'wingR';
        t.ball([0.05, 0.004, 0.06], [s * 0.03, 0.036, -0.014], { color: '#d8e4ea', name: w, parent: 'body', pivot: [s * 0.004, 0.038, 0.016], rot: [0, s * 10, 0], scale: 0, noInk: true })
          .ball([0.032, 0.04, 0.066], [s * 0.0145, 0.026, -0.006], { color: '#d8231f', name: sh, parent: 'body', pivot: [s * 0.002, 0.044, 0.024], edge: 'sharp' })
          .ball([0.01, 0.007, 0.006], [s * 0.01, 0.026, 0.035], { color: '#f7f5ef', noInk: true, parent: 'body' })
          .ball(0.004, [s * 0.006, 0.02, 0.05], { color: '#2a2726', eye: true, parent: 'head' })
          .rod([s * 0.005, 0.024, 0.048], [s * 0.012, 0.03, 0.058], 0.003, '#1e1c1c', { parent: 'head' });
        for (const dd of [[0.55, 1, 0.6], [0.9, 0.7, -0.15], [0.45, 1, -0.75]] as Vec3[]) t.ball([0.012, 0.012, 0.012], surf([s * 0.0145, 0.026, -0.006], [0.016, 0.02, 0.033], [s * dd[0] * 0.6, dd[1], dd[2]], 0.92), { color: '#1e1c1c', noInk: true, parent: sh });
      })
      .ball([0.011, 0.011, 0.011], [0, 0.046, 0.016], { color: '#1e1c1c', noInk: true, parent: 'shellL' });
    const f = scaleFig(t.done(), 0.105);
    const wings: Array<[string, Vec3, Vec3]> = [['wingL', [0, 0, 40], [0, 0, -10]], ['wingR', [0, 0, -40], [0, 0, 10]]];
    return act(f,
      [A.par(po('shellL', [-30, 0, 40], 0.3), po('shellR', [-30, 0, -40], 0.3), po('wingL', R0, 0.3, { scale: 1 }), po('wingR', R0, 0.3, { scale: 1 })), A.par(A.anim('hop', 2), sayP('Bzz!', 1.5), ...oscT(wings, 3, 0.08)), A.par(po('wingL', R0, 0.3, { scale: 0 }), po('wingR', R0, 0.3, { scale: 0 })), back('shellL', 'shellR')],
      [A.par(A.anim('spin'), sayP('!', 1))],
    );
  }),
  e('lamb (animal)', 'farm', 'sheep', () =>
    act(beast('lamb (animal)', { color: '#f4efe4', bodyShape: 'ball', body: [0.6, 0.38, 0.38], legL: 0.25, legW: 0.065, hoof: '#4a3c36', hoofH: 0.05, legColor: '#f1e4da', neckL: 0.1, neckLean: 30, neckW: 0.14, head: [0.22, 0.18, 0.16], headColor: '#f6e6dc', snout: { len: 0.08, h: 0.1, w: 0.1, color: '#f2d6cc' }, nose: '#b88080', ears: 'side', earSize: 0.11, earColor: '#f0c8c0', tail: 'stub', acc: [tuft('#f4efe4', 1.1), jaw({ len: 0.08, h: 0.1, w: 0.1 }, '#f2d6cc')] }),
      [A.par(po('jaw', [20, 0, 0], 0.2), po('head', [-15, 0, 0], 0.2), sayP('Maa-aa!', 1.6)), A.wait(0.5), back('jaw', 'head'), A.par(A.anim('hop', 3), ...oscT([['tail', [0, 40, 0], [0, -40, 0]]], 6, 0.12))],
      Q.graze('Baa!'),
    ),
  ),
  // Beetle grubs (C-shaped, cream with a brown head) at their real 2-3 cm.
  // Real size: the vocabulary gives 0.1 m; real grubs are a few centimetres.
  e('larvae', 'bugs', 'grubs and worms', () => {
    const t = m('larvae', { view: 'side' });
    const grub = (x: number, z: number, r: number, T: number, yaw: number) => {
      const cy = 0.5 * r + T / 2;
      [210, 165, 120, 75, 30, -15].forEach((a, i) => {
        const k = r * Math.cos(a * D);
        t.ball(T * [0.8, 0.95, 1.05, 1.05, 1, 0.9][i], [x + Math.sin(yaw * D) * k, cy + r * Math.sin(a * D), z + Math.cos(yaw * D) * k], { color: i % 2 ? '#efe2c2' : '#f4ead0' });
      });
      const k = r * Math.cos(-45 * D);
      t.ball(T * 0.72, [x + Math.sin(yaw * D) * k, cy + r * Math.sin(-45 * D), z + Math.cos(yaw * D) * k], { color: '#b0622a' });
      for (const a of [60, 20]) t.pair((s) => t.rod([x + s * T * 0.3, cy + r * Math.sin(a * D) - T * 0.4, z + Math.cos(yaw * D) * r * Math.cos(a * D)], [x + s * T * 0.55, cy + r * Math.sin(a * D) - T * 0.75, z + Math.cos(yaw * D) * r * Math.cos(a * D)], T * 0.12, '#b0622a'));
    };
    grub(0, 0, 0.02, 0.019, 0);
    grub(0.05, -0.03, 0.016, 0.016, 40);
    grub(-0.05, 0.01, 0.017, 0.017, -35);
    return act(scaleFig(t.done(), 0.4), [A.par(A.anim('bounce', 3), sayP('!', 1))], [A.anim('wobble', 2)]);
  }),
  e('leech', 'bugs', 'grubs and worms', () =>
    act(scaleFig(fx(snake('leech', { length: 0.18, color: '#3a3a26', bands: '#55502e', girth: 0.1 }), (p) => cut(p, 'tongue')), 0.6),
      [...osc([['seg6', [-30, 0, 0], [10, 0, 0]], ['seg7', [-30, 0, 0], [10, 0, 0]], ['head', [0, 35, 0], [0, -35, 0]]], 6, 0.3), sayP('!', 1)],
      S.slither(4, 18),
    ),
  ),
  e('lemming', 'wild', 'polar', () =>
    act(beast('lemming', { color: '#c48a4a', bodyShape: 'ball', body: [0.12, 0.075, 0.08], legL: 0.012, legW: 0.016, neckL: 0.006, neckLean: 60, neckW: 0.04, head: [0.05, 0.045, 0.05], headColor: '#3a2e28', snout: { len: 0.016, h: 0.024, w: 0.026, color: '#4a3a30' }, nose: '#e09a9a', ears: 'pointy', earSize: 0.014, tail: 'stub', belly: '#e8d0a8', acc: [roundEars(0.016), saddle('#3a2e28'), jaw({ len: 0.016, h: 0.024, w: 0.026 }, '#4a3a30', '#f2e8c8')] }),
      [A.par(A.anim('pulse', 2), po('jaw', [30, 0, 0], 0.2), sayP('Eek! Eek!', 1.6)), back('jaw'), A.anim('hop')],
      Q.dig(8, 'snow'),
    ),
  ),
  // A ring-tailed lemur: black-and-white tail held up in a question mark. It sits up to sunbathe, arms out.
  e('lemur', 'wild', 'jungle', () =>
    act(beast('lemur', { color: '#a19c97', belly: '#f0eeea', body: [0.42, 0.17, 0.16], legL: 0.2, legW: 0.045, neckL: 0.06, neckLean: 40, neckW: 0.07, head: [0.11, 0.1, 0.1], headColor: '#f0eeea', snout: { len: 0.07, h: 0.045, w: 0.05, color: '#2a2725' }, ears: 'pointy', earSize: 0.05, earColor: '#a19c97', tail: 'stub', tailColor: '#a19c97', acc: [mask('#2a2725', 1.2), catEyes('#e8901e'), curlTail(12, 0.045, 0.035, '#f0eeea', '#2a2725'), jaw({ len: 0.07, h: 0.045, w: 0.05 }, '#2a2725')] }),
      [...Q.sit(0.3), A.par(po('legFL', [-50, 0, 70], 0.6), po('legFR', [-50, 0, -70], 0.6), po('head', [-25, 0, 0], 0.6), sayP('Mew!', 1.5)), A.wait(1.6), Q.stand()],
      [A.par(po('jaw', [25, 0, 0], 0.3), po('head', [-20, 0, 0], 0.3), sayP('Mrrow-eee!', 1.6)), A.anim('hop', 2), back('jaw', 'head')],
    ),
  ),
  // Head lice at their real 3-4 mm: six clinging legs, a flat body.
  // Head lice at their real 3 mm, clinging to a few strands of hair on a patch of scalp, with nits (their eggs)
  // glued to the hairs. They crawl up and down the strands.
  e('lice', 'bugs', 'crawling insects', () => {
    const t = m('lice', { view: 'front' });
    t.ball([0.034, 0.004, 0.026], [0, 0.002, 0], { color: '#e8c4a8', name: 'scalp' });
    const hairs: Array<[number, number, number]> = [[-0.008, 0.002, 0.004], [0.0, -0.004, -0.003], [0.007, 0.004, 0.002], [0.012, -0.006, -0.004], [-0.013, -0.005, 0.003]];
    hairs.forEach(([x, z, lean], i) => t.rod([x, 0.002, z], [x + lean * 0.4, 0.03, z], 0.0007, '#3e2a1c', { parent: 'scalp' }).rod([x + lean * 0.4, 0.03, z], [x + lean * 1.6, 0.05 - i * 0.003, z + 0.003], 0.0007, '#3e2a1c', { parent: 'scalp' }));
    const louse = (name: string, c: Vec3) => {
      t.ball([0.0013, 0.0019, 0.0008], [c[0], c[1] - 0.0008, c[2]], { color: '#c9a77a', name, parent: 'scalp' })
        .ball([0.0006, 0.0009, 0.0004], [c[0], c[1] - 0.0008, c[2] + 0.0002], { color: '#6a3a2a', parent: name, noInk: true })
        .ball([0.0009, 0.0008, 0.0007], [c[0], c[1] + 0.0005, c[2]], { color: '#b8946a', parent: name })
        .ball([0.0007, 0.0007, 0.0006], [c[0], c[1] + 0.0012, c[2]], { color: '#c9a77a', parent: name })
        .pair((s) => {
          t.rod([c[0] + s * 0.0002, c[1] + 0.0015, c[2]], [c[0] + s * 0.0006, c[1] + 0.0021, c[2]], 0.00018, '#8a6a4a', { parent: name });
          for (let i = 0; i < 3; i++) t.rod([c[0] + s * 0.0004, c[1] + 0.0008 - i * 0.0003, c[2]], [c[0] + s * 0.0007, c[1] + 0.0006 - i * 0.0004, c[2] - 0.0006], 0.00022, '#8a6a4a', { parent: name });
        });
    };
    louse('louse1', [0.0081, 0.018, 0.0012]);
    louse('louse2', [-0.0077, 0.026, 0.0045]);
    for (const [x, y, z] of [[0.0, 0.01, -0.0034], [0.0072, 0.008, 0.0048], [-0.0081, 0.012, 0.0044]] as Vec3[]) t.ball([0.0006, 0.0009, 0.0006], [x, y, z], { color: '#f2ece0', parent: 'scalp' });
    return act(t.done(),
      [A.par(po('louse1', R0, 1.4, { move: [0, 0.01, 0] }), po('louse2', R0, 1.4, { move: [0, -0.008, 0] }), sayP('!', 1)), A.wait(0.4), A.par(po('louse1', R0, 1.2, { move: R0 }), po('louse2', R0, 1.2, { move: R0 }))],
      [A.par(A.anim('wobble'), sayP('!', 1))],
    );
  }),
  // A male lion, 1.1 m at the shoulder (lofted, like the cheetah): a deep chest and tucked waist, heavy forelegs,
  // a big dark mane framing the face and running down the neck, a tufted tail.
  e('lion', 'wild', 'savanna', () =>
    act(QK('lion', { c: '#d9a55a', H: 1.12, L: 1.45, D: 0.58, W: 0.46, tuck: 0.5, rump: 0.96, belly: '#ecd3a0', neck: { l: 0.3, w: 0.32, lean: 54, base: 0.4 }, head: { l: 0.34, w: 0.33, h: 0.3 }, muz: { l: 0.13, w: 0.19, h: 0.15, c: '#f0dcb4', drop: 0.22 }, nose: '#6a3a2a', eye: { k: 0.9, c: '#c08a2a' }, ear: { k: 'round', s: 0.08, in: '#3a2a20' }, leg: { w: 0.12, k: 1.2, paw: '#d9a55a' }, tail: { k: 'tuft', l: 0.95, w: 0.055, a: 140, tip: '#5a3418' } }, chestQ('#ecd3a0'), limbsQ(1.5), (f, d) => {
      const { l, w, h } = d.q.head, n = d.q.neck;
      f.ball([w * 2.2, h * 2.3, l * 1.15], [d.sk[0], d.sk[1] + h * 0.05, d.sk[2] - l * 0.28], { color: '#8a4f24', parent: 'head' })
        .ball([n.w * 2.0, n.w * 2.4, n.w * 2.0], [0, (d.nb[1] + d.nt[1]) / 2 - n.w * 0.05, (d.nb[2] + d.nt[2]) / 2 - n.w * 0.15], { color: '#7a4420', parent: 'neck' });
    }),
      Q.roar('ROOOAR!'),
      [...Q.sit(1.2), A.wait(0.4), ...Q.swish(4), sayP('Grr...', 1.5), Q.stand()],
      [...Q.lie(1.2), A.par(po('jaw', [30, 0, 0], 0.8), po('head', [-20, 0, 0], 0.8), sayP('*yawn*', 1.8)), A.wait(1), back('jaw', 'head'), Q.stand()],
    ),
  ),
  e('lion cub', 'wild', 'savanna', () =>
    act(feline('lion cub', { s: 0.45, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#dcb47a', belly: '#f0dcb8', snout: '#f2e2c4', tail: 'tuft', acc: [ani.spots('#c49a5c', 6)] }),
      [...Q.pounce(0.57), A.par(po('jaw', [26, 0, 0], 0.2), sayP('Rawr!', 1.4)), back('jaw')],
      [A.par(A.anim('spin'), sayP('Mew!', 1.2))],
    ),
  ),
  // A lioness, 1 m at the shoulder (lofted): sleeker than the lion, no mane, a pale chest. She stalks low, ears
  // twitching, and pounces; and she roars.
  e('lioness', 'wild', 'savanna', () =>
    act(QK('lioness', { c: '#d6a663', H: 1.0, L: 1.35, D: 0.52, W: 0.4, tuck: 0.5, rump: 0.96, belly: '#efdcb4', neck: { l: 0.3, w: 0.26, lean: 50, base: 0.34 }, head: { l: 0.3, w: 0.27, h: 0.25 }, muz: { l: 0.13, w: 0.16, h: 0.13, c: '#f2e2c4', drop: 0.22 }, nose: '#6a3a2a', eye: { k: 0.9, c: '#c08a2a' }, ear: { k: 'round', s: 0.075, in: '#3a2a20' }, leg: { w: 0.105, k: 1.15, paw: '#d6a663' }, tail: { k: 'tuft', l: 0.9, w: 0.05, a: 140, tip: '#5a3418' } }, chestQ('#efdcb4'), limbsQ(1.45)),
      [A.par(po('body', [4, 0, 0], 0.8, { move: [0, -0.16, 0] }), po('legFL', [-25, 0, 0], 0.8), po('legFR', [-25, 0, 0], 0.8), po('legBL', [-30, 0, 0], 0.8), po('legBR', [-30, 0, 0], 0.8), po('neck', [35, 0, 0], 0.8), po('head', [-25, 0, 0], 0.8)), ...Q.ears(4, 20), sayP('...', 1.2), back('body', 'legFL', 'legFR', 'legBL', 'legBR', 'neck', 'head'), A.anim('hop')],
      Q.roar('Rrrowrr!', 0.85),
    ),
  ),
  // A green iguana-like lizard (crest down the back, a dewlap under the chin), 60 cm with its tail. It does push-ups
  // and fans its dewlap, the way lizards show off.
  e('lizard', 'wild', 'reptiles', () =>
    act(scaleFig(beast('lizard', { color: '#5f9e3a', belly: '#b8d878', body: [0.3, 0.085, 0.11], legL: 0.03, legW: 0.032, legColor: '#4f8a30', neckL: 0.025, neckLean: 70, neckW: 0.06, head: [0.09, 0.055, 0.065], snout: { len: 0.035, h: 0.035, w: 0.045, color: '#6aaa42' }, nose: '#3a5a2a', ears: 'side', earSize: 0.012, tail: 'stub', acc: [coneTail(0.42, 0.07, '#5f9e3a', 0.05, { name: 'tailTip', piece: true }), ridge('#d8c84a', 6, 0.03), (p, d) => {
      add(p, 'head', 'ball', [0.012, 0.04, 0.045], [0, -d.head[1] * 0.3, d.head[0] * 0.25], '#c8b84a', { name: 'dewlap', off: [0, -0.016, 0] });
      for (let i = 0; i < 6; i++) add(p, 'body', 'ball', [0.03, 0.012, 0.03], [(i % 2 ? 1 : -1) * 0.05, 0.01, 0.1 - i * 0.04], '#3e7a2a', { noInk: true, layer: 3 });
    }] }), 0.6),
      [A.par(sayP('!', 1), po('dewlap', R0, 0.2, { scale: 1.8 })), ...Array.from({ length: 3 }, () => [po('body', [-8, 0, 0], 0.18, { move: [0, 0.018, 0] }), po('body', R0, 0.18)]).flat(), po('dewlap', R0, 0.3, { scale: 1 })],
      [A.par(A.detach('tailTip', 'tail'), A.anim('hop'), sayP('!', 1))],
      [po('head', [0, 30, 0], 0.3), A.wait(0.4), A.par(A.reattach('tailTip'), back('head'))],
    ),
  ),
  // A llama in a woven blanket. Ears go back, head goes up... and it spits.
  e('llama', 'farm', 'farm animals', () =>
    act(beast('llama', { color: '#efe4cf', body: [0.95, 0.5, 0.42], legL: 0.55, legW: 0.1, hoof: '#5a4a3a', hoofH: 0.06, neckL: 0.6, neckLean: 8, neckW: 0.2, head: [0.3, 0.2, 0.18], snout: { len: 0.12, h: 0.12, w: 0.12, color: '#e3d3b8' }, nose: '#4a3a30', ears: 'long', earSize: 0.15, tail: 'fluffy', tailAngle: 60, acc: [tuft('#efe4cf'), jaw({ len: 0.12, h: 0.12, w: 0.12 }, '#e3d3b8'), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.08, H * 0.9, L * 0.38], [0, H * 0.1, L * 0.02], '#c8322e', { layer: 3 });
      add(p, 'body', 'ball', [W * 1.1, H * 0.92, L * 0.08], [0, H * 0.1, L * 0.02], '#f2c230', { layer: 4 });
      for (const z of [-0.1, 0.14]) add(p, 'body', 'ball', [W * 1.1, H * 0.92, L * 0.03], [0, H * 0.1, L * z], '#2a6ab0', { layer: 4, noInk: true });
    }] }),
      [A.par(po('earL', [-50, 0, 0], 0.3), po('earR', [-50, 0, 0], 0.3), po('neck', [-12, 0, 0], 0.4), po('head', [-20, 0, 0], 0.4)), A.wait(0.4), A.par(po('jaw', [20, 0, 0], 0.12), A.effect('water_spray', { dur: 0.8 }), sayP('Ptooey!', 1.6)), A.wait(0.6), back('jaw', 'neck', 'head', 'earL', 'earR')],
      Q.tilt('Hmmm?'),
    ),
  ),
  // A lobster with big crushing claws that snap, and a tail that flips it backwards.
  e('lobster', 'sea', 'shellfish', () => {
    const t = m('lobster', { view: 'side' });
    const r = '#c8372d', d = '#9e2a22';
    t.ball([0.075, 0.065, 0.14], [0, 0.05, 0.03], { color: r, name: 'body' }).cone([0.03, 0.05, 0.02], [0, 0.062, 0.115], { color: r, rot: [90, 0, 0], parent: 'body' });
    t.each(4, (i) => t.pair((s) => t.rod([s * 0.025, 0.035, 0.05 - i * 0.022], [s * 0.05, 0.03, 0.045 - i * 0.026], 0.008, d, { parent: 'body' }).rod([s * 0.05, 0.03, 0.045 - i * 0.026], [s * 0.062, 0.003, 0.04 - i * 0.026], 0.007, d, { parent: 'body' })));
    let prev = 'body';
    for (let i = 0; i < 5; i++) {
      const z = -0.05 - i * 0.034;
      t.ball([0.07 - i * 0.006, 0.05 - i * 0.004, 0.045], [0, 0.045 - i * 0.003, z], { color: i % 2 ? d : r, name: `tail${i + 1}`, parent: prev, pivot: [0, 0.055 - i * 0.003, z + 0.02] });
      prev = `tail${i + 1}`;
    }
    t.ball([0.035, 0.012, 0.05], [0, 0.03, -0.235], { color: r, parent: 'tail5' }).pair((s) => t.ball([0.03, 0.01, 0.045], [s * 0.028, 0.03, -0.228], { color: d, rot: [0, s * 30, 0], parent: 'tail5' }));
    t.pair((s) => {
      const arm = s > 0 ? 'armL' : 'armR', claw = s > 0 ? 'clawL' : 'clawR', pin = s > 0 ? 'pinchL' : 'pinchR';
      t.rod([s * 0.01, 0.07, 0.09], [s * 0.016, 0.085, 0.1], 0.006, d, { parent: 'body' })
        .ball(0.012, [s * 0.017, 0.088, 0.102], { color: '#1a1414', eye: true, parent: 'body' })
        .rod([s * 0.012, 0.065, 0.11], [s * 0.06, 0.11, 0.2], 0.005, d, { parent: 'body' })
        .rod([s * 0.06, 0.11, 0.2], [s * 0.1, 0.12, 0.08], 0.004, d, { parent: 'body' })
        .rod([s * 0.03, 0.04, 0.08], [s * 0.06, 0.045, 0.13], 0.016, r, { name: arm, parent: 'body', pivot: [s * 0.03, 0.04, 0.08] })
        .ball([0.05, 0.035, 0.085], [s * 0.07, 0.05, 0.19], { color: r, name: claw, parent: arm })
        .rod([s * 0.077, 0.052, 0.225], [s * 0.082, 0.05, 0.27], 0.018, r, { parent: claw })
        .rod([s * 0.058, 0.046, 0.225], [s * 0.056, 0.042, 0.262], 0.013, d, { name: pin, parent: claw, pivot: [s * 0.058, 0.046, 0.222] });
    });
    return act(t.done(),
      [A.par(po('armL', [-20, 0, 0], 0.3), po('armR', [-20, 0, 0], 0.3), sayP('Snip! Snap!', 1.8)), ...osc([['pinchL', [0, -35, 0], R0], ['pinchR', [0, 35, 0], R0]], 6, 0.12), back('armL', 'armR')],
      [A.par(po('tail1', [-20, 0, 0], 0.12), po('tail2', [-25, 0, 0], 0.12), po('tail3', [-25, 0, 0], 0.12), po('tail4', [-25, 0, 0], 0.12), A.anim('hop'), A.effect('water_spray', { dur: 0.8 })), A.wait(0.3), back('tail1', 'tail2', 'tail3', 'tail4')],
    );
  }),
  e('locust', 'bugs', 'crawling insects', () =>
    act(scaleFig(bug('locust', { length: 0.075, color: '#7a8a3a', wings: 'clear', wingColor: '#cfc48e', segments: 3, extras: (p, { L }) => {
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.24, L * 0.24, L * 0.62];
      a.off = [0, 0, -L * 0.22];
      for (const s of [1, -1]) {
        rodP(p, 'body', [s * L * 0.13, -L * 0.02, -L * 0.06], [s * L * 0.2, L * 0.16, -L * 0.36], L * 0.08, '#6a7a30');
        rodP(p, 'body', [s * L * 0.2, L * 0.16, -L * 0.36], [s * L * 0.2, -L * 0.32, -L * 0.42], L * 0.035, '#5a6a28');
      }
    } }), 0.8),
      G.buzz('Chirr-chirr!'),
      [treat('leaf', 'leaf', 'touch'), sayP('Munch munch.', 1.8), ...G.feel(4), A.remove('leaf', 'fade')],
    ),
  ),
  e('lynx', 'wild', 'forest', () =>
    act(feline('lynx', { s: 0.5, legK: 1.15, color: '#c4a27c', belly: '#efe4d2', snout: '#f2e8d8', tail: 'stub', earK: 1.4, eyes: '#c8b030', acc: [ani.spots('#7a5a3a', 8), tailTip('#2a2422', 'stub'), (p, d) => {
      const [hl, hh, hw] = d.head;
      const es = 0.11 * 0.5 * 1.4;
      for (const s of [1, -1]) {
        add(p, s > 0 ? 'earL' : 'earR', 'capsule', [es * 0.14, es * 0.55, es * 0.14], [0, es * 1.1, 0], '#2a2422', { srot: [0, 0, -s * 8] });
        add(p, 'head', 'ball', [hw * 0.36, hh * 0.42, hl * 0.4], [s * hw * 0.36, -hh * 0.18, hl * 0.06], '#efe4d2', { layer: 1 });
      }
    }] }),
      [...Q.ears(6, 25), A.par(po('jaw', [24, 0, 0], 0.25), sayP('Mrrrow!', 1.5)), back('jaw')],
      Q.pounce(0.7),
    ),
  ),
  // A scarlet macaw perched upright: red with yellow and blue wings, a white face and a long tail hanging behind.
  e('macaw', 'aviary', 'tropical birds', () =>
    act(birdx('macaw', { height: 0.5, color: '#d62828', wing: '#2a5fc0', beak: '#efe8dc', legs: '#7a7a80', tail: ['#d62828', '#2a5fc0', '#d62828'] }, (p, g, H) => {
      bTail(g, H, 2.1, 3);
      g('tail').rot = [-150, 0, 0];
      bHook(p, g, H, 1.1);
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.03, H * 0.12, H * 0.13], [s * H * 0.11, H * 0.1, H * 0.05], '#f6f2ec', { layer: 3, noInk: true });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.1, H * 0.2], [0, H * 0.06, H * 0.03], '#f2c230', { layer: 4, noInk: true });
    }),
      [A.par(sayP('Hello! SQUAWK!', 2)), ...osc([['head', [-25, 0, 10], [10, 0, -10]]], 6, 0.15)],
      B.spread(80, 1.2, 'Rraak!'),
    ),
  ),
  // Real size: a real 1.6 cm maggot (the vocabulary's 0.1 m is too big).
  e('maggot', 'bugs', 'grubs and worms', () => {
    const t = m('maggot', { view: 'side' });
    [0.03, 0.035, 0.036, 0.035, 0.031, 0.025, 0.018].forEach((T, i) => t.ball([T, T, T * 0.9], [0, T / 2 + 0.001, -0.042 + i * 0.014], { color: i % 2 ? '#ece4ca' : '#f1ead2' }));
    t.ball(0.007, [0, 0.008, 0.05], { color: '#3a2a20' }).pair((s) => t.ball(0.006, [s * 0.006, 0.02, -0.056], { color: '#8a6a40', noInk: true }));
    return act(scaleFig(t.done(), 0.15), [A.par(A.anim('wobble', 2), sayP('!', 1))], [A.anim('bounce', 3)]);
  }),
  // A magpie: black, white belly and shoulders, a long blue-green tail. It cannot resist something shiny.
  e('magpie', 'aviary', 'garden birds', () =>
    act(birdx('magpie', { height: 0.28, color: '#1c1c24', wing: '#22305a', beak: '#1c1c24', legs: '#2a2726', tail: ['#22305a', '#1c2a4a'] }, (p, g, H) => {
      bTail(g, H, 2.0, 2);
      g('tail').rot = [-100, 0, 0];
      bBelly(p, H, '#f4f2ee', 1.05);
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.12, H * 0.22], [0, H * 0.03, H * 0.04], '#f4f2ee', { layer: 4, noInk: true });
    }),
      [treat('ring', 'shiny'), ...B.peck(1), A.remove('shiny', 'pop'), A.par(sayP('Chak-chak-chak!', 1.8), ...B.flick(4))],
      [...B.flutter(6), sayP('Chak!', 1)],
    ),
  ),
  // A maltese: a long, silky white coat falling to the ground, a topknot tied with a pink bow, dark button eyes.
  e('maltese', 'pets', 'dog breeds', () => {
    const s = 0.4, legK = 0.62;
    return act(dog('maltese', { s, legK, color: '#f7f5f0', earK: 1.7, snoutK: 0.55, nose: '#141212', tail: 'fluffy', tailAngle: -55, acc: [skirt('#f4f1ea', 0.3 * s * legK + 0.3 * s * 0.42), tuft('#f7f5f0', 0.8), bow('#f08ab0'), plume(1.2)] }),
      [...Q.bark('Yip! Yip!', 2, 0.8), A.anim('hop', 2)],
      [A.par(A.anim('wag', 2), sayP('♥', 1.4))],
    );
  }),
  // A woolly mammoth: shaggy brown coat, a domed head and back, long curving tusks and a trunk that lifts to trumpet.
  e('mammoth', 'wild', 'prehistoric', () =>
    act(beast('mammoth', { color: '#6b4426', body: [3.4, 2.1, 1.9], legL: 1.25, legW: 0.6, hoof: '#4a3020', hoofH: 0.25, neckL: 0.25, neckLean: 75, neckW: 1.0, head: [1.1, 1.3, 1.1], ears: 'side', earSize: 0.45, tail: 'tuft', acc: [
      (p, d) => {
        const [L, H, W] = d.body;
        add(p, 'body', 'ball', [W * 1.08, H * 0.75, L * 0.92], [0, -H * 0.28, 0], '#55351d', { layer: 1 });
        add(p, 'body', 'ball', [W * 0.75, H * 0.55, L * 0.35], [0, H * 0.45, L * 0.22], '#6b4426');
        for (const s of [1, -1]) for (const z of [0.31, -0.31]) add(p, 'body', 'ball', [0.72, 0.9, 0.72], [s * W * 0.27, -H * 0.42, L * z], '#55351d', { layer: 1 });
      },
      (p, d) => {
        const [hl, hh, hw] = d.head;
        add(p, 'head', 'ball', [hw * 0.8, hh * 0.6, hl * 0.6], [0, hh * 0.55, -hl * 0.1], '#6b4426');
        jchain(p, 'head', 'trunk', [[0, -0.1, 0.55], [0, -0.9, 0.85], [0, -1.6, 0.9], [0, -1.95, 1.05]], [0.38, 0.3, 0.24], '#6b4426', { layer: 4 });
        for (const s of [1, -1]) chainP(p, 'head', [[s * 0.3, -0.35, 0.5], [s * 0.45, -1.1, 0.95], [s * 0.4, -1.3, 1.6], [s * 0.2, -0.9, 2.0]], [0.2, 0.17, 0.13], '#efe6cf', { layer: 5 });
      },
    ] }),
      [A.par(po('trunk1', [-70, 0, 0], 0.6), po('trunk2', [-40, 0, 0], 0.6), po('trunk3', [-30, 0, 0], 0.6), po('head', [-12, 0, 0], 0.6), sayP('PAWOOOO!', 2.2)), A.wait(1.4), back('trunk1', 'trunk2', 'trunk3', 'head')],
      [A.par(po('legFL', [-40, 0, 0], 0.35), po('trunk1', [-25, 0, 0], 0.35)), A.par(po('legFL', R0, 0.15), A.anim('shake'), A.effect('snow', { dur: 1.5 }), sayP('Hrrumph!', 1.4)), back('trunk1')],
    ),
  ),
  // A manatee (sea cow), 3.5 m: a grey wrinkled barrel of a body, a whiskery square snout, paddle flippers and a
  // round paddle tail. It munches sea grass and paddles off slowly.
  // Real size: the vocabulary's 4 m is its length; it stands under a metre tall.
  e('manatee', 'sea', 'sea mammals', () => {
    const t = m('manatee', { view: 'side' });
    const c = '#8d918e', l = '#a7aaa4';
    t.ball([1.25, 1.2, 2.6], [0, 0.66, 0], { color: c, name: 'body' })
      .ball([1.1, 0.5, 2.2], [0, 0.42, 0.1], { color: l, parent: 'body', noInk: true })
      .ball([0.95, 0.85, 1.4], [0, 0.62, -1.3], { color: c, name: 'tail', parent: 'body', pivot: [0, 0.64, -0.7] })
      .ball([1.35, 0.16, 1.05], [0, 0.6, -2.15], { color: c, parent: 'tail' })
      .ball([0.82, 0.74, 0.82], [0, 0.8, 1.35], { color: c, name: 'head', parent: 'body', pivot: [0, 0.75, 0.95] })
      .ball([0.64, 0.54, 0.46], [0, 0.64, 1.74], { color: l, parent: 'head' })
      .pair((s) =>
        t.ball(0.09, [s * 0.3, 0.92, 1.6], { color: '#1e1c1c', eye: true, parent: 'head' })
          .ball([0.06, 0.04, 0.05], [s * 0.1, 0.86, 1.9], { color: '#4a4a4a', noInk: true, parent: 'head' })
          .ball([0.12, 0.42, 0.28], [s * 0.62, 0.36, 0.8], { color: c, rot: [-35, 0, s * 25], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * 0.55, 0.55, 0.85] })
          .each(3, (i) => t.ball(0.03, [s * (0.12 + i * 0.07), 0.6 + (i % 2) * 0.06, 1.93 - i * 0.03], { color: '#5a5a58', noInk: true, parent: 'head' })),
      );
    return act(scaleFig(t.done(), 0.68),
      [treat('seaweed (plant)', 'weed', 'touch'), A.par(po('head', [18, 0, 0], 0.5), sayP('Mmm-mm!', 1.8)), ...osc([['head', [24, 0, 0], [12, 0, 0]]], 4, 0.3), back('head'), A.remove('weed', 'sink')],
      [A.par(A.effect('water_spray', { dur: 2.2 }), ...oscT([['tail', [-14, 0, 0], [10, 0, 0]], ['flipperL', [0, 0, 15], [0, 0, -10]], ['flipperR', [0, 0, -15], [0, 0, 10]]], 2, 0.6)), ...F.bubbles()],
    );
  }),
  // A manta ray gliding with a little bank so its dark back and the white edges show; its great wings flap and it
  // barrel-rolls to feed.
  e('manta ray', 'sea', 'rays', () =>
    act(turned('manta ray', 'front', [0, 1.05, 0], [38, 0, 0], (s, r) => {
      const c = '#2a3340';
      s('ball', [0.95, 0.38, 1.75], [0, 0, 0], c);
      s('ball', [0.88, 0.3, 1.62], [0, -0.07, 0.02], '#eeeeea', { noInk: true });
      for (const k of [1, -1]) {
        const w = k > 0 ? 'wingL' : 'wingR';
        s('ball', [2.1, 0.14, 1.0], [k * 0.35, 0, -0.1], c, { name: w, off: [k * 0.8, 0, -0.05], srot: [0, k * 22, k * 8] });
        s('ball', [0.9, 0.08, 0.4], [k * 1.75, 0.12, -0.5], c, { parent: w, srot: [0, k * 38, k * 12] });
        s('ball', [1.6, 0.1, 0.7], [k * 0.7, -0.05, 0.05], '#e8e8e4', { parent: w, noInk: true, srot: [0, k * 22, k * 8] });
        r([k * 0.32, 0, 0.72], [k * 0.3, -0.06, 1.15], 0.14, c);
        s('ball', [0.08, 0.08, 0.08], [k * 0.44, 0.08, 0.6], '#111111', { role: 'eye', noInk: true });
        s('ball', [0.5, 0.06, 0.42], [k * 0.4, 0.16, 0.15], '#c8ccd2', { noInk: true });
      }
      s('ball', [0.4, 0.12, 0.08], [0, -0.04, 0.86], '#14181e');
      r([0, 0, -0.8], [0, 0, -2.0], 0.06, c);
      s('cyl', [0.04, 0.18, 0.2], [0, 0.22, -0.72], c, { taper: 0, srot: [-40, 0, 0] });
    }),
      [A.par(A.anim('hop'), sayP('!', 1)), ...osc([['wingL', [0, 0, 28], [0, 0, -18]], ['wingR', [0, 0, -28], [0, 0, 18]]], 6, 0.35)],
      [A.par(A.anim('spin'), A.effect('water_spray', { dur: 1.2 }))],
    ),
  ),
  // A praying mantis: long thorax, folded spiked forelegs held up as if praying, a triangular head that turns to
  // look at you. It strikes like lightning.
  e('mantis', 'bugs', 'crawling insects', () => {
    const t = m('mantis', { view: 'side' });
    const g = '#7cb342', dg = '#5a8a2e';
    t.ball([0.016, 0.014, 0.05], [0, 0.024, -0.03], { color: g, rot: [8, 0, 0], name: 'body' })
      .ball([0.014, 0.006, 0.042], [0, 0.031, -0.026], { color: '#a8d468', rot: [8, 0, 0], parent: 'body' })
      .rod([0, 0.024, 0.0], [0, 0.05, 0.016], 0.008, g, { parent: 'body' });
    t.each(2, (i) => t.pair((s) => t.rod([s * 0.004, 0.024, -0.004 - i * 0.012], [s * 0.022, 0.014, -0.002 - i * 0.02], 0.003, dg, { parent: 'body' }).rod([s * 0.022, 0.014, -0.002 - i * 0.02], [s * 0.026, 0.001, -0.01 - i * 0.024], 0.0025, dg, { parent: 'body' })));
    t.ball([0.022, 0.013, 0.012], [0, 0.057, 0.022], { color: g, name: 'head', parent: 'body', pivot: [0, 0.052, 0.018] })
      .cone([0.012, 0.008, 0.008], [0, 0.05, 0.028], { color: g, rot: [170, 0, 0], parent: 'head' })
      .pair((s) => {
        const arm = s > 0 ? 'armL' : 'armR';
        t.ball([0.009, 0.01, 0.009], [s * 0.01, 0.059, 0.022], { color: '#c8e070', parent: 'head' })
          .ball([0.003, 0.004, 0.003], [s * 0.013, 0.06, 0.025], { color: '#1a1a14', eye: true, noInk: true, parent: 'head' })
          .rod([s * 0.003, 0.062, 0.025], [s * 0.012, 0.08, 0.035], 0.0015, dg, { parent: 'head' })
          .rod([s * 0.004, 0.046, 0.016], [s * 0.006, 0.034, 0.03], 0.0045, g, { name: arm, parent: 'body', pivot: [s * 0.004, 0.046, 0.016] })
          .rod([s * 0.006, 0.034, 0.03], [s * 0.006, 0.047, 0.035], 0.004, g, { parent: arm })
          .each(3, (i) => t.cone([0.0015, 0.004, 0.0015], [s * 0.006, 0.037 + i * 0.003, 0.03 + i * 0.0015], { color: '#e8f0b0', rot: [-80, 0, 0], parent: arm }));
      });
    return act(t.done(),
      [po('head', [0, 45, 0], 0.4), sayP('?', 1.2), A.wait(0.8), po('head', [0, -30, 10], 0.4), A.wait(0.6), back('head')],
      [A.par(po('armL', [-20, 0, 0], 0.3), po('armR', [-20, 0, 0], 0.3)), A.wait(0.4), A.par(po('armL', [-75, 0, 0], 0.08), po('armR', [-75, 0, 0], 0.08), sayP('!', 1)), A.wait(0.3), back('armL', 'armR')],
    );
  }),
  // A bay mare, 1.6 m at the withers (lofted, like the foal and the donkey): a long arched neck with a dark mane, a
  // white blaze and two white socks, dark lower legs, a full dark tail. A rider can sit on her back.
  e('mare', 'farm', 'horses', () =>
    act(QK('mare', { ...QHORSE, c: '#8b4a2b', belly: '#9a5634', leg: { ...QHORSE.leg, low: '#3a2010' }, tail: { ...QHORSE.tail, c: '#3a1e10' } }, maneQ('#3a1e10'), blazeQ('#f4efe6'), socksQ('#f4efe6', 0.2, 'FL,BL'), limbsQ(), (f, d) => {
      const [, h, cy] = d.sec(0.62);
      f.socket('back', [0, cy + h + 0.02, d.z(0.62)], 'seat', { part: 'body' });
    }),
      [A.par(po('neck', [-18, 0, 0], 0.35), po('head', [-25, 0, 0], 0.35), po('jaw', [14, 0, 0], 0.35), sayP('Neigh-h-h!', 2)), ...osc([['head', [-25, 0, 12], [-25, 0, -12]]], 4, 0.14), back('neck', 'head', 'jaw'), ...Q.paw(4)],
      Q.graze('*snort*'),
    ),
  ),
  e('mastiff', 'pets', 'dog breeds', () =>
    act(dog('mastiff', { s: 1.08, fat: 1.25, headK: 1.2, snoutK: 0.6, snoutShape: 'box', color: '#c9a06a', snout: '#2e2824', earColor: '#3a302a', earK: 0.75, tailAngle: 140, acc: [(p, d) => {
      const [hl, hh, hw] = d.head;
      for (const s of [1, -1]) add(p, 'head', 'ball', [hw * 0.3, hh * 0.4, hl * 0.3], [s * hw * 0.2, -hh * 0.3, hl * 0.42], '#3a302a', { layer: 3 });
    }] }),
      Q.bark('WOOF! WOOF!', 2, 0.8),
      [...Q.sit(0.83), A.par(po('head', [0, 0, 18], 0.4), sayP('Hmph.', 1.2)), A.wait(1), Q.stand()],
    ),
  ),
  // The giant prehistoric shark, 15 m: a great white's shape on a huge scale, with a jaw that drops open.
  e('megalodon', 'sea', 'sharks', () =>
    act(fish('megalodon', { length: 15, color: '#5e6b78', belly: '#e6e8ea', shape: 'shark', extras: (p, dd) => {
      const { L, H, W } = dd;
      for (let i = 0; i < 4; i++) for (const s of [1, -1]) {
        const x = s * W * (0.05 + i * 0.06), z = L * (0.385 - i * 0.012);
        coneP(p, 'body', [x, -H * 0.1, z], [x, -H * 0.2, z], W * 0.06, '#f6f4ec', { layer: 5 });
      }
      fishJaw(p, dd, '#e6e8ea', '#f6f4ec', 1.1);
      for (let i = 0; i < 3; i++) for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.03, H * 0.35, L * 0.012], [s * W * 0.43, -H * 0.02, L * (0.2 - i * 0.035)], '#3e4852', { noInk: true, layer: 4 });
    } }),
      [A.par(po('jaw', [32, 0, 0], 0.4), sayP('CHOMP!', 1.6)), po('jaw', R0, 0.1), A.anim('shake')],
      F.swish(6, 25),
    ),
  ),
  // The great white whale of the novel: an albino sperm whale, scarred, with old harpoons still in its back.
  e('moby dick', 'sea', 'whales', () =>
    act(whale('moby dick', { L: 16, hk: 0.24, color: '#f2f0ea', belly: '#e4e2dc', head: 'box', dorsal: 'hump' }, (t, { L, H, y }) => {
      for (const [x, z] of [[0.3, -0.04], [-0.2, -0.12]]) t.rod([x, y + H * 0.4, L * z], [x * 2.6, y + H * 0.4 + 1.7, L * z - 0.9], 0.09, '#6b4a2e', { parent: 'body' }).cone([0.16, 0.3, 0.16], [x * 0.9, y + H * 0.42, L * z + 0.05], { color: '#55595e', rot: [150, 0, 0], parent: 'body' }).rod([x * 2.6, y + H * 0.4 + 1.7, L * z - 0.9], [x * 3.5, y + H * 0.4 + 1.2, L * z - 1.6], 0.03, '#c8b890', { parent: 'body' });
      t.pair((s) => t.each(3, (i) => t.capsule([0.05, 1.2, 0.05], [s * H * 0.46, y + H * (0.15 - i * 0.1), L * (0.05 - i * 0.07)], { color: '#b8b6b0', rot: [70, 0, 10], noInk: true, parent: 'body' })));
    }),
      W.breach('SPLASH!'),
      [...W.slap('!'), ...W.blow('Pfffoooosh!')],
    ),
  ),
  // A capuchin-type monkey sitting with a banana, long curling tail behind. It eats, and it hoots and waves.
  e('monkey', 'wild', 'jungle', () => {
    const t = m('monkey');
    const c = '#8a5a32', f = '#e9c49a';
    t.ball([0.22, 0.26, 0.18], [0, 0.2, 0], { color: c, name: 'body' })
      .ball([0.15, 0.17, 0.08], [0, 0.18, 0.06], { color: f, noInk: true, parent: 'body' })
      .ball([0.2, 0.18, 0.17], [0, 0.42, 0.02], { color: c, name: 'head', parent: 'body', pivot: [0, 0.33, 0.01] })
      .ball([0.15, 0.13, 0.08], [0, 0.41, 0.08], { color: f, parent: 'head' })
      .ball([0.09, 0.06, 0.06], [0, 0.375, 0.115], { color: f, parent: 'head' })
      .ball([0.018, 0.01, 0.01], [0, 0.39, 0.145], { color: '#4a2e1a', noInk: true, parent: 'head' })
      .box([0.04, 0.006, 0.01], [0, 0.362, 0.142], { color: '#6a3a2a', noInk: true, parent: 'head' })
      .rod([-0.11, 0.28, 0], [-0.14, 0.12, 0.06], 0.05, c, { name: 'armR', parent: 'body', pivot: [-0.11, 0.28, 0] })
      .ball([0.05, 0.04, 0.05], [-0.13, 0.1, 0.09], { color: f, parent: 'armR' })
      .rod([0.11, 0.28, 0], [0.13, 0.2, 0.1], 0.05, c, { name: 'armL', parent: 'body', pivot: [0.11, 0.28, 0] })
      .rod([0.13, 0.2, 0.1], [0.07, 0.32, 0.13], 0.045, c, { parent: 'armL' })
      .ball(0.045, [0.06, 0.33, 0.14], { color: f, parent: 'armL' })
      .rod([0.04, 0.3, 0.15], [0.02, 0.4, 0.17], 0.03, '#f6d24a', { parent: 'armL' })
      .rod([0.04, 0.3, 0.15], [0.09, 0.25, 0.14], 0.03, '#f6d24a', { parent: 'armL' })
      .ball(0.012, [0.02, 0.41, 0.17], { color: '#5a4a2a', parent: 'armL' })
      .pair((s) =>
        t.ball([0.025, 0.028, 0.012], [s * 0.035, 0.43, 0.12], { color: '#1e1410', eye: true, noInk: true, parent: 'head' })
          .ball([0.06, 0.07, 0.03], [s * 0.115, 0.43, 0.0], { color: f, parent: 'head' })
          .ball([0.07, 0.07, 0.14], [s * 0.08, 0.065, 0.06], { color: c, parent: 'body' })
          .ball([0.05, 0.03, 0.08], [s * 0.09, 0.02, 0.13], { color: f, parent: 'body' }),
      )
      .rod([0, 0.08, -0.08], [0.1, 0.04, -0.2], 0.03, c, { name: 'tail', parent: 'body', pivot: [0, 0.08, -0.08] })
      .rod([0.1, 0.04, -0.2], [0.22, 0.1, -0.22], 0.028, c, { parent: 'tail' })
      .rod([0.22, 0.1, -0.22], [0.24, 0.22, -0.15], 0.025, c, { parent: 'tail' })
      .rod([0.24, 0.22, -0.15], [0.18, 0.26, -0.12], 0.022, c, { parent: 'tail' });
    return act(t.done(),
      [A.par(po('armL', [-20, 0, 12], 0.3), po('head', [12, 0, 0], 0.3), sayP('Nom nom!', 1.6)), ...osc([['head', [16, 0, 0], [6, 0, 0]]], 4, 0.16), back('armL', 'head')],
      [A.par(po('armR', [0, 0, -150], 0.35), po('head', [-15, 0, 0], 0.35), sayP('Ooh ooh! Ah ah!', 2)), A.par(A.anim('hop', 2), ...oscT([['tail', [0, 30, 0], [0, -20, 0]]], 4, 0.15)), back('armR', 'head')],
    );
  }),
  // A bull moose, 1.9 m at the humped shoulder (lofted): a short heavy body high on long pale legs, a long head
  // with an overhanging nose and a bell of skin under the throat, and broad flat palmate antlers with tines round
  // their rims (bone, kept crisp).
  e('moose', 'wild', 'forest', () => {
    const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
    const palms: QMark = (f, d) => {
      const { l, w, h } = d.q.head, sz = 0.75, c = '#c8b08a', tl = (28 * Math.PI) / 180;
      f.pair((s) => {
        const b = add3(d.sk, [s * w * 0.3, h * 0.36, -l * 0.16]), p = add3(b, [s * sz * 0.22, sz * 0.06, 0]);
        const u: Vec3 = [s * Math.cos(tl), Math.sin(tl), 0], ctr = add3(p, mul(u, sz * 0.42));
        f.rod(b, p, sz * 0.1, c, { parent: 'head', edge: 'sharp' })
          .ball([sz * 0.85, sz * 0.08, sz * 0.6], ctr, { color: c, rot: [0, 0, s * 28], parent: 'head', edge: 'sharp' })
          .rod(add3(p, [0, 0, sz * 0.05]), add3(p, [s * sz * 0.08, sz * 0.1, sz * 0.3]), sz * 0.06, c, { parent: 'head', edge: 'sharp' });
        for (let i = 0; i < 5; i++) {
          const a = tl + (25 + Math.abs(i - 2) * 8) * (Math.PI / 180), dir: Vec3 = [s * Math.cos(a), Math.sin(a), (i - 2) * 0.25];
          const at = add3(add3(ctr, mul(u, sz * 0.36 - Math.abs(i - 2) * sz * 0.05)), [0, 0, (i - 2) * sz * 0.13]);
          f.rod(at, add3(at, mul(dir, sz * 0.22)), sz * 0.06, c, { parent: 'head', edge: 'sharp' });
        }
      });
    };
    const bell: QMark = (f, d) => f.ball([0.06, 0.24, 0.08], add3(d.sk, [0, -d.q.head.h * 0.5 - 0.1, -d.q.head.l * 0.15]), { color: '#3e2b1e', parent: 'head' });
    return act(QK('moose', { c: '#4a3324', H: 1.9, L: 1.95, D: 0.92, W: 0.72, tuck: 0.18, rump: 0.84, hump: 0.18, neck: { l: 0.5, w: 0.4, lean: 64, base: 0.6 }, head: { l: 0.6, w: 0.28, h: 0.32 }, muz: { l: 0.36, w: 0.26, h: 0.3, c: '#3e2b1e', drop: 0.3 }, nose: '#2a1e16', eye: { k: 0.8 }, ear: { k: 'long', s: 0.24, tilt: 40 }, leg: { w: 0.1, hoof: '#2a201a', c: '#4a3324', low: '#8a7560' }, tail: { k: 'stub', l: 0.1, w: 0.08, a: 130 } }, palms, bell, maneQ('#2e2018', 0.6), limbsQ(1.6, '#4a3324')),
      Q.howl('Hwaaaonk!', 1.8),
      [...Q.graze('Munch munch.', 4), ...Q.ears(4, 20)],
    );
  }),
  // A moose calf, about 1.2 m at the shoulder: the moose's long legs and long nose, no antlers yet, a redder coat.
  e('moose calf', 'wild', 'forest', () =>
    act(QK('moose calf', { c: '#8a5a3a', H: 1.15, L: 1.0, D: 0.46, W: 0.36, tuck: 0.25, rump: 0.9, hump: 0.05, neck: { l: 0.36, w: 0.2, lean: 48, base: 0.3 }, head: { l: 0.38, w: 0.18, h: 0.21 }, muz: { l: 0.2, w: 0.16, h: 0.18, c: '#704630', drop: 0.25 }, nose: '#2a1e16', eye: { k: 1.2 }, ear: { k: 'side', s: 0.17 }, leg: { w: 0.07, hoof: '#2a201a', low: '#a07a5a' }, tail: { k: 'stub', l: 0.07, w: 0.05, a: 130 } }, limbsQ(1.6)),
      [A.par(po('jaw', [18, 0, 0], 0.2), po('head', [-12, 0, 0], 0.2), sayP('Mwaa!', 1.4)), back('jaw', 'head'), A.anim('hop', 2)],
      [...Q.ears(6, 30), sayP('?', 1)],
    ),
  ),
  // Real size: a real 1.3 cm mosquito (the vocabulary's 0.1 m is too big).
  e('mosquito', 'bugs', 'flying insects', () =>
    act(scaleFig(bug('mosquito', { length: 0.06, color: '#3e3c40', stripes: '#e8e6e0', wings: 'clear', wingColor: '#d8e8f0', extras: (p, { L }) => {
      const g = (n: string) => p.list.find((x) => x.name === n)!;
      const ab = g('abdomen');
      ab.size = [L * 0.2, L * 0.18, L * 0.56];
      ab.off = [0, -L * 0.02, -L * 0.2];
      for (let i = 0; i < 3; i++) g(`stripe${i}`).size = [L * 0.21, L * 0.19, L * 0.045];
      for (const q of p.list) if (q.name.startsWith('leg')) { q.size = [q.size[0], q.size[1] * 1.9, q.size[2]]; q.off = [0, q.off![1] * 1.9, 0]; }
      g('body').at = [0, L * 0.5, 0];
      rodP(p, 'head', [0, -L * 0.02, L * 0.12], [0, -L * 0.14, L * 0.34], L * 0.022, '#2a2726');
    } }), 0.22),
      G.buzz('Bzzzzzzz!'),
      [A.par(po('body', [25, 0, 0], 0.3), sayP('!', 1)), A.wait(0.8), back('body')],
    ),
  ),
  // A brown moth (4 cm across): dusty patterned wings, feathery antennae. It flutters to a lamp.
  e('moth', 'bugs', 'flying insects', () =>
    act(scaleFig(bug('moth', { length: 0.06, color: '#9a8a72', wings: 'butterfly', wingColor: '#b8a586', extras: (p, { L }) => {
      for (const [w, s] of [['wingL', 1], ['wingR', -1]] as const) {
        add(p, w, 'ball', [L * 0.16, L * 0.012, L * 0.16], [s * L * 0.62, L * 0.012, -L * 0.04], '#5a4a3a', { noInk: true, layer: 4 });
        add(p, w, 'ball', [L * 0.5, L * 0.012, L * 0.06], [s * L * 0.45, L * 0.012, L * 0.12], '#8a7a62', { noInk: true, layer: 4 });
      }
      for (const a of ['antennaL', 'antennaR']) add(p, a, 'ball', [L * 0.07, L * 0.2, L * 0.02], [0, L * 0.18, 0], '#6a5a48');
      add(p, 'body', 'ball', [L * 0.36, L * 0.32, L * 0.32], [0, 0, 0], '#b8a888');
    } }), 0.6),
      [A.spawn('lamp', 'lamp', { rel: 'front', of: 'self', dist: 'near' }), A.move('self', { rel: 'near', of: 'lamp', dist: 'close' }, { speed: 'fly', style: 'fly' }), ...G.buzz('!'), A.remove('lamp', 'fade')],
      G.buzz('...', 3),
    ),
  ),
  e('mountain goat', 'wild', 'mountains', () =>
    act(beast('mountain goat', { color: '#f2efe8', body: [1.0, 0.55, 0.42], legL: 0.45, legW: 0.09, hoof: '#2a2522', hoofH: 0.06, neckL: 0.22, neckLean: 40, neckW: 0.22, head: [0.32, 0.2, 0.16], snout: { len: 0.12, h: 0.12, w: 0.1, color: '#ece8e0' }, nose: '#2a2522', ears: 'pointy', earSize: 0.09, tail: 'stub', acc: [(p, d) => { const [hl, hh, hw] = d.head; for (const s of [1, -1]) coneP(p, 'head', [s * hw * 0.25, hh * 0.42, -hl * 0.05], [s * hw * 0.32, hh * 1.45, -hl * 0.38], hw * 0.24, '#2a2522'); }, ani.beard('#f2efe8'), hump('#f2efe8', 1.1), jaw({ len: 0.12, h: 0.12, w: 0.1 }, '#ece8e0')] }),
      [A.par(A.anim('hop', 2), po('jaw', [18, 0, 0], 0.2), sayP('Meh-eh-eh!', 1.6)), back('jaw')],
      Q.butt('Baa!'),
    ),
  ),
  e('mountain lion', 'wild', 'mountains', () =>
    act(feline('mountain lion', { s: 0.68, color: '#b98a58', belly: '#ecdcc0', snout: '#efe3cc', tailAngle: 115, acc: [tailTip('#3a2a20', 'long'), mask('#3a2a20', 0.6)] }),
      [A.par(po('neck', [-15, 0, 0], 0.3), po('head', [-25, 0, 0], 0.3), po('jaw', [32, 0, 0], 0.3), sayP('Rrreeee-owww!', 2)), A.wait(1), back('neck', 'head', 'jaw')],
      Q.pounce(0.83),
    ),
  ),
  e('mouse', 'pets', 'small pets', () =>
    act(scaleFig(beast('mouse', { color: '#a09a94', belly: '#ece6de', bodyShape: 'ball', body: [0.085, 0.052, 0.055], legL: 0.008, legW: 0.011, legColor: '#e8b4b8', neckL: 0.005, neckLean: 55, neckW: 0.03, head: [0.042, 0.034, 0.036], snout: { len: 0.02, h: 0.018, w: 0.02 }, nose: '#e88a9a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.032, undefined, '#f0b0b8'), ropeTail('#e8b4b8', 0.005, [[0, -0.01, -0.04], [0.01, -0.025, -0.075], [0.03, -0.027, -0.11], [0.05, -0.022, -0.13]]), (p, d) => { for (const s of [1, -1]) for (const a of [-12, 0, 12]) rodP(p, 'head', [s * 0.006, -0.006, d.head[0] * 0.6], [s * 0.03, -0.004 + a * 0.0004, d.head[0] * 0.5], 0.0012, '#e8e4dc', { noInk: true }); }] }), 0.75),
      [treat('cheese', 'cheese', 'close'), A.par(po('neck', [30, 0, 0], 0.3), sayP('Squeak!', 1.4)), ...osc([['head', [20, 10, 0], [10, -10, 0]]], 6, 0.12), back('neck'), A.remove('cheese', 'pop')],
      [...Q.rear('Eek!', 0.08, 1.2)],
    ),
  ),
  // A blue mussel: two dark blue-black shells hinged at the back, orange flesh between; they open to feed.
  // A blue mussel lying on its side: two long, pointed blue-black shells hinged along the back, orange flesh and
  // a tuft of beard threads between them. They gape open to feed and snap shut.
  e('mussel', 'sea', 'shellfish', () => {
    const t = m('mussel', { view: 'side' });
    const sh = '#1c2238', prof: Array<[number, number, number, number?]> = [[0, 0.7, 0.8], [0.35, 1, 1], [0.75, 0.8, 0.8], [1, 0.15, 0.3]];
    t.loft([0.036, 0.026, 0.08], [0, 0.013, 0], prof, { color: sh, cut: 'bottom', name: 'base', edge: 'sharp' })
      .loft([0.032, 0.008, 0.072], [0, 0.0135, 0.0], prof, { color: '#f08c3c', parent: 'base' })
      .loft([0.036, 0.026, 0.08], [0, 0.0135, 0], prof, { color: sh, cut: 'top', name: 'shell', parent: 'base', pivot: [0.017, 0.0135, 0], edge: 'sharp' })
      .loft([0.026, 0.012, 0.05], [-0.002, 0.02, -0.008], prof, { color: '#2e3a5e', cut: 'top', parent: 'shell', noInk: true })
      .ball([0.006, 0.006, 0.01], [0, 0.0135, 0.036], { color: '#8a6a4a', parent: 'base' })
      .each(4, (i) => t.rod([-0.012, 0.012, -0.004 + i * 0.005], [-0.026 - i * 0.002, 0.002, -0.008 + i * 0.006], 0.0015, '#8a7a4a', { parent: 'base' }));
    return act(t.done(), [po('shell', [0, 0, 22], 0.8), A.par(A.effect('water_spray', { dur: 1 }), sayP('!', 1)), po('shell', R0, 0.2)], [A.anim('wobble'), po('shell', [0, 0, 8], 0.3), po('shell', R0, 0.12)]);
  }),
  e('mutt', 'pets', 'dog breeds', () =>
    act(sockOn(dog('mutt', { s: 0.85, color: '#a8743f', belly: '#efe2c8', snout: '#efe2c8', earColor: '#6b4423', tailAngle: 70, acc: [ani.spots('#f2ece0', 4), mask('#6b4423', 1.2, 1), dogCollar(0.85, '#d6453a', '#e2b23a')] }), 'jaw', 'mouth', 'mouth', [0, 0, 0.08], 0.35),
      [A.spawn('stick', 'stick', { rel: 'front', of: 'self', dist: 'near' }), A.par(A.anim('wag'), sayP('Woof woof!', 1.4)), A.move('self', { rel: 'near', of: 'stick', dist: 'touch' }, { speed: 'run' }), A.par(po('neck', [40, 0, 0], 0.3), po('jaw', [20, 0, 0], 0.3)), A.attach('stick', 'self', 'mouth'), back('neck', 'jaw'), A.anim('wag', 2), A.remove('stick', 'pop')],
      [...Q.bark('Arf! Arf!', 2), A.par(A.anim('spin'), sayP('♥', 1.2))],
    ),
  ),
  e('naked mole rat', 'wild', 'rodents', () =>
    act(scaleFig(beast('naked mole rat', { color: '#e8b0a0', body: [0.13, 0.045, 0.05], legL: 0.01, legW: 0.013, neckL: 0.005, neckLean: 70, neckW: 0.03, head: [0.042, 0.032, 0.036], snout: { len: 0.016, h: 0.02, w: 0.026, color: '#eebcae' }, nose: '#d88a8a', ears: 'side', earSize: 0.004, tail: 'long', tailAngle: 120, acc: [ani.stripes('#d89a88', 4), buckTeeth('#f2e8c8', { len: 0.016, h: 0.02, w: 0.026 }), jaw({ len: 0.016, h: 0.02, w: 0.026 }, '#eebcae', '#f2e8c8'), (p, d) => { for (let i = 0; i < 5; i++) add(p, 'body', 'ball', [0.034, 0.003, 0.012], [(i % 2 ? 1 : -1) * 0.018, 0.012 - (i % 3) * 0.006, 0.04 - i * 0.02], '#d49482', { noInk: true, srot: [0, 0, (i % 2 ? 1 : -1) * 60] }); void d; }] }), 0.65),
      Q.dig(3),
      [A.par(sayP('Chirp chirp!', 1.6)), ...osc([['jaw', [30, 0, 0], R0]], 6, 0.1)],
    ),
  ),
  // A narwhal: a mottled grey-white small whale with one long spiral tusk.
  e('narwhal', 'sea', 'whales', () =>
    act(whale('narwhal', { L: 4.8, hk: 0.27, color: '#8c96a0', belly: '#e6e8ea', head: 'round', dorsal: 'hump' }, (t, { L, H, y }) => {
      t.cone([0.12, 2.3, 0.12], [0.06, y + H * 0.04, L * 0.49 + 1.1], { color: '#efe8d6', rot: [88, 0, 0], parent: 'body' });
      t.each(6, (i) => t.torus([0.11 - i * 0.015, 0.11 - i * 0.015, 0.03], [0.06, y + H * 0.04 + i * 0.006, L * 0.5 + 0.2 + i * 0.32], { color: '#c8bea8', noInk: true, parent: 'body' }));
      t.each(8, (i) => t.ball([H * 0.12, H * 0.06, L * 0.06], [((i % 3) - 1) * H * 0.22, y + H * 0.43, L * (0.24 - i * 0.07)], { color: '#5c6670', noInk: true, parent: 'body' }));
    }),
      [A.par(po('body', [-28, 0, 0], 0.6), sayP('!', 1)), ...osc([['body', [-28, 12, 0], [-28, -12, 0]]], 4, 0.3), back('body')],
      W.breach('Splash!'),
    ),
  ),
  // A chambered nautilus: a coiled cream shell striped with rust, a hood and a ring of tentacles. It jets
  // backwards by squirting water.
  e('nautilus', 'sea', 'octopus and squid', () => {
    const t = m('nautilus', { view: 'side' });
    t.ball([0.062, 0.18, 0.18], [0, 0.1, -0.02], { color: '#f3e6d0', name: 'shell' })
      .pair((s) => {
        t.torus([0.085, 0.085, 0.02], [s * 0.025, 0.105, -0.01], { color: '#d9c8aa', rot: [0, 90, 0], parent: 'shell' }).ball([0.012, 0.03, 0.03], [s * 0.03, 0.105, -0.008], { color: '#a8743f', parent: 'shell' });
        for (const a of [20, 50, 80, 110, 140, 170]) {
          const r = 0.066, yy = 0.1 + Math.sin(a * D) * r, zz = -0.02 + Math.cos(a * D) * r;
          t.ball([0.008, 0.012, 0.04], [s * 0.021, yy, zz], { color: '#b5652e', rot: [-a, 0, 0], noInk: true, parent: 'shell' });
        }
      })
      .ball([0.05, 0.07, 0.05], [0, 0.06, 0.07], { color: '#d8a888', name: 'hood', parent: 'shell', pivot: [0, 0.06, 0.05] })
      .ball([0.056, 0.03, 0.04], [0, 0.098, 0.07], { color: '#c87a5a', parent: 'hood' })
      .pair((s) => t.ball(0.014, [s * 0.022, 0.075, 0.08], { color: '#1a1414', eye: true, parent: 'hood' }))
      .each(8, (i) => {
        const x = ((i % 4) - 1.5) * 0.012, y0 = 0.035 + Math.floor(i / 4) * 0.025;
        t.rod([x, y0, 0.09], [x * 1.8, y0 - 0.025, 0.14 + (i % 3) * 0.01], 0.008, '#e0b496', { parent: 'hood' });
      });
    return act(t.done(),
      [A.par(po('hood', [12, 0, 0], 0.3), F.bubbles()[0]), A.par(A.move('self', { rel: 'behind', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' }), A.remove('bub', 'fly_away')), back('hood')],
      [A.par(A.anim('bounce', 2), sayP('!', 1))],
    );
  }),
  // An octopus: a big soft mantle with eyes, eight curling arms with suckers. It waves its arms, and squirts ink.
  e('octopus', 'sea', 'octopus and squid', () => {
    const t = m('octopus');
    const c = '#d9603b', d = '#b8482a';
    t.ball([0.55, 0.65, 0.5], [0, 0.7, -0.06], { color: c, rot: [-12, 0, 0], name: 'body' })
      .ball([0.4, 0.3, 0.4], [0, 0.42, 0.02], { color: c, parent: 'body' })
      .pair((s) =>
        t.ball([0.15, 0.16, 0.1], [s * 0.15, 0.5, 0.17], { color: '#f6f2ea', parent: 'body' })
          .ball([0.07, 0.09, 0.05], [s * 0.15, 0.5, 0.22], { color: '#141414', eye: true, noInk: true, parent: 'body' })
          .each(2, (i) => t.ball([0.06, 0.05, 0.03], [s * (0.1 + i * 0.1), 0.82 - i * 0.12, 0.17 - i * 0.04], { color: '#f0906a', noInk: true, parent: 'body' })),
      )
      .each(8, (i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8, cx = Math.sin(a), cz = Math.cos(a);
        const pts: Vec3[] = [[cx * 0.12, 0.36, cz * 0.12], [cx * 0.42, 0.1, cz * 0.42], [cx * 0.68, 0.07, cz * 0.68], [cx * 0.8 - cz * 0.08, 0.2, cz * 0.8 + cx * 0.08]];
        for (let j = 0; j < 3; j++) t.rod(pts[j], pts[j + 1], [0.15, 0.11, 0.07][j], j === 2 ? d : c, { name: `arm${i}${j ? `_${j}` : ''}`, parent: j ? `arm${i}${j > 1 ? '_1' : ''}` : 'body', pivot: pts[j] });
        for (let k = 0; k < 2; k++) t.ball(0.035, [cx * (0.5 + k * 0.14), 0.07, cz * (0.5 + k * 0.14)], { color: '#f2c8b0', noInk: true, parent: `arm${i}_1` });
      });
    const lift = (i: number, k: number): Vec3 => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return [-k * Math.cos(a), 0, k * Math.sin(a)];
    };
    return act(t.done(),
      [A.par(...Array.from({ length: 8 }, (_, i) => po(`arm${i}`, lift(i, i % 2 ? 35 : 10), 0.4)), sayP('!', 1)), A.par(...Array.from({ length: 8 }, (_, i) => po(`arm${i}`, lift(i, i % 2 ? 10 : 35), 0.4))), A.par(...Array.from({ length: 8 }, (_, i) => po(`arm${i}`, lift(i, i % 2 ? 35 : 10), 0.4))), A.par(...Array.from({ length: 8 }, (_, i) => po(`arm${i}`, R0, 0.4)))],
      [A.par(A.effect('smoke', { dur: 1.6 }), A.anim('hop'), sayP('Pfft!', 1.2))],
    );
  }),
  // An opossum: grizzled grey, white face, black ears and legs, a bare pink tail. Click it and it plays dead.
  e('opossum', 'wild', 'forest', () =>
    act(beast('opossum', { color: '#9a9a9c', body: [0.4, 0.16, 0.15], legL: 0.08, legW: 0.04, legColor: '#2a2725', neckL: 0.04, neckLean: 55, neckW: 0.08, head: [0.13, 0.085, 0.09], headColor: '#f2efe8', snout: { len: 0.09, h: 0.045, w: 0.045, color: '#f2efe8' }, nose: '#e8909a', ears: 'pointy', earSize: 0.045, tail: 'stub', acc: [roundEars(0.045, '#2a2725'), jaw({ len: 0.09, h: 0.045, w: 0.045 }, '#f2efe8', '#f6f2e8'), ropeTail('#ecc0c4', [0.022, 0.018, 0.015, 0.012], [[0, 0, -0.2], [0, -0.05, -0.3], [0.03, -0.11, -0.38], [0.07, -0.12, -0.45], [0.09, -0.08, -0.47]])] }),
      [A.par(po('jaw', [30, 0, 0], 0.2), sayP('Hssss!', 1.2)), A.wait(0.4), A.par(A.anim('fall_over'), sayP('x_x', 2.5)), A.wait(1.5)],
      [A.set({ tilt: 0, dur: 0.6 }), back('jaw'), A.par(A.anim('shake'), sayP('!', 1))],
    ),
  ),
  // An orangutan: long shaggy orange arms reaching the ground, a dark face with cheek pads. It long-calls, and
  // scratches its head.
  e('orangutan', 'wild', 'jungle', () => {
    const t = m('orangutan');
    const c = '#c8642a', d = '#a84e1e', f = '#8a6a55';
    t.ball([0.52, 0.66, 0.42], [0, 0.76, 0], { color: c, name: 'body' })
      .ball([0.32, 0.36, 0.12], [0, 0.72, 0.17], { color: d, noInk: true, parent: 'body' });
    t.pair((s) => {
      const arm = s > 0 ? 'armL' : 'armR';
      t.rod([s * 0.12, 0.45, 0], [s * 0.2, 0.25, 0.06], 0.13, c, { parent: 'body' })
        .rod([s * 0.2, 0.25, 0.06], [s * 0.17, 0.05, 0.06], 0.11, c, { parent: 'body' })
        .ball([0.1, 0.06, 0.16], [s * 0.17, 0.03, 0.1], { color: f, parent: 'body' })
        .rod([s * 0.25, 1.0, 0], [s * 0.44, 0.56, 0.06], 0.13, c, { name: arm, parent: 'body', pivot: [s * 0.25, 1.0, 0] })
        .rod([s * 0.44, 0.56, 0.06], [s * 0.47, 0.1, 0.12], 0.11, c, { parent: arm })
        .capsule([0.12, 0.42, 0.1], [s * 0.4, 0.62, -0.02], { color: d, rot: [0, 0, s * 22], parent: arm })
        .ball([0.12, 0.1, 0.14], [s * 0.47, 0.06, 0.14], { color: f, parent: arm });
    });
    t.ball([0.3, 0.3, 0.28], [0, 1.16, 0.04], { color: c, name: 'head', parent: 'body', pivot: [0, 1.04, 0.02] })
      .ball([0.46, 0.3, 0.1], [0, 1.13, 0.12], { color: '#5e463a', parent: 'head' })
      .ball([0.2, 0.22, 0.12], [0, 1.13, 0.17], { color: f, parent: 'head' })
      .ball([0.13, 0.08, 0.08], [0, 1.06, 0.22], { color: '#9a7a62', parent: 'head' })
      .ball([0.36, 0.2, 0.2], [0, 0.98, 0.1], { color: '#b05a28', parent: 'head' })
      .pair((s) => t.ball([0.03, 0.035, 0.02], [s * 0.045, 1.17, 0.225], { color: '#1a1410', eye: true, noInk: true, parent: 'head' }));
    return act(t.done(),
      [A.par(po('head', [-28, 0, 0], 0.5), sayP('Ooo-OOOH-ahhh!', 2.4)), ...osc([['head', [-30, 0, 6], [-26, 0, -6]]], 4, 0.3), back('head')],
      [A.par(po('armR', [-30, 0, -150], 0.6), po('head', [0, 0, 14], 0.6), sayP('Hmm...', 1.6)), ...osc([['armR', [-30, 0, -158], [-30, 0, -142]]], 4, 0.18), back('armR', 'head')],
    );
  }),
  // An orca: black with the white eye patch, white belly and grey saddle, a tall dorsal fin.
  e('orca', 'sea', 'whales', () =>
    act(whale('orca', { L: 8, hk: 0.27, color: '#1a1c22', belly: '#f4f4f2', head: 'round', dorsal: 'tall' }, (t, { L, H, y }) => {
      t.pair((s) => t.ball([H * 0.05, H * 0.2, L * 0.11], [s * H * 0.4, y + H * 0.12, L * 0.3], { color: '#f4f4f2', noInk: true, parent: 'body' }));
      t.ball([H * 0.5, H * 0.2, L * 0.12], [0, y + H * 0.44, -L * 0.12], { color: '#8a8e96', noInk: true, parent: 'body' });
    }),
      W.breach('Eee-eee-eee!'),
      [...W.slap('!'), ...W.blow('Pfoosh!')],
    ),
  ),
  // An ostrich, 2.4 m: a big black body with white plumes, bare pink neck and legs. It fans its wings and booms,
  // and dips its head to the ground.
  e('ostrich', 'aviary', 'ground birds', () => {
    const t = m('ostrich', { view: 'side', rig: 'bird' });
    const n = '#d8b2a2', lg = '#d9a08a';
    t.ball([0.6, 0.6, 0.92], [0, 1.25, -0.05], { color: '#2a2522', name: 'body' })
      .ball([0.42, 0.3, 0.3], [0, 1.42, -0.5], { color: '#f6f4ee', name: 'tail', parent: 'body' })
      .rod([0, 1.42, 0.3], [0, 2.22, 0.44], 0.11, n, { name: 'neck', parent: 'body', pivot: [0, 1.42, 0.3] })
      .ball([0.16, 0.15, 0.22], [0, 2.3, 0.48], { color: n, name: 'head', parent: 'neck', pivot: [0, 2.2, 0.44] })
      .ball([0.09, 0.05, 0.16], [0, 2.27, 0.62], { color: '#e0b888', parent: 'head' });
    t.pair((s) => {
      t.ball([0.12, 0.4, 0.62], [s * 0.3, 1.3, -0.12], { color: '#2a2522', name: s > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [s * 0.25, 1.45, 0.1] })
        .ball([0.1, 0.22, 0.3], [s * 0.31, 1.2, -0.42], { color: '#f6f4ee', parent: s > 0 ? 'wingL' : 'wingR' })
        .ball(0.055, [s * 0.065, 2.33, 0.53], { color: '#1a1414', eye: true, parent: 'head' })
        .ball([0.18, 0.32, 0.24], [s * 0.15, 0.98, 0], { color: lg, name: s > 0 ? 'legL' : 'legR', parent: 'body', pivot: [s * 0.15, 1.1, 0] })
        .rod([s * 0.15, 0.86, 0.02], [s * 0.15, 0.06, 0.06], 0.075, lg, { parent: s > 0 ? 'legL' : 'legR' })
        .box([0.1, 0.06, 0.22], [s * 0.15, 0.03, 0.13], { color: lg, round: 0.8, parent: s > 0 ? 'legL' : 'legR' });
    });
    return act(t.done(),
      [A.par(po('wingL', [0, 0, 60], 0.4), po('wingR', [0, 0, -60], 0.4), po('neck', [-12, 0, 0], 0.4), sayP('Boom! Boom!', 2)), ...osc([['wingL', [0, 0, 70], [0, 0, 50]], ['wingR', [0, 0, -70], [0, 0, -50]]], 4, 0.25), back('wingL', 'wingR', 'neck')],
      [A.par(po('neck', [105, 0, 0], 0.7), po('head', [-40, 0, 0], 0.7)), sayP('...', 1.2), A.wait(0.8), back('neck', 'head'), sayP('!', 1)],
    );
  }),
  // A river otter, 1.2 m with its thick tapering tail: sleek brown, pale throat, whiskers. It cracks a clam, and
  // rolls in the water.
  // Real size: the vocabulary's 1.2 m is its length nose to tail; it stands 30 cm tall.
  e('otter', 'wild', 'rivers', () =>
    act(scaleFig(beast('otter', { color: '#6b4a2e', belly: '#b89a7a', body: [0.9, 0.22, 0.22], legL: 0.09, legW: 0.065, neckL: 0.12, neckLean: 30, neckW: 0.15, head: [0.17, 0.14, 0.15], snout: { len: 0.06, h: 0.08, w: 0.11, color: '#c4a888' }, nose: '#2a1e16', ears: 'side', earSize: 0.03, tail: 'stub', acc: [roundEars(0.035), coneTail(0.5, 0.12, '#6b4a2e', 0.15), jaw({ len: 0.06, h: 0.08, w: 0.11 }, '#c4a888'), (p, d) => {
      add(p, 'neck', 'ball', [0.13, 0.14, 0.1], [0, 0.06, 0.04], '#c4a888', { noInk: true });
      for (const s of [1, -1]) for (const a of [-10, 5]) rodP(p, 'head', [s * 0.03, -0.02, d.head[0] * 0.5], [s * 0.1, -0.02 + a * 0.002, d.head[0] * 0.42], 0.004, '#e8e0d0', { noInk: true });
    }] }), 0.72),
      [treat('clam', 'clam', 'touch'), ...Q.sit(0.29), ...osc([['legFL', [-40, 0, -20], [-20, 0, -10]], ['legFR', [-40, 0, 20], [-20, 0, 10]]], 6, 0.12), A.par(sayP('Squeak!', 1.4), A.remove('clam', 'pop')), Q.stand()],
      [A.par(A.anim('spin'), A.effect('water_spray', { dur: 1.2 }), sayP('Chirp!', 1.2))],
    ),
  ),
  // A great horned owl: ear tufts, a pale facial disc, huge yellow eyes. It turns its head right round, hoots,
  // and spreads its wings.
  e('owl', 'aviary', 'birds of prey', () =>
    act(owl('owl', 0.8, { body: '#8a6a4a', wing: '#6e5236', face: '#ecdcc0', chest: '#d4b88e', spots: '#6e5236' }, true),
      [po('head', [0, 180, 0], 0.9), A.par(sayP('Hoo-hoo! Hoo!', 2)), A.wait(0.8), po('head', [0, 0, 0], 0.9)],
      [A.par(po('wingL', [0, 0, 85], 0.35), po('wingR', [0, 0, -85], 0.35), A.anim('hop'), sayP('Hoo!', 1.2)), ...osc([['wingL', [0, 0, 95], [0, 0, 60]], ['wingR', [0, 0, -95], [0, 0, -60]]], 4, 0.18), back('wingL', 'wingR')],
    ),
  ),
  e('owlet', 'aviary', 'birds of prey', () =>
    act(owl('owlet', 0.36, { body: '#d8d0c4', wing: '#b8ac9c', face: '#f2eee6', chest: '#ece6dc' }, false, 1.2, 0.14),
      [po('head', [0, 0, 30], 0.4), A.par(sayP('Screech!', 1.6)), A.wait(0.6), po('head', [0, 0, -30], 0.5), A.wait(0.4), back('head')],
      [A.par(A.anim('hop'), sayP('Peep!', 1), ...oscT([['wingL', [0, 0, 60], [0, 0, 20]], ['wingR', [0, 0, -60], [0, 0, -20]]], 3, 0.12))],
    ),
  ),
  // An ox, a big draught bullock 1.6 m at the shoulder (lofted like the bull and the buffalo): a deep barrel, a
  // heavy neck with a dewlap, a pale muzzle, long pale horns curving up, and a wooden neck yoke with its bow (made
  // things, so crisp) riding on the neck. It moos and swishes its tail, and paws the ground.
  e('ox', 'farm', 'cattle', () =>
    act(QK('ox', { c: '#8a4e2a', H: 1.6, L: 2.05, D: 0.95, W: 0.82, tuck: 0.04, rump: 0.97, hump: 0.07, belly: '#9a5e38', neck: { l: 0.36, w: 0.52, lean: 74, base: 0.74 }, head: { l: 0.5, w: 0.38, h: 0.4 }, muz: { l: 0.2, w: 0.3, h: 0.27, c: '#e8c8b0', drop: 0.26 }, nose: '#5a4a40', eye: { k: 0.8 }, ear: { k: 'side', s: 0.17, in: '#e8c8b0' }, leg: { w: 0.12, k: 1.15, hoof: '#2a2018' }, tail: { k: 'tuft', l: 0.85, w: 0.045, a: 168, tip: '#3a2414' } }, hornsQ('#efe6cf', 0.42, 'cow', 0.24), onHead('#7a4020', [0.9, 0.5, 0.6], [0, 0.4, -0.1], { ink: true }), limbsQ(1.5), (f, d) => {
      const n = d.q.neck, nb = d.nb, r = (n.base ?? n.w) * 0.5, y = nb[1] + 0.03, z = nb[2] + 0.12;
      f.ball([n.w * 0.34, n.w * 0.95, n.w * 0.9], [0, nb[1] - n.w * 0.3, nb[2] + n.w * 0.6], { color: '#8a4e2a', parent: 'neck' })
        .box([d.q.W * 1.7, 0.11, 0.14], [0, y + r + 0.07, z], { color: '#8a5a2a', round: 0.3, parent: 'neck', edge: 'sharp' })
        .arc([r * 2.3, r * 2.2, 0.05], [0, y + 0.02, z], { color: '#6b4423', arc: 230, tube: 0.1, rot: [0, 0, 180], parent: 'neck', edge: 'sharp' })
        .pair((s) => f.cyl([0.05, 0.12, 0.05], [s * r * 1.12, y + r + 0.02, z], { color: '#6b4423', parent: 'neck', edge: 'sharp' }));
    }),
      [A.par(po('head', [-15, 0, 0], 0.5), po('jaw', [22, 0, 0], 0.5), sayP('Moooooo!', 2.2)), A.wait(1.2), back('head', 'jaw'), ...Q.swish(4, -10, 30)],
      [...Q.paw(4), A.par(A.anim('shake'), sayP('*snort*', 1.2))],
    ),
  ),
  // A giant panda, black and white: it sits to chew a bamboo shoot, and rolls over.
  e('panda', 'wild', 'forest', () =>
    act(panda('panda', 1, 1),
      [...Q.sit(1.06), A.spawn('shoot', 'bamboo shoot', { rel: 'front', of: 'self', dist: 'touch' }), A.par(po('legFL', [-70, 0, -20], 0.4), po('legFR', [-70, 0, 20], 0.4), sayP('Munch munch...', 2)), ...osc([['jaw', [18, 0, 0], R0]], 6, 0.2), A.remove('shoot', 'fade'), Q.stand()],
      [A.par(A.anim('spin'), sayP('Mmm!', 1.2))],
    ),
  ),
  e('panda cub', 'wild', 'forest', () =>
    act(panda('panda cub', 0.32, 1.4),
      [A.par(A.anim('spin'), sayP('Squeak!', 1.4)), A.anim('wobble')],
      [...Q.sit(0.38), A.par(po('head', [0, 20, 20], 0.4), sayP('?', 1)), A.wait(1), Q.stand()],
    ),
  ),
  e('panther', 'wild', 'jungle', () =>
    act(feline('panther', { s: 0.72, color: '#25252c', snout: '#303038', nose: '#18181c', eyes: '#c8d040', tailAngle: 120, acc: [ani.spots('#1c1c22', 8)] }),
      Q.roar('Grrrowwl!'),
      Q.pounce(0.88),
    ),
  ),
  e('panther cub', 'wild', 'jungle', () =>
    act(feline('panther cub', { s: 0.3, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#2e2e36', snout: '#3a3a42', nose: '#18181c', eyes: '#7ab0d0', tailAngle: 110 }),
      [...Q.pounce(0.38), A.par(po('jaw', [26, 0, 0], 0.2), sayP('Mew!', 1.2)), back('jaw')],
      [A.par(A.anim('spin'), sayP('Mrrp!', 1.2))],
    ),
  ),
  // A green parrot with a yellow crown and red shoulders. It talks.
  e('parrot', 'aviary', 'tropical birds', () =>
    act(birdx('parrot', { height: 0.35, color: '#3cae46', wing: '#2a7a3a', beak: '#e8e0c8', legs: '#7a7a80', tail: ['#3cae46', '#2a6ac0'] }, (p, g, H) => {
      g('tail').rot = [-110, 0, 0];
      bTail(g, H, 1.3, 2);
      bHook(p, g, H, 1.15);
      add(p, 'head', 'ball', [H * 0.18, H * 0.1, H * 0.16], [0, H * 0.22, H * 0.04], '#f2d23a', { layer: 3, noInk: true });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.1, H * 0.08, H * 0.1], [0, H * 0.07, H * 0.06], '#e0402e', { layer: 4, noInk: true });
    }),
      [A.par(sayP('Pretty bird! Pretty bird!', 2.2)), ...osc([['head', [-15, 0, 14], [5, 0, -14]]], 6, 0.16)],
      [...B.flutter(6, 55), sayP('SQUAWK!', 1.4)],
    ),
  ),
  // A peacock with its train fanned: hundreds of eyespots in a shimmering green and gold arc behind a blue body.
  // It rattles the fan and calls, and folds it down.
  e('peacock', 'aviary', 'ground birds', () =>
    act(birdx('peacock', { height: 1.0, color: '#1f4fa8', wing: '#a08a62', beak: '#c8b89a', legs: '#9a8a7a', tail: ['#2e7d4f'] }, (p, g, H) => {
      const T: Vec3 = [0, 0.55, -0.32];
      add(p, undefined, 'ball', [1.98, 1.58, 0.04], T, '#b8a84a', { name: 'train', off: [0, 0.55, -0.15], layer: -6 });
      const tr = (q: Vec3): Vec3 => [q[0] - T[0], q[1] - T[1], q[2] - T[2]];
      add(p, 'train', 'ball', [1.9, 1.5, 0.06], tr([0, 1.1, -0.45]), '#2e7d4f', { layer: -5 });
      for (let i = 0; i < 13; i++) {
        const a = (-84 + i * 14) * D;
        rodP(p, 'train', tr([0, 0.6, -0.42]), tr([Math.sin(a) * 0.9, 1.1 + Math.cos(a) * 0.7, -0.43]), 0.012, '#c8b860', { noInk: true, layer: -4 });
      }
      for (const [f, a0, n] of [[0.84, -80, 9], [0.55, -60, 5], [0.25, -30, 3]] as const)
        for (let i = 0; i < n; i++) {
          const a = (a0 + (i * -2 * a0) / (n - 1)) * D, x = Math.sin(a) * 0.95 * f, y = 1.1 + Math.cos(a) * 0.75 * f;
          add(p, 'train', 'ball', [0.15, 0.17, 0.03], tr([x, y, -0.415]), '#1fa0a0', { layer: -4, noInk: true });
          add(p, 'train', 'ball', [0.08, 0.09, 0.03], tr([x, y, -0.4]), '#1d2f80', { layer: -3, noInk: true });
        }
      for (const x of [-0.03, 0, 0.03]) {
        rodP(p, 'head', [x, H * 0.22, 0], [x * 2.2, H * 0.36, -H * 0.03], H * 0.012, '#1f4fa8');
        add(p, 'head', 'ball', [H * 0.03, H * 0.03, H * 0.02], [x * 2.2, H * 0.37, -H * 0.03], '#2a8ac0');
      }
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.02, H * 0.04, H * 0.1], [s * H * 0.11, H * 0.16, H * 0.04], '#f4f2ee', { noInk: true, layer: 5 });
    }),
      [A.par(sayP('May-AWE! May-AWE!', 2.2), po('head', [-20, 0, 0], 0.3)), ...osc([['train', [0, 0, 3], [0, 0, -3]]], 8, 0.07), back('head')],
      [po('train', [-70, 0, 0], 0.8), A.wait(1.2), po('train', R0, 0.8), sayP('!', 1)],
    ),
  ),
  // A pelican: white, with a long beak and a stretchy orange throat pouch that scoops up fish.
  e('pelican', 'aviary', 'sea birds', () =>
    act(birdx('pelican', { height: 1.05, color: '#f4f2ee', wing: '#e6e4de', beak: '#f0b860', legs: '#e8923a', tail: ['#f4f2ee'] }, (p, g, H) => {
      const b = g('beak');
      b.size = [H * 0.07, H * 0.5, H * 0.05];
      b.off = [0, H * 0.25, 0];
      b.taper = 0.45;
      add(p, 'head', 'ball', [H * 0.075, H * 0.12, H * 0.4], [0, H * 0.04, H * 0.14], '#f0a050', { name: 'pouch', off: [0, 0, H * 0.18], layer: 2 });
      for (const w of ['wingL', 'wingR']) add(p, w, 'ball', [H * 0.08, H * 0.18, H * 0.16], [0, -H * 0.06, -H * 0.14], '#2a2726', { layer: 4 });
    }),
      [treat('fish (animal)', 'fish', 'close'), A.par(po('body', [30, 0, 0], 0.4), po('head', [30, 0, 0], 0.4)), A.par(A.remove('fish', 'pop'), po('pouch', R0, 0.3, { scale: 1.7 })), back('body', 'head'), sayP('Gulp!', 1.4), A.wait(0.6), po('pouch', R0, 0.6, { scale: 1 })],
      B.spread(85, 1.4),
    ),
  ),
  // An emperor penguin, a metre tall: black back, white front, yellow-orange ear patches. It waddles and flaps,
  // and slides off on its belly.
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
    return act(t.done(),
      [A.par(A.anim('wobble', 2), po('head', [-30, 0, 0], 0.3), sayP('Hraaa-aaa!', 1.8), ...oscT([['wingL', [0, 0, 40], [0, 0, 10]], ['wingR', [0, 0, -40], [0, 0, -10]]], 2, 0.25)), back('head')],
      [A.par(po('body', [75, 0, 0], 0.5, { move: [0, -0.32, 0] }), po('wingL', [0, 0, 30], 0.5), po('wingR', [0, 0, -30], 0.5)), A.par(A.effect('snow', { dur: 1.2 }), sayP('!', 1)), back('body', 'wingL', 'wingR')],
    );
  }),
  e('pet', 'pets', 'small pets', () =>
    act(dog('pet', { s: 0.42, headK: 1.2, color: '#c8873f', belly: '#f4efe6', snout: '#f4efe6', earColor: '#8a5428', tailAngle: 60, acc: [dogCollar(0.42, '#2a6ad0', '#e2b23a'), blaze('#f4efe6')] }),
      [...Q.sit(0.31), A.par(po('legFL', [-85, 0, 0], 0.3), sayP('Woof!', 1.2)), ...osc([['legFL', [-95, 0, 0], [-80, 0, 0]]], 3, 0.18), Q.stand(), A.anim('wag')],
      [A.par(A.anim('spin'), sayP('Arf!', 1)), A.anim('wag')],
    ),
  ),
  e('pets', 'pets', 'small pets', () =>
    act(herd('pets', 'side', [
      [dog('pets', { s: 0.4, headK: 1.3, legK: 0.85, color: '#e3b067', belly: '#f6e6c8', snout: '#f6e6c8', earColor: '#a8743f', tailAngle: 50, acc: [dogCollar(0.4, '#d6453a', '#e2b23a')] }), -0.16, 0],
      [feline('pets', { s: 0.2, hk: 1.4, earK: 1.4, color: '#9a9590', belly: '#f4f2ee', snout: '#f4f2ee', tailAngle: 40, eyes: '#8ac040', acc: [ani.stripes('#5a5650', 4)] }), 0.18, 0.04],
    ]),
      [A.par(po('jaw_0', [26, 0, 0], 0.15), sayP('Woof!', 1.2), ...oscT([['tail_0', [0, 40, 0], [0, -40, 0]]], 6, 0.12)), A.par(po('jaw_0', R0, 0.15), po('jaw_1', [24, 0, 0], 0.2), po('head_1', [-10, 0, 0], 0.2), sayP('Meow!', 1.2)), A.wait(0.6), back('jaw_1', 'head_1')],
      [A.par(A.anim('hop'), sayP('♥', 1.2))],
    ),
  ),
  // A city pigeon: blue-grey with an iridescent green-purple neck, red feet. It bobs its head as it struts, coos,
  // and pecks at seeds.
  e('pigeon', 'aviary', 'garden birds', () =>
    act(birdx('pigeon', { height: 0.3, color: '#8a93a3', wing: '#a3abb8', beak: '#3a3a3a', legs: '#d0606a', tail: ['#6a7383'] }, (p, g, H) => {
      g('tail').rot = [-80, 0, 0];
      add(p, 'body', 'ball', [H * 0.34, H * 0.2, H * 0.2], [0, H * 0.13, H * 0.15], '#5a8a7a', { noInk: true, layer: 3 });
      add(p, 'body', 'ball', [H * 0.3, H * 0.12, H * 0.16], [0, H * 0.06, H * 0.17], '#8a5a8a', { noInk: true, layer: 3 });
      add(p, 'head', 'ball', [H * 0.05, H * 0.035, H * 0.04], [0, H * 0.135, H * 0.13], '#efefef', { layer: 4 });
      for (const w of ['wingL', 'wingR']) for (const z of [-0.02, -0.08]) add(p, w, 'ball', [H * 0.09, H * 0.03, H * 0.12], [0, -H * 0.02, H * z], '#3a3e48', { noInk: true, layer: 4 });
    }),
      [A.par(sayP('Coo-roo-coo...', 2)), ...osc([['head', [-10, 0, 0], [20, 0, 0]], ['body', [-6, 0, 0], [4, 0, 0]]], 6, 0.2)],
      [treat('seed', 'seed', 'touch'), ...B.peck(3), A.remove('seed', 'pop')],
    ),
  ),
  e('piglet', 'farm', 'pigs', () =>
    act(beast('piglet', { color: '#f2a7b0', bodyShape: 'ball', body: [0.45, 0.26, 0.28], legL: 0.08, legW: 0.065, hoof: '#c98a94', hoofH: 0.03, neckL: 0.03, neckLean: 70, neckW: 0.18, head: [0.22, 0.2, 0.2], snout: { len: 0.07, h: 0.09, w: 0.1, color: '#f5b8c0', shape: 'cyl' }, nose: '#e898a4', ears: 'pointy', earSize: 0.09, tail: 'curl', acc: [(p, d) => {
      const [hl, hh] = d.head;
      for (const s of [1, -1]) add(p, 'head', 'ball', [0.016, 0.022, 0.01], [s * 0.017, -hh * 0.12, hl * 0.35 + 0.07 * 0.8], '#a04a5a', { layer: 5, noInk: true });
    }] }),
      [A.par(sayP('Oink! Oink!', 1.6)), ...osc([['head', [-15, 0, 0], [5, 0, 0]], ['tail', [0, 40, 0], [0, -40, 0]]], 6, 0.12)],
      [A.spawn('mud', 'mud', { rel: 'at', of: 'self' }), ...Q.lie(0.4, 0.6), A.par(A.anim('wobble', 2), sayP('Squeal!', 1.4)), Q.stand(), A.remove('mud', 'sink')],
    ),
  ),
  e('piranha', 'sea', 'river fish', () =>
    act(fish('piranha', { length: 0.3, color: '#8a96a0', belly: '#d8452e', fin: '#6a7380', shape: 'round', extras: (p, dd) => {
      const { L, H, W } = dd;
      add(p, 'body', 'ball', [W * 0.62, H * 0.26, L * 0.16], [0, -H * 0.22, L * 0.31], '#d8452e', { layer: 3 });
      for (const x of [-0.12, -0.04, 0.04, 0.12]) coneP(p, 'body', [x * W, -H * 0.1, L * 0.375], [x * W, -H * 0.18, L * 0.38], W * 0.08, '#f8f6f0', { layer: 4 });
      fishJaw(p, dd, '#d8452e', '#f8f6f0');
      for (let i = 0; i < 6; i++) add(p, 'body', 'ball', [W * 0.04, L * 0.02, L * 0.02], [(i % 2 ? 1 : -1) * W * 0.42, H * (0.15 - (i % 3) * 0.1), L * (0.1 - i * 0.04)], '#cfd6dc', { noInk: true, layer: 4 });
    } }),
      [A.par(sayP('Chomp chomp chomp!', 1.8)), ...osc([['jaw', [35, 0, 0], R0]], 6, 0.1)],
      F.leap('!'),
    ),
  ),
  // Plankton: a drift of tiny sea life at its real size, a copepod with long feelers, diatoms and a glowing
  // dinoflagellate, all within a couple of centimetres.
  // Real size: real plankton is tiny; the vocabulary's 0.1 m is too big.
  e('plankton', 'sea', 'reef life', () => {
    const t = m('plankton', { view: 'side' });
    const c = '#8fd0c4';
    t.ball([0.018, 0.02, 0.04], [0, 0.045, 0], { color: c, name: 'body' })
      .ball([0.012, 0.014, 0.02], [0, 0.044, -0.026], { color: c, parent: 'body' })
      .ball(0.007, [0, 0.051, 0.017], { color: '#d6453a', eye: true, parent: 'body' })
      .pair((s) => {
        t.rod([s * 0.005, 0.05, 0.012], [s * 0.06, 0.058, 0.0], 0.0025, '#6ab0a4', { parent: 'body' }).rod([s * 0.004, 0.04, -0.034], [s * 0.012, 0.035, -0.056], 0.003, c, { parent: 'body' });
        t.each(3, (i) => t.rod([s * 0.006, 0.038, 0.008 - i * 0.008], [s * 0.014, 0.026, 0.004 - i * 0.01], 0.002, '#6ab0a4', { parent: 'body' }));
      })
      .cyl([0.026, 0.008, 0.026], [0.05, 0.03, 0.03], { color: '#7ab83a', rot: [70, 0, 20], glow: true })
      .capsule([0.009, 0.045, 0.009], [-0.05, 0.032, 0.025], { color: '#9ac84a', rot: [0, 0, 60], glow: true })
      .ball(0.016, [-0.035, 0.009, -0.035], { color: '#6ab03a' })
      .cyl([0.02, 0.006, 0.02], [0.035, 0.07, -0.03], { color: '#b8d84a', rot: [30, 0, -40], glow: true });
    return act(scaleFig(t.done(), 0.25), [A.par(A.anim('pulse', 3), A.effect('sparkle', { dur: 1.5 }))], [A.par(A.anim('bounce', 2), ...oscT([['body', [0, 30, 0], [0, -30, 0]]], 4, 0.2))]);
  }),
  // A platypus: a flat leathery duck bill, sleek brown fur, webbed feet and a beaver's flat tail. It swims and dives
  // with a splash, and digs a burrow.
  e('platypus', 'wild', 'australia', () =>
    act(beast('platypus', { color: '#7a5232', belly: '#b8916a', body: [0.4, 0.13, 0.18], legL: 0.035, legW: 0.045, legColor: '#4a3220', neckL: 0.01, neckLean: 80, neckW: 0.1, head: [0.1, 0.085, 0.1], snout: { len: 0.1, h: 0.022, w: 0.085, color: '#3a3836', shape: 'box' }, nose: '#2a2826', ears: 'side', earSize: 0.005, tail: 'stub', acc: [(p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'box', [W * 0.72, H * 0.22, L * 0.42], [0, -H * 0.05, -L * 0.6], '#6a4428', { round: 0.8, name: 'flatTail', off: [0, 0, -L * 0.1] });
      for (const n of ['pawFL', 'pawFR', 'pawBL', 'pawBR']) add(p, n, 'ball', [0.06, 0.012, 0.06], [0, -0.008, 0.015], '#4a3220');
    }] }),
      [A.par(A.anim('hop'), A.effect('water_spray', { dur: 1.2 }), sayP('Grrr!', 1.2), ...oscT([['flatTail', [20, 0, 0], [-15, 0, 0]]], 4, 0.15))],
      Q.dig(3),
    ),
  ),
  // A polar bear: creamy white, long neck and small head, black nose; it rears up to its full height, and rolls in
  // the snow.
  e('polar bear', 'wild', 'polar', () =>
    act(bear('polar bear', 1.05, '#f2eee2', { snout: '#ece6d6', acc: [(p) => void add(p, 'neck', 'ball', [0.42, 0.5, 0.42], [0, 0.2, 0], '#f2eee2')] }),
      [...Q.rear('RRRAWRR!', 1.6, 1.2)],
      [...Q.lie(1.6, 0.7), A.par(A.anim('spin'), A.effect('snow', { dur: 1.4 }), sayP('Hmmf.', 1.2)), Q.stand()],
    ),
  ),
  e('polar bear cub', 'wild', 'polar', () =>
    act(bear('polar bear cub', 0.42, '#f6f2e8', { hk: 1.45, snout: '#f0ece0' }),
      [A.par(A.anim('spin'), A.effect('snow', { dur: 1.2 }), sayP('Mew!', 1.2))],
      [A.par(po('jaw', [22, 0, 0], 0.2), sayP('Rawr!', 1.2)), Q.tilt('?')[0], A.wait(0.8), back('jaw', 'head')],
    ),
  ),
  // A pomeranian: a little orange puffball with a fox face, small upright ears, a lion's ruff and a plumed tail
  // over its back. It spins and yaps.
  e('pomeranian', 'pets', 'dog breeds', () =>
    act(dog('pomeranian', { s: 0.36, fat: 1.25, legK: 0.6, color: '#e0882e', snoutK: 0.45, snout: '#e89a4a', nose: '#141212', ears: 'pointy', earK: 0.6, tail: 'fluffy', tailAngle: -55, acc: [ani.mane('#eaa04a', true), coat('#e0882e', 0.8), plume(1.4, '#eaa04a'), chest('#f2b860', 1.1, 0.1)] }),
      [A.par(A.anim('spin', 2), sayP('Yip! Yip! Yip!', 1.8))],
      [...Q.bark('Yap!', 2, 0.8), A.anim('wag')],
    ),
  ),
  // A standard poodle, 55 cm at the shoulder, in a show clip: pompoms on the head, chest, ankles, hips and tail tip,
  // a long elegant muzzle. It prances.
  e('poodle', 'pets', 'dog breeds', () =>
    act(dog('poodle', { s: 0.82, legK: 1.3, color: '#f4f1ec', snoutK: 1.25, earK: 1.3, nose: '#1e1c1c', tail: 'long', tailAngle: 30, acc: [tuft('#f4f1ec', 1.5), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.45, H * 1.45, L * 0.55], [0, H * 0.12, L * 0.22], '#f4f1ec');
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.55, H * 0.75, L * 0.25], [s * W * 0.3, -H * 0.05, -L * 0.32], '#f4f1ec');
      for (const q of p.list) if (q.name.startsWith('paw')) q.size = q.size.map((v) => v * 2.3) as Vec3;
      const t = p.list.find((x) => x.name === 'tail')!;
      t.size = [t.size[0] * 0.6, t.size[1] * 0.5, t.size[2] * 0.6];
      t.off = [0, L * 0.12, 0];
      add(p, 'tail', 'ball', [W * 0.42, W * 0.42, W * 0.42], [0, L * 0.26, 0], '#f4f1ec');
    }] }),
      [A.par(A.anim('hop', 3), sayP('Arf!', 1.2), ...oscT([['head', [-15, 0, 0], [5, 0, 0]]], 4, 0.3))],
      [...Q.sit(0.62), A.par(po('legFL', [-80, 0, 0], 0.3), po('legFR', [-80, 0, 0], 0.3), sayP('Woof!', 1.2)), A.wait(0.8), Q.stand()],
    ),
  ),
  // A porcupine: a dark round body bristling with cream-tipped quills that rise and rattle when it is cross.
  e('porcupine', 'wild', 'forest', () =>
    act(beast('porcupine', { color: '#4a3a2e', bodyShape: 'ball', body: [0.55, 0.35, 0.4], legL: 0.06, legW: 0.07, neckL: 0.03, neckLean: 70, neckW: 0.15, head: [0.16, 0.13, 0.14], snout: { len: 0.07, h: 0.07, w: 0.08, color: '#6a5a4a' }, nose: '#1e1a18', ears: 'side', earSize: 0.02, tail: 'stub', acc: [(p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 0.98, H * 0.96, L * 0.96], [0, H * 0.04, -L * 0.02], '#3a2e24', { name: 'quills' });
      let i = 0;
      for (const zr of [0.55, 0.2, -0.15, -0.5, -0.85])
        for (const a of [-75, -45, -15, 15, 45, 75]) {
          const dir: Vec3 = [Math.sin(a * D), Math.cos(a * D), zr];
          const b = surf([0, 0, 0], [W / 2, H / 2, L / 2], dir, 0.85);
          const n = Math.hypot(dir[0], dir[1], dir[2] - 0.7), len = 0.24 + (i % 3) * 0.05;
          const q: Vec3 = [b[0], b[1] - H * 0.04, b[2] + L * 0.02];
          coneP(p, 'quills', q, [q[0] + (dir[0] / n) * len, q[1] + (dir[1] / n) * len, q[2] + ((dir[2] - 0.7) / n) * len], 0.036, i++ % 2 ? '#efe6d2' : '#c8b89a', { layer: 3 });
        }
    }] }),
      [A.par(po('quills', [-8, 0, 0], 0.3, { scale: 1.18 }), sayP('Rattle-rattle!', 1.6)), ...osc([['quills', [-8, 4, 0], [-8, -4, 0]]], 6, 0.08), A.wait(0.6), po('quills', R0, 0.6, { scale: 1 })],
      [A.par(po('neck', [30, 0, 0], 0.4), sayP('*sniff sniff*', 1.6)), ...osc([['head', [15, 10, 0], [5, -10, 0]]], 4, 0.2), back('neck')],
    ),
  ),
  e('porpoise', 'sea', 'whales', () => act(whale('porpoise', { L: 1.8, hk: 0.26, color: '#6a7a89', belly: '#e0e4e8', head: 'round', dorsal: 'fin' }), W.breach('Click-click-click!', 2), [...W.swim(4), ...W.blow('Pff!')])),
  // A rooster, a hen and a chick. The hen lays an egg and it hatches; the rooster crows.
  e('poultry', 'farm', 'poultry', () =>
    act(herd('poultry', 'side', [
      [birdx('poultry', { height: 0.55, color: '#c0522a', wing: '#8a3a1e', beak: '#e8b84a', legs: '#e8b84a', comb: '#d62828', tail: ['#1e4a3a', '#2a6a4a', '#1e3a2e'] }, (p, g, H) => {
        g('tail').rot = [-20, 0, 0];
        bTail(g, H, 1.4, 3, 1.4);
        add(p, 'body', 'ball', [H * 0.3, H * 0.24, H * 0.2], [0, H * 0.15, H * 0.15], '#e8a03a', { noInk: true, layer: 3 });
      }), -0.2, 0],
      [birdx('poultry', { height: 0.4, color: '#f4f0e6', wing: '#e8e2d6', beak: '#e8b84a', legs: '#e8b84a', comb: '#d62828' }), 0.2, 0.06],
      [bird('poultry', { height: 0.13, color: '#f6d24a', wing: '#f0c030', beak: '#f0923b', legs: '#f0923b' }), 0.04, 0.32],
    ]),
      [A.par(po('body_1', [-10, 0, 0], 0.3), sayP('Bawk-bawk-BAWK!', 1.8)), A.spawn('egg', 'egg', { rel: 'front', of: 'self', dist: 'touch' }), back('body_1'), A.wait(0.8), A.par(A.anim('wobble', 2, 'egg')), A.morph('chick (bird)', 'egg'), sayP('Peep!', 1.2), A.wait(1), A.remove('egg', 'fade')],
      [A.par(po('body_0', [-22, 0, 0], 0.4), po('head_0', [-40, 0, 0], 0.4), po('wingL_0', [0, 0, 35], 0.4), po('wingR_0', [0, 0, -35], 0.4), sayP('Cock-a-doodle-doo!', 2.4)), A.wait(1.6), back('body_0', 'head_0', 'wingL_0', 'wingR_0')],
    ),
  ),
  // A prairie dog standing guard on its burrow mound. It throws its arms up and leaps with a yip (the "jump-yip"),
  // or ducks down into the hole.
  e('prairie dog', 'wild', 'rodents', () => {
    const t = m('prairie dog');
    const c = '#c49a6a', l = '#e2c9a0';
    t.cyl([0.36, 0.07, 0.28], [0, 0.035, -0.05], { color: '#8a6a4a', taper: 0.6 })
      .ball([0.15, 0.03, 0.13], [0, 0.068, 0.04], { color: '#3a2a1e', noInk: true })
      .ball([0.15, 0.11, 0.13], [0, 0.065, 0.04], { color: c, name: 'hips' })
      .ball([0.13, 0.2, 0.11], [0, 0.15, 0.04], { color: c, name: 'torso', parent: 'hips', pivot: [0, 0.09, 0.04] })
      .ball([0.09, 0.15, 0.06], [0, 0.14, 0.08], { color: l, noInk: true, parent: 'torso' })
      .ball([0.09, 0.08, 0.085], [0, 0.27, 0.05], { color: c, name: 'head', parent: 'torso', pivot: [0, 0.23, 0.05] })
      .ball([0.05, 0.04, 0.04], [0, 0.258, 0.09], { color: l, parent: 'head' })
      .ball([0.016, 0.012, 0.01], [0, 0.268, 0.11], { color: '#3a2a20', noInk: true, parent: 'head' })
      .pair((s) =>
        t.ball([0.014, 0.016, 0.01], [s * 0.024, 0.285, 0.086], { color: '#141010', eye: true, noInk: true, parent: 'head' })
          .ball([0.02, 0.018, 0.012], [s * 0.04, 0.305, 0.04], { color: c, parent: 'head' })
          .rod([s * 0.035, 0.2, 0.09], [s * 0.022, 0.175, 0.115], 0.018, c, { name: s > 0 ? 'armL' : 'armR', parent: 'torso', pivot: [s * 0.035, 0.2, 0.09] })
          .ball([0.018, 0.014, 0.018], [s * 0.02, 0.17, 0.12], { color: l, parent: s > 0 ? 'armL' : 'armR' })
          .ball([0.04, 0.02, 0.065], [s * 0.045, 0.01, 0.08], { color: c, parent: 'hips' }),
      )
      .rod([0, 0.04, -0.03], [0, 0.03, -0.075], 0.022, c, { parent: 'hips' })
      .ball(0.02, [0, 0.028, -0.088], { color: '#3a2a20', parent: 'hips' });
    return act(t.done(),
      [A.par(po('torso', [-18, 0, 0], 0.25), po('head', [-30, 0, 0], 0.25), po('armL', [-40, 0, 150], 0.25), po('armR', [-40, 0, -150], 0.25), A.anim('hop'), sayP('Wee-OO! Yip!', 1.6)), A.wait(0.3), back('torso', 'head', 'armL', 'armR')],
      [A.par(po('hips', R0, 0.25, { move: [0, -0.2, 0] }), sayP('!', 0.8)), A.wait(1.2), po('hips', R0, 0.6, { move: R0 }), ...osc([['head', [0, 30, 0], [0, -30, 0]]], 2, 0.3)],
    );
  }),
  // A pteranodon, real size: about 4.5 m across the wings, standing 1.8 m on short hind legs with its wings spread
  // (leathery membranes from the long fourth finger down to the ankle, three small claws at each wrist), its head
  // turned to show the long toothless beak and the swept-back red crest. It flaps and screeches. (The vocabulary's
  // 0.5 m is too small for the animal.)
  e('pterodactyl', 'wild', 'prehistoric', () => {
    const k = 0.92, K = (v: Vec3): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
    const t = m('pterodactyl', { rig: 'bird' });
    const b = '#7a7f6a', bl = '#c8c4b0', w = '#c9925a';
    // torso held half upright on short hind legs
    t.ball(K([0.32, 0.56, 0.34]), K([0, 1.0, 0]), { color: b, rot: [-12, 0, 0], name: 'body' })
      .ball(K([0.22, 0.4, 0.14]), K([0, 0.98, 0.1]), { color: bl, parent: 'body', noInk: true })
      .rod(K([0, 1.2, 0.04]), K([0, 1.46, 0.1]), 0.11 * k, b, { parent: 'body' });
    // head turned to show its profile: a long toothless beak one way, a swept crest the other
    const hc = K([0, 1.52, 0.12]), dB: Vec3 = [-0.72, -0.12, 0.68], dC: Vec3 = [0.7, 0.4, -0.6];
    const nB = Math.hypot(...dB), nC = Math.hypot(...dC);
    const at = (d: Vec3, n: number, l: number): Vec3 => [hc[0] + (d[0] / n) * l * k, hc[1] + (d[1] / n) * l * k, hc[2] + (d[2] / n) * l * k];
    t.ball(K([0.2, 0.19, 0.18]), hc, { color: b, name: 'head', parent: 'body', pivot: K([0, 1.44, 0.1]) })
      .cone(K([0.12, 0.85, 0.1]), at(dB, nB, 0.5), { color: '#d9c79a', rot: aim(dB), parent: 'head', edge: 'sharp' })
      .cone(K([0.09, 0.7, 0.07]), [at(dB, nB, 0.43)[0], at(dB, nB, 0.43)[1] - 0.035 * k, at(dB, nB, 0.43)[2]], { color: '#cbb888', rot: aim([dB[0], dB[1] - 0.08, dB[2]]), parent: 'head', edge: 'sharp' })
      .cone(K([0.05, 0.62, 0.16]), at(dC, nC, 0.36), { color: '#c0392b', rot: aim(dC), parent: 'head', edge: 'sharp' })
      .pair((s) => t.ball(K([0.04, 0.045, 0.04]), [hc[0] - 0.03 * k, hc[1] + 0.04 * k, hc[2] + s * 0.08 * k], { color: '#141010', eye: true, parent: 'head', noInk: true }));
    t.pair((s) => {
      const wing = s > 0 ? 'wingL' : 'wingR', sh = K([s * 0.13, 1.2, 0]), tip = K([s * 2.35, 1.95, -0.1]);
      const S = Math.hypot(tip[0] - sh[0], tip[1] - sh[1]), a = Math.atan2(tip[1] - sh[1], Math.abs(tip[0] - sh[0])), C = 0.78 * k;
      const wr: Vec3 = [sh[0] + (tip[0] - sh[0]) * 0.3, sh[1] + (tip[1] - sh[1]) * 0.3, sh[2] + (tip[2] - sh[2]) * 0.3];
      const ly: Vec3 = [-s * Math.sin(a), Math.cos(a), 0], mid: Vec3 = [(sh[0] + tip[0]) / 2 - ly[0] * C * 0.5, (sh[1] + tip[1]) / 2 - ly[1] * C * 0.5, (sh[2] + tip[2]) / 2 - 0.03];
      // the arm to the wrist, the long fourth finger to the tip, and the membrane stretched behind them, deep at the
      // body (down to the ankle) and narrowing to the tip
      t.rod(sh, wr, 0.075 * k, b, { name: wing, parent: 'body', pivot: sh })
        .rod(wr, tip, 0.04 * k, b, { parent: wing })
        .ball(K([0.08, 0.06, 0.08]), wr, { color: b, parent: wing })
        .loft([0.07 * k, C, S], mid, [[0, 1, 0.92, 0.04], [0.22, 1, 1, 0], [0.45, 1, 0.72, 0.14], [0.7, 0.8, 0.44, 0.28], [0.9, 0.6, 0.2, 0.4], [1, 0.4, 0.05, 0.47]], { color: w, rot: [-90, s * (90 - (a * 180) / Math.PI), s * 90], parent: wing })
        .each(3, (i) => t.cone(K([0.025, 0.1, 0.025]), [wr[0] + s * i * 0.015, wr[1] - 0.05 - i * 0.02, wr[2] + 0.04], { color: '#3a3428', rot: [150, 0, s * (10 + i * 15)], parent: wing, edge: 'sharp' }));
      // short hind legs, feet flat on the ground
      const hip = K([s * 0.1, 0.8, -0.04]), knee = K([s * 0.2, 0.45, 0.06]), ft = K([s * 0.22, 0.04, -0.02]);
      t.rod(hip, knee, 0.07 * k, b, { parent: 'body' }).rod(knee, ft, 0.05 * k, b, { parent: 'body' })
        .ball(K([0.09, 0.05, 0.16]), K([s * 0.22, 0.025, 0.04]), { color: '#5a5e4c', parent: 'body' });
    });
    return act(t.done(),
      [A.par(A.anim('hop'), sayP('SKREEEE!', 1.6), ...oscT([['wingL', [0, 0, 30], [0, 0, -25]], ['wingR', [0, 0, -30], [0, 0, 25]]], 3, 0.25))],
      [A.par(po('head', [-25, 0, 0], 0.3), sayP('Kraa!', 1.2)), ...osc([['head', [0, 30, 0], [0, -30, 0]]], 2, 0.3), back('head')],
    );
  }),
  // An Atlantic puffin: black and white with a big striped orange beak and orange feet. It groans and flaps.
  e('puffin', 'aviary', 'sea birds', () =>
    act(birdx('puffin', { height: 0.3, color: '#1e1e24', wing: '#1e1e24', beak: '#e8572a', legs: '#f0782a', tail: ['#1e1e24'] }, (p, g, H) => {
      g('beak').size = [H * 0.08, H * 0.15, H * 0.17];
      add(p, 'head', 'ball', [H * 0.07, H * 0.14, H * 0.03], [0, H * 0.11, H * 0.125], '#5a6a8a', { layer: 4 });
      add(p, 'beak', 'ball', [H * 0.085, H * 0.03, H * 0.1], [0, H * 0.06, 0], '#f2c230', { layer: 4, noInk: true });
      bBelly(p, H, '#f6f4ee', 1.05);
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.04, H * 0.15, H * 0.17], [s * H * 0.1, H * 0.11, H * 0.03], '#ecebe6', { noInk: true, layer: 3 });
    }),
      [A.par(sayP('Arrr-arrr-arrr!', 1.8)), ...osc([['head', [10, 0, 0], [-10, 0, 0]]], 4, 0.25)],
      [A.par(A.anim('hop'), sayP('!', 1), ...oscT([['wingL', [0, 0, 70], [0, 0, 20]], ['wingR', [0, 0, -70], [0, 0, -20]]], 3, 0.1))],
    ),
  ),
  // A pug: fawn, stocky, with a flat black-masked face, wrinkled brow, big round eyes, folded black ears and a
  // tail curled tight over its hip. It snorts.
  e('pug', 'pets', 'dog breeds', () =>
    act(dog('pug', { s: 0.44, fat: 1.3, legK: 0.75, headK: 1.3, snoutK: 0.35, color: '#d9b98a', snout: '#2a2522', earColor: '#2a2522', earK: 0.55, nose: '#141212', tail: 'curl', tailAngle: 20, acc: [bigEyes(1.35), (p, d) => {
      const [hl, hh, hw] = d.head;
      add(p, 'head', 'ball', [hw * 0.82, hh * 0.62, hl * 0.42], [0, -hh * 0.1, hl * 0.36], '#2a2522', { layer: 3 });
      for (let i = 0; i < 2; i++) add(p, 'head', 'box', [hw * 0.5, hh * 0.05, hl * 0.1], [0, hh * (0.32 + i * 0.1), hl * 0.4], '#a88a62', { round: 0.9, noInk: true, layer: 4 });
    }] }),
      [A.par(sayP('Snort! Snort!', 1.6), po('head', [-10, 0, 0], 0.2)), ...osc([['head', [-10, 0, 0], [5, 0, 0]], ['jaw', [12, 0, 0], R0]], 4, 0.14), ...Q.tilt('?')],
      [A.par(A.anim('spin'), sayP('Snrk!', 1)), A.anim('wag')],
    ),
  ),
  e('puppy', 'pets', 'dog breeds', () =>
    act(dog('puppy', { s: 0.4, headK: 1.5, legK: 0.8, snoutK: 0.6, color: '#e3b067', belly: '#f6e6c8', snout: '#f6e6c8', earColor: '#c58f45', earK: 1.15, tailAngle: 50, acc: [bigEyes(1.2)] }),
      [A.par(A.anim('spin', 2), sayP('Yip yip!', 1.6))],
      [...Q.bark('Arf!', 1), A.par(A.anim('wag', 2), sayP('♥', 1.2))],
    ),
  ),
  // A brown rabbit: long ears, white cotton tail, strong back legs. It thumps and hops, and nibbles a carrot.
  e('rabbit', 'pets', 'small pets', () =>
    act(beast('rabbit', { color: '#a8876a', belly: '#f2ece4', bodyShape: 'ball', body: [0.3, 0.2, 0.2], legL: 0.03, legW: 0.05, neckL: 0.03, neckLean: 40, neckW: 0.1, head: [0.12, 0.11, 0.1], snout: { len: 0.04, h: 0.05, w: 0.06, color: '#efe8e0' }, nose: '#e88a9a', ears: 'long', earSize: 0.13, tail: 'stub', tailColor: '#f6f4f0', acc: [(p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.4, H * 0.62, L * 0.45], [s * W * 0.32, -H * 0.14, -L * 0.18], '#a8876a');
      for (const n of ['earL', 'earR']) add(p, n, 'ball', [0.026, 0.1, 0.02], [0, 0.055, 0.013], '#f0b0b8', { noInk: true });
      for (const s of [1, -1]) for (const a of [-8, 6]) rodP(p, 'head', [s * 0.012, -0.012, d.head[0] * 0.55], [s * 0.06, -0.012 + a * 0.001, d.head[0] * 0.5], 0.0018, '#f4f0e8', { noInk: true });
    }] }),
      [A.par(po('legBL', [20, 0, 0], 0.12), po('legBR', [20, 0, 0], 0.12), A.effect('dust', { dur: 0.6 }), sayP('Thump!', 1)), back('legBL', 'legBR'), A.anim('hop', 3)],
      [treat('carrot', 'carrot', 'touch'), A.par(po('neck', [25, 0, 0], 0.3), sayP('Nibble nibble...', 1.8)), ...osc([['head', [12, 0, 0], [4, 0, 0]], ['earL', [-10, 0, 0], [5, 0, 0]]], 6, 0.12), back('neck'), A.remove('carrot', 'pop')],
    ),
  ),
  // A raccoon: grey with a black bandit mask and a ringed tail. It washes its food in its little hands.
  e('raccoon', 'wild', 'forest', () =>
    act(beast('raccoon', { color: '#8a8580', belly: '#c8c4be', body: [0.55, 0.26, 0.25], legL: 0.1, legW: 0.06, legColor: '#3a3634', neckL: 0.05, neckLean: 50, neckW: 0.12, head: [0.17, 0.13, 0.16], snout: { len: 0.07, h: 0.06, w: 0.06, color: '#efebe5' }, ears: 'pointy', earSize: 0.07, tail: 'fluffy', tailAngle: 120, acc: [bandit('#2a2725'), brows('#efebe5', 0.9), tailRings('#2a2725', 4, 'fluffy'), tailTip('#2a2725', 'fluffy'), jaw({ len: 0.07, h: 0.06, w: 0.06 }, '#efebe5', '#f6f2e8')] }),
      [treat('apple', 'food', 'touch'), ...Q.sit(0.39), A.par(A.effect('water_spray', { dur: 1.4 }), sayP('Chitter chitter!', 1.6), ...oscT([['legFL', [-70, 0, -15], [-50, 0, 10]], ['legFR', [-50, 0, 15], [-70, 0, -10]]], 3, 0.2)), A.remove('food', 'pop'), Q.stand()],
      [A.par(po('jaw', [28, 0, 0], 0.2), sayP('Hssss!', 1.2)), A.anim('shake'), back('jaw')],
    ),
  ),
  e('ram', 'farm', 'sheep', () =>
    act(beast('ram', { color: '#eee8da', bodyShape: 'ball', body: [0.95, 0.55, 0.55], legL: 0.3, legW: 0.08, legColor: '#e2d8cc', hoof: '#3a3330', hoofH: 0.05, neckL: 0.12, neckLean: 45, neckW: 0.2, head: [0.3, 0.22, 0.2], headColor: '#e8dccf', snout: { len: 0.12, h: 0.13, w: 0.12, color: '#e2d2c2' }, nose: '#8a6a60', ears: 'side', earSize: 0.09, tail: 'stub', acc: [tuft('#eee8da'), jaw({ len: 0.12, h: 0.13, w: 0.12 }, '#e2d2c2'), (p, d) => {
      const [hl, hh, hw] = d.head;
      for (const s of [1, -1]) {
        add(p, 'head', 'torus', [hh * 1.2, hh * 1.2, hw * 0.3], [s * hw * 0.52, hh * 0.25, -hl * 0.05], '#b89a6a', { srot: [0, 90, 0], tube: 0.36 });
        add(p, 'head', 'torus', [hh * 0.62, hh * 0.62, hw * 0.24], [s * hw * 0.62, hh * 0.18, hl * 0.02], '#a88a5a', { srot: [0, 90, 0], tube: 0.4 });
      }
    }] }),
      [...Q.paw(3), ...Q.butt('BAAA!')],
      Q.graze('Baa-aa!'),
    ),
  ),
  // A bird of prey (an eagle): dark brown, white head and tail, a hooked yellow beak and yellow talons.
  e('raptor', 'aviary', 'birds of prey', () =>
    act(birdx('raptor', { height: 0.75, color: '#4a3424', wing: '#3e2a1c', beak: '#f2c230', legs: '#f2c230', tail: ['#f4f2ee', '#f4f2ee', '#f4f2ee'] }, (p, g, H) => {
      g('head').color = col('#f6f4ee');
      g('tail').rot = [-75, 0, 0];
      bHook(p, g, H, 1.25);
      add(p, 'head', 'box', [H * 0.2, H * 0.035, H * 0.08], [0, H * 0.18, H * 0.08], '#f6f4ee', { round: 0.8, layer: 4 });
      for (const s of ['L', 'R']) add(p, 'leg' + s, 'ball', [H * 0.1, H * 0.14, H * 0.1], [0, -H * 0.03, 0], '#4a3424');
    }),
      B.spread(85, 1.6, 'KREEEE!'),
      [...B.look(100), A.par(A.anim('hop'), sayP('!', 0.8))],
    ),
  ),
  e('rat', 'wild', 'rodents', () =>
    act(beast('rat', { color: '#7a6a5e', belly: '#c8bcb0', body: [0.2, 0.09, 0.1], legL: 0.018, legW: 0.022, legColor: '#e0b0b0', neckL: 0.01, neckLean: 50, neckW: 0.05, head: [0.07, 0.055, 0.06], snout: { len: 0.04, h: 0.03, w: 0.032 }, nose: '#e88a9a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.032, undefined, '#f0b0b8'), jaw({ len: 0.04, h: 0.03, w: 0.032 }, '#7a6a5e', '#f2e2b0'), ropeTail('#e0a8a8', [0.012, 0.01, 0.008], [[0, -0.01, -0.1], [0.02, -0.04, -0.18], [0.06, -0.05, -0.25], [0.1, -0.045, -0.29]]), (p, d) => { for (const s of [1, -1]) for (const a of [-10, 0, 10]) rodP(p, 'head', [s * 0.01, -0.008, d.head[0] * 0.7], [s * 0.045, -0.006 + a * 0.0006, d.head[0] * 0.62], 0.0015, '#d8d0c8', { noInk: true }); }] }),
      [...Q.rear('Squeak!', 0.12, 1.2)],
      [treat('bread', 'food', 'touch'), A.par(po('neck', [30, 0, 0], 0.3), sayP('*nibble*', 1.4)), ...osc([['jaw', [24, 0, 0], R0]], 6, 0.1), back('neck'), A.remove('food', 'pop')],
    ),
  ),
  // A diamondback rattlesnake, coiled, its rattle held up and buzzing as a warning before it strikes.
  e('rattlesnake', 'wild', 'reptiles', () =>
    act(fx(snake('rattlesnake', { length: 1.4, color: '#c2a06a', bands: '#6e4f2e', girth: 0.07 }), (p) => {
      const t = 1.4 * 0.07;
      p.add({ name: 'rattle', parent: 'seg0', at: [0, -t * 0.3, 0], rot: [150, 0, 0], shape: 'ball', size: [t * 0.6, t * 0.4, t * 0.6], off: [0, t * 0.2, 0], color: col('#e8d8b0'), layer: 1 });
      for (let i = 1; i < 4; i++) add(p, 'rattle', 'ball', [t * (0.62 - i * 0.07), t * 0.38, t * (0.62 - i * 0.07)], [0, t * 0.2 + i * t * 0.3, 0], '#e8d8b0', { layer: 1 });
      for (let i = 0; i < 8; i++) add(p, `seg${i}`, 'ball', [t * 0.55, t * 0.2, t * 0.6], [0, 1.4 * 0.85 / 8 * 0.5, t * 0.42], '#4e3a22', { srot: [0, 0, 45], noInk: true, layer: 3 });
    }),
      [A.par(sayP('Tsk-tsk-tsk-tsk!', 2)), ...osc([['rattle', [150, 0, 20], [150, 0, -20]]], 10, 0.06)],
      [...S.flick(3), ...S.strike('Hsss!')],
    ),
  ),
  // A red panda: russet fur, white face markings, a black belly and legs, a fat ringed tail. Startled, it rears up
  // on its hind legs with its arms out to look bigger.
  e('red panda', 'wild', 'forest', () =>
    act(beast('red panda', { color: '#c2502a', legColor: '#2a1e1a', belly: '#3a2620', body: [0.5, 0.22, 0.22], legL: 0.1, legW: 0.06, neckL: 0.05, neckLean: 50, neckW: 0.12, head: [0.16, 0.14, 0.17], headColor: '#c8582c', snout: { len: 0.05, h: 0.06, w: 0.08, color: '#f4efe8' }, nose: '#1e1a18', ears: 'pointy', earSize: 0.07, earColor: '#f4efe8', tail: 'fluffy', tailAngle: 115, acc: [tailRings('#8a3418', 4, 'fluffy'), cheeks('#f4efe8', 0.9), brows('#f4efe8', 0.8), jaw({ len: 0.05, h: 0.06, w: 0.08 }, '#f4efe8')] }),
      [A.par(po('body', [-55, 0, 0], 0.35, { move: [0, 0.12, -0.06] }), po('legBL', [55, 0, 0], 0.35), po('legBR', [55, 0, 0], 0.35), po('legFL', [-20, 0, 80], 0.35), po('legFR', [-20, 0, -80], 0.35), po('neck', [-10, 0, 0], 0.35), po('head', [45, 0, 0], 0.35), po('jaw', [20, 0, 0], 0.35), sayP('Hff! Hff!', 1.8)), A.wait(1.4), back('body', 'legBL', 'legBR', 'legFL', 'legFR', 'neck', 'head', 'jaw')],
      [...Q.sit(0.38), ...Q.tilt('?'), Q.stand()],
    ),
  ),
  // A northern cardinal: bright red, a pointed crest, a black mask round a thick orange beak. It whistles.
  e('redbird', 'aviary', 'garden birds', () =>
    act(birdx('redbird', { height: 0.22, color: '#d42a2a', wing: '#b51f1f', beak: '#f08a3a', legs: '#8a6a5a', tail: ['#b51f1f', '#b51f1f'] }, (p, g, H) => {
      g('tail').rot = [-80, 0, 0];
      coneP(p, 'head', [0, H * 0.2, -H * 0.02], [0, H * 0.38, -H * 0.13], H * 0.12, '#d42a2a');
      add(p, 'head', 'ball', [H * 0.17, H * 0.12, H * 0.08], [0, H * 0.09, H * 0.1], '#1e1a1a', { layer: 3, noInk: true });
      g('beak').size = [H * 0.12, H * 0.11, H * 0.1];
    }),
      B.sing('Birdie-birdie-birdie!', 1.8),
      [...B.flutter(4, 50), sayP('Chip!', 1)],
    ),
  ),
  e('reindeer', 'wild', 'polar', () =>
    act(beast('reindeer', { color: '#7a5a40', belly: '#e8dcc8', body: [1.4, 0.65, 0.5], legL: 0.65, legW: 0.1, hoof: '#2a2018', hoofH: 0.08, neckL: 0.35, neckLean: 40, neckW: 0.24, head: [0.42, 0.24, 0.21], snout: { len: 0.16, h: 0.16, w: 0.14, color: '#5a4030' }, nose: '#2a2018', ears: 'side', earSize: 0.12, tail: 'stub', tailColor: '#f4efe6', acc: [antlers('#c8b08a', 0.75, 1.1), chest('#efe6d6', 1.1, 0.1), jaw({ len: 0.16, h: 0.16, w: 0.14 }, '#5a4030')] }),
      [A.par(po('head', [-10, 0, 0], 0.3), po('jaw', [16, 0, 0], 0.3), sayP('Hrrnk! Hrrnk!', 1.6)), back('head', 'jaw'), A.par(A.effect('snow', { dur: 1.2 }), ...oscT([['legFL', [-45, 0, 0], [12, 0, 0]]], 4, 0.18))],
      Q.graze('*munch*'),
    ),
  ),
  // A white rhinoceros: grey, heavy, two horns on the nose. It paws the ground and charges.
  e('rhinoceros', 'wild', 'savanna', () =>
    act(beast('rhinoceros', { color: '#8d8a85', body: [2.6, 1.3, 1.1], legL: 0.55, legW: 0.3, hoof: '#6a6762', hoofH: 0.12, neckL: 0.25, neckLean: 75, neckW: 0.6, head: [0.85, 0.5, 0.45], snout: { len: 0.25, h: 0.35, w: 0.35, shape: 'box' }, nose: '#5a5752', ears: 'pointy', earSize: 0.2, tail: 'tuft', acc: [ani.stripes('#7a7772', 2), jaw({ len: 0.25, h: 0.35, w: 0.35 }), (p, d) => {
      const [hl, hh] = d.head;
      coneP(p, 'head', [0, hh * 0.1, hl * 0.56], [0, hh * 1.5, hl * 0.64], 0.24, '#c9c0b0', { layer: 4 });
      coneP(p, 'head', [0, hh * 0.42, hl * 0.32], [0, hh * 1.0, hl * 0.32], 0.16, '#c9c0b0', { layer: 4 });
    }] }),
      [...Q.paw(4), A.par(po('neck', [25, 0, 0], 0.3), sayP('HRRMPH!', 1.4)), A.par(A.move('self', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'run' }), A.effect('dust', { dur: 1 })), back('neck')],
      [...Q.ears(4, 30), A.par(A.anim('shake'), sayP('*snort*', 1.2))],
    ),
  ),
  // A roadrunner: streaked brown and white, a shaggy crest, a long tail held up and long legs for running.
  e('roadrunner', 'aviary', 'ground birds', () =>
    act(birdx('roadrunner', { height: 0.36, color: '#7a6a52', wing: '#5a4a3a', beak: '#3a3430', legs: '#6a7a8a', tail: ['#4a3e30', '#5a4a3a', '#4a3e30'] }, (p, g, H) => {
      bTail(g, H, 2.0, 3);
      g('tail').rot = [-60, 0, 0];
      bLegs(g, H, 1.35);
      const b = g('beak');
      b.size = [b.size[0], b.size[1] * 1.7, b.size[2]];
      b.off = [0, H * 0.1, 0];
      for (const z of [0, -0.05]) coneP(p, 'head', [0, H * 0.2, H * z], [0, H * 0.33, H * (z - 0.1)], H * 0.07, '#4a3e30');
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.02, H * 0.05, H * 0.08], [s * H * 0.11, H * 0.13, -H * 0.02], '#4a8ad0', { noInk: true, layer: 5 });
      bBelly(p, H, '#e8dcc4');
      for (const w of ['wingL', 'wingR']) for (const z of [0.05, -0.03, -0.11]) add(p, w, 'ball', [H * 0.08, H * 0.03, H * 0.03], [0, H * (z * 0.5), H * z], '#efe6d2', { noInk: true, layer: 4 });
    }),
      [A.par(po('body', [20, 0, 0], 0.2), sayP('Coo... coo... coo...', 1.8)), A.move('self', { rel: 'front', of: 'self', dist: 'near' }, { speed: 'run' }), back('body'), ...B.flick(4)],
      [A.par(sayP('Clack-clack-clack!', 1.6)), ...osc([['head', [-15, 0, 0], [5, 0, 0]]], 6, 0.1)],
    ),
  ),
  e('robin (bird)', 'aviary', 'garden birds', () =>
    act(birdx('robin (bird)', { height: 0.2, color: '#5a5048', wing: '#4a4038', beak: '#e8b020', legs: '#8a6a50', tail: ['#3a3430', '#3a3430'] }, (p, g, H) => {
      g('head').color = col('#2e2a28');
      g('tail').rot = [-75, 0, 0];
      bBelly(p, H, '#e2622a', 1.12);
      for (const s of [1, -1]) add(p, 'head', 'torus', [H * 0.06, H * 0.065, H * 0.02], [s * H * 0.1, H * 0.16, H * 0.06], '#f6f4ee', { srot: [0, 90, 0], tube: 0.3, noInk: true, layer: 5 });
    }),
      [treat('worm', 'worm', 'touch'), ...B.peck(2), A.remove('worm', 'pop'), ...B.sing('Cheerily, cheer-up!', 1.6)],
      [A.par(A.anim('hop', 3), sayP('Tut-tut!', 1.2))],
    ),
  ),
  e('rodent', 'wild', 'rodents', () =>
    act(beast('rodent', { color: '#8a6a4a', belly: '#e2d2b8', bodyShape: 'ball', body: [0.16, 0.1, 0.1], legL: 0.015, legW: 0.02, neckL: 0.01, neckLean: 40, neckW: 0.05, head: [0.07, 0.06, 0.065], snout: { len: 0.03, h: 0.032, w: 0.036, color: '#b89a7a' }, nose: '#e08a8a', ears: 'pointy', earSize: 0.03, tail: 'stub', acc: [roundEars(0.03, undefined, '#e8b0a8'), buckTeeth('#fff6dc', { len: 0.03, h: 0.032, w: 0.036 }), jaw({ len: 0.03, h: 0.032, w: 0.036 }, '#b89a7a'), ropeTail('#d8a8a0', 0.008, [[0, -0.02, -0.07], [0.02, -0.055, -0.12], [0.06, -0.06, -0.16]])] }),
      [treat('walnut', 'nut', 'touch'), A.par(po('neck', [25, 0, 0], 0.3), sayP('*gnaw gnaw*', 1.6)), ...osc([['jaw', [22, 0, 0], R0]], 8, 0.08), back('neck'), A.remove('nut', 'pop')],
      [A.par(A.anim('hop', 2), sayP('Squeak!', 1.2))],
    ),
  ),
  e('rottweiler', 'pets', 'dog breeds', () =>
    act(dog('rottweiler', { s: 0.95, fat: 1.2, color: '#1f1c1c', snout: '#9a5a2a', hoof: '#9a5a2a', hoofH: 0.1, earK: 0.7, tail: 'stub', acc: [brows('#9a5a2a', 0.8), chest('#9a5a2a', 0.6, -0.1)] }),
      [A.par(po('neck', [20, 0, 0], 0.4), po('head', [-10, 0, 0], 0.4), po('jaw', [8, 0, 0], 0.4), sayP('Grrrrr...', 1.6)), A.wait(0.8), ...Q.bark('WOOF!', 1), back('neck', 'jaw')],
      [...Q.sit(0.7), A.par(A.anim('wag'), sayP('Woof.', 1)), Q.stand()],
    ),
  ),
  // A sabre-toothed cat (smilodon): heavy, short-tailed, with dagger-long upper canines; its jaw gapes huge.
  e('sabre toothed tiger', 'wild', 'prehistoric', () =>
    act(feline('sabre toothed tiger', { s: 0.95, fat: 1.15, color: '#c49a5e', belly: '#e8d4b0', snout: '#ecdcc0', tail: 'stub', acc: [ani.spots('#9a7040', 6), teeth('#f6f2e4', { len: 0.14 * 0.95, h: 0.16 * 0.95, w: 0.24 * 0.95 }, 1, 3)] }),
      Q.roar('ROAAARR!', 1.6),
      [...Q.paw(3), Q.pounce(1.2)[0], A.wait(0.5), Q.stand(), A.anim('hop')],
    ),
  ),
  // A fire salamander, 20 cm: glossy black with bright yellow blotches, a long tail.
  e('salamander', 'wild', 'amphibians', () =>
    act(scaleFig(beast('salamander', { color: '#1e1e22', body: [0.17, 0.045, 0.05], legL: 0.018, legW: 0.016, neckL: 0.006, neckLean: 80, neckW: 0.035, head: [0.045, 0.03, 0.042], snout: { len: 0.012, h: 0.018, w: 0.034 }, ears: 'side', earSize: 0.002, tail: 'stub', acc: [coneTail(0.16, 0.035, '#1e1e22', 0.02), (p, d) => {
      const [L, H, W] = d.body;
      for (let i = 0; i < 6; i++) add(p, 'body', 'ball', [W * 0.3, H * 0.25, L * 0.12], [(i % 2 ? 1 : -1) * W * 0.22, H * 0.4, L * (0.3 - i * 0.12)], '#f2c21e', { noInk: true, layer: 3 });
      for (const s of [1, -1]) add(p, 'head', 'ball', [0.012, 0.008, 0.014], [s * 0.012, 0.016, 0.0], '#f2c21e', { noInk: true, layer: 3 });
    }] }), 0.6),
      [A.par(sayP('!', 1)), ...osc([['legFL', [-30, 0, 0], [20, 0, 0]], ['legBR', [-30, 0, 0], [20, 0, 0]], ['legFR', [20, 0, 0], [-30, 0, 0]], ['legBL', [20, 0, 0], [-30, 0, 0]], ['body', [0, 8, 0], [0, -8, 0]]], 6, 0.18)],
      [po('head', [0, 35, 0], 0.4), A.wait(0.5), back('head'), A.anim('wobble')],
    ),
  ),
  // An Atlantic salmon, 75 cm (lofted): a streamlined silver body, blue-grey back with small dark spots, a pink
  // flush along the side as it runs upriver, a forked tail and the little adipose fin before it. It leaps.
  e('salmon', 'sea', 'river fish', () =>
    act(FK('salmon', { L: 0.75, c: '#6a7c8a', belly: '#eceee8', fin: '#5a6a76', h: 0.22, w: 0.12, shape: 'torpedo', tail: 'fork', tl: 0.18, dorsal: 0.45, dz: 0.55, dl: 0.1, anal: 0.3, pec: 0.8, eye: 0.9, ez: 0.88 }, fLine('#e0948a', 0.25, 0.8, -0.02, 0.12), fSpots('#2a3440', 22, 0.012, { t0: 0.25, t1: 0.85, lo: 20, hi: 85 }), (f, d) => {
      const [, h, cy] = d.sec(0.22);
      f.ball([d.o.L * 0.008, h * 0.5, d.o.L * 0.04], [0, cy + h * 1.05, d.z(0.22)], { color: '#5a6a76', parent: 'body' });
    }),
      F.leap('Splash!', 2),
      F.swish(8, 30),
    ),
  ),
  // A scallop lying in the sand: a ribbed fan shell that claps open and shut (that is how it swims), with a row of
  // tiny blue eyes along its mantle.
  // A scallop lying in the sand: a ribbed fan shell with two "ears" at the hinge that claps open and shut (that is
  // how it swims), with a row of tiny blue eyes along its mantle.
  e('scallop', 'sea', 'shellfish', () => {
    const t = m('scallop', { view: 'side' });
    const top = '#d9824a', bot = '#f2c49a', R = 0.05, Hd = 0.024;
    t.dome([0.1, 0.018, 0.09], [0, 0.009, 0], { color: bot, rot: [180, 0, 0], name: 'base', edge: 'sharp' })
      .dome([0.1, Hd, 0.09], [0, 0.009, 0], { color: top, name: 'shell', parent: 'base', pivot: [0, 0.011, -0.042], edge: 'sharp' })
      .box([0.05, 0.008, 0.02], [0, 0.011, -0.046], { color: '#e8904e', round: 0.4, parent: 'base' })
      .ball([0.09, 0.006, 0.075], [0, 0.011, 0.004], { color: '#f6e6d0', parent: 'base', noInk: true })
      .each(11, (i) => {
        // ribs fan out from the hinge and follow the curve of the shell
        const b = (-70 + i * 14) * D, sx = Math.sin(b), cz = Math.cos(b), z0 = -0.042;
        const A2 = (sx / R) ** 2 + (cz / 0.045) ** 2, B2 = (2 * z0 * cz) / 0.045 ** 2, C2 = (z0 / 0.045) ** 2 - 1;
        const tm = (-B2 + Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2);
        const pts = [0.08, 0.4, 0.7, 0.96].map((k): Vec3 => {
          const x = sx * tm * k, z = z0 + cz * tm * k, rr = Math.min(1, (x / R) ** 2 + (z / 0.045) ** 2);
          return [x, 0.009 + Hd * Math.sqrt(1 - rr) + 0.0015, z];
        });
        for (let k = 0; k < 3; k++) t.rod(pts[k], pts[k + 1], 0.0055, '#c86a32', { noInk: true, parent: 'shell' });
      })
      .each(7, (i) => {
        const b = (-60 + i * 20) * D;
        t.ball(0.004, [0.046 * Math.sin(b), 0.011, -0.002 + 0.044 * Math.cos(b)], { color: '#2a6ad0', eye: true, parent: 'base' });
      });
    return act(t.done(), [A.par(A.anim('hop', 2), ...oscT([['shell', [-30, 0, 0], [-5, 0, 0]]], 4, 0.15)), sayP('!', 1)], [po('shell', [-25, 0, 0], 0.8), A.wait(1), po('shell', R0, 0.2)]);
  }),
  e('schnauzer', 'pets', 'dog breeds', () =>
    act(dog('schnauzer', { s: 0.72, color: '#7d7d82', snout: '#d0d0d0', snoutShape: 'box', legColor: '#a8a8ac', ears: 'pointy', earK: 0.8, tail: 'stub', tailAngle: 30, acc: [ani.beard('#d8d8d8'), brows('#d8d8d8')] }),
      Q.bark('Ruff! Ruff!', 2),
      [...Q.tilt('?'), A.anim('wag')],
    ),
  ),
  // A desert scorpion: two grasping pincers, eight legs, and a segmented tail curled over its back, ending in a
  // sting. It snaps its pincers and stabs.
  e('scorpion', 'bugs', 'spiders', () =>
    act(scaleFig(bug('scorpion', { length: 0.11, color: '#b07a30', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p) => {
      jchain(p, 'body', 'tail', [[0, 0, -0.055], [0, 0.02, -0.075], [0, 0.045, -0.08], [0, 0.068, -0.068], [0, 0.08, -0.045], [0, 0.078, -0.026]], [0.016, 0.015, 0.014, 0.013, 0.012], '#b07a30');
      add(p, 'tail5', 'ball', [0.017, 0.017, 0.017], [0, -0.004, 0.008], '#9a6a28');
      coneP(p, 'tail5', [0, -0.008, 0.014], [0, -0.023, 0.028], 0.008, '#3a2a1a');
      for (const s of [1, -1]) {
        const arm = s > 0 ? 'clawL' : 'clawR';
        p.add({ name: arm, parent: 'body', at: [s * 0.012, -0.004, 0.016], shape: 'capsule', size: [0.009, 0.034, 0.009], off: [s * 0.011, -0.002, 0.012], srot: aim([s * 0.023, -0.004, 0.024]), color: col('#b07a30'), layer: 2 });
        rodP(p, arm, [s * 0.023, -0.004, 0.024], [s * 0.018, -0.006, 0.046], 0.009, '#b07a30');
        add(p, arm, 'ball', [0.022, 0.015, 0.032], [s * 0.018, -0.006, 0.059], '#a06a28');
        rodP(p, arm, [s * 0.022, -0.006, 0.072], [s * 0.018, -0.006, 0.089], 0.007, '#a06a28');
        add(p, arm, 'capsule', [0.005, 0.014, 0.005], [s * 0.008, -0.008, 0.08], '#a06a28', { name: s > 0 ? 'pinchL' : 'pinchR', srot: [90, 0, 0], off: [0, 0, 0.006] });
      }
    } }), 0.75),
      [A.par(po('clawL', [-15, -10, 0], 0.2), po('clawR', [-15, 10, 0], 0.2), sayP('Snip snip!', 1.4)), ...osc([['pinchL', [0, -30, 0], R0], ['pinchR', [0, 30, 0], R0]], 6, 0.1), back('clawL', 'clawR')],
      [A.par(po('tail1', [-15, 0, 0], 0.4), po('tail3', [-10, 0, 0], 0.4)), A.par(po('tail1', [20, 0, 0], 0.1), po('tail3', [25, 0, 0], 0.1), po('tail4', [20, 0, 0], 0.1), sayP('!', 1)), A.wait(0.3), back('tail1', 'tail3', 'tail4')],
    ),
  ),
  // A sea anemone with a clownfish: a pink column, a crown of waving tentacles that close up when touched, and
  // the little orange-and-white fish living in them.
  e('sea anemone', 'sea', 'reef life', () => {
    const t = m('sea anemone');
    t.cyl([0.1, 0.09, 0.1], [0, 0.045, 0], { color: '#c0406a', taper: 0.85, name: 'column' })
      .cyl([0.11, 0.015, 0.11], [0, 0.092, 0], { color: '#e05a88', name: 'crown', parent: 'column', pivot: [0, 0.09, 0] })
      .ball([0.03, 0.012, 0.03], [0, 0.1, 0], { color: '#7a2040', parent: 'crown' })
      .each(14, (i) => {
        const a = (i / 14) * 2 * Math.PI, r = 0.03 + (i % 2) * 0.014, x = Math.cos(a), z = Math.sin(a), h = 0.15 + (i % 3) * 0.015;
        t.rod([x * r, 0.095, z * r], [x * (r + 0.03), h, z * (r + 0.03)], 0.013, '#f07aa0', { parent: 'crown' }).rod([x * (r + 0.03), h, z * (r + 0.03)], [x * (r + 0.055) - z * 0.012, h + 0.04, z * (r + 0.055) + x * 0.012], 0.011, '#f8b8cc', { parent: 'crown' });
      })
      .ball([0.025, 0.036, 0.06], [0.12, 0.12, 0.06], { color: '#f07a1e', name: 'fish' })
      .each(2, (i) => t.ball([0.027, 0.038, 0.008], [0.12, 0.12, 0.072 - i * 0.025], { color: '#f8f6f0', noInk: true, parent: 'fish' }))
      .cone([0.008, 0.03, 0.034], [0.12, 0.12, 0.02], { color: '#f07a1e', rot: [90, 0, 0], parent: 'fish' })
      .ball(0.008, [0.132, 0.128, 0.078], { color: '#141414', eye: true, parent: 'fish' });
    return act(t.done(),
      [A.par(po('fish', [0, -90, 0], 0.6, { move: [-0.1, 0.02, -0.06] }), ...oscT([['crown', [0, 0, 8], [0, 0, -8]]], 4, 0.25)), po('fish', [0, -180, 0], 0.6, { move: [-0.18, 0, 0.0] }), po('fish', R0, 0.8, { move: R0 })],
      [A.par(po('crown', R0, 0.5, { scale: 0.45 }), sayP('!', 1)), A.wait(1.2), po('crown', R0, 1, { scale: 1 })],
    );
  }),
  // A sea cucumber: a warty brown sausage with a ring of feeding tentacles. Poke it and it squirts and shrinks.
  e('sea cucumber', 'sea', 'reef life', () => {
    const t = m('sea cucumber', { view: 'side' });
    t.capsule([0.09, 0.27, 0.085], [0, 0.045, 0], { color: '#7a3a2a', rot: [90, 0, 0], name: 'body' })
      .each(10, (i) => t.cone([0.018, 0.025, 0.018], [((i % 3) - 1) * 0.022, 0.09 - Math.abs((i % 3) - 1) * 0.008, 0.1 - i * 0.022], { color: '#b8603a', parent: 'body' }))
      .ball([0.05, 0.05, 0.03], [0, 0.05, 0.14], { color: '#5a2a1e', name: 'mouth', parent: 'body', pivot: [0, 0.05, 0.13] })
      .each(6, (i) => {
        const a = (i / 6) * 2 * Math.PI, end: Vec3 = [Math.cos(a) * 0.032, 0.05 + Math.sin(a) * 0.032, 0.185];
        t.rod([0, 0.05, 0.14], end, 0.008, '#f2d080', { parent: 'mouth' }).ball(0.016, end, { color: '#f2d080', parent: 'mouth' });
      });
    return act(t.done(), [A.par(po('mouth', R0, 0.3, { scale: 0.3 }), po('body', R0, 0.3, { scale: 0.85 }), A.effect('water_spray', { dur: 1 }), sayP('Pfft!', 1)), A.wait(0.8), A.par(po('mouth', R0, 1, { scale: 1 }), po('body', R0, 1, { scale: 1 }))], [...osc([['mouth', [0, 20, 0], [0, -20, 0]]], 4, 0.4)]);
  }),
  // A sea snail: a tall spiralled shell on a soft foot, with two feelers. It pulls back inside when touched.
  e('sea snail', 'sea', 'reef life', () => {
    const t = m('sea snail', { view: 'side' });
    const sh = '#e8c89a', bd = '#c8a888';
    t.capsule([0.035, 0.09, 0.022], [0, 0.011, 0.01], { color: bd, rot: [90, 0, 0], name: 'foot', pivot: [0, 0.011, -0.01] })
      .rod([0, 0.025, 0.035], [0, 0.04, 0.06], 0.008, '#b88a6a', { parent: 'foot' })
      .pair((s) => t.rod([s * 0.006, 0.02, 0.045], [s * 0.014, 0.03, 0.065], 0.004, bd, { parent: 'foot' }).ball(0.005, [s * 0.014, 0.031, 0.066], { color: '#1a1414', eye: true, parent: 'foot' }))
      .ball(0.05, [0, 0.03, -0.005], { color: sh, name: 'shell' })
      .each(3, (i) => t.ball(0.039 - i * 0.011, [0, 0.046 + i * 0.016, -0.018 - i * 0.013], { color: i % 2 ? sh : '#c8864a', parent: 'shell' }))
      .each(4, (i) => t.torus([0.05 - i * 0.011, 0.05 - i * 0.011, 0.006], [0, 0.034 + i * 0.016, -0.007 - i * 0.013], { color: '#a8643a', rot: [90 - 40, 0, 0], parent: 'shell', noInk: true }))
      .cone([0.016, 0.03, 0.016], [0, 0.098, -0.06], { color: sh, rot: [-40, 0, 0], parent: 'shell' });
    return act(t.done(), [A.par(po('foot', R0, 0.4, { scale: 0.2, move: [0, 0.01, -0.02] }), sayP('!', 1)), A.wait(1.4), po('foot', R0, 0.8, { scale: 1, move: R0 })], [A.par(po('shell', [0, 0, 10], 0.4)), po('shell', [0, 0, -10], 0.4), back('shell')]);
  }),
  // A banded sea krait: blue-black with white rings and a flat paddle tail. It swims in an S and flicks its tongue.
  e('sea snake', 'sea', 'sea reptiles', () =>
    act(fx(snake('sea snake', { length: 1.7, color: '#1f2a44', bands: '#d8e4ee', girth: 0.055 }), (p) => {
      const t = 1.7 * 0.055;
      add(p, 'seg0', 'ball', [t * 0.3, t * 1.4, t * 2.2], [0, -t * 0.5, -t * 0.6], '#1f2a44', { layer: 1 });
    }),
      [...S.slither(5, 18), ...S.flick(3)],
      [A.par(A.effect('water_spray', { dur: 1 }), sayP('Hsss!', 1.2)), ...S.strike('!')],
    ),
  ),
  // A yellow tube sponge on a rock: hollow tubes that pump sea water out of their tops.
  e('sea sponge', 'sea', 'reef life', () => {
    const t = m('sea sponge');
    t.ball([0.17, 0.05, 0.15], [0, 0.02, 0], { color: '#9a8a7a', name: 'rock' });
    for (const [x, z, h, w] of [[0, 0, 0.19, 0.075], [0.058, 0.03, 0.14, 0.062], [-0.052, 0.028, 0.12, 0.058]] as Array<[number, number, number, number]>) {
      t.cyl([w, h, w], [x, h / 2 + 0.01, z], { color: '#e8c440', taper: 1.12, parent: 'rock' }).cyl([w * 0.72, 0.012, w * 0.72], [x, h + 0.011, z], { color: '#7a5a1a', parent: 'rock' });
      t.each(3, (i) => t.ball(0.011, [x + (i - 1) * w * 0.25, h * (0.35 + i * 0.18), z + w * 0.5], { color: '#b8901e', noInk: true, parent: 'rock' }));
    }
    return act(t.done(), [A.par(A.effect('water_spray', { dur: 1.6 }), A.anim('pulse', 2))], [A.anim('wobble')]);
  }),
  // A green sea turtle, about a metre: a smooth olive shell with plates, long front flippers for flying through
  // the water.
  e('sea turtle', 'sea', 'sea reptiles', () => {
    const t = m('sea turtle', { view: 'side' });
    const sk = '#9aa86a';
    t.ball([0.78, 0.3, 1.0], [0, 0.27, 0], { color: '#6b7a3a', name: 'body' })
      .ball([0.72, 0.12, 0.92], [0, 0.17, 0.02], { color: '#e8dcb0', parent: 'body' })
      .ball([0.22, 0.2, 0.28], [0, 0.3, 0.6], { color: sk, name: 'head', parent: 'body', pivot: [0, 0.28, 0.45] })
      .pair((s) =>
        t.ball(0.05, [s * 0.09, 0.34, 0.68], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.62, 0.05, 0.22], [s * 0.5, 0.17, 0.25], { color: sk, rot: [0, s * 35, -s * 12], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * 0.3, 0.2, 0.3] })
          .ball([0.3, 0.05, 0.15], [s * 0.3, 0.15, -0.42], { color: sk, rot: [0, -s * 30, 0], parent: 'body' }),
      );
    for (const [x, z] of [[0, 0.25], [0, 0], [0, -0.25], [0.2, 0.12], [-0.2, 0.12], [0.2, -0.13], [-0.2, -0.13]]) t.ball([0.2, 0.06, 0.2], surf([0, 0.27, 0], [0.39, 0.15, 0.5], [x * 2.2, 1, z * 1.6], 0.93), { color: '#8a9a4a', noInk: true, parent: 'body' });
    return act(t.done(),
      [A.par(sayP('!', 1)), ...osc([['flipperL', [0, 0, 25], [0, 0, -20]], ['flipperR', [0, 0, -25], [0, 0, 20]]], 6, 0.35), ...F.bubbles()],
      [po('head', [0, 0, 0], 0.1, { move: [0, 0, -0.12] }), A.wait(0.8), A.par(po('head', [-20, 0, 0], 0.4, { move: R0 }), sayP('Hm?', 1)), back('head')],
    );
  }),
  // A purple sea urchin: a round shell covered in long moving spines.
  e('sea urchin', 'sea', 'reef life', () => {
    const t = m('sea urchin');
    t.ball([0.065, 0.055, 0.065], [0, 0.03, 0], { color: '#3a2050', name: 'body' });
    for (let i = 0, n = 34; i < n; i++) {
      const y = 1 - ((i + 0.5) / n) * 1.3, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const d: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
      t.cone([0.008, 0.05, 0.008], [d[0] * 0.052, 0.03 + d[1] * 0.052, d[2] * 0.052], { color: i % 3 ? '#5a3a7a' : '#7a4a9a', rot: aim(d), parent: 'body' });
    }
    return act(t.done(), [...osc([['body', [0, 0, 6], [0, 0, -6]]], 6, 0.2), sayP('!', 1)], [A.par(po('body', [0, 40, 0], 2.5)), po('body', R0, 0.5)]);
  }),
  // A herring gull: white, grey back and wings with black tips, a yellow beak with a red spot. It steals chips.
  e('seagull', 'aviary', 'sea birds', () =>
    act(birdx('seagull', { height: 0.38, color: '#f4f4f2', wing: '#a8b0b8', beak: '#f2c230', legs: '#f0b080', tail: ['#f4f4f2', '#f4f4f2'] }, (p, g, H) => {
      g('tail').rot = [-80, 0, 0];
      for (const w of ['wingL', 'wingR']) {
        const q = g(w);
        q.size = [q.size[0], q.size[1], q.size[2] * 1.3];
        add(p, w, 'ball', [H * 0.07, H * 0.1, H * 0.16], [0, -H * 0.02, -H * 0.22], '#2a2726', { layer: 4 });
      }
      add(p, 'beak', 'ball', [H * 0.03, H * 0.03, H * 0.03], [0, H * 0.08, H * 0.015], '#d6453a', { noInk: true, layer: 4 });
    }),
      [treat('fries', 'chips', 'close'), ...B.peck(1), A.remove('chips', 'pop'), ...B.sing('Kee-ow! Ha-ha-ha!', 1.8)],
      B.spread(80, 1.2, 'Kyow!'),
    ),
  ),
  // A seahorse: a horse-like head on a curved armoured body, a fluttering back fin and a curling tail.
  e('seahorse', 'sea', 'reef life', () => {
    const t = m('seahorse', { view: 'side' });
    const c = '#f0a030', d = '#d07a1e';
    t.ball([0.032, 0.062, 0.046], [0, 0.08, 0.012], { color: c, name: 'body' })
      .ball([0.026, 0.03, 0.034], [0, 0.135, 0.008], { color: c, name: 'head', parent: 'body', pivot: [0, 0.12, 0.006] })
      .rod([0, 0.132, 0.02], [0, 0.126, 0.058], 0.011, c, { parent: 'head' })
      .cone([0.012, 0.016, 0.012], [0, 0.155, 0.0], { color: d, parent: 'head' })
      .rod([0, 0.128, -0.004], [0, 0.104, 0.008], 0.022, c, { parent: 'body' })
      .ball([0.005, 0.024, 0.018], [0, 0.088, -0.014], { color: '#f8d070', name: 'fin', parent: 'body', pivot: [0, 0.088, -0.008] })
      .rod([0, 0.055, 0.004], [0, 0.032, -0.008], 0.022, c, { parent: 'body' })
      .rod([0, 0.032, -0.008], [0, 0.014, 0.0], 0.017, c, { name: 'tail', parent: 'body', pivot: [0, 0.032, -0.008] })
      .rod([0, 0.014, 0.0], [0, 0.01, 0.016], 0.013, c, { name: 'tail2', parent: 'tail', pivot: [0, 0.014, 0.0] })
      .rod([0, 0.01, 0.016], [0, 0.022, 0.024], 0.01, c, { parent: 'tail2' })
      .rod([0, 0.022, 0.024], [0, 0.03, 0.016], 0.008, c, { parent: 'tail2' })
      .pair((s) => t.ball(0.008, [s * 0.012, 0.139, 0.016], { color: '#141414', eye: true, parent: 'head' }))
      .each(4, (i) => t.ball([0.034, 0.003, 0.042], [0, 0.06 + i * 0.013, 0.014], { color: d, noInk: true, parent: 'body' }));
    return act(t.done(),
      [A.par(A.anim('bounce', 2), ...oscT([['fin', [0, 40, 0], [0, -40, 0]]], 8, 0.08))],
      [A.par(po('tail', [30, 0, 0], 0.5), po('tail2', [40, 0, 0], 0.5), po('head', [-10, 0, 0], 0.5), sayP('!', 1)), A.wait(0.8), back('tail', 'tail2', 'head')],
    );
  }),
  // A harbour seal, 1.8 m: spotted grey, round head with big dark eyes and whiskers, front flippers. It slaps its
  // belly and barks, and balances a ball on its nose.
  e('seal', 'sea', 'sea mammals', () => {
    const t = m('seal', { view: 'side' });
    const c = '#7a8088';
    t.ball([0.5, 0.42, 1.2], [0, 0.22, -0.05], { color: c, name: 'body' })
      .ball([0.36, 0.26, 0.55], [0, 0.15, -0.62], { color: c, name: 'tail', parent: 'body', pivot: [0, 0.18, -0.4] })
      .ball([0.38, 0.36, 0.4], [0, 0.33, 0.36], { color: c, parent: 'body' })
      .ball([0.32, 0.3, 0.36], [0, 0.46, 0.5], { color: c, name: 'head', parent: 'body', pivot: [0, 0.4, 0.4] })
      .ball([0.18, 0.14, 0.16], [0, 0.43, 0.68], { color: '#9aa0a8', parent: 'head' })
      .ball([0.06, 0.04, 0.03], [0, 0.46, 0.76], { color: '#1e1c1c', parent: 'head' })
      .pair((s) => {
        t.ball([0.13, 0.04, 0.24], [s * 0.1, 0.08, -0.92], { color: c, rot: [0, s * 20, 0], parent: 'tail' })
          .ball([0.07, 0.08, 0.05], [s * 0.11, 0.51, 0.62], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.06, 0.2, 0.13], [s * 0.25, 0.1, 0.3], { color: c, rot: [-20, 0, s * 35], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * 0.2, 0.2, 0.32] });
        for (const a of [-10, 5]) t.rod([s * 0.06, 0.43, 0.74], [s * 0.2, 0.42 + a * 0.004, 0.7], 0.006, '#e8e4dc', { noInk: true, parent: 'head' });
        for (const [y, z] of [[0.5, 0.2], [0.2, -0.1], [0.6, -0.3], [0.1, 0.35], [0.4, -0.5]]) t.ball(0.05, surf([0, 0.22, -0.05], [0.25, 0.21, 0.6], [s, y, z], 0.97), { color: '#4a5058', noInk: true, parent: 'body' });
      })
      .socket('nose', [0, 0.53, 0.72], 'top', { part: 'head', size: 0.3 });
    return act(t.done(),
      [A.par(po('head', [-25, 0, 0], 0.3), sayP('Arf! Arf!', 1.6)), ...osc([['flipperL', [0, 0, -40], [0, 0, 10]], ['flipperR', [0, 0, 40], [0, 0, -10]]], 6, 0.12), back('head')],
      [A.spawn('ball', 'ball', { rel: 'front', of: 'self', dist: 'close' }), A.attach('ball', 'self', 'nose'), A.par(po('head', [-15, 0, 0], 0.3)), ...osc([['head', [-15, 0, 8], [-15, 0, -8]]], 4, 0.25), back('head'), A.remove('ball', 'pop')],
    );
  }),
  // A fluffy white seal pup with huge black eyes. It wriggles and cries for its mother.
  e('seal pup', 'sea', 'sea mammals', () => {
    const t = m('seal pup', { view: 'side' });
    const w = '#f6f4ee';
    t.ball([0.36, 0.32, 0.6], [0, 0.17, -0.02], { color: w, name: 'body' })
      .ball([0.22, 0.16, 0.25], [0, 0.11, -0.33], { color: w, name: 'tail', parent: 'body', pivot: [0, 0.13, -0.22] })
      .ball([0.3, 0.28, 0.28], [0, 0.3, 0.28], { color: w, name: 'head', parent: 'body', pivot: [0, 0.25, 0.18] })
      .ball([0.14, 0.1, 0.1], [0, 0.26, 0.41], { color: '#f2eee6', parent: 'head' })
      .ball([0.045, 0.03, 0.02], [0, 0.285, 0.46], { color: '#1e1c1c', parent: 'head' })
      .pair((s) =>
        t.ball([0.08, 0.03, 0.14], [s * 0.06, 0.05, -0.46], { color: '#e8e4dc', rot: [0, s * 20, 0], parent: 'tail' })
          .ball([0.07, 0.08, 0.04], [s * 0.08, 0.34, 0.39], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.02, 0.02, 0.01], [s * 0.07, 0.355, 0.41], { color: '#ffffff', eye: true, parent: 'head' })
          .ball([0.05, 0.14, 0.1], [s * 0.17, 0.08, 0.12], { color: w, rot: [-20, 0, s * 35], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * 0.14, 0.14, 0.14] }),
      );
    return act(t.done(),
      [A.par(po('head', [-30, 0, 0], 0.4), sayP('Mwaaa!', 1.8)), A.wait(0.8), back('head')],
      [A.par(sayP('!', 1)), ...osc([['tail', [-20, 15, 0], [-20, -15, 0]], ['head', [-10, -10, 0], [-10, 10, 0]]], 6, 0.15)],
    );
  }),
  // A shark, 3 m (lofted, like the great white and the hammerhead): a torpedo body, blue-grey above and white below,
  // a tall swept dorsal fin, long pectoral fins, a tail with a long upper lobe, gill slits and a jaw full of teeth.
  e('shark', 'sea', 'sharks', () =>
    act(FK('shark', { L: 3, c: '#6f8294', belly: '#f2f2ee', h: 0.2, w: 0.18, shape: 'shark', tail: 'shark', tl: 0.27, dorsal: 0.8, dz: 0.56, dl: 0.11, sw: 0.36, anal: 0.25, pec: 1.6, pz: 0.68, eye: 0.35, ez: 0.9, mouth: '#f2f2ee' }, sharkFace()),
      [A.par(po('jaw', [30, 0, 0], 0.5), sayP('CHOMP!', 1.4)), po('jaw', R0, 0.08), A.anim('shake')],
      [A.par(A.anim('wobble'), sayP('!', 0.8)), ...F.swish(8, 28)],
    ),
  ),
  // A border collie: black and white, ears half up, bright eyes. It crouches and herds a lamb.
  e('sheepdog', 'pets', 'dog breeds', () =>
    act(dog('sheepdog', { s: 0.82, color: '#1e1e22', belly: '#f4f2ee', snout: '#f4f2ee', hoof: '#f4f2ee', hoofH: 0.075, ears: 'pointy', earK: 0.8, tail: 'fluffy', tailAngle: 140, acc: [blaze('#f4f2ee'), chest('#f4f2ee', 1.0, 0.0), tailTip('#f4f2ee', 'fluffy')] }),
      [A.spawn('lamb', 'lamb (animal)', { rel: 'front', of: 'self', dist: 'near' }), A.par(po('body', [6, 0, 0], 0.5, { move: [0, -0.12, 0] }), po('neck', [30, 0, 0], 0.5), po('head', [-25, 0, 0], 0.5)), A.wait(0.6), back('body', 'neck', 'head'), A.par(A.move('lamb', { rel: 'away', of: 'self', dist: 'near' }, { speed: 'run', style: 'hop' }), sayP('Woof!', 1.2)), A.par(A.anim('wag'), A.remove('lamb', 'fade'))],
      Q.bark('Woof! Woof!', 2),
    ),
  ),
  // A sheltie: a small collie in sable and white, with a long coat, a white ruff and a long fine muzzle.
  e('shetland sheepdog', 'pets', 'dog breeds', () =>
    act(dog('shetland sheepdog', { s: 0.66, color: '#c07a32', belly: '#f4f2ee', snout: '#f4f2ee', snoutK: 1.25, hoof: '#f4f2ee', hoofH: 0.05, ears: 'pointy', earK: 0.75, tail: 'fluffy', tailAngle: 150, acc: [blaze('#f4f2ee'), coat('#c07a32', 0.7), chest('#f4f2ee', 1.4, 0.2), tailTip('#f4f2ee', 'fluffy')] }),
      [...Q.bark('Arf! Arf! Arf!', 3), A.anim('spin')],
      [A.par(A.anim('wag', 2), sayP('♥', 1.2))],
    ),
  ),
  // A shiba inu: fox-red with cream cheeks and chest, small triangle ears, a tail curled over its back.
  e('shiba inu', 'pets', 'dog breeds', () =>
    act(dog('shiba inu', { s: 0.74, color: '#d9822b', belly: '#f5e6cc', snout: '#f5e6cc', hoof: '#f5e6cc', hoofH: 0.05, ears: 'pointy', earK: 0.85, tail: 'curl', tailAngle: 20, acc: [cheeks('#f5e6cc', 1.1), chest('#f5e6cc', 0.8, 0), (p) => { const q = p.list.find((x) => x.name === 'tail')!; q.size = q.size.map((v) => v * 1.6) as Vec3; q.tube = 0.42; }] }),
      Q.howl('AWOOO-OOO!', 1.8),
      [...Q.sit(0.55), A.par(po('head', [0, -45, 0], 0.5), sayP('...', 1.2)), A.wait(1), Q.stand()],
    ),
  ),
  // A shih tzu: a long flowing coat parted down the back, a golden head with a topknot and bow, a short muzzle.
  e('shih tzu', 'pets', 'dog breeds', () => {
    const s = 0.4, legK = 0.6;
    return act(dog('shih tzu', { s, legK, color: '#f2eee6', headColor: '#d4a05a', earColor: '#c08a48', earK: 1.6, snoutK: 0.4, snout: '#f2eee6', nose: '#141212', tail: 'fluffy', tailAngle: -50, tailColor: '#d4a05a', acc: [skirt('#f2eee6', 0.3 * s * legK + 0.3 * s * 0.42), tuft('#d4a05a', 1.0), bow('#e04a6a'), plume(1.1, '#d4a05a'), (p, d) => void add(p, 'head', 'ball', [d.head[2] * 0.7, d.head[1] * 0.4, d.head[0] * 0.3], [0, -d.head[1] * 0.32, d.head[0] * 0.38], '#f2eee6', { layer: 3 })] }),
      [A.par(A.anim('hop', 2), sayP('Yap!', 1.2))],
      [A.par(A.anim('wag', 2), sayP('♥', 1.2))],
    );
  }),
  // A shrimp, 10 cm of body: curved see-through pink segments, long feelers, little swimming legs. It flicks its
  // tail and shoots backwards.
  e('shrimp', 'sea', 'shellfish', () => {
    const t = m('shrimp', { view: 'side' });
    const c = '#f08a6a', d = '#e06a4a';
    t.ball([0.04, 0.042, 0.065], [0, 0.05, 0.055], { color: c, name: 'body' });
    const seg: Vec3[] = [[0, 0.058, 0.03], [0, 0.06, 0.0], [0, 0.056, -0.028], [0, 0.046, -0.052], [0, 0.032, -0.068]];
    seg.forEach((q, i) => t.ball([0.036 - i * 0.004, 0.036 - i * 0.004, 0.032], q, { color: i % 2 ? d : c, name: `tail${i + 1}`, parent: i ? `tail${i}` : 'body', pivot: [0, q[1] + 0.004, q[2] + 0.014] }));
    t.cone([0.008, 0.04, 0.008], [0, 0.068, 0.1], { color: c, rot: [80, 0, 0], parent: 'body' })
      .pair((s) => {
        t.ball([0.022, 0.006, 0.03], [s * 0.01, 0.018, -0.08], { color: c, rot: [-30, s * 25, 0], parent: 'tail5' })
          .ball(0.01, [s * 0.012, 0.065, 0.085], { color: '#141414', eye: true, parent: 'body' })
          .rod([s * 0.008, 0.058, 0.09], [s * 0.04, 0.09, 0.17], 0.003, d, { parent: 'body' })
          .rod([s * 0.04, 0.09, 0.17], [s * 0.06, 0.08, 0.2], 0.0025, d, { parent: 'body' });
        t.each(4, (i) => t.rod([s * 0.01, 0.035, 0.05 - i * 0.018], [s * 0.022, 0.003, 0.055 - i * 0.02], 0.004, d, { parent: 'body' }));
      });
    return act(scaleFig(t.done(), 0.7), [A.par(po('tail2', [-30, 0, 0], 0.1), po('tail3', [-30, 0, 0], 0.1), po('tail4', [-30, 0, 0], 0.1), A.move('self', { rel: 'behind', of: 'self', dist: 'close' }, { speed: 'run', style: 'slide' })), back('tail2', 'tail3', 'tail4'), sayP('!', 0.8)], [A.anim('hop', 2)]);
  }),
  // A silkworm caterpillar on a mulberry leaf, munching.
  e('silkworm', 'bugs', 'grubs and worms', () => {
    const t = m('silkworm', { view: 'side' });
    t.ball([0.09, 0.006, 0.15], [0, 0.003, 0], { color: '#5aa553', name: 'leaf' })
      .rod([0, 0.004, -0.075], [0, 0.004, 0.07], 0.004, '#4a8a3a', { parent: 'leaf', noInk: true });
    [0.018, 0.022, 0.024, 0.024, 0.024, 0.023, 0.021, 0.018].forEach((T, i) => t.ball([T, T, 0.016], [0, 0.006 + T / 2 + Math.sin(i * 0.8) * 0.002, 0.05 - i * 0.013], { color: '#f2efe2', name: i ? undefined : 'front', parent: 'leaf' }));
    t.ball([0.016, 0.016, 0.014], [0, 0.017, 0.062], { color: '#e8e2d0', name: 'head', parent: 'leaf', pivot: [0, 0.017, 0.055] })
      .pair((s) => t.ball(0.004, [s * 0.005, 0.02, 0.068], { color: '#141414', eye: true, parent: 'head' }).ball([0.004, 0.008, 0.006], [s * 0.011, 0.024, 0.037], { color: '#8a7a6a', noInk: true, parent: 'leaf' }))
      .cone([0.004, 0.01, 0.004], [0, 0.03, -0.044], { color: '#c8a888', rot: [-30, 0, 0], parent: 'leaf' })
      .each(3, (i) => t.pair((s) => t.ball(0.005, [s * 0.008, 0.008, 0.04 - i * 0.012], { color: '#d8d0bc', parent: 'leaf' })));
    return act(t.done(), [A.par(sayP('Munch munch...', 1.8)), ...osc([['head', [30, 0, 0], [5, 0, 0]]], 8, 0.15)], [A.anim('bounce', 3)]);
  }),
  // A silverback gorilla, standing on its knuckles: huge black shoulders, a silver saddle, a crested head. It rises
  // and beats its chest.
  e('silverback gorilla', 'wild', 'jungle', () => {
    const t = m('silverback gorilla');
    const k = '#26262a', f = '#3a3a40';
    t.pair((s) => t.rod([s * 0.22, 0.62, -0.32], [s * 0.3, 0.35, -0.14], 0.22, k).rod([s * 0.3, 0.35, -0.14], [s * 0.26, 0.06, -0.22], 0.18, k).ball([0.18, 0.08, 0.3], [s * 0.26, 0.04, -0.14], { color: f }));
    t.ball([0.78, 0.8, 1.0], [0, 0.88, -0.08], { color: k, rot: [-28, 0, 0], name: 'body', pivot: [0, 0.7, -0.4] })
      .ball([0.62, 0.38, 0.72], [0, 1.12, -0.25], { color: '#a8a8b0', rot: [-28, 0, 0], parent: 'body' })
      .ball([0.66, 0.62, 0.45], [0, 1.0, 0.25], { color: k, parent: 'body' })
      .ball([0.4, 0.36, 0.12], [0, 0.98, 0.44], { color: f, parent: 'body', noInk: true })
      .pair((s) => {
        const arm = s > 0 ? 'armL' : 'armR';
        t.rod([s * 0.38, 1.12, 0.25], [s * 0.5, 0.6, 0.4], 0.25, k, { name: arm, parent: 'body', pivot: [s * 0.38, 1.12, 0.25] })
          .rod([s * 0.5, 0.6, 0.4], [s * 0.46, 0.1, 0.45], 0.21, k, { parent: arm })
          .ball([0.2, 0.16, 0.22], [s * 0.46, 0.08, 0.47], { color: f, parent: arm });
      })
      .ball([0.36, 0.42, 0.36], [0, 1.38, 0.36], { color: k, name: 'head', parent: 'body', pivot: [0, 1.25, 0.3] })
      .ball([0.26, 0.24, 0.3], [0, 1.55, 0.3], { color: k, parent: 'head' })
      .box([0.3, 0.07, 0.1], [0, 1.43, 0.53], { color: f, round: 0.8, parent: 'head' })
      .ball([0.24, 0.18, 0.14], [0, 1.28, 0.53], { color: f, parent: 'head' })
      .pair((s) => t.ball([0.04, 0.03, 0.02], [s * 0.07, 1.38, 0.555], { color: '#120e0c', eye: true, parent: 'head' }).ball([0.04, 0.025, 0.02], [s * 0.04, 1.31, 0.6], { color: '#121212', noInk: true, parent: 'head' }));
    return act(t.done(),
      [A.par(po('body', [-28, 0, 0], 0.5), po('head', [12, 0, 0], 0.5), sayP('HOO-HOO-HOO!', 2.4)), ...osc([['armL', [-95, 0, -35], [-50, 0, 0]], ['armR', [-50, 0, 0], [-95, 0, 35]]], 8, 0.13), back('body', 'head', 'armL', 'armR')],
      [A.par(po('head', [0, 35, 0], 0.6), sayP('Hmph.', 1.2)), A.wait(1), back('head'), A.anim('shake')],
    );
  }),
  // A striped skunk: black with two white stripes down the back. Cross, it stamps its feet, lifts its plume of a
  // tail... and sprays.
  e('skunk', 'wild', 'forest', () =>
    act(beast('skunk', { color: '#1e1e24', bodyShape: 'ball', body: [0.4, 0.2, 0.22], legL: 0.05, legW: 0.05, neckL: 0.03, neckLean: 55, neckW: 0.1, head: [0.13, 0.1, 0.11], snout: { len: 0.05, h: 0.045, w: 0.05 }, nose: '#141414', ears: 'side', earSize: 0.03, tail: 'stub', acc: [roundEars(0.035), (p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.22, H * 0.3, L * 0.85], [s * W * 0.17, H * 0.43, -L * 0.02], '#f6f6f2', { noInk: true, layer: 3 });
      const [hl, hh, hw] = d.head;
      add(p, 'head', 'ball', [hw * 0.22, hh * 0.36, hl * 0.7], [0, hh * 0.52, hl * 0.12], '#f6f6f2', { noInk: true, layer: 3 });
      add(p, 'body', 'ball', [0.16, 0.32, 0.15], [0, H * 0.35, -L * 0.45], '#1e1e24', { name: 'plume', off: [0, 0.12, -0.05], srot: [-25, 0, 0], layer: -1 });
      add(p, 'plume', 'ball', [0.08, 0.3, 0.17], [0, 0.12, -0.06], '#f6f6f2', { srot: [-25, 0, 0], layer: 0, noInk: true });
    }] }),
      [A.par(po('plume', [-25, 0, 0], 0.3)), ...osc([['legFL', [-35, 0, 0], R0], ['legFR', R0, [-35, 0, 0]]], 4, 0.14), A.par(po('body', [28, 0, 0], 0.4, { move: [0, 0.03, 0] }), po('plume', [-45, 0, 0], 0.4)), A.par(A.effect('smoke', { dur: 1.6 }), sayP('Psssssht!', 1.6)), back('body', 'plume')],
      [A.par(po('neck', [25, 0, 0], 0.4), sayP('*sniff*', 1.2)), A.wait(0.6), back('neck')],
    ),
  ),
  // A three-toed sloth hanging from a branch by its long hooked claws: shaggy grey-brown fur tinged green, a pale
  // face with dark eye stripes and a permanent smile. Everything it does, it does very slowly.
  e('sloth', 'wild', 'jungle', () => {
    const t = m('sloth');
    const c = '#9a8670', l = '#b8a68c', cl = '#3a2e24';
    t.cyl([0.18, 1.55, 0.18], [-0.62, 0.775, -0.05], { color: '#6e5038', name: 'tree' })
      .stick([-0.62, 1.38, -0.05], [0.72, 1.42, 0.0], 0.085, '#7a5a3e', { parent: 'tree' })
      .each(3, (i) => t.ball([0.36, 0.22, 0.3], [0.62 - i * 0.12, 1.52 + (i % 2) * 0.06, -0.04 + i * 0.03], { color: i % 2 ? '#4f8a3a' : '#5a9a40', parent: 'tree' }))
      .ball([0.52, 0.26, 0.28], [0.05, 1.08, 0], { color: c, name: 'body' })
      .ball([0.46, 0.18, 0.26], [0.03, 0.99, 0], { color: l, parent: 'body' })
      .ball([0.3, 0.06, 0.18], [0.0, 1.2, 0], { color: '#8a9a6a', parent: 'body', noInk: true });
    t.pair((s) => {
      const z = s * 0.08;
      const front = s > 0 ? 'armL' : 'armR';
      t.rod([0.22, 1.12, z], [0.3, 1.36, z * 0.7], 0.07, c, { name: front, parent: 'body', pivot: [0.22, 1.12, z] })
        .rod([-0.15, 1.12, z], [-0.2, 1.36, z * 0.7], 0.075, c, { parent: 'body' });
      for (const [x, pa] of [[0.3, front], [-0.2, 'body']] as Array<[number, string]>)
        for (let i = 0; i < 3; i++) t.rod([x - 0.02 + i * 0.02, 1.37, z * 0.7], [x - 0.02 + i * 0.02, 1.44, z * 0.7 - 0.05], 0.014, cl, { parent: pa });
    });
    t.ball([0.2, 0.18, 0.18], [0.34, 1.0, 0.04], { color: c, name: 'head', parent: 'body', pivot: [0.26, 1.04, 0.02] })
      .ball([0.15, 0.13, 0.07], [0.34, 0.99, 0.11], { color: '#efe4cf', parent: 'head' })
      .pair((s) => t.ball([0.07, 0.028, 0.02], [0.34 + s * 0.04, 1.0, 0.148], { color: '#4a3a2a', rot: [0, 0, s * 18], noInk: true, parent: 'head' }).ball(0.02, [0.34 + s * 0.04, 1.0, 0.16], { color: '#111111', eye: true, parent: 'head' }))
      .ball([0.035, 0.022, 0.02], [0.34, 0.97, 0.16], { color: '#2a2020', parent: 'head' })
      .box([0.05, 0.006, 0.01], [0.34, 0.945, 0.155], { color: '#5a3a2a', noInk: true, parent: 'head', rot: [0, 0, 0] });
    return act(t.done(),
      [A.par(po('armL', [95, 0, 0], 2.4), po('head', [0, 0, -15], 2.4), sayP('Hiiiii...', 3)), po('armL', [95, 0, 25], 1.2), po('armL', [95, 0, -10], 1.2), back('armL', 'head')],
      [A.par(po('head', [-25, 0, 20], 2.2), sayP('*yaaawn*...', 2.6)), A.wait(1.2), A.par(A.pose('head', { rot: R0, dur: 2 }))],
    );
  }),
  // A garden slug: soft orange-brown, a saddle on its back, two eye stalks that pull in when touched.
  e('slug', 'bugs', 'snails and slugs', () => {
    const t = m('slug', { view: 'side' });
    const c = '#c8752a';
    t.capsule([0.026, 0.1, 0.022], [0, 0.011, 0], { color: c, rot: [90, 0, 0], name: 'body' })
      .ball([0.028, 0.02, 0.04], [0, 0.021, 0.015], { color: '#b0602a', parent: 'body' })
      .ball(0.005, [0.012, 0.024, 0.008], { color: '#5a3a1e', noInk: true, parent: 'body' })
      .pair((s) => t.rod([s * 0.005, 0.02, 0.04], [s * 0.01, 0.042, 0.052], 0.004, c, { name: s > 0 ? 'stalkL' : 'stalkR', parent: 'body', pivot: [s * 0.005, 0.02, 0.04] }).ball(0.006, [s * 0.01, 0.043, 0.053], { color: '#3a2a1e', eye: true, parent: s > 0 ? 'stalkL' : 'stalkR' }).rod([s * 0.005, 0.01, 0.045], [s * 0.008, 0.012, 0.058], 0.003, c, { parent: 'body' }));
    return act(t.done(), [A.par(po('stalkL', R0, 0.3, { scale: 0.25 }), po('stalkR', R0, 0.3, { scale: 0.25 }), sayP('!', 1)), A.wait(1.2), A.par(po('stalkL', R0, 0.8, { scale: 1 }), po('stalkR', R0, 0.8, { scale: 1 }))], [...osc([['stalkL', [-20, 0, 15], [10, 0, -5]], ['stalkR', [10, 0, 5], [-20, 0, -15]]], 4, 0.3)]);
  }),
  // A garden snail with a brown spiral shell; it pulls back into the shell when touched, and peeks out again.
  e('snail', 'bugs', 'snails and slugs', () => {
    const t = m('snail', { view: 'side' });
    const b = '#c9b49a';
    t.capsule([0.03, 0.1, 0.024], [0, 0.012, 0.005], { color: b, rot: [90, 0, 0], name: 'foot', pivot: [0, 0.015, -0.01] })
      .rod([0, 0.015, 0.04], [0, 0.03, 0.055], 0.022, b, { parent: 'foot' })
      .ball([0.032, 0.07, 0.07], [0, 0.055, -0.01], { color: '#a0602a', name: 'shell' })
      .pair((s) =>
        t.torus([0.05, 0.05, 0.012], [s * 0.013, 0.057, -0.008], { color: '#c8864a', rot: [0, 90, 0], parent: 'shell' })
          .torus([0.03, 0.03, 0.01], [s * 0.015, 0.058, -0.006], { color: '#b0703a', rot: [0, 90, 0], parent: 'shell', noInk: true })
          .ball([0.008, 0.016, 0.016], [s * 0.016, 0.058, -0.006], { color: '#7a4a1e', parent: 'shell' })
          .rod([s * 0.005, 0.035, 0.058], [s * 0.01, 0.06, 0.068], 0.004, b, { parent: 'foot' })
          .ball(0.007, [s * 0.01, 0.061, 0.069], { color: '#3a2a1e', eye: true, parent: 'foot' }),
      );
    return act(t.done(), [A.par(po('foot', R0, 0.5, { scale: 0.2, move: [0, 0.03, -0.01] }), sayP('!', 1)), A.wait(1.6), po('foot', R0, 1, { scale: 1, move: R0 })], [A.par(po('shell', [0, 0, 8], 0.5)), po('shell', [0, 0, -8], 0.5), back('shell'), sayP('...', 1)]);
  }),
  // A green snake coiled in an S with its head raised: a flick of the tongue, a hiss, a strike.
  e('snake', 'wild', 'reptiles', () =>
    act(fx(snake('snake', { length: 1.6, color: '#4a9a3a', bands: '#2e6a24', girth: 0.07 }), (p) => {
      for (let i = 0; i < 8; i++) add(p, `seg${i}`, 'ball', [1.6 * 0.07 * 0.7, 1.6 * 0.07 * 0.4, 1.6 * 0.85 / 8], [0, 1.6 * 0.85 / 8 * 0.5, -1.6 * 0.07 * 0.3], '#c8d88a', { noInk: true, layer: -1 });
    }),
      [A.par(sayP('Hssssss!', 1.8)), ...S.flick(4)],
      S.strike('!'),
    ),
  ),
  // A snapping turtle: a rough ridged dark shell, a big head with a hooked beak that snaps, a long spiked tail.
  e('snapping turtle', 'wild', 'reptiles', () =>
    act(turtle('snapping turtle', 1.5, '#4a4a32', '#5a5a3a', '#3e3e28', 1.2, [coneTail(0.25, 0.05, '#5a5a3a', 0.04), jaw({ len: 0.036, h: 0.063, w: 0.081 }, '#4e4e34'), (p, d) => {
      const [L, H, W] = d.body;
      for (const dir of [[0, 1, 0.5], [0, 1, 0], [0, 1, -0.5], [0.6, 0.8, 0.3], [-0.6, 0.8, 0.3], [0.6, 0.8, -0.3], [-0.6, 0.8, -0.3]] as Vec3[]) {
        const b = surf([0, H * 0.25, 0], [W * 0.625, H * 0.55, L * 0.55], dir, 0.98);
        coneP(p, 'body', b, [b[0], b[1] + H * 0.35, b[2] - H * 0.12], H * 0.3, '#3a3a26', { layer: 5 });
      }
      const [hl, hh] = d.head;
      coneP(p, 'head', [0, hh * 0.05, hl * 0.6], [0, -hh * 0.35, hl * 0.78], hh * 0.35, '#3a3a26', { layer: 4 });
    }]),
      [A.par(po('neck', [-30, 0, 0], 0.15), po('jaw', [40, 0, 0], 0.15)), A.par(po('jaw', R0, 0.06), sayP('SNAP!', 1.2)), A.wait(0.4), back('neck')],
      [A.par(po('neck', [40, 0, 0], 0.6), sayP('...', 1)), A.wait(1), back('neck')],
    ),
  ),
  // A snow leopard: smoky white-grey with black rosettes and an enormous thick tail. It chuffs, and pounces in snow.
  e('snow leopard', 'wild', 'mountains', () =>
    act(feline('snow leopard', { s: 0.62, color: '#d6d3cb', belly: '#f0eee8', snout: '#f0eee8', eyes: '#a8c8c0', tail: 'fluffy', tailAngle: 128, acc: [ani.spots('#4a4a4a', 12), (p, d) => {
      const [L, , W] = d.body;
      const q = p.list.find((x) => x.name === 'tail')!;
      q.size = [W * 0.42, L * 0.78, W * 0.42];
      q.off = [0, L * 0.36, 0];
      for (let i = 0; i < 5; i++) add(p, 'tail', 'torus', [W * 0.44, W * 0.44, L * 0.05], [0, L * (0.12 + i * 0.13), 0], '#4a4a4a', { srot: [90, 0, 0], tube: 0.4, noInk: true, layer: 0 });
      const [hl, hh, hw] = d.head;
      for (const [x, y] of [[0.15, 0.4], [-0.15, 0.4], [0, 0.48], [0.3, 0.25], [-0.3, 0.25]]) add(p, 'head', 'ball', [hw * 0.08, hh * 0.08, hl * 0.06], [x * hw, y * hh, hl * 0.35], '#4a4a4a', { noInk: true, layer: 4 });
    }] }),
      [A.par(sayP('Chuff! Chuff!', 1.6)), ...osc([['head', [12, 0, 0], [-8, 0, 0]], ['jaw', [10, 0, 0], R0]], 4, 0.18), ...Q.swish(4, -20, 30)],
      [...Q.pounce(0.75), A.effect('snow', { dur: 1.2 })],
    ),
  ),
  // A house sparrow: brown streaked back, grey cap and chest, a black bib. It hops and cheeps, and pecks seed.
  e('sparrow', 'aviary', 'garden birds', () =>
    act(birdx('sparrow', { height: 0.15, color: '#a07a52', wing: '#7a5a3a', beak: '#4a3a2a', legs: '#c8a080', tail: ['#6a4a2e', '#6a4a2e'] }, (p, g, H) => {
      g('tail').rot = [-70, 0, 0];
      bBelly(p, H, '#cfc6b6');
      add(p, 'head', 'ball', [H * 0.2, H * 0.12, H * 0.2], [0, H * 0.2, -H * 0.01], '#8a8a8a', { noInk: true, layer: 3 });
      add(p, 'head', 'ball', [H * 0.12, H * 0.1, H * 0.06], [0, H * 0.03, H * 0.1], '#2a2522', { noInk: true, layer: 3 });
      g('beak').size = [H * 0.09, H * 0.09, H * 0.08];
      for (const w of ['wingL', 'wingR']) for (const z of [0.04, -0.04]) add(p, w, 'ball', [H * 0.09, H * 0.025, H * 0.14], [0, H * (0.02 - z), H * z], '#4a3420', { noInk: true, layer: 4 });
    }),
      [A.par(A.anim('hop', 3), sayP('Cheep! Cheep!', 1.6), ...oscT([['tail', [-25, 0, 0], R0]], 4, 0.15))],
      [treat('seed', 'seed', 'touch'), ...B.peck(3), A.remove('seed', 'pop')],
    ),
  ),
  // A sperm whale: a huge square head, wrinkled grey skin, a narrow lower jaw. It clicks and dives tail-up.
  e('sperm whale', 'sea', 'whales', () =>
    act(whale('sperm whale', { L: 16, hk: 0.24, color: '#5f6670', belly: '#8a909a', head: 'box', dorsal: 'hump' }, (t, { L, H, y }) => {
      t.each(3, (i) => t.ball([H * 0.12, H * 0.08, L * 0.04], [0, y + H * 0.4 - i * H * 0.04, -L * (0.28 + i * 0.06)], { color: '#5f6670', parent: 'body' }));
      t.pair((s) => t.each(3, (i) => t.capsule([0.05, 1.4, 0.05], [s * H * 0.44, y + H * (0.1 - i * 0.12), L * (0.02 - i * 0.06)], { color: '#4a5058', rot: [80, 0, 0], noInk: true, parent: 'body' })));
    }),
      [A.par(po('body', [28, 0, 0], 0.9), po('tail', [30, 0, 0], 0.9), sayP('Click... click... click...', 2.6)), A.wait(1.2), back('body', 'tail')],
      [A.par(po('jaw', [-20, 0, 0], 0.5)), ...W.blow('Pfffooosh!'), back('jaw')],
    ),
  ),
  // A garden spider: a round striped abdomen and eight long jointed legs bent at the knee. It spins a web.
  // Real size: a real 4 cm garden spider (the vocabulary's 0.1 m is too big).
  e('spider', 'bugs', 'spiders', () =>
    act(bug('spider', { length: 0.04, color: '#5a3a24', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      const b = p.list.find((x) => x.name === 'body')!;
      b.at = [0, L * 0.38, 0];
      spiderLegs(p, L, L * 0.38, L * 0.04, ['#5a3a24', '#3a2416'], 1.3);
      for (const s of [1, -1]) rodP(p, 'body', [s * L * 0.05, -L * 0.04, L * 0.15], [s * L * 0.07, -L * 0.1, L * 0.24], L * 0.035, '#3a2416');
      add(p, 'abdomen', 'ball', [L * 0.14, L * 0.2, L * 0.36], [0, L * 0.12, -L * 0.18], '#e8d0a0', { noInk: true, layer: 3 });
      for (let i = 0; i < 3; i++) add(p, 'abdomen', 'ball', [L * 0.24, L * 0.04, L * 0.04], [0, L * 0.13, -L * (0.06 + i * 0.1)], '#f2ead8', { noInk: true, layer: 4 });
    } }),
      [A.spawn('web', 'cobweb', { rel: 'behind', of: 'self', dist: 'touch' }), A.par(...oscT([['leg0L1', [0, 25, 0], [0, -25, 0]], ['leg0R1', [0, -25, 0], [0, 25, 0]]], 4, 0.15)), A.wait(1.4), A.remove('web', 'fade')],
      [...G.scuttle(6, '1'), A.anim('hop')],
    ),
  ),
  // A squid: a long pink torpedo of a mantle with fins, big eyes, eight arms and two long tentacles that shoot out.
  e('squid', 'sea', 'octopus and squid', () => {
    const t = m('squid');
    const c = '#e8a8a0', d = '#d07a72';
    t.capsule([0.075, 0.24, 0.075], [0, 0.25, 0], { color: c, name: 'mantle' })
      .cone([0.07, 0.07, 0.07], [0, 0.39, 0], { color: c, parent: 'mantle' })
      .pair((s) => t.ball([0.07, 0.08, 0.015], [s * 0.045, 0.34, 0], { color: d, rot: [0, 0, s * 30], parent: 'mantle' }).ball([0.032, 0.032, 0.02], [s * 0.032, 0.125, 0.012], { color: '#1a1414', eye: true, parent: 'mantle' }))
      .ball([0.065, 0.055, 0.065], [0, 0.12, 0], { color: c, parent: 'mantle' })
      .each(5, (i) => t.ball(0.012, [((i % 3) - 1) * 0.02, 0.2 + i * 0.03, 0.036], { color: d, noInk: true, parent: 'mantle' }))
      .each(8, (i) => {
        const a = (i / 8) * 2 * Math.PI + 0.3, x = Math.cos(a), z = Math.sin(a);
        t.rod([x * 0.015, 0.1, z * 0.015], [x * 0.07, 0.015, z * 0.07], 0.012, c, { parent: 'mantle' }).rod([x * 0.07, 0.015, z * 0.07], [x * 0.1, 0.008, z * 0.1 + 0.01], 0.009, d, { parent: 'mantle' });
      })
      .pair((s) => t.rod([s * 0.01, 0.1, 0.02], [s * 0.045, 0.008, 0.16], 0.007, c, { name: s > 0 ? 'tentL' : 'tentR', parent: 'mantle', pivot: [s * 0.01, 0.1, 0.02] }).ball([0.02, 0.012, 0.03], [s * 0.046, 0.008, 0.17], { color: d, parent: s > 0 ? 'tentL' : 'tentR' }));
    return act(t.done(),
      [A.par(A.effect('smoke', { dur: 1.4 }), A.anim('hop'), sayP('Pfft!', 1))],
      [A.par(po('tentL', [-35, 0, 0], 0.12), po('tentR', [-35, 0, 0], 0.12)), A.wait(0.4), back('tentL', 'tentR')],
    );
  }),
  // A red squirrel: russet with a cream belly, tufted ears and a huge bushy tail curled up its back. It sits up to
  // nibble an acorn and flicks its tail.
  e('squirrel', 'wild', 'forest', () =>
    act(beast('squirrel', { color: '#b8642e', belly: '#f2e2c8', body: [0.2, 0.11, 0.1], legL: 0.035, legW: 0.03, neckL: 0.03, neckLean: 30, neckW: 0.06, head: [0.075, 0.07, 0.065], snout: { len: 0.025, h: 0.035, w: 0.04 }, nose: '#3a2a20', ears: 'pointy', earSize: 0.04, tail: 'stub', acc: [jaw({ len: 0.025, h: 0.035, w: 0.04 }, '#b8642e'), (p) => {
      add(p, 'body', 'ball', [0.08, 0.13, 0.08], [0, 0.0, -0.09], '#b8642e', { name: 'brush', off: [0, 0.03, -0.03], srot: [-30, 0, 0], layer: -1 });
      add(p, 'brush', 'ball', [0.09, 0.14, 0.085], [0, 0.12, -0.05], '#c06e36', { layer: -1 });
      add(p, 'brush', 'ball', [0.085, 0.11, 0.09], [0, 0.19, -0.01], '#c8783e', { srot: [40, 0, 0], layer: -1 });
      for (const n of ['earL', 'earR']) add(p, n, 'capsule', [0.008, 0.02, 0.008], [0, 0.04, 0], '#8a4a20');
    }] }),
      [treat('acorn', 'nut', 'touch'), ...Q.sit(0.2), A.par(po('legFL', [-80, 0, -15], 0.3), po('legFR', [-80, 0, 15], 0.3), sayP('Chuk-chuk!', 1.4)), ...osc([['jaw', [20, 0, 0], R0]], 6, 0.1), A.remove('nut', 'pop'), Q.stand()],
      [A.par(sayP('Chrrrr!', 1.2)), ...osc([['brush', [-20, 0, 0], [15, 0, 0]]], 6, 0.12), A.anim('hop')],
    ),
  ),
  // A St Bernard: a huge red-and-white mountain rescue dog with a little barrel at its collar.
  e('st bernard', 'pets', 'dog breeds', () =>
    act(dog('st bernard', { s: 1.2, fat: 1.3, headK: 1.2, color: '#f4efe6', headColor: '#9a4a1e', snout: '#f4efe6', earColor: '#9a4a1e', snoutK: 0.8, tailAngle: 145, acc: [saddle('#9a4a1e', 0.25, 1.1), blaze('#f4efe6'), dogCollar(1.2, '#c0392b', undefined, 1.3), (p, d) => {
      const [L, H] = d.body;
      add(p, 'body', 'cyl', [0.12, 0.17, 0.12], [0, -H * 0.05, L * 0.55], '#8a5a2a', { srot: [0, 0, 90], layer: 4 });
      for (const x of [-0.055, 0.055]) add(p, 'body', 'torus', [0.13, 0.13, 0.012], [x, -H * 0.05, L * 0.55], '#55595e', { srot: [0, 90, 0], tube: 0.2, layer: 5 });
    }] }),
      [...Q.bark('WOOF!', 1, 0.8), A.par(A.effect('snow', { dur: 1.4 }), A.anim('wag'))],
      [...Q.sit(0.95), A.par(po('head', [0, 0, 15], 0.4), sayP('Woof.', 1)), A.wait(1), Q.stand()],
    ),
  ),
  // A red deer stag: russet coat, a pale rump, a shaggy neck in autumn and a great branching rack of antlers. It
  // roars, and thrashes its antlers.
  e('stag', 'wild', 'forest', () =>
    act(beast('stag', { color: '#9a5a32', belly: '#e8d8c0', body: [1.25, 0.55, 0.45], legL: 0.6, legW: 0.08, hoof: '#2a2018', hoofH: 0.07, neckL: 0.42, neckLean: 28, neckW: 0.2, head: [0.38, 0.19, 0.17], snout: { len: 0.14, h: 0.12, w: 0.11, color: '#7a4628' }, nose: '#2a2018', ears: 'long', earSize: 0.15, tail: 'stub', tailColor: '#f2ece2', acc: [antlers('#c8a878', 0.85, 0.9), chest('#7a4628', 0.9, 0.15), jaw({ len: 0.14, h: 0.12, w: 0.11 }, '#7a4628'), (p) => void add(p, 'neck', 'ball', [0.26, 0.4, 0.26], [0, 0.18, -0.02], '#7a4628')] }),
      Q.howl('BRRROOOAAHH!', 2),
      [...Q.paw(3), A.par(po('neck', [30, 0, 0], 0.3), sayP('Hrmph!', 1.2)), ...osc([['head', [20, 0, 25], [20, 0, -25]]], 4, 0.18), back('neck', 'head')],
    ),
  ),
  // Real size: it lies flat, so it is only 2 cm tall (the vocabulary's 0.15 m is its width).
  e('starfish', 'sea', 'reef life', () => {
    const t = m('starfish');
    t.dome([0.05, 0.022, 0.05], [0, 0.0, 0], { color: '#e8742a', name: 'body' });
    t.each(5, (i) => {
      const a = (i * 72) * D, dx = Math.sin(a), dz = Math.cos(a), arm = `arm${i}`;
      t.stick([dx * 0.012, 0.009, dz * 0.012], [dx * 0.085, 0.006, dz * 0.085], 0.032, '#e8742a', { taper: 0.35, name: arm, parent: 'body', pivot: [dx * 0.012, 0.009, dz * 0.012] })
        .ball([0.013, 0.01, 0.013], [dx * 0.085, 0.006, dz * 0.085], { color: '#e8742a', parent: arm });
      t.each(3, (j) => t.ball(0.0075, [dx * (0.025 + j * 0.017), 0.016 - j * 0.0012, dz * (0.025 + j * 0.017)], { color: '#f8b06a', noInk: true, parent: arm }));
    });
    const curl = (k: number) => Array.from({ length: 5 }, (_, i) => po(`arm${i}`, [-k * Math.cos(i * 72 * D), 0, k * Math.sin(i * 72 * D)], 1));
    return act(t.done(), [A.par(...curl(25), sayP('!', 1)), A.wait(0.6), A.par(...curl(0))], [A.par(po('body', [0, 72, 0], 2.5))]);
  }),
  // A grey riding horse, 1.7 m at the withers (lofted), saddled and bridled: a red saddle cloth, a leather saddle
  // with stirrups on their straps, a noseband and browband. A rider sits in the saddle.
  e('steed', 'farm', 'horses', () =>
    act(QK('steed', { ...QHORSE, c: '#ebe7df', H: 1.68, L: 1.78, D: 0.78, W: 0.62, belly: '#dedad2', neck: { l: 0.78, w: 0.35, lean: 34, base: 0.64 }, leg: { ...QHORSE.leg, w: 0.105, low: '#d8d2c8', hoof: '#4a4038' }, tail: { ...QHORSE.tail, c: '#d8d2c6', l: 0.95 } }, maneQ('#cfc8bc'), limbsQ(), (f, d) => {
      const { W, L } = d.q, [w1, h1, cy1] = d.sec(0.6), top = cy1 + h1 * 1.24, z = d.z(0.6);
      f.dome([w1 * 2.36, h1 * 1.58, L * 0.32], [0, cy1 + h1 * 0.5, z], { color: '#b8282e', parent: 'body', edge: 'sharp', round: 0.6 })
        .ball([W * 0.62, 0.16, L * 0.24], [0, top + 0.05, z], { color: '#6b3a1f', parent: 'body' })
        .ball([W * 0.4, 0.17, 0.09], [0, top + 0.11, z + L * 0.1], { color: '#6b3a1f', parent: 'body' })
        .ball([W * 0.46, 0.13, 0.09], [0, top + 0.09, z - L * 0.11], { color: '#6b3a1f', parent: 'body' })
        .pair((s) => f.stick([s * w1 * 1.1, top - 0.04, z], [s * w1 * 1.14, cy1 - h1 * 0.55, z], 0.025, '#4a2814', { parent: 'body' })
          .torus([0.11, 0.09, 0.025], [s * w1 * 1.14, cy1 - h1 * 0.62, z], { color: '#d8b040', rot: [0, 90, 0], parent: 'body', edge: 'sharp' }))
        .socket('saddle', [0, top + 0.12, z], 'seat', { part: 'body' });
      const { l, w, h } = d.q.head, m = d.q.muz;
      f.torus([m.w * 1.12, m.h * 1.08, 0.03], [d.mz[0], d.mz[1], d.mz[2] - m.l * 0.1], { color: '#4a2814', tube: 0.12, parent: 'head' })
        .torus([w * 1.06, h * 0.95, 0.03], [d.sk[0], d.sk[1], d.sk[2] + l * 0.05], { color: '#4a2814', tube: 0.1, parent: 'head' });
    }),
      Q.rear('NEIGH-H-H!', 1.9),
      [...Q.paw(4), A.par(A.anim('hop', 2), sayP('*snort*', 1.2))],
    ),
  ),
  // A stegosaurus: a small head low on a long neck, a high arched back with two rows of tall plates, and a spiked
  // tail (the thagomizer) that it swings.
  e('stegosaurus', 'wild', 'prehistoric', () =>
    act(beast('stegosaurus', { color: '#6f8f4a', belly: '#c8c890', body: [3.4, 1.6, 1.3], legL: 0.9, legW: 0.4, hoof: '#4a5a30', hoofH: 0.15, neckL: 0.7, neckLean: 105, neckW: 0.42, head: [0.55, 0.32, 0.3], snout: { len: 0.2, h: 0.18, w: 0.2 }, nose: '#2a3a1e', ears: 'side', earSize: 0.01, tail: 'stub', acc: [jaw({ len: 0.2, h: 0.18, w: 0.2 }), (p, d) => {
      const [L, H] = d.body;
      for (let i = 0; i < 9; i++) {
        const z = L * (0.28 - i * 0.082), h = 0.55 + 0.75 * Math.sin((Math.PI * (i + 0.5)) / 9);
        const top = (H / 2) * Math.sqrt(Math.max(0, 1 - (z / (L / 2)) ** 2));
        add(p, 'body', 'cyl', [0.1, h, h * 0.8], [i % 2 ? 0.1 : -0.1, top + h * 0.36, z], '#c8642a', { taper: 0, segs: 4, srot: [0, 90, 0], layer: -1 });
      }
      jchain(p, 'body', 'tail', [[0, H * 0.05, -L * 0.42], [0, H * 0.18, -L * 0.62], [0, H * 0.12, -L * 0.82], [0, -H * 0.02, -L * 0.98]], [0.75, 0.5, 0.3], '#6f8f4a', { layer: -1 });
      for (const zz of [0.9, 0.97]) for (const s of [1, -1]) coneP(p, 'tail3', [s * 0.08, H * 0.12 - H * 0.12 + (zz - 0.82) * 0, -L * (zz - 0.82)], [s * 0.55, H * 0.33, -L * (zz - 0.82 + 0.06)], 0.14, '#efe6cf', { layer: -1 });
    }] }),
      [A.par(sayP('Hrrrumph!', 1.6)), ...osc([['tail1', [0, 25, 0], [0, -25, 0]], ['tail2', [0, 20, 0], [0, -20, 0]]], 4, 0.3)],
      Q.graze('Munch...'),
    ),
  ),
  // A stingray lying almost flat on the sea bed: a brown diamond disc with a pale underside, a whip tail with its
  // barb. It ripples off the sand, and buries itself again.
  e('stingray', 'sea', 'rays', () =>
    act(turned('stingray', 'front', [0, 0.1, 0], [12, 0, 0], (s, r) => {
      const c = '#7a6a5a';
      s('ball', [0.42, 0.2, 0.55], [0, 0.03, 0.05], c);
      s('ball', [0.92, 0.08, 0.88], [0, -0.04, 0], '#eeeae2', { noInk: true });
      for (const k of [1, -1]) {
        const w = k > 0 ? 'wingL' : 'wingR';
        s('ball', [0.6, 0.12, 0.9], [k * 0.12, 0, 0], c, { name: w, off: [k * 0.24, 0, -0.02] });
        s('ball', [0.08, 0.06, 0.07], [k * 0.1, 0.12, 0.18], '#2a2420', { role: 'eye', noInk: true });
        for (const [x, z] of [[0.3, 0.1], [0.25, -0.15], [0.12, -0.3], [0.38, -0.05]]) s('ball', [0.05, 0.03, 0.05], [k * (x - 0.12), 0.06, z], '#5a4a3e', { noInk: true, parent: w });
      }
      r([0, 0, -0.45], [0, 0.02, -1.4], 0.045, c);
      s('cyl', [0.03, 0.14, 0.03], [0, 0.035, -0.8], '#d8d0c0', { taper: 0, srot: [-80, 0, 0] });
    }),
      [A.par(A.anim('hop'), A.effect('dust', { dur: 1.2 }), ...oscT([['wingL', [0, 0, 18], [0, 0, -12]], ['wingR', [0, 0, -18], [0, 0, 12]]], 3, 0.3))],
      [A.par(A.effect('dust', { dur: 1.4 }), A.anim('wobble'), sayP('...', 1))],
    ),
  ),
  // A white stork: white with black flight feathers, a long red beak and long red legs. It throws its head back and
  // clatters its beak, and stands on one leg.
  e('stork', 'aviary', 'water birds', () => {
    const t = m('stork', { view: 'side', rig: 'bird' });
    const w = '#f6f4ee', r = '#d8402e';
    t.ball([0.24, 0.26, 0.44], [0, 0.66, -0.02], { color: w, name: 'body' })
      .ball([0.12, 0.08, 0.16], [0, 0.66, -0.3], { color: w, name: 'tail', parent: 'body' })
      .rod([0, 0.72, 0.14], [0, 0.9, 0.2], 0.08, w, { name: 'neck', parent: 'body', pivot: [0, 0.72, 0.14] })
      .ball([0.1, 0.1, 0.13], [0, 0.95, 0.22], { color: w, name: 'head', parent: 'neck', pivot: [0, 0.88, 0.2] })
      .cone([0.04, 0.24, 0.035], [0, 0.93, 0.39], { color: r, rot: [95, 0, 0], parent: 'head' })
      .pair((s) => {
        const wing = s > 0 ? 'wingL' : 'wingR', leg = s > 0 ? 'legL' : 'legR';
        t.ball(0.025, [s * 0.04, 0.97, 0.25], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.06, 0.2, 0.42], [s * 0.12, 0.68, -0.06], { color: w, name: wing, parent: 'body', pivot: [s * 0.1, 0.75, 0.1] })
          .ball([0.065, 0.14, 0.3], [s * 0.125, 0.64, -0.2], { color: '#1e1e22', parent: wing })
          .rod([s * 0.06, 0.58, 0], [s * 0.06, 0.3, 0.02], 0.025, r, { name: leg, parent: 'body', pivot: [s * 0.06, 0.58, 0] })
          .rod([s * 0.06, 0.3, 0.02], [s * 0.06, 0.02, 0.02], 0.022, r, { name: leg + 'Low', parent: leg, pivot: [s * 0.06, 0.3, 0.02] })
          .box([0.04, 0.02, 0.1], [s * 0.06, 0.01, 0.05], { color: r, round: 0.8, parent: leg + 'Low' });
      });
    return act(t.done(),
      [A.par(po('neck', [-60, 0, 0], 0.4), po('head', [-60, 0, 0], 0.4), sayP('Clack-clack-clack-clack!', 2)), ...osc([['head', [-70, 0, 0], [-55, 0, 0]]], 8, 0.08), back('neck', 'head')],
      [A.par(po('legL', [-60, 0, 0], 0.5), po('legLLow', [110, 0, 0], 0.5), po('neck', [20, 0, 0], 0.5)), A.wait(1.8), back('legL', 'legLLow', 'neck')],
    );
  }),
  // An ocean sunfish (mola), 3 m tall fin to fin: a huge flat silver disc of a fish with a tall fin above and below
  // and a scalloped clavus for a tail. It flops on its side to bask, and sculls with its fins.
  e('sunfish', 'sea', 'ocean fish', () => {
    const t = m('sunfish', { view: 'side' });
    const c = '#9aa3ac', l = '#c8ced4';
    t.ball([0.7, 2.4, 2.4], [0, 2.1, 0], { color: c, name: 'body' })
      .ball([0.66, 1.2, 1.9], [0, 1.55, 0.1], { color: l, noInk: true, parent: 'body' })
      .ball([0.14, 1.5, 0.55], [0, 3.6, -0.55], { color: c, rot: [-12, 0, 0], name: 'finTop', parent: 'body', pivot: [0, 3.0, -0.4] })
      .ball([0.14, 1.5, 0.55], [0, 0.76, -0.55], { color: c, rot: [12, 0, 0], name: 'finBottom', parent: 'body', pivot: [0, 1.2, -0.4] })
      .ball([0.3, 1.9, 0.45], [0, 2.1, -1.15], { color: l, parent: 'body' })
      .each(5, (i) => t.ball([0.32, 0.3, 0.2], [0, 1.4 + i * 0.35, -1.3], { color: l, parent: 'body' }))
      .pair((s) => t.ball(0.18, [s * 0.28, 2.45, 0.85], { color: '#141414', eye: true, parent: 'body' }).ball([0.08, 0.35, 0.22], [s * 0.33, 2.15, 0.35], { color: c, rot: [-20, 0, 0], parent: 'body' }))
      .ball([0.2, 0.16, 0.12], [0, 2.0, 1.2], { color: '#7a838c', parent: 'body' });
    return act(t.done(),
      [A.par(po('body', [0, 0, 70], 1.4, { move: [0, -0.9, 0] }), sayP('Ahh, sun.', 1.6)), A.wait(1.4), A.pose('body', { rot: R0, move: R0, dur: 1.2 })],
      [A.par(sayP('!', 1)), ...osc([['finTop', [0, 25, 0], [0, -25, 0]], ['finBottom', [0, -25, 0], [0, 25, 0]]], 6, 0.35)],
    );
  }),
  // A mute swan: all white, a long S-curved neck, an orange beak with a black knob. It arches its wings and hisses,
  // and dips its head under the water.
  e('swan', 'aviary', 'water birds', () => {
    const t = m('swan', { view: 'side', rig: 'bird' });
    const w = '#f8f8f4';
    t.ball([0.42, 0.36, 0.75], [0, 0.42, -0.05], { color: w, name: 'body' })
      .ball([0.2, 0.16, 0.2], [0, 0.55, -0.42], { color: w, name: 'tail', parent: 'body', rot: [30, 0, 0] })
      .rod([0, 0.52, 0.22], [0, 0.72, 0.3], 0.1, w, { name: 'neck', parent: 'body', pivot: [0, 0.52, 0.22] })
      .rod([0, 0.72, 0.3], [0, 0.92, 0.24], 0.09, w, { name: 'neck2', parent: 'neck', pivot: [0, 0.72, 0.3] })
      .rod([0, 0.92, 0.24], [0, 1.06, 0.26], 0.085, w, { parent: 'neck2' })
      .ball([0.11, 0.11, 0.16], [0, 1.1, 0.3], { color: w, name: 'head', parent: 'neck2', pivot: [0, 1.04, 0.26] })
      .cone([0.06, 0.14, 0.05], [0, 1.08, 0.43], { color: '#f0782a', rot: [100, 0, 0], parent: 'head' })
      .ball([0.05, 0.05, 0.05], [0, 1.11, 0.36], { color: '#1e1e22', parent: 'head' })
      .pair((s) => {
        const wing = s > 0 ? 'wingL' : 'wingR', leg = s > 0 ? 'legL' : 'legR';
        t.ball(0.025, [s * 0.045, 1.12, 0.32], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.12, 0.3, 0.6], [s * 0.18, 0.52, -0.1], { color: '#eeeeea', rot: [12, 0, -s * 15], name: wing, parent: 'body', pivot: [s * 0.16, 0.6, 0.15] })
          .rod([s * 0.08, 0.28, 0], [s * 0.09, 0.04, 0.02], 0.04, '#2a2726', { name: leg, parent: 'body', pivot: [s * 0.08, 0.28, 0] })
          .box([0.09, 0.025, 0.12], [s * 0.09, 0.013, 0.07], { color: '#2a2726', round: 0.8, parent: leg });
      });
    return act(t.done(),
      [A.par(po('wingL', [-30, 0, 45], 0.5), po('wingR', [-30, 0, -45], 0.5), po('neck', [-25, 0, 0], 0.5), po('neck2', [30, 0, 0], 0.5), sayP('Hssssss!', 1.8)), A.wait(1.2), back('wingL', 'wingR', 'neck', 'neck2')],
      [A.par(po('neck', [70, 0, 0], 0.6), po('neck2', [50, 0, 0], 0.6)), A.par(A.effect('water_spray', { dur: 1 })), back('neck', 'neck2')],
    );
  }),
  // A swordfish, 3 m: dark blue back, silver belly, a long flat sword of a bill and a tall sickle fin.
  e('swordfish', 'sea', 'ocean fish', () =>
    act(fish('swordfish', { length: 3.0, color: '#2e3e5e', belly: '#c8d0dc', fin: '#2e3e5e', shape: 'shark', extras: (p, { L, H, W }) => {
      coneP(p, 'body', [0, 0, L * 0.35], [0, -H * 0.02, L * 0.76], W * 0.22, '#3a4a6a', { layer: 3 });
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.2, H * 0.9, L * 0.02];
    } }),
      F.leap('Splash!'),
      [A.par(sayP('!', 0.8)), ...osc([['body', [0, 18, 0], [0, -18, 0]]], 6, 0.12)],
    ),
  ),
  // A tabby cat: grey-brown with dark stripes and an M on its forehead, green eyes. It meows, and pounces on a mouse.
  e('tabby', 'pets', 'cats', () =>
    act(feline('tabby', { s: 0.21, hk: 1.35, earK: 1.5, color: '#9a8670', belly: '#f2eee6', snout: '#f2eee6', tailAngle: 50, eyes: '#8ac040', nose: '#e0909a', acc: [ani.stripes('#4e4236', 5), tailRings('#4e4236', 3, 'long'), (p, d) => {
      const [hl, hh, hw] = d.head;
      for (const x of [-0.14, 0, 0.14]) add(p, 'head', 'capsule', [hw * 0.06, hh * 0.28, hl * 0.06], [x * hw, hh * 0.45, hl * 0.28], '#4e4236', { srot: [-30, 0, 0], noInk: true, layer: 4 });
      for (const s of [1, -1]) for (const a of [-8, 4]) rodP(p, 'head', [s * hw * 0.12, -hh * 0.18, hl * 0.6], [s * hw * 0.7, -hh * 0.18 + a * 0.002, hl * 0.55], 0.003, '#f8f6f0', { noInk: true });
    }] }),
      [A.par(po('jaw', [22, 0, 0], 0.25), po('head', [-15, 0, 0], 0.25), sayP('Meow!', 1.4)), back('jaw', 'head'), A.anim('wag')],
      [A.spawn('mouse', 'mouse', { rel: 'front', of: 'self', dist: 'near' }), ...Q.pounce(0.3), A.par(A.remove('mouse', 'fly_away'), sayP('Mrrp?', 1.2))],
    ),
  ),
  // A tadpole at its real 4 cm: a round dark body with eyes and a long wriggling tail.
  // Real size: a real 4 cm tadpole (the vocabulary's 0.1 m is too big).
  e('tadpole', 'wild', 'amphibians', () => {
    const t = m('tadpole', { view: 'side' });
    t.ball([0.032, 0.034, 0.038], [0, 0.018, 0.01], { color: '#3a3a2e', name: 'body' })
      .ball([0.006, 0.022, 0.058], [0, 0.019, -0.032], { color: '#6a6a52', rot: [-6, 0, 0], name: 'tail', parent: 'body', pivot: [0, 0.019, -0.006] })
      .pair((s) => t.ball(0.008, [s * 0.012, 0.024, 0.022], { color: '#d8d0b0', parent: 'body' }).ball(0.0045, [s * 0.0145, 0.025, 0.025], { color: '#141414', eye: true, parent: 'body' }));
    return act(scaleFig(t.done(), 0.45), [A.par(sayP('!', 0.8)), ...osc([['tail', [0, 35, 0], [0, -35, 0]]], 10, 0.08)], [A.par(A.anim('hop'), ...F.bubbles().slice(0, 1)), A.remove('bub', 'fly_away')]);
  }),
  // A tarantula, 13 cm across: hairy brown legs with orange knee bands, a big furry abdomen. It rears up to show
  // its fangs.
  e('tarantula', 'bugs', 'spiders', () =>
    act(bug('tarantula', { length: 0.09, color: '#4a3428', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      const b = p.list.find((x) => x.name === 'body')!;
      b.at = [0, L * 0.32, 0];
      b.size = [L * 0.36, L * 0.22, L * 0.36];
      spiderLegs(p, L, L * 0.32, L * 0.08, ['#3a2a20', '#4a3428'], 1.15);
      for (let i = 0; i < 4; i++) for (const s of ['L', 'R']) add(p, `leg${i}${s}2`, 'ball', [L * 0.1, L * 0.1, L * 0.1], [0, 0, 0], '#d8822a', { layer: 3 });
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.44, L * 0.38, L * 0.52];
      a.color = col('#5a3e2c');
      for (const s of [1, -1]) rodP(p, 'body', [s * L * 0.06, -L * 0.02, L * 0.17], [s * L * 0.08, -L * 0.1, L * 0.27], L * 0.06, '#2a1e18', { name: s > 0 ? 'fangL' : 'fangR' });
    } }),
      [A.par(po('body', [-30, 0, 0], 0.4, { move: [0, 0.01, 0] }), po('leg0L1', [-40, 0, 0], 0.4), po('leg0R1', [-40, 0, 0], 0.4), sayP('!', 1)), A.wait(1), back('body', 'leg0L1', 'leg0R1')],
      [...G.scuttle(6, '1'), A.anim('shake')],
    ),
  ),
  // A Tasmanian devil: black with a white chest stripe, pink ears, and a jaw that gapes enormously. It screeches
  // and spins.
  e('tasmanian devil', 'wild', 'australia', () =>
    act(beast('tasmanian devil', { color: '#1e1c1c', body: [0.5, 0.22, 0.22], legL: 0.06, legW: 0.06, neckL: 0.03, neckLean: 60, neckW: 0.13, head: [0.18, 0.15, 0.17], snout: { len: 0.06, h: 0.08, w: 0.1, color: '#2a2626' }, nose: '#e8909a', ears: 'pointy', earSize: 0.06, tail: 'stub', acc: [roundEars(0.065, '#e88a8a'), chest('#f4f2ee', 0.95, 0.05), jaw({ len: 0.06, h: 0.08, w: 0.1 }, '#2a2626', '#f6f2e8', 1.2)] }),
      [A.par(po('jaw', [45, 0, 0], 0.3), po('head', [-15, 0, 0], 0.3), sayP('SCREEEECH!', 1.8)), A.wait(0.6), back('jaw', 'head')],
      [A.par(A.anim('spin', 3), A.effect('dust', { dur: 2 }), sayP('Grrr-rrr-rrr!', 2))],
    ),
  ),
  // A termite worker at its real 1.3 cm: pale soft body, a brown head with jaws. Alarmed, it drums its head.
  // Real size: a real 1.3 cm termite (the vocabulary's 0.1 m is too big).
  e('termite', 'bugs', 'crawling insects', () =>
    act(scaleFig(bug('termite', { length: 0.06, color: '#efe2c4', wings: 'none', segments: 3, extras: (p, { L }) => {
      const h = p.list.find((x) => x.name === 'head')!;
      h.color = col('#c8782a');
      h.size = [L * 0.24, L * 0.2, L * 0.26];
      for (const s of [1, -1]) rodP(p, 'head', [s * L * 0.04, -L * 0.02, L * 0.17], [s * L * 0.015, -L * 0.03, L * 0.28], L * 0.03, '#5a3a1e');
    } }), 0.22),
      [A.par(sayP('!', 0.8)), ...osc([['head', [25, 0, 0], [-5, 0, 0]]], 10, 0.06)],
      [...G.scuttle(6), A.anim('hop')],
    ),
  ),
  // A Jack Russell terrier: white with tan patches on the head, small folded ears, bright and busy. It digs and yaps.
  e('terrier', 'pets', 'dog breeds', () =>
    act(dog('terrier', { s: 0.58, color: '#f2ede4', headColor: '#b8783a', earColor: '#8a5428', snout: '#f2ede4', earK: 0.7, tailAngle: 25, acc: [blaze('#f2ede4'), ani.spots('#b8783a', 3)] }),
      [...Q.dig(3), ...Q.bark('Yap! Yap!', 2)],
      [A.par(A.anim('hop', 3), sayP('Arf!', 1)), A.anim('wag')],
    ),
  ),
  // A tick, swollen after feeding, about 1 cm: a dark red-brown body on eight short legs. It waves its front legs to
  // catch a passer-by.
  // Real size: a real 1 cm swollen tick (the vocabulary's 0.1 m is too big).
  e('tick', 'bugs', 'spiders', () =>
    act(scaleFig(bug('tick', { length: 0.07, color: '#5a2a20', legs: 8, segments: 2, wings: 'none', antennae: false, extras: (p, { L }) => {
      const a = p.list.find((x) => x.name === 'abdomen')!;
      a.size = [L * 0.55, L * 0.3, L * 0.6];
      a.color = col('#7a3a2a');
      add(p, 'body', 'ball', [L * 0.26, L * 0.08, L * 0.3], [0, L * 0.12, 0], '#2a1a14', { layer: 3 });
      coneP(p, 'body', [0, 0, L * 0.15], [0, -L * 0.02, L * 0.26], L * 0.08, '#3a2018');
    } }), 0.15),
      [A.par(po('leg0L', [-30, -30, 30], 0.3), po('leg0R', [-30, 30, -30], 0.3), sayP('!', 1)), ...osc([['leg0L', [-40, -20, 40], [-20, -40, 20]], ['leg0R', [-20, 40, -20], [-40, 20, -40]]], 6, 0.2), back('leg0L', 'leg0R')],
      [A.par(po('abdomen', R0, 0.6, { scale: 1.3 })), A.wait(0.8), po('abdomen', R0, 0.6, { scale: 1 })],
    ),
  ),
  // A Bengal tiger: orange with black stripes, white cheeks and belly. It roars, and loves a splash in the water.
  e('tiger', 'wild', 'jungle', () =>
    act(feline('tiger', { s: 0.92, color: '#e07a2a', belly: '#f6efe2', snout: '#f6efe2', eyes: '#e0b030', acc: tigerAcc(0.92) }),
      Q.roar('RRROOOAR!'),
      Q.shakeOff('Grr.'),
    ),
  ),
  e('tiger cub', 'wild', 'jungle', () =>
    act(feline('tiger cub', { s: 0.42, hk: 1.7, legK: 0.7, bodyK: 0.8, fat: 1.1, color: '#e8862e', belly: '#f6efe2', snout: '#f6efe2', eyes: '#8ab0d0', acc: tigerAcc(0.42) }),
      [A.par(A.anim('spin'), sayP('Mew!', 1.2)), A.anim('hop')],
      [...Q.pounce(0.53), A.par(po('jaw', [24, 0, 0], 0.2), sayP('Rawr!', 1.2)), back('jaw')],
    ),
  ),
  // A tilapia: a deep-bodied silvery-green river fish with a long spiny back fin and red-edged fins. It blows
  // bubbles, and leaps.
  e('tilapia', 'sea', 'river fish', () =>
    act(fish('tilapia', { length: 0.4, color: '#8a9a8a', belly: '#c8d0c4', fin: '#b86a5a', shape: 'round', extras: (p, { L, H }) => {
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.42, H * 0.32, L * 0.02];
      d.off = [0, H * 0.06, -L * 0.04];
    } }),
      [...F.bubbles(), ...F.swish(4)],
      F.leap('Splash!'),
    ),
  ),
  // A toco toucan: black with a white throat, blue eye ring and an enormous orange beak. It tosses a berry and
  // catches it.
  e('toucan', 'aviary', 'tropical birds', () =>
    act(birdx('toucan', { height: 0.5, color: '#1a1a1e', wing: '#1a1a1e', beak: '#f29a1e', legs: '#6a8ac0', tail: ['#1a1a1e', '#1a1a1e'] }, (p, g, H) => {
      g('tail').rot = [-90, 0, 0];
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
      [A.spawn('berry', 'berry', { rel: 'above', of: 'self', dist: 'close' }), A.par(po('head', [-40, 0, 0], 0.3), sayP('Croak!', 1.2)), A.remove('berry', 'pop'), back('head')],
      [...B.look(90), ...B.flutter(4, 50)],
    ),
  ),
  // A red-eyed tree frog at its real 5 cm: bright green, huge red eyes, blue-striped flanks and orange toes. It
  // puffs out its throat to call, and leaps.
  e('tree frog', 'wild', 'amphibians', () => {
    const t = m('tree frog');
    const g = '#5ac43a';
    t.ball([0.045, 0.035, 0.055], [0, 0.025, -0.006], { color: g, rot: [-25, 0, 0], name: 'body' })
      .ball([0.036, 0.026, 0.03], [0, 0.018, 0.012], { color: '#f2f0e0', noInk: true, parent: 'body' })
      .ball([0.046, 0.028, 0.036], [0, 0.036, 0.02], { color: g, name: 'head', parent: 'body', pivot: [0, 0.032, 0.008] })
      .ball([0.022, 0.016, 0.016], [0, 0.026, 0.03], { color: '#f2f0d0', name: 'sac', parent: 'head', scale: 0.4, noInk: true })
      .pair((s) =>
        t.ball(0.017, [s * 0.017, 0.048, 0.024], { color: '#e02a1e', parent: 'head' })
          .ball([0.006, 0.011, 0.004], [s * 0.02, 0.049, 0.031], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.017, 0.022, 0.036], [s * 0.025, 0.016, -0.014], { color: g, name: s > 0 ? 'legL' : 'legR', parent: 'body', pivot: [s * 0.018, 0.02, -0.004] })
          .ball([0.014, 0.008, 0.03], [s * 0.03, 0.005, 0.0], { color: g, parent: s > 0 ? 'legL' : 'legR' })
          .ball(0.008, [s * 0.034, 0.004, 0.018], { color: '#f08a2a', parent: s > 0 ? 'legL' : 'legR' })
          .rod([s * 0.016, 0.022, 0.022], [s * 0.02, 0.004, 0.032], 0.007, g, { parent: 'body' })
          .ball(0.008, [s * 0.022, 0.004, 0.038], { color: '#f08a2a', parent: 'body' })
          .ball([0.004, 0.012, 0.03], [s * 0.022, 0.026, -0.004], { color: '#3a6ad0', noInk: true, parent: 'body' }),
      );
    return act(t.done(),
      [A.par(po('sac', R0, 0.25, { scale: 1.3 }), sayP('Ribbit!', 1.2)), po('sac', R0, 0.2, { scale: 0.4 }), A.par(po('sac', R0, 0.25, { scale: 1.3 }), sayP('Ribbit!', 1.2)), po('sac', R0, 0.2, { scale: 0.4 })],
      [A.par(po('legL', [40, 0, 0], 0.12), po('legR', [40, 0, 0], 0.12), A.anim('hop', 2)), back('legL', 'legR')],
    );
  }),
  // A triceratops, 3 m tall: a great bony frill edged with knobs, two long brow horns and a nose horn. It paws the
  // ground and charges, and grazes on ferns.
  e('triceratops', 'wild', 'prehistoric', () =>
    act(beast('triceratops', { color: '#9a7a5a', belly: '#c8b090', body: [3.4, 1.6, 1.5], legL: 0.8, legW: 0.45, hoof: '#5a4a38', hoofH: 0.15, neckL: 0.3, neckLean: 85, neckW: 0.7, head: [1.0, 0.65, 0.6], snout: { len: 0.4, h: 0.4, w: 0.35, color: '#8a6a4a', shape: 'box' }, nose: '#3a2e22', ears: 'side', earSize: 0.01, tail: 'stub', acc: [jaw({ len: 0.4, h: 0.4, w: 0.35 }, '#8a6a4a'), (p, d) => {
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
      [...Q.paw(4), A.par(po('neck', [25, 0, 0], 0.3), sayP('HRRRUMPH!', 1.6)), A.par(A.move('self', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'run' }), A.effect('dust', { dur: 1.2 })), back('neck')],
      Q.graze('Crunch crunch.'),
    ),
  ),
  // A tsetse fly at its real 1.2 cm: brown, wings folded flat over its back like closed scissors, a long biting
  // proboscis.
  // Real size: a real 1.2 cm fly (the vocabulary's 0.1 m is too big).
  e('tsetse fly', 'bugs', 'flying insects', () =>
    act(scaleFig(bug('tsetse fly', { length: 0.06, color: '#7a6a52', stripes: '#4a3e30', wings: 'clear', wingColor: '#d8d0b8', extras: (p, { L }) => {
      for (const [n, s] of [['wingL', 1], ['wingR', -1]] as const) {
        const w = p.list.find((x) => x.name === n)!;
        w.size = [L * 0.2, L * 0.02, L * 0.6];
        w.rot = [-5, s * 8, 0];
        w.off = [s * L * 0.02, L * 0.06, -L * 0.3];
      }
      rodP(p, 'head', [0, -L * 0.02, L * 0.12], [0, -L * 0.04, L * 0.3], L * 0.025, '#2a2726');
    } }), 0.2),
      G.buzz('Bzzzz!'),
      [A.par(po('body', [20, 0, 0], 0.3), sayP('!', 0.8)), A.wait(0.8), back('body')],
    ),
  ),
  // A bluefin tuna, 2 m: a torpedo built for speed, dark blue above, silver below, with yellow finlets.
  e('tuna (fish)', 'sea', 'ocean fish', () =>
    act(fish('tuna (fish)', { length: 2.0, color: '#1e2e5a', belly: '#d8dde6', fin: '#2a3a6a', shape: 'shark', extras: (p, { L, H }) => {
      const d = p.list.find((x) => x.name === 'dorsal')!;
      d.size = [L * 0.14, H * 0.4, L * 0.02];
      for (let i = 0; i < 5; i++) {
        const z = -L * (0.18 + i * 0.04), top = 0.5 * H * Math.sqrt(Math.max(0, 1 - (z / (0.39 * L)) ** 2));
        for (const s of [1, -1]) coneP(p, 'body', [0, s * top * 0.85, z], [0, s * (top * 0.85 + H * 0.12), z - L * 0.03], L * 0.025, '#f2c230', { layer: 2 });
      }
      for (const s of [1, -1]) coneP(p, 'body', [0, s * H * 0.38, -L * 0.1], [0, s * H * 0.75, -L * 0.16], L * 0.05, '#f2c230', { layer: 2 });
    } }),
      [A.par(A.move('self', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'run', style: 'slide' }), ...oscT([['tail', [0, 35, 0], [0, -35, 0]]], 8, 0.08))],
      F.leap('Splash!'),
    ),
  ),
  // A wild turkey: bronze-brown feathers, a bare blue-and-red head with a dangling wattle. It fans its striped tail,
  // puffs up and gobbles.
  e('turkey (bird)', 'farm', 'poultry', () =>
    act(birdx('turkey (bird)', { height: 0.9, color: '#4a3424', wing: '#5a4030', beak: '#d8c09a', legs: '#c88a7a', comb: '#d42a2a', tail: ['#4a3424'] }, (p, g, H) => {
      const h = g('head');
      h.color = col('#7a9ac8');
      h.size = [H * 0.18, H * 0.2, H * 0.2];
      const T: Vec3 = [0, 0.45, -0.3];
      const tr = (q: Vec3): Vec3 => [q[0] - T[0], q[1] - T[1], q[2] - T[2]];
      add(p, undefined, 'ball', [1.06, 0.82, 0.03], T, '#e8d8b8', { name: 'fan', off: [0, 0.35, -0.07], layer: -7 });
      add(p, 'fan', 'ball', [0.96, 0.74, 0.04], tr([0, 0.8, -0.355]), '#2a1e16', { layer: -6 });
      add(p, 'fan', 'ball', [0.86, 0.66, 0.05], tr([0, 0.8, -0.34]), '#7a5232', { layer: -5 });
      for (let i = 0; i < 9; i++) {
        const a = (-80 + i * 20) * D;
        add(p, 'fan', 'capsule', [0.012, 0.36, 0.01], tr([Math.sin(a) * 0.24, 0.8 + Math.cos(a) * 0.18, -0.31]), '#4a3020', { srot: [0, 0, -a / D], noInk: true, layer: -4 });
      }
      for (const w of ['wingL', 'wingR']) for (const z of [0.05, -0.05, -0.15]) add(p, w, 'ball', [H * 0.08, H * 0.025, H * 0.04], [0, H * (z * 0.4 - 0.02), H * z], '#efe6d2', { noInk: true, layer: 4 });
      add(p, 'body', 'ball', [H * 0.2, H * 0.1, H * 0.1], [0, H * 0.06, H * 0.22], '#2a2018', { layer: 3 });
      add(p, 'head', 'ball', [H * 0.06, H * 0.14, H * 0.06], [0, -H * 0.04, H * 0.12], '#d42a2a', { layer: 4 });
    }),
      [A.par(po('head', [-20, 0, 0], 0.2), sayP('Gobble-gobble-gobble!', 2)), ...osc([['head', [-25, 0, 10], [-15, 0, -10]], ['fan', [0, 0, 4], [0, 0, -4]]], 6, 0.12), back('head')],
      [A.par(po('fan', [-60, 0, 0], 0.6)), ...B.peck(2), A.par(po('fan', R0, 0.6), sayP('Putt putt.', 1.2))],
    ),
  ),
  // A tortoise: a high domed brown shell with golden plates, scaly legs. It pulls its head in, and plods.
  e('turtle', 'wild', 'reptiles', () =>
    act(turtle('turtle', 1.2, '#8a5a2a', '#8a9a52', '#b8843e'),
      [A.par(po('neck', [60, 0, 0], 0.4, { scale: 0.3 }), sayP('!', 1)), A.wait(1.6), po('neck', R0, 1, { scale: 1 })],
      [A.par(sayP('...', 1.2)), ...osc([['legFL', [-25, 0, 0], [15, 0, 0]], ['legBR', [-25, 0, 0], [15, 0, 0]], ['legFR', [15, 0, 0], [-25, 0, 0]], ['legBL', [15, 0, 0], [-25, 0, 0]]], 4, 0.45)],
    ),
  ),
  // A baby sea turtle the size of a cookie, flippers out, scurrying for the sea.
  e('turtle hatchling', 'wild', 'reptiles', () =>
    act(turtle('turtle hatchling', 0.42, '#4a5a32', '#6a7a4a', '#5e6e3e', 1.6),
      [A.par(A.move('self', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'walk' }), ...oscT([['legFL', [-40, 0, 0], [20, 0, 0]], ['legFR', [20, 0, 0], [-40, 0, 0]]], 3, 0.18))],
      [A.par(A.anim('hop'), sayP('!', 0.8))],
    ),
  ),
  // A pit viper: a heavy body with a dark zigzag, and a broad triangular head. It coils back and strikes.
  e('viper', 'wild', 'reptiles', () =>
    act(fx(snake('viper', { length: 1.0, color: '#7a6a3a', bands: '#3a2e1e', girth: 0.085 }), (p, g) => {
      const h = g('head');
      h.size = [h.size[0] * 1.45, h.size[1], h.size[2] * 1.15];
      for (let i = 0; i < 8; i++) add(p, `seg${i}`, 'ball', [0.04, 0.02, 0.05], [0, 1.0 * 0.85 / 8 * 0.5, 0.035], '#2e2416', { srot: [0, 0, 45], noInk: true, layer: 3 });
    }),
      S.strike('HSSS!'),
      [...S.flick(4), sayP('Hsss...', 1.2)],
    ),
  ),
  // A vulture: dark brown with a pale ruff and a bare pink head, a heavy hooked beak. It spreads its wings to
  // sun them, hissing.
  e('vulture', 'aviary', 'birds of prey', () =>
    act(birdx('vulture', { height: 0.8, color: '#3a2e28', wing: '#2a221e', beak: '#d8c8b0', legs: '#8a8078', tail: ['#2a221e', '#2a221e'] }, (p, g, H) => {
      const h = g('head');
      h.color = col('#e8a090');
      h.size = [H * 0.17, H * 0.18, H * 0.2];
      g('tail').rot = [-90, 0, 0];
      bHook(p, g, H, 0.9, '#d8c8b0');
      add(p, 'body', 'ball', [H * 0.36, H * 0.18, H * 0.26], [0, H * 0.17, H * 0.14], '#efe8dc', { layer: 3 });
    }),
      B.spread(95, 2, 'Hisss!'),
      [...B.look(80), ...B.peck(2)],
    ),
  ),
  // A walrus, 3.4 m: a huge wrinkled cinnamon body, a bristly moustache, and two long ivory tusks. It bellows, and
  // hauls itself up with its tusks.
  e('walrus', 'sea', 'sea mammals', () => {
    const t = m('walrus', { view: 'side' });
    const c = '#a8705a', l = '#c89a80';
    t.ball([1.4, 1.2, 2.6], [0, 0.62, -0.25], { color: c, name: 'body' })
      .ball([0.9, 0.62, 0.9], [0, 0.32, -1.4], { color: c, name: 'tail', parent: 'body', pivot: [0, 0.4, -1.0] })
      .ball([0.85, 0.8, 0.8], [0, 1.1, 1.0], { color: c, name: 'head', parent: 'body', pivot: [0, 0.95, 0.6] })
      .each(5, (i) => t.ball([1.3 - i * 0.05, 0.08, 0.12], [0, 0.95 - i * 0.12, 0.3 - i * 0.3], { color: '#966250', noInk: true, parent: 'body', rot: [0, 0, 0] }))
      .pair((s) =>
        t.ball([0.28, 0.06, 0.45], [s * 0.22, 0.05, -1.85], { color: '#8a5a48', rot: [0, s * 25, 0], parent: 'tail' })
          .ball([0.34, 0.32, 0.32], [s * 0.16, 0.92, 1.36], { color: l, parent: 'head' })
          .cone([0.1, 0.72, 0.1], [s * 0.13, 0.5, 1.42], { color: '#f2ead8', rot: [172, 0, 0], parent: 'head' })
          .ball(0.07, [s * 0.25, 1.22, 1.3], { color: '#141414', eye: true, parent: 'head' })
          .ball([0.16, 0.08, 0.5], [s * 0.6, 0.06, 0.55], { color: '#8a5a48', rot: [0, s * 30, 0], name: s > 0 ? 'flipperL' : 'flipperR', parent: 'body', pivot: [s * 0.5, 0.15, 0.7] })
          .each(4, (i) => t.ball(0.03, [s * (0.1 + (i % 2) * 0.1), 0.88 + Math.floor(i / 2) * 0.1, 1.52], { color: '#6a4a3a', noInk: true, parent: 'head' })),
      );
    return act(scaleFig(t.done(), 0.85),
      [A.par(po('head', [-35, 0, 0], 0.5), sayP('BWOOOORP!', 2)), A.wait(1.2), back('head')],
      [A.par(po('head', [35, 0, 0], 0.5), po('flipperL', [0, 0, 20], 0.5), po('flipperR', [0, 0, -20], 0.5)), A.par(A.move('self', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'slow', style: 'slide' }), sayP('Hrmph!', 1.2)), back('head', 'flipperL', 'flipperR')],
    );
  }),
  // A yellowjacket wasp at its real 1.5 cm: bright yellow and black bands, a narrow waist, and a sting.
  // Real size: a real 1.6 cm wasp (the vocabulary's 0.1 m is too big).
  e('wasp', 'bugs', 'flying insects', () =>
    act(scaleFig(bug('wasp', { length: 0.06, color: '#f2c21e', stripes: '#1e1e1e', wings: 'clear', wingColor: '#c8d8e8', extras: (p, { L }) => {
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
      coneP(p, 'abdomen', [0, -L * 0.02, -L * 0.48], [0, -L * 0.05, -L * 0.6], L * 0.04, '#1e1e1e');
      for (const n of ['wingL', 'wingR']) { const w = g(n); w.size = [w.size[0], w.size[1], w.size[2] * 0.6]; }
    } }), 0.27),
      G.buzz('Bzzzz!'),
      [A.par(po('abdomen', [35, 0, 0], 0.2), sayP('!', 0.8)), A.wait(0.4), back('abdomen')],
    ),
  ),
  // A least weasel: a long slim brown body, white belly, short legs. It does its hopping, twisting "war dance".
  e('weasel', 'wild', 'forest', () =>
    act(scaleFig(beast('weasel', { color: '#8a5a32', belly: '#f2e6cc', body: [0.3, 0.07, 0.07], legL: 0.03, legW: 0.025, neckL: 0.05, neckLean: 25, neckW: 0.05, head: [0.06, 0.045, 0.05], snout: { len: 0.02, h: 0.025, w: 0.03, color: '#8a5a32' }, nose: '#2a1e18', ears: 'side', earSize: 0.02, tail: 'long', tailAngle: 110, acc: [roundEars(0.022), chest('#f2e6cc', 0.9, -0.05), tailTip('#3a2a1e', 'long')] }), 0.75),
      [A.par(A.anim('hop', 3), sayP('Dook dook dook!', 1.8)), A.anim('spin'), A.anim('hop', 2)],
      [A.par(po('neck', [-30, 0, 0], 0.3), po('head', [0, 30, 0], 0.3)), A.wait(0.8), back('neck', 'head')],
    ),
  ),
  // A blue whale, 22 m: long and slender, mottled blue-grey, throat grooves underneath, a tiny fin far back. It
  // sings, and blows a tall spout.
  e('whale', 'sea', 'whales', () =>
    act(whale('whale', { L: 22, hk: 0.17, color: '#4a6a8a', belly: '#9ab0c4', head: 'round', dorsal: 'fin' }, (t, { L, H, y }) => {
      t.each(5, (i) => t.capsule([0.1, L * 0.25, 0.1], [(i - 2) * H * 0.12, y - H * 0.44, L * 0.24], { color: '#8a9ab0', rot: [90, 0, 0], noInk: true, parent: 'body' }));
      t.each(10, (i) => t.ball([H * 0.1, H * 0.05, L * 0.04], [((i % 3) - 1) * H * 0.3, y + H * (0.3 + (i % 2) * 0.1), L * (0.3 - i * 0.06)], { color: '#7a96b0', noInk: true, parent: 'body' }));
    }),
      [A.par(sayP('Woooo-ooo-oooo...', 3)), ...W.swim(3), ...W.blow('Pffffoooosh!')],
      W.slap('Splash!'),
    ),
  ),
  // A whale shark, 12 m (lofted): the biggest fish, a broad flat head with a wide straight mouth right at the front,
  // dark blue-grey dotted with white spots, ridges along the back, a tall crescent tail. The mouth opens to filter
  // plankton.
  e('whale shark', 'sea', 'sharks', () => {
    const head: FIMark = (f, d) => {
      const [w, h, cy] = d.sec(0.93), L = d.o.L;
      f.loft([w * 2.3, h * 1.5, d.Lb * 0.2], [0, cy + h * 0.02, d.z(0.92)], [[0, 0.85, 0.95, 0], [0.5, 1, 0.9, 0], [0.9, 0.95, 0.7, -0.05], [1, 0.75, 0.5, -0.08]], { color: d.o.c, boxy: 0.35, parent: 'body' })
        .ball([w * 1.9, h * 0.12, L * 0.02], [0, cy - h * 0.25, d.z(1) + L * 0.008], { color: '#2a3036', parent: 'body', noInk: true });
      for (const y of [0.55, 0.85]) f.pair((s) => f.ball([d.W * 0.06, d.H * 0.05, d.Lb * 0.62], [s * d.W * 0.34 * (y > 0.7 ? 0.6 : 1), d.y0 + d.H * y * 0.5, d.z(0.5)], { color: '#2e3a46', parent: 'body' }));
      for (let i = 0; i < 5; i++) f.pair((s) => f.ball([d.W * 0.012, h * 0.7, d.Lb * 0.01], [s * d.sec(0.8 - i * 0.025)[0] * 0.98, d.sec(0.8 - i * 0.025)[2], d.z(0.8 - i * 0.025)], { color: '#2a323a', parent: 'body', noInk: true }));
    };
    return act(FK('whale shark', { L: 12, c: '#3e5266', belly: '#e8eae6', h: 0.17, w: 0.2, shape: 'shark', tail: 'moon', tl: 0.24, dorsal: 0.55, dz: 0.5, dl: 0.09, sw: 0.36, anal: 0.2, pec: 1.5, pz: 0.68, eye: 0.25, ez: 0.92, mouth: '#c8ccd0' }, fSpots('#eef0ea', 90, 0.1, { t0: 0.2, t1: 0.9, lo: -10, hi: 80, seed: 11 }), head),
      [A.spawn('food', 'plankton', { rel: 'front', of: 'self', dist: 'close' }), A.par(po('jaw', [28, 0, 0], 0.8)), A.remove('food', 'fade'), A.par(po('jaw', R0, 0.6), sayP('Gulp.', 1.2))],
      F.swish(6, 20),
    );
  }),
  // A blue wildebeest (gnu), 1.35 m at the shoulder sloping down to the rump (lofted): a heavy front with a black
  // mane and beard, a long broad dark face, cow-like horns curving out and up, dark stripes on the shoulders.
  e('wildebeest', 'wild', 'savanna', () => {
    const stripes: QMark = (f, d) => {
      for (let i = 0; i < 6; i++) {
        const t = 0.55 + (0.35 * i) / 5, [w, h, cy] = d.sec(t);
        f.pair((s) => f.ball([w * 0.25, h * 1.4, d.q.L * 0.035], [s * w * 0.9, cy + h * 0.15, d.z(t)], { color: '#4e4a46', parent: 'body', noInk: true, rot: [0, 0, s * 8] }));
      }
    };
    const beard: QMark = (f, d) => {
      const n = d.q.neck, a = d.nt, b = d.nb;
      f.rod([0, a[1] - n.w * 0.4, a[2] + n.w * 0.1], [0, (a[1] + b[1]) / 2 - n.w * 0.55, (a[2] + b[2]) / 2 + n.w * 0.35], 0.1, '#1e1c1a', { parent: 'neck' });
    };
    return act(QK('wildebeest', { c: '#6e6a64', H: 1.35, L: 1.45, D: 0.66, W: 0.5, tuck: 0.25, rump: 0.82, hump: 0.08, belly: '#5e5a54', neck: { l: 0.42, w: 0.28, lean: 52, base: 0.44 }, head: { l: 0.46, w: 0.2, h: 0.23, c: '#3a3634' }, muz: { l: 0.24, w: 0.21, h: 0.2, c: '#2e2a28', drop: 0.18 }, nose: '#1e1a18', eye: { k: 0.9 }, ear: { k: 'side', s: 0.12 }, leg: { w: 0.07, hoof: '#2a2420', low: '#4a4642' }, tail: { k: 'tuft', l: 0.7, w: 0.035, a: 165, tip: '#1e1c1a' } }, hornsQ('#3a3634', 0.3, 'cow', 0.26), maneQ('#1e1c1a', 1.2), beard, stripes, limbsQ(1.6)),
      [A.par(po('jaw', [18, 0, 0], 0.2), sayP('Gnu! Gnu!', 1.4)), back('jaw'), A.par(A.anim('hop'), po('legBL', [50, 0, 0], 0.25), po('legBR', [50, 0, 0], 0.25), po('body', [12, 0, 0], 0.25)), back('legBL', 'legBR', 'body')],
      Q.graze('*grunt*'),
    );
  }),
  // A grey wolf: thick grizzled coat with a darker saddle, pale cheeks and legs, amber eyes. It throws its head
  // back and howls; and it growls, ears flat.
  e('wolf', 'wild', 'forest', () =>
    act(wolf('wolf', 1, 1, '#8a8a90', '#e8e4dc', '#5e5e66'),
      Q.howl('Aaa-WOOOOOOO!', 2.6),
      [A.par(po('earL', [-40, 0, 0], 0.3), po('earR', [-40, 0, 0], 0.3), po('neck', [20, 0, 0], 0.3), po('jaw', [10, 0, 0], 0.3), sayP('Grrrrr...', 1.8)), A.wait(1.2), back('earL', 'earR', 'neck', 'jaw')],
    ),
  ),
  e('wolf cub', 'wild', 'forest', () =>
    act(wolf('wolf cub', 0.38, 1.5, '#9a9088', '#efe8dc', '#7a7068'),
      Q.howl('Awoo-oo!', 1.4),
      [...Q.pounce(0.38), A.anim('wag')],
    ),
  ),
  // A wolverine: a stocky dark-brown little bear of a weasel with a pale band along its sides and a bushy tail.
  e('wolverine', 'wild', 'forest', () =>
    act(beast('wolverine', { color: '#3a2a1e', body: [0.6, 0.26, 0.28], legL: 0.08, legW: 0.07, legColor: '#2a1e16', neckL: 0.04, neckLean: 55, neckW: 0.14, head: [0.16, 0.13, 0.15], snout: { len: 0.06, h: 0.07, w: 0.08, color: '#2a1e16' }, nose: '#141010', ears: 'pointy', earSize: 0.04, tail: 'fluffy', tailAngle: 130, acc: [roundEars(0.04), brows('#b8885a', 0.8), jaw({ len: 0.06, h: 0.07, w: 0.08 }, '#2a1e16', '#f2ece0'), (p, d) => {
      const [L, H, W] = d.body;
      for (const s of [1, -1]) add(p, 'body', 'ball', [W * 0.16, H * 0.32, L * 0.75], [s * W * 0.42, H * 0.06, -L * 0.05], '#b8885a', { noInk: true, layer: 3 });
    }] }),
      [A.par(po('jaw', [32, 0, 0], 0.25), po('neck', [15, 0, 0], 0.25), sayP('GRRRR!', 1.4)), A.anim('shake'), back('jaw', 'neck')],
      Q.dig(3, 'snow'),
    ),
  ),
  // A wombat: a solid round-backed burrower with a broad blunt nose, small round ears and stubby legs. It digs.
  e('wombat', 'wild', 'australia', () =>
    act(beast('wombat', { color: '#7a6a5a', bodyShape: 'ball', body: [0.75, 0.42, 0.45], legL: 0.06, legW: 0.12, neckL: 0.04, neckLean: 70, neckW: 0.3, head: [0.26, 0.22, 0.26], snout: { len: 0.08, h: 0.13, w: 0.17 }, nose: '#2a2420', ears: 'pointy', earSize: 0.06, tail: 'stub', acc: [roundEars(0.065), (p) => { for (const n of ['pawFL', 'pawFR']) for (let i = 0; i < 3; i++) add(p, n, 'cyl', [0.012, 0.03, 0.012], [(i - 1) * 0.025, -0.01, 0.06], '#3a3028', { taper: 0, srot: [100, 0, 0] }); }] }),
      Q.dig(3),
      [A.par(A.anim('hop'), sayP('Huff! Huff!', 1.4))],
    ),
  ),
  // A great spotted woodpecker clinging upright to a tree trunk, propped on its stiff tail: black and white with a
  // red cap. It drums on the bark.
  e('woodpecker', 'aviary', 'garden birds', () => {
    const f = birdx('woodpecker', { height: 0.26, color: '#1e1e22', wing: '#1e1e22', beak: '#4a4a4a', legs: '#6a6a6a', tail: ['#1e1e22', '#1e1e22'] }, (p, g, H) => {
      const b = g('beak');
      b.size = [H * 0.06, H * 0.2, H * 0.06];
      b.off = [0, H * 0.1, 0];
      add(p, 'head', 'ball', [H * 0.2, H * 0.12, H * 0.18], [0, H * 0.22, -H * 0.03], '#d42a2a', { layer: 3 });
      for (const s of [1, -1]) add(p, 'head', 'ball', [H * 0.02, H * 0.05, H * 0.16], [s * H * 0.115, H * 0.09, 0], '#f4f2ee', { noInk: true, layer: 5 });
      bBelly(p, H, '#f4f2ee');
      add(p, 'body', 'ball', [H * 0.2, H * 0.12, H * 0.16], [0, -H * 0.15, -H * 0.12], '#d42a2a', { noInk: true, layer: 3 });
      for (const w of ['wingL', 'wingR']) for (const z of [0.06, -0.02, -0.1]) add(p, w, 'ball', [H * 0.09, H * 0.03, H * 0.04], [0, H * (z * 0.4), H * z], '#f4f2ee', { noInk: true, layer: 4 });
      const body = g('body');
      body.rot = [-62, 0, 0];
      body.at = [0, 0.42, -0.02];
      g('head').rot = [52, 0, 0];
      g('tail').rot = [-125, 0, 0];
      for (const s of ['L', 'R']) g('leg' + s).rot = [70, 0, 0];
    });
    return act(fx(f, (p) => {
      add(p, undefined, 'cyl', [0.17, 0.62, 0.17], [0, 0.31, 0.12], '#7a5a3e', { name: 'trunk', layer: -2 });
      add(p, 'trunk', 'ball', [0.035, 0.045, 0.02], [0, 0.17, -0.083], '#3a2a1e', { noInk: true });
      for (let i = 0; i < 5; i++) add(p, 'trunk', 'box', [0.012, 0.1, 0.03], [Math.sin(i * 1.3) * 0.084, -0.22 + i * 0.1, Math.cos(i * 1.3) * 0.084], '#5e4430', { round: 0.8, noInk: true, srot: [0, i * 1.3 / D, 0], layer: -1 });
    }),
      [A.par(A.effect('dust', { dur: 1.2 }), sayP('Rat-a-tat-tat-tat!', 1.8), ...oscT([['head', [30, 0, 0], [0, 0, 0]]], 7, 0.07))],
      [A.par(po('head', [-20, 0, 0], 0.2), sayP('Kik! Kik!', 1.2)), back('head'), ...B.flick(4)],
    );
  }),
  // An earthworm, 15 cm: pink-brown rings and a paler saddle band. It wriggles, and burrows into the soil.
  e('worm', 'bugs', 'grubs and worms', () =>
    act(fx(snake('worm', { length: 0.2, color: '#e8949a', bands: '#d87e86', girth: 0.08 }), (p) => {
      cut(p, 'tongue', 'eyeL', 'eyeR');
      add(p, 'seg4', 'ball', [0.018, 0.024, 0.018], [0, 0.012, 0], '#f0b0b0', { noInk: true, layer: 1 });
    }),
      [A.par(A.effect('dust', { dur: 1.2 }), po('seg0', R0, 1, { move: [0, -0.03, 0] })), A.wait(0.8), po('seg0', R0, 1, { move: R0 })],
      S.slither(5, 22),
    ),
  ),
  // A yak: a big shaggy black-brown ox with a long skirt of hair to the ground, a hump, and up-curving horns. It
  // grunts.
  e('yak', 'farm', 'cattle', () =>
    act(sockOn(beast('yak', { color: '#2e2420', body: [2.0, 1.1, 0.9], legL: 0.55, legW: 0.16, hoof: '#1a1410', hoofH: 0.1, neckL: 0.2, neckLean: 70, neckW: 0.5, head: [0.55, 0.4, 0.38], snout: { len: 0.2, h: 0.22, w: 0.25, color: '#3a302a' }, nose: '#1a1410', ears: 'side', earSize: 0.14, tail: 'fluffy', tailAngle: 150, acc: [bullHorns('#e8e0d0', 1.1), hump('#2e2420', 1.0, 0.25), tuft('#3a2e28', 1.2), jaw({ len: 0.2, h: 0.22, w: 0.25 }, '#3a302a'), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 1.12, H * 0.75, L * 0.95], [0, -H * 0.3, 0], '#241c18', { layer: 1 });
      add(p, 'body', 'ball', [W * 1.18, H * 0.9, L * 0.7], [0, -H * 0.55, 0.05], '#2a201c', { layer: 1 });
    }] }), 'body', 'back', 'seat', [0, 0.57, -0.1]),
      [A.par(po('jaw', [14, 0, 0], 0.3), po('head', [10, 0, 0], 0.3), sayP('Hrrunk! Hrrunk!', 1.6)), ...osc([['head', [10, 15, 0], [10, -15, 0]]], 4, 0.2), back('jaw', 'head')],
      Q.graze('*grunt*'),
    ),
  ),
  // A Yorkshire terrier: a long silky steel-blue coat parted down the back to the ground, a tan head and legs, a
  // topknot in a red bow, little upright ears.
  e('yorkie', 'pets', 'dog breeds', () => {
    const s = 0.4, legK = 0.75;
    return act(dog('yorkie', { s, legK, color: '#4a5a6e', headColor: '#c8964a', legColor: '#c8964a', snout: '#c8964a', ears: 'pointy', earK: 0.9, earColor: '#c8964a', snoutK: 0.6, nose: '#141212', tail: 'stub', tailAngle: 30, acc: [skirt('#56667a', 0.3 * s * legK + 0.3 * s * 0.42, 0.9), (p, d) => {
      const [L, H, W] = d.body;
      add(p, 'body', 'ball', [W * 0.08, H * 0.2, L * 1.0], [0, H * 0.5, 0], '#3a4858', { noInk: true, layer: 3 });
      add(p, 'head', 'ball', [d.head[2] * 0.9, d.head[1] * 0.5, d.head[0] * 0.5], [0, -d.head[1] * 0.3, d.head[0] * 0.2], '#d8a65a', { layer: 2 });
    }, tuft('#c8964a', 0.8), bow('#d6453a')] }),
      [...Q.bark('Yip! Yip!', 2, 0.7), A.anim('hop', 2)],
      [A.par(A.anim('spin'), sayP('♥', 1))],
    );
  }),
  // A plains zebra: bold black and white stripes down to the hooves, an upright striped mane and a black muzzle.
  // It barks and kicks up its heels.
  e('zebra', 'wild', 'savanna', () =>
    act(zebra('zebra', 0.86, 1.15, 1, '#1e1e1e'),
      [A.par(po('neck', [-15, 0, 0], 0.3), po('jaw', [16, 0, 0], 0.3), sayP('Kwa-ha! Kwa-ha!', 1.8)), back('neck', 'jaw'), A.par(po('body', [14, 0, 0], 0.2), po('legBL', [60, 0, 0], 0.2), po('legBR', [60, 0, 0], 0.2), A.effect('dust', { dur: 0.8 })), back('body', 'legBL', 'legBR')],
      Q.graze('*munch*'),
    ),
  ),
  e('zebra foal', 'wild', 'savanna', () =>
    act(zebra('zebra foal', 0.52, 1.35, 1.2, '#4a3426'),
      [A.par(A.anim('hop', 3), sayP('Kwee!', 1.2))],
      [...Q.ears(4, 25), A.par(po('jaw', [14, 0, 0], 0.2), sayP('Kwa!', 1)), back('jaw')],
    ),
  ),
  x('bamboo shoot', () => {
    const t = m('bamboo shoot');
    t.stick([0, 0, 0], [0, 0.95, 0.02], 0.035, '#7aa84a', { name: 'stalk' })
      .each(4, (i) => t.torus([0.045, 0.045, 0.012], [0, 0.2 + i * 0.22, 0.004 * i], { color: '#5e8a34', rot: [90, 0, 0], parent: 'stalk' }))
      .each(5, (i) => {
        const a = i * 72 * D;
        t.ball([0.16, 0.008, 0.035], [Math.cos(a) * 0.08, 0.82 + i * 0.03, 0.02 + Math.sin(a) * 0.08], { color: '#5a9a3a', rot: [0, -i * 72, -25], parent: 'stalk' });
      });
    return t.act({ click: [A.anim('wobble')] }).done();
  }),
];
