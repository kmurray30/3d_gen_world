/** Catalog chunk animals-a: the words in assign/animals-a.tsv. */
import { e as entry, type CatalogEntry, type District } from './types';
import { m, type M } from '../dsl';
import { ani, beast, who, type AniExtra, type Extra } from '../accessories';
import { bird, type BirdOpts, type Parts } from '../kit';
import { bug, fish, snake } from '../creatures';
import { col } from '../colors';
import { measure } from '../math';
import type { FigPart, Figure, Shape, Vec3 } from '../types';

/* ----- helpers ----------------------------------------------------------------------------------------------- */

type B = Parameters<typeof beast>[1];
type FX = NonNullable<Parameters<typeof fish>[1]['extras']>;
type BX = NonNullable<Parameters<typeof bug>[1]['extras']>;
type Sign = 1 | -1;
const SIDES: Array<['L' | 'R', Sign]> = [['L', 1], ['R', -1]];

// extra part names are numbered from zero on every build, so a figure comes out the same each time it is built
let uid = 0;
const e = (key: string, d: District, g: string, f: () => Figure): CatalogEntry =>
  entry(key, d, g, () => {
    uid = 0;
    return f();
  });

const deg = 180 / Math.PI;
const mul = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
/** Turn that lays a y-axis solid along d. */
const aim = (d: Vec3): Vec3 => {
  const l = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  return [Math.atan2(d[2], d[1]) * deg, 0, -Math.asin(Math.max(-1, Math.min(1, d[0] / l))) * deg];
};
/** A solid hung on a kit part, `at` in that part's frame. */
const P = (parent: string | undefined, shape: Shape, size: Vec3, at: Vec3, c: string, o: Partial<FigPart> = {}): FigPart => ({ name: `x${uid++}`, parent, at, shape, size, color: col(c, c), layer: 2, ...o });
/** A rounded rod between two points in a kit part's frame. */
const rodP = (parent: string, a: Vec3, b: Vec3, t: number, c: string, o: Partial<FigPart> = {}): FigPart => {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-4;
  return P(parent, 'capsule', [t, len + t, t], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], c, { srot: aim(d), ...o });
};
const get = (p: Parts, n: string): FigPart | undefined => p.list.find((q) => q.name === n);
const both = (p: Parts, n: string, fn: (q: FigPart, s: Sign) => void): void => {
  for (const [x, s] of SIDES) {
    const q = get(p, n + x);
    if (q) fn(q, s);
  }
};
/** Remove parts and everything hanging off them. */
const cut = (list: FigPart[], names: string[]): void => {
  const gone = new Set(names);
  for (let grow = true; grow; ) {
    grow = false;
    for (const q of list) if (q.parent && gone.has(q.parent) && !gone.has(q.name)) (gone.add(q.name), (grow = true));
  }
  for (let i = list.length - 1; i >= 0; i--) if (gone.has(list[i].name)) list.splice(i, 1);
};

/* ----- four-legged extras (head frame: origin at the head joint; body frame: origin at the body centre) ----- */

const drop = (...names: string[]): AniExtra => (p) => cut(p.list, names);
/** A solid on the head or body, sized and placed in fractions of its [width, height, length]. */
const on = (fr: 'head' | 'body', c: string, s: Vec3, a: Vec3, o: Partial<FigPart> = {}, shape: Shape = 'ball', mirror = false): AniExtra => (p, d) => {
  const [l, h, w] = fr === 'head' ? d.head : d.body;
  const ks: Sign[] = mirror ? [1, -1] : [1];
  for (const k of ks) p.add(P(fr, shape, [w * s[0], h * s[1], l * s[2]], [k * w * a[0], h * a[1], l * a[2]], c, { noInk: true, layer: 3, ...o, srot: o.srot ? [o.srot[0], o.srot[1] * k, o.srot[2] * k] : undefined }));
};
const hp = (c: string, s: Vec3, a: Vec3, o: Partial<FigPart> = {}, shape: Shape = 'ball') => on('head', c, s, a, o, shape);
const hp2 = (c: string, s: Vec3, a: Vec3, o: Partial<FigPart> = {}, shape: Shape = 'ball') => on('head', c, s, a, o, shape, true);
const bp = (c: string, s: Vec3, a: Vec3, o: Partial<FigPart> = {}, shape: Shape = 'ball') => on('body', c, s, a, o, shape);
const bp2 = (c: string, s: Vec3, a: Vec3, o: Partial<FigPart> = {}, shape: Shape = 'ball') => on('body', c, s, a, o, shape, true);
const solid: Partial<FigPart> = { noInk: false, layer: 2 };

const blaze = (c: string): AniExtra => hp(c, [0.22, 0.6, 0.36], [0, 0.32, 0.5]);
const mask = (c: string): AniExtra => hp(c, [0.86, 0.5, 0.62], [0, -0.06, 0.32]);
const jowls = (c: string): AniExtra => hp2(c, [0.3, 0.34, 0.34], [0.2, -0.42, 0.55], solid);
const saddle = (c: string, k = 1): AniExtra => bp(c, [1.05, 0.6 * k, 0.7], [0, 0.25, -0.04]);
const socks = (c: string): AniExtra => (p) => {
  for (const n of ['FL', 'FR', 'BL', 'BR']) {
    const q = get(p, 'paw' + n);
    if (q) q.color = col(c, c);
  }
};
/** Chest and throat patch. */
const bib = (c: string): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  p.add(P('body', 'ball', [W * 0.76, H * 0.76, L * 0.3], [0, -H * 0.04, L * 0.37], c, { noInk: true, layer: 3 }));
  const n = get(p, 'neck');
  if (n) {
    const w = n.size[0], l = n.size[1] - w;
    p.add(P('neck', 'ball', [w * 0.76, l * 0.9 + w * 0.3, w * 0.62], [0, l * 0.4, w * 0.24], c, { noInk: true, layer: 3 }));
  }
};
/** A fluffy collar of fur round the neck (collie, lion-ish ruffs). */
const ruff = (c: string, k = 1): AniExtra => (p) => {
  const n = get(p, 'neck');
  if (n) {
    const w = n.size[0], l = n.size[1] - w;
    p.add(P('neck', 'ball', [w * 1.7 * k, l * 0.9 + w * k, w * 1.5 * k], [0, l * 0.3, w * 0.15], c, { layer: 2 }));
  }
};
const collar = (c: string): AniExtra => (p) => {
  const n = get(p, 'neck');
  if (n) {
    const w = n.size[0], l = n.size[1] - w;
    p.add(P('neck', 'torus', [w * 1.16, w * 1.16, w * 0.32], [0, l * 0.55, 0], c, { srot: [90, 0, 0], tube: 0.22, layer: 4 }));
  }
};
/** Pale tail tip on a long or fluffy tail. */
const tip = (c: string): AniExtra => (p) => {
  const t = get(p, 'tail');
  if (!t || t.shape !== 'capsule') return;
  const len = t.size[1], w = t.size[0], oy = t.off ? t.off[1] : 0;
  p.add(P('tail', 'ball', [w * 1.12, len * 0.34, w * 1.12], [0, oy + len * 0.32, 0], c, { layer: -1 }));
};
const tailK = (k: number): AniExtra => (p) => {
  const t = get(p, 'tail');
  if (t) {
    t.size = mul(t.size, k);
    if (t.off) t.off = mul(t.off, k);
  }
};
/** Rounded ears on top of the head (bears, koalas, big cats); an optional pale inside. */
const roundEars = (inner?: string, up = 0.5): AniExtra => (p, d) => {
  const [l, h, w] = d.head;
  both(p, 'ear', (q, s) => {
    const es = q.size[1];
    q.at = [s * w * 0.34, h * up, -l * 0.08];
    q.rot = [0, 0, -s * 22];
    q.size = [es, es, es * 0.4];
    q.off = [0, es * 0.25, 0];
    if (inner) p.add(P(q.name, 'ball', [es * 0.6, es * 0.6, es * 0.2], [0, es * 0.22, es * 0.12], inner, { noInk: true, layer: 3 }));
  });
};
const earTufts = (c: string): AniExtra => (p) =>
  both(p, 'ear', (q) => {
    const es = q.size[1];
    p.add(P(q.name, 'cyl', [es * 0.3, es * 0.55, es * 0.14], [0, es * 0.98, 0], c, { taper: 0, layer: 1 }));
  });
const eyeC = (c: string, k = 1): AniExtra => (p) =>
  both(p, 'eye', (q) => {
    q.color = col(c, c);
    q.size = mul(q.size, k);
  });
/** Thick tapering reptile tail, named 'tail' so it sways. */
const ltail = (len: number, w: number, droop = -6, c?: string): AniExtra => (p, d) => {
  const [L, H, W] = d.body, tl = L * len;
  const bc = c ?? get(p, 'body')?.color ?? '#888888';
  p.add(P('body', 'cyl', [W * w, tl, H * w * 0.85], [0, -H * 0.06, -L * 0.4], bc, { name: 'tail', rot: [droop, 0, 0], srot: [-90, 0, 0], off: [0, 0, -tl / 2], taper: 0.12, layer: -1 }));
};
/** Bony bumps along the reptile tail. */
const tailRidge = (n: number, c: string): AniExtra => (p) => {
  const t = get(p, 'tail');
  if (!t) return;
  const tl = t.size[1], th = t.size[2];
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, r = 1 - f * 0.85;
    p.add(P('tail', 'cyl', [th * 0.22 * r, th * 0.34 * r, th * 0.3 * r], [0, th * 0.5 * (1 - f * 0.88), -tl * f], c, { taper: 0, segs: 4, layer: 0 }));
  }
};
/** A row of spikes or scutes along the back. */
const backRidge = (n: number, c: string, k = 1, from = 0.38, to = -0.4): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  for (let i = 0; i < n; i++) {
    const z = from + ((to - from) * i) / Math.max(1, n - 1);
    const y = Math.sqrt(Math.max(0.05, 1 - (2 * z) ** 2)) * H * 0.48;
    p.add(P('body', 'cyl', [W * 0.12 * k, H * 0.28 * k, W * 0.16 * k], [0, y, L * z], c, { taper: 0, segs: 4, layer: 0 }));
  }
};
/** Legs splayed out sideways (lizards). */
const splay = (a = 22): AniExtra => (p) => {
  for (const n of ['FL', 'FR', 'BL', 'BR']) {
    const q = get(p, 'leg' + n);
    if (q) q.rot = [0, 0, (n[1] === 'L' ? 1 : -1) * a];
  }
};
/** Teeth along both sides of the snout. */
const teeth = (n: number, c = '#fffaf0', k = 1): AniExtra => (p) => {
  const s = get(p, 'snout');
  if (!s || !s.off) return;
  const [w, h, len] = s.size, o = s.off;
  for (const x of [1, -1])
    for (let i = 0; i < n; i++)
      p.add(P('head', 'cyl', [w * 0.1 * k, h * 0.35 * k, w * 0.1 * k], [x * w * 0.42, o[1] - h * 0.5, o[2] - len * 0.38 + (len * 0.82 * i) / n], c, { taper: 0, srot: [180, 0, 0], layer: 4 }));
};
/** Eyes on bumps on top of the head (crocodiles, hippos). */
const eyesUp = (c: string): AniExtra => (p, d) => {
  const [l, h, w] = d.head;
  both(p, 'eye', (q, s) => {
    q.at = [s * w * 0.3, h * 0.55, l * 0.24];
    p.add(P('head', 'ball', [w * 0.3, h * 0.42, l * 0.32], [s * w * 0.27, h * 0.45, l * 0.1], c, { layer: 3 }));
  });
};
const trunk = (c: string, tusks: boolean): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  p.add(P('head', 'capsule', [hw * 0.32, hh * 1.5, hw * 0.3], [0, -hh * 0.5, hl * 0.58], c, { srot: [12, 0, 0], taper: 0.6, layer: 4 }));
  p.add(P('head', 'capsule', [hw * 0.2, hh * 0.4, hw * 0.2], [0, -hh * 1.2, hl * 0.72], c, { srot: [60, 0, 0], layer: 4 }));
  if (tusks) for (const s of [1, -1]) p.add(P('head', 'cyl', [hw * 0.11, hh * 0.65, hw * 0.11], [s * hw * 0.25, -hh * 0.42, hl * 0.62], '#fffaf0', { taper: 0.1, srot: [125, 0, 0], layer: 5 }));
};
/** Flat elephant ears against the sides of the head. */
const flapEars = (): AniExtra => (p, d) => {
  const [hl, hh, hw] = d.head;
  both(p, 'ear', (q, s) => {
    const es = q.size[1];
    Object.assign(q, { at: [s * hw * 0.46, hh * 0.32, -hl * 0.1], rot: [0, -s * 32, s * 8], size: [es * 0.12, es * 1.05, es * 0.95], off: [0, -es * 0.28, -es * 0.12] });
  });
};

/** Scale a recipe; babies get a bigger head (kh), shorter legs (kl) and a shorter muzzle. */
const sc = (o: B, k: number, kh = 1, kl = 1): B => ({
  ...o,
  body: mul(o.body, k),
  legL: o.legL * k * kl,
  legW: o.legW * k,
  hoofH: o.hoofH ? o.hoofH * k : undefined,
  neckL: o.neckL * k,
  neckW: o.neckW ? o.neckW * k : undefined,
  head: mul(o.head, k * kh),
  snout: o.snout ? { ...o.snout, len: o.snout.len * k * kh * (kh > 1 ? 0.72 : 1), h: o.snout.h * k * kh, w: o.snout.w * k * kh } : undefined,
  earSize: o.earSize * k * kh,
});
const baby = (o: B, k: number, kl = 0.88, kh = 1.38): B => sc(o, k, kh, kl);
const bst = (key: string, o: B, ...acc: AniExtra[]): Figure => beast(key, { ...o, acc: [...(o.acc ?? []), ...acc] });

/* ----- recipes shared by adults and their young ----- */

