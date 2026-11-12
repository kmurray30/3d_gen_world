/** Catalog chunk objects-02: the words in assign/objects-02.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M, type PartOpts } from '../dsl';
import { face, hat, held, wear, who } from '../accessories';
import type { Vec3 } from '../types';

type V = Vec3;
const RAD = Math.PI / 180;

/* ----- local helpers ----- */

/** Rods through a list of points. */
function path(b: M, pts: V[], t: number, c: string, o?: PartOpts): M {
  for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], t, c, o);
  return b;
}
/** Points on an arc in the x-y plane (degrees, 0 = +x, 90 = up). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, z = 0): V[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * RAD;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), z] as V;
  });
}
/** A straight tool lying diagonally in the x-y plane: point t along it (off = sideways), from (x0, y0) at ang deg.
 *  Boxes along it take rot [0, 0, ang - 90]. */
const diag = (x0: number, y0: number, ang: number) => (t: number, off = 0, z = 0): V => [
  x0 + t * Math.cos(ang * RAD) - off * Math.sin(ang * RAD),
  y0 + t * Math.sin(ang * RAD) + off * Math.cos(ang * RAD),
  z,
];

/** A drinks bottle: body, shoulder, neck, cap, optional label band and text. */
function bottle(key: string, h: number, d: number, body: string, cap: string, band?: string, text?: string): M {
  const b = m(key)
    .cyl([d, h * 0.62, d], [0, h * 0.31, 0], { color: body })
    .cyl([d, h * 0.14, d], [0, h * 0.69, 0], { color: body, taper: 0.42 })
    .cyl([d * 0.42, h * 0.14, d * 0.42], [0, h * 0.82, 0], { color: body })
    .cyl([d * 0.5, h * 0.08, d * 0.5], [0, h * 0.92, 0], { color: cap });
  if (band) b.cyl([d * 1.04, h * 0.26, d * 1.04], [0, h * 0.34, 0], { color: band });
  if (text) b.label(text, [d * 0.72, h * 0.16], [0, h * 0.34, d * 0.53], { color: band ?? 'white' });
  return b;
}

/** A drink in a glass: the liquid fills the lower part, clear glass above it, a rim on top. */
function drink(b: M, h: number, d: number, liquid: string, fill = 0.78, x = 0, z = 0): M {
  return b
    .cyl([d, h * fill, d], [x, (h * fill) / 2, z], { color: liquid })
    .cyl([d, h * (1 - fill), d], [x, h * fill + (h * (1 - fill)) / 2, z], { color: 'glass' })
    .torus([d * 1.02, d * 1.02, h * 0.04], [x, h, z], { color: 'glass', rot: [90, 0, 0], tube: 0.12 });
}

/** A box with a printed front (cereal, cake mix, packs). */
function pack(key: string, size: V, color: string, text: string, card = 'white'): M {
  const [w, h, d] = size;
  return m(key)
    .box(size, [0, h / 2, 0], { color, round: 0.06 })
    .label(text, [w * 0.8, h * 0.28], [0, h * 0.62, d / 2 + 0.005], { color: card });
}

/** A gable-top carton (milk, juice). */
function carton(key: string, h: number, w: number, color: string, text: string, top = 'white'): M {
  return m(key)
    .box([w, h * 0.74, w], [0, h * 0.37, 0], { color, round: 0.06 })
    .wedge([w, h * 0.2, w], [0, h * 0.84, 0], { color: top, rot: [0, 90, 0] })
    .box([w * 1.0, h * 0.06, w * 0.08], [0, h * 0.96, 0], { color: top, round: 0.1 })
    .label(text, [w * 0.82, h * 0.22], [0, h * 0.4, w / 2 + 0.005], { color: 'white' });
}

/** A plate. */
const plate = (b: M, d: number, y = 0, color = 'white'): M =>
  b.cyl([d * 0.7, d * 0.04, d * 0.7], [0, y + d * 0.02, 0], { color }).cyl([d, d * 0.04, d], [0, y + d * 0.06, 0], { color, taper: 1 });

/** A bowl from a flared cylinder, a rim and a darker inside (or contents). */
function bowl(b: M, d: number, h: number, outer: string, inside: string, y = 0): M {
  return b
    .cyl([d * 0.62, h, d * 0.62], [0, y + h / 2, 0], { color: outer, taper: 1.6 })
    .torus([d, d, h * 0.12], [0, y + h, 0], { color: outer, rot: [90, 0, 0], tube: 0.1 })
    .cyl([d * 0.92, h * 0.06, d * 0.92], [0, y + h * 0.95, 0], { color: inside });
}

interface ShopO {
  w: number;
  h: number;
  d: number;
  wall: string;
  sign: string;
  roof?: string;
  signColor?: string;
  gable?: boolean;
  awning?: [string, string];
  door?: string;
}
/** A little building with a door, two windows and a sign over the door; optional gable roof and striped awning. */
function shop(key: string, o: ShopO): M {
  const { w, h, d } = o;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.gable) b.wedge([w * 1.1, h * 0.45, d * 1.1], [0, h * 1.22, 0], { color: o.roof ?? 'darkred' });
  else b.box([w * 1.06, h * 0.07, d * 1.06], [0, h * 1.03, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  b.box([w * 0.2, h * 0.5, 0.08], [0, h * 0.25, d / 2 + 0.03], { color: o.door ?? 'darkwood', name: 'door', pivot: [-w * 0.1, h * 0.25, d / 2 + 0.03] });
  b.pair((s) => b.box([w * 0.24, h * 0.28, 0.06], [s * w * 0.3, h * 0.36, d / 2 + 0.02], { color: 'glass' }));
  b.label(o.sign, [w * 0.72, h * 0.16], [0, h * 0.82, d / 2 + 0.05], { color: o.signColor ?? 'white' });
  if (o.awning) {
    const n = 8;
    b.each(n, (i) => b.box([w / n, 0.06, d * 0.22], [-w / 2 + (w / n) * (i + 0.5), h * 0.6, d / 2 + d * 0.1], { color: o.awning![i % 2], rot: [25, 0, 0], round: 0.1 }));
  }
  return b;
}

/** A bowling pin of height h standing at (x, y0, z). */
function pin(b: M, x: number, z: number, h: number, simple = false, y0 = 0): M {
  b.ball([0.34 * h, 0.62 * h, 0.34 * h], [x, y0 + 0.31 * h, z], { color: 'white' })
    .cyl([0.13 * h, 0.22 * h, 0.13 * h], [x, y0 + 0.68 * h, z], { color: 'white' })
    .ball([0.19 * h, 0.24 * h, 0.19 * h], [x, y0 + 0.86 * h, z], { color: 'white' });
  if (!simple) b.cyl([0.18 * h, 0.04 * h, 0.18 * h], [x, y0 + 0.02 * h, z], { color: 'white' });
  b.torus([0.15 * h, 0.15 * h, 0.035 * h], [x, y0 + 0.66 * h, z], { color: 'red', rot: [90, 0, 0], tube: 0.25, noInk: true });
  if (!simple) b.torus([0.15 * h, 0.15 * h, 0.035 * h], [x, y0 + 0.71 * h, z], { color: 'red', rot: [90, 0, 0], tube: 0.25, noInk: true });
  return b;
}

/** Wheels of a side-view vehicle (axles along x) at each z; the first one rolls. */
function wheels(b: M, xs: number, zs: number[], d: number, w = d * 0.4, hub = 'silver'): M {
  let first = true;
  for (const z of zs)
    b.pair((s) => {
      b.torus([d, d, w], [s * xs, d / 2, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.36, name: first ? 'wheel' : undefined });
      first = false;
      b.cyl([d * 0.42, w * 0.8, d * 0.42], [s * xs, d / 2, z], { color: hub, rot: [0, 0, 90] });
    });
  return b;
}

/** A spoked wooden wheel facing x at (x, y, z). */
function spoked(b: M, x: number, y: number, z: number, d: number, color = 'darkwood', n = 6): M {
  b.torus([d, d, d * 0.08], [x, y, z], { color, rot: [0, 90, 0], tube: 0.12 });
  b.cyl([d * 0.16, d * 0.12, d * 0.16], [x, y, z], { color, rot: [0, 0, 90] });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI;
    b.stick([x, y + Math.sin(a) * d * 0.46, z + Math.cos(a) * d * 0.46], [x, y - Math.sin(a) * d * 0.46, z - Math.cos(a) * d * 0.46], d * 0.035, color);
  }
  return b;
}

/** A round-crowned tree. */
function tree(b: M, x: number, z: number, h: number, crown: string, name?: string): M {
  return b
    .cyl([h * 0.1, h * 0.5, h * 0.1], [x, h * 0.25, z], { color: 'bark', taper: 0.7 })
    .ball([h * 0.62, h * 0.56, h * 0.62], [x, h * 0.7, z], { color: crown, name });
}

/** A pine tree. */
function pine(b: M, x: number, z: number, h: number, color = 'darkgreen'): M {
  return b
    .cyl([h * 0.08, h * 0.3, h * 0.08], [x, h * 0.15, z], { color: 'bark' })
    .cone([h * 0.5, h * 0.5, h * 0.5], [x, h * 0.45, z], { color })
    .cone([h * 0.38, h * 0.45, h * 0.38], [x, h * 0.75, z], { color });
}

/** A campfire of size s: ring of stones, log tipi, flames. */
function fire(b: M, x: number, z: number, s: number): M {
  around(8, 0.42 * s).forEach(([dx, dz]) => b.ball([0.22 * s, 0.14 * s, 0.22 * s], [x + dx, 0.06 * s, z + dz], { color: 'stone' }));
  around(4, 0.3 * s, 0.4).forEach(([dx, dz]) => b.rod([x + dx, 0.06 * s, z + dz], [x + dx * 0.15, 0.55 * s, z + dz * 0.15], 0.1 * s, 'bark'));
  return b
    .cone([0.44 * s, 0.95 * s, 0.44 * s], [x, 0.52 * s, z], { color: 'fire', glow: true })
    .cone([0.26 * s, 0.6 * s, 0.26 * s], [x, 0.36 * s, z + 0.08 * s], { color: 'flame', glow: true })
    .cone([0.16 * s, 0.4 * s, 0.16 * s], [x + 0.18 * s, 0.3 * s, z + 0.05 * s], { color: 'fire', glow: true });
}

/** A wooden barrel at (x, z); lying along x when lying is set. */
function barrel(b: M, x: number, z: number, d: number, h: number, lying = false): M {
  const y = lying ? d / 2 : h / 2;
  const rot: V | undefined = lying ? [0, 0, 90] : undefined;
  b.cyl([d * 0.92, h, d * 0.92], [x, y, z], { color: 'wood', rot }).ball([d, h * 0.8, d], [x, y, z], { color: 'wood', rot });
  for (const k of [-0.32, 0.32]) {
    const at: V = lying ? [x + k * h, y, z] : [x, y + k * h, z];
    b.torus([d * 0.98, d * 0.98, h * 0.06], at, { color: 'iron', rot: lying ? [0, 90, 0] : [90, 0, 0], tube: 0.06 });
  }
  return b;
}

/** A square game board of n x n squares, side `side`, standing tilted back by `tilt` degrees on a foot; returns a
 *  function placing things on its face at grid cell (col, row) with an offset out of the board. */
function board(b: M, side: number, n: number, light: string, dark: string, tilt = 15) {
  const a = -tilt * RAD;
  const c: V = [0, side / 2 + 0.03, 0];
  const at = (u: number, v: number, w: number): V => [u, c[1] + v * Math.cos(a) - w * Math.sin(a), c[2] + v * Math.sin(a) + w * Math.cos(a)];
  const rot: V = [-tilt, 0, 0];
  b.box([side * 0.8, 0.045, side * 0.35], [0, 0.0225, -0.02], { color: 'darkwood', round: 0.3 });
  b.box([side * 1.06, side * 1.06, 0.02], at(0, 0, -0.004), { color: 'darkwood', rot, round: 0.1 });
  b.box([side, side, 0.012], at(0, 0, 0.004), { color: light, rot, round: 0 });
  const q = side / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) b.box([q, q, 0.006], at(-side / 2 + q * (i + 0.5), -side / 2 + q * (j + 0.5), 0.01), { color: dark, rot, round: 0, noInk: true });
  return (i: number, j: number, w: number): V => at(-side / 2 + q * (i + 0.5), -side / 2 + q * (j + 0.5), w);
}

