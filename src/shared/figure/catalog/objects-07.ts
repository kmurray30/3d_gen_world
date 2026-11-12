/** Catalog chunk objects-07: the words in assign/objects-07.tsv. */
import { e, type CatalogEntry } from './types';
import { m, type M, type PartOpts } from '../dsl';
import { col } from '../dsl';
import { hat, held, wear, who, type Extra } from '../accessories';
import type { Vec3 } from '../types';

/* ----- local helpers ----- */

/** A building: walls, flat or gable roof, a door that opens, rows of windows, a sign card over the door. */
function bldg(key: string, o: { w: number; h: number; d: number; wall: string; roof?: string; roofH?: number; sign?: string; signColor?: string; door?: string; win?: string; cols?: number }): M {
  const { w, h, d } = o;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.roofH) b.wedge([w + 0.4, o.roofH, d + 0.4], [0, h + o.roofH / 2, 0], { color: o.roof ?? 'darkred' });
  else b.box([w + 0.3, 0.3, d + 0.3], [0, h + 0.15, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  b.box([1.0, 2.0, 0.1], [0, 1.0, d / 2 + 0.03], { color: o.door ?? 'darkwood', round: 0.1, name: 'door', pivot: [-0.5, 1, d / 2 + 0.03] });
  const floors = Math.max(1, Math.floor((h - 2.55) / 3) + 1);
  const cols = o.cols ?? Math.max(2, Math.round(w / 2));
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (w / cols);
      if (f === 0 && Math.abs(x) < 1.1) continue;
      b.box([0.9, 1.1, 0.08], [x, f === 0 ? 1.4 : f * 3 + 1.6, d / 2 + 0.03], { color: o.win ?? 'glass', round: 0.1 });
    }
  if (o.sign) b.label(o.sign, [Math.min(w * 0.85, o.sign.length * 0.42 + 0.6), 0.7], [0, 2.6, d / 2 + 0.08], { color: o.signColor ?? 'white' });
  return b;
}

/** A fruit tree: trunk, a crown of three balls that sways, fruit dotted over the crown. */
function tree(key: string, o: { h: number; crown: string; trunk?: string; cw?: number; fruit?: string; n?: number; fs?: number; pear?: boolean }): M {
  const { h } = o;
  const cw = o.cw ?? h * 0.62, ch = h * 0.5, cy = h - ch / 2;
  const t = m(key)
    .stick([0, 0, 0], [0, cy, 0], h * 0.07, o.trunk ?? 'bark')
    .rod([0, h * 0.35, 0], [h * 0.12, h * 0.55, 0], h * 0.04, o.trunk ?? 'bark')
    .ball([cw, ch, cw], [0, cy, 0], { color: o.crown, name: 'top', pivot: [0, h * 0.4, 0] })
    .ball([cw * 0.6, ch * 0.6, cw * 0.6], [cw * 0.38, cy - ch * 0.15, cw * 0.1], { color: o.crown, parent: 'top' })
    .ball([cw * 0.6, ch * 0.6, cw * 0.6], [-cw * 0.38, cy - ch * 0.12, -cw * 0.05], { color: o.crown, parent: 'top' });
  if (o.fruit) {
    const fs = o.fs ?? h * 0.045;
    for (let i = 0; i < (o.n ?? 12); i++) {
      const a = i * 2.39 + 0.3, phi = -0.45 + ((i * 0.37) % 1.0);
      const p: Vec3 = [Math.cos(a) * Math.cos(phi) * cw * 0.48, cy + Math.sin(phi) * ch * 0.47, Math.sin(a) * Math.cos(phi) * cw * 0.48];
      t.ball(fs, p, { color: o.fruit, parent: 'top' });
      if (o.pear) t.ball(fs * 0.65, [p[0], p[1] + fs * 0.55, p[2]], { color: o.fruit, parent: 'top' });
    }
  }
  return t;
}

/** A bottle: body, shoulder, neck and cap, an optional label band. */
function bottle(b: M, x: number, z: number, h: number, d: number, color: string, cap: string, o: { band?: string; text?: string; neck?: number; cork?: boolean } = {}): M {
  const nk = o.neck ?? 0.4, bh = h * 0.62, sh = h * 0.16, nh = h * 0.12, ch = h * 0.1;
  b.cyl([d, bh, d], [x, bh / 2, z], { color })
    .cyl([d, sh, d], [x, bh + sh / 2, z], { color, taper: nk })
    .cyl([d * nk, nh, d * nk], [x, bh + sh + nh / 2, z], { color })
    .cyl([d * nk * 1.2, ch, d * nk * 1.2], [x, h - ch / 2, z], { color: cap, taper: o.cork ? 1.2 : 1 });
  if (o.band) b.cyl([d * 1.02, bh * 0.5, d * 1.02], [x, bh * 0.5, z], { color: o.band, noInk: true });
  if (o.text) b.label(o.text, [d * 0.75, bh * 0.32], [x, bh * 0.5, z + d / 2 - 0.004], { color: o.band ?? 'white' });
  return b;
}

/** A jar with a lid and a label: contents colour shows as the body. */
function jar(key: string, h: number, d: number, fill: string, lid: string, text?: string, band = 'white'): M {
  const b = m(key)
    .cyl([d, h * 0.85, d], [0, h * 0.425, 0], { color: fill })
    .cyl([d * 0.92, h * 0.15, d * 0.92], [0, h * 0.925, 0], { color: lid, name: 'lid', pivot: [0, h * 0.85, -d * 0.45] })
    .cyl([d * 1.02, h * 0.4, d * 1.02], [0, h * 0.42, 0], { color: band, noInk: true });
  if (text) b.label(text, [d * 0.7, h * 0.3], [0, h * 0.42, d / 2 - 0.004], { color: band });
  return b;
}

/** A regular polygon (or part of one) in the x-y plane from triangles fanned around a centre, facing +z. */
function fan(b: M, n: number, R: number, cx: number, cy: number, cz: number, t: number, color: string, o: { start?: number; count?: number; noInk?: boolean } = {}): M {
  const step = 360 / n, side = 2 * R * Math.sin(Math.PI / n), apo = R * Math.cos(Math.PI / n);
  for (let i = 0; i < (o.count ?? n); i++) {
    const th = (o.start ?? -90) + i * step, r = (th * Math.PI) / 180;
    b.wedge([side, apo, t], [cx + (apo / 2) * Math.cos(r), cy + (apo / 2) * Math.sin(r), cz], { color, rot: [0, 0, th + 90], noInk: o.noInk });
  }
  return b;
}

/** A solid radiating from c: long axis along its own x, turned to `yaw` degrees (0 = +x, 90 = -z) and tilted up `tilt`. */
function spoke(b: M, c: Vec3, yaw: number, tilt: number, len: number, h: number, d: number, color: string, o: PartOpts = {}, shape: 'ball' | 'box' = 'ball'): M {
  const f = (yaw * Math.PI) / 180, t = (tilt * Math.PI) / 180;
  const at: Vec3 = [c[0] + (len / 2) * Math.cos(t) * Math.cos(f), c[1] + (len / 2) * Math.sin(t), c[2] - (len / 2) * Math.cos(t) * Math.sin(f)];
  return b.part(shape, [len, h, d], at, { color, rot: [0, yaw, tilt], ...o });
}

/** XYZ Euler angles (degrees) that turn a solid's own x and y axes onto the given directions. */
function eulerOf(x: Vec3, y: Vec3): Vec3 {
  const z: Vec3 = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  const D = 180 / Math.PI, m13 = z[0];
  const b = Math.asin(Math.max(-1, Math.min(1, m13)));
  if (Math.abs(m13) < 0.9999) return [Math.atan2(-z[1], z[2]) * D, b * D, Math.atan2(-y[0], x[0]) * D];
  return [Math.atan2(y[2], y[1]) * D, b * D, 0];
}

/** A square pyramid from four triangular faces (and a hidden core), base side a, height h, standing at y0. */
function pyramid(b: M, cx: number, cz: number, y0: number, a: number, h: number, color: string, t: number): M {
  const beta = Math.atan(a / 2 / h), s = Math.hypot(h, a / 2), cb = Math.cos(beta), sb = Math.sin(beta);
  for (const f of [0, 90, 180, 270]) {
    const r = (f * Math.PI) / 180, d: Vec3 = [Math.sin(r), 0, Math.cos(r)];
    const n: Vec3 = [d[0] * cb, sb, d[2] * cb], u: Vec3 = [-d[0] * sb, cb, -d[2] * sb];
    const xa: Vec3 = [u[1] * n[2] - u[2] * n[1], u[2] * n[0] - u[0] * n[2], u[0] * n[1] - u[1] * n[0]];
    b.wedge([a, s, t], [cx + d[0] * (a / 4) - n[0] * (t / 2), y0 + h / 2 - n[1] * (t / 2), cz + d[2] * (a / 4) - n[2] * (t / 2)], { color, rot: eulerOf(xa, u) });
  }
  return b.box([a * 0.5, h * 0.45, a * 0.5], [cx, y0 + h * 0.225, cz], { color, round: 0 });
}

/** A plinth for shapes and symbols. */
const plinth = (b: M, w = 0.16, hh = 0.03, c = 'wood'): M => b.box([w, hh, w * 0.5], [0, hh / 2, 0], { color: c });

/** A room seen from the front: floor, back wall and a side wall. */
function room(key: string, w: number, d: number, h: number, wall: string, floor: string): M {
  return m(key)
    .box([w, 0.1, d], [0, 0.05, 0], { color: floor, round: 0.05 })
    .box([w, h, 0.1], [0, h / 2, -d / 2 + 0.05], { color: wall, round: 0.05 })
    .box([0.1, h, d], [w / 2 - 0.05, h / 2, 0], { color: wall, round: 0.05 });
}

/** A plate: dish and rim. */
const plate = (b: M, d: number, y = 0, c = 'white'): M =>
  b.cyl([d, d * 0.06, d], [0, y + d * 0.03, 0], { color: c, taper: 1.15 }).torus([d * 1.1, d * 1.1, d * 0.06], [0, y + d * 0.065, 0], { color: c, rot: [90, 0, 0], tube: 0.12 });

/** A small sedan-like car body (side view). */
function car(key: string, body: string, o: { roof?: string; light?: string; text?: string } = {}): M {
  const c = m(key, { view: 'side' })
    .box([1.75, 0.6, 4.2], [0, 0.62, 0], { color: body, round: 0.45 })
    .box([1.55, 0.5, 2.1], [0, 1.12, -0.25], { color: o.roof ?? body, round: 0.5 })
    .box([1.57, 0.36, 1.7], [0, 1.14, -0.25], { color: 'glass', round: 0.4 });
  for (const [x, z] of [[0.82, 1.35], [-0.82, 1.35], [0.82, -1.35], [-0.82, -1.35]]) c.torus([0.66, 0.66, 0.26], [x, 0.33, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.38 });
  c.pair((s) => c.ball([0.28, 0.16, 0.06], [s * 0.58, 0.68, 2.08], { color: 'yellow', glow: true }));
  if (o.text) c.label(o.text, [0.05, 0.25], [0.88, 0.65, 0], { color: body, rot: [0, 90, 0] });
  return c;
}

/** Trees in a little scene (orchard, park). */
const miniTree = (b: M, x: number, z: number, h: number, crown: string, fruit?: string): M => {
  b.stick([x, 0, z], [x, h * 0.55, z], h * 0.09, 'bark').ball([h * 0.6, h * 0.55, h * 0.6], [x, h * 0.7, z], { color: crown });
  if (fruit) for (let i = 0; i < 5; i++) b.ball(h * 0.07, [x + Math.cos(i * 1.3) * h * 0.28, h * (0.6 + (i % 3) * 0.08), z + Math.sin(i * 1.3) * h * 0.2 + h * 0.08], { color: fruit });
  return b;
};

/** A small parked car for scenes (facing +z). */
const miniCar = (b: M, x: number, y: number, z: number, c: string): M => {
  b.box([1.6, 0.65, 3.6], [x, y + 0.52, z], { color: c, round: 0.4 }).box([1.4, 0.45, 1.8], [x, y + 0.95, z - 0.2], { color: 'glass', round: 0.4 });
  for (const [dx, dz] of [[0.75, 1.15], [-0.75, 1.15], [0.75, -1.15], [-0.75, -1.15]]) b.cyl([0.55, 0.25, 0.55], [x + dx, y + 0.28, z + dz], { color: 'rubber', rot: [0, 0, 90] });
  return b;
};

/** A garment on an invisible form: a poncho drape for a person. */
const poncho = (c1: string, c2: string): Extra => (p, d) => {
  p.add({ name: 'poncho', parent: 'torso', at: [0, d.torsoH * 0.42, 0], shape: 'cyl', size: [d.tw * 2.3, d.torsoH * 1.15, d.td * 2.1], color: col(c1), segs: 4, srot: [0, 45, 0], taper: 0.35, layer: 3 });
  p.add({ name: 'ponchoband', parent: 'torso', at: [0, d.torsoH * 0.2, 0], shape: 'cyl', size: [d.tw * 2.0, d.torsoH * 0.12, d.td * 1.85], color: col(c2), segs: 4, srot: [0, 45, 0], taper: 0.9, layer: 4, noInk: true });
};

