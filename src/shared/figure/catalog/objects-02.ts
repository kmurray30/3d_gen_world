/** Catalog chunk objects-02: the words in assign/objects-02.tsv. */
import { e, type CatalogEntry } from './types';
import { A, around, m, withAct, type M, type PartOpts } from '../dsl';
import { face, hat, held, wear, who, type Extra } from '../accessories';
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

interface FrontO {
  w: number;
  d: number;
  h: number;
  wall: string;
  sign: string;
  trim?: string;
  signColor?: string;
  awning?: [string, string];
  door?: string;
  roof?: 'flat' | 'gable';
  roofColor?: string;
}
/** A shop at real size, nose to +z: a shop front with a display window either side of a glazed door that swings
 *  out on its hinge (`door`), a fascia sign, an optional striped awning, upper-floor windows with sills when it is
 *  tall enough, a cornice and a flat or gable roof. A `window` socket sits behind the display glass. */
function storefront(key: string, o: FrontO): M {
  const { w, d, h } = o;
  const fz = d / 2, trim = o.trim ?? 'white', fw = w - 0.6;
  const b = m(key, { edge: 'sharp' })
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.02 })
    .box([w + 0.1, 0.3, d + 0.1], [0, 0.15, 0], { color: '#6b6560', round: 0.05 })
    .box([fw, 2.9, 0.1], [0, 1.6, fz + 0.04], { color: trim, round: 0.05 })
    .box([0.95, 2.15, 0.06], [0, 1.2, fz + 0.11], { color: o.door ?? '#2f5d4a', round: 0.1, name: 'door', pivot: [-0.475, 1.2, fz + 0.11], mover: { kind: 'swing', axis: 'y', amount: -100 } })
    .box([0.62, 1.1, 0.03], [0, 1.45, fz + 0.14], { color: 'glass', round: 0.1, parent: 'door' })
    .ball(0.07, [0.36, 1.05, fz + 0.16], { color: 'brass', parent: 'door' })
    .box([fw, 0.6, 0.14], [0, 2.95, fz + 0.1], { color: o.signColor ?? '#2a2726', round: 0.15 })
    .label(o.sign, [fw * 0.8, 0.42], [0, 2.95, fz + 0.18], { color: o.signColor ?? '#2a2726', depth: 0.02 });
  const ww = (fw - 1.3) / 2;
  b.pair((s) => {
    const x = s * (0.65 + ww / 2);
    b.box([ww - 0.1, 1.85, 0.05], [x, 1.72, fz + 0.1], { color: 'glass', round: 0.05 });
    b.box([ww - 0.05, 0.08, 0.2], [x, 0.76, fz + 0.14], { color: trim });
    b.box([ww, 0.45, 0.04], [x, 0.53, fz + 0.1], { color: '#5c6166', round: 0.1 });
  });
  if (o.awning) {
    const n = Math.max(6, Math.round(fw / 0.5));
    b.each(n, (i) => b.box([fw / n, 0.05, 1.3], [-fw / 2 + (fw / n) * (i + 0.5), 2.45, fz + 0.72], { color: o.awning![i % 2], rot: [22, 0, 0], round: 0.1 }));
    b.each(n, (i) => b.box([fw / n, 0.22, 0.04], [-fw / 2 + (fw / n) * (i + 0.5), 2.08, fz + 1.33], { color: o.awning![i % 2], round: 0.3 }));
  }
  if (h > 5) {
    const n = Math.max(2, Math.round(w / 2.2));
    b.each(n, (i) => {
      const x = -w / 2 + (w / n) * (i + 0.5);
      b.box([1.1, 1.45, 0.08], [x, h - 2.0, fz + 0.02], { color: trim, round: 0.1 });
      b.box([0.92, 1.28, 0.06], [x, h - 2.0, fz + 0.05], { color: '#2f3d52', round: 0.1 });
      b.box([1.25, 0.08, 0.2], [x, h - 2.76, fz + 0.08], { color: trim });
    });
  }
  if (o.roof === 'gable') b.wedge([w + 0.5, 2.2, d + 0.6], [0, h + 1.1, 0], { color: o.roofColor ?? 'darkred' });
  else b.box([w + 0.3, 0.35, d + 0.3], [0, h + 0.1, 0], { color: o.roofColor ?? trim, round: 0.1 });
  return b.socket('window', [-(0.65 + ww / 2), 0.82, fz - 0.3], 'top', { size: 1 });
}

/** A stretch of railway along z: two steel rails on sleepers, centred on x = 0. */
function track(b: M, z0: number, z1: number, gauge = 1.435): M {
  const n = Math.max(2, Math.round((z1 - z0) / 1.6));
  b.each(n, (i) => b.box([2.6, 0.14, 0.26], [0, 0.07, z0 + ((z1 - z0) * (i + 0.5)) / n], { color: '#6b5a48', round: 0.1, edge: 'sharp', noInk: true }));
  return b.pair((s) => b.box([0.08, 0.16, z1 - z0], [s * (gauge / 2 + 0.04), 0.2, (z0 + z1) / 2], { color: 'steel', round: 0.2, edge: 'sharp' }));
}

/**
 * A four-door saloon car at real size (4.6 m long, 1.8 m wide, 1.47 m tall), nose to +z: a boxy loft body with a
 * glass cabin loft on top (pillars and roof in the body colour), dark wheel arches, wheels on axles, headlights
 * (`light1`, `light2`), tail lights, grille, bumpers, mirrors, a driver's door that swings open (`door`) and a
 * driver's seat. `at` shifts the whole car (for scenes with several).
 */
function sedan(b: M, color: string, at: V = [0, 0, 0], tag = ''): M {
  const [X, Y, Z] = at;
  const p = (x: number, y: number, z: number): V => [X + x, Y + y, Z + z];
  b.loft([1.76, 0.72, 4.6], p(0, 0.62, 0), [[0, 0.9, 0.78, 0.06], [0.05, 0.98, 0.95, 0.02], [0.5, 1, 1, 0], [0.88, 0.98, 0.92, -0.03], [1, 0.88, 0.62, -0.12]], { color, boxy: 0.8, name: `body${tag}` })
    .loft([1.5, 0.52, 2.55], p(0, 1.2, -0.25), [[0, 0.82, 0.25, -0.22], [0.2, 0.94, 0.96, 0], [0.7, 0.95, 0.96, 0], [1, 0.8, 0.22, -0.24]], { color: '#2f3d52', boxy: 0.65, edge: 'sharp' })
    .box([1.36, 0.07, 1.25], p(0, 1.45, -0.32), { color, round: 0.6, edge: 'sharp' })
    .box([1.8, 0.14, 0.24], p(0, 0.44, 2.28), { color: '#3a3633', round: 0.4, edge: 'sharp' })
    .box([1.8, 0.14, 0.2], p(0, 0.46, -2.3), { color: '#3a3633', round: 0.4, edge: 'sharp' })
    .box([0.7, 0.16, 0.06], p(0, 0.66, 2.3), { color: '#2a2726', round: 0.3, edge: 'sharp' });
  b.pair((s) => {
    b.box([0.06, 0.48, 0.1], p(s * 0.72, 1.2, -0.22), { color, edge: 'sharp' });
    b.box([0.34, 0.14, 0.06], p(s * 0.58, 0.74, 2.28), { color: '#fff6c8', glow: true, edge: 'sharp', name: `light${s > 0 ? 1 : 2}${tag}`, mover: { kind: 'light' } });
    b.box([0.3, 0.12, 0.06], p(s * 0.62, 0.8, -2.3), { color: '#d02a20', glow: true, edge: 'sharp' });
    b.box([0.08, 0.1, 0.16], p(s * 0.86, 1.02, 0.85), { color, edge: 'sharp' });
    for (const z of [1.45, -1.45]) b.cyl([0.8, 0.05, 0.8], p(s * 0.86, 0.36, z), { color: '#1e1e1e', rot: [0, 0, 90], edge: 'sharp' });
    b.box([0.04, 0.03, 0.14], p(s * 0.89, 0.86, -0.45), { color: 'silver', edge: 'sharp' });
  });
  b.box([0.04, 0.55, 1.05], p(0.87, 0.7, 0.32), { color, round: 0.3, edge: 'sharp', name: `door${tag}`, pivot: p(0.87, 0.7, 0.85), mover: { kind: 'swing', axis: 'y', amount: -65 } })
    .box([0.04, 0.03, 0.14], p(0.9, 0.86, 0.0), { color: 'silver', edge: 'sharp', parent: `door${tag}` });
  axle(b, 0.8, Y + 0.33, Z + 1.45, 0.66, 0.22, `wheelF${tag}`, 'silver', 'rubber', X);
  axle(b, 0.8, Y + 0.33, Z - 1.45, 0.66, 0.22, `wheelR${tag}`, 'silver', 'rubber', X);
  return tag ? b : b.socket('seat', p(0.38, 0.55, 0.0), 'seat');
}

/** A bowling pin of height h standing at (x, y0, z); with a name, its body is a part that tips over at its base
 *  and the rest rides on it. */
function pin(b: M, x: number, z: number, h: number, simple = false, y0 = 0, name?: string): M {
  const po: PartOpts = name ? { parent: name } : {};
  b.ball([0.34 * h, 0.62 * h, 0.34 * h], [x, y0 + 0.31 * h, z], { color: 'white', ...(name ? { name, pivot: [x, y0, z] as V, piece: true } : {}) })
    .cyl([0.13 * h, 0.22 * h, 0.13 * h], [x, y0 + 0.68 * h, z], { color: 'white', ...po })
    .ball([0.19 * h, 0.24 * h, 0.19 * h], [x, y0 + 0.86 * h, z], { color: 'white', ...po });
  if (!simple) b.cyl([0.18 * h, 0.04 * h, 0.18 * h], [x, y0 + 0.02 * h, z], { color: 'white', ...po });
  b.torus([0.15 * h, 0.15 * h, 0.035 * h], [x, y0 + 0.66 * h, z], { color: 'red', rot: [90, 0, 0], tube: 0.25, noInk: true, ...po });
  if (!simple) b.torus([0.15 * h, 0.15 * h, 0.035 * h], [x, y0 + 0.71 * h, z], { color: 'red', rot: [90, 0, 0], tube: 0.25, noInk: true, ...po });
  return b;
}

/** A road wheel on each side of an axle across x at height y, z: soft tyre (named `${name}L` / `${name}R`, so it
 *  rolls), a sharp hub cap riding on it, and the axle bar between them. */
function axle(b: M, x: number, y: number, z: number, d: number, w: number, name: string, hub = 'silver', tyre = 'rubber', cx = 0): M {
  b.stick([cx + x - w / 2, y, z], [cx - x + w / 2, y, z], Math.max(0.02, d * 0.09), 'iron');
  return b.pair((s) => {
    const n = `${name}${s > 0 ? 'L' : 'R'}`;
    b.cyl([d, w, d], [cx + s * x, y, z], { color: tyre, rot: [0, 0, 90], name: n, edge: 'soft' });
    b.cyl([d * 0.56, w * 0.12, d * 0.56], [cx + s * (x + w * 0.5), y, z], { color: hub, rot: [0, 0, 90], parent: n, edge: 'sharp' });
    b.cyl([d * 0.16, w * 0.14, d * 0.16], [cx + s * (x + w * 0.56), y, z], { color: 'darkgray', rot: [0, 0, 90], parent: n, edge: 'sharp' });
  });
}

/** A pane of glass (or any flat panel) on a side wall facing +x / -x (s = 1 / -1) at (y, z). */
const sidePane = (b: M, s: number, x: number, y: number, z: number, h: number, l: number, color = '#2f3d52', o: PartOpts = {}): M =>
  b.box([0.04, h, l], [s * x, y, z], { color, round: 0.15, edge: 'sharp', ...o });

/** A spoked wooden wheel facing x at (x, y, z); with a name its rim is that part (so it rolls) and the hub and
 *  spokes ride on it. */
function spoked(b: M, x: number, y: number, z: number, d: number, color = 'darkwood', n = 6, name?: string): M {
  const po: PartOpts = name ? { parent: name } : {};
  b.torus([d, d, d * 0.08], [x, y, z], { color, rot: [0, 90, 0], tube: 0.12, ...(name ? { name } : {}) });
  b.cyl([d * 0.16, d * 0.12, d * 0.16], [x, y, z], { color, rot: [0, 0, 90], ...po });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI;
    b.stick([x, y + Math.sin(a) * d * 0.46, z + Math.cos(a) * d * 0.46], [x, y - Math.sin(a) * d * 0.46, z - Math.cos(a) * d * 0.46], d * 0.035, color, po);
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
  // A half-litre bottle: a moulded (soft) body with grip rings, a sharp ribbed cap that twists off.
  e('bottled water', 'food', 'drinks', () =>
    m('bottled water')
      .loft([0.066, 0.066, 0.19], [0, 0.095, 0], [[0, 0.84, 0.84], [0.05, 1, 1], [0.28, 0.95, 0.95], [0.33, 1, 1], [0.62, 1, 1], [0.67, 0.94, 0.94], [0.72, 0.99, 0.99], [0.9, 0.52, 0.52], [1, 0.4, 0.4]], { color: '#cfeaf7', rot: [-90, 0, 0], name: 'body' })
      .cyl([0.069, 0.06, 0.069], [0, 0.1, 0], { color: '#3f8fd6', parent: 'body' })
      .label('SPRING', [0.046, 0.022], [0, 0.104, 0.035], { color: 'white', depth: 0.003, parent: 'body' })
      .cyl([0.06, 0.07, 0.06], [0, 0.04, 0], { color: '#9fd3ef', parent: 'body', noInk: true })
      .cyl([0.034, 0.006, 0.034], [0, 0.192, 0], { color: '#cfeaf7', parent: 'body' })
      .cyl([0.03, 0.022, 0.03], [0, 0.206, 0], { color: 'blue', segs: 14, edge: 'sharp', name: 'cap', parent: 'body', piece: true })
      .act({ click: [A.pose('cap', { rot: [0, 720, 0], move: [0, 0.035, 0], dur: 0.7 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Glug glug!', 1.5)), A.wait(0.8), A.pose('cap', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A real boulder, taller than a person's waist: lumpy, mossy, and a flake that chips off.
  e('boulder', 'nature', 'rocks', () =>
    m('boulder')
      .ball([2.4, 1.6, 2.0], [0, 0.78, 0], { color: 'rock', name: 'body' })
      .ball([1.5, 1.2, 1.4], [0.7, 0.55, 0.35], { color: '#86827b' })
      .ball([1.2, 0.95, 1.1], [-0.85, 0.45, 0.35], { color: '#7e7a73' })
      .ball([1.3, 0.75, 1.1], [-0.25, 1.38, -0.15], { color: '#8f8b84' })
      .ball([0.9, 0.5, 0.7], [0.55, 0.25, -0.6], { color: '#77736c' })
      .ball([0.8, 0.12, 0.6], [0.2, 1.73, 0.05], { color: '#6f8f4a', noInk: true })
      .ball([0.5, 0.1, 0.35], [-0.95, 0.9, 0.55], { color: '#6f8f4a', noInk: true })
      .ball([0.45, 0.32, 0.38], [0.95, 0.95, 0.78], { color: '#9a968e', name: 'chip', parent: 'body', piece: true })
      .act({ click: [[A.par(A.anim('wobble'), A.effect('dust', { dur: 1.5 })), A.detach('chip', 'pebble')], [A.reattach('chip')]] })
      .done(),
  ),
  e('bouncy ball', 'toys', 'balls', () =>
    m('bouncy ball')
      .ball(0.06, [0, 0.03, 0], { color: 'magenta', name: 'ball' })
      .torus([0.061, 0.061, 0.012], [0, 0.03, 0], { color: 'yellow', rot: [20, 30, 25], tube: 0.12, noInk: true, parent: 'ball' })
      .torus([0.061, 0.061, 0.01], [0, 0.03, 0], { color: 'cyan', rot: [70, -20, 0], tube: 0.1, noInk: true, parent: 'ball' })
      .ball([0.014, 0.01, 0.006], [0.012, 0.047, 0.024], { color: 'white', noInk: true, parent: 'ball' })
      .act({ click: [A.par(A.anim('hop', 4), A.say('Boing! Boing!', 2))] })
      .done(),
  ),
  // An inflatable castle at real size: a 4.6 m square soft floor a child bounces on, puffy walls with net windows,
  // four towers that sag when it deflates. Everything is soft: it is blown up.
  e('bouncy house', 'toys', 'fairground', () => {
    const b = m('bouncy house')
      .box([4.6, 0.6, 4.6], [0, 0.3, 0], { color: 'blue', round: 0.6 })
      .box([4.2, 0.08, 4.2], [0, 0.62, 0], { color: '#3f7fd0', round: 0.3, noInk: true })
      .box([4.2, 1.9, 0.5], [0, 1.55, -2.05], { color: 'red', round: 0.6 })
      .label('JUMP!', [1.6, 0.45], [0, 1.85, -1.79], { color: 'yellow', depth: 0.04 })
      .box([1.6, 0.3, 0.9], [0, 0.15, 2.7], { color: 'yellow', round: 0.6 });
    b.each(4, (i) => b.box([0.55, 0.45, 0.5], [-1.5 + i * 1.0, 2.7, -2.05], { color: i % 2 ? 'yellow' : 'red', round: 0.6 }));
    b.pair((s) => {
      b.box([0.5, 1.9, 4.2], [s * 2.05, 1.55, 0], { color: 'yellow', round: 0.6 });
      b.box([0.06, 1.0, 2.6], [s * 2.31, 1.65, 0], { color: '#2a3550', round: 0.2, edge: 'sharp' });
      b.box([1.2, 0.9, 0.5], [s * 1.45, 1.05, 2.05], { color: 'red', round: 0.6 });
      b.box([0.06, 0.06, 2.6], [s * 2.31, 2.17, 0], { color: 'white', round: 0.5, noInk: true });
    });
    [[2.05, 2.05], [-2.05, 2.05], [2.05, -2.05], [-2.05, -2.05]].forEach(([x, z], i) => {
      const n = `tower${i + 1}`;
      b.capsule([0.85, 3.4, 0.85], [x, 2.1, z], { color: i % 2 ? 'red' : 'yellow', name: n, pivot: [x, 0.6, z] });
      b.cone([1.05, 1.0, 1.05], [x, 4.15, z], { color: 'blue', parent: n });
      b.ball(0.22, [x, 4.7, z], { color: 'yellow', parent: n });
    });
    b.cyl([0.35, 1.2, 0.35], [1.3, 0.25, -2.6], { color: 'green', rot: [90, 0, 0] });
    b.socket('floor', [0, 0.62, 0.4], 'top', { size: 2.5 });
    b.act({
      click: [
        [A.spawn('kid', 'girl'), A.attach('kid', 'self', 'floor'), A.par(A.anim('hop', 4, 'kid'), A.anim('bounce', 4), A.say('Boing! Boing!', 2)), A.remove('kid', 'fade')],
        [A.par(A.pose('tower1', { rot: [0, 0, 25], dur: 1.2 }), A.pose('tower2', { rot: [0, 0, -25], dur: 1.2 }), A.pose('tower3', { rot: [-20, 0, 15], dur: 1.2 }), A.pose('tower4', { rot: [-20, 0, -15], dur: 1.2 }), A.say('Pffffff...', 1.5)), A.wait(0.8), A.par(A.pose('tower1', { rot: [0, 0, 0], dur: 0.6 }), A.pose('tower2', { rot: [0, 0, 0], dur: 0.6 }), A.pose('tower3', { rot: [0, 0, 0], dur: 0.6 }), A.pose('tower4', { rot: [0, 0, 0], dur: 0.6 }), A.say('Fwoomp!', 1.2))],
      ],
    });
    return b.done();
  }),
  // A hand-tied bouquet in kraft paper: roses, daisies and baby's breath, a satin ribbon at the waist.
  e('bouquet', 'garden', 'flowers', () => {
    const b = m('bouquet')
      .cone([0.22, 0.3, 0.2], [0, 0.2, 0], { color: '#d8b98a', rot: [180, 0, 0], segs: 7, name: 'wrap' })
      .cone([0.2, 0.26, 0.18], [0.01, 0.22, -0.02], { color: '#f2e1c2', rot: [180, 25, 0], segs: 6 })
      .torus([0.075, 0.075, 0.025], [0, 0.1, 0], { color: 'red', rot: [90, 0, 0], tube: 0.3 });
    b.pair((s) => b.ball([0.06, 0.03, 0.02], [s * 0.035, 0.1, 0.035], { color: 'red', rot: [0, 0, s * 30] }));
    b.each(5, (i) => b.stick([(i - 2) * 0.008, 0.0, (i % 2) * 0.006], [(i - 2) * 0.006, 0.09, 0], 0.008, '#5f8f3a'));
    const fl: Array<[number, number, number, string]> = [[0, 0.39, 0, 'red'], [0.06, 0.37, 0.03, 'red'], [-0.06, 0.365, 0.035, 'pink'], [0.03, 0.36, -0.06, 'red'], [-0.05, 0.355, -0.05, 'pink']];
    fl.forEach(([x, y, z, c], i) => {
      b.ball([0.06, 0.05, 0.06], [x, y, z], { color: c, name: i === 0 ? 'rose' : undefined, parent: i === 0 ? 'wrap' : undefined, piece: i === 0 });
      b.ball([0.03, 0.02, 0.03], [x, y + 0.022, z], { color: c === 'red' ? 'darkred' : '#e07aa0', noInk: true, parent: i === 0 ? 'rose' : undefined });
    });
    around(4, 0.085, 0.8).forEach(([x, z]) => b.cyl([0.05, 0.008, 0.05], [x, 0.345, z], { color: 'white', segs: 8 }).ball(0.016, [x, 0.351, z], { color: 'gold', noInk: true }));
    around(9, 0.1, 0.2).forEach(([x, z]) => b.ball(0.014, [x, 0.33, z], { color: 'white', noInk: true }));
    b.pair((s) => b.ball([0.07, 0.03, 0.02], [s * 0.1, 0.31, 0.02], { color: 'leaf', rot: [0, 0, s * -40] }));
    return b.act({ click: [[A.par(A.anim('wobble'), A.effect('hearts', { dur: 1.5 }))], [A.detach('rose', 'rose'), A.wait(1.5), A.reattach('rose')]] }).done();
  }),
  e('bow (gift)', 'toys', 'party things', () => {
    const b = m('bow (gift)').ball([0.035, 0.03, 0.03], [0, 0.085, 0.005], { color: 'darkred', name: 'knot' });
    b.pair((s) => {
      b.torus([0.09, 0.06, 0.03], [s * 0.048, 0.1, 0], { color: 'red', rot: [0, 0, s * 22], tube: 0.38, parent: 'knot', name: s > 0 ? 'loopL' : 'loopR', pivot: [s * 0.01, 0.09, 0] });
      b.rod([s * 0.01, 0.075, 0], [s * 0.05, 0.012, 0.005], 0.024, 'red', { parent: 'knot' });
      b.cone([0.03, 0.02, 0.006], [s * 0.052, 0.005, 0.005], { color: 'red', rot: [180, 0, 0], parent: 'knot' });
    });
    return b.act({ click: [A.par(A.pose('loopL', { rot: [0, 0, 25], dur: 0.3 }), A.pose('loopR', { rot: [0, 0, -25], dur: 0.3 }), A.effect('sparkle', { dur: 1.2 })), A.par(A.pose('loopL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('loopR', { rot: [0, 0, 0], dur: 0.4 }))] }).done();
  }),
  // A violin bow, 0.75 m: a dark pernambuco stick, a pale horse-hair ribbon, a black frog with its silver screw.
  e('bow (music)', 'music', 'strings', () => {
    const P = diag(-0.06, 0.02, 80);
    return m('bow (music)')
      .rod(P(0), P(0.72), 0.011, 'darkwood', { name: 'stick' })
      .stick(P(0.06, 0.022), P(0.7, 0.012), 0.008, 'cream', { parent: 'stick' })
      .box([0.045, 0.075, 0.02], P(0.07, 0.014), { color: 'black', rot: [0, 0, -10], round: 0.3, edge: 'sharp', parent: 'stick' })
      .ball(0.01, P(0.08, 0.02, 0.012), { color: 'white', parent: 'stick' })
      .cyl([0.014, 0.025, 0.014], P(0.012), { color: 'silver', rot: [0, 0, -10], parent: 'stick' })
      .box([0.016, 0.03, 0.016], P(0.71, 0.006), { color: 'cream', rot: [0, 0, -10], parent: 'stick' })
      .act({ click: [A.say('♪ Mmm-eee-ooo ♪', 2.5), A.pose('stick', { move: [0.2, 0.03, 0], dur: 0.8 }), A.pose('stick', { move: [-0.15, -0.02, 0], dur: 0.8 }), A.pose('stick', { move: [0, 0, 0], dur: 0.5 })] })
      .done();
  }),
  // A 1.75 m longbow, nose to +z: two limbs bending forward from a leather grip, a string between the tips and
  // an arrow on the string that flies off and comes back.
  e('bow (weapon)', 'armory', 'bows', () => {
    const b = m('bow (weapon)', { view: 'side' });
    const r = 1.906, cz = -1.856;
    const pts: V[] = Array.from({ length: 11 }, (_, i) => {
      const a = (-26.5 + i * 5.3) * RAD;
      return [0, 0.9 + r * Math.sin(a), cz + r * Math.cos(a)];
    });
    pts.forEach((p, i) => i && b.rod(pts[i - 1], p, 0.026 + 0.022 * (1 - Math.abs(i - 5.5) / 5.5), 'wood'));
    b.capsule([0.05, 0.22, 0.05], [0, 0.9, 0.05], { color: 'leather', name: 'grip' })
      .stick(pts[0], pts[10], 0.006, 'white', { name: 'string' })
      .cyl([0.032, 0.03, 0.032], pts[0], { color: 'cream' })
      .cyl([0.032, 0.03, 0.032], pts[10], { color: 'cream' })
      .stick([0.03, 0.93, -0.15], [0.03, 0.93, 0.62], 0.01, 'lightwood', { name: 'arrow', parent: 'grip', piece: true })
      .cone([0.024, 0.07, 0.01], [0.03, 0.93, 0.65], { color: 'steel', rot: [90, 0, 0], parent: 'arrow' });
    for (const [dy, dx, c] of [[0.018, 0, 'red'], [-0.01, 0.016, 'white'], [-0.01, -0.016, 'white']] as const)
      b.wedge([0.004, 0.03, 0.11], [0.03 + dx, 0.93 + dy, -0.08], { color: c, rot: [0, 0, Math.atan2(dx, dy) / RAD], parent: 'arrow' });
    return b
      .act({ click: [[A.pose('arrow', { move: [0, 0, -0.2], dur: 0.7 }), A.wait(0.3), A.detach('arrow', 'arrow'), A.par(A.move('arrow', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.say('Thwip!', 1))], [A.reattach('arrow'), A.pose('arrow', { move: [0, 0, 0], dur: 0.1 })]] })
      .done();
  }),
  e('bow tie', 'wardrobe', 'neckwear', () => {
    const b = m('bow tie').box([0.026, 0.032, 0.028], [0, 0.03, 0.003], { color: 'darkred', name: 'knot' });
    b.pair((s) => {
      b.cyl([0.06, 0.065, 0.022], [s * 0.042, 0.03, 0], { color: 'red', taper: 0.35, rot: [0, 0, s * 90], parent: 'knot' });
      b.ball(0.012, [s * 0.05, 0.04, 0.012], { color: 'white', noInk: true, parent: 'knot' });
      b.ball(0.01, [s * 0.035, 0.018, 0.011], { color: 'white', noInk: true, parent: 'knot' });
    });
    return b.act({ click: [A.par(A.pose('knot', { rot: [0, 0, 720], dur: 1.4 }), A.say('Whirrr!', 1.4)), A.pose('knot', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  // A glazed mixing bowl with cherries in it; click and they jump.
  e('bowl', 'kitchen', 'tableware', () =>
    bowl(m('bowl'), 0.22, 0.1, 'teal', 'cream')
      .torus([0.18, 0.18, 0.012], [0, 0.07, 0], { color: 'white', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .socket('dish', [0, 0.04, 0], 'top', { size: 0.15 })
      .act({ setup: [A.spawn('fruit', 'cherry'), A.attach('fruit', 'self', 'dish')], click: [A.par(A.anim('wobble'), A.anim('hop', 2, 'self.dish'), A.say('Clink!', 1))] })
      .done(),
  ),
  // A bowling alley: a long low hall with a giant pin on the roof, glass doors that slide apart, a neon sign.
  e('bowling alley', 'places', 'entertainment', () => {
    const b = m('bowling alley', { edge: 'sharp' })
      .box([14, 5, 10], [0, 2.5, 0], { color: '#5e4a9a', round: 0.02 })
      .box([14.3, 0.4, 10.3], [0, 5.1, 0], { color: '#2d2752', round: 0.1 })
      .box([14.05, 0.5, 10.05], [0, 0.25, 0], { color: '#3a3456', round: 0.05 })
      .box([4.2, 0.25, 2.0], [0, 3.0, 5.9], { color: '#2d2752', round: 0.1 })
      .box([3.6, 2.5, 0.1], [0, 1.3, 5.0], { color: '#20203a', round: 0.05 })
      .box([1.15, 2.2, 0.06], [-0.6, 1.15, 5.08], { color: 'glass', round: 0.05, name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -1.0 } })
      .box([1.15, 2.2, 0.06], [0.6, 1.15, 5.08], { color: 'glass', round: 0.05, name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 1.0 } })
      .label('BOWL', [5, 1.1], [0, 4.0, 5.06], { color: '#f6d24a', depth: 0.08 })
      .box([5.4, 0.12, 0.08], [0, 3.35, 5.08], { color: '#ff5fa8', glow: true, name: 'neon', mover: { kind: 'light', on: true } });
    b.pair((s) => {
      b.cyl([0.2, 2.9, 0.2], [s * 1.9, 1.45, 6.7], { color: 'silver' });
      b.each(2, (i) => b.box([2.4, 1.8, 0.06], [s * (3.6 + i * 2.6), 1.8, 5.03], { color: 'glass', round: 0.05 }));
      b.each(2, (i) => b.box([2.5, 0.12, 0.1], [s * (3.6 + i * 2.6), 0.85, 5.05], { color: 'white' }));
      b.each(3, (i) => b.box([0.06, 1.2, 1.6], [s * 7.02, 2.6, -3 + i * 3], { color: 'glass', round: 0.05 }));
    });
    b.box([1.6, 0.4, 1.6], [-4.2, 5.5, 2.6], { color: '#2d2752' });
    pin(b, -4.2, 2.6, 6, true, 5.7);
    b.ball(2.4, [-2.2, 6.9, 2.4], { color: '#2f4f8f' });
    for (const [x, y] of [[-2.55, 7.45], [-1.9, 7.5], [-2.2, 7.0]]) b.ball(0.38, [x, y, 3.45], { color: 'black', noInk: true });
    return b
      .act({ click: [[A.operate('door', 'open'), A.par(A.say('Crash! STRIKE!', 2), A.effect('sparkle', { dur: 1.5 })), A.wait(2), A.operate('door', 'close')], [A.operate('neon'), A.wait(0.4), A.operate('neon'), A.wait(0.4), A.operate('neon')]] })
      .done();
  }),
  e('bowling ball', 'sports', 'bowling', () => {
    const b = m('bowling ball').ball(0.218, [0, 0.109, 0], { color: 'navy', name: 'ball' });
    for (const d of [[-0.25, 0.55, 0.8], [0.25, 0.55, 0.8], [0, 0.22, 0.97]]) b.ball(0.026, [d[0] * 0.105, 0.109 + d[1] * 0.105, d[2] * 0.105], { color: 'black', parent: 'ball' });
    b.torus([0.2, 0.2, 0.01], [0, 0.109, 0], { color: '#5a7fd0', rot: [30, 50, 10], tube: 0.06, noInk: true, parent: 'ball' });
    b.ball([0.04, 0.03, 0.01], [0.05, 0.17, 0.06], { color: '#7f9be0', noInk: true, parent: 'ball' });
    return b.act({ click: [A.par(A.pose('ball', { rot: [1080, 0, 0], dur: 1.6 }), A.say('Rumble rumble...', 1.6)), A.pose('ball', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  // A whole lane at its real length (an 18 m maple lane, gutters, an approach with a foul line and aiming arrows,
  // ten pins at the far end, a ball return). Its vocabulary height is just the lane floor; the pins make it 0.6.
  e('bowling lane', 'sports', 'bowling', () => {
    const b = m('bowling lane', { view: 'side', edge: 'sharp' })
      .box([1.07, 0.08, 18.3], [0, 0.04, -1.9], { color: 'lightwood', round: 0.05 })
      .box([1.7, 0.08, 3.4], [0, 0.04, 9.0], { color: '#e3c494', round: 0.05 })
      .box([1.07, 0.012, 0.03], [0, 0.084, 7.28], { color: 'black', noInk: true })
      .box([1.7, 0.6, 0.9], [0, 0.3, -11.6], { color: '#22222e', round: 0.1 })
      .label('STRIKE ZONE', [1.4, 0.3], [0, 0.4, -11.14], { color: '#f6d24a', depth: 0.02 })
      .box([0.5, 0.55, 1.0], [1.15, 0.275, 8.6], { color: '#4e3a8a', round: 0.3 });
    b.pair((s) => {
      b.box([0.24, 0.06, 18.3], [s * 0.66, 0.03, -1.9], { color: 'darkgray', round: 0.4 });
      b.box([0.06, 0.2, 18.3], [s * 0.81, 0.1, -1.9], { color: '#5e4a9a', round: 0.3 });
    });
    b.each(7, (i) => b.cone([0.05, 0.14, 0.004], [-0.39 + i * 0.13, 0.083, 2.8 - Math.abs(i - 3) * 0.2], { color: 'darkwood', rot: [-90, 0, 0], noInk: true }));
    let k = 1;
    for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) pin(b, (i - r / 2) * 0.305, -9.3 - r * 0.264, 0.38, true, 0.08, `pin${k++}`);
    b.ball(0.218, [0.2, 0.19, 8.6], { color: '#d64fa0', name: 'ball', piece: true });
    const fall = (n: number): V => [-80 + (n % 3) * 5, 0, ((n * 37) % 70) - 35];
    return b
      .act({
        click: [
          [A.par(A.pose('ball', { move: [-0.2, 0, -17.6], rot: [-4000, 0, 0], dur: 2.4 }), A.say('Rumble...', 2)), A.par(...Array.from({ length: 10 }, (_, i) => A.pose(`pin${i + 1}`, { rot: fall(i), dur: 0.35 }))), A.say('STRIKE!', 2)],
          [A.par(...Array.from({ length: 10 }, (_, i) => A.pose(`pin${i + 1}`, { rot: [0, 0, 0], dur: 0.5 }))), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.2 }), A.say('Clack clack.', 1)],
        ],
      })
      .done();
  }),
  e('bowling pin', 'sports', 'bowling', () =>
    pin(m('bowling pin'), 0, 0, 0.38)
      .act({ click: [[A.par(A.anim('wobble', 2), A.say('Wibble wobble...', 1.5))], [A.anim('fall_over'), A.say('Clonk!', 1), A.wait(1), A.set({ tilt: 0 })]] })
      .done(),
  ),
  // A cardboard moving box: four flaps on their folds, tape, a FRAGILE label. Open it and a cat pops up out of it.
  e('box', 'home', 'boxes', () => {
    const b = m('box', { edge: 'sharp' })
      .box([0.5, 0.4, 0.4], [0, 0.2, 0], { color: 'tan', round: 0.04 })
      .box([0.48, 0.006, 0.38], [0, 0.39, 0], { color: '#8a6a40', round: 0, noInk: true })
      .box([0.08, 0.2, 0.004], [0, 0.3, 0.201], { color: '#efe2c4', round: 0, noInk: true })
      .label('FRAGILE', [0.2, 0.06], [0.0, 0.16, 0.205], { color: 'red', depth: 0.004 })
      .label('THIS WAY UP', [0.22, 0.04], [0.0, 0.08, 0.205], { color: 'tan', depth: 0.004 })
      .box([0.2, 0.006, 0.4], [0.15, 0.402, 0], { color: '#c9a36e', round: 0.1, name: 'flapL', pivot: [0.25, 0.402, 0], mover: { kind: 'swing', axis: 'z', amount: -200 } })
      .box([0.2, 0.006, 0.4], [-0.15, 0.402, 0], { color: '#c9a36e', round: 0.1, name: 'flapR', pivot: [-0.25, 0.402, 0], mover: { kind: 'swing', axis: 'z', amount: 200 } })
      .box([0.5, 0.006, 0.2], [0, 0.407, 0.1], { color: 'tan', round: 0.1, name: 'flapF', pivot: [0, 0.407, 0.2], mover: { kind: 'swing', axis: 'x', amount: 200 } })
      .box([0.5, 0.006, 0.2], [0, 0.407, -0.1], { color: 'tan', round: 0.1, name: 'flapB', pivot: [0, 0.407, -0.2], mover: { kind: 'swing', axis: 'x', amount: -200 } })
      .socket('box', [0, 0.1, 0], 'top', { size: 0.5 });
    return b
      .act({ click: [[A.operate('flap', 'open'), A.spawn('cat', 'cat'), A.attach('cat', 'self', 'box'), A.wait(0.4), A.par(A.anim('hop', 2, 'cat'), A.say('Meow!', 1.5, 'cat'))], [A.remove('self.box', 'pop'), A.operate('flap', 'close')]] })
      .done();
  }),
  // A box of chocolates with its lid propped open: truffles in paper cups; take one, then the lid shuts.
  e('box of chocolates', 'food', 'sweets', () => {
    const b = m('box of chocolates', { edge: 'sharp' })
      .box([0.3, 0.035, 0.22], [0, 0.0175, 0], { color: 'red', round: 0.15 })
      .box([0.28, 0.006, 0.2], [0, 0.036, 0], { color: 'gold', round: 0.1 })
      .box([0.31, 0.03, 0.23], [0, 0.125, -0.12], { color: 'red', rot: [-80, 0, 0], round: 0.15, name: 'lid', pivot: [0, 0.035, -0.11], mover: { kind: 'swing', axis: 'x', amount: 78 } })
      .heart(0.1, [0, 0.14, -0.1], { color: 'gold', rot: [-80, 0, 0], parent: 'lid', noInk: true })
      .box([0.2, 0.012, 0.025], [0, 0.155, -0.142], { color: 'gold', parent: 'lid' });
    const cols = ['chocolate', '#3e2416', '#c99566', '#f3e3d0'];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        const at: V = [-0.105 + i * 0.07, 0.05, -0.06 + j * 0.06];
        const first = i === 1 && j === 2;
        b.cyl([0.05, 0.016, 0.05], [at[0], 0.044, at[2]], { color: '#4a2a18', taper: 1.2, edge: 'soft' });
        b.ball([0.042, 0.03, 0.042], at, { color: cols[(i + j) % 4], edge: 'soft', ...(first ? { name: 'truffle', parent: 'lid', piece: true } : {}) });
      }
    return b
      .act({ click: [[A.detach('truffle', 'bonbon'), A.effect('hearts', { dur: 1.5 })], [A.reattach('truffle'), A.operate('lid'), A.wait(1.5), A.operate('lid')]] })
      .done();
  }),
  e('boxers', 'wardrobe', 'underwear', () => {
    const b = m('boxers')
      .box([0.37, 0.05, 0.2], [0, 0.375, 0], { color: 'white', round: 0.4 })
      .box([0.36, 0.16, 0.2], [0, 0.27, 0], { color: 'blue', round: 0.3 })
      .ball(0.014, [0, 0.28, 0.1], { color: 'white' })
      .box([0.006, 0.1, 0.004], [0, 0.25, 0.101], { color: '#3f72b0', noInk: true });
    b.pair((s) => b.box([0.185, 0.22, 0.19], [s * 0.096, 0.11, 0], { color: 'blue', rot: [0, 0, s * 6], round: 0.3 }));
    for (const [x, y] of [[-0.1, 0.27], [0.1, 0.17], [-0.08, 0.08], [0.11, 0.31], [0.06, 0.05]]) b.heart(0.04, [x, y, 0.1], { color: 'red', noInk: true });
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('hearts', { dur: 1.2 }))] }).done();
  }),
  // A laced boxing glove standing on its cuff: a big padded fist with the thumb tucked in. Click: a jab.
  e('boxing glove', 'sports', 'boxing', () =>
    m('boxing glove')
      .cyl([0.13, 0.12, 0.12], [0, 0.06, 0], { color: 'white', name: 'glove' })
      .ball([0.17, 0.2, 0.2], [0, 0.2, 0.012], { color: 'red', parent: 'glove' })
      .ball([0.15, 0.1, 0.16], [0, 0.29, 0.03], { color: 'red', parent: 'glove' })
      .capsule([0.055, 0.13, 0.06], [0.08, 0.17, 0.06], { color: 'red', rot: [-15, 0, -20], parent: 'glove' })
      .torus([0.135, 0.125, 0.02], [0, 0.12, 0], { color: 'red', rot: [90, 0, 0], tube: 0.18, parent: 'glove' })
      .box([0.008, 0.07, 0.006], [0, 0.07, 0.062], { color: 'darkgray', noInk: true, parent: 'glove' })
      .label('PRO', [0.06, 0.025], [0, 0.22, 0.11], { color: 'white', depth: 0.004, parent: 'glove' })
      .act({ click: [A.pose('glove', { move: [0, 0.02, 0.3], rot: [-25, 0, 0], dur: 0.15 }), A.say('Pow!', 1), A.pose('glove', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 })] })
      .done(),
  ),
  // A full-size ring: a 1.2 m platform with a canvas floor 6 m inside the ropes, four corner posts with pads,
  // four ropes, steps, two corner stools. The bell rings and the ropes bounce.
  e('boxing ring', 'sports', 'boxing', () => {
    const b = m('boxing ring', { edge: 'sharp' })
      .box([7.2, 1.15, 7.2], [0, 0.575, 0], { color: 'navy', round: 0.02 })
      .box([7.3, 0.08, 7.3], [0, 1.19, 0], { color: '#e8e6df', round: 0.1 })
      .label('CHAMPIONSHIP BOXING', [4.2, 0.45], [0, 0.6, 3.62], { color: 'white', depth: 0.03 })
      .label('CHAMPIONSHIP BOXING', [4.2, 0.45], [3.62, 0.6, 0], { color: 'white', depth: 0.03, rot: [0, 90, 0] });
    const c: Array<[number, number]> = [[3.2, 3.2], [-3.2, 3.2], [-3.2, -3.2], [3.2, -3.2]];
    c.forEach(([x, z], i) => {
      b.cyl([0.14, 1.7, 0.14], [x, 2.05, z], { color: 'silver' });
      b.box([0.32, 1.25, 0.32], [x, 2.0, z], { color: i === 0 ? 'red' : i === 2 ? 'blue' : 'white', round: 0.35, edge: 'soft' });
    });
    ['red', 'white', 'blue', 'white'].forEach((cl, k) => {
      const y = 1.66 + k * 0.36;
      b.stick([c[0][0], y, c[0][1]], [c[1][0], y, c[1][1]], 0.05, cl, k === 0 ? { name: 'ropes', pivot: [0, 1.6, 3.2] } : { parent: 'ropes' });
      for (const i of [1, 2, 3]) b.stick([c[i][0], y, c[i][1]], [c[(i + 1) % 4][0], y, c[(i + 1) % 4][1]], 0.05, cl);
    });
    b.each(3, (i) => b.box([0.9, 0.08, 0.35], [4.0, 0.3 + i * 0.32, 3.95 - i * 0.3], { color: 'darkgray' }));
    b.pair((s) => {
      b.cyl([0.4, 0.05, 0.4], [s * 2.75, 1.68, s * 2.75], { color: s > 0 ? 'red' : 'blue' });
      for (const [dx, dz] of [[0.12, 0.12], [-0.12, 0.12], [0.12, -0.12], [-0.12, -0.12]]) b.stick([s * 2.75 + dx, 1.23, s * 2.75 + dz], [s * 2.75 + dx, 1.66, s * 2.75 + dz], 0.03, 'silver');
    });
    b.socket('canvas', [0, 1.23, 0], 'top', { size: 5 });
    return b
      .act({ click: [A.say('Ding ding ding!', 1.8), A.pose('ropes', { move: [0, 0, 0.18], dur: 0.15 }), A.pose('ropes', { move: [0, 0, -0.06], dur: 0.2 }), A.pose('ropes', { move: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  e('bra', 'wardrobe', 'underwear', () => {
    const b = m('bra').box([0.3, 0.03, 0.06], [0, 0.03, -0.01], { color: 'pink', round: 0.4 }).ball(0.02, [0, 0.07, 0.03], { color: 'white' });
    b.pair((s) => {
      b.ball([0.13, 0.12, 0.08], [s * 0.066, 0.09, 0.015], { color: 'pink', rot: [0, s * 15, s * -10] });
      b.rod([s * 0.075, 0.14, 0.0], [s * 0.095, 0.22, -0.03], 0.012, 'pink');
      b.torus([0.12, 0.08, 0.01], [s * 0.066, 0.085, 0.05], { color: 'white', tube: 0.12, noInk: true });
      b.box([0.03, 0.025, 0.008], [s * 0.16, 0.03, -0.02], { color: 'silver', edge: 'sharp' });
    });
    return b.act({ click: [A.par(A.anim('bounce', 2), A.effect('sparkle', { dur: 1 }))] }).done();
  }),
  e('bracelet', 'wardrobe', 'jewellery', () => {
    const b = m('bracelet').torus([0.075, 0.075, 0.018], [0, 0.04, 0], { color: 'gold', tube: 0.2, rot: [0, 25, 0], name: 'band' });
    ['red', 'blue', 'green', 'white'].forEach((c, i) => {
      const a = (40 + i * 33) * RAD;
      b.ball(0.012, [Math.cos(a) * 0.034, 0.04 + Math.sin(a) * 0.034, 0.008], { color: c, parent: 'band' });
    });
    b.heart(0.018, [0.0, 0.0, 0.01], { color: 'gold', parent: 'band' });
    return b.act({ click: [A.par(A.pose('band', { rot: [0, 360, 0], dur: 1.2 }), A.effect('sparkle', { dur: 1.2 })), A.pose('band', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  // A dentist's model of a mouth with braces: two arches of teeth with brackets and a wire; the top jaw chatters.
  e('braces', 'clinic', 'dental', () => {
    const b = m('braces');
    const jaw = (y: number, up: number, root?: string) => {
      const po: PartOpts = root ? { parent: root } : {};
      b.arc([0.11, 0.11, 0.026], [0, y + up * 0.016, -0.005], { color: '#e88c9a', rot: [90, 0, 0], arc: 210, tube: 0.32, ...(root ? { name: root, pivot: [0, 0.058, -0.05] } : {}) });
      for (let i = 0; i < 10; i++) {
        const a = (-81 + i * 18) * RAD;
        const big = i === 4 || i === 5;
        b.box([big ? 0.013 : 0.011, 0.022, 0.01], [Math.sin(a) * 0.047, y, -0.005 + Math.cos(a) * 0.047], { color: 'white', rot: [0, a / RAD, 0], round: 0.4, ...po });
        b.box([0.006, 0.006, 0.004], [Math.sin(a) * 0.053, y - up * 0.001, -0.005 + Math.cos(a) * 0.053], { color: 'silver', rot: [0, a / RAD, 0], edge: 'sharp', ...po });
      }
      const wire: V[] = Array.from({ length: 9 }, (_, i) => {
        const a = (-81 + i * 20.25) * RAD;
        return [Math.sin(a) * 0.056, y - up * 0.001, -0.005 + Math.cos(a) * 0.056];
      });
      path(b, wire, 0.0025, 'steel', po);
    };
    jaw(0.035, -1);
    jaw(0.06, 1, 'upper');
    return b
      .act({ click: [A.pose('upper', { rot: [-25, 0, 0], dur: 0.15 }), A.pose('upper', { rot: [0, 0, 0], dur: 0.15 }), A.pose('upper', { rot: [-25, 0, 0], dur: 0.15 }), A.pose('upper', { rot: [0, 0, 0], dur: 0.15 }), A.say('Chatter chatter!', 1.5)] })
      .done();
  }),
  // A brain: two wrinkled hemispheres with a groove between them, the cerebellum tucked under the back and the
  // brain stem below. Soft and organic; it lights up with an idea.
  e('brain', 'clinic', 'organs', () => {
    const b = m('brain')
      .ball([0.1, 0.05, 0.06], [0, 0.04, -0.05], { color: '#e0889c' })
      .cyl([0.028, 0.06, 0.028], [0, 0.025, -0.015], { color: '#e8a0b0', rot: [15, 0, 0] });
    b.pair((s) => {
      b.ball([0.075, 0.1, 0.165], [s * 0.04, 0.085, 0.005], { color: '#f3a6b7', blend: 0.3 });
      b.ball([0.06, 0.05, 0.07], [s * 0.045, 0.055, 0.045], { color: '#efa0b2' });
      for (let k = 0; k < 5; k++) {
        const z = -0.065 + k * 0.03;
        path(b, [[s * 0.006, 0.133, z], [s * 0.03, 0.132, z + 0.01], [s * 0.055, 0.12, z - 0.006], [s * 0.074, 0.095, z + 0.008], [s * 0.078, 0.07, z - 0.004]], 0.004, '#cf6d84', { noInk: true });
      }
      path(b, [[s * 0.078, 0.07, -0.06], [s * 0.08, 0.075, 0.0], [s * 0.074, 0.07, 0.06]], 0.004, '#cf6d84', { noInk: true });
    });
    return b.act({ click: [A.par(A.anim('pulse', 2), A.effect('sparkle', { dur: 1.2 }), A.say('Ding! An idea!', 1.5))] }).done();
  }),
  e('brass knuckles', 'armory', 'close combat', () => {
    const b = m('brass knuckles', { edge: 'sharp' })
      .box([0.14, 0.016, 0.018], [0, 0.056, 0], { color: 'brass', round: 0.4 })
      .capsule([0.03, 0.12, 0.022], [0, 0.03, 0], { color: 'brass', rot: [0, 0, 90] })
      .rod([-0.04, 0.03, 0], [-0.03, 0.056, 0], 0.012, 'brass')
      .rod([0.04, 0.03, 0], [0.03, 0.056, 0], 0.012, 'brass');
    b.each(4, (i) => b.torus([0.034, 0.034, 0.016], [-0.051 + i * 0.034, 0.078, 0], { color: 'brass', tube: 0.28 }));
    return b.act({ click: [A.par(A.anim('shake'), A.say('Clank!', 1), A.effect('sparkle', { dur: 0.8 }))] }).done();
  }),
  // A crusty loaf with its end slice cut: the slice is a piece that comes off and goes back.
  e('bread', 'food', 'bakery', () => {
    const b = m('bread')
      .box([0.24, 0.09, 0.13], [0.02, 0.045, 0], { color: 'crust', round: 0.6, name: 'body' })
      .ball([0.25, 0.1, 0.14], [0.02, 0.088, 0], { color: 'crust' })
      .box([0.016, 0.1, 0.11], [-0.104, 0.065, 0], { color: 'bread', round: 0.4, noInk: true, parent: 'body' })
      .box([0.02, 0.11, 0.124], [-0.12, 0.066, 0], { color: 'cream', round: 0.5, name: 'slice', parent: 'body', piece: true })
      .box([0.017, 0.118, 0.134], [-0.12, 0.068, 0], { color: 'crust', round: 0.6, parent: 'slice' });
    b.each(3, (i) => b.box([0.05, 0.008, 0.014], [-0.04 + i * 0.06, 0.137, 0], { color: 'bread', rot: [0, 40, 0], noInk: true }));
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // A 33 cm bread knife: a riveted black handle and a long serrated blade (sharp); it saws back and forth.
  e('bread knife', 'kitchen', 'knives', () => {
    const a = 35;
    const P = diag(-0.13, 0.025, a);
    const b = m('bread knife', { edge: 'sharp' })
      .box([0.028, 0.12, 0.02], P(0.06), { color: 'black', rot: [0, 0, a - 90], round: 0.5, name: 'knife' })
      .box([0.034, 0.21, 0.004], P(0.225, -0.003), { color: 'silver', rot: [0, 0, a - 90], round: 0.3, parent: 'knife' })
      .box([0.03, 0.012, 0.022], P(0.122), { color: 'steel', rot: [0, 0, a - 90], parent: 'knife' })
      .ball(0.008, P(0.035, 0, 0.011), { color: 'silver', parent: 'knife' })
      .ball(0.008, P(0.085, 0, 0.011), { color: 'silver', parent: 'knife' });
    b.each(8, (i) => b.cone([0.01, 0.01, 0.004], P(0.135 + i * 0.025, -0.021), { color: 'silver', rot: [0, 0, a + 180], parent: 'knife' }));
    const fwd = (k: number): V => [Math.cos(a * RAD) * k, Math.sin(a * RAD) * k, 0];
    return b.act({ click: [A.say('Saw, saw, saw!', 2), A.pose('knife', { move: fwd(0.06), dur: 0.25 }), A.pose('knife', { move: fwd(-0.06), dur: 0.25 }), A.pose('knife', { move: fwd(0.06), dur: 0.25 }), A.pose('knife', { move: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // A countertop bread machine: a lid with a window on its back hinge, a control panel with a little screen.
  // Click: it kneads and bakes, the lid opens on a fresh loaf; click again and the loaf is taken out.
  e('bread maker', 'kitchen', 'appliances', () =>
    m('bread maker', { edge: 'sharp' })
      .box([0.3, 0.3, 0.38], [0, 0.155, 0], { color: 'white', round: 0.3 })
      .box([0.31, 0.012, 0.39], [0, 0.006, 0], { color: '#3a3633', round: 0.2 })
      .box([0.28, 0.05, 0.28], [0, 0.325, -0.03], { color: '#f2f2ee', round: 0.4, name: 'lid', pivot: [0, 0.32, -0.17], mover: { kind: 'swing', axis: 'x', amount: -95 } })
      .box([0.15, 0.012, 0.13], [0, 0.351, -0.02], { color: '#2f3d52', parent: 'lid' })
      .box([0.1, 0.02, 0.02], [0, 0.346, 0.1], { color: 'silver', parent: 'lid' })
      .box([0.24, 0.1, 0.04], [0, 0.29, 0.175], { color: '#4a4f55', rot: [-30, 0, 0], round: 0.2 })
      .box([0.08, 0.035, 0.01], [-0.05, 0.3, 0.19], { color: '#9be34d', glow: true, rot: [-30, 0, 0], name: 'screen', mover: { kind: 'light', on: true } })
      .cyl([0.022, 0.01, 0.022], [0.05, 0.3, 0.19], { color: 'red', rot: [60, 0, 0] })
      .cyl([0.018, 0.01, 0.018], [0.09, 0.3, 0.19], { color: 'white', rot: [60, 0, 0] })
      .label('BREAD MAKER', [0.16, 0.03], [0, 0.18, 0.192], { color: '#3a3633', depth: 0.004 })
      .socket('pan', [0, 0.22, -0.03], 'top', { size: 0.22 })
      .act({
        click: [
          [A.par(A.anim('shake', 3), A.say('Whirr... knead, knead...', 2)), A.wait(1.5), A.effect('steam', { dur: 1.5 }), A.say('Beep beep!', 1.2), A.operate('lid', 'open'), A.spawn('loaf', 'bread'), A.attach('loaf', 'self', 'pan')],
          [A.remove('self.pan', 'pop'), A.operate('lid', 'close')],
        ],
      })
      .done(),
  ),
  // A house brick with the dip (frog) on top; click to stack another on it, again to take it off.
  e('brick', 'workshop', 'building materials', () => {
    const b = m('brick', { edge: 'sharp' }).box([0.215, 0.065, 0.1025], [0, 0.0325, 0], { color: '#b5523b', round: 0.1 });
    b.box([0.12, 0.012, 0.05], [0, 0.06, 0], { color: '#8a3a28', round: 0.3 });
    b.box([0.2, 0.004, 0.095], [0, 0.0325, 0.052], { color: '#c46a50', round: 0, noInk: true });
    return b.socket('top', [0, 0.066, 0], 'top', { size: 0.22 }).act({ click: [[A.spawn('next', 'brick'), A.attach('next', 'self', 'top'), A.say('Clunk!', 1)], [A.remove('self.top', 'pop')]] }).done();
  }),
  // A real stone arch footbridge you can walk over: an arch over a stream, a humped deck with ramps down to the
  // ground, parapet walls with coping stones and a lamp at each end.
  // A real stone arch footbridge you can walk over: an arch over a stream, a level deck with ramps down to the
  // ground, parapet walls with coping stones, and a lamp post at each end.
  e('bridge (structure)', 'places', 'bridges', () => {
    const b = m('bridge (structure)', { edge: 'sharp' })
      .box([4, 0.04, 9], [0, 0.02, 0], { color: 'water', round: 0.2, edge: 'soft' })
      .arc([6.2, 2.9, 2.6], [0, 0, 0], { color: '#a39c8e', tube: 0.17 });
    const S = '#b5ad9c', top = 1.65, run = 3.4, a = Math.atan2(top, run) / RAD, L = Math.hypot(top, run);
    for (const [x0, x1, y0] of [[2.55, 3.2, 0], [1.8, 2.55, 0.85], [1.0, 1.8, 1.1], [0, 1.0, 1.25]] as const)
      b.pair((s) => b.box([x1 - x0, top - 0.05 - y0, 2.6], [s * (x0 + x1) / 2, (y0 + top - 0.05) / 2, 0], { color: S, round: 0.02 }));
    b.box([6.6, 0.2, 2.8], [0, top, 0], { color: '#8f887a', round: 0.1 });
    b.each(9, (i) => b.box([0.04, 0.5, 2.62], [-2.0 + i * 0.5, 1.35, 0], { color: '#9a9384', round: 0, noInk: true }));
    b.pair((s) => {
      b.box([L, 0.2, 2.8], [s * (3.2 + run / 2), top / 2, 0], { color: '#8f887a', rot: [0, 0, s * -a], round: 0.1 });
      b.wedge([run, top, 2.6], [s * (3.2 + run / 2), top / 2 - 0.05, 0], { color: S, apex: s * -0.5 });
      for (const z of [-1.3, 1.3]) {
        b.box([6.6, 0.85, 0.3], [0, top + 0.52, z], { color: S, round: 0.05 });
        b.box([6.7, 0.12, 0.42], [0, top + 1.0, z], { color: '#d8d2c2', round: 0.2 });
        b.box([L, 0.85, 0.3], [s * (3.2 + run / 2), top / 2 + 0.52, z], { color: S, rot: [0, 0, s * -a], round: 0.05 });
        b.box([L, 0.12, 0.42], [s * (3.2 + run / 2), top / 2 + 1.0, z], { color: '#d8d2c2', rot: [0, 0, s * -a], round: 0.2 });
      }
      b.cyl([0.14, 2.5, 0.14], [s * 7.0, 1.25, 1.3], { color: 'iron' });
      b.cyl([0.3, 0.12, 0.3], [s * 7.0, 0.06, 1.3], { color: 'iron' });
      b.box([0.34, 0.42, 0.34], [s * 7.0, 2.68, 1.3], { color: '#fff1b8', glow: true, name: `lamp${s > 0 ? 1 : 2}`, mover: { kind: 'light', on: true } });
      b.pyramid([0.48, 0.22, 0.48], [s * 7.0, 3.0, 1.3], 4, { color: 'iron' });
    });
    return b.socket('deck', [0, top + 0.1, 0], 'top', { size: 2 }).act({ click: [[A.operate('lamp')], [A.par(A.effect('water_spray', { dur: 2 }), A.say('Splish splash...', 2))]] }).done();
  }),
  e('brie', 'food', 'cheese', () =>
    m('brie')
      .box([0.34, 0.015, 0.32], [0, 0.0075, 0], { color: 'wood', round: 0.3, edge: 'sharp' })
      .cyl([0.2, 0.045, 0.2], [0, 0.0375, -0.04], { color: '#f6f1e2', name: 'wheel' })
      .wedge([0.075, 0.09, 0.045], [0, 0.0375, 0.11], { color: '#f4e3a2', rot: [-90, 0, 0], name: 'wedge', parent: 'wheel', piece: true })
      .box([0.075, 0.045, 0.006], [0, 0.0375, 0.157], { color: '#f6f1e2', round: 0.2, parent: 'wedge' })
      .box([0.012, 0.004, 0.1], [0.12, 0.017, 0.06], { color: 'silver', rot: [0, 20, 0], edge: 'sharp' })
      .box([0.016, 0.012, 0.06], [0.1, 0.021, -0.02], { color: 'darkwood', rot: [0, 20, 0], edge: 'sharp' })
      .act({ click: [[A.detach('wedge', 'wedge')], [A.reattach('wedge')]] })
      .done(),
  ),
  e('briefs', 'wardrobe', 'underwear', () =>
    m('briefs')
      .box([0.3, 0.035, 0.06], [0, 0.23, 0], { color: 'navy', round: 0.4 })
      .label('BRIEFS', [0.1, 0.018], [0, 0.23, 0.031], { color: 'navy', depth: 0.003 })
      .box([0.29, 0.07, 0.05], [0, 0.18, 0], { color: '#7fb0e0', round: 0.3 })
      .wedge([0.29, 0.13, 0.05], [0, 0.08, 0], { color: '#7fb0e0', rot: [0, 0, 180] })
      .box([0.08, 0.03, 0.05], [0, 0.02, 0], { color: '#7fb0e0', round: 0.4 })
      .rod([0.145, 0.15, 0.022], [0.045, 0.025, 0.022], 0.016, 'navy')
      .rod([-0.145, 0.15, 0.022], [-0.045, 0.025, 0.022], 0.016, 'navy')
      .box([0.07, 0.09, 0.006], [0, 0.13, 0.026], { color: '#6a9ed6', round: 0.4, noInk: true })
      .act({ click: [A.par(A.anim('shake'), A.effect('sparkle', { dur: 1 }))] })
      .done(),
  ),
  // A head of broccoli: a pale stalk branching into dark florets; one floret snaps off.
  e('broccoli', 'food', 'vegetables', () => {
    const b = m('broccoli').cyl([0.05, 0.13, 0.05], [0, 0.065, 0], { color: '#9cc76f', taper: 0.8, name: 'stalk' });
    around(5, 0.055).forEach(([x, z], i) => {
      b.rod([0, 0.11, 0], [x, 0.15, z], 0.02, '#9cc76f', i === 0 ? { name: 'floret', parent: 'stalk', piece: true } : undefined);
      b.ball(0.08, [x, 0.17, z], { color: 'darkgreen', ...(i === 0 ? { parent: 'floret' } : {}) });
      b.ball(0.045, [x * 1.2, 0.19, z * 1.2], { color: '#4a8a36', noInk: true, ...(i === 0 ? { parent: 'floret' } : {}) });
    });
    b.ball([0.11, 0.09, 0.11], [0, 0.2, 0], { color: '#4f8f3a' });
    b.pair((s) => b.ball([0.05, 0.02, 0.03], [s * 0.035, 0.06, 0.01], { color: '#7fae58', rot: [0, 0, s * 40] }));
    return b.act({ click: [[A.detach('floret', 'floret')], [A.reattach('floret')]] }).done();
  }),
  e('brooch', 'wardrobe', 'jewellery', () => {
    const b = m('brooch')
      .torus([0.065, 0.08, 0.014], [0, 0.045, 0], { color: 'gold', tube: 0.18 })
      .ball([0.042, 0.055, 0.02], [0, 0.045, 0.002], { color: 'teal' })
      .ball([0.014, 0.018, 0.006], [0.008, 0.055, 0.012], { color: 'white', noInk: true })
      .stick([-0.035, 0.045, -0.009], [0.035, 0.045, -0.009], 0.003, 'silver');
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.ball(0.01, [Math.cos(a) * 0.04, 0.045 + Math.sin(a) * 0.048, 0.006], { color: 'white' });
    });
    return b.act({ click: [A.par(A.anim('pulse'), A.effect('sparkle', { dur: 1.2 }))] }).done();
  }),
  // A corn broom, 1.4 m: a long wooden handle into a flat fan of straw stitched in red; it sweeps side to side.
  e('broom', 'home', 'cleaning', () =>
    m('broom')
      .stick([0, 0.4, 0], [0, 1.42, 0], 0.03, 'wood', { name: 'broom', pivot: [0, 1.42, 0] })
      .cyl([0.04, 0.03, 0.04], [0, 1.43, 0], { color: 'red', parent: 'broom' })
      .box([0.36, 0.34, 0.06], [0, 0.2, 0], { color: '#e3c565', round: 0.25, parent: 'broom' })
      .wedge([0.36, 0.08, 0.06], [0, 0.41, 0], { color: '#e3c565', parent: 'broom' })
      .box([0.37, 0.012, 0.065], [0, 0.0, 0], { color: '#c8a84a', round: 0.3, parent: 'broom' })
      .box([0.3, 0.025, 0.066], [0, 0.34, 0], { color: 'red', round: 0.3, parent: 'broom' })
      .box([0.34, 0.025, 0.066], [0, 0.27, 0], { color: 'red', round: 0.3, parent: 'broom' })
      .act({ click: [A.par(A.effect('dust', { dur: 2 }), A.say('Swish swish!', 2)), A.pose('broom', { rot: [0, 0, 14], dur: 0.35 }), A.pose('broom', { rot: [0, 0, -14], dur: 0.5 }), A.pose('broom', { rot: [0, 0, 10], dur: 0.45 }), A.pose('broom', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  e('brownie (food)', 'food', 'desserts', () => {
    const b = plate(m('brownie (food)'), 0.16);
    b.box([0.075, 0.035, 0.075], [0, 0.034, 0], { color: 'chocolate', round: 0.15, rot: [0, 15, 0], name: 'base' })
      .box([0.075, 0.035, 0.075], [0.005, 0.07, 0], { color: 'chocolate', round: 0.15, rot: [0, -20, 0], name: 'top', parent: 'base', piece: true })
      .box([0.07, 0.006, 0.07], [0.005, 0.088, 0], { color: '#4a2a18', rot: [0, -20, 0], noInk: true, parent: 'top' })
      .ball(0.012, [0.01, 0.092, 0.01], { color: 'tan', parent: 'top' })
      .ball(0.01, [-0.015, 0.091, -0.01], { color: 'tan', parent: 'top' });
    return b.act({ click: [[A.detach('top', 'brownie')], [A.reattach('top')]] }).done();
  }),
  // Brownie batter in a mixing bowl with a red spatula that stirs round and round.
  e('brownie batter', 'food', 'baking', () =>
    bowl(m('brownie batter'), 0.22, 0.1, 'white', 'chocolate')
      .ball([0.07, 0.03, 0.07], [0.02, 0.1, 0.01], { color: 'chocolate' })
      .stick([0.03, 0.08, 0], [0.11, 0.21, -0.02], 0.016, 'red', { name: 'spoon', pivot: [0, 0.1, 0] })
      .box([0.05, 0.06, 0.008], [0.015, 0.075, 0.003], { color: 'red', rot: [0, 0, 32], round: 0.4, parent: 'spoon' })
      .act({ click: [A.par(A.pose('spoon', { rot: [0, 720, 0], dur: 2 }), A.say('Stir, stir, stir...', 2)), A.pose('spoon', { rot: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A wooden scrubbing brush with a handle loop and stiff bristles; it scrubs and sparkles.
  e('brush (cleaning)', 'home', 'cleaning', () => {
    const b = m('brush (cleaning)')
      .box([0.22, 0.04, 0.085], [0, 0.06, 0], { color: 'wood', round: 0.7, name: 'brush' })
      .box([0.2, 0.04, 0.072], [0, 0.022, 0], { color: '#efe3b8', round: 0.1, parent: 'brush' });
    b.each(6, (i) => b.box([0.004, 0.035, 0.074], [-0.075 + i * 0.03, 0.022, 0.001], { color: '#c9b98a', noInk: true, parent: 'brush' }));
    path(b, arc(0, 0.075, 0.07, 0.06, 0, 180, 6), 0.02, 'darkwood', { parent: 'brush' });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.6 }), A.say('Scrub scrub!', 1.6)), A.pose('brush', { move: [0.05, 0, 0], dur: 0.2 }), A.pose('brush', { move: [-0.05, 0, 0], dur: 0.3 }), A.pose('brush', { move: [0.05, 0, 0], dur: 0.3 }), A.pose('brush', { move: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A jar of paintbrushes; one hops out with paint on its tip.
  e('brushes', 'study', 'art supplies', () => {
    const b = m('brushes').cyl([0.1, 0.12, 0.1], [0, 0.06, 0], { color: 'glass', name: 'jar' }).cyl([0.1, 0.05, 0.1], [0, 0.025, 0], { color: '#7fb7e0' });
    const tips = ['red', 'yellow', 'blue', 'black', 'green'];
    ([[-0.07, 0.01], [-0.03, -0.02], [0.0, 0.02], [0.035, -0.01], [0.07, 0.015]] as const).forEach(([dx, dz], i) => {
      const a: V = [dx * 0.3, 0.04, dz * 0.4], t: V = [dx, 0.24 + (i % 2) * 0.03, dz];
      const L = Math.hypot(t[0] - a[0], t[1] - a[1], t[2] - a[2]);
      const u: V = [(t[0] - a[0]) / L, (t[1] - a[1]) / L, (t[2] - a[2]) / L];
      const at = (k: number): V => [t[0] + u[0] * k, t[1] + u[1] * k, t[2] + u[2] * k];
      const po: PartOpts = i === 2 ? { parent: 'brush1' } : {};
      b.stick(a, t, 0.012, ['darkwood', 'red', 'wood', 'blue', 'black'][i], i === 2 ? { name: 'brush1', parent: 'jar', piece: true } : {})
        .stick(t, at(0.025), 0.013, 'silver', po)
        .rod(at(0.025), at(0.055), 0.013, tips[i], po);
    });
    return b.act({ click: [[A.detach('brush1', 'brush')], [A.reattach('brush1')]] }).done();
  }),
  e('brussels sprout', 'food', 'vegetables', () => {
    const b = m('brussels sprout').ball([0.04, 0.04, 0.04], [0, 0.026, 0], { color: '#86b84f', name: 'body' }).cyl([0.014, 0.01, 0.014], [0, 0.005, 0], { color: '#e8eebf' });
    around(4, 0.013, 0.4).forEach(([x, z], i) => b.ball([0.034, 0.032, 0.016], [x, 0.023, z], { color: '#5f9a3a', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, i % 2 ? 8 : -8], ...(i === 1 ? { name: 'leaf', parent: 'body', piece: true } : {}) }));
    return b.act({ click: [[A.detach('leaf', 'leaf')], [A.reattach('leaf')]] }).done();
  }),
  // A soap bubble floating at hand height: swells, pops, and a new one forms.
  e('bubble', 'toys', 'bubbles', () =>
    m('bubble')
      .ball(0.1, [0, 0.12, 0], { color: '#d6eefc', name: 'film' })
      .torus([0.1, 0.1, 0.01], [0, 0.12, 0], { color: '#f4c6e0', rot: [70, 20, 0], tube: 0.08, noInk: true, parent: 'film' })
      .torus([0.1, 0.1, 0.008], [0, 0.12, 0], { color: '#c6f4dc', rot: [20, -40, 0], tube: 0.06, noInk: true, parent: 'film' })
      .ball([0.026, 0.018, 0.01], [0.022, 0.148, 0.043], { color: 'white', noInk: true, parent: 'film' })
      .act({ click: [A.pose('film', { scale: 1.3, dur: 0.5 }), A.pose('film', { scale: 0, dur: 0.08 }), A.par(A.say('Pop!', 1), A.effect('water_spray', { dur: 0.5 })), A.wait(1.2), A.pose('film', { scale: 1, dur: 0.8 })] })
      .done(),
  ),
  // A cup of milk tea with a sealed film lid, a fat straw and tapioca pearls; slurp and the pearls go up.
  e('bubble tea', 'food', 'drinks', () => {
    const b = m('bubble tea')
      .cyl([0.075, 0.13, 0.075], [0, 0.065, 0], { color: '#d9b38c', taper: 1.18 })
      .cyl([0.09, 0.006, 0.09], [0, 0.131, 0], { color: '#f4e0f0' })
      .stick([0.008, 0.1, 0], [0.025, 0.23, 0], 0.013, 'pink', { name: 'straw' });
    around(9, 0.036).forEach(([x, z]) => b.ball(0.016, [x, 0.012, z], { color: '#2a1d16' }));
    around(9, 0.038, 0.35).forEach(([x, z], i) => b.ball(0.016, [x, 0.03, z], { color: '#2a1d16', ...(i === 0 ? { name: 'pearl' } : {}) }));
    return b.act({ click: [A.par(A.pose('straw', { move: [0, -0.02, 0], dur: 0.3 }), A.say('Slurrrp!', 1.6)), A.pose('pearl', { move: [0.01, 0.12, 0], dur: 0.5 }), A.pose('pearl', { move: [0, 0, 0], dur: 0.6 }), A.pose('straw', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A bubble wand: blow and a bubble floats up and pops.
  e('bubble wand', 'toys', 'bubbles', () =>
    m('bubble wand')
      .stick([0, 0, 0], [0, 0.17, 0], 0.012, 'pink')
      .torus([0.07, 0.07, 0.012], [0, 0.2, 0], { color: 'pink', tube: 0.15 })
      .cyl([0.06, 0.002, 0.06], [0, 0.2, 0], { color: '#e3f3fc', rot: [90, 0, 0], noInk: true })
      .act({ click: [A.spawn('b', 'bubble', { rel: 'above', of: 'self', dist: 'touch' }), A.move('b', { rel: 'above', of: 'self', dist: 'near' }, { speed: 'slow', style: 'fly' }), A.remove('b', 'pop'), A.say('Pop!', 1)] })
      .done(),
  ),
  e('bubbles', 'toys', 'bubbles', () => {
    const b = m('bubbles');
    ([[0.06, 0, 0.06, 0], [0.04, 0.055, 0.12, 0.01], [0.035, -0.045, 0.11, -0.01], [0.025, 0.02, 0.165, 0], [0.02, -0.025, 0.175, 0.01]] as const).forEach(([d, x, y, z], i) => {
      b.ball(d, [x, y, z], { color: i % 2 ? '#e8d6fc' : '#d6eefc', name: `b${i}` });
      if (d > 0.03) b.ball([d * 0.25, d * 0.18, d * 0.1], [x + d * 0.2, y + d * 0.25, z + d * 0.42], { color: 'white', noInk: true, parent: `b${i}` });
    });
    return b.act({ click: [A.pose('b1', { scale: 0, dur: 0.1 }), A.say('Pop!', 0.8), A.pose('b3', { scale: 0, dur: 0.1 }), A.say('Pop!', 0.8), A.wait(0.6), A.par(A.pose('b1', { scale: 1, dur: 0.6 }), A.pose('b3', { scale: 1, dur: 0.6 }))] }).done();
  }),
  // A 10 litre plastic bucket of water with a wire handle that lifts.
  e('bucket', 'home', 'cleaning', () => {
    const b = m('bucket')
      .cyl([0.25, 0.27, 0.25], [0, 0.135, 0], { color: 'blue', taper: 1.2 })
      .torus([0.305, 0.305, 0.02], [0, 0.27, 0], { color: 'blue', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.27, 0.006, 0.27], [0, 0.23, 0], { color: 'water', noInk: true });
    b.pair((s) => b.cyl([0.03, 0.02, 0.03], [s * 0.145, 0.245, 0], { color: 'navy', rot: [0, 0, 90] }));
    b.arc([0.3, 0.26, 0.012], [0, 0.245, 0], { color: 'silver', tube: 0.04, rot: [-75, 0, 0], name: 'handle', pivot: [0, 0.245, 0], mover: { kind: 'swing', axis: 'x', amount: 75 } });
    return b.act({ click: [A.operate('handle', 'up'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Slosh!', 1.2)), A.wait(0.8), A.operate('handle', 'down')] }).done();
  }),
  e('bucket hat', 'wardrobe', 'hats', () =>
    m('bucket hat')
      .cyl([0.3, 0.06, 0.3], [0, 0.03, 0], { color: '#c8b77a', taper: 0.62, name: 'hat' })
      .cyl([0.19, 0.09, 0.19], [0, 0.105, 0], { color: '#c8b77a', taper: 0.86, parent: 'hat' })
      .ball([0.165, 0.035, 0.165], [0, 0.15, 0], { color: '#c8b77a', parent: 'hat' })
      .cyl([0.192, 0.022, 0.192], [0, 0.075, 0], { color: 'darkbrown', parent: 'hat' })
      .act({ click: [A.pose('hat', { move: [0, 0.15, 0], rot: [0, 360, 0], dur: 0.5 }), A.pose('hat', { move: [0, 0, 0], rot: [0, 720, 0], dur: 0.4 }), A.pose('hat', { rot: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A belt buckle on its strap: the prong flips up and clicks back down.
  e('buckle', 'wardrobe', 'belts', () => {
    const b = m('buckle', { edge: 'sharp' }).box([0.2, 0.04, 0.014], [0, 0.05, -0.004], { color: 'leather', round: 0.3, edge: 'soft' });
    b.box([0.08, 0.015, 0.016], [0, 0.092, 0.004], { color: 'gold' }).box([0.08, 0.015, 0.016], [0, 0.008, 0.004], { color: 'gold' });
    b.pair((s) => b.box([0.015, 0.099, 0.016], [s * 0.033, 0.05, 0.004], { color: 'gold' }));
    b.each(3, (i) => b.cyl([0.006, 0.016, 0.006], [0.06 + i * 0.022, 0.05, -0.004], { color: '#3a2a1e', rot: [90, 0, 0], noInk: true }));
    return b.box([0.045, 0.007, 0.007], [0.008, 0.05, 0.014], { color: 'silver', name: 'prong', pivot: [-0.033, 0.05, 0.014] }).act({ click: [A.pose('prong', { rot: [0, 50, 0], dur: 0.2 }), A.say('Click!', 1), A.pose('prong', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A tiny listening bug with a blinking red light and a whip antenna.
  e('bug (spy)', 'tech', 'spy gadgets', () =>
    m('bug (spy)', { edge: 'sharp' })
      .cyl([0.045, 0.012, 0.045], [0, 0.006, 0], { color: 'black' })
      .ball([0.028, 0.016, 0.028], [0, 0.013, 0], { color: 'darkgray', edge: 'soft' })
      .ball(0.007, [0.01, 0.02, 0.008], { color: 'red', glow: true, name: 'led', mover: { kind: 'light', on: true } })
      .stick([0.014, 0.012, -0.01], [0.022, 0.1, -0.01], 0.003, 'silver')
      .ball(0.007, [0.022, 0.1, -0.01], { color: 'black' })
      .act({ click: [A.operate('led'), A.say('Bzzt... click.', 1.5), A.wait(0.4), A.operate('led'), A.wait(0.4), A.operate('led'), A.wait(0.4), A.operate('led')] })
      .done(),
  ),
  // An aerosol can of insect repellent: press the nozzle and it sprays a mist.
  e('bug spray', 'home', 'household', () =>
    m('bug spray')
      .cyl([0.065, 0.17, 0.065], [0, 0.085, 0], { color: 'green', edge: 'sharp', round: 0.1 })
      .ball([0.065, 0.035, 0.065], [0, 0.17, 0], { color: 'silver' })
      .cyl([0.03, 0.025, 0.03], [0, 0.19, 0], { color: 'white' })
      .cyl([0.016, 0.014, 0.016], [0, 0.205, 0.004], { color: 'white', name: 'nozzle' })
      .cyl([0.006, 0.01, 0.006], [0, 0.206, 0.014], { color: 'black', rot: [90, 0, 0], parent: 'nozzle' })
      .label('BUG OFF', [0.05, 0.05], [0, 0.1, 0.034], { color: 'yellow', depth: 0.003 })
      .act({ click: [A.pose('nozzle', { move: [0, -0.004, 0], dur: 0.1 }), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Psssssht!', 1.5)), A.pose('nozzle', { move: [0, 0, 0], dur: 0.1 })] })
      .done(),
  ),
  // A hanging bug zapper: a violet UV tube inside a wire cage under a little roof with a hook.
  e('bug zapper', 'garden', 'garden gear', () => {
    const b = m('bug zapper')
      .cyl([0.16, 0.04, 0.16], [0, 0.02, 0], { color: 'darkgray', edge: 'sharp' })
      .cyl([0.08, 0.3, 0.08], [0, 0.19, 0], { color: 'violet', glow: true, name: 'light', mover: { kind: 'light', on: true } })
      .cyl([0.18, 0.04, 0.18], [0, 0.37, 0], { color: 'darkgray', taper: 0.6, edge: 'sharp' })
      .torus([0.05, 0.05, 0.01], [0, 0.42, 0], { color: 'silver' });
    around(10, 0.07).forEach(([x, z]) => b.stick([x, 0.04, z], [x, 0.35, z], 0.005, 'silver', { noInk: true }));
    b.each(3, (i) => b.torus([0.15, 0.15, 0.008], [0, 0.1 + i * 0.1, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.06 }));
    return b.act({ click: [[A.par(A.effect('sparkle', { dur: 0.6 }), A.say('ZAP!', 1)), A.wait(0.5), A.par(A.effect('sparkle', { dur: 0.6 }), A.say('Bzzzt!', 1))], [A.operate('light')]] }).done();
  }),
  // A light bulb: a screw base and a glass bulb that switches on and off.
  e('bulb', 'home', 'lighting', () =>
    m('bulb')
      .ball(0.012, [0, 0.004, 0], { color: 'black' })
      .cyl([0.027, 0.032, 0.027], [0, 0.02, 0], { color: 'silver', edge: 'sharp' })
      .torus([0.03, 0.03, 0.005], [0, 0.014, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 })
      .torus([0.03, 0.03, 0.005], [0, 0.026, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.028, 0.03, 0.028], [0, 0.048, 0], { color: '#fff2b0', taper: 1.7 })
      .ball([0.068, 0.07, 0.068], [0, 0.085, 0], { color: '#fff2b0', glow: true, name: 'glass', mover: { kind: 'light', on: true } })
      .stick([-0.008, 0.06, 0], [-0.008, 0.08, 0], 0.002, 'darkgray', { noInk: true })
      .stick([0.008, 0.06, 0], [0.008, 0.08, 0], 0.002, 'darkgray', { noInk: true })
      .stick([-0.008, 0.08, 0], [0.008, 0.08, 0], 0.003, 'orange', { noInk: true })
      .act({ click: [A.operate('glass')] })
      .done(),
  ),
  // A crawler bulldozer at its real size (3 m to the cab roof, 2.6 m wide): two tracks with idlers and raised drive
  // sprockets, an engine hood with a grille and an exhaust stack, an open-sided cab with a seat, a curved blade on
  // push arms that lifts (a swing mover), a ripper at the back, work lights on the roof.
  e('bulldozer', 'garage', 'construction vehicles', () => {
    const b = m('bulldozer', { view: 'side', edge: 'sharp' });
    b.pair((s) => {
      b.box([0.55, 0.85, 3.0], [s * 1.05, 0.46, 0], { color: 'rubber', round: 0.5, edge: 'soft' });
      b.each(9, (i) => b.box([0.57, 0.05, 0.1], [s * 1.05, 0.9, -1.1 + i * 0.27], { color: '#2a2726', round: 0.2, noInk: true }));
      b.cyl([0.66, 0.6, 0.66], [s * 1.05, 0.46, 1.18], { color: '#4a4744', rot: [0, 0, 90], name: `wheelF${s > 0 ? 'L' : 'R'}` });
      b.cyl([0.8, 0.62, 0.8], [s * 1.05, 0.62, -1.15], { color: 'yellow', rot: [0, 0, 90], segs: 12, name: `wheelB${s > 0 ? 'L' : 'R'}` });
      b.each(4, (i) => b.cyl([0.24, 0.6, 0.24], [s * 1.05, 0.2, -0.7 + i * 0.5], { color: '#4a4744', rot: [0, 0, 90] }));
      b.cyl([0.12, 0.8, 0.12], [s * 0.35, 2.25, 0.95], { color: s > 0 ? 'darkgray' : 'yellow' });
    });
    b.box([2.6, 0.14, 3.1], [0, 0.98, 0], { color: 'yellow' })
      .box([1.35, 0.85, 1.75], [0, 1.47, 0.55], { color: 'yellow', round: 0.12 })
      .box([1.38, 0.9, 0.12], [0, 1.45, 1.45], { color: '#3a3633' });
    b.each(5, (i) => b.box([1.2, 0.04, 0.03], [0, 1.15 + i * 0.15, 1.52], { color: '#6b6560', noInk: true }));
    b.pair((s) => b.each(3, (i) => b.box([0.03, 0.5, 0.06], [s * 0.68, 1.47, 0.2 + i * 0.25], { color: '#a8861e', noInk: true })));
    b.box([1.6, 0.25, 1.45], [0, 1.15, -0.75], { color: 'yellow' })
      .box([0.55, 0.12, 0.5], [0, 1.45, -0.95], { color: '#3a3633', round: 0.4, edge: 'soft' })
      .box([0.55, 0.6, 0.12], [0, 1.75, -1.2], { color: '#3a3633', round: 0.4, edge: 'soft' })
      .box([1.4, 1.35, 0.04], [0, 2.05, -0.06], { color: 'glass', round: 0.1 })
      .box([1.4, 1.35, 0.04], [0, 2.05, -1.42], { color: 'glass', round: 0.1 })
      .box([1.7, 0.14, 1.6], [0, 2.88, -0.75], { color: 'yellow', round: 0.2 });
    for (const x of [-0.74, 0.74]) for (const z of [-0.05, -1.43]) b.box([0.08, 1.6, 0.08], [x, 2.05, z], { color: 'yellow' });
    b.pair((s) => sidePane(b, s, 0.74, 2.05, -0.75, 1.3, 1.3, 'glass'));
    b.pair((s) => b.box([0.22, 0.14, 0.12], [s * 0.45, 3.0, -0.05], { color: '#fff6c8', glow: true, name: `light${s > 0 ? 1 : 2}`, mover: { kind: 'light' } }));
    // the blade on its push arms, lifting about the arms' back ends
    b.box([3.3, 1.2, 0.16], [0, 0.72, 2.25], { color: 'yellow', rot: [-8, 0, 0], name: 'blade', pivot: [0, 0.5, 0.1], mover: { kind: 'swing', axis: 'x', amount: -14 } })
      .box([3.3, 0.1, 0.24], [0, 0.08, 2.32], { color: 'steel', parent: 'blade' })
      .box([3.3, 0.12, 0.3], [0, 1.32, 2.12], { color: 'yellow', parent: 'blade' });
    b.pair((s) => {
      b.box([0.14, 1.2, 0.5], [s * 1.62, 0.72, 2.1], { color: 'yellow', parent: 'blade' });
      b.rod([s * 1.35, 0.5, 0.1], [s * 1.35, 0.55, 2.1], 0.16, 'yellow', { parent: 'blade' });
      b.rod([s * 0.55, 1.75, 1.3], [s * 0.55, 1.2, 2.05], 0.11, 'silver', { parent: 'blade' });
    });
    b.rod([0, 0.95, -1.55], [0, 0.6, -2.0], 0.18, 'yellow')
      .box([0.16, 0.9, 0.2], [0, 0.4, -2.05], { color: '#3a3633', rot: [20, 0, 0] })
      .socket('seat', [0, 1.52, -0.9], 'seat');
    return b
      .act({
        click: [
          [A.par(A.anim('shake', 3), A.effect('smoke', { dur: 2 }), A.say('Rrrumble!', 2)), A.operate('blade', 'on'), A.effect('dust', { dur: 1.5 }), A.wait(1), A.operate('blade', 'off')],
          [A.operate('light'), A.say('Beep, beep, beep...', 1.8)],
        ],
      })
      .done();
  }),
  e('bullet', 'armory', 'ammunition', () =>
    m('bullet', { edge: 'sharp' })
      .cyl([0.029, 0.005, 0.029], [0, 0.0025, 0], { color: 'brass' })
      .cyl([0.026, 0.055, 0.026], [0, 0.03, 0], { color: 'brass' })
      .cyl([0.022, 0.006, 0.022], [0, 0.058, 0], { color: '#b8923a' })
      .cyl([0.024, 0.032, 0.024], [0, 0.075, 0], { color: 'copper', taper: 0.45, edge: 'soft' })
      .ball(0.012, [0, 0.09, 0], { color: 'copper', edge: 'soft' })
      .act({ click: [A.par(A.anim('spin'), A.say('Ping!', 1), A.effect('sparkle', { dur: 0.8 }))] })
      .done(),
  ),
  // A police vest stood up as if worn: front panel with pockets, shoulder straps, side straps, a POLICE patch.
  e('bullet proof vest', 'armory', 'armour', () => {
    const b = m('bullet proof vest')
      .box([0.46, 0.55, 0.26], [0, 0.4, 0], { color: 'navy', round: 0.4 })
      .box([0.42, 0.5, 0.03], [0, 0.4, 0.13], { color: '#26406f', round: 0.3 })
      .label('POLICE', [0.28, 0.07], [0, 0.52, 0.15], { color: 'white', depth: 0.006 })
      .box([0.48, 0.07, 0.27], [0, 0.16, 0], { color: 'black', round: 0.3 });
    b.pair((s) => {
      b.box([0.11, 0.1, 0.27], [s * 0.16, 0.71, 0], { color: 'navy', round: 0.4 });
      b.box([0.12, 0.11, 0.04], [s * 0.12, 0.3, 0.15], { color: '#1f3460', round: 0.2 });
      b.box([0.03, 0.1, 0.03], [s * 0.12, 0.36, 0.17], { color: 'black', round: 0.2 });
      b.box([0.04, 0.2, 0.2], [s * 0.235, 0.35, 0], { color: 'black', round: 0.3 });
    });
    return b.act({ click: [A.par(A.anim('shake'), A.say('Thunk!', 1), A.effect('sparkle', { dur: 0.8 }))] }).done();
  }),
  // A Shinkansen lead car at real size (25 m, 3.6 m tall) on its own stretch of track: a long sloping nose from a
  // loft, a dark cockpit window, a window band and a blue stripe down each side, plug doors that slide open, two
  // bogies of wheels on axles, headlights and a pantograph on the roof.
  e('bullet train', 'garage', 'trains', () => {
    const b = m('bullet train', { view: 'side' })
      .loft([3.36, 2.8, 25], [0, 2.32, 0], [[0, 0.98, 0.98, 0], [0.55, 1, 1, 0], [0.68, 0.98, 0.95, -0.02], [0.8, 0.86, 0.7, -0.13], [0.9, 0.62, 0.44, -0.24], [0.97, 0.32, 0.24, -0.32], [1, 0.08, 0.1, -0.36]], { color: 'white', boxy: 0.6, name: 'body' })
      .loft([1.7, 0.7, 4.0], [0, 3.05, 6.6], [[0, 0.3, 0.2, 0], [0.4, 1, 1, 0], [1, 0.4, 0.3, -0.2]], { color: '#1e2633', boxy: 0.3, edge: 'sharp' })
      .box([3.2, 0.5, 23], [0, 1.05, -1.2], { color: '#5c6166', round: 0.2, edge: 'sharp' });
    track(b, -13, 13);
    b.pair((s) => {
      b.box([0.04, 0.16, 20], [s * 1.69, 1.82, -2.4], { color: '#2f5fb0', edge: 'sharp', round: 0 });
      b.box([0.04, 0.05, 20], [s * 1.69, 1.66, -2.4], { color: '#2f5fb0', edge: 'sharp', round: 0 });
      b.each(9, (i) => sidePane(b, s, 1.68, 2.62, -11.2 + i * 1.6, 0.55, 1.1));
      for (const [k, z] of [[1, -9.6], [2, 3.4]] as const)
        b.box([0.05, 1.95, 0.9], [s * 1.685, 1.95, z], { color: '#e6e9ec', round: 0.1, edge: 'sharp', name: `door${s > 0 ? 'L' : 'R'}${k}`, mover: { kind: 'slide', axis: 'z', amount: 0.85 } });
      b.ball([0.4, 0.18, 0.5], [s * 0.85, 1.5, 9.7], { color: '#fff6c8', glow: true, name: `light${s > 0 ? 1 : 2}`, mover: { kind: 'light' } });
    });
    for (const z of [-8.6, 5.6]) {
      b.box([2.4, 0.5, 3.0], [0, 0.82, z], { color: '#3a3633', round: 0.2, edge: 'sharp' });
      axle(b, 0.72, 0.45, z - 1.25, 0.86, 0.14, `wheel${z < 0 ? 'a' : 'c'}`, 'steel', '#4a4744');
      axle(b, 0.72, 0.45, z + 1.25, 0.86, 0.14, `wheel${z < 0 ? 'b' : 'd'}`, 'steel', '#4a4744');
    }
    b.box([1.2, 0.15, 0.8], [0, 3.76, -3.5], { color: '#5c6166', edge: 'sharp' })
      .rod([0, 3.8, -3.8], [0, 4.4, -3.2], 0.05, 'darkgray')
      .rod([0, 4.4, -3.2], [0, 4.7, -3.7], 0.05, 'darkgray')
      .box([1.4, 0.05, 0.1], [0, 4.72, -3.7], { color: 'darkgray', edge: 'sharp' })
      .label('N700', [0.9, 0.25], [1.7, 2.1, 7.5], { color: 'white', rot: [0, 90, 0], depth: 0.01 });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Ding dong ding!', 2)), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('light', 'on'), A.par(A.anim('shake', 2), A.say('Whoooosh!', 2)), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A cork notice board on two legs, board top at 1.75 m: notes and photos held by push pins; one note falls off.
  e('bulletin board', 'study', 'office', () => {
    const b = m('bulletin board', { edge: 'sharp' })
      .box([1.24, 0.92, 0.05], [0, 1.28, 0], { color: 'darkwood', round: 0.2, name: 'board' })
      .box([1.14, 0.82, 0.06], [0, 1.28, 0.004], { color: '#c89b62', round: 0.05 })
      .box([0.22, 0.27, 0.01], [-0.32, 1.4, 0.04], { color: 'white', rot: [0, 0, 5], name: 'note', piece: true, parent: 'board' })
      .label('MEETING 3PM', [0.18, 0.06], [-0.32, 1.42, 0.047], { color: 'white', depth: 0.003, rot: [0, 0, 5], parent: 'note' })
      .box([0.16, 0.16, 0.01], [0.08, 1.46, 0.04], { color: 'yellow', rot: [0, 0, -6] })
      .box([0.16, 0.16, 0.01], [0.36, 1.12, 0.04], { color: 'pink', rot: [0, 0, 8] })
      .box([0.24, 0.17, 0.01], [-0.05, 1.08, 0.04], { color: 'skyblue', rot: [0, 0, -3] })
      .box([0.16, 0.2, 0.01], [0.36, 1.48, 0.04], { color: 'lime', rot: [0, 0, 4] })
      .box([0.2, 0.14, 0.01], [-0.4, 1.0, 0.04], { color: '#f2e6cf', rot: [0, 0, -7] });
    for (const [x, y, c] of [[0.08, 1.53, 'blue'], [0.36, 1.19, 'green'], [-0.05, 1.15, 'red'], [0.36, 1.57, 'yellow'], [-0.4, 1.06, 'blue']] as const) b.ball(0.022, [x, y, 0.055], { color: c, edge: 'soft' });
    b.ball(0.022, [-0.32, 1.52, 0.055], { color: 'red', edge: 'soft', parent: 'note' });
    b.pair((s) => b.box([0.06, 0.85, 0.05], [s * 0.5, 0.42, 0], { color: 'darkwood' }).box([0.08, 0.06, 0.45], [s * 0.5, 0.03, 0], { color: 'darkwood', round: 0.3 }));
    return b.act({ click: [[A.detach('note', 'note')], [A.reattach('note')]] }).done();
  }),
  // A dodgem: a fibreglass body inside a fat rubber bumper ring, a seat, a steering wheel and the pole that
  // picks up power from the ceiling. Click: bonk; click again: a spin.
  e('bumper car', 'toys', 'fairground', () =>
    m('bumper car', { view: 'side' })
      .loft([1.25, 0.55, 1.95], [0, 0.48, 0], [[0, 0.85, 0.8, 0.05], [0.3, 1, 1, 0], [0.75, 1, 0.9, -0.05], [1, 0.8, 0.6, -0.15]], { color: 'red', boxy: 0.7, name: 'car' })
      .torus([1.5, 2.2, 0.3], [0, 0.24, 0], { color: 'rubber', rot: [90, 0, 0], tube: 0.18, parent: 'car' })
      .box([1.0, 0.1, 0.9], [0, 0.72, -0.1], { color: '#2a2726', round: 0.3, parent: 'car' })
      .box([0.95, 0.65, 0.3], [0, 0.95, -0.6], { color: 'red', round: 0.5, parent: 'car' })
      .box([0.8, 0.5, 0.12], [0, 0.95, -0.44], { color: '#2a2726', round: 0.5, parent: 'car' })
      .box([0.75, 0.14, 0.55], [0, 0.73, -0.15], { color: '#2a2726', round: 0.5, parent: 'car', edge: 'soft' })
      .rod([0, 0.62, 0.55], [0, 0.88, 0.3], 0.05, 'darkgray', { parent: 'car' })
      .torus([0.32, 0.32, 0.05], [0, 0.9, 0.28], { color: '#2a2726', rot: [55, 0, 0], tube: 0.18, parent: 'car' })
      .stick([0, 1.0, -0.78], [0, 2.6, -0.78], 0.05, 'silver', { parent: 'car' })
      .box([0.16, 0.08, 0.3], [0, 2.62, -0.7], { color: 'darkgray', edge: 'sharp', parent: 'car' })
      .ball(0.12, [0, 2.7, -0.6], { color: 'yellow', glow: true, parent: 'car' })
      .label('7', [0.28, 0.28], [0, 0.52, 0.97], { color: 'yellow', rot: [-25, 0, 0], parent: 'car' })
      .ball([0.2, 0.12, 0.06], [0.36, 0.55, 0.92], { color: '#fff6c8', glow: true, parent: 'car', name: 'light1', mover: { kind: 'light', on: true } })
      .ball([0.2, 0.12, 0.06], [-0.36, 0.55, 0.92], { color: '#fff6c8', glow: true, parent: 'car', name: 'light2', mover: { kind: 'light', on: true } })
      .socket('seat', [0, 0.78, -0.2], 'seat')
      .act({ click: [[A.par(A.anim('shake'), A.say('Bonk!', 1), A.effect('sparkle', { dur: 0.6 }))], [A.par(A.pose('car', { rot: [0, 360, 0], dur: 1.2 }), A.say('Wheee!', 1.2)), A.pose('car', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done(),
  ),
  // A single-storey bungalow at real size (11 m wide): a deep gable roof, a front veranda on posts, a front door
  // that swings open, sash windows with shutters, a chimney, a porch light.
  e('bungalow', 'places', 'houses', () => {
    const b = m('bungalow', { edge: 'sharp' })
      .box([11, 2.8, 8], [0, 1.6, 0], { color: '#efe2c4', round: 0.02 })
      .box([11.1, 0.25, 8.1], [0, 0.125, 0], { color: '#8a7f72' })
      .wedge([9.2, 2.6, 11.8], [0, 4.3, 0], { color: '#8a3a2e', rot: [0, 90, 0] })
      .box([11.8, 0.12, 0.3], [0, 3.0, 4.5], { color: 'white' })
      .box([0.7, 2.2, 0.7], [-3.4, 5.0, -1.4], { color: '#b5523b' })
      .box([0.8, 0.12, 0.8], [-3.4, 6.1, -1.4], { color: '#8a3a2e' })
      .box([5.6, 0.2, 2.4], [1.8, 0.35, 5.2], { color: 'wood' })
      .box([5.8, 0.12, 2.6], [1.8, 2.95, 5.3], { color: '#8a3a2e', rot: [-8, 0, 0] })
      .box([1.6, 0.2, 0.6], [1.8, 0.12, 6.7], { color: 'stone' })
      .box([0.95, 2.05, 0.08], [1.8, 1.27, 4.04], { color: '#2f7a7a', name: 'door', pivot: [1.33, 1.27, 4.04], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .ball(0.08, [2.15, 1.25, 4.1], { color: 'brass', parent: 'door' })
      .box([0.5, 0.6, 0.03], [1.8, 1.75, 4.09], { color: 'glass', parent: 'door' })
      .box([0.25, 0.3, 0.2], [2.6, 2.2, 4.1], { color: '#fff1b8', glow: true, name: 'light', mover: { kind: 'light', on: true } })
      .label('12', [0.4, 0.25], [1.0, 2.2, 4.06], { color: 'white', depth: 0.02 });
    for (const x of [-1.2, 4.5]) b.box([0.14, 2.55, 0.14], [x, 1.7, 6.3], { color: 'white' });
    for (const [x, z, side] of [[-3.0, 4.03, 0], [-0.4, 4.03, 0], [4.2, 4.03, 0], [5.53, 1.5, 1], [5.53, -2, 1], [-5.53, 0, -1]] as const) {
      if (side) {
        b.box([0.08, 1.45, 1.25], [x, 1.7, z], { color: 'white' });
        b.box([0.1, 1.3, 1.1], [x + side * 0.02, 1.7, z], { color: '#2f3d52' });
        continue;
      }
      b.box([1.25, 1.45, 0.08], [x, 1.7, z], { color: 'white' });
      b.box([1.1, 1.3, 0.06], [x, 1.7, z + 0.03], { color: '#2f3d52' });
      b.box([1.1, 0.05, 0.08], [x, 1.7, z + 0.06], { color: 'white' });
      b.box([1.4, 0.08, 0.22], [x, 0.95, z + 0.1], { color: 'white' });
      b.pair((s) => b.box([0.38, 1.45, 0.05], [x + s * 0.84, 1.7, z + 0.04], { color: '#3f6f5a' }));
    }
    return b
      .socket('porch', [0.2, 0.46, 5.2], 'top', { size: 2 })
      .act({ click: [[A.say('Ding dong!', 1.5), A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')], [A.operate('light')]] })
      .done();
  }),
  e('bungee cord', 'workshop', 'hardware', () => {
    const b = m('bungee cord');
    path(b, arc(0, 0.13, 0.12, 0.11, 180, 360, 7), 0.016, 'orange');
    b.each(8, (i) => b.ball(0.006, [-0.1 + i * 0.028, 0.03 + Math.abs(i - 3.5) * 0.012, 0.008], { color: 'black', noInk: true }));
    b.pair((s) => {
      b.cyl([0.026, 0.035, 0.026], [s * 0.12, 0.15, 0], { color: 'black' });
      path(b, [[s * 0.12, 0.165, 0], [s * 0.12, 0.2, 0], ...arc(s * 0.1, 0.2, 0.02, 0.02, s > 0 ? 0 : 180, s > 0 ? 180 : 0, 3), [s * 0.08, 0.18, 0]], 0.008, 'silver');
      b.ball(0.012, [s * 0.08, 0.178, 0], { color: 'red' });
    });
    return b.act({ click: [A.par(A.anim('bounce', 3), A.say('Boing-oing-oing!', 1.6))] }).done();
  }),
  // A real bunk bed: a sturdy wooden frame 2 m long, a lower bunk at 0.45 m and an upper one at 1.5 m with a
  // guard rail, a ladder, mattresses, pillows and duvets. A child climbs to the top bunk.
  e('bunk bed', 'home', 'beds', () => {
    const b = m('bunk bed', { edge: 'sharp' });
    for (const x of [-1.0, 1.0]) for (const z of [-0.47, 0.47]) b.box([0.08, 1.75, 0.08], [x, 0.875, z], { color: 'wood' });
    for (const [y, c] of [[0.3, '#3f5f9a'], [1.32, '#d0503f']] as const) {
      b.box([2.08, 0.14, 1.0], [0, y, 0], { color: 'wood' })
        .box([1.95, 0.15, 0.9], [0, y + 0.14, 0], { color: 'white', round: 0.4, edge: 'soft' })
        .box([1.4, 0.1, 0.92], [0.27, y + 0.24, 0], { color: c, round: 0.5, edge: 'soft' })
        .box([0.42, 0.12, 0.62], [-0.72, y + 0.27, 0], { color: 'white', round: 0.7, edge: 'soft' });
      b.pair((s) => b.box([0.06, 0.3, 0.94], [s * 1.0, y + 0.3, 0], { color: 'wood' }));
    }
    b.box([1.3, 0.1, 0.05], [-0.35, 1.72, 0.47], { color: 'wood' }).box([1.3, 0.1, 0.05], [-0.35, 1.58, 0.47], { color: 'wood' });
    b.pair((s) => b.box([0.05, 1.3, 0.05], [0.62 + s * 0.2, 0.95, 0.52], { color: 'wood' }));
    b.each(4, (i) => b.box([0.4, 0.04, 0.04], [0.62, 0.55 + i * 0.27, 0.52], { color: 'wood' }));
    return b
      .socket('top', [0.2, 1.6, 0], 'top', { size: 1.5 })
      .socket('bottom', [0.2, 0.58, 0], 'top', { size: 1.5 })
      .act({ click: [A.spawn('kid', 'boy'), A.attach('kid', 'self', 'top'), A.par(A.anim('arms_up', 1, 'kid'), A.say('Top bunk is mine!', 2, 'kid')), A.wait(0.8), A.remove('kid', 'fade')] })
      .done();
  }),
  // A golf bunker: a scooped sand trap in the grass with a raked surface, a ball in it, the rake, and the flag of
  // the green beyond. Click: the ball is splashed out in a puff of sand.
  e('bunker', 'sports', 'golf', () => {
    const b = m('bunker')
      .cyl([6.4, 0.2, 5.0], [0, 0.1, 0], { color: 'grass' })
      .ball([4.6, 0.16, 3.4], [-0.4, 0.2, 0.2], { color: '#d9c48a' })
      .ball([4.2, 0.14, 3.0], [-0.4, 0.22, 0.2], { color: 'sand', noInk: true })
      .ball(0.043, [-0.2, 0.31, 0.5], { color: 'white', name: 'ball' })
      .stick([2.4, 0.2, -1.6], [2.4, 2.3, -1.6], 0.03, 'white')
      .wedge([0.5, 0.35, 0.02], [2.65, 2.1, -1.6], { color: 'red', rot: [0, 0, -90], edge: 'sharp' })
      .stick([0.9, 0.24, 1.1], [2.2, 0.3, 1.6], 0.035, 'yellow')
      .box([0.6, 0.05, 0.08], [0.85, 0.24, 1.08], { color: 'darkgray', rot: [0, 21, 0], edge: 'sharp' });
    b.each(7, (i) => b.box([3.0, 0.01, 0.03], [-0.5, 0.29, -0.8 + i * 0.32], { color: '#d2bd84', round: 0, noInk: true }));
    return b.act({ click: [A.par(A.pose('ball', { move: [1.2, 1.4, -0.8], dur: 0.4 }), A.effect('dust', { dur: 1 }), A.say('Thwack!', 1)), A.pose('ball', { move: [2.4, 0.0, -1.6], dur: 0.5 }), A.wait(1), A.pose('ball', { move: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  e('bunny ears', 'wardrobe', 'costume', () => {
    const b = m('bunny ears');
    path(b, arc(0, 0.01, 0.09, 0.1, 10, 170, 6), 0.014, 'pink');
    b.pair((s) => {
      const n = s > 0 ? 'earL' : 'earR';
      b.ball([0.05, 0.17, 0.03], [s * 0.036, 0.18, 0], { color: 'white', rot: [0, 0, s * -10], name: n, pivot: [s * 0.03, 0.1, 0] });
      b.ball([0.026, 0.12, 0.01], [s * 0.036, 0.18, 0.014], { color: 'pink', rot: [0, 0, s * -10], noInk: true, parent: n });
    });
    return b.act({ click: [A.par(A.pose('earL', { rot: [0, 0, -60], dur: 0.3 }), A.pose('earR', { rot: [0, 0, 60], dur: 0.3 })), A.wait(0.6), A.par(A.pose('earL', { rot: [0, 0, 0], dur: 0.25 }), A.pose('earR', { rot: [0, 0, 0], dur: 0.25 }), A.anim('hop'))] }).done();
  }),
  // A navigation buoy riding in its patch of sea: a red float with a white band, a lattice tower, a radar
  // reflector and a lamp that flashes; it rocks and its bell clangs.
  e('buoy', 'sea', 'seaside things', () => {
    const b = m('buoy')
      .cyl([3.2, 0.05, 3.2], [0, 0.025, 0], { color: 'water', edge: 'soft' })
      .cyl([1.6, 0.8, 1.6], [0, 0.35, 0], { color: 'red', name: 'float' })
      .cyl([1.62, 0.2, 1.62], [0, 0.5, 0], { color: 'white', parent: 'float' })
      .cyl([1.7, 0.12, 1.7], [0, 0.8, 0], { color: '#8a2b2a', parent: 'float' })
      .label('4', [0.4, 0.4], [0, 0.4, 0.81], { color: 'white', depth: 0.03, parent: 'float' })
      .cyl([0.9, 0.08, 0.9], [0, 2.4, 0], { color: 'red', parent: 'float', edge: 'sharp' })
      .cyl([0.28, 0.35, 0.28], [0, 2.62, 0], { color: '#3a3633', parent: 'float', edge: 'sharp' })
      .ball(0.26, [0, 2.9, 0], { color: 'yellow', glow: true, name: 'lamp', parent: 'float', mover: { kind: 'light', on: true } })
      .box([0.35, 0.35, 0.02], [0, 2.0, 0], { color: 'silver', rot: [0, 45, 45], parent: 'float', edge: 'sharp' })
      .cone([0.3, 0.3, 0.3], [0.25, 1.15, 0], { color: 'bronze', rot: [180, 0, 0], parent: 'float' });
    around(4, 0.55, Math.PI / 4).forEach(([x, z]) => b.rod([x, 0.85, z], [x * 0.5, 2.38, z * 0.5], 0.07, 'red', { parent: 'float' }));
    b.each(2, (i) => b.torus([1.0 - i * 0.25, 1.0 - i * 0.25, 0.05], [0, 1.4 + i * 0.5, 0], { color: 'red', rot: [90, 0, 0], tube: 0.08, parent: 'float' }));
    return b.act({ click: [A.par(A.anim('wobble', 2), A.say('Clang... clang...', 2)), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on')] }).done();
  }),
  // A foil-wrapped burrito with its filling showing; it is spicy.
  e('burrito', 'food', 'mexican food', () => {
    const P = diag(-0.035, 0.0, 70);
    const b = m('burrito')
      .stick(P(0.03), P(0.19), 0.075, '#ead19a')
      .stick(P(0.0), P(0.1), 0.085, 'silver')
      .ball([0.06, 0.02, 0.06], P(0.19), { color: 'white', rot: [0, 0, -20] });
    b.each(4, (i) => b.box([0.09, 0.004, 0.02], P(0.03 + i * 0.02, 0, 0.04), { color: '#e0e2e6', rot: [0, 0, -20 + i * 7], noInk: true }));
    for (const [o, z, c] of [[-0.018, 0.01, 'darkbrown'], [0.015, -0.01, 'lettuce'], [0.0, 0.02, 'tomato'], [0.02, 0.015, 'cheese'], [-0.01, -0.015, '#f2f0e6']] as const) b.ball(0.022, P(0.195, o, z), { color: c });
    return b.act({ click: [A.par(A.effect('fire', { dur: 1 }), A.anim('shake'), A.say('Hot hot hot!', 1.5))] }).done();
  }),
  // A low-floor city bus at real size (12 m, 3.2 m tall): two pairs of doors that fold open on the kerb side, big
  // windows between pillars, a destination display, mirrors, headlights, bumpers, wheels on axles in their arches,
  // a roof air-conditioning pod and a driver's seat.
  e('bus', 'garage', 'buses', () => {
    const b = m('bus', { view: 'side', edge: 'sharp' })
      .box([2.55, 2.7, 12], [0, 1.75, 0], { color: '#f2b632', round: 0.06, name: 'body' })
      .box([2.4, 0.3, 3.2], [0, 3.22, -3.5], { color: '#e6e3dc', round: 0.4 })
      .box([2.57, 0.1, 12.02], [0, 1.25, 0], { color: '#2f4f8f', round: 0 })
      .box([2.3, 1.45, 0.05], [0, 2.15, 6.01], { color: '#2f3d52', round: 0.1 })
      .box([1.9, 0.3, 0.06], [0, 3.0, 6.01], { color: '#1e1e1e', round: 0.1 })
      .label('42 CITY CENTRE', [1.7, 0.22], [0, 3.0, 6.05], { color: '#ffb02e', depth: 0.01 })
      .box([2.0, 0.6, 0.05], [0, 2.3, -6.01], { color: '#2f3d52', round: 0.1 })
      .box([2.6, 0.35, 0.2], [0, 0.55, 6.05], { color: '#3a3633', round: 0.2 })
      .box([2.6, 0.35, 0.2], [0, 0.55, -6.05], { color: '#3a3633', round: 0.2 });
    b.pair((s) => {
      b.each(6, (i) => sidePane(b, s, 1.28, 2.32, -5.0 + i * 1.6, 1.15, 1.45));
      b.box([0.3, 0.25, 0.08], [s * 0.85, 0.95, 6.02], { color: '#fff6c8', glow: true, name: `light${s > 0 ? 1 : 2}`, mover: { kind: 'light' } });
      b.box([0.25, 0.35, 0.06], [s * 1.0, 1.0, -6.02], { color: 'red', glow: true });
      b.rod([s * 1.25, 2.7, 5.8], [s * 1.55, 2.6, 6.1], 0.05, '#2a2726');
      b.box([0.08, 0.4, 0.22], [s * 1.58, 2.3, 6.1], { color: '#2a2726' });
    });
    for (const [k, z] of [[1, 4.85], [2, 0.6]] as const) {
      b.box([0.05, 2.05, 0.58], [-1.29, 1.45, z + 0.29], { color: '#2f3d52', round: 0.1, name: `door${k}a`, pivot: [-1.29, 1.45, z + 0.58], mover: { kind: 'swing', axis: 'y', amount: 80 } });
      b.box([0.05, 2.05, 0.58], [-1.29, 1.45, z - 0.29], { color: '#2f3d52', round: 0.1, name: `door${k}b`, pivot: [-1.29, 1.45, z - 0.58], mover: { kind: 'swing', axis: 'y', amount: -80 } });
      b.box([0.06, 0.12, 1.3], [-1.28, 2.55, z], { color: '#3a3633' });
    }
    for (const z of [4.0, -3.4]) b.pair((s) => b.box([0.1, 0.5, 1.3], [s * 1.25, 1.0, z], { color: '#2a2726', round: 0.3 }));
    axle(b, 1.1, 0.5, 4.0, 1.0, 0.32, 'wheelF');
    axle(b, 1.1, 0.5, -3.4, 1.0, 0.32, 'wheelR');
    return b
      .socket('seat', [0.7, 1.0, 5.0], 'seat')
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Pssshh!', 1.5)), A.wait(2.5), A.par(A.operate('door', 'close'), A.say('Pssshh!', 1.2))],
          [A.operate('light', 'on'), A.par(A.anim('shake'), A.say('Honk honk!', 1.5)), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A bus station: a terminal building with a clock and a departures board, and a long canopy on columns over a
  // raised platform with benches and a bus stop sign. Click: the board flips; click again: a bus pulls in.
  e('bus station', 'places', 'transport', () => {
    const b = m('bus station', { edge: 'sharp' })
      .box([16, 0.25, 12], [0, 0.125, 0], { color: '#9a958c', round: 0.02 })
      .box([16, 4.6, 5], [0, 2.55, -3.5], { color: '#d8d4cc', round: 0.02 })
      .box([16.3, 0.4, 5.3], [0, 5.0, -3.5], { color: '#2f4f8f', round: 0.1 })
      .box([7, 2.6, 0.06], [0, 1.6, -0.98], { color: 'glass', round: 0.05 })
      .box([1.0, 2.3, 0.05], [-0.52, 1.4, -0.93], { color: '#c9e8f5', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -0.95 } })
      .box([1.0, 2.3, 0.05], [0.52, 1.4, -0.93], { color: '#c9e8f5', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 0.95 } })
      .box([9, 0.8, 0.14], [0, 4.1, -0.95], { color: '#2f4f8f', round: 0.1 })
      .label('BUS STATION', [7, 0.6], [0, 4.1, -0.86], { color: '#2f4f8f', depth: 0.02 })
      .cyl([1.0, 0.12, 1.0], [5.5, 3.6, -0.92], { color: 'white', rot: [90, 0, 0] })
      .box([0.05, 0.36, 0.02], [5.5, 3.7, -0.85], { color: 'black' })
      .box([0.3, 0.05, 0.02], [5.62, 3.6, -0.84], { color: 'black' })
      .box([3.2, 1.4, 0.18], [-5.0, 2.1, -0.9], { color: '#1e1e1e', round: 0.1 })
      .box([2.9, 1.1, 0.05], [-5.0, 2.1, -0.8], { color: '#ffb02e', glow: true, name: 'board', mover: { kind: 'light', on: true } })
      .box([15, 0.3, 4.6], [0, 4.1, 2.6], { color: '#e6e3dc', round: 0.1 })
      .box([15.2, 0.12, 0.2], [0, 3.95, 4.9], { color: '#2f4f8f' })
      .box([16, 0.18, 0.4], [0, 0.34, 5.8], { color: 'white' });
    b.each(4, (i) => b.box([0.25, 3.8, 0.25], [-6 + i * 4, 2.15, 4.4], { color: 'silver' }));
    b.each(3, (i) => b.box([1.6, 0.08, 0.45], [-4 + i * 4, 0.7, 1.5], { color: 'wood' }).box([1.6, 0.4, 0.06], [-4 + i * 4, 0.95, 1.27], { color: 'wood' }).box([0.06, 0.45, 0.4], [-4 + i * 4, 0.47, 1.5], { color: 'darkgray' }));
    b.stick([6.8, 0.25, 5.2], [6.8, 2.8, 5.2], 0.08, 'silver').cyl([0.7, 0.06, 0.7], [6.8, 2.85, 5.2], { color: 'red', rot: [90, 0, 0] }).label('BUS', [0.45, 0.25], [6.8, 2.85, 5.25], { color: 'red', depth: 0.01 });
    return b
      .act({
        click: [
          [A.operate('board', 'off'), A.wait(0.3), A.operate('board', 'on'), A.say('Ding dong! Now boarding: bay 2', 2.5)],
          [A.spawn('coach', 'bus', { rel: 'front', of: 'self', dist: 'near' }), A.say('Honk honk!', 1.5, 'coach'), A.operate('door', 'open', 'coach'), A.wait(2.5), A.operate('door', 'close', 'coach'), A.remove('coach', 'fade')],
        ],
      })
      .done();
  }),
  e('business card', 'study', 'office', () => {
    const b = m('business card', { edge: 'sharp' })
      .box([0.1, 0.022, 0.05], [0, 0.011, 0], { color: 'black', round: 0.3 })
      .box([0.09, 0.052, 0.004], [0, 0.046, 0.0], { color: 'white', rot: [-12, 0, 0], round: 0.1, name: 'card' })
      .ball([0.014, 0.014, 0.004], [-0.03, 0.058, 0.006], { color: 'blue', parent: 'card' });
    b.each(3, (i) => b.box([i ? 0.045 : 0.05, 0.004, 0.002], [0.012 - (i ? 0.004 : 0), 0.06 - i * 0.012, 0.006 + i * 0.0025], { color: i ? 'gray' : 'navy', rot: [-12, 0, 0], noInk: true, parent: 'card' }));
    b.each(4, (i) => b.box([0.09, 0.05, 0.002], [0, 0.044, -0.004 - i * 0.003], { color: '#f2f0ea', rot: [-12, 0, 0], round: 0.1, noInk: true }));
    return b.act({ click: [A.pose('card', { move: [0, 0.05, 0.08], rot: [-50, 0, 0], dur: 0.4 }), A.effect('sparkle', { dur: 1 }), A.wait(1), A.pose('card', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // An office park: a four-storey glass block and a two-storey wing round a lawn, an entrance canopy with sliding
  // doors, a car park with bays and two parked cars, trees and a stone sign. Click: doors; again: office lights.
  e('business park', 'places', 'offices', () => {
    const b = m('business park', { edge: 'sharp' })
      .box([30, 0.1, 24], [0, 0.05, 0], { color: '#7a7f85', round: 0.02 })
      .box([12, 0.12, 10], [-8, 0.1, -6], { color: 'grass', round: 0.1 })
      .box([10, 14, 9], [-9, 7.1, -6], { color: '#2f4f6f', round: 0.01 })
      .box([10.3, 0.4, 9.3], [-9, 14.2, -6], { color: '#d8d4cc' })
      .box([14, 7, 8], [6, 3.6, -7], { color: '#d8d4cc', round: 0.01 })
      .box([14.3, 0.35, 8.3], [6, 7.2, -7], { color: '#2f4f6f' })
      .box([5, 0.3, 2.5], [-9, 3.3, -0.6], { color: '#d8d4cc' })
      .box([1.1, 2.4, 0.06], [-9.55, 1.3, -1.45], { color: 'glass', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -1.05 } })
      .box([1.1, 2.4, 0.06], [-8.45, 1.3, -1.45], { color: 'glass', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 1.05 } })
      .box([4, 1.2, 0.6], [6, 0.7, 4.8], { color: 'stone', round: 0.1 })
      .label('BUSINESS PARK', [3.6, 0.6], [6, 0.75, 5.11], { color: '#2f4f6f', depth: 0.02 });
    b.each(4, (i) => {
      b.box([10.04, 0.5, 9.04], [-9, 1.0 + i * 3.4, -6], { color: '#d8d4cc', round: 0, noInk: true });
      b.box([9.6, 2.4, 0.06], [-9, 2.5 + i * 3.4, -1.48], { color: '#9fd0ef', glow: true, name: `lights${i}`, mover: { kind: 'light' } });
    });
    b.each(2, (i) => b.each(6, (j) => b.box([1.8, 1.8, 0.06], [-0.2 + j * 2.25, 2.0 + i * 3.2, -2.98], { color: '#2f3d52', round: 0.05 })));
    b.each(6, (i) => b.box([0.12, 0.02, 4.8], [2 + i * 2.6, 0.11, 6.5], { color: 'white', round: 0, noInk: true }));
    for (const [x, c] of [[3.3, '#e0473b'], [8.5, '#4e8fd6']] as const) {
      b.box([1.8, 0.65, 4.4], [x, 0.6, 6.5], { color: c, round: 0.3 });
      b.box([1.6, 0.5, 2.2], [x, 1.15, 6.3], { color: '#2f3d52', round: 0.3 });
      for (const z of [5.0, 8.0]) b.pair((s) => b.cyl([0.62, 0.22, 0.62], [x + s * 0.85, 0.36, z], { color: 'rubber', rot: [0, 0, 90], edge: 'soft' }));
    }
    tree(b, -13, 4, 6, 'leaf');
    tree(b, -4, 7, 5, 'darkgreen');
    tree(b, 13, 1.5, 5.5, 'leaf');
    return b.act({ click: [[A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')], [A.operate('lights')]] }).done();
  }),
  // A marble bust of a Roman on a pedestal: curly hair, a laurel wreath, a draped chest. Its nose comes off.
  e('bust', 'home', 'art', () => {
    const mb = '#ebe7df';
    const b = m('bust')
      .box([0.4, 0.06, 0.4], [0, 0.03, 0], { color: '#5c6166', edge: 'sharp' })
      .cyl([0.3, 0.9, 0.3], [0, 0.5, 0], { color: '#6b7076', segs: 12, edge: 'sharp' })
      .box([0.4, 0.06, 0.4], [0, 0.98, 0], { color: '#5c6166', edge: 'sharp' })
      .cyl([0.2, 0.08, 0.2], [0, 1.05, 0], { color: mb })
      .ball([0.42, 0.22, 0.24], [0, 1.18, 0], { color: mb })
      .rod([-0.18, 1.25, 0.08], [0.12, 1.12, 0.12], 0.05, '#e0dbd0')
      .cyl([0.1, 0.12, 0.1], [0, 1.32, 0], { color: mb })
      .ball([0.19, 0.24, 0.21], [0, 1.47, 0.01], { color: mb, name: 'head' })
      .ball([0.21, 0.13, 0.21], [0, 1.56, -0.01], { color: '#dcd6ca', parent: 'head' })
      .torus([0.2, 0.2, 0.025], [0, 1.53, 0], { color: '#9fae7a', rot: [80, 0, 0], tube: 0.15, parent: 'head' })
      .ball([0.025, 0.045, 0.04], [0, 1.465, 0.115], { color: mb, name: 'nose', parent: 'head', piece: true });
    b.each(7, (i) => b.ball(0.05, [-0.09 + i * 0.03, 1.58 + (i % 2) * 0.01, 0.06], { color: '#dcd6ca', parent: 'head' }));
    b.pair((s) => b.ball([0.03, 0.05, 0.03], [s * 0.1, 1.46, 0], { color: mb, parent: 'head' }));
    return b.act({ click: [[A.detach('nose', 'nose'), A.say('Oops!', 1)], [A.reattach('nose')]] }).done();
  }),
  // A butcher's shop: striped awning, sausages and hams hanging in the window, a pig on a swinging bracket sign.
  e('butcher shop', 'places', 'shops', () => {
    const b = storefront('butcher shop', { w: 6, d: 6, h: 6, wall: '#f2efe6', trim: '#8a2b2a', sign: 'FAMILY BUTCHER', signColor: '#8a2b2a', awning: ['#c0362c', 'white'], door: '#8a2b2a' });
    b.pair((s) => {
      b.stick([s * 1.2 - 0.6, 2.4, 2.9], [s * 1.2 + 0.6, 2.4, 2.9], 0.03, 'silver');
      b.each(4, (i) => b.capsule([0.1, 0.4, 0.1], [s * 1.2 - 0.45 + i * 0.3, 2.15, 2.9], { color: i % 2 ? 'meat' : '#c47a52' }));
    });
    b.ball([0.4, 0.5, 0.3], [-1.6, 1.0, 2.9], { color: '#c47a52' });
    b.box([1.2, 0.08, 0.08], [-2.4, 3.6, 3.6], { color: 'iron' }).rod([-3.0, 3.6, 3.0], [-3.0, 3.6, 3.6], 0.06, 'iron');
    b.box([0.9, 0.6, 0.05], [-2.3, 3.2, 3.6], { color: 'white', name: 'board', pivot: [-2.3, 3.55, 3.6] })
      .ball([0.6, 0.38, 0.06], [-2.3, 3.2, 3.64], { color: 'pink', parent: 'board' })
      .ball([0.2, 0.18, 0.06], [-2.0, 3.25, 3.66], { color: 'pink', parent: 'board' });
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5)), A.wait(2), A.operate('door', 'close')], [A.pose('board', { rot: [30, 0, 0], dur: 0.4 }), A.pose('board', { rot: [-20, 0, 0], dur: 0.5 }), A.pose('board', { rot: [0, 0, 0], dur: 0.4 }), A.say('Creak...', 1)]] }).done();
  }),
  // A block of butter on a plate with a curl shaved off it; the curl comes away.
  e('butter', 'food', 'dairy', () =>
    plate(m('butter'), 0.18)
      .box([0.12, 0.045, 0.06], [0, 0.034, 0], { color: '#f7dc6f', round: 0.15, name: 'block' })
      .box([0.065, 0.05, 0.066], [0.035, 0.036, 0], { color: 'white', round: 0.1 })
      .label('BUTTER', [0.05, 0.02], [0.035, 0.036, 0.034], { color: 'white', depth: 0.003 })
      .torus([0.03, 0.02, 0.014], [-0.035, 0.068, 0], { color: '#f7dc6f', tube: 0.4, name: 'curl', parent: 'block', piece: true })
      .act({ click: [[A.detach('curl', 'curl')], [A.reattach('curl')]] })
      .done(),
  ),
  e('butter dish', 'kitchen', 'tableware', () =>
    m('butter dish')
      .box([0.22, 0.015, 0.13], [0, 0.0075, 0], { color: 'white', round: 0.3 })
      .box([0.13, 0.04, 0.05], [0, 0.035, 0.01], { color: '#f7dc6f', round: 0.15 })
      .box([0.18, 0.06, 0.09], [0, 0.045, 0.0], { color: 'white', round: 0.4, name: 'lid', pivot: [0, 0.02, -0.045], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .ball(0.025, [0, 0.085, 0.0], { color: 'skyblue', parent: 'lid' })
      .act({ click: [[A.operate('lid', 'open'), A.say('Clink!', 1)], [A.operate('lid', 'close')]] })
      .done(),
  ),
  // A buttercup: a glossy yellow cup of five petals on a thin stem; it opens up to the sun.
  e('buttercup', 'garden', 'flowers', () => {
    const b = m('buttercup')
      .rod([0, 0, 0], [0.01, 0.25, 0], 0.008, 'green')
      .ball([0.05, 0.02, 0.03], [-0.03, 0.08, 0], { color: 'leaf', rot: [0, 0, 30] })
      .cyl([0.05, 0.03, 0.05], [0.01, 0.265, 0.005], { color: 'yellow', taper: 1.6, name: 'head', pivot: [0.01, 0.25, 0], rot: [20, 0, 0] })
      .ball(0.024, [0.01, 0.285, 0.012], { color: 'gold', parent: 'head' });
    around(5, 0.032).forEach(([x, z]) => b.ball([0.04, 0.012, 0.04], [0.01 + x, 0.282 + z * 0.3, 0.008 + z], { color: 'yellow', parent: 'head', rot: [20, 0, 0] }));
    return b.act({ click: [A.par(A.pose('head', { scale: 1.4, rot: [-15, 0, 0], dur: 0.8 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1.2), A.pose('head', { scale: 1, rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A butterfly net: a 1.2 m cane handle, a wire hoop and a deep mesh bag. It swishes.
  e('butterfly net', 'sports', 'outdoor gear', () =>
    m('butterfly net')
      .stick([-0.45, 0.02, 0], [0.0, 0.9, 0], 0.025, 'wood', { name: 'net', pivot: [-0.45, 0.02, 0] })
      .torus([0.36, 0.36, 0.015], [0.12, 1.08, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.08, parent: 'net' })
      .cone([0.34, 0.5, 0.34], [0.12, 0.83, 0], { color: '#f2f2f2', rot: [180, 0, 0], parent: 'net' })
      .ball(0.06, [0.12, 0.6, 0], { color: '#f2f2f2', parent: 'net' })
      .act({ click: [A.pose('net', { rot: [0, 0, 35], dur: 0.25 }), A.say('Swish!', 1), A.pose('net', { rot: [0, 0, -15], dur: 0.35 }), A.pose('net', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  e('butterfly wings', 'bugs', 'bug parts', () => {
    const b = m('butterfly wings').capsule([0.02, 0.08, 0.02], [0, 0.055, 0.004], { color: 'black' });
    b.pair((s) => {
      const w = s > 0 ? 'wingL' : 'wingR';
      b.ball([0.075, 0.065, 0.016], [s * 0.04, 0.072, 0], { color: 'black', rot: [0, 0, s * -25], name: w, pivot: [s * 0.006, 0.055, 0] })
        .ball([0.065, 0.055, 0.016], [s * 0.04, 0.072, 0.003], { color: 'orange', rot: [0, 0, s * -25], parent: w })
        .ball([0.055, 0.048, 0.016], [s * 0.03, 0.03, 0], { color: 'black', rot: [0, 0, s * 25], parent: w })
        .ball([0.046, 0.04, 0.016], [s * 0.03, 0.03, 0.003], { color: 'orange', rot: [0, 0, s * 25], parent: w })
        .ball(0.01, [s * 0.065, 0.09, 0.009], { color: 'white', noInk: true, parent: w })
        .ball(0.008, [s * 0.045, 0.02, 0.009], { color: 'white', noInk: true, parent: w })
        .rod([s * 0.003, 0.09, 0.004], [s * 0.02, 0.12, 0.004], 0.003, 'black');
    });
    const flap = (a: number) => A.par(A.pose('wingL', { rot: [0, a, 0], dur: 0.2 }), A.pose('wingR', { rot: [0, -a, 0], dur: 0.2 }));
    return b.act({ click: [flap(-60), flap(0), flap(-60), flap(0)] }).done();
  }),
  // A carton of buttermilk; it tips and pours.
  e('buttermilk', 'food', 'dairy', () =>
    carton('buttermilk', 0.2, 0.07, 'white', 'BUTTERMILK', 'skyblue')
      .box([0.072, 0.03, 0.072], [0, 0.03, 0], { color: 'skyblue', round: 0.06 })
      .act({ click: [A.par(A.set({ tilt: 50, dur: 0.5 }), A.say('Glug glug...', 1.6)), A.wait(1.2), A.set({ tilt: 0, dur: 0.5 })] })
      .done(),
  ),
  // A glass of butterscotch pudding under whipped cream; it jiggles.
  e('butterscotch pudding', 'food', 'desserts', () =>
    drink(m('butterscotch pudding'), 0.09, 0.08, '#d9962e', 0.8)
      .ball([0.06, 0.03, 0.06], [0, 0.08, 0], { color: '#e4a83f' })
      .ball([0.04, 0.03, 0.04], [0, 0.1, 0], { color: 'white' })
      .cone([0.025, 0.025, 0.025], [0, 0.123, 0], { color: 'white' })
      .ball(0.014, [0.01, 0.138, 0], { color: 'red' })
      .act({ click: [A.par(A.anim('wobble', 2), A.say('Wibble wobble!', 1.5))] })
      .done(),
  ),
  // A big four-hole coat button standing on its edge, sewn with an X of thread; it spins like a coin.
  e('button (clothes)', 'wardrobe', 'sewing', () => {
    const b = m('button (clothes)')
      .cyl([0.05, 0.01, 0.05], [0, 0.026, 0], { color: 'red', rot: [90, 0, 0], name: 'button' })
      .torus([0.05, 0.05, 0.012], [0, 0.026, 0.001], { color: 'darkred', tube: 0.16, parent: 'button' })
      .stick([-0.008, 0.018, 0.006], [0.008, 0.034, 0.006], 0.003, 'white', { noInk: true, parent: 'button' })
      .stick([-0.008, 0.034, 0.006], [0.008, 0.018, 0.006], 0.003, 'white', { noInk: true, parent: 'button' });
    for (const [x, y] of [[-0.008, 0.018], [0.008, 0.018], [-0.008, 0.034], [0.008, 0.034]]) b.cyl([0.006, 0.004, 0.006], [x, y, 0.005], { color: 'darkred', rot: [90, 0, 0], parent: 'button' });
    return b.act({ click: [A.pose('button', { rot: [0, 1080, 0], dur: 1.5 }), A.pose('button', { rot: [0, 0, 0], dur: 0.01 }), A.say('Ting!', 0.8)] }).done();
  }),
  // A big red push button on a yellow collar and a steel box; it clicks down.
  e('button (mechanical)', 'tech', 'controls', () =>
    m('button (mechanical)', { edge: 'sharp' })
      .box([0.09, 0.04, 0.09], [0, 0.02, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.07, 0.015, 0.07], [0, 0.047, 0], { color: 'yellow' })
      .ball([0.055, 0.04, 0.055], [0, 0.06, 0], { color: 'red', edge: 'soft', name: 'cap' })
      .ball([0.015, 0.008, 0.008], [0.012, 0.075, 0.012], { color: 'white', noInk: true, parent: 'cap' })
      .act({ click: [A.pose('cap', { move: [0, -0.012, 0], dur: 0.1 }), A.par(A.say('Click!', 1), A.effect('sparkle', { dur: 0.6 })), A.pose('cap', { move: [0, 0, 0], dur: 0.15 })] })
      .done(),
  ),
  // A yellow taxi: a real saloon with a checker band and a TAXI roof light that goes off when it is hired.
  e('cab', 'garage', 'cars', () => {
    const b = sedan(m('cab', { view: 'side' }), '#f6c21c')
      .box([0.6, 0.2, 0.28], [0, 1.58, -0.3], { color: '#fff6c8', glow: true, edge: 'sharp', name: 'sign', mover: { kind: 'light', on: true } })
      .label('TAXI', [0.5, 0.14], [0, 1.58, -0.15], { color: '#fff6c8', depth: 0.01 });
    b.pair((s) => b.each(10, (i) => b.box([0.02, 0.06, 0.2], [s * 0.89, 0.95 + (i % 2) * 0.06, -1.6 + i * 0.36], { color: '#2a2726', round: 0, noInk: true, edge: 'sharp' })));
    return b
      .act({ click: [[A.operate('sign', 'off'), A.par(A.anim('shake'), A.say('Beep beep!', 1.5)), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')], [A.operate('sign', 'on'), A.operate('light', 'on'), A.wait(1), A.operate('light', 'off')]] })
      .done();
  }),
  // An aerial tramway: a cabin for twenty people hanging from a carriage that runs on two track ropes slung between
  // two lattice pylons. Click: it glides along the rope and back; again: its doors slide open.
  e('cable car', 'garage', 'cable cars', () => {
    const b = m('cable car', { view: 'side', edge: 'sharp' });
    b.pair((s) => {
      const z = s * 8;
      for (const [dx, dz] of [[0.8, 0.6], [-0.8, 0.6], [0.8, -0.6], [-0.8, -0.6]]) b.rod([dx, 0, z + dz], [dx * 0.4, 9.6, z + dz * 0.4], 0.12, '#8f99a3');
      b.each(4, (i) => b.box([1.5 - i * 0.22, 0.1, 0.1], [0, 2 + i * 2, z], { color: '#8f99a3' }));
      b.box([2.2, 0.35, 0.6], [0, 9.75, z], { color: '#5c6166' });
      b.box([1.4, 0.3, 1.4], [0, 0.15, z], { color: 'stone' });
    });
    b.pair((s) => b.stick([s * 0.3, 9.95, -8.3], [s * 0.3, 9.95, 8.3], 0.05, '#2a2726'));
    b.box([0.9, 0.45, 1.8], [0, 9.65, 0], { color: '#5c6166', name: 'carriage' })
      .rod([0, 9.45, 0], [0, 7.2, 0.6], 0.14, '#5c6166', { parent: 'carriage' })
      .rod([0, 7.2, 0.6], [0, 6.25, 0], 0.14, '#5c6166', { parent: 'carriage' })
      .box([2.3, 0.2, 3.4], [0, 6.15, 0], { color: '#3a3633', round: 0.4, parent: 'carriage' })
      .box([2.2, 2.4, 3.3], [0, 4.85, 0], { color: '#d0362c', round: 0.12, parent: 'carriage' })
      .box([2.24, 0.25, 3.34], [0, 3.6, 0], { color: '#5c6166', round: 0.2, parent: 'carriage' })
      .box([1.8, 1.0, 0.04], [0, 5.1, 1.66], { color: 'glass', parent: 'carriage' })
      .box([1.8, 1.0, 0.04], [0, 5.1, -1.66], { color: 'glass', parent: 'carriage' })
      .label('7', [0.4, 0.4], [0, 4.1, 1.67], { color: 'white', parent: 'carriage', depth: 0.01 });
    b.pair((s) => {
      b.box([0.04, 1.0, 3.0], [s * 1.11, 5.1, 0], { color: 'glass', parent: 'carriage' });
      b.cyl([0.3, 0.12, 0.3], [s * 0.3, 9.92, 0.6], { color: 'iron', rot: [0, 0, 90], parent: 'carriage' });
      b.cyl([0.3, 0.12, 0.3], [s * 0.3, 9.92, -0.6], { color: 'iron', rot: [0, 0, 90], parent: 'carriage' });
    });
    b.box([0.04, 2.0, 0.6], [-1.12, 4.7, 0.31], { color: '#e6e3dc', parent: 'carriage', name: 'doorA', mover: { kind: 'slide', axis: 'z', amount: 0.6 } })
      .box([0.04, 2.0, 0.6], [-1.12, 4.7, -0.31], { color: '#e6e3dc', parent: 'carriage', name: 'doorB', mover: { kind: 'slide', axis: 'z', amount: -0.6 } })
      .socket('cabin', [0, 3.75, 0], 'top', { part: 'carriage', size: 2 });
    return b
      .act({
        click: [
          [A.par(A.pose('carriage', { move: [0, 0.2, 4], dur: 2.5 }), A.say('Whirrr...', 2)), A.pose('carriage', { move: [0, 0, 0], dur: 2.5 })],
          [A.par(A.operate('door', 'open'), A.say('Ding!', 1)), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A red railway caboose on its track: a cupola with windows on the roof, platforms with railings at both ends,
  // ladders, a stove chimney, two trucks of wheels and red marker lamps. Click: it rattles; again: the door.
  e('caboose', 'garage', 'trains', () => {
    const b = m('caboose', { view: 'side', edge: 'sharp' })
      .box([2.9, 2.4, 7.6], [0, 2.4, 0], { color: '#b8322a', round: 0.04 })
      .box([3.1, 0.15, 7.8], [0, 3.66, 0], { color: '#6e1f1a', round: 0.3 })
      .box([2.4, 1.0, 2.3], [0, 4.2, 0.3], { color: '#b8322a', round: 0.05 })
      .box([2.6, 0.12, 2.5], [0, 4.76, 0.3], { color: '#6e1f1a', round: 0.3 })
      .box([2.0, 0.08, 9.4], [0, 1.15, 0], { color: '#3a3633' })
      .cyl([0.16, 0.9, 0.16], [0.6, 4.1, -2.4], { color: 'iron' })
      .label('C-17', [0.8, 0.35], [1.46, 2.6, -1.4], { color: 'white', rot: [0, 90, 0], depth: 0.01 })
      .box([0.9, 1.9, 0.05], [0, 2.15, 3.82], { color: '#6e1f1a', name: 'door', pivot: [-0.45, 2.15, 3.82], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.5, 0.5, 0.03], [0, 2.55, 3.85], { color: 'glass', parent: 'door' });
    track(b, -6, 6);
    b.pair((s) => {
      b.box([0.04, 0.8, 2.0], [s * 1.47, 4.25, 0.3], { color: 'glass' });
      b.each(2, (i) => sidePane(b, s, 1.46, 2.7, -2.4 + i * 4.4, 0.8, 0.7, 'glass'));
      b.box([2.9, 0.12, 0.9], [0, 1.25, s * 4.25], { color: '#3a3633' });
      b.box([0.06, 1.0, 0.06], [1.35, 1.8, s * 4.65], { color: 'yellow' });
      b.box([0.06, 1.0, 0.06], [-1.35, 1.8, s * 4.65], { color: 'yellow' });
      b.box([2.76, 0.06, 0.06], [0, 2.3, s * 4.65], { color: 'yellow' });
      b.each(4, (i) => b.box([0.5, 0.05, 0.05], [s * 1.2, 2.0 + i * 0.4, -3.9], { color: 'yellow' }));
      b.box([0.6, 0.6, 0.35], [s * 1.15, 0.85, 4.5], { color: '#3a3633' });
      b.ball(0.2, [s * 1.3, 3.3, -3.9], { color: 'red', glow: true, name: `lamp${s > 0 ? 1 : 2}`, mover: { kind: 'light', on: true } });
      b.box([0.3, 0.3, 0.6], [0, 1.05, s * 4.95], { color: 'iron' });
    });
    for (const [z, n] of [[2.6, 'a'], [-2.6, 'b']] as const) {
      b.box([2.2, 0.5, 2.4], [0, 0.85, z], { color: '#3a3633', round: 0.2 });
      axle(b, 0.72, 0.6, z + 0.75, 0.84, 0.14, `wheel${n}1`, 'iron', '#4a4744');
      axle(b, 0.72, 0.6, z - 0.75, 0.84, 0.14, `wheel${n}2`, 'iron', '#4a4744');
    }
    return b.act({ click: [[A.par(A.anim('shake', 3), A.say('Clickety-clack, clickety-clack!', 2)), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on')], [A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A young saguaro, 1.9 m: a ribbed column with two upturned arms, spines along the ribs, a flower on top.
  e('cactus', 'garden', 'cacti', () => {
    const b = m('cactus')
      .ball([0.9, 0.16, 0.8], [0, 0.0, 0], { color: 'sand' })
      .capsule([0.36, 1.85, 0.36], [0, 0.95, 0], { color: '#4f9a4a' });
    path(b, [[-0.12, 0.7, 0], [-0.42, 0.72, 0], [-0.45, 1.25, 0]], 0.24, '#4f9a4a');
    path(b, [[0.12, 1.0, 0], [0.38, 1.02, 0], [0.4, 1.45, 0]], 0.22, '#4f9a4a');
    around(8, 0.17).forEach(([x, z]) => b.box([0.014, 1.6, 0.014], [x, 0.95, z], { color: '#2f6a32', noInk: true, rot: [0, 0, 0] }));
    b.each(14, (i) => b.cone([0.012, 0.04, 0.012], [Math.sin(i * 1.3) * 0.19, 0.25 + i * 0.11, Math.cos(i * 1.3) * 0.19], { color: '#f2f0e6', rot: [Math.cos(i * 1.3) * 90, 0, -Math.sin(i * 1.3) * 90], noInk: true }));
    return b
      .ball([0.16, 0.08, 0.16], [0, 1.88, 0], { color: 'pink', name: 'flower' })
      .ball(0.05, [0, 1.92, 0], { color: 'yellow', parent: 'flower' })
      .act({ click: [A.par(A.pose('flower', { scale: 1.8, dur: 0.8 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1.2), A.pose('flower', { scale: 1, dur: 0.6 })] })
      .done();
  }),
  // A school cafeteria: a long single-storey hall with a teal awning, picnic tables with parasols out front and a
  // kitchen vent on the roof. Click: the lunch bell; again: the kitchen steams.
  e('cafeteria', 'places', 'food places', () => {
    const b = storefront('cafeteria', { w: 9, d: 7, h: 4.2, wall: '#f2e6cf', trim: '#2f7a7a', sign: 'CAFETERIA', signColor: '#2f7a7a', awning: ['#3fa7a0', 'white'] })
      .box([1.2, 0.8, 1.2], [2.5, 4.7, -1.5], { color: 'silver' })
      .cyl([0.6, 0.6, 0.6], [2.5, 5.4, -1.5], { color: 'silver', name: 'vent' });
    for (const x of [-2.8, 2.8]) {
      b.box([1.6, 0.06, 0.8], [x, 0.75, 6.0], { color: 'wood' });
      b.pair((s) => b.box([1.6, 0.05, 0.3], [x, 0.45, 6.0 + s * 0.6], { color: 'wood' }));
      b.pair((s) => b.box([0.06, 0.75, 1.6], [x + s * 0.65, 0.37, 6.0], { color: 'darkwood', rot: [0, 0, 0] }));
      b.stick([x, 0.78, 6.0], [x, 2.4, 6.0], 0.05, 'white');
      b.cone([2.2, 0.5, 2.2], [x, 2.55, 6.0], { color: x < 0 ? '#3fa7a0' : '#f0923b', segs: 8, edge: 'soft' });
    }
    return b.act({ click: [[A.say('Ring-a-ding! Lunch time!', 2), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')], [A.effect('steam', { id: 'self', dur: 2.5 }), A.say('Mmm, soup...', 2)]] }).done();
  }),
  // A domed brass birdcage hanging from a floor stand: a perch, a canary, and a little door that opens.
  e('cage (container)', 'pets', 'pet gear', () => {
    const b = m('cage (container)')
      .cyl([0.5, 0.04, 0.5], [0, 0.02, 0], { color: 'gold', edge: 'sharp' })
      .stick([0.0, 0.04, -0.4], [0.0, 1.75, -0.4], 0.035, 'gold')
      .stick([0.0, 1.75, -0.4], [0.0, 1.75, -0.02], 0.03, 'gold')
      .cyl([0.4, 0.03, 0.4], [-0.0, 0.02, -0.4], { color: 'gold' })
      .cyl([0.5, 0.05, 0.5], [0, 1.0, 0], { color: 'gold', edge: 'sharp' })
      .torus([0.48, 0.48, 0.02], [0, 1.45, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.06 })
      .torus([0.08, 0.08, 0.015], [0, 1.73, 0], { color: 'gold', tube: 0.2 })
      .stick([-0.22, 1.18, 0], [0.22, 1.18, 0], 0.015, 'wood')
      .ball([0.08, 0.07, 0.06], [0, 1.23, 0], { color: 'yellow', name: 'bird' })
      .ball(0.05, [0.04, 1.28, 0.01], { color: 'yellow', parent: 'bird' })
      .cone([0.018, 0.03, 0.018], [0.075, 1.28, 0.01], { color: 'orange', rot: [0, 0, -90], parent: 'bird' })
      .cyl([0.12, 0.04, 0.06], [0.0, 1.06, 0.18], { color: 'skyblue' })
      .box([0.14, 0.16, 0.01], [0, 1.12, 0.245], { color: 'gold', name: 'door', pivot: [-0.07, 1.12, 0.245], mover: { kind: 'swing', axis: 'y', amount: -110 }, edge: 'sharp' });
    around(14, 0.235).forEach(([x, z]) => b.stick([x, 1.02, z], [x, 1.45, z], 0.008, 'gold', { noInk: true }));
    for (let k = 0; k < 4; k++) {
      const th = (k / 4) * Math.PI;
      const pts = arc(0, 1.45, 0.235, 0.27, 0, 180, 6).map(([x, y]) => [x * Math.cos(th), y, x * Math.sin(th)] as V);
      path(b, pts, 0.008, 'gold');
    }
    return b.act({ click: [[A.operate('door', 'open'), A.par(A.anim('hop', 2, 'self'), A.pose('bird', { move: [0, 0.05, 0], dur: 0.2 }), A.say('Tweet tweet!', 1.5)), A.pose('bird', { move: [0, 0, 0], dur: 0.2 })], [A.operate('door', 'close')]] }).done();
  }),
  // A birthday cake: two pink layers with cream between, piped rosettes and three candles you can blow out.
  e('cake', 'food', 'desserts', () => {
    const b = plate(m('cake'), 0.3)
      .cyl([0.22, 0.05, 0.22], [0, 0.043, 0], { color: 'pink' })
      .cyl([0.222, 0.012, 0.222], [0, 0.074, 0], { color: 'cream' })
      .cyl([0.22, 0.04, 0.22], [0, 0.1, 0], { color: 'pink' })
      .cyl([0.225, 0.014, 0.225], [0, 0.126, 0], { color: 'white' });
    around(8, 0.1).forEach(([x, z]) => b.ball(0.02, [x, 0.135, z], { color: 'white' }));
    ([[-0.04, 0, 'skyblue'], [0.0, 0.03, 'yellow'], [0.04, -0.01, 'lime']] as const).forEach(([x, z, c], i) =>
      b.cyl([0.012, 0.06, 0.012], [x, 0.163, z], { color: c }).ball([0.014, 0.024, 0.014], [x, 0.205, z], { color: 'flame', glow: true, name: `flame${i}`, mover: { kind: 'light', on: true } }),
    );
    return b.act({ click: [[A.operate('flame', 'off'), A.par(A.effect('smoke', { dur: 1.2 }), A.say('Fffft!', 1))], [A.operate('flame', 'on'), A.effect('sparkle', { dur: 1.2 })]] }).done();
  }),
  e('cake mix', 'food', 'baking', () =>
    pack('cake mix', [0.19, 0.25, 0.06], 'red', 'CAKE MIX')
      .cyl([0.1, 0.05, 0.01], [0, 0.07, 0.031], { color: 'pink', rot: [90, 0, 0], segs: 4 })
      .ball([0.1, 0.03, 0.01], [0, 0.1, 0.033], { color: 'white', noInk: true })
      .ball(0.02, [0, 0.12, 0.034], { color: 'red', noInk: true })
      .act({ click: [A.set({ tilt: 35, dur: 0.4 }), A.par(A.effect('dust', { dur: 1.2 }), A.say('Poof!', 1)), A.set({ tilt: 0, dur: 0.4 })] })
      .done(),
  ),
  // A footed cake stand with a sponge cake under a glass dome that lifts off.
  e('cake stand', 'kitchen', 'tableware', () =>
    m('cake stand')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'white', taper: 0.7 })
      .cyl([0.04, 0.12, 0.04], [0, 0.08, 0], { color: 'white' })
      .ball(0.05, [0, 0.08, 0], { color: 'white' })
      .cyl([0.3, 0.015, 0.3], [0, 0.145, 0], { color: 'white' })
      .cyl([0.2, 0.07, 0.2], [0, 0.188, 0], { color: '#f2d29a' })
      .cyl([0.204, 0.012, 0.204], [0, 0.226, 0], { color: 'white' })
      .ball(0.025, [0, 0.24, 0], { color: 'red' })
      .cyl([0.27, 0.06, 0.27], [0, 0.185, 0], { color: 'glass', name: 'lid', mover: { kind: 'slide', axis: 'y', amount: 0.25 } })
      .dome([0.27, 0.14, 0.27], [0, 0.215, 0], { color: 'glass', parent: 'lid' })
      .ball(0.035, [0, 0.36, 0], { color: 'glass', parent: 'lid' })
      .act({ click: [[A.operate('lid', 'open'), A.effect('sparkle', { dur: 1 })], [A.operate('lid', 'close'), A.say('Clink!', 0.8)]] })
      .done(),
  ),
  e('calamari', 'food', 'seafood', () => {
    const b = plate(m('calamari'), 0.22).cyl([0.05, 0.03, 0.05], [0.07, 0.032, -0.04], { color: 'white' }).cyl([0.045, 0.01, 0.045], [0.07, 0.045, -0.04], { color: 'red' });
    ([[-0.05, 0.03, 0.02, [70, 0, 10]], [-0.01, 0.03, 0.04, [80, 30, 0]], [0.03, 0.03, 0.04, [60, -20, 0]], [-0.04, 0.05, -0.02, [30, 10, 20]], [0.0, 0.05, 0.0, [50, 60, 0]], [-0.02, 0.07, 0.02, [20, 0, 40]]] as const).forEach(([x, y, z, r], i) =>
      b.torus([0.05, 0.05, 0.018], [x, y, z], { color: 'honey', rot: r as V, tube: 0.32, ...(i === 5 ? { name: 'ring', parent: 'cyl0', piece: true } : {}) }),
    );
    return b.wedge([0.04, 0.03, 0.03], [0.07, 0.03, 0.05], { color: 'yellow', rot: [0, 30, 0] }).act({ click: [[A.detach('ring', 'ring')], [A.reattach('ring')]] }).done();
  }),
  e('calculator (electronics)', 'study', 'office supplies', () => {
    const b = m('calculator (electronics)', { edge: 'sharp' })
      .box([0.09, 0.15, 0.025], [0, 0.075, 0], { color: 'darkgray', round: 0.3 })
      .box([0.074, 0.03, 0.006], [0, 0.125, 0.012], { color: '#b8c9a0', glow: true, name: 'screen', mover: { kind: 'light', on: true } })
      .label('42', [0.05, 0.02], [0.008, 0.125, 0.016], { color: '#b8c9a0', depth: 0.002 })
      .box([0.07, 0.04, 0.03], [0, 0.02, -0.02], { color: 'darkgray', round: 0.3 });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) b.box([0.015, 0.012, 0.008], [-0.027 + c * 0.018, 0.09 - r * 0.017, 0.013], { color: c === 3 ? 'orange' : r === 0 ? 'red' : 'lightgray', round: 0.4, ...(r === 4 && c === 3 ? { name: 'equals' } : {}) });
    return b.act({ click: [A.pose('equals', { move: [0, 0, -0.004], dur: 0.08 }), A.par(A.say('Beep! 6 x 7 = 42', 1.8), A.operate('screen', 'off')), A.pose('equals', { move: [0, 0, 0], dur: 0.08 }), A.operate('screen', 'on')] }).done();
  }),
  // A desk calendar on a stand; its month page flips over the rings.
  e('calendar', 'study', 'office', () => {
    const b = m('calendar', { edge: 'sharp' })
      .box([0.26, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3 })
      .box([0.24, 0.29, 0.01], [0, 0.175, 0], { color: 'white' })
      .box([0.24, 0.29, 0.004], [0, 0.175, 0.008], { color: 'white', name: 'page', pivot: [0, 0.32, 0.008] })
      .box([0.24, 0.07, 0.006], [0, 0.29, 0.011], { color: 'red', parent: 'page' })
      .label('NOV', [0.12, 0.05], [0, 0.29, 0.015], { color: 'red', parent: 'page', depth: 0.002 })
      .torus([0.04, 0.04, 0.006], [0.042, 0.137, 0.012], { color: 'red', tube: 0.12, noInk: true, parent: 'page' });
    b.each(5, (i) => b.torus([0.02, 0.02, 0.004], [-0.08 + i * 0.04, 0.33, 0.006], { color: 'silver', tube: 0.2 }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) b.box([0.034, 0.03, 0.002], [-0.084 + c * 0.042, 0.22 - r * 0.042, 0.011], { color: 'lightgray', noInk: true, parent: 'page' });
    return b.act({ click: [A.pose('page', { rot: [-200, 0, 0], dur: 0.6 }), A.say('Flip!', 0.8), A.wait(0.6), A.pose('page', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  e('calzone', 'food', 'italian food', () => {
    const b = plate(m('calzone'), 0.3).ball([0.24, 0.075, 0.14], [0, 0.05, 0], { color: 'bread' });
    b.each(7, (i) => {
      const x = -0.1 + i * (0.2 / 6);
      b.ball(0.02, [x, 0.03, 0.062 * Math.sqrt(Math.max(0, 1 - (x / 0.12) ** 2))], { color: 'crust' });
    });
    b.ball([0.025, 0.006, 0.02], [0.03, 0.087, 0.0], { color: 'tomato', noInk: true }).ball([0.03, 0.006, 0.015], [-0.03, 0.086, 0.01], { color: 'leaf', noInk: true });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.anim('bounce'), A.say('Piping hot!', 1.5))] }).done();
  }),
  // A handheld camcorder with a flip-out screen and a red recording light.
  e('camcorder', 'tech', 'cameras', () =>
    m('camcorder', { edge: 'sharp' })
      .box([0.07, 0.075, 0.14], [0, 0.0375, 0], { color: 'darkgray', round: 0.3 })
      .cyl([0.055, 0.04, 0.055], [0, 0.045, 0.085], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.04, 0.005, 0.04], [0, 0.045, 0.106], { color: 'navy', rot: [90, 0, 0] })
      .box([0.008, 0.05, 0.07], [-0.04, 0.045, 0.0], { color: 'black', round: 0.2, name: 'screen', pivot: [-0.04, 0.045, 0.035], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([0.003, 0.04, 0.06], [-0.045, 0.045, 0.0], { color: 'skyblue', glow: true, parent: 'screen' })
      .cyl([0.025, 0.04, 0.025], [0, 0.088, -0.05], { color: 'black', rot: [90, 0, 0] })
      .box([0.015, 0.05, 0.1], [0.04, 0.04, 0.0], { color: 'black', round: 0.5, edge: 'soft' })
      .ball(0.008, [0.02, 0.07, 0.06], { color: 'red', glow: true, name: 'rec', mover: { kind: 'light' } })
      .act({ click: [[A.operate('screen', 'open'), A.operate('rec', 'on'), A.say('Recording...', 1.5)], [A.operate('rec', 'off'), A.operate('screen', 'close')]] })
      .done(),
  ),
  // A compact camera: the lens zooms out, the flash fires, the lens goes back.
  e('camera', 'tech', 'cameras', () =>
    m('camera', { edge: 'sharp' })
      .box([0.13, 0.075, 0.05], [0, 0.0375, 0], { color: 'black', round: 0.25 })
      .box([0.13, 0.016, 0.05], [0, 0.07, 0], { color: 'silver', round: 0.3 })
      .box([0.05, 0.03, 0.04], [0, 0.088, 0], { color: 'black', round: 0.2 })
      .cyl([0.06, 0.04, 0.06], [0, 0.038, 0.045], { color: 'darkgray', rot: [90, 0, 0], name: 'lens', mover: { kind: 'slide', axis: 'z', amount: 0.025 } })
      .cyl([0.045, 0.004, 0.045], [0, 0.038, 0.066], { color: 'navy', rot: [90, 0, 0], parent: 'lens' })
      .ball([0.012, 0.012, 0.004], [0.008, 0.045, 0.068], { color: 'white', noInk: true, parent: 'lens' })
      .cyl([0.015, 0.01, 0.015], [0.045, 0.082, 0], { color: 'red' })
      .box([0.025, 0.015, 0.012], [-0.045, 0.06, 0.026], { color: 'white', glow: true, name: 'flash', mover: { kind: 'light' } })
      .act({ click: [A.operate('lens', 'out'), A.operate('flash', 'on'), A.par(A.effect('sparkle', { dur: 0.4 }), A.say('Click!', 1)), A.operate('flash', 'off'), A.wait(0.5), A.operate('lens', 'in')] })
      .done(),
  ),
  // A campsite: a pitch of grass with two A-frame tents (one with its door flap open), a campfire in a stone ring,
  // a picnic table, pines around and a wooden sign. Click: the fire flares; again: a tent flap.
  e('camp ground', 'places', 'outdoor places', () => {
    const b = m('camp ground')
      .cyl([16, 0.12, 12], [0, 0.06, 0], { color: 'grass' })
      .box([0.6, 0.02, 7], [1.2, 0.13, 3.5], { color: 'dirt', round: 0.5, noInk: true });
    const tent = (x: number, z: number, c: string, door: string, ry: number, name?: string) => {
      b.wedge([2.6, 1.9, 3.0], [x, 1.09, z], { color: c, rot: [0, ry, 0] });
      b.box([2.8, 0.04, 3.2], [x, 0.14, z], { color: '#4a5a3a', rot: [0, ry, 0], edge: 'sharp' });
      const fz = Math.cos(ry * RAD) * 1.51, fx = Math.sin(ry * RAD) * 1.51;
      b.wedge([1.2, 1.45, 0.03], [x + fx, 0.86, z + fz], { color: door, rot: [0, ry, 0], ...(name ? { name, pivot: [x + fx - Math.cos(ry * RAD) * 0.6, 0.86, z + fz + Math.sin(ry * RAD) * 0.6] as V, mover: { kind: 'swing' as const, axis: 'y' as const, amount: -120 } } : {}) });
      b.stick([x + fx * 1.04, 0.12, z + fz * 1.04], [x + fx * 1.04, 2.15, z + fz * 1.04], 0.03, 'silver');
      b.pair((s) => b.stick([x + fx * 1.04, 2.1, z + fz * 1.04], [x + fx * 1.5 + s * Math.cos(ry * RAD) * 0.8, 0.12, z + fz * 1.5 - s * Math.sin(ry * RAD) * 0.8], 0.01, 'white', { noInk: true }));
    };
    tent(-3.5, 0.5, '#f0923b', '#8a4a1a', 15, 'flap');
    tent(3.6, -1.6, '#4e8fd6', '#2f4f8f', -20);
    fire(b, 0.2, 2.4, 0.9);
    b.box([1.8, 0.06, 0.8], [4.5, 0.8, 3.0], { color: 'wood', edge: 'sharp' });
    b.pair((s) => b.box([1.8, 0.05, 0.28], [4.5, 0.47, 3.0 + s * 0.6], { color: 'wood', edge: 'sharp' }));
    b.pair((s) => b.rod([4.5 + s * 0.7, 0.12, 2.4], [4.5 + s * 0.7, 0.8, 3.6], 0.07, 'darkwood').rod([4.5 + s * 0.7, 0.12, 3.6], [4.5 + s * 0.7, 0.8, 2.4], 0.07, 'darkwood'));
    b.stick([7.0, 0.1, 5.0], [7.0, 1.6, 5.0], 0.1, 'darkwood').label('PINE HOLLOW CAMP', [1.6, 0.5], [7.0, 1.55, 5.06], { color: 'wood', depth: 0.06 });
    pine(b, -6.5, -3.5, 7);
    pine(b, 6.8, -4.0, 6);
    pine(b, -1.0, -5.2, 5.5, 'green');
    pine(b, -7.5, 3.5, 4.5);
    return b.act({ click: [[A.par(A.effect('fire', { dur: 2 }), A.say('Crackle, pop!', 2))], [A.operate('flap', 'open'), A.wait(2), A.operate('flap', 'close'), A.say('Zzzip!', 1)]] }).done();
  }),
  // A campfire: a ring of stones, a tipi of logs and flames; it flares up, then dies down and smoulders.
  e('campfire', 'nature', 'fire', () => {
    const b = m('campfire');
    around(9, 0.48).forEach(([dx, dz]) => b.ball([0.24, 0.16, 0.24], [dx, 0.07, dz], { color: 'stone' }));
    around(5, 0.34, 0.4).forEach(([dx, dz]) => b.rod([dx, 0.06, dz], [dx * 0.12, 0.6, dz * 0.12], 0.1, 'bark'));
    b.rod([-0.3, 0.06, 0.2], [0.3, 0.08, 0.25], 0.11, 'bark');
    b.cone([0.46, 0.85, 0.46], [0, 0.48, 0], { color: 'fire', glow: true, name: 'flames' })
      .cone([0.28, 0.6, 0.28], [0, 0.36, 0.08], { color: 'flame', glow: true, parent: 'flames' })
      .cone([0.18, 0.45, 0.18], [0.16, 0.3, 0.05], { color: 'fire', glow: true, parent: 'flames' })
      .ball([0.5, 0.06, 0.5], [0, 0.06, 0], { color: '#ff6a2a', glow: true, noInk: true });
    return b.act({ click: [[A.par(A.pose('flames', { scale: 1.5, dur: 0.5 }), A.effect('fire', { dur: 1.5 }), A.say('Crackle, pop!', 1.5)), A.pose('flames', { scale: 1, dur: 0.6 })], [A.pose('flames', { scale: 0.3, dur: 0.8 }), A.effect('smoke', { dur: 2 }), A.wait(1.5), A.pose('flames', { scale: 1, dur: 0.8 })]] }).done();
  }),
  // A tin can of soup with a ring-pull lid that peels back.
  e('can', 'food', 'cans', () =>
    m('can', { edge: 'sharp' })
      .cyl([0.075, 0.11, 0.075], [0, 0.055, 0], { color: 'silver' })
      .cyl([0.077, 0.075, 0.077], [0, 0.055, 0], { color: 'red' })
      .label('SOUP', [0.05, 0.03], [0, 0.06, 0.039], { color: 'white', depth: 0.003 })
      .cyl([0.066, 0.004, 0.066], [0, 0.108, 0], { color: '#e05a30' })
      .cyl([0.07, 0.004, 0.07], [0, 0.112, 0], { color: 'silver', name: 'lid', pivot: [0, 0.112, -0.035], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .torus([0.025, 0.02, 0.004], [0, 0.115, 0.02], { color: 'silver', rot: [90, 0, 0], tube: 0.25, parent: 'lid' })
      .act({ click: [[A.operate('lid', 'open'), A.par(A.effect('steam', { dur: 1 }), A.say('Pop!', 1))], [A.operate('lid', 'close')]] })
      .done(),
  ),
  // An open can of worms: pink worms wriggling out over the rim, the lid bent back.
  e('can of worms', 'bugs', 'worms', () => {
    const b = m('can of worms')
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.082, 0.06, 0.082], [0, 0.05, 0], { color: 'green', edge: 'sharp' })
      .label('BAIT', [0.04, 0.025], [0, 0.05, 0.042], { color: 'white', depth: 0.003 })
      .cyl([0.074, 0.004, 0.074], [0, 0.099, 0], { color: 'dirt' })
      .cyl([0.078, 0.004, 0.078], [0, 0.137, -0.027], { color: 'silver', rot: [-70, 0, 0], edge: 'sharp' });
    const worms: V[][] = [
      [[-0.02, 0.1, 0.01], [-0.03, 0.14, 0.02], [-0.055, 0.16, 0.03], [-0.07, 0.14, 0.035]],
      [[0.015, 0.1, 0.0], [0.02, 0.15, 0.01], [0.04, 0.17, 0.0], [0.055, 0.155, 0.01]],
      [[0.0, 0.1, 0.02], [0.0, 0.13, 0.045], [0.01, 0.12, 0.065], [0.02, 0.08, 0.06]],
    ];
    worms.forEach((w, k) => {
      b.rod(w[0], w[1], 0.012, '#e8919c', { name: `worm${k}`, pivot: w[0] });
      for (let i = 1; i < w.length - 1; i++) b.rod(w[i], w[i + 1], 0.012, '#e8919c', { parent: `worm${k}` });
    });
    const wig = (a: number) => A.par(A.pose('worm0', { rot: [0, 0, a], dur: 0.25 }), A.pose('worm1', { rot: [0, 0, -a], dur: 0.25 }), A.pose('worm2', { rot: [a, 0, 0], dur: 0.25 }));
    return b.act({ click: [A.say('Wriggle wriggle!', 1.5), wig(20), wig(-20), wig(20), wig(0)] }).done();
  }),
  // A hand-held can opener: two red handles, a cutting wheel and a butterfly key that cranks round.
  e('can opener', 'kitchen', 'utensils', () =>
    m('can opener', { edge: 'sharp' })
      .rod([-0.012, 0.15, 0], [-0.035, 0.012, 0], 0.024, 'red', { edge: 'soft' })
      .rod([0.012, 0.15, 0], [0.035, 0.012, 0], 0.024, 'red', { edge: 'soft' })
      .box([0.06, 0.05, 0.03], [0, 0.17, 0], { color: 'silver', round: 0.3 })
      .cyl([0.035, 0.008, 0.035], [0, 0.17, 0.02], { color: 'steel', rot: [90, 0, 0] })
      .stick([0.03, 0.18, 0], [0.055, 0.18, 0], 0.01, 'silver', { name: 'crank', pivot: [0.03, 0.18, 0] })
      .box([0.016, 0.05, 0.014], [0.062, 0.18, 0], { color: 'red', round: 0.4, parent: 'crank' })
      .act({ click: [A.par(A.pose('crank', { rot: [1080, 0, 0], dur: 2 }), A.say('Crank, crank, crank...', 2)), A.pose('crank', { rot: [0, 0, 0], dur: 0.01 }), A.say('Pop!', 0.8)] })
      .done(),
  ),
  e('canadian bacon', 'food', 'meat', () => {
    const b = plate(m('canadian bacon'), 0.2);
    b.each(3, (i) =>
      b.cyl([0.1, 0.016, 0.1], [-0.03 + i * 0.03, 0.022 + i * 0.016, 0.02 - i * 0.02], { color: '#c96a5a', rot: [-6, 0, 0] })
        .cyl([0.088, 0.018, 0.088], [-0.03 + i * 0.03, 0.024 + i * 0.016, 0.02 - i * 0.02], { color: '#ee9a88', rot: [-6, 0, 0] }),
    );
    return b.act({ click: [A.par(A.effect('steam', { dur: 1.5 }), A.anim('shake'), A.say('Sizzle!', 1.5))] }).done();
  }),
  // A pillar candle with wax drips; blow it out and it smokes, click again to light it.
  e('candle', 'home', 'lighting', () =>
    m('candle')
      .cyl([0.065, 0.15, 0.065], [0, 0.075, 0], { color: 'cream' })
      .ball([0.016, 0.035, 0.016], [0.028, 0.135, 0.015], { color: 'cream' })
      .ball([0.013, 0.025, 0.013], [-0.022, 0.14, 0.022], { color: 'cream' })
      .stick([0, 0.15, 0], [0, 0.17, 0], 0.004, 'black')
      .ball([0.026, 0.052, 0.026], [0, 0.19, 0], { color: 'flame', glow: true, name: 'flame', mover: { kind: 'light', on: true } })
      .ball([0.013, 0.026, 0.013], [0, 0.18, 0.005], { color: 'orange', glow: true, parent: 'flame' })
      .act({ click: [[A.operate('flame', 'off'), A.effect('smoke', { dur: 1.5 })], [A.operate('flame', 'on'), A.effect('sparkle', { dur: 0.6 })]] })
      .done(),
  ),
  // A brass chamberstick with a finger ring: carry it and the flame flickers.
  e('candleholder', 'home', 'lighting', () =>
    m('candleholder')
      .cyl([0.13, 0.015, 0.13], [0, 0.0075, 0], { color: 'brass', edge: 'sharp' })
      .torus([0.13, 0.13, 0.015], [0, 0.017, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.045, 0.03, 0.045], [0, 0.03, 0], { color: 'brass' })
      .torus([0.05, 0.05, 0.012], [0.082, 0.035, 0], { color: 'brass', tube: 0.22 })
      .cyl([0.035, 0.07, 0.035], [0, 0.08, 0], { color: 'white' })
      .stick([0, 0.115, 0], [0, 0.13, 0], 0.003, 'black')
      .ball([0.022, 0.044, 0.022], [0, 0.145, 0], { color: 'flame', glow: true, name: 'flame', pivot: [0, 0.125, 0], mover: { kind: 'light', on: true } })
      .act({ click: [[A.par(A.anim('wobble'), A.pose('flame', { rot: [0, 0, 25], scale: 0.6, dur: 0.3 })), A.pose('flame', { rot: [0, 0, -15], scale: 1.1, dur: 0.3 }), A.pose('flame', { rot: [0, 0, 0], scale: 1, dur: 0.3 })], [A.operate('flame', 'off'), A.effect('smoke', { dur: 1.2 }), A.wait(1.2), A.operate('flame', 'on')]] })
      .done(),
  ),
  // A turned brass candlestick holding a red taper.
  e('candlestick', 'home', 'lighting', () =>
    m('candlestick')
      .cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'brass', taper: 0.7 })
      .cyl([0.026, 0.13, 0.026], [0, 0.085, 0], { color: 'brass' })
      .ball([0.045, 0.025, 0.045], [0, 0.05, 0], { color: 'brass' })
      .ball([0.04, 0.02, 0.04], [0, 0.12, 0], { color: 'brass' })
      .cyl([0.065, 0.012, 0.065], [0, 0.155, 0], { color: 'brass' })
      .cyl([0.035, 0.02, 0.035], [0, 0.17, 0], { color: 'brass' })
      .cyl([0.024, 0.12, 0.024], [0, 0.24, 0], { color: 'red' })
      .ball([0.012, 0.02, 0.012], [0.01, 0.29, 0.006], { color: 'red' })
      .stick([0, 0.3, 0], [0, 0.315, 0], 0.003, 'black')
      .ball([0.02, 0.04, 0.02], [0, 0.33, 0], { color: 'flame', glow: true, name: 'flame', mover: { kind: 'light', on: true } })
      .act({ click: [[A.operate('flame', 'off'), A.effect('smoke', { dur: 1.5 })], [A.operate('flame', 'on'), A.effect('sparkle', { dur: 0.6 })]] })
      .done(),
  ),
  // A wrapped boiled sweet: its twisted ends spin as it is unwrapped.
  e('candy', 'food', 'sweets', () => {
    const b = m('candy')
      .ball([0.06, 0.048, 0.048], [0, 0.026, 0], { color: 'red' })
      .torus([0.05, 0.044, 0.012], [0, 0.026, 0.0], { color: 'white', rot: [0, 90, 30], tube: 0.18, noInk: true });
    b.pair((s) => b.cone([0.04, 0.035, 0.034], [s * 0.045, 0.026, 0], { color: 'red', rot: [0, 0, s * 90], name: s > 0 ? 'twistL' : 'twistR' }));
    return b.act({ click: [A.par(A.pose('twistL', { rot: [360, 0, 0], dur: 0.6 }), A.pose('twistR', { rot: [-360, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 0.8 })), A.par(A.pose('twistL', { rot: [0, 0, 0], dur: 0.01 }), A.pose('twistR', { rot: [0, 0, 0], dur: 0.01 }))] }).done();
  }),
  e('candy apple', 'food', 'sweets', () =>
    m('candy apple')
      .cyl([0.11, 0.004, 0.11], [0, 0.002, 0], { color: 'white' })
      .ball([0.1, 0.016, 0.1], [0, 0.01, 0], { color: 'red' })
      .ball([0.085, 0.078, 0.085], [0, 0.046, 0], { color: 'red' })
      .stick([0, 0.07, 0], [0.006, 0.17, 0], 0.008, 'lightwood')
      .ball([0.02, 0.026, 0.01], [0.02, 0.064, 0.038], { color: 'white', noInk: true })
      .act({ click: [A.par(A.anim('shake'), A.say('Crunch!', 1), A.effect('sparkle', { dur: 0.6 }))] })
      .done(),
  ),
  // A chocolate bar half out of its wrapper; a square snaps off.
  e('candy bar', 'food', 'sweets', () => {
    const b = m('candy bar', { edge: 'sharp' })
      .box([0.07, 0.1, 0.022], [0, 0.05, 0], { color: 'red', round: 0.2 })
      .label('CHOCO', [0.058, 0.028], [0, 0.055, 0.012], { color: 'yellow', depth: 0.003 })
      .box([0.072, 0.008, 0.024], [0, 0.1, 0], { color: 'silver', round: 0.2 })
      .box([0.064, 0.055, 0.016], [0, 0.128, 0], { color: 'chocolate', round: 0.1, name: 'bar' });
    for (const x of [-0.016, 0.016]) for (const y of [0.115, 0.142]) b.box([0.027, 0.024, 0.004], [x, y, 0.009], { color: '#7a4a2e', round: 0.3, ...(x > 0 && y > 0.13 ? { name: 'square', parent: 'bar', piece: true } : { parent: 'bar' }) });
    return b.act({ click: [[A.detach('square', 'square'), A.say('Snap!', 1)], [A.reattach('square')]] }).done();
  }),
  e('candy cane', 'food', 'sweets', () => {
    const b = m('candy cane');
    const pts: V[] = [[0.04, 0.0, 0], [0.04, 0.045, 0], [0.04, 0.09, 0], [0.04, 0.135, 0], [0.04, 0.18, 0], ...arc(0, 0.2, 0.04, 0.045, 0, 180, 5).slice(0), [-0.04, 0.16, 0]];
    pts.forEach((p, i) => i < pts.length - 1 && b.rod(p, pts[i + 1], 0.026, i % 2 ? 'white' : 'red', i ? { parent: 'cane' } : { name: 'cane', pivot: [0.04, 0, 0] }));
    return b.act({ click: [A.par(A.pose('cane', { rot: [0, 360, 0], dur: 0.8 }), A.effect('sparkle', { dur: 1 })), A.pose('cane', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  e('candy corn', 'food', 'sweets', () =>
    m('candy corn')
      .cyl([0.05, 0.022, 0.03], [0, 0.011, 0], { color: 'yellow', taper: 0.75 })
      .cyl([0.0375, 0.022, 0.0225], [0, 0.033, 0], { color: 'orange', taper: 0.6 })
      .cone([0.0225, 0.024, 0.0135], [0, 0.056, 0], { color: 'white' })
      .act({ click: [A.par(A.anim('hop', 2), A.say('Crunch!', 1))] })
      .done(),
  ),
  // A sweet shop: a pink front with a striped awning, jars of sweets in the window and a giant spinning
  // lollipop on the roof.
  e('candy store', 'places', 'shops', () => {
    const b = storefront('candy store', { w: 6, d: 6, h: 4.2, wall: '#f7c6d9', trim: 'white', sign: 'SWEET SHOP', signColor: '#d64fa0', awning: ['#f4a1c0', 'white'], door: '#d64fa0' });
    b.pair((s) => b.each(3, (i) => b.cyl([0.24, 0.32, 0.24], [s * 1.6 - 0.45 + i * 0.45, 1.0, 2.9], { color: 'glass', edge: 'soft' }).ball(0.2, [s * 1.6 - 0.45 + i * 0.45, 0.98, 2.9], { color: ['red', 'yellow', 'lime'][i], noInk: true })));
    b.stick([0, 4.4, 0.5], [0, 5.4, 0.5], 0.1, 'white')
      .cyl([1.5, 0.22, 1.5], [0, 6.1, 0.5], { color: '#e0473b', rot: [90, 0, 0], name: 'lolly', edge: 'soft' })
      .torus([1.0, 1.0, 0.24], [0, 6.1, 0.52], { color: 'white', tube: 0.16, parent: 'lolly' })
      .torus([0.5, 0.5, 0.24], [0, 6.1, 0.52], { color: 'white', tube: 0.3, parent: 'lolly' });
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5)), A.wait(2), A.operate('door', 'close')], [A.pose('lolly', { rot: [0, 0, 720], dur: 1.6 }), A.pose('lolly', { rot: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // A walking stick with a crook handle and a rubber tip; tap tap.
  e('cane', 'wardrobe', 'accessories', () => {
    const b = m('cane').stick([0, 0.05, 0], [0, 0.82, 0], 0.028, 'darkwood', { name: 'cane', pivot: [0, 0, 0] }).cyl([0.034, 0.05, 0.034], [0, 0.025, 0], { color: 'rubber', parent: 'cane' });
    path(b, [...arc(-0.05, 0.82, 0.05, 0.055, 0, 180, 6), [-0.1, 0.78, 0]], 0.028, 'darkwood', { parent: 'cane' });
    b.cyl([0.032, 0.02, 0.032], [0, 0.8, 0], { color: 'brass', parent: 'cane' });
    return b.act({ click: [A.pose('cane', { rot: [0, 0, 8], dur: 0.2 }), A.say('Tap!', 0.6), A.pose('cane', { rot: [0, 0, 0], dur: 0.2 }), A.pose('cane', { rot: [0, 0, 8], dur: 0.2 }), A.say('Tap!', 0.6), A.pose('cane', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A field cannon at real size: a 2 m iron barrel with reinforcing rings on a wooden carriage, two 1.3 m spoked
  // wheels on an axle, the trail resting on the ground. It fires: smoke, a boom and a recoil.
  e('cannon', 'armory', 'artillery', () => {
    const b = m('cannon', { view: 'side' })
      .box([0.12, 0.5, 1.7], [0.28, 0.75, -0.2], { color: 'wood', round: 0.2, edge: 'sharp' })
      .box([0.12, 0.5, 1.7], [-0.28, 0.75, -0.2], { color: 'wood', round: 0.2, edge: 'sharp' })
      .rod([0, 0.6, -0.9], [0, 0.12, -2.1], 0.3, 'wood')
      .box([0.4, 0.15, 0.3], [0, 0.1, -2.15], { color: 'iron', edge: 'sharp' })
      .stick([-0.75, 0.65, 0.1], [0.75, 0.65, 0.1], 0.1, 'iron')
      .cyl([0.38, 2.1, 0.38], [0, 1.15, 0.35], { color: 'iron', taper: 0.72, rot: [82, 0, 0], name: 'barrel', pivot: [0, 1.0, -0.3] })
      .ball(0.42, [0, 1.0, -0.68], { color: 'iron', parent: 'barrel' })
      .ball(0.14, [0, 0.95, -0.95], { color: 'iron', parent: 'barrel' })
      .stick([-0.26, 1.03, -0.15], [0.26, 1.03, -0.15], 0.1, 'iron', { parent: 'barrel' })
      .torus([0.34, 0.34, 0.12], [0, 1.3, 1.38], { color: 'iron', rot: [-8, 0, 0], tube: 0.3, parent: 'barrel' });
    for (const z of [-0.45, 0.35]) b.torus([0.43, 0.43, 0.07], [0, 1.0 + (z + 0.3) * 0.14, z], { color: '#3a3d41', rot: [-8, 0, 0], tube: 0.18, parent: 'barrel' });
    b.pair((s) => spoked(b, s * 0.62, 0.65, 0.1, 1.3, 'darkwood', 7));
    return b.act({ click: [A.par(A.pose('barrel', { move: [0, 0, -0.35], dur: 0.08 }), A.effect('smoke', { dur: 2 }), A.anim('shake'), A.say('BOOM!', 1.5)), A.pose('barrel', { move: [0, 0, 0], dur: 1.0 })] }).done();
  }),
  // A pyramid of iron cannonballs; the top one rolls off.
  e('cannonball', 'armory', 'artillery', () => {
    const b = m('cannonball').ball(0.16, [0, 0.21, 0], { color: 'iron', name: 'top', piece: true });
    around(3, 0.093, 0.5).forEach(([x, z]) => b.ball(0.16, [x, 0.08, z], { color: 'iron' }));
    b.ball([0.03, 0.02, 0.01], [0.03, 0.26, 0.065], { color: '#9aa0a6', noInk: true, parent: 'top' });
    return b.act({ click: [[A.pose('top', { move: [0.25, -0.13, 0.1], rot: [0, 0, -180], dur: 0.6 }), A.say('Clonk!', 1)], [A.pose('top', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A 5 m open canoe at real size: a moulded hull with upswept ends (a loft cut to its bottom half), wooden
  // gunwales, two cane seats, a carry yoke and a paddle laid across. It rocks and the paddle strokes.
  e('canoe', 'garage', 'boats', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.06, 0.62, 0.18], [0.1, 0.55, 0.9, 0.06], [0.3, 0.92, 1, 0.01], [0.5, 1, 1, 0], [0.7, 0.92, 1, 0.01], [0.9, 0.55, 0.9, 0.06], [1, 0.06, 0.62, 0.18]];
    const W = 0.9, H = 0.76, L = 5.0, Y = 0.4;
    const b = m('canoe', { view: 'side' })
      .loft([W, H, L], [0, Y, 0], prof, { color: '#2f8a5a', cut: 'bottom', boxy: 0.25, name: 'hull' })
      .loft([W * 0.94, H * 0.9, L * 0.96], [0, Y + 0.02, 0], prof.map(([t, w, h, c]) => [t, Math.max(0.02, w - 0.04), h, c] as [number, number, number, number]), { color: '#e3c494', cut: 'bottom', boxy: 0.25, noInk: true });
    b.pair((s) => {
      for (let i = 0; i < prof.length - 1; i++) {
        const [t0, w0, , c0] = prof[i], [t1, w1, , c1] = prof[i + 1];
        b.stick([s * w0 * W * 0.48, Y + c0 * H + 0.01, -L / 2 + t0 * L], [s * w1 * W * 0.48, Y + c1 * H + 0.01, -L / 2 + t1 * L], 0.035, 'darkwood', { edge: 'sharp' });
      }
    });
    for (const z of [-1.5, 1.6]) b.box([0.78, 0.04, 0.24], [0, Y - 0.08, z], { color: 'lightwood', edge: 'sharp' });
    b.box([0.86, 0.05, 0.1], [0, Y - 0.01, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0.25, Y + 0.03, -0.9], [-0.15, Y + 0.05, 0.7], 0.035, 'lightwood', { name: 'paddle', pivot: [0.25, Y + 0.03, -0.9] })
      .box([0.2, 0.03, 0.5], [-0.22, Y + 0.06, 1.05], { color: 'lightwood', rot: [0, -14, 0], round: 0.6, parent: 'paddle' })
      .label('SWIFT', [0.5, 0.12], [0.43, Y - 0.08, 1.6], { color: 'white', rot: [0, 90, 0], depth: 0.005 })
      .socket('seat', [0, Y - 0.05, -1.5], 'seat');
    return b.act({ click: [A.par(A.anim('wobble'), A.pose('paddle', { rot: [0, 0, 50], dur: 0.5 }), A.effect('water_spray', { dur: 1.2 }), A.say('Splish!', 1)), A.pose('paddle', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A 3 x 3 m pop-up gazebo: four legs with feet, a peaked roof with a scalloped valance and a finial. Click: a
  // shower passes over it.
  e('canopy', 'garden', 'garden things', () => {
    const b = m('canopy')
      .pyramid([4.2, 0.9, 4.2], [0, 2.9, 0], 4, { color: 'white', rot: [0, 45, 0] })
      .box([3.0, 0.3, 3.0], [0, 2.32, 0], { color: '#c0362c', round: 0.1, edge: 'sharp' })
      .ball(0.16, [0, 3.38, 0], { color: '#c0362c' });
    b.each(4, (k) => b.each(6, (i) => {
      const a = (k * Math.PI) / 2;
      const u = -1.25 + i * 0.5;
      b.cone([0.5, 0.18, 0.04], [Math.cos(a) * u - Math.sin(a) * 1.5, 2.08, Math.sin(a) * u + Math.cos(a) * 1.5], { color: i % 2 ? 'white' : '#c0362c', rot: [180, -a / RAD, 0], noInk: true });
    }));
    for (const [x, z] of [[1.45, 1.45], [-1.45, 1.45], [1.45, -1.45], [-1.45, -1.45]]) {
      b.box([0.06, 2.3, 0.06], [x, 1.15, z], { color: 'silver', edge: 'sharp' });
      b.box([0.18, 0.03, 0.18], [x, 0.015, z], { color: 'darkgray', edge: 'sharp' });
      b.rod([x, 1.9, z], [x * 0.6, 2.3, z * 0.6], 0.035, 'silver');
    }
    return b.act({ click: [A.par(A.effect('rain', { dur: 2.5 }), A.say('Pitter patter...', 2.5))] }).done();
  }),
  // A four-poster bed: turned posts, a canopy frame with a valance, drapes that draw shut, a carved headboard, a
  // mattress with a duvet and pillows.
  e('canopy bed', 'home', 'beds', () => {
    const b = m('canopy bed', { edge: 'sharp' })
      .box([1.65, 0.32, 2.1], [0, 0.26, 0], { color: 'darkwood', round: 0.2 })
      .box([1.55, 0.2, 2.0], [0, 0.52, 0], { color: 'white', round: 0.4, edge: 'soft' })
      .box([1.58, 0.1, 1.35], [0, 0.65, 0.33], { color: '#8a5fc4', round: 0.5, edge: 'soft' })
      .box([1.65, 1.0, 0.1], [0, 0.95, -1.02], { color: 'darkwood', round: 0.3 })
      .arc([1.2, 0.5, 0.1], [0, 1.3, -1.02], { color: 'darkwood', tube: 0.3 })
      .box([1.65, 0.45, 0.08], [0, 0.5, 1.03], { color: 'darkwood', round: 0.3 })
      .box([1.78, 0.08, 2.22], [0, 2.22, 0], { color: 'darkwood' })
      .box([1.8, 0.3, 2.24], [0, 2.06, 0], { color: '#f4a1c0', round: 0.3, edge: 'soft' });
    b.pair((s) => b.box([0.55, 0.15, 0.35], [s * 0.38, 0.72, -0.75], { color: 'white', round: 0.6, edge: 'soft' }));
    for (const [x, z] of [[0.8, 1.04], [-0.8, 1.04], [0.8, -1.04], [-0.8, -1.04]]) {
      b.box([0.08, 2.25, 0.08], [x, 1.12, z], { color: 'darkwood' });
      b.ball(0.12, [x, 2.32, z], { color: 'darkwood' });
      if (z < 0) b.box([0.22, 1.7, 0.22], [x, 1.1, z], { color: '#f4a1c0', round: 0.6, edge: 'soft' });
    }
    b.pair((s) => b.box([0.24, 1.75, 0.08], [s * 0.7, 1.08, 1.08], { color: '#f4a1c0', round: 0.5, edge: 'soft', name: s > 0 ? 'drapeL' : 'drapeR', mover: { kind: 'slide', axis: 'x', amount: s * -0.55 } }));
    return b.socket('bed', [0, 0.72, 0.1], 'top', { size: 1.5 }).act({ click: [[A.operate('drape', 'out'), A.say('Goodnight!', 1.5)], [A.operate('drape', 'in')]] }).done();
  }),
  // A felt-covered army canteen with its cap on a chain and a carrying strap; unscrew, drink, screw it back.
  e('canteen (container)', 'sports', 'camping gear', () => {
    const b = m('canteen (container)')
      .cyl([0.2, 0.07, 0.2], [0, 0.11, 0], { color: 'olive', rot: [90, 0, 0] })
      .torus([0.2, 0.2, 0.02], [0, 0.11, 0], { color: 'darkgreen', tube: 0.06 })
      .cyl([0.03, 0.03, 0.03], [0, 0.22, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.042, 0.025, 0.042], [0, 0.24, 0], { color: 'black', edge: 'sharp', name: 'cap' });
    path(b, arc(0, 0.11, 0.105, 0.19, 10, 170, 6, -0.04), 0.014, 'darkbrown');
    return b.act({ click: [A.pose('cap', { move: [0.04, 0.03, 0], rot: [0, 360, 0], dur: 0.5 }), A.par(A.set({ tilt: 25, dur: 0.4 }), A.say('Glug glug... ahh!', 1.5)), A.set({ tilt: 0, dur: 0.4 }), A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A painting on a wooden easel (a 1.75 m A-frame with a back leg): click and the canvas goes blank, then the
  // painting reappears stroke by stroke.
  e('canvas', 'study', 'art supplies', () => {
    const b = m('canvas')
      .stick([-0.36, 0, 0.18], [0, 1.75, -0.05], 0.04, 'wood')
      .stick([0.36, 0, 0.18], [0, 1.75, -0.05], 0.04, 'wood')
      .stick([0, 0, -0.5], [0, 1.6, -0.06], 0.04, 'wood')
      .box([0.86, 0.04, 0.09], [0, 0.72, 0.13], { color: 'wood', edge: 'sharp' })
      .box([0.7, 0.86, 0.04], [0, 1.16, 0.09], { color: '#f6f3ea', rot: [-6, 0, 0], round: 0.05, edge: 'sharp' })
      .box([0.72, 0.88, 0.035], [0, 1.16, 0.075], { color: 'lightwood', rot: [-6, 0, 0], round: 0.05, edge: 'sharp' });
    const zf = (y: number) => 0.112 - (y - 1.16) * 0.105;
    const blobs = [[0, 0.88, 0.62, 0.22, 'green'], [-0.05, 1.38, 0.6, 0.3, 'skyblue'], [0.18, 1.45, 0.14, 0.14, 'yellow'], [-0.18, 1.0, 0.14, 0.34, '#8a5a35'], [-0.18, 1.2, 0.3, 0.22, 'darkgreen'], [0.15, 1.02, 0.2, 0.16, 'red']] as const;
    blobs.forEach(([x, y, w, h, c], i) => b.ball([w, h, 0.008], [x, y, zf(y)], { color: c, rot: [-6, 0, 0], noInk: true, name: `paint${i}` }));
    return b
      .act({ click: [A.par(...blobs.map((_, i) => A.pose(`paint${i}`, { scale: 0, dur: 0.3 }))), A.say('Dab, dab, swish...', 2), ...blobs.map((_, i) => A.pose(`paint${i}`, { scale: 1, dur: 0.35 }))] })
      .done();
  }),
  // A 30 m red-rock gorge (a hill-sized version): stepped canyon walls in coloured layers either side of a river,
  // boulders on the floor, a rock perched on the rim that can tumble down.
  e('canyon', 'nature', 'landforms', () => {
    const b = m('canyon').box([30, 0.3, 18], [0, 0.15, 0], { color: 'sand', round: 0.05 }).box([5, 0.12, 18.2], [0, 0.34, 0], { color: 'water', round: 0.3 });
    const cols = ['#b5532a', '#c4622d', '#d9894a', '#c4622d', '#e0a060'];
    b.pair((s) => {
      for (let k = 0; k < 5; k++) b.box([12 - k * 1.2, 2.4, 18 - k * 0.9], [s * (9 + k * 0.6), 1.5 + k * 2.4, -k * 0.3], { color: cols[k], round: 0.08, name: `layer${s > 0 ? 'L' : 'R'}${k}` });
      b.ball([2.2, 1.4, 1.8], [s * 3.6, 0.9, 5], { color: 'rock' });
      b.ball([1.4, 1.0, 1.3], [s * 4.2, 0.7, -4], { color: '#9a6a4a' });
      b.cone([2.4, 4, 2.4], [s * 4.5, 2.3, -7.5], { color: '#c4622d', segs: 6 });
    });
    b.ball([1.6, 1.3, 1.5], [-8.4, 12.95, 3], { color: '#9a5a3a', name: 'rock', parent: 'layerR4', piece: true });
    return b.act({ click: [[A.detach('rock', 'rock'), A.par(A.effect('dust', { dur: 2 }), A.say('Rumble... umble... umble...', 2.5))], [A.reattach('rock')]] }).done();
  }),
  // A graduate in cap and gown with a diploma: a cheer with both arms up, and the mortarboard flies into the air.
  e('cap and gown', 'wardrobe', 'outfits', () =>
    withAct(who('cap and gown', { top: 'navy', bottom: 'navy', skirt: 'navy', long: true, shoes: 'black', acc: [hat('grad', 'navy'), wear('robe', 'navy'), held('scroll')] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('We did it! I graduated!', 2)), A.par(A.pose('hat_grad_0', { move: [0, 0.7, 0], dur: 0.4 }), A.pose('hat_grad_1', { move: [0, 0.7, 0], rot: [0, 360, 0], dur: 0.4 }), A.pose('hat_grad_2', { move: [0, 0.7, 0], dur: 0.4 })), A.par(A.pose('hat_grad_0', { move: [0, 0, 0], dur: 0.4 }), A.pose('hat_grad_1', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }), A.pose('hat_grad_2', { move: [0, 0, 0], dur: 0.4 }))],
        [A.par(A.anim('bow'), A.say('Thank you, thank you!', 2))],
      ],
    }),
  ),
  // A toy cap gun: a silver revolver with a red grip; the hammer snaps and a cap goes bang.
  e('cap gun', 'toys', 'toy weapons', () =>
    m('cap gun', { edge: 'sharp' })
      .cyl([0.022, 0.12, 0.022], [0.05, 0.115, 0], { color: 'silver', rot: [0, 0, 90] })
      .box([0.07, 0.04, 0.03], [-0.03, 0.11, 0], { color: 'silver', round: 0.3 })
      .cyl([0.05, 0.036, 0.05], [-0.01, 0.1, 0], { color: 'steel', rot: [0, 0, 90] })
      .box([0.04, 0.09, 0.03], [-0.065, 0.05, 0], { color: 'red', rot: [0, 0, -18], round: 0.4 })
      .torus([0.035, 0.035, 0.008], [-0.02, 0.07, 0], { color: 'silver', tube: 0.2 })
      .box([0.006, 0.02, 0.006], [-0.02, 0.075, 0], { color: 'black' })
      .box([0.012, 0.025, 0.012], [-0.065, 0.135, 0], { color: 'steel', rot: [0, 0, 30], name: 'hammer', pivot: [-0.06, 0.125, 0] })
      .ball(0.01, [0.105, 0.13, 0], { color: 'silver' })
      .act({ click: [A.pose('hammer', { rot: [0, 0, 30], dur: 0.2 }), A.pose('hammer', { rot: [0, 0, 0], dur: 0.05 }), A.par(A.effect('smoke', { dur: 0.8 }), A.say('Bang!', 1), A.anim('shake'))] })
      .done(),
  ),
  // A two-colour capsule: the halves pull apart and click back together.
  e('capsule (shape)', 'ideas', 'shapes', () => {
    const P = diag(-0.035, 0.02, 35);
    const o: V = [Math.cos(35 * RAD) * 0.03, Math.sin(35 * RAD) * 0.03, 0];
    return m('capsule (shape)').rod(P(0), P(0.045), 0.036, 'red', { name: 'half' }).rod(P(0.045), P(0.09), 0.036, 'white').act({ click: [A.pose('half', { move: [-o[0], -o[1], 0], dur: 0.4 }), A.effect('sparkle', { dur: 0.8 }), A.pose('half', { move: [0, 0, 0], dur: 0.3 }), A.say('Click!', 0.8)] }).done();
  }),
  // A family car at real size: the saloon kit in blue. Honk and flash; the driver's door opens.
  e('car', 'garage', 'cars', () =>
    sedan(m('car', { view: 'side' }), '#3f72c4')
      .act({ click: [[A.operate('light', 'on'), A.par(A.anim('shake'), A.say('Honk honk!', 1.5)), A.operate('light', 'off')], [A.operate('door', 'open'), A.say('Click!', 1), A.wait(2), A.operate('door', 'close')]] })
      .done(),
  ),
  // A 12 V car battery with its terminals; touch them and it sparks.
  e('car battery', 'garage', 'car parts', () =>
    m('car battery', { edge: 'sharp' })
      .box([0.26, 0.18, 0.17], [0, 0.09, 0], { color: 'black', round: 0.1 })
      .box([0.26, 0.03, 0.17], [0, 0.195, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.026, 0.03, 0.026], [0.08, 0.222, 0.03], { color: 'red' })
      .cyl([0.026, 0.03, 0.026], [-0.08, 0.222, 0.03], { color: 'silver' })
      .box([0.03, 0.008, 0.008], [0.08, 0.212, -0.03], { color: 'red', noInk: true })
      .box([0.008, 0.008, 0.03], [0.08, 0.212, -0.03], { color: 'red', noInk: true })
      .box([0.03, 0.008, 0.008], [-0.08, 0.212, -0.03], { color: 'white', noInk: true })
      .label('12V', [0.12, 0.06], [0, 0.1, 0.09], { color: 'yellow', depth: 0.004 })
      .torus([0.1, 0.06, 0.01], [0, 0.24, 0], { color: 'black', tube: 0.15 })
      .act({ click: [A.par(A.effect('sparkle', { dur: 0.8 }), A.anim('shake'), A.say('Bzzzt!', 1))] })
      .done(),
  ),
  // A car dealership: a glass-fronted showroom under a big red fascia, sliding doors, a sign pylon, bunting, and
  // two cars for sale on the forecourt. Click: the doors; again: a car flashes and honks.
  e('car dealership', 'places', 'shops', () => {
    const b = m('car dealership', { edge: 'sharp' })
      .box([20, 0.1, 18], [0, 0.05, 2], { color: '#5c6166', round: 0.02 })
      .box([16, 5.5, 9], [0, 2.75, -4], { color: 'white', round: 0.02 })
      .box([16.4, 1.2, 9.4], [0, 5.9, -4], { color: '#c0362c', round: 0.05 })
      .label('AUTO CITY', [8, 1.0], [0, 5.9, 0.75], { color: '#c0362c', depth: 0.03 })
      .box([15, 4.4, 0.08], [0, 2.4, 0.52], { color: 'glass' })
      .box([1.2, 2.5, 0.06], [-0.62, 1.3, 0.6], { color: '#c9e8f5', name: 'glassL', mover: { kind: 'slide', axis: 'x', amount: -1.15 } })
      .box([1.2, 2.5, 0.06], [0.62, 1.3, 0.6], { color: '#c9e8f5', name: 'glassR', mover: { kind: 'slide', axis: 'x', amount: 1.15 } })
      .box([0.6, 7, 0.6], [8.5, 3.5, 8.5], { color: '#c0362c' })
      .box([2.4, 1.6, 0.4], [8.5, 7.2, 8.5], { color: 'white' })
      .label('CARS', [2, 1], [8.5, 7.2, 8.72], { color: '#c0362c', depth: 0.02 });
    b.each(5, (i) => b.box([0.12, 4.4, 0.14], [-6 + i * 3, 2.4, 0.58], { color: '#5c6166' }));
    b.each(9, (i) => b.box([0.12, 0.02, 4.6], [-8 + i * 2.2, 0.11, 5.5], { color: 'white', noInk: true, round: 0 }));
    b.each(3, (i) => b.stick([-8 + i * 4, 0.1, 9.5], [-8 + i * 4, 5.0, 9.5], 0.08, 'silver').box([1.0, 0.65, 0.03], [-7.48 + i * 4, 4.6, 9.5], { color: ['#c0362c', '#f6d24a', '#4e8fd6'][i] }));
    sedan(b, '#e0473b', [-3.3, 0, 5.5], 'a');
    sedan(b, '#2f2f3a', [3.3, 0, 5.5], 'b');
    return b.act({ click: [[A.operate('glass', 'open'), A.say('Ding!', 1), A.wait(2.5), A.operate('glass', 'close')], [A.operate('light', 'on'), A.say('Beep beep!', 1.5), A.wait(0.8), A.operate('light', 'off')]] }).done();
  }),
  // A scissor jack: four red arms on a threaded rod; crank it and the saddle rises.
  e('car jack', 'garage', 'car parts', () => {
    const b = m('car jack', { edge: 'sharp' })
      .box([0.3, 0.035, 0.12], [0, 0.0175, 0], { color: 'darkgray', round: 0.2 })
      .box([0.12, 0.035, 0.1], [0, 0.4, 0], { color: 'darkgray', round: 0.2, name: 'saddle', mover: { kind: 'slide', axis: 'y', amount: 0.06 } })
      .stick([-0.22, 0.21, 0], [0.16, 0.21, 0], 0.016, 'silver');
    b.pair((s) => {
      b.rod([s * 0.02, 0.04, 0], [s * 0.14, 0.21, 0], 0.03, 'red').rod([s * 0.14, 0.21, 0], [s * 0.02, 0.38, 0], 0.03, 'red');
      b.ball(0.035, [s * 0.14, 0.21, 0], { color: 'darkgray' });
    });
    b.stick([-0.22, 0.21, 0], [-0.28, 0.21, 0], 0.016, 'silver', { name: 'crank', pivot: [-0.22, 0.21, 0] }).stick([-0.28, 0.21, 0], [-0.28, 0.12, 0], 0.016, 'silver', { parent: 'crank' });
    return b.act({ click: [[A.par(A.pose('crank', { rot: [1080, 0, 0], dur: 1.6 }), A.operate('saddle', 'up'), A.say('Click, click, click...', 1.6)), A.pose('crank', { rot: [0, 0, 0], dur: 0.01 })], [A.par(A.pose('crank', { rot: [-1080, 0, 0], dur: 1.6 }), A.operate('saddle', 'down')), A.pose('crank', { rot: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // A car's front seat on its runners: a bolstered cushion, a backrest that reclines, a headrest and a belt buckle.
  e('car seat', 'garage', 'car parts', () =>
    m('car seat')
      .box([0.5, 0.05, 0.5], [0, 0.025, 0.02], { color: 'steel', edge: 'sharp' })
      .box([0.45, 0.2, 0.42], [0, 0.14, 0.02], { color: 'darkgray', round: 0.2, edge: 'sharp' })
      .box([0.52, 0.14, 0.52], [0, 0.31, 0.05], { color: '#2a2726', round: 0.5 })
      .box([0.38, 0.03, 0.4], [0, 0.385, 0.06], { color: '#4a4744', round: 0.6, noInk: true })
      .box([0.5, 0.62, 0.14], [0, 0.66, -0.2], { color: '#2a2726', rot: [-12, 0, 0], round: 0.5, name: 'back', pivot: [0, 0.36, -0.2], mover: { kind: 'swing', axis: 'x', amount: -35 } })
      .box([0.12, 0.56, 0.02], [0, 0.66, -0.12], { color: '#c0362c', rot: [-12, 0, 0], noInk: true, parent: 'back' })
      .stick([0, 0.94, -0.28], [0, 1.02, -0.3], 0.02, 'silver', { parent: 'back' })
      .box([0.28, 0.17, 0.12], [0, 1.1, -0.32], { color: '#2a2726', rot: [-12, 0, 0], round: 0.6, parent: 'back' })
      .box([0.05, 0.08, 0.04], [0.28, 0.38, -0.12], { color: 'red', edge: 'sharp' })
      .socket('seat', [0, 0.39, 0.06], 'seat')
      .act({ click: [[A.operate('back', 'open'), A.say('Ahh...', 1.2)], [A.operate('back', 'close'), A.say('Click!', 0.8)]] })
      .done(),
  ),
  // A drive-through car wash at real size: a tunnel 7 m wide with a car inside, four tall spinning side brushes
  // and a top brush, a spray arch with nozzles, a sign with bubbles, and a traffic light at the exit.
  e('car wash', 'places', 'shops', () => {
    const b = m('car wash', { view: 'side', edge: 'sharp' })
      .box([7.4, 0.12, 11], [0, 0.06, 0], { color: '#7a7f85', round: 0.02 })
      .box([7.6, 0.6, 10], [0, 4.5, 0], { color: '#2f6fb0', round: 0.05 })
      .box([7.8, 1.2, 0.3], [0, 4.6, 5.1], { color: 'white', round: 0.1 })
      .label('SPARKLE CAR WASH', [6.5, 0.8], [0, 4.6, 5.27], { color: '#2f6fb0', depth: 0.02 });
    b.pair((s) => {
      b.box([0.4, 4.2, 10], [s * 3.5, 2.1, 0], { color: '#e6e3dc', round: 0.02 });
      b.box([0.1, 0.35, 10], [s * 3.71, 3.5, 0], { color: '#2f6fb0', round: 0 });
      b.box([0.1, 0.15, 9], [s * 0.85, 0.2, 0], { color: 'yellow', round: 0.3 });
      for (const [k, z] of [[1, 1.8], [2, -1.6]] as const) {
        const n = `brush${s > 0 ? 'L' : 'R'}${k}`;
        b.cyl([0.9, 2.6, 0.9], [s * 1.6, 1.55, z], { color: k === 1 ? '#4e8fd6' : '#d64fa0', edge: 'soft', segs: 10, name: n, mover: { kind: 'spin', axis: 'y', amount: s * 500 } });
        b.cyl([0.12, 0.6, 0.12], [s * 1.6, 3.1, z], { color: 'silver' });
        b.box([1.7, 0.12, 0.12], [s * 2.45, 3.4, z], { color: 'silver' });
      }
      b.box([0.12, 3.2, 0.12], [s * 2.6, 1.6, 3.9], { color: 'silver' });
      b.each(4, (i) => b.ball(0.1, [s * 2.52, 0.6 + i * 0.7, 3.9], { color: 'skyblue', noInk: true }));
      b.ball(0.5 - (s > 0 ? 0 : 0.15), [s * 1.2, 5.6 + (s > 0 ? 0 : 0.3), 5.0], { color: '#e8f4fc', edge: 'soft' });
    });
    b.box([5.3, 0.12, 0.12], [0, 3.2, 3.9], { color: 'silver' })
      .cyl([0.8, 4.0, 0.8], [0, 2.1, -0.2], { color: '#f6d24a', edge: 'soft', segs: 10, rot: [0, 0, 90], name: 'brushTop', mover: { kind: 'spin', axis: 'y', amount: 400 } })
      .box([0.4, 1.0, 0.3], [3.0, 3.4, -5.2], { color: '#2a2726' })
      .ball(0.26, [3.0, 3.65, -5.37], { color: 'red', glow: true, name: 'stop', mover: { kind: 'light', on: true } })
      .ball(0.26, [3.0, 3.15, -5.37], { color: 'lime', glow: true, name: 'go', mover: { kind: 'light' } });
    sedan(b, '#3fa7a0', [0, 0, 0.2], 'w');
    return b
      .act({
        click: [
          [A.operate('brush', 'on'), A.par(A.effect('water_spray', { dur: 3 }), A.say('Swish, swash, swoosh!', 2.5)), A.wait(2.5), A.operate('brush', 'off'), A.effect('sparkle', { dur: 1.2 })],
          [A.operate('stop', 'off'), A.operate('go', 'on'), A.say('Ding! All clean!', 1.5), A.wait(1.5), A.operate('go', 'off'), A.operate('stop', 'on')],
        ],
      })
      .done();
  }),
  // A stack of flattened corrugated cardboard; the top sheet has a scored fold and its flap folds up and back.
  e('cardboard', 'workshop', 'materials', () => {
    const b = m('cardboard', { edge: 'sharp' });
    b.each(5, (i) => b.box([0.9, 0.006, 0.42], [0.05 + (i % 2) * 0.01, 0.003 + i * 0.007, (i % 3) * 0.005], { color: i % 2 ? '#c9a36e' : 'tan', round: 0.1 }));
    b.box([0.6, 0.006, 0.4], [-0.1, 0.038, 0], { color: 'tan', round: 0.1 })
      .box([0.3, 0.006, 0.4], [0.306, 0.144, 0], { color: '#c9a36e', round: 0.1, rot: [0, 0, 45], name: 'flap', pivot: [0.2, 0.038, 0] })
      .label('FRAGILE', [0.16, 0.06], [-0.1, 0.0415, 0], { color: 'tan', rot: [-90, 0, 0], depth: 0.002 });
    b.each(12, (i) => b.cyl([0.006, 0.004, 0.006], [-0.39 + i * 0.05, 0.039, 0.2], { color: '#b8915e', rot: [90, 0, 0], noInk: true }));
    return b.act({ click: [A.pose('flap', { rot: [0, 0, 70], dur: 0.5 }), A.say('Fold!', 0.8), A.wait(0.6), A.pose('flap', { rot: [0, 0, -44], dur: 0.5 }), A.pose('flap', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A fanned hand of playing cards beside the deck: the fan flourishes, the top card of the deck flips.
  e('cards', 'toys', 'card games', () => {
    const b = m('cards').box([0.065, 0.025, 0.09], [0.05, 0.0125, 0.06], { color: 'white', round: 0.2, edge: 'sharp' }).box([0.06, 0.004, 0.085], [0.05, 0.026, 0.06], { color: 'red', noInk: true, name: 'top', pivot: [0.08, 0.026, 0.06] });
    b.box([0.004, 0.004, 0.06], [0.05, 0.029, 0.06], { color: 'white', noInk: true, parent: 'top' });
    for (let i = 0; i < 5; i++) {
      const a = 30 - i * 15, r = a * RAD;
      const c: V = [-Math.sin(r) * 0.045 - 0.01, 0.012 + Math.cos(r) * 0.045, -i * 0.004];
      b.box([0.063, 0.088, 0.004], c, { color: 'white', rot: [0, 0, a], round: 0.15, edge: 'sharp', ...(i === 0 ? { name: 'fan', pivot: [-0.01, 0.012, 0] as V } : { parent: 'fan' }) });
      const sy: V = [c[0] - Math.sin(r) * 0.012, c[1] + Math.cos(r) * 0.012, c[2] + 0.003];
      if (i % 2) b.heart(0.022, sy, { color: 'red', rot: [0, 0, a], noInk: true, parent: 'fan' });
      else b.ball([0.016, 0.02, 0.003], sy, { color: 'black', rot: [0, 0, a], noInk: true, parent: 'fan' });
    }
    return b.act({ click: [A.par(A.pose('fan', { rot: [0, 0, -25], dur: 0.3 }), A.pose('top', { rot: [0, 0, 180], dur: 0.4 }), A.say('Ta-da!', 1.2), A.effect('sparkle', { dur: 0.8 })), A.wait(0.6), A.par(A.pose('fan', { rot: [0, 0, 0], dur: 0.3 }), A.pose('top', { rot: [0, 0, 0], dur: 0.4 }))] }).done();
  }),
  // A four-engined military transport (a C-130 kind) at real size: a 29 m fuselage from a loft with an upswept
  // tail and a rear cargo ramp that lowers, a 40 m high wing, four turboprops with spinning propellers, a tall
  // fin, landing gear in side fairings and a cockpit glazed all round.
  e('cargo plane', 'garage', 'aircraft', () => {
    const G = '#8a9099';
    // the tall fin: a loft stood upright with level root and tip chords sliding back with height, so it sits flush
    // on the upswept tail and its leading edge sweeps back
    const vfin = (root: V, h: number, chord: number, tip: number, thick: number, sweep: number, color: string) => {
      const zf = root[2] + chord / 2, sw = h * Math.tan(sweep * RAD);
      const zb = Math.min(root[2] - chord / 2, zf - sw - tip), D = zf - zb, zc = (zf + zb) / 2;
      return b.loft([thick, D, h], [root[0], root[1] + h / 2, zc], [[0, 1, chord / D, (zc - root[2]) / D], [1, 0.55, tip / D, (zc - (zf - sw - tip / 2)) / D]], { color, boxy: 0.75, rot: [-90, 0, 0], edge: 'sharp' });
    };
    const b = m('cargo plane', { view: 'side' })
      .loft([4.4, 4.6, 29], [0, 3.3, 0], [[0, 0.25, 0.3, 0.32], [0.14, 0.72, 0.72, 0.15], [0.3, 1, 1, 0], [0.84, 1, 1, 0], [0.95, 0.86, 0.84, -0.04], [1, 0.42, 0.42, -0.08]], { color: G, boxy: 0.35, name: 'fuselage' })
      .loft([2.8, 0.9, 2.6], [0, 4.85, 12.4], [[0, 0.6, 0.3, -0.2], [0.5, 1, 1, 0], [1, 0.6, 0.4, -0.25]], { color: '#1e2633', boxy: 0.5, edge: 'sharp' })
      .box([40, 0.45, 4.2], [0, 5.62, 1.6], { color: G, round: 0.3, edge: 'sharp' })
      .box([14, 0.3, 3.0], [0, 5.9, -12.9], { color: G, round: 0.3, edge: 'sharp' })
      .label('USAF 4021', [3.5, 0.5], [2.25, 3.6, -4], { color: 'white', rot: [0, 90, 0], depth: 0.02 })
      .box([3.0, 0.15, 4.35], [0, 2.15, -10.5], { color: '#6b7076', rot: [-23, 0, 0], round: 0.2, edge: 'sharp', name: 'ramp', pivot: [0, 1.3, -8.5], mover: { kind: 'swing', axis: 'x', amount: -42 } });
    [-11.5, -6, 6, 11.5].forEach((x, i) => {
      b.loft([1.3, 1.5, 5.4], [x, 5.15, 3.3], [[0, 0.4, 0.4, 0.1], [0.3, 1, 1, 0], [0.9, 0.95, 0.95, 0], [1, 0.6, 0.6, 0]], { color: G });
      b.ball(0.55, [x, 5.15, 6.05], { color: '#3a3633' });
      b.box([0.3, 4.1, 0.1], [x, 5.15, 6.25], { color: '#2a2726', edge: 'sharp', name: `propeller${i + 1}`, pivot: [x, 5.15, 6.25], mover: { kind: 'spin', axis: 'z', amount: 1100 } });
      b.box([0.3, 4.1, 0.1], [x, 5.15, 6.25], { color: '#2a2726', edge: 'sharp', rot: [0, 0, 90], parent: `propeller${i + 1}` });
    });
    b.pair((s) => {
      b.box([0.9, 1.3, 5.2], [s * 2.25, 1.55, 0.2], { color: G, round: 0.5 });
      for (const z of [-0.9, 0.9]) b.cyl([1.1, 0.4, 1.1], [s * 2.25, 0.55, z], { color: 'rubber', rot: [0, 0, 90], edge: 'soft', name: `wheel${s > 0 ? 'L' : 'R'}${z > 0 ? 'f' : 'b'}` });
      b.each(3, (i) => sidePane(b, s, 2.15, 4.0, 4 + i * 1.5, 0.35, 0.35));
    });
    vfin([0, 5.4, -11.5], 6.6, 5.6, 3.0, 0.45, 20, G);
    b.stick([0, 1.1, 11.2], [0, 0.45, 11.2], 0.2, 'silver');
    axle(b, 0.25, 0.4, 11.2, 0.8, 0.25, 'wheelN');
    return b
      .act({
        click: [
          [A.operate('propeller', 'on'), A.par(A.anim('shake', 3), A.say('Vrrrrrooom!', 2.5)), A.wait(2), A.operate('propeller', 'off')],
          [A.operate('ramp', 'open'), A.say('Whirrr... clunk!', 1.5), A.wait(2.5), A.operate('ramp', 'close')],
        ],
      })
      .done();
  }),
  // A container ship at park size (78 m, keeping its real proportions): a long hull with a flared bow, red below
  // the waterline, bays of stacked containers, a white bridge block at the stern with wings, a funnel and a radar
  // mast. Click: the horn; again: the anchor goes down and comes back up.
  e('cargo ship', 'garage', 'ships', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.9, 1, 0.02], [0.08, 1, 1, 0], [0.75, 1, 1, 0], [0.9, 0.82, 1, 0.02], [0.97, 0.45, 1, 0.06], [1, 0.12, 0.95, 0.1]];
    const b = m('cargo ship', { view: 'side', edge: 'sharp' })
      .loft([12, 8, 78], [0, 4, 0], prof, { color: '#1f3f6f', boxy: 0.85, edge: 'soft', name: 'hull' })
      .loft([12.06, 3, 77.6], [0, 1.5, 0], prof.map(([t, w, , c]) => [t, w, 1, c * 0.3] as [number, number, number, number]), { color: '#b8322a', boxy: 0.85, edge: 'soft' })
      .box([11.6, 0.3, 74], [0, 7.9, -1.5], { color: '#6b7076', round: 0.05 })
      .box([10, 2.2, 6], [0, 9.0, 33.5], { color: '#1f3f6f', round: 0.05 })
      .label('OCEAN STAR', [6, 1], [3.5, 5.6, 30], { color: 'white', rot: [0, 90, 0], depth: 0.05 })
      .label('OCEAN STAR', [6, 1], [-3.5, 5.6, 30], { color: 'white', rot: [0, -90, 0], depth: 0.05 })
      .box([11, 12, 7], [0, 14, -31], { color: 'white', round: 0.02 })
      .box([16, 0.5, 2.5], [0, 19.5, -28.4], { color: 'white', round: 0.05 })
      .box([11.04, 1.0, 6.4], [0, 19.0, -31], { color: '#2f3d52', round: 0.05 })
      .box([3.5, 6, 4], [0, 23, -35], { color: '#b8322a', round: 0.1 })
      .box([3.6, 1.2, 4.1], [0, 25, -35], { color: '#2a2726', round: 0.1 })
      .stick([0, 20, -30], [0, 27, -30], 0.3, 'white')
      .box([3, 0.3, 0.3], [0, 26, -30], { color: 'white' })
      .cyl([1.2, 0.3, 1.2], [0, 27.2, -30], { color: 'white', name: 'radar', mover: { kind: 'spin', axis: 'y', amount: 90, on: true } });
    b.each(4, (i) => b.box([10.4, 0.5, 0.1], [0, 9.6 + i * 2.4, -27.45], { color: '#2f3d52', round: 0, noInk: true }));
    const cols = ['#c0362c', '#2f6fb0', '#f0923b', '#3f8a4a', '#e8c23a', '#8a5fc4', '#c0362c', '#3fa7a0'];
    for (let bay = 0; bay < 4; bay++)
      for (let c = 0; c < 4; c++) {
        const z = 21 - bay * 13, x = -3.9 + c * 2.6;
        b.box([2.5, 7.8, 12.2], [x, 11.95, z], { color: cols[(bay * 3 + c) % 8], round: 0.02 });
        b.each(2, (i) => b.box([2.52, 0.08, 12.22], [x, 10.6 + i * 2.6, z], { color: '#2a2726', round: 0, noInk: true }));
      }
    b.box([1.4, 2, 0.8], [3.5, 6.8, 36.4], { color: '#3a3633', name: 'anchor', parent: 'hull', piece: true });
    return b
      .act({
        click: [
          [A.par(A.say('HOOOOONK!', 2.5), A.effect('smoke', { dur: 3 }))],
          [A.pose('anchor', { move: [0, -6, 0], dur: 1.5 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Clank clank... splash!', 2)), A.wait(1), A.pose('anchor', { move: [0, 0, 0], dur: 1.5 })],
        ],
      })
      .done();
  }),
  // A fairground carousel, 8 m across: a turning platform with six galloping horses on brass poles that bob up and
  // down, a mirrored centre column, a scalloped canopy with bulbs and a striped roof with a flag.
  e('carousel', 'toys', 'fairground', () => {
    const b = m('carousel')
      .cyl([8, 0.25, 8], [0, 0.125, 0], { color: '#6e1f1a', edge: 'sharp' })
      .cyl([7.4, 0.3, 7.4], [0, 0.4, 0], { color: '#d8b07a', name: 'platform', mover: { kind: 'spin', axis: 'y', amount: 40 } })
      .cyl([1.4, 4.0, 1.4], [0, 2.55, 0], { color: '#e2b23a', parent: 'platform', segs: 8 })
      .cyl([1.45, 2.2, 1.45], [0, 2.4, 0], { color: '#c9e8f5', parent: 'platform', segs: 8, noInk: true })
      .cyl([8.0, 0.7, 8.0], [0, 4.7, 0], { color: '#e2b23a', parent: 'platform', segs: 16 })
      .cyl([8.4, 0.12, 8.4], [0, 5.08, 0], { color: '#c0362c', parent: 'platform' })
      .cone([8.6, 2.0, 8.6], [0, 6.1, 0], { color: '#c0362c', parent: 'platform', segs: 16 })
      .stick([0, 7.0, 0], [0, 8.2, 0], 0.08, 'gold', { parent: 'platform' })
      .wedge([0.8, 0.5, 0.03], [0.4, 8.0, 0], { color: 'yellow', rot: [0, 0, -90], parent: 'platform' });
    b.each(16, (i) => {
      const a = (i / 16) * Math.PI * 2;
      b.ball([1.5, 0.55, 0.14], [Math.cos(a) * 3.98, 4.38, Math.sin(a) * 3.98], { color: i % 2 ? 'white' : '#c0362c', rot: [0, -a / RAD + 90, 0], parent: 'platform' });
      b.ball(0.16, [Math.cos(a) * 4.06, 4.95, Math.sin(a) * 4.06], { color: '#fff1b8', glow: true, parent: 'platform', name: `bulb${i}`, mover: { kind: 'light', on: true } });
    });
    const cols = ['white', '#f2e6cf', '#5a3a22', 'white', '#2a2726', '#d9b98a'];
    around(6, 2.6, 0.3).forEach(([x, z], i) => {
      const th = Math.atan2(z, x), tx = -Math.sin(th), tz = Math.cos(th), ry = (-th * 180) / Math.PI;
      const n = `horse${i + 1}`, y = 1.35 + (i % 2) * 0.3;
      b.stick([x, 0.55, z], [x, 4.4, z], 0.06, 'gold', { parent: 'platform' });
      b.ball([0.42, 0.5, 1.15], [x, y, z], { color: cols[i], rot: [0, ry, 0], parent: 'platform', name: n });
      b.rod([x + tx * 0.42, y + 0.15, z + tz * 0.42], [x + tx * 0.6, y + 0.6, z + tz * 0.6], 0.22, cols[i], { parent: n });
      b.ball([0.2, 0.24, 0.42], [x + tx * 0.72, y + 0.62, z + tz * 0.72], { color: cols[i], rot: [30, ry, 0], parent: n });
      b.box([0.45, 0.1, 0.4], [x, y + 0.28, z], { color: '#c0362c', rot: [0, ry, 0], parent: n });
      b.rod([x - tx * 0.5, y + 0.05, z - tz * 0.5], [x - tx * 0.75, y - 0.35, z - tz * 0.75], 0.1, '#e2b23a', { parent: n });
      b.pair((s) => {
        const ox = Math.cos(th) * s * 0.13, oz = Math.sin(th) * s * 0.13;
        b.rod([x + tx * 0.35 + ox, y - 0.15, z + tz * 0.35 + oz], [x + tx * 0.6 + ox, y - 0.45, z + tz * 0.6 + oz], 0.08, cols[i], { parent: n });
        b.rod([x - tx * 0.35 + ox, y - 0.15, z - tz * 0.35 + oz], [x - tx * 0.55 + ox, y - 0.6, z - tz * 0.55 + oz], 0.08, cols[i], { parent: n });
      });
    });
    const bob = (up: boolean) => A.par(...[1, 2, 3, 4, 5, 6].map((i) => A.pose(`horse${i}`, { move: [0, (i % 2 ? 1 : -1) * (up ? 0.25 : -0.05), 0], dur: 0.7 })));
    return b
      .act({ click: [[A.operate('platform', 'on'), A.say('Oom-pah-pah, oom-pah-pah!', 2.5), bob(true), bob(false), bob(true), bob(false)], [A.operate('platform', 'off'), A.operate('bulb', 'off'), A.wait(0.4), A.operate('bulb', 'on')]] })
      .done();
  }),
  // A horse-drawn coach at real size: a curved body on leaf springs with a door and window, lamps, a coachman's
  // box seat up front, big spoked wheels (1.5 m at the back) and the shafts for the horse.
  e('carriage', 'garage', 'horse-drawn', () => {
    const b = m('carriage', { view: 'side' })
      .box([0.9, 0.15, 3.6], [0, 1.0, 0], { color: 'darkwood', edge: 'sharp' })
      .loft([1.6, 1.5, 2.2], [0, 1.95, -0.4], [[0, 0.8, 0.85, 0.05], [0.15, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.85, 0.9, 0.04]], { color: '#5a2a6a', boxy: 0.75, name: 'body' })
      .box([1.7, 0.12, 2.3], [0, 2.76, -0.4], { color: '#e2b23a', round: 0.4, edge: 'sharp' })
      .ball(0.28, [0, 2.9, -0.4], { color: '#e2b23a' })
      .box([1.0, 0.35, 0.5], [0, 2.25, 1.05], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .box([1.0, 0.1, 0.55], [0, 2.45, 1.05], { color: '#8a2b3a', round: 0.5 })
      .box([0.9, 0.5, 0.08], [0, 1.65, 1.35], { color: 'darkwood', rot: [30, 0, 0], edge: 'sharp' })
      .socket('seat', [0, 2.5, 1.05], 'seat');
    b.pair((s) => {
      b.box([0.04, 0.6, 0.7], [s * 0.82, 2.1, 0.3], { color: '#2f3d52', edge: 'sharp' });
      b.box([0.04, 0.6, 0.5], [s * 0.82, 2.1, -1.2], { color: '#2f3d52', edge: 'sharp' });
      b.capsule([0.14, 0.24, 0.14], [s * 0.85, 2.5, 0.85], { color: '#fff1b8', glow: true, name: `lamp${s > 0 ? 1 : 2}`, mover: { kind: 'light', on: true } });
      b.box([0.08, 0.06, 1.4], [s * 0.45, 0.9, -0.4], { color: 'iron', rot: [8, 0, 0], edge: 'sharp' });
      spoked(b, s * 0.85, 0.75, -1.3, 1.5, '#e2b23a', 7, `wheelB${s > 0 ? 'L' : 'R'}`);
      spoked(b, s * 0.85, 0.55, 1.2, 1.1, '#e2b23a', 6, `wheelF${s > 0 ? 'L' : 'R'}`);
      b.rod([s * 0.45, 0.95, 1.5], [s * 0.45, 1.05, 3.6], 0.07, 'darkwood');
    });
    b.stick([-0.85, 0.75, -1.3], [0.85, 0.75, -1.3], 0.08, 'iron').stick([-0.85, 0.55, 1.2], [0.85, 0.55, 1.2], 0.07, 'iron')
      .box([0.04, 1.0, 0.6], [0.82, 1.85, -0.45], { color: '#5a2a6a', edge: 'sharp', name: 'door', pivot: [0.82, 1.85, -0.75], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([0.03, 0.4, 0.4], [0.84, 2.1, -0.45], { color: '#2f3d52', parent: 'door' })
      .ball(0.05, [0.86, 1.8, -0.22], { color: 'gold', parent: 'door' });
    const roll = (a: number) => A.par(A.pose('wheelBL', { rot: [a, 0, 0], dur: 1.6 }), A.pose('wheelBR', { rot: [a, 0, 0], dur: 1.6 }), A.pose('wheelFL', { rot: [a * 1.4, 0, 0], dur: 1.6 }), A.pose('wheelFR', { rot: [a * 1.4, 0, 0], dur: 1.6 }));
    return b.act({ click: [[A.operate('door', 'open'), A.say('Your carriage awaits!', 2), A.wait(2), A.operate('door', 'close')], [A.par(roll(360), A.say('Clip-clop, clip-clop!', 1.6)), roll(0)]] }).done();
  }),
  // A carrot growing in a little mound of soil, feathery top showing; click and it pulls up out of the ground.
  e('carrot', 'food', 'vegetables', () => {
    const b = m('carrot')
      .ball([0.14, 0.05, 0.14], [0, 0.0, 0], { color: 'dirt' })
      .cone([0.05, 0.2, 0.05], [0, 0.07, 0], { color: 'orange', rot: [180, 0, 0], name: 'carrot' });
    b.each(3, (i) => b.box([0.033 - i * 0.008, 0.004, 0.004], [0, 0.14 - i * 0.04, 0.022 - i * 0.004], { color: '#d97a2a', noInk: true, parent: 'carrot' }));
    for (const [x, z] of [[-0.03, 0], [0.03, 0.01], [0, -0.02], [0.005, 0.02]]) b.rod([0, 0.17, 0], [x, 0.26, z], 0.012, 'leaf', { parent: 'carrot' });
    return b.act({ click: [[A.pose('carrot', { move: [0, 0.12, 0], dur: 0.4 }), A.say('Pop!', 1)], [A.pose('carrot', { move: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  e('carrot juice', 'food', 'drinks', () =>
    drink(m('carrot juice'), 0.15, 0.07, 'orange', 0.82)
      .stick([0.01, 0.1, 0], [0.025, 0.2, 0.0], 0.008, 'green', { name: 'straw' })
      .cone([0.018, 0.06, 0.018], [-0.03, 0.15, 0.0], { color: 'orange', rot: [180, 0, 25] })
      .rod([-0.042, 0.18, 0], [-0.05, 0.2, 0], 0.008, 'leaf')
      .act({ click: [A.par(A.pose('straw', { move: [0, -0.015, 0], dur: 0.3 }), A.say('Slurrrp!', 1.5)), A.pose('straw', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A wooden handcart: a slatted bed with sides, two big spoked wheels on an axle, two long handles and a prop leg.
  e('cart (vehicle)', 'garage', 'carts', () => {
    const b = m('cart (vehicle)', { view: 'side', edge: 'sharp' })
      .box([1.0, 0.08, 1.4], [0, 0.72, 0.1], { color: 'wood' })
      .box([1.0, 0.35, 0.06], [0, 0.92, 0.77], { color: 'wood' })
      .box([1.0, 0.35, 0.06], [0, 0.92, -0.57], { color: 'wood' })
      .stick([0, 0.68, -0.5], [0, 0, -0.5], 0.06, 'darkwood')
      .stick([-0.75, 0.62, 0.1], [0.75, 0.62, 0.1], 0.06, 'iron');
    b.each(4, (i) => b.box([1.0, 0.012, 0.02], [0, 0.765, -0.4 + i * 0.33], { color: 'darkwood', noInk: true }));
    b.pair((s) => {
      b.box([0.06, 0.35, 1.4], [s * 0.5, 0.92, 0.1], { color: 'wood' });
      spoked(b, s * 0.68, 0.62, 0.1, 1.2, 'darkwood', 6, `wheel${s > 0 ? 'L' : 'R'}`);
      b.rod([s * 0.42, 0.72, -0.5], [s * 0.42, 0.95, -1.6], 0.06, 'darkwood');
    });
    return b.act({ click: [A.par(A.pose('wheelL', { rot: [360, 0, 0], dur: 1.4 }), A.pose('wheelR', { rot: [360, 0, 0], dur: 1.4 }), A.say('Rumble, creak...', 1.4)), A.par(A.pose('wheelL', { rot: [0, 0, 0], dur: 0.01 }), A.pose('wheelR', { rot: [0, 0, 0], dur: 0.01 }))] }).done();
  }),
  // A cardboard carton with its flaps standing open; they fold shut and open again.
  e('carton', 'home', 'boxes', () =>
    m('carton', { edge: 'sharp' })
      .box([0.4, 0.28, 0.3], [0, 0.14, 0], { color: 'tan', round: 0.04 })
      .box([0.38, 0.01, 0.28], [0, 0.279, 0], { color: '#8a6440' })
      .box([0.4, 0.15, 0.008], [0, 0.341, 0.193], { color: 'tan', rot: [35, 0, 0], name: 'flapF', pivot: [0, 0.28, 0.15], mover: { kind: 'swing', axis: 'x', amount: 125 } })
      .box([0.4, 0.15, 0.008], [0, 0.341, -0.193], { color: 'tan', rot: [-35, 0, 0], name: 'flapB', pivot: [0, 0.28, -0.15], mover: { kind: 'swing', axis: 'x', amount: -125 } })
      .box([0.008, 0.12, 0.3], [0.235, 0.33, 0], { color: '#c9a36b', rot: [0, 0, -35], name: 'flapL', pivot: [0.2, 0.28, 0], mover: { kind: 'swing', axis: 'z', amount: -125 } })
      .box([0.008, 0.12, 0.3], [-0.235, 0.33, 0], { color: '#c9a36b', rot: [0, 0, 35], name: 'flapR', pivot: [-0.2, 0.28, 0], mover: { kind: 'swing', axis: 'z', amount: 125 } })
      .label('THIS SIDE UP', [0.2, 0.04], [0, 0.14, 0.152], { color: 'tan', depth: 0.003 })
      .socket('box', [0, 0.02, 0], 'top', { size: 0.28 })
      .act({ click: [[A.operate('flap', 'close'), A.say('Fold, fold!', 1)], [A.operate('flap', 'open')]] })
      .done(),
  ),
  e('cartridge (electronics)', 'tech', 'games', () => {
    const b = m('cartridge (electronics)', { edge: 'sharp' })
      .box([0.1, 0.105, 0.02], [0, 0.0625, 0], { color: 'gray', round: 0.15 })
      .box([0.09, 0.02, 0.016], [0, 0.01, 0], { color: 'darkgray' })
      .box([0.075, 0.055, 0.004], [0, 0.065, 0.011], { color: 'red' })
      .label('GAME', [0.06, 0.015], [0, 0.083, 0.013], { color: 'white', depth: 0.002 });
    b.each(5, (i) => b.box([0.012, 0.004, 0.021], [-0.03 + i * 0.015, 0.112, 0], { color: 'darkgray', noInk: true }));
    return b.act({ click: [A.par(A.anim('hop'), A.say('Bleep bloop!', 1.2), A.effect('sparkle', { dur: 0.8 }))] }).done();
  }),
  // A leather briefcase: brass clasps, a handle, and a lid that opens on its back hinge to show papers.
  e('case', 'wardrobe', 'bags', () => {
    const b = m('case', { edge: 'sharp' })
      .box([0.44, 0.24, 0.1], [0, 0.12, 0], { color: 'leather', round: 0.15 })
      .box([0.4, 0.004, 0.08], [0, 0.235, 0.0], { color: 'paper', noInk: true })
      .box([0.444, 0.09, 0.104], [0, 0.29, 0], { color: 'leather', round: 0.15, name: 'lid', pivot: [0, 0.245, -0.052], mover: { kind: 'swing', axis: 'x', amount: -100 } });
    b.pair((s) => b.box([0.04, 0.03, 0.012], [s * 0.12, 0.25, 0.054], { color: 'gold', round: 0.2, parent: 'lid' }));
    path(b, arc(0, 0.335, 0.07, 0.055, 0, 180, 5), 0.022, 'darkbrown', { parent: 'lid' });
    return b.act({ click: [[A.say('Click, click!', 1), A.operate('lid', 'open')], [A.operate('lid', 'close')]] }).done();
  }),
  // A shop till: keys, a customer display on a post, a receipt slot and a cash drawer that shoots out.
  e('cash register', 'tech', 'shop machines', () => {
    const b = m('cash register', { edge: 'sharp' })
      .box([0.42, 0.1, 0.4], [0, 0.05, 0], { color: 'gray', round: 0.1 })
      .box([0.4, 0.08, 0.36], [0, 0.05, 0.03], { color: '#b0b4b8', round: 0.1, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.22 } })
      .box([0.2, 0.025, 0.02], [0, 0.05, 0.215], { color: 'darkgray', round: 0.3, parent: 'drawer' })
      .box([0.4, 0.12, 0.28], [0, 0.16, -0.04], { color: 'silver', round: 0.15 })
      .stick([0, 0.22, -0.13], [0, 0.32, -0.13], 0.04, 'darkgray')
      .box([0.22, 0.09, 0.05], [0, 0.35, -0.13], { color: 'darkgray', round: 0.2 })
      .box([0.18, 0.05, 0.01], [0, 0.35, -0.1], { color: 'lime', glow: true })
      .box([0.07, 0.06, 0.004], [0.14, 0.25, -0.12], { color: 'white' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b.box([0.05, 0.02, 0.04], [-0.11 + c * 0.065, 0.225, 0.04 - r * 0.055], { color: c === 3 ? 'red' : 'white', round: 0.3 });
    return b.act({ click: [[A.operate('drawer', 'out'), A.say('Ka-ching!', 1.5)], [A.operate('drawer', 'in')]] }).done();
  }),
  e('cashew', 'food', 'nuts', () => {
    const b = m('cashew');
    path(b, arc(0, 0.048, 0.028, 0.028, 195, 345, 4), 0.026, '#efd9a8');
    return b.ball(0.028, [-0.027, 0.04, 0], { color: '#efd9a8' }).ball(0.026, [0.027, 0.04, 0], { color: '#efd9a8' }).act({ click: [A.par(A.anim('hop'), A.say('Crunch!', 1))] }).done();
  }),
  // A casino: a maroon-and-gold facade with a marquee of chasing bulbs, a star sign, a canopy over the doors and
  // two giant dice on the roof that roll.
  e('casino', 'places', 'entertainment', () => {
    const b = m('casino', { edge: 'sharp' })
      .box([18, 8, 12], [0, 4, 0], { color: '#7a1f2e', round: 0.01 })
      .box([18.4, 0.6, 12.4], [0, 8.2, 0], { color: '#e2b23a', round: 0.1 })
      .box([12, 2.4, 0.4], [0, 6.6, 6.2], { color: '#2a2726', round: 0.1 })
      .label('CASINO', [9, 1.6], [0, 6.6, 6.42], { color: '#e2b23a', depth: 0.05 })
      .box([8, 0.4, 3.5], [0, 3.4, 7.7], { color: '#e2b23a', round: 0.1 })
      .box([6, 2.6, 0.1], [0, 1.4, 6.02], { color: '#2a2726' })
      .box([2.6, 2.4, 0.06], [-1.35, 1.3, 6.08], { color: '#e2b23a', name: 'doorL', pivot: [-2.65, 1.3, 6.08], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([2.6, 2.4, 0.06], [1.35, 1.3, 6.08], { color: '#e2b23a', name: 'doorR', pivot: [2.65, 1.3, 6.08], mover: { kind: 'swing', axis: 'y', amount: 90 } })
      .star(2.2, [0, 9.9, 5.5], { color: '#f6d24a', glow: true });
    b.pair((s) => {
      b.box([0.3, 3.3, 0.3], [s * 3.8, 1.65, 9.2], { color: '#e2b23a' });
      b.each(2, (i) => b.box([2.4, 2.6, 0.06], [s * (5.2 + i * 2.6), 1.6, 6.02], { color: '#3a2a4a' }));
    });
    b.each(14, (i) => b.ball(0.28, [-6.5 + i * 1.0, 5.15, 6.25], { color: i % 2 ? '#fff1b8' : '#ffb02e', glow: true, name: `bulb${i}`, mover: { kind: 'light', on: true } }));
    const die = (n: string, x: number, z: number, ry: number) => {
      b.box([2.4, 2.4, 2.4], [x, 9.7, z], { color: 'white', round: 0.2, rot: [0, ry, 0], name: n });
      for (const [dx, dy] of [[-0.6, 0.6], [0, 0], [0.6, -0.6], [-0.6, -0.6], [0.6, 0.6]]) {
        const c = Math.cos(ry * RAD), sn = Math.sin(ry * RAD);
        b.ball([0.36, 0.36, 0.08], [x + dx * c + 1.21 * sn, 9.7 + dy, z - dx * sn + 1.21 * c], { color: '#c0362c', rot: [0, ry, 0], noInk: true, parent: n });
      }
    };
    die('die1', -5.5, 2, 20);
    die('die2', 5.5, 1.5, -25);
    return b
      .act({
        click: [
          [A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.wait(0.3), A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.par(A.say('Jackpot! Ding ding ding!', 2), A.effect('sparkle', { dur: 1.5 }))],
          [A.par(A.pose('die1', { rot: [360, 180, 0], dur: 1.2 }), A.pose('die2', { rot: [0, 90, 360], dur: 1.2 }), A.say('Roll the dice!', 1.5)), A.par(A.pose('die1', { rot: [0, 0, 0], dur: 0.01 }), A.pose('die2', { rot: [0, 0, 0], dur: 0.01 }))],
        ],
      })
      .done();
  }),
  // A glazed stoneware casserole dish (30 x 20 cm) fresh from the oven on a cork trivet: a crisp dish with a rolled
  // lip and lug handles, a soft golden cheesy top with browned patches and bubbles, and a serving spoon dug in. It
  // steams and bubbles.
  e('casserole', 'kitchen', 'cookware', () => {
    const glaze = '#cf5528';
    const b = m('casserole', { edge: 'sharp' })
      .box([0.34, 0.012, 0.24], [0, 0.006, 0], { color: 'tan', round: 0.3 })
      .box([0.3, 0.06, 0.2], [0, 0.042, 0], { color: glaze, round: 0.35 })
      .box([0.316, 0.012, 0.216], [0, 0.068, 0], { color: glaze, round: 0.6 })
      .box([0.282, 0.022, 0.182], [0, 0.072, 0], { color: '#eab54f', round: 0.9, edge: 'soft' });
    b.pair((s) => b.box([0.036, 0.014, 0.12], [s * 0.168, 0.066, 0], { color: glaze, round: 0.7 }));
    for (const [x, z, w] of [[-0.09, 0.04, 0.05], [0.04, -0.05, 0.06], [0.1, 0.045, 0.04], [-0.04, -0.03, 0.035], [-0.11, -0.05, 0.03]]) b.ball([w, 0.008, w * 0.7], [x, 0.0815, z], { color: '#b5702c', noInk: true, edge: 'soft' });
    [[-0.02, 0.05], [0.07, -0.01], [-0.08, -0.01]].forEach(([x, z], i) => b.ball([0.022, 0.012, 0.022], [x, 0.083, z], { color: '#f6d77e', name: `bub${i + 1}`, edge: 'soft' }));
    // the serving spoon, its bowl sunk in the top and the handle over the front corner
    b.ball([0.05, 0.012, 0.065], [0.06, 0.082, 0.03], { color: 'silver', rot: [0, 35, 0] })
      .rod([0.075, 0.084, 0.055], [0.19, 0.125, 0.15], 0.012, 'silver');
    const pop = (n: number, d: number, k: number) => A.pose(`bub${n}`, { scale: k, dur: d, times: 3 });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Blub, blub, blub...', 2), pop(1, 0.3, 1.8), pop(2, 0.22, 1.6), pop(3, 0.36, 2))] }).done();
  }),
  // An audio cassette: its two reels turn when it plays.
  e('cassette', 'music', 'audio gear', () => {
    const b = m('cassette', { edge: 'sharp' })
      .box([0.1, 0.064, 0.012], [0, 0.032, 0], { color: 'black', round: 0.15 })
      .box([0.086, 0.034, 0.002], [0, 0.04, 0.007], { color: 'white' })
      .box([0.042, 0.014, 0.002], [0, 0.038, 0.0085], { color: '#5c4030' })
      .box([0.086, 0.007, 0.002], [0, 0.052, 0.0085], { color: 'red', noInk: true })
      .box([0.06, 0.012, 0.004], [0, 0.008, 0.006], { color: 'darkgray', round: 0.2 });
    b.pair((s) => {
      b.torus([0.017, 0.017, 0.004], [s * 0.021, 0.038, 0.009], { color: 'white', tube: 0.3, name: `reel${s > 0 ? 'L' : 'R'}`, mover: { kind: 'spin', axis: 'z', amount: -300 } });
      b.box([0.004, 0.012, 0.003], [s * 0.021, 0.038, 0.01], { color: 'white', parent: `reel${s > 0 ? 'L' : 'R'}`, noInk: true });
    });
    return b.act({ click: [[A.operate('reel', 'on'), A.say('♪ La la la ♪', 2)], [A.operate('reel', 'off'), A.say('Clunk.', 0.8)]] }).done();
  }),
  // A forearm in a plaster cast signed by friends; the fingers wiggle.
  e('cast', 'clinic', 'medical', () => {
    const P = diag(-0.13, 0.045, 30);
    const b = m('cast')
      .rod(P(0), P(0.21), 0.08, 'white')
      .ball([0.06, 0.07, 0.045], P(0.26), { color: 'skin2', rot: [0, 0, -60], name: 'hand', pivot: P(0.22) })
      .rod(P(0.24, 0.03), P(0.27, 0.05), 0.016, 'skin2', { parent: 'hand' });
    b.each(4, (i) => b.rod(P(0.28, -0.022 + i * 0.013), P(0.32, -0.022 + i * 0.013), 0.013, 'skin2', { parent: 'hand' }));
    for (const [t, o, c] of [[0.05, 0.02, 'red'], [0.1, -0.01, 'blue'], [0.15, 0.025, 'green']] as const) b.box([0.04, 0.008, 0.004], P(t, o, 0.039), { color: c, rot: [0, 0, 30 + (t * 300) % 40], noInk: true });
    b.heart(0.025, P(0.12, 0.02, 0.04), { color: 'pink', noInk: true });
    return b.act({ click: [A.pose('hand', { rot: [0, 0, 20], dur: 0.2 }), A.pose('hand', { rot: [0, 0, -15], dur: 0.2 }), A.pose('hand', { rot: [0, 0, 0], dur: 0.2 }), A.say('So itchy!', 1.2)] }).done();
  }),
  // A stone castle at real size: curtain walls with battlements round a courtyard, four round corner towers with
  // conical roofs, a tall square keep, a gatehouse with a portcullis that rises and a drawbridge over the moat.
  e('castle', 'places', 'landmarks', () => {
    const S = '#a7a39a', D = '#8f8b84';
    const b = m('castle', { edge: 'sharp' })
      .box([40, 0.2, 40], [0, 0.1, 0], { color: 'grass', round: 0.02 })
      .box([12, 22, 12], [0, 11, -4], { color: D, round: 0.01 })
      .pyramid([13 * Math.SQRT2, 6, 13 * Math.SQRT2], [0, 25, -4], 4, { color: '#2f4f8f' })
      .stick([0, 28, -4], [0, 32, -4], 0.15, 'darkgray')
      .wedge([2.4, 1.5, 0.05], [1.2, 31.2, -4], { color: '#c0362c', rot: [0, 0, -90] });
    b.pair((s) => {
      b.box([1.6, 9, 28], [s * 14, 4.7, 0], { color: S, round: 0.01 });
      b.box([28, 9, 1.6], [0, 4.7, s * 14], { color: S, round: 0.01 });
      b.box([4.2, 0.8, 40], [s * 18, 0.25, 0], { color: 'water', round: 0.1, edge: 'soft' });
      b.each(7, (i) => b.box([1.3, 1.2, 1.8], [s * 14, 9.8, -12 + i * 4], { color: S }));
      for (const z of [-14, 14]) {
        b.cyl([6, 14, 6], [s * 14, 7.2, z], { color: S, segs: 14 });
        b.cyl([6.6, 0.8, 6.6], [s * 14, 14.6, z], { color: D, segs: 14 });
        b.cone([7, 6, 7], [s * 14, 18, z], { color: '#2f4f8f', segs: 14 });
        b.box([0.5, 1.4, 0.2], [s * 14, 9, z + 3.0], { color: '#2a2726' });
      }
      b.box([4, 13, 5], [s * 4, 6.7, 14], { color: D });
      b.each(2, (i) => b.box([1.3, 1.2, 1.3], [s * (3 + i * 1.8), 13.8, 16], { color: D }));
    });
    b.each(7, (i) => {
      b.box([1.8, 1.2, 1.3], [-12 + i * 4, 9.8, -14], { color: S });
      if (Math.abs(-12 + i * 4) > 4) b.box([1.8, 1.2, 1.3], [-12 + i * 4, 9.8, 14], { color: S });
    });
    b.box([40, 0.8, 4.2], [0, 0.25, 18], { color: 'water', round: 0.1, edge: 'soft' })
      .box([40, 0.8, 4.2], [0, 0.25, -18], { color: 'water', round: 0.1, edge: 'soft' })
      .box([4, 4, 5], [0, 11, 14], { color: D })
      .box([3.6, 5, 0.3], [0, 2.5, 16.4], { color: '#1e1e1e' })
      .box([3.4, 4.8, 0.2], [0, 2.5, 16.2], { color: 'iron', name: 'portcullis', mover: { kind: 'slide', axis: 'y', amount: 4.4 } })
      .box([3.6, 4.6, 0.35], [0, 2.6, 16.9], { color: 'darkwood', name: 'drawbridge', pivot: [0, 0.3, 16.9], mover: { kind: 'swing', axis: 'x', amount: 88 } })
      .label('WELCOME', [2.6, 0.5], [0, 3.6, 17.1], { color: 'darkwood', parent: 'drawbridge', depth: 0.05 });
    b.each(3, (i) => b.box([0.08, 4.6, 0.1], [-1.2 + i * 1.2, 2.5, 16.05], { color: '#3a3d41', parent: 'portcullis' }));
    return b.act({ click: [[A.operate('drawbridge', 'open'), A.operate('portcullis', 'up'), A.say('Creeeak... clank!', 2)], [A.operate('portcullis', 'down'), A.operate('drawbridge', 'close'), A.say('Boom.', 1)]] }).done();
  }),
  e('cat ears', 'wardrobe', 'costume', () => {
    const b = m('cat ears');
    path(b, arc(0, 0.01, 0.09, 0.1, 10, 170, 6), 0.016, 'black');
    b.pair((s) => {
      const n = s > 0 ? 'earL' : 'earR';
      b.wedge([0.065, 0.075, 0.024], [s * 0.048, 0.125, 0], { color: 'black', rot: [0, 0, s * -15], name: n, pivot: [s * 0.048, 0.09, 0] }).wedge([0.035, 0.045, 0.01], [s * 0.047, 0.118, 0.013], { color: 'pink', rot: [0, 0, s * -15], noInk: true, parent: n });
    });
    return b.act({ click: [A.pose('earL', { rot: [0, 40, 0], dur: 0.15 }), A.pose('earL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('earR', { rot: [0, -40, 0], dur: 0.15 }), A.pose('earR', { rot: [0, 0, 0], dur: 0.15 }), A.say('Mew!', 1)] }).done();
  }),
  // A bag of cat food with a cat on it beside a bowl of kibble; the bag tips and rattles.
  e('cat food', 'pets', 'pet food', () => {
    const b = m('cat food')
      .box([0.16, 0.22, 0.07], [0, 0.11, -0.03], { color: 'purple', round: 0.3, name: 'bag', pivot: [0.08, 0, -0.03] })
      .box([0.16, 0.02, 0.03], [0, 0.23, -0.03], { color: 'purple', round: 0.2, parent: 'bag' })
      .label('CAT FOOD', [0.12, 0.04], [0, 0.18, 0.01], { color: 'yellow', parent: 'bag', depth: 0.004 })
      .ball([0.07, 0.06, 0.02], [0, 0.1, 0.007], { color: 'orange', parent: 'bag' })
      .cyl([0.1, 0.035, 0.1], [0.1, 0.0175, 0.08], { color: 'red', taper: 1.3 });
    b.pair((s) => b.wedge([0.025, 0.03, 0.015], [s * 0.022, 0.14, 0.006], { color: 'orange', parent: 'bag' }).ball(0.008, [s * 0.015, 0.105, 0.017], { color: 'black', noInk: true, parent: 'bag' }));
    around(6, 0.03).forEach(([x, z]) => b.ball(0.018, [0.1 + x, 0.04, 0.08 + z], { color: 'brown' }));
    b.ball(0.02, [0.1, 0.045, 0.08], { color: 'brown' });
    return b.act({ click: [A.pose('bag', { rot: [0, 0, -35], dur: 0.4 }), A.say('Rattle rattle!', 1.2), A.pose('bag', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A CT scanner: a deep white gantry ring with a lit bore and a padded table that slides the patient in.
  e('cat scan machine', 'clinic', 'hospital machines', () =>
    m('cat scan machine', { edge: 'sharp' })
      .box([2.2, 0.3, 1.0], [0, 0.15, -0.4], { color: 'lightgray', round: 0.2 })
      .torus([2.2, 2.2, 0.95], [0, 1.15, -0.4], { color: 'white', tube: 0.36, edge: 'soft' })
      .torus([1.42, 1.42, 0.97], [0, 1.15, -0.4], { color: '#8fd0f0', tube: 0.06, noInk: true, glow: true, name: 'ring', mover: { kind: 'light' } })
      .label('CT', [0.4, 0.25], [0, 2.0, 0.09], { color: 'white', depth: 0.01 })
      .box([0.5, 0.62, 1.3], [0, 0.31, 1.2], { color: 'lightgray', round: 0.2 })
      .box([0.55, 0.12, 2.3], [0, 0.69, 0.75], { color: '#e6e9ec', round: 0.4, name: 'table', mover: { kind: 'slide', axis: 'z', amount: -1.2 } })
      .box([0.45, 0.06, 1.9], [0, 0.77, 0.8], { color: 'skyblue', round: 0.5, edge: 'soft', parent: 'table' })
      .box([0.35, 0.1, 0.25], [0, 0.84, 1.7], { color: 'white', round: 0.6, edge: 'soft', parent: 'table' })
      .box([0.4, 0.3, 0.05], [0.8, 1.9, 0.1], { color: '#2a2726' })
      .box([0.34, 0.22, 0.02], [0.8, 1.9, 0.13], { color: '#6fd3e8', glow: true })
      .socket('bed', [0, 0.8, 0.9], 'top', { part: 'table', size: 1.8 })
      .act({ click: [[A.operate('table', 'out'), A.operate('ring', 'on'), A.say('Whirrr... beep. Hold still!', 2.5)], [A.operate('ring', 'off'), A.operate('table', 'in')]] })
      .done(),
  ),
  // A ginger cat's tail with a white tip: it swishes.
  e('cat tail (tail)', 'pets', 'body parts', () => {
    const b = m('cat tail (tail)').ball([0.07, 0.04, 0.06], [0, 0.02, 0], { color: 'orange', name: 'tail', pivot: [0, 0.02, 0] });
    const pts: V[] = [[0, 0.02, 0], [0.03, 0.07, 0], [0.025, 0.12, 0], [-0.015, 0.17, 0], [-0.01, 0.22, 0], [0.025, 0.25, 0]];
    pts.forEach((p, i) => i < pts.length - 1 && b.rod(p, pts[i + 1], 0.036, i % 2 ? '#c8681e' : 'orange', { parent: 'tail' }));
    b.ball(0.036, [0.025, 0.25, 0], { color: 'white', parent: 'tail' });
    return b.act({ click: [A.pose('tail', { rot: [0, 0, 25], dur: 0.3 }), A.pose('tail', { rot: [0, 0, -25], dur: 0.4 }), A.pose('tail', { rot: [0, 0, 15], dur: 0.35 }), A.pose('tail', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A 12 m cruising catamaran (6.9 m beam, mast 16.5 m above the water): two slim moulded hulls (bottom-cut lofts
  // that lift at the bow and the transom) with a dark strip of hull windows, a bridgedeck between them, a
  // crisp deck saloon with wraparound windows and a hardtop that runs back over the cockpit (a person stands under
  // it), the helm wheel, a dark trampoline net between the bows on a crossbeam, and a deck-stepped mast with
  // shrouds and forestay, a triangular mainsail on a boom that swings and a jib. Wedges here are [base along the
  // boat, height, thickness] turned edge-on (rot y 90), so the sails are real triangles.
  e('catamaran', 'garage', 'boats', () => {
    const hull: Array<[number, number, number, number]> = [[0, 0.86, 0.76, 0], [0.06, 0.97, 0.92, 0], [0.62, 1, 1, 0], [0.86, 0.8, 0.9, 0], [0.97, 0.3, 0.76, 0], [1, 0.1, 0.7, 0]];
    const b = m('catamaran', { view: 'side' });
    b.pair((s) => {
      const hn = `hull${s > 0 ? 'L' : 'R'}`;
      b.loft([1.4, 3.2, 11.8], [s * 2.75, 1.6, 0], hull, { color: 'white', cut: 'bottom', boxy: 0.55, name: hn, edge: 'soft' });
      // the long dark strip of hull windows along the straight middle of each hull
      b.box([1.43, 0.26, 5.6], [s * 2.75, 1.08, -1.4], { color: '#2f3d52', round: 0.3, edge: 'sharp', noInk: true });
      // hardtop posts at the back of the cockpit, shrouds out to the hulls
      b.stick([s * 2.7, 1.55, -5.0], [s * 2.7, 3.42, -5.0], 0.09, 'silver');
      b.stick([s * 0.06, 16.3, 1.2], [s * 3.3, 1.6, 0.9], 0.025, '#5c6166');
    });
    // bridgedeck, saloon, hardtop
    b.box([6.8, 0.4, 7.4], [0, 1.35, -1.6], { color: 'white', round: 0.1, edge: 'sharp' })
      .box([5.6, 1.85, 4.2], [0, 2.47, -0.1], { color: 'white', round: 0.08, edge: 'sharp' })
      .box([5.64, 0.72, 3.7], [0, 2.82, -0.1], { color: '#2f3d52', round: 0.1, edge: 'sharp' })
      .box([5.1, 0.72, 0.06], [0, 2.8, 2.02], { color: '#2f3d52', rot: [-12, 0, 0], round: 0.1, edge: 'sharp' })
      .box([1.7, 1.75, 0.06], [0.9, 2.45, -2.22], { color: '#3d5a73', round: 0.1, edge: 'sharp' })
      .box([5.7, 0.16, 7.2], [0, 3.48, -1.55], { color: 'white', round: 0.3, edge: 'sharp' })
      // cockpit: bench across the back, table, helm wheel on its pedestal
      .box([4.6, 0.45, 0.6], [0, 1.78, -4.85], { color: 'white', round: 0.3, edge: 'sharp' })
      .box([4.6, 0.12, 0.62], [0, 2.06, -4.85], { color: '#c9a36a', round: 0.3, edge: 'sharp' })
      .box([1.4, 0.06, 0.9], [0, 2.3, -3.6], { color: '#c9a36a', round: 0.3, edge: 'sharp' })
      .stick([0, 1.55, -3.6], [0, 2.28, -3.6], 0.1, 'silver')
      .box([0.35, 1.0, 0.35], [-2.5, 2.05, -2.7], { color: 'white', round: 0.3, edge: 'sharp' })
      .torus([0.7, 0.7, 0.05], [-2.5, 2.75, -2.95], { color: 'silver', rot: [-15, 0, 0], tube: 0.1, edge: 'sharp' })
      // trampoline between the bows, front crossbeam
      .box([4.1, 0.04, 3.4], [0, 1.5, 3.95], { color: '#2a2726', round: 0, edge: 'sharp', noInk: true })
      .box([5.6, 0.2, 0.28], [0, 1.5, 5.55], { color: '#c9ccd1', round: 0.3, edge: 'sharp' })
      // mast on the saloon roof, boom, sails, forestay
      .stick([0, 3.55, 1.2], [0, 16.5, 1.2], 0.22, 'silver')
      .stick([0, 4.3, 1.2], [0, 4.3, -5.0], 0.14, 'silver', { name: 'boom', pivot: [0, 4.3, 1.2], mover: { kind: 'swing', axis: 'y', amount: 30 } })
      .wedge([6.1, 11.8, 0.05], [0, 10.3, -1.85], { color: 'white', rot: [0, 90, 0], apex: -0.5, parent: 'boom', edge: 'sharp' })
      .box([0.07, 0.06, 6.0], [0, 4.38, -1.85], { color: '#1f3b66', parent: 'boom', edge: 'sharp' })
      .wedge([4.3, 11.2, 0.04], [0, 7.45, 3.55], { color: '#d8ecf8', rot: [0, 90, 0], apex: 0.45, edge: 'sharp' })
      .stick([0, 16.3, 1.2], [0, 1.6, 5.55], 0.03, '#5c6166')
      .socket('deck', [0, 1.6, -3.0], 'top', { size: 2 })
      .socket('helm', [-2.0, 1.95, -3.4], 'seat');
    return b.act({ click: [[A.operate('boom', 'out'), A.par(A.effect('water_spray', { dur: 1.5 }), A.anim('wobble'))], [A.operate('boom', 'in')]] }).done();
  }),
  // A siege catapult at real size: a wheeled timber frame, an A-frame with a padded crossbar, a twisted-rope
  // torsion bundle and a 3.3 m throwing arm with a bucket holding a stone. It flings the stone; click again to
  // wind it back and load another.
  e('catapult', 'armory', 'siege', () => {
    const b = m('catapult', { view: 'side', edge: 'sharp' })
      .stick([-0.75, 1.0, -0.4], [0.75, 1.0, -0.4], 0.45, '#c9b28a', { edge: 'soft' })
      .rod([0, 1.0, -0.4], [0, 1.8, -3.6], 0.2, 'darkwood', { name: 'arm', pivot: [0, 1.0, -0.4], mover: { kind: 'swing', axis: 'x', amount: 75 } })
      .cyl([0.7, 0.35, 0.7], [0, 1.95, -3.6], { color: 'darkwood', parent: 'arm', rot: [-14, 0, 0], taper: 1.3 })
      .ball(0.5, [0, 2.15, -3.6], { color: 'stone', name: 'stone', parent: 'arm', piece: true, edge: 'soft' })
      .box([2.0, 0.3, 0.3], [0, 0.75, 1.9], { color: 'wood' })
      .box([2.0, 0.3, 0.3], [0, 0.75, -1.9], { color: 'wood' })
      .box([2.2, 0.35, 0.4], [0, 3.0, 0.75], { color: 'wood' })
      .box([1.2, 0.45, 0.45], [0, 3.0, 0.5], { color: '#8a5a35', edge: 'soft' })
      .stick([-0.9, 0.75, 1.4], [0.9, 0.75, 1.4], 0.12, 'iron')
      .stick([-0.9, 0.75, -1.4], [0.9, 0.75, -1.4], 0.12, 'iron');
    b.pair((s) => {
      b.box([0.28, 0.32, 4.2], [s * 0.85, 0.75, 0], { color: 'wood' });
      b.rod([s * 0.85, 0.9, -0.6], [s * 0.9, 3.0, 0.75], 0.2, 'wood');
      b.rod([s * 0.85, 0.9, 1.8], [s * 0.9, 3.0, 0.75], 0.2, 'wood');
      b.box([0.1, 0.5, 0.1], [s * 0.85, 1.0, -0.4], { color: 'iron' });
      for (const z of [1.4, -1.4]) spoked(b, s * 1.12, 0.5, z, 1.0, 'darkwood', 6, `wheel${s > 0 ? 'L' : 'R'}${z > 0 ? 'f' : 'b'}`);
    });
    return b
      .act({ click: [[A.par(A.operate('arm', 'on'), A.say('Whoosh!', 1)), A.detach('stone', 'stone'), A.move('stone', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' })], [A.operate('arm', 'off'), A.say('Creak, creak...', 1.2), A.reattach('stone')]] })
      .done();
  }),
  // A Gothic cathedral at park size (46 m to the spires): a long nave with lancet windows and buttresses, a
  // transept, a round apse, a crossing spire, and a west front with twin towers, a rose window and a pointed portal
  // whose doors open. (The vocabulary's 1 m is a toy; a cathedral is this big, so the size warning stays.)
  e('cathedral', 'places', 'religious', () => {
    const S = '#cfc8b8', R = '#5e6a78';
    const b = m('cathedral', { edge: 'sharp' })
      .box([12, 18, 40], [0, 9, -6], { color: S, round: 0.01 })
      .wedge([12.6, 7, 40.6], [0, 21.5, -6], { color: R })
      .box([34, 16, 10], [0, 8, -10], { color: S, round: 0.01 })
      .wedge([10.6, 6, 34.6], [0, 19, -10], { color: R, rot: [0, 90, 0] })
      .cyl([12, 16, 12], [0, 8, -26], { color: S, segs: 10 })
      .cone([12.8, 7, 12.8], [0, 19.5, -26], { color: R, segs: 10 })
      .box([4, 4, 4], [0, 26, -10], { color: S })
      .pyramid([4.5, 14, 4.5], [0, 35, -10], 8, { color: R })
      .box([20, 22, 6], [0, 11, 16], { color: S, round: 0.01 })
      .torus([6.4, 6.4, 0.6], [0, 15, 19.05], { color: '#a39c8e', tube: 0.12 })
      .cyl([5.6, 0.3, 5.6], [0, 15, 19.0], { color: '#3f5fa8', rot: [90, 0, 0], glow: true, name: 'rose', mover: { kind: 'light' } })
      .arc([5.2, 7.5, 0.8], [0, 3.6, 19.1], { color: '#a39c8e', tube: 0.18 })
      .box([1.7, 5.5, 0.2], [-0.86, 2.75, 19.05], { color: '#5a3a22', name: 'doorL', pivot: [-1.72, 2.75, 19.05], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([1.7, 5.5, 0.2], [0.86, 2.75, 19.05], { color: '#5a3a22', name: 'doorR', pivot: [1.72, 2.75, 19.05], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .box([3.8, 2.6, 0.18], [0, 6.1, 19.0], { color: '#5a3a22' });
    b.pair((s) => {
      b.box([7, 32, 7], [s * 7.5, 16, 16], { color: S, round: 0.01 });
      b.pyramid([7.4, 14, 7.4], [s * 7.5, 39, 16], 8, { color: R });
      b.box([1.4, 6, 0.2], [s * 7.5, 22, 19.55], { color: '#2f3d52' });
      b.box([1.4, 4, 0.2], [s * 7.5, 10, 19.55], { color: '#2f3d52' });
      b.each(6, (i) => {
        const z = -22 + i * 5.6;
        b.box([0.3, 7, 1.6], [s * 6.05, 10, z + 2.8], { color: '#3f5fa8' });
        b.box([1.6, 14, 1.8], [s * 7.6, 7, z], { color: S });
        b.rod([s * 7.6, 14, z], [s * 6.2, 17, z], 0.6, S);
        b.pyramid([1.8, 3, 1.8], [s * 7.6, 15.5, z], 4, { color: R });
      });
      b.box([0.3, 6, 2], [s * 17.05, 8, -10], { color: '#3f5fa8' });
    });
    return b
      .act({ click: [[A.operate('door', 'open'), A.say('Bong... bong... bong...', 3), A.wait(2.5), A.operate('door', 'close')], [A.operate('rose'), A.effect('sparkle', { dur: 1.5 })]] })
      .done();
  }),
  // A pot of catnip: square stems, soft grey-green leaves and lilac flower spikes. Cats love it.
  e('catnip', 'garden', 'herbs', () => {
    const b = m('catnip')
      .cyl([0.14, 0.11, 0.14], [0, 0.055, 0], { color: '#c8673a', taper: 1.2 })
      .cyl([0.15, 0.015, 0.15], [0, 0.105, 0], { color: 'dirt' })
      .ball(0.03, [0, 0.13, 0], { color: '#7fae58', name: 'top', pivot: [0, 0.11, 0] });
    around(5, 0.04, 0.3).forEach(([x, z], i) => {
      const top: V = [x * 1.8, 0.24 + (i % 2) * 0.04, z * 1.8];
      b.rod([x, 0.11, z], top, 0.008, 'green', { parent: 'top' });
      b.ball([0.05, 0.012, 0.04], [x * 1.5, 0.19, z * 1.5], { color: '#8ab07a', rot: [0, i * 70, 20], parent: 'top' });
      if (i % 2) b.capsule([0.022, 0.05, 0.022], [top[0], top[1] + 0.025, top[2]], { color: '#c8a8e8', parent: 'top' });
      else b.ball([0.05, 0.012, 0.04], top, { color: '#8ab07a', rot: [0, i * 50, -20], parent: 'top' });
    });
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 12], dur: 0.4 }), A.effect('hearts', { dur: 1.5 })), A.pose('top', { rot: [0, 0, -8], dur: 0.4 }), A.pose('top', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A full-size cattle crossing warning sign: a yellow diamond with a black border and a cow on a 2.4 m post.
  e('cattle crossing sign', 'ideas', 'road signs', () => {
    const b = m('cattle crossing sign', { edge: 'sharp' })
      .stick([0, 0, 0], [0, 2.4, 0], 0.07, 'gray')
      .box([0.78, 0.78, 0.025], [0, 2.0, 0.04], { color: 'black', rot: [0, 0, 45], round: 0.1 })
      .box([0.72, 0.72, 0.03], [0, 2.0, 0.045], { color: 'yellow', rot: [0, 0, 45], round: 0.1 })
      .box([0.34, 0.15, 0.01], [-0.03, 2.0, 0.065], { color: 'black', round: 0.4, noInk: true })
      .box([0.1, 0.1, 0.01], [0.17, 2.06, 0.065], { color: 'black', round: 0.4, noInk: true })
      .box([0.06, 0.06, 0.01], [0.05, 1.93, 0.066], { color: 'white', round: 0.4, noInk: true });
    for (const x of [-0.17, -0.11, 0.05, 0.11]) b.box([0.035, 0.12, 0.01], [x, 1.88, 0.065], { color: 'black', noInk: true });
    b.pair((s) => b.box([0.015, 0.045, 0.01], [0.17 + s * 0.045, 2.13, 0.065], { color: 'black', rot: [0, 0, s * -30], noInk: true }));
    b.box([0.012, 0.1, 0.01], [-0.21, 1.97, 0.065], { color: 'black', rot: [0, 0, -25], noInk: true });
    return b.act({ click: [A.par(A.anim('wobble'), A.say('Moooo!', 1.5))] }).done();
  }),
  // A witch's iron cauldron on three legs, bubbling with green potion.
  e('cauldron', 'fantasy', 'witch things', () => {
    const b = m('cauldron')
      .ball([0.44, 0.34, 0.44], [0, 0.22, 0], { color: '#2a2726' })
      .torus([0.38, 0.38, 0.05], [0, 0.36, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.34, 0.02, 0.34], [0, 0.355, 0], { color: 'lime', glow: true })
      .ball(0.06, [0.05, 0.38, 0.04], { color: 'lime', name: 'bubble' })
      .ball(0.04, [-0.07, 0.375, -0.02], { color: 'lime' })
      .ball(0.035, [0.02, 0.43, 0.0], { color: '#c6f58f', parent: 'bubble' });
    b.pair((s) => b.torus([0.08, 0.08, 0.02], [s * 0.21, 0.3, 0], { color: 'iron', rot: [0, 90, 0], tube: 0.2 }));
    around(3, 0.14, 0.5).forEach(([x, z]) => b.rod([x, 0.08, z], [x * 1.2, 0.0, z * 1.2], 0.04, '#2a2726'));
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.effect('sparkle', { dur: 1.5 }), A.pose('bubble', { move: [0, 0.08, 0], scale: 1.5, dur: 0.6 }), A.say('Bubble, bubble, toil and trouble!', 2.5)), A.pose('bubble', { move: [0, 0, 0], scale: 1, dur: 0.4 })] }).done();
  }),
  // A cauliflower: a creamy curd in a cup of green leaves; a floret breaks off.
  e('cauliflower', 'food', 'vegetables', () => {
    const b = m('cauliflower').cyl([0.06, 0.06, 0.06], [0, 0.03, 0], { color: '#d8e6b0', name: 'stem' });
    around(6, 0.085).forEach(([x, z], i) => b.ball([0.12, 0.17, 0.04], [x, 0.1, z], { color: 'leaf', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, 0] }).ball(0.075, [x * 0.8, 0.16, z * 0.8], { color: 'cream', ...(i === 1 ? { name: 'floret', parent: 'stem', piece: true } : {}) }));
    return b.ball([0.15, 0.12, 0.15], [0, 0.18, 0], { color: 'cream' }).ball(0.08, [0, 0.22, 0], { color: 'cream' }).act({ click: [[A.detach('floret', 'floret')], [A.reattach('floret')]] }).done();
  }),
  // A yellow wet-floor A-frame sign; it wobbles over a splash.
  e('caution sign', 'ideas', 'signs', () =>
    m('caution sign', { edge: 'sharp' })
      .box([0.3, 0.6, 0.02], [0, 0.3, 0.055], { color: 'yellow', rot: [-10, 0, 0], round: 0.2 })
      .box([0.3, 0.6, 0.02], [0, 0.3, -0.055], { color: 'yellow', rot: [10, 0, 0], round: 0.2 })
      .box([0.3, 0.05, 0.06], [0, 0.6, 0], { color: 'yellow', round: 0.5 })
      .label('CAUTION', [0.25, 0.07], [0, 0.47, 0.085], { color: 'yellow', rot: [-10, 0, 0], depth: 0.004 })
      .label('WET FLOOR', [0.24, 0.05], [0, 0.12, 0.05], { color: 'yellow', rot: [-10, 0, 0], depth: 0.004 })
      .wedge([0.17, 0.15, 0.006], [0, 0.27, 0.083], { color: 'black', rot: [-10, 0, 0] })
      .wedge([0.12, 0.1, 0.006], [0, 0.26, 0.086], { color: 'yellow', rot: [-10, 0, 0] })
      .box([0.014, 0.05, 0.006], [0, 0.27, 0.089], { color: 'black', rot: [-10, 0, 0] })
      .act({ click: [A.par(A.anim('wobble', 2), A.effect('water_spray', { dur: 1 }), A.say('Squeak!', 1))] })
      .done(),
  ),
  // A roll of yellow-and-black hazard tape with a length run out; the roll spins as it unrolls.
  e('caution tape', 'workshop', 'construction', () => {
    const b = m('caution tape')
      .cyl([0.12, 0.05, 0.12], [0, 0.06, 0], { color: 'yellow', rot: [90, 0, 0], name: 'roll' })
      .cyl([0.05, 0.052, 0.05], [0, 0.06, 0], { color: 'cream', rot: [90, 0, 0], parent: 'roll' })
      .cyl([0.034, 0.054, 0.034], [0, 0.06, 0], { color: 'darkgray', rot: [90, 0, 0], parent: 'roll' })
      .box([0.26, 0.004, 0.05], [0.16, 0.002, 0], { color: 'yellow' });
    b.each(5, (i) => b.box([0.014, 0.003, 0.06], [0.07 + i * 0.045, 0.005, 0], { color: 'black', rot: [0, 40, 0], noInk: true }));
    b.each(4, (i) => b.box([0.012, 0.03, 0.003], [Math.cos(i * 1.57) * 0.035, 0.06 + Math.sin(i * 1.57) * 0.035, 0.026], { color: 'black', rot: [0, 0, i * 90 + 45], noInk: true, parent: 'roll' }));
    return b.act({ click: [A.par(A.pose('roll', { rot: [0, 0, -720], dur: 1.2 }), A.say('Zzzzip!', 1.2)), A.pose('roll', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  // A cave in a rocky hillside: a dark mouth tall enough to walk into, stalactites, moss on top, and two eyes that
  // glow in the dark when you look in.
  e('cave', 'nature', 'landforms', () => {
    const b = m('cave')
      .ball([9, 5.2, 7], [0, 2.0, -1.0], { color: 'rock' })
      .ball([4, 3.2, 3.6], [-3.2, 1.3, 1.0], { color: 'stone' })
      .ball([3.6, 2.8, 3.4], [3.3, 1.1, 1.1], { color: '#8a857c' })
      .ball([2.8, 3.0, 1.6], [0, 1.2, 2.2], { color: '#1e1a19' })
      .ball([3.0, 0.4, 2.4], [-1.0, 4.4, -0.4], { color: '#6f8f4a', noInk: true })
      .ball([2.0, 0.3, 1.6], [2.4, 3.4, 0.4], { color: '#6f8f4a', noInk: true })
      .ball([1.2, 0.8, 1.0], [2.0, 0.35, 3.2], { color: 'rock' });
    b.each(4, (i) => b.cone([0.22, 0.5, 0.22], [-0.75 + i * 0.5, 2.45 - (i % 2) * 0.15, 2.85], { color: 'stone', rot: [180, 0, 0] }));
    b.pair((s) => b.ball([0.14, 0.09, 0.05], [s * 0.18, 1.4, 2.95], { color: '#ffd24a', glow: true, name: `eye${s > 0 ? 'L' : 'R'}`, scale: 0 }));
    const eyes = (k: number) => A.par(A.pose('eyeL', { scale: k, dur: 0.2 }), A.pose('eyeR', { scale: k, dur: 0.2 }));
    return b.act({ click: [eyes(1), A.say('Grrr...', 1.5), A.wait(1.2), eyes(0), A.par(A.effect('dust', { dur: 1.5 }), A.say('...echo... echo...', 2))] }).done();
  }),
  // A tin of caviar on ice with a mother-of-pearl spoon that scoops.
  e('caviar', 'food', 'seafood', () => {
    const b = m('caviar')
      .cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'navy' })
      .cyl([0.102, 0.008, 0.102], [0, 0.026, 0], { color: 'gold' })
      .cyl([0.092, 0.008, 0.092], [0, 0.031, 0], { color: 'black' })
      .cyl([0.1, 0.01, 0.1], [0, 0.07, -0.065], { color: 'gold', rot: [-70, 0, 0] })
      .stick([0.03, 0.04, 0.02], [0.1, 0.06, 0.05], 0.006, 'cream', { name: 'spoon', pivot: [0.1, 0.06, 0.05] })
      .ball([0.022, 0.008, 0.03], [0.025, 0.04, 0.015], { color: 'cream', rot: [0, 60, 0], parent: 'spoon' });
    around(7, 0.028).forEach(([x, z]) => b.ball(0.012, [x, 0.037, z], { color: '#1e1c1c' }));
    return b.act({ click: [A.pose('spoon', { rot: [0, 0, -30], dur: 0.4 }), A.say('Ooh, fancy!', 1.2), A.pose('spoon', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A CD jewel case: the lid swings open on its hinge to show the disc.
  e('cd case', 'music', 'audio gear', () =>
    m('cd case', { edge: 'sharp' })
      .box([0.125, 0.124, 0.006], [0, 0.062, -0.004], { color: '#2a2726', round: 0.1 })
      .cyl([0.11, 0.003, 0.11], [0.006, 0.062, 0.0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.03, 0.004, 0.03], [0.006, 0.062, 0.001], { color: 'white', rot: [90, 0, 0] })
      .box([0.125, 0.124, 0.006], [0, 0.062, 0.006], { color: 'glass', round: 0.1, name: 'lid', pivot: [-0.062, 0.062, 0.006], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .box([0.112, 0.116, 0.002], [0.005, 0.062, 0.009], { color: 'purple', parent: 'lid' })
      .ball([0.05, 0.05, 0.002], [0.01, 0.07, 0.0105], { color: 'yellow', noInk: true, parent: 'lid' })
      .box([0.01, 0.124, 0.014], [-0.058, 0.062, 0.001], { color: 'black' })
      .act({ click: [[A.operate('lid', 'open'), A.say('Click!', 0.8)], [A.operate('lid', 'close')]] })
      .done(),
  ),
  // A ceiling fan with its mount and downrod (hung here at display height): five wooden blades on a motor that
  // spins, and a frosted light underneath.
  e('ceiling fan', 'home', 'lighting', () => {
    const b = m('ceiling fan')
      .cyl([0.14, 0.04, 0.14], [0, 0.52, 0], { color: 'white', edge: 'sharp' })
      .stick([0, 0.5, 0], [0, 0.3, 0], 0.025, 'white')
      .cyl([0.22, 0.1, 0.22], [0, 0.26, 0], { color: 'white', name: 'blades', mover: { kind: 'spin', axis: 'y', amount: 240, on: true } })
      .dome([0.18, 0.1, 0.18], [0, 0.12, 0], { color: 'cream', rot: [180, 0, 0] })
      .ball(0.1, [0, 0.13, 0], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light', on: true } });
    around(5, 0.42, 0.4).forEach(([x, z]) => b.box([0.6, 0.012, 0.14], [x, 0.25, z], { color: 'wood', rot: [0, (-Math.atan2(z, x) * 180) / Math.PI, 10], parent: 'blades', round: 0.4, edge: 'sharp' }));
    return b.act({ click: [[A.operate('blades'), A.say('Whirr...', 1)], [A.operate('lamp')]] }).done();
  }),
  // A bunch of celery: pale ribbed stalks with leafy tops; one stalk snaps off.
  e('celery', 'food', 'vegetables', () => {
    const b = m('celery').cyl([0.075, 0.03, 0.06], [0, 0.015, 0], { color: '#dbe8a8', name: 'base' });
    ([[-0.025, 0], [0, 0.012], [0.025, 0], [-0.012, -0.012], [0.012, -0.012]] as const).forEach(([x, z], i) => {
      const top: V = [x * 2.2, 0.24 + (i % 3) * 0.015, z * 2];
      b.rod([x, 0.02, z], top, 0.026, '#a8d26a', i === 1 ? { name: 'stalk', parent: 'base', piece: true } : {}).ball([0.05, 0.045, 0.04], [top[0], top[1] + 0.02, top[2]], { color: 'leaf', ...(i === 1 ? { parent: 'stalk' } : {}) });
    });
    return b.act({ click: [[A.detach('stalk', 'stalk'), A.say('Crunch!', 1)], [A.reattach('stalk')]] }).done();
  }),
  // A stone cellar, open at the front like a stage set: a brick barrel vault, steps up to a door, wine racks,
  // barrels on a cradle and a hanging lantern.
  e('cellar', 'places', 'rooms', () => {
    const b = m('cellar', { edge: 'sharp' })
      .box([5, 0.12, 5], [0, 0.06, 0], { color: '#8a857c' })
      .box([5, 2.0, 0.3], [0, 1.0, -2.4], { color: '#9a958c' })
      .box([0.3, 2.0, 5], [-2.4, 1.0, 0], { color: '#9a958c' })
      .box([0.3, 2.0, 5], [2.4, 1.0, 0], { color: '#9a958c' })
      .box([0.9, 1.5, 0.08], [1.6, 1.88, -2.2], { color: 'darkwood', name: 'door', pivot: [1.15, 1.88, -2.2], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .ball([0.16, 0.24, 0.16], [0, 2.45, 0.3], { color: '#fff1b8', glow: true, name: 'lantern', mover: { kind: 'light', on: true } })
      .stick([0, 2.6, 0.3], [0, 2.85, 0.3], 0.02, 'iron');
    const vault: V[] = Array.from({ length: 9 }, (_, i) => [2.45 * Math.cos((i * Math.PI) / 8), 2.0 + 0.95 * Math.sin((i * Math.PI) / 8), 0]);
    vault.forEach((p, i) => i && b.box([Math.hypot(p[0] - vault[i - 1][0], p[1] - vault[i - 1][1]) + 0.06, 0.22, 5], [(p[0] + vault[i - 1][0]) / 2, (p[1] + vault[i - 1][1]) / 2, 0], { color: '#a0523d', rot: [0, 0, Math.atan2(p[1] - vault[i - 1][1], p[0] - vault[i - 1][0]) / RAD] }));
    b.each(5, (i) => b.box([1.2, 0.22, 0.35], [1.6, 0.17 + i * 0.22, -0.5 - i * 0.35], { color: '#7a756c' }));
    b.box([0.4, 1.8, 2.2], [-2.0, 0.95, -0.6], { color: 'darkwood' });
    b.each(4, (i) => b.each(3, (j) => b.cyl([0.09, 0.42, 0.09], [-1.95, 0.35 + i * 0.42, -1.3 + j * 0.6], { color: '#2f5a3a', rot: [0, 0, 90] })));
    b.box([1.6, 0.25, 0.8], [-0.2, 0.25, 1.2], { color: 'darkwood' });
    barrel(b, -0.6, 1.2, 0.7, 0.9, true);
    barrel(b, 0.3, 1.2, 0.7, 0.9, true);
    barrel(b, 0.6, -1.4, 0.75, 1.0, false);
    return b.act({ click: [[A.operate('lantern')], [A.operate('door', 'open'), A.say('Creeeak...', 1.5), A.wait(1.5), A.operate('door', 'close')]] }).done();
  }),
  // A cello, 1.25 m on its endpin: a spruce front with deep curved bouts, f-holes, bridge, black fingerboard,
  // four strings, pegs and the scroll. It hums.
  e('cello', 'music', 'strings', () => {
    const W = '#a0522d';
    const b = m('cello')
      .stick([0, 0.22, 0], [0, 0.0, 0.03], 0.014, 'silver')
      .ball([0.46, 0.4, 0.22], [0, 0.4, 0], { color: W })
      .ball([0.3, 0.24, 0.2], [0, 0.58, 0], { color: W })
      .ball([0.38, 0.34, 0.21], [0, 0.75, 0], { color: W })
      .box([0.07, 0.42, 0.055], [0, 1.08, -0.005], { color: '#6b3a20', edge: 'sharp' })
      .box([0.055, 0.66, 0.016], [0, 0.97, 0.11], { color: '#1e1e1e', edge: 'sharp' })
      .box([0.055, 0.13, 0.05], [0, 1.33, 0], { color: '#6b3a20', edge: 'sharp' })
      .torus([0.07, 0.08, 0.04], [0, 1.43, 0.0], { color: '#6b3a20', rot: [0, 90, 0], tube: 0.4 })
      .box([0.07, 0.16, 0.014], [0, 0.32, 0.105], { color: '#1e1e1e', round: 0.5 })
      .box([0.09, 0.03, 0.025], [0, 0.48, 0.108], { color: 'lightwood', edge: 'sharp' });
    b.pair((s) => b.box([0.012, 0.12, 0.006], [s * 0.075, 0.5, 0.102], { color: '#1e1e1e', rot: [0, 0, s * 8], noInk: true }).cyl([0.012, 0.06, 0.012], [s * 0.045, 1.32, 0], { color: '#2a2726', rot: [0, 0, 90] }));
    b.each(4, (i) => b.stick([-0.015 + i * 0.01, 0.3, 0.115], [-0.009 + i * 0.006, 1.26, 0.115], 0.002, 'silver', { noInk: true }));
    return b.act({ click: [A.par(A.anim('wobble'), A.say('♪ Hmmmmmm ♪', 2.5))] }).done();
  }),
  // A box of cling film with its cutting edge; a sheet pulls out and tears off.
  e('cellophane', 'kitchen', 'kitchen wraps', () =>
    m('cellophane')
      .box([0.34, 0.07, 0.07], [0, 0.035, 0], { color: 'blue', round: 0.1, edge: 'sharp' })
      .box([0.34, 0.01, 0.075], [0, 0.064, -0.004], { color: 'blue', rot: [-15, 0, 0], round: 0.1, edge: 'sharp' })
      .cyl([0.045, 0.3, 0.045], [0, 0.065, 0.02], { color: '#dff3fb', rot: [0, 0, 90] })
      .box([0.28, 0.004, 0.08], [0, 0.05, 0.08], { color: '#dff3fb', rot: [20, 0, 0], name: 'sheet' })
      .label('WRAP', [0.12, 0.035], [0.06, 0.028, 0.036], { color: 'white', depth: 0.003 })
      .act({ click: [A.pose('sheet', { move: [0, -0.02, 0.12], dur: 0.5 }), A.say('Rrrrip!', 1), A.pose('sheet', { move: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A glazed stoneware vase with bands of colour; it turns as if on the potter's wheel.
  e('ceramic', 'home', 'pottery', () =>
    m('ceramic')
      .cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'teal', name: 'vase' })
      .ball([0.17, 0.15, 0.17], [0, 0.09, 0], { color: 'teal', parent: 'vase' })
      .cyl([0.06, 0.07, 0.06], [0, 0.18, 0], { color: 'teal', taper: 1.4, parent: 'vase' })
      .torus([0.085, 0.085, 0.012], [0, 0.215, 0], { color: 'teal', rot: [90, 0, 0], tube: 0.18, parent: 'vase' })
      .torus([0.172, 0.172, 0.03], [0, 0.09, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.1, noInk: true, parent: 'vase' })
      .torus([0.155, 0.155, 0.012], [0, 0.125, 0], { color: 'navy', rot: [90, 0, 0], tube: 0.08, noInk: true, parent: 'vase' })
      .ball([0.03, 0.04, 0.01], [0.04, 0.12, 0.07], { color: 'white', noInk: true, parent: 'vase' })
      .act({ click: [A.par(A.pose('vase', { rot: [0, 720, 0], dur: 1.6 }), A.say('Whirrr...', 1.5)), A.pose('vase', { rot: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A bowl of cereal hoops in milk with a spoon that scoops.
  e('cereal', 'food', 'breakfast', () => {
    const b = bowl(m('cereal'), 0.18, 0.08, 'yellow', 'milk')
      .stick([0.03, 0.08, 0.02], [0.1, 0.17, 0.04], 0.012, 'silver', { name: 'spoon', pivot: [0.06, 0.1, 0.03] })
      .ball([0.035, 0.012, 0.045], [0.025, 0.08, 0.015], { color: 'silver', parent: 'spoon' });
    [...around(7, 0.055), [0, 0] as [number, number]].forEach(([x, z], i) => b.torus([0.025, 0.025, 0.009], [x, 0.082, z], { color: ['orange', 'honey', 'red'][i % 3], rot: [80, i * 20, 0], tube: 0.3 }));
    return b.act({ click: [A.pose('spoon', { rot: [0, 0, -25], move: [0, 0.03, 0], dur: 0.4 }), A.say('Crunch, crunch!', 1.2), A.pose('spoon', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A cereal box: a mascot bowl on the front, a top flap that opens; it rattles as it pours.
  e('cereal box', 'food', 'breakfast', () =>
    pack('cereal box', [0.2, 0.3, 0.07], 'orange', 'CEREAL', 'yellow')
      .ball([0.1, 0.05, 0.01], [0, 0.07, 0.036], { color: 'white', noInk: true })
      .ball([0.02, 0.012, 0.004], [-0.02, 0.09, 0.04], { color: 'honey', noInk: true })
      .ball([0.02, 0.012, 0.004], [0.02, 0.092, 0.04], { color: 'honey', noInk: true })
      .ball([0.02, 0.012, 0.004], [0.0, 0.098, 0.04], { color: 'red', noInk: true })
      .box([0.2, 0.005, 0.07], [0, 0.302, 0], { color: 'orange', round: 0.1, name: 'flap', pivot: [0, 0.302, -0.035], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .act({ click: [A.operate('flap', 'open'), A.par(A.set({ tilt: 35, dur: 0.4 }), A.say('Rattle, rattle!', 1.5)), A.set({ tilt: 0, dur: 0.4 }), A.operate('flap', 'close')] })
      .done(),
  ),
  // A heavy steel chain hanging from a hook, its end coiled on the ground; it rattles.
  e('chain (tool)', 'workshop', 'hardware', () => {
    const b = m('chain (tool)', { edge: 'sharp' }).ball([0.3, 0.07, 0.25], [0, 0.035, 0], { color: 'steel', edge: 'soft' });
    around(6, 0.09).forEach(([x, z], i) => b.torus([0.05, 0.08, 0.016], [x, 0.07, z], { color: 'steel', rot: [90, i * 40, 0], tube: 0.28 }));
    b.each(13, (i) => b.torus([0.05, 0.085, 0.016], [0.03, 0.12 + i * 0.068, 0], { color: 'steel', rot: [0, i % 2 ? 90 : 0, 0], tube: 0.28 }));
    return path(b, [[0.03, 0.98, 0], ...arc(0.06, 1.06, 0.03, 0.04, 180, 0, 4), [0.09, 1.03, 0]], 0.016, 'iron').act({ click: [A.par(A.anim('shake'), A.say('Clink, clank!', 1.2))] }).done();
  }),
  // A run of chain-link fence (4 m) on galvanised posts with a top rail, diamond mesh and a gate that swings.
  e('chain link fence', 'workshop', 'fencing', () => {
    const b = m('chain link fence', { edge: 'sharp' });
    for (const x of [-2, 0, 1.1, 2]) b.stick([x, 0, 0], [x, 1.85, 0], 0.07, 'silver').cyl([0.22, 0.12, 0.22], [x, 0.06, 0], { color: 'stone' }).ball(0.09, [x, 1.86, 0], { color: 'silver' });
    b.stick([-2, 1.78, 0], [0, 1.78, 0], 0.045, 'silver').stick([1.1, 1.78, 0], [2, 1.78, 0], 0.045, 'silver');
    const mesh = (x0: number, x1: number, y0: number, y1: number, po: PartOpts = {}) => {
      for (let c = x0 - (y1 - y0); c < x1; c += 0.18)
        for (const dir of [1, -1]) {
          const t0 = Math.max(0, x0 - c), t1 = Math.min(y1 - y0, x1 - c);
          if (t1 <= t0) continue;
          b.stick([c + t0, dir > 0 ? y0 + t0 : y1 - t0, 0], [c + t1, dir > 0 ? y0 + t1 : y1 - t1, 0], 0.012, 'steel', { noInk: true, ...po });
        }
    };
    mesh(-1.97, -0.03, 0.08, 1.75);
    mesh(1.13, 1.97, 0.08, 1.75);
    b.box([0.95, 0.05, 0.05], [0.55, 1.7, 0.06], { color: 'silver', name: 'gate', pivot: [0.04, 1.0, 0.06], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.95, 0.05, 0.05], [0.55, 0.12, 0.06], { color: 'silver', parent: 'gate' })
      .box([0.05, 1.6, 0.05], [1.0, 0.9, 0.06], { color: 'silver', parent: 'gate' })
      .box([0.05, 1.6, 0.05], [0.1, 0.9, 0.06], { color: 'silver', parent: 'gate' });
    mesh(0.13, 0.97, 0.15, 1.67, { parent: 'gate' });
    return b.act({ click: [[A.operate('gate', 'open'), A.say('Creak...', 1)], [A.operate('gate', 'close'), A.say('Clang!', 1)]] }).done();
  }),
  // A mail shirt (hauberk) of riveted steel rings hung on a wooden armour stand.
  e('chainmail', 'armory', 'armour', () => {
    const b = m('chainmail')
      .box([0.5, 0.05, 0.4], [0, 0.025, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.05, 0], [0, 1.45, 0], 0.05, 'darkwood')
      .stick([-0.25, 1.38, 0], [0.25, 1.38, 0], 0.05, 'darkwood')
      .box([0.46, 0.72, 0.24], [0, 1.02, 0], { color: 'steel', round: 0.3, name: 'shirt' })
      .ball([0.16, 0.06, 0.12], [0, 1.38, 0], { color: 'darkgray', parent: 'shirt' })
      .box([0.48, 0.06, 0.26], [0, 0.66, 0], { color: '#7a838c', round: 0.4, parent: 'shirt' });
    b.pair((s) => b.box([0.16, 0.28, 0.2], [s * 0.3, 1.24, 0], { color: 'steel', rot: [0, 0, s * 30], round: 0.4, parent: 'shirt' }));
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) b.torus([0.05, 0.05, 0.01], [-0.16 + c * 0.08 + (r % 2) * 0.04, 0.72 + r * 0.1, 0.122], { color: 'silver', tube: 0.2, noInk: true, parent: 'shirt' });
    return b.act({ click: [A.par(A.anim('shake'), A.say('Jingle, jangle!', 1.5), A.effect('sparkle', { dur: 0.8 }))] }).done();
  }),
  // A petrol chainsaw: an orange engine body with a pull cord and hand guard, a guide bar with the chain.
  e('chainsaw', 'workshop', 'power tools', () => {
    const b = m('chainsaw', { edge: 'sharp' })
      .box([0.22, 0.16, 0.12], [-0.06, 0.09, 0], { color: 'orange', round: 0.3 })
      .box([0.12, 0.08, 0.125], [-0.03, 0.12, 0], { color: 'darkgray', round: 0.3 })
      .box([0.42, 0.064, 0.008], [0.25, 0.08, 0], { color: 'darkgray', round: 0.6 })
      .box([0.4, 0.05, 0.012], [0.25, 0.08, 0], { color: 'silver', round: 0.6, name: 'chain' })
      .box([0.015, 0.14, 0.13], [0.06, 0.15, 0], { color: 'black', round: 0.3 })
      .box([0.08, 0.03, 0.04], [-0.2, 0.06, 0], { color: 'black', round: 0.4 })
      .ball(0.025, [-0.16, 0.12, 0.065], { color: 'black' });
    path(b, arc(-0.06, 0.16, 0.09, 0.08, 0, 180, 5), 0.024, 'black');
    return b.act({ click: [A.par(A.anim('shake', 4), A.effect('smoke', { dur: 2 }), A.say('Brrrm! Vrrrrrrm!', 2))] }).done();
  }),
  // A real dining chair: seat at 0.45 m with a cushion, square legs with stretchers, a slatted back to 0.92 m.
  // Someone sits down on it and likes it.
  e('chair', 'home', 'seating', () => {
    const b = m('chair', { edge: 'sharp' })
      .box([0.46, 0.05, 0.44], [0, 0.43, 0], { color: 'wood', round: 0.15 })
      .box([0.42, 0.05, 0.4], [0, 0.475, 0.01], { color: '#c0362c', round: 0.6, edge: 'soft' })
      .box([0.44, 0.1, 0.04], [0, 0.86, -0.2], { color: 'darkwood', round: 0.3 });
    b.pair((s) => {
      b.box([0.04, 0.42, 0.04], [s * 0.2, 0.21, 0.19], { color: 'darkwood' });
      b.box([0.04, 0.92, 0.04], [s * 0.2, 0.46, -0.2], { color: 'darkwood' });
      b.box([0.025, 0.025, 0.36], [s * 0.2, 0.14, 0], { color: 'darkwood' });
    });
    b.each(3, (i) => b.box([0.035, 0.34, 0.02], [-0.09 + i * 0.09, 0.64, -0.2], { color: 'darkwood' }));
    return b
      .socket('seat', [0, 0.5, 0.02], 'seat')
      .act({ click: [A.spawn('sitter', 'man'), A.attach('sitter', 'self', 'seat'), A.par(A.anim('thumbs_up', 1, 'sitter'), A.say('Comfy!', 1.8, 'sitter')), A.wait(0.8), A.remove('sitter', 'fade')] })
      .done();
  }),
  // A Victorian chaise longue: a long buttoned seat at 0.42 m, a scrolled end that rises to 0.85 m, a half back,
  // a bolster and turned legs. The cat claims it.
  e('chaise lounge', 'home', 'seating', () => {
    const T = '#3f8a82';
    const b = m('chaise lounge', { view: 'side' })
      .box([0.72, 0.18, 1.75], [0, 0.33, 0.05], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .box([0.7, 0.14, 1.7], [0, 0.45, 0.05], { color: T, round: 0.5 })
      .box([0.7, 0.55, 0.28], [0, 0.66, -0.68], { color: T, rot: [-22, 0, 0], round: 0.5 })
      .capsule([0.24, 0.74, 0.24], [0, 0.95, -0.8], { color: T, rot: [0, 0, 90] })
      .box([0.12, 0.35, 0.9], [0.31, 0.68, -0.3], { color: T, round: 0.6 })
      .capsule([0.16, 0.5, 0.16], [0, 0.6, -0.45], { color: 'cream', rot: [0, 0, 90] });
    b.each(4, (i) => b.ball(0.025, [-0.2 + i * 0.13, 0.52, 0.0 + (i % 2) * 0.3], { color: '#2f6a62', noInk: true }));
    for (const x of [-0.28, 0.28]) for (const z of [-0.65, 0.82]) b.cone([0.08, 0.24, 0.08], [x, 0.12, z], { color: 'darkwood', rot: [180, 0, 0], edge: 'sharp' });
    return b
      .socket('seat', [0, 0.52, 0.35], 'seat')
      .act({ click: [A.spawn('cat', 'cat'), A.attach('cat', 'self', 'seat'), A.say('Purrr...', 2, 'cat'), A.wait(1.5), A.remove('cat', 'fade')] })
      .done();
  }),
  // Lumps of natural chalk; a flake crumbles off in a puff of white dust.
  e('chalk (material)', 'nature', 'rocks', () =>
    m('chalk (material)')
      .ball([0.13, 0.08, 0.1], [0, 0.04, 0], { color: '#f4f2ea', name: 'lump' })
      .ball([0.08, 0.065, 0.075], [0.07, 0.035, 0.02], { color: '#ebe8de' })
      .ball([0.05, 0.035, 0.04], [-0.07, 0.02, 0.04], { color: '#f4f2ea', name: 'flake', parent: 'lump', piece: true })
      .ball([0.03, 0.02, 0.02], [0.02, 0.078, 0.02], { color: '#dcd8cc', noInk: true })
      .act({ click: [[A.par(A.effect('dust', { dur: 1.2 }), A.detach('flake', 'flake'))], [A.reattach('flake')]] })
      .done(),
  ),
  // A box of school chalk with coloured sticks; one hops out and squeaks.
  e('chalk (writing)', 'study', 'school supplies', () => {
    const b = m('chalk (writing)').box([0.1, 0.04, 0.06], [0, 0.02, -0.01], { color: 'blue', round: 0.15, edge: 'sharp' }).stick([-0.03, 0.006, 0.06], [0.05, 0.006, 0.045], 0.012, 'pink');
    ['white', 'yellow', 'pink', 'white'].forEach((c, i) => b.cyl([0.012, 0.08, 0.012], [-0.03 + i * 0.02, 0.06, -0.01], { color: c, ...(i === 1 ? { name: 'stick' } : {}) }));
    return b.act({ click: [A.pose('stick', { move: [0, 0.06, 0], dur: 0.3 }), A.par(A.effect('dust', { dur: 0.8 }), A.say('Squeak!', 1)), A.pose('stick', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A school blackboard on an A-frame stand (board top at 1.8 m): a chalk tray, a felt eraser and a sum chalked
  // on it. The eraser wipes it clean; click again and it is written back.
  e('chalkboard', 'study', 'classroom', () => {
    const b = m('chalkboard', { edge: 'sharp' })
      .box([1.28, 0.94, 0.035], [0, 1.33, -0.005], { color: 'wood', round: 0.2 })
      .box([1.2, 0.86, 0.04], [0, 1.33, 0], { color: '#2f5d40', round: 0.05 })
      .box([1.2, 0.03, 0.08], [0, 0.88, 0.05], { color: 'wood' })
      .box([0.07, 0.015, 0.015], [0.3, 0.9, 0.06], { color: 'white' })
      .box([0.14, 0.04, 0.06], [-0.35, 0.92, 0.05], { color: '#5a3a22', name: 'eraser' })
      .label('2 + 2 = 4', [0.8, 0.22], [0, 1.45, 0.025], { color: '#2f5d40', depth: 0.004, name: 'writing' })
      .label('ABC', [0.5, 0.16], [-0.2, 1.17, 0.025], { color: '#2f5d40', depth: 0.004, parent: 'writing' });
    b.pair((s) => {
      b.box([0.06, 1.8, 0.06], [s * 0.6, 0.9, 0.04], { color: 'wood', rot: [-6, 0, 0] });
      b.box([0.06, 1.7, 0.06], [s * 0.6, 0.85, -0.14], { color: 'wood', rot: [8, 0, 0] });
    });
    return b
      .act({ click: [[A.pose('eraser', { move: [0.2, 0.55, 0.02], dur: 0.4 }), A.par(A.pose('eraser', { move: [0.6, 0.4, 0.02], dur: 0.8 }), A.pose('writing', { scale: 0, dur: 0.8 }), A.effect('dust', { dur: 1 })), A.pose('eraser', { move: [0, 0, 0], dur: 0.4 })], [A.say('Scritch, scratch...', 1.5), A.pose('writing', { scale: 1, dur: 0.8 })]] })
      .done();
  }),
  // A brass chandelier hung from a ceiling rose: six curved arms with candle bulbs, drops of crystal. The lights
  // switch; click again and it sways and tinkles.
  e('chandelier', 'home', 'lighting', () => {
    const b = m('chandelier')
      .cyl([0.18, 0.04, 0.18], [0, 1.0, 0], { color: 'brass', edge: 'sharp', name: 'body', pivot: [0, 1.0, 0] })
      .stick([0, 0.98, 0], [0, 0.72, 0], 0.025, 'brass', { parent: 'body' })
      .ball([0.16, 0.24, 0.16], [0, 0.62, 0], { color: 'brass', parent: 'body' })
      .ball([0.08, 0.12, 0.08], [0, 0.44, 0], { color: 'glass', parent: 'body' });
    around(6, 0.36).forEach(([x, z], i) => {
      path(b, [[x * 0.15, 0.6, z * 0.15], [x * 0.55, 0.5, z * 0.55], [x, 0.52, z]], 0.025, 'brass', { parent: 'body' });
      b.cyl([0.06, 0.02, 0.06], [x, 0.53, z], { color: 'brass', parent: 'body' })
        .cyl([0.03, 0.09, 0.03], [x, 0.585, z], { color: 'white', parent: 'body' })
        .ball([0.03, 0.05, 0.03], [x, 0.655, z], { color: '#fff1b8', glow: true, parent: 'body', name: `light${i}`, mover: { kind: 'light', on: true } });
      b.ball([0.03, 0.06, 0.03], [x * 0.6, 0.43, z * 0.6], { color: 'glass', parent: 'body' });
      b.ball([0.025, 0.05, 0.025], [x, 0.47, z], { color: 'glass', parent: 'body' });
    });
    return b
      .act({ click: [[A.operate('light')], [A.par(A.pose('body', { rot: [0, 0, 8], dur: 0.4 }), A.say('Tinkle, tinkle...', 1.8)), A.pose('body', { rot: [0, 0, -6], dur: 0.6 }), A.pose('body', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done();
  }),
  // A nursery changing table: a chest of three drawers with a padded changing mat, guard rails on three sides and
  // a stack of nappies. The top drawer slides out.
  e('changing table', 'home', 'nursery', () => {
    const b = m('changing table', { edge: 'sharp' })
      .box([1.0, 0.85, 0.5], [0, 0.425, 0], { color: 'white', round: 0.05 })
      .box([0.86, 0.08, 0.46], [0, 0.89, 0.0], { color: '#f4a1c0', round: 0.6, edge: 'soft' })
      .box([1.0, 0.12, 0.03], [0, 0.95, -0.235], { color: 'white' })
      .box([1.0, 0.06, 0.03], [0, 0.92, 0.235], { color: 'white' });
    b.pair((s) => b.box([0.03, 0.12, 0.5], [s * 0.485, 0.95, 0], { color: 'white' }));
    b.each(3, (i) => {
      const n = i === 2 ? 'drawer' : `front${i}`;
      b.box([0.9, 0.22, 0.04], [0, 0.15 + i * 0.25, 0.245], { color: '#a8d8f5', round: 0.2, ...(i === 2 ? { name: n, mover: { kind: 'slide', axis: 'z', amount: 0.3 } } : { name: n }) });
      b.ball(0.04, [0, 0.15 + i * 0.25, 0.27], { color: 'white', parent: n });
    });
    b.each(3, (i) => b.box([0.16, 0.035, 0.12], [0.33, 0.95 + i * 0.036, 0.0], { color: 'white', round: 0.6, edge: 'soft' }));
    return b.socket('mat', [-0.1, 0.94, 0], 'top', { size: 0.7 }).act({ click: [[A.operate('drawer', 'out'), A.say('Fresh nappies!', 1.5)], [A.operate('drawer', 'in')]] }).done();
  }),
  // A heap of charcoal briquettes, a few glowing hot; it smoulders and smokes.
  e('charcoal', 'kitchen', 'grilling', () => {
    const b = m('charcoal');
    const pts: Array<[number, number, number]> = [...around(6, 0.065).map(([x, z]) => [x, 0.02, z] as [number, number, number]), [0, 0.02, 0], ...around(4, 0.035, 0.6).map(([x, z]) => [x, 0.05, z] as [number, number, number]), [0, 0.08, 0]];
    pts.forEach(([x, y, z], i) => b.ball([0.06, 0.036, 0.05], [x, y, z], { color: i === 3 || i === 9 ? '#e8662a' : i % 2 ? '#3a3633' : '#2a2726', rot: [i * 20, i * 50, 0], ...(i === 3 || i === 9 ? { glow: true, name: `ember${i}` } : {}) }));
    return b.act({ click: [A.par(A.effect('smoke', { dur: 2 }), A.pose('ember3', { scale: 1.3, dur: 0.5 }), A.pose('ember9', { scale: 1.3, dur: 0.5 }), A.say('Sizzle, crackle...', 2)), A.par(A.pose('ember3', { scale: 1, dur: 0.6 }), A.pose('ember9', { scale: 1, dur: 0.6 }))] }).done();
  }),
  // A wall plug charger with a cable and phone plug; its little light shows it is charging.
  e('charger (electronics)', 'tech', 'cables', () => {
    const b = m('charger (electronics)', { edge: 'sharp' }).box([0.045, 0.045, 0.045], [0, 0.0225, 0], { color: 'white', round: 0.25 }).box([0.014, 0.008, 0.026], [0.14, 0.006, 0.03], { color: 'silver' });
    b.ball(0.006, [0.012, 0.035, 0.023], { color: 'lime', glow: true, name: 'led', mover: { kind: 'light' } });
    b.pair((s) => b.stick([s * 0.009, 0.045, 0], [s * 0.009, 0.068, 0], 0.005, 'silver'));
    path(b, [[0.02, 0.006, 0], [0.06, 0.004, 0.025], [0.1, 0.004, -0.01], [0.13, 0.004, 0.03]], 0.006, 'white');
    return b.act({ click: [[A.operate('led', 'on'), A.say('Bzzt... charging!', 1.5)], [A.operate('led', 'off')]] }).done();
  }),
  // A Roman racing chariot at real size: a light D-shaped car whose floor is 0.7 m up (a 1.7 m driver stands in it
  // and the curved front comes to his waist), a red-painted breastwork in one curved sheet with a gilded rim and a
  // gold medallion, low side panels sloping down to the open back with gilded handrails, two 0.95 m eight-spoked
  // wheels on an iron axle under the back of the car with linchpins, and the draught pole curving forward and up to
  // the yoke with its two neck saddles for the horses. Wood and metal, so crisp edges. The wheels spin in a cloud of
  // dust.
  e('chariot', 'garage', 'horse-drawn', () => {
    const red = '#a3322a', gold = '#e2b23a', fy = 0.7, fz = 0.05, R = 0.56, wall = 0.82;
    const b = m('chariot', { view: 'side', edge: 'sharp' })
      // D-shaped floor: a box at the back and a half disc at the front, on two runners
      .box([2 * R, 0.07, 0.5], [0, fy - 0.035, fz - 0.25], { color: 'wood', round: 0.2 })
      .cyl([2 * R, 0.07, 1.1], [0, fy - 0.035, fz], { color: 'wood' })
      .box([0.08, 0.1, 1.1], [0.35, fy - 0.12, 0.05], { color: 'darkwood', round: 0.2 })
      .box([0.08, 0.1, 1.1], [-0.35, fy - 0.12, 0.05], { color: 'darkwood', round: 0.2 })
      // the breastwork: one curved sheet round the front, a gilded rim along its top, a medallion
      .arc([2 * R + 0.06, 2 * R + 0.06, wall], [0, fy + wall / 2, fz], { color: red, rot: [90, 0, 0], arc: 180, tube: 0.07 })
      .arc([2 * R + 0.1, 2 * R + 0.1, 0.07], [0, fy + wall, fz], { color: gold, rot: [90, 0, 0], arc: 180, tube: 0.1 })
      .arc([2 * R + 0.1, 2 * R + 0.1, 0.05], [0, fy + 0.05, fz], { color: gold, rot: [90, 0, 0], arc: 180, tube: 0.08 })
      .cyl([0.34, 0.04, 0.34], [0, fy + 0.45, fz + R + 0.03], { color: gold, rot: [90, 0, 0] })
      .star(0.2, [0, fy + 0.45, fz + R + 0.06], { color: '#f6d77a' })
      // iron axle under the back of the car, the pole curving up to the yoke
      .stick([-0.92, 0.47, -0.2], [0.92, 0.47, -0.2], 0.07, 'iron')
      .rod([0, fy - 0.14, 0.4], [0, 0.72, 1.4], 0.11, 'darkwood')
      .rod([0, 0.72, 1.4], [0, 1.1, 2.4], 0.1, 'darkwood')
      .rod([0, 1.1, 2.4], [0, 1.22, 2.75], 0.09, 'darkwood')
      .stick([-0.75, 1.24, 2.7], [0.75, 1.24, 2.7], 0.09, 'darkwood')
      .socket('car', [0, fy + 0.02, -0.12], 'top', { size: 0.8 });
    b.pair((s) => {
      // low side panel from the end of the breastwork back to the open rear, a gilded handrail along its top edge
      b.wedge([0.5, wall, 0.03], [s * R, fy + wall / 2, fz - 0.25], { color: red, rot: [0, 90, 0], apex: -0.5 });
      b.rod([s * R, fy + wall, fz], [s * R, fy + 0.2, fz - 0.5], 0.045, gold);
      b.stick([s * R, fy, fz - 0.5], [s * R, fy + 0.2, fz - 0.5], 0.04, gold);
      // wheel with an iron tyre, linchpin through the hub
      spoked(b, s * 0.82, 0.47, -0.2, 0.95, 'darkwood', 8, `wheel${s > 0 ? 'L' : 'R'}`);
      b.torus([0.97, 0.97, 0.06], [s * 0.82, 0.47, -0.2], { color: 'iron', rot: [0, 90, 0], tube: 0.05, parent: `wheel${s > 0 ? 'L' : 'R'}` });
      b.stick([s * 0.93, 0.36, -0.2], [s * 0.93, 0.58, -0.2], 0.035, 'iron');
      // neck saddles hanging under the yoke
      b.arc([0.36, 0.3, 0.07], [s * 0.42, 1.1, 2.7], { color: 'darkwood', arc: 180, tube: 0.2 });
    });
    return b
      .act({
        click: [A.par(A.pose('wheelL', { rot: [720, 0, 0], dur: 1.6 }), A.pose('wheelR', { rot: [720, 0, 0], dur: 1.6 }), A.effect('dust', { dur: 1.6 }), A.say('Rumble, rumble!', 1.6)), A.par(A.pose('wheelL', { rot: [0, 0, 0], dur: 0.01 }), A.pose('wheelR', { rot: [0, 0, 0], dur: 0.01 }))],
      })
      .done();
  }),
  // A gold heart charm on a few links of chain; it dangles and glints.
  e('charm', 'wardrobe', 'jewellery', () => {
    const b = m('charm').heart(0.05, [0, 0.032, 0], { color: 'gold', name: 'heart' }).torus([0.018, 0.018, 0.004], [0, 0.064, 0], { color: 'gold', tube: 0.25 });
    b.each(3, (i) => b.torus([0.012, 0.016, 0.003], [0, 0.078 + i * 0.012, 0], { color: 'gold', rot: [0, i % 2 ? 0 : 90, 0], tube: 0.3 }));
    return b.act({ click: [A.par(A.pose('heart', { rot: [0, 0, 25], dur: 0.3 }), A.effect('sparkle', { dur: 1.2 })), A.pose('heart', { rot: [0, 0, -20], dur: 0.4 }), A.pose('heart', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A little scene of a chase: a ginger cat pounces after a grey mouse, who scurries off.
  e('chase', 'ideas', 'actions', () => {
    const b = m('chase')
      .box([0.4, 0.03, 0.12], [0, 0.015, 0], { color: 'wood', round: 0.3, edge: 'sharp' })
      .ball([0.11, 0.06, 0.055], [-0.07, 0.085, 0], { color: 'orange', name: 'cat' })
      .ball(0.055, [-0.005, 0.11, 0], { color: 'orange', parent: 'cat' })
      .rod([-0.12, 0.09, 0], [-0.17, 0.15, 0], 0.016, 'orange', { parent: 'cat' })
      .ball([0.05, 0.032, 0.03], [0.13, 0.05, 0], { color: 'gray', name: 'mouse' })
      .cone([0.025, 0.03, 0.02], [0.17, 0.05, 0], { color: 'gray', rot: [0, 0, -90], parent: 'mouse' })
      .rod([0.105, 0.045, 0], [0.06, 0.04, 0], 0.005, 'pink', { parent: 'mouse' });
    b.pair((s) => {
      b.wedge([0.022, 0.025, 0.01], [-0.005 + s * 0.015, 0.142, 0], { color: 'orange', parent: 'cat' });
      b.ball(0.014, [0.14, 0.072, s * 0.01], { color: 'pink', parent: 'mouse' });
      b.rod([-0.07 + s * 0.035, 0.07, 0], [-0.07 + s * 0.06, 0.035, 0], 0.014, 'orange', { parent: 'cat' });
      b.ball(0.008, [0.01, 0.117, s * 0.012 + 0.0], { color: 'black', noInk: true, parent: 'cat' });
    });
    b.each(3, (i) => b.box([0.06, 0.006, 0.004], [-0.2, 0.07 + i * 0.025, 0.03], { color: 'white', noInk: true }));
    return b
      .act({ click: [A.par(A.pose('cat', { move: [0.12, 0.04, 0], dur: 0.35 }), A.pose('mouse', { move: [0.06, 0, 0], dur: 0.3 }), A.say('Squeak!', 1)), A.pose('cat', { move: [0.08, 0, 0], dur: 0.2 }), A.wait(0.4), A.par(A.pose('cat', { move: [0, 0, 0], dur: 0.6 }), A.pose('mouse', { move: [0, 0, 0], dur: 0.6 }))] })
      .done();
  }),
  // A chequebook in its wallet; a cheque tears off along the perforation.
  e('checkbook', 'study', 'office', () => {
    const b = m('checkbook', { edge: 'sharp' })
      .box([0.18, 0.015, 0.04], [0, 0.0075, 0], { color: 'darkgray', round: 0.3 })
      .box([0.17, 0.08, 0.012], [0, 0.055, -0.004], { color: 'leather', rot: [-8, 0, 0], round: 0.2, name: 'wallet' })
      .box([0.16, 0.07, 0.003], [0, 0.056, 0.004], { color: '#dff0e0', rot: [-8, 0, 0], name: 'cheque', parent: 'wallet', piece: true })
      .label('PAY', [0.04, 0.015], [-0.05, 0.07, 0.007], { color: '#dff0e0', rot: [-8, 0, 0], parent: 'cheque', depth: 0.002 });
    b.each(3, (i) => b.box([0.1, 0.002, 0.002], [0.02, 0.07 - i * 0.017, 0.007 + i * 0.002], { color: 'gray', rot: [-8, 0, 0], noInk: true, parent: 'cheque' }));
    return b.act({ click: [[A.detach('cheque', 'cheque'), A.say('Rrrip!', 1)], [A.reattach('cheque')]] }).done();
  }),
  // A draughtboard of eight by eight squares on its little stand; it hops with a clack.
  e('checkerboard', 'toys', 'board games', () => {
    const b = m('checkerboard', { edge: 'sharp' });
    board(b, 0.4, 8, 'red', 'black');
    return b.act({ click: [A.par(A.anim('hop'), A.say('Clack!', 1))] }).done();
  }),
  // A game of draughts in progress: a red piece jumps a black one, which is taken; click again to set them back.
  e('checkers', 'toys', 'board games', () => {
    const b = m('checkers', { edge: 'sharp' });
    const at = board(b, 0.4, 8, 'red', 'black');
    for (const [i, j, c] of [[0, 1, 'red'], [2, 1, 'red'], [3, 2, 'black'], [5, 0, 'red'], [6, 5, 'black'], [4, 7, 'black'], [1, 6, 'black'], [3, 4, 'black']] as const) {
      const name = i === 2 && j === 1 ? 'jumper' : i === 3 && j === 2 ? 'taken' : undefined;
      b.cyl([0.042, 0.012, 0.042], at(i, j, 0.02), { color: c === 'red' ? '#c0302a' : '#2a2726', rot: [75, 0, 0], ...(name ? { name } : {}) });
    }
    b.cyl([0.045, 0.014, 0.045], [0.12, 0.007, 0.12], { color: '#c0302a' }).cyl([0.045, 0.014, 0.045], [0.12, 0.021, 0.12], { color: '#c0302a' });
    const a = at(2, 1, 0.02), mid = at(3, 2, 0.08), end = at(4, 3, 0.02);
    const d = (p: V): V => [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    return b
      .act({ click: [[A.pose('jumper', { move: d(mid), dur: 0.25 }), A.pose('jumper', { move: d(end), dur: 0.25 }), A.par(A.pose('taken', { scale: 0, dur: 0.2 }), A.say('King me!', 1.5))], [A.par(A.pose('jumper', { move: [0, 0, 0], dur: 0.4 }), A.pose('taken', { scale: 1, dur: 0.4 }))]] })
      .done();
  }),
  // A block of orange cheddar on a board with slices and cubes; a cube is taken.
  e('cheddar', 'food', 'cheese', () =>
    m('cheddar')
      .box([0.26, 0.015, 0.2], [0, 0.0075, 0], { color: 'wood', round: 0.3, edge: 'sharp' })
      .box([0.14, 0.08, 0.1], [-0.03, 0.055, -0.02], { color: '#f0a030', round: 0.1, name: 'block' })
      .box([0.1, 0.07, 0.012], [0.08, 0.05, 0.05], { color: '#f0a030', rot: [-20, -30, 0], round: 0.1 })
      .box([0.025, 0.025, 0.025], [-0.02, 0.028, 0.07], { color: '#f0a030', rot: [0, 20, 0], name: 'cube', parent: 'block', piece: true })
      .box([0.025, 0.025, 0.025], [-0.06, 0.028, 0.06], { color: '#f0a030', rot: [0, -10, 0] })
      .act({ click: [[A.detach('cube', 'cube')], [A.reattach('cube')]] })
      .done(),
  ),
  // An anatomy model of a skull on a stand, the cheekbones (zygomatic arches) picked out in orange; the jaw
  // clacks.
  e('cheekbone', 'clinic', 'bones', () => {
    const bone = '#f0e8d0';
    const b = m('cheekbone')
      .box([0.2, 0.04, 0.2], [0, 0.02, 0], { color: 'darkwood', round: 0.2, edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 0.2, -0.02], 0.03, 'brass')
      .ball([0.2, 0.2, 0.24], [0, 0.36, -0.01], { color: bone })
      .box([0.13, 0.08, 0.1], [0, 0.27, 0.06], { color: bone, round: 0.6 })
      .cone([0.03, 0.035, 0.01], [0, 0.29, 0.115], { color: '#3a3330', rot: [180, 0, 0] })
      .box([0.12, 0.05, 0.1], [0, 0.215, 0.05], { color: bone, round: 0.5, name: 'jaw', pivot: [0, 0.25, -0.03], mover: { kind: 'swing', axis: 'x', amount: 20 } })
      .box([0.08, 0.018, 0.01], [0, 0.238, 0.1], { color: 'white', parent: 'jaw' })
      .box([0.08, 0.018, 0.01], [0, 0.255, 0.108], { color: 'white' });
    b.pair((s) => b.ball([0.055, 0.045, 0.02], [s * 0.042, 0.34, 0.1], { color: '#3a3330' }).ball([0.06, 0.03, 0.08], [s * 0.08, 0.29, 0.05], { color: 'orange' }));
    const chomp = [A.pose('jaw', { rot: [20, 0, 0], dur: 0.15 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.12 })];
    return b.act({ click: [...chomp, A.say('Clack clack!', 1), ...chomp, ...chomp] }).done();
  }),
  // A cheerleader in her uniform with red pom-poms: arms up for a cheer, then a dance.
  e('cheerleader outfit', 'wardrobe', 'outfits', () => {
    const pom: Extra = (p, d) => {
      for (const side of ['L', 'R'] as const) p.add({ name: `pom${side}`, parent: `hand${side}`, at: [0, -d.aw * 0.8, d.aw * 0.4], shape: 'ball', size: [d.aw * 3.4, d.aw * 3.4, d.aw * 3.4], color: '#e0473b', layer: 4 });
    };
    return withAct(who('cheerleader outfit', { top: '#e0473b', skirt: '#e0473b', shoes: 'white', style: 'ponytail', pose: 'arms_up', shorts: true, acc: [hat('bow', 'white'), pom] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('Go, team, go!', 2))],
        [A.par(A.anim('dance'), A.say('Gimme a G! Gimme an O!', 2.5))],
      ],
    });
  }),
  // A wedge of holey yellow cheese with a thin slice that comes away.
  e('cheese', 'food', 'cheese', () => {
    const b = m('cheese').wedge([0.2, 0.12, 0.12], [0, 0.06, 0], { color: 'cheese', apex: -0.5, name: 'wedge' });
    for (const [x, y, d] of [[-0.07, 0.07, 0.03], [0.03, 0.02, 0.022], [-0.04, 0.025, 0.018], [-0.085, 0.025, 0.014]] as const) b.ball([d, d, 0.01], [x, y, 0.061], { color: '#d9a52f', noInk: true });
    b.box([0.012, 0.11, 0.12], [-0.106, 0.055, 0], { color: 'cheese', name: 'slice', parent: 'wedge', piece: true });
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // A cheeseburger: sesame bun, patty, a melting slice, lettuce, tomato; the top bun lifts to show the stack.
  e('cheeseburger', 'food', 'fast food', () => {
    const b = m('cheeseburger')
      .cyl([0.11, 0.025, 0.11], [0, 0.0125, 0], { color: 'bread' })
      .cyl([0.118, 0.022, 0.118], [0, 0.036, 0], { color: 'darkbrown' })
      .box([0.105, 0.006, 0.105], [0, 0.05, 0], { color: 'cheese', rot: [0, 45, 0], round: 0 })
      .cyl([0.125, 0.008, 0.125], [0, 0.056, 0], { color: 'lettuce' })
      .cyl([0.1, 0.01, 0.1], [0, 0.064, 0], { color: 'tomato' })
      .ball([0.115, 0.065, 0.115], [0, 0.07, 0], { color: 'bread', name: 'bun' });
    around(6, 0.03).forEach(([x, z]) => b.ball([0.008, 0.004, 0.005], [x, 0.098, z + 0.01], { color: 'cream', noInk: true, parent: 'bun' }));
    return b.act({ click: [A.pose('bun', { move: [0, 0.05, 0], rot: [-20, 0, 0], dur: 0.3 }), A.say('Chomp!', 1), A.pose('bun', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A slice of cheesecake on a plate: biscuit base, creamy filling, berry glaze and a cherry that can be taken.
  e('cheesecake', 'food', 'desserts', () =>
    plate(m('cheesecake'), 0.18)
      .wedge([0.1, 0.12, 0.015], [0, 0.022, 0.0], { color: 'crust', rot: [-90, 0, 0], name: 'slice' })
      .wedge([0.1, 0.12, 0.045], [0, 0.052, 0.0], { color: 'cream', rot: [-90, 0, 0] })
      .wedge([0.1, 0.12, 0.008], [0, 0.078, 0.0], { color: 'darkred', rot: [-90, 0, 0] })
      .ball([0.025, 0.03, 0.025], [0, 0.093, 0.03], { color: 'red', name: 'cherry', parent: 'slice', piece: true })
      .act({ click: [[A.detach('cherry', 'cherry')], [A.reattach('cherry')]] })
      .done(),
  ),
  // A pleated chef's toque; it puffs up proudly.
  e('chef hat', 'wardrobe', 'hats', () => {
    const b = m('chef hat').cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: 'white', name: 'band' }).ball([0.17, 0.17, 0.17], [0, 0.2, 0], { color: 'white', name: 'puff', pivot: [0, 0.08, 0] });
    around(5, 0.065).forEach(([x, z]) => b.ball(0.12, [x, 0.16, z], { color: 'white', parent: 'puff' }));
    b.each(5, (i) => b.box([0.004, 0.07, 0.004], [-0.06 + i * 0.03, 0.04, 0.1], { color: 'lightgray', noInk: true }));
    return b.act({ click: [A.pose('puff', { scale: 1.25, dur: 0.3 }), A.say('Poof!', 1), A.pose('puff', { scale: 1, dur: 0.4 })] }).done();
  }),
  // A pair of cherries on joined stems with a leaf; they swing.
  e('cherry', 'food', 'fruit', () => {
    const b = m('cherry').ball([0.04, 0.012, 0.02], [0.03, 0.112, 0], { color: 'leaf', rot: [0, 0, -20], name: 'stem', pivot: [0.004, 0.11, 0] });
    b.pair((s) => b.ball(0.045, [s * 0.03, 0.0225, 0], { color: 'darkred', parent: 'stem' }).rod([s * 0.03, 0.04, 0], [0.004, 0.11, 0], 0.004, 'green', { parent: 'stem' }).ball([0.01, 0.014, 0.006], [s * 0.03 + 0.01, 0.033, 0.02], { color: 'white', noInk: true, parent: 'stem' }));
    return b.act({ click: [A.pose('stem', { rot: [0, 0, 15], dur: 0.3 }), A.pose('stem', { rot: [0, 0, -12], dur: 0.4 }), A.pose('stem', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A cherry bomb firecracker: the fuse fizzes, then BANG.
  e('cherry bomb', 'toys', 'fireworks', () =>
    m('cherry bomb')
      .ball(0.05, [0, 0.025, 0], { color: 'red', name: 'bomb' })
      .rod([0, 0.05, 0], [0.01, 0.075, 0], 0.005, 'green', { parent: 'bomb' })
      .star(0.03, [0.012, 0.085, 0], { color: 'yellow', glow: true, parent: 'bomb' })
      .act({ click: [A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Fizzzz...', 1.2)), A.wait(1), A.par(A.effect('explosion', { dur: 1 }), A.pose('bomb', { scale: 0, dur: 0.05 }), A.say('BANG!', 1.2)), A.wait(1.5), A.pose('bomb', { scale: 1, dur: 0.4 })] })
      .done(),
  ),
  // A truck-mounted boom lift: a cab with windows, a utility body, outrigger legs, a turntable and a two-part
  // boom with a work basket 10 m up. Click: a worker rides the basket up and waves.
  e('cherry picker', 'garage', 'construction vehicles', () => {
    const b = m('cherry picker', { view: 'side', edge: 'sharp' })
      .box([2.3, 0.4, 7.6], [0, 0.95, -0.4], { color: '#3a3633', round: 0.1 })
      .box([2.3, 1.9, 2.0], [0, 2.0, 2.6], { color: 'white', round: 0.15 })
      .box([2.2, 0.85, 0.05], [0, 2.45, 3.62], { color: '#2f3d52', round: 0.1, rot: [-8, 0, 0] })
      .box([2.32, 0.35, 0.2], [0, 0.95, 3.65], { color: '#5c6166' })
      .box([2.3, 1.3, 5.2], [0, 1.8, -1.0], { color: 'white', round: 0.05 })
      .box([2.32, 0.12, 5.2], [0, 1.5, -1.0], { color: 'orange', round: 0 })
      .cyl([1.4, 0.5, 1.4], [0, 2.7, -2.4], { color: '#5c6166' })
      .box([0.5, 0.18, 0.3], [0, 3.04, 2.4], { color: 'orange', glow: true, name: 'beacon', mover: { kind: 'light' } });
    b.pair((s) => {
      sidePane(b, s, 1.15, 2.4, 2.7, 0.8, 1.3);
      b.box([0.3, 0.25, 0.9], [s * 0.7, 1.2, 3.65], { color: '#fff6c8', glow: true, rot: [0, 0, 0] });
      for (const z of [0.6, -3.2]) b.rod([s * 1.15, 1.2, z], [s * 1.9, 0.08, z], 0.16, 'yellow').box([0.4, 0.06, 0.4], [s * 1.9, 0.03, z], { color: 'darkgray' });
    });
    axle(b, 1.0, 0.5, 2.5, 1.0, 0.35, 'wheelF');
    axle(b, 1.0, 0.5, -2.2, 1.0, 0.45, 'wheelR');
    const P1: V = [0, 2.9, -2.4], P2: V = [0, 2.9 + 4.5 * Math.sin(60 * RAD), -2.4 - 4.5 * Math.cos(60 * RAD)];
    const P3: V = [0, P2[1] + 5 * Math.sin(40 * RAD), P2[2] + 5 * Math.cos(40 * RAD)];
    b.rod(P1, P2, 0.5, 'orange', { name: 'boom', pivot: P1, mover: { kind: 'swing', axis: 'x', amount: 25 } })
      .ball(0.55, P2, { color: '#5c6166', parent: 'boom' })
      .rod(P2, P3, 0.4, 'orange', { parent: 'boom' })
      .rod([0, P1[1] + 0.6, P1[2] + 0.4], [0, P2[1] - 1.5, P2[2] + 0.4], 0.16, 'silver', { parent: 'boom' })
      .box([1.3, 1.1, 1.1], [0, P3[1] + 0.35, P3[2] + 0.55], { color: 'yellow', parent: 'boom', name: 'basket' })
      .box([1.4, 0.08, 1.2], [0, P3[1] + 0.92, P3[2] + 0.55], { color: 'yellow', parent: 'basket' })
      .socket('basket', [0, P3[1] - 0.15, P3[2] + 0.55], 'top', { part: 'basket', size: 1 });
    return b
      .act({ click: [[A.spawn('worker', 'man'), A.attach('worker', 'self', 'basket'), A.par(A.operate('boom', 'on'), A.operate('beacon', 'on'), A.say('Whirrr...', 1.5)), A.par(A.anim('wave', 2, 'worker'), A.say('Hello from up here!', 2, 'worker')), A.par(A.operate('boom', 'off'), A.operate('beacon', 'off')), A.remove('worker', 'fade')]] })
      .done();
  }),
  // A cherry pie in its tin with a lattice crust, hot from the oven.
  e('cherry pie', 'food', 'desserts', () => {
    const b = m('cherry pie')
      .cyl([0.22, 0.035, 0.22], [0, 0.0175, 0], { color: 'silver', taper: 1.15 })
      .cyl([0.22, 0.012, 0.22], [0, 0.04, 0], { color: 'darkred' })
      .torus([0.25, 0.25, 0.035], [0, 0.045, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.12 });
    for (const k of [-0.06, 0, 0.06]) b.stick([-0.1, 0.05, k], [0.1, 0.05, k], 0.016, 'bread').stick([k, 0.054, -0.1], [k, 0.054, 0.1], 0.016, 'bread');
    b.ball(0.025, [0.03, 0.052, 0.03], { color: 'red' }).ball(0.025, [-0.03, 0.052, -0.03], { color: 'red' });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Mmm, fresh from the oven!', 2))] }).done();
  }),
  // A glass of cherry soda with ice, a straw and a cherry on top; it fizzes.
  e('cherry soda', 'food', 'drinks', () => {
    const b = drink(m('cherry soda'), 0.16, 0.075, 'red', 0.8)
      .stick([0.012, 0.11, 0], [0.03, 0.22, 0], 0.008, 'white')
      .ball(0.026, [-0.018, 0.17, 0.01], { color: 'darkred' })
      .rod([-0.018, 0.182, 0.01], [-0.012, 0.21, 0.0], 0.003, 'green')
      .box([0.03, 0.025, 0.03], [0.012, 0.135, -0.01], { color: 'ice', rot: [0, 30, 10] });
    b.each(4, (i) => b.ball(0.007, [-0.02 + i * 0.013, 0.04 + (i % 2) * 0.04, 0.038], { color: 'pink', noInk: true, name: `fizz${i}` }));
    return b.act({ click: [A.par(...[0, 1, 2, 3].map((i) => A.pose(`fizz${i}`, { move: [0, 0.06, 0], dur: 0.6 })), A.say('Fizzzz!', 1.2)), A.par(...[0, 1, 2, 3].map((i) => A.pose(`fizz${i}`, { move: [0, 0, 0], dur: 0.01 })))] }).done();
  }),
  // A truss of cherry tomatoes on the vine; one comes off.
  e('cherry tomato', 'food', 'vegetables', () => {
    const b = m('cherry tomato');
    const toms: V[] = [[-0.04, 0.019, 0], [0.005, 0.019, 0.02], [0.045, 0.02, -0.005]];
    b.rod([-0.05, 0.075, -0.01], [0, 0.085, 0], 0.007, 'green', { name: 'vine' }).rod([0, 0.085, 0], [0.05, 0.07, -0.01], 0.007, 'green');
    toms.forEach(([x, y, z], i) => {
      const po: PartOpts = i === 2 ? { parent: 'tom' } : {};
      b.ball(0.038, [x, y, z], { color: 'tomato', ...(i === 2 ? { name: 'tom', parent: 'vine', piece: true } : {}) }).ball([0.024, 0.006, 0.024], [x, y + 0.019, z], { color: 'green', ...po }).rod([x, y + 0.02, z], [x * 0.8, 0.078, -0.005], 0.004, 'green', po);
    });
    return b.act({ click: [[A.detach('tom', 'tomato')], [A.reattach('tom')]] }).done();
  }),
  // A cherry tree in blossom and fruit, 6.5 m: a forked trunk, a cloud of pink blossom with dark red cherries.
  // Shake it and a cherry drops.
  e('cherry tree', 'garden', 'trees', () => {
    const b = m('cherry tree')
      .cyl([0.5, 3.2, 0.5], [0, 1.6, 0], { color: 'bark', taper: 0.6 })
      .rod([0, 2.6, 0], [-1.2, 3.6, 0.3], 0.22, 'bark')
      .rod([0, 2.8, 0], [1.2, 3.8, -0.2], 0.22, 'bark')
      .rod([0, 3.0, 0], [0.2, 4.2, -0.8], 0.18, 'bark')
      .ball([4.4, 3.0, 4.2], [0, 4.6, 0], { color: '#f4a1c0', name: 'top', pivot: [0, 2.8, 0] })
      .ball([2.5, 2.0, 2.5], [-1.9, 4.1, 0.5], { color: '#f8c8dc', parent: 'top' })
      .ball([2.5, 2.0, 2.5], [1.9, 4.3, 0.3], { color: '#f8c8dc', parent: 'top' })
      .ball([2.6, 1.8, 2.6], [0.3, 5.7, -0.3], { color: '#f8c8dc', parent: 'top' })
      .ball([1.4, 0.3, 1.4], [0, 0.05, 0], { color: '#f4a1c0', noInk: true });
    for (const [x, y, z] of [[-0.8, 3.6, 2.05], [0.9, 4.1, 2.0], [0.1, 5.2, 1.8], [-1.9, 4.6, 1.55], [1.6, 3.6, 1.7], [-0.3, 3.3, 2.0]]) b.ball(0.16, [x, y, z], { color: 'darkred', parent: 'top', ...(x === -0.3 ? { name: 'fruit', piece: true } : {}) });
    return b.act({ click: [[A.pose('top', { rot: [0, 0, 5], dur: 0.25 }), A.pose('top', { rot: [0, 0, -4], dur: 0.3 }), A.pose('top', { rot: [0, 0, 0], dur: 0.25 }), A.detach('fruit', 'cherry')], [A.reattach('fruit')]] }).done();
  }),
  // A black knight from a chess set; it makes its L-shaped move.
  e('chess piece', 'toys', 'board games', () =>
    m('chess piece')
      .cyl([0.042, 0.01, 0.042], [0, 0.005, 0], { color: 'black', name: 'knight' })
      .cyl([0.034, 0.012, 0.034], [0, 0.016, 0], { color: 'black', taper: 0.85, parent: 'knight' })
      .box([0.022, 0.045, 0.03], [0, 0.042, -0.004], { color: 'black', rot: [-12, 0, 0], round: 0.5, parent: 'knight' })
      .box([0.02, 0.02, 0.04], [0, 0.064, 0.008], { color: 'black', rot: [25, 0, 0], round: 0.5, parent: 'knight' })
      .box([0.006, 0.04, 0.008], [0, 0.055, -0.02], { color: 'darkgray', rot: [-12, 0, 0], parent: 'knight' })
      .cone([0.008, 0.014, 0.008], [0.005, 0.08, -0.006], { color: 'black', parent: 'knight' })
      .cone([0.008, 0.014, 0.008], [-0.005, 0.08, -0.006], { color: 'black', parent: 'knight' })
      .ball(0.005, [0.008, 0.068, 0.014], { color: 'white', noInk: true, parent: 'knight' })
      .act({ click: [A.pose('knight', { move: [0, 0.05, 0.05], dur: 0.2 }), A.pose('knight', { move: [0, 0.05, 0.1], dur: 0.2 }), A.pose('knight', { move: [0.05, 0, 0.1], dur: 0.2 }), A.say('Clack! Check!', 1.2), A.pose('knight', { move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A pirate's treasure chest: iron-banded wood with a domed lid that creaks open on a heap of gold.
  e('chest', 'home', 'storage', () => {
    const b = m('chest', { edge: 'sharp' })
      .box([0.7, 0.4, 0.45], [0, 0.2, 0], { color: 'wood', round: 0.06 })
      .ball([0.6, 0.12, 0.36], [0, 0.39, 0], { color: 'gold', glow: true, edge: 'soft' })
      .cyl([0.45, 0.7, 0.45], [0, 0.4, 0], { color: 'wood', rot: [0, 0, 90], name: 'lid', pivot: [0, 0.4, -0.225], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .box([0.1, 0.12, 0.03], [0, 0.38, 0.235], { color: 'gold', round: 0.3 })
      .ball(0.02, [0, 0.36, 0.25], { color: 'black' });
    b.pair((s) => b.box([0.05, 0.41, 0.46], [s * 0.24, 0.2, 0], { color: 'iron', round: 0.1 }).cyl([0.47, 0.05, 0.47], [s * 0.24, 0.4, 0], { color: 'iron', rot: [0, 0, 90], parent: 'lid' }).box([0.04, 0.05, 0.12], [s * 0.37, 0.25, 0], { color: 'iron' }));
    return b.act({ click: [[A.operate('lid', 'open'), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Creeeak!', 1.2))], [A.operate('lid', 'close'), A.say('Thunk.', 0.8)]] }).done();
  }),
  e('chicken breast', 'food', 'meat', () => {
    const b = plate(m('chicken breast'), 0.2).ball([0.13, 0.04, 0.09], [0, 0.035, 0], { color: '#d9a066', rot: [0, 20, 0] }).ball([0.03, 0.008, 0.02], [0.05, 0.05, 0.03], { color: 'leaf' });
    b.each(3, (i) => b.box([0.09, 0.004, 0.01], [-0.02 + i * 0.025, 0.055, 0], { color: '#7a4a2a', rot: [0, 45, 0], noInk: true }));
    return b.act({ click: [A.par(A.effect('steam', { dur: 1.8 }), A.say('Sizzle!', 1.2))] }).done();
  }),
  // A hen house on legs: shingled gable roof, a pop-hole door with a ramp, a nesting box with a lid you lift for
  // eggs, and a wire run. Click: the door opens and a rooster comes out to crow; again: the nest box.
  e('chicken coop', 'farm', 'farm buildings', () => {
    const b = m('chicken coop', { edge: 'sharp' })
      .box([2.2, 1.3, 1.5], [0, 1.25, 0], { color: '#b5523b', round: 0.03 })
      .wedge([2.5, 0.8, 1.8], [0, 2.3, 0], { color: '#5c6166', rot: [0, 90, 0] })
      .box([0.4, 0.45, 0.05], [0.5, 0.95, 0.77], { color: 'cream', name: 'door', pivot: [0.5, 0.725, 0.77], mover: { kind: 'swing', axis: 'x', amount: 85 } })
      .box([0.4, 0.04, 1.1], [0.5, 0.33, 1.22], { color: 'wood', rot: [32, 0, 0] })
      .label('COOP', [0.6, 0.2], [-0.4, 1.5, 0.77], { color: 'white', depth: 0.02 })
      .box([0.5, 0.5, 0.6], [1.35, 1.15, 0], { color: '#b5523b' })
      .box([0.56, 0.05, 0.66], [1.35, 1.43, 0], { color: '#5c6166', rot: [0, 0, -15], name: 'nest', pivot: [1.1, 1.45, 0], mover: { kind: 'swing', axis: 'z', amount: 70 } })
      .ball([0.07, 0.09, 0.07], [1.3, 0.95, 0.1], { color: 'cream' })
      .ball([0.07, 0.09, 0.07], [1.42, 0.95, -0.1], { color: '#e8c8a0' });
    for (const [x, z] of [[1.0, 0.65], [-1.0, 0.65], [1.0, -0.65], [-1.0, -0.65]]) b.box([0.1, 0.6, 0.1], [x, 0.3, z], { color: 'wood' });
    b.box([2.2, 0.08, 0.08], [-1.9, 1.5, 0], { color: 'wood', rot: [0, 90, 0] });
    for (const [x, z] of [[-1.15, 1.1], [-2.65, 1.1], [-2.65, -1.1], [-1.15, -1.1]]) b.box([0.08, 1.5, 0.08], [x, 0.75, z], { color: 'wood' });
    b.each(6, (i) => b.stick([-2.65, 0.05, -1.1 + i * 0.44], [-2.65, 1.45, -1.1 + i * 0.44], 0.012, '#9da3a8', { noInk: true }));
    b.each(4, (i) => b.stick([-2.65, 0.1 + i * 0.45, -1.1], [-2.65, 0.1 + i * 0.45, 1.1], 0.012, '#9da3a8', { noInk: true }).stick([-2.65, 0.1 + i * 0.45, 1.1], [-1.15, 0.1 + i * 0.45, 1.1], 0.012, '#9da3a8', { noInk: true }));
    b.each(3, (i) => b.stick([-2.25 + i * 0.4, 0.05, 1.1], [-2.25 + i * 0.4, 1.45, 1.1], 0.012, '#9da3a8', { noInk: true }));
    return b
      .act({ click: [[A.operate('door', 'open'), A.spawn('hen', 'rooster', { rel: 'front', of: 'self', dist: 'close' }), A.say('Cock-a-doodle-doo!', 2, 'hen'), A.wait(1), A.remove('hen', 'fade'), A.operate('door', 'close')], [A.operate('nest', 'open'), A.say('Cluck! Fresh eggs!', 1.5), A.wait(1.5), A.operate('nest', 'close')]] })
      .done();
  }),
  // A sack of chicken feed with grain spilling round it; it rustles.
  e('chicken feed', 'farm', 'farm things', () => {
    const b = m('chicken feed')
      .box([0.18, 0.2, 0.12], [0, 0.1, 0], { color: '#c8a978', round: 0.5, name: 'sack', pivot: [0, 0, 0] })
      .cyl([0.08, 0.05, 0.06], [0, 0.22, 0], { color: '#c8a978', taper: 1.6, parent: 'sack' })
      .torus([0.06, 0.06, 0.01], [0, 0.205, 0], { color: 'darkbrown', rot: [90, 0, 0], tube: 0.2, parent: 'sack' })
      .label('FEED', [0.11, 0.05], [0, 0.11, 0.065], { color: 'white', parent: 'sack', depth: 0.003 });
    for (const [x, z] of [[0.05, 0.1], [0.08, 0.12], [0.02, 0.13], [0.1, 0.09], [-0.03, 0.11], [0.06, 0.15]]) b.ball(0.014, [x, 0.007, z], { color: 'yellow' });
    return b.act({ click: [A.pose('sack', { rot: [20, 0, 0], dur: 0.3 }), A.par(A.effect('dust', { dur: 1 }), A.say('Rustle, rustle!', 1.2)), A.pose('sack', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // Chicken tenders in a paper-lined basket with a pot of honey mustard; one dips.
  e('chicken finger', 'food', 'fast food', () => {
    const b = m('chicken finger')
      .box([0.18, 0.04, 0.12], [0, 0.02, 0], { color: 'red', round: 0.3 })
      .box([0.17, 0.006, 0.11], [0, 0.042, 0], { color: 'white' })
      .cyl([0.04, 0.025, 0.04], [0.12, 0.0125, 0.06], { color: 'white' })
      .cyl([0.034, 0.006, 0.034], [0.12, 0.026, 0.06], { color: 'honey' });
    ([[-0.03, 0.055, 20, 90], [0.02, 0.058, -15, 85], [0.0, 0.075, 5, 95]] as const).forEach(([x, y, ry, rz], i) => b.capsule([0.032, 0.12, 0.026], [x, y, 0], { color: '#d9962e', rot: [0, ry, rz], ...(i === 2 ? { name: 'tender' } : {}) }));
    return b.act({ click: [A.pose('tender', { move: [0.1, 0.0, 0.06], rot: [0, 0, -40], dur: 0.4 }), A.say('Dip!', 0.8), A.pose('tender', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  e('chicken leg', 'food', 'meat', () => {
    const P = diag(-0.06, 0.04, 40);
    return m('chicken leg')
      .ball([0.075, 0.12, 0.07], P(0.05), { color: '#b5652e', rot: [0, 0, -50] })
      .ball([0.03, 0.02, 0.01], P(0.04, 0.02, 0.035), { color: '#d98a4e', noInk: true })
      .stick(P(0.09), P(0.17), 0.018, 'cream')
      .ball(0.026, P(0.178, 0.009), { color: 'cream' })
      .ball(0.026, P(0.178, -0.009), { color: 'cream' })
      .act({ click: [A.par(A.anim('hop'), A.say('Crunch!', 1), A.effect('steam', { dur: 1 }))] })
      .done();
  }),
  // Chicken nuggets on a plate with ketchup; one is taken.
  e('chicken nugget', 'food', 'fast food', () => {
    const b = plate(m('chicken nugget'), 0.18).cyl([0.04, 0.025, 0.04], [0.05, 0.02, -0.04], { color: 'white' }).cyl([0.034, 0.006, 0.034], [0.05, 0.033, -0.04], { color: 'red' });
    ([[-0.04, 0.02, 0.02, 10], [0.0, 0.02, 0.04, -20], [-0.02, 0.02, -0.03, 40], [-0.02, 0.042, 0.01, 70]] as const).forEach(([x, y, z, r], i) => b.ball([0.05, 0.025, 0.04], [x, y, z], { color: '#d9962e', rot: [0, r, 8], ...(i === 3 ? { name: 'nugget', parent: 'cyl0', piece: true } : {}) }));
    return b.act({ click: [[A.detach('nugget', 'nugget')], [A.reattach('nugget')]] }).done();
  }),
  // A bowl of chili con carne with sour cream and a chilli pepper; it is HOT.
  e('chili', 'food', 'meals', () => {
    const b = bowl(m('chili'), 0.16, 0.07, 'white', '#8a2e1a')
      .ball([0.035, 0.015, 0.03], [0.01, 0.072, 0.01], { color: 'white' })
      .cone([0.025, 0.1, 0.025], [0.02, 0.082, 0.06], { color: 'red', rot: [0, 0, -100] })
      .cyl([0.015, 0.02, 0.015], [-0.035, 0.08, 0.06], { color: 'green', rot: [0, 0, 80] });
    around(5, 0.04, 0.3).forEach(([x, z]) => b.ball([0.016, 0.01, 0.012], [x, 0.068, z], { color: 'darkred' }));
    return b.act({ click: [A.par(A.effect('fire', { dur: 1 }), A.effect('steam', { dur: 1.5 }), A.anim('shake'), A.say('Spicy!', 1.2))] }).done();
  }),
  // A wind chime: five tuned tubes round a clapper under a wooden top, hung from a ring; they swing and ring.
  e('chime', 'music', 'bells', () => {
    const b = m('chime')
      .cyl([0.14, 0.025, 0.14], [0, 0.4, 0], { color: 'wood', edge: 'sharp' })
      .torus([0.03, 0.03, 0.006], [0, 0.43, 0], { color: 'silver', tube: 0.2 })
      .stick([0, 0.39, 0], [0, 0.1, 0], 0.002, 'gray', { name: 'clapper', pivot: [0, 0.39, 0] })
      .cyl([0.05, 0.008, 0.05], [0, 0.22, 0], { color: 'wood', parent: 'clapper' })
      .box([0.04, 0.07, 0.004], [0, 0.07, 0], { color: 'wood', parent: 'clapper' });
    around(5, 0.05, 0.3).forEach(([x, z], i) => {
      const L = 0.14 + i * 0.025;
      b.stick([x, 0.39, z], [x, 0.36, z], 0.002, 'gray', { name: `tube${i}`, pivot: [x, 0.39, z] }).cyl([0.016, L, 0.016], [x, 0.36 - L / 2, z], { color: 'silver', parent: `tube${i}` });
    });
    const sw = (k: number) => A.par(A.pose('clapper', { rot: [k * 12, 0, k * 8], dur: 0.3 }), ...[0, 1, 2, 3, 4].map((i) => A.pose(`tube${i}`, { rot: [((i % 2) * 2 - 1) * k * 10, 0, ((i % 3) - 1) * k * 8], dur: 0.3 })));
    return b.act({ click: [A.say('Ting-a-ling-ling...', 2), sw(1), sw(-1), sw(0.6), sw(0)] }).done();
  }),
  // A brick chimney stack on a slice of tiled roof: lead flashing, a stone cap and two clay pots. It puffs smoke.
  e('chimney', 'places', 'house parts', () => {
    const b = m('chimney', { edge: 'sharp' })
      .wedge([5, 1.8, 4], [0, 0.9, 0], { color: '#5c6166' })
      .box([1.1, 3.4, 1.0], [0.9, 2.5, 0], { color: '#b5523b' })
      .box([1.2, 0.08, 1.1], [0.9, 1.35, 0], { color: 'iron', rot: [0, 0, -36] })
      .box([1.25, 0.18, 1.15], [0.9, 4.25, 0], { color: 'stone' })
      .cyl([0.3, 0.45, 0.3], [0.7, 4.55, 0], { color: '#c8673a', taper: 0.85, edge: 'soft' })
      .cyl([0.3, 0.45, 0.3], [1.1, 4.55, 0], { color: '#c8673a', taper: 0.85, edge: 'soft' })
      .ball(0.4, [0.75, 5.1, 0], { color: '#d4d7da', edge: 'soft' })
      .ball(0.55, [1.1, 5.6, 0], { color: '#e6e8ea', edge: 'soft' });
    b.each(9, (i) => b.box([1.12, 0.025, 1.02], [0.9, 1.2 + i * 0.35, 0], { color: '#e6d6c0', noInk: true, round: 0 }));
    b.each(6, (i) => b.box([5, 0.04, 0.06], [0, 0.25 + i * 0.27, 1.95 - i * 0.3], { color: '#4a4f55', rot: [0, 0, 0], noInk: true }));
    return b.act({ click: [A.par(A.effect('smoke', { dur: 2.5 }), A.say('Puff, puff...', 2))] }).done();
  }),
  // A bowl of crisps; a crisp hops and crunches.
  e('chip', 'food', 'snacks', () => {
    const b = bowl(m('chip'), 0.16, 0.06, 'red', '#f2c14e');
    ([[-0.03, 0.08, 0.0, [60, 0, 20]], [0.03, 0.08, 0.01, [70, 30, -25]], [0.0, 0.085, -0.03, [40, 0, 0]], [0.01, 0.075, 0.04, [20, 50, 10]]] as const).forEach(([x, y, z, r], i) =>
      b.ball([0.06, 0.012, 0.05], [x, y, z], { color: '#f2c14e', rot: r as V, ...(i === 3 ? { name: 'crisp' } : {}) }),
    );
    return b.act({ click: [A.pose('crisp', { move: [0, 0.08, 0.03], rot: [0, 180, 0], dur: 0.3 }), A.say('Crunch!', 1), A.pose('crisp', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A wood chisel with a bevelled steel blade; it taps into the wood.
  e('chisel', 'workshop', 'hand tools', () => {
    const P = diag(-0.06, 0.02, 55);
    const d: V = [Math.cos(55 * RAD) * 0.03, Math.sin(55 * RAD) * 0.03, 0];
    return m('chisel')
      .rod(P(0), P(0.1), 0.032, 'wood', { name: 'chisel' })
      .cyl([0.036, 0.012, 0.036], P(0.0), { color: 'iron', rot: [0, 0, -35], parent: 'chisel' })
      .stick(P(0.105), P(0.125), 0.026, 'silver', { parent: 'chisel' })
      .box([0.022, 0.12, 0.007], P(0.185), { color: 'steel', rot: [0, 0, -35], edge: 'sharp', parent: 'chisel' })
      .act({ click: [A.pose('chisel', { move: d, dur: 0.12 }), A.par(A.say('Tok!', 0.6), A.effect('dust', { dur: 0.6 })), A.pose('chisel', { move: [0, 0, 0], dur: 0.2 }), A.pose('chisel', { move: d, dur: 0.12 }), A.say('Tok!', 0.6), A.pose('chisel', { move: [0, 0, 0], dur: 0.2 })] })
      .done();
  }),
  // A chocolate bar in a half-peeled wrapper; a square snaps off.
  e('chocolate', 'food', 'sweets', () => {
    const b = m('chocolate', { edge: 'sharp' })
      .box([0.08, 0.14, 0.012], [0, 0.07, 0], { color: 'chocolate', round: 0.1, name: 'bar' })
      .box([0.084, 0.06, 0.02], [0, 0.03, 0], { color: 'red', round: 0.2 })
      .box([0.086, 0.008, 0.022], [0, 0.062, 0], { color: 'silver' });
    for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) b.box([0.022, 0.03, 0.005], [-0.025 + c * 0.025, 0.09 + r * 0.034, 0.007], { color: '#7a4a2e', round: 0.3, parent: 'bar', ...(c === 2 && r === 1 ? { name: 'square', piece: true } : {}) });
    return b.act({ click: [[A.detach('square', 'square'), A.say('Snap!', 0.8)], [A.reattach('square')]] }).done();
  }),
  // A chocolate fudge cake with drips, cream rosettes and cherries; a slice comes out.
  e('chocolate cake', 'food', 'desserts', () => {
    const b = plate(m('chocolate cake'), 0.3)
      .cyl([0.22, 0.1, 0.22], [0, 0.065, 0], { color: 'chocolate', name: 'cake' })
      .cyl([0.226, 0.016, 0.226], [0, 0.12, 0], { color: '#3e2416' })
      .wedge([0.06, 0.11, 0.116], [0, 0.068, 0.06], { color: '#7a4a2e', rot: [-90, 0, 0], name: 'slice', parent: 'cake', piece: true });
    around(10, 0.112).forEach(([x, z], i) => b.capsule([0.016, 0.03 + (i % 3) * 0.01, 0.01], [x, 0.105, z], { color: '#3e2416' }));
    around(5, 0.07).forEach(([x, z]) => b.ball(0.025, [x, 0.138, z], { color: 'white' }).ball(0.02, [x, 0.155, z], { color: 'darkred' }));
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  e('chocolate chip', 'food', 'baking', () =>
    m('chocolate chip')
      .ball([0.05, 0.025, 0.05], [0, 0.0125, 0], { color: 'chocolate' })
      .cone([0.05, 0.045, 0.05], [0, 0.035, 0], { color: 'chocolate' })
      .ball([0.025, 0.013, 0.025], [0.05, 0.0065, 0.02], { color: 'chocolate' })
      .cone([0.025, 0.022, 0.025], [0.05, 0.018, 0.02], { color: 'chocolate' })
      .ball([0.025, 0.013, 0.025], [-0.045, 0.0065, 0.025], { color: 'chocolate' })
      .cone([0.025, 0.022, 0.025], [-0.045, 0.018, 0.025], { color: 'chocolate' })
      .act({ click: [A.par(A.anim('hop', 2), A.effect('sparkle', { dur: 0.8 }))] })
      .done(),
  ),
  // A black velvet choker with a gold ring and a red drop; it glints.
  e('choker', 'wardrobe', 'jewellery', () =>
    m('choker')
      .torus([0.12, 0.12, 0.018], [0, 0.07, 0], { color: 'black', rot: [105, 0, 0], tube: 0.12 })
      .torus([0.014, 0.014, 0.004], [0, 0.046, 0.06], { color: 'gold', tube: 0.25 })
      .ball([0.022, 0.03, 0.012], [0, 0.026, 0.062], { color: 'red', name: 'drop', pivot: [0, 0.042, 0.062] })
      .act({ click: [A.par(A.pose('drop', { rot: [0, 0, 25], dur: 0.25 }), A.effect('sparkle', { dur: 1 })), A.pose('drop', { rot: [0, 0, -18], dur: 0.3 }), A.pose('drop', { rot: [0, 0, 0], dur: 0.25 })] })
      .done(),
  ),
  // A bowl of rice with a pair of lacquered chopsticks that pick up a bite.
  e('chop sticks', 'kitchen', 'utensils', () =>
    bowl(m('chop sticks'), 0.13, 0.07, 'white', 'white')
      .ball([0.11, 0.04, 0.11], [0, 0.07, 0], { color: 'white' })
      .torus([0.13, 0.13, 0.012], [0, 0.04, 0], { color: 'red', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .stick([0.07, 0.23, -0.02], [-0.01, 0.07, 0.01], 0.009, 'darkred', { taper: 0.5, name: 'sticks', pivot: [0.07, 0.23, -0.02] })
      .stick([0.085, 0.225, -0.005], [0.005, 0.07, 0.02], 0.009, 'darkred', { taper: 0.5, parent: 'sticks' })
      .ball(0.018, [0.0, 0.075, 0.015], { color: 'white', parent: 'sticks' })
      .act({ click: [A.pose('sticks', { move: [0, 0.07, 0.02], rot: [0, 0, 15], dur: 0.4 }), A.say('Click, clack!', 1), A.pose('sticks', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A string of coloured Christmas lights swagged between three posts in snow; they twinkle in turn.
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
      pts.slice(1, -1).forEach(([x, y]) => {
        b.ball([0.07, 0.11, 0.07], [x, y - 0.07, 0.04], { color: cols[k % 4], glow: true, name: `${k % 2 ? 'odd' : 'even'}${k}`, mover: { kind: 'light', on: true } });
        k++;
      });
    }
    return b.act({ click: [[A.operate('odd', 'off'), A.wait(0.4), A.operate('odd', 'on'), A.operate('even', 'off'), A.wait(0.4), A.operate('even', 'on'), A.operate('odd', 'off'), A.wait(0.4), A.operate('odd', 'on')], [A.operate('all')]] }).done();
  }),
  // A Christmas stocking hung by its loop, a candy cane and a present poking out of the cuff; the present pops up.
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
      .box([0.09, 0.09, 0.07], [-0.05, 0.66, 0.0], { color: 'blue', round: 0.1, name: 'gift', edge: 'sharp' })
      .box([0.1, 0.015, 0.075], [-0.05, 0.66, 0.0], { color: 'gold', parent: 'gift' })
      .act({ click: [A.pose('gift', { move: [0, 0.12, 0.02], dur: 0.3 }), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Ho ho ho!', 1.5)), A.pose('gift', { move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // An "ugly" Christmas sweater: a knitted tree with a star and bobble lights that twinkle.
  e('christmas sweater', 'wardrobe', 'sweaters', () => {
    const b = m('christmas sweater')
      .box([0.5, 0.55, 0.16], [0, 0.35, 0], { color: 'red', round: 0.3 })
      .box([0.52, 0.06, 0.17], [0, 0.1, 0], { color: 'green', round: 0.4 })
      .box([0.2, 0.05, 0.12], [0, 0.63, 0], { color: 'green', round: 0.5 })
      .box([0.5, 0.05, 0.002], [0, 0.55, 0.081], { color: 'white', noInk: true })
      .wedge([0.15, 0.18, 0.01], [0, 0.36, 0.082], { color: 'darkgreen' })
      .star(0.05, [0, 0.46, 0.088], { color: 'yellow', glow: true });
    b.pair((s) => b.box([0.14, 0.5, 0.14], [s * 0.32, 0.38, 0], { color: 'red', rot: [0, 0, s * 12], round: 0.4 }).box([0.15, 0.06, 0.15], [s * 0.37, 0.15, 0], { color: 'green', rot: [0, 0, s * 12], round: 0.4 }));
    b.each(5, (i) => b.ball(0.02, [-0.16 + i * 0.08, 0.2, 0.082], { color: 'white', noInk: true }));
    ([[-0.03, 0.33, 'yellow'], [0.035, 0.36, 'blue'], [0, 0.4, 'red'], [-0.04, 0.29, 'lime']] as const).forEach(([x, y, c], i) => b.ball(0.016, [x, y, 0.09], { color: c, glow: true, name: `bulb${i}`, mover: { kind: 'light', on: true } }));
    return b.act({ click: [A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.wait(0.3), A.operate('bulb', 'off'), A.wait(0.3), A.operate('bulb', 'on'), A.say('Ho ho ho!', 1.2)] }).done();
  }),
  // A potted chrysanthemum: three golden pompom blooms over dark leaves; they open up.
  e('chrysanthemum', 'garden', 'flowers', () => {
    const b = m('chrysanthemum')
      .cyl([0.22, 0.18, 0.22], [0, 0.09, 0], { color: '#c8673a', taper: 1.2 })
      .cyl([0.24, 0.015, 0.24], [0, 0.18, 0], { color: 'dirt' });
    ([[0, 0.62, 0, 'head'], [-0.1, 0.52, 0.04, 'head2'], [0.11, 0.55, -0.03, 'head3']] as const).forEach(([x, y, z, n]) => {
      b.rod([x * 0.3, 0.18, z * 0.3], [x, y - 0.02, z], 0.012, 'green');
      b.ball([0.06, 0.05, 0.06], [x, y, z], { color: '#e8a020', name: n, pivot: [x, y - 0.03, z] });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        b.rod([x + Math.cos(a) * 0.02, y, z + Math.sin(a) * 0.02], [x + Math.cos(a) * 0.075, y + 0.012, z + Math.sin(a) * 0.075], 0.022, i % 2 ? '#f6c21c' : '#f0a020', { parent: n });
      }
    });
    around(6, 0.1, 0.3).forEach(([x, z], i) => b.ball([0.09, 0.02, 0.05], [x, 0.3 + (i % 3) * 0.06, z], { color: '#3f7a3a', rot: [0, (-Math.atan2(z, x) * 180) / Math.PI, 20] }));
    return b.act({ click: [A.par(A.pose('head', { scale: 1.35, dur: 0.6 }), A.pose('head2', { scale: 1.3, dur: 0.7 }), A.pose('head3', { scale: 1.3, dur: 0.8 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1), A.par(A.pose('head', { scale: 1, dur: 0.5 }), A.pose('head2', { scale: 1, dur: 0.5 }), A.pose('head3', { scale: 1, dur: 0.5 }))] }).done();
  }),
  // A village church at real size: a whitewashed nave with a steep roof and lancet windows, a tower with a bell
  // that swings in the open belfry, a spire with a cross, and an arched door that opens.
  e('church', 'places', 'religious', () => {
    const b = m('church', { edge: 'sharp' })
      .box([7, 6, 14], [0, 3, -3], { color: '#f2efe6', round: 0.01 })
      .wedge([7.8, 4.5, 14.6], [0, 8.25, -3], { color: '#8a3a2e' })
      .box([4.2, 12, 4.2], [0, 6, 6], { color: '#f2efe6', round: 0.01 })
      .box([4.4, 0.3, 4.4], [0, 12.15, 6], { color: '#8a3a2e' })
      .pyramid([4.3 * Math.SQRT2, 8, 4.3 * Math.SQRT2], [0, 16.3, 6], 4, { color: '#8a3a2e' })
      .stick([0, 20.2, 6], [0, 21.8, 6], 0.15, 'gold')
      .stick([-0.45, 21.2, 6], [0.45, 21.2, 6], 0.15, 'gold')
      .box([2.0, 2.4, 4.3], [0, 10.4, 6], { color: '#3a3330' })
      .box([4.3, 2.4, 2.0], [0, 10.4, 6], { color: '#3a3330' })
      .cyl([0.7, 0.2, 0.7], [0, 11.3, 6], { color: 'darkwood' })
      .cone([1.3, 1.4, 1.3], [0, 10.3, 6], { color: 'bronze', name: 'bell', pivot: [0, 11.1, 6], mover: { kind: 'swing', axis: 'x', amount: 30 } })
      .cyl([1.6, 0.15, 1.6], [0, 9.6, 6], { color: 'bronze', parent: 'bell' })
      .cyl([1.4, 0.2, 1.4], [0, 7.3, 8.12], { color: 'glass', rot: [90, 0, 0] })
      .label('ST. MARY', [2.2, 0.4], [0, 5.5, 8.13], { color: '#f2efe6', depth: 0.02 })
      .arc([1.7, 3.2, 0.25], [0, 1.9, 8.12], { color: '#a39c8e', tube: 0.16 })
      .box([1.4, 2.5, 0.1], [0, 1.25, 8.15], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.25, 8.15], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .ball(0.08, [0.45, 1.2, 8.22], { color: 'iron', parent: 'door' })
      .box([2.0, 0.25, 1.0], [0, 0.12, 8.7], { color: 'stone' });
    b.pair((s) => {
      b.each(4, (i) => {
        b.box([0.1, 2.2, 0.7], [s * 3.5, 3.0, -8 + i * 3], { color: '#3f5fa8', round: 0.1 });
        b.box([0.12, 0.08, 0.86], [s * 3.52, 1.86, -8 + i * 3], { color: '#e6e1d6' });
        b.pyramid([0.7, 0.45, 0.1], [s * 3.5, 4.32, -8 + i * 3], 3, { color: '#3f5fa8', rot: [0, 90, 0] });
      });
      b.each(5, (i) => b.box([0.6, 3.2, 0.6], [s * 3.7, 1.6, -9.5 + i * 3], { color: '#e6e1d6' }));
    });
    return b
      .act({ click: [[A.pose('bell', { rot: [30, 0, 0], dur: 0.6 }), A.say('Ding...', 1), A.pose('bell', { rot: [-30, 0, 0], dur: 0.9 }), A.say('...dong!', 1), A.pose('bell', { rot: [0, 0, 0], dur: 0.6 })], [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')]] })
      .done();
  }),
  // A bronze church bell (a real bell profile from a loft) hung by its headstock in an oak frame, with its clapper;
  // it swings and tolls.
  e('church bell', 'music', 'bells', () => {
    const b = m('church bell')
      .box([1.6, 0.14, 0.2], [0, 1.85, 0], { color: 'darkwood', edge: 'sharp' })
      .box([0.5, 0.2, 0.3], [0, 1.7, 0], { color: 'darkwood', edge: 'sharp', name: 'bell', pivot: [0, 1.75, 0], mover: { kind: 'swing', axis: 'x', amount: 40 } })
      .loft([0.95, 0.95, 0.95], [0, 1.08, 0], [[0, 1, 1], [0.08, 0.95, 0.95], [0.25, 0.78, 0.78], [0.5, 0.62, 0.62], [0.82, 0.58, 0.58], [0.95, 0.5, 0.5], [1, 0.3, 0.3]], { color: 'bronze', rot: [-90, 0, 0], parent: 'bell' })
      .torus([0.98, 0.98, 0.08], [0, 0.64, 0], { color: '#9a6a3a', rot: [90, 0, 0], tube: 0.1, parent: 'bell' })
      .torus([0.62, 0.62, 0.04], [0, 1.2, 0], { color: '#9a6a3a', rot: [90, 0, 0], tube: 0.08, parent: 'bell', noInk: true })
      .stick([0, 1.5, 0], [0, 0.72, 0], 0.05, 'iron', { parent: 'bell' })
      .ball(0.16, [0, 0.7, 0], { color: 'iron', parent: 'bell' });
    b.pair((s) => {
      b.box([0.16, 1.95, 0.18], [s * 0.72, 0.975, 0], { color: 'darkwood', edge: 'sharp' });
      b.box([0.4, 0.1, 0.8], [s * 0.72, 0.05, 0], { color: 'darkwood', edge: 'sharp' });
      b.rod([s * 0.72, 0.1, 0.35], [s * 0.72, 0.8, 0.05], 0.08, 'darkwood');
      b.rod([s * 0.72, 0.1, -0.35], [s * 0.72, 0.8, -0.05], 0.08, 'darkwood');
    });
    return b.act({ click: [A.pose('bell', { rot: [40, 0, 0], dur: 0.6 }), A.say('DONG!', 1.2), A.pose('bell', { rot: [-40, 0, 0], dur: 0.9 }), A.say('DONG!', 1.2), A.pose('bell', { rot: [20, 0, 0], dur: 0.7 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A paper cup of sugared churros with a pot of chocolate; one goes for a dip.
  e('churros', 'food', 'desserts', () => {
    const b = m('churros')
      .cyl([0.08, 0.08, 0.06], [0, 0.04, 0], { color: 'white', taper: 1.3 })
      .box([0.012, 0.08, 0.066], [0.0, 0.04, 0.0], { color: 'red', noInk: true })
      .cyl([0.05, 0.03, 0.05], [0.09, 0.015, 0.04], { color: 'white' })
      .cyl([0.044, 0.006, 0.044], [0.09, 0.03, 0.04], { color: 'chocolate' });
    ([[-0.02, 12], [0.0, 0], [0.02, -12]] as const).forEach(([x, rz], i) => b.cyl([0.024, 0.17, 0.024], [x - Math.sin(rz * RAD) * 0.04, 0.12, 0], { color: '#d9962e', segs: 6, rot: [0, 0, rz], ...(i === 2 ? { name: 'churro' } : {}) }));
    return b.act({ click: [A.pose('churro', { move: [0.09, -0.03, 0.04], rot: [0, 0, -40], dur: 0.4 }), A.say('Dip!', 0.8), A.pose('churro', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A stoneware jug of apple cider with an apple beside it; it tips and pours.
  e('cider', 'food', 'drinks', () =>
    m('cider')
      .ball([0.16, 0.18, 0.16], [0, 0.1, 0], { color: 'tea' })
      .cyl([0.05, 0.08, 0.05], [0, 0.21, 0], { color: 'tea' })
      .cyl([0.056, 0.025, 0.056], [0, 0.26, 0], { color: 'red' })
      .torus([0.07, 0.08, 0.018], [0.05, 0.2, 0], { color: 'tea', rot: [0, 90, 0], tube: 0.25 })
      .label('CIDER', [0.08, 0.04], [0, 0.1, 0.08], { color: 'cream', depth: 0.003 })
      .ball(0.07, [0.12, 0.035, 0.07], { color: 'red' })
      .rod([0.12, 0.07, 0.07], [0.125, 0.085, 0.07], 0.006, 'darkbrown')
      .act({ click: [A.par(A.set({ tilt: 40, dur: 0.4 }), A.say('Glug, glug...', 1.5)), A.wait(1), A.set({ tilt: 0, dur: 0.4 })] })
      .done(),
  ),
  // A glowing cinder on a bed of ash; blow on it and it flares and smokes.
  e('cinder', 'nature', 'fire', () =>
    m('cinder')
      .cyl([0.12, 0.01, 0.1], [0, 0.005, 0], { color: 'gray' })
      .ball([0.07, 0.04, 0.06], [-0.01, 0.022, 0], { color: '#3a3330', rot: [0, 30, 10] })
      .ball([0.045, 0.03, 0.04], [0.035, 0.018, 0.02], { color: '#2a2524', rot: [0, -20, 0] })
      .ball([0.025, 0.015, 0.02], [0.0, 0.038, 0.02], { color: 'orange', glow: true, name: 'glow' })
      .ball([0.02, 0.012, 0.015], [0.035, 0.03, 0.035], { color: 'fire', glow: true, parent: 'glow' })
      .ball([0.018, 0.01, 0.015], [-0.03, 0.03, 0.025], { color: 'red', glow: true, parent: 'glow' })
      .act({ click: [A.par(A.pose('glow', { scale: 1.6, dur: 0.4 }), A.effect('smoke', { dur: 1.5 }), A.say('Crackle...', 1.2)), A.pose('glow', { scale: 1, dur: 0.6 })] })
      .done(),
  ),
  // A bundle of cinnamon sticks tied with twine; a sniff of spice.
  e('cinnamon', 'food', 'spices', () => {
    const b = m('cinnamon').torus([0.05, 0.05, 0.01], [0, 0.075, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.2 });
    around(4, 0.013).forEach(([x, z], i) => b.cyl([0.016, 0.15 - i * 0.008, 0.016], [x, 0.075 - i * 0.004, z], { color: '#8b4a2a' }).box([0.004, 0.14 - i * 0.008, 0.004], [x, 0.075 - i * 0.004, z + 0.008], { color: '#5a2e18', noInk: true }));
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('sparkle', { dur: 1.2 }), A.say('Mmm, spicy!', 1.4))] }).done();
  }),
  // A sticky cinnamon roll on a plate, its spiral glazed; warm from the oven.
  e('cinnamon bun', 'food', 'bakery', () => {
    const b = plate(m('cinnamon bun'), 0.16).cyl([0.11, 0.035, 0.11], [0, 0.03, 0], { color: 'bread' }).ball([0.11, 0.035, 0.11], [0, 0.047, 0], { color: 'bread' });
    for (const d of [0.09, 0.062, 0.034]) b.torus([d, d, 0.008], [0, 0.064 - (0.09 - d) * 0.05, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.1, noInk: true });
    path(b, [[-0.04, 0.066, -0.02], [-0.02, 0.068, 0.02], [0.0, 0.068, -0.025], [0.02, 0.068, 0.025], [0.04, 0.066, -0.02]], 0.006, 'white');
    return b.act({ click: [A.par(A.effect('steam', { dur: 1.8 }), A.anim('bounce'))] }).done();
  }),
  // A blue ring on a little stand: the circle spins.
  e('circle', 'ideas', 'shapes', () =>
    m('circle')
      .box([0.06, 0.012, 0.03], [0, 0.006, 0], { color: 'darkgray', edge: 'sharp' })
      .torus([0.09, 0.09, 0.016], [0, 0.057, 0], { color: 'blue', tube: 0.15, name: 'ring' })
      .act({ click: [A.pose('ring', { rot: [0, 720, 0], dur: 1.2 }), A.pose('ring', { rot: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A simple circuit on a board: a battery, wires, a knife switch and a bulb that lights when the switch closes.
  e('circuit', 'tech', 'electronics', () => {
    const b = m('circuit')
      .box([0.22, 0.014, 0.15], [0, 0.007, 0], { color: 'wood', round: 0.2, edge: 'sharp' })
      .cyl([0.032, 0.075, 0.032], [-0.05, 0.03, -0.03], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.033, 0.03, 0.033], [-0.07, 0.03, -0.03], { color: 'copper', rot: [0, 0, 90] })
      .cyl([0.022, 0.025, 0.022], [0.065, 0.026, -0.02], { color: 'silver' })
      .ball([0.04, 0.042, 0.04], [0.065, 0.058, -0.02], { color: '#fff2b0', glow: true, name: 'bulb', mover: { kind: 'light' } })
      .box([0.03, 0.012, 0.02], [0.0, 0.02, 0.045], { color: 'darkgray', edge: 'sharp' })
      .stick([-0.012, 0.026, 0.045], [0.004, 0.05, 0.045], 0.004, 'silver', { name: 'switch', pivot: [-0.012, 0.026, 0.045] });
    path(b, [[-0.09, 0.03, -0.03], [-0.095, 0.02, 0.045], [-0.015, 0.02, 0.045]], 0.005, 'red');
    path(b, [[0.015, 0.02, 0.045], [0.065, 0.02, 0.045], [0.065, 0.02, -0.005]], 0.005, 'red');
    path(b, [[-0.012, 0.03, -0.03], [0.04, 0.02, -0.03], [0.055, 0.022, -0.02]], 0.005, 'black');
    return b.act({ click: [[A.pose('switch', { rot: [0, 0, -50], dur: 0.25 }), A.operate('bulb', 'on'), A.say('Click!', 0.8)], [A.pose('switch', { rot: [0, 0, 0], dur: 0.25 }), A.operate('bulb', 'off')]] }).done();
  }),
  // A consumer unit with two rows of breakers; one trips with a spark and is switched back on.
  e('circuit breaker', 'tech', 'electrical', () => {
    const b = m('circuit breaker', { edge: 'sharp' }).box([0.12, 0.15, 0.05], [0, 0.075, 0], { color: 'lightgray', round: 0.15 }).box([0.1, 0.13, 0.004], [0, 0.075, 0.025], { color: 'gray' });
    for (const x of [-0.025, 0.025]) b.each(4, (i) => b.box([0.035, 0.022, 0.01], [x, 0.03 + i * 0.03, 0.03], { color: 'black', round: 0.2 }).box([0.008, 0.012, 0.012], [x + (i % 2 ? 0.008 : -0.008), 0.03 + i * 0.03, 0.037], { color: 'white', ...(x > 0 && i === 2 ? { name: 'lever', pivot: [x, 0.09, 0.032] as V } : {}) }));
    return b.act({ click: [[A.par(A.pose('lever', { rot: [0, 0, 180], dur: 0.15 }), A.effect('sparkle', { dur: 0.6 }), A.say('Click! Trip!', 1))], [A.pose('lever', { rot: [0, 0, 0], dur: 0.2 }), A.say('Click.', 0.8)]] }).done();
  }),
  // A corded 18 cm circular saw resting on the plank it is cutting, pointing forward along its pencil line: a steel
  // shoe, the toothed blade sunk through it into the wood under the half-round blade guard, the yellow motor sticking
  // out on the left with its black end cap, a closed D-handle with a red trigger on top and a front knob. The blade
  // spins up and the saw runs forward along the line in a spray of sawdust.
  e('circular saw', 'workshop', 'power tools', () => {
    const Y = '#f2b705', P = { parent: 'saw' };
    const b = m('circular saw', { edge: 'sharp' })
      .box([0.24, 0.035, 0.62], [0, 0.0175, 0.04], { color: 'lightwood', round: 0.08 })
      .box([0.004, 0.002, 0.2], [-0.045, 0.0355, 0.26], { color: '#4a4a4a', round: 0, noInk: true })
      .box([0.17, 0.008, 0.3], [0, 0.039, 0], { color: 'silver', round: 0.15, name: 'saw' })
      // the blade (axis along x), its teeth and arbor nut, under the guard
      .cyl([0.184, 0.003, 0.184], [-0.045, 0.095, 0.02], { color: 'silver', rot: [0, 0, 90], name: 'blade', mover: { kind: 'spin', axis: 'y', amount: 1500 }, ...P })
      .cyl([0.03, 0.008, 0.03], [-0.05, 0.095, 0.02], { color: '#3a3d42', rot: [0, 0, 90], parent: 'blade' });
    b.each(16, (i) => {
      const a = (i / 16) * Math.PI * 2;
      b.cone([0.004, 0.012, 0.012], [-0.045, 0.095 + Math.sin(a) * 0.092, 0.02 + Math.cos(a) * 0.092], { color: 'silver', rot: [-(a * 180) / Math.PI, 0, 0], parent: 'blade', noInk: true });
    });
    b.arc([0.24, 0.24, 0.06], [-0.043, 0.095, 0.02], { color: '#4a4e54', rot: [0, 90, 0], tube: 0.92, ...P })
      .box([0.025, 0.03, 0.045], [-0.042, 0.175, -0.075], { color: '#3a3d42', rot: [-40, 0, 0], round: 0.3, ...P })
      // body, motor and its end cap
      .box([0.06, 0.09, 0.11], [-0.003, 0.11, 0.0], { color: Y, round: 0.4, ...P })
      .cyl([0.088, 0.1, 0.088], [0.045, 0.11, -0.01], { color: Y, rot: [0, 0, 90], ...P })
      .cyl([0.09, 0.022, 0.09], [0.1, 0.11, -0.01], { color: '#2a2c30', rot: [0, 0, 90], ...P })
      // the D-handle with its trigger, the rear foot and the front knob
      .rod([0, 0.15, 0.0], [0, 0.225, -0.045], 0.03, Y, P)
      .rod([0, 0.225, -0.045], [0, 0.22, -0.135], 0.032, '#2a2c30', P)
      .rod([0, 0.22, -0.135], [0, 0.075, -0.12], 0.03, Y, P)
      .box([0.05, 0.04, 0.06], [0, 0.065, -0.11], { color: Y, round: 0.4, ...P })
      .box([0.012, 0.026, 0.02], [0, 0.195, -0.09], { color: '#d32f2f', round: 0.3, ...P })
      .stick([0.02, 0.1, 0.07], [0.025, 0.135, 0.095], 0.016, '#2a2c30', P)
      .ball(0.038, [0.026, 0.145, 0.1], { color: '#2a2c30', ...P });
    return b
      .act({ click: [A.operate('blade', 'on'), A.par(A.pose('saw', { move: [0, 0, 0.14], dur: 1.4 }), A.effect('dust', { dur: 1.5 }), A.say('Bzzzzzzz!', 1.5)), A.operate('blade', 'off'), A.pose('saw', { move: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // Clam chowder in a sourdough bread bowl, the lid of crust beside it; steaming.
  e('clam chowder', 'food', 'soups', () =>
    m('clam chowder')
      .ball([0.18, 0.13, 0.18], [0, 0.065, 0], { color: 'crust' })
      .cyl([0.14, 0.012, 0.14], [0, 0.12, 0], { color: 'cream' })
      .box([0.015, 0.012, 0.015], [0.02, 0.127, 0.02], { color: 'beige' })
      .box([0.015, 0.012, 0.015], [-0.03, 0.127, -0.01], { color: 'beige' })
      .ball([0.012, 0.004, 0.012], [0.0, 0.128, -0.03], { color: 'leaf' })
      .ball([0.12, 0.04, 0.12], [0.12, 0.05, -0.06], { color: 'crust', rot: [0, 0, 35] })
      .ball([0.045, 0.02, 0.04], [0.09, 0.01, 0.09], { color: 'tan' })
      .act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Mmm, chowder!', 1.5))] })
      .done(),
  ),
  // A B-flat clarinet standing on its bell: black wood, silver rings and keys, a mouthpiece with its reed.
  e('clarinet', 'music', 'woodwinds', () => {
    const b = m('clarinet')
      .cyl([0.075, 0.075, 0.075], [0, 0.0375, 0], { color: 'black', taper: 0.45 })
      .cyl([0.032, 0.56, 0.032], [0, 0.35, 0], { color: 'black' })
      .cyl([0.04, 0.04, 0.04], [0, 0.63, 0], { color: 'black' })
      .cone([0.03, 0.07, 0.03], [0, 0.685, 0], { color: 'black' })
      .box([0.016, 0.04, 0.004], [0, 0.69, 0.012], { color: 'tan' });
    for (const y of [0.08, 0.34, 0.61]) b.torus([0.04, 0.04, 0.01], [0, y, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.2 });
    b.each(6, (i) => b.ball(0.012, [0, 0.14 + i * 0.07, 0.017], { color: 'silver', name: `key${i}` }));
    b.stick([0.018, 0.2, 0.01], [0.018, 0.5, 0.01], 0.004, 'silver');
    return b.act({ click: [A.par(A.anim('wobble'), A.say('♪ Doo-dee-doo-dah ♪', 2.2), A.pose('key2', { move: [0, 0, -0.004], dur: 0.2 }), A.pose('key4', { move: [0, 0, -0.004], dur: 0.3 })), A.par(A.pose('key2', { move: [0, 0, 0], dur: 0.1 }), A.pose('key4', { move: [0, 0, 0], dur: 0.1 }))] }).done();
  }),
  // A classroom cut open like a stage set: windows along one wall, a blackboard, a wall clock and school bell,
  // the teacher's desk and rows of pupils' desks and chairs at real size, a door that opens.
  e('classroom', 'places', 'rooms', () => {
    const b = m('classroom', { edge: 'sharp' })
      .box([7, 0.12, 6], [0, 0.06, 0], { color: 'lightwood' })
      .box([7, 3, 0.2], [0, 1.5, -3.0], { color: '#f2e6cf' })
      .box([0.2, 3, 6], [-3.5, 1.5, 0], { color: '#f2e6cf' })
      .box([3.4, 1.25, 0.06], [0.4, 1.55, -2.88], { color: 'wood' })
      .box([3.3, 1.15, 0.07], [0.4, 1.55, -2.87], { color: '#2f5d40' })
      .label('A B C  1 2 3', [2.4, 0.3], [0.4, 1.75, -2.82], { color: '#2f5d40', depth: 0.005 })
      .cyl([0.4, 0.05, 0.4], [-2.2, 2.4, -2.88], { color: 'white', rot: [90, 0, 0] })
      .box([0.02, 0.15, 0.01], [-2.2, 2.45, -2.85], { color: 'black' })
      .cyl([0.25, 0.12, 0.25], [2.6, 2.5, -2.85], { color: 'red', rot: [90, 0, 0], name: 'bell' })
      .box([0.9, 2.05, 0.06], [-3.38, 1.08, 2.0], { color: 'darkwood', rot: [0, 90, 0], name: 'door', pivot: [-3.38, 1.08, 1.55], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([1.4, 0.75, 0.7], [1.8, 0.45, -1.8], { color: 'darkwood' })
      .box([0.5, 0.45, 0.5], [1.8, 0.35, -1.1], { color: 'darkwood' });
    b.each(2, (i) => b.box([0.06, 1.3, 1.6], [-3.38, 1.7, -2.0 + i * 2.0], { color: 'glass' }));
    for (const x of [-1.6, 0, 1.6]) for (const z of [0.2, 1.8]) {
      b.box([1.0, 0.04, 0.55], [x, 0.75, z], { color: 'lightwood' });
      b.pair((s) => b.box([0.04, 0.72, 0.04], [x + s * 0.45, 0.38, z], { color: 'steel' }));
      b.box([0.4, 0.04, 0.4], [x, 0.45, z + 0.5], { color: '#4e8fd6' }).box([0.4, 0.4, 0.04], [x, 0.66, z + 0.72], { color: '#4e8fd6' });
      b.pair((s) => b.box([0.03, 0.44, 0.03], [x + s * 0.17, 0.22, z + 0.5], { color: 'steel' }));
    }
    return b
      .socket('desk', [1.8, 0.83, -1.8], 'top', { size: 0.6 })
      .act({ click: [[A.pose('bell', { rot: [0, 0, 8], dur: 0.05 }), A.say('Brrrrring!', 2), A.pose('bell', { rot: [0, 0, -8], dur: 0.05 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.05 })], [A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')]] })
      .done();
  }),
  // A big curved talon on a knuckle; it rakes the air.
  e('claw', 'wild', 'animal parts', () =>
    m('claw')
      .ball([0.045, 0.03, 0.04], [0, 0.015, 0], { color: 'darkgray', name: 'claw', pivot: [0, 0.01, 0] })
      .rod([0, 0.02, 0], [0.01, 0.06, 0], 0.03, '#3a3330', { parent: 'claw' })
      .rod([0.01, 0.06, 0], [0.035, 0.085, 0], 0.022, '#3a3330', { parent: 'claw' })
      .rod([0.035, 0.085, 0], [0.06, 0.08, 0], 0.013, '#3a3330', { parent: 'claw' })
      .cone([0.01, 0.018, 0.01], [0.07, 0.074, 0], { color: '#3a3330', rot: [0, 0, -120], parent: 'claw' })
      .act({ click: [A.pose('claw', { rot: [0, 0, -30], dur: 0.15 }), A.say('Scratch!', 1), A.pose('claw', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // An arcade claw machine at real size: a cabinet with a prize chute, a glass case of plush toys under a gantry,
  // a joystick and button, a lit marquee. Click: the claw drops, grabs and lifts; again: the lights flash.
  e('claw machine', 'toys', 'arcade', () => {
    const b = m('claw machine', { edge: 'sharp' })
      .box([0.9, 0.95, 0.8], [0, 0.475, 0], { color: '#f4a1c0', round: 0.1 })
      .box([0.92, 0.3, 0.82], [0, 1.95, 0], { color: '#f4a1c0', round: 0.1 })
      .box([0.7, 0.2, 0.04], [0, 1.95, 0.42], { color: '#fff1b8', glow: true, name: 'marquee', mover: { kind: 'light', on: true } })
      .label('CLAW', [0.5, 0.14], [0, 1.95, 0.445], { color: '#fff1b8', depth: 0.005 })
      .box([0.86, 0.06, 0.76], [0, 0.97, 0], { color: 'skyblue' })
      .box([0.8, 0.04, 0.04], [0, 1.76, 0], { color: 'silver' })
      .box([0.12, 0.08, 0.12], [0.1, 1.72, 0.05], { color: 'silver', name: 'claw' })
      .stick([0.1, 1.68, 0.05], [0.1, 1.45, 0.05], 0.012, 'silver', { parent: 'claw' })
      .cyl([0.08, 0.05, 0.08], [0.1, 1.43, 0.05], { color: 'silver', parent: 'claw' })
      .box([0.3, 0.12, 0.25], [0, 0.98, 0.52], { color: '#f4a1c0', round: 0.2, rot: [20, 0, 0] })
      .stick([-0.08, 1.04, 0.55], [-0.08, 1.14, 0.55], 0.02, 'black')
      .ball(0.05, [-0.08, 1.16, 0.55], { color: 'red' })
      .cyl([0.06, 0.03, 0.06], [0.08, 1.05, 0.56], { color: 'blue', rot: [20, 0, 0] })
      .box([0.22, 0.18, 0.04], [0.22, 0.38, 0.41], { color: '#2a2726' })
      .box([0.08, 0.05, 0.02], [-0.25, 0.65, 0.41], { color: '#2a2726' });
    ([0, 120, 240] as const).forEach((a, i) => {
      const r = a * RAD;
      b.rod([0.1 + Math.cos(r) * 0.03, 1.41, 0.05 + Math.sin(r) * 0.03], [0.1 + Math.cos(r) * 0.07, 1.32, 0.05 + Math.sin(r) * 0.07], 0.012, 'silver', { parent: 'claw', ...(i === 0 ? {} : {}) });
    });
    for (const [x, z] of [[0.43, 0.38], [-0.43, 0.38], [0.43, -0.38], [-0.43, -0.38]]) b.box([0.04, 0.82, 0.04], [x, 1.39, z], { color: '#f4a1c0' });
    b.box([0.04, 0.78, 0.74], [0.44, 1.39, 0], { color: 'glass', noInk: true }).box([0.84, 0.78, 0.04], [0, 1.39, -0.4], { color: 'glass', noInk: true });
    for (const [x, z, c] of [[-0.2, 0.1, 'yellow'], [0.15, -0.1, 'skyblue'], [0.25, 0.15, 'lime'], [-0.1, -0.2, 'purple'], [0.1, 0.12, '#c8a070']] as const) b.ball(0.14, [x, 1.07, z], { color: c, edge: 'soft' });
    return b
      .act({ click: [[A.say('Whirrr...', 1), A.pose('claw', { move: [0, -0.3, 0], dur: 0.8 }), A.say('Grab!', 0.8), A.pose('claw', { move: [0, 0, 0], dur: 0.8 }), A.say('So close!', 1)], [A.operate('marquee', 'off'), A.wait(0.3), A.operate('marquee', 'on'), A.wait(0.3), A.operate('marquee', 'off'), A.wait(0.3), A.operate('marquee', 'on')]] })
      .done();
  }),
  // A big cat's paw with its claws out; they flex.
  e('claws', 'wild', 'animal parts', () => {
    const b = m('claws').ball([0.09, 0.04, 0.08], [0, 0.02, -0.01], { color: 'darkbrown' }).ball([0.04, 0.012, 0.03], [0, 0.04, 0.0], { color: '#3a2a20', noInk: true });
    b.each(4, (i) => {
      const x = -0.033 + i * 0.022;
      b.ball(0.024, [x, 0.025, 0.035], { color: 'darkbrown' });
      b.rod([x, 0.03, 0.045], [x, 0.03, 0.065], 0.009, 'cream', { name: `nail${i}`, pivot: [x, 0.03, 0.045] }).rod([x, 0.03, 0.065], [x, 0.012, 0.08], 0.009, 'cream', { parent: `nail${i}` });
    });
    const flex = (z: number) => A.par(...[0, 1, 2, 3].map((i) => A.pose(`nail${i}`, { move: [0, 0, z], dur: 0.2 })));
    return b.act({ click: [flex(0.02), A.say('Hisss!', 1), flex(0)] }).done();
  }),
  // Modelling clay: a pot, some balls and a rolled snake in bright colours; the pink ball squishes.
  e('clay', 'toys', 'crafts', () =>
    m('clay')
      .cyl([0.07, 0.07, 0.07], [-0.06, 0.035, -0.03], { color: 'yellow', edge: 'sharp' })
      .cyl([0.075, 0.015, 0.075], [-0.06, 0.077, -0.03], { color: 'red', edge: 'sharp' })
      .ball([0.05, 0.04, 0.05], [0.04, 0.02, -0.02], { color: 'blue' })
      .ball([0.04, 0.03, 0.04], [0.01, 0.015, 0.05], { color: 'lime' })
      .rod([0.04, 0.008, 0.05], [0.1, 0.008, 0.03], 0.016, 'red')
      .ball(0.035, [0.08, 0.06, -0.02], { color: 'pink', name: 'blob' })
      .act({ click: [A.pose('blob', { scale: 0.7, move: [0, -0.01, 0], dur: 0.2 }), A.say('Squish!', 1), A.pose('blob', { scale: 1, move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A 4 m bouldering wall with an overhang: coloured holds, a top rope from an anchor, a thick crash mat. A
  // climber reaches the top.
  e('climbing wall', 'sports', 'climbing', () => {
    const b = m('climbing wall', { edge: 'sharp' })
      .box([3.6, 3.0, 0.3], [0, 1.5, -0.4], { color: '#9aa7b3', round: 0.05 })
      .box([3.6, 1.2, 0.3], [0, 3.5, -0.1], { color: '#8a97a3', round: 0.05, rot: [25, 0, 0] })
      .box([3.8, 0.3, 1.6], [0, 0.15, 0.7], { color: '#2f6fb0', round: 0.4, edge: 'soft' })
      .box([0.12, 4.2, 0.12], [-1.86, 2.1, -0.6], { color: '#5c6166' })
      .box([0.12, 4.2, 0.12], [1.86, 2.1, -0.6], { color: '#5c6166' })
      .stick([0.9, 4.0, 0.3], [0.9, 0.35, 0.2], 0.03, 'red', { name: 'rope', pivot: [0.9, 4.0, 0.3] })
      .cyl([0.1, 0.1, 0.1], [0.9, 4.02, 0.3], { color: 'silver' });
    const cols = ['red', 'yellow', 'green', 'orange', 'purple', 'blue'];
    for (let i = 0; i < 24; i++) {
      const x = -1.5 + ((i * 7) % 13) * 0.24, y = 0.5 + ((i * 5) % 17) * 0.2;
      b.ball([0.16, 0.12, 0.1], [x, y, -0.22], { color: cols[i % 6], rot: [0, 0, i * 30], edge: 'soft' });
    }
    return b
      .socket('hold', [-0.6, 2.0, -0.05], 'top', { size: 1.5 })
      .act({ click: [A.spawn('climber', 'girl'), A.attach('climber', 'self', 'hold'), A.par(A.anim('arms_up', 1, 'climber'), A.say('I made it to the top!', 2, 'climber')), A.pose('rope', { rot: [8, 0, 0], dur: 0.3 }), A.pose('rope', { rot: [0, 0, 0], dur: 0.3 }), A.remove('climber', 'fade')] })
      .done();
  }),
  // A silver paperclip standing on end; it twirls.
  e('clip', 'study', 'office supplies', () => {
    const b = m('clip');
    const pts: V[] = [[0.004, 0.022, 0], [0.004, 0.055, 0], ...arc(-0.002, 0.055, 0.006, 0.006, 0, 180, 3).slice(1), [-0.008, 0.012, 0], ...arc(0.002, 0.012, 0.01, 0.01, 180, 360, 4).slice(1), [0.012, 0.064, 0], ...arc(0, 0.064, 0.012, 0.012, 0, 180, 4).slice(1), [-0.012, 0.03, 0]];
    pts.forEach((p, i) => i && b.rod(pts[i - 1], p, 0.006, 'silver', i === 1 ? { name: 'clip', pivot: [0, 0, 0] } : { parent: 'clip' }));
    return b.act({ click: [A.par(A.pose('clip', { rot: [0, 720, 0], dur: 1 }), A.effect('sparkle', { dur: 1 })), A.pose('clip', { rot: [0, 0, 0], dur: 0.01 })] }).done();
  }),
  // A hooded velvet cloak with a gold clasp, hung on a wooden stand; it swirls.
  e('cloak', 'wardrobe', 'outerwear', () =>
    m('cloak')
      .box([0.5, 0.05, 0.4], [0, 0.025, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.05, 0], [0, 1.55, 0], 0.04, 'darkwood')
      .cyl([0.8, 1.25, 0.55], [0, 0.78, 0], { color: '#5a2a8a', taper: 0.45, name: 'cloak', pivot: [0, 1.45, 0] })
      .ball([0.46, 0.2, 0.32], [0, 1.4, 0], { color: '#5a2a8a', parent: 'cloak' })
      .ball([0.3, 0.33, 0.3], [0, 1.6, -0.06], { color: '#5a2a8a', parent: 'cloak' })
      .ball([0.2, 0.24, 0.1], [0, 1.58, 0.07], { color: '#2a1f33', parent: 'cloak' })
      .ball(0.05, [0, 1.36, 0.17], { color: 'gold', parent: 'cloak' })
      .box([0.02, 1.0, 0.02], [0, 0.72, 0.22], { color: '#3f1f66', rot: [-11, 0, 0], noInk: true, parent: 'cloak' })
      .act({ click: [A.par(A.pose('cloak', { rot: [0, 360, 0], dur: 0.9 }), A.say('Swoosh!', 1)), A.pose('cloak', { rot: [0, 0, 0], dur: 0.01 })] })
      .done(),
  ),
  // A mahogany mantel clock, 42 cm wide (the plain "clock"; the alarm, cuckoo, grandfather and digital clocks have
  // their own words): a "Napoleon hat" case swelling from low scrolled ends to a round hump, on a plinth with a
  // brass-lined front, a cream dial in a brass bezel with hour marks and hands. Its hands sweep round and it chimes.
  e('clock', 'home', 'clocks', () => {
    const b = m('clock', { edge: 'sharp' })
      .box([0.44, 0.025, 0.13], [0, 0.0125, 0], { color: '#3e1f12', round: 0.25 })
      .loft([0.12, 0.44, 0.42], [0, 0.025, 0], [[0, 0.85, 0.32, 0], [0.08, 0.9, 0.36, 0], [0.2, 0.95, 0.44, 0], [0.3, 1, 0.62, 0], [0.38, 1, 0.86, 0], [0.5, 1, 1, 0], [0.62, 1, 0.86, 0], [0.7, 1, 0.62, 0], [0.8, 0.95, 0.44, 0], [0.92, 0.9, 0.36, 0], [1, 0.85, 0.32, 0]], { color: '#5a2f1a', boxy: 0.85, cut: 'top', rot: [0, 90, 0], name: 'body' })
      .box([0.36, 0.005, 0.002], [0, 0.042, 0.061], { color: 'brass', round: 0, noInk: true })
      .cyl([0.14, 0.006, 0.14], [0, 0.118, 0.062], { color: 'cream', rot: [90, 0, 0] })
      .torus([0.156, 0.156, 0.014], [0, 0.118, 0.064], { color: 'brass', tube: 0.12 })
      .box([0.005, 0.05, 0.003], [0, 0.141, 0.067], { color: 'black', round: 0, name: 'minute', pivot: [0, 0.118, 0.067] })
      .box([0.032, 0.007, 0.003], [-0.013, 0.118, 0.068], { color: 'black', round: 0, name: 'hour', pivot: [0, 0.118, 0.068] })
      .ball(0.01, [0, 0.118, 0.069], { color: 'brass' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.004, i % 3 ? 0.008 : 0.014, 0.002], [Math.sin(a) * 0.056, 0.118 + Math.cos(a) * 0.056, 0.066], { color: 'black', rot: [0, 0, -i * 30], round: 0, noInk: true });
    });
    return b
      .act({ click: [A.par(A.pose('minute', { rot: [0, 0, -720], dur: 1.2 }), A.pose('hour', { rot: [0, 0, -60], dur: 1.2 })), A.say('Bong... bong... bong!', 2.2), A.par(A.pose('minute', { rot: [0, 0, 0], dur: 0.01 }), A.pose('hour', { rot: [0, 0, 0], dur: 0.01 }))] })
      .done();
  }),
  // A wall clock face in a wooden rim on a little stand; its hands sweep round.
  e('clock face', 'home', 'clocks', () => {
    const b = m('clock face')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .cyl([0.24, 0.02, 0.24], [0, 0.13, 0], { color: 'cream', rot: [90, 0, 0] })
      .torus([0.25, 0.25, 0.03], [0, 0.13, 0.002], { color: 'darkwood', tube: 0.1 })
      .box([0.01, 0.075, 0.004], [0, 0.163, 0.013], { color: 'black', name: 'minute', pivot: [0, 0.13, 0.013] })
      .box([0.055, 0.01, 0.004], [0.024, 0.13, 0.014], { color: 'black', name: 'hour', pivot: [0, 0.13, 0.014] })
      .ball(0.014, [0, 0.13, 0.014], { color: 'black' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.006, i % 3 ? 0.012 : 0.02, 0.004], [Math.sin(a) * 0.098, 0.13 + Math.cos(a) * 0.098, 0.012], { color: 'black', rot: [0, 0, (-a * 180) / Math.PI] });
    });
    return b.act({ click: [A.par(A.pose('minute', { rot: [0, 0, -360], dur: 2 }), A.pose('hour', { rot: [0, 0, -30], dur: 2 }), A.say('Tick, tock, tick, tock...', 2)), A.par(A.pose('minute', { rot: [0, 0, 0], dur: 0.01 }), A.pose('hour', { rot: [0, 0, 0], dur: 0.01 }))] }).done();
  }),
  // A single ornate clock hand on its boss; it ticks round.
  e('clock hand', 'home', 'clocks', () =>
    m('clock hand')
      .cyl([0.03, 0.01, 0.03], [0, 0.02, 0], { color: 'black', rot: [90, 0, 0] })
      .ball(0.014, [0, 0.005, 0], { color: 'black', name: 'hand', pivot: [0, 0.02, 0] })
      .box([0.008, 0.065, 0.005], [0, 0.055, 0], { color: 'black', parent: 'hand' })
      .torus([0.018, 0.018, 0.004], [0, 0.06, 0], { color: 'black', tube: 0.2, parent: 'hand' })
      .cone([0.026, 0.026, 0.005], [0, 0.095, 0], { color: 'black', segs: 4, parent: 'hand' })
      .act({ click: [A.pose('hand', { rot: [0, 0, -30], dur: 0.15 }), A.say('Tick!', 0.6), A.pose('hand', { rot: [0, 0, -60], dur: 0.15 }), A.say('Tock!', 0.6), A.pose('hand', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A Victorian clock tower at its real proportions (the landmark kind, 42 m, shown in the miniature park): a
  // tall stone shaft, a clock face on each side with turning hands, an open belfry and a green spire. (The
  // vocabulary says 1 m; a clock tower is this tall, so the size warning stays.)
  e('clock tower', 'places', 'landmarks', () => {
    const S = '#d9c08a';
    const b = m('clock tower', { edge: 'sharp' })
      .box([9, 1.2, 9], [0, 0.6, 0], { color: 'stone' })
      .box([7, 24, 7], [0, 13, 0], { color: S, round: 0.01 })
      .box([8.2, 8, 8.2], [0, 29, 0], { color: S, round: 0.01 })
      .box([8.6, 0.6, 8.6], [0, 33.3, 0], { color: '#a38a5a' })
      .box([6.2, 3.2, 6.2], [0, 35.2, 0], { color: S })
      .box([6.3, 2.4, 3.4], [0, 35.2, 0], { color: '#2a2726' })
      .box([3.4, 2.4, 6.3], [0, 35.2, 0], { color: '#2a2726' })
      .pyramid([6.6 * Math.SQRT2, 7, 6.6 * Math.SQRT2], [0, 40.3, 0], 4, { color: '#3f6f5a' })
      .stick([0, 43.8, 0], [0, 45.5, 0], 0.2, 'gold')
      .box([2.6, 4.2, 0.2], [0, 3.3, 3.55], { color: '#5a3a22', name: 'door', pivot: [-1.3, 3.3, 3.55], mover: { kind: 'swing', axis: 'y', amount: -95 } });
    b.each(5, (i) => b.box([1.0, 2.8, 0.1], [0, 7 + i * 3.6, 3.52], { color: '#2f3d52' }));
    const faces: Array<[V, V, V]> = [[[0, 29, 4.12], [90, 0, 0], [0, 0, 1]], [[4.12, 29, 0], [0, 0, 90], [1, 0, 0]], [[-4.12, 29, 0], [0, 0, 90], [-1, 0, 0]], [[0, 29, -4.12], [90, 0, 0], [0, 0, -1]]];
    faces.forEach(([at, rot, n], i) => {
      b.cyl([5.6, 0.12, 5.6], at, { color: '#2a2726', rot });
      b.cyl([5.0, 0.16, 5.0], at, { color: 'white', rot });
      if (i === 0) {
        b.box([0.22, 2.1, 0.08], [at[0], at[1] + 0.9, at[2] + 0.12], { color: 'black', name: 'minute', pivot: [at[0], at[1], at[2] + 0.12] })
          .box([1.5, 0.26, 0.08], [at[0] + 0.6, at[1], at[2] + 0.14], { color: 'black', name: 'hour', pivot: [at[0], at[1], at[2] + 0.14] });
      } else b.box(n[0] ? [0.08, 2.1, 0.22] : [0.22, 2.1, 0.08], [at[0] + n[0] * 0.12, at[1] + 0.9, at[2] + n[2] * 0.12], { color: 'black' });
    });
    return b
      .act({ click: [[A.par(A.pose('minute', { rot: [0, 0, -360], dur: 2.5 }), A.pose('hour', { rot: [0, 0, -30], dur: 2.5 })), A.say('BONG! BONG! BONG!', 2.5), A.par(A.pose('minute', { rot: [0, 0, 0], dur: 0.01 }), A.pose('hour', { rot: [0, 0, 0], dur: 0.01 }))], [A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')]] })
      .done();
  }),
  // A Dutch wooden clog with an upturned toe and a painted tulip; clip-clop.
  e('clog', 'wardrobe', 'shoes', () =>
    m('clog', { view: 'side' })
      .loft([0.1, 0.11, 0.3], [0, 0.058, 0], [[0, 0.8, 0.85, 0.02], [0.2, 1, 1, 0], [0.6, 1, 0.92, -0.02], [0.85, 0.75, 0.6, -0.05], [1, 0.25, 0.4, 0.15]], { color: '#e8c23a', boxy: 0.4, name: 'clog' })
      .ball([0.075, 0.02, 0.12], [0, 0.11, -0.05], { color: 'darkwood', parent: 'clog' })
      .ball([0.03, 0.03, 0.01], [0.049, 0.065, 0.05], { color: 'red', rot: [0, 90, 0], noInk: true, parent: 'clog' })
      .box([0.004, 0.04, 0.008], [0.05, 0.04, 0.05], { color: 'green', noInk: true, parent: 'clog' })
      .act({ click: [A.anim('hop'), A.say('Clop!', 0.7), A.anim('hop'), A.say('Clop!', 0.7)] })
      .done(),
  ),
  // A closet at real size: a panelled door (2.03 m) in its frame that swings open on a shallow closet with a rail
  // of clothes on hangers.
  e('closet door', 'home', 'doors', () => {
    const b = m('closet door', { edge: 'sharp' })
      .box([1.2, 2.4, 0.62], [0, 1.2, -0.32], { color: '#efe9dc', round: 0.02 })
      .box([1.02, 2.12, 0.04], [0, 1.08, -0.02], { color: '#5c6166' })
      .box([0.1, 2.2, 0.12], [-0.51, 1.1, 0.01], { color: 'white' })
      .box([0.1, 2.2, 0.12], [0.51, 1.1, 0.01], { color: 'white' })
      .box([1.12, 0.1, 0.12], [0, 2.2, 0.01], { color: 'white' })
      .stick([-0.45, 1.85, -0.3], [0.45, 1.85, -0.3], 0.025, 'silver');
    ([[-0.3, '#4e8fd6'], [-0.05, '#e0473b'], [0.22, '#f2e6cf']] as const).forEach(([x, c]) => {
      b.arc([0.18, 0.12, 0.012], [x, 1.78, -0.3], { color: 'darkwood', tube: 0.1, rot: [0, 90, 0] });
      b.box([0.08, 0.8, 0.4], [x, 1.35, -0.3], { color: c, round: 0.4, edge: 'soft' });
    });
    b.box([0.82, 2.03, 0.04], [0, 1.065, 0.04], { color: 'white', name: 'door', pivot: [-0.41, 1.065, 0.04], mover: { kind: 'swing', axis: 'y', amount: -105 } })
      .ball(0.05, [0.32, 1.0, 0.08], { color: 'brass', parent: 'door' });
    for (const y of [0.55, 1.5]) b.box([0.62, 0.75, 0.01], [0, y, 0.065], { color: '#f2f0ea', parent: 'door', round: 0.1 });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creak...', 1)], [A.operate('door', 'close'), A.say('Click.', 0.8)]] }).done();
  }),
  // A wooden clothes peg with its steel spring; it pinches open and snaps shut.
  e('clothespin', 'home', 'laundry', () =>
    m('clothespin')
      .box([0.012, 0.09, 0.012], [0.007, 0.045, 0], { color: 'lightwood', rot: [0, 0, -3], round: 0.3, name: 'armL', pivot: [0.006, 0.055, 0] })
      .box([0.012, 0.09, 0.012], [-0.007, 0.045, 0], { color: 'lightwood', rot: [0, 0, 3], round: 0.3 })
      .torus([0.016, 0.016, 0.014], [0, 0.055, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.25 })
      .act({ click: [A.pose('armL', { rot: [0, 0, 15], dur: 0.2 }), A.wait(0.3), A.pose('armL', { rot: [0, 0, 0], dur: 0.08 }), A.say('Snap!', 0.8)] })
      .done(),
  ),
  // A fluffy cumulus cloud floating overhead; it rains, then rumbles with thunder.
  e('cloud', 'nature', 'weather', () =>
    m('cloud')
      .ball([5, 3, 3.5], [0, 5, 0], { color: 'white' })
      .ball([3.5, 2.6, 3], [-2.4, 4.5, 0.3], { color: 'white' })
      .ball([3.6, 2.8, 3], [2.3, 4.6, 0.2], { color: 'white' })
      .ball([3, 2.6, 2.6], [0.8, 6.1, 0], { color: 'white' })
      .ball([6, 1.2, 3], [0, 3.9, 0], { color: '#e6edf3' })
      .act({ click: [[A.par(A.effect('rain', { dur: 3 }), A.say('Pitter, patter...', 2.5))], [A.par(A.anim('shake'), A.say('Rumble... BOOM!', 2))]] })
      .done(),
  ),
  // A three-leaf clover; click and a lucky fourth leaf appears.
  e('clover', 'garden', 'plants', () => {
    const b = m('clover').rod([0, 0, 0], [0, 0.1, 0], 0.008, 'green');
    for (const a of [90, 210, 330]) {
      const r = a * RAD;
      b.heart(0.055, [Math.cos(r) * 0.026, 0.1 + Math.sin(r) * 0.026, 0], { color: 'green', rot: [0, 0, a - 90] });
    }
    b.heart(0.05, [0.026, 0.088, 0.004], { color: '#6ab04c', rot: [0, 0, -120], name: 'lucky', scale: 0 });
    return b.act({ click: [[A.par(A.pose('lucky', { scale: 1, dur: 0.5 }), A.effect('sparkle', { dur: 1.2 }), A.say('Lucky!', 1.2))], [A.pose('lucky', { scale: 0, dur: 0.4 })]] }).done();
  }),
  // A clown car: a tiny bulbous runabout (2.8 m long, 1.7 m to its red roof cap, so a grown-up only just squeezes
  // in, which is the joke) with a soft yellow body covered in blue polka dots, a glass bubble cabin with red
  // pillars and roof cap, a side door that swings open for the clowns, chrome bumpers, big goggle headlights, fat
  // pink-hubbed wheels on axles, a bulb horn, a squirting flower and a bobbing antenna ball. Click: honk honk, the
  // door opens and clown after clown climbs out.
  e('clown car', 'garage', 'cars', () => {
    const y = '#f6d24a', r = '#e0473b';
    const b = m('clown car', { view: 'side' })
      .loft([1.45, 0.85, 2.8], [0, 0.72, 0], [[0, 0.8, 0.75, 0.05], [0.2, 0.98, 1, 0], [0.7, 1, 0.95, -0.02], [0.92, 0.85, 0.75, -0.08], [1, 0.6, 0.5, -0.12]], { color: y, boxy: 0.35, name: 'body', edge: 'soft' })
      .loft([1.25, 1.0, 1.55], [0, 1.1, -0.3], [[0, 0.75, 0.5, -0.1], [0.25, 0.95, 0.95, 0], [0.75, 0.95, 0.95, 0], [1, 0.8, 0.45, -0.1]], { color: '#9fd0ea', cut: 'top', boxy: 0.5, edge: 'sharp' })
      .dome([1.18, 0.22, 1.12], [0, 1.6, -0.3], { color: r, edge: 'soft' })
      .box([1.32, 0.12, 0.14], [0, 0.42, 1.42], { color: 'silver', round: 0.5, edge: 'sharp' })
      .box([1.32, 0.12, 0.14], [0, 0.44, -1.42], { color: 'silver', round: 0.5, edge: 'sharp' })
      .box([0.035, 0.48, 0.72], [0.72, 0.78, -0.26], { color: y, round: 0.4, name: 'door', pivot: [0.72, 0.78, 0.1], mover: { kind: 'swing', axis: 'y', amount: -75 }, edge: 'sharp' })
      .box([0.05, 0.04, 0.12], [0.745, 0.92, -0.5], { color: 'silver', parent: 'door', edge: 'sharp' })
      .ball(0.13, [0.74, 0.72, -0.2], { color: '#4e8fd6', parent: 'door', noInk: true })
      .stick([0.42, 1.0, -1.0], [0.5, 2.1, -1.0], 0.03, 'black', { name: 'antenna', pivot: [0.42, 1.0, -1.0] })
      .ball(0.2, [0.5, 2.15, -1.0], { color: 'magenta', parent: 'antenna' })
      .ball(0.1, [0.5, 2.15, -0.89], { color: 'yellow', parent: 'antenna' })
      .cone([0.12, 0.22, 0.12], [0.55, 1.08, 0.95], { color: 'gold', rot: [-70, 0, 0], edge: 'sharp' })
      .ball(0.16, [0.55, 1.13, 0.82], { color: r, name: 'horn' })
      .stick([-0.45, 1.0, -0.95], [-0.45, 1.25, -0.95], 0.025, 'darkgreen')
      .ball([0.2, 0.08, 0.2], [-0.45, 1.27, -0.95], { color: 'pink', name: 'flower' })
      .ball(0.06, [-0.45, 1.31, -0.95], { color: 'yellow', parent: 'flower' });
    b.pair((s) => {
      b.box([0.04, 0.42, 0.08], [s * 0.58, 1.34, -0.3], { color: r, round: 0.4, edge: 'sharp' });
      b.ball([0.28, 0.28, 0.12], [s * 0.38, 0.8, 1.28], { color: '#fff6c8', glow: true, name: `light${s > 0 ? 1 : 2}`, mover: { kind: 'light' } });
      b.torus([0.32, 0.32, 0.06], [s * 0.38, 0.8, 1.3], { color: 'silver', tube: 0.18, edge: 'sharp' });
      b.box([0.2, 0.08, 0.04], [s * 0.45, 0.68, -1.4], { color: '#d02a20', glow: true, edge: 'sharp' });
    });
    // polka dots on the body (the right door carries its own)
    for (const [x, yy, z] of [[0.72, 0.62, 0.55], [-0.7, 0.62, 0.35], [-0.68, 0.7, -0.75], [0.62, 0.98, 0.95], [-0.6, 0.98, 0.85], [0.66, 0.7, -1.05]]) b.ball(0.17, [x, yy, z], { color: '#4e8fd6', noInk: true });
    axle(b, 0.62, 0.36, 0.85, 0.72, 0.28, 'wheelF', '#d64fa0');
    axle(b, 0.62, 0.36, -0.85, 0.72, 0.28, 'wheelR', '#d64fa0');
    return b
      .socket('seat', [0, 0.62, -0.35], 'seat')
      .act({
        click: [
          [A.par(A.pose('horn', { scale: 0.7, dur: 0.1 }), A.say('Honk honk!', 1.2)), A.pose('horn', { scale: 1, dur: 0.1 }), A.operate('door', 'open'), A.spawn('c1', 'clown suit', { rel: 'right', of: 'self', dist: 'close' }), A.anim('hop', 1, 'c1'), A.spawn('c2', 'clown suit', { rel: 'left', of: 'self', dist: 'close' }), A.anim('hop', 1, 'c2'), A.par(A.anim('laugh', 1, 'c1'), A.say('Ta-da!', 1.5, 'c2'), A.anim('arms_up', 1, 'c2')), A.wait(0.5), A.par(A.remove('c1', 'fade'), A.remove('c2', 'fade'), A.operate('door', 'close'))],
          [A.operate('light', 'on'), A.par(A.anim('bounce', 3), A.pose('antenna', { rot: [0, 0, 25], dur: 0.3, times: 3 }), A.say('Beep-beep! Boing!', 1.5)), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A red foam clown nose; squeeze it: honk!
  e('clown nose', 'wardrobe', 'costume', () =>
    m('clown nose')
      .ball(0.05, [0, 0.025, 0], { color: 'red', name: 'nose' })
      .ball([0.014, 0.01, 0.006], [0.01, 0.038, 0.02], { color: 'white', noInk: true, parent: 'nose' })
      .act({ click: [A.pose('nose', { scale: 0.75, dur: 0.1 }), A.say('Honk!', 1), A.pose('nose', { scale: 1, dur: 0.15 })] })
      .done(),
  ),
  // A clown in the full suit: spiky orange hair, a party hat, a red nose and bow tie. He laughs and honks, then
  // waves to the children.
  e('clown suit', 'wardrobe', 'outfits', () =>
    withAct(who('clown suit', { top: 'yellow', bottom: 'blue', shoes: 'red', long: true, hair: 'orange', style: 'spiky', acc: [hat('party', 'red'), face('clownnose'), wear('bowtie', 'red')] }), {
      click: [
        [A.par(A.anim('laugh'), A.say('Ha-ha-ha! Honk honk!', 2))],
        [A.par(A.anim('wave'), A.say('Hi there, kids!', 2))],
      ],
    }),
  ),
  // A caveman's knobbly wooden club; it swings down: bonk!
  e('club (weapon)', 'armory', 'clubs', () => {
    const P = diag(-0.2, 0.03, 62);
    const b = m('club (weapon)').stick(P(0), P(0.68), 0.05, 'wood', { taper: 2.6, name: 'club', pivot: P(0) }).ball(0.13, P(0.68), { color: 'wood', parent: 'club' });
    for (const [t, o] of [[0.5, 0.05], [0.6, -0.06], [0.42, -0.04], [0.66, 0.05]] as const) b.ball(0.04, P(t, o, 0.02), { color: 'darkwood', parent: 'club' });
    b.box([0.06, 0.12, 0.055], P(0.06), { color: 'leather', rot: [0, 0, -28] });
    return b.act({ click: [A.pose('club', { rot: [0, 0, 30], dur: 0.3 }), A.pose('club', { rot: [0, 0, -25], dur: 0.12 }), A.say('BONK!', 1), A.pose('club', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // Lumps of glossy black coal; they clatter in a puff of dust.
  e('coal', 'nature', 'rocks', () =>
    m('coal', { edge: 'sharp' })
      .box([0.07, 0.05, 0.06], [0, 0.03, 0], { color: '#2a2726', rot: [10, 30, 15], round: 0.15 })
      .box([0.05, 0.04, 0.05], [0.05, 0.022, 0.03], { color: '#3a3633', rot: [-15, 10, 25], round: 0.15 })
      .box([0.05, 0.04, 0.045], [-0.05, 0.022, 0.03], { color: '#2a2726', rot: [20, -30, 0], round: 0.15 })
      .box([0.04, 0.035, 0.04], [0.02, 0.065, 0.0], { color: '#3a3633', rot: [30, 45, 10], round: 0.15, name: 'lump' })
      .ball([0.02, 0.01, 0.004], [0.0, 0.045, 0.03], { color: 'darkgray', noInk: true })
      .act({ click: [A.par(A.pose('lump', { move: [0.04, -0.03, 0.03], rot: [0, 0, -60], dur: 0.3 }), A.effect('dust', { dur: 1 }), A.say('Clatter!', 1)), A.wait(0.6), A.pose('lump', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A coal mine: a timbered tunnel mouth in a rocky hill with a lamp, rails running out to a loaded mine cart,
  // and a lattice headframe with a winding wheel. Click: the cart rolls out and back; again: the wheel turns.
  e('coal mine', 'places', 'industry', () => {
    const b = m('coal mine')
      .ball([14, 7, 9], [0, 1.2, -3.5], { color: 'rock' })
      .ball([6, 4, 5], [-5, 0.6, -1.5], { color: '#7e7a73' })
      .box([2.4, 2.6, 0.2], [0, 1.3, 0.7], { color: '#1e1c1c', edge: 'sharp' })
      .box([3.2, 0.4, 0.4], [0, 2.8, 0.9], { color: 'darkwood', edge: 'sharp' })
      .label('MINE No. 3', [2.4, 0.4], [0, 3.3, 0.95], { color: 'wood', depth: 0.05 })
      .ball(0.25, [1.5, 2.4, 1.1], { color: '#fff1b8', glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
      .box([1.1, 0.8, 1.6], [0, 0.65, 1.8], { color: 'iron', round: 0.1, edge: 'sharp', name: 'cart' })
      .ball([1.0, 0.45, 1.4], [0, 1.08, 1.8], { color: '#2a2726', parent: 'cart' });
    b.pair((s) => {
      b.box([0.3, 2.8, 0.3], [s * 1.35, 1.4, 0.9], { color: 'darkwood', edge: 'sharp' });
      b.box([0.08, 0.12, 6], [s * 0.45, 0.06, 2.6], { color: 'iron', edge: 'sharp' });
      for (const z of [1.3, 2.3]) b.cyl([0.36, 0.1, 0.36], [s * 0.52, 0.22, z], { color: 'darkgray', rot: [0, 0, 90], parent: 'cart' });
      for (const z of [-1, 1]) b.rod([5.5 + s * 1.6, 0, 2.5 + z * 1.5], [5.5 + s * 0.5, 9, 2.5], 0.2, '#5c6166');
    });
    b.each(9, (i) => b.box([1.3, 0.06, 0.15], [0, 0.03, 0.2 + i * 0.65], { color: 'darkwood', noInk: true, edge: 'sharp' }));
    b.each(4, (i) => b.box([3.0 - i * 0.6, 0.15, 0.15], [5.5, 1.5 + i * 2.0, 2.5], { color: '#5c6166', edge: 'sharp' }));
    b.box([1.4, 0.3, 1.2], [5.5, 9.1, 2.5], { color: '#5c6166', edge: 'sharp' })
      .torus([2.4, 2.4, 0.2], [5.5, 10.3, 2.5], { color: '#b8322a', tube: 0.12, rot: [0, 90, 0], name: 'wheel', mover: { kind: 'spin', axis: 'z', amount: 180 } })
      .stick([5.35, 10.3, 2.5], [5.65, 10.3, 2.5], 0.4, 'iron')
      .stick([5.5, 10.3, 3.6], [5.5, 2.4, 3.6], 0.04, '#2a2726')
      .box([2.6, 2.4, 2.6], [5.5, 1.2, 2.5], { color: '#8a3a2e', edge: 'sharp' })
      .box([2.9, 0.2, 2.9], [5.5, 2.5, 2.5], { color: '#5c6166', edge: 'sharp' });
    return b
      .act({ click: [[A.par(A.pose('cart', { move: [0, 0, 2.6], dur: 1.6 }), A.say('Rumble, rumble...', 1.6)), A.wait(0.6), A.pose('cart', { move: [0, 0, 0], dur: 1.6 })], [A.operate('wheel', 'on'), A.say('Clank, clank, clank!', 2), A.wait(2), A.operate('wheel', 'off')]] })
      .done();
  }),
  // A stack of cork-backed coasters with one leaning on it; the top one flips like a coin.
  e('coaster (drink)', 'home', 'tableware', () => {
    const b = m('coaster (drink)').cyl([0.1, 0.011, 0.1], [0.0, 0.058, -0.02], { color: 'tan', rot: [75, 0, 0] }).torus([0.07, 0.07, 0.004], [0.0, 0.058, -0.015], { color: 'darkred', rot: [-15, 0, 0], tube: 0.1, noInk: true });
    ['tan', 'red', 'teal', 'tan'].forEach((c, i) => b.cyl([0.1, 0.011, 0.1], [0.03, 0.0055 + i * 0.0115, 0.04], { color: c, ...(i === 3 ? { name: 'top' } : {}) }));
    return b.act({ click: [A.pose('top', { move: [0, 0.12, 0], rot: [540, 0, 0], dur: 0.5 }), A.pose('top', { move: [0, 0, 0], rot: [720, 0, 0], dur: 0.35 }), A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.01 }), A.say('Clack!', 0.8))] }).done();
  }),
  // A camel trench coat on a wooden hanger, hung from a coat stand at real height; it sways on its hook.
  e('coat', 'wardrobe', 'outerwear', () => {
    const c = '#c19a6b';
    const b = m('coat')
      .cyl([0.45, 0.04, 0.45], [0, 0.02, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 1.85, 0], 0.05, 'darkwood')
      .ball(0.07, [0, 1.88, 0], { color: 'darkwood' })
      .rod([0, 1.75, 0], [0.12, 1.82, 0.08], 0.025, 'darkwood')
      .rod([0, 1.75, 0], [-0.12, 1.82, -0.08], 0.025, 'darkwood')
      .stick([-0.2, 1.62, 0.12], [0.2, 1.62, 0.12], 0.02, 'darkwood', { name: 'coat', pivot: [0, 1.7, 0.08] })
      .rod([0, 1.63, 0.12], [0, 1.7, 0.08], 0.01, 'silver', { parent: 'coat' })
      .box([0.5, 0.55, 0.2], [0, 1.33, 0.12], { color: c, round: 0.3, parent: 'coat' })
      .cyl([0.52, 0.55, 0.24], [0, 0.8, 0.12], { color: c, taper: 0.92, rot: [180, 0, 0], parent: 'coat' })
      .box([0.52, 0.05, 0.22], [0, 1.08, 0.12], { color: '#8a6440', round: 0.3, parent: 'coat' });
    b.pair((s) => {
      b.box([0.13, 0.6, 0.14], [s * 0.31, 1.28, 0.12], { color: c, rot: [0, 0, s * 8], round: 0.4, parent: 'coat' });
      b.wedge([0.1, 0.22, 0.02], [s * 0.06, 1.46, 0.225], { color: '#8a6440', rot: [0, 0, 180], parent: 'coat' });
      b.each(2, (i) => b.ball(0.025, [s * 0.06, 1.24 - i * 0.2, 0.23], { color: 'darkbrown', parent: 'coat' }));
    });
    return b.act({ click: [A.pose('coat', { rot: [0, 0, 12], dur: 0.3 }), A.say('Swish!', 0.8), A.pose('coat', { rot: [0, 0, -9], dur: 0.4 }), A.pose('coat', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
];
void [face, hat, held, wear, who, drink, pack, carton, spoked, tree, pine, fire, barrel, board];
