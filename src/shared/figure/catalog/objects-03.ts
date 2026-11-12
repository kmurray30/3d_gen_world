/** Catalog chunk objects-03: the words in assign/objects-03.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M } from '../dsl';
import { hat, who } from '../accessories';

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
    .cyl([w, h * 0.62, w], [0, h * 0.31, 0], { color: c })
    .ball([w, w * 0.7, w], [0, h * 0.62, 0], { color: c })
    .cyl([w * 0.38, h * 0.24, w * 0.38], [0, h * 0.74, 0], { color: c })
    .cyl([w * 0.46, h * 0.12, w * 0.46], [0, h * 0.92, 0], { color: cap });
  if (text) b.label(text, [w * 0.8, h * 0.26], [0, h * 0.3, w / 2 + 0.004], { color: labelC });
  return b;
}

/** A squeeze bottle (shampoo, lotion): rounded body and a flip cap on top. */
function squeeze(k: string, c: string, cap: string, h: number, w: number, text: string): M {
  return m(k)
    .box([w, h * 0.82, w * 0.6], [0, h * 0.41, 0], { color: c, round: 0.8 })
    .cyl([w * 0.62, h * 0.18, w * 0.5], [0, h * 0.9, 0], { color: cap })
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

/** A book standing up, cover facing you, spine on the right (-x), pages on the left. */
function book(k: string, c: string, text: string, w = 0.2, h = 0.27, t = 0.03, spine = c): M {
  return m(k)
    .box([w, h, t], [0, h / 2, 0], { color: c, round: 0.1 })
    .box([0.012, h * 0.95, t * 0.8], [w / 2, h / 2, 0], { color: 'paper', round: 0.2 })
    .box([0.02, h, t * 1.1], [-w / 2 + 0.01, h / 2, 0], { color: spine, round: 0.3 })
    .label(text, [w * 0.78, h * 0.18], [0.005, h * 0.8, t / 2 + 0.008], { color: 'white' });
}

/** A road sign on a post: shape 'diamond' | 'round' | 'rect' | 'tri'. Returns the builder and the sign centre. */
function roadSign(k: string, shape: 'diamond' | 'round' | 'rect' | 'tri', c: string, s: number, h: number, border = 'black'): M {
  const b = m(k)
    .box([0.3, 0.16, 0.3], [0, 0.08, 0], { color: 'stone', round: 0.2 })
    .stick([0, 0.1, 0], [0, h, 0], 0.05, 'silver');
  if (shape === 'diamond') b.box([s * 0.74, s * 0.74, 0.02], [0, h, 0.04], { color: border, round: 0.1, rot: [0, 0, 45] }).box([s * 0.66, s * 0.66, 0.02], [0, h, 0.05], { color: c, round: 0.1, rot: [0, 0, 45] });
  if (shape === 'round') b.cyl([s, 0.02, s], [0, h, 0.04], { color: border, rot: [90, 0, 0] }).cyl([s * 0.9, 0.02, s * 0.9], [0, h, 0.05], { color: c, rot: [90, 0, 0] });
  if (shape === 'rect') b.box([s * 1.3, s * 0.8, 0.02], [0, h, 0.04], { color: border, round: 0.15 }).box([s * 1.22, s * 0.72, 0.02], [0, h, 0.05], { color: c, round: 0.15 });
  if (shape === 'tri') b.wedge([s * 1.1, s, 0.02], [0, h, 0.04], { color: border }).wedge([s * 0.86, s * 0.78, 0.02], [0, h - s * 0.06, 0.05], { color: c });
  return b;
}

interface Bld {
  w: number;
  h: number;
  d: number;
  wall: string;
  roof?: string;
  gable?: number;
  sign: string;
  signC?: string;
  door?: string;
  win?: [number, number];
  noSideWin?: boolean;
}
/** A small building: walls, a flat or gabled roof, a door that opens, a sign over it, windows. */
function bld(k: string, o: Bld): M {
  const { w, h, d } = o;
  const fz = d / 2;
  const b = m(k).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.gable) b.wedge([w * 1.1, o.gable, d * 1.08], [0, h + o.gable / 2, 0], { color: o.roof ?? 'darkred' });
  else {
    const rt = Math.max(0.2, h * 0.04);
    b.box([w * 1.04, rt, d * 1.04], [0, h + rt / 2, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  }
  const dh = Math.min(2.3, h * 0.42), dw = dh * 0.55;
  b.box([dw, dh, 0.08], [0, dh / 2, fz + 0.03], { color: o.door ?? 'darkwood', round: 0.1, name: 'door', pivot: [-dw / 2, dh / 2, fz + 0.03] });
  b.ball(dh * 0.05, [dw * 0.3, dh * 0.48, fz + 0.08], { color: 'gold', parent: 'door' });
  const sh = Math.min(1.2, Math.max(0.45, h * 0.1)), sy = dh + sh / 2 + 0.25;
  b.label(o.sign, [Math.min(w * 0.85, sh * o.sign.length * 0.6 + 0.4), sh], [0, sy, fz + 0.06], { color: o.signC ?? 'white' });
  if (!o.noSideWin && w > dw * 3) b.pair((s) => b.box([w * 0.22, dh * 0.5, 0.06], [s * w * 0.3, dh * 0.55, fz + 0.01], { color: GLASS, round: 0.1 }));
  const [rows, cols] = o.win ?? [0, 0];
  const y0 = sy + sh / 2 + 0.3, y1 = h - 0.3;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cw = (w * 0.84) / cols, rh = (y1 - y0) / rows;
      b.box([Math.min(cw * 0.6, 1.3), Math.min(rh * 0.62, 1.6), 0.06], [-w * 0.42 + cw * (c + 0.5), y0 + rh * (r + 0.5), fz + 0.01], { color: GLASS, round: 0.1 });
    }
  return b;
}

/** A palm tree: a gently bent trunk and a swaying crown of fronds with fruit under it. */
function palm(k: string, h: number, fruit: string, fs: number, n: number, bendF = 0.12): M {
  const bend = h * bendF;
  const b = m(k);
  const pts: V[] = [0, 0.34, 0.67, 1].map((t) => [bend * t * t, h * t, 0]);
  for (let i = 0; i < 3; i++) b.stick(pts[i], pts[i + 1], h * (0.065 - i * 0.01), i % 2 ? '#8a6a45' : '#a07d55');
  const top: V = [bend, h, 0];
  b.ball(h * 0.1, top, { color: '#6a5a2a', name: 'top' });
  around(8, 1, 0.3).forEach(([x, z], i) => {
    const r1 = h * 0.2, r2 = h * (0.36 + (i % 2) * 0.04);
    const mid: V = [top[0] + x * r1, h + h * 0.06, z * r1];
    const tip: V = [top[0] + x * r2, h - h * 0.1, z * r2];
    b.rod(top, mid, h * 0.045, i % 2 ? 'leaf' : 'green', { parent: 'top' });
    b.rod(mid, tip, h * 0.035, i % 2 ? 'leaf' : 'green', { parent: 'top' });
  });
  b.each(n, (i) => {
    const a = i * 2.4;
    b.ball(fs, [top[0] + Math.cos(a) * h * 0.045, h - h * 0.05 - (i % 3) * fs * 0.4, Math.sin(a) * h * 0.045 + h * 0.02], { color: fruit, parent: 'top' });
  });
  return b;
}

/** A dress standing on its hem: flared skirt, fitted bodice, straps. */
function dress(k: string, c: string, H: number, flare: number, trim?: string): M {
  const sk = H * 0.56, bd = H * 0.3, waist = H * 0.24;
  const b = m(k)
    .cyl([flare, sk, flare * 0.75], [0, sk / 2, 0], { color: c, taper: waist / flare })
    .cyl([waist, bd, waist * 0.72], [0, sk + bd / 2, 0], { color: c, taper: 1.3 });
  b.pair((s) => b.rod([s * waist * 0.45, sk + bd - 0.02, 0], [s * waist * 0.38, sk + bd + H * 0.08, -0.01], 0.022, c));
  if (trim) b.cyl([waist * 1.06, H * 0.035, waist * 0.78], [0, sk + 0.01, 0], { color: trim });
  return b;
}

/** A boot at x: sole, foot, shaft. */
function boot(b: M, x: number, c: string, sh: number, sole = 'black', toe = 0.25): M {
  return b
    .box([0.11, 0.035, toe + 0.04], [x, 0.0175, 0.02], { color: sole, round: 0.3 })
    .box([0.105, 0.09, toe], [x, 0.075, 0.03], { color: c, round: 0.7 })
    .cyl([0.11, sh, 0.12], [x, 0.06 + sh / 2, -0.05], { color: c })
    .cyl([0.12, 0.025, 0.13], [x, 0.06 + sh, -0.05], { color: c });
}

/** A coat or jacket hanging straight: body, sleeves, collar, buttons. */
function jacket(k: string, c: string, H: number, trim: string): M {
  const w = H * 0.6;
  const b = m(k)
    .box([w, H * 0.86, w * 0.4], [0, H * 0.43, 0], { color: c, round: 0.3 })
    .box([0.006, H * 0.7, 0.01], [0, H * 0.4, w * 0.2 + 0.004], { color: trim, noInk: true });
  b.pair((s) => {
    b.rod([s * w * 0.48, H * 0.8, 0], [s * w * 0.66, H * 0.1, 0], H * 0.17, c);
    b.wedge([w * 0.3, H * 0.16, 0.04], [s * w * 0.18, H * 0.82, w * 0.2 + 0.01], { color: c, rot: [0, 0, s * 150] });
  });
  b.each(4, (i) => b.ball(H * 0.03, [0.03, H * (0.68 - i * 0.17), w * 0.2 + 0.01], { color: trim }));
  return b;
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

/* ----- the entries ----- */

export const ENTRIES: CatalogEntry[] = [
  e('coat hanger', 'home', 'laundry', () =>
    m('coat hanger')
      .rod([-0.21, 0.03, 0], [0.21, 0.03, 0], 0.022, 'wood')
      .rod([-0.21, 0.03, 0], [0, 0.17, 0], 0.032, 'wood')
      .rod([0.21, 0.03, 0], [0, 0.17, 0], 0.032, 'wood')
      .stick([0, 0.17, 0], [0, 0.222, 0], 0.008, 'silver')
      .torus([0.06, 0.06, 0.008], [0.022, 0.248, 0], { color: 'silver', tube: 0.15 })
      .done(),
  ),
  e('cobblestone', 'workshop', 'building materials', () =>
    m('cobblestone')
      .box([0.48, 0.02, 0.38], [0, 0.01, 0], { color: 'sand', round: 0.3 })
      .box([0.16, 0.1, 0.14], [0, 0.06, 0.02], { color: '#8d8a86', round: 0.7 })
      .box([0.13, 0.09, 0.12], [0.16, 0.055, 0.03], { color: '#7b7772', round: 0.7, rot: [0, 15, 0] })
      .box([0.13, 0.09, 0.13], [-0.15, 0.055, 0.04], { color: '#9a958e', round: 0.7, rot: [0, -10, 0] })
      .box([0.14, 0.09, 0.12], [0.07, 0.055, -0.12], { color: '#85817b', round: 0.7, rot: [0, 8, 0] })
      .box([0.12, 0.09, 0.12], [-0.09, 0.055, -0.11], { color: '#6f6b66', round: 0.7 })
      .done(),
  ),
  e('cobweb', 'bugs', 'spiders', () => {
    const cy = 0.15;
    const b = m('cobweb')
      .stick([-0.135, 0, 0], [-0.135, 0.29, 0], 0.02, 'bark')
      .stick([0.135, 0, 0], [0.135, 0.29, 0], 0.02, 'bark');
    b.each(8, (i) => {
      const a = (i * Math.PI) / 4;
      b.rod([0, cy, 0], [Math.cos(a) * 0.128, cy + Math.sin(a) * 0.128, 0], 0.004, 'white', { noInk: true });
    });
    for (const r of [0.08, 0.15, 0.22]) b.torus([r, r, 0.004], [0, cy, 0], { color: 'white', tube: 0.05 });
    return b
      .ball([0.03, 0.026, 0.022], [0.02, cy + 0.03, 0.01], { color: 'black' })
      .ball(0.016, [0.02, cy + 0.052, 0.01], { color: 'black' })
      .done();
  }),
  e('cocktail dress', 'wardrobe', 'dresses', () => dress('cocktail dress', '#1d1d22', 1.0, 0.52, 'silver').ball(0.06, [0.08, 0.57, 0.1], { color: 'silver' }).done()),
  e('cocoa', 'food', 'hot drinks', () =>
    mug('cocoa', 'red', 'chocolate')
      .box([0.026, 0.022, 0.026], [-0.016, 0.103, 0.008], { color: 'white', round: 0.5 })
      .box([0.026, 0.022, 0.026], [0.016, 0.104, -0.01], { color: 'white', round: 0.5, rot: [0, 30, 0] })
      .box([0.026, 0.022, 0.026], [0.004, 0.106, 0.02], { color: 'white', round: 0.5, rot: [0, 50, 0] })
      .rod([-0.01, 0.125, 0], [0.004, 0.155, 0], 0.008, 'white', { noInk: true })
      .rod([0.004, 0.155, 0], [-0.008, 0.185, 0], 0.008, 'white', { noInk: true })
      .done(),
  ),
  e('coconut', 'food', 'fruit', () =>
    m('coconut')
      .ball([0.18, 0.17, 0.18], [-0.05, 0.085, -0.02], { color: '#6b4423' })
      .ball(0.022, [-0.07, 0.155, 0.03], { color: '#3a2414', noInk: true })
      .ball(0.022, [-0.03, 0.155, 0.03], { color: '#3a2414', noInk: true })
      .ball(0.022, [-0.05, 0.142, 0.055], { color: '#3a2414', noInk: true })
      .cyl([0.13, 0.06, 0.13], [0.1, 0.03, 0.07], { color: '#6b4423', taper: 1.3 })
      .cyl([0.165, 0.012, 0.165], [0.1, 0.064, 0.07], { color: 'white' })
      .cyl([0.11, 0.004, 0.11], [0.1, 0.071, 0.07], { color: '#f4f0e0', noInk: true })
      .done(),
  ),
  e('coconut milk', 'food', 'drinks', () =>
    carton('coconut milk', 'white', '#6b4423', 'COCONUT', 0.25, 0.1)
      .ball([0.05, 0.05, 0.02], [0, 0.06, 0.05], { color: '#6b4423' })
      .ball([0.034, 0.02, 0.01], [0, 0.073, 0.06], { color: 'white', noInk: true })
      .done(),
  ),
  e('coconut tree', 'garden', 'palm trees', () => palm('coconut tree', 7, '#6b4a2b', 0.32, 5).done()),
  e('cocoon', 'bugs', 'life cycle', () =>
    m('cocoon')
      .ball([0.09, 0.03, 0.07], [-0.07, 0.012, 0], { color: 'rock' })
      .stick([-0.07, 0.02, 0], [-0.07, 0.175, 0], 0.012, 'bark')
      .rod([-0.07, 0.17, 0], [0.07, 0.18, 0], 0.01, 'bark')
      .ball([0.04, 0.018, 0.006], [0.05, 0.19, 0.005], { color: 'leaf', rot: [0, 0, 30] })
      .stick([0.02, 0.175, 0], [0.02, 0.14, 0], 0.003, 'white')
      .ball([0.038, 0.08, 0.038], [0.02, 0.1, 0], { color: '#cdbb8a' })
      .torus([0.038, 0.038, 0.004], [0.02, 0.085, 0], { color: '#a8966a', rot: [90, 0, 0], noInk: true })
      .torus([0.036, 0.036, 0.004], [0.02, 0.112, 0], { color: '#a8966a', rot: [90, 0, 0], noInk: true })
      .done(),
  ),
  e('coffee', 'food', 'hot drinks', () =>
    m('coffee')
      .cyl([0.15, 0.012, 0.15], [0, 0.006, 0], { color: 'white' })
      .cyl([0.085, 0.065, 0.085], [0, 0.044, 0], { color: 'white', taper: 1.2 })
      .cyl([0.09, 0.008, 0.09], [0, 0.074, 0], { color: 'coffee', noInk: true })
      .torus([0.042, 0.042, 0.012], [0.056, 0.046, 0], { color: 'white', tube: 0.3 })
      .rod([-0.01, 0.09, 0], [0.004, 0.125, 0], 0.008, 'white', { noInk: true })
      .rod([0.004, 0.125, 0], [-0.008, 0.16, 0], 0.008, 'white', { noInk: true })
      .rod([0.02, 0.095, -0.01], [0.03, 0.13, -0.01], 0.007, 'white', { noInk: true })
      .done(),
  ),
  e('coffee bean', 'food', 'coffee', () => {
    const b = m('coffee bean');
    const bean = (at: V, r: V) => b.ball([0.05, 0.035, 0.072], at, { color: '#5a3418', rot: r }).box([0.006, 0.004, 0.06], [at[0], at[1] + 0.0165, at[2]], { color: '#24130a', rot: r, noInk: true });
    bean([-0.03, 0.0175, 0], [0, 20, 0]);
    bean([0.03, 0.0175, 0.01], [0, -30, 0]);
    bean([0.0, 0.045, 0.005], [0, 75, 8]);
    return b.done();
  }),
  e('coffee filter', 'kitchen', 'coffee', () => {
    const b = m('coffee filter')
      .cyl([0.06, 0.08, 0.06], [0, 0.04, 0], { color: '#f6efe0', taper: 2.0 })
      .ball([0.105, 0.03, 0.105], [0, 0.079, 0], { color: '#4a2c1a' });
    around(10, 1).forEach(([x, z]) => b.rod([x * 0.031, 0.004, z * 0.031], [x * 0.061, 0.078, z * 0.061], 0.004, '#ddd2bc', { noInk: true }));
    return b.done();
  }),
  e('coffee grinder', 'kitchen', 'coffee', () =>
    m('coffee grinder')
      .box([0.13, 0.12, 0.13], [0, 0.06, 0], { color: 'wood', round: 0.1 })
      .box([0.09, 0.04, 0.01], [0, 0.04, 0.068], { color: 'darkwood' })
      .ball(0.014, [0, 0.04, 0.078], { color: 'brass' })
      .cyl([0.1, 0.05, 0.1], [0, 0.145, 0], { color: 'brass', taper: 1.3 })
      .cyl([0.02, 0.04, 0.02], [0, 0.185, 0], { color: 'iron' })
      .rod([0, 0.205, 0], [0.09, 0.205, 0], 0.012, 'iron', { name: 'crank', pivot: [0, 0.205, 0] })
      .stick([0.09, 0.205, 0], [0.09, 0.24, 0], 0.012, 'iron', { parent: 'crank' })
      .ball([0.025, 0.04, 0.025], [0.09, 0.255, 0], { color: 'darkwood', parent: 'crank' })
      .done(),
  ),
  e('coffee pot', 'kitchen', 'coffee', () =>
    m('coffee pot')
      .cyl([0.13, 0.09, 0.13], [0, 0.045, 0], { color: 'coffee' })
      .cyl([0.13, 0.065, 0.13], [0, 0.122, 0], { color: GLASS, taper: 0.75 })
      .cyl([0.1, 0.035, 0.1], [0, 0.168, 0], { color: 'black' })
      .ball([0.09, 0.04, 0.09], [0, 0.187, 0], { color: 'black', name: 'lid', pivot: [0, 0.187, -0.045] })
      .ball(0.022, [0, 0.207, 0], { color: 'black', parent: 'lid' })
      .box([0.04, 0.02, 0.04], [0, 0.172, 0.06], { color: 'black' })
      .torus([0.1, 0.12, 0.022], [-0.085, 0.1, 0], { color: 'black' })
      .done(),
  ),
  e('coffee shop', 'places', 'shops', () => {
    const b = bld('coffee shop', { w: 5, h: 3.6, d: 4, wall: '#d8b48a', roof: '#5a3a22', sign: 'COFFEE', signC: '#3b2414', door: '#3b2414' });
    b.each(6, (i) => b.box([0.84, 0.08, 1.1], [-2.1 + i * 0.84, 2.62, 2.45], { color: i % 2 ? 'white' : 'darkgreen', round: 0.1, rot: [25, 0, 0] }));
    return b
      .cyl([1.0, 0.9, 1.0], [0, 4.25, 0], { color: 'white' })
      .cyl([0.86, 0.05, 0.86], [0, 4.69, 0], { color: 'coffee', noInk: true })
      .torus([0.6, 0.6, 0.14], [0.6, 4.25, 0], { color: 'white' })
      .rod([-0.1, 4.85, 0], [0.05, 5.3, 0], 0.08, 'white', { noInk: true })
      .done();
  }),
  e('coffee table', 'home', 'tables', () => {
    const b = m('coffee table')
      .box([1.1, 0.08, 0.6], [0, 0.41, 0], { color: 'wood', round: 0.2 })
      .box([0.98, 0.03, 0.5], [0, 0.12, 0], { color: 'darkwood' });
    for (const [x, z] of [[0.5, 0.25], [-0.5, 0.25], [0.5, -0.25], [-0.5, -0.25]]) b.stick([x, 0, z], [x, 0.37, z], 0.05, 'darkwood');
    return b
      .box([0.3, 0.03, 0.22], [-0.25, 0.465, 0], { color: 'blue', round: 0.2, rot: [0, 15, 0] })
      .cyl([0.08, 0.09, 0.08], [0.3, 0.495, 0.05], { color: 'white' })
      .done();
  }),
  e('coffeemaker', 'kitchen', 'coffee', () =>
    m('coffeemaker')
      .box([0.22, 0.035, 0.25], [0, 0.0175, 0.02], { color: '#222222' })
      .box([0.22, 0.36, 0.1], [0, 0.18, -0.08], { color: '#222222' })
      .box([0.22, 0.08, 0.25], [0, 0.32, 0.02], { color: '#222222' })
      .box([0.14, 0.05, 0.14], [0, 0.255, 0.04], { color: '#333333' })
      .cyl([0.13, 0.075, 0.13], [0, 0.0725, 0.04], { color: 'coffee' })
      .cyl([0.13, 0.08, 0.13], [0, 0.15, 0.04], { color: GLASS, taper: 0.7 })
      .cyl([0.1, 0.02, 0.1], [0, 0.198, 0.04], { color: '#222222' })
      .torus([0.09, 0.11, 0.02], [0.08, 0.12, 0.04], { color: '#222222' })
      .ball(0.018, [0.07, 0.022, 0.148], { color: 'red', glow: true })
      .done(),
  ),
  e('coffin', 'fantasy', 'spooky', () =>
    m('coffin')
      .cyl([0.42, 1.45, 0.32], [0, 0.725, 0], { color: '#5a3a22', taper: 1.6 })
      .cyl([0.67, 0.5, 0.32], [0, 1.7, 0], { color: '#5a3a22', taper: 0.65 })
      .box([0.08, 0.55, 0.03], [0, 1.25, 0.165], { color: 'gold', round: 0.2 })
      .box([0.32, 0.08, 0.03], [0, 1.4, 0.165], { color: 'gold', round: 0.2 })
      .box([0.06, 0.3, 0.05], [0.3, 1.0, 0.0], { color: 'brass', round: 0.5, rot: [0, 0, 8] })
      .box([0.06, 0.3, 0.05], [-0.3, 1.0, 0.0], { color: 'brass', round: 0.5, rot: [0, 0, -8] })
      .done(),
  ),
  e('coin (money)', 'home', 'money', () => {
    const b = m('coin (money)')
      .cyl([0.1, 0.014, 0.1], [0, 0.05, 0], { color: 'gold', rot: [90, 0, 0] })
      .torus([0.1, 0.1, 0.018], [0, 0.05, 0], { color: '#c99a2e', tube: 0.08 })
      .star(0.045, [0, 0.05, 0.008], { color: '#f2d26a' });
    b.each(4, (i) => b.cyl([0.08, 0.01, 0.08], [0.085, 0.005 + i * 0.011, 0.035], { color: i % 2 ? 'gold' : '#d9aa3a' }));
    return b.done();
  }),
  e('coin machine', 'tech', 'machines', () => {
    const b = m('coin machine')
      .box([0.9, 1.75, 0.8], [0, 0.875, 0], { color: 'red', round: 0.08 })
      .box([0.58, 1.1, 0.04], [-0.1, 1.05, 0.4], { color: GLASS, round: 0.1 })
      .box([0.2, 0.55, 0.03], [0.31, 1.15, 0.405], { color: '#333333' })
      .box([0.08, 0.03, 0.02], [0.31, 1.3, 0.425], { color: 'black' })
      .box([0.12, 0.08, 0.02], [0.31, 1.15, 0.425], { color: 'lime', glow: true })
      .box([0.56, 0.16, 0.04], [-0.1, 0.25, 0.41], { color: 'black' })
      .label('SNACKS', [0.7, 0.14], [0, 1.67, 0.41], { color: 'white' });
    b.each(12, (i) => b.box([0.12, 0.13, 0.03], [-0.28 + (i % 3) * 0.18, 0.7 + Math.floor(i / 3) * 0.25, 0.43], { color: COLS[i % COLS.length], round: 0.3 }));
    return b.done();
  }),
  e('coin purse', 'wardrobe', 'bags', () =>
    m('coin purse')
      .box([0.12, 0.08, 0.05], [0, 0.04, 0], { color: '#d6456a', round: 0.9 })
      .rod([-0.052, 0.078, 0], [0.052, 0.078, 0], 0.009, 'gold')
      .ball(0.017, [-0.008, 0.094, 0], { color: 'gold' })
      .ball(0.017, [0.008, 0.094, 0], { color: 'gold' })
      .ball([0.03, 0.03, 0.01], [0, 0.038, 0.025], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('cold cuts', 'food', 'meat', () => {
    const b = m('cold cuts').box([0.3, 0.02, 0.18], [0, 0.01, 0], { color: 'lightwood', round: 0.3 });
    b.each(5, (i) => b.cyl([0.11, 0.01, 0.11], [-0.11 + i * 0.045, 0.065, -0.03], { color: i % 2 ? '#d9707a' : '#b8303a', rot: [60, 0, 0] }));
    b.each(3, (i) => b.ball(0.01, [-0.11 + i * 0.09, 0.08, 0.0], { color: 'white', noInk: true }));
    return b
      .cyl([0.035, 0.1, 0.035], [0.02, 0.038, 0.055], { color: '#f2a5a5', rot: [0, 0, 90] })
      .cyl([0.035, 0.1, 0.035], [0.03, 0.07, 0.05], { color: '#f2a5a5', rot: [0, 20, 90] })
      .done();
  }),
  e('cold pack', 'clinic', 'first aid', () => {
    const b = m('cold pack').box([0.18, 0.14, 0.035], [0, 0.07, 0], { color: '#3a8fd8', round: 0.7, rot: [-8, 0, 0] });
    b.each(3, (i) => b.box([0.09, 0.012, 0.006], [0, 0.075, 0.022], { color: 'white', rot: [-8, 0, i * 60], noInk: true }));
    return b.ball(0.018, [0, 0.075, 0.024], { color: 'white', noInk: true }).done();
  }),
  e('coleslaw', 'food', 'sides', () => {
    const b = bowl('coleslaw', 'white', '#eef0c8');
    b.each(6, (i) => b.rod([-0.05 + i * 0.02, 0.083, -0.02 + (i % 3) * 0.02], [-0.03 + i * 0.02, 0.085, 0.02 - (i % 2) * 0.03], 0.007, i % 2 ? 'orange' : 'purple', { noInk: true }));
    return b.done();
  }),
  e('collard greens', 'food', 'vegetables', () => {
    const b = m('collard greens').cyl([0.05, 0.08, 0.05], [0, 0.04, 0], { color: '#b5d68a' }).cyl([0.056, 0.02, 0.056], [0, 0.05, 0], { color: 'red' });
    b.each(5, (i) => {
      const a = (-40 + i * 20) * (Math.PI / 180);
      const z = (i % 2 ? 0.02 : -0.02);
      b.ball([0.14, 0.22, 0.025], [Math.sin(a) * 0.15, 0.08 + Math.cos(a) * 0.15, z], { color: i % 2 ? 'darkgreen' : '#2f6b2a', rot: [z * 300, 0, (-a * 180) / Math.PI] });
      b.rod([0, 0.07, z], [Math.sin(a) * 0.2, 0.08 + Math.cos(a) * 0.2, z + 0.013], 0.008, '#b5d68a', { noInk: true });
    });
    return b.done();
  }),
  e('college', 'places', 'schools', () =>
    bld('college', { w: 10, h: 6, d: 5, wall: '#c9a882', roof: '#55606e', sign: 'COLLEGE', signC: 'navy', win: [1, 6] })
      .box([2.4, 3, 2.4], [0, 7.5, 0], { color: '#c9a882', round: 0.05 })
      .cyl([1.3, 0.1, 1.3], [0, 7.6, 1.22], { color: 'white', rot: [90, 0, 0] })
      .box([0.08, 0.5, 0.04], [0, 7.8, 1.3], { color: 'black' })
      .box([0.35, 0.08, 0.04], [0.15, 7.6, 1.3], { color: 'black' })
      .cone([2.8, 2.4, 2.8], [0, 10.2, 0], { color: '#55606e' })
      .box([3.4, 0.3, 1.0], [0, 0.15, 3.0], { color: 'stone' })
      .done(),
  ),
  e('colored pencil', 'study', 'art supplies', () => {
    const b = m('colored pencil');
    ([['red', -0.026, 0.15], ['blue', 0, 0.17], ['green', 0.026, 0.14]] as Array<[string, number, number]>).forEach(([c, x, h]) =>
      b.cyl([0.024, h, 0.024], [x, h / 2, 0], { color: c, segs: 6 })
        .cyl([0.024, 0.03, 0.024], [x, h + 0.015, 0], { color: '#f0d2a0', taper: 0.35 })
        .cone([0.0095, 0.014, 0.0095], [x, h + 0.035, 0], { color: c })
        .cyl([0.0245, 0.006, 0.0245], [x, h * 0.2, 0], { color: 'gold', noInk: true }),
    );
    return b.done();
  }),
  e('coloring book', 'study', 'books', () =>
    book('coloring book', '#f7d23e', 'COLOR ME', 0.22, 0.28, 0.02, '#e0a020')
      .star(0.07, [-0.05, 0.12, 0.012], { color: 'red' })
      .heart(0.06, [0.05, 0.13, 0.012], { color: 'blue' })
      .ball([0.05, 0.05, 0.01], [0.0, 0.05, 0.012], { color: 'green' })
      .stick([0.13, 0, 0.04], [0.11, 0.12, 0.03], 0.018, 'red')
      .done(),
  ),
  e('colosseum', 'places', 'landmarks', () => {
    const b = m('colosseum').cyl([0.56, 0.02, 0.48], [0, 0.01, 0], { color: 'sand' }).cyl([0.36, 0.03, 0.28], [0, 0.02, 0], { color: '#d9c08a' });
    around(14, 1).forEach(([x, z], i) => {
      const hh = z > 0.2 ? 0.16 + 0.1 * Math.abs(x) : 0.3;
      const a = Math.atan2(z, x);
      const ry = 90 - (a * 180) / Math.PI;
      b.box([0.105, hh, 0.04], [x * 0.25, hh / 2 + 0.01, z * 0.21], { color: '#d8c4a0', round: 0.1, rot: [0, ry, 0] });
      for (const ty of [0.06, 0.15, 0.24]) if (ty + 0.04 < hh) b.box([0.04, 0.055, 0.01], [x * 0.272, ty, z * 0.232], { color: '#6a5640', round: 0.4, rot: [0, ry, 0], noInk: true });
      void i;
    });
    return b.done();
  }),
  e('comb', 'home', 'bathroom', () => {
    const b = m('comb').box([0.16, 0.026, 0.015], [0, 0.065, 0], { color: '#8b4a2b', round: 0.4 });
    b.each(16, (i) => b.box([0.0045, 0.054, 0.009], [-0.0725 + i * 0.00967, 0.027, 0], { color: '#8b4a2b', round: 0.3 }));
    return b.done();
  }),
  e('combat boots', 'wardrobe', 'shoes', () => {
    const b = m('combat boots');
    b.pair((s) => {
      boot(b, s * 0.075, '#2f2f28', 0.2, 'black', 0.22);
      b.each(4, (i) => b.box([0.06, 0.008, 0.01], [s * 0.075, 0.1 + i * 0.045, 0.012], { color: 'tan', noInk: true }));
    });
    return b.done();
  }),
  e('comedy club', 'places', 'entertainment', () => {
    const b = bld('comedy club', { w: 6, h: 4, d: 4, wall: '#4a2f5a', roof: '#2a1a33', sign: 'COMEDY', signC: 'gold', door: 'darkred' });
    b.each(9, (i) => b.ball(0.13, [-1.6 + i * 0.4, 2.5, 2.1], { color: 'yellow', glow: true }));
    return b
      .star(1.3, [0, 4.9, 0], { color: 'gold' })
      .stick([1.7, 0, 2.5], [1.7, 1.5, 2.5], 0.06, 'black')
      .ball([0.16, 0.24, 0.16], [1.7, 1.62, 2.5], { color: 'darkgray' })
      .done();
  }),
  e('comedy mask', 'ideas', 'theatre', () => {
    const b = m('comedy mask')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'darkwood' })
      .stick([0, 0, 0], [0, 0.13, 0], 0.02, 'darkwood')
      .ball([0.22, 0.26, 0.07], [0, 0.24, 0], { color: 'gold' })
      .ball([0.13, 0.065, 0.02], [0, 0.18, 0.028], { color: '#3a1a0a' })
      .ball([0.13, 0.05, 0.02], [0, 0.198, 0.036], { color: 'gold', noInk: true });
    b.pair((s) => {
      b.ball([0.055, 0.03, 0.02], [s * 0.05, 0.27, 0.03], { color: '#3a1a0a', rot: [0, 0, s * 20] });
      b.ball([0.036, 0.022, 0.01], [s * 0.065, 0.21, 0.034], { color: 'pink', noInk: true });
      b.rod([s * 0.1, 0.25, 0], [s * 0.15, 0.17, -0.01], 0.014, 'red');
    });
    return b.done();
  }),
  e('comic book', 'study', 'books', () =>
    book('comic book', '#e8413a', 'COMICS!', 0.18, 0.27, 0.02, '#b02a20')
      .star(0.11, [0.025, 0.1, 0.012], { color: 'yellow' })
      .ball([0.07, 0.05, 0.01], [-0.04, 0.17, 0.012], { color: 'white' })
      .cone([0.02, 0.03, 0.01], [-0.05, 0.14, 0.012], { color: 'white', rot: [0, 0, 160] })
      .done(),
  ),
  e('comic book store', 'places', 'shops', () =>
    bld('comic book store', { w: 5, h: 4, d: 4, wall: '#3d7cc9', roof: '#22437a', sign: 'COMICS', signC: 'yellow', door: 'red' })
      .star(1.6, [-0.8, 5.0, 0], { color: 'yellow' })
      .ball([1.4, 1.0, 0.25], [1.2, 5.0, 0], { color: 'white' })
      .cone([0.4, 0.5, 0.2], [0.9, 4.45, 0], { color: 'white', rot: [0, 0, 150] })
      .done(),
  ),
  e('compass', 'sports', 'camping', () =>
    m('compass')
      .box([0.05, 0.01, 0.03], [0, 0.005, 0], { color: 'brass', round: 0.4 })
      .cyl([0.09, 0.026, 0.09], [0, 0.052, 0], { color: 'brass', rot: [90, 0, 0] })
      .cyl([0.076, 0.004, 0.076], [0, 0.052, 0.013], { color: 'cream', rot: [90, 0, 0] })
      .cone([0.013, 0.03, 0.004], [0, 0.067, 0.017], { color: 'red' })
      .cone([0.013, 0.03, 0.004], [0, 0.037, 0.017], { color: 'navy', rot: [0, 0, 180] })
      .ball(0.009, [0, 0.052, 0.019], { color: 'gold' })
      .cyl([0.012, 0.012, 0.012], [0, 0.1, 0], { color: 'brass' })
      .torus([0.026, 0.026, 0.006], [0, 0.117, 0], { color: 'brass' })
      .done(),
  ),
  e('compost', 'garden', 'garden things', () => {
    const b = m('compost').ball([0.9, 0.55, 0.75], [0, 0.27, 0.02], { color: '#4a3420' });
    b.each(4, (i) => b.box([1.04, 0.1, 0.04], [0, 0.08 + i * 0.15, -0.42], { color: 'wood', round: 0.2 }));
    b.pair((s) => b.each(4, (i) => b.box([0.04, 0.1, 0.84], [s * 0.52, 0.08 + i * 0.15, 0], { color: 'wood', round: 0.2 })));
    for (const [x, z] of [[0.52, 0.42], [-0.52, 0.42], [0.52, -0.42], [-0.52, -0.42]]) b.stick([x, 0, z], [x, 0.62, z], 0.06, 'darkwood');
    return b
      .ball([0.12, 0.03, 0.08], [-0.15, 0.52, 0.1], { color: 'leaf', rot: [0, 30, 10] })
      .ball([0.1, 0.03, 0.07], [0.12, 0.5, 0.16], { color: 'lime', rot: [0, -20, -10] })
      .rod([0.0, 0.53, 0.0], [0.12, 0.5, -0.05], 0.03, 'banana')
      .ball(0.05, [0.2, 0.45, 0.25], { color: 'red' })
      .ball([0.06, 0.03, 0.05], [-0.25, 0.45, 0.25], { color: 'white' })
      .done();
  }),
  e('computer', 'tech', 'computers', () => {
    const b = m('computer')
      .box([0.52, 0.34, 0.05], [0, 0.31, -0.02], { color: '#2a2a2a', round: 0.2 })
      .box([0.47, 0.29, 0.01], [0, 0.315, 0.006], { color: '#4fa3e0', glow: true })
      .stick([0, 0.02, -0.05], [0, 0.15, -0.05], 0.05, '#2a2a2a')
      .box([0.22, 0.02, 0.15], [0, 0.01, -0.05], { color: '#2a2a2a', round: 0.3 })
      .box([0.44, 0.025, 0.14], [0, 0.0125, 0.18], { color: 'lightgray', round: 0.3 })
      .ball([0.05, 0.03, 0.08], [0.3, 0.015, 0.18], { color: 'lightgray' });
    b.each(3, (i) => b.box([0.38, 0.004, 0.025], [0, 0.026, 0.14 + i * 0.035], { color: '#777777', noInk: true }));
    return b.box([0.18, 0.12, 0.004], [-0.1, 0.36, 0.012], { color: 'white', glow: true }).done();
  }),
  e('computer mouse', 'tech', 'computers', () =>
    m('computer mouse')
      .box([0.2, 0.006, 0.17], [0, 0.003, 0], { color: '#2a4a8a', round: 0.3 })
      .ball([0.062, 0.042, 0.105], [0, 0.026, 0], { color: '#e8e8e8' })
      .box([0.002, 0.012, 0.045], [0, 0.044, 0.028], { color: '#555555', noInk: true })
      .cyl([0.012, 0.006, 0.012], [0, 0.048, 0.022], { color: '#333333', rot: [0, 0, 90], name: 'wheel' })
      .done(),
  ),
  e('concession stand', 'places', 'stands', () => {
    const b = m('concession stand')
      .box([2.4, 1.1, 1.4], [0, 0.55, 0], { color: '#e8413a', round: 0.05 })
      .box([2.5, 0.08, 1.5], [0, 1.14, 0], { color: 'white' })
      .box([2.4, 1.1, 0.1], [0, 1.73, -0.65], { color: '#e8413a' })
      .box([2.7, 0.1, 1.7], [0, 2.33, 0], { color: 'white' });
    b.pair((s) => b.stick([s * 1.15, 1.18, 0.65], [s * 1.15, 2.28, 0.65], 0.08, 'white'));
    b.each(6, (i) => b.box([0.46, 0.06, 0.6], [-1.15 + i * 0.46, 2.2, 0.98], { color: i % 2 ? 'white' : 'red', rot: [30, 0, 0], round: 0.1 }));
    return b
      .label('SNACKS', [1.6, 0.4], [0, 2.62, 0.3], { color: 'yellow' })
      .cyl([0.3, 0.35, 0.3], [-0.6, 1.36, 0.3], { color: 'white', taper: 1.3 })
      .ball([0.4, 0.2, 0.4], [-0.6, 1.55, 0.3], { color: '#fff3b0' })
      .cyl([0.18, 0.3, 0.18], [0.6, 1.33, 0.4], { color: 'red', taper: 1.2 })
      .done();
  }),
  e('concrete', 'workshop', 'building materials', () => {
    const b = m('concrete')
      .box([2, 0.2, 1.6], [0, 0.1, 0], { color: '#a8a8a4', round: 0.05 })
      .box([0.6, 2.2, 0.6], [0, 1.3, 0], { color: '#b5b5b0', round: 0.03 })
      .box([0.4, 0.2, 0.2], [0.65, 0.3, 0.45], { color: '#8f8f8a', round: 0.1 })
      .box([0.4, 0.2, 0.2], [0.65, 0.5, 0.45], { color: '#9a9a95', round: 0.1, rot: [0, 10, 0] })
      .box([0.45, 0.6, 0.16], [-0.6, 0.5, 0.4], { color: '#d9d3c4', round: 0.4, rot: [-10, 0, 0] })
      .label('CEMENT', [0.36, 0.14], [-0.6, 0.55, 0.5], { color: 'gray', rot: [-10, 0, 0] });
    for (const [x, z] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) b.stick([x, 2.3, z], [x, 2.7, z], 0.035, '#8a4a2a');
    return b.done();
  }),
  e('concrete mixer', 'garage', 'construction vehicles', () => {
    const b = m('concrete mixer', { view: 'side' })
      .box([2.3, 0.4, 8], [0, 1.0, 0], { color: '#333333', round: 0.2 })
      .box([2.4, 2.0, 1.9], [0, 2.0, 3.0], { color: 'orange', round: 0.3 })
      .box([2.44, 0.8, 1.1], [0, 2.5, 3.3], { color: GLASS, round: 0.3 })
      .cyl([2.3, 4.6, 2.3], [0, 2.7, -1.2], { color: 'white', taper: 0.5, rot: [-75, 0, 0] })
      .torus([2.0, 2.0, 0.3], [0, 2.75, -1.4], { color: 'orange', rot: [15, 0, 25] })
      .rod([0, 2.8, -3.6], [0, 1.6, -4.4], 0.3, 'orange')
      .ball([0.3, 0.25, 0.1], [0.8, 1.4, 3.97], { color: 'yellow', glow: true })
      .ball([0.3, 0.25, 0.1], [-0.8, 1.4, 3.97], { color: 'yellow', glow: true });
    for (const z of [2.9, -1.6, -2.9]) b.pair((s) => b.torus([1.0, 1.0, 0.35], [s * 1.12, 0.5, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    return b.done();
  }),
  e('conditioner', 'home', 'bathroom', () => squeeze('conditioner', '#f3b6c8', 'white', 0.2, 0.08, 'CONDITIONER').done()),
  e('condominium', 'places', 'homes', () => {
    const b = bld('condominium', { w: 8, h: 12, d: 6, wall: '#d9cbb5', roof: '#6a6f75', sign: 'CONDOS', signC: 'teal', door: GLASS });
    for (let i = 0; i < 4; i++) {
      const y = 3.6 + i * 2.1;
      b.pair((s) => {
        b.box([1.6, 1.3, 0.06], [s * 2.0, y + 0.8, 3.01], { color: GLASS, round: 0.1 });
        b.box([2.4, 0.15, 0.9], [s * 2.0, y, 3.45], { color: 'white', round: 0.1 });
        b.box([2.4, 0.5, 0.05], [s * 2.0, y + 0.3, 3.88], { color: '#bfe3f5', round: 0.1 });
      });
    }
    return b.done();
  }),
  e('cone', 'workshop', 'road works', () =>
    m('cone')
      .box([0.36, 0.04, 0.36], [0, 0.02, 0], { color: '#e8601c', round: 0.2 })
      .cone([0.26, 0.42, 0.26], [0, 0.25, 0], { color: '#f26a1b' })
      .cyl([0.188, 0.06, 0.188], [0, 0.2, 0], { color: 'white', taper: 0.79 })
      .cyl([0.11, 0.04, 0.11], [0, 0.31, 0], { color: 'white', taper: 0.78 })
      .done(),
  ),
  e('confetti', 'toys', 'party', () => {
    const b = m('confetti')
      .cone([0.065, 0.13, 0.065], [-0.07, 0.065, 0], { color: 'gold', rot: [180, 0, 25] })
      .cyl([0.068, 0.012, 0.068], [-0.04, 0.125, 0], { color: 'red', rot: [0, 0, 25] });
    b.each(18, (i) => b.box([0.022, 0.012, 0.004], [-0.04 + rnd(i) * 0.2, 0.14 + rnd(i + 50) * 0.12, -0.05 + rnd(i + 90) * 0.1], { color: COLS[i % COLS.length], rot: [rnd(i + 7) * 180, rnd(i + 3) * 180, rnd(i + 5) * 180], noInk: true }));
    b.each(10, (i) => b.box([0.022, 0.003, 0.012], [-0.02 + rnd(i + 20) * 0.22, 0.0015, -0.07 + rnd(i + 30) * 0.14], { color: COLS[(i + 3) % COLS.length], rot: [0, rnd(i) * 180, 0], noInk: true }));
    return b.done();
  }),
  e('conga', 'music', 'drums', () => {
    const b = m('conga')
      .cyl([0.28, 0.45, 0.28], [0, 0.225, 0], { color: '#a0522d', taper: 1.25 })
      .cyl([0.35, 0.4, 0.35], [0, 0.65, 0], { color: '#a0522d', taper: 0.8 })
      .cyl([0.29, 0.02, 0.29], [0, 0.86, 0], { color: 'cream' })
      .torus([0.31, 0.31, 0.04], [0, 0.86, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.355, 0.04, 0.355], [0, 0.45, 0], { color: 'gold' })
      .torus([0.3, 0.3, 0.03], [0, 0.02, 0], { color: 'silver', rot: [90, 0, 0] });
    around(5, 0.152).forEach(([x, z]) => b.stick([x, 0.68, z], [x * 0.98, 0.84, z * 0.98], 0.018, 'silver'));
    return b.done();
  }),
  e('console', 'tech', 'games', () =>
    m('console')
      .box([0.32, 0.07, 0.22], [0, 0.035, -0.05], { color: '#1e1e22', round: 0.2 })
      .box([0.12, 0.006, 0.004], [-0.05, 0.04, 0.062], { color: '#555555', noInk: true })
      .ball(0.012, [0.12, 0.04, 0.062], { color: 'cyan', glow: true })
      .box([0.12, 0.04, 0.06], [0.03, 0.02, 0.15], { color: '#2a2a2e', round: 0.6 })
      .ball([0.06, 0.04, 0.07], [-0.04, 0.02, 0.16], { color: '#2a2a2e' })
      .ball([0.06, 0.04, 0.07], [0.1, 0.02, 0.16], { color: '#2a2a2e' })
      .ball(0.014, [0.08, 0.044, 0.15], { color: 'red' })
      .ball(0.014, [0.1, 0.044, 0.14], { color: 'green' })
      .ball(0.016, [-0.03, 0.046, 0.15], { color: '#555555' })
      .done(),
  ),
  e('construction barrel', 'workshop', 'road works', () =>
    m('construction barrel')
      .cyl([0.75, 0.08, 0.75], [0, 0.04, 0], { color: '#222222' })
      .cyl([0.55, 0.92, 0.55], [0, 0.5, 0], { color: '#f26a1b', taper: 0.85 })
      .cyl([0.545, 0.1, 0.545], [0, 0.3, 0], { color: 'white' })
      .cyl([0.524, 0.1, 0.524], [0, 0.55, 0], { color: 'white' })
      .cyl([0.502, 0.1, 0.502], [0, 0.8, 0], { color: 'white' })
      .box([0.1, 0.1, 0.06], [0, 1.0, 0], { color: '#333333' })
      .ball(0.1, [0, 1.08, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('construction site', 'places', 'construction', () => {
    const b = m('construction site').box([6, 0.2, 5], [0, 0.1, 0], { color: 'dirt', round: 0.1 });
    for (const [x, z] of [[1.6, 1.0], [-1.6, 1.0], [1.6, -1.2], [-1.6, -1.2]]) b.stick([x, 0.2, z], [x, 4.2, z], 0.18, '#d9822b');
    for (const y of [2.2, 4.1]) {
      b.stick([-1.7, y, 1.0], [1.7, y, 1.0], 0.16, '#d9822b').stick([-1.7, y, -1.2], [1.7, y, -1.2], 0.16, '#d9822b');
      b.pair((s) => b.stick([s * 1.6, y, -1.3], [s * 1.6, y, 1.1], 0.16, '#d9822b'));
    }
    return b
      .box([3.4, 0.15, 2.4], [0, 2.28, -0.1], { color: '#a8a8a4' })
      .ball([1.8, 1.1, 1.4], [-2.0, 0.6, 1.4], { color: '#8a6a45' })
      .cone([0.4, 0.6, 0.4], [2.2, 0.5, 2.0], { color: 'orange' })
      .cone([0.4, 0.6, 0.4], [1.5, 0.5, 2.2], { color: 'orange' })
      .stick([2.4, 0.2, 1.0], [2.4, 1.6, 1.0], 0.1, 'darkwood')
      .label('KEEP OUT', [1.4, 0.6], [2.4, 1.6, 1.07], { color: 'yellow' })
      .done();
  }),
  e('contact lens', 'clinic', 'eye care', () =>
    m('contact lens')
      .box([0.1, 0.025, 0.05], [0, 0.0125, -0.02], { color: 'white', round: 0.5 })
      .cyl([0.04, 0.015, 0.04], [-0.026, 0.03, -0.02], { color: 'skyblue' })
      .cyl([0.04, 0.015, 0.04], [0.026, 0.03, -0.02], { color: '#4caf50' })
      .ball([0.064, 0.064, 0.016], [0, 0.033, 0.03], { color: '#bfe6ff', rot: [-15, 0, 0] })
      .ball([0.04, 0.04, 0.006], [0, 0.034, 0.039], { color: '#e6f6ff', rot: [-15, 0, 0], noInk: true })
      .done(),
  ),
  e('contract', 'study', 'documents', () => {
    const b = m('contract')
      .box([0.28, 0.04, 0.08], [0, 0.02, 0], { color: 'darkwood', round: 0.3 })
      .box([0.22, 0.3, 0.008], [0, 0.18, 0], { color: 'paper', round: 0.1 })
      .label('CONTRACT', [0.17, 0.035], [0, 0.3, 0.008], { color: 'white' })
      .cyl([0.045, 0.008, 0.045], [0.06, 0.08, 0.008], { color: 'red', rot: [90, 0, 0] })
      .rod([-0.08, 0.075, 0.006], [-0.05, 0.09, 0.006], 0.005, 'blue', { noInk: true })
      .rod([-0.05, 0.09, 0.006], [-0.02, 0.07, 0.006], 0.005, 'blue', { noInk: true })
      .rod([-0.07, 0.04, 0.05], [0.1, 0.055, 0.06], 0.014, 'black');
    b.each(5, (i) => b.box([0.16, 0.005, 0.004], [0, 0.25 - i * 0.03, 0.006], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('convention center', 'places', 'halls', () => {
    const b = bld('convention center', { w: 12, h: 6, d: 6, wall: '#d0d6dc', roof: '#7a8590', sign: 'CONVENTION CENTER', signC: 'navy', door: GLASS, win: [1, 6] })
      .ball([12.4, 2.6, 6.4], [0, 6.2, 0], { color: '#7a8590' });
    for (const [i, c] of (['red', 'blue', 'green'] as const).entries()) {
      const x = -4 + i * 4;
      b.stick([x, 0, 4.5], [x, 5, 4.5], 0.12, 'silver').box([1.2, 0.7, 0.05], [x + 0.62, 4.6, 4.5], { color: c, round: 0.1 });
    }
    return b.done();
  }),
  e('conveyor belt', 'tech', 'machines', () => {
    const b = m('conveyor belt', { view: 'side' })
      .box([0.6, 0.12, 2.6], [0, 0.85, 0], { color: '#2a2a2a', round: 0.9 })
      .cyl([0.15, 0.66, 0.15], [0, 0.85, 1.25], { color: 'silver', rot: [0, 0, 90], name: 'wheel' })
      .cyl([0.15, 0.66, 0.15], [0, 0.85, -1.25], { color: 'silver', rot: [0, 0, 90] });
    b.pair((s) => {
      b.box([0.04, 0.12, 2.5], [s * 0.33, 0.87, 0], { color: '#3a6fb5', round: 0.2 });
      for (const z of [1.0, -1.0]) b.stick([s * 0.28, 0, z], [s * 0.28, 0.8, z], 0.06, '#3a6fb5');
    });
    for (const [z, c] of [[-0.75, '#c8a06a'], [0.05, '#b8905a'], [0.8, '#c8a06a']] as Array<[number, string]>) b.box([0.35, 0.3, 0.35], [0, 1.06, z], { color: c, round: 0.1 }).box([0.36, 0.05, 0.08], [0, 1.2, z], { color: '#d9c08a', noInk: true });
    return b.done();
  }),
  e('cookbook', 'study', 'books', () =>
    book('cookbook', '#c0392b', 'RECIPES', 0.2, 0.26, 0.035, '#8e2a1f')
      .ball([0.08, 0.055, 0.015], [0, 0.135, 0.02], { color: 'white' })
      .cyl([0.055, 0.035, 0.012], [0, 0.095, 0.02], { color: 'white' })
      .done(),
  ),
  e('cookie', 'food', 'cookies', () => {
    const b = m('cookie');
    b.each(3, (i) => b.cyl([0.08, 0.016, 0.08], [0, 0.009 + i * 0.017, -0.01], { color: '#c98a4b' }));
    b.cyl([0.08, 0.016, 0.08], [0, 0.042, 0.04], { color: '#d49a5a', rot: [70, 0, 0] });
    const n: V = [0, 0.34, 0.94], v: V = [0, -0.94, 0.34];
    for (const [a, c] of [[-0.02, 0.01], [0.015, 0.018], [0.0, -0.015], [0.022, -0.01], [-0.018, -0.02]]) b.ball(0.012, [a, 0.042 + c * v[1] + n[1] * 0.008, 0.04 + c * v[2] + n[2] * 0.008], { color: '#3a2010', noInk: true });
    b.each(4, (i) => b.ball(0.011, [-0.025 + i * 0.016, 0.051, -0.02 + (i % 2) * 0.025], { color: '#3a2010', noInk: true }));
    return b.done();
  }),
  e('cookie cutter', 'kitchen', 'baking', () =>
    m('cookie cutter')
      .box([0.18, 0.015, 0.12], [0, 0.0075, 0], { color: '#e8c48a', round: 0.4 })
      .star(0.12, [0, 0.075, -0.01], { color: 'silver' })
      .star(0.085, [0, 0.075, -0.003], { color: '#e8c48a', noInk: true })
      .star(0.06, [0.05, 0.02, 0.035], { color: '#d9a865', rot: [-90, 0, 0] })
      .done(),
  ),
  e('cookie dough', 'food', 'cookies', () => {
    const b = bowl('cookie dough', '#7fb3d5', '#e8c890', 0.18, 0.07);
    b.each(6, (i) => b.ball(0.012, [-0.04 + (i % 3) * 0.04, 0.095, -0.02 + Math.floor(i / 3) * 0.04], { color: '#3a2010', noInk: true }));
    return b.rod([0.02, 0.08, 0], [0.1, 0.2, -0.03], 0.016, 'wood').ball([0.035, 0.02, 0.045], [0.015, 0.085, 0.005], { color: 'wood' }).done();
  }),
  e('cookie jar', 'kitchen', 'storage', () => {
    const b = m('cookie jar')
      .cyl([0.18, 0.18, 0.18], [0, 0.09, 0], { color: GLASS })
      .cyl([0.19, 0.03, 0.19], [0, 0.195, 0], { color: '#c0392b', name: 'lid', pivot: [0, 0.195, -0.095] })
      .ball(0.045, [0, 0.225, 0], { color: '#c0392b', parent: 'lid' })
      .label('COOKIES', [0.12, 0.03], [0, 0.03, 0.09], { color: 'white' });
    for (const [x, y] of [[-0.04, 0.08], [0.04, 0.09], [0, 0.14], [-0.045, 0.15], [0.045, 0.155]]) b.cyl([0.06, 0.012, 0.06], [x, y, 0.088], { color: '#c98a4b', rot: [90, 0, 0] });
    return b.done();
  }),
  e('cooler', 'sports', 'camping', () =>
    m('cooler')
      .box([0.6, 0.36, 0.38], [0, 0.18, 0], { color: '#2f7fd1', round: 0.2 })
      .box([0.62, 0.08, 0.4], [0, 0.4, 0], { color: 'white', round: 0.3, name: 'lid', pivot: [0, 0.4, -0.2] })
      .box([0.04, 0.06, 0.16], [0.32, 0.3, 0], { color: 'white', round: 0.3 })
      .box([0.04, 0.06, 0.16], [-0.32, 0.3, 0], { color: 'white', round: 0.3 })
      .box([0.08, 0.07, 0.02], [0, 0.35, 0.195], { color: 'white', round: 0.3 })
      .done(),
  ),
  e('copper', 'workshop', 'materials', () => {
    const b = m('copper')
      .cyl([0.28, 0.28, 0.28], [0, 0.18, 0], { color: 'copper', rot: [0, 0, 90] })
      .cyl([0.36, 0.04, 0.36], [0.16, 0.18, 0], { color: 'wood', rot: [0, 0, 90] })
      .cyl([0.36, 0.04, 0.36], [-0.16, 0.18, 0], { color: 'wood', rot: [0, 0, 90] })
      .box([0.22, 0.07, 0.1], [0.3, 0.035, 0.2], { color: 'copper', round: 0.2 })
      .stick([-0.3, 0.02, 0.25], [0.1, 0.02, 0.32], 0.035, '#c87533');
    b.each(5, (i) => b.torus([0.285, 0.285, 0.01], [-0.1 + i * 0.05, 0.18, 0], { color: '#a8582a', rot: [0, 90, 0], tube: 0.04, noInk: true }));
    return b.done();
  }),
  e('copy machine', 'tech', 'office machines', () =>
    m('copy machine')
      .box([0.65, 0.8, 0.6], [0, 0.4, 0], { color: '#e6e6e6', round: 0.1 })
      .box([0.62, 0.06, 0.58], [0, 0.83, 0], { color: '#5a5a5a', name: 'lid', pivot: [0, 0.83, -0.29] })
      .box([0.55, 0.14, 0.02], [0, 0.3, 0.305], { color: '#d0d0d0', round: 0.2 })
      .box([0.55, 0.14, 0.02], [0, 0.12, 0.305], { color: '#d0d0d0', round: 0.2 })
      .box([0.2, 0.025, 0.02], [0, 0.34, 0.318], { color: '#555555' })
      .box([0.2, 0.025, 0.02], [0, 0.16, 0.318], { color: '#555555' })
      .box([0.3, 0.06, 0.12], [0.12, 0.77, 0.3], { color: '#444444', round: 0.2 })
      .box([0.12, 0.04, 0.01], [0.08, 0.79, 0.36], { color: 'skyblue', glow: true })
      .box([0.2, 0.02, 0.3], [0.42, 0.55, 0], { color: '#bbbbbb', rot: [0, 0, -10] })
      .box([0.18, 0.01, 0.26], [0.42, 0.57, 0], { color: 'white', rot: [0, 0, -10] })
      .done(),
  ),
  e('coral', 'sea', 'coral', () => {
    const b = m('coral').ball([0.42, 0.12, 0.3], [0, 0.05, 0], { color: 'rock' });
    const pk = '#ff7f7f';
    const br: Array<[V, V]> = [
      [[0, 0.08, 0], [0, 0.25, 0]], [[0, 0.25, 0], [-0.1, 0.38, 0]], [[0, 0.25, 0], [0.08, 0.42, 0.02]], [[0, 0.25, 0], [-0.01, 0.48, -0.03]],
      [[-0.1, 0.38, 0], [-0.15, 0.45, 0.02]], [[0.08, 0.42, 0.02], [0.13, 0.48, 0]],
    ];
    for (const [a, c] of br) b.rod(a, c, 0.035, pk);
    return b
      .ball([0.17, 0.12, 0.15], [0.14, 0.1, 0.06], { color: '#e8b04a' })
      .ball([0.22, 0.26, 0.02], [-0.14, 0.22, -0.07], { color: 'purple', rot: [0, 0, 15] })
      .done();
  }),
  e('cordless phone', 'tech', 'phones', () => {
    const b = m('cordless phone')
      .box([0.14, 0.04, 0.12], [0, 0.02, 0], { color: '#333333', round: 0.4 })
      .box([0.056, 0.17, 0.03], [0, 0.115, 0], { color: '#e6e6e6', round: 0.6 })
      .box([0.042, 0.03, 0.005], [0, 0.165, 0.016], { color: 'skyblue', glow: true })
      .stick([0.018, 0.19, -0.005], [0.018, 0.22, -0.005], 0.01, '#333333')
      .ball(0.01, [0.05, 0.042, 0.05], { color: 'lime', glow: true });
    b.each(9, (i) => b.box([0.01, 0.008, 0.004], [-0.014 + (i % 3) * 0.014, 0.135 - Math.floor(i / 3) * 0.015, 0.016], { color: '#555555', noInk: true }));
    return b.done();
  }),
  e('cork (material)', 'workshop', 'materials', () => {
    const b = m('cork (material)')
      .cyl([0.22, 0.46, 0.22], [0, 0.23, 0], { color: '#c8955a' })
      .box([0.2, 0.04, 0.3], [0.2, 0.02, 0.15], { color: '#c8955a', round: 0.1 })
      .box([0.2, 0.04, 0.3], [0.22, 0.06, 0.14], { color: '#d1a066', round: 0.1, rot: [0, 8, 0] });
    around(12, 0.112).forEach(([x, z], i) => b.ball(0.012, [x, 0.05 + rnd(i) * 0.38, z], { color: '#8a5a2b', noInk: true }));
    return b.done();
  }),
  e('cork (stopper)', 'kitchen', 'bar tools', () => {
    const b = m('cork (stopper)')
      .cyl([0.045, 0.06, 0.045], [0, 0.03, 0], { color: '#c8955a', taper: 0.9 })
      .cyl([0.045, 0.06, 0.045], [0.06, 0.0225, 0.03], { color: '#c8955a', rot: [90, 60, 0] })
      .cyl([0.044, 0.004, 0.044], [0.087, 0.0225, 0.0455], { color: '#7a1a2a', rot: [90, 60, 0] });
    b.each(6, (i) => b.ball(0.006, [Math.cos(i) * 0.021, 0.01 + i * 0.008, Math.sin(i) * 0.021], { color: '#8a5a2b', noInk: true }));
    return b.done();
  }),
  e('corkboard', 'study', 'office', () => {
    const b = m('corkboard')
      .box([0.9, 0.62, 0.04], [0, 0.56, 0], { color: '#c8955a', round: 0.05 })
      .box([0.96, 0.04, 0.05], [0, 0.88, 0], { color: 'wood' })
      .box([0.96, 0.04, 0.05], [0, 0.24, 0], { color: 'wood' })
      .box([0.04, 0.66, 0.05], [0.47, 0.56, 0], { color: 'wood' })
      .box([0.04, 0.66, 0.05], [-0.47, 0.56, 0], { color: 'wood' });
    b.pair((s) => b.stick([s * 0.35, 0, 0], [s * 0.35, 0.24, 0], 0.04, 'wood').box([0.1, 0.07, 0.25], [s * 0.35, 0.035, 0], { color: 'wood', round: 0.3 }));
    for (const [x, y, c] of [[-0.25, 0.68, 'yellow'], [0.05, 0.72, 'pink'], [0.28, 0.6, 'skyblue'], [-0.15, 0.42, 'lime'], [0.2, 0.4, 'white']] as Array<[number, number, string]>)
      b.box([0.15, 0.13, 0.006], [x, y, 0.024], { color: c, round: 0.1, rot: [0, 0, (x * 40) % 12] }).ball(0.018, [x, y + 0.05, 0.03], { color: 'red' });
    return b.done();
  }),
  e('corkscrew', 'kitchen', 'bar tools', () => {
    const b = m('corkscrew')
      .rod([-0.07, 0.17, 0], [0.07, 0.17, 0], 0.03, 'wood')
      .stick([0, 0.17, 0], [0, 0.115, 0], 0.012, 'silver')
      .cyl([0.04, 0.045, 0.04], [0, 0.0225, 0], { color: '#c8955a' });
    b.each(5, (i) => b.torus([0.026, 0.026, 0.006], [0, 0.108 - i * 0.015, 0], { color: 'silver', rot: [72, 0, 0], tube: 0.25 }));
    return b.done();
  }),
  e('corn', 'food', 'vegetables', () => {
    const b = m('corn')
      .cyl([0.035, 0.05, 0.035], [0, 0.025, 0], { color: '#6a9a3a' })
      .capsule([0.085, 0.3, 0.085], [0, 0.2, 0], { color: '#f5c518' });
    b.each(6, (i) => b.torus([0.087, 0.087, 0.006], [0, 0.1 + i * 0.035, 0], { color: '#d9a812', rot: [90, 0, 0], tube: 0.08, noInk: true }));
    b.pair((s) => b.ball([0.06, 0.24, 0.025], [s * 0.05, 0.12, 0.01], { color: 'leaf', rot: [0, 0, s * 22] }));
    return b.ball([0.06, 0.2, 0.025], [0, 0.11, -0.045], { color: '#5a8a2a', rot: [-15, 0, 0] }).done();
  }),
  e('corn dog', 'food', 'fast food', () => {
    const b = m('corn dog')
      .cyl([0.07, 0.012, 0.07], [0, 0.006, 0], { color: 'darkwood' })
      .stick([0, 0, 0], [0, 0.09, 0], 0.01, 'lightwood')
      .capsule([0.048, 0.15, 0.048], [0, 0.15, 0], { color: '#c8872e' });
    const zz: V[] = [-0.012, 0.012, -0.012, 0.012, -0.012, 0.012].map((x, i) => [x, 0.1 + i * 0.019, 0.022]);
    for (let i = 0; i < zz.length - 1; i++) b.rod(zz[i], zz[i + 1], 0.006, 'yellow', { noInk: true });
    return b.done();
  }),
  e('corn stalk', 'garden', 'crops', () => {
    const b = m('corn stalk')
      .ball([0.6, 0.25, 0.5], [0, 0.06, 0], { color: 'dirt' })
      .stick([0, 0, 0], [0, 2.3, 0], 0.06, '#6a9a3a');
    for (let i = 0; i < 6; i++) {
      const y = 0.45 + i * 0.3, s = i % 2 ? 1 : -1, z = (i % 3) * 0.05 - 0.05;
      b.rod([0, y, 0], [s * 0.35, y + 0.25, z], 0.06, 'leaf').rod([s * 0.35, y + 0.25, z], [s * 0.62, y + 0.02, z * 2], 0.05, 'leaf');
    }
    return b
      .capsule([0.1, 0.3, 0.1], [0.08, 1.2, 0.04], { color: '#7aa04a', rot: [0, 0, -20] })
      .ball([0.06, 0.12, 0.06], [0.13, 1.36, 0.04], { color: '#f5c518', rot: [0, 0, -20] })
      .ball(0.06, [0, 2.3, 0], { color: 'tan', name: 'top' })
      .rod([0, 2.3, 0], [0.12, 2.5, 0], 0.02, 'tan', { parent: 'top' })
      .rod([0, 2.3, 0], [-0.1, 2.48, 0.02], 0.02, 'tan', { parent: 'top' })
      .rod([0, 2.3, 0], [0.02, 2.55, -0.04], 0.02, 'tan', { parent: 'top' })
      .done();
  }),
  e('corn syrup', 'food', 'pantry', () => bottle('corn syrup', '#f0c86a', 'red', 0.3, 0.09, 'CORN SYRUP').done()),
  e('corned beef', 'food', 'meat', () => {
    const b = m('corned beef')
      .box([0.3, 0.025, 0.2], [0, 0.0125, 0], { color: 'lightwood', round: 0.3 })
      .box([0.14, 0.07, 0.1], [-0.05, 0.06, 0], { color: '#c0505a', round: 0.4 })
      .box([0.14, 0.015, 0.1], [-0.05, 0.098, 0], { color: '#f0e0d0', round: 0.5 });
    b.each(3, (i) => b.box([0.012, 0.07, 0.1], [0.04 + i * 0.03, 0.055, 0], { color: '#d0606a', round: 0.3, rot: [0, 0, -20 - i * 8] }));
    return b.done();
  }),
  e('cornmeal', 'food', 'pantry', () =>
    m('cornmeal')
      .box([0.3, 0.34, 0.2], [0, 0.17, 0], { color: '#d9c08a', round: 0.6 })
      .cyl([0.16, 0.08, 0.12], [0, 0.37, 0], { color: '#d9c08a', taper: 1.4 })
      .cyl([0.17, 0.03, 0.13], [0, 0.34, 0], { color: '#8a5a2b' })
      .label('CORNMEAL', [0.22, 0.07], [0, 0.18, 0.105], { color: 'yellow' })
      .ball([0.18, 0.06, 0.14], [0.22, 0.02, 0.1], { color: '#f2c94c' })
      .done(),
  ),
  e('cornucopia', 'food', 'harvest', () => {
    const b = m('cornucopia');
    const pts: V[] = [[0.05, 0.11, 0], [-0.04, 0.1, -0.01], [-0.12, 0.1, -0.02], [-0.18, 0.14, -0.03], [-0.2, 0.2, -0.03], [-0.17, 0.24, -0.02]];
    const th = [0.2, 0.16, 0.12, 0.08, 0.05];
    for (let i = 0; i < 5; i++) b.rod(pts[i], pts[i + 1], th[i], i % 2 ? '#b8854a' : '#c8955a');
    return b
      .torus([0.22, 0.22, 0.03], [0.08, 0.11, 0], { color: '#a8743a', rot: [0, 90, 0] })
      .ball([0.04, 0.17, 0.17], [0.08, 0.11, 0], { color: '#5a3a1a' })
      .ball(0.07, [0.17, 0.035, 0.05], { color: 'red' })
      .ball(0.07, [0.25, 0.035, -0.02], { color: 'orange' })
      .ball([0.06, 0.08, 0.06], [0.14, 0.12, -0.04], { color: 'lime' })
      .ball(0.035, [0.13, 0.14, 0.06], { color: 'purple' })
      .ball(0.035, [0.15, 0.11, 0.08], { color: 'purple' })
      .ball(0.035, [0.12, 0.1, 0.09], { color: 'purple' })
      .capsule([0.045, 0.14, 0.045], [0.24, 0.03, 0.09], { color: '#f5c518', rot: [90, 60, 0] })
      .done();
  }),
  e('corpse', 'clinic', 'hospital', () => {
    const b = m('corpse', { view: 'side' })
      .box([0.7, 0.06, 1.95], [0, 0.82, 0], { color: 'steel', round: 0.2 })
      .box([0.74, 0.14, 1.9], [0, 0.86, 0], { color: '#dfe6ea', round: 0.5 })
      .ball([0.32, 0.3, 0.32], [0, 1.06, 0.7], { color: 'white' })
      .capsule([0.52, 1.25, 0.44], [0, 1.02, 0.0], { color: 'white', rot: [90, 0, 0] })
      .rod([0.3, 0.92, 0.2], [0.42, 0.62, 0.25], 0.07, '#b8c4b0')
      .ball(0.08, [0.43, 0.58, 0.25], { color: '#b8c4b0' })
      .label('TAG', [0.1, 0.12], [0.1, 0.86, -1.08], { color: '#e8d8a8', rot: [0, 180, 0] });
    b.pair((s) => b.ball([0.1, 0.16, 0.12], [s * 0.1, 1.0, -1.0], { color: '#c8d0c0' }));
    for (const [x, z] of [[0.3, 0.85], [-0.3, 0.85], [0.3, -0.85], [-0.3, -0.85]]) b.stick([x, 0.08, z], [x, 0.8, z], 0.04, 'steel').ball(0.08, [x, 0.04, z], { color: 'rubber' });
    return b.done();
  }),
  e('corral', 'farm', 'farm things', () => {
    const b = m('corral').cyl([3.4, 0.04, 3.4], [0, 0.02, 0], { color: 'dirt' });
    const pts = around(10, 1.6, 0.3);
    pts.forEach(([x, z], i) => {
      b.stick([x, 0, z], [x, 1.35, z], 0.13, 'darkwood');
      const [nx, nz] = pts[(i + 1) % pts.length];
      if (i !== 2) for (const y of [0.55, 1.05]) b.rod([x, y, z], [nx, y, nz], 0.08, 'wood');
    });
    return b
      .box([0.9, 0.3, 0.4], [-0.3, 0.15, -0.4], { color: 'darkwood', round: 0.2 })
      .box([0.8, 0.04, 0.32], [-0.3, 0.29, -0.4], { color: 'water', noInk: true })
      .box([0.6, 0.38, 0.42], [0.5, 0.19, 0.2], { color: '#e8c95a', round: 0.3 })
      .done();
  }),
  e('corset', 'wardrobe', 'tops', () => {
    const c = '#8b1a2b';
    const b = m('corset')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'darkwood' })
      .stick([0, 0, 0], [0, 0.31, 0], 0.025, 'darkwood')
      .cyl([0.26, 0.2, 0.18], [0, 0.4, 0], { color: c, taper: 0.75 })
      .cyl([0.195, 0.22, 0.135], [0, 0.61, 0], { color: c, taper: 1.35 })
      .cyl([0.27, 0.025, 0.19], [0, 0.31, 0], { color: 'black' })
      .cyl([0.27, 0.025, 0.185], [0, 0.72, 0], { color: 'black' })
      .box([0.03, 0.4, 0.012], [0, 0.51, 0.082], { color: 'black', round: 0.3 });
    b.each(5, (i) => b.rod([-0.025, 0.36 + i * 0.07, 0.09], [0.025, 0.4 + i * 0.07, 0.09], 0.006, 'white', { noInk: true }));
    b.pair((s) => b.rod([s * 0.08, 0.33, 0.06], [s * 0.08, 0.7, 0.075], 0.006, '#5a0a1a', { noInk: true }));
    return b.done();
  }),
  e('cot', 'sports', 'camping', () => {
    const b = m('cot', { view: 'side' })
      .box([0.7, 0.06, 1.9], [0, 0.42, 0], { color: 'olive', round: 0.4 })
      .box([0.5, 0.14, 0.32], [0, 0.52, 0.72], { color: 'white', round: 0.8 })
      .box([0.66, 0.06, 0.9], [0, 0.47, -0.35], { color: 'orange', round: 0.4 });
    b.pair((s) => {
      b.rod([s * 0.36, 0.42, -0.95], [s * 0.36, 0.42, 0.95], 0.035, 'darkgreen');
      for (const z of [0.75, 0, -0.75]) b.rod([s * 0.33, 0.01, z - 0.15], [s * 0.33, 0.41, z + 0.15], 0.03, 'silver').rod([s * 0.33, 0.01, z + 0.15], [s * 0.33, 0.41, z - 0.15], 0.03, 'silver');
    });
    return b.done();
  }),
  e('cottage cheese', 'food', 'dairy', () => {
    const b = m('cottage cheese')
      .cyl([0.11, 0.07, 0.11], [0, 0.035, 0], { color: 'white', taper: 1.15 })
      .cyl([0.118, 0.025, 0.118], [0, 0.035, 0], { color: '#4a90d9' })
      .cyl([0.1, 0.01, 0.1], [-0.09, 0.05, -0.04], { color: '#4a90d9', rot: [0, 0, 70] });
    b.each(8, (i) => b.ball(0.028, [Math.cos(i * 0.8) * 0.03 * (i % 2 + 0.3), 0.075 + (i % 3) * 0.006, Math.sin(i * 0.8) * 0.03 * (i % 2 + 0.3)], { color: i % 2 ? 'white' : 'cream' }));
    return b.done();
  }),
  e('cotton', 'garden', 'crops', () => {
    const b = m('cotton')
      .ball([0.1, 0.03, 0.08], [0, 0.012, 0], { color: 'dirt' })
      .stick([0, 0, 0], [0, 0.14, 0], 0.012, '#6b4a2b')
      .rod([0, 0.08, 0], [0.06, 0.12, 0], 0.008, '#6b4a2b')
      .ball(0.02, [0.06, 0.12, 0], { color: 'leaf' });
    around(4, 0.03, 0.4).forEach(([x, z]) => b.cone([0.02, 0.04, 0.012], [x, 0.14, z], { color: '#6b4a2b', rot: [z * 2000, 0, -x * 2000] }));
    around(4, 0.026, 0.8).forEach(([x, z]) => b.ball(0.05, [x, 0.17, z], { color: 'white' }));
    return b.ball(0.05, [0, 0.2, 0], { color: 'white' }).done();
  }),
  e('cotton ball', 'home', 'bathroom', () => {
    const b = m('cotton ball');
    for (const [x, y, z] of [[-0.03, 0.022, 0], [0.03, 0.022, 0.01], [0, 0.055, 0.0]] as V[]) {
      b.ball(0.045, [x, y, z], { color: 'white' });
      b.ball(0.03, [x + 0.012, y + 0.008, z + 0.012], { color: '#fafafa' });
      b.ball(0.028, [x - 0.012, y + 0.006, z + 0.01], { color: '#fafafa' });
    }
    return b.done();
  }),
  e('cotton candy', 'food', 'sweets', () => {
    const b = m('cotton candy')
      .cyl([0.08, 0.02, 0.08], [0, 0.01, 0], { color: 'darkwood' })
      .stick([0, 0.02, 0], [0, 0.14, 0], 0.014, 'white')
      .ball([0.17, 0.17, 0.16], [0, 0.22, 0], { color: '#f7a8c8' });
    around(5, 0.075, 0.3).forEach(([x, z], i) => b.ball(0.08, [x, 0.21 + (i % 2) * 0.03, z], { color: i % 2 ? '#f7a8c8' : '#f9bcd6' }));
    return b.ball(0.08, [0, 0.29, 0], { color: '#f9bcd6' }).done();
  }),
  e('cotton swab', 'home', 'bathroom', () => {
    const b = m('cotton swab').cyl([0.06, 0.08, 0.06], [0, 0.04, 0], { color: GLASS });
    for (const [tx, tz] of [[-0.03, 0], [0.03, 0.01], [0, 0.03], [0.01, -0.03], [-0.015, -0.02]]) {
      const top: V = [tx, 0.15 - Math.abs(tx), tz];
      b.stick([tx * 0.2, 0.01, tz * 0.2], top, 0.006, 'white').ball([0.014, 0.022, 0.014], top, { color: 'white' });
    }
    return b.done();
  }),
  e('cough drop', 'clinic', 'medicine', () =>
    m('cough drop')
      .box([0.07, 0.1, 0.025], [0, 0.05, -0.02], { color: '#2a7a3a', round: 0.3 })
      .label('COUGH', [0.06, 0.022], [0, 0.07, -0.006], { color: 'white' })
      .ball([0.028, 0.02, 0.028], [-0.01, 0.01, 0.025], { color: '#c0392b' })
      .ball([0.028, 0.02, 0.028], [0.025, 0.01, 0.03], { color: '#e8b03a' })
      .cone([0.018, 0.02, 0.012], [0.007, 0.01, 0.03], { color: 'white', rot: [0, 0, -90] })
      .cone([0.018, 0.02, 0.012], [0.043, 0.01, 0.03], { color: 'white', rot: [0, 0, 90] })
      .done(),
  ),
  e('coupon', 'home', 'money', () => {
    const b = m('coupon')
      .box([0.17, 0.025, 0.04], [0, 0.0125, 0], { color: 'darkwood', round: 0.3 })
      .box([0.16, 0.085, 0.005], [0, 0.065, 0], { color: '#f7d23e', round: 0.1 })
      .label('50% OFF', [0.11, 0.04], [0, 0.065, 0.004], { color: 'white' });
    b.each(7, (i) => b.box([0.012, 0.003, 0.002], [-0.072 + i * 0.024, 0.1, 0.004], { color: 'black', noInk: true }).box([0.012, 0.003, 0.002], [-0.072 + i * 0.024, 0.03, 0.004], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('courthouse', 'places', 'government', () => {
    const b = m('courthouse')
      .box([10, 5.5, 6], [0, 3.05, -0.5], { color: '#e8e0d0', round: 0.03 })
      .box([10.6, 0.3, 7.4], [0, 0.15, 0.2], { color: 'stone' })
      .box([9, 0.3, 6.6], [0, 0.45, 0.1], { color: 'stone' })
      .box([8.6, 0.6, 1.8], [0, 5.3, 3.3], { color: '#e8e0d0' })
      .wedge([9.2, 1.8, 1.9], [0, 6.5, 3.3], { color: '#d8d0c0' })
      .label('COURTHOUSE', [5, 0.5], [0, 5.3, 4.22], { color: 'white' })
      .box([1.6, 2.6, 0.1], [0, 1.9, 2.52], { color: 'darkwood', name: 'door', pivot: [-0.8, 1.9, 2.52] })
      .cyl([3, 1.2, 3], [0, 6.85, -0.5], { color: '#e8e0d0' })
      .ball([3, 2.8, 3], [0, 7.45, -0.5], { color: '#7aa0a0' })
      .stick([0, 8.8, -0.5], [0, 10.2, -0.5], 0.08, 'silver')
      .box([1.0, 0.6, 0.05], [0.5, 9.9, -0.5], { color: 'red', round: 0.1 });
    b.each(6, (i) => b.cyl([0.55, 4.4, 0.55], [-3.5 + i * 1.4, 2.8, 3.3], { color: 'white' }));
    return b.done();
  }),
  e('couscous', 'food', 'grains', () => {
    const b = bowl('couscous', '#c0573a', '#f2d48a', 0.18, 0.06);
    for (const [x, z, c] of [[-0.03, 0.02, 'tan'], [0.02, 0.03, 'tan'], [0.04, -0.01, 'orange'], [-0.01, -0.03, 'orange'], [0.0, 0.0, 'green'], [-0.05, -0.01, 'green']] as Array<[number, number, string]>)
      b.box([0.018, 0.016, 0.018], [x, 0.085, z], { color: c, round: c === 'tan' ? 1 : 0.3 });
    return b.done();
  }),
  e('cowbell', 'music', 'percussion', () =>
    m('cowbell')
      .cyl([0.13, 0.15, 0.09], [0, 0.095, 0], { color: '#9a9a9a', taper: 0.6 })
      .cyl([0.135, 0.015, 0.095], [0, 0.025, 0], { color: '#6a6a6a' })
      .ball(0.025, [0, 0.016, 0.02], { color: '#333333' })
      .torus([0.05, 0.05, 0.014], [0, 0.185, 0], { color: '#555555' })
      .rod([0.11, 0.0, 0.06], [0.04, 0.2, 0.08], 0.014, 'wood')
      .done(),
  ),
  e('cowboy boot', 'wardrobe', 'shoes', () =>
    m('cowboy boot')
      .box([0.08, 0.06, 0.07], [0, 0.03, -0.07], { color: 'darkbrown', round: 0.2 })
      .box([0.1, 0.08, 0.22], [0, 0.08, 0.02], { color: '#a0602a', round: 0.7, rot: [8, 0, 0] })
      .cone([0.08, 0.1, 0.06], [0, 0.05, 0.16], { color: '#a0602a', rot: [90, 0, 0] })
      .cyl([0.115, 0.26, 0.13], [0, 0.24, -0.04], { color: '#c8843a' })
      .box([0.02, 0.05, 0.03], [0.06, 0.37, -0.04], { color: '#a0602a', round: 0.5 })
      .box([0.02, 0.05, 0.03], [-0.06, 0.37, -0.04], { color: '#a0602a', round: 0.5 })
      .rod([-0.03, 0.32, 0.026], [0, 0.2, 0.026], 0.006, 'cream', { noInk: true })
      .rod([0.03, 0.32, 0.026], [0, 0.2, 0.026], 0.006, 'cream', { noInk: true })
      .done(),
  ),
  e('cowboy hat', 'wardrobe', 'hats', () => {
    const c = '#a0703a';
    const b = m('cowboy hat')
      .ball([0.36, 0.05, 0.38], [0, 0.03, 0], { color: c })
      .cyl([0.18, 0.12, 0.2], [0, 0.11, 0], { color: c, taper: 0.85 })
      .ball([0.155, 0.06, 0.17], [0, 0.17, 0], { color: c })
      .ball([0.04, 0.03, 0.12], [0, 0.195, 0], { color: '#8a5a2a', noInk: true })
      .cyl([0.186, 0.026, 0.206], [0, 0.065, 0], { color: 'darkbrown' });
    b.pair((s) => b.ball([0.1, 0.06, 0.34], [s * 0.17, 0.06, 0], { color: c, rot: [0, 0, s * 35] }));
    return b.done();
  }),
  e('crab cake', 'food', 'seafood', () => {
    const b = m('crab cake')
      .cyl([0.24, 0.015, 0.24], [0, 0.0075, 0], { color: 'white' })
      .ball([0.09, 0.045, 0.09], [-0.035, 0.035, 0.01], { color: '#c8872e' })
      .ball([0.09, 0.045, 0.09], [0.04, 0.04, -0.02], { color: '#d4943a', rot: [0, 0, -15] })
      .wedge([0.05, 0.04, 0.03], [0.06, 0.035, 0.07], { color: 'yellow', rot: [0, 30, 0] })
      .ball([0.04, 0.025, 0.04], [-0.06, 0.025, 0.07], { color: '#f8e8d0' });
    b.each(6, (i) => b.ball(0.008, [-0.06 + (i % 3) * 0.025, 0.055, Math.floor(i / 3) * 0.03 - 0.005], { color: i % 2 ? 'red' : 'green', noInk: true }));
    return b.done();
  }),
  e('cracker', 'food', 'snacks', () => {
    const b = m('cracker');
    b.each(4, (i) => b.box([0.065, 0.008, 0.065], [-0.02, 0.004 + i * 0.0085, 0], { color: '#e8b860', round: 0.3, rot: [0, i * 12, 0] }));
    b.box([0.065, 0.065, 0.008], [0.04, 0.034, 0.03], { color: '#e8b860', round: 0.3, rot: [-12, 0, 0] });
    b.each(9, (i) => b.ball(0.006, [0.02 + (i % 3) * 0.02, 0.014 + Math.floor(i / 3) * 0.02, 0.039 - Math.floor(i / 3) * 0.004], { color: '#b8853a', noInk: true }));
    return b.box([0.03, 0.03, 0.03], [-0.05, 0.05, 0.02], { color: 'cheese', round: 0.2 }).done();
  }),
  e('cradle', 'home', 'nursery', () => {
    const b = m('cradle')
      .box([0.85, 0.35, 0.45], [0, 0.45, 0], { color: 'wood', round: 0.15 })
      .box([0.8, 0.06, 0.42], [0, 0.63, 0], { color: 'pink', round: 0.5 })
      .ball([0.2, 0.08, 0.3], [-0.28, 0.66, 0], { color: 'white' })
      .ball([0.3, 0.55, 0.5], [-0.42, 0.68, 0], { color: '#f6c8d8' });
    b.pair((s) => {
      const z = s * 0.18;
      const xs = [-0.5, -0.25, 0, 0.25, 0.5];
      for (let i = 0; i < 4; i++) b.rod([xs[i], 0.02 + 0.6 * xs[i] * xs[i], z], [xs[i + 1], 0.02 + 0.6 * xs[i + 1] * xs[i + 1], z], 0.05, 'darkwood');
      b.stick([0.3, 0.07, z], [0.3, 0.3, z], 0.04, 'darkwood').stick([-0.3, 0.07, z], [-0.3, 0.3, z], 0.04, 'darkwood');
    });
    return b.done();
  }),
  e('cranberry', 'food', 'fruit', () => {
    const b = m('cranberry');
    for (const [x, y, z] of [[0, 0.012, 0], [0.024, 0.012, 0.01], [-0.022, 0.012, 0.012], [0.01, 0.012, -0.022], [-0.015, 0.012, -0.018], [0.004, 0.032, 0.002], [0.026, 0.012, -0.016]] as V[])
      b.ball(0.024, [x, y, z], { color: '#b0122b' });
    return b.ball([0.04, 0.008, 0.02], [-0.02, 0.04, 0.0], { color: 'leaf', rot: [0, 0, 25] }).done();
  }),
  e('cranberry sauce', 'food', 'sides', () => {
    const b = m('cranberry sauce')
      .cyl([0.24, 0.015, 0.24], [0, 0.0075, 0], { color: 'white' })
      .cyl([0.08, 0.1, 0.08], [-0.03, 0.065, -0.01], { color: '#8b0a1e' })
      .cyl([0.08, 0.016, 0.08], [0.06, 0.04, 0.03], { color: '#a0122a', rot: [70, 0, 0] })
      .cyl([0.08, 0.016, 0.08], [0.07, 0.025, 0.06], { color: '#a0122a', rot: [20, 0, 0] });
    b.each(3, (i) => b.torus([0.082, 0.082, 0.006], [-0.03, 0.04 + i * 0.025, -0.01], { color: '#6b0a18', rot: [90, 0, 0], tube: 0.08, noInk: true }));
    return b.done();
  }),
  e('crane (vehicle)', 'garage', 'construction vehicles', () => {
    const y = '#f2b81b';
    const b = m('crane (vehicle)')
      .box([2.4, 0.6, 2.4], [0, 0.3, 0], { color: '#999999' })
      .box([1.0, 8, 1.0], [0, 4.6, 0], { color: y, round: 0.05 })
      .box([1.4, 0.4, 1.4], [0, 8.8, 0], { color: '#555555' })
      .box([1.2, 1.0, 1.2], [0.6, 8.6, 0.8], { color: GLASS, round: 0.2 })
      .box([9, 0.6, 0.6], [3.5, 9.3, 0], { color: y })
      .box([3.5, 0.6, 0.6], [-2.6, 9.3, 0], { color: y })
      .box([1.2, 1.2, 0.9], [-3.6, 8.7, 0], { color: '#999999' })
      .cyl([0.9, 1.8, 0.9], [0, 10.5, 0], { color: y, taper: 0.15 })
      .rod([0, 11.3, 0], [7.8, 9.6, 0], 0.06, '#555555')
      .rod([0, 11.3, 0], [-4.2, 9.6, 0], 0.06, '#555555')
      .stick([6, 9.0, 0], [6, 5.2, 0], 0.05, '#333333')
      .box([0.5, 0.5, 0.4], [6, 5.0, 0], { color: y })
      .rod([6, 4.75, 0], [6.15, 4.5, 0], 0.08, '#333333');
    b.each(8, (i) => b.rod([-0.48, 0.7 + i, 0.52], [0.48, 1.6 + i, 0.52], 0.07, '#c89010', { noInk: true }));
    return b.done();
  }),
  e('crate', 'workshop', 'containers', () => {
    const b = m('crate').box([0.8, 0.7, 0.7], [0, 0.35, 0], { color: '#c8a06a', round: 0.03 });
    const f = '#9a7040';
    for (const zz of [0.355, -0.355]) {
      b.box([0.8, 0.08, 0.02], [0, 0.66, zz], { color: f }).box([0.8, 0.08, 0.02], [0, 0.04, zz], { color: f });
      b.box([0.08, 0.7, 0.02], [0.36, 0.35, zz], { color: f }).box([0.08, 0.7, 0.02], [-0.36, 0.35, zz], { color: f });
      b.rod([-0.33, 0.08, zz], [0.33, 0.62, zz], 0.06, f);
    }
    b.box([0.02, 0.08, 0.7], [0.405, 0.66, 0], { color: f }).box([0.02, 0.08, 0.7], [0.405, 0.04, 0], { color: f });
    return b.label('FRAGILE', [0.3, 0.09], [-0.12, 0.5, 0.37], { color: '#e8d0a0' }).done();
  }),
  e('crater', 'nature', 'landforms', () => {
    const b = m('crater')
      .cyl([14, 0.4, 14], [0, 0.2, 0], { color: '#a89a88' })
      .torus([11, 11, 2.4], [0, 1.4, 0], { color: '#9a8a78', rot: [90, 0, 0], tube: 0.32 })
      .cyl([6, 0.1, 6], [0, 0.45, 0], { color: '#6f6458' })
      .ball([1.2, 0.9, 1.0], [0.3, 0.8, 0.4], { color: '#5a4a3a' })
      .ball(0.5, [0.6, 1.1, 0.6], { color: 'orange', glow: true });
    around(9, 4.3, 0.2).forEach(([x, z], i) => b.ball([1.2 + rnd(i), 0.9 + rnd(i + 4) * 0.8, 1.1], [x, 2.2, z], { color: i % 2 ? '#8a7a68' : 'rock' }));
    for (const [x, z, s] of [[6, 4.5, 0.9], [-6.2, 3, 0.7], [4, -6, 0.8]]) b.ball([s, s * 0.6, s], [x, 0.5, z], { color: 'rock' });
    return b.done();
  }),
  e('crawlspace', 'places', 'rooms', () => {
    const b = m('crawlspace')
      .box([2.4, 0.04, 1.6], [0, 0.02, 0], { color: 'grass' })
      .box([1.8, 0.5, 1.2], [0, 0.27, 0], { color: '#9a958e', round: 0.03 })
      .box([0.7, 0.3, 0.02], [-0.3, 0.26, 0.605], { color: '#1e1a16' })
      .box([2.0, 0.08, 1.4], [0, 0.56, 0], { color: 'wood' })
      .box([1.9, 0.5, 1.3], [0, 0.85, 0], { color: '#7fa6c9', round: 0.02 })
      .stick([-0.65, 0.33, 0.6], [0.05, 0.33, 0.6], 0.035, 'copper')
      .stick([-0.65, 0.2, 0.6], [0.05, 0.2, 0.6], 0.05, '#dddddd')
      .box([0.25, 0.12, 0.02], [0.5, 0.28, 0.605], { color: '#555555' });
    b.each(4, (i) => b.box([0.22, 0.012, 0.01], [0.5, 0.24 + i * 0.025, 0.618], { color: '#888888', noInk: true }));
    return b.done();
  }),
  e('crayon', 'study', 'art supplies', () =>
    m('crayon')
      .cyl([0.022, 0.07, 0.022], [0, 0.035, 0], { color: 'red' })
      .cyl([0.0235, 0.045, 0.0235], [0, 0.035, 0], { color: '#b0101a' })
      .cyl([0.024, 0.004, 0.024], [0, 0.016, 0], { color: 'black', noInk: true })
      .cyl([0.024, 0.004, 0.024], [0, 0.054, 0], { color: 'black', noInk: true })
      .cyl([0.022, 0.02, 0.022], [0, 0.08, 0], { color: 'red', taper: 0.35 })
      .done(),
  ),
  e('cream', 'food', 'dairy', () =>
    m('cream')
      .cyl([0.07, 0.08, 0.07], [-0.04, 0.04, 0], { color: 'white', taper: 0.85 })
      .cyl([0.056, 0.006, 0.056], [-0.04, 0.08, 0], { color: 'cream', noInk: true })
      .cone([0.025, 0.02, 0.02], [-0.04, 0.078, 0.032], { color: 'white', rot: [-60, 0, 0] })
      .torus([0.05, 0.05, 0.012], [-0.085, 0.045, 0], { color: 'white' })
      .cyl([0.07, 0.03, 0.07], [0.06, 0.015, 0.03], { color: '#7fb3d5', taper: 1.4 })
      .torus([0.085, 0.085, 0.03], [0.06, 0.04, 0.03], { color: '#fffaf0', rot: [90, 0, 0], tube: 0.4 })
      .torus([0.06, 0.06, 0.025], [0.06, 0.063, 0.03], { color: '#fffaf0', rot: [90, 0, 0], tube: 0.4 })
      .cone([0.04, 0.04, 0.04], [0.06, 0.088, 0.03], { color: '#fffaf0' })
      .done(),
  ),
  e('cream cheese', 'food', 'dairy', () =>
    m('cream cheese')
      .box([0.1, 0.045, 0.06], [-0.04, 0.0225, -0.02], { color: 'silver', round: 0.2 })
      .box([0.06, 0.03, 0.004], [-0.04, 0.025, 0.011], { color: '#3a6fd8' })
      .torus([0.11, 0.11, 0.035], [0.07, 0.0175, 0.04], { color: '#c8872e', rot: [90, 0, 0], tube: 0.38 })
      .torus([0.1, 0.1, 0.014], [0.07, 0.036, 0.04], { color: 'white', rot: [90, 0, 0], tube: 0.38 })
      .done(),
  ),
  e('cream puff', 'food', 'desserts', () => {
    const b = m('cream puff')
      .ball([0.1, 0.05, 0.1], [0, 0.025, 0], { color: '#d9a050' })
      .ball([0.11, 0.032, 0.11], [0, 0.056, 0], { color: '#fffaf0' })
      .ball([0.1, 0.06, 0.1], [0, 0.085, 0], { color: '#d9a050' });
    b.each(6, (i) => b.ball(0.012, [Math.cos(i) * 0.02, 0.112, Math.sin(i) * 0.02], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('credit card', 'home', 'money', () =>
    m('credit card')
      .box([0.1, 0.014, 0.03], [0, 0.007, 0], { color: '#333333', round: 0.3 })
      .box([0.09, 0.057, 0.006], [0, 0.04, 0], { color: '#2a5bd7', round: 0.2 })
      .box([0.016, 0.012, 0.003], [-0.025, 0.045, 0.004], { color: 'gold', round: 0.2 })
      .label('1234 5678', [0.07, 0.01], [0, 0.026, 0.004], { color: '#2a5bd7' })
      .ball([0.018, 0.012, 0.003], [0.03, 0.06, 0.004], { color: 'orange', noInk: true })
      .done(),
  ),
  e('creek', 'nature', 'water', () => {
    const b = m('creek').box([2.4, 0.1, 1.6], [0, 0.05, 0], { color: 'grass', round: 0.3 });
    for (const [x, z, r] of [[-0.7, -0.3, 30], [0, 0.0, -15], [0.7, 0.3, 30]]) b.ball([1.0, 0.06, 0.45], [x, 0.1, z], { color: 'water', rot: [0, r, 0] });
    for (const [x, z, s] of [[-0.3, 0.3, 0.2], [0.3, -0.25, 0.16], [0.95, -0.1, 0.24], [-0.1, -0.05, 0.12]]) b.ball([s * 1.4, s, s * 1.2], [x, 0.1, z], { color: 'rock' });
    b.each(3, (i) => {
      const x = -0.8 + i * 0.12, z = 0.45 + (i % 2) * 0.08;
      b.stick([x, 0.08, z], [x, 0.85 + i * 0.06, z], 0.02, 'leaf').capsule([0.05, 0.14, 0.05], [x, 0.8 + i * 0.06, z], { color: 'darkbrown' });
    });
    return b.done();
  }),
  e('cricket bat', 'sports', 'bats', () =>
    m('cricket bat')
      .box([0.11, 0.56, 0.045], [0, 0.29, 0], { color: '#e8d5a0', round: 0.3 })
      .box([0.045, 0.5, 0.06], [0, 0.29, -0.012], { color: '#e8d5a0', round: 0.6 })
      .capsule([0.035, 0.3, 0.035], [0, 0.7, 0], { color: '#e8d5a0' })
      .cyl([0.042, 0.2, 0.042], [0, 0.75, 0], { color: 'red' })
      .box([0.112, 0.05, 0.004], [0, 0.48, 0.022], { color: 'blue', noInk: true })
      .ball(0.072, [0.13, 0.036, 0.06], { color: '#b0122b' })
      .torus([0.073, 0.073, 0.006], [0.13, 0.036, 0.06], { color: 'white', rot: [0, 60, 0], tube: 0.06, noInk: true })
      .done(),
  ),
  e('crock pot', 'kitchen', 'appliances', () =>
    m('crock pot')
      .cyl([0.32, 0.18, 0.25], [0, 0.1, 0], { color: '#333333' })
      .cyl([0.33, 0.02, 0.26], [0, 0.19, 0], { color: '#5a3a22' })
      .ball([0.3, 0.08, 0.23], [0, 0.205, 0], { color: GLASS, name: 'lid', pivot: [0, 0.2, -0.12] })
      .ball([0.05, 0.03, 0.05], [0, 0.25, 0], { color: '#222222', parent: 'lid' })
      .box([0.04, 0.025, 0.08], [0.17, 0.17, 0], { color: '#222222', round: 0.4 })
      .box([0.04, 0.025, 0.08], [-0.17, 0.17, 0], { color: '#222222', round: 0.4 })
      .cyl([0.045, 0.02, 0.045], [0, 0.08, 0.125], { color: 'silver', rot: [90, 0, 0] })
      .ball(0.014, [0.06, 0.08, 0.12], { color: 'red', glow: true })
      .done(),
  ),
  e('croissant', 'food', 'bread', () => {
    const b = m('croissant');
    const segs: Array<[number, number, string]> = [[-115, 0.026, '#c8822e'], [-60, 0.046, '#e0a850'], [0, 0.064, '#d4943a'], [60, 0.046, '#e0a850'], [115, 0.026, '#c8822e']];
    for (const [a, s, c] of segs) {
      const r = (a * Math.PI) / 180;
      b.ball([s * 1.9, s, s * 1.2], [Math.sin(r) * 0.05, s / 2, -Math.cos(r) * 0.05 + 0.02], { color: c, rot: [0, -a, 0] });
    }
    return b.done();
  }),
  e('cross', 'ideas', 'symbols', () =>
    m('cross')
      .ball([0.8, 0.25, 0.6], [0, 0.05, 0], { color: 'grass' })
      .box([0.18, 2.0, 0.14], [0, 1.0, 0], { color: 'wood', round: 0.1 })
      .box([0.95, 0.16, 0.14], [0, 1.45, 0], { color: 'wood', round: 0.1 })
      .done(),
  ),
  e('cross road sign', 'ideas', 'road signs', () =>
    roadSign('cross road sign', 'diamond', 'yellow', 0.6, 1.5)
      .box([0.07, 0.38, 0.02], [0, 1.5, 0.065], { color: 'black' })
      .box([0.38, 0.07, 0.02], [0, 1.5, 0.065], { color: 'black' })
      .done(),
  ),
  e('crossbow', 'armory', 'bows', () => {
    const b = m('crossbow')
      .box([0.06, 0.62, 0.08], [0, 0.4, 0], { color: 'wood', round: 0.3 })
      .box([0.08, 0.16, 0.12], [0, 0.08, -0.01], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.4, 0.05], [0, 0.82, 0.05], 0.014, 'darkwood')
      .cone([0.025, 0.05, 0.025], [0, 0.845, 0.05], { color: 'silver' })
      .box([0.012, 0.05, 0.004], [0, 0.42, 0.05], { color: 'red', noInk: true })
      .torus([0.07, 0.07, 0.014], [0, 0.78, 0.0], { color: '#555555' })
      .box([0.02, 0.05, 0.03], [0, 0.3, -0.05], { color: '#555555' });
    b.pair((s) => {
      b.rod([0, 0.68, 0.02], [s * 0.18, 0.67, 0.04], 0.035, '#444444').rod([s * 0.18, 0.67, 0.04], [s * 0.32, 0.6, 0.07], 0.03, '#444444');
      b.rod([s * 0.32, 0.6, 0.07], [0, 0.5, 0.05], 0.006, 'white');
    });
    return b.done();
  }),
  e('crossword puzzle', 'toys', 'puzzles', () => {
    const b = m('crossword puzzle')
      .box([0.27, 0.03, 0.06], [0, 0.015, 0], { color: 'darkwood', round: 0.3 })
      .box([0.25, 0.25, 0.01], [0, 0.155, 0], { color: 'white', round: 0.05 });
    b.each(4, (i) => b.box([0.003, 0.24, 0.002], [-0.072 + i * 0.048, 0.155, 0.006], { color: '#444444', noInk: true }).box([0.24, 0.003, 0.002], [0, 0.083 + i * 0.048, 0.006], { color: '#444444', noInk: true }));
    for (const [c, r] of [[1, 0], [3, 1], [0, 3], [2, 2], [4, 3], [1, 4]]) b.box([0.044, 0.044, 0.004], [-0.096 + c * 0.048, 0.251 - r * 0.048, 0.007], { color: 'black', round: 0.05 });
    return b.rod([0.1, 0.03, 0.06], [0.16, 0.2, 0.04], 0.012, 'yellow').done();
  }),
  e('croutons', 'food', 'bread', () => {
    const b = m('croutons').cyl([0.1, 0.04, 0.1], [0, 0.02, 0], { color: 'wood', taper: 1.4 });
    b.each(9, (i) => b.box(0.028, [-0.04 + (i % 3) * 0.04 + rnd(i) * 0.01, 0.045 + Math.floor(i / 3) * 0.012 - (i % 2) * 0.004, -0.035 + Math.floor(i / 3) * 0.035], { color: i % 2 ? '#d9a050' : '#c8872e', round: 0.25, rot: [rnd(i) * 40, rnd(i + 9) * 90, 0] }));
    return b.done();
  }),
  e('crowbar', 'workshop', 'hand tools', () =>
    m('crowbar')
      .box([0.28, 0.08, 0.1], [0.06, 0.04, 0], { color: 'wood', round: 0.15 })
      .rod([-0.06, 0.02, 0], [-0.16, 0.5, 0], 0.024, 'red')
      .rod([-0.16, 0.5, 0], [-0.14, 0.56, 0], 0.024, 'red')
      .rod([-0.14, 0.56, 0], [-0.09, 0.57, 0], 0.024, 'red')
      .rod([-0.09, 0.57, 0], [-0.075, 0.54, 0], 0.022, 'red')
      .rod([-0.06, 0.02, 0], [-0.01, 0.01, 0], 0.02, '#333333')
      .done(),
  ),
  e('crown', 'wardrobe', 'jewellery', () => {
    const b = m('crown')
      .cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: 'gold' })
      .ball([0.17, 0.13, 0.17], [0, 0.09, 0], { color: '#8b1a2b' })
      .ball(0.035, [0, 0.165, 0], { color: 'gold' });
    around(6, 0.095, 1.57).forEach(([x, z], i) => {
      b.cone([0.05, 0.08, 0.04], [x, 0.115, z], { color: 'gold', rot: [z * 120, 0, -x * 120] });
      b.ball(0.022, [x * 1.08, 0.16, z * 1.08], { color: 'gold' });
      b.ball(0.024, [x * 1.08, 0.04, z * 1.08], { color: i % 2 ? 'red' : 'blue' });
    });
    return b.done();
  }),
  e('cruise ship', 'garage', 'boats', () => {
    const b = m('cruise ship', { view: 'side' })
      .box([3, 2.2, 20], [0, 1.1, 0], { color: 'white', round: 0.2 })
      .box([3.04, 1.0, 19.8], [0, 0.5, 0], { color: 'navy', round: 0.2 })
      .wedge([3, 3, 2.2], [0, 1.1, 11.4], { color: 'white', rot: [90, 0, 0] })
      .wedge([3.04, 3, 1.0], [0, 0.5, 11.4], { color: 'navy', rot: [90, 0, 0] })
      .box([2.6, 1.2, 15], [0, 2.8, -1], { color: 'white', round: 0.2 })
      .box([2.2, 1.2, 11], [0, 4.0, -1.5], { color: 'white', round: 0.2 })
      .box([1.8, 1.0, 6], [0, 5.1, 0.5], { color: 'white', round: 0.2 })
      .box([1.82, 0.4, 5.6], [0, 5.2, 0.5], { color: '#2a4a7a', noInk: true })
      .cyl([1.3, 1.8, 1.8], [0, 6.2, -3.5], { color: 'red' })
      .cyl([1.32, 0.4, 1.82], [0, 7.0, -3.5], { color: 'black' });
    b.pair((s) => {
      b.box([0.04, 0.3, 18], [s * 1.51, 1.55, 0], { color: '#2a4a7a', noInk: true });
      b.box([0.04, 0.35, 14], [s * 1.31, 2.85, -1], { color: '#2a4a7a', noInk: true });
      b.box([0.04, 0.35, 10], [s * 1.11, 4.05, -1.5], { color: '#2a4a7a', noInk: true });
      b.each(4, (i) => b.capsule([0.5, 1.6, 0.5], [s * 1.45, 2.4, -6 + i * 3.4], { color: 'orange', rot: [90, 0, 0] }));
    });
    return b.done();
  }),
  e('crutch', 'clinic', 'mobility aids', () =>
    m('crutch')
      .capsule([0.11, 0.26, 0.11], [0, 1.33, 0], { color: '#777777', rot: [0, 0, 90] })
      .rod([0.07, 1.3, 0], [0.03, 0.6, 0], 0.03, 'silver')
      .rod([-0.07, 1.3, 0], [-0.03, 0.6, 0], 0.03, 'silver')
      .rod([-0.06, 0.88, 0], [0.06, 0.88, 0], 0.04, '#333333')
      .stick([0, 0.06, 0], [0, 0.62, 0], 0.035, 'silver')
      .box([0.08, 0.05, 0.03], [0, 0.6, 0], { color: 'silver', round: 0.3 })
      .cyl([0.06, 0.07, 0.06], [0, 0.035, 0], { color: 'rubber' })
      .done(),
  ),
  e('crystal', 'nature', 'minerals', () => {
    const b = m('crystal').ball([0.16, 0.05, 0.12], [0, 0.02, 0], { color: 'rock' });
    for (const [x, z, h, t] of [[0, 0, 0.12, 0], [0.035, 0.01, 0.08, 28], [-0.035, 0.012, 0.09, -25], [0.01, -0.03, 0.07, 10], [-0.01, 0.035, 0.06, -8]]) {
      const r = (t * Math.PI) / 180, d: V = [Math.sin(r), Math.cos(r), 0];
      b.cyl([0.035, h, 0.035], [x + d[0] * h * 0.5, 0.03 + d[1] * h * 0.5, z], { color: '#c8a8f0', segs: 6, rot: [0, 0, -t] });
      b.cone([0.035, 0.03, 0.035], [x + d[0] * (h + 0.015), 0.03 + d[1] * (h + 0.015), z], { color: '#dcc8ff', segs: 6, rot: [0, 0, -t] });
    }
    return b.done();
  }),
  e('crystal ball', 'fantasy', 'magic items', () => {
    const b = m('crystal ball')
      .cyl([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'gold' })
      .cyl([0.08, 0.04, 0.08], [0, 0.05, 0], { color: 'gold', taper: 1.3 })
      .ball(0.15, [0, 0.14, 0], { color: '#c8b8f0' })
      .ball(0.07, [0.012, 0.15, 0.035], { color: '#f0e0ff', glow: true });
    around(3, 0.05).forEach(([x, z]) => b.cone([0.025, 0.05, 0.02], [x, 0.08, z], { color: 'gold', rot: [z * 400, 0, -x * 400] }));
    return b.done();
  }),
  e('cube', 'ideas', 'shapes', () => m('cube').box(0.1, [0, 0.05, 0], { color: '#4a90d9', round: 0.12 }).done()),
  e('cuckoo clock', 'home', 'clocks', () => {
    const b = m('cuckoo clock')
      .box([0.3, 0.3, 0.15], [0, 0.42, 0], { color: 'wood' })
      .wedge([0.4, 0.15, 0.19], [0, 0.645, 0], { color: 'darkwood' })
      .cyl([0.15, 0.01, 0.15], [0, 0.38, 0.078], { color: 'cream', rot: [90, 0, 0] })
      .box([0.008, 0.055, 0.004], [0, 0.4, 0.086], { color: 'black' })
      .box([0.04, 0.008, 0.004], [0.018, 0.38, 0.086], { color: 'black' })
      .box([0.07, 0.07, 0.01], [0, 0.52, 0.078], { color: '#2a1a0a' })
      .ball(0.045, [0, 0.52, 0.09], { color: 'yellow' })
      .cone([0.018, 0.03, 0.018], [0, 0.515, 0.125], { color: 'orange', rot: [90, 0, 0] })
      .ball([0.12, 0.05, 0.03], [0, 0.73, 0.02], { color: 'darkwood' })
      .stick([0, 0.27, 0.03], [0, 0.12, 0.03], 0.008, 'gold')
      .cyl([0.05, 0.008, 0.05], [0, 0.12, 0.03], { color: 'gold', rot: [90, 0, 0] });
    b.pair((s) => b.stick([s * 0.08, 0.27, 0], [s * 0.08, 0.1, 0], 0.006, 'gold').capsule([0.04, 0.1, 0.04], [s * 0.08, 0.055, 0], { color: 'darkbrown' }));
    return b.done();
  }),
  e('cucumber', 'food', 'vegetables', () => {
    const b = m('cucumber')
      .capsule([0.06, 0.24, 0.06], [-0.03, 0.03, -0.02], { color: '#2f6b2a', rot: [0, 0, 90] })
      .cyl([0.052, 0.01, 0.052], [0.07, 0.026, 0.06], { color: '#2f6b2a', rot: [90, 0, 0] })
      .cyl([0.046, 0.012, 0.046], [0.07, 0.026, 0.066], { color: '#d8efb0', rot: [90, 0, 0] })
      .cyl([0.052, 0.01, 0.052], [0.13, 0.026, 0.05], { color: '#2f6b2a', rot: [90, 0, 0] })
      .cyl([0.046, 0.012, 0.046], [0.13, 0.026, 0.056], { color: '#d8efb0', rot: [90, 0, 0] });
    b.each(6, (i) => b.ball(0.01, [-0.12 + i * 0.035, 0.058, -0.02 + (i % 2) * 0.012], { color: '#5a9a4a', noInk: true }));
    return b.done();
  }),
  e('cup', 'kitchen', 'tableware', () => mug('cup', '#4a90d9', 'coffee').done()),
  e('cup holder', 'garage', 'car parts', () =>
    m('cup holder')
      .box([0.22, 0.08, 0.14], [0, 0.04, 0], { color: '#2a2a2a', round: 0.3 })
      .cyl([0.085, 0.01, 0.085], [-0.055, 0.081, 0], { color: '#111111' })
      .cyl([0.085, 0.01, 0.085], [0.055, 0.081, 0], { color: '#111111' })
      .cyl([0.072, 0.13, 0.072], [0.055, 0.11, 0], { color: 'white', taper: 1.2 })
      .cyl([0.09, 0.015, 0.09], [0.055, 0.18, 0], { color: '#333333' })
      .cyl([0.088, 0.035, 0.088], [0.055, 0.12, 0], { color: '#8a5a2b' })
      .done(),
  ),
  e('cupcake', 'food', 'desserts', () => {
    const b = m('cupcake')
      .cyl([0.06, 0.045, 0.06], [0, 0.0225, 0], { color: '#f48fb1', taper: 1.3 })
      .ball([0.085, 0.04, 0.085], [0, 0.05, 0], { color: '#c98a4b' })
      .torus([0.08, 0.08, 0.03], [0, 0.066, 0], { color: '#fbd3e3', rot: [90, 0, 0], tube: 0.4 })
      .torus([0.058, 0.058, 0.026], [0, 0.085, 0], { color: '#fbd3e3', rot: [90, 0, 0], tube: 0.4 })
      .cone([0.04, 0.035, 0.04], [0, 0.11, 0], { color: '#fbd3e3' })
      .ball(0.022, [0, 0.135, 0], { color: 'red' });
    around(10, 1).forEach(([x, z]) => b.rod([x * 0.031, 0.003, z * 0.031], [x * 0.039, 0.043, z * 0.039], 0.004, '#e0709a', { noInk: true }));
    b.each(6, (i) => b.box([0.012, 0.004, 0.004], [Math.cos(i * 1.1) * 0.03, 0.082, Math.sin(i * 1.1) * 0.03], { color: COLS[i], rot: [0, i * 50, 0], noInk: true }));
    return b.done();
  }),
  e('cyanide', 'study', 'lab chemicals', () =>
    bottle('cyanide', '#2f5a3a', 'black', 0.14, 0.075)
      .ball([0.032, 0.03, 0.012], [0, 0.058, 0.036], { color: 'white' })
      .ball(0.008, [-0.007, 0.06, 0.042], { color: 'black', noInk: true })
      .ball(0.008, [0.007, 0.06, 0.042], { color: 'black', noInk: true })
      .rod([-0.018, 0.022, 0.038], [0.018, 0.04, 0.038], 0.007, 'white')
      .rod([0.018, 0.022, 0.038], [-0.018, 0.04, 0.038], 0.007, 'white')
      .done(),
  ),
  e('cylinder', 'ideas', 'shapes', () => m('cylinder').cyl([0.1, 0.15, 0.1], [0, 0.075, 0], { color: '#e8a33a' }).done()),
  e('cymbals', 'music', 'drums', () => {
    const b = m('cymbals')
      .stick([0, 0.25, 0], [0, 0.88, 0], 0.025, 'silver')
      .cyl([0.38, 0.07, 0.38], [0, 0.745, 0], { color: 'gold', taper: 0.22, rot: [180, 0, 0] })
      .cyl([0.38, 0.07, 0.38], [0, 0.825, 0], { color: 'gold', taper: 0.22 })
      .box([0.1, 0.03, 0.25], [0, 0.015, 0.22], { color: '#333333', round: 0.3 });
    around(3, 0.25, 1.57).forEach(([x, z]) => b.rod([x, 0, z], [0, 0.3, 0], 0.02, 'silver'));
    return b.done();
  }),
  e('cypress tree', 'garden', 'trees', () => {
    const b = m('cypress tree')
      .stick([0, 0, 0], [0, 1.0, 0], 0.35, 'bark')
      .ball([1.6, 6.0, 1.6], [0, 3.8, 0], { color: '#2f5a2a', name: 'top' })
      .ball([1.2, 3, 1.2], [0, 6.4, 0], { color: '#355f2c', parent: 'top' })
      .cone([0.7, 1.4, 0.7], [0, 8.1, 0], { color: '#355f2c', parent: 'top' });
    for (const [x, y, z] of [[0.5, 2.5, 0.45], [-0.4, 3.8, 0.55], [0.3, 5.2, 0.5], [-0.3, 6.6, 0.4]] as V[]) b.ball([0.6, 1.0, 0.3], [x, y, z], { color: '#3f6f35', parent: 'top', noInk: true });
    return b.done();
  }),
  e('dagger', 'armory', 'blades', () =>
    m('dagger')
      .ball(0.036, [0, 0.018, 0], { color: 'gold' })
      .cyl([0.028, 0.08, 0.028], [0, 0.07, 0], { color: 'darkbrown' })
      .box([0.1, 0.02, 0.03], [0, 0.12, 0], { color: 'gold', round: 0.5 })
      .cyl([0.045, 0.17, 0.014], [0, 0.215, 0], { color: 'silver', taper: 0.12 })
      .box([0.005, 0.13, 0.016], [0, 0.2, 0], { color: '#d8d8e0', noInk: true })
      .ball(0.018, [0, 0.12, 0.016], { color: 'red' })
      .done(),
  ),
  e('dam', 'places', 'landmarks', () =>
    m('dam')
      .box([2.4, 0.85, 0.8], [0, 0.425, -0.58], { color: 'water' })
      .box([2.4, 1.0, 0.38], [0, 0.5, 0], { color: '#b5b5b0', round: 0.05 })
      .box([2.5, 0.06, 0.42], [0, 1.03, 0], { color: '#666666' })
      .box([0.5, 0.9, 0.06], [0, 0.48, 0.22], { color: '#7ec8f0', round: 0.3 })
      .ball([0.7, 0.18, 0.3], [0, 0.08, 0.3], { color: 'white' })
      .box([2.4, 0.06, 0.8], [0, 0.03, 0.62], { color: 'water' })
      .ball([0.6, 0.6, 1.8], [1.35, 0.25, 0], { color: 'rock' })
      .ball([0.6, 0.6, 1.8], [-1.35, 0.25, 0], { color: 'rock' })
      .done(),
  ),
  e('dance floor', 'places', 'rooms', () => {
    const b = m('dance floor').box([0.74, 0.06, 0.74], [0, 0.03, 0], { color: '#222222', round: 0.1 });
    b.each(16, (i) => b.box([0.16, 0.02, 0.16], [-0.255 + (i % 4) * 0.17, 0.065, -0.255 + Math.floor(i / 4) * 0.17], { color: ['magenta', 'cyan', 'yellow', 'lime'][(i + Math.floor(i / 4)) % 4], glow: true, round: 0.1 }));
    return b.done();
  }),
  e('dandelion', 'garden', 'flowers', () => {
    const b = m('dandelion');
    around(5, 0.06, 0.2).forEach(([x, z]) => b.ball([0.035, 0.012, 0.13], [x, 0.008, z], { color: 'leaf', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, 0] }));
    return b
      .stick([0, 0, 0], [-0.04, 0.2, 0], 0.01, '#7aa04a')
      .ball([0.075, 0.03, 0.075], [-0.04, 0.21, 0.005], { color: 'yellow', rot: [40, 0, 0], name: 'head' })
      .ball([0.03, 0.02, 0.03], [-0.04, 0.218, 0.014], { color: 'gold', rot: [40, 0, 0], parent: 'head' })
      .stick([0.01, 0, 0], [0.04, 0.26, 0], 0.01, '#7aa04a')
      .ball(0.085, [0.04, 0.29, 0], { color: '#f4f4f4' })
      .ball(0.02, [0.04, 0.29, 0], { color: '#c8b88a' })
      .done();
  }),
  e('dandruff', 'clinic', 'body', () => {
    const b = m('dandruff')
      .box([0.36, 0.12, 0.16], [0, 0.06, 0], { color: 'navy', round: 0.8 })
      .cyl([0.08, 0.06, 0.08], [0, 0.15, 0], { color: 'skin2' })
      .ball([0.14, 0.17, 0.15], [0, 0.25, 0.005], { color: 'skin2' })
      .ball([0.152, 0.1, 0.16], [0, 0.305, -0.01], { color: 'darkbrown' });
    b.each(14, (i) => b.box([0.012, 0.004, 0.01], [-0.15 + rnd(i) * 0.3, i < 10 ? 0.121 : 0.35, -0.05 + rnd(i + 20) * 0.1], { color: 'white', rot: [0, rnd(i + 5) * 90, 0], noInk: true }));
    return b.done();
  }),
  e('danger sign', 'ideas', 'road signs', () =>
    roadSign('danger sign', 'tri', 'yellow', 0.62, 1.2)
      .box([0.05, 0.17, 0.02], [0, 1.2, 0.065], { color: 'black', round: 0.3 })
      .ball(0.055, [0, 1.06, 0.065], { color: 'black' })
      .done(),
  ),
  e('dart', 'sports', 'darts', () =>
    m('dart')
      .cone([0.008, 0.04, 0.008], [0, 0.02, 0], { color: 'silver', rot: [180, 0, 0] })
      .cyl([0.02, 0.05, 0.02], [0, 0.065, 0], { color: '#888888' })
      .stick([0, 0.09, 0], [0, 0.13, 0], 0.008, 'black')
      .ball([0.05, 0.055, 0.004], [0, 0.14, 0], { color: 'red' })
      .ball([0.004, 0.055, 0.05], [0, 0.14, 0], { color: 'red' })
      .done(),
  ),
  e('dartboard', 'sports', 'darts', () => {
    const b = m('dartboard').box([0.32, 0.05, 0.16], [0, 0.025, 0], { color: 'darkwood', round: 0.3 });
    const rings: Array<[number, string]> = [[0.45, '#1e1e1e'], [0.36, 'red'], [0.33, 'cream'], [0.22, 'green'], [0.19, 'cream'], [0.07, 'green'], [0.03, 'red']];
    rings.forEach(([d, c], i) => b.cyl([d, 0.04, d], [0, 0.275, i * 0.004], { color: c, rot: [90, 0, 0] }));
    for (const [x, y] of [[0.05, 0.3], [-0.06, 0.25]]) b.stick([x, y, 0.04], [x + 0.01, y + 0.01, 0.1], 0.012, '#888888').ball([0.04, 0.04, 0.004], [x + 0.012, y + 0.012, 0.115], { color: 'yellow' });
    return b.done();
  }),
  e('date palm', 'garden', 'palm trees', () => palm('date palm', 7, '#b8641e', 0.38, 7, 0.03).done()),
  e('daycare', 'places', 'schools', () => {
    const b = bld('daycare', { w: 6, h: 3, d: 4, wall: '#ffd966', gable: 1.6, roof: '#e8413a', sign: 'DAYCARE', signC: 'skyblue', door: '#4a90d9' })
      .box([0.7, 0.08, 0.6], [3.8, 1.4, -0.5], { color: '#4a90d9' })
      .box([0.6, 0.06, 2.4], [3.8, 0.8, 0.75], { color: 'red', rot: [30.8, 0, 0] });
    b.pair((s) => b.stick([3.8 + s * 0.3, 0, -0.75], [3.8 + s * 0.3, 1.4, -0.75], 0.08, '#4a90d9'));
    for (const [x, c, l] of [[-1.6, 'red', 'A'], [-1.0, 'blue', 'B'], [-1.3, 'green', 'C']] as Array<[number, string, string]>) b.label(l, [0.45, 0.45], [x, l === 'C' ? 0.68 : 0.23, 2.4], { color: c });
    return b.done();
  }),
  e('deadbolt', 'workshop', 'hardware', () =>
    m('deadbolt')
      .box([0.14, 0.2, 0.04], [0, 0.1, 0], { color: 'wood', round: 0.1 })
      .cyl([0.065, 0.012, 0.065], [0, 0.12, 0.026], { color: 'brass', rot: [90, 0, 0] })
      .box([0.015, 0.042, 0.016], [0, 0.12, 0.04], { color: 'brass', round: 0.5 })
      .box([0.05, 0.022, 0.022], [0.09, 0.12, 0], { color: 'brass', round: 0.3 })
      .box([0.008, 0.06, 0.03], [0.072, 0.12, 0], { color: 'brass' })
      .done(),
  ),
  e('debris', 'workshop', 'building materials', () =>
    m('debris')
      .ball([0.8, 0.25, 0.6], [0, 0.1, 0], { color: '#8a8378' })
      .box([0.25, 0.15, 0.2], [-0.1, 0.25, 0], { color: '#a8a8a4', round: 0.1, rot: [20, 30, 10] })
      .box([0.2, 0.12, 0.18], [0.16, 0.22, 0.08], { color: '#b5b5b0', round: 0.1, rot: [-15, 10, 20] })
      .box([0.2, 0.06, 0.1], [0.05, 0.33, 0.05], { color: '#b5462e', round: 0.1, rot: [0, 40, 15] })
      .box([0.2, 0.06, 0.1], [-0.27, 0.13, 0.18], { color: '#b5462e', round: 0.1, rot: [0, -20, 0] })
      .box([0.5, 0.04, 0.1], [0.1, 0.36, -0.1], { color: 'wood', round: 0.1, rot: [0, 10, 28] })
      .rod([-0.05, 0.28, -0.05], [-0.16, 0.56, -0.12], 0.02, '#8a4a2a')
      .rod([-0.02, 0.28, -0.05], [0.04, 0.5, -0.16], 0.02, '#8a4a2a')
      .done(),
  ),
  e('decanter', 'kitchen', 'glassware', () =>
    m('decanter')
      .ball([0.18, 0.1, 0.18], [0, 0.05, 0], { color: '#7a1a2a' })
      .cyl([0.17, 0.05, 0.17], [0, 0.11, 0], { color: GLASS, taper: 0.35 })
      .cyl([0.05, 0.1, 0.05], [0, 0.18, 0], { color: GLASS })
      .torus([0.07, 0.07, 0.015], [0, 0.235, 0], { color: GLASS, rot: [90, 0, 0] })
      .ball(0.05, [0, 0.265, 0], { color: GLASS })
      .done(),
  ),
  e('declaration of independence', 'study', 'documents', () => {
    const b = m('declaration of independence')
      .box([0.6, 0.05, 0.14], [0, 0.025, 0], { color: 'darkwood', round: 0.3 })
      .box([0.5, 0.56, 0.01], [0, 0.33, 0], { color: '#e8d5a8' })
      .capsule([0.04, 0.52, 0.04], [0, 0.62, 0], { color: '#d9c08a', rot: [0, 0, 90] })
      .capsule([0.04, 0.52, 0.04], [0, 0.065, 0.005], { color: '#d9c08a', rot: [0, 0, 90] })
      .label('IN CONGRESS, JULY 4, 1776', [0.42, 0.05], [0, 0.55, 0.008], { color: '#e8d5a8' })
      .cyl([0.06, 0.05, 0.06], [0.22, 0.075, 0.05], { color: 'black' })
      .rod([0.22, 0.09, 0.05], [0.32, 0.36, 0.03], 0.02, 'white');
    b.each(8, (i) => b.box([0.38, 0.006, 0.003], [0, 0.48 - i * 0.035, 0.006], { color: '#7a5a3a', noInk: true }));
    b.each(4, (i) => b.rod([-0.18 + i * 0.1, 0.12, 0.006], [-0.12 + i * 0.1, 0.14, 0.006], 0.005, '#3a2a1a', { noInk: true }));
    return b.done();
  }),
  e('deep fryer', 'kitchen', 'appliances', () => {
    const b = m('deep fryer')
      .box([0.35, 0.25, 0.3], [0, 0.125, 0], { color: 'silver', round: 0.1 })
      .box([0.3, 0.02, 0.24], [0, 0.252, 0], { color: '#d9a020' })
      .box([0.2, 0.12, 0.18], [0, 0.33, 0], { color: '#8a8a8a', round: 0.1 })
      .rod([0, 0.35, 0.09], [0, 0.38, 0.26], 0.025, 'black')
      .cyl([0.04, 0.02, 0.04], [0.1, 0.12, 0.155], { color: 'black', rot: [90, 0, 0] })
      .ball(0.014, [-0.1, 0.12, 0.152], { color: 'orange', glow: true });
    b.each(7, (i) => b.box([0.014, 0.08, 0.014], [-0.06 + i * 0.02, 0.4, -0.04 + (i % 3) * 0.03], { color: '#f2c94c', rot: [0, 0, (i % 2 ? 1 : -1) * 15] }));
    return b.done();
  }),
  e('deer caution sign', 'ideas', 'road signs', () => {
    const y = 1.5, z = 0.065, k = 'black';
    const b = roadSign('deer caution sign', 'diamond', 'yellow', 0.66, y)
      .ball([0.16, 0.07, 0.01], [0, y, z], { color: k })
      .rod([0.06, y + 0.01, z], [0.12, y + 0.09, z], 0.03, k)
      .ball([0.05, 0.03, 0.01], [0.14, y + 0.1, z], { color: k })
      .rod([0.11, y + 0.11, z], [0.09, y + 0.17, z], 0.012, k)
      .rod([0.12, y + 0.11, z], [0.15, y + 0.17, z], 0.012, k);
    for (const [a, c] of [[[0.05, y], [0.1, y - 0.1]], [[0.04, y], [0.06, y - 0.12]], [[-0.05, y], [-0.12, y - 0.08]], [[-0.06, y], [-0.1, y - 0.11]]] as Array<[[number, number], [number, number]]>) b.rod([a[0], a[1], z], [c[0], c[1], z], 0.016, k);
    return b.done();
  }),
  e('defibrillator', 'clinic', 'medical equipment', () =>
    m('defibrillator')
      .box([0.3, 0.25, 0.12], [0, 0.125, 0], { color: '#2e9e4a', round: 0.3 })
      .box([0.2, 0.15, 0.01], [0, 0.14, 0.062], { color: 'white', round: 0.2 })
      .heart(0.09, [0, 0.15, 0.07], { color: 'red' })
      .rod([0.0, 0.19, 0.08], [-0.015, 0.15, 0.08], 0.008, 'yellow', { noInk: true })
      .rod([-0.015, 0.15, 0.08], [0.015, 0.145, 0.08], 0.008, 'yellow', { noInk: true })
      .rod([0.015, 0.145, 0.08], [0.0, 0.105, 0.08], 0.008, 'yellow', { noInk: true })
      .cyl([0.04, 0.015, 0.04], [0.11, 0.045, 0.062], { color: 'orange', rot: [90, 0, 0], glow: true })
      .torus([0.14, 0.07, 0.03], [0, 0.26, 0], { color: '#1e6e32' })
      .done(),
  ),
  e('deli', 'places', 'shops', () => {
    const b = bld('deli', { w: 5, h: 3.6, d: 4, wall: '#f2e8d8', roof: '#2e7d4f', sign: 'DELI', signC: 'darkgreen', door: '#2e7d4f' });
    b.each(6, (i) => b.box([0.84, 0.08, 1.1], [-2.1 + i * 0.84, 2.62, 2.45], { color: i % 2 ? 'white' : '#2e7d4f', round: 0.1, rot: [25, 0, 0] }));
    b.pair((s) => b.each(3, (i) => b.capsule([0.14, 0.5, 0.14], [s * (1.2 + i * 0.3), 1.2, 2.08], { color: '#9a3a2a' })));
    return b
      .capsule([0.8, 2.8, 0.8], [0, 4.2, 0], { color: '#e0a850', rot: [0, 0, 90] })
      .box([2.6, 0.12, 0.85], [0, 4.2, 0], { color: 'lettuce', round: 0.5 })
      .box([2.5, 0.1, 0.8], [0, 4.1, 0], { color: 'tomato', round: 0.5 })
      .done();
  }),
  e('denim', 'wardrobe', 'fabric', () =>
    m('denim')
      .box([0.12, 0.48, 0.36], [-0.12, 0.24, 0], { color: 'denim', round: 0.3 })
      .box([0.13, 0.02, 0.37], [-0.12, 0.4, 0], { color: '#c87533', noInk: true })
      .box([0.3, 0.06, 0.24], [0.12, 0.03, 0.04], { color: '#3a5a8a', round: 0.4 })
      .box([0.29, 0.06, 0.23], [0.12, 0.09, 0.04], { color: 'denim', round: 0.4, rot: [0, 6, 0] })
      .box([0.28, 0.06, 0.22], [0.12, 0.15, 0.04], { color: '#5a7ab0', round: 0.4, rot: [0, -5, 0] })
      .box([0.24, 0.004, 0.004], [0.12, 0.181, 0.13], { color: '#e8a040', noInk: true })
      .done(),
  ),
  e('denim jacket', 'wardrobe', 'coats', () => {
    const b = jacket('denim jacket', 'denim', 0.7, 'silver');
    b.pair((s) => b.box([0.1, 0.07, 0.012], [s * 0.1, 0.46, 0.088], { color: '#3a5a8a', round: 0.3 }));
    return b.box([0.42, 0.04, 0.17], [0, 0.04, 0], { color: '#3a5a8a', round: 0.3 }).done();
  }),
  e('denim skirt', 'wardrobe', 'skirts', () => {
    const b = m('denim skirt')
      .cyl([0.5, 0.48, 0.36], [0, 0.24, 0], { color: 'denim', taper: 0.68 })
      .cyl([0.35, 0.06, 0.255], [0, 0.5, 0], { color: '#3a5a8a' })
      .ball(0.02, [0.03, 0.5, 0.128], { color: 'gold' })
      .rod([0, 0.02, 0.18], [0, 0.47, 0.124], 0.005, '#e8a040', { noInk: true });
    b.pair((s) => b.box([0.09, 0.08, 0.01], [s * 0.1, 0.38, 0.135], { color: '#3a5a8a', round: 0.3, rot: [-8, 0, 0] }));
    return b.done();
  }),
  e('dental chair', 'clinic', 'dentist', () =>
    m('dental chair', { view: 'side' })
      .cyl([0.55, 0.06, 0.65], [0, 0.03, 0], { color: '#999999' })
      .cyl([0.2, 0.4, 0.2], [0, 0.25, 0], { color: '#bbbbbb' })
      .box([0.55, 0.12, 0.6], [0, 0.5, 0], { color: '#3aa8b8', round: 0.5 })
      .box([0.55, 0.12, 0.7], [0, 0.77, -0.52], { color: '#3aa8b8', round: 0.5, rot: [50, 0, 0] })
      .box([0.3, 0.1, 0.22], [0, 1.06, -0.8], { color: '#3aa8b8', round: 0.6, rot: [50, 0, 0] })
      .box([0.5, 0.12, 0.6], [0, 0.4, 0.55], { color: '#3aa8b8', round: 0.5, rot: [-25, 0, 0] })
      .stick([0.4, 0.05, -0.6], [0.4, 1.6, -0.6], 0.06, '#cccccc')
      .rod([0.4, 1.6, -0.6], [0.1, 1.6, 0.1], 0.05, '#cccccc')
      .box([0.22, 0.1, 0.14], [0.1, 1.55, 0.15], { color: '#eeeeee', round: 0.4 })
      .ball([0.16, 0.04, 0.1], [0.1, 1.5, 0.15], { color: 'yellow', glow: true })
      .box([0.3, 0.03, 0.2], [-0.45, 0.85, 0.2], { color: '#dddddd' })
      .stick([-0.45, 0.4, 0.2], [-0.45, 0.84, 0.2], 0.04, '#cccccc')
      .done(),
  ),
  e('dental drill', 'clinic', 'dentist', () =>
    m('dental drill')
      .box([0.12, 0.04, 0.08], [0, 0.02, 0], { color: 'white', round: 0.3 })
      .rod([0, 0.03, 0], [0.02, 0.17, 0], 0.024, '#e8e8e8')
      .rod([0.02, 0.17, 0], [0.04, 0.19, 0.0], 0.024, 'silver')
      .stick([0.042, 0.188, 0.0], [0.06, 0.17, 0.0], 0.006, 'gold')
      .rod([0, 0.03, 0], [0.1, 0.02, -0.06], 0.014, '#888888')
      .done(),
  ),
  e('dentist office', 'places', 'clinics', () =>
    bld('dentist office', { w: 5, h: 3.2, d: 4, wall: '#e8f4f8', roof: '#3aa8b8', sign: 'DENTIST', signC: '#3aa8b8', door: '#3aa8b8' })
      .ball([1.3, 1.0, 0.6], [0, 4.3, 0], { color: 'white' })
      .capsule([0.4, 0.8, 0.4], [-0.3, 3.75, 0], { color: 'white', rot: [0, 0, -10] })
      .capsule([0.4, 0.8, 0.4], [0.3, 3.75, 0], { color: 'white', rot: [0, 0, 10] })
      .done(),
  ),
  e('dentures', 'clinic', 'dentist', () => {
    const b = m('dentures');
    for (const [gy, ty, open] of [[0.065, 0.048, -12], [0.012, 0.029, 0]] as Array<[number, number, number]>)
      for (let i = 0; i < 7; i++) {
        const a = ((-80 + i * 26.7) * Math.PI) / 180;
        const x = Math.sin(a) * 0.045, z = Math.cos(a) * 0.038;
        b.ball([0.03, 0.025, 0.026], [x, gy, z - 0.02 + (open ? 0.004 : 0)], { color: '#e88a9a' });
        b.ball([0.017, 0.022, 0.014], [x * 1.04, ty, z * 1.04 - 0.02], { color: 'white' });
      }
    return b.done();
  }),
  e('deodorant', 'home', 'bathroom', () =>
    m('deodorant')
      .cyl([0.06, 0.12, 0.036], [0, 0.06, 0], { color: 'white' })
      .cyl([0.062, 0.035, 0.038], [0, 0.137, 0], { color: '#3a6fd8' })
      .label('FRESH', [0.045, 0.05], [0, 0.06, 0.02], { color: '#3a6fd8' })
      .done(),
  ),
  e('department store', 'places', 'shops', () => {
    const b = bld('department store', { w: 12, h: 9, d: 7, wall: '#e8ddd0', roof: '#7a5a8a', sign: 'DEPARTMENT STORE', signC: '#7a2a5a', win: [2, 5], door: GLASS });
    b.pair((s) => b.box([3, 0.1, 1.2], [s * 3.6, 2.3, 3.9], { color: '#7a2a5a', rot: [20, 0, 0] }));
    for (const [x, c] of [[-4, 'red'], [0, 'blue'], [4, 'gold']] as Array<[number, string]>) b.stick([x, 9.2, 0], [x, 11.5, 0], 0.1, 'silver').box([1.2, 0.7, 0.05], [x + 0.62, 11.1, 0], { color: c, round: 0.1 });
    return b.done();
  }),
  e('desk', 'home', 'tables', () => {
    const b = m('desk')
      .box([1.2, 0.05, 0.6], [0, 0.735, 0], { color: 'wood', round: 0.2 })
      .box([0.4, 0.71, 0.56], [0.38, 0.355, 0], { color: 'wood', round: 0.05 })
      .box([0.8, 0.4, 0.03], [-0.15, 0.5, -0.27], { color: 'darkwood' });
    b.each(3, (i) => b.box([0.36, 0.2, 0.02], [0.38, 0.13 + i * 0.22, 0.285], { color: 'lightwood', round: 0.2 }).ball(0.025, [0.38, 0.13 + i * 0.22, 0.3], { color: 'brass' }));
    b.pair((s) => b.stick([-0.55, 0, s * 0.25], [-0.55, 0.71, s * 0.25], 0.05, 'darkwood'));
    return b
      .cyl([0.12, 0.02, 0.12], [-0.4, 0.77, -0.1], { color: '#333333' })
      .rod([-0.4, 0.77, -0.1], [-0.35, 1.0, -0.05], 0.02, '#333333')
      .cone([0.18, 0.12, 0.18], [-0.32, 1.04, -0.02], { color: 'green', taper: 0.4 })
      .box([0.3, 0.02, 0.22], [-0.05, 0.77, 0.1], { color: 'white', rot: [0, 10, 0] })
      .done();
  }),
  e('dial', 'tech', 'controls', () => {
    const b = m('dial')
      .box([0.16, 0.02, 0.06], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.14, 0.12, 0.03], [0, 0.08, 0], { color: '#555555', round: 0.2 })
      .cyl([0.06, 0.03, 0.06], [0, 0.075, 0.03], { color: 'silver', rot: [90, 0, 0] })
      .box([0.006, 0.024, 0.004], [0, 0.09, 0.047], { color: 'red' });
    b.each(7, (i) => {
      const a = ((-135 + i * 45) * Math.PI) / 180;
      b.box([0.004, 0.01, 0.004], [Math.sin(a) * 0.045, 0.075 + Math.cos(a) * 0.045, 0.016], { color: 'white', rot: [0, 0, (-a * 180) / Math.PI], noInk: true });
    });
    return b.done();
  }),
  e('diamond', 'nature', 'minerals', () =>
    m('diamond')
      .box([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'darkred', round: 0.8 })
      .cone([0.09, 0.06, 0.09], [0, 0.06, 0], { color: '#bfefff', rot: [180, 0, 0] })
      .cyl([0.09, 0.025, 0.09], [0, 0.1025, 0], { color: '#d8f6ff', taper: 0.6 })
      .ball(0.014, [0.015, 0.105, 0.03], { color: 'white', glow: true })
      .done(),
  ),
  e('diamond mine', 'places', 'mines', () => {
    const b = m('diamond mine')
      .ball([4, 2.6, 3], [0, 1.3, -0.4], { color: '#8a6a45' })
      .box([1.1, 1.7, 0.1], [0, 0.85, 1.02], { color: '#1e1a16' })
      .stick([0.6, 0, 1.1], [0.6, 1.9, 1.1], 0.18, 'darkwood')
      .stick([-0.6, 0, 1.1], [-0.6, 1.9, 1.1], 0.18, 'darkwood')
      .box([1.6, 0.25, 0.25], [0, 1.95, 1.1], { color: 'darkwood' })
      .label('DIAMOND MINE', [1.5, 0.3], [0, 2.3, 1.15], { color: 'cream' })
      .box([0.8, 0.5, 0.6], [0, 0.45, 2.0], { color: 'steel', round: 0.1 });
    b.pair((s) => {
      b.stick([s * 0.35, 0.03, 1.0], [s * 0.35, 0.03, 2.8], 0.05, 'iron');
      for (const z of [1.75, 2.25]) b.torus([0.3, 0.3, 0.08], [s * 0.42, 0.15, z], { color: '#333333', rot: [0, 90, 0] });
    });
    around(5, 0.15).forEach(([x, z], i) => b.cone([0.14, 0.16, 0.14], [x, 0.76 + (i % 2) * 0.05, 2.0 + z], { color: '#9fe8ff', rot: [i * 20, 0, i * 15] }));
    return b.done();
  }),
  e('diamond ring', 'wardrobe', 'jewellery', () =>
    m('diamond ring')
      .box([0.07, 0.035, 0.06], [0, 0.0175, 0], { color: 'darkred', round: 0.4 })
      .box([0.07, 0.05, 0.012], [0, 0.06, -0.03], { color: 'darkred', round: 0.4 })
      .torus([0.036, 0.036, 0.008], [0, 0.048, 0.005], { color: 'gold', tube: 0.18 })
      .cone([0.022, 0.016, 0.022], [0, 0.072, 0.005], { color: '#bfefff', rot: [180, 0, 0] })
      .cyl([0.022, 0.008, 0.022], [0, 0.084, 0.005], { color: '#d8f6ff', taper: 0.6 })
      .done(),
  ),
  e('diaper', 'home', 'nursery', () => {
    const b = m('diaper')
      .box([0.3, 0.1, 0.18], [0, 0.2, 0], { color: 'white', round: 0.5 })
      .wedge([0.3, 0.16, 0.17], [0, 0.085, 0], { color: 'white', rot: [0, 0, 180] })
      .box([0.31, 0.03, 0.185], [0, 0.24, 0], { color: 'skyblue', round: 0.4 });
    b.pair((s) => b.box([0.05, 0.05, 0.04], [s * 0.16, 0.2, 0.07], { color: 'skyblue', round: 0.4 }));
    for (const [x, y] of [[-0.06, 0.17], [0.05, 0.19], [0, 0.11]]) b.star(0.035, [x, y, 0.092], { color: 'yellow', noInk: true });
    return b.done();
  }),
  e('dice', 'toys', 'games', () => {
    const b = m('dice').box(0.06, [-0.035, 0.03, 0], { color: 'white', round: 0.3 });
    const pip = (at: V, n: 'x' | 'y' | 'z') => b.ball(n === 'x' ? [0.004, 0.012, 0.012] : n === 'y' ? [0.012, 0.004, 0.012] : [0.012, 0.012, 0.004], at, { color: 'black', noInk: true });
    for (const [x, y] of [[-0.015, 0.015], [0.015, 0.015], [0, 0], [-0.015, -0.015], [0.015, -0.015]]) pip([-0.035 + x, 0.03 + y, 0.03], 'z');
    pip([-0.035, 0.06, 0], 'y');
    for (const d of [-0.015, 0, 0.015]) pip([-0.005, 0.03 + d, -d], 'x');
    b.box(0.06, [0.045, 0.03, 0.03], { color: 'white', round: 0.3, rot: [0, 30, 0] });
    const r = Math.PI / 6;
    for (const d of [-0.014, 0.014]) pip([0.045 + d * Math.cos(r) + d * Math.sin(r), 0.06, 0.03 - d * Math.sin(r) + d * Math.cos(r)], 'y');
    return b.done();
  }),
  e('digital clock', 'home', 'clocks', () =>
    seg7(
      m('digital clock')
        .box([0.2, 0.1, 0.07], [0, 0.05, 0], { color: '#222222', round: 0.3 })
        .box([0.17, 0.065, 0.005], [0, 0.055, 0.036], { color: '#111111' }),
      '12:00', -0.06, 0.055, 0.04, 0.018, 0.04, 'red',
    ).done(),
  ),
  e('dining room', 'places', 'rooms', () => {
    const b = m('dining room')
      .box([2.6, 0.06, 2.2], [0, 0.03, 0], { color: 'wood' })
      .box([2.6, 2.4, 0.08], [0, 1.23, -1.06], { color: '#e8d8c0' })
      .box([0.08, 2.4, 2.2], [-1.26, 1.23, 0], { color: '#dcc8a8' })
      .box([1.8, 0.02, 1.2], [0.1, 0.07, 0], { color: 'darkred' })
      .box([1.4, 0.06, 0.8], [0.1, 0.75, 0], { color: 'darkwood', round: 0.2 })
      .box([0.7, 0.5, 0.04], [0.1, 1.6, -1.0], { color: 'gold', round: 0.2 })
      .box([0.6, 0.4, 0.02], [0.1, 1.6, -0.975], { color: 'skyblue' })
      .box([0.36, 0.8, 0.9], [-1.04, 0.46, -0.3], { color: 'darkwood', round: 0.05 })
      .cyl([0.14, 0.2, 0.14], [-1.04, 0.96, -0.3], { color: 'white', taper: 1.3 })
      .cyl([0.05, 0.16, 0.05], [0.1, 0.86, 0], { color: 'cream' })
      .ball(0.04, [0.1, 0.97, 0], { color: 'flame', glow: true });
    for (const [x, z] of [[0.7, 0.32], [-0.5, 0.32], [0.7, -0.32], [-0.5, -0.32]]) b.stick([x, 0.06, z], [x, 0.72, z], 0.05, 'darkwood');
    b.pair((s) => {
      const z = s * 0.62;
      b.box([0.4, 0.05, 0.4], [0.1, 0.45, z], { color: 'wood' }).box([0.4, 0.5, 0.05], [0.1, 0.72, z + s * 0.18], { color: 'wood' });
      for (const dx of [-0.17, 0.17]) b.stick([0.1 + dx, 0.06, z - s * 0.15], [0.1 + dx, 0.43, z - s * 0.15], 0.035, 'darkwood').stick([0.1 + dx, 0.06, z + s * 0.17], [0.1 + dx, 0.43, z + s * 0.17], 0.035, 'darkwood');
    });
    return b.done();
  }),
  e('dinner booth', 'home', 'seating', () => {
    const b = m('dinner booth')
      .box([0.7, 0.05, 1.0], [0, 0.75, 0], { color: '#e8e0d0', round: 0.2 })
      .stick([0, 0, 0], [0, 0.73, 0], 0.1, 'silver')
      .cyl([0.4, 0.04, 0.4], [0, 0.02, 0], { color: 'silver' })
      .cyl([0.06, 0.18, 0.06], [0.1, 0.865, 0.25], { color: 'red' })
      .cyl([0.06, 0.18, 0.06], [0.18, 0.865, 0.25], { color: 'yellow' })
      .box([0.12, 0.1, 0.06], [-0.1, 0.825, 0.25], { color: 'silver' });
    b.pair((s) => {
      b.box([0.5, 0.4, 1.1], [s * 0.65, 0.2, 0], { color: '#6a1a1a', round: 0.1 });
      b.box([0.5, 0.14, 1.2], [s * 0.65, 0.46, 0], { color: '#c0392b', round: 0.6 });
      b.box([0.16, 0.85, 1.2], [s * 0.96, 0.8, 0], { color: '#c0392b', round: 0.6 });
    });
    return b.done();
  }),
  e('dinosaur bones', 'nature', 'fossils', () => {
    const bone = '#efe6d0';
    const b = m('dinosaur bones', { view: 'side' }).box([1.2, 0.15, 4], [0, 0.075, 0], { color: 'stone' });
    const spine: V[] = [[0, 0.9, -1.9], [0, 1.35, -1.2], [0, 1.65, -0.4], [0, 1.95, 0.4], [0, 2.35, 0.9]];
    for (let i = 0; i < spine.length - 1; i++) b.rod(spine[i], spine[i + 1], 0.16 - i * 0.01, bone);
    b.pair((s) => {
      b.rod([s * 0.22, 1.6, -0.3], [s * 0.25, 1.0, 0.2], 0.14, bone).rod([s * 0.25, 1.0, 0.2], [s * 0.25, 0.4, -0.15], 0.12, bone).rod([s * 0.25, 0.4, -0.15], [s * 0.25, 0.17, 0.3], 0.1, bone);
      b.rod([s * 0.12, 1.9, 0.55], [s * 0.16, 1.7, 0.75], 0.05, bone);
    });
    b.each(4, (i) => b.torus([0.6, 0.8, 0.07], [0, 1.6 + i * 0.07, -0.15 + i * 0.22], { color: bone, rot: [0, 90, 0], tube: 0.1 }).torus([0.6, 0.8, 0.07], [0, 1.6 + i * 0.07, -0.15 + i * 0.22], { color: bone, tube: 0.1 }));
    for (const z of [-1.2, 0.4]) b.stick([0, 0.15, z], [0, z < 0 ? 1.3 : 1.9, z], 0.05, 'iron');
    return b
      .box([0.32, 0.38, 0.75], [0, 2.5, 1.3], { color: bone, round: 0.4 })
      .box([0.28, 0.12, 0.6], [0, 2.22, 1.32], { color: bone, round: 0.4, rot: [-12, 0, 0] })
      .ball([0.12, 0.12, 0.14], [0, 2.58, 1.25], { color: '#3a3020' })
      .done();
  }),
  e('dinosaur costume', 'toys', 'costumes', () => {
    const g = '#4caf50', lt = '#c5e1a5';
    const b = m('dinosaur costume')
      .ball([0.5, 0.75, 0.42], [0, 0.85, 0], { color: g })
      .ball([0.32, 0.5, 0.1], [0, 0.82, 0.17], { color: lt })
      .ball([0.36, 0.36, 0.36], [0, 1.38, 0.0], { color: g })
      .box([0.3, 0.16, 0.3], [0, 1.44, 0.22], { color: g, round: 0.6 })
      .ball([0.2, 0.2, 0.08], [0, 1.28, 0.16], { color: 'skin2' });
    b.pair((s) => {
      b.capsule([0.16, 0.5, 0.18], [s * 0.12, 0.27, 0], { color: g });
      b.box([0.16, 0.06, 0.24], [s * 0.12, 0.03, 0.04], { color: '#2e7d32', round: 0.5 });
      b.rod([s * 0.2, 1.05, 0.12], [s * 0.26, 0.92, 0.22], 0.08, g);
      b.ball([0.06, 0.06, 0.05], [s * 0.08, 1.52, 0.22], { color: 'white' });
      b.ball(0.03, [s * 0.08, 1.52, 0.25], { color: 'black' });
      b.cone([0.03, 0.04, 0.03], [s * 0.08, 1.35, 0.36], { color: 'white', rot: [180, 0, 0] });
    });
    const tail: V[] = [[0, 0.7, -0.15], [0, 0.55, -0.45], [0, 0.35, -0.7], [0, 0.2, -0.9]];
    for (let i = 0; i < 3; i++) b.rod(tail[i], tail[i + 1], 0.24 - i * 0.07, g);
    for (const [y, z] of [[1.55, -0.12], [1.3, -0.2], [1.05, -0.22], [0.8, -0.22], [0.6, -0.4]]) b.cone([0.08, 0.12, 0.06], [0, y, z - 0.03], { color: 'orange', rot: [-60, 0, 0] });
    return b.done();
  }),
  e('dinosaur egg', 'nature', 'fossils', () => {
    const b = m('dinosaur egg')
      .torus([0.36, 0.36, 0.1], [0, 0.05, 0], { color: '#a07d55', rot: [90, 0, 0], tube: 0.3 })
      .cyl([0.26, 0.04, 0.26], [0, 0.02, 0], { color: 'sand' })
      .ball([0.2, 0.28, 0.2], [0, 0.17, 0], { color: '#d8e8c0' })
      .rod([-0.03, 0.22, 0.095], [0.0, 0.19, 0.1], 0.008, '#5a4a3a', { noInk: true })
      .rod([0.0, 0.19, 0.1], [0.025, 0.23, 0.095], 0.008, '#5a4a3a', { noInk: true });
    for (const [x, y, z] of [[0.06, 0.12, 0.08], [-0.07, 0.2, 0.06], [0.03, 0.27, 0.06], [-0.04, 0.1, 0.085], [0.08, 0.22, 0.04]] as V[]) b.ball([0.03, 0.03, 0.015], [x, y, z], { color: '#6a9a5a', noInk: true });
    return b.done();
  }),
  e('dip', 'food', 'sides', () => {
    const b = bowl('dip', '#c0573a', '#7fb04a', 0.18, 0.06);
    for (const [x, z, r] of [[-0.04, 0.02, 20], [0.03, 0.03, -25], [0.0, -0.03, 5], [0.05, -0.02, -40]] as V[]) b.wedge([0.05, 0.065, 0.006], [x, 0.11, z], { color: '#e8c070', rot: [10, r * 2, r] });
    return b.cyl([0.07, 0.03, 0.07], [0.13, 0.015, 0.06], { color: 'white', taper: 1.3 }).ball([0.075, 0.025, 0.075], [0.13, 0.03, 0.06], { color: 'tomato' }).done();
  }),
  e('diploma', 'study', 'documents', () =>
    m('diploma')
      .box([0.3, 0.24, 0.025], [0, 0.15, 0], { color: 'darkwood', round: 0.2 })
      .box([0.26, 0.2, 0.006], [0, 0.15, 0.014], { color: 'cream' })
      .label('DIPLOMA', [0.18, 0.035], [0, 0.21, 0.018], { color: 'cream' })
      .cyl([0.045, 0.008, 0.045], [0.08, 0.1, 0.019], { color: 'gold', rot: [90, 0, 0] })
      .rod([0.075, 0.08, 0.02], [0.065, 0.055, 0.02], 0.012, 'red')
      .rod([-0.08, 0.13, 0.018], [0.02, 0.13, 0.018], 0.005, '#7a5a3a', { noInk: true })
      .rod([0, 0.2, -0.012], [0, 0, -0.1], 0.02, 'darkwood')
      .capsule([0.04, 0.24, 0.04], [0, 0.02, 0.08], { color: 'white', rot: [0, 0, 90] })
      .torus([0.045, 0.045, 0.012], [0.02, 0.02, 0.08], { color: 'red', rot: [0, 90, 0] })
      .done(),
  ),
  e('dipstick', 'garage', 'car parts', () =>
    m('dipstick')
      .box([0.12, 0.04, 0.12], [0, 0.02, 0], { color: '#555555', round: 0.3 })
      .cyl([0.04, 0.15, 0.04], [0, 0.11, 0], { color: '#222222' })
      .stick([0, 0.18, 0], [0, 0.47, 0], 0.008, 'silver')
      .cyl([0.0085, 0.04, 0.0085], [0, 0.22, 0], { color: '#8a5a1a' })
      .torus([0.06, 0.05, 0.012], [0, 0.49, 0], { color: 'yellow' })
      .done(),
  ),
  e('dirt', 'nature', 'ground', () =>
    m('dirt')
      .ball([0.3, 0.1, 0.25], [0, 0.03, 0], { color: '#6b4a2b' })
      .ball([0.14, 0.07, 0.12], [-0.05, 0.06, 0.02], { color: '#5a3a1e' })
      .ball(0.025, [0.08, 0.06, 0.07], { color: 'gray' })
      .ball(0.018, [-0.1, 0.045, 0.08], { color: 'rock' })
      .rod([0.04, 0.07, 0.05], [0.1, 0.06, 0.02], 0.012, 'pink')
      .stick([-0.03, 0.08, 0.0], [-0.03, 0.12, 0.0], 0.006, 'leaf')
      .ball([0.025, 0.008, 0.012], [-0.04, 0.125, 0], { color: 'leaf' })
      .ball([0.025, 0.008, 0.012], [-0.018, 0.125, 0], { color: 'leaf' })
      .done(),
  ),
  e('dirt bike', 'garage', 'motorbikes', () => {
    const b = m('dirt bike', { view: 'side' })
      .box([0.24, 0.3, 0.35], [0, 0.55, 0.0], { color: '#555555', round: 0.3 })
      .rod([0, 0.35, -0.7], [0, 0.85, -0.3], 0.06, '#333333')
      .rod([0, 1.05, 0.45], [0, 0.35, 0.7], 0.06, 'silver')
      .box([0.26, 0.18, 0.5], [0, 0.88, 0.15], { color: 'orange', round: 0.5 })
      .box([0.22, 0.08, 0.6], [0, 0.93, -0.32], { color: 'black', round: 0.5 })
      .box([0.16, 0.05, 0.45], [0, 0.82, 0.8], { color: 'orange', round: 0.5, rot: [-15, 0, 0] })
      .box([0.16, 0.05, 0.45], [0, 0.88, -0.75], { color: 'orange', round: 0.5, rot: [20, 0, 0] })
      .box([0.22, 0.18, 0.03], [0, 1.0, 0.55], { color: 'white', round: 0.3, rot: [-20, 0, 0] })
      .rod([-0.32, 1.12, 0.42], [0.32, 1.12, 0.42], 0.035, '#222222')
      .rod([0.15, 0.55, -0.1], [0.18, 0.7, -0.65], 0.07, 'silver');
    for (const z of [0.7, -0.7]) b.torus([0.7, 0.7, 0.14], [0, 0.35, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.3 }).cyl([0.15, 0.16, 0.15], [0, 0.35, z], { color: 'silver', rot: [0, 0, 90] });
    return b.done();
  }),
  e('disco ball', 'toys', 'party', () => {
    const b = m('disco ball')
      .stick([0, 0.28, 0], [0, 0.42, 0], 0.012, 'silver')
      .ball(0.24, [0, 0.16, 0], { color: 'silver', name: 'rotor' });
    for (const [lat, n] of [[0, 8], [0.6, 6], [-0.6, 6]] as Array<[number, number]>)
      around(n, 0.12 * Math.cos(lat), lat).forEach(([x, z], i) => b.ball(0.03, [x, 0.16 + 0.12 * Math.sin(lat), z], { color: i % 2 ? 'white' : '#bfefff', glow: true, parent: 'rotor' }));
    return b.done();
  }),
  e('discus', 'sports', 'athletics', () =>
    m('discus')
      .ball([0.2, 0.2, 0.05], [0, 0.1, 0], { color: '#2a5bd7' })
      .torus([0.2, 0.2, 0.022], [0, 0.1, 0], { color: 'silver', tube: 0.07 })
      .cyl([0.06, 0.055, 0.06], [0, 0.1, 0], { color: 'silver', rot: [90, 0, 0] })
      .done(),
  ),
  e('disguise', 'toys', 'costumes', () => {
    const b = m('disguise')
      .cyl([0.08, 0.016, 0.08], [0, 0.008, 0], { color: 'darkwood' })
      .stick([0, 0, 0], [0, 0.12, 0.0], 0.012, 'darkwood')
      .ball([0.042, 0.056, 0.05], [0, 0.135, 0.035], { color: '#f0a0a0' })
      .rod([-0.012, 0.162, 0.02], [0.012, 0.162, 0.02], 0.006, 'black');
    b.pair((s) => {
      b.torus([0.05, 0.045, 0.008], [s * 0.037, 0.162, 0.02], { color: 'black', tube: 0.2 });
      b.capsule([0.018, 0.05, 0.02], [s * 0.037, 0.195, 0.022], { color: 'black', rot: [0, 0, s * 80] });
      b.ball([0.05, 0.02, 0.02], [s * 0.022, 0.104, 0.045], { color: 'black', rot: [0, 0, s * -15] });
      b.rod([s * 0.062, 0.162, 0.02], [s * 0.066, 0.162, -0.06], 0.006, 'black');
    });
    return b.done();
  }),
  e('dishwasher', 'kitchen', 'appliances', () =>
    m('dishwasher')
      .box([0.6, 0.85, 0.6], [0, 0.425, 0], { color: 'silver', round: 0.05 })
      .box([0.58, 0.1, 0.02], [0, 0.79, 0.305], { color: '#333333' })
      .box([0.08, 0.03, 0.01], [0.2, 0.79, 0.318], { color: 'lime', glow: true })
      .box([0.45, 0.03, 0.04], [0, 0.71, 0.33], { color: '#555555', round: 0.5 })
      .box([0.58, 0.06, 0.02], [0, 0.04, 0.305], { color: '#333333' })
      .ball([0.06, 0.05, 0.01], [-0.15, 0.5, 0.305], { color: 'white', noInk: true })
      .done(),
  ),
  e('disinfectant', 'home', 'cleaning', () => {
    const b = m('disinfectant')
      .box([0.08, 0.16, 0.05], [0, 0.08, 0], { color: 'white', round: 0.6 })
      .cyl([0.03, 0.03, 0.03], [0, 0.175, 0], { color: 'white' })
      .box([0.04, 0.04, 0.07], [0, 0.205, 0.012], { color: '#2a8fd8', round: 0.4 })
      .box([0.014, 0.035, 0.012], [0, 0.17, 0.035], { color: '#2a8fd8', round: 0.3 })
      .label('CLEAN', [0.065, 0.05], [0, 0.08, 0.026], { color: '#2a8fd8' });
    b.each(4, (i) => b.ball(0.012 + i * 0.004, [0, 0.21 + (i % 2) * 0.008, 0.06 + i * 0.018], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('display case', 'home', 'cabinets', () => {
    const b = m('display case')
      .box([1.0, 0.8, 0.5], [0, 0.4, 0], { color: 'darkwood', round: 0.05 })
      .box([1.0, 0.06, 0.5], [0, 1.73, 0], { color: 'darkwood', round: 0.1 })
      .box([0.96, 0.9, 0.02], [0, 1.25, -0.23], { color: '#cfe8f0' })
      .box([0.94, 0.02, 0.44], [0, 1.25, 0], { color: GLASS })
      .cyl([0.1, 0.03, 0.1], [-0.2, 0.815, 0], { color: 'gold' })
      .stick([-0.2, 0.83, 0], [-0.2, 0.95, 0], 0.03, 'gold')
      .cyl([0.14, 0.14, 0.14], [-0.2, 1.02, 0], { color: 'gold', taper: 1.4 })
      .ball([0.14, 0.22, 0.14], [0.2, 1.37, 0], { color: 'blue' })
      .ball([0.16, 0.08, 0.1], [0.2, 0.84, 0], { color: 'teal' })
      .ball([0.12, 0.12, 0.12], [-0.25, 1.32, 0], { color: 'pink' });
    for (const [x, z] of [[0.48, 0.23], [-0.48, 0.23], [0.48, -0.23], [-0.48, -0.23]]) b.stick([x, 0.8, z], [x, 1.7, z], 0.03, 'gold');
    b.rod([-0.3, 1.0, 0.24], [-0.1, 1.5, 0.24], 0.02, 'white', { noInk: true });
    return b.done();
  }),
  e('dividers', 'home', 'decor', () => {
    const b = m('dividers');
    b.each(4, (i) => {
      const x = -0.54 + i * 0.36, r = i % 2 ? -25 : 25;
      b.box([0.42, 1.12, 0.04], [x, 0.62, 0], { color: 'darkwood', round: 0.1, rot: [0, r, 0] });
      b.box([0.33, 0.86, 0.045], [x, 0.66, 0], { color: i % 2 ? '#f2e8d0' : '#f6efe0', rot: [0, r, 0] });
      b.ball([0.12, 0.12, 0.05], [x, 0.8, 0], { color: 'pink', rot: [0, r, 0], noInk: true });
      b.box([0.12, 0.11, 0.16], [x, 0.055, 0], { color: 'darkwood', round: 0.3, rot: [0, r, 0] });
    });
    return b.done();
  }),
  e('diving board', 'sports', 'swimming', () => {
    const b = m('diving board', { view: 'side' })
      .box([2, 0.4, 1.2], [0, 0.2, -1.4], { color: 'stone' })
      .box([2, 0.3, 2.6], [0, 0.15, 0.6], { color: 'water' })
      .box([0.5, 2.6, 0.5], [0, 1.7, -1.3], { color: '#cccccc', round: 0.1 })
      .box([0.8, 0.1, 0.8], [0, 3.05, -1.3], { color: '#999999' })
      .box([0.5, 0.07, 2.4], [0, 3.13, 0.1], { color: 'white', round: 0.5, rot: [-3, 0, 0] })
      .cyl([0.12, 0.6, 0.12], [0, 3.05, -0.5], { color: 'yellow', rot: [0, 0, 90] });
    b.pair((s) => {
      b.stick([s * 0.3, 0.4, -1.85], [s * 0.3, 3.5, -1.7], 0.05, 'silver');
      b.rod([s * 0.4, 3.1, -1.6], [s * 0.4, 3.6, -1.0], 0.05, 'silver');
    });
    b.each(7, (i) => b.stick([-0.3, 0.7 + i * 0.4, -1.83 + i * 0.019], [0.3, 0.7 + i * 0.4, -1.83 + i * 0.019], 0.04, 'silver'));
    return b.done();
  }),
  e('do not enter sign', 'ideas', 'road signs', () =>
    roadSign('do not enter sign', 'round', 'red', 0.6, 1.5, 'white')
      .box([0.4, 0.1, 0.02], [0, 1.5, 0.065], { color: 'white', round: 0.2 })
      .done(),
  ),
  e('dock', 'places', 'waterfront', () => {
    const b = m('dock')
      .box([4, 0.3, 3], [0, 0.15, 0], { color: 'water' })
      .box([1.6, 0.12, 3], [0, 1.0, 0], { color: 'wood' })
      .torus([0.35, 0.35, 0.1], [0.3, 1.1, 0.6], { color: 'tan', rot: [90, 0, 0], tube: 0.3 })
      .ball([0.8, 0.4, 2.0], [1.45, 0.4, 0.3], { color: '#c0392b' })
      .ball([0.6, 0.12, 1.6], [1.45, 0.56, 0.3], { color: '#5a3a22' });
    b.each(6, (i) => b.box([1.6, 0.01, 0.02], [0, 1.065, -1.25 + i * 0.5], { color: 'darkwood', noInk: true }));
    for (const z of [-1.3, 0, 1.3]) b.pair((s) => b.stick([s * 0.75, 0, z], [s * 0.75, 1.3, z], 0.18, 'darkwood'));
    return b.done();
  }),
  e('dog bowl', 'pets', 'pet supplies', () => {
    const b = bowl('dog bowl', 'silver', '#8a5a2b', 0.2, 0.07);
    b.each(6, (i) => b.ball(0.022, [Math.cos(i) * 0.04, 0.1, Math.sin(i) * 0.04], { color: '#6b4423' }));
    return b.label('DOG', [0.07, 0.03], [0, 0.035, 0.088], { color: 'red', rot: [-15, 0, 0] }).done();
  }),
  e('dog collar', 'pets', 'pet supplies', () => {
    const b = m('dog collar')
      .torus([0.13, 0.13, 0.026], [0, 0.065, 0], { color: 'red', tube: 0.16 })
      .box([0.03, 0.03, 0.032], [0, 0.125, 0], { color: 'silver', round: 0.3 })
      .torus([0.016, 0.016, 0.004], [0.06, 0.03, 0.016], { color: 'silver' })
      .cyl([0.04, 0.006, 0.04], [0.068, 0.015, 0.02], { color: 'gold', rot: [90, 0, 0] });
    b.each(6, (i) => {
      const a = 0.6 + i * 0.75;
      b.ball(0.01, [Math.cos(a) * 0.056, 0.065 + Math.sin(a) * 0.056, 0.014], { color: 'silver' });
    });
    return b.done();
  }),
  e('dog ears', 'toys', 'costumes', () => {
    const b = m('dog ears');
    for (let i = 0; i < 6; i++) {
      const t0 = (i * Math.PI) / 6, t1 = ((i + 1) * Math.PI) / 6;
      b.rod([0.08 * Math.cos(t0), 0.01 + 0.15 * Math.sin(t0), 0], [0.08 * Math.cos(t1), 0.01 + 0.15 * Math.sin(t1), 0], 0.012, 'black');
    }
    b.pair((s) => {
      b.ball([0.065, 0.13, 0.026], [s * 0.085, 0.1, 0.01], { color: 'brown', rot: [0, 0, s * 18] });
      b.ball([0.035, 0.08, 0.01], [s * 0.085, 0.095, 0.022], { color: 'pink', rot: [0, 0, s * 18], noInk: true });
    });
    return b.done();
  }),
  e('dog food', 'pets', 'pet supplies', () => {
    const b = m('dog food')
      .box([0.22, 0.3, 0.1], [0, 0.15, 0], { color: '#e8413a', round: 0.3 })
      .box([0.22, 0.04, 0.06], [0, 0.31, 0], { color: '#c0392b', round: 0.3 })
      .label('DOG FOOD', [0.18, 0.05], [0, 0.25, 0.052], { color: 'yellow' })
      .ball([0.08, 0.07, 0.01], [0, 0.12, 0.052], { color: 'tan' })
      .ball(0.018, [0, 0.11, 0.06], { color: 'black' });
    b.pair((s) => b.ball([0.03, 0.06, 0.01], [s * 0.045, 0.13, 0.054], { color: 'brown', rot: [0, 0, s * 20] }));
    b.each(5, (i) => b.ball(0.02, [-0.06 + i * 0.03, 0.01, 0.1 + (i % 2) * 0.02], { color: '#6b4423' }));
    return b.done();
  }),
  e('dog run', 'places', 'parks', () => {
    const b = m('dog run').box([4, 0.06, 3], [0, 0.03, 0], { color: 'grass' });
    const mesh = '#b8c0c8';
    b.box([4, 1.1, 0.03], [0, 0.6, -1.5], { color: mesh }).pair((s) => b.box([0.03, 1.1, 3], [s * 2, 0.6, 0], { color: mesh }));
    for (const [x, z] of [[2, 1.5], [-2, 1.5], [2, -1.5], [-2, -1.5], [0, -1.5]]) b.stick([x, 0, z], [x, 1.2, z], 0.08, 'silver');
    return b
      .box([0.8, 0.6, 0.9], [-1.3, 0.36, -0.8], { color: '#c0392b', round: 0.1 })
      .wedge([0.95, 0.4, 1.0], [-1.3, 0.86, -0.8], { color: '#5a3a22' })
      .box([0.35, 0.4, 0.02], [-1.3, 0.26, -0.34], { color: '#1e1a16', round: 0.4 })
      .cyl([0.25, 0.5, 0.25], [1.2, 0.3, 0.6], { color: 'red' })
      .ball(0.28, [1.2, 0.6, 0.6], { color: 'red' })
      .ball(0.2, [0.3, 0.16, 0.8], { color: 'yellow' })
      .label('DOG PARK', [1.2, 0.35], [0, 1.0, -1.47], { color: 'white' })
      .done();
  }),
  e('dog tag', 'pets', 'pet supplies', () => {
    const b = m('dog tag')
      .capsule([0.025, 0.07, 0.008], [0, 0.025, 0], { color: 'gold', rot: [0, 0, 90] })
      .torus([0.02, 0.02, 0.004], [0, 0.047, 0], { color: 'silver' })
      .label('REX', [0.035, 0.014], [0, 0.025, 0.005], { color: 'gold' });
    for (const [x, y] of [[0.033, 0.012], [0.033, -0.012], [-0.033, 0.012], [-0.033, -0.012]]) b.ball([0.026, 0.026, 0.008], [x, 0.025 + y, 0], { color: 'gold' });
    return b.done();
  }),
  e('dog tail', 'toys', 'costumes', () => {
    const b = m('dog tail')
      .torus([0.3, 0.26, 0.03], [0, 0.015, 0], { color: '#222222', rot: [90, 0, 0], tube: 0.1 })
      .box([0.05, 0.04, 0.02], [0, 0.02, 0.13], { color: 'silver', round: 0.3 })
      .ball([0.09, 0.08, 0.08], [0, 0.05, -0.13], { color: '#a0602a', name: 'top', pivot: [0, 0.03, -0.13] });
    const pts: V[] = [[0, 0.05, -0.13], [0, 0.13, -0.18], [0.02, 0.21, -0.2], [0.05, 0.27, -0.17], [0.06, 0.3, -0.13]];
    for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], 0.07 - i * 0.012, i === 3 ? 'white' : '#a0602a', { parent: 'top' });
    return b.done();
  }),
  e('dog whistle', 'pets', 'pet supplies', () =>
    m('dog whistle')
      .cyl([0.04, 0.008, 0.04], [0, 0.004, 0], { color: '#555555' })
      .cyl([0.015, 0.07, 0.015], [0, 0.043, 0], { color: 'silver' })
      .cyl([0.017, 0.014, 0.017], [0, 0.085, 0], { color: '#999999' })
      .box([0.008, 0.012, 0.003], [0, 0.065, 0.008], { color: '#333333' })
      .torus([0.04, 0.05, 0.004], [0.022, 0.03, -0.01], { color: 'darkred', rot: [0, 30, 0], tube: 0.12 })
      .done(),
  ),
  e('doggie door', 'pets', 'pet supplies', () =>
    m('doggie door')
      .box([0.6, 0.45, 0.05], [0, 0.225, 0], { color: 'white', round: 0.05 })
      .box([0.26, 0.3, 0.07], [0, 0.17, 0], { color: '#888888', round: 0.2 })
      .box([0.2, 0.24, 0.015], [0, 0.15, 0.04], { color: '#5a3a22', name: 'lid', pivot: [0, 0.27, 0.04] })
      .ball([0.04, 0.035, 0.006], [0, 0.13, 0.05], { color: '#c8a06a', parent: 'lid', noInk: true })
      .ball(0.016, [-0.025, 0.165, 0.05], { color: '#c8a06a', parent: 'lid', noInk: true })
      .ball(0.016, [0.025, 0.165, 0.05], { color: '#c8a06a', parent: 'lid', noInk: true })
      .done(),
  ),
  e('doggy bag', 'food', 'takeout', () =>
    m('doggy bag')
      .box([0.14, 0.16, 0.09], [0, 0.08, 0], { color: '#c8a06a', round: 0.1 })
      .box([0.14, 0.05, 0.03], [0, 0.18, 0], { color: '#b8905a', round: 0.3 })
      .capsule([0.02, 0.07, 0.006], [0, 0.11, 0.046], { color: 'white', rot: [0, 0, 90] })
      .ball([0.02, 0.02, 0.006], [0.035, 0.118, 0.046], { color: 'white' })
      .ball([0.02, 0.02, 0.006], [0.035, 0.102, 0.046], { color: 'white' })
      .ball([0.02, 0.02, 0.006], [-0.035, 0.118, 0.046], { color: 'white' })
      .ball([0.02, 0.02, 0.006], [-0.035, 0.102, 0.046], { color: 'white' })
      .label('DOGGY BAG', [0.12, 0.03], [0, 0.05, 0.046], { color: '#c8a06a' })
      .done(),
  ),
  e('doll', 'toys', 'dolls', () => who('doll', { h: 0.3, style: 'pigtails', hair: '#e8c56a', top: 'pink', skirt: 'pink', shoes: 'red', blush: 'pink', acc: [hat('bow', 'red')] })),
  e('dollar sign', 'ideas', 'symbols', () => {
    const b = m('dollar sign').box([0.18, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3 });
    const r = 0.06, top: Array<[number, number]> = [30, 90, 150, 210, 270].map((a) => [r * Math.cos((a * Math.PI) / 180), 0.23 + r * Math.sin((a * Math.PI) / 180)]);
    const bot: Array<[number, number]> = [90, 30, -30, -90, -150].map((a) => [r * Math.cos((a * Math.PI) / 180), 0.11 + r * Math.sin((a * Math.PI) / 180)]);
    const pts = [...top, ...bot.slice(1)];
    for (let i = 0; i < pts.length - 1; i++) b.rod([pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.032, 'green');
    return b.stick([0, 0.03, 0], [0, 0.32, 0], 0.02, 'green').done();
  }),
  e('dollhouse', 'toys', 'dolls', () =>
    m('dollhouse')
      .box([0.62, 0.03, 0.34], [0, 0.015, 0], { color: 'wood' })
      .box([0.6, 0.25, 0.03], [0, 0.15, -0.15], { color: '#f8c8d8' })
      .box([0.6, 0.25, 0.03], [0, 0.39, -0.15], { color: '#fff3b0' })
      .box([0.03, 0.5, 0.32], [0.3, 0.265, 0], { color: 'white' })
      .box([0.03, 0.5, 0.32], [-0.3, 0.265, 0], { color: 'white' })
      .box([0.6, 0.03, 0.32], [0, 0.27, 0], { color: 'wood' })
      .box([0.03, 0.24, 0.3], [0.05, 0.15, 0], { color: 'white' })
      .wedge([0.72, 0.24, 0.38], [0, 0.635, 0], { color: '#e86f9a' })
      .box([0.14, 0.08, 0.2], [-0.15, 0.32, -0.02], { color: 'skyblue', round: 0.3 })
      .box([0.12, 0.08, 0.1], [0.17, 0.07, 0.02], { color: 'brown', round: 0.2 })
      .box([0.06, 0.1, 0.06], [-0.18, 0.08, 0.03], { color: 'red', round: 0.2 })
      .box([0.03, 0.12, 0.12], [0.315, 0.4, 0], { color: GLASS })
      .done(),
  ),
  e('dome', 'ideas', 'shapes', () =>
    m('dome')
      .cyl([0.6, 0.25, 0.6], [0, 0.125, 0], { color: '#e8d8b0' })
      .ball([0.6, 0.5, 0.6], [0, 0.25, 0], { color: '#7ab8d8' })
      .cyl([0.62, 0.03, 0.62], [0, 0.25, 0], { color: 'white' })
      .done(),
  ),
  e('domino', 'toys', 'games', () => {
    const b = m('domino');
    for (const [x, th] of [[-0.07, 0], [0.0, 25], [0.065, 50]]) {
      const r = (th * Math.PI) / 180, c: V = [x + 0.05 * Math.sin(r), 0.05 * Math.cos(r), 0];
      b.box([0.05, 0.1, 0.022], c, { color: '#1e1e1e', round: 0.2, rot: [0, 0, -th] }).box([0.04, 0.004, 0.023], c, { color: 'white', rot: [0, 0, -th], noInk: true });
    }
    for (const [x, y] of [[-0.08, 0.075], [-0.06, 0.085], [-0.07, 0.025], [-0.08, 0.015], [-0.06, 0.035]]) b.ball([0.01, 0.01, 0.004], [x, y, 0.012], { color: 'white', noInk: true });
    return b.done();
  }),
  e('door', 'home', 'doors', () =>
    m('door')
      .box([1.3, 0.03, 0.3], [0, 0.015, 0], { color: 'stone' })
      .box([0.2, 2.1, 0.2], [0.55, 1.05, 0], { color: 'white' })
      .box([0.2, 2.1, 0.2], [-0.55, 1.05, 0], { color: 'white' })
      .box([1.3, 0.14, 0.2], [0, 2.16, 0], { color: 'white' })
      .box([0.9, 2.06, 0.05], [0, 1.06, 0], { color: '#8a5a3a', round: 0.1, name: 'door', pivot: [-0.45, 1.06, 0] })
      .box([0.3, 0.7, 0.02], [-0.17, 1.5, 0.03], { color: '#a0704a', parent: 'door' })
      .box([0.3, 0.7, 0.02], [0.17, 1.5, 0.03], { color: '#a0704a', parent: 'door' })
      .box([0.3, 0.6, 0.02], [-0.17, 0.5, 0.03], { color: '#a0704a', parent: 'door' })
      .box([0.3, 0.6, 0.02], [0.17, 0.5, 0.03], { color: '#a0704a', parent: 'door' })
      .ball(0.06, [0.36, 1.0, 0.06], { color: 'brass', parent: 'door' })
      .done(),
  ),
  e('door jam', 'home', 'doors', () =>
    m('door jam')
      .box([0.4, 2.3, 0.22], [0.8, 1.15, 0], { color: '#e8e0d0' })
      .box([0.4, 2.3, 0.22], [-0.8, 1.15, 0], { color: '#e8e0d0' })
      .box([2.0, 0.3, 0.22], [0, 2.45, 0], { color: '#e8e0d0' })
      .box([0.2, 2.15, 0.24], [0.55, 1.075, 0], { color: 'white' })
      .box([0.2, 2.15, 0.24], [-0.55, 1.075, 0], { color: 'white' })
      .box([1.3, 0.15, 0.24], [0, 2.225, 0], { color: 'white' })
      .box([0.9, 0.03, 0.2], [0, 0.015, 0], { color: 'wood' })
      .box([0.03, 0.12, 0.06], [-0.45, 0.4, 0], { color: 'brass' })
      .box([0.03, 0.12, 0.06], [-0.45, 1.7, 0], { color: 'brass' })
      .box([0.03, 0.18, 0.06], [0.45, 1.0, 0], { color: 'brass' })
      .done(),
  ),
  e('door knob', 'home', 'doors', () =>
    m('door knob')
      .box([0.12, 0.16, 0.04], [0, 0.08, 0], { color: 'wood', round: 0.1 })
      .cyl([0.06, 0.012, 0.06], [0, 0.09, 0.026], { color: 'brass', rot: [90, 0, 0] })
      .cyl([0.02, 0.03, 0.02], [0, 0.09, 0.045], { color: 'brass', rot: [90, 0, 0] })
      .ball([0.056, 0.056, 0.045], [0, 0.09, 0.075], { color: 'brass' })
      .done(),
  ),
  e('doorbell', 'home', 'doors', () => {
    const b = m('doorbell')
      .box([0.14, 0.16, 0.03], [0, 0.08, 0], { color: '#b5462e' })
      .box([0.05, 0.09, 0.015], [0, 0.09, 0.022], { color: 'brass', round: 0.4 })
      .cyl([0.028, 0.012, 0.028], [0, 0.085, 0.032], { color: 'white', rot: [90, 0, 0], glow: true });
    b.each(3, (i) => b.box([0.14, 0.004, 0.002], [0, 0.04 + i * 0.05, 0.016], { color: '#d8d0c0', noInk: true }));
    return b.done();
  }),
  e('doormat', 'home', 'doors', () =>
    m('doormat')
      .box([0.7, 0.05, 0.45], [0, 0.025, 0], { color: '#8a6030', round: 0.2 })
      .box([0.6, 0.052, 0.35], [0, 0.026, 0], { color: '#c09050', round: 0.2 })
      .label('WELCOME', [0.5, 0.14], [0, 0.055, 0], { color: '#c09050', rot: [-90, 0, 0] })
      .done(),
  ),
  e('doorstep', 'home', 'doors', () =>
    m('doorstep')
      .box([1.2, 0.12, 0.5], [0, 0.06, 0.1], { color: 'stone', round: 0.1 })
      .box([1.0, 0.12, 0.3], [0, 0.18, -0.05], { color: '#a8a39a', round: 0.1 })
      .box([0.6, 0.02, 0.22], [0, 0.25, -0.05], { color: '#8a6030', round: 0.2 })
      .cyl([0.07, 0.18, 0.07], [0.42, 0.21, 0.2], { color: 'white' })
      .cyl([0.04, 0.02, 0.04], [0.42, 0.31, 0.2], { color: 'silver' })
      .cyl([0.07, 0.18, 0.07], [0.5, 0.21, 0.24], { color: 'white' })
      .cyl([0.04, 0.02, 0.04], [0.5, 0.31, 0.24], { color: 'silver' })
      .cyl([0.16, 0.16, 0.16], [-0.42, 0.2, 0.18], { color: '#c0573a', taper: 1.25 })
      .ball(0.22, [-0.42, 0.36, 0.18], { color: 'leaf' })
      .done(),
  ),
  e('doorstop', 'home', 'doors', () =>
    m('doorstop')
      .wedge([0.14, 0.05, 0.06], [0, 0.025, 0], { color: '#5a3a22', apex: 0.5 })
      .box([0.004, 0.02, 0.062], [0.0, 0.018, 0], { color: '#3a2414', noInk: true })
      .box([0.004, 0.012, 0.062], [-0.03, 0.01, 0], { color: '#3a2414', noInk: true })
      .done(),
  ),
  e('doorway', 'places', 'rooms', () => {
    const b = m('doorway')
      .box([2.1, 2.6, 0.3], [0, 1.3, 0], { color: '#c8b89a' })
      .box([0.9, 1.9, 0.04], [0, 0.95, 0.15], { color: '#1e1a16' })
      .ball([0.9, 0.7, 0.04], [0, 1.9, 0.15], { color: '#1e1a16' })
      .box([1.3, 0.12, 0.6], [0, 0.06, 0.3], { color: 'stone' });
    for (let i = 0; i < 6; i++) {
      const a0 = (i * Math.PI) / 6, a1 = ((i + 1) * Math.PI) / 6;
      b.rod([0.5 * Math.cos(a0), 1.9 + 0.4 * Math.sin(a0), 0.17], [0.5 * Math.cos(a1), 1.9 + 0.4 * Math.sin(a1), 0.17], 0.1, '#a8987a');
    }
    b.pair((s) => b.box([0.1, 1.9, 0.04], [s * 0.5, 0.95, 0.17], { color: '#a8987a' }));
    return b.done();
  }),
  e('dormitory', 'places', 'schools', () => {
    const b = bld('dormitory', { w: 9, h: 10, d: 6, wall: '#b5583a', roof: '#555555', sign: 'DORM', signC: 'cream', win: [3, 4] });
    b.box([2.6, 0.15, 1.4], [0, 2.6, 3.7], { color: 'cream' }).pair((s) => b.stick([s * 1.2, 0, 4.3], [s * 1.2, 2.55, 4.3], 0.12, 'cream'));
    return b.done();
  }),
  e('doubledecker bus', 'garage', 'buses', () => {
    const b = m('doubledecker bus', { view: 'side' })
      .box([2.5, 4.0, 10], [0, 2.3, 0], { color: 'red', round: 0.15 })
      .box([2.52, 0.15, 10.02], [0, 2.75, 0], { color: 'cream' })
      .box([2.2, 1.1, 0.04], [0, 1.9, 5.01], { color: '#2a3a4a' })
      .box([2.2, 0.9, 0.04], [0, 3.6, 5.01], { color: '#2a3a4a' })
      .label('LONDON', [1.6, 0.3], [0, 2.9, 5.03], { color: 'black' })
      .ball([0.3, 0.25, 0.1], [0.8, 0.8, 5.02], { color: 'yellow', glow: true })
      .ball([0.3, 0.25, 0.1], [-0.8, 0.8, 5.02], { color: 'yellow', glow: true });
    b.pair((s) => {
      b.box([0.04, 0.85, 8.6], [s * 1.26, 1.95, -0.3], { color: '#2a3a4a', noInk: true });
      b.box([0.04, 0.8, 9.4], [s * 1.26, 3.6, 0], { color: '#2a3a4a', noInk: true });
      for (const z of [3.3, -3.0]) b.torus([1.0, 1.0, 0.3], [s * 1.2, 0.5, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    });
    return b.done();
  }),
  e('dough', 'food', 'baking', () =>
    m('dough')
      .box([0.35, 0.025, 0.25], [0, 0.0125, 0], { color: 'wood', round: 0.3 })
      .ball([0.25, 0.006, 0.16], [-0.03, 0.026, 0], { color: 'white', noInk: true })
      .ball([0.13, 0.08, 0.12], [-0.04, 0.06, 0], { color: '#f2dfb0' })
      .cyl([0.045, 0.2, 0.045], [0.06, 0.048, 0.07], { color: 'lightwood', rot: [0, 0, 90] })
      .cyl([0.02, 0.05, 0.02], [0.185, 0.048, 0.07], { color: 'wood', rot: [0, 0, 90] })
      .cyl([0.02, 0.05, 0.02], [-0.065, 0.048, 0.07], { color: 'wood', rot: [0, 0, 90] })
      .done(),
  ),
  e('doughnut', 'food', 'desserts', () => {
    const b = m('doughnut')
      .torus([0.1, 0.1, 0.04], [0, 0.05, 0], { color: '#d9a050', tube: 0.36 })
      .torus([0.094, 0.094, 0.02], [0, 0.05, 0.012], { color: 'pink', tube: 0.34 });
    around(9, 0.034, 0.2).forEach(([x, y], i) => b.box([0.012, 0.004, 0.004], [x, 0.05 + y, 0.024], { color: COLS[i % COLS.length], rot: [0, 0, i * 40], noInk: true }));
    return b.done();
  }),
  e('dragon kite', 'sky', 'kites', () => {
    const b = m('dragon kite')
      .cyl([0.12, 0.1, 0.12], [-0.3, 0.05, 0], { color: 'wood' })
      .rod([-0.3, 0.1, 0], [0.0, 1.75, 0], 0.008, 'white')
      .ball([0.32, 0.26, 0.26], [0, 1.85, 0], { color: 'red' })
      .box([0.2, 0.12, 0.2], [0, 1.8, 0.18], { color: 'red', round: 0.5 })
      .cone([0.06, 0.16, 0.06], [-0.1, 2.03, -0.02], { color: 'gold', rot: [0, 0, 25] })
      .cone([0.06, 0.16, 0.06], [0.1, 2.03, -0.02], { color: 'gold', rot: [0, 0, -25] });
    b.pair((s) => b.ball(0.06, [s * 0.08, 1.92, 0.11], { color: 'yellow' }).rod([s * 0.08, 1.78, 0.27], [s * 0.25, 1.7, 0.3], 0.012, 'gold'));
    b.each(7, (i) => b.cyl([0.24 - i * 0.02, 0.04, 0.24 - i * 0.02], [Math.sin(i * 1.1) * 0.15, 1.62 - i * 0.2, 0], { color: i % 2 ? 'gold' : 'red', rot: [90, 0, 0] }));
    b.pair((s) => b.rod([0, 0.28, 0], [s * 0.15, 0.06, 0.02], 0.02, s > 0 ? 'green' : 'blue'));
    return b.done();
  }),
  e('dragonfruit', 'food', 'fruit', () => {
    const pk = '#e8407a';
    const b = m('dragonfruit')
      .ball([0.09, 0.12, 0.09], [-0.04, 0.06, -0.01], { color: pk })
      .cone([0.03, 0.04, 0.02], [-0.04, 0.13, -0.01], { color: 'lime' })
      .ball([0.09, 0.11, 0.05], [0.06, 0.055, 0.02], { color: pk })
      .ball([0.075, 0.095, 0.01], [0.06, 0.055, 0.044], { color: 'white' });
    around(5, 0.046, 0.3).forEach(([x, z]) => b.cone([0.025, 0.04, 0.012], [-0.04 + x, 0.07, -0.01 + z], { color: 'lime', rot: [z * 900, 0, -x * 900] }));
    b.each(8, (i) => b.ball(0.006, [0.04 + (i % 3) * 0.02, 0.025 + Math.floor(i / 3) * 0.025 + (i % 2) * 0.008, 0.05], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('drain', 'home', 'bathroom', () =>
    m('drain')
      .box([0.04, 0.3, 0.15], [0.22, 0.15, 0], { color: 'white' })
      .cyl([0.1, 0.015, 0.1], [0, 0.26, 0], { color: 'silver' })
      .cyl([0.06, 0.004, 0.06], [0, 0.268, 0], { color: '#333333', noInk: true })
      .stick([0, 0.26, 0], [0, 0.12, 0], 0.036, '#e8e8e8')
      .rod([0, 0.12, 0], [0, 0.06, 0], 0.036, '#e8e8e8')
      .rod([0, 0.06, 0], [0.032, 0.035, 0], 0.036, '#e8e8e8')
      .rod([0.032, 0.035, 0], [0.065, 0.06, 0], 0.036, '#e8e8e8')
      .rod([0.065, 0.06, 0], [0.065, 0.1, 0], 0.036, '#e8e8e8')
      .rod([0.065, 0.1, 0], [0.2, 0.1, 0], 0.036, '#e8e8e8')
      .done(),
  ),
  e('drawbridge', 'places', 'castles', () => {
    const st = '#a8a39a';
    const b = m('drawbridge')
      .box([7, 0.2, 2.6], [0, 0.1, 1.7], { color: 'water' })
      .box([7, 0.3, 1], [0, 0.15, 3.4], { color: 'grass' })
      .box([4, 4.2, 2], [0, 2.1, -0.4], { color: st })
      .box([1.6, 2.2, 0.05], [0, 1.1, 0.62], { color: '#1e1a16' })
      .box([1.6, 0.15, 2.4], [0, 0.32, 1.8], { color: 'wood', name: 'lid', pivot: [0, 0.32, 0.6] })
      .rod([0.7, 2.4, 0.64], [0.7, 0.4, 2.9], 0.06, 'iron', { parent: 'lid' })
      .rod([-0.7, 2.4, 0.64], [-0.7, 0.4, 2.9], 0.06, 'iron', { parent: 'lid' });
    b.pair((s) => b.cyl([1.6, 5.2, 1.6], [s * 2.2, 2.6, -0.4], { color: '#b5b0a6' }).cone([1.9, 1.6, 1.9], [s * 2.2, 6.0, -0.4], { color: 'navy' }));
    b.each(4, (i) => b.box([0.5, 0.5, 2], [-1.2 + i * 0.8, 4.45, -0.4], { color: st }));
    return b.done();
  }),
  e('dreamcatcher', 'home', 'decor', () => {
    const b = m('dreamcatcher')
      .torus([0.26, 0.26, 0.04], [0, 0.34, 0], { color: '#c8955a', tube: 0.12 })
      .torus([0.04, 0.04, 0.012], [0, 0.48, 0], { color: '#c8955a' })
      .torus([0.09, 0.09, 0.006], [0, 0.34, 0], { color: 'white', tube: 0.08, noInk: true })
      .ball(0.025, [0, 0.34, 0.004], { color: 'teal' });
    b.each(4, (i) => {
      const a = (i * Math.PI) / 4;
      b.rod([Math.cos(a) * 0.12, 0.34 + Math.sin(a) * 0.12, 0], [-Math.cos(a) * 0.12, 0.34 - Math.sin(a) * 0.12, 0], 0.004, 'white', { noInk: true });
    });
    for (const [x, c] of [[-0.08, 'white'], [0, '#a0602a'], [0.08, 'white']] as Array<[number, string]>) {
      const top = 0.34 - Math.sqrt(0.13 * 0.13 - x * x);
      b.stick([x, top, 0], [x, 0.12, 0], 0.004, '#8a5a2b').ball(0.016, [x, 0.17, 0], { color: 'teal' }).ball([0.045, 0.13, 0.012], [x, 0.065, 0], { color: c });
    }
    return b.done();
  }),
  e('dress', 'wardrobe', 'dresses', () => dress('dress', '#e86f9a', 1.1, 0.75, 'white').ball([0.08, 0.06, 0.04], [0, 0.63, 0.1], { color: 'white' }).done()),
  e('dress pants', 'wardrobe', 'trousers', () => {
    const c = '#3a4050';
    const b = m('dress pants')
      .box([0.4, 0.24, 0.2], [0, 0.83, 0], { color: c, round: 0.3 })
      .box([0.41, 0.045, 0.205], [0, 0.955, 0], { color: 'black', round: 0.3 })
      .box([0.05, 0.035, 0.01], [0, 0.955, 0.104], { color: 'silver' });
    b.pair((s) => {
      b.cyl([0.17, 0.76, 0.16], [s * 0.1, 0.38, 0], { color: c, taper: 1.18 });
      b.rod([s * 0.1, 0.03, 0.08], [s * 0.1, 0.72, 0.095], 0.005, '#5a6070', { noInk: true });
      b.box([0.08, 0.005, 0.01], [s * 0.12, 0.86, 0.1], { color: '#2a3040', rot: [0, 0, s * -30], noInk: true });
    });
    return b.done();
  }),
  e('dresser', 'home', 'storage', () => {
    const b = m('dresser')
      .box([1.0, 0.9, 0.5], [0, 0.5, 0], { color: 'wood', round: 0.05 })
      .box([1.04, 0.04, 0.54], [0, 0.97, 0], { color: 'darkwood', round: 0.2 })
      .box([0.7, 0.66, 0.04], [0, 1.37, -0.2], { color: 'darkwood', round: 0.1 })
      .box([0.6, 0.56, 0.01], [0, 1.37, -0.175], { color: '#cfe8f0' })
      .cyl([0.08, 0.16, 0.08], [0.35, 1.07, 0.05], { color: 'blue', taper: 0.6 });
    b.each(4, (i) => {
      b.box([0.92, 0.18, 0.02], [0, 0.17 + i * 0.21, 0.255], { color: 'lightwood', round: 0.2 });
      b.pair((s) => b.ball(0.03, [s * 0.25, 0.17 + i * 0.21, 0.27], { color: 'brass' }));
    });
    for (const [x, z] of [[0.44, 0.2], [-0.44, 0.2], [0.44, -0.2], [-0.44, -0.2]]) b.ball(0.07, [x, 0.035, z], { color: 'darkwood' });
    return b.done();
  }),
  e('drill', 'workshop', 'power tools', () =>
    m('drill', { view: 'side' })
      .box([0.09, 0.06, 0.12], [0, 0.03, 0], { color: '#222222', round: 0.3 })
      .box([0.06, 0.16, 0.07], [0, 0.13, 0.0], { color: 'yellow', round: 0.4, rot: [-12, 0, 0] })
      .box([0.075, 0.09, 0.22], [0, 0.245, 0.03], { color: 'yellow', round: 0.4 })
      .ball([0.08, 0.09, 0.06], [0, 0.245, -0.08], { color: '#222222' })
      .box([0.02, 0.04, 0.025], [0, 0.18, 0.05], { color: '#222222', round: 0.4 })
      .cyl([0.045, 0.05, 0.045], [0, 0.245, 0.165], { color: '#222222', rot: [90, 0, 0], name: 'fan' })
      .stick([0, 0.245, 0.19], [0, 0.245, 0.28], 0.009, 'silver', { parent: 'fan' })
      .done(),
  ),
  e('drill bit', 'workshop', 'hardware', () => {
    const b = m('drill bit')
      .box([0.04, 0.012, 0.04], [0, 0.006, 0], { color: '#333333', round: 0.3 })
      .cyl([0.013, 0.04, 0.013], [0, 0.032, 0], { color: 'silver' })
      .cyl([0.013, 0.05, 0.013], [0, 0.077, 0], { color: 'gold' })
      .cone([0.013, 0.014, 0.013], [0, 0.109, 0], { color: 'gold' });
    b.each(4, (i) => b.torus([0.015, 0.015, 0.003], [0, 0.06 + i * 0.012, 0], { color: '#a07a20', rot: [70, 0, 0], tube: 0.2, noInk: true }));
    return b.done();
  }),
  e('drone', 'tech', 'gadgets', () => {
    const b = m('drone')
      .box([0.16, 0.06, 0.16], [0, 0.13, 0], { color: 'white', round: 0.5 })
      .ball([0.05, 0.05, 0.05], [0, 0.09, 0.07], { color: '#222222' })
      .ball(0.02, [0, 0.09, 0.093], { color: 'cyan', glow: true });
    for (const [x, z] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) {
      b.rod([0, 0.14, 0], [x, 0.14, z], 0.02, '#888888');
      b.cyl([0.035, 0.03, 0.035], [x, 0.155, z], { color: '#333333' });
      b.cyl([0.16, 0.006, 0.03], [x, 0.175, z], { color: '#222222', rot: [0, x * z > 0 ? 30 : -30, 0] });
    }
    b.pair((s) => b.rod([s * 0.08, 0.005, -0.08], [s * 0.08, 0.005, 0.08], 0.012, '#888888').rod([s * 0.08, 0.005, 0], [s * 0.05, 0.11, 0], 0.012, '#888888'));
    return b.done();
  }),
  e('drum', 'music', 'drums', () => {
    const b = m('drum')
      .cyl([0.36, 0.24, 0.36], [0, 0.2, 0], { color: 'red' })
      .torus([0.375, 0.375, 0.03], [0, 0.085, 0], { color: 'silver', rot: [90, 0, 0] })
      .torus([0.375, 0.375, 0.03], [0, 0.315, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.35, 0.01, 0.35], [0, 0.325, 0], { color: 'white' })
      .rod([-0.12, 0.34, 0.08], [0.15, 0.36, -0.1], 0.016, 'lightwood')
      .rod([0.12, 0.34, 0.08], [-0.15, 0.36, -0.1], 0.016, 'lightwood');
    around(8, 0.182).forEach(([x, z], i) => {
      const [nx, nz] = around(8, 0.182)[(i + 1) % 8];
      b.rod([x, 0.3, z], [nx, 0.1, nz], 0.006, 'white', { noInk: true });
    });
    around(3, 0.2, 0.5).forEach(([x, z]) => b.rod([x, 0, z], [0, 0.085, 0], 0.016, 'silver'));
    return b.done();
  }),
  e('drum kit', 'music', 'drums', () => {
    const b = m('drum kit')
      .cyl([0.55, 0.4, 0.55], [0, 0.28, 0], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.5, 0.01, 0.5], [0, 0.28, 0.205], { color: 'white', rot: [90, 0, 0] })
      .torus([0.56, 0.56, 0.03], [0, 0.28, 0.2], { color: 'silver' })
      .cyl([0.34, 0.15, 0.34], [-0.42, 0.58, 0.25], { color: 'silver' })
      .stick([-0.42, 0, 0.25], [-0.42, 0.5, 0.25], 0.03, 'silver')
      .cyl([0.25, 0.2, 0.25], [-0.15, 0.68, 0.02], { color: 'red', rot: [20, 0, 0] })
      .cyl([0.25, 0.2, 0.25], [0.15, 0.68, 0.02], { color: 'red', rot: [20, 0, 0] })
      .cyl([0.4, 0.35, 0.4], [0.48, 0.38, 0.2], { color: 'red' })
      .cyl([0.4, 0.02, 0.4], [0.48, 0.565, 0.2], { color: 'white' })
      .stick([-0.7, 0, 0.0], [-0.7, 0.9, 0.0], 0.025, 'silver')
      .cyl([0.36, 0.03, 0.36], [-0.7, 0.88, 0], { color: 'gold', taper: 0.3 })
      .stick([0.6, 0, -0.3], [0.6, 1.15, -0.3], 0.025, 'silver')
      .cyl([0.42, 0.03, 0.42], [0.6, 1.15, -0.3], { color: 'gold', taper: 0.3, rot: [-15, 0, 10] })
      .cyl([0.3, 0.08, 0.3], [0, 0.48, -0.5], { color: '#222222' })
      .stick([0, 0, -0.5], [0, 0.44, -0.5], 0.04, 'silver');
    return b.done();
  }),
  e('drumstick (music)', 'music', 'drums', () =>
    m('drumstick (music)')
      .cyl([0.22, 0.03, 0.22], [0, 0.015, 0], { color: '#222222' })
      .cyl([0.18, 0.006, 0.18], [0, 0.033, 0], { color: '#777777' })
      .rod([-0.1, 0.035, 0.0], [0.08, 0.4, 0], 0.02, 'lightwood')
      .rod([0.1, 0.035, 0.03], [-0.08, 0.4, 0.03], 0.02, 'lightwood')
      .ball(0.026, [0.085, 0.41, 0], { color: 'lightwood' })
      .ball(0.026, [-0.085, 0.41, 0.03], { color: 'lightwood' })
      .done(),
  ),
  e('dry erase marker', 'study', 'stationery', () =>
    m('dry erase marker')
      .cyl([0.024, 0.1, 0.024], [0, 0.05, 0], { color: 'white' })
      .cyl([0.0245, 0.03, 0.0245], [0, 0.05, 0], { color: 'blue' })
      .cyl([0.026, 0.045, 0.026], [0, 0.122, 0], { color: 'blue' })
      .box([0.006, 0.035, 0.008], [0, 0.12, 0.015], { color: 'blue', round: 0.3 })
      .done(),
  ),
  e('dry ice', 'study', 'lab chemicals', () => {
    const b = m('dry ice').cyl([0.14, 0.06, 0.14], [0, 0.03, 0], { color: '#3a4a5a', taper: 1.3 });
    for (const [x, z, r] of [[-0.03, 0.01, 10], [0.025, -0.01, 35], [0.0, 0.03, 60], [0.01, -0.035, 20]] as V[]) b.box(0.04, [x, 0.07, z], { color: '#eef4f8', round: 0.2, rot: [0, r, 0] });
    around(7, 0.085, 0.4).forEach(([x, z], i) => b.ball([0.07, 0.04, 0.07], [x, 0.02 + (i % 3) * 0.025, z], { color: 'white', noInk: true }));
    return b.ball([0.1, 0.04, 0.1], [0, 0.1, 0], { color: 'white', noInk: true }).done();
  }),
  e('dryer', 'home', 'laundry', () =>
    m('dryer')
      .box([0.65, 0.85, 0.65], [0, 0.425, 0], { color: 'white', round: 0.06 })
      .box([0.6, 0.1, 0.02], [0, 0.77, 0.33], { color: '#d8d8d8', round: 0.3 })
      .cyl([0.06, 0.02, 0.06], [-0.18, 0.77, 0.345], { color: '#888888', rot: [90, 0, 0] })
      .box([0.1, 0.04, 0.01], [0.15, 0.77, 0.345], { color: 'cyan', glow: true })
      .torus([0.44, 0.44, 0.06], [0, 0.4, 0.33], { color: 'silver', tube: 0.18, name: 'door', pivot: [-0.22, 0.4, 0.33] })
      .cyl([0.38, 0.02, 0.38], [0, 0.4, 0.33], { color: '#5a7a9a', rot: [90, 0, 0], parent: 'door' })
      .ball([0.16, 0.1, 0.02], [0.03, 0.34, 0.345], { color: 'red', noInk: true, parent: 'door' })
      .done(),
  ),
  e('dryer sheet', 'home', 'laundry', () =>
    m('dryer sheet')
      .box([0.2, 0.14, 0.08], [0, 0.07, 0], { color: '#a8d8f0', round: 0.2 })
      .label('SOFT', [0.14, 0.05], [0, 0.08, 0.042], { color: 'white' })
      .ball([0.04, 0.04, 0.01], [-0.06, 0.035, 0.042], { color: 'pink', noInk: true })
      .box([0.12, 0.07, 0.004], [0, 0.17, 0], { color: 'white', round: 0.2, rot: [10, 0, 6] })
      .box([0.12, 0.06, 0.004], [0.01, 0.22, -0.006], { color: 'white', round: 0.2, rot: [-12, 0, -4] })
      .done(),
  ),
  e('drywall', 'workshop', 'building materials', () => {
    const b = m('drywall')
      .box([1.2, 1.2, 0.04], [0, 0.73, -0.25], { color: '#ececea', round: 0.05, rot: [-8, 0, 0] })
      .box([1.2, 0.06, 0.05], [0, 1.33, -0.33], { color: '#cfcfcb', rot: [-8, 0, 0] })
      .cyl([0.26, 0.3, 0.26], [0.75, 0.15, 0.2], { color: 'white' })
      .label('MUD', [0.16, 0.08], [0.75, 0.16, 0.335], { color: 'blue' });
    b.each(3, (i) => b.box([1.2, 0.04, 0.6], [0, 0.02 + i * 0.042, 0.05], { color: i % 2 ? '#e4e4e0' : '#ececea', round: 0.1 }));
    return b.done();
  }),
  e('duck bill (part)', 'aviary', 'bird parts', () =>
    m('duck bill (part)')
      .ball([0.09, 0.09, 0.08], [0, 0.055, -0.04], { color: 'yellow' })
      .ball([0.075, 0.026, 0.1], [0, 0.058, 0.04], { color: 'orange' })
      .ball([0.065, 0.02, 0.085], [0, 0.04, 0.035], { color: '#e8701a' })
      .ball(0.008, [0.012, 0.072, 0.06], { color: '#7a3a0a', noInk: true })
      .ball(0.008, [-0.012, 0.072, 0.06], { color: '#7a3a0a', noInk: true })
      .ball(0.014, [0.04, 0.075, -0.02], { color: 'black', eye: true })
      .ball(0.014, [-0.04, 0.075, -0.02], { color: 'black', eye: true })
      .done(),
  ),
  e('duffel bag', 'wardrobe', 'bags', () => {
    const b = m('duffel bag')
      .cyl([0.32, 0.6, 0.32], [0, 0.16, 0], { color: 'navy', rot: [0, 0, 90] })
      .cyl([0.33, 0.04, 0.33], [0.3, 0.16, 0], { color: '#1a2a5a', rot: [0, 0, 90] })
      .cyl([0.33, 0.04, 0.33], [-0.3, 0.16, 0], { color: '#1a2a5a', rot: [0, 0, 90] })
      .box([0.5, 0.02, 0.03], [0, 0.32, 0], { color: 'silver' })
      .box([0.5, 0.06, 0.004], [0, 0.17, 0.161], { color: 'white', noInk: true });
    b.pair((s) => b.torus([0.12, 0.12, 0.02], [s * 0.09, 0.33, 0], { color: 'black', tube: 0.15 }));
    return b.done();
  }),
  e('dumbbell', 'sports', 'gym', () => {
    const b = m('dumbbell').cyl([0.03, 0.36, 0.03], [0, 0.08, 0], { color: 'silver', rot: [0, 0, 90] }).cyl([0.034, 0.12, 0.034], [0, 0.08, 0], { color: '#555555', rot: [0, 0, 90] });
    b.pair((s) => b.cyl([0.16, 0.04, 0.16], [s * 0.1, 0.08, 0], { color: '#222222', rot: [0, 0, 90] }).cyl([0.14, 0.035, 0.14], [s * 0.14, 0.08, 0], { color: '#222222', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('dump truck', 'garage', 'construction vehicles', () => {
    const b = m('dump truck', { view: 'side' })
      .box([2.2, 0.4, 6.4], [0, 1.0, 0], { color: '#333333', round: 0.2 })
      .box([2.3, 1.8, 1.8], [0, 2.0, 2.3], { color: 'yellow', round: 0.3 })
      .box([2.34, 0.8, 1.2], [0, 2.4, 2.5], { color: GLASS, round: 0.3 })
      .box([2.4, 1.4, 4.2], [0, 1.95, -1.0], { color: '#f2b81b', round: 0.1, name: 'lid', pivot: [0, 1.25, -3.1] })
      .box([2.4, 0.2, 0.8], [0, 2.75, 1.3], { color: '#f2b81b', parent: 'lid' })
      .ball([2.0, 0.8, 3.6], [0, 2.6, -1.0], { color: 'dirt', parent: 'lid' })
      .ball([0.3, 0.25, 0.1], [0.8, 1.5, 3.21], { color: 'yellow', glow: true })
      .ball([0.3, 0.25, 0.1], [-0.8, 1.5, 3.21], { color: 'yellow', glow: true });
    for (const z of [2.3, -0.9, -2.3]) b.pair((s) => b.torus([1.2, 1.2, 0.4], [s * 1.05, 0.6, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    return b.done();
  }),
  e('dumpling', 'food', 'asian food', () => {
    const b = m('dumpling')
      .cyl([0.24, 0.06, 0.24], [0, 0.03, 0], { color: '#d9b870' })
      .torus([0.245, 0.245, 0.02], [0, 0.06, 0], { color: '#b8954a', rot: [90, 0, 0], tube: 0.06 });
    for (const [x, z] of [[-0.05, 0.03], [0.05, 0.03], [0, -0.05]]) {
      b.ball([0.075, 0.05, 0.075], [x, 0.08, z], { color: '#f6efe0' }).cone([0.03, 0.025, 0.03], [x, 0.11, z], { color: '#f6efe0' });
      b.each(4, (i) => b.rod([x, 0.118, z], [x + Math.cos(i * 1.57) * 0.025, 0.095, z + Math.sin(i * 1.57) * 0.025], 0.004, '#d8cfb8', { noInk: true }));
    }
    return b.done();
  }),
  e('dumpster', 'home', 'trash', () =>
    m('dumpster')
      .box([1.8, 1.2, 1.1], [0, 0.75, 0], { color: '#2e7d4f', round: 0.06 })
      .box([0.88, 0.06, 1.15], [0.45, 1.38, 0], { color: '#1e5a36', round: 0.3, name: 'lid', pivot: [0.45, 1.38, -0.55] })
      .box([0.88, 0.06, 1.15], [-0.45, 1.42, -0.02], { color: '#1e5a36', round: 0.3, rot: [-6, 0, 0] })
      .ball([0.4, 0.3, 0.4], [-0.45, 1.36, 0.35], { color: '#222222' })
      .box([0.1, 0.3, 0.8], [0.93, 0.8, 0], { color: '#777777', round: 0.2 })
      .box([0.1, 0.3, 0.8], [-0.93, 0.8, 0], { color: '#777777', round: 0.2 })
      .ball(0.16, [0.75, 0.08, 0.45], { color: 'black' })
      .ball(0.16, [-0.75, 0.08, 0.45], { color: 'black' })
      .ball(0.16, [0.75, 0.08, -0.45], { color: 'black' })
      .ball(0.16, [-0.75, 0.08, -0.45], { color: 'black' })
      .done(),
  ),
  e('dune buggy', 'garage', 'cars', () => {
    const b = m('dune buggy', { view: 'side' })
      .box([1.4, 0.15, 2.8], [0, 0.55, 0], { color: 'orange', round: 0.3 })
      .wedge([1.4, 0.4, 0.7], [0, 0.8, 1.2], { color: 'orange', rot: [-90, 0, 0] })
      .box([0.5, 0.45, 0.4], [0, 0.85, -0.25], { color: 'black', round: 0.4 })
      .box([0.9, 0.5, 0.6], [0, 0.85, -1.05], { color: '#777777', round: 0.2 })
      .rod([0.2, 0.9, -1.35], [0.3, 1.1, -1.55], 0.08, 'silver')
      .rod([-0.2, 0.9, -1.35], [-0.3, 1.1, -1.55], 0.08, 'silver');
    b.pair((s) => {
      b.rod([s * 0.6, 0.6, 0.5], [s * 0.5, 1.5, 0.15], 0.06, '#222222').rod([s * 0.6, 0.6, -0.8], [s * 0.5, 1.5, -0.55], 0.06, '#222222').rod([s * 0.5, 1.5, 0.15], [s * 0.5, 1.5, -0.55], 0.06, '#222222');
      for (const z of [1.1, -1.1]) b.torus([0.95, 0.95, 0.42], [s * 0.82, 0.48, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 });
    });
    return b.rod([-0.5, 1.5, 0.15], [0.5, 1.5, 0.15], 0.06, '#222222').rod([-0.5, 1.5, -0.55], [0.5, 1.5, -0.55], 0.06, '#222222').done();
  }),
  e('dungeon', 'places', 'castles', () => {
    const w = '#6a6560';
    const b = m('dungeon')
      .box([3, 0.1, 2.4], [0, 0.05, 0], { color: '#4a4540' })
      .box([3, 2.8, 0.3], [0, 1.4, -1.05], { color: w })
      .box([0.3, 2.8, 2.4], [1.35, 1.4, 0], { color: w })
      .box([0.3, 2.8, 2.4], [-1.35, 1.4, 0], { color: w })
      .ball([0.9, 0.3, 0.7], [0.6, 0.15, -0.5], { color: '#c8a85a' })
      .ball([0.16, 0.14, 0.16], [-0.85, 0.17, -0.6], { color: 'cream' })
      .stick([-1.18, 1.5, 0.2], [-1.0, 1.8, 0.2], 0.06, 'darkwood')
      .ball([0.14, 0.22, 0.14], [-0.98, 1.92, 0.2], { color: 'flame', glow: true });
    b.each(8, (i) => b.stick([-1.2 + i * 0.34, 0.1, 1.1], [-1.2 + i * 0.34, 2.7, 1.1], 0.06, 'iron'));
    for (const y of [0.15, 2.6]) b.stick([-1.25, y, 1.1], [1.25, y, 1.1], 0.08, 'iron');
    b.pair((s) => b.rod([s * 0.4, 1.8, -0.88], [s * 0.45, 1.2, -0.85], 0.03, 'iron').torus([0.12, 0.12, 0.03], [s * 0.45, 1.12, -0.85], { color: 'iron' }));
    b.each(5, (i) => b.box([0.5, 0.25, 0.02], [-1.0 + (i % 3) * 0.9, 0.6 + i * 0.4, -0.89], { color: '#5a5550', noInk: true }));
    return b.done();
  }),
  e('duplex', 'places', 'homes', () => {
    const b = m('duplex')
      .box([8, 4.5, 5], [0, 2.25, 0], { color: '#e8d8b0', round: 0.03 })
      .box([0.15, 4.6, 5.1], [0, 2.3, 0], { color: 'white' });
    b.pair((s) => {
      b.wedge([4.3, 2, 5.4], [s * 2, 5.5, 0], { color: '#8a4a2a' });
      b.box([1.0, 2.1, 0.08], [s * 1.2, 1.05, 2.54], { color: s > 0 ? '#3a6fb5' : '#c0392b', round: 0.1, ...(s > 0 ? { name: 'door', pivot: [0.7, 1.05, 2.54] as V } : {}) });
      b.label(s > 0 ? '1A' : '1B', [0.5, 0.35], [s * 1.2, 2.45, 2.55], { color: 'white' });
      b.box([1.2, 1.0, 0.06], [s * 3.0, 1.4, 2.52], { color: GLASS, round: 0.1 });
      b.box([1.2, 1.0, 0.06], [s * 2.0, 3.4, 2.52], { color: GLASS, round: 0.1 });
      b.box([1.4, 0.2, 0.8], [s * 1.2, 0.1, 2.9], { color: 'stone' });
    });
    return b.done();
  }),
  e('dust', 'home', 'cleaning', () => {
    const b = m('dust');
    for (const [cx, cz, k] of [[-0.06, 0.02, 1], [0.07, -0.02, 0.8], [0.0, 0.08, 0.6]]) {
      b.ball(0.06 * k, [cx, 0.03 * k, cz], { color: '#a8a8a8' });
      around(4, 0.03 * k, cx * 10).forEach(([x, z], i) => b.ball(0.04 * k, [cx + x, 0.02 * k, cz + z], { color: i % 2 ? '#bfbfbf' : '#9a9a9a' }));
    }
    b.each(6, (i) => b.ball(0.008, [-0.08 + rnd(i) * 0.16, 0.08 + rnd(i + 3) * 0.08, -0.04 + rnd(i + 6) * 0.08], { color: '#cccccc', noInk: true }));
    return b.done();
  }),
  e('dust collector', 'workshop', 'power tools', () =>
    m('dust collector')
      .box([0.6, 0.1, 0.5], [0, 0.08, 0], { color: '#444444', round: 0.2 })
      .ball(0.06, [0.25, 0.03, 0.2], { color: 'black' })
      .ball(0.06, [-0.25, 0.03, 0.2], { color: 'black' })
      .ball(0.06, [0.25, 0.03, -0.2], { color: 'black' })
      .ball(0.06, [-0.25, 0.03, -0.2], { color: 'black' })
      .cyl([0.42, 0.3, 0.42], [0, 0.28, 0], { color: '#3a6fb5' })
      .cyl([0.22, 0.26, 0.22], [0.32, 0.32, 0], { color: '#3a6fb5', rot: [0, 0, 90] })
      .cyl([0.46, 0.75, 0.46], [0, 0.82, 0], { color: '#f0f0f0' })
      .ball([0.46, 0.25, 0.46], [0, 1.2, 0], { color: '#f0f0f0' })
      .stick([0, 1.3, 0], [0, 1.45, 0], 0.04, '#444444')
      .rod([-0.2, 0.3, 0.12], [-0.45, 0.25, 0.3], 0.1, '#333333')
      .rod([-0.45, 0.25, 0.3], [-0.55, 0.06, 0.45], 0.1, '#333333')
      .done(),
  ),
  e('dustpan', 'home', 'cleaning', () => {
    const b = m('dustpan')
      .box([0.24, 0.015, 0.2], [0, 0.0075, 0], { color: 'red', round: 0.2 })
      .box([0.24, 0.08, 0.015], [0, 0.045, -0.1], { color: 'red', round: 0.2 })
      .wedge([0.2, 0.07, 0.015], [0.12, 0.035, 0], { color: 'red', apex: -0.5, rot: [0, 90, 0] })
      .wedge([0.2, 0.07, 0.015], [-0.12, 0.035, 0], { color: 'red', apex: -0.5, rot: [0, 90, 0] })
      .rod([0, 0.06, -0.1], [0, 0.2, -0.22], 0.045, 'red')
      .box([0.2, 0.03, 0.05], [0.2, 0.045, 0.14], { color: 'wood', round: 0.4, rot: [0, 30, 0] })
      .box([0.18, 0.03, 0.045], [0.2, 0.015, 0.14], { color: '#666666', round: 0.2, rot: [0, 30, 0] });
    b.each(4, (i) => b.ball(0.022, [-0.04 + i * 0.025, 0.02, 0.02 + (i % 2) * 0.03], { color: '#999999' }));
    return b.done();
  }),
  e('dvd', 'tech', 'media', () =>
    m('dvd')
      .box([0.135, 0.19, 0.014], [0.02, 0.095, -0.03], { color: '#1e1e1e', round: 0.1 })
      .label('DVD', [0.1, 0.05], [0.02, 0.16, -0.022], { color: '#1e1e1e' })
      .cyl([0.12, 0.004, 0.12], [-0.02, 0.062, 0.0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.04, 0.005, 0.04], [-0.02, 0.062, 0.001], { color: '#d8d8e0', rot: [90, 0, 0] })
      .cyl([0.015, 0.006, 0.015], [-0.02, 0.062, 0.002], { color: '#333333', rot: [90, 0, 0] })
      .ball([0.012, 0.04, 0.002], [0.005, 0.075, 0.003], { color: '#f0c8f0', rot: [0, 0, 45], noInk: true })
      .ball([0.01, 0.03, 0.002], [-0.045, 0.045, 0.003], { color: '#c8f0f0', rot: [0, 0, 45], noInk: true })
      .done(),
  ),
  e('dvd player', 'tech', 'media', () =>
    m('dvd player')
      .box([0.43, 0.06, 0.25], [0, 0.035, 0], { color: '#222222', round: 0.2 })
      .box([0.16, 0.012, 0.1], [-0.08, 0.04, 0.17], { color: '#555555' })
      .cyl([0.12, 0.004, 0.12], [-0.08, 0.048, 0.17], { color: 'silver' })
      .box([0.08, 0.02, 0.004], [0.1, 0.04, 0.126], { color: 'cyan', glow: true })
      .ball(0.012, [0.18, 0.04, 0.125], { color: '#888888' })
      .ball(0.012, [0.15, 0.04, 0.125], { color: '#888888' })
      .done(),
  ),
  e('dvd rack', 'home', 'storage', () => {
    const b = m('dvd rack').box([0.44, 0.08, 0.22], [0, 0.04, 0], { color: 'darkwood', round: 0.2 });
    b.pair((s) => b.box([0.03, 1.0, 0.2], [s * 0.2, 0.5, 0], { color: 'darkwood' }));
    b.each(4, (i) => {
      const y = 0.08 + i * 0.23;
      b.box([0.4, 0.02, 0.2], [0, y, 0], { color: 'darkwood' });
      b.each(6, (j) => b.box([0.05, 0.19, 0.14], [-0.15 + j * 0.06, y + 0.105, 0.01], { color: COLS[(i * 6 + j) % COLS.length], round: 0.1 }));
    });
    return b.box([0.43, 0.03, 0.21], [0, 1.0, 0], { color: 'darkwood' }).done();
  }),
  e('dye', 'study', 'art supplies', () => {
    const b = m('dye');
    for (const [x, c] of [[-0.06, 'red'], [0, 'blue'], [0.06, 'yellow']] as Array<[number, string]>) {
      b.cyl([0.045, 0.07, 0.045], [x, 0.035, -0.02], { color: c }).cyl([0.025, 0.02, 0.025], [x, 0.08, -0.02], { color: 'black' });
      b.box([0.035, 0.025, 0.004], [x, 0.035, 0.003], { color: 'white', noInk: true });
      b.ball([0.06, 0.006, 0.04], [x, 0.003, 0.05], { color: c, noInk: true });
    }
    return b.done();
  }),
  e('dynamitee-reader', 'tech', 'gadgets', () =>
    m('dynamitee-reader')
      .box([0.12, 0.02, 0.07], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.12, 0.17, 0.012], [0, 0.1, 0], { color: '#f0f0f0', round: 0.2 })
      .box([0.1, 0.13, 0.002], [0, 0.11, 0.007], { color: '#e0e0d8' })
      .label('BOOK', [0.06, 0.02], [0, 0.155, 0.009], { color: '#e0e0d8' })
      .box([0.125, 0.175, 0.01], [-0.114, 0.1, 0.031], { color: 'red', round: 0.2, rot: [0, 30, 0] })
      .done(),
  ),
  e('ear', 'clinic', 'body parts', () =>
    m('ear')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'stone', round: 0.3 })
      .ball([0.065, 0.1, 0.028], [0, 0.085, 0], { color: 'skin2' })
      .torus([0.045, 0.07, 0.012], [0.004, 0.09, 0.012], { color: 'skin3' })
      .ball([0.016, 0.02, 0.01], [-0.004, 0.08, 0.015], { color: '#5a3020' })
      .ball([0.032, 0.032, 0.022], [0.004, 0.04, 0.0], { color: 'skin2' })
      .done(),
  ),
  e('ear plugs', 'clinic', 'ear care', () =>
    m('ear plugs')
      .box([0.08, 0.03, 0.05], [0, 0.015, -0.02], { color: 'skyblue', round: 0.6 })
      .capsule([0.024, 0.042, 0.024], [-0.02, 0.052, -0.02], { color: 'orange', rot: [0, 0, 12] })
      .capsule([0.024, 0.042, 0.024], [0.04, 0.012, 0.03], { color: 'orange', rot: [90, 30, 0] })
      .rod([-0.02, 0.03, -0.005], [0.0, 0.006, 0.04], 0.005, 'blue')
      .rod([0.0, 0.006, 0.04], [0.03, 0.006, 0.035], 0.005, 'blue')
      .done(),
  ),
  e('ear ring', 'wardrobe', 'jewellery', () =>
    m('ear ring')
      .torus([0.055, 0.055, 0.006], [-0.035, 0.0275, 0], { color: 'gold', tube: 0.14 })
      .ball(0.014, [0.04, 0.085, 0], { color: 'gold' })
      .stick([0.04, 0.08, 0], [0.04, 0.045, 0], 0.004, 'gold')
      .ball([0.024, 0.036, 0.02], [0.04, 0.025, 0], { color: '#3a6fd8' })
      .done(),
  ),
  e('earmuffs', 'wardrobe', 'winter wear', () => {
    const b = m('earmuffs');
    for (let i = 0; i < 6; i++) {
      const t0 = (i * Math.PI) / 6, t1 = ((i + 1) * Math.PI) / 6;
      b.rod([0.09 * Math.cos(t0), 0.07 + 0.13 * Math.sin(t0), 0], [0.09 * Math.cos(t1), 0.07 + 0.13 * Math.sin(t1), 0], 0.016, 'silver');
    }
    b.pair((s) => b.ball([0.06, 0.09, 0.09], [s * 0.095, 0.05, 0], { color: 'pink' }).ball([0.03, 0.07, 0.07], [s * 0.065, 0.05, 0], { color: '#f8c8d8' }));
    return b.done();
  }),
  e('earth (planet)', 'sky', 'planets', () => {
    const b = m('earth (planet)').ball(3.4, [0, 2.0, 0], { color: '#2a6fd8', name: 'rotor' });
    const land: Array<[number, number, number, string]> = [[0.3, 0.6, 1.4, '#4caf50'], [1.9, 0.2, 1.2, '#4caf50'], [3.4, -0.4, 1.3, '#4caf50'], [4.6, 0.5, 1.1, '#c8b070'], [2.6, -0.9, 1.0, '#4caf50'], [5.5, -0.2, 1.0, '#4caf50']];
    for (const [lon, lat, d, c] of land) {
      const r = 1.7 - d / 2 + 0.12;
      b.ball(d, [Math.sin(lon) * Math.cos(lat) * r, 2.0 + Math.sin(lat) * r, Math.cos(lon) * Math.cos(lat) * r], { color: c, parent: 'rotor' });
    }
    return b.ball(1.2, [0, 3.3, 0], { color: 'white', parent: 'rotor' }).ball(1.2, [0, 0.7, 0], { color: 'white', parent: 'rotor' }).done();
  }),
  e('earwax', 'clinic', 'body', () =>
    m('earwax')
      .box([0.12, 0.01, 0.1], [0, 0.005, 0], { color: 'white', round: 0.3 })
      .rod([-0.05, 0.02, 0.02], [0.05, 0.055, 0.0], 0.006, 'white')
      .ball([0.016, 0.024, 0.016], [-0.052, 0.02, 0.02], { color: 'white', rot: [0, 0, 70] })
      .ball([0.018, 0.026, 0.018], [0.053, 0.057, 0.0], { color: '#c8901a', rot: [0, 0, 70] })
      .ball([0.024, 0.012, 0.02], [0.02, 0.014, -0.02], { color: '#c8901a' })
      .done(),
  ),
  e('easter egg', 'toys', 'holidays', () => {
    const b = m('easter egg')
      .torus([0.14, 0.14, 0.03], [0, 0.015, 0], { color: 'lime', rot: [90, 0, 0], tube: 0.3 })
      .ball([0.07, 0.095, 0.07], [0, 0.055, 0], { color: '#8ad0f0' })
      .torus([0.069, 0.069, 0.008], [0, 0.04, 0], { color: 'pink', rot: [90, 0, 0], tube: 0.1 })
      .torus([0.069, 0.069, 0.008], [0, 0.07, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.1 });
    around(5, 0.034, 0.5).forEach(([x, z], i) => b.ball(0.01, [x, 0.055, z], { color: i % 2 ? 'white' : 'purple', noInk: true }));
    return b.done();
  }),
  e('ebook reader', 'tech', 'gadgets', () => {
    const b = m('ebook reader')
      .box([0.1, 0.02, 0.06], [0, 0.01, 0], { color: '#333333', round: 0.3 })
      .box([0.12, 0.17, 0.012], [0, 0.1, 0], { color: '#333333', round: 0.2 })
      .box([0.1, 0.13, 0.002], [0, 0.11, 0.007], { color: '#e8e8e0' });
    b.each(6, (i) => b.box([0.08, 0.004, 0.002], [0, 0.16 - i * 0.018, 0.009], { color: '#888888', noInk: true }));
    return b.done();
  }),
  e('egg', 'food', 'eggs', () =>
    m('egg')
      .cyl([0.04, 0.012, 0.04], [0, 0.006, 0], { color: 'yellow' })
      .cyl([0.016, 0.02, 0.016], [0, 0.022, 0], { color: 'yellow' })
      .cyl([0.045, 0.03, 0.045], [0, 0.045, 0], { color: 'yellow', taper: 1.3 })
      .ball([0.045, 0.06, 0.045], [0, 0.075, 0], { color: '#fbf6ea' })
      .ball([0.06, 0.045, 0.045], [0.06, 0.0225, 0.02], { color: '#d9a46a' })
      .done(),
  ),
  e('egg carton', 'food', 'eggs', () => {
    const b = m('egg carton')
      .box([0.17, 0.05, 0.11], [0, 0.025, 0], { color: '#cfc6b0', round: 0.2 })
      .box([0.17, 0.1, 0.015], [0, 0.1, -0.06], { color: '#cfc6b0', round: 0.2, name: 'lid', pivot: [0, 0.05, -0.055] })
      .label('EGGS', [0.1, 0.035], [0, 0.11, -0.05], { color: '#cfc6b0', parent: 'lid' });
    b.each(6, (i) => b.ball([0.042, 0.05, 0.042], [-0.05 + (i % 3) * 0.05, 0.065, i < 3 ? -0.026 : 0.026], { color: i % 2 ? '#fbf6ea' : '#e8c89a' }));
    return b.done();
  }),
  e('eggnog', 'food', 'drinks', () =>
    mug('eggnog', GLASS, '#f6e7b0', 0.08, 0.11)
      .cyl([0.074, 0.09, 0.074], [0, 0.05, 0], { color: '#f6e7b0' })
      .ball([0.075, 0.035, 0.075], [0, 0.115, 0], { color: 'white' })
      .ball(0.006, [0.01, 0.133, 0.01], { color: '#8a5a2b', noInk: true })
      .ball(0.006, [-0.012, 0.13, -0.004], { color: '#8a5a2b', noInk: true })
      .stick([0.015, 0.09, 0], [0.03, 0.19, -0.01], 0.012, '#8a4a1a')
      .done(),
  ),
  e('eighth note', 'music', 'music symbols', () =>
    m('eighth note')
      .ball([0.05, 0.035, 0.026], [0, 0.02, 0], { color: 'black', rot: [0, 0, 25] })
      .stick([0.021, 0.022, 0], [0.021, 0.11, 0], 0.008, 'black')
      .rod([0.021, 0.11, 0], [0.042, 0.088, 0], 0.012, 'black')
      .rod([0.042, 0.088, 0], [0.046, 0.06, 0], 0.01, 'black')
      .done(),
  ),
  e('elbow', 'clinic', 'body parts', () =>
    m('elbow')
      .rod([-0.08, 0.035, 0], [0.12, 0.03, 0], 0.06, 'skin2')
      .ball([0.07, 0.04, 0.06], [0.16, 0.022, 0], { color: 'skin2' })
      .rod([-0.08, 0.04, 0], [-0.1, 0.25, 0], 0.07, 'skin2')
      .ball(0.07, [-0.088, 0.04, 0], { color: '#e8b090' })
      .cyl([0.09, 0.07, 0.09], [-0.1, 0.25, 0], { color: 'blue' })
      .done(),
  ),
  e('elbow pads', 'sports', 'protective gear', () => {
    const b = m('elbow pads');
    b.pair((s) => {
      b.cyl([0.08, 0.13, 0.07], [s * 0.07, 0.065, -0.01], { color: '#3a6fd8' });
      b.ball([0.09, 0.11, 0.06], [s * 0.07, 0.065, 0.02], { color: '#222222' });
      b.box([0.085, 0.015, 0.075], [s * 0.07, 0.025, -0.005], { color: 'white', round: 0.4 });
      b.box([0.085, 0.015, 0.075], [s * 0.07, 0.11, -0.005], { color: 'white', round: 0.4 });
    });
    return b.done();
  }),
];