const WH = '#f6f2ea', BK = '#2a2420';
const DOG: B = { color: '#e3c27e', body: [0.72, 0.3, 0.27], legL: 0.32, legW: 0.085, neckL: 0.15, neckLean: 30, neckW: 0.15, head: [0.25, 0.2, 0.19], snout: { len: 0.13, h: 0.1, w: 0.11 }, ears: 'floppy', earSize: 0.13, tail: 'long', tailAngle: 125 };
const dog = (key: string, k: number, o: Partial<B>, ...acc: AniExtra[]): Figure => beast(key, sc({ ...DOG, ...o, acc }, k));
const CAT: B = { color: '#9a9a9a', body: [0.42, 0.18, 0.15], legL: 0.15, legW: 0.04, neckL: 0.05, neckLean: 40, neckW: 0.08, head: [0.11, 0.1, 0.115], snout: { len: 0.035, h: 0.04, w: 0.055 }, nose: '#e89a9a', ears: 'pointy', earSize: 0.055, tail: 'long', tailAngle: 35 };
const FOX: B = { color: '#e0702a', body: [0.55, 0.24, 0.2], legL: 0.2, legW: 0.05, legColor: '#3a2a22', neckL: 0.1, neckLean: 40, neckW: 0.1, head: [0.19, 0.14, 0.15], snout: { len: 0.11, h: 0.06, w: 0.07, color: WH }, ears: 'pointy', earSize: 0.09, earColor: '#c85a20', tail: 'fluffy', tailAngle: 115, belly: WH };
const BEAR: B = { color: '#7a4e2c', body: [1.5, 0.85, 0.8], bodyShape: 'ball', legL: 0.4, legW: 0.24, neckL: 0.12, neckLean: 55, neckW: 0.45, head: [0.42, 0.38, 0.4], snout: { len: 0.16, h: 0.15, w: 0.17, color: '#a8784a' }, ears: 'side', earSize: 0.13, tail: 'stub' };
const ELE: B = { color: '#8e8c8a', body: [2.8, 1.8, 1.6], bodyShape: 'ball', legL: 1.15, legW: 0.45, hoofH: 0.12, neckL: 0.15, neckLean: 60, neckW: 0.9, head: [0.9, 1.0, 0.85], ears: 'floppy', earSize: 1.0, tail: 'tuft', tailAngle: 170 };
const GIR: B = { color: '#e8b45a', body: [1.6, 0.9, 0.7], bodyShape: 'capsule', legL: 1.6, legW: 0.14, hoof: 'darkbrown', neckL: 1.9, neckLean: 18, neckW: 0.25, head: [0.55, 0.3, 0.26], snout: { len: 0.2, h: 0.18, w: 0.18, color: '#d9a35f' }, ears: 'side', earSize: 0.16, tail: 'tuft' };
const CHEETAH: B = { color: '#e2b060', body: [1.1, 0.42, 0.32], legL: 0.55, legW: 0.08, neckL: 0.15, neckLean: 45, neckW: 0.16, head: [0.22, 0.19, 0.2], snout: { len: 0.07, h: 0.08, w: 0.1, color: '#f4e6c8' }, ears: 'side', earSize: 0.07, tail: 'long', tailAngle: 140, belly: '#f4e6c8' };
const HYENA: B = { color: '#b89c70', body: [1.0, 0.55, 0.38], legL: 0.42, legW: 0.1, neckL: 0.2, neckLean: 35, neckW: 0.25, head: [0.3, 0.24, 0.24], snout: { len: 0.13, h: 0.12, w: 0.12, color: '#3a3028' }, ears: 'side', earSize: 0.11, tail: 'tuft', tailColor: '#3a3028' };
const BADGER: B = { color: '#8f8a84', body: [0.65, 0.28, 0.32], bodyShape: 'ball', legL: 0.07, legW: 0.08, legColor: '#2a2624', neckL: 0.05, neckLean: 60, neckW: 0.16, head: [0.19, 0.14, 0.14], headColor: '#f4f2ee', snout: { len: 0.08, h: 0.07, w: 0.07, color: '#f4f2ee' }, ears: 'side', earSize: 0.04, tail: 'stub' };
const BEAVER: B = { color: '#7a4f2e', body: [0.62, 0.32, 0.34], bodyShape: 'ball', legL: 0.05, legW: 0.07, legColor: '#3a2a20', neckL: 0.04, neckLean: 60, neckW: 0.2, head: [0.17, 0.15, 0.16], snout: { len: 0.06, h: 0.08, w: 0.1, color: '#5a3a24' }, ears: 'side', earSize: 0.04, tail: 'stub' };
const KOALA: B = { color: '#9c9ca2', body: [0.42, 0.3, 0.3], bodyShape: 'ball', legL: 0.1, legW: 0.08, neckL: 0.03, neckLean: 40, neckW: 0.18, head: [0.2, 0.2, 0.24], snout: { len: 0.04, h: 0.08, w: 0.07, color: '#2a2624' }, nose: '#2a2624', ears: 'side', earSize: 0.13, earColor: '#b4b4b8', tail: 'stub', belly: '#e8e6e2' };
const GOAT: B = { color: '#f0ece4', body: [0.8, 0.42, 0.34], legL: 0.38, legW: 0.07, hoof: '#4a4440', neckL: 0.22, neckLean: 30, neckW: 0.14, head: [0.3, 0.17, 0.15], snout: { len: 0.1, h: 0.1, w: 0.1, color: '#e8d8d0' }, ears: 'side', earSize: 0.12, tail: 'stub', tailAngle: 30 };
const COW: B = { color: '#f4f2ee', body: [1.9, 0.95, 0.8], legL: 0.6, legW: 0.16, hoof: '#3a3430', neckL: 0.25, neckLean: 60, neckW: 0.5, head: [0.55, 0.42, 0.4], snout: { len: 0.2, h: 0.28, w: 0.34, color: '#f0b8b0' }, ears: 'side', earSize: 0.2, tail: 'tuft' };
const HORSE: B = { color: '#8a5a32', body: [1.5, 0.75, 0.52], legL: 0.85, legW: 0.12, hoof: '#2a2420', neckL: 0.6, neckLean: 30, neckW: 0.3, head: [0.55, 0.25, 0.22], snout: { len: 0.22, h: 0.2, w: 0.18 }, ears: 'pointy', earSize: 0.14, tail: 'fluffy', tailAngle: 155, tailColor: '#3a2618' };
const DONKEY: B = { color: '#8f8780', body: [1.15, 0.62, 0.48], legL: 0.55, legW: 0.11, hoof: '#3a3430', neckL: 0.38, neckLean: 35, neckW: 0.25, head: [0.48, 0.25, 0.22], snout: { len: 0.17, h: 0.18, w: 0.18, color: '#e4ddd4' }, ears: 'long', earSize: 0.3, tail: 'tuft', tailColor: '#3a3330', belly: '#d8d2ca' };
const DEER: B = { color: '#a8743e', body: [1.15, 0.55, 0.42], legL: 0.72, legW: 0.08, hoof: '#3a2a20', neckL: 0.42, neckLean: 25, neckW: 0.17, head: [0.36, 0.21, 0.19], snout: { len: 0.13, h: 0.12, w: 0.12, color: '#7a5434' }, nose: '#1d1a17', ears: 'long', earSize: 0.17, tail: 'stub', tailColor: WH, belly: '#f0e6d4' };
const BISON: B = { color: '#4a3020', body: [2.3, 1.25, 1.0], bodyShape: 'ball', legL: 0.55, legW: 0.2, hoof: '#1e1a18', neckL: 0.15, neckLean: 75, neckW: 0.8, head: [0.5, 0.6, 0.6], snout: { len: 0.15, h: 0.25, w: 0.3, color: '#2a2018' }, ears: 'side', earSize: 0.12, tail: 'tuft' };
const RABBIT: B = { color: WH, body: [0.28, 0.19, 0.18], bodyShape: 'ball', legL: 0.04, legW: 0.045, neckL: 0.035, neckLean: 30, neckW: 0.08, head: [0.11, 0.1, 0.1], snout: { len: 0.03, h: 0.04, w: 0.05 }, nose: '#e88a9a', ears: 'long', earSize: 0.13, tail: 'stub', tailColor: WH };
const haunches = (c: string): AniExtra => bp2(c, [0.32, 0.72, 0.46], [0.4, -0.12, -0.24], solid);
const pinkEars = (c: string): AniExtra => (p) =>
  both(p, 'ear', (q) => {
    const es = q.size[1];
    p.add(P(q.name, 'ball', [es * 0.22, es * 0.75, es * 0.12], [0, es * 0.42, es * 0.1], c, { noInk: true, layer: 3 }));
  });

/** A lizard: long low body, sprawled legs, a thick tapering tail. */
const lizard = (key: string, o: { color: string; body: Vec3; legL: number; legW: number; head: Vec3; snout: NonNullable<B['snout']>; tail: number; tailW?: number; belly?: string }, ...acc: AniExtra[]): Figure =>
  beast(key, { color: o.color, body: o.body, legL: o.legL, legW: o.legW, neckL: o.body[0] * 0.04, neckLean: 75, neckW: o.body[2] * 0.5, head: o.head, snout: o.snout, ears: 'side', earSize: 0.01, tail: 'stub', belly: o.belly, acc: [drop('earL', 'earR', 'tail'), ltail(o.tail, o.tailW ?? 0.5), splay(), ...acc] });

/* ----- birds ----- */

interface Fx {
  g: (n: string) => FigPart;
  add: (...ps: FigPart[]) => void;
  cut: (...n: string[]) => void;
  H: number;
}
type BMod = (f: Fx) => void;
/** The bird kit plus changes to its parts (head, beak, wingL/R, tail, body). Head frame: head ball centre at y 0.12H. */
const bd = (key: string, o: BirdOpts, ...mods: BMod[]): Figure => {
  const f = bird(key, o);
  const list = f.parts;
  const fx: Fx = {
    g: (n) => list.find((q) => q.name === n) as FigPart,
    add: (...ps) => void list.push(...ps),
    cut: (...n) => cut(list, n),
    H: o.height,
  };
  for (const md of mods) md(fx);
  return measure(f);
};
const crest = (c: string, k = 1, n = 1): BMod => ({ add, H }) => {
  for (let i = 0; i < n; i++) add(P('head', 'cyl', [0.05 * H * k, 0.17 * H * k, 0.09 * H * k], [0, 0.24 * H + 0.05 * H * k, -0.02 * H - i * 0.025 * H * k], c, { taper: 0, srot: [-20 - i * 25, 0, 0], layer: 1 }));
};
const headC = (c: string): BMod => ({ g }) => void (g('head').color = col(c, c));
const headK = (k: number): BMod => ({ g }) => void (g('head').size = mul(g('head').size, k));
const chestC = (c: string, k = 1): BMod => ({ add, H }) => add(P('body', 'ball', [0.34 * H, 0.3 * H * k, 0.24 * H], [0, -0.04 * H, 0.15 * H], c, { noInk: true, layer: 3 }));
const throat = (c: string): BMod => ({ add, H }) => add(P('head', 'ball', [0.17 * H, 0.1 * H, 0.12 * H], [0, 0.03 * H, 0.06 * H], c, { noInk: true, layer: 3 }));
const beakK = (k: number, c?: string): BMod => ({ g }) => {
  const b = g('beak');
  b.size = mul(b.size, k);
  if (b.off) b.off = mul(b.off, k);
  if (c) b.color = col(c, c);
};
const needle = (len: number, c?: string, droop = 0): BMod => ({ g, H }) => {
  const b = g('beak');
  b.size = [0.035 * H, len * H, 0.035 * H];
  b.off = [0, len * H * 0.5 - 0.02 * H, 0];
  b.segs = undefined;
  b.rot = [90 + droop, 0, 0];
  if (c) b.color = col(c, c);
};
const hook = (c: string, z = 0.27, y = 0.08, k = 1): BMod => ({ add, H }) => add(P('head', 'cyl', [0.06 * H * k, 0.09 * H * k, 0.06 * H * k], [0, y * H, z * H], c, { taper: 0, srot: [155, 0, 0], layer: 3 }));
const faceMask = (c: string): BMod => ({ add, H }) => add(P('head', 'ball', [0.2 * H, 0.11 * H, 0.1 * H], [0, 0.1 * H, 0.1 * H], c, { noInk: true, layer: 3 }));
const cheeks = (c: string, k = 1): BMod => ({ add, H }) => {
  for (const s of [1, -1]) add(P('head', 'ball', [0.03 * H, 0.06 * H * k, 0.07 * H * k], [s * 0.112 * H, 0.08 * H, 0.04 * H], c, { noInk: true, layer: 4 }));
};
const wingK = (k: number, c?: string): BMod => ({ g }) => {
  for (const n of ['wingL', 'wingR']) {
    const w = g(n);
    const z = w.size[2];
    w.size = [w.size[0], w.size[1], z * k];
    if (w.off) w.off = [w.off[0], w.off[1], w.off[2] - z * (k - 1) * 0.42];
    if (c) w.color = col(c, c);
  }
};
const flatBill = (c: string): BMod => ({ g, H }) => {
  const b = g('beak');
  Object.assign(b, { taper: 0.75, segs: undefined, size: [0.11 * H, 0.15 * H, 0.045 * H], off: [0, 0.07 * H, 0], at: [0, 0.085 * H, 0.1 * H], color: col(c, c) });
};
const ring = (c: string): BMod => ({ add, H }) => add(P('head', 'torus', [0.19 * H, 0.19 * H, 0.03 * H], [0, 0.0, 0], c, { srot: [90, 0, 0], tube: 0.2, noInk: true, layer: 3 }));

interface WO {
  h: number;
  color: string;
  neck?: string;
  head?: string;
  wing?: string;
  tail?: string;
  beak: string;
  legs: string;
  legL: number;
  body?: Vec3;
  bend?: number;
  fwd?: number;
  beakL: number;
  neckW?: number;
  legW?: number;
  headS?: number;
  bent?: string;
}
/** A long-legged, long-necked bird (cranes, herons, flamingos, emus, geese) built from solids. */
const wader = (key: string, o: WO): M => {
  const h = o.h;
  const [bw, bh, bl] = mul(o.body ?? [0.17, 0.17, 0.34], h);
  const ll = o.legL * h, by = ll + bh * 0.4, bz = -0.04 * h, lx = bw * 0.22, lw = (o.legW ?? 0.022) * h;
  const hr = 0.045 * h * (o.headS ?? 1), hy = h - hr, hz = bz + bl * 0.4 + (o.fwd ?? 0.05) * h;
  const nb: Vec3 = [0, by + bh * 0.28, bz + bl * 0.36];
  const mid: Vec3 = [0, (nb[1] + hy) / 2, (nb[2] + hz) / 2 - (o.bend ?? 0) * h];
  const nw = (o.neckW ?? 0.045) * h, nc = o.neck ?? o.color, b = o.beakL * h;
  const f = m(key, { view: 'side', rig: 'bird' });
  f.pair((s) => {
    const n = s > 0 ? 'legL' : 'legR';
    const knee: Vec3 = [s * lx, ll * 0.5, bz - 0.035 * h];
    f.rod([s * lx, by, bz], knee, lw, o.legs, { name: n, pivot: [s * lx, by, bz] })
      .rod(knee, [s * lx, lw * 0.5, bz + 0.005 * h], lw * 0.9, o.legs, { parent: n })
      .box([0.055 * h, 0.012 * h, 0.1 * h], [s * lx, 0.006 * h, bz + 0.04 * h], { color: o.legs, round: 0.8, parent: n });
  });
  f.ball([bw, bh, bl], [0, by, bz], { color: o.color, rot: [-8, 0, 0], name: 'body' })
    .ball([bw * 0.5, bh * 0.42, bl * 0.42], [0, by + bh * 0.12, bz - bl * 0.47], { color: o.tail ?? o.color, rot: [-25, 0, 0], name: 'tail' })
    .pair((s) => f.ball([bw * 0.24, bh * 0.72, bl * 0.86], [s * bw * 0.42, by + bh * 0.06, bz - bl * 0.06], { color: o.wing ?? o.color, rot: [6, 0, 0], name: s > 0 ? 'wingL' : 'wingR', pivot: [s * bw * 0.4, by + bh * 0.3, bz + bl * 0.25] }))
    .rod(nb, mid, nw, nc)
    .rod(mid, [0, hy, hz], nw * 0.85, nc)
    .ball([hr * 1.7, hr * 1.85, hr * 2.3], [0, hy, hz + hr * 0.2], { color: o.head ?? nc, name: 'head' })
    .pair((s) => f.ball(hr * 0.42, [s * hr * 0.68, hy + hr * 0.25, hz + hr * 0.75], { color: '#1d1a17', eye: true, parent: 'head' }));
  if (o.bent)
    f.cyl([hr * 0.66, b * 0.5, hr * 0.56], [0, hy - hr * 0.1, hz + hr * 1.2 + b * 0.22], { color: o.beak, rot: [100, 0, 0], taper: 0.85, parent: 'head' })
      .cone([hr * 0.56, b * 0.55, hr * 0.5], [0, hy - hr * 0.1 - b * 0.28, hz + hr * 1.2 + b * 0.6], { color: o.bent, rot: [150, 0, 0], parent: 'head' });
  else f.cone([hr * 0.6, b, hr * 0.5], [0, hy - hr * 0.1, hz + hr * 1.2 + b * 0.45], { color: o.beak, rot: [90, 0, 0], parent: 'head' });
  return f;
};

/* ----- fish, whales, sharks ----- */

interface WhaleOpts {
  belly?: string;
  fin?: number;
  finZ?: number;
  flip?: number;
  flipC?: string;
  beak?: boolean;
  melon?: number;
  dots?: string;
  grooves?: string;
  bumps?: string;
}
/** Whales and dolphins: the shark-shaped fish with horizontal flukes, flippers and a snout or a melon. */
const whale = (key: string, L: number, color: string, o: WhaleOpts = {}): Figure =>
  fish(key, {
    length: L,
    color,
    belly: o.belly,
    fin: color,
    shape: 'shark',
    extras: (p, d) => {
      const { H, W } = d;
      const t = get(p, 'tail');
      if (t) Object.assign(t, { size: [W * 3.3, L * 0.24, L * 0.035], segs: undefined });
      const df = get(p, 'dorsal');
      if (df) {
        if (o.fin === 0) cut(p.list, ['dorsal']);
        else {
          df.size = [df.size[0] * (o.fin ?? 1), df.size[1] * (o.fin ?? 1), df.size[2]];
          if (o.finZ !== undefined) df.at = [0, H * 0.4, L * o.finZ];
        }
      }
      both(p, 'fin', (q) => {
        q.size = [L * 0.025, H * 0.45 * (o.flip ?? 1), L * 0.1 * Math.min(1.6, o.flip ?? 1)];
        q.off = [0, -H * 0.2 * (o.flip ?? 1), 0];
        if (o.flipC) q.color = col(o.flipC, o.flipC);
      });
      both(p, 'eye', (q, s) => void (q.at = [s * W * 0.4, -H * 0.06, L * 0.24]));
      if (o.beak) {
        p.add(P('body', 'capsule', [W * 0.34, L * 0.17, W * 0.28], [0, -H * 0.12, L * 0.4], color, { srot: [90, 0, 0], layer: 1 }));
        p.add(P('body', 'ball', [W * 0.86, H * 0.72, L * 0.22], [0, H * 0.08, L * 0.29], color, { layer: 1 }));
      }
      if (o.melon) p.add(P('body', 'ball', [W * 0.94, H * 0.9 * o.melon, L * 0.3], [0, H * 0.06, L * 0.32], color, { layer: 1 }));
      if (o.dots) for (let i = 0; i < 10; i++) for (const s of [1, -1]) p.add(P('body', 'ball', [L * 0.004, H * 0.1, L * 0.035], [s * W * 0.43, H * (((i * 0.37) % 0.4) - 0.05), L * (0.22 - i * 0.045)], o.dots, { noInk: true, layer: 3 }));
      if (o.grooves) for (let i = 0; i < 4; i++) p.add(P('body', 'capsule', [W * 0.9, L * 0.22, L * 0.012], [0, -H * (0.2 + i * 0.07), L * 0.2], o.grooves, { srot: [90, 0, 0], noInk: true, layer: 3 }));
      if (o.bumps) for (let i = 0; i < 6; i++) p.add(P('body', 'ball', [L * 0.02, L * 0.02, L * 0.02], [((i % 2) - 0.5) * W * 0.3, H * 0.34, L * (0.36 - i * 0.025)], o.bumps, { layer: 3 }));
      p.add(P('body', 'ball', [W * 0.12, H * 0.06, L * 0.03], [0, H * 0.47, L * 0.18], '#2a2a2e', { noInk: true, layer: 3 }));
    },
  });