export const ENTRIES: CatalogEntry[] = [
  e('office', 'places', 'rooms', () => {
    const b = room('office', 3, 2.6, 2.6, '#dfe7ec', '#8f99a3')
      .box([1.5, 0.06, 0.7], [-0.2, 0.75, -0.6], { color: 'wood' })
      .box([0.06, 0.7, 0.62], [-0.9, 0.4, -0.6], { color: 'darkwood' })
      .box([0.06, 0.7, 0.62], [0.5, 0.4, -0.6], { color: 'darkwood' })
      .box([0.55, 0.36, 0.04], [-0.2, 1.1, -0.8], { color: 'black' })
      .box([0.48, 0.29, 0.02], [-0.2, 1.1, -0.775], { color: '#7fc8ff', glow: true })
      .stick([-0.2, 0.78, -0.82], [-0.2, 0.92, -0.82], 0.05, 'black')
      .box([0.42, 0.03, 0.15], [-0.2, 0.8, -0.45], { color: 'darkgray' })
      .box([0.5, 0.1, 0.5], [-0.2, 0.5, 0.15], { color: 'black' })
      .box([0.5, 0.6, 0.08], [-0.2, 0.86, 0.42], { color: 'black' })
      .stick([-0.2, 0.12, 0.15], [-0.2, 0.46, 0.15], 0.06, 'gray')
      .cyl([0.55, 0.05, 0.55], [-0.2, 0.13, 0.15], { color: 'darkgray', segs: 5 })
      .box([0.5, 1.3, 0.6], [1.15, 0.75, -0.9], { color: 'steel' })
      .cyl([0.3, 0.35, 0.3], [-1.2, 0.27, 0.6], { color: '#c8693e', taper: 1.2 })
      .ball([0.5, 0.6, 0.5], [-1.2, 0.7, 0.6], { color: 'leaf' })
      .box([1.0, 0.8, 0.04], [-0.6, 1.85, -1.2], { color: 'glass' })
      .cyl([0.3, 0.03, 0.3], [0.6, 2.0, -1.2], { color: 'white', rot: [90, 0, 0] });
    b.each(3, (i) => b.box([0.2, 0.04, 0.04], [1.15, 0.4 + i * 0.4, -0.58], { color: 'silver' }));
    return b.done();
  }),
  e('office building', 'places', 'offices', () => {
    const b = m('office building').box([1.8, 3.6, 1.45], [0, 1.8, 0], { color: '#5f7f98', round: 0.03 });
    b.each(6, (i) => b.box([1.7, 0.29, 1.47], [0, 0.94 + i * 0.47, 0], { color: 'glass', noInk: true }));
    return b
      .box([0.65, 0.54, 0.07], [0, 0.27, 0.74], { color: 'glass', name: 'door', pivot: [-0.32, 0.27, 0.74] })
      .box([1.15, 0.07, 0.43], [0, 0.61, 0.9], { color: 'darkgray' })
      .label('OFFICES', [0.86, 0.18], [0, 0.7, 1.08], { color: 'navy' })
      .box([0.58, 0.29, 0.5], [0.3, 3.75, -0.15], { color: 'gray' })
      .stick([-0.5, 3.6, 0], [-0.5, 3.95, 0], 0.03, 'silver')
      .done();
  }),
  e('office supply store', 'places', 'shops', () =>
    bldg('office supply store', { w: 8, h: 4, d: 5, wall: 'white', roof: 'red', sign: 'OFFICE SUPPLY', signColor: 'red' })
      .cyl([0.7, 4, 0.7], [-0.4, 4.7, 0], { color: 'yellow', segs: 6, rot: [0, 0, 90] })
      .cone([0.7, 0.9, 0.7], [2.05, 4.7, 0], { color: 'tan', rot: [0, 0, -90] })
      .cone([0.25, 0.32, 0.25], [2.4, 4.7, 0], { color: 'darkgray', rot: [0, 0, -90] })
      .cyl([0.72, 0.4, 0.72], [-2.6, 4.7, 0], { color: 'silver', rot: [0, 0, 90] })
      .cyl([0.7, 0.5, 0.7], [-3.05, 4.7, 0], { color: 'pink', rot: [0, 0, 90] })
      .done(),
  ),
  e('oil (cooking)', 'food', 'pantry', () => {
    const b = m('oil (cooking)');
    bottle(b, 0, 0, 0.28, 0.08, '#f0c03a', 'green', { text: 'OIL', band: 'cream' });
    return b.ball([0.035, 0.05, 0.035], [0.08, 0.025, 0.04], { color: '#8a9a3a' }).ball([0.03, 0.045, 0.03], [0.1, 0.022, 0.0], { color: '#5a6a2a' }).done();
  }),
  e('oil (motor)', 'garage', 'car care', () =>
    m('oil (motor)')
      .box([0.17, 0.22, 0.09], [0, 0.11, 0], { color: 'yellow', round: 0.3 })
      .torus([0.1, 0.1, 0.035], [0.05, 0.22, 0], { color: 'yellow', tube: 0.35 })
      .cyl([0.04, 0.05, 0.04], [-0.05, 0.245, 0], { color: 'yellow' })
      .cyl([0.045, 0.03, 0.045], [-0.05, 0.28, 0], { color: 'black' })
      .label('MOTOR OIL', [0.13, 0.08], [0, 0.1, 0.039], { color: 'black' })
      .done(),
  ),
  e('oil barrel', 'workshop', 'drums and tanks', () =>
    m('oil barrel')
      .cyl([0.58, 0.88, 0.58], [0, 0.44, 0], { color: '#2f5f9f' })
      .torus([0.61, 0.61, 0.03], [0, 0.3, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.08 })
      .torus([0.61, 0.61, 0.03], [0, 0.6, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.08 })
      .torus([0.6, 0.6, 0.03], [0, 0.875, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.08 })
      .cyl([0.06, 0.03, 0.06], [0.15, 0.89, 0.05], { color: 'darkgray' })
      .label('OIL', [0.22, 0.12], [0, 0.45, 0.285], { color: 'white' })
      .ball([0.5, 0.02, 0.3], [0.2, 0.01, 0.35], { color: '#1e1b1f' })
      .done(),
  ),
  e('oil lamp', 'home', 'lamps', () =>
    m('oil lamp')
      .cyl([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'brass', taper: 0.7 })
      .stick([0, 0.03, 0], [0, 0.07, 0], 0.03, 'brass')
      .ball([0.12, 0.08, 0.12], [0, 0.1, 0], { color: 'brass' })
      .cyl([0.06, 0.025, 0.06], [0, 0.15, 0], { color: 'brass' })
      .ball([0.08, 0.1, 0.08], [0, 0.2, 0], { color: '#ffe9a0', glow: true })
      .cyl([0.05, 0.08, 0.05], [0, 0.28, 0], { color: '#ffe9a0', glow: true, taper: 0.85 })
      .ball([0.025, 0.04, 0.025], [0, 0.205, 0.035], { color: 'orange', glow: true, noInk: true })
      .torus([0.07, 0.07, 0.012], [0.07, 0.1, 0], { color: 'brass', rot: [0, 90, 0], tube: 0.2 })
      .done(),
  ),
  e('oil rig', 'places', 'industry', () => {
    const b = m('oil rig').cyl([9, 0.3, 9], [0, 0.15, 0], { color: 'water' });
    b.pair((s) => b.stick([s * 2.5, 0, 2.5], [s * 2.5, 4.1, 2.5], 0.6, 'yellow').stick([s * 2.5, 0, -2.5], [s * 2.5, 4.1, -2.5], 0.6, 'yellow'));
    b.box([7, 0.6, 7], [0, 4.3, 0], { color: 'gray' });
    const legs: Array<[number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    const dx = 1.5, top = 11, bx = 1.4, tx = 0.3;
    const at = (sx: number, sz: number, y: number): Vec3 => {
      const k = (y - 4.6) / (top - 4.6);
      return [dx + sx * (bx + (tx - bx) * k), y, sz * (bx + (tx - bx) * k)];
    };
    for (const [sx, sz] of legs) b.rod(at(sx, sz, 4.6), at(sx, sz, top), 0.15, 'red');
    for (const y of [6.5, 8.5]) for (let i = 0; i < 4; i++) b.rod(at(legs[i][0], legs[i][1], y), at(legs[(i + 1) % 4][0], legs[(i + 1) % 4][1], y), 0.1, 'red');
    return b
      .box([0.8, 0.5, 0.8], [dx, top + 0.2, 0], { color: 'red' })
      .box([2.8, 2, 2.8], [-1.8, 5.6, 1.5], { color: 'white' })
      .box([2.0, 0.8, 0.06], [-1.8, 5.8, 2.92], { color: 'glass' })
      .cyl([2.8, 0.2, 2.8], [-1.8, 6.7, 1.5], { color: 'green', segs: 8 })
      .rod([-2.8, 4.6, -2.8], [-0.5, 8.5, -2.8], 0.2, 'orange')
      .stick([3.3, 4.6, -3.3], [4.2, 8, -3.3], 0.18, 'gray')
      .ball([0.6, 0.9, 0.6], [4.3, 8.4, -3.3], { color: 'fire', glow: true })
      .done();
  }),
  e('oil well', 'places', 'industry', () => {
    const b = m('oil well').box([3.4, 0.3, 3.4], [0, 0.15, 0], { color: 'dirt' });
    const legs: Array<[number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    const at = (sx: number, sz: number, y: number): Vec3 => {
      const r = 1.3 + (0.3 - 1.3) * ((y - 0.3) / 8.7);
      return [sx * r, y, sz * r];
    };
    for (const [sx, sz] of legs) b.rod(at(sx, sz, 0.3), at(sx, sz, 9), 0.16, 'darkwood');
    for (const y of [2.5, 5, 7.2]) for (let i = 0; i < 4; i++) b.rod(at(legs[i][0], legs[i][1], y), at(legs[(i + 1) % 4][0], legs[(i + 1) % 4][1], y), 0.1, 'wood');
    for (let i = 0; i < 4; i++) b.rod(at(legs[i][0], legs[i][1], 2.5), at(legs[(i + 1) % 4][0], legs[(i + 1) % 4][1], 5), 0.08, 'wood');
    return b
      .box([0.9, 0.4, 0.9], [0, 9.2, 0], { color: 'darkwood' })
      .cyl([0.4, 2.4, 0.4], [0, 10.6, 0], { color: '#1e1b1f', taper: 1.8 })
      .ball([2.4, 1.2, 2.0], [0, 12.1, 0], { color: '#1e1b1f' })
      .ball([0.6, 0.5, 0.6], [1.3, 11.3, 0.3], { color: '#1e1b1f' })
      .ball([0.5, 0.4, 0.5], [-1.2, 11.1, -0.2], { color: '#1e1b1f' })
      .ball([2.6, 0.08, 2.0], [0.3, 0.32, 0.6], { color: '#1e1b1f' })
      .done();
  }),
  e('oilslick', 'nature', 'puddles', () =>
    m('oilslick')
      .ball([0.8, 0.03, 0.5], [0, 0.015, 0], { color: '#1e1b1f' })
      .ball([0.3, 0.02, 0.18], [0.12, 0.03, 0.06], { color: '#7a4fc4', noInk: true })
      .ball([0.24, 0.02, 0.14], [-0.12, 0.03, -0.06], { color: '#3fa7a0', noInk: true })
      .ball([0.14, 0.02, 0.09], [0.22, 0.03, -0.1], { color: '#e2b23a', noInk: true })
      .cyl([0.12, 0.18, 0.12], [-0.38, 0.06, 0.02], { color: 'red', rot: [0, 0, 90] })
      .cyl([0.04, 0.03, 0.04], [-0.27, 0.06, 0.02], { color: 'darkgray', rot: [0, 0, 90] })
      .done(),
  ),
  e('olive', 'food', 'pickles and olives', () =>
    m('olive')
      .ball([0.026, 0.024, 0.034], [-0.012, 0.03, 0], { color: '#7a9a3a' })
      .ball([0.012, 0.012, 0.006], [-0.012, 0.03, 0.017], { color: 'red', noInk: true })
      .ball([0.026, 0.024, 0.034], [0.018, 0.05, 0], { color: '#3a3040' })
      .stick([-0.04, 0.012, 0], [0.045, 0.068, 0], 0.004, 'red')
      .ball(0.01, [0.047, 0.07, 0], { color: 'red' })
      .ball([0.06, 0.012, 0.06], [-0.01, 0.006, 0], { color: 'white' })
      .done(),
  ),
  e('olive branch', 'garden', 'branches', () => {
    const b = m('olive branch').rod([0, 0, 0], [0.06, 0.5, 0], 0.014, 'bark');
    b.each(8, (i) => {
      const s = i % 2 ? 1 : -1, y = 0.1 + i * 0.05, x = 0.06 * (y / 0.5);
      b.ball([0.018, 0.08, 0.008], [x + s * 0.035, y + 0.025, 0], { color: '#8fa66a', rot: [0, 0, -s * 55] });
    });
    return b
      .ball([0.02, 0.07, 0.008], [0.06, 0.53, 0], { color: '#8fa66a' })
      .ball([0.04, 0.05, 0.04], [0.03, 0.24, 0.02], { color: '#5a6a2a' })
      .ball([0.04, 0.05, 0.04], [0.065, 0.37, 0.02], { color: '#3a3040' })
      .ball([0.04, 0.05, 0.04], [0.0, 0.14, 0.02], { color: '#7a9a3a' })
      .done();
  }),
  e('olive tree', 'garden', 'fruit trees', () =>
    tree('olive tree', { h: 6, crown: '#8fa878', cw: 5.2, fruit: '#3a3040', n: 14, fs: 0.22 })
      .rod([0, 0, 0], [-0.5, 1.6, 0.2], 0.5, 'bark')
      .rod([-0.5, 1.6, 0.2], [0.2, 2.8, 0], 0.4, 'bark')
      .done(),
  ),
  e('omelet', 'food', 'breakfast', () =>
    plate(m('omelet'), 0.26)
      .ball([0.2, 0.05, 0.12], [0, 0.035, 0], { color: '#f6d24a' })
      .rod([-0.08, 0.05, 0.04], [0.08, 0.05, 0.04], 0.006, '#e2b23a', { noInk: true })
      .ball([0.02, 0.006, 0.02], [0.02, 0.06, 0.0], { color: 'green', noInk: true })
      .ball([0.015, 0.006, 0.015], [-0.04, 0.058, -0.01], { color: 'green', noInk: true })
      .ball([0.015, 0.006, 0.015], [0.05, 0.056, -0.02], { color: 'red', noInk: true })
      .done(),
  ),
  e('onion', 'food', 'vegetables', () =>
    m('onion')
      .ball([0.08, 0.075, 0.08], [0, 0.04, 0], { color: '#c98a4a' })
      .cone([0.035, 0.04, 0.035], [0, 0.085, 0], { color: '#c98a4a' })
      .rod([0, 0.1, 0], [0.005, 0.12, 0], 0.006, '#a07040')
      .ball([0.02, 0.008, 0.02], [0, 0.004, 0], { color: 'cream' })
      .ball([0.04, 0.06, 0.02], [0.02, 0.045, 0.03], { color: '#e8b070', noInk: true })
      .done(),
  ),
  e('onion rings', 'food', 'fried food', () =>
    m('onion rings')
      .box([0.2, 0.02, 0.14], [0, 0.01, 0], { color: 'red', round: 0.3 })
      .box([0.18, 0.005, 0.12], [0, 0.021, 0], { color: 'white', noInk: true })
      .torus([0.085, 0.085, 0.022], [-0.03, 0.035, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.08, 0.08, 0.022], [0.035, 0.035, 0.01], { color: 'bread', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.075, 0.075, 0.022], [0.0, 0.056, -0.005], { color: 'bread', rot: [90, 0, 15], tube: 0.32 })
      .torus([0.085, 0.085, 0.022], [0.0, 0.085, -0.03], { color: 'crust', rot: [15, 0, 0], tube: 0.3 })
      .done(),
  ),
  e('orange', 'food', 'fruit', () =>
    m('orange')
      .ball(0.08, [0, 0.04, 0], { color: 'orange' })
      .cyl([0.008, 0.012, 0.008], [0, 0.083, 0], { color: 'darkgreen' })
      .ball([0.04, 0.006, 0.02], [0.018, 0.088, 0], { color: 'leaf', rot: [0, 0, 20] })
      .done(),
  ),
  e('orange juice', 'food', 'drinks', () =>
    m('orange juice')
      .cyl([0.07, 0.015, 0.07], [0, 0.0075, 0], { color: 'glass' })
      .cyl([0.068, 0.13, 0.068], [0, 0.08, 0], { color: 'orange', taper: 1.12 })
      .cyl([0.08, 0.025, 0.08], [0, 0.155, 0], { color: 'glass' })
      .rod([0.01, 0.12, 0], [0.03, 0.22, -0.01], 0.008, 'red')
      .cyl([0.055, 0.01, 0.055], [-0.035, 0.165, 0.01], { color: 'orange', rot: [90, 0, 20] })
      .cyl([0.045, 0.012, 0.045], [-0.035, 0.165, 0.01], { color: '#ffd27a', rot: [90, 0, 20], noInk: true })
      .ball(0.06, [0.075, 0.03, 0.03], { color: 'orange' })
      .done(),
  ),
  e('orange tree', 'garden', 'fruit trees', () => tree('orange tree', { h: 5, crown: 'darkgreen', fruit: 'orange', n: 14 }).done()),
  e('orb', 'fantasy', 'magic items', () => {
    const b = m('orb').cyl([0.07, 0.02, 0.07], [0, 0.01, 0], { color: 'gold', taper: 0.7 });
    b.each(3, (i) => {
      const a = (i / 3) * Math.PI * 2;
      b.rod([Math.cos(a) * 0.015, 0.02, Math.sin(a) * 0.015], [Math.cos(a) * 0.035, 0.06, Math.sin(a) * 0.035], 0.008, 'gold');
    });
    return b
      .ball(0.08, [0, 0.07, 0], { color: '#9a6fe0', glow: true })
      .ball(0.025, [-0.015, 0.085, 0.03], { color: '#e8d8ff', glow: true, noInk: true })
      .done();
  }),
  e('orchard', 'farm', 'fields', () => {
    const b = m('orchard').box([8, 0.15, 6], [0, 0.075, 0], { color: 'grass' });
    for (const x of [-2.6, 0, 2.6]) for (const z of [-1.5, 1.5]) miniTree(b, x, z, 2.8, 'leaf', 'red');
    b.each(9, (i) => b.stick([-3.8 + i * 0.95, 0.1, 2.9], [-3.8 + i * 0.95, 0.8, 2.9], 0.08, 'wood'));
    return b.box([7.8, 0.08, 0.05], [0, 0.7, 2.9], { color: 'wood' }).box([7.8, 0.08, 0.05], [0, 0.4, 2.9], { color: 'wood' }).done();
  }),
  e('ore', 'nature', 'rocks', () =>
    m('ore')
      .ball([0.12, 0.08, 0.1], [0, 0.04, 0], { color: '#7a5a4a' })
      .ball([0.07, 0.06, 0.07], [0.04, 0.06, -0.01], { color: '#8a6a58' })
      .box([0.02, 0.025, 0.02], [-0.02, 0.07, 0.03], { color: 'silver', rot: [20, 30, 10] })
      .box([0.018, 0.02, 0.018], [0.03, 0.05, 0.045], { color: 'gold', rot: [10, 40, 30] })
      .box([0.015, 0.018, 0.015], [-0.045, 0.04, 0.03], { color: 'silver', rot: [30, 10, 20] })
      .ball([0.02, 0.012, 0.012], [0.01, 0.08, 0.02], { color: '#c87a4a', noInk: true })
      .done(),
  ),
  e('organ (music)', 'music', 'keyboards', () => {
    const b = m('organ (music)').box([3.2, 1.6, 1.0], [0, 0.8, -0.2], { color: 'darkwood' });
    b.each(11, (i) => {
      const h = 1.1 + 1.7 * (1 - Math.abs(i - 5) / 5), x = (i - 5) * 0.27;
      b.cyl([0.2, h, 0.2], [x, 1.6 + h / 2, -0.25], { color: 'silver' }).cone([0.2, 0.1, 0.2], [x, 1.6 + h + 0.05, -0.25], { color: 'silver' });
      b.box([0.1, 0.06, 0.02], [x, 1.85, -0.15], { color: 'black', noInk: true });
    });
    return b
      .box([1.6, 0.3, 0.5], [0, 0.85, 0.42], { color: 'darkwood' })
      .box([1.5, 0.05, 0.3], [0, 1.02, 0.5], { color: 'white' })
      .box([1.5, 0.05, 0.25], [0, 1.12, 0.36], { color: 'white' })
      .box([1.2, 0.08, 0.35], [0, 0.5, 0.95], { color: 'wood' })
      .box([1.1, 0.46, 0.3], [0, 0.23, 0.95], { color: 'darkwood' })
      .done();
  }),
  e('ornament', 'toys', 'holiday', () =>
    m('ornament')
      .ball(0.09, [0, 0.045, 0], { color: 'red' })
      .torus([0.092, 0.092, 0.012], [0, 0.045, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .ball([0.025, 0.025, 0.012], [-0.015, 0.06, 0.04], { color: 'white', noInk: true })
      .cyl([0.025, 0.018, 0.025], [0, 0.095, 0], { color: 'gold' })
      .torus([0.02, 0.02, 0.004], [0, 0.11, 0], { color: 'gold', tube: 0.2 })
      .done(),
  ),
  e('orphanage', 'places', 'homes', () =>
    bldg('orphanage', { w: 9, h: 7, d: 6, wall: '#e8d8b8', roof: 'brown', roofH: 3, sign: 'ORPHANAGE', signColor: 'cream' })
      .box([1.2, 1.4, 1.2], [0, 10.0, 0], { color: 'white' })
      .cone([1.6, 1.4, 1.6], [0, 11.4, 0], { color: 'brown', segs: 4, rot: [0, 45, 0] })
      .heart(0.9, [0, 8.0, 3.25], { color: 'red' })
      .stick([3.2, 7.5, -1], [3.2, 9.4, -1], 0.5, 'darkred')
      .done(),
  ),
  e('ottoman', 'home', 'seating', () => {
    const b = m('ottoman').cyl([0.6, 0.3, 0.6], [0, 0.25, 0], { color: 'teal' }).ball([0.6, 0.12, 0.6], [0, 0.4, 0], { color: 'teal' });
    b.each(5, (i) => b.ball(0.025, [Math.cos(i * 1.257) * 0.17, 0.455, Math.sin(i * 1.257) * 0.17], { color: '#2a7a74' }));
    b.ball(0.025, [0, 0.465, 0], { color: '#2a7a74' });
    b.each(4, (i) => b.cyl([0.04, 0.12, 0.04], [Math.cos(i * 1.571 + 0.785) * 0.22, 0.06, Math.sin(i * 1.571 + 0.785) * 0.22], { color: 'darkwood', taper: 0.7 }));
    return b.done();
  }),
  e('outfit', 'wardrobe', 'outfits', () => who('outfit', { top: 'red', bottom: 'navy', shoes: 'white', long: true, acc: [hat('beret', 'black'), wear('scarf', 'yellow'), held('bag', 'tan')] })),
  e('outhouse', 'places', 'huts', () =>
    m('outhouse')
      .box([1.2, 2.1, 1.2], [0, 1.05, 0], { color: 'lightwood', round: 0.05 })
      .box([1.45, 0.1, 1.55], [0, 2.22, 0], { color: 'darkwood', rot: [-10, 0, 0] })
      .box([0.85, 1.85, 0.06], [0, 0.97, 0.62], { color: 'wood', name: 'door', pivot: [-0.42, 0.97, 0.62] })
      .cyl([0.32, 0.02, 0.32], [0, 1.55, 0.655], { color: 'yellow', rot: [90, 0, 0], noInk: true, parent: 'door' })
      .cyl([0.28, 0.02, 0.28], [0.09, 1.59, 0.67], { color: 'wood', rot: [90, 0, 0], noInk: true, parent: 'door' })
      .ball(0.06, [0.3, 1.0, 0.67], { color: 'darkbrown', parent: 'door' })
      .done(),
  ),
  e('outpost', 'places', 'forts', () => {
    const b = m('outpost').box([7, 0.2, 7], [0, 0.1, 0], { color: 'dirt' });
    b.box([6, 2.5, 0.4], [0, 1.25, -3], { color: 'wood' }).box([0.4, 2.5, 6], [3, 1.25, 0], { color: 'wood' }).box([0.4, 2.5, 6], [-3, 1.25, 0], { color: 'wood' });
    b.box([2.2, 2.5, 0.4], [-1.9, 1.25, 3], { color: 'wood' }).box([2.2, 2.5, 0.4], [1.9, 1.25, 3], { color: 'wood' });
    b.box([1.6, 2.0, 0.2], [0, 1.0, 3.0], { color: 'darkwood', name: 'door', pivot: [-0.8, 1, 3] });
    b.each(13, (i) => {
      if (i < 5 || i > 7) b.cone([0.46, 0.5, 0.46], [-2.9 + i * 0.48, 2.75, 3], { color: 'wood' });
    });
    b.label('OUTPOST', [1.8, 0.45], [0, 2.4, 3.22], { color: 'cream' });
    for (const [x, z] of [[-1.8, -1.8], [-3.2, -1.8], [-1.8, -3.2], [-3.2, -3.2]]) b.stick([x, 0, z], [x, 5, z], 0.2, 'darkwood');
    return b
      .box([2.0, 0.2, 2.0], [-2.5, 5.0, -2.5], { color: 'wood' })
      .box([2.0, 0.7, 2.0], [-2.5, 5.45, -2.5], { color: 'wood' })
      .cone([2.8, 1.2, 2.8], [-2.5, 6.4, -2.5], { color: 'darkbrown', segs: 4, rot: [0, 45, 0] })
      .stick([-2.5, 6.9, -2.5], [-2.5, 8.2, -2.5], 0.06, 'gray')
      .box([0.9, 0.5, 0.04], [-2.03, 7.9, -2.5], { color: 'red' })
      .done();
  }),
  e('oval', 'ideas', 'shapes', () => plinth(m('oval')).cyl([0.26, 0.03, 0.17], [0, 0.115, 0], { color: 'blue', rot: [90, 0, 0] }).done()),
  e('overalls', 'wardrobe', 'outfits', () => who('overalls', { top: 'red', bottom: 'denim', shoes: 'brown', acc: [wear('overalls', 'denim'), hat('straw')] })),
  e('pacifier', 'home', 'baby things', () =>
    m('pacifier')
      .ball([0.034, 0.03, 0.012], [0.013, 0.035, 0], { color: 'skyblue' })
      .ball([0.034, 0.03, 0.012], [-0.013, 0.035, 0], { color: 'skyblue' })
      .ball([0.018, 0.022, 0.032], [0, 0.035, -0.02], { color: 'cream' })
      .ball([0.016, 0.016, 0.014], [0, 0.035, 0.01], { color: 'white' })
      .torus([0.03, 0.03, 0.006], [0, 0.026, 0.02], { color: 'white', rot: [-25, 0, 0], tube: 0.25 })
      .done(),
  ),
  e('package', 'home', 'parcels and bags', () =>
    m('package')
      .box([0.3, 0.2, 0.25], [0, 0.1, 0], { color: '#c8955a', round: 0.08 })
      .box([0.07, 0.006, 0.252], [0, 0.2, 0], { color: '#e8c78a', noInk: true })
      .box([0.07, 0.07, 0.006], [0, 0.165, 0.125], { color: '#e8c78a', noInk: true })
      .label('FRAGILE', [0.12, 0.05], [0.07, 0.07, 0.124], { color: 'white' })
      .done(),
  ),
  e('packet', 'food', 'snacks', () =>
    m('packet')
      .box([0.12, 0.15, 0.035], [0, 0.075, 0], { color: 'red', round: 0.9 })
      .box([0.12, 0.016, 0.012], [0, 0.152, 0], { color: '#f07060', round: 0.2 })
      .box([0.12, 0.012, 0.012], [0, 0.006, 0], { color: '#f07060', round: 0.2 })
      .ball([0.06, 0.05, 0.01], [0, 0.07, 0.016], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('packing peanut', 'home', 'parcels and bags', () => {
    const b = m('packing peanut');
    const nut = (x: number, y: number, z: number, r: number) =>
      b
        .ball([0.026, 0.02, 0.02], [x - 0.012 * Math.cos(r), y - 0.012 * Math.sin(r), z], { color: '#f4f4ef' })
        .ball([0.026, 0.02, 0.02], [x + 0.012 * Math.cos(r), y + 0.012 * Math.sin(r), z], { color: '#f4f4ef' })
        .ball([0.02, 0.016, 0.018], [x, y, z], { color: '#ecece4' });
    nut(-0.018, 0.012, 0, 0.2);
    nut(0.02, 0.012, 0.01, -0.3);
    nut(0, 0.03, -0.004, 1.0);
    return b.done();
  }),
  e('paddle', 'sports', 'boating', () =>
    m('paddle')
      .ball([0.18, 0.5, 0.025], [0, 0.25, 0], { color: 'wood' })
      .stick([0, 0.4, 0], [0, 1.18, 0], 0.03, 'lightwood')
      .ball([0.14, 0.09, 0.09], [0, 1.2, 0], { color: 'darkwood' })
      .done(),
  ),
  e('padlock', 'workshop', 'hardware', () =>
    m('padlock')
      .torus([0.046, 0.07, 0.012], [0, 0.06, 0], { color: 'steel', tube: 0.3 })
      .box([0.065, 0.056, 0.026], [0, 0.028, 0], { color: 'brass', round: 0.35 })
      .ball([0.01, 0.01, 0.004], [0, 0.032, 0.013], { color: 'black', noInk: true })
      .box([0.004, 0.012, 0.004], [0, 0.023, 0.013], { color: 'black', noInk: true })
      .done(),
  ),
  e('pads', 'garage', 'car parts', () =>
    m('pads')
      .box([0.12, 0.04, 0.1], [0, 0.02, -0.03], { color: 'darkgray' })
      .cyl([0.3, 0.025, 0.3], [0, 0.18, -0.03], { color: 'steel', rot: [90, 0, 0] })
      .cyl([0.12, 0.04, 0.12], [0, 0.18, -0.03], { color: 'darkgray', rot: [90, 0, 0] })
      .box([0.16, 0.08, 0.08], [0.06, 0.3, -0.03], { color: 'red', rot: [0, 0, -25], round: 0.4 })
      .box([0.13, 0.055, 0.012], [-0.075, 0.03, 0.08], { color: 'silver', rot: [-15, 0, 0] })
      .box([0.11, 0.045, 0.014], [-0.075, 0.03, 0.09], { color: 'darkgray', rot: [-15, 0, 0] })
      .box([0.13, 0.055, 0.012], [0.075, 0.03, 0.08], { color: 'silver', rot: [-15, 0, 0] })
      .box([0.11, 0.045, 0.014], [0.075, 0.03, 0.09], { color: 'darkgray', rot: [-15, 0, 0] })
      .done(),
  ),
  e('pager', 'tech', 'gadgets', () =>
    m('pager')
      .box([0.07, 0.05, 0.022], [0, 0.025, 0], { color: 'black', round: 0.4 })
      .box([0.052, 0.018, 0.004], [0, 0.033, 0.011], { color: '#9fe08a', glow: true })
      .ball(0.008, [-0.018, 0.012, 0.011], { color: 'gray' })
      .ball(0.008, [0, 0.012, 0.011], { color: 'gray' })
      .ball(0.008, [0.018, 0.012, 0.011], { color: 'gray' })
      .box([0.03, 0.035, 0.006], [0, 0.03, -0.013], { color: 'darkgray' })
      .done(),
  ),
  e('pagoda', 'places', 'landmarks', () => {
    const b = m('pagoda').box([5.5, 0.5, 5.5], [0, 0.25, 0], { color: 'stone' });
    let y = 0.5;
    for (let i = 0; i < 5; i++) {
      const w = 3.6 - i * 0.55, wh = i ? 1.4 : 2.0;
      b.box([w, wh, w], [0, y + wh / 2, 0], { color: '#b8402f', round: 0.05 });
      b.box([0.8, Math.min(1.2, wh * 0.7), 0.06], [0, y + wh * 0.45, w / 2 + 0.02], { color: 'gold' });
      b.cyl([(w + 1.6) * 1.414, 0.6, (w + 1.6) * 1.414], [0, y + wh + 0.3, 0], { color: '#3a4a5a', segs: 4, taper: 0.5, rot: [0, 45, 0] });
      y += wh + 0.6;
    }
    return b
      .stick([0, y - 0.2, 0], [0, y + 2, 0], 0.15, 'gold')
      .torus([0.5, 0.5, 0.1], [0, y + 0.5, 0], { color: 'gold', rot: [90, 0, 0] })
      .torus([0.4, 0.4, 0.1], [0, y + 0.9, 0], { color: 'gold', rot: [90, 0, 0] })
      .ball(0.3, [0, y + 2, 0], { color: 'gold' })
      .done();
  }),
  e('paint', 'workshop', 'paint', () =>
    m('paint')
      .cyl([0.17, 0.19, 0.17], [0, 0.095, 0], { color: 'silver' })
      .cyl([0.172, 0.1, 0.172], [0, 0.09, 0], { color: 'blue', noInk: true })
      .label('PAINT', [0.1, 0.04], [0, 0.09, 0.078], { color: 'white' })
      .cyl([0.15, 0.01, 0.15], [0, 0.19, 0], { color: 'blue' })
      .torus([0.17, 0.17, 0.012], [0, 0.19, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.08 })
      .capsule([0.025, 0.06, 0.012], [0.03, 0.165, 0.083], { color: 'blue', noInk: true })
      .capsule([0.02, 0.04, 0.012], [-0.04, 0.17, 0.08], { color: 'blue', noInk: true })
      .torus([0.18, 0.18, 0.008], [0, 0.19, 0], { color: 'gray', tube: 0.05 })
      .done(),
  ),
  e('paint brush', 'study', 'art supplies', () =>
    m('paint brush')
      .cyl([0.022, 0.17, 0.022], [0, 0.085, 0], { color: 'red', taper: 0.75 })
      .cyl([0.022, 0.04, 0.022], [0, 0.19, 0], { color: 'silver' })
      .cyl([0.024, 0.04, 0.02], [0, 0.23, 0], { color: 'tan', taper: 0.6 })
      .cone([0.012, 0.025, 0.009], [0, 0.262, 0], { color: 'blue' })
      .done(),
  ),
  e('paint roller', 'workshop', 'paint', () =>
    m('paint roller')
      .cyl([0.07, 0.2, 0.07], [0, 0.3, 0], { color: 'skyblue', rot: [0, 0, 90] })
      .cyl([0.074, 0.02, 0.074], [0.1, 0.3, 0], { color: 'gray', rot: [0, 0, 90] })
      .rod([0.115, 0.3, 0], [0.115, 0.22, 0], 0.008, 'silver')
      .rod([0.115, 0.22, 0], [0, 0.18, 0], 0.008, 'silver')
      .capsule([0.035, 0.16, 0.035], [0, 0.09, 0], { color: 'yellow' })
      .done(),
  ),
  e('paintball gun', 'sports', 'paintball', () =>
    m('paintball gun', { view: 'side' })
      .box([0.05, 0.12, 0.26], [0, 0.17, 0], { color: 'black' })
      .stick([0, 0.19, 0.12], [0, 0.19, 0.5], 0.032, 'darkgray')
      .box([0.04, 0.12, 0.05], [0, 0.06, -0.02], { color: 'darkgray', rot: [-15, 0, 0] })
      .torus([0.06, 0.05, 0.012], [0, 0.09, 0.05], { color: 'black', rot: [0, 90, 0], tube: 0.2 })
      .cyl([0.04, 0.05, 0.04], [0, 0.25, 0.04], { color: 'black' })
      .ball([0.12, 0.14, 0.12], [0, 0.33, 0.03], { color: 'yellow' })
      .ball(0.025, [0.04, 0.33, 0.06], { color: 'red', noInk: true })
      .cyl([0.075, 0.24, 0.075], [0, 0.15, -0.26], { color: 'blue', rot: [90, 0, 0] })
      .done(),
  ),
  e('pajamas', 'wardrobe', 'outfits', () => who('pajamas', { top: 'skyblue', bottom: 'skyblue', shoes: 'pink', long: true, style: 'short', acc: [hat('santa', 'skyblue')] })),
  e('palace', 'places', 'castles', () => {
    const b = m('palace')
      .box([12, 4, 5], [0, 2, 0], { color: 'white' })
      .box([4, 6, 5.4], [0, 3, 0], { color: 'cream' })
      .ball(3.4, [0, 6.6, 0], { color: 'gold' })
      .stick([0, 8.2, 0], [0, 9.4, 0], 0.15, 'gold')
      .ball(0.35, [0, 9.4, 0], { color: 'gold' })
      .box([1.6, 2.6, 0.1], [0, 1.3, 2.72], { color: 'darkred', name: 'door', pivot: [-0.8, 1.3, 2.72] })
      .box([5, 0.4, 1.2], [0, 0.2, 3.2], { color: 'stone' });
    b.pair((s) => b.cyl([1.6, 7, 1.6], [s * 5.5, 3.5, 0.5], { color: 'cream' }).ball(1.8, [s * 5.5, 7.5, 0.5], { color: 'gold' }).stick([s * 5.5, 8.2, 0.5], [s * 5.5, 9, 0.5], 0.1, 'gold'));
    b.pair((s) => b.each(2, (i) => b.stick([s * (3.0 + i * 0.9), 0, 2.6], [s * (3.0 + i * 0.9), 3.8, 2.6], 0.3, 'white')));
    b.pair((s) => b.box([0.7, 1.2, 0.08], [s * 3.45, 2.6, 2.52], { color: 'glass' }));
    return b.done();
  }),
  e('palette', 'study', 'art supplies', () => {
    const b = m('palette').cyl([0.32, 0.012, 0.22], [0, 0.11, 0], { color: 'lightwood', rot: [80, 0, 0] });
    const blob = (u: number, v: number, c: string) => b.ball([0.045, 0.035, 0.026], [u, 0.11 + v, -0.176 * v + 0.012], { color: c });
    blob(-0.1, 0.05, 'red');
    blob(-0.03, 0.075, 'yellow');
    blob(0.05, 0.07, 'blue');
    blob(0.11, 0.03, 'green');
    blob(-0.11, -0.03, 'white');
    blob(0.0, -0.06, 'purple');
    return b
      .cyl([0.04, 0.014, 0.03], [0.08, 0.07, 0.008], { color: '#5a3a22', rot: [80, 0, 0] })
      .rod([0.02, 0.0, 0.05], [0.16, 0.19, 0.02], 0.01, 'darkwood')
      .done();
  }),
  e('palm tree', 'garden', 'trees', () => {
    const pts: Vec3[] = [[0, 0, 0], [0.3, 2, 0], [0.8, 4, 0], [1.4, 5.8, 0]];
    const b = m('palm tree');
    for (let i = 0; i < 3; i++) b.rod(pts[i], pts[i + 1], 0.5 - i * 0.08, i % 2 ? '#a07850' : '#8a6440');
    const top = pts[3];
    b.ball(0.6, top, { color: '#6a8a3a', name: 'top' });
    b.each(7, (i) => spoke(b, top, (i / 7) * 360 + 10, -25 - (i % 2) * 15, 2.6, 0.08, 0.7, i % 2 ? 'leaf' : 'darkgreen', { parent: 'top' }));
    return b
      .ball(0.35, [top[0] + 0.25, top[1] - 0.35, top[2] + 0.2], { color: 'darkbrown' })
      .ball(0.35, [top[0] - 0.2, top[1] - 0.35, top[2] + 0.25], { color: 'darkbrown' })
      .ball(0.35, [top[0], top[1] - 0.4, top[2] - 0.25], { color: 'darkbrown' })
      .done();
  }),
  e('pan', 'kitchen', 'cookware', () =>
    m('pan')
      .cyl([0.26, 0.045, 0.26], [0, 0.0225, 0], { color: 'black', taper: 1.15 })
      .cyl([0.25, 0.01, 0.25], [0, 0.046, 0], { color: 'darkgray', noInk: true })
      .rod([0.14, 0.04, 0], [0.38, 0.065, 0], 0.03, 'black')
      .ball([0.12, 0.012, 0.1], [-0.02, 0.054, 0.01], { color: 'white' })
      .ball([0.045, 0.025, 0.045], [-0.02, 0.062, 0.015], { color: 'yellow' })
      .done(),
  ),
  e('pancake', 'food', 'breakfast', () => {
    const b = plate(m('pancake'), 0.24);
    b.each(4, (i) => b.cyl([0.16 - (i % 2) * 0.006, 0.022, 0.16], [0.003 * (i % 2), 0.028 + i * 0.022, 0], { color: i % 2 ? 'bread' : '#c98a42' }));
    return b
      .cyl([0.13, 0.008, 0.13], [0, 0.118, 0], { color: '#9a5a1a' })
      .capsule([0.02, 0.05, 0.012], [0.05, 0.095, 0.058], { color: '#9a5a1a', noInk: true })
      .capsule([0.02, 0.04, 0.012], [-0.04, 0.1, 0.064], { color: '#9a5a1a', noInk: true })
      .box([0.04, 0.018, 0.04], [0, 0.13, 0], { color: '#fbe39a' })
      .done();
  }),
  e('pancake mix', 'food', 'pantry', () =>
    m('pancake mix')
      .box([0.14, 0.2, 0.06], [0, 0.1, 0], { color: 'yellow', round: 0.1 })
      .label('PANCAKE MIX', [0.12, 0.05], [0, 0.16, 0.025], { color: 'red' })
      .cyl([0.08, 0.012, 0.08], [0, 0.065, 0.03], { color: 'bread', rot: [90, 0, 0] })
      .cyl([0.08, 0.012, 0.08], [0, 0.085, 0.032], { color: '#c98a42', rot: [90, 0, 0] })
      .box([0.02, 0.012, 0.004], [0, 0.11, 0.036], { color: '#fbe39a', noInk: true })
      .done(),
  ),
  e('pancreas', 'clinic', 'organs', () =>
    m('pancreas')
      .torus([0.075, 0.08, 0.035], [0.075, 0.042, 0], { color: '#d9707a', tube: 0.35 })
      .ball([0.065, 0.055, 0.045], [0.05, 0.03, 0], { color: '#f0b090' })
      .ball([0.06, 0.045, 0.038], [0.0, 0.035, 0], { color: '#f0b090' })
      .ball([0.05, 0.036, 0.032], [-0.045, 0.042, 0], { color: '#f0b090' })
      .ball([0.04, 0.028, 0.026], [-0.08, 0.052, 0], { color: '#f0b090' })
      .ball([0.015, 0.012, 0.01], [0.02, 0.05, 0.016], { color: '#f8c8a8', noInk: true })
      .ball([0.015, 0.012, 0.01], [-0.03, 0.05, 0.014], { color: '#f8c8a8', noInk: true })
      .done(),
  ),
  e('pansy', 'garden', 'flowers', () => {
    const b = m('pansy')
      .cyl([0.1, 0.08, 0.1], [0, 0.04, 0], { color: '#c8693e', taper: 1.2 })
      .ball([0.11, 0.03, 0.11], [0, 0.08, 0], { color: 'dirt' })
      .rod([0, 0.08, 0], [0, 0.17, 0.01], 0.008, 'green')
      .ball([0.06, 0.02, 0.035], [0.04, 0.095, 0.02], { color: 'leaf', rot: [0, 0, 20] })
      .ball([0.06, 0.02, 0.035], [-0.04, 0.095, 0.01], { color: 'leaf', rot: [0, 0, -20] });
    const pet = (x: number, y: number, s: number, c: string) => b.ball([s, s, 0.012], [x, y, 0.02], { color: c });
    pet(-0.022, 0.21, 0.05, 'purple');
    pet(0.022, 0.21, 0.05, 'purple');
    pet(-0.03, 0.175, 0.045, '#b48ae0');
    pet(0.03, 0.175, 0.045, '#b48ae0');
    pet(0, 0.16, 0.05, '#b48ae0');
    return b.ball([0.035, 0.035, 0.01], [0, 0.175, 0.03], { color: '#3a2050', noInk: true }).ball(0.014, [0, 0.18, 0.034], { color: 'yellow' }).done();
  }),
  e('pants', 'wardrobe', 'trousers', () => {
    const b = m('pants')
      .box([0.4, 0.06, 0.22], [0, 0.97, 0], { color: 'darkbrown' })
      .box([0.4, 0.22, 0.22], [0, 0.83, 0], { color: 'denim', round: 0.3 })
      .box([0.012, 0.16, 0.01], [0, 0.85, 0.111], { color: '#3a5a8a', noInk: true });
    b.pair((s) => b.box([0.19, 0.78, 0.2], [s * 0.105, 0.4, 0], { color: 'denim', rot: [0, 0, s * 2], round: 0.3 }).box([0.08, 0.06, 0.01], [s * 0.12, 0.86, 0.112], { color: '#3a5a8a', noInk: true }));
    return b.box([0.05, 0.03, 0.012], [0, 0.97, 0.112], { color: 'brass' }).done();
  }),
  e('panty hose', 'wardrobe', 'hosiery', () => {
    const b = m('panty hose').box([0.3, 0.08, 0.14], [0, 0.86, 0], { color: '#2a2628', round: 0.4 }).ball([0.3, 0.16, 0.15], [0, 0.78, 0], { color: '#4a3e44' });
    b.pair((s) =>
      b
        .rod([s * 0.07, 0.75, 0], [s * 0.08, 0.42, 0.01], 0.1, '#4a3e44')
        .rod([s * 0.08, 0.42, 0.01], [s * 0.085, 0.07, 0], 0.07, '#4a3e44')
        .box([0.07, 0.05, 0.16], [s * 0.085, 0.025, 0.05], { color: '#2a2628', round: 0.6 }),
    );
    return b.done();
  }),
  e('papaya', 'food', 'fruit', () =>
    m('papaya')
      .ball([0.11, 0.19, 0.11], [-0.04, 0.095, 0], { color: '#a8c040' })
      .ball([0.08, 0.12, 0.06], [-0.04, 0.08, 0.03], { color: '#f0a040', noInk: true })
      .cyl([0.012, 0.02, 0.012], [-0.04, 0.195, 0], { color: 'darkbrown' })
      .ball([0.1, 0.045, 0.17], [0.08, 0.022, 0.03], { color: '#a8c040' })
      .ball([0.09, 0.02, 0.15], [0.08, 0.042, 0.03], { color: '#f58a3a' })
      .ball([0.03, 0.01, 0.08], [0.08, 0.05, 0.035], { color: '#2a2020' })
      .done(),
  ),
  e('paper', 'study', 'paper', () => {
    const b = m('paper')
      .box([0.21, 0.05, 0.297], [0, 0.025, 0], { color: 'white', round: 0.05 })
      .box([0.212, 0.03, 0.12], [0, 0.025, 0], { color: 'skyblue', noInk: true })
      .box([0.21, 0.004, 0.297], [0.01, 0.052, 0.01], { color: 'paper', rot: [0, 8, 0] });
    b.each(6, (i) => b.box([0.15, 0.002, 0.004], [0.01, 0.055, -0.09 + i * 0.035], { color: 'skyblue', noInk: true, rot: [0, 8, 0] }));
    return b.done();
  }),
  e('paper airplane', 'toys', 'paper toys', () => {
    const b = m('paper airplane', { view: 'side' });
    b.pair((s) => b.wedge([0.1, 0.26, 0.008], [s * 0.05, 0.07, 0], { color: 'white', rot: [90, s * 12, 0], apex: -s * 0.5 }));
    return b.wedge([0.05, 0.26, 0.02], [0, 0.04, 0], { color: 'paper', rot: [0, 90, 90], apex: 0.5 }).done();
  }),
  e('paper bag (container)', 'home', 'parcels and bags', () =>
    m('paper bag (container)')
      .box([0.26, 0.3, 0.16], [0, 0.15, 0], { color: '#c8a06a', round: 0.05 })
      .box([0.265, 0.03, 0.165], [0, 0.29, 0], { color: '#d8b07a', round: 0.1 })
      .capsule([0.05, 0.3, 0.05], [0.06, 0.36, -0.02], { color: 'bread', rot: [0, 0, -15] })
      .ball([0.1, 0.1, 0.08], [-0.06, 0.32, 0.0], { color: 'lettuce' })
      .ball(0.06, [-0.01, 0.32, 0.04], { color: 'red' })
      .done(),
  ),
  e('paper cutter', 'study', 'office tools', () => {
    const b = m('paper cutter').box([0.4, 0.03, 0.3], [0, 0.015, 0], { color: 'white' });
    b.each(4, (i) => b.box([0.38, 0.002, 0.004], [0, 0.031, -0.1 + i * 0.065], { color: 'skyblue', noInk: true }));
    return b
      .box([0.4, 0.035, 0.03], [0, 0.02, 0.15], { color: 'steel' })
      .rod([0.19, 0.045, 0.15], [-0.14, 0.26, 0.15], 0.028, 'silver', { name: 'lid', pivot: [0.19, 0.045, 0.15] })
      .capsule([0.035, 0.09, 0.035], [-0.17, 0.285, 0.15], { color: 'black', rot: [0, 0, 55], parent: 'lid' })
      .box([0.2, 0.004, 0.14], [0.02, 0.033, -0.03], { color: 'paper', rot: [0, 10, 0] })
      .done();
  }),
  e('paper towels', 'kitchen', 'kitchen supplies', () =>
    m('paper towels')
      .cyl([0.16, 0.02, 0.16], [0, 0.01, 0], { color: 'wood' })
      .cyl([0.12, 0.26, 0.12], [0, 0.15, 0], { color: 'white' })
      .cyl([0.04, 0.262, 0.04], [0, 0.15, 0], { color: 'tan' })
      .stick([0, 0.02, 0], [0, 0.3, 0], 0.02, 'wood')
      .ball(0.03, [0, 0.305, 0], { color: 'wood' })
      .box([0.1, 0.12, 0.006], [0, 0.07, 0.062], { color: 'white' })
      .box([0.1, 0.003, 0.004], [0, 0.11, 0.066], { color: 'lightgray', noInk: true })
      .done(),
  ),
  e('paperclip', 'study', 'stationery', () => {
    const b = m('paperclip');
    const pts: Array<[number, number]> = [[-0.007, 0.03], [-0.007, 0.08]];
    const arc = (x1: number, x2: number, y: number, up: boolean) => {
      const c = (x1 + x2) / 2, r = Math.abs(x2 - x1) / 2;
      for (const k of [0.25, 0.5, 0.75, 1]) {
        const a = Math.PI * (x1 < x2 ? 1 - k : k);
        pts.push([c + Math.cos(a) * r, y + (up ? 1 : -1) * Math.sin(a) * r]);
      }
    };
    arc(-0.007, 0.007, 0.08, true);
    pts.push([0.007, 0.014]);
    arc(0.007, -0.014, 0.014, false);
    pts.push([-0.014, 0.088]);
    arc(-0.014, 0.014, 0.088, true);
    pts.push([0.014, 0.036]);
    for (let i = 0; i + 1 < pts.length; i++) b.rod([pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.0075, 'silver');
    return b.done();
  }),
  e('paperweight', 'study', 'desk things', () =>
    m('paperweight')
      .box([0.16, 0.006, 0.12], [0, 0.003, 0], { color: 'paper' })
      .cyl([0.08, 0.025, 0.08], [0, 0.018, 0], { color: 'glass', taper: 0.9 })
      .ball([0.072, 0.06, 0.072], [0, 0.032, 0], { color: 'glass' })
      .ball([0.02, 0.015, 0.008], [0, 0.055, 0.028], { color: 'red', noInk: true })
      .ball([0.018, 0.014, 0.008], [-0.017, 0.048, 0.027], { color: 'yellow', noInk: true })
      .ball([0.018, 0.014, 0.008], [0.017, 0.048, 0.027], { color: 'blue', noInk: true })
      .ball([0.018, 0.014, 0.008], [0, 0.04, 0.031], { color: 'magenta', noInk: true })
      .done(),
  ),
  e('paprika', 'food', 'spices', () => jar('paprika', 0.1, 0.05, '#c0391b', 'red', 'PAPRIKA').cone([0.06, 0.025, 0.06], [0.06, 0.0125, 0.02], { color: '#c0391b' }).done()),
  e('papyrus', 'garden', 'water plants', () => {
    const b = m('papyrus').cyl([0.9, 0.04, 0.9], [0, 0.02, 0], { color: 'water' }).ball([0.35, 0.18, 0.35], [0, 0.09, 0], { color: 'darkgreen' });
    const tops: Vec3[] = [[0, 2.0, 0], [0.35, 1.7, 0.1], [-0.35, 1.75, 0.05], [0.15, 1.5, 0.3], [-0.2, 1.45, -0.25], [0.25, 1.85, -0.2]];
    for (const t of tops) b.rod([t[0] * 0.15, 0.1, t[2] * 0.15], t, 0.035, 'green').ball([0.42, 0.2, 0.42], [t[0], t[1] + 0.05, t[2]], { color: 'lime' });
    return b.done();
  }),
  e('parachute', 'sky', 'flying things', () => {
    const b = m('parachute')
      .cyl([5, 0.8, 5], [0, 5.5, 0], { color: 'red', taper: 0.72 })
      .cyl([5.04, 0.25, 5.04], [0, 5.3, 0], { color: 'white', taper: 0.9, noInk: true })
      .ball([3.7, 1.5, 3.7], [0, 5.95, 0], { color: 'red' })
      .ball([1.2, 0.55, 1.2], [0, 6.55, 0], { color: 'white' });
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      b.rod([Math.cos(a) * 2.4, 5.1, Math.sin(a) * 2.4], [0, 1.55, 0], 0.03, 'darkgray');
    });
    b.capsule([0.42, 0.75, 0.3], [0, 1.15, 0], { color: 'orange' }).ball(0.3, [0, 1.72, 0], { color: 'skin2' }).ball([0.33, 0.2, 0.33], [0, 1.82, 0], { color: 'white' });
    b.pair((s) => b.rod([s * 0.1, 0.8, 0], [s * 0.15, 0.05, 0.05], 0.13, 'navy').rod([s * 0.2, 1.4, 0], [s * 0.45, 1.65, 0], 0.1, 'orange'));
    return b.done();
  }),
  e('parallelogram', 'ideas', 'shapes', () =>
    plinth(m('parallelogram'), 0.22)
      .box([0.16, 0.12, 0.03], [0, 0.09, 0], { color: 'orange', round: 0 })
      .wedge([0.06, 0.12, 0.03], [-0.11, 0.09, 0], { color: 'orange', apex: 0.5 })
      .wedge([0.06, 0.12, 0.03], [0.11, 0.09, 0], { color: 'orange', apex: 0.5, rot: [0, 0, 180] })
      .done(),
  ),
  e('parcel', 'home', 'parcels and bags', () =>
    m('parcel')
      .box([0.28, 0.16, 0.2], [0, 0.08, 0], { color: '#b88a5a', round: 0.08 })
      .box([0.284, 0.164, 0.012], [0, 0.08, 0], { color: 'cream', noInk: true, round: 0.08 })
      .box([0.012, 0.164, 0.204], [0, 0.08, 0], { color: 'cream', noInk: true, round: 0.08 })
      .torus([0.06, 0.04, 0.012], [-0.03, 0.17, 0], { color: 'red', tube: 0.35, rot: [0, 0, 20] })
      .torus([0.06, 0.04, 0.012], [0.03, 0.17, 0], { color: 'red', tube: 0.35, rot: [0, 0, -20] })
      .ball(0.022, [0, 0.165, 0], { color: 'red' })
      .label('TO:', [0.08, 0.05], [0.08, 0.06, 0.098], { color: 'white' })
      .done(),
  ),
  e('park', 'places', 'parks', () => {
    const b = m('park').box([10, 0.2, 8], [0, 0.1, 0], { color: 'grass' }).box([1.4, 0.06, 8], [1, 0.22, 0], { color: 'sand' });
    miniTree(b, -3, -2, 4.5, 'leaf');
    miniTree(b, 3.5, -2.5, 4, 'darkgreen');
    miniTree(b, 4, 2.5, 3.5, 'leaf');
    b.box([1.6, 0.1, 0.5], [-1.4, 0.65, 1.5], { color: 'wood' }).box([1.6, 0.4, 0.08], [-1.4, 0.95, 1.25], { color: 'wood' });
    b.pair((s) => b.stick([-1.4 + s * 0.65, 0.2, 1.5], [-1.4 + s * 0.65, 0.62, 1.5], 0.08, 'iron'));
    return b
      .stick([2.2, 0.2, 1.5], [2.2, 3, 1.5], 0.1, 'iron')
      .ball(0.35, [2.2, 3.1, 1.5], { color: 'yellow', glow: true })
      .cyl([2.2, 0.06, 1.6], [-3, 0.22, 2.2], { color: 'water' })
      .stick([-0.6, 0.2, 3.4], [-0.6, 1.3, 3.4], 0.08, 'darkwood')
      .label('PARK', [1.0, 0.45], [-0.6, 1.4, 3.45], { color: 'darkgreen' })
      .done();
  }),
  e('parking lot', 'places', 'parking', () => {
    const b = m('parking lot').box([8, 0.1, 6], [0, 0.05, 0], { color: '#4a4d52' });
    b.each(5, (i) => b.box([0.08, 0.01, 2.4], [-3.6 + i * 1.9, 0.105, -1.5], { color: 'white', noInk: true }));
    miniCar(b, -2.65, 0.1, -1.4, 'red');
    miniCar(b, 0.95, 0.1, -1.4, 'blue');
    return b.stick([3.4, 0.1, 2.4], [3.4, 2.2, 2.4], 0.08, 'gray').label('P', [0.7, 0.7], [3.4, 2.3, 2.45], { color: 'blue' }).done();
  }),
  e('parking meter', 'places', 'street things', () =>
    m('parking meter')
      .cyl([0.25, 0.04, 0.25], [0, 0.02, 0], { color: 'darkgray' })
      .stick([0, 0.04, 0], [0, 1.1, 0], 0.08, 'darkgray')
      .box([0.25, 0.32, 0.18], [0, 1.26, 0], { color: 'silver', round: 0.4 })
      .ball([0.25, 0.14, 0.18], [0, 1.42, 0], { color: 'silver' })
      .ball([0.17, 0.12, 0.04], [0, 1.33, 0.08], { color: 'glass' })
      .box([0.05, 0.06, 0.02], [0.02, 1.33, 0.1], { color: 'red', noInk: true })
      .box([0.06, 0.012, 0.02], [0, 1.18, 0.09], { color: 'black', noInk: true })
      .ball(0.04, [0.13, 1.2, 0], { color: 'gray' })
      .done(),
  ),
  e('parking structure', 'places', 'parking', () => {
    const b = m('parking structure');
    b.each(4, (i) => b.box([10, 0.4, 7], [0, 0.2 + i * 2.8, 0], { color: 'stone' }));
    b.each(3, (i) => b.box([10, 0.8, 0.2], [0, 3.4 + i * 2.8, 3.4], { color: 'lightgray' }));
    for (const x of [-4.8, -1.6, 1.6, 4.8]) for (const z of [-3.3, 3.3]) b.stick([x, 0, z], [x, 8.6, z], 0.75, 'gray');
    miniCar(b, -2.5, 0.4, -0.5, 'red');
    miniCar(b, 2.5, 3.2, -0.5, 'yellow');
    miniCar(b, 0, 6.0, -0.5, 'green');
    return b.box([1.6, 1.6, 0.2], [4.2, 10.0, 3.3], { color: 'blue' }).label('P', [1.2, 1.2], [4.2, 10.0, 3.42], { color: 'blue' }).stick([4.2, 8.8, 3.3], [4.2, 9.2, 3.3], 0.2, 'gray').done();
  }),
  e('parking ticket', 'study', 'papers', () =>
    m('parking ticket')
      .box([0.1, 0.012, 0.06], [0, 0.006, 0], { color: 'darkgray' })
      .box([0.1, 0.16, 0.014], [0, 0.085, 0], { color: 'orange', rot: [-8, 0, 0] })
      .label('PARKING TICKET', [0.08, 0.06], [0, 0.12, 0.006], { color: 'white', rot: [-8, 0, 0] })
      .label('$50', [0.06, 0.03], [0, 0.06, 0.012], { color: 'yellow', rot: [-8, 0, 0] })
      .done(),
  ),
  e('party favor', 'toys', 'party', () => {
    const b = m('party favor')
      .box([0.1, 0.11, 0.06], [0, 0.055, 0], { color: 'pink', round: 0.2 })
      .cyl([0.06, 0.04, 0.04], [0, 0.13, 0], { color: 'pink', taper: 2 })
      .torus([0.04, 0.025, 0.01], [-0.015, 0.115, 0.02], { color: 'blue', tube: 0.35 })
      .torus([0.04, 0.025, 0.01], [0.015, 0.115, 0.02], { color: 'blue', tube: 0.35 })
      .stick([0.02, 0.1, 0], [0.04, 0.2, 0], 0.006, 'white')
      .cyl([0.045, 0.015, 0.045], [0.042, 0.21, 0], { color: 'red', rot: [90, 0, 0] });
    b.each(6, (i) => b.ball([0.016, 0.016, 0.006], [-0.035 + (i % 3) * 0.035, 0.03 + Math.floor(i / 3) * 0.04, 0.03], { color: i % 2 ? 'yellow' : 'white', noInk: true }));
    return b.done();
  }),
  e('party hat', 'toys', 'party', () => {
    const b = m('party hat').cone([0.14, 0.2, 0.14], [0, 0.11, 0], { color: 'blue' }).torus([0.15, 0.15, 0.025], [0, 0.012, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.25 });
    b.each(6, (i) => {
      const y = 0.05 + (i % 3) * 0.045, r = 0.07 * (1 - (y - 0.01) / 0.2), a = i * 1.1 - 1.2;
      b.ball(0.02, [Math.sin(a) * r, y, Math.cos(a) * r], { color: i % 2 ? 'yellow' : 'pink', noInk: true });
    });
    return b.ball(0.045, [0, 0.215, 0], { color: 'yellow' }).done();
  }),
  e('pasta', 'food', 'pasta', () => {
    const b = plate(m('pasta'), 0.26).ball([0.19, 0.07, 0.17], [0, 0.04, 0], { color: '#f3d98b' });
    b.each(5, (i) => b.torus([0.06, 0.05, 0.01], [-0.05 + i * 0.025, 0.065, -0.03 + (i % 2) * 0.05], { color: '#f3d98b', rot: [70 + i * 12, i * 40, 0], tube: 0.18 }));
    return b
      .ball([0.1, 0.03, 0.09], [0, 0.075, 0], { color: 'tomato' })
      .ball(0.032, [0.025, 0.09, 0.015], { color: 'darkbrown' })
      .ball(0.032, [-0.03, 0.088, 0.0], { color: 'darkbrown' })
      .ball(0.03, [0.0, 0.092, -0.03], { color: 'darkbrown' })
      .ball([0.03, 0.008, 0.02], [0.005, 0.11, 0.0], { color: 'leaf' })
      .rod([0.03, 0.08, 0.02], [0.07, 0.26, -0.02], 0.012, 'silver')
      .done();
  }),
  e('pastry', 'food', 'bakery', () => {
    const b = m('pastry');
    const sz: Vec3[] = [[0.04, 0.026, 0.026], [0.055, 0.04, 0.045], [0.07, 0.052, 0.056], [0.055, 0.04, 0.045], [0.04, 0.026, 0.026]];
    b.each(5, (i) => {
      const th = 25 + i * 32.5, r = (th * Math.PI) / 180;
      b.ball(sz[i], [Math.cos(r) * 0.06, sz[i][1] / 2, -0.05 + Math.sin(r) * 0.06], { color: i % 2 ? 'bread' : 'crust', rot: [0, th + 90, 0] });
    });
    return b.done();
  }),
  e('patches', 'wardrobe', 'sewing', () =>
    m('patches')
      .box([0.18, 0.2, 0.02], [0, 0.1, 0], { color: 'denim', rot: [-8, 0, 0] })
      .cyl([0.08, 0.008, 0.08], [-0.035, 0.14, 0.012], { color: 'red', rot: [82, 0, 0] })
      .torus([0.08, 0.08, 0.006], [-0.035, 0.14, 0.017], { color: 'yellow', rot: [-8, 0, 0], tube: 0.1, noInk: true })
      .star(0.055, [-0.035, 0.14, 0.022], { color: 'yellow', round: 0.006 })
      .heart(0.06, [0.045, 0.065, 0.02], { color: 'pink' })
      .box([0.06, 0.04, 0.008], [0.05, 0.155, 0.013], { color: 'lime', rot: [-8, 0, 0] })
      .done(),
  ),
  e('patio', 'places', 'yards', () => {
    const b = m('patio').box([3, 0.1, 3], [0, 0.05, 0], { color: 'stone' });
    b.each(5, (i) => b.box([3, 0.004, 0.03], [0, 0.102, -1.2 + i * 0.6], { color: 'gray', noInk: true }));
    b.cyl([0.9, 0.04, 0.9], [0, 0.74, 0], { color: 'white' }).stick([0, 0.1, 0], [0, 0.72, 0], 0.06, 'white').cyl([0.4, 0.04, 0.4], [0, 0.12, 0], { color: 'white' });
    b.stick([0, 0.76, 0], [0, 2.2, 0], 0.04, 'white').cone([2.2, 0.45, 2.2], [0, 2.1, 0], { color: 'red', segs: 8 }).cyl([2.22, 0.12, 2.22], [0, 1.9, 0], { color: 'white', segs: 8, noInk: true });
    b.pair((s) => b.box([0.45, 0.06, 0.45], [s * 0.85, 0.46, 0.2], { color: 'wood' }).box([0.45, 0.45, 0.05], [s * 0.85, 0.72, 0.42], { color: 'wood', rot: [-10, 0, 0] }).box([0.4, 0.38, 0.4], [s * 0.85, 0.24, 0.2], { color: 'darkwood', round: 0.1 }));
    return b.cyl([0.35, 0.35, 0.35], [-1.2, 0.27, -1.2], { color: '#c8693e', taper: 1.2 }).ball([0.5, 0.5, 0.5], [-1.2, 0.65, -1.2], { color: 'leaf' }).done();
  }),
  e('patrol boat', 'garage', 'boats', () =>
    m('patrol boat', { view: 'side' })
      .box([2.6, 1.2, 6.5], [0, 0.6, -0.5], { color: 'white', round: 0.3 })
      .wedge([2.6, 2.4, 1.2], [0, 0.6, 3.95], { color: 'white', rot: [90, 0, 0] })
      .box([2.64, 0.3, 6.4], [0, 0.85, -0.5], { color: 'blue', noInk: true })
      .box([2.0, 1.4, 3.0], [0, 1.9, -0.6], { color: 'white', round: 0.2 })
      .box([2.04, 0.5, 2.6], [0, 2.2, -0.5], { color: 'glass', round: 0.2 })
      .label('POLICE', [0.05, 0.3], [1.33, 0.55, -0.5], { color: 'blue', rot: [0, 90, 0] })
      .box([1.0, 0.15, 0.3], [0, 2.7, -0.2], { color: 'black' })
      .box([0.4, 0.15, 0.25], [0.28, 2.82, -0.2], { color: 'red', glow: true })
      .box([0.4, 0.15, 0.25], [-0.28, 2.82, -0.2], { color: 'blue', glow: true })
      .stick([0, 2.6, -1.6], [0, 3.8, -1.6], 0.08, 'gray')
      .box([0.9, 0.12, 0.15], [0, 3.8, -1.6], { color: 'white', name: 'rotor' })
      .done(),
  ),
  e('pawnshop', 'places', 'shops', () =>
    bldg('pawnshop', { w: 6, h: 4, d: 5, wall: '#d8c8a8', roof: 'darkbrown', sign: 'PAWN', signColor: 'gold' })
      .rod([2.4, 3.6, 2.5], [2.4, 3.6, 3.6], 0.1, 'iron')
      .stick([2.4, 3.6, 3.5], [2.4, 3.2, 3.5], 0.05, 'iron')
      .ball(0.4, [2.15, 2.95, 3.5], { color: 'gold' })
      .ball(0.4, [2.65, 2.95, 3.5], { color: 'gold' })
      .ball(0.4, [2.4, 2.58, 3.5], { color: 'gold' })
      .done(),
  ),
  e('pay phone', 'places', 'street things', () => {
    const b = m('pay phone')
      .box([0.4, 0.04, 0.3], [0, 0.02, 0], { color: 'darkgray' })
      .stick([0, 0.04, 0], [0, 1.05, 0], 0.12, 'steel')
      .box([0.55, 0.75, 0.3], [0, 1.4, 0], { color: 'blue', round: 0.1 })
      .box([0.36, 0.58, 0.2], [0, 1.37, 0.1], { color: 'silver', round: 0.2 })
      .capsule([0.08, 0.28, 0.08], [-0.13, 1.42, 0.22], { color: 'black' })
      .label('PHONE', [0.4, 0.1], [0, 1.73, 0.15], { color: 'blue' })
      .box([0.06, 0.012, 0.02], [0.1, 1.6, 0.2], { color: 'black', noInk: true });
    b.each(9, (i) => b.box([0.035, 0.03, 0.015], [0.04 + (i % 3) * 0.05, 1.42 - Math.floor(i / 3) * 0.05, 0.205], { color: 'darkgray', noInk: true }));
    return b.done();
  }),
  e('pda', 'tech', 'gadgets', () => {
    const b = m('pda')
      .box([0.08, 0.12, 0.018], [0, 0.06, 0], { color: 'darkgray', round: 0.3 })
      .box([0.064, 0.075, 0.004], [0, 0.075, 0.009], { color: '#b8d8a8', glow: true })
      .stick([0.046, 0.0, -0.004], [0.046, 0.11, -0.004], 0.006, 'silver');
    b.each(4, (i) => b.ball([0.012, 0.012, 0.006], [-0.024 + i * 0.016, 0.022, 0.009], { color: i === 1 || i === 2 ? 'blue' : 'gray' }));
    return b.done();
  }),
  e('pea', 'food', 'vegetables', () =>
    m('pea')
      .ball(0.03, [-0.016, 0.015, 0], { color: 'lime' })
      .ball(0.03, [0.016, 0.015, 0], { color: '#7cc45a' })
      .ball(0.03, [0, 0.015, -0.026], { color: '#7cc45a' })
      .ball(0.03, [0, 0.038, -0.009], { color: 'lime' })
      .done(),
  ),
  e('pea shooter', 'fantasy', 'magic plants', () =>
    m('pea shooter')
      .ball([0.3, 0.05, 0.12], [0.08, 0.025, 0.02], { color: 'darkgreen', rot: [0, 30, 0] })
      .ball([0.3, 0.05, 0.12], [-0.08, 0.025, 0.0], { color: 'green', rot: [0, -30, 0] })
      .rod([0, 0.02, 0], [0, 0.3, 0], 0.04, 'green')
      .ball(0.16, [0, 0.36, 0], { color: 'lime', name: 'head', pivot: [0, 0.3, 0] })
      .cyl([0.09, 0.14, 0.09], [0, 0.37, 0.12], { color: 'lime', rot: [90, 0, 0], taper: 1.25, parent: 'head' })
      .cyl([0.07, 0.01, 0.07], [0, 0.37, 0.192], { color: 'darkgreen', rot: [90, 0, 0], parent: 'head' })
      .ball(0.03, [0.04, 0.41, 0.07], { color: 'black', eye: true, parent: 'head' })
      .ball(0.03, [-0.04, 0.41, 0.07], { color: 'black', eye: true, parent: 'head' })
      .ball([0.05, 0.08, 0.03], [0, 0.45, -0.07], { color: 'green', rot: [-40, 0, 0], parent: 'head' })
      .ball(0.06, [0, 0.37, 0.38], { color: 'lime' })
      .done(),
  ),
  e('peach (fruit)', 'food', 'fruit', () =>
    m('peach (fruit)')
      .ball([0.076, 0.072, 0.074], [0, 0.036, 0], { color: '#f9b07a' })
      .ball([0.05, 0.055, 0.04], [0.016, 0.04, 0.02], { color: '#e8705a', noInk: true })
      .rod([-0.003, 0.012, 0.036], [0.0, 0.065, 0.03], 0.004, '#d8604a', { noInk: true })
      .cyl([0.006, 0.012, 0.006], [0, 0.075, 0], { color: 'darkbrown' })
      .ball([0.045, 0.006, 0.02], [0.022, 0.079, 0], { color: 'leaf', rot: [0, 0, 15] })
      .done(),
  ),
  e('peach tree', 'garden', 'fruit trees', () => tree('peach tree', { h: 4.5, crown: 'leaf', fruit: '#f9a87a', n: 14 }).done()),
  e('peacock feather', 'aviary', 'feathers', () =>
    m('peacock feather')
      .cyl([0.14, 0.2, 0.14], [0, 0.1, 0], { color: 'navy', taper: 0.6 })
      .rod([0, 0.15, 0], [0.06, 1.35, 0], 0.016, 'cream')
      .ball([0.26, 0.95, 0.02], [0.04, 0.75, 0], { color: '#7a8a3a', rot: [0, 0, -3] })
      .ball([0.3, 0.36, 0.04], [0.06, 1.3, 0.02], { color: '#c8a040' })
      .ball([0.2, 0.25, 0.04], [0.06, 1.29, 0.035], { color: '#20b0a0' })
      .ball([0.11, 0.14, 0.04], [0.06, 1.28, 0.05], { color: '#203a8a' })
      .done(),
  ),
  e('peanut', 'food', 'nuts', () =>
    m('peanut')
      .ball(0.036, [0, 0.018, 0], { color: '#d9b07a' })
      .ball([0.028, 0.03, 0.028], [0, 0.036, 0], { color: '#d9b07a' })
      .ball(0.033, [0.003, 0.052, 0], { color: '#d9b07a' })
      .ball([0.006, 0.006, 0.004], [0.006, 0.02, 0.017], { color: '#a8804a', noInk: true })
      .ball([0.006, 0.006, 0.004], [-0.006, 0.055, 0.016], { color: '#a8804a', noInk: true })
      .ball([0.018, 0.024, 0.016], [0.035, 0.009, 0.02], { color: '#b8604a' })
      .done(),
  ),
  e('peanut butter', 'food', 'spreads', () =>
    jar('peanut butter', 0.11, 0.09, '#b07a3a', 'red', 'PEANUT BUTTER', 'cream')
      .box([0.016, 0.1, 0.004], [0.06, 0.05, 0.05], { color: 'silver', rot: [0, 0, 15] })
      .ball([0.02, 0.03, 0.01], [0.072, 0.09, 0.05], { color: '#b07a3a' })
      .done(),
  ),
  e('peanuts', 'food', 'nuts', () => {
    const b = m('peanuts').cyl([0.14, 0.05, 0.14], [0, 0.025, 0], { color: 'blue', taper: 1.4 });
    b.each(7, (i) => {
      const a = i * 0.9, r = i ? 0.045 : 0, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.055 + (i ? 0 : 0.012);
      b.ball([0.035, 0.022, 0.02], [x - 0.01, y, z], { color: '#d9b07a', rot: [0, a * 57, 0] }).ball([0.03, 0.02, 0.018], [x + 0.012, y, z], { color: '#d9b07a', rot: [0, a * 57, 0] });
    });
    return b.done();
  }),
  e('pear', 'food', 'fruit', () =>
    m('pear')
      .ball([0.075, 0.07, 0.072], [0, 0.035, 0], { color: '#c8d84a' })
      .ball([0.05, 0.065, 0.05], [0.004, 0.085, 0], { color: '#c8d84a' })
      .rod([0.004, 0.11, 0], [0.012, 0.135, 0], 0.006, 'darkbrown')
      .ball([0.04, 0.006, 0.018], [0.028, 0.125, 0], { color: 'leaf', rot: [0, 0, 25] })
      .ball([0.03, 0.03, 0.02], [-0.018, 0.04, 0.025], { color: '#e0b040', noInk: true })
      .done(),
  ),
  e('pear tree', 'garden', 'fruit trees', () => tree('pear tree', { h: 5.5, crown: 'leaf', fruit: '#d8e05a', n: 12, fs: 0.26, pear: true }).done()),
  e('pearl', 'wardrobe', 'jewellery', () =>
    m('pearl')
      .ball([0.13, 0.035, 0.11], [0, 0.0175, 0], { color: '#9a9488' })
      .ball([0.11, 0.02, 0.09], [0, 0.032, 0], { color: '#e8e0f0' })
      .ball([0.13, 0.03, 0.11], [0, 0.075, -0.05], { color: '#8a847a', rot: [-60, 0, 0], name: 'lid', pivot: [0, 0.035, -0.05] })
      .ball(0.04, [0, 0.055, 0.008], { color: 'white' })
      .done(),
  ),
  e('pebble', 'nature', 'rocks', () =>
    m('pebble')
      .ball([0.1, 0.04, 0.07], [0, 0.02, 0], { color: 'stone' })
      .ball([0.07, 0.034, 0.05], [0.004, 0.055, 0], { color: 'gray', rot: [0, 30, 4] })
      .ball([0.045, 0.03, 0.035], [-0.002, 0.084, 0], { color: '#b9b4a8', rot: [0, -20, 0] })
      .done(),
  ),
  e('pecan', 'food', 'nuts', () =>
    m('pecan')
      .ball([0.034, 0.06, 0.034], [0, 0.03, 0], { color: '#8a5a2b' })
      .cone([0.012, 0.012, 0.012], [0, 0.064, 0], { color: '#5a3a22' })
      .capsule([0.006, 0.04, 0.004], [0.006, 0.03, 0.016], { color: '#4a2a18', noInk: true })
      .capsule([0.006, 0.04, 0.004], [-0.008, 0.032, 0.015], { color: '#4a2a18', noInk: true })
      .ball([0.03, 0.016, 0.046], [0.04, 0.008, 0.02], { color: '#a0603a' })
      .done(),
  ),
  e('pedestal', 'home', 'decor', () =>
    m('pedestal')
      .box([0.5, 0.1, 0.5], [0, 0.05, 0], { color: '#eeeae0' })
      .cyl([0.4, 0.06, 0.4], [0, 0.13, 0], { color: '#e4dfd2' })
      .cyl([0.3, 0.7, 0.3], [0, 0.5, 0], { color: '#eeeae0', segs: 12 })
      .cyl([0.4, 0.06, 0.4], [0, 0.88, 0], { color: '#e4dfd2' })
      .box([0.5, 0.08, 0.5], [0, 0.95, 0], { color: '#eeeae0' })
      .done(),
  ),
  e('peeler', 'kitchen', 'utensils', () =>
    m('peeler')
      .capsule([0.03, 0.11, 0.022], [0, 0.055, 0], { color: 'red' })
      .rod([0, 0.105, 0], [0.035, 0.16, 0], 0.008, 'silver')
      .rod([0, 0.105, 0], [-0.035, 0.16, 0], 0.008, 'silver')
      .box([0.075, 0.016, 0.005], [0, 0.165, 0], { color: 'silver' })
      .box([0.05, 0.003, 0.006], [0, 0.165, 0.001], { color: 'darkgray', noInk: true })
      .done(),
  ),
  e('peg leg', 'clinic', 'mobility aids', () =>
    m('peg leg')
      .cyl([0.06, 0.04, 0.06], [0, 0.02, 0], { color: 'rubber' })
      .cyl([0.06, 0.58, 0.06], [0, 0.33, 0], { color: 'wood', taper: 1.6 })
      .torus([0.1, 0.1, 0.03], [0, 0.6, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.17, 0.22, 0.17], [0, 0.73, 0], { color: 'leather', taper: 1.15 })
      .cyl([0.2, 0.03, 0.2], [0, 0.78, 0], { color: 'darkbrown' })
      .rod([0.09, 0.84, 0], [0.09, 0.62, 0.02], 0.02, 'darkbrown')
      .rod([-0.09, 0.84, 0], [-0.09, 0.62, 0.02], 0.02, 'darkbrown')
      .done(),
  ),
  e('pellet', 'armory', 'ammunition', () => {
    const b = m('pellet')
      .cyl([0.07, 0.03, 0.07], [0, 0.015, 0], { color: 'darkgray' })
      .cyl([0.072, 0.012, 0.072], [0, 0.02, 0], { color: 'green', noInk: true });
    b.each(5, (i) => {
      const x = -0.012 + (i % 3) * 0.014, z = -0.01 + Math.floor(i / 3) * 0.016;
      b.ball(0.012, [x, 0.036, z], { color: 'silver' }).cone([0.012, 0.01, 0.012], [x, 0.028, z], { color: 'silver', rot: [180, 0, 0] });
    });
    return b.ball(0.012, [0.05, 0.006, 0.04], { color: 'copper' }).ball(0.012, [0.065, 0.006, 0.03], { color: 'copper' }).done();
  }),
  e('pelt', 'wardrobe', 'furs', () => {
    const b = m('pelt');
    b.pair((s) => b.stick([s * 0.55, 0, 0], [s * 0.55, 1.5, 0], 0.06, 'wood').box([0.12, 0.1, 0.45], [s * 0.55, 0.05, 0], { color: 'darkwood' }));
    b.stick([-0.6, 1.4, 0], [0.6, 1.4, 0], 0.06, 'wood').stick([-0.6, 0.2, 0], [0.6, 0.2, 0], 0.06, 'wood');
    return b
      .ball([0.55, 0.85, 0.05], [0, 0.78, 0.02], { color: '#8a5a35' })
      .ball([0.3, 0.55, 0.055], [0, 0.78, 0.03], { color: '#b8875a', noInk: true })
      .ball([0.22, 0.2, 0.05], [0, 1.25, 0.02], { color: '#8a5a35' })
      .rod([0.15, 1.0, 0.02], [0.45, 1.25, 0.02], 0.12, '#8a5a35')
      .rod([-0.15, 1.0, 0.02], [-0.45, 1.25, 0.02], 0.12, '#8a5a35')
      .rod([0.15, 0.5, 0.02], [0.45, 0.3, 0.02], 0.12, '#8a5a35')
      .rod([-0.15, 0.5, 0.02], [-0.45, 0.3, 0.02], 0.12, '#8a5a35')
      .rod([0, 0.38, 0.02], [0.05, 0.24, 0.02], 0.07, '#7a4a2a')
      .done();
  }),
  e('pelvis', 'clinic', 'bones', () => {
    const b = m('pelvis').ball([0.07, 0.11, 0.05], [0, 0.12, -0.012], { color: '#e4d8bc' });
    b.pair((s) =>
      b
        .ball([0.12, 0.13, 0.04], [s * 0.07, 0.15, 0], { color: '#efe6cf', rot: [0, 0, s * -25] })
        .ball(0.05, [s * 0.1, 0.09, 0.0], { color: '#efe6cf' })
        .torus([0.07, 0.075, 0.03], [s * 0.04, 0.06, 0.01], { color: '#efe6cf', tube: 0.35 }),
    );
    return b.done();
  }),
  e('pen', 'study', 'stationery', () =>
    m('pen')
      .cone([0.014, 0.016, 0.014], [0, 0.008, 0], { color: 'silver', rot: [180, 0, 0] })
      .cyl([0.015, 0.11, 0.015], [0, 0.07, 0], { color: 'blue' })
      .cyl([0.017, 0.05, 0.017], [0, 0.145, 0], { color: 'navy' })
      .ball([0.017, 0.012, 0.017], [0, 0.17, 0], { color: 'navy' })
      .box([0.004, 0.045, 0.004], [0, 0.145, 0.011], { color: 'silver' })
      .done(),
  ),
  e('pencil', 'study', 'stationery', () =>
    m('pencil')
      .cyl([0.015, 0.016, 0.015], [0, 0.008, 0], { color: 'pink' })
      .cyl([0.016, 0.016, 0.016], [0, 0.024, 0], { color: 'silver' })
      .cyl([0.017, 0.14, 0.017], [0, 0.102, 0], { color: 'yellow', segs: 6 })
      .cone([0.016, 0.024, 0.016], [0, 0.184, 0], { color: 'tan' })
      .cone([0.006, 0.009, 0.006], [0, 0.1925, 0], { color: 'darkgray' })
      .done(),
  ),
  e('pencil sharpener', 'study', 'stationery', () =>
    m('pencil sharpener')
      .box([0.05, 0.04, 0.03], [0, 0.02, 0], { color: 'blue', round: 0.2 })
      .cyl([0.018, 0.006, 0.018], [0.026, 0.022, 0], { color: 'black', rot: [0, 0, 90] })
      .box([0.03, 0.004, 0.032], [-0.005, 0.042, 0], { color: 'silver' })
      .cyl([0.012, 0.08, 0.012], [0.07, 0.024, 0], { color: 'yellow', segs: 6, rot: [0, 0, 90] })
      .cone([0.012, 0.012, 0.012], [0.025, 0.024, 0], { color: 'tan', rot: [0, 0, 90] })
      .cyl([0.012, 0.01, 0.012], [0.115, 0.024, 0], { color: 'pink', rot: [0, 0, 90] })
      .torus([0.02, 0.02, 0.004], [-0.04, 0.008, 0.02], { color: 'tan', rot: [70, 0, 0], tube: 0.3 })
      .done(),
  ),
  e('pendulum', 'study', 'science', () => {
    const b = m('pendulum').box([0.34, 0.03, 0.16], [0, 0.015, 0], { color: 'wood' });
    b.pair((s) => b.stick([s * 0.15, 0.03, 0], [s * 0.15, 0.52, 0], 0.02, 'darkwood'));
    return b
      .stick([-0.16, 0.51, 0], [0.16, 0.51, 0], 0.025, 'darkwood')
      .stick([0, 0.5, 0], [0.12, 0.15, 0], 0.006, 'gray')
      .ball(0.08, [0.133, 0.115, 0], { color: 'brass' })
      .done();
  }),
  e('penguin costume', 'wardrobe', 'costumes', () =>
    who('penguin costume', {
      top: 'black',
      bottom: 'black',
      shoes: 'orange',
      style: 'bald',
      long: true,
      acc: [
        wear('apron', 'white'),
        hat('hood', 'black'),
        (p, d) => {
          p.add({ name: 'pbeak', parent: 'head', at: [0, d.headY + d.headH * 0.05, d.headD * 0.62], shape: 'cyl', size: [d.headW * 0.4, d.headH * 0.45, d.headW * 0.25], color: col('yellow'), taper: 0, srot: [90, 0, 0], layer: 5 });
        },
      ],
    }),
  ),
  e('penny', 'home', 'money', () => {
    const b = m('penny');
    b.each(3, (i) => b.cyl([0.04, 0.006, 0.04], [0.028 + i * 0.002, 0.003 + i * 0.006, -0.02], { color: 'copper' }));
    return b
      .cyl([0.045, 0.007, 0.045], [-0.01, 0.0225, 0.01], { color: 'copper', rot: [80, 0, 0] })
      .ball([0.016, 0.022, 0.004], [-0.012, 0.024, 0.0145], { color: '#e8a070', noInk: true })
      .done();
  }),
  e('pentagon', 'ideas', 'shapes', () => fan(plinth(m('pentagon')), 5, 0.085, 0, 0.11, 0, 0.03, 'green').done()),
  e('pepper (condiment)', 'food', 'spices', () =>
    m('pepper (condiment)')
      .cyl([0.065, 0.035, 0.065], [0, 0.0175, 0], { color: 'darkwood' })
      .cyl([0.045, 0.1, 0.045], [0, 0.085, 0], { color: 'wood', taper: 0.8 })
      .ball([0.06, 0.045, 0.06], [0, 0.15, 0], { color: 'darkwood' })
      .ball(0.02, [0, 0.178, 0], { color: 'darkwood' })
      .ball(0.012, [0.05, 0.006, 0.03], { color: '#2a2020' })
      .ball(0.012, [0.065, 0.006, 0.012], { color: '#2a2020' })
      .ball(0.012, [0.045, 0.006, 0.05], { color: '#2a2020' })
      .done(),
  ),
  e('pepper (vegetable)', 'food', 'vegetables', () => {
    const b = m('pepper (vegetable)');
    for (const [x, z] of [[0.022, 0.022], [-0.022, 0.022], [0.022, -0.022], [-0.022, -0.022]]) b.ball([0.06, 0.1, 0.06], [x, 0.05, z], { color: 'red' });
    return b.ball([0.07, 0.02, 0.07], [0, 0.1, 0], { color: 'darkgreen' }).cyl([0.016, 0.035, 0.016], [0.004, 0.118, 0], { color: 'green', rot: [0, 0, -15] }).done();
  }),
  e('pepper spray', 'armory', 'self defence', () =>
    m('pepper spray')
      .cyl([0.03, 0.09, 0.03], [0, 0.045, 0], { color: 'black' })
      .cyl([0.031, 0.04, 0.031], [0, 0.045, 0], { color: 'orange', noInk: true })
      .box([0.026, 0.025, 0.03], [0, 0.102, 0], { color: 'red', round: 0.3 })
      .box([0.008, 0.008, 0.01], [0, 0.104, 0.017], { color: 'black' })
      .torus([0.03, 0.03, 0.005], [0, 0.125, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.18 })
      .done(),
  ),
  e('pepperoni', 'food', 'meat', () =>
    m('pepperoni')
      .capsule([0.04, 0.2, 0.04], [-0.02, 0.02, -0.02], { color: '#a8322a', rot: [0, 10, 88] })
      .cyl([0.04, 0.006, 0.04], [0.07, 0.022, -0.014], { color: '#c8423a', rot: [0, 0, 88] })
      .cyl([0.04, 0.006, 0.04], [0.05, 0.022, 0.04], { color: '#c8423a', rot: [60, 0, 0] })
      .cyl([0.04, 0.006, 0.04], [0.0, 0.003, 0.05], { color: '#c8423a' })
      .ball([0.008, 0.002, 0.008], [0.005, 0.007, 0.055], { color: 'cream', noInk: true })
      .ball([0.006, 0.002, 0.006], [-0.008, 0.007, 0.045], { color: 'cream', noInk: true })
      .done(),
  ),
  e('percent sign', 'ideas', 'symbols', () =>
    plinth(m('percent sign'))
      .torus([0.055, 0.055, 0.022], [-0.045, 0.17, 0], { color: 'purple', tube: 0.35 })
      .torus([0.055, 0.055, 0.022], [0.045, 0.07, 0], { color: 'purple', tube: 0.35 })
      .rod([-0.055, 0.04, 0], [0.055, 0.2, 0], 0.02, 'purple')
      .done(),
  ),
  e('perfume', 'wardrobe', 'beauty', () =>
    m('perfume')
      .box([0.07, 0.07, 0.045], [0, 0.035, 0], { color: '#f4b8d0', round: 0.4 })
      .cyl([0.024, 0.016, 0.024], [0, 0.078, 0], { color: 'gold' })
      .cyl([0.016, 0.012, 0.016], [0, 0.092, 0], { color: 'gold' })
      .rod([0.008, 0.094, 0], [0.05, 0.1, 0], 0.005, 'magenta')
      .ball([0.035, 0.04, 0.035], [0.065, 0.09, 0], { color: 'magenta' })
      .ball([0.02, 0.02, 0.02], [-0.016, 0.05, 0.02], { color: 'white', noInk: true })
      .done(),
  ),
  e('periscope', 'tech', 'optics', () =>
    m('periscope')
      .box([0.14, 0.16, 0.18], [0, 0.08, 0], { color: 'gray', round: 0.2 })
      .box([0.1, 0.07, 0.02], [0, 0.09, 0.09], { color: 'black' })
      .stick([0, 0.16, 0], [0, 0.92, 0], 0.09, 'gray')
      .box([0.13, 0.14, 0.18], [0, 0.98, 0.03], { color: 'gray', round: 0.2 })
      .box([0.1, 0.08, 0.02], [0, 0.98, 0.12], { color: 'glass' })
      .rod([0.07, 0.1, 0], [0.18, 0.1, 0], 0.035, 'black')
      .rod([-0.07, 0.1, 0], [-0.18, 0.1, 0], 0.035, 'black')
      .done(),
  ),
  e('permit (paper)', 'study', 'papers', () =>
    m('permit (paper)')
      .box([0.1, 0.015, 0.05], [0, 0.0075, 0], { color: 'darkwood' })
      .box([0.09, 0.12, 0.008], [0, 0.075, 0], { color: 'cream', rot: [-8, 0, 0] })
      .label('PERMIT', [0.07, 0.025], [0, 0.11, 0.004], { color: 'cream', rot: [-8, 0, 0] })
      .cyl([0.03, 0.006, 0.03], [0.022, 0.045, 0.01], { color: 'red', rot: [82, 0, 0] })
      .box([0.05, 0.004, 0.002], [-0.01, 0.075, 0.008], { color: 'gray', noInk: true, rot: [-8, 0, 0] })
      .box([0.05, 0.004, 0.002], [-0.01, 0.065, 0.009], { color: 'gray', noInk: true, rot: [-8, 0, 0] })
      .done(),
  ),
  e('peroxide', 'clinic', 'first aid', () => bottle(m('peroxide'), 0, 0, 0.2, 0.07, '#5a3a22', 'white', { text: 'H2O2', band: 'white', neck: 0.45 }).done()),
  e('personal planner', 'study', 'organisers', () =>
    m('personal planner')
      .box([0.15, 0.2, 0.04], [0, 0.1, 0], { color: 'leather', round: 0.15 })
      .box([0.008, 0.2, 0.034], [0.074, 0.1, 0], { color: 'paper', noInk: true })
      .box([0.02, 0.025, 0.02], [0.08, 0.16, 0], { color: 'red' })
      .box([0.02, 0.025, 0.02], [0.08, 0.12, 0], { color: 'yellow' })
      .box([0.02, 0.025, 0.02], [0.08, 0.08, 0], { color: 'blue' })
      .box([0.008, 0.202, 0.044], [0.045, 0.1, 0], { color: 'black', noInk: true })
      .label('PLANNER', [0.08, 0.03], [-0.015, 0.14, 0.017], { color: 'gold' })
      .cyl([0.012, 0.14, 0.012], [-0.08, 0.1, 0.01], { color: 'navy' })
      .done(),
  ),
  e('pesto', 'food', 'sauces', () =>
    m('pesto')
      .cyl([0.16, 0.09, 0.16], [0, 0.045, 0], { color: '#e8e4dc', taper: 1.2 })
      .torus([0.19, 0.19, 0.02], [0, 0.09, 0], { color: '#dcd8d0', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.17, 0.012, 0.17], [0, 0.088, 0], { color: '#4a8a2a' })
      .capsule([0.04, 0.2, 0.04], [0.04, 0.16, -0.01], { color: '#d8d4cc', rot: [0, 0, -30] })
      .ball([0.06, 0.012, 0.035], [0.12, 0.006, 0.07], { color: 'leaf', rot: [0, 30, 0] })
      .ball([0.05, 0.012, 0.03], [0.09, 0.006, 0.1], { color: 'darkgreen', rot: [0, -20, 0] })
      .ball([0.012, 0.008, 0.008], [-0.1, 0.004, 0.08], { color: 'cream' })
      .ball([0.012, 0.008, 0.008], [-0.085, 0.004, 0.095], { color: 'cream' })
      .done(),
  ),
  e('pet carrier', 'pets', 'pet supplies', () => {
    const b = m('pet carrier')
      .box([0.5, 0.18, 0.36], [0, 0.09, 0], { color: 'lightgray', round: 0.3 })
      .box([0.5, 0.16, 0.36], [0, 0.25, 0], { color: 'skyblue', round: 0.4 })
      .torus([0.16, 0.1, 0.04], [0, 0.34, 0], { color: 'skyblue', rot: [0, 90, 0], tube: 0.3 })
      .box([0.03, 0.24, 0.3], [0.25, 0.17, 0], { color: 'lightgray', round: 0.3 })
      .box([0.3, 0.24, 0.02], [0, 0.17, 0.18], { color: 'silver', name: 'door', pivot: [-0.15, 0.17, 0.18] });
    b.each(6, (i) => b.stick([-0.12 + i * 0.048, 0.07, 0.19], [-0.12 + i * 0.048, 0.28, 0.19], 0.012, 'steel', { parent: 'door' }));
    b.each(3, (i) => b.box([0.012, 0.08, 0.2], [-0.252, 0.2, -0.08 + i * 0.07], { color: 'darkgray', noInk: true }));
    return b.done();
  }),
  e('pet food', 'pets', 'pet supplies', () => {
    const b = m('pet food')
      .box([0.17, 0.25, 0.08], [0.03, 0.125, -0.08], { color: 'yellow', round: 0.4 })
      .label('DOG FOOD', [0.13, 0.05], [0.03, 0.19, -0.04], { color: 'red' })
      .ball([0.05, 0.045, 0.01], [0.03, 0.1, -0.038], { color: 'brown', noInk: true })
      .cyl([0.16, 0.06, 0.16], [0, 0.03, 0.08], { color: 'red', taper: 1.3 })
      .ball([0.17, 0.04, 0.17], [0, 0.06, 0.08], { color: '#a0602a' });
    b.each(7, (i) => b.ball(0.022, [Math.cos(i * 0.9) * 0.05, 0.08, 0.08 + Math.sin(i * 0.9) * 0.05], { color: i % 2 ? '#c87a3a' : '#8a4a20' }));
    return b.done();
  }),
  e('pet house', 'pets', 'pet homes', () =>
    m('pet house')
      .box([0.6, 0.45, 0.7], [0, 0.225, 0], { color: 'red', round: 0.05 })
      .wedge([0.76, 0.26, 0.82], [0, 0.58, 0], { color: 'white' })
      .box([0.22, 0.2, 0.02], [0, 0.1, 0.35], { color: 'black' })
      .cyl([0.22, 0.02, 0.22], [0, 0.2, 0.35], { color: 'black', rot: [90, 0, 0] })
      .label('REX', [0.18, 0.07], [0, 0.38, 0.36], { color: 'wood' })
      .done(),
  ),
  e('pet store', 'places', 'shops', () =>
    bldg('pet store', { w: 7, h: 4, d: 5, wall: '#cfe8f0', roof: 'teal', sign: 'PET SHOP', signColor: 'yellow' })
      .box([1.6, 1.0, 0.5], [-2.4, 1.4, 2.6], { color: 'glass' })
      .ball([0.35, 0.22, 0.1], [-2.6, 1.5, 2.86], { color: 'orange' })
      .ball([0.3, 0.2, 0.1], [-2.1, 1.25, 2.86], { color: 'yellow' })
      .box([1.6, 1.6, 0.2], [0, 5.0, 0], { color: 'white' })
      .ball([0.7, 0.6, 0.1], [0, 4.75, 0.12], { color: 'brown' })
      .ball(0.28, [-0.4, 5.3, 0.12], { color: 'brown' })
      .ball(0.28, [-0.13, 5.5, 0.12], { color: 'brown' })
      .ball(0.28, [0.13, 5.5, 0.12], { color: 'brown' })
      .ball(0.28, [0.4, 5.3, 0.12], { color: 'brown' })
      .done(),
  ),
  e('pew', 'home', 'seating', () => {
    const b = m('pew')
      .box([2.0, 0.16, 0.45], [0, 0.42, 0], { color: 'darkwood' })
      .box([2.0, 0.55, 0.06], [0, 0.78, -0.22], { color: 'darkwood', rot: [-8, 0, 0] })
      .box([2.0, 0.06, 0.12], [0, 1.06, -0.27], { color: 'wood' });
    b.pair((s) => b.box([0.08, 1.0, 0.55], [s * 1.02, 0.5, -0.03], { color: 'wood' }).ball([0.1, 0.16, 0.16], [s * 1.02, 1.0, -0.22], { color: 'wood' }));
    return b.done();
  }),
  e('pharmacy', 'places', 'shops', () =>
    bldg('pharmacy', { w: 7, h: 4, d: 5, wall: 'white', roof: 'green', sign: 'PHARMACY', signColor: 'green' })
      .rod([2.6, 3.3, 2.5], [2.6, 3.3, 3.1], 0.1, 'gray')
      .box([0.9, 0.3, 0.14], [2.6, 3.3, 3.25], { color: 'lime', glow: true })
      .box([0.3, 0.9, 0.14], [2.6, 3.3, 3.25], { color: 'lime', glow: true })
      .done(),
  ),
  e('phone', 'tech', 'phones', () => {
    const b = m('phone')
      .box([0.22, 0.07, 0.2], [0, 0.035, 0], { color: 'red', round: 0.4 })
      .cyl([0.21, 0.06, 0.2], [0, 0.09, -0.01], { color: 'red', taper: 0.75, segs: 4, rot: [0, 45, 0] })
      .cyl([0.1, 0.012, 0.1], [0, 0.08, 0.085], { color: 'white', rot: [60, 0, 0] })
      .ball(0.025, [0, 0.08, 0.092], { color: 'red' });
    b.pair((s) => b.box([0.03, 0.03, 0.04], [s * 0.07, 0.13, -0.01], { color: 'red' }).ball([0.06, 0.05, 0.07], [s * 0.1, 0.16, -0.01], { color: 'red' }));
    return b.capsule([0.045, 0.2, 0.045], [0, 0.165, -0.01], { color: 'red', rot: [0, 0, 90] }).rod([-0.12, 0.15, -0.02], [-0.14, 0.03, -0.05], 0.012, 'black').done();
  }),
  e('phone book', 'study', 'books', () =>
    m('phone book')
      .box([0.21, 0.27, 0.06], [0.004, 0.14, 0], { color: 'paper' })
      .box([0.22, 0.28, 0.008], [0, 0.14, 0.032], { color: 'yellow' })
      .box([0.22, 0.28, 0.008], [0, 0.14, -0.032], { color: 'yellow' })
      .box([0.012, 0.28, 0.07], [-0.105, 0.14, 0], { color: 'yellow' })
      .label('PHONE BOOK', [0.17, 0.05], [0, 0.21, 0.031], { color: 'yellow' })
      .torus([0.07, 0.05, 0.006], [0, 0.12, 0.037], { color: 'black', tube: 0.3 })
      .done(),
  ),
  e('phone booth', 'places', 'street things', () => {
    const b = m('phone booth')
      .box([1.15, 0.1, 1.15], [0, 0.05, 0], { color: 'darkred' })
      .box([1.0, 2.3, 1.0], [0, 1.2, 0], { color: 'red', round: 0.08 })
      .cyl([1.1, 0.12, 1.1], [0, 2.4, 0], { color: 'red', segs: 4, rot: [0, 45, 0] })
      .ball([1.0, 0.3, 1.0], [0, 2.46, 0], { color: 'red' })
      .label('TELEPHONE', [0.8, 0.14], [0, 2.18, 0.5], { color: 'white' })
      .box([0.84, 1.9, 0.04], [0, 1.1, 0.51], { color: 'red', name: 'door', pivot: [-0.42, 1.1, 0.51] });
    b.each(12, (i) => b.box([0.22, 0.22, 0.02], [-0.25 + (i % 3) * 0.25, 1.85 - Math.floor(i / 3) * 0.27, 0.535], { color: 'glass', parent: 'door' }));
    return b.done();
  }),
  e('phonograph', 'music', 'audio', () =>
    m('phonograph')
      .box([0.3, 0.12, 0.3], [0, 0.06, 0], { color: 'wood' })
      .cyl([0.26, 0.015, 0.26], [0, 0.128, 0], { color: 'black' })
      .cyl([0.07, 0.016, 0.07], [0, 0.13, 0], { color: 'red' })
      .stick([0.12, 0.12, -0.12], [0.12, 0.2, -0.12], 0.03, 'brass')
      .rod([0.12, 0.2, -0.12], [0.04, 0.15, 0.02], 0.015, 'brass')
      .cyl([0.04, 0.34, 0.04], [0.06, 0.32, -0.02], { color: 'brass', taper: 7, rot: [45, 0, -10] })
      .cyl([0.2, 0.012, 0.2], [0.09, 0.43, 0.1], { color: '#5a3a22', rot: [45, 0, -10] })
      .rod([0.15, 0.06, 0], [0.22, 0.06, 0], 0.015, 'brass', { name: 'crank', pivot: [0.15, 0.06, 0] })
      .ball(0.03, [0.23, 0.06, 0.02], { color: 'darkwood', parent: 'crank' })
      .done(),
  ),
  e('photo album', 'home', 'keepsakes', () =>
    m('photo album')
      .box([0.3, 0.24, 0.06], [0, 0.12, 0], { color: 'darkred', round: 0.12 })
      .box([0.29, 0.22, 0.05], [0.006, 0.12, 0], { color: 'paper', noInk: true })
      .box([0.13, 0.1, 0.008], [0, 0.13, 0.031], { color: 'white' })
      .box([0.11, 0.06, 0.006], [0, 0.145, 0.035], { color: 'skyblue', noInk: true })
      .ball([0.1, 0.04, 0.006], [0, 0.11, 0.035], { color: 'grass', noInk: true })
      .ball(0.018, [0.03, 0.155, 0.037], { color: 'yellow', noInk: true })
      .label('PHOTOS', [0.12, 0.03], [0, 0.05, 0.031], { color: 'gold' })
      .box([0.08, 0.06, 0.004], [0.06, 0.25, 0.0], { color: 'white', rot: [0, 0, -12] })
      .done(),
  ),
  e('photo booth', 'places', 'street things', () => {
    const b = m('photo booth')
      .box([1.6, 2.0, 1.0], [0, 1.0, 0], { color: '#2a5aa0', round: 0.06 })
      .label('PHOTO BOOTH', [1.3, 0.22], [0, 1.85, 0.51], { color: 'yellow' })
      .box([0.8, 1.4, 0.04], [-0.35, 0.9, 0.51], { color: 'black' })
      .box([0.4, 0.4, 0.04], [0.45, 1.25, 0.51], { color: 'cream' })
      .box([0.1, 0.36, 0.01], [0.45, 0.75, 0.53], { color: 'white' });
    b.each(4, (i) => b.capsule([0.18, 1.35, 0.08], [-0.66 + i * 0.2, 0.88, 0.56], { color: 'darkred' }));
    return b.done();
  }),
  e('photograph', 'home', 'keepsakes', () =>
    m('photograph')
      .box([0.1, 0.12, 0.01], [0, 0.06, 0], { color: 'white', rot: [-10, 0, 0] })
      .box([0.085, 0.07, 0.004], [0, 0.072, 0.007], { color: 'skyblue', noInk: true, rot: [-10, 0, 0] })
      .ball([0.085, 0.03, 0.004], [0, 0.045, 0.012], { color: 'grass', noInk: true })
      .ball(0.018, [0.02, 0.09, 0.006], { color: 'yellow', noInk: true })
      .rod([0, 0.06, -0.012], [0, 0.0, -0.05], 0.008, 'darkwood')
      .done(),
  ),
  e('piano', 'music', 'keyboards', () => {
    const b = m('piano')
      .box([1.5, 0.32, 0.9], [0, 0.88, 0.15], { color: 'black', round: 0.15 })
      .ball([1.5, 0.32, 1.4], [0.05, 0.88, -0.4], { color: 'black' })
      .box([1.45, 0.03, 1.8], [-0.04, 1.34, -0.25], { color: 'black', rot: [0, 0, 25], name: 'lid', pivot: [-0.72, 1.03, -0.25] })
      .stick([0.5, 1.03, -0.2], [0.5, 1.6, -0.2], 0.025, 'black')
      .box([1.2, 0.05, 0.2], [0, 0.78, 0.68], { color: 'white' })
      .box([1.32, 0.12, 0.22], [0, 0.72, 0.66], { color: 'black' });
    b.each(9, (i) => b.box([0.05, 0.03, 0.1], [-0.52 + i * 0.13, 0.81, 0.64], { color: 'black' }));
    for (const [x, z] of [[0.65, 0.5], [-0.65, 0.5], [0, -0.9]]) b.cyl([0.09, 0.72, 0.09], [x, 0.36, z], { color: 'black', taper: 0.8 });
    return b.box([0.8, 0.07, 0.35], [0, 0.5, 1.15], { color: 'black' }).cyl([0.07, 0.46, 0.07], [0.32, 0.23, 1.15], { color: 'black' }).cyl([0.07, 0.46, 0.07], [-0.32, 0.23, 1.15], { color: 'black' }).done();
  }),
  e('pick (guitar)', 'music', 'accessories', () =>
    m('pick (guitar)')
      .ball([0.05, 0.035, 0.008], [0, 0.04, 0], { color: 'red' })
      .cone([0.046, 0.04, 0.008], [0, 0.02, 0], { color: 'red', rot: [180, 0, 0] })
      .star(0.016, [0, 0.038, 0.005], { color: 'white', round: 0.003 })
      .done(),
  ),
  e('pick (tool)', 'workshop', 'digging tools', () =>
    m('pick (tool)')
      .stick([0, 0, 0], [0, 0.86, 0], 0.045, 'wood')
      .box([0.1, 0.1, 0.08], [0, 0.85, 0], { color: 'iron' })
      .rod([0.03, 0.86, 0], [0.26, 0.8, 0], 0.045, 'iron')
      .rod([-0.03, 0.86, 0], [-0.26, 0.8, 0], 0.045, 'iron')
      .cone([0.045, 0.1, 0.045], [0.32, 0.76, 0], { color: 'iron', rot: [0, 0, -110] })
      .cone([0.045, 0.1, 0.045], [-0.32, 0.76, 0], { color: 'iron', rot: [0, 0, 110] })
      .done(),
  ),
  e('pickle', 'food', 'pickles and olives', () => {
    const b = m('pickle').capsule([0.038, 0.11, 0.036], [0, 0.019, 0], { color: '#6a8a2a', rot: [0, 15, 85] });
    b.each(5, (i) => b.ball(0.01, [-0.04 + i * 0.02, 0.03 + (i % 2) * 0.006, 0.012], { color: '#8aaa3a', noInk: true }));
    return b.cyl([0.036, 0.008, 0.036], [0.07, 0.018, 0.04], { color: '#b8c860', rot: [70, 0, 0] }).ball([0.02, 0.012, 0.004], [0.07, 0.019, 0.045], { color: '#e0e8a0', noInk: true }).done();
  }),
  e('picnic table', 'home', 'outdoor furniture', () => {
    const b = m('picnic table')
      .box([1.5, 0.06, 0.75], [0, 0.75, 0], { color: 'wood' })
      .box([1.0, 0.01, 0.65], [0, 0.78, 0], { color: 'red', noInk: true });
    b.each(4, (i) => b.box([0.12, 0.012, 0.12], [-0.36 + i * 0.24, 0.786, 0.2 * (i % 2 ? 1 : -1) * 0.5], { color: 'white', noInk: true }));
    b.pair((s) => {
      b.box([1.5, 0.06, 0.26], [0, 0.45, s * 0.6], { color: 'wood' });
      b.rod([0.55, 0, s * 0.66], [0.55, 0.72, s * 0.15], 0.11, 'darkwood').rod([-0.55, 0, s * 0.66], [-0.55, 0.72, s * 0.15], 0.11, 'darkwood');
    });
    return b.stick([0.55, 0.4, -0.7], [0.55, 0.4, 0.7], 0.06, 'darkwood').stick([-0.55, 0.4, -0.7], [-0.55, 0.4, 0.7], 0.06, 'darkwood').done();
  }),
  e('pie', 'food', 'desserts', () => {
    const b = m('pie')
      .cyl([0.22, 0.04, 0.22], [0, 0.02, 0], { color: 'silver', taper: 1.15 })
      .cyl([0.22, 0.012, 0.22], [0, 0.044, 0], { color: '#8a2a3a' })
      .torus([0.25, 0.25, 0.03], [0, 0.048, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.12 });
    b.each(3, (i) => b.box([0.026, 0.012, 0.21], [-0.06 + i * 0.06, 0.054, 0], { color: 'bread' }).box([0.21, 0.012, 0.026], [0, 0.058, -0.06 + i * 0.06], { color: 'bread' }));
    return b.done();
  }),
  e('piggy bank', 'home', 'money', () => {
    const b = m('piggy bank', { view: 'side' })
      .ball([0.14, 0.14, 0.2], [0, 0.1, 0], { color: 'pink' })
      .cyl([0.06, 0.03, 0.05], [0, 0.1, 0.105], { color: '#f48cb0', rot: [90, 0, 0] })
      .ball(0.012, [0.012, 0.1, 0.122], { color: 'magenta' })
      .ball(0.012, [-0.012, 0.1, 0.122], { color: 'magenta' })
      .box([0.012, 0.004, 0.05], [0, 0.17, -0.01], { color: 'black' })
      .cyl([0.035, 0.005, 0.035], [0, 0.185, -0.01], { color: 'gold', rot: [0, 0, 90] })
      .torus([0.035, 0.035, 0.008], [0, 0.12, -0.105], { color: 'pink', rot: [0, 90, 0], tube: 0.25 });
    b.pair((s) => b.cone([0.04, 0.05, 0.02], [s * 0.04, 0.17, 0.06], { color: 'pink', rot: [-20, 0, s * -20] }).ball(0.018, [s * 0.032, 0.13, 0.085], { color: 'black', eye: true }));
    for (const [x, z] of [[0.04, 0.05], [-0.04, 0.05], [0.04, -0.05], [-0.04, -0.05]]) b.cyl([0.035, 0.04, 0.035], [x, 0.02, z], { color: 'pink' });
    return b.done();
  }),
  e('pigpen', 'farm', 'pens', () => {
    const b = m('pigpen').box([2.6, 0.08, 2.6], [0, 0.04, 0], { color: 'dirt' }).ball([1.4, 0.08, 1.0], [-0.3, 0.08, 0.3], { color: '#6a4a2a' });
    for (const [x, z] of [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2], [0, 1.2], [0, -1.2], [1.2, 0], [-1.2, 0]]) b.stick([x, 0, z], [x, 1.0, z], 0.1, 'darkwood');
    for (const y of [0.45, 0.85]) {
      b.box([2.4, 0.08, 0.05], [0, y, 1.2], { color: 'wood' }).box([2.4, 0.08, 0.05], [0, y, -1.2], { color: 'wood' });
      b.box([0.05, 0.08, 2.4], [1.2, y, 0], { color: 'wood' }).box([0.05, 0.08, 2.4], [-1.2, y, 0], { color: 'wood' });
    }
    b.ball([0.45, 0.42, 0.75], [0.2, 0.36, 0], { color: 'pink' }).ball([0.32, 0.3, 0.3], [0.2, 0.45, 0.42], { color: 'pink' }).cyl([0.16, 0.08, 0.13], [0.2, 0.42, 0.6], { color: '#f48cb0', rot: [90, 0, 0] });
    b.pair((s) => b.cone([0.1, 0.12, 0.05], [0.2 + s * 0.1, 0.62, 0.42], { color: 'pink', rot: [-20, 0, s * -25] }).cyl([0.1, 0.18, 0.1], [0.2 + s * 0.13, 0.09, 0.22], { color: 'pink' }).cyl([0.1, 0.18, 0.1], [0.2 + s * 0.13, 0.09, -0.22], { color: 'pink' }));
    return b.box([0.9, 0.2, 0.3], [-0.5, 0.18, -0.8], { color: 'darkwood' }).done();
  }),
  e('pigs in a blanket', 'food', 'snacks', () => {
    const b = plate(m('pigs in a blanket'), 0.22);
    b.each(3, (i) => {
      const z = -0.05 + i * 0.05, x = (i - 1) * 0.015;
      b.capsule([0.024, 0.09, 0.024], [x, 0.03, z], { color: '#b0503a', rot: [0, 0, 90] }).capsule([0.038, 0.05, 0.034], [x, 0.033, z], { color: 'bread', rot: [0, 0, 90] });
    });
    return b.cyl([0.05, 0.03, 0.05], [0.07, 0.03, 0.06], { color: 'white' }).cyl([0.044, 0.006, 0.044], [0.07, 0.045, 0.06], { color: 'yellow' }).done();
  }),
  e('pilgrim hat', 'wardrobe', 'hats', () =>
    m('pilgrim hat')
      .cyl([0.32, 0.015, 0.32], [0, 0.0075, 0], { color: 'black' })
      .cyl([0.17, 0.17, 0.17], [0, 0.1, 0], { color: 'black', taper: 0.85 })
      .cyl([0.172, 0.035, 0.172], [0, 0.033, 0], { color: 'darkgray' })
      .box([0.06, 0.05, 0.012], [0, 0.035, 0.086], { color: 'gold' })
      .box([0.034, 0.026, 0.014], [0, 0.035, 0.088], { color: 'darkgray' })
      .done(),
  ),
  e('pill', 'clinic', 'medicine', () =>
    m('pill')
      .cyl([0.045, 0.014, 0.045], [-0.02, 0.007, 0], { color: 'white' })
      .box([0.035, 0.004, 0.004], [-0.02, 0.015, 0], { color: 'lightgray', noInk: true })
      .capsule([0.024, 0.04, 0.024], [0.03, 0.022, 0.01], { color: 'red', rot: [0, 0, -30] })
      .capsule([0.024, 0.04, 0.024], [0.046, 0.046, 0.01], { color: 'white', rot: [0, 0, -30] })
      .done(),
  ),
  e('pill box', 'clinic', 'medicine', () => {
    const b = m('pill box').box([0.21, 0.028, 0.045], [0, 0.014, 0], { color: 'white' });
    const cs = ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'purple'];
    b.each(7, (i) => {
      const x = -0.09 + i * 0.03;
      if (i === 3) b.box([0.026, 0.006, 0.04], [x, 0.048, -0.024], { color: cs[i], rot: [-80, 0, 0], name: 'lid', pivot: [x, 0.03, -0.022] }).ball(0.012, [x, 0.03, 0], { color: 'pink' });
      else b.box([0.026, 0.006, 0.042], [x, 0.031, 0], { color: cs[i] });
      b.label('SMTWTFS'[i], [0.018, 0.014], [x, 0.014, 0.013], { color: 'white' });
    });
    return b.done();
  }),
  e('pillar', 'places', 'monuments', () => {
    const b = m('pillar')
      .box([0.95, 0.2, 0.95], [0, 0.1, 0], { color: '#eeeae0' })
      .torus([0.8, 0.8, 0.16], [0, 0.26, 0], { color: '#e4dfd2', rot: [90, 0, 0], tube: 0.3 })
      .cyl([0.62, 2.35, 0.62], [0, 1.47, 0], { color: '#f2eee4', taper: 0.92 })
      .cyl([0.75, 0.15, 0.75], [0, 2.72, 0], { color: '#e4dfd2', taper: 1.25 })
      .box([0.95, 0.15, 0.95], [0, 2.87, 0], { color: '#eeeae0' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.box([0.05, 2.2, 0.02], [Math.sin(a) * 0.3, 1.45, Math.cos(a) * 0.3], { color: '#d8d2c2', rot: [0, (a * 180) / Math.PI, 0], noInk: true });
    });
    b.pair((s) => b.torus([0.22, 0.22, 0.1], [s * 0.42, 2.75, 0.3], { color: '#eeeae0', tube: 0.45 }));
    return b.done();
  }),
  e('pipe cleaner', 'study', 'art supplies', () => {
    const b = m('pipe cleaner');
    const pts: Vec3[] = [];
    for (let i = 0; i <= 16; i++) pts.push([Math.cos(i * 0.8) * 0.035, 0.01 + i * 0.011, Math.sin(i * 0.8) * 0.035]);
    for (let i = 0; i < 16; i++) b.rod(pts[i], pts[i + 1], 0.015, 'magenta');
    return b.rod([0.07, 0.005, 0.02], [0.1, 0.06, 0.02], 0.015, 'lime').rod([0.1, 0.06, 0.02], [0.08, 0.12, 0.02], 0.015, 'lime').rod([0.08, 0.12, 0.02], [0.11, 0.17, 0.02], 0.015, 'lime').done();
  }),
  e('pirate hat', 'wardrobe', 'hats', () => {
    const b = m('pirate hat').ball([0.17, 0.13, 0.17], [0, 0.065, 0], { color: 'black' });
    for (const a of [-90, 30, 150]) {
      const r = (a * Math.PI) / 180;
      b.box([0.03, 0.1, 0.34], [Math.cos(r) * 0.1, 0.06, -Math.sin(r) * 0.1], { color: 'black', rot: [0, a, -25], round: 0.4 });
      b.box([0.012, 0.012, 0.34], [Math.cos(r) * 0.125, 0.108, -Math.sin(r) * 0.125], { color: 'gold', rot: [0, a, 0] });
    }
    return b
      .ball([0.05, 0.045, 0.02], [0, 0.07, 0.13], { color: 'white' })
      .rod([-0.035, 0.03, 0.135], [0.035, 0.055, 0.135], 0.012, 'white')
      .rod([0.035, 0.03, 0.135], [-0.035, 0.055, 0.135], 0.012, 'white')
      .ball(0.01, [-0.01, 0.073, 0.14], { color: 'black', noInk: true })
      .ball(0.01, [0.01, 0.073, 0.14], { color: 'black', noInk: true })
      .done();
  }),
  e('pirate ship', 'garage', 'ships', () => {
    const b = m('pirate ship', { view: 'side' })
      .box([3, 2.5, 8.5], [0, 1.4, -0.5], { color: 'darkwood', round: 0.3 })
      .wedge([3, 2.6, 2.5], [0, 1.4, 5.0], { color: 'darkwood', rot: [90, 0, 0] })
      .box([3.04, 0.25, 8.4], [0, 2.3, -0.5], { color: 'gold', noInk: true })
      .box([3, 1.4, 2.2], [0, 3.3, -3.6], { color: 'wood' })
      .box([2.6, 0.5, 0.06], [0, 3.3, -4.71], { color: 'glass' });
    for (const [z, h] of [[1.6, 9.5], [-1.2, 8.5]]) {
      b.stick([0, 2.6, z], [0, h, z], 0.25, 'wood');
      b.box([0.4, 2.2, 2.5], [0.2, h - 1.8, z], { color: 'cream', round: 0.6 }).box([0.4, 2.0, 2.2], [0.2, h - 4.2, z], { color: 'cream', round: 0.6 });
    }
    b.box([0.05, 0.7, 1.2], [0, 9.15, 1.0], { color: 'black' }).ball([0.1, 0.3, 0.3], [0.04, 9.2, 0.95], { color: 'white' });
    b.pair((s) => b.each(4, (i) => b.box([0.06, 0.35, 0.45], [s * 1.5, 1.6, 2.4 - i * 1.6], { color: 'black' })));
    return b.done();
  }),
  e('pistachio', 'food', 'nuts', () =>
    m('pistachio')
      .ball([0.024, 0.02, 0.032], [-0.012, 0.012, 0], { color: '#e8d8b0', rot: [0, 0, -20] })
      .ball([0.024, 0.02, 0.032], [0.012, 0.012, 0], { color: '#e0cfa0', rot: [0, 0, 20] })
      .ball([0.02, 0.026, 0.028], [0, 0.018, 0], { color: '#8ab84a' })
      .ball([0.008, 0.01, 0.02], [0.004, 0.026, 0.002], { color: '#b05a6a', noInk: true })
      .done(),
  ),
  e('pit (hole)', 'nature', 'landforms', () =>
    m('pit (hole)')
      .cyl([2.6, 0.25, 2.6], [0, 0.125, 0], { color: 'grass' })
      .cyl([1.5, 0.03, 1.4], [-0.2, 0.25, 0.2], { color: 'dirt' })
      .cyl([1.3, 0.04, 1.2], [-0.2, 0.26, 0.2], { color: '#2a1d16' })
      .ball([1.0, 0.55, 0.8], [0.8, 0.3, -0.7], { color: '#8a6440' })
      .stick([0.85, 0.4, -0.7], [1.05, 1.5, -0.7], 0.05, 'wood')
      .box([0.25, 0.3, 0.04], [0.82, 0.45, -0.7], { color: 'steel', rot: [0, 0, -10] })
      .done(),
  ),
  e('pitchfork', 'farm', 'farm tools', () => {
    const b = m('pitchfork').box([0.9, 0.45, 0.5], [0, 0.225, 0], { color: '#e8c860', round: 0.15 });
    b.each(3, (i) => b.box([0.92, 0.02, 0.52], [0, 0.1 + i * 0.13, 0], { color: '#c8a040', noInk: true }));
    b.rod([0.05, 0.62, 0], [0.32, 1.7, 0], 0.04, 'wood');
    return b.box([0.24, 0.035, 0.03], [0.03, 0.55, 0], { color: 'iron', rot: [0, 0, -14] }).each(4, (i) => b.rod([-0.06 + i * 0.04, 0.55 - i * 0.01, 0], [-0.08 + i * 0.04, 0.4 - i * 0.01, 0], 0.014, 'iron')).done();
  }),
  e('pixie dust', 'fantasy', 'magic items', () =>
    m('pixie dust')
      .ball([0.09, 0.09, 0.09], [0, 0.045, 0], { color: '#ffe680', glow: true })
      .ball(0.096, [0, 0.045, 0], { color: 'glass', scale: 1 })
      .cyl([0.03, 0.04, 0.03], [0, 0.1, 0], { color: 'glass' })
      .cyl([0.034, 0.025, 0.034], [0, 0.13, 0], { color: 'wood', taper: 1.2 })
      .star(0.04, [0.03, 0.19, 0.01], { color: 'gold', glow: true })
      .star(0.03, [-0.035, 0.24, 0], { color: 'yellow', glow: true })
      .star(0.025, [0.02, 0.29, -0.01], { color: 'gold', glow: true })
      .ball(0.012, [-0.01, 0.17, 0.02], { color: 'white', glow: true })
      .ball(0.01, [0.05, 0.25, 0], { color: 'white', glow: true })
      .done(),
  ),
  e('pizza', 'food', 'fast food', () => {
    const b = m('pizza')
      .cyl([0.3, 0.02, 0.3], [0, 0.01, 0], { color: 'crust' })
      .torus([0.31, 0.31, 0.03], [0, 0.022, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.27, 0.012, 0.27], [0, 0.024, 0], { color: '#f6c445' });
    const pep: Array<[number, number]> = [[0, 0], [0.07, 0.04], [-0.07, 0.05], [0.05, -0.07], [-0.06, -0.06], [0.0, 0.09], [0.1, -0.02], [-0.1, -0.01]];
    for (const [x, z] of pep) b.cyl([0.045, 0.008, 0.045], [x, 0.032, z], { color: '#c8423a' });
    b.each(4, (i) => b.box([0.27, 0.004, 0.004], [0, 0.034, 0], { color: '#d8a030', rot: [0, i * 45, 0], noInk: true }));
    return b.ball([0.03, 0.006, 0.02], [0.03, 0.036, 0.05], { color: 'leaf' }).ball([0.03, 0.006, 0.02], [-0.04, 0.036, -0.02], { color: 'leaf' }).done();
  }),
  e('pizza box', 'food', 'fast food', () =>
    m('pizza box')
      .box([0.32, 0.04, 0.32], [0, 0.02, 0], { color: '#d8b07a', round: 0.1 })
      .cyl([0.27, 0.015, 0.27], [0, 0.045, 0], { color: '#f6c445' })
      .torus([0.28, 0.28, 0.02], [0, 0.048, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.045, 0.008, 0.045], [0.05, 0.054, 0.04], { color: '#c8423a' })
      .cyl([0.045, 0.008, 0.045], [-0.06, 0.054, -0.02], { color: '#c8423a' })
      .cyl([0.045, 0.008, 0.045], [0.02, 0.054, -0.07], { color: '#c8423a' })
      .box([0.32, 0.012, 0.32], [0, 0.197, -0.187], { color: 'white', rot: [-100, 0, 0], name: 'lid', pivot: [0, 0.04, -0.16] })
      .label('PIZZA', [0.18, 0.07], [0, 0.22, -0.17], { color: 'red', rot: [-10, 0, 0], parent: 'lid' })
      .done(),
  ),
  e('pizza cutter', 'kitchen', 'utensils', () =>
    m('pizza cutter')
      .cyl([0.09, 0.006, 0.09], [0, 0.045, 0], { color: 'silver', rot: [90, 0, 0], name: 'wheel' })
      .cyl([0.02, 0.016, 0.02], [0, 0.045, 0], { color: 'darkgray', rot: [90, 0, 0] })
      .rod([0, 0.045, 0.01], [0.05, 0.1, 0.01], 0.01, 'silver')
      .capsule([0.03, 0.13, 0.03], [0.09, 0.15, 0.01], { color: 'red', rot: [0, 0, -40] })
      .done(),
  ),
  e('pizza oven', 'kitchen', 'appliances', () =>
    m('pizza oven')
      .box([1.4, 0.8, 1.3], [0, 0.4, 0], { color: 'stone' })
      .box([0.9, 0.35, 0.05], [0, 0.3, 0.64], { color: '#3a2a20' })
      .ball([1.3, 0.9, 1.2], [0, 0.8, -0.05], { color: '#c8693e' })
      .box([0.45, 0.25, 0.1], [0, 0.93, 0.5], { color: '#2a1d16' })
      .ball([0.45, 0.25, 0.1], [0, 1.05, 0.5], { color: '#2a1d16' })
      .ball([0.3, 0.2, 0.06], [0, 0.95, 0.56], { color: 'fire', glow: true })
      .torus([0.62, 0.48, 0.1], [0, 1.0, 0.52], { color: '#a8502e', tube: 0.25 })
      .stick([0.3, 1.1, 0.15], [0.3, 1.6, 0.15], 0.14, 'darkgray')
      .done(),
  ),
  e('piñata', 'toys', 'party', () => {
    const b = m('piñata', { view: 'side' });
    const cs = ['pink', 'yellow', 'cyan', 'lime', 'orange'];
    b.each(5, (i) => b.box([0.22, 0.2, 0.085], [0, 0.32, -0.17 + i * 0.085], { color: cs[i], round: 0.15 }));
    b.box([0.14, 0.22, 0.12], [0, 0.48, 0.2], { color: 'magenta', rot: [-20, 0, 0] }).box([0.16, 0.14, 0.2], [0, 0.6, 0.27], { color: 'yellow' }).box([0.12, 0.1, 0.06], [0, 0.57, 0.39], { color: 'pink' });
    b.pair((s) => b.cone([0.05, 0.14, 0.03], [s * 0.05, 0.73, 0.22], { color: 'cyan', rot: [-15, 0, s * -10] }).ball(0.025, [s * 0.06, 0.63, 0.35], { color: 'black', eye: true }));
    for (const [x, z, c] of [[0.07, 0.14, 'orange'], [-0.07, 0.14, 'cyan'], [0.07, -0.14, 'yellow'], [-0.07, -0.14, 'pink']] as Array<[number, number, string]>) b.box([0.06, 0.24, 0.06], [x, 0.12, z], { color: c, round: 0.2 });
    return b.capsule([0.05, 0.15, 0.04], [0, 0.32, -0.26], { color: 'magenta', rot: [-40, 0, 0] }).done();
  }),
  e('placemat', 'kitchen', 'tableware', () => {
    const b = m('placemat').box([0.45, 0.01, 0.32], [0, 0.005, 0], { color: 'tan', round: 0.2 });
    b.each(5, (i) => b.box([0.45, 0.002, 0.012], [0, 0.011, -0.12 + i * 0.06], { color: '#c09a6a', noInk: true }));
    plate(b, 0.2, 0.01);
    return b
      .stick([-0.15, 0.014, -0.08], [-0.15, 0.014, 0.1], 0.012, 'silver')
      .box([0.03, 0.006, 0.05], [-0.15, 0.014, -0.1], { color: 'silver' })
      .stick([0.15, 0.014, -0.1], [0.15, 0.014, 0.1], 0.012, 'silver')
      .cyl([0.06, 0.1, 0.06], [0.17, 0.06, -0.12], { color: 'glass', taper: 1.1 })
      .done();
  }),
  e('planet', 'sky', 'planets', () =>
    m('planet')
      .ball(5, [0, 3, 0], { color: '#e8925a' })
      .torus([4.62, 4.62, 0.5], [0, 4.0, 0], { color: '#c8643a', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([4.62, 4.62, 0.5], [0, 2.0, 0], { color: '#f2c08a', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([9, 9, 0.12], [0, 3, 0], { color: 'tan', rot: [75, 0, 15], tube: 0.16 })
      .ball(0.9, [4.4, 5.8, -0.5], { color: 'lightgray' })
      .done(),
  ),
  e('plant', 'garden', 'plants', () => {
    const b = m('plant').ball([0.3, 0.1, 0.3], [0, 0.03, 0], { color: 'dirt' }).rod([0, 0.05, 0], [0, 0.5, 0], 0.025, 'green');
    b.each(6, (i) => spoke(b, [0, 0.12 + Math.floor(i / 2) * 0.12, 0], (i % 2 ? 0 : 180) + Math.floor(i / 2) * 60, 25, 0.2 - Math.floor(i / 2) * 0.03, 0.025, 0.1, i % 3 ? 'leaf' : 'green'));
    return b.ball([0.08, 0.1, 0.05], [0, 0.53, 0], { color: 'lime' }).done();
  }),
  e('plastic', 'workshop', 'materials', () => {
    const b = m('plastic');
    bottle(b, -0.05, 0, 0.22, 0.07, '#a9dcf2', 'blue', { band: 'white' });
    b.box([0.1, 0.05, 0.06], [0.07, 0.025, 0.02], { color: 'red', round: 0.1 });
    b.each(4, (i) => b.cyl([0.018, 0.012, 0.018], [0.045 + (i % 2) * 0.05, 0.056, 0.005 + Math.floor(i / 2) * 0.03], { color: 'red' }));
    return b.cyl([0.06, 0.07, 0.06], [0.06, 0.035, -0.08], { color: 'yellow', taper: 1.25 }).done();
  }),
  e('plate', 'kitchen', 'tableware', () =>
    m('plate')
      .cyl([0.26, 0.02, 0.26], [0, 0.135, 0], { color: 'white', rot: [75, 0, 0] })
      .torus([0.24, 0.24, 0.02], [0, 0.135, 0.01], { color: 'blue', rot: [-15, 0, 0], tube: 0.06, noInk: true })
      .torus([0.15, 0.15, 0.02], [0, 0.135, 0.012], { color: 'lightgray', rot: [-15, 0, 0], tube: 0.04, noInk: true })
      .box([0.2, 0.02, 0.08], [0, 0.01, 0.03], { color: 'darkwood' })
      .rod([0, 0.02, -0.02], [0, 0.18, -0.05], 0.012, 'darkwood')
      .done(),
  ),
  e('platform', 'places', 'stages', () => {
    const b = m('platform')
      .box([3, 0.8, 2], [0, 0.4, 0], { color: 'wood' })
      .box([3.02, 0.6, 0.04], [0, 0.35, 1.0], { color: 'darkred' });
    b.each(3, (i) => b.box([0.9, 0.2, 0.3], [-1.0, 0.1 + i * 0.2, 1.3 - i * 0.3 + 0.15], { color: 'darkwood' }));
    return b.stick([0.4, 0.8, 0], [0.4, 2.2, 0], 0.03, 'black').ball([0.08, 0.12, 0.08], [0.4, 2.25, 0.02], { color: 'darkgray' }).cyl([0.35, 0.03, 0.35], [0.4, 0.815, 0], { color: 'black' }).done();
  }),
  e('platinum', 'nature', 'metals', () => {
    const b = m('platinum');
    const ingot = (x: number, y: number) =>
      b
        .box([0.06, 0.035, 0.16], [x, y + 0.0175, 0], { color: '#e4e4ea', round: 0.05 })
        .wedge([0.015, 0.035, 0.16], [x - 0.0375, y + 0.0175, 0], { color: '#e4e4ea', apex: 0.5 })
        .wedge([0.015, 0.035, 0.16], [x + 0.0375, y + 0.0175, 0], { color: '#e4e4ea', apex: -0.5 });
    ingot(-0.05, 0);
    ingot(0.05, 0);
    ingot(0, 0.035);
    return b.label('Pt', [0.04, 0.025], [0, 0.0525, 0.08], { color: '#e4e4ea' }).done();
  }),
  e('platter', 'kitchen', 'tableware', () =>
    m('platter')
      .cyl([0.45, 0.025, 0.3], [0, 0.0125, 0], { color: 'white' })
      .torus([0.48, 0.33, 0.02], [0, 0.025, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08 })
      .ball([0.2, 0.12, 0.16], [0, 0.08, 0], { color: 'crust' })
      .ball([0.08, 0.06, 0.06], [0.1, 0.06, 0.07], { color: 'crust', rot: [0, 30, 0] })
      .ball([0.08, 0.06, 0.06], [-0.1, 0.06, 0.07], { color: 'crust', rot: [0, -30, 0] })
      .ball(0.025, [0.14, 0.06, 0.1], { color: 'white' })
      .ball(0.025, [-0.14, 0.06, 0.1], { color: 'white' })
      .ball([0.06, 0.03, 0.05], [0.17, 0.035, -0.06], { color: 'lettuce' })
      .ball([0.06, 0.03, 0.05], [-0.17, 0.035, -0.05], { color: 'lettuce' })
      .cyl([0.04, 0.012, 0.04], [0.16, 0.05, -0.03], { color: 'tomato' })
      .done(),
  ),
  e('playground', 'places', 'parks', () => {
    const b = m('playground').box([6, 0.1, 4], [0, 0.05, 0], { color: '#c8693e' });
    b.pair((s) => b.stick([-1.6 + s * 0.4, 0.1, -0.3 + 0.4], [-1.6 + s * 0.4, 2.2, -0.3 + 0.4], 0.08, 'red').stick([-1.6 + s * 0.4, 0.1, -0.3 - 0.4], [-1.6 + s * 0.4, 2.2, -0.3 - 0.4], 0.08, 'red'));
    b.box([0.9, 0.5, 0.9], [-1.6, 1.6, -0.3], { color: 'yellow' }).wedge([1.1, 0.5, 1.1], [-1.6, 2.45, -0.3], { color: 'blue' });
    b.box([0.6, 0.06, 2.2], [-1.6, 0.75, 0.95], { color: 'lime', rot: [-38, 0, 0] });
    b.each(5, (i) => b.stick([-2.0, 0.3 + i * 0.25, -0.75], [-1.2, 0.3 + i * 0.25, -0.75], 0.05, 'gray'));
    b.pair((s) => b.rod([1.6 + s * 1.0, 0.1, 0.5], [1.6 + s * 0.9, 2.2, 0], 0.09, 'blue').rod([1.6 + s * 1.0, 0.1, -0.5], [1.6 + s * 0.9, 2.2, 0], 0.09, 'blue'));
    b.stick([0.6, 2.2, 0], [2.6, 2.2, 0], 0.1, 'blue');
    for (const x of [1.2, 2.0]) b.stick([x - 0.15, 2.2, 0], [x - 0.15, 0.55, 0], 0.02, 'gray').stick([x + 0.15, 2.2, 0], [x + 0.15, 0.55, 0], 0.02, 'gray').box([0.4, 0.05, 0.18], [x, 0.53, 0], { color: 'red' });
    return b.done();
  }),
  e('playhouse (toy)', 'toys', 'outdoor toys', () =>
    m('playhouse (toy)')
      .box([1.2, 0.08, 1.1], [0, 0.04, 0], { color: 'green' })
      .box([1.1, 0.9, 1.0], [0, 0.49, 0], { color: 'yellow', round: 0.1 })
      .wedge([1.3, 0.55, 1.2], [0, 1.215, 0], { color: 'red' })
      .box([0.4, 0.65, 0.05], [-0.2, 0.41, 0.51], { color: 'blue', round: 0.2, name: 'door', pivot: [-0.4, 0.41, 0.51] })
      .box([0.3, 0.3, 0.04], [0.28, 0.6, 0.51], { color: 'glass' })
      .box([0.1, 0.32, 0.05], [0.07, 0.6, 0.52], { color: 'lime' })
      .box([0.1, 0.32, 0.05], [0.49, 0.6, 0.52], { color: 'lime' })
      .box([0.14, 0.3, 0.14], [0.35, 1.3, -0.2], { color: 'white' })
      .done(),
  ),
  e('playpen', 'home', 'baby things', () => {
    const b = m('playpen').box([1.0, 0.08, 1.0], [0, 0.1, 0], { color: 'skyblue', round: 0.2 });
    for (const [x, z] of [[0.48, 0.48], [-0.48, 0.48], [0.48, -0.48], [-0.48, -0.48]]) b.stick([x, 0, z], [x, 0.72, z], 0.06, 'white');
    b.box([1.0, 0.05, 0.05], [0, 0.7, 0.48], { color: 'white' }).box([1.0, 0.05, 0.05], [0, 0.7, -0.48], { color: 'white' }).box([0.05, 0.05, 1.0], [0.48, 0.7, 0], { color: 'white' }).box([0.05, 0.05, 1.0], [-0.48, 0.7, 0], { color: 'white' });
    b.box([0.92, 0.52, 0.01], [0, 0.42, -0.48], { color: '#cfe8f5', noInk: true }).box([0.01, 0.52, 0.92], [0.48, 0.42, 0], { color: '#cfe8f5', noInk: true }).box([0.01, 0.52, 0.92], [-0.48, 0.42, 0], { color: '#cfe8f5', noInk: true });
    b.each(7, (i) => b.stick([-0.36 + i * 0.12, 0.14, 0.48], [-0.36 + i * 0.12, 0.68, 0.48], 0.025, 'white'));
    return b.ball(0.2, [0.15, 0.24, 0.05], { color: 'red' }).box([0.14, 0.14, 0.14], [-0.2, 0.21, -0.15], { color: 'yellow' }).done();
  }),
  e('playroom', 'places', 'rooms', () => {
    const b = room('playroom', 3, 2.6, 2.5, 'skyblue', 'lightwood')
      .cyl([1.5, 0.02, 1.1], [-0.2, 0.11, 0.2], { color: 'pink' })
      .box([0.25, 0.25, 0.25], [-0.6, 0.23, 0.4], { color: 'red' })
      .box([0.25, 0.25, 0.25], [-0.32, 0.23, 0.45], { color: 'blue' })
      .box([0.25, 0.25, 0.25], [-0.46, 0.48, 0.42], { color: 'yellow' })
      .ball(0.3, [0.5, 0.25, 0.6], { color: 'lime' })
      .box([0.8, 0.5, 0.5], [0.8, 0.35, -0.9], { color: 'orange' })
      .box([0.84, 0.08, 0.54], [0.8, 0.64, -0.9], { color: 'red', name: 'lid', pivot: [0.8, 0.6, -1.15] })
      .ball([0.4, 0.45, 0.3], [-0.9, 0.33, -0.8], { color: 'brown' })
      .ball(0.3, [-0.9, 0.7, -0.8], { color: 'brown' });
    b.pair((s) => b.ball(0.12, [-0.9 + s * 0.12, 0.84, -0.8], { color: 'brown' }));
    return b.star(0.5, [-0.3, 1.7, -1.22], { color: 'yellow' }).box([0.7, 0.5, 0.04], [0.5, 1.6, -1.22], { color: 'white' }).done();
  }),
  e('pliers', 'workshop', 'hand tools', () =>
    m('pliers')
      .rod([0, 0.1, 0], [0.04, 0.0, 0], 0.018, 'steel')
      .rod([0, 0.1, 0], [-0.04, 0.0, 0], 0.018, 'steel')
      .capsule([0.026, 0.07, 0.026], [0.03, 0.035, 0], { color: 'red', rot: [0, 0, 22] })
      .capsule([0.026, 0.07, 0.026], [-0.03, 0.035, 0], { color: 'red', rot: [0, 0, -22] })
      .cyl([0.022, 0.024, 0.022], [0, 0.11, 0], { color: 'silver', rot: [90, 0, 0] })
      .rod([0.004, 0.11, 0], [0.003, 0.18, 0], 0.012, 'steel')
      .rod([-0.004, 0.11, 0], [-0.003, 0.18, 0], 0.012, 'steel')
      .done(),
  ),
  e('plow', 'farm', 'farm tools', () =>
    m('plow', { view: 'side' })
      .rod([0, 0.45, 0.9], [0, 0.55, -0.4], 0.08, 'wood')
      .rod([0.04, 0.55, -0.35], [0.25, 1.0, -0.95], 0.05, 'wood')
      .rod([-0.04, 0.55, -0.35], [-0.25, 1.0, -0.95], 0.05, 'wood')
      .stick([0, 0.5, -0.1], [0, 0.18, 0.0], 0.06, 'iron')
      .ball([0.3, 0.3, 0.5], [0.06, 0.16, 0.0], { color: 'iron', rot: [0, 25, 0] })
      .cone([0.2, 0.25, 0.06], [-0.02, 0.06, 0.32], { color: 'steel', rot: [90, 0, 0] })
      .torus([0.36, 0.36, 0.06], [0, 0.18, 1.0], { color: 'iron', rot: [0, 90, 0], name: 'wheel' })
      .stick([0, 0.45, 0.92], [0, 0.18, 1.0], 0.04, 'iron')
      .done(),
  ),
  e('plum', 'food', 'fruit', () =>
    m('plum')
      .ball([0.06, 0.065, 0.058], [0, 0.0325, 0], { color: '#5a2a6a' })
      .rod([0, 0.01, 0.028], [0, 0.058, 0.024], 0.004, '#3a1a4a', { noInk: true })
      .ball([0.02, 0.025, 0.01], [-0.015, 0.045, 0.022], { color: '#8a6aa8', noInk: true })
      .rod([0, 0.064, 0], [0.004, 0.08, 0], 0.005, 'darkbrown')
      .ball([0.035, 0.005, 0.016], [0.02, 0.078, 0], { color: 'leaf', rot: [0, 0, 20] })
      .done(),
  ),
  e('plum tree', 'garden', 'fruit trees', () => tree('plum tree', { h: 4.5, crown: '#4a8a3a', fruit: '#5a2a6a', n: 14 }).done()),
  e('plunger', 'home', 'bathroom', () =>
    m('plunger')
      .cyl([0.14, 0.05, 0.14], [0, 0.025, 0], { color: 'red', taper: 0.75 })
      .ball([0.11, 0.07, 0.11], [0, 0.05, 0], { color: 'red' })
      .stick([0, 0.08, 0], [0, 0.42, 0], 0.028, 'wood')
      .ball(0.035, [0, 0.42, 0], { color: 'wood' })
      .done(),
  ),
  e('plus sign', 'ideas', 'symbols', () => plinth(m('plus sign')).box([0.16, 0.05, 0.03], [0, 0.12, 0], { color: 'red', round: 0.2 }).box([0.05, 0.16, 0.03], [0, 0.12, 0], { color: 'red', round: 0.2 }).done()),
  e('pocket knife', 'sports', 'camping gear', () =>
    m('pocket knife')
      .box([0.09, 0.026, 0.02], [0, 0.015, 0], { color: 'red', round: 0.6 })
      .box([0.014, 0.005, 0.004], [-0.02, 0.015, 0.011], { color: 'white', noInk: true })
      .box([0.005, 0.014, 0.004], [-0.02, 0.015, 0.011], { color: 'white', noInk: true })
      .box([0.06, 0.016, 0.004], [0.065, 0.042, 0], { color: 'silver', rot: [0, 0, 40] })
      .cone([0.016, 0.02, 0.004], [0.094, 0.067, 0], { color: 'silver', rot: [0, 0, -50] })
      .box([0.04, 0.008, 0.004], [-0.055, 0.03, -0.004], { color: 'silver', rot: [0, 0, -30] })
      .done(),
  ),
  e('pocket watch', 'wardrobe', 'watches', () =>
    m('pocket watch')
      .cyl([0.05, 0.012, 0.05], [0, 0.028, 0], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.042, 0.004, 0.042], [0, 0.028, 0.006], { color: 'white', rot: [90, 0, 0] })
      .box([0.002, 0.016, 0.002], [0, 0.034, 0.009], { color: 'black', noInk: true })
      .box([0.012, 0.002, 0.002], [0.005, 0.028, 0.009], { color: 'black', noInk: true })
      .cyl([0.008, 0.008, 0.008], [0, 0.058, 0], { color: 'gold' })
      .torus([0.018, 0.018, 0.004], [0, 0.068, 0], { color: 'gold', tube: 0.25 })
      .rod([0.008, 0.07, 0], [0.04, 0.05, 0.01], 0.004, 'gold')
      .rod([0.04, 0.05, 0.01], [0.05, 0.004, 0.02], 0.004, 'gold')
      .done(),
  ),
  e('pod', 'food', 'vegetables', () => {
    const b = m('pod')
      .capsule([0.03, 0.12, 0.028], [0, 0.015, 0], { color: '#5aa040', rot: [0, 0, 90] })
      .capsule([0.022, 0.1, 0.02], [0, 0.022, 0.003], { color: '#a8d878', rot: [0, 0, 90] })
      .rod([0.06, 0.015, 0], [0.075, 0.03, 0], 0.006, 'darkgreen');
    b.each(5, (i) => b.ball(0.019, [-0.04 + i * 0.02, 0.03, 0.003], { color: 'lime' }));
    return b.done();
  }),
  e('pogo stick', 'toys', 'outdoor toys', () =>
    m('pogo stick')
      .cyl([0.05, 0.05, 0.05], [0, 0.025, 0], { color: 'black' })
      .stick([0, 0.05, 0], [0, 0.15, 0], 0.03, 'silver')
      .cyl([0.08, 0.3, 0.08], [0, 0.3, 0], { color: 'red' })
      .box([0.28, 0.025, 0.07], [0, 0.35, 0], { color: 'black' })
      .stick([0, 0.45, 0], [0, 1.0, 0], 0.035, 'red')
      .capsule([0.035, 0.38, 0.035], [0, 1.0, 0], { color: 'silver', rot: [0, 0, 90] })
      .cyl([0.045, 0.08, 0.045], [0.15, 1.0, 0], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.045, 0.08, 0.045], [-0.15, 1.0, 0], { color: 'black', rot: [0, 0, 90] })
      .done(),
  ),
  e('poinsettia', 'garden', 'flowers', () => {
    const b = m('poinsettia').cyl([0.2, 0.16, 0.2], [0, 0.08, 0], { color: 'gold', taper: 1.2 }).ball([0.22, 0.06, 0.22], [0, 0.16, 0], { color: 'darkgreen' });
    b.each(6, (i) => spoke(b, [0, 0.19, 0], i * 60 + 30, 10, 0.17, 0.025, 0.08, 'darkgreen'));
    b.each(7, (i) => spoke(b, [0, 0.24, 0], (i / 7) * 360, 22, 0.15, 0.02, 0.06, 'red'));
    b.each(5, (i) => spoke(b, [0, 0.27, 0], (i / 5) * 360 + 36, 40, 0.09, 0.02, 0.05, '#e0473b'));
    return b.ball(0.02, [0, 0.28, 0], { color: 'yellow' }).ball(0.015, [0.015, 0.282, 0.01], { color: 'lime' }).done();
  }),
  e('polarised sunglasses', 'wardrobe', 'eyewear', () => {
    const b = m('polarised sunglasses');
    b.pair((s) => b.ball([0.055, 0.042, 0.012], [s * 0.035, 0.04, 0], { color: '#2a3a4a' }).rod([s * 0.065, 0.048, -0.004], [s * 0.07, 0.03, -0.13], 0.006, 'black').ball([0.03, 0.012, 0.004], [s * 0.04, 0.05, 0.007], { color: '#6a8aa8', noInk: true }));
    return b.box([0.03, 0.008, 0.008], [0, 0.05, 0], { color: 'black' }).box([0.14, 0.006, 0.01], [0, 0.062, 0], { color: 'black' }).done();
  }),
  e('pole', 'places', 'street things', () =>
    m('pole')
      .cyl([0.55, 0.25, 0.55], [0, 0.125, 0], { color: 'stone', taper: 0.8 })
      .stick([0, 0.25, 0], [0, 3.0, 0], 0.07, 'silver')
      .ball(0.12, [0, 3.05, 0], { color: 'gold' })
      .box([0.9, 0.55, 0.03], [0.48, 2.65, 0], { color: 'blue' })
      .star(0.3, [0.48, 2.65, 0.02], { color: 'white' })
      .done(),
  ),
  e('police cap', 'wardrobe', 'hats', () =>
    m('police cap')
      .cyl([0.18, 0.06, 0.18], [0, 0.03, 0], { color: 'navy' })
      .cyl([0.25, 0.04, 0.24], [0, 0.085, -0.01], { color: 'navy', taper: 1.05 })
      .cyl([0.182, 0.025, 0.182], [0, 0.035, 0], { color: 'black', noInk: true })
      .ball([0.16, 0.02, 0.09], [0, 0.02, 0.1], { color: 'black', rot: [-12, 0, 0] })
      .cyl([0.045, 0.01, 0.045], [0, 0.075, 0.09], { color: 'gold', rot: [80, 0, 0] })
      .done(),
  ),
  e('police car', 'garage', 'cars', () =>
    car('police car', 'white', { roof: 'black', text: 'POLICE' })
      .box([1.78, 0.25, 1.4], [0, 0.6, 1.3], { color: 'black', noInk: true })
      .box([1.78, 0.25, 1.4], [0, 0.6, -1.3], { color: 'black', noInk: true })
      .box([1.0, 0.12, 0.3], [0, 1.43, -0.25], { color: 'black' })
      .box([0.45, 0.14, 0.26], [0.26, 1.54, -0.25], { color: 'red', glow: true })
      .box([0.45, 0.14, 0.26], [-0.26, 1.54, -0.25], { color: 'blue', glow: true })
      .done(),
  ),
  e('police station', 'places', 'civic buildings', () =>
    bldg('police station', { w: 9, h: 7, d: 6, wall: '#c8ccd0', roof: 'navy', sign: 'POLICE', signColor: 'navy' })
      .box([2.4, 0.3, 1.4], [0, 2.3, 3.6], { color: 'navy' })
      .stick([1.0, 0, 4.2], [1.0, 2.15, 4.2], 0.12, 'gray')
      .stick([-1.0, 0, 4.2], [-1.0, 2.15, 4.2], 0.12, 'gray')
      .cyl([0.35, 0.4, 0.35], [1.6, 2.4, 3.2], { color: 'blue', glow: true })
      .stick([-3.8, 7.3, 2], [-3.8, 9.5, 2], 0.08, 'silver')
      .box([1.2, 0.7, 0.04], [-3.15, 9.1, 2], { color: 'blue' })
      .done(),
  ),
  e('policeman uniform', 'wardrobe', 'uniforms', () => who('policeman uniform', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('police', 'navy'), wear('badge', 'gold'), wear('belt', 'black'), wear('tie', 'black')] })),
  e('pollen', 'garden', 'flower parts', () => {
    const b = m('pollen');
    const grain = (c: Vec3, r: number, col2: string) => {
      b.ball(r, c, { color: col2 });
      for (let i = 0; i < 10; i++) {
        const a = i * 2.39, y = -0.8 + (i / 9) * 1.6, rr = Math.sqrt(1 - y * y);
        const dir: Vec3 = [Math.cos(a) * rr, y, Math.sin(a) * rr];
        b.cone([r * 0.22, r * 0.3, r * 0.22], [c[0] + dir[0] * r * 0.55, c[1] + dir[1] * r * 0.55, c[2] + dir[2] * r * 0.55], { color: col2, rot: [Math.atan2(dir[2], dir[1]) * 57.3, 0, -Math.asin(dir[0]) * 57.3] });
      }
    };
    grain([0, 0.04, 0], 0.06, 'yellow');
    grain([0.05, 0.03, 0.03], 0.045, 'gold');
    grain([-0.045, 0.025, 0.035], 0.04, '#f6c445');
    return b.done();
  }),
  e('polo shirt', 'wardrobe', 'tops', () =>
    m('polo shirt')
      .box([0.46, 0.6, 0.2], [0, 0.32, 0], { color: 'green', round: 0.3 })
      .rod([0.2, 0.56, 0], [0.33, 0.42, 0], 0.15, 'green')
      .rod([-0.2, 0.56, 0], [-0.33, 0.42, 0], 0.15, 'green')
      .wedge([0.1, 0.07, 0.03], [0.05, 0.62, 0.09], { color: 'white', rot: [0, 0, -25] })
      .wedge([0.1, 0.07, 0.03], [-0.05, 0.62, 0.09], { color: 'white', rot: [0, 0, 25] })
      .box([0.04, 0.14, 0.01], [0, 0.55, 0.1], { color: '#3f7a3a', noInk: true })
      .ball(0.014, [0, 0.58, 0.106], { color: 'white' })
      .ball(0.014, [0, 0.52, 0.106], { color: 'white' })
      .ball([0.04, 0.03, 0.01], [0.12, 0.48, 0.1], { color: 'white', noInk: true })
      .done(),
  ),
  e('polystyrene', 'workshop', 'materials', () => {
    const b = m('polystyrene').box([0.2, 0.08, 0.14], [0, 0.04, 0], { color: '#f4f4ef', round: 0.05 });
    b.each(8, (i) => b.ball(0.012, [-0.08 + (i % 4) * 0.05, 0.03 + Math.floor(i / 4) * 0.025, 0.07], { color: '#e4e4dc', noInk: true }));
    return b.cyl([0.07, 0.1, 0.07], [0.04, 0.13, -0.02], { color: 'white', taper: 1.3 }).torus([0.092, 0.092, 0.01], [0.04, 0.18, -0.02], { color: 'white', rot: [90, 0, 0], tube: 0.12 }).done();
  }),
  e('pomegranate', 'food', 'fruit', () => {
    const b = m('pomegranate').ball([0.085, 0.08, 0.085], [-0.025, 0.04, -0.01], { color: '#b8283a' }).cyl([0.025, 0.02, 0.025], [-0.025, 0.088, -0.01], { color: '#a02030', taper: 1.4 });
    b.each(5, (i) => b.cone([0.01, 0.015, 0.01], [-0.025 + Math.cos(i * 1.257) * 0.012, 0.102, -0.01 + Math.sin(i * 1.257) * 0.012], { color: '#a02030' }));
    b.ball([0.07, 0.04, 0.07], [0.05, 0.02, 0.04], { color: '#b8283a' }).ball([0.06, 0.012, 0.06], [0.05, 0.04, 0.04], { color: '#f0d0b0' });
    b.each(7, (i) => b.ball(0.012, [0.05 + Math.cos(i) * 0.018 * (i % 2 + 0.5), 0.046, 0.04 + Math.sin(i) * 0.018 * (i % 2 + 0.5)], { color: 'red' }));
    return b.done();
  }),
  e('pompom', 'sports', 'cheerleading', () => {
    const b = m('pompom').capsule([0.03, 0.08, 0.03], [0, 0.04, 0], { color: 'white' }).ball(0.12, [0, 0.17, 0], { color: 'red' });
    b.each(30, (i) => {
      const a = i * 2.39, y = -0.95 + (i / 29) * 1.9, rr = Math.sqrt(1 - y * y);
      b.rod([0, 0.17, 0], [Math.cos(a) * rr * 0.11, 0.17 + y * 0.11, Math.sin(a) * rr * 0.11], 0.03, i % 3 ? 'red' : 'white');
    });
    return b.done();
  }),
  e('poncho', 'wardrobe', 'outfits', () => who('poncho', { top: 'cream', bottom: 'denim', shoes: 'brown', acc: [poncho('red', 'yellow'), hat('sombrero', 'tan')] })),
  e('pond', 'nature', 'water', () => {
    const b = m('pond').cyl([2.0, 0.06, 1.4], [0, 0.05, 0], { color: 'water' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.ball([0.3, 0.2, 0.25], [Math.cos(a) * 1.05, 0.08, Math.sin(a) * 0.75], { color: i % 2 ? 'stone' : 'rock' });
    });
    b.cyl([0.3, 0.02, 0.3], [0.3, 0.09, 0.2], { color: 'leaf' }).cyl([0.25, 0.02, 0.25], [-0.35, 0.09, -0.1], { color: 'leaf' }).ball(0.1, [0.32, 0.13, 0.2], { color: 'pink' });
    b.each(4, (i) => b.rod([-0.8 + i * 0.08, 0.05, -0.55], [-0.85 + i * 0.1, 0.8 + (i % 2) * 0.15, -0.6], 0.025, 'green').capsule([0.05, 0.16, 0.05], [-0.85 + i * 0.1, 0.75 + (i % 2) * 0.15, -0.6], { color: 'darkbrown' }));
    return b.done();
  }),
  e('pool', 'places', 'pools', () =>
    m('pool')
      .box([3.4, 0.5, 2.2], [0, 0.25, 0], { color: 'white', round: 0.05 })
      .box([3.0, 0.06, 1.8], [0, 0.48, 0], { color: 'water' })
      .box([3.02, 0.02, 0.06], [0, 0.505, 0], { color: 'white', noInk: true })
      .rod([1.0, 0.5, 0.95], [1.0, 1.0, 1.05], 0.04, 'silver')
      .rod([1.0, 1.0, 1.05], [1.0, 0.95, 0.85], 0.04, 'silver')
      .rod([1.4, 0.5, 0.95], [1.4, 1.0, 1.05], 0.04, 'silver')
      .rod([1.4, 1.0, 1.05], [1.4, 0.95, 0.85], 0.04, 'silver')
      .box([0.45, 0.06, 1.3], [-1.0, 0.75, -0.6], { color: 'blue' })
      .box([0.4, 0.25, 0.3], [-1.0, 0.6, -1.0], { color: 'white' })
      .torus([0.5, 0.5, 0.14], [0.3, 0.53, 0.1], { color: 'red', rot: [90, 0, 0], tube: 0.4 })
      .done(),
  ),
  e('pool ball', 'sports', 'billiards', () =>
    m('pool ball')
      .ball(0.057, [0, 0.0285, 0], { color: 'black' })
      .cyl([0.026, 0.004, 0.026], [0, 0.03, 0.027], { color: 'white', rot: [90, 0, 0], noInk: true })
      .torus([0.009, 0.009, 0.002], [0, 0.0345, 0.029], { color: 'black', tube: 0.35, noInk: true })
      .torus([0.01, 0.01, 0.002], [0, 0.026, 0.029], { color: 'black', tube: 0.35, noInk: true })
      .done(),
  ),
  e('pool balls', 'sports', 'billiards', () => {
    const b = m('pool balls');
    const cs = ['yellow', 'blue', 'red', 'purple', 'orange', 'green', 'maroon', 'black', 'gold', 'navy', 'tomato', 'violet', '#f0923b', 'darkgreen', 'darkred'];
    let k = 0;
    for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) b.ball(0.057, [(i - r / 2) * 0.058, 0.0285, (2 - r) * 0.05], { color: cs[k++] });
    const A: Vec3 = [0, 0.02, 0.16], B: Vec3 = [-0.18, 0.02, -0.15], C: Vec3 = [0.18, 0.02, -0.15];
    return b.rod(A, B, 0.025, 'darkwood').rod(B, C, 0.025, 'darkwood').rod(C, A, 0.025, 'darkwood').done();
  }),
  e('pool chair', 'home', 'outdoor furniture', () => {
    const b = m('pool chair', { view: 'side' });
    b.pair((s) => b.stick([s * 0.3, 0.3, -1.0], [s * 0.3, 0.3, 0.9], 0.04, 'white').stick([s * 0.3, 0, 0.8], [s * 0.3, 0.3, 0.8], 0.04, 'white').stick([s * 0.3, 0, -0.8], [s * 0.3, 0.3, -0.8], 0.04, 'white'));
    b.each(5, (i) => b.box([0.6, 0.17, 0.26], [0, 0.38, 0.78 - i * 0.26], { color: i % 2 ? 'white' : 'blue' }));
    b.each(3, (i) => b.box([0.6, 0.17, 0.24], [0, 0.45 + i * 0.18, -0.98 - i * 0.15], { color: i % 2 ? 'white' : 'blue', rot: [-50, 0, 0] }));
    return b.box([0.5, 0.05, 0.4], [0, 0.47, 0.4], { color: 'yellow', round: 0.4 }).done();
  }),
  e('pool cue', 'sports', 'billiards', () =>
    m('pool cue')
      .cyl([0.22, 0.11, 0.22], [0, 0.055, 0], { color: 'darkwood', taper: 0.8 })
      .cyl([0.036, 0.6, 0.036], [0, 0.4, 0], { color: 'darkwood', taper: 0.8 })
      .cyl([0.032, 0.05, 0.032], [0, 0.35, 0], { color: 'cream' })
      .cyl([0.026, 0.8, 0.026], [0, 1.1, 0], { color: 'lightwood', taper: 0.55 })
      .cyl([0.015, 0.02, 0.015], [0, 1.51, 0], { color: 'white' })
      .cyl([0.015, 0.012, 0.015], [0, 1.526, 0], { color: 'blue' })
      .ball(0.057, [0.08, 0.14, 0.03], { color: 'red' })
      .done(),
  ),
  e('pool house', 'places', 'pools', () => {
    const b = bldg('pool house', { w: 5, h: 3.2, d: 4, wall: 'white', roof: 'skyblue', sign: 'POOL', signColor: 'skyblue' });
    b.each(5, (i) => b.box([0.6, 0.08, 1.1], [-1.2 + i * 0.6, 2.25, 2.4], { color: i % 2 ? 'white' : 'blue', rot: [20, 0, 0] }));
    return b.box([5.2, 0.12, 1.8], [0, 0.06, 3.9], { color: 'white' }).box([4.8, 0.04, 1.4], [0, 0.13, 3.9], { color: 'water' }).done();
  }),
  e('pool table', 'sports', 'billiards', () => {
    const b = m('pool table')
      .box([2.2, 0.12, 1.2], [0, 0.74, 0], { color: 'darkwood' })
      .box([2.1, 0.03, 1.1], [0, 0.81, 0], { color: 'green' })
      .box([2.3, 0.08, 0.1], [0, 0.82, 0.6], { color: 'wood' })
      .box([2.3, 0.08, 0.1], [0, 0.82, -0.6], { color: 'wood' })
      .box([0.1, 0.08, 1.3], [1.1, 0.82, 0], { color: 'wood' })
      .box([0.1, 0.08, 1.3], [-1.1, 0.82, 0], { color: 'wood' });
    for (const [x, z] of [[0.95, 0.45], [-0.95, 0.45], [0.95, -0.45], [-0.95, -0.45]]) b.box([0.18, 0.68, 0.18], [x, 0.34, z], { color: 'darkwood' });
    for (const [x, z] of [[1.05, 0.55], [-1.05, 0.55], [1.05, -0.55], [-1.05, -0.55], [0, 0.56], [0, -0.56]]) b.ball([0.1, 0.03, 0.1], [x, 0.84, z], { color: 'black' });
    b.ball(0.057, [-0.5, 0.855, 0], { color: 'white' }).ball(0.057, [0.4, 0.855, 0.1], { color: 'red' }).ball(0.057, [0.46, 0.855, -0.05], { color: 'yellow' }).ball(0.057, [0.52, 0.855, 0.08], { color: 'black' });
    return b.stick([-1.0, 0.87, 0.2], [0.3, 0.87, -0.35], 0.025, 'lightwood').done();
  }),
  e('pop gun', 'toys', 'toy guns', () =>
    m('pop gun', { view: 'side' })
      .box([0.05, 0.1, 0.22], [0, 0.07, -0.2], { color: 'wood', rot: [10, 0, 0] })
      .box([0.05, 0.06, 0.12], [0, 0.13, -0.05], { color: 'wood' })
      .cyl([0.065, 0.4, 0.065], [0, 0.15, 0.2], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.05, 0.04, 0.05], [0, 0.15, 0.42], { color: 'tan', rot: [90, 0, 0], taper: 1.3 })
      .rod([0, 0.13, 0.43], [0, 0.11, 0.3], 0.004, 'white')
      .torus([0.04, 0.035, 0.008], [0, 0.09, -0.03], { color: 'black', rot: [0, 90, 0], tube: 0.2 })
      .done(),
  ),
  e('popcorn', 'food', 'snacks', () => {
    const b = m('popcorn')
      .cyl([0.14, 0.18, 0.14], [0, 0.09, 0], { color: 'red', taper: 1.3 })
      .cyl([0.185, 0.03, 0.185], [0, 0.175, 0], { color: 'white' })
      .label('POPCORN', [0.11, 0.04], [0, 0.09, 0.075], { color: 'white' });
    b.each(16, (i) => {
      const a = i * 2.39, r = 0.065 * Math.sqrt((i + 1) / 16);
      b.ball(0.04, [Math.cos(a) * r, 0.2 + (1 - r / 0.065) * 0.04 + (i % 3) * 0.006, Math.sin(a) * r], { color: i % 4 ? 'cream' : '#f6e08a' });
    });
    return b.done();
  }),
  e('popcorn kernel', 'food', 'snacks', () =>
    m('popcorn kernel')
      .ball([0.028, 0.024, 0.026], [0, 0.016, 0], { color: 'cream' })
      .ball([0.024, 0.022, 0.022], [0.014, 0.026, 0.004], { color: 'cream' })
      .ball([0.022, 0.02, 0.022], [-0.012, 0.03, 0.002], { color: '#fff8e0' })
      .ball([0.02, 0.02, 0.02], [0.002, 0.036, -0.008], { color: 'cream' })
      .ball([0.01, 0.008, 0.006], [0.004, 0.012, 0.013], { color: '#e8a83a', noInk: true })
      .ball([0.012, 0.012, 0.008], [0.04, 0.006, 0.01], { color: 'yellow' })
      .cone([0.012, 0.008, 0.008], [0.04, 0.015, 0.01], { color: 'yellow' })
      .done(),
  ),
  e('porch', 'places', 'house parts', () => {
    const b = m('porch')
      .box([3.6, 2.8, 0.2], [0, 1.4, -1.0], { color: '#e8e0d0' })
      .box([0.9, 2.0, 0.08], [0, 1.3, -0.88], { color: 'darkred', name: 'door', pivot: [-0.45, 1.3, -0.88] })
      .box([0.8, 0.8, 0.06], [1.2, 1.5, -0.88], { color: 'glass' })
      .box([3.6, 0.3, 1.8], [0, 0.15, 0], { color: 'wood' })
      .box([1.0, 0.15, 0.3], [0, 0.075, 1.05], { color: 'wood' })
      .box([3.8, 0.12, 2.1], [0, 2.75, 0.05], { color: 'darkgray', rot: [6, 0, 0] });
    b.pair((s) => {
      b.stick([s * 1.65, 0.3, 0.8], [s * 1.65, 2.7, 0.8], 0.16, 'white');
      b.box([1.1, 0.08, 0.06], [s * 1.1, 0.95, 0.8], { color: 'white' });
      b.each(4, (i) => b.stick([s * (0.65 + i * 0.25), 0.3, 0.8], [s * (0.65 + i * 0.25), 0.95, 0.8], 0.04, 'white'));
    });
    return b.box([0.6, 0.08, 0.5], [-1.0, 0.75, 0.0], { color: 'darkwood' }).box([0.6, 0.6, 0.06], [-1.0, 1.05, -0.25], { color: 'darkwood' }).torus([0.6, 0.25, 0.05], [-1.0, 0.42, 0], { color: 'darkwood', rot: [0, 90, 0], tube: 0.2 }).done();
  }),
  e('pork', 'food', 'meat', () =>
    m('pork')
      .box([0.3, 0.02, 0.22], [0, 0.01, 0], { color: 'wood', round: 0.4 })
      .ball([0.19, 0.024, 0.14], [0, 0.026, 0], { color: 'cream' })
      .ball([0.17, 0.03, 0.12], [-0.005, 0.03, 0.005], { color: '#e8a090' })
      .capsule([0.025, 0.09, 0.02], [0.05, 0.04, 0.0], { color: 'white', rot: [0, 30, 90] })
      .done(),
  ),
  e('pork rinds', 'food', 'snacks', () => {
    const b = m('pork rinds').cyl([0.16, 0.05, 0.16], [0, 0.025, 0], { color: 'darkred', taper: 1.4 });
    b.each(9, (i) => {
      const a = i * 2.39, r = i ? 0.055 : 0;
      b.ball([0.05, 0.025, 0.035], [Math.cos(a) * r, 0.06 + (i ? 0 : 0.015), Math.sin(a) * r], { color: i % 2 ? '#e8b86a' : '#d8a050', rot: [i * 25, i * 40, i * 15] });
    });
    return b.done();
  }),
  e('port (place)', 'places', 'harbours', () => {
    const b = m('port (place)').box([10, 0.2, 7], [0, 0.1, 0], { color: 'water' }).box([10, 0.8, 2.6], [0, 0.4, -2.2], { color: 'stone' });
    const cs = ['red', 'blue', 'green', 'orange', 'yellow'];
    b.each(5, (i) => b.box([1.0, 1.0, 2.2], [-4 + i * 1.1, 1.3, -2.2], { color: cs[i], round: 0.05 }));
    b.box([1.0, 1.0, 2.2], [-3.45, 2.3, -2.2], { color: 'teal', round: 0.05 });
    b.stick([1.8, 0.8, -1.2], [1.8, 6, -1.2], 0.3, 'orange').stick([1.8, 0.8, -3.2], [1.8, 6, -3.2], 0.3, 'orange').stick([3.6, 0.8, -1.2], [3.6, 6, -1.2], 0.3, 'orange').stick([3.6, 0.8, -3.2], [3.6, 6, -3.2], 0.3, 'orange');
    b.box([2.2, 0.4, 5.5], [2.7, 6.1, 0.3], { color: 'orange' }).stick([2.7, 6, 2.2], [2.7, 3.6, 2.2], 0.05, 'darkgray');
    b.box([7, 1.2, 1.8], [-0.5, 0.7, 1.9], { color: 'darkred', round: 0.2 }).box([7.04, 0.3, 1.84], [-0.5, 1.2, 1.9], { color: 'black', noInk: true }).box([1.2, 1.4, 1.4], [-3.4, 2.0, 1.9], { color: 'white' });
    b.box([1.1, 0.9, 1.4], [-1.5, 1.75, 1.9], { color: 'blue' }).box([1.1, 0.9, 1.4], [-0.3, 1.75, 1.9], { color: 'yellow' }).box([1.1, 0.9, 1.4], [0.9, 1.75, 1.9], { color: 'green' });
    return b.done();
  }),
  e('port hole', 'garage', 'ship parts', () => {
    const b = m('port hole')
      .box([0.6, 0.6, 0.06], [0, 0.3, 0], { color: 'white' })
      .torus([0.4, 0.4, 0.08], [0, 0.32, 0.04], { color: 'brass', tube: 0.22 })
      .cyl([0.3, 0.02, 0.3], [0, 0.32, 0.035], { color: 'glass', rot: [90, 0, 0] });
    b.each(8, (i) => b.ball(0.035, [Math.cos(i * 0.785) * 0.17, 0.32 + Math.sin(i * 0.785) * 0.17, 0.085], { color: 'brass' }));
    return b.done();
  }),
  e('portable toilet', 'places', 'huts', () =>
    m('portable toilet')
      .box([1.1, 2.2, 1.1], [0, 1.1, 0], { color: 'blue', round: 0.1 })
      .cyl([1.25, 0.18, 1.25], [0, 2.29, 0], { color: 'white' })
      .ball([0.3, 0.15, 0.3], [0, 2.42, 0], { color: 'white' })
      .box([0.85, 1.95, 0.05], [0, 1.02, 0.56], { color: 'skyblue', name: 'door', pivot: [-0.42, 1.02, 0.56] })
      .label('WC', [0.35, 0.2], [0, 1.7, 0.59], { color: 'white', parent: 'door' })
      .box([0.16, 0.08, 0.03], [0.3, 1.2, 0.6], { color: 'red', parent: 'door' })
      .done(),
  ),
  e('post office', 'places', 'civic buildings', () =>
    bldg('post office', { w: 9, h: 6, d: 6, wall: '#c8705a', roof: 'darkgray', sign: 'POST OFFICE', signColor: 'blue' })
      .box([1.6, 1.0, 0.1], [0, 4.6, 3.04], { color: 'white' })
      .wedge([1.6, 0.5, 0.1], [0, 4.85, 3.1], { color: 'lightgray', rot: [0, 0, 180] })
      .box([0.5, 0.85, 0.5], [2.4, 0.43, 3.8], { color: 'blue', round: 0.1 })
      .ball([0.5, 0.3, 0.5], [2.4, 0.88, 3.8], { color: 'blue' })
      .box([0.3, 0.04, 0.04], [2.4, 0.7, 4.06], { color: 'black' })
      .stick([-3.8, 6.3, 2.5], [-3.8, 8.5, 2.5], 0.08, 'silver')
      .box([1.1, 0.65, 0.04], [-3.2, 8.1, 2.5], { color: 'blue' })
      .done(),
  ),
  e('postcard', 'study', 'mail', () =>
    m('postcard')
      .box([0.12, 0.012, 0.04], [0, 0.006, 0], { color: 'darkwood' })
      .box([0.15, 0.1, 0.008], [0, 0.06, 0], { color: 'white', rot: [-8, 0, 0] })
      .box([0.136, 0.04, 0.004], [0, 0.085, 0.005], { color: 'skyblue', noInk: true, rot: [-8, 0, 0] })
      .box([0.136, 0.025, 0.004], [0, 0.053, 0.006], { color: 'water', noInk: true, rot: [-8, 0, 0] })
      .box([0.136, 0.02, 0.004], [0, 0.031, 0.008], { color: 'sand', noInk: true, rot: [-8, 0, 0] })
      .ball(0.02, [0.04, 0.09, 0.006], { color: 'yellow', noInk: true })
      .rod([-0.04, 0.03, 0.01], [-0.045, 0.085, 0.004], 0.006, 'bark')
      .ball([0.04, 0.012, 0.006], [-0.045, 0.088, 0.006], { color: 'leaf' })
      .box([0.025, 0.03, 0.004], [0.055, 0.092, 0.002], { color: 'red', rot: [-8, 0, 0] })
      .done(),
  ),
  e('poster', 'home', 'decor', () => {
    const b = m('poster');
    b.pair((s) => b.box([0.1, 0.08, 0.3], [s * 0.3, 0.04, 0], { color: 'darkgray' }).stick([s * 0.3, 0.08, 0], [s * 0.3, 0.2, 0], 0.03, 'darkgray'));
    return b
      .box([0.72, 1.0, 0.025], [0, 0.68, 0], { color: 'white' })
      .box([0.64, 0.6, 0.01], [0, 0.82, 0.014], { color: 'skyblue', noInk: true })
      .wedge([0.4, 0.3, 0.012], [-0.12, 0.67, 0.02], { color: 'darkgreen', noInk: true })
      .wedge([0.3, 0.24, 0.012], [0.15, 0.64, 0.021], { color: 'green', noInk: true })
      .ball(0.1, [0.18, 0.95, 0.02], { color: 'yellow', noInk: true })
      .label('VISIT!', [0.5, 0.14], [0, 0.35, 0.02], { color: 'white' })
      .done();
  }),
  e('pot (kitchen)', 'kitchen', 'cookware', () =>
    m('pot (kitchen)')
      .cyl([0.22, 0.15, 0.22], [0, 0.075, 0], { color: 'silver' })
      .cyl([0.23, 0.02, 0.23], [0, 0.16, 0], { color: 'steel', taper: 0.85, name: 'lid', pivot: [0, 0.15, -0.11] })
      .ball([0.04, 0.03, 0.04], [0, 0.18, 0], { color: 'black', parent: 'lid' })
      .torus([0.07, 0.05, 0.016], [0.135, 0.13, 0], { color: 'black', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.07, 0.05, 0.016], [-0.135, 0.13, 0], { color: 'black', rot: [90, 0, 0], tube: 0.3 })
      .done(),
  ),
  e('pot of gold', 'fantasy', 'magic items', () => {
    const b = m('pot of gold')
      .ball([0.26, 0.2, 0.26], [0, 0.12, 0], { color: 'black' })
      .torus([0.24, 0.24, 0.03], [0, 0.2, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.15 })
      .ball([0.21, 0.09, 0.21], [0, 0.21, 0], { color: 'gold' });
    b.each(3, (i) => b.cyl([0.04, 0.04, 0.04], [Math.cos(i * 2.09) * 0.08, 0.02, Math.sin(i * 2.09) * 0.08], { color: 'black' }));
    b.each(6, (i) => b.cyl([0.04, 0.008, 0.04], [Math.cos(i * 1.05) * 0.05, 0.255 - (i % 2) * 0.01, Math.sin(i * 1.05) * 0.05], { color: 'gold', rot: [20 + i * 10, 0, i * 15] }));
    return b.cyl([0.04, 0.008, 0.04], [0.15, 0.004, 0.08], { color: 'gold' }).cyl([0.04, 0.008, 0.04], [0.12, 0.012, 0.12], { color: 'gold', rot: [10, 0, 10] }).done();
  }),
  e('pot sticker', 'food', 'asian dishes', () => {
    const b = plate(m('pot sticker'), 0.24);
    b.each(3, (i) => {
      const x = (i - 1) * 0.07, z = (i % 2) * 0.03;
      b.ball([0.06, 0.02, 0.038], [x, 0.022, z], { color: 'crust' }).ball([0.062, 0.04, 0.036], [x, 0.034, z], { color: '#f2dfb0' }).rod([x - 0.025, 0.05, z], [x + 0.025, 0.05, z], 0.012, '#f2dfb0');
    });
    return b.cyl([0.06, 0.025, 0.06], [0.07, 0.03, -0.06], { color: 'white' }).cyl([0.05, 0.006, 0.05], [0.07, 0.042, -0.06], { color: '#5a3020' }).done();
  }),
  e('potato', 'food', 'vegetables', () =>
    m('potato')
      .ball([0.1, 0.06, 0.07], [0, 0.03, 0], { color: '#c8a060' })
      .ball([0.05, 0.045, 0.05], [0.035, 0.035, 0.005], { color: '#c8a060' })
      .ball([0.008, 0.006, 0.004], [-0.02, 0.04, 0.033], { color: '#8a6440', noInk: true })
      .ball([0.008, 0.006, 0.004], [0.02, 0.025, 0.033], { color: '#8a6440', noInk: true })
      .ball([0.008, 0.006, 0.004], [-0.035, 0.022, 0.028], { color: '#8a6440', noInk: true })
      .done(),
  ),
  e('potato chips', 'food', 'snacks', () =>
    m('potato chips')
      .box([0.16, 0.22, 0.06], [0, 0.11, 0], { color: 'yellow', round: 0.8 })
      .box([0.16, 0.02, 0.014], [0, 0.222, 0], { color: 'gold' })
      .box([0.16, 0.016, 0.014], [0, 0.008, 0], { color: 'gold' })
      .label('CHIPS', [0.12, 0.04], [0, 0.16, 0.026], { color: 'red' })
      .ball([0.07, 0.05, 0.01], [0, 0.085, 0.03], { color: '#f2c86a', noInk: true })
      .ball([0.06, 0.012, 0.05], [0.07, 0.01, 0.07], { color: '#f2c86a', rot: [15, 0, 20] })
      .ball([0.055, 0.012, 0.045], [0.02, 0.015, 0.09], { color: '#e8b850', rot: [-20, 30, 0] })
      .done(),
  ),
  e('potato masher', 'kitchen', 'utensils', () => {
    const b = m('potato masher')
      .cyl([0.1, 0.014, 0.1], [0, 0.007, 0], { color: 'silver' })
      .rod([0.04, 0.012, 0], [0.012, 0.16, 0], 0.008, 'silver')
      .rod([-0.04, 0.012, 0], [-0.012, 0.16, 0], 0.008, 'silver')
      .capsule([0.035, 0.14, 0.035], [0, 0.23, 0], { color: 'red' });
    b.each(7, (i) => b.ball([0.012, 0.004, 0.012], [i ? Math.cos(i) * 0.03 : 0, 0.0145, i ? Math.sin(i) * 0.03 : 0], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('potato salad', 'food', 'salads', () => {
    const b = m('potato salad').cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: 'white', taper: 1.3 }).ball([0.24, 0.09, 0.24], [0, 0.08, 0], { color: '#f2e2a0' });
    b.each(8, (i) => b.box([0.03, 0.03, 0.03], [Math.cos(i * 0.8) * 0.06, 0.115 + (i % 2) * 0.005, Math.sin(i * 0.8) * 0.06], { color: i % 3 ? '#f6e8b0' : '#e8d080', rot: [i * 20, i * 35, 0] }));
    b.each(6, (i) => b.ball(0.01, [Math.cos(i * 1.4) * 0.04, 0.128, Math.sin(i * 1.4) * 0.04], { color: 'green', noInk: true }));
    return b.cyl([0.04, 0.008, 0.04], [0.02, 0.13, 0.03], { color: 'white', rot: [10, 0, 0] }).cyl([0.018, 0.009, 0.018], [0.02, 0.131, 0.03], { color: 'yellow', rot: [10, 0, 0] }).done();
  }),
  e('potion', 'fantasy', 'magic items', () =>
    m('potion')
      .ball(0.12, [0, 0.06, 0], { color: '#c050e0', glow: true })
      .ball(0.125, [0, 0.06, 0], { color: '#d890f0' })
      .ball([0.03, 0.04, 0.02], [-0.03, 0.08, 0.05], { color: 'white', noInk: true })
      .cyl([0.035, 0.06, 0.035], [0, 0.14, 0], { color: '#d890f0' })
      .cyl([0.04, 0.03, 0.04], [0, 0.18, 0], { color: 'wood', taper: 1.2 })
      .heart(0.045, [0.03, 0.05, 0.062], { color: 'pink' })
      .done(),
  ),
  e('potpourri', 'home', 'decor', () => {
    const b = m('potpourri').cyl([0.2, 0.06, 0.2], [0, 0.03, 0], { color: 'skyblue', taper: 1.4 }).ball([0.26, 0.06, 0.26], [0, 0.06, 0], { color: '#c88a9a' });
    const cs = ['red', 'pink', 'purple', 'orange', 'magenta', 'yellow'];
    b.each(9, (i) => b.ball([0.035, 0.008, 0.025], [Math.cos(i * 2.39) * 0.07 * Math.sqrt(i / 9), 0.09, Math.sin(i * 2.39) * 0.07 * Math.sqrt(i / 9)], { color: cs[i % 6], rot: [i * 10, i * 40, 0] }));
    return b.capsule([0.015, 0.1, 0.015], [-0.04, 0.095, 0.02], { color: '#8a4a20', rot: [0, 30, 80] }).ball([0.04, 0.05, 0.04], [0.05, 0.1, -0.02], { color: 'darkbrown' }).star(0.03, [0.0, 0.1, 0.06], { color: '#8a5a2b', round: 0.008 }).done();
  }),
  e('potted plant', 'home', 'houseplants', () => {
    const b = m('potted plant').cyl([0.22, 0.2, 0.22], [0, 0.1, 0], { color: '#c8693e', taper: 1.25 }).cyl([0.29, 0.04, 0.29], [0, 0.2, 0], { color: '#b85a30' }).ball([0.25, 0.03, 0.25], [0, 0.215, 0], { color: 'dirt' });
    b.each(7, (i) => spoke(b, [0, 0.22, 0], (i / 7) * 360, 35 + (i % 2) * 15, 0.22, 0.02, 0.11, i % 2 ? 'leaf' : 'darkgreen'));
    return b.ball([0.08, 0.16, 0.05], [0, 0.36, 0], { color: 'leaf' }).done();
  }),
  e('pottery', 'home', 'decor', () =>
    m('pottery')
      .ball([0.17, 0.2, 0.17], [0, 0.11, 0], { color: '#c87a4a' })
      .cyl([0.12, 0.03, 0.12], [0, 0.015, 0], { color: '#c87a4a' })
      .cyl([0.06, 0.08, 0.06], [0, 0.24, 0], { color: '#c87a4a', taper: 1.4 })
      .torus([0.09, 0.09, 0.02], [0, 0.28, 0], { color: '#c87a4a', rot: [90, 0, 0], tube: 0.2 })
      .torus([0.175, 0.175, 0.03], [0, 0.13, 0], { color: 'black', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([0.07, 0.08, 0.015], [0.085, 0.19, 0], { color: '#c87a4a', rot: [0, 90, 0], tube: 0.22 })
      .torus([0.07, 0.08, 0.015], [-0.085, 0.19, 0], { color: '#c87a4a', rot: [0, 90, 0], tube: 0.22 })
      .cyl([0.1, 0.05, 0.1], [0.15, 0.025, 0.08], { color: '#b86a3a', taper: 1.3 })
      .done(),
  ),
  e('power boat', 'garage', 'boats', () =>
    m('power boat', { view: 'side' })
      .box([1.8, 0.6, 4.0], [0, 0.4, -0.4], { color: 'white', round: 0.4 })
      .wedge([1.8, 1.6, 0.6], [0, 0.4, 2.4], { color: 'white', rot: [90, 0, 0] })
      .box([1.84, 0.12, 3.8], [0, 0.48, -0.3], { color: 'red', noInk: true })
      .box([1.5, 0.35, 0.08], [0, 0.85, 0.7], { color: 'glass', rot: [-30, 0, 0] })
      .box([1.4, 0.3, 0.5], [0, 0.8, -0.4], { color: 'cream' })
      .box([0.35, 0.6, 0.35], [0, 0.8, -2.5], { color: 'black', round: 0.3 })
      .stick([0, 0.5, -2.55], [0, 0.0, -2.6], 0.08, 'darkgray')
      .done(),
  ),
  e('power lines', 'places', 'street things', () => {
    const b = m('power lines');
    const ins: number[] = [-1.0, 0, 1.0];
    for (const x of [-4, 4]) {
      b.stick([x, 0, 0], [x, 9, 0], 0.3, 'darkwood').box([0.15, 0.15, 2.4], [x, 8.4, 0], { color: 'darkwood' });
      for (const z of ins) b.cyl([0.12, 0.25, 0.12], [x, 8.6, z], { color: 'white' });
    }
    for (const z of ins) b.rod([-4, 8.75, z], [0, 7.9, z], 0.04, 'black').rod([0, 7.9, z], [4, 8.75, z], 0.04, 'black');
    return b.cyl([0.7, 1.0, 0.7], [-3.55, 6.5, 0], { color: 'gray' }).done();
  }),
  e('power plant', 'places', 'industry', () => {
    const b = m('power plant').box([12, 0.2, 7], [0, 0.1, 0], { color: 'stone' }).box([5, 3, 3.5], [-3, 1.6, 1.2], { color: 'lightgray' });
    b.label('POWER', [2.4, 0.6], [-3, 2.2, 2.97], { color: 'yellow' });
    for (const [x, z] of [[2.0, -0.8], [4.6, 0.6]]) {
      b.cyl([3, 3, 3], [x, 1.7, z], { color: '#d8d8d0', taper: 0.65 }).cyl([1.95, 2, 1.95], [x, 4.2, z], { color: '#d8d8d0', taper: 1.25 });
      b.ball([2.2, 1.4, 2.2], [x, 6.0, z], { color: 'white' }).ball([1.6, 1.1, 1.6], [x + 0.6, 7.0, z], { color: 'white' });
    }
    return b.cyl([0.7, 8, 0.7], [-4.5, 4.2, -1.8], { color: 'red', taper: 0.8 }).cyl([0.66, 0.6, 0.66], [-4.5, 6.5, -1.8], { color: 'white', noInk: true }).done();
  }),
  e('oven mitts', 'kitchen', 'kitchen supplies', () => {
    const b = m('oven mitts');
    b.pair((s) => {
      const x = s * 0.08;
      b.box([0.12, 0.17, 0.05], [x, 0.135, 0], { color: 'red', round: 0.9 })
        .ball([0.05, 0.08, 0.045], [x + s * 0.065, 0.12, 0], { color: 'red', rot: [0, 0, s * -30] })
        .box([0.13, 0.05, 0.055], [x, 0.025, 0], { color: 'white', round: 0.4 })
        .torus([0.03, 0.03, 0.008], [x, 0.235, 0], { color: 'white', tube: 0.25 });
      b.each(3, (i) => b.box([0.1, 0.004, 0.004], [x, 0.09 + i * 0.045, 0.026], { color: 'darkred', noInk: true }));
    });
    return b.done();
  }),
  e('power supply', 'tech', 'computer parts', () => {
    const b = m('power supply')
      .box([0.15, 0.086, 0.14], [0, 0.043, 0], { color: 'steel' })
      .cyl([0.075, 0.006, 0.075], [0, 0.044, 0.07], { color: 'darkgray', rot: [90, 0, 0], name: 'fan' })
      .torus([0.075, 0.075, 0.006], [0, 0.044, 0.074], { color: 'silver', tube: 0.1 })
      .torus([0.045, 0.045, 0.006], [0, 0.044, 0.074], { color: 'silver', tube: 0.15 })
      .box([0.03, 0.022, 0.01], [0.05, 0.025, 0.072], { color: 'black' })
      .box([0.012, 0.01, 0.01], [-0.05, 0.075, 0.072], { color: 'red' });
    b.each(4, (i) => b.box([0.06, 0.012, 0.004], [0, 0.044, 0.073], { color: 'gray', rot: [0, 0, i * 45], parent: 'fan' }));
    const cs = ['yellow', 'red', 'black', 'black'];
    b.each(4, (i) => b.rod([-0.075, 0.06 - i * 0.008, -0.03 + i * 0.01], [-0.15, 0.008, 0.02 + i * 0.012], 0.007, cs[i]));
    return b.box([0.03, 0.014, 0.06], [-0.16, 0.007, 0.04], { color: 'white' }).done();
  }),
  e('pretzel', 'food', 'bakery', () =>
    m('pretzel')
      .torus([0.13, 0.1, 0.024], [0, 0.052, 0], { color: 'crust', tube: 0.2 })
      .rod([-0.045, 0.01, 0.012], [0.03, 0.075, 0.012], 0.022, 'crust')
      .rod([0.045, 0.01, 0.014], [-0.03, 0.075, 0.014], 0.022, '#a8642a')
      .box([0.006, 0.006, 0.004], [-0.03, 0.09, 0.012], { color: 'white', noInk: true })
      .box([0.006, 0.006, 0.004], [0.035, 0.085, 0.012], { color: 'white', noInk: true })
      .box([0.006, 0.006, 0.004], [0.0, 0.045, 0.026], { color: 'white', noInk: true })
      .box([0.006, 0.006, 0.004], [-0.05, 0.04, 0.012], { color: 'white', noInk: true })
      .done(),
  ),
  e('printer', 'tech', 'office machines', () =>
    m('printer')
      .box([0.45, 0.2, 0.35], [0, 0.1, 0], { color: 'lightgray', round: 0.15 })
      .box([0.43, 0.03, 0.33], [0, 0.205, 0], { color: 'darkgray', round: 0.2 })
      .box([0.3, 0.012, 0.18], [0, 0.27, -0.2], { color: 'gray', rot: [-55, 0, 0] })
      .box([0.21, 0.01, 0.2], [0, 0.29, -0.17], { color: 'white', rot: [-60, 0, 0] })
      .box([0.3, 0.012, 0.14], [0, 0.06, 0.22], { color: 'gray' })
      .box([0.21, 0.006, 0.15], [0, 0.07, 0.22], { color: 'white' })
      .box([0.08, 0.04, 0.01], [0.15, 0.2, 0.17], { color: '#7fc8ff', glow: true, rot: [-30, 0, 0] })
      .ball(0.02, [0.15, 0.16, 0.176], { color: 'lime', glow: true })
      .done(),
  ),
  e('printing press', 'tech', 'machines', () => {
    const b = m('printing press');
    b.pair((s) => b.box([0.15, 2.0, 0.15], [s * 0.6, 1.0, 0], { color: 'darkwood' }));
    b.box([1.5, 0.2, 0.25], [0, 2.0, 0], { color: 'darkwood' }).box([1.35, 0.15, 0.2], [0, 1.4, 0], { color: 'darkwood' });
    b.cyl([0.12, 0.5, 0.12], [0, 1.15, 0], { color: 'iron' });
    b.each(4, (i) => b.torus([0.15, 0.15, 0.03], [0, 0.95 + i * 0.1, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.25 }));
    b.box([0.7, 0.08, 0.5], [0, 0.86, 0], { color: 'wood' });
    b.box([1.2, 0.12, 1.4], [0, 0.66, 0.35], { color: 'darkwood' }).box([0.5, 0.01, 0.6], [0, 0.725, 0.55], { color: 'paper' });
    b.each(4, (i) => b.box([0.36, 0.004, 0.02], [0, 0.732, 0.35 + i * 0.1], { color: 'black', noInk: true }));
    for (const [x, z] of [[0.55, 1.0], [-0.55, 1.0]]) b.stick([x, 0, z], [x, 0.6, z], 0.1, 'darkwood');
    return b.rod([0, 1.25, 0], [0.75, 1.3, 0.35], 0.05, 'iron', { name: 'crank', pivot: [0, 1.25, 0] }).ball(0.08, [0.77, 1.3, 0.36], { color: 'darkwood', parent: 'crank' }).done();
  }),
  e('prison', 'places', 'civic buildings', () => {
    const b = bldg('prison', { w: 8, h: 6, d: 5, wall: 'gray', roof: 'darkgray', sign: 'PRISON', signColor: 'white', win: '#2a2726', door: 'steel' });
    for (const [x, y] of [[-3, 1.4], [3, 1.4], [-3, 4.6], [-1, 4.6], [1, 4.6], [3, 4.6]]) b.each(3, (i) => b.stick([x - 0.25 + i * 0.25, y - 0.55, 2.6], [x - 0.25 + i * 0.25, y + 0.55, 2.6], 0.06, 'silver'));
    for (const [x, z] of [[3.1, -1.7], [4.3, -1.7], [3.1, -2.9], [4.3, -2.9]]) b.stick([x, 0, z], [x, 7.0, z], 0.2, 'darkgray');
    return b
      .box([1.8, 1.2, 1.8], [3.7, 7.5, -2.3], { color: 'lightgray' })
      .box([1.6, 0.5, 0.06], [3.7, 7.6, -1.38], { color: 'glass' })
      .cone([2.4, 0.9, 2.4], [3.7, 8.55, -2.3], { color: 'darkgray' })
      .ball(0.35, [3.7, 7.0, -1.3], { color: 'yellow', glow: true })
      .done();
  }),
  e('prison uniform', 'wardrobe', 'uniforms', () => who('prison uniform', { top: 'orange', bottom: 'orange', shoes: 'white', long: true, acc: [wear('badge', 'white'), held('ball', 'black')] })),
  e('projector', 'tech', 'audio video', () =>
    m('projector')
      .box([0.22, 0.04, 0.3], [0, 0.02, 0], { color: 'black' })
      .box([0.2, 0.18, 0.32], [0, 0.13, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.09, 0.1, 0.09], [0, 0.14, 0.2], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.07, 0.01, 0.07], [0, 0.14, 0.25], { color: '#ffe9a0', rot: [90, 0, 0], glow: true })
      .stick([0, 0.22, 0.08], [0, 0.3, 0.1], 0.03, 'black')
      .stick([0, 0.22, -0.08], [0, 0.3, -0.12], 0.03, 'black')
      .cyl([0.22, 0.03, 0.22], [0, 0.38, 0.1], { color: 'silver', rot: [0, 0, 90], name: 'fan' })
      .cyl([0.2, 0.03, 0.2], [0, 0.37, -0.13], { color: 'silver', rot: [0, 0, 90] })
      .done(),
  ),
  e('projector screen', 'tech', 'audio video', () => {
    const b = m('projector screen').stick([0, 0.3, 0], [0, 2.05, -0.05], 0.04, 'darkgray');
    for (const a of [90, 210, 330]) {
      const r = (a * Math.PI) / 180;
      b.rod([0, 0.35, 0], [Math.cos(r) * 0.45, 0, Math.sin(r) * 0.45 - 0.1], 0.03, 'darkgray');
    }
    return b
      .cyl([0.16, 1.7, 0.16], [0, 2.1, 0.02], { color: 'darkgray', rot: [0, 0, 90] })
      .box([1.55, 1.2, 0.02], [0, 1.43, 0.05], { color: 'white' })
      .box([1.55, 0.05, 0.03], [0, 0.83, 0.05], { color: 'black' })
      .done();
  }),
  e('propane tank', 'workshop', 'drums and tanks', () =>
    m('propane tank')
      .cyl([0.26, 0.06, 0.26], [0, 0.03, 0], { color: 'white' })
      .ball([0.32, 0.16, 0.32], [0, 0.1, 0], { color: 'white' })
      .cyl([0.32, 0.34, 0.32], [0, 0.27, 0], { color: 'white' })
      .ball([0.32, 0.16, 0.32], [0, 0.44, 0], { color: 'white' })
      .cyl([0.24, 0.12, 0.24], [0, 0.56, 0], { color: 'white', taper: 1.05 })
      .box([0.08, 0.04, 0.02], [0, 0.58, 0.118], { color: 'darkgray', noInk: true })
      .cyl([0.04, 0.06, 0.04], [0, 0.55, 0], { color: 'brass' })
      .cyl([0.08, 0.015, 0.08], [0, 0.59, 0], { color: 'green' })
      .label('PROPANE', [0.18, 0.06], [0, 0.3, 0.155], { color: 'red' })
      .done(),
  ),
  e('propeller', 'garage', 'aircraft parts', () => {
    const b = m('propeller')
      .box([0.6, 0.12, 0.5], [0, 0.06, 0], { color: 'darkgray' })
      .stick([0, 0.12, -0.05], [0, 1.05, -0.05], 0.14, 'gray')
      .cyl([0.25, 0.22, 0.25], [0, 1.1, 0.08], { color: 'silver', rot: [90, 0, 0], name: 'fan' })
      .cone([0.25, 0.25, 0.25], [0, 1.1, 0.32], { color: 'red', rot: [90, 0, 0], parent: 'fan' });
    b.each(3, (i) => {
      const a = (i * 120 * Math.PI) / 180;
      b.box([0.16, 0.8, 0.04], [Math.sin(a) * 0.5, 1.1 + Math.cos(a) * 0.5, 0.12], { color: 'darkgray', rot: [0, 0, -i * 120], round: 0.8, parent: 'fan' });
      b.box([0.15, 0.12, 0.05], [Math.sin(a) * 0.85, 1.1 + Math.cos(a) * 0.85, 0.12], { color: 'yellow', rot: [0, 0, -i * 120], round: 0.6, parent: 'fan' });
    });
    return b.done();
  }),
  e('protest sign', 'ideas', 'signs', () =>
    m('protest sign')
      .box([0.25, 0.12, 0.2], [0, 0.06, 0], { color: 'stone' })
      .stick([0, 0.1, 0], [0, 1.15, 0], 0.035, 'wood')
      .box([0.7, 0.5, 0.025], [0, 1.0, 0.03], { color: 'white' })
      .label('NO!', [0.5, 0.28], [0, 1.02, 0.045], { color: 'white' })
      .done(),
  ),
  e('protractor', 'study', 'math tools', () => {
    const b = fan(m('protractor'), 18, 0.1, 0, 0.018, 0, 0.006, '#e8f070', { start: 10, count: 9 }).box([0.21, 0.02, 0.016], [0, 0.01, 0], { color: '#d8e060' });
    b.each(9, (i) => {
      const a = ((i * 22.5) * Math.PI) / 180;
      b.box([0.004, 0.015, 0.004], [Math.cos(a) * 0.085, 0.018 + Math.sin(a) * 0.085, 0.004], { color: 'black', rot: [0, 0, i * 22.5 - 90], noInk: true });
    });
    return b.torus([0.016, 0.016, 0.004], [0, 0.026, 0.004], { color: 'black', tube: 0.2, noInk: true }).done();
  }),
  e('public address system', 'music', 'audio', () =>
    m('public address system')
      .box([0.3, 0.45, 0.25], [0, 0.225, 0], { color: 'black', round: 0.1 })
      .cyl([0.22, 0.02, 0.22], [0, 0.17, 0.125], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.07, 0.03, 0.07], [0, 0.17, 0.13], { color: 'gray', rot: [90, 0, 0] })
      .box([0.18, 0.08, 0.02], [0, 0.37, 0.125], { color: 'darkgray' })
      .cyl([0.12, 0.02, 0.12], [0.3, 0.01, 0.05], { color: 'black' })
      .stick([0.3, 0.02, 0.05], [0.3, 0.4, 0.05], 0.015, 'silver')
      .capsule([0.04, 0.09, 0.04], [0.3, 0.44, 0.07], { color: 'black', rot: [-30, 0, 0] })
      .ball(0.05, [0.3, 0.49, 0.1], { color: 'darkgray' })
      .done(),
  ),
  e('pudding', 'food', 'desserts', () =>
    plate(m('pudding'), 0.18)
      .cyl([0.12, 0.07, 0.12], [0, 0.046, 0], { color: '#f6d880', taper: 0.8 })
      .cyl([0.098, 0.012, 0.098], [0, 0.085, 0], { color: '#8a4a1a' })
      .capsule([0.02, 0.03, 0.01], [0.03, 0.07, 0.042], { color: '#8a4a1a', noInk: true })
      .capsule([0.02, 0.025, 0.01], [-0.03, 0.072, 0.04], { color: '#8a4a1a', noInk: true })
      .ball([0.04, 0.03, 0.04], [0, 0.1, 0], { color: 'white' })
      .ball(0.025, [0, 0.125, 0], { color: 'red' })
      .done(),
  ),
  e('puddle', 'nature', 'puddles', () =>
    m('puddle')
      .ball([0.5, 0.02, 0.35], [0, 0.01, 0], { color: 'water' })
      .torus([0.2, 0.14, 0.006], [0.1, 0.02, 0.04], { color: 'skyblue', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([0.12, 0.09, 0.006], [-0.12, 0.02, -0.05], { color: 'skyblue', rot: [90, 0, 0], tube: 0.08, noInk: true })
      .box([0.1, 0.035, 0.05], [0.0, 0.035, 0.0], { color: 'white', round: 0.1 })
      .wedge([0.03, 0.035, 0.05], [0.065, 0.035, 0], { color: 'white', apex: -0.5, rot: [0, 0, 180] })
      .wedge([0.03, 0.035, 0.05], [-0.065, 0.035, 0], { color: 'white', apex: 0.5, rot: [0, 0, 180] })
      .wedge([0.09, 0.06, 0.006], [0, 0.082, 0], { color: 'white' })
      .done(),
  ),
  e('pulley', 'workshop', 'hardware', () =>
    m('pulley')
      .stick([0.13, 0, -0.03], [0.13, 0.32, -0.03], 0.03, 'wood')
      .stick([-0.13, 0, -0.03], [-0.13, 0.32, -0.03], 0.03, 'wood')
      .box([0.32, 0.04, 0.05], [0, 0.33, -0.03], { color: 'wood' })
      .torus([0.03, 0.04, 0.008], [0, 0.29, 0], { color: 'steel', tube: 0.25 })
      .box([0.012, 0.11, 0.03], [0.047, 0.2, 0], { color: 'red' })
      .box([0.012, 0.11, 0.03], [-0.047, 0.2, 0], { color: 'red' })
      .box([0.106, 0.015, 0.03], [0, 0.26, 0], { color: 'red' })
      .cyl([0.08, 0.022, 0.08], [0, 0.19, 0], { color: 'steel', rot: [90, 0, 0], name: 'wheel' })
      .stick([0.04, 0.19, 0.0], [0.04, 0.06, 0.0], 0.008, 'tan')
      .stick([-0.04, 0.19, 0.0], [-0.04, 0.01, 0.0], 0.008, 'tan')
      .box([0.05, 0.05, 0.05], [0.04, 0.035, 0], { color: 'iron' })
      .done(),
  ),
  e('pump', 'garden', 'garden things', () =>
    m('pump')
      .box([0.25, 0.08, 0.25], [0, 0.04, 0], { color: 'stone' })
      .cyl([0.12, 0.45, 0.12], [0, 0.3, 0], { color: 'darkgreen' })
      .ball([0.13, 0.08, 0.13], [0, 0.53, 0], { color: 'darkgreen' })
      .rod([0, 0.4, 0.05], [0, 0.38, 0.2], 0.05, 'darkgreen')
      .rod([0, 0.38, 0.2], [0, 0.33, 0.22], 0.045, 'darkgreen')
      .rod([0, 0.56, -0.03], [0, 0.78, -0.33], 0.035, 'darkgreen', { name: 'crank', pivot: [0, 0.56, -0.03] })
      .cyl([0.16, 0.14, 0.16], [0, 0.07, 0.26], { color: 'steel', taper: 1.2 })
      .done(),
  ),
  e('pumpkin', 'food', 'vegetables', () => {
    const b = m('pumpkin').ball([0.24, 0.22, 0.24], [0, 0.11, 0], { color: 'orange' });
    b.each(8, (i) => spoke(b, [0, 0.12, 0], i * 45 + 22, 0, 0.17, 0.23, 0.13, i % 2 ? 'orange' : '#e8822b'));
    return b.rod([0, 0.21, 0], [0.02, 0.28, 0], 0.035, 'darkgreen').ball([0.1, 0.012, 0.06], [-0.06, 0.225, 0.02], { color: 'leaf', rot: [0, 30, -15] }).done();
  }),
  e('pumpkin pie', 'food', 'desserts', () => {
    const b = m('pumpkin pie')
      .cyl([0.22, 0.04, 0.22], [0, 0.02, 0], { color: 'silver', taper: 1.15 })
      .cyl([0.22, 0.012, 0.22], [0, 0.044, 0], { color: '#d8822b' });
    b.each(14, (i) => b.ball([0.035, 0.022, 0.03], [Math.cos(i * 0.449) * 0.118, 0.048, Math.sin(i * 0.449) * 0.118], { color: 'crust' }));
    return b.ball([0.06, 0.04, 0.06], [0, 0.065, 0], { color: 'white' }).cone([0.03, 0.03, 0.03], [0, 0.095, 0], { color: 'white' }).done();
  }),
  e('punching bag', 'sports', 'gym', () =>
    m('punching bag')
      .cyl([0.5, 0.2, 0.5], [0, 0.1, 0], { color: 'black' })
      .cyl([0.14, 0.25, 0.14], [0, 0.32, 0], { color: 'darkgray' })
      .capsule([0.4, 0.95, 0.4], [0, 0.92, 0], { color: 'red' })
      .cyl([0.405, 0.1, 0.405], [0, 0.95, 0], { color: 'white', noInk: true })
      .ball([0.3, 0.08, 0.3], [0, 1.39, 0], { color: 'black' })
      .done(),
  ),
  e('purse', 'wardrobe', 'bags', () =>
    m('purse')
      .torus([0.16, 0.16, 0.022], [0, 0.17, 0], { color: 'darkred', tube: 0.15 })
      .box([0.26, 0.18, 0.1], [0, 0.09, 0], { color: 'red', round: 0.35 })
      .box([0.262, 0.08, 0.02], [0, 0.15, 0.045], { color: 'darkred', round: 0.4 })
      .ball(0.025, [0, 0.115, 0.058], { color: 'gold' })
      .done(),
  ),
  e('push broom', 'home', 'cleaning', () =>
    m('push broom')
      .box([0.62, 0.11, 0.11], [0, 0.055, 0], { color: 'darkgray', round: 0.15 })
      .box([0.64, 0.06, 0.1], [0, 0.14, 0], { color: 'wood' })
      .stick([0, 0.15, 0], [0, 1.45, -0.45], 0.035, 'lightwood')
      .rod([0.2, 0.16, 0], [0, 0.45, -0.1], 0.015, 'silver')
      .rod([-0.2, 0.16, 0], [0, 0.45, -0.1], 0.015, 'silver')
      .done(),
  ),
  e('putty', 'workshop', 'materials', () =>
    m('putty')
      .cyl([0.12, 0.08, 0.12], [0, 0.04, 0], { color: 'white' })
      .label('PUTTY', [0.08, 0.03], [0, 0.04, 0.056], { color: 'blue' })
      .ball([0.11, 0.05, 0.11], [0, 0.08, 0], { color: '#c8c0a8' })
      .cyl([0.13, 0.015, 0.13], [-0.1, 0.06, -0.04], { color: 'blue', rot: [0, 0, 70] })
      .box([0.06, 0.004, 0.07], [0.09, 0.04, 0.03], { color: 'silver', rot: [0, 0, 60] })
      .capsule([0.025, 0.08, 0.025], [0.13, 0.11, 0.03], { color: 'wood', rot: [0, 0, -30] })
      .done(),
  ),
  e('pyramid (landmark)', 'places', 'landmarks', () => {
    const b = m('pyramid (landmark)').box([5.5, 0.1, 4.5], [0, 0.05, 0], { color: 'sand' });
    pyramid(b, 0, 0, 0.1, 4, 2.8, '#e2c27a', 0.1);
    pyramid(b, -2.0, -1.4, 0.1, 1.6, 1.1, '#d9b870', 0.06);
    return b.rod([2.4, 0.1, 1.5], [2.5, 1.6, 1.5], 0.12, 'bark').ball([1.0, 0.2, 1.0], [2.5, 1.7, 1.5], { color: 'leaf' }).done();
  }),
  e('pyramid (shape)', 'ideas', 'shapes', () => pyramid(plinth(m('pyramid (shape)'), 0.2), 0, 0, 0.03, 0.16, 0.13, 'yellow', 0.012).done()),
  e('rabbits foot', 'toys', 'lucky charms', () =>
    m('rabbits foot')
      .capsule([0.04, 0.08, 0.035], [0, 0.05, 0], { color: 'white' })
      .ball([0.045, 0.03, 0.05], [0, 0.018, 0.01], { color: 'white' })
      .ball([0.012, 0.01, 0.008], [-0.012, 0.012, 0.035], { color: 'pink', noInk: true })
      .ball([0.012, 0.01, 0.008], [0.012, 0.012, 0.035], { color: 'pink', noInk: true })
      .cyl([0.034, 0.02, 0.034], [0, 0.1, 0], { color: 'gold' })
      .torus([0.012, 0.012, 0.004], [0, 0.116, 0], { color: 'gold', tube: 0.3 })
      .torus([0.03, 0.03, 0.004], [0, 0.14, 0], { color: 'silver', rot: [0, 60, 0], tube: 0.15 })
      .done(),
  ),
  e('race car', 'garage', 'cars', () => {
    const b = m('race car', { view: 'side' })
      .box([0.9, 0.36, 3.2], [0, 0.36, -0.1], { color: 'red', round: 0.5 })
      .cone([0.6, 1.1, 0.34], [0, 0.32, 1.95], { color: 'red', rot: [90, 0, 0] })
      .box([1.6, 0.3, 1.2], [0, 0.34, -0.3], { color: 'red', round: 0.5 })
      .box([1.9, 0.05, 0.4], [0, 0.14, 2.35], { color: 'black' })
      .box([1.3, 0.08, 0.38], [0, 0.95, -1.75], { color: 'black' })
      .stick([0.3, 0.5, -1.7], [0.3, 0.92, -1.75], 0.05, 'black')
      .stick([-0.3, 0.5, -1.7], [-0.3, 0.92, -1.75], 0.05, 'black')
      .ball([0.36, 0.3, 0.36], [0, 0.62, -0.2], { color: 'yellow' })
      .box([0.3, 0.08, 0.04], [0, 0.63, -0.03], { color: 'black' })
      .label('1', [0.05, 0.28], [0.81, 0.36, -0.3], { color: 'white', rot: [0, 90, 0] });
    for (const [x, z, d] of [[0.85, 1.3, 0.6], [-0.85, 1.3, 0.6], [0.88, -1.25, 0.7], [-0.88, -1.25, 0.7]]) b.cyl([d, 0.4, d], [x, d / 2, z], { color: 'rubber', rot: [0, 0, 90] });
    return b.done();
  }),
  e('rack', 'home', 'storage', () => {
    const b = m('rack');
    for (const [x, z] of [[0.45, 0.2], [-0.45, 0.2], [0.45, -0.2], [-0.45, -0.2]]) b.stick([x, 0, z], [x, 1.8, z], 0.04, 'steel');
    b.each(4, (i) => b.box([0.95, 0.03, 0.44], [0, 0.12 + i * 0.52, 0], { color: 'silver' }));
    return b
      .box([0.3, 0.25, 0.3], [-0.2, 0.27, 0], { color: '#c8955a' })
      .box([0.3, 0.2, 0.3], [0.22, 0.24, 0], { color: 'blue' })
      .cyl([0.12, 0.2, 0.12], [-0.25, 0.75, 0], { color: 'red' })
      .cyl([0.12, 0.16, 0.12], [-0.08, 0.73, 0], { color: 'yellow' })
      .box([0.35, 0.3, 0.3], [0.2, 0.8, 0], { color: 'green' })
      .box([0.5, 0.15, 0.3], [0, 1.24, 0], { color: 'white' })
      .done();
  }),
  e('racket', 'sports', 'rackets', () => {
    const b = m('racket').torus([0.26, 0.32, 0.022], [0, 0.5, 0], { color: 'blue', tube: 0.1 });
    b.each(5, (i) => b.stick([-0.08 + i * 0.04, 0.37, 0], [-0.08 + i * 0.04, 0.63, 0], 0.004, 'lightgray', { noInk: true }));
    b.each(6, (i) => b.stick([-0.1, 0.39 + i * 0.044, 0], [0.1, 0.39 + i * 0.044, 0], 0.004, 'lightgray', { noInk: true }));
    return b
      .rod([0.06, 0.35, 0], [0, 0.27, 0], 0.02, 'blue')
      .rod([-0.06, 0.35, 0], [0, 0.27, 0], 0.02, 'blue')
      .cyl([0.032, 0.25, 0.032], [0, 0.14, 0], { color: 'black' })
      .ball(0.067, [0.14, 0.034, 0.06], { color: 'lime' })
      .done();
  }),
  e('radar', 'tech', 'antennas', () =>
    m('radar')
      .cyl([0.22, 0.06, 0.22], [0, 0.03, 0], { color: 'gray' })
      .cyl([0.08, 0.15, 0.08], [0, 0.13, 0], { color: 'darkgray' })
      .box([0.12, 0.08, 0.12], [0, 0.24, 0], { color: 'gray', name: 'rotor' })
      .stick([0, 0.27, -0.02], [0, 0.38, -0.03], 0.04, 'gray', { parent: 'rotor' })
      .ball([0.38, 0.38, 0.07], [0, 0.42, 0.0], { color: 'white', rot: [-25, 0, 0], parent: 'rotor' })
      .ball([0.3, 0.3, 0.03], [0, 0.425, 0.03], { color: 'lightgray', rot: [-25, 0, 0], noInk: true, parent: 'rotor' })
      .rod([0, 0.42, 0.03], [0, 0.48, 0.2], 0.014, 'silver', { parent: 'rotor' })
      .box([0.035, 0.035, 0.035], [0, 0.49, 0.21], { color: 'red', parent: 'rotor' })
      .done(),
  ),
  e('radar detector', 'garage', 'car gadgets', () =>
    m('radar detector')
      .box([0.11, 0.012, 0.06], [0, 0.006, 0], { color: 'darkgray' })
      .box([0.11, 0.035, 0.07], [0, 0.035, 0], { color: 'black', round: 0.3, rot: [-12, 0, 0] })
      .box([0.05, 0.014, 0.004], [-0.015, 0.04, 0.036], { color: 'red', glow: true, rot: [-12, 0, 0] })
      .ball(0.008, [0.03, 0.04, 0.036], { color: 'lime', glow: true })
      .ball(0.008, [0.043, 0.04, 0.035], { color: 'orange', glow: true })
      .done(),
  ),
  e('radioactive material sign', 'ideas', 'signs', () => {
    const b = m('radioactive material sign')
      .box([0.22, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' })
      .box([0.32, 0.32, 0.02], [0, 0.19, 0], { color: 'yellow' })
      .box([0.34, 0.34, 0.016], [0, 0.19, -0.004], { color: 'black' });
    for (const st of [90, 210, 330]) fan(b, 6, 0.13, 0, 0.19, 0.012, 0.006, 'black', { start: st, count: 1, noInk: true });
    return b.cyl([0.07, 0.006, 0.07], [0, 0.19, 0.016], { color: 'yellow', rot: [90, 0, 0], noInk: true }).cyl([0.045, 0.006, 0.045], [0, 0.19, 0.02], { color: 'black', rot: [90, 0, 0], noInk: true }).done();
  }),
  e('radish', 'food', 'vegetables', () => {
    const b = m('radish').ball([0.05, 0.048, 0.05], [0, 0.052, 0], { color: 'red' }).cone([0.018, 0.035, 0.018], [0, 0.018, 0], { color: 'white', rot: [180, 0, 0] });
    b.each(3, (i) => spoke(b, [0, 0.075, 0], i * 120 + 30, 65, 0.09, 0.012, 0.04, 'leaf'));
    return b.done();
  }),
  e('raffle ticket', 'toys', 'party', () =>
    m('raffle ticket')
      .box([0.13, 0.015, 0.05], [0, 0.0075, 0], { color: 'darkwood' })
      .box([0.12, 0.004, 0.055], [0.01, 0.017, -0.035], { color: 'orange', rot: [0, 15, 0] })
      .label('RAFFLE 042', [0.11, 0.055], [0, 0.045, 0.0], { color: 'red', rot: [-10, 0, 0] })
      .box([0.003, 0.05, 0.004], [0.03, 0.045, 0.011], { color: 'white', noInk: true, rot: [-10, 0, 0] })
      .done(),
  ),
  // BATCH
];
