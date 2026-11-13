/** Catalog chunk animals-a: the words in assign/animals-a.tsv. */
import { e as entry, type CatalogEntry, type District } from './types';
import { A, m, withAct, type M } from '../dsl';
import { who, type Extra } from '../accessories';
import { type Parts } from '../kit';
import { bug, snake } from '../creatures';
import { col } from '../colors';
import { measure } from '../math';
import type { FigPart, Figure, Shape, Vec3 } from '../types';

/* ----- helpers ----------------------------------------------------------------------------------------------- */

type BX = NonNullable<Parameters<typeof bug>[1]['extras']>;
type Sign = 1 | -1;
const SIDES: Array<['L' | 'R', Sign]> = [['L', 1], ['R', -1]];
const WH = '#f6f2ea', BK = '#2a2420';

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

/* ----- four legs, sculpted -------------------------------------------------------------------------------------
 * A lofted body (deep chest, tucked waist, round rump, a hump if it has one), a neck, a skull with a muzzle, a
 * jaw that opens and a mouth behind it, ears and a tail of the right kind, and legs that taper from a thick
 * shoulder or thigh to a slim shin, with a hock on each hind leg and paws or hooves. Joint names are the ones the
 * animations know (body, neck, head, jaw, earL/R, legFL/FR/BL/BR, tail), so it walks, wags, grazes and looks.
 * Everything is in metres at the animal's real size; markings are added with QMarks in the same frame.
 */

type EarK = 'prick' | 'drop' | 'round' | 'long' | 'side' | 'tiny' | 'fold' | 'none';
type TailK = 'long' | 'whip' | 'bushy' | 'curl' | 'stub' | 'tuft' | 'flat' | 'club' | 'taper';
interface Q {
  c: string;
  /** Withers height, body length (chest to rump), chest depth, body width. */
  H: number;
  L: number;
  D: number;
  W: number;
  /** Waist tuck-up 0..1 (cow 0, dog 0.35, greyhound 0.8), rump height over withers, a hump over the shoulders (m). */
  tuck?: number;
  rump?: number;
  hump?: number;
  belly?: string;
  /** Neck: length, thickness (at the head), lean from vertical (deg), base thickness for a tapering neck. */
  neck: { l: number; w: number; lean: number; c?: string; base?: number };
  head: { l: number; w: number; h: number; c?: string };
  /** Muzzle; drop: how far below the skull centre, in head heights (a stop). */
  muz: { l: number; w: number; h: number; c?: string; drop?: number; jaw?: string };
  nose?: string;
  eye?: { k?: number; c?: string; up?: number };
  ear: { k: EarK; s: number; c?: string; in?: string; tilt?: number };
  /** Legs: thickness, hooves (their colour), coat colour of the legs, of the lower legs, thigh bulk, hock height. */
  leg: { w: number; hoof?: string; c?: string; low?: string; k?: number; hock?: number; paw?: string };
  /** Tail: kind, length, thickness, angle from straight up toward the back (90 level, 160 hanging). */
  tail: { k: TailK; l: number; w: number; a: number; c?: string; tip?: string };
}
interface QD {
  q: Q;
  yb: number;
  Hr: number;
  /** Skull and muzzle centres. */
  sk: Vec3;
  mz: Vec3;
  nb: Vec3;
  nt: Vec3;
  tj: Vec3;
  /** Body section at t (0 rump .. 1 chest): half width, half height, centre y. */
  sec: (t: number) => [number, number, number];
  z: (t: number) => number;
}
type QMark = (f: M, d: QD) => void;
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const q4 = (key: string, q: Q, ...marks: QMark[]): M => {
  const { H, L, D, W } = q;
  const Hr = H * (q.rump ?? 0.98), hump = q.hump ?? 0, tk = q.tuck ?? 0.3;
  const yb = H - D / 2;
  const S: Array<[number, number, number, number]> = [
    [0, W * 0.5, D * 0.5, Hr - D * 0.1],
    [0.1, W * 0.88, D * 0.84, Hr],
    [0.3, W * 0.92, D * (0.88 - tk * 0.22), Hr * 0.65 + H * 0.35 + hump * 0.05],
    [0.52, W * 0.86, D * (0.95 - tk * 0.45), (Hr + H) / 2 + hump * 0.2],
    [0.75, W, D, H + hump * 0.65],
    [0.88, W * 0.94, D * 0.92, H + hump],
    [1, W * 0.55, D * 0.56, H - D * 0.06 + hump * 0.6],
  ];
  const sec = (t: number): [number, number, number] => {
    let i = 0;
    while (i < S.length - 2 && t > S[i + 1][0]) i++;
    const a = S[i], b = S[i + 1], u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    const w = a[1] + (b[1] - a[1]) * u, h = a[2] + (b[2] - a[2]) * u, top = a[3] + (b[3] - a[3]) * u;
    return [w / 2, h / 2, top - h / 2];
  };
  const z = (t: number) => L * (t - 0.5);
  const f = m(key, { view: 'side', rig: 'quad' });
  const c = q.c;
  f.loft([W, D, L], [0, yb, 0], S.map(([t, w, h, top]) => [t, w / W, h / D, (top - h / 2 - yb) / D] as [number, number, number, number]), { color: c, name: 'body' });
  if (q.belly) coatOf(f, q, sec, q.belly, 0.2, 0.92, { cut: 'bottom', kw: 0.82, kh: 1.03, dy: -0.06 });
  // neck and head
  const nb: Vec3 = [0, H - D * 0.3 + hump * 0.45, L * 0.4];
  const lean = (q.neck.lean * Math.PI) / 180;
  const nt: Vec3 = [0, nb[1] + q.neck.l * Math.cos(lean), nb[2] + q.neck.l * Math.sin(lean)];
  const nc = q.neck.c ?? c, hc = q.head.c ?? nc;
  if (q.neck.base) f.loft([q.neck.base, q.neck.base, q.neck.l * 1.08], add3(mul(add3(nb, nt), 0.5), [0, 0, 0]), [[0, 1, 1, 0], [0.4, 0.62, 0.62, 0], [1, q.neck.w / q.neck.base, q.neck.w / q.neck.base, 0]], { color: nc, rot: [q.neck.lean - 90, 0, 0], name: 'neck', parent: 'body', pivot: nb });
  else f.rod(nb, nt, q.neck.w, nc, { name: 'neck', parent: 'body', pivot: nb });
  const { l: hl, w: hw, h: hh } = q.head;
  const sk: Vec3 = [0, nt[1] + hh * 0.1, nt[2] + hl * 0.14];
  f.ball([hw, hh, hl], sk, { color: hc, name: 'head', parent: 'neck', pivot: nt });
  const { l: ml, w: mw, h: mh } = q.muz;
  const mc = q.muz.c ?? hc;
  const mz: Vec3 = [0, sk[1] - hh * (q.muz.drop ?? 0.16), sk[2] + hl * 0.38 + ml * 0.42];
  f.ball([mw, mh, ml], mz, { color: mc, parent: 'head' })
    .ball([mw * 0.48, mh * 0.36, ml * 0.2], [0, mz[1] + mh * 0.2, mz[2] + ml * 0.44], { color: q.nose ?? '#231e1b', parent: 'head', noInk: true })
    .ball([mw * 0.68, mh * 0.3, ml * 0.84], [0, mz[1] - mh * 0.26, mz[2] + ml * 0.02], { color: '#5e2a30', parent: 'head', noInk: true })
    .ball([mw * 0.78, mh * 0.42, ml * 0.84], [0, mz[1] - mh * 0.37, mz[2] - ml * 0.04], { color: q.muz.jaw ?? mc, name: 'jaw', parent: 'head', pivot: [0, mz[1] - mh * 0.3, mz[2] - ml * 0.46] });
  const ek = q.eye?.k ?? 1;
  f.pair((s) =>
    f.ball([hw * 0.17 * ek, hh * 0.21 * ek, hl * 0.13 * ek], [s * hw * 0.34, sk[1] + hh * (q.eye?.up ?? 0.12), sk[2] + hl * 0.3], { color: q.eye?.c ?? '#1d1a17', eye: true, parent: 'head', noInk: true })
      .ball([hw * 0.045 * ek, hh * 0.05 * ek, hl * 0.03], [s * hw * 0.41, sk[1] + hh * ((q.eye?.up ?? 0.12) + 0.04), sk[2] + hl * 0.35], { color: '#ffffff', eye: true, parent: 'head', noInk: true }),
  );
  earsOf(f, q, sk);
  // legs: shoulder / thigh muscle on the joint, then the shin, then a paw or a hoof
  const lw = q.leg.w, k = q.leg.k ?? 1, lc = q.leg.c ?? c, low = q.leg.low ?? lc;
  const hoofH = lw * 0.95;
  const footTop = q.leg.hoof ? hoofH + lw * 0.3 : lw * 0.55;
  const hockY = Math.max(lw * 1.6, (H - D) * 0.42 * (q.leg.hock ?? 1));
  const foot = (x: number, zz: number, parent: string) => {
    if (q.leg.hoof)
      f.ball([lw * 1.12, lw * 1.15, lw * 1.2], [x, hoofH + lw * 0.35, zz - lw * 0.05], { color: low, parent })
        .cyl([lw * 1.18, hoofH, lw * 1.3], [x, hoofH / 2, zz + lw * 0.06], { color: q.leg.hoof, taper: 0.78, parent });
    else f.ball([lw * 1.35, lw * 0.8, lw * 1.8], [x, lw * 0.4, zz + lw * 0.32], { color: q.leg.paw ?? low, parent });
  };
  f.pair((s) => {
    const x = s * W * 0.3, sd = s > 0 ? 'L' : 'R';
    const fz = L * 0.31, bz = -L * 0.32;
    f.ball([lw * 1.55 * k, D * 0.8, lw * 2.25 * k], [x, H - D * 0.62 + hump * 0.3, fz], { color: lc === low ? lc : c, name: 'legF' + sd, parent: 'body', pivot: [x, H - D * 0.3, fz] })
      .rod([x, H - D * 0.95, fz], [x, footTop, fz + lw * 0.15], lw, low, { parent: 'legF' + sd });
    foot(x, fz + lw * 0.15, 'legF' + sd);
    const stifle = Math.max(hockY + lw * 1.2, Hr - D * 1.02);
    f.ball([lw * 1.9 * k, D * 0.95, Math.max(lw * 2.6, D * 0.62) * k], [x, Hr - D * 0.6, bz], { color: lc === low ? lc : c, name: 'legB' + sd, parent: 'body', pivot: [x, Hr - D * 0.3, bz] })
      .rod([x, stifle, bz + lw * 0.4], [x, hockY, bz - lw * 0.7], lw * 1.1, low, { parent: 'legB' + sd })
      .ball([lw * 0.95, lw * 1.25, lw * 1.25], [x, hockY, bz - lw * 0.82], { color: low, parent: 'legB' + sd })
      .rod([x, hockY, bz - lw * 0.65], [x, footTop, bz - lw * 0.1], lw * 0.95, low, { parent: 'legB' + sd });
    foot(x, bz - lw * 0.1, 'legB' + sd);
  });
  const tj: Vec3 = [0, Hr - D * 0.16, -L * 0.49];
  tailOf(f, q, tj);
  f.socket('mouth', [0, mz[1] - mh * 0.35, mz[2] + ml * 0.48], 'mouth', { part: 'head', size: Math.max(0.06, mw * 1.2) });
  const d: QD = { q, yb, Hr, sk, mz, nb, nt, tj, sec, z };
  for (const mk of marks) mk(f, d);
  return f;
};

/** A coat-coloured overlay on part of the body, from t0 to t1 (0 rump .. 1 chest), riding just outside it. */
const coatOf = (f: M, q: Q, sec: QD['sec'], c: string, t0: number, t1: number, o: { cut?: 'top' | 'bottom'; kw?: number; kh?: number; dy?: number } = {}) => {
  const kw = o.kw ?? 1.04, kh = o.kh ?? 1.04, dy = (o.dy ?? 0) * q.D;
  const yb = q.H - q.D / 2, n = 6;
  const prof: Array<[number, number, number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n, [w, h, cy] = sec(t), end = i === 0 || i === n ? 0.9 : 1;
    prof.push([i / n, ((w * 2) / q.W) * end, ((h * 2) / q.D) * end, (cy - yb) / (q.D * kh)]);
  }
  f.loft([q.W * kw, q.D * kh, q.L * (t1 - t0)], [0, yb + dy, q.L * ((t0 + t1) / 2 - 0.5)], prof, { color: c, parent: 'body', noInk: true, cut: o.cut });
};

const earsOf = (f: M, q: Q, sk: Vec3) => {
  const { l: hl, w: hw, h: hh } = q.head, s0 = q.ear.s, ec = q.ear.c ?? q.head.c ?? q.neck.c ?? q.c, tilt = q.ear.tilt ?? 0;
  f.pair((s) => {
    const name = s > 0 ? 'earL' : 'earR';
    switch (q.ear.k) {
      case 'prick': {
        const base: Vec3 = [s * hw * 0.27, sk[1] + hh * 0.36, sk[2] - hl * 0.12];
        f.pyramid([s0 * 0.66, s0, s0 * 0.44], add3(base, [s * s0 * 0.1, s0 * 0.42, 0]), 3, { color: ec, rot: [-8 - tilt, 0, -s * (14 + tilt)], name, parent: 'head', pivot: base });
        if (q.ear.in) f.pyramid([s0 * 0.36, s0 * 0.66, s0 * 0.1], add3(base, [s * s0 * 0.1, s0 * 0.34, s0 * 0.1]), 3, { color: q.ear.in, rot: [-8 - tilt, 0, -s * (14 + tilt)], parent: name, noInk: true });
        break;
      }
      case 'fold': {
        // pricked at the base, the tip folded forward (collie, pit bull "rose" ears)
        const base: Vec3 = [s * hw * 0.28, sk[1] + hh * 0.36, sk[2] - hl * 0.1];
        f.pyramid([s0 * 0.62, s0 * 0.6, s0 * 0.3], add3(base, [s * s0 * 0.08, s0 * 0.26, 0]), 3, { color: ec, rot: [-6, 0, -s * 16], name, parent: 'head', pivot: base })
          .pyramid([s0 * 0.36, s0 * 0.45, s0 * 0.18], add3(base, [s * s0 * 0.12, s0 * 0.5, s0 * 0.16]), 3, { color: ec, rot: [70, 0, -s * 16], parent: name });
        break;
      }
      case 'drop': {
        const base: Vec3 = [s * hw * 0.42, sk[1] + hh * 0.3, sk[2] - hl * 0.06];
        f.ball([s0 * 0.22, s0, s0 * 0.58], add3(base, [s * s0 * 0.1, -s0 * 0.42, s0 * 0.04]), { color: ec, rot: [6, 0, s * (10 + tilt)], name, parent: 'head', pivot: base });
        break;
      }
      case 'round': {
        const base: Vec3 = [s * hw * 0.34, sk[1] + hh * 0.36, sk[2] - hl * 0.1];
        f.ball([s0, s0, s0 * 0.42], add3(base, [s * s0 * 0.12, s0 * 0.32, 0]), { color: ec, rot: [0, 0, -s * 20], name, parent: 'head', pivot: base });
        if (q.ear.in) f.ball([s0 * 0.58, s0 * 0.58, s0 * 0.14], add3(base, [s * s0 * 0.12, s0 * 0.3, s0 * 0.16]), { color: q.ear.in, rot: [0, 0, -s * 20], parent: name, noInk: true });
        break;
      }
      case 'long': {
        const base: Vec3 = [s * hw * 0.24, sk[1] + hh * 0.38, sk[2] - hl * 0.16];
        f.ball([s0 * 0.36, s0, s0 * 0.24], add3(base, [s * s0 * 0.16, s0 * 0.44, -s0 * 0.04]), { color: ec, rot: [-10 - tilt, 0, -s * (20 + tilt)], name, parent: 'head', pivot: base });
        if (q.ear.in) f.ball([s0 * 0.2, s0 * 0.72, s0 * 0.08], add3(base, [s * s0 * 0.16, s0 * 0.44, s0 * 0.06]), { color: q.ear.in, rot: [-10 - tilt, 0, -s * (20 + tilt)], parent: name, noInk: true });
        break;
      }
      case 'side': {
        const base: Vec3 = [s * hw * 0.44, sk[1] + hh * 0.18, sk[2] - hl * 0.12];
        f.ball([s0, s0 * 0.42, s0 * 0.26], add3(base, [s * s0 * 0.42, s0 * 0.08, 0]), { color: ec, rot: [0, -s * 10, s * (12 + tilt)], name, parent: 'head', pivot: base });
        if (q.ear.in) f.ball([s0 * 0.62, s0 * 0.24, s0 * 0.08], add3(base, [s * s0 * 0.44, s0 * 0.08, s0 * 0.1]), { color: q.ear.in, rot: [0, -s * 10, s * (12 + tilt)], parent: name, noInk: true });
        break;
      }
      case 'tiny': {
        const base: Vec3 = [s * hw * 0.36, sk[1] + hh * 0.3, sk[2] - hl * 0.16];
        f.ball([s0, s0 * 0.8, s0 * 0.5], add3(base, [s * s0 * 0.2, s0 * 0.2, 0]), { color: ec, name, parent: 'head', pivot: base });
        break;
      }
    }
  });
};

const tailOf = (f: M, q: Q, tj: Vec3) => {
  const t = q.tail, tc = t.c ?? q.c, a = (t.a * Math.PI) / 180;
  const dir = (r: number): Vec3 => [0, Math.cos(r), -Math.sin(r)];
  const at = (p: Vec3, r: number, len: number): Vec3 => add3(p, mul(dir(r), len));
  switch (t.k) {
    case 'long':
    case 'whip': {
      const m1 = at(tj, a, t.l * 0.55), end = at(m1, a + 0.45, t.l * 0.45);
      f.rod(tj, m1, t.w, tc, { name: 'tail', parent: 'body', pivot: tj }).rod(m1, end, t.w * (t.k === 'whip' ? 0.5 : 0.8), t.tip ?? tc, { parent: 'tail' });
      break;
    }
    case 'bushy':
    case 'flat': {
      const mid = at(tj, a, t.l * 0.5);
      f.ball([t.w, t.l, t.k === 'flat' ? t.w * 0.3 : t.w * 0.95], mid, { color: tc, rot: aim(dir(a)), name: 'tail', parent: 'body', pivot: tj });
      if (t.tip) f.ball([t.w * 0.7, t.l * 0.3, t.w * 0.7], at(tj, a, t.l * 0.86), { color: t.tip, rot: aim(dir(a)), parent: 'tail' });
      break;
    }
    case 'curl': {
      // carried up over the back in a ring
      f.torus([t.l, t.l, t.w], [0, tj[1] + t.l * 0.42, tj[2] + t.l * 0.12], { color: tc, rot: [0, 90, 0], tube: 0.42, name: 'tail', parent: 'body', pivot: tj });
      break;
    }
    case 'stub':
      f.ball([t.w, t.l, t.w], at(tj, a, t.l * 0.3), { color: tc, rot: aim(dir(a)), name: 'tail', parent: 'body', pivot: tj });
      break;
    case 'taper': {
      // a thick tail tapering to a point (dinosaurs, kangaroos): a loft along the tail's direction
      f.loft([t.w, t.w, t.l], at(tj, a, t.l * 0.48), [[0, 1, 1, 0], [0.4, 0.66, 0.66, 0], [0.8, 0.3, 0.3, 0], [1, 0.08, 0.08, 0]], { color: tc, rot: [t.a + 90, 0, 0], name: 'tail', parent: 'body', pivot: tj });
      break;
    }
    case 'club': {
      const m1 = at(tj, a, t.l * 0.55), end = at(m1, a + 0.12, t.l * 0.45);
      f.rod(tj, m1, t.w, tc, { name: 'tail', parent: 'body', pivot: tj }).rod(m1, end, t.w * 0.6, tc, { parent: 'tail' }).ball([t.w * 2.6, t.w * 1.5, t.w * 2.2], end, { color: t.tip ?? tc, parent: 'tail' });
      break;
    }
    case 'tuft': {
      const end = at(tj, a, t.l);
      f.rod(tj, end, t.w, tc, { name: 'tail', parent: 'body', pivot: tj }).ball([t.w * 2.4, t.w * 4, t.w * 2.4], at(tj, a, t.l * 0.95), { color: t.tip ?? '#3a2a20', rot: aim(dir(a)), parent: 'tail' });
      break;
    }
  }
};

/* markings */
/** Saddle / back patch from t0 to t1. */
const back = (c: string, t0 = 0.12, t1 = 0.8, kh = 1.04): QMark => (f, d) => coatOf(f, d.q, d.sec, c, t0, t1, { cut: 'top', kh, dy: 0.04 });
/** Patch over the whole flank (both sides) from t0 to t1. */
const patch = (c: string, t0: number, t1: number, dy = 0): QMark => (f, d) => coatOf(f, d.q, d.sec, c, t0, t1, { dy });
/** Pale chest and throat. */
const chest = (c: string): QMark => (f, d) => {
  coatOf(f, d.q, d.sec, c, 0.62, 1, { cut: 'bottom', kw: 0.86, kh: 1.03, dy: -0.05 });
  const n = d.q.neck;
  f.rod(add3(d.nb, [0, -n.w * 0.1, n.w * 0.2]), add3(d.nt, [0, -n.w * 0.15, n.w * 0.16]), n.w * 0.82, c, { parent: 'neck', noInk: true });
};
/** Spots on the flanks and back (dalmatian, cheetah, giraffe, fawn). */
const spotsQ = (c: string, n: number, r: number, o: { seed?: number; t0?: number; t1?: number; lo?: number; hi?: number; flat?: number; neck?: number } = {}): QMark => (f, d) => {
  let s = o.seed ?? 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const t0 = o.t0 ?? 0.08, t1 = o.t1 ?? 0.9, lo = o.lo ?? -20, hi = o.hi ?? 80;
  for (let i = 0; i < n; i++) {
    const t = t0 + (t1 - t0) * rnd(), th = ((lo + (hi - lo) * rnd()) * Math.PI) / 180, side = i % 2 ? 1 : -1;
    const [w, h, cy] = d.sec(t), k = 0.7 + rnd() * 0.6;
    const nx = Math.cos(th), ny = Math.sin(th);
    f.ball([r * k * (o.flat ?? 0.45) + r * k * 0.55 * Math.abs(ny), r * k * (0.6 + 0.4 * Math.abs(nx)), r * k * 1.1], [side * w * nx * 0.99, cy + h * ny * 0.99, d.z(t)], { color: c, parent: 'body', noInk: true });
  }
  const nn = o.neck ?? 0;
  for (let i = 0; i < nn; i++) {
    const u = (i + 0.5) / nn, p = add3(mul(d.nb, 1 - u), mul(d.nt, u)), side = i % 2 ? 1 : -1;
    f.ball([r * 0.5, r * 0.8, r * 0.9], [side * d.q.neck.w * 0.44, p[1] + (rnd() - 0.5) * r, p[2] + (rnd() - 0.5) * r], { color: c, parent: 'neck', noInk: true });
  }
};
/** Something on the head, in head fractions from the skull centre (x across, y up, z forward). */
const onHead = (c: string, s: Vec3, a: Vec3, o: { shape?: 'ball' | 'cyl' | 'box'; rot?: Vec3; ink?: boolean; taper?: number; mirror?: boolean } = {}): QMark => (f, d) => {
  const { l, w, h } = d.q.head;
  for (const k of o.mirror ? [1, -1] : [1])
    f.part(o.shape ?? 'ball', [w * s[0], h * s[1], l * s[2]], add3(d.sk, [k * w * a[0], h * a[1], l * a[2]]), { color: c, parent: 'head', noInk: !o.ink, rot: o.rot ? [o.rot[0], o.rot[1] * k, o.rot[2] * k] : undefined, taper: o.taper, round: 0.8 });
};
/** White stripe down the face (blaze). */
const blazeQ = (c: string, k = 1): QMark => (f, d) => {
  const { l, w, h } = d.q.head;
  f.ball([w * 0.2 * k, h * 0.5, l * 0.4], add3(d.sk, [0, h * 0.28, l * 0.36]), { color: c, parent: 'head', noInk: true, rot: [-28, 0, 0] });
};
/** Muzzle-and-face mask in another colour (husky white face, shepherd black mask). */
const faceQ = (c: string, k = 1): QMark => (f, d) => {
  const { l, w, h } = d.q.head;
  f.ball([w * 0.9 * k, h * 0.62 * k, l * 0.6], add3(d.sk, [0, -h * 0.1, l * 0.3]), { color: c, parent: 'head', noInk: true });
};
/** Lower legs in another colour (socks / stockings) up to `up` of the leg. */
const socksQ = (c: string, up = 0.3, legs = 'FL,FR,BL,BR'): QMark => (f, d) => {
  const lw = d.q.leg.w, hgt = (d.q.H - d.q.D) * up + lw;
  for (const n of legs.split(',')) {
    const s = n[1] === 'L' ? 1 : -1, x = s * d.q.W * 0.3, zz = n[0] === 'F' ? d.q.L * 0.31 + lw * 0.15 : -d.q.L * 0.32 - lw * 0.1;
    f.capsule([lw * 1.12, hgt, lw * 1.12], [x, hgt / 2, zz], { color: c, parent: 'leg' + n, noInk: true });
    if (!d.q.leg.hoof) f.ball([lw * 1.4, lw * 0.85, lw * 1.85], [x, lw * 0.4, zz + lw * 0.32], { color: c, parent: 'leg' + n, noInk: true });
  }
};
/** A collar round the neck. */
const collarQ = (c: string, tag?: string): QMark => (f, d) => {
  const n = d.q.neck, p = add3(mul(d.nb, 0.35), mul(d.nt, 0.65));
  f.torus([n.w * 1.18, n.w * 1.18, n.w * 0.3], p, { color: c, rot: [90 - n.lean, 0, 0], tube: 0.2, parent: 'neck', edge: 'sharp' });
  if (tag) f.cyl([n.w * 0.3, n.w * 0.06, n.w * 0.3], add3(p, [0, -n.w * 0.62, n.w * 0.2]), { color: tag, rot: [80, 0, 0], parent: 'neck', edge: 'sharp' });
};
/** Ruff of long fur round the neck (collie, lion-ish). */
const ruffQ = (c: string, k = 1): QMark => (f, d) => {
  const n = d.q.neck, p = add3(mul(d.nb, 0.6), mul(d.nt, 0.4));
  f.ball([n.w * 1.75 * k, n.w * 1.9 * k, n.w * 1.7 * k], add3(p, [0, -n.w * 0.15, n.w * 0.2]), { color: c, parent: 'neck' });
};
/** Antlers: a beam curving up and forward from each side of the crown, with tines (deer, elk). */
const antlersQ = (c: string, sz: number, tines = 3): QMark => (f, d) => {
  const { l, w, h } = d.q.head, t = sz * 0.055;
  f.pair((s) => {
    const b: Vec3 = add3(d.sk, [s * w * 0.26, h * 0.42, -l * 0.06]);
    const p1 = add3(b, [s * sz * 0.28, sz * 0.42, -sz * 0.18]), p2 = add3(p1, [s * sz * 0.08, sz * 0.4, sz * 0.22]), p3 = add3(p2, [-s * sz * 0.06, sz * 0.18, sz * 0.26]);
    f.rod(b, p1, t, c, { parent: 'head' }).rod(p1, p2, t * 0.9, c, { parent: 'head' }).rod(p2, p3, t * 0.75, c, { parent: 'head' });
    f.rod(add3(b, [s * sz * 0.04, sz * 0.08, 0]), add3(b, [s * sz * 0.06, sz * 0.2, sz * 0.2]), t * 0.7, c, { parent: 'head' });
    for (let i = 0; i < tines; i++) {
      const u = (i + 0.6) / (tines + 0.2), p = i < tines / 2 ? add3(mul(p1, 1 - u * 2), mul(p2, u * 2)) : add3(mul(p2, 2 - u * 2), mul(p3, u * 2 - 1));
      f.rod(p, add3(p, [s * sz * 0.02, sz * 0.3, sz * 0.04]), t * 0.6, c, { parent: 'head' });
    }
  });
};
/** Horns from the crown: curved up and out (cattle, buffalo), back (goats, antelope), or short knobs (giraffe). */
const hornsQ = (c: string, len: number, kind: 'cow' | 'back' | 'knob' | 'lyre' | 'hook', thick = 0.22): QMark => (f, d) => {
  const { l, w, h } = d.q.head, t = len * thick;
  f.pair((s) => {
    const b: Vec3 = add3(d.sk, [s * w * (kind === 'knob' ? 0.2 : 0.34), h * 0.4, -l * (kind === 'knob' ? 0.05 : 0.1)]);
    if (kind === 'knob') return void f.cyl([t, len, t], add3(b, [0, len / 2, 0]), { color: c, taper: 0.7, parent: 'head' }).ball([t * 1.3, t * 1.1, t * 1.3], add3(b, [0, len, 0]), { color: '#2a2018', parent: 'head' });
    const pts: Vec3[] =
      kind === 'cow' ? [b, add3(b, [s * len * 0.5, len * 0.1, len * 0.05]), add3(b, [s * len * 0.8, len * 0.45, len * 0.12]), add3(b, [s * len * 0.72, len * 0.8, len * 0.05])]
      : kind === 'hook' ? [b, add3(b, [s * len * 0.55, -len * 0.05, 0]), add3(b, [s * len * 0.8, len * 0.3, len * 0.05]), add3(b, [s * len * 0.6, len * 0.55, len * 0.1])]
      : kind === 'lyre' ? [b, add3(b, [s * len * 0.15, len * 0.4, -len * 0.15]), add3(b, [s * len * 0.28, len * 0.7, -len * 0.05]), add3(b, [s * len * 0.2, len * 1.0, len * 0.08])]
      : [b, add3(b, [s * len * 0.08, len * 0.45, -len * 0.25]), add3(b, [s * len * 0.12, len * 0.72, -len * 0.62]), add3(b, [s * len * 0.12, len * 0.68, -len * 0.92])];
    for (let i = 0; i < 3; i++) f.rod(pts[i], pts[i + 1], t * (1 - i * 0.28), c, { parent: 'head' });
  });
};
/** A mane along the top of the neck (donkey, horse, zebra), or a crest of hair. */
const maneQ = (c: string, k = 1): QMark => (f, d) => {
  const w = d.q.neck.w, lean = (d.q.neck.lean * Math.PI) / 180;
  const off: Vec3 = [0, w * 0.4 * Math.sin(lean) * k, -w * 0.4 * Math.cos(lean) * k];
  f.rod(add3(d.nb, add3(off, [0, w * 0.2, -w * 0.1])), add3(d.nt, off), w * 0.36 * k, c, { parent: 'neck' });
};
/** Studs, plates or spikes standing out of the body surface: rows of [angle up from the side (deg), count, size, kind]. */
const studs = (c: string, rows: Array<[number, number, number, 'cone' | 'plate' | 'knob']>, t0 = 0.12, t1 = 0.9): QMark => (f, d) => {
  for (const [deg, n, sz, k] of rows)
    for (let i = 0; i < n; i++) {
      const t = t0 + ((t1 - t0) * i) / Math.max(1, n - 1), [w, h, cy] = d.sec(t), a = (deg * Math.PI) / 180;
      for (const s of deg >= 89 ? [0] : [1, -1]) {
        const nx = s * Math.cos(a), ny = Math.sin(a), at: Vec3 = [nx * w * 0.96, cy + ny * h * 0.96, d.z(t)];
        if (k === 'knob') f.ball([sz, sz * 0.7, sz], at, { color: c, parent: 'body', rot: aim([nx, ny, 0]) });
        else f.pyramid(k === 'plate' ? [sz * 1.1, sz * 0.5, sz * 1.1] : [sz * 0.55, sz, sz * 0.55], add3(at, [nx * sz * 0.3, ny * sz * 0.3, 0]), k === 'plate' ? 6 : 5, { color: c, parent: 'body', rot: aim([nx, ny, 0]) });
      }
    }
};
/** Front teeth showing under the muzzle (beavers, rodents). */
const teethQ = (c: string, k = 1): QMark => (f, d) => {
  const { l: ml, w: mw, h: mh } = d.q.muz;
  f.box([mw * 0.36 * k, mh * 0.42 * k, mw * 0.1 * k], [0, d.mz[1] - mh * 0.46, d.mz[2] + ml * 0.4], { color: c, parent: 'head', round: 0.3 });
};
/** A long tongue hidden in the mouth until an act shows it (scale 0 at rest). */
const tongueQ = (c: string, len: number): QMark => (f, d) => {
  const { l: ml, h: mh } = d.q.muz, a: Vec3 = [0, d.mz[1] - mh * 0.2, d.mz[2] + ml * 0.42];
  f.rod(a, add3(a, [0, -len * 0.2, len]), mh * 0.32, c, { name: 'tongue', parent: 'head', scale: 0 });
};
/** Muscled upper legs for long-legged animals (horses, giraffes, camels, cattle), so the legs are not sticks: a
 *  forearm tapering from the chest to a knobbly knee in front, a gaskin from the stifle to the hock behind, k leg
 *  widths thick at the top. Same frame and joints as q4's legs, so they swing with them. */
const limbsQ = (k = 1.7, c?: string): QMark => (f, d) => {
  const { H, D, W, L, leg } = d.q, lw = leg.w, uc = c ?? leg.c ?? d.q.c, low = leg.low ?? uc;
  const footTop = leg.hoof ? lw * 1.25 : lw * 0.55, hockY = Math.max(lw * 1.6, (H - D) * 0.42 * (leg.hock ?? 1));
  const cone = (a: Vec3, b: Vec3, t0: number, t1: number, col: string, parent: string) => {
    const dv: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    f.cyl([t0, Math.hypot(dv[0], dv[1], dv[2]), t0 * 1.12], mul(add3(a, b), 0.5), { color: col, rot: aim(dv), taper: t1 / t0, parent });
  };
  f.pair((s) => {
    const x = s * W * 0.3, sd = s > 0 ? 'L' : 'R', fz = L * 0.31, bz = -L * 0.32;
    // front: the rod runs from (H - 0.95 D, fz) to (footTop, fz + 0.15 lw); the knee sits a little under halfway
    const ky = footTop + (H - D * 0.95 - footTop) * 0.42, kz = fz + lw * 0.15 * 0.58;
    cone([x, H - D * 0.78, fz - lw * 0.05], [x, ky + lw * 0.2, kz], lw * k, lw * 1.05, uc, 'legF' + sd);
    f.ball([lw * 1.18, lw * 1.45, lw * 1.3], [x, ky, kz + lw * 0.06], { color: low, parent: 'legF' + sd });
    // back: gaskin from the stifle down the rod to the hock
    const stifle = Math.max(hockY + lw * 1.2, d.Hr - D * 1.02);
    cone([x, stifle + lw * 0.5, bz + lw * 0.6], [x, hockY + lw * 0.35, bz - lw * 0.6], lw * k * 1.1, lw * 1.05, uc, 'legB' + sd);
  });
};
/** Scale a recipe; young ones get a bigger head (kh) and shorter muzzle, longer or shorter legs (kl). */
const grow = (q: Q, k: number, kh = 1, kl = 1): Q => ({
  ...q,
  H: q.D * k + (q.H - q.D) * k * kl,
  L: q.L * k,
  D: q.D * k,
  W: q.W * k,
  hump: q.hump ? q.hump * k * 0.6 : undefined,
  neck: { ...q.neck, l: q.neck.l * k, w: q.neck.w * k },
  head: { ...q.head, l: q.head.l * k * kh, w: q.head.w * k * kh, h: q.head.h * k * kh },
  muz: { ...q.muz, l: q.muz.l * k * kh * (kh > 1 ? 0.72 : 1), w: q.muz.w * k * kh, h: q.muz.h * k * kh },
  eye: { ...q.eye, k: (q.eye?.k ?? 1) * (kh > 1 ? 1.2 : 1) },
  ear: { ...q.ear, s: q.ear.s * k * kh },
  leg: { ...q.leg, w: q.leg.w * k },
  tail: { ...q.tail, l: q.tail.l * k, w: q.tail.w * k },
});
const QK = (key: string, q: Q, ...marks: QMark[]): Figure => q4(key, q, ...marks).done();

/* ----- birds, sculpted ---------------------------------------------------------------------------------------
 * A teardrop body tilted up by `up` degrees, a head on a short neck, a beak of the right kind with a lower
 * mandible that opens (jaw), folded wings along the sides with darker primaries (wingL/R, pivoting at the
 * shoulder so they flap), a tail of the right shape, and legs with toes. Built once at a nominal size and then
 * scaled so the top of the head is at H. Joint names are the bird kit's (body, head, wingL/R, tail, legL/R).
 */