/** Sharks: a pointed snout, a toothy mouth and gill slits. */
const shark = (key: string, L: number, color: string, more?: FX): Figure =>
  fish(key, {
    length: L,
    color,
    belly: '#f2f0ea',
    fin: color,
    shape: 'shark',
    extras: (p, d) => {
      const { H, W } = d;
      p.add(P('body', 'ball', [W * 0.62, H * 0.56, L * 0.3], [0, H * 0.06, L * 0.32], color, { layer: 1 }));
      p.add(P('body', 'ball', [W * 0.72, H * 0.12, L * 0.12], [0, -H * 0.2, L * 0.29], '#5a2a2e', { noInk: true, layer: 4 }));
      for (const s of [1, -1]) {
        for (let i = 0; i < 3; i++) p.add(P('body', 'cyl', [L * 0.012, H * 0.08, L * 0.012], [s * W * 0.26, -H * 0.16, L * (0.25 + i * 0.022)], '#fffaf0', { taper: 0, srot: [180, 0, 0], layer: 5 }));
        for (let i = 0; i < 3; i++) p.add(P('body', 'ball', [L * 0.008, H * 0.34, L * 0.012], [s * W * 0.45, -H * 0.02, L * (0.2 - i * 0.035)], '#3a4048', { noInk: true, layer: 4 }));
      }
      more?.(p, d);
    },
  });

/** Bands round a fish's body (clownfish, angelfish): thin slices of a slightly larger body. */
const bands = (c: string, zs: number[], k = 0.06): FX => (p, { L, H, W }) => {
  for (const z of zs) {
    const f = Math.sqrt(Math.max(0.05, 1 - (z / 0.39) ** 2));
    p.add(P('body', 'ball', [W * 1.04 * f, H * 1.02 * f, L * k], [0, 0, L * z], c, { noInk: true, layer: 3 }));
  }
};
const fx = (...fs: FX[]): FX => (p, d) => fs.forEach((f) => f(p, d));

/* ----- apes: a furry person with a muzzle and big ears ----- */

const ape = (key: string, h: number, fur: string, face: string, build: number, ...acc: Extra[]): Figure =>
  who(key, {
    h,
    skin: face,
    hair: fur,
    style: 'short',
    top: fur,
    bottom: fur,
    shoes: face,
    long: true,
    build,
    blush: face,
    eyes: '#2a1a10',
    acc: [
      (p, d) => p.add(P('head', 'ball', [d.headW * 0.72, d.headH * 0.5, d.headD * 0.55], [0, d.headY - d.headH * 0.22, d.headD * 0.38], face, { layer: 4 })),
      (p, d) => both(p, 'ear', (q, s) => Object.assign(q, { at: [s * d.headW * 0.6, d.headY, -d.headD * 0.04], size: [d.headW * 0.4, d.headH * 0.46, d.headD * 0.14] })),
      (p, d) => p.add(P('head', 'box', [d.headW * 0.86, d.headH * 0.12, d.headD * 0.2], [0, d.headY + d.headH * 0.14, d.headD * 0.36], fur, { round: 0.8, layer: 4 })),
      ...acc,
    ],
  });

/* ----- bugs ----- */

const bugEyes = (c: string, k: number): BX => (p) =>
  both(p, 'eye', (q) => {
    q.size = mul(q.size, k);
    q.color = col(c, c);
  });
const feelers = (k: number, c?: string): BX => (p, { L }) =>
  both(p, 'antenna', (q, s) => {
    q.size = [0.012 * L, 0.3 * L * k, 0.012 * L];
    q.off = [0, 0.14 * L * k, 0];
    q.rot = [-68, 0, -s * 22];
    if (c) q.color = col(c, c);
  });
/** Wings folded flat along the back (crickets, grasshoppers, cicadas). */
const fold = (c?: string, k = 1, tent = 12): BX => (p, { L }) =>
  both(p, 'wing', (q, s) => {
    q.at = [s * 0.04 * L, 0.13 * L, 0];
    q.rot = [-6, 0, s * tent];
    q.size = [0.17 * L, 0.02 * L, 0.62 * L * k];
    q.off = [s * 0.04 * L, 0, -0.28 * L * k];
    if (c) q.color = col(c, c);
  });
/** Hard wing cases over the abdomen (beetles). */
const elytra = (c: string, k = 1, pron?: string): BX => (p, { L }) => {
  cut(p.list, ['wingL', 'wingR']);
  for (const s of [1, -1]) p.add(P('abdomen', 'ball', [0.21 * L, 0.34 * L, 0.52 * L * k], [s * 0.094 * L, 0.035 * L, -0.17 * L * k], c, { layer: 3 }));
  p.add(P('body', 'ball', [0.32 * L, 0.24 * L, 0.2 * L], [0, 0.04 * L, 0.02 * L], pron ?? c, { layer: 2 }));
};
/** Ant: big head, small thorax, a waist before the abdomen. */
const antBody = (c: string, ab: string): BX =>
  bx(partC('head', c, [1.3, 1.2, 1.25]), partC('body', c, [0.6, 0.7, 1.1]), partC('abdomen', ab, [0.78, 0.78, 0.75]), (p, { L }) => {
    const a = get(p, 'abdomen'), h = get(p, 'head');
    if (a) a.at = [0, 0.05 * L, -0.24 * L];
    if (h) h.at = [0, 0.05 * L, 0.18 * L];
    p.add(P('body', 'ball', [0.1 * L, 0.1 * L, 0.14 * L], [0, 0.03 * L, -0.19 * L], c, { layer: 1 }));
  });
/** Big jumping back legs. */
const hindLegs = (c: string, k = 1): BX => (p, { L }) => {
  for (const s of [1, -1]) {
    const hip: Vec3 = [s * 0.12 * L, -0.02 * L, -0.06 * L], knee: Vec3 = [s * 0.17 * L, 0.2 * L * k, -0.34 * L * k], foot: Vec3 = [s * 0.2 * L, -0.33 * L, -0.4 * L * k];
    p.add(rodP('body', hip, knee, 0.08 * L, c, { layer: 3 }));
    p.add(rodP('body', knee, foot, 0.035 * L, c, { layer: 3 }));
  }
};
const partC = (name: string, c: string, k?: Vec3): BX => (p) => {
  const q = get(p, name);
  if (q) {
    q.color = col(c, c);
    if (k) q.size = [q.size[0] * k[0], q.size[1] * k[1], q.size[2] * k[2]];
  }
};
const bx = (...fs: BX[]): BX => (p, d) => fs.forEach((f) => f(p, d));

const harness = (c: string): AniExtra => (p, d) => {
  const [L, H, W] = d.body;
  for (const z of [0.17, -0.02]) p.add(P('body', 'torus', [W * 1.06, H * 1.04, L * 0.06], [0, 0, L * z], c, { tube: 0.12, layer: 4 }));
  p.add(P('body', 'torus', [W * 0.7, H * 1.0, W * 0.1], [0, H * 0.72, L * 0.1], c, { srot: [-20, 0, 0], tube: 0.15, layer: 4 }));
};

/* ----- odd shapes built from solids ----- */

/** Kangaroo standing on its big feet, leaning on its tail; kh enlarges the head (a joey). */
const roo = (key: string, k: number, kh: number, c: string): Figure => {
  const S = (v: Vec3): Vec3 => mul(v, k);
  const hc: Vec3 = [0, 1.18, 0.24];
  const Hd = (v: Vec3): Vec3 => mul([hc[0] + (v[0] - hc[0]) * kh, hc[1] + (v[1] - hc[1]) * kh, hc[2] + (v[2] - hc[2]) * kh], k);
  const hs = k * kh, pale = '#ecd6b8';
  const f = m(key, { view: 'side', rig: 'quad' });
  f.pair((s) =>
    f.box(S([0.1, 0.07, 0.44]), S([s * 0.12, 0.035, 0.1]), { color: c, round: 0.8 })
      .ball(S([0.2, 0.44, 0.42]), S([s * 0.13, 0.3, -0.02]), { color: c, rot: [15, 0, 0] })
      .rod(S([s * 0.13, 0.95, 0.24]), S([s * 0.11, 0.78, 0.34]), 0.06 * k, c)
      .ball(0.06 * k, S([s * 0.11, 0.76, 0.35]), { color: c }),
  );
  f.ball(S([0.4, 0.78, 0.42]), S([0, 0.68, 0.06]), { color: c, rot: [18, 0, 0], name: 'body' })
    .ball(S([0.3, 0.48, 0.24]), S([0, 0.58, 0.19]), { color: pale, rot: [18, 0, 0], noInk: true })
    .rod(S([0, 0.42, -0.14]), S([0, 0.13, -0.6]), 0.14 * k, c, { name: 'tail', pivot: S([0, 0.42, -0.14]) })
    .rod(S([0, 0.13, -0.6]), S([0, 0.05, -0.9]), 0.08 * k, c, { parent: 'tail' })
    .ball(mul([0.2, 0.2, 0.26], hs), Hd([0, 1.18, 0.24]), { color: c, name: 'head' })
    .ball(mul([0.12, 0.12, 0.18], hs), Hd([0, 1.14, 0.38]), { color: c, parent: 'head' })
    .ball(mul([0.06, 0.04, 0.04], hs), Hd([0, 1.17, 0.47]), { color: '#2a2420', parent: 'head', noInk: true })
    .pair((s) =>
      f.cone(mul([0.08, 0.2, 0.04], hs), Hd([s * 0.06, 1.36, 0.17]), { color: c, rot: [-12, 0, -s * 14], parent: 'head' })
        .cone(mul([0.045, 0.13, 0.02], hs), Hd([s * 0.062, 1.35, 0.185]), { color: '#e8b0a0', rot: [-12, 0, -s * 14], parent: 'head', noInk: true })
        .ball(mul([0.04, 0.045, 0.03], hs), Hd([s * 0.075, 1.22, 0.33]), { color: '#1d1a17', eye: true, parent: 'head' }),
    );
  return f.done();
};

/** Small round-bodied creature segments in a row (caterpillars). */
const caterpillar = (key: string, L: number, c1: string, c2: string, head: string): Figure => {
  const n = 8, d = L / 7.5;
  const f = m(key, { view: 'side', rig: 'bug' });
  f.each(n, (i) => {
    const z = L * 0.38 - i * d * 0.95;
    f.ball([d * 1.15, d * 1.2, d * 1.05], [0, d * 0.62 + (i % 2) * d * 0.06, z], { color: i % 2 ? c2 : c1 })
      .pair((s) => f.ball(d * 0.3, [s * d * 0.32, d * 0.14, z], { color: '#3a3a2a', noInk: true }))
      .pair((s) => f.ball(d * 0.18, [s * d * 0.54, d * 0.75, z], { color: '#f8e04a', noInk: true }));
  });
  f.ball([d * 1.2, d * 1.2, d * 1.1], [0, d * 0.8, L * 0.38 + d * 0.8], { color: head, name: 'head' })
    .pair((s) =>
      f.ball(d * 0.32, [s * d * 0.3, d * 1.0, L * 0.38 + d * 1.25], { color: '#1d1a17', eye: true })
        .rod([s * d * 0.25, d * 1.3, L * 0.38 + d * 0.9], [s * d * 0.45, d * 2.0, L * 0.38 + d * 1.2], d * 0.12, '#2a2420')
        .ball(d * 0.22, [s * d * 0.45, d * 2.05, L * 0.38 + d * 1.22], { color: '#2a2420' }),
    );
  return f.done();
};

/* ----- the entries ------------------------------------------------------------------------------------------- */