export const ENTRIES: CatalogEntry[] = [
  e('bottled water', 'food', 'drinks', () => bottle('bottled water', 0.24, 0.07, '#cbe9f8', 'blue', 'skyblue', 'WATER').done()),
  e('boulder', 'nature', 'rocks', () =>
    m('boulder')
      .ball([2.4, 1.7, 2.0], [0, 0.8, 0], { color: 'rock' })
      .ball([1.3, 1.1, 1.2], [0.75, 0.5, 0.5], { color: 'stone' })
      .ball([1.1, 0.9, 1.0], [-0.85, 0.42, 0.4], { color: 'rock' })
      .ball([1.0, 0.55, 0.9], [-0.2, 1.5, -0.1], { color: '#7e7b75' })
      .ball([0.7, 0.14, 0.55], [0.25, 1.68, 0.15], { color: '#6f8f4a', noInk: true })
      .done(),
  ),
  e('bouncy ball', 'toys', 'balls', () =>
    m('bouncy ball')
      .ball(0.09, [0, 0.045, 0], { color: 'magenta' })
      .torus([0.092, 0.092, 0.02], [0, 0.045, 0], { color: 'yellow', rot: [10, 30, 25], tube: 0.14, noInk: true })
      .ball([0.022, 0.016, 0.01], [0.02, 0.07, 0.035], { color: 'white', noInk: true })
      .done(),
  ),
  e('bouncy house', 'toys', 'fairground', () => {
    const b = m('bouncy house')
      .box([4.2, 0.6, 4.2], [0, 0.3, 0], { color: 'blue', round: 0.7 })
      .box([4, 2.2, 0.5], [0, 1.6, -1.8], { color: 'red', round: 0.6 })
      .label('JUMP!', [1.6, 0.5], [0, 2.0, -1.53], { color: 'yellow' });
    b.pair((s) => {
      b.box([0.5, 2.0, 4], [s * 1.8, 1.5, 0], { color: 'yellow', round: 0.6 });
      b.box([0.06, 1.0, 2.4], [s * 2.06, 1.6, 0.1], { color: 'skyblue', round: 0.2 });
      b.box([1.1, 1.0, 0.5], [s * 1.35, 1.0, 1.8], { color: 'red', round: 0.6 });
      for (const z of [-1.8, 1.8]) {
        b.capsule([0.85, 3.2, 0.85], [s * 1.85, 2.0, z], { color: z < 0 ? 'red' : 'yellow' });
        b.cone([1.0, 0.9, 1.0], [s * 1.85, 4.0, z], { color: 'blue' });
      }
    });
    b.each(3, (i) => b.box([0.5, 0.4, 0.5], [-1.0 + i * 1.0, 2.9, -1.8], { color: 'red', round: 0.6 }));
    return b.done();
  }),
  e('bouquet', 'garden', 'flowers', () => {
    const b = m('bouquet')
      .cyl([0.035, 0.06, 0.035], [0, 0.03, 0], { color: 'green' })
      .cone([0.17, 0.25, 0.17], [0, 0.175, 0], { color: 'pink', rot: [180, 0, 0] })
      .ball([0.06, 0.04, 0.04], [0, 0.11, 0.06], { color: 'red' });
    const cols = ['red', 'yellow', 'white', 'purple', 'orange'];
    around(5, 0.065).forEach(([x, z], i) => b.ball(0.085, [x, 0.3, z], { color: cols[i] }).ball(0.026, [x * 1.3, 0.32, z * 1.3 + 0.01], { color: 'gold', noInk: true }));
    b.ball(0.09, [0, 0.36, 0], { color: 'pink' });
    b.pair((s) => b.ball([0.05, 0.08, 0.02], [s * 0.09, 0.27, -0.02], { color: 'leaf', rot: [0, 0, s * -30] }));
    return b.done();
  }),
  e('bow (gift)', 'toys', 'party things', () => {
    const b = m('bow (gift)').ball([0.035, 0.03, 0.03], [0, 0.085, 0.005], { color: 'darkred' });
    b.pair((s) => {
      b.torus([0.09, 0.06, 0.03], [s * 0.048, 0.1, 0], { color: 'red', rot: [0, 0, s * 22], tube: 0.38 });
      b.rod([s * 0.01, 0.075, 0], [s * 0.05, 0.012, 0.005], 0.024, 'red');
    });
    return b.done();
  }),
  e('bow (music)', 'music', 'strings', () => {
    const P = diag(-0.06, 0.02, 80);
    return m('bow (music)')
      .rod(P(0), P(0.72), 0.012, 'darkwood')
      .stick(P(0.06, 0.022), P(0.7, 0.012), 0.007, 'cream')
      .box([0.05, 0.085, 0.05], P(0.07, 0.012), { color: 'black', rot: [0, 0, -10], round: 0.3 })
      .ball(0.014, P(0), { color: 'silver' })
      .box([0.016, 0.03, 0.016], P(0.71, 0.006), { color: 'cream', rot: [0, 0, -10] })
      .done();
  }),
  e('bow (weapon)', 'armory', 'bows', () => {
    const b = m('bow (weapon)');
    const pts = arc(1.08, 0.86, 1.25, 1.25, 137, 223, 8);
    path(b, pts, 0.05, 'wood');
    return b
      .stick(pts[0], pts[8], 0.006, 'white')
      .capsule([0.135, 0.26, 0.135], [-0.16, 0.86, 0], { color: 'leather' })
      .rod([0.16, 0.86, 0.03], [-0.42, 0.86, 0.03], 0.014, 'lightwood')
      .cone([0.04, 0.08, 0.012], [-0.46, 0.86, 0.03], { color: 'steel', rot: [0, 0, 90] })
      .wedge([0.09, 0.03, 0.006], [0.1, 0.885, 0.03], { color: 'red' })
      .wedge([0.09, 0.03, 0.006], [0.1, 0.835, 0.03], { color: 'red', rot: [0, 0, 180] })
      .done();
  }),
  e('bow tie', 'wardrobe', 'neckwear', () => {
    const b = m('bow tie').box([0.026, 0.032, 0.028], [0, 0.03, 0.003], { color: 'darkred' });
    b.pair((s) => {
      b.cyl([0.06, 0.065, 0.022], [s * 0.042, 0.03, 0], { color: 'red', taper: 0.35, rot: [0, 0, s * 90] });
      b.ball(0.012, [s * 0.05, 0.04, 0.012], { color: 'white', noInk: true });
      b.ball(0.01, [s * 0.035, 0.018, 0.011], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('bowl', 'kitchen', 'tableware', () => bowl(m('bowl'), 0.21, 0.1, 'teal', 'cream').done()),
  e('bowling alley', 'places', 'entertainment', () => {
    const b = shop('bowling alley', { w: 5, h: 2.6, d: 3, wall: 'purple', sign: 'BOWLING', signColor: 'yellow', roof: 'navy' });
    pin(b, -0.6, 0, 1.6, true, 2.75);
    return b.ball(0.7, [1.6, 3.15, 0.3], { color: 'blue' }).done();
  }),
  e('bowling ball', 'sports', 'bowling', () => {
    const b = m('bowling ball').ball(0.22, [0, 0.11, 0], { color: 'navy' });
    for (const d of [[-0.25, 0.55, 0.8], [0.25, 0.55, 0.8], [0, 0.25, 0.97]]) b.ball(0.03, [d[0] * 0.105, 0.11 + d[1] * 0.105, d[2] * 0.105], { color: 'black' });
    return b.ball([0.04, 0.03, 0.01], [0.05, 0.17, 0.06], { color: '#7f9be0', noInk: true }).done();
  }),
  e('bowling lane', 'sports', 'bowling', () => {
    const b = m('bowling lane', { view: 'side' })
      .box([1.05, 0.22, 2.6], [0, 0.11, 0], { color: 'lightwood', round: 0.05 })
      .ball(0.22, [0.1, 0.33, 0.9], { color: 'blue' });
    b.pair((s) => b.box([0.24, 0.18, 2.6], [s * 0.64, 0.09, 0], { color: 'darkgray', round: 0.3 }));
    b.each(5, (i) => b.cone([0.05, 0.12, 0.004], [-0.3 + i * 0.15, 0.221, 0.4 - Math.abs(i - 2) * 0.12], { color: 'darkwood', rot: [-90, 0, 0], noInk: true }));
    for (let r = 0; r < 3; r++) for (let i = 0; i <= r; i++) pin(b, (i - r / 2) * 0.3, -0.7 - r * 0.26, 0.38, true, 0.22);
    return b.done();
  }),
  e('bowling pin', 'sports', 'bowling', () => pin(m('bowling pin'), 0, 0, 0.38).done()),
  e('box', 'home', 'boxes', () =>
    m('box')
      .box([0.5, 0.4, 0.4], [0, 0.2, 0], { color: 'tan', round: 0.04 })
      .box([0.5, 0.006, 0.01], [0, 0.4, 0], { color: '#b8915e', noInk: true })
      .box([0.08, 0.008, 0.41], [0, 0.402, 0], { color: '#efe2c4', noInk: true })
      .box([0.08, 0.1, 0.008], [0, 0.35, 0.202], { color: '#efe2c4', noInk: true })
      .label('FRAGILE', [0.22, 0.07], [0.0, 0.18, 0.21], { color: 'red' })
      .done(),
  ),
  e('box of chocolates', 'food', 'sweets', () => {
    const b = m('box of chocolates')
      .box([0.3, 0.04, 0.22], [0, 0.02, 0], { color: 'red', round: 0.15 })
      .box([0.28, 0.01, 0.2], [0, 0.041, 0], { color: 'gold' })
      .box([0.3, 0.22, 0.025], [0, 0.11, -0.13], { color: 'red', rot: [-12, 0, 0], round: 0.15 })
      .heart(0.1, [0, 0.13, -0.11], { color: 'gold', rot: [-12, 0, 0] });
    const cols = ['chocolate', '#3e2416', '#c99566'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.ball([0.048, 0.03, 0.048], [-0.105 + i * 0.07, 0.05, -0.06 + j * 0.06], { color: cols[(i + j) % 3] });
    return b.done();
  }),
  e('boxers', 'wardrobe', 'underwear', () => {
    const b = m('boxers')
      .box([0.36, 0.04, 0.2], [0, 0.28, 0], { color: 'white', round: 0.4 })
      .box([0.35, 0.14, 0.2], [0, 0.19, 0], { color: 'blue', round: 0.3 })
      .ball(0.014, [0, 0.2, 0.1], { color: 'white' });
    b.pair((s) => b.box([0.17, 0.15, 0.19], [s * 0.095, 0.075, 0], { color: 'blue', rot: [0, 0, s * 5], round: 0.3 }));
    for (const [x, y] of [[-0.1, 0.19], [0.1, 0.12], [-0.08, 0.06], [0.11, 0.22]]) b.heart(0.04, [x, y, 0.1], { color: 'red', noInk: true });
    return b.done();
  }),
  e('boxing glove', 'sports', 'boxing', () =>
    m('boxing glove')
      .cyl([0.13, 0.11, 0.13], [0, 0.055, 0], { color: 'white' })
      .ball([0.17, 0.21, 0.2], [0, 0.2, 0.01], { color: 'red' })
      .ball([0.07, 0.13, 0.08], [0.085, 0.16, 0.05], { color: 'red', rot: [0, 0, -18] })
      .box([0.1, 0.02, 0.01], [0, 0.07, 0.066], { color: 'darkred', noInk: true })
      .done(),
  ),
  e('boxing ring', 'sports', 'boxing', () => {
    const b = m('boxing ring')
      .box([6, 1, 6], [0, 0.5, 0], { color: 'navy', round: 0.04 })
      .box([5.9, 0.08, 5.9], [0, 1.04, 0], { color: 'lightgray', round: 0.1 })
      .label('BOXING', [2, 0.5], [0, 0.5, 3.01], { color: 'white' });
    const c: Array<[number, number]> = [[2.8, 2.8], [-2.8, 2.8], [-2.8, -2.8], [2.8, -2.8]];
    c.forEach(([x, z], i) => b.cyl([0.16, 1.4, 0.16], [x, 1.75, z], { color: 'silver' }).box([0.3, 1.0, 0.3], [x, 1.75, z], { color: i % 2 ? 'blue' : 'red' }));
    ['red', 'white', 'blue'].forEach((col, k) => {
      const y = 1.4 + k * 0.35;
      for (let i = 0; i < 4; i++) b.stick([c[i][0], y, c[i][1]], [c[(i + 1) % 4][0], y, c[(i + 1) % 4][1]], 0.05, col);
    });
    return b.done();
  }),
  e('bra', 'wardrobe', 'underwear', () => {
    const b = m('bra').box([0.3, 0.03, 0.06], [0, 0.03, -0.01], { color: 'pink', round: 0.4 }).ball(0.02, [0, 0.07, 0.03], { color: 'white' });
    b.pair((s) => {
      b.ball([0.13, 0.12, 0.08], [s * 0.066, 0.09, 0.015], { color: 'pink', rot: [0, s * 15, s * -10] });
      b.rod([s * 0.075, 0.14, 0.0], [s * 0.095, 0.22, -0.03], 0.012, 'pink');
      b.torus([0.12, 0.08, 0.01], [s * 0.066, 0.085, 0.05], { color: 'white', tube: 0.12, noInk: true });
    });
    return b.done();
  }),
  e('bracelet', 'wardrobe', 'jewellery', () => {
    const b = m('bracelet').torus([0.08, 0.08, 0.02], [0, 0.04, 0], { color: 'gold', tube: 0.22, rot: [0, 25, 0] });
    ['red', 'blue', 'green'].forEach((c, i) => {
      const a = (60 + i * 30) * RAD;
      b.ball(0.014, [Math.cos(a) * 0.036, 0.04 + Math.sin(a) * 0.036, 0.008], { color: c });
    });
    return b.done();
  }),
  e('braces', 'clinic', 'dental', () => {
    const b = m('braces');
    for (const [y, up] of [[0.075, 1], [0.035, -1]] as const) {
      const gum: V[] = [], wire: V[] = [];
      for (let i = 0; i < 6; i++) {
        const a = 30 + i * 24, ca = Math.cos(a * RAD), sa = Math.sin(a * RAD);
        b.box([0.016, 0.03, 0.012], [ca * 0.05, y, sa * 0.045], { color: 'white', rot: [0, 90 - a, 0], round: 0.4 });
        b.box([0.008, 0.008, 0.006], [ca * 0.057, y - up * 0.002, sa * 0.052], { color: 'silver', rot: [0, 90 - a, 0] });
        wire.push([ca * 0.058, y - up * 0.002, sa * 0.053]);
      }
      for (let i = 0; i <= 6; i++) {
        const a = (25 + i * 21.7) * RAD;
        gum.push([Math.cos(a) * 0.047, y + up * 0.02, Math.sin(a) * 0.042]);
      }
      path(b, gum, 0.022, '#e88c9a');
      path(b, wire, 0.003, 'steel');
    }
    return b.done();
  }),
  e('brain', 'clinic', 'organs', () => {
    const b = m('brain')
      .ball([0.09, 0.05, 0.06], [0, 0.04, -0.055], { color: '#e8899f' })
      .cyl([0.03, 0.06, 0.03], [0, 0.025, -0.02], { color: '#e8899f', rot: [20, 0, 0] })
      .box([0.004, 0.06, 0.15], [0, 0.1, 0.005], { color: '#b8586e', noInk: true });
    b.pair((s) => {
      b.ball([0.078, 0.1, 0.16], [s * 0.04, 0.078, 0.005], { color: '#f3a6b7' });
      for (let k = 0; k < 4; k++) {
        const z = -0.055 + k * 0.035;
        path(b, [[s * 0.01, 0.127, z], [s * 0.04, 0.128, z + 0.012], [s * 0.065, 0.11, z - 0.006], [s * 0.078, 0.08, z + 0.01]], 0.004, '#c9667d', { noInk: true });
      }
    });
    return b.done();
  }),
  e('brass knuckles', 'armory', 'close combat', () => {
    const b = m('brass knuckles')
      .box([0.14, 0.016, 0.018], [0, 0.056, 0], { color: 'brass', round: 0.4 })
      .capsule([0.03, 0.12, 0.022], [0, 0.03, 0], { color: 'brass', rot: [0, 0, 90] })
      .rod([-0.04, 0.03, 0], [-0.03, 0.056, 0], 0.012, 'brass')
      .rod([0.04, 0.03, 0], [0.03, 0.056, 0], 0.012, 'brass');
    b.each(4, (i) => b.torus([0.034, 0.034, 0.016], [-0.051 + i * 0.034, 0.078, 0], { color: 'brass', tube: 0.28 }));
    return b.done();
  }),
  e('bread', 'food', 'bakery', () => {
    const b = m('bread')
      .box([0.28, 0.09, 0.13], [0, 0.045, 0], { color: 'bread', round: 0.6 })
      .ball([0.29, 0.1, 0.14], [0, 0.088, 0], { color: 'crust' });
    b.each(3, (i) => b.box([0.05, 0.008, 0.014], [-0.07 + i * 0.07, 0.136, 0], { color: 'bread', rot: [0, 40, 0], noInk: true }));
    return b.done();
  }),
  e('bread knife', 'kitchen', 'knives', () => {
    const a = 35;
    const P = diag(-0.13, 0.025, a);
    const b = m('bread knife')
      .box([0.028, 0.12, 0.02], P(0.06), { color: 'black', rot: [0, 0, a - 90], round: 0.5 })
      .box([0.034, 0.2, 0.005], P(0.22, -0.003), { color: 'silver', rot: [0, 0, a - 90], round: 0.3 })
      .ball(0.008, P(0.035, 0, 0.011), { color: 'silver' })
      .ball(0.008, P(0.085, 0, 0.011), { color: 'silver' });
    b.each(7, (i) => b.cone([0.01, 0.01, 0.004], P(0.135 + i * 0.026, -0.022), { color: 'silver', rot: [0, 0, a + 180] }));
    return b.done();
  }),
  e('bread maker', 'kitchen', 'appliances', () =>
    m('bread maker')
      .box([0.3, 0.3, 0.38], [0, 0.15, 0], { color: 'white', round: 0.3 })
      .box([0.28, 0.06, 0.3], [0, 0.31, -0.02], { color: 'white', round: 0.5, name: 'lid', pivot: [0, 0.31, -0.17] })
      .box([0.15, 0.012, 0.13], [0, 0.341, -0.02], { color: 'glass', parent: 'lid' })
      .box([0.2, 0.1, 0.02], [0, 0.2, 0.19], { color: 'darkgray', round: 0.2 })
      .box([0.08, 0.03, 0.01], [0, 0.22, 0.2], { color: 'lime', glow: true })
      .label('BREAD', [0.12, 0.03], [0, 0.17, 0.205], { color: 'darkgray' })
      .done(),
  ),
  e('brick', 'workshop', 'building materials', () => {
    const b = m('brick').box([0.215, 0.065, 0.1], [0, 0.0325, 0], { color: '#b5523b', round: 0.1 });
    b.each(3, (i) => b.cyl([0.026, 0.004, 0.026], [-0.06 + i * 0.06, 0.066, 0], { color: '#6e2f22' }));
    return b.done();
  }),
  e('bridge (structure)', 'places', 'bridges', () => {
    const b = m('bridge (structure)')
      .box([3.2, 0.03, 1.0], [0, 0.015, 0], { color: 'water', round: 0.1 })
      .box([3.2, 0.06, 0.42], [0, 0.35, 0], { color: 'darkgray', round: 0.2 });
    b.pair((s) => {
      b.box([0.3, 0.34, 0.56], [s * 0.8, 0.17, 0], { color: 'stone', round: 0.1 });
      for (const z of [-0.18, 0.18]) b.box([0.08, 0.7, 0.08], [s * 0.8, 0.65, z], { color: '#c0362c' });
      b.box([0.08, 0.06, 0.44], [s * 0.8, 0.96, 0], { color: '#c0362c' });
      b.box([0.08, 0.06, 0.44], [s * 0.8, 0.62, 0], { color: '#c0362c' });
    });
    for (const z of [-0.2, 0.2]) {
      const pts: V[] = [[-1.6, 0.38, z], [-0.8, 0.98, z]];
      for (let i = 1; i < 6; i++) {
        const x = -0.8 + i * (1.6 / 6);
        pts.push([x, 0.42 + 0.56 * (x / 0.8) ** 2, z]);
      }
      pts.push([0.8, 0.98, z], [1.6, 0.38, z]);
      path(b, pts, 0.02, '#c0362c');
      if (z > 0) for (let i = 1; i < 6; i++) if (i !== 3) b.stick([pts[i + 1][0], 0.38, z], pts[i + 1], 0.008, '#c0362c', { noInk: true });
    }
    return b.done();
  }),
  e('brie', 'food', 'cheese', () =>
    m('brie')
      .box([0.34, 0.015, 0.32], [0, 0.0075, 0], { color: 'wood', round: 0.3 })
      .cyl([0.2, 0.045, 0.2], [0, 0.0375, -0.04], { color: '#f6f1e2' })
      .wedge([0.075, 0.09, 0.045], [0, 0.0375, 0.11], { color: '#f4e3a2', rot: [-90, 0, 0] })
      .box([0.075, 0.045, 0.006], [0, 0.0375, 0.157], { color: '#f6f1e2', round: 0.2 })
      .done(),
  ),
  e('briefs', 'wardrobe', 'underwear', () =>
    m('briefs')
      .box([0.3, 0.035, 0.1], [0, 0.23, 0], { color: 'navy', round: 0.4 })
      .ball([0.26, 0.012, 0.07], [0, 0.247, 0], { color: 'lightgray', noInk: true })
      .box([0.29, 0.07, 0.09], [0, 0.18, 0], { color: 'white', round: 0.3 })
      .wedge([0.29, 0.15, 0.08], [0, 0.08, 0], { color: 'white', rot: [0, 0, 180] })
      .box([0.07, 0.03, 0.08], [0, 0.015, 0], { color: 'white', round: 0.4 })
      .rod([0.14, 0.15, 0.036], [0.04, 0.025, 0.036], 0.018, 'navy')
      .rod([-0.14, 0.15, 0.036], [-0.04, 0.025, 0.036], 0.018, 'navy')
      .ball(0.018, [0, 0.19, 0.046], { color: 'navy' })
      .done(),
  ),
  e('broccoli', 'food', 'vegetables', () => {
    const b = m('broccoli').cyl([0.05, 0.13, 0.05], [0, 0.065, 0], { color: '#9cc76f', taper: 0.8 });
    around(5, 0.055).forEach(([x, z]) => b.rod([0, 0.11, 0], [x, 0.15, z], 0.02, '#9cc76f').ball(0.08, [x, 0.17, z], { color: 'darkgreen' }));
    return b.ball([0.11, 0.09, 0.11], [0, 0.2, 0], { color: '#4f8f3a' }).done();
  }),
  e('brooch', 'wardrobe', 'jewellery', () => {
    const b = m('brooch')
      .torus([0.065, 0.08, 0.014], [0, 0.045, 0], { color: 'gold', tube: 0.18 })
      .ball([0.042, 0.055, 0.02], [0, 0.045, 0.002], { color: 'teal' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.ball(0.01, [Math.cos(a) * 0.04, 0.045 + Math.sin(a) * 0.048, 0.006], { color: 'white' });
    });
    return b.done();
  }),
  e('broom', 'home', 'cleaning', () =>
    m('broom')
      .stick([0, 0.36, 0], [0, 1.4, 0], 0.032, 'wood')
      .cyl([0.32, 0.38, 0.12], [0, 0.19, 0], { color: '#e3c565', taper: 0.45 })
      .cone([0.15, 0.08, 0.11], [0, 0.41, 0], { color: '#e3c565' })
      .cyl([0.22, 0.03, 0.115], [0, 0.31, 0], { color: 'red' })
      .cyl([0.26, 0.03, 0.125], [0, 0.24, 0], { color: 'red' })
      .done(),
  ),
  e('brownie (food)', 'food', 'desserts', () => {
    const b = plate(m('brownie (food)'), 0.16);
    b.box([0.075, 0.035, 0.075], [0, 0.034, 0], { color: 'chocolate', round: 0.15, rot: [0, 15, 0] })
      .box([0.075, 0.035, 0.075], [0.005, 0.07, 0], { color: 'chocolate', round: 0.15, rot: [0, -20, 0] })
      .box([0.07, 0.006, 0.07], [0.005, 0.088, 0], { color: '#4a2a18', rot: [0, -20, 0], noInk: true })
      .ball(0.012, [0.01, 0.092, 0.01], { color: 'tan' })
      .ball(0.01, [-0.015, 0.091, -0.01], { color: 'tan' });
    return b.done();
  }),
  e('brownie batter', 'food', 'baking', () =>
    bowl(m('brownie batter'), 0.22, 0.1, 'white', 'chocolate')
      .ball([0.07, 0.03, 0.07], [0.02, 0.1, 0.01], { color: 'chocolate' })
      .stick([0.03, 0.08, 0], [0.11, 0.21, -0.02], 0.016, 'red')
      .box([0.05, 0.06, 0.008], [0.015, 0.075, 0.003], { color: 'red', rot: [0, 0, 32], round: 0.4 })
      .done(),
  ),
  e('brush (cleaning)', 'home', 'cleaning', () => {
    const b = m('brush (cleaning)')
      .box([0.22, 0.04, 0.085], [0, 0.06, 0], { color: 'wood', round: 0.7 })
      .box([0.2, 0.04, 0.072], [0, 0.022, 0], { color: '#efe3b8', round: 0.1 });
    b.each(6, (i) => b.box([0.004, 0.035, 0.074], [-0.075 + i * 0.03, 0.022, 0.001], { color: '#c9b98a', noInk: true }));
    return path(b, arc(0, 0.075, 0.07, 0.06, 0, 180, 6), 0.02, 'darkwood').done();
  }),
  e('brushes', 'study', 'art supplies', () => {
    const b = m('brushes').cyl([0.1, 0.12, 0.1], [0, 0.06, 0], { color: 'glass' }).cyl([0.1, 0.05, 0.1], [0, 0.025, 0], { color: '#7fb7e0' });
    const tips = ['red', 'yellow', 'blue', 'black', 'green'];
    ([[-0.07, 0.01], [-0.03, -0.02], [0.0, 0.02], [0.035, -0.01], [0.07, 0.015]] as const).forEach(([dx, dz], i) => {
      const a: V = [dx * 0.3, 0.04, dz * 0.4], t: V = [dx, 0.24 + (i % 2) * 0.03, dz];
      const L = Math.hypot(t[0] - a[0], t[1] - a[1], t[2] - a[2]);
      const u: V = [(t[0] - a[0]) / L, (t[1] - a[1]) / L, (t[2] - a[2]) / L];
      const at = (k: number): V => [t[0] + u[0] * k, t[1] + u[1] * k, t[2] + u[2] * k];
      b.stick(a, t, 0.012, ['darkwood', 'red', 'wood', 'blue', 'black'][i]).stick(t, at(0.025), 0.013, 'silver').rod(at(0.025), at(0.055), 0.013, tips[i]);
    });
    return b.done();
  }),
  e('brussels sprout', 'food', 'vegetables', () => {
    const b = m('brussels sprout').ball([0.055, 0.055, 0.055], [0, 0.03, 0], { color: '#86b84f' }).cyl([0.018, 0.012, 0.018], [0, 0.006, 0], { color: '#e8eebf' });
    around(4, 0.017, 0.4).forEach(([x, z], i) => b.ball([0.045, 0.04, 0.02], [x, 0.026, z], { color: '#5f9a3a', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, i % 2 ? 8 : -8] }));
    return b.done();
  }),
  e('bubble', 'toys', 'bubbles', () =>
    m('bubble')
      .ball(0.1, [0, 0.12, 0], { color: '#d6eefc' })
      .torus([0.1, 0.1, 0.01], [0, 0.12, 0], { color: '#f4c6e0', rot: [70, 20, 0], tube: 0.08, noInk: true })
      .ball([0.026, 0.018, 0.01], [0.022, 0.148, 0.043], { color: 'white', noInk: true })
      .done(),
  ),
  e('bubble tea', 'food', 'drinks', () => {
    const b = m('bubble tea')
      .cyl([0.075, 0.13, 0.075], [0, 0.065, 0], { color: '#d9b38c', taper: 1.18 })
      .ball([0.092, 0.04, 0.092], [0, 0.13, 0], { color: 'glass' })
      .stick([0.008, 0.1, 0], [0.025, 0.23, 0], 0.013, 'pink');
    around(9, 0.036).forEach(([x, z]) => b.ball(0.016, [x, 0.012, z], { color: '#2a1d16' }));
    around(9, 0.038, 0.35).forEach(([x, z]) => b.ball(0.016, [x, 0.03, z], { color: '#2a1d16' }));
    return b.done();
  }),
  e('bubble wand', 'toys', 'bubbles', () =>
    m('bubble wand')
      .stick([0, 0, 0], [0, 0.17, 0], 0.012, 'pink')
      .torus([0.07, 0.07, 0.012], [0, 0.2, 0], { color: 'pink', tube: 0.15 })
      .cyl([0.06, 0.002, 0.06], [0, 0.2, 0], { color: '#e3f3fc', rot: [90, 0, 0], noInk: true })
      .ball(0.05, [0.06, 0.27, 0], { color: '#d6eefc' })
      .ball(0.026, [0.095, 0.325, 0], { color: '#e8d6fc' })
      .done(),
  ),
  e('bubbles', 'toys', 'bubbles', () => {
    const b = m('bubbles');
    ([[0.06, 0, 0.06, 0], [0.04, 0.055, 0.12, 0.01], [0.035, -0.045, 0.11, -0.01], [0.025, 0.02, 0.165, 0], [0.02, -0.025, 0.175, 0.01]] as const).forEach(([d, x, y, z], i) => {
      b.ball(d, [x, y, z], { color: i % 2 ? '#e8d6fc' : '#d6eefc' });
      if (d > 0.03) b.ball([d * 0.25, d * 0.18, d * 0.1], [x + d * 0.2, y + d * 0.25, z + d * 0.42], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('bucket', 'home', 'cleaning', () => {
    const b = m('bucket')
      .cyl([0.24, 0.26, 0.24], [0, 0.13, 0], { color: 'blue', taper: 1.2 })
      .torus([0.295, 0.295, 0.02], [0, 0.26, 0], { color: 'blue', rot: [90, 0, 0], tube: 0.1 });
    b.pair((s) => b.cyl([0.03, 0.02, 0.03], [s * 0.14, 0.235, 0], { color: 'navy', rot: [0, 0, 90] }));
    return path(b, arc(0, 0.235, 0.15, 0.15, 0, 180, 7), 0.01, 'silver').done();
  }),
  e('bucket hat', 'wardrobe', 'hats', () =>
    m('bucket hat')
      .cyl([0.3, 0.06, 0.3], [0, 0.03, 0], { color: '#c8b77a', taper: 0.62 })
      .cyl([0.19, 0.09, 0.19], [0, 0.105, 0], { color: '#c8b77a', taper: 0.86 })
      .ball([0.165, 0.035, 0.165], [0, 0.15, 0], { color: '#c8b77a' })
      .cyl([0.192, 0.022, 0.192], [0, 0.075, 0], { color: 'darkbrown' })
      .done(),
  ),
  e('buckle', 'wardrobe', 'belts', () => {
    const b = m('buckle').box([0.2, 0.04, 0.014], [0, 0.05, -0.004], { color: 'leather', round: 0.3 });
    b.box([0.08, 0.015, 0.016], [0, 0.092, 0.004], { color: 'gold' }).box([0.08, 0.015, 0.016], [0, 0.008, 0.004], { color: 'gold' });
    b.pair((s) => b.box([0.015, 0.099, 0.016], [s * 0.033, 0.05, 0.004], { color: 'gold' }));
    return b.box([0.045, 0.007, 0.007], [0.008, 0.05, 0.014], { color: 'silver' }).done();
  }),
  e('bug (spy)', 'tech', 'spy gadgets', () =>
    m('bug (spy)')
      .cyl([0.045, 0.012, 0.045], [0, 0.006, 0], { color: 'black' })
      .ball([0.028, 0.016, 0.028], [0, 0.013, 0], { color: 'darkgray' })
      .ball(0.007, [0.01, 0.02, 0.008], { color: 'red', glow: true })
      .stick([0.014, 0.012, -0.01], [0.022, 0.1, -0.01], 0.003, 'silver')
      .ball(0.007, [0.022, 0.1, -0.01], { color: 'black' })
      .done(),
  ),
  e('bug spray', 'home', 'household', () =>
    m('bug spray')
      .cyl([0.065, 0.17, 0.065], [0, 0.085, 0], { color: 'green' })
      .ball([0.065, 0.035, 0.065], [0, 0.17, 0], { color: 'green' })
      .cyl([0.03, 0.025, 0.03], [0, 0.19, 0], { color: 'white' })
      .cyl([0.008, 0.012, 0.008], [0, 0.2, 0.014], { color: 'white', rot: [90, 0, 0] })
      .label('BUG OFF', [0.05, 0.06], [0, 0.09, 0.034], { color: 'yellow' })
      .ball(0.012, [0.0, 0.205, 0.04], { color: 'white', noInk: true })
      .ball(0.016, [0.0, 0.21, 0.065], { color: 'white', noInk: true })
      .done(),
  ),
  e('bug zapper', 'garden', 'garden gear', () => {
    const b = m('bug zapper')
      .cyl([0.16, 0.04, 0.16], [0, 0.02, 0], { color: 'darkgray' })
      .cyl([0.08, 0.3, 0.08], [0, 0.19, 0], { color: 'violet', glow: true })
      .cyl([0.17, 0.04, 0.17], [0, 0.37, 0], { color: 'darkgray', taper: 0.6 })
      .torus([0.05, 0.05, 0.01], [0, 0.42, 0], { color: 'silver' });
    around(8, 0.07).forEach(([x, z]) => b.stick([x, 0.04, z], [x, 0.35, z], 0.006, 'silver'));
    b.each(3, (i) => b.torus([0.15, 0.15, 0.008], [0, 0.1 + i * 0.1, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.06 }));
    return b.done();
  }),
  e('bulb', 'home', 'lighting', () =>
    m('bulb')
      .ball(0.012, [0, 0.004, 0], { color: 'black' })
      .cyl([0.027, 0.032, 0.027], [0, 0.02, 0], { color: 'silver' })
      .torus([0.03, 0.03, 0.005], [0, 0.014, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 })
      .torus([0.03, 0.03, 0.005], [0, 0.026, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.028, 0.03, 0.028], [0, 0.048, 0], { color: '#fff2b0', taper: 1.7 })
      .ball([0.068, 0.07, 0.068], [0, 0.085, 0], { color: '#fff2b0' })
      .ball(0.014, [0, 0.08, 0], { color: 'orange', glow: true })
      .ball([0.016, 0.022, 0.008], [0.018, 0.1, 0.028], { color: 'white', noInk: true })
      .done(),
  ),
  e('bulldozer', 'garage', 'construction vehicles', () => {
    const b = m('bulldozer', { view: 'side' })
      .box([1.9, 0.9, 3.0], [0, 1.25, -0.1], { color: 'yellow', round: 0.2 })
      .box([1.6, 1.3, 1.4], [0, 2.35, -0.8], { color: 'yellow', round: 0.2 })
      .box([1.66, 0.75, 1.2], [0, 2.45, -0.8], { color: 'glass', round: 0.2 })
      .box([1.8, 0.12, 1.6], [0, 3.05, -0.8], { color: 'yellow', round: 0.3 })
      .cyl([0.15, 0.8, 0.15], [0.45, 2.1, 0.7], { color: 'darkgray' })
      .box([3.0, 1.3, 0.25], [0, 0.75, 2.35], { color: 'yellow', rot: [-10, 0, 0], round: 0.2 })
      .box([3.0, 0.12, 0.3], [0, 0.12, 2.42], { color: 'steel' })
      .rod([0, 1.0, -1.6], [0, 0.35, -2.1], 0.15, 'darkgray');
    b.pair((s) => {
      b.box([0.6, 0.9, 3.6], [s * 1.2, 0.45, 0], { color: 'rubber', round: 0.6 });
      b.rod([s * 1.1, 0.95, 0.9], [s * 1.25, 0.75, 2.25], 0.18, 'darkgray');
      for (const z of [-1.2, 0, 1.2]) b.cyl([0.55, 0.62, 0.55], [s * 1.2, 0.45, z], { color: 'yellow', rot: [0, 0, 90], name: s > 0 && z === 1.2 ? 'wheel' : undefined });
    });
    return b.done();
  }),
  e('bullet', 'armory', 'ammunition', () =>
    m('bullet')
      .cyl([0.029, 0.005, 0.029], [0, 0.0025, 0], { color: 'brass' })
      .cyl([0.026, 0.055, 0.026], [0, 0.03, 0], { color: 'brass' })
      .cyl([0.024, 0.032, 0.024], [0, 0.073, 0], { color: 'copper', taper: 0.45 })
      .ball(0.012, [0, 0.088, 0], { color: 'copper' })
      .done(),
  ),
  e('bullet proof vest', 'armory', 'armour', () => {
    const b = m('bullet proof vest')
      .box([0.48, 0.56, 0.26], [0, 0.32, 0], { color: 'navy', round: 0.4 })
      .ball([0.2, 0.1, 0.12], [0, 0.6, 0.08], { color: '#1f3460' })
      .label('POLICE', [0.3, 0.07], [0, 0.42, 0.135], { color: 'yellow' })
      .box([0.5, 0.06, 0.27], [0, 0.12, 0], { color: 'black', round: 0.3 });
    b.pair((s) => {
      b.box([0.12, 0.1, 0.24], [s * 0.15, 0.64, 0], { color: 'navy', round: 0.4 });
      b.box([0.12, 0.1, 0.04], [s * 0.12, 0.22, 0.13], { color: '#1f3460', round: 0.2 });
    });
    return b.done();
  }),
  e('bullet train', 'garage', 'trains', () => {
    const b = m('bullet train', { view: 'side' })
      .box([3.2, 3.0, 12], [0, 1.95, -2], { color: 'white', round: 0.5 })
      .ball([3.15, 2.6, 9], [0, 1.75, 4.2], { color: 'white' })
      .ball([1.9, 0.8, 2.4], [0, 2.65, 5.0], { color: 'navy' })
      .box([3.26, 0.35, 12], [0, 1.25, -2], { color: 'blue', noInk: true })
      .box([3.0, 0.5, 13], [0, 0.55, -1.5], { color: 'darkgray', round: 0.3 });
    b.each(6, (i) => b.box([3.26, 0.6, 1.1], [0, 2.4, 1.6 - i * 1.7], { color: 'glass', round: 0.3 }));
    return wheels(b, 1.2, [-6.5, -5, 1.5, 3], 0.8, 0.3, 'darkgray').done();
  }),
  e('bulletin board', 'study', 'office', () => {
    const b = m('bulletin board')
      .box([1.24, 0.84, 0.05], [0, 0.75, 0], { color: 'darkwood', round: 0.2 })
      .box([1.14, 0.74, 0.06], [0, 0.75, 0.004], { color: '#c89b62', round: 0.05 })
      .box([0.22, 0.27, 0.01], [-0.32, 0.86, 0.04], { color: 'white', rot: [0, 0, 5] })
      .box([0.16, 0.16, 0.01], [0.08, 0.92, 0.04], { color: 'yellow', rot: [0, 0, -6] })
      .box([0.16, 0.16, 0.01], [0.36, 0.62, 0.04], { color: 'pink', rot: [0, 0, 8] })
      .box([0.2, 0.15, 0.01], [-0.05, 0.56, 0.04], { color: 'skyblue', rot: [0, 0, -3] })
      .box([0.16, 0.2, 0.01], [0.36, 0.92, 0.04], { color: 'lime', rot: [0, 0, 4] });
    for (const [x, y, c] of [[-0.32, 0.98, 'red'], [0.08, 0.99, 'blue'], [0.36, 0.69, 'green'], [-0.05, 0.62, 'red'], [0.36, 1.01, 'yellow']] as const) b.ball(0.025, [x, y, 0.055], { color: c });
    b.pair((s) => b.stick([s * 0.5, 0.05, 0], [s * 0.5, 0.34, 0], 0.05, 'darkwood').box([0.14, 0.1, 0.45], [s * 0.5, 0.05, 0], { color: 'darkwood', round: 0.3 }));
    return b.done();
  }),
  e('bumper car', 'toys', 'fairground', () =>
    m('bumper car', { view: 'side' })
      .torus([1.5, 2.1, 0.28], [0, 0.26, 0], { color: 'rubber', rot: [90, 0, 0], tube: 0.16 })
      .box([1.3, 0.5, 1.9], [0, 0.42, 0], { color: 'red', round: 0.8 })
      .box([0.9, 0.6, 0.35], [0, 0.82, -0.45], { color: 'black', round: 0.5 })
      .box([0.85, 0.12, 0.6], [0, 0.7, -0.2], { color: 'black', round: 0.5 })
      .stick([0, 0.6, 0.45], [0, 0.85, 0.35], 0.05, 'darkgray')
      .torus([0.32, 0.32, 0.05], [0, 0.88, 0.33], { color: 'darkgray', rot: [60, 0, 0], tube: 0.18 })
      .stick([0, 0.6, -0.8], [0, 2.3, -0.8], 0.06, 'silver')
      .box([0.12, 0.12, 0.2], [0, 2.32, -0.8], { color: 'darkgray' })
      .label('7', [0.3, 0.3], [0, 0.48, 0.96], { color: 'yellow' })
      .ball([0.25, 0.15, 0.06], [0.4, 0.55, 0.93], { color: 'yellow', glow: true })
      .ball([0.25, 0.15, 0.06], [-0.4, 0.55, 0.93], { color: 'yellow', glow: true })
      .done(),
  ),
  e('bungalow', 'places', 'houses', () => {
    const b = m('bungalow')
      .box([6, 2.6, 4], [0, 1.3, 0], { color: 'cream', round: 0.03 })
      .wedge([4.6, 1.5, 6.6], [0, 3.35, 0], { color: 'darkred', rot: [0, 90, 0] })
      .box([0.5, 1.2, 0.5], [-1.8, 3.6, -0.6], { color: '#b5523b' })
      .box([2.4, 0.15, 1.4], [1.3, 0.075, 2.7], { color: 'wood' })
      .box([2.6, 0.12, 1.6], [1.3, 2.5, 2.75], { color: 'darkred' })
      .box([0.9, 1.9, 0.08], [1.3, 0.95, 2.03], { color: 'teal', name: 'door', pivot: [0.85, 0.95, 2.03] })
      .label('12', [0.4, 0.25], [2.1, 1.6, 2.05], { color: 'white' })
      .box([1.4, 0.9, 0.06], [-1.5, 1.5, 2.02], { color: 'glass' })
      .box([1.6, 0.12, 0.12], [-1.5, 1.0, 2.06], { color: 'white' });
    b.pair((s) => b.stick([1.3 + s * 1.1, 0.15, 3.35], [1.3 + s * 1.1, 2.45, 3.35], 0.12, 'white'));
    return b.done();
  }),
  e('bungee cord', 'workshop', 'hardware', () => {
    const b = m('bungee cord');
    path(b, arc(0, 0.13, 0.12, 0.11, 180, 360, 7), 0.016, 'orange');
    b.pair((s) => {
      b.cyl([0.026, 0.035, 0.026], [s * 0.12, 0.15, 0], { color: 'black' });
      path(b, [[s * 0.12, 0.165, 0], [s * 0.12, 0.2, 0], ...arc(s * 0.1, 0.2, 0.02, 0.02, s > 0 ? 0 : 180, s > 0 ? 180 : 0, 3), [s * 0.08, 0.18, 0]], 0.008, 'silver');
      b.ball(0.012, [s * 0.08, 0.178, 0], { color: 'red' });
    });
    return b.done();
  }),
  e('bunk bed', 'home', 'beds', () => {
    const b = m('bunk bed');
    for (const x of [-0.98, 0.98]) for (const z of [-0.45, 0.45]) b.box([0.07, 1.8, 0.07], [x, 0.9, z], { color: 'wood' });
    for (const [y, c] of [[0.3, 'navy'], [1.2, 'red']] as const) {
      b.box([2.0, 0.12, 0.96], [0, y, 0], { color: 'wood' })
        .box([1.9, 0.16, 0.88], [0, y + 0.13, 0], { color: c, round: 0.4 })
        .box([0.4, 0.1, 0.6], [-0.7, y + 0.25, 0], { color: 'white', round: 0.6 });
    }
    b.stick([-0.98, 1.6, 0.45], [0.4, 1.6, 0.45], 0.05, 'wood');
    b.pair((s) => b.stick([0.55 + s * 0.15, 0.35, 0.5], [0.55 + s * 0.15, 1.6, 0.5], 0.05, 'wood'));
    b.each(4, (i) => b.stick([0.4, 0.55 + i * 0.27, 0.5], [0.7, 0.55 + i * 0.27, 0.5], 0.04, 'wood'));
    return b.done();
  }),
  e('bunker', 'sports', 'golf', () =>
    m('bunker')
      .cyl([3.2, 0.25, 2.6], [0, 0.125, 0], { color: 'grass' })
      .ball([2.2, 0.12, 1.6], [-0.3, 0.25, 0.2], { color: 'sand' })
      .ball(0.06, [-0.1, 0.32, 0.4], { color: 'white' })
      .stick([1.0, 0.2, -0.6], [1.0, 2.2, -0.6], 0.04, 'white')
      .wedge([0.5, 0.35, 0.02], [1.25, 2.0, -0.6], { color: 'red', rot: [0, 0, -90] })
      .stick([0.4, 0.3, 0.7], [1.2, 0.5, 0.9], 0.04, 'wood')
      .box([0.08, 0.05, 0.5], [0.38, 0.3, 0.68], { color: 'darkgray', rot: [0, 15, 0] })
      .done(),
  ),
  e('bunny ears', 'wardrobe', 'costume', () => {
    const b = m('bunny ears');
    path(b, arc(0, 0.01, 0.09, 0.1, 10, 170, 6), 0.014, 'pink');
    b.pair((s) => b.ball([0.05, 0.17, 0.03], [s * 0.036, 0.18, 0], { color: 'white', rot: [0, 0, s * -10] }).ball([0.026, 0.12, 0.01], [s * 0.036, 0.18, 0.014], { color: 'pink', rot: [0, 0, s * -10], noInk: true }));
    return b.done();
  }),
  e('buoy', 'sea', 'seaside things', () =>
    m('buoy')
      .cyl([1.8, 0.05, 1.8], [0, 0.025, 0], { color: 'water' })
      .cyl([1.2, 0.6, 1.2], [0, 0.3, 0], { color: 'red' })
      .cyl([1.22, 0.16, 1.22], [0, 0.35, 0], { color: 'white' })
      .cyl([0.8, 1.0, 0.8], [0, 1.1, 0], { color: 'red', taper: 0.4 })
      .cyl([0.3, 0.15, 0.3], [0, 1.67, 0], { color: 'darkgray' })
      .ball(0.22, [0, 1.85, 0], { color: 'yellow', glow: true })
      .label('4', [0.3, 0.3], [0, 1.05, 0.33], { color: 'white' })
      .done(),
  ),
  e('burrito', 'food', 'mexican food', () => {
    const P = diag(-0.035, 0.0, 70);
    const b = m('burrito')
      .stick(P(0.03), P(0.19), 0.075, '#ead19a')
      .stick(P(0.0), P(0.1), 0.085, 'silver')
      .ball([0.06, 0.02, 0.06], P(0.19), { color: 'white', rot: [0, 0, -20] });
    for (const [o, z, c] of [[-0.018, 0.01, 'darkbrown'], [0.015, -0.01, 'lettuce'], [0.0, 0.02, 'tomato'], [0.02, 0.015, 'cheese']] as const) b.ball(0.022, P(0.195, o, z), { color: c });
    return b.done();
  }),
  e('bus', 'garage', 'buses', () => {
    const b = m('bus', { view: 'side' })
      .box([2.5, 2.5, 11], [0, 1.75, 0], { color: 'red', round: 0.2 })
      .box([2.56, 0.9, 9.6], [0, 2.3, -0.4], { color: 'glass', round: 0.2 })
      .box([2.3, 1.3, 0.1], [0, 2.2, 5.5], { color: 'glass', round: 0.2 })
      .label('CITY', [1.4, 0.3], [0, 2.85, 5.53], { color: 'black' })
      .box([2.56, 0.15, 11], [0, 1.1, 0], { color: 'white', noInk: true })
      .box([0.06, 1.8, 1.0], [1.27, 1.45, 3.9], { color: 'glass' })
      .ball([0.3, 0.2, 0.06], [0.8, 1.0, 5.5], { color: 'yellow', glow: true })
      .ball([0.3, 0.2, 0.06], [-0.8, 1.0, 5.5], { color: 'yellow', glow: true });
    b.each(5, (i) => b.box([2.6, 0.9, 0.12], [0, 2.3, -4.0 + i * 1.8], { color: 'red', noInk: true }));
    return wheels(b, 1.1, [3.6, -3.4], 1.0).done();
  }),
  e('bus station', 'places', 'transport', () => {
    const b = shop('bus station', { w: 8, h: 3.5, d: 4, wall: 'lightgray', sign: 'BUS STATION', roof: 'blue', signColor: 'yellow' })
      .box([8, 0.15, 2.4], [0, 3.0, 3.2], { color: 'blue', round: 0.3 })
      .stick([3.6, 0.2, 5.2], [3.6, 2.6, 5.2], 0.08, 'silver')
      .label('BUS', [0.6, 0.6], [3.6, 2.6, 5.25], { color: 'blue' });
    b.each(3, (i) => b.stick([-3.6 + i * 3.6, 0, 4.2], [-3.6 + i * 3.6, 2.95, 4.2], 0.15, 'silver'));
    return b.done();
  }),
  e('business card', 'study', 'office', () => {
    const b = m('business card')
      .box([0.1, 0.022, 0.05], [0, 0.011, 0], { color: 'black', round: 0.3 })
      .box([0.09, 0.052, 0.004], [0, 0.046, 0.0], { color: 'white', rot: [-12, 0, 0], round: 0.1 })
      .ball([0.014, 0.014, 0.004], [-0.03, 0.058, 0.006], { color: 'blue' });
    b.each(3, (i) => b.box([i ? 0.045 : 0.05, 0.004, 0.002], [0.012 - (i ? 0.004 : 0), 0.06 - i * 0.012, 0.006 + i * 0.0025], { color: i ? 'gray' : 'navy', rot: [-12, 0, 0], noInk: true }));
    return b.done();
  }),
  e('business park', 'places', 'offices', () => {
    const b = m('business park')
      .cyl([10, 0.1, 7], [0, 0.05, 0], { color: 'grass' })
      .box([3, 7, 3], [-2.6, 3.6, -1.2], { color: 'skyblue', round: 0.03 })
      .box([3, 5, 3], [1.0, 2.6, -1.8], { color: 'lightgray', round: 0.03 })
      .box([3.6, 2.5, 2.4], [2.4, 1.35, 1.6], { color: 'white', round: 0.03 })
      .box([2.4, 0.9, 0.5], [-2.0, 0.55, 2.6], { color: 'stone', round: 0.2 })
      .label('BUSINESS PARK', [2.2, 0.5], [-2.0, 0.6, 2.87], { color: 'navy' });
    b.each(6, (i) => b.box([2.9, 0.08, 0.05], [-2.6, 1.2 + i * 1.0, 0.31], { color: 'navy', noInk: true }));
    b.each(4, (i) => b.box([2.9, 0.5, 0.05], [1.0, 1.0 + i * 1.1, -0.28], { color: 'glass' }));
    b.box([3.4, 0.8, 0.05], [2.4, 1.6, 2.81], { color: 'glass' });
    tree(b, 4.2, -1.5, 3, 'leaf');
    tree(b, -4.4, 1.5, 2.6, 'darkgreen');
    return b.done();
  }),
  e('bust', 'home', 'art', () => {
    const mb = '#ebe7df';
    return m('bust')
      .box([0.24, 0.04, 0.24], [0, 0.02, 0], { color: 'darkgray' })
      .cyl([0.18, 0.2, 0.18], [0, 0.14, 0], { color: 'darkgray' })
      .box([0.24, 0.04, 0.24], [0, 0.26, 0], { color: 'darkgray' })
      .ball([0.34, 0.16, 0.18], [0, 0.34, 0], { color: mb })
      .cyl([0.08, 0.1, 0.08], [0, 0.44, 0], { color: mb })
      .ball([0.16, 0.2, 0.18], [0, 0.53, 0.01], { color: mb })
      .ball([0.17, 0.12, 0.18], [0, 0.6, -0.01], { color: '#dcd6ca' })
      .ball([0.03, 0.04, 0.04], [0, 0.53, 0.1], { color: mb })
      .done();
  }),
  e('butcher shop', 'places', 'shops', () => {
    const b = shop('butcher shop', { w: 4, h: 3, d: 3, wall: 'white', sign: 'BUTCHER', awning: ['red', 'white'], roof: 'darkred' });
    return b.ball([0.9, 0.6, 0.4], [-0.3, 3.55, 0], { color: 'meat' }).rod([0.1, 3.55, 0], [0.75, 3.55, 0], 0.12, 'white').ball(0.2, [0.8, 3.55, 0], { color: 'white' }).done();
  }),
  e('butter', 'food', 'dairy', () =>
    plate(m('butter'), 0.18)
      .box([0.12, 0.045, 0.06], [0, 0.034, 0], { color: '#f7dc6f', round: 0.15 })
      .box([0.065, 0.05, 0.066], [0.035, 0.036, 0], { color: 'white', round: 0.1 })
      .label('BUTTER', [0.05, 0.02], [0.035, 0.036, 0.034], { color: 'white' })
      .ball([0.03, 0.02, 0.02], [-0.035, 0.065, 0], { color: '#f7dc6f' })
      .done(),
  ),
  e('butter dish', 'kitchen', 'tableware', () =>
    m('butter dish')
      .box([0.22, 0.015, 0.13], [0, 0.0075, 0], { color: 'white', round: 0.3 })
      .box([0.13, 0.04, 0.05], [0, 0.035, 0.01], { color: '#f7dc6f', round: 0.15 })
      .box([0.18, 0.06, 0.09], [0, 0.06, -0.025], { color: 'white', round: 0.4, name: 'lid', pivot: [0, 0.02, -0.07], rot: [-40, 0, 0] })
      .ball(0.025, [0, 0.105, -0.03], { color: 'skyblue', parent: 'lid' })
      .done(),
  ),
  e('buttercup', 'garden', 'flowers', () => {
    const b = m('buttercup')
      .rod([0, 0, 0], [0.01, 0.25, 0], 0.008, 'green')
      .ball([0.05, 0.02, 0.03], [-0.03, 0.08, 0], { color: 'leaf', rot: [0, 0, 30] })
      .cyl([0.05, 0.03, 0.05], [0.01, 0.265, 0.005], { color: 'yellow', taper: 1.6, name: 'head', pivot: [0.01, 0.25, 0], rot: [20, 0, 0] })
      .ball(0.024, [0.01, 0.285, 0.012], { color: 'gold', parent: 'head' });
    around(5, 0.032).forEach(([x, z]) => b.ball([0.04, 0.012, 0.04], [0.01 + x, 0.282 + z * 0.3, 0.008 + z], { color: 'yellow', parent: 'head', rot: [20, 0, 0] }));
    return b.done();
  }),
  e('butterfly net', 'sports', 'outdoor gear', () =>
    m('butterfly net')
      .stick([-0.35, 0, 0], [0.0, 0.66, 0], 0.025, 'wood')
      .torus([0.3, 0.3, 0.02], [0.15, 0.68, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.1 })
      .cone([0.28, 0.36, 0.28], [0.15, 0.5, 0], { color: '#f2f2f2', rot: [180, 0, 0] })
      .done(),
  ),
  e('butterfly wings', 'bugs', 'bug parts', () => {
    const b = m('butterfly wings').capsule([0.02, 0.08, 0.02], [0, 0.055, 0.004], { color: 'black' });
    b.pair((s) => {
      b.ball([0.075, 0.065, 0.016], [s * 0.04, 0.072, 0], { color: 'black', rot: [0, 0, s * -25] })
        .ball([0.065, 0.055, 0.016], [s * 0.04, 0.072, 0.003], { color: 'orange', rot: [0, 0, s * -25] })
        .ball([0.055, 0.048, 0.016], [s * 0.03, 0.03, 0], { color: 'black', rot: [0, 0, s * 25] })
        .ball([0.046, 0.04, 0.016], [s * 0.03, 0.03, 0.003], { color: 'orange', rot: [0, 0, s * 25] })
        .ball(0.01, [s * 0.065, 0.09, 0.009], { color: 'white', noInk: true })
        .ball(0.008, [s * 0.045, 0.02, 0.009], { color: 'white', noInk: true })
        .rod([s * 0.003, 0.09, 0.004], [s * 0.02, 0.12, 0.004], 0.003, 'black');
    });
    return b.done();
  }),
  e('buttermilk', 'food', 'dairy', () => carton('buttermilk', 0.2, 0.07, 'white', 'BUTTERMILK', 'skyblue').box([0.072, 0.03, 0.072], [0, 0.03, 0], { color: 'skyblue', round: 0.06 }).done()),
  e('butterscotch pudding', 'food', 'desserts', () =>
    drink(m('butterscotch pudding'), 0.09, 0.08, '#d9962e', 0.8)
      .ball([0.06, 0.03, 0.06], [0, 0.08, 0], { color: '#e4a83f' })
      .ball([0.04, 0.03, 0.04], [0, 0.1, 0], { color: 'white' })
      .cone([0.025, 0.025, 0.025], [0, 0.123, 0], { color: 'white' })
      .done(),
  ),
  e('button (clothes)', 'wardrobe', 'sewing', () => {
    const b = m('button (clothes)')
      .cyl([0.05, 0.01, 0.05], [0, 0.026, 0], { color: 'red', rot: [90, 0, 0] })
      .torus([0.05, 0.05, 0.012], [0, 0.026, 0.001], { color: 'darkred', tube: 0.16 })
      .stick([-0.008, 0.018, 0.006], [0.008, 0.034, 0.006], 0.003, 'white', { noInk: true })
      .stick([-0.008, 0.034, 0.006], [0.008, 0.018, 0.006], 0.003, 'white', { noInk: true });
    for (const [x, y] of [[-0.008, 0.018], [0.008, 0.018], [-0.008, 0.034], [0.008, 0.034]]) b.cyl([0.006, 0.004, 0.006], [x, y, 0.005], { color: 'darkred', rot: [90, 0, 0] });
    return b.done();
  }),
  e('button (mechanical)', 'tech', 'controls', () =>
    m('button (mechanical)')
      .box([0.09, 0.04, 0.09], [0, 0.02, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.07, 0.015, 0.07], [0, 0.047, 0], { color: 'yellow' })
      .ball([0.055, 0.04, 0.055], [0, 0.06, 0], { color: 'red' })
      .ball([0.015, 0.008, 0.008], [0.012, 0.075, 0.012], { color: 'white', noInk: true })
      .done(),
  ),
  e('cab', 'garage', 'cars', () => {
    const b = m('cab', { view: 'side' })
      .box([1.75, 0.6, 4.4], [0, 0.62, 0], { color: 'yellow', round: 0.5 })
      .box([1.55, 0.5, 2.2], [0, 1.12, -0.2], { color: 'yellow', round: 0.5 })
      .box([1.57, 0.36, 1.8], [0, 1.14, -0.2], { color: 'glass', round: 0.4 })
      .box([0.6, 0.18, 0.3], [0, 1.45, -0.1], { color: 'yellow', round: 0.3 })
      .label('TAXI', [0.55, 0.15], [0, 1.45, 0.06], { color: 'yellow' })
      .ball([0.25, 0.15, 0.06], [0.55, 0.68, 2.2], { color: 'white', glow: true })
      .ball([0.25, 0.15, 0.06], [-0.55, 0.68, 2.2], { color: 'white', glow: true });
    b.each(10, (i) => b.box([1.78, 0.08, 0.2], [0, 0.82 + (i % 2) * 0.08, -1.8 + i * 0.4], { color: 'black', noInk: true }));
    return wheels(b, 0.82, [1.4, -1.4], 0.64, 0.24).done();
  }),
  e('cable car', 'garage', 'cable cars', () =>
    m('cable car', { view: 'side' })
      .box([1.8, 1.9, 2.6], [0, 1.25, 0], { color: 'red', round: 0.3 })
      .box([1.85, 0.8, 2.4], [0, 1.55, 0], { color: 'glass', round: 0.2 })
      .box([1.9, 0.14, 2.7], [0, 2.22, 0], { color: 'darkred', round: 0.3 })
      .stick([0, 2.25, 0], [0, 2.95, 0], 0.14, 'darkgray')
      .box([0.4, 0.3, 1.0], [0, 3.05, 0], { color: 'darkgray', round: 0.3 })
      .stick([0, 3.22, -2.6], [0, 3.22, 2.6], 0.05, 'black')
      .done(),
  ),
  e('caboose', 'garage', 'trains', () => {
    const b = m('caboose', { view: 'side' })
      .box([2.6, 2.3, 6.4], [0, 2.0, 0], { color: 'red', round: 0.1 })
      .box([2.8, 0.15, 6.6], [0, 3.2, 0], { color: 'darkred', round: 0.3 })
      .box([2.0, 0.9, 2.2], [0, 3.7, 0], { color: 'red', round: 0.1 })
      .box([2.2, 0.12, 2.4], [0, 4.2, 0], { color: 'darkred', round: 0.3 })
      .box([2.06, 0.4, 1.6], [0, 3.75, 0], { color: 'glass' })
      .stick([0.6, 3.2, 2.4], [0.6, 3.8, 2.4], 0.15, 'black')
      .box([2.6, 0.3, 7.6], [0, 0.9, 0], { color: 'darkgray', round: 0.2 });
    b.pair((s) => {
      b.box([2.62, 0.7, 0.8], [0, 2.3, s * 1.8], { color: 'glass' });
      b.stick([0, 1.05, s * 3.75], [0, 1.9, s * 3.75], 0.06, 'yellow').stick([-1.2, 1.9, s * 3.75], [1.2, 1.9, s * 3.75], 0.06, 'yellow');
      b.stick([1.2, 1.05, s * 3.75], [1.2, 1.9, s * 3.75], 0.06, 'yellow').stick([-1.2, 1.05, s * 3.75], [-1.2, 1.9, s * 3.75], 0.06, 'yellow');
    });
    return wheels(b, 1.0, [2.8, 1.9, -1.9, -2.8], 0.8, 0.25, 'iron').done();
  }),
  e('cactus', 'garden', 'cacti', () => {
    const b = m('cactus')
      .ball([0.6, 0.12, 0.5], [0, 0.0, 0], { color: 'sand' })
      .capsule([0.26, 1.0, 0.26], [0, 0.5, 0], { color: 'green' });
    path(b, [[-0.1, 0.42, 0], [-0.3, 0.42, 0], [-0.3, 0.72, 0]], 0.15, 'green');
    path(b, [[0.1, 0.58, 0], [0.27, 0.58, 0], [0.27, 0.85, 0]], 0.14, 'green');
    b.each(3, (i) => b.box([0.012, 0.85, 0.012], [-0.07 + i * 0.07, 0.5, 0.128], { color: 'darkgreen', noInk: true }));
    return b.ball([0.1, 0.06, 0.1], [0, 1.0, 0], { color: 'pink' }).done();
  }),
  e('cafeteria', 'places', 'food places', () =>
    shop('cafeteria', { w: 5, h: 3, d: 3.5, wall: 'cream', sign: 'CAFETERIA', roof: 'teal', awning: ['teal', 'white'] })
      .stick([-0.3, 3.1, 0], [0.3, 4.3, 0], 0.12, 'silver')
      .stick([0.3, 3.1, 0], [-0.3, 4.3, 0], 0.12, 'silver')
      .ball([0.3, 0.42, 0.12], [-0.33, 4.35, 0], { color: 'silver' })
      .box([0.3, 0.4, 0.1], [0.33, 4.35, 0], { color: 'silver' })
      .done(),
  ),
  e('cage (container)', 'pets', 'pet gear', () => {
    const b = m('cage (container)')
      .cyl([0.52, 0.08, 0.52], [0, 0.04, 0], { color: 'gold' })
      .torus([0.48, 0.48, 0.02], [0, 0.7, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.06 })
      .torus([0.08, 0.08, 0.015], [0, 0.98, 0], { color: 'gold', tube: 0.2 })
      .stick([-0.22, 0.35, 0], [0.22, 0.35, 0], 0.015, 'wood')
      .ball([0.09, 0.08, 0.07], [0, 0.4, 0], { color: 'yellow' })
      .ball(0.06, [0.04, 0.46, 0.01], { color: 'yellow' })
      .cone([0.02, 0.03, 0.02], [0.08, 0.46, 0.01], { color: 'orange', rot: [0, 0, -90] });
    around(10, 0.23).forEach(([x, z]) => b.stick([x, 0.08, z], [x, 0.7, z], 0.01, 'gold'));
    for (let k = 0; k < 4; k++) {
      const th = (k / 4) * Math.PI;
      const pts = arc(0, 0.7, 0.23, 0.25, 0, 180, 6).map(([x, y]) => [x * Math.cos(th), y, x * Math.sin(th)] as V);
      path(b, pts, 0.01, 'gold');
    }
    return b.done();
  }),
  e('cake', 'food', 'desserts', () => {
    const b = plate(m('cake'), 0.3)
      .cyl([0.22, 0.05, 0.22], [0, 0.043, 0], { color: 'pink' })
      .cyl([0.222, 0.012, 0.222], [0, 0.074, 0], { color: 'cream' })
      .cyl([0.22, 0.04, 0.22], [0, 0.1, 0], { color: 'pink' })
      .cyl([0.225, 0.014, 0.225], [0, 0.126, 0], { color: 'white' });
    around(8, 0.1).forEach(([x, z]) => b.ball(0.02, [x, 0.135, z], { color: 'white' }));
    for (const [x, z, c] of [[-0.04, 0, 'skyblue'], [0.0, 0.03, 'yellow'], [0.04, -0.01, 'lime']] as const)
      b.cyl([0.012, 0.06, 0.012], [x, 0.163, z], { color: c }).ball([0.014, 0.024, 0.014], [x, 0.205, z], { color: 'flame', glow: true });
    return b.done();
  }),
  e('cake mix', 'food', 'baking', () =>
    pack('cake mix', [0.19, 0.25, 0.06], 'red', 'CAKE MIX')
      .cyl([0.1, 0.05, 0.01], [0, 0.07, 0.031], { color: 'pink', rot: [90, 0, 0], segs: 4 })
      .ball([0.1, 0.03, 0.01], [0, 0.1, 0.033], { color: 'white', noInk: true })
      .ball(0.02, [0, 0.12, 0.034], { color: 'red', noInk: true })
      .done(),
  ),
  e('cake stand', 'kitchen', 'tableware', () =>
    m('cake stand')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'white', taper: 0.7 })
      .cyl([0.04, 0.12, 0.04], [0, 0.08, 0], { color: 'white' })
      .ball(0.05, [0, 0.08, 0], { color: 'white' })
      .cyl([0.3, 0.015, 0.3], [0, 0.145, 0], { color: 'white' })
      .cyl([0.27, 0.08, 0.27], [0, 0.195, 0], { color: 'glass', name: 'lid', pivot: [0, 0.155, -0.135] })
      .ball([0.27, 0.18, 0.27], [0, 0.235, 0], { color: 'glass', parent: 'lid' })
      .ball(0.035, [0, 0.33, 0], { color: 'glass', parent: 'lid' })
      .done(),
  ),
  e('calamari', 'food', 'seafood', () => {
    const b = plate(m('calamari'), 0.22).cyl([0.05, 0.03, 0.05], [0.07, 0.032, -0.04], { color: 'white' }).cyl([0.045, 0.01, 0.045], [0.07, 0.045, -0.04], { color: 'red' });
    for (const [x, y, z, r] of [[-0.05, 0.03, 0.02, [70, 0, 10]], [-0.01, 0.03, 0.04, [80, 30, 0]], [0.03, 0.03, 0.04, [60, -20, 0]], [-0.04, 0.05, -0.02, [30, 10, 20]], [0.0, 0.05, 0.0, [50, 60, 0]], [-0.02, 0.07, 0.02, [20, 0, 40]]] as const)
      b.torus([0.05, 0.05, 0.018], [x, y, z], { color: 'honey', rot: r as V, tube: 0.32 });
    return b.wedge([0.04, 0.03, 0.03], [0.07, 0.03, 0.05], { color: 'yellow', rot: [0, 30, 0] }).done();
  }),
  e('calculator (electronics)', 'study', 'office supplies', () => {
    const b = m('calculator (electronics)')
      .box([0.09, 0.15, 0.025], [0, 0.075, 0], { color: 'darkgray', round: 0.3 })
      .box([0.074, 0.03, 0.006], [0, 0.125, 0.012], { color: '#b8c9a0' })
      .box([0.07, 0.04, 0.03], [0, 0.02, -0.02], { color: 'darkgray', round: 0.3 });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) b.box([0.015, 0.012, 0.008], [-0.027 + c * 0.018, 0.09 - r * 0.017, 0.013], { color: c === 3 ? 'orange' : r === 0 ? 'red' : 'lightgray', round: 0.4 });
    return b.done();
  }),
  e('calendar', 'study', 'office', () => {
    const b = m('calendar')
      .box([0.26, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3 })
      .box([0.24, 0.29, 0.01], [0, 0.175, 0], { color: 'white' })
      .box([0.24, 0.07, 0.015], [0, 0.29, 0.003], { color: 'red' })
      .label('NOV', [0.12, 0.05], [0, 0.29, 0.012], { color: 'red' })
      .torus([0.06, 0.06, 0.012], [0, 0.18, 0.012], { color: 'red', tube: 0.12, noInk: true });
    b.each(5, (i) => b.torus([0.02, 0.02, 0.004], [-0.08 + i * 0.04, 0.33, 0.004], { color: 'silver', tube: 0.2 }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) b.box([0.034, 0.03, 0.004], [-0.084 + c * 0.042, 0.22 - r * 0.042, 0.006], { color: 'lightgray', noInk: true });
    return b.done();
  }),
  e('calzone', 'food', 'italian food', () => {
    const b = plate(m('calzone'), 0.3).ball([0.24, 0.075, 0.14], [0, 0.05, 0], { color: 'bread' });
    b.each(7, (i) => {
      const x = -0.1 + i * (0.2 / 6);
      b.ball(0.02, [x, 0.03, 0.062 * Math.sqrt(Math.max(0, 1 - (x / 0.12) ** 2))], { color: 'crust' });
    });
    return b.ball([0.025, 0.006, 0.02], [0.03, 0.087, 0.0], { color: 'tomato', noInk: true }).ball([0.03, 0.006, 0.015], [-0.03, 0.086, 0.01], { color: 'leaf', noInk: true }).done();
  }),
  e('camcorder', 'tech', 'cameras', () =>
    m('camcorder')
      .box([0.07, 0.075, 0.14], [0, 0.0375, 0], { color: 'darkgray', round: 0.3 })
      .cyl([0.055, 0.04, 0.055], [0, 0.045, 0.085], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.04, 0.005, 0.04], [0, 0.045, 0.106], { color: 'navy', rot: [90, 0, 0] })
      .box([0.008, 0.05, 0.07], [-0.042, 0.045, 0.0], { color: 'black', round: 0.2 })
      .box([0.003, 0.04, 0.06], [-0.047, 0.045, 0.0], { color: 'skyblue', glow: true })
      .cyl([0.025, 0.04, 0.025], [0, 0.088, -0.05], { color: 'black', rot: [90, 0, 0] })
      .box([0.015, 0.05, 0.1], [0.04, 0.04, 0.0], { color: 'black', round: 0.5 })
      .ball(0.008, [0.02, 0.07, 0.06], { color: 'red', glow: true })
      .done(),
  ),
  e('camera', 'tech', 'cameras', () =>
    m('camera')
      .box([0.13, 0.075, 0.05], [0, 0.0375, 0], { color: 'black', round: 0.25 })
      .box([0.13, 0.016, 0.05], [0, 0.07, 0], { color: 'silver', round: 0.3 })
      .box([0.05, 0.03, 0.04], [0, 0.088, 0], { color: 'black', round: 0.2 })
      .cyl([0.06, 0.04, 0.06], [0, 0.038, 0.045], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.045, 0.004, 0.045], [0, 0.038, 0.066], { color: 'navy', rot: [90, 0, 0] })
      .ball([0.012, 0.012, 0.004], [0.008, 0.045, 0.068], { color: 'white', noInk: true })
      .cyl([0.015, 0.01, 0.015], [0.045, 0.082, 0], { color: 'red' })
      .box([0.025, 0.015, 0.012], [-0.045, 0.06, 0.026], { color: 'white', glow: true })
      .done(),
  ),
  e('camp ground', 'places', 'outdoor places', () => {
    const b = m('camp ground')
      .cyl([8, 0.12, 6], [0, 0.06, 0], { color: 'grass' })
      .wedge([1.8, 1.4, 2.2], [-1.8, 0.82, 0.3], { color: 'orange' })
      .wedge([0.6, 0.8, 0.05], [-1.8, 0.52, 1.42], { color: 'darkbrown' })
      .wedge([1.6, 1.2, 2.0], [1.7, 0.72, -0.8], { color: 'blue' })
      .wedge([0.5, 0.7, 0.05], [1.7, 0.47, 0.22], { color: 'navy' })
      .stick([3.0, 0.1, 2.0], [3.0, 1.3, 2.0], 0.08, 'darkwood')
      .label('CAMP', [0.9, 0.4], [3.0, 1.3, 2.05], { color: 'wood' });
    fire(b, 0.3, 1.6, 0.6);
    pine(b, -3.2, -1.8, 4);
    pine(b, 3.3, -1.6, 3.4);
    pine(b, -0.2, -2.3, 3.0, 'green');
    return b.done();
  }),
  e('campfire', 'nature', 'fire', () => fire(m('campfire'), 0, 0, 1.05).done()),
  e('can', 'food', 'cans', () =>
    m('can')
      .cyl([0.075, 0.11, 0.075], [0, 0.055, 0], { color: 'silver' })
      .cyl([0.077, 0.075, 0.077], [0, 0.055, 0], { color: 'red' })
      .torus([0.075, 0.075, 0.006], [0, 0.11, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.1 })
      .label('SOUP', [0.05, 0.03], [0, 0.06, 0.039], { color: 'white' })
      .done(),
  ),
  e('can of worms', 'bugs', 'worms', () => {
    const b = m('can of worms')
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: 'silver' })
      .cyl([0.082, 0.06, 0.082], [0, 0.05, 0], { color: 'green' })
      .cyl([0.074, 0.004, 0.074], [0, 0.099, 0], { color: 'dirt' })
      .cyl([0.078, 0.004, 0.078], [0, 0.137, -0.027], { color: 'silver', rot: [-70, 0, 0] });
    const worms: V[][] = [
      [[-0.02, 0.1, 0.01], [-0.03, 0.14, 0.02], [-0.055, 0.16, 0.03], [-0.07, 0.14, 0.035]],
      [[0.015, 0.1, 0.0], [0.02, 0.15, 0.01], [0.04, 0.17, 0.0], [0.055, 0.155, 0.01]],
      [[0.0, 0.1, 0.02], [0.0, 0.13, 0.045], [0.01, 0.12, 0.065], [0.02, 0.08, 0.06]],
      [[0.025, 0.1, -0.01], [0.03, 0.13, -0.005]],
    ];
    for (const w of worms) path(b, w, 0.012, '#e8919c');
    return b.done();
  }),
  e('can opener', 'kitchen', 'utensils', () =>
    m('can opener')
      .rod([-0.012, 0.15, 0], [-0.035, 0.012, 0], 0.024, 'red')
      .rod([0.012, 0.15, 0], [0.035, 0.012, 0], 0.024, 'red')
      .box([0.06, 0.05, 0.03], [0, 0.17, 0], { color: 'silver', round: 0.3 })
      .cyl([0.035, 0.008, 0.035], [0, 0.17, 0.02], { color: 'steel', rot: [90, 0, 0] })
      .stick([0.03, 0.18, 0], [0.065, 0.18, 0], 0.01, 'silver')
      .box([0.016, 0.05, 0.014], [0.072, 0.18, 0], { color: 'red', round: 0.4 })
      .done(),
  ),
  e('canadian bacon', 'food', 'meat', () => {
    const b = plate(m('canadian bacon'), 0.2);
    b.each(3, (i) =>
      b.cyl([0.1, 0.016, 0.1], [-0.03 + i * 0.03, 0.022 + i * 0.016, 0.02 - i * 0.02], { color: '#c96a5a', rot: [-6, 0, 0] })
        .cyl([0.088, 0.018, 0.088], [-0.03 + i * 0.03, 0.024 + i * 0.016, 0.02 - i * 0.02], { color: '#ee9a88', rot: [-6, 0, 0] }),
    );
    return b.done();
  }),
  e('candle', 'home', 'lighting', () =>
    m('candle')
      .cyl([0.065, 0.15, 0.065], [0, 0.075, 0], { color: 'cream' })
      .ball([0.016, 0.035, 0.016], [0.028, 0.135, 0.015], { color: 'cream' })
      .ball([0.013, 0.025, 0.013], [-0.022, 0.14, 0.022], { color: 'cream' })
      .stick([0, 0.15, 0], [0, 0.17, 0], 0.004, 'black')
      .ball([0.026, 0.052, 0.026], [0, 0.19, 0], { color: 'flame', glow: true })
      .ball([0.013, 0.026, 0.013], [0, 0.18, 0.005], { color: 'orange', glow: true })
      .done(),
  ),
  e('candleholder', 'home', 'lighting', () =>
    m('candleholder')
      .cyl([0.13, 0.015, 0.13], [0, 0.0075, 0], { color: 'brass' })
      .torus([0.13, 0.13, 0.015], [0, 0.017, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.045, 0.03, 0.045], [0, 0.03, 0], { color: 'brass' })
      .torus([0.05, 0.05, 0.012], [0.082, 0.035, 0], { color: 'brass', tube: 0.22 })
      .cyl([0.035, 0.07, 0.035], [0, 0.08, 0], { color: 'white' })
      .stick([0, 0.115, 0], [0, 0.13, 0], 0.003, 'black')
      .ball([0.022, 0.044, 0.022], [0, 0.145, 0], { color: 'flame', glow: true })
      .done(),
  ),
  e('candlestick', 'home', 'lighting', () =>
    m('candlestick')
      .cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'brass', taper: 0.7 })
      .cyl([0.026, 0.13, 0.026], [0, 0.085, 0], { color: 'brass' })
      .ball([0.045, 0.025, 0.045], [0, 0.05, 0], { color: 'brass' })
      .ball([0.04, 0.02, 0.04], [0, 0.12, 0], { color: 'brass' })
      .cyl([0.065, 0.012, 0.065], [0, 0.155, 0], { color: 'brass' })
      .cyl([0.035, 0.02, 0.035], [0, 0.17, 0], { color: 'brass' })
      .cyl([0.024, 0.12, 0.024], [0, 0.24, 0], { color: 'red' })
      .stick([0, 0.3, 0], [0, 0.315, 0], 0.003, 'black')
      .ball([0.02, 0.04, 0.02], [0, 0.33, 0], { color: 'flame', glow: true })
      .done(),
  ),
  e('candy', 'food', 'sweets', () => {
    const b = m('candy')
      .ball([0.06, 0.048, 0.048], [0, 0.026, 0], { color: 'red' })
      .torus([0.05, 0.044, 0.012], [0, 0.026, 0.0], { color: 'white', rot: [0, 90, 30], tube: 0.18, noInk: true });
    b.pair((s) => b.cone([0.04, 0.035, 0.034], [s * 0.045, 0.026, 0], { color: 'red', rot: [0, 0, s * 90] }));
    return b.done();
  }),
  e('candy apple', 'food', 'sweets', () =>
    m('candy apple')
      .cyl([0.11, 0.004, 0.11], [0, 0.002, 0], { color: 'white' })
      .ball([0.1, 0.016, 0.1], [0, 0.01, 0], { color: 'red' })
      .ball([0.085, 0.078, 0.085], [0, 0.046, 0], { color: 'red' })
      .stick([0, 0.07, 0], [0.006, 0.17, 0], 0.008, 'lightwood')
      .ball([0.02, 0.026, 0.01], [0.02, 0.064, 0.038], { color: 'white', noInk: true })
      .done(),
  ),
  e('candy bar', 'food', 'sweets', () => {
    const b = m('candy bar')
      .box([0.07, 0.1, 0.022], [0, 0.05, 0], { color: 'red', round: 0.2 })
      .label('CHOCO', [0.058, 0.028], [0, 0.055, 0.012], { color: 'yellow' })
      .box([0.072, 0.008, 0.024], [0, 0.1, 0], { color: 'silver', round: 0.2 })
      .box([0.064, 0.055, 0.016], [0, 0.128, 0], { color: 'chocolate', round: 0.1 });
    for (const x of [-0.016, 0.016]) for (const y of [0.115, 0.142]) b.box([0.027, 0.024, 0.004], [x, y, 0.009], { color: '#7a4a2e', round: 0.3 });
    return b.done();
  }),
  e('candy cane', 'food', 'sweets', () => {
    const b = m('candy cane');
    const pts: V[] = [[0.04, 0.0, 0], [0.04, 0.045, 0], [0.04, 0.09, 0], [0.04, 0.135, 0], [0.04, 0.18, 0], ...arc(0, 0.2, 0.04, 0.045, 0, 180, 5).slice(0), [-0.04, 0.16, 0]];
    pts.forEach((p, i) => i < pts.length - 1 && b.rod(p, pts[i + 1], 0.026, i % 2 ? 'white' : 'red'));
    return b.done();
  }),
  e('candy corn', 'food', 'sweets', () =>
    m('candy corn')
      .cyl([0.05, 0.022, 0.03], [0, 0.011, 0], { color: 'yellow', taper: 0.75 })
      .cyl([0.0375, 0.022, 0.0225], [0, 0.033, 0], { color: 'orange', taper: 0.6 })
      .cone([0.0225, 0.024, 0.0135], [0, 0.056, 0], { color: 'white' })
      .done(),
  ),
  e('candy store', 'places', 'shops', () =>
    shop('candy store', { w: 4, h: 3, d: 3, wall: 'pink', sign: 'CANDY', roof: 'magenta', awning: ['pink', 'white'] })
      .stick([0, 3.1, 0], [0, 3.8, 0], 0.08, 'white')
      .cyl([1.0, 0.18, 1.0], [0, 4.25, 0], { color: 'red', rot: [90, 0, 0] })
      .torus([0.62, 0.62, 0.2], [0, 4.25, 0.02], { color: 'white', tube: 0.18 })
      .torus([0.28, 0.28, 0.2], [0, 4.25, 0.02], { color: 'white', tube: 0.3 })
      .done(),
  ),
  e('cane', 'wardrobe', 'accessories', () => {
    const b = m('cane').stick([0, 0.05, 0], [0, 0.72, 0], 0.062, 'darkwood').cyl([0.08, 0.07, 0.08], [0, 0.035, 0], { color: 'rubber' });
    return path(b, [...arc(-0.075, 0.72, 0.075, 0.08, 0, 180, 6), [-0.15, 0.66, 0]], 0.062, 'darkwood').done();
  }),
  e('cannon', 'armory', 'artillery', () => {
    const b = m('cannon', { view: 'side' })
      .box([0.8, 0.35, 1.6], [0, 0.55, -0.2], { color: 'wood', round: 0.2 })
      .rod([0, 0.5, -0.9], [0, 0.12, -1.6], 0.3, 'wood')
      .cyl([0.5, 2.2, 0.5], [0, 1.0, 0.3], { color: 'iron', taper: 0.75, rot: [80, 0, 0] })
      .ball(0.52, [0, 0.81, -0.78], { color: 'iron' })
      .ball(0.18, [0, 0.77, -1.08], { color: 'iron' })
      .torus([0.46, 0.46, 0.14], [0, 1.19, 1.38], { color: 'iron', rot: [-10, 0, 0], tube: 0.3 });
    b.pair((s) => spoked(b, s * 0.52, 0.6, 0.1, 1.2, 'darkwood', 6));
    return b.done();
  }),
  e('cannonball', 'armory', 'artillery', () => {
    const b = m('cannonball').ball(0.12, [0, 0.165, 0], { color: 'iron' });
    around(3, 0.07, 0.5).forEach(([x, z]) => b.ball(0.12, [x, 0.06, z], { color: 'iron' }));
    return b.done();
  }),
  e('canoe', 'garage', 'boats', () =>
    m('canoe', { view: 'side' })
      .ball([0.85, 0.7, 4.6], [0, 0.3, 0], { color: 'red' })
      .ball([0.72, 0.08, 4.0], [0, 0.62, 0], { color: 'wood' })
      .box([0.74, 0.05, 0.22], [0, 0.66, 1.0], { color: 'darkwood' })
      .box([0.74, 0.05, 0.22], [0, 0.66, -1.0], { color: 'darkwood' })
      .stick([0.2, 0.7, -0.6], [-0.1, 0.72, 0.9], 0.04, 'lightwood')
      .box([0.18, 0.03, 0.5], [-0.15, 0.72, 1.1], { color: 'lightwood', rot: [0, -10, 0], round: 0.6 })
      .done(),
  ),
  e('canopy', 'garden', 'garden things', () => {
    const b = m('canopy')
      .cone([3.4, 0.8, 3.4], [0, 2.65, 0], { color: 'white', segs: 4, rot: [0, 45, 0] })
      .box([2.5, 0.3, 2.5], [0, 2.15, 0], { color: 'red', round: 0.1 })
      .ball(0.15, [0, 3.07, 0], { color: 'red' });
    for (const [x, z] of [[1.15, 1.15], [-1.15, 1.15], [1.15, -1.15], [-1.15, -1.15]]) b.stick([x, 0, z], [x, 2.15, z], 0.08, 'silver');
    return b.done();
  }),
  e('canopy bed', 'home', 'beds', () => {
    const b = m('canopy bed')
      .box([1.6, 0.3, 2.1], [0, 0.3, 0], { color: 'darkwood', round: 0.2 })
      .box([1.5, 0.2, 2.0], [0, 0.55, 0], { color: 'white', round: 0.4 })
      .box([1.54, 0.12, 1.3], [0, 0.66, 0.35], { color: 'purple', round: 0.4 })
      .box([1.6, 0.9, 0.1], [0, 0.85, -1.02], { color: 'darkwood', round: 0.3 })
      .box([1.7, 0.08, 2.2], [0, 2.2, 0], { color: 'pink', round: 0.3 });
    b.pair((s) => b.box([0.55, 0.14, 0.35], [s * 0.38, 0.72, -0.75], { color: 'white', round: 0.6 }));
    for (const [x, z] of [[0.77, 1.02], [-0.77, 1.02], [0.77, -1.02], [-0.77, -1.02]]) b.stick([x, 0, z], [x, 2.2, z], 0.07, 'darkwood').box([0.25, 1.6, 0.25], [x, 1.42, z], { color: 'pink', round: 0.5 });
    return b.done();
  }),
  e('canteen (container)', 'sports', 'camping gear', () => {
    const b = m('canteen (container)')
      .cyl([0.2, 0.07, 0.2], [0, 0.11, 0], { color: 'olive', rot: [90, 0, 0] })
      .torus([0.2, 0.2, 0.02], [0, 0.11, 0], { color: 'darkgreen', tube: 0.06 })
      .cyl([0.03, 0.03, 0.03], [0, 0.22, 0], { color: 'silver' })
      .cyl([0.042, 0.025, 0.042], [0, 0.24, 0], { color: 'black' });
    return path(b, arc(0, 0.11, 0.105, 0.19, 10, 170, 6, -0.04), 0.014, 'darkbrown').done();
  }),
  e('canvas', 'study', 'art supplies', () => {
    const b = m('canvas')
      .stick([-0.32, 0, 0.15], [0, 1.3, -0.05], 0.04, 'wood')
      .stick([0.32, 0, 0.15], [0, 1.3, -0.05], 0.04, 'wood')
      .stick([0, 0, -0.42], [0, 1.2, -0.08], 0.04, 'wood')
      .box([0.8, 0.04, 0.09], [0, 0.42, 0.15], { color: 'wood' })
      .box([0.75, 0.6, 0.1], [0, 0.76, 0.1], { color: 'white', rot: [-8, 0, 0], round: 0.05 });
    const zf = (y: number) => 0.155 - (y - 0.76) * 0.14;
    for (const [x, y, w, h, c] of [[0.2, 0.92, 0.1, 0.1, 'yellow'], [-0.1, 0.95, 0.4, 0.06, 'skyblue'], [0, 0.62, 0.6, 0.12, 'green'], [-0.2, 0.7, 0.12, 0.18, 'red']] as const)
      b.ball([w, h, 0.01], [x, y, zf(y)], { color: c, rot: [-8, 0, 0], noInk: true });
    return b.done();
  }),
  e('canyon', 'nature', 'landforms', () => {
    const b = m('canyon').box([8, 0.1, 5], [0, 0.05, 0], { color: 'sand' }).box([1.4, 0.06, 5], [0, 0.11, 0], { color: 'water' });
    const cols = ['#c4622d', '#d9894a', '#b5532a', '#e0a060'];
    b.pair((s) => {
      for (let k = 0; k < 4; k++) b.box([2.6 - k * 0.3, 1.2, 5 - k * 0.5], [s * (2.4 + k * 0.15), 0.6 + k * 1.2, -k * 0.2], { color: cols[k], round: 0.15 });
      b.ball([0.6, 0.4, 0.5], [s * 1.0, 0.25, 1.8], { color: 'rock' });
    });
    return b.done();
  }),
  e('cap and gown', 'wardrobe', 'outfits', () =>
    who('cap and gown', { top: 'navy', bottom: 'navy', skirt: 'navy', long: true, shoes: 'black', acc: [hat('grad', 'navy'), wear('robe', 'navy'), held('scroll')] }),
  ),
  e('cap gun', 'toys', 'toy weapons', () =>
    m('cap gun')
      .cyl([0.022, 0.12, 0.022], [0.05, 0.115, 0], { color: 'silver', rot: [0, 0, 90] })
      .box([0.07, 0.04, 0.03], [-0.03, 0.11, 0], { color: 'silver', round: 0.3 })
      .cyl([0.05, 0.036, 0.05], [-0.01, 0.1, 0], { color: 'steel', rot: [0, 0, 90] })
      .box([0.04, 0.09, 0.03], [-0.065, 0.05, 0], { color: 'red', rot: [0, 0, -18], round: 0.4 })
      .torus([0.035, 0.035, 0.008], [-0.02, 0.07, 0], { color: 'silver', tube: 0.2 })
      .box([0.006, 0.02, 0.006], [-0.02, 0.075, 0], { color: 'black' })
      .box([0.012, 0.025, 0.012], [-0.065, 0.135, 0], { color: 'steel', rot: [0, 0, 30] })
      .ball(0.01, [0.105, 0.13, 0], { color: 'silver' })
      .done(),
  ),
  e('capsule (shape)', 'ideas', 'shapes', () => {
    const P = diag(-0.035, 0.02, 35);
    return m('capsule (shape)').rod(P(0), P(0.045), 0.036, 'red').rod(P(0.045), P(0.09), 0.036, 'white').done();
  }),
  e('car', 'garage', 'cars', () => {
    const b = m('car', { view: 'side' })
      .box([1.7, 0.55, 3.8], [0, 0.6, 0], { color: 'blue', round: 0.5 })
      .box([1.5, 0.55, 2.2], [0, 1.1, -0.35], { color: 'blue', round: 0.5 })
      .box([1.52, 0.38, 1.9], [0, 1.12, -0.3], { color: 'glass', round: 0.4 })
      .box([1.74, 0.14, 0.2], [0, 0.42, 1.88], { color: 'silver', round: 0.5 })
      .ball([0.25, 0.15, 0.06], [0.55, 0.68, 1.9], { color: 'yellow', glow: true })
      .ball([0.25, 0.15, 0.06], [-0.55, 0.68, 1.9], { color: 'yellow', glow: true })
      .ball([0.2, 0.12, 0.06], [0.6, 0.72, -1.9], { color: 'red', glow: true })
      .ball([0.2, 0.12, 0.06], [-0.6, 0.72, -1.9], { color: 'red', glow: true });
    return wheels(b, 0.8, [1.2, -1.2], 0.62, 0.24).done();
  }),
  e('car battery', 'garage', 'car parts', () =>
    m('car battery')
      .box([0.26, 0.18, 0.17], [0, 0.09, 0], { color: 'black', round: 0.1 })
      .box([0.26, 0.03, 0.17], [0, 0.195, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.026, 0.03, 0.026], [0.08, 0.222, 0.03], { color: 'red' })
      .cyl([0.026, 0.03, 0.026], [-0.08, 0.222, 0.03], { color: 'silver' })
      .box([0.03, 0.008, 0.008], [0.08, 0.212, -0.03], { color: 'red', noInk: true })
      .box([0.008, 0.008, 0.03], [0.08, 0.212, -0.03], { color: 'red', noInk: true })
      .box([0.03, 0.008, 0.008], [-0.08, 0.212, -0.03], { color: 'white', noInk: true })
      .label('12V', [0.12, 0.06], [0, 0.1, 0.09], { color: 'yellow' })
      .done(),
  ),
  e('car dealership', 'places', 'shops', () => {
    const b = m('car dealership')
      .box([8, 0.1, 7], [0, 0.05, 0.8], { color: 'darkgray' })
      .box([7, 3.2, 4], [0, 1.6, -1], { color: 'white', round: 0.03 })
      .box([7.2, 0.3, 4.2], [0, 3.35, -1], { color: 'red', round: 0.1 })
      .box([5.8, 2.2, 0.06], [-0.3, 1.3, 1.02], { color: 'glass' })
      .label('CARS', [3, 0.6], [0, 3.35, 1.13], { color: 'red' })
      .box([1.4, 0.45, 2.6], [0.5, 0.45, 2.8], { color: 'yellow', round: 0.5 })
      .box([1.25, 0.4, 1.4], [0.5, 0.85, 2.7], { color: 'glass', round: 0.5 });
    for (const [x, z] of [[1.1, 3.6], [-0.1, 3.6], [1.1, 2.0], [-0.1, 2.0]]) b.torus([0.48, 0.48, 0.18], [x, 0.3, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    b.pair((s) => b.stick([s * 3.6, 0.1, 3.8], [s * 3.6, 3.0, 3.8], 0.08, 'silver').wedge([0.7, 0.5, 0.03], [s * 3.6 + 0.35, 2.75, 3.8], { color: s > 0 ? 'blue' : 'yellow', rot: [0, 0, -90] }));
    return b.done();
  }),
  e('car jack', 'garage', 'car parts', () => {
    const b = m('car jack')
      .box([0.3, 0.035, 0.12], [0, 0.0175, 0], { color: 'darkgray', round: 0.2 })
      .box([0.12, 0.035, 0.1], [0, 0.4, 0], { color: 'darkgray', round: 0.2 })
      .stick([-0.22, 0.21, 0], [0.16, 0.21, 0], 0.016, 'silver');
    b.pair((s) => {
      b.rod([s * 0.02, 0.04, 0], [s * 0.14, 0.21, 0], 0.03, 'red').rod([s * 0.14, 0.21, 0], [s * 0.02, 0.38, 0], 0.03, 'red');
      b.ball(0.035, [s * 0.14, 0.21, 0], { color: 'darkgray' });
    });
    return path(b, [[-0.22, 0.21, 0], [-0.28, 0.21, 0], [-0.28, 0.12, 0]], 0.016, 'silver').done();
  }),
  e('car seat', 'garage', 'car parts', () =>
    m('car seat')
      .box([0.45, 0.22, 0.42], [0, 0.11, 0.02], { color: 'darkgray', round: 0.2 })
      .box([0.52, 0.14, 0.5], [0, 0.29, 0.05], { color: 'black', round: 0.5 })
      .box([0.5, 0.58, 0.14], [0, 0.6, -0.21], { color: 'black', rot: [-12, 0, 0], round: 0.5 })
      .box([0.12, 0.56, 0.02], [0, 0.6, -0.13], { color: 'red', rot: [-12, 0, 0], noInk: true })
      .box([0.28, 0.17, 0.12], [0, 0.98, -0.3], { color: 'black', rot: [-12, 0, 0], round: 0.6 })
      .done(),
  ),
  e('car wash', 'places', 'shops', () =>
    m('car wash')
      .box([5, 0.1, 5], [0, 0.05, 0], { color: 'darkgray' })
      .box([0.6, 3.4, 4], [2.1, 1.7, 0], { color: 'white', round: 0.05 })
      .box([0.6, 3.4, 4], [-2.1, 1.7, 0], { color: 'white', round: 0.05 })
      .box([4.8, 0.7, 4], [0, 3.65, 0], { color: 'blue', round: 0.1 })
      .label('CAR WASH', [3.4, 0.5], [0, 3.65, 2.03], { color: 'white' })
      .cyl([0.7, 2.6, 0.7], [1.25, 1.5, 0.8], { color: 'skyblue', name: 'rotor' })
      .cyl([0.7, 2.6, 0.7], [-1.25, 1.5, 0.8], { color: 'skyblue' })
      .cyl([0.12, 0.3, 0.12], [1.25, 2.95, 0.8], { color: 'silver' })
      .cyl([0.12, 0.3, 0.12], [-1.25, 2.95, 0.8], { color: 'silver' })
      .ball(0.3, [0.2, 2.2, 1.6], { color: 'white' })
      .ball(0.22, [-0.3, 2.6, 1.8], { color: 'white' })
      .ball(0.18, [0.4, 2.9, 1.9], { color: 'white' })
      .done(),
  ),
  e('cardboard', 'workshop', 'materials', () => {
    const b = m('cardboard')
      .box([0.5, 0.05, 0.35], [0, 0.025, 0], { color: 'tan', round: 0.1 })
      .box([0.5, 0.004, 0.352], [0, 0.017, 0], { color: '#b8915e', noInk: true })
      .box([0.5, 0.004, 0.352], [0, 0.034, 0], { color: '#b8915e', noInk: true });
    b.each(12, (i) => b.cyl([0.012, 0.004, 0.012], [-0.22 + i * 0.04, 0.026, 0.176], { color: '#b8915e', rot: [90, 0, 0], noInk: true }));
    return b.done();
  }),
  e('cards', 'toys', 'card games', () => {
    const b = m('cards').box([0.065, 0.025, 0.09], [0.05, 0.0125, 0.06], { color: 'white', round: 0.2 }).box([0.06, 0.004, 0.085], [0.05, 0.026, 0.06], { color: 'red', noInk: true });
    for (let i = 0; i < 5; i++) {
      const a = 30 - i * 15, r = a * RAD;
      const c: V = [-Math.sin(r) * 0.045 - 0.01, 0.012 + Math.cos(r) * 0.045, -i * 0.004];
      b.box([0.063, 0.088, 0.004], c, { color: 'white', rot: [0, 0, a], round: 0.15 });
      const sy: V = [c[0] - Math.sin(r) * 0.012, c[1] + Math.cos(r) * 0.012, c[2] + 0.003];
      if (i % 2) b.heart(0.022, sy, { color: 'red', rot: [0, 0, a], noInk: true });
      else b.ball([0.016, 0.02, 0.003], sy, { color: 'black', rot: [0, 0, a], noInk: true });
    }
    return b.done();
  }),
  e('cargo plane', 'garage', 'aircraft', () => {
    const b = m('cargo plane', { view: 'side' })
      .capsule([2.4, 12, 2.6], [0, 2.4, 0], { color: 'gray', rot: [90, 0, 0] })
      .box([14, 0.25, 2.2], [0, 3.55, 0.5], { color: 'gray', round: 0.3 })
      .box([0.3, 3.0, 2.2], [0, 4.6, -5.0], { color: 'gray', rot: [-20, 0, 0], round: 0.3 })
      .box([5, 0.2, 1.5], [0, 6.0, -5.6], { color: 'gray', round: 0.3 })
      .box([1.6, 0.4, 0.6], [0, 3.1, 6.2], { color: 'glass', round: 0.4 })
      .box([1.0, 0.6, 3.0], [1.3, 1.3, 0.5], { color: 'darkgray', round: 0.5 })
      .box([1.0, 0.6, 3.0], [-1.3, 1.3, 0.5], { color: 'darkgray', round: 0.5 })
      .stick([0, 1.2, 4.8], [0, 0.4, 4.8], 0.15, 'darkgray')
      .ball(0.6, [0, 0.3, 4.8], { color: 'rubber' });
    let first = true;
    for (const x of [-5, -2.6, 2.6, 5]) {
      b.cyl([0.7, 1.8, 0.7], [x, 3.2, 1.2], { color: 'darkgray', rot: [90, 0, 0] }).ball(0.35, [x, 3.2, 2.15], { color: 'darkgray' });
      b.box([0.16, 2.0, 0.06], [x, 3.2, 2.3], { color: 'black', name: first ? 'fan' : undefined });
      first = false;
    }
    return b.done();
  }),
  e('cargo ship', 'garage', 'ships', () => {
    const b = m('cargo ship', { view: 'side' })
      .box([3, 1.4, 14], [0, 0.7, 0], { color: 'darkred', round: 0.2 })
      .box([3.05, 1.2, 14], [0, 2.0, 0], { color: 'navy', round: 0.2 })
      .wedge([3, 2.2, 2.6], [0, 1.3, 8.0], { color: 'navy', rot: [90, 0, 0] })
      .box([2.6, 2.4, 2], [0, 3.8, -5.8], { color: 'white', round: 0.1 })
      .box([2.66, 0.5, 1.6], [0, 4.4, -5.6], { color: 'glass' })
      .cyl([0.8, 1.4, 0.8], [0, 5.6, -6.3], { color: 'black' })
      .cyl([0.82, 0.3, 0.82], [0, 5.4, -6.3], { color: 'red' });
    const cols = ['red', 'blue', 'orange', 'green', 'yellow', 'teal', 'orange', 'red', 'blue', 'green'];
    for (let i = 0; i < 5; i++) for (let t = 0; t < 2; t++) b.box([2.8, 0.9, 2.2], [0, 3.05 + t * 0.9, 4.6 - i * 2.3], { color: cols[i * 2 + t], round: 0.05 });
    return b.done();
  }),
  e('carousel', 'toys', 'fairground', () => {
    const b = m('carousel')
      .cyl([4.2, 0.4, 4.2], [0, 0.2, 0], { color: 'darkred', name: 'rotor' })
      .cyl([0.4, 3.0, 0.4], [0, 1.9, 0], { color: 'gold', parent: 'rotor' })
      .cyl([4.4, 0.45, 4.4], [0, 3.2, 0], { color: 'gold', parent: 'rotor' })
      .cone([4.7, 1.4, 4.7], [0, 4.1, 0], { color: 'red', parent: 'rotor' })
      .ball(0.3, [0, 4.9, 0], { color: 'gold', parent: 'rotor' });
    const cols = ['white', 'pink', 'skyblue', 'cream'];
    around(4, 1.5, 0.3).forEach(([x, z], i) => {
      const th = Math.atan2(z, x), tx = -Math.sin(th), tz = Math.cos(th);
      b.stick([x, 0.4, z], [x, 3.0, z], 0.06, 'gold', { parent: 'rotor' })
        .ball([0.3, 0.38, 0.8], [x, 1.3, z], { color: cols[i], rot: [0, (-th * 180) / Math.PI, 0], parent: 'rotor' })
        .ball([0.2, 0.32, 0.32], [x + tx * 0.42, 1.65, z + tz * 0.42], { color: cols[i], rot: [0, (-th * 180) / Math.PI, 0], parent: 'rotor' })
        .rod([x + tx * 0.25, 0.9, z + tz * 0.25], [x + tx * 0.35, 1.2, z + tz * 0.35], 0.09, cols[i], { parent: 'rotor' })
        .rod([x - tx * 0.25, 0.9, z - tz * 0.25], [x - tx * 0.3, 1.2, z - tz * 0.3], 0.09, cols[i], { parent: 'rotor' });
    });
    return b.done();
  }),
  e('carriage', 'garage', 'horse-drawn', () => {
    const b = m('carriage', { view: 'side' })
      .box([0.8, 0.15, 3.0], [0, 0.85, 0], { color: 'darkwood' })
      .box([1.5, 1.3, 1.8], [0, 1.6, -0.3], { color: 'purple', round: 0.4 })
      .box([1.56, 0.5, 0.8], [0, 1.85, -0.3], { color: 'glass', round: 0.3 })
      .box([1.6, 0.14, 1.9], [0, 2.3, -0.3], { color: 'gold', round: 0.4 })
      .ball(0.3, [0, 2.45, -0.3], { color: 'gold' })
      .box([1.2, 0.3, 0.5], [0, 1.4, 0.95], { color: 'darkwood', round: 0.3 })
      .box([1.2, 0.4, 0.1], [0, 1.65, 0.75], { color: 'darkwood', round: 0.3 })
      .ball([0.12, 0.18, 0.12], [0.8, 1.9, 0.6], { color: 'yellow', glow: true })
      .ball([0.12, 0.18, 0.12], [-0.8, 1.9, 0.6], { color: 'yellow', glow: true });
    b.pair((s) => {
      spoked(b, s * 0.85, 0.7, -0.9, 1.4, 'gold', 6);
      spoked(b, s * 0.85, 0.5, 1.0, 1.0, 'gold', 5);
      b.rod([s * 0.4, 0.85, 1.4], [s * 0.4, 0.95, 2.6], 0.06, 'darkwood');
    });
    return b.done();
  }),
  e('carrot', 'food', 'vegetables', () => {
    const b = m('carrot').cone([0.055, 0.21, 0.055], [0, 0.105, 0], { color: 'orange', rot: [180, 0, 0] });
    b.each(3, (i) => b.box([0.035 - i * 0.008, 0.004, 0.004], [0, 0.17 - i * 0.045, 0.024 - i * 0.004], { color: '#d97a2a', noInk: true }));
    for (const [x, z] of [[-0.03, 0], [0.03, 0.01], [0, -0.02], [0.005, 0.02]]) b.rod([0, 0.21, 0], [x, 0.29, z], 0.012, 'leaf');
    return b.done();
  }),
  e('carrot juice', 'food', 'drinks', () =>
    drink(m('carrot juice'), 0.15, 0.07, 'orange', 0.82)
      .stick([0.01, 0.1, 0], [0.025, 0.2, 0.0], 0.008, 'green')
      .cone([0.018, 0.06, 0.018], [-0.03, 0.15, 0.0], { color: 'orange', rot: [180, 0, 25] })
      .rod([-0.042, 0.18, 0], [-0.05, 0.2, 0], 0.008, 'leaf')
      .done(),
  ),
  e('cart (vehicle)', 'garage', 'carts', () => {
    const b = m('cart (vehicle)', { view: 'side' })
      .box([1.0, 0.19, 1.4], [0, 0.65, 0], { color: 'wood' })
      .box([1.0, 0.35, 0.06], [0, 0.87, 0.67], { color: 'wood' })
      .box([1.0, 0.35, 0.06], [0, 0.87, -0.67], { color: 'wood' })
      .stick([0, 0.6, -0.6], [0, 0, -0.6], 0.06, 'darkwood');
    b.pair((s) => {
      b.box([0.06, 0.35, 1.4], [s * 0.5, 0.87, 0], { color: 'wood' });
      spoked(b, s * 0.6, 0.45, 0, 0.9, 'darkwood', 5);
      b.rod([s * 0.35, 0.65, 0.7], [s * 0.35, 0.8, 1.4], 0.06, 'darkwood');
    });
    return b.done();
  }),
  e('carton', 'home', 'boxes', () =>
    m('carton')
      .box([0.4, 0.28, 0.3], [0, 0.14, 0], { color: 'tan', round: 0.04 })
      .box([0.38, 0.01, 0.28], [0, 0.279, 0], { color: '#8a6440' })
      .box([0.4, 0.15, 0.008], [0, 0.341, 0.193], { color: 'tan', rot: [35, 0, 0] })
      .box([0.4, 0.15, 0.008], [0, 0.341, -0.193], { color: 'tan', rot: [-35, 0, 0] })
      .box([0.008, 0.12, 0.3], [0.235, 0.33, 0], { color: '#c9a36b', rot: [0, 0, -35] })
      .box([0.008, 0.12, 0.3], [-0.235, 0.33, 0], { color: '#c9a36b', rot: [0, 0, 35] })
      .done(),
  ),
  e('cartridge (electronics)', 'tech', 'games', () => {
    const b = m('cartridge (electronics)')
      .box([0.1, 0.105, 0.02], [0, 0.0625, 0], { color: 'gray', round: 0.15 })
      .box([0.09, 0.02, 0.016], [0, 0.01, 0], { color: 'darkgray' })
      .box([0.075, 0.055, 0.004], [0, 0.065, 0.011], { color: 'red' })
      .label('GAME', [0.06, 0.015], [0, 0.083, 0.013], { color: 'white' });
    b.each(5, (i) => b.box([0.012, 0.004, 0.021], [-0.03 + i * 0.015, 0.112, 0], { color: 'darkgray', noInk: true }));
    return b.done();
  }),
  e('case', 'wardrobe', 'bags', () => {
    const b = m('case')
      .box([0.44, 0.32, 0.1], [0, 0.16, 0], { color: 'leather', round: 0.15 })
      .box([0.445, 0.01, 0.104], [0, 0.26, 0], { color: 'darkbrown', noInk: true });
    b.pair((s) => b.box([0.04, 0.03, 0.012], [s * 0.12, 0.27, 0.052], { color: 'gold', round: 0.2 }));
    return path(b, arc(0, 0.32, 0.07, 0.055, 0, 180, 5), 0.022, 'darkbrown').done();
  }),
  e('cash register', 'tech', 'shop machines', () => {
    const b = m('cash register')
      .box([0.42, 0.1, 0.4], [0, 0.05, 0], { color: 'gray', round: 0.1 })
      .box([0.2, 0.025, 0.02], [0, 0.05, 0.205], { color: 'darkgray', round: 0.3 })
      .box([0.4, 0.12, 0.28], [0, 0.16, -0.04], { color: 'silver', round: 0.15 })
      .stick([0, 0.22, -0.13], [0, 0.32, -0.13], 0.04, 'darkgray')
      .box([0.22, 0.09, 0.05], [0, 0.35, -0.13], { color: 'darkgray', round: 0.2 })
      .box([0.18, 0.05, 0.01], [0, 0.35, -0.1], { color: 'lime', glow: true })
      .box([0.07, 0.06, 0.004], [0.14, 0.25, -0.12], { color: 'white' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b.box([0.05, 0.02, 0.04], [-0.11 + c * 0.065, 0.225, 0.04 - r * 0.055], { color: c === 3 ? 'red' : 'white', round: 0.3 });
    return b.done();
  }),
  e('cashew', 'food', 'nuts', () => {
    const b = m('cashew');
    path(b, arc(0, 0.048, 0.028, 0.028, 195, 345, 4), 0.026, '#efd9a8');
    return b.ball(0.028, [-0.027, 0.04, 0], { color: '#efd9a8' }).ball(0.026, [0.027, 0.04, 0], { color: '#efd9a8' }).done();
  }),
  e('casino', 'places', 'entertainment', () => {
    const b = shop('casino', { w: 7, h: 4, d: 4, wall: 'maroon', sign: 'CASINO', signColor: 'gold', roof: 'gold', door: 'gold' })
      .box([1.2, 1.2, 1.2], [-1.6, 4.9, 0], { color: 'white', round: 0.2 })
      .box([1.2, 1.2, 1.2], [0.2, 4.9, 0.2], { color: 'red', round: 0.2, rot: [0, 30, 0] });
    for (const [x, y] of [[-1.95, 5.25], [-1.6, 4.9], [-1.25, 4.55], [-1.95, 4.55], [-1.25, 5.25]]) b.ball([0.2, 0.2, 0.05], [x, y, 0.61], { color: 'black', noInk: true });
    b.each(9, (i) => b.ball(0.16, [-3.2 + i * 0.8, 3.95, 2.08], { color: i % 2 ? 'yellow' : 'red', glow: true }));
    return b.done();
  }),
  e('casserole', 'kitchen', 'cookware', () => {
    const b = m('casserole')
      .box([0.32, 0.08, 0.22], [0, 0.04, 0], { color: 'orange', round: 0.6 })
      .box([0.3, 0.02, 0.2], [0, 0.078, 0], { color: 'cheese', round: 0.6 });
    for (const [x, z] of [[-0.08, 0.03], [0.05, -0.04], [0.09, 0.05], [-0.03, -0.05]]) b.ball([0.04, 0.008, 0.03], [x, 0.088, z], { color: '#c98a2e', noInk: true });
    b.pair((s) => b.box([0.05, 0.02, 0.1], [s * 0.18, 0.07, 0], { color: 'orange', round: 0.5 }));
    return b.done();
  }),
  e('cassette', 'music', 'audio gear', () => {
    const b = m('cassette')
      .box([0.1, 0.064, 0.012], [0, 0.032, 0], { color: 'black', round: 0.15 })
      .box([0.086, 0.034, 0.002], [0, 0.04, 0.007], { color: 'white' })
      .box([0.042, 0.014, 0.002], [0, 0.038, 0.0085], { color: '#5c4030' })
      .box([0.086, 0.007, 0.002], [0, 0.052, 0.0085], { color: 'red', noInk: true })
      .box([0.06, 0.012, 0.004], [0, 0.008, 0.006], { color: 'darkgray', round: 0.2 });
    b.pair((s) => b.torus([0.017, 0.017, 0.004], [s * 0.021, 0.038, 0.009], { color: 'white', tube: 0.3 }));
    return b.done();
  }),
  e('cast', 'clinic', 'medical', () => {
    const P = diag(-0.13, 0.045, 30);
    const b = m('cast')
      .rod(P(0), P(0.21), 0.08, 'white')
      .ball([0.06, 0.07, 0.045], P(0.26), { color: 'skin2', rot: [0, 0, -60] })
      .rod(P(0.24, 0.03), P(0.27, 0.05), 0.016, 'skin2');
    b.each(4, (i) => b.rod(P(0.28, -0.022 + i * 0.013), P(0.32, -0.022 + i * 0.013), 0.013, 'skin2'));
    for (const [t, o, c] of [[0.05, 0.02, 'red'], [0.1, -0.01, 'blue'], [0.15, 0.025, 'green']] as const) b.box([0.04, 0.008, 0.004], P(t, o, 0.039), { color: c, rot: [0, 0, 30 + (t * 300) % 40], noInk: true });
    return b.heart(0.025, P(0.12, 0.02, 0.04), { color: 'pink', noInk: true }).done();
  }),
  e('castle', 'places', 'landmarks', () => {
    const b = m('castle')
      .box([6, 3, 4], [0, 1.5, 0], { color: 'stone', round: 0.02 })
      .box([2.4, 5, 2.4], [0, 2.5, -0.6], { color: '#9a9a92' })
      .cone([2.8, 1.6, 2.8], [0, 5.8, -0.6], { color: 'blue', segs: 4, rot: [0, 45, 0] })
      .box([1.3, 1.7, 0.1], [0, 0.85, 2.03], { color: 'darkwood', name: 'door', pivot: [-0.65, 0.85, 2.03] })
      .label('CASTLE', [1.6, 0.4], [0, 2.1, 2.05], { color: 'red' })
      .stick([3, 6.2, 2], [3, 7.2, 2], 0.06, 'darkgray')
      .wedge([0.7, 0.5, 0.03], [3.35, 7.0, 2], { color: 'red', rot: [0, 0, -90] });
    b.each(6, (i) => b.box([0.5, 0.5, 0.5], [-2.2 + i * 0.88, 3.2, 1.75], { color: 'stone' }));
    for (const [x, z] of [[3, 2], [-3, 2], [3, -2], [-3, -2]]) {
      b.cyl([1.6, 4.4, 1.6], [x, 2.2, z], { color: 'stone' }).cone([1.9, 1.8, 1.9], [x, 5.3, z], { color: 'blue' });
      b.box([0.3, 0.5, 0.05], [x, 3.0, z + 0.8], { color: 'black' });
    }
    return b.done();
  }),
  e('cat ears', 'wardrobe', 'costume', () => {
    const b = m('cat ears');
    path(b, arc(0, 0.01, 0.09, 0.1, 10, 170, 6), 0.016, 'black');
    b.pair((s) =>
      b.wedge([0.065, 0.075, 0.024], [s * 0.048, 0.125, 0], { color: 'black', rot: [0, 0, s * -15] }).wedge([0.035, 0.045, 0.01], [s * 0.047, 0.118, 0.013], { color: 'pink', rot: [0, 0, s * -15], noInk: true }),
    );
    return b.done();
  }),
  e('cat food', 'pets', 'pet food', () => {
    const b = m('cat food')
      .box([0.16, 0.22, 0.07], [0, 0.11, -0.03], { color: 'purple', round: 0.3 })
      .box([0.16, 0.02, 0.03], [0, 0.23, -0.03], { color: 'purple', round: 0.2 })
      .label('CAT FOOD', [0.12, 0.04], [0, 0.18, 0.01], { color: 'yellow' })
      .ball([0.07, 0.06, 0.02], [0, 0.1, 0.007], { color: 'orange' })
      .cyl([0.1, 0.035, 0.1], [0.1, 0.0175, 0.08], { color: 'red', taper: 1.3 });
    b.pair((s) => b.wedge([0.025, 0.03, 0.015], [s * 0.022, 0.14, 0.006], { color: 'orange' }).ball(0.008, [s * 0.015, 0.105, 0.017], { color: 'black', noInk: true }));
    around(6, 0.03).forEach(([x, z]) => b.ball(0.018, [0.1 + x, 0.04, 0.08 + z], { color: 'brown' }));
    return b.ball(0.02, [0.1, 0.045, 0.08], { color: 'brown' }).done();
  }),
  e('cat scan machine', 'clinic', 'hospital machines', () =>
    m('cat scan machine')
      .box([1.6, 0.3, 0.9], [0, 0.15, -0.3], { color: 'lightgray', round: 0.2 })
      .torus([2.0, 2.0, 0.8], [0, 1.1, -0.3], { color: 'white', tube: 0.34 })
      .torus([1.3, 1.3, 0.82], [0, 1.1, -0.3], { color: 'skyblue', tube: 0.06, noInk: true })
      .box([0.4, 0.66, 1.0], [0, 0.33, 1.1], { color: 'lightgray', round: 0.2 })
      .box([0.6, 0.12, 2.3], [0, 0.72, 0.6], { color: 'skyblue', round: 0.4 })
      .box([0.4, 0.1, 0.25], [0, 0.82, -0.25], { color: 'white', round: 0.6 })
      .box([0.3, 0.15, 0.04], [0.55, 1.7, 0.12], { color: 'navy', glow: true })
      .done(),
  ),
  e('cat tail (tail)', 'pets', 'body parts', () => {
    const b = m('cat tail (tail)').ball([0.07, 0.04, 0.06], [0, 0.02, 0], { color: 'orange' });
    const pts: V[] = [[0, 0.02, 0], [0.03, 0.07, 0], [0.025, 0.12, 0], [-0.015, 0.17, 0], [-0.01, 0.22, 0], [0.025, 0.25, 0]];
    pts.forEach((p, i) => i < pts.length - 1 && b.rod(p, pts[i + 1], 0.036, i % 2 ? '#c8681e' : 'orange'));
    return b.ball(0.036, [0.025, 0.25, 0], { color: 'white' }).done();
  }),
  e('catamaran', 'garage', 'boats', () => {
    const b = m('catamaran', { view: 'side' })
      .box([5.2, 0.3, 5], [0, 1.2, -0.5], { color: 'white', round: 0.3 })
      .box([3, 1.0, 3], [0, 1.85, -1.0], { color: 'white', round: 0.3 })
      .box([3.05, 0.4, 2.6], [0, 1.95, -1.0], { color: 'glass', round: 0.3 })
      .stick([0, 1.3, 0.5], [0, 11, 0.5], 0.2, 'silver')
      .stick([0, 1.9, 0.5], [0, 1.9, -4], 0.14, 'silver')
      .wedge([4.4, 8.8, 0.06], [0, 6.35, -1.75], { color: 'white', rot: [0, 90, 0], apex: -0.5 })
      .wedge([2.6, 7, 0.06], [0, 5.0, 1.85], { color: 'skyblue', rot: [0, 90, 0], apex: 0.5 });
    b.pair((s) => b.capsule([0.9, 10, 0.9], [s * 2.2, 0.6, 0], { color: 'white', rot: [90, 0, 0] }).box([0.92, 0.12, 9], [s * 2.2, 0.45, 0], { color: 'blue', noInk: true }));
    return b.done();
  }),
  e('catapult', 'armory', 'siege', () => {
    const b = m('catapult', { view: 'side' })
      .box([1.6, 0.2, 0.2], [0, 0.55, 1.3], { color: 'wood' })
      .box([1.6, 0.2, 0.2], [0, 0.55, -1.3], { color: 'wood' })
      .stick([-0.85, 2.0, 0], [0.85, 2.0, 0], 0.18, 'darkwood')
      .rod([0, 0.75, 0.8], [0, 3.2, -1.4], 0.18, 'darkwood')
      .cyl([0.6, 0.3, 0.6], [0, 3.3, -1.5], { color: 'darkwood', rot: [-40, 0, 0] })
      .ball(0.45, [0, 3.55, -1.6], { color: 'stone' })
      .stick([-0.75, 0.75, 0.8], [0.75, 0.75, 0.8], 0.14, 'iron');
    b.pair((s) => {
      b.box([0.2, 0.25, 3.2], [s * 0.7, 0.55, 0], { color: 'wood' });
      b.rod([s * 0.7, 0.65, -0.5], [s * 0.7, 2.0, 0], 0.16, 'wood').rod([s * 0.7, 0.65, 0.6], [s * 0.7, 2.0, 0], 0.16, 'wood');
      for (const z of [1.1, -1.1]) spoked(b, s * 0.88, 0.45, z, 0.9, 'darkwood', 5);
    });
    return b.done();
  }),
  e('cathedral', 'places', 'religious', () => {
    const b = m('cathedral')
      .box([2, 1.6, 3], [0, 0.8, -0.6], { color: 'stone' })
      .wedge([2.1, 0.9, 3.1], [0, 2.05, -0.6], { color: 'darkgray' })
      .box([0.9, 1.9, 0.6], [0, 0.95, 1.1], { color: 'stone' })
      .wedge([0.9, 0.5, 0.6], [0, 2.15, 1.1], { color: 'stone' })
      .torus([0.5, 0.5, 0.08], [0, 1.4, 1.42], { color: 'darkgray', tube: 0.18 })
      .cyl([0.42, 0.04, 0.42], [0, 1.4, 1.41], { color: 'purple', rot: [90, 0, 0] })
      .box([0.42, 0.75, 0.06], [0, 0.375, 1.42], { color: 'darkwood', name: 'door', pivot: [-0.21, 0.375, 1.42] })
      .label('CATHEDRAL', [0.7, 0.14], [0, 0.88, 1.43], { color: 'cream' });
    b.pair((s) => {
      b.box([0.75, 2.7, 0.75], [s * 0.82, 1.35, 1.1], { color: '#b8b6ad' });
      b.cone([0.95, 1.0, 0.95], [s * 0.82, 3.2, 1.1], { color: 'darkgray', segs: 4, rot: [0, 45, 0] });
      b.box([0.2, 0.5, 0.04], [s * 0.82, 2.0, 1.48], { color: 'glass' });
    });
    return b.done();
  }),
  e('catnip', 'garden', 'herbs', () => {
    const b = m('catnip')
      .cyl([0.14, 0.11, 0.14], [0, 0.055, 0], { color: '#c8673a', taper: 1.2 })
      .cyl([0.15, 0.015, 0.15], [0, 0.105, 0], { color: 'dirt' });
    around(5, 0.04, 0.3).forEach(([x, z], i) => {
      const top: V = [x * 1.8, 0.24 + (i % 2) * 0.04, z * 1.8];
      b.rod([x, 0.11, z], top, 0.008, 'green');
      b.ball([0.05, 0.012, 0.04], [x * 1.5, 0.19, z * 1.5], { color: 'leaf', rot: [0, i * 70, 20] });
      if (i % 2) b.capsule([0.022, 0.05, 0.022], [top[0], top[1] + 0.025, top[2]], { color: 'violet' });
      else b.ball([0.05, 0.012, 0.04], top, { color: 'leaf', rot: [0, i * 50, -20] });
    });
    return b.done();
  }),
  e('cattle crossing sign', 'ideas', 'road signs', () => {
    const b = m('cattle crossing sign')
      .cyl([0.22, 0.12, 0.22], [0, 0.06, 0], { color: 'stone' })
      .stick([0, 0.1, 0], [0, 1.0, 0], 0.06, 'gray')
      .box([0.64, 0.64, 0.025], [0, 1.15, 0.03], { color: 'black', rot: [0, 0, 45] })
      .box([0.6, 0.6, 0.03], [0, 1.15, 0.035], { color: 'yellow', rot: [0, 0, 45] })
      .box([0.22, 0.1, 0.01], [-0.02, 1.16, 0.055], { color: 'black', round: 0.4, noInk: true })
      .box([0.07, 0.07, 0.01], [0.13, 1.2, 0.055], { color: 'black', round: 0.4, noInk: true });
    for (const x of [-0.11, -0.07, 0.03, 0.07]) b.box([0.025, 0.08, 0.01], [x, 1.08, 0.055], { color: 'black', noInk: true });
    b.pair((s) => b.box([0.012, 0.03, 0.01], [0.13 + s * 0.03, 1.25, 0.055], { color: 'black', rot: [0, 0, s * -30], noInk: true }));
    return b.done();
  }),
  e('cauldron', 'fantasy', 'witch things', () => {
    const b = m('cauldron')
      .ball([0.44, 0.34, 0.44], [0, 0.22, 0], { color: 'black' })
      .torus([0.38, 0.38, 0.05], [0, 0.36, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.34, 0.02, 0.34], [0, 0.355, 0], { color: 'lime', glow: true })
      .ball(0.06, [0.05, 0.38, 0.04], { color: 'lime' })
      .ball(0.04, [-0.07, 0.375, -0.02], { color: 'lime' })
      .ball(0.035, [0.02, 0.43, 0.0], { color: '#c6f58f' });
    b.pair((s) => b.torus([0.08, 0.08, 0.02], [s * 0.21, 0.3, 0], { color: 'iron', rot: [0, 90, 0], tube: 0.2 }));
    around(3, 0.14, 0.5).forEach(([x, z]) => b.rod([x, 0.08, z], [x * 1.2, 0.0, z * 1.2], 0.04, 'black'));
    return b.done();
  }),
  e('cauliflower', 'food', 'vegetables', () => {
    const b = m('cauliflower').cyl([0.06, 0.06, 0.06], [0, 0.03, 0], { color: '#d8e6b0' });
    around(6, 0.085).forEach(([x, z]) => b.ball([0.12, 0.17, 0.04], [x, 0.1, z], { color: 'leaf', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, 0] }).ball(0.075, [x * 0.8, 0.16, z * 0.8], { color: 'cream' }));
    return b.ball([0.15, 0.12, 0.15], [0, 0.18, 0], { color: 'cream' }).ball(0.08, [0, 0.22, 0], { color: 'cream' }).done();
  }),
  e('caution sign', 'ideas', 'signs', () =>
    m('caution sign')
      .box([0.3, 0.6, 0.02], [0, 0.3, 0.055], { color: 'yellow', rot: [-10, 0, 0], round: 0.2 })
      .box([0.3, 0.6, 0.02], [0, 0.3, -0.055], { color: 'yellow', rot: [10, 0, 0], round: 0.2 })
      .box([0.3, 0.05, 0.06], [0, 0.6, 0], { color: 'yellow', round: 0.5 })
      .label('CAUTION', [0.25, 0.07], [0, 0.47, 0.085], { color: 'yellow', rot: [-10, 0, 0] })
      .wedge([0.17, 0.15, 0.006], [0, 0.27, 0.083], { color: 'black', rot: [-10, 0, 0] })
      .wedge([0.12, 0.1, 0.006], [0, 0.26, 0.086], { color: 'yellow', rot: [-10, 0, 0] })
      .box([0.014, 0.05, 0.006], [0, 0.27, 0.089], { color: 'black', rot: [-10, 0, 0] })
      .done(),
  ),
  e('caution tape', 'workshop', 'construction', () => {
    const b = m('caution tape')
      .cyl([0.12, 0.05, 0.12], [0, 0.06, 0], { color: 'yellow', rot: [90, 0, 0] })
      .cyl([0.05, 0.052, 0.05], [0, 0.06, 0], { color: 'cream', rot: [90, 0, 0] })
      .cyl([0.034, 0.054, 0.034], [0, 0.06, 0], { color: 'darkgray', rot: [90, 0, 0] })
      .box([0.26, 0.004, 0.05], [0.16, 0.002, 0], { color: 'yellow' });
    b.each(5, (i) => b.box([0.014, 0.003, 0.06], [0.07 + i * 0.045, 0.005, 0], { color: 'black', rot: [0, 40, 0], noInk: true }));
    b.each(4, (i) => b.box([0.012, 0.03, 0.003], [Math.cos(i * 1.57) * 0.035, 0.06 + Math.sin(i * 1.57) * 0.035, 0.026], { color: 'black', rot: [0, 0, i * 90 + 45], noInk: true }));
    return b.done();
  }),
  e('cave', 'nature', 'landforms', () => {
    const b = m('cave')
      .ball([5, 3.2, 3.6], [0, 1.2, -0.4], { color: 'rock' })
      .ball([2.4, 2.0, 2], [-1.8, 0.8, 0.6], { color: 'stone' })
      .ball([2, 1.6, 2], [1.9, 0.7, 0.7], { color: 'rock' })
      .ball([1.7, 2.0, 0.8], [0, 0.85, 1.25], { color: '#2a2524' })
      .ball([1.6, 0.25, 1.2], [-0.6, 2.7, 0.2], { color: '#6f8f4a', noInk: true });
    b.each(3, (i) => b.cone([0.18, 0.4, 0.18], [-0.35 + i * 0.35, 1.55 - (i % 2) * 0.1, 1.55], { color: 'stone', rot: [180, 0, 0] }));
    return b.done();
  }),
  e('caviar', 'food', 'seafood', () => {
    const b = m('caviar')
      .cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'navy' })
      .cyl([0.102, 0.008, 0.102], [0, 0.026, 0], { color: 'gold' })
      .cyl([0.092, 0.008, 0.092], [0, 0.031, 0], { color: 'black' })
      .cyl([0.1, 0.01, 0.1], [0, 0.07, -0.065], { color: 'gold', rot: [-70, 0, 0] })
      .stick([0.03, 0.04, 0.02], [0.1, 0.06, 0.05], 0.006, 'cream')
      .ball([0.022, 0.008, 0.03], [0.025, 0.04, 0.015], { color: 'cream', rot: [0, 60, 0] });
    around(7, 0.028).forEach(([x, z]) => b.ball(0.012, [x, 0.037, z], { color: '#1e1c1c' }));
    return b.done();
  }),
  e('cd case', 'music', 'audio gear', () =>
    m('cd case')
      .cyl([0.11, 0.003, 0.11], [0.008, 0.09, -0.009], { color: 'silver', rot: [90, 0, 0] })
      .box([0.125, 0.124, 0.01], [0, 0.062, 0], { color: 'glass', round: 0.1 })
      .box([0.112, 0.116, 0.002], [0.005, 0.062, 0.006], { color: 'purple' })
      .ball([0.05, 0.05, 0.002], [0.01, 0.07, 0.0075], { color: 'yellow', noInk: true })
      .box([0.01, 0.124, 0.012], [-0.058, 0.062, 0], { color: 'black' })
      .done(),
  ),
  e('ceiling fan', 'home', 'lighting', () => {
    const b = m('ceiling fan')
      .cyl([0.14, 0.03, 0.14], [0, 0.46, 0], { color: 'white' })
      .stick([0, 0.45, 0], [0, 0.28, 0], 0.025, 'white')
      .cyl([0.2, 0.1, 0.2], [0, 0.25, 0], { color: 'white', name: 'rotor' })
      .ball([0.15, 0.09, 0.15], [0, 0.17, 0], { color: 'cream' })
      .ball(0.06, [0, 0.14, 0], { color: 'yellow', glow: true });
    around(4, 0.36, 0.4).forEach(([x, z]) => b.box([0.5, 0.012, 0.13], [x, 0.25, z], { color: 'wood', rot: [0, (-Math.atan2(z, x) * 180) / Math.PI, 8], parent: 'rotor', round: 0.3 }));
    return b.done();
  }),
  e('celery', 'food', 'vegetables', () => {
    const b = m('celery').cyl([0.075, 0.03, 0.06], [0, 0.015, 0], { color: '#dbe8a8' });
    ([[-0.025, 0], [0, 0.012], [0.025, 0], [-0.012, -0.012], [0.012, -0.012]] as const).forEach(([x, z], i) => {
      const top: V = [x * 2.2, 0.24 + (i % 3) * 0.015, z * 2];
      b.rod([x, 0.02, z], top, 0.026, '#a8d26a').ball([0.05, 0.045, 0.04], [top[0], top[1] + 0.02, top[2]], { color: 'leaf' });
    });
    return b.done();
  }),
  e('cellar', 'places', 'rooms', () => {
    const b = m('cellar')
      .box([3, 0.1, 2.4], [0, 0.05, 0], { color: 'stone' })
      .box([3, 2.2, 0.2], [0, 1.1, -1.1], { color: 'rock' })
      .box([0.2, 2.2, 2.4], [-1.4, 1.1, 0], { color: 'rock' })
      .label('CELLAR', [0.9, 0.3], [0.6, 1.7, -0.99], { color: 'wood' })
      .ball([0.12, 0.18, 0.12], [-1.2, 1.6, 0.2], { color: 'yellow', glow: true });
    path(b, arc(0.1, 1.4, 1.4, 0.8, 0, 180, 6, 0.9), 0.25, 'stone');
    barrel(b, -0.6, 0.2, 0.7, 0.9, true);
    barrel(b, 0.4, -0.5, 0.7, 0.9, false);
    barrel(b, 0.4, 0.5, 0.6, 0.8, false);
    b.each(4, (i) => b.box([0.6, 0.25, 0.3], [1.1, 0.22 + i * 0.25, -0.9 + i * 0.3], { color: 'darkwood' }));
    return b.done();
  }),
  e('cello', 'music', 'strings', () => {
    const b = m('cello')
      .stick([0, 0.2, 0], [0, 0.0, 0.02], 0.014, 'silver')
      .ball([0.44, 0.4, 0.2], [0, 0.38, 0], { color: '#a0522d' })
      .ball([0.3, 0.22, 0.19], [0, 0.56, 0], { color: '#a0522d' })
      .ball([0.36, 0.32, 0.2], [0, 0.72, 0], { color: '#a0522d' })
      .box([0.06, 0.42, 0.05], [0, 1.05, 0], { color: 'darkwood' })
      .box([0.05, 0.62, 0.014], [0, 0.95, 0.105], { color: 'black' })
      .box([0.05, 0.12, 0.05], [0, 1.3, 0], { color: 'darkwood' })
      .ball(0.07, [0, 1.38, 0.01], { color: 'darkwood' })
      .box([0.07, 0.15, 0.014], [0, 0.3, 0.1], { color: 'black', round: 0.5 })
      .box([0.08, 0.025, 0.02], [0, 0.45, 0.1], { color: 'lightwood' });
    b.pair((s) => b.box([0.012, 0.11, 0.006], [s * 0.07, 0.48, 0.098], { color: 'black', rot: [0, 0, s * 8], noInk: true }).cyl([0.012, 0.05, 0.012], [s * 0.04, 1.3, 0], { color: 'darkwood', rot: [0, 0, 90] }));
    b.each(4, (i) => b.stick([-0.015 + i * 0.01, 0.3, 0.11], [-0.009 + i * 0.006, 1.24, 0.11], 0.002, 'silver', { noInk: true }));
    return b.done();
  }),
  e('cellophane', 'kitchen', 'kitchen wraps', () =>
    m('cellophane')
      .box([0.34, 0.07, 0.07], [0, 0.035, 0], { color: 'blue', round: 0.1 })
      .box([0.34, 0.01, 0.075], [0, 0.064, -0.004], { color: 'blue', rot: [-15, 0, 0], round: 0.1 })
      .cyl([0.045, 0.3, 0.045], [0, 0.065, 0.02], { color: '#dff3fb', rot: [0, 0, 90] })
      .box([0.28, 0.004, 0.08], [0, 0.05, 0.08], { color: '#dff3fb', rot: [20, 0, 0] })
      .label('WRAP', [0.12, 0.035], [0.06, 0.028, 0.032], { color: 'white' })
      .done(),
  ),
  e('ceramic', 'home', 'pottery', () =>
    m('ceramic')
      .cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'teal' })
      .ball([0.17, 0.15, 0.17], [0, 0.09, 0], { color: 'teal' })
      .cyl([0.06, 0.07, 0.06], [0, 0.18, 0], { color: 'teal', taper: 1.4 })
      .torus([0.085, 0.085, 0.012], [0, 0.215, 0], { color: 'teal', rot: [90, 0, 0], tube: 0.18 })
      .torus([0.172, 0.172, 0.03], [0, 0.09, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .torus([0.155, 0.155, 0.012], [0, 0.125, 0], { color: 'navy', rot: [90, 0, 0], tube: 0.08, noInk: true })
      .done(),
  ),
  e('cereal', 'food', 'breakfast', () => {
    const b = bowl(m('cereal'), 0.18, 0.08, 'yellow', 'milk')
      .stick([0.03, 0.08, 0.02], [0.1, 0.17, 0.04], 0.012, 'silver')
      .ball([0.035, 0.012, 0.045], [0.025, 0.08, 0.015], { color: 'silver' });
    [...around(7, 0.055), [0, 0] as [number, number]].forEach(([x, z], i) => b.torus([0.025, 0.025, 0.009], [x, 0.082, z], { color: ['orange', 'honey', 'red'][i % 3], rot: [80, i * 20, 0], tube: 0.3 }));
    return b.done();
  }),
  e('cereal box', 'food', 'breakfast', () =>
    pack('cereal box', [0.2, 0.3, 0.07], 'orange', 'CEREAL', 'yellow')
      .ball([0.1, 0.05, 0.01], [0, 0.07, 0.036], { color: 'white', noInk: true })
      .ball([0.02, 0.012, 0.004], [-0.02, 0.09, 0.04], { color: 'honey', noInk: true })
      .ball([0.02, 0.012, 0.004], [0.02, 0.092, 0.04], { color: 'honey', noInk: true })
      .ball([0.02, 0.012, 0.004], [0.0, 0.098, 0.04], { color: 'red', noInk: true })
      .done(),
  ),
  e('chain (tool)', 'workshop', 'hardware', () => {
    const b = m('chain (tool)').ball([0.3, 0.07, 0.25], [0, 0.035, 0], { color: 'steel' });
    around(6, 0.09).forEach(([x, z], i) => b.torus([0.05, 0.08, 0.016], [x, 0.07, z], { color: 'steel', rot: [90, i * 40, 0], tube: 0.28 }));
    b.each(9, (i) => b.torus([0.05, 0.085, 0.016], [0.03, 0.12 + i * 0.068, 0], { color: 'steel', rot: [0, i % 2 ? 90 : 0, 0], tube: 0.28 }));
    return path(b, [[0.03, 0.7, 0], ...arc(0.06, 0.78, 0.03, 0.04, 180, 0, 4), [0.09, 0.75, 0]], 0.014, 'iron').done();
  }),
  e('chain link fence', 'workshop', 'fencing', () => {
    const b = m('chain link fence').stick([-1, 1.75, 0], [1, 1.75, 0], 0.05, 'silver');
    b.pair((s) => b.stick([s * 1, 0, 0], [s * 1, 1.8, 0], 0.07, 'silver').cyl([0.22, 0.16, 0.22], [s * 1, 0.08, 0], { color: 'stone' }));
    const x0 = -0.97, x1 = 0.97, y0 = 0.1, y1 = 1.72;
    for (let c = x0 - (y1 - y0); c < x1; c += 0.16) {
      for (const dir of [1, -1]) {
        // line: x = c + t, y = y0 + t (dir 1) or x = c + t, y = y1 - t (dir -1)
        const t0 = Math.max(0, x0 - c), t1 = Math.min(y1 - y0, x1 - c);
        if (t1 <= t0) continue;
        b.stick([c + t0, dir > 0 ? y0 + t0 : y1 - t0, 0], [c + t1, dir > 0 ? y0 + t1 : y1 - t1, 0], 0.014, 'steel');
      }
    }
    return b.done();
  }),
  e('chainmail', 'armory', 'armour', () => {
    const b = m('chainmail')
      .box([0.42, 0.5, 0.22], [0, 0.25, 0], { color: 'steel', round: 0.3 })
      .ball([0.15, 0.05, 0.11], [0, 0.5, 0], { color: 'darkgray' });
    b.pair((s) => b.box([0.16, 0.22, 0.18], [s * 0.26, 0.4, 0], { color: 'steel', rot: [0, 0, s * 35], round: 0.4 }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b.torus([0.045, 0.045, 0.01], [-0.12 + c * 0.08 + (r % 2) * 0.04, 0.1 + r * 0.1, 0.112], { color: 'silver', tube: 0.2, noInk: true });
    return b.done();
  }),
  e('chainsaw', 'workshop', 'power tools', () => {
    const b = m('chainsaw')
      .box([0.22, 0.16, 0.12], [-0.06, 0.09, 0], { color: 'orange', round: 0.3 })
      .box([0.12, 0.08, 0.125], [-0.03, 0.12, 0], { color: 'darkgray', round: 0.3 })
      .box([0.42, 0.064, 0.008], [0.25, 0.08, 0], { color: 'darkgray', round: 0.6 })
      .box([0.4, 0.05, 0.012], [0.25, 0.08, 0], { color: 'silver', round: 0.6 })
      .box([0.015, 0.14, 0.13], [0.06, 0.15, 0], { color: 'black', round: 0.3 })
      .box([0.08, 0.03, 0.04], [-0.2, 0.06, 0], { color: 'black', round: 0.4 });
    return path(b, arc(-0.06, 0.16, 0.09, 0.08, 0, 180, 5), 0.024, 'black').done();
  }),
  e('chair', 'home', 'seating', () => {
    const b = m('chair')
      .box([0.46, 0.075, 0.44], [0, 0.45, 0], { color: 'wood' })
      .box([0.42, 0.04, 0.4], [0, 0.505, 0.01], { color: 'red', round: 0.5 })
      .box([0.44, 0.08, 0.04], [0, 0.9, -0.2], { color: 'darkwood' });
    b.pair((s) => b.stick([s * 0.19, 0, 0.19], [s * 0.19, 0.42, 0.19], 0.045, 'darkwood').stick([s * 0.19, 0, -0.19], [s * 0.19, 0.95, -0.2], 0.045, 'darkwood'));
    b.each(3, (i) => b.stick([-0.08 + i * 0.08, 0.49, -0.2], [-0.08 + i * 0.08, 0.86, -0.2], 0.03, 'darkwood'));
    return b.done();
  }),
  e('chaise lounge', 'home', 'seating', () => {
    const b = m('chaise lounge', { view: 'side' })
      .box([0.7, 0.28, 1.7], [0, 0.32, 0.1], { color: 'teal', round: 0.4 })
      .box([0.7, 0.6, 0.3], [0, 0.62, -0.65], { color: 'teal', rot: [-25, 0, 0], round: 0.5 })
      .capsule([0.2, 0.78, 0.2], [0, 0.92, -0.78], { color: 'teal', rot: [0, 0, 90] })
      .box([0.4, 0.14, 0.3], [0, 0.55, -0.35], { color: 'cream', rot: [-20, 0, 0], round: 0.6 });
    for (const x of [-0.28, 0.28]) for (const z of [-0.6, 0.8]) b.cone([0.07, 0.18, 0.07], [x, 0.09, z], { color: 'darkwood', rot: [180, 0, 0] });
    return b.done();
  }),
  e('chalk (material)', 'nature', 'rocks', () =>
    m('chalk (material)')
      .ball([0.13, 0.08, 0.1], [0, 0.04, 0], { color: '#f4f2ea' })
      .ball([0.08, 0.065, 0.075], [0.07, 0.035, 0.02], { color: '#ebe8de' })
      .ball([0.05, 0.035, 0.04], [-0.07, 0.02, 0.04], { color: '#f4f2ea' })
      .ball([0.03, 0.02, 0.02], [0.02, 0.078, 0.02], { color: '#dcd8cc', noInk: true })
      .done(),
  ),
  e('chalk (writing)', 'study', 'school supplies', () => {
    const b = m('chalk (writing)').box([0.1, 0.04, 0.06], [0, 0.02, -0.01], { color: 'blue', round: 0.15 }).stick([-0.03, 0.006, 0.06], [0.05, 0.006, 0.045], 0.012, 'pink');
    ['white', 'yellow', 'pink', 'white'].forEach((c, i) => b.cyl([0.012, 0.08, 0.012], [-0.03 + i * 0.02, 0.06, -0.01], { color: c }));
    return b.done();
  }),
  e('chalkboard', 'study', 'classroom', () => {
    const b = m('chalkboard')
      .box([1.28, 0.88, 0.035], [0, 0.75, -0.005], { color: 'wood', round: 0.2 })
      .box([1.2, 0.8, 0.04], [0, 0.75, 0], { color: '#2f5d40', round: 0.05 })
      .box([1.2, 0.03, 0.07], [0, 0.34, 0.04], { color: 'wood' })
      .box([0.06, 0.015, 0.015], [0.3, 0.362, 0.05], { color: 'white' })
      .torus([0.16, 0.16, 0.01], [0.35, 0.82, 0.022], { color: 'white', tube: 0.08, noInk: true });
    for (const [x, y, w] of [[-0.25, 0.98, 0.5], [-0.3, 0.88, 0.4], [-0.22, 0.78, 0.55], [-0.32, 0.68, 0.35]] as const) b.box([w, 0.02, 0.01], [x, y, 0.022], { color: 'white', noInk: true });
    b.pair((s) => b.stick([s * 0.5, 0.05, 0], [s * 0.5, 0.36, 0], 0.05, 'wood').box([0.14, 0.1, 0.45], [s * 0.5, 0.05, 0], { color: 'wood', round: 0.3 }));
    return b.done();
  }),
  e('chandelier', 'home', 'lighting', () => {
    const b = m('chandelier')
      .stick([0, 1.0, 0], [0, 0.72, 0], 0.025, 'brass')
      .ball([0.16, 0.24, 0.16], [0, 0.62, 0], { color: 'brass' })
      .ball([0.06, 0.08, 0.06], [0, 0.47, 0], { color: 'glass' });
    around(6, 0.34).forEach(([x, z]) => {
      path(b, [[x * 0.15, 0.6, z * 0.15], [x * 0.55, 0.5, z * 0.55], [x, 0.52, z]], 0.025, 'brass');
      b.cyl([0.06, 0.02, 0.06], [x, 0.53, z], { color: 'brass' }).cyl([0.03, 0.09, 0.03], [x, 0.585, z], { color: 'white' }).ball([0.025, 0.045, 0.025], [x, 0.655, z], { color: 'flame', glow: true });
      b.ball([0.03, 0.05, 0.03], [x * 0.6, 0.45, z * 0.6], { color: 'glass' });
    });
    return b.done();
  }),
  e('changing table', 'home', 'nursery', () => {
    const b = m('changing table')
      .box([1.0, 0.85, 0.5], [0, 0.425, 0], { color: 'white', round: 0.05 })
      .box([0.86, 0.08, 0.44], [0, 0.89, 0.01], { color: 'pink', round: 0.6 })
      .box([1.0, 0.1, 0.03], [0, 0.94, -0.235], { color: 'white' });
    b.pair((s) => b.box([0.03, 0.1, 0.5], [s * 0.485, 0.94, 0], { color: 'white' }));
    b.each(3, (i) => b.box([0.9, 0.22, 0.02], [0, 0.15 + i * 0.25, 0.255], { color: 'skyblue', round: 0.2 }).ball(0.04, [0, 0.15 + i * 0.25, 0.27], { color: 'white' }));
    return b.done();
  }),
  e('charcoal', 'kitchen', 'grilling', () => {
    const b = m('charcoal');
    const pts: Array<[number, number, number]> = [...around(6, 0.065).map(([x, z]) => [x, 0.02, z] as [number, number, number]), [0, 0.02, 0], ...around(4, 0.035, 0.6).map(([x, z]) => [x, 0.05, z] as [number, number, number]), [0, 0.08, 0]];
    pts.forEach(([x, y, z], i) => b.ball([0.06, 0.036, 0.05], [x, y, z], { color: i === 3 || i === 9 ? '#e8662a' : i % 2 ? '#3a3633' : '#2a2726', rot: [i * 20, i * 50, 0] }));
    return b.done();
  }),
  e('charger (electronics)', 'tech', 'cables', () => {
    const b = m('charger (electronics)').box([0.045, 0.045, 0.045], [0, 0.0225, 0], { color: 'white', round: 0.25 }).box([0.014, 0.008, 0.026], [0.14, 0.006, 0.03], { color: 'silver' });
    b.pair((s) => b.stick([s * 0.009, 0.045, 0], [s * 0.009, 0.068, 0], 0.005, 'silver'));
    return path(b, [[0.02, 0.006, 0], [0.06, 0.004, 0.025], [0.1, 0.004, -0.01], [0.13, 0.004, 0.03]], 0.006, 'white').done();
  }),
  e('chariot', 'garage', 'horse-drawn', () => {
    const b = m('chariot', { view: 'side' })
      .box([1.2, 0.08, 1.0], [0, 0.78, 0], { color: 'wood' })
      .box([1.2, 0.7, 0.9], [0, 1.1, 0.05], { color: 'gold', round: 0.6 })
      .box([1.22, 0.1, 0.92], [0, 1.4, 0.05], { color: 'red', round: 0.6 })
      .rod([0, 0.8, 0.45], [0, 1.0, 2.2], 0.1, 'wood')
      .stick([-0.6, 1.0, 2.1], [0.6, 1.0, 2.1], 0.08, 'wood');
    b.pair((s) => spoked(b, s * 0.75, 0.65, -0.1, 1.3, 'darkwood', 6));
    return b.done();
  }),
  e('charm', 'wardrobe', 'jewellery', () => {
    const b = m('charm').heart(0.05, [0, 0.032, 0], { color: 'gold' }).torus([0.018, 0.018, 0.004], [0, 0.064, 0], { color: 'gold', tube: 0.25 });
    b.each(3, (i) => b.torus([0.012, 0.016, 0.003], [0, 0.078 + i * 0.012, 0], { color: 'gold', rot: [0, i % 2 ? 0 : 90, 0], tube: 0.3 }));
    return b.done();
  }),
  e('chase', 'ideas', 'actions', () => {
    const b = m('chase')
      .box([0.4, 0.03, 0.12], [0, 0.015, 0], { color: 'wood', round: 0.3 })
      .ball([0.11, 0.06, 0.055], [-0.07, 0.085, 0], { color: 'orange' })
      .ball(0.055, [-0.005, 0.11, 0], { color: 'orange' })
      .rod([-0.12, 0.09, 0], [-0.17, 0.15, 0], 0.016, 'orange')
      .ball([0.05, 0.032, 0.03], [0.13, 0.05, 0], { color: 'gray' })
      .cone([0.025, 0.03, 0.02], [0.17, 0.05, 0], { color: 'gray', rot: [0, 0, -90] })
      .rod([0.105, 0.045, 0], [0.06, 0.04, 0], 0.005, 'pink');
    b.pair((s) => {
      b.wedge([0.022, 0.025, 0.01], [-0.005 + s * 0.015, 0.142, 0], { color: 'orange' });
      b.ball(0.014, [0.14, 0.072, s * 0.01], { color: 'pink' });
      b.rod([-0.07 + s * 0.035, 0.07, 0], [-0.07 + s * 0.06, 0.035, 0], 0.014, 'orange');
      b.ball(0.008, [0.01, 0.117, s * 0.012 + 0.0], { color: 'black', noInk: true });
    });
    b.each(3, (i) => b.box([0.06, 0.006, 0.004], [-0.2, 0.07 + i * 0.025, 0.03], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('checkbook', 'study', 'office', () => {
    const b = m('checkbook')
      .box([0.18, 0.015, 0.04], [0, 0.0075, 0], { color: 'darkgray', round: 0.3 })
      .box([0.17, 0.08, 0.012], [0, 0.055, -0.004], { color: 'leather', rot: [-8, 0, 0], round: 0.2 })
      .box([0.16, 0.07, 0.003], [0, 0.056, 0.004], { color: '#dff0e0', rot: [-8, 0, 0] })
      .label('PAY', [0.04, 0.015], [-0.05, 0.07, 0.007], { color: '#dff0e0', rot: [-8, 0, 0] });
    b.each(3, (i) => b.box([0.1, 0.002, 0.002], [0.02, 0.07 - i * 0.017, 0.007 + i * 0.002], { color: 'gray', rot: [-8, 0, 0], noInk: true }));
    return b.done();
  }),
  e('checkerboard', 'toys', 'board games', () => {
    const b = m('checkerboard');
    board(b, 0.4, 8, 'red', 'black');
    return b.done();
  }),
  e('checkers', 'toys', 'board games', () => {
    const b = m('checkers');
    const at = board(b, 0.4, 8, 'red', 'black');
    for (const [i, j, c] of [[0, 1, 'red'], [2, 1, 'red'], [3, 2, 'red'], [5, 0, 'red'], [6, 5, 'black'], [4, 7, 'black'], [1, 6, 'black'], [3, 4, 'black']] as const)
      b.cyl([0.042, 0.012, 0.042], at(i, j, 0.02), { color: c === 'red' ? '#c0302a' : '#2a2726', rot: [75, 0, 0] });
    b.cyl([0.045, 0.014, 0.045], [0.12, 0.007, 0.12], { color: '#c0302a' }).cyl([0.045, 0.014, 0.045], [0.12, 0.021, 0.12], { color: '#c0302a' });
    return b.done();
  }),
  e('cheddar', 'food', 'cheese', () =>
    m('cheddar')
      .box([0.26, 0.015, 0.2], [0, 0.0075, 0], { color: 'wood', round: 0.3 })
      .box([0.14, 0.08, 0.1], [-0.03, 0.055, -0.02], { color: '#f0a030', round: 0.1 })
      .box([0.1, 0.07, 0.012], [0.08, 0.05, 0.05], { color: '#f0a030', rot: [-20, -30, 0], round: 0.1 })
      .box([0.025, 0.025, 0.025], [-0.02, 0.028, 0.07], { color: '#f0a030', rot: [0, 20, 0] })
      .box([0.025, 0.025, 0.025], [-0.06, 0.028, 0.06], { color: '#f0a030', rot: [0, -10, 0] })
      .done(),
  ),
  e('cheekbone', 'clinic', 'bones', () => {
    const bone = '#f0e8d0';
    const b = m('cheekbone')
      .box([0.22, 0.2, 0.2], [0, 0.1, 0], { color: 'darkwood', round: 0.1 })
      .ball([0.2, 0.22, 0.24], [0, 0.35, -0.01], { color: bone })
      .box([0.14, 0.09, 0.12], [0, 0.25, 0.05], { color: bone, round: 0.6 })
      .box([0.08, 0.025, 0.01], [0, 0.225, 0.11], { color: 'white' })
      .cone([0.03, 0.03, 0.01], [0, 0.27, 0.11], { color: '#3a3330', rot: [180, 0, 0] });
    b.pair((s) => b.ball([0.055, 0.045, 0.02], [s * 0.042, 0.32, 0.1], { color: '#3a3330' }).ball([0.06, 0.03, 0.07], [s * 0.075, 0.28, 0.06], { color: 'orange' }));
    return b.done();
  }),
  e('cheerleader outfit', 'wardrobe', 'outfits', () => who('cheerleader outfit', { top: 'red', skirt: 'red', shoes: 'white', style: 'ponytail', acc: [hat('bow', 'white')] })),
  e('cheese', 'food', 'cheese', () => {
    const b = m('cheese').wedge([0.2, 0.12, 0.12], [0, 0.06, 0], { color: 'cheese', apex: -0.5 });
    for (const [x, y, d] of [[-0.07, 0.07, 0.03], [0.03, 0.02, 0.022], [-0.04, 0.025, 0.018], [-0.085, 0.025, 0.014]] as const) b.ball([d, d, 0.01], [x, y, 0.061], { color: '#d9a52f', noInk: true });
    return b.done();
  }),
  e('cheeseburger', 'food', 'fast food', () => {
    const b = m('cheeseburger')
      .cyl([0.11, 0.025, 0.11], [0, 0.0125, 0], { color: 'bread' })
      .cyl([0.118, 0.022, 0.118], [0, 0.036, 0], { color: 'darkbrown' })
      .box([0.105, 0.006, 0.105], [0, 0.05, 0], { color: 'cheese', rot: [0, 45, 0], round: 0 })
      .cyl([0.125, 0.008, 0.125], [0, 0.056, 0], { color: 'lettuce' })
      .cyl([0.1, 0.01, 0.1], [0, 0.064, 0], { color: 'tomato' })
      .ball([0.115, 0.065, 0.115], [0, 0.07, 0], { color: 'bread' });
    around(6, 0.03).forEach(([x, z]) => b.ball([0.008, 0.004, 0.005], [x, 0.098, z + 0.01], { color: 'cream', noInk: true }));
    return b.done();
  }),
  e('cheesecake', 'food', 'desserts', () =>
    plate(m('cheesecake'), 0.18)
      .wedge([0.1, 0.12, 0.015], [0, 0.022, 0.0], { color: 'crust', rot: [-90, 0, 0] })
      .wedge([0.1, 0.12, 0.045], [0, 0.052, 0.0], { color: 'cream', rot: [-90, 0, 0] })
      .wedge([0.1, 0.12, 0.008], [0, 0.078, 0.0], { color: 'darkred', rot: [-90, 0, 0] })
      .ball([0.025, 0.03, 0.025], [0, 0.093, 0.03], { color: 'red' })
      .done(),
  ),
  e('chef hat', 'wardrobe', 'hats', () => {
    const b = m('chef hat').cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: 'white' }).ball([0.17, 0.17, 0.17], [0, 0.2, 0], { color: 'white' });
    around(5, 0.065).forEach(([x, z]) => b.ball(0.12, [x, 0.16, z], { color: 'white' }));
    b.each(5, (i) => b.box([0.004, 0.07, 0.004], [-0.06 + i * 0.03, 0.04, 0.1], { color: 'lightgray', noInk: true }));
    return b.done();
  }),
  e('cherry', 'food', 'fruit', () => {
    const b = m('cherry').ball([0.04, 0.012, 0.02], [0.03, 0.112, 0], { color: 'leaf', rot: [0, 0, -20] });
    b.pair((s) => b.ball(0.045, [s * 0.03, 0.0225, 0], { color: 'darkred' }).rod([s * 0.03, 0.04, 0], [0.004, 0.11, 0], 0.004, 'green').ball([0.01, 0.014, 0.006], [s * 0.03 + 0.01, 0.033, 0.02], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('cherry bomb', 'toys', 'fireworks', () =>
    m('cherry bomb')
      .ball(0.05, [0, 0.025, 0], { color: 'red' })
      .rod([0, 0.05, 0], [0.01, 0.075, 0], 0.005, 'green')
      .star(0.03, [0.012, 0.085, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('cherry picker', 'garage', 'construction vehicles', () => {
    const b = m('cherry picker', { view: 'side' })
      .box([2.2, 0.8, 6], [0, 1.0, -0.3], { color: 'white', round: 0.1 })
      .box([2.2, 1.6, 1.8], [0, 1.9, 2.3], { color: 'white', round: 0.2 })
      .box([2.24, 0.7, 1.2], [0, 2.2, 2.5], { color: 'glass', round: 0.2 })
      .cyl([1.2, 0.4, 1.2], [0, 1.6, -1.5], { color: 'darkgray' })
      .rod([0, 1.8, -1.5], [0, 6.0, -0.5], 0.5, 'orange')
      .rod([0, 6.0, -0.5], [0, 8.4, 1.5], 0.42, 'orange')
      .ball(0.6, [0, 6.0, -0.5], { color: 'darkgray' })
      .box([1.4, 1.1, 1.4], [0, 8.6, 2.1], { color: 'yellow', round: 0.1 })
      .box([1.5, 0.1, 1.5], [0, 9.25, 2.1], { color: 'yellow' });
    b.pair((s) => b.stick([s * 1.1, 0.9, -2.8], [s * 1.6, 0.05, -2.8], 0.15, 'yellow'));
    return wheels(b, 1.0, [1.8, -1.9], 1.0).done();
  }),
  e('cherry pie', 'food', 'desserts', () => {
    const b = m('cherry pie')
      .cyl([0.22, 0.035, 0.22], [0, 0.0175, 0], { color: 'silver', taper: 1.15 })
      .cyl([0.22, 0.012, 0.22], [0, 0.04, 0], { color: 'darkred' })
      .torus([0.25, 0.25, 0.035], [0, 0.045, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.12 });
    for (const k of [-0.06, 0, 0.06]) b.stick([-0.1, 0.05, k], [0.1, 0.05, k], 0.016, 'bread').stick([k, 0.054, -0.1], [k, 0.054, 0.1], 0.016, 'bread');
    return b.ball(0.025, [0.03, 0.052, 0.03], { color: 'red' }).ball(0.025, [-0.03, 0.052, -0.03], { color: 'red' }).done();
  }),
  e('cherry soda', 'food', 'drinks', () => {
    const b = drink(m('cherry soda'), 0.16, 0.075, 'red', 0.8)
      .stick([0.012, 0.11, 0], [0.03, 0.22, 0], 0.008, 'white')
      .ball(0.026, [-0.018, 0.17, 0.01], { color: 'darkred' })
      .rod([-0.018, 0.182, 0.01], [-0.012, 0.21, 0.0], 0.003, 'green')
      .box([0.03, 0.025, 0.03], [0.012, 0.135, -0.01], { color: 'ice', rot: [0, 30, 10] });
    b.each(4, (i) => b.ball(0.007, [-0.02 + i * 0.013, 0.04 + (i % 2) * 0.04, 0.038], { color: 'pink', noInk: true }));
    return b.done();
  }),
  e('cherry tomato', 'food', 'vegetables', () => {
    const b = m('cherry tomato');
    const toms: V[] = [[-0.04, 0.019, 0], [0.005, 0.019, 0.02], [0.045, 0.02, -0.005]];
    path(b, [[-0.05, 0.075, -0.01], [0, 0.085, 0], [0.05, 0.07, -0.01]], 0.007, 'green');
    for (const [x, y, z] of toms) b.ball(0.038, [x, y, z], { color: 'tomato' }).ball([0.024, 0.006, 0.024], [x, y + 0.019, z], { color: 'green' }).rod([x, y + 0.02, z], [x * 0.8, 0.078, -0.005], 0.004, 'green');
    return b.done();
  }),
  e('cherry tree', 'garden', 'trees', () => {
    const b = m('cherry tree')
      .cyl([0.4, 2.8, 0.4], [0, 1.4, 0], { color: 'bark', taper: 0.6 })
      .rod([0, 2.3, 0], [-0.9, 3.0, 0.2], 0.16, 'bark')
      .rod([0, 2.4, 0], [0.9, 3.1, -0.1], 0.16, 'bark')
      .ball([3.4, 2.4, 3.2], [0, 3.7, 0], { color: 'pink', name: 'top', pivot: [0, 2.4, 0] })
      .ball([1.9, 1.5, 1.9], [-1.4, 3.3, 0.4], { color: '#f8c8dc', parent: 'top' })
      .ball([1.9, 1.5, 1.9], [1.4, 3.4, 0.2], { color: '#f8c8dc', parent: 'top' })
      .ball([2.0, 1.4, 2.0], [0.2, 4.7, -0.2], { color: '#f8c8dc', parent: 'top' });
    for (const [x, y] of [[-0.6, 3.0], [0.7, 3.3], [0.1, 4.2], [-1.5, 3.7], [1.2, 2.9]]) b.ball(0.16, [x, y, 1.55], { color: 'darkred', parent: 'top' });
    return b.done();
  }),
  e('chess piece', 'toys', 'board games', () =>
    m('chess piece')
      .cyl([0.042, 0.01, 0.042], [0, 0.005, 0], { color: 'black' })
      .cyl([0.034, 0.012, 0.034], [0, 0.016, 0], { color: 'black', taper: 0.85 })
      .box([0.022, 0.045, 0.03], [0, 0.042, -0.004], { color: 'black', rot: [-12, 0, 0], round: 0.5 })
      .box([0.02, 0.02, 0.04], [0, 0.064, 0.008], { color: 'black', rot: [25, 0, 0], round: 0.5 })
      .box([0.006, 0.04, 0.008], [0, 0.055, -0.02], { color: 'darkgray', rot: [-12, 0, 0] })
      .cone([0.008, 0.014, 0.008], [0.005, 0.08, -0.006], { color: 'black' })
      .cone([0.008, 0.014, 0.008], [-0.005, 0.08, -0.006], { color: 'black' })
      .done(),
  ),
  e('chest', 'home', 'storage', () => {
    const b = m('chest')
      .box([0.6, 0.35, 0.4], [0, 0.175, 0], { color: 'wood', round: 0.06 })
      .cyl([0.4, 0.6, 0.4], [0, 0.35, 0], { color: 'wood', rot: [0, 0, 90], name: 'lid', pivot: [0, 0.35, -0.2] })
      .box([0.08, 0.1, 0.03], [0, 0.33, 0.21], { color: 'gold', round: 0.3 })
      .ball(0.018, [0, 0.31, 0.225], { color: 'black' });
    b.pair((s) => b.box([0.05, 0.36, 0.41], [s * 0.2, 0.175, 0], { color: 'gold', round: 0.1 }).cyl([0.42, 0.05, 0.42], [s * 0.2, 0.35, 0], { color: 'gold', rot: [0, 0, 90], parent: 'lid' }));
    return b.done();
  }),
  e('chicken breast', 'food', 'meat', () => {
    const b = plate(m('chicken breast'), 0.2).ball([0.13, 0.04, 0.09], [0, 0.035, 0], { color: '#d9a066', rot: [0, 20, 0] }).ball([0.03, 0.008, 0.02], [0.05, 0.05, 0.03], { color: 'leaf' });
    b.each(3, (i) => b.box([0.09, 0.004, 0.01], [-0.02 + i * 0.025, 0.055, 0], { color: '#7a4a2a', rot: [0, 45, 0], noInk: true }));
    return b.done();
  }),
  e('chicken coop', 'farm', 'farm buildings', () => {
    const b = m('chicken coop')
      .box([1.4, 0.9, 1.0], [0, 1.05, 0], { color: '#b5523b', round: 0.05 })
      .wedge([1.6, 0.5, 1.2], [0, 1.75, 0], { color: 'darkgray' })
      .box([0.3, 0.35, 0.05], [0.3, 0.78, 0.52], { color: 'cream', name: 'door', pivot: [0.15, 0.78, 0.52] })
      .box([0.3, 0.04, 0.9], [0.3, 0.33, 0.85], { color: 'wood', rot: [38, 0, 0] })
      .label('COOP', [0.5, 0.18], [-0.3, 1.25, 0.52], { color: 'white' })
      .ball([0.16, 0.14, 0.2], [0.3, 0.55, 0.75], { color: 'white' })
      .ball(0.09, [0.3, 0.65, 0.84], { color: 'white' })
      .box([0.02, 0.05, 0.05], [0.3, 0.71, 0.84], { color: 'red' })
      .cone([0.03, 0.04, 0.02], [0.3, 0.64, 0.9], { color: 'orange', rot: [90, 0, 0] });
    for (const [x, z] of [[0.6, 0.4], [-0.6, 0.4], [0.6, -0.4], [-0.6, -0.4]]) b.box([0.1, 0.62, 0.1], [x, 0.31, z], { color: 'wood' });
    return b.done();
  }),
  e('chicken feed', 'farm', 'farm things', () => {
    const b = m('chicken feed')
      .box([0.18, 0.2, 0.12], [0, 0.1, 0], { color: '#c8a978', round: 0.5 })
      .cyl([0.08, 0.05, 0.06], [0, 0.22, 0], { color: '#c8a978', taper: 1.6 })
      .torus([0.06, 0.06, 0.01], [0, 0.205, 0], { color: 'darkbrown', rot: [90, 0, 0], tube: 0.2 })
      .label('FEED', [0.11, 0.05], [0, 0.11, 0.065], { color: 'white' });
    for (const [x, z] of [[0.05, 0.1], [0.08, 0.12], [0.02, 0.13], [0.1, 0.09], [-0.03, 0.11], [0.06, 0.15]]) b.ball(0.014, [x, 0.007, z], { color: 'yellow' });
    return b.done();
  }),
  e('chicken finger', 'food', 'fast food', () => {
    const b = m('chicken finger')
      .box([0.18, 0.04, 0.12], [0, 0.02, 0], { color: 'red', round: 0.3 })
      .box([0.17, 0.006, 0.11], [0, 0.042, 0], { color: 'white' })
      .cyl([0.04, 0.025, 0.04], [0.12, 0.0125, 0.06], { color: 'white' })
      .cyl([0.034, 0.006, 0.034], [0.12, 0.026, 0.06], { color: 'honey' });
    for (const [x, y, ry, rz] of [[-0.03, 0.055, 20, 90], [0.02, 0.058, -15, 85], [0.0, 0.075, 5, 95]] as const) b.capsule([0.032, 0.12, 0.026], [x, y, 0], { color: '#d9962e', rot: [0, ry, rz] });
    return b.done();
  }),
  e('chicken leg', 'food', 'meat', () => {
    const P = diag(-0.06, 0.04, 40);
    return m('chicken leg')
      .ball([0.075, 0.12, 0.07], P(0.05), { color: '#b5652e', rot: [0, 0, -50] })
      .stick(P(0.09), P(0.17), 0.018, 'cream')
      .ball(0.026, P(0.178, 0.009), { color: 'cream' })
      .ball(0.026, P(0.178, -0.009), { color: 'cream' })
      .done();
  }),
  e('chicken nugget', 'food', 'fast food', () => {
    const b = plate(m('chicken nugget'), 0.18).cyl([0.04, 0.025, 0.04], [0.05, 0.02, -0.04], { color: 'white' }).cyl([0.034, 0.006, 0.034], [0.05, 0.033, -0.04], { color: 'red' });
    for (const [x, y, z, r] of [[-0.04, 0.02, 0.02, 10], [0.0, 0.02, 0.04, -20], [-0.02, 0.02, -0.03, 40], [-0.02, 0.042, 0.01, 70]] as const) b.ball([0.05, 0.025, 0.04], [x, y, z], { color: '#d9962e', rot: [0, r, 8] });
    return b.done();
  }),
  e('chili', 'food', 'meals', () => {
    const b = bowl(m('chili'), 0.16, 0.07, 'white', '#8a2e1a')
      .ball([0.035, 0.015, 0.03], [0.01, 0.072, 0.01], { color: 'white' })
      .cone([0.025, 0.1, 0.025], [0.02, 0.082, 0.06], { color: 'red', rot: [0, 0, -100] })
      .cyl([0.015, 0.02, 0.015], [-0.035, 0.08, 0.06], { color: 'green', rot: [0, 0, 80] });
    around(5, 0.04, 0.3).forEach(([x, z]) => b.ball([0.016, 0.01, 0.012], [x, 0.068, z], { color: 'darkred' }));
    return b.done();
  }),
  e('chime', 'music', 'bells', () => {
    const b = m('chime')
      .cyl([0.12, 0.025, 0.12], [0, 0.27, 0], { color: 'wood' })
      .torus([0.03, 0.03, 0.006], [0, 0.3, 0], { color: 'silver', tube: 0.2 })
      .stick([0, 0.26, 0], [0, 0.06, 0], 0.002, 'gray')
      .cyl([0.04, 0.008, 0.04], [0, 0.13, 0], { color: 'wood' })
      .box([0.03, 0.05, 0.004], [0, 0.04, 0], { color: 'wood' });
    around(5, 0.045, 0.3).forEach(([x, z], i) => {
      const L = 0.08 + i * 0.015;
      b.stick([x, 0.26, z], [x, 0.24, z], 0.002, 'gray').cyl([0.014, L, 0.014], [x, 0.24 - L / 2, z], { color: 'silver' });
    });
    return b.done();
  }),
  e('chimney', 'places', 'house parts', () => {
    const b = m('chimney')
      .wedge([4.2, 1.6, 3], [0, 0.8, 0], { color: 'darkgray' })
      .box([0.9, 2.6, 0.9], [0.8, 1.9, 0], { color: '#b5523b' })
      .box([1.05, 0.15, 1.05], [0.8, 3.25, 0], { color: 'stone' })
      .cyl([0.25, 0.35, 0.25], [0.65, 3.5, 0], { color: '#c8673a' })
      .cyl([0.25, 0.35, 0.25], [0.97, 3.5, 0], { color: '#c8673a' })
      .ball(0.5, [1.0, 4.1, 0], { color: 'lightgray' })
      .ball(0.7, [1.4, 4.7, 0], { color: 'lightgray' })
      .ball(0.9, [2.0, 5.4, 0], { color: 'lightgray' });
    b.each(5, (i) => b.box([0.92, 0.03, 0.03], [0.8, 1.2 + i * 0.4, 0.46], { color: 'cream', noInk: true }));
    return b.done();
  }),
  e('chip', 'food', 'snacks', () => {
    const b = bowl(m('chip'), 0.16, 0.06, 'red', '#f2c14e');
    for (const [x, y, z, r] of [[-0.03, 0.08, 0.0, [60, 0, 20]], [0.03, 0.08, 0.01, [70, 30, -25]], [0.0, 0.085, -0.03, [40, 0, 0]], [0.01, 0.075, 0.04, [20, 50, 10]]] as const)
      b.ball([0.06, 0.012, 0.05], [x, y, z], { color: '#f2c14e', rot: r as V });
    return b.done();
  }),
  e('chisel', 'workshop', 'hand tools', () => {
    const P = diag(-0.06, 0.02, 55);
    return m('chisel')
      .rod(P(0), P(0.1), 0.032, 'wood')
      .stick(P(0.105), P(0.125), 0.026, 'silver')
      .box([0.022, 0.12, 0.007], P(0.185), { color: 'steel', rot: [0, 0, -35] })
      .done();
  }),
  e('chocolate', 'food', 'sweets', () => {
    const b = m('chocolate')
      .box([0.08, 0.14, 0.012], [0, 0.07, 0], { color: 'chocolate', round: 0.1 })
      .box([0.084, 0.06, 0.02], [0, 0.03, 0], { color: 'red', round: 0.2 })
      .box([0.086, 0.008, 0.022], [0, 0.062, 0], { color: 'silver' })
      .box([0.024, 0.03, 0.012], [0.07, 0.006, 0.05], { color: 'chocolate', rot: [90, 0, 20] });
    for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) b.box([0.022, 0.03, 0.005], [-0.025 + c * 0.025, 0.09 + r * 0.034, 0.007], { color: '#7a4a2e', round: 0.3 });
    return b.done();
  }),
  e('chocolate cake', 'food', 'desserts', () => {
    const b = plate(m('chocolate cake'), 0.3)
      .cyl([0.22, 0.1, 0.22], [0, 0.065, 0], { color: 'chocolate' })
      .cyl([0.226, 0.016, 0.226], [0, 0.12, 0], { color: '#3e2416' });
    around(10, 0.112).forEach(([x, z], i) => b.capsule([0.016, 0.03 + (i % 3) * 0.01, 0.01], [x, 0.105, z], { color: '#3e2416' }));
    around(5, 0.07).forEach(([x, z]) => b.ball(0.025, [x, 0.138, z], { color: 'white' }).ball(0.02, [x, 0.155, z], { color: 'darkred' }));
    return b.done();
  }),
  e('chocolate chip', 'food', 'baking', () =>
    m('chocolate chip')
      .ball([0.05, 0.025, 0.05], [0, 0.0125, 0], { color: 'chocolate' })
      .cone([0.05, 0.045, 0.05], [0, 0.035, 0], { color: 'chocolate' })
      .ball([0.025, 0.013, 0.025], [0.05, 0.0065, 0.02], { color: 'chocolate' })
      .cone([0.025, 0.022, 0.025], [0.05, 0.018, 0.02], { color: 'chocolate' })
      .ball([0.025, 0.013, 0.025], [-0.045, 0.0065, 0.025], { color: 'chocolate' })
      .cone([0.025, 0.022, 0.025], [-0.045, 0.018, 0.025], { color: 'chocolate' })
      .done(),
  ),
  e('choker', 'wardrobe', 'jewellery', () =>
    m('choker')
      .torus([0.12, 0.12, 0.018], [0, 0.07, 0], { color: 'black', rot: [105, 0, 0], tube: 0.12 })
      .torus([0.014, 0.014, 0.004], [0, 0.046, 0.06], { color: 'gold', tube: 0.25 })
      .ball([0.022, 0.03, 0.012], [0, 0.026, 0.062], { color: 'red' })
      .done(),
  ),
  e('chop sticks', 'kitchen', 'utensils', () =>
    bowl(m('chop sticks'), 0.13, 0.07, 'white', 'white')
      .ball([0.11, 0.04, 0.11], [0, 0.07, 0], { color: 'white' })
      .torus([0.13, 0.13, 0.012], [0, 0.04, 0], { color: 'red', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .stick([0.07, 0.23, -0.02], [-0.01, 0.07, 0.01], 0.009, 'darkred', { taper: 0.5 })
      .stick([0.085, 0.225, -0.005], [0.005, 0.07, 0.02], 0.009, 'darkred', { taper: 0.5 })
      .done(),
  ),
  e('christmas lights', 'toys', 'holiday things', () => {
    const b = m('christmas lights');
    const cols = ['red', 'green', 'blue', 'yellow'];
    for (const x of [-1.2, 0, 1.2]) b.ball([0.45, 0.22, 0.45], [x, 0.05, 0], { color: 'snow' }).stick([x, 0.1, 0], [x, 1.95, 0], 0.06, 'darkwood');
    let k = 0;
    for (const x0 of [-1.2, 0]) {
      const pts: V[] = Array.from({ length: 7 }, (_, i) => {
        const t = i / 6;
        return [x0 + 1.2 * t, 1.9 - 0.45 * Math.sin(t * Math.PI), 0.04] as V;
      });
      path(b, pts, 0.02, 'darkgreen');
      pts.slice(1, -1).forEach(([x, y]) => b.ball([0.07, 0.11, 0.07], [x, y - 0.07, 0.04], { color: cols[k++ % 4], glow: true }));
    }
    return b.done();
  }),
  e('christmas stocking', 'toys', 'holiday things', () =>
    m('christmas stocking')
      .box([0.22, 0.42, 0.08], [0, 0.4, 0], { color: 'red', round: 0.3 })
      .box([0.34, 0.2, 0.08], [0.07, 0.11, 0], { color: 'red', round: 0.8 })
      .ball([0.09, 0.13, 0.085], [0.19, 0.1, 0], { color: 'green' })
      .ball([0.1, 0.11, 0.085], [-0.07, 0.09, 0], { color: 'green' })
      .box([0.27, 0.12, 0.1], [0, 0.64, 0], { color: 'white', round: 0.6 })
      .torus([0.06, 0.06, 0.012], [-0.1, 0.72, 0], { color: 'white', tube: 0.2 })
      .rod([0.04, 0.6, -0.01], [0.04, 0.76, -0.01], 0.022, 'red')
      .rod([0.04, 0.76, -0.01], [0.08, 0.76, -0.01], 0.022, 'white')
      .done(),
  ),
  e('christmas sweater', 'wardrobe', 'sweaters', () => {
    const b = m('christmas sweater')
      .box([0.5, 0.55, 0.16], [0, 0.35, 0], { color: 'red', round: 0.3 })
      .box([0.52, 0.06, 0.17], [0, 0.1, 0], { color: 'green', round: 0.4 })
      .box([0.2, 0.05, 0.12], [0, 0.63, 0], { color: 'green', round: 0.5 })
      .box([0.5, 0.05, 0.002], [0, 0.55, 0.081], { color: 'white', noInk: true })
      .wedge([0.15, 0.18, 0.01], [0, 0.36, 0.082], { color: 'darkgreen' })
      .star(0.05, [0, 0.46, 0.088], { color: 'yellow' });
    b.pair((s) => b.box([0.14, 0.5, 0.14], [s * 0.32, 0.38, 0], { color: 'red', rot: [0, 0, s * 12], round: 0.4 }).box([0.15, 0.06, 0.15], [s * 0.37, 0.15, 0], { color: 'green', rot: [0, 0, s * 12], round: 0.4 }));
    b.each(5, (i) => b.ball(0.02, [-0.16 + i * 0.08, 0.2, 0.082], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('chrysanthemum', 'garden', 'flowers', () => {
    const b = m('chrysanthemum')
      .cyl([0.18, 0.15, 0.18], [0, 0.075, 0], { color: '#c8673a', taper: 1.2 })
      .cyl([0.2, 0.015, 0.2], [0, 0.15, 0], { color: 'dirt' })
      .rod([0, 0.15, 0], [0, 0.55, 0], 0.014, 'green')
      .ball([0.09, 0.02, 0.05], [-0.05, 0.3, 0], { color: 'leaf', rot: [0, 0, 25] })
      .ball([0.09, 0.02, 0.05], [0.05, 0.38, 0], { color: 'leaf', rot: [0, 0, -25] })
      .ball([0.06, 0.06, 0.03], [0, 0.57, 0.01], { color: 'gold', name: 'head', pivot: [0, 0.55, 0] });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      b.rod([Math.cos(a) * 0.03, 0.57 + Math.sin(a) * 0.03, 0.0], [Math.cos(a) * 0.11, 0.57 + Math.sin(a) * 0.11, -0.01], 0.022, 'yellow', { parent: 'head' });
      if (i % 2) b.rod([Math.cos(a + 0.2) * 0.02, 0.57 + Math.sin(a + 0.2) * 0.02, 0.015], [Math.cos(a + 0.2) * 0.07, 0.57 + Math.sin(a + 0.2) * 0.07, 0.01], 0.02, 'orange', { parent: 'head' });
    }
    return b.done();
  }),
  e('church', 'places', 'religious', () => {
    const b = m('church')
      .box([3.5, 3, 6], [0, 1.5, -1.2], { color: 'white', round: 0.02 })
      .wedge([3.8, 2.0, 6.2], [0, 4.0, -1.2], { color: 'darkred' })
      .box([1.5, 5, 1.5], [0, 2.5, 2.4], { color: 'white', round: 0.02 })
      .box([0.6, 0.8, 1.52], [0, 4.3, 2.4], { color: '#3a3330' })
      .cone([1.9, 2.8, 1.9], [0, 6.4, 2.4], { color: 'darkred', segs: 4, rot: [0, 45, 0] })
      .stick([0, 7.7, 2.4], [0, 8.6, 2.4], 0.1, 'gold')
      .stick([-0.25, 8.3, 2.4], [0.25, 8.3, 2.4], 0.1, 'gold')
      .box([0.8, 1.5, 0.08], [0, 0.75, 3.17], { color: 'darkwood', name: 'door', pivot: [-0.4, 0.75, 3.17] })
      .cyl([0.6, 0.05, 0.6], [0, 2.4, 3.16], { color: 'glass', rot: [90, 0, 0] })
      .label('CHURCH', [1.2, 0.3], [0, 1.75, 3.2], { color: 'white' });
    b.pair((s) => b.each(3, (i) => b.box([0.06, 1.2, 0.6], [s * 1.75, 1.6, 0.4 - i * 1.6], { color: 'glass' })));
    return b.done();
  }),
  e('church bell', 'music', 'bells', () => {
    const b = m('church bell')
      .box([1.1, 0.1, 0.16], [0, 1.0, 0], { color: 'darkwood' })
      .cyl([0.5, 0.45, 0.5], [0, 0.56, 0], { color: 'bronze', taper: 0.55 })
      .torus([0.54, 0.54, 0.07], [0, 0.34, 0], { color: 'bronze', rot: [90, 0, 0], tube: 0.18 })
      .ball([0.3, 0.16, 0.3], [0, 0.79, 0], { color: 'bronze' })
      .stick([0, 0.85, 0], [0, 0.95, 0], 0.06, 'iron')
      .stick([0, 0.6, 0], [0, 0.3, 0], 0.03, 'iron')
      .ball(0.09, [0, 0.28, 0], { color: 'iron' });
    b.pair((s) => b.box([0.1, 1.05, 0.12], [s * 0.5, 0.525, 0], { color: 'darkwood' }).box([0.3, 0.08, 0.4], [s * 0.5, 0.04, 0], { color: 'darkwood' }));
    return b.done();
  }),
  e('churros', 'food', 'desserts', () => {
    const b = m('churros')
      .cyl([0.08, 0.08, 0.06], [0, 0.04, 0], { color: 'white', taper: 1.3 })
      .box([0.012, 0.08, 0.066], [0.0, 0.04, 0.0], { color: 'red', noInk: true })
      .cyl([0.05, 0.03, 0.05], [0.09, 0.015, 0.04], { color: 'white' })
      .cyl([0.044, 0.006, 0.044], [0.09, 0.03, 0.04], { color: 'chocolate' });
    for (const [x, rz] of [[-0.02, 12], [0.0, 0], [0.02, -12]] as const) b.cyl([0.024, 0.17, 0.024], [x - Math.sin(rz * RAD) * 0.04, 0.12, 0], { color: '#d9962e', segs: 6, rot: [0, 0, rz] });
    return b.done();
  }),
  e('cider', 'food', 'drinks', () =>
    m('cider')
      .ball([0.16, 0.18, 0.16], [0, 0.1, 0], { color: 'tea' })
      .cyl([0.05, 0.08, 0.05], [0, 0.21, 0], { color: 'tea' })
      .cyl([0.056, 0.025, 0.056], [0, 0.26, 0], { color: 'red' })
      .torus([0.07, 0.08, 0.018], [0.05, 0.2, 0], { color: 'tea', rot: [0, 90, 0], tube: 0.25 })
      .label('CIDER', [0.08, 0.04], [0, 0.1, 0.08], { color: 'cream' })
      .ball(0.07, [0.12, 0.035, 0.07], { color: 'red' })
      .rod([0.12, 0.07, 0.07], [0.125, 0.085, 0.07], 0.006, 'darkbrown')
      .done(),
  ),
  e('cinder', 'nature', 'fire', () =>
    m('cinder')
      .cyl([0.12, 0.01, 0.1], [0, 0.005, 0], { color: 'gray' })
      .ball([0.07, 0.04, 0.06], [-0.01, 0.022, 0], { color: '#3a3330', rot: [0, 30, 10] })
      .ball([0.045, 0.03, 0.04], [0.035, 0.018, 0.02], { color: '#2a2524', rot: [0, -20, 0] })
      .ball([0.025, 0.015, 0.02], [0.0, 0.038, 0.02], { color: 'orange', glow: true })
      .ball([0.02, 0.012, 0.015], [0.035, 0.03, 0.035], { color: 'fire', glow: true })
      .ball([0.018, 0.01, 0.015], [-0.03, 0.03, 0.025], { color: 'red', glow: true })
      .done(),
  ),
  e('cinnamon', 'food', 'spices', () => {
    const b = m('cinnamon').torus([0.05, 0.05, 0.01], [0, 0.075, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.2 });
    around(4, 0.013).forEach(([x, z], i) => b.cyl([0.016, 0.15 - i * 0.008, 0.016], [x, 0.075 - i * 0.004, z], { color: '#8b4a2a' }).box([0.004, 0.14 - i * 0.008, 0.004], [x, 0.075 - i * 0.004, z + 0.008], { color: '#5a2e18', noInk: true }));
    return b.done();
  }),
  e('cinnamon bun', 'food', 'bakery', () => {
    const b = plate(m('cinnamon bun'), 0.16).cyl([0.11, 0.035, 0.11], [0, 0.03, 0], { color: 'bread' }).ball([0.11, 0.035, 0.11], [0, 0.047, 0], { color: 'bread' });
    for (const d of [0.09, 0.062, 0.034]) b.torus([d, d, 0.008], [0, 0.064 - (0.09 - d) * 0.05, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.1, noInk: true });
    path(b, [[-0.04, 0.066, -0.02], [-0.02, 0.068, 0.02], [0.0, 0.068, -0.025], [0.02, 0.068, 0.025], [0.04, 0.066, -0.02]], 0.006, 'white');
    return b.done();
  }),
  e('circle', 'ideas', 'shapes', () => m('circle').box([0.06, 0.012, 0.03], [0, 0.006, 0], { color: 'darkgray' }).torus([0.09, 0.09, 0.016], [0, 0.057, 0], { color: 'blue', tube: 0.15 }).done()),
  e('circuit', 'tech', 'electronics', () => {
    const b = m('circuit')
      .box([0.22, 0.014, 0.15], [0, 0.007, 0], { color: 'wood', round: 0.2 })
      .cyl([0.032, 0.075, 0.032], [-0.05, 0.03, -0.03], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.033, 0.03, 0.033], [-0.07, 0.03, -0.03], { color: 'copper', rot: [0, 0, 90] })
      .cyl([0.022, 0.025, 0.022], [0.065, 0.026, -0.02], { color: 'silver' })
      .ball([0.04, 0.042, 0.04], [0.065, 0.058, -0.02], { color: 'yellow', glow: true })
      .box([0.03, 0.012, 0.02], [0.0, 0.02, 0.045], { color: 'darkgray' })
      .stick([-0.005, 0.026, 0.045], [0.012, 0.038, 0.045], 0.004, 'silver');
    path(b, [[-0.09, 0.03, -0.03], [-0.095, 0.02, 0.045], [-0.015, 0.02, 0.045]], 0.005, 'red');
    path(b, [[0.015, 0.02, 0.045], [0.065, 0.02, 0.045], [0.065, 0.02, -0.005]], 0.005, 'red');
    path(b, [[-0.012, 0.03, -0.03], [0.04, 0.02, -0.03], [0.055, 0.022, -0.02]], 0.005, 'black');
    return b.done();
  }),
  e('circuit breaker', 'tech', 'electrical', () => {
    const b = m('circuit breaker').box([0.12, 0.15, 0.05], [0, 0.075, 0], { color: 'lightgray', round: 0.15 }).box([0.1, 0.13, 0.004], [0, 0.075, 0.025], { color: 'gray' });
    for (const x of [-0.025, 0.025]) b.each(4, (i) => b.box([0.035, 0.022, 0.01], [x, 0.03 + i * 0.03, 0.03], { color: 'black', round: 0.2 }).box([0.008, 0.012, 0.012], [x + (i % 2 ? 0.008 : -0.008), 0.03 + i * 0.03, 0.037], { color: 'white' }));
    return b.done();
  }),
  e('circular saw', 'workshop', 'power tools', () => {
    const b = m('circular saw')
      .cyl([0.18, 0.004, 0.18], [0.0, 0.09, 0.04], { color: 'silver', rot: [90, 0, 0] })
      .ball([0.22, 0.13, 0.06], [0.0, 0.15, -0.005], { color: 'yellow' })
      .cyl([0.12, 0.11, 0.12], [0.0, 0.11, -0.04], { color: 'yellow', rot: [90, 0, 0] })
      .box([0.28, 0.012, 0.14], [0, 0.06, 0.0], { color: 'silver' })
      .cyl([0.03, 0.01, 0.03], [0, 0.09, 0.044], { color: 'darkgray', rot: [90, 0, 0] });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.cone([0.012, 0.012, 0.004], [Math.cos(a) * 0.092, 0.09 + Math.sin(a) * 0.092, 0.04], { color: 'silver', rot: [0, 0, (a * 180) / Math.PI - 90] });
    });
    return path(b, arc(-0.03, 0.2, 0.08, 0.07, 0, 180, 5, -0.02), 0.03, 'black').done();
  }),
  e('clam chowder', 'food', 'soups', () =>
    m('clam chowder')
      .ball([0.18, 0.13, 0.18], [0, 0.065, 0], { color: 'crust' })
      .cyl([0.14, 0.012, 0.14], [0, 0.12, 0], { color: 'cream' })
      .box([0.015, 0.012, 0.015], [0.02, 0.127, 0.02], { color: 'beige' })
      .box([0.015, 0.012, 0.015], [-0.03, 0.127, -0.01], { color: 'beige' })
      .ball([0.012, 0.004, 0.012], [0.0, 0.128, -0.03], { color: 'leaf' })
      .ball([0.12, 0.04, 0.12], [0.12, 0.05, -0.06], { color: 'crust', rot: [0, 0, 35] })
      .ball([0.045, 0.02, 0.04], [0.09, 0.01, 0.09], { color: 'tan' })
      .done(),
  ),
  e('clarinet', 'music', 'woodwinds', () => {
    const b = m('clarinet')
      .cyl([0.075, 0.075, 0.075], [0, 0.0375, 0], { color: 'black', taper: 0.45 })
      .cyl([0.032, 0.56, 0.032], [0, 0.35, 0], { color: 'black' })
      .cyl([0.04, 0.04, 0.04], [0, 0.63, 0], { color: 'black' })
      .cone([0.03, 0.07, 0.03], [0, 0.685, 0], { color: 'black' })
      .box([0.016, 0.04, 0.004], [0, 0.69, 0.012], { color: 'tan' });
    for (const y of [0.08, 0.34, 0.61]) b.torus([0.04, 0.04, 0.01], [0, y, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.2 });
    b.each(6, (i) => b.ball(0.012, [0, 0.14 + i * 0.07, 0.017], { color: 'silver' }));
    return b.done();
  }),
  e('classroom', 'places', 'rooms', () => {
    const b = m('classroom')
      .box([3.6, 0.1, 3], [0, 0.05, 0], { color: 'lightwood' })
      .box([3.6, 2.6, 0.15], [0, 1.3, -1.45], { color: 'cream' })
      .box([0.15, 2.6, 3], [-1.75, 1.3, 0], { color: 'cream' })
      .box([1.9, 1.0, 0.06], [0.2, 1.5, -1.36], { color: 'wood' })
      .box([1.8, 0.9, 0.07], [0.2, 1.5, -1.35], { color: '#2f5d40' })
      .label('A B C', [0.8, 0.25], [0.2, 1.65, -1.3], { color: '#2f5d40' })
      .box([0.06, 0.9, 1.0], [-1.67, 1.5, 0.2], { color: 'glass' })
      .cyl([0.3, 0.04, 0.3], [-1.0, 2.2, -1.36], { color: 'white', rot: [90, 0, 0] })
      .box([1.0, 0.75, 0.5], [1.1, 0.475, -0.6], { color: 'darkwood' });
    for (const x of [-0.6, 0.6]) for (const z of [0.3, 1.1]) {
      b.box([0.6, 0.06, 0.4], [x, 0.7, z], { color: 'wood' }).box([0.06, 0.6, 0.06], [x, 0.4, z], { color: 'steel' });
      b.box([0.35, 0.05, 0.3], [x, 0.42, z + 0.35], { color: 'blue' }).box([0.35, 0.3, 0.04], [x, 0.6, z + 0.5], { color: 'blue' });
    }
    return b.done();
  }),
  e('claw', 'wild', 'animal parts', () =>
    m('claw')
      .ball([0.045, 0.03, 0.04], [0, 0.015, 0], { color: 'darkgray' })
      .rod([0, 0.02, 0], [0.01, 0.06, 0], 0.03, '#3a3330')
      .rod([0.01, 0.06, 0], [0.035, 0.085, 0], 0.022, '#3a3330')
      .rod([0.035, 0.085, 0], [0.06, 0.08, 0], 0.013, '#3a3330')
      .cone([0.01, 0.018, 0.01], [0.07, 0.074, 0], { color: '#3a3330', rot: [0, 0, -120] })
      .done(),
  ),
  e('claw machine', 'toys', 'arcade', () => {
    const b = m('claw machine')
      .box([0.9, 0.9, 0.8], [0, 0.45, 0], { color: 'pink', round: 0.1 })
      .box([0.92, 0.28, 0.82], [0, 1.86, 0], { color: 'pink', round: 0.1 })
      .label('CLAW', [0.6, 0.18], [0, 1.86, 0.42], { color: 'yellow', glow: true })
      .box([0.86, 0.06, 0.76], [0, 0.92, 0], { color: 'skyblue' })
      .stick([0, 1.72, 0], [0, 1.4, 0], 0.015, 'silver')
      .cyl([0.08, 0.05, 0.08], [0, 1.38, 0], { color: 'silver' })
      .stick([-0.25, 0.92, 0.42], [-0.25, 1.02, 0.42], 0.02, 'black')
      .ball(0.05, [-0.25, 1.04, 0.42], { color: 'red' })
      .cyl([0.06, 0.02, 0.06], [0.2, 0.92, 0.42], { color: 'blue', rot: [90, 0, 0] })
      .box([0.2, 0.15, 0.02], [0.2, 0.4, 0.41], { color: 'black' });
    for (const a of [0, 120, 240]) {
      const r = a * RAD;
      b.rod([Math.cos(r) * 0.03, 1.36, Math.sin(r) * 0.03], [Math.cos(r) * 0.07, 1.27, Math.sin(r) * 0.07], 0.012, 'silver');
    }
    for (const [x, z] of [[0.43, 0.38], [-0.43, 0.38], [0.43, -0.38], [-0.43, -0.38]]) b.stick([x, 0.9, z], [x, 1.73, z], 0.04, 'pink');
    for (const [x, z, c] of [[-0.2, 0.1, 'yellow'], [0.15, -0.1, 'skyblue'], [0.25, 0.15, 'lime'], [-0.1, -0.2, 'purple']] as const) b.ball(0.14, [x, 1.02, z], { color: c });
    return b.ball(0.12, [0.0, 1.0, 0.15], { color: 'brown' }).ball(0.09, [0.0, 1.12, 0.17], { color: 'brown' }).done();
  }),
  e('claws', 'wild', 'animal parts', () => {
    const b = m('claws').ball([0.09, 0.04, 0.08], [0, 0.02, -0.01], { color: 'darkbrown' }).ball([0.04, 0.012, 0.03], [0, 0.04, 0.0], { color: '#3a2a20', noInk: true });
    b.each(4, (i) => {
      const x = -0.033 + i * 0.022;
      b.ball(0.024, [x, 0.025, 0.035], { color: 'darkbrown' });
      path(b, [[x, 0.03, 0.045], [x, 0.03, 0.065], [x, 0.012, 0.08]], 0.009, 'cream');
    });
    return b.done();
  }),
  e('clay', 'toys', 'crafts', () =>
    m('clay')
      .cyl([0.07, 0.07, 0.07], [-0.06, 0.035, -0.03], { color: 'yellow' })
      .cyl([0.075, 0.015, 0.075], [-0.06, 0.077, -0.03], { color: 'red' })
      .ball([0.05, 0.04, 0.05], [0.04, 0.02, -0.02], { color: 'blue' })
      .ball([0.04, 0.03, 0.04], [0.01, 0.015, 0.05], { color: 'lime' })
      .rod([0.04, 0.008, 0.05], [0.1, 0.008, 0.03], 0.016, 'red')
      .ball(0.035, [0.08, 0.06, -0.02], { color: 'pink' })
      .done(),
  ),
  e('climbing wall', 'sports', 'climbing', () => {
    const b = m('climbing wall')
      .box([3, 4, 0.32], [0, 2, -0.04], { color: '#9aa7b3', round: 0.05 })
      .box([3.2, 0.25, 1.2], [0, 0.125, 0.75], { color: 'blue', round: 0.4 })
      .stick([0.8, 3.95, 0.2], [0.8, 0.3, 0.35], 0.04, 'red');
    const cols = ['red', 'yellow', 'green', 'orange', 'purple', 'blue'];
    for (let i = 0; i < 18; i++) {
      const x = -1.3 + ((i * 7) % 13) * 0.2, y = 0.5 + ((i * 5) % 17) * 0.2;
      b.ball([0.16, 0.12, 0.1], [x, y, 0.15], { color: cols[i % 6], rot: [0, 0, i * 30] });
    }
    return b.done();
  }),
  e('clip', 'study', 'office supplies', () => {
    const b = m('clip');
    const pts: V[] = [[0.004, 0.022, 0], [0.004, 0.055, 0], ...arc(-0.002, 0.055, 0.006, 0.006, 0, 180, 3).slice(1), [-0.008, 0.012, 0], ...arc(0.002, 0.012, 0.01, 0.01, 180, 360, 4).slice(1), [0.012, 0.064, 0], ...arc(0, 0.064, 0.012, 0.012, 0, 180, 4).slice(1), [-0.012, 0.03, 0]];
    return path(b, pts, 0.006, 'silver').done();
  }),
  e('cloak', 'wardrobe', 'outerwear', () =>
    m('cloak')
      .cyl([0.75, 1.2, 0.55], [0, 0.6, 0], { color: 'purple', taper: 0.45 })
      .ball([0.46, 0.2, 0.32], [0, 1.2, 0], { color: 'purple' })
      .ball([0.3, 0.33, 0.3], [0, 1.4, -0.03], { color: 'purple' })
      .ball([0.2, 0.24, 0.1], [0, 1.38, 0.1], { color: '#2a1f33' })
      .ball(0.05, [0, 1.17, 0.17], { color: 'gold' })
      .box([0.02, 1.0, 0.02], [0, 0.55, 0.22], { color: '#5a3d80', rot: [-11, 0, 0], noInk: true })
      .done(),
  ),
  e('clock', 'home', 'clocks', () => {
    const b = m('clock')
      .cyl([0.16, 0.06, 0.16], [0, 0.11, 0], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.13, 0.01, 0.13], [0, 0.11, 0.031], { color: 'white', rot: [90, 0, 0] })
      .box([0.008, 0.045, 0.004], [0, 0.128, 0.037], { color: 'black' })
      .box([0.035, 0.008, 0.004], [0.015, 0.11, 0.038], { color: 'black' })
      .stick([0, 0.19, 0], [0, 0.22, 0], 0.01, 'silver');
    b.pair((s) => b.ball([0.07, 0.05, 0.07], [s * 0.06, 0.19, 0], { color: 'silver', rot: [0, 0, s * -30] }).rod([s * 0.04, 0.05, 0], [s * 0.06, 0.012, 0], 0.016, 'darkgray'));
    b.each(4, (i) => b.box([0.006, 0.014, 0.004], [Math.cos(i * 1.5708) * 0.052, 0.11 + Math.sin(i * 1.5708) * 0.052, 0.037], { color: 'black', rot: [0, 0, i * 90 + 90] }));
    return b.done();
  }),
  e('clock face', 'home', 'clocks', () => {
    const b = m('clock face')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .cyl([0.24, 0.02, 0.24], [0, 0.13, 0], { color: 'cream', rot: [90, 0, 0] })
      .torus([0.25, 0.25, 0.03], [0, 0.13, 0.002], { color: 'darkwood', tube: 0.1 })
      .box([0.01, 0.075, 0.004], [0, 0.163, 0.013], { color: 'black' })
      .box([0.055, 0.01, 0.004], [0.024, 0.13, 0.014], { color: 'black' })
      .ball(0.014, [0, 0.13, 0.014], { color: 'black' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.006, i % 3 ? 0.012 : 0.02, 0.004], [Math.sin(a) * 0.098, 0.13 + Math.cos(a) * 0.098, 0.012], { color: 'black', rot: [0, 0, (-a * 180) / Math.PI] });
    });
    return b.done();
  }),
  e('clock hand', 'home', 'clocks', () =>
    m('clock hand')
      .cyl([0.03, 0.01, 0.03], [0, 0.02, 0], { color: 'black', rot: [90, 0, 0] })
      .ball(0.014, [0, 0.005, 0], { color: 'black' })
      .box([0.008, 0.065, 0.005], [0, 0.055, 0], { color: 'black' })
      .torus([0.018, 0.018, 0.004], [0, 0.06, 0], { color: 'black', tube: 0.2 })
      .cone([0.026, 0.026, 0.005], [0, 0.095, 0], { color: 'black', segs: 4 })
      .done(),
  ),
  e('clock tower', 'places', 'landmarks', () => {
    const b = m('clock tower')
      .box([1.1, 0.25, 1.1], [0, 0.125, 0], { color: 'stone' })
      .box([0.9, 2.0, 0.9], [0, 1.25, 0], { color: '#d9c08a' })
      .box([1.1, 0.75, 1.1], [0, 2.62, 0], { color: '#d9c08a' })
      .cone([1.45, 0.8, 1.45], [0, 3.4, 0], { color: '#3f6f5a', segs: 4, rot: [0, 45, 0] })
      .stick([0, 3.75, 0], [0, 3.9, 0], 0.05, 'gold')
      .box([0.25, 0.5, 0.05], [0, 0.5, 0.46], { color: 'darkwood', name: 'door', pivot: [-0.125, 0.5, 0.46] })
      .label('CLOCK TOWER', [0.7, 0.14], [0, 1.0, 0.47], { color: 'cream' });
    for (const [x, z, ry] of [[0, 0.56, 0], [0.56, 0, 90], [-0.56, 0, -90]] as const) {
      const n: V = [x ? Math.sign(x) : 0, 0, z ? 1 : 0];
      b.cyl([0.62, 0.04, 0.62], [x, 2.62, z], { color: 'white', rot: [90, ry, 0] })
        .box([0.03, 0.22, 0.01], [x + n[0] * 0.025, 2.68, z + n[2] * 0.025], { color: 'black', rot: [0, ry, 0] })
        .box([0.16, 0.03, 0.01], [x + n[0] * 0.025 + n[2] * 0.06, 2.62, z + n[2] * 0.025 - n[0] * 0.06], { color: 'black', rot: [0, ry, 0] });
    }
    return b.done();
  }),
  e('clog', 'wardrobe', 'shoes', () =>
    m('clog', { view: 'side' })
      .ball([0.1, 0.11, 0.3], [0, 0.055, 0], { color: 'yellow' })
      .ball([0.07, 0.06, 0.1], [0, 0.075, 0.13], { color: 'yellow', rot: [-20, 0, 0] })
      .ball([0.075, 0.02, 0.12], [0, 0.104, -0.06], { color: 'darkwood' })
      .ball([0.03, 0.03, 0.01], [0.049, 0.06, 0.05], { color: 'red', rot: [0, 90, 0], noInk: true })
      .box([0.004, 0.04, 0.008], [0.05, 0.035, 0.05], { color: 'green', noInk: true })
      .done(),
  ),
  e('closet door', 'home', 'doors', () => {
    const b = m('closet door')
      .box([1.2, 0.16, 0.4], [0, 0.08, 0], { color: 'lightwood' })
      .box([0.08, 2.1, 0.12], [-0.46, 1.21, 0], { color: 'white' })
      .box([0.08, 2.1, 0.12], [0.46, 1.21, 0], { color: 'white' })
      .box([1.0, 0.08, 0.12], [0, 2.22, 0], { color: 'white' })
      .box([0.84, 2.0, 0.04], [0, 1.16, 0.02], { color: 'white', name: 'door', pivot: [-0.42, 1.16, 0.02] })
      .ball(0.05, [0.33, 1.16, 0.06], { color: 'brass', parent: 'door' });
    b.each(12, (i) => b.box([0.66, 0.03, 0.01], [0, 1.4 + i * 0.06, 0.045], { color: 'lightgray', parent: 'door', noInk: true }));
    b.each(8, (i) => b.box([0.66, 0.03, 0.01], [0, 0.35 + i * 0.06, 0.045], { color: 'lightgray', parent: 'door', noInk: true }));
    return b.done();
  }),
  e('clothespin', 'home', 'laundry', () =>
    m('clothespin')
      .box([0.012, 0.09, 0.012], [0.007, 0.045, 0], { color: 'lightwood', rot: [0, 0, -3], round: 0.3 })
      .box([0.012, 0.09, 0.012], [-0.007, 0.045, 0], { color: 'lightwood', rot: [0, 0, 3], round: 0.3 })
      .torus([0.016, 0.016, 0.014], [0, 0.055, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.25 })
      .done(),
  ),
  e('cloud', 'nature', 'weather', () =>
    m('cloud')
      .ball([5, 3, 3.5], [0, 5, 0], { color: 'white' })
      .ball([3.5, 2.6, 3], [-2.4, 4.5, 0.3], { color: 'white' })
      .ball([3.6, 2.8, 3], [2.3, 4.6, 0.2], { color: 'white' })
      .ball([3, 2.6, 2.6], [0.8, 6.1, 0], { color: 'white' })
      .ball([6, 1.2, 3], [0, 3.9, 0], { color: '#e6edf3' })
      .done(),
  ),
  e('clover', 'garden', 'plants', () => {
    const b = m('clover').rod([0, 0, 0], [0, 0.1, 0], 0.008, 'green');
    for (const a of [90, 210, 330]) {
      const r = a * RAD;
      b.heart(0.055, [Math.cos(r) * 0.026, 0.1 + Math.sin(r) * 0.026, 0], { color: 'green', rot: [0, 0, a - 90] });
    }
    return b.done();
  }),
  e('clown car', 'garage', 'cars', () => {
    const b = m('clown car', { view: 'side' })
      .ball([1.3, 0.9, 2.0], [0, 0.65, 0], { color: 'yellow' })
      .ball([1.1, 0.8, 1.1], [0, 1.15, -0.2], { color: 'red' })
      .ball([1.12, 0.45, 0.9], [0, 1.2, -0.15], { color: 'glass' })
      .stick([0.4, 1.0, -0.8], [0.45, 1.9, -0.8], 0.03, 'black')
      .ball(0.18, [0.45, 1.95, -0.8], { color: 'magenta' })
      .ball(0.08, [0.45, 1.95, -0.7], { color: 'yellow' })
      .cone([0.12, 0.25, 0.12], [0.6, 0.8, 0.85], { color: 'gold', rot: [-60, 0, 0] })
      .ball(0.14, [0.6, 0.92, 0.75], { color: 'red' });
    for (const [x, z] of [[-0.25, 0.0], [0.2, -0.4], [-0.1, -0.5]]) b.cone([0.25, 0.4, 0.25], [x, 1.7, z], { color: x > 0 ? 'blue' : 'green' }).ball(0.08, [x, 1.92, z], { color: 'white' });
    for (const [x, y, z] of [[0.66, 0.6, 0.4], [0.62, 0.5, -0.4], [-0.66, 0.6, 0.3], [0.5, 0.95, 0.5]]) b.ball(0.16, [x, y, z], { color: 'blue', noInk: true });
    return wheels(b, 0.6, [0.65, -0.65], 0.5, 0.2, 'magenta').done();
  }),
  e('clown nose', 'wardrobe', 'costume', () => m('clown nose').ball(0.05, [0, 0.025, 0], { color: 'red' }).ball([0.014, 0.01, 0.006], [0.01, 0.038, 0.02], { color: 'white', noInk: true }).done()),
  e('clown suit', 'wardrobe', 'outfits', () => who('clown suit', { top: 'yellow', bottom: 'blue', shoes: 'red', long: true, hair: 'orange', style: 'spiky', acc: [hat('party', 'red'), face('clownnose'), wear('bowtie', 'red')] })),
  e('club (weapon)', 'armory', 'clubs', () => {
    const P = diag(-0.2, 0.03, 62);
    const b = m('club (weapon)').stick(P(0), P(0.68), 0.05, 'wood', { taper: 2.6 }).ball(0.13, P(0.68), { color: 'wood' });
    for (const [t, o] of [[0.5, 0.05], [0.6, -0.06], [0.42, -0.04], [0.66, 0.05]] as const) b.ball(0.04, P(t, o, 0.02), { color: 'darkwood' });
    return b.done();
  }),
  e('coal', 'nature', 'rocks', () =>
    m('coal')
      .box([0.07, 0.05, 0.06], [0, 0.03, 0], { color: '#2a2726', rot: [10, 30, 15], round: 0.15 })
      .box([0.05, 0.04, 0.05], [0.05, 0.022, 0.03], { color: '#3a3633', rot: [-15, 10, 25], round: 0.15 })
      .box([0.05, 0.04, 0.045], [-0.05, 0.022, 0.03], { color: '#2a2726', rot: [20, -30, 0], round: 0.15 })
      .box([0.04, 0.035, 0.04], [0.02, 0.065, 0.0], { color: '#3a3633', rot: [30, 45, 10], round: 0.15 })
      .ball([0.02, 0.01, 0.004], [0.0, 0.045, 0.03], { color: 'darkgray', noInk: true })
      .done(),
  ),
  e('coal mine', 'places', 'industry', () => {
    const b = m('coal mine')
      .ball([4, 2.6, 3], [0, 0.6, -0.8], { color: 'rock' })
      .box([1.0, 1.5, 0.1], [0, 0.75, 0.68], { color: '#1e1c1c' })
      .box([1.7, 0.28, 0.28], [0, 1.65, 0.8], { color: 'darkwood' })
      .label('MINE', [0.8, 0.22], [0, 1.65, 0.95], { color: 'wood' })
      .ball(0.15, [0.7, 1.35, 0.95], { color: 'yellow', glow: true })
      .box([0.8, 0.5, 1.0], [0, 0.45, 2.0], { color: 'iron', round: 0.1 })
      .ball([0.75, 0.3, 0.9], [0, 0.72, 2.0], { color: '#2a2726' });
    b.pair((s) => {
      b.box([0.2, 1.6, 0.2], [s * 0.6, 0.8, 0.8], { color: 'darkwood' });
      b.stick([s * 0.3, 0.04, 0.7], [s * 0.3, 0.04, 2.8], 0.05, 'iron');
      for (const z of [1.65, 2.35]) b.cyl([0.3, 0.1, 0.3], [s * 0.42, 0.17, z], { color: 'darkgray', rot: [0, 0, 90] });
    });
    b.each(5, (i) => b.box([0.9, 0.04, 0.12], [0, 0.02, 0.9 + i * 0.45], { color: 'darkwood' }));
    return b.done();
  }),
  e('coaster (drink)', 'home', 'tableware', () => {
    const b = m('coaster (drink)').cyl([0.1, 0.011, 0.1], [0.0, 0.058, -0.02], { color: 'tan', rot: [75, 0, 0] }).torus([0.07, 0.07, 0.004], [0.0, 0.058, -0.015], { color: 'darkred', rot: [-15, 0, 0], tube: 0.1, noInk: true });
    ['tan', 'red', 'teal', 'tan'].forEach((c, i) => b.cyl([0.1, 0.011, 0.1], [0.03, 0.0055 + i * 0.0115, 0.04], { color: c }));
    return b.done();
  }),
  e('coat', 'wardrobe', 'outerwear', () => {
    const c = '#c19a6b';
    const b = m('coat')
      .box([0.5, 0.5, 0.2], [0, 0.7, 0], { color: c, round: 0.3 })
      .cyl([0.52, 0.48, 0.24], [0, 0.24, 0], { color: c, taper: 0.92, rot: [180, 0, 0] })
      .box([0.52, 0.05, 0.22], [0, 0.48, 0], { color: '#8a6440', round: 0.3 })
      .stick([-0.2, 0.96, 0], [0.2, 0.96, 0], 0.02, 'darkwood')
      .rod([0, 0.96, 0], [0, 1.02, 0], 0.01, 'silver');
    path(b, arc(0.02, 1.04, 0.02, 0.025, 180, -60, 4), 0.01, 'silver');
    b.pair((s) => {
      b.box([0.13, 0.55, 0.14], [s * 0.31, 0.66, 0], { color: c, rot: [0, 0, s * 8], round: 0.4 });
      b.wedge([0.1, 0.22, 0.02], [s * 0.06, 0.82, 0.105], { color: '#8a6440', rot: [0, 0, 180] });
      b.each(2, (i) => b.ball(0.025, [s * 0.06, 0.62 - i * 0.2, 0.11], { color: 'darkbrown' }));
    });
    return b.done();
  }),
];
void [face, hat, held, wear, who, drink, pack, carton, wheels, spoked, tree, pine, fire, barrel, board];