interface AV {
  H: number;
  c: string;
  belly?: string;
  wing?: string;
  tip?: string;
  tail?: string;
  head?: string;
  beak: string;
  legs: string;
  /** Body length / H, depth / length, tilt up (deg), neck length / H, head size. */
  len?: number;
  fat?: number;
  up?: number;
  neck?: number;
  hk?: number;
  /** Beak length / H, kind, base thickness. */
  bl: number;
  bk?: 'cone' | 'hook' | 'flat' | 'needle' | 'dagger' | 'parrot' | 'down';
  bw?: number;
  /** Hip height / H, leg thickness. */
  leg: number;
  lw?: number;
  /** Tail length / H and kind; wing length / body length. */
  tl: number;
  tk?: 'fan' | 'fork' | 'wedge' | 'long' | 'stub' | 'spike';
  wl?: number;
  eye?: string;
}
interface AVD {
  o: AV;
  S: number;
  C: Vec3;
  bw: number;
  bh: number;
  bl: number;
  hc: Vec3;
  hr: number;
  /** Body-local (across, along the body's up, along the body forward) to figure space. */
  at: (x: number, a: number, b: number) => Vec3;
}
type AVMark = (f: M, d: AVD) => void;

const avBuild = (key: string, o: AV, S: number, marks: AVMark[]): M => {
  const f = m(key, { view: 'side', rig: 'bird' });
  const a = ((o.up ?? 32) * Math.PI) / 180;
  const u: Vec3 = [0, Math.sin(a), Math.cos(a)], v: Vec3 = [0, Math.cos(a), -Math.sin(a)];
  const bl = (o.len ?? 0.56) * S, bh = bl * (o.fat ?? 0.58), bw = bh * 0.92;
  const hipY = o.leg * S;
  const C: Vec3 = add3([0, hipY, 0], add3(mul(v, 0.3 * bh), mul(u, 0.02 * bl)));
  const at = (x: number, aa: number, b: number): Vec3 => add3(add3(C, [x, 0, 0]), add3(mul(v, aa), mul(u, b)));
  const c = o.c;
  f.loft([bw, bh, bl], C, [[0, 0.3, 0.32, 0.06], [0.25, 0.74, 0.76, 0.02], [0.58, 1, 1, 0], [0.84, 0.94, 0.92, 0.02], [1, 0.5, 0.52, 0.1]], { color: c, rot: [-(o.up ?? 32), 0, 0], name: 'body' });
  if (o.belly) f.loft([bw * 0.86, bh * 1.03, bl * 0.8], add3(C, add3(mul(v, -0.05 * bh), mul(u, 0.06 * bl))), [[0, 0.5, 0.6, 0], [0.4, 0.95, 0.95, 0], [0.75, 1, 0.95, 0], [1, 0.55, 0.55, 0.08]], { color: o.belly, rot: [-(o.up ?? 32), 0, 0], cut: 'bottom', parent: 'body', noInk: true });
  // head on a short neck
  const hr = 0.105 * S * (o.hk ?? 1);
  const nb = at(0, 0.3 * bh, 0.34 * bl);
  const hc: Vec3 = add3(nb, [0, (o.neck ?? 0.05) * S + hr * 0.5, hr * 0.32]);
  const hcol = o.head ?? c;
  f.ball([hr * 1.8, hr * 1.85, hr * 2.05], hc, { color: hcol, name: 'head', parent: 'body', pivot: nb }).rod(nb, add3(hc, [0, -hr * 0.3, -hr * 0.2]), hr * 1.25, hcol, { parent: 'head' });
  f.pair((s) =>
    f.ball(hr * 0.34, add3(hc, [s * hr * 0.74, hr * 0.18, hr * 0.42]), { color: o.eye ?? '#1d1a17', eye: true, parent: 'head', noInk: true })
      .ball(hr * 0.1, add3(hc, [s * hr * 0.86, hr * 0.27, hr * 0.5]), { color: '#ffffff', eye: true, parent: 'head', noInk: true }),
  );
  // beak: upper part and a lower mandible (jaw) that opens
  const L = o.bl * S, bwk = o.bw ?? 1, b0: Vec3 = add3(hc, [0, -hr * 0.1, hr * 0.86]);
  const bc = o.beak;
  switch (o.bk ?? 'cone') {
    case 'cone':
    case 'dagger':
      f.cone([hr * 0.66 * bwk, L, hr * 0.46 * bwk], add3(b0, [0, hr * 0.08, L * 0.46]), { color: bc, rot: [92, 0, 0], parent: 'head' })
        .cone([hr * 0.56 * bwk, L * 0.9, hr * 0.3 * bwk], add3(b0, [0, -hr * 0.14, L * 0.42]), { color: bc, rot: [96, 0, 0], name: 'jaw', parent: 'head', pivot: add3(b0, [0, -hr * 0.12, 0]) });
      break;
    case 'needle':
      f.cyl([hr * 0.22 * bwk, L, hr * 0.22 * bwk], add3(b0, [0, 0, L * 0.5]), { color: bc, rot: [93, 0, 0], taper: 0.4, parent: 'head' })
        .cyl([hr * 0.16 * bwk, L * 0.92, hr * 0.14 * bwk], add3(b0, [0, -hr * 0.1, L * 0.47]), { color: bc, rot: [95, 0, 0], taper: 0.4, name: 'jaw', parent: 'head', pivot: add3(b0, [0, -hr * 0.08, 0]) });
      break;
    case 'down':
      f.rod(b0, add3(b0, [0, -L * 0.25, L * 0.55]), hr * 0.3 * bwk, bc, { parent: 'head' }).rod(add3(b0, [0, -L * 0.25, L * 0.55]), add3(b0, [0, -L * 0.62, L * 0.86]), hr * 0.2 * bwk, bc, { parent: 'head' })
        .rod(add3(b0, [0, -hr * 0.12, 0]), add3(b0, [0, -L * 0.3, L * 0.5]), hr * 0.18 * bwk, bc, { name: 'jaw', parent: 'head', pivot: add3(b0, [0, -hr * 0.12, 0]) });
      break;
    case 'flat':
      f.ball([hr * 1.0 * bwk, hr * 0.32, L * 1.05], add3(b0, [0, -hr * 0.02, L * 0.46]), { color: bc, parent: 'head' })
        .ball([hr * 0.9 * bwk, hr * 0.2, L * 0.95], add3(b0, [0, -hr * 0.22, L * 0.42]), { color: bc, name: 'jaw', parent: 'head', pivot: add3(b0, [0, -hr * 0.18, 0]) })
        .ball([hr * 0.3, hr * 0.12, L * 0.18], add3(b0, [0, hr * 0.1, L * 0.88]), { color: '#2a2420', parent: 'head', noInk: true });
      break;
    case 'hook':
    case 'parrot': {
      const big = o.bk === 'parrot' ? 1.35 : 1;
      f.cyl([hr * 0.7 * bwk * big, L * 0.8, hr * 0.6 * bwk * big], add3(b0, [0, hr * 0.1, L * 0.36]), { color: bc, rot: [94, 0, 0], taper: 0.5, parent: 'head' })
        .cone([hr * 0.38 * bwk * big, L * 0.52, hr * 0.32 * bwk * big], add3(b0, [0, -L * 0.2, L * 0.84]), { color: bc, rot: [160, 0, 0], parent: 'head' })
        .cone([hr * 0.5 * bwk * big, L * 0.6, hr * 0.4 * bwk * big], add3(b0, [0, -hr * 0.22 * big, L * 0.3]), { color: bc, rot: [100, 0, 0], name: 'jaw', parent: 'head', pivot: add3(b0, [0, -hr * 0.15, 0]) });
      break;
    }
  }
  // wings folded along the sides, darker primaries crossing over the tail
  const wl = (o.wl ?? 0.85) * bl, wc = o.wing ?? c;
  f.pair((s) => {
    const name = s > 0 ? 'wingL' : 'wingR';
    f.ball([bw * 0.2, bh * 0.62, wl], at(s * bw * 0.44, 0.1 * bh, 0.3 * bl - wl * 0.5), { color: wc, rot: [-(o.up ?? 32) + 6, -s * 3, 0], name, parent: 'body', pivot: at(s * bw * 0.4, 0.26 * bh, 0.28 * bl) })
      .ball([bw * 0.13, bh * 0.32, wl * 0.6], at(s * bw * 0.42, 0.06 * bh, 0.3 * bl - wl * 0.86), { color: o.tip ?? wc, rot: [-(o.up ?? 32) + 4, -s * 4, 0], parent: name });
  });
  // tail
  const tl = o.tl * S, tc = o.tail ?? o.wing ?? c, rp = at(0, 0.06 * bh, -0.42 * bl), back = mul(u, -1);
  const tk = o.tk ?? 'fan';
  const tcen = add3(rp, add3(mul(back, tl * 0.44), [0, -tl * 0.05, 0]));
  if (tk === 'fork' || tk === 'spike') {
    f.ball([bw * 0.24, bh * 0.08, tl * 0.5], add3(rp, mul(back, tl * 0.2)), { color: tc, rot: [-(o.up ?? 32) + 8, 0, 0], name: 'tail', parent: 'body', pivot: rp });
    f.pair((s) => f.ball([bw * 0.2, bh * 0.06, tl], add3(tcen, [s * bw * 0.12, 0, 0]), { color: tc, rot: [-(o.up ?? 32) + 8, s * (tk === 'fork' ? 12 : 3), 0], parent: 'tail' }));
  } else {
    const wide = tk === 'fan' ? 0.75 : tk === 'wedge' ? 0.55 : tk === 'long' ? 0.32 : 0.45;
    f.ball([bw * wide, bh * 0.1, tk === 'stub' ? tl * 0.6 : tl], tcen, { color: tc, rot: [-(o.up ?? 32) + 12, 0, 0], name: 'tail', parent: 'body', pivot: rp });
  }
  // legs: feathered thigh, bare shank, three toes forward and one back
  const lw = 0.03 * S * (o.lw ?? 1), lc = o.legs;
  f.pair((s) => {
    const name = s > 0 ? 'legL' : 'legR', x = s * bw * 0.22;
    const hip: Vec3 = [x, hipY, 0.02 * bl], ank: Vec3 = [x, lw * 0.6, 0.03 * bl];
    f.ball([bw * 0.3, bh * 0.36, bh * 0.36], add3(hip, [0, bh * 0.08, 0]), { color: o.belly ?? c, name, parent: 'body', pivot: hip })
      .rod(hip, ank, lw, lc, { parent: name });
    for (const k of [-1, 0, 1]) f.rod(ank, add3(ank, [k * lw * 1.6, -lw * 0.3, lw * 3.4 - Math.abs(k) * lw * 0.6]), lw * 0.7, lc, { parent: name });
    f.rod(ank, add3(ank, [0, -lw * 0.3, -lw * 2]), lw * 0.6, lc, { parent: name });
  });
  const d: AVD = { o, S, C, bw, bh, bl, hc, hr, at };
  for (const mk of marks) mk(f, d);
  return f;
};
/** A bird `o.H` tall (top of the head), with marks. */
const av = (key: string, o: AV, ...marks: AVMark[]): M => {
  const h1 = avBuild(key, o, o.H, marks).done().heightM;
  return avBuild(key, o, (o.H * o.H) / h1, marks);
};
const AVK = (key: string, o: AV, ...marks: AVMark[]): Figure => av(key, o, ...marks).done();
/* bird marks, in head radii from the head centre (x across, y up, z forward) */
const avHead = (c: string, s: Vec3, a: Vec3, o: { mirror?: boolean; rot?: Vec3; shape?: 'ball' | 'cyl'; taper?: number; ink?: boolean } = {}): AVMark => (f, d) => {
  for (const k of o.mirror ? [1, -1] : [1])
    f.part(o.shape ?? 'ball', mul(s, d.hr), add3(d.hc, [k * a[0] * d.hr, a[1] * d.hr, a[2] * d.hr]), { color: c, parent: 'head', noInk: !o.ink, rot: o.rot ? [o.rot[0], o.rot[1] * k, o.rot[2] * k] : undefined, taper: o.taper });
};
/** A crest of n feathers swept back from the crown, on a joint named crest so it can be raised. */
const avCrest = (c: string, k = 1, n = 3, sweep = -30): AVMark => (f, d) => {
  const base = add3(d.hc, [0, d.hr * 0.85, -d.hr * 0.1]);
  for (let i = 0; i < n; i++) f.cone([d.hr * 0.38 * k, d.hr * 1.3 * k, d.hr * 0.22 * k], add3(d.hc, [0, d.hr * (0.95 + 0.4 * k), -d.hr * (0.1 + i * 0.32 * k)]), { color: c, rot: [sweep - i * 18, 0, 0], ...(i ? { parent: 'crest' } : { name: 'crest', parent: 'head', pivot: base }) });
};
/** Patch on the breast / throat, in body-local fractions. */
const avPatch = (c: string, s: Vec3, a: Vec3): AVMark => (f, d) => f.ball([d.bw * s[0], d.bh * s[1], d.bl * s[2]], d.at(0, d.bh * a[1], d.bl * a[2]), { color: c, parent: 'body', noInk: true, rot: [-(d.o.up ?? 25), 0, 0] });

/* ----- fish, sharks and whales, sculpted ------------------------------------------------------------------------
 * A lofted body from the tail stalk to the snout, a tail fin of the right kind (forked, fan, crescent, a shark's
 * long upper lobe, or a whale's flat flukes), a swept dorsal fin, pectoral fins (finL/R) and a jaw. Joint names
 * are the fish kit's (body, tail, finL/R, dorsal), so it swims and flips.
 */
interface FI {
  L: number;
  c: string;
  belly?: string;
  fin?: string;
  /** Body height and width as fractions of L. */
  h: number;
  w?: number;
  shape?: 'torpedo' | 'deep' | 'round' | 'long' | 'eel' | 'shark' | 'whale' | 'blunt';
  tail?: 'fork' | 'fan' | 'round' | 'moon' | 'point' | 'flukes' | 'shark';
  /** Tail fin length / L; dorsal height (fraction of body height, 0 none), its place (t) and length / L. */
  tl?: number;
  dorsal?: number;
  dz?: number;
  dl?: number;
  anal?: number;
  /** How far the dorsal and anal fins sweep back (wedge apex, 0 upright .. 0.5). */
  sw?: number;
  pec?: number;
  /** Pectoral fin (flipper) colour. */
  pecC?: string;
  pz?: number;
  eye?: number;
  ez?: number;
  mouth?: string;
}
interface FID {
  o: FI;
  y0: number;
  Lb: number;
  H: number;
  W: number;
  /** Body section at t (0 tail end .. 1 snout): half width, half height, centre y. */
  sec: (t: number) => [number, number, number];
  z: (t: number) => number;
}
type FIMark = (f: M, d: FID) => void;
const FPROF: Record<NonNullable<FI['shape']>, Array<[number, number, number, number]>> = {
  torpedo: [[0, 0.12, 0.22, 0], [0.1, 0.24, 0.36, 0], [0.4, 0.8, 0.88, 0.01], [0.65, 1, 1, 0], [0.86, 0.84, 0.84, -0.02], [0.97, 0.46, 0.5, -0.05], [1, 0.16, 0.22, -0.06]],
  deep: [[0, 0.14, 0.18, 0], [0.12, 0.3, 0.38, 0], [0.42, 0.85, 0.94, 0], [0.62, 1, 1, 0], [0.84, 0.82, 0.78, -0.02], [1, 0.22, 0.2, -0.08]],
  round: [[0, 0.14, 0.24, 0], [0.14, 0.48, 0.56, 0], [0.48, 1, 1, 0], [0.8, 0.9, 0.88, 0], [0.96, 0.5, 0.48, -0.04], [1, 0.22, 0.24, -0.06]],
  long: [[0, 0.1, 0.18, 0], [0.18, 0.55, 0.6, 0], [0.5, 1, 1, 0], [0.86, 0.86, 0.82, 0], [0.98, 0.3, 0.3, -0.06], [1, 0.12, 0.14, -0.06]],
  eel: [[0, 0.12, 0.6, 0], [0.2, 0.55, 0.85, 0], [0.6, 1, 1, 0], [0.9, 0.9, 0.85, 0], [1, 0.42, 0.42, -0.04]],
  shark: [[0, 0.1, 0.16, 0.06], [0.12, 0.26, 0.34, 0.03], [0.45, 0.88, 0.94, 0], [0.66, 1, 1, 0], [0.86, 0.74, 0.74, 0.04], [0.96, 0.36, 0.38, 0.08], [1, 0.12, 0.14, 0.1]],
  whale: [[0, 0.1, 0.14, 0.04], [0.1, 0.22, 0.28, 0.03], [0.4, 0.86, 0.9, 0], [0.62, 1, 1, 0], [0.84, 0.9, 0.9, 0], [0.96, 0.66, 0.66, -0.02], [1, 0.34, 0.4, -0.04]],
  blunt: [[0, 0.12, 0.2, 0], [0.12, 0.4, 0.48, 0], [0.45, 0.95, 0.95, 0], [0.75, 1, 1, 0], [0.94, 0.86, 0.82, -0.02], [1, 0.6, 0.55, -0.04]],
};
const fishy = (key: string, o: FI, ...marks: FIMark[]): M => {
  const f = m(key, { view: 'side', rig: 'fish' });
  const L = o.L, tl = o.tl ?? 0.2, Lb = L * (1 - tl * 0.55), H = o.h * L, W = (o.w ?? 0.14) * L;
  const y0 = H * 0.5 + L * 0.04, zc = (L - Lb) / 2 * 0.9;
  const prof = FPROF[o.shape ?? 'torpedo'];
  const sec = (t: number): [number, number, number] => {
    let i = 0;
    while (i < prof.length - 2 && t > prof[i + 1][0]) i++;
    const a = prof[i], b = prof[i + 1], u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    return [((a[1] + (b[1] - a[1]) * u) * W) / 2, ((a[2] + (b[2] - a[2]) * u) * H) / 2, y0 + (a[3] + (b[3] - a[3]) * u) * H];
  };
  const z = (t: number) => zc + Lb * (t - 0.5);
  const fc = o.fin ?? o.c;
  f.loft([W, H, Lb], [0, y0, zc], prof, { color: o.c, name: 'body' });
  if (o.belly) f.loft([W * 0.86, H * 1.03, Lb * 0.86], [0, y0 - H * 0.06, zc + Lb * 0.05], prof.map(([t, w, h, cy]) => [t, w, h, cy] as [number, number, number, number]), { color: o.belly, cut: 'bottom', parent: 'body', noInk: true });
  // tail fin from the tail stalk
  const P: Vec3 = [0, sec(0)[2], z(0) + Lb * 0.02], T = tl * L, th = Math.max(L * 0.008, W * 0.06);
  const tail = o.tail ?? 'fork';
  if (tail === 'flukes') {
    f.ball([W * 0.4, th * 1.6, T * 0.5], add3(P, [0, 0, -T * 0.12]), { color: fc, name: 'tail', parent: 'body', pivot: P });
    f.pair((s) => f.ball([T * 0.42, th * 1.4, T * 0.62], add3(P, [s * T * 0.36, 0, -T * 0.42]), { color: fc, rot: [0, -s * 42, 0], parent: 'tail' }));
  } else if (tail === 'fan') {
    f.ball([th, T * 0.3, T * 0.4], add3(P, [0, 0, -T * 0.12]), { color: fc, name: 'tail', parent: 'body', pivot: P });
    for (const k of [1, -1]) f.ball([th, T * 0.62, T * 0.92], add3(P, [0, k * T * 0.2, -T * 0.42]), { color: fc, rot: [k * 16, 0, 0], parent: 'tail' });
  } else if (tail === 'round') {
    f.ball([th, T * 0.85, T], add3(P, [0, 0, -T * 0.42]), { color: fc, name: 'tail', parent: 'body', pivot: P });
  } else if (tail === 'point') {
    f.ball([th, H * 0.5, T], add3(P, [0, 0, -T * 0.4]), { color: fc, name: 'tail', parent: 'body', pivot: P });
  } else {
    const up = tail === 'shark' ? 1.35 : 1, dn = tail === 'shark' ? 0.6 : 1, ang = tail === 'moon' ? 48 : tail === 'shark' ? 42 : 34, slim = tail === 'moon' || tail === 'shark' ? 0.18 : 0.26;
    f.ball([th, T * slim, T * 0.4], add3(P, [0, 0, -T * 0.12]), { color: fc, name: 'tail', parent: 'body', pivot: P });
    f.ball([th, T * slim, T * up], add3(P, [0, T * up * 0.48 * Math.sin((ang * Math.PI) / 180), -T * up * 0.44 * Math.cos((ang * Math.PI) / 180)]), { color: fc, rot: [ang, 0, 0], parent: 'tail' })
      .ball([th, T * slim, T * dn], add3(P, [0, -T * dn * 0.48 * Math.sin((ang * Math.PI) / 180), -T * dn * 0.44 * Math.cos((ang * Math.PI) / 180)]), { color: fc, rot: [-ang, 0, 0], parent: 'tail' });
  }
  // dorsal and anal fins: thin triangles swept back
  const dh = (o.dorsal ?? 0.5) * H, dt = o.dz ?? 0.55, dl = (o.dl ?? 0.25) * L;
  if (dh > 0) {
    const [, hh, cy] = sec(dt);
    f.wedge([dl, dh, th], [0, cy + hh * 0.92 + dh / 2, z(dt)], { color: fc, rot: [0, 90, 0], apex: o.sw ?? 0.32, name: 'dorsal', parent: 'body' });
  }
  if (o.anal) {
    const at = Math.max(0.12, dt - 0.25), [, hh, cy] = sec(at), ah = o.anal * H;
    f.wedge([dl * (o.sw ? 0.9 : 0.6), ah, th], [0, cy - hh * 0.9 - ah / 2, z(o.sw ? dt : at)], { color: fc, rot: [180, 90, 0], apex: -(o.sw ?? 0.3), parent: 'body' });
  }
  // pectoral fins
  const pk = o.pec ?? 1, pz = o.pz ?? 0.72, [pw, ph, pcy] = sec(pz);
  f.pair((s) => f.ball([th * 1.2 * Math.min(2, pk), H * 0.3 * Math.min(pk, 1.6), L * 0.13 * pk], [s * pw * 0.95, pcy - ph * 0.35, z(pz) - L * 0.04 * pk], { color: o.pecC ?? fc, rot: [30, 0, s * 40], name: s > 0 ? 'finL' : 'finR', parent: 'body', pivot: [s * pw * 0.9, pcy - ph * 0.25, z(pz)] }));
  // eye and jaw
  const ez = o.ez ?? 0.88, [ew, eh, ecy] = sec(ez), er = (o.eye ?? 1) * Math.min(H, L * 0.4) * 0.16;
  f.pair((s) =>
    f.ball([er * 0.7, er, er], [s * ew * 0.86, ecy + eh * 0.25, z(ez)], { color: '#1d1a17', eye: true, parent: 'body', noInk: true })
      .ball(er * 0.34, [s * ew * 0.94, ecy + eh * 0.33, z(ez) + er * 0.2], { color: '#ffffff', eye: true, parent: 'body', noInk: true }),
  );
  const [jw, jh, jcy] = sec(0.96);
  f.ball([jw * 1.3, jh * 0.5, Lb * 0.09], [0, jcy - jh * 0.45, z(0.95)], { color: o.mouth ?? o.belly ?? o.c, name: 'jaw', parent: 'body', pivot: [0, jcy - jh * 0.3, z(0.9)] });
  const d: FID = { o, y0, Lb, H, W, sec, z };
  for (const mk of marks) mk(f, d);
  return f;
};
const FK = (key: string, o: FI, ...marks: FIMark[]): Figure => fishy(key, o, ...marks).done();
/** Bands round the body at the given t (clownfish, angelfish, barracuda bars). */
const fBands = (c: string, ts: number[], k = 0.05, bulge = 1.04): FIMark => (f, d) => {
  for (const t of ts) {
    const [w, h, cy] = d.sec(t);
    f.ball([w * 2 * bulge, h * 2 * bulge, d.o.L * k], [0, cy, d.z(t)], { color: c, parent: 'body', noInk: true });
  }
};
/** Spots or a stripe along the flank. */
const fSpots = (c: string, n: number, r: number, o: { seed?: number; t0?: number; t1?: number; lo?: number; hi?: number } = {}): FIMark => (f, d) => {
  let s = o.seed ?? 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const t = (o.t0 ?? 0.15) + ((o.t1 ?? 0.85) - (o.t0 ?? 0.15)) * rnd(), th = ((o.lo ?? -30) + ((o.hi ?? 70) - (o.lo ?? -30)) * rnd()) * (Math.PI / 180), side = i % 2 ? 1 : -1;
    const [w, h, cy] = d.sec(t), k = 0.7 + rnd() * 0.6;
    f.ball([r * k * 0.5, r * k, r * k * 1.2], [side * w * Math.cos(th) * 0.98, cy + h * Math.sin(th) * 0.98, d.z(t)], { color: c, parent: 'body', noInk: true });
  }
};
const fLine = (c: string, t0: number, t1: number, y: number, k = 0.08): FIMark => (f, d) => {
  const [w, , cy] = d.sec((t0 + t1) / 2);
  f.pair((s) => f.ball([w * 0.3, d.H * k, d.Lb * (t1 - t0)], [s * w * 0.92, cy + d.H * y, d.z((t0 + t1) / 2)], { color: c, parent: 'body', noInk: true }));
};

/* ----- crocodilians and lizards, sculpted ------------------------------------------------------------------------
 * A low lofted body, a long tapering tail (tail, swaying), a head with a snout and a lower jaw that swings open
 * (jaw, a mover), eyes on bumps, and four legs sprawled out to the sides with splayed toes. Nose to +z.
 */
interface RP {
  /** Nose to tail tip, metres; body, tail and head as fractions of it; body width and height / L. */
  L: number;
  bf: number;
  tf: number;
  hf: number;
  w: number;
  h: number;
  c: string;
  belly?: string;
  ridge?: string;
  /** Leg reach / L, thickness / L; snout shape; belly clearance / L. */
  leg: number;
  lw: number;
  snout: 'croc' | 'gator' | 'lizard' | 'blunt';
  cl?: number;
  scutes?: number;
  spines?: number;
  eye?: string;
  ek?: number;
  teeth?: number;
}
interface RPD {
  o: RP;
  y0: number;
  bw: number;
  bh: number;
  hw: number;
  hh: number;
  z0: number;
  z1: number;
  zh: number;
  zt: number;
}
type RPMark = (f: M, d: RPD) => void;
const HEADP: Record<RP['snout'], Array<[number, number, number, number]>> = {
  croc: [[0, 0.9, 1, 0.05], [0.22, 1, 0.92, 0.04], [0.38, 0.62, 0.55, -0.12], [0.85, 0.46, 0.38, -0.18], [0.95, 0.5, 0.36, -0.18], [1, 0.3, 0.26, -0.18]],
  gator: [[0, 0.9, 1, 0.05], [0.24, 1, 0.92, 0.04], [0.4, 0.78, 0.55, -0.12], [0.88, 0.7, 0.4, -0.17], [1, 0.48, 0.3, -0.18]],
  lizard: [[0, 0.85, 0.9, 0], [0.35, 1, 1, 0], [0.75, 0.72, 0.66, -0.06], [1, 0.32, 0.32, -0.1]],
  blunt: [[0, 0.9, 0.95, 0], [0.4, 1, 1, 0], [0.85, 0.85, 0.75, -0.04], [1, 0.5, 0.45, -0.06]],
};
const rept = (key: string, o: RP, ...marks: RPMark[]): M => {
  const f = m(key, { view: 'side', rig: 'quad' });
  const L = o.L, bl = L * o.bf, tl = L * o.tf, hl = L * o.hf, bw = o.w * L, bh = o.h * L;
  const y0 = bh * 0.5 + L * (o.cl ?? 0.012);
  const zt = -L / 2, z0 = zt + tl, z1 = z0 + bl, zh = L / 2;
  const hw = bw * (o.snout === 'lizard' || o.snout === 'blunt' ? 0.62 : 0.55), hh = bh * (o.snout === 'lizard' || o.snout === 'blunt' ? 0.72 : 0.58);
  const boxy = o.snout === 'croc' || o.snout === 'gator' ? 0.45 : 0.1;
  f.loft([bw, bh, bl], [0, y0, (z0 + z1) / 2], [[0, 0.72, 0.78, -0.02], [0.3, 0.96, 0.96, 0], [0.62, 1, 1, 0], [0.88, 0.84, 0.86, 0.02], [1, 0.6, 0.64, 0.04]], { color: o.c, boxy, name: 'body' });
  if (o.belly) f.loft([bw * 0.92, bh * 1.02, bl * 0.96], [0, y0 - bh * 0.05, (z0 + z1) / 2], [[0, 0.7, 0.74, 0], [0.3, 0.95, 0.95, 0], [0.62, 1, 1, 0], [0.9, 0.8, 0.82, 0.02], [1, 0.55, 0.6, 0.04]], { color: o.belly, boxy, cut: 'bottom', parent: 'body', noInk: true });
  f.loft([bw * 0.74, bh * 0.76, tl], [0, y0 - bh * 0.08, (zt + z0) / 2], [[0, 0.06, 0.1, 0.02], [0.35, 0.36, 0.44, 0], [0.75, 0.78, 0.82, 0], [1, 1, 1, 0]], { color: o.c, boxy: boxy * 0.6, name: 'tail', parent: 'body', pivot: [0, y0, z0] });
  // head: skull and upper snout, lower jaw that swings open
  const hp = HEADP[o.snout];
  f.loft([hw, hh, hl], [0, y0 + bh * 0.04, z1 + hl / 2 - bl * 0.04], hp, { color: o.c, boxy, name: 'head', parent: 'body', pivot: [0, y0, z1 - bl * 0.06] });
  const jy = y0 + bh * 0.04 - hh * 0.3;
  f.loft([hw * 0.9, hh * 0.32, hl * 0.86], [0, jy, z1 + hl * 0.46], hp.map(([t, w]) => [t, w, 0.9, 0] as [number, number, number, number]), { color: o.c, boxy, name: 'jaw', parent: 'head', pivot: [0, jy + hh * 0.05, z1 + hl * 0.05], mover: { kind: 'swing', axis: 'x', amount: o.snout === 'croc' || o.snout === 'gator' ? 32 : 22 } });
  f.loft([hw * 0.62, hh * 0.14, hl * 0.66], [0, jy + hh * 0.06, z1 + hl * 0.44], hp.map(([t, w]) => [t, w, 1, 0] as [number, number, number, number]), { color: '#c87a78', parent: 'jaw', noInk: true });
  const nT = o.teeth ?? 0;
  for (let i = 0; i < nT; i++) {
    const t = 0.36 + (0.6 * i) / Math.max(1, nT - 1), sw = hw * 0.5 * (0.5 + 0.5 * (i % 3 === 1 ? 1.05 : 0.95)) * (t < 0.5 ? 1.1 : 0.82);
    f.pair((s2) => f.cone([hl * 0.02, hh * 0.22, hl * 0.02], [s2 * sw * 0.86, jy + hh * 0.08, z1 + hl * (t - 0.04)], { color: '#fbf6e6', rot: [180, 0, 0], parent: 'head' }).cone([hl * 0.02, hh * 0.18, hl * 0.02], [s2 * sw * 0.8, jy + hh * 0.18, z1 + hl * (t - 0.02)], { color: '#fbf6e6', parent: 'jaw' }));
  }
  // eyes on bumps, nostrils at the tip
  const ek = o.ek ?? 1;
  f.pair((s2) =>
    f.ball([hw * 0.32 * ek, hh * 0.42 * ek, hl * 0.16 * ek], [s2 * hw * 0.3, y0 + bh * 0.04 + hh * 0.42, z1 + hl * 0.24], { color: o.c, parent: 'head' })
      .ball([hw * 0.18 * ek, hh * 0.24 * ek, hl * 0.08 * ek], [s2 * hw * 0.36, y0 + bh * 0.04 + hh * 0.5, z1 + hl * 0.28], { color: o.eye ?? '#c8b040', eye: true, parent: 'head', noInk: true })
      .ball([hw * 0.05 * ek, hh * 0.2 * ek, hl * 0.03 * ek], [s2 * hw * 0.42, y0 + bh * 0.04 + hh * 0.5, z1 + hl * 0.3], { color: '#14110f', eye: true, parent: 'head', noInk: true })
      .ball([hw * 0.08, hh * 0.08, hl * 0.04], [s2 * hw * 0.06, y0 + bh * 0.04 + hh * (o.snout === 'lizard' || o.snout === 'blunt' ? 0.0 : -0.04), zh - hl * 0.04], { color: '#1d1a17', parent: 'head', noInk: true }),
  );
  // sprawled legs: out to the side, elbow up, down to a splayed foot
  const lw = o.lw * L, reach = o.leg * L;
  f.pair((s2) => {
    for (const [n, zz, k] of [['F', z1 - bl * 0.14, 1], ['B', z0 + bl * 0.14, 1.2]] as Array<[string, number, number]>) {
      const name = 'leg' + n + (s2 > 0 ? 'L' : 'R');
      const sh: Vec3 = [s2 * bw * 0.4, y0 - bh * 0.08, zz], el: Vec3 = [s2 * (bw * 0.42 + reach * 0.55), y0 + bh * 0.02, zz + (n === 'F' ? -1 : 1) * reach * 0.12], ft: Vec3 = [s2 * (bw * 0.42 + reach * 0.62), lw * 0.4, zz + (n === 'F' ? 1 : -1) * reach * 0.05];
      f.rod(sh, el, lw * 1.25 * k, o.c, { name, parent: 'body', pivot: sh }).rod(el, ft, lw * k, o.c, { parent: name });
      for (let i = 0; i < 4; i++) {
        const a = ((i - 1.5) * 26 + (n === 'F' ? 0 : -15)) * (Math.PI / 180);
        f.rod(ft, add3(ft, [s2 * Math.sin(a) * lw * 2.2, -lw * 0.2, Math.cos(a) * lw * 2.4 * (n === 'F' ? 1 : 0.8)]), lw * 0.5, o.c, { parent: name });
      }
    }
  });
  // scutes along the back and tail, spines for iguanas
  const rc = o.ridge ?? o.c;
  for (let i = 0; i < (o.scutes ?? 0); i++) {
    const t = i / Math.max(1, (o.scutes ?? 1) - 1), zz = z1 - bl * 0.1 - (z1 - bl * 0.1 - (zt + tl * 0.25)) * t;
    const onTail = zz < z0, tk = onTail ? Math.max(0.15, (zz - zt) / tl) : 1;
    const top = onTail ? y0 - bh * 0.08 + bh * 0.76 * 0.5 * (0.2 + 0.8 * tk) : y0 + bh * 0.48;
    const sz = bh * 0.13 * (onTail ? 0.6 + 0.6 * tk : 1);
    for (const x of onTail && tk < 0.55 ? [0] : [-1, 1]) f.pyramid([sz * 1.2, sz, sz * 1.5], [x * bw * (onTail ? 0.12 : 0.18), top + sz * 0.3, zz], 4, { color: rc, parent: onTail ? 'tail' : 'body' });
  }
  for (let i = 0; i < (o.spines ?? 0); i++) {
    const t = i / Math.max(1, (o.spines ?? 1) - 1), zz = z1 + hl * 0.1 - (z1 + hl * 0.1 - (z0 - tl * 0.3)) * t, onHead = zz > z1, onTail = zz < z0;
    const sz = bh * 0.32 * (1 - 0.6 * t) * (onHead ? 0.6 : 1);
    const top = onTail ? y0 - bh * 0.08 + bh * 0.38 * Math.max(0.3, (zz - zt) / tl) : onHead ? y0 + bh * 0.04 + hh * 0.45 : y0 + bh * 0.46;
    f.cone([sz * 0.25, sz, sz * 0.4], [0, top + sz * 0.4, zz], { color: rc, rot: [-20, 0, 0], parent: onTail ? 'tail' : onHead ? 'head' : 'body' });
  }
  const d: RPD = { o, y0, bw, bh, hw, hh, z0, z1, zh, zt };
  for (const mk of marks) mk(f, d);
  return f;
};
const RK = (key: string, o: RP, ...marks: RPMark[]): Figure => rept(key, o, ...marks).done();