export const ENTRIES: CatalogEntry[] = [
  e('adder', 'wild', 'reptiles', () => snake('adder', { length: 0.65, color: '#9a8a62', bands: '#3a2e22', girth: 0.07 })),
  e('akita', 'pets', 'dog breeds', () =>
    dog('akita', 0.95, { color: '#d9894a', belly: '#f4ead8', head: [0.25, 0.21, 0.22], snout: { len: 0.11, h: 0.1, w: 0.12, color: '#f4ead8' }, ears: 'pointy', earSize: 0.1, tail: 'curl', tailAngle: 40 }, bib('#f4ead8'), hp('#f4ead8', [0.8, 0.4, 0.5], [0, -0.06, 0.34]), tailK(1.8)),
  ),
  e('albatross', 'aviary', 'seabirds', () => bd('albatross', { height: 0.85, color: '#f6f6f2', wing: '#3a3a3e', beak: '#f2c48a', legs: '#e8b4a8', tail: ['#4a4a50'] }, beakK(1.5), hook('#f2c48a'), wingK(1.15, '#4a4a50'))),
  e('alligator', 'wild', 'reptiles', () =>
    lizard('alligator', { color: '#3e4a32', body: [1.5, 0.38, 0.55], legL: 0.12, legW: 0.12, head: [0.35, 0.17, 0.3], snout: { len: 0.55, h: 0.12, w: 0.25, shape: 'box' }, tail: 1.1, tailW: 0.55, belly: '#d8d0a8' }, tailRidge(9, '#2e3826'), backRidge(6, '#2e3826', 0.7), teeth(6), eyesUp('#3e4a32')),
  ),
  e('anaconda', 'wild', 'reptiles', () => snake('anaconda', { length: 6, color: '#5a6a2a', bands: '#2a2e18', girth: 0.075 })),
  e('angelfish', 'sea', 'reef fish', () =>
    fish('angelfish', {
      length: 0.15,
      color: '#ece4c4',
      fin: '#ddd2a8',
      shape: 'tall',
      extras: fx(bands('#2a2420', [0.2, 0.02, -0.16], 0.08), (p, { L, H }) => {
        const df = get(p, 'dorsal');
        if (df) Object.assign(df, { size: [L * 0.32, H * 0.75, L * 0.02], rot: [-40, 0, 0], off: [0, H * 0.3, 0] });
        p.add(P('body', 'cyl', [L * 0.32, H * 0.75, L * 0.02], [0, -H * 0.42, -L * 0.02], '#ddd2a8', { taper: 0, segs: 3, rot: [220, 0, 0], srot: [0, 90, 0], off: [0, H * 0.3, 0], layer: -1 }));
      }),
    }),
  ),
  e('anglerfish', 'sea', 'deep sea', () =>
    fish('anglerfish', {
      length: 0.3,
      color: '#4a3a40',
      fin: '#3a2a30',
      shape: 'round',
      extras: (p, { L, H, W }) => {
        p.add(P('body', 'ball', [W * 1.3, H * 0.95, L * 0.4], [0, H * 0.02, L * 0.2], '#4a3a40', { layer: 1 }));
        p.add(P('body', 'ball', [W * 1.0, H * 0.32, L * 0.16], [0, -H * 0.12, L * 0.36], '#1a1012', { noInk: true, layer: 4 }));
        for (let i = 0; i < 5; i++)
          for (const [y, r] of [[-0.0, 180], [-0.26, 0]] as Array<[number, number]>)
            p.add(P('body', 'cyl', [L * 0.018, H * 0.12, L * 0.018], [W * (i - 2) * 0.2, H * y, L * (0.42 - Math.abs(i - 2) * 0.02)], '#fffaf0', { taper: 0, srot: [r, 0, 0], layer: 5 }));
        p.add(rodP('body', [0, H * 0.45, L * 0.22], [0, H * 1.0, L * 0.4], L * 0.015, '#5a4a4a'));
        p.add(rodP('body', [0, H * 1.0, L * 0.4], [0, H * 0.88, L * 0.52], L * 0.015, '#5a4a4a'));
        p.add(P('body', 'ball', [L * 0.08, L * 0.08, L * 0.08], [0, H * 0.84, L * 0.53], '#f8f0a0', { role: 'glow', layer: 5 }));
      },
    }),
  ),
  e('ankylosaurus', 'wild', 'dinosaurs', () =>
    bst(
      'ankylosaurus',
      { color: '#8a7a50', body: [3.0, 1.0, 1.6], bodyShape: 'ball', legL: 0.45, legW: 0.32, neckL: 0.15, neckLean: 70, neckW: 0.6, head: [0.55, 0.4, 0.55], snout: { len: 0.15, h: 0.22, w: 0.35 }, ears: 'side', earSize: 0.01, tail: 'stub', belly: '#c8b888' },
      drop('earL', 'earR', 'tail'),
      ani.shell('#6a5a3a'),
      ltail(1.0, 0.3, -4),
      (p, d) => {
        const [L, H, W] = d.body;
        const t = get(p, 'tail');
        if (t) p.add(P('tail', 'ball', [W * 0.5, H * 0.42, L * 0.2], [0, 0, -L * 0.98], '#6a5a3a', { layer: 0 }));
        for (const s of [1, -1]) for (let i = 0; i < 5; i++) p.add(P('body', 'cyl', [W * 0.08, H * 0.32, W * 0.08], [s * W * 0.6, H * 0.12, L * (0.36 - i * 0.18)], '#e8dcc0', { taper: 0, srot: [0, 0, -s * 70], layer: 4 }));
        for (const s of [-0.25, 0, 0.25]) for (let i = 0; i < 4; i++) p.add(P('body', 'cyl', [W * 0.1, H * 0.2, W * 0.1], [s * W, H * 0.78 - Math.abs(s) * H * 0.5, L * (0.3 - i * 0.2)], '#e8dcc0', { taper: 0, segs: 4, layer: 4 }));
      },
      hp2('#6a5a3a', [0.18, 0.3, 0.18], [0.42, 0.45, -0.2], { ...solid, taper: 0 }, 'cyl'),
    ),
  ),
  e('ant', 'bugs', 'ants', () => bug('ant', { length: 0.015, color: '#2a2220', wings: 'none', extras: antBody('#2a2220', '#2a2220') })),
  e('anteater', 'wild', 'jungle', () =>
    bst(
      'anteater',
      { color: '#7d6e5e', body: [1.1, 0.5, 0.32], legL: 0.32, legW: 0.09, neckL: 0.15, neckLean: 55, neckW: 0.22, head: [0.25, 0.14, 0.13], snout: { len: 0.42, h: 0.07, w: 0.07, shape: 'cyl' }, ears: 'side', earSize: 0.06, tail: 'fluffy', tailAngle: 120, tailColor: '#5a4e42' },
      tailK(1.3),
      bp('#f2ece0', [1.06, 0.42, 0.22], [0, 0.04, 0.26], { srot: [40, 0, 0] }),
      bp('#1e1c1a', [1.07, 0.3, 0.16], [0, 0.06, 0.24], { srot: [40, 0, 0], layer: 4 }),
      socks('#f2ece0'),
    ),
  ),
  e('antelope', 'wild', 'savanna', () =>
    bst('antelope', sc({ ...DEER, color: '#c8864a', belly: WH, snout: { len: 0.12, h: 0.11, w: 0.11, color: '#a86a3a' } }, 0.9), ani.horns('#2a2420', 'goat'), tailK(0.8), bp2('#5a3a24', [0.03, 0.1, 0.45], [0.48, -0.1, 0])),
  ),
  e('arctic fox', 'wild', 'polar', () =>
    bst('arctic fox', { ...FOX, color: '#f4f4f2', legColor: '#eaeae8', earColor: '#e8e8e6', belly: undefined, body: [0.5, 0.26, 0.24], snout: { len: 0.09, h: 0.06, w: 0.07, color: '#f4f4f2' }, earSize: 0.065 }, tailK(1.15)),
  ),
  e('armadillo', 'wild', 'desert', () =>
    bst(
      'armadillo',
      { color: '#c9a88a', body: [0.4, 0.2, 0.2], bodyShape: 'ball', legL: 0.05, legW: 0.04, neckL: 0.03, neckLean: 70, neckW: 0.08, head: [0.1, 0.07, 0.07], snout: { len: 0.08, h: 0.035, w: 0.035, shape: 'cyl' }, ears: 'pointy', earSize: 0.04, tail: 'long', tailAngle: 165, tailColor: '#9a8270' },
      ani.shell('#9a8270'),
      (p, d) => {
        const [L, H, W] = d.body;
        for (const z of [-0.15, -0.05, 0.05, 0.15]) {
          const f = Math.sqrt(1 - (z / 0.55) ** 2);
          p.add(P('body', 'torus', [W * 1.27 * f, H * 1.12 * f, L * 0.04], [0, H * 0.25, L * z], '#7a6450', { tube: 0.1, layer: 4, noInk: true }));
        }
      },
      hp('#9a8270', [0.9, 0.4, 0.7], [0, 0.45, 0.1], solid),
    ),
  ),
  e('baboon', 'wild', 'savanna', () =>
    bst(
      'baboon',
      { color: '#8a7a56', body: [0.75, 0.4, 0.32], legL: 0.38, legW: 0.08, neckL: 0.1, neckLean: 45, neckW: 0.18, head: [0.22, 0.2, 0.2], snout: { len: 0.17, h: 0.11, w: 0.11, color: '#4a3e36' }, ears: 'side', earSize: 0.05, tail: 'long', tailAngle: 105 },
      ani.mane('#7a6a48'),
      ruff('#9a8a62', 0.8),
      hp('#6a5a40', [0.8, 0.18, 0.4], [0, 0.42, 0.32], solid, 'box'),
      bp('#d87a7a', [0.5, 0.4, 0.12], [0, -0.05, -0.46], { layer: -1 }),
    ),
  ),
  e('badger', 'wild', 'forest', () => bst('badger', BADGER, hp2(BK, [0.2, 0.45, 0.85], [0.24, 0.22, 0.12]), roundEars())),
  e('badger cub', 'wild', 'forest', () => bst('badger cub', baby(BADGER, 0.5), hp2(BK, [0.2, 0.45, 0.85], [0.24, 0.22, 0.12]), roundEars())),
  e('barracuda', 'sea', 'ocean fish', () =>
    fish('barracuda', {
      length: 1.2,
      color: '#a8b4bc',
      belly: '#eef2f4',
      fin: '#7a8890',
      shape: 'long',
      extras: (p, { L, H, W }) => {
        p.add(P('body', 'cyl', [W * 0.5, L * 0.14, H * 0.5], [0, -H * 0.05, L * 0.42], '#a8b4bc', { taper: 0.25, srot: [90, 0, 0], layer: 1 }));
        for (let i = 0; i < 4; i++) p.add(P('body', 'cyl', [L * 0.008, H * 0.14, L * 0.008], [0, -H * 0.2, L * (0.38 + i * 0.02)], '#fffaf0', { taper: 0, srot: [180, 0, 0], layer: 4 }));
      },
    }),
  ),
  e('bass (fish)', 'sea', 'freshwater fish', () =>
    fish('bass (fish)', {
      length: 0.45,
      color: '#6a8a4a',
      belly: '#e8e4c8',
      fin: '#5a7a40',
      extras: (p, { L, H, W }) => {
        for (const s of [1, -1]) p.add(P('body', 'ball', [L * 0.012, H * 0.18, L * 0.6], [s * W * 0.46, H * 0.02, -L * 0.04], '#3a5a2a', { noInk: true, layer: 3 }));
        p.add(P('body', 'ball', [W * 0.8, H * 0.22, L * 0.14], [0, -H * 0.1, L * 0.36], '#2a2a20', { noInk: true, layer: 4 }));
        const df = get(p, 'dorsal');
        if (df) df.size = [df.size[0] * 2, df.size[1] * 1.3, df.size[2]];
      },
    }),
  ),
  e('basset hound', 'pets', 'dog breeds', () =>
    dog('basset hound', 0.72, { color: '#c8843e', body: [0.85, 0.3, 0.3], legL: 0.1, legW: 0.1, neckL: 0.12, head: [0.28, 0.2, 0.18], snout: { len: 0.15, h: 0.12, w: 0.11, color: WH }, earSize: 0.3, earColor: '#a86a30', tailAngle: 35, belly: WH }, saddle(BK), socks(WH), tip(WH), blaze(WH), jowls(WH)),
  ),
  e('bat (animal)', 'wild', 'forest', () => {
    const c = '#5a4436', wc = '#3e302a';
    const f = m('bat (animal)', { rig: 'bird' });
    f.ball([0.05, 0.075, 0.045], [0, 0.11, 0], { color: c, name: 'body' })
      .ball([0.045, 0.042, 0.04], [0, 0.165, 0.005], { color: c, name: 'head' })
      .ball([0.022, 0.016, 0.02], [0, 0.157, 0.024], { color: '#7a5a48', parent: 'head' })
      .ball([0.012, 0.007, 0.006], [0, 0.161, 0.034], { color: '#2a2420', parent: 'head', noInk: true })
      .pair((s) =>
        f.cone([0.024, 0.045, 0.012], [s * 0.015, 0.197, 0], { color: c, rot: [0, 0, -s * 18], parent: 'head' })
          .ball([0.009, 0.01, 0.006], [s * 0.011, 0.172, 0.022], { color: '#1d1a17', eye: true, parent: 'head' })
          .wedge([0.1, 0.075, 0.006], [s * 0.07, 0.112, -0.004], { color: wc, rot: [0, 0, 180], name: s > 0 ? 'wingL' : 'wingR', pivot: [s * 0.022, 0.13, 0] })
          .wedge([0.09, 0.065, 0.006], [s * 0.15, 0.12, -0.004], { color: wc, rot: [0, 0, 180], parent: s > 0 ? 'wingL' : 'wingR' })
          .rod([s * 0.02, 0.138, 0], [s * 0.2, 0.152, -0.004], 0.007, c, { parent: s > 0 ? 'wingL' : 'wingR' })
          .rod([s * 0.012, 0.08, 0], [s * 0.016, 0.06, 0.004], 0.006, '#2a2420'),
      );
    return f.done();
  }),
  e('beagle', 'pets', 'dog breeds', () =>
    dog('beagle', 0.58, { color: '#c8843e', belly: WH, snout: { len: 0.12, h: 0.1, w: 0.11, color: WH }, earSize: 0.16, earColor: '#a86a30', tailAngle: 40 }, saddle(BK), socks(WH), tip(WH), blaze(WH)),
  ),
  e('bear', 'wild', 'forest', () => bst('bear', BEAR, roundEars('#5a3a20'), bp('#7a4e2c', [0.6, 0.5, 0.35], [0, 0.32, 0.18], solid))),
  e('beaver', 'wild', 'rivers', () =>
    bst(
      'beaver',
      BEAVER,
      drop('tail'),
      (p, d) => {
        const [L, H, W] = d.body;
        p.add(P('body', 'box', [W * 0.62, H * 0.1, L * 0.55], [0, -H * 0.34, -L * 0.66], '#3a2e2a', { name: 'tail', round: 0.9, srot: [-8, 0, 0], layer: -1 }));
      },
      hp('#f6ecc8', [0.22, 0.2, 0.06], [0, -0.48, 0.55], solid, 'box'),
      roundEars(),
    ),
  ),
  e('beaver pup', 'wild', 'rivers', () =>
    bst(
      'beaver pup',
      baby(BEAVER, 0.45),
      drop('tail'),
      (p, d) => {
        const [L, H, W] = d.body;
        p.add(P('body', 'box', [W * 0.55, H * 0.1, L * 0.42], [0, -H * 0.34, -L * 0.6], '#3a2e2a', { name: 'tail', round: 0.9, layer: -1 }));
      },
      roundEars(),
    ),
  ),
  e('bed bug', 'bugs', 'pests', () => bug('bed bug', { length: 0.012, color: '#8a3a20', wings: 'none', extras: bx(partC('abdomen', '#8a3a20', [1.5, 0.55, 1.15]), partC('body', '#7a3018', [1.1, 0.7, 1])) })),
  e('bee', 'bugs', 'bees and wasps', () => bug('bee', { length: 0.02, color: '#f2c62a', stripes: '#2a2420', wings: 'clear' })),
  e('beetle', 'bugs', 'beetles', () => bug('beetle', { length: 0.04, color: '#1e2a24', wings: 'none', extras: bx(elytra('#2a7a4a'), feelers(0.8)) })),
  e('beluga whale', 'sea', 'whales', () => whale('beluga whale', 4.5, '#eef2f4', { fin: 0, melon: 1.05, flip: 0.9 })),
  e('bird', 'aviary', 'songbirds', () => bd('bird', { height: 0.2, color: '#7a6a5a', wing: '#5e5044', beak: '#e8b020', legs: '#8a6a50', tail: ['#5e5044'] }, chestC('#e8743a'))),
  e('black bear', 'wild', 'forest', () => bst('black bear', sc({ ...BEAR, color: '#26221f', snout: { len: 0.16, h: 0.15, w: 0.17, color: '#b08a60' } }, 0.85), roundEars('#3a3430'))),
  e('black mamba', 'wild', 'reptiles', () => snake('black mamba', { length: 2.8, color: '#6a6a5e', girth: 0.04 })),
  e('black widow', 'bugs', 'spiders', () =>
    bug('black widow', {
      length: 0.035,
      color: '#1a1a1e',
      legs: 8,
      segments: 2,
      wings: 'none',
      antennae: false,
      extras: (p, { L }) => {
        const a = get(p, 'abdomen');
        if (a) a.size = [0.5 * L, 0.46 * L, 0.52 * L];
        for (let i = 0; i < 4; i++)
          both(p, `leg${i}`, (q, s) => {
            q.size = [q.size[0] * 1.2, 0.56 * L, q.size[2] * 1.2];
            q.off = [0, -0.25 * L, 0];
            q.rot = [0, s * (i - 1.5) * 32, -s * 64];
          });
        for (const r of [0, 180]) p.add(P('abdomen', 'cyl', [0.12 * L, 0.08 * L, 0.06 * L], [0, -0.1 * L + (r ? -0.04 : 0.04) * L, -0.4 * L], '#e0201a', { taper: 0, srot: [r + 20, 0, 0], layer: 4 }));
      },
    }),
  ),
  e('blackbird', 'aviary', 'songbirds', () =>
    bd('blackbird', { height: 0.25, color: '#1f1f24', wing: '#2a2a32', beak: '#f2a020', legs: '#3a3430', tail: ['#1f1f24'] }, ({ add, H }) => {
      for (const s of [1, -1]) add(P('head', 'torus', [0.07 * H, 0.07 * H, 0.015 * H], [s * 0.093 * H, 0.16 * H, 0.06 * H], '#f2a020', { srot: [0, 90, 0], layer: 3, noInk: true }));
    }),
  ),
  e('bloodhound', 'pets', 'dog breeds', () =>
    dog('bloodhound', 0.95, { color: '#a8642e', head: [0.3, 0.22, 0.19], snout: { len: 0.17, h: 0.14, w: 0.12, color: '#8a4a22' }, earSize: 0.3, earColor: '#8a4a22', tailAngle: 60 }, saddle('#4a2a18', 0.9), jowls('#a8642e')),
  ),
  e('blowfish', 'sea', 'reef fish', () =>
    fish('blowfish', {
      length: 0.3,
      color: '#e8cf8a',
      belly: '#f6f0dc',
      fin: '#d8b870',
      extras: (p, { L }) => {
        const b = get(p, 'body');
        if (b) b.size = [0.6 * L, 0.6 * L, 0.7 * L];
        const bl = get(p, 'belly');
        if (bl) Object.assign(bl, { size: [0.56 * L, 0.42 * L, 0.6 * L], at: [0, -0.1 * L, 0.02 * L] });
        both(p, 'eye', (q, s) => Object.assign(q, { at: [s * 0.17 * L, 0.1 * L, 0.26 * L], size: [0.08 * L, 0.08 * L, 0.06 * L] }));
        both(p, 'fin', (q, s) => void (q.at = [s * 0.29 * L, -0.02 * L, 0.05 * L]));
        const df = get(p, 'dorsal');
        if (df) df.at = [0, 0.28 * L, -0.12 * L];
        p.add(P('body', 'ball', [0.08 * L, 0.06 * L, 0.05 * L], [0, -0.03 * L, 0.36 * L], '#e8a080', { layer: 3 }));
        const n = 34;
        for (let i = 0; i < n; i++) {
          const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
          if (y < -0.55) continue;
          const dir: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
          p.add(P('body', 'cyl', [0.035 * L, 0.08 * L, 0.035 * L], [dir[0] * 0.3 * L, dir[1] * 0.3 * L, dir[2] * 0.35 * L], '#c8a860', { taper: 0, srot: aim(dir), layer: 1 }));
          if (i % 3 === 0) p.add(P('body', 'ball', [0.05 * L, 0.05 * L, 0.05 * L], [dir[0] * 0.295 * L, dir[1] * 0.295 * L, dir[2] * 0.345 * L], '#8a6a3a', { noInk: true, layer: 3 }));
        }
      },
    }),
  ),
  e('blue jay', 'aviary', 'songbirds', () =>
    bd('blue jay', { height: 0.26, color: '#4a7fd0', wing: '#2f62c0', beak: '#2a2a2a', legs: '#3a3a3a', tail: ['#3a70d0', '#4a7fd0', '#3a70d0'] }, chestC('#e8ecf0'), throat('#eef0f4'), crest('#4a7fd0', 1.3), ring('#1e1e24')),
  ),
  e('blue whale', 'sea', 'whales', () => whale('blue whale', 15, '#5a7aa0', { belly: '#8aa4c0', fin: 0.35, finZ: -0.2, flip: 0.8, dots: '#7a98ba' })),
  e('boa', 'wild', 'reptiles', () => snake('boa', { length: 3, color: '#b89a70', bands: '#6a3a24', girth: 0.065 })),
  e('boar', 'wild', 'forest', () =>
    bst(
      'boar',
      { color: '#5a4636', body: [1.2, 0.65, 0.5], legL: 0.3, legW: 0.1, hoof: '#2a2420', neckL: 0.1, neckLean: 70, neckW: 0.4, head: [0.45, 0.35, 0.3], snout: { len: 0.22, h: 0.15, w: 0.15, shape: 'cyl', color: '#6a5446' }, nose: '#3a2a24', ears: 'pointy', earSize: 0.13, tail: 'tuft', tailAngle: 150 },
      backRidge(7, '#3a2a20', 0.8, 0.42, -0.2),
      hp2('#fffaf0', [0.07, 0.24, 0.07], [0.22, -0.18, 0.75], { ...solid, taper: 0, srot: [-20, 0, -25] }, 'cyl'),
    ),
  ),
  e('bobcat', 'wild', 'forest', () => bst('bobcat', sc({ ...CAT, color: '#b88a58', tail: 'stub', belly: '#f2e6d4', snout: { len: 0.035, h: 0.04, w: 0.06, color: '#f2e6d4' } }, 1.5), ani.spots('#5a3a24', 10), earTufts(BK), ruff('#d8b890', 0.7))),
  e('border collie', 'pets', 'dog breeds', () =>
    dog('border collie', 0.82, { color: '#24211f', belly: WH, snout: { len: 0.13, h: 0.09, w: 0.1, color: WH }, ears: 'pointy', earSize: 0.09, tail: 'fluffy', tailAngle: 140 }, bib(WH), blaze(WH), socks(WH), tip(WH)),
  ),
  e('boston terrier', 'pets', 'dog breeds', () =>
    dog('boston terrier', 0.55, { color: '#24211f', body: [0.55, 0.3, 0.27], legL: 0.3, head: [0.24, 0.22, 0.23], snout: { len: 0.05, h: 0.08, w: 0.1, color: WH }, ears: 'pointy', earSize: 0.14, tail: 'stub' }, bib(WH), blaze(WH), socks(WH)),
  ),
  e('brontosaurus', 'wild', 'dinosaurs', () =>
    bst(
      'brontosaurus',
      { color: '#7a9a6a', body: [4.5, 2.3, 2.0], bodyShape: 'ball', legL: 2.2, legW: 0.6, neckL: 4.6, neckLean: 38, neckW: 0.6, head: [0.8, 0.45, 0.45], snout: { len: 0.3, h: 0.3, w: 0.35 }, ears: 'side', earSize: 0.01, tail: 'stub', belly: '#c8d0a0' },
      drop('earL', 'earR', 'tail'),
      ltail(1.3, 0.4, -14),
      (p) => {
        const n = get(p, 'neck');
        if (n) p.add(P('neck', 'cyl', [n.size[0] * 2.2, n.size[1] * 0.4, n.size[0] * 2.2], [0, n.size[1] * 0.12, 0], n.color, { taper: 0.45, layer: 1 }));
      },
      ani.spots('#5a7a4e', 8),
    ),
  ),
  e('buffalo', 'wild', 'prairie', () =>
    bst('buffalo', BISON, bp('#6a4a2a', [0.95, 0.95, 0.55], [0, 0.32, 0.2], solid), hp('#5a3a22', [1.0, 0.5, 0.7], [0, 0.55, -0.05], solid), ani.horns('#2a2420', 'bull'), ani.beard('#3a2618')),
  ),
  e('buffalo calf', 'wild', 'prairie', () => bst('buffalo calf', baby({ ...BISON, color: '#a8642e', snout: { len: 0.15, h: 0.25, w: 0.3, color: '#5a3a24' } }, 0.45, 1.0))),
  e('bull', 'farm', 'cattle', () =>
    bst('bull', { ...COW, color: '#3e2c22', body: [2.0, 1.05, 0.9], neckW: 0.6, snout: { len: 0.2, h: 0.28, w: 0.34, color: '#5a4038' } }, ani.horns('#efe6d0', 'bull'), (p, d) => {
      const s = get(p, 'snout');
      const [hl, hh, hw] = d.head;
      if (s) p.add(P('head', 'torus', [hw * 0.32, hw * 0.32, hw * 0.06], [0, -hh * 0.42, hl * 0.35 + s.size[2] * 0.75], '#e8c040', { srot: [0, 0, 0], tube: 0.25, layer: 5 }));
    }),
  ),
  e('bull terrier', 'pets', 'dog breeds', () =>
    dog('bull terrier', 0.8, { color: '#f4f0ea', body: [0.62, 0.34, 0.32], legL: 0.27, legW: 0.1, neckW: 0.18, head: [0.32, 0.2, 0.17], snout: { len: 0.18, h: 0.15, w: 0.12 }, ears: 'pointy', earSize: 0.08, tailAngle: 135 }, hp('#2a2420', [0.3, 0.38, 0.34], [0.3, 0.3, 0.3])),
  ),
  e('bulldog', 'pets', 'dog breeds', () =>
    dog('bulldog', 0.62, { color: '#c8a078', body: [0.6, 0.38, 0.44], bodyShape: 'ball', legL: 0.16, legW: 0.13, neckL: 0.05, neckLean: 50, neckW: 0.26, head: [0.3, 0.27, 0.33], snout: { len: 0.05, h: 0.13, w: 0.2, color: WH }, ears: 'side', earSize: 0.08, tail: 'stub', belly: WH }, bib(WH), jowls(WH), blaze(WH), roundEars()),
  ),
  e('bunny', 'pets', 'small pets', () => bst('bunny', RABBIT, haunches(WH), pinkEars('#f2b4bc'), tailK(1.3))),
  e('butterfly', 'bugs', 'butterflies', () =>
    bug('butterfly', {
      length: 0.05,
      color: '#2a2420',
      wings: 'butterfly',
      wingColor: '#f08a1a',
      extras: (p, { L }) =>
        both(p, 'wing', (q, s) => {
          p.add(P(q.name, 'ball', [0.72 * L, 0.02 * L, 0.5 * L], [s * 0.3 * L, -0.002 * L, -0.42 * L], '#e87a12', { layer: 2 }));
          p.add(P(q.name, 'ball', [0.34 * L, 0.024 * L, 0.3 * L], [s * 0.8 * L, 0.001 * L, 0.06 * L], '#1e1a18', { noInk: true, layer: 4 }));
          p.add(P(q.name, 'ball', [0.3 * L, 0.024 * L, 0.2 * L], [s * 0.4 * L, -0.001 * L, -0.6 * L], '#1e1a18', { noInk: true, layer: 4 }));
          for (const k of [0.0, 0.12]) p.add(P(q.name, 'ball', [0.06 * L, 0.028 * L, 0.06 * L], [s * 0.86 * L, 0.002 * L, k * L], WH, { noInk: true, layer: 5 }));
        }),
    }),
  ),
  e('calf', 'farm', 'cattle', () => bst('calf', baby(COW, 0.55, 0.95), ani.spots('#2a2624', 7), hp(BK, [0.5, 0.6, 0.6], [0.2, 0.4, -0.05]))),
  e('calico', 'pets', 'cats', () =>
    bst('calico', sc({ ...CAT, color: WH, tailColor: '#e0883a' }, 0.78), bp('#e0883a', [1.04, 0.7, 0.38], [0, 0.2, -0.22]), bp(BK, [1.04, 0.6, 0.26], [0, 0.24, 0.16]), hp('#e0883a', [0.55, 0.6, 0.7], [0.26, 0.38, 0]), hp(BK, [0.5, 0.55, 0.6], [-0.26, 0.4, -0.05])),
  ),
  e('camel', 'wild', 'desert', () =>
    bst('camel', { color: '#c8a068', body: [1.7, 0.95, 0.72], legL: 1.15, legW: 0.15, hoofH: 0.1, neckL: 0.95, neckLean: 55, neckW: 0.25, head: [0.5, 0.26, 0.24], snout: { len: 0.2, h: 0.2, w: 0.18 }, ears: 'side', earSize: 0.1, tail: 'tuft', tailColor: '#8a6a40' }, ani.hump('#c09060'), ruff('#b8905a', 0.6)),
  ),
  e('canary', 'aviary', 'songbirds', () => bd('canary', { height: 0.13, color: '#f7d84a', wing: '#e8c030', beak: '#f2b48a', legs: '#e8a8a0', tail: ['#e8c030'] })),
  e('cardinal (bird)', 'aviary', 'songbirds', () => bd('cardinal (bird)', { height: 0.22, color: '#d42a2a', wing: '#b01e1e', beak: '#f08a30', legs: '#a86a5a', tail: ['#b01e1e'] }, crest('#d42a2a', 1.4), faceMask('#1e1a1a'), beakK(1.3))),
  e('caterpillar', 'bugs', 'crawlers', () => caterpillar('caterpillar', 0.08, '#7ac943', '#9ad85a', '#d8402a')),
  e('catfish', 'sea', 'freshwater fish', () =>
    fish('catfish', {
      length: 1.0,
      color: '#6a6a58',
      belly: '#e8e0c8',
      fin: '#5a5a48',
      shape: 'long',
      extras: (p, { L, H, W }) => {
        p.add(P('body', 'ball', [W * 1.3, H * 0.9, L * 0.26], [0, -H * 0.05, L * 0.3], '#6a6a58', { layer: 1 }));
        p.add(P('body', 'ball', [W * 1.0, H * 0.16, L * 0.06], [0, -H * 0.24, L * 0.42], '#3a3a30', { noInk: true, layer: 4 }));
        both(p, 'eye', (q, s) => void (q.at = [s * W * 0.52, H * 0.12, L * 0.34]));
        const wh: Array<[Vec3, Vec3]> = [
          [[W * 0.45, -H * 0.2, L * 0.41], [W * 1.7, -H * 0.8, L * 0.3]],
          [[W * 0.3, H * 0.05, L * 0.43], [W * 1.4, H * 0.3, L * 0.52]],
        ];
        for (const s of [1, -1]) for (const [a, b] of wh) p.add(rodP('body', [s * a[0], a[1], a[2]], [s * b[0], b[1], b[2]], L * 0.012, '#3a3a30'));
      },
    }),
  ),
  e('centipede', 'bugs', 'crawlers', () => {
    const c = '#a0462a', lc = '#d8843a', n = 12, d = 0.013;
    const f = m('centipede', { view: 'side', rig: 'bug' });
    f.each(n, (i) => {
      const z = 0.07 - i * d, x = 0.005 * Math.sin(i * 0.9);
      f.ball([0.02, 0.011, 0.016], [x, 0.008, z], { color: c }).pair((s) => f.rod([x + s * 0.007, 0.007, z], [x + s * 0.02, 0.001, z + 0.003], 0.003, lc));
    });
    f.ball([0.018, 0.011, 0.016], [0, 0.009, 0.085], { color: '#7a3018', name: 'head' }).pair((s) =>
      f.rod([s * 0.004, 0.011, 0.09], [s * 0.017, 0.018, 0.12], 0.0025, lc).ball(0.005, [s * 0.005, 0.013, 0.09], { color: '#1d1a17', eye: true }),
    );
    return f.done();
  }),
  e('chameleon', 'wild', 'reptiles', () =>
    bst(
      'chameleon',
      { color: '#5fb04a', body: [0.18, 0.1, 0.07], legL: 0.05, legW: 0.016, neckL: 0.01, neckLean: 70, neckW: 0.05, head: [0.065, 0.055, 0.05], snout: { len: 0.02, h: 0.03, w: 0.035 }, ears: 'side', earSize: 0.005, tail: 'curl', tailAngle: 150, belly: '#d8e86a' },
      drop('earL', 'earR'),
      tailK(3.8),
      hp('#5fb04a', [0.5, 0.7, 0.6], [0, 0.6, -0.2], { ...solid, srot: [-35, 0, 0], taper: 0 }, 'cyl'),
      (p, d) => {
        const [l, h, w] = d.head;
        both(p, 'eye', (q, s) => void (q.at = [s * w * 0.5, h * 0.3, l * 0.3]));
      },
      hp2('#5fb04a', [0.42, 0.5, 0.4], [0.36, 0.3, 0.28], solid),
      backRidge(6, '#4a9a3a', 0.5),
    ),
  ),
  e('cheetah', 'wild', 'savanna', () => bst('cheetah', CHEETAH, ani.spots(BK, 16), roundEars(), hp2(BK, [0.06, 0.42, 0.06], [0.22, -0.06, 0.42], { srot: [20, 0, 0] }))),
  e('cheetah cub', 'wild', 'savanna', () => bst('cheetah cub', baby(CHEETAH, 0.35), ani.spots('#4a3a2a', 10), bp('#dcdcd2', [0.9, 0.5, 0.85], [0, 0.32, 0], solid), roundEars())),
  e('chick (bird)', 'farm', 'poultry', () => bd('chick (bird)', { height: 0.12, color: '#f8dc4a', wing: '#f0c830', beak: '#f08a20', legs: '#f08a20', tail: ['#f8dc4a'] }, headK(1.25))),
  e('chicken (bird)', 'farm', 'poultry', () => bd('chicken (bird)', { height: 0.55, color: '#f6f2ea', wing: '#e8e2d6', beak: '#f2b030', legs: '#f2b030', comb: '#e02a2a', tail: ['#f6f2ea', '#e8e2d6', '#f6f2ea'] })),
  e('chihuahua', 'pets', 'dog breeds', () =>
    dog('chihuahua', 0.32, { color: '#e3b77a', body: [0.48, 0.26, 0.22], legL: 0.27, legW: 0.06, neckL: 0.1, head: [0.26, 0.25, 0.26], snout: { len: 0.07, h: 0.07, w: 0.08 }, ears: 'pointy', earSize: 0.22, tail: 'curl', tailAngle: 50 }, tailK(1.6)),
  ),
  e('chimpanzee', 'wild', 'jungle', () => ape('chimpanzee', 1.2, '#2e2420', '#c8a07a', 1.0)),
  e('chow chow', 'pets', 'dog breeds', () =>
    dog('chow chow', 0.75, { color: '#c8642a', body: [0.6, 0.36, 0.36], bodyShape: 'ball', legL: 0.22, legW: 0.12, neckL: 0.08, neckW: 0.22, head: [0.26, 0.23, 0.25], snout: { len: 0.08, h: 0.1, w: 0.13, color: '#b8582a' }, ears: 'side', earSize: 0.07, tail: 'curl', tailAngle: 35 }, ani.mane('#d8783a', true), roundEars(), tailK(1.8), hp('#3a3a7a', [0.22, 0.08, 0.2], [0, -0.32, 0.48])),
  ),
  e('cicada', 'bugs', 'flying insects', () => bug('cicada', { length: 0.04, color: '#4a5a32', wings: 'clear', wingColor: '#d8f0e0', extras: bx(fold('#d8f0e0', 1.25, 25), bugEyes('#8a2a1a', 1.7), partC('head', '#4a5a32', [1.5, 1, 1]), feelers(0.4)) })),
  e('clam', 'sea', 'shellfish', () =>
    m('clam', { rig: 'bug' })
      .ball([0.11, 0.045, 0.09], [0, 0.022, 0], { color: '#d8c4a4' })
      .ball([0.09, 0.02, 0.07], [0, 0.036, 0.004], { color: '#f2c4c0', noInk: true })
      .ball(0.026, [0, 0.048, 0.012], { color: '#f8f6f0' })
      .ball([0.11, 0.045, 0.09], [0, 0.066, -0.013], { color: '#e2d0b2', rot: [-40, 0, 0], name: 'lid', pivot: [0, 0.035, -0.042] })
      .torus([0.085, 0.07, 0.006], [0, 0.07, -0.011], { color: '#b8a080', rot: [50, 0, 0], tube: 0.08, noInk: true })
      .done(),
  ),
  e('clownfish', 'sea', 'reef fish', () => fish('clownfish', { length: 0.1, color: '#f07a1a', fin: '#f07a1a', extras: bands(WH, [0.24, 0.02, -0.22], 0.1) })),
  e('cobra', 'wild', 'reptiles', () => snake('cobra', { length: 1.6, color: '#6a6a3a', bands: '#a8a070', hood: true, girth: 0.07 })),
  e('cockatiel', 'aviary', 'parrots', () => bd('cockatiel', { height: 0.3, color: '#9a9aa0', wing: '#8a8a92', beak: '#c8b8a8', legs: '#a89890', tail: ['#8a8a92', '#7a7a82', '#8a8a92'] }, headC('#f2d84a'), cheeks('#f08a3a', 1.2), crest('#f2d84a', 1.6))),
  e('cockatoo', 'aviary', 'parrots', () => bd('cockatoo', { height: 0.42, color: '#f6f6f2', wing: '#eeeeea', beak: '#3a3a3e', legs: '#5a5a5e', tail: ['#f6f6f2'] }, crest('#f2d84a', 1.6, 3), beakK(1.4), hook('#3a3a3e', 0.26, 0.08))),
  e('cocker spaniel', 'pets', 'dog breeds', () =>
    dog('cocker spaniel', 0.6, { color: '#d4a050', head: [0.26, 0.22, 0.2], snout: { len: 0.1, h: 0.1, w: 0.11 }, earSize: 0.24, earColor: '#c08a3a', tail: 'stub', tailAngle: 60, belly: '#e8c48a' }, bp('#e0b462', [0.8, 0.35, 0.75], [0, -0.38, 0], solid)),
  ),
  e('cockroach', 'bugs', 'pests', () => bug('cockroach', { length: 0.04, color: '#6a3a1e', wings: 'none', extras: bx(partC('abdomen', '#6a3a1e', [1.1, 0.6, 1.1]), elytra('#7a4422', 1.15), feelers(2.6, '#5a3018')) })),
  e('collie', 'pets', 'dog breeds', () =>
    dog('collie', 0.9, { color: '#b8783a', head: [0.28, 0.18, 0.17], snout: { len: 0.17, h: 0.08, w: 0.08, color: WH }, ears: 'pointy', earSize: 0.08, tail: 'fluffy', tailAngle: 150, belly: WH }, ruff(WH), blaze(WH), socks(WH), tip(WH)),
  ),
  e('corgi', 'pets', 'dog breeds', () =>
    dog('corgi', 0.45, { color: '#d9843a', body: [0.8, 0.32, 0.32], legL: 0.12, legW: 0.1, neckL: 0.12, head: [0.26, 0.22, 0.21], snout: { len: 0.1, h: 0.09, w: 0.1, color: WH }, ears: 'pointy', earSize: 0.17, tail: 'stub', belly: WH }, bib(WH), blaze(WH), socks(WH)),
  ),
  e('crab', 'sea', 'shellfish', () => {
    const c = '#d8452a';
    const f = m('crab', { rig: 'bug' });
    f.ball([0.2, 0.075, 0.15], [0, 0.07, 0], { color: c, name: 'body' })
      .ball([0.16, 0.04, 0.11], [0, 0.05, 0.012], { color: '#f0d8b0', noInk: true })
      .pair((s) => {
        f.rod([s * 0.025, 0.09, 0.05], [s * 0.03, 0.125, 0.06], 0.012, c)
          .ball(0.02, [s * 0.03, 0.132, 0.062], { color: '#1d1a17', eye: true })
          .rod([s * 0.08, 0.07, 0.05], [s * 0.13, 0.085, 0.1], 0.03, c)
          .ball([0.055, 0.045, 0.075], [s * 0.15, 0.095, 0.13], { color: c })
          .cone([0.025, 0.05, 0.02], [s * 0.145, 0.1, 0.18], { color: c, rot: [80, 0, 0] });
        f.each(3, (i) => {
          const z = 0.03 - i * 0.035, k: Vec3 = [s * 0.15, 0.1, z - 0.01];
          f.rod([s * 0.08, 0.065, z], k, 0.016, c).rod(k, [s * 0.19, 0.005, z - 0.02], 0.014, c);
        });
      });
    return f.done();
  }),
  e('crane (bird)', 'aviary', 'water birds', () =>
    wader('crane (bird)', { h: 1.4, color: '#f4f4f0', neck: '#2a2a2a', head: '#2a2a2a', tail: '#2a2a2a', beak: '#c8c0a0', legs: '#3a3a3a', legL: 0.46, beakL: 0.11, bend: 0.02, fwd: 0.06, body: [0.18, 0.18, 0.38] })
      .ball([0.055, 0.03, 0.065], [0, 1.39, 0.25], { color: '#e02a2a', parent: 'head' })
      .ball([0.09, 0.07, 0.08], [0, 1.335, 0.2], { color: '#f4f4f0', parent: 'head' })
      .done(),
  ),
  e('crayfish', 'sea', 'shellfish', () => {
    const c = '#a8402a';
    const f = m('crayfish', { view: 'side', rig: 'bug' });
    f.ball([0.042, 0.036, 0.065], [0, 0.03, 0.02], { color: c, name: 'body' })
      .cone([0.014, 0.03, 0.01], [0, 0.036, 0.062], { color: c, rot: [90, 0, 0] })
      .each(5, (i) => f.ball([0.038 - i * 0.003, 0.028 - i * 0.002, 0.02], [0, 0.028 - i * 0.003, -0.016 - i * 0.015], { color: c }))
      .ball([0.05, 0.007, 0.028], [0, 0.016, -0.1], { color: c })
      .pair((s) => {
        f.rod([s * 0.016, 0.026, 0.045], [s * 0.03, 0.026, 0.075], 0.01, c)
          .ball([0.02, 0.013, 0.042], [s * 0.034, 0.029, 0.1], { color: c })
          .ball([0.008, 0.007, 0.03], [s * 0.04, 0.021, 0.108], { color: c })
          .ball(0.009, [s * 0.009, 0.044, 0.05], { color: '#1d1a17', eye: true })
          .rod([s * 0.006, 0.036, 0.05], [s * 0.035, 0.055, 0.16], 0.003, c);
        f.each(4, (i) => f.rod([s * 0.014, 0.022, 0.03 - i * 0.014], [s * 0.032, 0.002, 0.026 - i * 0.014], 0.004, c));
      });
    return f.done();
  }),
  e('cricket', 'bugs', 'hoppers', () => bug('cricket', { length: 0.025, color: '#3a2a1a', extras: bx(fold('#4a3424', 1.1), hindLegs('#3a2a1a'), feelers(2.4)) })),
  e('crocodile', 'wild', 'reptiles', () =>
    lizard('crocodile', { color: '#6b7a3e', body: [1.5, 0.36, 0.5], legL: 0.12, legW: 0.11, head: [0.32, 0.16, 0.26], snout: { len: 0.6, h: 0.11, w: 0.17, shape: 'box' }, tail: 1.15, tailW: 0.55, belly: '#e0dcb0' }, tailRidge(10, '#4e5a2c'), backRidge(7, '#4e5a2c', 0.7), teeth(7, '#fffaf0', 1.3), eyesUp('#6b7a3e')),
  ),
  e('crow', 'aviary', 'common birds', () => bd('crow', { height: 0.45, color: '#1c1c22', wing: '#26262e', beak: '#2a2a30', legs: '#2a2a30', tail: ['#1c1c22'] }, beakK(1.4))),
  e('cub', 'wild', 'forest', () => bst('cub', baby(BEAR, 0.4), roundEars('#5a3a20'))),
  e('dachshund', 'pets', 'dog breeds', () =>
    dog('dachshund', 0.5, { color: '#8a3a1e', body: [0.95, 0.26, 0.24], legL: 0.09, legW: 0.08, neckL: 0.15, neckLean: 40, head: [0.28, 0.18, 0.16], snout: { len: 0.17, h: 0.08, w: 0.08 }, earSize: 0.18, earColor: '#6a2a14', tailAngle: 110 }),
  ),
  e('dalmatian', 'pets', 'dog breeds', () =>
    dog('dalmatian', 0.85, { color: '#f6f4f0', earColor: '#2a2624', tailAngle: 130 }, ani.spots('#2a2624', 16), hp2('#2a2624', [0.16, 0.18, 0.14], [0.36, 0.5, 0.0]), hp('#2a2624', [0.14, 0.16, 0.12], [0.12, 0.62, 0.3])),
  ),
  e('deer', 'wild', 'forest', () => bst('deer', DEER, ani.antlers('#8a6440'))),
  e('dingo', 'wild', 'outback', () =>
    dog('dingo', 0.82, { color: '#d48a46', belly: '#f4e6d0', snout: { len: 0.13, h: 0.09, w: 0.1, color: '#f4e6d0' }, ears: 'pointy', earSize: 0.11, tail: 'fluffy', tailAngle: 130 }, socks('#f4e6d0'), tip('#f4e6d0')),
  ),
  e('dinosaur', 'wild', 'dinosaurs', () => {
    const g = '#5f9e4a', bl = '#d6dc9a', dk = '#4a8a3a';
    const f = m('dinosaur', { view: 'side', rig: 'quad' });
    f.pair((s) =>
      f.ball([0.45, 1.0, 0.8], [s * 0.45, 1.6, -0.3], { color: g, rot: [-20, 0, 0] })
        .rod([s * 0.45, 1.35, -0.45], [s * 0.45, 0.18, -0.15], 0.32, g)
        .box([0.38, 0.18, 0.75], [s * 0.45, 0.09, 0.12], { color: g, round: 0.6 })
        .rod([s * 0.4, 2.3, 0.75], [s * 0.45, 2.0, 1.05], 0.14, g),
    );
    f.ball([1.1, 1.3, 2.2], [0, 2.0, -0.1], { color: g, rot: [-20, 0, 0], name: 'body' })
      .ball([0.85, 0.95, 1.4], [0, 1.85, 0.25], { color: bl, rot: [-20, 0, 0], noInk: true })
      .cone([0.8, 2.6, 0.8], [0, 1.7, -2.3], { color: g, rot: [-100, 0, 0], name: 'tail', pivot: [0, 1.9, -1.0] })
      .rod([0, 2.45, 0.75], [0, 2.95, 1.2], 0.72, g)
      .box([0.75, 0.68, 1.2], [0, 3.15, 1.55], { color: g, round: 0.7, name: 'head', pivot: [0, 2.9, 1.0] })
      .box([0.6, 0.1, 0.9], [0, 2.77, 1.6], { color: '#7a2a2a', parent: 'head', noInk: true })
      .box([0.62, 0.24, 1.0], [0, 2.62, 1.62], { color: bl, round: 0.6, parent: 'head' })
      .each(5, (i) => f.pair((s) => f.cone([0.08, 0.14, 0.08], [s * 0.28, 2.75, 1.35 + i * 0.15], { color: '#fffaf0', rot: [180, 0, 0], parent: 'head' })))
      .pair((s) =>
        f.ball(0.13, [s * 0.34, 3.32, 1.78], { color: '#1d1a17', eye: true, parent: 'head' })
          .box([0.16, 0.06, 0.3], [s * 0.3, 3.45, 1.75], { color: dk, parent: 'head' })
          .ball(0.05, [s * 0.18, 3.25, 2.15], { color: '#2a2420', parent: 'head', noInk: true }),
      );
    const spikes: Array<[number, number]> = [[2.8, 0.5], [2.82, 0.07], [2.72, -0.32], [2.54, -0.68], [2.26, -1.0]];
    for (const [y, z] of spikes) f.cone([0.12, 0.3, 0.22], [0, y, z], { color: dk, rot: [-25, 0, 0] });
    return f.done();
  }),
  e('dodo', 'aviary', 'flightless birds', () =>
    bd('dodo', { height: 0.8, color: '#8a8f9a', wing: '#7c808a', beak: '#d8c27a', legs: '#e8c040', tail: ['#f4f0e8', '#e8e4dc', '#f4f0e8'] }, beakK(2.2), hook('#c8a850', 0.37, 0.06, 1.3), wingK(0.7), ({ g }) => void (g('body').size = mul(g('body').size, 1.15))),
  ),
  e('dolphin', 'sea', 'dolphins', () => whale('dolphin', 2.5, '#7a8a9a', { belly: '#e8ecf0', beak: true, fin: 1.1 })),
  e('dolphin calf', 'sea', 'dolphins', () => whale('dolphin calf', 1.0, '#8a9aaa', { belly: '#eef2f4', beak: true, fin: 0.8 })),
  e('donkey', 'farm', 'horses', () => bst('donkey', DONKEY, ani.mane('#3a3330'), hp2('#e4ddd4', [0.28, 0.3, 0.26], [0.3, 0.3, 0.3]))),
  e('donkey foal', 'farm', 'horses', () => bst('donkey foal', baby(DONKEY, 0.55, 1.0, 1.3), ani.mane('#5a5350'))),
  e('dove', 'aviary', 'common birds', () => bd('dove', { height: 0.3, color: '#f6f6f4', wing: '#e6e6ea', beak: '#e8a8a0', legs: '#e88a8a', tail: ['#f0f0f0'] })),
  e('dragonfly', 'bugs', 'flying insects', () =>
    bug('dragonfly', {
      length: 0.08,
      color: '#2a7ad0',
      wings: 'clear',
      extras: (p, { L }) => {
        const a = get(p, 'abdomen');
        if (a) Object.assign(a, { size: [0.08 * L, 0.08 * L, 0.85 * L], off: [0, 0, -0.42 * L] });
        const b = get(p, 'body');
        if (b) b.size = [0.16 * L, 0.16 * L, 0.2 * L];
        const h = get(p, 'head');
        if (h) h.size = [0.18 * L, 0.13 * L, 0.12 * L];
        both(p, 'eye', (q) => Object.assign(q, { size: [0.1 * L, 0.1 * L, 0.09 * L], color: col('#1e5a9a') }));
        both(p, 'antenna', (q) => void (q.size = [q.size[0], 0.08 * L, q.size[2]]));
        both(p, 'wing', (q, s) => {
          Object.assign(q, { at: [s * 0.04 * L, 0.08 * L, 0.03 * L], rot: [0, 0, s * 6], size: [0.7 * L, 0.012 * L, 0.13 * L], off: [s * 0.36 * L, 0, 0] });
          p.add(P(q.name, 'ball', [0.66 * L, 0.012 * L, 0.14 * L], [s * 0.34 * L, 0, -0.15 * L], '#e6f4fb', { layer: 3 }));
        });
      },
    }),
  ),
  e('duck', 'aviary', 'water birds', () =>
    bd('duck', { height: 0.45, color: '#a89a8a', wing: '#7a6a5a', beak: '#f2c020', legs: '#f29a20', tail: ['#f4f2ee', '#2a2a2a'] }, headC('#1e6a3a'), flatBill('#f2c020'), ring('#f6f6f2'), chestC('#7a3e2a')),
  ),
  e('duckling', 'aviary', 'water birds', () => bd('duckling', { height: 0.15, color: '#f8dc4a', wing: '#f0c830', beak: '#f29a20', legs: '#f29a20', tail: ['#f8dc4a'] }, flatBill('#f29a20'), headK(1.2))),
  e('eagle', 'aviary', 'birds of prey', () => bd('eagle', { height: 0.8, color: '#4a3020', wing: '#3a2414', beak: '#f2c02a', legs: '#f2c02a', tail: [WH, WH, WH] }, headC(WH), beakK(1.5), hook('#f2c02a'))),
  e('eel', 'sea', 'ocean fish', () =>
    fish('eel', { length: 1.0, color: '#4a4a3a', belly: '#e0a040', fin: '#3a3a2e', shape: 'long', extras: (p, { L, H }) => p.add(P('body', 'ball', [L * 0.02, H * 0.5, L * 0.6], [0, -H * 0.42, -L * 0.1], '#3a3a2e', { layer: -1 })) }),
  ),
  e('elephant', 'wild', 'savanna', () => bst('elephant', ELE, trunk('#8e8c8a', true), flapEars())),
  e('elephant calf', 'wild', 'savanna', () => bst('elephant calf', baby(ELE, 0.5, 0.9, 1.3), trunk('#8e8c8a', false), flapEars())),
  e('emperor penguin', 'aviary', 'flightless birds', () => {
    const k = '#22252e';
    const f = m('emperor penguin', { rig: 'bird' });
    f.ball([0.48, 0.85, 0.42], [0, 0.47, -0.02], { color: k, name: 'body' })
      .ball([0.4, 0.74, 0.3], [0, 0.44, 0.07], { color: '#f6f3ea', noInk: true })
      .ball([0.3, 0.16, 0.2], [0, 0.78, 0.1], { color: '#f6dc8a', noInk: true })
      .ball([0.26, 0.25, 0.27], [0, 0.98, 0.02], { color: k, name: 'head' })
      .cone([0.05, 0.17, 0.045], [0, 0.95, 0.21], { color: k, rot: [100, 0, 0], parent: 'head' })
      .ball([0.03, 0.016, 0.08], [0, 0.945, 0.17], { color: '#f2903a', noInk: true, parent: 'head' })
      .pair((s) =>
        f.ball([0.05, 0.13, 0.09], [s * 0.11, 0.9, 0.03], { color: '#f2b03a', noInk: true, parent: 'head' })
          .ball(0.035, [s * 0.075, 1.01, 0.11], { color: WH, parent: 'head', noInk: true })
          .ball(0.022, [s * 0.08, 1.012, 0.125], { color: '#1d1a17', eye: true, parent: 'head' })
          .capsule([0.07, 0.42, 0.15], [s * 0.26, 0.55, 0], { color: k, rot: [0, 0, s * 12], name: s > 0 ? 'wingL' : 'wingR', pivot: [s * 0.22, 0.75, 0] })
          .ball([0.12, 0.04, 0.16], [s * 0.09, 0.02, 0.1], { color: '#2a2a2a' }),
      )
      .cone([0.12, 0.12, 0.06], [0, 0.08, -0.2], { color: k, rot: [-120, 0, 0] });
    return f.done();
  }),
  e('emu', 'aviary', 'flightless birds', () =>
    wader('emu', { h: 1.7, color: '#6a5040', neck: '#7a8898', head: '#5a4a40', wing: '#5e4636', beak: '#3a3430', legs: '#7a7a72', legL: 0.44, body: [0.24, 0.26, 0.36], beakL: 0.04, neckW: 0.04, legW: 0.035, fwd: 0.04 })
      .ball([0.36, 0.34, 0.34], [0, 0.95, -0.32], { color: '#5e4636' })
      .done(),
  ),
  e('falcon', 'aviary', 'birds of prey', () => bd('falcon', { height: 0.45, color: '#5a6a80', wing: '#4a5a70', beak: '#f2c84a', legs: '#f2c02a', tail: ['#4a5a70'] }, chestC('#f2ead8'), beakK(1.2), hook('#3a3a40', 0.25, 0.08), cheeks('#2a2a30', 1.3))),
  e('fawn', 'wild', 'forest', () => bst('fawn', baby(DEER, 0.55, 1.0, 1.3), ani.spots(WH, 10))),
  e('fire ant', 'bugs', 'ants', () => bug('fire ant', { length: 0.012, color: '#c8401a', wings: 'none', extras: antBody('#c8401a', '#8a2a10') })),
  e('firefly', 'bugs', 'beetles', () =>
    bug('firefly', { length: 0.02, color: '#2a2420', wings: 'none', extras: bx(elytra('#3a3028', 0.85, '#e07a3a'), (p, { L }) => p.add(P('abdomen', 'ball', [0.3 * L, 0.24 * L, 0.22 * L], [0, -0.06 * L, -0.38 * L], '#e8f070', { role: 'glow', layer: 4 }))) }),
  ),
  e('fish (animal)', 'sea', 'ocean fish', () => fish('fish (animal)', { length: 0.3, color: '#3a8ad0', belly: '#d8ecf8', fin: '#f0c040' })),
  e('flamingo', 'aviary', 'water birds', () => wader('flamingo', { h: 1.2, color: '#f49ab0', wing: '#f07a98', tail: '#2a2a2a', beak: '#f2e0d8', bent: '#1e1e1e', legs: '#f08aa0', legL: 0.55, bend: 0.07, beakL: 0.1, neckW: 0.035 }).done()),
  e('flea', 'bugs', 'pests', () => bug('flea', { length: 0.012, color: '#5a3a1e', wings: 'none', extras: bx(hindLegs('#5a3a1e', 1.2), partC('abdomen', '#5a3a1e', [0.7, 1.3, 1.0]), partC('body', '#5a3a1e', [0.7, 1.2, 1]), feelers(0.4)) })),
  e('fly', 'bugs', 'flies', () => bug('fly', { length: 0.015, color: '#3a3a40', wings: 'clear', extras: bugEyes('#a02018', 2) })),
  e('flying fish', 'sea', 'ocean fish', () =>
    fish('flying fish', {
      length: 0.35,
      color: '#2a5aa0',
      belly: '#e0e8f0',
      fin: '#8ab0d8',
      shape: 'long',
      extras: (p, { L, H, W }) => both(p, 'fin', (q, s) => Object.assign(q, { at: [s * W * 0.4, H * 0.15, L * 0.12], rot: [0, 0, -s * 8], size: [L * 0.55, L * 0.02, L * 0.2], off: [s * L * 0.27, 0, -L * 0.06] })),
    }),
  ),
  e('flying squirrel', 'wild', 'forest', () =>
    bst(
      'flying squirrel',
      { color: '#9a8470', body: [0.22, 0.085, 0.1], legL: 0.03, legW: 0.02, neckL: 0.02, neckLean: 45, neckW: 0.045, head: [0.065, 0.06, 0.065], snout: { len: 0.015, h: 0.025, w: 0.03 }, nose: '#e89a9a', ears: 'side', earSize: 0.022, tail: 'fluffy', tailAngle: 115, belly: '#f2ece0' },
      bp('#8a7460', [2.4, 0.14, 0.75], [0, -0.05, 0], { ...solid, round: 0.9 }, 'box'),
      eyeC('#1d1a17', 1.4),
      roundEars(),
      tailK(1.1),
    ),
  ),
  e('foal', 'farm', 'horses', () => bst('foal', baby(HORSE, 0.6, 1.0, 1.3), ani.mane('#3a2618'), blaze(WH))),
  e('fox', 'wild', 'forest', () => bst('fox', FOX, tip(WH))),
  e('fox cub', 'wild', 'forest', () => bst('fox cub', baby(FOX, 0.55), tip(WH))),
  e('french bulldog', 'pets', 'dog breeds', () =>
    dog('french bulldog', 0.5, { color: '#d8b888', body: [0.52, 0.32, 0.34], bodyShape: 'ball', legL: 0.2, legW: 0.1, neckL: 0.06, neckW: 0.22, head: [0.27, 0.25, 0.28], snout: { len: 0.05, h: 0.12, w: 0.16, color: '#3a3028' }, ears: 'pointy', earSize: 0.17, tail: 'stub' }),
  ),
  e('frog', 'wild', 'amphibians', () => {
    const g = '#5aa83a', d = '#3a7a2a';
    const f = m('frog', { rig: 'quad' });
    f.ball([0.07, 0.05, 0.075], [0, 0.03, -0.005], { color: g, rot: [-25, 0, 0], name: 'body' })
      .ball([0.05, 0.04, 0.04], [0, 0.026, 0.022], { color: '#e8e4b0', noInk: true, rot: [-25, 0, 0] })
      .ball([0.07, 0.035, 0.055], [0, 0.052, 0.02], { color: g, name: 'head' })
      .capsule([0.003, 0.044, 0.003], [0, 0.046, 0.046], { color: '#2a3a20', rot: [0, 0, 90], noInk: true, parent: 'head' })
      .pair((s) =>
        f.ball([0.024, 0.024, 0.022], [s * 0.022, 0.07, 0.025], { color: g, parent: 'head' })
          .ball([0.012, 0.014, 0.008], [s * 0.024, 0.073, 0.035], { color: '#1d1a17', eye: true, parent: 'head' })
          .rod([s * 0.025, 0.03, 0.025], [s * 0.03, 0.004, 0.035], 0.01, g)
          .ball([0.016, 0.006, 0.016], [s * 0.032, 0.003, 0.04], { color: g })
          .ball([0.022, 0.03, 0.055], [s * 0.036, 0.018, -0.01], { color: g, rot: [-10, 0, 0] })
          .ball([0.02, 0.006, 0.035], [s * 0.042, 0.003, 0.02], { color: g })
          .ball([0.012, 0.004, 0.012], [s * 0.015, 0.054, -0.02], { color: d, noInk: true }),
      );
    return f.done();
  }),
  e('gecko', 'wild', 'reptiles', () =>
    lizard('gecko', { color: '#f0c860', body: [0.08, 0.03, 0.035], legL: 0.012, legW: 0.01, head: [0.03, 0.022, 0.028], snout: { len: 0.01, h: 0.014, w: 0.018 }, tail: 0.9, tailW: 0.6, belly: '#f8ecd0' }, ani.spots('#5a4030', 8, false), eyeC('#1d1a17', 1.4)),
  ),
  e('german shepherd', 'pets', 'dog breeds', () =>
    dog('german shepherd', 0.9, { color: '#c8843a', head: [0.27, 0.2, 0.19], snout: { len: 0.15, h: 0.09, w: 0.09, color: BK }, ears: 'pointy', earSize: 0.14, earColor: BK, tail: 'fluffy', tailAngle: 150, tailColor: '#5a3a20' }, saddle(BK)),
  ),
  e('giraffe', 'wild', 'savanna', () => bst('giraffe', GIR, ani.spots('#8a5a2b', 10), ani.horns('#8a5a2b', 'goat'))),
  e('giraffe calf', 'wild', 'savanna', () => bst('giraffe calf', baby(GIR, 0.42, 1.0, 1.3), ani.spots('#8a5a2b', 10), ani.horns('#8a5a2b', 'goat'))),
  e('goat', 'farm', 'goats', () => bst('goat', GOAT, ani.horns('#8a7a6a', 'goat'), ani.beard('#e0dcd4'))),
  e('golden retriever', 'pets', 'dog breeds', () => dog('golden retriever', 0.9, { color: '#d9a04e', earSize: 0.14, tail: 'fluffy', tailAngle: 115, belly: '#e8c07a' })),
  e('goldfish', 'sea', 'pond fish', () =>
    fish('goldfish', {
      length: 0.12,
      color: '#f08a1a',
      fin: '#f6b04a',
      extras: (p) => {
        const t = get(p, 'tail');
        if (t) t.size = [t.size[0] * 1.5, t.size[1] * 1.2, t.size[2] * 1.5];
      },
    }),
  ),
  e('goose', 'aviary', 'water birds', () =>
    wader('goose', { h: 0.85, color: '#8a7a68', neck: '#1e1e1e', head: '#1e1e1e', wing: '#6a5a4a', tail: '#1e1e1e', beak: '#1e1e1e', legs: '#2a2a2a', legL: 0.17, body: [0.3, 0.3, 0.6], beakL: 0.07, neckW: 0.06, fwd: 0.06, bend: 0.03 })
      .ball([0.075, 0.05, 0.04], [0, 0.795, 0.215], { color: WH, parent: 'head' })
      .ball([0.2, 0.14, 0.3], [0, 0.18, 0.02], { color: '#e8e2d8', noInk: true })
      .done(),
  ),
  e('gopher', 'wild', 'prairie', () =>
    bst(
      'gopher',
      { color: '#9a7552', body: [0.18, 0.1, 0.1], bodyShape: 'ball', legL: 0.015, legW: 0.02, neckL: 0.015, neckLean: 50, neckW: 0.06, head: [0.065, 0.06, 0.065], snout: { len: 0.02, h: 0.03, w: 0.035, color: '#c8a888' }, nose: '#e09a9a', ears: 'side', earSize: 0.015, tail: 'long', tailAngle: 150 },
      hp2('#a8835e', [0.4, 0.45, 0.5], [0.38, -0.15, 0.1], solid),
      hp('#f6ecc8', [0.24, 0.22, 0.08], [0, -0.48, 0.55], solid, 'box'),
      roundEars(),
    ),
  ),
  e('gorilla', 'wild', 'jungle', () => ape('gorilla', 1.7, '#24221f', '#5e5652', 1.5, (p, d) => p.add(P('torso', 'ball', [d.tw * 0.95, d.torsoH * 0.7, d.td * 0.4], [0, d.torsoH * 0.55, -d.td * 0.32], '#9a9894', { noInk: true, layer: -1 })))),
  e('grasshopper', 'bugs', 'hoppers', () => bug('grasshopper', { length: 0.05, color: '#6aa83a', extras: bx(partC('abdomen', '#6aa83a', [0.8, 0.8, 1.3]), fold('#8ab85a', 1.2), hindLegs('#5a9a30', 1.1), feelers(1.0)) })),
  e('gray whale', 'sea', 'whales', () => whale('gray whale', 13, '#6a747c', { fin: 0, dots: '#c8ccd0', flip: 0.7, bumps: '#9aa0a6' })),
  e('great dane', 'pets', 'dog breeds', () =>
    dog('great dane', 1.1, { color: '#d8b070', body: [0.75, 0.33, 0.27], legL: 0.45, legW: 0.09, neckL: 0.22, neckLean: 25, neckW: 0.15, head: [0.32, 0.22, 0.18], snout: { len: 0.16, h: 0.14, w: 0.12, color: BK }, earSize: 0.1, tailAngle: 145 }),
  ),
  e('great white shark', 'sea', 'sharks', () => shark('great white shark', 5, '#7d8a96')),
  e('greyhound', 'pets', 'dog breeds', () =>
    dog('greyhound', 0.9, { color: '#8e8c94', body: [0.72, 0.32, 0.22], legL: 0.42, legW: 0.06, neckL: 0.2, neckLean: 35, neckW: 0.1, head: [0.25, 0.14, 0.13], snout: { len: 0.15, h: 0.07, w: 0.07 }, ears: 'side', earSize: 0.07, tailAngle: 155 }, bp('#8e8c94', [0.95, 0.85, 0.45], [0, -0.15, 0.2], solid)),
  ),
  e('guide dog', 'pets', 'working dogs', () => dog('guide dog', 1, {}, harness('#3a3a3a'))),
  e('guinea pig', 'pets', 'small pets', () =>
    bst(
      'guinea pig',
      { color: '#f4efe6', body: [0.24, 0.12, 0.14], bodyShape: 'ball', legL: 0.012, legW: 0.022, legColor: '#e8c8b8', neckL: 0.01, neckLean: 60, neckW: 0.09, head: [0.09, 0.08, 0.085], snout: { len: 0.02, h: 0.035, w: 0.045 }, nose: '#c87a7a', ears: 'side', earSize: 0.03, tail: 'stub' },
      drop('tail'),
      bp('#d8843a', [1.03, 0.9, 0.45], [0, 0.06, -0.24]),
      hp(BK, [1.03, 0.85, 0.55], [0, 0.18, -0.05]),
      roundEars(),
    ),
  ),
  e('guppy', 'sea', 'tropical fish', () =>
    fish('guppy', {
      length: 0.06,
      color: '#9aa8a0',
      fin: '#f06a3a',
      extras: (p, { L, H }) => {
        const t = get(p, 'tail');
        if (t) t.size = [t.size[0] * 1.2, t.size[1] * 1.3, t.size[2] * 1.6];
        for (const y of [0.35, -0.3]) p.add(P('tail', 'ball', [L * 0.08, H * 0.25, L * 0.08], [0, H * y, -L * 0.26], '#3a7ad0', { noInk: true, layer: 2 }));
      },
    }),
  ),
  e('hammerhead (shark)', 'sea', 'sharks', () =>
    shark('hammerhead (shark)', 3.5, '#8a96a0', (p, { L, H }) => {
      p.add(P('body', 'box', [L * 0.3, H * 0.16, L * 0.07], [0, H * 0.08, L * 0.42], '#8a96a0', { round: 0.9, layer: 2 }));
      both(p, 'eye', (q, s) => void (q.at = [s * L * 0.15, H * 0.1, L * 0.42]));
    }),
  ),
  e('hamster', 'pets', 'small pets', () =>
    bst(
      'hamster',
      { color: '#d9a05a', body: [0.12, 0.085, 0.095], bodyShape: 'ball', legL: 0.008, legW: 0.018, legColor: '#f0d0c0', neckL: 0.01, neckLean: 40, neckW: 0.05, head: [0.06, 0.055, 0.065], snout: { len: 0.015, h: 0.025, w: 0.03, color: '#f6efe6' }, nose: '#e89a9a', ears: 'side', earSize: 0.022, tail: 'stub', belly: '#f6efe6' },
      hp2('#f6efe6', [0.4, 0.45, 0.5], [0.32, -0.15, 0.15], solid),
      roundEars('#f0b0b0'),
    ),
  ),
  e('hare', 'wild', 'prairie', () =>
    bst(
      'hare',
      { ...RABBIT, color: '#a07a50', body: [0.42, 0.2, 0.18], bodyShape: 'capsule', legL: 0.12, legW: 0.04, earSize: 0.19, snout: { len: 0.035, h: 0.04, w: 0.05, color: '#c8a880' } },
      haunches('#a07a50'),
      (p) =>
        both(p, 'ear', (q) => {
          const es = q.size[1];
          p.add(P(q.name, 'ball', [es * 0.36, es * 0.25, es * 0.3], [0, es * 0.8, 0], BK, { layer: 2 }));
        }),
    ),
  ),
  e('hawk', 'aviary', 'birds of prey', () => bd('hawk', { height: 0.5, color: '#7a5032', wing: '#5a3a22', beak: '#3a3a3a', legs: '#f2c02a', tail: ['#b8502a', '#c8602a', '#b8502a'] }, chestC('#f2e6d0'), beakK(1.3), hook('#3a3a3a', 0.25, 0.08))),
  e('hedgehog', 'wild', 'forest', () =>
    bst(
      'hedgehog',
      { color: '#d8b890', body: [0.2, 0.11, 0.14], bodyShape: 'ball', legL: 0.015, legW: 0.02, neckL: 0.01, neckLean: 60, neckW: 0.06, head: [0.07, 0.06, 0.06], snout: { len: 0.04, h: 0.025, w: 0.025 }, ears: 'side', earSize: 0.018, tail: 'stub' },
      bp('#6a4a32', [1.15, 1.0, 1.05], [0, 0.18, -0.05], solid),
      (p, d) => {
        const [L, H, W] = d.body;
        const n = 40;
        for (let i = 0; i < n; i++) {
          const y = 1 - (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
          const dir: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r - 0.35];
          if (Math.sin(a) * r > 0.55 && y < 0.6) continue;
          p.add(P('body', 'cyl', [W * 0.08, H * 0.4, W * 0.08], [Math.cos(a) * r * W * 0.58, H * 0.18 + y * H * 0.52, Math.sin(a) * r * L * 0.52 - L * 0.05], '#4a3424', { taper: 0, srot: aim(dir), layer: 1 }));
        }
      },
      roundEars(),
    ),
  ),
  e('heron', 'aviary', 'water birds', () =>
    wader('heron', { h: 1.0, color: '#8a98a8', neck: '#e4e6ea', head: '#e4e6ea', wing: '#7a8a9a', beak: '#e8c040', legs: '#c8a860', legL: 0.42, beakL: 0.14, bend: 0.09, neckW: 0.04 })
      .rod([0, 0.97, 0.12], [0, 0.95, -0.02], 0.009, '#2a2a2a', { parent: 'head' })
      .ball([0.07, 0.018, 0.07], [0, 0.972, 0.155], { color: '#2a2a2a', parent: 'head', noInk: true })
      .done(),
  ),
  e('hippopotamus', 'wild', 'savanna', () =>
    bst(
      'hippopotamus',
      { color: '#8c7a8c', body: [2.8, 1.25, 1.45], bodyShape: 'ball', legL: 0.28, legW: 0.38, neckL: 0.08, neckLean: 60, neckW: 0.9, head: [0.75, 0.55, 0.7], snout: { len: 0.6, h: 0.52, w: 0.78, color: '#a8909a', shape: 'box' }, ears: 'side', earSize: 0.12, tail: 'stub', belly: '#c8a0a8' },
      roundEars(),
      eyesUp('#8c7a8c'),
      hp2('#5a4a5a', [0.12, 0.08, 0.1], [0.16, 0.36, 0.9], solid),
      hp2('#fffaf0', [0.07, 0.28, 0.07], [0.32, -0.42, 0.92], { ...solid, taper: 0 }, 'cyl'),
    ),
  ),
  e('honey badger', 'wild', 'savanna', () =>
    bst(
      'honey badger',
      { color: '#1f1d1c', body: [0.62, 0.26, 0.28], bodyShape: 'ball', legL: 0.07, legW: 0.075, neckL: 0.05, neckLean: 60, neckW: 0.15, head: [0.17, 0.13, 0.13], snout: { len: 0.06, h: 0.06, w: 0.07 }, ears: 'side', earSize: 0.03, tail: 'long', tailAngle: 70 },
      bp('#d8d6d0', [1.02, 0.55, 1.0], [0, 0.26, 0]),
      hp('#d8d6d0', [1.02, 0.6, 0.9], [0, 0.4, 0]),
      roundEars(),
    ),
  ),
  e('hooves', 'farm', 'animal parts', () => {
    const f = m('hooves');
    f.pair((s) => {
      const x = s * 0.07;
      f.cyl([0.06, 0.14, 0.06], [x, 0.17, -0.01], { color: '#7a5030' })
        .ball([0.085, 0.07, 0.085], [x, 0.09, 0], { color: '#7a5030' })
        .box([0.042, 0.065, 0.095], [x + 0.022, 0.033, 0.012], { color: '#3a3430', round: 0.6 })
        .box([0.042, 0.065, 0.095], [x - 0.022, 0.033, 0.012], { color: '#3a3430', round: 0.6 })
        .ball([0.025, 0.02, 0.02], [x, 0.07, -0.045], { color: '#3a3430' });
    });
    return f.done();
  }),
  e('hornet', 'bugs', 'bees and wasps', () => bug('hornet', { length: 0.035, color: '#d89a20', stripes: '#5a2a10', wings: 'clear', wingColor: '#f0e2c0', extras: bx(partC('head', '#e0a040', [1.2, 1.1, 1.1]), partC('body', '#6a3418')) })),
  e('horsefly', 'bugs', 'flies', () => bug('horsefly', { length: 0.022, color: '#5a5848', wings: 'clear', extras: bx(bugEyes('#3a8a5a', 2.3), partC('abdomen', '#6a6250', [1.1, 0.8, 1.1])) })),
  e('horseshoe crab', 'sea', 'shellfish', () => {
    const c = '#6a5a3a', d = '#5a4a30';
    const f = m('horseshoe crab', { view: 'side', rig: 'bug' });
    f.ball([0.3, 0.1, 0.28], [0, 0.035, 0.06], { color: c, name: 'body' })
      .ball([0.05, 0.04, 0.22], [0, 0.07, 0.06], { color: d })
      .ball([0.2, 0.07, 0.15], [0, 0.03, -0.12], { color: d })
      .pair((s) => f.ball([0.03, 0.015, 0.05], [s * 0.07, 0.075, 0.08], { color: '#2a2420', eye: true }).each(3, (i) => f.cone([0.015, 0.035, 0.015], [s * 0.1, 0.03, -0.08 - i * 0.035], { color: d, rot: [0, 0, -s * 70] })))
      .rod([0, 0.03, -0.19], [0, 0.07, -0.45], 0.022, d);
    return f.done();
  }),
  e('hound', 'pets', 'dog breeds', () =>
    dog('hound', 0.85, { color: '#c8843e', belly: WH, snout: { len: 0.13, h: 0.1, w: 0.11, color: WH }, earSize: 0.17, earColor: '#a86a30', tailAngle: 40, legL: 0.36 }, saddle(BK), socks(WH), tip(WH), blaze(WH)),
  ),
  e('hummingbird', 'aviary', 'tropical birds', () => bd('hummingbird', { height: 0.09, color: '#2e9a5a', wing: '#3a6a5a', beak: '#2a2a2a', legs: '#2a2a2a', tail: ['#2a6a4a'] }, needle(0.4), throat('#e02a4a'), chestC('#d8e8d0', 0.8))),
  e('humpback whale', 'sea', 'whales', () => whale('humpback whale', 14, '#2e3640', { belly: '#d8dce0', fin: 0.4, finZ: -0.18, flip: 2.2, flipC: '#e8ecf0', grooves: '#9aa0a8', bumps: '#4a525c' })),
  e('husky', 'pets', 'dog breeds', () =>
    dog('husky', 0.85, { color: '#7a7e88', belly: WH, snout: { len: 0.12, h: 0.1, w: 0.11, color: WH }, ears: 'pointy', earSize: 0.11, tail: 'fluffy', tailAngle: 35 }, mask(WH), socks(WH), bib(WH), eyeC('#5ab0e8')),
  ),
  e('hyena', 'wild', 'savanna', () => bst('hyena', HYENA, ani.spots('#5a4030', 10), ani.mane('#5a4030'), roundEars())),
  e('hyena cub', 'wild', 'savanna', () => bst('hyena cub', baby({ ...HYENA, color: '#4a3a30', snout: { len: 0.13, h: 0.12, w: 0.12, color: '#2a2018' } }, 0.45), roundEars())),
  e('iguana', 'wild', 'reptiles', () =>
    lizard('iguana', { color: '#6aa84f', body: [0.42, 0.17, 0.17], legL: 0.09, legW: 0.04, head: [0.13, 0.09, 0.09], snout: { len: 0.05, h: 0.06, w: 0.06 }, tail: 1.9, tailW: 0.45, belly: '#a8d080' }, backRidge(8, '#4a8a3a', 0.9, 0.45, -0.4), tailRidge(10, '#4a8a3a'), hp('#8ac860', [0.12, 0.7, 0.6], [0, -0.55, 0.2], solid)),
  ),
  e('inchworm', 'bugs', 'crawlers', () => {
    const n = 11;
    const f = m('inchworm', { view: 'side', rig: 'bug' });
    f.each(n, (i) => {
      const t = i / (n - 1);
      f.ball(0.009, [0, 0.0045 + 0.024 * Math.sin(Math.PI * t), 0.028 - 0.056 * t], { color: i % 2 ? '#7ac040' : '#8ad04a' });
    });
    f.ball(0.011, [0, 0.0055, 0.033], { color: '#6ab038', name: 'head' }).pair((s) => f.ball(0.003, [s * 0.003, 0.008, 0.038], { color: '#1d1a17', eye: true }));
    return f.done();
  }),
  e('irish setter', 'pets', 'dog breeds', () => dog('irish setter', 0.9, { color: '#a03a1a', head: [0.27, 0.19, 0.17], snout: { len: 0.15, h: 0.09, w: 0.09 }, earSize: 0.18, tail: 'fluffy', tailAngle: 110 })),
  e('jack russel terrier', 'pets', 'dog breeds', () =>
    dog('jack russel terrier', 0.42, { color: WH, earSize: 0.1, earColor: '#b8783a', tail: 'stub', tailAngle: 30, legL: 0.28 }, hp2('#b8783a', [0.5, 0.7, 0.75], [0.25, 0.25, 0.0]), bp('#b8783a', [1.03, 0.6, 0.3], [0, 0.22, -0.2])),
  ),
  e('jackal', 'wild', 'savanna', () =>
    dog('jackal', 0.62, { color: '#c89a5a', belly: '#f2e6d0', head: [0.24, 0.18, 0.17], snout: { len: 0.14, h: 0.08, w: 0.08 }, ears: 'pointy', earSize: 0.15, tail: 'fluffy', tailAngle: 140, tailColor: '#5a4030', legL: 0.36 }, saddle('#3a3028', 0.8)),
  ),
  e('jaguar', 'wild', 'jungle', () =>
    bst(
      'jaguar',
      { color: '#e3a23c', body: [1.35, 0.55, 0.45], legL: 0.4, legW: 0.12, neckL: 0.12, neckLean: 50, neckW: 0.25, head: [0.3, 0.26, 0.28], snout: { len: 0.08, h: 0.1, w: 0.14, color: '#f2dcb0' }, ears: 'side', earSize: 0.08, tail: 'long', tailAngle: 140, belly: '#f4e6c8' },
      roundEars(),
      (p, d) => {
        const [L, H, W] = d.body;
        for (const s of [1, -1])
          for (let i = 0; i < 9; i++) {
            const z = ((i % 5) / 4 - 0.5) * 0.7, y = (Math.floor(i / 5) ? -0.05 : 0.22) + (i % 2) * 0.06;
            p.add(P('body', 'ball', [W * 0.05, H * 0.2, L * 0.1], [s * W * 0.46, H * y, L * z], '#2a2018', { noInk: true, layer: 3 }));
            p.add(P('body', 'ball', [W * 0.05, H * 0.1, L * 0.05], [s * W * 0.475, H * y, L * z], '#c07a28', { noInk: true, layer: 4 }));
          }
      },
      hp2('#2a2018', [0.08, 0.08, 0.08], [0.3, 0.5, 0.1]),
    ),
  ),
  e('jellyfish', 'sea', 'sea creatures', () => {
    const f = m('jellyfish', { rig: 'fish' });
    f.ball([0.3, 0.22, 0.3], [0, 0.46, 0], { color: '#f0a0d8', name: 'body' })
      .torus([0.3, 0.3, 0.04], [0, 0.4, 0], { color: '#f4b8e0', rot: [90, 0, 0], tube: 0.18 })
      .each(4, (i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        f.ball([0.07, 0.05, 0.07], [Math.cos(a) * 0.06, 0.55, Math.sin(a) * 0.06], { color: '#f8d0ec', noInk: true });
      })
      .each(4, (i) => {
        const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 0.035, z = Math.sin(a) * 0.035;
        f.rod([x, 0.38, z], [x * 1.6, 0.26, z * 1.6], 0.035, '#e070b8').rod([x * 1.6, 0.26, z * 1.6], [x * 0.8, 0.12, z * 0.8], 0.028, '#e070b8');
      })
      .each(8, (i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12;
        f.rod([x, 0.39, z], [x * 1.15, 0.22, z * 1.15], 0.012, '#f4b8e0').rod([x * 1.15, 0.22, z * 1.15], [x * 0.9, 0.04, z * 0.9], 0.01, '#f4b8e0');
      });
    return f.done();
  }),
  e('joey', 'wild', 'outback', () => roo('joey', 0.2, 1.35, '#c08a5a')),
  e('kangaroo', 'wild', 'outback', () => roo('kangaroo', 1.05, 1, '#b8784a')),
  e('kid (animal)', 'farm', 'goats', () => bst('kid (animal)', baby({ ...GOAT, color: '#e8dcc8' }, 0.5, 1.0, 1.35), hp('#8a6a4a', [1.02, 0.5, 0.6], [0, 0.4, 0]))),
  e('kit (animal)', 'wild', 'forest', () => bst('kit (animal)', baby({ ...FOX, color: '#b8703e', legColor: '#4a3a30' }, 0.45), tip(WH))),
  e('kitten', 'pets', 'cats', () => bst('kitten', baby({ ...CAT, color: '#a8a8a8' }, 0.55), ani.stripes('#6a6a6a', 4), hp2('#6a6a6a', [0.12, 0.3, 0.5], [0.2, 0.45, -0.05]))),
  e('kiwi (bird)', 'aviary', 'flightless birds', () =>
    bd('kiwi (bird)', { height: 0.35, color: '#8a6a48', wing: '#8a6a48', beak: '#e8dcb0', legs: '#9a9a8a', tail: ['#8a6a48'] }, needle(0.55, undefined, 25), ({ cut }) => cut('tail'), wingK(0.5), ({ g }) => {
      g('body').size = mul(g('body').size, 1.2);
      g('head').size = mul(g('head').size, 0.8);
    }),
  ),
  e('koala', 'wild', 'outback', () => bst('koala', KOALA, roundEars('#e8e6e2', 0.42))),
  e('koala cub', 'wild', 'outback', () => bst('koala cub', baby(KOALA, 0.45), roundEars('#e8e6e2', 0.42))),
  e('komodo dragon', 'wild', 'reptiles', () =>
    lizard('komodo dragon', { color: '#6e6450', body: [1.0, 0.36, 0.42], legL: 0.18, legW: 0.11, head: [0.3, 0.16, 0.18], snout: { len: 0.16, h: 0.1, w: 0.13, shape: 'box' }, tail: 1.0, tailW: 0.5, belly: '#8a7e66' }, (p, d) => {
      const [hl, hh] = d.head;
      for (const s of [1, -1]) p.add(rodP('head', [0, -hh * 0.2, hl * 0.72], [s * hl * 0.07, -hh * 0.28, hl * 1.05], hl * 0.035, '#e8b830', { layer: 5 }));
    }),
  ),
  e('krill', 'sea', 'sea creatures', () => {
    const c = '#f08a7a';
    const f = m('krill', { view: 'side', rig: 'fish' });
    f.ball([0.012, 0.012, 0.022], [0, 0.014, 0.012], { color: c, name: 'body' })
      .each(5, (i) => f.ball([0.01 - i * 0.0012, 0.01 - i * 0.0012, 0.009], [0, 0.013 - i * i * 0.0005, -0.002 - i * 0.0075], { color: c }))
      .ball([0.014, 0.004, 0.012], [0, 0.004, -0.038], { color: c })
      .pair((s) =>
        f.ball(0.006, [s * 0.004, 0.017, 0.024], { color: '#1d1a17', eye: true })
          .rod([s * 0.002, 0.017, 0.026], [s * 0.006, 0.03, 0.055], 0.0012, c)
          .each(5, (i) => f.rod([s * 0.003, 0.008, 0.016 - i * 0.006], [s * 0.005, 0.0005, 0.018 - i * 0.006], 0.0012, '#f4b0a0')),
      )
      .each(3, (i) => f.ball(0.002, [0, 0.0065, 0.008 - i * 0.01], { color: '#7af0e0', glow: true, noInk: true }));
    return f.done();
  }),
  e('labrador', 'pets', 'dog breeds', () => dog('labrador', 1, {})),
];
