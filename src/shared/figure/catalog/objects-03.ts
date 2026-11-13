/** Catalog chunk objects-03: the words in assign/objects-03.tsv. */
import { e, type CatalogEntry } from './types';
import { A, around, col, m, withAct, type M, type PartOpts } from '../dsl';
import { hat, who, type Extra } from '../accessories';
import { measure } from '../math';
import type { FigPart, Figure } from '../types';

type V = [number, number, number];

/* ----- local helpers ----- */

/** Deterministic 0..1 noise for scattering bits (confetti, crumbs). */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const COLS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'cyan', 'lime', 'magenta'];
const GLASS = '#9fd3f0';

/** A mug with a drink in it and a handle on its left (+x). */
function mug(k: string, cup: string, drink: string, w = 0.09, h = 0.1): M {
  return m(k)
    .cyl([w, h, w], [0, h / 2, 0], { color: cup })
    .cyl([w * 0.86, 0.01, w * 0.86], [0, h - 0.003, 0], { color: drink, noInk: true })
    .torus([h * 0.6, h * 0.6, 0.016], [w / 2 + h * 0.12, h * 0.5, 0], { color: cup, tube: 0.28 });
}

/** A bowl heaped with food. */
function bowl(k: string, c: string, food: string, w = 0.16, h = 0.06): M {
  return m(k)
    .cyl([w * 0.62, h, w * 0.62], [0, h / 2, 0], { color: c, taper: 1.6 })
    .ball([w * 0.9, h * 0.75, w * 0.9], [0, h, 0], { color: food });
}

/** A glass or plastic bottle: body, shoulder, neck, cap, optional label. */
function bottle(k: string, c: string, cap: string, h = 0.25, w = 0.08, text?: string, labelC = 'white'): M {
  const b = m(k)
    .cyl([w, h * 0.62, w], [0, h * 0.31, 0], { color: c, name: 'body' })
    .ball([w, w * 0.7, w], [0, h * 0.62, 0], { color: c })
    .cyl([w * 0.38, h * 0.24, w * 0.38], [0, h * 0.74, 0], { color: c })
    .cyl([w * 0.46, h * 0.12, w * 0.46], [0, h * 0.92, 0], { color: cap, name: 'cap', parent: 'body', piece: true, edge: 'sharp' });
  if (text) b.label(text, [w * 0.8, h * 0.26], [0, h * 0.3, w / 2 + 0.004], { color: labelC });
  return b;
}

/** A squeeze bottle (shampoo, lotion): rounded body and a flip cap on top. */
function squeeze(k: string, c: string, cap: string, h: number, w: number, text: string): M {
  return m(k)
    .box([w, h * 0.82, w * 0.6], [0, h * 0.41, 0], { color: c, round: 0.8 })
    .cyl([w * 0.62, h * 0.12, w * 0.5], [0, h * 0.88, 0], { color: cap, edge: 'sharp' })
    .cyl([w * 0.6, h * 0.06, w * 0.48], [0, h * 0.97, 0], { color: cap, name: 'cap', pivot: [0, h * 0.94, -w * 0.24], mover: { kind: 'swing', axis: 'x', amount: -110 }, edge: 'sharp' })
    .label(text, [w * 0.8, h * 0.3], [0, h * 0.42, w * 0.3 + 0.004], { color: 'white' });
}

/** A gable-top carton (milk, juice). */
function carton(k: string, c: string, top: string, text: string, h = 0.25, w = 0.09): M {
  return m(k)
    .box([w, h * 0.8, w], [0, h * 0.4, 0], { color: c, round: 0.08 })
    .wedge([w, h * 0.14, w], [0, h * 0.87, 0], { color: top, rot: [0, 90, 0] })
    .box([w * 0.95, h * 0.07, 0.012], [0, h * 0.965, 0], { color: top, round: 0.1 })
    .label(text, [w * 0.86, h * 0.2], [0, h * 0.62, w / 2 + 0.006], { color: 'white' });
}

/** Seven-segment digits (a digital clock face) drawn with glowing bars, starting at x0, centred on y. */
const SEG: Record<string, string> = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
function seg7(b: M, txt: string, x0: number, y: number, z: number, w: number, h: number, c: string): M {
  let x = x0;
  const t = w * 0.2, hw = w / 2, hh = h / 2;
  for (const ch of txt) {
    if (ch === ':') {
      b.ball(t * 1.2, [x, y + h * 0.2, z], { color: c, glow: true }).ball(t * 1.2, [x, y - h * 0.2, z], { color: c, glow: true });
      x += w * 0.8;
      continue;
    }
    const at: Record<string, V> = { a: [x, y + hh, z], d: [x, y - hh, z], g: [x, y, z], f: [x - hw, y + h / 4, z], b: [x + hw, y + h / 4, z], e: [x - hw, y - h / 4, z], c: [x + hw, y - h / 4, z] };
    for (const sg of SEG[ch] ?? '') b.box('adg'.includes(sg) ? [w * 0.8, t, 0.004] : [t, h * 0.42, 0.004], at[sg], { color: c, glow: true });
    x += w * 1.6;
  }
  return b;
}


/* ----- helpers for the revised entries ----- */

const WIN = '#86bfe0';
const DARKWIN = '#2f3d52';

/** A window in a wall facing +z (front face at z): a frame, the glass in front of it, a sill, optional glazing bars. */
function win(b: M, x: number, y: number, z: number, w: number, h: number, frame = 'white', o: { glass?: string; bars?: boolean; sill?: boolean; parent?: string } = {}): M {
  const p = o.parent ? { parent: o.parent } : {};
  b.box([w + 0.14, h + 0.14, 0.06], [x, y, z + 0.03], { color: frame, round: 0.1, ...p });
  b.box([w, h, 0.04], [x, y, z + 0.07], { color: o.glass ?? WIN, round: 0.05, ...p });
  if (o.bars) b.box([0.05, h, 0.03], [x, y, z + 0.1], { color: frame, ...p }).box([w, 0.05, 0.03], [x, y + h * 0.12, z + 0.1], { color: frame, ...p });
  if (o.sill !== false) b.box([w + 0.24, 0.07, 0.16], [x, y - h / 2 - 0.08, z + 0.08], { color: frame, round: 0.2, ...p });
  return b;
}

/** A door in a wall facing +z (front face at z), hinged on its -x edge so it swings out toward you: a frame, a
 *  leaf named `name` (a swing mover), a glass panel, a handle at 1.0 m. */
function frontDoor(b: M, x: number, z: number, c: string, o: { w?: number; h?: number; glass?: boolean; frame?: string; name?: string; flip?: boolean; parent?: string } = {}): M {
  const w = o.w ?? 0.95, h = o.h ?? 2.1, name = o.name ?? 'door', fr = o.frame ?? 'white';
  const p = o.parent ? { parent: o.parent } : {};
  const hx = o.flip ? x + w / 2 : x - w / 2;
  b.box([w + 0.2, 0.1, 0.12], [x, h + 0.05, z + 0.03], { color: fr, ...p });
  b.pair((s) => b.box([0.1, h, 0.12], [x + s * (w / 2 + 0.05), h / 2, z + 0.03], { color: fr, ...p }));
  b.box([w, h, 0.06], [x, h / 2, z + 0.04], { color: c, round: 0.1, name, pivot: [hx, h / 2, z + 0.04], mover: { kind: 'swing', axis: 'y', amount: o.flip ? 100 : -100 }, ...p });
  if (o.glass) b.box([w * 0.62, h * 0.42, 0.02], [x, h * 0.68, z + 0.075], { color: WIN, parent: name });
  else b.each(2, (i) => b.box([w * 0.62, h * 0.3, 0.02], [x, h * (0.3 + i * 0.4), z + 0.075], { color: c, round: 0.2, parent: name }));
  const hd = o.flip ? -1 : 1;
  return b.box([0.035, 0.22, 0.05], [x + hd * (w / 2 - 0.1), 1.0, z + 0.1], { color: 'silver', round: 0.4, parent: name });
}

/** A striped canvas awning on a wall facing +z: from height y at the wall, sloping out `out` metres. */
function awning(b: M, x: number, w: number, y: number, z: number, out: number, c1: string, c2: string): M {
  const n = Math.max(3, Math.round(w / 0.55)), sw = w / n, a = (24 * Math.PI) / 180;
  const fy = y - Math.sin(a) * out, fzz = z + Math.cos(a) * out;
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + sw * (i + 0.5), c = i % 2 ? c2 : c1;
    b.box([sw, 0.05, out], [cx, y - (Math.sin(a) * out) / 2, z + (Math.cos(a) * out) / 2], { color: c, rot: [24, 0, 0], round: 0.1 });
    b.box([sw, 0.24, 0.03], [cx, fy - 0.12, fzz], { color: c, round: 0.3 });
  }
  b.pair((s) => b.rod([x + s * (w / 2 - 0.05), y, z + 0.02], [x + s * (w / 2 - 0.05), fy, fzz], 0.03, '#3a3633'));
  return b;
}

interface ShopO {
  w: number;
  d: number;
  /** wall height (a one-storey shop is 4.4) */
  h?: number;
  wall: string;
  trim?: string;
  base?: string;
  roof?: string;
  gable?: number;
  sign: string;
  signBg?: string;
  door?: string;
  awn?: [string, string];
  /** rows of upper-floor windows (each 3 m) */
  upper?: number;
}
/** A shop at real size: plinth, walls, cornice, roof, a glass door that swings out (handle at 1 m), a big shop
 *  window, corner pilasters, a fascia sign at 3 m, an optional striped awning and upper-floor windows. */
function shop(k: string, o: ShopO): M {
  const { w, d } = o, h = o.h ?? 4.4, fz = d / 2, trim = o.trim ?? 'white';
  const b = m(k, { edge: 'sharp' })
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.03, name: 'body' })
    .box([w + 0.1, 0.3, d + 0.1], [0, 0.15, 0], { color: o.base ?? '#8d8a86', round: 0.1 })
    .box([w + 0.3, 0.28, d + 0.3], [0, h + 0.14, 0], { color: trim, round: 0.15 });
  if (o.gable) b.wedge([w + 0.5, o.gable, d + 0.5], [0, h + 0.28 + o.gable / 2, 0], { color: o.roof ?? '#8a4a2a' });
  else b.box([w - 0.3, 0.12, d - 0.3], [0, h + 0.33, 0], { color: o.roof ?? '#5c6166', round: 0.1 });
  b.pair((s) => b.box([0.3, h, 0.12], [s * (w / 2 - 0.15), h / 2, fz + 0.06], { color: trim, round: 0.1 }));
  const dx = -w / 2 + 1.0;
  frontDoor(b, dx, fz, o.door ?? '#3b2414', { glass: true, frame: trim });
  const wx0 = dx + 0.72, wx1 = w / 2 - 0.42, ww = wx1 - wx0, wc = (wx0 + wx1) / 2;
  win(b, wc, 1.55, fz, ww, 1.7, trim, { sill: false });
  b.box([0.06, 1.7, 0.04], [wc, 1.55, fz + 0.1], { color: trim });
  b.box([ww + 0.14, 0.5, 0.14], [wc, 0.45, fz + 0.07], { color: trim, round: 0.1 });
  b.label(o.sign, [w - 0.7, 0.62], [0, 3.05, fz + 0.08], { color: o.signBg ?? '#2a2726', depth: 0.1 });
  if (o.awn) awning(b, 0, w - 0.5, 2.68, fz + 0.12, 1.1, o.awn[0], o.awn[1]);
  for (let r = 0; r < (o.upper ?? 0); r++) {
    const n = Math.max(2, Math.floor(w / 1.8));
    b.each(n, (i) => win(b, -w / 2 + (w / n) * (i + 0.5), 4.9 + r * 3, fz, 0.9, 1.3, trim, { bars: true }));
  }
  return b;
}

interface TowerO {
  w: number;
  d: number;
  floors: number;
  /** storey height (3.2) */
  st?: number;
  wall: string;
  trim?: string;
  base?: string;
  roof?: string;
  gable?: number;
  /** windows across the front on each floor */
  cols: number;
  sign?: string;
  signBg?: string;
  door?: string;
  winW?: number;
  winH?: number;
  /** glass door pair instead of one door */
  double?: boolean;
  /** windows on the sides too */
  sides?: number;
  /** big shop windows on the ground floor instead of ordinary ones */
  shopfront?: boolean;
  /** leave the entrance doors out (the entry adds its own) */
  noDoor?: boolean;
}
/** A many-storey building at real size: storeys of `st` metres, a row of framed windows on every floor (the
 *  ground floor's centre bay is the entrance), a canopy and sign over the door, a cornice and a roof. */
function tower(k: string, o: TowerO): M {
  const { w, d, floors } = o, st = o.st ?? 3.2, h = floors * st, fz = d / 2, trim = o.trim ?? 'white';
  const ww = o.winW ?? 1.1, wh = o.winH ?? 1.5;
  const b = m(k, { edge: 'sharp' })
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.02, name: 'body' })
    .box([w + 0.12, 0.4, d + 0.12], [0, 0.2, 0], { color: o.base ?? '#8d8a86', round: 0.1 })
    .box([w + 0.4, 0.4, d + 0.4], [0, h + 0.2, 0], { color: trim, round: 0.15 });
  if (o.gable) b.wedge([w + 0.6, o.gable, d + 0.6], [0, h + 0.4 + o.gable / 2, 0], { color: o.roof ?? '#8a4a2a' });
  else b.box([w - 0.4, 0.15, d - 0.4], [0, h + 0.47, 0], { color: o.roof ?? '#5c6166' });
  for (let f = 1; f < floors; f++) b.box([w + 0.06, 0.16, d + 0.06], [0, f * st, 0], { color: trim, round: 0.2 });
  const cw = w / o.cols, mid = (o.cols - 1) / 2;
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < o.cols; c++) {
      if (f === 0 && Math.abs(c - mid) < (o.double ? 1 : 0.6)) continue;
      if (f === 0 && o.shopfront) {
        win(b, -w / 2 + cw * (c + 0.5), 1.65, fz, cw * 0.82, 2.3, trim, { sill: false });
        b.box([cw * 0.82 + 0.14, 0.5, 0.14], [-w / 2 + cw * (c + 0.5), 0.25, fz + 0.07], { color: trim, round: 0.1 });
        continue;
      }
      win(b, -w / 2 + cw * (c + 0.5), f * st + st * 0.55, fz, ww, wh, trim, { bars: true });
    }
  for (let s = 0; s < (o.sides ?? 0); s++)
    for (let f = 0; f < floors; f++)
      b.pair((sd) => b.box([0.06, wh, ww], [sd * (w / 2 + 0.03), f * st + st * 0.55, -d / 2 + (d / (o.sides! + 1)) * (s + 1)], { color: WIN, round: 0.05 }));
  if (o.noDoor) {
    // the entry builds its own entrance
  } else if (o.double) {
    frontDoor(b, -0.55, fz, o.door ?? WIN, { glass: true, frame: trim, w: 1.1, h: 2.3, name: 'doorL' });
    frontDoor(b, 0.55, fz, o.door ?? WIN, { glass: true, frame: trim, w: 1.1, h: 2.3, name: 'doorR', flip: true });
  } else frontDoor(b, 0, fz, o.door ?? '#5a3a22', { glass: true, frame: trim, w: 1.1, h: 2.3 });
  b.box([o.double ? 3.4 : 2.2, 0.15, 1.3], [0, 2.75, fz + 0.65], { color: trim, round: 0.2 });
  if (o.sign) b.label(o.sign, [Math.min(w * 0.8, 0.45 * o.sign.length + 0.6), 0.6], [0, 3.15, fz + 0.06], { color: o.signBg ?? '#2a2726', depth: 0.08 });
  b.box([o.double ? 3.0 : 1.8, 0.16, 0.9], [0, 0.08, fz + 0.45], { color: o.base ?? '#8d8a86', round: 0.2 });
  return b;
}

/** A wheel with its axle along x: a soft rubber tyre (named, so it rolls) with a crisp rim and hub that turn with it. */
function wheel(b: M, name: string, x: number, y: number, z: number, dia: number, wid: number, rim = 'silver'): M {
  return b
    .cyl([dia, wid, dia], [x, y, z], { color: 'rubber', rot: [0, 0, 90], name, edge: 'soft' })
    .cyl([dia * 0.6, wid * 1.06, dia * 0.6], [x, y, z], { color: rim, rot: [0, 0, 90], parent: name, edge: 'sharp' })
    .cyl([dia * 0.2, wid * 1.14, dia * 0.2], [x, y, z], { color: '#3a3633', rot: [0, 0, 90], parent: name, edge: 'sharp' });
}

/** A dressmaker's form on a tripod: a soft padded torso (`form`, waist at 1.02 m, shoulders at 1.42 m) on a pole. */
function dressForm(k: string): M {
  const b = m(k);
  around(3, 0.3, 0.5).forEach(([x, z]) => b.rod([0, 0.32, 0], [x, 0.02, z], 0.03, 'darkwood', { edge: 'sharp' }));
  return b
    .stick([0, 0.3, 0], [0, 1.0, 0], 0.035, 'brass', { edge: 'sharp' })
    .ball([0.34, 0.56, 0.24], [0, 1.24, 0], { color: '#e8dccb', name: 'form' })
    .cyl([0.1, 0.1, 0.09], [0, 1.53, 0], { color: '#e8dccb', parent: 'form' })
    .ball(0.06, [0, 1.6, 0], { color: 'darkwood', parent: 'form', edge: 'sharp' });
}

/** A coat stand hook with a wooden hanger at shoulder height y (things hang below it); the hanger swings ('hanger'). */
function hangStand(k: string, y: number): M {
  const b = m(k);
  b.pair((s) => b.box([0.5, 0.04, 0.06], [0, 0.02, 0], { color: 'darkwood', rot: [0, s > 0 ? 45 : -45, 0], round: 0.3, edge: 'sharp' }));
  return b
    .stick([0, 0.04, 0], [0, y + 0.28, 0], 0.04, 'darkwood', { edge: 'sharp' })
    .rod([0, y + 0.26, 0], [0, y + 0.26, 0.14], 0.025, 'brass', { edge: 'sharp' })
    .arc([0.05, 0.05, 0.006], [0, y + 0.16, 0.14], { color: 'silver', arc: 220, rot: [0, 90, 0], tube: 0.2, name: 'hanger', pivot: [0, y + 0.2, 0.14], edge: 'sharp' })
    .rod([-0.21, y, 0.14], [0, y + 0.1, 0.14], 0.028, 'wood', { parent: 'hanger', edge: 'sharp' })
    .rod([0.21, y, 0.14], [0, y + 0.1, 0.14], 0.028, 'wood', { parent: 'hanger', edge: 'sharp' })
    .stick([0, y + 0.1, 0.14], [0, y + 0.16, 0.14], 0.008, 'silver', { parent: 'hanger', edge: 'sharp' });
}

/** A road sign on a 2.4 m galvanised post with a concrete foot; the sign plate (`sign`) can rattle on its bolts. */
function sign(k: string, shape: 'diamond' | 'round' | 'rect' | 'tri' | 'oct', c: string, s: number, border = 'black', y = 2.1): M {
  const b = m(k, { edge: 'sharp' })
    .cyl([0.3, 0.12, 0.3], [0, 0.06, 0], { color: '#9a958e' })
    .stick([0, 0.1, 0], [0, y + s * 0.35, -0.03], 0.06, 'silver', { edge: 'soft' })
    .box([0.1, 0.1, 0.03], [0, y, 0.0], { color: 'silver', name: 'sign', pivot: [0, y, 0] });
  const z = 0.02, o = { parent: 'sign' };
  if (shape === 'diamond') b.box([s * 0.72, s * 0.72, 0.02], [0, y, z], { color: border, round: 0.15, rot: [0, 0, 45], ...o }).box([s * 0.64, s * 0.64, 0.02], [0, y, z + 0.006], { color: c, round: 0.15, rot: [0, 0, 45], ...o });
  if (shape === 'round') b.cyl([s, 0.02, s], [0, y, z], { color: border, rot: [90, 0, 0], ...o }).cyl([s * 0.9, 0.02, s * 0.9], [0, y, z + 0.006], { color: c, rot: [90, 0, 0], ...o });
  if (shape === 'oct') b.prism([s, 0.02, s], [0, y, z], 8, { color: border, rot: [90, 0, 0], ...o }).prism([s * 0.9, 0.02, s * 0.9], [0, y, z + 0.006], 8, { color: c, rot: [90, 0, 0], ...o });
  if (shape === 'rect') b.box([s * 1.3, s * 0.8, 0.02], [0, y, z], { color: border, round: 0.15, ...o }).box([s * 1.22, s * 0.72, 0.02], [0, y, z + 0.006], { color: c, round: 0.15, ...o });
  if (shape === 'tri') b.prism([s * 1.15, 0.02, s * 1.15], [0, y, z], 3, { color: border, rot: [90, -90, 0], ...o }).prism([s * 0.86, 0.02, s * 0.86], [0, y, z + 0.006], 3, { color: c, rot: [90, -90, 0], ...o });
  return b;
}
/** A sign's act: the plate rattles on its post (and a sound word). */
const RATTLE = (word: string) => [A.pose('sign', { rot: [0, 0, 8], dur: 0.15 }), A.pose('sign', { rot: [0, 0, -6], dur: 0.2 }), A.pose('sign', { rot: [0, 0, 3], dur: 0.15 }), A.par(A.pose('sign', { rot: [0, 0, 0], dur: 0.15 }), A.say(word, 1.5))];

/** A book standing up, cover facing you; the front cover (`cover`) swings open about the spine on the left. */
function standBook(k: string, c: string, text: string, w = 0.19, h = 0.26, t = 0.03, spine = c): M {
  return m(k, { edge: 'sharp' })
    .box([w, h, t * 0.25], [0, h / 2, -t * 0.375], { color: c, round: 0.2 })
    .box([w - 0.012, h - 0.01, t * 0.55], [0.004, h / 2, 0], { color: 'paper', round: 0.1 })
    .box([0.018, h, t * 1.05], [-w / 2 + 0.006, h / 2, 0], { color: spine, round: 0.5 })
    .box([w, h, t * 0.22], [0, h / 2, t * 0.39], { color: c, round: 0.2, name: 'cover', pivot: [-w / 2 + 0.004, h / 2, t * 0.39], mover: { kind: 'swing', axis: 'y', amount: -150 } })
    .label(text, [w * 0.78, h * 0.16], [0.006, h * 0.8, t / 2 + 0.006], { color: 'white', parent: 'cover', depth: 0.004 });
}

/** A palm tree at real size: a ringed trunk leaning into a curve, a swaying crown (`top`) of arching fronds. */
function palmTree(k: string, h: number, lean: number, frond = 'leaf'): M {
  const b = m(k);
  const pts: V[] = [0, 0.25, 0.5, 0.75, 1].map((t) => [lean * t * t, h * t, 0]);
  for (let i = 0; i < 4; i++) {
    b.stick(pts[i], pts[i + 1], h * (0.05 - i * 0.005), i % 2 ? '#8a6a45' : '#9a7a52');
    b.cyl([h * (0.056 - i * 0.005), h * 0.012, h * (0.056 - i * 0.005)], [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, 0], { color: '#6e5436', noInk: true });
  }
  b.cyl([h * 0.08, h * 0.06, h * 0.08], [0, h * 0.03, 0], { color: '#8a6a45', taper: 0.7 });
  const top: V = [lean, h, 0];
  b.ball(h * 0.06, top, { color: '#6a5a2a', name: 'top' });
  around(11, 1, 0.2).forEach(([x, z], i) => {
    const up = i % 3 === 0;
    const r1 = h * 0.16, r2 = h * (0.34 + (i % 2) * 0.04);
    const mid: V = [top[0] + x * r1, h + h * (up ? 0.08 : 0.04), z * r1];
    const tip: V = [top[0] + x * r2, h - h * (up ? 0.05 : 0.17), z * r2];
    const c = i % 2 ? frond : 'darkgreen';
    blade(b, top, mid, h * 0.045, h * 0.008, c, { parent: 'top' });
    blade(b, mid, tip, h * 0.04, h * 0.008, c, { parent: 'top' });
  });
  return b;
}

/** Give a part's joint a rest turn (a mixer drum tilted so it spins about its own axis); what hangs off it turns too. */
function restTurn(fig: Figure, name: string, rot: V): Figure {
  return measure({ ...fig, parts: fig.parts.map((p) => (p.name === name ? { ...p, rot } : p)) });
}

/** A dinosaur suit for who(): a green hood with a toothy snout and eyes on top of the head (the face shows under
 *  it), a pale belly, orange spikes down the back and a long tail. */
const dinoSuit: Extra = (p, d) => {
  const g = col('#4caf50'), dk = col('#2e7d32'), add = (q: Omit<FigPart, 'layer'>) => p.add({ layer: 2, ...q });
  add({ name: 'dinoHood', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 1.22, d.headH * 1.05, d.headD * 1.15], off: [0, d.headY + d.headH * 0.18, -d.headD * 0.22], color: g });
  add({ name: 'dinoSnout', parent: 'head', at: [0, 0, 0], shape: 'box', size: [d.headW * 0.95, d.headH * 0.36, d.headD * 0.9], off: [0, d.headY + d.headH * 0.55, d.headD * 0.32], round: 0.7, color: g });
  for (const s of [1, -1]) {
    add({ name: `dinoEye${s > 0 ? 'L' : 'R'}`, parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 0.26, d.headW * 0.26, d.headW * 0.2], off: [s * d.headW * 0.26, d.headY + d.headH * 0.78, d.headD * 0.18], color: col('white') });
    add({ name: `dinoPupil${s > 0 ? 'L' : 'R'}`, parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 0.12, d.headW * 0.12, d.headW * 0.08], off: [s * d.headW * 0.26, d.headY + d.headH * 0.8, d.headD * 0.28], color: col('#1e1a16') });
  }
  for (let i = 0; i < 5; i++) add({ name: `dinoTooth${i}`, parent: 'head', at: [0, 0, 0], shape: 'cyl', taper: 0, segs: 3, srot: [180, 0, 0], size: [d.headW * 0.12, d.headH * 0.14, d.headW * 0.1], off: [(i - 2) * d.headW * 0.18, d.headY + d.headH * 0.33, d.headD * 0.72], color: col('white') });
  add({ name: 'dinoBelly', parent: 'torso', at: [0, 0, 0], shape: 'ball', size: [d.tw * 0.7, d.torsoH * 0.85, d.td * 0.4], off: [0, d.torsoH * 0.45, d.td * 0.38], color: col('#c5e1a5') });
  for (let i = 0; i < 4; i++) add({ name: `dinoSpike${i}`, parent: 'torso', at: [0, 0, 0], shape: 'cyl', taper: 0, segs: 4, srot: [-70, 0, 0], size: [d.tw * 0.22, d.tw * 0.3, d.tw * 0.12], off: [0, d.torsoH * (0.95 - i * 0.28), -d.td * 0.6], color: col('orange') });
  add({ name: 'dinoTail', parent: 'hips', at: [0, 0, -d.td * 0.3], shape: 'capsule', srot: [-115, 0, 0], size: [d.tw * 0.55, d.H * 0.38, d.tw * 0.55], off: [0, -d.H * 0.07, -d.H * 0.17], color: g });
  add({ name: 'dinoTailTip', parent: 'hips', at: [0, 0, -d.td * 0.3], shape: 'capsule', srot: [-100, 0, 0], size: [d.tw * 0.3, d.H * 0.25, d.tw * 0.3], off: [0, -d.H * 0.14, -d.H * 0.42], color: dk });
};

/** A flat leaf-like ellipsoid from a to b: width w (kept level), thickness t. Fronds, leaves, blades, petals. */
function blade(b: M, a: V, q: V, w: number, t: number, color: string, o: PartOpts = {}): M {
  const d: V = [q[0] - a[0], q[1] - a[1], q[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const rx = (Math.atan2(d[2] / len, d[1] / len) * 180) / Math.PI;
  const rz = (-Math.asin(Math.max(-1, Math.min(1, d[0] / len))) * 180) / Math.PI;
  return b.ball([w, len, t], [(a[0] + q[0]) / 2, (a[1] + q[1]) / 2, (a[2] + q[2]) / 2], { ...o, color, rot: [rx, 0, rz] });
}

/* ----- the entries ----- */

export const ENTRIES: CatalogEntry[] = [
  // A wooden coat hanger standing on its trouser bar; everything hangs off the hook, so the whole hanger swings.
  e('coat hanger', 'home', 'laundry', () => {
    const b = m('coat hanger', { edge: 'sharp' })
      .arc([0.05, 0.05, 0.006], [0, 0.22, 0], { color: 'silver', arc: 240, rot: [0, 0, 60], tube: 0.18, name: 'hook', pivot: [0, 0.245, 0] })
      .stick([0, 0.15, 0], [0, 0.205, 0], 0.007, 'silver', { parent: 'hook' })
      .ball([0.04, 0.034, 0.02], [0, 0.152, 0], { color: 'wood', parent: 'hook' })
      .box([0.42, 0.014, 0.014], [0, 0.045, 0], { color: 'wood', round: 0.5, parent: 'hook' });
    b.pair((s) => {
      b.box([0.235, 0.032, 0.016], [s * 0.1075, 0.1025, 0], { color: 'wood', round: 0.45, rot: [0, 0, -s * 23.8], parent: 'hook' });
      b.ball([0.026, 0.034, 0.02], [s * 0.212, 0.056, 0], { color: 'wood', parent: 'hook' });
    });
    return b
      .act({ click: [A.pose('hook', { rot: [0, 0, 22], dur: 0.35 }), A.pose('hook', { rot: [0, 0, -16], dur: 0.5 }), A.pose('hook', { rot: [0, 0, 8], dur: 0.4 }), A.par(A.pose('hook', { rot: [0, 0, 0], dur: 0.3 }), A.say('Clack!', 1.2))] })
      .done();
  }),
  // A patch of cobbles set in sand; the middle one is loose and can be lifted out.
  e('cobblestone', 'workshop', 'building materials', () => {
    const b = m('cobblestone', { edge: 'sharp' }).box([0.64, 0.05, 0.48], [0, 0.025, 0], { color: 'sand', round: 0.4, name: 'bed', edge: 'soft' });
    const greys = ['#8d8a86', '#7b7772', '#9a958e', '#85817b', '#6f6b66', '#a19c94'];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        b.box([0.17, 0.1, 0.13], [(c - 1) * 0.19 + (r % 2 ? 0.03 : -0.02), 0.075, (r - 1) * 0.145], { color: greys[i % 6], round: 0.65, rot: [0, (rnd(i) - 0.5) * 16, 0], ...(i === 4 ? { name: 'loose', parent: 'bed', piece: true } : {}) });
      }
    return b.act({ click: [[A.detach('loose', 'cobble'), A.say('Clunk!', 1.2)], [A.reattach('loose'), A.say('Clack.', 1)]] }).done();
  }),
  // A web strung between two twigs, its spider waiting near the middle; she drops on her thread and climbs back.
  e('cobweb', 'bugs', 'spiders', () => {
    const cy = 0.2, R = 0.16;
    const b = m('cobweb')
      .rod([-0.17, 0, -0.01], [-0.165, 0.4, 0], 0.016, 'bark', { edge: 'sharp' })
      .rod([0.17, 0, 0.01], [0.16, 0.38, 0], 0.014, 'bark', { edge: 'sharp' })
      .rod([-0.165, 0.37, 0], [0.13, 0.4, 0], 0.01, 'bark', { edge: 'sharp' });
    b.each(12, (i) => {
      const a = (i * Math.PI) / 6;
      b.stick([0, cy, 0], [Math.cos(a) * R, cy + Math.sin(a) * R, 0], 0.0025, 'white', { noInk: true });
    });
    for (const r of [0.04, 0.08, 0.13, 0.18, 0.23, 0.28]) b.torus([r, r, 0.003], [0, cy, 0], { color: 'white', tube: 0.025, noInk: true });
    b.ball([0.016, 0.014, 0.012], [0.03, cy + 0.03, 0.01], { color: '#1e1a16', name: 'spider', piece: true })
      .ball([0.022, 0.024, 0.018], [0.03, cy + 0.048, 0.008], { color: '#2a2320', parent: 'spider' })
      .ball([0.008, 0.008, 0.006], [0.03, cy + 0.06, 0.016], { color: 'red', parent: 'spider', noInk: true });
    b.pair((s) => b.each(4, (i) => b.rod([0.03 + s * 0.006, cy + 0.03 - 0.004 * i + 0.006, 0.012], [0.03 + s * 0.026, cy + 0.03 + (1.5 - i) * 0.012, 0.012], 0.0022, '#1e1a16', { parent: 'spider' })));
    return b
      .act({
        click: [
          [A.pose('spider', { move: [0, -0.13, 0], dur: 0.8 }), A.say('!', 1), A.wait(1.2), A.pose('spider', { move: [0, 0, 0], dur: 1.2 })],
          [A.pose('spider', { move: [0.07, 0.07, 0], dur: 0.5 }), A.wait(0.6), A.pose('spider', { move: [-0.08, 0.02, 0], dur: 0.7 }), A.pose('spider', { move: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A knee-length black cocktail dress with a silver belt, on a dressmaker's form; it twirls and sparkles.
  e('cocktail dress', 'wardrobe', 'dresses', () => {
    const k = '#1d1d22';
    const b = dressForm('cocktail dress')
      .ball([0.37, 0.44, 0.27], [0, 1.25, 0.004], { color: k })
      .cyl([0.62, 0.56, 0.5], [0, 0.76, 0], { color: k, taper: 0.56 })
      .cyl([0.36, 0.05, 0.27], [0, 1.05, 0], { color: 'silver', edge: 'sharp' })
      .ball([0.06, 0.05, 0.03], [0.07, 1.05, 0.135], { color: 'silver', edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.1, 1.42, 0.04], [s * 0.12, 1.52, 0], 0.014, k));
    b.each(12, (i) => b.ball(0.011, [-0.2 + (i % 4) * 0.13 + (Math.floor(i / 4) % 2) * 0.05, 0.56 + Math.floor(i / 4) * 0.13, 0.215 - Math.floor(i / 4) * 0.035], { color: '#c8c8d8', noInk: true }));
    return b.act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.6 }))] }).done();
  }),
  // A red mug of hot chocolate with marshmallows bobbing on top; it steams.
  e('cocoa', 'food', 'hot drinks', () => {
    const b = mug('cocoa', 'red', 'chocolate')
      .box([0.026, 0.022, 0.026], [-0.016, 0.103, 0.008], { color: 'white', round: 0.5, name: 'mallows', piece: true })
      .box([0.026, 0.022, 0.026], [0.018, 0.104, -0.012], { color: '#fbe3ea', round: 0.5, rot: [0, 30, 0], parent: 'mallows' })
      .box([0.026, 0.022, 0.026], [0.004, 0.106, 0.022], { color: 'white', round: 0.5, rot: [0, 50, 0], parent: 'mallows' });
    return b
      .act({
        click: [
          [A.effect('steam', { dur: 2.5 }), A.say('Slurp!', 1.5)],
          [A.pose('mallows', { move: [0, 0.012, 0], dur: 0.3 }), A.pose('mallows', { move: [0, 0, 0], dur: 0.3 }), A.pose('mallows', { move: [0, 0.008, 0], dur: 0.25 }), A.pose('mallows', { move: [0, 0, 0], dur: 0.25 })],
        ],
      })
      .done();
  }),
  // A whole coconut (its cap cracks off to show the white flesh) beside a half shell.
  e('coconut', 'food', 'fruit', () =>
    m('coconut')
      .ball([0.15, 0.14, 0.15], [-0.05, 0.07, -0.02], { color: '#6b4423', name: 'nut' })
      .cyl([0.11, 0.008, 0.11], [-0.05, 0.12, -0.02], { color: '#f4f0e0', noInk: true })
      .dome([0.112, 0.035, 0.112], [-0.05, 0.122, -0.02], { color: '#5a3818', name: 'cap', parent: 'nut', piece: true })
      .ball(0.018, [-0.065, 0.147, 0.0], { color: '#2a1608', parent: 'cap', noInk: true })
      .ball(0.018, [-0.035, 0.147, 0.0], { color: '#2a1608', parent: 'cap', noInk: true })
      .ball(0.018, [-0.05, 0.149, -0.03], { color: '#2a1608', parent: 'cap', noInk: true })
      .dome([0.14, 0.065, 0.14], [0.1, 0.0325, 0.08], { color: '#6b4423', rot: [180, 0, 0] })
      .cyl([0.14, 0.008, 0.14], [0.1, 0.066, 0.08], { color: 'white' })
      .cyl([0.1, 0.004, 0.1], [0.1, 0.07, 0.08], { color: '#efe8d4', noInk: true })
      .act({ click: [[A.detach('cap', 'shell'), A.effect('water_spray', { dur: 0.8 }), A.say('Crack!', 1.2)], [A.reattach('cap')]] })
      .done(),
  ),
  // A one-litre carton with a coconut on it; it tips to pour.
  e('coconut milk', 'food', 'drinks', () =>
    carton('coconut milk', 'white', '#6b4423', 'COCONUT', 0.25, 0.08)
      .ball([0.045, 0.045, 0.02], [0, 0.07, 0.04], { color: '#6b4423' })
      .ball([0.03, 0.018, 0.01], [0, 0.083, 0.05], { color: 'white', noInk: true })
      .act({ click: [A.set({ tilt: 40, dur: 0.4 }), A.effect('water_spray', { dur: 1.2 }), A.wait(1.2), A.set({ tilt: 0, dur: 0.4 })] })
      .done(),
  ),
  // A 10 m coconut palm: a ringed trunk curving up to a crown of arching fronds and a cluster of coconuts; shake it
  // and one falls.
  e('coconut tree', 'garden', 'palm trees', () => {
    const h = 10, lean = 1.6;
    const b = palmTree('coconut tree', h, lean);
    around(5, 0.22, 0.4).forEach(([x, z], i) => b.ball([0.24, 0.27, 0.24], [lean + x, h - 0.45 - (i % 2) * 0.12, z], { color: i % 2 ? '#6b4a2b' : '#5f7a2e', parent: 'top' }));
    return b
      .ball([0.26, 0.28, 0.26], [lean + 0.05, h - 0.62, 0.18], { color: '#6b4a2b', name: 'coconut', parent: 'top', piece: true })
      .act({ click: [[A.anim('shake'), A.detach('coconut', 'nut'), A.say('Thud!', 1.5)], [A.reattach('coconut'), A.anim('wobble')]] })
      .done();
  }),
  // A cocoon hanging by its silk from a twig; it wriggles, then glimmers.
  e('cocoon', 'bugs', 'life cycle', () =>
    blade(m('cocoon'), [0.05, 0.19, 0.005], [0.1, 0.205, 0.01], 0.025, 0.003, 'leaf')
      .ball([0.1, 0.035, 0.08], [-0.07, 0.014, 0], { color: 'rock', edge: 'sharp' })
      .rod([-0.07, 0.02, 0], [-0.065, 0.18, 0], 0.012, 'bark')
      .rod([-0.065, 0.175, 0], [0.08, 0.185, 0], 0.01, 'bark')
      .stick([0.02, 0.18, 0], [0.02, 0.145, 0], 0.003, 'white', { noInk: true })
      .ball([0.036, 0.08, 0.036], [0.02, 0.105, 0], { color: '#cdbb8a', name: 'cocoon', pivot: [0.02, 0.145, 0], piece: true })
      .torus([0.037, 0.037, 0.004], [0.02, 0.09, 0], { color: '#a8966a', rot: [90, 0, 0], parent: 'cocoon', noInk: true })
      .torus([0.035, 0.035, 0.004], [0.02, 0.116, 0], { color: '#a8966a', rot: [90, 0, 0], parent: 'cocoon', noInk: true })
      .act({
        click: [
          [A.pose('cocoon', { rot: [0, 0, 18], dur: 0.2 }), A.pose('cocoon', { rot: [0, 0, -16], dur: 0.25 }), A.pose('cocoon', { rot: [0, 0, 10], dur: 0.2 }), A.pose('cocoon', { rot: [0, 0, 0], dur: 0.2 }), A.say('!', 1)],
          [A.par(A.pose('cocoon', { scale: 1.12, dur: 0.6 }), A.effect('sparkle', { dur: 1.5 })), A.pose('cocoon', { scale: 1, dur: 0.6 })],
        ],
      })
      .done(),
  ),
  // A cup of black coffee on its saucer with a spoon that stirs.
  e('coffee', 'food', 'hot drinks', () =>
    m('coffee')
      .cyl([0.15, 0.012, 0.15], [0, 0.006, 0], { color: 'white' })
      .cyl([0.085, 0.065, 0.085], [0, 0.044, 0], { color: 'white', taper: 1.2 })
      .cyl([0.094, 0.008, 0.094], [0, 0.072, 0], { color: 'coffee', noInk: true })
      .torus([0.042, 0.042, 0.012], [0.056, 0.046, 0], { color: 'white', tube: 0.3 })
      .box([0.008, 0.075, 0.003], [0.026, 0.1, 0.02], { color: 'silver', rot: [-20, 0, -20], round: 0.5, name: 'spoon', pivot: [0, 0.07, 0], edge: 'sharp' })
      .ball([0.012, 0.018, 0.004], [0.014, 0.066, 0.008], { color: 'silver', rot: [-20, 0, -20], parent: 'spoon', edge: 'sharp' })
      .act({
        click: [
          [A.effect('steam', { dur: 2.5 }), A.say('Sip...', 1.5)],
          [A.pose('spoon', { spin: [0, 540, 0] }), A.say('Clink clink!', 1.5), A.wait(1.5), A.pose('spoon', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0.2 })],
        ],
      })
      .done(),
  ),
  // A wooden scoop heaped with roasted beans (each about a centimetre long, with its crease), a few spilled.
  e('coffee bean', 'food', 'coffee', () => {
    const b = m('coffee bean')
      .dome([0.07, 0.03, 0.08], [0, 0.015, 0], { color: 'lightwood', rot: [180, 0, 0], edge: 'sharp' })
      .rod([0, 0.02, -0.04], [0, 0.06, -0.11], 0.016, 'lightwood', { edge: 'sharp' });
    const bean = (at: V, r: V) => b.ball([0.012, 0.009, 0.016], at, { color: '#5a3418', rot: r }).box([0.0016, 0.0012, 0.013], [at[0], at[1] + 0.0042, at[2]], { color: '#24130a', rot: r, noInk: true });
    for (let i = 0; i < 9; i++) bean([((i % 3) - 1) * 0.017, 0.035 + (i === 4 ? 0.009 : 0), (Math.floor(i / 3) - 1) * 0.021], [rnd(i) * 30, rnd(i + 3) * 180, 0]);
    for (let i = 0; i < 4; i++) bean([((i % 2) - 0.5) * 0.017, 0.044, (Math.floor(i / 2) - 0.5) * 0.02], [rnd(i + 9) * 30, rnd(i + 5) * 180, 0]);
    bean([0.05, 0.0045, 0.03], [0, 20, 0]);
    bean([0.035, 0.0045, 0.05], [0, -50, 0]);
    return b.act({ click: [[A.effect('smoke', { dur: 1.5 }), A.say('Roasting...', 1.5)], [A.anim('bounce', 2), A.say('Rattle!', 1.2)]] }).done();
  }),
  // A pour-over: a pleated paper filter of grounds in a ceramic dripper on a mug; it drips and steams.
  e('coffee filter', 'kitchen', 'coffee', () => {
    const b = m('coffee filter')
      .cyl([0.085, 0.09, 0.085], [0, 0.045, 0], { color: '#3a6fb5' })
      .torus([0.055, 0.055, 0.012], [0.052, 0.048, 0], { color: '#3a6fb5', tube: 0.3 })
      .cyl([0.11, 0.008, 0.11], [0, 0.094, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.065, 0.07, 0.065], [0, 0.133, 0], { color: 'white', taper: 1.75 })
      .cyl([0.06, 0.07, 0.06], [0, 0.152, 0], { color: '#f6efe0', taper: 2.1 })
      .ball([0.105, 0.03, 0.105], [0, 0.18, 0], { color: '#4a2c1a' });
    around(10, 1).forEach(([x, z]) => b.rod([x * 0.031, 0.12, z * 0.031], [x * 0.062, 0.186, z * 0.062], 0.003, '#ddd2bc', { noInk: true }));
    return b.act({ click: [A.par(A.effect('steam', { dur: 3 }), A.say('Drip... drip...', 2.5))] }).done();
  }),
  // A wooden box mill: brass hopper on top, a crank that turns, a little drawer of grounds that slides out.
  e('coffee grinder', 'kitchen', 'coffee', () =>
    m('coffee grinder', { edge: 'sharp' })
      .box([0.13, 0.12, 0.13], [0, 0.06, 0], { color: 'wood', round: 0.1 })
      .box([0.14, 0.012, 0.14], [0, 0.124, 0], { color: 'darkwood', round: 0.3 })
      .box([0.1, 0.045, 0.012], [0, 0.04, 0.065], { color: 'darkwood', round: 0.2, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.07 } })
      .box([0.09, 0.03, 0.09], [0, 0.04, 0.02], { color: '#3a2414', parent: 'drawer' })
      .ball(0.012, [0, 0.04, 0.075], { color: 'brass', parent: 'drawer' })
      .cyl([0.1, 0.05, 0.1], [0, 0.155, 0], { color: 'brass', taper: 1.3, edge: 'soft' })
      .cyl([0.02, 0.04, 0.02], [0, 0.19, 0], { color: 'iron' })
      .stick([0, 0.21, 0], [0.09, 0.21, 0], 0.012, 'iron', { name: 'crank', pivot: [0, 0.21, 0], mover: { kind: 'spin', axis: 'y', amount: 360 } })
      .stick([0.09, 0.21, 0], [0.09, 0.24, 0], 0.01, 'iron', { parent: 'crank' })
      .ball([0.024, 0.04, 0.024], [0.09, 0.255, 0], { color: 'darkwood', parent: 'crank' })
      .act({
        click: [
          [A.operate('crank', 'on'), A.say('Grind, grind...', 2), A.wait(2.2), A.operate('crank', 'off')],
          [A.operate('drawer', 'out'), A.effect('dust', { dur: 1 }), A.wait(2), A.operate('drawer', 'in')],
        ],
      })
      .done(),
  ),
  // A glass carafe of coffee with a black collar, hinged lid and handle; it pours and steams.
  e('coffee pot', 'kitchen', 'coffee', () =>
    m('coffee pot')
      .cyl([0.14, 0.09, 0.14], [0, 0.045, 0], { color: 'coffee' })
      .cyl([0.14, 0.07, 0.14], [0, 0.125, 0], { color: GLASS, taper: 0.72 })
      .cyl([0.105, 0.035, 0.105], [0, 0.175, 0], { color: '#222222', edge: 'sharp' })
      .cone([0.04, 0.03, 0.03], [0, 0.18, 0.06], { color: '#222222', rot: [-70, 0, 0], edge: 'sharp' })
      .ball([0.095, 0.04, 0.095], [0, 0.194, 0], { color: '#222222', name: 'lid', pivot: [0, 0.192, -0.048], mover: { kind: 'swing', axis: 'x', amount: -60 } })
      .ball(0.02, [0, 0.214, 0], { color: '#222222', parent: 'lid' })
      .arc([0.09, 0.13, 0.024], [-0.085, 0.11, 0], { color: '#222222', arc: 180, rot: [0, 0, 90], tube: 0.22, edge: 'sharp' })
      .act({
        click: [
          [A.set({ tilt: -35, dur: 0.4 }), A.effect('steam', { dur: 1.5 }), A.wait(1.2), A.set({ tilt: 0, dur: 0.4 })],
          [A.operate('lid', 'open'), A.effect('steam', { dur: 1.5 }), A.wait(1.5), A.operate('lid', 'close')],
        ],
      })
      .done(),
  ),
  // A corner coffee shop at real size: green-and-cream striped awning, glass door that swings out, a big window,
  // a coffee-cup sign on a bracket, a bistro table with two chairs outside and a chalkboard.
  e('coffee shop', 'places', 'shops', () => {
    const b = shop('coffee shop', { w: 6.5, d: 6, wall: '#c99b6d', trim: '#f4ece0', sign: 'COFFEE', signBg: '#3b2414', door: '#3b2414', awn: ['#2e6b46', '#f4ece0'], upper: 0 });
    const fz = 3;
    b.rod([2.6, 3.9, fz], [2.6, 3.9, fz + 0.9], 0.05, '#2a2726')
      .cyl([0.8, 0.06, 0.8], [2.6, 3.4, fz + 0.75], { color: '#3b2414', rot: [0, 0, 90] })
      .cyl([0.5, 0.42, 0.5], [2.6, 3.4, fz + 0.75], { color: 'white', rot: [0, 0, 90], taper: 0.8 })
      .ball(0.18, [2.6, 3.62, fz + 0.75], { color: 'white', edge: 'soft' })
      .cyl([0.95, 0.04, 0.95], [-0.2, 0.74, fz + 1.9], { color: 'white' })
      .stick([-0.2, 0, fz + 1.9], [-0.2, 0.72, fz + 1.9], 0.06, '#2a2726')
      .cyl([0.45, 0.03, 0.45], [-0.2, 0.015, fz + 1.9], { color: '#2a2726' });
    b.pair((s) => {
      const cx = -0.2 + s * 0.75;
      b.box([0.42, 0.04, 0.42], [cx, 0.45, fz + 1.9], { color: '#2e6b46', round: 0.3 });
      b.box([0.04, 0.42, 0.4], [cx + s * 0.2, 0.68, fz + 1.9], { color: '#2e6b46', round: 0.3 });
      for (const dz of [-0.17, 0.17]) b.stick([cx - 0.17, 0, fz + 1.9 + dz], [cx - 0.17, 0.43, fz + 1.9 + dz], 0.025, '#2a2726').stick([cx + 0.17, 0, fz + 1.9 + dz], [cx + 0.17, 0.43, fz + 1.9 + dz], 0.025, '#2a2726');
    });
    b.box([0.6, 0.9, 0.04], [1.9, 0.5, fz + 1.3], { color: '#2a2726', rot: [-12, 0, 0], round: 0.1 })
      .label('LATTE 3.50', [0.48, 0.25], [1.9, 0.62, fz + 1.33], { color: '#2a2726', rot: [-12, 0, 0], depth: 0.01 })
      .rod([1.65, 0, fz + 1.12], [1.65, 0.95, fz + 1.32], 0.035, 'wood')
      .rod([2.15, 0, fz + 1.12], [2.15, 0.95, fz + 1.32], 0.035, 'wood')
      .socket('table', [-0.2, 0.76, fz + 1.9], 'top', { size: 0.5 })
      .socket('seat', [0.55, 0.47, fz + 1.9], 'seat');
    return b
      .act({
        setup: [A.spawn('cup', 'coffee'), A.attach('cup', 'self', 'table')],
        click: [
          [A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5), A.effect('steam', { dur: 2 }), A.wait(2.2), A.operate('door', 'close')],
          [A.effect('steam', { id: 'self.table', dur: 2.5 }), A.say('Grind... hiss... ding!', 2.5)],
        ],
      })
      .done();
  }),
  // A low wooden coffee table: top at 0.45 m, a drawer that slides out, a shelf of magazines underneath.
  e('coffee table', 'home', 'tables', () => {
    const b = m('coffee table', { edge: 'sharp' })
      .box([1.1, 0.05, 0.6], [0, 0.425, 0], { color: 'wood', round: 0.2 })
      .box([1.0, 0.08, 0.52], [0, 0.36, 0], { color: 'darkwood', round: 0.1 })
      .box([1.0, 0.025, 0.52], [0, 0.1, 0], { color: 'darkwood', round: 0.2 })
      .box([0.42, 0.06, 0.02], [0, 0.36, 0.265], { color: 'wood', round: 0.2, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.28 } })
      .box([0.4, 0.05, 0.42], [0, 0.36, 0.05], { color: 'lightwood', parent: 'drawer' })
      .ball(0.022, [0, 0.36, 0.28], { color: 'brass', parent: 'drawer' });
    for (const [x, z] of [[0.5, 0.25], [-0.5, 0.25], [0.5, -0.25], [-0.5, -0.25]]) b.box([0.05, 0.4, 0.05], [x, 0.2, z], { color: 'darkwood', round: 0.2 });
    b.box([0.3, 0.012, 0.22], [-0.25, 0.12, 0], { color: '#c0392b', round: 0.2, rot: [0, 12, 0] })
      .box([0.3, 0.012, 0.22], [-0.24, 0.132, 0.01], { color: '#4a90d9', round: 0.2, rot: [0, -6, 0] })
      .box([0.28, 0.03, 0.2], [0.28, 0.468, -0.05], { color: '#2a5bd7', round: 0.2, rot: [0, 15, 0] });
    return b
      .socket('top', [0.1, 0.45, 0.08], 'top', { size: 0.5 })
      .act({
        setup: [A.spawn('cup', 'coffee'), A.attach('cup', 'self', 'top')],
        click: [[A.operate('drawer', 'out'), A.wait(2), A.operate('drawer', 'in')], [A.anim('wobble'), A.say('Knock knock.', 1.2)]],
      })
      .done();
  }),
  // A drip coffee machine: water tank at the back, a filter head, a glass carafe on the warming plate. Switch it on
  // and the carafe fills.
  e('coffeemaker', 'kitchen', 'coffee', () =>
    m('coffeemaker', { edge: 'sharp' })
      .box([0.24, 0.03, 0.26], [0, 0.015, 0.02], { color: '#222222', round: 0.3 })
      .box([0.24, 0.36, 0.1], [0, 0.18, -0.08], { color: '#222222', round: 0.15 })
      .box([0.2, 0.22, 0.02], [0, 0.22, -0.135], { color: '#7fb6d8' })
      .box([0.24, 0.085, 0.26], [0, 0.32, 0.02], { color: '#222222', round: 0.2 })
      .box([0.2, 0.012, 0.22], [0, 0.368, 0.02], { color: '#333333', name: 'lid', pivot: [0, 0.368, -0.09], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .cyl([0.14, 0.05, 0.14], [0, 0.257, 0.05], { color: '#333333', taper: 0.7 })
      .cyl([0.13, 0.006, 0.13], [0, 0.034, 0.05], { color: '#555555' })
      .cyl([0.13, 0.11, 0.13], [0, 0.093, 0.05], { color: GLASS, taper: 0.75, edge: 'soft' })
      .cyl([0.125, 0.07, 0.125], [0, 0.072, 0.05], { color: 'coffee', name: 'brew', scale: 0, edge: 'soft' })
      .cyl([0.105, 0.025, 0.105], [0, 0.16, 0.05], { color: '#222222' })
      .arc([0.07, 0.09, 0.02], [0.085, 0.1, 0.05], { color: '#222222', arc: 180, rot: [0, 0, -90], tube: 0.25 })
      .box([0.05, 0.02, 0.012], [0.07, 0.3, 0.155], { color: '#111111' })
      .ball(0.012, [0.07, 0.3, 0.162], { color: 'red', glow: true, name: 'power', mover: { kind: 'light' } })
      .act({
        click: [
          [A.operate('power', 'on'), A.say('Gurgle gurgle...', 2.5), A.par(A.pose('brew', { scale: 1, dur: 3 }), A.effect('steam', { dur: 3 })), A.say('Beep!', 1.2)],
          [A.operate('power', 'off'), A.pose('brew', { scale: 0, dur: 0.8 })],
        ],
      })
      .done(),
  ),
  // A spooky coffin standing on its foot: the classic six-sided shape, a gold cross on the lid, red satin inside
  // that shows when the lid creaks open.
  e('coffin', 'fantasy', 'spooky', () => {
    const shape: Array<[number, number, number, number?]> = [[0, 0.6, 1, 0], [0.72, 1, 1, 0], [1, 0.68, 1, 0]];
    return m('coffin')
      .loft([0.68, 0.36, 2.0], [0, 1.0, -0.02], shape, { color: '#4a2c18', boxy: 0.95, rot: [-90, 0, 0], edge: 'sharp' })
      .loft([0.6, 0.06, 1.9], [0, 1.0, 0.17], shape, { color: '#a01828', boxy: 0.95, rot: [-90, 0, 0], edge: 'soft' })
      .loft([0.7, 0.06, 2.02], [0, 1.0, 0.2], shape, { color: '#5a3a22', boxy: 0.95, rot: [-90, 0, 0], name: 'lid', pivot: [-0.33, 1.0, 0.2], mover: { kind: 'swing', axis: 'y', amount: -110 }, edge: 'sharp' })
      .box([0.07, 0.6, 0.02], [0, 1.3, 0.24], { color: 'gold', round: 0.3, parent: 'lid', edge: 'sharp' })
      .box([0.34, 0.07, 0.02], [0, 1.45, 0.24], { color: 'gold', round: 0.3, parent: 'lid', edge: 'sharp' })
      .box([0.06, 0.25, 0.05], [0.35, 1.05, 0], { color: 'brass', round: 0.5, edge: 'sharp' })
      .box([0.06, 0.25, 0.05], [-0.35, 1.05, 0], { color: 'brass', round: 0.5, edge: 'sharp' })
      .act({ click: [A.operate('lid', 'open'), A.effect('smoke', { dur: 2 }), A.say('Creeeak...', 2), A.wait(2.2), A.operate('lid', 'close'), A.say('Thud!', 1)] })
      .done();
  }),
  // A real-size coin (27 mm) standing on its edge beside a little stack; flip it: heads, then tails.
  e('coin (money)', 'home', 'money', () => {
    const b = m('coin (money)', { edge: 'sharp' })
      .cyl([0.027, 0.0022, 0.027], [0, 0.0135, 0], { color: 'gold', rot: [90, 0, 0], name: 'coin' })
      .torus([0.027, 0.027, 0.0026], [0, 0.0135, 0], { color: '#c99a2e', tube: 0.08, parent: 'coin' })
      .ball([0.011, 0.012, 0.001], [0, 0.0135, 0.0012], { color: '#f2d26a', parent: 'coin', noInk: true });
    b.each(5, (i) => b.cyl([0.024, 0.0018, 0.024], [0.03, 0.0009 + i * 0.0019, 0.01], { color: i % 2 ? 'silver' : '#cfcfd4' }));
    return b.act({ click: [[A.anim('spin', 2), A.say('Heads!', 1.2)], [A.anim('spin', 2), A.say('Tails!', 1.2)]] }).done();
  }),
  // A snack vending machine: rows of snacks in coils behind the glass, a keypad with a lit display, a coin slot and
  // a push flap at the bottom. A coin goes in, a snack drops.
  e('coin machine', 'tech', 'machines', () => {
    const b = m('coin machine', { edge: 'sharp' })
      .box([0.95, 1.83, 0.85], [0, 0.95, 0], { color: '#c0392b', round: 0.05 })
      .box([0.62, 1.3, 0.02], [-0.12, 1.12, 0.43], { color: '#1e2a38' })
      .box([0.07, 1.4, 0.06], [0.22, 1.12, 0.44], { color: '#222222' })
      .box([0.24, 1.4, 0.03], [0.35, 1.12, 0.435], { color: '#2a2a2e' })
      .box([0.16, 0.06, 0.02], [0.35, 1.5, 0.455], { color: '#3a8f3a', glow: true, name: 'display', mover: { kind: 'light', on: true } })
      .box([0.03, 0.06, 0.02], [0.35, 1.08, 0.455], { color: '#111111' })
      .box([0.12, 0.05, 0.02], [0.35, 0.96, 0.455], { color: '#111111' })
      .label('SNACKS', [0.8, 0.14], [0, 1.95 - 0.1, 0.44], { color: '#2a2726', depth: 0.03 })
      .box([0.62, 0.2, 0.03], [-0.12, 0.3, 0.43], { color: '#1e1e1e' })
      .box([0.56, 0.16, 0.02], [-0.12, 0.3, 0.45], { color: '#333333', name: 'flap', pivot: [-0.12, 0.38, 0.45], mover: { kind: 'swing', axis: 'x', amount: -55 } });
    b.each(12, (i) => b.box([0.025, 0.025, 0.006], [0.31 + (i % 3) * 0.04, 1.4 - Math.floor(i / 3) * 0.06, 0.455], { color: '#d8d8d8', round: 0.3 }));
    for (let r = 0; r < 4; r++) {
      const y = 0.68 + r * 0.3;
      b.box([0.62, 0.015, 0.04], [-0.12, y - 0.1, 0.45], { color: 'silver' });
      b.each(4, (c) => {
        const at: V = [-0.36 + c * 0.16, y, 0.46];
        if (r === 1 && c === 2) b.box([0.11, 0.14, 0.03], at, { color: COLS[(r * 4 + c) % COLS.length], round: 0.3, name: 'snack' });
        else b.box([0.11, 0.14, 0.03], at, { color: COLS[(r * 4 + c + 3) % COLS.length], round: 0.3 });
        b.torus([0.1, 0.1, 0.012], [at[0], y - 0.05, 0.47], { color: 'silver', rot: [90, 0, 0], tube: 0.1, noInk: true });
      });
    }
    b.box([0.03, 1.3, 0.005], [-0.3, 1.12, 0.48], { color: 'white', rot: [0, 0, 20], noInk: true });
    for (const x of [0.4, -0.4]) b.box([0.08, 0.06, 0.7], [x, 0.03, 0], { color: '#222222' });
    return b
      .socket('slot', [0.35, 1.1, 0.46], 'slot', { size: 0.03 })
      .act({
        click: [
          A.spawn('c', 'coin (money)', { rel: 'front', of: 'self', dist: 'close' }),
          A.attach('c', 'self', 'slot'),
          A.say('Clink!', 1),
          A.remove('c', 'sink'),
          A.pose('snack', { move: [0, -0.68, 0], dur: 0.5 }),
          A.say('Clunk!', 1),
          A.operate('flap', 'open'),
          A.wait(1.5),
          A.operate('flap', 'close'),
          A.pose('snack', { move: [0, 0, 0], dur: 0 }),
        ],
      })
      .done();
  }),
  // A kiss-lock coin purse: soft pouch, gold frame with two little balls; it clicks open and a coin pops out.
  e('coin purse', 'wardrobe', 'bags', () =>
    m('coin purse')
      .box([0.12, 0.08, 0.05], [0, 0.04, 0], { color: '#d6456a', round: 0.9, name: 'pouch' })
      .arc([0.11, 0.03, 0.012], [0, 0.083, -0.006], { color: 'gold', arc: 180, tube: 0.4, edge: 'sharp' })
      .dome([0.11, 0.022, 0.03], [0, 0.074, 0.012], { color: '#c43a5c', name: 'clasp', parent: 'pouch', pivot: [0, 0.08, 0], mover: { kind: 'swing', axis: 'x', amount: 40 } })
      .arc([0.11, 0.03, 0.012], [0, 0.083, 0.008], { color: 'gold', arc: 180, tube: 0.4, parent: 'clasp', edge: 'sharp' })
      .ball(0.014, [-0.008, 0.103, -0.006], { color: 'gold', edge: 'sharp' })
      .ball(0.014, [0.008, 0.103, 0.008], { color: 'gold', parent: 'clasp', edge: 'sharp' })
      .ball([0.034, 0.03, 0.008], [0, 0.036, 0.026], { color: '#f2c94c', noInk: true })
      .act({ click: [A.operate('clasp', 'open'), A.say('Click!', 1), A.spawn('c', 'coin (money)', { rel: 'front', of: 'self', dist: 'close' }), A.wait(1.8), A.remove('c', 'pop'), A.operate('clasp', 'close')] })
      .done(),
  ),
  // A deli board: fanned salami, rolled ham, a wedge of cheese and parsley; a slice can be taken (and put back).
  e('cold cuts', 'food', 'meat', () => {
    const b = m('cold cuts').box([0.34, 0.02, 0.2], [0, 0.01, 0], { color: 'lightwood', round: 0.3, name: 'board', edge: 'sharp' });
    b.each(5, (i) => b.cyl([0.075, 0.006, 0.075], [-0.12 + i * 0.03, 0.03, -0.04], { color: i % 2 ? '#d9707a' : '#b8303a', rot: [55, 0, 0] }));
    b.each(4, (i) => b.ball(0.008, [-0.12 + i * 0.03, 0.04, -0.03], { color: '#f4dede', noInk: true }));
    return b
      .cyl([0.075, 0.006, 0.075], [0.04, 0.03, -0.04], { color: '#b8303a', rot: [55, 0, 0], name: 'slice', parent: 'board', piece: true })
      .capsule([0.03, 0.09, 0.03], [0.02, 0.035, 0.05], { color: '#f2a5a5', rot: [0, 0, 90] })
      .capsule([0.03, 0.09, 0.03], [0.03, 0.06, 0.045], { color: '#f6b8b0', rot: [0, 20, 90] })
      .wedge([0.06, 0.04, 0.05], [0.12, 0.04, 0.03], { color: 'cheese', rot: [0, 30, 0] })
      .ball([0.04, 0.02, 0.03], [-0.1, 0.03, 0.06], { color: '#3f8f3a' })
      .act({ click: [[A.detach('slice', 'bite'), A.say('Nom!', 1)], [A.reattach('slice')]] })
      .done();
  }),
  // A blue gel ice pack with a snowflake; it is freezing.
  e('cold pack', 'clinic', 'first aid', () => {
    const b = m('cold pack').box([0.18, 0.14, 0.035], [0, 0.07, 0], { color: '#3a8fd8', round: 0.7, rot: [-8, 0, 0] });
    b.each(3, (i) => b.box([0.09, 0.012, 0.006], [0, 0.075, 0.022], { color: 'white', rot: [-8, 0, i * 60], noInk: true }));
    return b
      .ball(0.018, [0, 0.075, 0.024], { color: 'white', noInk: true })
      .act({ click: [[A.effect('snow', { dur: 2 }), A.say('Brrr!', 1.5)], [A.anim('wobble'), A.say('Squish!', 1)]] })
      .done();
  }),
  // A bowl of creamy slaw with shredded carrot and red cabbage; the fork lifts a crunchy forkful.
  e('coleslaw', 'food', 'sides', () => {
    const b = bowl('coleslaw', 'white', '#eef0c8');
    b.each(8, (i) => b.rod([-0.05 + i * 0.014, 0.083, -0.02 + (i % 3) * 0.02], [-0.03 + i * 0.014, 0.085, 0.02 - (i % 2) * 0.03], 0.006, i % 2 ? 'orange' : 'purple', { noInk: true }));
    return b
      .stick([0.01, 0.075, 0.01], [0.09, 0.15, 0.03], 0.008, 'silver', { name: 'fork', piece: true, edge: 'sharp' })
      .box([0.03, 0.004, 0.04], [0.004, 0.075, 0.005], { color: 'silver', rot: [0, 20, 0], parent: 'fork', edge: 'sharp' })
      .act({ click: [A.pose('fork', { move: [0, 0.07, 0], dur: 0.4 }), A.say('Crunch!', 1.2), A.pose('fork', { move: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A bunch of big collard leaves on pale stems, held with a rubber band.
  e('collard greens', 'food', 'vegetables', () => {
    const b = m('collard greens').cyl([0.05, 0.1, 0.05], [0, 0.05, 0], { color: '#b5d68a' }).cyl([0.056, 0.02, 0.056], [0, 0.07, 0], { color: 'red' });
    b.each(6, (i) => {
      const a = ((-50 + i * 20) * Math.PI) / 180, z = i % 2 ? 0.025 : -0.025;
      const root: V = [0, 0.1, z * 0.3], tip: V = [Math.sin(a) * 0.26, 0.1 + Math.cos(a) * 0.26, z];
      blade(b, [root[0] + Math.sin(a) * 0.05, root[1] + Math.cos(a) * 0.05, root[2]], tip, 0.15, 0.012, i % 2 ? '#2f6b2a' : '#3f7f35');
      b.rod(root, [tip[0] * 0.85, 0.1 + (tip[1] - 0.1) * 0.85, z + 0.008], 0.006, '#b5d68a', { noInk: true });
    });
    return b.act({ click: [A.anim('wobble'), A.say('Crunch!', 1.2)] }).done();
  }),
  // A red-brick college at real size: three storeys of windows, a columned portico with a pediment and steps, and
  // a clock tower with a cupola. The minute hand goes round as the bell strikes.
  e('college', 'places', 'schools', () => {
    const fz = 5, top = 3 * 3.4 + 0.4;
    const b = tower('college', { w: 20, d: 10, floors: 3, st: 3.4, wall: '#b5583a', trim: '#efe6d2', cols: 9, sign: 'COLLEGE', signBg: '#1e3a5f', double: true, roof: '#4a4f57' });
    b.each(4, (i) => b.cyl([0.6, 6.4, 0.6], [-2.7 + i * 1.8, 3.6, fz + 1.7], { color: '#efe6d2', segs: 12 }));
    b.box([6.4, 0.6, 2.4], [0, 7.1, fz + 1.2], { color: '#efe6d2', round: 0.1 })
      .wedge([6.8, 1.5, 2.5], [0, 8.15, fz + 1.2], { color: '#efe6d2' })
      .wedge([5.6, 1.0, 0.1], [0, 8.0, fz + 2.48], { color: '#d8ccb4' })
      .box([7, 0.2, 3.2], [0, 0.3, fz + 1.4], { color: '#c8c0b0' })
      .box([7.4, 0.15, 0.6], [0, 0.1, fz + 3.2], { color: '#c8c0b0' })
      .box([3.4, 4.6, 3.4], [0, top + 2.3, 0], { color: '#b5583a', round: 0.02 })
      .box([3.7, 0.3, 3.7], [0, top + 4.7, 0], { color: '#efe6d2' })
      .cyl([2.1, 0.12, 2.1], [0, top + 2.6, 1.72], { color: 'white', rot: [90, 0, 0] })
      .torus([2.2, 2.2, 0.14], [0, top + 2.6, 1.74], { color: '#1e3a5f', tube: 0.08 })
      .box([0.1, 0.65, 0.04], [0, top + 2.88, 1.8], { color: '#1e1e1e', name: 'hour', pivot: [0, top + 2.6, 1.8] })
      .box([0.07, 0.9, 0.04], [0, top + 3.0, 1.83], { color: '#1e1e1e', name: 'minute', pivot: [0, top + 2.6, 1.83] });
    b.pair((s) => b.box([0.9, 1.4, 0.1], [s * 0.85, top + 4.0, 1.72], { color: '#2a2320', round: 0.3 }));
    return b
      .prism([2.6, 1.2, 2.6], [0, top + 5.45, 0], 8, { color: '#efe6d2' })
      .dome([2.7, 1.7, 2.7], [0, top + 6.05, 0], { color: '#5f8f7a', edge: 'soft' })
      .cone([0.25, 1.6, 0.25], [0, top + 8.4, 0], { color: 'gold' })
      .act({
        click: [
          [A.pose('minute', { rot: [0, 0, -360], dur: 2 }), A.say('Dong! Dong! Dong!', 2.5), A.pose('minute', { rot: [0, 0, 0], dur: 0 })],
          [A.operate('door', 'open'), A.say('Ring-ring!', 1.5), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A pencil pot of real-size colored pencils (17.5 cm, hexagonal, sharpened); the red one comes up to scribble.
  e('colored pencil', 'study', 'art supplies', () => {
    const b = m('colored pencil')
      .cyl([0.085, 0.1, 0.085], [0, 0.05, 0], { color: '#3fa7a0' })
      .cyl([0.075, 0.004, 0.075], [0, 0.1, 0], { color: '#2a2726', noInk: true });
    const cols = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    cols.forEach((c, i) => {
      const a = (i / cols.length) * Math.PI * 2, r = 0.022, lean = 0.05 + (i % 2) * 0.03;
      const base: V = [Math.cos(a) * r, 0.01, Math.sin(a) * r];
      const d: V = [Math.cos(a) * lean, 1, Math.sin(a) * lean];
      const n = Math.hypot(d[0], d[1], d[2]), L = 0.16 + (i % 3) * 0.01;
      const end: V = [base[0] + (d[0] / n) * L, base[1] + (d[1] / n) * L, base[2] + (d[2] / n) * L];
      const tip: V = [end[0] + (d[0] / n) * 0.022, end[1] + (d[1] / n) * 0.022, end[2] + (d[2] / n) * 0.022];
      const o = i === 0 ? { name: 'pencil', piece: true } : {};
      b.stick(base, end, 0.008, c, { segs: 6, ...o });
      const p = i === 0 ? { parent: 'pencil' } : {};
      b.stick(end, tip, 0.008, '#f0d2a0', { taper: 0.3, ...p });
      b.stick([end[0] + (tip[0] - end[0]) * 0.7, end[1] + (tip[1] - end[1]) * 0.7, end[2] + (tip[2] - end[2]) * 0.7], tip, 0.003, c, { taper: 0.2, ...p });
    });
    return b.act({ click: [A.pose('pencil', { move: [0, 0.07, 0], dur: 0.4 }), A.pose('pencil', { move: [0.02, 0.07, 0], rot: [0, 0, 10], dur: 0.2 }), A.pose('pencil', { move: [-0.02, 0.07, 0], rot: [0, 0, -10], dur: 0.2 }), A.say('Scribble!', 1.2), A.pose('pencil', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A coloring book with outline pictures on the cover and a crayon beside it; the cover opens.
  e('coloring book', 'study', 'books', () =>
    standBook('coloring book', '#f7d23e', 'COLOR ME', 0.22, 0.28, 0.012, '#e0a020')
      .star(0.07, [-0.05, 0.12, 0.009], { color: 'red', parent: 'cover' })
      .heart(0.06, [0.05, 0.13, 0.009], { color: 'blue', parent: 'cover' })
      .ball([0.05, 0.05, 0.006], [0.0, 0.055, 0.009], { color: 'green', parent: 'cover' })
      .cyl([0.01, 0.08, 0.01], [0.14, 0.006, 0.05], { color: 'red', rot: [90, 30, 0] })
      .act({ click: [A.operate('cover', 'open'), A.effect('sparkle', { dur: 1.5 }), A.wait(2), A.operate('cover', 'close')] })
      .done(),
  ),
  // The Colosseum as a miniature-park landmark in its real proportions (189 x 156 x 48 m scaled to 48 m long): an
  // elliptical wall of three arcaded tiers and an attic, broken down on one side, tiers of seats round a sand arena.
  // (The vocabulary's 0.48 m is a toy; the town shows landmarks at park size, so the height warning stays.)
  e('colosseum', 'places', 'landmarks', () => {
    const a = 24, bb = 19.8, H = 12.3, N = 22, st = '#d8c4a0';
    const b = m('colosseum', { edge: 'sharp' })
      .cyl([a * 2 + 4, 0.3, bb * 2 + 4], [0, 0.15, 0], { color: '#cbb894' })
      .cyl([30, 0.4, 20], [0, 0.35, 0], { color: 'sand', edge: 'soft' });
    [[0.86, 2.4, 3], [0.74, 4.4, 2.6], [0.62, 6.4, 2.2]].forEach(([k, y, t]) => b.torus([a * 2 * k, bb * 2 * k, t * 2], [0, y, 0], { color: '#bfae8c', rot: [90, 0, 0], tube: (t / (a * k)) * 1.2 }));
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2, x = a * Math.cos(th), z = bb * Math.sin(th);
      const tx = -a * Math.sin(th), tz = bb * Math.cos(th), tl = Math.hypot(tx, tz);
      const yaw = (Math.atan2(-tz, tx) * 180) / Math.PI;
      const nx = Math.cos(th) / a, nz = Math.sin(th) / bb, nl = Math.hypot(nx, nz);
      const seg = (tl * Math.PI * 2) / N + 0.4;
      const broken = th > 3.4 && th < 4.9;
      const hh = broken ? 7.4 - Math.abs(th - 4.15) * 1.2 : H;
      b.box([seg, hh, 1.8], [x, hh / 2, z], { color: i % 2 ? st : '#d2bd98', rot: [0, yaw, 0], round: 0.05 });
      const tiers = broken ? 2 : 3;
      for (let t = 0; t < tiers; t++) b.box([seg * 0.5, 2.3, 0.1], [x + (nx / nl) * 0.92, 1.5 + t * 3.3, z + (nz / nl) * 0.92], { color: '#5a4a38', rot: [0, yaw, 0], round: 0.3 });
      if (!broken) b.box([seg * 0.22, 0.8, 0.1], [x + (nx / nl) * 0.92, 11.2, z + (nz / nl) * 0.92], { color: '#6a5a46', rot: [0, yaw, 0] });
    }
    return b.act({ click: [A.par(A.effect('dust', { dur: 2.5 }), A.say('Roooar!', 2))] }).done();
  }),
  // A brown pocket comb, fine teeth at one end; run it and it zips.
  e('comb', 'home', 'bathroom', () => {
    const b = m('comb', { edge: 'sharp' }).box([0.17, 0.026, 0.006], [0, 0.065, 0], { color: '#5a3a22', round: 0.4 });
    b.each(20, (i) => b.box([0.0035, i < 10 ? 0.05 : 0.044, 0.005], [-0.078 + i * 0.0082, i < 10 ? 0.029 : 0.032, 0], { color: '#5a3a22', round: 0.3 }));
    return b.act({ click: [A.par(A.anim('wobble'), A.say('Zzzip!', 1.2))] }).done();
  }),
  // A pair of black lace-up combat boots: lugged soles, toe caps, padded collars, crossed laces.
  e('combat boots', 'wardrobe', 'shoes', () => {
    const b = m('combat boots');
    b.pair((s) => {
      const x = s * 0.075;
      b.box([0.11, 0.035, 0.3], [x, 0.0175, 0.02], { color: '#1a1a1a', round: 0.25, edge: 'sharp' });
      b.each(4, (i) => b.box([0.112, 0.01, 0.02], [x, 0.004, -0.09 + i * 0.07], { color: '#0e0e0e', edge: 'sharp' }));
      b.box([0.105, 0.095, 0.24], [x, 0.08, 0.035], { color: '#2f2f28', round: 0.7 });
      b.ball([0.1, 0.08, 0.1], [x, 0.065, 0.12], { color: '#262620' });
      b.cyl([0.11, 0.2, 0.12], [x, 0.2, -0.05], { color: '#2f2f28' });
      b.cyl([0.12, 0.03, 0.13], [x, 0.3, -0.05], { color: '#1e1e1a' });
      b.box([0.03, 0.04, 0.01], [x, 0.31, -0.115], { color: '#1e1e1a', round: 0.4 });
      b.box([0.05, 0.2, 0.012], [x, 0.18, 0.012], { color: '#26261f', round: 0.4 });
      b.each(5, (i) => {
        const y = 0.1 + i * 0.04, z = 0.018 - Math.max(0, 0.1 - y) * 0.6;
        b.rod([x - 0.025, y, z], [x + 0.025, y + 0.02, z], 0.004, 'tan', { noInk: true });
        b.rod([x + 0.025, y, z], [x - 0.025, y + 0.02, z], 0.004, 'tan', { noInk: true });
      });
    });
    return b.act({ click: [A.anim('hop'), A.effect('dust', { dur: 1 }), A.say('Stomp!', 1)] }).done();
  }),
  // A comedy club: a dark purple front, a marquee of bulbs over the door that chase on and off, posters, a star.
  e('comedy club', 'places', 'entertainment', () => {
    const b = shop('comedy club', { w: 7, d: 7, h: 4.6, wall: '#4a2f5a', trim: '#2a1a33', sign: 'COMEDY CLUB', signBg: '#1e0f24', door: 'darkred', roof: '#2a1a33' });
    const fz = 3.5, dx = -2.5;
    b.box([1.9, 0.3, 1.2], [dx, 2.55, fz + 0.6], { color: '#2a1a33', round: 0.1 });
    b.each(8, (i) => b.ball(0.11, [dx - 0.85 + i * 0.243, 2.38, fz + 1.22], { color: '#fff2a0', glow: true, name: `bulb${i}`, mover: { kind: 'light', on: true } }));
    b.pair((s) => b.each(3, (i) => b.ball(0.11, [dx + s * 0.95, 2.38, fz + 0.3 + i * 0.3], { color: '#fff2a0', glow: true })));
    for (const x of [-0.6, 2.4]) b.box([1.0, 1.4, 0.06], [x, 1.5, fz + 0.15], { color: '#f2c14e', round: 0.1 }).label('TONIGHT', [0.8, 0.25], [x, 1.9, fz + 0.2], { color: '#c0392b', depth: 0.01 }).ball([0.45, 0.45, 0.04], [x, 1.25, fz + 0.2], { color: 'white' });
    b.star(2.2, [1.2, 5.9, 0], { color: 'gold' });
    b.stick([1.2, 4.9, 0], [1.2, 4.95, 0], 0.4, '#2a1a33');
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ba-dum tss!', 2), A.wait(2), A.operate('door', 'close')],
          [A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.wait(0.3), A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.say('Ha ha ha!', 1.5)],
        ],
      })
      .done();
  }),
  // The golden laughing mask of comedy on a stick, ribbons trailing; it shakes with laughter.
  e('comedy mask', 'ideas', 'theatre', () => {
    const b = m('comedy mask')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0, 0], [0, 0.13, 0], 0.016, 'darkwood', { edge: 'sharp' })
      .ball([0.2, 0.25, 0.08], [0, 0.25, 0], { color: 'gold' })
      .ball([0.05, 0.04, 0.04], [0, 0.235, 0.04], { color: '#e8b830' })
      .arc([0.12, 0.08, 0.025], [0, 0.185, 0.03], { color: '#3a1a0a', arc: 160, rot: [0, 0, 180], tube: 0.4 });
    b.pair((s) => {
      b.arc([0.05, 0.03, 0.02], [s * 0.048, 0.29, 0.032], { color: '#3a1a0a', arc: 160, tube: 0.4 });
      b.ball([0.034, 0.022, 0.01], [s * 0.066, 0.215, 0.034], { color: '#f2a07a', noInk: true });
      b.ball([0.06, 0.02, 0.012], [s * 0.05, 0.33, 0.03], { color: '#d49a20', rot: [0, 0, s * -15] });
      b.rod([s * 0.1, 0.26, -0.01], [s * 0.15, 0.15, -0.02], 0.012, 'red');
      b.rod([s * 0.15, 0.15, -0.02], [s * 0.13, 0.06, -0.01], 0.01, 'red');
    });
    return b.act({ click: [A.par(A.anim('bounce', 2), A.say('Ha ha ha!', 1.8))] }).done();
  }),
  // A comic book with a POW burst and a speech bubble on its cover; the cover flips open.
  e('comic book', 'study', 'books', () =>
    standBook('comic book', '#e8413a', 'COMICS!', 0.17, 0.26, 0.01, '#b02a20')
      .star(0.11, [0.025, 0.1, 0.008], { color: 'yellow', parent: 'cover' })
      .ball([0.07, 0.05, 0.006], [-0.035, 0.17, 0.008], { color: 'white', parent: 'cover' })
      .cone([0.02, 0.03, 0.006], [-0.045, 0.14, 0.008], { color: 'white', rot: [0, 0, 160], parent: 'cover' })
      .act({ click: [A.operate('cover', 'open'), A.say('POW!', 1.5), A.wait(1.5), A.operate('cover', 'close')] })
      .done(),
  ),
  // A two-storey comic shop: bright blue walls, a red sign, a giant POW burst on the upper floor.
  e('comic book store', 'places', 'shops', () =>
    shop('comic book store', { w: 6, d: 6, h: 7.4, wall: '#3d7cc9', trim: '#ffd23e', sign: 'COMICS', signBg: '#e8413a', door: '#e8413a', upper: 1 })
      .star(2.4, [1.4, 5.0, 3.1], { color: 'yellow' })
      .star(1.6, [1.4, 5.0, 3.16], { color: '#e8413a' })
      .ball([1.8, 1.1, 0.2], [-1.4, 5.3, 3.1], { color: 'white', edge: 'soft' })
      .cone([0.5, 0.6, 0.15], [-1.0, 4.65, 3.1], { color: 'white', rot: [0, 0, 150] })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('POW!', 1.5), A.wait(2), A.operate('door', 'close')],
          [A.par(A.anim('shake'), A.effect('sparkle', { dur: 1.5 }), A.say('KA-BOOM!', 1.5))],
        ],
      })
      .done(),
  ),
  // A brass pocket compass, lid open: its needle swings round and settles on north; the lid snaps shut and open.
  e('compass', 'sports', 'camping', () =>
    m('compass', { edge: 'sharp' })
      .cyl([0.056, 0.012, 0.056], [0, 0.006, 0], { color: 'brass' })
      .cyl([0.048, 0.002, 0.048], [0, 0.0125, 0], { color: 'cream' })
      .torus([0.05, 0.05, 0.004], [0, 0.013, 0], { color: '#a8843a', rot: [90, 0, 0], tube: 0.1 })
      .box([0.004, 0.001, 0.034], [0, 0.0145, 0], { color: 'red', name: 'needle', piece: true })
      .box([0.0042, 0.0012, 0.017], [0, 0.0148, -0.0085], { color: 'navy', parent: 'needle' })
      .ball(0.005, [0, 0.0152, 0], { color: 'gold', parent: 'needle' })
      .cyl([0.056, 0.006, 0.056], [0, 0.047, -0.03], { color: 'brass', rot: [90, 0, 0], name: 'lid', pivot: [0, 0.019, -0.03], mover: { kind: 'swing', axis: 'x', amount: 88 } })
      .cyl([0.046, 0.002, 0.046], [0, 0.047, -0.026], { color: '#d8e4ea', rot: [90, 0, 0], parent: 'lid' })
      .torus([0.012, 0.012, 0.003], [0, 0.079, -0.03], { color: 'brass', parent: 'lid' })
      .act({
        click: [
          [A.pose('needle', { rot: [0, 420, 0], dur: 0.9 }), A.pose('needle', { rot: [0, 330, 0], dur: 0.4 }), A.pose('needle', { rot: [0, 372, 0], dur: 0.3 }), A.pose('needle', { rot: [0, 360, 0], dur: 0.3 }), A.pose('needle', { rot: [0, 0, 0], dur: 0 })],
          [A.operate('lid'), A.say('Snap!', 1), A.wait(1), A.operate('lid')],
        ],
      })
      .done(),
  ),
  // A slatted wooden compost bin heaped with dark compost and kitchen scraps, a fork leaning on it; it steams, and
  // a worm comes up for a look.
  e('compost', 'garden', 'garden things', () => {
    const b = m('compost').ball([0.9, 0.6, 0.8], [0, 0.42, 0], { color: '#4a3420' });
    b.each(5, (i) => b.box([1.04, 0.12, 0.03], [0, 0.08 + i * 0.16, -0.5], { color: 'wood', round: 0.2, edge: 'sharp' }));
    b.pair((s) => b.each(5, (i) => b.box([0.03, 0.12, 1.0], [s * 0.52, 0.08 + i * 0.16, 0], { color: 'wood', round: 0.2, edge: 'sharp' })));
    b.each(3, (i) => b.box([1.04, 0.12, 0.03], [0, 0.08 + i * 0.16, 0.5], { color: 'wood', round: 0.2, edge: 'sharp' }));
    for (const [x, z] of [[0.52, 0.5], [-0.52, 0.5], [0.52, -0.5], [-0.52, -0.5]]) b.box([0.07, 0.9, 0.07], [x, 0.45, z], { color: 'darkwood', edge: 'sharp' });
    b.ball([0.14, 0.03, 0.06], [-0.15, 0.73, 0.1], { color: 'banana', rot: [0, 30, 10] })
      .ball([0.1, 0.03, 0.07], [0.12, 0.7, 0.16], { color: 'lime', rot: [0, -20, -10] })
      .ball(0.05, [0.22, 0.66, 0.24], { color: 'red' })
      .ball([0.05, 0.03, 0.04], [-0.25, 0.65, 0.22], { color: 'white' })
      .capsule([0.016, 0.06, 0.016], [0.0, 0.7, 0.2], { color: '#e08a8a', name: 'worm', piece: true })
      .stick([0.6, 0, 0.52], [0.42, 1.25, 0.56], 0.03, 'wood', { edge: 'sharp' });
    b.each(4, (i) => b.stick([0.6 + (i - 1.5) * 0.04, 0.0, 0.52], [0.6 + (i - 1.5) * 0.04 - 0.01, 0.22, 0.52], 0.01, 'steel', { edge: 'sharp' }));
    return b
      .act({ click: [A.par(A.effect('steam', { dur: 2.5 }), A.pose('worm', { move: [0, 0.07, 0], dur: 0.6 })), A.say('!', 1), A.wait(1.2), A.pose('worm', { move: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A desktop computer at real size: a 24-inch monitor on its stand, a keyboard, a mouse and a tower case with a
  // power light. Click it and it reboots.
  e('computer', 'tech', 'computers', () => {
    const b = m('computer', { edge: 'sharp' })
      .box([0.56, 0.34, 0.035], [0, 0.36, -0.06], { color: '#222326', round: 0.15 })
      .box([0.52, 0.29, 0.01], [0, 0.365, -0.04], { color: '#4fa3e0', glow: true, name: 'screen', mover: { kind: 'light', on: true } })
      .box([0.2, 0.1, 0.006], [-0.12, 0.42, -0.034], { color: 'white', glow: true, parent: 'screen' })
      .box([0.14, 0.12, 0.006], [0.14, 0.33, -0.034], { color: '#f2c94c', glow: true, parent: 'screen' })
      .box([0.05, 0.19, 0.03], [0, 0.11, -0.09], { color: '#2a2b2e', round: 0.3 })
      .box([0.24, 0.015, 0.18], [0, 0.0075, -0.08], { color: '#2a2b2e', round: 0.3 })
      .box([0.44, 0.022, 0.14], [0, 0.011, 0.17], { color: '#d8d8dc', round: 0.3 })
      .box([0.08, 0.035, 0.11], [0.32, 0.017, 0.18], { color: '#d8d8dc', round: 0.8, edge: 'soft' })
      .box([0.2, 0.45, 0.45], [-0.45, 0.225, -0.05], { color: '#2a2b2e', round: 0.08 })
      .box([0.004, 0.08, 0.004], [-0.45, 0.38, 0.176], { color: '#555555' })
      .ball(0.014, [-0.45, 0.4, 0.178], { color: 'cyan', glow: true });
    b.each(4, (r) => b.each(12, (c) => b.box([0.026, 0.006, 0.024], [-0.18 + c * 0.033, 0.024, 0.12 + r * 0.03], { color: '#f2f2f2', round: 0.3 })));
    return b.act({ click: [A.operate('screen', 'off'), A.say('Whirr...', 1.2), A.wait(1), A.operate('screen', 'on'), A.say('Bing!', 1.2)] }).done();
  }),
  // A real-size mouse (11 cm) on its pad: two buttons, a scroll wheel that spins, a cable.
  e('computer mouse', 'tech', 'computers', () =>
    m('computer mouse')
      .box([0.22, 0.004, 0.18], [0, 0.002, 0], { color: '#2a4a8a', round: 0.3, edge: 'sharp' })
      .ball([0.062, 0.04, 0.11], [0, 0.022, 0], { color: '#e8e8e8' })
      .box([0.002, 0.008, 0.045], [0, 0.04, 0.028], { color: '#555555', noInk: true })
      .cyl([0.012, 0.006, 0.012], [0, 0.042, 0.024], { color: '#333333', rot: [0, 0, 90], name: 'wheel', mover: { kind: 'spin', axis: 'x', amount: 720 } })
      .rod([0, 0.01, 0.055], [0.02, 0.006, 0.11], 0.004, '#333333')
      .rod([0.02, 0.006, 0.11], [0.08, 0.005, 0.2], 0.004, '#333333')
      .act({ click: [A.operate('wheel', 'on'), A.say('Click! Scroll...', 1.5), A.wait(1.2), A.operate('wheel', 'off')] })
      .done(),
  ),
  // A snack kiosk: counter at 1.05 m, a top-hinged serving hatch propped open as a canopy, a popcorn machine,
  // drink cups, a menu board and a sign on the roof.
  e('concession stand', 'places', 'stands', () => {
    const fz = 1.1;
    const b = m('concession stand', { edge: 'sharp' })
      .box([3.0, 1.05, 2.2], [0, 0.525, 0], { color: '#e8413a', round: 0.05 })
      .box([3.1, 0.06, 2.3], [0, 1.08, 0.05], { color: 'white', round: 0.2 })
      .box([3.0, 1.6, 0.1], [0, 1.9, -1.05], { color: '#e8413a' })
      .box([3.1, 0.15, 2.4], [0, 2.78, 0], { color: 'white', round: 0.2 })
      .box([3.0, 0.5, 0.1], [0, 2.47, fz - 0.05], { color: '#e8413a' })
      .label('SNACKS', [2.2, 0.55], [0, 3.15, 0.2], { color: '#f2c14e', depth: 0.1 })
      .box([2.8, 0.06, 1.2], [0, 2.22, fz + 0.5], { color: '#f2c14e', round: 0.2, name: 'hatch', pivot: [0, 2.22, fz], mover: { kind: 'swing', axis: 'x', amount: 75 }, rot: [-20, 0, 0] })
      .label('POPCORN  SODA  HOT DOGS', [2.4, 0.3], [0, 2.0, -0.99], { color: '#2a2726', depth: 0.02 });
    b.pair((s) => b.box([0.1, 1.6, 2.2], [s * 1.45, 1.9, 0], { color: '#e8413a' }));
    b.each(6, (i) => b.box([0.5, 0.25, 0.04], [-1.25 + i * 0.5, 0.75, fz + 0.03], { color: i % 2 ? 'white' : '#e8413a', round: 0.1 }));
    b.box([0.5, 0.55, 0.45], [-0.8, 1.38, 0.2], { color: GLASS, round: 0.1 })
      .box([0.52, 0.12, 0.47], [-0.8, 1.72, 0.2], { color: '#c0392b', round: 0.2 })
      .ball([0.42, 0.25, 0.38], [-0.8, 1.3, 0.2], { color: '#fff3b0', edge: 'soft' })
      .box([0.4, 0.25, 0.3], [0.9, 1.25, 0.3], { color: '#3a3633', round: 0.1 });
    b.each(3, (i) => b.cyl([0.09, 0.16, 0.09], [0.1 + i * 0.14, 1.19, 0.5], { color: i % 2 ? 'white' : 'red', taper: 1.3, edge: 'soft' }));
    return b
      .act({
        click: [
          [A.effect('steam', { dur: 2 }), A.say('Pop pop pop!', 2)],
          [A.operate('hatch'), A.say('Clack!', 1), A.wait(1.5), A.operate('hatch')],
        ],
      })
      .done();
  }),
  // Concrete on a building site: a fresh slab in its wooden formwork being troweled smooth, a cast column with
  // rebar sticking out, cement bags on a pallet and a bucket.
  e('concrete', 'workshop', 'building materials', () => {
    const b = m('concrete', { edge: 'sharp' })
      .box([2.2, 0.16, 1.6], [0, 0.08, 0], { color: '#a8a8a4', round: 0.05, edge: 'soft' })
      .box([0.45, 3.0, 0.45], [-0.6, 1.5, -0.45], { color: '#b5b5b0', round: 0.03 });
    b.pair((s) => b.box([2.3, 0.22, 0.05], [0, 0.11, s * 0.825], { color: 'wood' }).box([0.05, 0.22, 1.7], [s * 1.13, 0.11, 0], { color: 'wood' }));
    for (const [x, z] of [[-0.72, -0.57], [-0.48, -0.57], [-0.72, -0.33], [-0.48, -0.33]]) b.stick([x, 3.0, z], [x, 3.45, z], 0.025, '#8a4a2a');
    b.box([0.04, 0.012, 0.18], [0.3, 0.18, 0.3], { color: 'steel', name: 'trowel', piece: true })
      .box([0.2, 0.008, 0.12], [0.3, 0.17, 0.3], { color: 'silver', parent: 'trowel' })
      .rod([0.3, 0.19, 0.26], [0.3, 0.27, 0.26], 0.025, 'wood', { parent: 'trowel' })
      .box([1.0, 0.12, 0.8], [1.8, 0.06, 0.2], { color: 'wood' });
    b.each(4, (i) => b.box([0.45, 0.14, 0.32], [1.6 + (i % 2) * 0.46, 0.19 + Math.floor(i / 2) * 0.15, 0.2 + (i % 2 ? 0.04 : -0.04)], { color: '#d9d3c4', round: 0.5, edge: 'soft' }));
    return b
      .label('CEMENT', [0.36, 0.08], [1.6, 0.34, 0.37], { color: '#d9d3c4', depth: 0.01 })
      .cyl([0.3, 0.32, 0.3], [1.3, 0.16, -0.55], { color: '#3a3633', taper: 1.15 })
      .cyl([0.3, 0.02, 0.3], [1.3, 0.3, -0.55], { color: '#9a9a96', noInk: true })
      .act({ click: [A.pose('trowel', { move: [0.3, 0, 0], dur: 0.5 }), A.pose('trowel', { move: [-0.3, 0, 0.1], dur: 0.7 }), A.pose('trowel', { move: [0, 0, 0], dur: 0.5 }), A.say('Scrape, scrape.', 1.5)] })
      .done();
  }),
  // A concrete mixer truck at real size (9.5 m): a cab with doors, glass and lights, three axles of wheels, and the
  // tilted drum with its spiral stripes that turns about its own axis; the chute swings out to pour.
  e('concrete mixer', 'garage', 'construction vehicles', () => {
    const b = m('concrete mixer', { view: 'side', edge: 'sharp' })
      .box([1.1, 0.35, 8.8], [0, 1.0, -0.2], { color: '#2a2726', round: 0.2 })
      .box([2.5, 1.75, 1.8], [0, 2.1, 3.65], { color: 'white', round: 0.15 })
      .box([2.5, 0.75, 1.9], [0, 0.95, 3.7], { color: '#f26a1b', round: 0.15 })
      .box([2.3, 0.85, 0.06], [0, 2.45, 4.56], { color: DARKWIN, rot: [-8, 0, 0] })
      .box([2.0, 0.5, 0.08], [0, 1.15, 4.66], { color: '#3a3633', round: 0.2 })
      .box([2.6, 0.3, 0.25], [0, 0.55, 4.7], { color: '#3a3633', round: 0.2 })
      .box([2.52, 0.12, 1.8], [0, 3.02, 3.65], { color: '#f26a1b', round: 0.3 })
      .box([0.06, 1.1, 0.95], [1.27, 2.0, 3.9], { color: 'white', name: 'door', pivot: [1.27, 2.0, 4.38], mover: { kind: 'swing', axis: 'y', amount: 75 } })
      .box([0.04, 0.6, 0.75], [1.3, 2.35, 3.9], { color: DARKWIN, parent: 'door' })
      .box([0.04, 0.05, 0.18], [1.31, 1.75, 3.6], { color: 'silver', parent: 'door' })
      .box([0.04, 0.6, 0.75], [-1.27, 2.35, 3.9], { color: DARKWIN })
      .label('MIX', [0.6, 0.25], [0, 3.0, 4.58], { color: '#f26a1b', depth: 0.02 })
      .loft([2.4, 2.4, 4.6], [0, 2.75, -0.9], [[0, 0.45, 0.45], [0.15, 0.85, 0.85], [0.55, 1, 1], [0.9, 0.85, 0.85], [1, 0.5, 0.5]], { color: '#f2f0ea', name: 'drum', mover: { kind: 'spin', axis: 'z', amount: 120 } });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 3, z = -2.9 + i * 0.42, r = 1.15 * Math.min(1, 0.6 + 0.4 * Math.sin((i / 9) * Math.PI));
      b.box([0.5, 0.16, 0.5], [Math.cos(a) * r, 2.75 + Math.sin(a) * r, z], { color: '#f26a1b', rot: [0, 0, (a * 180) / Math.PI + 90], parent: 'drum', round: 0.3 });
    }
    b.box([0.6, 1.4, 0.6], [0, 1.75, 1.6], { color: '#3a3633' })
      .box([1.6, 1.2, 0.4], [0, 1.75, -3.2], { color: '#3a3633' })
      .cyl([0.8, 0.5, 0.8], [0, 3.6, -3.5], { color: '#f26a1b', taper: 1.4 })
      .box([0.5, 0.1, 1.6], [0, 2.0, -4.0], { color: '#f26a1b', round: 0.3, name: 'chute', pivot: [0, 2.2, -3.3], mover: { kind: 'swing', axis: 'y', amount: 70 }, rot: [-25, 0, 0] })
      .cyl([0.6, 1.0, 0.6], [1.0, 1.55, 1.2], { color: 'silver', rot: [90, 0, 0] });
    b.each(6, (i) => b.box([0.5, 0.04, 0.06], [-0.95, 1.4 + i * 0.3, -3.45], { color: 'silver' }));
    b.pair((s) => {
      b.ball([0.3, 0.25, 0.1], [s * 0.85, 1.25, 4.67], { color: '#fff6c8', glow: true, edge: 'soft' });
      b.box([0.06, 0.35, 0.2], [s * 1.38, 2.4, 4.4], { color: '#2a2726' });
      b.box([0.15, 0.12, 0.2], [s * 1.0, 0.95, -4.55], { color: 'red', glow: true });
    });
    let n = 1;
    for (const z of [3.5, -1.6, -2.85]) b.pair((s) => wheel(b, `wheel${n++}`, s * 1.08, 0.53, z, 1.06, 0.36));
    const fig = b
      .socket('seat', [0.5, 1.6, 3.7], 'seat')
      .act({
        click: [
          [A.operate('drum', 'on'), A.say('Rumble rumble...', 2.5), A.wait(3), A.operate('drum', 'off')],
          [A.operate('chute', 'open'), A.effect('dust', { dur: 2 }), A.say('Splosh!', 1.5), A.wait(2), A.operate('chute', 'close')],
          [A.operate('door', 'open'), A.say('Honk honk!', 1.5), A.wait(1.5), A.operate('door', 'close')],
        ],
      })
      .done();
    return restTurn(fig, 'drum', [12, 0, 0]);
  }),
  // A pink squeeze bottle of conditioner with a flip cap that pops open.
  e('conditioner', 'home', 'bathroom', () =>
    squeeze('conditioner', '#f3b6c8', 'white', 0.2, 0.08, 'CONDITIONER')
      .act({ click: [A.operate('cap', 'open'), A.say('Squirt!', 1), A.effect('water_spray', { dur: 0.8 }), A.wait(1), A.operate('cap', 'close')] })
      .done(),
  ),
  // A five-storey condominium: glass-railed balconies on every upper floor, a canopy over the glass doors and a
  // roof terrace. The doors buzz open.
  e('condominium', 'places', 'homes', () => {
    const fz = 5, st = 3.1;
    const b = tower('condominium', { w: 14, d: 10, floors: 5, st, wall: '#d9cbb5', trim: '#f4f0e8', cols: 6, sign: 'CONDOS', signBg: '#1f6f6a', double: true, roof: '#5c6166' });
    for (let f = 1; f < 5; f++)
      for (const x of [-4.67, 0, 4.67]) {
        const y = f * st + 0.1;
        b.box([3.6, 0.16, 1.3], [x, y, fz + 0.65], { color: '#f4f0e8', round: 0.2 })
          .box([3.6, 0.95, 0.05], [x, y + 0.55, fz + 1.28], { color: '#6f9fba', round: 0.1 })
          .box([3.7, 0.06, 0.08], [x, y + 1.05, fz + 1.28], { color: 'silver' });
      }
    b.box([14, 1.0, 0.06], [0, 16.5 + 0.5, fz - 0.1], { color: '#bfe3f5' })
      .box([2.2, 1.2, 1.6], [3.5, 16.6, -2], { color: '#9a9a96', round: 0.1 })
      .cyl([1.6, 2.0, 1.6], [-4, 17.0, -2], { color: '#8a8a86' });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Bzzzt!', 1.5), A.wait(2.2), A.operate('door', 'close')], [A.say('Ding! Going up.', 1.8)]] }).done();
  }),
  // A real 70 cm traffic cone: weighted square base, orange body, two reflective white bands. Bump it: bonk.
  e('cone', 'workshop', 'road works', () =>
    m('cone')
      .box([0.38, 0.035, 0.38], [0, 0.0175, 0], { color: '#2a2726', round: 0.3, edge: 'sharp' })
      .cone([0.32, 0.665, 0.32], [0, 0.3675, 0], { color: '#f26a1b', taper: 0.12 })
      .cyl([0.172, 0.1, 0.172], [0, 0.45, 0], { color: 'white', taper: 0.72 })
      .cyl([0.102, 0.06, 0.102], [0, 0.59, 0], { color: 'white', taper: 0.72 })
      .act({ click: [A.anim('wobble'), A.say('Bonk!', 1)] })
      .done(),
  ),
  // A party popper just popped: a gold cone with paper streamers and a spray of confetti, more on the floor.
  e('confetti', 'toys', 'party', () => {
    const b = m('confetti')
      .cone([0.045, 0.11, 0.045], [-0.07, 0.04, 0], { color: 'gold', rot: [180, 0, 35] })
      .cyl([0.047, 0.01, 0.047], [-0.04, 0.085, 0], { color: 'red', rot: [0, 0, 35] })
      .stick([-0.1, 0.0, 0], [-0.1, 0.005, 0.05], 0.004, 'white');
    b.each(4, (i) => b.rod([-0.03, 0.095, 0], [0.04 + i * 0.03, 0.2 - i * 0.03, (i - 1.5) * 0.03], 0.004, COLS[i * 2], { noInk: true }));
    b.each(22, (i) => b.box([0.014, 0.009, 0.002], [-0.02 + rnd(i) * 0.2, 0.1 + rnd(i + 50) * 0.13, -0.06 + rnd(i + 90) * 0.12], { color: COLS[i % COLS.length], rot: [rnd(i + 7) * 180, rnd(i + 3) * 180, rnd(i + 5) * 180], noInk: true }));
    b.each(14, (i) => b.box([0.014, 0.002, 0.009], [-0.05 + rnd(i + 20) * 0.26, 0.001, -0.08 + rnd(i + 30) * 0.16], { color: COLS[(i + 3) % COLS.length], rot: [0, rnd(i) * 180, 0], noInk: true }));
    return b.act({ click: [A.say('Pop!', 1), A.par(A.effect('sparkle', { dur: 2 }), A.anim('bounce'))] }).done();
  }),
  // A pair of congas on a chrome stand: barrel bodies of staved wood, skin heads, tuning lugs.
  e('conga', 'music', 'drums', () => {
    const b = m('conga');
    b.pair((s) => {
      const x = s * 0.2;
      b.cyl([0.26, 0.38, 0.26], [x, 0.29, 0], { color: s > 0 ? '#a0522d' : '#8b4513', taper: 1.3 });
      b.cyl([0.34, 0.4, 0.34], [x, 0.68, 0], { color: s > 0 ? '#a0522d' : '#8b4513', taper: 0.82 });
      b.cyl([0.29, 0.015, 0.29], [x, 0.885, 0], { color: 'cream', name: s > 0 ? 'headL' : 'headR', piece: true });
      b.torus([0.3, 0.3, 0.035], [x, 0.875, 0], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' });
      b.cyl([0.345, 0.03, 0.345], [x, 0.48, 0], { color: 'gold', edge: 'sharp' });
      around(5, 0.15, 0.3).forEach(([dx, dz]) => b.stick([x + dx, 0.66, dz], [x + dx * 0.98, 0.86, dz * 0.98], 0.014, 'silver', { edge: 'sharp' }));
    });
    b.stick([0, 0, 0], [0, 0.35, 0], 0.03, 'silver', { edge: 'sharp' });
    around(3, 0.3, 0.5).forEach(([x, z]) => b.rod([0, 0.1, 0], [x, 0.01, z], 0.022, 'silver', { edge: 'sharp' }));
    return b.act({ click: [A.pose('headL', { move: [0, -0.01, 0], dur: 0.1 }), A.pose('headL', { move: [0, 0, 0], dur: 0.1 }), A.pose('headR', { move: [0, -0.01, 0], dur: 0.1 }), A.pose('headR', { move: [0, 0, 0], dur: 0.1 }), A.par(A.anim('pulse'), A.say('Bom, bom, ba-dum!', 2))] }).done();
  }),
  // A game console with its controller on a cable: power it on (ba-ding), the controller rumbles, power it off.
  e('console', 'tech', 'games', () =>
    m('console', { edge: 'sharp' })
      .box([0.3, 0.07, 0.24], [0, 0.035, -0.06], { color: '#1e1e22', round: 0.2 })
      .box([0.31, 0.012, 0.25], [0, 0.04, -0.06], { color: '#3a3a42', round: 0.2 })
      .box([0.12, 0.004, 0.004], [-0.05, 0.035, 0.062], { color: '#555555', noInk: true })
      .ball(0.01, [0.12, 0.035, 0.062], { color: 'cyan', glow: true, name: 'power', mover: { kind: 'light' } })
      .box([0.1, 0.035, 0.06], [0.03, 0.02, 0.17], { color: '#2a2a2e', round: 0.6, name: 'pad', piece: true, edge: 'soft' })
      .ball([0.055, 0.035, 0.07], [-0.025, 0.02, 0.18], { color: '#2a2a2e', parent: 'pad', edge: 'soft' })
      .ball([0.055, 0.035, 0.07], [0.085, 0.02, 0.18], { color: '#2a2a2e', parent: 'pad', edge: 'soft' })
      .ball(0.012, [0.07, 0.04, 0.165], { color: 'red', parent: 'pad' })
      .ball(0.012, [0.085, 0.04, 0.155], { color: 'green', parent: 'pad' })
      .cyl([0.014, 0.012, 0.014], [-0.01, 0.042, 0.165], { color: '#555555', parent: 'pad' })
      .rod([0.03, 0.02, 0.14], [0.06, 0.01, 0.08], 0.005, '#222222')
      .act({
        click: [
          [A.operate('power', 'on'), A.say('Ba-ding!', 1.5)],
          [A.pose('pad', { rot: [0, 8, 0], dur: 0.06 }), A.pose('pad', { rot: [0, -8, 0], dur: 0.08 }), A.pose('pad', { rot: [0, 6, 0], dur: 0.08 }), A.pose('pad', { rot: [0, 0, 0], dur: 0.06 }), A.say('Bzzz!', 1)],
          [A.operate('power', 'off'), A.say('Bloop.', 1)],
        ],
      })
      .done(),
  ),
  // A 1 m construction barrel: rubber base ring, orange and white reflective bands, a flashing amber lamp on top.
  e('construction barrel', 'workshop', 'road works', () => {
    const b = m('construction barrel')
      .cyl([0.78, 0.1, 0.78], [0, 0.05, 0], { color: '#222222' })
      .cyl([0.56, 0.86, 0.56], [0, 0.52, 0], { color: '#f26a1b', taper: 0.88 })
      .cyl([0.5, 0.06, 0.5], [0, 0.98, 0], { color: '#f26a1b' });
    for (const [y, k] of [[0.3, 0.99], [0.55, 0.95], [0.8, 0.91]]) b.cyl([0.565 * k, 0.1, 0.565 * k], [0, y, 0], { color: 'white', taper: 0.98 });
    return b
      .box([0.08, 0.1, 0.05], [0, 1.06, 0], { color: '#333333', edge: 'sharp' })
      .cyl([0.14, 0.1, 0.14], [0, 1.14, 0], { color: '#f2b81b', glow: true, name: 'lamp', mover: { kind: 'light' }, edge: 'sharp' })
      .act({ click: [A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off')] })
      .done();
  }),
  // A building site: a three-storey concrete frame going up, scaffolding with planks across its front, a site fence
  // with a gate, a site hut, a sand pile, cones and a little cement mixer that turns.
  e('construction site', 'places', 'construction', () => {
    const b = m('construction site', { edge: 'sharp' }).box([16, 0.15, 12], [0, 0.075, 0], { color: 'dirt', round: 0.05, edge: 'soft' });
    for (let f = 1; f <= 3; f++) b.box([8, 0.25, 6], [0, f * 3, -2], { color: '#a8a8a4' });
    for (const x of [-3.8, 0, 3.8]) for (const z of [-4.8, 0.8]) b.box([0.4, 9, 0.4], [x, 4.5, z], { color: '#b5b5b0' });
    for (const x of [-3.8, 0, 3.8]) for (const z of [-4.8, 0.8]) b.each(3, (i) => b.stick([x - 0.12 + (i % 2) * 0.24, 9.1, z - 0.12 + i * 0.12], [x - 0.12 + (i % 2) * 0.24, 10.0, z - 0.12 + i * 0.12], 0.04, '#8a4a2a'));
    for (const x of [-4.2, -1.4, 1.4, 4.2]) b.pair((s) => b.stick([x, 0.15, 1.4 + (s > 0 ? 0.9 : 0)], [x, 8.5, 1.4 + (s > 0 ? 0.9 : 0)], 0.06, '#c8c8c8'));
    for (const y of [3.1, 6.1]) {
      b.box([8.6, 0.06, 1.0], [0, y, 1.85], { color: 'wood' });
      b.stick([-4.3, y + 1.0, 2.3], [4.3, y + 1.0, 2.3], 0.05, '#f26a1b');
    }
    b.each(7, (i) => {
      const x = -7 + i * 2.0;
      if (i === 4) return;
      b.box([2.0, 1.8, 0.04], [x, 1.05, 5.5], { color: '#b8c0c8', round: 0.1 }).box([0.08, 1.9, 0.08], [x - 1.0, 1.1, 5.5], { color: 'silver' });
    });
    b.box([1.9, 1.8, 0.05], [1.0, 1.05, 5.5], { color: '#f26a1b', round: 0.1, name: 'gate', pivot: [0.05, 1.05, 5.5], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .label('KEEP OUT', [1.2, 0.5], [-3.0, 1.4, 5.55], { color: '#f2c14e', depth: 0.03 })
      .box([2.6, 2.6, 5.5], [5.8, 1.45, -2], { color: '#f2f0ea', round: 0.05 })
      .box([0.06, 2.0, 0.85], [4.48, 1.15, -0.8], { color: '#3a6fb5', round: 0.1 })
      .box([0.06, 0.8, 1.4], [4.48, 1.9, -3], { color: WIN })
      .ball([3.0, 1.3, 2.4], [-5.5, 0.6, 2.5], { color: 'sand', edge: 'soft' })
      .cone([0.4, 0.7, 0.4], [3.0, 0.5, 4.3], { color: '#f26a1b', edge: 'soft' })
      .cone([0.4, 0.7, 0.4], [4.2, 0.5, 4.6], { color: '#f26a1b', edge: 'soft' })
      .cyl([1.0, 1.0, 1.0], [-3.2, 1.25, 3.8], { color: '#f2b81b', rot: [60, 0, 0], taper: 0.6, name: 'mixer', mover: { kind: 'spin', axis: 'y', amount: 180 } })
      .rod([-3.2, 0.2, 3.8], [-3.2, 0.9, 3.8], 0.12, '#3a3633');
    b.pair((s) => wheel(b, s > 0 ? 'wheelM1' : 'wheelM2', -3.2 + s * 0.6, 0.3, 3.8, 0.45, 0.12));
    return b
      .act({
        click: [
          [A.operate('mixer', 'on'), A.effect('dust', { dur: 2 }), A.say('Clang! Bang!', 2), A.wait(2.2), A.operate('mixer', 'off')],
          [A.operate('gate', 'open'), A.say('Beep! Beep!', 1.5), A.wait(2), A.operate('gate', 'close')],
        ],
      })
      .done();
  }),
  // A contact lens case (left cap blue, right cap green, screw-off) and a real 14 mm lens floating in solution.
  e('contact lens', 'clinic', 'eye care', () =>
    m('contact lens')
      .box([0.075, 0.016, 0.036], [0, 0.008, 0], { color: 'white', round: 0.5, name: 'case', edge: 'sharp' })
      .cyl([0.03, 0.018, 0.03], [-0.02, 0.025, 0], { color: '#3a8fd8', name: 'capL', parent: 'case', piece: true, edge: 'sharp' })
      .label('L', [0.012, 0.012], [-0.02, 0.0345, 0], { color: '#3a8fd8', rot: [-90, 0, 0], parent: 'capL', depth: 0.002 })
      .cyl([0.03, 0.018, 0.03], [0.02, 0.025, 0], { color: '#4caf50', name: 'capR', parent: 'case', piece: true, edge: 'sharp' })
      .label('R', [0.012, 0.012], [0.02, 0.0345, 0], { color: '#4caf50', rot: [-90, 0, 0], parent: 'capR', depth: 0.002 })
      .cyl([0.022, 0.002, 0.022], [-0.02, 0.0165, 0], { color: '#bfe6ff', noInk: true })
      .dome([0.014, 0.004, 0.014], [-0.02, 0.0175, 0], { color: '#d8f0ff' })
      .act({ click: [[A.detach('capL', 'cap'), A.say('Plip!', 1)], [A.reattach('capL'), A.say('Twist.', 1)]] })
      .done(),
  ),
  // A contract on a clipboard: printed clauses, a red seal, a signature line, and a fountain pen that signs it.
  e('contract', 'study', 'documents', () => {
    const b = m('contract', { edge: 'sharp' })
      .box([0.24, 0.33, 0.012], [0, 0.17, 0], { color: '#8a5a3a', round: 0.2, rot: [-12, 0, 0] })
      .box([0.2, 0.28, 0.003], [0, 0.16, 0.009], { color: 'paper', rot: [-12, 0, 0] })
      .box([0.1, 0.03, 0.02], [0, 0.315, 0.0], { color: 'silver', round: 0.3, rot: [-12, 0, 0] })
      .label('CONTRACT', [0.15, 0.03], [0, 0.27, 0.035], { color: 'paper', rot: [-12, 0, 0], depth: 0.002 })
      .cyl([0.035, 0.004, 0.035], [0.055, 0.07, 0.022], { color: '#b0122b', rot: [78, 0, 0] })
      .box([0.1, 0.002, 0.002], [-0.03, 0.065, 0.023], { color: '#333333', rot: [-12, 0, 0], noInk: true })
      .box([0.012, 0.13, 0.012], [0.08, 0.08, 0.06], { color: '#1e1e1e', round: 0.5, rot: [70, 0, 30], name: 'pen', piece: true })
      .cone([0.01, 0.025, 0.008], [0.055, 0.06, 0.03], { color: 'gold', rot: [-110, 0, 30], parent: 'pen' });
    b.each(7, (i) => b.box([0.15, 0.003, 0.002], [0, 0.24 - i * 0.022, 0.03 - i * 0.0046], { color: '#999999', rot: [-12, 0, 0], noInk: true }));
    b.each(3, (i) => b.box([0.003, 0.03, 0.03], [-0.13 - i * 0.004, 0.003 + i * 0.002, 0.08], { color: 'paper' }));
    return b.act({ click: [A.pose('pen', { move: [-0.08, 0, -0.01], dur: 0.3 }), A.pose('pen', { move: [-0.03, 0.01, -0.01], dur: 0.25 }), A.pose('pen', { move: [-0.06, -0.005, -0.01], dur: 0.25 }), A.say('Scritch, scratch!', 1.5), A.pose('pen', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A convention center: a long glass hall under a vaulted roof, a glass entrance with doors under a canopy, steps,
  // banners and three flags on poles that flutter.
  e('convention center', 'places', 'halls', () => {
    const w = 32, d = 18, h = 10, fz = d / 2;
    const b = m('convention center', { edge: 'sharp' })
      .box([w, h, d], [0, h / 2, 0], { color: '#d0d6dc', round: 0.02 })
      .box([w + 0.2, 0.4, d + 0.2], [0, 0.2, 0], { color: '#8d8a86' })
      .loft([d + 1.2, 6, w + 1.2], [0, h, 0], [[0, 1, 1], [1, 1, 1]], { color: '#7a8590', cut: 'top', rot: [0, 90, 0] })
      .box([w - 4, h - 2.5, 0.08], [0, (h - 2.5) / 2 + 0.6, fz + 0.04], { color: WIN });
    b.each(14, (i) => b.box([0.12, h - 2.5, 0.12], [-w / 2 + 2 + (i + 0.5) * ((w - 4) / 14), (h - 2.5) / 2 + 0.6, fz + 0.1], { color: '#e8ecef' }));
    for (const y of [3.4, 6.3]) b.box([w - 4, 0.15, 0.14], [0, y, fz + 0.1], { color: '#e8ecef' });
    b.box([w - 3.6, 1.5, 0.3], [0, h - 0.95, fz + 0.15], { color: '#e8ecef' })
      .label('CONVENTION CENTER', [16, 1.0], [0, h - 0.95, fz + 0.32], { color: '#1e3a5f', depth: 0.05 })
      .box([9, 0.3, 4], [0, 3.4, fz + 2], { color: '#e8ecef', round: 0.1 });
    b.pair((s) => b.stick([s * 4.2, 0, fz + 3.8], [s * 4.2, 3.3, fz + 3.8], 0.2, '#e8ecef'));
    frontDoor(b, -0.8, fz + 0.1, WIN, { glass: true, frame: '#e8ecef', w: 1.5, h: 2.6, name: 'doorL' });
    frontDoor(b, 0.8, fz + 0.1, WIN, { glass: true, frame: '#e8ecef', w: 1.5, h: 2.6, name: 'doorR', flip: true });
    b.box([12, 0.2, 2], [0, 0.1, fz + 1.2], { color: '#9a958e' }).box([13, 0.2, 1], [0, 0.0 + 0.1, fz + 2.6], { color: '#9a958e' });
    for (const [i, c] of (['#c0392b', '#2a5bd7', '#2e8b57'] as const).entries()) {
      const x = -9 + i * 9;
      b.stick([x, 0, fz + 5.5], [x, 9, fz + 5.5], 0.14, 'silver')
        .box([2.2, 1.4, 0.04], [x + 1.15, 8.2, fz + 5.5], { color: c, round: 0.1, name: `flag${i}`, pivot: [x, 8.2, fz + 5.5], edge: 'soft' });
    }
    b.pair((s) => b.box([1.4, 4.5, 0.06], [s * 13.5, 4.5, fz + 0.2], { color: s > 0 ? '#f2b81b' : '#8a5fc4', round: 0.1 }));
    const flap = (r: number, t: number) => A.par(A.pose('flag0', { rot: [0, r, 0], dur: t }), A.pose('flag1', { rot: [0, -r * 0.8, 0], dur: t }), A.pose('flag2', { rot: [0, r * 0.9, 0], dur: t }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-dong!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [flap(25, 0.4), flap(-20, 0.5), flap(18, 0.45), flap(-12, 0.4), flap(0, 0.35)],
        ],
      })
      .done();
  }),
  // A factory belt conveyor: a black belt on a blue frame at hip height (0.85 m), end rollers that turn, a motor,
  // and parcels that ride along it.
  e('conveyor belt', 'tech', 'machines', () => {
    const b = m('conveyor belt', { view: 'side', edge: 'sharp' })
      .box([0.62, 0.04, 3.0], [0, 0.86, 0], { color: '#222222', round: 0.4, edge: 'soft' })
      .cyl([0.15, 0.62, 0.15], [0, 0.8, 1.48], { color: 'silver', rot: [0, 0, 90], name: 'roller1', mover: { kind: 'spin', axis: 'x', amount: 400 } })
      .cyl([0.15, 0.62, 0.15], [0, 0.8, -1.48], { color: 'silver', rot: [0, 0, 90], name: 'roller2', mover: { kind: 'spin', axis: 'x', amount: 400 } })
      .box([0.62, 0.04, 3.0], [0, 0.74, 0], { color: '#2a2a2a', round: 0.4 })
      .box([0.3, 0.3, 0.4], [0.5, 0.6, -1.2], { color: '#3a6fb5', round: 0.2 })
      .cyl([0.22, 0.2, 0.22], [0.5, 0.6, -0.95], { color: '#555555', rot: [90, 0, 0] })
      .box([0.12, 0.2, 0.05], [0.5, 1.05, 1.4], { color: '#e8413a', round: 0.3 })
      .ball(0.06, [0.5, 1.16, 1.4], { color: 'red', glow: true });
    b.pair((s) => {
      b.box([0.04, 0.14, 3.1], [s * 0.34, 0.86, 0], { color: '#3a6fb5', round: 0.2 });
      for (const z of [1.2, 0, -1.2]) b.box([0.06, 0.8, 0.06], [s * 0.3, 0.4, z], { color: '#3a6fb5' }).box([0.1, 0.04, 0.14], [s * 0.3, 0.02, z], { color: '#222222' });
    });
    b.box([0.4, 0.3, 0.4], [0, 1.03, -1.0], { color: '#c8a06a', round: 0.1, name: 'boxes' })
      .box([0.41, 0.05, 0.08], [0, 1.16, -1.0], { color: '#d9c08a', parent: 'boxes' })
      .box([0.34, 0.24, 0.3], [0, 1.0, -0.2], { color: '#b8905a', round: 0.1, parent: 'boxes' })
      .label('FRAGILE', [0.2, 0.06], [0, 1.0, -0.04], { color: '#b8905a', parent: 'boxes', depth: 0.005 })
      .box([0.42, 0.28, 0.42], [0, 1.02, 0.6], { color: '#c8a06a', round: 0.1, parent: 'boxes' });
    return b
      .act({ click: [A.operate('roller', 'on'), A.pose('boxes', { move: [0, 0, 0.7], dur: 2.5 }), A.operate('roller', 'off'), A.wait(0.5), A.pose('boxes', { move: [0, 0, 0], dur: 0 })] })
      .done();
  }),
  // A thick red cookbook with a chef's hat on its cover; it falls open.
  e('cookbook', 'study', 'books', () =>
    standBook('cookbook', '#c0392b', 'RECIPES', 0.2, 0.26, 0.035, '#8e2a1f')
      .ball([0.08, 0.05, 0.008], [0, 0.135, 0.02], { color: 'white', parent: 'cover' })
      .cyl([0.055, 0.035, 0.008], [0, 0.098, 0.02], { color: 'white', parent: 'cover' })
      .act({ click: [A.operate('cover', 'open'), A.say('Flip, flip...', 1.5), A.wait(2), A.operate('cover', 'close')] })
      .done(),
  ),
  // Chocolate chip cookies (8 cm): a stack and one leaning on it; break it and half comes away.
  e('cookie', 'food', 'cookies', () => {
    const b = m('cookie');
    b.each(3, (i) => b.cyl([0.08, 0.012, 0.08], [0, 0.007 + i * 0.013, -0.01], { color: i % 2 ? '#c98a4b' : '#d49a5a' }));
    b.cyl([0.08, 0.012, 0.08], [0, 0.045, 0.04], { color: '#d49a5a', rot: [70, 0, 0], name: 'cookie' })
      .cyl([0.04, 0.012, 0.08], [0.021, 0.045, 0.041], { color: '#c98a4b', rot: [70, 0, 0], name: 'half', parent: 'cookie', piece: true });
    for (const [x, y] of [[-0.02, 0.06], [0.015, 0.068], [0.0, 0.03], [0.022, 0.04], [-0.018, 0.025]]) b.ball(0.01, [x, y, 0.048 - (y - 0.045) * 0.36], { color: '#3a2010', noInk: true, ...(x > 0.005 ? { parent: 'half' } : {}) });
    b.each(4, (i) => b.ball(0.01, [-0.025 + i * 0.016, 0.044, -0.02 + (i % 2) * 0.025], { color: '#3a2010', noInk: true }));
    return b.act({ click: [[A.detach('half', 'bit'), A.say('Crunch!', 1)], [A.reattach('half')]] }).done();
  }),
  // A star cookie cutter over rolled-out dough: it presses down and a star is cut out.
  e('cookie cutter', 'kitchen', 'baking', () =>
    m('cookie cutter')
      .box([0.26, 0.015, 0.18], [0, 0.0075, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .box([0.22, 0.008, 0.15], [0, 0.019, 0], { color: '#f0d9a8', round: 0.6 })
      .ball(0.012, [0.06, 0.026, 0.02], { color: '#e0b878', name: 'cut', piece: true })
      .star(0.07, [0.06, 0.026, 0.02], { color: '#e0b878', rot: [90, 0, 0], parent: 'cut' })
      .star(0.07, [-0.06, 0.024, -0.02], { color: '#e0b878', rot: [90, 0, 0] })
      .cyl([0.03, 0.03, 0.03], [0.06, 0.1, 0.02], { color: 'red', name: 'cutter', piece: true, edge: 'sharp' })
      .star(0.08, [0.06, 0.075, 0.02], { color: 'silver', rot: [90, 0, 0], round: 0.022, parent: 'cutter', edge: 'sharp' })
      .act({ click: [A.pose('cut', { scale: 0, dur: 0 }), A.pose('cutter', { move: [0, -0.045, 0], dur: 0.3 }), A.say('Press!', 1), A.pose('cutter', { move: [0, 0, 0], dur: 0.3 }), A.pose('cut', { scale: 1, dur: 0.25 })] })
      .done(),
  ),
  // A mixing bowl of cookie dough studded with chips, a wooden spoon that stirs.
  e('cookie dough', 'food', 'cookies', () => {
    const b = bowl('cookie dough', '#7fb3d5', '#e8c890', 0.18, 0.07);
    b.each(6, (i) => b.ball(0.012, [-0.04 + (i % 3) * 0.04, 0.095, -0.02 + Math.floor(i / 3) * 0.04], { color: '#3a2010', noInk: true }));
    return b
      .rod([0.02, 0.085, 0], [0.09, 0.2, -0.03], 0.014, 'wood', { name: 'spoon', pivot: [0, 0.09, 0], edge: 'sharp' })
      .ball([0.03, 0.016, 0.04], [0.015, 0.085, 0.005], { color: 'wood', parent: 'spoon', edge: 'sharp' })
      .act({ click: [A.pose('spoon', { spin: [0, 300, 0] }), A.say('Stir, stir...', 1.5), A.wait(2), A.pose('spoon', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0.2 })] })
      .done();
  }),
  // A glass cookie jar with a red lid; lift the lid and a cookie comes out.
  e('cookie jar', 'kitchen', 'storage', () => {
    const b = m('cookie jar')
      .cyl([0.18, 0.2, 0.18], [0, 0.1, 0], { color: GLASS, name: 'jar' })
      .cyl([0.15, 0.02, 0.15], [0, 0.205, 0], { color: GLASS })
      .cyl([0.17, 0.03, 0.17], [0, 0.225, 0], { color: '#c0392b', name: 'lid', parent: 'jar', piece: true })
      .ball(0.045, [0, 0.25, 0], { color: '#c0392b', parent: 'lid' })
      .label('COOKIES', [0.12, 0.03], [0, 0.04, 0.09], { color: 'white', depth: 0.004 });
    for (const [x, y] of [[-0.04, 0.06], [0.04, 0.07], [0, 0.12], [-0.045, 0.15], [0.045, 0.16]]) b.cyl([0.06, 0.012, 0.06], [x, y, 0.08], { color: '#c98a4b', rot: [90, 0, 0] });
    return b
      .act({ click: [A.pose('lid', { move: [0, 0.07, 0], rot: [0, 0, 15], dur: 0.4 }), A.spawn('c', 'cookie', { rel: 'front', of: 'self', dist: 'close' }), A.say('Clink!', 1), A.wait(2), A.remove('c', 'pop'), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A blue camping cooler with a white lid on hinges, handles and a drain plug; open it and it is icy inside.
  e('cooler', 'sports', 'camping', () =>
    m('cooler', { edge: 'sharp' })
      .box([0.6, 0.34, 0.38], [0, 0.17, 0], { color: '#2f7fd1', round: 0.25 })
      .box([0.54, 0.02, 0.32], [0, 0.33, 0], { color: '#dfe8ef' })
      .ball([0.12, 0.04, 0.1], [-0.12, 0.34, 0], { color: '#d8f0ff' })
      .cyl([0.065, 0.12, 0.065], [0.12, 0.38, 0.05], { color: 'red' })
      .cyl([0.065, 0.12, 0.065], [0.18, 0.38, -0.06], { color: 'lime' })
      .box([0.62, 0.08, 0.4], [0, 0.38, 0], { color: 'white', round: 0.3, name: 'lid', pivot: [0, 0.38, -0.2], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .box([0.3, 0.025, 0.12], [0, 0.425, 0.05], { color: '#dde', round: 0.4, parent: 'lid' })
      .box([0.06, 0.07, 0.03], [0, 0.34, 0.2], { color: 'white', round: 0.3 })
      .box([0.04, 0.06, 0.16], [0.32, 0.27, 0], { color: 'white', round: 0.3 })
      .box([0.04, 0.06, 0.16], [-0.32, 0.27, 0], { color: 'white', round: 0.3 })
      .cyl([0.03, 0.02, 0.03], [0.22, 0.04, 0.19], { color: 'white', rot: [90, 0, 0] })
      .socket('inside', [0, 0.2, 0], 'inside', { size: 0.3 })
      .act({ click: [A.operate('lid', 'open'), A.effect('snow', { dur: 1.5 }), A.say('Brrr!', 1.5), A.wait(1.8), A.operate('lid', 'close')] })
      .done(),
  ),
  // Copper: a spool of bright copper wire, lengths of copper pipe with an elbow, and an ingot.
  e('copper', 'workshop', 'materials', () => {
    const b = m('copper', { edge: 'sharp' })
      .cyl([0.28, 0.28, 0.28], [0, 0.18, 0], { color: 'copper', rot: [0, 0, 90], edge: 'soft' })
      .cyl([0.36, 0.03, 0.36], [0.155, 0.18, 0], { color: 'wood', rot: [0, 0, 90] })
      .cyl([0.36, 0.03, 0.36], [-0.155, 0.18, 0], { color: 'wood', rot: [0, 0, 90] })
      .box([0.2, 0.06, 0.09], [0.32, 0.03, 0.22], { color: 'copper', round: 0.25 })
      .stick([-0.4, 0.025, 0.28], [0.1, 0.025, 0.34], 0.035, '#c87533')
      .stick([-0.4, 0.06, 0.24], [0.05, 0.06, 0.3], 0.035, '#d0803a')
      .torus([0.1, 0.1, 0.035], [0.11, 0.07, 0.34], { color: '#c87533', rot: [90, 0, 0], tube: 0.35 });
    b.each(6, (i) => b.torus([0.285, 0.285, 0.01], [-0.12 + i * 0.048, 0.18, 0], { color: '#a8582a', rot: [0, 90, 0], tube: 0.04, noInk: true }));
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Clink!', 1))] }).done();
  }),
  // An office copier on its cabinet: document feeder lid, glowing touch panel, paper trays that pull out, and a copy
  // that slides into the output tray.
  e('copy machine', 'tech', 'office machines', () =>
    m('copy machine', { edge: 'sharp' })
      .box([0.65, 0.55, 0.62], [0, 0.275, 0], { color: '#d8d8d8', round: 0.08 })
      .box([0.65, 0.42, 0.62], [0, 0.76, 0], { color: '#ececec', round: 0.08 })
      .box([0.5, 0.012, 0.42], [0, 0.976, 0], { color: '#3a5a6a' })
      .box([0.64, 0.1, 0.6], [0, 1.02, 0], { color: '#5a5a5a', round: 0.2, name: 'lid', pivot: [0, 0.975, -0.3], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .box([0.4, 0.04, 0.3], [0.05, 1.09, 0], { color: '#6a6a6a', round: 0.3, parent: 'lid' })
      .box([0.28, 0.06, 0.14], [0.18, 0.95, 0.33], { color: '#444444', round: 0.2, rot: [-20, 0, 0] })
      .box([0.16, 0.05, 0.01], [0.15, 0.965, 0.405], { color: 'skyblue', glow: true, rot: [-20, 0, 0], name: 'panel', mover: { kind: 'light', on: true } })
      .box([0.56, 0.2, 0.02], [0, 0.4, 0.31], { color: '#cfcfcf', round: 0.2, name: 'tray1', mover: { kind: 'slide', axis: 'z', amount: 0.3 } })
      .box([0.2, 0.025, 0.02], [0, 0.43, 0.325], { color: '#555555', parent: 'tray1' })
      .box([0.54, 0.16, 0.5], [0, 0.4, 0.06], { color: 'white', parent: 'tray1' })
      .box([0.56, 0.2, 0.02], [0, 0.16, 0.31], { color: '#cfcfcf', round: 0.2 })
      .box([0.2, 0.025, 0.02], [0, 0.19, 0.325], { color: '#555555' })
      .box([0.22, 0.02, 0.32], [0.43, 0.68, 0], { color: '#bbbbbb', rot: [0, 0, -10] })
      .box([0.2, 0.008, 0.28], [0.3, 0.7, 0], { color: 'white', rot: [0, 0, -10], name: 'copy' })
      .act({
        click: [
          [A.operate('lid', 'open'), A.wait(0.6), A.operate('lid', 'close'), A.par(A.operate('panel', 'off'), A.say('Whirr... chunk!', 1.8)), A.operate('panel', 'on'), A.pose('copy', { move: [0.13, -0.02, 0], dur: 0.6 }), A.wait(1.2), A.pose('copy', { move: [0, 0, 0], dur: 0 })],
          [A.operate('tray1', 'out'), A.wait(1.5), A.operate('tray1', 'in')],
        ],
      })
      .done(),
  ),
  // A coral head on a rock: pink branching coral, a round brain coral, a purple sea fan, and a little clownfish
  // that peeks out.
  e('coral', 'sea', 'coral', () => {
    const b = m('coral').ball([0.46, 0.14, 0.34], [0, 0.05, 0], { color: 'rock' });
    const br: Array<[V, V]> = [
      [[0, 0.08, 0], [0, 0.25, 0]], [[0, 0.25, 0], [-0.1, 0.38, 0]], [[0, 0.25, 0], [0.08, 0.42, 0.02]], [[0, 0.25, 0], [-0.01, 0.48, -0.03]],
      [[-0.1, 0.38, 0], [-0.15, 0.45, 0.02]], [[0.08, 0.42, 0.02], [0.13, 0.48, 0]], [[0, 0.16, 0], [0.09, 0.26, -0.04]],
    ];
    for (const [a, c] of br) b.rod(a, c, 0.035, '#ff7f7f');
    b.ball([0.17, 0.12, 0.15], [0.15, 0.11, 0.07], { color: '#e8b04a' });
    b.each(4, (i) => b.torus([0.12 - i * 0.02, 0.12 - i * 0.02, 0.008], [0.15, 0.17, 0.07], { color: '#c89030', rot: [90, i * 40, 0], tube: 0.08, noInk: true }));
    return b
      .ball([0.24, 0.3, 0.02], [-0.16, 0.24, -0.08], { color: 'purple', rot: [0, 0, 15] })
      .ball([0.06, 0.035, 0.02], [-0.05, 0.12, 0.08], { color: 'orange', name: 'fish', piece: true })
      .box([0.008, 0.035, 0.022], [-0.055, 0.12, 0.08], { color: 'white', parent: 'fish' })
      .cone([0.025, 0.025, 0.01], [-0.085, 0.12, 0.08], { color: 'orange', rot: [0, 0, 90], parent: 'fish' })
      .act({ click: [A.pose('fish', { move: [0.12, 0.08, 0.1], dur: 0.6 }), A.say('Blub!', 1), A.wait(1), A.pose('fish', { move: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A cordless phone in its charging base, handset with a lit screen and keypad; it rings.
  e('cordless phone', 'tech', 'phones', () => {
    const b = m('cordless phone', { edge: 'sharp' })
      .box([0.14, 0.04, 0.12], [0, 0.02, 0], { color: '#333333', round: 0.4 })
      .ball(0.01, [0.05, 0.042, 0.05], { color: 'lime', glow: true, name: 'charge', mover: { kind: 'light', on: true } })
      .box([0.056, 0.17, 0.03], [0, 0.115, 0], { color: '#e6e6e6', round: 0.6, name: 'handset', piece: true })
      .box([0.042, 0.03, 0.005], [0, 0.165, 0.016], { color: 'skyblue', glow: true, parent: 'handset' })
      .stick([0.018, 0.19, -0.005], [0.018, 0.22, -0.005], 0.01, '#333333', { parent: 'handset' });
    b.each(9, (i) => b.box([0.01, 0.008, 0.004], [-0.014 + (i % 3) * 0.014, 0.135 - Math.floor(i / 3) * 0.015, 0.016], { color: '#555555', noInk: true, parent: 'handset' }));
    return b
      .act({
        click: [
          [A.par(A.pose('handset', { rot: [0, 0, 6], dur: 0.1 }), A.say('Ring ring!', 1.5)), A.pose('handset', { rot: [0, 0, -6], dur: 0.1 }), A.pose('handset', { rot: [0, 0, 6], dur: 0.1 }), A.pose('handset', { rot: [0, 0, 0], dur: 0.1 })],
          [A.pose('handset', { move: [0, 0.08, 0.03], dur: 0.4 }), A.operate('charge', 'off'), A.say('Beep!', 1), A.wait(1.5), A.pose('handset', { move: [0, 0, 0], dur: 0.4 }), A.operate('charge', 'on')],
        ],
      })
      .done();
  }),
  // Cork as a material: a slab of raw cork bark, a roll of cork sheet and a stack of tiles; it is springy.
  e('cork (material)', 'workshop', 'materials', () => {
    const b = m('cork (material)', { edge: 'sharp' })
      .box([0.4, 0.06, 0.25], [0, 0.03, 0], { color: '#c8955a', round: 0.3 })
      .box([0.4, 0.06, 0.25], [0.02, 0.09, 0.01], { color: '#d1a066', round: 0.3, rot: [0, 6, 0] })
      .cyl([0.24, 0.5, 0.24], [0.4, 0.12, 0], { color: '#c8955a', rot: [90, 0, 0], edge: 'soft' })
      .torus([0.24, 0.24, 0.01], [0.4, 0.12, 0.25], { color: '#a87a48', tube: 0.3, noInk: true })
      .loft([0.18, 0.12, 0.5], [-0.38, 0.06, 0], [[0, 0.8, 1], [0.5, 1, 1], [1, 0.8, 0.9]], { color: '#8a6040', cut: 'top', edge: 'soft' });
    b.each(14, (i) => b.ball(0.012, [-0.15 + rnd(i) * 0.3, 0.121, -0.1 + rnd(i + 3) * 0.2], { color: '#8a5a2b', noInk: true }));
    return b.act({ click: [A.anim('bounce', 2), A.say('Boing!', 1)] }).done();
  }),
  // A real wine cork (4.5 cm) standing up, another lying with its wine-stained end; it pops.
  e('cork (stopper)', 'kitchen', 'bar tools', () => {
    const b = m('cork (stopper)')
      .cyl([0.024, 0.045, 0.024], [0, 0.0225, 0], { color: '#c8955a', taper: 0.95 })
      .cyl([0.024, 0.045, 0.024], [0.04, 0.012, 0.02], { color: '#c8955a', rot: [90, 60, 0] })
      .cyl([0.023, 0.003, 0.023], [0.059, 0.012, 0.031], { color: '#7a1a2a', rot: [90, 60, 0] });
    b.each(6, (i) => b.ball(0.004, [Math.cos(i) * 0.0115, 0.006 + i * 0.006, Math.sin(i) * 0.0115], { color: '#8a5a2b', noInk: true }));
    return b.act({ click: [A.say('Pop!', 1), A.anim('hop')] }).done();
  }),
  // A cork notice board in a wooden frame on little feet, notes pinned up; one note comes loose and falls.
  e('corkboard', 'study', 'office', () => {
    const b = m('corkboard', { edge: 'sharp' })
      .box([0.9, 0.62, 0.03], [0, 0.66, 0], { color: '#c8955a', round: 0.05, name: 'board' })
      .box([0.96, 0.04, 0.05], [0, 0.99, 0], { color: 'wood' })
      .box([0.96, 0.04, 0.05], [0, 0.33, 0], { color: 'wood' })
      .box([0.04, 0.7, 0.05], [0.47, 0.66, 0], { color: 'wood' })
      .box([0.04, 0.7, 0.05], [-0.47, 0.66, 0], { color: 'wood' });
    b.pair((s) => b.stick([s * 0.35, 0, 0], [s * 0.35, 0.33, 0], 0.035, 'wood').box([0.1, 0.04, 0.3], [s * 0.35, 0.02, 0], { color: 'wood', round: 0.3 }));
    for (const [x, y, c] of [[-0.25, 0.78, 'yellow'], [0.05, 0.82, 'pink'], [0.28, 0.7, 'skyblue'], [0.2, 0.5, 'white']] as Array<[number, number, string]>)
      b.box([0.15, 0.13, 0.004], [x, y, 0.018], { color: c, round: 0.1, rot: [0, 0, (x * 40) % 12] }).ball(0.016, [x, y + 0.05, 0.026], { color: 'red' });
    return b
      .box([0.15, 0.13, 0.004], [-0.15, 0.52, 0.018], { color: 'lime', round: 0.1, name: 'note', parent: 'board', piece: true })
      .ball(0.016, [-0.15, 0.57, 0.026], { color: 'blue', parent: 'note' })
      .act({ click: [[A.detach('note', 'note'), A.say('Flutter...', 1.2)], [A.reattach('note'), A.say('Pin!', 1)]] })
      .done();
  }),
  // A winged corkscrew: twist handle on top, two lever arms that rise as the worm goes into a cork.
  e('corkscrew', 'kitchen', 'bar tools', () => {
    const b = m('corkscrew', { edge: 'sharp' })
      .cyl([0.032, 0.045, 0.032], [0, 0.0225, 0], { color: '#c8955a', taper: 0.95, edge: 'soft' })
      .cyl([0.036, 0.09, 0.036], [0, 0.09, 0], { color: 'silver' })
      .stick([0, 0.135, 0], [0, 0.17, 0], 0.01, 'silver')
      .rod([-0.045, 0.18, 0], [0.045, 0.18, 0], 0.016, 'silver');
    b.pair((s) => {
      b.box([0.08, 0.016, 0.01], [s * 0.045, 0.11, 0], { color: 'silver', round: 0.4, rot: [0, 0, s * -55], name: s > 0 ? 'armL' : 'armR', pivot: [s * 0.016, 0.125, 0], mover: { kind: 'swing', axis: 'z', amount: s * 55 } });
      b.ball([0.02, 0.016, 0.012], [s * 0.07, 0.078, 0], { color: 'silver', parent: s > 0 ? 'armL' : 'armR' });
    });
    return b.act({ click: [A.operate('arm', 'open'), A.say('Squeak...', 1.2), A.wait(0.5), A.say('Pop!', 1), A.operate('arm', 'close')] }).done();
  }),
  // An ear of sweetcorn (25 cm) with its husk peeled back. (The vocabulary's 2.5 m is the plant: that is "corn
  // stalk"; the food is ear-size, so the height warning stays.) It pops like popcorn.
  e('corn', 'food', 'vegetables', () => {
    const b = m('corn')
      .cyl([0.035, 0.05, 0.035], [0, 0.025, 0], { color: '#6a9a3a' })
      .capsule([0.06, 0.24, 0.06], [0, 0.17, 0], { color: '#f5c518' });
    b.each(7, (i) => b.torus([0.062, 0.062, 0.005], [0, 0.08 + i * 0.026, 0], { color: '#d9a812', rot: [90, 0, 0], tube: 0.08, noInk: true }));
    b.pair((s) => blade(b, [s * 0.02, 0.04, 0.01], [s * 0.07, 0.24, 0.02], 0.05, 0.008, 'leaf'));
    blade(b, [0, 0.04, -0.03], [0.01, 0.22, -0.06], 0.05, 0.008, '#5a8a2a');
    b.each(5, (i) => b.rod([0, 0.28, 0], [-0.02 + i * 0.01, 0.33, 0.01 * (i % 2)], 0.003, '#d8b060', { noInk: true }));
    return b.act({ click: [A.par(A.anim('shake'), A.effect('sparkle', { dur: 1.2 })), A.say('Pop! Pop!', 1.5)] }).done();
  }),
  // A corn dog on a stick with a mustard zigzag; take a bite.
  e('corn dog', 'food', 'fast food', () => {
    const b = m('corn dog')
      .cyl([0.07, 0.012, 0.07], [0, 0.006, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0, 0], [0, 0.09, 0], 0.008, 'lightwood')
      .capsule([0.045, 0.12, 0.045], [0, 0.14, 0], { color: '#c8872e', name: 'dog' })
      .capsule([0.045, 0.045, 0.045], [0, 0.21, 0], { color: '#c8872e', name: 'tip', parent: 'dog', piece: true })
      .cyl([0.03, 0.006, 0.03], [0, 0.192, 0], { color: '#c84a3a', parent: 'dog', noInk: true });
    const zz: V[] = [-0.012, 0.012, -0.012, 0.012, -0.012].map((x, i) => [x, 0.1 + i * 0.02, 0.022]);
    for (let i = 0; i < zz.length - 1; i++) b.rod(zz[i], zz[i + 1], 0.005, 'yellow', { noInk: true });
    return b.act({ click: [[A.detach('tip', 'bite'), A.say('Nom!', 1)], [A.reattach('tip')]] }).done();
  }),
  // A 2.4 m corn plant: a jointed stalk, long arching leaves, two ears in their husks with silk, a tassel on top
  // that sways. Shake it and an ear drops.
  e('corn stalk', 'garden', 'crops', () => {
    const b = m('corn stalk')
      .ball([0.5, 0.18, 0.45], [0, 0.04, 0], { color: 'dirt' })
      .stick([0, 0, 0], [0, 2.3, 0], 0.045, '#6a9a3a', { name: 'stalk' });
    b.each(6, (i) => b.cyl([0.055, 0.03, 0.055], [0, 0.35 + i * 0.32, 0], { color: '#5a8a2a', noInk: true }));
    for (let i = 0; i < 8; i++) {
      const y = 0.35 + i * 0.25, a = i * 2.4, r = 0.5 + (i < 5 ? 0.2 : 0);
      const mid: V = [Math.cos(a) * r * 0.5, y + 0.3, Math.sin(a) * r * 0.5];
      const tip: V = [Math.cos(a) * r, y + 0.05, Math.sin(a) * r];
      blade(b, [0, y, 0], mid, 0.08, 0.01, i % 2 ? 'leaf' : '#4f8a2e');
      blade(b, mid, tip, 0.065, 0.01, i % 2 ? 'leaf' : '#4f8a2e');
    }
    return b
      .capsule([0.08, 0.26, 0.08], [0.07, 1.25, 0.04], { color: '#8ab04a', rot: [0, 0, -18] })
      .capsule([0.075, 0.24, 0.075], [-0.07, 1.0, -0.03], { color: '#8ab04a', rot: [0, 0, 20], name: 'ear2', parent: 'stalk', piece: true })
      .ball([0.05, 0.1, 0.05], [0.12, 1.4, 0.04], { color: '#f5c518', rot: [0, 0, -18] })
      .rod([0.13, 1.42, 0.04], [0.17, 1.5, 0.05], 0.012, '#c89a50')
      .ball(0.05, [0, 2.3, 0], { color: 'tan', name: 'top' })
      .rod([0, 2.3, 0], [0.12, 2.5, 0], 0.015, 'tan', { parent: 'top' })
      .rod([0, 2.3, 0], [-0.1, 2.48, 0.02], 0.015, 'tan', { parent: 'top' })
      .rod([0, 2.3, 0], [0.02, 2.56, -0.04], 0.015, 'tan', { parent: 'top' })
      .act({ click: [[A.anim('shake'), A.detach('ear2', 'cob'), A.say('Rustle... thud!', 1.5)], [A.reattach('ear2')]] })
      .done();
  }),
  // A tall bottle of golden corn syrup with a red cap; it tips and pours slowly.
  e('corn syrup', 'food', 'pantry', () =>
    bottle('corn syrup', '#f0c86a', 'red', 0.3, 0.09, 'CORN SYRUP')
      .act({ click: [A.set({ tilt: 45, dur: 0.5 }), A.say('Glooop...', 2), A.wait(1.5), A.set({ tilt: 0, dur: 0.5 })] })
      .done(),
  ),
  // A slab of pink corned beef with its fat cap on a board, slices fanned off, and a knife that slices.
  e('corned beef', 'food', 'meat', () => {
    const b = m('corned beef')
      .box([0.34, 0.025, 0.2], [0, 0.0125, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .box([0.14, 0.07, 0.1], [-0.06, 0.06, 0], { color: '#c0505a', round: 0.4 })
      .box([0.14, 0.015, 0.1], [-0.06, 0.098, 0], { color: '#f0e0d0', round: 0.5 });
    b.each(3, (i) => b.box([0.012, 0.07, 0.1], [0.03 + i * 0.03, 0.055, 0], { color: '#d0606a', round: 0.3, rot: [0, 0, -20 - i * 8] }));
    return b
      .box([0.004, 0.035, 0.16], [0.015, 0.13, 0.0], { color: 'silver', name: 'knife', piece: true, edge: 'sharp' })
      .box([0.016, 0.025, 0.08], [0.015, 0.13, -0.12], { color: '#1e1e1e', round: 0.4, parent: 'knife', edge: 'sharp' })
      .act({ click: [A.pose('knife', { move: [0, -0.05, 0], dur: 0.3 }), A.say('Slice!', 1), A.pose('knife', { move: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A paper sack of cornmeal, top rolled, a scoop of yellow meal spilled in front; it puffs.
  e('cornmeal', 'food', 'pantry', () =>
    m('cornmeal')
      .box([0.24, 0.34, 0.15], [0, 0.17, 0], { color: '#d9c08a', round: 0.5 })
      .cyl([0.22, 0.06, 0.12], [0, 0.36, 0], { color: '#c8ad78', rot: [0, 0, 90], taper: 1 })
      .label('CORNMEAL', [0.18, 0.06], [0, 0.2, 0.078], { color: '#d9c08a', depth: 0.004 })
      .ball([0.06, 0.06, 0.06], [0, 0.11, 0.078], { color: '#f5c518' })
      .ball([0.18, 0.05, 0.12], [0.2, 0.02, 0.1], { color: '#f2c94c' })
      .dome([0.07, 0.03, 0.09], [0.12, 0.015, 0.18], { color: 'silver', rot: [180, 0, 30], edge: 'sharp' })
      .act({ click: [A.par(A.effect('dust', { dur: 1.2 }), A.anim('wobble')), A.say('Poof!', 1)] })
      .done(),
  ),
  // A wicker horn of plenty spilling fruit and vegetables; an apple rolls out.
  e('cornucopia', 'food', 'harvest', () => {
    const b = m('cornucopia');
    const pts: V[] = [[0.05, 0.11, 0], [-0.04, 0.1, -0.01], [-0.12, 0.1, -0.02], [-0.18, 0.14, -0.03], [-0.2, 0.2, -0.03], [-0.17, 0.24, -0.02]];
    const th = [0.2, 0.16, 0.12, 0.08, 0.05];
    for (let i = 0; i < 5; i++) b.rod(pts[i], pts[i + 1], th[i], i % 2 ? '#b8854a' : '#c8955a', i === 0 ? { name: 'horn' } : {});
    for (let i = 0; i < 4; i++) b.torus([th[i] * 1.02, th[i] * 1.02, 0.008], [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, pts[i][2]], { color: '#8a5a2a', rot: [0, 90, 0], tube: 0.1, noInk: true });
    return b
      .torus([0.22, 0.22, 0.03], [0.08, 0.11, 0], { color: '#a8743a', rot: [0, 90, 0] })
      .ball([0.04, 0.17, 0.17], [0.08, 0.11, 0], { color: '#5a3a1a' })
      .ball(0.07, [0.17, 0.035, 0.05], { color: 'red', name: 'apple', parent: 'horn', piece: true })
      .ball(0.07, [0.25, 0.035, -0.02], { color: 'orange' })
      .ball([0.06, 0.08, 0.06], [0.14, 0.12, -0.04], { color: 'lime' })
      .ball(0.035, [0.13, 0.14, 0.06], { color: 'purple' })
      .ball(0.035, [0.15, 0.11, 0.08], { color: 'purple' })
      .ball(0.035, [0.12, 0.1, 0.09], { color: 'purple' })
      .capsule([0.045, 0.14, 0.045], [0.24, 0.03, 0.09], { color: '#f5c518', rot: [90, 60, 0] })
      .act({ click: [[A.detach('apple', 'apple'), A.say('Bump!', 1)], [A.reattach('apple')]] })
      .done();
  }),
  // A shape under a white sheet on a steel mortuary trolley (0.85 m top, wheels), bare feet with a toe tag at the
  // end. Click it and the tag swings and the trolley squeaks.
  e('corpse', 'clinic', 'hospital', () => {
    const b = m('corpse', { view: 'side' })
      .box([0.7, 0.05, 2.0], [0, 0.82, 0], { color: 'steel', round: 0.2, edge: 'sharp' })
      .box([0.62, 0.04, 1.9], [0, 0.32, 0], { color: 'steel', round: 0.2, edge: 'sharp' })
      .loft([0.56, 0.34, 1.82], [0, 0.98, -0.02], [[0, 0.4, 0.4, -0.2], [0.12, 0.62, 0.55, -0.12], [0.45, 0.8, 0.7, -0.05], [0.66, 1, 1, 0], [0.82, 0.66, 0.6, -0.1], [0.88, 0.5, 0.7, 0], [1, 0.48, 0.75, 0]], { color: '#eef1f2' })
      .box([0.6, 0.06, 1.86], [0, 0.86, -0.02], { color: '#e4e8ea', round: 0.6 });
    b.pair((s) => b.ball([0.08, 0.14, 0.09], [s * 0.08, 0.98, -1.0], { color: '#c8cfc2' }));
    b.stick([0.08, 0.9, -1.04], [0.11, 0.86, -1.1], 0.004, 'white', { noInk: true })
      .box([0.07, 0.04, 0.004], [0.11, 0.82, -1.11], { color: '#e8d8a8', name: 'tag', pivot: [0.11, 0.86, -1.1], edge: 'sharp' });
    for (const [x, z] of [[0.3, 0.88], [-0.3, 0.88], [0.3, -0.88], [-0.3, -0.88]]) {
      b.stick([x, 0.12, z], [x, 0.8, z], 0.04, 'steel', { edge: 'sharp' });
      wheel(b, `wheel${x > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`, x, 0.06, z, 0.12, 0.04, 'gray');
    }
    return b
      .act({ click: [A.pose('tag', { rot: [25, 0, 0], dur: 0.3 }), A.pose('tag', { rot: [-18, 0, 0], dur: 0.4 }), A.par(A.pose('tag', { rot: [0, 0, 0], dur: 0.3 }), A.anim('wobble'), A.say('Squeak...', 1.5))] })
      .done();
  }),
  // A round horse corral 8 m across: post-and-rail fence with three rails, a gate that swings, a water trough and a
  // hay bale, a horse inside.
  e('corral', 'farm', 'farm things', () => {
    const R = 4;
    const b = m('corral', { edge: 'sharp' }).cyl([R * 2 + 0.4, 0.06, R * 2 + 0.4], [0, 0.03, 0], { color: 'dirt', edge: 'soft' });
    const pts = around(14, R, Math.PI / 2 - (Math.PI * 2) / 28);
    pts.forEach(([x, z], i) => {
      b.box([0.16, 1.55, 0.16], [x, 0.775, z], { color: 'darkwood' });
      if (i === 13) return;
      const [nx, nz] = pts[(i + 1) % pts.length];
      for (const y of [0.45, 0.9, 1.35]) b.stick([x, y, z], [nx, y, nz], 0.09, 'wood');
    });
    const [gx, gz] = pts[13], [hx, hz] = pts[0];
    const gl = Math.hypot(hx - gx, hz - gz), yaw = (Math.atan2(-(hz - gz), hx - gx) * 180) / Math.PI;
    b.box([gl - 0.2, 0.1, 0.06], [(gx + hx) / 2, 1.3, (gz + hz) / 2], { color: '#c8a06a', rot: [0, yaw, 0], name: 'gate', pivot: [gx, 0.8, gz], mover: { kind: 'swing', axis: 'y', amount: -80 } });
    for (const y of [0.4, 0.85]) b.box([gl - 0.2, 0.1, 0.06], [(gx + hx) / 2, y, (gz + hz) / 2], { color: '#c8a06a', rot: [0, yaw, 0], parent: 'gate' });
    b.box([0.1, 1.0, 0.06], [(gx + hx) / 2, 0.85, (gz + hz) / 2], { color: '#c8a06a', rot: [0, yaw, 45], parent: 'gate' });
    return b
      .box([1.6, 0.5, 0.55], [-2.2, 0.25, -1.5], { color: '#7a7f85', round: 0.15 })
      .box([1.45, 0.04, 0.42], [-2.2, 0.46, -1.5], { color: 'water', noInk: true })
      .box([1.1, 0.5, 0.6], [2.2, 0.25, -1.6], { color: '#e8c95a', round: 0.3, edge: 'soft' })
      .socket('pen', [0.6, 0.06, 0.2], 'top', { size: 3, yaw: 60 })
      .act({
        setup: [A.spawn('h', 'horse'), A.attach('h', 'self', 'pen')],
        click: [
          [A.operate('gate', 'open'), A.say('Creak!', 1.2), A.wait(2), A.operate('gate', 'close')],
          [A.par(A.anim('hop', 1, 'self.pen'), A.say('Neigh!', 1.5, 'self.pen'))],
        ],
      })
      .done();
  }),
  // A burgundy corset on a dressmaker's form: boned panels, a busk of hooks down the front, criss-cross lacing.
  e('corset', 'wardrobe', 'tops', () => {
    const c = '#8b1a2b';
    const b = dressForm('corset')
      .cyl([0.33, 0.18, 0.25], [0, 1.08, 0], { color: c, taper: 1.15 })
      .cyl([0.38, 0.2, 0.28], [0, 1.27, 0], { color: c, taper: 0.9 })
      .cyl([0.345, 0.025, 0.26], [0, 0.99, 0], { color: 'black' })
      .cyl([0.35, 0.025, 0.26], [0, 1.37, 0], { color: 'black' })
      .box([0.03, 0.36, 0.012], [0, 1.18, 0.142], { color: 'black', round: 0.3 });
    b.each(6, (i) => b.rod([-0.022, 1.02 + i * 0.06, 0.15], [0.022, 1.05 + i * 0.06, 0.15], 0.005, 'white', { noInk: true }).rod([0.022, 1.02 + i * 0.06, 0.15], [-0.022, 1.05 + i * 0.06, 0.15], 0.005, 'white', { noInk: true }));
    b.pair((s) => b.each(2, (i) => b.rod([s * (0.07 + i * 0.06), 1.0, 0.13 - i * 0.02], [s * (0.08 + i * 0.065), 1.36, 0.135 - i * 0.025], 0.005, '#5a0a1a', { noInk: true })));
    return b.act({ click: [A.par(A.anim('spin'), A.effect('hearts', { dur: 1.5 }))] }).done();
  }),
  // A folding camp cot (0.45 m): an olive canvas bed on X legs, a rolled orange sleeping bag and a pillow.
  e('cot', 'sports', 'camping', () => {
    const b = m('cot', { view: 'side' })
      .box([0.7, 0.04, 1.9], [0, 0.44, 0], { color: 'olive', round: 0.4 })
      .box([0.5, 0.12, 0.32], [0, 0.52, 0.72], { color: 'white', round: 0.8 })
      .box([0.64, 0.08, 1.1], [0, 0.5, -0.25], { color: 'orange', round: 0.6, name: 'bag', piece: true })
      .box([0.66, 0.02, 0.03], [0, 0.545, 0.29], { color: '#c05a10', parent: 'bag', noInk: true });
    b.pair((s) => {
      b.rod([s * 0.37, 0.44, -0.97], [s * 0.37, 0.44, 0.97], 0.035, 'darkgreen', { edge: 'sharp' });
      for (const z of [0.8, 0, -0.8]) b.rod([s * 0.34, 0.01, z - 0.16], [s * 0.34, 0.43, z + 0.16], 0.028, 'silver', { edge: 'sharp' }).rod([s * 0.34, 0.01, z + 0.16], [s * 0.34, 0.43, z - 0.16], 0.028, 'silver', { edge: 'sharp' });
    });
    return b
      .socket('bed', [0, 0.47, 0.1], 'top', { size: 1.2 })
      .act({ click: [A.pose('bag', { move: [0, 0.03, 0], dur: 0.15 }), A.pose('bag', { move: [0, 0, 0], dur: 0.15 }), A.par(A.anim('wobble'), A.say('Creak!', 1))] })
      .done();
  }),
  // A tub of cottage cheese, foil lid peeled back, lumpy curds, and a spoon that scoops some.
  e('cottage cheese', 'food', 'dairy', () => {
    const b = m('cottage cheese')
      .cyl([0.11, 0.07, 0.11], [0, 0.035, 0], { color: 'white', taper: 1.15 })
      .cyl([0.118, 0.025, 0.118], [0, 0.035, 0], { color: '#4a90d9' })
      .cyl([0.12, 0.004, 0.12], [-0.09, 0.05, -0.04], { color: 'silver', rot: [0, 0, 70], edge: 'sharp' });
    b.each(8, (i) => b.ball(0.026, [Math.cos(i * 0.8) * 0.03 * ((i % 2) + 0.3), 0.072 + (i % 3) * 0.006, Math.sin(i * 0.8) * 0.03 * ((i % 2) + 0.3)], { color: i % 2 ? 'white' : 'cream' }));
    return b
      .box([0.008, 0.005, 0.1], [0.04, 0.09, 0.03], { color: 'silver', rot: [30, 0, 0], name: 'spoon', piece: true, edge: 'sharp' })
      .ball([0.025, 0.012, 0.03], [0.04, 0.072, 0.0], { color: 'silver', parent: 'spoon', edge: 'sharp' })
      .act({ click: [A.pose('spoon', { move: [0, 0.06, 0.02], dur: 0.4 }), A.say('Nom!', 1), A.pose('spoon', { move: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A cut stem of a cotton plant: three bolls burst open with white fluff, dry brown bracts, a leaf.
  e('cotton', 'garden', 'crops', () => {
    const b = m('cotton')
      .ball([0.12, 0.03, 0.1], [0, 0.012, 0], { color: 'dirt' })
      .stick([0, 0, 0], [0, 0.3, 0], 0.012, '#6b4a2b');
    blade(b, [0, 0.12, 0], [0.09, 0.17, 0.02], 0.06, 0.004, 'leaf');
    for (const [x, y, z] of [[0.06, 0.24, 0.0], [-0.06, 0.2, 0.02], [0, 0.32, 0]] as V[]) {
      b.rod([0, y - 0.04, 0], [x, y, z], 0.008, '#6b4a2b');
      around(4, 0.025, 0.4).forEach(([dx, dz]) => b.cone([0.02, 0.035, 0.01], [x + dx, y - 0.01, z + dz], { color: '#6b4a2b', rot: [dz * 2000, 0, -dx * 2000] }));
      around(4, 0.022, 0.8).forEach(([dx, dz]) => b.ball(0.04, [x + dx, y + 0.02, z + dz], { color: 'white' }));
      b.ball(0.04, [x, y + 0.04, z], { color: '#fafafa' });
    }
    return b.act({ click: [A.par(A.effect('snow', { dur: 1.5 }), A.anim('wobble')), A.say('Poof!', 1)] }).done();
  }),
  // Three real cotton balls (3 cm), fluffy.
  e('cotton ball', 'home', 'bathroom', () => {
    const b = m('cotton ball');
    for (const [x, y, z] of [[-0.016, 0.014, 0], [0.016, 0.014, 0.006], [0, 0.036, 0.002]] as V[]) {
      b.ball(0.03, [x, y, z], { color: 'white' });
      b.ball(0.02, [x + 0.008, y + 0.005, z + 0.008], { color: '#fafafa' });
      b.ball(0.018, [x - 0.008, y + 0.004, z + 0.006], { color: '#fafafa' });
    }
    return b.act({ click: [A.anim('bounce'), A.say('Fluff!', 1)] }).done();
  }),
  // A big pink cloud of candy floss on a paper cone; a tuft comes off.
  e('cotton candy', 'food', 'sweets', () => {
    const b = m('cotton candy')
      .cone([0.04, 0.16, 0.04], [0, 0.08, 0], { color: 'white', rot: [180, 0, 0], edge: 'sharp' })
      .ball([0.2, 0.18, 0.18], [0, 0.25, 0], { color: '#f7a8c8', name: 'floss' });
    around(6, 0.08, 0.3).forEach(([x, z], i) => b.ball(0.09, [x, 0.24 + (i % 2) * 0.04, z], { color: i % 2 ? '#f7a8c8' : '#f9bcd6' }));
    return b
      .ball(0.08, [0.03, 0.34, 0.02], { color: '#f9bcd6', name: 'tuft', parent: 'floss', piece: true })
      .act({ click: [[A.detach('tuft', 'tuft'), A.say('Nom!', 1)], [A.reattach('tuft')]] })
      .done();
  }),
  // A clear jar of cotton swabs; one is pulled out and put back.
  e('cotton swab', 'home', 'bathroom', () => {
    const b = m('cotton swab').cyl([0.06, 0.08, 0.06], [0, 0.04, 0], { color: GLASS }).cyl([0.064, 0.012, 0.064], [0, 0.08, 0], { color: 'white', edge: 'sharp' });
    for (const [tx, tz] of [[-0.012, 0], [0.012, 0.008], [0, 0.014], [0.006, -0.012], [-0.01, -0.01]]) {
      const top: V = [tx * 1.5, 0.11, tz * 1.5];
      b.stick([tx * 0.4, 0.01, tz * 0.4], top, 0.003, 'white').ball([0.007, 0.012, 0.007], top, { color: 'white' });
    }
    return b
      .stick([0.004, 0.02, 0.004], [0.006, 0.105, 0.004], 0.003, 'white', { name: 'swab', piece: true })
      .ball([0.007, 0.012, 0.007], [0.006, 0.105, 0.004], { color: 'white', parent: 'swab' })
      .act({ click: [A.pose('swab', { move: [0.03, 0.08, 0.02], rot: [0, 0, -20], dur: 0.4 }), A.wait(1), A.pose('swab', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A green box of cough drops with its flap open and a couple of wrapped lozenges in front.
  e('cough drop', 'clinic', 'medicine', () =>
    m('cough drop', { edge: 'sharp' })
      .box([0.07, 0.1, 0.025], [0, 0.05, -0.02], { color: '#2a7a3a', round: 0.2 })
      .label('COUGH', [0.06, 0.022], [0, 0.07, -0.006], { color: '#2a7a3a', depth: 0.003 })
      .box([0.07, 0.003, 0.025], [0, 0.1015, -0.02], { color: '#2a7a3a', name: 'flap', pivot: [0, 0.1, -0.0325], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .ball([0.024, 0.016, 0.024], [-0.01, 0.008, 0.025], { color: '#c0392b', edge: 'soft' })
      .ball([0.024, 0.016, 0.024], [0.025, 0.008, 0.03], { color: '#e8b03a', edge: 'soft' })
      .cone([0.014, 0.016, 0.01], [0.004, 0.008, 0.025], { color: 'white', rot: [0, 0, -90] })
      .cone([0.014, 0.016, 0.01], [0.039, 0.008, 0.03], { color: 'white', rot: [0, 0, 90] })
      .act({ click: [A.operate('flap', 'open'), A.say('Ahem!', 1.2), A.wait(1.2), A.operate('flap', 'close')] })
      .done(),
  ),
  // A money-off coupon with a dashed border on a little stand, and a pair of scissors that snip.
  e('coupon', 'home', 'money', () => {
    const b = m('coupon', { edge: 'sharp' })
      .box([0.17, 0.02, 0.04], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .box([0.16, 0.085, 0.004], [0, 0.064, 0], { color: '#f7d23e', round: 0.1 })
      .label('50% OFF', [0.11, 0.04], [0, 0.064, 0.003], { color: '#f7d23e', depth: 0.002 });
    b.each(7, (i) => b.box([0.012, 0.003, 0.002], [-0.072 + i * 0.024, 0.1, 0.003], { color: 'black', noInk: true }).box([0.012, 0.003, 0.002], [-0.072 + i * 0.024, 0.028, 0.003], { color: 'black', noInk: true }));
    b.pair((s) => {
      const nm = s > 0 ? 'bladeA' : 'bladeB';
      b.box([0.006, 0.002, 0.07], [0.12, 0.004 + (s > 0 ? 0.002 : 0), 0.06], { color: 'silver', rot: [0, s * 10, 0], name: nm, pivot: [0.12, 0.004, 0.03], mover: { kind: 'swing', axis: 'y', amount: s * -14 } });
      b.torus([0.025, 0.025, 0.004], [0.12 + s * 0.015, 0.003, 0.0], { color: 'red', rot: [90, 0, 0], parent: nm });
    });
    return b.act({ click: [A.operate('blade', 'open'), A.operate('blade', 'close'), A.operate('blade', 'open'), A.operate('blade', 'close'), A.say('Snip snip!', 1.2)] }).done();
  }),
  // A neoclassical courthouse: wide stone steps, six columns under a pediment, tall windows, a green dome with a
  // flag. Bang goes the gavel and the doors open.
  e('courthouse', 'places', 'government', () => {
    const fz = 6;
    const b = tower('courthouse', { w: 18, d: 12, floors: 2, st: 4.2, wall: '#e8e0d0', trim: '#f6f1e6', base: '#b8b0a0', cols: 7, winW: 1.2, winH: 2.4, double: true, roof: '#b8b0a0' });
    b.each(6, (i) => b.cyl([0.75, 7.6, 0.75], [-5.5 + i * 2.2, 4.6, fz + 2.4], { color: '#f6f1e6', segs: 14 }));
    b.box([13.4, 1.0, 3.6], [0, 8.9, fz + 1.8], { color: '#f6f1e6' })
      .label('COURTHOUSE', [6, 0.6], [0, 8.9, fz + 3.62], { color: '#e8e0d0', depth: 0.04 })
      .wedge([14, 2.4, 3.8], [0, 10.6, fz + 1.8], { color: '#efe8da' })
      .box([13.6, 0.4, 4.2], [0, 0.6, fz + 2.1], { color: '#c8c0b0' })
      .box([14.4, 0.4, 5.2], [0, 0.2, fz + 2.6], { color: '#c8c0b0' })
      .cyl([5, 2.4, 5], [0, 9.6, -1], { color: '#e8e0d0', segs: 16 })
      .dome([5.4, 4.2, 5.4], [0, 10.8, -1], { color: '#6fa08c', edge: 'soft' })
      .stick([0, 15, -1], [0, 18.5, -1], 0.1, 'silver')
      .box([1.6, 1.0, 0.04], [0.82, 18.0, -1], { color: '#c0392b', name: 'flag', pivot: [0, 18.0, -1], edge: 'soft' });
    return b
      .act({
        click: [
          [A.say('Bang! Bang!', 1.5), A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
          [A.pose('flag', { rot: [0, 30, 0], dur: 0.4 }), A.pose('flag', { rot: [0, -20, 0], dur: 0.5 }), A.pose('flag', { rot: [0, 12, 0], dur: 0.4 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A terracotta bowl of fluffy couscous with chickpeas, carrot and herbs; it steams.
  e('couscous', 'food', 'grains', () => {
    const b = bowl('couscous', '#c0573a', '#f2d48a', 0.18, 0.06);
    for (const [x, z, c] of [[-0.03, 0.02, 'tan'], [0.02, 0.03, 'tan'], [0.04, -0.01, 'orange'], [-0.01, -0.03, 'orange'], [0.0, 0.0, 'green'], [-0.05, -0.01, 'green']] as Array<[number, number, string]>)
      b.box([0.016, 0.014, 0.016], [x, 0.085, z], { color: c, round: c === 'tan' ? 1 : 0.3 });
    return b.act({ click: [A.effect('steam', { dur: 2 }), A.say('Mmm...', 1.5)] }).done();
  }),
  // A cowbell on a drum-kit clamp, its wooden stick resting against it; clonk clonk.
  e('cowbell', 'music', 'percussion', () =>
    m('cowbell', { edge: 'sharp' })
      // a flat-fronted box flaring to its mouth (a 4-sided cyl is square to the axes, sized corner to corner)
      .cyl([0.12 * Math.SQRT2, 0.16, 0.08 * Math.SQRT2], [0, 0.17, 0], { color: '#8a8a8a', taper: 0.62, name: 'bell', pivot: [0, 0.27, 0], segs: 4 })
      .cyl([0.125 * Math.SQRT2, 0.014, 0.085 * Math.SQRT2], [0, 0.095, 0], { color: '#5a5a5a', parent: 'bell', segs: 4 })
      .box([0.03, 0.03, 0.03], [0, 0.265, 0], { color: '#3a3a3a', parent: 'bell' })
      .stick([0, 0.28, 0], [0, 0.32, 0], 0.012, '#3a3a3a')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#3a3a3a' })
      .stick([0, 0.02, 0], [0, 0.29, -0.04], 0.016, 'silver')
      .rod([0.1, 0.0, 0.06], [0.04, 0.24, 0.08], 0.014, 'lightwood')
      .act({ click: [A.pose('bell', { rot: [0, 0, 12], dur: 0.1 }), A.pose('bell', { rot: [0, 0, -8], dur: 0.15 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.1 }), A.say('Clonk! Clonk!', 1.5)] })
      .done(),
  ),
  // A tall tooled-leather cowboy boot: pointed toe, stacked heel, stitched shaft, pull straps, and a spur whose
  // rowel jingles round.
  e('cowboy boot', 'wardrobe', 'shoes', () =>
    m('cowboy boot')
      .box([0.08, 0.065, 0.07], [0, 0.0325, -0.08], { color: '#3a2414', round: 0.2, edge: 'sharp' })
      .box([0.1, 0.02, 0.25], [0, 0.04, 0.03], { color: '#3a2414', round: 0.3, rot: [-6, 0, 0], edge: 'sharp' })
      .box([0.1, 0.08, 0.2], [0, 0.09, 0.02], { color: '#a0602a', round: 0.7, rot: [8, 0, 0] })
      .cone([0.085, 0.12, 0.065], [0, 0.07, 0.16], { color: '#a0602a', rot: [90, 0, 0] })
      .cyl([0.115, 0.26, 0.13], [0, 0.25, -0.04], { color: '#c8843a' })
      .cyl([0.12, 0.04, 0.135], [0, 0.39, -0.035], { color: '#a0602a', rot: [-10, 0, 0] })
      .box([0.02, 0.05, 0.03], [0.06, 0.39, -0.04], { color: '#a0602a', round: 0.5 })
      .box([0.02, 0.05, 0.03], [-0.06, 0.39, -0.04], { color: '#a0602a', round: 0.5 })
      .rod([-0.03, 0.34, 0.025], [0, 0.2, 0.026], 0.006, 'cream', { noInk: true })
      .rod([0.03, 0.34, 0.025], [0, 0.2, 0.026], 0.006, 'cream', { noInk: true })
      .arc([0.11, 0.06, 0.01], [0, 0.09, -0.11], { color: 'silver', arc: 200, rot: [90, 0, 0], edge: 'sharp' })
      .stick([0, 0.09, -0.135], [0, 0.09, -0.16], 0.008, 'silver', { edge: 'sharp' })
      .cyl([0.012, 0.006, 0.012], [0, 0.09, -0.17], { color: 'silver', rot: [0, 0, 90], name: 'rowel', edge: 'sharp' })
      .star(0.04, [0, 0.09, -0.17], { color: 'silver', rot: [0, 90, 0], parent: 'rowel', round: 0.004, edge: 'sharp' })
      .act({ click: [A.pose('rowel', { spin: [720, 0, 0] }), A.say('Jingle jangle!', 1.5), A.wait(1.2), A.pose('rowel', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A brown felt cowboy hat: wide brim curled up at the sides, a pinched crown and a dark band.
  e('cowboy hat', 'wardrobe', 'hats', () => {
    const c = '#a0703a';
    const b = m('cowboy hat')
      .ball([0.3, 0.035, 0.38], [0, 0.03, 0], { color: c })
      .cyl([0.18, 0.12, 0.2], [0, 0.11, 0], { color: c, taper: 0.85 })
      .ball([0.155, 0.06, 0.17], [0, 0.17, 0], { color: c })
      .ball([0.04, 0.03, 0.12], [0, 0.195, 0], { color: '#8a5a2a', noInk: true })
      .cyl([0.186, 0.026, 0.206], [0, 0.065, 0], { color: 'darkbrown' });
    b.pair((s) => b.ball([0.1, 0.035, 0.34], [s * 0.15, 0.06, 0], { color: c, rot: [0, 0, s * 35] }));
    return b.act({ click: [A.anim('hop'), A.anim('spin'), A.say('Yee-haw!', 1.5)] }).done();
  }),
  // Two golden crab cakes on a plate with a lemon wedge and tartar sauce; they sizzle.
  e('crab cake', 'food', 'seafood', () => {
    const b = m('crab cake')
      .cyl([0.24, 0.015, 0.24], [0, 0.0075, 0], { color: 'white' })
      .ball([0.09, 0.045, 0.09], [-0.035, 0.035, 0.01], { color: '#c8872e' })
      .ball([0.09, 0.045, 0.09], [0.04, 0.04, -0.02], { color: '#d4943a', rot: [0, 0, -15] })
      .wedge([0.05, 0.04, 0.03], [0.06, 0.035, 0.07], { color: 'yellow', rot: [0, 30, 0] })
      .ball([0.04, 0.025, 0.04], [-0.06, 0.025, 0.07], { color: '#f8e8d0' });
    b.each(6, (i) => b.ball(0.008, [-0.06 + (i % 3) * 0.025, 0.055, Math.floor(i / 3) * 0.03 - 0.005], { color: i % 2 ? 'red' : 'green', noInk: true }));
    return b.act({ click: [A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.2)] }).done();
  }),
  // A stack of square crackers with docking holes and a cube of cheese; one snaps off.
  e('cracker', 'food', 'snacks', () => {
    const b = m('cracker', { edge: 'sharp' });
    b.each(4, (i) => b.box([0.065, 0.007, 0.065], [-0.02, 0.0035 + i * 0.0075, 0], { color: '#e8b860', round: 0.3, rot: [0, i * 12, 0], ...(i === 0 ? { name: 'stack' } : {}) }));
    b.box([0.065, 0.065, 0.007], [0.04, 0.034, 0.03], { color: '#e8b860', round: 0.3, rot: [-12, 0, 0], name: 'cracker', parent: 'stack', piece: true });
    b.each(9, (i) => b.ball(0.005, [0.02 + (i % 3) * 0.02, 0.014 + Math.floor(i / 3) * 0.02, 0.0345 - Math.floor(i / 3) * 0.004], { color: '#b8853a', noInk: true, parent: 'cracker' }));
    return b.box([0.025, 0.025, 0.025], [-0.05, 0.043, 0.02], { color: 'cheese', round: 0.2 }).act({ click: [[A.detach('cracker', 'bit'), A.say('Snap!', 1)], [A.reattach('cracker')]] }).done();
  }),
  // A wooden rocking cradle: curved rockers, spindled sides, a hood at the head, a pink blanket. It rocks.
  e('cradle', 'home', 'nursery', () => {
    const b = m('cradle', { edge: 'sharp' }).box([0.85, 0.08, 0.45], [0, 0.3, 0], { color: 'wood', round: 0.15, name: 'body', pivot: [0, 0.02, 0] });
    b.pair((s) => {
      const z = s * 0.2;
      const xs = [-0.5, -0.25, 0, 0.25, 0.5];
      for (let i = 0; i < 4; i++) b.rod([xs[i], 0.04 + 0.5 * xs[i] * xs[i], z], [xs[i + 1], 0.04 + 0.5 * xs[i + 1] * xs[i + 1], z], 0.05, 'darkwood', { parent: 'body' });
      b.box([0.05, 0.25, 0.05], [0.3, 0.17, z], { color: 'darkwood', parent: 'body' }).box([0.05, 0.25, 0.05], [-0.3, 0.17, z], { color: 'darkwood', parent: 'body' });
      b.box([0.86, 0.05, 0.04], [0, 0.68, s * 0.22], { color: 'wood', round: 0.3, parent: 'body' });
      b.each(7, (i) => b.box([0.025, 0.32, 0.025], [-0.36 + i * 0.12, 0.5, s * 0.22], { color: 'wood', parent: 'body' }));
    });
    b.box([0.04, 0.4, 0.46], [0.42, 0.5, 0], { color: 'wood', round: 0.2, parent: 'body' })
      .box([0.04, 0.45, 0.46], [-0.42, 0.52, 0], { color: 'wood', round: 0.2, parent: 'body' })
      .box([0.76, 0.1, 0.4], [0, 0.4, 0], { color: '#f6c8d8', round: 0.6, parent: 'body', edge: 'soft' })
      .ball([0.18, 0.08, 0.26], [-0.28, 0.47, 0], { color: 'white', parent: 'body', edge: 'soft' })
      .dome([0.36, 0.5, 0.5], [-0.33, 0.68, 0], { color: '#f6c8d8', rot: [0, 0, 90], parent: 'body', edge: 'soft' });
    return b
      .socket('bed', [0, 0.45, 0], 'top', { size: 0.6 })
      .act({ click: [A.pose('body', { rot: [0, 0, 8], dur: 0.5 }), A.pose('body', { rot: [0, 0, -8], dur: 0.9 }), A.pose('body', { rot: [0, 0, 6], dur: 0.8 }), A.pose('body', { rot: [0, 0, 0], dur: 0.5 }), A.say('Rock-a-bye...', 2)] })
      .done();
  }),
  // A handful of glossy cranberries with a leaf; good ones bounce.
  e('cranberry', 'food', 'fruit', () => {
    const b = m('cranberry');
    for (const [x, y, z] of [[0, 0.007, 0], [0.014, 0.007, 0.006], [-0.013, 0.007, 0.007], [0.006, 0.007, -0.013], [-0.009, 0.007, -0.011], [0.002, 0.019, 0.001], [0.015, 0.007, -0.01]] as V[])
      b.ball(0.014, [x, y, z], { color: '#b0122b' });
    return b.ball([0.024, 0.005, 0.012], [-0.012, 0.024, 0.0], { color: 'leaf', rot: [0, 0, 25] }).act({ click: [A.anim('bounce', 3), A.say('Boing!', 1)] }).done();
  }),
  // A can-shaped log of jellied cranberry sauce on a plate, ridges and all, two slices fallen off; it wobbles.
  e('cranberry sauce', 'food', 'sides', () => {
    const b = m('cranberry sauce')
      .cyl([0.24, 0.015, 0.24], [0, 0.0075, 0], { color: 'white' })
      .cyl([0.08, 0.1, 0.08], [-0.03, 0.065, -0.01], { color: '#8b0a1e' })
      .cyl([0.08, 0.016, 0.08], [0.06, 0.04, 0.03], { color: '#a0122a', rot: [70, 0, 0] })
      .cyl([0.08, 0.016, 0.08], [0.07, 0.025, 0.06], { color: '#a0122a', rot: [20, 0, 0] });
    b.each(3, (i) => b.torus([0.082, 0.082, 0.006], [-0.03, 0.04 + i * 0.025, -0.01], { color: '#6b0a18', rot: [90, 0, 0], tube: 0.08, noInk: true }));
    return b.act({ click: [A.anim('wobble', 2), A.say('Shlorp!', 1)] }).done();
  }),
  // A mobile crane at real size (12 m carrier, boom tip 12 m up): four axles, the carrier cab, outrigger beams with
  // pads, and a turntable with the operator's cab, counterweight and a yellow telescopic boom with a hook block.
  // The hook lowers; the whole upper works slew round.
  e('crane (vehicle)', 'garage', 'construction vehicles', () => {
    const Y = '#f2b81b';
    const b = m('crane (vehicle)', { view: 'side', edge: 'sharp' })
      .box([2.5, 0.9, 11.5], [0, 1.4, 0], { color: Y, round: 0.1 })
      .box([2.55, 0.25, 11.6], [0, 0.95, 0], { color: '#2a2726', round: 0.2 })
      .box([1.3, 1.8, 2.0], [-0.6, 2.4, 4.7], { color: Y, round: 0.15 })
      .box([1.2, 0.9, 0.06], [-0.6, 2.7, 5.71], { color: DARKWIN, rot: [-6, 0, 0] })
      .box([0.06, 0.9, 1.2], [-1.26, 2.7, 4.8], { color: DARKWIN })
      .box([2.55, 0.35, 0.3], [0, 0.95, 5.85], { color: '#2a2726', round: 0.2 })
      .label('CRANE HIRE', [2.6, 0.45], [1.26, 1.45, 0], { color: Y, rot: [0, 90, 0], depth: 0.02 });
    b.pair((s) => {
      b.ball([0.25, 0.2, 0.08], [s * 0.95, 1.3, 5.8], { color: '#fff6c8', glow: true, edge: 'soft' });
      for (const z of [3.3, -4.6]) b.box([0.6, 0.35, 0.4], [s * 1.45, 1.0, z], { color: '#2a2726', name: `outrigger${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`, mover: { kind: 'slide', axis: 'x', amount: s * 1.6 } })
        .cyl([0.5, 0.15, 0.5], [s * 1.6, 0.25, z], { color: '#3a3633', parent: `outrigger${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}` })
        .stick([s * 1.6, 0.35, z], [s * 1.6, 0.85, z], 0.18, 'silver', { parent: `outrigger${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}` });
    });
    let n = 1;
    for (const z of [4.4, 2.9, -2.4, -3.8]) b.pair((s) => wheel(b, `wheel${n++}`, s * 1.1, 0.6, z, 1.2, 0.45));
    b.cyl([2.2, 0.3, 2.2], [0, 2.0, -1.8], { color: '#3a3633', name: 'turret' })
      .box([2.4, 1.2, 3.6], [0, 2.75, -2.4], { color: Y, round: 0.1, parent: 'turret' })
      .box([2.4, 1.3, 1.0], [0, 2.7, -4.6], { color: '#3a3633', round: 0.1, parent: 'turret' })
      .box([0.9, 1.5, 1.5], [1.25, 3.0, -0.9], { color: Y, round: 0.15, parent: 'turret' })
      .box([0.92, 0.8, 1.2], [1.25, 3.3, -0.88], { color: DARKWIN, round: 0.1, parent: 'turret' });
    const pv: V = [0, 3.4, -1.0], ang = (38 * Math.PI) / 180, dir: V = [0, Math.sin(ang), Math.cos(ang)];
    const along = (L: number): V => [pv[0], pv[1] + dir[1] * L, pv[2] + dir[2] * L];
    for (const [L0, L1, wd, c] of [[-1.2, 6, 1.0, Y], [5.5, 10.5, 0.8, Y], [10, 14.2, 0.62, '#e0a810']] as Array<[number, number, number, string]>) {
      const mid = along((L0 + L1) / 2);
      b.box([wd, wd, L1 - L0], mid, { color: c, rot: [-38, 0, 0], round: 0.1, parent: 'turret' });
    }
    b.rod([0, 2.9, -1.6], along(4), 0.3, 'silver', { parent: 'turret' });
    const tip = along(14.4);
    b.cyl([0.5, 0.3, 0.5], tip, { color: '#3a3633', rot: [0, 0, 90], parent: 'turret' })
      .stick(tip, [0, tip[1] - 5.5, tip[2]], 0.05, '#2a2726', { parent: 'turret' })
      .box([0.5, 0.7, 0.4], [0, tip[1] - 5.8, tip[2]], { color: '#c0392b', round: 0.2, name: 'hook', parent: 'turret' })
      .arc([0.4, 0.4, 0.08], [0, tip[1] - 6.35, tip[2]], { color: 'silver', arc: 260, rot: [0, 90, 180], tube: 0.3, parent: 'hook' });
    return b
      .socket('seat', [-0.6, 1.9, 4.7], 'seat')
      .act({
        click: [
          [A.say('Beep, beep, beep...', 2), A.pose('hook', { move: [0, -3, 0], dur: 1.5 }), A.wait(1), A.pose('hook', { move: [0, 0, 0], dur: 1.5 })],
          [A.pose('turret', { rot: [0, 50, 0], dur: 2 }), A.wait(0.8), A.pose('turret', { rot: [0, 0, 0], dur: 2 })],
          [A.operate('outrigger', 'out'), A.say('Clunk!', 1), A.wait(2), A.operate('outrigger', 'in')],
        ],
      })
      .done();
  }),
  // A wooden shipping crate (0.8 m): planks inside a frame of battens with diagonal braces and a stencil; the lid
  // lifts.
  e('crate', 'workshop', 'containers', () => {
    const b = m('crate', { edge: 'sharp' }).box([0.8, 0.66, 0.7], [0, 0.33, 0], { color: '#c8a06a', round: 0.03 });
    const f = '#9a7040';
    for (const zz of [0.355, -0.355]) {
      b.box([0.8, 0.08, 0.02], [0, 0.04, zz], { color: f }).box([0.08, 0.66, 0.02], [0.36, 0.33, zz], { color: f }).box([0.08, 0.66, 0.02], [-0.36, 0.33, zz], { color: f });
      b.rod([-0.31, 0.1, zz], [0.31, 0.6, zz], 0.06, f);
      b.each(3, (i) => b.box([0.64, 0.004, 0.022], [0, 0.2 + i * 0.16, zz], { color: '#8a6a40', noInk: true }));
    }
    b.box([0.02, 0.08, 0.7], [0.405, 0.04, 0], { color: f }).box([0.02, 0.08, 0.7], [-0.405, 0.04, 0], { color: f });
    return b
      .box([0.84, 0.06, 0.74], [0, 0.69, 0], { color: '#b8905a', round: 0.1, name: 'lid', piece: true })
      .box([0.84, 0.02, 0.08], [0, 0.73, 0.2], { color: f, parent: 'lid' })
      .box([0.84, 0.02, 0.08], [0, 0.73, -0.2], { color: f, parent: 'lid' })
      .label('FRAGILE', [0.3, 0.09], [-0.12, 0.45, 0.37], { color: '#e8d0a0', depth: 0.004 })
      .socket('inside', [0, 0.3, 0], 'inside', { size: 0.6 })
      .act({ click: [A.pose('lid', { move: [0, 0.18, 0.05], rot: [-25, 0, 0], dur: 0.5 }), A.say('Creak!', 1.2), A.wait(1.5), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }), A.say('Thump.', 1)] })
      .done();
  }),
  // A small impact crater as a landform (30 m across): a raised rim of rock and boulders round a bowl, with a
  // meteorite in the middle that glows hot and smokes.
  e('crater', 'nature', 'landforms', () => {
    const b = m('crater')
      .cyl([32, 0.3, 32], [0, 0.15, 0], { color: '#a89a88' })
      .torus([28, 28, 7], [0, 1.6, 0], { color: '#9a8a78', rot: [90, 0, 0], tube: 0.36 })
      .cyl([15, 0.15, 15], [0, 0.3, 0], { color: '#6f6458' })
      .ball([2.4, 1.6, 2.0], [0.4, 1.0, 0.6], { color: '#4a3a2e', name: 'meteor' })
      .ball([1.0, 0.6, 0.8], [0.9, 1.6, 1.1], { color: 'orange', glow: true, name: 'glow', mover: { kind: 'light' } });
    around(12, 11.5, 0.2).forEach(([x, z], i) => b.ball([2.4 + rnd(i) * 2, 1.5 + rnd(i + 4) * 1.6, 2.2], [x, 3.1 + rnd(i + 9) * 0.6, z], { color: i % 2 ? '#8a7a68' : 'rock' }));
    for (const [x, z, s] of [[13, 9, 1.8], [-14, 6, 1.4], [8, -13, 1.6], [-6, 14, 1.2]]) b.ball([s, s * 0.6, s], [x, 0.5, z], { color: 'rock' });
    return b
      .act({
        click: [
          [A.operate('glow', 'on'), A.effect('smoke', { dur: 2.5 }), A.say('Fssss...', 2)],
          [A.operate('glow', 'off'), A.effect('dust', { dur: 1.5 })],
        ],
      })
      .done();
  }),
  // The crawlspace under a house, shown as a cutaway corner of the house (its 2.4 m ground-floor wall with a window
  // above, so it reads; the crawlspace itself is the 0.8 m void): a concrete-block foundation wall with an air vent
  // and a little access hatch at the front, and the right side cut open to show inside: floor joists overhead,
  // brick piers, a water pipe and a drain on hangers, a vapour barrier on the dirt. Open the hatch and two eyes
  // blink in the dark. (Taller than the vocabulary's 0.6 m because the house above is part of the picture.)
  e('crawlspace', 'places', 'rooms', () => {
    const BL = '#9a958e', SD = '#d8c8a8', fz = 1.5;
    const b = m('crawlspace', { edge: 'sharp' })
      .box([5.2, 0.04, 4.2], [0, 0.02, 0.2], { color: 'grass', edge: 'soft' })
      .box([3.8, 0.03, 2.8], [0.1, 0.035, 0], { color: 'dirt', round: 0, edge: 'soft' })
      .box([2.2, 0.012, 1.8], [0.4, 0.055, -0.2], { color: '#cfd6dc', round: 0, noInk: true })
      // foundation walls: front, back and left (the right side is cut away)
      .box([4.0, 0.8, 0.2], [0, 0.4, fz - 0.1], { color: BL, round: 0.02 })
      .box([4.0, 0.8, 0.2], [0, 0.4, -fz + 0.1], { color: BL, round: 0.02 })
      .box([0.2, 0.8, 3.0], [-1.9, 0.4, 0], { color: BL, round: 0.02 });
    b.each(3, (r) => b.box([4.0, 0.012, 0.012], [0, 0.2 + r * 0.2, fz + 0.002], { color: '#7e7a74', noInk: true, round: 0 }));
    // the floor overhead: joists spanning the house, the subfloor on them, a rim board along the cut
    b.each(7, (i) => b.box([4.0, 0.22, 0.06], [0, 0.89, -1.2 + i * 0.4], { color: '#c89a5e', round: 0.05 }));
    b.box([4.0, 0.05, 3.0], [0, 1.025, 0], { color: '#b5814e', round: 0 })
      .box([4.0, 0.22, 0.06], [0, 0.89, fz - 0.23], { color: '#a8743e', round: 0.05 });
    // brick piers, pipes on hangers
    for (const x of [-0.4, 1.1]) b.box([0.34, 0.78, 0.34], [x, 0.41, 0], { color: '#a65a3c', round: 0.05 });
    b.stick([-1.8, 0.66, 0.55], [2.0, 0.66, 0.55], 0.05, 'copper')
      .stick([-1.8, 0.5, -0.65], [2.0, 0.5, -0.65], 0.11, '#e6e6de');
    for (const x of [-1.0, 0.4, 1.6]) b.stick([x, 0.78, -0.65], [x, 0.56, -0.65], 0.02, '#5c6166').stick([x, 0.78, 0.55], [x, 0.69, 0.55], 0.02, '#5c6166');
    // the access hatch (dark behind it, two eyes) and the vent grille in the front wall
    b.box([0.75, 0.48, 0.03], [-0.6, 0.4, fz + 0.01], { color: '#14110e' })
      .ball(0.03, [-0.72, 0.44, fz + 0.035], { color: '#f2e45a', glow: true, name: 'eyeL', scale: 0 })
      .ball(0.03, [-0.62, 0.44, fz + 0.035], { color: '#f2e45a', glow: true, name: 'eyeR', scale: 0 })
      .box([0.72, 0.46, 0.04], [-0.6, 0.4, fz + 0.04], { color: '#7a7f85', round: 0.1, name: 'door', pivot: [-0.96, 0.4, fz + 0.04], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.08, 0.04, 0.03], [-0.32, 0.4, fz + 0.07], { color: '#3a3633', parent: 'door' })
      .box([0.42, 0.22, 0.03], [0.9, 0.45, fz + 0.01], { color: '#555555' });
    b.each(4, (i) => b.box([0.36, 0.012, 0.01], [0.9, 0.38 + i * 0.045, fz + 0.03], { color: '#888888', noInk: true }));
    // the house's ground-floor wall above: siding, corner boards, a window, a trim board where it is cut off
    b.box([4.0, 2.4, 3.0], [0, 2.25, 0], { color: SD, round: 0.01 })
      .box([4.06, 0.12, 3.06], [0, 3.48, 0], { color: '#f2ece0', round: 0.1 })
      .box([4.1, 0.1, 3.1], [0, 1.08, 0], { color: '#f2ece0', round: 0.1 });
    b.each(11, (i) => b.box([4.02, 0.025, 0.03], [0, 1.25 + i * 0.2, fz + 0.005], { color: '#c8b898', noInk: true, round: 0 }));
    for (const [x, z] of [[-1.97, fz - 0.03], [1.97, fz - 0.03], [1.97, -fz + 0.03]] as const) b.box([0.12, 2.4, 0.12], [x, 2.25, z], { color: '#f2ece0', round: 0.1 });
    win(b, 0.5, 2.35, fz, 1.0, 1.2, '#f2ece0', { bars: true, glass: DARKWIN });
    b.stick([1.4, 0.06, fz + 0.06], [1.4, 1.0, fz + 0.06], 0.05, 'copper').box([0.14, 0.1, 0.1], [1.4, 0.55, fz + 0.08], { color: '#9a6a3e', round: 0.3 });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.pose('eyeL', { scale: 1, dur: 0.2 }), A.pose('eyeR', { scale: 1, dur: 0.2 })), A.say('!', 1), A.wait(1.2), A.par(A.pose('eyeL', { scale: 0, dur: 0.1 }), A.pose('eyeR', { scale: 0, dur: 0.1 })), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // An open box of real-size crayons (9 cm), tips up in a rainbow, one lying in front; the red one comes up to draw.
  e('crayon', 'study', 'art supplies', () => {
    const b = m('crayon')
      .box([0.1, 0.07, 0.03], [0, 0.035, 0], { color: '#f2c14e', round: 0.1, edge: 'sharp' })
      .label('CRAYONS', [0.08, 0.025], [0, 0.04, 0.016], { color: '#2e8b57', depth: 0.002 })
      .box([0.1, 0.03, 0.004], [0, 0.085, -0.016], { color: '#2e8b57', rot: [-25, 0, 0], round: 0.1, edge: 'sharp' });
    const cs = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black'];
    cs.forEach((c, i) => {
      const x = -0.042 + i * 0.012, h = 0.075 + (i % 2) * 0.006;
      const o = i === 0 ? { name: 'red', piece: true } : {};
      b.cyl([0.008, h, 0.008], [x, 0.012 + h / 2, (i % 2) * 0.006 - 0.003], { color: c, ...o });
      b.cyl([0.008, 0.01, 0.008], [x, 0.017 + h, (i % 2) * 0.006 - 0.003], { color: c, taper: 0.35, ...(i === 0 ? { parent: 'red' } : {}) });
    });
    return b
      .cyl([0.008, 0.09, 0.008], [0.03, 0.004, 0.04], { color: 'blue', rot: [0, 70, 90] })
      .cyl([0.0085, 0.06, 0.0085], [0.03, 0.004, 0.04], { color: '#1e3a8a', rot: [0, 70, 90] })
      .act({ click: [A.pose('red', { move: [0, 0.06, 0.02], dur: 0.4 }), A.pose('red', { move: [0.015, 0.06, 0.02], rot: [0, 0, 15], dur: 0.2 }), A.pose('red', { move: [-0.015, 0.06, 0.02], rot: [0, 0, -15], dur: 0.2 }), A.say('Scribble!', 1.2), A.pose('red', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A little white cream jug with a spout, and a bowl of whipped cream in swirls; the jug pours.
  e('cream', 'food', 'dairy', () =>
    m('cream')
      .cyl([0.07, 0.08, 0.07], [-0.04, 0.04, 0], { color: 'white', taper: 0.85, name: 'jug' })
      .cyl([0.056, 0.006, 0.056], [-0.04, 0.08, 0], { color: 'cream', noInk: true })
      .cone([0.025, 0.02, 0.02], [-0.04, 0.078, 0.032], { color: 'white', rot: [-60, 0, 0] })
      .torus([0.05, 0.05, 0.012], [-0.085, 0.045, 0], { color: 'white' })
      .cyl([0.07, 0.03, 0.07], [0.06, 0.015, 0.03], { color: '#7fb3d5', taper: 1.4 })
      .torus([0.085, 0.085, 0.03], [0.06, 0.04, 0.03], { color: '#fffaf0', rot: [90, 0, 0], tube: 0.4 })
      .torus([0.06, 0.06, 0.025], [0.06, 0.063, 0.03], { color: '#fffaf0', rot: [90, 0, 0], tube: 0.4 })
      .cone([0.04, 0.04, 0.04], [0.06, 0.088, 0.03], { color: '#fffaf0' })
      .act({ click: [A.set({ tilt: 35, dur: 0.4 }), A.say('Glug...', 1.2), A.wait(1.2), A.set({ tilt: 0, dur: 0.4 })] })
      .done(),
  ),
  // A foil-wrapped brick of cream cheese and a bagel half with a thick schmear, a knife that spreads it.
  e('cream cheese', 'food', 'dairy', () =>
    m('cream cheese')
      .box([0.1, 0.045, 0.06], [-0.05, 0.0225, -0.03], { color: 'silver', round: 0.2, edge: 'sharp' })
      .box([0.06, 0.03, 0.004], [-0.05, 0.025, 0.001], { color: '#3a6fd8', edge: 'sharp' })
      .torus([0.11, 0.11, 0.035], [0.06, 0.0175, 0.04], { color: '#c8872e', rot: [90, 0, 0], tube: 0.38 })
      .torus([0.1, 0.1, 0.014], [0.06, 0.036, 0.04], { color: 'white', rot: [90, 0, 0], tube: 0.38 })
      .box([0.1, 0.003, 0.016], [0.07, 0.05, 0.04], { color: 'silver', rot: [0, 30, 8], name: 'knife', piece: true, edge: 'sharp' })
      .act({ click: [A.pose('knife', { move: [-0.03, 0, 0.01], dur: 0.3 }), A.pose('knife', { move: [0.02, 0, -0.01], dur: 0.3 }), A.pose('knife', { move: [0, 0, 0], dur: 0.3 }), A.say('Spread, spread.', 1.2)] })
      .done(),
  ),
  // A choux cream puff dusted with sugar, cream piped between the halves; the lid lifts to show the cream.
  e('cream puff', 'food', 'desserts', () => {
    const b = m('cream puff')
      .ball([0.095, 0.05, 0.095], [0, 0.025, 0], { color: '#d9a050', name: 'base' })
      .cyl([0.08, 0.02, 0.08], [0, 0.052, 0], { color: '#fffaf0' });
    around(9, 0.04).forEach(([x, z]) => b.ball([0.026, 0.03, 0.026], [x, 0.06, z], { color: '#fffaf0' }));
    b.ball([0.085, 0.05, 0.085], [0, 0.088, -0.004], { color: '#e0a858', rot: [-10, 0, 0], name: 'lid', parent: 'base', piece: true });
    b.each(8, (i) => b.ball(0.009, [Math.cos(i) * 0.022, 0.112, Math.sin(i) * 0.022 - 0.006], { color: 'white', noInk: true, parent: 'lid' }));
    return b.act({ click: [A.pose('lid', { move: [0, 0.04, 0], rot: [0, 0, 15], dur: 0.4 }), A.effect('sparkle', { dur: 1 }), A.wait(1.2), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A real-size credit card (85.6 x 54 mm) in a clear stand: chip, number, logo; tap it to pay.
  e('credit card', 'home', 'money', () =>
    m('credit card', { edge: 'sharp' })
      .box([0.1, 0.012, 0.03], [0, 0.006, 0], { color: GLASS, round: 0.3 })
      .box([0.0856, 0.054, 0.0008], [0, 0.04, 0], { color: '#2a5bd7', round: 0.15 })
      .box([0.012, 0.009, 0.0006], [-0.025, 0.045, 0.0006], { color: 'gold', round: 0.2 })
      .label('1234 5678 9012', [0.065, 0.007], [0, 0.03, 0.0006], { color: '#2a5bd7', depth: 0.0004 })
      .ball([0.012, 0.012, 0.0006], [0.026, 0.06, 0.0006], { color: '#e8413a', noInk: true })
      .ball([0.012, 0.012, 0.0006], [0.034, 0.06, 0.0007], { color: '#f2b81b', noInk: true })
      .act({ click: [A.anim('hop'), A.par(A.effect('sparkle', { dur: 1 }), A.say('Beep! Approved.', 1.5))] })
      .done(),
  ),
  // A stretch of creek: a winding ribbon of water between grassy banks, stepping stones, cattails and a plank
  // footbridge. It babbles, and a fish jumps.
  e('creek', 'nature', 'water', () => {
    const b = m('creek').box([7, 0.2, 4], [0, 0.1, 0], { color: 'grass', round: 0.3 });
    const path: Array<[number, number, number]> = [[-3, -1.2, 30], [-1.6, -0.4, 10], [-0.2, 0.0, -15], [1.2, 0.2, 20], [2.6, 0.9, 35]];
    for (const [x, z, r] of path) b.ball([1.8, 0.08, 0.9], [x, 0.17, z], { color: 'water', rot: [0, r, 0] }).ball([1.9, 0.04, 1.1], [x, 0.15, z], { color: '#8a7a5a', rot: [0, r, 0] });
    for (const [x, z, s] of [[-1.0, -0.3, 0.3], [-0.6, -0.05, 0.25], [1.8, 0.7, 0.35], [-2.4, -0.6, 0.28], [0.5, 0.4, 0.22]]) b.ball([s * 1.4, s * 0.6, s * 1.2], [x, 0.2, z], { color: 'rock' });
    b.each(5, (i) => {
      const x = -2.8 + i * 0.18, z = 0.6 + (i % 2) * 0.15;
      b.stick([x, 0.15, z], [x, 1.1 + i * 0.06, z], 0.025, 'leaf').capsule([0.06, 0.18, 0.06], [x, 1.0 + i * 0.06, z], { color: 'darkbrown' });
    });
    b.each(5, (i) => b.box([0.25, 0.08, 1.6], [0.6 + i * 0.27, 0.42, 0.1], { color: 'wood', round: 0.2, edge: 'sharp' }));
    b.pair((s) => b.box([1.4, 0.15, 0.12], [1.15, 0.36, 0.1 + s * 0.75], { color: 'darkwood', edge: 'sharp' }));
    return b
      .ball([0.2, 0.08, 0.06], [-1.6, 0.2, -0.4], { color: '#c87a3a', name: 'fish', piece: true })
      .act({
        click: [
          [A.effect('water_spray', { dur: 2 }), A.say('Babble, babble...', 2)],
          [A.pose('fish', { move: [0.2, 0.6, 0], rot: [0, 0, 40], dur: 0.35 }), A.pose('fish', { move: [0.4, 0, 0], rot: [0, 0, -40], dur: 0.35 }), A.say('Splash!', 1), A.pose('fish', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0 })],
        ],
      })
      .done();
  }),
  // A cricket bat leaning on a wicket: three stumps with two bails on top, and the red ball. Hit the stumps: the
  // bails fly off. Howzat!
  e('cricket bat', 'sports', 'bats', () =>
    m('cricket bat', { edge: 'sharp' })
      .box([0.108, 0.56, 0.04], [-0.2, 0.3, 0.1], { color: '#e8d5a0', round: 0.3, rot: [0, 0, -12] })
      .box([0.045, 0.48, 0.06], [-0.2, 0.3, 0.085], { color: '#e8d5a0', round: 0.6, rot: [0, 0, -12], edge: 'soft' })
      .cyl([0.036, 0.3, 0.036], [-0.13, 0.72, 0.1], { color: 'red', rot: [0, 0, -12] })
      .box([0.11, 0.05, 0.004], [-0.17, 0.46, 0.121], { color: 'blue', rot: [0, 0, -12], noInk: true })
      .stick([0.07, 0, -0.05], [0.07, 0.71, -0.05], 0.035, 'cream', { name: 'stump' })
      .stick([0.18, 0, -0.05], [0.18, 0.71, -0.05], 0.035, 'cream')
      .stick([0.29, 0, -0.05], [0.29, 0.71, -0.05], 0.035, 'cream')
      .capsule([0.016, 0.11, 0.016], [0.125, 0.72, -0.05], { color: 'cream', rot: [0, 0, 90], name: 'bail1', parent: 'stump', piece: true })
      .capsule([0.016, 0.11, 0.016], [0.235, 0.72, -0.05], { color: 'cream', rot: [0, 0, 90], name: 'bail2', parent: 'stump', piece: true })
      .ball(0.072, [0.12, 0.036, 0.15], { color: '#b0122b', edge: 'soft' })
      .torus([0.073, 0.073, 0.006], [0.12, 0.036, 0.15], { color: 'white', rot: [0, 60, 0], tube: 0.06, noInk: true })
      .act({ click: [[A.par(A.detach('bail1', 'bailA'), A.detach('bail2', 'bailB')), A.say('Howzat!', 1.5)], [A.reattach('bail1'), A.reattach('bail2')]] })
      .done(),
  ),
  // An oval slow cooker: black crock housing with side handles, a glass lid that lifts to let the steam out, a dial
  // and a power light.
  e('crock pot', 'kitchen', 'appliances', () =>
    m('crock pot', { edge: 'sharp' })
      .cyl([0.36, 0.2, 0.28], [0, 0.11, 0], { color: '#2a2a2a' })
      .cyl([0.37, 0.02, 0.29], [0, 0.01, 0], { color: '#1a1a1a' })
      .cyl([0.33, 0.02, 0.25], [0, 0.215, 0], { color: '#5a3a22' })
      .ball([0.33, 0.08, 0.25], [0, 0.225, 0], { color: GLASS, name: 'lid', piece: true, edge: 'soft' })
      .ball([0.05, 0.03, 0.05], [0, 0.27, 0], { color: '#222222', parent: 'lid' })
      .box([0.05, 0.025, 0.1], [0.2, 0.19, 0], { color: '#222222', round: 0.4 })
      .box([0.05, 0.025, 0.1], [-0.2, 0.19, 0], { color: '#222222', round: 0.4 })
      .cyl([0.045, 0.02, 0.045], [0, 0.09, 0.14], { color: 'silver', rot: [90, 0, 0], name: 'dial', piece: true })
      .ball(0.014, [0.07, 0.09, 0.135], { color: 'red', glow: true, name: 'light', mover: { kind: 'light' } })
      .act({
        click: [
          [A.pose('dial', { rot: [0, 90, 0], dur: 0.3 }), A.operate('light', 'on'), A.say('Low and slow...', 1.8)],
          [A.pose('lid', { move: [0, 0.08, 0], rot: [0, 0, 12], dur: 0.4 }), A.effect('steam', { dur: 2 }), A.wait(1.5), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })],
          [A.pose('dial', { rot: [0, 0, 0], dur: 0.3 }), A.operate('light', 'off')],
        ],
      })
      .done(),
  ),
  // A flaky butter croissant: a crescent of rolled, layered dough, golden with darker ridges; a tip flakes off.
  e('croissant', 'food', 'bread', () => {
    const b = m('croissant');
    const segs: Array<[number, number, string]> = [[-115, 0.026, '#c8822e'], [-60, 0.046, '#e0a850'], [0, 0.064, '#d4943a'], [60, 0.046, '#e0a850']];
    segs.forEach(([a, s, c], i) => {
      const r = (a * Math.PI) / 180;
      b.ball([s * 1.9, s, s * 1.2], [Math.sin(r) * 0.05, s / 2, -Math.cos(r) * 0.05 + 0.02], { color: c, rot: [0, -a, 0], ...(i === 2 ? { name: 'body' } : {}) });
    });
    const r = (115 * Math.PI) / 180;
    return b
      .ball([0.026 * 1.9, 0.026, 0.026 * 1.2], [Math.sin(r) * 0.05, 0.013, -Math.cos(r) * 0.05 + 0.02], { color: '#c8822e', rot: [0, -115, 0], name: 'tip', parent: 'body', piece: true })
      .act({ click: [[A.detach('tip', 'flake'), A.effect('dust', { dur: 0.8 }), A.say('Flake!', 1)], [A.reattach('tip')]] })
      .done();
  }),
  // A plain wooden cross, 2 m, on a little grassy mound with a stone footing; it shines.
  e('cross', 'ideas', 'symbols', () =>
    m('cross')
      .ball([1.0, 0.3, 0.8], [0, 0.05, 0], { color: 'grass' })
      .box([0.4, 0.2, 0.3], [0, 0.17, 0], { color: 'stone', round: 0.2, edge: 'sharp' })
      .box([0.16, 2.0, 0.12], [0, 1.15, 0], { color: 'wood', round: 0.1, edge: 'sharp' })
      .box([0.95, 0.15, 0.12], [0, 1.6, 0], { color: 'wood', round: 0.1, edge: 'sharp' })
      .act({ click: [A.effect('sparkle', { dur: 2.5 })] })
      .done(),
  ),
  // A yellow diamond warning sign with a black cross: a crossroads ahead. It rattles on its post.
  e('cross road sign', 'ideas', 'road signs', () =>
    sign('cross road sign', 'diamond', 'yellow', 1.0)
      .box([0.09, 0.5, 0.01], [0, 2.1, 0.035], { color: 'black', parent: 'sign' })
      .box([0.5, 0.09, 0.01], [0, 2.1, 0.035], { color: 'black', parent: 'sign' })
      .act({ click: RATTLE('Clang!') })
      .done(),
  ),
  // A crossbow on a display rest, pointing your right: wooden stock, steel prod, string drawn back to the latch,
  // a bolt loaded. It fires (thwack) and the bolt comes back.
  e('crossbow', 'armory', 'bows', () => {
    const b = m('crossbow', { edge: 'sharp' })
      .box([0.75, 0.06, 0.06], [0, 0.42, 0], { color: 'wood', round: 0.3 })
      .box([0.22, 0.12, 0.06], [-0.3, 0.39, 0], { color: 'darkwood', round: 0.4, rot: [0, 0, 8] })
      .box([0.02, 0.06, 0.02], [-0.06, 0.37, 0], { color: '#3a3633' })
      .stick([0.37, 0.42, 0], [0.42, 0.42, 0], 0.03, '#3a3633')
      .arc([0.07, 0.08, 0.012], [0.44, 0.42, 0], { color: '#555555', arc: 220, rot: [0, 0, -90] })
      .box([0.2, 0.01, 0.012], [0.1, 0.45, 0], { color: '#c0c0c0', name: 'bolt' })
      .cone([0.016, 0.03, 0.012], [0.215, 0.45, 0], { color: 'silver', rot: [0, 0, -90], parent: 'bolt' })
      .box([0.03, 0.025, 0.004], [0.0, 0.455, 0], { color: 'red', parent: 'bolt', noInk: true });
    b.pair((s) => {
      b.rod([0.3, 0.43, 0], [0.32, 0.43, s * 0.2], 0.025, '#444444');
      b.rod([0.32, 0.43, s * 0.2], [0.28, 0.43, s * 0.32], 0.02, '#444444');
      b.rod([0.28, 0.43, s * 0.32], [0.0, 0.44, 0], 0.004, 'white');
    });
    b.pair((s) => b.box([0.04, 0.4, 0.2], [s * 0.22, 0.2, 0], { color: 'darkwood', round: 0.2 }).box([0.04, 0.06, 0.2], [s * 0.22, 0.42, 0], { color: 'darkwood', round: 0.5 }));
    return b.act({ click: [A.pose('bolt', { move: [2.0, 0, 0], dur: 0.2 }), A.say('Thwack!', 1.2), A.wait(1), A.pose('bolt', { move: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A newspaper crossword on a clipboard: the grid with black squares and clues, and a pencil filling it in.
  e('crossword puzzle', 'toys', 'puzzles', () => {
    const b = m('crossword puzzle', { edge: 'sharp' })
      .box([0.27, 0.03, 0.06], [0, 0.015, 0], { color: 'darkwood', round: 0.3 })
      .box([0.25, 0.3, 0.01], [0, 0.18, 0], { color: '#f4f0e6', round: 0.05 })
      .label('CROSSWORD', [0.16, 0.025], [0, 0.31, 0.006], { color: '#f4f0e6', depth: 0.002 });
    b.each(6, (i) => b.box([0.002, 0.24, 0.002], [-0.12 + i * 0.048, 0.165, 0.006], { color: '#444444', noInk: true }).box([0.24, 0.002, 0.002], [0, 0.045 + i * 0.048, 0.006], { color: '#444444', noInk: true }));
    for (const [c, r] of [[1, 0], [3, 1], [0, 3], [2, 2], [4, 3], [1, 4]]) b.box([0.044, 0.044, 0.004], [-0.096 + c * 0.048, 0.261 - r * 0.048, 0.007], { color: 'black', round: 0.05 });
    return b
      .label('A', [0.03, 0.03], [-0.096, 0.261, 0.008], { color: '#f4f0e6', depth: 0.001, name: 'letter', scale: 0 })
      .box([0.008, 0.16, 0.008], [0.06, 0.12, 0.03], { color: 'yellow', rot: [0, 0, 40], name: 'pencil', piece: true })
      .cone([0.008, 0.02, 0.008], [0.006, 0.06, 0.03], { color: '#f0d2a0', rot: [0, 0, 140], parent: 'pencil' })
      .act({
        click: [
          [A.pose('pencil', { move: [-0.15, 0.18, 0], dur: 0.4 }), A.pose('pencil', { move: [-0.14, 0.17, 0], dur: 0.15 }), A.pose('pencil', { move: [-0.15, 0.18, 0], dur: 0.15 }), A.pose('letter', { scale: 1, dur: 0.2 }), A.say('Scribble!', 1), A.pose('pencil', { move: [0, 0, 0], dur: 0.4 })],
          [A.pose('letter', { scale: 0, dur: 0.2 }), A.say('Rub, rub.', 1)],
        ],
      })
      .done();
  }),
  // A wooden bowl of golden toasted croutons; crunch.
  e('croutons', 'food', 'bread', () => {
    const b = m('croutons').cyl([0.12, 0.045, 0.12], [0, 0.0225, 0], { color: 'wood', taper: 1.4, edge: 'sharp' });
    b.each(11, (i) => b.box(0.022, [-0.04 + (i % 4) * 0.027 + rnd(i) * 0.01, 0.05 + Math.floor(i / 4) * 0.012 - (i % 2) * 0.004, -0.035 + Math.floor(i / 4) * 0.03], { color: i % 2 ? '#d9a050' : '#c8872e', round: 0.25, rot: [rnd(i) * 40, rnd(i + 9) * 90, 0] }));
    return b.act({ click: [A.anim('bounce'), A.say('Crunch!', 1)] }).done();
  }),
  // A red crowbar under the edge of a loose floorboard: lean on it and the board pries up.
  e('crowbar', 'workshop', 'hand tools', () =>
    m('crowbar', { edge: 'sharp' })
      .box([0.7, 0.04, 0.3], [0, 0.02, 0], { color: 'darkwood', round: 0.1 })
      .box([0.4, 0.03, 0.12], [0.1, 0.055, 0.0], { color: 'wood', round: 0.15, name: 'board', pivot: [0.3, 0.04, 0] })
      .rod([-0.1, 0.055, 0], [-0.24, 0.52, 0], 0.024, 'red', { name: 'bar', pivot: [-0.1, 0.055, 0] })
      .rod([-0.24, 0.52, 0], [-0.22, 0.58, 0], 0.024, 'red', { parent: 'bar' })
      .rod([-0.22, 0.58, 0], [-0.17, 0.59, 0], 0.024, 'red', { parent: 'bar' })
      .rod([-0.17, 0.59, 0], [-0.155, 0.56, 0], 0.022, 'red', { parent: 'bar' })
      .rod([-0.1, 0.055, 0], [-0.03, 0.05, 0], 0.02, '#333333', { parent: 'bar' })
      .act({ click: [A.par(A.pose('bar', { rot: [0, 0, 18], dur: 0.5 }), A.pose('board', { rot: [0, 0, -12], dur: 0.5 })), A.say('Creeeak!', 1.5), A.wait(0.8), A.par(A.pose('bar', { rot: [0, 0, 0], dur: 0.4 }), A.pose('board', { rot: [0, 0, 0], dur: 0.4 }))] })
      .done(),
  ),
  // A jewelled gold crown with a velvet cap on a red cushion with gold tassels; it lifts and shines.
  e('crown', 'wardrobe', 'jewellery', () => {
    const b = m('crown')
      .box([0.32, 0.08, 0.32], [0, 0.04, 0], { color: '#8b1a2b', round: 0.8 })
      .cyl([0.2, 0.08, 0.2], [0, 0.12, 0], { color: 'gold', name: 'crown', piece: true, edge: 'sharp' })
      .ball([0.17, 0.13, 0.17], [0, 0.17, 0], { color: '#8b1a2b', parent: 'crown' })
      .ball(0.035, [0, 0.245, 0], { color: 'gold', parent: 'crown' });
    for (const [x, z] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) b.ball([0.03, 0.05, 0.03], [x, 0.03, z], { color: 'gold' });
    around(6, 0.095, 1.57).forEach(([x, z], i) => {
      b.cone([0.05, 0.08, 0.04], [x, 0.195, z], { color: 'gold', rot: [z * 120, 0, -x * 120], parent: 'crown', edge: 'sharp' });
      b.ball(0.022, [x * 1.08, 0.24, z * 1.08], { color: 'gold', parent: 'crown' });
      b.ball(0.024, [x * 1.08, 0.12, z * 1.08], { color: i % 2 ? 'red' : 'blue', parent: 'crown' });
    });
    return b.act({ click: [A.pose('crown', { move: [0, 0.12, 0], dur: 0.5 }), A.effect('sparkle', { dur: 1.5 }), A.wait(1.2), A.pose('crown', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A cruise liner in its real proportions at 80 m: a white hull with a navy boot stripe and a raked bow, five decks
  // of balconies stepping back, the bridge with its wings, lifeboats along both sides, a red funnel, a pool with a
  // water slide, a radar that turns. Its horn blows.
  e('cruise ship', 'garage', 'boats', () => {
    const hullP: Array<[number, number, number, number?]> = [[0, 0.86, 0.86, 0.04], [0.08, 0.98, 1, 0], [0.62, 1, 1, 0], [0.85, 0.82, 0.96, 0.02], [0.96, 0.34, 0.88, 0.05], [1, 0.06, 0.82, 0.08]];
    const b = m('cruise ship', { view: 'side', edge: 'sharp' })
      .loft([11, 15, 80], [0, 7.5, 0], hullP, { color: 'white', cut: 'bottom', name: 'hull', edge: 'soft' })
      .loft([11.12, 6.4, 80.3], [0, 3.2, 0], hullP, { color: 'navy', cut: 'bottom', edge: 'soft' })
      .box([10.4, 0.3, 74], [0, 7.4, -2.5], { color: '#c8b48a' })
      .label('OCEAN STAR', [7, 1.1], [5.52, 5.6, 22], { color: 'white', rot: [0, 90, 0], depth: 0.05 });
    const decks: Array<[number, number, number, number]> = [[10.2, 9.0, 66, -3], [9.8, 11.8, 60, -4], [9.2, 14.6, 52, -4], [8.4, 17.4, 40, -3], [7, 20.0, 24, -2]];
    decks.forEach(([w, y, L, z], i) => {
      b.box([w, 2.8, L], [0, y, z], { color: 'white', round: 0.08 });
      b.cyl([w, 2.8, w * 0.7], [0, y, z + L / 2], { color: 'white', segs: 12 });
      b.pair((s) => b.box([0.05, 1.1, L * 0.92], [s * (w / 2 + 0.02), y + 0.1, z], { color: i < 3 ? '#2a4a7a' : DARKWIN, noInk: true }));
    });
    b.box([10.6, 1.4, 1.2], [0, 18.3, 17.6], { color: 'white' })
      .box([10.4, 0.9, 0.08], [0, 18.4, 18.22], { color: DARKWIN })
      .box([2.2, 1.5, 8], [0, 21.9, -8], { color: '#3fa7d0' })
      .box([2.4, 0.2, 8.2], [0, 22.75, -8], { color: 'white' });
    b.arc([5, 5, 0.6], [2.2, 23.5, -14], { color: '#f2b81b', arc: 180, rot: [0, 90, 0] }).arc([3, 3, 0.6], [2.2, 23.0, -15.5], { color: '#e8413a', arc: 180, rot: [0, 90, 0] });
    b.cyl([4.4, 5.5, 6], [0, 24.2, -22], { color: '#c0392b', taper: 0.85, rot: [-8, 0, 0] })
      .cyl([3.8, 1.0, 5.2], [0, 27.2, -22.4], { color: '#1e1e1e', rot: [-8, 0, 0] })
      .stick([0, 21.4, 4], [0, 27, 4], 0.25, 'white')
      .box([2.4, 0.2, 0.5], [0, 26.6, 4], { color: '#3a3633', name: 'rotor' });
    b.pair((s) => {
      b.each(6, (i) => b.capsule([2.2, 6, 2.2], [s * 5.4, 9.6, -24 + i * 8], { color: 'orange', rot: [90, 0, 0] }));
      b.box([1.2, 0.4, 3.5], [s * 5.6, 18.3, 17.2], { color: 'white' });
    });
    return b
      .act({
        click: [
          [A.effect('smoke', { dur: 3 }), A.say('HOOOONK!', 2.5)],
          [A.par(A.anim('wobble'), A.effect('water_spray', { dur: 2 })), A.say('Splash...', 1.5)],
        ],
      })
      .done();
  }),
  // An aluminium underarm crutch (1.3 m): padded top, two side rails, a hand grip, an adjustable leg with a rubber
  // foot. It clacks along.
  e('crutch', 'clinic', 'mobility aids', () =>
    m('crutch', { edge: 'sharp' })
      .capsule([0.1, 0.24, 0.1], [0, 1.31, 0], { color: '#3a3633', rot: [0, 0, 90], edge: 'soft' })
      .rod([0.07, 1.28, 0], [0.03, 0.62, 0], 0.025, 'silver')
      .rod([-0.07, 1.28, 0], [-0.03, 0.62, 0], 0.025, 'silver')
      .rod([-0.055, 0.88, 0], [0.055, 0.88, 0], 0.036, '#3a3633')
      .box([0.08, 0.05, 0.03], [0, 0.6, 0], { color: 'silver', round: 0.3 })
      .stick([0, 0.06, 0], [0, 0.6, 0], 0.03, 'silver')
      .ball(0.006, [0, 0.42, 0.016], { color: '#3a3633', noInk: true })
      .ball(0.006, [0, 0.38, 0.016], { color: '#3a3633', noInk: true })
      .cyl([0.055, 0.07, 0.055], [0, 0.035, 0], { color: 'rubber', edge: 'soft' })
      .act({ click: [A.anim('hop', 2), A.say('Clack, clack!', 1.5)] })
      .done(),
  ),
  // A cluster of violet quartz points on a grey rock; the tallest glows.
  e('crystal', 'nature', 'minerals', () => {
    const b = m('crystal', { edge: 'sharp' }).ball([0.16, 0.05, 0.12], [0, 0.02, 0], { color: 'rock', edge: 'soft' });
    for (const [x, z, h, t] of [[0.035, 0.01, 0.08, 28], [-0.035, 0.012, 0.09, -25], [0.01, -0.03, 0.07, 10], [-0.01, 0.035, 0.06, -8]]) {
      const r = (t * Math.PI) / 180, d: V = [Math.sin(r), Math.cos(r), 0];
      b.cyl([0.035, h, 0.035], [x + d[0] * h * 0.5, 0.03 + d[1] * h * 0.5, z], { color: '#c8a8f0', segs: 6, rot: [0, 0, -t] });
      b.cone([0.035, 0.03, 0.035], [x + d[0] * (h + 0.015), 0.03 + d[1] * (h + 0.015), z], { color: '#dcc8ff', segs: 6, rot: [0, 0, -t] });
    }
    return b
      .cyl([0.04, 0.12, 0.04], [0, 0.09, 0], { color: '#c8a8f0', segs: 6, glow: true, name: 'point', mover: { kind: 'light' } })
      .cone([0.04, 0.035, 0.04], [0, 0.167, 0], { color: '#e6d8ff', segs: 6, parent: 'point' })
      .act({ click: [[A.operate('point', 'on'), A.effect('sparkle', { dur: 1.5 })], [A.operate('point', 'off')]] })
      .done();
  }),
  // A fortune teller's crystal ball on a gilded claw stand; mist swirls inside and glows.
  e('crystal ball', 'fantasy', 'magic items', () => {
    const b = m('crystal ball')
      .cyl([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'gold', edge: 'sharp' })
      .cyl([0.08, 0.04, 0.08], [0, 0.05, 0], { color: 'gold', taper: 1.3, edge: 'sharp' })
      .ball(0.15, [0, 0.14, 0], { color: '#c8b8f0' })
      .ball(0.08, [0.012, 0.15, 0.03], { color: '#f0e0ff', glow: true, name: 'mist', mover: { kind: 'light' } });
    around(3, 0.05).forEach(([x, z]) => b.cone([0.025, 0.05, 0.02], [x, 0.08, z], { color: 'gold', rot: [z * 400, 0, -x * 400], edge: 'sharp' }));
    return b.act({ click: [[A.operate('mist', 'on'), A.effect('sparkle', { dur: 2 }), A.say('Ooooo...', 2)], [A.operate('mist', 'off')]] }).done();
  }),
  // A crisp blue cube, 10 cm on every edge; it tumbles and lands.
  e('cube', 'ideas', 'shapes', () =>
    m('cube', { edge: 'sharp' })
      .box(0.1, [0, 0.05, 0], { color: '#4a90d9', round: 0.12 })
      .act({ click: [A.anim('spin'), A.anim('hop'), A.say('Plonk!', 1)] })
      .done(),
  ),
  // A Black Forest cuckoo clock on a carved board at eye height: a chalet roof with leaves, a face with hands, a
  // little door the cuckoo pops out of, a swinging pendulum and pine-cone weights on chains.
  e('cuckoo clock', 'home', 'clocks', () => {
    const b = m('cuckoo clock', { edge: 'sharp' })
      .box([0.5, 0.04, 0.3], [0, 0.02, 0], { color: 'darkwood', round: 0.2 })
      .box([0.08, 1.5, 0.06], [0, 0.75, -0.12], { color: 'darkwood' })
      .box([0.34, 0.34, 0.16], [0, 1.6, 0], { color: 'wood' })
      .wedge([0.48, 0.18, 0.22], [0, 1.86, 0], { color: 'darkwood' })
      .cyl([0.16, 0.012, 0.16], [0, 1.55, 0.085], { color: 'cream', rot: [90, 0, 0] })
      .box([0.008, 0.055, 0.004], [0, 1.575, 0.094], { color: 'black', name: 'minute', pivot: [0, 1.55, 0.094] })
      .box([0.04, 0.008, 0.004], [0.018, 1.55, 0.096], { color: 'black' })
      .box([0.08, 0.08, 0.01], [0, 1.72, 0.081], { color: '#2a1a0a' })
      .ball(0.04, [0, 1.72, 0.07], { color: 'yellow', name: 'bird', mover: { kind: 'slide', axis: 'z', amount: 0.07 } })
      .cone([0.016, 0.03, 0.016], [0, 1.715, 0.1], { color: 'orange', rot: [90, 0, 0], parent: 'bird' })
      .box([0.04, 0.08, 0.01], [-0.02, 1.72, 0.087], { color: 'wood', name: 'doorL', pivot: [-0.04, 1.72, 0.087], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.04, 0.08, 0.01], [0.02, 1.72, 0.087], { color: 'wood', name: 'doorR', pivot: [0.04, 1.72, 0.087], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .ball([0.12, 0.05, 0.03], [0, 1.93, 0.03], { color: 'darkwood' })
      .stick([0, 1.43, 0.03], [0, 1.25, 0.03], 0.008, 'gold', { name: 'pendulum', pivot: [0, 1.43, 0.03] })
      .cyl([0.06, 0.008, 0.06], [0, 1.25, 0.03], { color: 'gold', rot: [90, 0, 0], parent: 'pendulum' });
    b.pair((s) => {
      b.stick([s * 0.09, 1.43, 0], [s * 0.09, s > 0 ? 1.0 : 1.12, 0], 0.005, 'gold');
      b.capsule([0.04, 0.11, 0.04], [s * 0.09, s > 0 ? 0.95 : 1.07, 0], { color: 'darkbrown', edge: 'soft' });
      b.ball([0.12, 0.04, 0.025], [s * 0.12, 1.8, 0.1], { color: '#3f6f35', rot: [0, 0, s * 30], edge: 'soft' });
    });
    const swing = (r: number) => A.pose('pendulum', { rot: [0, 0, r], dur: 0.5 });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.operate('bird', 'out'), A.say('Cuckoo! Cuckoo!', 2), A.wait(1.2), A.operate('bird', 'in'), A.operate('door', 'close')],
          [swing(18), swing(-18), swing(18), swing(-18), swing(0), A.say('Tick tock...', 1.5)],
        ],
      })
      .done();
  }),
  // A dark green cucumber with bumpy skin and two pale slices; a slice comes away.
  e('cucumber', 'food', 'vegetables', () => {
    const b = m('cucumber')
      .capsule([0.05, 0.22, 0.05], [-0.03, 0.025, -0.02], { color: '#2f6b2a', rot: [0, 0, 90], name: 'cuke' })
      .cyl([0.046, 0.008, 0.046], [0.07, 0.023, 0.06], { color: '#2f6b2a', rot: [90, 0, 0] })
      .cyl([0.04, 0.01, 0.04], [0.07, 0.023, 0.065], { color: '#d8efb0', rot: [90, 0, 0] })
      .cyl([0.046, 0.008, 0.046], [0.1, 0.023, 0.04], { color: '#2f6b2a', rot: [90, 0, 0], name: 'slice', parent: 'cuke', piece: true })
      .cyl([0.04, 0.01, 0.04], [0.1, 0.023, 0.045], { color: '#d8efb0', rot: [90, 0, 0], parent: 'slice' });
    b.each(6, (i) => b.ball(0.008, [-0.12 + i * 0.033, 0.048, -0.02 + (i % 2) * 0.01], { color: '#5a9a4a', noInk: true }));
    return b.act({ click: [[A.detach('slice', 'slice'), A.say('Crunch!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A blue coffee mug with a handle; it tips for a drink.
  e('cup', 'kitchen', 'tableware', () =>
    mug('cup', '#4a90d9', 'coffee')
      .act({ click: [A.set({ tilt: -30, dur: 0.4 }), A.say('Glug!', 1), A.wait(0.8), A.set({ tilt: 0, dur: 0.4 }), A.say('Ahh.', 1)] })
      .done(),
  ),
  // A car console cup holder that slides out of the dashboard, a takeaway cup in one ring; click: out, in.
  e('cup holder', 'garage', 'car parts', () =>
    m('cup holder', { edge: 'sharp' })
      .box([0.26, 0.1, 0.12], [0, 0.05, -0.08], { color: '#2a2a2a', round: 0.2 })
      .box([0.22, 0.03, 0.18], [0, 0.07, 0.03], { color: '#333333', round: 0.3, name: 'tray', mover: { kind: 'slide', axis: 'z', amount: -0.1 } })
      .torus([0.085, 0.085, 0.012], [-0.055, 0.085, 0.04], { color: '#1a1a1a', rot: [90, 0, 0], parent: 'tray' })
      .torus([0.085, 0.085, 0.012], [0.055, 0.085, 0.04], { color: '#1a1a1a', rot: [90, 0, 0], parent: 'tray' })
      .cyl([0.072, 0.13, 0.072], [0.055, 0.14, 0.04], { color: 'white', taper: 1.2, parent: 'tray', edge: 'soft' })
      .cyl([0.088, 0.035, 0.088], [0.055, 0.13, 0.04], { color: '#8a5a2b', parent: 'tray', edge: 'soft' })
      .cyl([0.09, 0.015, 0.09], [0.055, 0.21, 0.04], { color: '#333333', parent: 'tray' })
      .act({ click: [[A.operate('tray'), A.say('Click.', 1)], [A.operate('tray'), A.say('Click!', 1)]] })
      .done(),
  ),
  // A cupcake in a pink paper case, swirled frosting, sprinkles and a cherry that gets eaten.
  e('cupcake', 'food', 'desserts', () => {
    const b = m('cupcake')
      .cyl([0.06, 0.045, 0.06], [0, 0.0225, 0], { color: '#f48fb1', taper: 1.3, name: 'case' })
      .ball([0.085, 0.04, 0.085], [0, 0.05, 0], { color: '#c98a4b' })
      .torus([0.08, 0.08, 0.03], [0, 0.066, 0], { color: '#fbd3e3', rot: [90, 0, 0], tube: 0.4 })
      .torus([0.058, 0.058, 0.026], [0, 0.085, 0], { color: '#fbd3e3', rot: [90, 0, 0], tube: 0.4 })
      .cone([0.04, 0.035, 0.04], [0, 0.11, 0], { color: '#fbd3e3' })
      .ball(0.022, [0, 0.135, 0], { color: 'red', name: 'cherry', parent: 'case', piece: true })
      .rod([0, 0.145, 0], [0.008, 0.165, 0], 0.003, 'darkgreen', { parent: 'cherry' });
    around(10, 1).forEach(([x, z]) => b.rod([x * 0.031, 0.003, z * 0.031], [x * 0.039, 0.043, z * 0.039], 0.004, '#e0709a', { noInk: true }));
    b.each(6, (i) => b.box([0.012, 0.004, 0.004], [Math.cos(i * 1.1) * 0.03, 0.082, Math.sin(i * 1.1) * 0.03], { color: COLS[i], rot: [0, i * 50, 0], noInk: true }));
    return b.act({ click: [[A.detach('cherry', 'cherry'), A.say('Nom!', 1)], [A.reattach('cherry'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A dark green lab bottle of poison: glass stopper, a skull-and-crossbones label. It hisses a warning.
  e('cyanide', 'study', 'lab chemicals', () =>
    bottle('cyanide', '#2f5a3a', 'black', 0.14, 0.075)
      .box([0.05, 0.05, 0.004], [0, 0.045, 0.038], { color: '#f2e8c8', round: 0.2, edge: 'sharp' })
      .ball([0.024, 0.022, 0.008], [0, 0.052, 0.041], { color: 'white' })
      .ball(0.006, [-0.005, 0.054, 0.045], { color: 'black', noInk: true })
      .ball(0.006, [0.005, 0.054, 0.045], { color: 'black', noInk: true })
      .rod([-0.014, 0.028, 0.041], [0.014, 0.04, 0.041], 0.005, 'white')
      .rod([0.014, 0.028, 0.041], [-0.014, 0.04, 0.041], 0.005, 'white')
      .act({ click: [A.anim('shake'), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Hisss!', 1.2))] })
      .done(),
  ),
  // An orange cylinder with crisp rims; it rolls over onto its side and back.
  e('cylinder', 'ideas', 'shapes', () =>
    m('cylinder', { edge: 'sharp' })
      .cyl([0.1, 0.15, 0.1], [0, 0.075, 0], { color: '#e8a33a', segs: 24 })
      .act({ click: [[A.set({ tilt: 90, dur: 0.5 }), A.say('Roll...', 1)], [A.set({ tilt: 0, dur: 0.5 }), A.anim('hop')]] })
      .done(),
  ),
  // A hi-hat: two brass cymbals on a chrome tripod stand with a foot pedal; press it and the top cymbal claps down.
  e('cymbals', 'music', 'drums', () => {
    const b = m('cymbals', { edge: 'sharp' })
      .stick([0, 0.08, 0], [0, 0.92, 0], 0.025, 'silver')
      .cyl([0.36, 0.035, 0.36], [0, 0.8, 0], { color: 'gold', taper: 0.25, rot: [180, 0, 0] })
      .cyl([0.36, 0.035, 0.36], [0, 0.86, 0], { color: 'gold', taper: 0.25, name: 'top', mover: { kind: 'slide', axis: 'y', amount: -0.05 } })
      .cyl([0.04, 0.02, 0.04], [0, 0.885, 0], { color: '#3a3633', parent: 'top' })
      .box([0.1, 0.03, 0.26], [0, 0.04, 0.24], { color: '#333333', round: 0.3, name: 'pedal', pivot: [0, 0.03, 0.12], mover: { kind: 'swing', axis: 'x', amount: 10 } });
    around(3, 0.28, 1.57).forEach(([x, z]) => b.rod([x, 0.01, z], [0, 0.32, 0], 0.018, 'silver'));
    return b.act({ click: [A.par(A.operate('pedal', 'on'), A.operate('top', 'down')), A.say('Tss!', 0.6), A.par(A.operate('pedal', 'off'), A.operate('top', 'up')), A.par(A.operate('pedal', 'on'), A.operate('top', 'down')), A.say('Tss!', 0.6), A.par(A.operate('pedal', 'off'), A.operate('top', 'up'))] }).done();
  }),
  // An Italian cypress, 12 m: a tall dark flame of foliage on a short trunk; it rustles in the wind.
  e('cypress tree', 'garden', 'trees', () => {
    const b = m('cypress tree')
      .stick([0, 0, 0], [0, 1.2, 0], 0.4, 'bark')
      .ball([2.2, 5.5, 2.2], [0, 3.6, 0], { color: '#2f5a2a', name: 'top' })
      .ball([1.9, 4.5, 1.9], [0, 7.0, 0], { color: '#355f2c', parent: 'top' })
      .ball([1.3, 3.2, 1.3], [0, 9.6, 0], { color: '#2f5a2a', parent: 'top' })
      .cone([0.6, 1.6, 0.6], [0, 11.6, 0], { color: '#355f2c', parent: 'top' });
    for (const [x, y, z] of [[0.7, 2.5, 0.6], [-0.6, 3.8, 0.7], [0.5, 5.5, 0.6], [-0.5, 7.0, 0.55], [0.35, 8.6, 0.45], [-0.6, 2.0, -0.5], [0.6, 6.4, -0.5]] as V[]) b.ball([0.8, 1.4, 0.5], [x, y, z], { color: '#3f6f35', parent: 'top', noInk: true });
    return b.act({ click: [A.anim('wobble'), A.say('Rustle...', 1.5)] }).done();
  }),
  // A dagger driven into a stump: steel blade, brass guard, leather grip, a ruby in the pommel. Pull it out.
  e('dagger', 'armory', 'blades', () =>
    m('dagger', { edge: 'sharp' })
      .cyl([0.3, 0.2, 0.3], [0, 0.1, 0], { color: 'wood', name: 'stump', edge: 'soft' })
      .cyl([0.28, 0.01, 0.28], [0, 0.2, 0], { color: '#c8a06a' })
      .cyl([0.034, 0.12, 0.012], [0, 0.24, 0], { color: 'silver', taper: 0.6, name: 'dagger', parent: 'stump', piece: true })
      .box([0.004, 0.1, 0.014], [0, 0.24, 0], { color: '#e8e8f0', parent: 'dagger', noInk: true })
      .box([0.1, 0.018, 0.026], [0, 0.305, 0], { color: 'gold', round: 0.5, parent: 'dagger' })
      .cyl([0.026, 0.08, 0.026], [0, 0.355, 0], { color: 'darkbrown', parent: 'dagger', edge: 'soft' })
      .ball(0.034, [0, 0.405, 0], { color: 'gold', parent: 'dagger' })
      .ball(0.014, [0, 0.405, 0.016], { color: 'red', parent: 'dagger' })
      .act({ click: [[A.detach('dagger', 'dagger'), A.say('Shing!', 1)], [A.reattach('dagger'), A.say('Thunk!', 1)]] })
      .done(),
  ),
  // A concrete gravity dam (12 m high, 30 m crest) wedged into a rocky gorge: the reservoir behind it, a sloping
  // downstream face, a crest road with parapets and lamp posts, a central spillway with two steel lift gates in a
  // gantry (a hoist wheel winches them up and the water gushes down the chute between training walls), a
  // powerhouse at the toe and the river running on. (The vocabulary's 1 m is a levee; a dam this size is the
  // landmark, so the size warning stays.)
  e('dam', 'places', 'landmarks', () => {
    const C = '#c9c6bd', C2 = '#b5b2aa', R = '#8a7d6c', H = 12, sl = 47.7;
    const b = m('dam', { edge: 'sharp' })
      .box([44, 0.1, 44], [0, 0.05, 1.5], { color: '#7a8a5a', edge: 'soft' })
      .box([34, 8.6, 18], [0, 4.3, -11.5], { color: 'water', round: 0.02, edge: 'soft' })
      .box([10, 0.12, 14], [0, 0.16, 16.5], { color: 'water', round: 0.1, edge: 'soft' });
    // the dam: crest blocks either side of the spillway, the spillway sill and its centre pier, the sloping face
    b.pair((s) => void b.box([11, H, 4], [s * 9.5, H / 2, -0.5], { color: C, round: 0.02 }));
    b.box([8, 9, 4], [0, 4.5, -0.5], { color: C2, round: 0.02 })
      .box([0.8, H, 4], [0, H / 2, -0.5], { color: C, round: 0.02 })
      .wedge([8, 8.8, 30], [0, 4.4, 5.5], { color: C, rot: [0, 90, 0], apex: 0.5 });
    for (const y of [3, 6]) b.box([30, 0.06, 0.06], [0, y, 9.5 - (y / 8.8) * 8 + 0.03], { color: C2, noInk: true });
    // the chute between training walls, and the gush that runs down it when the gates lift
    b.pair((s) => void b.box([0.4, 1.2, 11.9], [s * 4.2, 4.8, 5.94], { color: C2, rot: [sl, 0, 0], round: 0.05 }));
    b.box([7.4, 0.3, 11.9], [0, 4.5, 5.61], { color: 'white', rot: [sl, 0, 0], name: 'gush', scale: 0, edge: 'soft' });
    // the crest road: asphalt, parapets, a bridge over the spillway, lamp posts
    b.box([30, 0.06, 2.7], [0, H + 0.03, -0.45], { color: '#4a4a4a', round: 0, noInk: true })
      .box([8, 0.4, 3.1], [0, H - 0.2, -0.05], { color: C, round: 0.05 });
    for (const z of [-2.35, 1.35]) b.box([30, 0.9, 0.3], [0, H + 0.45, z], { color: C2, round: 0.1 });
    [-12, -6, 6, 12].forEach((x, i) => {
      b.stick([x, H + 0.9, 1.35], [x, H + 3.4, 1.35], 0.1, '#5c6166').box([0.36, 0.32, 0.36], [x, H + 3.55, 1.35], { color: '#fff3c0', glow: true, round: 0.2, name: `lamp${i}`, mover: { kind: 'light', on: false } });
    });
    // two lift gates in their slots upstream of the bridge, a steel gantry over them and the hoist wheel
    b.pair((s) => {
      b.box([3.5, 2.4, 0.3], [s * 2.2, 10.2, -2.0], { color: '#4a5560', round: 0.05, name: s > 0 ? 'gateL' : 'gateR', mover: { kind: 'slide', axis: 'y', amount: 2.4 } });
      b.box([3.5, 0.08, 0.34], [s * 2.2, 10.6, -2.0], { color: '#3a424a', parent: s > 0 ? 'gateL' : 'gateR', noInk: true });
      b.box([0.3, 3.6, 0.3], [s * 4.2, H + 1.8, -2.0], { color: '#c0392b', round: 0.1 });
      b.box([1.2, 0.7, 0.9], [s * 2.2, H + 3.85, -2.0], { color: '#5c6166', round: 0.1 });
    });
    b.box([0.3, 3.6, 0.3], [0, H + 1.8, -2.0], { color: '#c0392b', round: 0.1 })
      .box([8.8, 0.4, 0.4], [0, H + 3.4, -2.0], { color: '#c0392b', round: 0.1 })
      .cyl([0.9, 0.16, 0.9], [0, H + 2.4, -1.75], { color: '#f6d24a', rot: [90, 0, 0], name: 'wheel', mover: { kind: 'spin', axis: 'z', amount: 300 } })
      .box([0.1, 0.8, 0.06], [0, H + 2.4, -1.65], { color: '#3a3633', parent: 'wheel' });
    // the gorge: terraced rock either side, boulders by the river
    // (high beside the reservoir, stepping down toward the front so the dam face stays in view)
    b.pair((s) => {
      b.box([8, 14, 22], [s * 19, 7, -9], { color: R, round: 0.2, edge: 'soft' })
        .box([6, 2.5, 14], [s * 19.5, 14.6, -12], { color: '#7a6e60', round: 0.4, edge: 'soft' })
        .box([8, 7, 9], [s * 19, 3.5, 6.5], { color: R, round: 0.3, edge: 'soft' })
        .ball([7, 4, 9], [s * 19.5, 7.2, 14], { color: '#7a6e60', edge: 'soft' })
        .ball([3, 2, 3], [s * 14.8, 0.9, 12 + s], { color: '#7a6e60', edge: 'soft' });
    });
    b.ball([1.6, 1.0, 1.4], [6.2, 0.45, 14], { color: 'rock', edge: 'soft' }).ball([1.1, 0.7, 1.0], [5.6, 0.3, 19], { color: 'rock', edge: 'soft' });
    // the powerhouse at the toe, left of the river
    b.box([9, 5.5, 6], [-10, 2.75, 12.5], { color: '#d8d4ca', round: 0.02 })
      .box([9.3, 0.35, 6.3], [-10, 5.65, 12.5], { color: '#6b6f75', round: 0.1 })
      .box([2.6, 3.2, 0.06], [-10, 1.6, 15.53], { color: '#8f99a3', round: 0.02 })
      .label('POWER HOUSE', [4.2, 0.5], [-10, 4.6, 15.53], { color: '#2f4f8f', depth: 0.04 });
    b.each(5, (i) => b.box([2.6, 0.03, 0.03], [-10, 0.4 + i * 0.6, 15.57], { color: '#6b7078', noInk: true }));
    for (const x of [-13.2, -6.8]) win(b, x, 2.8, 15.5, 1.4, 2.6, '#8f99a3', { bars: true, glass: DARKWIN });
    return b
      .act({
        click: [
          [A.par(A.operate('wheel', 'on'), A.operate('gate', 'up')), A.operate('wheel', 'off'), A.par(A.pose('gush', { scale: 1, dur: 0.3 }), A.effect('water_spray', { dur: 2.5 }), A.say('Whoooosh!', 2)), A.wait(2), A.par(A.pose('gush', { scale: 0, dur: 0.3 }), A.operate('gate', 'down'))],
          [A.operate('lamp', 'on'), A.say('Hummmm...', 1.5), A.wait(2), A.operate('lamp', 'off')],
        ],
      })
      .done();
  }),
  // A light-up dance floor, 4 m square: a grid of glowing coloured tiles in a chrome edge; they flash in turn.
  e('dance floor', 'places', 'rooms', () => {
    const b = m('dance floor', { edge: 'sharp' }).box([4.2, 0.1, 4.2], [0, 0.05, 0], { color: '#222222', round: 0.1 }).box([4.3, 0.06, 4.3], [0, 0.03, 0], { color: 'silver', round: 0.2 });
    const cs = ['magenta', 'cyan', 'yellow', 'lime'];
    b.each(36, (i) => {
      const r = Math.floor(i / 6), c = i % 6, odd = (r + c) % 2 === 1;
      b.box([0.62, 0.03, 0.62], [-1.65 + c * 0.66, 0.115, -1.65 + r * 0.66], { color: cs[(r + c * 2) % 4], glow: true, round: 0.1, name: `${odd ? 'tileB' : 'tileA'}${i}`, mover: { kind: 'light', on: true } });
    });
    return b
      .act({ click: [A.operate('tileA', 'off'), A.wait(0.35), A.par(A.operate('tileA', 'on'), A.operate('tileB', 'off')), A.wait(0.35), A.par(A.operate('tileB', 'on'), A.operate('tileA', 'off')), A.wait(0.35), A.par(A.operate('tileA', 'on'), A.operate('tileB', 'off')), A.wait(0.35), A.operate('tileB', 'on'), A.say('Boogie!', 1.2)] })
      .done();
  }),
  // A dandelion clump: a yellow flower and a white seed clock on hollow stems over a rosette of toothed leaves.
  // Blow on the clock: the seeds fly and it is bare; next time it is full again.
  e('dandelion', 'garden', 'flowers', () => {
    const b = m('dandelion');
    around(6, 0.06, 0.2).forEach(([x, z]) => blade(b, [x * 0.3, 0.006, z * 0.3], [x * 2.2, 0.01, z * 2.2], 0.035, 0.006, 'leaf'));
    return b
      .stick([0, 0, 0], [-0.04, 0.2, 0], 0.008, '#7aa04a', { name: 'stem' })
      .ball([0.05, 0.022, 0.05], [-0.04, 0.21, 0.005], { color: 'yellow', rot: [40, 0, 0], name: 'head', parent: 'stem' })
      .ball([0.02, 0.014, 0.02], [-0.04, 0.218, 0.014], { color: 'gold', rot: [40, 0, 0], parent: 'head' })
      .stick([0.01, 0, 0], [0.04, 0.26, 0], 0.008, '#7aa04a')
      .ball(0.07, [0.04, 0.29, 0], { color: '#f4f4f4', name: 'puff', piece: true })
      .ball(0.016, [0.04, 0.29, 0], { color: '#c8b88a' })
      .act({ click: [[A.par(A.effect('snow', { dur: 1.8 }), A.pose('puff', { scale: 0.25, dur: 0.6 })), A.say('Whoosh!', 1)], [A.pose('puff', { scale: 1, dur: 0.8 }), A.effect('sparkle', { dur: 0.8 })]] })
      .done();
  }),
  // A head-and-shoulders bust in a navy sweater with white flakes on the shoulders; it shakes them off.
  e('dandruff', 'clinic', 'body', () => {
    const b = m('dandruff')
      .box([0.36, 0.12, 0.16], [0, 0.06, 0], { color: 'navy', round: 0.8 })
      .cyl([0.08, 0.06, 0.08], [0, 0.15, 0], { color: 'skin2' })
      .ball([0.14, 0.17, 0.15], [0, 0.25, 0.005], { color: 'skin2' })
      .ball([0.152, 0.1, 0.16], [0, 0.305, -0.01], { color: 'darkbrown' });
    b.pair((s) => b.ball(0.012, [s * 0.035, 0.26, 0.072], { color: '#2a2320', noInk: true }));
    b.each(14, (i) => b.box([0.012, 0.004, 0.01], [-0.15 + rnd(i) * 0.3, i < 10 ? 0.121 : 0.35, -0.05 + rnd(i + 20) * 0.1], { color: 'white', rot: [0, rnd(i + 5) * 90, 0], noInk: true }));
    return b.act({ click: [A.anim('shake'), A.effect('snow', { dur: 1.2 })] }).done();
  }),
  // A red-bordered warning triangle with a big exclamation mark, on a post. It rattles.
  e('danger sign', 'ideas', 'road signs', () =>
    sign('danger sign', 'tri', 'white', 1.0, '#c0392b')
      .box([0.06, 0.22, 0.01], [0, 2.12, 0.035], { color: 'black', round: 0.3, parent: 'sign' })
      .ball(0.07, [0, 1.94, 0.035], { color: 'black', parent: 'sign' })
      .act({ click: RATTLE('Clang!') })
      .done(),
  ),
  // A real dart (15 cm) stuck point-first in a foam block: knurled barrel, shaft and red flights. It spins.
  e('dart', 'sports', 'darts', () =>
    m('dart', { edge: 'sharp' })
      .box([0.08, 0.03, 0.08], [0, 0.015, 0], { color: '#3a3633', round: 0.4, edge: 'soft' })
      .cone([0.004, 0.03, 0.004], [0, 0.035, 0], { color: 'silver', rot: [180, 0, 0], name: 'dart' })
      .cyl([0.008, 0.045, 0.008], [0, 0.072, 0], { color: '#888888', parent: 'dart' })
      .stick([0, 0.095, 0], [0, 0.13, 0], 0.005, 'black', { parent: 'dart' })
      .box([0.038, 0.04, 0.002], [0, 0.135, 0], { color: 'red', round: 0.4, parent: 'dart' })
      .box([0.002, 0.04, 0.038], [0, 0.135, 0], { color: 'red', round: 0.4, parent: 'dart' })
      .act({ click: [A.pose('dart', { spin: [0, 720, 0] }), A.say('Thunk!', 1), A.wait(1), A.pose('dart', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A 45 cm bristle dartboard on a low stand: black and cream segments, red and green rings, a bullseye; a dart
  // flies in.
  e('dartboard', 'sports', 'darts', () => {
    const b = m('dartboard').box([0.32, 0.04, 0.18], [0, 0.02, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' }).box([0.06, 0.08, 0.04], [0, 0.07, -0.02], { color: 'darkwood', edge: 'sharp' });
    const rings: Array<[number, string]> = [[0.45, '#1e1e1e'], [0.36, 'red'], [0.33, 'cream'], [0.22, 'green'], [0.19, 'cream'], [0.07, 'green'], [0.03, 'red']];
    rings.forEach(([d, c], i) => b.cyl([d, 0.04, d], [0, 0.31, i * 0.003], { color: c, rot: [90, 0, 0] }));
    b.each(10, (i) => b.box([0.006, 0.33, 0.002], [0, 0.31, 0.024], { color: '#1e1e1e', rot: [0, 0, i * 18], noInk: true }));
    for (const [x, y] of [[0.05, 0.34], [-0.06, 0.29]]) b.stick([x, y, 0.04], [x + 0.01, y + 0.01, 0.1], 0.008, '#888888').box([0.03, 0.03, 0.002], [x + 0.012, y + 0.012, 0.115], { color: 'yellow', round: 0.4 });
    return b
      .stick([0.0, 0.31, 0.03], [0.0, 0.31, 0.11], 0.008, '#888888', { name: 'dart', scale: 1 })
      .box([0.03, 0.03, 0.002], [0, 0.31, 0.12], { color: 'blue', round: 0.4, parent: 'dart' })
      .act({ click: [A.pose('dart', { move: [0.8, 0.4, 2.5], dur: 0 }), A.pose('dart', { move: [0, 0, 0], dur: 0.35 }), A.say('Thunk! Bullseye!', 1.5)] })
      .done();
  }),
  // A date palm, 9 m: a straight trunk patterned with old leaf bases, a crown of stiff fronds, heavy clusters of
  // orange dates. Shake it: a bunch drops.
  e('date palm', 'garden', 'palm trees', () => {
    const h = 9, lean = 0.3;
    const b = palmTree('date palm', h, lean, '#6a8a3a');
    b.each(8, (i) => b.box([0.36, 0.22, 0.36], [lean * (i / 8) ** 2, 1 + i * 0.95, 0], { color: '#7a5a3a', rot: [0, 45, 0], round: 0.3 }));
    around(3, 0.35, 0.8).forEach(([x, z], i) => b.ball([0.3, 0.55, 0.3], [lean + x, h - 0.75, z], { color: i % 2 ? '#c8641e' : '#b8541a', parent: 'top' }));
    return b
      .ball([0.32, 0.6, 0.32], [lean + 0.1, h - 0.85, 0.32], { color: '#d8742a', name: 'dates', parent: 'top', piece: true })
      .act({ click: [[A.anim('shake'), A.detach('dates', 'dates'), A.say('Thump!', 1.2)], [A.reattach('dates'), A.anim('wobble')]] })
      .done();
  }),
  // A daycare: a bright one-storey building under a red gable roof, windows with paper hearts and stars, a play
  // yard with a little fence, a slide, a sandbox and a swing that swings.
  e('daycare', 'places', 'schools', () => {
    const w = 10, d = 6, h = 3.2, fz = d / 2;
    const b = m('daycare', { edge: 'sharp' })
      .box([w, h, d], [0, h / 2, 0], { color: '#ffd966', round: 0.03 })
      .box([w + 0.1, 0.3, d + 0.1], [0, 0.15, 0], { color: '#8d8a86' })
      .wedge([d + 0.6, 2.2, w + 0.6], [0, h + 1.1, 0], { color: '#e8413a', rot: [0, 90, 0] })
      .box([w + 0.6, 0.2, 0.2], [0, h, fz + 0.2], { color: 'white' })
      .label('DAYCARE', [3.4, 0.6], [1.0, 2.75, fz + 0.06], { color: '#4a90d9', depth: 0.06 });
    frontDoor(b, -3.2, fz, '#4a90d9', { glass: true });
    for (const x of [-1.4, 1.0, 3.4]) win(b, x, 1.45, fz, 1.5, 1.2, 'white');
    for (const [x, c] of [[-1.4, 'red'], [1.0, 'orange'], [3.4, 'purple']] as Array<[number, string]>) b.heart(0.4, [x, 1.5, fz + 0.12], { color: c }).star(0.4, [x + 0.45, 1.75, fz + 0.12], { color: 'yellow' });
    for (const [x, c, l] of [[-4.6, 'red', 'A'], [-4.1, 'blue', 'B'], [-4.35, 'green', 'C']] as Array<[number, string, string]>) b.label(l, [0.45, 0.45], [x, l === 'C' ? 0.68 : 0.23, fz + 1.5], { color: c, depth: 0.45 });
    const yz = fz + 3.5;
    b.box([w, 0.04, 4], [0, 0.02, yz - 0.5], { color: 'grass', edge: 'soft' });
    b.each(10, (i) => b.box([0.08, 0.8, 0.08], [-w / 2 + 0.1 + i * ((w - 0.2) / 9), 0.4, yz + 1.4], { color: 'white' }));
    b.stick([-w / 2, 0.75, yz + 1.4], [w / 2, 0.75, yz + 1.4], 0.06, 'white').stick([-w / 2, 0.35, yz + 1.4], [w / 2, 0.35, yz + 1.4], 0.06, 'white');
    b.box([0.6, 0.06, 2.6], [3.0, 0.75, yz], { color: '#e8413a', rot: [32, 0, 0] })
      .box([0.6, 0.06, 0.6], [3.0, 1.45, yz - 1.3], { color: '#4a90d9' });
    b.pair((s) => b.stick([3.0 + s * 0.3, 0, yz - 1.6], [3.0 + s * 0.3, 1.45, yz - 1.6], 0.07, '#4a90d9'));
    b.box([1.6, 0.25, 1.6], [-0.5, 0.125, yz], { color: 'wood' }).box([1.4, 0.06, 1.4], [-0.5, 0.24, yz], { color: 'sand', edge: 'soft' });
    b.pair((s) => b.rod([-3.0 + s * 0.8, 0, yz + 0.4], [-3.0 + s * 0.6, 2.0, yz], 0.07, '#f2b81b').rod([-3.0 + s * 0.8, 0, yz - 0.4], [-3.0 + s * 0.6, 2.0, yz], 0.07, '#f2b81b'));
    b.stick([-3.6, 2.0, yz], [-2.4, 2.0, yz], 0.08, '#f2b81b')
      .box([0.45, 0.05, 0.22], [-3.0, 0.45, yz], { color: '#e8413a', name: 'swing', pivot: [-3.0, 2.0, yz] })
      .stick([-3.2, 0.47, yz], [-3.2, 2.0, yz], 0.02, 'silver', { parent: 'swing' })
      .stick([-2.8, 0.47, yz], [-2.8, 2.0, yz], 0.02, 'silver', { parent: 'swing' });
    const sw = (r: number, t: number) => A.pose('swing', { rot: [r, 0, 0], dur: t });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Hooray!', 1.5), A.wait(2), A.operate('door', 'close')],
          [sw(30, 0.5), sw(-30, 0.9), sw(24, 0.8), sw(-18, 0.7), sw(0, 0.5), A.say('Wheee!', 1.2)],
        ],
      })
      .done();
  }),
  // A deadbolt in the edge of a door: brass thumb-turn and key cylinder, and the bolt that shoots into the strike
  // plate in the frame.
  e('deadbolt', 'workshop', 'hardware', () =>
    m('deadbolt', { edge: 'sharp' })
      .box([0.16, 0.24, 0.045], [-0.04, 0.12, 0], { color: '#8a5a3a', round: 0.1 })
      .box([0.06, 0.26, 0.08], [0.09, 0.13, 0], { color: 'white', round: 0.1 })
      .box([0.012, 0.06, 0.026], [0.059, 0.16, 0], { color: 'brass', round: 0.2 })
      .cyl([0.065, 0.012, 0.065], [-0.04, 0.16, 0.028], { color: 'brass', rot: [90, 0, 0] })
      .box([0.015, 0.042, 0.016], [-0.04, 0.16, 0.042], { color: 'brass', round: 0.5, name: 'turn', piece: true })
      .box([0.03, 0.022, 0.022], [0.02, 0.16, 0], { color: 'brass', round: 0.3, name: 'bolt', mover: { kind: 'slide', axis: 'x', amount: 0.035 } })
      .act({
        click: [
          [A.par(A.pose('turn', { rot: [0, 0, 90], dur: 0.3 }), A.operate('bolt', 'out')), A.say('Clunk!', 1)],
          [A.par(A.pose('turn', { rot: [0, 0, 0], dur: 0.3 }), A.operate('bolt', 'in')), A.say('Click.', 1)],
        ],
      })
      .done(),
  ),
  // A heap of rubble: broken concrete slabs, red bricks, a split plank and bent rebar; a chunk tumbles off.
  e('debris', 'workshop', 'building materials', () =>
    m('debris', { edge: 'sharp' })
      .ball([1.0, 0.3, 0.8], [0, 0.12, 0], { color: '#8a8378', edge: 'soft', name: 'heap' })
      .box([0.3, 0.18, 0.24], [-0.12, 0.3, 0], { color: '#a8a8a4', round: 0.1, rot: [20, 30, 10] })
      .box([0.24, 0.14, 0.2], [0.18, 0.27, 0.1], { color: '#b5b5b0', round: 0.1, rot: [-15, 10, 20], name: 'chunk', parent: 'heap', piece: true })
      .box([0.22, 0.065, 0.1], [0.05, 0.4, 0.05], { color: '#b5462e', round: 0.1, rot: [0, 40, 15] })
      .box([0.22, 0.065, 0.1], [-0.32, 0.15, 0.22], { color: '#b5462e', round: 0.1, rot: [0, -20, 0] })
      .box([0.22, 0.065, 0.1], [0.36, 0.1, -0.2], { color: '#a0402a', round: 0.1, rot: [0, 70, 0] })
      .box([0.6, 0.04, 0.12], [0.1, 0.42, -0.12], { color: 'wood', round: 0.1, rot: [0, 10, 28] })
      .rod([-0.05, 0.3, -0.05], [-0.18, 0.64, -0.14], 0.02, '#8a4a2a')
      .rod([-0.02, 0.3, -0.05], [0.06, 0.58, -0.2], 0.02, '#8a4a2a')
      .act({ click: [[A.detach('chunk', 'chunk'), A.effect('dust', { dur: 1.2 }), A.say('Crash!', 1)], [A.reattach('chunk')]] })
      .done(),
  ),
  // A crystal wine decanter: a wide base of red wine, a long neck, a ball stopper that lifts out for pouring.
  e('decanter', 'kitchen', 'glassware', () =>
    m('decanter')
      .ball([0.2, 0.11, 0.2], [0, 0.055, 0], { color: '#7a1a2a', name: 'body' })
      .cyl([0.19, 0.05, 0.19], [0, 0.12, 0], { color: GLASS, taper: 0.35 })
      .cyl([0.05, 0.11, 0.05], [0, 0.19, 0], { color: GLASS })
      .torus([0.065, 0.065, 0.014], [0, 0.245, 0], { color: GLASS, rot: [90, 0, 0] })
      .ball(0.05, [0, 0.275, 0], { color: GLASS, name: 'stopper', parent: 'body', piece: true })
      .act({ click: [A.pose('stopper', { move: [0.06, 0.05, 0], dur: 0.3 }), A.set({ tilt: 35, dur: 0.4 }), A.say('Glug glug...', 1.5), A.wait(1), A.set({ tilt: 0, dur: 0.4 }), A.pose('stopper', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // The Declaration of Independence on a parchment scroll in a stand, its rolled ends and lines of script, with an
  // inkwell and a quill that signs it with a flourish.
  e('declaration of independence', 'study', 'documents', () => {
    const b = m('declaration of independence')
      .box([0.6, 0.05, 0.16], [0, 0.025, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .box([0.5, 0.56, 0.006], [0, 0.34, 0], { color: '#e8d5a8' })
      .capsule([0.04, 0.54, 0.04], [0, 0.63, 0], { color: '#d9c08a', rot: [0, 0, 90] })
      .capsule([0.04, 0.54, 0.04], [0, 0.07, 0.005], { color: '#d9c08a', rot: [0, 0, 90] })
      .label('IN CONGRESS, JULY 4, 1776', [0.42, 0.05], [0, 0.56, 0.006], { color: '#e8d5a8', depth: 0.002 })
      .cyl([0.06, 0.05, 0.06], [0.22, 0.075, 0.06], { color: 'black', edge: 'sharp' })
      .rod([0.2, 0.15, 0.06], [0.32, 0.4, 0.03], 0.012, 'white', { name: 'quill', piece: true })
      .ball([0.03, 0.14, 0.008], [0.29, 0.34, 0.035], { color: 'white', rot: [0, 0, -25], parent: 'quill' });
    b.each(8, (i) => b.box([0.38, 0.006, 0.002], [0, 0.49 - i * 0.035, 0.005], { color: '#7a5a3a', noInk: true }));
    b.each(4, (i) => b.rod([-0.18 + i * 0.1, 0.13, 0.005], [-0.12 + i * 0.1, 0.15, 0.005], 0.005, '#3a2a1a', { noInk: true }));
    return b
      .act({ click: [A.pose('quill', { move: [-0.25, -0.02, -0.04], dur: 0.4 }), A.pose('quill', { move: [-0.15, 0.0, -0.04], dur: 0.25 }), A.pose('quill', { move: [-0.08, -0.02, -0.04], dur: 0.25 }), A.say('Scritch, scratch!', 1.5), A.pose('quill', { move: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A countertop deep fryer: steel tank of hot oil, a lid, a dial and light, and a basket of fries on a handle
  // that drops into the oil to sizzle.
  e('deep fryer', 'kitchen', 'appliances', () => {
    const b = m('deep fryer', { edge: 'sharp' })
      .box([0.35, 0.25, 0.3], [0, 0.125, 0], { color: 'silver', round: 0.1 })
      .box([0.3, 0.02, 0.24], [0, 0.252, 0], { color: '#d9a020' })
      .box([0.36, 0.04, 0.1], [0, 0.27, -0.15], { color: '#8a8a8a', round: 0.3 })
      .cyl([0.04, 0.02, 0.04], [0.1, 0.12, 0.155], { color: 'black', rot: [90, 0, 0] })
      .ball(0.014, [-0.1, 0.12, 0.152], { color: 'orange', glow: true })
      .box([0.2, 0.12, 0.18], [0, 0.33, 0], { color: '#8a8a8a', round: 0.1, name: 'basket', mover: { kind: 'slide', axis: 'y', amount: -0.1 } })
      .rod([0, 0.35, 0.09], [0, 0.38, 0.26], 0.025, 'black', { parent: 'basket' });
    b.each(7, (i) => b.box([0.014, 0.08, 0.014], [-0.06 + i * 0.02, 0.4, -0.04 + (i % 3) * 0.03], { color: '#f2c94c', rot: [0, 0, (i % 2 ? 1 : -1) * 15], parent: 'basket' }));
    return b.act({ click: [A.operate('basket', 'down'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Sizzle!', 2)), A.wait(2), A.operate('basket', 'up')] }).done();
  }),
  // A yellow diamond sign with a leaping deer: watch for deer crossing. It rattles.
  e('deer caution sign', 'ideas', 'road signs', () => {
    const y = 2.1, z = 0.035, k = 'black';
    const b = sign('deer caution sign', 'diamond', 'yellow', 1.0)
      .ball([0.2, 0.09, 0.01], [0, y, z], { color: k, parent: 'sign' })
      .rod([0.08, y + 0.01, z], [0.15, y + 0.11, z], 0.035, k, { parent: 'sign' })
      .ball([0.065, 0.04, 0.01], [0.18, y + 0.12, z], { color: k, parent: 'sign' })
      .rod([0.14, y + 0.14, z], [0.11, y + 0.22, z], 0.014, k, { parent: 'sign' })
      .rod([0.15, y + 0.14, z], [0.19, y + 0.22, z], 0.014, k, { parent: 'sign' });
    for (const [a, c] of [[[0.06, y], [0.13, y - 0.13]], [[0.05, y], [0.08, y - 0.15]], [[-0.06, y], [-0.15, y - 0.1]], [[-0.07, y], [-0.12, y - 0.14]]] as Array<[[number, number], [number, number]]>) b.rod([a[0], a[1], z], [c[0], c[1], z], 0.02, k, { parent: 'sign' });
    return b.act({ click: RATTLE('Clang!') }).done();
  }),
  // A wall-box AED: green case with a heart-and-bolt symbol, a lid that opens on the pads, a flashing button. It
  // speaks its prompts.
  e('defibrillator', 'clinic', 'medical equipment', () =>
    m('defibrillator', { edge: 'sharp' })
      .box([0.3, 0.25, 0.12], [0, 0.125, 0], { color: '#2e9e4a', round: 0.25 })
      .box([0.26, 0.04, 0.05], [0, 0.04, 0.03], { color: 'white', round: 0.2 })
      .box([0.08, 0.06, 0.04], [-0.08, 0.06, 0.035], { color: '#f2e8c8', round: 0.3 })
      .box([0.08, 0.06, 0.04], [0.08, 0.06, 0.035], { color: '#f2e8c8', round: 0.3 })
      .box([0.29, 0.17, 0.02], [0, 0.16, 0.065], { color: '#2e9e4a', round: 0.25, name: 'lid', pivot: [0, 0.245, 0.065], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .box([0.18, 0.12, 0.004], [0, 0.16, 0.077], { color: 'white', round: 0.2, parent: 'lid' })
      .heart(0.08, [0, 0.165, 0.08], { color: 'red', parent: 'lid' })
      .cyl([0.04, 0.015, 0.04], [0.11, 0.035, 0.055], { color: 'orange', rot: [90, 0, 0], glow: true, name: 'button', mover: { kind: 'light' } })
      .torus([0.14, 0.07, 0.03], [0, 0.26, 0], { color: '#1e6e32' })
      .act({ click: [A.operate('lid', 'open'), A.say('Analysing... stand clear!', 2.2), A.operate('button', 'on'), A.wait(0.4), A.operate('button', 'off'), A.say('Bzzt!', 1), A.wait(0.5), A.operate('lid', 'close')] })
      .done(),
  ),
  // A corner deli: cream walls, green striped awning, salamis hanging in the window and a giant sandwich on the roof.
  e('deli', 'places', 'shops', () => {
    const b = shop('deli', { w: 6, d: 6, wall: '#f2e8d8', trim: '#2e7d4f', sign: 'DELI', signBg: '#2e7d4f', door: '#2e7d4f', awn: ['#2e7d4f', 'white'] });
    b.each(5, (i) => b.capsule([0.14, 0.5, 0.14], [0.2 + i * 0.4, 1.95, 3.14], { color: i % 2 ? '#9a3a2a' : '#7a2a1e' }).stick([0.2 + i * 0.4, 2.2, 3.14], [0.2 + i * 0.4, 2.4, 3.14], 0.01, 'tan'));
    b.box([1.6, 0.4, 0.3], [1.4, 1.0, 3.2], { color: '#f2c94c', round: 0.3, edge: 'soft' });
    return b
      .capsule([0.9, 2.8, 0.9], [0, 5.3, 0], { color: '#e0a850', rot: [0, 0, 90], edge: 'soft' })
      .box([2.8, 0.14, 0.9], [0, 5.3, 0], { color: 'lettuce', round: 0.6, edge: 'soft' })
      .box([2.6, 0.12, 0.85], [0, 5.18, 0], { color: 'tomato', round: 0.6, edge: 'soft' })
      .box([2.7, 0.1, 0.85], [0, 5.08, 0], { color: 'cheese', round: 0.4 })
      .stick([0, 4.7, 0], [0, 4.85, 0], 0.4, '#5c6166')
      .act({ click: [[A.operate('door', 'open'), A.say('Ding!', 1), A.wait(2), A.operate('door', 'close')], [A.say('Number 42!', 1.5), A.anim('wobble')]] })
      .done();
  }),
  // A bolt of indigo denim on its board, a folded stack beside it, copper rivets and orange stitching.
  e('denim', 'wardrobe', 'fabric', () =>
    m('denim')
      .box([0.12, 0.5, 0.38], [-0.14, 0.25, 0], { color: 'denim', round: 0.3 })
      .box([0.13, 0.02, 0.385], [-0.14, 0.42, 0], { color: '#c87533', noInk: true })
      .box([0.03, 0.54, 0.4], [-0.14, 0.27, 0], { color: '#c8a06a', round: 0.2, edge: 'sharp' })
      .box([0.3, 0.06, 0.24], [0.12, 0.03, 0.04], { color: '#3a5a8a', round: 0.4 })
      .box([0.29, 0.06, 0.23], [0.12, 0.09, 0.04], { color: 'denim', round: 0.4, rot: [0, 6, 0] })
      .box([0.28, 0.06, 0.22], [0.12, 0.15, 0.04], { color: '#5a7ab0', round: 0.4, rot: [0, -5, 0], name: 'fold', piece: true })
      .box([0.24, 0.004, 0.004], [0.12, 0.181, 0.13], { color: '#e8a040', parent: 'fold', noInk: true })
      .ball(0.01, [0.22, 0.182, 0.1], { color: 'copper', parent: 'fold' })
      .act({ click: [A.pose('fold', { move: [0, 0.05, 0.03], rot: [0, 20, 0], dur: 0.4 }), A.say('Swish!', 1), A.pose('fold', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A denim jacket on a hanger on a coat stand: collar, button front, two flap chest pockets, a waistband; it swings.
  e('denim jacket', 'wardrobe', 'coats', () => {
    const y = 1.55, z = 0.14, p = { parent: 'hanger' };
    const b = hangStand('denim jacket', y)
      .box([0.48, 0.6, 0.16], [0, y - 0.3, z], { color: 'denim', round: 0.3, ...p })
      .box([0.48, 0.07, 0.17], [0, y - 0.6, z], { color: '#3a5a8a', round: 0.3, ...p })
      .box([0.008, 0.56, 0.01], [0.012, y - 0.32, z + 0.083], { color: '#3a5a8a', noInk: true, ...p });
    b.pair((s) => {
      b.rod([s * 0.22, y - 0.03, z], [s * 0.3, y - 0.6, z], 0.13, 'denim', p);
      b.cyl([0.13, 0.06, 0.13], [s * 0.3, y - 0.62, z], { color: '#3a5a8a', ...p });
      b.box([0.16, 0.12, 0.04], [s * 0.1, y - 0.02, z + 0.08], { color: '#3a5a8a', round: 0.3, rot: [-20, 0, s * 25], ...p });
      b.box([0.11, 0.1, 0.012], [s * 0.12, y - 0.17, z + 0.082], { color: '#3a5a8a', round: 0.3, ...p });
      b.ball(0.012, [s * 0.12, y - 0.13, z + 0.09], { color: 'silver', ...p });
    });
    b.each(5, (i) => b.ball(0.013, [0.03, y - 0.1 - i * 0.11, z + 0.085], { color: 'silver', ...p }));
    return b.act({ click: [A.pose('hanger', { rot: [0, 0, 14], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, -10], dur: 0.45 }), A.pose('hanger', { rot: [0, 0, 5], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A denim mini skirt on a clip hanger on a coat stand: waistband with a brass button, front pockets, a seam; it swings.
  e('denim skirt', 'wardrobe', 'skirts', () => {
    const y = 1.25, z = 0.14, p = { parent: 'hanger' };
    const b = hangStand('denim skirt', y)
      .cyl([0.5, 0.46, 0.34], [0, y - 0.3, z], { color: 'denim', taper: 0.7, ...p })
      .cyl([0.36, 0.06, 0.25], [0, y - 0.05, z], { color: '#3a5a8a', ...p })
      .ball(0.018, [0.03, y - 0.05, z + 0.125], { color: 'gold', ...p })
      .rod([0, y - 0.52, z + 0.17], [0, y - 0.09, z + 0.124], 0.005, '#e8a040', { noInk: true, ...p });
    b.pair((s) => b.box([0.09, 0.08, 0.01], [s * 0.1, y - 0.15, z + 0.135], { color: '#3a5a8a', round: 0.3, rot: [-8, 0, 0], ...p }).box([0.02, 0.04, 0.02], [s * 0.15, y - 0.02, z], { color: 'silver', ...p }));
    return b.act({ click: [A.pose('hanger', { rot: [0, 0, 14], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, -10], dur: 0.45 }), A.pose('hanger', { rot: [0, 0, 5], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A dentist's chair: a pump-up column on a base, a reclined teal seat, headrest and footrest, an operating lamp on
  // an arm, an instrument tray and a rinsing bowl. The chair rises and the lamp comes on.
  e('dental chair', 'clinic', 'dentist', () =>
    m('dental chair', { view: 'side', edge: 'sharp' })
      .cyl([0.6, 0.06, 0.75], [0, 0.03, 0], { color: '#bbbbbb' })
      .cyl([0.22, 0.38, 0.22], [0, 0.25, 0], { color: '#dddddd' })
      .box([0.5, 0.08, 0.5], [0, 0.45, 0], { color: '#cccccc', name: 'lift', mover: { kind: 'slide', axis: 'y', amount: 0.18 } })
      .box([0.56, 0.12, 0.6], [0, 0.52, 0], { color: '#3aa8b8', round: 0.5, edge: 'soft', parent: 'lift' })
      .box([0.56, 0.12, 0.72], [0, 0.78, -0.52], { color: '#3aa8b8', round: 0.5, rot: [50, 0, 0], edge: 'soft', parent: 'lift' })
      .box([0.3, 0.1, 0.22], [0, 1.08, -0.8], { color: '#3aa8b8', round: 0.6, rot: [50, 0, 0], edge: 'soft', parent: 'lift' })
      .box([0.5, 0.12, 0.6], [0, 0.42, 0.55], { color: '#3aa8b8', round: 0.5, rot: [-25, 0, 0], edge: 'soft', parent: 'lift' })
      .box([0.08, 0.05, 0.4], [0.32, 0.66, 0.05], { color: '#3aa8b8', round: 0.5, parent: 'lift' })
      .stick([0.45, 0.05, -0.65], [0.45, 1.75, -0.65], 0.06, '#dddddd')
      .rod([0.45, 1.75, -0.65], [0.15, 1.75, 0.1], 0.05, '#dddddd')
      .box([0.26, 0.12, 0.16], [0.12, 1.68, 0.18], { color: '#eeeeee', round: 0.4, rot: [30, 0, 0] })
      .ball([0.18, 0.04, 0.12], [0.12, 1.62, 0.2], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .stick([-0.45, 0.05, 0.2], [-0.45, 0.85, 0.2], 0.04, '#cccccc')
      .box([0.35, 0.03, 0.22], [-0.45, 0.87, 0.2], { color: '#dddddd' })
      .box([0.25, 0.01, 0.015], [-0.45, 0.89, 0.18], { color: 'silver' })
      .box([0.2, 0.01, 0.015], [-0.45, 0.89, 0.24], { color: 'silver' })
      .stick([0.42, 0.05, 0.1], [0.42, 0.7, 0.1], 0.05, '#cccccc')
      .cyl([0.2, 0.08, 0.2], [0.42, 0.74, 0.1], { color: 'white', taper: 1.3, edge: 'soft' })
      .socket('seat', [0, 0.6, 0.05], 'seat', { part: 'lift' })
      .act({
        click: [
          [A.operate('lift', 'up'), A.operate('lamp', 'on'), A.say('Whirr...', 1.5)],
          [A.operate('lamp', 'off'), A.operate('lift', 'down'), A.say('Pssh.', 1)],
        ],
      })
      .done(),
  ),
  // A dental handpiece in its holder on a little stand, its hose curling to the base, a bur that spins.
  e('dental drill', 'clinic', 'dentist', () =>
    m('dental drill', { edge: 'sharp' })
      .box([0.12, 0.04, 0.08], [0, 0.02, 0], { color: 'white', round: 0.3 })
      .cyl([0.03, 0.06, 0.03], [0.03, 0.07, 0], { color: '#dddddd' })
      .rod([0.03, 0.06, 0], [0.04, 0.18, 0], 0.022, '#e8e8e8', { edge: 'soft' })
      .rod([0.04, 0.18, 0], [0.06, 0.2, 0.0], 0.022, 'silver')
      .cyl([0.006, 0.025, 0.006], [0.068, 0.19, 0.0], { color: 'gold', rot: [0, 0, 60], name: 'bur', mover: { kind: 'spin', axis: 'y', amount: 1440 } })
      .rod([0.03, 0.04, 0], [-0.06, 0.02, -0.05], 0.012, '#888888')
      .act({ click: [A.operate('bur', 'on'), A.par(A.anim('shake'), A.say('Bzzzzzz!', 1.5)), A.wait(0.6), A.operate('bur', 'off')] })
      .done(),
  ),
  // A dentist's surgery: a clean white-and-teal front with a big shop window, a giant smiling tooth on a sign.
  e('dentist office', 'places', 'clinics', () =>
    shop('dentist office', { w: 7, d: 6, wall: '#e8f4f8', trim: '#3aa8b8', sign: 'DENTIST', signBg: '#3aa8b8', door: '#3aa8b8' })
      .stick([0, 4.7, 0.5], [0, 5.3, 0.5], 0.2, '#3aa8b8')
      .ball([1.4, 1.1, 0.6], [0, 6.1, 0.5], { color: 'white', name: 'tooth', piece: true, edge: 'soft' })
      .capsule([0.42, 0.9, 0.42], [-0.32, 5.5, 0.5], { color: 'white', rot: [0, 0, -10], parent: 'tooth', edge: 'soft' })
      .capsule([0.42, 0.9, 0.42], [0.32, 5.5, 0.5], { color: 'white', rot: [0, 0, 10], parent: 'tooth', edge: 'soft' })
      .arc([0.5, 0.25, 0.05], [0, 6.0, 0.82], { color: '#3aa8b8', arc: 140, rot: [0, 0, 180], parent: 'tooth' })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding!', 1), A.wait(2), A.operate('door', 'close')],
          [A.par(A.pose('tooth', { scale: 1.15, dur: 0.3 }), A.effect('sparkle', { dur: 1.5 })), A.pose('tooth', { scale: 1, dur: 0.3 })],
        ],
      })
      .done(),
  ),
  // A set of false teeth: pink gums, two rows of white teeth, the upper set on a hinge so they chatter.
  e('dentures', 'clinic', 'dentist', () => {
    const b = m('dentures').ball([0.1, 0.02, 0.07], [0, 0.012, -0.015], { color: '#e88a9a', name: 'lower' });
    b.box([0.08, 0.008, 0.05], [0, 0.04, -0.035], { color: '#e88a9a', name: 'jaw', pivot: [0, 0.035, -0.06], mover: { kind: 'swing', axis: 'x', amount: -25 } });
    for (const [gy, ty, part] of [[0.05, 0.034, 'jaw'], [0.012, 0.029, 'lower']] as Array<[number, number, string]>)
      for (let i = 0; i < 7; i++) {
        const a = ((-80 + i * 26.7) * Math.PI) / 180;
        const x = Math.sin(a) * 0.045, z = Math.cos(a) * 0.038;
        b.ball([0.03, 0.025, 0.026], [x, gy, z - 0.02], { color: '#e88a9a', parent: part === 'jaw' ? 'jaw' : undefined });
        b.ball([0.017, 0.022, 0.014], [x * 1.04, part === 'jaw' ? 0.037 : ty, z * 1.04 - 0.02], { color: 'white', parent: part === 'jaw' ? 'jaw' : undefined });
      }
    return b.act({ click: [A.operate('jaw', 'open'), A.operate('jaw', 'close'), A.operate('jaw', 'open'), A.operate('jaw', 'close'), A.operate('jaw', 'open'), A.operate('jaw', 'close'), A.say('Clack clack clack!', 1.5)] }).done();
  }),
  // A spray can of deodorant: blue cap, white can with a label, nozzle; psssht.
  e('deodorant', 'home', 'bathroom', () =>
    m('deodorant', { edge: 'sharp' })
      .cyl([0.05, 0.15, 0.05], [0, 0.075, 0], { color: 'white', edge: 'soft' })
      .cyl([0.044, 0.02, 0.044], [0, 0.16, 0], { color: 'silver', taper: 0.7 })
      .box([0.014, 0.012, 0.02], [0, 0.175, 0.006], { color: 'white' })
      .cyl([0.052, 0.045, 0.052], [0, 0.195, 0], { color: '#3a6fd8', name: 'cap', piece: true })
      .label('FRESH', [0.04, 0.05], [0, 0.08, 0.026], { color: '#3a6fd8', depth: 0.002 })
      .act({ click: [A.pose('cap', { move: [0.06, 0.02, 0], dur: 0.3 }), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Psssht!', 1.2)), A.wait(0.8), A.pose('cap', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A three-storey department store: big display windows with mannequins along the ground floor, a revolving door
  // under a canopy, rows of windows above, a cornice sign and flags on the roof.
  e('department store', 'places', 'shops', () => {
    const fz = 8;
    const b = tower('department store', { w: 24, d: 16, floors: 3, st: 4.2, wall: '#e8ddd0', trim: '#7a2a5a', cols: 7, winW: 1.8, winH: 2.0, shopfront: true, noDoor: true, roof: '#7a5a8a' });
    b.label('DEPARTMENT STORE', [12, 1.1], [0, 11.8, fz + 0.06], { color: '#7a2a5a', depth: 0.08 })
      .box([6, 0.3, 2.2], [0, 3.3, fz + 1.1], { color: '#7a2a5a', round: 0.1 })
      .cyl([2.6, 0.25, 2.6], [0, 2.6, fz + 0.4], { color: '#c8a050' })
      .cyl([2.6, 0.08, 2.6], [0, 0.04, fz + 0.4], { color: '#c8a050' })
      .stick([0, 0.05, fz + 0.4], [0, 2.5, fz + 0.4], 0.12, '#c8a050', { name: 'revolve', mover: { kind: 'spin', axis: 'y', amount: 120 } });
    b.each(4, (i) => b.box([1.15, 2.3, 0.04], [Math.cos((i * Math.PI) / 2 + 0.6) * 0.62, 1.25, fz + 0.4 + Math.sin((i * Math.PI) / 2 + 0.6) * 0.62], { color: WIN, rot: [0, (-(i * 90) - 34), 0], parent: 'revolve' }));
    for (const x of [-8.6, -5.1, 5.1, 8.6]) {
      b.ball([0.3, 0.36, 0.25], [x, 1.6, fz + 0.25], { color: '#f2ece4' }).cyl([0.4, 0.7, 0.28], [x, 1.1, fz + 0.25], { color: x < 0 ? '#c0392b' : '#2a5bd7', taper: 1.4 }).ball(0.2, [x, 2.0, fz + 0.25], { color: '#f2ece4' });
    }
    for (const [x, c] of [[-8, '#c0392b'], [0, '#2a5bd7'], [8, '#f2b81b']] as Array<[number, string]>) b.stick([x, 13.0, fz - 1], [x, 16.5, fz - 1], 0.1, 'silver').box([1.4, 0.8, 0.04], [x + 0.72, 16.0, fz - 1], { color: c, round: 0.1, edge: 'soft' });
    return b
      .act({
        click: [
          [A.operate('revolve', 'on'), A.say('Whoosh!', 1.5), A.wait(2.5), A.operate('revolve', 'off')],
          [A.effect('sparkle', { dur: 2 }), A.say('Ding-dong! Sale on floor two!', 2.5)],
        ],
      })
      .done();
  }),
  // A writing desk at 0.75 m: a top with a pedestal of three drawers, a modesty panel, a green banker's lamp that
  // switches on, papers and a pen pot.
  e('desk', 'home', 'tables', () => {
    const b = m('desk', { edge: 'sharp' })
      .box([1.2, 0.04, 0.6], [0, 0.73, 0], { color: 'wood', round: 0.2 })
      .box([0.42, 0.71, 0.56], [0.37, 0.355, 0], { color: 'wood', round: 0.05 })
      .box([0.8, 0.4, 0.025], [-0.16, 0.5, -0.27], { color: 'darkwood' })
      .box([0.05, 0.71, 0.56], [-0.56, 0.355, 0], { color: 'wood', round: 0.05 });
    b.each(3, (i) => {
      const nm = `drawer${i + 1}`;
      b.box([0.38, 0.2, 0.025], [0.37, 0.59 - i * 0.22, 0.285], { color: 'lightwood', round: 0.2, name: nm, mover: { kind: 'slide', axis: 'z', amount: 0.35 } })
        .box([0.34, 0.16, 0.45], [0.37, 0.59 - i * 0.22, 0.05], { color: '#c8a87a', parent: nm })
        .box([0.1, 0.02, 0.02], [0.37, 0.59 - i * 0.22, 0.305], { color: 'brass', parent: nm });
    });
    return b
      .box([0.14, 0.02, 0.1], [-0.42, 0.76, -0.12], { color: 'brass', round: 0.3 })
      .stick([-0.42, 0.76, -0.12], [-0.42, 0.98, -0.12], 0.015, 'brass')
      .cyl([0.26, 0.08, 0.12], [-0.42, 1.0, -0.06], { color: '#1e6e3a', taper: 0.8 })
      .box([0.2, 0.02, 0.05], [-0.42, 0.955, -0.06], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .box([0.3, 0.008, 0.22], [-0.05, 0.754, 0.1], { color: 'white', rot: [0, 10, 0] })
      .cyl([0.07, 0.1, 0.07], [0.42, 0.8, -0.15], { color: '#3a3633' })
      .stick([0.41, 0.8, -0.15], [0.39, 0.92, -0.14], 0.008, 'blue')
      .stick([0.43, 0.8, -0.15], [0.45, 0.91, -0.16], 0.008, 'red')
      .socket('top', [0.05, 0.75, 0.05], 'top', { size: 0.6 })
      .act({
        click: [
          [A.operate('lamp', 'on'), A.say('Click.', 1)],
          [A.operate('drawer1', 'out'), A.wait(1.5), A.operate('drawer1', 'in')],
          [A.operate('lamp', 'off'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A big chrome control knob on a panel with a ring of tick marks and a red pointer; it clicks round and back.
  e('dial', 'tech', 'controls', () => {
    const b = m('dial', { edge: 'sharp' })
      .box([0.16, 0.02, 0.06], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.14, 0.12, 0.03], [0, 0.08, 0], { color: '#555555', round: 0.2 })
      .cyl([0.06, 0.03, 0.06], [0, 0.075, 0.03], { color: 'silver', rot: [90, 0, 0], name: 'knob', piece: true })
      .box([0.006, 0.024, 0.004], [0, 0.09, 0.047], { color: 'red', parent: 'knob' });
    b.each(7, (i) => {
      const a = ((-135 + i * 45) * Math.PI) / 180;
      b.box([0.004, 0.01, 0.004], [Math.sin(a) * 0.045, 0.075 + Math.cos(a) * 0.045, 0.016], { color: 'white', rot: [0, 0, (-a * 180) / Math.PI], noInk: true });
    });
    return b.act({ click: [[A.pose('knob', { rot: [0, 0, -135], dur: 0.6 }), A.say('Click, click, click!', 1.5)], [A.pose('knob', { rot: [0, 0, 0], dur: 0.6 }), A.say('Click.', 1)]] }).done();
  }),
  // A brilliant-cut diamond (3 cm) on a black velvet display post: crown facets above, the pointed pavilion below.
  // It flashes.
  e('diamond', 'nature', 'minerals', () =>
    m('diamond', { edge: 'sharp' })
      .cyl([0.05, 0.03, 0.05], [0, 0.015, 0], { color: '#1e1e1e', round: 0.8, edge: 'soft' })
      .cone([0.03, 0.022, 0.03], [0, 0.041, 0], { color: '#bfefff', rot: [180, 0, 0], segs: 8 })
      .cyl([0.03, 0.01, 0.03], [0, 0.057, 0], { color: '#d8f6ff', taper: 0.6, segs: 8 })
      .ball(0.008, [0.005, 0.06, 0.01], { color: 'white', glow: true, name: 'glint', mover: { kind: 'light' } })
      .act({ click: [A.operate('glint', 'on'), A.effect('sparkle', { dur: 1.5 }), A.wait(1), A.operate('glint', 'off')] })
      .done(),
  ),
  // A mine entrance in a rocky hill: a timber-framed portal, a lantern, a sign, rails running out to a cart heaped
  // with diamonds. The cart rolls out and back.
  e('diamond mine', 'places', 'mines', () => {
    const b = m('diamond mine')
      .ball([7, 4.2, 5], [0, 1.6, -1.2], { color: '#8a6a45' })
      .ball([3, 2.4, 3], [2.6, 1.0, 0.4], { color: '#7a5a3a' })
      .ball([2.4, 2.0, 2.6], [-2.8, 0.8, 0.3], { color: '#9a7a52' })
      .box([1.6, 2.2, 0.1], [0, 1.1, 1.15], { color: '#1e1a16', edge: 'sharp' })
      .box([0.22, 2.4, 0.22], [0.9, 1.2, 1.2], { color: 'darkwood', edge: 'sharp' })
      .box([0.22, 2.4, 0.22], [-0.9, 1.2, 1.2], { color: 'darkwood', edge: 'sharp' })
      .box([2.3, 0.3, 0.3], [0, 2.45, 1.2], { color: 'darkwood', edge: 'sharp' })
      .label('DIAMOND MINE', [1.8, 0.35], [0, 2.9, 1.25], { color: '#e8d8b0', depth: 0.05 })
      .stick([1.15, 1.6, 1.25], [1.35, 1.6, 1.25], 0.04, 'iron')
      .cyl([0.14, 0.22, 0.14], [1.38, 1.45, 1.25], { color: '#f6c34a', glow: true, name: 'lantern', mover: { kind: 'light', on: true } });
    b.pair((s) => {
      b.stick([s * 0.38, 0.04, 0.6], [s * 0.38, 0.04, 4.0], 0.06, 'iron');
    });
    b.each(7, (i) => b.box([1.0, 0.06, 0.14], [0, 0.02, 0.8 + i * 0.5], { color: 'darkwood', edge: 'sharp' }));
    b.box([0.85, 0.5, 1.0], [0, 0.55, 2.6], { color: 'steel', round: 0.1, name: 'cart', edge: 'sharp' });
    b.pair((s) => b.each(2, (i) => wheel(b, `wheel${s > 0 ? 'L' : 'R'}${i}`, s * 0.38, 0.2, 2.3 + i * 0.6, 0.32, 0.08, 'iron')));
    around(7, 0.2).forEach(([x, z], i) => b.cone([0.14, 0.14, 0.14], [x, 0.86 + (i % 2) * 0.04, 2.6 + z], { color: '#9fe8ff', rot: [180, i * 20, 0], parent: 'cart', segs: 6, edge: 'sharp' }));
    return b
      .act({ click: [A.pose('cart', { move: [0, 0, 1.0], dur: 1.2 }), A.say('Clank, clank!', 1.5), A.effect('sparkle', { dur: 1 }), A.pose('cart', { move: [0, 0, 0], dur: 1.2 })] })
      .done();
  }),
  // A diamond engagement ring in a red velvet box whose lid snaps open; it sparkles.
  e('diamond ring', 'wardrobe', 'jewellery', () =>
    m('diamond ring', { edge: 'sharp' })
      .box([0.06, 0.03, 0.06], [0, 0.015, 0], { color: 'darkred', round: 0.4, edge: 'soft' })
      .box([0.05, 0.015, 0.03], [0, 0.03, 0.005], { color: '#5a0a14', round: 0.4 })
      .box([0.06, 0.02, 0.06], [0, 0.04, 0], { color: 'darkred', round: 0.4, name: 'lid', pivot: [0, 0.03, -0.03], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .torus([0.022, 0.022, 0.004], [0, 0.038, 0.006], { color: 'gold', tube: 0.16 })
      .cone([0.01, 0.008, 0.01], [0, 0.052, 0.006], { color: '#bfefff', rot: [180, 0, 0], segs: 8 })
      .cyl([0.01, 0.004, 0.01], [0, 0.058, 0.006], { color: '#d8f6ff', taper: 0.6, segs: 8 })
      .act({ click: [A.operate('lid', 'open'), A.effect('sparkle', { dur: 2 }), A.wait(2.2), A.operate('lid', 'close'), A.say('Snap!', 1)] })
      .done(),
  ),
  // A fresh disposable nappy with stretchy blue tabs and little stars; it is bouncy-clean.
  e('diaper', 'home', 'nursery', () => {
    const b = m('diaper')
      .box([0.3, 0.1, 0.18], [0, 0.2, 0], { color: 'white', round: 0.5 })
      .wedge([0.3, 0.16, 0.17], [0, 0.085, 0], { color: 'white', rot: [0, 0, 180] })
      .box([0.31, 0.03, 0.185], [0, 0.24, 0], { color: 'skyblue', round: 0.4 });
    b.pair((s) => b.box([0.05, 0.05, 0.04], [s * 0.16, 0.2, 0.07], { color: 'skyblue', round: 0.4 }));
    for (const [x, y] of [[-0.06, 0.17], [0.05, 0.19], [0, 0.11]]) b.star(0.035, [x, y, 0.092], { color: 'yellow', noInk: true });
    return b.act({ click: [A.anim('bounce'), A.effect('sparkle', { dur: 1.2 })] }).done();
  }),
  // A leather dice cup tipped on its side and the pair of real 16 mm dice that tumbled out; roll again.
  e('dice', 'toys', 'games', () => {
    const s = 0.016, h = s / 2;
    const b = m('dice', { edge: 'sharp' })
      .cyl([0.075, 0.1, 0.075], [-0.07, 0.0375, -0.02], { color: '#6a3a20', rot: [0, 0, 90], taper: 0.88, name: 'cup', edge: 'soft' })
      .torus([0.075, 0.075, 0.008], [-0.02, 0.0375, -0.02], { color: '#4a2814', rot: [0, 90, 0], parent: 'cup' })
      .cyl([0.06, 0.004, 0.06], [-0.019, 0.0375, -0.02], { color: '#2a1a10', rot: [0, 0, 90], parent: 'cup' })
      .box(s, [0.02, h, 0], { color: 'white', round: 0.3 });
    const pip = (at: V, n: 'x' | 'y' | 'z') => b.ball(n === 'x' ? [0.001, 0.0032, 0.0032] : n === 'y' ? [0.0032, 0.001, 0.0032] : [0.0032, 0.0032, 0.001], at, { color: 'black', noInk: true });
    for (const [x, y] of [[-0.004, 0.004], [0.004, 0.004], [0, 0], [-0.004, -0.004], [0.004, -0.004]]) pip([0.02 + x, h + y, h], 'z');
    pip([0.02, s, 0], 'y');
    for (const d of [-0.004, 0, 0.004]) pip([0.02 + h, h + d, -d], 'x');
    b.box(s, [0.045, h, 0.012], { color: 'white', round: 0.3, rot: [0, 30, 0] });
    const r = Math.PI / 6;
    for (const d of [-0.004, 0.004]) pip([0.045 + d * Math.cos(r) + d * Math.sin(r), s, 0.012 - d * Math.sin(r) + d * Math.cos(r)], 'y');
    return b
      .act({
        click: [
          [A.pose('cup', { rot: [0, 0, -12], dur: 0.12 }), A.pose('cup', { rot: [0, 0, 8], dur: 0.12 }), A.pose('cup', { rot: [0, 0, 0], dur: 0.1 }), A.anim('hop'), A.say('Clatter... six!', 1.5)],
          [A.pose('cup', { rot: [0, 0, -12], dur: 0.12 }), A.pose('cup', { rot: [0, 0, 8], dur: 0.12 }), A.pose('cup', { rot: [0, 0, 0], dur: 0.1 }), A.anim('hop'), A.say('Clatter... double three!', 1.5)],
        ],
      })
      .done();
  }),
  // A bedside digital alarm clock: glowing red 7-segment digits, a snooze bar on top; the alarm rings, snooze it.
  e('digital clock', 'home', 'clocks', () =>
    seg7(
      m('digital clock', { edge: 'sharp' })
        .box([0.2, 0.1, 0.07], [0, 0.05, 0], { color: '#222222', round: 0.3 })
        .box([0.17, 0.065, 0.005], [0, 0.055, 0.036], { color: '#111111' })
        .box([0.12, 0.012, 0.03], [0, 0.106, 0], { color: '#444444', round: 0.4, name: 'snooze', piece: true }),
      '7:00', -0.045, 0.055, 0.04, 0.018, 0.04, 'red',
    )
      .act({ click: [A.par(A.anim('shake', 2), A.say('Beep beep beep!', 1.5)), A.pose('snooze', { move: [0, -0.006, 0], dur: 0.1 }), A.say('Click.', 1), A.pose('snooze', { move: [0, 0, 0], dur: 0.1 })] })
      .done(),
  ),
  // A dining room cut away like a stage set: wooden floor, a rug, papered walls with a window and a painting, a
  // table laid for four with chairs, a sideboard of plates, candles that light for dinner.
  e('dining room', 'places', 'rooms', () => {
    const b = m('dining room', { edge: 'sharp' })
      .box([4, 0.06, 3.4], [0, 0.03, 0], { color: 'wood' })
      .box([4, 2.6, 0.12], [0, 1.33, -1.64], { color: '#e8d8c0' })
      .box([0.12, 2.6, 3.4], [-1.94, 1.33, 0], { color: '#dcc8a8' })
      .box([4, 0.12, 0.14], [0, 0.12, -1.56], { color: 'white' })
      .box([2.8, 0.02, 2.0], [0.2, 0.07, 0.1], { color: '#8b2a2a', edge: 'soft' })
      .box([1.6, 0.05, 0.9], [0.2, 0.73, 0.1], { color: 'darkwood', round: 0.2 })
      .box([1.4, 0.004, 0.75], [0.2, 0.757, 0.1], { color: 'white' });
    win(b, 0.9, 1.5, -1.58, 1.0, 1.2, 'white', { bars: true });
    b.pair((s) => b.box([0.3, 1.5, 0.05], [0.9 + s * 0.68, 1.55, -1.52], { color: '#8b2a2a', round: 0.4, edge: 'soft' }));
    b.box([0.8, 0.6, 0.05], [-0.8, 1.6, -1.56], { color: 'gold', round: 0.2 }).box([0.66, 0.46, 0.02], [-0.8, 1.6, -1.53], { color: '#6a9ab8' });
    for (const [x, z] of [[0.9, 0.48], [-0.5, 0.48], [0.9, -0.28], [-0.5, -0.28]]) b.box([0.05, 0.7, 0.05], [x, 0.38, z], { color: 'darkwood' });
    for (const [x, z, f] of [[-0.15, 0.62, 1], [0.55, 0.62, 1], [-0.15, -0.42, -1], [0.55, -0.42, -1]] as V[]) {
      b.box([0.42, 0.04, 0.42], [x, 0.45, z], { color: 'wood' }).box([0.42, 0.5, 0.04], [x, 0.72, z + f * 0.2], { color: 'wood' });
      for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18]) b.box([0.035, 0.43, 0.035], [x + dx, 0.215, z + dz], { color: 'darkwood' });
    }
    for (const [x, z] of [[-0.15, 0.4], [0.55, 0.4], [-0.15, -0.2], [0.55, -0.2]]) b.cyl([0.24, 0.012, 0.24], [x, 0.765, z], { color: 'white', edge: 'soft' });
    b.box([0.5, 0.8, 1.2], [-1.62, 0.42, -0.6], { color: 'darkwood', round: 0.05 });
    b.each(3, (i) => b.cyl([0.24, 0.02, 0.24], [-1.4, 0.95 + i * 0.03, -0.9 + i * 0.3], { color: 'white', rot: [80, 0, 0], edge: 'soft' }));
    b.each(2, (i) => {
      const x = 0.0 + i * 0.4;
      b.cyl([0.06, 0.02, 0.06], [x, 0.77, 0.1], { color: 'brass' }).cyl([0.035, 0.22, 0.035], [x, 0.89, 0.1], { color: 'cream', edge: 'soft' }).ball([0.04, 0.07, 0.04], [x, 1.04, 0.1], { color: 'flame', glow: true, name: `candle${i}`, mover: { kind: 'light' } });
    });
    return b
      .socket('table', [0.2, 0.76, 0.1], 'top', { size: 1 })
      .act({ click: [[A.operate('candle', 'on'), A.say('Ding, ding!', 1.5)], [A.operate('candle', 'off'), A.effect('smoke', { dur: 1 })]] })
      .done();
  }),
  // A diner booth: two red vinyl benches with tall buttoned backs facing across a chrome-edged table, a napkin
  // dispenser, ketchup and mustard and a little tabletop jukebox that lights up.
  e('dinner booth', 'home', 'seating', () => {
    const b = m('dinner booth', { edge: 'sharp' })
      .box([0.75, 0.04, 1.1], [0, 0.75, 0], { color: '#e8e0d0', round: 0.2 })
      .box([0.77, 0.03, 1.12], [0, 0.73, 0], { color: 'silver', round: 0.3 })
      .stick([0, 0, 0], [0, 0.72, 0], 0.1, 'silver')
      .cyl([0.45, 0.04, 0.45], [0, 0.02, 0], { color: 'silver' })
      .cyl([0.05, 0.17, 0.05], [0.12, 0.855, 0.35], { color: 'red', edge: 'soft' })
      .cyl([0.05, 0.17, 0.05], [0.2, 0.855, 0.35], { color: 'yellow', edge: 'soft' })
      .box([0.12, 0.1, 0.07], [-0.12, 0.82, 0.35], { color: 'silver' })
      .box([0.16, 0.18, 0.1], [-0.25, 0.86, -0.4], { color: 'silver', round: 0.3 })
      .box([0.12, 0.1, 0.01], [-0.25, 0.88, -0.345], { color: '#f2b81b', glow: true, name: 'jukebox', mover: { kind: 'light' } });
    b.pair((s) => {
      b.box([0.55, 0.4, 1.2], [s * 0.7, 0.2, 0], { color: '#6a1a1a', round: 0.1 });
      b.box([0.55, 0.14, 1.24], [s * 0.7, 0.46, 0], { color: '#c0392b', round: 0.6, edge: 'soft' });
      b.box([0.18, 0.85, 1.24], [s * 1.02, 0.85, 0], { color: '#c0392b', round: 0.6, edge: 'soft' });
      b.box([0.06, 0.04, 1.26], [s * 1.08, 1.29, 0], { color: 'silver', round: 0.4 });
      b.socket(s > 0 ? 'seatL' : 'seatR', [s * 0.7, 0.53, 0], 'seat', { yaw: s > 0 ? -90 : 90 });
    });
    return b
      .socket('table', [0, 0.77, 0], 'top', { size: 0.6 })
      .act({ click: [[A.operate('jukebox', 'on'), A.say('Doo-wop, sha-la-la!', 2)], [A.operate('jukebox', 'off'), A.say('Ding! Order up!', 1.5)]] })
      .done();
  }),
  // A T. rex skeleton on a museum plinth, 3 m tall: a long spine and tail, ribs, two legs, tiny arms, and a skull
  // whose jaw drops open in a roar.
  e('dinosaur bones', 'nature', 'fossils', () => {
    const bone = '#efe6d0';
    const b = m('dinosaur bones', { view: 'side' }).box([1.4, 0.2, 5], [0, 0.1, 0], { color: 'stone', edge: 'sharp' });
    const spine: V[] = [[0, 0.5, -2.4], [0, 1.0, -1.7], [0, 1.45, -1.0], [0, 1.75, -0.3], [0, 2.05, 0.4], [0, 2.45, 0.9]];
    for (let i = 0; i < spine.length - 1; i++) b.rod(spine[i], spine[i + 1], 0.18 - i * 0.015, bone);
    b.each(8, (i) => b.cone([0.06, 0.18, 0.04], [0, 1.0 + i * 0.16, -1.7 + i * 0.32], { color: bone }));
    b.pair((s) => {
      b.rod([s * 0.22, 1.7, -0.3], [s * 0.26, 1.05, 0.2], 0.16, bone).rod([s * 0.26, 1.05, 0.2], [s * 0.26, 0.45, -0.15], 0.13, bone).rod([s * 0.26, 0.45, -0.15], [s * 0.26, 0.24, 0.3], 0.1, bone);
      b.rod([s * 0.13, 1.95, 0.55], [s * 0.16, 1.75, 0.75], 0.05, bone);
    });
    b.each(5, (i) => b.torus([0.6, 0.8, 0.07], [0, 1.6 + i * 0.07, -0.25 + i * 0.2], { color: bone, rot: [0, 90, 0], tube: 0.1 }));
    for (const z of [-1.2, 0.4]) b.stick([0, 0.2, z], [0, z < 0 ? 1.3 : 1.9, z], 0.05, 'iron');
    return b
      .box([0.34, 0.36, 0.8], [0, 2.6, 1.3], { color: bone, round: 0.4, name: 'skull' })
      .ball([0.13, 0.13, 0.15], [0, 2.66, 1.25], { color: '#3a3020', parent: 'skull' })
      .box([0.3, 0.12, 0.66], [0, 2.32, 1.36], { color: bone, round: 0.4, rot: [-12, 0, 0], name: 'jaw', parent: 'skull', pivot: [0, 2.42, 1.05], mover: { kind: 'swing', axis: 'x', amount: 28 } })
      .act({ click: [A.operate('jaw', 'open'), A.par(A.anim('shake'), A.say('ROAAAR!', 2)), A.wait(0.8), A.operate('jaw', 'close')] })
      .done();
  }),
  // A grown-up in a green dinosaur suit: a toothy dino hood over the face, back spikes, a tail, little claw arms. A
  // person, so they gesture and speak: claws up for a "Rawr!", and a dino dance.
  e('dinosaur costume', 'toys', 'costumes', () =>
    withAct(who('dinosaur costume', { h: 1.7, top: '#4caf50', bottom: '#4caf50', shoes: '#2e7d32', long: true, style: 'short', pose: 'hold', acc: [dinoSuit] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('Rawr!', 1.5))],
        [A.par(A.anim('dance'), A.say('Dino dance!', 1.8))],
      ],
    }),
  ),
  // A speckled dinosaur egg in a sandy nest; it wobbles and its top cracks off.
  e('dinosaur egg', 'nature', 'fossils', () => {
    const b = m('dinosaur egg')
      .torus([0.42, 0.42, 0.1], [0, 0.05, 0], { color: '#a07d55', rot: [90, 0, 0], tube: 0.3 })
      .cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: 'sand' })
      .ball([0.22, 0.24, 0.22], [0, 0.15, 0], { color: '#d8e8c0', name: 'egg' })
      .dome([0.17, 0.09, 0.17], [0, 0.245, 0], { color: '#d8e8c0', name: 'shell', parent: 'egg', piece: true })
      .rod([-0.03, 0.22, 0.1], [0.0, 0.19, 0.105], 0.008, '#5a4a3a', { noInk: true })
      .rod([0.0, 0.19, 0.105], [0.025, 0.23, 0.1], 0.008, '#5a4a3a', { noInk: true });
    for (const [x, y, z] of [[0.06, 0.12, 0.09], [-0.07, 0.2, 0.07], [0.03, 0.29, 0.06], [-0.04, 0.1, 0.095], [0.08, 0.22, 0.05]] as V[]) b.ball([0.03, 0.03, 0.015], [x, y, z], { color: '#6a9a5a', noInk: true });
    return b
      .act({ click: [[A.anim('wobble', 2), A.detach('shell', 'shell'), A.say('Crack!', 1.2)], [A.reattach('shell')]] })
      .done();
  }),
  // A terracotta bowl of guacamole with tortilla chips stuck in it and a little dish of salsa; a chip dips.
  e('dip', 'food', 'sides', () => {
    const b = bowl('dip', '#c0573a', '#7fb04a', 0.18, 0.06);
    for (const [x, z, r] of [[-0.04, 0.02, 20], [0.03, 0.03, -25], [0.05, -0.02, -40]] as V[]) b.wedge([0.05, 0.065, 0.006], [x, 0.11, z], { color: '#e8c070', rot: [10, r * 2, r] });
    return b
      .wedge([0.05, 0.065, 0.006], [0.0, 0.11, -0.03], { color: '#e8c070', rot: [10, 10, 5], name: 'chip', piece: true })
      .cyl([0.07, 0.03, 0.07], [0.13, 0.015, 0.06], { color: 'white', taper: 1.3 })
      .ball([0.075, 0.025, 0.075], [0.13, 0.03, 0.06], { color: 'tomato' })
      .act({ click: [A.pose('chip', { move: [0, 0.08, 0.02], dur: 0.3 }), A.say('Crunch!', 1), A.pose('chip', { move: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A framed diploma with its gold seal and ribbon, a rolled-up one tied in red; it is presented with a sparkle.
  e('diploma', 'study', 'documents', () =>
    m('diploma', { edge: 'sharp' })
      .box([0.3, 0.24, 0.025], [0, 0.15, 0], { color: 'darkwood', round: 0.2 })
      .box([0.26, 0.2, 0.006], [0, 0.15, 0.014], { color: 'cream' })
      .label('DIPLOMA', [0.18, 0.035], [0, 0.21, 0.018], { color: 'cream', depth: 0.002 })
      .cyl([0.045, 0.008, 0.045], [0.08, 0.1, 0.019], { color: 'gold', rot: [90, 0, 0] })
      .rod([0.075, 0.08, 0.02], [0.065, 0.055, 0.02], 0.012, 'red')
      .rod([-0.08, 0.13, 0.018], [0.02, 0.13, 0.018], 0.005, '#7a5a3a', { noInk: true })
      .rod([0, 0.2, -0.012], [0, 0, -0.1], 0.02, 'darkwood')
      .capsule([0.04, 0.24, 0.04], [0, 0.02, 0.08], { color: 'white', rot: [0, 0, 90], name: 'scroll', piece: true, edge: 'soft' })
      .torus([0.045, 0.045, 0.012], [0.02, 0.02, 0.08], { color: 'red', rot: [0, 90, 0], parent: 'scroll' })
      .act({ click: [A.pose('scroll', { move: [0, 0.12, 0.04], rot: [0, 0, 20], dur: 0.4 }), A.effect('sparkle', { dur: 1.5 }), A.wait(1), A.pose('scroll', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // An engine-oil dipstick in its tube on the corner of an engine block: yellow loop handle; pull it out to check
  // the oil and push it back.
  e('dipstick', 'garage', 'car parts', () =>
    m('dipstick', { edge: 'sharp' })
      .box([0.3, 0.14, 0.2], [0.06, 0.07, -0.02], { color: '#4a4f57', round: 0.15 })
      .box([0.2, 0.05, 0.16], [0.08, 0.165, -0.02], { color: '#5a6068', round: 0.3 })
      .cyl([0.03, 0.28, 0.03], [-0.12, 0.14, 0.05], { color: '#2a2a2a' })
      .stick([-0.12, 0.14, 0.05], [-0.12, 0.47, 0.05], 0.007, 'silver', { name: 'stick', mover: { kind: 'slide', axis: 'y', amount: 0.3 } })
      .cyl([0.0085, 0.04, 0.0085], [-0.12, 0.17, 0.05], { color: '#8a5a1a', parent: 'stick' })
      .torus([0.06, 0.05, 0.012], [-0.12, 0.5, 0.05], { color: 'yellow', parent: 'stick' })
      .act({ click: [A.operate('stick', 'out'), A.say('Oil looks good.', 1.5), A.wait(1), A.operate('stick', 'in')] })
      .done(),
  ),
  // A mound of dark garden soil with a pebble, a worm and a sprout that grows when clicked.
  e('dirt', 'nature', 'ground', () =>
    m('dirt')
      .ball([0.3, 0.1, 0.25], [0, 0.03, 0], { color: '#6b4a2b' })
      .ball([0.14, 0.07, 0.12], [-0.05, 0.06, 0.02], { color: '#5a3a1e' })
      .ball(0.025, [0.08, 0.06, 0.07], { color: 'gray' })
      .ball(0.018, [-0.1, 0.045, 0.08], { color: 'rock' })
      .rod([0.04, 0.07, 0.05], [0.1, 0.06, 0.02], 0.012, 'pink')
      .stick([-0.03, 0.08, 0.0], [-0.03, 0.12, 0.0], 0.006, 'leaf', { name: 'sprout', pivot: [-0.03, 0.08, 0], piece: true })
      .ball([0.025, 0.008, 0.012], [-0.04, 0.125, 0], { color: 'leaf', parent: 'sprout' })
      .ball([0.025, 0.008, 0.012], [-0.018, 0.125, 0], { color: 'leaf', parent: 'sprout' })
      .act({ click: [[A.pose('sprout', { scale: 2, dur: 0.8 }), A.effect('sparkle', { dur: 1 })], [A.pose('sprout', { scale: 1, dur: 0.6 })]] })
      .done(),
  ),
  // A motocross bike at real size (2.15 m long, seat 0.95 m): knobbly tyres on spoked wheels, long silver forks, a
  // high front fender and number plate, an orange tank and shroud, a flat black seat, a high exhaust. It revs, then
  // pops a wheelie.
  e('dirt bike', 'garage', 'motorbikes', () => {
    const b = m('dirt bike', { view: 'side', edge: 'sharp' })
      .box([0.12, 0.08, 0.6], [0, 0.62, -0.1], { color: '#2a2a2a', name: 'bike', pivot: [0, 0, -0.72] })
      .box([0.26, 0.3, 0.36], [0, 0.48, 0.0], { color: '#555555', round: 0.3, parent: 'bike' })
      .box([0.28, 0.2, 0.46], [0, 0.85, 0.15], { color: '#f26a1b', round: 0.5, parent: 'bike' })
      .box([0.24, 0.07, 0.65], [0, 0.95, -0.3], { color: '#1e1e1e', round: 0.5, parent: 'bike' })
      .box([0.2, 0.05, 0.5], [0, 0.88, -0.78], { color: '#f26a1b', round: 0.5, rot: [18, 0, 0], parent: 'bike' })
      .box([0.17, 0.04, 0.42], [0, 0.82, 0.86], { color: '#f26a1b', round: 0.5, rot: [-12, 0, 0], parent: 'bike' })
      .box([0.24, 0.2, 0.03], [0, 1.0, 0.57], { color: 'white', round: 0.3, rot: [-20, 0, 0], parent: 'bike' })
      .label('7', [0.12, 0.12], [0, 1.0, 0.59], { color: 'white', rot: [-20, 0, 0], parent: 'bike', depth: 0.01 })
      .rod([0, 1.12, 0.48], [0, 0.36, 0.74], 0.055, 'silver', { parent: 'bike' })
      .rod([-0.34, 1.16, 0.44], [0.34, 1.16, 0.44], 0.03, '#222222', { parent: 'bike' })
      .rod([0, 0.5, -0.1], [0.0, 0.36, -0.72], 0.06, '#3a3633', { parent: 'bike' })
      .rod([0.16, 0.55, 0.05], [0.18, 0.8, -0.6], 0.07, 'silver', { parent: 'bike' })
      .cyl([0.08, 0.2, 0.08], [0.18, 0.82, -0.72], { color: '#3a3633', rot: [80, 0, 0], parent: 'bike' });
    for (const [z, d, nm] of [[0.74, 0.72, 'wheelF'], [-0.72, 0.68, 'wheelR']] as Array<[number, number, string]>) {
      b.cyl([d, 0.1, d], [0, d / 2, z], { color: 'rubber', rot: [0, 0, 90], name: nm, parent: 'bike', edge: 'soft' })
        .torus([d * 0.72, d * 0.72, 0.02], [0, d / 2, z], { color: 'silver', rot: [0, 90, 0], parent: nm });
      b.each(6, (i) => b.box([0.012, d * 0.7, 0.012], [0, d / 2, z], { color: '#aaaaaa', rot: [i * 30, 0, 0], parent: nm }));
      b.each(14, (i) => b.box([0.1, 0.02, 0.024], [0, d / 2 + Math.cos((i * Math.PI) / 7) * d * 0.49, z + Math.sin((i * Math.PI) / 7) * d * 0.49], { color: '#1a1a1a', rot: [(-i * 180) / 7, 0, 0], parent: nm }));
    }
    return b
      .socket('seat', [0, 0.98, -0.25], 'seat')
      .act({
        click: [
          [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('Vroom vroom!', 1.5))],
          [A.pose('bike', { rot: [-22, 0, 0], dur: 0.5 }), A.say('Wheelie!', 1.2), A.wait(0.8), A.pose('bike', { rot: [0, 0, 0], dur: 0.4 }), A.effect('dust', { dur: 1 })],
        ],
      })
      .done();
  }),
  // A mirror ball on a little motor stand, covered in silver tiles; it turns and throws sparkles.
  e('disco ball', 'toys', 'party', () => {
    const b = m('disco ball')
      .cyl([0.16, 0.04, 0.16], [0, 0.02, 0], { color: '#2a2a2a', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 0.12, 0], 0.02, 'silver', { edge: 'sharp' })
      .ball(0.26, [0, 0.25, 0], { color: '#c8ccd2', name: 'rotor' });
    for (const [lat, n] of [[0, 12], [0.45, 10], [-0.45, 10], [0.9, 6], [-0.9, 6]] as Array<[number, number]>)
      around(n, 0.13 * Math.cos(lat), lat).forEach(([x, z], i) => {
        const lit = i % 3 === 0 ? { glow: true, name: `beam${n}_${Math.round(lat * 10)}_${i}`, mover: { kind: 'light' as const } } : {};
        b.box([0.035, 0.035, 0.006], [x, 0.25 + 0.13 * Math.sin(lat), z], { color: i % 3 ? 'white' : '#bfefff', rot: [(-lat * 180) / Math.PI, (Math.atan2(x, z) * 180) / Math.PI, 0], parent: 'rotor', edge: 'sharp', ...lit });
      });
    return b
      .act({ click: [[A.operate('beam', 'on'), A.par(A.effect('sparkle', { dur: 2.5 }), A.say('Groovy!', 1.5))], [A.operate('beam', 'off'), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A real discus (22 cm) on edge in a holder: a steel rim and hub on a rubber disc; it is thrown, spinning.
  e('discus', 'sports', 'athletics', () =>
    m('discus')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: '#3a3633', round: 0.3, edge: 'sharp' })
      .ball([0.22, 0.22, 0.045], [0, 0.125, 0], { color: '#2a5bd7' })
      .torus([0.22, 0.22, 0.02], [0, 0.125, 0], { color: 'silver', tube: 0.07, edge: 'sharp' })
      .cyl([0.06, 0.05, 0.06], [0, 0.125, 0], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' })
      .act({ click: [A.anim('spin', 3), A.say('Whoosh!', 1.2)] })
      .done(),
  ),
  // A Groucho disguise on a stand: black glasses with bushy eyebrows, a big pink nose and a moustache. The eyebrows
  // waggle.
  e('disguise', 'toys', 'costumes', () => {
    const b = m('disguise')
      .cyl([0.08, 0.016, 0.08], [0, 0.008, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0, 0], [0, 0.12, 0.0], 0.012, 'darkwood', { edge: 'sharp' })
      .ball([0.042, 0.056, 0.05], [0, 0.135, 0.035], { color: '#f0a0a0' })
      .rod([-0.012, 0.162, 0.02], [0.012, 0.162, 0.02], 0.006, 'black', { edge: 'sharp' });
    b.pair((s) => {
      b.torus([0.05, 0.045, 0.008], [s * 0.037, 0.162, 0.02], { color: 'black', tube: 0.2, edge: 'sharp' });
      b.capsule([0.018, 0.05, 0.02], [s * 0.037, 0.195, 0.022], { color: 'black', rot: [0, 0, s * 80], name: s > 0 ? 'browL' : 'browR', piece: true });
      b.ball([0.05, 0.02, 0.02], [s * 0.022, 0.104, 0.045], { color: 'black', rot: [0, 0, s * -15] });
      b.rod([s * 0.062, 0.162, 0.02], [s * 0.066, 0.162, -0.06], 0.006, 'black', { edge: 'sharp' });
    });
    const up = (y: number) => A.par(A.pose('browL', { move: [0, y, 0], dur: 0.12 }), A.pose('browR', { move: [0, y, 0], dur: 0.12 }));
    return b.act({ click: [up(0.012), up(0), up(0.012), up(0), A.say('Ha!', 1)] }).done();
  }),
  // A built-in dishwasher (0.6 x 0.85 m): stainless front with a bar handle, a control strip with lights, and a door
  // hinged at the bottom that drops open on racks of plates, letting out steam.
  e('dishwasher', 'kitchen', 'appliances', () => {
    const b = m('dishwasher', { edge: 'sharp' })
      .box([0.6, 0.85, 0.58], [0, 0.425, -0.02], { color: '#cfd4d8', round: 0.05 })
      .box([0.56, 0.7, 0.5], [0, 0.42, -0.02], { color: '#8a9096' })
      .box([0.6, 0.1, 0.03], [0, 0.8, 0.28], { color: '#333333' })
      .box([0.1, 0.03, 0.01], [0.18, 0.8, 0.297], { color: 'lime', glow: true, name: 'panel', mover: { kind: 'light' } })
      .box([0.6, 0.06, 0.03], [0, 0.03, 0.28], { color: '#333333' })
      .box([0.6, 0.68, 0.04], [0, 0.4, 0.28], { color: 'silver', round: 0.08, name: 'door', pivot: [0, 0.06, 0.28], mover: { kind: 'swing', axis: 'x', amount: 85 } })
      .box([0.45, 0.03, 0.04], [0, 0.7, 0.32], { color: '#555555', round: 0.5, parent: 'door' });
    b.each(6, (i) => b.cyl([0.2, 0.012, 0.2], [-0.2 + i * 0.08, 0.32, -0.02], { color: 'white', rot: [90, 0, 0] }));
    b.each(5, (i) => b.cyl([0.07, 0.1, 0.07], [-0.2 + i * 0.1, 0.62, -0.02], { color: GLASS, taper: 1.2 }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.effect('steam', { dur: 2 }), A.wait(2), A.operate('door', 'close')],
          [A.operate('panel', 'on'), A.say('Swish... swoosh...', 2.5), A.wait(2), A.operate('panel', 'off'), A.say('Beep!', 1)],
        ],
      })
      .done();
  }),
  // A trigger spray bottle of disinfectant with a label; psst psst.
  e('disinfectant', 'home', 'cleaning', () =>
    m('disinfectant')
      .box([0.08, 0.16, 0.05], [0, 0.08, 0], { color: 'white', round: 0.6 })
      .cyl([0.03, 0.03, 0.03], [0, 0.175, 0], { color: 'white' })
      .box([0.04, 0.04, 0.07], [0, 0.205, 0.012], { color: '#2a8fd8', round: 0.4, edge: 'sharp' })
      .box([0.014, 0.035, 0.012], [0, 0.17, 0.035], { color: '#2a8fd8', round: 0.3, name: 'trigger', pivot: [0, 0.19, 0.035], edge: 'sharp' })
      .label('CLEAN', [0.065, 0.05], [0, 0.08, 0.026], { color: '#2a8fd8', depth: 0.002 })
      .act({ click: [A.pose('trigger', { rot: [-20, 0, 0], dur: 0.1 }), A.pose('trigger', { rot: [0, 0, 0], dur: 0.1 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Psst psst!', 1.2))] })
      .done(),
  ),
  // A museum display case: a wooden plinth cabinet under a tall glass box with a brass frame, a gold trophy, a blue
  // vase and a crown inside, a light in the top and a glass door that opens.
  e('display case', 'home', 'cabinets', () => {
    const b = m('display case', { edge: 'sharp' })
      .box([1.0, 0.8, 0.5], [0, 0.4, 0], { color: 'darkwood', round: 0.05 })
      .box([1.04, 0.08, 0.54], [0, 1.75, 0], { color: 'darkwood', round: 0.1 })
      .box([0.96, 0.9, 0.02], [0, 1.25, -0.23], { color: '#cfe8f0' })
      .box([0.94, 0.02, 0.44], [0, 1.25, 0], { color: GLASS })
      .box([0.6, 0.03, 0.02], [0, 1.69, 0.1], { color: '#fff6c8', glow: true, name: 'light', mover: { kind: 'light' } })
      .cyl([0.1, 0.03, 0.1], [-0.25, 0.815, 0], { color: 'gold' })
      .stick([-0.25, 0.83, 0], [-0.25, 0.95, 0], 0.03, 'gold')
      .cyl([0.14, 0.14, 0.14], [-0.25, 1.02, 0], { color: 'gold', taper: 1.4 })
      .ball([0.14, 0.22, 0.14], [0.22, 1.38, 0], { color: 'blue', edge: 'soft' })
      .cyl([0.16, 0.08, 0.16], [0.22, 0.85, 0], { color: 'gold' })
      .box([0.94, 0.88, 0.02], [0, 1.25, 0.24], { color: GLASS, name: 'door', pivot: [-0.47, 1.25, 0.24], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([0.02, 0.1, 0.03], [0.4, 1.25, 0.26], { color: 'brass', parent: 'door' });
    for (const [x, z] of [[0.49, 0.24], [-0.49, 0.24], [0.49, -0.24], [-0.49, -0.24]]) b.box([0.03, 0.92, 0.03], [x, 1.25, z], { color: 'brass' });
    b.box([0.12, 0.03, 0.04], [0, 0.5, 0.26], { color: 'brass' });
    return b
      .act({ click: [[A.operate('light', 'on'), A.effect('sparkle', { dur: 1.5 })], [A.operate('door', 'open'), A.wait(1.8), A.operate('door', 'close'), A.operate('light', 'off')]] })
      .done();
  }),
  // A four-panel folding screen (1.8 m) in dark wood frames with painted cherry-blossom panels, standing in a
  // zigzag; the end panels fold in and out on their hinges. (The vocabulary gives 0.3 m but its tags say room
  // dividers, which stand about 1.8 m tall, so the height warning stays.)
  e('dividers', 'home', 'decor', () => {
    const W = 0.48, H = 1.75, ang = [28, -28, 28, -28];
    const b = m('dividers', { edge: 'sharp' });
    let h: V = [0, 0, 0];
    const pts: V[] = [h];
    for (const a of ang) {
      const r = (a * Math.PI) / 180;
      h = [h[0] + W * Math.cos(r), 0, h[2] - W * Math.sin(r)];
      pts.push(h);
    }
    const cx = h[0] / 2, cz = h[2] / 2;
    ang.forEach((a, i) => {
      const [x0, , z0] = pts[i], [x1, , z1] = pts[i + 1];
      const c: V = [(x0 + x1) / 2 - cx, H / 2 + 0.06, (z0 + z1) / 2 - cz];
      const nm = `panel${i}`;
      const o = i === 0 || i === 3 ? { name: nm, pivot: (i === 0 ? [x1 - cx, H / 2, z1 - cz] : [x0 - cx, H / 2, z0 - cz]) as V } : { name: nm };
      b.box([W - 0.02, H, 0.04], c, { color: 'darkwood', round: 0.1, rot: [0, a, 0], ...o });
      b.box([W - 0.1, H - 0.2, 0.045], c, { color: i % 2 ? '#f2e8d0' : '#f6efe0', rot: [0, a, 0], parent: nm });
      b.ball([0.12, 0.12, 0.05], [c[0], c[1] + 0.25, c[2]], { color: 'pink', rot: [0, a, 0], parent: nm, noInk: true });
      b.ball([0.08, 0.08, 0.05], [c[0] + 0.05, c[1] + 0.05, c[2]], { color: '#f6a8c0', rot: [0, a, 0], parent: nm, noInk: true });
      b.box([0.12, 0.1, 0.12], [c[0], 0.05, c[2]], { color: 'darkwood', round: 0.3, rot: [0, a, 0], parent: nm });
    });
    return b
      .act({ click: [A.par(A.pose('panel0', { rot: [0, 50, 0], dur: 0.6 }), A.pose('panel3', { rot: [0, 50, 0], dur: 0.6 })), A.say('Creak.', 1), A.wait(1), A.par(A.pose('panel0', { rot: [0, 0, 0], dur: 0.6 }), A.pose('panel3', { rot: [0, 0, 0], dur: 0.6 }))] })
      .done();
  }),
  // A 3 m springboard at the end of a pool: a ladder up a tiled stand, a long white board on a yellow fulcrum, the
  // water below. It bounces: boing, splash.
  e('diving board', 'sports', 'swimming', () => {
    const b = m('diving board', { view: 'side', edge: 'sharp' })
      .box([3, 0.3, 2], [0, 0.15, -1.6], { color: '#d8d4cc' })
      .box([3.2, 0.25, 5], [0, 0.125, 2.0], { color: '#8ab8d0' })
      .box([3, 0.12, 4.8], [0, 0.26, 2.0], { color: 'water', edge: 'soft' })
      .box([0.7, 2.7, 0.7], [0, 1.65, -1.5], { color: '#4a90d9', round: 0.1 })
      .box([1.0, 0.12, 1.0], [0, 3.05, -1.5], { color: '#dddddd' })
      .box([0.5, 0.08, 4.8], [0, 3.15, 0.85], { color: 'white', round: 0.5, name: 'board', pivot: [0, 3.15, -1.45] })
      .box([0.42, 0.01, 4.4], [0, 3.195, 0.9], { color: '#5ab0e0', parent: 'board', noInk: true })
      .cyl([0.14, 0.62, 0.14], [0, 3.05, -0.4], { color: '#f2c14e', rot: [0, 0, 90] });
    b.pair((s) => {
      b.stick([s * 0.32, 0.3, -2.3], [s * 0.32, 3.6, -1.95], 0.05, 'silver');
      b.rod([s * 0.42, 3.15, -1.85], [s * 0.42, 3.75, -1.0], 0.05, 'silver');
    });
    b.each(8, (i) => b.stick([-0.32, 0.65 + i * 0.37, -2.26 + i * 0.04], [0.32, 0.65 + i * 0.37, -2.26 + i * 0.04], 0.04, 'silver'));
    const bob = (r: number, t: number) => A.pose('board', { rot: [r, 0, 0], dur: t });
    return b.act({ click: [bob(4, 0.2), bob(-3, 0.25), bob(2, 0.2), bob(0, 0.2), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Boing! Splash!', 1.5))] }).done();
  }),
  // A no-entry sign: a red disc with a white bar, on a post. It rattles.
  e('do not enter sign', 'ideas', 'road signs', () =>
    sign('do not enter sign', 'round', 'red', 0.75, 'white')
      .box([0.5, 0.12, 0.01], [0, 2.1, 0.035], { color: 'white', round: 0.2, parent: 'sign' })
      .act({ click: RATTLE('Clang!') })
      .done(),
  ),
  // A wooden dock running out over the water on pilings: plank deck, mooring cleats, coiled rope, a life ring, a
  // lamp post, and a little rowboat tied up that bobs.
  e('dock', 'places', 'waterfront', () => {
    const b = m('dock', { edge: 'sharp' })
      .box([7, 0.3, 9], [0, 0.15, 0], { color: 'water', edge: 'soft' })
      .box([2.2, 0.15, 8], [0, 1.0, -0.5], { color: 'wood' });
    b.each(16, (i) => b.box([2.2, 0.01, 0.02], [0, 1.08, -4.4 + i * 0.5], { color: 'darkwood', noInk: true }));
    for (const z of [-4.2, -1.5, 1.2, 3.4]) b.pair((s) => b.cyl([0.25, 1.4, 0.25], [s * 1.0, 0.7, z], { color: 'darkwood', edge: 'soft' }));
    b.pair((s) => b.box([0.25, 0.08, 0.1], [s * 0.95, 1.12, 2.5], { color: 'iron', round: 0.3 }));
    b.torus([0.35, 0.35, 0.1], [-0.6, 1.12, 1.0], { color: 'tan', rot: [90, 0, 0], tube: 0.3, edge: 'soft' })
      .torus([0.6, 0.6, 0.12], [-1.12, 1.6, -1.5], { color: '#e8413a', rot: [0, 90, 0], tube: 0.3, edge: 'soft' })
      .box([0.1, 1.0, 0.1], [-1.05, 1.5, -1.5], { color: 'darkwood' })
      .stick([1.0, 1.08, -3.5], [1.0, 3.2, -3.5], 0.08, '#2a2726')
      .ball(0.28, [1.0, 3.3, -3.5], { color: '#fff2a0', glow: true, name: 'lamp', mover: { kind: 'light' }, edge: 'soft' })
      .loft([1.3, 0.8, 3.4], [2.3, 0.45, 1.2], [[0, 0.75, 0.8, 0.1], [0.4, 1, 1, 0], [0.85, 0.75, 1, 0], [1, 0.1, 0.9, 0.08]], { color: '#c0392b', cut: 'bottom', boxy: 0.3, name: 'boat', edge: 'soft' })
      .box([1.1, 0.06, 0.3], [2.3, 0.62, 1.0], { color: 'lightwood', parent: 'boat' })
      .box([1.1, 0.06, 0.3], [2.3, 0.62, 1.8], { color: 'lightwood', parent: 'boat' })
      .rod([2.3, 0.7, 2.6], [1.0, 1.15, 2.5], 0.03, 'tan');
    return b
      .act({
        click: [
          [A.pose('boat', { move: [0, 0.12, 0], rot: [0, 0, 5], dur: 0.6 }), A.pose('boat', { move: [0, -0.05, 0], rot: [0, 0, -4], dur: 0.7 }), A.pose('boat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 }), A.say('Splish, splosh.', 1.5)],
          [A.operate('lamp'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A stainless dog bowl full of kibble with DOG on the side; a hungry dog trots up to it, crunches and wags off.
  e('dog bowl', 'pets', 'pet supplies', () => {
    const b = bowl('dog bowl', 'silver', '#8a5a2b', 0.2, 0.07);
    b.each(8, (i) => b.ball(0.02, [Math.cos(i) * 0.045, 0.098, Math.sin(i) * 0.045], { color: '#6b4423' }));
    return b
      .label('DOG', [0.07, 0.03], [0, 0.035, 0.088], { color: 'red', rot: [-15, 0, 0], depth: 0.004 })
      .act({ click: [A.spawn('d', 'dog', { rel: 'right', of: 'self', dist: 'near' }), A.move('d', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), A.par(A.say('Crunch crunch!', 1.5, 'd'), A.anim('wag', 2, 'd')), A.remove('d', 'fade')] })
      .done();
  }),
  // A red dog collar: buckle, studs and a gold tag on a ring that jingles.
  e('dog collar', 'pets', 'pet supplies', () => {
    const b = m('dog collar')
      .torus([0.13, 0.13, 0.026], [0, 0.105, 0], { color: 'red', tube: 0.16 })
      .box([0.03, 0.03, 0.032], [0, 0.165, 0], { color: 'silver', round: 0.3, edge: 'sharp' })
      .torus([0.016, 0.016, 0.004], [0, 0.036, 0.016], { color: 'silver', edge: 'sharp' })
      .cyl([0.032, 0.004, 0.032], [0, 0.017, 0.02], { color: 'gold', rot: [90, 0, 0], name: 'tag', pivot: [0, 0.032, 0.02], edge: 'sharp' });
    b.each(6, (i) => {
      const a = 0.6 + i * 0.75;
      b.ball(0.01, [Math.cos(a) * 0.056, 0.105 + Math.sin(a) * 0.056, 0.014], { color: 'silver' });
    });
    return b.act({ click: [A.pose('tag', { rot: [0, 0, 30], dur: 0.15 }), A.pose('tag', { rot: [0, 0, -25], dur: 0.2 }), A.pose('tag', { rot: [0, 0, 0], dur: 0.15 }), A.say('Jingle!', 1)] }).done();
  }),
  // A costume headband with floppy brown dog ears lined in pink; the ears flop.
  e('dog ears', 'toys', 'costumes', () => {
    const b = m('dog ears');
    for (let i = 0; i < 6; i++) {
      const t0 = (i * Math.PI) / 6, t1 = ((i + 1) * Math.PI) / 6;
      b.rod([0.08 * Math.cos(t0), 0.01 + 0.15 * Math.sin(t0), 0], [0.08 * Math.cos(t1), 0.01 + 0.15 * Math.sin(t1), 0], 0.012, 'black');
    }
    b.pair((s) => {
      const nm = s > 0 ? 'earL' : 'earR';
      b.ball([0.065, 0.13, 0.026], [s * 0.09, 0.1, 0.01], { color: 'brown', rot: [0, 0, s * 18], name: nm, pivot: [s * 0.07, 0.15, 0.01], piece: true });
      b.ball([0.035, 0.08, 0.01], [s * 0.09, 0.095, 0.022], { color: 'pink', rot: [0, 0, s * 18], parent: nm, noInk: true });
    });
    const flop = (r: number) => A.par(A.pose('earL', { rot: [0, 0, r], dur: 0.2 }), A.pose('earR', { rot: [0, 0, -r], dur: 0.2 }));
    return b.act({ click: [flop(30), flop(-10), flop(20), flop(0), A.say('Woof!', 1)] }).done();
  }),
  // A big bag of dry dog food with a happy dog on the front, a few kibbles spilled; it rustles.
  e('dog food', 'pets', 'pet supplies', () => {
    const b = m('dog food')
      .box([0.3, 0.42, 0.14], [0, 0.21, 0], { color: '#e8413a', round: 0.3 })
      .box([0.3, 0.05, 0.08], [0, 0.44, 0], { color: '#c0392b', round: 0.3 })
      .label('DOG FOOD', [0.24, 0.06], [0, 0.36, 0.072], { color: '#f2c14e', depth: 0.004 })
      .ball([0.11, 0.1, 0.012], [0, 0.18, 0.072], { color: 'tan' })
      .ball(0.022, [0, 0.165, 0.08], { color: 'black' });
    b.pair((s) => b.ball([0.04, 0.08, 0.012], [s * 0.06, 0.19, 0.075], { color: 'brown', rot: [0, 0, s * 20] }));
    b.each(6, (i) => b.ball(0.016, [-0.08 + i * 0.03, 0.008, 0.12 + (i % 2) * 0.02], { color: '#6b4423' }));
    return b.act({ click: [A.anim('wobble'), A.say('Rustle rustle!', 1.2)] }).done();
  }),
  // A fenced dog park (8 x 6 m): chain-link fence with a gate, a kennel, a jump bar, a hydrant, a bench, a sign
  // and a ball. A dog plays inside.
  e('dog run', 'places', 'parks', () => {
    const W = 8, D = 6, mesh = '#b8c0c8';
    const b = m('dog run', { edge: 'sharp' }).box([W, 0.06, D], [0, 0.03, 0], { color: 'grass', edge: 'soft' });
    b.box([W, 1.2, 0.03], [0, 0.66, -D / 2], { color: mesh }).pair((s) => b.box([0.03, 1.2, D], [s * W / 2, 0.66, 0], { color: mesh }));
    b.box([W / 2 - 0.6, 1.2, 0.03], [-W / 4 - 0.3, 0.66, D / 2], { color: mesh }).box([W / 2 - 0.6, 1.2, 0.03], [W / 4 + 0.3, 0.66, D / 2], { color: mesh });
    for (const [x, z] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2], [0, -D / 2], [-0.6, D / 2], [0.6, D / 2]]) b.stick([x, 0, z], [x, 1.3, z], 0.07, 'silver');
    b.box([1.15, 1.15, 0.04], [0, 0.66, D / 2], { color: mesh, name: 'gate', pivot: [-0.6, 0.66, D / 2], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([1.2, 0.05, 0.05], [0, 1.22, D / 2], { color: 'silver', parent: 'gate' })
      .box([1.0, 0.8, 1.1], [-2.8, 0.46, -2.0], { color: '#c0392b', round: 0.1 })
      .wedge([1.2, 0.5, 1.2], [-2.8, 1.11, -2.0], { color: '#5a3a22' })
      .box([0.45, 0.5, 0.02], [-2.8, 0.31, -1.44], { color: '#1e1a16', round: 0.4 })
      .cyl([0.3, 0.5, 0.3], [2.6, 0.3, 1.6], { color: 'red', edge: 'soft' })
      .dome([0.32, 0.2, 0.32], [2.6, 0.55, 1.6], { color: 'red', edge: 'soft' })
      .ball(0.2, [0.8, 0.16, 1.2], { color: 'yellow', edge: 'soft' })
      .stick([1.2, 0, -1.0], [1.2, 0.6, -1.0], 0.05, 'blue').stick([2.4, 0, -1.0], [2.4, 0.6, -1.0], 0.05, 'blue')
      .stick([1.2, 0.45, -1.0], [2.4, 0.45, -1.0], 0.04, 'white')
      .box([1.6, 0.06, 0.45], [-1.0, 0.45, -2.7], { color: 'wood' })
      .label('DOG PARK', [1.6, 0.4], [2.0, 1.0, D / 2 + 0.03], { color: '#2e7d4f', depth: 0.03 })
      .socket('yard', [0.2, 0.06, 0.2], 'top', { size: 4 });
    return b
      .act({
        setup: [A.spawn('d', 'dog'), A.attach('d', 'self', 'yard')],
        click: [
          [A.operate('gate', 'open'), A.say('Creak!', 1), A.wait(2), A.operate('gate', 'close')],
          [A.par(A.anim('hop', 2, 'self.yard'), A.say('Woof woof!', 1.5, 'self.yard'))],
        ],
      })
      .done();
  }),
  // A bone-shaped brass pet tag engraved REX on a split ring; it jingles and shines.
  e('dog tag', 'pets', 'pet supplies', () => {
    const b = m('dog tag', { edge: 'sharp' })
      .box([0.035, 0.014, 0.003], [0, 0.018, 0], { color: 'gold', round: 0.4, name: 'tag', pivot: [0, 0.032, 0] })
      .torus([0.012, 0.012, 0.002], [0, 0.034, 0], { color: 'silver' })
      .label('REX', [0.022, 0.009], [0, 0.018, 0.002], { color: 'gold', parent: 'tag', depth: 0.001 });
    for (const [x, y] of [[0.018, 0.006], [0.018, -0.006], [-0.018, 0.006], [-0.018, -0.006]]) b.cyl([0.012, 0.003, 0.012], [x, 0.018 + y, 0], { color: 'gold', rot: [90, 0, 0], parent: 'tag' });
    return b.act({ click: [A.pose('tag', { rot: [0, 0, 25], dur: 0.15 }), A.pose('tag', { rot: [0, 0, -20], dur: 0.2 }), A.pose('tag', { rot: [0, 0, 0], dur: 0.15 }), A.par(A.effect('sparkle', { dur: 1 }), A.say('Jingle!', 1))] }).done();
  }),
  // A costume dog tail: a fluffy brown tail with a white tip on a belt clip; it wags.
  e('dog tail', 'toys', 'costumes', () => {
    const b = m('dog tail')
      .torus([0.3, 0.26, 0.03], [0, 0.015, 0], { color: '#222222', rot: [90, 0, 0], tube: 0.1 })
      .box([0.05, 0.04, 0.02], [0, 0.02, 0.13], { color: 'silver', round: 0.3, edge: 'sharp' })
      .ball([0.09, 0.08, 0.08], [0, 0.05, -0.13], { color: '#a0602a', name: 'tail', pivot: [0, 0.03, -0.13], piece: true });
    const pts: V[] = [[0, 0.05, -0.13], [0, 0.13, -0.18], [0.02, 0.21, -0.2], [0.05, 0.27, -0.17], [0.06, 0.3, -0.13]];
    for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], 0.07 - i * 0.012, i === 3 ? 'white' : '#a0602a', { parent: 'tail' });
    const wag = (r: number) => A.pose('tail', { rot: [0, 0, r], dur: 0.15 });
    return b.act({ click: [wag(25), wag(-25), wag(25), wag(-25), wag(0)] }).done();
  }),
  // A silver dog whistle on a red lanyard. Blow it (we cannot hear it) and a dog comes running.
  e('dog whistle', 'pets', 'pet supplies', () =>
    m('dog whistle', { edge: 'sharp' })
      .cyl([0.04, 0.008, 0.04], [0, 0.004, 0], { color: '#555555' })
      .cyl([0.012, 0.07, 0.012], [0, 0.043, 0], { color: 'silver' })
      .cyl([0.014, 0.014, 0.014], [0, 0.085, 0], { color: '#999999' })
      .box([0.006, 0.01, 0.003], [0, 0.065, 0.006], { color: '#333333' })
      .torus([0.04, 0.05, 0.004], [0.022, 0.03, -0.01], { color: 'darkred', rot: [0, 30, 0], tube: 0.12, edge: 'soft' })
      .act({ click: [A.say('(silent whistle)', 1.5), A.spawn('d', 'dog', { rel: 'right', of: 'self', dist: 'far' }), A.move('d', { rel: 'near', of: 'self', dist: 'close' }, { speed: 'run' }), A.par(A.anim('wag', 2, 'd'), A.say('Woof!', 1.2, 'd')), A.remove('d', 'fade')] })
      .done(),
  ),
  // A pet door: a white frame with a smoky flap hinged at the top that swings both ways.
  e('doggie door', 'pets', 'pet supplies', () =>
    m('doggie door', { edge: 'sharp' })
      .box([0.6, 0.48, 0.05], [0, 0.24, 0], { color: '#c8a06a', round: 0.05 })
      .box([0.34, 0.4, 0.08], [0, 0.22, 0], { color: 'white', round: 0.2 })
      .box([0.26, 0.3, 0.09], [0, 0.2, 0], { color: '#1e1a16' })
      .box([0.26, 0.3, 0.012], [0, 0.2, 0.04], { color: '#6a7a8a', name: 'flap', pivot: [0, 0.35, 0.04], mover: { kind: 'swing', axis: 'x', amount: -60 } })
      .ball([0.06, 0.05, 0.004], [0, 0.17, 0.048], { color: '#c8d8e0', parent: 'flap', noInk: true })
      .act({ click: [A.operate('flap', 'open'), A.say('Flap!', 1), A.operate('flap', 'close'), A.pose('flap', { rot: [30, 0, 0], dur: 0.2 }), A.pose('flap', { rot: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A paper takeaway box with a wire handle and a little dog face on it; the flaps open on leftovers.
  e('doggy bag', 'food', 'takeout', () =>
    m('doggy bag', { edge: 'sharp' })
      .box([0.14, 0.12, 0.1], [0, 0.06, 0], { color: '#f4ece0', round: 0.1 })
      .box([0.14, 0.04, 0.05], [0, 0.135, -0.025], { color: '#ece2d2', round: 0.1, rot: [-20, 0, 0], name: 'flapB', pivot: [0, 0.12, -0.05], mover: { kind: 'swing', axis: 'x', amount: -60 } })
      .box([0.14, 0.04, 0.05], [0, 0.135, 0.025], { color: '#ece2d2', round: 0.1, rot: [20, 0, 0], name: 'flapF', pivot: [0, 0.12, 0.05], mover: { kind: 'swing', axis: 'x', amount: 60 } })
      .arc([0.12, 0.08, 0.004], [0, 0.15, 0], { color: 'silver', arc: 180 })
      .ball([0.06, 0.03, 0.06], [0, 0.11, 0], { color: '#c8872e', edge: 'soft' })
      .ball([0.05, 0.05, 0.006], [0, 0.06, 0.051], { color: '#c8a06a' })
      .ball(0.01, [0, 0.055, 0.056], { color: 'black' })
      .label('DOGGY BAG', [0.12, 0.022], [0, 0.02, 0.051], { color: '#f4ece0', depth: 0.002 })
      .act({ click: [A.operate('flap', 'open'), A.effect('steam', { dur: 1.5 }), A.say('Sniff sniff!', 1.2), A.wait(1), A.operate('flap', 'close')] })
      .done(),
  ),
  // A little doll (30 cm): blonde pigtails, pink dress and a red bow. A toy, but a person-shaped one: she waves
  // hello, and she dances.
  e('doll', 'toys', 'dolls', () =>
    withAct(who('doll', { h: 0.3, style: 'pigtails', hair: '#e8c56a', top: 'pink', skirt: 'pink', shoes: 'red', blush: 'pink', acc: [hat('bow', 'red')] }), {
      click: [
        [A.par(A.anim('wave'), A.say('Hi! Play with me!', 1.8))],
        [A.par(A.anim('dance'), A.say('La la la!', 1.5))],
      ],
    }),
  ),
  // A green dollar sign on a dark base; it spins: cha-ching.
  e('dollar sign', 'ideas', 'symbols', () => {
    const b = m('dollar sign').box([0.18, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3, edge: 'sharp' });
    const r = 0.06, top: Array<[number, number]> = [30, 90, 150, 210, 270].map((a) => [r * Math.cos((a * Math.PI) / 180), 0.23 + r * Math.sin((a * Math.PI) / 180)]);
    const bot: Array<[number, number]> = [90, 30, -30, -90, -150].map((a) => [r * Math.cos((a * Math.PI) / 180), 0.11 + r * Math.sin((a * Math.PI) / 180)]);
    const pts = [...top, ...bot.slice(1)];
    for (let i = 0; i < pts.length - 1; i++) b.rod([pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.032, 'green');
    return b.stick([0, 0.03, 0], [0, 0.32, 0], 0.02, 'green').act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.2 })), A.say('Cha-ching!', 1.2)] }).done();
  }),
  // A two-storey dollhouse (0.7 m): pink gable roof, a front that swings open on its hinge to show the furnished
  // rooms inside (bed, sofa, table, bath).
  e('dollhouse', 'toys', 'dolls', () => {
    const b = m('dollhouse', { edge: 'sharp' })
      .box([0.66, 0.03, 0.38], [0, 0.015, 0], { color: 'wood' })
      .box([0.6, 0.5, 0.03], [0, 0.28, -0.16], { color: '#fff3d0' })
      .box([0.03, 0.5, 0.34], [0.3, 0.28, 0], { color: 'white' })
      .box([0.03, 0.5, 0.34], [-0.3, 0.28, 0], { color: 'white' })
      .box([0.6, 0.03, 0.34], [0, 0.28, 0], { color: 'wood' })
      .box([0.03, 0.24, 0.32], [0.05, 0.155, 0], { color: 'white' })
      .wedge([0.72, 0.24, 0.42], [0, 0.65, 0], { color: '#e86f9a' })
      .box([0.16, 0.06, 0.2], [-0.15, 0.33, -0.04], { color: 'skyblue', round: 0.3 })
      .box([0.16, 0.03, 0.1], [-0.15, 0.37, -0.12], { color: 'white', round: 0.3 })
      .box([0.16, 0.08, 0.08], [0.17, 0.08, -0.08], { color: 'brown', round: 0.2 })
      .box([0.1, 0.06, 0.1], [-0.18, 0.06, 0.0], { color: 'red', round: 0.2 })
      .box([0.12, 0.05, 0.08], [0.17, 0.32, -0.05], { color: 'white', round: 0.5 })
      .box([0.6, 0.5, 0.02], [0, 0.28, 0.18], { color: '#f8c8d8', name: 'front', pivot: [-0.3, 0.28, 0.18], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .box([0.1, 0.17, 0.01], [0.0, 0.12, 0.192], { color: '#8a5a3a', parent: 'front' });
    for (const [x, y] of [[-0.17, 0.15], [0.17, 0.15], [-0.17, 0.4], [0.17, 0.4]]) b.box([0.1, 0.09, 0.012], [x, y, 0.192], { color: GLASS, parent: 'front' }).box([0.12, 0.015, 0.02], [x, y - 0.055, 0.195], { color: 'white', parent: 'front' });
    return b.act({ click: [A.operate('front', 'open'), A.effect('sparkle', { dur: 1.5 }), A.wait(2.5), A.operate('front', 'close')] }).done();
  }),
  // A dome: a half sphere on a ring footing, crisp at its rim; it rings like a bell when tapped.
  e('dome', 'ideas', 'shapes', () =>
    m('dome')
      .cyl([0.62, 0.04, 0.62], [0, 0.02, 0], { color: '#d8cfc0', edge: 'sharp' })
      .dome([0.6, 0.32, 0.6], [0, 0.04, 0], { color: '#7ab8d8' })
      .act({ click: [A.anim('pulse'), A.say('Bonng!', 1.2)] })
      .done(),
  ),
  // A row of real dominoes (48 mm) standing on end; tip the first and they all fall, then stand them up again.
  e('domino', 'toys', 'games', () => {
    const b = m('domino', { edge: 'sharp' });
    const n = 6, gap = 0.032;
    b.each(n, (i) => {
      const x = -0.08 + i * gap, nm = `dom${i}`;
      b.box([0.0075, 0.048, 0.024], [x, 0.024, 0], { color: '#1e1e1e', round: 0.2, name: nm, pivot: [x + 0.004, 0, 0], piece: true });
      b.box([0.008, 0.002, 0.02], [x, 0.024, 0], { color: 'white', parent: nm });
      b.ball([0.008, 0.004, 0.004], [x, 0.036, 0.005], { color: 'white', parent: nm, noInk: true });
      b.ball([0.008, 0.004, 0.004], [x, 0.012, -0.005], { color: 'white', parent: nm, noInk: true });
    });
    return b
      .act({
        click: [
          [...Array.from({ length: n }, (_, i) => A.pose(`dom${i}`, { rot: [0, 0, -(i === n - 1 ? 88 : 62)], dur: 0.15 })), A.say('Clack-clack-clack!', 1.5)],
          [A.par(...Array.from({ length: n }, (_, i) => A.pose(`dom${i}`, { rot: [0, 0, 0], dur: 0.4 })))],
        ],
      })
      .done();
  }),
  // A panelled front door in its white casing: six raised panels, brass knob at 1 m, hinges, a letter flap and a
  // knocker. It swings open; the knocker knocks.
  e('door', 'home', 'doors', () =>
    m('door', { edge: 'sharp' })
      .box([1.3, 0.04, 0.32], [0, 0.02, 0.02], { color: 'stone' })
      .box([0.18, 2.2, 0.18], [0.56, 1.1, 0], { color: 'white' })
      .box([0.18, 2.2, 0.18], [-0.56, 1.1, 0], { color: 'white' })
      .box([1.32, 0.2, 0.2], [0, 2.2, 0], { color: 'white', round: 0.2 })
      .box([0.9, 2.06, 0.05], [0, 1.07, 0], { color: '#2e5a4a', round: 0.1, name: 'door', pivot: [-0.45, 1.07, 0], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.3, 0.5, 0.02], [-0.17, 1.65, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .box([0.3, 0.5, 0.02], [0.17, 1.65, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .box([0.3, 0.5, 0.02], [-0.17, 1.0, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .box([0.3, 0.5, 0.02], [0.17, 1.0, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .box([0.3, 0.4, 0.02], [-0.17, 0.35, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .box([0.3, 0.4, 0.02], [0.17, 0.35, 0.03], { color: '#386a58', round: 0.2, parent: 'door' })
      .ball(0.06, [0.36, 1.0, 0.07], { color: 'brass', parent: 'door' })
      .box([0.24, 0.06, 0.02], [0, 0.72, 0.035], { color: 'brass', parent: 'door' })
      .ball(0.02, [0, 1.55, 0.035], { color: 'brass', parent: 'door' })
      .torus([0.1, 0.1, 0.02], [0, 1.4, 0.05], { color: 'brass', parent: 'door', name: 'knocker', pivot: [0, 1.45, 0.05] })
      .box([0.03, 0.12, 0.03], [-0.44, 1.7, 0.0], { color: '#3a3633' })
      .box([0.03, 0.12, 0.03], [-0.44, 0.4, 0.0], { color: '#3a3633' })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Creak...', 1.5), A.wait(2), A.operate('door', 'close'), A.say('Thud.', 1)],
          [A.pose('knocker', { rot: [-30, 0, 0], dur: 0.15 }), A.pose('knocker', { rot: [0, 0, 0], dur: 0.1 }), A.pose('knocker', { rot: [-30, 0, 0], dur: 0.15 }), A.pose('knocker', { rot: [0, 0, 0], dur: 0.1 }), A.say('Knock knock!', 1.5)],
        ],
      })
      .done(),
  ),
  // A door frame (jamb) set in a plastered wall: side jambs and a head with mouldings, brass hinge leaves on one
  // side, the strike plate on the other, a threshold strip. Knock on it.
  e('door jam', 'home', 'doors', () =>
    m('door jam', { edge: 'sharp' })
      .box([0.6, 2.5, 0.16], [0.75, 1.25, -0.02], { color: '#e8e0d0' })
      .box([0.6, 2.5, 0.16], [-0.75, 1.25, -0.02], { color: '#e8e0d0' })
      .box([2.1, 0.35, 0.16], [0, 2.33, -0.02], { color: '#e8e0d0' })
      .box([0.12, 2.12, 0.2], [0.51, 1.06, 0], { color: 'white' })
      .box([0.12, 2.12, 0.2], [-0.51, 1.06, 0], { color: 'white' })
      .box([1.14, 0.12, 0.2], [0, 2.12, 0], { color: 'white' })
      .box([0.16, 2.2, 0.03], [0.53, 1.1, 0.1], { color: '#f4f0e8', round: 0.3 })
      .box([0.16, 2.2, 0.03], [-0.53, 1.1, 0.1], { color: '#f4f0e8', round: 0.3 })
      .box([1.22, 0.16, 0.03], [0, 2.2, 0.1], { color: '#f4f0e8', round: 0.3 })
      .box([0.9, 0.025, 0.2], [0, 0.0125, 0], { color: 'wood' })
      .box([0.012, 0.1, 0.05], [-0.45, 0.35, 0], { color: 'brass' })
      .box([0.012, 0.1, 0.05], [-0.45, 1.8, 0], { color: 'brass' })
      .box([0.012, 0.16, 0.04], [0.45, 1.0, 0], { color: 'brass' })
      .act({ click: [A.anim('shake'), A.say('Knock knock!', 1.5)] })
      .done(),
  ),
  // A brass doorknob on its round rose, a keyhole escutcheon below, set in a slice of door edge with the latch
  // showing; it turns and the latch draws back.
  e('door knob', 'home', 'doors', () =>
    m('door knob', { edge: 'sharp' })
      .box([0.16, 0.24, 0.045], [0, 0.12, 0], { color: '#8a5a3a', round: 0.1 })
      .box([0.016, 0.08, 0.03], [0.08, 0.13, 0], { color: 'brass' })
      .box([0.02, 0.03, 0.02], [0.09, 0.13, 0], { color: 'brass', round: 0.4, name: 'latch', mover: { kind: 'slide', axis: 'x', amount: -0.015 } })
      .cyl([0.06, 0.012, 0.06], [0, 0.13, 0.028], { color: 'brass', rot: [90, 0, 0] })
      .cyl([0.02, 0.03, 0.02], [0, 0.13, 0.045], { color: 'brass', rot: [90, 0, 0] })
      .ball([0.056, 0.056, 0.045], [0, 0.13, 0.075], { color: 'brass', name: 'knob', piece: true, edge: 'soft' })
      .box([0.024, 0.04, 0.006], [0, 0.07, 0.026], { color: 'brass', round: 0.5 })
      .box([0.004, 0.014, 0.004], [0, 0.068, 0.03], { color: '#1e1e1e' })
      .act({ click: [A.par(A.pose('knob', { rot: [0, 0, -60], dur: 0.3 }), A.operate('latch', 'in')), A.say('Click!', 1), A.par(A.pose('knob', { rot: [0, 0, 0], dur: 0.3 }), A.operate('latch', 'out'))] })
      .done(),
  ),
  // A doorbell: a brick panel with a brass bell push whose button glows; press it: ding-dong.
  e('doorbell', 'home', 'doors', () => {
    const b = m('doorbell', { edge: 'sharp' })
      .box([0.16, 0.2, 0.03], [0, 0.1, 0], { color: '#b5462e' })
      .box([0.06, 0.1, 0.015], [0, 0.11, 0.022], { color: 'brass', round: 0.4 })
      .cyl([0.028, 0.012, 0.028], [0, 0.105, 0.032], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: 'button', mover: { kind: 'light', on: true } })
      .label('PRESS', [0.04, 0.012], [0, 0.145, 0.031], { color: 'brass', depth: 0.002 });
    b.each(4, (i) => b.box([0.16, 0.004, 0.002], [0, 0.03 + i * 0.05, 0.016], { color: '#d8d0c0', noInk: true }));
    return b.act({ click: [A.pose('button', { move: [0, 0, -0.004], dur: 0.1 }), A.operate('button', 'off'), A.say('Ding-dong!', 1.5), A.pose('button', { move: [0, 0, 0], dur: 0.1 }), A.wait(0.8), A.operate('button', 'on')] }).done();
  }),
  // A coir doormat with a dark border and WELCOME; give it a shake and the dust flies.
  e('doormat', 'home', 'doors', () =>
    m('doormat', { edge: 'sharp' })
      .box([0.75, 0.025, 0.45], [0, 0.0125, 0], { color: '#5a3a1e', round: 0.2 })
      .box([0.66, 0.027, 0.36], [0, 0.0135, 0], { color: '#c09050', round: 0.2 })
      .label('WELCOME', [0.5, 0.13], [0, 0.028, 0], { color: '#c09050', rot: [-90, 0, 0], depth: 0.002 })
      .act({ click: [A.par(A.anim('shake'), A.effect('dust', { dur: 1.2 })), A.say('Thwap thwap!', 1.2)] })
      .done(),
  ),
  // A front doorstep: two stone steps with a coir mat on top, a pot of box hedge, and two milk bottles that clink.
  e('doorstep', 'home', 'doors', () =>
    m('doorstep', { edge: 'sharp' })
      .box([1.3, 0.16, 0.6], [0, 0.08, 0.15], { color: 'stone', round: 0.1 })
      .box([1.1, 0.16, 0.36], [0, 0.24, -0.03], { color: '#a8a39a', round: 0.1 })
      .box([0.6, 0.02, 0.22], [0, 0.33, -0.05], { color: '#8a6030', round: 0.2 })
      .cyl([0.07, 0.2, 0.07], [0.42, 0.26, 0.24], { color: 'white', taper: 0.6, name: 'milk', piece: true, edge: 'soft' })
      .cyl([0.04, 0.02, 0.04], [0.42, 0.37, 0.24], { color: 'silver', parent: 'milk' })
      .cyl([0.07, 0.2, 0.07], [0.52, 0.26, 0.28], { color: 'white', taper: 0.6, edge: 'soft' })
      .cyl([0.04, 0.02, 0.04], [0.52, 0.37, 0.28], { color: 'silver' })
      .cyl([0.22, 0.24, 0.22], [-0.45, 0.28, 0.2], { color: '#c0573a', taper: 1.25 })
      .ball(0.3, [-0.45, 0.52, 0.2], { color: '#3f7f35', edge: 'soft' })
      .act({ click: [A.pose('milk', { rot: [0, 0, 8], dur: 0.1 }), A.pose('milk', { rot: [0, 0, -6], dur: 0.12 }), A.pose('milk', { rot: [0, 0, 0], dur: 0.1 }), A.say('Clink clink!', 1.2)] })
      .done(),
  ),
  // A wedge doorstop (14 cm) in brown rubber with grip ridges; kick it in: thunk.
  e('doorstop', 'home', 'doors', () =>
    m('doorstop')
      .wedge([0.14, 0.04, 0.06], [0, 0.02, 0], { color: '#5a3a22', apex: 0.5 })
      .box([0.003, 0.016, 0.062], [0.01, 0.018, 0], { color: '#3a2414', noInk: true })
      .box([0.003, 0.012, 0.062], [-0.02, 0.012, 0], { color: '#3a2414', noInk: true })
      .box([0.003, 0.01, 0.062], [0.035, 0.008, 0], { color: '#3a2414', noInk: true })
      .act({ click: [A.anim('hop'), A.say('Thunk!', 1)] })
      .done(),
  ),
  // An arched stone doorway in a 4.2 m stretch of brick wall: a 1.1 m x 2.2 m opening (people walk through it
  // upright) with quoined stone jambs, imposts, a ring of nine voussoirs with a proud keystone, a glazed fanlight in
  // the arch, a plank door with strap hinges that swings inward, a stone sill and step, coping on the wall and a
  // lantern either side. The lanterns light, the door opens and someone comes through and waves hello.
  e('doorway', 'places', 'rooms', () => {
    const BR = '#a65a3c', ST = '#d9ccae', ST2 = '#cbbd9c', yS = 2.5, r0 = 0.55, r1 = 0.87;
    const b = m('doorway', { edge: 'sharp' });
    // brick wall either side and over the arch (its spandrels filled round the voussoirs), stone plinth and coping
    b.pair((s) => {
      b.box([1.23, 4.0, 0.4], [s * 1.485, 2.0, 0], { color: BR, round: 0.02 })
        .box([0.42, 0.37, 0.38], [s * 0.66, 3.185, 0], { color: BR, round: 0 })
        .box([0.17, 0.5, 0.38], [s * 0.785, 2.75, 0], { color: BR, round: 0 });
      b.each(9, (i) => b.box([1.2, 0.02, 0.02], [s * 1.485, 0.6 + i * 0.38, 0.205], { color: '#c9b9a6', noInk: true, round: 0 }));
    });
    b.box([1.8, 0.7, 0.4], [0, 3.65, 0], { color: BR, round: 0 })
      .box([4.3, 0.3, 0.46], [0, 0.15, 0], { color: ST2, round: 0.05 })
      .box([4.36, 0.15, 0.52], [0, 4.075, 0], { color: ST, round: 0.1 })
      .box([2.2, 0.15, 0.5], [0, 0.075, 0.45], { color: ST2, round: 0.1 });
    // quoined jambs, imposts, voussoirs and keystone
    b.pair((s) => {
      b.each(5, (i) => b.box([i % 2 ? 0.4 : 0.32, 0.43, 0.46], [s * (r0 + (i % 2 ? 0.2 : 0.16)), 0.52 + i * 0.44, 0], { color: i % 2 ? ST2 : ST, round: 0.05 }));
      b.box([0.5, 0.12, 0.5], [s * 0.74, yS + 0.02, 0], { color: ST, round: 0.1 });
    });
    for (let i = 0; i < 9; i++) {
      const a = ((i + 0.5) * Math.PI) / 9, key = i === 4, rr = key ? r1 + 0.1 : r1, mid = (r0 + rr) / 2;
      b.box([key ? 0.3 : 0.27, rr - r0, key ? 0.52 : 0.46], [Math.cos(a) * mid, yS + Math.sin(a) * mid, 0], { color: key ? ST : i % 2 ? ST2 : ST, rot: [0, 0, (a * 180) / Math.PI - 90], round: 0.05 });
    }
    // the fanlight in the arch head, and the plank door that swings in on its hinges
    b.dome([1.1, r0, 0.05], [0, yS + r0 / 2, 0], { color: '#9fc4d8' });
    for (const a of [45, 90, 135]) b.stick([0, yS, 0.03], [Math.cos((a * Math.PI) / 180) * r0, yS + Math.sin((a * Math.PI) / 180) * r0, 0.03], 0.03, '#3a3633');
    b.box([1.1, 2.2, 0.07], [0, 0.3 + 1.1, 0], { color: '#6b4226', round: 0.04, name: 'door', pivot: [-r0, 1.4, 0], mover: { kind: 'swing', axis: 'y', amount: 95 } });
    b.each(4, (i) => b.box([0.015, 2.16, 0.02], [-0.33 + i * 0.22, 1.4, 0.04], { color: '#4a2c18', parent: 'door', noInk: true, round: 0 }));
    for (const y of [0.75, 2.05]) b.box([0.6, 0.06, 0.02], [-0.22, y, 0.045], { color: '#1e1e1e', parent: 'door', round: 0.3 });
    b.torus([0.11, 0.11, 0.025], [0.36, 1.0, 0.05], { color: 'iron', parent: 'door' });
    // a lantern on a bracket either side
    b.pair((s) => {
      const x = s * 1.35, n = s > 0 ? 'lampL' : 'lampR';
      b.stick([x, 2.62, 0.2], [x, 2.62, 0.46], 0.04, '#1e1e1e')
        .box([0.22, 0.34, 0.22], [x, 2.36, 0.46], { color: '#1e1e1e', round: 0.1 })
        .box([0.15, 0.24, 0.24], [x, 2.36, 0.46], { color: '#fff1b8', glow: true, name: n, mover: { kind: 'light', on: false } })
        .pyramid([0.34, 0.14, 0.34], [x, 2.6, 0.46], 4, { color: '#1e1e1e' });
    });
    return b
      .act({ click: [A.par(A.operate('lamp', 'on'), A.operate('door', 'open')), A.spawn('p', 'man', { rel: 'behind', of: 'self', dist: 'close' }), A.move('p', { rel: 'front', of: 'self', dist: 'close' }, { speed: 'walk' }), A.par(A.anim('wave', 1, 'p'), A.say('Hello!', 1.5, 'p')), A.operate('door', 'close'), A.remove('p', 'fade'), A.operate('lamp', 'off')] })
      .done();
  }),
  // A four-storey brick dormitory: rows of windows (some lit), stone banding, a canopy over glass doors, a bike
  // rack. Doors buzz; lights go out.
  e('dormitory', 'places', 'schools', () => {
    const fz = 5;
    const b = tower('dormitory', { w: 18, d: 10, floors: 4, st: 3.1, wall: '#b5583a', trim: '#efe6d2', cols: 8, sign: 'DORM', signBg: '#1e3a5f', double: true });
    for (const [x, y, i] of [[-6.75, 4.8, 0], [2.25, 7.9, 1], [6.75, 4.8, 2], [-2.25, 11.0, 3]] as V[]) b.box([1.1, 1.5, 0.02], [x, y, fz + 0.1], { color: '#ffe9a0', glow: true, name: `light${i}`, mover: { kind: 'light', on: true } });
    b.each(6, (i) => b.arc([0.7, 0.45, 0.04], [4 + i * 0.5, 0.42, fz + 1.8], { color: 'silver', arc: 180 }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Bzzzt!', 1.2), A.wait(2), A.operate('door', 'close')],
          [A.operate('light', 'off'), A.say('Lights out!', 1.5), A.wait(1.5), A.operate('light', 'on')],
        ],
      })
      .done();
  }),
  // A red London double-decker bus at real size (11 m long, 4.4 m tall): two decks of windows with pillars, a cream
  // band between them, the destination blind, a front door that folds open by the driver, headlights, wheels on
  // axles. Ding ding!
  e('doubledecker bus', 'garage', 'buses', () => {
    const R = '#c8102e';
    const b = m('doubledecker bus', { view: 'side', edge: 'sharp' })
      .box([2.5, 2.1, 10.6], [0, 1.45, 0], { color: R, round: 0.08, name: 'body' })
      .box([2.5, 1.8, 10.6], [0, 3.45, 0], { color: R, round: 0.12 })
      .box([2.52, 0.14, 10.62], [0, 2.55, 0], { color: '#f2e8d0' })
      .box([2.52, 0.3, 10.62], [0, 0.55, 0], { color: '#2a2726', round: 0.1 })
      .box([2.3, 1.25, 0.05], [0, 1.85, 5.31], { color: DARKWIN })
      .box([2.3, 0.85, 0.05], [0, 3.55, 5.31], { color: DARKWIN })
      .label('24  LONDON', [1.9, 0.32], [0, 2.85, 5.32], { color: '#1e1e1e', depth: 0.04 })
      .box([2.4, 0.3, 0.12], [0, 0.6, 5.36], { color: '#2a2726', round: 0.2 })
      .box([0.6, 0.15, 0.03], [0, 0.85, 5.33], { color: '#f2c14e' })
      .box([0.06, 2.0, 1.05], [1.27, 1.45, 4.35], { color: DARKWIN, name: 'door', pivot: [1.27, 1.45, 4.87], mover: { kind: 'swing', axis: 'y', amount: -80 } })
      .box([0.07, 0.06, 1.0], [1.28, 1.45, 4.35], { color: 'silver', parent: 'door' });
    b.pair((s) => {
      b.box([0.04, 1.0, 8.4], [s * 1.26, 1.95, -0.85], { color: DARKWIN, noInk: true });
      b.box([0.04, 0.95, 10.1], [s * 1.26, 3.5, 0], { color: DARKWIN, noInk: true });
      b.each(7, (i) => b.box([0.06, 1.0, 0.12], [s * 1.27, 1.95, -4.9 + i * 1.3], { color: R }));
      b.each(8, (i) => b.box([0.06, 0.95, 0.12], [s * 1.27, 3.5, -4.9 + i * 1.35], { color: R }));
      b.ball([0.3, 0.24, 0.08], [s * 0.9, 0.95, 5.33], { color: '#fff6c8', glow: true, name: s > 0 ? 'headlightL' : 'headlightR', mover: { kind: 'light', on: true }, edge: 'soft' });
      b.box([0.25, 0.3, 0.06], [s * 0.95, 1.0, -5.32], { color: 'red', glow: true });
      b.rod([s * 1.2, 2.3, 5.2], [s * 1.55, 2.2, 5.0], 0.05, '#2a2726');
      b.box([0.08, 0.35, 0.22], [s * 1.58, 2.0, 5.0], { color: '#2a2726' });
    });
    b.label('SEE LONDON BY BUS', [6, 0.5], [-1.27, 2.85, -0.5], { color: '#f2e8d0', rot: [0, -90, 0], depth: 0.03 });
    let n = 1;
    for (const z of [3.6, -2.7]) b.pair((s) => wheel(b, `wheel${n++}`, s * 1.08, 0.5, z, 1.0, 0.32));
    return b
      .socket('seat', [-0.6, 1.0, 4.5], 'seat')
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding ding!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('headlight', 'off'), A.wait(0.3), A.operate('headlight', 'on'), A.wait(0.3), A.operate('headlight', 'off'), A.wait(0.3), A.operate('headlight', 'on'), A.par(A.anim('shake'), A.say('Honk honk!', 1.2))],
        ],
      })
      .done();
  }),
  // A ball of bread dough on a floured board, and a rolling pin that rolls it out.
  e('dough', 'food', 'baking', () =>
    m('dough')
      .box([0.4, 0.025, 0.28], [0, 0.0125, 0], { color: 'wood', round: 0.3, edge: 'sharp' })
      .ball([0.28, 0.006, 0.18], [-0.03, 0.026, 0], { color: 'white', noInk: true })
      .ball([0.14, 0.08, 0.13], [-0.05, 0.06, 0], { color: '#f2dfb0' })
      .cyl([0.045, 0.22, 0.045], [0.08, 0.048, 0.08], { color: 'lightwood', rot: [0, 0, 90], name: 'pin', piece: true })
      .cyl([0.02, 0.05, 0.02], [0.215, 0.048, 0.08], { color: 'wood', rot: [0, 0, 90], parent: 'pin' })
      .cyl([0.02, 0.05, 0.02], [-0.055, 0.048, 0.08], { color: 'wood', rot: [0, 0, 90], parent: 'pin' })
      .act({ click: [A.pose('pin', { move: [0, 0, -0.08], rot: [-180, 0, 0], dur: 0.6 }), A.pose('pin', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 }), A.say('Roll, roll!', 1.2)] })
      .done(),
  ),
  // A ring doughnut with pink icing and sprinkles; someone takes a bite.
  e('doughnut', 'food', 'desserts', () => {
    const b = m('doughnut')
      .torus([0.1, 0.1, 0.04], [0, 0.05, 0], { color: '#d9a050', tube: 0.36, name: 'ring' })
      .torus([0.094, 0.094, 0.02], [0, 0.05, 0.012], { color: 'pink', tube: 0.34 });
    around(9, 0.034, 0.2).forEach(([x, y], i) => b.box([0.012, 0.004, 0.004], [x, 0.05 + y, 0.024], { color: COLS[i % COLS.length], rot: [0, 0, i * 40], noInk: true }));
    return b
      .ball([0.034, 0.034, 0.042], [0.0, 0.088, 0.004], { color: '#d9a050', name: 'bite', parent: 'ring', piece: true })
      .ball([0.03, 0.02, 0.02], [0.0, 0.092, 0.018], { color: 'pink', parent: 'bite' })
      .act({ click: [[A.detach('bite', 'bite'), A.say('Nom!', 1)], [A.reattach('bite')]] })
      .done();
  }),
  // A Chinese dragon kite flying 2.5 m up on its string from a reel staked in the grass: a red-and-gold head with
  // whiskers and horns, a long tail of discs. It swoops in the wind.
  e('dragon kite', 'sky', 'kites', () => {
    const b = m('dragon kite')
      .cyl([0.12, 0.1, 0.12], [-0.6, 0.05, 0.3], { color: 'wood', edge: 'sharp' })
      .stick([-0.6, 0, 0.3], [-0.6, 0.15, 0.3], 0.02, 'darkwood')
      .rod([-0.6, 0.12, 0.3], [0, 2.3, 0], 0.006, 'white', { noInk: true })
      .ball([0.36, 0.3, 0.3], [0, 2.4, 0], { color: 'red', name: 'kite', pivot: [0, 2.3, 0] })
      .box([0.24, 0.14, 0.22], [0, 2.34, 0.2], { color: 'red', round: 0.5, parent: 'kite' })
      .cone([0.06, 0.18, 0.06], [-0.1, 2.6, -0.02], { color: 'gold', rot: [0, 0, 25], parent: 'kite' })
      .cone([0.06, 0.18, 0.06], [0.1, 2.6, -0.02], { color: 'gold', rot: [0, 0, -25], parent: 'kite' });
    b.pair((s) => b.ball(0.07, [s * 0.09, 2.48, 0.12], { color: 'yellow', parent: 'kite' }).rod([s * 0.08, 2.33, 0.3], [s * 0.3, 2.26, 0.34], 0.012, 'gold', { parent: 'kite' }));
    b.each(9, (i) => b.cyl([0.28 - i * 0.02, 0.04, 0.28 - i * 0.02], [Math.sin(i * 1.0) * 0.18, 2.18 - i * 0.18, -0.05 * i], { color: i % 2 ? 'gold' : 'red', rot: [90, 0, 0], parent: 'kite' }));
    const sway = (r: number, t: number) => A.pose('kite', { rot: [0, 0, r], dur: t });
    return b.act({ click: [sway(18, 0.5), sway(-15, 0.7), sway(10, 0.6), sway(0, 0.4), A.say('Whoosh!', 1.2)] }).done();
  }),
  // A pink dragonfruit with green-tipped scales and a halved one, white flesh dotted with black seeds.
  e('dragonfruit', 'food', 'fruit', () => {
    const pk = '#e8407a';
    const b = m('dragonfruit')
      .ball([0.09, 0.12, 0.09], [-0.04, 0.06, -0.01], { color: pk, name: 'fruit' })
      .cone([0.03, 0.04, 0.02], [-0.04, 0.13, -0.01], { color: 'lime', parent: 'fruit' })
      .ball([0.09, 0.11, 0.05], [0.06, 0.055, 0.02], { color: pk, name: 'half', parent: 'fruit', piece: true })
      .ball([0.075, 0.095, 0.01], [0.06, 0.055, 0.044], { color: 'white', parent: 'half' });
    around(5, 0.046, 0.3).forEach(([x, z]) => b.cone([0.025, 0.04, 0.012], [-0.04 + x, 0.07, -0.01 + z], { color: 'lime', rot: [z * 900, 0, -x * 900], parent: 'fruit' }));
    b.each(8, (i) => b.ball(0.006, [0.04 + (i % 3) * 0.02, 0.025 + Math.floor(i / 3) * 0.025 + (i % 2) * 0.008, 0.05], { color: 'black', noInk: true, parent: 'half' }));
    return b.act({ click: [[A.detach('half', 'half'), A.say('Juicy!', 1)], [A.reattach('half')]] }).done();
  }),
  // A bathroom basin drain at real size with its plumbing on show (1.1 m with the wall; the vocabulary's 0.15 m is the
  // drain fitting alone, which cannot read without its basin and trap): a white basin hung on a tiled wall section at
  // 0.84 m, water standing in it over the chrome drain flange and its rubber plug on a ball chain, a pillar tap, and
  // under it the chrome tailpiece, the P-trap U and the trap arm running back into the wall. Pull the plug and the
  // water swirls away; put it back and it refills.
  e('drain', 'home', 'bathroom', () => {
    const plan: Array<[number, number, number, number]> = [[0, 0.75, 0.8, 0], [0.15, 0.97, 0.97, 0], [0.5, 1, 1, 0], [0.85, 0.97, 0.97, 0], [1, 0.75, 0.8, 0]];
    const C = 'silver';
    const b = m('drain', { edge: 'sharp' })
      .box([0.7, 0.012, 0.5], [0, 0.006, 0.02], { color: '#9aa3a8', round: 0.3 })
      .box([0.7, 1.088, 0.06], [0, 0.556, -0.25], { color: '#e6eef0', round: 0.05 });
    for (const y of [0.212, 0.412, 0.612, 0.812, 1.012]) b.box([0.7, 0.005, 0.004], [0, y, -0.219], { color: '#b8c2c6', round: 0, noInk: true });
    for (const x of [-0.2, 0, 0.2]) b.box([0.005, 1.088, 0.004], [x, 0.556, -0.219], { color: '#b8c2c6', round: 0, noInk: true });
    // the basin on its two brackets: a white bowl, its pale inside, the standing water and the drain in it
    b.pair((s) => b.box([0.025, 0.1, 0.16], [s * 0.15, 0.66, -0.14], { color: '#c8cdd0', round: 0.2 }));
    b.loft([0.5, 0.36, 0.4], [0, 0.84, -0.025], plan, { color: 'white', boxy: 0.4, cut: 'bottom', name: 'basin' })
      .loft([0.42, 0.28, 0.31], [0, 0.8415, -0.01], plan, { color: '#b9c9d1', boxy: 0.4, cut: 'bottom' })
      .loft([0.38, 0.014, 0.27], [0, 0.845, -0.01], plan, { color: '#8fcbe6', boxy: 0.4, name: 'water' })
      .torus([0.065, 0.065, 0.008], [0, 0.853, -0.01], { color: C, rot: [90, 0, 0], tube: 0.22 })
      .cyl([0.048, 0.012, 0.048], [0, 0.856, -0.01], { color: '#2a2c30', name: 'plug', parent: 'basin', piece: true })
      .torus([0.02, 0.02, 0.004], [0, 0.869, -0.01], { color: C, parent: 'plug' })
      .rod([0, 0.876, -0.01], [0.06, 0.855, -0.12], 0.004, C, { parent: 'plug', noInk: true })
      .rod([0.06, 0.855, -0.12], [0.06, 0.862, -0.19], 0.004, C, { parent: 'plug', noInk: true })
      // the pillar tap on the back deck
      .stick([0, 0.84, -0.195], [0, 0.94, -0.195], 0.034, C)
      .rod([0, 0.935, -0.195], [0, 0.925, -0.11], 0.026, C)
      .box([0.08, 0.014, 0.016], [0, 0.952, -0.195], { color: C, round: 0.5 })
      .ball(0.022, [0, 0.965, -0.195], { color: 'white' })
      // tailpiece, slip nut, the P-trap U and the trap arm into the wall
      .stick([0, 0.67, -0.01], [0, 0.5, -0.01], 0.034, C)
      .cyl([0.046, 0.018, 0.046], [0, 0.56, -0.01], { color: C })
      .arc([0.11, 0.11, 0.034], [0, 0.5, -0.048], { color: C, rot: [0, 90, 180], tube: 0.31 })
      .stick([0, 0.5, -0.086], [0, 0.55, -0.086], 0.034, C)
      .rod([0, 0.55, -0.086], [0, 0.55, -0.23], 0.034, C)
      .cyl([0.075, 0.01, 0.075], [0, 0.55, -0.217], { color: C, rot: [90, 0, 0] });
    return b
      .act({
        click: [
          [A.detach('plug', 'plug'), A.par(A.pose('water', { scale: 0.05, dur: 1.6 }), A.effect('water_spray', { dur: 1.5 }), A.say('Glug glug gurgle!', 1.8))],
          [A.reattach('plug'), A.par(A.pose('water', { scale: 1, dur: 1.2 }), A.say('Plip.', 1))],
        ],
      })
      .done();
  }),
  // A castle gatehouse with a drawbridge over the moat: stone gate piers and lintel with battlements, two round
  // towers with pointed roofs and flags, an iron portcullis in the arch, a plank bridge on chains that winches up.
  e('drawbridge', 'places', 'castles', () => {
    const st = '#a8a39a';
    const b = m('drawbridge', { edge: 'sharp' })
      .box([18, 0.3, 4], [0, 0.15, -2], { color: 'grass', edge: 'soft' })
      .box([18, 0.15, 4.4], [0, 0.07, 2.2], { color: 'water', edge: 'soft' })
      .box([18, 0.3, 3], [0, 0.15, 5.9], { color: 'grass', edge: 'soft' })
      .box([2.5, 9, 3], [-2.75, 4.5, -1.5], { color: st })
      .box([2.5, 9, 3], [2.75, 4.5, -1.5], { color: st })
      .box([3, 4.5, 3], [0, 6.75, -1.5], { color: st })
      .box([3, 4.5, 0.1], [0, 2.25, -2.95], { color: '#1e1a16' })
      .box([3, 0.1, 3], [0, 0.32, -1.5], { color: '#6a6560' })
      .box([2.9, 4.3, 0.12], [0, 2.4, -0.3], { color: '#3a3633', name: 'portcullis', mover: { kind: 'slide', axis: 'y', amount: 4.0 } });
    b.each(6, (i) => b.box([0.12, 4.3, 0.14], [-1.25 + i * 0.5, 2.4, -0.25], { color: '#2a2726', parent: 'portcullis' }));
    b.each(5, (i) => b.box([2.9, 0.12, 0.14], [0, 0.6 + i * 0.85, -0.25], { color: '#2a2726', parent: 'portcullis' }));
    b.each(6, (i) => b.box([0.9, 0.9, 3], [-3.4 + i * 1.36, 9.45, -1.5], { color: st }));
    b.box([3, 0.35, 4.3], [0, 0.55, 2.15], { color: 'wood', name: 'bridge', pivot: [0, 0.55, 0], mover: { kind: 'swing', axis: 'x', amount: -85 } });
    b.each(7, (i) => b.box([3.02, 0.02, 0.04], [0, 0.73, 0.3 + i * 0.6], { color: 'darkwood', parent: 'bridge', noInk: true }));
    b.pair((s) => {
      b.rod([s * 1.35, 4.3, 0.05], [s * 1.35, 0.75, 4.2], 0.08, 'iron', { parent: 'bridge' });
      b.cyl([3.8, 12, 3.8], [s * 5.6, 6, -1.4], { color: '#b5b0a6' });
      b.cone([4.4, 3.6, 4.4], [s * 5.6, 13.8, -1.4], { color: 'navy' });
      b.stick([s * 5.6, 15.5, -1.4], [s * 5.6, 17, -1.4], 0.08, 'darkwood');
      b.box([1.0, 0.6, 0.04], [s * 5.6 + 0.52, 16.6, -1.4], { color: '#c0392b', edge: 'soft' });
      b.each(3, (i) => b.box([0.4, 0.9, 0.1], [s * 5.6 + (i - 1) * 0.9, 4 + i * 2.5, 0.52], { color: '#1e1a16' }));
    });
    return b
      .act({
        click: [
          [A.operate('bridge'), A.say('Clank, clank, clank!', 2.5), A.wait(1.5), A.operate('bridge')],
          [A.operate('portcullis', 'up'), A.say('Creeeak!', 1.5), A.wait(2), A.operate('portcullis', 'down'), A.say('Clang!', 1)],
        ],
      })
      .done();
  }),
  // A dreamcatcher hanging from a little stand: a willow hoop wrapped in leather, a web with a bead, feathers on
  // beaded strings that sway.
  e('dreamcatcher', 'home', 'decor', () => {
    const b = m('dreamcatcher')
      .box([0.22, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .stick([0, 0.03, -0.04], [0, 0.82, -0.04], 0.018, 'darkwood', { edge: 'sharp' })
      .rod([0, 0.8, -0.04], [0, 0.8, 0.02], 0.014, 'darkwood', { edge: 'sharp' })
      .stick([0, 0.8, 0.02], [0, 0.66, 0.02], 0.004, '#8a5a2b', { name: 'hoop', pivot: [0, 0.8, 0.02] })
      .torus([0.3, 0.3, 0.035], [0, 0.51, 0.02], { color: '#c8955a', tube: 0.12, parent: 'hoop' })
      .torus([0.1, 0.1, 0.006], [0, 0.51, 0.02], { color: 'white', tube: 0.08, noInk: true, parent: 'hoop' })
      .ball(0.025, [0, 0.51, 0.024], { color: 'teal', parent: 'hoop' });
    b.each(4, (i) => {
      const a = (i * Math.PI) / 4;
      b.rod([Math.cos(a) * 0.14, 0.51 + Math.sin(a) * 0.14, 0.02], [-Math.cos(a) * 0.14, 0.51 - Math.sin(a) * 0.14, 0.02], 0.004, 'white', { noInk: true, parent: 'hoop' });
    });
    for (const [x, c] of [[-0.09, 'white'], [0, '#a0602a'], [0.09, 'white']] as Array<[number, string]>) {
      const top = 0.51 - Math.sqrt(0.15 * 0.15 - x * x);
      b.stick([x, top, 0.02], [x, 0.26, 0.02], 0.004, '#8a5a2b', { parent: 'hoop' }).ball(0.016, [x, 0.3, 0.02], { color: 'teal', parent: 'hoop' }).ball([0.045, 0.13, 0.012], [x, 0.2, 0.02], { color: c, parent: 'hoop' });
    }
    const sw = (r: number, t: number) => A.pose('hoop', { rot: [0, 0, r], dur: t });
    return b.act({ click: [sw(10, 0.4), sw(-8, 0.5), sw(4, 0.4), sw(0, 0.3), A.effect('sparkle', { dur: 1.2 })] }).done();
  }),
  // A long pink gown on a dressmaker's form: fitted bodice, a full flared skirt to the floor, a white sash with a
  // bow. It twirls, with hearts.
  e('dress', 'wardrobe', 'dresses', () => {
    const c = '#e86f9a';
    const b = dressForm('dress')
      .ball([0.37, 0.44, 0.27], [0, 1.25, 0.004], { color: c })
      .cyl([0.9, 0.98, 0.72], [0, 0.53, 0], { color: c, taper: 0.4 })
      .cyl([0.36, 0.06, 0.27], [0, 1.05, 0], { color: 'white' })
      .ball([0.1, 0.07, 0.05], [0, 1.05, 0.14], { color: 'white' });
    b.pair((s) => b.rod([s * 0.1, 1.42, 0.04], [s * 0.12, 1.52, 0], 0.03, c).ball([0.08, 0.05, 0.03], [s * 0.06, 1.03, 0.15], { color: 'white', rot: [0, 0, s * 30] }));
    return b.act({ click: [A.par(A.anim('spin'), A.effect('hearts', { dur: 1.6 }))] }).done();
  }),
  // Charcoal suit trousers hung full length from a clip hanger on a coat stand: waistband with a silver button,
  // pressed creases and slanted side pockets. They swing.
  e('dress pants', 'wardrobe', 'trousers', () => {
    const c = '#3a4050', y = 1.5, z = 0.14, p = { parent: 'hanger' };
    const b = hangStand('dress pants', y)
      .box([0.4, 0.22, 0.2], [0, y - 0.15, z], { color: c, round: 0.3, ...p })
      .box([0.41, 0.045, 0.205], [0, y - 0.05, z], { color: '#2a3040', round: 0.3, ...p })
      .box([0.05, 0.035, 0.01], [0, y - 0.05, z + 0.104], { color: 'silver', ...p });
    b.pair((s) => {
      b.cyl([0.17, 0.85, 0.16], [s * 0.1, y - 0.68, z], { color: c, taper: 1.15, ...p });
      b.rod([s * 0.1, y - 1.08, z + 0.08], [s * 0.1, y - 0.3, z + 0.095], 0.005, '#5a6070', { noInk: true, ...p });
      b.box([0.08, 0.005, 0.01], [s * 0.12, y - 0.13, z + 0.1], { color: '#2a3040', rot: [0, 0, s * -30], noInk: true, ...p });
      b.box([0.02, 0.04, 0.02], [s * 0.15, y - 0.02, z], { color: 'silver', ...p });
    });
    return b.act({ click: [A.pose('hanger', { rot: [0, 0, 12], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, -9], dur: 0.45 }), A.pose('hanger', { rot: [0, 0, 4], dur: 0.35 }), A.pose('hanger', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A chest of four drawers (1 m wide, 0.9 m tall) with brass knobs on bun feet, a mirror on top and a vase;
  // drawers slide out.
  e('dresser', 'home', 'storage', () => {
    const b = m('dresser', { edge: 'sharp' })
      .box([1.0, 0.86, 0.5], [0, 0.5, 0], { color: 'wood', round: 0.05 })
      .box([1.04, 0.04, 0.54], [0, 0.95, 0], { color: 'darkwood', round: 0.2 })
      .box([0.7, 0.7, 0.04], [0, 1.37, -0.2], { color: 'darkwood', round: 0.1 })
      .box([0.6, 0.6, 0.01], [0, 1.37, -0.175], { color: '#cfe8f0' })
      .cyl([0.08, 0.16, 0.08], [0.35, 1.05, 0.05], { color: 'blue', taper: 0.6, edge: 'soft' });
    b.each(4, (i) => {
      const nm = `drawer${i + 1}`, y = 0.19 + i * 0.205;
      b.box([0.92, 0.18, 0.02], [0, y, 0.255], { color: 'lightwood', round: 0.2, name: nm, mover: { kind: 'slide', axis: 'z', amount: 0.3 } })
        .box([0.88, 0.14, 0.42], [0, y, 0.04], { color: '#c8a87a', parent: nm });
      b.pair((s) => b.ball(0.03, [s * 0.25, y, 0.27], { color: 'brass', parent: nm }));
    });
    for (const [x, z] of [[0.44, 0.2], [-0.44, 0.2], [0.44, -0.2], [-0.44, -0.2]]) b.ball(0.08, [x, 0.04, z], { color: 'darkwood' });
    return b
      .socket('top', [-0.1, 0.97, 0.05], 'top', { size: 0.5 })
      .act({ click: [[A.operate('drawer4', 'out'), A.wait(1.5), A.operate('drawer4', 'in')], [A.operate('drawer2', 'out'), A.wait(1.5), A.operate('drawer2', 'in')]] })
      .done();
  }),
  // A cordless drill: yellow body and pistol grip, black battery pack, a trigger, a keyless chuck with a bit that
  // spins. Brrrr.
  e('drill', 'workshop', 'power tools', () =>
    m('drill', { view: 'side', edge: 'sharp' })
      .box([0.09, 0.07, 0.13], [0, 0.035, 0], { color: '#222222', round: 0.3 })
      .box([0.06, 0.16, 0.07], [0, 0.14, 0.0], { color: 'yellow', round: 0.4, rot: [-12, 0, 0] })
      .box([0.075, 0.09, 0.22], [0, 0.255, 0.03], { color: 'yellow', round: 0.4 })
      .ball([0.08, 0.09, 0.06], [0, 0.255, -0.08], { color: '#222222', edge: 'soft' })
      .box([0.02, 0.04, 0.025], [0, 0.19, 0.05], { color: '#222222', round: 0.4 })
      .cyl([0.05, 0.06, 0.05], [0, 0.255, 0.17], { color: '#222222', rot: [90, 0, 0], name: 'chuck', mover: { kind: 'spin', axis: 'z', amount: 1440 } })
      .stick([0, 0.255, 0.2], [0, 0.255, 0.3], 0.008, 'silver', { parent: 'chuck' })
      .act({ click: [A.operate('chuck', 'on'), A.par(A.anim('shake'), A.say('Brrrrr!', 1.5)), A.wait(0.5), A.operate('chuck', 'off')] })
      .done(),
  ),
  // A drill bit set: twist bits of rising sizes standing in a holder, the gold one drawn out and spinning.
  e('drill bit', 'workshop', 'hardware', () => {
    const b = m('drill bit', { edge: 'sharp' }).box([0.14, 0.02, 0.05], [0, 0.01, 0], { color: '#333333', round: 0.3 });
    b.each(6, (i) => {
      const x = -0.055 + i * 0.022, d = 0.004 + i * 0.0015, h = 0.05 + i * 0.012;
      const o = i === 5 ? { name: 'bit', piece: true } : {};
      b.cyl([d, h, d], [x, 0.02 + h / 2, 0], { color: i === 5 ? 'gold' : 'silver', ...o });
      b.cone([d, d * 1.5, d], [x, 0.02 + h + d * 0.75, 0], { color: i === 5 ? 'gold' : 'silver', ...(i === 5 ? { parent: 'bit' } : {}) });
      b.each(3, (k) => b.torus([d * 1.05, d * 1.05, d * 0.2], [x, 0.03 + h * (0.4 + k * 0.18), 0], { color: i === 5 ? '#a07a20' : '#9a9a9a', rot: [70, 0, 0], tube: 0.2, noInk: true, ...(i === 5 ? { parent: 'bit' } : {}) }));
    });
    return b.act({ click: [A.pose('bit', { move: [0, 0.05, 0], dur: 0.3 }), A.pose('bit', { spin: [0, 1080, 0] }), A.say('Zing!', 1), A.wait(0.8), A.pose('bit', { spin: [0, 0, 0], rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A camera drone (40 cm across): white body with a camera on a gimbal, four arms with motors and props that never
  // stop turning, landing legs and status lights. It takes off, hovers and lands.
  e('drone', 'tech', 'gadgets', () => {
    const b = m('drone', { edge: 'sharp' })
      .box([0.16, 0.06, 0.2], [0, 0.13, 0], { color: 'white', round: 0.5, name: 'body' })
      .box([0.12, 0.02, 0.1], [0, 0.17, -0.02], { color: '#dddddd', round: 0.5, parent: 'body' })
      .ball([0.05, 0.05, 0.05], [0, 0.085, 0.08], { color: '#222222', parent: 'body' })
      .ball(0.02, [0, 0.085, 0.104], { color: 'cyan', glow: true, parent: 'body' });
    let i = 0;
    for (const [x, z] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) {
      b.rod([0, 0.14, 0], [x, 0.14, z], 0.02, '#888888', { parent: 'body' });
      b.cyl([0.035, 0.03, 0.035], [x, 0.155, z], { color: '#333333', parent: 'body' });
      b.ball(0.012, [x, 0.13, z], { color: z > 0 ? 'lime' : 'red', glow: true, parent: 'body' });
      b.box([0.17, 0.004, 0.025], [x, 0.175, z], { color: '#222222', rot: [0, x * z > 0 ? 30 : -30, 0], name: `rotor${i++}`, parent: 'body' });
    }
    b.pair((s) => b.rod([s * 0.08, 0.005, -0.08], [s * 0.08, 0.005, 0.08], 0.012, '#888888', { parent: 'body' }).rod([s * 0.08, 0.005, 0], [s * 0.05, 0.11, 0], 0.012, '#888888', { parent: 'body' }));
    return b.act({ click: [A.par(A.pose('body', { move: [0, 1.4, 0], dur: 1.2 }), A.say('Bzzzzzz!', 2)), A.pose('body', { move: [0.3, 1.5, 0], dur: 0.6 }), A.pose('body', { move: [-0.2, 1.4, 0], dur: 0.8 }), A.pose('body', { move: [0, 0, 0], dur: 1.2 })] }).done();
  }),
  // A red snare drum on a stand: chrome hoops and tension rods, a white head and two sticks; rat-a-tat.
  e('drum', 'music', 'drums', () => {
    const b = m('drum', { edge: 'sharp' })
      .cyl([0.36, 0.16, 0.36], [0, 0.6, 0], { color: 'red', name: 'shell' })
      .torus([0.375, 0.375, 0.03], [0, 0.52, 0], { color: 'silver', rot: [90, 0, 0] })
      .torus([0.375, 0.375, 0.03], [0, 0.68, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.35, 0.01, 0.35], [0, 0.69, 0], { color: 'white', name: 'head', parent: 'shell', piece: true })
      .rod([-0.12, 0.71, 0.1], [0.15, 0.76, -0.1], 0.014, 'lightwood', { name: 'stickL', piece: true })
      .rod([0.12, 0.71, 0.1], [-0.15, 0.76, -0.1], 0.014, 'lightwood', { name: 'stickR', piece: true });
    around(8, 0.182).forEach(([x, z]) => b.stick([x, 0.53, z], [x, 0.67, z], 0.008, 'silver'));
    b.stick([0, 0, 0], [0, 0.5, 0], 0.025, 'silver');
    around(3, 0.25, 0.5).forEach(([x, z]) => b.rod([x, 0, z], [0, 0.25, 0], 0.016, 'silver'));
    around(3, 0.13, 0.8).forEach(([x, z]) => b.rod([0, 0.48, 0], [x, 0.52, z], 0.014, 'silver'));
    const hit = (nm: string) => [A.pose(nm, { rot: [-12, 0, 0], dur: 0.06 }), A.pose(nm, { rot: [0, 0, 0], dur: 0.06 })];
    return b.act({ click: [...hit('stickL'), ...hit('stickR'), ...hit('stickL'), ...hit('stickR'), A.say('Rat-a-tat-tat!', 1.5)] }).done();
  }),
  // A five-piece drum kit: bass drum with a logo, snare, two rack toms, a floor tom, a hi-hat, a crash cymbal on a
  // boom stand, a stool. Ba-dum-tss: the crash cymbal wobbles.
  e('drum kit', 'music', 'drums', () => {
    const b = m('drum kit', { edge: 'sharp' })
      .cyl([0.56, 0.42, 0.56], [0, 0.3, 0], { color: '#c0392b', rot: [90, 0, 0] })
      .cyl([0.5, 0.01, 0.5], [0, 0.3, 0.215], { color: 'white', rot: [90, 0, 0] })
      .label('ROCK', [0.24, 0.08], [0, 0.3, 0.222], { color: 'white', depth: 0.003 })
      .torus([0.57, 0.57, 0.03], [0, 0.3, 0.21], { color: 'silver' })
      .cyl([0.34, 0.15, 0.34], [-0.45, 0.62, 0.25], { color: '#c0392b' })
      .cyl([0.33, 0.01, 0.33], [-0.45, 0.7, 0.25], { color: 'white' })
      .stick([-0.45, 0, 0.25], [-0.45, 0.55, 0.25], 0.03, 'silver')
      .cyl([0.25, 0.2, 0.25], [-0.15, 0.68, 0.0], { color: '#c0392b', rot: [20, 0, 0] })
      .cyl([0.25, 0.2, 0.25], [0.15, 0.68, 0.0], { color: '#c0392b', rot: [20, 0, 0] })
      .cyl([0.42, 0.4, 0.42], [0.5, 0.4, 0.22], { color: '#c0392b' })
      .cyl([0.42, 0.02, 0.42], [0.5, 0.605, 0.22], { color: 'white' })
      .stick([-0.75, 0, 0.05], [-0.75, 0.9, 0.05], 0.025, 'silver')
      .cyl([0.36, 0.03, 0.36], [-0.75, 0.86, 0.05], { color: 'gold', taper: 0.3, rot: [180, 0, 0] })
      .cyl([0.36, 0.03, 0.36], [-0.75, 0.9, 0.05], { color: 'gold', taper: 0.3 })
      .stick([0.65, 0, -0.35], [0.65, 1.1, -0.35], 0.025, 'silver')
      .rod([0.65, 1.1, -0.35], [0.5, 1.2, -0.2], 0.022, 'silver')
      .cyl([0.45, 0.03, 0.45], [0.48, 1.22, -0.18], { color: 'gold', taper: 0.3, rot: [-15, 0, 10], name: 'crash', pivot: [0.48, 1.22, -0.18] })
      .cyl([0.36, 0.1, 0.36], [0, 0.48, -0.6], { color: '#222222', edge: 'soft' })
      .stick([0, 0, -0.6], [0, 0.44, -0.6], 0.04, 'silver');
    for (const [x, z] of [[0.5, 0.42], [0.35, 0.05], [0.65, 0.05]]) b.stick([x, 0, z], [x, 0.22, z], 0.02, 'silver');
    const wob = (r: number, t: number) => A.pose('crash', { rot: [r, 0, r * 0.5], dur: t });
    return b.act({ click: [A.anim('shake'), A.say('Ba-dum-tss!', 1.5), wob(12, 0.1), wob(-8, 0.2), wob(5, 0.2), wob(0, 0.2)] }).done();
  }),
  // A pair of hickory drumsticks (40 cm) resting on a rubber practice pad on its stand; they tap out a beat.
  e('drumstick (music)', 'music', 'drums', () => {
    const y = 0.62;
    const b = m('drumstick (music)')
      .cyl([0.25, 0.03, 0.25], [0, y, 0], { color: '#222222', edge: 'sharp' })
      .cyl([0.2, 0.006, 0.2], [0, y + 0.018, 0], { color: '#777777' })
      .stick([0, 0.05, 0], [0, y - 0.015, 0], 0.025, 'silver', { edge: 'sharp' })
      .rod([-0.02, y + 0.035, 0.12], [0.08, y + 0.045, -0.26], 0.015, 'lightwood', { name: 'stickL', pivot: [0.08, y + 0.045, -0.26] })
      .ball(0.018, [-0.022, y + 0.035, 0.13], { color: 'lightwood', parent: 'stickL' })
      .rod([0.02, y + 0.035, 0.12], [-0.08, y + 0.045, -0.26], 0.015, 'lightwood', { name: 'stickR', pivot: [-0.08, y + 0.045, -0.26] })
      .ball(0.018, [0.022, y + 0.035, 0.13], { color: 'lightwood', parent: 'stickR' });
    around(3, 0.25, 0.5).forEach(([x, z]) => b.rod([x, 0, z], [0, 0.25, 0], 0.016, 'silver', { edge: 'sharp' }));
    return b.act({ click: [A.pose('stickL', { rot: [-12, 0, 0], dur: 0.08, times: 2 }), A.pose('stickR', { rot: [-12, 0, 0], dur: 0.08, times: 2 }), A.pose('stickL', { rot: [-12, 0, 0], dur: 0.08 }), A.pose('stickL', { rot: [0, 0, 0], dur: 0.06 }), A.say('Tap, tap, tappa-tap!', 1.5)] }).done();
  }),
  // A blue whiteboard marker by a little whiteboard on an easel; the cap comes off and it squeaks a line.
  e('dry erase marker', 'study', 'stationery', () =>
    m('dry erase marker', { edge: 'sharp' })
      .box([0.3, 0.22, 0.01], [-0.05, 0.16, -0.05], { color: 'white', round: 0.1, rot: [-12, 0, 0] })
      .box([0.32, 0.24, 0.008], [-0.05, 0.16, -0.056], { color: 'silver', round: 0.1, rot: [-12, 0, 0] })
      .rod([-0.15, 0, 0.0], [-0.15, 0.27, -0.07], 0.012, 'silver')
      .rod([0.05, 0, 0.0], [0.05, 0.27, -0.07], 0.012, 'silver')
      .box([0.12, 0.005, 0.004], [-0.06, 0.18, -0.04], { color: 'blue', rot: [-12, 0, 0], name: 'line', scale: 0 })
      .cyl([0.018, 0.12, 0.018], [0.13, 0.06, 0.03], { color: 'white', name: 'marker', piece: true })
      .cyl([0.0185, 0.03, 0.0185], [0.13, 0.06, 0.03], { color: 'blue', parent: 'marker' })
      .cone([0.012, 0.012, 0.012], [0.13, 0.126, 0.03], { color: 'blue', parent: 'marker' })
      .cyl([0.02, 0.04, 0.02], [0.13, 0.135, 0.03], { color: 'blue', name: 'cap', parent: 'marker', piece: true })
      .box([0.005, 0.03, 0.007], [0.13, 0.135, 0.042], { color: 'blue', round: 0.3, parent: 'cap' })
      .act({
        click: [
          [A.detach('cap', 'cap'), A.pose('marker', { move: [-0.1, 0.09, -0.05], dur: 0.4 }), A.pose('line', { scale: 1, dur: 0.4 }), A.say('Squeak squeak!', 1.2), A.pose('marker', { move: [0, 0, 0], dur: 0.4 })],
          [A.reattach('cap'), A.pose('line', { scale: 0, dur: 0.3 })],
        ],
      })
      .done(),
  ),
  // White blocks of dry ice in a black tub, a fog of vapour spilling over the rim; it smokes.
  e('dry ice', 'study', 'lab chemicals', () => {
    const b = m('dry ice').cyl([0.18, 0.08, 0.18], [0, 0.04, 0], { color: '#3a4a5a', taper: 1.3, edge: 'sharp' });
    for (const [x, z, r] of [[-0.04, 0.01, 10], [0.035, -0.01, 35], [0.0, 0.04, 60], [0.01, -0.045, 20]] as V[]) b.box(0.045, [x, 0.09, z], { color: '#eef4f8', round: 0.2, rot: [0, r, 0], edge: 'sharp' });
    around(8, 0.11, 0.4).forEach(([x, z], i) => b.ball([0.08, 0.04, 0.08], [x, 0.03 + (i % 3) * 0.025, z], { color: 'white', noInk: true }));
    return b.ball([0.13, 0.04, 0.13], [0, 0.12, 0], { color: 'white', noInk: true }).act({ click: [A.par(A.effect('smoke', { dur: 2.5 }), A.effect('snow', { dur: 1.5 })), A.say('Fssssss...', 2)] }).done();
  }),
  // A front-loading tumble dryer: round door with a porthole on the left hinge, clothes tumbling in the drum behind
  // it, a dial and a display, a lint filter. Load it, run it: buzz.
  e('dryer', 'home', 'laundry', () =>
    m('dryer', { edge: 'sharp' })
      .box([0.65, 0.85, 0.65], [0, 0.425, 0], { color: 'white', round: 0.06 })
      .box([0.6, 0.12, 0.02], [0, 0.76, 0.33], { color: '#d8d8d8', round: 0.3 })
      .cyl([0.08, 0.025, 0.08], [-0.18, 0.76, 0.345], { color: '#888888', rot: [90, 0, 0], name: 'dial', piece: true })
      .box([0.14, 0.05, 0.01], [0.15, 0.76, 0.345], { color: 'cyan', glow: true, name: 'display', mover: { kind: 'light' } })
      .cyl([0.42, 0.02, 0.42], [0, 0.38, 0.32], { color: '#2a2f38', rot: [90, 0, 0] })
      .ball([0.3, 0.3, 0.06], [0, 0.38, 0.31], { color: '#c0392b', name: 'drum', mover: { kind: 'spin', axis: 'z', amount: 360 } })
      .ball([0.14, 0.12, 0.04], [0.06, 0.44, 0.335], { color: '#4a90d9', parent: 'drum' })
      .ball([0.12, 0.1, 0.04], [-0.07, 0.33, 0.335], { color: '#f2c14e', parent: 'drum' })
      .torus([0.46, 0.46, 0.06], [0, 0.38, 0.35], { color: 'silver', tube: 0.16, name: 'door', pivot: [-0.23, 0.38, 0.35], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .cyl([0.36, 0.015, 0.36], [0, 0.38, 0.35], { color: '#bfd8e8', rot: [90, 0, 0], parent: 'door' })
      .box([0.3, 0.02, 0.06], [0.1, 0.07, 0.31], { color: '#cccccc', round: 0.3 })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Click.', 1), A.wait(1.5), A.operate('door', 'close')],
          [A.pose('dial', { rot: [0, 90, 0], dur: 0.3 }), A.operate('display', 'on'), A.operate('drum', 'on'), A.say('Tumble, tumble...', 2.5), A.wait(2), A.operate('drum', 'off'), A.operate('display', 'off'), A.pose('dial', { rot: [0, 0, 0], dur: 0.2 }), A.say('Bzzzt!', 1)],
        ],
      })
      .done(),
  ),
  // A box of dryer sheets with a soft white sheet poking out of the slot; pull one out.
  e('dryer sheet', 'home', 'laundry', () =>
    m('dryer sheet', { edge: 'sharp' })
      .box([0.2, 0.14, 0.08], [0, 0.07, 0], { color: '#a8d8f0', round: 0.2 })
      .label('SOFT', [0.14, 0.05], [0, 0.08, 0.042], { color: '#a8d8f0', depth: 0.003 })
      .ball([0.04, 0.04, 0.01], [-0.06, 0.035, 0.042], { color: 'pink', noInk: true })
      .box([0.12, 0.004, 0.03], [0, 0.141, 0], { color: '#5a8aa0' })
      .box([0.12, 0.08, 0.004], [0, 0.17, 0], { color: 'white', round: 0.2, rot: [10, 0, 6], name: 'sheet', piece: true, edge: 'soft' })
      .act({ click: [A.pose('sheet', { move: [0, 0.08, 0], rot: [0, 0, 15], dur: 0.4 }), A.say('Whiff!', 1), A.wait(0.8), A.pose('sheet', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // Plasterboard on a site: a stack of 1.2 m sheets, one leaning against it, a bucket of joint mud and a taping
  // knife. Bump the leaning one and it slaps down.
  e('drywall', 'workshop', 'building materials', () => {
    const b = m('drywall', { edge: 'sharp' })
      .box([1.2, 1.2, 0.012], [0, 0.66, -0.32], { color: '#ececea', round: 0.05, rot: [-12, 0, 0], name: 'sheet', pivot: [0, 0.07, -0.2] })
      .box([1.2, 0.04, 0.03], [0, 1.24, -0.44], { color: '#cfcfcb', rot: [-12, 0, 0], parent: 'sheet' })
      .cyl([0.26, 0.3, 0.26], [0.8, 0.15, 0.25], { color: 'white', edge: 'soft' })
      .label('MUD', [0.16, 0.08], [0.8, 0.16, 0.385], { color: 'white', depth: 0.003 })
      .box([0.12, 0.004, 0.1], [0.8, 0.31, 0.25], { color: 'silver' })
      .rod([0.8, 0.32, 0.2], [0.8, 0.42, 0.13], 0.02, 'darkbrown');
    b.each(4, (i) => b.box([1.2, 0.014, 0.6], [0, 0.007 + i * 0.016, 0.05], { color: i % 2 ? '#e4e4e0' : '#ececea', round: 0.1 }));
    return b.act({ click: [[A.pose('sheet', { rot: [-75, 0, 0], dur: 0.5 }), A.effect('dust', { dur: 1.2 }), A.say('Whump!', 1)], [A.pose('sheet', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A duck's head (a bird part, shown on its head): a yellow head and the flat orange bill with nostrils, the lower
  // half hinged so it quacks.
  e('duck bill (part)', 'aviary', 'bird parts', () =>
    m('duck bill (part)')
      .ball([0.1, 0.1, 0.09], [0, 0.06, -0.04], { color: 'yellow' })
      .ball([0.075, 0.022, 0.1], [0, 0.062, 0.04], { color: 'orange' })
      .ball([0.065, 0.016, 0.085], [0, 0.044, 0.035], { color: '#e8701a', name: 'jaw', pivot: [0, 0.05, -0.005], mover: { kind: 'swing', axis: 'x', amount: 22 } })
      .ball(0.007, [0.012, 0.074, 0.06], { color: '#7a3a0a', noInk: true })
      .ball(0.007, [-0.012, 0.074, 0.06], { color: '#7a3a0a', noInk: true })
      .ball(0.016, [0.042, 0.08, -0.02], { color: 'black', eye: true })
      .ball(0.016, [-0.042, 0.08, -0.02], { color: 'black', eye: true })
      .act({ click: [A.operate('jaw', 'open'), A.say('Quack!', 1.2), A.operate('jaw', 'close'), A.operate('jaw', 'open'), A.operate('jaw', 'close')] })
      .done(),
  ),
  // A navy duffel bag (70 cm): a barrel of canvas with end panels, a zip along the top, two carry handles and a
  // white stripe; it is tossed and lands.
  e('duffel bag', 'wardrobe', 'bags', () => {
    const b = m('duffel bag')
      .cyl([0.32, 0.66, 0.32], [0, 0.16, 0], { color: 'navy', rot: [0, 0, 90] })
      .cyl([0.33, 0.04, 0.33], [0.33, 0.16, 0], { color: '#1a2a5a', rot: [0, 0, 90] })
      .cyl([0.33, 0.04, 0.33], [-0.33, 0.16, 0], { color: '#1a2a5a', rot: [0, 0, 90] })
      .box([0.56, 0.02, 0.03], [0, 0.322, 0], { color: 'silver', edge: 'sharp' })
      .box([0.03, 0.03, 0.02], [0.2, 0.33, 0.02], { color: 'silver', edge: 'sharp' })
      .box([0.56, 0.06, 0.004], [0, 0.17, 0.161], { color: 'white', noInk: true });
    b.pair((s) => b.arc([0.14, 0.1, 0.02], [s * 0.1, 0.33, 0], { color: 'black', arc: 180, tube: 0.3 }));
    return b.act({ click: [A.anim('hop'), A.say('Thump!', 1)] }).done();
  }),
  // A cast-iron hex dumbbell lying on a rubber mat; it is lifted: hup!
  e('dumbbell', 'sports', 'gym', () => {
    const b = m('dumbbell', { edge: 'sharp' })
      .box([0.5, 0.02, 0.3], [0, 0.01, 0], { color: '#2a2a2a', round: 0.3 })
      .cyl([0.035, 0.34, 0.035], [0, 0.1, 0], { color: 'silver', rot: [0, 0, 90], name: 'bar' })
      .cyl([0.04, 0.12, 0.04], [0, 0.1, 0], { color: '#555555', rot: [0, 0, 90], parent: 'bar' });
    b.pair((s) => b.prism([0.17, 0.06, 0.17], [s * 0.12, 0.1, 0], 6, { color: '#222222', rot: [0, 0, 90], parent: 'bar' }).label('10', [0.05, 0.04], [s * 0.15, 0.1, 0.0], { color: '#222222', rot: [0, s * 90, 0], parent: 'bar', depth: 0.002 }));
    return b.act({ click: [A.pose('bar', { move: [0, 0.6, 0], dur: 0.6 }), A.say('Hup!', 1), A.pose('bar', { move: [0, 0, 0], dur: 0.5 }), A.say('Clank.', 1)] }).done();
  }),
  // A tipper truck at real size (8 m, 3.4 m tall): a yellow cab with doors and lights, three axles, and a steel
  // body heaped with earth that tips up on its rear hinge and dumps it.
  e('dump truck', 'garage', 'construction vehicles', () => {
    const Y = '#f2b81b';
    const b = m('dump truck', { view: 'side', edge: 'sharp' })
      .box([1.1, 0.35, 7.6], [0, 1.0, -0.3], { color: '#2a2726', round: 0.2 })
      .box([2.5, 1.9, 1.9], [0, 2.15, 2.9], { color: Y, round: 0.15 })
      .box([2.3, 0.9, 0.06], [0, 2.55, 3.86], { color: DARKWIN, rot: [-8, 0, 0] })
      .box([2.0, 0.55, 0.08], [0, 1.4, 3.86], { color: '#3a3633', round: 0.2 })
      .box([2.6, 0.3, 0.25], [0, 0.8, 3.95], { color: '#3a3633', round: 0.2 })
      .box([0.06, 1.1, 1.0], [1.27, 2.05, 3.0], { color: Y, name: 'door', pivot: [1.27, 2.05, 3.5], mover: { kind: 'swing', axis: 'y', amount: -75 } })
      .box([0.04, 0.6, 0.8], [1.3, 2.4, 3.0], { color: DARKWIN, parent: 'door' })
      .box([0.04, 0.6, 0.8], [-1.27, 2.4, 3.0], { color: DARKWIN })
      .stick([-1.0, 1.5, 2.0], [-1.0, 3.6, 2.0], 0.14, 'silver')
      .box([2.5, 1.4, 4.7], [0, 2.1, -1.2], { color: '#d89a10', round: 0.08, name: 'bed', pivot: [0, 1.3, -3.55], mover: { kind: 'swing', axis: 'x', amount: -45 } })
      .box([2.5, 0.2, 1.0], [0, 3.0, 1.45], { color: '#d89a10', rot: [-15, 0, 0], parent: 'bed' })
      .ball([2.2, 0.8, 4.2], [0, 2.85, -1.2], { color: 'dirt', parent: 'bed', edge: 'soft' })
      .box([2.5, 1.3, 0.1], [0, 2.1, -3.6], { color: '#c08a10', parent: 'bed' });
    b.pair((s) => {
      b.ball([0.3, 0.25, 0.1], [s * 0.85, 1.6, 3.87], { color: '#fff6c8', glow: true, edge: 'soft' });
      b.box([0.06, 0.35, 0.22], [s * 1.38, 2.6, 3.6], { color: '#2a2726' });
      b.box([0.06, 0.3, 4.4], [s * 1.26, 1.7, -1.2], { color: '#c08a10', parent: 'bed' });
      b.box([0.15, 0.12, 0.08], [s * 1.0, 1.0, -3.95], { color: 'red', glow: true });
    });
    let n = 1;
    for (const z of [2.9, -1.6, -3.0]) b.pair((s) => wheel(b, `wheel${n++}`, s * 1.08, 0.56, z, 1.12, 0.4));
    return b
      .socket('seat', [0.5, 1.8, 2.9], 'seat')
      .act({
        click: [
          [A.operate('bed', 'open'), A.par(A.effect('dust', { dur: 2.5 }), A.say('Rumble... whoosh!', 2)), A.wait(1.5), A.operate('bed', 'close')],
          [A.operate('door', 'open'), A.say('Beep! Beep! Beep!', 1.8), A.wait(1), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A bamboo steamer of pleated dumplings; lift the lid and they steam.
  e('dumpling', 'food', 'asian food', () => {
    const b = m('dumpling')
      .cyl([0.24, 0.06, 0.24], [0, 0.03, 0], { color: '#d9b870' })
      .torus([0.245, 0.245, 0.02], [0, 0.06, 0], { color: '#b8954a', rot: [90, 0, 0], tube: 0.06 });
    for (const [x, z] of [[-0.05, 0.03], [0.05, 0.03], [0, -0.05]]) {
      b.ball([0.075, 0.05, 0.075], [x, 0.08, z], { color: '#f6efe0' }).cone([0.03, 0.025, 0.03], [x, 0.11, z], { color: '#f6efe0' });
      b.each(4, (i) => b.rod([x, 0.118, z], [x + Math.cos(i * 1.57) * 0.025, 0.095, z + Math.sin(i * 1.57) * 0.025], 0.004, '#d8cfb8', { noInk: true }));
    }
    return b
      .dome([0.25, 0.08, 0.25], [0.2, 0.0, 0.12], { color: '#d9b870', name: 'lid', piece: true, rot: [0, 0, 70] })
      .act({ click: [A.pose('lid', { move: [-0.1, 0.06, -0.06], rot: [0, 0, -40], dur: 0.4 }), A.effect('steam', { dur: 2 }), A.say('Mmm!', 1.2), A.wait(1), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A green steel commercial dumpster (1.8 m wide): two black plastic lids, one propped open, side lifting pockets,
  // castors, a bag of rubbish poking out. The lid flips open, clang.
  e('dumpster', 'home', 'trash', () =>
    m('dumpster', { edge: 'sharp' })
      .box([1.8, 1.15, 1.1], [0, 0.73, 0], { color: '#2e7d4f', round: 0.06 })
      .box([1.82, 0.08, 1.12], [0, 1.3, 0], { color: '#1e5a36', round: 0.2 })
      .box([0.88, 0.06, 1.15], [0.45, 1.37, 0], { color: '#1e1e1e', round: 0.3, name: 'lid', pivot: [0.45, 1.37, -0.55], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .box([0.88, 0.06, 1.15], [-0.45, 1.6, -0.45], { color: '#1e1e1e', round: 0.3, rot: [-70, 0, 0] })
      .ball([0.45, 0.35, 0.4], [-0.45, 1.33, 0.2], { color: '#222222', edge: 'soft' })
      .box([0.1, 0.25, 0.85], [0.95, 0.85, 0], { color: '#777777', round: 0.2 })
      .box([0.1, 0.25, 0.85], [-0.95, 0.85, 0], { color: '#777777', round: 0.2 })
      .label('NO DUMPING', [0.8, 0.2], [0, 0.85, 0.56], { color: '#2e7d4f', depth: 0.01 })
      .ball(0.14, [0.75, 0.07, 0.45], { color: 'black' })
      .ball(0.14, [-0.75, 0.07, 0.45], { color: 'black' })
      .ball(0.14, [0.75, 0.07, -0.45], { color: 'black' })
      .ball(0.14, [-0.75, 0.07, -0.45], { color: 'black' })
      .act({ click: [A.operate('lid', 'open'), A.par(A.effect('dust', { dur: 1.2 }), A.say('Clang!', 1)), A.wait(1.5), A.operate('lid', 'close'), A.say('Bang!', 1)] })
      .done(),
  ),
  // A beach dune buggy (3.6 m): an orange fibreglass tub, a tube roll cage, two bucket seats, the engine and twin
  // pipes out the back, skinny front wheels and fat rear ones, round headlights.
  e('dune buggy', 'garage', 'cars', () => {
    const O = '#f26a1b';
    const b = m('dune buggy', { view: 'side', edge: 'sharp' })
      .box([1.0, 0.18, 3.2], [0, 0.45, -0.1], { color: '#2a2726', round: 0.2 })
      .loft([1.55, 0.9, 3.0], [0, 0.95, 0], [[0, 0.85, 0.7, 0.05], [0.2, 1, 1, 0], [0.6, 1, 1, 0], [0.85, 0.85, 0.85, 0.05], [1, 0.55, 0.6, 0.1]], { color: O, cut: 'bottom', boxy: 0.6, edge: 'soft' })
      .wedge([1.3, 0.35, 0.9], [0, 0.95, 1.1], { color: O, rot: [-90, 0, 0] })
      .box([0.5, 0.6, 0.12], [0.3, 1.05, -0.45], { color: '#222222', round: 0.4, edge: 'soft' })
      .box([0.5, 0.6, 0.12], [-0.3, 1.05, -0.45], { color: '#222222', round: 0.4, edge: 'soft' })
      .box([0.5, 0.12, 0.5], [0.3, 0.72, -0.2], { color: '#222222', round: 0.4, edge: 'soft' })
      .box([0.5, 0.12, 0.5], [-0.3, 0.72, -0.2], { color: '#222222', round: 0.4, edge: 'soft' })
      .torus([0.36, 0.36, 0.04], [0.3, 1.15, 0.45], { color: '#222222', rot: [-60, 0, 0] })
      .box([0.9, 0.5, 0.6], [0, 0.85, -1.55], { color: '#777777', round: 0.2 })
      .cyl([0.25, 0.15, 0.25], [0.2, 1.17, -1.5], { color: 'silver' })
      .rod([0.2, 0.75, -1.85], [0.3, 0.95, -2.05], 0.08, 'silver')
      .rod([-0.2, 0.75, -1.85], [-0.3, 0.95, -2.05], 0.08, 'silver');
    b.pair((s) => {
      b.rod([s * 0.62, 0.95, 0.55], [s * 0.52, 1.6, 0.15], 0.06, '#222222').rod([s * 0.62, 0.95, -0.95], [s * 0.52, 1.6, -0.6], 0.06, '#222222').rod([s * 0.52, 1.6, 0.15], [s * 0.52, 1.6, -0.6], 0.06, '#222222');
      b.cyl([0.2, 0.08, 0.2], [s * 0.45, 1.05, 1.5], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: s > 0 ? 'headlightL' : 'headlightR', mover: { kind: 'light', on: true } });
      b.box([0.35, 0.06, 0.8], [s * 0.82, 0.9, 1.15], { color: O, round: 0.4, rot: [-10, 0, 0] });
    });
    b.rod([-0.52, 1.6, 0.15], [0.52, 1.6, 0.15], 0.06, '#222222').rod([-0.52, 1.6, -0.6], [0.52, 1.6, -0.6], 0.06, '#222222');
    wheel(b, 'wheelFL', 0.82, 0.34, 1.15, 0.68, 0.22);
    wheel(b, 'wheelFR', -0.82, 0.34, 1.15, 0.68, 0.22);
    wheel(b, 'wheelRL', 0.85, 0.42, -1.1, 0.84, 0.4);
    wheel(b, 'wheelRR', -0.85, 0.42, -1.1, 0.84, 0.4);
    return b
      .socket('seat', [0.3, 0.8, -0.2], 'seat')
      .act({
        click: [
          [A.par(A.anim('bounce', 2), A.effect('dust', { dur: 2 }), A.say('Vroom vroom!', 1.5))],
          [A.operate('headlight', 'off'), A.wait(0.3), A.operate('headlight', 'on'), A.say('Beep beep!', 1.2)],
        ],
      })
      .done();
  }),
  // A dungeon cell: thick stone walls, a barred iron door that creaks open, chains and shackles on the wall, straw,
  // a bucket, a pile of old bones and a flickering torch in a sconce.
  e('dungeon', 'places', 'castles', () => {
    const w = '#6a6560';
    const b = m('dungeon', { edge: 'sharp' })
      .box([4, 0.1, 3.4], [0, 0.05, 0], { color: '#4a4540' })
      .box([4, 3, 0.4], [0, 1.5, -1.5], { color: w })
      .box([0.4, 3, 3.4], [1.8, 1.5, 0], { color: w })
      .box([0.4, 3, 3.4], [-1.8, 1.5, 0], { color: w })
      .ball([1.2, 0.3, 0.8], [0.8, 0.15, -0.8], { color: '#c8a85a', edge: 'soft' })
      .cyl([0.3, 0.35, 0.3], [-1.2, 0.27, -0.9], { color: '#6a4a2a', taper: 1.15 })
      .ball([0.3, 0.12, 0.25], [-0.6, 0.15, -0.9], { color: 'cream', edge: 'soft' })
      .ball([0.18, 0.16, 0.18], [-0.45, 0.25, -0.85], { color: 'cream', edge: 'soft' })
      .stick([-1.58, 1.6, 0.2], [-1.4, 1.9, 0.2], 0.06, 'darkwood')
      .ball([0.14, 0.24, 0.14], [-1.38, 2.05, 0.2], { color: 'flame', glow: true, name: 'torch', mover: { kind: 'light', on: true }, edge: 'soft' });
    b.each(7, (i) => b.box([0.6, 0.28, 0.03], [-1.5 + (i % 3) * 1.2 + (Math.floor(i / 3) % 2) * 0.6, 0.5 + Math.floor(i / 3) * 0.8, -1.29], { color: '#5a5550', noInk: true }));
    b.pair((s) => {
      b.rod([s * 0.5, 2.0, -1.28], [s * 0.55, 1.3, -1.25], 0.03, 'iron', { name: s > 0 ? 'chainL' : 'chainR', pivot: [s * 0.5, 2.0, -1.28] });
      b.torus([0.12, 0.12, 0.03], [s * 0.55, 1.22, -1.25], { color: 'iron', parent: s > 0 ? 'chainL' : 'chainR' });
    });
    b.each(4, (i) => b.stick([-1.6 + i * 0.4, 0.1, 1.6], [-1.6 + i * 0.4, 2.9, 1.6], 0.06, 'iron'));
    b.each(3, (i) => b.stick([0.8 + i * 0.4, 0.1, 1.6], [0.8 + i * 0.4, 2.9, 1.6], 0.06, 'iron'));
    for (const y of [0.15, 2.85]) b.stick([-1.6, y, 1.6], [1.6, y, 1.6], 0.08, 'iron');
    b.box([1.0, 0.08, 0.08], [0.0, 2.6, 1.62], { color: 'iron', name: 'door', pivot: [-0.5, 1.4, 1.62], mover: { kind: 'swing', axis: 'y', amount: -95 } });
    b.each(3, (i) => b.stick([-0.3 + i * 0.3, 0.15, 1.62], [-0.3 + i * 0.3, 2.65, 1.62], 0.06, 'iron', { parent: 'door' }));
    b.stick([-0.5, 0.2, 1.62], [0.5, 0.2, 1.62], 0.07, 'iron', { parent: 'door' }).stick([-0.5, 1.4, 1.62], [0.5, 1.4, 1.62], 0.07, 'iron', { parent: 'door' }).stick([-0.48, 0.15, 1.62], [-0.48, 2.65, 1.62], 0.06, 'iron', { parent: 'door' }).stick([0.48, 0.15, 1.62], [0.48, 2.65, 1.62], 0.06, 'iron', { parent: 'door' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Creeeeak...', 2), A.wait(1.5), A.operate('door', 'close'), A.say('Clang!', 1)],
          [A.par(A.pose('chainL', { rot: [0, 0, 12], dur: 0.2 }), A.pose('chainR', { rot: [0, 0, -12], dur: 0.2 })), A.par(A.pose('chainL', { rot: [0, 0, -8], dur: 0.25 }), A.pose('chainR', { rot: [0, 0, 8], dur: 0.25 })), A.par(A.pose('chainL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('chainR', { rot: [0, 0, 0], dur: 0.2 })), A.say('Rattle rattle...', 1.5)],
        ],
      })
      .done();
  }),
  // A two-family duplex: one house in two mirror halves under a long gable roof with two chimneys, a front door,
  // porch and windows each side, two mailboxes. Both doorbells ring and both doors open.
  e('duplex', 'places', 'homes', () => {
    const w = 12, d = 8, h = 6, fz = d / 2;
    const b = m('duplex', { edge: 'sharp' })
      .box([w, h, d], [0, h / 2, 0], { color: '#e8d8b0', round: 0.03 })
      .box([w + 0.1, 0.4, d + 0.1], [0, 0.2, 0], { color: '#8d8a86' })
      .wedge([d + 0.8, 2.6, w + 0.8], [0, h + 1.3, 0], { color: '#8a4a2a', rot: [0, 90, 0] })
      .box([0.2, h + 0.1, d + 0.1], [0, h / 2, 0], { color: 'white' })
      .box([w + 0.4, 0.15, 0.25], [0, 3.0, fz + 0.1], { color: 'white' });
    b.pair((s) => {
      const nm = s > 0 ? 'doorA' : 'doorB';
      frontDoor(b, s * 1.4, fz, s > 0 ? '#3a6fb5' : '#c0392b', { name: nm, flip: s < 0 });
      b.label(s > 0 ? '12A' : '12B', [0.5, 0.25], [s * 2.2, 1.9, fz + 0.06], { color: 'white', depth: 0.02 });
      b.box([2.6, 0.12, 1.8], [s * 1.6, 2.7, fz + 0.9], { color: 'white', round: 0.2 });
      b.stick([s * 2.75, 0.4, fz + 1.7], [s * 2.75, 2.65, fz + 1.7], 0.12, 'white');
      b.box([2.6, 0.25, 1.8], [s * 1.6, 0.52, fz + 0.9], { color: '#a8a39a' });
      win(b, s * 4.3, 1.6, fz, 1.4, 1.3, 'white', { bars: true });
      win(b, s * 1.6, 4.5, fz, 1.2, 1.2, 'white', { bars: true });
      win(b, s * 4.3, 4.5, fz, 1.2, 1.2, 'white', { bars: true });
      b.box([0.9, 2.0, 0.9], [s * 3.6, h + 1.6, -1.0], { color: '#9a4a32' });
      b.stick([s * 3.2, 0, fz + 2.6], [s * 3.2, 1.0, fz + 2.6], 0.08, 'darkwood');
      b.box([0.25, 0.22, 0.45], [s * 3.2, 1.1, fz + 2.6], { color: s > 0 ? '#3a6fb5' : '#c0392b', round: 0.4 });
      b.ball(0.18, [s * 0.9, 2.45, fz + 0.15], { color: '#fff2a0', glow: true, name: s > 0 ? 'lampA' : 'lampB', mover: { kind: 'light' } });
    });
    return b
      .act({
        click: [
          [A.say('Ding-dong! Ding-dong!', 1.8), A.par(A.operate('doorA', 'open'), A.operate('doorB', 'open')), A.wait(2), A.par(A.operate('doorA', 'close'), A.operate('doorB', 'close'))],
          [A.operate('lamp'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // Dust bunnies: grey fluffy clumps rolling across the floor with motes in the air; poof.
  e('dust', 'home', 'cleaning', () => {
    const b = m('dust');
    for (const [cx, cz, k] of [[-0.06, 0.02, 1], [0.07, -0.02, 0.8], [0.0, 0.08, 0.6]]) {
      b.ball(0.06 * k, [cx, 0.03 * k, cz], { color: '#a8a8a8' });
      around(4, 0.03 * k, cx * 10).forEach(([x, z], i) => b.ball(0.04 * k, [cx + x, 0.02 * k, cz + z], { color: i % 2 ? '#bfbfbf' : '#9a9a9a' }));
    }
    b.each(6, (i) => b.ball(0.008, [-0.08 + rnd(i) * 0.16, 0.08 + rnd(i + 3) * 0.08, -0.04 + rnd(i + 6) * 0.08], { color: '#cccccc', noInk: true }));
    return b.act({ click: [A.par(A.effect('dust', { dur: 1.5 }), A.anim('bounce')), A.say('Poof!', 1)] }).done();
  }),
  // A workshop dust extractor on castors: a blue motor head on a white canister, a filter bag, a flexible hose; it
  // roars and its bag puffs up.
  e('dust collector', 'workshop', 'power tools', () =>
    m('dust collector', { edge: 'sharp' })
      .box([0.65, 0.1, 0.55], [0, 0.1, 0], { color: '#444444', round: 0.2 })
      .ball(0.08, [0.26, 0.04, 0.22], { color: 'black', edge: 'soft' })
      .ball(0.08, [-0.26, 0.04, 0.22], { color: 'black', edge: 'soft' })
      .ball(0.08, [0.26, 0.04, -0.22], { color: 'black', edge: 'soft' })
      .ball(0.08, [-0.26, 0.04, -0.22], { color: 'black', edge: 'soft' })
      .cyl([0.46, 0.55, 0.46], [0, 0.43, 0], { color: '#f0f0f0' })
      .cyl([0.48, 0.25, 0.48], [0, 0.83, 0], { color: '#3a6fb5' })
      .cyl([0.2, 0.08, 0.2], [0, 1.0, 0], { color: '#2a5a9a' })
      .box([0.08, 0.05, 0.02], [0.1, 0.85, 0.24], { color: 'red', name: 'switch', piece: true })
      .ball([0.5, 0.5, 0.5], [0, 1.3, 0], { color: '#d8d8d0', name: 'bag', edge: 'soft' })
      .cyl([0.16, 0.18, 0.16], [0.3, 0.5, 0.1], { color: '#3a6fb5', rot: [0, 0, 90] })
      .rod([0.4, 0.5, 0.1], [0.65, 0.35, 0.35], 0.1, '#333333', { edge: 'soft' })
      .rod([0.65, 0.35, 0.35], [0.75, 0.06, 0.55], 0.1, '#333333', { edge: 'soft' })
      .act({ click: [A.pose('switch', { rot: [0, 0, 30], dur: 0.1 }), A.par(A.pose('bag', { scale: 1.2, dur: 0.6 }), A.say('Whrrrrrr!', 2), A.effect('dust', { dur: 1.5 })), A.wait(1), A.par(A.pose('bag', { scale: 1, dur: 0.5 }), A.pose('switch', { rot: [0, 0, 0], dur: 0.1 }))] })
      .done(),
  ),
  // A red dustpan with its little brush and a pile of dust; the brush sweeps it in.
  e('dustpan', 'home', 'cleaning', () => {
    const b = m('dustpan', { edge: 'sharp' })
      .box([0.24, 0.012, 0.2], [0, 0.006, 0], { color: 'red', round: 0.2 })
      .box([0.24, 0.08, 0.012], [0, 0.045, -0.1], { color: 'red', round: 0.2 })
      .box([0.012, 0.07, 0.2], [0.12, 0.035, 0], { color: 'red', round: 0.2 })
      .box([0.012, 0.07, 0.2], [-0.12, 0.035, 0], { color: 'red', round: 0.2 })
      .rod([0, 0.06, -0.1], [0, 0.2, -0.22], 0.045, 'red')
      .box([0.2, 0.03, 0.05], [0.12, 0.045, 0.2], { color: 'wood', round: 0.4, rot: [0, 30, 0], name: 'brush', piece: true })
      .box([0.18, 0.03, 0.045], [0.12, 0.015, 0.2], { color: '#666666', round: 0.2, rot: [0, 30, 0], parent: 'brush' });
    b.each(4, (i) => b.ball(0.02, [-0.04 + i * 0.025, 0.012, 0.13 + (i % 2) * 0.03], { color: '#999999' }));
    return b.act({ click: [A.pose('brush', { move: [-0.1, 0, -0.06], dur: 0.25 }), A.pose('brush', { move: [0, 0, 0], dur: 0.25 }), A.pose('brush', { move: [-0.1, 0, -0.06], dur: 0.25 }), A.pose('brush', { move: [0, 0, 0], dur: 0.25 }), A.par(A.effect('dust', { dur: 1 }), A.say('Swish swish!', 1.2))] }).done();
  }),
  // A DVD in its open black case, the silver disc with a rainbow sheen standing in front; it spins.
  e('dvd', 'tech', 'media', () =>
    m('dvd', { edge: 'sharp' })
      .box([0.135, 0.19, 0.014], [0.02, 0.095, -0.03], { color: '#1e1e1e', round: 0.1 })
      .label('DVD', [0.1, 0.05], [0.02, 0.16, -0.022], { color: '#1e1e1e', depth: 0.003 })
      .cyl([0.12, 0.002, 0.12], [-0.02, 0.062, 0.0], { color: 'silver', rot: [90, 0, 0], name: 'disc', piece: true })
      .cyl([0.04, 0.003, 0.04], [-0.02, 0.062, 0.001], { color: '#d8d8e0', rot: [90, 0, 0], parent: 'disc' })
      .cyl([0.015, 0.004, 0.015], [-0.02, 0.062, 0.002], { color: '#333333', rot: [90, 0, 0], parent: 'disc' })
      .ball([0.012, 0.04, 0.001], [0.005, 0.075, 0.002], { color: '#f0c8f0', rot: [0, 0, 45], noInk: true, parent: 'disc' })
      .ball([0.01, 0.03, 0.001], [-0.045, 0.045, 0.002], { color: '#c8f0f0', rot: [0, 0, 45], noInk: true, parent: 'disc' })
      .act({ click: [A.pose('disc', { spin: [0, 0, 720] }), A.effect('sparkle', { dur: 1 }), A.wait(1.2), A.pose('disc', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A slim DVD player: a tray that slides out with a disc on it, a blue display, buttons.
  e('dvd player', 'tech', 'media', () =>
    m('dvd player', { edge: 'sharp' })
      .box([0.43, 0.06, 0.25], [0, 0.035, 0], { color: '#222222', round: 0.2 })
      .box([0.16, 0.012, 0.2], [-0.08, 0.04, 0.03], { color: '#444444', name: 'tray', mover: { kind: 'slide', axis: 'z', amount: 0.14 } })
      .cyl([0.12, 0.003, 0.12], [-0.08, 0.048, 0.03], { color: 'silver', parent: 'tray' })
      .box([0.16, 0.014, 0.01], [-0.08, 0.04, 0.131], { color: '#333333', parent: 'tray' })
      .box([0.08, 0.02, 0.004], [0.1, 0.04, 0.126], { color: 'cyan', glow: true, name: 'display', mover: { kind: 'light', on: true } })
      .ball(0.012, [0.18, 0.04, 0.125], { color: '#888888' })
      .ball(0.012, [0.15, 0.04, 0.125], { color: '#888888' })
      .act({ click: [A.operate('tray', 'out'), A.say('Whirr...', 1.2), A.wait(1.5), A.operate('tray', 'in'), A.say('Click.', 1)] })
      .done(),
  ),
  // A one-metre DVD tower: shelves of coloured DVD cases in a dark wood frame; one slides out to watch.
  e('dvd rack', 'home', 'storage', () => {
    const b = m('dvd rack', { edge: 'sharp' }).box([0.44, 0.08, 0.22], [0, 0.04, 0], { color: 'darkwood', round: 0.2 });
    b.pair((s) => b.box([0.03, 1.0, 0.2], [s * 0.2, 0.5, 0], { color: 'darkwood' }));
    b.each(4, (i) => {
      const y = 0.08 + i * 0.23;
      b.box([0.4, 0.02, 0.2], [0, y, 0], { color: 'darkwood' });
      b.each(6, (j) => b.box([0.05, 0.19, 0.14], [-0.15 + j * 0.06, y + 0.105, 0.01], { color: COLS[(i * 6 + j) % COLS.length], round: 0.1, ...(i === 2 && j === 3 ? { name: 'dvd', piece: true } : {}) }));
    });
    return b.box([0.43, 0.03, 0.21], [0, 1.0, 0], { color: 'darkwood' }).act({ click: [A.pose('dvd', { move: [0, 0, 0.12], dur: 0.3 }), A.say('Movie night!', 1.2), A.wait(1), A.pose('dvd', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // Three bottles of fabric dye, red, blue and yellow, with puddles of colour; the red one tips and pours.
  e('dye', 'study', 'art supplies', () => {
    const b = m('dye');
    for (const [x, c] of [[-0.06, 'red'], [0, 'blue'], [0.06, 'yellow']] as Array<[number, string]>) {
      const o = c === 'red' ? { name: 'red', piece: true } : {};
      b.cyl([0.045, 0.07, 0.045], [x, 0.035, -0.02], { color: c, ...o }).cyl([0.025, 0.02, 0.025], [x, 0.08, -0.02], { color: 'black', ...(c === 'red' ? { parent: 'red' } : {}) });
      b.box([0.035, 0.025, 0.004], [x, 0.035, 0.003], { color: 'white', noInk: true, ...(c === 'red' ? { parent: 'red' } : {}) });
      b.ball([0.06, 0.006, 0.04], [x, 0.003, 0.05], { color: c, noInk: true });
    }
    return b.act({ click: [A.pose('red', { rot: [0, 0, 50], dur: 0.4 }), A.say('Splish!', 1), A.effect('sparkle', { dur: 1 }), A.pose('red', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // An e-reader in a red folio case: the cover swings open and the page lights up. (The vocabulary entry is an
  // e-reader: its tags say kindle, nook.)
  e('dynamitee-reader', 'tech', 'gadgets', () => {
    const b = m('dynamitee-reader', { edge: 'sharp' })
      .box([0.12, 0.02, 0.07], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.125, 0.175, 0.01], [0, 0.1, -0.008], { color: '#a01828', round: 0.2 })
      .box([0.12, 0.17, 0.008], [0, 0.1, 0.0], { color: '#f0f0f0', round: 0.2 })
      .box([0.1, 0.13, 0.002], [0, 0.11, 0.005], { color: '#e0e0d8', glow: true, name: 'page', mover: { kind: 'light' } })
      .label('BOOK', [0.06, 0.02], [0, 0.155, 0.006], { color: '#e0e0d8', depth: 0.001 })
      .box([0.125, 0.175, 0.01], [0, 0.1, 0.012], { color: '#c0392b', round: 0.2, name: 'cover', pivot: [-0.0625, 0.1, 0.012], mover: { kind: 'swing', axis: 'y', amount: -150 } });
    b.each(5, (i) => b.box([0.08, 0.003, 0.001], [0, 0.135 - i * 0.017, 0.0065], { color: '#888888', noInk: true }));
    return b.act({ click: [[A.operate('cover', 'open'), A.operate('page', 'on'), A.say('Swipe.', 1)], [A.operate('page', 'off'), A.operate('cover', 'close')]] }).done();
  }),
  // A model of a human ear on a little stand: the outer ear's curling rim and the dark ear canal; it listens.
  e('ear', 'clinic', 'body parts', () =>
    m('ear')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'stone', round: 0.3, edge: 'sharp' })
      .ball([0.065, 0.1, 0.028], [0, 0.085, 0], { color: 'skin2', name: 'ear', pivot: [0, 0.04, 0] })
      .torus([0.045, 0.07, 0.012], [0.004, 0.09, 0.012], { color: 'skin3', parent: 'ear' })
      .ball([0.016, 0.02, 0.01], [-0.004, 0.08, 0.015], { color: '#5a3020', parent: 'ear' })
      .ball([0.032, 0.032, 0.022], [0.004, 0.04, 0.0], { color: 'skin2', parent: 'ear' })
      .act({ click: [A.pose('ear', { scale: 1.3, dur: 0.3 }), A.say('Eh? What?', 1.5), A.pose('ear', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // A little case of orange foam ear plugs; one gets squished and slowly swells back.
  e('ear plugs', 'clinic', 'ear care', () =>
    m('ear plugs')
      .box([0.08, 0.03, 0.05], [0, 0.015, -0.02], { color: 'skyblue', round: 0.6, edge: 'sharp' })
      .capsule([0.024, 0.042, 0.024], [-0.02, 0.052, -0.02], { color: 'orange', rot: [0, 0, 12], name: 'plug', piece: true })
      .capsule([0.024, 0.042, 0.024], [0.04, 0.012, 0.03], { color: 'orange', rot: [90, 30, 0] })
      .rod([-0.02, 0.03, -0.005], [0.0, 0.006, 0.04], 0.005, 'blue')
      .rod([0.0, 0.006, 0.04], [0.03, 0.006, 0.035], 0.005, 'blue')
      .act({ click: [A.pose('plug', { scale: 0.6, dur: 0.3 }), A.say('Squish!', 1), A.pose('plug', { scale: 1, dur: 1.5 }), A.say('Shhh...', 1)] })
      .done(),
  ),
  // A pair of earrings on a little velvet stand: a gold hoop and a gold drop with a sapphire that sways and glints.
  e('ear ring', 'wardrobe', 'jewellery', () =>
    m('ear ring')
      .box([0.12, 0.012, 0.05], [0, 0.006, 0], { color: '#1e1e1e', round: 0.4, edge: 'sharp' })
      .box([0.1, 0.1, 0.012], [0, 0.062, -0.01], { color: '#2a2a3a', round: 0.3, edge: 'sharp' })
      .torus([0.04, 0.04, 0.005], [-0.025, 0.08, 0.0], { color: 'gold', tube: 0.14, edge: 'sharp' })
      .ball(0.01, [0.025, 0.1, 0.0], { color: 'gold', name: 'drop', pivot: [0.025, 0.1, 0.0], edge: 'sharp' })
      .stick([0.025, 0.098, 0.0], [0.025, 0.07, 0.0], 0.003, 'gold', { parent: 'drop', edge: 'sharp' })
      .ball([0.018, 0.026, 0.014], [0.025, 0.055, 0.0], { color: '#2a5bd7', parent: 'drop' })
      .act({ click: [A.pose('drop', { rot: [0, 0, 20], dur: 0.25, times: 2 }), A.effect('sparkle', { dur: 1.2 })] })
      .done(),
  ),
  // Fluffy pink earmuffs on a silver headband; snug and warm while it snows.
  e('earmuffs', 'wardrobe', 'winter wear', () => {
    const b = m('earmuffs');
    for (let i = 0; i < 6; i++) {
      const t0 = (i * Math.PI) / 6, t1 = ((i + 1) * Math.PI) / 6;
      b.rod([0.09 * Math.cos(t0), 0.07 + 0.13 * Math.sin(t0), 0], [0.09 * Math.cos(t1), 0.07 + 0.13 * Math.sin(t1), 0], 0.016, 'silver', { edge: 'sharp' });
    }
    b.pair((s) => b.ball([0.06, 0.09, 0.09], [s * 0.095, 0.05, 0], { color: 'pink' }).ball([0.03, 0.07, 0.07], [s * 0.065, 0.05, 0], { color: '#f8c8d8' }));
    return b.act({ click: [A.par(A.effect('snow', { dur: 2 }), A.anim('bounce')), A.say('Snug!', 1.2)] }).done();
  }),
  // The Earth as a planetarium globe (3 m): blue oceans, green and sand continents, white ice caps and clouds, on a
  // brass half-meridian over a wooden stand, its axis tilted 23.4 degrees. It turns on that axis; it rains. (The
  // globe is built with its poles on z, then the joint is turned so the axis stands up, tilted.)
  e('earth (planet)', 'sky', 'planets', () => {
    const c: V = [0, 1.95, 0], R = 1.0;
    const onSphere = (lon: number, lat: number, k: number): { at: V; rot: V } => {
      const n: V = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
      const ry = Math.asin(n[0]), rx = Math.atan2(-n[1], n[2]);
      return { at: [c[0] + n[0] * R * k, c[1] + n[1] * R * k, c[2] + n[2] * R * k], rot: [(rx * 180) / Math.PI, (ry * 180) / Math.PI, 0] };
    };
    const b = m('earth (planet)')
      .cyl([1.3, 0.1, 1.3], [0, 0.05, 0], { color: 'darkwood', edge: 'sharp' })
      .cyl([0.3, 0.72, 0.3], [0, 0.45, 0], { color: 'darkwood', taper: 0.6, edge: 'sharp' })
      .arc([2.3, 2.3, 0.06], [0, c[1], 0], { color: 'brass', arc: 200, rot: [0, 0, -23.4], tube: 0.04, edge: 'sharp' })
      .ball(2 * R, c, { color: '#2a6fd8', name: 'globe', mover: { kind: 'spin', axis: 'z', amount: 60 } });
    const land: Array<[number, number, number, number, string]> = [[0.3, 0.6, 0.75, 0.5, '#4caf50'], [1.9, 0.25, 0.6, 0.7, '#4caf50'], [3.3, -0.35, 0.65, 0.6, '#4caf50'], [4.5, 0.45, 0.6, 0.45, '#c8b070'], [2.6, -0.8, 0.5, 0.35, '#4caf50'], [5.4, -0.2, 0.55, 0.5, '#5fa85a'], [1.0, -0.5, 0.45, 0.3, '#c8b070']];
    for (const [lon, lat, w, hgt, cc] of land) {
      const q = onSphere(lon, lat, 0.96);
      b.ball([w, hgt, 0.18], q.at, { color: cc, rot: q.rot, parent: 'globe' });
    }
    for (const [lon, lat] of [[0.9, 0.2], [3.8, 0.1], [2.2, -0.3], [5.0, 0.6]]) {
      const q = onSphere(lon, lat, 1.01);
      b.ball([0.5, 0.12, 0.06], q.at, { color: 'white', rot: q.rot, parent: 'globe', noInk: true });
    }
    b.dome([1.0, 0.2, 1.0], [c[0], c[1], c[2] + R * 0.92], { color: 'white', rot: [90, 0, 0], parent: 'globe' })
      .dome([0.9, 0.18, 0.9], [c[0], c[1], c[2] - R * 0.92], { color: 'white', rot: [-90, 0, 0], parent: 'globe' })
      .stick([c[0], c[1], c[2] + R], [c[0], c[1], c[2] + R + 0.15], 0.05, 'brass', { parent: 'globe', edge: 'sharp' })
      .stick([c[0], c[1], c[2] - R], [c[0], c[1], c[2] - R - 0.15], 0.05, 'brass', { parent: 'globe', edge: 'sharp' });
    const fig = b
      .act({
        click: [
          [A.operate('globe', 'on'), A.say('Round and round...', 2), A.wait(3), A.operate('globe', 'off')],
          [A.par(A.effect('rain', { dur: 2.5 }), A.say('Pitter patter...', 2))],
        ],
      })
      .done();
    return restTurn(fig, 'globe', [-90, 23.4, 0]);
  }),
  // A blob of earwax on the end of a cotton swab, lying on a tissue. Eww.
  e('earwax', 'clinic', 'body', () =>
    m('earwax')
      .box([0.12, 0.004, 0.1], [0, 0.002, 0], { color: 'white', round: 0.3, edge: 'soft' })
      .rod([-0.05, 0.012, 0.02], [0.05, 0.03, 0.0], 0.004, 'white')
      .ball([0.012, 0.018, 0.012], [-0.052, 0.012, 0.02], { color: 'white', rot: [0, 0, 70] })
      .ball([0.014, 0.02, 0.014], [0.053, 0.031, 0.0], { color: '#c8901a', rot: [0, 0, 70] })
      .ball([0.02, 0.01, 0.016], [0.02, 0.008, -0.025], { color: '#c8901a' })
      .act({ click: [A.anim('wobble'), A.say('Eww!', 1)] })
      .done(),
  ),
  // A painted Easter egg (6 cm) in a nest of green paper grass: blue with pink and yellow bands and dots. It opens
  // like a treat egg and sparkles.
  e('easter egg', 'toys', 'holidays', () => {
    const b = m('easter egg')
      .torus([0.11, 0.11, 0.03], [0, 0.015, 0], { color: 'lime', rot: [90, 0, 0], tube: 0.3 })
      .dome([0.048, 0.03, 0.048], [0, 0.019, 0], { color: '#8ad0f0', rot: [180, 0, 0], name: 'egg' })
      .torus([0.044, 0.044, 0.006], [0, 0.026, 0], { color: 'pink', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .ball([0.03, 0.02, 0.03], [0, 0.04, 0], { color: '#7a4a2a', name: 'treat', scale: 0 })
      .dome([0.048, 0.036, 0.048], [0, 0.052, 0], { color: '#8ad0f0', name: 'top', parent: 'egg', piece: true })
      .torus([0.044, 0.044, 0.006], [0, 0.044, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.1, parent: 'top', noInk: true });
    around(5, 0.024, 0.5).forEach(([x, z], i) => b.ball(0.007, [x, 0.034, z], { color: i % 2 ? 'white' : 'purple', noInk: true }));
    return b
      .act({
        click: [
          [A.pose('top', { move: [0, 0.04, 0], rot: [0, 0, 25], dur: 0.4 }), A.pose('treat', { scale: 1, dur: 0.2 }), A.effect('sparkle', { dur: 1.5 }), A.say('Pop!', 1)],
          [A.pose('treat', { scale: 0, dur: 0.2 }), A.pose('top', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A grey e-reader on a little stand, its page of grey text; a page turns across the screen.
  e('ebook reader', 'tech', 'gadgets', () => {
    const b = m('ebook reader', { edge: 'sharp' })
      .box([0.1, 0.02, 0.06], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.12, 0.17, 0.01], [0, 0.1, 0], { color: '#3a3a3e', round: 0.2 })
      .box([0.1, 0.13, 0.002], [0, 0.11, 0.006], { color: '#e8e8e0' })
      .box([0.05, 0.13, 0.002], [0.025, 0.11, 0.008], { color: '#f2f2ea', name: 'page', pivot: [0, 0.11, 0.008], mover: { kind: 'swing', axis: 'y', amount: -170 } });
    b.each(6, (i) => b.box([0.08, 0.004, 0.001], [0, 0.16 - i * 0.018, 0.0075], { color: '#888888', noInk: true }));
    return b.act({ click: [A.operate('page', 'open'), A.say('Swipe.', 1), A.operate('page', 'close')] }).done();
  }),
  // A boiled egg (5.7 cm) in a yellow egg cup with its top ready to come off, and a brown egg beside it.
  e('egg', 'food', 'eggs', () =>
    m('egg')
      .cyl([0.045, 0.01, 0.045], [0, 0.005, 0], { color: 'yellow', edge: 'sharp' })
      .cyl([0.016, 0.018, 0.016], [0, 0.019, 0], { color: 'yellow' })
      .cyl([0.048, 0.03, 0.048], [0, 0.042, 0], { color: 'yellow', taper: 1.3, name: 'cup' })
      .ball([0.044, 0.057, 0.044], [0, 0.068, 0], { color: '#fbf6ea' })
      .ball([0.034, 0.02, 0.034], [0, 0.093, 0], { color: '#fbf6ea', name: 'cap', parent: 'cup', piece: true })
      .cyl([0.03, 0.004, 0.03], [0, 0.087, 0], { color: '#f6c33a', noInk: true })
      .ball([0.057, 0.044, 0.044], [0.06, 0.022, 0.02], { color: '#d9a46a' })
      .act({ click: [[A.detach('cap', 'shell'), A.say('Crack!', 1)], [A.reattach('cap')]] })
      .done(),
  ),
  // A half-dozen egg carton in grey pulp, its lid hinged at the back; it opens on white and brown eggs.
  e('egg carton', 'food', 'eggs', () => {
    const b = m('egg carton', { edge: 'sharp' })
      .box([0.17, 0.05, 0.11], [0, 0.025, 0], { color: '#cfc6b0', round: 0.2 })
      .box([0.17, 0.04, 0.115], [0, 0.072, 0], { color: '#cfc6b0', round: 0.3, name: 'lid', pivot: [0, 0.055, -0.055], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .label('EGGS', [0.1, 0.03], [0, 0.093, 0], { color: '#cfc6b0', rot: [-90, 0, 0], parent: 'lid', depth: 0.002 });
    b.each(6, (i) => b.ball([0.042, 0.05, 0.042], [-0.05 + (i % 3) * 0.05, 0.058, i < 3 ? -0.026 : 0.026], { color: i % 2 ? '#fbf6ea' : '#e8c89a', edge: 'soft' }));
    return b.act({ click: [A.operate('lid', 'open'), A.wait(2), A.operate('lid', 'close')] }).done();
  }),
  // A glass mug of creamy eggnog with whipped cream, a dusting of nutmeg and a cinnamon stick; slurp.
  e('eggnog', 'food', 'drinks', () =>
    mug('eggnog', GLASS, '#f6e7b0', 0.08, 0.11)
      .cyl([0.074, 0.09, 0.074], [0, 0.05, 0], { color: '#f6e7b0' })
      .ball([0.075, 0.035, 0.075], [0, 0.115, 0], { color: 'white' })
      .ball(0.006, [0.01, 0.133, 0.01], { color: '#8a5a2b', noInk: true })
      .ball(0.006, [-0.012, 0.13, -0.004], { color: '#8a5a2b', noInk: true })
      .stick([0.015, 0.09, 0], [0.03, 0.19, -0.01], 0.012, '#8a4a1a')
      .act({ click: [A.set({ tilt: -30, dur: 0.4 }), A.say('Slurp!', 1), A.wait(0.8), A.set({ tilt: 0, dur: 0.4 })] })
      .done(),
  ),
  // An eighth note: a black oval head, a stem and a curling flag; it bounces along to the beat.
  e('eighth note', 'music', 'music symbols', () =>
    m('eighth note')
      .ball([0.05, 0.035, 0.026], [0, 0.02, 0], { color: 'black', rot: [0, 0, 25] })
      .stick([0.021, 0.022, 0], [0.021, 0.11, 0], 0.008, 'black')
      .rod([0.021, 0.11, 0], [0.042, 0.088, 0], 0.012, 'black')
      .rod([0.042, 0.088, 0], [0.046, 0.06, 0], 0.01, 'black')
      .act({ click: [A.anim('bounce', 2), A.say('Doo-doo!', 1.2)] })
      .done(),
  ),
  // An anatomy model of a bent arm on a stand: upper arm, the knobbly point of the elbow, the forearm and hand, a
  // blue sleeve cuff; the forearm bends at the elbow.
  e('elbow', 'clinic', 'body parts', () =>
    m('elbow')
      .box([0.14, 0.02, 0.1], [0, 0.01, 0], { color: 'stone', round: 0.3, edge: 'sharp' })
      .rod([0, 0.02, 0], [-0.02, 0.24, 0], 0.07, 'skin2')
      .cyl([0.09, 0.06, 0.09], [-0.02, 0.24, 0], { color: 'blue' })
      .ball(0.075, [0.0, 0.03, 0], { color: '#e8b090' })
      .rod([0.0, 0.035, 0], [0.18, 0.04, 0], 0.06, 'skin2', { name: 'fore', pivot: [0, 0.035, 0], mover: { kind: 'swing', axis: 'z', amount: 50 } })
      .ball([0.07, 0.04, 0.06], [0.22, 0.04, 0], { color: 'skin2', parent: 'fore' })
      .act({ click: [A.operate('fore', 'open'), A.say('Bend...', 1), A.operate('fore', 'close')] })
      .done(),
  ),
  // A pair of skate elbow pads: hard black caps on blue padded sleeves with white straps; bonk-proof.
  e('elbow pads', 'sports', 'protective gear', () => {
    const b = m('elbow pads');
    b.pair((s) => {
      b.cyl([0.08, 0.13, 0.07], [s * 0.07, 0.065, -0.01], { color: '#3a6fd8' });
      b.ball([0.09, 0.11, 0.06], [s * 0.07, 0.065, 0.02], { color: '#222222' });
      b.box([0.085, 0.015, 0.075], [s * 0.07, 0.025, -0.005], { color: 'white', round: 0.4, edge: 'sharp' });
      b.box([0.085, 0.015, 0.075], [s * 0.07, 0.11, -0.005], { color: 'white', round: 0.4, edge: 'sharp' });
    });
    return b.act({ click: [A.anim('bounce'), A.say('Bonk! Safe.', 1.2)] }).done();
  }),
];