/* ----- rabbits and hares: sitting on big haunches and long flat hind feet ----- */
const bun = (key: string, o: { c: string; H: number; ear: number; earC?: string; earIn?: string; belly?: string; tail?: string; eye?: string; tip?: string; legs?: number; head?: number }): Figure => {
  const f = m(key, { view: 'side', rig: 'quad' });
  const k = o.H / 0.2, lk = o.legs ?? 1, hk = o.head ?? 1;
  const S = (v: Vec3): Vec3 => mul(v, k);
  const c = o.c, bc = o.belly ?? c;
  f.ball(S([0.14, 0.15, 0.21]), S([0, 0.09 * lk, -0.02]), { color: c, rot: [-28, 0, 0], name: 'body' })
    .ball(S([0.1, 0.1, 0.1]), S([0, 0.085 * lk, 0.045]), { color: bc, parent: 'body', noInk: true });
  f.pair((s) => {
    const sd = s > 0 ? 'L' : 'R';
    f.ball(S([0.06, 0.11, 0.13]), S([s * 0.055, 0.065 * lk, -0.06]), { color: c, name: 'legB' + sd, parent: 'body', pivot: S([s * 0.05, 0.09 * lk, -0.06]) })
      .box(S([0.038, 0.022, 0.12 * lk]), S([s * 0.052, 0.011, -0.03]), { color: c, round: 0.9, parent: 'legB' + sd })
      .rod(S([s * 0.034, 0.1 * lk, 0.055]), S([s * 0.034, 0.012, 0.075]), 0.024 * k, c, { name: 'legF' + sd, parent: 'body', pivot: S([s * 0.034, 0.1 * lk, 0.055]) })
      .ball(S([0.026, 0.016, 0.038]), S([s * 0.034, 0.008, 0.082]), { color: bc, parent: 'legF' + sd });
  });
  const hy = 0.168 * lk + 0.012, hz = 0.07;
  f.rod(S([0, 0.13 * lk, 0.03]), S([0, hy - 0.01, hz - 0.01]), 0.06 * k, c, { name: 'neck', parent: 'body', pivot: S([0, 0.13 * lk, 0.03]) })
    .ball(S([0.085 * hk, 0.08 * hk, 0.1 * hk]), S([0, hy, hz]), { color: c, name: 'head', parent: 'neck', pivot: S([0, hy - 0.02, hz - 0.02]) })
    .ball(S([0.05 * hk, 0.04 * hk, 0.04 * hk]), S([0, hy - 0.016 * hk, hz + 0.042 * hk]), { color: bc, parent: 'head' })
    .ball(S([0.016, 0.011, 0.01]), S([0, hy - 0.004, hz + 0.062 * hk]), { color: '#e88a9a', parent: 'head', noInk: true })
    .ball(S([0.03 * hk, 0.016 * hk, 0.03 * hk]), S([0, hy - 0.03 * hk, hz + 0.035 * hk]), { color: bc, name: 'jaw', parent: 'head', pivot: S([0, hy - 0.025 * hk, hz + 0.02]) });
  f.pair((s) => {
    const n = s > 0 ? 'earL' : 'earR', base = S([s * 0.018 * hk, hy + 0.03 * hk, hz - 0.02]);
    f.ball(S([0.03 * hk, o.ear, 0.016 * hk]), add3(base, S([s * 0.008, o.ear * 0.46, -0.012])), { color: o.earC ?? c, rot: [-14, 0, -s * 10], name: n, parent: 'head', pivot: base })
      .ball(S([0.017 * hk, o.ear * 0.78, 0.006 * hk]), add3(base, S([s * 0.009, o.ear * 0.44, -0.006])), { color: o.earIn ?? '#f0b8bc', rot: [-14, 0, -s * 10], parent: n, noInk: true });
    if (o.tip) f.ball(S([0.031 * hk, o.ear * 0.25, 0.017 * hk]), add3(base, S([s * 0.016, o.ear * 0.86, -0.022])), { color: o.tip, rot: [-14, 0, -s * 10], parent: n });
    f.ball(S([0.02 * hk, 0.024 * hk, 0.018 * hk]), S([s * 0.034 * hk, hy + 0.012 * hk, hz + 0.022 * hk]), { color: o.eye ?? '#1d1a17', eye: true, parent: 'head', noInk: true })
      .ball(S([0.007, 0.008, 0.005]), S([s * 0.042 * hk, hy + 0.018 * hk, hz + 0.03 * hk]), { color: '#ffffff', eye: true, parent: 'head', noInk: true });
  });
  f.ball(S([0.05, 0.05, 0.045]), S([0, 0.07 * lk, -0.13]), { color: o.tail ?? WH, name: 'tail', parent: 'body' });
  f.socket('mouth', S([0, hy - 0.035, hz + 0.06]), 'mouth', { part: 'head', size: 0.08 * k });
  return f.done();
};

/* ----- a chameleon on a twig: a tall flat body, a casque, turret eyes, a curled tail and grasping feet ----- */
const chameleon = (key: string, c: string, mood: string): Figure => {
  const f = m(key, { view: 'side', rig: 'quad' });
  const g = '#7a5a3a';
  // the twig it grips
  f.stick([0, 0.035, -0.22], [0, 0.05, 0.2], 0.018, g, { edge: 'sharp' }).rod([0, 0.04, 0.05], [0, 0.0, 0.1], 0.01, g);
  const prof: Array<[number, number, number, number]> = [[0, 0.3, 0.4, 0], [0.3, 0.9, 0.95, 0.04], [0.6, 1, 1, 0.04], [0.9, 0.7, 0.8, 0], [1, 0.4, 0.5, -0.04]];
  f.loft([0.04, 0.075, 0.16], [0, 0.115, 0], prof, { color: c, name: 'body' })
    .loft([0.045, 0.08, 0.165], [0, 0.115, 0], prof, { color: mood, name: 'mood', parent: 'body', scale: 0, noInk: true });
  for (let i = 0; i < 7; i++) f.cone([0.006, 0.012, 0.008], [0, 0.153 + Math.sin((i / 6) * Math.PI) * 0.004, 0.06 - i * 0.018], { color: '#4a9a3a', rot: [-15, 0, 0], parent: 'body' });
  f.ball([0.035, 0.03, 0.06], [0, 0.09, 0.01], { color: '#d8e86a', parent: 'body', noInk: true });
  // head with a casque and turret eyes
  f.loft([0.035, 0.045, 0.06], [0, 0.13, 0.105], [[0, 0.8, 0.9, 0], [0.5, 1, 1, 0], [1, 0.45, 0.4, -0.1]], { color: c, name: 'head', parent: 'body', pivot: [0, 0.12, 0.075] })
    .cone([0.03, 0.04, 0.03], [0, 0.163, 0.095], { color: c, rot: [-35, 0, 0], parent: 'head' })
    .ball([0.02, 0.006, 0.03], [0, 0.112, 0.125], { color: '#c8d860', name: 'jaw', parent: 'head', pivot: [0, 0.115, 0.1] })
    .rod([0, 0.118, 0.13], [0, 0.118, 0.33], 0.007, '#e88aa0', { name: 'tongue', parent: 'head', scale: 0 })
    .pair((s) => {
      const n = s > 0 ? 'eyeL' : 'eyeR';
      f.ball([0.018, 0.018, 0.018], [s * 0.016, 0.142, 0.112], { color: c, name: n, parent: 'head' }).ball([0.006, 0.006, 0.006], [s * 0.025, 0.144, 0.118], { color: '#1d1a17', eye: true, parent: n, noInk: true });
    });
  // legs gripping the twig: shoulder out, down to a two-fingered clasp
  f.pair((s) => {
    for (const [n, z] of [['F', 0.045], ['B', -0.045]] as Array<[string, number]>) {
      const name = 'leg' + n + (s > 0 ? 'L' : 'R'), sh: Vec3 = [s * 0.016, 0.1, z], el: Vec3 = [s * 0.034, 0.085, z + (n === 'F' ? -0.015 : 0.015)], ft: Vec3 = [s * 0.013, 0.05, z + (n === 'F' ? 0.01 : -0.01)];
      f.rod(sh, el, 0.009, c, { name, parent: 'body', pivot: sh }).rod(el, ft, 0.007, c, { parent: name }).ball([0.016, 0.01, 0.012], [s * 0.006, 0.044, ft[2]], { color: c, parent: name });
    }
  });
  // the tail curls down into a coil
  f.rod([0, 0.11, -0.075], [0, 0.085, -0.13], 0.016, c, { name: 'tail', parent: 'body', pivot: [0, 0.11, -0.075] }).torus([0.06, 0.06, 0.011], [0, 0.06, -0.15], { color: c, rot: [0, 90, 0], tube: 0.22, parent: 'tail' });
  return f.done();
};

/* ----- elephants: big flapping ears, a two-part trunk that can rise and curl, tusks ----- */
const eleHead = (c: string, tusk: number): QMark => (f, d) => {
  const { l, w, h } = d.q.head, sk = d.sk, H = d.q.H;
  f.pair((s) => {
    const n = s > 0 ? 'earL' : 'earR';
    f.ball([w * 0.1, h * 1.35, l * 1.15], add3(sk, [s * w * 0.6, -h * 0.12, -l * 0.3]), { color: c, rot: [0, -s * 22, s * 6], name: n, parent: 'head', pivot: add3(sk, [s * w * 0.42, h * 0.3, -l * 0.05]) })
      .ball([w * 0.06, h * 1.05, l * 0.85], add3(sk, [s * w * 0.6, -h * 0.12, -l * 0.27]), { color: '#a89898', rot: [0, -s * 22, s * 6], parent: n, noInk: true });
    if (tusk > 0) f.rod(add3(d.mz, [s * d.q.muz.w * 0.3, -d.q.muz.h * 0.2, 0]), add3(d.mz, [s * d.q.muz.w * 0.45, -tusk * 0.55, tusk * 0.55]), tusk * 0.13, '#f4ecd8', { parent: 'head' })
      .rod(add3(d.mz, [s * d.q.muz.w * 0.45, -tusk * 0.55, tusk * 0.55]), add3(d.mz, [s * d.q.muz.w * 0.4, -tusk * 0.45, tusk * 0.95]), tusk * 0.09, '#f4ecd8', { parent: 'head' });
  });
  const t0: Vec3 = add3(d.mz, [0, d.q.muz.h * 0.1, d.q.muz.l * 0.2]), t1 = add3(t0, [0, -H * 0.3, H * 0.06]), t2 = add3(t1, [0, -H * 0.24, H * 0.03]);
  f.rod(t0, t1, w * 0.34, c, { name: 'trunk', parent: 'head', pivot: t0 }).rod(t1, t2, w * 0.24, c, { name: 'trunk2', parent: 'trunk', pivot: t1 }).ball([w * 0.24, w * 0.14, w * 0.24], t2, { color: '#7a7876', parent: 'trunk2' });
  for (let i = 0; i < 5; i++) f.torus([w * (0.33 - i * 0.02), w * (0.33 - i * 0.02), w * 0.03], add3(t0, mul([0, -H * 0.3, H * 0.06], (i + 1) / 6)), { color: '#7e7c7a', rot: [90, 0, 0], tube: 0.12, parent: 'trunk', noInk: true });
};
const trumpet = (line = 'PAWOOO!'): St[] => [A.par(ps('trunk', [-120, 0, 0], 0.6), ps('trunk2', [-40, 0, 0], 0.6), ps('neck', [-10, 0, 0], 0.6), ps('earL', [0, -40, 0], 0.5), ps('earR', [0, 40, 0], 0.5), ps('jaw', [18, 0, 0], 0.5), say(line, 2)), A.wait(1.4), rest('trunk', 'trunk2', 'neck', 'earL', 'earR', 'jaw')];
const trunkSpray = (line = 'Pfffssh!'): St[] => [A.par(ps('trunk', [-150, 0, 0], 0.7), ps('trunk2', [-30, 0, 0], 0.7)), A.par(A.effect('water_spray', { dur: 1.6 }), say(line, 1.6)), A.wait(1.2), rest('trunk', 'trunk2')];

/* ----- a tyrannosaur: a horizontal body balanced over two huge legs, a massive head with a jaw that opens ----- */
const trex = (key: string, c: string, belly: string, dk: string): Figure => {
  const f = m(key, { view: 'side', rig: 'quad' });
  f.loft([1.7, 2.2, 4.4], [0, 3.55, 0.3], [[0, 0.62, 0.72, 0.04], [0.3, 0.96, 1, 0], [0.62, 1, 0.98, -0.03], [0.88, 0.72, 0.78, 0.04], [1, 0.48, 0.55, 0.1]], { color: c, rot: [-8, 0, 0], name: 'body' })
    .loft([1.5, 1.9, 3.6], [0, 3.3, 0.6], [[0, 0.5, 0.6, -0.1], [0.4, 0.9, 0.9, -0.12], [0.85, 0.7, 0.75, -0.08], [1, 0.4, 0.45, 0]], { color: belly, rot: [-8, 0, 0], cut: 'bottom', parent: 'body', noInk: true })
    .loft([1.3, 1.5, 6.6], [0, 3.75, -4.9], [[0, 0.05, 0.08, -0.02], [0.4, 0.4, 0.45, 0], [0.8, 0.82, 0.86, 0], [1, 1, 1, 0]], { color: c, rot: [3, 0, 0], name: 'tail', parent: 'body', pivot: [0, 3.7, -1.6] })
    .rod([0, 4.3, 2.0], [0, 4.85, 2.85], 1.0, c, { name: 'neck', parent: 'body', pivot: [0, 4.3, 2.0] })
    .loft([1.05, 1.15, 1.9], [0, 5.05, 3.65], [[0, 0.9, 0.95, 0.02], [0.3, 1, 1, 0.02], [0.7, 0.78, 0.7, -0.04], [1, 0.55, 0.45, -0.06]], { color: c, boxy: 0.35, name: 'head', parent: 'neck', pivot: [0, 4.85, 2.85] })
    .loft([0.92, 0.45, 1.75], [0, 4.52, 3.6], [[0, 0.9, 1, 0], [0.5, 0.92, 0.9, 0], [1, 0.6, 0.6, 0.05]], { color: belly, boxy: 0.35, name: 'jaw', parent: 'head', pivot: [0, 4.65, 2.85], mover: { kind: 'swing', axis: 'x', amount: 34 } })
    .loft([0.75, 0.15, 1.5], [0, 4.72, 3.62], [[0, 0.9, 1, 0], [1, 0.6, 1, 0]], { color: '#a84a4a', parent: 'jaw', noInk: true });
  f.pair((s) => {
    for (let i = 0; i < 7; i++) f.cone([0.07, 0.17, 0.07], [s * 0.38 * (1 - i * 0.04), 4.66, 3.0 + i * 0.22], { color: '#fbf6e6', rot: [180, 0, 0], parent: 'head' }).cone([0.06, 0.13, 0.06], [s * 0.34 * (1 - i * 0.04), 4.74, 3.05 + i * 0.21], { color: '#fbf6e6', parent: 'jaw' });
    f.ball(0.15, [s * 0.4, 5.3, 3.4], { color: '#e8c040', eye: true, parent: 'head', noInk: true }).ball(0.07, [s * 0.46, 5.3, 3.46], { color: '#1d1a17', eye: true, parent: 'head', noInk: true })
      .box([0.2, 0.1, 0.4], [s * 0.36, 5.45, 3.4], { color: dk, round: 0.8, parent: 'head' })
      .ball([0.08, 0.06, 0.06], [s * 0.18, 5.12, 4.55], { color: '#2a2420', parent: 'head', noInk: true });
    // legs: a huge thigh, a shin, a long foot bone and three forward toes
    const n = s > 0 ? 'legBL' : 'legBR', x = s * 0.62;
    f.ball([0.72, 2.0, 1.4], [x, 2.95, -0.35], { color: c, name: n, parent: 'body', pivot: [x, 3.5, -0.3] })
      .rod([x, 2.1, -0.1], [x, 0.95, -0.75], 0.5, c, { parent: n })
      .rod([x, 0.95, -0.75], [x, 0.22, -0.3], 0.36, c, { parent: n })
      .each(3, (i) => f.rod([x, 0.2, -0.3], [x + (i - 1) * 0.22, 0.08, 0.35 - Math.abs(i - 1) * 0.1], 0.18, c, { parent: n }).cone([0.12, 0.22, 0.12], [x + (i - 1) * 0.24, 0.08, 0.48 - Math.abs(i - 1) * 0.1], { color: '#3a3428', rot: [90, 0, 0], parent: n }))
      .rod([x * 0.9, 0.95, -0.75], [x * 0.9, 0.2, -0.95], 0.12, c, { parent: n });
    // tiny two-fingered arms
    const a = s > 0 ? 'legFL' : 'legFR';
    f.rod([s * 0.5, 3.6, 1.9], [s * 0.6, 3.15, 2.2], 0.2, c, { name: a, parent: 'body', pivot: [s * 0.5, 3.6, 1.9] }).rod([s * 0.6, 3.15, 2.2], [s * 0.62, 3.2, 2.55], 0.14, c, { parent: a })
      .cone([0.07, 0.18, 0.07], [s * 0.6, 3.15, 2.66], { color: '#3a3428', rot: [110, 0, 0], parent: a }).cone([0.07, 0.18, 0.07], [s * 0.66, 3.2, 2.64], { color: '#3a3428', rot: [100, 0, 0], parent: a });
  });
  for (let i = 0; i < 12; i++) f.cone([0.12, 0.22, 0.2], [0, 4.6 - i * 0.12 + (i > 4 ? -0.02 * (i - 4) : 0), 1.6 - i * 0.62], { color: dk, rot: [-25, 0, 0], parent: i < 5 ? 'body' : 'tail' });
  f.socket('mouth', [0, 4.7, 4.3], 'mouth', { part: 'head', size: 0.8 });
  return f.done();
};

/* ----- a crab: a wide shell, eyes on stalks, two claws with a movable finger, eight walking legs ----- */
const crab = (key: string, o: { w: number; c: string; under: string; claw?: number; tip?: string; hairy?: boolean }): Figure => {
  const f = m(key, { rig: 'bug' });
  const w = o.w, c = o.c, k = o.claw ?? 1.35, y = w * 0.36;
  f.loft([w, w * 0.32, w * 0.72], [0, y, 0], [[0, 0.62, 0.6, -0.05], [0.3, 0.92, 0.9, 0], [0.7, 1, 1, 0], [0.92, 0.88, 0.8, 0.02], [1, 0.7, 0.5, 0.05]], { color: c, name: 'body', boxy: 0.25 })
    .loft([w * 0.86, w * 0.18, w * 0.62], [0, y - w * 0.06, 0], [[0, 0.6, 0.6, 0], [0.6, 1, 1, 0], [1, 0.75, 0.6, 0]], { color: o.under, cut: 'bottom', parent: 'body', noInk: true });
  f.pair((s) => {
    const es = s > 0 ? 'eyeL' : 'eyeR';
    f.rod([s * w * 0.1, y + w * 0.1, w * 0.32], [s * w * 0.13, y + w * 0.24, w * 0.36], w * 0.035, c, { name: es, parent: 'body', pivot: [s * w * 0.1, y + w * 0.1, w * 0.32] }).ball(w * 0.07, [s * w * 0.13, y + w * 0.26, w * 0.36], { color: '#1d1a17', eye: true, parent: es, noInk: true });
    // claw: an arm, a big hand and a finger that opens
    const cl = s > 0 ? 'clawL' : 'clawR', fg = s > 0 ? 'pinchL' : 'pinchR';
    const sh: Vec3 = [s * w * 0.36, y, w * 0.24], el: Vec3 = [s * w * 0.58, y + w * 0.06 * k, w * 0.46], hand: Vec3 = [s * w * 0.6, y + w * 0.1 * k, w * 0.64];
    f.rod(sh, el, w * 0.1 * k, c, { name: cl, parent: 'body', pivot: sh }).rod(el, add3(el, [-s * w * 0.04, w * 0.02, w * 0.1]), w * 0.11 * k, c, { parent: cl })
      .ball([w * 0.17 * k, w * 0.15 * k, w * 0.28 * k], hand, { color: c, parent: cl })
      .cone([w * 0.09 * k, w * 0.24 * k, w * 0.06 * k], add3(hand, [s * w * 0.03, -w * 0.035 * k, w * 0.2 * k]), { color: o.tip ?? c, rot: [95, 0, 0], parent: cl })
      .cone([w * 0.08 * k, w * 0.24 * k, w * 0.05 * k], add3(hand, [s * w * 0.02, w * 0.045 * k, w * 0.2 * k]), { color: o.tip ?? c, rot: [80, 0, 0], name: fg, parent: cl, pivot: add3(hand, [s * w * 0.02, w * 0.05 * k, w * 0.08 * k]) });
    // four walking legs, bent at the knee, tips on the ground
    f.each(4, (i) => {
      const z = w * (0.12 - i * 0.12), fan = (i - 1.2) * w * 0.2, kn: Vec3 = [s * w * 0.68, y + w * 0.14, z + fan * 0.5], tip: Vec3 = [s * w * 0.9, w * 0.01, z + fan * 1.3];
      f.rod([s * w * 0.4, y - w * 0.02, z], kn, w * 0.042, c, { name: `leg${i}${s > 0 ? 'L' : 'R'}`, parent: 'body', pivot: [s * w * 0.4, y - w * 0.02, z], edge: 'sharp' }).rod(kn, tip, w * 0.03, c, { parent: `leg${i}${s > 0 ? 'L' : 'R'}`, edge: 'sharp' });
    });
  });
  if (o.hairy) for (let i = 0; i < 6; i++) f.ball(w * 0.05, [(i - 2.5) * w * 0.12, y + w * 0.15, w * 0.3], { color: '#a8402a', parent: 'body' });
  return f.done();
};
const snap = (line = 'Snip snap!'): St[] => [A.par(ps('clawL', [-25, 0, 0], 0.25), ps('clawR', [-25, 0, 0], 0.25), ps('pinchL', [-35, 0, 0], 0.15), ps('pinchR', [-35, 0, 0], 0.15)), A.par(ps('pinchL', [0, 0, 0], 0.1), ps('pinchR', [0, 0, 0], 0.1), say(line, 1.4)), ps('pinchL', [-35, 0, 0], 0.15), ps('pinchL', [0, 0, 0], 0.1), rest('clawL', 'clawR')];

/* ----- snakes: the kit's coil with a pattern down the back ----- */
type SnO = Parameters<typeof snake>[1];
/** A snake with a pattern along its back: blotches, a zigzag, or saddles; scales (k) the head. */
const snk = (key: string, o: SnO, pat?: { c: string; k: 'zig' | 'blot' | 'saddle' | 'belly'; n?: number }, head?: { k?: number; c?: string; flat?: number; rise?: number }): Figure => {
  const f = snake(key, o);
  const t = o.length * (o.girth ?? 0.075);
  const parts = f.parts.map((p) => (head?.rise !== undefined && (p.name === 'seg6' || p.name === 'seg7') && p.rot ? { ...p, rot: [p.rot[0] * head.rise, p.rot[1], p.rot[2]] as Vec3 } : p));
  const hd = parts.find((p) => p.name === 'head');
  if (hd && head) {
    hd.size = [hd.size[0] * (head.k ?? 1) * (head.flat ?? 1), hd.size[1] * (head.k ?? 1), hd.size[2] * (head.k ?? 1) * 1.1];
    if (head.c) hd.color = col(head.c, head.c);
  }
  if (pat)
    for (let i = 0; i < 8; i++) {
      const seg = parts.find((p) => p.name === `seg${i}`);
      if (!seg) continue;
      const len = seg.size[1] - seg.size[0], g = seg.size[0];
      const n = pat.n ?? 3;
      for (let j = 0; j < n; j++) {
        const u = (j + 0.5) / n, x = pat.k === 'zig' ? (j % 2 ? 1 : -1) * g * 0.16 : 0;
        const size: Vec3 = pat.k === 'saddle' ? [g * 1.02, len / n * 0.5, g * 1.02] : pat.k === 'belly' ? [g * 0.8, len / n * 0.9, g * 0.4] : [g * (pat.k === 'zig' ? 0.42 : 0.6), len / n * (pat.k === 'zig' ? 0.62 : 0.55), g * 0.3];
        parts.push({ name: `pat${i}_${j}`, parent: seg.name, at: [x, len * u + g * 0.05, pat.k === 'belly' ? g * 0.32 : pat.k === 'saddle' ? 0 : -g * 0.36], shape: 'ball', size, color: col(pat.c, pat.c), noInk: true, layer: 3 });
      }
    }
  void t;
  return measure({ ...f, parts });
};

/* ----- acts: small reusable moves in the step language ----- */

type St = ReturnType<typeof A.wait>;
const say = (t: string, d = 1.6): St => A.say(t, d);
const ps = (part: string, rot: Vec3, dur = 0.35): St => A.pose(part, { rot, dur });
const rest = (...parts: string[]): St => A.par(...parts.map((p) => A.pose(p, { rot: [0, 0, 0], dur: 0.45 })));
/** Open the mouth and make a sound. */
const speak = (line: string, open = 24, d = 1.6): St[] => [A.par(ps('jaw', [open, 0, 0], 0.15), say(line, d)), A.wait(0.55), ps('jaw', [0, 0, 0], 0.2)];
/** Bark (a wag and a snap of the jaw). */
const bark = (line: string, wag = true): St[] => [A.par(...(wag ? [A.anim('wag')] : []), A.pose('jaw', { rot: [26, 0, 0], dur: 0.14, times: 2 }), say(line, 1.5))];
/** Point the nose at the sky and howl. */
const howl = (line: string, up = 40): St[] => [A.par(ps('neck', [-up, 0, 0], 0.6), ps('head', [-up * 0.7, 0, 0], 0.6), ps('jaw', [18, 0, 0], 0.6), say(line, 2.6)), A.wait(2.3), rest('neck', 'head', 'jaw')];
/** Nose down to the ground. */
const sniff = (line = 'Sniff sniff...', down = 55): St[] => [A.par(ps('neck', [down, 0, 0], 0.7), ps('head', [down * 0.4, 0, 0], 0.7), say(line, 2)), A.wait(0.4), ps('head', [down * 0.4 + 8, 0, 0], 0.2), ps('head', [down * 0.4, 0, 0], 0.2), A.wait(1), rest('neck', 'head')];
/** Graze: head down, chewing. */
const graze = (line: string, down = 60): St[] => [A.par(ps('neck', [down, 0, 0], 0.8), ps('head', [down * 0.45, 0, 0], 0.8)), A.pose('jaw', { rot: [14, 0, 0], dur: 0.2, times: 3 }), A.par(rest('neck', 'head'), say(line, 1.8))];
/** Roar: head up, mouth wide, a shake. */
const roar = (line: string, open = 34): St[] => [A.par(ps('neck', [-14, 0, 0], 0.3), ps('head', [-12, 0, 0], 0.3), ps('jaw', [open, 0, 0], 0.3), say(line, 2), A.anim('shake')), A.wait(1.2), rest('neck', 'head', 'jaw')];
/** Turn the head to look at the player and prick the ears. */
const alert = (line: string): St[] => [A.par(ps('head', [-8, 40, 0], 0.4), ps('earL', [-20, 0, 0], 0.3), ps('earR', [-20, 0, 0], 0.3), say(line, 1.8)), A.wait(1.6), rest('head', 'earL', 'earR')];
/** Fetch: a thing appears, the animal runs to it, takes it in its mouth, brings it to the player, wags. */
const fetchIt = (word: string, line: string): St[] => [A.spawn('toy', word, { rel: 'front', of: 'self', dist: 'near' }), A.move('self', { rel: 'near', of: 'toy', dist: 'touch' }, { speed: 'run' }), A.attach('toy', 'self', 'mouth'), A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'run' }), A.par(A.anim('wag'), say(line, 1.5)), A.remove('toy', 'pop')];
/** Tail up and wagging hard. */
const wagHard = (line: string, times = 2): St[] => [A.par(A.anim('wag', times), say(line, 1.6))];
/** Lie down / sit: hind end lowers, front stays up. */
const sitQ = (fig: Figure, line?: string): St[] => {
  const b = fig.parts.find((p) => p.name === 'body');
  const H = fig.heightM;
  const L = b ? b.size[2] : H;
  const drop = Math.min(H * 0.35, L * 0.22);
  return [A.par(A.pose('body', { rot: [-24, 0, 0], move: [0, -drop, 0], dur: 0.6 }), ps('legFL', [24, 0, 0], 0.6), ps('legFR', [24, 0, 0], 0.6), ps('legBL', [-62, 0, 0], 0.6), ps('legBR', [-62, 0, 0], 0.6), ps('neck', [-10, 0, 0], 0.6), ...(line ? [say(line, 2)] : [])), A.wait(2), A.par(A.pose('body', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.5 }), rest('legFL', 'legFR', 'legBL', 'legBR', 'neck'))];
};
/* birds */
const sing = (line: string, d = 1.8): St[] => [A.par(ps('head', [-22, 0, 0], 0.3), A.pose('jaw', { rot: [30, 0, 0], dur: 0.2, times: 3 }), say(line, d)), rest('head')];
const spread = (line: string, deg = 80, hold = 1.4): St[] => [A.par(ps('wingL', [0, 0, deg], 0.45), ps('wingR', [0, 0, -deg], 0.45), ps('jaw', [24, 0, 0], 0.3), say(line, 2)), A.wait(hold), rest('wingL', 'wingR', 'jaw')];
const peck = (line: string, n = 3): St[] => [A.par(A.pose('head', { rot: [50, 0, 0], dur: 0.15, times: n }), say(line, 1.4))];
const flyUp = (line: string, times = 2): St[] => [A.par(A.anim('flap', times), A.anim('hop', times), say(line, 1.6))];
/* fish */
const swimSpin = (line = 'Blub!'): St[] => [A.par(A.anim('spin'), say(line, 1.2))];
const splash = (line = 'Splash!'): St[] => [A.par(A.anim('hop'), A.effect('water_spray', { dur: 1.2 }), say(line, 1.4))];
const gulp = (line = 'Gulp!', open = 30): St[] => [ps('jaw', [open, 0, 0], 0.2), A.wait(0.4), A.par(ps('jaw', [0, 0, 0], 0.12), say(line, 1.2))];
const swish = (line: string, k = 35): St[] => [ps('tail', [0, k, 0], 0.2), ps('tail', [0, -k, 0], 0.25), ps('tail', [0, k, 0], 0.25), A.par(rest('tail'), say(line, 1.4))];
/* snakes */
const hiss = (line = 'Hsss!'): St[] => [A.par(A.pose('tongue', { scale: 2, dur: 0.15 }), ps('head', [-14, 0, 0], 0.3), ps('seg7', [-12, 0, 0], 0.3), say(line, 1.6)), A.wait(1.1), A.par(A.pose('tongue', { scale: 1, dur: 0.2 }), rest('head', 'seg7'))];
const strike = (line = 'Hss!'): St[] => [A.par(ps('seg6', [-16, 0, 0], 0.4), ps('seg7', [-24, 0, 0], 0.4)), A.par(ps('seg6', [22, 0, 0], 0.12), ps('seg7', [30, 0, 0], 0.12), ps('head', [24, 0, 0], 0.12), say(line, 1.2)), A.wait(0.4), rest('seg6', 'seg7', 'head')];
/* bugs */
const buzz = (line: string, times = 2): St[] => [A.par(A.anim('hop', times), say(line, 1.6))];
const feel = (line = '!'): St[] => [A.par(ps('antennaL', [30, 0, 10], 0.25), ps('antennaR', [-20, 0, -10], 0.25), say(line, 1.2)), ps('antennaL', [-15, 0, 0], 0.25), ps('antennaR', [25, 0, 0], 0.25), rest('antennaL', 'antennaR')];
const scurry = (line = '!'): St[] => [A.par(A.move('self', { rel: 'away', of: 'player', dist: 'near' }, { speed: 'run' }), say(line, 1))];

/** Dig: nose down, front paws scrabbling, dust flying. */
const dig = (line: string): St[] => [A.par(ps('neck', [45, 0, 0], 0.4), ps('head', [20, 0, 0], 0.4), A.effect('dust', { dur: 1.8 }), say(line, 1.6)), ps('legFL', [-40, 0, 0], 0.15), ps('legFL', [15, 0, 0], 0.15), ps('legFR', [-40, 0, 0], 0.15), ps('legFR', [15, 0, 0], 0.15), ps('legFL', [-40, 0, 0], 0.15), A.par(rest('neck', 'head', 'legFL', 'legFR'))];
/** Stand up on the hind legs (bears, meerkats): the body tips back about the hips, front paws up. */
const rearUp = (fig: Figure, line: string, deg = 58, hold = 1.6): St[] => {
  const b = fig.parts.find((p) => p.name === 'body'), hb = fig.parts.find((p) => p.name === 'legBL');
  if (!b || !hb) return [say(line)];
  const r = (deg * Math.PI) / 180, yh = hb.at[1] - b.at[1], zh = hb.at[2] - b.at[2];
  const y2 = yh * Math.cos(r) + zh * Math.sin(r), z2 = -yh * Math.sin(r) + zh * Math.cos(r);
  const mv: Vec3 = [0, yh - y2, zh - z2];
  return [
    A.par(A.pose('body', { rot: [-deg, 0, 0], move: mv, dur: 0.8 }), ps('legBL', [deg, 0, 0], 0.8), ps('legBR', [deg, 0, 0], 0.8), ps('legFL', [deg * 0.4, 0, 0], 0.8), ps('legFR', [deg * 0.55, 0, 0], 0.8), ps('neck', [deg * 0.55, 0, 0], 0.8), ps('tail', [deg * 0.5, 0, 0], 0.8)),
    A.par(ps('jaw', [30, 0, 0], 0.25), say(line, 2)),
    A.wait(hold),
    A.par(ps('jaw', [0, 0, 0], 0.2), A.pose('body', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.7 }), rest('legBL', 'legBR', 'legFL', 'legFR', 'neck', 'tail')),
  ];
};
/** Slap the tail down on the water. */
const tailSlap = (line = 'SLAP!'): St[] => [ps('tail', [-50, 0, 0], 0.3), A.par(ps('tail', [18, 0, 0], 0.1), A.effect('water_spray', { dur: 1.2 }), say(line, 1.3)), A.wait(0.5), rest('tail')];
/** Chew something it holds in its mouth. */
const gnaw = (word: string, line: string): St[] => [A.spawn('food', word, { rel: 'front', of: 'self', dist: 'close' }), A.attach('food', 'self', 'mouth'), A.par(A.pose('jaw', { rot: [18, 0, 0], dur: 0.15, times: 4 }), say(line, 1.6)), A.remove('food', 'fade')];
/* cats */
const meow = (line = 'Meow!'): St[] => [A.par(ps('head', [-10, 15, 0], 0.3), ps('jaw', [24, 0, 0], 0.2), say(line, 1.5)), A.wait(0.6), rest('head', 'jaw')];
const stretch = (line = 'Mrrrow...'): St[] => [A.par(A.pose('body', { rot: [14, 0, 0], dur: 0.6 }), ps('legFL', [-55, 0, 0], 0.6), ps('legFR', [-55, 0, 0], 0.6), ps('legBL', [-14, 0, 0], 0.6), ps('legBR', [-14, 0, 0], 0.6), ps('tail', [-30, 0, 0], 0.6), ps('jaw', [30, 0, 0], 0.6), say(line, 2)), A.wait(1.2), A.par(A.pose('body', { rot: [0, 0, 0], dur: 0.5 }), rest('legFL', 'legFR', 'legBL', 'legBR', 'tail', 'jaw'))];
const washPaw = (line = 'Lick, lick.'): St[] => [A.par(ps('legFL', [-95, 0, 0], 0.4), ps('neck', [20, 0, 0], 0.4), ps('head', [25, -20, 0], 0.4), say(line, 1.8)), ps('head', [35, -20, 0], 0.25), ps('head', [25, -20, 0], 0.25), ps('head', [35, -20, 0], 0.25), A.wait(0.3), rest('legFL', 'neck', 'head')];
const purr = (line = 'Purrrr...'): St[] => [A.par(A.anim('wag'), ps('head', [10, 0, 20], 0.5), say(line, 2)), A.wait(1.2), rest('head')];
const act = (fig: Figure, ...click: St[][]): Figure => withAct(fig, { click });
/** An act that needs the built figure (to size a sit, find a part). */
const actF = (fig: Figure, clicks: (f: Figure) => St[][], setup?: St[]): Figure => withAct(fig, { ...(setup ? { setup } : {}), click: clicks(fig) });
const actS = (fig: Figure, setup: St[], ...click: St[][]): Figure => withAct(fig, { setup, click });

/* ----- recipes shared by adults and their young ----- */
const QBADGER: Q = { c: '#8f8a84', H: 0.3, L: 0.62, D: 0.24, W: 0.3, tuck: 0, neck: { l: 0.06, w: 0.16, lean: 70 }, head: { l: 0.14, w: 0.13, h: 0.11, c: '#f4f2ee' }, muz: { l: 0.08, w: 0.06, h: 0.06, c: '#f4f2ee', drop: 0.15 }, ear: { k: 'round', s: 0.035, c: '#2a2624', in: '#f4f2ee' }, leg: { w: 0.06, k: 1.1, c: '#2a2624' }, tail: { k: 'stub', l: 0.12, w: 0.07, a: 110, c: '#b8b2aa' } };
const badgerFace: QMark = onHead('#1e1c1a', [0.24, 0.42, 0.95], [0.24, 0.14, 0.1], { mirror: true });
const QBEAVER: Q = { c: '#7a4f2e', H: 0.3, L: 0.62, D: 0.26, W: 0.3, tuck: 0, rump: 1.1, neck: { l: 0.06, w: 0.18, lean: 70 }, head: { l: 0.14, w: 0.14, h: 0.12 }, muz: { l: 0.07, w: 0.09, h: 0.075, c: '#5a3a24', drop: 0.2 }, ear: { k: 'round', s: 0.03 }, leg: { w: 0.05, k: 1.2, paw: '#3a2a20' }, tail: { k: 'flat', l: 0.3, w: 0.14, a: 100, c: '#3a2e2a' } };
const QBEAR: Q = { c: '#7a4e2c', H: 1.15, L: 1.55, D: 0.72, W: 0.78, tuck: 0, rump: 0.93, hump: 0.12, neck: { l: 0.26, w: 0.44, lean: 68 }, head: { l: 0.36, w: 0.36, h: 0.3 }, muz: { l: 0.2, w: 0.17, h: 0.15, c: '#a8784a', drop: 0.18 }, ear: { k: 'round', s: 0.11, in: '#5a3a20' }, leg: { w: 0.19, k: 1.25, paw: '#4a3020' }, tail: { k: 'stub', l: 0.12, w: 0.1, a: 120 } };

const QBISON: Q = { c: '#4a3020', H: 1.75, L: 2.5, D: 1.2, W: 1.05, tuck: 0.05, rump: 0.78, hump: 0.32, neck: { l: 0.5, w: 0.62, lean: 108 }, head: { l: 0.5, w: 0.52, h: 0.5 }, muz: { l: 0.18, w: 0.3, h: 0.26, c: '#2a2018', drop: 0.3 }, eye: { k: 0.7 }, ear: { k: 'side', s: 0.12 }, leg: { w: 0.14, hoof: '#1e1a18', k: 1.1 }, tail: { k: 'tuft', l: 0.5, w: 0.04, a: 165, tip: '#2a1e14' } };
const bisonMarks: QMark[] = [
  patch('#6a4a2a', 0.58, 1.0, 0.03),
  (f, d) => {
    const n = d.q.neck;
    f.ball([n.w * 1.5, n.w * 1.7, n.w * 1.3], add3(mul(d.nb, 0.6), mul(d.nt, 0.4)), { color: '#5a3a22', parent: 'neck' });
  },
  onHead('#3a2414', [1.05, 0.55, 0.75], [0, 0.42, -0.08], { ink: true }),
  onHead('#2a1e14', [0.42, 0.7, 0.4], [0, -0.55, 0.22], { ink: true }),
  hornsQ('#2a2420', 0.24, 'hook', 0.3),
];
const QCHEETAH: Q = { c: '#e2b060', H: 0.8, L: 0.95, D: 0.36, W: 0.26, tuck: 0.75, rump: 0.97, belly: '#f4e6c8', neck: { l: 0.2, w: 0.13, lean: 48 }, head: { l: 0.15, w: 0.16, h: 0.13 }, muz: { l: 0.06, w: 0.08, h: 0.06, c: '#f4e6c8', drop: 0.2 }, nose: '#3a2a24', eye: { k: 1.1, c: '#a87a2a' }, ear: { k: 'round', s: 0.05, in: '#f4e6c8' }, leg: { w: 0.05 }, tail: { k: 'long', l: 0.7, w: 0.05, a: 150, tip: WH } };
const cheetahMarks: QMark[] = [spotsQ(BK, 40, 0.05, { lo: -30, hi: 85 }), onHead(BK, [0.06, 0.42, 0.06], [0.2, -0.05, 0.42], { mirror: true, rot: [20, 0, 0] }), spotsQ(BK, 6, 0.04, { t0: 0.02, t1: 0.1 })];
const QDONKEY: Q = { c: '#8f8780', H: 1.2, L: 1.3, D: 0.6, W: 0.5, tuck: 0.08, belly: '#d8d2ca', neck: { l: 0.42, w: 0.3, lean: 48 }, head: { l: 0.36, w: 0.22, h: 0.24 }, muz: { l: 0.26, w: 0.17, h: 0.19, c: '#e4ddd4', drop: 0.2 }, ear: { k: 'long', s: 0.3, in: '#e4ddd4' }, leg: { w: 0.085, hoof: '#3a3430' }, tail: { k: 'tuft', l: 0.5, w: 0.04, a: 165, tip: '#3a3330' } };
const QELE: Q = { c: '#8e8c8a', H: 3.1, L: 3.0, D: 1.65, W: 1.55, tuck: 0.05, rump: 0.94, hump: 0.08, neck: { l: 0.35, w: 1.0, lean: 70 }, head: { l: 1.0, w: 0.95, h: 1.05 }, muz: { l: 0.3, w: 0.45, h: 0.4, drop: 0.32 }, eye: { k: 0.6 }, ear: { k: 'none', s: 0.01 }, leg: { w: 0.45, k: 1.1, hoof: '#d8d0c4', hock: 0.8 }, tail: { k: 'tuft', l: 1.0, w: 0.06, a: 168, tip: '#3a3634' } };
const dolphinHead = (c: string): FIMark => (f, d) => {
  const [w, h, cy] = d.sec(0.96), L = d.o.L;
  f.ball([w * 1.3, h * 1.5, d.Lb * 0.16], [0, cy + h * 0.3, d.z(0.93)], { color: c, parent: 'body' })
    .cone([w * 0.9, L * 0.1, h * 0.8], [0, cy - h * 0.45, d.z(1) + L * 0.035], { color: c, rot: [90, 0, 0], taper: 0.55, parent: 'body' })
    .cone([w * 0.8, L * 0.09, h * 0.5], [0, cy - h * 0.85, d.z(1) + L * 0.025], { color: d.o.belly ?? c, rot: [90, 0, 0], taper: 0.55, parent: 'jaw' })
    .ball([d.W * 0.1, d.W * 0.04, d.W * 0.08], [0, cy + h * 1.2, d.z(0.8)], { color: '#3a4450', parent: 'body', noInk: true });
};
const QDEER: Q = { c: '#a8743e', H: 1.0, L: 1.05, D: 0.44, W: 0.36, tuck: 0.45, belly: '#f0e6d4', neck: { l: 0.45, w: 0.15, lean: 26 }, head: { l: 0.25, w: 0.15, h: 0.15 }, muz: { l: 0.15, w: 0.09, h: 0.09, c: '#8a5a32', drop: 0.18 }, eye: { k: 1.2 }, ear: { k: 'long', s: 0.17, in: '#e8d8c0', tilt: 25 }, leg: { w: 0.048, hoof: '#2a2420' }, tail: { k: 'flat', l: 0.18, w: 0.09, a: 150, tip: WH } };
const QHORSE: Q = { c: '#8a5a32', H: 1.6, L: 1.7, D: 0.75, W: 0.6, tuck: 0.15, belly: '#9a6a40', neck: { l: 0.72, w: 0.34, lean: 36, base: 0.62 }, head: { l: 0.42, w: 0.24, h: 0.26 }, muz: { l: 0.32, w: 0.19, h: 0.21, drop: 0.2 }, eye: { k: 0.9 }, ear: { k: 'prick', s: 0.14 }, leg: { w: 0.1, hoof: '#2a2420', low: '#3a2618' }, tail: { k: 'bushy', l: 0.85, w: 0.16, a: 158, c: '#3a2618' } };
const QFOX: Q = { c: '#d8682a', H: 0.4, L: 0.6, D: 0.2, W: 0.18, tuck: 0.35, belly: WH, neck: { l: 0.12, w: 0.1, lean: 40 }, head: { l: 0.13, w: 0.13, h: 0.11 }, muz: { l: 0.1, w: 0.05, h: 0.05, c: WH, drop: 0.16 }, eye: { c: '#a87a1a' }, ear: { k: 'prick', s: 0.09, c: '#2a2018', in: '#f4ece0' }, leg: { w: 0.035, low: '#2a2018' }, tail: { k: 'bushy', l: 0.42, w: 0.13, a: 112, tip: WH } };
const foxMarks: QMark[] = [chest(WH), onHead(WH, [0.6, 0.45, 0.45], [0, -0.22, 0.35])];
const QGIR: Q = { c: '#e8b45a', H: 3.2, L: 2.1, D: 1.15, W: 0.8, tuck: 0.3, rump: 0.82, neck: { l: 2.2, w: 0.3, lean: 22, base: 0.62 }, head: { l: 0.55, w: 0.3, h: 0.32 }, muz: { l: 0.28, w: 0.2, h: 0.2, c: '#d9a35f', drop: 0.12 }, eye: { k: 0.9 }, ear: { k: 'side', s: 0.18, in: '#f0d8a8' }, leg: { w: 0.13, hoof: '#3a2a20' }, tail: { k: 'tuft', l: 0.9, w: 0.04, a: 165, tip: '#2a1a10' } };
const girMarks = (k = 1): QMark[] => [spotsQ('#8a5a2b', 34, 0.3 * k, { lo: -50, hi: 90, flat: 0.15 }), spotsQ('#8a5a2b', 0, 0.16 * k, { neck: 16 }), hornsQ('#d8a860', 0.18 * k, 'knob', 0.35), maneQ('#8a5a2b', 0.6), tongueQ('#4a3a5a', 0.4 * k)];
/** Sharks: gill slits behind the head, a row of teeth along the jaw, a dark eye. */
const sharkFace = (): FIMark => (f, d) => {
  const [w, h, cy] = d.sec(0.95), L = d.o.L;
  for (let i = 0; i < 5; i++) f.pair((s) => f.ball([d.W * 0.01, h * 0.5, d.Lb * 0.008], [s * d.sec(0.83 - i * 0.022)[0] * 0.98, d.sec(0.83 - i * 0.022)[2] - h * 0.02, d.z(0.83 - i * 0.022)], { color: '#4a545c', parent: 'body', noInk: true }));
  for (let i = 0; i < 6; i++) f.pair((s) => f.cone([L * 0.008, h * 0.22, L * 0.008], [s * w * (0.95 - i * 0.07), cy - h * 0.5, d.z(0.9 + i * 0.012)], { color: '#fffaf0', rot: [180, 0, 0], parent: 'body' }));
};
const QHYENA: Q = { c: '#b89c70', H: 0.8, L: 0.95, D: 0.4, W: 0.36, tuck: 0.3, rump: 0.78, neck: { l: 0.24, w: 0.24, lean: 48, base: 0.32 }, head: { l: 0.24, w: 0.22, h: 0.2 }, muz: { l: 0.13, w: 0.11, h: 0.11, c: '#3a3028', drop: 0.15 }, eye: { k: 0.8 }, ear: { k: 'round', s: 0.09, in: '#3a3028' }, leg: { w: 0.07 }, tail: { k: 'tuft', l: 0.3, w: 0.04, a: 160, tip: '#2a2018' } };
const hyenaMarks = (): QMark[] => [spotsQ('#4a3828', 34, 0.06), maneQ('#4a3828', 0.7)];
/** Rosettes: dark rings round a darker-gold middle (jaguar, leopard). */
const rosettes = (ring: string, mid: string, n: number): QMark => (f, d) => {
  let r = 21;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const t = 0.08 + 0.84 * rnd(), th = (-30 + 120 * rnd()) * (Math.PI / 180), side = i % 2 ? 1 : -1, [w, h, cy] = d.sec(t), nx = Math.cos(th), ny = Math.sin(th);
    const at: Vec3 = [side * w * nx * 0.99, cy + h * ny * 0.99, d.z(t)], sz = 0.06 + rnd() * 0.03;
    f.ball([sz * 0.4, sz, sz * 1.2], at, { color: ring, parent: 'body', noInk: true, rot: aim([side * nx, ny, 0]) }).ball([sz * 0.42, sz * 0.55, sz * 0.7], add3(at, [side * nx * 0.003, ny * 0.003, 0]), { color: mid, parent: 'body', noInk: true, rot: aim([side * nx, ny, 0]) });
  }
};
/** Throat grooves of the big whales: thin pale lines along the underside of the head and chest. */
const grooves = (c: string, n = 7): FIMark => (f, d) => {
  const t = 0.82, [w, h, cy] = d.sec(t);
  for (let i = 0; i < n; i++) {
    const u = ((i - (n - 1) / 2) / ((n - 1) / 2)) * 0.62, y = cy - h * Math.sqrt(1 - u * u) * 0.99;
    f.ball([d.W * 0.03, d.H * 0.035, d.Lb * 0.26], [u * w, y, d.z(t)], { color: c, parent: 'body', noInk: true });
  }
};

/* ----- apes: a furry person with long arms, short legs, a hunch, a muzzle and big ears ----- */

const ape = (key: string, h: number, fur: string, face: string, build: number, ...acc: Extra[]): Figure => {
  const fig = who(key, {
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
      (p, d) => p.add(P('head', 'ball', [d.headW * 0.72, d.headH * 0.48, d.headD * 0.55], [0, d.headY - d.headH * 0.22, d.headD * 0.4], face, { layer: 4 })),
      (p, d) => p.add(P('head', 'ball', [d.headW * 0.36, d.headH * 0.12, d.headD * 0.2], [0, d.headY - d.headH * 0.15, d.headD * 0.66], '#3a2a24', { noInk: true, layer: 5 })),
      (p, d) => both(p, 'ear', (q, s) => Object.assign(q, { at: [s * d.headW * 0.6, d.headY, -d.headD * 0.04], size: [d.headW * 0.4, d.headH * 0.46, d.headD * 0.14], color: col(face, face) })),
      (p, d) => p.add(P('head', 'box', [d.headW * 0.9, d.headH * 0.14, d.headD * 0.24], [0, d.headY + d.headH * 0.12, d.headD * 0.36], fur, { round: 0.8, layer: 4 })),
      (p, d) => both(p, 'hand', (q) => void (q.size = mul(q.size, 1.4))),
      (p, d) => both(p, 'foot', (q) => void (q.color = col(face, face))),
      ...acc,
    ],
  });
  // ape proportions: arms a third longer, legs a fifth shorter, a forward hunch with the head held up
  const ARM = 1.35, LEG = 0.78;
  const parts = fig.parts.map((q) => ({ ...q }));
  const g = (n: string) => parts.find((q) => q.name === n)!;
  for (const s of ['L', 'R']) {
    const arm = g('arm' + s), fore = g('fore' + s), hand = g('hand' + s), leg = g('leg' + s), shin = g('shin' + s), foot = g('foot' + s);
    arm.size = [arm.size[0] * 1.15, arm.size[1] * ARM, arm.size[2] * 1.15];
    if (arm.off) arm.off = [arm.off[0], arm.off[1] * ARM, arm.off[2]];
    fore.at = [fore.at[0], fore.at[1] * ARM, fore.at[2]];
    fore.size = [fore.size[0] * 1.1, fore.size[1] * ARM, fore.size[2] * 1.1];
    if (fore.off) fore.off = [fore.off[0], fore.off[1] * ARM, fore.off[2]];
    hand.at = [hand.at[0], hand.at[1] * ARM, hand.at[2]];
    leg.size = [leg.size[0] * 1.1, leg.size[1] * LEG, leg.size[2] * 1.1];
    if (leg.off) leg.off = [leg.off[0], leg.off[1] * LEG, leg.off[2]];
    shin.at = [shin.at[0], shin.at[1] * LEG, shin.at[2]];
    shin.size = [shin.size[0], shin.size[1] * LEG, shin.size[2]];
    if (shin.off) shin.off = [shin.off[0], shin.off[1] * LEG, shin.off[2]];
    foot.at = [foot.at[0], foot.at[1] * LEG, foot.at[2]];
    foot.size = [foot.size[0] * 1.1, foot.size[1], foot.size[2] * 1.05];
    arm.rot = [-16, 0, s === 'L' ? 1 : -1];
    leg.rot = [-14, 0, s === 'L' ? 6 : -6];
    shin.rot = [22, 0, 0];
  }
  const hips = g('hips');
  hips.at = [hips.at[0], hips.at[1] * LEG * 0.97, hips.at[2]];
  g('torso').rot = [18, 0, 0];
  g('head').rot = [-20, 0, 0];
  return measure({ ...fig, parts });
};

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
/** Hard wing cases over the abdomen (beetles), named caseL/R and hinged at the front so they can lift open. */
const elytra = (c: string, k = 1, pron?: string): BX => (p, { L }) => {
  cut(p.list, ['wingL', 'wingR']);
  for (const [n, s] of SIDES) p.add(P('abdomen', 'ball', [0.21 * L, 0.34 * L, 0.52 * L * k], [s * 0.094 * L, 0.06 * L, 0.06 * L], c, { name: 'case' + n, off: [0, -0.025 * L, -0.23 * L * k], layer: 3, edge: 'sharp' }));
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

/* ----- odd shapes built from solids ----- */

/** Kangaroo standing on its big feet, leaning on its tail; kh enlarges the head (a joey). */
const roo = (key: string, k: number, kh: number, c: string, pouch = false): Figure => {
  const S = (v: Vec3): Vec3 => mul(v, k);
  const hc: Vec3 = [0, 1.18, 0.24];
  const Hd = (v: Vec3): Vec3 => mul([hc[0] + (v[0] - hc[0]) * kh, hc[1] + (v[1] - hc[1]) * kh, hc[2] + (v[2] - hc[2]) * kh], k);
  const hs = k * kh, pale = '#ecd6b8';
  const f = m(key, { view: 'side', rig: 'quad' });
  f.ball(S([0.4, 0.78, 0.42]), S([0, 0.68, 0.06]), { color: c, rot: [18, 0, 0], name: 'body' })
    .ball(S([0.3, 0.48, 0.24]), S([0, 0.58, 0.19]), { color: pale, rot: [18, 0, 0], noInk: true, parent: 'body' });
  // big hind legs folded under, long feet flat on the ground; short arms held in front
  f.pair((s) => {
    const sd = s > 0 ? 'L' : 'R';
    f.ball(S([0.2, 0.44, 0.42]), S([s * 0.13, 0.3, -0.02]), { color: c, rot: [15, 0, 0], name: 'legB' + sd, parent: 'body', pivot: S([s * 0.13, 0.45, 0]) })
      .box(S([0.1, 0.07, 0.44]), S([s * 0.12, 0.035, 0.1]), { color: c, round: 0.8, parent: 'legB' + sd })
      .rod(S([s * 0.13, 0.95, 0.24]), S([s * 0.11, 0.78, 0.34]), 0.06 * k, c, { name: 'legF' + sd, parent: 'body', pivot: S([s * 0.13, 0.95, 0.24]) })
      .ball(0.06 * k, S([s * 0.11, 0.76, 0.35]), { color: '#5a3a2a', parent: 'legF' + sd });
  });
  // a thick tail tapering to the ground behind: a third leg to lean on
  const tb = S([0, 0.42, -0.14]), tt = S([0, 0.04, -0.95]), td: Vec3 = [tt[0] - tb[0], tt[1] - tb[1], tt[2] - tb[2]], tl = Math.hypot(td[1], td[2]);
  f.loft([0.17 * k, 0.17 * k, tl], mul(add3(tb, tt), 0.5), [[0, 1, 1, 0], [0.5, 0.62, 0.62, 0], [1, 0.26, 0.26, 0]], { color: c, rot: [(Math.atan2(-td[1], td[2]) * 180) / Math.PI, 0, 0], name: 'tail', parent: 'body', pivot: tb });
  f.ball(mul([0.2, 0.2, 0.26], hs), Hd([0, 1.18, 0.24]), { color: c, name: 'head', parent: 'body', pivot: S([0, 1.06, 0.16]) })
    .ball(mul([0.12, 0.12, 0.18], hs), Hd([0, 1.14, 0.38]), { color: c, parent: 'head' })
    .ball(mul([0.06, 0.04, 0.04], hs), Hd([0, 1.17, 0.47]), { color: '#2a2420', parent: 'head', noInk: true })
    .ball(mul([0.08, 0.04, 0.12], hs), Hd([0, 1.09, 0.38]), { color: pale, name: 'jaw', parent: 'head', pivot: Hd([0, 1.1, 0.3]) });
  f.pair((s) =>
    f.cone(mul([0.08, 0.2, 0.04], hs), Hd([s * 0.06, 1.36, 0.17]), { color: c, rot: [-12, 0, -s * 14], name: s > 0 ? 'earL' : 'earR', parent: 'head', pivot: Hd([s * 0.05, 1.26, 0.17]) })
      .cone(mul([0.045, 0.13, 0.02], hs), Hd([s * 0.062, 1.35, 0.185]), { color: '#e8b0a0', rot: [-12, 0, -s * 14], parent: s > 0 ? 'earL' : 'earR', noInk: true })
      .ball(mul([0.04, 0.045, 0.03], hs), Hd([s * 0.075, 1.22, 0.33]), { color: '#1d1a17', eye: true, parent: 'head', noInk: true }),
  );
  if (pouch) f.ball(S([0.26, 0.2, 0.06]), S([0, 0.5, 0.27]), { color: '#d8b890', parent: 'body', noInk: true }).socket('pouch', S([0, 0.58, 0.24]), 'slot', { part: 'body', size: 0.3 * k });
  return f.done();
};

/* ----- a koala sitting up, holding a eucalyptus sprig ----- */
const koala = (key: string, k: number): Figure => {
  const S = (v: Vec3): Vec3 => mul(v, k);
  const c = '#9c9ca2', pale = '#ecebe6', dk = '#2a2624';
  const f = m(key, { view: 'side', rig: 'quad' });
  f.ball(S([0.34, 0.42, 0.3]), S([0, 0.22, -0.02]), { color: c, rot: [-10, 0, 0], name: 'body' })
    .ball(S([0.24, 0.3, 0.16]), S([0, 0.22, 0.09]), { color: pale, parent: 'body', noInk: true })
    .ball(S([0.1, 0.08, 0.08]), S([0, 0.06, -0.15]), { color: c, name: 'tail', parent: 'body' });
  f.pair((s) => {
    const sd = s > 0 ? 'L' : 'R';
    f.ball(S([0.11, 0.12, 0.2]), S([s * 0.11, 0.07, 0.08]), { color: c, name: 'legB' + sd, parent: 'body', pivot: S([s * 0.1, 0.1, 0.0]) })
      .ball(S([0.07, 0.05, 0.08]), S([s * 0.12, 0.03, 0.18]), { color: dk, parent: 'legB' + sd })
      .rod(S([s * 0.14, 0.34, 0.04]), S([s * 0.07, 0.24, 0.17]), 0.075 * k, c, { name: 'legF' + sd, parent: 'body', pivot: S([s * 0.14, 0.34, 0.04]) })
      .ball(S([0.06, 0.05, 0.05]), S([s * 0.05, 0.24, 0.19]), { color: dk, parent: 'legF' + sd });
  });
  // the eucalyptus sprig in its paws
  f.stick(S([0, 0.12, 0.21]), S([0.02, 0.46, 0.24]), 0.012 * k, '#6a5038', { name: 'sprig', parent: 'body', edge: 'sharp' })
    .each(6, (i) => f.ball(S([0.05, 0.015, 0.025]), S([(i % 2 ? 1 : -1) * 0.035, 0.3 + i * 0.03, 0.24]), { color: '#7a9a7a', rot: [0, 0, (i % 2 ? 1 : -1) * 30], parent: 'sprig' }));
  // a big round head, a big leathery nose, fluffy ears
  f.ball(S([0.25, 0.22, 0.21]), S([0, 0.52, 0.04]), { color: c, name: 'head', parent: 'body', pivot: S([0, 0.42, 0.0]) })
    .ball(S([0.075, 0.1, 0.065]), S([0, 0.5, 0.15]), { color: dk, parent: 'head' })
    .ball(S([0.08, 0.03, 0.05]), S([0, 0.43, 0.12]), { color: pale, name: 'jaw', parent: 'head', pivot: S([0, 0.44, 0.08]) });
  f.pair((s) => {
    const n = s > 0 ? 'earL' : 'earR';
    f.ball(S([0.13, 0.12, 0.05]), S([s * 0.14, 0.62, -0.01]), { color: c, rot: [0, 0, -s * 20], name: n, parent: 'head', pivot: S([s * 0.1, 0.58, 0]) })
      .ball(S([0.09, 0.08, 0.03]), S([s * 0.145, 0.62, 0.01]), { color: pale, rot: [0, 0, -s * 20], parent: n, noInk: true })
      .ball(S([0.022, 0.026, 0.02]), S([s * 0.06, 0.55, 0.13]), { color: '#1d1a17', eye: true, parent: 'head', noInk: true });
  });
  f.socket('mouth', S([0, 0.44, 0.17]), 'mouth', { part: 'head', size: 0.08 * k });
  return f.done();
};

/* ----- a jellyfish: a see-through bell, frilly mouth arms, long trailing tentacles, a glow inside ----- */
const jellyfish = (key: string, c: string, rimC: string): Figure => {
  const f = m(key, { rig: 'fish' });
  f.dome([0.3, 0.2, 0.3], [0, 0.42, 0], { color: c, name: 'body' })
    .ball(0.1, [0, 0.47, 0], { color: '#f8e0f0', glow: true, name: 'glow', parent: 'body', mover: { kind: 'light' } })
    .torus([0.3, 0.3, 0.03], [0, 0.42, 0], { color: rimC, rot: [90, 0, 0], tube: 0.16, parent: 'body' })
    .each(4, (i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      f.torus([0.06, 0.06, 0.012], [Math.cos(a) * 0.05, 0.6, Math.sin(a) * 0.05], { color: '#c060a8', rot: [90, 0, 0], tube: 0.3, parent: 'body', noInk: true });
    })
    .each(4, (i) => {
      const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 0.035, z = Math.sin(a) * 0.035;
      f.rod([x, 0.42, z], [x * 1.8, 0.28, z * 1.8], 0.04, '#e070b8', { parent: 'body' }).rod([x * 1.8, 0.28, z * 1.8], [x * 0.9, 0.14, z * 0.9], 0.032, '#e070b8', { parent: 'body' }).rod([x * 0.9, 0.14, z * 0.9], [x * 1.4, 0.04, z * 1.4], 0.024, '#e070b8', { parent: 'body' });
    })
    .each(12, (i) => {
      const a = (i / 12) * Math.PI * 2 + 0.2, x = Math.cos(a) * 0.14, z = Math.sin(a) * 0.14;
      f.rod([x, 0.42, z], [x * 1.12, 0.26, z * 1.12], 0.008, rimC, { parent: 'body' }).rod([x * 1.12, 0.26, z * 1.12], [x * 0.92, 0.1, z * 0.92], 0.007, rimC, { parent: 'body' }).rod([x * 0.92, 0.1, z * 0.92], [x * 1.05, 0.01, z * 1.05], 0.006, rimC, { parent: 'body' });
    });
  return f.done();
};

/** Small round-bodied creature segments in a row (caterpillars). */
const caterpillar = (key: string, L: number, c1: string, c2: string, head: string): Figure => {
  const n = 8, d = L / 7.5;
  const f = m(key, { view: 'side', rig: 'bug' });
  f.each(n, (i) => {
    const z = L * 0.38 - i * d * 0.95;
    f.ball([d * 1.15, d * 1.2, d * 1.05], [0, d * 0.62 + (i % 2) * d * 0.06, z], { color: i % 2 ? c2 : c1, ...(i ? { parent: 'body' } : { name: 'body' }) })
      .pair((s) => f.ball(d * 0.3, [s * d * 0.32, d * 0.14, z], { color: '#3a3a2a', noInk: true, parent: 'body' }))
      .pair((s) => f.ball(d * 0.18, [s * d * 0.54, d * 0.75, z], { color: '#f8e04a', noInk: true, parent: 'body' }));
  });
  f.ball([d * 1.2, d * 1.2, d * 1.1], [0, d * 0.8, L * 0.38 + d * 0.8], { color: head, name: 'head', parent: 'body' })
    .pair((s) =>
      f.ball(d * 0.32, [s * d * 0.3, d * 1.0, L * 0.38 + d * 1.25], { color: '#1d1a17', eye: true, parent: 'head' })
        .rod([s * d * 0.25, d * 1.3, L * 0.38 + d * 0.9], [s * d * 0.45, d * 2.0, L * 0.38 + d * 1.2], d * 0.12, '#2a2420', { parent: 'head' })
        .ball(d * 0.22, [s * d * 0.45, d * 2.05, L * 0.38 + d * 1.22], { color: '#2a2420', parent: 'head' }),
    );
  return f.done();
};

/** The sculpted four-legged and fish builders and their marks, shared with animals-b (horses, cattle, deer, big cats
 *  and sharks there), so both chunks draw an animal of a kind the same way. */
export { QK, grow, limbsQ, hornsQ, antlersQ, maneQ, chest, blazeQ, faceQ, socksQ, patch, back as backQ, onHead, spotsQ, ruffQ, QHORSE, type Q, type QD, type QMark };
export { FK, fSpots, fLine, fBands, sharkFace, type FI, type FID, type FIMark };

/* ----- the entries ------------------------------------------------------------------------------------------- */

export const ENTRIES: CatalogEntry[] = [
  e('adder', 'wild', 'reptiles', () =>
    act(snk('adder', { length: 0.65, color: '#9a8a62', girth: 0.07 }, { c: '#2e2620', k: 'zig', n: 4 }, { k: 1.15, flat: 1.2 }), hiss('Hsss!'), strike('Hss!')),
  ),
  e('akita', 'pets', 'dog breeds', () =>
    actF(QK('akita', { c: '#c8743a', H: 0.66, L: 0.72, D: 0.33, W: 0.3, tuck: 0.22, neck: { l: 0.17, w: 0.19, lean: 32 }, head: { l: 0.2, w: 0.19, h: 0.17 }, muz: { l: 0.1, w: 0.1, h: 0.095, c: '#f4ead8', drop: 0.15 }, eye: { k: 0.85 }, ear: { k: 'prick', s: 0.09 }, leg: { w: 0.07 }, tail: { k: 'curl', l: 0.2, w: 0.075, a: 30 } }, chest('#f4ead8'), onHead('#f4ead8', [0.62, 0.42, 0.44], [0, -0.1, 0.34]), socksQ('#f4ead8', 0.2)), (f) => [sitQ(f, 'Woof.'), bark('Woof! Woof!')]),
  ),
  e('albatross', 'aviary', 'seabirds', () =>
    act(AVK('albatross', { H: 0.8, c: '#f6f6f2', wing: '#3a3a3e', tip: '#26262a', tail: '#3a3a3e', beak: '#f0c08a', legs: '#e8b4a8', len: 0.62, fat: 0.5, up: 16, bl: 0.17, bk: 'hook', bw: 0.9, leg: 0.2, lw: 1.2, tl: 0.14, tk: 'wedge', wl: 1.3 }, avHead('#9a9aa0', [0.5, 0.25, 0.6], [0.55, 0.32, 0.2], { mirror: true })), spread('Squawk!', 85, 1.6), flyUp('Ah-ah-ah!', 2)),
  ),
  // Real size wins over the vocabulary's 4 m height: that is its length; an alligator 4 m long stands about 0.4 m tall.
  e('alligator', 'wild', 'reptiles', () =>
    act(RK('alligator', { L: 4.0, bf: 0.34, tf: 0.46, hf: 0.16, w: 0.14, h: 0.085, c: '#3e4a32', belly: '#d8d0a8', ridge: '#2e3826', leg: 0.1, lw: 0.024, snout: 'gator', scutes: 16, teeth: 8, eye: '#a8b040' }),
      [A.operate('jaw', 'open'), A.say('Hsss!', 1.5), A.wait(1.2), A.par(A.operate('jaw', 'close'), A.anim('shake'), say('SNAP!', 1))],
      [A.par(ps('head', [-12, 0, 0], 0.5), ps('tail', [0, 18, 0], 0.5), say('Grrrumph!', 2)), A.effect('water_spray', { dur: 1 }), A.wait(1.2), rest('head', 'tail')]),
  ),
  // Real size wins over the vocabulary's 6 m height: that is its length; the 6 m anaconda lies coiled, head raised under a metre.
  e('anaconda', 'wild', 'reptiles', () =>
    act(snk('anaconda', { length: 6, color: '#5a6a2a', girth: 0.05 }, { c: '#1e2210', k: 'blot', n: 3 }, { k: 1.15, rise: 0.35 }), hiss('Hsss...'), [A.par(ps('seg2', [0, 0, 22], 1.2), ps('seg3', [0, 0, -26], 1.2), ps('seg4', [0, 0, 26], 1.2), say('Sssqueeze...', 2)), A.wait(1), rest('seg2', 'seg3', 'seg4')]),
  ),
  e('angelfish', 'sea', 'reef fish', () =>
    act(FK('angelfish', { L: 0.15, c: '#e8e4d0', fin: '#dcd6be', h: 0.6, w: 0.08, shape: 'deep', tail: 'fan', tl: 0.2, dorsal: 0.75, dz: 0.5, dl: 0.42, anal: 0.75, sw: 0.5, pec: 0.7, eye: 1.1 }, fBands('#2a2420', [0.3, 0.6, 0.86], 0.06, 1.02)), swimSpin('Blub!'), gulp('Blub blub.')),
  ),
  e('anglerfish', 'sea', 'deep sea', () =>
    act(FK('anglerfish', { L: 0.3, c: '#4a3a40', fin: '#3a2a30', h: 0.5, w: 0.36, shape: 'blunt', tail: 'round', tl: 0.18, dorsal: 0.3, dz: 0.35, pec: 1.0, eye: 0.6, ez: 0.8, mouth: '#2a1a1e' }, (f, d) => {
      const [, h, cy] = d.sec(0.82), L = d.o.L, top: Vec3 = [0, cy + h * 0.9, d.z(0.82)], mid = add3(top, [0, h * 1.1, L * 0.04]), tip = add3(top, [0, h * 0.85, L * 0.22]);
      f.rod(top, mid, L * 0.014, '#5a4a4a', { parent: 'body' }).rod(mid, tip, L * 0.011, '#5a4a4a', { parent: 'body' })
        .ball(L * 0.075, add3(tip, [0, -L * 0.03, 0]), { color: '#f8f0a0', glow: true, name: 'lure', parent: 'body', mover: { kind: 'light', on: true } });
      const [jw, jh, jcy] = d.sec(0.96);
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * jw * 0.3;
        f.cone([L * 0.016, jh * 0.55, L * 0.016], [x, jcy - jh * 0.05, d.z(0.985)], { color: '#fffaf0', rot: [165, 0, 0], parent: 'body' }).cone([L * 0.016, jh * 0.5, L * 0.016], [x * 0.9, jcy - jh * 0.75, d.z(0.975)], { color: '#fffaf0', rot: [15, 0, 0], parent: 'jaw' });
      }
    }),
      [A.operate('lure', 'off'), A.wait(0.5), A.operate('lure', 'on'), A.wait(0.6), A.par(ps('jaw', [38, 0, 0], 0.15), say('CHOMP!', 1.2)), A.wait(0.5), ps('jaw', [0, 0, 0], 0.12)],
      swimSpin('...')),
  ),
  e('ankylosaurus', 'wild', 'dinosaurs', () =>
    act(QK('ankylosaurus', { c: '#8a7a50', H: 1.7, L: 3.6, D: 1.0, W: 2.0, tuck: 0, rump: 1.04, belly: '#c8b888', neck: { l: 0.35, w: 0.6, lean: 72 }, head: { l: 0.55, w: 0.62, h: 0.4 }, muz: { l: 0.22, w: 0.42, h: 0.25, drop: 0.22 }, eye: { k: 0.8 }, ear: { k: 'tiny', s: 0.02 }, leg: { w: 0.3, k: 1.3, paw: '#5a4a30' }, tail: { k: 'club', l: 3.0, w: 0.36, a: 96, tip: '#6a5a3a' } }, studs('#e2d6b8', [[88, 7, 0.22, 'knob'], [60, 8, 0.2, 'knob'], [32, 8, 0.2, 'knob'], [6, 7, 0.45, 'cone']]), onHead('#6a5a3a', [0.18, 0.3, 0.2], [0.46, 0.38, -0.3], { mirror: true, shape: 'cyl', taper: 0, rot: [0, 0, -50], ink: true })),
      [A.par(ps('tail', [0, 50, 0], 0.35), say('Thwack!', 1.4)), ps('tail', [0, -50, 0], 0.4), A.par(A.effect('dust', { dur: 1.2 }), rest('tail'))],
      roar('Hrrrrnk!', 30)),
  ),
  // Real size (1.2 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('ant', 'bugs', 'ants', () =>
    act(bug('ant', { length: 0.012, color: '#2a2220', wings: 'none', extras: antBody('#2a2220', '#2a2220') }), feel('!'), scurry('!')),
  ),
  e('anteater', 'wild', 'jungle', () =>
    act(QK('anteater', { c: '#7d6e5e', H: 0.62, L: 0.95, D: 0.42, W: 0.32, tuck: 0.1, neck: { l: 0.25, w: 0.24, lean: 65 }, head: { l: 0.16, w: 0.12, h: 0.12 }, muz: { l: 0.36, w: 0.055, h: 0.055, drop: 0.12 }, nose: '#1a1614', eye: { k: 0.6 }, ear: { k: 'tiny', s: 0.035 }, leg: { w: 0.075, k: 1.2, paw: '#2a2420' }, tail: { k: 'flat', l: 0.7, w: 0.3, a: 112, c: '#5a4e42' } }, (f, d) => {
      const { H, D, L, W } = d.q;
      f.ball([W * 1.08, D * 0.46, L * 0.5], [0, H - D * 0.35, L * 0.24], { color: '#f2ece0', parent: 'body', noInk: true, rot: [38, 0, 0] })
        .ball([W * 1.1, D * 0.26, L * 0.52], [0, H - D * 0.36, L * 0.23], { color: '#1e1c1a', parent: 'body', noInk: true, rot: [38, 0, 0] });
    }, socksQ('#e8e2d6', 0.7, 'FL,FR'), tongueQ('#d86a7a', 0.3)),
      sniff('Sniff sniff...'),
      [A.par(A.pose('tongue', { scale: 1, dur: 0.15 }), say('Slurp!', 1.4)), A.pose('tongue', { scale: 0, dur: 0.15 }), A.pose('tongue', { scale: 1, dur: 0.15 }), A.pose('tongue', { scale: 0, dur: 0.15 }), A.pose('tongue', { scale: 1, dur: 0.15 }), A.pose('tongue', { scale: 0, dur: 0.2 })]),
  ),
  e('antelope', 'wild', 'savanna', () =>
    act(QK('antelope', { c: '#b8723e', H: 0.9, L: 0.92, D: 0.38, W: 0.3, tuck: 0.5, belly: '#f4ece0', neck: { l: 0.4, w: 0.13, lean: 25 }, head: { l: 0.22, w: 0.12, h: 0.13 }, muz: { l: 0.13, w: 0.075, h: 0.08, drop: 0.15 }, eye: { k: 1.3 }, ear: { k: 'long', s: 0.15, in: '#f4ece0', tilt: 30 }, leg: { w: 0.04, hoof: '#2a2420' }, tail: { k: 'flat', l: 0.2, w: 0.06, a: 160, tip: WH } }, back('#8a4e28', 0.08, 0.86, 1.03), hornsQ('#2a2420', 0.5, 'lyre', 0.12), onHead(WH, [0.32, 0.24, 0.2], [0.26, 0.22, 0.22], { mirror: true }), onHead(WH, [0.5, 0.3, 0.3], [0, -0.3, 0.6])),
      [A.par(A.anim('hop', 2), say('Snort!', 1.2))],
      graze('Munch munch.')),
  ),
  e('arctic fox', 'wild', 'polar', () =>
    act(QK('arctic fox', { c: '#f4f4f2', H: 0.3, L: 0.46, D: 0.17, W: 0.17, tuck: 0.25, neck: { l: 0.1, w: 0.1, lean: 40 }, head: { l: 0.11, w: 0.11, h: 0.095 }, muz: { l: 0.065, w: 0.045, h: 0.045, drop: 0.2 }, eye: { c: '#3a2a1a' }, ear: { k: 'round', s: 0.045, in: '#e8dcd8' }, leg: { w: 0.03 }, tail: { k: 'bushy', l: 0.32, w: 0.11, a: 105 } }),
      [A.par(A.anim('hop'), A.effect('snow', { dur: 1.2 }), say('Yip!', 1.2))],
      sniff('Sniff... sniff...')),
  ),
  e('armadillo', 'wild', 'desert', () =>
    act(QK('armadillo', { c: '#a89078', H: 0.2, L: 0.36, D: 0.17, W: 0.22, tuck: 0, belly: '#d8c4b4', neck: { l: 0.04, w: 0.07, lean: 65, c: '#c8b0a0' }, head: { l: 0.08, w: 0.06, h: 0.055, c: '#b8a090' }, muz: { l: 0.07, w: 0.03, h: 0.03, c: '#c8b0a0', drop: 0.15 }, eye: { k: 0.7 }, ear: { k: 'long', s: 0.032, c: '#c8b0a0' }, leg: { w: 0.025, c: '#c8b0a0', paw: '#6a5a4a' }, tail: { k: 'whip', l: 0.32, w: 0.04, a: 112, c: '#a89078' } }, ...Array.from({ length: 9 }, (_, i) => patch('#7a6450', 0.3 + i * 0.045, 0.315 + i * 0.045)), onHead('#a89078', [0.95, 0.4, 0.8], [0, 0.4, 0.05], { ink: true })),
      [A.par(A.anim('hop'), say('!', 1))],
      dig('Snuffle snuffle...')),
  ),
  e('baboon', 'wild', 'savanna', () =>
    act(QK('baboon', { c: '#8a7a56', H: 0.6, L: 0.72, D: 0.34, W: 0.3, tuck: 0.25, rump: 0.86, neck: { l: 0.15, w: 0.2, lean: 55 }, head: { l: 0.16, w: 0.16, h: 0.15 }, muz: { l: 0.17, w: 0.1, h: 0.1, c: '#4a3e36', drop: 0.22 }, eye: { c: '#5a3a1a' }, ear: { k: 'tiny', s: 0.03, c: '#4a3e36' }, leg: { w: 0.06, k: 1.1, paw: '#3a302a' }, tail: { k: 'long', l: 0.52, w: 0.04, a: 40 } }, ruffQ('#9a8a62', 0.9), (f, d) => f.ball([d.q.W * 0.62, d.q.D * 0.42, d.q.L * 0.1], [0, d.Hr - d.q.D * 0.48, -d.q.L * 0.48], { color: '#d06a6a', parent: 'body', noInk: true })),
      [A.par(ps('neck', [-18, 0, 0], 0.5), ps('head', [-10, 0, 0], 0.5), ps('jaw', [42, 0, 0], 0.5), say('Wahoo!', 1.6)), A.wait(0.9), rest('neck', 'head', 'jaw')],
      [A.par(A.anim('look_around'), say('Ooh? Ooh!', 1.6))]),
  ),
  e('badger', 'wild', 'forest', () =>
    act(QK('badger', QBADGER, badgerFace), dig('Grrr!'), sniff('Snuffle...')),
  ),
  e('badger cub', 'wild', 'forest', () =>
    act(QK('badger cub', grow(QBADGER, 0.5, 1.3, 0.9), badgerFace), [A.par(A.anim('hop'), say('Squeak!', 1.2))], sniff('Snuffle?')),
  ),
  e('barracuda', 'sea', 'ocean fish', () =>
    act(FK('barracuda', { L: 1.4, c: '#a8b4bc', belly: '#eef2f4', fin: '#6a7880', h: 0.13, w: 0.1, shape: 'long', tail: 'fork', tl: 0.16, dorsal: 0.7, dz: 0.5, dl: 0.07, anal: 0.5, pec: 0.8, eye: 1.3, ez: 0.86 }, fBands('#7a8a96', [0.25, 0.35, 0.45, 0.55, 0.65], 0.025, 1.01), (f, d) => {
      const [, h, cy] = d.sec(0.22);
      f.wedge([d.o.L * 0.07, h * 1.0, d.o.L * 0.008], [0, cy + h * 1.4, d.z(0.22)], { color: '#6a7880', rot: [0, 90, 0], apex: 0.3, parent: 'body' });
      const [jw, jh, jcy] = d.sec(0.97);
      f.cone([jw * 1.3, d.o.L * 0.07, jh * 0.8], [0, jcy - jh * 0.6, d.z(1) + d.o.L * 0.02], { color: '#c8d0d6', rot: [90, 0, 0], parent: 'jaw' });
      for (let i = 0; i < 4; i++) f.pair((s) => f.cone([d.o.L * 0.006, jh * 0.4, d.o.L * 0.006], [s * jw * 0.6, jcy - jh * 0.25, d.z(0.94 + i * 0.015)], { color: '#fffaf0', rot: [180, 0, 0], parent: 'body' }));
    }),
      gulp('Snap!', 35),
      [A.par(A.move('self', { rel: 'random' }, { speed: 'run' }), say('!', 1))]),
  ),
  e('bass (fish)', 'sea', 'freshwater fish', () =>
    act(FK('bass (fish)', { L: 0.45, c: '#5e7e42', belly: '#e8e4c8', fin: '#6a8050', h: 0.3, w: 0.13, tail: 'fork', tl: 0.2, dorsal: 0.45, dz: 0.5, dl: 0.32, anal: 0.3, eye: 1.1, mouth: '#e8e4c8' }, fLine('#2e4a22', 0.12, 0.8, 0.02, 0.12)), splash('Splash!'), gulp('Gulp!', 38)),
  ),
  e('basset hound', 'pets', 'dog breeds', () =>
    act(QK('basset hound', { c: WH, H: 0.36, L: 0.72, D: 0.26, W: 0.28, tuck: 0.05, neck: { l: 0.13, w: 0.14, lean: 50 }, head: { l: 0.2, w: 0.14, h: 0.14, c: '#b8742e' }, muz: { l: 0.13, w: 0.1, h: 0.11, c: WH, drop: 0.2 }, eye: { k: 0.8 }, ear: { k: 'drop', s: 0.24, c: '#9a5a24' }, leg: { w: 0.07, k: 1.3, hock: 0.6 }, tail: { k: 'long', l: 0.3, w: 0.04, a: 40, tip: WH } }, back(BK, 0.15, 0.72), patch('#b8742e', 0.02, 0.15), blazeQ(WH)),
      howl('Aroooo...', 30),
      sniff('Sniff... sniff...')),
  ),
  e('bat (animal)', 'wild', 'forest', () =>
    act((() => {
      const c = '#4a3a30', wc = '#3a2c26', bone = '#2e2420';
      const f = m('bat (animal)', { rig: 'bird' });
      f.ball([0.06, 0.09, 0.05], [0, 0.12, 0], { color: c, name: 'body' })
        .ball([0.05, 0.048, 0.05], [0, 0.185, 0.008], { color: c, name: 'head', parent: 'body', pivot: [0, 0.165, 0] })
        .ball([0.026, 0.02, 0.028], [0, 0.178, 0.036], { color: '#6a5040', parent: 'head' })
        .ball([0.012, 0.008, 0.006], [0, 0.183, 0.05], { color: '#1a1412', parent: 'head', noInk: true })
        .pair((s) => {
          const w = s > 0 ? 'wingL' : 'wingR', sh: Vec3 = [s * 0.022, 0.15, 0], el: Vec3 = [s * 0.08, 0.17, -0.004], wr: Vec3 = [s * 0.13, 0.15, -0.006];
          const tips: Vec3[] = [[s * 0.25, 0.17, -0.008], [s * 0.24, 0.09, -0.008], [s * 0.17, 0.035, -0.006], [s * 0.035, 0.07, -0.004]];
          f.cone([0.03, 0.05, 0.012], [s * 0.017, 0.222, 0.0], { color: c, rot: [0, 0, -s * 14], parent: 'head' })
            .ball([0.011, 0.012, 0.006], [s * 0.014, 0.193, 0.03], { color: '#1d1a17', eye: true, parent: 'head', noInk: true })
            .rod(sh, el, 0.008, bone, { name: w, parent: 'body', pivot: sh }).rod(el, wr, 0.006, bone, { parent: w })
            .rod(wr, tips[0], 0.004, bone, { parent: w }).rod(wr, tips[1], 0.004, bone, { parent: w }).rod(wr, tips[2], 0.004, bone, { parent: w });
          const panel = (a: Vec3, b: Vec3, cc: Vec3) => {
            const xs = [a[0], b[0], cc[0]], ys = [a[1], b[1], cc[1]];
            const ctr = mul(add3(add3(a, b), cc), 1 / 3);
            f.ball([(Math.max(...xs) - Math.min(...xs)) * 0.62, (Math.max(...ys) - Math.min(...ys)) * 0.62, 0.003], ctr, { color: wc, parent: w });
          };
          panel(sh, tips[0], tips[1]);
          panel(wr, tips[1], tips[2]);
          panel(sh, tips[2], tips[3]);
          f.rod([s * 0.014, 0.085, 0], [s * 0.02, 0.05, 0.004], 0.007, c).ball([0.01, 0.006, 0.014], [s * 0.02, 0.046, 0.008], { color: bone });
        });
      return f.done();
    })(),
      [A.par(A.anim('flap', 3), A.anim('hop', 2), say('Squeak!', 1.4))],
      [A.par(ps('wingL', [0, 0, -55], 0.4), ps('wingR', [0, 0, 55], 0.4), say('Eek!', 1.2)), A.wait(1.2), rest('wingL', 'wingR')]),
  ),
  e('beagle', 'pets', 'dog breeds', () =>
    act(QK('beagle', { c: WH, H: 0.38, L: 0.44, D: 0.18, W: 0.17, tuck: 0.3, neck: { l: 0.11, w: 0.1, lean: 35 }, head: { l: 0.13, w: 0.105, h: 0.1, c: '#c8843e' }, muz: { l: 0.08, w: 0.065, h: 0.065, c: WH, drop: 0.15 }, ear: { k: 'drop', s: 0.13, c: '#a86a30' }, leg: { w: 0.04 }, tail: { k: 'long', l: 0.2, w: 0.03, a: 25, tip: WH } }, back(BK, 0.15, 0.75), patch('#c8843e', 0.02, 0.15), blazeQ(WH)),
      howl('Aroo-roo-roo!', 30),
      sniff('Sniff sniff sniff!')),
  ),
  e('bear', 'wild', 'forest', () =>
    actF(QK('bear', QBEAR), (f) => [rearUp(f, 'ROAR!'), sniff('Sniff... honey?')]),
  ),
  e('beaver', 'wild', 'rivers', () =>
    act(QK('beaver', QBEAVER, teethQ('#e8902a')), tailSlap('SLAP!'), gnaw('stick', 'Chomp chomp!')),
  ),
  e('beaver pup', 'wild', 'rivers', () =>
    act(QK('beaver pup', grow(QBEAVER, 0.45, 1.3, 0.9), teethQ('#e8a050', 0.8)), [A.par(A.anim('hop'), say('Mew!', 1.2))], tailSlap('Pat!')),
  ),
  // Real size (8 mm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('bed bug', 'bugs', 'pests', () =>
    act(bug('bed bug', { length: 0.008, color: '#8a3a20', wings: 'none', extras: bx(partC('abdomen', '#8a3a20', [1.5, 0.55, 1.15]), partC('body', '#7a3018', [1.1, 0.7, 1])) }), scurry('!'), feel('...')),
  ),
  // Real size (1.5 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('bee', 'bugs', 'bees and wasps', () =>
    act(bug('bee', { length: 0.015, color: '#e8b82a', stripes: '#2a2420', wings: 'clear' }), buzz('Bzzz!'), [A.par(A.anim('wobble', 2), say('Bzz bzz bzz!', 1.6))]),
  ),
  // Real size (3.5 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('beetle', 'bugs', 'beetles', () =>
    act(bug('beetle', { length: 0.035, color: '#1e2a24', wings: 'none', extras: bx(elytra('#2a7a4a'), feelers(0.8)) }), [A.par(ps('caseL', [0, 0, 45], 0.3), ps('caseR', [0, 0, -45], 0.3)), A.par(A.anim('hop', 2), say('Bzzz!', 1.2)), rest('caseL', 'caseR')], feel('!')),
  ),
  // Real size wins over the vocabulary's 5 m height: that is its length; a 4.5 m beluga is about 1 m deep.
  e('beluga whale', 'sea', 'whales', () =>
    act(FK('beluga whale', { L: 4.5, c: '#eef2f4', fin: '#e2e8ec', h: 0.2, w: 0.2, shape: 'whale', tail: 'flukes', tl: 0.2, dorsal: 0, pec: 1.1, pz: 0.74, eye: 0.3, ez: 0.86 }, (f, d) => {
      const [w, h, cy] = d.sec(0.92);
      f.ball([w * 1.9, h * 1.7, d.Lb * 0.16], [0, cy + h * 0.25, d.z(0.93)], { color: '#f4f6f8', parent: 'body' })
        .ball([d.W * 0.1, d.W * 0.04, d.W * 0.06], [0, cy + h * 1.0, d.z(0.8)], { color: '#9aa4aa', parent: 'body', noInk: true });
      for (let i = 0; i < 5; i++) f.ball([d.W * 0.08, d.H * 0.04, d.Lb * 0.03], [0, d.sec(0.5 - i * 0.07)[2] + d.sec(0.5 - i * 0.07)[1] * 0.97, d.z(0.5 - i * 0.07)], { color: '#dfe6ea', parent: 'body', noInk: true });
    }),
      [A.par(A.effect('water_spray', { dur: 1.5 }), say('Pfoosh!', 1.4))],
      [A.par(ps('jaw', [20, 0, 0], 0.2), say('Eee-eee-squee!', 2)), A.anim('bounce'), ps('jaw', [0, 0, 0], 0.2)]),
  ),
  e('bird', 'aviary', 'songbirds', () =>
    act(AVK('bird', { H: 0.2, c: '#7a6250', belly: '#ece4d8', wing: '#6a5442', tip: '#4a3a2e', tail: '#5e4a3a', beak: '#3a3028', legs: '#8a6a50', bl: 0.09, leg: 0.22, tl: 0.3, tk: 'fan' }, avPatch('#e8743a', [0.86, 0.6, 0.4], [0, -0.05, 0.3]), avHead('#e8743a', [1.0, 0.7, 0.8], [0, -0.42, 0.42])), sing('Tweet tweet!'), peck('Peck peck.')),
  ),
  e('black bear', 'wild', 'forest', () =>
    actF(QK('black bear', { ...QBEAR, c: '#26221f', H: 0.95, L: 1.4, D: 0.6, W: 0.6, hump: 0.02, rump: 0.98, neck: { l: 0.22, w: 0.34, lean: 64 }, head: { l: 0.3, w: 0.28, h: 0.25 }, muz: { l: 0.17, w: 0.13, h: 0.12, c: '#b08a60', drop: 0.15 }, ear: { k: 'round', s: 0.11, in: '#3a3430' }, leg: { w: 0.15, k: 1.2, paw: '#1a1816' } }), (f) => [rearUp(f, 'Grrr!', 55), sniff('Sniff... berries?')]),
  ),
  // Real size wins over the vocabulary's 3.5 m height: that is its length; the 2.8 m mamba lies coiled with its head raised 0.6 m.
  e('black mamba', 'wild', 'reptiles', () =>
    act(snk('black mamba', { length: 2.8, color: '#6a6a5e', girth: 0.035 }, { c: '#a8a890', k: 'belly', n: 3 }, { k: 1.4, flat: 0.9, c: '#5e5e54' }), [A.par(A.pose('tongue', { scale: 2.2, dur: 0.15 }), ps('seg7', [-20, 0, 0], 0.3), ps('head', [-25, 0, 0], 0.3), say('HSSS!', 1.6)), A.wait(1.1), A.par(A.pose('tongue', { scale: 1, dur: 0.2 }), rest('head', 'seg7'))], strike('Hss!')),
  ),
  // Real size (3.5 cm across long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('black widow', 'bugs', 'spiders', () =>
    act(bug('black widow', {
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
        p.add(P('body', 'capsule', [0.004 * L, 2.2 * L, 0.004 * L], [0, 1.15 * L, -0.05 * L], '#e8e8ea', { name: 'silk', scale: 0, layer: 1 }));
      },
    }),
      [A.par(A.pose('body', { move: [0, 0.05, 0], dur: 1.2 }), A.pose('silk', { scale: 1, dur: 0.3 }), say('...', 1.4)), A.wait(1), A.par(A.pose('body', { move: [0, 0, 0], dur: 0.8 }), A.pose('silk', { scale: 0, dur: 0.8 }))],
      scurry('!')),
  ),
  e('blackbird', 'aviary', 'songbirds', () =>
    act(AVK('blackbird', { H: 0.25, c: '#1f1f24', wing: '#26262e', tail: '#1a1a1e', beak: '#f2a020', legs: '#3a3430', bl: 0.1, leg: 0.24, tl: 0.38, tk: 'long', eye: '#2a2018' }, avHead('#f2a020', [0.55, 0.55, 0.3], [0.62, 0.18, 0.4], { mirror: true })), sing('Tweedle-ee-dee!'), peck('Tchook!')),
  ),
  e('bloodhound', 'pets', 'dog breeds', () =>
    act(QK('bloodhound', { c: '#a8642e', H: 0.65, L: 0.78, D: 0.33, W: 0.29, tuck: 0.25, neck: { l: 0.2, w: 0.18, lean: 42 }, head: { l: 0.25, w: 0.15, h: 0.17 }, muz: { l: 0.16, w: 0.12, h: 0.14, c: '#8a4a22', drop: 0.2 }, eye: { k: 0.75, c: '#4a2a14' }, ear: { k: 'drop', s: 0.3, c: '#7a4020' }, leg: { w: 0.07 }, tail: { k: 'long', l: 0.42, w: 0.05, a: 40 } }, back('#3a2214', 0.12, 0.78), onHead('#8a4a22', [0.95, 0.5, 0.5], [0, 0.05, 0.1]), onHead('#a8642e', [0.7, 0.55, 0.6], [0, -0.6, 0.3])),
      sniff('Sniff sniff sniff...'),
      howl('Aroooooo!', 30)),
  ),
  e('blowfish', 'sea', 'reef fish', () =>
    act(FK('blowfish', { L: 0.3, c: '#e8cf8a', belly: '#f6f0dc', fin: '#d8b870', h: 0.62, w: 0.55, shape: 'round', tail: 'fan', tl: 0.2, dorsal: 0.25, dz: 0.3, dl: 0.12, anal: 0.22, pec: 0.7, pz: 0.66, eye: 1.0, ez: 0.82, mouth: '#e8a080' }, (f, d) => {
      let r = 5;
      const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 46; i++) {
        const t = 0.15 + 0.75 * rnd(), th = (-80 + 170 * rnd()) * (Math.PI / 180), s2 = i % 2 ? 1 : -1, [w, h, cy] = d.sec(t), nx = s2 * Math.cos(th), ny = Math.sin(th);
        f.cone([d.o.L * 0.03, d.o.L * 0.08, d.o.L * 0.03], [nx * w, cy + ny * h, d.z(t)], { color: '#f2e2b0', rot: aim([nx, ny, (t - 0.5) * 0.8]), parent: 'body' });
        if (i % 3 === 0) f.ball(d.o.L * 0.045, [nx * w * 0.98, cy + ny * h * 0.98, d.z(t)], { color: '#8a6a3a', parent: 'body', noInk: true });
      }
    }),
      [A.set({ scale: 1.6, dur: 0.4 }), say('PUFF!', 1.4), A.wait(1.5), A.set({ scale: 1, dur: 0.8 })],
      swimSpin('Blub.')),
  ),
  e('blue jay', 'aviary', 'songbirds', () =>
    act(AVK('blue jay', { H: 0.26, c: '#4a7fd0', belly: '#eef0f4', wing: '#2f62c0', tip: '#1e3e8a', tail: '#3a70d0', beak: '#2a2a2a', legs: '#3a3a3a', bl: 0.1, leg: 0.22, tl: 0.42, tk: 'long' }, avCrest('#4a7fd0', 1.2), avHead('#1e1e24', [0.25, 1.6, 1.6], [0, -0.5, 0.2]), avHead('#eef0f4', [1.3, 0.9, 1.2], [0, -0.45, 0.45])), sing('Jay! Jay!'), [A.spawn('nut', 'acorn', { rel: 'front', of: 'self', dist: 'close' }), ...peck('Peck!', 2), A.remove('nut', 'fade')]),
  ),
  e('blue whale', 'sea', 'whales', () =>
    act(FK('blue whale', { L: 25, c: '#5a7aa0', belly: '#8aa4c0', fin: '#4e6c90', h: 0.13, w: 0.14, shape: 'whale', tail: 'flukes', tl: 0.18, dorsal: 0.25, dz: 0.24, dl: 0.04, pec: 0.8, pz: 0.76, eye: 0.15, ez: 0.86 }, fSpots('#7a98ba', 30, 0.5, { t0: 0.2, t1: 0.8, lo: -10, hi: 80 }), grooves('#9ab0c8', 9), (f, d) => {
      const [, h, cy] = d.sec(0.82);
      f.ball([d.W * 0.18, d.W * 0.06, d.W * 0.16], [0, cy + h * 0.98, d.z(0.82)], { color: '#3a5070', parent: 'body', noInk: true });
    }),
      [A.par(A.effect('water_spray', { dur: 2 }), say('PFOOOSH!', 1.8))],
      [A.par(say('Mmmmooooo...', 2.5), ...swish('', 15).slice(0, 3)), rest('tail')]),
  ),
  // Real size wins over the vocabulary's 3 m height: that is its length; the 3 m boa lies coiled, head raised about half a metre.
  e('boa', 'wild', 'reptiles', () =>
    act(snk('boa', { length: 3, color: '#c8aa80', girth: 0.06 }, { c: '#6a3a24', k: 'saddle', n: 2 }, { k: 1.1, rise: 0.5 }), hiss('Hsss...'), [A.par(ps('seg2', [0, 0, 24], 1.2), ps('seg3', [0, 0, -28], 1.2), ps('seg4', [0, 0, 28], 1.2), say('Squeeeze...', 2)), A.wait(1), rest('seg2', 'seg3', 'seg4')]),
  ),
  e('boar', 'wild', 'forest', () =>
    act(QK('boar', { c: '#4e3e30', H: 0.85, L: 1.15, D: 0.55, W: 0.42, tuck: 0.05, rump: 0.86, hump: 0.08, neck: { l: 0.18, w: 0.4, lean: 72 }, head: { l: 0.36, w: 0.26, h: 0.28 }, muz: { l: 0.28, w: 0.13, h: 0.13, drop: 0.32 }, nose: '#3a2a24', eye: { k: 0.7 }, ear: { k: 'prick', s: 0.13 }, leg: { w: 0.08, hoof: '#1e1a18', c: '#3a2e24' }, tail: { k: 'tuft', l: 0.25, w: 0.025, a: 160, tip: '#2a2018' } }, maneQ('#2a2018', 0.9), studs('#2e241c', [[90, 9, 0.06, 'cone']], 0.4, 0.95), (f, d) => {
      const { l: ml, h: mh } = d.q.muz;
      f.cyl([mh * 0.95, ml * 0.08, mh * 0.95], [0, d.mz[1], d.mz[2] + ml * 0.48], { color: '#6a5446', rot: [90, 0, 0], parent: 'head' });
      f.pair((s) => f.cone([mh * 0.16, mh * 0.75, mh * 0.16], [s * d.q.muz.w * 0.55, d.mz[1] + mh * 0.2, d.mz[2] + ml * 0.1], { color: '#fffaf0', rot: [-30, 0, s * 25], parent: 'head' }));
    }),
      [A.par(ps('neck', [40, 0, 0], 0.4), ps('head', [20, 0, 0], 0.4), A.effect('dust', { dur: 1.4 }), say('Snort! Oink!', 1.6)), ps('neck', [30, 0, 0], 0.2), ps('neck', [40, 0, 0], 0.2), rest('neck', 'head')],
      [A.par(A.anim('shake'), say('Grunt!', 1.2)), A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'run' })]),
  ),
  e('bobcat', 'wild', 'forest', () =>
    act(QK('bobcat', { c: '#b88a58', H: 0.5, L: 0.62, D: 0.24, W: 0.22, tuck: 0.4, rump: 1.04, belly: '#f2e6d4', neck: { l: 0.11, w: 0.12, lean: 42 }, head: { l: 0.13, w: 0.14, h: 0.12 }, muz: { l: 0.05, w: 0.075, h: 0.05, c: '#f2e6d4', drop: 0.22 }, nose: '#c87a6a', eye: { k: 1.2, c: '#a8a030' }, ear: { k: 'prick', s: 0.06, in: '#f2e6d4' }, leg: { w: 0.05 }, tail: { k: 'stub', l: 0.14, w: 0.05, a: 60, tip: BK } }, spotsQ('#5a3a24', 22, 0.04), ruffQ('#d8b890', 0.7), (f, d) => f.pair((s) => f.cyl([0.012, 0.035, 0.008], add3(d.sk, [s * d.q.head.w * 0.38, d.q.head.h * 0.86, -d.q.head.l * 0.14]), { color: BK, taper: 0, rot: [0, 0, -s * 14], parent: 'earL'.replace('L', s > 0 ? 'L' : 'R') }))),
      [A.par(ps('jaw', [32, 0, 0], 0.15), ps('earL', [0, 0, 30], 0.2), ps('earR', [0, 0, -30], 0.2), say('Hsss! Rrrow!', 1.6)), A.wait(0.8), rest('jaw', 'earL', 'earR')],
      [A.par(A.anim('hop'), say('Mrrow!', 1.2)), A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'run' })]),
  ),
  e('border collie', 'pets', 'dog breeds', () =>
    act(QK('border collie', { c: '#24211f', H: 0.53, L: 0.56, D: 0.24, W: 0.2, tuck: 0.4, neck: { l: 0.15, w: 0.12, lean: 38 }, head: { l: 0.15, w: 0.13, h: 0.12 }, muz: { l: 0.1, w: 0.065, h: 0.065, c: WH, drop: 0.15 }, eye: { c: '#5a3a1a' }, ear: { k: 'fold', s: 0.08 }, leg: { w: 0.045 }, tail: { k: 'bushy', l: 0.34, w: 0.07, a: 150, tip: WH } }, chest(WH), blazeQ(WH), socksQ(WH, 0.35), ruffQ(WH, 0.85)),
      [A.par(A.pose('body', { move: [0, -0.08, 0], dur: 0.5 }), ps('neck', [30, 0, 0], 0.5), ps('legFL', [-15, 0, 0], 0.5), ps('legFR', [-15, 0, 0], 0.5)), A.wait(1), A.par(A.pose('body', { move: [0, 0, 0], dur: 0.3 }), rest('neck', 'legFL', 'legFR')), A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'run' }), ...bark('Woof!')],
      wagHard('Arf!')),
  ),
  e('boston terrier', 'pets', 'dog breeds', () =>
    act(QK('boston terrier', { c: '#24211f', H: 0.4, L: 0.38, D: 0.2, W: 0.2, tuck: 0.3, neck: { l: 0.09, w: 0.12, lean: 30 }, head: { l: 0.13, w: 0.15, h: 0.14 }, muz: { l: 0.04, w: 0.08, h: 0.06, c: WH, drop: 0.28 }, eye: { k: 1.4 }, ear: { k: 'prick', s: 0.09 }, leg: { w: 0.04 }, tail: { k: 'stub', l: 0.05, w: 0.04, a: 120 } }, chest(WH), blazeQ(WH, 1.3), socksQ(WH, 0.25, 'FL,FR')),
      [A.par(A.anim('spin'), say('Snort! Arf!', 1.4))],
      bark('Arf arf!')),
  ),
  // A sauropod 22 m from nose to tail: hips 4.5 m up on pillar legs (a person comes to its knee), the neck raised
  // 7 m to a tiny head, the tail held out level behind.
  e('brontosaurus', 'wild', 'dinosaurs', () =>
    act(QK('brontosaurus', { c: '#7a8a6a', H: 4.2, L: 7.2, D: 2.3, W: 2.3, tuck: 0.05, rump: 1.08, belly: '#c8d0a8', neck: { l: 7.0, w: 0.55, lean: 44, base: 1.7 }, head: { l: 0.8, w: 0.45, h: 0.45 }, muz: { l: 0.35, w: 0.32, h: 0.25, drop: 0.15 }, eye: { k: 0.8 }, ear: { k: 'tiny', s: 0.04 }, leg: { w: 0.8, k: 1.25, hoof: '#5a6a4a', hock: 0.7 }, tail: { k: 'taper', l: 11, w: 1.5, a: 98 } }, spotsQ('#5e6e50', 18, 0.5, { lo: 20, hi: 85 }), limbsQ(1.3)),
      [A.par(ps('neck', [-14, 0, 0], 1), ps('head', [10, 0, 0], 1)), ps('jaw', [20, 0, 0], 0.3), ps('jaw', [0, 0, 0], 0.3), A.par(ps('jaw', [20, 0, 0], 0.3), say('Mmmrrrm...', 1.8)), ps('jaw', [0, 0, 0], 0.3), rest('neck', 'head')],
      [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), say('BOOM!', 1.4))]),
  ),
  e('buffalo', 'wild', 'prairie', () =>
    act(QK('buffalo', QBISON, ...bisonMarks), graze('Grunt.'), [...dig('Snort!'), A.anim('shake')]),
  ),
  e('buffalo calf', 'wild', 'prairie', () =>
    act(QK('buffalo calf', { ...grow(QBISON, 0.42, 1.25, 1.25), c: '#b0662e', hump: 0.02, muz: { l: 0.07, w: 0.12, h: 0.11, c: '#6a3a1e', drop: 0.2 } }), [A.par(A.anim('hop'), say('Mwah!', 1.2))], graze('Mmm.')),
  ),
  e('bull', 'farm', 'cattle', () =>
    act(QK('bull', { c: '#3e2c22', H: 1.5, L: 2.0, D: 0.85, W: 0.8, tuck: 0, rump: 0.96, hump: 0.08, belly: '#4a3428', neck: { l: 0.26, w: 0.62, lean: 70 }, head: { l: 0.5, w: 0.4, h: 0.38 }, muz: { l: 0.2, w: 0.3, h: 0.24, c: '#5a4038', drop: 0.28 }, nose: '#2a1e1a', eye: { k: 0.8 }, ear: { k: 'side', s: 0.2, in: '#6a4a3a' }, leg: { w: 0.14, hoof: '#1e1814' }, tail: { k: 'tuft', l: 0.8, w: 0.035, a: 168, tip: '#1e1814' } }, hornsQ('#efe6d0', 0.4, 'hook', 0.22), (f, d) => f.torus([d.q.muz.w * 0.5, d.q.muz.w * 0.5, d.q.muz.w * 0.08], [0, d.mz[1] - d.q.muz.h * 0.42, d.mz[2] + d.q.muz.l * 0.5], { color: '#e8c040', tube: 0.25, parent: 'head', edge: 'sharp' })),
      [...dig('Snort! Snort!'), A.anim('shake')],
      speak('MOOO!', 26, 1.8)),
  ),
  e('bull terrier', 'pets', 'dog breeds', () =>
    act(QK('bull terrier', { c: '#f4f0ea', H: 0.53, L: 0.55, D: 0.28, W: 0.26, tuck: 0.25, neck: { l: 0.14, w: 0.16, lean: 40 }, head: { l: 0.26, w: 0.15, h: 0.15 }, muz: { l: 0.09, w: 0.1, h: 0.11, drop: 0.05 }, eye: { k: 0.6, c: '#2a1a10' }, ear: { k: 'prick', s: 0.08, in: '#f0c0c0' }, leg: { w: 0.06, k: 1.1 }, tail: { k: 'long', l: 0.24, w: 0.04, a: 125 } }, onHead('#3a2a20', [0.3, 0.38, 0.32], [0.3, 0.16, 0.26])),
      [A.par(A.anim('spin', 2), say('Arf! Arf!', 1.6))],
      bark('Woof!')),
  ),
  e('bulldog', 'pets', 'dog breeds', () =>
    actF(QK('bulldog', { c: '#c8a078', H: 0.38, L: 0.46, D: 0.27, W: 0.36, tuck: 0.12, rump: 0.9, belly: WH, neck: { l: 0.06, w: 0.22, lean: 40 }, head: { l: 0.18, w: 0.24, h: 0.2 }, muz: { l: 0.06, w: 0.16, h: 0.12, c: WH, drop: 0.24, jaw: '#d8c4a8' }, eye: { k: 0.8 }, ear: { k: 'fold', s: 0.06 }, leg: { w: 0.075, k: 1.2 }, tail: { k: 'stub', l: 0.05, w: 0.05, a: 130 } }, chest(WH), blazeQ(WH, 1.2), onHead('#c8a078', [0.4, 0.4, 0.35], [0.36, -0.28, 0.42], { mirror: true })), (f) => [speak('Snrrrk... snort!', 18, 1.8), sitQ(f, 'Woof.')]),
  ),
  e('bunny', 'pets', 'small pets', () =>
    act(bun('bunny', { c: '#f6f2ea', H: 0.2, ear: 0.11, belly: '#ffffff', eye: '#c84a5a' }), [A.par(A.anim('hop', 2), say('!', 1))], gnaw('carrot', 'Munch munch!')),
  ),
  e('butterfly', 'bugs', 'butterflies', () =>
    act(bug('butterfly', {
      length: 0.045,
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
      [ps('wingL', [0, 0, 55], 0.25), ps('wingR', [0, 0, -55], 0.25), A.par(rest('wingL', 'wingR'), A.anim('hop', 2), say('!', 1))],
      [A.par(A.anim('hop', 3), A.anim('spin'), say('~', 1.2))]),
  ),
  e('calf', 'farm', 'cattle', () =>
    act(QK('calf', { c: '#f4f2ee', H: 0.82, L: 0.85, D: 0.36, W: 0.3, tuck: 0.25, neck: { l: 0.22, w: 0.18, lean: 50 }, head: { l: 0.28, w: 0.2, h: 0.2 }, muz: { l: 0.11, w: 0.15, h: 0.13, c: '#f0b8b0', drop: 0.22 }, nose: '#d88a8a', eye: { k: 1.2 }, ear: { k: 'side', s: 0.13, in: '#f0b8b0' }, leg: { w: 0.06, hoof: '#3a3430' }, tail: { k: 'tuft', l: 0.45, w: 0.025, a: 165, tip: '#2a2624' } }, spotsQ('#2a2624', 9, 0.2, { seed: 11, flat: 0.25 }), onHead('#2a2624', [0.5, 0.55, 0.6], [0.22, 0.3, -0.05]), socksQ(WH, 0.25)),
      [A.par(A.anim('hop'), say('Mmmaa!', 1.4))],
      graze('Moo.')),
  ),
  e('calico', 'pets', 'cats', () =>
    act(QK('calico', { c: '#f6f2ea', H: 0.25, L: 0.36, D: 0.12, W: 0.12, tuck: 0.45, neck: { l: 0.07, w: 0.07, lean: 42 }, head: { l: 0.085, w: 0.095, h: 0.08 }, muz: { l: 0.035, w: 0.05, h: 0.035, drop: 0.24 }, nose: '#e89a9a', eye: { k: 1.3, c: '#5a7a2a' }, ear: { k: 'prick', s: 0.05, in: '#f2b4bc' }, leg: { w: 0.027 }, tail: { k: 'long', l: 0.3, w: 0.024, a: 35, c: '#e0883a' } }, patch('#e0883a', 0.05, 0.35), back(BK, 0.4, 0.75), onHead('#e0883a', [0.55, 0.6, 0.7], [0.26, 0.3, -0.05]), onHead(BK, [0.5, 0.55, 0.6], [-0.26, 0.32, -0.05])), meow('Meow!'), stretch(), washPaw()),
  ),
  // A dromedary, 1.85 m at the shoulder: one rounded hump rising to about 2.2 m mid-back, long slim legs with
  // knobbly knees, a long neck dipping forward to a head held high, a droopy lip that spits.
  e('camel', 'wild', 'desert', () =>
    act(QK('camel', { c: '#c8a068', H: 1.85, L: 1.6, D: 0.75, W: 0.62, tuck: 0.35, rump: 0.9, neck: { l: 0.85, w: 0.26, lean: 50, base: 0.48 }, head: { l: 0.42, w: 0.24, h: 0.24 }, muz: { l: 0.24, w: 0.17, h: 0.18, drop: 0.15 }, eye: { k: 0.9 }, ear: { k: 'tiny', s: 0.06 }, leg: { w: 0.1, paw: '#a8885a', hock: 1.1 }, tail: { k: 'tuft', l: 0.5, w: 0.04, a: 168, tip: '#8a6a40' } }, limbsQ(1.7), (f, d) => {
      const [, h, cy] = d.sec(0.5), top = cy + h - 0.06 + 0.29;
      f.ball([d.q.W * 0.72, 0.58, d.q.L * 0.44], [0, cy + h - 0.06, d.z(0.5)], { color: '#c39565', parent: 'body' });
      f.ball([d.q.muz.w * 1.1, d.q.muz.h * 0.5, d.q.muz.l * 0.6], add3(d.mz, [0, -d.q.muz.h * 0.25, d.q.muz.l * 0.25]), { color: '#b8905a', parent: 'jaw' });
      f.socket('seat', [0, top + 0.02, d.z(0.5)], 'seat', { part: 'body', size: 0.6 });
    }),
      [ps('jaw', [8, 0, 0], 0.25), ps('jaw', [0, 0, 0], 0.25), A.par(ps('jaw', [8, 0, 0], 0.25), say('Grrumble...', 1.6)), ps('jaw', [0, 0, 0], 0.25)],
      [A.par(ps('neck', [-15, 0, 0], 0.3), ps('head', [-15, 0, 0], 0.3)), A.par(ps('jaw', [25, 0, 0], 0.15), A.effect('water_spray', { dur: 0.8 }), say('Ptooey!', 1.4)), A.wait(0.6), rest('neck', 'head', 'jaw')]),
  ),
  e('canary', 'aviary', 'songbirds', () =>
    act(AVK('canary', { H: 0.13, c: '#f7d84a', wing: '#e8c030', tip: '#c8a020', tail: '#e8c030', beak: '#f2c4a0', legs: '#e8a8a0', bl: 0.08, leg: 0.22, tl: 0.32, tk: 'fork' }), sing('Tweet-tweet-tweeee!'), flyUp('Cheep!')),
  ),
  e('cardinal (bird)', 'aviary', 'songbirds', () =>
    act(AVK('cardinal (bird)', { H: 0.22, c: '#d42a2a', wing: '#b01e1e', tip: '#8a1818', tail: '#a01c1c', beak: '#f08a30', legs: '#a86a5a', bl: 0.11, bw: 1.4, leg: 0.22, tl: 0.4, tk: 'long' }, avCrest('#d42a2a', 1.5), avHead('#1e1a1a', [1.0, 0.8, 0.6], [0, -0.1, 0.7])), sing('Cheer-cheer-cheer!'), peck('Chip!')),
  ),
  // Real size (5 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('caterpillar', 'bugs', 'crawlers', () =>
    act(caterpillar('caterpillar', 0.05, '#7ac943', '#9ad85a', '#d8402a'), [ps('head', [30, 0, 0], 0.2), ps('head', [0, 0, 0], 0.2), A.par(ps('head', [30, 0, 0], 0.2), say('Munch munch.', 1.4)), ps('head', [0, 0, 0], 0.2)], [A.par(A.pose('body', { move: [0, 0, 0.012], dur: 1.4 }), say('Wriggle...', 1.4)), A.pose('body', { move: [0, 0, 0], dur: 1.2 })]),
  ),
  // Real size wins over the vocabulary's 1 m height: that is its length; a 1 m catfish is a quarter metre tall.
  e('catfish', 'sea', 'freshwater fish', () =>
    act(FK('catfish', { L: 1.0, c: '#6a6a58', belly: '#e8e0c8', fin: '#5a5a48', h: 0.15, w: 0.17, shape: 'eel', tail: 'round', tl: 0.14, dorsal: 0.45, dz: 0.68, dl: 0.07, anal: 0.35, pec: 1.1, eye: 0.7, ez: 0.9, mouth: '#e8e0c8' }, fSpots('#4a4a3a', 18, 0.04), (f, d) => {
      const [w, h, cy] = d.sec(0.97), L = d.o.L;
      f.pair((s) => {
        f.rod([s * w * 0.6, cy + h * 0.2, d.z(0.99)], [s * w * 2.6, cy - h * 0.6, d.z(0.88)], L * 0.008, '#3a3a30', { parent: 'body' })
          .rod([s * w * 0.4, cy - h * 0.5, d.z(0.98)], [s * w * 1.6, cy - h * 1.6, d.z(0.93)], L * 0.006, '#3a3a30', { parent: 'jaw' });
      });
    }), gulp('Gulp.', 30), swish('Swish!')),
  ),
  // Real size (2.5 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('centipede', 'bugs', 'crawlers', () =>
    act((() => {
      const c = '#a0462a', lc = '#d8843a', n = 14, d = 0.011;
      const f = m('centipede', { view: 'side', rig: 'bug' });
      f.ball([0.016, 0.009, 0.014], [0, 0.007, 0.075], { color: '#7a3018', name: 'body' });
      f.each(n, (i) => {
        const z = 0.065 - i * d, x = 0.004 * Math.sin(i * 0.9);
        f.ball([0.016, 0.008, 0.013], [x, 0.007, z], { color: i % 2 ? c : '#8a3a22', parent: 'body' }).pair((s) => f.rod([x + s * 0.006, 0.006, z], [x + s * 0.018, 0.001, z + 0.003], 0.0025, lc, { parent: 'body' }));
      });
      f.pair((s) => f.rod([s * 0.004, 0.009, 0.08], [s * 0.016, 0.016, 0.11], 0.002, lc, { name: s > 0 ? 'antennaL' : 'antennaR', parent: 'body', pivot: [s * 0.004, 0.009, 0.08] }).ball(0.004, [s * 0.005, 0.011, 0.082], { color: '#1d1a17', eye: true, parent: 'body' }).rod([s * 0.004, 0.005, 0.082], [s * 0.008, 0.002, 0.09], 0.003, '#5a2010', { parent: 'body' }));
      f.pair((s) => f.rod([s * 0.003, 0.007, 0.065 - n * d], [s * 0.012, 0.01, 0.065 - n * d - 0.02], 0.002, lc, { parent: 'body' }));
      return f.done();
    })(), scurry('!'), feel('!')),
  ),
  e('chameleon', 'wild', 'reptiles', () =>
    act(chameleon('chameleon', '#5fb04a', '#e8803a'),
      [A.spawn('bug', 'fly', { rel: 'front', of: 'self', dist: 'close' }), A.pose('eyeL', { rot: [0, 30, 0], dur: 0.3 }), A.wait(0.4), A.par(A.pose('tongue', { scale: 1, dur: 0.1 }), ps('jaw', [30, 0, 0], 0.1)), A.par(A.remove('bug', 'pop'), say('Thwip!', 1.2)), A.par(A.pose('tongue', { scale: 0, dur: 0.15 }), ps('jaw', [0, 0, 0], 0.15), rest('eyeL'))],
      [A.par(A.pose('mood', { scale: 1, dur: 1 }), say('!', 1.2)), A.wait(1.5), A.pose('mood', { scale: 0, dur: 1 })]),
  ),
  e('cheetah', 'wild', 'savanna', () =>
    act(QK('cheetah', QCHEETAH, ...cheetahMarks), [A.par(A.move('self', { rel: 'random' }, { speed: 'run' }), say('!', 1)), A.par(ps('jaw', [20, 0, 0], 0.15), say('Chirp!', 1.2)), ps('jaw', [0, 0, 0], 0.15)], [A.par(ps('jaw', [20, 0, 0], 0.15), ps('head', [-10, 20, 0], 0.3), say('Chirp! Chirp!', 1.4)), A.wait(0.6), rest('jaw', 'head')], stretch('Purr...')),
  ),
  e('cheetah cub', 'wild', 'savanna', () =>
    act(QK('cheetah cub', { ...grow(QCHEETAH, 0.38, 1.4, 0.95), tail: { k: 'long', l: 0.22, w: 0.03, a: 120 } }, spotsQ('#3a3028', 12, 0.025), back('#dcdcd2', 0.05, 0.95, 1.12)), [A.par(A.anim('hop'), say('Chirp chirp!', 1.4))], meow('Mew!')),
  ),
  e('chick (bird)', 'farm', 'poultry', () =>
    act(AVK('chick (bird)', { H: 0.1, c: '#f8dc4a', wing: '#f0c830', tail: '#f0c830', beak: '#f08a20', legs: '#f08a20', len: 0.55, fat: 0.85, up: 20, hk: 1.5, bl: 0.07, leg: 0.2, lw: 1.2, tl: 0.08, tk: 'stub', wl: 0.5 }), peck('Cheep cheep!'), [A.par(A.anim('hop', 2), say('Peep!', 1.2))]),
  ),
  e('chicken (bird)', 'farm', 'poultry', () =>
    act(AVK('chicken (bird)', { H: 0.45, c: '#b8662e', belly: '#c8783a', wing: '#9a5226', tip: '#3a2a20', tail: '#2a2420', beak: '#f2c050', legs: '#f2c050', len: 0.62, fat: 0.75, up: 18, bl: 0.07, bw: 1.2, leg: 0.24, lw: 1.3, tl: 0.32, tk: 'fan', wl: 0.7 }, (f, d) => {
      for (let i = 0; i < 4; i++) f.ball([d.hr * 0.28, d.hr * (0.55 - Math.abs(i - 1.5) * 0.12), d.hr * 0.4], add3(d.hc, [0, d.hr * (1.05 - Math.abs(i - 1.5) * 0.08), d.hr * (0.55 - i * 0.32)]), { color: '#e02a2a', parent: 'head' });
      f.pair((s) => f.ball([d.hr * 0.25, d.hr * 0.55, d.hr * 0.3], add3(d.hc, [s * d.hr * 0.18, -d.hr * 0.75, d.hr * 0.75]), { color: '#e02a2a', parent: 'head' }));
    }),
      peck('Cluck cluck!'),
      [A.par(A.anim('wobble'), say('Bawk bawk BAWK!', 1.6)), A.spawn('egg', 'egg', { rel: 'near', of: 'self', dist: 'close' }), A.wait(1.5), A.remove('egg', 'fade')]),
  ),
  e('chihuahua', 'pets', 'dog breeds', () =>
    act(QK('chihuahua', { c: '#e3b77a', H: 0.2, L: 0.2, D: 0.1, W: 0.1, tuck: 0.45, neck: { l: 0.06, w: 0.05, lean: 30 }, head: { l: 0.085, w: 0.095, h: 0.09 }, muz: { l: 0.035, w: 0.035, h: 0.03, drop: 0.25 }, eye: { k: 1.6 }, ear: { k: 'prick', s: 0.07, in: '#f0c0a8', tilt: 20 }, leg: { w: 0.016 }, tail: { k: 'long', l: 0.12, w: 0.014, a: 30 } }), [A.par(A.anim('shake', 2), say('Yip yip yip!', 1.6))], bark('Yap!')),
  ),
  e('chimpanzee', 'wild', 'jungle', () =>
    act(ape('chimpanzee', 1.2, '#2e2420', '#c8a07a', 1.0), [A.par(A.anim('clap'), say('Ooh ooh ah ah!', 1.8))], [A.par(A.anim('laugh'), say('Hoo-hoo-hee!', 1.6))]),
  ),
  e('chow chow', 'pets', 'dog breeds', () =>
    act(QK('chow chow', { c: '#c8642a', H: 0.5, L: 0.5, D: 0.26, W: 0.28, tuck: 0.1, neck: { l: 0.14, w: 0.17, lean: 34 }, head: { l: 0.17, w: 0.19, h: 0.16 }, muz: { l: 0.07, w: 0.1, h: 0.08, drop: 0.2 }, nose: '#1a1820', eye: { k: 0.7 }, ear: { k: 'prick', s: 0.06 }, leg: { w: 0.07, k: 1.2 }, tail: { k: 'curl', l: 0.2, w: 0.09, a: 30 } }, ruffQ('#d8783a', 1.05), tongueQ('#3a3a7a', 0.06)), [A.par(A.pose('tongue', { scale: 1, dur: 0.2 }), ps('jaw', [20, 0, 0], 0.2), say('Hrmph.', 1.4)), A.wait(1), A.par(A.pose('tongue', { scale: 0, dur: 0.2 }), ps('jaw', [0, 0, 0], 0.2))], speak('Grrr... woof.', 18)),
  ),
  // Real size (4 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('cicada', 'bugs', 'flying insects', () =>
    act(bug('cicada', { length: 0.04, color: '#4a5a32', wings: 'clear', wingColor: '#d8f0e0', extras: bx(fold('#d8f0e0', 1.25, 25), bugEyes('#8a2a1a', 1.7), partC('head', '#4a5a32', [1.5, 1, 1]), feelers(0.4)) }), [A.par(A.anim('shake', 3), say('BZZZZZZZ!', 2))], buzz('Bzzz!')),
  ),
  e('clam', 'sea', 'shellfish', () =>
    act((() => {
      const sh = '#d8c4a4';
      const f = m('clam');
      f.dome([0.105, 0.022, 0.085], [0, 0.022, 0], { color: sh, rot: [180, 0, 0], name: 'shell' })
        .dome([0.095, 0.012, 0.076], [0, 0.023, 0.002], { color: '#f2c4c0', parent: 'shell', noInk: true })
        .ball([0.026, 0.02, 0.026], [0, 0.028, 0.008], { color: '#fbf6ee', name: 'pearl', parent: 'shell', piece: true })
        .dome([0.105, 0.03, 0.085], [0, 0.022, 0], { color: '#e2d0b2', name: 'lid', parent: 'shell', pivot: [0, 0.024, -0.04], mover: { kind: 'swing', axis: 'x', amount: -55 } })
        .dome([0.08, 0.026, 0.064], [0, 0.0235, -0.006], { color: '#cbb592', parent: 'lid', noInk: true })
        .dome([0.052, 0.024, 0.042], [0, 0.0245, -0.012], { color: '#e2d0b2', parent: 'lid', noInk: true })
        .ball([0.022, 0.014, 0.018], [0, 0.034, -0.036], { color: '#b8a080', parent: 'lid' })
        .ball([0.022, 0.012, 0.018], [0, 0.012, -0.036], { color: '#b8a080', parent: 'shell' });
      return f.done();
    })(),
      [A.operate('lid', 'open'), say('!', 1.2), A.wait(1.8), A.operate('lid', 'close')],
      [A.par(A.anim('hop'), A.effect('water_spray', { dur: 0.8 }), say('Squirt!', 1.2))]),
  ),
  e('clownfish', 'sea', 'reef fish', () =>
    act(FK('clownfish', { L: 0.1, c: '#f07a1a', fin: '#f07a1a', h: 0.42, w: 0.16, shape: 'round', tail: 'round', tl: 0.2, dorsal: 0.45, dz: 0.5, dl: 0.45, anal: 0.3, pec: 0.9, eye: 1.1 }, fBands('#1e1a18', [0.2, 0.52, 0.84], 0.085, 1.03), fBands(WH, [0.2, 0.52, 0.84], 0.06, 1.05)), [A.par(A.anim('hop'), say('Blub!', 1.2))], swish('Swish swish!')),
  ),
  e('cobra', 'wild', 'reptiles', () =>
    act(snk('cobra', { length: 1.6, color: '#7a6a3a', bands: '#a89860', hood: true, girth: 0.055 }, undefined, { k: 1.1 }),
      [A.par(ps('seg6', [-22, 0, 0], 0.5), ps('seg7', [-22, 0, 0], 0.5), A.pose('hood', { scale: 1.25, dur: 0.5 }), A.pose('tongue', { scale: 2, dur: 0.2 }), say('HSSSS!', 2)), A.wait(1.4), A.par(rest('seg6', 'seg7'), A.pose('hood', { scale: 1, dur: 0.5 }), A.pose('tongue', { scale: 1, dur: 0.3 }))],
      strike('Hss!')),
  ),
  e('cockatiel', 'aviary', 'parrots', () =>
    act(AVK('cockatiel', { H: 0.3, c: '#9a9aa0', wing: '#8a8a92', tip: '#6a6a72', tail: '#7a7a82', beak: '#c8b8a8', legs: '#a89890', bl: 0.06, bk: 'parrot', leg: 0.18, tl: 0.5, tk: 'long', len: 0.5, up: 45, head: '#f2d84a' }, avCrest('#f2d84a', 1.7, 3, -15), avHead('#f08a3a', [0.4, 0.55, 0.5], [0.72, -0.1, 0.25], { mirror: true }), avPatch(WH, [1.06, 0.3, 0.4], [0, 0.42, 0.1])),
      [A.par(ps('crest', [-35, 0, 0], 0.3), say('Wheee-whistle!', 1.8)), A.wait(0.8), rest('crest')],
      sing('Pretty bird!')),
  ),
  e('cockatoo', 'aviary', 'parrots', () =>
    act(AVK('cockatoo', { H: 0.45, c: '#f6f6f2', wing: '#eeeeea', tail: '#f0f0ec', beak: '#3a3a3e', legs: '#5a5a5e', bl: 0.08, bk: 'parrot', bw: 1.3, leg: 0.16, tl: 0.32, tk: 'wedge', len: 0.5, up: 45, eye: '#2a2a2a' }, avCrest('#f2d84a', 1.8, 4, -10)),
      [A.par(ps('crest', [-40, 0, 0], 0.25), ps('jaw', [30, 0, 0], 0.2), say('SCREEEECH!', 1.8)), A.wait(0.8), rest('crest', 'jaw')],
      [A.par(A.anim('bounce', 4), ps('crest', [-30, 0, 0], 0.3), say('Hello! Hello!', 2)), rest('crest')]),
  ),
  e('cocker spaniel', 'pets', 'dog breeds', () =>
    act(QK('cocker spaniel', { c: '#d4a050', H: 0.39, L: 0.4, D: 0.2, W: 0.18, tuck: 0.2, belly: '#e0b462', neck: { l: 0.12, w: 0.11, lean: 30 }, head: { l: 0.13, w: 0.13, h: 0.13 }, muz: { l: 0.07, w: 0.075, h: 0.075, drop: 0.25 }, eye: { k: 1.2 }, ear: { k: 'drop', s: 0.18, c: '#c08a3a' }, leg: { w: 0.045 }, tail: { k: 'stub', l: 0.08, w: 0.04, a: 60 } }, patch('#e0b462', 0.15, 0.85, -0.08)), wagHard('Woof!'), [A.par(A.anim('shake'), say('Ruff!', 1.2))]),
  ),
  e('cockroach', 'bugs', 'pests', () =>
    act(bug('cockroach', { length: 0.035, color: '#6a3a1e', wings: 'none', extras: bx(partC('abdomen', '#6a3a1e', [1.1, 0.6, 1.1]), elytra('#7a4422', 1.15), feelers(2.6, '#5a3018')) }), scurry('!'), [A.par(ps('caseL', [0, 0, 35], 0.2), ps('caseR', [0, 0, -35], 0.2), A.anim('hop'), say('!', 1)), rest('caseL', 'caseR')]),
  ),
  e('collie', 'pets', 'dog breeds', () =>
    act(QK('collie', { c: '#b8783a', H: 0.6, L: 0.62, D: 0.28, W: 0.24, tuck: 0.35, neck: { l: 0.17, w: 0.15, lean: 35 }, head: { l: 0.2, w: 0.12, h: 0.12 }, muz: { l: 0.13, w: 0.06, h: 0.065, c: WH, drop: 0.12 }, eye: { k: 0.9, c: '#4a2a14' }, ear: { k: 'fold', s: 0.08 }, leg: { w: 0.05 }, tail: { k: 'bushy', l: 0.4, w: 0.09, a: 158, tip: WH } }, ruffQ(WH, 1.15), blazeQ(WH), socksQ(WH, 0.3), chest(WH)),
      [...bark('Woof! Woof!'), A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'run' }), ...wagHard('Woof!', 1)],
      howl('Arooo!', 25)),
  ),
  e('corgi', 'pets', 'dog breeds', () =>
    act(QK('corgi', { c: '#d9843a', H: 0.28, L: 0.5, D: 0.18, W: 0.24, tuck: 0.12, belly: WH, neck: { l: 0.1, w: 0.12, lean: 32 }, head: { l: 0.14, w: 0.13, h: 0.12 }, muz: { l: 0.08, w: 0.06, h: 0.055, c: WH, drop: 0.16 }, ear: { k: 'prick', s: 0.1, in: '#f2c8a8' }, leg: { w: 0.05, k: 1.2, hock: 0.7 }, tail: { k: 'stub', l: 0.05, w: 0.05, a: 120 } }, chest(WH), blazeQ(WH), socksQ(WH, 0.6)), [A.par(A.anim('wobble', 2), say('Arf arf!', 1.4))], bark('Woof!')),
  ),
  e('crab', 'sea', 'shellfish', () =>
    act(crab('crab', { w: 0.2, c: '#d8452a', under: '#f0d8b0', tip: '#2a2420' }), snap('Snip snap!'), [A.par(A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'run' }), say('!', 1))]),
  ),
  e('crane (bird)', 'aviary', 'water birds', () =>
    act(AVK('crane (bird)', { H: 1.4, c: '#f4f4f0', wing: '#f0f0ec', tip: '#2a2a2a', tail: '#2a2a2a', head: '#2a2a2a', beak: '#c8c0a0', legs: '#3a3a3a', len: 0.3, fat: 0.5, up: 8, neck: 0.32, hk: 0.45, bl: 0.12, bk: 'dagger', leg: 0.5, lw: 0.9, tl: 0.12, tk: 'fan', wl: 1.0 }, avHead('#e02a2a', [0.9, 0.35, 0.8], [0, 0.82, -0.1], { ink: true }), avHead('#f4f4f0', [0.85, 0.7, 0.9], [0, 0.25, -0.5])),
      [A.par(A.anim('hop', 2), ps('wingL', [0, 0, 70], 0.3), ps('wingR', [0, 0, -70], 0.3), say('Kroo-kroo!', 1.8)), rest('wingL', 'wingR')],
      sing('Garoo!')),
  ),
  e('crayfish', 'sea', 'shellfish', () =>
    act((() => {
      const c = '#a8402a', w = 0.03;
      const f = m('crayfish', { view: 'side', rig: 'bug' });
      f.loft([w, w * 0.8, 0.05], [0, 0.025, 0.02], [[0, 0.8, 0.8, 0], [0.6, 1, 1, 0.02], [1, 0.4, 0.4, 0]], { color: c, name: 'body' })
        .cone([0.008, 0.02, 0.006], [0, 0.034, 0.054], { color: c, rot: [90, 0, 0], parent: 'body' });
      f.ball([0.026, 0.02, 0.02], [0, 0.022, -0.014], { color: c, name: 'tail', parent: 'body', pivot: [0, 0.024, -0.004] });
      for (let i = 1; i < 5; i++) f.ball([0.026 - i * 0.003, 0.02 - i * 0.0025, 0.018], [0, 0.022 - i * 0.003, -0.014 - i * 0.014], { color: c, parent: 'tail' });
      f.ball([0.04, 0.005, 0.022], [0, 0.009, -0.082], { color: c, parent: 'tail' });
      f.pair((s) => {
        const cl = s > 0 ? 'clawL' : 'clawR', fg = s > 0 ? 'pinchL' : 'pinchR', sh: Vec3 = [s * 0.012, 0.022, 0.035], el: Vec3 = [s * 0.026, 0.026, 0.06], hd: Vec3 = [s * 0.03, 0.03, 0.09];
        f.rod(sh, el, 0.008, c, { name: cl, parent: 'body', pivot: sh }).rod(el, hd, 0.01, c, { parent: cl }).ball([0.016, 0.011, 0.032], add3(hd, [0, 0, 0.01]), { color: c, parent: cl })
          .cone([0.008, 0.024, 0.005], add3(hd, [0, -0.003, 0.034]), { color: c, rot: [92, 0, 0], parent: cl })
          .cone([0.007, 0.022, 0.004], add3(hd, [0, 0.004, 0.033]), { color: c, rot: [84, 0, 0], name: fg, parent: cl, pivot: add3(hd, [0, 0.004, 0.022]) })
          .ball(0.007, [s * 0.007, 0.036, 0.048], { color: '#1d1a17', eye: true, parent: 'body' })
          .rod([s * 0.005, 0.032, 0.05], [s * 0.03, 0.05, 0.14], 0.0025, c, { name: s > 0 ? 'antennaL' : 'antennaR', parent: 'body', pivot: [s * 0.005, 0.032, 0.05] });
        f.each(4, (i) => f.rod([s * 0.012, 0.018, 0.03 - i * 0.012], [s * 0.03, 0.001, 0.026 - i * 0.013], 0.0035, c, { parent: 'body' }));
      });
      return f.done();
    })(),
      snap('Click click!'),
      [A.par(ps('tail', [40, 0, 0], 0.1), A.move('self', { rel: 'behind', of: 'self', dist: 'close' }, { speed: 'run' }), say('!', 1)), rest('tail')]),
  ),
  // Real size (2 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('cricket', 'bugs', 'hoppers', () =>
    act(bug('cricket', { length: 0.022, color: '#3a2a1a', extras: bx(fold('#4a3424', 1.1), hindLegs('#3a2a1a'), feelers(2.4)) }), [ps('wingL', [0, 0, 18], 0.1), ps('wingL', [0, 0, 0], 0.1), A.par(ps('wingL', [0, 0, 18], 0.1), say('Chirp chirp!', 1.6)), ps('wingL', [0, 0, 0], 0.1), ps('wingL', [0, 0, 18], 0.1), ps('wingL', [0, 0, 0], 0.1)], [A.par(A.anim('hop', 2), say('!', 1))]),
  ),
  // Real size wins over the vocabulary's 4 m height: that is its length; a crocodile 4.5 m long stands about 0.4 m tall.
  e('crocodile', 'wild', 'reptiles', () =>
    act(RK('crocodile', { L: 4.5, bf: 0.33, tf: 0.47, hf: 0.17, w: 0.13, h: 0.075, c: '#6b7a3e', belly: '#e0dcb0', ridge: '#4e5a2c', leg: 0.1, lw: 0.022, snout: 'croc', scutes: 16, teeth: 9 }),
      [A.operate('jaw', 'open'), A.wait(1.2), A.par(A.operate('jaw', 'close'), say('SNAP!', 1.2))],
      [A.par(A.anim('spin'), A.effect('water_spray', { dur: 1.4 }), say('Splash!', 1.4))]),
  ),
  e('crow', 'aviary', 'common birds', () =>
    act(AVK('crow', { H: 0.42, c: '#1c1c22', wing: '#22222a', tip: '#16161c', tail: '#1a1a20', beak: '#2a2a30', legs: '#2a2a30', bl: 0.13, bw: 1.2, leg: 0.22, tl: 0.32, tk: 'fan', eye: '#3a2a20' }), sing('Caw! Caw!'), flyUp('Caw!')),
  ),
  e('cub', 'wild', 'forest', () =>
    actF(QK('cub', grow(QBEAR, 0.38, 1.4, 0.9)), (f) => [[A.par(A.anim('hop'), say('Mrr!', 1.2))], rearUp(f, 'Rawr!', 50, 1)]),
  ),
  e('dachshund', 'pets', 'dog breeds', () =>
    act(QK('dachshund', { c: '#8a3a1e', H: 0.23, L: 0.52, D: 0.16, W: 0.15, tuck: 0.1, neck: { l: 0.12, w: 0.08, lean: 40 }, head: { l: 0.14, w: 0.085, h: 0.085 }, muz: { l: 0.09, w: 0.05, h: 0.05, drop: 0.12 }, ear: { k: 'drop', s: 0.1, c: '#6a2a14' }, leg: { w: 0.04, k: 1.2, hock: 0.7 }, tail: { k: 'long', l: 0.22, w: 0.03, a: 115 } }, collarQ('#2a6ac8', '#e8c040')), dig('Arf! Arf!'), bark('Woof!')),
  ),
  e('dalmatian', 'pets', 'dog breeds', () =>
    actF(QK('dalmatian', { c: '#f6f4f0', H: 0.58, L: 0.6, D: 0.27, W: 0.24, tuck: 0.38, neck: { l: 0.18, w: 0.13, lean: 36 }, head: { l: 0.18, w: 0.13, h: 0.13 }, muz: { l: 0.11, w: 0.075, h: 0.075, drop: 0.14 }, ear: { k: 'drop', s: 0.11, c: '#2a2624' }, leg: { w: 0.05 }, tail: { k: 'long', l: 0.38, w: 0.04, a: 120 } }, spotsQ('#2a2624', 46, 0.04, { lo: -40, hi: 90 }), onHead('#2a2624', [0.18, 0.18, 0.14], [0.3, 0.42, 0.0]), onHead('#2a2624', [0.14, 0.16, 0.12], [-0.12, 0.5, 0.3])), (f) => [bark('Woof! Woof!'), sitQ(f, 'Arf!')]),
  ),
  e('deer', 'wild', 'forest', () =>
    act(QK('deer', { c: '#a8743e', H: 1.0, L: 1.05, D: 0.44, W: 0.36, tuck: 0.45, belly: '#f0e6d4', neck: { l: 0.45, w: 0.15, lean: 26 }, head: { l: 0.25, w: 0.15, h: 0.15 }, muz: { l: 0.15, w: 0.09, h: 0.09, c: '#8a5a32', drop: 0.18 }, eye: { k: 1.2 }, ear: { k: 'long', s: 0.17, in: '#e8d8c0', tilt: 25 }, leg: { w: 0.048, hoof: '#2a2420' }, tail: { k: 'flat', l: 0.18, w: 0.09, a: 150, tip: WH } }, antlersQ('#8a6440', 0.55), onHead(WH, [0.5, 0.3, 0.2], [0, -0.18, 0.62]), onHead(WH, [0.3, 0.2, 0.2], [0.22, 0.18, 0.18], { mirror: true })),
      [A.par(ps('head', [-15, 35, 0], 0.3), ps('earL', [-25, 0, 0], 0.3), ps('earR', [-25, 0, 0], 0.3), ps('tail', [-80, 0, 0], 0.3), say('Snort!', 1.2)), A.wait(0.8), A.par(rest('head', 'earL', 'earR', 'tail'), A.anim('hop', 2))],
      graze('Munch.')),
  ),
  e('dingo', 'wild', 'outback', () =>
    act(QK('dingo', { c: '#d48a46', H: 0.56, L: 0.6, D: 0.25, W: 0.22, tuck: 0.4, neck: { l: 0.16, w: 0.12, lean: 38 }, head: { l: 0.16, w: 0.13, h: 0.12 }, muz: { l: 0.11, w: 0.06, h: 0.065, c: '#f4e6d0', drop: 0.14 }, eye: { c: '#8a5a1a' }, ear: { k: 'prick', s: 0.09, in: '#f4e6d0' }, leg: { w: 0.045 }, tail: { k: 'bushy', l: 0.34, w: 0.08, a: 140, tip: '#f4e6d0' } }, chest('#f4e6d0'), socksQ('#f4e6d0', 0.2)), howl('Aroooooo!', 42), sniff('Sniff...')),
  ),
  e('dinosaur', 'wild', 'dinosaurs', () =>
    act(trex('dinosaur', '#5f7e4a', '#c8c890', '#3e5a30'),
      [A.par(ps('neck', [-12, 0, 0], 0.4), ps('head', [-14, 0, 0], 0.4), A.operate('jaw', 'open'), A.anim('shake'), say('ROOOAAAR!', 2.2)), A.wait(1.4), A.par(A.operate('jaw', 'close'), rest('neck', 'head'))],
      [A.par(A.anim('hop'), A.effect('dust', { dur: 1.4 }), say('STOMP!', 1.4)), A.par(A.anim('hop'), A.effect('dust', { dur: 1.2 }))]),
  ),
  e('dodo', 'aviary', 'flightless birds', () =>
    act(AVK('dodo', { H: 0.72, c: '#8a8f9a', belly: '#9a9eaa', wing: '#7c808a', tail: '#f4f0e8', beak: '#d8c27a', legs: '#e8c040', len: 0.6, fat: 0.95, up: 18, hk: 1.25, bl: 0.24, bk: 'hook', bw: 1.6, leg: 0.16, lw: 2, tl: 0.14, tk: 'fan', wl: 0.45 }, avHead('#b8b0a0', [1.0, 1.0, 0.8], [0, 0.0, 0.62]), avPatch('#e8e4dc', [0.5, 0.4, 0.2], [0, 0.3, -0.52])), [A.par(A.anim('wobble', 2), say('Doo-doo!', 1.6))], peck('Peck?')),
  ),
  e('dolphin', 'sea', 'dolphins', () =>
    act(FK('dolphin', { L: 2.5, c: '#7a8a9a', belly: '#e8ecf0', h: 0.2, w: 0.18, shape: 'whale', tail: 'flukes', tl: 0.22, dorsal: 0.85, dz: 0.5, dl: 0.12, sw: 0.45, pec: 1.2, pz: 0.7, eye: 0.4, ez: 0.83 }, dolphinHead('#7a8a9a')),
      [A.par(A.anim('hop'), A.anim('spin'), A.effect('water_spray', { dur: 1.4 }), say('Eee-eee!', 1.6))],
      [A.par(ps('jaw', [22, 0, 0], 0.15), say('Click-click-click!', 1.6)), A.wait(0.4), ps('jaw', [0, 0, 0], 0.15), ...swish('', 25).slice(0, 2), rest('tail')]),
  ),
  e('dolphin calf', 'sea', 'dolphins', () =>
    act(FK('dolphin calf', { L: 1.1, c: '#8a9aaa', belly: '#eef2f4', h: 0.22, w: 0.2, shape: 'whale', tail: 'flukes', tl: 0.22, dorsal: 0.7, dz: 0.5, dl: 0.12, sw: 0.45, pec: 1.2, pz: 0.7, eye: 0.5, ez: 0.83 }, dolphinHead('#8a9aaa')), [A.par(A.anim('hop'), A.effect('water_spray', { dur: 1 }), say('Eee!', 1.4))], swimSpin('Squee!')),
  ),
  e('donkey', 'farm', 'horses', () =>
    act(QK('donkey', QDONKEY, maneQ('#3a3330'), onHead('#e4ddd4', [0.3, 0.3, 0.26], [0.32, 0.18, 0.28], { mirror: true }), (f, d) => f.socket('seat', [0, d.q.H + 0.05, -0.05], 'seat', { part: 'body', size: 0.5 })),
      [A.par(ps('neck', [-20, 0, 0], 0.4), ps('head', [-15, 0, 0], 0.4), ps('jaw', [34, 0, 0], 0.3), ps('earL', [0, 0, 25], 0.3), ps('earR', [0, 0, -25], 0.3), say('HEE-HAW!', 2)), A.wait(0.4), ps('jaw', [5, 0, 0], 0.15), ps('jaw', [34, 0, 0], 0.15), A.wait(0.6), rest('neck', 'head', 'jaw', 'earL', 'earR')],
      graze('Munch munch.')),
  ),
  e('donkey foal', 'farm', 'horses', () =>
    act(QK('donkey foal', { ...grow(QDONKEY, 0.58, 1.3, 1.25), c: '#9a928a' }, maneQ('#5a5350')), [A.par(A.anim('hop', 2), say('Hee-haw!', 1.4))], graze('Mm.')),
  ),
  e('dove', 'aviary', 'common birds', () =>
    act(AVK('dove', { H: 0.28, c: '#f6f6f4', wing: '#ececf0', tip: '#dcdce2', tail: '#f0f0f0', beak: '#e8a8a0', legs: '#e88a8a', len: 0.6, fat: 0.6, up: 22, hk: 0.85, bl: 0.07, leg: 0.16, tl: 0.32, tk: 'fan' }), [ps('head', [20, 0, 0], 0.2), ps('head', [-10, 0, 0], 0.2), A.par(ps('head', [20, 0, 0], 0.2), say('Coo-coo...', 1.8)), rest('head')], flyUp('Coo!')),
  ),
  e('dragonfly', 'bugs', 'flying insects', () =>
    act(bug('dragonfly', {
      length: 0.07,
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
    }), [A.par(A.anim('hop', 3), say('Zzzip!', 1.2))], [A.par(A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'fly', style: 'fly' }), say('Zzz!', 1))]),
  ),
  e('duck', 'aviary', 'water birds', () =>
    act(AVK('duck', { H: 0.42, c: '#a8a49a', belly: '#c8c4bc', wing: '#7a6a5a', tip: '#3a5a9a', tail: '#2a2a2a', head: '#1e6a3a', beak: '#f2c020', legs: '#f29a20', len: 0.72, fat: 0.5, up: 6, hk: 1.0, bl: 0.12, bk: 'flat', bw: 1.1, leg: 0.12, lw: 1.4, tl: 0.12, tk: 'stub', wl: 0.85 }, avHead(WH, [1.1, 0.25, 1.1], [0, -0.85, 0.0]), avPatch('#7a3e2a', [0.95, 0.55, 0.38], [0, 0.0, 0.34])),
      [A.par(ps('jaw', [25, 0, 0], 0.12), say('Quack quack!', 1.4)), ps('jaw', [0, 0, 0], 0.1), ps('jaw', [25, 0, 0], 0.12), ps('jaw', [0, 0, 0], 0.1)],
      [A.par(A.anim('wobble', 2), A.effect('water_spray', { dur: 1 }), say('Quack!', 1.2))]),
  ),
  e('duckling', 'aviary', 'water birds', () =>
    act(AVK('duckling', { H: 0.13, c: '#f8dc4a', belly: '#f8e88a', wing: '#f0c830', tail: '#f0c830', head: '#f6d040', beak: '#f29a20', legs: '#f29a20', len: 0.6, fat: 0.75, up: 12, hk: 1.4, bl: 0.09, bk: 'flat', leg: 0.16, lw: 1.3, tl: 0.06, tk: 'stub', wl: 0.5 }, avHead('#7a6a2a', [0.4, 0.15, 0.8], [0.55, 0.15, 0.1], { mirror: true })), [A.par(A.anim('hop', 2), say('Peep peep!', 1.4))], peck('Peep!')),
  ),
  e('eagle', 'aviary', 'birds of prey', () =>
    act(AVK('eagle', { H: 0.85, c: '#4a3020', belly: '#3e2818', wing: '#3a2414', tip: '#2a1a10', tail: WH, head: WH, beak: '#f2c02a', legs: '#f2c02a', len: 0.62, fat: 0.5, up: 42, bl: 0.11, bk: 'hook', bw: 1.2, leg: 0.2, lw: 1.5, tl: 0.3, tk: 'wedge', wl: 1.05 }), spread('SKREEE!', 85, 1.6), flyUp('Kree!')),
  ),
  // Real size wins over the vocabulary's 1 m height: that is its length; a 1 m eel is only about 0.15 m tall.
  e('eel', 'sea', 'ocean fish', () =>
    act(FK('eel', { L: 1.0, c: '#3e3e30', belly: '#d8a040', fin: '#3a3a2e', h: 0.08, w: 0.07, shape: 'eel', tail: 'point', tl: 0.1, dorsal: 0.5, dz: 0.3, dl: 0.55, anal: 0.5, sw: 0.1, pec: 0.4, eye: 0.6, ez: 0.92 }), [A.par(A.effect('sparkle', { dur: 1.2 }), A.anim('shake', 2), say('BZZZT!', 1.4))], swish('Swish...', 30)),
  ),
  e('elephant', 'wild', 'savanna', () =>
    act(QK('elephant', QELE, eleHead('#8e8c8a', 1.0), (f, d) => f.socket('seat', [0, d.q.H + 0.25, 0.1], 'seat', { part: 'body', size: 1.2 })), trumpet('PAWOOO!'), trunkSpray('Pfffssh!')),
  ),
  e('elephant calf', 'wild', 'savanna', () =>
    act(QK('elephant calf', grow(QELE, 0.42, 1.25, 1.0), eleHead('#9a9896', 0)), trumpet('Pawoo!'), trunkSpray('Pfft!')),
  ),
  e('emperor penguin', 'aviary', 'flightless birds', () =>
    act((() => {
      const k = '#22252e';
      const f = m('emperor penguin', { rig: 'bird' });
      f.loft([0.46, 0.4, 1.0], [0, 0.5, -0.02], [[0, 0.5, 0.5, 0], [0.18, 0.86, 0.9, -0.02], [0.5, 1, 1, 0], [0.8, 0.86, 0.82, 0.05], [1, 0.5, 0.5, 0.1]], { color: k, rot: [-90, 0, 0], name: 'body' })
        .loft([0.4, 0.3, 0.84], [0, 0.46, 0.07], [[0, 0.5, 0.5, 0], [0.3, 0.95, 0.95, 0], [0.7, 0.9, 0.9, 0], [1, 0.4, 0.4, 0]], { color: '#f6f3ea', rot: [-90, 0, 0], parent: 'body', noInk: true })
        .ball([0.3, 0.16, 0.2], [0, 0.8, 0.1], { color: '#f6dc8a', parent: 'body', noInk: true })
        .ball([0.25, 0.25, 0.27], [0, 1.0, 0.03], { color: k, name: 'head', parent: 'body', pivot: [0, 0.9, 0] })
        .cone([0.05, 0.17, 0.045], [0, 0.98, 0.22], { color: k, rot: [100, 0, 0], parent: 'head' })
        .cone([0.04, 0.15, 0.025], [0, 0.955, 0.2], { color: '#f2903a', rot: [104, 0, 0], name: 'jaw', parent: 'head', pivot: [0, 0.965, 0.13] });
      f.pair((s) =>
        f.ball([0.05, 0.13, 0.09], [s * 0.11, 0.92, 0.03], { color: '#f2b03a', noInk: true, parent: 'head' })
          .ball(0.022, [s * 0.085, 1.03, 0.12], { color: '#1d1a17', eye: true, parent: 'head' })
          .loft([0.06, 0.14, 0.46], [s * 0.24, 0.58, -0.01], [[0, 0.4, 0.5, 0], [0.5, 1, 1, 0], [1, 0.6, 0.7, 0]], { color: k, rot: [-82, 0, s * 12], name: s > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [s * 0.21, 0.78, 0] })
          .rod([s * 0.08, 0.12, 0.02], [s * 0.09, 0.03, 0.04], 0.07, k, { name: s > 0 ? 'legL' : 'legR', parent: 'body', pivot: [s * 0.08, 0.14, 0.02] })
          .ball([0.12, 0.035, 0.16], [s * 0.09, 0.018, 0.1], { color: '#2a2a2a', parent: s > 0 ? 'legL' : 'legR' }),
      );
      f.cone([0.14, 0.14, 0.06], [0, 0.1, -0.2], { color: k, rot: [-120, 0, 0], name: 'tail', parent: 'body' });
      return f.done();
    })(),
      [A.par(A.anim('wobble', 2), say('Squawk!', 1.4))],
      [A.par(ps('head', [-45, 0, 0], 0.5), ps('jaw', [20, 0, 0], 0.4), ps('wingL', [0, 0, 35], 0.5), ps('wingR', [0, 0, -35], 0.5), say('Aaa-aaah!', 2)), A.wait(1.2), rest('head', 'jaw', 'wingL', 'wingR')]),
  ),
  e('emu', 'aviary', 'flightless birds', () =>
    act(AVK('emu', { H: 1.7, c: '#6a5040', belly: '#7a6050', wing: '#5e4636', tail: '#5e4636', head: '#4a4a52', beak: '#3a3430', legs: '#7a7a72', len: 0.34, fat: 0.85, up: 12, neck: 0.36, hk: 0.45, bl: 0.06, leg: 0.48, lw: 1.5, tl: 0.1, tk: 'stub', wl: 0.4, eye: '#a86a2a' }, avHead('#7a90a8', [0.9, 0.9, 0.8], [0, -0.6, 0.1])),
      [A.par(A.anim('bounce', 3), say('Boom-boom-boom...', 2))],
      [A.par(A.move('self', { rel: 'random' }, { speed: 'run' }), say('!', 1))]),
  ),
  e('falcon', 'aviary', 'birds of prey', () =>
    act(AVK('falcon', { H: 0.42, c: '#5a6a80', belly: '#f2ead8', wing: '#4a5a70', tip: '#2a3240', tail: '#4a5a70', head: '#3a4250', beak: '#3a3a40', legs: '#f2c02a', len: 0.6, fat: 0.55, up: 40, bl: 0.07, bk: 'hook', leg: 0.2, lw: 1.3, tl: 0.32, tk: 'wedge', wl: 1.1, eye: '#2a1a10' }, avHead('#1e2028', [0.35, 0.9, 0.5], [0.62, -0.35, 0.3], { mirror: true }), avHead('#f2ead8', [1.1, 0.7, 0.9], [0, -0.55, 0.42]), avHead('#f2c02a', [0.5, 0.5, 0.2], [0.58, 0.18, 0.42], { mirror: true })), spread('Kek-kek-kek!', 80, 1.2), flyUp('Kree!')),
  ),
  e('fawn', 'wild', 'forest', () =>
    act(QK('fawn', { ...grow(QDEER, 0.6, 1.35, 1.2), c: '#b88048' }, spotsQ(WH, 26, 0.04, { lo: 10, hi: 85, t0: 0.1, t1: 0.85 }), onHead(WH, [0.3, 0.2, 0.2], [0.22, 0.18, 0.18], { mirror: true })), [A.par(A.anim('hop', 2), say('Mew!', 1.2))], graze('Mm.')),
  ),
  // Real size (7.5 mm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('fire ant', 'bugs', 'ants', () =>
    act(bug('fire ant', { length: 0.0075, color: '#c8401a', wings: 'none', extras: antBody('#c8401a', '#8a2a10') }), [A.par(A.anim('shake', 2), say('!!', 1.2))], scurry('!')),
  ),
  // Real size (2 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('firefly', 'bugs', 'beetles', () =>
    act(bug('firefly', { length: 0.02, color: '#2a2420', wings: 'none', extras: bx(elytra('#3a3028', 0.85, '#e07a3a'), (p, { L }) => p.add(P('abdomen', 'ball', [0.3 * L, 0.24 * L, 0.22 * L], [0, -0.06 * L, -0.38 * L], '#e8f070', { name: 'lantern', role: 'glow', mover: { kind: 'light', on: true }, layer: 4 }))) }),
      [A.operate('lantern', 'off'), A.wait(0.5), A.operate('lantern', 'on'), A.wait(0.4), A.operate('lantern', 'off'), A.wait(0.4), A.par(A.operate('lantern', 'on'), say('Blink!', 1.2))],
      [A.par(ps('caseL', [0, 0, 45], 0.2), ps('caseR', [0, 0, -45], 0.2)), A.anim('hop', 3), rest('caseL', 'caseR')]),
  ),
  e('fish (animal)', 'sea', 'ocean fish', () =>
    act(FK('fish (animal)', { L: 0.3, c: '#3a8ad0', belly: '#d8ecf8', fin: '#f0c040', h: 0.3, anal: 0.25 }), swimSpin('Blub!'), gulp('Gulp.')),
  ),
  e('flamingo', 'aviary', 'water birds', () =>
    act(AVK('flamingo', { H: 1.25, c: '#f49ab0', wing: '#f07a98', tip: '#2a2a2a', tail: '#f07a98', beak: '#f2e0d8', legs: '#f08aa0', len: 0.34, fat: 0.62, up: 6, neck: 0.3, hk: 0.42, bl: 0.11, bk: 'down', bw: 1.5, leg: 0.52, lw: 0.8, tl: 0.1, tk: 'stub', wl: 1.0, eye: '#e8b020' }, (f, d) => f.cone([d.hr * 0.5, d.o.bl * d.S * 0.4, d.hr * 0.4], add3(d.hc, [0, -d.o.bl * d.S * 0.5, d.o.bl * d.S * 0.84]), { color: '#1e1e1e', rot: [150, 0, 0], parent: 'head' })),
      [A.par(ps('legR', [-80, 0, 0], 0.6), say('...', 1.2)), A.wait(2), rest('legR')],
      [A.par(ps('head', [20, 0, 0], 0.2), say('Honk honk!', 1.4)), ps('head', [-10, 0, 0], 0.2), ps('head', [20, 0, 0], 0.2), rest('head')]),
  ),
  // Real size (8 mm (a real flea is 2-3 mm; 5 mm tall is the least the checker accepts) long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('flea', 'bugs', 'pests', () =>
    act(bug('flea', { length: 0.0082, color: '#5a3a1e', wings: 'none', extras: bx(hindLegs('#5a3a1e', 1.2), partC('abdomen', '#5a3a1e', [0.7, 1.3, 1.0]), partC('body', '#5a3a1e', [0.7, 1.2, 1]), feelers(0.4)) }), [A.par(A.anim('hop', 3), say('Boing!', 1.2))], scurry('!')),
  ),
  // Real size (8 mm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('fly', 'bugs', 'flies', () =>
    act(bug('fly', { length: 0.008, color: '#3a3a40', wings: 'clear', extras: bugEyes('#a02018', 2) }), buzz('Bzzzz!'), [ps('leg0L', [0, 30, 0], 0.15), ps('leg0R', [0, -30, 0], 0.15), ps('leg0L', [0, 0, 0], 0.15), A.par(ps('leg0R', [0, 0, 0], 0.15), say('Rub rub.', 1.2))]),
  ),
  // Real size wins over the vocabulary's 0.4 m height: that is its length; a 0.32 m flying fish is 8 cm tall.
  e('flying fish', 'sea', 'ocean fish', () =>
    act(FK('flying fish', { L: 0.32, c: '#2a5aa0', belly: '#e0e8f0', fin: '#8ab0d8', h: 0.16, w: 0.13, shape: 'long', tail: 'fork', tl: 0.22, dorsal: 0.3, dz: 0.28, dl: 0.08, pec: 0.1, eye: 1.2 }, (f, d) => {
      const [w, h, cy] = d.sec(0.68), L = d.o.L;
      f.pair((s) => f.ball([L * 0.5, L * 0.008, L * 0.22], [s * (w + L * 0.23), cy + h * 0.3, d.z(0.6)], { color: '#9abce0', rot: [0, s * 12, s * 6], name: s > 0 ? 'wingL' : 'wingR', parent: 'body', pivot: [s * w, cy + h * 0.3, d.z(0.68)] }).ball([L * 0.18, L * 0.006, L * 0.1], [s * (w + L * 0.08), cy - h * 0.5, d.z(0.3)], { color: '#9abce0', parent: 'body' }));
    }), [A.par(A.anim('hop', 2), A.effect('water_spray', { dur: 1.2 }), say('Whoosh!', 1.4))], swimSpin('Blub!')),
  ),
  e('flying squirrel', 'wild', 'forest', () =>
    act(QK('flying squirrel', { c: '#9a8470', H: 0.09, L: 0.16, D: 0.06, W: 0.08, tuck: 0.1, belly: '#f2ece0', neck: { l: 0.02, w: 0.045, lean: 40 }, head: { l: 0.05, w: 0.05, h: 0.045 }, muz: { l: 0.018, w: 0.025, h: 0.02, drop: 0.2 }, nose: '#e89a9a', eye: { k: 1.8 }, ear: { k: 'round', s: 0.018, in: '#e8c8b8' }, leg: { w: 0.012 }, tail: { k: 'flat', l: 0.13, w: 0.045, a: 105 } }, (f, d) => f.ball([d.q.W * 2.8, d.q.D * 0.12, d.q.L * 0.8], [0, d.yb - d.q.D * 0.15, 0], { color: '#8a7460', parent: 'body' })),
      [A.par(A.anim('hop', 2), say('Wheee!', 1.4))],
      [A.par(ps('head', [-10, 30, 0], 0.3), say('Chirp!', 1.2)), A.wait(0.6), rest('head')]),
  ),
  // A young foal, 1 m at the withers: a short body and a slim neck on long legs (nearly a grown horse's), a big
  // head and eyes, a short bristly mane and a short fluffy tail.
  e('foal', 'farm', 'horses', () =>
    act(QK('foal', { c: '#9a6438', H: 1.02, L: 0.92, D: 0.4, W: 0.3, tuck: 0.3, belly: '#a8744a', neck: { l: 0.48, w: 0.17, lean: 36, base: 0.3 }, head: { l: 0.3, w: 0.17, h: 0.19 }, muz: { l: 0.19, w: 0.13, h: 0.14, drop: 0.2 }, eye: { k: 1.25 }, ear: { k: 'prick', s: 0.1 }, leg: { w: 0.062, hoof: '#3a2a20', low: '#6a4226' }, tail: { k: 'bushy', l: 0.34, w: 0.1, a: 150, c: '#3a2618' } }, maneQ('#3a2618', 0.7), blazeQ(WH), limbsQ(1.6)), [A.par(A.anim('hop', 2), say('Neigh!', 1.4))], graze('Munch.')),
  ),
  e('fox', 'wild', 'forest', () =>
    act(QK('fox', QFOX, ...foxMarks), [A.par(A.anim('hop'), say('Yip!', 1.2)), A.move('self', { rel: 'random' }, { speed: 'run', style: 'hop' })], speak('Ring-a-ding-ding!', 26, 1.8), sniff('Sniff...')),
  ),
  e('fox cub', 'wild', 'forest', () =>
    act(QK('fox cub', { ...grow(QFOX, 0.48, 1.4, 0.9), c: '#c8703a' }, ...foxMarks), [A.par(A.anim('hop', 2), say('Yip yip!', 1.2))], sniff('Sniff?')),
  ),
  e('french bulldog', 'pets', 'dog breeds', () =>
    act(QK('french bulldog', { c: '#d8b888', H: 0.31, L: 0.34, D: 0.2, W: 0.24, tuck: 0.25, neck: { l: 0.06, w: 0.15, lean: 30 }, head: { l: 0.15, w: 0.18, h: 0.16 }, muz: { l: 0.035, w: 0.11, h: 0.08, c: '#3a3028', drop: 0.26 }, eye: { k: 1.3 }, ear: { k: 'prick', s: 0.1, in: '#e8b8a8' }, leg: { w: 0.05, k: 1.2 }, tail: { k: 'stub', l: 0.04, w: 0.04, a: 130 } }),
      [A.par(ps('head', [0, 0, 25], 0.3), say('?', 1.2)), A.wait(0.8), rest('head')],
      speak('Snort! Snort!', 14)),
  ),
  e('frog', 'wild', 'amphibians', () =>
    act((() => {
      const g = '#5aa83a', d = '#3a7a2a';
      const f = m('frog', { rig: 'quad' });
      f.ball([0.07, 0.05, 0.075], [0, 0.03, -0.005], { color: g, rot: [-25, 0, 0], name: 'body' })
        .ball([0.05, 0.04, 0.04], [0, 0.026, 0.022], { color: '#e8e4b0', noInk: true, rot: [-25, 0, 0], parent: 'body' })
        .ball([0.07, 0.035, 0.055], [0, 0.052, 0.02], { color: g, name: 'head', parent: 'body' })
        .ball([0.06, 0.012, 0.04], [0, 0.036, 0.026], { color: g, name: 'jaw', parent: 'head', pivot: [0, 0.04, 0.0] })
        .ball([0.045, 0.04, 0.04], [0, 0.03, 0.045], { color: '#f0ecc0', name: 'sac', parent: 'head', scale: 0, noInk: true })
        .capsule([0.003, 0.044, 0.003], [0, 0.046, 0.046], { color: '#2a3a20', rot: [0, 0, 90], noInk: true, parent: 'head' });
      f.pair((s) => {
        const sd = s > 0 ? 'L' : 'R';
        f.ball([0.024, 0.024, 0.022], [s * 0.022, 0.07, 0.025], { color: g, parent: 'head' })
          .ball([0.014, 0.016, 0.01], [s * 0.025, 0.074, 0.034], { color: '#c8a020', eye: true, parent: 'head', noInk: true })
          .ball([0.006, 0.012, 0.006], [s * 0.026, 0.074, 0.039], { color: '#1d1a17', eye: true, parent: 'head', noInk: true })
          .rod([s * 0.025, 0.03, 0.025], [s * 0.03, 0.004, 0.035], 0.01, g, { name: 'legF' + sd, parent: 'body', pivot: [s * 0.025, 0.03, 0.025] })
          .ball([0.016, 0.006, 0.016], [s * 0.032, 0.003, 0.04], { color: g, parent: 'legF' + sd })
          .ball([0.022, 0.03, 0.055], [s * 0.036, 0.018, -0.01], { color: g, rot: [-10, 0, 0], name: 'legB' + sd, parent: 'body', pivot: [s * 0.03, 0.03, -0.02] })
          .ball([0.022, 0.006, 0.04], [s * 0.044, 0.003, 0.02], { color: g, parent: 'legB' + sd })
          .ball([0.012, 0.004, 0.012], [s * 0.015, 0.054, -0.02], { color: d, noInk: true, parent: 'body' });
      });
      return f.done();
    })(),
      [A.par(A.pose('sac', { scale: 1, dur: 0.25 }), say('Ribbit!', 1.4)), A.pose('sac', { scale: 0, dur: 0.2 }), A.pose('sac', { scale: 1, dur: 0.25 }), A.pose('sac', { scale: 0, dur: 0.2 })],
      [A.par(A.anim('hop', 2), say('Croak!', 1.2))]),
  ),
  // Real size wins over the vocabulary's 0.15 m height: that is its length; a 0.2 m gecko is 2 cm high.
  e('gecko', 'wild', 'reptiles', () =>
    act(RK('gecko', { L: 0.2, bf: 0.32, tf: 0.48, hf: 0.17, w: 0.13, h: 0.075, c: '#f0c860', belly: '#f8ecd0', leg: 0.16, lw: 0.035, snout: 'lizard', cl: 0.025, ek: 1.7, eye: '#c8a050' }, (f, d) => {
      let r = 9;
      const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 26; i++) {
        const zz = d.zt + d.o.L * 0.15 + rnd() * (d.z1 - d.zt - d.o.L * 0.15), side = i % 2 ? 1 : -1, onTail = zz < d.z0;
        f.ball(d.o.L * 0.018, [side * d.bw * 0.25 * rnd(), d.y0 + d.bh * (onTail ? 0.25 : 0.45), zz], { color: '#5a4030', parent: onTail ? 'tail' : 'body', noInk: true });
      }
    }),
      [A.par(ps('head', [-10, 25, 0], 0.3), say('Gek-ko!', 1.4)), A.wait(0.6), rest('head')],
      [A.par(A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'run' }), say('!', 1))]),
  ),
  e('german shepherd', 'pets', 'dog breeds', () =>
    actF(QK('german shepherd', { c: '#c8843a', H: 0.62, L: 0.7, D: 0.3, W: 0.26, tuck: 0.35, rump: 0.9, neck: { l: 0.2, w: 0.15, lean: 36 }, head: { l: 0.19, w: 0.15, h: 0.14 }, muz: { l: 0.13, w: 0.07, h: 0.075, c: BK, drop: 0.14 }, ear: { k: 'prick', s: 0.12, c: '#3a2a20' }, leg: { w: 0.055 }, tail: { k: 'bushy', l: 0.42, w: 0.09, a: 158, c: '#5a3a20' } }, back(BK, 0.12, 0.82), faceQ('#2a2018', 0.75)), (f) => [alert('Woof!'), [...bark('Woof! Woof!', false)], sitQ(f)]),
  ),
  e('giraffe', 'wild', 'savanna', () =>
    act(QK('giraffe', QGIR, ...girMarks(), limbsQ(1.9)), [A.par(ps('neck', [-8, 0, 0], 0.6), A.pose('tongue', { scale: 1, dur: 0.4 }), say('Munch munch.', 1.8)), A.wait(1), A.par(A.pose('tongue', { scale: 0, dur: 0.3 }), rest('neck'))], [A.par(ps('legFL', [0, 0, 18], 0.8), ps('legFR', [0, 0, -18], 0.8), ps('neck', [95, 0, 0], 1.2), ps('head', [30, 0, 0], 1.2)), A.par(A.effect('water_spray', { dur: 1 }), say('Slurp...', 1.4)), A.wait(0.8), rest('legFL', 'legFR', 'neck', 'head')]),
  ),
  e('giraffe calf', 'wild', 'savanna', () =>
    act(QK('giraffe calf', { ...grow(QGIR, 0.38, 1.3, 1.1), neck: { l: 2.2 * 0.38, w: 0.3 * 0.38, lean: 22, base: 0.62 * 0.3 } }, ...girMarks(0.38), limbsQ(1.8)), [A.par(A.anim('hop'), say('Mmm!', 1.2))], graze('Munch.')),
  ),
  e('goat', 'farm', 'goats', () =>
    act(QK('goat', { c: '#f0ece4', H: 0.75, L: 0.78, D: 0.36, W: 0.3, tuck: 0.25, neck: { l: 0.25, w: 0.14, lean: 30 }, head: { l: 0.24, w: 0.14, h: 0.15 }, muz: { l: 0.12, w: 0.085, h: 0.09, c: '#e8d8d0', drop: 0.18 }, eye: { c: '#a87a2a' }, ear: { k: 'side', s: 0.13, in: '#e8c8c0' }, leg: { w: 0.05, hoof: '#4a4440' }, tail: { k: 'stub', l: 0.1, w: 0.05, a: 40 } }, hornsQ('#8a7a6a', 0.3, 'back', 0.22), (f, d) => f.cone([d.q.muz.w * 0.5, d.q.head.h * 0.6, d.q.muz.w * 0.4], add3(d.mz, [0, -d.q.muz.h * 0.75, -d.q.muz.l * 0.1]), { color: '#e0dcd4', rot: [180, 0, 0], parent: 'jaw' })),
      speak('Baa-aa-aa!', 24, 1.8),
      [A.par(ps('neck', [30, 0, 0], 0.25), ps('head', [25, 0, 0], 0.25)), A.par(A.anim('shake'), say('Bonk!', 1.2)), rest('neck', 'head')],
      graze('Munch munch.')),
  ),
  e('golden retriever', 'pets', 'dog breeds', () =>
    actF(QK('golden retriever', { c: '#d9a04e', H: 0.58, L: 0.66, D: 0.29, W: 0.25, tuck: 0.25, belly: '#e8c07a', neck: { l: 0.18, w: 0.15, lean: 38 }, head: { l: 0.19, w: 0.15, h: 0.14 }, muz: { l: 0.12, w: 0.09, h: 0.09, drop: 0.15 }, ear: { k: 'drop', s: 0.12, c: '#c88a3a' }, leg: { w: 0.058 }, tail: { k: 'bushy', l: 0.42, w: 0.09, a: 118, c: '#e0aa58' } }, ruffQ('#e0aa58', 0.85)), (f) => [fetchIt('ball', 'Woof!'), sitQ(f, 'Arf!'), wagHard('Woof! Woof!')]),
  ),
  e('goldfish', 'sea', 'pond fish', () =>
    act(FK('goldfish', { L: 0.12, c: '#f08a1a', fin: '#f6a840', h: 0.48, w: 0.2, shape: 'round', tail: 'fan', tl: 0.34, dorsal: 0.5, dz: 0.5, dl: 0.3, anal: 0.25, pec: 0.8, eye: 1.2 }), [ps('jaw', [30, 0, 0], 0.15), A.par(ps('jaw', [0, 0, 0], 0.15), say('Blub!', 1)), ps('jaw', [30, 0, 0], 0.15), A.par(ps('jaw', [0, 0, 0], 0.15), say('Blub blub!', 1.2))], swimSpin('...')),
  ),
  e('goose', 'aviary', 'water birds', () =>
    act(AVK('goose', { H: 0.85, c: '#8a7a68', belly: '#e8e2d8', wing: '#6a5a4a', tip: '#4a3e34', tail: '#1e1e1e', head: '#1e1e1e', beak: '#1e1e1e', legs: '#2a2a2a', len: 0.5, fat: 0.6, up: 8, neck: 0.25, hk: 0.6, bl: 0.07, bk: 'flat', leg: 0.14, lw: 1.3, tl: 0.08, tk: 'stub', wl: 0.9 }, avHead(WH, [1.0, 0.6, 0.55], [0, -0.35, 0.15]), avPatch('#e8e2d8', [0.7, 0.3, 0.3], [0, -0.3, -0.5])), spread('HONK! Hssss!', 70, 1.2), [A.par(A.anim('wobble', 2), say('Honk honk!', 1.4))]),
  ),
  e('gopher', 'wild', 'prairie', () =>
    act(QK('gopher', { c: '#9a7552', H: 0.08, L: 0.16, D: 0.07, W: 0.08, tuck: 0, belly: '#c8a888', neck: { l: 0.012, w: 0.05, lean: 50 }, head: { l: 0.05, w: 0.052, h: 0.045 }, muz: { l: 0.02, w: 0.03, h: 0.025, c: '#c8a888', drop: 0.15 }, nose: '#e09a9a', eye: { k: 0.7 }, ear: { k: 'tiny', s: 0.008 }, leg: { w: 0.014, paw: '#e0c0a8' }, tail: { k: 'long', l: 0.06, w: 0.008, a: 120, c: '#d8b8a0' } }, teethQ('#e8c040'), onHead('#a8835e', [0.5, 0.5, 0.5], [0.35, -0.2, 0.15], { mirror: true, ink: true })), [A.par(A.anim('hop', 2), say('Squeak!', 1.2))], dig('Scritch scratch!')),
  ),
  e('gorilla', 'wild', 'jungle', () =>
    act(ape('gorilla', 1.75, '#24221f', '#4e4642', 1.65, (p, d) => p.add(P('torso', 'ball', [d.tw * 0.95, d.torsoH * 0.7, d.td * 0.4], [0, d.torsoH * 0.55, -d.td * 0.32], '#9a9894', { noInk: true, layer: -1 })), (p, d) => p.add(P('head', 'ball', [d.headW * 0.5, d.headH * 0.45, d.headD * 0.6], [0, d.headY + d.headH * 0.42, -d.headD * 0.1], '#24221f', { layer: -1 }))),
      [A.par(A.anim('clap', 2), say('Hoo-hoo-hoo! Thump thump!', 2.4))],
      [A.par(A.anim('arms_up'), say('GRRRAAH!', 1.6))]),
  ),
  e('grasshopper', 'bugs', 'hoppers', () =>
    act(bug('grasshopper', { length: 0.05, color: '#6aa83a', extras: bx(partC('abdomen', '#6aa83a', [0.8, 0.8, 1.3]), fold('#8ab85a', 1.2), hindLegs('#5a9a30', 1.1), feelers(1.0)) }), [A.par(A.move('self', { rel: 'away', of: 'player', dist: 'near' }, { speed: 'run', style: 'hop' }), say('Boing!', 1.2))], [A.par(A.anim('shake', 2), say('Chirr-chirr!', 1.6))]),
  ),
  // Real size wins over the vocabulary's 12 m height: that is its length; a 13 m gray whale is under 3 m deep.
  e('gray whale', 'sea', 'whales', () =>
    act(FK('gray whale', { L: 13, c: '#6a747c', belly: '#8a949c', fin: '#5e686e', h: 0.17, w: 0.17, shape: 'whale', tail: 'flukes', tl: 0.2, dorsal: 0, pec: 0.9, pz: 0.74, eye: 0.15, ez: 0.86 }, fSpots('#c8ccd0', 40, 0.35, { lo: -40, hi: 85 }), fSpots('#e8e4d8', 12, 0.25, { t0: 0.75, t1: 0.95, lo: 20, hi: 85, seed: 5 }), (f, d) => {
      for (let i = 0; i < 8; i++) {
        const t = 0.3 - i * 0.03, [, h, cy] = d.sec(t);
        f.ball([d.W * 0.12, d.H * 0.06, d.Lb * 0.02], [0, cy + h * 0.98, d.z(t)], { color: '#5e686e', parent: 'body' });
      }
    }), [A.par(A.effect('water_spray', { dur: 1.6 }), say('Pffoosh!', 1.6))], [A.par(A.anim('hop'), A.effect('water_spray', { dur: 1.4 }), say('SPLASH!', 1.4))]),
  ),
  e('great dane', 'pets', 'dog breeds', () =>
    actF(QK('great dane', { c: '#d8b070', H: 0.8, L: 0.82, D: 0.38, W: 0.28, tuck: 0.4, neck: { l: 0.26, w: 0.17, lean: 30 }, head: { l: 0.26, w: 0.15, h: 0.17 }, muz: { l: 0.16, w: 0.11, h: 0.13, c: BK, drop: 0.12 }, eye: { k: 0.8 }, ear: { k: 'drop', s: 0.12 }, leg: { w: 0.07 }, tail: { k: 'long', l: 0.5, w: 0.05, a: 145 } }, faceQ('#2a2018', 0.7)), (f) => [bark('WOOF!', false), sitQ(f, 'Woof.')]),
  ),
  e('great white shark', 'sea', 'sharks', () =>
    act(FK('great white shark', { L: 5, c: '#7d8a96', belly: '#f2f0ea', h: 0.22, w: 0.2, shape: 'shark', tail: 'shark', tl: 0.28, dorsal: 0.75, dz: 0.55, dl: 0.12, pec: 1.6, pz: 0.66, eye: 0.35, ez: 0.9, mouth: '#f2f0ea' }, sharkFace()),
      [A.par(ps('jaw', [30, 0, 0], 0.25), say('CHOMP!', 1.2)), A.wait(0.3), ps('jaw', [0, 0, 0], 0.1)],
      [A.par(A.anim('spin'), say('...', 1))]),
  ),
  e('greyhound', 'pets', 'dog breeds', () =>
    actF(QK('greyhound', { c: '#8e8c94', H: 0.73, L: 0.72, D: 0.32, W: 0.2, tuck: 0.95, rump: 1.0, belly: '#a8a6ae', neck: { l: 0.24, w: 0.1, lean: 36 }, head: { l: 0.2, w: 0.1, h: 0.1 }, muz: { l: 0.14, w: 0.05, h: 0.05, drop: 0.08 }, ear: { k: 'fold', s: 0.06 }, leg: { w: 0.04 }, tail: { k: 'whip', l: 0.5, w: 0.03, a: 160 } }), (f) => [[A.par(A.move('self', { rel: 'random' }, { speed: 'run' }), say('!', 1)), ...wagHard('Arf!', 1)], sitQ(f, 'Woof.')]),
  ),
  e('guide dog', 'pets', 'working dogs', () =>
    actF(QK('guide dog', { c: '#e3c27e', H: 0.57, L: 0.66, D: 0.28, W: 0.25, tuck: 0.3, neck: { l: 0.17, w: 0.15, lean: 38 }, head: { l: 0.19, w: 0.15, h: 0.14 }, muz: { l: 0.12, w: 0.09, h: 0.09 }, ear: { k: 'drop', s: 0.11 }, leg: { w: 0.058 }, tail: { k: 'long', l: 0.4, w: 0.055, a: 115 } }, (f, d) => {
      const { H, D, L, W } = d.q;
      for (const t of [0.78, 0.6]) {
        const [w, h, cy] = d.sec(t);
        f.loft([w * 2.12, h * 2.12, L * 0.05], [0, cy, d.z(t)], [[0, 1, 1, 0], [1, 1, 1, 0]], { color: '#e8e8e8', parent: 'body', noInk: true });
        f.loft([w * 2.1, h * 2.1, L * 0.035], [0, cy, d.z(t)], [[0, 1, 1, 0], [1, 1, 1, 0]], { color: '#2a2a2e', parent: 'body' });
      }
      f.arc([W * 0.9, 0.36, 0.022], [0, H + 0.14, L * 0.12], { color: '#2a2a2e', rot: [0, 90, 0], arc: 180, tube: 0.12, parent: 'body', edge: 'sharp' })
        .box([0.14, 0.03, 0.03], [0, H + 0.31, L * 0.12], { color: '#d8b040', parent: 'body', edge: 'sharp', round: 0.6 })
        .label('GUIDE DOG', [0.16, 0.06], [W * 0.52, H - D * 0.25, L * 0.22], { color: '#f0d040', rot: [0, 90, 0], parent: 'body', depth: 0.004 })
        .label('GUIDE DOG', [0.16, 0.06], [-W * 0.52, H - D * 0.25, L * 0.22], { color: '#f0d040', rot: [0, -90, 0], parent: 'body', depth: 0.004 });
      void D;
    }), (f) => [sitQ(f, 'Woof.'), [A.par(A.move('self', { rel: 'near', of: 'player', dist: 'close' }, { speed: 'walk' }), A.anim('wag'))]]),
  ),
  e('guinea pig', 'pets', 'small pets', () =>
    act(QK('guinea pig', { c: '#f4efe6', H: 0.11, L: 0.22, D: 0.1, W: 0.13, tuck: 0, rump: 1.05, neck: { l: 0.015, w: 0.08, lean: 60 }, head: { l: 0.075, w: 0.07, h: 0.065 }, muz: { l: 0.025, w: 0.04, h: 0.03, drop: 0.2 }, nose: '#c87a7a', eye: { k: 1.1 }, ear: { k: 'round', s: 0.022, in: '#e8b8b0' }, leg: { w: 0.018, paw: '#e8c8b8' }, tail: { k: 'stub', l: 0.01, w: 0.01, a: 120 } }, patch('#d8843a', 0.02, 0.35), back(BK, 0.5, 0.95, 1.06), onHead('#d8843a', [0.6, 0.7, 0.8], [0.25, 0.15, -0.05])), [A.par(A.anim('hop', 2), say('Wheek wheek!', 1.6))], gnaw('lettuce', 'Munch munch!')),
  ),
  // Real size (5 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('guppy', 'sea', 'tropical fish', () =>
    act(FK('guppy', { L: 0.05, c: '#9aa8a0', fin: '#f06a3a', h: 0.26, w: 0.12, tail: 'fan', tl: 0.38, dorsal: 0.6, dz: 0.4, dl: 0.18, pec: 0.6, eye: 1.3 }, fSpots('#3a7ad0', 4, 0.0035, { t0: 0.2, t1: 0.5 }), fSpots('#f0a030', 4, 0.0035, { t0: 0.3, t1: 0.6, seed: 8 })), swimSpin('Blub!'), [A.par(A.anim('hop'), say('!', 1))]),
  ),
  e('hammerhead (shark)', 'sea', 'sharks', () =>
    act(FK('hammerhead (shark)', { L: 3.8, c: '#8a96a0', belly: '#eef0ea', h: 0.18, w: 0.18, shape: 'shark', tail: 'shark', tl: 0.3, dorsal: 1.05, dz: 0.56, dl: 0.12, sw: 0.4, pec: 1.3, pz: 0.66, eye: 0.3, ez: 0.92, mouth: '#eef0ea' }, (f, d) => {
      const [w, h, cy] = d.sec(0.95), L = d.o.L;
      f.loft([L * 0.28, h * 0.6, L * 0.06], [0, cy + h * 0.1, d.z(0.99)], [[0, 0.9, 0.8, 0], [0.5, 1, 1, 0], [1, 0.85, 0.7, 0]], { color: d.o.c, boxy: 0.3, parent: 'body' });
      f.pair((s) => f.ball(L * 0.014, [s * L * 0.135, cy + h * 0.15, d.z(0.99)], { color: '#1d1a17', eye: true, parent: 'body', noInk: true }));
      for (let i = 0; i < 5; i++) f.pair((s) => f.ball([d.W * 0.01, h * 0.5, d.Lb * 0.008], [s * w * 1.9, cy - h * 0.05, d.z(0.86 - i * 0.022)], { color: '#5a646c', parent: 'body', noInk: true }));
    }),
      [A.par(ps('jaw', [24, 0, 0], 0.25), say('Snap!', 1.2)), A.wait(0.3), ps('jaw', [0, 0, 0], 0.1)],
      swish('Swish!', 30)),
  ),
  e('hamster', 'pets', 'small pets', () =>
    act(QK('hamster', { c: '#d9a05a', H: 0.07, L: 0.11, D: 0.07, W: 0.085, tuck: 0, rump: 1.05, belly: '#f6efe6', neck: { l: 0.01, w: 0.05, lean: 40 }, head: { l: 0.05, w: 0.055, h: 0.048 }, muz: { l: 0.018, w: 0.028, h: 0.022, c: '#f6efe6', drop: 0.2 }, nose: '#e89a9a', eye: { k: 1.3 }, ear: { k: 'round', s: 0.018, in: '#f0b0b0' }, leg: { w: 0.012, paw: '#f0d0c0' }, tail: { k: 'stub', l: 0.008, w: 0.008, a: 110 } }, (f, d) => f.pair((s) => f.ball([d.q.head.w * 0.45, d.q.head.h * 0.55, d.q.head.l * 0.55], add3(d.sk, [s * d.q.head.w * 0.4, -d.q.head.h * 0.22, d.q.head.l * 0.12]), { color: '#f6efe6', name: s > 0 ? 'cheekL' : 'cheekR', parent: 'head' }))),
      [A.spawn('snack', 'seed', { rel: 'front', of: 'self', dist: 'close' }), A.wait(0.3), A.remove('snack', 'pop'), A.par(A.pose('cheekL', { scale: 1.7, dur: 0.3 }), A.pose('cheekR', { scale: 1.7, dur: 0.3 }), say('Nom nom!', 1.4)), A.wait(1.2), A.par(A.pose('cheekL', { scale: 1, dur: 0.4 }), A.pose('cheekR', { scale: 1, dur: 0.4 }))],
      [A.par(A.anim('hop', 2), say('Squeak!', 1.2))]),
  ),
  e('hare', 'wild', 'prairie', () =>
    act(bun('hare', { c: '#a07a50', H: 0.32, ear: 0.15, earC: '#a07a50', earIn: '#e0c0a0', tip: '#1e1a18', belly: '#e8dcc8', tail: '#f4f0ea', eye: '#c88a2a', legs: 1.3, head: 0.95 }),
      [A.par(A.move('self', { rel: 'away', of: 'player', dist: 'near' }, { speed: 'run', style: 'hop' }), say('!', 1))],
      [A.par(ps('earL', [-20, 0, 15], 0.25), ps('earR', [-20, 0, -15], 0.25), ps('head', [-10, 25, 0], 0.3), say('!?', 1.2)), A.wait(1), rest('earL', 'earR', 'head')]),
  ),
  e('hawk', 'aviary', 'birds of prey', () =>
    act(AVK('hawk', { H: 0.52, c: '#7a5032', belly: '#f2e6d0', wing: '#5a3a22', tip: '#3a2414', tail: '#b8502a', head: '#6a4428', beak: '#3a3a3a', legs: '#f2c02a', len: 0.6, fat: 0.55, up: 40, bl: 0.08, bk: 'hook', leg: 0.2, lw: 1.4, tl: 0.3, tk: 'fan', wl: 1.05, eye: '#5a3010' }, avPatch('#8a5a32', [0.9, 0.12, 0.3], [0, -0.15, 0.1]), avHead('#f2c02a', [0.5, 0.45, 0.2], [0.6, 0.18, 0.42], { mirror: true })), spread('Kee-eeeer!', 85, 1.4), flyUp('Kree!')),
  ),
  e('hedgehog', 'wild', 'forest', () =>
    act(QK('hedgehog', { c: '#d8b890', H: 0.11, L: 0.2, D: 0.1, W: 0.14, tuck: 0, rump: 1.05, neck: { l: 0.02, w: 0.06, lean: 60 }, head: { l: 0.06, w: 0.055, h: 0.05 }, muz: { l: 0.035, w: 0.025, h: 0.022, drop: 0.25 }, nose: '#1d1a17', eye: { k: 1.1 }, ear: { k: 'round', s: 0.016 }, leg: { w: 0.014, paw: '#a8886a' }, tail: { k: 'stub', l: 0.01, w: 0.01, a: 110 } }, back('#6a4a32', 0.0, 0.92, 1.12), (f, d) => {
      let r = 3;
      const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 70; i++) {
        const t = 0.02 + 0.9 * rnd(), th = (10 + 170 * rnd()) * (Math.PI / 180), [w, h, cy] = d.sec(t), nx = Math.cos(th), ny = Math.sin(th);
        f.cone([0.005, 0.03, 0.005], [nx * w * 1.1, cy + ny * h * 1.12, d.z(t)], { color: i % 3 ? '#4a3424' : '#e8dcc8', rot: aim([nx, ny, -0.7]), parent: 'body' });
      }
    }),
      [A.par(ps('neck', [70, 0, 0], 0.4), ps('head', [40, 0, 0], 0.4), ps('legFL', [-50, 0, 0], 0.4), ps('legFR', [-50, 0, 0], 0.4), A.anim('shake'), say('Huff! Puff!', 1.6)), A.wait(1.2), rest('neck', 'head', 'legFL', 'legFR')],
      sniff('Snuffle snuffle...')),
  ),
  e('heron', 'aviary', 'water birds', () =>
    act(AVK('heron', { H: 1.0, c: '#8a98a8', belly: '#d8dce2', wing: '#7a8a9a', tip: '#2a2a32', tail: '#7a8a9a', head: '#e4e6ea', beak: '#e8c040', legs: '#c8a860', len: 0.34, fat: 0.55, up: 14, neck: 0.28, hk: 0.45, bl: 0.17, bk: 'dagger', leg: 0.42, lw: 0.9, tl: 0.1, tk: 'stub', wl: 1.0, eye: '#e8c040' }, avHead('#1e1e24', [0.4, 0.3, 1.8], [0.3, 0.55, -0.6], { mirror: true }), (f, d) => f.rod(add3(d.hc, [0, d.hr * 0.6, -d.hr * 0.6]), add3(d.hc, [0, d.hr * 0.2, -d.hr * 2.6]), d.hr * 0.12, '#1e1e24', { parent: 'head' })),
      [A.par(ps('head', [55, 0, 0], 0.12), say('Fraaank!', 1.4)), A.wait(0.4), rest('head')],
      spread('Krrak!', 60, 1)),
  ),
  e('hippopotamus', 'wild', 'savanna', () =>
    act(QK('hippopotamus', { c: '#8c7a86', H: 1.5, L: 2.8, D: 1.15, W: 1.4, tuck: 0, rump: 0.98, belly: '#c8a0a8', neck: { l: 0.2, w: 0.95, lean: 72 }, head: { l: 0.62, w: 0.68, h: 0.55 }, muz: { l: 0.52, w: 0.78, h: 0.48, c: '#a8909a', drop: 0.12, jaw: '#c8a0a8' }, eye: { k: 0.6, up: 0.4 }, ear: { k: 'round', s: 0.1, in: '#c8a0a8' }, leg: { w: 0.32, k: 1.2, paw: '#6a5a66' }, tail: { k: 'flat', l: 0.4, w: 0.12, a: 150 } }, (f, d) => {
      const { l: ml, w: mw, h: mh } = d.q.muz;
      f.pair((s) => f.cone([mw * 0.09, mh * 0.42, mw * 0.09], add3(d.mz, [s * mw * 0.36, -mh * 0.22, ml * 0.25]), { color: '#fffaf0', parent: 'jaw' }).ball([mw * 0.12, mh * 0.12, ml * 0.1], add3(d.mz, [s * mw * 0.18, mh * 0.44, ml * 0.3]), { color: '#5a4a5a', parent: 'head', noInk: true }));
    }),
      [A.par(ps('neck', [-25, 0, 0], 0.6), ps('jaw', [62, 0, 0], 0.7), say('HRRUMPH!', 2)), A.wait(1.4), rest('neck', 'jaw')],
      [A.par(A.anim('shake'), A.effect('water_spray', { dur: 1.4 }), say('Splosh!', 1.4))]),
  ),
  e('honey badger', 'wild', 'savanna', () =>
    act(QK('honey badger', { c: '#1f1d1c', H: 0.28, L: 0.62, D: 0.24, W: 0.28, tuck: 0.05, neck: { l: 0.06, w: 0.15, lean: 60 }, head: { l: 0.15, w: 0.13, h: 0.11 }, muz: { l: 0.06, w: 0.065, h: 0.06, drop: 0.12 }, ear: { k: 'tiny', s: 0.02 }, leg: { w: 0.055, k: 1.1, paw: '#3a3634' }, tail: { k: 'long', l: 0.2, w: 0.05, a: 60 } }, back('#d8d6d0', 0.02, 1.0, 1.05), onHead('#d8d6d0', [1.03, 0.6, 0.9], [0, 0.35, 0])), roar('Hsss! Grrr!', 30), dig('Grrr!')),
  ),
  e('hooves', 'farm', 'animal parts', () =>
    act((() => {
      const f = m('hooves');
      f.pair((s) => {
        const x = s * 0.08, n = s > 0 ? 'hoofL' : 'hoofR';
        f.cyl([0.055, 0.16, 0.055], [x, 0.18, -0.01], { color: '#8a6a4a', name: n })
          .ball([0.075, 0.07, 0.08], [x, 0.09, 0], { color: '#8a6a4a', parent: n })
          .ball([0.03, 0.035, 0.03], [x, 0.075, -0.045], { color: '#3a3430', parent: n });
        for (const t of [1, -1]) f.cyl([0.038, 0.065, 0.085], [x + t * 0.021, 0.034, 0.012], { color: '#3a3430', taper: 0.75, parent: n, edge: 'sharp', round: 0.2 }).cone([0.036, 0.03, 0.02], [x + t * 0.021, 0.02, 0.058], { color: '#3a3430', rot: [90, 0, 0], parent: n });
      });
      return f.done();
    })(),
      [A.pose('hoofL', { move: [0, 0.04, 0], dur: 0.15 }), A.par(A.pose('hoofL', { move: [0, 0, 0], dur: 0.12 }), say('Clip!', 0.8)), A.pose('hoofR', { move: [0, 0.04, 0], dur: 0.15 }), A.par(A.pose('hoofR', { move: [0, 0, 0], dur: 0.12 }), say('Clop!', 0.8)), A.pose('hoofL', { move: [0, 0.04, 0], dur: 0.15 }), A.pose('hoofL', { move: [0, 0, 0], dur: 0.12 })],
      [A.par(A.anim('hop'), A.effect('dust', { dur: 0.8 }), say('Clop clop!', 1.2))]),
  ),
  e('hornet', 'bugs', 'bees and wasps', () =>
    act(bug('hornet', { length: 0.035, color: '#d89a20', stripes: '#5a2a10', wings: 'clear', wingColor: '#f0e2c0', extras: bx(partC('head', '#e0a040', [1.2, 1.1, 1.1]), partC('body', '#6a3418')) }), [A.par(A.anim('shake', 2), say('BZZZZZ!', 1.6))], buzz('Bzzz!')),
  ),
  // Real size (2 cm long); the vocabulary's 0.1 m is a display-case size, and small things are not enlarged.
  e('horsefly', 'bugs', 'flies', () =>
    act(bug('horsefly', { length: 0.022, color: '#5a5848', wings: 'clear', extras: bx(bugEyes('#3a8a5a', 2.3), partC('abdomen', '#6a6250', [1.1, 0.8, 1.1])) }), buzz('Bzzzz!'), [A.par(A.anim('hop'), say('Bite!', 1))]),
  ),
  // Real size wins over the vocabulary's 0.5 m height: that is its length with the tail; it is under 0.1 m high.
  e('horseshoe crab', 'sea', 'shellfish', () =>
    act((() => {
      const c = '#6a5a3a', dk = '#4e4028';
      const f = m('horseshoe crab', { view: 'side', rig: 'bug' });
      f.dome([0.3, 0.09, 0.26], [0, 0.0, 0.06], { color: c, name: 'body' })
        .ball([0.04, 0.03, 0.2], [0, 0.07, 0.07], { color: dk, parent: 'body' })
        .pair((s) => f.ball([0.03, 0.02, 0.05], [s * 0.075, 0.06, 0.09], { color: '#2a2018', eye: true, parent: 'body' }).ball([0.02, 0.025, 0.2], [s * 0.1, 0.05, 0.05], { color: dk, parent: 'body', rot: [0, s * 8, 0] }))
        .dome([0.2, 0.06, 0.15], [0, 0.0, -0.13], { color: dk, name: 'abdomen', parent: 'body', pivot: [0, 0.02, -0.07] })
        .pair((s) => f.each(4, (i) => f.cone([0.012, 0.03, 0.012], [s * 0.098, 0.015, -0.09 - i * 0.03], { color: dk, rot: [0, 0, -s * 75], parent: 'abdomen' })))
        .rod([0, 0.015, -0.2], [0, 0.04, -0.46], 0.022, dk, { name: 'tail', parent: 'abdomen', pivot: [0, 0.015, -0.2] });
      return f.done();
    })(),
      [A.par(ps('tail', [-30, 0, 0], 0.3), say('!', 1)), ps('tail', [20, 0, 0], 0.3), rest('tail')],
      [A.par(A.move('self', { rel: 'away', of: 'player', dist: 'close' }, { speed: 'walk' }), say('...', 1))]),
  ),
  e('hound', 'pets', 'dog breeds', () =>
    act(QK('hound', { c: '#2a2420', H: 0.62, L: 0.68, D: 0.29, W: 0.24, tuck: 0.35, neck: { l: 0.19, w: 0.14, lean: 40 }, head: { l: 0.21, w: 0.14, h: 0.14, c: '#2a2420' }, muz: { l: 0.13, w: 0.09, h: 0.1, c: '#a8642e', drop: 0.16 }, ear: { k: 'drop', s: 0.22 }, leg: { w: 0.055, low: '#a8642e' }, tail: { k: 'long', l: 0.42, w: 0.04, a: 40 } }, onHead('#a8642e', [0.2, 0.15, 0.15], [0.22, 0.32, 0.3], { mirror: true }), chest('#a8642e')), howl('Aroooo!', 32), sniff('Sniff sniff... sniff!')),
  ),
  e('hummingbird', 'aviary', 'tropical birds', () =>
    act(AVK('hummingbird', { H: 0.08, c: '#2e9a5a', belly: '#d8e8d0', wing: '#3a6a5a', tip: '#2a4a40', tail: '#2a6a4a', beak: '#2a2a2a', legs: '#2a2a2a', len: 0.62, fat: 0.5, up: 30, hk: 0.9, bl: 0.32, bk: 'needle', leg: 0.12, lw: 0.6, tl: 0.3, tk: 'fork', wl: 1.1 }, avHead('#e02a4a', [1.1, 0.7, 1.0], [0, -0.55, 0.4])), [A.par(A.anim('flap', 4), A.anim('hop', 2), say('Hmmmmmm!', 1.6))], sing('Chip! Chip!')),
  ),
  e('humpback whale', 'sea', 'whales', () =>
    act(FK('humpback whale', { L: 14, c: '#2e3640', belly: '#d8dce0', fin: '#2e3640', pecC: '#dfe4e8', h: 0.2, w: 0.2, shape: 'whale', tail: 'flukes', tl: 0.22, dorsal: 0.2, dz: 0.3, dl: 0.05, pec: 2.4, pz: 0.7, eye: 0.15, ez: 0.84 }, grooves('#9aa0a8', 9), (f, d) => {
      for (let i = 0; i < 9; i++) f.ball(d.W * 0.06, [((i % 3) - 1) * d.W * 0.15, d.sec(0.95)[2] + d.sec(0.95)[1] * 0.85, d.z(0.9 + Math.floor(i / 3) * 0.03)], { color: '#4a525c', parent: 'body' });
    }),
      [A.par(A.anim('hop'), A.anim('spin'), A.effect('water_spray', { dur: 1.6 }), say('SPLASH!', 1.6))],
      [A.par(say('Wooo-ooo-eee...', 2.5), A.effect('water_spray', { dur: 1.2 })), ...swish('', 12).slice(0, 2), rest('tail')]),
  ),
  e('husky', 'pets', 'dog breeds', () =>
    act(QK('husky', { c: '#6a6e78', H: 0.56, L: 0.6, D: 0.26, W: 0.24, tuck: 0.3, belly: WH, neck: { l: 0.16, w: 0.14, lean: 36 }, head: { l: 0.17, w: 0.15, h: 0.14 }, muz: { l: 0.1, w: 0.075, h: 0.07, c: WH, drop: 0.15 }, eye: { c: '#5ab0e8', k: 1.1 }, ear: { k: 'prick', s: 0.1, in: '#f0e0dc' }, leg: { w: 0.05, low: WH }, tail: { k: 'bushy', l: 0.36, w: 0.1, a: 40, tip: WH } }, chest(WH), faceQ(WH, 0.85), onHead('#6a6e78', [0.4, 0.4, 0.5], [0, 0.32, 0.1])), howl('Awoooooo!', 42), [A.par(ps('head', [0, 0, 20], 0.3), ps('jaw', [20, 0, 0], 0.2), say('Arr-woo-woo-woo!', 2)), ps('jaw', [5, 0, 0], 0.15), ps('jaw', [22, 0, 0], 0.15), A.wait(0.6), rest('head', 'jaw')]),
  ),
  e('hyena', 'wild', 'savanna', () =>
    act(QK('hyena', QHYENA, ...hyenaMarks()), [A.par(ps('head', [-10, 0, 0], 0.2), say('Hee-hee-hee-hee!', 2)), ps('jaw', [26, 0, 0], 0.1), ps('jaw', [6, 0, 0], 0.1), ps('jaw', [26, 0, 0], 0.1), ps('jaw', [6, 0, 0], 0.1), ps('jaw', [26, 0, 0], 0.1), rest('jaw', 'head')], howl('Whoo-oop!', 25)),
  ),
  e('hyena cub', 'wild', 'savanna', () =>
    act(QK('hyena cub', { ...grow(QHYENA, 0.42, 1.35, 0.9), c: '#4a3a30', rump: 0.9, muz: { l: 0.06, w: 0.06, h: 0.06, c: '#2a2018', drop: 0.15 } }), [A.par(A.anim('hop'), say('Hee-hee!', 1.4))], sniff('Sniff?')),
  ),
  // Real size wins over the vocabulary's 1.2 m height: that is its length; a 1.5 m iguana stands under 0.2 m.
  e('iguana', 'wild', 'reptiles', () =>
    act(RK('iguana', { L: 1.5, bf: 0.25, tf: 0.62, hf: 0.1, w: 0.1, h: 0.08, c: '#6aa84f', belly: '#a8d080', ridge: '#4a8a3a', leg: 0.12, lw: 0.018, snout: 'blunt', cl: 0.03, spines: 18, ek: 1.3, eye: '#c86a2a' }, (f, d) => f.ball([d.hw * 0.25, d.hh * 1.0, d.o.L * 0.07], [0, d.y0 - d.hh * 0.45, d.z1 + d.o.L * 0.04], { color: '#8ac860', parent: 'head' })),
      [ps('head', [-18, 0, 0], 0.15), ps('head', [6, 0, 0], 0.15), ps('head', [-18, 0, 0], 0.15), A.par(ps('head', [6, 0, 0], 0.15), say('!', 1)), rest('head')],
      swish('Whip!', 40)),
  ),
  e('inchworm', 'bugs', 'crawlers', () =>
    act((() => {
      const n = 11;
      const f = m('inchworm', { view: 'side', rig: 'bug' });
      f.ball(0.011, [0, 0.0055, -0.031], { color: '#7ac040', name: 'body' });
      f.each(n, (i) => {
        const t = i / (n - 1);
        f.ball(0.009, [0, 0.0045 + 0.024 * Math.sin(Math.PI * t), 0.028 - 0.056 * t], { color: i % 2 ? '#7ac040' : '#8ad04a', parent: 'body' });
      });
      f.ball(0.011, [0, 0.0055, 0.033], { color: '#6ab038', name: 'head', parent: 'body' }).pair((s) => f.ball(0.003, [s * 0.003, 0.008, 0.038], { color: '#1d1a17', eye: true, parent: 'head' }));
      return f.done();
    })(), [A.par(A.pose('body', { move: [0, 0, 0.02], dur: 1.4 }), say('Inch... inch...', 1.6)), A.pose('body', { move: [0, 0, 0], dur: 1.2 })], [A.par(A.anim('bounce'), say('!', 1))]),
  ),
  e('irish setter', 'pets', 'dog breeds', () =>
    act(QK('irish setter', { c: '#9a3a1a', H: 0.66, L: 0.7, D: 0.3, W: 0.24, tuck: 0.4, neck: { l: 0.21, w: 0.13, lean: 34 }, head: { l: 0.21, w: 0.12, h: 0.13 }, muz: { l: 0.13, w: 0.07, h: 0.075, drop: 0.12 }, eye: { c: '#4a2a14' }, ear: { k: 'drop', s: 0.17, c: '#8a3216' }, leg: { w: 0.05 }, tail: { k: 'bushy', l: 0.45, w: 0.07, a: 120, c: '#a8461e' } }, chest('#a8461e')),
      [A.par(ps('legFL', [-50, 0, 0], 0.4), ps('tail', [-30, 0, 0], 0.4), ps('neck', [-6, 0, 0], 0.4), ps('head', [6, 0, 0], 0.4), say('!', 1.2)), A.wait(1.8), rest('legFL', 'tail', 'neck', 'head')],
      bark('Woof!')),
  ),
  e('jack russel terrier', 'pets', 'dog breeds', () =>
    act(QK('jack russel terrier', { c: '#f6f2ea', H: 0.3, L: 0.32, D: 0.15, W: 0.14, tuck: 0.4, neck: { l: 0.09, w: 0.08, lean: 32 }, head: { l: 0.11, w: 0.1, h: 0.09, c: '#b8783a' }, muz: { l: 0.06, w: 0.05, h: 0.05, c: WH, drop: 0.14 }, ear: { k: 'fold', s: 0.05, c: '#8a5a2a' }, leg: { w: 0.032 }, tail: { k: 'stub', l: 0.08, w: 0.03, a: 15 } }, blazeQ(WH), spotsQ('#b8783a', 3, 0.06, { t0: 0.1, t1: 0.3, lo: 30, hi: 80 })), [A.par(A.anim('hop', 3), say('Yap! Yap! Yap!', 1.8))], bark('Arf!')),
  ),
  e('jackal', 'wild', 'savanna', () =>
    act(QK('jackal', { c: '#c89a5a', H: 0.45, L: 0.58, D: 0.21, W: 0.18, tuck: 0.4, belly: '#f2e6d0', neck: { l: 0.13, w: 0.1, lean: 38 }, head: { l: 0.14, w: 0.12, h: 0.1 }, muz: { l: 0.1, w: 0.045, h: 0.05, drop: 0.12 }, eye: { c: '#8a5a1a' }, ear: { k: 'prick', s: 0.11, in: '#f2e6d0' }, leg: { w: 0.036 }, tail: { k: 'bushy', l: 0.32, w: 0.08, a: 150, c: '#3a3028' } }, back('#3a3028', 0.15, 0.82)), howl('Yip-yip-yeeoww!', 38), sniff('Sniff...')),
  ),
  e('jaguar', 'wild', 'jungle', () =>
    act(QK('jaguar', { c: '#e3a23c', H: 0.7, L: 1.25, D: 0.4, W: 0.38, tuck: 0.3, rump: 1.02, belly: '#f4e6c8', neck: { l: 0.16, w: 0.24, lean: 52 }, head: { l: 0.26, w: 0.26, h: 0.22 }, muz: { l: 0.09, w: 0.13, h: 0.1, c: '#f2dcb0', drop: 0.2 }, nose: '#c87a6a', eye: { k: 0.9, c: '#c8a030' }, ear: { k: 'round', s: 0.07, in: '#2a2018' }, leg: { w: 0.1, k: 1.25 }, tail: { k: 'long', l: 0.7, w: 0.07, a: 150 } }, rosettes('#2a2018', '#c07a28', 34), onHead('#2a2018', [0.08, 0.08, 0.08], [0.25, 0.42, 0.1], { mirror: true })),
      roar('Huh-huh-huh... ROAR!', 38),
      stretch('Grrr...')),
  ),
  e('jellyfish', 'sea', 'sea creatures', () =>
    act(jellyfish('jellyfish', '#f0a0d8', '#f4b8e0'), [A.par(A.anim('pulse', 2), A.pose('body', { move: [0, 0.15, 0], dur: 1.2 }), say('...', 1)), A.pose('body', { move: [0, 0, 0], dur: 1.2 })], [A.operate('glow', 'on'), A.par(A.effect('sparkle', { dur: 1.4 }), say('Zap!', 1.2)), A.wait(1.2), A.operate('glow', 'off')]),
  ),
  e('joey', 'wild', 'outback', () =>
    act(roo('joey', 0.24, 1.4, '#c08a5a'), [A.par(A.anim('hop', 2), say('Squeak!', 1.2))], [A.par(ps('earL', [0, 0, 20], 0.3), ps('earR', [0, 0, -20], 0.3), ps('head', [0, 0, 18], 0.3), say('?', 1)), A.wait(0.8), rest('earL', 'earR', 'head')]),
  ),
  e('kangaroo', 'wild', 'outback', () =>
    actS(roo('kangaroo', 1.05, 1, '#b8784a', true), [A.spawn('joey', 'joey'), A.attach('joey', 'self', 'pouch')],
      [A.par(A.anim('hop', 3), say('Boing! Boing!', 1.6))],
      [A.par(ps('tail', [-10, 0, 0], 0.3), ps('legFL', [-70, 0, 0], 0.25), say('Put em up!', 1.4)), ps('legFR', [-70, 0, 0], 0.2), ps('legFL', [0, 0, 0], 0.2), ps('legFR', [0, 0, 0], 0.2), A.par(ps('legBL', [-45, 0, 0], 0.2), ps('legBR', [-45, 0, 0], 0.2), A.anim('hop')), rest('legBL', 'legBR', 'tail')]),
  ),
  e('kid (animal)', 'farm', 'goats', () =>
    act(QK('kid (animal)', { c: '#e8dcc8', H: 0.45, L: 0.45, D: 0.2, W: 0.17, tuck: 0.35, neck: { l: 0.15, w: 0.08, lean: 26 }, head: { l: 0.15, w: 0.1, h: 0.11 }, muz: { l: 0.06, w: 0.06, h: 0.06, c: '#e8d8d0', drop: 0.18 }, eye: { k: 1.3, c: '#a87a2a' }, ear: { k: 'side', s: 0.1, in: '#e8c8c0', tilt: 20 }, leg: { w: 0.03, hoof: '#4a4440' }, tail: { k: 'stub', l: 0.06, w: 0.03, a: 30 } }, back('#8a6a4a', 0.2, 0.9), onHead('#8a6a4a', [1.02, 0.5, 0.6], [0, 0.35, 0])), [A.par(A.anim('hop', 3), say('Meh-eh-eh!', 1.6))], speak('Maa!', 22)),
  ),
  e('kit (animal)', 'wild', 'forest', () =>
    act(QK('kit (animal)', { ...grow(QFOX, 0.4, 1.45, 0.88), c: '#b8703e' }, ...foxMarks), [A.par(A.anim('hop', 2), say('Yip!', 1.2))], [A.par(ps('head', [0, 0, 22], 0.3), say('?', 1)), A.wait(0.8), rest('head')]),
  ),
  e('kitten', 'pets', 'cats', () =>
    act(QK('kitten', { c: '#a8a8a8', H: 0.14, L: 0.17, D: 0.08, W: 0.08, tuck: 0.3, neck: { l: 0.04, w: 0.045, lean: 38 }, head: { l: 0.07, w: 0.075, h: 0.068 }, muz: { l: 0.022, w: 0.035, h: 0.024, c: '#e8e8e8', drop: 0.26 }, nose: '#e89a9a', eye: { k: 1.6, c: '#4a7aa0' }, ear: { k: 'prick', s: 0.04, in: '#f2b4bc' }, leg: { w: 0.018 }, tail: { k: 'long', l: 0.13, w: 0.016, a: 30 } }, ...Array.from({ length: 5 }, (_, i) => patch('#6a6a6a', 0.15 + i * 0.15, 0.2 + i * 0.15, 0.005)), onHead('#6a6a6a', [0.12, 0.3, 0.5], [0.2, 0.45, -0.05], { mirror: true })),
      meow('Mew!'),
      [A.spawn('toy', 'ball', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('hop'), ps('legFL', [-60, 0, 0], 0.2), say('Mew mew!', 1.4)), rest('legFL'), A.remove('toy', 'pop')],
      purr('Prrrr...')),
  ),
  e('kiwi (bird)', 'aviary', 'flightless birds', () =>
    act(AVK('kiwi (bird)', { H: 0.32, c: '#8a6a48', belly: '#9a7a58', wing: '#8a6a48', tail: '#8a6a48', beak: '#e8dcb0', legs: '#9a9a8a', len: 0.72, fat: 0.85, up: 8, neck: 0.02, hk: 0.7, bl: 0.38, bk: 'needle', leg: 0.16, lw: 1.8, tl: 0.02, tk: 'stub', wl: 0.15 }), [...peck('Snuffle snuffle...', 3)], sing('Kee-wee! Kee-wee!')),
  ),
  e('koala', 'wild', 'outback', () =>
    act(koala('koala', 1.0), [ps('jaw', [18, 0, 0], 0.25), ps('jaw', [0, 0, 0], 0.25), A.par(ps('jaw', [18, 0, 0], 0.25), say('Munch munch...', 1.8)), ps('jaw', [0, 0, 0], 0.25)], [A.par(ps('head', [25, 0, 20], 1), say('Zzz...', 2.2)), A.wait(1.6), rest('head')], [A.par(ps('head', [-15, 0, 0], 0.3), ps('jaw', [25, 0, 0], 0.3), say('Hrrnk-hrrnk!', 1.6)), A.wait(0.8), rest('head', 'jaw')]),
  ),
  e('koala cub', 'wild', 'outback', () =>
    act(koala('koala cub', 0.4), [A.par(ps('head', [0, 0, 20], 0.3), say('Eek!', 1.2)), A.wait(0.6), rest('head')], [ps('jaw', [18, 0, 0], 0.25), A.par(ps('jaw', [0, 0, 0], 0.25), say('Munch.', 1.2))]),
  ),
  e('komodo dragon', 'wild', 'reptiles', () =>
    act(RK('komodo dragon', { L: 2.6, bf: 0.36, tf: 0.44, hf: 0.13, w: 0.17, h: 0.12, c: '#6e6450', belly: '#8a7e66', leg: 0.16, lw: 0.035, snout: 'lizard', cl: 0.04, ek: 0.8, eye: '#a87a2a' }, (f, d) => f.rod([0, d.y0 + d.bh * 0.02, d.zh - d.o.L * 0.02], [0, d.y0 - d.bh * 0.02, d.zh + d.o.L * 0.1], d.o.L * 0.008, '#e8b830', { name: 'tongue', parent: 'head', scale: 0 }), (f, d) => {
      let r = 13;
      const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 30; i++) f.ball(d.o.L * 0.02, [(rnd() - 0.5) * d.bw * 0.8, d.y0 + d.bh * 0.45, d.z0 + rnd() * (d.z1 - d.z0)], { color: '#5e5644', parent: 'body', noInk: true });
    }),
      [A.pose('tongue', { scale: 1, dur: 0.12 }), A.pose('tongue', { scale: 0, dur: 0.12 }), A.par(A.pose('tongue', { scale: 1, dur: 0.12 }), say('Hsss...', 1.6)), A.pose('tongue', { scale: 0, dur: 0.12 })],
      [A.operate('jaw', 'open'), A.wait(0.8), A.par(A.operate('jaw', 'close'), say('HSSS!', 1.2))]),
  ),
  e('krill', 'sea', 'sea creatures', () =>
    act((() => {
      const c = '#f08a7a';
      const f = m('krill', { view: 'side', rig: 'fish' });
      f.ball([0.012, 0.012, 0.022], [0, 0.014, 0.012], { color: c, name: 'body' })
        .each(5, (i) => f.ball([0.01 - i * 0.0012, 0.01 - i * 0.0012, 0.009], [0, 0.013 - i * i * 0.0005, -0.002 - i * 0.0075], { color: c, parent: 'body' }))
        .ball([0.014, 0.004, 0.012], [0, 0.004, -0.038], { color: c, name: 'tail', parent: 'body' })
        .pair((s) =>
          f.ball(0.006, [s * 0.004, 0.017, 0.024], { color: '#1d1a17', eye: true, parent: 'body' })
            .rod([s * 0.002, 0.017, 0.026], [s * 0.006, 0.03, 0.055], 0.0012, c, { parent: 'body' })
            .each(5, (i) => f.rod([s * 0.003, 0.008, 0.016 - i * 0.006], [s * 0.005, 0.0005, 0.018 - i * 0.006], 0.0012, '#f4b0a0', { parent: 'body' })),
        )
        .ball(0.003, [0, 0.0065, 0.004], { color: '#7af0e0', glow: true, noInk: true, name: 'lights', parent: 'body', mover: { kind: 'light', on: true } });
      return f.done();
    })(), [A.par(A.anim('hop', 2), say('!', 1))], [A.operate('lights', 'off'), A.wait(0.5), A.par(A.operate('lights', 'on'), A.effect('sparkle', { dur: 1 }))]),
  ),
  e('labrador', 'pets', 'dog breeds', () =>
    actF(QK('labrador', { c: '#e3c27e', H: 0.57, L: 0.66, D: 0.28, W: 0.25, tuck: 0.3, neck: { l: 0.17, w: 0.15, lean: 38 }, head: { l: 0.19, w: 0.15, h: 0.14 }, muz: { l: 0.12, w: 0.09, h: 0.09 }, ear: { k: 'drop', s: 0.11 }, leg: { w: 0.058 }, tail: { k: 'long', l: 0.4, w: 0.055, a: 115 } }, collarQ('#c83a3a', '#e8c040')), (f) => [fetchIt('stick', 'Woof!'), sitQ(f, 'Arf!'), bark('Woof woof!')]),
  ),
];
