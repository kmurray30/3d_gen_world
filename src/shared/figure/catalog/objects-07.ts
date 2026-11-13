/** Catalog chunk objects-07: the words in assign/objects-07.tsv. Everything at its real size beside a 1.7 m person. */
import { e, type CatalogEntry } from './types';
import { A, m, withAct, type M, type PartOpts } from '../dsl';
import { col } from '../dsl';
import { hat, held, wear, who, type Extra } from '../accessories';
import type { Vec3 } from '../types';

/* ----- local helpers ----- */

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Two slabs of a pitched roof over a w x d box whose walls end at y; ridge along z (gable ends front and back)
 *  or, with side, along x (eaves facing the front). The gable triangles are filled in the wall colour. */
function gable(b: M, w: number, d: number, y: number, rh: number, o: { roof: string; wall: string; over?: number; side?: boolean; t?: number; cx?: number; cz?: number }): M {
  const ov = o.over ?? 0.45, t = o.t ?? 0.2, cx = o.cx ?? 0, cz = o.cz ?? 0;
  const span = o.side ? d : w, len = o.side ? w : d;
  const a = Math.atan2(rh, span / 2), L = Math.hypot(span / 2, rh) + ov;
  b.wedge(o.side ? [d, rh, w] : [w, rh, d], [cx, y + rh / 2, cz], { color: o.wall, rot: o.side ? [0, 90, 0] : undefined, round: 0 });
  for (const s of [1, -1]) {
    const u = s * (span / 4 + (ov / 2) * Math.cos(a) + (t / 2) * Math.sin(a));
    const v = y + rh / 2 - (ov / 2) * Math.sin(a) + (t / 2) * Math.cos(a);
    if (o.side) b.box([len + ov * 2, t, L], [cx, v, cz + u], { color: o.roof, rot: [s * deg(a), 0, 0], round: 0.1 });
    else b.box([L, t, len + ov * 2], [cx + u, v, cz], { color: o.roof, rot: [0, 0, -s * deg(a)], round: 0.1 });
  }
  return b.box(o.side ? [len + ov * 2, t * 1.2, t * 1.2] : [t * 1.2, t * 1.2, len + ov * 2], [cx, y + rh + t * 0.35, cz], { color: o.roof, round: 0.3 });
}

/** A framed window on a wall: frame, pane, sill. face 'front' (+z), 'back', 'left' (+x) or 'right' (-x); at is
 *  the pane's centre on that wall's plane. */
function win(b: M, at: Vec3, w: number, h: number, o: { face?: 'front' | 'left' | 'right' | 'back'; frame?: string; glass?: string; sill?: boolean; cross?: boolean; parent?: string; name?: string; light?: boolean } = {}): M {
  const f = o.face ?? 'front', fr = o.frame ?? 'white', gl = o.glass ?? 'glass';
  const n: Vec3 = f === 'front' ? [0, 0, 1] : f === 'back' ? [0, 0, -1] : f === 'left' ? [1, 0, 0] : [-1, 0, 0];
  const side = f === 'left' || f === 'right';
  const S = (a: number, b2: number, c: number): Vec3 => (side ? [c, b2, a] : [a, b2, c]);
  const P = (k: number, dy = 0): Vec3 => [at[0] + n[0] * k, at[1] + dy, at[2] + n[2] * k];
  b.box(S(w + 0.16, h + 0.16, 0.08), P(0.02), { color: fr, round: 0.15, parent: o.parent });
  b.box(S(w, h, 0.06), P(0.04), { color: gl, round: 0.05, parent: o.parent, ...(o.name ? { name: o.name } : {}), ...(o.light ? { mover: { kind: 'light' as const } } : {}) });
  if (o.cross) b.box(S(0.05, h, 0.04), P(0.075), { color: fr, round: 0.2, parent: o.parent }).box(S(w, 0.05, 0.04), P(0.075), { color: fr, round: 0.2, parent: o.parent });
  if (o.sill !== false) b.box(S(w + 0.3, 0.07, 0.18), P(0.07, -h / 2 - 0.1), { color: fr, round: 0.2, parent: o.parent });
  return b;
}

interface BOpts {
  w: number;
  d: number;
  floors?: number;
  /** storey height (3) */
  fh?: number;
  wall: string;
  trim?: string;
  base?: string;
  roof?: 'flat' | 'gable' | 'side';
  roofC?: string;
  roofH?: number;
  door?: string;
  dw?: number;
  double?: boolean;
  glassDoor?: boolean;
  doorX?: number;
  win?: string;
  cols?: number;
  ww?: number;
  wh?: number;
  cross?: boolean;
  /** ground floor shop windows either side of the door */
  shop?: boolean;
  awning?: string;
  sign?: string;
  signC?: string;
  /** side windows on the left and right walls (default on) */
  sides?: boolean;
  lamp?: boolean;
  /** windows that light up (a light mover named 'lights') */
  lit?: boolean;
}

/**
 * A building at real size: a plinth, walls (3 m storeys), framed windows with sills on the front and sides, a door
 * (or double doors) in a frame on a step that swings open on its hinge, a flat roof with a cornice or a pitched
 * roof with overhanging eaves, and optionally shop windows, an awning, a sign and a lamp by the door.
 */
function bld(key: string, o: BOpts): M {
  const fh = o.fh ?? 3, floors = o.floors ?? 1, H = floors * fh + 0.4, { w, d } = o, fz = d / 2;
  const trim = o.trim ?? 'white', dx = o.doorX ?? 0, dw = o.dw ?? (o.double ? 1.7 : 1.0);
  const b = m(key, { edge: 'sharp' })
    .box([w, H, d], [0, H / 2, 0], { color: o.wall, round: 0.02, name: 'walls' })
    .box([w + 0.14, 0.42, d + 0.14], [0, 0.21, 0], { color: o.base ?? '#8f8a82', round: 0.05 });
  for (let f = 1; f < floors; f++) b.box([w + 0.08, 0.16, d + 0.08], [0, 0.4 + f * fh, 0], { color: trim, round: 0.1 });
  const roof = o.roof ?? 'flat';
  if (roof === 'flat') {
    b.box([w + 0.34, 0.32, d + 0.34], [0, H + 0.1, 0], { color: trim, round: 0.08 });
    b.box([w - 0.2, 0.3, d - 0.2], [0, H + 0.3, 0], { color: o.roofC ?? '#6e6a66', round: 0.05 });
  } else gable(b, w, d, H, o.roofH ?? Math.min(w, d) * 0.38, { roof: o.roofC ?? 'darkred', wall: o.wall, side: roof === 'side' });
  // the door, in its frame, on a step
  const dz = fz + 0.05, dy = 0.42 + 1.05, dc = o.glassDoor ? 'glass' : o.door ?? 'darkwood';
  b.box([dw + 0.26, 2.25, 0.1], [dx, 0.42 + 1.11, fz + 0.02], { color: trim, round: 0.1 });
  b.box([dw + 0.9, 0.2, 0.7], [dx, 0.1, fz + 0.35], { color: o.base ?? '#8f8a82', round: 0.1 });
  if (o.double) {
    const lw = dw / 2 - 0.02;
    b.box([lw, 2.1, 0.06], [dx + dw / 4, dy, dz], { color: dc, round: 0.1, name: 'doorL', pivot: [dx + dw / 2, dy, dz], mover: { kind: 'swing', axis: 'y', amount: 95 } });
    b.box([lw, 2.1, 0.06], [dx - dw / 4, dy, dz], { color: dc, round: 0.1, name: 'doorR', pivot: [dx - dw / 2, dy, dz], mover: { kind: 'swing', axis: 'y', amount: -95 } });
    b.box([0.04, 0.5, 0.05], [dx + 0.08, 1.45, dz + 0.05], { color: 'silver', parent: 'doorL' }).box([0.04, 0.5, 0.05], [dx - 0.08, 1.45, dz + 0.05], { color: 'silver', parent: 'doorR' });
  } else {
    b.box([dw, 2.1, 0.06], [dx, dy, dz], { color: dc, round: 0.1, name: 'door', pivot: [dx - dw / 2, dy, dz], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    b.ball(0.07, [dx + dw / 2 - 0.12, 1.42, dz + 0.05], { color: 'brass', parent: 'door' });
    if (!o.glassDoor) b.box([dw * 0.6, 0.6, 0.02], [dx, dy + 0.45, dz + 0.035], { color: o.win ?? 'glass', round: 0.1, parent: 'door' });
  }
  if (o.lamp) b.box([0.16, 0.3, 0.16], [dx + dw / 2 + 0.45, 2.75, fz + 0.12], { color: '#fff3c0', name: 'lamp', mover: { kind: 'light', on: true }, round: 0.2 });
  // windows
  const ww = o.ww ?? 1.1, wh = o.wh ?? 1.35, cols = o.cols ?? Math.max(2, Math.round(w / 2.6));
  const wy = (f: number) => 0.42 + f * fh + 0.95 + wh / 2;
  let lit = 0;
  for (let f = o.shop ? 1 : 0; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (w / cols);
      if (f === 0 && Math.abs(x - dx) < dw / 2 + ww / 2 + 0.3) continue;
      win(b, [x, wy(f), fz], ww, wh, { frame: trim, glass: o.win, cross: o.cross, ...(o.lit && (f + c) % 2 === 0 ? { name: `lights${lit++}`, light: true } : {}) });
    }
  if (o.sides !== false) {
    const sc = Math.max(1, Math.round(d / 3.2));
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < sc; c++) {
        const z = (c - (sc - 1) / 2) * (d / sc);
        for (const s of [1, -1]) win(b, [s * (w / 2), wy(f), z], ww, wh, { face: s > 0 ? 'left' : 'right', frame: trim, glass: o.win, cross: o.cross });
      }
  }
  if (o.shop) {
    const sw = (w - dw - 1.6) / 2;
    if (sw > 0.8)
      for (const s of [1, -1]) {
        const x2 = dx + s * (dw / 2 + 0.4 + sw / 2);
        b.box([sw + 0.2, 2.3, 0.1], [x2, 0.42 + 1.55, fz + 0.02], { color: trim, round: 0.1 });
        b.box([sw, 2.1, 0.06], [x2, 0.42 + 1.55, fz + 0.06], { color: o.win ?? 'glass', round: 0.05 });
        b.box([sw + 0.3, 0.12, 0.25], [x2, 0.42 + 0.42, fz + 0.12], { color: trim, round: 0.2 });
      }
    if (o.awning) {
      b.box([w - 0.6, 0.08, 1.3], [0, 0.42 + 2.95, fz + 0.62], { color: o.awning, rot: [22, 0, 0], round: 0.2 });
      b.box([w - 0.6, 0.3, 0.04], [0, 0.42 + 2.55, fz + 1.22], { color: o.awning, round: 0.2 });
    }
  }
  if (o.sign) {
    const sy = o.shop ? 0.42 + Math.min(fh, 4.2) - 0.45 : 0.42 + 2.75;
    b.label(o.sign, [Math.min(w * 0.8, o.sign.length * 0.38 + 0.8), 0.62], [o.shop ? 0 : dx, sy, fz + 0.08], { color: o.signC ?? 'white', depth: 0.08 });
  }
  return b;
}

/** A wheel on its axle: a soft tyre (named wheel*, so it rolls) facing sideways, with a sharp hub on its outer face. */
function wheel(b: M, name: string, at: Vec3, dia: number, wd: number, o: { hub?: string; parent?: string; spokes?: boolean } = {}): M {
  const s = at[0] >= 0 ? 1 : -1;
  b.cyl([dia, wd, dia], at, { color: 'rubber', rot: [0, 0, 90], name, edge: 'soft', parent: o.parent });
  b.cyl([dia * 0.6, 0.02, dia * 0.6], [at[0] + s * wd * 0.5, at[1], at[2]], { color: o.hub ?? 'silver', rot: [0, 0, 90], parent: name, edge: 'sharp' });
  if (o.spokes) for (let i = 0; i < 3; i++) b.box([0.02, dia * 0.55, 0.05], [at[0] + s * (wd * 0.5 + 0.012), at[1], at[2]], { color: '#6e6a66', rot: [i * 60, 0, 0], parent: name, edge: 'sharp' });
  return b;
}

interface CarOpts {
  L?: number;
  W?: number;
  body: string;
  roof?: string;
  lower?: string;
  /** cabin length fraction and its offset (+ toward the nose) */
  cab?: number;
  cabZ?: number;
  doors?: 2 | 4;
  /** door panel colour (a police car's black doors), default the body's */
  doorC?: string;
  wheel?: number;
}

/**
 * A car at real size (side view, nose to +z): a moulded body (a loft), a glass cabin under a roof, doors that open
 * on their front hinges, headlights (a light mover), tail lights, bumpers, a grille, mirrors, four wheels on axles,
 * and seats (a 'seat' socket for the driver).
 */
function sedan(key: string, o: CarOpts): M {
  const L = o.L ?? 4.6, W = o.W ?? 1.8, wd = o.wheel ?? 0.66, cab = o.cab ?? 0.46, cz = o.cabZ ?? -0.04;
  const b = m(key, { view: 'side' })
    .loft([W, 0.74, L], [0, 0.66, 0], [[0, 0.88, 0.62, 0.08], [0.05, 0.97, 0.92, 0.02], [0.5, 1, 1, 0], [0.86, 0.98, 0.88, -0.04], [0.97, 0.92, 0.66, -0.1], [1, 0.8, 0.46, -0.14]], { color: o.body, boxy: 0.72, name: 'body' })
    .loft([W * 0.84, 0.56, L * cab], [0, 1.2, L * cz], [[0, 0.86, 0.5, -0.24], [0.12, 0.97, 0.94, -0.02], [0.62, 1, 1, 0], [0.98, 0.9, 0.36, -0.3], [1, 0.86, 0.2, -0.38]], { color: 'glass', boxy: 0.6, parent: 'body', edge: 'sharp' })
    .box([W * 0.78, 0.07, L * cab * 0.5], [0, 1.47, L * cz - L * cab * 0.06], { color: o.roof ?? o.body, round: 0.4, parent: 'body', edge: 'soft' })
    .box([W * 0.86, 0.36, 0.06], [0, 1.2, L * cz + 0.06], { color: o.roof ?? o.body, round: 0.3, parent: 'body', edge: 'sharp' });
  // bumpers, grille, lights
  b.box([W * 0.96, 0.2, 0.22], [0, 0.42, L / 2 - 0.06], { color: o.lower ?? '#3a3633', round: 0.4, parent: 'body', edge: 'sharp' })
    .box([W * 0.96, 0.2, 0.22], [0, 0.45, -L / 2 + 0.07], { color: o.lower ?? '#3a3633', round: 0.4, parent: 'body', edge: 'sharp' })
    .box([W * 0.42, 0.14, 0.05], [0, 0.66, L / 2 - 0.03], { color: '#2a2726', round: 0.3, parent: 'body', edge: 'sharp' });
  for (const s of [1, -1]) {
    b.box([0.34, 0.12, 0.06], [s * W * 0.33, 0.72, L / 2 - 0.07], { color: '#fff6c8', round: 0.4, name: s > 0 ? 'headlightL' : 'headlightR', parent: 'body', mover: { kind: 'light' }, edge: 'sharp' });
    b.box([0.3, 0.12, 0.06], [s * W * 0.36, 0.82, -L / 2 + 0.06], { color: '#e0473b', round: 0.4, parent: 'body', edge: 'sharp', glow: true });
    b.box([0.14, 0.09, 0.08], [s * (W * 0.45 + 0.05), 1.0, L * (cz + cab * 0.42)], { color: o.body, round: 0.4, parent: 'body', edge: 'sharp' });
  }
  // doors on the flanks, hinged at their front edges
  const dl = o.doors === 2 ? L * 0.26 : L * 0.2, d0 = L * (cz + cab * 0.42);
  const doorAt = (s: number, i: number, nm: string) => {
    const zc = d0 - dl / 2 - i * (dl + 0.02), x2 = s * (W / 2 + 0.005);
    b.box([0.03, 0.52, dl], [x2, 0.74, zc], { color: o.doorC ?? o.body, round: 0.3, name: nm, parent: 'body', pivot: [x2, 0.74, zc + dl / 2], mover: { kind: 'swing', axis: 'y', amount: -s * 65 }, edge: 'sharp' });
    b.box([0.04, 0.03, 0.14], [x2 + s * 0.02, 0.9, zc - dl * 0.3], { color: 'silver', parent: nm, edge: 'sharp' });
  };
  for (const s of [1, -1]) {
    doorAt(s, 0, s > 0 ? 'doorL' : 'doorR');
    if (o.doors !== 2) doorAt(s, 1, s > 0 ? 'doorL2' : 'doorR2');
  }
  // seats inside, axles and wheels
  b.box([0.5, 0.5, 0.5], [0.38, 0.75, d0 - 0.75], { color: '#3a3633', parent: 'body' }).box([0.5, 0.5, 0.5], [-0.38, 0.75, d0 - 0.75], { color: '#3a3633', parent: 'body' });
  const wz = L * 0.33;
  b.stick([W / 2 - 0.12, wd / 2, wz], [-W / 2 + 0.12, wd / 2, wz], 0.07, '#3a3633').stick([W / 2 - 0.12, wd / 2, -wz], [-W / 2 + 0.12, wd / 2, -wz], 0.07, '#3a3633');
  wheel(b, 'wheel1', [W / 2 - 0.12, wd / 2, wz], wd, 0.24);
  wheel(b, 'wheel2', [-W / 2 + 0.12, wd / 2, wz], wd, 0.24);
  wheel(b, 'wheel3', [W / 2 - 0.12, wd / 2, -wz], wd, 0.24);
  wheel(b, 'wheel4', [-W / 2 + 0.12, wd / 2, -wz], wd, 0.24);
  return b.socket('seat', [0.38, 0.62, d0 - 0.75], 'seat');
}

/** A parked car at real size (4.4 m) inside a scene, nose to +z turned by yaw (0 or 180): a moulded body, a glass
 *  cabin under its roof, lights and four tyres. Part names are left to the builder (they are scenery). */
function parked(b: M, cx: number, y: number, cz: number, color: string, yaw = 0): M {
  const r = yaw ? -1 : 1;
  b.loft([1.78, 0.72, 4.4], [cx, y + 0.66, cz], [[0, 0.88, 0.62, 0.08], [0.05, 0.97, 0.92, 0.02], [0.5, 1, 1, 0], [0.86, 0.98, 0.88, -0.04], [1, 0.8, 0.46, -0.14]], { color, boxy: 0.72, rot: [0, yaw, 0], edge: 'soft' })
    .loft([1.5, 0.52, 2.1], [cx, y + 1.18, cz - r * 0.2], [[0, 0.86, 0.5, -0.24], [0.15, 0.97, 0.94, -0.02], [0.62, 1, 1, 0], [1, 0.86, 0.2, -0.38]], { color: 'glass', boxy: 0.6, rot: [0, yaw, 0], edge: 'sharp' })
    .box([1.4, 0.07, 1.1], [cx, y + 1.44, cz - r * 0.3], { color, round: 0.4 });
  for (const s of [1, -1]) {
    b.box([0.3, 0.1, 0.05], [cx + s * 0.6, y + 0.72, cz + r * 2.17], { color: '#fff6c8', edge: 'sharp', round: 0.3 });
    b.box([0.28, 0.1, 0.05], [cx + s * 0.62, y + 0.82, cz - r * 2.16], { color: '#e0473b', edge: 'sharp', round: 0.3 });
    for (const t of [1, -1]) b.cyl([0.64, 0.22, 0.64], [cx + s * 0.77, y + 0.32, cz + t * 1.42], { color: 'rubber', rot: [0, 0, 90] });
  }
  return b;
}

/** A tree at real size: a tapering trunk with a root flare and branches, a crown of clumps (named top, so it
 *  sways) and fruit dotted over the outside of the crown. */
function tree(key: string, o: { h: number; crown: string; crown2?: string; trunk?: string; cw?: number; fruit?: string; n?: number; fs?: number; pear?: boolean; tw?: number }): M {
  const { h } = o, tc = o.trunk ?? 'bark';
  const cw = o.cw ?? h * 0.7, ch = h * 0.52, cy = h - ch / 2, tw = o.tw ?? h * 0.07;
  const t = m(key)
    .cyl([tw, cy * 0.8, tw], [0, cy * 0.4, 0], { color: tc, taper: 0.7 })
    .cyl([tw * 1.8, h * 0.06, tw * 1.8], [0, h * 0.03, 0], { color: tc, taper: 0.5 });
  for (const [a, l] of [[20, 0.5], [150, 0.45], [265, 0.42]] as Array<[number, number]>) {
    const r = rad(a);
    t.rod([0, cy * 0.7, 0], [Math.cos(r) * cw * 0.3, cy * 0.7 + h * l * 0.4, Math.sin(r) * cw * 0.3], tw * 0.5, tc);
  }
  t.ball([cw * 0.8, ch * 0.78, cw * 0.8], [0, cy + ch * 0.06, 0], { color: o.crown, name: 'top', pivot: [0, cy * 0.6, 0] });
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + 0.4, r = cw * 0.3;
    t.ball([cw * 0.46, ch * 0.5, cw * 0.46], [Math.cos(a) * r, cy - ch * 0.08 + (i % 2) * ch * 0.14, Math.sin(a) * r], { color: i % 2 && o.crown2 ? o.crown2 : o.crown, parent: 'top' });
  }
  t.ball([cw * 0.5, ch * 0.45, cw * 0.5], [0, cy + ch * 0.3, 0], { color: o.crown2 ?? o.crown, parent: 'top' });
  if (o.fruit) {
    const fs = o.fs ?? 0.09;
    for (let i = 0; i < (o.n ?? 14); i++) {
      const a = i * 2.39 + 0.3, phi = -0.5 + ((i * 0.37) % 1.0) * 0.9;
      const p: Vec3 = [Math.cos(a) * Math.cos(phi) * cw * 0.52, cy + Math.sin(phi) * ch * 0.45, Math.sin(a) * Math.cos(phi) * cw * 0.52];
      t.ball(fs, p, { color: o.fruit, parent: 'top' });
      if (o.pear) t.ball(fs * 0.65, [p[0], p[1] + fs * 0.55, p[2]], { color: o.fruit, parent: 'top' });
    }
  }
  return t;
}

/** A tree's act: it shakes and a fruit (a vocabulary word) drops in front of it, then is gathered up. */
const treeAct = (fruit: string, sound = 'Rustle rustle...') => ({
  click: [
    [A.par(A.pose('top', { rot: [0, 0, 6], dur: 0.25 }), A.say(sound, 1.5)), A.pose('top', { rot: [0, 0, -6], dur: 0.25 }), A.pose('top', { rot: [0, 0, 4], dur: 0.2 }), A.pose('top', { rot: [0, 0, 0], dur: 0.2 }), A.spawn('fruit', fruit, { rel: 'front', of: 'self', dist: 'close' }), A.anim('bounce', 1, 'fruit'), A.wait(2), A.remove('fruit', 'fade')],
  ],
});

/** A bottle: body, shoulder, neck and a cap (a piece that comes off), an optional label band. */
function bottle(b: M, x0: number, z: number, h: number, d: number, color: string, cap: string, o: { band?: string; text?: string; neck?: number; cork?: boolean; name?: string } = {}): M {
  const nk = o.neck ?? 0.4, bh = h * 0.62, sh = h * 0.16, nh = h * 0.12, ch = h * 0.1, nm = o.name ?? 'bottle';
  b.cyl([d, bh, d], [x0, bh / 2, z], { color, name: nm })
    .cyl([d, sh, d], [x0, bh + sh / 2, z], { color, taper: nk, parent: nm })
    .cyl([d * nk, nh, d * nk], [x0, bh + sh + nh / 2, z], { color, parent: nm })
    .cyl([d * nk * 1.2, ch, d * nk * 1.2], [x0, h - ch / 2, z], { color: cap, taper: o.cork ? 1.2 : 1, name: 'cap', parent: nm, piece: true, edge: 'sharp' });
  if (o.band) b.cyl([d * 1.02, bh * 0.5, d * 1.02], [x0, bh * 0.5, z], { color: o.band, noInk: true, parent: nm });
  if (o.text) b.label(o.text, [d * 0.75, bh * 0.32], [x0, bh * 0.5, z + d / 2 + 0.002], { color: o.band ?? 'white', parent: nm, depth: 0.004 });
  return b;
}

/** A jar with a lid (a piece that comes off) and a label: the contents colour shows as the body. */
function jar(key: string, h: number, d: number, fill: string, lid: string, text?: string, band = 'white'): M {
  const b = m(key)
    .cyl([d, h * 0.85, d], [0, h * 0.425, 0], { color: fill, name: 'jar' })
    .cyl([d * 0.96, h * 0.15, d * 0.96], [0, h * 0.925, 0], { color: lid, name: 'lid', parent: 'jar', piece: true, edge: 'sharp' })
    .cyl([d * 1.02, h * 0.4, d * 1.02], [0, h * 0.42, 0], { color: band, noInk: true, parent: 'jar' });
  if (text) b.label(text, [d * 0.7, h * 0.3], [0, h * 0.42, d / 2 + 0.002], { color: band, parent: 'jar', depth: 0.004 });
  return b;
}

/** A regular polygon (or part of one) in the x-y plane from triangles fanned around a centre, facing +z. */
function fan(b: M, n: number, R: number, cx: number, cy: number, cz: number, t: number, color: string, o: { start?: number; count?: number; noInk?: boolean; parent?: string } = {}): M {
  const step = 360 / n, side = 2 * R * Math.sin(Math.PI / n), apo = R * Math.cos(Math.PI / n);
  for (let i = 0; i < (o.count ?? n); i++) {
    const th = (o.start ?? -90) + i * step, r = (th * Math.PI) / 180;
    b.wedge([side, apo, t], [cx + (apo / 2) * Math.cos(r), cy + (apo / 2) * Math.sin(r), cz], { color, rot: [0, 0, th + 90], noInk: o.noInk, parent: o.parent });
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
function eulerOf(xa: Vec3, y: Vec3): Vec3 {
  const z: Vec3 = [xa[1] * y[2] - xa[2] * y[1], xa[2] * y[0] - xa[0] * y[2], xa[0] * y[1] - xa[1] * y[0]];
  const D = 180 / Math.PI, m13 = z[0];
  const b = Math.asin(Math.max(-1, Math.min(1, m13)));
  if (Math.abs(m13) < 0.9999) return [Math.atan2(-z[1], z[2]) * D, b * D, Math.atan2(-y[0], xa[0]) * D];
  return [Math.atan2(y[2], y[1]) * D, b * D, 0];
}

/** A square pyramid from four triangular faces (and a hidden core), base side a, height h, standing at y0. */
function pyramid(b: M, cx: number, cz: number, y0: number, a: number, h: number, color: string, t: number, o: PartOpts = {}): M {
  const beta = Math.atan(a / 2 / h), s = Math.hypot(h, a / 2), cb = Math.cos(beta), sb = Math.sin(beta);
  for (const f of [0, 90, 180, 270]) {
    const r = (f * Math.PI) / 180, d: Vec3 = [Math.sin(r), 0, Math.cos(r)];
    const n: Vec3 = [d[0] * cb, sb, d[2] * cb], u: Vec3 = [-d[0] * sb, cb, -d[2] * sb];
    const xa: Vec3 = [u[1] * n[2] - u[2] * n[1], u[2] * n[0] - u[0] * n[2], u[0] * n[1] - u[1] * n[0]];
    b.wedge([a, s, t], [cx + d[0] * (a / 4) - n[0] * (t / 2), y0 + h / 2 - n[1] * (t / 2), cz + d[2] * (a / 4) - n[2] * (t / 2)], { color, rot: eulerOf(xa, u), ...o });
  }
  return b.box([a * 0.5, h * 0.45, a * 0.5], [cx, y0 + h * 0.225, cz], { color, round: 0, ...o });
}

/** A display stand for shapes and symbols: a wooden base. */
const plinth = (b: M, w = 0.16, hh = 0.03, c = 'wood'): M => b.box([w, hh, w * 0.5], [0, hh / 2, 0], { color: c, edge: 'sharp', round: 0.2 });

/** A room seen from the front: floor, back wall and a side wall on its right (-x, so the usual view from the front
 *  right looks in), with skirting boards, no ceiling. */
function room(key: string, w: number, d: number, h: number, wall: string, floor: string): M {
  return m(key, { edge: 'sharp' })
    .box([w, 0.1, d], [0, 0.05, 0], { color: floor, round: 0.05 })
    .box([w, h, 0.12], [0, h / 2, -d / 2 + 0.06], { color: wall, round: 0.02 })
    .box([0.12, h, d], [-w / 2 + 0.06, h / 2, 0], { color: wall, round: 0.02 })
    .box([w, 0.1, 0.03], [0, 0.15, -d / 2 + 0.135], { color: 'white', round: 0.2 })
    .box([0.03, 0.1, d], [-w / 2 + 0.135, 0.15, 0], { color: 'white', round: 0.2 });
}

/** A plate: dish and rim (sharp: glazed china). */
const plate = (b: M, d: number, y = 0, c = 'white'): M =>
  b.cyl([d * 0.7, d * 0.03, d * 0.7], [0, y + d * 0.015, 0], { color: c, edge: 'sharp' }).cyl([d, d * 0.05, d], [0, y + d * 0.045, 0], { color: c, taper: 1.15, edge: 'sharp' });

/** A garment on an invisible form: a poncho drape for a person. */
const poncho = (c1: string, c2: string): Extra => (p, d) => {
  p.add({ name: 'poncho', parent: 'torso', at: [0, d.torsoH * 0.42, 0], shape: 'cyl', size: [d.tw * 2.3, d.torsoH * 1.15, d.td * 2.1], color: col(c1), segs: 4, srot: [0, 45, 0], taper: 0.35, layer: 3 });
  p.add({ name: 'ponchoband', parent: 'torso', at: [0, d.torsoH * 0.2, 0], shape: 'cyl', size: [d.tw * 2.0, d.torsoH * 0.12, d.td * 1.85], color: col(c2), segs: 4, srot: [0, 45, 0], taper: 0.9, layer: 4, noInk: true });
};

/** A person's gesture and the line that goes with it, at the same time. */
const says = (gesture: string, line: string, dur = 2.2) => A.par(A.anim(gesture), A.say(line, dur));

export const ENTRIES: CatalogEntry[] = [
  // A real office corner (4 x 3.5 m, 2.7 m walls): a desk at 0.75 m, a swivel chair whose seat is 0.48 m up, a
  // monitor that switches on, a filing cabinet whose top drawer slides out, a window, a clock and a plant.
  e('office', 'places', 'rooms', () => {
    const b = room('office', 4, 3.5, 2.7, '#dfe7ec', '#7d8894');
    win(b, [-0.6, 1.7, -1.63], 1.5, 1.1, { frame: 'white', cross: true });
    b.cyl([0.32, 0.04, 0.32], [1.2, 2.15, -1.6], { color: 'white', rot: [90, 0, 0] })
      .box([0.012, 0.11, 0.01], [1.2, 2.19, -1.575], { color: 'black', round: 0 })
      .box([0.08, 0.012, 0.01], [1.23, 2.15, -1.575], { color: 'black', round: 0 })
      .box([0.9, 0.6, 0.03], [-1.92, 1.5, -0.6], { color: '#c89a6a', rot: [0, 90, 0] })
      .box([0.18, 0.14, 0.01], [-1.9, 1.6, -0.75], { color: 'yellow', rot: [0, 90, 0], round: 0 })
      .box([0.16, 0.2, 0.01], [-1.9, 1.42, -0.42], { color: 'pink', rot: [0, 90, 0], round: 0 })
      // desk
      .box([1.6, 0.05, 0.75], [-0.4, 0.735, -1.1], { color: 'lightwood', round: 0.2 })
      .box([0.05, 0.71, 0.7], [-1.17, 0.36, -1.1], { color: '#9a9590' })
      .box([0.05, 0.71, 0.7], [0.37, 0.36, -1.1], { color: '#9a9590' })
      .box([1.5, 0.4, 0.03], [-0.4, 0.5, -1.42], { color: '#9a9590' })
      // monitor, keyboard, mouse, mug, papers
      .box([0.24, 0.02, 0.18], [-0.4, 0.77, -1.3], { color: '#2a2726' })
      .box([0.05, 0.22, 0.04], [-0.4, 0.88, -1.33], { color: '#2a2726' })
      .box([0.62, 0.38, 0.04], [-0.4, 1.12, -1.3], { color: '#2a2726', round: 0.15 })
      .box([0.56, 0.32, 0.01], [-0.4, 1.12, -1.275], { color: '#7fc8ff', name: 'screen', mover: { kind: 'light' }, round: 0.05 })
      .box([0.44, 0.02, 0.14], [-0.4, 0.77, -0.92], { color: '#3a3633', round: 0.3 })
      .ball([0.06, 0.03, 0.09], [-0.05, 0.775, -0.92], { color: '#3a3633' })
      .cyl([0.08, 0.1, 0.08], [0.15, 0.81, -1.2], { color: 'red', edge: 'soft' })
      .box([0.21, 0.03, 0.29], [-0.95, 0.775, -1.0], { color: 'paper', rot: [0, 12, 0], round: 0 });
    // the swivel chair: five feet on castors, a gas lift, a seat, a backrest and arms (it all turns)
    b.cyl([0.06, 0.32, 0.06], [-0.4, 0.27, -0.3], { color: '#5c6166', name: 'chair' });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      b.rod([-0.4, 0.09, -0.3], [-0.4 + Math.cos(a) * 0.3, 0.07, -0.3 + Math.sin(a) * 0.3], 0.04, '#3a3633', { parent: 'chair' });
      b.ball(0.05, [-0.4 + Math.cos(a) * 0.3, 0.03, -0.3 + Math.sin(a) * 0.3], { color: 'black', parent: 'chair' });
    }
    b.box([0.5, 0.08, 0.48], [-0.4, 0.48, -0.3], { color: '#2f4f8f', parent: 'chair', round: 0.4, edge: 'soft' })
      .box([0.46, 0.55, 0.07], [-0.4, 0.86, -0.06], { color: '#2f4f8f', parent: 'chair', round: 0.4, edge: 'soft', rot: [-8, 0, 0] })
      .box([0.04, 0.04, 0.3], [-0.13, 0.67, -0.32], { color: '#3a3633', parent: 'chair' })
      .box([0.04, 0.04, 0.3], [-0.67, 0.67, -0.32], { color: '#3a3633', parent: 'chair' })
      .rod([-0.13, 0.5, -0.32], [-0.13, 0.66, -0.32], 0.03, '#3a3633', { parent: 'chair' })
      .rod([-0.67, 0.5, -0.32], [-0.67, 0.66, -0.32], 0.03, '#3a3633', { parent: 'chair' });
    // filing cabinet with a drawer that slides out
    b.box([0.47, 1.32, 0.62], [1.55, 0.71, -1.3], { color: '#8f99a3', name: 'cabinet' });
    b.box([0.43, 0.29, 0.6], [1.55, 1.18, -1.28], { color: '#a7b0b8', name: 'drawer', parent: 'cabinet', mover: { kind: 'slide', axis: 'z', amount: 0.4 } })
      .box([0.16, 0.03, 0.04], [1.55, 1.24, -0.97], { color: 'silver', parent: 'drawer' });
    b.each(3, (i) => b.box([0.43, 0.29, 0.02], [1.55, 0.86 - i * 0.31, -0.99], { color: '#a7b0b8', parent: 'cabinet' }).box([0.16, 0.03, 0.04], [1.55, 0.92 - i * 0.31, -0.97], { color: 'silver', parent: 'cabinet' }));
    // plant
    b.cyl([0.32, 0.36, 0.32], [1.6, 0.28, 0.9], { color: '#c8693e', taper: 1.25 });
    b.each(7, (i) => b.ball([0.12, 0.42, 0.12], [1.6 + Math.cos(i * 0.9) * 0.12, 0.72, 0.9 + Math.sin(i * 0.9) * 0.12], { color: i % 2 ? 'leaf' : 'darkgreen', rot: [Math.sin(i * 0.9) * 25, 0, -Math.cos(i * 0.9) * 25], edge: 'soft' }));
    return b
      .socket('chair', [-0.4, 0.52, -0.3], 'seat')
      .socket('desk', [-0.75, 0.76, -1.0], 'top', { size: 0.4 })
      .act({
        click: [
          [A.par(A.operate('screen', 'on'), A.say('Beep!', 1.5)), A.pose('chair', { rot: [0, 360, 0], dur: 1.2 }), A.pose('chair', { rot: [0, 0, 0], dur: 0 })],
          [A.operate('drawer', 'out'), A.say('Shhk!', 1), A.wait(1.5), A.par(A.operate('drawer', 'in'), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A five-storey office block (18 m to the roof, 25 m to the top of its mast; the vocabulary's 1 m is a toy
  // size): ribbon windows between concrete floor bands, mullions, a glass lobby with sliding doors under a
  // canopy, rooftop plant and a mast with a beacon. The doors slide open; the office lights go on.
  e('office building', 'places', 'offices', () => {
    const W = 16, D = 12, fh = 3.4, H = 5 * fh + 0.4;
    const b = m('office building', { edge: 'sharp' })
      .box([W, H, D], [0, H / 2, 0], { color: '#6f8597', round: 0.01, name: 'walls' })
      .box([W + 0.14, 0.42, D + 0.14], [0, 0.21, 0], { color: '#8f8a82', round: 0.05 });
    let n = 0;
    for (let f = 0; f < 5; f++) {
      const y0 = 0.42 + f * fh, gh = f === 0 ? 2.9 : 2.0, gy = f === 0 ? y0 + 1.55 : y0 + 0.95 + gh / 2;
      b.box([W + 0.12, 0.34, D + 0.12], [0, y0 + fh - 0.05, 0], { color: '#d8dcdf', round: 0.1 });
      const lit = f > 0 && f % 2 === 1;
      b.box([W - 0.6, gh, 0.06], [0, gy, D / 2 + 0.03], { color: '#8fc6e6', round: 0.02, ...(lit ? { name: `lights${n++}`, mover: { kind: 'light' as const } } : {}) });
      for (const s of [1, -1]) b.box([0.06, gh, D - 0.6], [s * (W / 2 + 0.03), gy, 0], { color: '#8fc6e6', round: 0.02 });
    }
    for (let i = 0; i <= 6; i++) b.box([0.14, H - 0.6, 0.12], [-W / 2 + 0.3 + i * ((W - 0.6) / 6), H / 2 + 0.2, D / 2 + 0.07], { color: '#d8dcdf', round: 0.2 });
    for (let i = 0; i <= 4; i++) for (const s of [1, -1]) b.box([0.12, H - 0.6, 0.14], [s * (W / 2 + 0.07), H / 2 + 0.2, -D / 2 + 0.3 + i * ((D - 0.6) / 4)], { color: '#d8dcdf', round: 0.2 });
    // lobby: canopy on two posts, sliding glass doors, a name board and planters
    b.box([6.5, 0.3, 2.6], [0, 3.5, D / 2 + 1.3], { color: '#d8dcdf', round: 0.1 })
      .label('CITY OFFICES', [4.2, 0.28], [0, 3.5, D / 2 + 2.62], { color: '#2f3d52', depth: 0.03 })
      .rod([3.0, 0.4, D / 2 + 2.4], [3.0, 3.35, D / 2 + 2.4], 0.16, 'silver')
      .rod([-3.0, 0.4, D / 2 + 2.4], [-3.0, 3.35, D / 2 + 2.4], 0.16, 'silver')
      .box([3.0, 2.5, 0.1], [0, 1.67, D / 2 + 0.08], { color: '#5c6166', round: 0.05 })
      .box([1.2, 2.2, 0.05], [0.62, 1.52, D / 2 + 0.16], { color: '#bfe3f5', round: 0.05, name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: 1.0 } })
      .box([1.2, 2.2, 0.05], [-0.62, 1.52, D / 2 + 0.16], { color: '#bfe3f5', round: 0.05, name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: -1.0 } })
      .box([5, 0.2, 2.4], [0, 0.1, D / 2 + 1.25], { color: '#a7a7a0', round: 0.05 });
    for (const s of [1, -1]) b.box([1.2, 0.6, 1.2], [s * 4.6, 0.3, D / 2 + 1.0], { color: '#a7a7a0' }).ball([1.1, 0.8, 1.1], [s * 4.6, 0.95, D / 2 + 1.0], { color: 'leaf', edge: 'soft' });
    // roof: parapet, plant room, air units, a mast
    return b
      .box([W + 0.2, 0.6, D + 0.2], [0, H + 0.3, 0], { color: '#d8dcdf', round: 0.05 })
      .box([W - 0.4, 0.2, D - 0.4], [0, H + 0.4, 0], { color: '#6e6a66', round: 0.05 })
      .box([5, 2.6, 4], [-3, H + 1.6, -2], { color: '#b9c2ca', round: 0.05 })
      .box([1.6, 1.1, 1.6], [3.5, H + 1.0, 1.5], { color: '#c9ccd1', round: 0.1 })
      .cyl([1.2, 0.2, 1.2], [3.5, H + 1.6, 1.5], { color: '#3a3633' })
      .box([1.6, 1.1, 1.6], [5.5, H + 1.0, 1.5], { color: '#c9ccd1', round: 0.1 })
      .stick([-3, H + 2.9, -2], [-3, H + 8, -2], 0.12, 'silver')
      .ball(0.3, [-3, H + 8.1, -2], { color: 'red', name: 'beacon', mover: { kind: 'light', on: true } })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Whoosh!', 1.2), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('lights'), A.say('Click!', 1), A.operate('beacon')],
        ],
      })
      .done();
  }),
  // A big-box stationery shop: shop windows full of paper boxes, a striped awning, a sign, glass double doors,
  // and a giant pencil on the roof that turns.
  e('office supply store', 'places', 'shops', () => {
    const b = bld('office supply store', { w: 12, d: 9, floors: 1, fh: 4.6, wall: '#f4f2ee', trim: '#d62f2f', shop: true, awning: '#d62f2f', sign: 'OFFICE SUPPLY', signC: 'white', double: true, glassDoor: true, win: '#bfe3f5', sides: false });
    for (const s of [1, -1])
      b.each(3, (i) => b.box([0.55, 0.3, 0.4], [s * (3.6 + (i - 1) * 0.6), 1.0 + (i % 2) * 0.3, 4.2], { color: ['#4e8fd6', 'white', '#f6d24a'][i], round: 0.1 }));
    b.each(2, (i) => win(b, [i ? 6 : -6, 2.6, 0], 1.6, 1.2, { face: i ? 'left' : 'right', frame: '#d62f2f' }));
    // the rooftop pencil: hexagonal yellow body, wood tip, lead, pink eraser in a band, on two posts
    b.rod([-2.2, 5.2, 0], [-2.2, 6.2, 0], 0.15, 'gray').rod([2.2, 5.2, 0], [2.2, 6.2, 0], 0.15, 'gray');
    b.prism([0.9, 5, 0.9], [0, 6.6, 0], 6, { color: '#f6d24a', rot: [0, 0, 90], name: 'pencil', mover: { kind: 'spin', axis: 'x', amount: 90 } })
      .cone([0.9, 1.0, 0.9], [3.0, 6.6, 0], { color: 'lightwood', rot: [0, 0, -90], segs: 6, parent: 'pencil' })
      .cone([0.3, 0.33, 0.3], [3.36, 6.6, 0], { color: '#3a3633', rot: [0, 0, -90], parent: 'pencil' })
      .cyl([0.92, 0.4, 0.92], [-2.7, 6.6, 0], { color: 'silver', rot: [0, 0, 90], parent: 'pencil' })
      .cyl([0.86, 0.6, 0.86], [-3.2, 6.6, 0], { color: 'pink', rot: [0, 0, 90], parent: 'pencil', edge: 'soft' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-dong!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('pencil', 'on'), A.effect('sparkle', { dur: 1.5 }), A.wait(2.5), A.operate('pencil', 'off')],
        ],
      })
      .done();
  }),
  // A litre bottle of sunflower oil: the cap comes off, it tips and pours, then stands up and is capped again.
  e('oil (cooking)', 'food', 'pantry', () => {
    const b = m('oil (cooking)');
    bottle(b, 0, 0, 0.3, 0.08, '#f0c03a', '#3f7a3a', { text: 'SUNFLOWER OIL', band: '#fff3d6', neck: 0.38 });
    return b
      .cyl([0.084, 0.012, 0.084], [0, 0.12, 0], { color: '#e2a92a', parent: 'bottle', noInk: true })
      .cyl([0.084, 0.012, 0.084], [0, 0.07, 0], { color: '#e2a92a', parent: 'bottle', noInk: true })
      .ball([0.03, 0.03, 0.006], [0, 0.155, 0.043], { color: '#f6d24a', parent: 'bottle', noInk: true })
      .act({ click: [[A.detach('cap', 'cap'), A.set({ tilt: 55, dur: 0.6 }), A.say('Glug glug...', 1.5), A.wait(1.2), A.set({ tilt: 0, dur: 0.5 }), A.reattach('cap')]] })
      .done();
  }),
  // A 5-litre jug of motor oil: moulded handle, offset spout with a screw cap, a level window and a label.
  e('oil (motor)', 'garage', 'car care', () =>
    m('oil (motor)', { edge: 'sharp' })
      .box([0.2, 0.26, 0.12], [0, 0.13, 0], { color: '#f6d24a', round: 0.3, name: 'jug', edge: 'soft' })
      .arc([0.09, 0.08, 0.03], [0.045, 0.255, 0], { color: '#f6d24a', tube: 0.35, parent: 'jug', edge: 'soft' })
      .cyl([0.045, 0.04, 0.045], [-0.055, 0.275, 0], { color: '#f6d24a', parent: 'jug', edge: 'soft' })
      .cyl([0.052, 0.03, 0.052], [-0.055, 0.305, 0], { color: '#2a2726', name: 'cap', parent: 'jug', piece: true })
      .label('MOTOR OIL', [0.16, 0.06], [0, 0.17, 0.062], { color: '#2a2726', parent: 'jug', depth: 0.004 })
      .label('5W-30', [0.1, 0.035], [0, 0.11, 0.062], { color: '#e0473b', parent: 'jug', depth: 0.004 })
      .box([0.012, 0.18, 0.004], [-0.09, 0.12, 0.061], { color: '#c99a2a', parent: 'jug', round: 0 })
      .act({ click: [[A.pose('cap', { rot: [0, 540, 0], dur: 0.6 }), A.detach('cap', 'cap'), A.set({ tilt: -60, dur: 0.6 }), A.say('Glug glug glug...', 1.6), A.wait(1.2), A.set({ tilt: 0, dur: 0.5 }), A.reattach('cap')]] })
      .done(),
  ),
  // A 200-litre steel drum (0.88 x 0.58 m, waist-high): rolling hoops, a top chime, a bung that unscrews.
  e('oil barrel', 'workshop', 'drums and tanks', () =>
    m('oil barrel', { edge: 'sharp' })
      .cyl([0.57, 0.86, 0.57], [0, 0.44, 0], { color: '#2f5f9f', name: 'drum', edge: 'soft' })
      .torus([0.6, 0.6, 0.035], [0, 0.3, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.07, parent: 'drum' })
      .torus([0.6, 0.6, 0.035], [0, 0.59, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.07, parent: 'drum' })
      .torus([0.585, 0.585, 0.03], [0, 0.87, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.06, parent: 'drum' })
      .torus([0.585, 0.585, 0.03], [0, 0.015, 0], { color: '#24497a', rot: [90, 0, 0], tube: 0.06, parent: 'drum' })
      .cyl([0.06, 0.025, 0.06], [0.16, 0.88, 0.05], { color: '#9da3a8', name: 'bung', parent: 'drum', piece: true })
      .cyl([0.035, 0.02, 0.035], [-0.17, 0.875, -0.05], { color: '#9da3a8', parent: 'drum' })
      .label('OIL', [0.2, 0.1], [0, 0.45, 0.288], { color: 'white', parent: 'drum', depth: 0.006 })
      .box([0.1, 0.1, 0.006], [0, 0.66, 0.282], { color: 'orange', rot: [0, 0, 45], parent: 'drum', round: 0 })
      .ball([0.5, 0.02, 0.3], [0.25, 0.01, 0.4], { color: '#1e1b1f', edge: 'soft' })
      .act({
        click: [
          [A.par(A.anim('wobble'), A.say('Bonggg!', 1.5))],
          [A.pose('bung', { rot: [0, 720, 0], dur: 0.6 }), A.detach('bung', 'bung'), A.effect('smoke', { dur: 1.2 }), A.say('Pssst...', 1.2), A.wait(1.2), A.reattach('bung')],
        ],
      })
      .done(),
  ),
  // A hurricane lamp: brass base and fuel font, a wick knob, a glass chimney that glows (its flame), a vented cap
  // and a wire bail handle. Turning the knob puts the flame out (a puff of smoke) and lights it again.
  e('oil lamp', 'home', 'lamps', () =>
    m('oil lamp', { edge: 'sharp' })
      .cyl([0.15, 0.025, 0.15], [0, 0.0125, 0], { color: 'brass', taper: 0.9 })
      .ball([0.15, 0.07, 0.15], [0, 0.06, 0], { color: 'brass', edge: 'soft' })
      .cyl([0.08, 0.025, 0.08], [0, 0.105, 0], { color: 'brass' })
      .cyl([0.022, 0.02, 0.022], [0.045, 0.11, 0.03], { color: 'brass', rot: [90, 0, 0], name: 'knob' })
      .ball([0.1, 0.13, 0.1], [0, 0.18, 0], { color: '#ffe9a0', name: 'flame', mover: { kind: 'light', on: true }, edge: 'soft' })
      .cyl([0.06, 0.03, 0.06], [0, 0.25, 0], { color: '#ffe9a0', parent: 'flame', edge: 'soft' })
      .cyl([0.09, 0.03, 0.09], [0, 0.275, 0], { color: 'brass', taper: 0.6 })
      .cyl([0.04, 0.015, 0.04], [0, 0.295, 0], { color: 'brass' })
      .rod([0.065, 0.11, 0], [0.065, 0.27, 0], 0.006, 'brass')
      .rod([-0.065, 0.11, 0], [-0.065, 0.27, 0], 0.006, 'brass')
      .arc([0.14, 0.09, 0.006], [0, 0.27, 0], { color: 'brass', tube: 0.08 })
      .act({
        click: [
          [A.pose('knob', { rot: [0, 0, 180], dur: 0.4 }), A.operate('flame', 'off'), A.effect('smoke', { dur: 1.2 })],
          [A.pose('knob', { rot: [0, 0, 0], dur: 0.4 }), A.operate('flame', 'on'), A.say('Fwoomp.', 1)],
        ],
      })
      .done(),
  ),
  // An offshore drilling platform (the real ones are bigger; this is 36 m): four braced legs standing in the sea,
  // two decks, a drilling derrick with a turning drill string, quarters with a helipad, a crane that swings out,
  // a flare boom that lights, and an orange lifeboat.
  e('oil rig', 'places', 'industry', () => {
    const b = m('oil rig', { edge: 'sharp' }).cyl([40, 0.3, 40], [0, 0.15, 0], { color: 'water', edge: 'soft' });
    const L = 8;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) b.cyl([1.8, 14, 1.8], [sx * L, 7, sz * L], { color: '#f6d24a', edge: 'soft' });
    for (const y of [4, 10]) {
      for (const s of [1, -1]) {
        b.rod([s * L, y, -L], [s * L, y, L], 0.5, '#e2b23a').rod([-L, y, s * L], [L, y, s * L], 0.5, '#e2b23a');
        b.rod([s * L, y - 3, -L], [s * L, y + 3, L], 0.35, '#e2b23a').rod([-L, y - 3, s * L], [L, y + 3, s * L], 0.35, '#e2b23a');
      }
    }
    b.box([24, 1.4, 24], [0, 14.7, 0], { color: '#7a7f85', round: 0.05 })
      .box([22, 0.6, 18], [0, 19.4, -1], { color: '#8f99a3', round: 0.05 });
    for (const [x, z] of [[-10, -9], [10, -9], [-10, 7], [10, 7], [0, -9], [0, 7]]) b.stick([x, 15.4, z], [x, 19.1, z], 0.5, '#5c6166');
    b.each(12, (i) => b.box([0.06, 1.1, 24], [-11.95 + (i % 2) * 23.9, 16, 0], { color: '#e2b23a', round: 0 }));
    // derrick: a tapering lattice tower
    const tw = (y: number) => 3 - ((y - 19.7) / 16) * 2.3;
    const P = (sx: number, sz: number, y: number): Vec3 => [3 + sx * tw(y), y, -2 + sz * tw(y)];
    const cs: Array<[number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    for (const [sx, sz] of cs) b.rod(P(sx, sz, 19.7), P(sx, sz, 35.7), 0.35, '#e0473b');
    for (const y of [23, 27, 31, 35]) for (let i = 0; i < 4; i++) b.rod(P(cs[i][0], cs[i][1], y), P(cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], y), 0.22, i % 2 ? '#f7f5ef' : '#e0473b');
    for (let i = 0; i < 4; i++) b.rod(P(cs[i][0], cs[i][1], 19.7), P(cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], 27), 0.18, '#f7f5ef');
    b.box([1.8, 1.2, 1.8], [3, 36.2, -2], { color: '#e0473b' })
      .cyl([3, 0.5, 3], [3, 20, -2], { color: '#3a3633', name: 'drill', mover: { kind: 'spin', axis: 'y', amount: 200 } })
      .stick([3, 20, -2], [3, 34, -2], 0.3, 'silver', { parent: 'drill' })
      .box([0.6, 0.3, 0.3], [3.9, 20.3, -2], { color: '#f6d24a', parent: 'drill' });
    // quarters and helipad
    b.box([8, 6, 7], [-7, 18.4, 7.5], { color: '#f7f5ef', round: 0.03 });
    b.each(4, (i) => b.box([1.2, 0.8, 0.06], [-9.9 + i * 1.95, 19.6, 11.03], { color: 'glass' }).box([1.2, 0.8, 0.06], [-9.9 + i * 1.95, 17.4, 11.03], { color: 'glass' }));
    b.prism([10, 0.5, 10], [-8, 21.7, 9], 8, { color: '#5c6166' })
      .cyl([8, 0.06, 8], [-8, 21.98, 9], { color: '#f6d24a', segs: 8 })
      .cyl([7.4, 0.08, 7.4], [-8, 22.0, 9], { color: '#5c6166', segs: 8 })
      .label('H', [2.4, 3], [-8, 22.05, 9], { color: '#5c6166', rot: [-90, 0, 0], depth: 0.05 })
      .rod([-4.5, 15.4, 12], [-6, 21.4, 9.5], 0.4, '#5c6166');
    // crane on its pedestal: the boom swings out
    b.cyl([1.4, 5, 1.4], [9, 22.2, 7], { color: '#f6d24a' })
      .box([2, 1.6, 2.4], [9, 25.4, 7], { color: '#f6d24a', name: 'crane', pivot: [9, 25, 7], mover: { kind: 'swing', axis: 'y', amount: 80 } })
      .box([1.0, 1.0, 1.0], [9.4, 26.2, 7.8], { color: 'glass', parent: 'crane' })
      .rod([9, 25.4, 6.4], [9, 33, -6], 0.45, '#f6d24a', { parent: 'crane' })
      .stick([9, 33, -6], [9, 27, -6], 0.06, '#3a3633', { parent: 'crane' })
      .box([0.5, 0.6, 0.3], [9, 26.8, -6], { color: '#e0473b', parent: 'crane' });
    // flare boom with its flame
    b.rod([-11, 19.8, -9], [-21, 27, -14], 0.5, '#8f99a3')
      .ball([1.6, 2.6, 1.6], [-21.4, 28.6, -14.2], { color: '#ff8a2a', name: 'flare', mover: { kind: 'light' }, edge: 'soft' })
      .capsule([1.6, 4.2, 1.6], [12.6, 16.2, 2], { color: '#f0923b', rot: [90, 0, 0], edge: 'soft' })
      .socket('deck', [0, 15.5, 9], 'top', { size: 6 });
    return b
      .act({
        click: [
          [A.operate('crane', 'open'), A.say('Creeeak...', 1.5), A.wait(2.5), A.operate('crane', 'close')],
          [A.par(A.operate('drill', 'on'), A.operate('flare', 'on'), A.say('Rumble rumble...', 2)), A.wait(3), A.par(A.operate('drill', 'off'), A.operate('flare', 'off'))],
        ],
      })
      .done();
  }),
  // An old wooden oil derrick (12 m) over the wellhead with a nodding pumpjack beside it. The pumpjack's beam
  // nods as its crank turns; a second click strikes oil and a black gusher shoots out of the derrick.
  e('oil well', 'places', 'industry', () => {
    const b = m('oil well', { edge: 'sharp' }).box([12, 0.2, 8], [1.5, 0.1, 0], { color: 'dirt', edge: 'soft' });
    const cs: Array<[number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    const P = (sx: number, sz: number, y: number): Vec3 => {
      const r = 1.6 - ((y - 0.2) / 11.8) * 1.25;
      return [-2 + sx * r, y, sz * r];
    };
    for (const [sx, sz] of cs) b.rod(P(sx, sz, 0.2), P(sx, sz, 12), 0.2, 'darkwood');
    for (const y of [1.6, 4, 6.5, 9, 11.3]) for (let i = 0; i < 4; i++) b.rod(P(cs[i][0], cs[i][1], y), P(cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], y), 0.12, 'wood');
    for (let i = 0; i < 4; i++) b.rod(P(cs[i][0], cs[i][1], 1.6), P(cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], 4), 0.09, 'wood').rod(P(cs[i][0], cs[i][1], 4), P(cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], 6.5), 0.09, 'wood');
    b.box([3.6, 0.15, 3.6], [-2, 1.65, 0], { color: 'lightwood' })
      .box([0.9, 0.5, 0.9], [-2, 12.2, 0], { color: 'darkwood' })
      .cyl([0.4, 1.3, 0.4], [-2, 0.85, 0], { color: '#5c6166' })
      .cyl([0.8, 7, 0.8], [-2, 15.4, 0], { color: '#1e1b1f', name: 'gusher', taper: 2.2, scale: 0, edge: 'soft' })
      .ball([3.2, 1.6, 3.2], [-2, 19.2, 0], { color: '#1e1b1f', name: 'spray', scale: 0, edge: 'soft' })
      .each(4, (i) => b.box([0.06, 0.06, 0.06], [-2, 2.3 + i * 0.5, 1.55], { color: 'wood' }))
      .stick([-2.4, 1.7, 1.55], [-2.4, 0.2, 1.75], 0.06, 'wood').stick([-1.6, 1.7, 1.55], [-1.6, 0.2, 1.75], 0.06, 'wood');
    // the pumpjack: skid, samson post, walking beam with a horsehead, crank and counterweights, motor
    b.box([1.0, 0.3, 4.6], [4, 0.35, 0], { color: '#5c6166' })
      .rod([3.6, 0.5, 0.4], [4, 2.9, 0], 0.16, '#3f7a3a').rod([4.4, 0.5, 0.4], [4, 2.9, 0], 0.16, '#3f7a3a').rod([4, 0.5, -0.6], [4, 2.9, 0], 0.16, '#3f7a3a')
      .box([0.3, 0.4, 4.4], [4, 3.1, 0.2], { color: '#3f7a3a', name: 'beam', pivot: [4, 3.0, 0] })
      .arc([0.9, 1.2, 0.4], [4, 3.0, 2.4], { color: '#3f7a3a', rot: [0, 90, -60], tube: 0.45, arc: 120, parent: 'beam' })
      .stick([4, 2.45, 2.85], [4, 0.6, 2.85], 0.04, '#3a3633', { parent: 'beam' })
      .cyl([0.25, 0.7, 0.25], [4, 0.55, 2.85], { color: '#5c6166' })
      .rod([3.75, 3.0, -1.8], [3.75, 1.3, -1.9], 0.1, '#3f7a3a').rod([4.25, 3.0, -1.8], [4.25, 1.3, -1.9], 0.1, '#3f7a3a')
      .box([0.2, 0.8, 0.8], [3.55, 1.2, -1.9], { color: '#e0473b', name: 'crank', pivot: [3.55, 1.2, -1.9], mover: { kind: 'spin', axis: 'x', amount: 180 } })
      .box([0.2, 0.8, 0.8], [4.45, 1.2, -1.9], { color: '#e0473b', parent: 'crank' })
      .box([0.8, 0.7, 0.9], [4, 0.85, -2.6], { color: '#5c6166' });
    const nod = [A.pose('beam', { rot: [14, 0, 0], dur: 0.8 }), A.pose('beam', { rot: [-14, 0, 0], dur: 0.8 })];
    return b
      .act({
        click: [
          [A.par(A.operate('crank', 'on'), A.say('Creak... creak...', 2)), ...nod, ...nod, A.pose('beam', { rot: [0, 0, 0], dur: 0.6 }), A.operate('crank', 'off')],
          [A.par(A.anim('shake'), A.say('Rumble...', 1.2)), A.par(A.pose('gusher', { scale: 1, dur: 0.5 }), A.pose('spray', { scale: 1, dur: 0.6 }), A.say('WHOOSH!', 2)), A.wait(2.5), A.par(A.pose('gusher', { scale: 0, dur: 0.6 }), A.pose('spray', { scale: 0, dur: 0.6 }))],
        ],
      })
      .done();
  }),
  // A slick of spilled oil on the ground with a rainbow sheen that shimmers, and the can that leaked it.
  e('oilslick', 'nature', 'puddles', () =>
    m('oilslick')
      .ball([1.6, 0.02, 1.0], [0, 0.01, 0], { color: '#1e1b1f', edge: 'soft' })
      .ball([0.6, 0.04, 0.6], [0.5, 0.012, -0.3], { color: '#1e1b1f', edge: 'soft' })
      .ball([0.5, 0.012, 0.3], [0.1, 0.022, 0.08], { color: '#7a4fc4', noInk: true, name: 'sheen', pivot: [0, 0.022, 0] })
      .ball([0.4, 0.012, 0.22], [-0.3, 0.022, -0.1], { color: '#3fa7a0', noInk: true, parent: 'sheen' })
      .ball([0.26, 0.012, 0.16], [0.45, 0.022, -0.15], { color: '#e2b23a', noInk: true, parent: 'sheen' })
      .ball([0.3, 0.012, 0.14], [-0.15, 0.022, 0.28], { color: '#d64fa0', noInk: true, parent: 'sheen' })
      .box([0.17, 0.25, 0.32], [-0.85, 0.09, 0.15], { color: '#e0473b', rot: [0, 20, 90], round: 0.2, edge: 'sharp' })
      .cyl([0.05, 0.08, 0.05], [-0.68, 0.12, 0.2], { color: '#e0473b', rot: [0, 20, 90], edge: 'sharp' })
      .act({ click: [[A.par(A.pose('sheen', { rot: [0, 120, 0], dur: 1.5 }), A.effect('sparkle', { dur: 1.5 })), A.pose('sheen', { rot: [0, 0, 0], dur: 1.5 })]] })
      .done(),
  ),
  // Olives in a little dish: green ones stuffed with red pimento, black ones, and one on a cocktail pick.
  e('olive', 'food', 'pickles and olives', () => {
    const b = m('olive').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'white', taper: 1.25, edge: 'sharp', name: 'dish' });
    const ol = (x: number, z: number, c: string, stuffed: boolean) => {
      b.ball([0.022, 0.02, 0.028], [x, 0.03, z], { color: c, parent: 'dish' });
      if (stuffed) b.ball([0.009, 0.009, 0.004], [x, 0.03, z + 0.014], { color: '#e0473b', noInk: true, parent: 'dish' });
    };
    ol(-0.02, 0.01, '#7a9a3a', true);
    ol(0.015, 0.018, '#3a3040', false);
    ol(0.0, -0.02, '#7a9a3a', true);
    ol(0.025, -0.012, '#3a3040', false);
    return b
      .stick([-0.01, 0.03, 0.0], [0.03, 0.1, 0.0], 0.003, 'lightwood', { name: 'pick', parent: 'dish', piece: true })
      .ball([0.022, 0.028, 0.02], [0.019, 0.08, 0], { color: '#7a9a3a', parent: 'pick' })
      .ball([0.008, 0.008, 0.004], [0.019, 0.08, 0.011], { color: '#e0473b', noInk: true, parent: 'pick' })
      .ball(0.008, [0.031, 0.102, 0], { color: '#e0473b', parent: 'pick' })
      .act({ click: [[A.detach('pick', 'pick'), A.say('Pop!', 1)], [A.reattach('pick')]] })
      .done();
  }),
  // A sprig of olive: a slender twig with pairs of narrow silver-green leaves and a few olives. A dove comes for it.
  e('olive branch', 'garden', 'branches', () => {
    const b = m('olive branch').rod([0, 0.0, 0], [0.04, 0.3, 0], 0.012, 'bark').rod([0.04, 0.3, 0], [0.02, 0.6, 0], 0.009, 'bark').rod([0.03, 0.22, 0], [0.13, 0.36, 0.02], 0.007, 'bark');
    b.each(9, (i) => {
      const s = i % 2 ? 1 : -1, y = 0.1 + i * 0.055, xx = y < 0.3 ? (y / 0.3) * 0.04 : 0.04 - ((y - 0.3) / 0.3) * 0.02;
      b.ball([0.016, 0.085, 0.006], [xx + s * 0.035, y + 0.02, 0], { color: i % 3 ? '#8fa66a' : '#a9b98f', rot: [0, 0, -s * 55] });
    });
    b.each(3, (i) => b.ball([0.014, 0.07, 0.005], [0.1 + i * 0.012, 0.3 + i * 0.025, 0.02], { color: '#8fa66a', rot: [0, 0, i % 2 ? 50 : -40] }));
    return b
      .ball([0.016, 0.07, 0.006], [0.02, 0.63, 0], { color: '#8fa66a' })
      .ball([0.018, 0.024, 0.018], [0.06, 0.24, 0.015], { color: '#5a6a2a' })
      .ball([0.018, 0.024, 0.018], [0.025, 0.42, 0.015], { color: '#3a3040' })
      .ball([0.018, 0.024, 0.018], [0.135, 0.34, 0.025], { color: '#7a9a3a' })
      .act({ click: [[A.spawn('dove', 'dove', { rel: 'above', of: 'self', dist: 'close' }), A.say('Coo coo!', 1.5, 'dove'), A.wait(1.5), A.remove('dove', 'fly_away')]] })
      .done();
  }),
  // An old olive tree: a short, twisted, split trunk and a wide silvery-green crown speckled with black olives.
  e('olive tree', 'garden', 'fruit trees', () =>
    withAct(
      tree('olive tree', { h: 6, crown: '#8fa878', crown2: '#a7b98f', trunk: '#6e5a48', cw: 5.6, fruit: '#3a3040', n: 18, fs: 0.12, tw: 0.55 })
        .rod([0, 0, 0], [-0.5, 1.4, 0.25], 0.45, '#6e5a48')
        .rod([-0.5, 1.4, 0.25], [0.15, 2.6, 0], 0.38, '#6e5a48')
        .rod([0.2, 0.2, -0.1], [0.5, 1.8, -0.3], 0.35, '#6e5a48')
        .done(),
      treeAct('olive'),
    ),
  ),
  // A folded omelette on a plate, a little browned, with ham, cheese and chives peeking out of the fold.
  e('omelet', 'food', 'breakfast', () =>
    plate(m('omelet'), 0.26)
      .dome([0.19, 0.04, 0.12], [0, 0.017, 0], { color: '#f6d24a' })
      .ball([0.04, 0.008, 0.03], [0.04, 0.05, -0.01], { color: '#e2a92a', noInk: true })
      .ball([0.03, 0.008, 0.02], [-0.05, 0.048, 0.01], { color: '#e2a92a', noInk: true })
      .box([0.03, 0.012, 0.012], [-0.03, 0.022, 0.061], { color: '#f4a1a0', rot: [0, 10, 0] })
      .box([0.03, 0.012, 0.012], [0.02, 0.022, 0.062], { color: '#f6c445', rot: [0, -15, 0] })
      .box([0.02, 0.004, 0.004], [0.0, 0.03, 0.064], { color: 'green', noInk: true })
      .box([0.02, 0.004, 0.004], [0.05, 0.026, 0.06], { color: 'green', noInk: true })
      .ball([0.025, 0.012, 0.02], [0.08, 0.02, 0.05], { color: '#3f7a3a' })
      .act({ click: [[A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5)]] })
      .done(),
  ),
  // A brown onion: papery golden skin with a sheen, a dry neck, a pale root plate. Its top is cut off and comes away,
  // showing the white rings inside.
  e('onion', 'food', 'vegetables', () => {
    const b = m('onion')
      .ball([0.08, 0.072, 0.08], [0, 0.038, 0], { color: '#c98a4a', name: 'bulb' })
      .cyl([0.054, 0.004, 0.054], [0, 0.06, 0], { color: '#fbf6e6', parent: 'bulb', edge: 'sharp' })
      .torus([0.04, 0.04, 0.004], [0, 0.062, 0], { color: '#e8dcc0', rot: [90, 0, 0], tube: 0.1, parent: 'bulb', noInk: true })
      .torus([0.024, 0.024, 0.004], [0, 0.062, 0], { color: '#e8dcc0', rot: [90, 0, 0], tube: 0.15, parent: 'bulb', noInk: true });
    b.ball([0.03, 0.04, 0.012], [0.018, 0.045, 0.032], { color: '#e0a868', noInk: true, parent: 'bulb' })
      .cyl([0.024, 0.006, 0.024], [0, 0.003, 0], { color: '#e8d8b0', parent: 'bulb' });
    return b
      .dome([0.064, 0.022, 0.064], [0, 0.072, 0], { color: '#c98a4a', name: 'cap', parent: 'bulb', piece: true })
      .cyl([0.022, 0.03, 0.022], [0, 0.095, 0], { color: '#b07438', taper: 0.3, parent: 'cap' })
      .act({ click: [[A.detach('cap', 'cap'), A.say('Chop!', 1)], [A.reattach('cap')]] })
      .done();
  }),
  // Golden battered onion rings piled in a red paper tray with a pot of ketchup; one comes away.
  e('onion rings', 'food', 'fried food', () => {
    const b = m('onion rings', { edge: 'sharp' })
      .box([0.2, 0.012, 0.13], [0, 0.006, 0], { color: '#e0473b', round: 0.3, name: 'tray' })
      .box([0.2, 0.05, 0.008], [0, 0.03, 0.063], { color: '#e0473b', round: 0.3, rot: [-15, 0, 0], parent: 'tray' })
      .box([0.2, 0.05, 0.008], [0, 0.03, -0.063], { color: '#e0473b', round: 0.3, rot: [15, 0, 0], parent: 'tray' })
      .box([0.17, 0.003, 0.11], [0, 0.013, 0], { color: '#f7f5ef', round: 0, noInk: true, parent: 'tray' });
    const ring = (at: Vec3, r: Vec3, d: number, c: string, o: PartOpts = {}) => b.torus([d, d, 0.02], at, { color: c, rot: r, tube: 0.3, edge: 'soft', parent: 'tray', ...o });
    ring([-0.04, 0.026, 0.0], [90, 0, 0], 0.08, 'crust');
    ring([0.035, 0.026, 0.01], [90, 0, 0], 0.075, 'bread');
    ring([-0.005, 0.045, -0.01], [80, 0, 15], 0.078, '#c98a3a');
    ring([0.0, 0.07, -0.03], [20, 0, 0], 0.082, 'crust', { name: 'ring', piece: true });
    return b
      .cyl([0.045, 0.03, 0.045], [0.12, 0.015, 0.04], { color: 'white' })
      .cyl([0.038, 0.006, 0.038], [0.12, 0.031, 0.04], { color: '#c0392b', edge: 'soft' })
      .act({ click: [[A.detach('ring', 'ring'), A.say('Crunch!', 1.2)], [A.reattach('ring')]] })
      .done();
  }),
  // A navel orange with a stalk and leaf, and half of another showing its segments. A squeeze squirts juice.
  e('orange', 'food', 'fruit', () => {
    const b = m('orange')
      .ball(0.08, [0, 0.04, 0], { color: 'orange', name: 'fruit' })
      .cyl([0.008, 0.01, 0.008], [0, 0.083, 0], { color: '#5a3a22', parent: 'fruit' })
      .ball([0.045, 0.004, 0.02], [0.02, 0.086, 0], { color: 'leaf', rot: [0, 20, 15], parent: 'fruit' })
      .cyl([0.074, 0.03, 0.074], [0.09, 0.015, 0.03], { color: 'orange', name: 'half' })
      .cyl([0.066, 0.004, 0.066], [0.09, 0.031, 0.03], { color: '#ffd27a', parent: 'half', edge: 'sharp' });
    b.each(8, (i) => b.box([0.03, 0.002, 0.002], [0.09 + Math.cos(i * 0.785) * 0.015, 0.0335, 0.03 + Math.sin(i * 0.785) * 0.015], { color: '#f6b04a', rot: [0, -i * 45, 0], noInk: true, parent: 'half' }));
    return b
      .ball(0.01, [0.09, 0.034, 0.03], { color: '#fff3d6', noInk: true, parent: 'half' })
      .act({ click: [[A.par(A.pose('half', { scale: 0.85, dur: 0.3 }), A.effect('water_spray', { dur: 0.8 }), A.say('Squirt!', 1.2)), A.pose('half', { scale: 1, dur: 0.3 })]] })
      .done();
  }),
  // A tall glass of orange juice with a slice of orange on the rim and a striped straw. A sip: slurp.
  e('orange juice', 'food', 'drinks', () =>
    m('orange juice')
      .cyl([0.07, 0.012, 0.07], [0, 0.006, 0], { color: 'glass', edge: 'sharp' })
      .cyl([0.068, 0.12, 0.068], [0, 0.072, 0], { color: '#f8a032', taper: 1.12, name: 'juice' })
      .cyl([0.078, 0.025, 0.078], [0, 0.1445, 0], { color: 'glass', taper: 1.02, edge: 'sharp' })
      .cyl([0.074, 0.004, 0.074], [0, 0.132, 0], { color: '#ffc06a', noInk: true })
      .ball(0.006, [0.012, 0.09, 0.034], { color: '#ffd27a', noInk: true })
      .ball(0.005, [-0.015, 0.06, 0.033], { color: '#ffd27a', noInk: true })
      .rod([0.012, 0.11, 0], [0.03, 0.23, -0.01], 0.008, '#e0473b', { name: 'straw' })
      .dome([0.065, 0.032, 0.012], [-0.04, 0.152, 0.0], { color: 'orange', rot: [0, 90, 0] })
      .dome([0.056, 0.026, 0.013], [-0.04, 0.154, 0.0], { color: '#ffd27a', rot: [0, 90, 0], noInk: true })
      .act({ click: [[A.par(A.pose('straw', { rot: [0, 0, -8], dur: 0.3 }), A.say('Slurp!', 1.5)), A.pose('juice', { scale: 0.96, dur: 0.6 }), A.pose('straw', { rot: [0, 0, 0], dur: 0.3 }), A.pose('juice', { scale: 1, dur: 0.4 })]] })
      .done(),
  ),
  // An orange tree, 5 m: a dark glossy crown hung with oranges. A shake drops one.
  e('orange tree', 'garden', 'fruit trees', () => withAct(tree('orange tree', { h: 5, crown: '#3f7a3a', crown2: '#4f8f45', fruit: 'orange', n: 20, fs: 0.11 }).done(), treeAct('orange'))),
  // A crystal orb on a gold claw stand: it glows and swirls with light when touched.
  e('orb', 'fantasy', 'magic items', () => {
    const b = m('orb').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#3a3040', edge: 'sharp' }).cyl([0.09, 0.03, 0.09], [0, 0.035, 0], { color: 'gold', taper: 0.7, edge: 'sharp' });
    b.each(4, (i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      b.rod([Math.cos(a) * 0.03, 0.045, Math.sin(a) * 0.03], [Math.cos(a) * 0.058, 0.1, Math.sin(a) * 0.058], 0.009, 'gold');
    });
    return b
      .ball(0.14, [0, 0.12, 0], { color: '#9a6fe0', name: 'orb', mover: { kind: 'light' } })
      .ball([0.05, 0.03, 0.02], [-0.025, 0.155, 0.06], { color: '#e8d8ff', noInk: true, parent: 'orb' })
      .ball([0.03, 0.02, 0.01], [0.03, 0.09, 0.062], { color: '#c8a8ff', noInk: true, parent: 'orb' })
      .act({
        click: [
          [A.par(A.operate('orb', 'on'), A.effect('sparkle', { dur: 2 }), A.say('Wooooo...', 2)), A.pose('orb', { rot: [0, 360, 0], dur: 1.5 }), A.pose('orb', { rot: [0, 0, 0], dur: 0 })],
          [A.operate('orb', 'off'), A.say('Fwoomp.', 1)],
        ],
      })
      .done();
  }),
  // An apple orchard (16 x 11 m): two rows of fruit trees on grass, a rail fence with a gate that opens, a ladder
  // against a tree and a crate of picked apples. A shaken tree drops an apple.
  e('orchard', 'farm', 'fields', () => {
    const b = m('orchard').box([16, 0.12, 11], [0, 0.06, 0], { color: 'grass', edge: 'soft' }).box([1.6, 0.13, 11], [0, 0.065, 0], { color: '#c8b58a', edge: 'soft' });
    let n = 0;
    for (const xx of [-5.5, -2.6, 2.6, 5.5])
      for (const z of [-2.8, 1.6]) {
        const nm = `tree${++n}`, h = 3.6 + ((n * 7) % 5) * 0.12;
        b.cyl([0.24, h * 0.5, 0.24], [xx, h * 0.25, z], { color: 'bark', taper: 0.75 });
        b.ball([2.6, h * 0.5, 2.6], [xx, h * 0.68, z], { color: n % 2 ? 'leaf' : '#4f9a48', name: nm, pivot: [xx, h * 0.4, z], edge: 'soft' });
        for (let i = 0; i < 6; i++) b.ball(0.12, [xx + Math.cos(i * 1.1 + n) * 1.15, h * (0.58 + (i % 3) * 0.08), z + Math.sin(i * 1.1 + n) * 1.0 + 0.3], { color: '#d23a30', parent: nm });
      }
    // fence along the front with a gate in the middle
    for (const s of [1, -1]) {
      b.each(6, (i) => b.box([0.12, 1.2, 0.12], [s * (1.0 + i * 1.4), 0.6, 5.3], { color: 'wood' }));
      b.box([7.2, 0.1, 0.06], [s * 4.55, 0.95, 5.33], { color: 'lightwood' }).box([7.2, 0.1, 0.06], [s * 4.55, 0.55, 5.33], { color: 'lightwood' });
    }
    b.box([1.9, 0.1, 0.05], [0, 0.95, 5.35], { color: 'lightwood', name: 'gate', pivot: [-0.95, 0.75, 5.35], mover: { kind: 'swing', axis: 'y', amount: -100 }, edge: 'sharp' })
      .box([1.9, 0.1, 0.05], [0, 0.55, 5.35], { color: 'lightwood', parent: 'gate', edge: 'sharp' })
      .rod([-0.8, 0.5, 5.35], [0.8, 1.0, 5.35], 0.06, 'lightwood', { parent: 'gate' });
    // ladder leaning on a tree, a crate of apples
    b.rod([-2.0, 0.12, 2.6], [-2.4, 2.6, 1.9], 0.06, 'lightwood').rod([-1.5, 0.12, 2.6], [-1.9, 2.6, 1.9], 0.06, 'lightwood');
    b.each(6, (i) => b.rod([-2.02 - i * 0.065, 0.45 + i * 0.37, 2.5 - i * 0.1], [-1.52 - i * 0.065, 0.45 + i * 0.37, 2.5 - i * 0.1], 0.04, 'lightwood'));
    b.box([0.6, 0.35, 0.45], [1.6, 0.3, 3.5], { color: 'lightwood', edge: 'sharp', round: 0.1 });
    b.each(5, (i) => b.ball(0.1, [1.4 + (i % 3) * 0.17, 0.5, 3.4 + Math.floor(i / 3) * 0.17], { color: '#d23a30' }));
    return b
      .act({
        click: [
          [A.operate('gate', 'open'), A.say('Creak...', 1.2), A.pose('tree3', { rot: [0, 0, 6], dur: 0.25 }), A.pose('tree3', { rot: [0, 0, -6], dur: 0.25 }), A.pose('tree3', { rot: [0, 0, 0], dur: 0.2 }), A.spawn('apple', 'apple', { rel: 'front', of: 'self', dist: 'close' }), A.anim('bounce', 1, 'apple'), A.wait(2), A.remove('apple', 'fade'), A.operate('gate', 'close')],
        ],
      })
      .done();
  }),
  // A lump of ore: rough rusty rock with a seam of metal crystals and a gold nugget that can be prised out.
  e('ore', 'nature', 'rocks', () =>
    m('ore')
      .ball([0.13, 0.08, 0.1], [0, 0.04, 0], { color: '#7a5a4a', name: 'rock' })
      .ball([0.08, 0.065, 0.075], [0.04, 0.062, -0.01], { color: '#8a6a58', parent: 'rock' })
      .ball([0.06, 0.045, 0.06], [-0.045, 0.035, 0.025], { color: '#6e5040', parent: 'rock' })
      .box([0.022, 0.026, 0.022], [-0.02, 0.075, 0.03], { color: 'silver', rot: [20, 30, 10], edge: 'sharp', parent: 'rock' })
      .box([0.016, 0.03, 0.016], [-0.005, 0.08, 0.025], { color: '#d4d7da', rot: [-10, 20, -15], edge: 'sharp', parent: 'rock' })
      .box([0.015, 0.018, 0.015], [-0.045, 0.05, 0.04], { color: 'silver', rot: [30, 10, 20], edge: 'sharp', parent: 'rock' })
      .ball([0.025, 0.015, 0.012], [0.01, 0.085, 0.02], { color: '#c87a4a', noInk: true, parent: 'rock' })
      .ball([0.024, 0.02, 0.02], [0.03, 0.06, 0.04], { color: 'gold', name: 'nugget', parent: 'rock', piece: true })
      .act({ click: [[A.par(A.detach('nugget', 'nugget'), A.effect('sparkle', { dur: 1.2 }), A.say('Clink!', 1))], [A.reattach('nugget')]] })
      .done(),
  ),
  // A church pipe organ, 5 m tall: a carved case with three towers of tin pipes (each with its mouth), a console
  // of three keyboards with stop knobs, a pedalboard and a bench. It plays a chord and notes rise from it.
  e('organ (music)', 'music', 'keyboards', () => {
    const b = m('organ (music)', { edge: 'sharp' })
      .box([4.2, 2.3, 1.5], [0, 1.15, -0.5], { color: 'darkwood', round: 0.05, name: 'case' })
      .box([4.4, 0.2, 1.7], [0, 2.4, -0.5], { color: '#5a3a22', round: 0.1 })
      .box([4.2, 2.9, 0.4], [0, 3.95, -1.05], { color: '#5a3a22', round: 0.03 });
    const tower = (cx: number, n: number, top: number, w: number) => {
      for (let i = 0; i < n; i++) {
        const xx = cx + (i - (n - 1) / 2) * w, h = top - Math.abs(i - (n - 1) / 2) * 0.35;
        b.cone([w * 0.8, 0.35, w * 0.8], [xx, 2.67, -0.75], { color: '#d4d7da', rot: [180, 0, 0] })
          .cyl([w * 0.8, h, w * 0.8], [xx, 2.85 + h / 2, -0.75], { color: '#d4d7da' })
          .box([w * 0.4, w * 0.5, 0.04], [xx, 3.1, -0.75 + w * 0.4], { color: '#2a2726', round: 0 });
      }
    };
    tower(0, 7, 2.2, 0.26);
    tower(-1.55, 5, 1.5, 0.22);
    tower(1.55, 5, 1.5, 0.22);
    b.box([4.4, 0.2, 0.6], [0, 5.5, -0.9], { color: '#5a3a22', round: 0.1 }).cone([0.6, 0.5, 0.6], [0, 5.85, -0.9], { color: 'gold', segs: 4 });
    // the console: three manuals stepping back, stop knobs, a music desk, the pedalboard and bench
    for (let i = 0; i < 3; i++) {
      b.box([2.0, 0.08, 0.26], [0, 0.82 + i * 0.13, 0.42 - i * 0.2], { color: 'darkwood', round: 0.2 });
      b.box([1.9, 0.03, 0.17], [0, 0.875 + i * 0.13, 0.48 - i * 0.2], { color: 'white', round: 0.1 });
      b.each(13, (k) => b.box([0.06, 0.02, 0.09], [-0.85 + k * 0.14, 0.9 + i * 0.13, 0.45 - i * 0.2], { color: '#2a2726', round: 0.1 }));
    }
    for (const s of [1, -1]) b.each(6, (k) => b.cyl([0.06, 0.08, 0.06], [s * (1.15 + (k % 2) * 0.14), 0.95 + Math.floor(k / 2) * 0.16, 0.3], { color: k % 3 ? 'white' : '#e0473b', rot: [90, 0, 0] }));
    b.box([0.9, 0.5, 0.04], [0, 1.45, 0.04], { color: 'darkwood', rot: [-12, 0, 0] })
      .box([0.5, 0.36, 0.02], [0, 1.47, 0.07], { color: 'paper', rot: [-12, 0, 0], round: 0 })
      .box([2.0, 0.08, 0.7], [0, 0.06, 0.75], { color: 'darkwood' });
    b.each(12, (k) => b.box([0.07, 0.05, 0.62], [-0.83 + k * 0.15, 0.12, 0.76], { color: k % 3 === 1 ? '#2a2726' : 'lightwood', round: 0.2 }));
    b.box([1.6, 0.07, 0.38], [0, 0.66, 1.2], { color: 'darkwood' }).box([0.07, 0.62, 0.36], [0.72, 0.32, 1.2], { color: 'darkwood' }).box([0.07, 0.62, 0.36], [-0.72, 0.32, 1.2], { color: 'darkwood' });
    return b
      .socket('bench', [0, 0.7, 1.2], 'seat')
      .act({ click: [[A.par(A.say('♪ Dum dum dum DUMMM! ♪', 2.5), A.anim('pulse')), A.spawn('note', 'musical note', { rel: 'above', of: 'self', dist: 'close' }), A.wait(2), A.remove('note', 'fly_away')]] })
      .done();
  }),
  // A glass Christmas bauble: red with a gold band and a shine, a gold cap and its hanging hook. It twirls.
  e('ornament', 'toys', 'holiday', () =>
    m('ornament')
      .ball(0.08, [0, 0.04, 0], { color: '#d42a2a', name: 'ball' })
      .torus([0.082, 0.082, 0.012], [0, 0.04, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.1, noInk: true, parent: 'ball' })
      .ball([0.022, 0.022, 0.01], [-0.015, 0.058, 0.035], { color: 'white', noInk: true, parent: 'ball' })
      .star(0.022, [0.0, 0.03, 0.04], { color: 'gold', parent: 'ball' })
      .cyl([0.024, 0.014, 0.024], [0, 0.085, 0], { color: 'gold', parent: 'ball', edge: 'sharp' })
      .arc([0.014, 0.012, 0.003], [0, 0.093, 0], { color: 'gold', arc: 300, tube: 0.25, parent: 'ball' })
      .arc([0.02, 0.03, 0.002], [0, 0.11, 0], { color: 'silver', arc: 200, tube: 0.12, rot: [0, 90, 180], parent: 'ball' })
      .act({ click: [[A.par(A.pose('ball', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1 }), A.say('Ting!', 1)), A.pose('ball', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A children's home: a big two-storey house (14 m wide) with a pitched roof, two chimneys, a porch over double
  // doors and a swing in the garden. The door opens and a child comes out to wave; the swing swings.
  e('orphanage', 'places', 'homes', () => {
    const b = bld('orphanage', { w: 14, d: 9, floors: 2, fh: 3.2, wall: '#e8d8b8', trim: 'white', roof: 'side', roofC: '#7a4b3a', roofH: 3.8, cross: true, door: '#4a6a8a', double: true, cols: 5, lamp: true });
    const H = 6.8;
    b.box([0.9, 2.4, 0.9], [-4.5, H + 2.6, -1.2], { color: '#a3322a', round: 0.05 }).box([1.1, 0.2, 1.1], [-4.5, H + 3.85, -1.2], { color: '#5c6166' })
      .box([0.9, 2.4, 0.9], [4.5, H + 2.6, -1.2], { color: '#a3322a', round: 0.05 }).box([1.1, 0.2, 1.1], [4.5, H + 3.85, -1.2], { color: '#5c6166' });
    // porch: a canopy on two white columns, with the home's name
    b.box([3.6, 0.2, 1.8], [0, 3.15, 5.4], { color: '#7a4b3a', round: 0.1, rot: [8, 0, 0] })
      .rod([1.6, 0.2, 6.1], [1.6, 3.0, 6.1], 0.18, 'white').rod([-1.6, 0.2, 6.1], [-1.6, 3.0, 6.1], 0.18, 'white')
      .label("CHILDREN'S HOME", [3.2, 0.4], [0, 2.8, 4.62], { color: 'cream', depth: 0.05 })
      .heart(0.7, [0, 6.6, 4.56], { color: '#e0473b' });
    // a swing in the garden
    b.rod([9.0, 0, 3.2], [9.0, 2.4, 2.5], 0.1, '#3f7a3a').rod([9.0, 0, 1.8], [9.0, 2.4, 2.5], 0.1, '#3f7a3a')
      .rod([11.2, 0, 3.2], [11.2, 2.4, 2.5], 0.1, '#3f7a3a').rod([11.2, 0, 1.8], [11.2, 2.4, 2.5], 0.1, '#3f7a3a')
      .stick([8.9, 2.4, 2.5], [11.3, 2.4, 2.5], 0.1, '#3f7a3a')
      .stick([9.7, 2.4, 2.5], [9.7, 0.5, 2.5], 0.025, 'gray', { name: 'swing', pivot: [10.1, 2.4, 2.5] })
      .stick([10.5, 2.4, 2.5], [10.5, 0.5, 2.5], 0.025, 'gray', { parent: 'swing' })
      .box([0.9, 0.05, 0.3], [10.1, 0.48, 2.5], { color: '#e0473b', parent: 'swing', edge: 'sharp' });
    return b
      .socket('swing', [10.1, 0.5, 2.5], 'seat', { part: 'swing' })
      .act({
        click: [
          [A.operate('door', 'open'), A.spawn('kid', 'child', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wave', 1, 'kid'), A.say('Hi there!', 2, 'kid')), A.wait(1.5), A.remove('kid', 'fade'), A.operate('door', 'close')],
          [A.pose('swing', { rot: [35, 0, 0], dur: 0.7 }), A.pose('swing', { rot: [-35, 0, 0], dur: 0.9 }), A.pose('swing', { rot: [25, 0, 0], dur: 0.8 }), A.pose('swing', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A storage ottoman at footstool height (0.45 m): a buttoned, piped upholstered lid on a hinge over a box on
  // turned wooden feet. The lid lifts to show a blanket inside.
  e('ottoman', 'home', 'seating', () => {
    const b = m('ottoman', { edge: 'soft' })
      .box([0.8, 0.3, 0.55], [0, 0.25, 0], { color: '#3f8f88', round: 0.25, name: 'base' })
      .box([0.82, 0.03, 0.57], [0, 0.38, 0], { color: '#2f6f6a', round: 0.5, parent: 'base' })
      .box([0.82, 0.1, 0.57], [0, 0.43, 0], { color: '#3fa7a0', round: 0.6, name: 'lid', parent: 'base', pivot: [0, 0.39, -0.28], mover: { kind: 'swing', axis: 'x', amount: -95 } });
    for (const [xx, z] of [[-0.24, -0.13], [0, -0.13], [0.24, -0.13], [-0.12, 0.1], [0.12, 0.1], [-0.36, 0.1], [0.36, 0.1]]) b.ball([0.03, 0.02, 0.03], [xx, 0.48, z], { color: '#2f6f6a', parent: 'lid' });
    b.box([0.7, 0.12, 0.45], [0, 0.32, 0], { color: '#e8c78a', parent: 'base', round: 0.5 });
    for (const [xx, z] of [[0.33, 0.21], [-0.33, 0.21], [0.33, -0.21], [-0.33, -0.21]]) b.cyl([0.06, 0.1, 0.06], [xx, 0.05, z], { color: 'darkwood', taper: 0.6, edge: 'sharp' });
    return b
      .socket('top', [0, 0.48, 0], 'top', { size: 0.5 })
      .socket('inside', [0, 0.3, 0], 'inside', { size: 0.4 })
      .act({ click: [[A.operate('lid', 'open'), A.say('Creak!', 1.2), A.wait(2), A.operate('lid', 'close'), A.say('Thump.', 1)]] })
      .done();
  }),
  // A put-together outfit worn by a person: a beret, a scarf, a smart coat, a bag. She shows it off with a twirl.
  e('outfit', 'wardrobe', 'outfits', () =>
    withAct(who('outfit', { top: '#c0392b', bottom: '#2f4f8f', shoes: 'white', long: true, pose: 'hips', acc: [hat('beret', 'black'), wear('scarf', '#f6d24a'), held('bag', 'tan', 'L')] }), {
      click: [[A.par(A.anim('spin'), A.say('Ta-da! My new outfit!', 2.2))], [says('thumbs_up', 'Looking good, right?')]],
    }),
  ),
  // A wooden privy (1.25 x 1.25 m, 2.3 m tall): plank walls, a sloping roof, a door with a crescent moon on a
  // hinge, a vent, and a seat inside. The door creaks open and bangs shut.
  e('outhouse', 'places', 'huts', () => {
    const b = m('outhouse', { edge: 'sharp' })
      .box([1.25, 2.1, 1.25], [0, 1.08, 0], { color: '#b5814e', round: 0.03, name: 'walls' })
      .box([1.55, 0.1, 1.65], [0, 2.25, 0], { color: '#5a3a22', rot: [-9, 0, 0], round: 0.2 })
      .box([1.3, 0.12, 1.3], [0, 0.06, 0], { color: '#7a5230' });
    b.each(5, (i) => b.box([0.02, 2.0, 0.02], [0.63, 1.05, -0.5 + i * 0.25], { color: '#8c5a2b', round: 0 }).box([0.02, 2.0, 0.02], [-0.63, 1.05, -0.5 + i * 0.25], { color: '#8c5a2b', round: 0 }));
    b.box([0.85, 1.9, 0.06], [0, 1.08, 0.66], { color: '#a0703f', name: 'door', pivot: [-0.425, 1.08, 0.66], mover: { kind: 'swing', axis: 'y', amount: -105 } })
      .arc([0.2, 0.2, 0.02], [0.02, 1.7, 0.69], { color: '#2a2726', arc: 200, tube: 0.4, rot: [0, 0, 90], parent: 'door', noInk: true })
      .box([0.8, 0.08, 0.03], [0, 1.45, 0.7], { color: '#8c5a2b', parent: 'door', rot: [0, 0, 30] })
      .box([0.08, 0.12, 0.05], [0.33, 1.05, 0.71], { color: 'iron', parent: 'door' })
      .box([0.05, 0.08, 0.05], [-0.4, 1.6, 0.7], { color: 'iron', parent: 'door' })
      .box([0.05, 0.08, 0.05], [-0.4, 0.5, 0.7], { color: 'iron', parent: 'door' })
      .box([1.1, 0.45, 0.6], [0, 0.35, -0.3], { color: '#8c5a2b' })
      .cyl([0.36, 0.04, 0.3], [0, 0.6, -0.3], { color: '#5a3a22' })
      .box([0.3, 0.12, 0.04], [0, 1.95, 0.64], { color: '#2a2726', round: 0 })
      .cyl([0.12, 0.11, 0.12], [0.45, 0.85, -0.55], { color: 'white', rot: [0, 0, 90], edge: 'soft' });
    return b
      .socket('seat', [0, 0.62, -0.3], 'seat')
      .act({ click: [[A.operate('door', 'open'), A.say('Creeeak...', 1.5), A.wait(2), A.operate('door', 'close'), A.par(A.anim('wobble'), A.say('BANG!', 1))]] })
      .done();
  }),
  // A frontier outpost: a square stockade of pointed logs (14 m), a double gate, a log cabin inside, and a
  // watchtower in the corner with a roof, a flag and a bell. The gate opens; the bell rings.
  e('outpost', 'places', 'forts', () => {
    const S = 14, h = 3.6;
    const b = m('outpost', { edge: 'soft' }).box([S + 2, 0.15, S + 2], [0, 0.075, 0], { color: 'dirt' });
    // each run of stockade: a wall of logs (one solid with log-coloured bands) topped by a row of sharpened points
    const logs = (x0: number, z0: number, x1: number, z1: number) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.5), along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      b.box(along ? [L, h, 0.42] : [0.42, h, L], [(x0 + x1) / 2, h / 2, (z0 + z1) / 2], { color: '#7a5230', round: 0.3 });
      for (let i = 0; i <= n; i++) {
        const t = i / n, xx = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        b.cone([0.46, 0.55, 0.46], [xx, h + 0.27 - (i % 3) * 0.08, z], { color: i % 2 ? '#a0703f' : '#8c5a2b' });
      }
    };
    logs(-S / 2, -S / 2, S / 2, -S / 2);
    logs(-S / 2, -S / 2, -S / 2, S / 2);
    logs(S / 2, -S / 2, S / 2, S / 2);
    logs(-S / 2, S / 2, -1.6, S / 2);
    logs(1.6, S / 2, S / 2, S / 2);
    // gate: two plank leaves on hinges, with a walkway and sign above
    b.box([1.55, 3.0, 0.15], [0.8, 1.6, S / 2], { color: '#7a5230', name: 'gateL', pivot: [1.55, 1.6, S / 2], mover: { kind: 'swing', axis: 'y', amount: 95 }, edge: 'sharp' })
      .box([1.55, 3.0, 0.15], [-0.8, 1.6, S / 2], { color: '#7a5230', name: 'gateR', pivot: [-1.55, 1.6, S / 2], mover: { kind: 'swing', axis: 'y', amount: -95 }, edge: 'sharp' })
      .box([1.5, 0.15, 0.1], [0.8, 2.3, S / 2 + 0.1], { color: '#5a3a22', parent: 'gateL', rot: [0, 0, 20], edge: 'sharp' })
      .box([1.5, 0.15, 0.1], [-0.8, 2.3, S / 2 + 0.1], { color: '#5a3a22', parent: 'gateR', rot: [0, 0, -20], edge: 'sharp' })
      .box([4.0, 0.25, 0.5], [0, 3.4, S / 2], { color: '#5a3a22', edge: 'sharp' })
      .label('FORT OUTPOST', [3.0, 0.5], [0, 3.85, S / 2 + 0.1], { color: '#f2e6cf', depth: 0.06, edge: 'sharp' });
    // log cabin with a door, a window and a chimney
    b.box([5, 2.6, 3.6], [-2.5, 1.38, -3.6], { color: '#8c5a2b', edge: 'sharp' });
    b.each(6, (i) => b.capsule([0.3, 5.2, 0.3], [-2.5, 0.3 + i * 0.42, -1.78], { color: i % 2 ? '#7a5230' : '#a0703f', rot: [0, 0, 90] }));
    gable(b, 5, 3.6, 2.68, 1.4, { roof: '#5a3a22', wall: '#8c5a2b', side: true, over: 0.35, cx: -2.5, cz: -3.6 });
    b.box([0.9, 1.9, 0.08], [-1.3, 1.1, -1.6], { color: '#5a3a22', edge: 'sharp' });
    win(b, [-3.6, 1.6, -1.62], 0.7, 0.6, { frame: '#5a3a22', cross: true });
    b.box([0.6, 1.6, 0.6], [-4.4, 3.8, -4.6], { color: 'stone', edge: 'sharp' });
    // the watchtower: four posts, a platform with a rail, a pyramid roof, a bell and a flag
    const tx = 4.8, tz = -4.8;
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.stick([tx + dx * 1.1, 0, tz + dz * 1.1], [tx + dx * 1.0, 6.4, tz + dz * 1.0], 0.25, '#7a5230');
    b.box([2.8, 0.2, 2.8], [tx, 5.0, tz], { color: '#a0703f', edge: 'sharp' })
      .box([2.8, 0.9, 0.1], [tx, 5.55, tz + 1.35], { color: '#8c5a2b', edge: 'sharp' })
      .box([0.1, 0.9, 2.8], [tx + 1.35, 5.55, tz], { color: '#8c5a2b', edge: 'sharp' })
      .pyramid([3.4 * Math.SQRT2, 1.4, 3.4 * Math.SQRT2], [tx, 7.1, tz], 4, { color: '#5a3a22', edge: 'sharp' })
      .stick([tx, 7.8, tz], [tx, 10, tz], 0.08, 'darkwood')
      .box([1.3, 0.8, 0.04], [tx + 0.68, 9.55, tz], { color: '#e0473b', name: 'flag', pivot: [tx, 9.55, tz], edge: 'sharp' })
      .cyl([0.4, 0.45, 0.4], [tx, 6.0, tz], { color: 'bronze', taper: 0.6, name: 'bell', pivot: [tx, 6.3, tz], edge: 'sharp' })
      .rod([tx - 0.6, 3.2, tz + 1.15], [tx - 0.6, 5.0, tz + 1.15], 0.05, 'wood');
    return b
      .act({
        click: [
          [A.operate('gate', 'open'), A.say('Creak...', 1.5), A.wait(2.5), A.operate('gate', 'close')],
          [A.par(A.pose('bell', { rot: [0, 0, 30], dur: 0.3 }), A.say('Clang! Clang!', 2)), A.pose('bell', { rot: [0, 0, -30], dur: 0.4 }), A.pose('bell', { rot: [0, 0, 20], dur: 0.4 }), A.par(A.pose('bell', { rot: [0, 0, 0], dur: 0.3 }), A.pose('flag', { rot: [0, 25, 0], dur: 0.6 })), A.pose('flag', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // An oval: a flat ellipse standing on a little stand. It turns round to show off its shape.
  e('oval', 'ideas', 'shapes', () =>
    plinth(m('oval'), 0.2, 0.03)
      .cyl([0.28, 0.025, 0.18], [0, 0.125, 0], { color: '#4e8fd6', rot: [90, 0, 0], name: 'oval', edge: 'sharp' })
      .cyl([0.22, 0.03, 0.13], [0, 0.125, 0], { color: '#7fb0e6', rot: [90, 0, 0], parent: 'oval', noInk: true })
      .act({ click: [[A.par(A.pose('oval', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('oval', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // Denim bib overalls on a farmer in a straw hat, with a pitchfork.
  e('overalls', 'wardrobe', 'outfits', () =>
    withAct(who('overalls', { top: '#c0392b', bottom: 'denim', shoes: 'brown', pose: 'hold', acc: [wear('overalls', 'denim'), hat('straw'), held('pitchfork')] }), {
      click: [[says('thumbs_up', 'Overalls: made for hard work!')], [says('wave', 'Howdy!')]],
    }),
  ),
  // A baby's dummy (6 cm): a butterfly-shaped shield with air holes, a soft teat and a ring to hold it by.
  e('pacifier', 'home', 'baby things', () =>
    m('pacifier')
      .ball([0.06, 0.04, 0.012], [0, 0.03, 0], { color: '#8fc6f0', name: 'shield' })
      .ball(0.008, [0.018, 0.03, 0.006], { color: '#5a8fc0', noInk: true, parent: 'shield' })
      .ball(0.008, [-0.018, 0.03, 0.006], { color: '#5a8fc0', noInk: true, parent: 'shield' })
      .capsule([0.016, 0.03, 0.016], [0, 0.03, -0.018], { color: '#f3e6c0', rot: [90, 0, 0], parent: 'shield' })
      .cyl([0.022, 0.01, 0.022], [0, 0.03, 0.009], { color: 'white', rot: [90, 0, 0], parent: 'shield' })
      .torus([0.036, 0.036, 0.007], [0, 0.03, 0.022], { color: 'white', rot: [0, 0, 0], tube: 0.22, parent: 'shield' })
      .act({ click: [[A.par(A.anim('wobble'), A.say('Squeak!', 1))]] })
      .done(),
  ),
  // A cardboard parcel (40 cm): tape over the seam, a shipping label, flaps that open to show a teddy inside.
  e('package', 'home', 'parcels and bags', () =>
    m('package', { edge: 'sharp' })
      .box([0.4, 0.28, 0.3], [0, 0.14, 0], { color: '#c8955a', round: 0.06, name: 'box' })
      .box([0.4, 0.012, 0.15], [0, 0.285, 0.075], { color: '#c8955a', round: 0.1, name: 'flapF', parent: 'box', pivot: [0, 0.285, 0.15], mover: { kind: 'swing', axis: 'x', amount: 120 } })
      .box([0.4, 0.012, 0.15], [0, 0.285, -0.075], { color: '#c8955a', round: 0.1, name: 'flapB', parent: 'box', pivot: [0, 0.285, -0.15], mover: { kind: 'swing', axis: 'x', amount: -120 } })
      .box([0.07, 0.004, 0.15], [0, 0.292, 0.075], { color: '#e8c78a', parent: 'flapF', round: 0, noInk: true })
      .box([0.07, 0.004, 0.15], [0, 0.292, -0.075], { color: '#e8c78a', parent: 'flapB', round: 0, noInk: true })
      .box([0.07, 0.1, 0.004], [0, 0.24, 0.151], { color: '#e8c78a', parent: 'box', round: 0, noInk: true })
      .label('TO: YOU', [0.14, 0.08], [0.1, 0.12, 0.151], { color: 'white', parent: 'box', depth: 0.003 })
      .label('THIS WAY UP', [0.12, 0.04], [-0.12, 0.2, 0.151], { color: '#e0473b', parent: 'box', depth: 0.003 })
      .socket('inside', [0, 0.16, 0], 'inside', { size: 0.25 })
      .act({
        click: [
          [A.operate('flap', 'open'), A.spawn('gift', 'teddy bear', { rel: 'on', of: 'self', dist: 'touch' }), A.par(A.anim('hop', 1, 'gift'), A.effect('sparkle', { dur: 1.2 }))],
          [A.remove('gift', 'sink'), A.operate('flap', 'close')],
        ],
      })
      .done(),
  ),
  // A pillow-shaped snack packet with crimped seals and a bright logo. Shake it, pop it open.
  e('packet', 'food', 'snacks', () =>
    m('packet')
      .box([0.16, 0.22, 0.05], [0, 0.12, 0], { color: '#e0473b', round: 0.95, name: 'bag' })
      .box([0.16, 0.018, 0.012], [0, 0.232, 0], { color: '#f07060', round: 0.2, parent: 'bag', edge: 'sharp' })
      .box([0.16, 0.018, 0.012], [0, 0.009, 0], { color: '#f07060', round: 0.2, parent: 'bag', edge: 'sharp' })
      .ball([0.09, 0.07, 0.01], [0, 0.14, 0.024], { color: '#f6d24a', noInk: true, parent: 'bag' })
      .label('CRUNCH', [0.1, 0.03], [0, 0.14, 0.03], { color: '#f6d24a', parent: 'bag', depth: 0.003 })
      .ball([0.04, 0.03, 0.008], [0.03, 0.07, 0.022], { color: '#e8b070', noInk: true, parent: 'bag' })
      .act({
        click: [
          [A.par(A.anim('shake'), A.say('Rustle rustle...', 1.5))],
          [A.say('POP!', 1), A.spawn('chips', 'potato chips', { rel: 'front', of: 'self', dist: 'touch' }), A.wait(2), A.remove('chips', 'fade')],
        ],
      })
      .done(),
  ),
  // A foam packing peanut: a squashed S of white polystyrene, 4 cm long. It squeaks.
  e('packing peanut', 'home', 'parcels and bags', () =>
    m('packing peanut')
      .capsule([0.016, 0.03, 0.014], [0.006, 0.014, 0], { color: '#f4f4ef', rot: [0, 0, 25], name: 'nut' })
      .capsule([0.016, 0.03, 0.014], [0.006, 0.036, 0], { color: '#f4f4ef', rot: [0, 0, -25], parent: 'nut' })
      .ball([0.018, 0.016, 0.015], [0.0, 0.025, 0], { color: '#ecece4', parent: 'nut' })
      .act({ click: [[A.par(A.anim('hop'), A.say('Squeak!', 1))]] })
      .done(),
  ),
  // A wooden canoe paddle, 1.4 m: a T-grip, a long shaft and a broad blade, standing on its blade. It takes a stroke.
  e('paddle', 'sports', 'boating', () =>
    m('paddle')
      .ball([0.2, 0.5, 0.025], [0, 0.27, 0], { color: 'wood', name: 'paddle', pivot: [0, 0.7, 0] })
      .box([0.012, 0.42, 0.03], [0, 0.29, 0], { color: 'darkwood', parent: 'paddle', round: 0.5 })
      .stick([0, 0.45, 0], [0, 1.32, 0], 0.032, 'lightwood', { parent: 'paddle' })
      .capsule([0.04, 0.13, 0.035], [0, 1.36, 0], { color: 'darkwood', rot: [0, 0, 90], parent: 'paddle' })
      .act({ click: [[A.pose('paddle', { rot: [35, 0, 0], dur: 0.5 }), A.par(A.pose('paddle', { rot: [-25, 0, 0], dur: 0.6 }), A.effect('water_spray', { dur: 0.8 }), A.say('Splash!', 1)), A.pose('paddle', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A brass padlock with a steel shackle and a keyhole: a key turns, the shackle springs up; then it clicks shut.
  e('padlock', 'workshop', 'hardware', () =>
    m('padlock', { edge: 'sharp' })
      .box([0.065, 0.056, 0.026], [0, 0.028, 0], { color: 'brass', round: 0.35, name: 'body' })
      .arc([0.05, 0.05, 0.011], [0, 0.056, 0], { color: 'steel', tube: 0.28, name: 'shackle', parent: 'body', mover: { kind: 'slide', axis: 'y', amount: 0.018 }, edge: 'soft' })
      .rod([0.0195, 0.04, 0], [0.0195, 0.058, 0], 0.011, 'steel', { parent: 'shackle' })
      .rod([-0.0195, 0.04, 0], [-0.0195, 0.058, 0], 0.011, 'steel', { parent: 'shackle' })
      .ball([0.011, 0.011, 0.004], [0, 0.032, 0.013], { color: '#2a2726', noInk: true, parent: 'body' })
      .box([0.004, 0.012, 0.004], [0, 0.023, 0.013], { color: '#2a2726', noInk: true, parent: 'body' })
      .act({
        click: [
          [A.spawn('key', 'key', { rel: 'front', of: 'self', dist: 'touch' }), A.operate('shackle', 'up'), A.say('Click!', 1), A.remove('key', 'fade')],
          [A.operate('shackle', 'down'), A.say('Clack.', 1)],
        ],
      })
      .done(),
  ),
  // A disc brake: a vented steel rotor on its hub, and a red calliper gripping it with the brake pads inside.
  // The disc spins, then the pads bite and it stops with a screech.
  e('pads', 'garage', 'car parts', () =>
    m('pads', { edge: 'sharp' })
      .box([0.2, 0.04, 0.16], [0, 0.02, 0], { color: '#5c6166', round: 0.2 })
      .rod([0, 0.04, 0], [0, 0.17, -0.02], 0.05, '#5c6166')
      .cyl([0.3, 0.028, 0.3], [0, 0.2, 0], { color: '#9da3a8', rot: [90, 0, 0], name: 'disc', mover: { kind: 'spin', axis: 'z', amount: 600 } })
      .cyl([0.15, 0.05, 0.15], [0, 0.2, 0.02], { color: '#5c6166', rot: [90, 0, 0], parent: 'disc' })
      .cyl([0.22, 0.03, 0.22], [0, 0.2, 0.002], { color: '#b9c2ca', rot: [90, 0, 0], parent: 'disc', noInk: true })
      .box([0.13, 0.09, 0.09], [0.1, 0.31, 0], { color: '#e0473b', rot: [0, 0, -30], round: 0.4 })
      .box([0.1, 0.06, 0.012], [0.09, 0.3, 0.022], { color: '#3a3633', rot: [0, 0, -30], name: 'pad', round: 0.2 })
      .box([0.1, 0.06, 0.012], [0.09, 0.3, -0.022], { color: '#3a3633', rot: [0, 0, -30], round: 0.2 })
      .label('BRAKE', [0.07, 0.02], [0.1, 0.31, 0.046], { color: '#e0473b', rot: [0, 0, -30], depth: 0.003 })
      .act({ click: [[A.operate('disc', 'on'), A.say('Whirrr...', 1.5), A.wait(1.5), A.par(A.operate('disc', 'off'), A.anim('shake'), A.say('SCREEECH!', 1.5))]] })
      .done(),
  ),
  // A pager: a black pocket beeper with a little green screen, three buttons and a belt clip. It beeps.
  e('pager', 'tech', 'gadgets', () =>
    m('pager', { edge: 'sharp' })
      .box([0.07, 0.05, 0.022], [0, 0.025, 0], { color: '#2a2726', round: 0.4 })
      .box([0.052, 0.02, 0.004], [0, 0.033, 0.011], { color: '#9fe08a', name: 'screen', mover: { kind: 'light' }, round: 0.1 })
      .box([0.04, 0.004, 0.002], [0, 0.035, 0.0135], { color: '#3a5a30', noInk: true, round: 0 })
      .cyl([0.009, 0.004, 0.009], [-0.018, 0.012, 0.011], { color: '#9da3a8', rot: [90, 0, 0] })
      .cyl([0.009, 0.004, 0.009], [0, 0.012, 0.011], { color: '#9da3a8', rot: [90, 0, 0] })
      .cyl([0.009, 0.004, 0.009], [0.018, 0.012, 0.011], { color: '#e0473b', rot: [90, 0, 0] })
      .box([0.03, 0.04, 0.005], [0, 0.03, -0.014], { color: '#5c6166', round: 0.2 })
      .act({ click: [[A.par(A.operate('screen', 'on'), A.anim('shake'), A.say('Beep beep beep!', 1.5)), A.wait(1.5), A.operate('screen', 'off')]] })
      .done(),
  ),
  // A five-tier pagoda, 21 m: a stone base with steps, red storeys with corner posts and doors on every side,
  // dark tiled eaves with upturned corners, balconies, a spire of nine rings, and wind bells under the first eave.
  e('pagoda', 'places', 'landmarks', () => {
    const b = m('pagoda', { edge: 'sharp' }).box([10, 0.8, 10], [0, 0.4, 0], { color: 'stone', round: 0.05 }).box([3.2, 0.4, 1.4], [0, 0.2, 5.6], { color: 'stone' });
    let y = 0.8;
    const R2 = Math.SQRT2;
    for (let i = 0; i < 5; i++) {
      const w = 6.2 - i * 0.85, wh = i ? 2.6 : 3.4;
      b.box([w, wh, w], [0, y + wh / 2, 0], { color: '#b8402f', round: 0.02 });
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box([0.3, wh, 0.3], [sx * (w / 2), y + wh / 2, sz * (w / 2)], { color: '#8a2b2a', round: 0.2 });
      for (const [fx, fz, ry] of [[0, 1, 0], [1, 0, 90], [-1, 0, 90], [0, -1, 0]] as Array<[number, number, number]>)
        if (!(i === 0 && fz === 1)) b.box([1.1, Math.min(1.9, wh * 0.7), 0.08], [fx * (w / 2 + 0.03), y + wh * 0.42, fz * (w / 2 + 0.03)], { color: i % 2 ? '#e2b23a' : '#3a3633', rot: [0, ry, 0], round: 0.1 });
      if (i > 0) b.box([w + 0.6, 0.5, w + 0.6], [0, y + 0.25, 0], { color: '#8a2b2a', round: 0.1 }).box([w + 0.7, 0.1, w + 0.7], [0, y + 0.55, 0], { color: '#3a3633', round: 0.2 });
      // the eave: a shallow dark pyramid frustum with upturned corner tips
      const ew = w + 2.6;
      b.box([w + 0.6, 0.3, w + 0.6], [0, y + wh + 0.15, 0], { color: '#3a3633', round: 0.1 })
        .cyl([ew * R2, 0.7, ew * R2], [0, y + wh + 0.55, 0], { color: '#3a4a5a', segs: 4, taper: 0.4 });
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        b.cone([0.5, 0.8, 0.5], [sx * (ew / 2 - 0.15), y + wh + 0.5, sz * (ew / 2 - 0.15)], { color: '#3a4a5a', rot: [sz * 35, 0, -sx * 35] });
        if (i === 0) {
          const n = `bell${sx > 0 ? (sz > 0 ? 1 : 2) : sz > 0 ? 3 : 4}`;
          b.cyl([0.3, 0.35, 0.3], [sx * (ew / 2 - 0.3), y + wh - 0.05, sz * (ew / 2 - 0.3)], { color: 'gold', taper: 0.5, name: n, pivot: [sx * (ew / 2 - 0.3), y + wh + 0.2, sz * (ew / 2 - 0.3)] });
        }
      }
      y += wh + 1.1;
    }
    b.box([1.1, 2.1, 0.08], [0, 0.8 + 1.05, 3.1 + 0.05], { color: '#3a3633', name: 'door', pivot: [-0.55, 1.85, 3.15], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .ball(0.08, [0.4, 1.8, 3.21], { color: 'gold', parent: 'door' })
      .cyl([0.25, 4.8, 0.25], [0, y + 2.1, 0], { color: 'gold' })
      .cyl([1.2, 0.5, 1.2], [0, y - 0.2, 0], { color: 'gold', taper: 0.6 });
    b.each(9, (i) => b.torus([0.8 - i * 0.04, 0.8 - i * 0.04, 0.1], [0, y + 0.6 + i * 0.36, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.18, edge: 'soft' }));
    return b
      .ball(0.6, [0, y + 4.7, 0], { color: 'gold', edge: 'soft' })
      .act({
        click: [
          [A.par(A.pose('bell1', { rot: [20, 0, 15], dur: 0.4 }), A.pose('bell2', { rot: [-20, 0, 15], dur: 0.4 }), A.pose('bell3', { rot: [20, 0, -15], dur: 0.4 }), A.pose('bell4', { rot: [-15, 0, -20], dur: 0.4 }), A.say('Ting-a-ling...', 2)), A.par(A.pose('bell1', { rot: [-15, 0, -10], dur: 0.5 }), A.pose('bell2', { rot: [15, 0, -10], dur: 0.5 }), A.pose('bell3', { rot: [-15, 0, 10], dur: 0.5 }), A.pose('bell4', { rot: [15, 0, 10], dur: 0.5 })), A.par(A.pose('bell1', { rot: [0, 0, 0], dur: 0.6 }), A.pose('bell2', { rot: [0, 0, 0], dur: 0.6 }), A.pose('bell3', { rot: [0, 0, 0], dur: 0.6 }), A.pose('bell4', { rot: [0, 0, 0], dur: 0.6 }))],
          [A.operate('door', 'open'), A.say('Gong!', 1.5), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A one-litre tin of house paint: a rolled rim, a lid that prises off, a wire bail handle and drips down the side.
  e('paint', 'workshop', 'paint', () =>
    m('paint', { edge: 'sharp' })
      .cyl([0.17, 0.19, 0.17], [0, 0.095, 0], { color: 'silver', name: 'tin' })
      .cyl([0.172, 0.1, 0.172], [0, 0.09, 0], { color: '#4e8fd6', noInk: true, parent: 'tin' })
      .label('PAINT', [0.09, 0.04], [0, 0.1, 0.087], { color: 'white', parent: 'tin', depth: 0.003 })
      .torus([0.172, 0.172, 0.012], [0, 0.19, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.08, parent: 'tin' })
      .cyl([0.16, 0.012, 0.16], [0, 0.196, 0], { color: '#c9ccd1', name: 'lid', parent: 'tin', piece: true })
      .capsule([0.018, 0.09, 0.008], [0.06, 0.15, 0.062], { color: '#4e8fd6', noInk: true, parent: 'tin', edge: 'soft', rot: [0, 45, 0] })
      .arc([0.19, 0.14, 0.004], [0, 0.12, 0], { color: '#8f99a3', rot: [0, 90, 0], tube: 0.04, parent: 'tin' })
      .act({ click: [[A.detach('lid', 'lid'), A.say('Pop!', 1)], [A.reattach('lid'), A.say('Tap tap.', 1)]] })
      .done(),
  ),
  // An artist's brush, 25 cm: a long lacquered handle, a crimped silver ferrule and a tuft of bristles dipped in
  // blue. It makes a stroke.
  e('paint brush', 'study', 'art supplies', () =>
    m('paint brush')
      .cyl([0.012, 0.15, 0.012], [0, 0.075, 0], { color: '#c0392b', taper: 1.6, name: 'brush', pivot: [0, 0, 0], edge: 'sharp' })
      .cyl([0.014, 0.04, 0.014], [0, 0.17, 0], { color: 'silver', parent: 'brush', edge: 'sharp' })
      .torus([0.016, 0.016, 0.004], [0, 0.16, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.3, parent: 'brush' })
      .cyl([0.015, 0.035, 0.012], [0, 0.205, 0], { color: 'tan', taper: 0.7, parent: 'brush' })
      .cone([0.011, 0.025, 0.009], [0, 0.235, 0], { color: '#4e8fd6', parent: 'brush' })
      .cyl([0.04, 0.005, 0.04], [0, 0.0025, 0], { color: '#3a3633', edge: 'sharp' })
      .act({ click: [[A.pose('brush', { rot: [0, 0, 25], dur: 0.3 }), A.par(A.pose('brush', { rot: [0, 0, -25], dur: 0.4 }), A.say('Swish!', 1)), A.pose('brush', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A paint roller (23 cm sleeve) on its bent wire frame with a grip, resting in a tray of paint. It rolls.
  e('paint roller', 'workshop', 'paint', () =>
    m('paint roller')
      .box([0.34, 0.03, 0.36], [0, 0.015, 0], { color: '#9da3a8', round: 0.2, edge: 'sharp' })
      .box([0.3, 0.06, 0.03], [0, 0.04, -0.17], { color: '#9da3a8', round: 0.2, edge: 'sharp' })
      .box([0.3, 0.01, 0.18], [0, 0.034, -0.07], { color: '#4e8fd6', round: 0, noInk: true })
      .cyl([0.065, 0.23, 0.065], [0, 0.07, 0.08], { color: '#a8d8f5', rot: [0, 0, 90], name: 'roller', mover: { kind: 'spin', axis: 'x', amount: 500 } })
      .cyl([0.068, 0.22, 0.068], [0, 0.07, 0.08], { color: '#7fb0e6', rot: [0, 0, 90], parent: 'roller', noInk: true })
      .rod([0.125, 0.07, 0.08], [0.15, 0.07, 0.08], 0.008, 'silver')
      .rod([0.15, 0.07, 0.08], [0.15, 0.2, 0.12], 0.008, 'silver')
      .rod([0.15, 0.2, 0.12], [0.02, 0.25, 0.2], 0.008, 'silver')
      .capsule([0.035, 0.15, 0.035], [-0.03, 0.29, 0.25], { color: '#f6d24a', rot: [55, 0, 40] })
      .act({ click: [[A.par(A.operate('roller', 'on'), A.say('Shhhk shhhk...', 2)), A.wait(2), A.operate('roller', 'off')]] })
      .done(),
  ),
  // A paintball marker (0.8 m): a body with a grip and trigger guard, a long barrel, a hopper of paintballs on
  // top and an air tank as the stock. It fires: pop, recoil, splat.
  e('paintball gun', 'sports', 'paintball', () =>
    m('paintball gun', { view: 'side', edge: 'sharp' })
      .box([0.05, 0.1, 0.28], [0, 0.2, 0], { color: '#2a2726', round: 0.3, name: 'body' })
      .stick([0, 0.21, 0.14], [0, 0.21, 0.5], 0.032, '#5c6166', { parent: 'body' })
      .cyl([0.04, 0.02, 0.04], [0, 0.21, 0.5], { color: '#2a2726', rot: [90, 0, 0], parent: 'body' })
      .box([0.04, 0.13, 0.05], [0, 0.1, 0.0], { color: '#3a3633', rot: [-15, 0, 0], parent: 'body', round: 0.4 })
      .arc([0.07, 0.06, 0.012], [0, 0.14, 0.07], { color: '#2a2726', rot: [180, 90, 0], tube: 0.25, parent: 'body' })
      .box([0.008, 0.04, 0.01], [0, 0.135, 0.06], { color: 'silver', parent: 'body' })
      .cyl([0.035, 0.05, 0.035], [0, 0.27, 0.04], { color: '#2a2726', parent: 'body' })
      .ball([0.13, 0.15, 0.15], [0, 0.36, 0.03], { color: '#f6d24a', parent: 'body', edge: 'soft' })
      .ball(0.04, [0.04, 0.37, 0.07], { color: '#e0473b', noInk: true, parent: 'body', edge: 'soft' })
      .ball(0.04, [-0.03, 0.39, 0.0], { color: '#4e8fd6', noInk: true, parent: 'body', edge: 'soft' })
      .cyl([0.075, 0.24, 0.075], [0, 0.18, -0.27], { color: '#4e8fd6', rot: [90, 0, 0], parent: 'body', edge: 'soft' })
      .cyl([0.03, 0.03, 0.03], [0, 0.18, -0.14], { color: 'silver', rot: [90, 0, 0], parent: 'body' })
      .act({ click: [[A.par(A.pose('body', { move: [0, 0, -0.04], dur: 0.08 }), A.say('Pop!', 1)), A.pose('body', { move: [0, 0, 0], dur: 0.2 }), A.par(A.pose('body', { move: [0, 0, -0.04], dur: 0.08 }), A.say('Pop! Splat!', 1.5)), A.pose('body', { move: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // Striped flannel pyjamas and a nightcap, on someone ready for bed: a big stretch and a yawn.
  e('pajamas', 'wardrobe', 'outfits', () =>
    withAct(who('pajamas', { top: '#8fc6f0', bottom: '#8fc6f0', shoes: '#f4a1c0', long: true, style: 'short', acc: [hat('santa', '#8fc6f0'), held('book', '#c0392b', 'L')] }), {
      click: [[A.par(A.anim('arms_up'), A.say('Yaaawn... bedtime!', 2.2)), A.expr('sleepy')], [A.expr('happy'), says('wave', 'Good night, sleep tight!')]],
    }),
  ),
  // A royal palace (44 m wide): a terrace with steps, a central block behind a columned portico and pediment,
  // a drum and copper dome with a lantern and the royal flag, two wings with tall capped windows and balustrades,
  // and grand double doors. The doors open and the queen comes out to greet you.
  e('palace', 'places', 'castles', () => {
    const b = m('palace', { edge: 'sharp' })
      .box([46, 1.0, 20], [0, 0.5, 0], { color: '#c9c2b0', round: 0.02 })
      .box([12, 0.5, 2.4], [0, 0.25, 11.0], { color: '#c9c2b0' })
      .box([10, 0.5, 1.2], [0, 0.75, 10.4], { color: '#c9c2b0' });
    const wall = '#f2e6cf', trim = 'white', glass = '#9fc4d8';
    // central block
    b.box([14, 13, 14], [0, 7.5, 0], { color: wall, round: 0.01, name: 'walls' })
      .box([14.6, 0.6, 14.6], [0, 14.3, 0], { color: trim })
      .box([14, 0.3, 14], [0, 5.2, 0], { color: trim });
    // portico: six columns, an entablature and a pediment
    b.each(6, (i) => b.cyl([0.95, 8.6, 0.95], [-5 + i * 2, 5.3, 8.3], { color: trim, segs: 12 }).box([1.2, 0.4, 1.2], [-5 + i * 2, 1.2, 8.3], { color: trim }).box([1.2, 0.4, 1.2], [-5 + i * 2, 9.6, 8.3], { color: trim }));
    b.box([12.6, 1.0, 2.6], [0, 10.3, 8.0], { color: trim })
      .wedge([13.0, 2.6, 2.6], [0, 12.1, 8.0], { color: wall })
      .box([13.4, 0.3, 2.8], [0, 10.85, 8.0], { color: trim })
      .cyl([1.2, 0.2, 1.2], [0, 11.9, 9.35], { color: 'gold', rot: [90, 0, 0] });
    // grand double doors with a fanlight
    b.box([3.4, 4.6, 0.2], [0, 3.3, 7.03], { color: trim })
      .box([1.45, 4.0, 0.1], [0.75, 3.0, 7.15], { color: '#5a2a2a', name: 'doorL', pivot: [1.5, 3.0, 7.15], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([1.45, 4.0, 0.1], [-0.75, 3.0, 7.15], { color: '#5a2a2a', name: 'doorR', pivot: [-1.5, 3.0, 7.15], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .ball(0.15, [0.15, 2.6, 7.22], { color: 'gold', parent: 'doorL' })
      .ball(0.15, [-0.15, 2.6, 7.22], { color: 'gold', parent: 'doorR' })
      .dome([2.9, 1.2, 0.1], [0, 5.1, 7.1], { color: glass });
    for (const xx of [-4, 4]) for (const yy of [3.4, 8.2]) win(b, [xx, yy, 7], 1.4, 2.4, { frame: trim, glass, cross: true });
    // drum, dome, lantern, flag
    b.cyl([9, 3.2, 9], [0, 16.2, -1], { color: wall, segs: 16 })
      .cyl([9.6, 0.4, 9.6], [0, 17.9, -1], { color: trim, segs: 16 })
      .dome([9.2, 6.2, 9.2], [0, 18.1, -1], { color: '#5fa89a', edge: 'soft' })
      .cyl([1.8, 2.0, 1.8], [0, 25.0, -1], { color: wall, segs: 8 })
      .dome([2.0, 1.2, 2.0], [0, 26.0, -1], { color: 'gold', edge: 'soft' })
      .stick([0, 27, -1], [0, 31, -1], 0.12, 'gold')
      .box([2.4, 1.5, 0.05], [1.25, 30.1, -1], { color: '#a3322a', name: 'flag', pivot: [0, 30.1, -1] })
      .star(0.9, [1.25, 30.1, -0.95], { color: 'gold', parent: 'flag' });
    b.each(8, (i) => win(b, [Math.cos((i / 8) * Math.PI * 2) * 4.55, 16.2, -1 + Math.sin((i / 8) * Math.PI * 2) * 4.55], 0.8, 1.6, { face: 'front', frame: trim, glass, sill: false }));
    // the wings
    for (const s of [1, -1]) {
      const cx = s * 15;
      b.box([16, 9.4, 11], [cx, 5.7, -0.5], { color: wall, round: 0.01 })
        .box([16.4, 0.5, 11.4], [cx, 10.6, -0.5], { color: trim })
        .box([16, 0.25, 11], [cx, 5.2, -0.5], { color: trim })
        .box([16.2, 0.9, 0.3], [cx, 11.3, 4.95], { color: trim })
        .box([0.3, 0.9, 11.2], [cx + s * 8.0, 11.3, -0.5], { color: trim });
      for (let k = 0; k < 9; k++) b.cyl([0.22, 0.6, 0.22], [cx - 7.6 + k * 1.9, 11.2, 5.05], { color: trim, segs: 8 });
      for (const fy of [3.1, 7.8])
        for (let c = 0; c < 4; c++) {
          const wx = cx + (c - 1.5) * 3.6;
          win(b, [wx, fy, 5.0], 1.3, 2.3, { frame: trim, glass, cross: true });
          b.wedge([1.9, 0.5, 0.25], [wx, fy + 1.5, 5.1], { color: trim });
        }
      b.box([2.6, 10.6, 11.6], [cx + s * 7.4, 6.3, -0.5], { color: '#ece0c6', round: 0.01 })
        .pyramid([3.0 * Math.SQRT2, 2.4, 3.0 * Math.SQRT2], [cx + s * 7.4, 12.8, 3.0], 4, { color: '#5fa89a' });
    }
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Ta-ta-taaaa!', 2)), A.spawn('queen', 'queen', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wave', 1, 'queen'), A.say('Welcome to my palace!', 2.2, 'queen')), A.wait(1.5), A.remove('queen', 'fade'), A.operate('door', 'close')],
          [A.pose('flag', { rot: [0, 30, 0], dur: 0.7 }), A.pose('flag', { rot: [0, -20, 0], dur: 0.7 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // An artist's wooden palette (35 cm) held upright: a thumb hole, blobs of paint round the edge, a brush
  // that dabs from colour to colour.
  e('palette', 'study', 'art supplies', () => {
    const b = m('palette').cyl([0.35, 0.012, 0.25], [0, 0.14, 0], { color: 'lightwood', rot: [80, 0, 0], name: 'board', edge: 'sharp' });
    const blob = (u: number, v: number, c: string) => b.ball([0.04, 0.032, 0.022], [u, 0.14 + v, -0.176 * v + 0.012], { color: c, parent: 'board' });
    blob(-0.11, 0.06, '#e0473b');
    blob(-0.04, 0.09, '#f6d24a');
    blob(0.04, 0.09, '#4e8fd6');
    blob(0.11, 0.05, '#5aa553');
    blob(-0.13, -0.02, 'white');
    blob(0.0, -0.075, '#8a5fc4');
    blob(0.13, -0.03, '#f0923b');
    return b
      .cyl([0.045, 0.016, 0.034], [0.07, 0.1, 0.008], { color: '#5a3a22', rot: [80, 0, 0], parent: 'board', noInk: true })
      .rod([0.0, 0.03, 0.06], [0.12, 0.22, 0.04], 0.01, 'darkwood', { name: 'brush', pivot: [0.0, 0.03, 0.06] })
      .ball([0.016, 0.03, 0.016], [0.125, 0.23, 0.04], { color: '#4e8fd6', parent: 'brush' })
      .act({ click: [[A.pose('brush', { rot: [0, 0, 25], dur: 0.4 }), A.say('Dab!', 0.8), A.pose('brush', { rot: [0, 0, -20], dur: 0.5 }), A.say('Dab dab!', 0.8), A.pose('brush', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A coconut palm, 10 m: a leaning, ringed, gently curving trunk, a crown of long arching fronds, a cluster of
  // coconuts. A shake drops a coconut.
  e('palm tree', 'garden', 'trees', () => {
    const pts: Vec3[] = [[0, 0, 0], [0.25, 2.5, 0], [0.75, 5, 0.1], [1.5, 7.4, 0.15], [2.4, 9.4, 0.2]];
    const b = m('palm tree').cyl([0.75, 0.4, 0.75], [0, 0.2, 0], { color: '#8a6440', taper: 0.6 });
    for (let i = 0; i < 4; i++) b.stick(pts[i], pts[i + 1], 0.5 - i * 0.05, i % 2 ? '#a07850' : '#8a6440');
    for (let i = 1; i < 12; i++) {
      const t = i / 12, k = Math.min(3, Math.floor(t * 4)), u = t * 4 - k, a = pts[k], c = pts[k + 1];
      b.cyl([0.54 - k * 0.05, 0.08, 0.54 - k * 0.05], [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u, a[2] + (c[2] - a[2]) * u], { color: '#6e5235', rot: [0, 0, -12 - k * 8], noInk: true });
    }
    const top = pts[4];
    b.ball([0.8, 0.9, 0.8], top, { color: '#6a8a3a', name: 'top', pivot: [top[0], top[1] - 0.6, top[2]] });
    for (let i = 0; i < 9; i++) {
      const yaw = (i / 9) * 360 + 10, up = 25 - (i % 3) * 10, f = rad(yaw), l1 = 2.2;
      const c1: Vec3 = [top[0] + Math.cos(f) * Math.cos(rad(up)) * l1, top[1] + Math.sin(rad(up)) * l1, top[2] - Math.sin(f) * Math.cos(rad(up)) * l1];
      const g = i % 2 ? '#5aa553' : '#3f7a3a';
      spoke(b, top, yaw, up, l1 + 0.3, 0.06, 0.5, g, { parent: 'top' });
      spoke(b, c1, yaw, -38, 2.6, 0.05, 0.42, g, { parent: 'top' });
      b.rod(top, c1, 0.06, '#8a9a3a', { parent: 'top' });
    }
    for (const [dx, dz] of [[0.3, 0.25], [-0.25, 0.3], [0.05, -0.3], [-0.3, -0.15]]) b.ball([0.3, 0.34, 0.3], [top[0] + dx, top[1] - 0.45, top[2] + dz], { color: '#6b4a2b', parent: 'top' });
    return b.act(treeAct('coconut', 'Whoosh...')).done();
  }),
  // A cast-iron frying pan (28 cm) with a riveted handle and an egg frying in it. It sizzles; the egg flips.
  e('pan', 'kitchen', 'cookware', () =>
    m('pan', { edge: 'sharp' })
      .cyl([0.28, 0.045, 0.28], [0, 0.0225, 0], { color: '#3a3633', taper: 1.12, name: 'pan' })
      .cyl([0.25, 0.006, 0.25], [0, 0.045, 0], { color: '#5c6166', parent: 'pan', noInk: true })
      .box([0.24, 0.025, 0.04], [0.26, 0.05, 0], { color: '#3a3633', rot: [0, 0, 12], round: 0.4, parent: 'pan' })
      .cyl([0.015, 0.01, 0.015], [0.15, 0.04, 0.012], { color: 'silver', rot: [0, 0, 90], parent: 'pan' })
      .ball([0.12, 0.012, 0.1], [-0.01, 0.054, 0], { color: 'white', name: 'egg', parent: 'pan', edge: 'soft' })
      .ball([0.045, 0.025, 0.045], [0.0, 0.064, 0.005], { color: '#f6b830', parent: 'egg', edge: 'soft' })
      .socket('top', [0, 0.06, 0], 'top', { size: 0.22 })
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle sizzle!', 2))],
          [A.pose('egg', { move: [0, 0.2, 0], rot: [180, 0, 0], dur: 0.35 }), A.pose('egg', { move: [0, 0, 0], rot: [360, 0, 0], dur: 0.35 }), A.say('Flip!', 1), A.pose('egg', { rot: [0, 0, 0], dur: 0 })],
        ],
      })
      .done(),
  ),
  // A stack of four fluffy pancakes on a plate with a pat of butter melting and syrup running down. The top one flips.
  e('pancake', 'food', 'breakfast', () => {
    const b = plate(m('pancake'), 0.28);
    b.each(3, (i) => b.cyl([0.17 - i * 0.004, 0.024, 0.17 - i * 0.004], [0, 0.03 + i * 0.024, 0], { color: i % 2 ? '#d9a35f' : '#c98a3a', edge: 'soft' }));
    return b
      .cyl([0.164, 0.024, 0.164], [0, 0.102, 0], { color: '#d9a35f', name: 'flip', edge: 'soft' })
      .cyl([0.15, 0.006, 0.15], [0, 0.116, 0], { color: '#a0612a', parent: 'flip', noInk: true })
      .box([0.04, 0.02, 0.035], [0.01, 0.127, 0], { color: '#fbe58a', parent: 'flip', round: 0.3 })
      .capsule([0.015, 0.05, 0.01], [0.075, 0.08, 0.04], { color: '#a0612a', noInk: true })
      .capsule([0.014, 0.04, 0.01], [-0.06, 0.085, 0.065], { color: '#a0612a', noInk: true })
      .act({ click: [[A.pose('flip', { move: [0, 0.25, 0], rot: [180, 0, 0], dur: 0.35 }), A.pose('flip', { move: [0, 0, 0], rot: [360, 0, 0], dur: 0.35 }), A.say('Flip!', 1), A.pose('flip', { rot: [0, 0, 0], dur: 0 })]] })
      .done();
  }),
  // A box of pancake mix with a picture of a stack on the front and a pouring spout. Shake it and a pancake appears.
  e('pancake mix', 'food', 'pantry', () =>
    m('pancake mix', { edge: 'sharp' })
      .box([0.15, 0.22, 0.06], [0, 0.11, 0], { color: '#f6d24a', round: 0.1, name: 'box' })
      .label('PANCAKE MIX', [0.13, 0.04], [0, 0.18, 0.031], { color: '#c0392b', parent: 'box', depth: 0.003 })
      .cyl([0.08, 0.012, 0.08], [0, 0.07, 0.033], { color: 'bread', rot: [90, 0, 0], parent: 'box', edge: 'soft' })
      .cyl([0.078, 0.012, 0.078], [0, 0.085, 0.034], { color: '#c98a42', rot: [90, 0, 0], parent: 'box', edge: 'soft' })
      .cyl([0.076, 0.012, 0.076], [0, 0.1, 0.035], { color: 'bread', rot: [90, 0, 0], parent: 'box', edge: 'soft' })
      .box([0.025, 0.012, 0.004], [0, 0.112, 0.042], { color: '#fbe39a', noInk: true, parent: 'box' })
      .box([0.04, 0.01, 0.03], [0.04, 0.224, 0], { color: '#e8c03a', parent: 'box', round: 0.2 })
      .act({ click: [[A.par(A.anim('shake'), A.say('Shake shake!', 1.5)), A.spawn('cake', 'pancake', { rel: 'front', of: 'self', dist: 'close' }), A.effect('steam', { id: 'cake', dur: 1.5 }), A.wait(2), A.remove('cake', 'fade')]] })
      .done(),
  ),
  // A pancreas at real size (15 cm): a lumpy, lobed gland with a broad head cupped in the C of the duodenum,
  // tapering through the body to the tail, with its duct.
  e('pancreas', 'clinic', 'organs', () =>
    m('pancreas')
      .ball([0.055, 0.05, 0.04], [0.045, 0.035, 0], { color: '#f0b090', name: 'gland' })
      .ball([0.05, 0.04, 0.035], [0.0, 0.04, 0], { color: '#eaa888', parent: 'gland' })
      .ball([0.045, 0.034, 0.03], [-0.04, 0.046, 0], { color: '#f0b090', parent: 'gland' })
      .ball([0.035, 0.026, 0.024], [-0.072, 0.054, 0], { color: '#eaa888', parent: 'gland' })
      .ball([0.02, 0.018, 0.016], [-0.092, 0.06, 0], { color: '#f0b090', parent: 'gland' })
      .arc([0.075, 0.08, 0.03], [0.07, 0.04, 0], { color: '#d9707a', rot: [0, 0, -90], arc: 220, tube: 0.38, parent: 'gland' })
      .rod([0.05, 0.04, 0.019], [-0.085, 0.058, 0.012], 0.005, '#f7e08a', { parent: 'gland', noInk: true })
      .ball([0.012, 0.01, 0.008], [0.02, 0.055, 0.016], { color: '#f8c8a8', noInk: true, parent: 'gland' })
      .ball([0.012, 0.01, 0.008], [-0.03, 0.055, 0.014], { color: '#f8c8a8', noInk: true, parent: 'gland' })
      .act({ click: [[A.par(A.anim('pulse'), A.say('Squish.', 1))]] })
      .done(),
  ),
  // A pot of pansies: velvety five-petalled faces (two purple petals above, three below with a dark blotch and a
  // yellow eye) over a mound of leaves. The biggest flower nods and opens wider.
  e('pansy', 'garden', 'flowers', () => {
    const b = m('pansy')
      .cyl([0.12, 0.1, 0.12], [0, 0.05, 0], { color: '#c8693e', taper: 1.25, edge: 'sharp' })
      .cyl([0.15, 0.015, 0.15], [0, 0.1, 0], { color: '#b05a32', edge: 'sharp' })
      .ball([0.13, 0.03, 0.13], [0, 0.105, 0], { color: 'dirt' });
    b.each(7, (i) => b.ball([0.05, 0.015, 0.035], [Math.cos(i * 0.9) * 0.05, 0.12, Math.sin(i * 0.9) * 0.05], { color: i % 2 ? 'leaf' : '#4f8f45', rot: [0, -i * 52, 15] }));
    const flower = (x: number, y: number, z: number, s: number, top: string, low: string, nm?: string) => {
      b.rod([x * 0.4, 0.11, z * 0.4], [x, y - s * 0.4, z], 0.006, 'green');
      b.ball([s * 0.45, s * 0.45, 0.01], [x, y, z], { color: low, ...(nm ? { name: nm, pivot: [x, y - s * 0.4, z] } : {}) });
      const p = nm ? { parent: nm } : {};
      b.ball([s * 0.5, s * 0.5, 0.008], [x - s * 0.22, y + s * 0.25, z - 0.004], { color: top, ...p })
        .ball([s * 0.5, s * 0.5, 0.008], [x + s * 0.22, y + s * 0.25, z - 0.004], { color: top, ...p })
        .ball([s * 0.45, s * 0.42, 0.009], [x - s * 0.28, y - 0.0, z + 0.002], { color: low, ...p })
        .ball([s * 0.45, s * 0.42, 0.009], [x + s * 0.28, y - 0.0, z + 0.002], { color: low, ...p })
        .ball([s * 0.5, s * 0.42, 0.01], [x, y - s * 0.18, z + 0.004], { color: low, ...p })
        .ball([s * 0.42, s * 0.32, 0.004], [x, y - s * 0.05, z + 0.009], { color: '#3a2050', noInk: true, ...p })
        .ball(s * 0.14, [x, y + s * 0.02, z + 0.012], { color: '#f6d24a', ...p });
    };
    flower(0, 0.2, 0.02, 0.07, '#6a3fa8', '#9a6fe0', 'head');
    flower(0.05, 0.16, 0.04, 0.055, '#f6d24a', '#f6d24a');
    flower(-0.05, 0.165, 0.03, 0.055, '#8a2b6a', '#c870a8');
    return b.act({ click: [[A.par(A.pose('head', { rot: [15, 0, 0], scale: 1.25, dur: 0.6 }), A.effect('sparkle', { dur: 1 })), A.wait(1), A.pose('head', { rot: [0, 0, 0], scale: 1, dur: 0.6 })]] }).done();
  }),
  // A pair of jeans (1 m long) standing as if worn: waistband with a button and belt loops, fly, front pockets,
  // back pockets, straight legs with turned-up cuffs. They do a little hop.
  e('pants', 'wardrobe', 'trousers', () => {
    const b = m('pants')
      .box([0.4, 0.06, 0.22], [0, 0.97, 0], { color: '#3d5a8a', round: 0.4, name: 'waist' })
      .box([0.4, 0.24, 0.22], [0, 0.82, 0], { color: 'denim', round: 0.4, parent: 'waist' })
      .box([0.012, 0.16, 0.01], [0, 0.84, 0.111], { color: '#3a5a8a', noInk: true, parent: 'waist' })
      .cyl([0.02, 0.008, 0.02], [0, 0.97, 0.112], { color: 'brass', rot: [90, 0, 0], parent: 'waist' });
    b.each(5, (i) => b.box([0.015, 0.06, 0.01], [-0.16 + i * 0.08, 0.97, 0.113], { color: '#3d5a8a', parent: 'waist' }));
    b.pair((s) =>
      b
        .box([0.19, 0.76, 0.2], [s * 0.105, 0.42, 0], { color: 'denim', rot: [0, 0, s * 2], round: 0.35, parent: 'waist' })
        .box([0.2, 0.05, 0.21], [s * 0.112, 0.06, 0], { color: '#5a7fb5', round: 0.4, parent: 'waist' })
        .box([0.09, 0.07, 0.01], [s * 0.12, 0.87, 0.112], { color: '#3a5a8a', noInk: true, rot: [0, 0, s * 30], parent: 'waist' })
        .box([0.1, 0.11, 0.01], [s * 0.1, 0.83, -0.112], { color: '#3a5a8a', noInk: true, parent: 'waist' }),
    );
    return b.act({ click: [[A.par(A.anim('hop'), A.say('Swish!', 1))]] }).done();
  }),
  // Sheer black tights on a leg form: waistband, seat, legs tapering to stockinged feet.
  e('panty hose', 'wardrobe', 'hosiery', () => {
    const b = m('panty hose').box([0.3, 0.06, 0.14], [0, 0.9, 0], { color: '#2a2628', round: 0.4, name: 'waist' }).ball([0.3, 0.18, 0.16], [0, 0.8, 0], { color: '#4a3e44', parent: 'waist' });
    b.pair((s) =>
      b
        .rod([s * 0.07, 0.77, 0], [s * 0.08, 0.44, 0.01], 0.105, '#4a3e44', { parent: 'waist' })
        .rod([s * 0.08, 0.44, 0.01], [s * 0.085, 0.08, 0], 0.07, '#4a3e44', { parent: 'waist' })
        .box([0.07, 0.05, 0.17], [s * 0.085, 0.025, 0.05], { color: '#2a2628', round: 0.6, parent: 'waist' }),
    );
    return b.act({ click: [[A.par(A.anim('wobble'), A.say('Boing!', 1.2))]] }).done();
  }),
  // A papaya: a long yellow-green fruit blushing orange, and a slice cut from it showing the orange flesh and
  // the black seeds; the slice comes away.
  e('papaya', 'food', 'fruit', () =>
    m('papaya', { view: 'side' })
      .loft([0.11, 0.11, 0.22], [0, 0.056, 0], [[0, 0.2, 0.2], [0.15, 0.7, 0.7], [0.45, 1, 1], [0.8, 0.85, 0.85], [1, 0.3, 0.3]], { color: '#a8c040', name: 'body' })
      .ball([0.07, 0.06, 0.12], [0.03, 0.07, -0.02], { color: '#f0a040', noInk: true, parent: 'body' })
      .cyl([0.012, 0.02, 0.012], [0, 0.056, 0.115], { color: 'darkbrown', rot: [90, 0, 0], parent: 'body' })
      .loft([0.1, 0.05, 0.16], [0.11, 0.025, 0.0], [[0, 0.3, 0.3], [0.3, 0.9, 0.9], [0.7, 1, 1], [1, 0.4, 0.4]], { color: '#a8c040', cut: 'bottom', name: 'slice', parent: 'body', piece: true })
      .ball([0.085, 0.012, 0.15], [0.11, 0.026, 0.0], { color: '#f58a3a', parent: 'slice' })
      .ball([0.03, 0.01, 0.09], [0.11, 0.032, 0.0], { color: '#2a2020', parent: 'slice', noInk: true })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Slice!', 1)], [A.reattach('slice')]] })
      .done(),
  ),
  // A ream of A4 paper in its wrapper, opened, with a loose sheet on top that blows off.
  e('paper', 'study', 'paper', () => {
    const b = m('paper', { edge: 'sharp' })
      .box([0.21, 0.05, 0.297], [0, 0.025, 0], { color: 'white', round: 0.05, name: 'ream' })
      .box([0.212, 0.03, 0.12], [0, 0.025, 0.02], { color: '#4e8fd6', noInk: true, parent: 'ream' })
      .label('A4 PAPER', [0.1, 0.02], [0, 0.025, 0.155], { color: '#4e8fd6', parent: 'ream', depth: 0.003 })
      .box([0.21, 0.004, 0.297], [0.01, 0.052, 0.01], { color: 'paper', rot: [0, 8, 0], name: 'sheet', parent: 'ream', piece: true, round: 0 });
    b.each(6, (i) => b.box([0.15, 0.002, 0.004], [0.01, 0.055, -0.09 + i * 0.035], { color: '#a8c8e8', noInk: true, rot: [0, 8, 0], parent: 'sheet', round: 0 }));
    return b.act({ click: [[A.par(A.detach('sheet', 'sheet'), A.effect('dust', { dur: 0.8 }), A.say('Flutter...', 1.2))], [A.reattach('sheet')]] }).done();
  }),
  // A folded paper dart (28 cm): two creased wings over a keel, nose to the front. It glides away.
  e('paper airplane', 'toys', 'paper toys', () => {
    const b = m('paper airplane', { view: 'side', edge: 'sharp' }).wedge([0.28, 0.04, 0.006], [0, 0.04, 0], { color: '#f0eee6', rot: eulerOf([0, 0, 1], [0, -1, 0]), apex: -0.5, name: 'plane' });
    b.pair((s) => {
      const c = Math.cos(rad(10)), sn = Math.sin(rad(10));
      b.wedge([0.28, 0.1, 0.004], [s * 0.05 * c, 0.06 + 0.05 * sn, 0], { color: 'white', rot: eulerOf([0, 0, 1], [s * c, sn, 0]), apex: -0.5, parent: 'plane' });
    });
    return b
      .box([0.004, 0.02, 0.1], [0.004, 0.045, -0.08], { color: '#e0473b', round: 0, parent: 'plane', noInk: true })
      .act({ click: [[A.say('Whoosh!', 1.5), A.move('self', { rel: 'front', of: 'self', dist: 'near' }, { speed: 'fly', style: 'fly' }), A.anim('wobble')]] })
      .done();
  }),
  // A brown paper grocery bag (43 cm) with a folded rim, full of shopping: a baguette, lettuce, celery and an
  // apple that rolls out.
  e('paper bag (container)', 'home', 'parcels and bags', () =>
    m('paper bag (container)')
      .box([0.3, 0.42, 0.18], [0, 0.21, 0], { color: '#c8a06a', round: 0.04, edge: 'sharp', name: 'bag' })
      .box([0.306, 0.04, 0.186], [0, 0.4, 0], { color: '#d8b07a', round: 0.1, edge: 'sharp', parent: 'bag' })
      .box([0.004, 0.36, 0.04], [0.15, 0.2, 0.0], { color: '#b8905a', round: 0, noInk: true, parent: 'bag' })
      .capsule([0.055, 0.42, 0.055], [0.08, 0.5, -0.03], { color: 'bread', rot: [0, 0, -14], parent: 'bag' })
      .ball([0.13, 0.12, 0.11], [-0.07, 0.45, 0.0], { color: 'lettuce', parent: 'bag' })
      .rod([-0.02, 0.38, -0.04], [-0.04, 0.58, -0.05], 0.025, '#9be34d', { parent: 'bag' })
      .ball([0.05, 0.03, 0.04], [-0.045, 0.6, -0.05], { color: '#5aa553', parent: 'bag' })
      .ball(0.075, [0.01, 0.45, 0.05], { color: '#d23a30', parent: 'bag' })
      .act({ click: [[A.par(A.anim('wobble'), A.say('Crinkle!', 1)), A.spawn('apple', 'apple', { rel: 'front', of: 'self', dist: 'close' }), A.anim('bounce', 1, 'apple'), A.wait(1.5), A.remove('apple', 'fade')]] })
      .done(),
  ),
  // A guillotine paper trimmer: a board ruled with a grid, a steel cutting edge, and a long blade arm hinged at
  // the back corner with a black grip. Chop!
  e('paper cutter', 'study', 'office tools', () => {
    // the arm is drawn raised (55 degrees up about its hinge at the back corner); it swings down to cut
    const hinge: Vec3 = [0.2, 0.05, -0.17], a = rad(-55);
    const up = (p: Vec3): Vec3 => {
      const y = p[1] - hinge[1], z = p[2] - hinge[2];
      return [p[0], hinge[1] + y * Math.cos(a) - z * Math.sin(a), hinge[2] + y * Math.sin(a) + z * Math.cos(a)];
    };
    const b = m('paper cutter', { edge: 'sharp' }).box([0.4, 0.025, 0.38], [0, 0.0125, 0], { color: 'white', round: 0.1 });
    b.each(5, (i) => b.box([0.36, 0.002, 0.004], [-0.01, 0.026, -0.14 + i * 0.07], { color: '#a8c8e8', noInk: true, round: 0 }).box([0.004, 0.002, 0.34], [-0.16 + i * 0.07, 0.026, 0], { color: '#a8c8e8', noInk: true, round: 0 }));
    return b
      .box([0.03, 0.03, 0.38], [0.19, 0.02, 0], { color: 'steel', round: 0.2 })
      .box([0.012, 0.02, 0.4], up([0.2, 0.05, 0.02]), { color: 'silver', round: 0.2, rot: [-55, 0, 0], name: 'blade', pivot: hinge, mover: { kind: 'swing', axis: 'x', amount: 55 } })
      .rod(up([0.2, 0.068, -0.15]), up([0.2, 0.068, 0.18]), 0.022, '#c9ccd1', { parent: 'blade' })
      .capsule([0.04, 0.11, 0.04], up([0.2, 0.07, 0.25]), { color: '#2a2726', rot: [35, 0, 0], parent: 'blade' })
      .cyl([0.05, 0.03, 0.05], [0.2, 0.05, -0.17], { color: '#2a2726', rot: [0, 0, 90] })
      .box([0.2, 0.003, 0.28], [0.06, 0.028, 0.0], { color: 'paper', rot: [0, 6, 0], round: 0 })
      .act({ click: [[A.operate('blade', 'on'), A.say('Chop!', 1), A.wait(0.6), A.operate('blade', 'off')]] })
      .done();
  }),
  // A roll of kitchen paper on a wooden stand with a sheet hanging down that tears off.
  e('paper towels', 'kitchen', 'kitchen supplies', () =>
    m('paper towels')
      .cyl([0.17, 0.02, 0.17], [0, 0.01, 0], { color: 'wood', edge: 'sharp' })
      .stick([0, 0.02, 0], [0, 0.32, 0], 0.025, 'wood', { edge: 'sharp' })
      .ball(0.035, [0, 0.33, 0], { color: 'wood' })
      .cyl([0.13, 0.27, 0.13], [0, 0.155, 0], { color: 'white', name: 'roll' })
      .cyl([0.042, 0.272, 0.042], [0, 0.155, 0], { color: 'tan', parent: 'roll' })
      .box([0.13, 0.26, 0.004], [0.06, 0.155, 0.07], { color: 'white', rot: [0, -12, 0], name: 'sheet', parent: 'roll', piece: true, round: 0, edge: 'sharp' })
      .ball([0.025, 0.025, 0.002], [0.07, 0.2, 0.08], { color: '#a8d8f5', noInk: true, rot: [0, -12, 0], parent: 'sheet' })
      .ball([0.025, 0.025, 0.002], [0.05, 0.1, 0.076], { color: '#a8d8f5', noInk: true, rot: [0, -12, 0], parent: 'sheet' })
      .act({ click: [[A.detach('sheet', 'towel'), A.say('Rrrip!', 1)], [A.reattach('sheet')]] })
      .done(),
  ),
  // A jumbo paperclip (5 cm) bent from one silver wire in two nested loops. It springs.
  e('paperclip', 'study', 'stationery', () => {
    const b = m('paperclip', { edge: 'sharp' });
    const k = 0.6;
    const pts: Array<[number, number]> = [[-0.007, 0.03], [-0.007, 0.08]];
    const arc = (x1: number, x2: number, y: number, up: boolean) => {
      const c = (x1 + x2) / 2, r = Math.abs(x2 - x1) / 2;
      for (const t of [0.25, 0.5, 0.75, 1]) {
        const a = Math.PI * (x1 < x2 ? 1 - t : t);
        pts.push([c + Math.cos(a) * r, y + (up ? 1 : -1) * Math.sin(a) * r]);
      }
    };
    arc(-0.007, 0.007, 0.08, true);
    pts.push([0.007, 0.014]);
    arc(0.007, -0.014, 0.014, false);
    pts.push([-0.014, 0.088]);
    arc(-0.014, 0.014, 0.088, true);
    pts.push([0.014, 0.036]);
    b.rod([pts[0][0] * k, pts[0][1] * k, 0], [pts[1][0] * k, pts[1][1] * k, 0], 0.0022, 'silver', { name: 'clip', pivot: [0, 0, 0] });
    for (let i = 1; i + 1 < pts.length; i++) b.rod([pts[i][0] * k, pts[i][1] * k, 0], [pts[i + 1][0] * k, pts[i + 1][1] * k, 0], 0.0022, 'silver', { parent: 'clip' });
    return b.act({ click: [[A.par(A.pose('clip', { rot: [0, 360, 0], dur: 0.8 }), A.say('Boing!', 1)), A.pose('clip', { rot: [0, 0, 0], dur: 0 })]] }).done();
  }),
  // A glass paperweight with a millefiori bloom inside, holding down a few sheets of paper. A gust lifts the
  // corner of the top sheet, but the paper stays put.
  e('paperweight', 'study', 'desk things', () =>
    m('paperweight')
      .box([0.21, 0.006, 0.15], [0, 0.003, 0], { color: 'paper', edge: 'sharp', round: 0 })
      .box([0.2, 0.004, 0.14], [0.01, 0.008, 0.005], { color: 'white', edge: 'sharp', rot: [0, 6, 0], round: 0 })
      .box([0.07, 0.003, 0.06], [0.07, 0.011, 0.045], { color: 'white', edge: 'sharp', name: 'corner', pivot: [0.04, 0.011, 0.02], round: 0 })
      .cyl([0.078, 0.02, 0.078], [0, 0.02, 0], { color: '#bfe6f5', taper: 0.95 })
      .dome([0.078, 0.055, 0.078], [0, 0.03, 0], { color: '#bfe6f5' })
      .ball([0.022, 0.016, 0.008], [0, 0.055, 0.028], { color: '#e0473b', noInk: true })
      .ball([0.018, 0.014, 0.008], [-0.018, 0.048, 0.026], { color: '#f6d24a', noInk: true })
      .ball([0.018, 0.014, 0.008], [0.018, 0.048, 0.026], { color: '#4e8fd6', noInk: true })
      .ball([0.018, 0.014, 0.008], [0, 0.04, 0.031], { color: '#d64fa0', noInk: true })
      .ball([0.02, 0.008, 0.02], [-0.012, 0.075, 0.012], { color: 'white', noInk: true })
      .act({ click: [[A.par(A.effect('dust', { dur: 1.2 }), A.pose('corner', { rot: [-30, 0, 0], dur: 0.4 }), A.say('Whoosh!', 1)), A.pose('corner', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A spice jar of paprika: red powder behind a label, a red shaker lid that comes off, a little heap spilled.
  e('paprika', 'food', 'spices', () =>
    jar('paprika', 0.1, 0.05, '#c0391b', '#c0392b', 'PAPRIKA')
      .cone([0.06, 0.02, 0.06], [0.065, 0.01, 0.02], { color: '#c0391b' })
      .act({ click: [[A.detach('lid', 'lid'), A.par(A.anim('shake'), A.effect('dust', { dur: 1 }), A.say('Shake shake!', 1.2))], [A.reattach('lid'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A clump of papyrus at the water's edge: tall three-sided green stems (2.4 m) each crowned with a mop of fine
  // rays like a burst firework. It sways.
  e('papyrus', 'garden', 'water plants', () => {
    const b = m('papyrus').cyl([1.3, 0.04, 1.3], [0, 0.02, 0], { color: 'water' }).ball([0.5, 0.2, 0.5], [0, 0.1, 0], { color: 'darkgreen' });
    b.ball([0.1, 0.1, 0.1], [0, 0.6, 0], { color: 'green', name: 'top', pivot: [0, 0.1, 0] });
    const tops: Vec3[] = [[0, 2.4, 0], [0.4, 2.05, 0.1], [-0.4, 2.1, 0.05], [0.15, 1.8, 0.35], [-0.2, 1.75, -0.3], [0.3, 2.2, -0.25]];
    for (const t of tops) {
      b.stick([t[0] * 0.15, 0.12, t[2] * 0.15], t, 0.03, 'green', { parent: 'top', segs: 3 });
      for (let i = 0; i < 9; i++) spoke(b, t, i * 40, 15 + (i % 3) * 20, 0.35, 0.012, 0.03, i % 2 ? '#9be34d' : '#7cc45a', { parent: 'top' }, 'box');
    }
    return b.act({ click: [[A.par(A.pose('top', { rot: [0, 0, 7], dur: 0.6 }), A.say('Rustle...', 1.5)), A.pose('top', { rot: [0, 0, -5], dur: 0.7 }), A.pose('top', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A parachute (7 m canopy) with a skydiver hanging in the harness: a domed canopy of coloured cells with a
  // vent at the top, suspension lines to the risers. The canopy sways as it drifts.
  e('parachute', 'sky', 'flying things', () => {
    const b = m('parachute')
      .dome([7, 2.6, 7], [0, 6.4, 0], { color: '#e0473b', name: 'canopy', pivot: [0, 2.2, 0] });
    // white gores: thin bands following the dome from rim to rim, and the suspension lines
    b.each(4, (i) => b.arc([7.06, 5.24, 0.6], [0, 5.1, 0], { color: 'white', rot: [0, i * 45, 0], tube: 0.015, arc: 176, parent: 'canopy', noInk: true }));
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.rod([Math.cos(a) * 3.4, 5.1, Math.sin(a) * 3.4], [Math.cos(a) * 0.25, 2.25, Math.sin(a) * 0.12], 0.03, '#5c6166', { parent: 'canopy' });
    });
    b.cyl([0.9, 0.2, 0.9], [0, 7.7, 0], { color: 'white', parent: 'canopy' });
    // the skydiver in a harness: helmet, jumpsuit, arms up holding the toggles, legs dangling
    b.capsule([0.36, 0.65, 0.26], [0, 1.4, 0], { color: '#f0923b', parent: 'canopy' })
      .ball(0.24, [0, 1.92, 0.02], { color: 'skin2', parent: 'canopy' })
      .dome([0.27, 0.16, 0.27], [0, 1.96, 0.0], { color: 'white', parent: 'canopy' })
      .box([0.4, 0.4, 0.14], [0, 1.45, -0.18], { color: '#2f4f8f', parent: 'canopy' });
    b.pair((s) => b.rod([s * 0.1, 1.1, 0], [s * 0.14, 0.18, 0.06], 0.12, '#2f4f8f', { parent: 'canopy' }).rod([s * 0.18, 1.65, 0], [s * 0.25, 2.25, 0], 0.09, '#f0923b', { parent: 'canopy' }).box([0.1, 0.08, 0.2], [s * 0.15, 0.06, 0.08], { color: 'black', parent: 'canopy' }));
    return b.act({ click: [[A.par(A.pose('canopy', { rot: [0, 0, 8], dur: 0.8 }), A.say('Wheee!', 2)), A.pose('canopy', { rot: [0, 0, -8], dur: 1 }), A.pose('canopy', { rot: [0, 0, 0], dur: 0.8 })]] }).done();
  }),
  // A parallelogram: a slanted four-sided shape standing on a stand. It turns to show itself off.
  e('parallelogram', 'ideas', 'shapes', () =>
    plinth(m('parallelogram'), 0.26)
      .box([0.16, 0.12, 0.03], [0, 0.09, 0], { color: '#f0923b', round: 0, name: 'shape', edge: 'sharp' })
      .wedge([0.06, 0.12, 0.03], [-0.11, 0.09, 0], { color: '#f0923b', apex: 0.5, parent: 'shape', edge: 'sharp' })
      .wedge([0.06, 0.12, 0.03], [0.11, 0.09, 0], { color: '#f0923b', apex: 0.5, rot: [0, 0, 180], parent: 'shape', edge: 'sharp' })
      .act({ click: [[A.par(A.pose('shape', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('shape', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A parcel wrapped in brown paper and tied with string in a bow, with an address label. The bow comes undone.
  e('parcel', 'home', 'parcels and bags', () =>
    m('parcel')
      .box([0.3, 0.16, 0.22], [0, 0.08, 0], { color: '#b88a5a', round: 0.08, name: 'box', edge: 'sharp' })
      .box([0.304, 0.164, 0.008], [0, 0.08, 0], { color: 'cream', noInk: true, round: 0.08, parent: 'box' })
      .box([0.008, 0.164, 0.224], [0, 0.08, 0], { color: 'cream', noInk: true, round: 0.08, parent: 'box' })
      .torus([0.06, 0.04, 0.01], [-0.028, 0.172, 0], { color: 'cream', tube: 0.3, rot: [0, 0, 20], name: 'bow', parent: 'box', piece: true })
      .torus([0.06, 0.04, 0.01], [0.028, 0.172, 0], { color: 'cream', tube: 0.3, rot: [0, 0, -20], parent: 'bow' })
      .ball(0.018, [0, 0.168, 0], { color: 'cream', parent: 'bow' })
      .label('TO: GRANDMA', [0.12, 0.05], [0.08, 0.07, 0.111], { color: 'white', parent: 'box', depth: 0.003 })
      .box([0.03, 0.035, 0.003], [-0.1, 0.12, 0.111], { color: '#e0473b', parent: 'box', round: 0 })
      .act({ click: [[A.detach('bow', 'bow'), A.say('Tug!', 1)], [A.reattach('bow'), A.say('Tug.', 1)]] })
      .done(),
  ),
  // A town park (22 x 16 m): lawns and a curving gravel path, three shade trees, a pond with reeds, a slatted
  // bench, a lamp post that lights, a flower bed and a sign. A duck pops up on the pond.
  e('park', 'places', 'parks', () => {
    const b = m('park').box([22, 0.15, 16], [0, 0.075, 0], { color: 'grass', edge: 'soft' });
    for (let i = 0; i < 6; i++) b.box([1.8, 0.04, 3.2], [Math.sin(i * 0.8) * 2.2, 0.16, -8 + 1.4 + i * 2.6], { color: '#d9c49a', rot: [0, deg(Math.cos(i * 0.8) * 0.5), 0], round: 0.5 });
    const treeAt = (xx: number, z: number, h: number, c: string) => {
      b.cyl([0.4, h * 0.55, 0.4], [xx, h * 0.27, z], { color: 'bark', taper: 0.7 });
      b.ball([h * 0.6, h * 0.5, h * 0.6], [xx, h * 0.7, z], { color: c });
      b.ball([h * 0.4, h * 0.35, h * 0.4], [xx + h * 0.15, h * 0.85, z - h * 0.1], { color: c });
    };
    treeAt(-7, -4, 7.5, 'leaf');
    treeAt(7, -5, 6.5, '#3f7a3a');
    treeAt(8, 4, 6, 'leaf');
    // pond with reeds
    b.cyl([6, 0.08, 4], [-5.5, 0.17, 3.5], { color: 'water' }).cyl([6.4, 0.06, 4.4], [-5.5, 0.15, 3.5], { color: '#a7a7a0' });
    b.each(5, (i) => b.rod([-8 + i * 0.15, 0.15, 2.2], [-8.1 + i * 0.2, 1.0 + (i % 2) * 0.3, 2.1], 0.04, '#5aa553'));
    // bench, lamp, flower bed, sign, bin
    b.box([1.8, 0.05, 0.45], [3.2, 0.45, 1.5], { color: 'wood', edge: 'sharp' })
      .box([1.8, 0.3, 0.05], [3.2, 0.75, 1.27], { color: 'wood', edge: 'sharp', rot: [-10, 0, 0] });
    b.pair((s) => b.box([0.06, 0.45, 0.45], [3.2 + s * 0.8, 0.225, 1.45], { color: 'iron', edge: 'sharp' }));
    b.stick([1.5, 0.15, 3.6], [1.5, 3.6, 3.6], 0.12, '#2a2726', { edge: 'sharp' })
      .cyl([0.4, 0.5, 0.4], [1.5, 3.85, 3.6], { color: '#fff3c0', taper: 0.8, name: 'lamp', mover: { kind: 'light' }, edge: 'sharp' })
      .cone([0.6, 0.3, 0.6], [1.5, 4.25, 3.6], { color: '#2a2726', edge: 'sharp' })
      .cyl([3, 0.3, 1.6], [5, 0.25, 6], { color: 'dirt' });
    b.each(9, (i) => b.ball(0.25, [3.9 + (i % 5) * 0.55, 0.5, 5.6 + Math.floor(i / 5) * 0.6], { color: ['#e0473b', '#f6d24a', '#f4a1c0'][i % 3] }));
    b.stick([-1.5, 0.15, 7.2], [-1.5, 1.3, 7.2], 0.08, 'darkwood').label('CITY PARK', [1.4, 0.45], [-1.5, 1.45, 7.25], { color: '#3f7a3a', edge: 'sharp' });
    return b
      .socket('bench', [3.2, 0.48, 1.5], 'seat')
      .act({
        click: [
          [A.operate('lamp'), A.say('Click.', 1)],
          [A.spawn('duck', 'duck', { rel: 'near', of: 'self', dist: 'close' }), A.say('Quack!', 1.5, 'duck'), A.wait(1.5), A.remove('duck', 'sink')],
        ],
      })
      .done();
  }),
  // A car park (18 x 14 m) of tarmac with white bay lines, two parked cars, a kerb, a lamp post, a pay machine,
  // a blue P sign and an entry barrier whose arm lifts.
  e('parking lot', 'places', 'parking', () => {
    const b = m('parking lot', { edge: 'sharp' }).box([18, 0.1, 14], [0, 0.05, 0], { color: '#4a4d52', round: 0.02 }).box([18.4, 0.15, 0.3], [0, 0.075, 7.1], { color: '#a7a7a0' });
    b.each(7, (i) => b.box([0.12, 0.01, 5], [-7.5 + i * 2.6, 0.105, -4.2], { color: 'white', noInk: true, round: 0 }));
    b.box([2.0, 0.01, 0.6], [4.2, 0.105, 3.0], { color: 'white', noInk: true, round: 0, rot: [0, 0, 0] });
    parked(b, -6.2, 0.1, -4.2, '#c0392b');
    parked(b, -1.0, 0.1, -4.2, '#4e8fd6', 180);
    parked(b, 4.2, 0.1, -4.2, '#f6d24a');
    b.stick([8, 0.1, -6], [8, 6, -6], 0.15, '#5c6166').box([1.2, 0.15, 0.4], [7.5, 6, -6], { color: '#5c6166' }).box([0.8, 0.08, 0.3], [7.3, 5.9, -6], { color: '#fff3c0', name: 'lamp', mover: { kind: 'light' } });
    b.box([0.5, 1.5, 0.4], [6.5, 0.85, 5.6], { color: '#4e8fd6', round: 0.2 }).box([0.3, 0.2, 0.02], [6.5, 1.3, 5.81], { color: '#9fe08a' });
    b.stick([-8, 0.1, 6.5], [-8, 2.6, 6.5], 0.08, '#9da3a8').label('P', [0.8, 0.8], [-8, 2.9, 6.55], { color: '#2f6fd0' });
    b.box([0.4, 1.0, 0.4], [-3, 0.6, 6.4], { color: '#f6d24a', round: 0.2 })
      .box([3.6, 0.1, 0.1], [-1.2, 1.0, 6.4], { color: 'white', name: 'barrier', pivot: [-3, 1.0, 6.4], mover: { kind: 'swing', axis: 'z', amount: 80 } })
      .each(4, (i) => b.box([0.35, 0.12, 0.12], [-2.4 + i * 0.8, 1.0, 6.4], { color: '#e0473b', parent: 'barrier' }));
    return b
      .act({
        click: [
          [A.operate('barrier', 'open'), A.say('Beep!', 1), A.wait(2.5), A.operate('barrier', 'close')],
          [A.operate('lamp'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A coin parking meter on its post (1.5 m): a domed head with a window showing the time left and a red
  // EXPIRED flag, a coin slot and a turning knob. A penny goes in, the flag drops, it ticks.
  e('parking meter', 'places', 'street things', () =>
    m('parking meter', { edge: 'sharp' })
      .cyl([0.25, 0.04, 0.25], [0, 0.02, 0], { color: '#5c6166' })
      .stick([0, 0.04, 0], [0, 1.1, 0], 0.08, '#5c6166')
      .box([0.25, 0.3, 0.18], [0, 1.25, 0], { color: '#9da3a8', round: 0.4, name: 'head' })
      .dome([0.25, 0.14, 0.18], [0, 1.4, 0], { color: '#9da3a8', parent: 'head', edge: 'soft' })
      .ball([0.17, 0.13, 0.04], [0, 1.36, 0.08], { color: 'glass', parent: 'head', edge: 'soft' })
      .box([0.07, 0.04, 0.01], [0.0, 1.38, 0.1], { color: '#e0473b', name: 'flag', parent: 'head', pivot: [-0.035, 1.36, 0.1], mover: { kind: 'swing', axis: 'z', amount: -80 }, round: 0 })
      .box([0.025, 0.06, 0.02], [0, 1.2, 0.095], { color: '#2a2726', parent: 'head', round: 0 })
      .label('PAY HERE', [0.14, 0.035], [0, 1.15, 0.092], { color: '#f6d24a', parent: 'head', depth: 0.004 })
      .cyl([0.06, 0.04, 0.06], [0.135, 1.22, 0], { color: '#c9ccd1', rot: [0, 0, 90], name: 'knob', parent: 'head' })
      .socket('slot', [0, 1.24, 0.1], 'slot', { size: 0.03 })
      .act({ click: [[A.spawn('coin', 'penny', { rel: 'front', of: 'self', dist: 'touch' }), A.attach('coin', 'self', 'slot'), A.say('Clink!', 1), A.pose('knob', { rot: [180, 0, 0], dur: 0.5 }), A.operate('flag', 'down'), A.say('Tick tick tick...', 2), A.remove('coin', 'sink'), A.wait(1.5), A.par(A.operate('flag', 'up'), A.pose('knob', { rot: [0, 0, 0], dur: 0.3 }))]] })
      .done(),
  ),
  // A multi-storey car park (20 x 14 m, four decks): concrete floor slabs on columns, open sides behind
  // parapets, a ramp, a stair tower with a big P sign, cars parked on the decks and an entry barrier that lifts.
  e('parking structure', 'places', 'parking', () => {
    const b = m('parking structure', { edge: 'sharp' });
    const W = 20, D = 14, fh = 3.0;
    b.each(5, (i) => b.box([W, 0.35, D], [0, 0.175 + i * fh, 0], { color: i ? '#b9b5ad' : '#7a7f85', round: 0.02 }));
    b.each(4, (i) => {
      b.box([W, 1.0, 0.25], [0, 0.35 + (i + 1) * fh + 0.5, D / 2 - 0.12], { color: '#d4d0c8', round: 0.05 });
      b.box([0.25, 1.0, D], [W / 2 - 0.12, 0.35 + (i + 1) * fh + 0.5, 0], { color: '#d4d0c8', round: 0.05 });
    });
    for (const xx of [-9.6, -4.8, 0, 4.8, 9.6]) for (const z of [-6.6, 0, 6.6]) b.box([0.45, fh * 4, 0.45], [xx, fh * 2 + 0.17, z], { color: '#a7a39b', round: 0.05 });
    b.box([4, 0.3, 9], [-7.5, 1.6, -1.5], { color: '#a7a39b', rot: [19, 0, 0], round: 0.05 });
    parked(b, -2.4, 0.35, -2.5, '#c0392b');
    parked(b, 2.4, 0.35, -2.5, '#5c6166', 180);
    parked(b, 3, 0.35 + fh, 1.5, '#f6d24a');
    parked(b, -2, 0.35 + fh * 2, -2, '#5aa553', 180);
    parked(b, 4, 0.35 + fh * 3, 2, '#e8e4dc');
    // stair tower with the P sign, entry booth and barrier
    b.box([3.2, fh * 4 + 2.5, 3.2], [W / 2 + 1.6, (fh * 4 + 2.5) / 2, D / 2 - 1.6], { color: '#2f6fd0', round: 0.03 })
      .label('P', [2.2, 2.2], [W / 2 + 1.6, fh * 4 + 0.6, D / 2 + 0.02], { color: '#2f6fd0', depth: 0.06 })
      .box([1.0, 2.1, 0.08], [W / 2 + 1.6, 1.4, D / 2 + 0.02], { color: 'glass' })
      .box([1.6, 2.4, 1.6], [-W / 2 + 3.5, 1.55, D / 2 + 1.4], { color: '#f6d24a', round: 0.1 })
      .box([1.4, 0.9, 0.06], [-W / 2 + 3.5, 1.9, D / 2 + 2.22], { color: 'glass' })
      .box([4.2, 0.12, 0.12], [-W / 2 + 6.4, 1.4, D / 2 + 1.4], { color: 'white', name: 'barrier', pivot: [-W / 2 + 4.3, 1.4, D / 2 + 1.4], mover: { kind: 'swing', axis: 'z', amount: 80 } });
    b.each(4, (i) => b.box([0.4, 0.14, 0.14], [-W / 2 + 4.8 + i * 1.0, 1.4, D / 2 + 1.4], { color: '#e0473b', parent: 'barrier' }));
    return b.act({ click: [[A.operate('barrier', 'open'), A.say('Beep!', 1.2), A.wait(2.5), A.operate('barrier', 'close')]] }).done();
  }),
  // A parking ticket in its orange envelope, tucked behind a wiper blade as if on a windscreen. It flaps.
  e('parking ticket', 'study', 'papers', () =>
    m('parking ticket', { edge: 'sharp' })
      .box([0.12, 0.012, 0.06], [0, 0.006, 0], { color: '#5c6166', round: 0.2 })
      .box([0.1, 0.16, 0.006], [0, 0.09, 0], { color: '#f0923b', rot: [-8, 0, 0], name: 'ticket', pivot: [0, 0.012, 0], round: 0 })
      .label('PARKING VIOLATION', [0.085, 0.04], [0, 0.13, 0.006], { color: 'white', rot: [-8, 0, 0], parent: 'ticket', depth: 0.002 })
      .label('$50', [0.05, 0.025], [0, 0.07, 0.011], { color: '#f6d24a', rot: [-8, 0, 0], parent: 'ticket', depth: 0.002 })
      .rod([-0.07, 0.02, 0.008], [0.07, 0.2, 0.01], 0.008, '#2a2726')
      .act({ click: [[A.par(A.pose('ticket', { rot: [-25, 0, 0], dur: 0.25 }), A.say('Flap flap!', 1)), A.pose('ticket', { rot: [10, 0, 0], dur: 0.25 }), A.pose('ticket', { rot: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // A party blower: a striped mouthpiece and a curled paper tongue with a feather tip. Blow, and it unrolls: toot!
  e('party favor', 'toys', 'party', () =>
    m('party favor')
      .cyl([0.022, 0.07, 0.022], [0, 0.04, 0.04], { color: '#f6d24a', rot: [90, 0, 0], name: 'mouth' })
      .torus([0.024, 0.024, 0.004], [0, 0.04, 0.06], { color: '#e0473b', rot: [0, 0, 0], tube: 0.3, parent: 'mouth' })
      .torus([0.07, 0.07, 0.025], [0, 0.05, -0.03], { color: '#d64fa0', rot: [0, 90, 0], tube: 0.4, name: 'coil', parent: 'mouth' })
      .box([0.03, 0.006, 0.28], [0, 0.04, -0.14], { color: '#d64fa0', name: 'tongue', parent: 'mouth', scale: 0, round: 0.3 })
      .ball([0.02, 0.06, 0.02], [0, 0.07, -0.28], { color: '#f6d24a', name: 'feather', parent: 'mouth', scale: 0 })
      .act({ click: [[A.par(A.pose('coil', { scale: 0, dur: 0.15 }), A.pose('tongue', { scale: 1, dur: 0.2 }), A.pose('feather', { scale: 1, dur: 0.2 }), A.say('TOOT!', 1.2)), A.wait(0.8), A.par(A.pose('coil', { scale: 1, dur: 0.2 }), A.pose('tongue', { scale: 0, dur: 0.2 }), A.pose('feather', { scale: 0, dur: 0.2 }))]] })
      .done(),
  ),
  // A cone party hat (20 cm) with polka dots, a fluffy pompom on top, a crinkled foil trim and an elastic chin
  // strap. Party time: confetti!
  e('party hat', 'toys', 'party', () => {
    const b = m('party hat').cone([0.14, 0.2, 0.14], [0, 0.11, 0], { color: '#4e8fd6', name: 'hat', edge: 'sharp' }).torus([0.15, 0.15, 0.025], [0, 0.012, 0], { color: '#f6d24a', rot: [90, 0, 0], tube: 0.25, parent: 'hat' });
    b.each(7, (i) => {
      const y = 0.04 + (i % 3) * 0.045, r = 0.07 * (1 - (y - 0.01) / 0.2) + 0.002, a = i * 1.1 - 1.2;
      b.ball([0.018, 0.018, 0.006], [Math.sin(a) * r, y, Math.cos(a) * r], { color: i % 2 ? '#f6d24a' : '#f4a1c0', noInk: true, rot: [0, deg(a), 0], parent: 'hat' });
    });
    return b
      .ball(0.05, [0, 0.215, 0], { color: '#f6d24a', parent: 'hat' })
      .arc([0.12, 0.08, 0.004], [0, 0.0, 0.0], { color: 'white', rot: [180, 0, 0], tube: 0.04, arc: 160, parent: 'hat' })
      .act({ click: [[A.par(A.anim('hop'), A.spawn('confetti', 'confetti', { rel: 'above', of: 'self', dist: 'close' }), A.say('Toot toot!', 1.5)), A.wait(1.5), A.remove('confetti', 'fade')]] })
      .done();
  }),
  // Spaghetti and meatballs on a plate under tomato sauce and basil, with a fork twirled into it that turns.
  e('pasta', 'food', 'pasta', () => {
    const b = plate(m('pasta'), 0.26).ball([0.19, 0.06, 0.17], [0, 0.04, 0], { color: '#f3d98b' });
    b.each(7, (i) => b.torus([0.06, 0.05, 0.008], [-0.06 + i * 0.02, 0.06, -0.04 + (i % 3) * 0.04], { color: '#f3d98b', rot: [70 + i * 12, i * 40, 0], tube: 0.16 }));
    return b
      .ball([0.11, 0.03, 0.1], [0, 0.072, 0], { color: '#c0392b' })
      .ball(0.034, [0.03, 0.088, 0.02], { color: '#6b3e26' })
      .ball(0.034, [-0.032, 0.086, 0.004], { color: '#6b3e26' })
      .ball(0.032, [0.004, 0.09, -0.032], { color: '#6b3e26' })
      .ball([0.03, 0.006, 0.02], [0.005, 0.108, 0.0], { color: '#3f7a3a', rot: [0, 30, 0] })
      .ball([0.04, 0.004, 0.04], [-0.01, 0.1, 0.03], { color: '#f7f5ef', noInk: true })
      .rod([0.05, 0.07, 0.03], [0.09, 0.24, -0.02], 0.01, 'silver', { name: 'fork', pivot: [0.05, 0.07, 0.03], edge: 'sharp' })
      .torus([0.04, 0.03, 0.016], [0.052, 0.075, 0.03], { color: '#f3d98b', rot: [90, 0, 0], tube: 0.3, parent: 'fork' })
      .act({ click: [[A.par(A.pose('fork', { rot: [0, 720, 0], dur: 1.2 }), A.effect('steam', { dur: 1.5 }), A.say('Twirl... slurp!', 1.8)), A.pose('fork', { rot: [0, 0, 0], dur: 0 })]] })
      .done();
  }),
  // A butter croissant: a crescent of rolled, flaky, golden layers that get smaller toward the curled tips.
  e('pastry', 'food', 'bakery', () => {
    const b = m('pastry');
    const sz: Vec3[] = [[0.04, 0.026, 0.026], [0.055, 0.04, 0.045], [0.07, 0.052, 0.056], [0.055, 0.04, 0.045], [0.04, 0.026, 0.026]];
    for (const i of [2, 0, 1, 3, 4]) {
      const th = 25 + i * 32.5, r = (th * Math.PI) / 180;
      b.ball(sz[i], [Math.cos(r) * 0.06, sz[i][1] / 2, -0.05 + Math.sin(r) * 0.06], { color: i % 2 ? '#e0a050' : '#c8782f', rot: [0, th + 90, 0], ...(i === 2 ? { name: 'body' } : { parent: 'body' }) });
    }
    b.each(4, (i) => {
      const th = 41 + i * 32.5, r = (th * Math.PI) / 180;
      b.ball([0.012, 0.04, 0.05], [Math.cos(r) * 0.06, 0.024, -0.05 + Math.sin(r) * 0.06], { color: '#a8601f', rot: [0, th + 90, 0], parent: 'body', noInk: true });
    });
    return b.act({ click: [[A.par(A.effect('dust', { dur: 0.8 }), A.anim('hop'), A.say('Crunch!', 1.2))]] }).done();
  }),
  // Iron-on patches on a square of denim: a red badge with a yellow star, a pink heart and a lime label. The star
  // patch peels off and is ironed back on.
  e('patches', 'wardrobe', 'sewing', () =>
    m('patches')
      .box([0.18, 0.2, 0.02], [0, 0.1, 0], { color: 'denim', rot: [-8, 0, 0], name: 'denim', edge: 'soft' })
      .box([0.18, 0.006, 0.022], [0, 0.003, 0.002], { color: '#3d5a8a', parent: 'denim', noInk: true })
      .cyl([0.08, 0.008, 0.08], [-0.035, 0.14, 0.012], { color: '#e0473b', rot: [82, 0, 0], name: 'badge', parent: 'denim', piece: true })
      .torus([0.08, 0.08, 0.006], [-0.035, 0.14, 0.017], { color: '#f6d24a', rot: [-8, 0, 0], tube: 0.1, noInk: true, parent: 'badge' })
      .star(0.05, [-0.035, 0.14, 0.022], { color: '#f6d24a', round: 0.006, parent: 'badge' })
      .heart(0.06, [0.045, 0.065, 0.02], { color: '#f4a1c0', parent: 'denim' })
      .box([0.06, 0.04, 0.008], [0.05, 0.155, 0.013], { color: '#9be34d', rot: [-8, 0, 0], parent: 'denim' })
      .act({ click: [[A.detach('badge', 'patch'), A.say('Rrrip!', 1)], [A.reattach('badge'), A.effect('steam', { dur: 1 }), A.say('Fsss!', 1.2)]] })
      .done(),
  ),
  // A paved patio (4 x 4 m of slabs, one step up) set with a round table under a parasol, two chairs and a
  // potted shrub. The paving itself is 0.15 m; the furniture makes it 2.3 m (the vocabulary's 0.1 m is the
  // paving alone). The parasol folds down and opens again.
  e('patio', 'places', 'yards', () => {
    const b = m('patio', { edge: 'sharp' }).box([4, 0.15, 4], [0, 0.075, 0], { color: '#c9c2b0', round: 0.05 });
    b.each(5, (i) => b.box([4, 0.004, 0.03], [0, 0.152, -1.6 + i * 0.8], { color: '#8f8a82', noInk: true, round: 0 }).box([0.03, 0.004, 4], [-1.6 + i * 0.8, 0.152, 0], { color: '#8f8a82', noInk: true, round: 0 }));
    b.cyl([0.9, 0.04, 0.9], [0, 0.76, 0], { color: 'white' }).stick([0, 0.15, 0], [0, 0.74, 0], 0.06, 'white').cyl([0.45, 0.04, 0.45], [0, 0.17, 0], { color: 'white' });
    b.stick([0, 0.78, 0], [0, 2.3, 0], 0.04, 'white')
      .cone([2.4, 0.45, 2.4], [0, 2.12, 0], { color: '#e0473b', segs: 8, name: 'canopy', pivot: [0, 2.3, 0] })
      .cyl([2.42, 0.1, 2.42], [0, 1.92, 0], { color: 'white', segs: 8, taper: 0.97, noInk: true, parent: 'canopy' });
    b.pair((s) => {
      const xx = s * 0.95;
      b.box([0.45, 0.05, 0.45], [xx, 0.6, 0.25], { color: 'lightwood' }).box([0.45, 0.45, 0.04], [xx, 0.85, 0.47], { color: 'lightwood', rot: [-10, 0, 0] });
      for (const [dx, dz] of [[0.2, 0.05], [-0.2, 0.05], [0.2, 0.45], [-0.2, 0.45]]) b.stick([xx + dx, 0.15, dz], [xx + dx, 0.58, dz], 0.04, 'wood');
    });
    return b
      .cyl([0.45, 0.45, 0.45], [-1.5, 0.37, -1.5], { color: '#c8693e', taper: 1.25 })
      .ball([0.75, 0.8, 0.75], [-1.5, 0.95, -1.5], { color: 'leaf', edge: 'soft' })
      .socket('table', [0, 0.78, 0], 'top', { size: 0.5 })
      .socket('chair', [0.95, 0.63, 0.25], 'seat')
      .act({ click: [[A.pose('canopy', { scale: 0.3, dur: 0.6 }), A.say('Fwump.', 1), A.wait(1), A.pose('canopy', { scale: 1, dur: 0.6 }), A.say('Fwap!', 1)]] })
      .done();
  }),
  // A police patrol boat, 12 m: a deep-V white hull with a blue band and POLICE on the side, a wheelhouse with a
  // raked windscreen and side windows, a red-and-blue light bar, a radar that spins, a searchlight, rails round
  // the deck, fenders, and twin outboard motors at the stern.
  e('patrol boat', 'garage', 'boats', () => {
    const prof: Array<[number, number, number, number?]> = [[0, 0.92, 0.75, 0], [0.12, 0.98, 0.9, 0], [0.5, 1, 1, 0], [0.78, 0.86, 1, 0], [0.93, 0.5, 0.95, 0], [1, 0.06, 0.8, 0]];
    const b = m('patrol boat', { view: 'side', edge: 'sharp' })
      .loft([3.8, 3.0, 12], [0, 1.75, 0], prof, { color: '#e4e7ea', cut: 'bottom', boxy: 0.3, name: 'hull', edge: 'soft' })
      .loft([3.78, 0.12, 11.9], [0, 1.78, 0], prof.map(([t, w]) => [t, w * 0.99, 1, 0] as [number, number, number, number]), { color: '#d4d7da', boxy: 0.9, parent: 'hull' })
      .loft([3.84, 0.5, 11.2], [0, 1.15, -0.2], prof.map(([t, w]) => [t, Math.min(1, w * 1.01), 1, 0] as [number, number, number, number]), { color: '#2f5fa8', boxy: 0.5, parent: 'hull', edge: 'soft', noInk: true });
    for (const s of [1, -1]) {
      b.label('POLICE', [2.4, 0.42], [s * 1.93, 1.15, 1.2], { color: '#2f5fa8', rot: [0, s * 90, 0], parent: 'hull', depth: 0.03 });
      b.each(5, (i) => b.stick([s * 1.75, 1.84, -5 + i * 2.2], [s * 1.75, 2.75, -5 + i * 2.2], 0.05, 'silver', { parent: 'hull' }));
      b.stick([s * 1.75, 2.75, -5.2], [s * 1.75, 2.75, 3.6], 0.05, 'silver', { parent: 'hull' }).rod([s * 1.75, 2.75, 3.6], [0, 2.6, 5.8], 0.05, 'silver', { parent: 'hull' });
      b.ball([0.3, 0.6, 0.3], [s * 1.95, 1.4, -1.5], { color: '#f0923b', parent: 'hull', edge: 'soft' }).ball([0.3, 0.6, 0.3], [s * 1.95, 1.4, 1.8], { color: '#f0923b', parent: 'hull', edge: 'soft' });
    }
    // the wheelhouse
    b.box([2.8, 2.2, 3.6], [0, 2.95, -0.8], { color: 'white', round: 0.08, name: 'cabin', parent: 'hull' })
      .box([3.0, 0.15, 4.0], [0, 4.1, -0.9], { color: 'white', round: 0.3, parent: 'cabin' })
      .box([2.5, 1.0, 0.08], [0, 3.35, 1.1], { color: '#2f3d52', rot: [-22, 0, 0], parent: 'cabin', round: 0.05 })
      .box([0.08, 0.9, 2.6], [1.41, 3.4, -0.9], { color: '#2f3d52', parent: 'cabin', round: 0.05 })
      .box([0.08, 0.9, 2.6], [-1.41, 3.4, -0.9], { color: '#2f3d52', parent: 'cabin', round: 0.05 })
      .box([0.06, 1.9, 0.8], [1.41, 2.8, -2.2], { color: '#d4d7da', name: 'door', parent: 'cabin', pivot: [1.41, 2.8, -1.8], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([1.6, 0.2, 0.4], [0, 4.28, 0.4], { color: '#2a2726', parent: 'cabin' })
      .box([0.6, 0.22, 0.38], [0.45, 4.48, 0.4], { color: '#e0473b', name: 'sirenR', parent: 'cabin', mover: { kind: 'light' } })
      .box([0.6, 0.22, 0.38], [-0.45, 4.48, 0.4], { color: '#4e8fd6', name: 'sirenB', parent: 'cabin', mover: { kind: 'light' } })
      .stick([0, 4.2, -1.8], [0, 5.6, -1.8], 0.12, 'silver', { parent: 'cabin' })
      .box([1.4, 0.14, 0.25], [0, 5.65, -1.8], { color: 'white', name: 'radar', parent: 'cabin', mover: { kind: 'spin', axis: 'y', amount: 240 } })
      .stick([0.8, 4.2, -2.4], [0.8, 6.0, -2.4], 0.04, '#2a2726', { parent: 'cabin' })
      .cyl([0.36, 0.3, 0.36], [-0.9, 4.4, 0.6], { color: '#9da3a8', rot: [90, 0, 0], name: 'searchlight', parent: 'cabin' })
      .cyl([0.3, 0.02, 0.3], [-0.9, 4.4, 0.76], { color: '#fff6c8', rot: [90, 0, 0], parent: 'searchlight', mover: { kind: 'light' }, name: 'beam' });
    // bow fittings and the stern: a bench and twin outboards
    b.box([0.5, 0.25, 0.4], [0, 1.95, 4.6], { color: '#9da3a8', parent: 'hull' })
      .box([2.4, 0.5, 0.7], [0, 2.1, -3.6], { color: '#2f3d52', parent: 'hull', round: 0.3, edge: 'soft' })
      .box([0.6, 1.0, 0.7], [0.75, 1.9, -6.2], { color: '#2a2726', parent: 'hull', round: 0.4, name: 'motor1' })
      .box([0.6, 1.0, 0.7], [-0.75, 1.9, -6.2], { color: '#2a2726', parent: 'hull', round: 0.4, name: 'motor2' })
      .box([0.2, 1.1, 0.3], [0.75, 0.9, -6.3], { color: '#5c6166', parent: 'motor1' })
      .box([0.2, 1.1, 0.3], [-0.75, 0.9, -6.3], { color: '#5c6166', parent: 'motor2' })
      .socket('helm', [0, 2.2, -0.4], 'seat')
      .socket('deck', [0, 1.85, 3.5], 'top', { size: 2 });
    return b
      .act({
        click: [
          [A.par(A.operate('siren', 'on'), A.operate('radar', 'on'), A.operate('beam', 'on'), A.say('Wee-woo! Wee-woo!', 2.5)), A.wait(2.5), A.par(A.operate('siren', 'off'), A.operate('beam', 'off'))],
          [A.par(A.effect('water_spray', { dur: 2 }), A.anim('wobble'), A.say('VROOOM!', 1.5)), A.wait(1), A.operate('radar', 'off')],
        ],
      })
      .done();
  }),
  // A pawn shop: barred shop windows with guitars and a watch on show, the three gold balls of the trade hanging
  // from a bracket, a PAWN SHOP sign and a neon WE BUY GOLD sign that buzzes on.
  e('pawnshop', 'places', 'shops', () => {
    const b = bld('pawnshop', { w: 7, d: 8, floors: 1, fh: 4.4, wall: '#d8c8a8', trim: '#5a3a22', shop: true, sign: 'PAWN SHOP', signC: '#e2b23a', door: '#3a3633', sides: true });
    for (const s of [1, -1]) {
      b.each(6, (i) => b.box([0.05, 2.1, 0.05], [s * (1.0 + 0.25 + i * 0.36), 1.97, 4.12], { color: '#2a2726', round: 0.2 }));
      b.rod([s * 1.6, 1.3, 4.0], [s * 1.6, 2.3, 4.0], 0.05, '#5a3a22').ball([0.35, 0.45, 0.12], [s * 1.6, 1.15, 4.0], { color: s > 0 ? '#c0392b' : '#e2b23a' });
    }
    b.cyl([0.2, 0.05, 0.2], [2.4, 1.4, 4.05], { color: 'gold', rot: [90, 0, 0] })
      .rod([3.5, 3.6, 4.0], [3.5, 3.6, 5.1], 0.08, 'iron')
      .stick([3.5, 3.6, 5.0], [3.5, 3.2, 5.0], 0.04, 'iron')
      .ball(0.38, [3.28, 2.95, 5.0], { color: 'gold', edge: 'soft' })
      .ball(0.38, [3.72, 2.95, 5.0], { color: 'gold', edge: 'soft' })
      .ball(0.38, [3.5, 2.6, 5.0], { color: 'gold', edge: 'soft' })
      .box([2.2, 0.5, 0.08], [-2.0, 3.55, 4.06], { color: '#f04fa0', name: 'neon', mover: { kind: 'light' } })
      .label('WE BUY GOLD', [1.9, 0.3], [-2.0, 3.55, 4.11], { color: '#2a2726', depth: 0.02 });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding!', 1), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('neon'), A.say('Bzzzt!', 1)],
        ],
      })
      .done();
  }),
  // A street pay phone on its post (2.2 m) under a hood: a steel housing with a handset on its hook, a cord, a
  // keypad, a coin slot and a little display. It rings; a penny goes in and it dials.
  e('pay phone', 'places', 'street things', () => {
    const b = m('pay phone', { edge: 'sharp' })
      .box([0.4, 0.04, 0.3], [0, 0.02, 0], { color: '#5c6166' })
      .stick([0, 0.04, -0.12], [0, 1.0, -0.12], 0.12, '#8f99a3')
      .box([0.8, 1.1, 0.06], [0, 1.6, -0.2], { color: '#2f5fa8', round: 0.1 })
      .box([0.06, 1.1, 0.6], [0.4, 1.6, 0.07], { color: '#2f5fa8', round: 0.1 })
      .box([0.06, 1.1, 0.6], [-0.4, 1.6, 0.07], { color: '#2f5fa8', round: 0.1 })
      .box([0.86, 0.12, 0.66], [0, 2.18, 0.07], { color: '#2f5fa8', round: 0.2 })
      .label('PHONE', [0.6, 0.14], [0, 2.18, 0.41], { color: 'white', depth: 0.02 })
      .box([0.36, 0.6, 0.16], [0, 1.45, -0.09], { color: '#c9ccd1', round: 0.15, name: 'housing' })
      .box([0.2, 0.06, 0.01], [0, 1.68, 0.0], { color: '#9fe08a', parent: 'housing' })
      .box([0.08, 0.012, 0.02], [0.1, 1.6, 0.0], { color: '#2a2726', parent: 'housing' })
      .capsule([0.07, 0.3, 0.07], [-0.13, 1.47, 0.03], { color: '#2a2726', name: 'handset', parent: 'housing' })
      .ball([0.09, 0.07, 0.07], [-0.13, 1.62, 0.04], { color: '#2a2726', parent: 'handset' })
      .ball([0.09, 0.07, 0.07], [-0.13, 1.32, 0.04], { color: '#2a2726', parent: 'handset' })
      .rod([-0.13, 1.31, 0.02], [-0.06, 1.2, 0.0], 0.015, '#3a3633', { parent: 'housing' });
    b.each(12, (i) => b.box([0.035, 0.03, 0.015], [0.03 + (i % 3) * 0.045, 1.52 - Math.floor(i / 3) * 0.045, -0.005], { color: '#5c6166', parent: 'housing', round: 0.2 }));
    return b
      .socket('slot', [0.1, 1.61, 0.0], 'slot', { size: 0.03 })
      .act({
        click: [
          [A.par(A.anim('shake'), A.say('Ring ring! Ring ring!', 2)), A.pose('handset', { move: [0, 0.12, 0.15], dur: 0.4 }), A.wait(1.2), A.pose('handset', { move: [0, 0, 0], dur: 0.3 })],
          [A.spawn('coin', 'penny', { rel: 'front', of: 'self', dist: 'touch' }), A.attach('coin', 'self', 'slot'), A.say('Clink! Beep-boop-beep...', 2), A.remove('coin', 'sink')],
        ],
      })
      .done();
  }),
  // A PDA: a grey palmtop with a green touch screen, four buttons and a stylus in its slot. The screen boots up;
  // the stylus comes out to tap and goes back.
  e('pda', 'tech', 'gadgets', () => {
    const b = m('pda', { edge: 'sharp' })
      .box([0.08, 0.12, 0.018], [0, 0.06, 0], { color: '#5c6166', round: 0.3, name: 'body' })
      .box([0.064, 0.075, 0.004], [0, 0.075, 0.009], { color: '#b8d8a8', name: 'screen', parent: 'body', mover: { kind: 'light' }, round: 0.1 })
      .box([0.05, 0.004, 0.002], [0, 0.1, 0.0115], { color: '#5a7a50', parent: 'screen', noInk: true, round: 0 })
      .box([0.04, 0.004, 0.002], [-0.005, 0.09, 0.0115], { color: '#5a7a50', parent: 'screen', noInk: true, round: 0 })
      .stick([0.046, 0.005, -0.004], [0.046, 0.115, -0.004], 0.006, 'silver', { name: 'stylus', parent: 'body', piece: true });
    b.each(4, (i) => b.cyl([0.012, 0.004, 0.012], [-0.024 + i * 0.016, 0.022, 0.009], { color: i === 1 || i === 2 ? '#4e8fd6' : '#9da3a8', rot: [90, 0, 0], parent: 'body' }));
    return b.act({ click: [[A.par(A.operate('screen', 'on'), A.say('Boop!', 1))], [A.detach('stylus', 'stylus'), A.say('Tap tap.', 1)], [A.par(A.reattach('stylus'), A.operate('screen', 'off'))]] }).done();
  }),
  // A spoonful of garden peas, each about 8 mm. One rolls off.
  e('pea', 'food', 'vegetables', () => {
    const b = m('pea')
      .ball([0.045, 0.012, 0.035], [0, 0.012, 0], { color: 'silver', edge: 'sharp', name: 'spoon' })
      .box([0.012, 0.006, 0.09], [0, 0.016, -0.06], { color: 'silver', rot: [-10, 0, 0], round: 0.5, parent: 'spoon', edge: 'sharp' });
    for (const [xx, z, y] of [[-0.01, 0.005, 0.02], [0.01, 0.0, 0.02], [0.0, -0.008, 0.021], [0.002, 0.008, 0.026], [-0.006, -0.002, 0.028]]) b.ball(0.009, [xx, y, z], { color: '#7cc45a', parent: 'spoon' });
    return b
      .ball(0.009, [0.008, 0.029, 0.0], { color: '#9be34d', name: 'pea', parent: 'spoon', piece: true })
      .act({ click: [[A.detach('pea', 'pea'), A.say('Roll...', 1)], [A.reattach('pea')]] })
      .done();
  }),
  // A peashooter plant (0.5 m): a snouted green head with a leafy tuft, big eyes, a stalk and broad leaves.
  // It puffs out its cheeks and shoots a pea.
  e('pea shooter', 'fantasy', 'magic plants', () =>
    m('pea shooter')
      .ball([0.3, 0.05, 0.12], [0.08, 0.025, 0.02], { color: 'darkgreen', rot: [0, 30, 0] })
      .ball([0.3, 0.05, 0.12], [-0.08, 0.025, 0.0], { color: 'green', rot: [0, -30, 0] })
      .ball([0.25, 0.04, 0.1], [0.0, 0.022, -0.1], { color: '#4f8f45', rot: [0, 90, 0] })
      .rod([0, 0.02, 0], [0, 0.3, 0], 0.04, 'green')
      .ball(0.16, [0, 0.36, 0], { color: 'lime', name: 'head', pivot: [0, 0.3, 0] })
      .cyl([0.09, 0.14, 0.09], [0, 0.37, 0.12], { color: 'lime', rot: [90, 0, 0], taper: 1.25, parent: 'head' })
      .cyl([0.07, 0.01, 0.07], [0, 0.37, 0.192], { color: 'darkgreen', rot: [90, 0, 0], parent: 'head' })
      .ball(0.035, [0.045, 0.41, 0.065], { color: '#1d1a17', eye: true, parent: 'head' })
      .ball(0.035, [-0.045, 0.41, 0.065], { color: '#1d1a17', eye: true, parent: 'head' })
      .ball(0.01, [0.05, 0.42, 0.08], { color: 'white', noInk: true, parent: 'head' })
      .ball(0.01, [-0.04, 0.42, 0.08], { color: 'white', noInk: true, parent: 'head' })
      .ball([0.05, 0.1, 0.03], [0, 0.46, -0.07], { color: 'green', rot: [-40, 0, 0], parent: 'head' })
      .act({ click: [[A.pose('head', { scale: 1.1, dur: 0.2 }), A.par(A.pose('head', { move: [0, 0, -0.03], scale: 1, dur: 0.1 }), A.say('Pew!', 1)), A.spawn('shot', 'pea', { rel: 'front', of: 'self', dist: 'near' }), A.pose('head', { move: [0, 0, 0], dur: 0.2 }), A.wait(1.2), A.remove('shot', 'pop')]] })
      .done(),
  ),
  // A ripe peach with its blush, a soft crease and a leaf, and a half peach beside it showing the stone. The
  // stone pops out and goes back.
  e('peach (fruit)', 'food', 'fruit', () =>
    m('peach (fruit)')
      .ball([0.076, 0.072, 0.074], [0, 0.036, 0], { color: '#f9b07a', name: 'fruit' })
      .ball([0.05, 0.055, 0.04], [0.016, 0.04, 0.02], { color: '#e8705a', noInk: true, parent: 'fruit' })
      .rod([-0.003, 0.012, 0.036], [0.0, 0.065, 0.03], 0.004, '#d8604a', { noInk: true, parent: 'fruit' })
      .cyl([0.006, 0.012, 0.006], [0, 0.075, 0], { color: 'darkbrown', parent: 'fruit' })
      .ball([0.045, 0.006, 0.02], [0.022, 0.079, 0], { color: 'leaf', rot: [0, 0, 15], parent: 'fruit' })
      .dome([0.07, 0.03, 0.07], [0.085, 0.015, 0.03], { color: '#f9b07a', rot: [180, 0, 0], name: 'half' })
      .cyl([0.064, 0.004, 0.064], [0.085, 0.031, 0.03], { color: '#f8c060', parent: 'half', edge: 'sharp' })
      .ball([0.026, 0.012, 0.032], [0.085, 0.036, 0.03], { color: '#8a3a2a', name: 'stone', parent: 'half', piece: true })
      .act({ click: [[A.detach('stone', 'stone'), A.say('Plop!', 1)], [A.reattach('stone')]] })
      .done(),
  ),
  // A peach tree, 4.5 m, its crown dotted with blushing peaches. A shake drops one.
  e('peach tree', 'garden', 'fruit trees', () => withAct(tree('peach tree', { h: 4.5, crown: 'leaf', crown2: '#6aa848', fruit: '#f9a07a', n: 16, fs: 0.09 }).done(), treeAct('peach (fruit)'))),
  // A peacock's tail feather (1.3 m) standing in a vase: a cream quill, long bronze-green barbs, and the eye at
  // the tip in rings of gold, teal and deep blue. It sways and shimmers.
  e('peacock feather', 'aviary', 'feathers', () =>
    m('peacock feather')
      .cyl([0.14, 0.22, 0.14], [0, 0.11, 0], { color: '#2f4f8f', taper: 0.6, edge: 'sharp' })
      .torus([0.1, 0.1, 0.02], [0, 0.22, 0], { color: '#2f4f8f', rot: [90, 0, 0], tube: 0.3 })
      .rod([0, 0.15, 0], [0.06, 1.35, 0], 0.012, 'cream', { name: 'top', pivot: [0, 0.2, 0] })
      .ball([0.22, 0.9, 0.015], [0.04, 0.78, 0], { color: '#7a8a3a', rot: [0, 0, -3], parent: 'top' })
      .ball([0.16, 0.6, 0.016], [0.045, 0.72, 0.004], { color: '#5a7a2a', rot: [0, 0, -3], parent: 'top', noInk: true })
      .ball([0.3, 0.36, 0.03], [0.06, 1.3, 0.01], { color: '#c8a040', parent: 'top' })
      .ball([0.21, 0.26, 0.03], [0.06, 1.29, 0.022], { color: '#20b0a0', parent: 'top' })
      .ball([0.14, 0.17, 0.03], [0.06, 1.28, 0.034], { color: '#5a3a8a', parent: 'top' })
      .ball([0.08, 0.1, 0.03], [0.06, 1.28, 0.044], { color: '#1a2a6a', parent: 'top' })
      .act({ click: [[A.par(A.pose('top', { rot: [0, 0, 8], dur: 0.5 }), A.effect('sparkle', { dur: 1.5 }), A.say('Shimmer...', 1.5)), A.pose('top', { rot: [0, 0, -6], dur: 0.6 }), A.pose('top', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A peanut in its netted shell (5 cm), with a shelled nut in its red skin beside it. The shell cracks open.
  e('peanut', 'food', 'nuts', () =>
    m('peanut')
      .ball([0.034, 0.03, 0.032], [0, 0.016, 0], { color: '#d9b07a', name: 'shell' })
      .ball([0.024, 0.024, 0.026], [0.024, 0.016, 0], { color: '#d9b07a', parent: 'shell' })
      .ball([0.006, 0.006, 0.004], [0.006, 0.02, 0.016], { color: '#a8804a', noInk: true, parent: 'shell' })
      .ball([0.006, 0.006, 0.004], [-0.008, 0.012, 0.015], { color: '#a8804a', noInk: true, parent: 'shell' })
      .ball([0.032, 0.028, 0.03], [0.048, 0.016, 0.0], { color: '#d9b07a', name: 'end', parent: 'shell', piece: true })
      .ball([0.006, 0.006, 0.004], [0.05, 0.02, 0.015], { color: '#a8804a', noInk: true, parent: 'end' })
      .ball([0.018, 0.024, 0.016], [0.0, 0.009, 0.04], { color: '#b8604a', rot: [0, 0, 90] })
      .act({ click: [[A.detach('end', 'shell'), A.say('Crack!', 1)], [A.reattach('end')]] })
      .done(),
  ),
  // A jar of crunchy peanut butter with a red lid, a label, and a knife with a dollop on it. The lid twists off.
  e('peanut butter', 'food', 'spreads', () =>
    jar('peanut butter', 0.11, 0.09, '#b07a3a', '#c0392b', 'PEANUT BUTTER', 'cream')
      .box([0.016, 0.11, 0.004], [0.07, 0.05, 0.05], { color: 'silver', rot: [0, 0, 15], edge: 'sharp' })
      .ball([0.022, 0.03, 0.012], [0.083, 0.09, 0.05], { color: '#b07a3a' })
      .act({ click: [[A.pose('lid', { rot: [0, 360, 0], dur: 0.5 }), A.detach('lid', 'lid'), A.say('Pop!', 1)], [A.reattach('lid'), A.say('Twist.', 1)]] })
      .done(),
  ),
  // A blue bowl heaped with peanuts in their shells. One hops out.
  e('peanuts', 'food', 'nuts', () => {
    const b = m('peanuts').cyl([0.16, 0.055, 0.16], [0, 0.0275, 0], { color: '#4e8fd6', taper: 1.4, edge: 'sharp' });
    b.each(9, (i) => {
      const a = i * 0.8, r = i ? 0.05 : 0, xx = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.06 + (i ? 0 : 0.015) + (i % 3) * 0.003;
      b.ball([0.035, 0.022, 0.02], [xx - 0.01, y, z], { color: '#d9b07a', rot: [0, a * 57, 0] }).ball([0.03, 0.02, 0.018], [xx + 0.012, y, z], { color: '#d9b07a', rot: [0, a * 57, 0] });
    });
    return b.act({ click: [[A.spawn('nut', 'peanut', { rel: 'front', of: 'self', dist: 'touch' }), A.par(A.anim('hop', 1, 'nut'), A.say('Crunch!', 1)), A.wait(1.5), A.remove('nut', 'pop')]] }).done();
  }),
  // A Williams pear: a broad bottom, a narrow neck, a stalk and leaf, a russet blush. A slice comes off its side.
  e('pear', 'food', 'fruit', () =>
    m('pear')
      .ball([0.075, 0.07, 0.072], [0, 0.035, 0], { color: '#c8d84a', name: 'fruit' })
      .ball([0.05, 0.065, 0.05], [0.004, 0.085, 0], { color: '#c8d84a', parent: 'fruit' })
      .rod([0.004, 0.11, 0], [0.012, 0.135, 0], 0.006, 'darkbrown', { parent: 'fruit' })
      .ball([0.04, 0.006, 0.018], [0.028, 0.125, 0], { color: 'leaf', rot: [0, 0, 25], parent: 'fruit' })
      .ball([0.03, 0.03, 0.02], [-0.018, 0.04, 0.025], { color: '#e0b040', noInk: true, parent: 'fruit' })
      .dome([0.05, 0.012, 0.05], [0.037, 0.038, 0], { color: '#c8d84a', rot: [0, 0, -90], name: 'slice', parent: 'fruit', piece: true })
      .cyl([0.044, 0.004, 0.044], [0.032, 0.038, 0], { color: '#f6f0c8', rot: [0, 0, 90], parent: 'slice' })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Slice!', 1)], [A.reattach('slice')]] })
      .done(),
  ),
  // A pear tree, 5.5 m, hung with pears. A shake drops one.
  e('pear tree', 'garden', 'fruit trees', () => withAct(tree('pear tree', { h: 5.5, crown: 'leaf', crown2: '#4f9a48', fruit: '#d8e05a', n: 14, fs: 0.08, pear: true }).done(), treeAct('pear'))),
  // An oyster opened on its hinge with a pearl on the pearly lining. The shell closes and opens again.
  e('pearl', 'wardrobe', 'jewellery', () =>
    m('pearl')
      .ball([0.13, 0.035, 0.11], [0, 0.0175, 0], { color: '#9a9488' })
      .ball([0.11, 0.02, 0.09], [0, 0.032, 0], { color: '#e8e0f0' })
      .ball([0.13, 0.03, 0.11], [0, 0.075, -0.05], { color: '#8a847a', rot: [-60, 0, 0], name: 'lid', pivot: [0, 0.035, -0.05], mover: { kind: 'swing', axis: 'x', amount: 55 } })
      .ball([0.1, 0.018, 0.08], [0, 0.072, -0.04], { color: '#e8e0f0', rot: [-60, 0, 0], parent: 'lid', noInk: true })
      .ball(0.04, [0, 0.055, 0.008], { color: 'white' })
      .ball([0.012, 0.01, 0.006], [-0.008, 0.066, 0.025], { color: '#fff8ff', noInk: true })
      .act({ click: [[A.operate('lid', 'close'), A.say('Clap!', 1), A.wait(1), A.operate('lid', 'open'), A.effect('sparkle', { dur: 1.2 })]] })
      .done(),
  ),
  // A little cairn of smooth river pebbles. The top one wobbles and clacks.
  e('pebble', 'nature', 'rocks', () =>
    m('pebble')
      .ball([0.1, 0.04, 0.07], [0, 0.02, 0], { color: 'stone' })
      .ball([0.07, 0.034, 0.05], [0.004, 0.055, 0], { color: 'gray', rot: [0, 30, 4] })
      .ball([0.045, 0.03, 0.035], [-0.002, 0.084, 0], { color: '#b9b4a8', rot: [0, -20, 0], name: 'stone3', pivot: [0, 0.07, 0] })
      .act({ click: [[A.pose('stone3', { rot: [0, 0, 12], dur: 0.15 }), A.pose('stone3', { rot: [0, 0, -10], dur: 0.15 }), A.par(A.pose('stone3', { rot: [0, 0, 0], dur: 0.15 }), A.say('Clack!', 1))]] })
      .done(),
  ),
  // A pecan in its glossy striped shell, and a shelled kernel beside it. The shell cracks off.
  e('pecan', 'food', 'nuts', () =>
    m('pecan')
      .ball([0.034, 0.06, 0.034], [0, 0.03, 0], { color: '#8a5a2b', name: 'nut' })
      .cone([0.012, 0.012, 0.012], [0, 0.064, 0], { color: '#5a3a22', parent: 'nut' })
      .capsule([0.006, 0.04, 0.004], [0.006, 0.03, 0.016], { color: '#4a2a18', noInk: true, parent: 'nut' })
      .capsule([0.006, 0.04, 0.004], [-0.008, 0.032, 0.015], { color: '#4a2a18', noInk: true, parent: 'nut' })
      .ball([0.036, 0.034, 0.02], [0, 0.034, -0.008], { color: '#8a5a2b', name: 'shell', parent: 'nut', piece: true })
      .ball([0.03, 0.016, 0.046], [0.045, 0.008, 0.02], { color: '#a0603a' })
      .ball([0.006, 0.012, 0.04], [0.045, 0.016, 0.02], { color: '#7a4020', noInk: true })
      .act({ click: [[A.detach('shell', 'shell'), A.say('Crack!', 1)], [A.reattach('shell')]] })
      .done(),
  ),
  // A white marble display pedestal (1 m): a moulded plinth, a fluted column, a capital and a top slab, with a
  // bust on show. The bust turns and gleams.
  e('pedestal', 'home', 'decor', () =>
    m('pedestal', { edge: 'sharp' })
      .box([0.5, 0.1, 0.5], [0, 0.05, 0], { color: '#eeeae0', round: 0.1 })
      .box([0.44, 0.06, 0.44], [0, 0.13, 0], { color: '#e4dfd2', round: 0.4 })
      .prism([0.32, 0.66, 0.32], [0, 0.49, 0], 12, { color: '#eeeae0' })
      .box([0.44, 0.06, 0.44], [0, 0.85, 0], { color: '#e4dfd2', round: 0.4 })
      .box([0.5, 0.08, 0.5], [0, 0.92, 0], { color: '#eeeae0', round: 0.1 })
      .socket('top', [0, 0.96, 0], 'top', { size: 0.5 })
      .act({ setup: [A.spawn('bust', 'bust'), A.attach('bust', 'self', 'top')], click: [[A.par(A.anim('spin', 1, 'self.top'), A.effect('sparkle', { dur: 1.2 }), A.say('Ta-da!', 1.2))]] })
      .done(),
  ),
  // A Y-shaped vegetable peeler: a red grip, a wire yoke and a slotted swivelling blade. It peels: shhk shhk.
  e('peeler', 'kitchen', 'utensils', () =>
    m('peeler')
      .capsule([0.03, 0.11, 0.022], [0, 0.055, 0], { color: '#e0473b' })
      .rod([0, 0.105, 0], [0.035, 0.16, 0], 0.008, 'silver', { edge: 'sharp' })
      .rod([0, 0.105, 0], [-0.035, 0.16, 0], 0.008, 'silver', { edge: 'sharp' })
      .box([0.07, 0.016, 0.005], [0, 0.165, 0], { color: 'silver', name: 'blade', edge: 'sharp' })
      .box([0.05, 0.003, 0.006], [0, 0.165, 0.001], { color: '#5c6166', noInk: true, parent: 'blade' })
      .act({ click: [[A.pose('blade', { rot: [40, 0, 0], dur: 0.15 }), A.pose('blade', { rot: [-40, 0, 0], dur: 0.2 }), A.par(A.pose('blade', { rot: [0, 0, 0], dur: 0.15 }), A.say('Shhk shhk!', 1))]] })
      .done(),
  ),
  // A pirate's wooden peg leg (0.9 m): a rubber tip, a turned wooden peg with a brass collar, a leather cup and
  // straps. Clomp, clomp.
  e('peg leg', 'clinic', 'mobility aids', () =>
    m('peg leg')
      .cyl([0.06, 0.04, 0.06], [0, 0.02, 0], { color: 'rubber' })
      .cyl([0.06, 0.58, 0.06], [0, 0.33, 0], { color: 'wood', taper: 1.6, edge: 'sharp' })
      .torus([0.1, 0.1, 0.03], [0, 0.62, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.17, 0.22, 0.17], [0, 0.74, 0], { color: 'leather', taper: 1.15 })
      .cyl([0.2, 0.03, 0.2], [0, 0.86, 0], { color: 'darkbrown' })
      .rod([0.09, 0.9, 0], [0.09, 0.64, 0.02], 0.02, 'darkbrown')
      .rod([-0.09, 0.9, 0], [-0.09, 0.64, 0.02], 0.02, 'darkbrown')
      .box([0.04, 0.03, 0.01], [0.09, 0.8, 0.02], { color: 'brass', edge: 'sharp' })
      .act({ click: [[A.par(A.anim('hop'), A.say('Clomp!', 0.8)), A.par(A.anim('hop'), A.say('Clomp!', 0.8))]] })
      .done(),
  ),
  // A flat round tin of airgun pellets with a few waisted lead pellets on the lid. The lid pops off.
  e('pellet', 'armory', 'ammunition', () => {
    const b = m('pellet', { edge: 'sharp' })
      .cyl([0.07, 0.024, 0.07], [0, 0.012, 0], { color: '#5c6166', name: 'tin' })
      .cyl([0.074, 0.012, 0.074], [0, 0.03, 0], { color: '#3f7a3a', name: 'lid', parent: 'tin', piece: true })
      .label('.177', [0.04, 0.02], [0, 0.037, 0.0], { color: '#f6d24a', rot: [-90, 0, 0], parent: 'lid', depth: 0.002 });
    b.each(3, (i) => b.ball(0.01, [0.05 + i * 0.012, 0.005, 0.03 - i * 0.008], { color: 'silver' }).cone([0.01, 0.008, 0.01], [0.05 + i * 0.012, 0.012, 0.03 - i * 0.008], { color: 'silver', rot: [180, 0, 0] }));
    return b.act({ click: [[A.detach('lid', 'lid'), A.say('Pop!', 1)], [A.reattach('lid'), A.say('Click.', 1)]] }).done();
  }),
  // A deer hide (1.4 m) laced into a stretching frame of poles: head, four legs and a short tail, a paler belly.
  // A beating knocks the dust out of it.
  e('pelt', 'wardrobe', 'furs', () => {
    const b = m('pelt');
    b.pair((s) => b.stick([s * 0.6, 0, 0], [s * 0.6, 1.55, 0], 0.07, 'wood').box([0.14, 0.1, 0.5], [s * 0.6, 0.05, 0], { color: 'darkwood', edge: 'sharp' }));
    b.stick([-0.65, 1.45, 0], [0.65, 1.45, 0], 0.06, 'wood').stick([-0.65, 0.18, 0], [0.65, 0.18, 0], 0.06, 'wood');
    b.ball([0.55, 0.85, 0.05], [0, 0.8, 0.02], { color: '#8a5a35', name: 'hide' })
      .ball([0.3, 0.55, 0.055], [0, 0.8, 0.03], { color: '#b8875a', noInk: true, parent: 'hide' })
      .ball([0.22, 0.22, 0.05], [0, 1.27, 0.02], { color: '#8a5a35', parent: 'hide' })
      .ball([0.06, 0.1, 0.04], [0.08, 1.4, 0.02], { color: '#7a4a2a', parent: 'hide' })
      .ball([0.06, 0.1, 0.04], [-0.08, 1.4, 0.02], { color: '#7a4a2a', parent: 'hide' })
      .rod([0.15, 1.02, 0.02], [0.47, 1.3, 0.02], 0.11, '#8a5a35', { parent: 'hide' })
      .rod([-0.15, 1.02, 0.02], [-0.47, 1.3, 0.02], 0.11, '#8a5a35', { parent: 'hide' })
      .rod([0.15, 0.52, 0.02], [0.47, 0.3, 0.02], 0.11, '#8a5a35', { parent: 'hide' })
      .rod([-0.15, 0.52, 0.02], [-0.47, 0.3, 0.02], 0.11, '#8a5a35', { parent: 'hide' })
      .rod([0, 0.4, 0.02], [0.03, 0.27, 0.02], 0.07, '#f0e6d8', { parent: 'hide' });
    for (const [xx, y] of [[0.5, 1.33], [-0.5, 1.33], [0.5, 0.27], [-0.5, 0.27], [0.3, 0.95], [-0.3, 0.95]]) b.rod([xx, y, 0.02], [Math.sign(xx) * 0.6, y, 0], 0.012, '#d9b98a');
    return b.act({ click: [[A.par(A.pose('hide', { move: [0, 0, -0.05], dur: 0.1 }), A.effect('dust', { dur: 1 }), A.say('Thwap!', 1)), A.pose('hide', { move: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // A human pelvis (25 cm across) on a stand: the two flaring hip wings, the sacrum at the back, the hip
  // sockets, the round openings and the pubic arch.
  e('pelvis', 'clinic', 'bones', () => {
    const b = m('pelvis').cyl([0.16, 0.02, 0.1], [0, 0.01, 0], { color: '#5a3a22', edge: 'sharp' }).stick([0, 0.02, -0.02], [0, 0.08, -0.02], 0.012, 'silver');
    // sacrum (a downward wedge at the back), two flaring hip wings, hip sockets, the rings below and the pubic joint
    b.cone([0.08, 0.12, 0.05], [0, 0.17, -0.03], { color: '#e4d8bc', rot: [180, 0, 0], name: 'bone' });
    b.pair((s) =>
      b
        .ball([0.13, 0.12, 0.028], [s * 0.085, 0.21, -0.005], { color: '#efe6cf', rot: [-15, s * 40, s * -20], parent: 'bone' })
        .torus([0.12, 0.1, 0.02], [s * 0.088, 0.24, 0.0], { color: '#e4d8bc', rot: [-15, s * 40, s * -20], tube: 0.18, parent: 'bone' })
        .ball(0.045, [s * 0.1, 0.13, 0.02], { color: '#d8cba8', parent: 'bone' })
        .ball(0.025, [s * 0.118, 0.13, 0.025], { color: '#b8a888', noInk: true, parent: 'bone' })
        .torus([0.065, 0.06, 0.02], [s * 0.05, 0.095, 0.035], { color: '#efe6cf', rot: [25, s * 20, 0], tube: 0.32, parent: 'bone' }),
    );
    b.box([0.03, 0.04, 0.02], [0, 0.09, 0.05], { color: '#e4d8bc', parent: 'bone', round: 0.5 });
    return b.act({ click: [[A.par(A.anim('wobble'), A.say('Clack clack!', 1.2))]] }).done();
  }),
  // A clicky ballpoint pen standing on end: a steel tip, a blue barrel with a grip, a pocket clip and a push
  // button. Click: the point comes out; click: it goes back.
  e('pen', 'study', 'stationery', () =>
    m('pen', { edge: 'sharp' })
      .cone([0.004, 0.006, 0.004], [0, 0.003, 0], { color: '#5c6166', rot: [180, 0, 0], name: 'tip', mover: { kind: 'slide', axis: 'y', amount: -0.004 } })
      .cone([0.013, 0.016, 0.013], [0, 0.014, 0], { color: 'silver', rot: [180, 0, 0] })
      .cyl([0.014, 0.03, 0.014], [0, 0.037, 0], { color: '#2a2726' })
      .cyl([0.013, 0.08, 0.013], [0, 0.092, 0], { color: '#2f6fd0' })
      .cyl([0.015, 0.012, 0.015], [0, 0.138, 0], { color: 'silver' })
      .box([0.004, 0.05, 0.005], [0, 0.12, 0.009], { color: 'silver', round: 0.3 })
      .cyl([0.009, 0.014, 0.009], [0, 0.15, 0], { color: '#2a2726', name: 'button', mover: { kind: 'slide', axis: 'y', amount: -0.004 } })
      .act({ click: [[A.par(A.operate('button', 'down'), A.operate('tip', 'down'), A.say('Click!', 0.8))], [A.par(A.operate('button', 'up'), A.operate('tip', 'up'), A.say('Click!', 0.8))]] })
      .done(),
  ),
  // A yellow hexagonal pencil (19 cm) on its sharpened point: pink eraser, crimped ferrule, bare wood cone and
  // graphite. It scribbles.
  e('pencil', 'study', 'stationery', () =>
    m('pencil', { edge: 'sharp' })
      .cone([0.006, 0.009, 0.006], [0, 0.0045, 0], { color: '#3a3633', rot: [180, 0, 0], name: 'pencil', pivot: [0, 0, 0] })
      .cone([0.017, 0.024, 0.017], [0, 0.021, 0], { color: 'lightwood', rot: [180, 0, 0], segs: 6, parent: 'pencil' })
      .prism([0.017, 0.14, 0.017], [0, 0.103, 0], 6, { color: '#f6d24a', parent: 'pencil' })
      .label('HB', [0.008, 0.02], [0, 0.12, 0.0075], { color: '#f6d24a', parent: 'pencil', depth: 0.001 })
      .cyl([0.0175, 0.016, 0.0175], [0, 0.181, 0], { color: 'silver', parent: 'pencil' })
      .cyl([0.016, 0.014, 0.016], [0, 0.196, 0], { color: '#f4a1c0', parent: 'pencil', edge: 'soft' })
      .act({ click: [[A.par(A.pose('pencil', { rot: [0, 0, 12], dur: 0.2 }), A.say('Scribble scribble...', 1.5)), A.pose('pencil', { rot: [0, 0, -12], dur: 0.2 }), A.pose('pencil', { rot: [0, 0, 10], dur: 0.2 }), A.pose('pencil', { rot: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // A handheld pencil sharpener with a pencil in it and a curl of shavings. The pencil turns: grind, grind.
  e('pencil sharpener', 'study', 'stationery', () =>
    m('pencil sharpener', { edge: 'sharp' })
      .box([0.05, 0.04, 0.03], [0, 0.02, 0], { color: '#4e8fd6', round: 0.2 })
      .cyl([0.018, 0.006, 0.018], [0.026, 0.022, 0], { color: '#2a2726', rot: [0, 0, 90] })
      .box([0.03, 0.004, 0.032], [-0.005, 0.042, 0], { color: 'silver' })
      .box([0.004, 0.004, 0.032], [-0.015, 0.045, 0], { color: '#5c6166' })
      .prism([0.012, 0.08, 0.012], [0.07, 0.024, 0], 6, { color: '#f6d24a', rot: [0, 0, 90], name: 'pencil', pivot: [0.07, 0.024, 0] })
      .cone([0.012, 0.012, 0.012], [0.025, 0.024, 0], { color: 'lightwood', rot: [0, 0, 90], parent: 'pencil' })
      .cyl([0.012, 0.01, 0.012], [0.115, 0.024, 0], { color: '#f4a1c0', rot: [0, 0, 90], parent: 'pencil' })
      .torus([0.024, 0.024, 0.004], [-0.04, 0.008, 0.02], { color: 'lightwood', rot: [70, 0, 0], tube: 0.3, edge: 'soft' })
      .torus([0.016, 0.016, 0.004], [-0.035, 0.006, 0.035], { color: '#f6d24a', rot: [80, 30, 0], tube: 0.3, edge: 'soft' })
      .act({ click: [[A.par(A.pose('pencil', { rot: [720, 0, 0], dur: 1.2 }), A.say('Grind grind...', 1.2)), A.pose('pencil', { rot: [0, 0, 0], dur: 0 }), A.effect('dust', { dur: 0.6 })]] })
      .done(),
  ),
  // A science-class pendulum (55 cm): a wooden base, two uprights and a crossbar, a string and a brass bob that
  // swings back and forth.
  e('pendulum', 'study', 'science', () => {
    const b = m('pendulum', { edge: 'sharp' }).box([0.36, 0.03, 0.18], [0, 0.015, 0], { color: 'wood' });
    b.pair((s) => b.stick([s * 0.16, 0.03, 0], [s * 0.16, 0.54, 0], 0.02, 'darkwood'));
    return b
      .stick([-0.17, 0.53, 0], [0.17, 0.53, 0], 0.025, 'darkwood')
      .stick([0, 0.52, 0], [0, 0.16, 0], 0.004, 'gray', { name: 'arm', pivot: [0, 0.52, 0] })
      .ball(0.07, [0, 0.13, 0], { color: 'brass', parent: 'arm', edge: 'soft' })
      .box([0.2, 0.005, 0.03], [0, 0.032, 0.05], { color: 'white', round: 0 })
      .act({ click: [[A.pose('arm', { rot: [0, 0, 30], dur: 0.5 }), A.par(A.pose('arm', { rot: [0, 0, -28], dur: 0.9 }), A.say('Tick...', 0.8)), A.par(A.pose('arm', { rot: [0, 0, 24], dur: 0.9 }), A.say('...tock', 0.8)), A.pose('arm', { rot: [0, 0, -18], dur: 0.8 }), A.pose('arm', { rot: [0, 0, 0], dur: 0.6 })]] })
      .done();
  }),
  // A penguin suit: a black hooded costume with a white front, orange feet and a beak on the hood. Its wearer
  // flaps their flippers and squawks.
  e('penguin costume', 'wardrobe', 'costumes', () =>
    withAct(
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
            p.add({ name: 'pbeak', parent: 'head', at: [0, d.headY + d.headH * 0.05, d.headD * 0.62], shape: 'cyl', size: [d.headW * 0.4, d.headH * 0.45, d.headW * 0.25], color: col('#f6b830'), taper: 0, srot: [90, 0, 0], layer: 5 });
          },
        ],
      }),
      { click: [[says('flap', 'Squawk! I am a penguin!')], [A.par(A.anim('wobble'), A.say('Waddle, waddle...', 2))]] },
    ),
  ),
  // A short stack of copper pennies (19 mm each) and one more standing on its edge. It flips: heads or tails.
  e('penny', 'home', 'money', () => {
    const b = m('penny', { edge: 'sharp' });
    b.each(5, (i) => b.cyl([0.019, 0.0016, 0.019], [i * 0.0005, 0.0008 + i * 0.0016, 0], { color: i % 2 ? '#c87a4a' : '#b8693a' }));
    b.cyl([0.019, 0.0016, 0.019], [0.024, 0.0008, 0.006], { color: '#b8693a' });
    // one more standing on its edge on top of the stack, ready to flip
    return b
      .cyl([0.019, 0.0016, 0.019], [0.001, 0.0177, 0], { color: '#c87a4a', rot: [90, 0, 0], name: 'coin', pivot: [0.001, 0.0177, 0] })
      .ball([0.007, 0.009, 0.001], [0.001, 0.0177, 0.0009], { color: '#e8a070', noInk: true, parent: 'coin' })
      .act({
        click: [
          [A.pose('coin', { move: [0, 0.06, 0], rot: [720, 0, 0], dur: 0.6 }), A.pose('coin', { move: [0, 0, 0], rot: [1080, 0, 0], dur: 0.4 }), A.say('Heads!', 1.2)],
          [A.pose('coin', { move: [0, 0.06, 0], rot: [1260, 0, 0], dur: 0.6 }), A.pose('coin', { move: [0, 0, 0], rot: [1080, 0, 0], dur: 0.4 }), A.say('Tails!', 1.2)],
        ],
      })
      .done();
  }),
  // A pentagon: a flat five-sided shape on a stand. It turns to show its five sides.
  e('pentagon', 'ideas', 'shapes', () =>
    plinth(m('pentagon'), 0.2)
      .box([0.01, 0.01, 0.01], [0, 0.11, 0], { color: '#5aa553', name: 'shape', round: 0 })
      .prism([0.18, 0.03, 0.18], [0, 0.115, 0], 5, { color: '#5aa553', rot: eulerOf([0, -1, 0], [0, 0, 1]), parent: 'shape', edge: 'sharp' })
      .act({ click: [[A.par(A.pose('shape', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('shape', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A turned wooden pepper mill (20 cm) with a crown knob that twists to grind; a few peppercorns beside it.
  e('pepper (condiment)', 'food', 'spices', () =>
    m('pepper (condiment)')
      .cyl([0.065, 0.035, 0.065], [0, 0.0175, 0], { color: 'darkwood', edge: 'sharp' })
      .cyl([0.045, 0.1, 0.045], [0, 0.085, 0], { color: 'wood', taper: 0.8 })
      .ball([0.06, 0.045, 0.06], [0, 0.15, 0], { color: 'darkwood', name: 'crown' })
      .ball(0.022, [0, 0.18, 0], { color: 'darkwood', parent: 'crown' })
      .cyl([0.02, 0.005, 0.02], [0, 0.0, 0], { color: 'silver', edge: 'sharp' })
      .ball(0.008, [0.05, 0.004, 0.03], { color: '#2a2020' })
      .ball(0.008, [0.065, 0.004, 0.012], { color: '#2a2020' })
      .ball(0.008, [0.045, 0.004, 0.05], { color: '#2a2020' })
      .act({ click: [[A.par(A.pose('crown', { rot: [0, 540, 0], dur: 1.2 }), A.effect('dust', { dur: 1.2 }), A.say('Grind grind!', 1.2)), A.pose('crown', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A red bell pepper (12 cm: the vocabulary's 0.7 m is a pepper plant, but this is the vegetable): four glossy
  // lobes, a green cap and stalk that snaps off.
  e('pepper (vegetable)', 'food', 'vegetables', () => {
    const b = m('pepper (vegetable)').ball([0.05, 0.1, 0.05], [0, 0.055, 0], { color: '#d42a2a', name: 'body' });
    for (const [xx, z] of [[0.024, 0.024], [-0.024, 0.024], [0.024, -0.024], [-0.024, -0.024]]) b.ball([0.062, 0.1, 0.062], [xx, 0.055, z], { color: '#e0332a', parent: 'body' });
    b.ball([0.02, 0.06, 0.01], [0.015, 0.07, 0.05], { color: '#ff7a6a', noInk: true, parent: 'body' });
    return b
      .ball([0.06, 0.018, 0.06], [0, 0.105, 0], { color: '#3f7a3a', name: 'cap', parent: 'body', piece: true })
      .cyl([0.014, 0.03, 0.014], [0.004, 0.122, 0], { color: '#5aa553', rot: [0, 0, -15], parent: 'cap' })
      .act({ click: [[A.detach('cap', 'stalk'), A.say('Snap!', 1)], [A.reattach('cap')]] })
      .done();
  }),
  // A pocket canister of pepper spray: a flip-up safety cap over the button, an orange warning band, a key ring.
  // Pssssht!
  e('pepper spray', 'armory', 'self defence', () =>
    m('pepper spray', { edge: 'sharp' })
      .cyl([0.03, 0.09, 0.03], [0, 0.045, 0], { color: '#2a2726' })
      .cyl([0.031, 0.035, 0.031], [0, 0.045, 0], { color: '#f0923b', noInk: true })
      .box([0.026, 0.018, 0.03], [0, 0.099, 0], { color: '#3a3633', round: 0.3 })
      .box([0.008, 0.008, 0.01], [0, 0.104, 0.016], { color: '#2a2726' })
      .box([0.028, 0.006, 0.032], [0, 0.112, 0], { color: '#e0473b', round: 0.3, name: 'cap', pivot: [0, 0.11, -0.016], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .torus([0.03, 0.03, 0.005], [0, 0.125, -0.02], { color: 'silver', rot: [0, 90, 0], tube: 0.18 })
      .act({ click: [[A.operate('cap', 'open'), A.par(A.effect('smoke', { dur: 1 }), A.say('Pssssht!', 1.2)), A.wait(0.5), A.operate('cap', 'close')]] })
      .done(),
  ),
  // A stick of pepperoni on a little cutting board with slices fanned out. A slice comes away.
  e('pepperoni', 'food', 'meat', () =>
    m('pepperoni')
      .box([0.26, 0.015, 0.14], [0.02, 0.0075, 0.01], { color: 'lightwood', edge: 'sharp', round: 0.3 })
      .capsule([0.04, 0.2, 0.04], [-0.03, 0.035, -0.02], { color: '#a8322a', rot: [0, 10, 88], name: 'stick' })
      .cyl([0.04, 0.006, 0.04], [0.08, 0.035, -0.014], { color: '#c8423a', rot: [0, 0, 88], parent: 'stick' })
      .cyl([0.04, 0.005, 0.04], [0.06, 0.018, 0.045], { color: '#c8423a', rot: [8, 0, 0] })
      .cyl([0.04, 0.005, 0.04], [0.1, 0.02, 0.05], { color: '#c8423a', rot: [12, 0, 0], name: 'slice', parent: 'stick', piece: true })
      .ball([0.008, 0.002, 0.008], [0.1, 0.024, 0.055], { color: 'cream', noInk: true, parent: 'slice' })
      .ball([0.008, 0.002, 0.008], [0.065, 0.021, 0.04], { color: 'cream', noInk: true })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Slice!', 1)], [A.reattach('slice')]] })
      .done(),
  ),
  // A percent sign on a stand: two rings and a slash. It turns.
  e('percent sign', 'ideas', 'symbols', () =>
    plinth(m('percent sign'))
      .rod([-0.055, 0.04, 0], [0.055, 0.2, 0], 0.02, '#8a5fc4', { name: 'sign' })
      .torus([0.055, 0.055, 0.022], [-0.045, 0.17, 0], { color: '#8a5fc4', tube: 0.35, parent: 'sign' })
      .torus([0.055, 0.055, 0.022], [0.045, 0.07, 0], { color: '#8a5fc4', tube: 0.35, parent: 'sign' })
      .act({ click: [[A.par(A.pose('sign', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('sign', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A cut-glass perfume bottle with a gold collar and a tasselled atomiser bulb. A squeeze: a puff of scent.
  e('perfume', 'wardrobe', 'beauty', () =>
    m('perfume')
      .box([0.07, 0.07, 0.045], [0, 0.035, 0], { color: '#f4b8d0', round: 0.4, edge: 'sharp' })
      .box([0.05, 0.05, 0.047], [0, 0.035, 0], { color: '#f8d0e0', round: 0.4, noInk: true })
      .cyl([0.024, 0.016, 0.024], [0, 0.078, 0], { color: 'gold', edge: 'sharp' })
      .cyl([0.016, 0.012, 0.016], [0, 0.092, 0], { color: 'gold', edge: 'sharp' })
      .rod([0.008, 0.094, 0], [0.05, 0.1, 0], 0.005, '#d64fa0')
      .ball([0.035, 0.04, 0.035], [0.065, 0.09, 0], { color: '#d64fa0', name: 'bulb' })
      .rod([0.07, 0.07, 0], [0.072, 0.04, 0], 0.006, 'gold', { parent: 'bulb' })
      .ball([0.02, 0.02, 0.02], [-0.016, 0.05, 0.02], { color: 'white', noInk: true })
      .act({ click: [[A.pose('bulb', { scale: 0.75, dur: 0.15 }), A.par(A.effect('hearts', { dur: 1.5 }), A.say('Pssst!', 1)), A.pose('bulb', { scale: 1, dur: 0.2 })]] })
      .done(),
  ),
  // A periscope (1.2 m): a grey tube with an eyepiece and handles at the bottom and a head with a window at the
  // top that turns to look around.
  e('periscope', 'tech', 'optics', () =>
    m('periscope', { edge: 'sharp' })
      .box([0.16, 0.18, 0.2], [0, 0.32, 0], { color: '#7a7f85', round: 0.2 })
      .box([0.12, 0.08, 0.03], [0, 0.34, 0.1], { color: '#2a2726', round: 0.3 })
      .rod([0.08, 0.3, 0], [0.22, 0.3, 0], 0.04, '#2a2726')
      .rod([-0.08, 0.3, 0], [-0.22, 0.3, 0], 0.04, '#2a2726')
      .stick([0, 0.0, 0], [0, 0.23, 0], 0.1, '#5c6166')
      .cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: '#5c6166' })
      .stick([0, 0.41, 0], [0, 1.08, 0], 0.1, '#7a7f85')
      .box([0.15, 0.16, 0.2], [0, 1.15, 0.03], { color: '#7a7f85', round: 0.2, name: 'head', pivot: [0, 1.15, 0] })
      .box([0.11, 0.09, 0.02], [0, 1.15, 0.135], { color: 'glass', parent: 'head' })
      .act({ click: [[A.par(A.pose('head', { rot: [0, 90, 0], dur: 0.8 }), A.say('Whirr...', 1)), A.pose('head', { rot: [0, -90, 0], dur: 1.2 }), A.pose('head', { rot: [0, 0, 0], dur: 0.8 })]] })
      .done(),
  ),
  // An official permit on a stand: printed lines, a red wax seal, and a rubber stamp that comes down on it.
  e('permit (paper)', 'study', 'papers', () =>
    m('permit (paper)', { edge: 'sharp' })
      .box([0.1, 0.015, 0.05], [0, 0.0075, 0], { color: 'darkwood' })
      .box([0.09, 0.12, 0.006], [0, 0.075, 0], { color: 'cream', rot: [-8, 0, 0], round: 0 })
      .label('PERMIT', [0.07, 0.022], [0, 0.115, 0.006], { color: 'cream', rot: [-8, 0, 0], depth: 0.002 })
      .box([0.06, 0.003, 0.002], [-0.005, 0.09, 0.007], { color: '#9da3a8', noInk: true, rot: [-8, 0, 0], round: 0 })
      .box([0.06, 0.003, 0.002], [-0.005, 0.08, 0.008], { color: '#9da3a8', noInk: true, rot: [-8, 0, 0], round: 0 })
      .box([0.05, 0.003, 0.002], [-0.01, 0.07, 0.01], { color: '#9da3a8', noInk: true, rot: [-8, 0, 0], round: 0 })
      .cyl([0.03, 0.006, 0.03], [0.022, 0.045, 0.012], { color: '#c0392b', rot: [82, 0, 0], name: 'seal', scale: 0 })
      .act({ click: [[A.say('Ka-chunk!', 1), A.par(A.pose('seal', { scale: 1, dur: 0.15 }), A.anim('hop')), A.say('Stamp!', 1.2)], [A.pose('seal', { scale: 0, dur: 0.3 }), A.say('Shuffle.', 1)]] })
      .done(),
  ),
  // A brown bottle of hydrogen peroxide with a white cap and label. Uncapped, it fizzes.
  e('peroxide', 'clinic', 'first aid', () =>
    bottle(m('peroxide'), 0, 0, 0.2, 0.07, '#5a3a22', 'white', { text: 'H2O2', band: 'white', neck: 0.45 })
      .act({ click: [[A.detach('cap', 'cap'), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Fizz!', 1))], [A.reattach('cap'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A leather personal organiser: coloured index tabs, an elastic strap, a pen in its loop and a cover that opens.
  e('personal planner', 'study', 'organisers', () =>
    m('personal planner', { edge: 'sharp' })
      .box([0.15, 0.2, 0.012], [0, 0.1, -0.014], { color: 'leather', round: 0.2 })
      .box([0.14, 0.19, 0.022], [0.002, 0.1, 0.003], { color: 'paper', round: 0.05 })
      .box([0.02, 0.025, 0.018], [0.08, 0.16, 0.004], { color: '#e0473b' })
      .box([0.02, 0.025, 0.018], [0.08, 0.12, 0.004], { color: '#f6d24a' })
      .box([0.02, 0.025, 0.018], [0.08, 0.08, 0.004], { color: '#4e8fd6' })
      .box([0.15, 0.2, 0.01], [0, 0.1, 0.019], { color: 'leather', round: 0.2, name: 'cover', pivot: [-0.075, 0.1, 0.019], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .label('PLANNER', [0.08, 0.03], [0, 0.14, 0.025], { color: '#e2b23a', parent: 'cover', depth: 0.002 })
      .box([0.008, 0.202, 0.05], [0.05, 0.1, 0.002], { color: '#2a2726', noInk: true })
      .cyl([0.012, 0.15, 0.012], [-0.086, 0.1, 0.01], { color: '#2f4f8f' })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip.', 1)], [A.operate('cover', 'close'), A.say('Snap.', 1)]] })
      .done(),
  ),
  // Fresh pesto in a marble mortar with its pestle, basil leaves and pine nuts beside. The pestle grinds.
  e('pesto', 'food', 'sauces', () =>
    m('pesto')
      .cyl([0.16, 0.09, 0.16], [0, 0.045, 0], { color: '#e8e4dc', taper: 1.2, edge: 'sharp' })
      .torus([0.19, 0.19, 0.02], [0, 0.09, 0], { color: '#dcd8d0', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.17, 0.012, 0.17], [0, 0.088, 0], { color: '#4a8a2a' })
      .capsule([0.04, 0.2, 0.04], [0.04, 0.16, -0.01], { color: '#d8d4cc', rot: [0, 0, -30], name: 'pestle', pivot: [0, 0.09, 0] })
      .ball([0.06, 0.012, 0.035], [0.12, 0.006, 0.07], { color: 'leaf', rot: [0, 30, 0] })
      .ball([0.05, 0.012, 0.03], [0.09, 0.006, 0.1], { color: 'darkgreen', rot: [0, -20, 0] })
      .ball([0.012, 0.008, 0.008], [-0.1, 0.004, 0.08], { color: 'cream' })
      .ball([0.012, 0.008, 0.008], [-0.085, 0.004, 0.095], { color: 'cream' })
      .act({ click: [[A.par(A.pose('pestle', { rot: [0, 720, 0], dur: 1.5 }), A.say('Grind, grind...', 1.5)), A.pose('pestle', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A plastic pet carrier (50 cm): a two-tone shell with vents, a carry handle and a wire door on its hinge. The
  // door opens and a kitten pops out.
  e('pet carrier', 'pets', 'pet supplies', () => {
    const b = m('pet carrier', { edge: 'sharp' })
      .box([0.5, 0.18, 0.34], [0, 0.09, 0], { color: '#d4d7da', round: 0.3 })
      .box([0.5, 0.16, 0.34], [0, 0.25, 0], { color: '#8fc6f0', round: 0.4 })
      .box([0.52, 0.03, 0.36], [0, 0.18, 0], { color: '#9da3a8', round: 0.3 })
      .arc([0.2, 0.12, 0.04], [0, 0.3, 0], { color: '#8fc6f0', rot: [0, 90, 0], tube: 0.25 })
      .box([0.3, 0.24, 0.02], [0, 0.17, 0.175], { color: '#c9ccd1', name: 'door', pivot: [-0.15, 0.17, 0.175], mover: { kind: 'swing', axis: 'y', amount: -100 }, round: 0.2 });
    b.each(6, (i) => b.stick([-0.12 + i * 0.048, 0.07, 0.19], [-0.12 + i * 0.048, 0.28, 0.19], 0.01, '#8f99a3', { parent: 'door' }));
    for (const s of [1, -1]) b.each(3, (i) => b.box([0.01, 0.08, 0.03], [s * 0.252, 0.25, -0.08 + i * 0.07], { color: '#4a5a6a', noInk: true, round: 0 }));
    return b
      .socket('inside', [0, 0.12, -0.02], 'inside', { size: 0.3 })
      .act({ click: [[A.operate('door', 'open'), A.spawn('kit', 'kitten', { rel: 'front', of: 'self', dist: 'close' }), A.say('Meow!', 1.5, 'kit'), A.wait(1.5), A.remove('kit', 'fade'), A.operate('door', 'close')]] })
      .done();
  }),
  // A bag of dog food and a red bowl of kibble. A dog comes running for dinner.
  e('pet food', 'pets', 'pet supplies', () => {
    const b = m('pet food')
      .box([0.2, 0.32, 0.1], [0.03, 0.16, -0.09], { color: '#f6d24a', round: 0.4 })
      .box([0.2, 0.03, 0.08], [0.03, 0.33, -0.09], { color: '#e8c03a', round: 0.3, edge: 'sharp' })
      .label('DOG FOOD', [0.15, 0.05], [0.03, 0.24, -0.039], { color: '#c0392b', depth: 0.003 })
      .ball([0.07, 0.06, 0.01], [0.03, 0.13, -0.038], { color: '#8c5a2b', noInk: true })
      .cyl([0.18, 0.06, 0.18], [0, 0.03, 0.1], { color: '#e0473b', taper: 1.3, edge: 'sharp' })
      .ball([0.18, 0.04, 0.18], [0, 0.06, 0.1], { color: '#a0602a' });
    b.each(7, (i) => b.ball(0.022, [Math.cos(i * 0.9) * 0.05, 0.08, 0.1 + Math.sin(i * 0.9) * 0.05], { color: i % 2 ? '#c87a3a' : '#8a4a20' }));
    return b
      .act({ click: [[A.spawn('dog', 'dog', { rel: 'front', of: 'self', dist: 'near' }), A.move('dog', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), A.par(A.anim('wag', 2, 'dog'), A.say('Woof woof!', 1.5, 'dog')), A.wait(1), A.remove('dog', 'fade')]] })
      .done();
  }),
  // A dog kennel (1 m long, 0.95 m to the ridge): plank walls, an arched doorway, a shingled pitched roof, a
  // name board and a water bowl. A dog looks out and barks.
  e('pet house', 'pets', 'pet homes', () => {
    const b = m('pet house', { edge: 'sharp' })
      .box([0.75, 0.55, 0.95], [0, 0.32, 0], { color: '#c0392b', round: 0.05 })
      .box([0.79, 0.06, 0.99], [0, 0.03, 0], { color: '#7a5230', round: 0.1 });
    b.each(4, (i) => b.box([0.76, 0.012, 0.012], [0, 0.15 + i * 0.12, 0.476], { color: '#a3322a', round: 0, noInk: true }));
    gable(b, 0.75, 0.95, 0.595, 0.32, { roof: '#f7f5ef', wall: '#c0392b', over: 0.08, t: 0.04 });
    return b
      .box([0.3, 0.26, 0.04], [0, 0.19, 0.47], { color: '#2a2726', round: 0 })
      .cyl([0.3, 0.04, 0.3], [0, 0.32, 0.47], { color: '#2a2726', rot: [90, 0, 0] })
      .label('REX', [0.2, 0.07], [0, 0.7, 0.49], { color: 'lightwood', depth: 0.02 })
      .cyl([0.18, 0.06, 0.18], [0.3, 0.03, 0.62], { color: '#4e8fd6', taper: 1.3 })
      .cyl([0.15, 0.01, 0.15], [0.3, 0.055, 0.62], { color: 'water', edge: 'soft' })
      .socket('inside', [0, 0.06, 0], 'inside', { size: 0.7 })
      .act({ click: [[A.spawn('dog', 'dog', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wag', 2, 'dog'), A.say('Woof woof!', 1.5, 'dog')), A.wait(1.5), A.remove('dog', 'fade')]] })
      .done();
  }),
  // A pet shop: a fish tank and a puppy pen in the shop windows, a striped awning, a PET SHOP sign and a big
  // paw print on the roof. The door chimes and a puppy trots out to say hello.
  e('pet store', 'places', 'shops', () => {
    const b = bld('pet store', { w: 9, d: 8, floors: 1, fh: 4.4, wall: '#cfe8f0', trim: '#2f8f88', shop: true, awning: '#f6d24a', sign: 'PET SHOP', signC: '#2f8f88' });
    b.box([1.8, 1.1, 0.6], [-2.8, 1.5, 3.6], { color: '#8fd0e8', round: 0.05 })
      .box([1.8, 0.3, 0.6], [-2.8, 0.85, 3.6], { color: '#2a2726', round: 0.05 })
      .ball([0.3, 0.2, 0.08], [-3.1, 1.6, 3.92], { color: 'orange' })
      .ball([0.25, 0.16, 0.08], [-2.4, 1.35, 3.92], { color: '#f6d24a' })
      .box([1.8, 0.5, 0.6], [2.8, 1.05, 3.6], { color: 'lightwood', round: 0.1 })
      .ball([0.35, 0.3, 0.4], [2.6, 1.45, 3.6], { color: '#d9b98a' })
      .ball([0.2, 0.2, 0.2], [2.6, 1.65, 3.8], { color: '#d9b98a' })
      .box([1.8, 1.8, 0.2], [0, 6.0, 0], { color: 'white', round: 0.2 })
      .ball([0.75, 0.65, 0.1], [0, 5.7, 0.12], { color: '#8c5a2b' });
    for (const [xx, y] of [[-0.42, 6.15], [-0.15, 6.4], [0.15, 6.4], [0.42, 6.15]]) b.ball(0.3, [xx, y, 0.12], { color: '#8c5a2b' });
    b.stick([0, 4.8, -0.1], [0, 5.2, -0.1], 0.15, '#9da3a8');
    return b
      .act({ click: [[A.operate('door', 'open'), A.say('Ding-dong!', 1), A.spawn('pup', 'puppy', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wag', 2, 'pup'), A.say('Yip yip!', 1.5, 'pup')), A.wait(1), A.remove('pup', 'fade'), A.operate('door', 'close')]] })
      .done();
  }),
  // A church pew, 3 m long: a solid oak seat at 0.45 m, a sloping back with a book ledge, carved ends with
  // rounded tops, and a kneeler that folds down.
  e('pew', 'home', 'seating', () => {
    const b = m('pew', { edge: 'sharp' })
      .box([3.0, 0.06, 0.45], [0, 0.45, 0], { color: '#6b4226', round: 0.2 })
      .box([3.0, 0.1, 0.03], [0, 0.37, 0.21], { color: '#5a3a22', round: 0.2 })
      .box([3.0, 0.58, 0.05], [0, 0.78, -0.24], { color: '#6b4226', rot: [-10, 0, 0], round: 0.1 })
      .box([3.0, 0.05, 0.14], [0, 1.06, -0.3], { color: '#7a5230', round: 0.3 })
      .box([2.9, 0.12, 0.12], [0, 0.85, -0.34], { color: '#7a5230', round: 0.2 })
      .box([2.9, 0.06, 0.25], [0, 0.12, 0.36], { color: '#8a2b3a', round: 0.3, name: 'kneeler', pivot: [0, 0.12, 0.24], mover: { kind: 'swing', axis: 'x', amount: -80 }, edge: 'soft' });
    b.each(3, (i) => b.box([0.16, 0.22, 0.03], [-1.0 + i * 0.6, 0.98, -0.37], { color: ['#2f4f8f', '#8a2b3a', '#2a2726'][i], round: 0.1 }));
    b.pair((s) => b.box([0.07, 1.0, 0.6], [s * 1.52, 0.5, -0.05], { color: '#7a5230' }).cyl([0.6, 0.07, 0.6], [s * 1.52, 1.0, -0.05], { color: '#7a5230', rot: [0, 0, 90] }).box([0.02, 0.4, 0.3], [s * 1.56, 0.6, -0.05], { color: '#5a3a22', round: 0.3 }));
    return b
      .socket('seat', [0.6, 0.48, 0.0], 'seat')
      .socket('seat2', [-0.6, 0.48, 0.0], 'seat')
      .act({ click: [[A.operate('kneeler', 'open'), A.say('Creak... thunk.', 1.5)], [A.operate('kneeler', 'close'), A.say('Thunk.', 1)]] })
      .done();
  }),
  // A chemist's shop: shop windows, a PHARMACY sign, a green cross on a bracket that lights up, and a door that
  // opens for the pharmacist to hand you your medicine.
  e('pharmacy', 'places', 'shops', () => {
    const b = bld('pharmacy', { w: 9, d: 9, floors: 1, fh: 4.4, wall: '#f7f5ef', trim: '#2f8f4f', shop: true, awning: '#2f8f4f', sign: 'PHARMACY', signC: 'white', glassDoor: true, win: '#bfe3f5' });
    b.rod([4.5, 3.6, 3.6], [4.5, 3.6, 4.9], 0.1, '#9da3a8')
      .box([0.9, 0.3, 0.14], [4.5, 3.6, 5.0], { color: '#5ad06a', name: 'cross', mover: { kind: 'light', on: true } })
      .box([0.3, 0.9, 0.14], [4.5, 3.6, 5.0], { color: '#5ad06a', parent: 'cross' });
    for (const s of [1, -1]) b.each(3, (i) => b.box([0.25, 0.3, 0.12], [s * (2.4 + (i - 1) * 0.5), 1.0 + (i % 2) * 0.35, 4.3], { color: ['#f7f5ef', '#4e8fd6', '#e0473b'][i], round: 0.2 }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.spawn('chemist', 'pharmacist', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('nod', 1, 'chemist'), A.say('Your medicine is ready!', 2.2, 'chemist')), A.wait(1.2), A.remove('chemist', 'fade'), A.operate('door', 'close')],
          [A.operate('cross'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A red rotary telephone: a sloped body, a dial with finger holes, a handset resting on its cradle and a
  // coiled cord. It rings and the handset jumps; the dial turns: brrr-clack.
  e('phone', 'tech', 'phones', () => {
    const b = m('phone')
      .box([0.22, 0.07, 0.2], [0, 0.035, 0], { color: '#c0392b', round: 0.4, name: 'body' })
      .cyl([0.2 * Math.SQRT2, 0.06, 0.19 * Math.SQRT2], [0, 0.09, -0.01], { color: '#c0392b', taper: 0.75, segs: 4, parent: 'body' }) // square to the base (sized corner to corner)
      .cyl([0.1, 0.012, 0.1], [0, 0.085, 0.08], { color: 'white', rot: [60, 0, 0], name: 'dial', parent: 'body', edge: 'sharp' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 1.6 + 0.6;
      // in the dial's tilted plane: across is x, up the face is (0, -0.866, 0.5) turned over, out is (0, 0.5, 0.866)
      const u = Math.cos(a) * 0.033, v = Math.sin(a) * 0.033;
      b.cyl([0.014, 0.008, 0.014], [u, 0.085 + v * 0.866 + 0.004, 0.08 - v * 0.5 + 0.005], { color: '#2a2726', rot: [60, 0, 0], parent: 'dial', noInk: true });
    });
    b.ball(0.024, [0, 0.087, 0.088], { color: '#c0392b', parent: 'dial' });
    b.pair((s) => b.box([0.03, 0.03, 0.04], [s * 0.07, 0.13, -0.01], { color: '#c0392b', parent: 'body' }));
    return b
      .capsule([0.045, 0.2, 0.045], [0, 0.165, -0.01], { color: '#c0392b', rot: [0, 0, 90], name: 'handset' })
      .ball([0.06, 0.05, 0.07], [0.1, 0.16, -0.01], { color: '#c0392b', parent: 'handset' })
      .ball([0.06, 0.05, 0.07], [-0.1, 0.16, -0.01], { color: '#c0392b', parent: 'handset' })
      .rod([-0.12, 0.15, -0.02], [-0.14, 0.03, -0.05], 0.012, '#2a2726')
      .act({
        click: [
          [A.par(A.anim('shake'), A.say('Brrring! Brrring!', 2)), A.pose('handset', { move: [0, 0.06, 0], rot: [0, 0, 8], dur: 0.15 }), A.pose('handset', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.15 })],
          [A.pose('dial', { rot: [0, 0, 200], dur: 0.6 }), A.par(A.pose('dial', { rot: [0, 0, 0], dur: 0.8 }), A.say('Brrr-clack!', 1.2))],
        ],
      })
      .done();
  }),
  // A thick telephone directory with a yellow cover: the cover opens on its spine to show the listings.
  e('phone book', 'study', 'books', () =>
    m('phone book', { edge: 'sharp' })
      .box([0.21, 0.27, 0.06], [0.004, 0.14, 0], { color: 'paper', round: 0.05 })
      .box([0.22, 0.28, 0.008], [0, 0.14, -0.032], { color: '#f6d24a', round: 0.1 })
      .box([0.012, 0.28, 0.07], [-0.105, 0.14, 0], { color: '#f6d24a', round: 0.2 })
      .box([0.22, 0.28, 0.008], [0, 0.14, 0.032], { color: '#f6d24a', round: 0.1, name: 'cover', pivot: [-0.11, 0.14, 0.032], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .label('PHONE BOOK', [0.17, 0.05], [0, 0.21, 0.038], { color: '#f6d24a', parent: 'cover', depth: 0.003 })
      .torus([0.07, 0.05, 0.006], [0, 0.12, 0.038], { color: '#2a2726', tube: 0.3, parent: 'cover' })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip flip flip...', 1.5)], [A.operate('cover', 'close'), A.say('Thud.', 1)]] })
      .done(),
  ),
  // A red telephone box (1 x 1 x 2.5 m): a plinth, panelled walls of small glass panes, an illuminated TELEPHONE
  // sign on each side under the domed roof, a door with a brass handle, and the phone inside. It rings.
  e('phone booth', 'places', 'street things', () => {
    const b = m('phone booth', { edge: 'sharp' })
      .box([1.15, 0.12, 1.15], [0, 0.06, 0], { color: '#a3322a', round: 0.1 })
      .box([1.0, 2.25, 1.0], [0, 1.24, 0], { color: '#d42a2a', round: 0.05, name: 'walls' })
      .box([1.1, 0.12, 1.1], [0, 2.42, 0], { color: '#d42a2a', round: 0.2 })
      .dome([1.05, 0.25, 1.05], [0, 2.6, 0], { color: '#d42a2a' })
      .cyl([0.12, 0.08, 0.12], [0, 2.76, 0], { color: '#d42a2a' });
    for (const [fx, fz, ry] of [[0, 1, 0], [1, 0, 90], [-1, 0, -90], [0, -1, 180]] as Array<[number, number, number]>) {
      b.label('TELEPHONE', [0.8, 0.13], [fx * 0.52, 2.24, fz * 0.52], { color: '#f7f5ef', rot: [0, ry, 0], depth: 0.03, ...(fz === 1 ? { name: 'sign', mover: { kind: 'light' as const } } : {}) });
      if (fz !== 1) for (let i = 0; i < 12; i++) b.box([0.2, 0.2, 0.02], [fx * 0.505 + (fz ? -0.25 + (i % 3) * 0.25 : 0), 1.75 - Math.floor(i / 3) * 0.26, fz * 0.505 + (fx ? -0.25 + (i % 3) * 0.25 : 0)], { color: 'glass', rot: [0, ry, 0], round: 0.05 });
    }
    b.box([0.84, 1.95, 0.05], [0, 1.1, 0.515], { color: '#d42a2a', name: 'door', pivot: [-0.42, 1.1, 0.515], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    b.each(12, (i) => b.box([0.2, 0.2, 0.02], [-0.25 + (i % 3) * 0.25, 1.75 - Math.floor(i / 3) * 0.26, 0.545], { color: 'glass', parent: 'door', round: 0.05 }));
    return b
      .box([0.12, 0.04, 0.04], [0.32, 1.05, 0.56], { color: 'brass', parent: 'door' })
      .box([0.3, 0.4, 0.12], [0, 1.4, -0.42], { color: '#2a2726', round: 0.2 })
      .act({ click: [[A.par(A.operate('sign', 'on'), A.anim('shake'), A.say('Ring ring!', 1.5)), A.operate('door', 'open'), A.wait(2), A.par(A.operate('door', 'close'), A.operate('sign', 'off'))]] })
      .done();
  }),
  // A wind-up gramophone (70 cm with its horn): a wooden cabinet, a turntable with a record, a brass tone arm
  // and a great flared horn, and a crank. It plays: the record turns and notes float out.
  e('phonograph', 'music', 'audio', () =>
    m('phonograph')
      .box([0.36, 0.16, 0.36], [0, 0.08, 0], { color: 'wood', edge: 'sharp', round: 0.1 })
      .box([0.38, 0.02, 0.38], [0, 0.17, 0], { color: 'darkwood', edge: 'sharp', round: 0.2 })
      .cyl([0.3, 0.015, 0.3], [0, 0.188, 0], { color: '#2a2726', name: 'record', mover: { kind: 'spin', axis: 'y', amount: 200 }, edge: 'sharp' })
      .cyl([0.09, 0.016, 0.09], [0, 0.19, 0], { color: '#c0392b', parent: 'record', edge: 'sharp' })
      .box([0.02, 0.003, 0.08], [0.06, 0.197, 0], { color: '#f6d24a', parent: 'record', noInk: true })
      .stick([0.15, 0.18, -0.15], [0.15, 0.26, -0.15], 0.03, 'brass')
      .rod([0.15, 0.26, -0.15], [0.05, 0.22, 0.05], 0.018, 'brass')
      .cyl([0.04, 0.36, 0.04], [0.09, 0.38, -0.05], { color: 'brass', taper: 7, rot: [45, 0, -10] })
      .cyl([0.28, 0.012, 0.28], [0.13, 0.52, 0.08], { color: '#7a5230', rot: [45, 0, -10] })
      .rod([0.18, 0.08, 0], [0.26, 0.08, 0], 0.015, 'brass', { name: 'crank', pivot: [0.18, 0.08, 0] })
      .ball(0.03, [0.27, 0.08, 0.025], { color: 'darkwood', parent: 'crank' })
      .act({
        click: [
          [A.par(A.pose('crank', { rot: [720, 0, 0], dur: 1 }), A.say('Crank crank...', 1)), A.par(A.operate('record', 'on'), A.say('♪ La-di-da-di-da ♪', 2.5)), A.spawn('note', 'musical note', { rel: 'above', of: 'self', dist: 'close' }), A.wait(2), A.remove('note', 'fly_away')],
          [A.operate('record', 'off'), A.say('...scratch.', 1)],
        ],
      })
      .done(),
  ),
  // A cloth-bound photo album with a picture on the cover and a loose snapshot poking out. It opens to show
  // photos on the page.
  e('photo album', 'home', 'keepsakes', () =>
    m('photo album', { edge: 'sharp' })
      .box([0.3, 0.24, 0.05], [0, 0.12, -0.006], { color: 'paper', round: 0.05 })
      .box([0.31, 0.25, 0.008], [0, 0.125, -0.034], { color: '#8a2b3a', round: 0.1 })
      .box([0.012, 0.25, 0.07], [-0.15, 0.125, -0.006], { color: '#8a2b3a', round: 0.2 })
      .box([0.1, 0.08, 0.004], [-0.06, 0.16, 0.02], { color: '#a8d8f5', round: 0 })
      .box([0.1, 0.08, 0.004], [0.07, 0.09, 0.02], { color: '#f6d24a', round: 0 })
      .box([0.31, 0.25, 0.008], [0, 0.125, 0.026], { color: '#8a2b3a', round: 0.1, name: 'cover', pivot: [-0.155, 0.125, 0.026], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .box([0.13, 0.1, 0.006], [0, 0.135, 0.032], { color: 'white', parent: 'cover', round: 0 })
      .box([0.11, 0.06, 0.004], [0, 0.145, 0.036], { color: 'skyblue', noInk: true, parent: 'cover', round: 0 })
      .ball([0.1, 0.03, 0.004], [0, 0.115, 0.036], { color: 'grass', noInk: true, parent: 'cover' })
      .label('PHOTOS', [0.12, 0.03], [0, 0.05, 0.031], { color: '#e2b23a', parent: 'cover', depth: 0.002 })
      .box([0.08, 0.06, 0.004], [0.06, 0.25, 0.0], { color: 'white', rot: [0, 0, -12], round: 0 })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip.', 1)], [A.operate('cover', 'close'), A.say('Thump.', 1)]] })
      .done(),
  ),
  // A street photo booth (1.8 x 1 m, 2.1 m tall): a curtained doorway with a stool inside, a screen, a coin slot
  // and the slot where the strip comes out, a flash above the door. The curtain closes, flash flash flash, and
  // a strip of photos slides out.
  e('photo booth', 'places', 'street things', () => {
    const b = m('photo booth', { edge: 'sharp' })
      .box([1.8, 2.1, 1.0], [0, 1.05, 0], { color: '#2a5aa0', round: 0.04, name: 'walls' })
      .box([1.9, 0.3, 1.1], [0, 2.25, 0], { color: '#f6d24a', round: 0.2 })
      .label('PHOTO BOOTH', [1.5, 0.24], [0, 2.25, 0.56], { color: '#f6d24a', depth: 0.02 })
      .box([0.8, 1.75, 0.04], [-0.4, 0.95, 0.49], { color: '#1e1b1f', round: 0 })
      .cyl([0.4, 0.5, 0.4], [-0.4, 0.25, 0.25], { color: '#9da3a8' })
      .box([0.25, 1.6, 0.06], [-0.7, 1.0, 0.54], { color: '#c0392b', round: 0.3, name: 'curtain', mover: { kind: 'slide', axis: 'x', amount: 0.55 }, edge: 'soft' })
      .stick([-0.85, 1.85, 0.56], [0.05, 1.85, 0.56], 0.03, 'silver')
      .box([0.3, 0.1, 0.08], [-0.4, 1.95, 0.52], { color: '#fff6c8', name: 'flash', mover: { kind: 'light' }, round: 0.3 })
      .box([0.55, 0.4, 0.04], [0.45, 1.35, 0.51], { color: '#7fc8ff', round: 0.1 })
      .label('4 PHOTOS', [0.45, 0.12], [0.45, 1.65, 0.52], { color: '#f7f5ef', depth: 0.01 })
      .box([0.08, 0.02, 0.03], [0.6, 1.05, 0.52], { color: '#2a2726', round: 0 })
      .box([0.14, 0.02, 0.04], [0.45, 0.8, 0.52], { color: '#2a2726', round: 0 })
      .box([0.1, 0.36, 0.008], [0.45, 0.62, 0.54], { color: 'white', name: 'strip', scale: 0, round: 0 })
      .socket('stool', [-0.4, 0.5, 0.25], 'seat');
    return b
      .act({
        click: [
          [A.operate('curtain', 'on'), A.say('Smile!', 1), A.operate('flash', 'on'), A.operate('flash', 'off'), A.wait(0.3), A.operate('flash', 'on'), A.operate('flash', 'off'), A.wait(0.3), A.par(A.operate('flash', 'on'), A.say('Flash!', 0.8)), A.operate('flash', 'off'), A.pose('strip', { scale: 1, dur: 0.8 }), A.operate('curtain', 'off')],
          [A.pose('strip', { scale: 0, dur: 0.3 }), A.say('Whirr.', 1)],
        ],
      })
      .done();
  }),
  // A printed photograph (10 x 15 cm) of a sunny landscape in a white border, propped on a little easel stand.
  e('photograph', 'home', 'keepsakes', () =>
    m('photograph', { edge: 'sharp' })
      .box([0.11, 0.15, 0.006], [0, 0.08, 0], { color: 'white', rot: [-10, 0, 0], round: 0, name: 'photo' })
      .box([0.095, 0.11, 0.004], [0, 0.088, 0.004], { color: '#a8d8f5', noInk: true, rot: [-10, 0, 0], round: 0, parent: 'photo' })
      .box([0.095, 0.04, 0.004], [0, 0.05, 0.008], { color: '#5aa553', noInk: true, rot: [-10, 0, 0], round: 0, parent: 'photo' })
      .ball([0.02, 0.02, 0.004], [0.025, 0.12, 0.01], { color: '#f6d24a', noInk: true, parent: 'photo' })
      .box([0.08, 0.008, 0.03], [0, 0.004, 0.0], { color: 'darkwood', round: 0.2 })
      .rod([0, 0.08, -0.014], [0, 0.0, -0.05], 0.008, 'darkwood')
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1 }), A.pose('photo', { rot: [-10, 0, 0], dur: 0.3 }), A.say('Click!', 1.2)), A.pose('photo', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A grand piano (1.5 m wide, 1.8 m long) with its lid propped open: a curved black case on three legs, a
  // keyboard of white and black keys, a music desk with a score, a pedal lyre and a bench. It plays a tune; a
  // second click lowers the lid.
  e('piano', 'music', 'keyboards', () => {
    const hinge: Vec3 = [0.72, 1.0, 0], la = rad(-40);
    const lid = (p: Vec3): Vec3 => {
      const dx = p[0] - hinge[0], dy = p[1] - hinge[1];
      return [hinge[0] + dx * Math.cos(la) - dy * Math.sin(la), hinge[1] + dx * Math.sin(la) + dy * Math.cos(la), p[2]];
    };
    const b = m('piano', { edge: 'sharp' })
      .loft([1.5, 0.34, 1.8], [0, 0.83, -0.3], [[0, 0.32, 1], [0.25, 0.62, 1], [0.6, 0.95, 1], [1, 1, 1]], { color: '#1e1b1f', boxy: 0.92, name: 'case' })
      .box([1.5, 0.12, 0.3], [0, 0.72, 0.72], { color: '#1e1b1f', round: 0.2 })
      .box([1.32, 0.03, 0.17], [0, 0.79, 0.68], { color: '#f7f5ef', round: 0.1 })
      .box([1.5, 0.14, 0.05], [0, 0.86, 0.6], { color: '#1e1b1f', round: 0.2 });
    for (let o = 0; o < 7; o++) for (const k of [0, 1, 3, 4, 5]) b.box([0.012, 0.02, 0.09], [-0.64 + o * 0.188 + k * 0.027 + 0.02, 0.81, 0.64], { color: '#1e1b1f', round: 0.1 });
    b.box([0.7, 0.32, 0.03], [0, 1.05, 0.5], { color: '#1e1b1f', rot: [-12, 0, 0], round: 0.1 })
      .box([0.42, 0.28, 0.01], [0, 1.06, 0.52], { color: 'paper', rot: [-12, 0, 0], round: 0 })
      .box([1.45, 0.03, 1.75], lid([0, 1.015, -0.32]), { color: '#1e1b1f', rot: [0, 0, -40], round: 0.3, name: 'lid', pivot: hinge, mover: { kind: 'swing', axis: 'z', amount: 40 } })
      .rod([-0.45, 1.0, -0.4], [-0.45, 1.5, -0.4], 0.02, '#1e1b1f');
    for (const [xx, z] of [[0.62, 0.45], [-0.62, 0.45], [0, -1.05]]) b.cyl([0.1, 0.66, 0.1], [xx, 0.33, z], { color: '#1e1b1f', taper: 0.75 });
    b.box([0.2, 0.36, 0.05], [0, 0.3, 0.5], { color: '#1e1b1f', round: 0.2 });
    b.each(3, (i) => b.box([0.03, 0.015, 0.08], [-0.05 + i * 0.05, 0.06, 0.55], { color: 'brass', round: 0.3 }));
    b.box([0.8, 0.07, 0.36], [0, 0.5, 1.2], { color: '#1e1b1f', round: 0.2 }).box([0.76, 0.05, 0.32], [0, 0.55, 1.2], { color: '#5a3a22', round: 0.4, edge: 'soft' });
    for (const [xx, z] of [[0.33, 1.06], [-0.33, 1.06], [0.33, 1.34], [-0.33, 1.34]]) b.cyl([0.05, 0.47, 0.05], [xx, 0.235, z], { color: '#1e1b1f' });
    return b
      .socket('bench', [0, 0.58, 1.2], 'seat')
      .act({
        click: [
          [A.par(A.say('♪ Plink plonk, plink plonk plink! ♪', 2.5), A.anim('pulse')), A.spawn('note', 'musical note', { rel: 'above', of: 'self', dist: 'close' }), A.wait(1.8), A.remove('note', 'fly_away')],
          [A.operate('lid'), A.say('Thunk.', 1)],
        ],
      })
      .done();
  }),
  // A guitar plectrum (3 cm): a tortoiseshell rounded triangle with a little star, standing on its tip. Twang!
  e('pick (guitar)', 'music', 'accessories', () =>
    m('pick (guitar)', { edge: 'sharp' })
      .ball([0.028, 0.026, 0.0025], [0, 0.017, 0], { color: '#c0392b', name: 'pick', pivot: [0, 0, 0] })
      .cone([0.018, 0.012, 0.0025], [0, 0.006, 0], { color: '#c0392b', rot: [180, 0, 0], parent: 'pick' })
      .ball([0.012, 0.01, 0.003], [0.004, 0.02, 0.0005], { color: '#e8705a', parent: 'pick', noInk: true, edge: 'soft' })
      .box([0.03, 0.004, 0.012], [0, 0.002, 0], { color: '#2a2726', round: 0.3 })
      .act({ click: [[A.par(A.pose('pick', { rot: [0, 360, 0], dur: 0.6 }), A.say('Twang!', 1)), A.pose('pick', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A pickaxe (0.9 m haft): an ash handle and a forged steel head with a point on one side and a chisel blade on
  // the other. It swings: clang!
  e('pick (tool)', 'workshop', 'digging tools', () =>
    m('pick (tool)')
      .stick([0, 0, 0], [0, 0.9, 0], 0.045, 'wood', { name: 'pick', pivot: [0, 0, 0] })
      .box([0.08, 0.1, 0.07], [0, 0.88, 0], { color: 'iron', parent: 'pick', edge: 'sharp' })
      .rod([0.03, 0.88, 0], [0.26, 0.82, 0], 0.045, 'iron', { parent: 'pick', edge: 'sharp' })
      .cone([0.045, 0.12, 0.045], [0.33, 0.78, 0], { color: 'iron', rot: [0, 0, -110], parent: 'pick', edge: 'sharp' })
      .rod([-0.03, 0.88, 0], [-0.24, 0.83, 0], 0.045, 'iron', { parent: 'pick', edge: 'sharp' })
      .box([0.1, 0.07, 0.012], [-0.3, 0.8, 0], { color: 'steel', rot: [0, 0, 20], parent: 'pick', edge: 'sharp' })
      .act({ click: [[A.pose('pick', { rot: [0, 0, 40], dur: 0.4 }), A.par(A.pose('pick', { rot: [0, 0, -55], dur: 0.2 }), A.effect('dust', { dur: 0.8 }), A.say('CLANG!', 1)), A.pose('pick', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A knobbly dill pickle (10 cm) with a slice cut from its end. The slice comes away: crunch.
  e('pickle', 'food', 'pickles and olives', () => {
    const b = m('pickle').capsule([0.038, 0.11, 0.036], [0, 0.019, 0], { color: '#6a8a2a', rot: [0, 15, 85], name: 'pickle' });
    b.each(6, (i) => b.ball(0.01, [-0.045 + i * 0.018, 0.03 + (i % 2) * 0.006, 0.012], { color: '#8aaa3a', noInk: true, parent: 'pickle' }));
    return b
      .cyl([0.036, 0.008, 0.036], [0.07, 0.018, 0.04], { color: '#b8c860', rot: [70, 0, 0], name: 'slice', parent: 'pickle', piece: true })
      .ball([0.02, 0.012, 0.004], [0.07, 0.019, 0.045], { color: '#e0e8a0', noInk: true, parent: 'slice' })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Crunch!', 1)], [A.reattach('slice')]] })
      .done();
  }),
  // A wooden picnic table (1.8 m) with its two benches on A-frame legs, a gingham cloth and a picnic basket
  // whose lid opens to bring out a sandwich.
  e('picnic table', 'home', 'outdoor furniture', () => {
    const b = m('picnic table', { edge: 'sharp' });
    b.each(5, (i) => b.box([1.8, 0.04, 0.15], [0, 0.74, -0.32 + i * 0.16], { color: 'wood', round: 0.2 }));
    b.box([1.0, 0.006, 0.7], [0, 0.763, 0], { color: '#e0473b', noInk: true, round: 0 });
    b.each(12, (i) => b.box([0.12, 0.004, 0.12], [-0.42 + (i % 4) * 0.28 + (Math.floor(i / 4) % 2) * 0.14, 0.767, -0.24 + Math.floor(i / 4) * 0.24], { color: 'white', noInk: true, round: 0 }));
    b.pair((s) => {
      b.box([1.8, 0.04, 0.26], [0, 0.45, s * 0.62], { color: 'wood', round: 0.2 });
      b.rod([0.62, 0, s * 0.72], [0.62, 0.72, s * 0.12], 0.08, 'darkwood').rod([-0.62, 0, s * 0.72], [-0.62, 0.72, s * 0.12], 0.08, 'darkwood');
    });
    b.stick([0.62, 0.42, -0.75], [0.62, 0.42, 0.75], 0.07, 'darkwood').stick([-0.62, 0.42, -0.75], [-0.62, 0.42, 0.75], 0.07, 'darkwood');
    b.box([0.4, 0.22, 0.28], [0.4, 0.88, 0.0], { color: '#d8b07a', round: 0.2, name: 'basket' })
      .box([0.42, 0.04, 0.3], [0.4, 1.01, 0.0], { color: '#c89a5a', round: 0.2, name: 'lid', parent: 'basket', pivot: [0.4, 0.99, -0.14], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .arc([0.24, 0.16, 0.02], [0.4, 1.0, 0.0], { color: '#a07040', rot: [0, 90, 0], tube: 0.2, parent: 'basket' });
    return b
      .socket('table', [-0.3, 0.77, 0], 'top', { size: 0.6 })
      .socket('bench', [0.3, 0.48, 0.62], 'seat')
      .act({ click: [[A.operate('lid', 'open'), A.spawn('food', 'sandwich', { rel: 'on', of: 'self', dist: 'touch' }), A.par(A.anim('hop', 1, 'food'), A.say('Ta-da!', 1.5)), A.wait(1.5), A.remove('food', 'fade'), A.operate('lid', 'close')]] })
      .done();
  }),
  // A cherry pie in its tin (22 cm): fluted crust edge, a lattice top, dark fruit showing through. A slice is cut
  // and lifted out.
  e('pie', 'food', 'desserts', () => {
    const b = m('pie')
      .cyl([0.22, 0.04, 0.22], [0, 0.02, 0], { color: 'silver', taper: 1.15, edge: 'sharp', name: 'tin' })
      .cyl([0.22, 0.012, 0.22], [0, 0.044, 0], { color: '#8a2a3a', parent: 'tin' })
      .torus([0.25, 0.25, 0.03], [0, 0.048, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.12, parent: 'tin' });
    b.each(3, (i) => b.box([0.026, 0.012, 0.21], [-0.06 + i * 0.06, 0.054, -0.01], { color: 'bread', parent: 'tin' }).box([0.21, 0.012, 0.026], [0, 0.058, -0.07 + i * 0.05], { color: 'bread', parent: 'tin' }));
    return b
      .wedge([0.08, 0.11, 0.045], [0, 0.04, 0.056], { color: '#8a2a3a', rot: [-90, 0, 0], name: 'slice', parent: 'tin', piece: true })
      .box([0.08, 0.012, 0.025], [0, 0.064, 0.1], { color: 'crust', parent: 'slice' })
      .box([0.02, 0.01, 0.09], [0, 0.064, 0.06], { color: 'bread', parent: 'slice' })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Slice!', 1.2)], [A.reattach('slice')]] })
      .done();
  }),
  // A pink ceramic piggy bank with a coin slot on its back, a snout, floppy ears, a curly tail and a stopper
  // underneath. A penny drops in: clink! Shake it: jingle.
  e('piggy bank', 'home', 'money', () => {
    const b = m('piggy bank', { view: 'side' })
      .ball([0.15, 0.15, 0.21], [0, 0.11, 0], { color: '#f4a1c0', name: 'body' })
      .cyl([0.065, 0.035, 0.055], [0, 0.11, 0.115], { color: '#f48cb0', rot: [90, 0, 0], parent: 'body' })
      .ball([0.013, 0.016, 0.006], [0.013, 0.11, 0.134], { color: '#c0507a', noInk: true, parent: 'body' })
      .ball([0.013, 0.016, 0.006], [-0.013, 0.11, 0.134], { color: '#c0507a', noInk: true, parent: 'body' })
      .box([0.012, 0.004, 0.05], [0, 0.186, -0.01], { color: '#2a2726', parent: 'body', edge: 'sharp' })
      .torus([0.035, 0.035, 0.008], [0, 0.13, -0.115], { color: '#f4a1c0', rot: [0, 90, 0], tube: 0.25, parent: 'body' })
      .cyl([0.04, 0.008, 0.04], [0, 0.035, 0], { color: '#2a2726', parent: 'body' });
    b.pair((s) => b.cone([0.045, 0.05, 0.02], [s * 0.042, 0.185, 0.06], { color: '#f4a1c0', rot: [-30, 0, s * -25], parent: 'body' }).ball(0.016, [s * 0.034, 0.14, 0.09], { color: '#1d1a17', eye: true, parent: 'body' }));
    for (const [xx, z] of [[0.045, 0.055], [-0.045, 0.055], [0.045, -0.055], [-0.045, -0.055]]) b.cyl([0.035, 0.045, 0.035], [xx, 0.022, z], { color: '#f4a1c0', parent: 'body' });
    return b
      .socket('slot', [0, 0.19, -0.01], 'slot', { size: 0.03 })
      .act({
        click: [
          [A.spawn('coin', 'penny', { rel: 'front', of: 'self', dist: 'touch' }), A.attach('coin', 'self', 'slot'), A.par(A.anim('hop'), A.say('Clink!', 1)), A.remove('coin', 'sink')],
          [A.par(A.anim('shake'), A.say('Jingle jingle!', 1.5))],
        ],
      })
      .done();
  }),
  // A pigpen (4 x 4 m): a rail fence on posts with a gate, a mud wallow, a feed trough, a lean-to shelter, and
  // a pink pig that oinks and trots about.
  e('pigpen', 'farm', 'pens', () => {
    const b = m('pigpen').box([4.2, 0.08, 4.2], [0, 0.04, 0], { color: 'dirt', edge: 'soft' }).ball([1.8, 0.08, 1.3], [-0.6, 0.08, 0.4], { color: '#5a3a22' });
    for (const [xx, z] of [[2, 2], [-2, 2], [2, -2], [-2, -2], [0, -2], [2, 0], [-2, 0], [-0.7, 2], [0.7, 2]]) b.stick([xx, 0, z], [xx, 1.1, z], 0.12, 'darkwood', { edge: 'sharp' });
    for (const y of [0.45, 0.9]) {
      b.box([4, 0.1, 0.06], [0, y, -2], { color: 'wood', edge: 'sharp' });
      b.box([0.06, 0.1, 4], [2, y, 0], { color: 'wood', edge: 'sharp' }).box([0.06, 0.1, 4], [-2, y, 0], { color: 'wood', edge: 'sharp' });
      b.box([1.3, 0.1, 0.06], [1.35, y, 2], { color: 'wood', edge: 'sharp' }).box([1.3, 0.1, 0.06], [-1.35, y, 2], { color: 'wood', edge: 'sharp' });
    }
    b.box([1.36, 0.1, 0.05], [0, 0.9, 2.02], { color: 'lightwood', name: 'gate', pivot: [-0.68, 0.7, 2.02], mover: { kind: 'swing', axis: 'y', amount: -100 }, edge: 'sharp' })
      .box([1.36, 0.1, 0.05], [0, 0.45, 2.02], { color: 'lightwood', parent: 'gate', edge: 'sharp' })
      .rod([-0.6, 0.45, 2.02], [0.6, 0.9, 2.02], 0.06, 'lightwood', { parent: 'gate' });
    // the shelter and the trough
    b.box([1.8, 0.08, 1.4], [1.0, 1.2, -1.3], { color: '#7a5230', rot: [12, 0, 0], edge: 'sharp' })
      .stick([0.2, 0, -0.7], [0.2, 1.15, -0.7], 0.08, 'darkwood').stick([1.8, 0, -0.7], [1.8, 1.15, -0.7], 0.08, 'darkwood')
      .box([1.8, 1.3, 0.06], [1.0, 0.65, -1.95], { color: '#8c5a2b', edge: 'sharp' })
      .box([1.0, 0.25, 0.35], [-1.3, 0.16, -1.5], { color: 'darkwood', edge: 'sharp' })
      .box([0.9, 0.05, 0.25], [-1.3, 0.27, -1.5], { color: '#c8a050', edge: 'sharp' });
    // the pig
    b.ball([0.45, 0.42, 0.78], [0.3, 0.42, 0.2], { color: '#f4a1c0', name: 'pig', pivot: [0.3, 0.1, 0.2] })
      .ball([0.32, 0.3, 0.3], [0.3, 0.52, 0.62], { color: '#f4a1c0', parent: 'pig' })
      .cyl([0.15, 0.08, 0.12], [0.3, 0.48, 0.79], { color: '#f48cb0', rot: [90, 0, 0], parent: 'pig' })
      .ball(0.03, [0.38, 0.6, 0.74], { color: '#1d1a17', eye: true, parent: 'pig' })
      .ball(0.03, [0.22, 0.6, 0.74], { color: '#1d1a17', eye: true, parent: 'pig' })
      .torus([0.08, 0.08, 0.02], [0.3, 0.52, -0.2], { color: '#f4a1c0', rot: [0, 90, 0], tube: 0.25, parent: 'pig' });
    b.pair((s) => b.cone([0.1, 0.12, 0.05], [0.3 + s * 0.1, 0.69, 0.6], { color: '#f4a1c0', rot: [-20, 0, s * -25], parent: 'pig' }).cyl([0.09, 0.22, 0.09], [0.3 + s * 0.13, 0.11, 0.42], { color: '#f4a1c0', parent: 'pig' }).cyl([0.09, 0.22, 0.09], [0.3 + s * 0.13, 0.11, -0.02], { color: '#f4a1c0', parent: 'pig' }));
    return b
      .act({
        click: [
          [A.par(A.pose('pig', { move: [0, 0.12, 0], dur: 0.2 }), A.say('Oink oink!', 1.5)), A.pose('pig', { move: [0, 0, 0], dur: 0.2 }), A.pose('pig', { rot: [0, 40, 0], dur: 0.5 }), A.pose('pig', { rot: [0, 0, 0], dur: 0.5 })],
          [A.operate('gate', 'open'), A.say('Creak...', 1.2), A.wait(2), A.operate('gate', 'close')],
        ],
      })
      .done();
  }),
  // Little sausages rolled in golden pastry on a plate with a pot of mustard. One is taken.
  e('pigs in a blanket', 'food', 'snacks', () => {
    const b = plate(m('pigs in a blanket'), 0.22);
    b.each(3, (i) => {
      const z = -0.05 + i * 0.05, xx = (i - 1) * 0.015, own = i === 2;
      b.capsule([0.024, 0.09, 0.024], [xx, 0.03, z], { color: '#b0503a', rot: [0, 0, 90], ...(own ? { name: 'pig', parent: 'pig0', piece: true } : i === 0 ? { name: 'pig0' } : {}) });
      b.capsule([0.038, 0.05, 0.034], [xx, 0.033, z], { color: 'bread', rot: [0, 0, 90], ...(own ? { parent: 'pig' } : {}) });
    });
    return b
      .cyl([0.05, 0.03, 0.05], [0.07, 0.03, 0.06], { color: 'white', edge: 'sharp' })
      .cyl([0.044, 0.006, 0.044], [0.07, 0.045, 0.06], { color: '#f6c445' })
      .act({ click: [[A.par(A.effect('steam', { dur: 1.5 }), A.say('Sizzle!', 1.5))], [A.detach('pig', 'snack'), A.say('Chomp!', 1)], [A.reattach('pig')]] })
      .done();
  }),
  // A pilgrim's capotain: a tall black felt crown on a wide flat brim, with a band and a square gold buckle.
  // It tips politely.
  e('pilgrim hat', 'wardrobe', 'hats', () =>
    m('pilgrim hat')
      .cyl([0.36, 0.015, 0.36], [0, 0.0075, 0], { color: '#2a2726', name: 'hat', pivot: [0, 0, 0] })
      .cyl([0.18, 0.2, 0.18], [0, 0.115, 0], { color: '#2a2726', taper: 0.85, parent: 'hat' })
      .cyl([0.182, 0.04, 0.182], [0, 0.036, 0], { color: '#5c6166', parent: 'hat' })
      .box([0.07, 0.055, 0.012], [0, 0.036, 0.09], { color: 'gold', parent: 'hat', edge: 'sharp' })
      .box([0.036, 0.028, 0.014], [0, 0.036, 0.092], { color: '#5c6166', parent: 'hat', edge: 'sharp' })
      .act({ click: [[A.pose('hat', { move: [0, 0.06, 0], rot: [-20, 0, 0], dur: 0.3 }), A.say('Doff!', 1.2), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // Pills: a round scored tablet (1 cm) and a two-tone capsule spilled from an orange prescription bottle with a
  // white child-proof cap. The cap comes off and the capsule pulls apart.
  e('pill', 'clinic', 'medicine', () =>
    m('pill')
      .cyl([0.045, 0.07, 0.045], [-0.03, 0.035, -0.01], { color: '#f0923b', name: 'bottle', edge: 'sharp' })
      .label('Rx', [0.03, 0.03], [-0.03, 0.035, 0.0125], { color: 'white', parent: 'bottle', depth: 0.002 })
      .cyl([0.05, 0.016, 0.05], [-0.03, 0.078, -0.01], { color: 'white', name: 'cap', parent: 'bottle', piece: true, edge: 'sharp' })
      .cyl([0.012, 0.004, 0.012], [0.01, 0.002, 0.02], { color: 'white', edge: 'sharp' })
      .box([0.009, 0.001, 0.001], [0.01, 0.0042, 0.02], { color: '#d4d7da', noInk: true, round: 0 })
      .cyl([0.012, 0.004, 0.012], [0.025, 0.002, 0.005], { color: 'white', edge: 'sharp' })
      .capsule([0.007, 0.012, 0.007], [0.022, 0.0035, 0.03], { color: '#e0473b', rot: [0, 20, 90], name: 'capsule' })
      .capsule([0.007, 0.012, 0.007], [0.029, 0.006, 0.028], { color: 'white', rot: [0, 20, 60], name: 'half', parent: 'capsule', piece: true })
      .act({ click: [[A.detach('cap', 'cap'), A.say('Pop!', 1)], [A.detach('half', 'half'), A.reattach('cap'), A.say('Click.', 1)], [A.reattach('half')]] })
      .done(),
  ),
  // A weekly pill organiser: seven coloured compartments marked S M T W T F S, each with its own flip lid. The
  // lids flip open in a row and close again.
  e('pill box', 'clinic', 'medicine', () => {
    const b = m('pill box', { edge: 'sharp' }).box([0.21, 0.028, 0.045], [0, 0.014, 0], { color: 'white' });
    const cs = ['#e0473b', '#f0923b', '#f6d24a', '#9be34d', '#6fd3e8', '#4e8fd6', '#8a5fc4'];
    b.each(7, (i) => {
      const xx = -0.09 + i * 0.03;
      b.box([0.026, 0.006, 0.042], [xx, 0.031, 0], { color: cs[i], name: `lid${i + 1}`, pivot: [xx, 0.031, -0.021], mover: { kind: 'swing', axis: 'x', amount: -100 } });
      b.ball(0.01, [xx, 0.026, 0.004], { color: ['#f4a1c0', 'white', '#f6d24a'][i % 3], edge: 'soft' });
      b.label('SMTWTFS'[i], [0.018, 0.014], [xx, 0.014, 0.023], { color: 'white', depth: 0.002 });
    });
    return b.act({ click: [[A.operate('lid', 'open'), A.say('Clack-clack-clack!', 1.5), A.wait(1.5), A.operate('lid', 'close')]] }).done();
  }),
  // A classical column (3 m): a square plinth, a moulded base, a fluted, gently tapering shaft and an Ionic
  // capital with its scroll volutes. A pigeon lands on top.
  e('pillar', 'places', 'monuments', () => {
    const b = m('pillar', { edge: 'sharp' })
      .box([0.95, 0.2, 0.95], [0, 0.1, 0], { color: '#eeeae0', round: 0.05 })
      .torus([0.8, 0.8, 0.16], [0, 0.26, 0], { color: '#e4dfd2', rot: [90, 0, 0], tube: 0.3, edge: 'soft' })
      .cyl([0.62, 2.35, 0.62], [0, 1.47, 0], { color: '#f2eee4', taper: 0.92, segs: 16 })
      .cyl([0.75, 0.15, 0.75], [0, 2.72, 0], { color: '#e4dfd2', taper: 1.25 })
      .box([0.95, 0.15, 0.95], [0, 2.87, 0], { color: '#eeeae0', round: 0.05 });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.04, 2.2, 0.02], [Math.sin(a) * 0.3, 1.45, Math.cos(a) * 0.3], { color: '#d8d2c2', rot: [0, (a * 180) / Math.PI, 0], noInk: true });
    });
    b.pair((s) => b.torus([0.24, 0.24, 0.12], [s * 0.43, 2.74, 0.0], { color: '#eeeae0', tube: 0.45, rot: [0, 90, 0], edge: 'soft' }));
    return b
      .socket('top', [0, 2.95, 0], 'top', { size: 0.9 })
      .act({ click: [[A.spawn('bird', 'pigeon', { rel: 'above', of: 'self', dist: 'close' }), A.attach('bird', 'self', 'top'), A.say('Coo coo!', 1.5, 'bird'), A.wait(1.5), A.remove('bird', 'fly_away')]] })
      .done();
  }),
  // Fuzzy chenille pipe cleaners: a magenta one twisted into a spring and a lime one bent into a zigzag. Boing!
  e('pipe cleaner', 'study', 'art supplies', () => {
    const b = m('pipe cleaner').ball(0.015, [0, 0.01, 0], { color: '#d64fa0', name: 'spring', pivot: [0, 0, 0] });
    const pts: Vec3[] = [];
    for (let i = 0; i <= 16; i++) pts.push([Math.cos(i * 0.8) * 0.035, 0.01 + i * 0.011, Math.sin(i * 0.8) * 0.035]);
    for (let i = 0; i < 16; i++) b.rod(pts[i], pts[i + 1], 0.012, '#d64fa0', { parent: 'spring' });
    return b
      .rod([0.07, 0.005, 0.02], [0.1, 0.06, 0.02], 0.012, '#9be34d').rod([0.1, 0.06, 0.02], [0.08, 0.12, 0.02], 0.012, '#9be34d').rod([0.08, 0.12, 0.02], [0.11, 0.17, 0.02], 0.012, '#9be34d')
      .act({ click: [[A.par(A.pose('spring', { scale: 1.3, dur: 0.2 }), A.say('Boing!', 1)), A.pose('spring', { scale: 0.85, dur: 0.2 }), A.pose('spring', { scale: 1, dur: 0.2 })]] })
      .done();
  }),
  // A pirate captain's tricorn: three cocked-up sides edged in gold braid and a skull and crossbones in front.
  e('pirate hat', 'wardrobe', 'hats', () => {
    const b = m('pirate hat').ball([0.17, 0.13, 0.17], [0, 0.065, 0], { color: '#2a2726', name: 'hat' });
    for (const a of [-90, 30, 150]) {
      const r = (a * Math.PI) / 180;
      b.box([0.03, 0.1, 0.34], [Math.cos(r) * 0.1, 0.06, -Math.sin(r) * 0.1], { color: '#2a2726', rot: [0, a, -25], round: 0.4, parent: 'hat' });
      b.box([0.012, 0.012, 0.34], [Math.cos(r) * 0.125, 0.108, -Math.sin(r) * 0.125], { color: 'gold', rot: [0, a, 0], parent: 'hat', edge: 'sharp' });
    }
    return b
      .rod([-0.035, 0.03, 0.135], [0.035, 0.055, 0.135], 0.012, 'white', { parent: 'hat' })
      .rod([0.035, 0.03, 0.135], [-0.035, 0.055, 0.135], 0.012, 'white', { parent: 'hat' })
      .ball([0.04, 0.038, 0.02], [0, 0.07, 0.135], { color: 'white', parent: 'hat' })
      .ball(0.01, [-0.01, 0.073, 0.145], { color: '#2a2726', noInk: true, parent: 'hat' })
      .ball(0.01, [0.01, 0.073, 0.145], { color: '#2a2726', noInk: true, parent: 'hat' })
      .act({ click: [[A.par(A.anim('hop'), A.say('Arrr!', 1.2))]] })
      .done();
  }),
  // A pirate galleon, 30 m: a tarred wooden hull with a gold stripe and gun ports with cannons run out, a high
  // stern castle with gallery windows and lanterns, a forecastle and bowsprit, three masts of billowing square
  // sails, a crow's nest, the Jolly Roger, a ship's wheel and a rudder. The cannons fire; the captain appears.
  e('pirate ship', 'garage', 'ships', () => {
    const prof: Array<[number, number, number, number?]> = [[0, 0.8, 0.75, 0.1], [0.12, 0.96, 0.92, 0.04], [0.5, 1, 1, 0], [0.78, 0.88, 0.97, 0.02], [0.93, 0.5, 0.85, 0.07], [1, 0.12, 0.65, 0.1]];
    const b = m('pirate ship', { view: 'side', edge: 'sharp' })
      .loft([8, 12, 30], [0, 6, 0], prof, { color: '#5a3a22', cut: 'bottom', boxy: 0.45, name: 'hull', edge: 'soft' })
      .loft([7.8, 0.3, 29.6], [0, 6.05, 0], prof.map(([t, w, , c]) => [t, w, 1, ((c ?? 0) * 12) / 0.3] as [number, number, number, number]), { color: '#a0703f', boxy: 0.9, parent: 'hull' })
      .loft([8.1, 0.35, 28.5], [0, 4.6, -0.4], prof.map(([t, w, , c]) => [t, Math.min(1, w * 1.01), 1, ((c ?? 0) * 12) / 0.35] as [number, number, number, number]), { color: '#e2b23a', boxy: 0.5, parent: 'hull', noInk: true, edge: 'soft' });
    // bulwarks along the waist
    b.pair((s) => b.box([0.3, 1.2, 16], [s * 3.75, 6.6, 0.5], { color: '#4a2e1a', parent: 'hull' }));
    // gun ports and the cannons run out of them
    let n = 0;
    for (const s of [1, -1])
      for (let i = 0; i < 5; i++) {
        const z = -6 + i * 3.2;
        b.box([0.12, 0.8, 0.8], [s * 3.95, 4.9, z], { color: '#1e1b1f', parent: 'hull' });
        if (i % 2 === 0) b.cyl([0.36, 1.4, 0.36], [s * 4.3, 4.9, z], { color: '#2a2726', rot: [0, 0, 90], name: `cannon${++n}` });
      }
    // stern castle with gallery windows and lanterns; forecastle
    b.box([7.2, 3.4, 7], [0, 7.9, -11], { color: '#5a3a22', parent: 'hull' })
      .box([7.6, 0.3, 7.4], [0, 9.7, -11], { color: '#a0703f', parent: 'hull' })
      .box([7.0, 1.6, 0.3], [0, 8.1, -14.55], { color: '#e2b23a', parent: 'hull' });
    b.each(5, (i) => b.box([0.9, 1.0, 0.1], [-2.6 + i * 1.3, 8.1, -14.72], { color: '#f6d77a', parent: 'hull', round: 0.1 }));
    b.pair((s) => b.box([0.4, 0.7, 0.4], [s * 3.4, 10.3, -14.3], { color: '#f6b830', name: s > 0 ? 'lanternL' : 'lanternR', mover: { kind: 'light', on: true }, round: 0.2 }));
    b.box([5.2, 2.0, 5], [0, 7.6, 10], { color: '#5a3a22', parent: 'hull' }).box([5.6, 0.3, 5.4], [0, 8.7, 10], { color: '#a0703f', parent: 'hull' });
    // the wheel and rudder
    b.torus([1.2, 1.2, 0.12], [0, 10.6, -9.5], { color: '#7a5230', tube: 0.15, name: 'helm', edge: 'soft' })
      .stick([0, 9.85, -9.7], [0, 10.6, -9.7], 0.2, '#5a3a22')
      .box([0.3, 5, 1.4], [0, 3.6, -15.2], { color: '#4a2e1a', parent: 'hull' });
    // bowsprit, jib, figurehead
    b.rod([0, 7.6, 12], [0, 10.6, 19], 0.4, '#7a5230')
      .wedge([5, 6, 0.1], [0, 11.0, 15.5], { color: '#efe6cf', rot: [0, 90, 0], apex: 0.45, edge: 'sharp' })
      .ball([0.8, 1.6, 1.0], [0, 7.0, 15.3], { color: '#e2b23a', edge: 'soft' });
    // masts, yards, sails, crow's nest, flag
    // square sails hang from their yards and belly forward in the wind: thin lofts stood upright, narrower at the top
    const SAIL: Array<[number, number, number, number]> = [[0, 1, 0.48, 1.8], [0.25, 0.97, 0.48, -0.6], [0.5, 0.94, 0.48, -1.8], [0.75, 0.9, 0.48, -0.6], [1, 0.86, 0.48, 1.8]];
    const mast = (z: number, top: number, sails: Array<[number, number, number]>) => {
      b.stick([0, 6, z], [0, top, z], 0.65, '#7a5230');
      for (const [y, w, h] of sails) {
        b.stick([w / 2 + 0.3, y + h / 2, z + 0.4], [-w / 2 - 0.3, y + h / 2, z + 0.4], 0.3, '#7a5230');
        b.loft([w, 0.3, h], [0, y, z + 0.95], SAIL, { color: '#efe6cf', rot: [-90, 0, 0], boxy: 0.85, edge: 'soft' });
      }
    };
    mast(-8, 21, [[14, 8, 4.4], [18.5, 6.4, 3.4]]);
    mast(1, 28, [[13, 12, 5.6], [19, 10, 4.6], [24.5, 7, 3.2]]);
    mast(9, 24, [[12.5, 10, 4.8], [17.6, 8, 3.8]]);
    b.cyl([2.0, 1.0, 2.0], [0, 22.2, 1], { color: '#5a3a22' })
      .box([3.2, 2.2, 0.08], [1.7, 27, 1], { color: '#1e1b1f', name: 'flag', pivot: [0.1, 27, 1] })
      .ball([0.8, 0.8, 0.1], [1.7, 27.3, 1.06], { color: 'white', parent: 'flag' })
      .rod([1.1, 26.3, 1.06], [2.3, 26.9, 1.06], 0.15, 'white', { parent: 'flag' })
      .rod([2.3, 26.3, 1.06], [1.1, 26.9, 1.06], 0.15, 'white', { parent: 'flag' });
    return b
      .socket('deck', [0, 6.2, 3.5], 'top', { size: 3 })
      .socket('helm', [0, 9.45, -8.5], 'seat')
      .act({
        click: [
          [A.par(A.pose('cannon1', { move: [-0.8, 0, 0], dur: 0.1 }), A.pose('cannon2', { move: [-0.8, 0, 0], dur: 0.1 }), A.pose('cannon3', { move: [-0.8, 0, 0], dur: 0.1 }), A.effect('explosion', { dur: 0.6 }), A.say('BOOM! BOOM! BOOM!', 2)), A.effect('smoke', { dur: 2.5 }), A.par(A.pose('cannon1', { move: [0, 0, 0], dur: 1 }), A.pose('cannon2', { move: [0, 0, 0], dur: 1 }), A.pose('cannon3', { move: [0, 0, 0], dur: 1 }))],
          [A.spawn('cap', 'pirate', { rel: 'on', of: 'self', dist: 'touch' }), A.attach('cap', 'self', 'deck'), A.par(A.anim('wave', 1, 'cap'), A.say('Ahoy, matey!', 2, 'cap'), A.pose('helm', { rot: [0, 0, 360], dur: 1.5 }), A.pose('flag', { rot: [0, 25, 0], dur: 0.8 })), A.pose('flag', { rot: [0, 0, 0], dur: 0.8 }), A.remove('cap', 'fade'), A.pose('helm', { rot: [0, 0, 0], dur: 0 })],
        ],
      })
      .done();
  }),
  // Pistachios in a little dish: beige shells split open to show the green nut. One cracks open wider.
  e('pistachio', 'food', 'nuts', () => {
    const b = m('pistachio').cyl([0.09, 0.025, 0.09], [0, 0.0125, 0], { color: '#f7f5ef', taper: 1.3, edge: 'sharp' });
    for (const [xx, z, r] of [[-0.02, 0.01, 20], [0.018, 0.012, -40], [0.0, -0.02, 70], [0.025, -0.012, 10]]) b.ball([0.022, 0.014, 0.016], [xx, 0.032, z], { color: '#e8d8b8', rot: [0, r, 0] }).ball([0.012, 0.008, 0.01], [xx, 0.04, z], { color: '#8ab84a', rot: [0, r, 0], noInk: true });
    return b
      .ball([0.022, 0.014, 0.016], [0.0, 0.045, 0.0], { color: '#e8d8b8', name: 'nut' })
      .ball([0.013, 0.009, 0.011], [0.0, 0.052, 0.0], { color: '#8ab84a', parent: 'nut', noInk: true })
      .ball([0.02, 0.006, 0.014], [0.0, 0.055, -0.003], { color: '#e0d0b0', rot: [-30, 0, 0], name: 'shell', parent: 'nut', piece: true })
      .act({ click: [[A.detach('shell', 'shell'), A.say('Crack!', 1)], [A.reattach('shell')]] })
      .done();
  }),
  // A freshly dug pit in a patch of lawn: a dark hole 1.6 m across with a lip of turned earth, a mound of dirt
  // and a spade stuck in it. The spade digs; a stone dropped in lands with a faint thud.
  e('pit (hole)', 'nature', 'landforms', () =>
    m('pit (hole)')
      .cyl([3.4, 0.2, 3.4], [0, 0.1, 0], { color: 'grass' })
      .cyl([2.0, 0.04, 1.8], [-0.2, 0.2, 0.2], { color: 'dirt' })
      .cyl([1.6, 0.05, 1.4], [-0.2, 0.21, 0.2], { color: '#2a1d16' })
      .cyl([1.2, 0.06, 1.0], [-0.2, 0.215, 0.2], { color: '#160f0b', noInk: true })
      .ball([1.3, 0.75, 1.0], [1.0, 0.3, -0.8], { color: 'dirt' })
      .ball([0.6, 0.4, 0.5], [1.4, 0.3, -0.3], { color: '#7a5a3a' })
      .stick([0.95, 0.5, -0.8], [0.8, 1.45, -0.7], 0.04, 'wood', { name: 'spade', pivot: [0.95, 0.5, -0.8] })
      .box([0.2, 0.28, 0.02], [0.97, 0.45, -0.81], { color: 'steel', rot: [0, 0, -9], parent: 'spade', edge: 'sharp' })
      .box([0.16, 0.04, 0.04], [0.79, 1.48, -0.7], { color: 'darkwood', parent: 'spade', edge: 'sharp' })
      .act({
        click: [
          [A.pose('spade', { rot: [0, 0, 25], dur: 0.3 }), A.par(A.pose('spade', { rot: [0, 0, -10], dur: 0.3 }), A.effect('dust', { dur: 1 }), A.say('Scoop!', 1)), A.pose('spade', { rot: [0, 0, 0], dur: 0.3 })],
          [A.spawn('stone', 'rock', { rel: 'above', of: 'self', dist: 'close' }), A.drop('stone'), A.wait(1), A.say('...thud.', 1.2), A.remove('stone', 'fade')],
        ],
      })
      .done(),
  ),
  // A hay fork (1.7 m) stuck in a bale of hay: a long ash handle and three curved steel tines. It pitches hay.
  e('pitchfork', 'farm', 'farm tools', () => {
    const b = m('pitchfork')
      .box([1.1, 0.45, 0.6], [0.05, 0.225, 0], { color: '#e8c96a', round: 0.15, edge: 'sharp' })
      .box([1.12, 0.05, 0.62], [0.05, 0.15, 0], { color: '#c89a3a', round: 0.2, noInk: true, edge: 'sharp' })
      .box([1.12, 0.05, 0.62], [0.05, 0.32, 0], { color: '#c89a3a', round: 0.2, noInk: true, edge: 'sharp' })
      .stick([0, 0.35, 0], [0.1, 1.72, 0], 0.04, 'lightwood', { name: 'fork', pivot: [0, 0.35, 0] })
      .box([0.2, 0.04, 0.03], [-0.005, 0.38, 0], { color: 'steel', parent: 'fork', edge: 'sharp' });
    b.each(3, (i) => b.rod([-0.08 + i * 0.08, 0.38, 0], [-0.09 + i * 0.09, 0.2, 0.04], 0.012, 'steel', { parent: 'fork' }));
    b.each(6, (i) => b.rod([-0.4 + i * 0.16, 0.45, 0.2 - (i % 3) * 0.15], [-0.45 + i * 0.16, 0.55, 0.25 - (i % 2) * 0.2], 0.012, '#e8d080'));
    return b.act({ click: [[A.pose('fork', { rot: [30, 0, 0], dur: 0.4 }), A.par(A.pose('fork', { rot: [-20, 0, 0], dur: 0.3 }), A.effect('dust', { dur: 0.8 }), A.say('Swoosh!', 1)), A.pose('fork', { rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A corked glass vial of glittering pixie dust, its sparkles drifting up above it. The cork pops: twinkle!
  e('pixie dust', 'fantasy', 'magic items', () => {
    const b = m('pixie dust')
      .ball([0.06, 0.06, 0.06], [0, 0.03, 0], { color: '#f6e08a', name: 'vial' })
      .cyl([0.03, 0.05, 0.03], [0, 0.08, 0], { color: '#f6e08a', parent: 'vial' })
      .cyl([0.034, 0.025, 0.034], [0, 0.115, 0], { color: 'wood', taper: 1.2, name: 'cork', parent: 'vial', piece: true })
      .rod([0.0, 0.1, 0.0], [0.03, 0.06, 0.03], 0.003, '#e0473b', { parent: 'vial' })
      .ball([0.02, 0.02, 0.006], [-0.01, 0.04, 0.028], { color: 'white', noInk: true, parent: 'vial' });
    for (const [xx, y, s, c] of [[0.02, 0.2, 0.03, '#f6d24a'], [-0.03, 0.27, 0.025, '#f4a1c0'], [0.03, 0.34, 0.035, '#f6d24a'], [-0.01, 0.43, 0.022, '#a8d8f5'], [0.02, 0.5, 0.03, '#f6d24a']] as Array<[number, number, number, string]>) b.star(s, [xx, y, 0], { color: c, glow: true });
    return b.act({ click: [[A.detach('cork', 'cork'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Twinkle twinkle!', 1.5))], [A.reattach('cork')]] }).done();
  }),
  // A pepperoni pizza (30 cm): a puffed golden crust, tomato, melted cheese, pepperoni and basil, one slice cut.
  // The slice pulls away.
  e('pizza', 'food', 'fast food', () => {
    const b = m('pizza')
      .cyl([0.3, 0.02, 0.3], [0, 0.01, 0], { color: 'crust', name: 'base' })
      .torus([0.3, 0.3, 0.025], [0, 0.02, 0], { color: '#c8843a', rot: [90, 0, 0], tube: 0.1, parent: 'base' })
      .cyl([0.27, 0.008, 0.27], [0, 0.022, 0], { color: '#c0392b', parent: 'base' })
      .cyl([0.26, 0.01, 0.26], [0, 0.026, 0], { color: '#f6c445', parent: 'base' });
    const pep: Array<[number, number]> = [[0.06, -0.04], [-0.07, -0.03], [-0.02, -0.09], [0.08, 0.06], [-0.08, 0.06], [0.0, 0.0], [0.04, -0.1]];
    for (const [xx, z] of pep) b.cyl([0.04, 0.006, 0.04], [xx, 0.033, z], { color: '#c8423a', parent: 'base' });
    b.ball([0.03, 0.005, 0.018], [-0.04, 0.034, -0.06], { color: '#3f7a3a', rot: [0, 30, 0], parent: 'base' });
    return b
      .wedge([0.08, 0.13, 0.03], [0, 0.02, 0.07], { color: '#f6c445', rot: [-90, 0, 0], name: 'slice', parent: 'base', piece: true })
      .box([0.085, 0.022, 0.02], [0, 0.02, 0.135], { color: '#c8843a', parent: 'slice', round: 0.5 })
      .cyl([0.035, 0.006, 0.035], [0.0, 0.037, 0.09], { color: '#c8423a', parent: 'slice' })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Stre-e-etch!', 1.5)], [A.reattach('slice')]] })
      .done();
  }),
  // A cardboard pizza box (36 cm) with its lid open and a hot pizza inside. The lid shuts; it opens again in a
  // puff of steam.
  e('pizza box', 'food', 'fast food', () =>
    m('pizza box', { edge: 'sharp' })
      .box([0.36, 0.04, 0.36], [0, 0.02, 0], { color: '#d8b07a', round: 0.05 })
      .box([0.36, 0.006, 0.36], [0, 0.2, -0.18], { color: '#d8b07a', rot: [-90, 0, 0], round: 0.05, name: 'lid', pivot: [0, 0.04, -0.18], mover: { kind: 'swing', axis: 'x', amount: 90 } })
      .label('PIZZA', [0.18, 0.07], [0, 0.22, -0.177], { color: '#e0473b', parent: 'lid', depth: 0.003 })
      .cyl([0.3, 0.015, 0.3], [0, 0.045, 0], { color: 'crust', edge: 'soft' })
      .cyl([0.27, 0.01, 0.27], [0, 0.053, 0], { color: '#f6c445', edge: 'soft' })
      .cyl([0.045, 0.008, 0.045], [0.05, 0.06, 0.04], { color: '#c8423a', edge: 'soft' })
      .cyl([0.045, 0.008, 0.045], [-0.06, 0.06, -0.02], { color: '#c8423a', edge: 'soft' })
      .cyl([0.045, 0.008, 0.045], [0.02, 0.06, -0.07], { color: '#c8423a', edge: 'soft' })
      .act({ click: [[A.operate('lid', 'on'), A.say('Flap!', 1)], [A.operate('lid', 'off'), A.par(A.effect('steam', { dur: 1.5 }), A.say('Fwoosh!', 1.5))]] })
      .done(),
  ),
  // A pizza wheel: a steel blade on a guard and a red grip, rolling across a slice on a board. Zzzip!
  e('pizza cutter', 'kitchen', 'utensils', () =>
    m('pizza cutter')
      .box([0.24, 0.015, 0.16], [0.04, 0.0075, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .cyl([0.09, 0.006, 0.09], [0, 0.06, 0], { color: 'silver', rot: [90, 0, 0], name: 'wheel', mover: { kind: 'spin', axis: 'z', amount: 720 }, edge: 'sharp' })
      .cyl([0.02, 0.016, 0.02], [0, 0.06, 0], { color: '#5c6166', rot: [90, 0, 0], parent: 'wheel' })
      .arc([0.07, 0.07, 0.012], [0, 0.06, 0], { color: '#9da3a8', tube: 0.18, rot: [0, 0, -40] })
      .rod([0.02, 0.08, 0], [0.09, 0.16, 0], 0.012, '#9da3a8')
      .capsule([0.032, 0.12, 0.032], [0.13, 0.21, 0], { color: '#e0473b', rot: [0, 0, -42] })
      .act({ click: [[A.par(A.operate('wheel', 'on'), A.say('Zzzip!', 1)), A.wait(1), A.operate('wheel', 'off')]] })
      .done(),
  ),
  // A wood-fired pizza oven (2 m): a brick dome on a stone stand, an arched mouth glowing with fire, a chimney,
  // a stack of logs and a peel. The fire roars up and a pizza comes out.
  e('pizza oven', 'kitchen', 'appliances', () => {
    const b = m('pizza oven', { edge: 'sharp' })
      .box([1.7, 0.9, 1.6], [0, 0.45, 0], { color: '#a7a39b', round: 0.03 })
      .box([1.8, 0.12, 1.7], [0, 0.96, 0], { color: '#8f8a82', round: 0.1 })
      .dome([1.6, 0.95, 1.5], [0, 1.02 + 0.475, -0.05], { color: '#b8573a', edge: 'soft' })
      .box([0.75, 0.6, 0.3], [0, 1.32, 0.7], { color: '#a0472e', round: 0.1 })
      .arc([0.6, 0.7, 0.32], [0, 1.02, 0.72], { color: '#8a3a26', tube: 0.18 })
      .box([0.5, 0.36, 0.05], [0, 1.2, 0.86], { color: '#ff8a2a', name: 'fire', mover: { kind: 'light' }, round: 0.3 })
      .stick([0, 1.6, 0.6], [0, 2.3, 0.6], 0.18, '#5c6166')
      .cyl([0.28, 0.06, 0.28], [0, 2.32, 0.6], { color: '#3a3633' });
    b.each(4, (i) => b.cyl([0.12, 0.6, 0.12], [-0.5 + (i % 2) * 0.14, 0.12 + Math.floor(i / 2) * 0.12, 0.85], { color: '#7a5230', rot: [90, 0, 0], edge: 'soft' }));
    return b
      .stick([0.95, 0.0, 0.7], [0.95, 1.35, 0.85], 0.04, 'lightwood')
      .box([0.32, 0.3, 0.012], [0.95, 1.45, 0.86], { color: 'lightwood', round: 0.3, rot: [-6, 0, 0] })
      .socket('hearth', [0, 1.1, 0.4], 'inside', { size: 0.4 })
      .act({
        click: [
          [A.par(A.operate('fire', 'on'), A.effect('fire', { dur: 2 }), A.say('Crackle crackle...', 2)), A.effect('smoke', { dur: 1.5 }), A.spawn('pie', 'pizza', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.effect('steam', { id: 'pie', dur: 1.5 }), A.say('Ding!', 1.5)), A.wait(1.5), A.remove('pie', 'fade')],
          [A.operate('fire', 'off'), A.effect('smoke', { dur: 1.2 })],
        ],
      })
      .done();
  }),
  // A donkey piñata (60 cm) covered in frills of coloured crêpe paper, hanging from its string. Whack it, and on
  // the second hit it bursts into candy and confetti.
  e('piñata', 'toys', 'party', () => {
    const b = m('piñata').box([0.42, 0.22, 0.2], [0, 0.3, 0], { color: '#f6d24a', round: 0.4, name: 'body', pivot: [0, 0.62, 0] });
    b.each(4, (i) => b.box([0.44, 0.045, 0.22], [0, 0.22 + i * 0.05, 0], { color: ['#e0473b', '#4e8fd6', '#5aa553', '#d64fa0'][i], round: 0.3, parent: 'body', noInk: true }));
    b.box([0.12, 0.26, 0.12], [0.2, 0.46, 0], { color: '#f6d24a', rot: [0, 0, -20], parent: 'body', round: 0.4 })
      .box([0.18, 0.11, 0.12], [0.28, 0.58, 0], { color: '#e0473b', parent: 'body', round: 0.4 })
      .ball(0.022, [0.33, 0.6, 0.055], { color: '#1d1a17', eye: true, parent: 'body' })
      .cone([0.05, 0.12, 0.03], [0.22, 0.69, 0.03], { color: '#f6d24a', parent: 'body' })
      .cone([0.05, 0.12, 0.03], [0.22, 0.69, -0.03], { color: '#f6d24a', parent: 'body' });
    for (const [xx, z] of [[0.15, 0.06], [0.15, -0.06], [-0.15, 0.06], [-0.15, -0.06]]) b.box([0.06, 0.2, 0.06], [xx, 0.1, z], { color: '#4e8fd6', parent: 'body', round: 0.3 });
    b.rod([-0.21, 0.32, 0], [-0.28, 0.2, 0], 0.03, '#d64fa0', { parent: 'body' });
    b.stick([0, 0.41, 0], [0, 0.66, 0], 0.006, 'white', { parent: 'body' });
    return b.act({
      click: [
        [A.par(A.pose('body', { rot: [0, 0, 25], dur: 0.2 }), A.say('Whack!', 1)), A.pose('body', { rot: [0, 0, -18], dur: 0.3 }), A.pose('body', { rot: [0, 0, 0], dur: 0.3 })],
        [A.par(A.anim('shake'), A.effect('explosion', { dur: 0.4 }), A.say('POP!', 1.2)), A.spawn('candy', 'candy', { rel: 'front', of: 'self', dist: 'close' }), A.spawn('bits', 'confetti', { rel: 'near', of: 'self', dist: 'close' }), A.wait(2), A.remove('candy', 'fade'), A.remove('bits', 'fade')],
      ],
    }).done();
  }),
  // A woven placemat set for dinner: a plate, a knife and fork, a napkin and a glass of water. Dinner arrives.
  e('placemat', 'kitchen', 'tableware', () => {
    const b = m('placemat', { edge: 'sharp' }).box([0.45, 0.006, 0.32], [0, 0.003, 0], { color: '#c8a06a', round: 0.3 });
    b.each(6, (i) => b.box([0.45, 0.002, 0.012], [0, 0.007, -0.13 + i * 0.052], { color: '#b08850', noInk: true, round: 0 }));
    plate(b, 0.24, 0.007);
    return b
      .box([0.012, 0.004, 0.2], [-0.15, 0.009, 0], { color: 'silver', round: 0.5 })
      .box([0.02, 0.004, 0.2], [0.15, 0.009, 0], { color: 'silver', round: 0.5 })
      .box([0.09, 0.006, 0.12], [-0.19, 0.009, 0.02], { color: '#e0473b', round: 0.3, edge: 'soft' })
      .cyl([0.06, 0.1, 0.06], [0.17, 0.057, -0.12], { color: 'glass', taper: 1.1 })
      .cyl([0.056, 0.06, 0.056], [0.17, 0.04, -0.12], { color: '#8fc6e6', noInk: true })
      .socket('plate', [0, 0.03, 0], 'top', { size: 0.2 })
      .act({ click: [[A.spawn('dinner', 'pasta', { rel: 'on', of: 'self', dist: 'touch' }), A.attach('dinner', 'self', 'plate'), A.say('Ding!', 1.5)], [A.remove('self.plate', 'fade'), A.say('Clink.', 1)]] })
      .done();
  }),
  // A planet model for the planetarium (3.3 m): a banded gas giant tilted on its axis with a broad ring and a
  // little moon, on a stand. It spins.
  e('planet', 'sky', 'planets', () =>
    m('planet')
      .cyl([1.2, 0.15, 1.2], [0, 0.075, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.15, 0], [0, 0.9, 0], 0.12, '#9da3a8')
      .ball(2.4, [0, 2.1, 0], { color: '#e0b070', name: 'globe', rot: [0, 0, 20], mover: { kind: 'spin', axis: 'y', amount: 60 } })
      .ball([2.42, 0.3, 2.42], [0, 2.45, 0], { color: '#c8884a', parent: 'globe', noInk: true, rot: [0, 0, 20] })
      .ball([2.42, 0.25, 2.42], [0, 1.75, 0], { color: '#f0d0a0', parent: 'globe', noInk: true, rot: [0, 0, 20] })
      .ball([0.5, 0.3, 0.1], [0.4, 1.9, 1.15], { color: '#b8603a', parent: 'globe', noInk: true })
      .torus([4.2, 4.2, 0.08], [0, 2.1, 0], { color: '#d9c49a', rot: [80, 0, 20], tube: 0.18, parent: 'globe' })
      .ball(0.4, [2.4, 2.9, 0.4], { color: '#c9ccd1' })
      .act({ click: [[A.par(A.operate('globe', 'on'), A.effect('sparkle', { dur: 1.5 }), A.say('Whirl...', 1.5)), A.wait(3), A.operate('globe', 'off')]] })
      .done(),
  ),
  // A young leafy plant growing in a patch of earth (60 cm): broad veined leaves on soft stems. Water it and it
  // stretches up.
  e('plant', 'garden', 'plants', () => {
    const b = m('plant').ball([0.5, 0.08, 0.5], [0, 0.02, 0], { color: 'dirt' }).ball([0.06, 0.1, 0.06], [0, 0.08, 0], { color: '#4f8f45', name: 'top', pivot: [0, 0.03, 0] });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, r = 0.12 + (i % 2) * 0.04, h = 0.3 + (i % 3) * 0.1;
      b.rod([0, 0.05, 0], [Math.cos(a) * r, h, Math.sin(a) * r], 0.012, '#5aa553', { parent: 'top' });
      spoke(b, [Math.cos(a) * r, h, Math.sin(a) * r], -deg(a), 15, 0.2, 0.012, 0.11, i % 2 ? '#5aa553' : '#3f7a3a', { parent: 'top' });
    }
    return b.ball([0.12, 0.2, 0.08], [0, 0.55, 0], { color: '#6ab04c', parent: 'top' }).act({ click: [[A.par(A.pose('top', { scale: 1.2, dur: 0.8 }), A.effect('sparkle', { dur: 1 }), A.say('Rustle!', 1.5)), A.wait(1), A.pose('top', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // Plastic things: a squeezy bottle, a bucket, toy bricks and a tub. Squeezed, it squeaks and bounces.
  e('plastic', 'workshop', 'materials', () => {
    const b = m('plastic', { edge: 'sharp' })
      .cyl([0.07, 0.17, 0.07], [-0.08, 0.085, 0.02], { color: '#4e8fd6', name: 'bottle', edge: 'soft' })
      .cyl([0.03, 0.03, 0.03], [-0.08, 0.185, 0.02], { color: '#e0473b', parent: 'bottle' })
      .box([0.08, 0.04, 0.05], [0.07, 0.02, 0.06], { color: '#e0473b', round: 0.15 })
      .box([0.08, 0.04, 0.05], [0.08, 0.06, 0.06], { color: '#f6d24a', round: 0.15 });
    b.each(4, (i) => b.cyl([0.018, 0.012, 0.018], [0.05 + (i % 2) * 0.04, 0.086, 0.05 + Math.floor(i / 2) * 0.025], { color: '#f6d24a' }));
    return b.cyl([0.09, 0.08, 0.09], [0.06, 0.04, -0.08], { color: '#5aa553', taper: 1.25 }).arc([0.09, 0.06, 0.006], [0.06, 0.08, -0.08], { color: '#3f7a3a', tube: 0.1 })
      .act({ click: [[A.par(A.pose('bottle', { scale: 0.8, dur: 0.15 }), A.say('Squeak!', 1)), A.pose('bottle', { scale: 1, dur: 0.2 }), A.anim('bounce')]] })
      .done();
  }),
  // A white china dinner plate lying flat, ready for food: 27 cm across and 2.5 cm high, a foot ring under a
  // shallow body, a flat well and a raised rim with a blue band; food goes on its top. Clicked, it rattles.
  e('plate', 'kitchen', 'tableware', () =>
    m('plate', { edge: 'sharp' })
      .cyl([0.2, 0.013, 0.2], [0, 0.0145, 0], { color: 'white', taper: 1.3, name: 'plate', pivot: [0, 0, 0] })
      .cyl([0.16, 0.008, 0.16], [0, 0.004, 0], { color: '#e6e4de', parent: 'plate' })
      .torus([0.27, 0.27, 0.012], [0, 0.02, 0], { color: 'white', rot: [90, 0, 0], tube: 0.09, parent: 'plate' })
      .torus([0.236, 0.236, 0.003], [0, 0.0215, 0], { color: '#4e8fd6', rot: [90, 0, 0], tube: 0.035, parent: 'plate', noInk: true })
      .cyl([0.18, 0.002, 0.18], [0, 0.0215, 0], { color: '#f7f6f1', parent: 'plate', noInk: true })
      .socket('top', [0, 0.023, 0], 'top', { size: 0.2, part: 'plate' })
      .act({ click: [[A.par(A.pose('plate', { rot: [5, 0, 0], dur: 0.1, times: 2 }), A.say('Clink!', 1)), A.pose('plate', { rot: [0, 0, 5], dur: 0.1, times: 2 })]] })
      .done(),
  ),
  // A stage platform (6 x 4 m, 1 m high): a plank deck, a skirt, side steps, a microphone stand and two
  // spotlights on poles. The spotlights come on and a singer takes a bow.
  e('platform', 'places', 'stages', () => {
    const b = m('platform', { edge: 'sharp' })
      .box([6, 0.12, 4], [0, 0.94, 0], { color: '#a0703f', round: 0.03 })
      .box([6, 0.88, 0.06], [0, 0.44, 2.0], { color: '#8a2b3a', round: 0.1 })
      .box([0.06, 0.88, 4], [3.0, 0.44, 0], { color: '#8a2b3a', round: 0.1 })
      .box([0.06, 0.88, 4], [-3.0, 0.44, 0], { color: '#8a2b3a', round: 0.1 });
    b.each(8, (i) => b.box([6, 0.004, 0.02], [0, 1.0, -1.75 + i * 0.5], { color: '#7a5230', noInk: true, round: 0 }));
    b.each(3, (i) => b.box([1.0, 0.3 * (i + 1), 0.3], [2.2, 0.15 * (i + 1), 2.95 - i * 0.3], { color: '#7a5230' }));
    b.stick([0.4, 1.0, 0.8], [0.4, 2.45, 0.8], 0.03, '#2a2726').ball([0.08, 0.12, 0.08], [0.4, 2.5, 0.82], { color: '#5c6166' }).cyl([0.35, 0.03, 0.35], [0.4, 1.02, 0.8], { color: '#2a2726' });
    for (const s of [1, -1]) {
      b.stick([s * 3.3, 0, 2.6], [s * 3.3, 3.6, 2.6], 0.08, '#2a2726');
      b.cyl([0.4, 0.5, 0.4], [s * 3.1, 3.6, 2.4], { color: '#2a2726', rot: [50, 0, s * -30] });
      b.cyl([0.34, 0.04, 0.34], [s * 2.98, 3.45, 2.2], { color: '#fff6c8', rot: [50, 0, s * -30], name: s > 0 ? 'spotL' : 'spotR', mover: { kind: 'light' } });
    }
    return b
      .socket('stage', [0, 1.0, 0.2], 'top', { size: 3 })
      .act({ click: [[A.operate('spot', 'on'), A.spawn('star', 'singer', { rel: 'on', of: 'self', dist: 'touch' }), A.attach('star', 'self', 'stage'), A.par(A.anim('bow', 1, 'star'), A.say('Thank you, thank you!', 2.2, 'star')), A.wait(1), A.remove('star', 'fade'), A.operate('spot', 'off')]] })
      .done();
  }),
  // A bar of platinum stamped Pt and 999.5, beside a nugget of the raw metal. It gleams.
  e('platinum', 'nature', 'metals', () =>
    m('platinum', { edge: 'sharp' })
      .cyl([0.12 * Math.SQRT2, 0.04, 0.05 * Math.SQRT2], [0, 0.02, 0], { color: '#d8dce4', segs: 4, taper: 0.8, name: 'bar' }) // 12 x 5 cm, square to its stamp
      .label('Pt 999.5', [0.07, 0.02], [0, 0.041, 0.0], { color: '#e8ecf2', rot: [-90, 0, 0], parent: 'bar', depth: 0.002 })
      .ball([0.04, 0.025, 0.035], [0.1, 0.0125, 0.05], { color: '#c9ccd1', edge: 'soft' })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Ting!', 1))]] })
      .done(),
  ),
  // An oval serving platter (45 cm) under a silver cloche. The cloche lifts on a roast with roast potatoes and
  // herbs, steaming.
  e('platter', 'kitchen', 'tableware', () =>
    m('platter')
      .cyl([0.45, 0.025, 0.3], [0, 0.0125, 0], { color: 'white', edge: 'sharp' })
      .torus([0.46, 0.31, 0.02], [0, 0.026, 0], { color: '#e2b23a', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .ball([0.2, 0.1, 0.14], [0, 0.07, 0], { color: '#b8703a' })
      .ball([0.08, 0.05, 0.05], [0.1, 0.06, 0.05], { color: '#b8703a' })
      .ball(0.04, [0.14, 0.045, -0.06], { color: '#e0b060' })
      .ball(0.04, [-0.14, 0.045, -0.06], { color: '#e0b060' })
      .ball(0.04, [-0.15, 0.045, 0.05], { color: '#e0b060' })
      .ball([0.05, 0.015, 0.03], [-0.05, 0.03, 0.11], { color: '#3f7a3a' })
      .dome([0.36, 0.2, 0.26], [0, 0.125, 0], { color: 'silver', name: 'cloche', mover: { kind: 'slide', axis: 'y', amount: 0.35 }, edge: 'sharp' })
      .ball(0.04, [0, 0.23, 0], { color: 'silver', parent: 'cloche', edge: 'sharp' })
      .act({ click: [[A.operate('cloche', 'up'), A.par(A.effect('steam', { dur: 2 }), A.say('Ta-da!', 1.5)), A.wait(2), A.operate('cloche', 'down')]] })
      .done(),
  ),
  // A playground (16 x 12 m) on safety matting: a slide with a ladder, a swing set with two swings, a seesaw, a
  // climbing frame and a sandpit. The swings swing and the seesaw tips.
  e('playground', 'places', 'parks', () => {
    const b = m('playground', { edge: 'sharp' }).box([16, 0.1, 12], [0, 0.05, 0], { color: '#c8693e', round: 0.02 });
    // slide: platform tower, ladder, chute
    for (const [xx, z] of [[-5.5, -3], [-4.3, -3], [-5.5, -1.8], [-4.3, -1.8]]) b.stick([xx, 0.1, z], [xx, 2.6, z], 0.12, '#e0473b');
    b.box([1.4, 0.1, 1.4], [-4.9, 1.6, -2.4], { color: '#4e8fd6' })
      .pyramid([1.7 * Math.SQRT2, 0.8, 1.7 * Math.SQRT2], [-4.9, 3.0, -2.4], 4, { color: '#f6d24a' })
      .box([1.0, 0.12, 3.6], [-4.9, 0.95, 0.3], { color: '#f6d24a', rot: [24, 0, 0], round: 0.3 })
      .box([0.08, 0.3, 3.6], [-4.4, 1.1, 0.3], { color: '#f6d24a', rot: [24, 0, 0] })
      .box([0.08, 0.3, 3.6], [-5.4, 1.1, 0.3], { color: '#f6d24a', rot: [24, 0, 0] });
    b.rod([-5.4, 0.1, -3.8], [-5.4, 1.65, -3.2], 0.06, '#5c6166').rod([-4.4, 0.1, -3.8], [-4.4, 1.65, -3.2], 0.06, '#5c6166');
    b.each(5, (i) => b.stick([-5.4, 0.35 + i * 0.3, -3.68 + i * 0.12], [-4.4, 0.35 + i * 0.3, -3.68 + i * 0.12], 0.04, '#5c6166'));
    // swing set: A-frames, top bar, two swings
    for (const xx of [0.0, 4.0]) b.rod([xx, 0.1, -3.6], [xx, 2.5, -2.8], 0.1, '#5aa553').rod([xx, 0.1, -2.0], [xx, 2.5, -2.8], 0.1, '#5aa553');
    b.stick([-0.1, 2.5, -2.8], [4.1, 2.5, -2.8], 0.12, '#5aa553');
    for (const [k, xx] of [[1, 1.1], [2, 2.9]] as Array<[number, number]>) {
      b.stick([xx - 0.25, 2.5, -2.8], [xx - 0.25, 0.55, -2.8], 0.025, '#9da3a8', { name: `swing${k}`, pivot: [xx, 2.5, -2.8] })
        .stick([xx + 0.25, 2.5, -2.8], [xx + 0.25, 0.55, -2.8], 0.025, '#9da3a8', { parent: `swing${k}` })
        .box([0.6, 0.05, 0.25], [xx, 0.53, -2.8], { color: '#2a2726', parent: `swing${k}` });
    }
    // seesaw
    b.wedge([0.4, 0.45, 0.4], [3.5, 0.32, 2.5], { color: '#5c6166' })
      .box([3.4, 0.08, 0.3], [3.5, 0.6, 2.5], { color: '#4e8fd6', name: 'seesaw', pivot: [3.5, 0.56, 2.5], rot: [0, 0, 0] })
      .box([0.3, 0.04, 0.3], [5.0, 0.66, 2.5], { color: '#e0473b', parent: 'seesaw' })
      .box([0.3, 0.04, 0.3], [2.0, 0.66, 2.5], { color: '#e0473b', parent: 'seesaw' })
      .rod([5.0, 0.62, 2.5], [5.0, 0.9, 2.5], 0.04, '#5c6166', { parent: 'seesaw' })
      .rod([2.0, 0.62, 2.5], [2.0, 0.9, 2.5], 0.04, '#5c6166', { parent: 'seesaw' });
    // sandpit and a climbing dome of bars
    b.box([3.2, 0.3, 3.2], [-4.0, 0.2, 3.5], { color: '#a0703f' }).box([2.9, 0.12, 2.9], [-4.0, 0.32, 3.5], { color: 'sand', edge: 'soft' });
    b.each(4, (i) => b.arc([2.6, 3.2, 0.08], [0.0, 0.1, 3.0], { color: i % 2 ? '#f0923b' : '#4e8fd6', rot: [0, i * 45, 0], tube: 0.04 }));
    return b
      .socket('swing', [1.1, 0.56, -2.8], 'seat', { part: 'swing1' })
      .act({
        click: [
          [A.par(A.pose('swing1', { rot: [35, 0, 0], dur: 0.7 }), A.pose('swing2', { rot: [-30, 0, 0], dur: 0.7 }), A.say('Wheee!', 1.5)), A.par(A.pose('swing1', { rot: [-30, 0, 0], dur: 0.8 }), A.pose('swing2', { rot: [30, 0, 0], dur: 0.8 })), A.par(A.pose('swing1', { rot: [0, 0, 0], dur: 0.7 }), A.pose('swing2', { rot: [0, 0, 0], dur: 0.7 }))],
          [A.pose('seesaw', { rot: [0, 0, 12], dur: 0.6 }), A.par(A.pose('seesaw', { rot: [0, 0, -12], dur: 0.8 }), A.say('Creak, creak!', 1.5)), A.pose('seesaw', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A child's plastic playhouse (1.5 m): coloured walls, windows with shutters, a door that opens, a red roof
  // and a little chimney. A child pops out to play.
  e('playhouse (toy)', 'toys', 'outdoor toys', () => {
    const b = m('playhouse (toy)', { edge: 'sharp' })
      .box([1.3, 1.0, 1.1], [0, 0.55, 0], { color: '#f6d24a', round: 0.1, name: 'walls' })
      .box([1.36, 0.1, 1.16], [0, 0.05, 0], { color: '#5aa553', round: 0.3 });
    gable(b, 1.3, 1.1, 1.05, 0.45, { roof: '#e0473b', wall: '#f6d24a', over: 0.12, t: 0.07 });
    b.box([0.45, 0.8, 0.05], [-0.25, 0.5, 0.57], { color: '#4e8fd6', name: 'door', pivot: [-0.475, 0.5, 0.57], mover: { kind: 'swing', axis: 'y', amount: -100 }, round: 0.3 })
      .ball(0.05, [-0.08, 0.5, 0.6], { color: '#f6d24a', parent: 'door' })
      .box([0.2, 0.15, 0.02], [-0.25, 0.7, 0.6], { color: 'glass', parent: 'door', round: 0.2 });
    win(b, [0.35, 0.65, 0.55], 0.32, 0.3, { frame: 'white', cross: true });
    b.box([0.1, 0.34, 0.03], [0.6, 0.65, 0.57], { color: '#4e8fd6', round: 0.3 }).box([0.1, 0.34, 0.03], [0.1, 0.65, 0.57], { color: '#4e8fd6', round: 0.3 });
    win(b, [0.65, 0.65, 0], 0.32, 0.3, { face: 'left', frame: 'white', cross: true });
    return b
      .box([0.18, 0.35, 0.18], [0.35, 1.45, -0.25], { color: '#e8e4dc', round: 0.2 })
      .socket('inside', [0, 0.12, 0], 'inside', { size: 0.9 })
      .act({ click: [[A.operate('door', 'open'), A.spawn('kid', 'child', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wave', 1, 'kid'), A.say('Come and play!', 2, 'kid')), A.wait(1.2), A.remove('kid', 'fade'), A.operate('door', 'close')]] })
      .done();
  }),
  // A baby's playpen (1 x 1 m, 0.7 m high): a padded top rail, mesh sides, corner posts, a soft floor, a few
  // toys, and a baby who giggles.
  e('playpen', 'home', 'baby things', () => {
    const b = m('playpen', { edge: 'sharp' }).box([1.0, 0.08, 1.0], [0, 0.06, 0], { color: '#8fc6f0', round: 0.3 });
    for (const [xx, z] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) b.cyl([0.06, 0.7, 0.06], [xx, 0.35, z], { color: 'white' });
    for (const [xx, z, ry] of [[0, 0.5, 0], [0, -0.5, 0], [0.5, 0, 90], [-0.5, 0, 90]] as Array<[number, number, number]>) {
      b.box([1.0, 0.07, 0.07], [xx, 0.69, z], { color: '#4e8fd6', rot: [0, ry, 0], round: 0.6, edge: 'soft' });
      b.box([0.96, 0.52, 0.01], [xx, 0.38, z], { color: '#d4e8f5', rot: [0, ry, 0], round: 0 });
      b.each(7, (i) => b.box([0.01, 0.52, 0.015], [xx + (ry ? 0 : -0.42 + i * 0.14), 0.38, z + (ry ? -0.42 + i * 0.14 : 0)], { color: 'white', round: 0, noInk: true }));
    }
    return b
      .ball(0.14, [0.25, 0.17, -0.25], { color: '#e0473b', edge: 'soft' })
      .box([0.1, 0.1, 0.1], [-0.25, 0.15, -0.2], { color: '#f6d24a', round: 0.2 })
      .box([0.1, 0.1, 0.1], [-0.2, 0.25, -0.22], { color: '#5aa553', round: 0.2 })
      .socket('inside', [0, 0.1, 0.1], 'inside', { size: 0.8 })
      .act({ setup: [A.spawn('baby', 'baby'), A.attach('baby', 'self', 'inside')], click: [[A.par(A.anim('laugh', 1, 'self.inside'), A.say('Hee hee! Goo goo!', 2, 'self.inside'))], [A.par(A.anim('clap', 1, 'self.inside'), A.say('Ba-ba!', 1.5, 'self.inside'))]] })
      .done();
  }),
  // A children's playroom (4 x 3.5 m): a bright rug, a toy chest whose lid opens, a rocking horse that rocks, a
  // shelf of toys, building blocks, a bean bag and a window.
  e('playroom', 'places', 'rooms', () => {
    const b = room('playroom', 4, 3.5, 2.6, '#bfe3f5', 'lightwood');
    win(b, [-0.8, 1.6, -1.63], 1.3, 1.0, { frame: 'white', cross: true });
    b.cyl([2.0, 0.02, 1.4], [-0.3, 0.11, 0.3], { color: '#f4a1c0', edge: 'soft' })
      .cyl([1.4, 0.022, 0.9], [-0.3, 0.115, 0.3], { color: '#f6d24a', edge: 'soft', noInk: true });
    // toy chest
    b.box([0.9, 0.45, 0.5], [1.2, 0.33, -1.2], { color: '#e0473b', round: 0.1, name: 'chest' })
      .box([0.94, 0.08, 0.54], [1.2, 0.59, -1.2], { color: '#c0392b', round: 0.2, name: 'lid', parent: 'chest', pivot: [1.2, 0.55, -1.47], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .star(0.18, [1.2, 0.33, -0.94], { color: '#f6d24a', parent: 'chest' });
    // rocking horse
    b.arc([1.1, 0.5, 0.06], [-1.2, 0.36, -0.6], { color: '#7a5230', rot: [180, 90, 0], tube: 0.12, arc: 120, name: 'horse', pivot: [-1.2, 0.1, -0.6] })
      .box([0.24, 0.24, 0.6], [-1.2, 0.62, -0.6], { color: 'white', parent: 'horse', round: 0.4, edge: 'soft' })
      .box([0.16, 0.32, 0.18], [-1.2, 0.86, -0.32], { color: 'white', parent: 'horse', rot: [-25, 0, 0], round: 0.4, edge: 'soft' })
      .box([0.08, 0.26, 0.1], [-1.2, 0.92, -0.43], { color: '#8c5a2b', parent: 'horse', rot: [-25, 0, 0], round: 0.4 })
      .box([0.26, 0.04, 0.2], [-1.2, 0.76, -0.62], { color: '#e0473b', parent: 'horse' });
    for (const [xx, z] of [[-1.1, -0.85], [-1.3, -0.85], [-1.1, -0.35], [-1.3, -0.35]]) b.rod([xx, 0.52, z], [xx, 0.2, z + (z < -0.6 ? -0.1 : 0.1)], 0.04, 'white', { parent: 'horse' });
    // shelf of toys, blocks, bean bag
    b.box([0.3, 1.2, 1.2], [-1.75, 0.7, 0.3], { color: 'white' }).box([0.3, 0.04, 1.2], [-1.75, 0.75, 0.3], { color: '#e8e4dc' });
    b.ball(0.2, [-1.7, 1.39, 0.0], { color: '#8c5a2b', edge: 'soft' }).box([0.2, 0.2, 0.2], [-1.7, 0.87, 0.5], { color: '#5aa553' }).cyl([0.2, 0.2, 0.2], [-1.7, 0.87, 0.1], { color: '#f0923b' });
    b.each(5, (i) => b.box([0.14, 0.14, 0.14], [0.2 + (i % 3) * 0.16, 0.19 + Math.floor(i / 3) * 0.14, 0.8 + (i % 2) * 0.05], { color: ['#e0473b', '#4e8fd6', '#f6d24a', '#5aa553', '#8a5fc4'][i] }));
    return b
      .ball([0.8, 0.55, 0.8], [1.2, 0.36, 1.0], { color: '#8a5fc4', edge: 'soft' })
      .socket('beanbag', [1.2, 0.5, 1.0], 'seat')
      .act({
        click: [
          [A.pose('horse', { rot: [12, 0, 0], dur: 0.4 }), A.par(A.pose('horse', { rot: [-12, 0, 0], dur: 0.5 }), A.say('Clip clop!', 1.5)), A.pose('horse', { rot: [10, 0, 0], dur: 0.5 }), A.pose('horse', { rot: [0, 0, 0], dur: 0.4 })],
          [A.operate('lid', 'open'), A.spawn('ball', 'ball', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('bounce', 2, 'ball'), A.say('Boing boing!', 1.5)), A.remove('ball', 'fade'), A.operate('lid', 'close')],
        ],
      })
      .done();
  }),
  // Slip-joint pliers (20 cm): serrated steel jaws on a pivot, red cushioned grips. The jaws snap open and shut.
  e('pliers', 'workshop', 'hand tools', () =>
    m('pliers', { edge: 'sharp' })
      .cyl([0.022, 0.024, 0.022], [0, 0.12, 0], { color: 'silver', rot: [90, 0, 0] })
      .box([0.014, 0.07, 0.012], [0.008, 0.16, 0.0], { color: 'steel', rot: [0, 0, -6], name: 'jawL', pivot: [0, 0.12, 0] })
      .box([0.014, 0.07, 0.012], [-0.008, 0.16, -0.006], { color: 'steel', rot: [0, 0, 6], name: 'jawR', pivot: [0, 0.12, 0] })
      .rod([0.004, 0.115, 0], [0.03, 0.0, 0], 0.016, '#e0473b', { parent: 'jawL', edge: 'soft' })
      .rod([-0.004, 0.115, -0.006], [-0.03, 0.0, -0.006], 0.016, '#e0473b', { parent: 'jawR', edge: 'soft' })
      .act({ click: [[A.par(A.pose('jawL', { rot: [0, 0, -14], dur: 0.2 }), A.pose('jawR', { rot: [0, 0, 14], dur: 0.2 })), A.par(A.pose('jawL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('jawR', { rot: [0, 0, 0], dur: 0.15 }), A.say('Snap!', 1))]] })
      .done(),
  ),
  // A horse-drawn walking plough (2.6 m long): a wooden beam with a hitch, a coulter disc that cuts, a steel
  // share and curved mouldboard that turns the soil, a land wheel and two long handles. It cuts a furrow.
  e('plow', 'farm', 'farm tools', () =>
    m('plow', { view: 'side' })
      .box([0.12, 0.14, 2.2], [0, 0.62, 0.2], { color: '#7a5230', round: 0.2, edge: 'sharp', name: 'beam' })
      .rod([0, 0.62, 1.3], [0, 0.55, 1.45], 0.06, 'iron', { parent: 'beam' })
      .torus([0.12, 0.12, 0.03], [0, 0.55, 1.5], { color: 'iron', rot: [0, 90, 0], parent: 'beam' })
      .stick([0, 0.6, 0.8], [0, 0.18, 0.85], 0.05, 'iron', { parent: 'beam' })
      .cyl([0.4, 0.02, 0.4], [0.06, 0.2, 0.85], { color: 'steel', rot: [0, 0, 90], name: 'coulter', parent: 'beam', edge: 'sharp' })
      .stick([0, 0.6, -0.1], [0, 0.15, -0.15], 0.07, 'iron', { parent: 'beam' })
      .wedge([0.4, 0.42, 0.7], [0.12, 0.25, -0.25], { color: '#8f99a3', rot: [0, 20, 0], apex: -0.5, parent: 'beam', edge: 'sharp' })
      .cone([0.1, 0.35, 0.05], [0.0, 0.08, 0.15], { color: 'steel', rot: [90, 0, 0], parent: 'beam', edge: 'sharp' })
      .box([0.12, 0.05, 0.8], [0, 0.07, -0.3], { color: 'iron', parent: 'beam', edge: 'sharp' })
      .rod([0.18, 0.6, -0.6], [0.3, 1.1, -1.35], 0.05, '#a0703f', { parent: 'beam' })
      .rod([-0.18, 0.6, -0.6], [-0.3, 1.1, -1.35], 0.05, '#a0703f', { parent: 'beam' })
      .stick([0.28, 0.85, -1.05], [-0.28, 0.85, -1.05], 0.03, '#a0703f', { parent: 'beam' })
      .stick([0, 0.6, 1.0], [0, 0.18, 1.05], 0.04, 'iron')
      .cyl([0.36, 0.06, 0.36], [0.05, 0.18, 1.05], { color: 'iron', rot: [0, 0, 90], name: 'wheel' })
      .ball([1.2, 0.12, 0.7], [0.2, 0.0, -0.9], { color: 'dirt', edge: 'soft' })
      .act({ click: [[A.par(A.pose('wheel', { rot: [360, 0, 0], dur: 1.2 }), A.pose('coulter', { rot: [360, 0, 0], dur: 1.2 }), A.effect('dust', { dur: 1.5 }), A.say('Scrrrape...', 1.5)), A.pose('wheel', { rot: [0, 0, 0], dur: 0 }), A.pose('coulter', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A purple plum (5 cm) with its dusty bloom, a crease, a stalk and a leaf that can be plucked.
  e('plum', 'food', 'fruit', () =>
    m('plum')
      .ball([0.05, 0.052, 0.048], [0, 0.026, 0], { color: '#5a2a6a', name: 'fruit' })
      .rod([0.0, 0.006, 0.023], [0.002, 0.048, 0.019], 0.003, '#3a1a4a', { noInk: true, parent: 'fruit' })
      .ball([0.018, 0.016, 0.008], [-0.012, 0.035, 0.02], { color: '#8a6aa0', noInk: true, parent: 'fruit' })
      .cyl([0.004, 0.014, 0.004], [0, 0.058, 0], { color: 'darkbrown', name: 'stalk', parent: 'fruit', piece: true })
      .ball([0.035, 0.004, 0.016], [0.016, 0.062, 0], { color: 'leaf', rot: [0, 0, 20], parent: 'stalk' })
      .act({ click: [[A.detach('stalk', 'stalk'), A.say('Pluck!', 1)], [A.reattach('stalk')]] })
      .done(),
  ),
  // A plum tree, 4.5 m, its crown dotted with purple plums. A shake drops one.
  e('plum tree', 'garden', 'fruit trees', () => withAct(tree('plum tree', { h: 4.5, crown: '#4a8a3a', crown2: '#5a9a48', fruit: '#5a2a6a', n: 16, fs: 0.07 }).done(), treeAct('plum'))),
  // A toilet plunger (50 cm): a red rubber cup on a wooden handle. Schlorp, schlorp!
  e('plunger', 'home', 'bathroom', () =>
    m('plunger')
      .dome([0.15, 0.08, 0.15], [0, 0.04, 0], { color: '#c0392b', name: 'cup', pivot: [0, 0, 0] })
      .cyl([0.15, 0.02, 0.15], [0, 0.005, 0], { color: '#a3322a', parent: 'cup' })
      .stick([0, 0.07, 0], [0, 0.5, 0], 0.028, 'lightwood', { name: 'handle', parent: 'cup' })
      .ball(0.035, [0, 0.505, 0], { color: 'darkwood', parent: 'handle' })
      .act({ click: [[A.pose('cup', { scale: 0.7, dur: 0.2 }), A.par(A.pose('cup', { scale: 1, dur: 0.2 }), A.say('Schlorp!', 0.8)), A.pose('cup', { scale: 0.7, dur: 0.2 }), A.par(A.pose('cup', { scale: 1, dur: 0.2 }), A.say('Schlorp!', 0.8))]] })
      .done(),
  ),
  // A plus sign on a stand: two crossed bars. It turns.
  e('plus sign', 'ideas', 'symbols', () =>
    plinth(m('plus sign'))
      .box([0.16, 0.05, 0.03], [0, 0.12, 0], { color: '#e0473b', round: 0.2, name: 'sign', edge: 'sharp' })
      .box([0.05, 0.16, 0.03], [0, 0.12, 0], { color: '#e0473b', round: 0.2, parent: 'sign', edge: 'sharp' })
      .act({ click: [[A.par(A.pose('sign', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('sign', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A red multi-tool pocket knife (9 cm closed) with a white cross badge: the main blade flicks open on its pivot
  // and folds away again; a bottle opener and a corkscrew sit along its back.
  e('pocket knife', 'sports', 'camping gear', () =>
    m('pocket knife', { edge: 'sharp' })
      .box([0.09, 0.024, 0.018], [0, 0.012, 0], { color: '#d42a2a', round: 0.6, name: 'body' })
      .box([0.012, 0.012, 0.002], [0.0, 0.013, 0.0095], { color: 'white', round: 0, parent: 'body' })
      .box([0.004, 0.012, 0.002], [0.0, 0.013, 0.0098], { color: '#d42a2a', round: 0, parent: 'body', noInk: true })
      .box([0.012, 0.004, 0.0021], [0.0, 0.013, 0.0098], { color: '#d42a2a', round: 0, parent: 'body', noInk: true })
      .box([0.075, 0.014, 0.004], [0.0025, 0.018, 0.003], { color: 'silver', name: 'blade', pivot: [0.04, 0.018, 0.003], mover: { kind: 'swing', axis: 'z', amount: -170 } })
      .box([0.03, 0.008, 0.004], [0.03, 0.026, -0.004], { color: '#c9ccd1', rot: [0, 0, 15] })
      .torus([0.012, 0.012, 0.003], [-0.04, 0.026, -0.005], { color: '#c9ccd1', rot: [0, 0, 0], tube: 0.3 })
      .act({ click: [[A.operate('blade', 'on'), A.say('Click!', 1)], [A.operate('blade', 'off'), A.say('Snick.', 1)]] })
      .done(),
  ),
  // A gold pocket watch with its hunter lid, a white face with numerals and hands, a crown and a chain. The lid
  // springs open and the hands race round.
  e('pocket watch', 'wardrobe', 'watches', () => {
    const b = m('pocket watch')
      .cyl([0.05, 0.014, 0.05], [0, 0.033, 0], { color: 'gold', rot: [90, 0, 0], name: 'case' })
      .cyl([0.044, 0.002, 0.044], [0, 0.033, 0.0075], { color: '#fbf8f0', rot: [90, 0, 0], parent: 'case', edge: 'sharp' });
    b.each(12, (i) => b.box([0.002, 0.005, 0.001], [Math.sin((i / 12) * Math.PI * 2) * 0.018, 0.033 + Math.cos((i / 12) * Math.PI * 2) * 0.018, 0.0088], { color: '#2a2726', rot: [0, 0, -(i / 12) * 360], parent: 'case', noInk: true, round: 0 }));
    return b
      .box([0.002, 0.013, 0.001], [0, 0.039, 0.009], { color: '#2a2726', name: 'minute', pivot: [0, 0.033, 0.009], parent: 'case', round: 0 })
      .box([0.0025, 0.009, 0.001], [0.0035, 0.035, 0.0092], { color: '#2a2726', rot: [0, 0, -60], name: 'hour', pivot: [0, 0.033, 0.0092], parent: 'case', round: 0 })
      .cyl([0.05, 0.004, 0.05], [0, 0.033, 0.009], { color: 'gold', rot: [90, 0, 0], name: 'lid', parent: 'case', pivot: [-0.025, 0.033, 0.009], mover: { kind: 'swing', axis: 'y', amount: -120 }, edge: 'sharp' })
      .cyl([0.008, 0.008, 0.008], [0, 0.062, 0], { color: 'gold', parent: 'case' })
      .torus([0.012, 0.012, 0.003], [0, 0.071, 0], { color: 'gold', parent: 'case' })
      .rod([0, 0.075, 0], [0.04, 0.01, 0.01], 0.003, 'gold')
      .rod([0.04, 0.01, 0.01], [0.07, 0.002, 0.0], 0.003, 'gold')
      .act({
        click: [
          [A.operate('lid', 'open'), A.par(A.pose('minute', { rot: [0, 0, -720], dur: 1.5 }), A.pose('hour', { rot: [0, 0, -60], dur: 1.5 }), A.say('Tick tock, tick tock...', 1.8))],
          [A.operate('lid', 'close'), A.par(A.pose('minute', { rot: [0, 0, 0], dur: 0 }), A.pose('hour', { rot: [0, 0, 0], dur: 0 }), A.say('Snap!', 1))],
        ],
      })
      .done();
  }),
  // A pea pod (9 cm) split along its seam with a row of plump peas inside. The top half pops off.
  e('pod', 'food', 'vegetables', () => {
    const b = m('pod', { view: 'side' })
      .loft([0.028, 0.02, 0.09], [0, 0.012, 0], [[0, 0.2, 0.3], [0.15, 0.8, 0.9], [0.5, 1, 1], [0.85, 0.8, 0.9], [1, 0.15, 0.3]], { color: '#7cc45a', cut: 'bottom', name: 'pod' });
    b.each(5, (i) => b.ball(0.014, [0, 0.014, -0.03 + i * 0.015], { color: '#9be34d', parent: 'pod' }));
    return b
      .loft([0.028, 0.02, 0.09], [0.008, 0.016, 0], [[0, 0.2, 0.3], [0.15, 0.8, 0.9], [0.5, 1, 1], [0.85, 0.8, 0.9], [1, 0.15, 0.3]], { color: '#6ab04c', cut: 'top', rot: [0, 0, -50], name: 'shell', parent: 'pod', piece: true })
      .rod([0, 0.012, 0.045], [0.0, 0.03, 0.06], 0.003, '#5aa553', { parent: 'pod' })
      .act({ click: [[A.detach('shell', 'shell'), A.say('Pop!', 1)], [A.reattach('shell')]] })
      .done();
  }),
  // A pogo stick (1.15 m): T handlebars with grips, a long pole, foot pegs, a spring in its housing and a rubber
  // foot. Boing, boing, boing!
  e('pogo stick', 'toys', 'outdoor toys', () =>
    m('pogo stick')
      .cyl([0.05, 0.05, 0.05], [0, 0.025, 0], { color: 'rubber' })
      .stick([0, 0.05, 0], [0, 0.32, 0], 0.035, 'silver', { edge: 'sharp' })
      .cyl([0.07, 0.3, 0.07], [0, 0.45, 0], { color: '#e0473b', edge: 'sharp' })
      .torus([0.07, 0.07, 0.012], [0, 0.35, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.3 })
      .stick([0, 0.6, 0], [0, 1.08, 0], 0.04, '#e0473b', { edge: 'sharp' })
      .box([0.3, 0.025, 0.06], [0, 0.32, 0], { color: '#2a2726', round: 0.4, edge: 'sharp' })
      .stick([-0.22, 1.08, 0], [0.22, 1.08, 0], 0.03, 'silver', { edge: 'sharp' })
      .capsule([0.04, 0.1, 0.04], [0.2, 1.08, 0], { color: '#2a2726', rot: [0, 0, 90] })
      .capsule([0.04, 0.1, 0.04], [-0.2, 1.08, 0], { color: '#2a2726', rot: [0, 0, 90] })
      .act({ click: [[A.par(A.anim('bounce', 3), A.say('Boing! Boing! Boing!', 2))]] })
      .done(),
  ),
  // A potted poinsettia (45 cm): stars of scarlet bracts with little yellow centres over dark green leaves, in a
  // pot wrapped in gold foil. Its crown of red stars opens wider.
  e('poinsettia', 'garden', 'flowers', () => {
    const b = m('poinsettia')
      .cyl([0.2, 0.17, 0.2], [0, 0.085, 0], { color: '#e2b23a', taper: 1.2, segs: 8, edge: 'sharp' })
      .cyl([0.24, 0.03, 0.24], [0, 0.17, 0], { color: '#f6d24a', segs: 8, edge: 'sharp' })
      .ball([0.22, 0.08, 0.22], [0, 0.2, 0], { color: 'dirt' });
    b.each(8, (i) => spoke(b, [0, 0.24, 0], i * 45 + 20, -12, 0.17, 0.012, 0.07, '#2f6a32'));
    b.ball([0.04, 0.04, 0.04], [0, 0.32, 0], { color: '#3f7a3a', name: 'head', pivot: [0, 0.22, 0] });
    for (const [cx, cz, cy, s] of [[0, 0, 0.36, 1], [0.09, 0.05, 0.31, 0.8], [-0.09, 0.04, 0.32, 0.8], [0.0, -0.09, 0.32, 0.8]] as Array<[number, number, number, number]>) {
      b.each(6, (i) => spoke(b, [cx, cy, cz], i * 60, 8, 0.1 * s, 0.01, 0.045 * s, i % 2 ? '#d42a2a' : '#b81f2a', { parent: 'head' }));
      b.ball(0.02 * s, [cx, cy + 0.005, cz], { color: '#f6d24a', parent: 'head' });
    }
    return b.act({ click: [[A.par(A.pose('head', { scale: 1.2, dur: 0.6 }), A.effect('sparkle', { dur: 1.2 }), A.say('Twinkle!', 1.5)), A.wait(0.8), A.pose('head', { scale: 1, dur: 0.5 })]] }).done();
  }),
  // Polarised sunglasses: a black wayfarer frame with dark green lenses that flash in the sun, standing on their
  // folded-out arms.
  e('polarised sunglasses', 'wardrobe', 'eyewear', () => {
    const b = m('polarised sunglasses', { edge: 'sharp' }).box([0.145, 0.014, 0.012], [0, 0.058, 0.06], { color: '#2a2726', round: 0.4, name: 'frame' });
    b.pair((s) => {
      b.box([0.058, 0.044, 0.01], [s * 0.034, 0.037, 0.06], { color: '#2a2726', round: 0.4, parent: 'frame' });
      b.box([0.05, 0.036, 0.006], [s * 0.034, 0.037, 0.066], { color: '#1f3a2a', round: 0.4, parent: 'frame' });
      b.ball([0.016, 0.01, 0.002], [s * 0.026, 0.046, 0.0695], { color: '#8fc6a0', noInk: true, parent: 'frame' });
      b.box([0.006, 0.01, 0.13], [s * 0.07, 0.055, -0.005], { color: '#2a2726', round: 0.4, parent: 'frame' });
      b.rod([s * 0.07, 0.055, -0.07], [s * 0.07, 0.0, -0.08], 0.006, '#2a2726', { parent: 'frame' });
    });
    return b.box([0.012, 0.012, 0.012], [0, 0.03, 0.06], { color: '#2a2726', parent: 'frame' }).act({ click: [[A.par(A.effect('sparkle', { dur: 1 }), A.say('Gleam!', 1.2))]] }).done();
  }),
  // A flagpole (6 m) on a concrete base with a ball finial, a halyard, and a flag that is raised to the top and
  // flaps, then lowered.
  e('pole', 'places', 'street things', () =>
    m('pole', { edge: 'sharp' })
      .cyl([0.7, 0.2, 0.7], [0, 0.1, 0], { color: '#a7a39b' })
      .cyl([0.12, 6.0, 0.12], [0, 3.1, 0], { color: 'silver', taper: 0.6 })
      .ball(0.14, [0, 6.15, 0], { color: 'gold', edge: 'soft' })
      .stick([0.07, 1.0, 0], [0.07, 6.0, 0], 0.01, 'white')
      .box([1.2, 0.8, 0.02], [0.68, 2.4, 0], { color: '#4e8fd6', name: 'flag', mover: { kind: 'slide', axis: 'y', amount: 3.1 }, round: 0.1 })
      .star(0.4, [0.68, 2.4, 0.015], { color: 'white', parent: 'flag' })
      .act({ click: [[A.operate('flag', 'up'), A.par(A.pose('flag', { rot: [0, 20, 0], dur: 0.5 }), A.say('Flap flap!', 1.5)), A.pose('flag', { rot: [0, 0, 0], dur: 0.5 })], [A.operate('flag', 'down'), A.say('Squeak squeak...', 1.5)]] })
      .done(),
  ),
  // A police officer's peaked cap: navy crown, a black-and-white chequered band, a shiny black peak and a gold
  // badge. It hops up as if doffed.
  e('police cap', 'wardrobe', 'hats', () => {
    const b = m('police cap')
      .cyl([0.2, 0.06, 0.2], [0, 0.04, 0], { color: '#2f3d6a', taper: 1.12, name: 'cap' })
      .ball([0.25, 0.06, 0.25], [0, 0.08, -0.005], { color: '#2f3d6a', parent: 'cap' })
      .box([0.16, 0.012, 0.07], [0, 0.018, 0.1], { color: '#1e1b1f', rot: [-15, 0, 0], round: 0.6, parent: 'cap', edge: 'sharp' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.05, 0.02, 0.004], [Math.sin(a) * 0.101, 0.03, Math.cos(a) * 0.101], { color: i % 2 ? 'white' : '#1e1b1f', rot: [0, deg(a), 0], parent: 'cap', round: 0, noInk: true });
    });
    return b
      .star(0.035, [0, 0.07, 0.11], { color: 'gold', rot: [-10, 0, 0], parent: 'cap' })
      .act({ click: [[A.par(A.pose('cap', { move: [0, 0.05, 0], dur: 0.2 }), A.say('Hup!', 1.2)), A.pose('cap', { move: [0, 0, 0], dur: 0.2 })]] })
      .done();
  }),
  // A police patrol car (4.8 m): white with black doors and POLICE on them, a red-and-blue light bar on the roof,
  // a push bar on the front, an antenna. The lights flash and the siren wails; the door opens and an officer
  // steps out.
  e('police car', 'garage', 'cars', () => {
    const b = sedan('police car', { L: 4.8, W: 1.85, body: 'white', doorC: '#1e1b1f', roof: 'white', cab: 0.44 });
    for (const s of [1, -1]) b.label('POLICE', [0.9, 0.2], [s * 0.95, 0.78, 0.25], { color: '#1e1b1f', rot: [0, s * 90, 0], parent: s > 0 ? 'doorL' : 'doorR', depth: 0.01 });
    return b
      .box([1.3, 0.1, 0.32], [0, 1.53, -0.2], { color: '#2a2726', parent: 'body', round: 0.3, edge: 'sharp' })
      .box([0.55, 0.12, 0.28], [0.32, 1.62, -0.2], { color: '#e0473b', name: 'sirenR', parent: 'body', mover: { kind: 'light' }, round: 0.3, edge: 'sharp' })
      .box([0.55, 0.12, 0.28], [-0.32, 1.62, -0.2], { color: '#4e8fd6', name: 'sirenB', parent: 'body', mover: { kind: 'light' }, round: 0.3, edge: 'sharp' })
      .box([1.1, 0.35, 0.08], [0, 0.55, 2.47], { color: '#2a2726', parent: 'body', round: 0.3, edge: 'sharp' })
      .stick([-0.5, 1.0, -2.0], [-0.5, 1.8, -2.1], 0.012, '#2a2726', { parent: 'body' })
      .act({
        click: [
          [A.par(A.operate('siren', 'on'), A.operate('headlight', 'on'), A.say('Wee-woo! Wee-woo!', 2.5)), A.wait(2.5), A.par(A.operate('siren', 'off'), A.operate('headlight', 'off'))],
          [A.operate('doorL', 'open'), A.spawn('cop', 'police officer', { rel: 'left', of: 'self', dist: 'close' }), A.par(A.anim('point', 1, 'cop'), A.say('Pull over, please!', 2, 'cop')), A.wait(1), A.remove('cop', 'fade'), A.operate('doorL', 'close')],
        ],
      })
      .done();
  }),
  // A two-storey police station (16 m): stone walls, a pillared entrance with double doors up a step, a blue
  // lamp that lights over the door, a POLICE sign, a flagpole and a patrol car parked outside.
  e('police station', 'places', 'civic buildings', () => {
    const b = bld('police station', { w: 16, d: 11, floors: 2, fh: 3.4, wall: '#c9c2b0', trim: '#f7f5ef', double: true, door: '#2f3d6a', cols: 6, win: '#9fc4d8', base: '#7a7f85' });
    b.box([4.4, 0.25, 2.2], [0, 3.1, 6.4], { color: '#f7f5ef', round: 0.1 })
      .rod([1.9, 0.4, 7.3], [1.9, 3.0, 7.3], 0.3, '#f7f5ef').rod([-1.9, 0.4, 7.3], [-1.9, 3.0, 7.3], 0.3, '#f7f5ef')
      .label('POLICE', [3.2, 0.7], [0, 3.6, 5.62], { color: '#2f3d6a', depth: 0.08 })
      .box([0.4, 0.45, 0.4], [0, 3.55, 7.3], { color: '#4e8fd6', name: 'lamp', mover: { kind: 'light', on: true }, round: 0.3 })
      .label('POLICE', [0.36, 0.1], [0, 3.55, 7.51], { color: '#4e8fd6', parent: 'lamp', depth: 0.01 })
      .stick([7.6, 0, 6.8], [7.6, 9.5, 6.8], 0.12, 'silver')
      .box([1.6, 1.0, 0.03], [8.4, 9.0, 6.8], { color: '#2f3d6a', name: 'flag', pivot: [7.6, 9.0, 6.8] });
    parked(b, -5.5, 0, 9, 'white');
    b.box([1.0, 0.1, 0.3], [-5.5, 1.53, 8.8], { color: '#4e8fd6', round: 0.3 });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.operate('lamp', 'off')), A.spawn('cop', 'police officer', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('nod', 1, 'cop'), A.say('Can I help you?', 2, 'cop'), A.operate('lamp', 'on')), A.wait(1.2), A.remove('cop', 'fade'), A.operate('door', 'close')],
          [A.pose('flag', { rot: [0, 25, 0], dur: 0.6 }), A.pose('flag', { rot: [0, -15, 0], dur: 0.6 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A police uniform: navy tunic and trousers, peaked cap, badge, tie and duty belt, worn by an officer who
  // points and calls out, or gives a thumbs up.
  e('policeman uniform', 'wardrobe', 'uniforms', () =>
    withAct(who('policeman uniform', { top: '#2f3d6a', bottom: '#2f3d6a', shoes: 'black', long: true, pose: 'salute', acc: [hat('police', '#2f3d6a'), wear('badge', 'gold'), wear('belt', 'black'), wear('tie', 'black')] }), {
      click: [[says('point', 'Stop right there!')], [says('thumbs_up', 'All clear, carry on!')]],
    }),
  ),
  // A lily flower (10 cm) with its stamens heavy with orange pollen, and a little cloud of pollen grains. It
  // puffs a cloud of pollen.
  e('pollen', 'garden', 'flower parts', () => {
    const b = m('pollen').rod([0, 0, 0], [0.005, 0.05, 0], 0.005, '#5aa553');
    b.each(6, (i) => spoke(b, [0.005, 0.05, 0], i * 60, 35, 0.05, 0.004, 0.018, '#f7f0f4'));
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.rod([0.005, 0.05, 0], [0.005 + Math.cos(a) * 0.015, 0.085, Math.sin(a) * 0.015], 0.0015, '#9be34d');
      b.ball([0.004, 0.009, 0.004], [0.005 + Math.cos(a) * 0.015, 0.09, Math.sin(a) * 0.015], { color: '#e0802a' });
    });
    for (const [xx, y, z] of [[0.03, 0.09, 0.01], [0.04, 0.1, -0.01], [0.025, 0.105, 0.02]]) b.ball(0.004, [xx, y, z], { color: '#f6b830', noInk: true });
    return b.act({ click: [[A.par(A.effect('dust', { dur: 1.5 }), A.say('Puff! Achoo!', 1.5))]] }).done();
  }),
  // A piqué polo shirt on a hanger: ribbed collar, a three-button placket, short sleeves and a little logo.
  e('polo shirt', 'wardrobe', 'tops', () =>
    m('polo shirt')
      .arc([0.06, 0.06, 0.008], [0, 0.73, 0], { color: 'silver', arc: 270, tube: 0.18, rot: [0, 0, 180] })
      .rod([-0.2, 0.62, 0], [0, 0.7, 0], 0.012, 'silver')
      .rod([0.2, 0.62, 0], [0, 0.7, 0], 0.012, 'silver')
      .box([0.46, 0.6, 0.12], [0, 0.32, 0], { color: '#3f8f5a', round: 0.3, name: 'shirt', pivot: [0, 0.7, 0] })
      .box([0.2, 0.2, 0.1], [0.27, 0.53, 0], { color: '#3f8f5a', rot: [0, 0, 35], round: 0.4, parent: 'shirt' })
      .box([0.2, 0.2, 0.1], [-0.27, 0.53, 0], { color: '#3f8f5a', rot: [0, 0, -35], round: 0.4, parent: 'shirt' })
      .box([0.2, 0.05, 0.13], [0, 0.63, 0.0], { color: '#f7f5ef', round: 0.4, parent: 'shirt' })
      .box([0.04, 0.15, 0.01], [0, 0.55, 0.061], { color: '#357a4c', round: 0.3, parent: 'shirt' })
      .ball(0.01, [0, 0.6, 0.067], { color: 'white', parent: 'shirt' })
      .ball(0.01, [0, 0.55, 0.067], { color: 'white', parent: 'shirt' })
      .ball(0.01, [0, 0.5, 0.067], { color: 'white', parent: 'shirt' })
      .ball([0.03, 0.02, 0.005], [0.12, 0.5, 0.062], { color: '#e0473b', noInk: true, parent: 'shirt' })
      .act({ click: [[A.par(A.pose('shirt', { rot: [0, 0, 8], dur: 0.4 }), A.say('Swish!', 1)), A.pose('shirt', { rot: [0, 0, -6], dur: 0.4 }), A.pose('shirt', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // White polystyrene: a moulded foam block with cut-outs, a sheet and a cup. Squeak!
  e('polystyrene', 'workshop', 'materials', () =>
    m('polystyrene', { edge: 'sharp' })
      .box([0.3, 0.12, 0.2], [0, 0.06, 0], { color: '#f4f4ef', round: 0.05, name: 'block' })
      .box([0.12, 0.04, 0.1], [0.06, 0.12, 0], { color: '#e4e4dc', round: 0.05, parent: 'block' })
      .box([0.06, 0.13, 0.06], [-0.1, 0.06, 0.07], { color: '#e4e4dc', round: 0.05, parent: 'block' })
      .box([0.25, 0.02, 0.18], [0.04, 0.01, 0.2], { color: '#f4f4ef', round: 0.1, rot: [0, 10, 0] })
      .cyl([0.08, 0.1, 0.08], [-0.2, 0.05, 0.12], { color: '#f4f4ef', taper: 1.3 })
      .act({ click: [[A.par(A.anim('hop'), A.say('Squeak!', 1))]] })
      .done(),
  ),
  // A pomegranate (10 cm) with its little crown, and a half showing jewel-red seeds packed in pale pith. The half
  // lifts away.
  e('pomegranate', 'food', 'fruit', () => {
    const b = m('pomegranate')
      .ball([0.1, 0.09, 0.1], [0, 0.045, 0], { color: '#a8202a', name: 'fruit' })
      .cyl([0.03, 0.025, 0.03], [0, 0.095, 0], { color: '#8a1a2a', taper: 1.4, parent: 'fruit' })
      .ball([0.03, 0.03, 0.02], [-0.02, 0.06, 0.04], { color: '#d84a50', noInk: true, parent: 'fruit' })
      .dome([0.09, 0.045, 0.09], [0.1, 0.0225, 0.05], { color: '#a8202a', rot: [180, 0, 0], name: 'half' })
      .cyl([0.084, 0.004, 0.084], [0.1, 0.046, 0.05], { color: '#f6e6d0', parent: 'half', edge: 'sharp' });
    b.each(10, (i) => b.ball(0.012, [0.1 + Math.cos(i * 0.63) * (0.012 + (i % 3) * 0.008), 0.05, 0.05 + Math.sin(i * 0.63) * (0.012 + (i % 3) * 0.008)], { color: '#d8203a', parent: 'half' }));
    return b.act({ click: [[A.par(A.pose('half', { move: [0, 0.05, 0], dur: 0.3 }), A.effect('sparkle', { dur: 1 }), A.say('Crack!', 1.2)), A.pose('half', { move: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // A cheerleader's pompom: a big burst of red and white plastic ribbons on a hidden handle. Shake it: rah rah!
  e('pompom', 'sports', 'cheerleading', () => {
    const b = m('pompom').capsule([0.03, 0.12, 0.03], [0, 0.06, 0], { color: '#2a2726', name: 'pom', pivot: [0, 0, 0] });
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4, up = -60 + ((i * 37) % 150);
      spoke(b, [0, 0.2, 0], deg(a) % 360, up, 0.14, 0.012, 0.03, i % 2 ? '#e0473b' : 'white', { parent: 'pom' }, 'box');
    }
    return b.ball(0.12, [0, 0.2, 0], { color: '#e0473b', parent: 'pom' }).act({ click: [[A.par(A.pose('pom', { rot: [0, 0, 25], dur: 0.15 }), A.say('Rah rah!', 1.2)), A.pose('pom', { rot: [0, 0, -25], dur: 0.15 }), A.pose('pom', { rot: [0, 0, 20], dur: 0.15 }), A.pose('pom', { rot: [0, 0, 0], dur: 0.15 })]] }).done();
  }),
  // A woven wool poncho in red with yellow stripes, worn over a cream shirt with a straw hat; its wearer holds up
  // their arms to show it off.
  e('poncho', 'wardrobe', 'outfits', () =>
    withAct(who('poncho', { top: 'cream', bottom: 'denim', shoes: 'brown', acc: [poncho('#c0392b', '#f6d24a'), hat('straw', 'tan')] }), {
      click: [[says('arms_up', 'So warm and cosy!')], [says('wave', 'Hello there!')]],
    }),
  ),
  // A garden pond (3.4 x 2.4 m) ringed with flat stones: lily pads with a flower, reeds and a frog on a stone.
  // The frog croaks and leaps; a goldfish jumps with a splash.
  e('pond', 'nature', 'water', () => {
    const b = m('pond').cyl([3.4, 0.12, 2.4], [0, 0.06, 0], { color: '#4f8fb6' }).cyl([3.0, 0.13, 2.0], [0, 0.065, 0], { color: '#3a7aa0', noInk: true });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      b.ball([0.5, 0.18, 0.35], [Math.cos(a) * 1.7, 0.09, Math.sin(a) * 1.2], { color: i % 2 ? '#a7a39b' : '#8f8a82', rot: [0, -deg(a), 0] });
    }
    for (const [xx, z] of [[0.6, 0.3], [-0.4, -0.2], [0.1, 0.5], [-0.7, 0.4]]) b.cyl([0.35, 0.02, 0.35], [xx, 0.135, z], { color: '#5aa553' });
    b.each(3, (i) => b.ball([0.05, 0.03, 0.02], [0.1 + Math.cos(i * 2.1) * 0.03, 0.17, 0.5 + Math.sin(i * 2.1) * 0.03], { color: '#f4a1c0', rot: [0, i * 60, 30] }));
    b.ball(0.04, [0.1, 0.16, 0.5], { color: '#f6d24a' });
    b.each(7, (i) => b.rod([-1.3 + i * 0.08, 0.1, -0.9], [-1.35 + i * 0.1, 0.9 + (i % 3) * 0.2, -1.0], 0.025, '#5aa553'));
    b.ball([0.12, 0.08, 0.14], [1.5, 0.22, 0.5], { color: '#5aa553', name: 'frog', pivot: [1.5, 0.18, 0.5] })
      .ball(0.035, [1.53, 0.27, 0.56], { color: '#1d1a17', eye: true, parent: 'frog' })
      .ball(0.035, [1.47, 0.27, 0.56], { color: '#1d1a17', eye: true, parent: 'frog' });
    return b.act({
      click: [
        [A.par(A.pose('frog', { move: [0, 0.25, 0.1], dur: 0.25 }), A.say('Ribbit!', 1.2)), A.pose('frog', { move: [0, 0, 0], dur: 0.25 })],
        [A.spawn('fish', 'goldfish', { rel: 'on', of: 'self', dist: 'touch' }), A.par(A.anim('hop', 1, 'fish'), A.effect('water_spray', { dur: 1 }), A.say('Splash!', 1)), A.remove('fish', 'sink')],
      ],
    }).done();
  }),
  // An in-ground swimming pool (8 x 4 m): pale stone coping round blue tiled water with a darker deep end, a
  // chrome ladder, lane tiles, and a diving board that bounces. Boing... splash!
  e('pool', 'places', 'pools', () => {
    const b = m('pool', { edge: 'sharp' })
      .box([10, 0.2, 6], [0, 0.1, 0], { color: '#e8e4dc', round: 0.02 })
      .box([8, 0.21, 4], [0, 0.105, 0], { color: '#5ab0e0', round: 0.02 })
      .box([3, 0.212, 4], [-2.5, 0.106, 0], { color: '#3a8fc8', round: 0.02, noInk: true })
      .box([7, 0.213, 0.15], [0.2, 0.107, 0], { color: '#2f6fa8', round: 0, noInk: true });
    b.pair((s) => b.rod([3.6 + s * 0.25, 0.2, -2.1], [3.6 + s * 0.25, 1.0, -1.95], 0.05, 'silver').rod([3.6 + s * 0.25, 1.0, -1.95], [3.6 + s * 0.25, 0.9, -2.3], 0.05, 'silver'));
    b.each(3, (i) => b.stick([3.35, 0.0 + i * 0.25, -1.95], [3.85, 0.0 + i * 0.25, -1.95], 0.04, 'silver'));
    return b
      .box([0.8, 0.5, 0.6], [-4.6, 0.45, 0], { color: '#9da3a8', round: 0.1 })
      .box([2.6, 0.08, 0.55], [-3.6, 0.72, 0], { color: '#f7f5ef', round: 0.3, name: 'board', pivot: [-4.8, 0.72, 0] })
      .box([0.6, 0.012, 0.5], [-2.6, 0.77, 0], { color: '#5ab0e0', parent: 'board', round: 0, noInk: true })
      .act({ click: [[A.pose('board', { rot: [0, 0, -6], dur: 0.25 }), A.par(A.pose('board', { rot: [0, 0, 5], dur: 0.25 }), A.say('Boing!', 1)), A.pose('board', { rot: [0, 0, 0], dur: 0.25 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('SPLASH!', 1.5))]] })
      .done();
  }),
  // A black 8 ball (57 mm). It rolls and clacks.
  e('pool ball', 'sports', 'billiards', () =>
    m('pool ball')
      .ball(0.057, [0, 0.0285, 0], { color: '#1e1b1f', name: 'ball' })
      .cyl([0.028, 0.004, 0.028], [0, 0.034, 0.025], { color: 'white', rot: [70, 0, 0], parent: 'ball' })
      .label('8', [0.014, 0.016], [0, 0.0345, 0.0275], { color: 'white', rot: [-20, 0, 0], parent: 'ball', depth: 0.001 })
      .ball([0.014, 0.008, 0.004], [-0.012, 0.045, 0.02], { color: '#5c6166', noInk: true, parent: 'ball' })
      .act({ click: [[A.par(A.pose('ball', { rot: [360, 0, 0], dur: 0.6 }), A.say('Clack!', 1)), A.pose('ball', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A full rack of fifteen numbered pool balls in their wooden triangle, ready to break. The rack lifts off.
  e('pool balls', 'sports', 'billiards', () => {
    const b = m('pool balls');
    const cs = ['#f6d24a', '#4e8fd6', '#e0473b', '#8a5fc4', '#f0923b', '#3f7a3a', '#8a2b3a', '#1e1b1f'];
    let k = 0;
    for (let row = 0; row < 5; row++)
      for (let j = 0; j <= row; j++) {
        const xx = (j - row / 2) * 0.058, z = 0.11 - row * 0.05, c = row === 2 && j === 1 ? '#1e1b1f' : cs[k++ % 7];
        b.ball(0.057, [xx, 0.0285, z], { color: c });
        if (k > 7 && !(row === 2 && j === 1)) b.ball([0.03, 0.03, 0.03], [xx, 0.04, z + 0.018], { color: 'white', noInk: true });
      }
    b.box([0.34, 0.02, 0.36], [0, 0.0, -0.01], { color: '#3f7a3a', round: 0.1, edge: 'sharp' });
    return b
      .box([0.34, 0.03, 0.02], [0, 0.02, -0.12], { color: 'darkwood', round: 0.3, name: 'rack', edge: 'sharp' })
      .box([0.02, 0.03, 0.36], [0.085, 0.02, 0.035], { color: 'darkwood', rot: [0, -30, 0], round: 0.3, parent: 'rack', edge: 'sharp' })
      .box([0.02, 0.03, 0.36], [-0.085, 0.02, 0.035], { color: 'darkwood', rot: [0, 30, 0], round: 0.3, parent: 'rack', edge: 'sharp' })
      .act({ click: [[A.pose('rack', { move: [0, 0.25, 0], dur: 0.5 }), A.say('Clack!', 1.2), A.pose('rack', { move: [0, 0, 0], dur: 0.5 })], [A.par(A.anim('shake'), A.say('CRACK!', 1.2))]] })
      .done();
  }),
  // A poolside sun lounger (1.9 m): an aluminium frame on wheels, slatted white bed, a padded cushion, and a
  // backrest that tilts up and lies back down.
  e('pool chair', 'home', 'outdoor furniture', () =>
    m('pool chair', { edge: 'sharp' })
      .box([0.65, 0.05, 1.3], [0, 0.35, 0.25], { color: 'white', round: 0.3 })
      .box([0.6, 0.06, 1.25], [0, 0.4, 0.25], { color: '#4e8fd6', round: 0.5, edge: 'soft' })
      .box([0.65, 0.05, 0.75], [0, 0.645, -0.665], { color: 'white', rot: [45, 0, 0], round: 0.3, name: 'back', pivot: [0, 0.38, -0.4], mover: { kind: 'swing', axis: 'x', amount: 35 } })
      .box([0.6, 0.06, 0.7], [0, 0.685, -0.635], { color: '#4e8fd6', rot: [45, 0, 0], round: 0.5, parent: 'back', edge: 'soft' })
      .stick([0.3, 0, 0.8], [0.3, 0.33, 0.8], 0.04, 'silver').stick([-0.3, 0, 0.8], [-0.3, 0.33, 0.8], 0.04, 'silver')
      .cyl([0.18, 0.05, 0.18], [0.33, 0.09, -0.5], { color: '#2a2726', rot: [0, 0, 90], name: 'wheelL' })
      .cyl([0.18, 0.05, 0.18], [-0.33, 0.09, -0.5], { color: '#2a2726', rot: [0, 0, 90], name: 'wheelR' })
      .stick([0.3, 0.1, -0.5], [0.3, 0.33, -0.4], 0.04, 'silver').stick([-0.3, 0.1, -0.5], [-0.3, 0.33, -0.4], 0.04, 'silver')
      .socket('seat', [0, 0.45, 0.2], 'seat')
      .act({ click: [[A.operate('back', 'on'), A.say('Creak.', 1.2)], [A.operate('back', 'off'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A pool cue (1.45 m) standing on its butt: a tapering maple shaft, a white ferrule and blue chalked tip, a
  // dark wrapped butt with inlays, and a cube of chalk on a little stand. It takes a shot.
  e('pool cue', 'sports', 'billiards', () =>
    m('pool cue')
      .box([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .cyl([0.032, 0.5, 0.032], [0, 0.28, 0], { color: '#3a2a1e', name: 'cue', pivot: [0, 0.03, 0] })
      .cyl([0.034, 0.18, 0.034], [0, 0.2, 0], { color: '#1e1b1f', parent: 'cue' })
      .box([0.012, 0.06, 0.004], [0, 0.4, 0.016], { color: '#e8d8b8', rot: [0, 0, 0], parent: 'cue', round: 0 })
      .cyl([0.026, 0.88, 0.026], [0, 0.97, 0], { color: '#e8c98a', taper: 0.5, parent: 'cue' })
      .cyl([0.013, 0.02, 0.013], [0, 1.42, 0], { color: 'white', parent: 'cue' })
      .cyl([0.013, 0.01, 0.013], [0, 1.437, 0], { color: '#4e8fd6', parent: 'cue' })
      .box([0.022, 0.022, 0.022], [0.05, 0.04, 0.03], { color: '#4e8fd6', edge: 'sharp', round: 0.2 })
      .act({ click: [[A.pose('cue', { rot: [-15, 0, 0], dur: 0.4 }), A.par(A.pose('cue', { rot: [10, 0, 0], dur: 0.12 }), A.say('Tock!', 1)), A.pose('cue', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A pool house (6 x 4 m): a little white cabana with a striped awning over sliding glass doors, a changing room
  // door, a towel rail, a lounger and a deck. The doors slide open.
  e('pool house', 'places', 'pools', () => {
    const b = bld('pool house', { w: 6, d: 4, floors: 1, fh: 3.0, wall: '#f7f5ef', trim: '#4e8fd6', roof: 'side', roofC: '#4e8fd6', roofH: 1.0, doorX: 2.0, dw: 0.85, door: '#4e8fd6', cols: 3, sides: false });
    b.box([3.0, 2.3, 0.08], [-0.8, 1.6, 2.05], { color: '#5c6166', round: 0.1 })
      .box([1.45, 2.2, 0.05], [-0.07, 1.55, 2.1], { color: '#bfe3f5', name: 'slideL', mover: { kind: 'slide', axis: 'x', amount: -1.4 }, round: 0.05 })
      .box([1.45, 2.2, 0.05], [-1.53, 1.55, 2.12], { color: '#bfe3f5', round: 0.05 });
    b.each(6, (i) => b.box([0.98, 0.07, 1.1], [-2.5 + i, 3.0, 2.55], { color: i % 2 ? 'white' : '#4e8fd6', rot: [20, 0, 0], round: 0.1 }));
    b.box([7.5, 0.15, 3.0], [0, 0.075, 3.5], { color: '#c8a06a', round: 0.05 })
      .stick([2.8, 0.15, 3.2], [2.8, 1.2, 3.2], 0.04, 'silver').stick([2.8, 1.2, 3.2], [2.8, 1.2, 3.9], 0.04, 'silver')
      .box([0.04, 0.6, 0.5], [2.8, 0.9, 3.55], { color: '#f0923b', round: 0.3, edge: 'soft' })
      .box([0.65, 0.05, 1.8], [-2.5, 0.38, 3.6], { color: 'white', round: 0.3 })
      .box([0.6, 0.06, 1.7], [-2.5, 0.42, 3.6], { color: '#4e8fd6', round: 0.5, edge: 'soft' });
    return b.act({ click: [[A.operate('slide', 'open'), A.say('Swoosh!', 1), A.wait(2.5), A.operate('slide', 'close')], [A.operate('door', 'open'), A.say('Creak.', 1.2), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A pool table (2.7 x 1.5 m, 0.8 m high): green baize, cushioned wooden rails with diamond sights, six net
  // pockets, carved legs, a racked triangle of balls, the white ball and a cue. The white ball shoots up the
  // table: clack!
  e('pool table', 'sports', 'billiards', () => {
    const b = m('pool table', { edge: 'sharp' })
      .box([2.5, 0.06, 1.3], [0, 0.78, 0], { color: '#2f8a4a', round: 0.05 })
      .box([2.7, 0.2, 1.5], [0, 0.68, 0], { color: '#6b3e26', round: 0.08 });
    for (const s of [1, -1]) {
      b.box([2.7, 0.08, 0.1], [0, 0.84, s * 0.7], { color: '#7a4a2a', round: 0.3 }).box([0.1, 0.08, 1.5], [s * 1.3, 0.84, 0], { color: '#7a4a2a', round: 0.3 });
      b.each(3, (i) => b.box([0.03, 0.01, 0.03], [-0.6 + i * 0.6, 0.885, s * 0.7], { color: '#f7f5ef', rot: [0, 45, 0], round: 0 }));
      for (const xx of [-1.3, 0, 1.3]) b.cyl([0.13, 0.1, 0.13], [xx, 0.82, s * 0.68], { color: '#1e1b1f' });
      for (const xx of [-1.15, 1.15]) b.cyl([0.16, 0.6, 0.16], [xx, 0.3, s * 0.55], { color: '#5a3a22', taper: 0.7, segs: 8 });
    }
    let k = 0;
    const cs = ['#f6d24a', '#4e8fd6', '#e0473b', '#8a5fc4', '#f0923b', '#3f7a3a', '#8a2b3a', '#1e1b1f', '#f6d24a', '#4e8fd6'];
    for (let row = 0; row < 4; row++) for (let j = 0; j <= row; j++) b.ball(0.057, [-0.6 - row * 0.05, 0.84, (j - row / 2) * 0.058], { color: cs[k++], edge: 'soft' });
    return b
      .ball(0.057, [0.65, 0.84, 0], { color: '#f7f5ef', name: 'cueball', edge: 'soft' })
      .rod([0.72, 0.9, 0.02], [1.9, 1.0, 0.25], 0.025, '#e8c98a')
      .socket('top', [0.3, 0.82, 0.3], 'top', { size: 0.4 })
      .act({ click: [[A.par(A.pose('cueball', { move: [-1.1, 0, 0], dur: 0.6 }), A.say('Clack!', 1)), A.say('...plop!', 1), A.pose('cueball', { move: [0, 0, 0], dur: 0.6 })]] })
      .done();
  }),
  // A toy pop gun (60 cm): a wooden stock, a red barrel and a cork on a string that pops out of the muzzle.
  e('pop gun', 'toys', 'toy guns', () =>
    m('pop gun', { view: 'side' })
      .box([0.05, 0.08, 0.22], [0, 0.1, -0.15], { color: 'wood', round: 0.4, edge: 'sharp', name: 'stock' })
      .box([0.04, 0.1, 0.05], [0, 0.04, -0.05], { color: 'wood', rot: [-20, 0, 0], round: 0.4, parent: 'stock' })
      .cyl([0.04, 0.38, 0.04], [0, 0.13, 0.12], { color: '#e0473b', rot: [90, 0, 0], parent: 'stock' })
      .torus([0.05, 0.05, 0.012], [0, 0.13, 0.3], { color: '#f6d24a', rot: [0, 0, 0], parent: 'stock' })
      .cyl([0.032, 0.03, 0.032], [0, 0.13, 0.325], { color: 'tan', rot: [90, 0, 0], taper: 0.85, name: 'cork', parent: 'stock', piece: true })
      .rod([0, 0.13, 0.33], [0, 0.09, 0.15], 0.004, 'white', { parent: 'cork' })
      .act({ click: [[A.par(A.detach('cork', 'cork'), A.say('POP!', 1))], [A.reattach('cork'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A red-and-white striped popcorn bucket heaped with fluffy popcorn. More pops up out of it.
  e('popcorn', 'food', 'snacks', () => {
    const b = m('popcorn').cyl([0.15, 0.2, 0.15], [0, 0.1, 0], { color: 'white', taper: 1.25, edge: 'sharp', name: 'bucket' });
    b.each(6, (i) => b.box([0.035, 0.2, 0.01], [Math.sin((i / 6) * Math.PI * 2) * 0.083, 0.1, Math.cos((i / 6) * Math.PI * 2) * 0.083], { color: '#e0473b', rot: [-7 * Math.cos((i / 6) * Math.PI * 2), deg((i / 6) * Math.PI * 2), 0], parent: 'bucket', round: 0, noInk: true }));
    b.label('POPCORN', [0.1, 0.035], [0, 0.13, 0.088], { color: '#f6d24a', parent: 'bucket', depth: 0.004 });
    b.ball([0.08, 0.04, 0.08], [0, 0.23, 0], { color: '#fff3d6', name: 'heap', pivot: [0, 0.2, 0] });
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, r = 0.02 + (i % 4) * 0.018, y = 0.215 + ((i * 7) % 5) * 0.012;
      b.ball(0.028 + (i % 3) * 0.006, [Math.cos(a) * r, y, Math.sin(a) * r], { color: i % 4 ? '#fff3d6' : '#f6e0a0', parent: 'heap' });
    }
    return b.act({ click: [[A.par(A.pose('heap', { scale: 1.3, dur: 0.3 }), A.say('Pop! Pop pop!', 1.5)), A.spawn('k', 'popcorn kernel', { rel: 'front', of: 'self', dist: 'touch' }), A.pose('heap', { scale: 1, dur: 0.4 }), A.wait(1), A.remove('k', 'pop')]] }).done();
  }),
  // Golden popcorn kernels (8 mm) heaped in a little ramekin, with one on the table beside it ready to pop.
  // Heat it: pop! (and a fluffy piece of popcorn sits where it was).
  e('popcorn kernel', 'food', 'snacks', () => {
    const b = m('popcorn kernel').cyl([0.06, 0.03, 0.06], [0, 0.015, 0], { color: '#f7f5ef', taper: 1.2, edge: 'sharp' });
    for (const [xx, z, y] of [[-0.012, 0.01, 0.032], [0.012, -0.008, 0.032], [0.0, 0.014, 0.034], [0.01, 0.01, 0.036], [-0.01, -0.01, 0.034]]) b.ball([0.009, 0.007, 0.008], [xx, y, z], { color: '#e8b030' });
    return b
      .ball([0.009, 0.007, 0.008], [0.05, 0.0035, 0.02], { color: '#e8b030', name: 'kernel' })
      .ball([0.025, 0.02, 0.022], [0.05, 0.01, 0.02], { color: '#fff3d6', name: 'popped', scale: 0 })
      .act({ click: [[A.par(A.pose('kernel', { scale: 0, dur: 0.1 }), A.pose('popped', { scale: 1, dur: 0.15 }), A.anim('hop'), A.say('POP!', 1))], [A.par(A.pose('kernel', { scale: 1, dur: 0.2 }), A.pose('popped', { scale: 0, dur: 0.2 }), A.say('Rattle...', 1.2))]] })
      .done();
  }),
  // A front porch (5 x 2.5 m): a wooden deck up two steps, turned posts and a railing, a roof with a beadboard
  // ceiling, the house wall with a front door and a window, and a rocking chair that rocks.
  e('porch', 'places', 'house parts', () => {
    const b = m('porch', { edge: 'sharp' })
      .box([5.6, 3.4, 0.25], [0, 1.7, -1.4], { color: '#e8d8b8', round: 0.02 })
      .box([5, 0.5, 2.6], [0, 0.25, 0], { color: '#a0703f', round: 0.03 })
      .box([5.1, 0.05, 2.7], [0, 0.52, 0], { color: '#c89a5a', round: 0.1 });
    b.each(2, (i) => b.box([1.4, 0.17, 0.32], [0, 0.085 + i * 0.17, 1.45 - i * 0.3], { color: '#c89a5a' }));
    for (const xx of [-2.4, -0.8, 0.8, 2.4]) b.box([0.16, 2.5, 0.16], [xx, 1.8, 1.2], { color: 'white', round: 0.2 });
    for (const s of [1, -1]) {
      b.box([1.45, 0.08, 0.08], [s * 1.6, 1.4, 1.2], { color: 'white' }).box([1.45, 0.06, 0.06], [s * 1.6, 0.65, 1.2], { color: 'white' });
      b.each(7, (i) => b.box([0.04, 0.75, 0.04], [s * (1.0 + i * 0.2), 1.02, 1.2], { color: 'white', round: 0.2 }));
    }
    b.box([5.4, 0.12, 2.9], [0, 3.1, -0.05], { color: '#f2eee4', rot: [-8, 0, 0], round: 0.1 }).box([5.6, 0.1, 3.1], [0, 3.25, 0.0], { color: '#5c6166', rot: [-8, 0, 0], round: 0.1 });
    b.box([1.1, 2.25, 0.1], [0.9, 1.6, -1.25], { color: 'white' })
      .box([0.95, 2.1, 0.06], [0.9, 1.57, -1.2], { color: '#3f6a8a', name: 'door', pivot: [0.425, 1.57, -1.2], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .ball(0.07, [1.25, 1.5, -1.15], { color: 'brass', parent: 'door' });
    win(b, [-1.3, 1.9, -1.27], 1.2, 1.2, { frame: 'white', cross: true });
    // rocking chair on curved runners
    b.box([0.5, 0.05, 0.48], [-1.4, 0.98, 0.3], { color: '#7a5230', name: 'rocker', pivot: [-1.4, 0.57, 0.3] })
      .box([0.5, 0.65, 0.05], [-1.4, 1.32, 0.06], { color: '#7a5230', rot: [-10, 0, 0], parent: 'rocker' });
    for (const s of [1, -1]) {
      b.arc([0.9, 0.25, 0.04], [-1.4 + s * 0.22, 0.68, 0.3], { color: '#5a3a22', rot: [180, 90, 0], tube: 0.18, arc: 100, parent: 'rocker' });
      b.stick([-1.4 + s * 0.22, 0.58, 0.48], [-1.4 + s * 0.22, 0.96, 0.48], 0.04, '#7a5230', { parent: 'rocker' }).stick([-1.4 + s * 0.22, 0.58, 0.12], [-1.4 + s * 0.22, 0.96, 0.12], 0.04, '#7a5230', { parent: 'rocker' });
    }
    return b
      .socket('chair', [-1.4, 1.02, 0.3], 'seat', { part: 'rocker' })
      .act({
        click: [
          [A.pose('rocker', { rot: [10, 0, 0], dur: 0.6, times: 3 }), A.say('Creak... creak...', 1.5)],
          [A.operate('door', 'open'), A.say('Creak...', 1.5), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A thick-cut pork chop with its bone and a rim of fat on a board, with a sprig of rosemary. It sizzles.
  e('pork', 'food', 'meat', () =>
    m('pork')
      .box([0.28, 0.02, 0.2], [0, 0.01, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .ball([0.17, 0.025, 0.13], [-0.01, 0.032, 0], { color: '#f0a8a0' })
      .ball([0.16, 0.022, 0.12], [-0.01, 0.036, 0], { color: '#f4b8b0', noInk: true })
      .torus([0.19, 0.15, 0.03], [-0.01, 0.033, 0], { color: '#fbf0e0', rot: [90, 0, 0], tube: 0.12 })
      .box([0.07, 0.02, 0.02], [0.07, 0.033, -0.03], { color: '#f7f5ef', rot: [0, 30, 0], round: 0.5 })
      .rod([-0.1, 0.03, 0.08], [0.0, 0.03, 0.09], 0.006, '#3f7a3a')
      .act({ click: [[A.par(A.effect('steam', { dur: 1.8 }), A.say('Sizzle!', 1.5))]] })
      .done(),
  ),
  // A bowl of crackling pork rinds: puffed, golden, curly. Crunch!
  e('pork rinds', 'food', 'snacks', () => {
    const b = m('pork rinds').cyl([0.18, 0.06, 0.18], [0, 0.03, 0], { color: '#c0392b', taper: 1.4, edge: 'sharp' });
    b.each(9, (i) => {
      const a = i * 0.9, r = i ? 0.05 : 0;
      b.ball([0.05, 0.025, 0.035], [Math.cos(a) * r, 0.065 + (i ? 0 : 0.015), Math.sin(a) * r], { color: i % 3 ? '#e8b060' : '#d89a40', rot: [i * 20, a * 57, 15] });
    });
    return b.act({ click: [[A.par(A.anim('hop'), A.say('Crunch crunch!', 1.2))]] }).done();
  }),
  // A harbour (30 x 22 m): a stone quay on the water with bollards, a dockside crane that swings, stacked
  // shipping containers, a little cargo ship moored alongside and a harbour light. The ship sounds its horn.
  e('port (place)', 'places', 'harbours', () => {
    const b = m('port (place)', { edge: 'sharp' })
      .box([30, 0.3, 22], [0, 0.15, 0], { color: 'water', round: 0.01, edge: 'soft' })
      .box([30, 1.8, 9], [0, 0.9, -6.5], { color: '#a7a39b', round: 0.01 })
      .box([30, 0.2, 0.4], [0, 1.85, -2.1], { color: '#f6d24a' });
    b.each(6, (i) => b.cyl([0.35, 0.5, 0.35], [-12.5 + i * 5, 2.05, -2.5], { color: '#2a2726', taper: 0.8 }));
    // containers
    const box = (xx: number, y: number, z: number, c: string) => b.box([6, 2.6, 2.4], [xx, y + 1.3, z], { color: c, round: 0.03 }).each(5, (i) => b.box([0.08, 2.4, 0.04], [xx - 2.4 + i * 1.2, y + 1.3, z + 1.22], { color: '#2a2726', noInk: true, round: 0 }));
    box(-9, 1.8, -8.5, '#c0392b');
    box(-9, 1.8, -6, '#2f6fa8');
    box(-9, 4.4, -7.25, '#f0923b');
    box(-2.5, 1.8, -8.5, '#3f7a3a');
    // the crane on its legs with a boom that swings
    for (const [xx, z] of [[4, -4], [8, -4], [4, -9], [8, -9]]) b.stick([xx, 1.8, z], [xx, 12, z], 0.5, '#f6d24a');
    b.box([5, 2, 6], [6, 12.6, -6.5], { color: '#f6d24a', name: 'crane', pivot: [6, 12, -6.5], mover: { kind: 'swing', axis: 'y', amount: 70 } })
      .box([1.6, 1.6, 1.6], [6, 14.2, -4.2], { color: 'glass', parent: 'crane' })
      .box([1.2, 1.2, 16], [6, 13.4, 2.5], { color: '#f6d24a', parent: 'crane' })
      .stick([6, 13, 9], [6, 7, 9], 0.06, '#2a2726', { parent: 'crane' })
      .box([1.2, 0.5, 2.4], [6, 6.8, 9], { color: '#e0473b', parent: 'crane' });
    // the ship alongside
    const prof: Array<[number, number, number, number?]> = [[0, 0.9, 0.9, 0], [0.5, 1, 1, 0], [0.85, 0.85, 1, 0], [1, 0.15, 0.9, 0.05]];
    b.loft([4.5, 4, 18], [-2, 2.3, 3.5], prof, { color: '#2f3d6a', cut: 'bottom', boxy: 0.5, rot: [0, 90, 0], name: 'ship', edge: 'soft' })
      .box([17, 0.15, 3.6], [-2.5, 2.35, 3.5], { color: '#c0392b', parent: 'ship' })
      .box([3.5, 3.5, 3.4], [-9.0, 4.0, 3.5], { color: 'white', parent: 'ship' })
      .box([3.6, 0.6, 0.1], [-9.0, 5.0, 5.21], { color: '#2f3d52', parent: 'ship' })
      .cyl([1.0, 2.2, 1.0], [-9.5, 6.8, 3.5], { color: '#e0473b', parent: 'ship' })
      .box([3, 1.6, 2.6], [-2, 3.2, 3.5], { color: '#f0923b', parent: 'ship' })
      .box([3, 1.6, 2.6], [2, 3.2, 3.5], { color: '#3f7a3a', parent: 'ship' });
    // the harbour light at the end of the quay
    b.cyl([1.4, 4.5, 1.4], [13.5, 4.05, -3.5], { color: 'white', taper: 0.75 })
      .box([1.0, 0.8, 1.0], [13.5, 6.7, -3.5], { color: '#fff3a0', name: 'light', mover: { kind: 'light', on: true }, round: 0.2 })
      .cone([1.4, 0.8, 1.4], [13.5, 7.5, -3.5], { color: '#e0473b' });
    return b
      .socket('quay', [0, 1.85, -5], 'top', { size: 4 })
      .act({
        click: [
          [A.par(A.anim('wobble', 1), A.say('TOOOOT!', 2)), A.effect('smoke', { dur: 1.5 })],
          [A.operate('crane', 'open'), A.say('Clank... whirr...', 1.5), A.wait(2), A.operate('crane', 'close')],
        ],
      })
      .done();
  }),
  // A ship's porthole (50 cm) set in a steel hull plate: a brass ring with bolts and a round glass window on a
  // hinge with its wing-nut clamp. It swings open: a splash of sea air.
  e('port hole', 'garage', 'ship parts', () => {
    const b = m('port hole', { edge: 'sharp' })
      .box([0.7, 0.7, 0.06], [0, 0.35, -0.03], { color: '#8f99a3', round: 0.05 })
      .torus([0.5, 0.5, 0.06], [0, 0.4, 0.02], { color: 'brass', tube: 0.18 });
    b.each(8, (i) => b.cyl([0.03, 0.02, 0.03], [Math.cos((i / 8) * Math.PI * 2) * 0.23, 0.4 + Math.sin((i / 8) * Math.PI * 2) * 0.23, 0.05], { color: '#a07a3a', rot: [90, 0, 0] }));
    return b
      .cyl([0.38, 0.04, 0.38], [0, 0.4, 0.07], { color: '#8fc6e6', rot: [90, 0, 0], name: 'window', pivot: [-0.21, 0.4, 0.07], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .torus([0.42, 0.42, 0.04], [0, 0.4, 0.075], { color: 'brass', tube: 0.12, parent: 'window' })
      .box([0.08, 0.04, 0.04], [0.22, 0.4, 0.1], { color: 'brass', parent: 'window' })
      .ball([0.1, 0.04, 0.004], [-0.05, 0.47, 0.092], { color: 'white', noInk: true, parent: 'window' })
      .act({ click: [[A.operate('window', 'open'), A.par(A.effect('water_spray', { dur: 1 }), A.say('Whoosh!', 1.2)), A.wait(1.5), A.operate('window', 'close')]] })
      .done();
  }),
  // A blue portable toilet (1.1 x 1.1 m, 2.3 m): a moulded plastic cabin with a white roof, vents, a door on its
  // hinge with an OCCUPIED/VACANT indicator that turns red while it is shut on someone.
  e('portable toilet', 'places', 'huts', () =>
    m('portable toilet', { edge: 'sharp' })
      .box([1.12, 2.1, 1.12], [0, 1.08, 0], { color: '#2f6fd0', round: 0.08 })
      .box([1.2, 0.1, 1.2], [0, 0.05, 0], { color: '#2a5aa0', round: 0.2 })
      .dome([1.2, 0.22, 1.2], [0, 2.24, 0], { color: 'white' })
      .box([0.9, 1.95, 0.05], [0, 1.08, 0.58], { color: '#3a7ae0', round: 0.1, name: 'door', pivot: [-0.45, 1.08, 0.58], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.12, 0.05, 0.04], [0.35, 1.05, 0.62], { color: '#9da3a8', parent: 'door' })
      .box([0.12, 0.05, 0.03], [0.35, 1.15, 0.62], { color: '#e0473b', name: 'sign', parent: 'door', mover: { kind: 'light' } })
      .box([0.5, 0.12, 0.03], [0, 1.85, 0.62], { color: '#2a2726', parent: 'door', round: 0 })
      .box([0.03, 0.4, 0.5], [0.57, 1.7, 0], { color: '#2a5aa0', round: 0.3 })
      .act({ click: [[A.operate('door', 'open'), A.say('Creak...', 1), A.wait(1.5), A.par(A.operate('door', 'close'), A.operate('sign', 'on'), A.say('Click!', 1.2)), A.wait(1.5), A.operate('sign', 'off')]] })
      .done(),
  ),
  // A post office: brick front with POST OFFICE over glass doors, a flag, a postbox at the kerb whose slot takes
  // a letter, and a postman who comes out with a parcel.
  e('post office', 'places', 'civic buildings', () => {
    const b = bld('post office', { w: 12, d: 9, floors: 2, fh: 3.3, wall: '#b8573a', trim: '#f2eee4', double: true, glassDoor: true, sign: 'POST OFFICE', signC: '#c0392b', cols: 4, lamp: true });
    b.stick([5.4, 7.0, 4.6], [5.4, 9.5, 5.6], 0.08, 'silver')
      .box([1.4, 0.9, 0.03], [6.0, 9.2, 5.8], { color: '#2f4f8f', name: 'flag', pivot: [5.4, 9.2, 5.6] })
      .cyl([0.5, 1.1, 0.5], [3.2, 0.55, 6.0], { color: '#c0392b', name: 'box' })
      .dome([0.54, 0.3, 0.54], [3.2, 1.25, 6.0], { color: '#c0392b', parent: 'box' })
      .box([0.24, 0.04, 0.04], [3.2, 0.95, 6.25], { color: '#2a2726', parent: 'box' })
      .label('MAIL', [0.26, 0.12], [3.2, 0.7, 6.25], { color: '#f6d24a', parent: 'box', depth: 0.02 });
    return b
      .socket('slot', [3.2, 0.95, 6.27], 'slot', { size: 0.25 })
      .act({
        click: [
          [A.spawn('mail', 'letter', { rel: 'front', of: 'self', dist: 'close' }), A.attach('mail', 'self', 'slot'), A.say('Clunk!', 1), A.remove('mail', 'sink')],
          [A.operate('door', 'open'), A.spawn('post', 'postman', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wave', 1, 'post'), A.say('Special delivery for you!', 2.2, 'post')), A.wait(1), A.remove('post', 'fade'), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A seaside postcard on a stand: a sunny beach picture on the front; it turns round to show the stamp, the
  // address lines and a note.
  e('postcard', 'study', 'mail', () =>
    m('postcard', { edge: 'sharp' })
      .box([0.12, 0.012, 0.05], [0, 0.006, 0], { color: 'darkwood', round: 0.3 })
      .box([0.15, 0.105, 0.003], [0, 0.065, 0], { color: 'white', name: 'card', round: 0 })
      .box([0.14, 0.05, 0.001], [0, 0.088, 0.002], { color: '#8fd0f0', parent: 'card', round: 0, noInk: true })
      .box([0.14, 0.03, 0.001], [0, 0.048, 0.002], { color: 'sand', parent: 'card', round: 0, noInk: true })
      .box([0.14, 0.012, 0.001], [0, 0.068, 0.0022], { color: '#4f9bd6', parent: 'card', round: 0, noInk: true })
      .ball([0.02, 0.02, 0.001], [0.045, 0.1, 0.0025], { color: '#f6d24a', parent: 'card', noInk: true })
      .label('GREETINGS!', [0.1, 0.02], [0, 0.03, 0.0025], { color: 'white', parent: 'card', depth: 0.001 })
      .box([0.025, 0.03, 0.001], [-0.05, 0.095, -0.002], { color: '#e0473b', parent: 'card', round: 0 })
      .box([0.06, 0.002, 0.001], [-0.03, 0.06, -0.002], { color: '#5c6166', parent: 'card', round: 0, noInk: true })
      .box([0.06, 0.002, 0.001], [-0.03, 0.05, -0.002], { color: '#5c6166', parent: 'card', round: 0, noInk: true })
      .box([0.002, 0.08, 0.001], [0.0, 0.065, -0.002], { color: '#9da3a8', parent: 'card', round: 0, noInk: true })
      .act({ click: [[A.pose('card', { rot: [0, 180, 0], dur: 0.6 }), A.say('Flip!', 1.2)], [A.pose('card', { rot: [0, 0, 0], dur: 0.6 })]] })
      .done(),
  ),
  // A film poster (70 x 100 cm) on an A-frame display board: a rocket, a moon and a title. Its corner curls in
  // the breeze.
  e('poster', 'home', 'decor', () =>
    m('poster', { edge: 'sharp' })
      .rod([-0.4, 0, -0.25], [-0.38, 1.25, 0.0], 0.04, 'darkwood')
      .rod([0.4, 0, -0.25], [0.38, 1.25, 0.0], 0.04, 'darkwood')
      .box([0.86, 1.1, 0.03], [0, 0.72, 0.05], { color: '#2a2726', rot: [-11, 0, 0], round: 0.1 })
      .box([0.7, 1.0, 0.004], [0, 0.73, 0.075], { color: '#2f3d6a', rot: [-11, 0, 0], round: 0, name: 'sheet' })
      .ball([0.2, 0.2, 0.004], [0.18, 1.0, 0.13], { color: '#f6e0a0', rot: [-11, 0, 0], parent: 'sheet' })
      .box([0.1, 0.3, 0.004], [-0.1, 0.72, 0.085], { color: '#e0473b', rot: [-11, 0, -20], parent: 'sheet', round: 0.5 })
      .label('TO THE MOON', [0.6, 0.12], [0, 0.35, 0.16], { color: '#2f3d6a', rot: [-11, 0, 0], parent: 'sheet', depth: 0.003 })
      .box([0.14, 0.14, 0.003], [0.28, 0.3, 0.17], { color: '#e8e4dc', rot: [-11, 0, 0], name: 'corner', pivot: [0.21, 0.37, 0.16], round: 0 })
      .act({ click: [[A.par(A.pose('corner', { rot: [-40, 20, 0], dur: 0.3 }), A.say('Flap!', 1)), A.pose('corner', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A stainless stock pot (24 cm) with riveted handles and a glass lid with a knob. It comes to the boil: the
  // lid rattles and steam pours out.
  e('pot (kitchen)', 'kitchen', 'cookware', () =>
    m('pot (kitchen)', { edge: 'sharp' })
      .cyl([0.24, 0.18, 0.24], [0, 0.09, 0], { color: '#c9ccd1', name: 'pot' })
      .torus([0.245, 0.245, 0.01], [0, 0.18, 0], { color: '#b9c2ca', rot: [90, 0, 0], tube: 0.06, parent: 'pot' })
      .arc([0.08, 0.06, 0.02], [0.14, 0.15, 0], { color: '#5c6166', rot: [0, 90, -90], tube: 0.3, parent: 'pot' })
      .arc([0.08, 0.06, 0.02], [-0.14, 0.15, 0], { color: '#5c6166', rot: [0, 90, 90], tube: 0.3, parent: 'pot' })
      .dome([0.25, 0.04, 0.25], [0, 0.2, 0], { color: '#bfe3f5', name: 'lid', parent: 'pot', piece: true })
      .cyl([0.04, 0.025, 0.04], [0, 0.23, 0], { color: '#2a2726', parent: 'lid' })
      .act({ click: [[A.par(A.effect('steam', { dur: 2.5 }), A.say('Bubble bubble...', 1.5)), A.pose('lid', { move: [0, 0.02, 0], dur: 0.1, times: 4 }), A.say('Rattle rattle!', 1.2)]] })
      .done(),
  ),
  // A leprechaun's pot of gold: a black three-legged cauldron brimming with gold coins, under a rainbow. The
  // leprechaun himself pops up to dance a jig.
  e('pot of gold', 'fantasy', 'magic items', () => {
    const b = m('pot of gold')
      .ball([0.26, 0.2, 0.26], [0, 0.14, 0], { color: '#1e1b1f', name: 'pot' })
      .torus([0.22, 0.22, 0.04], [0, 0.23, 0], { color: '#2a2726', rot: [90, 0, 0], tube: 0.18, parent: 'pot' })
      .dome([0.2, 0.06, 0.2], [0, 0.24, 0], { color: 'gold', parent: 'pot' });
    for (const [xx, z] of [[0.09, 0.05], [-0.08, 0.06], [0.0, -0.1]]) b.cyl([0.04, 0.08, 0.04], [xx, 0.035, z], { color: '#1e1b1f', taper: 0.6, parent: 'pot' });
    for (let i = 0; i < 9; i++) b.cyl([0.035, 0.006, 0.035], [Math.cos(i * 2.3) * 0.06, 0.27 + (i % 3) * 0.008, Math.sin(i * 2.3) * 0.06], { color: '#f6c445', rot: [20 * Math.sin(i), 0, 25 * Math.cos(i)], parent: 'pot', edge: 'sharp' });
    for (const [xx, z] of [[0.18, 0.08], [0.2, 0.0]]) b.cyl([0.035, 0.006, 0.035], [xx, 0.003, z], { color: '#f6c445', edge: 'sharp' });
    const rb = ['#e0473b', '#f0923b', '#f6d24a', '#5aa553', '#4e8fd6', '#8a5fc4'];
    rb.forEach((c, i) => b.arc([1.2 - i * 0.07, 1.2 - i * 0.07, 0.03], [0.25, 0.05, -0.15], { color: c, tube: 0.06, arc: 140, rot: [0, 0, -20], noInk: true }));
    return b.act({ click: [[A.par(A.effect('sparkle', { dur: 1.5 }), A.spawn('lep', 'leprechaun', { rel: 'front', of: 'self', dist: 'close' })), A.par(A.anim('dance', 1, 'lep'), A.say("Top o' the mornin'! Me lucky day!", 2.2, 'lep')), A.wait(0.5), A.remove('lep', 'pop')]] }).done();
  }),
  // Pan-fried dumplings in a bamboo steamer with a dish of soy dipping sauce. The steamer lid lifts in a cloud of
  // steam.
  e('pot sticker', 'food', 'asian dishes', () => {
    const b = m('pot sticker')
      .cyl([0.22, 0.07, 0.22], [0, 0.035, 0], { color: '#d8b07a', name: 'steamer', edge: 'sharp' })
      .torus([0.225, 0.225, 0.01], [0, 0.06, 0], { color: '#b8905a', rot: [90, 0, 0], tube: 0.06, parent: 'steamer' });
    for (const [xx, z, r] of [[-0.04, 0.03, 20], [0.05, 0.02, -30], [0.0, -0.05, 80], [-0.06, -0.04, 50]]) b.dome([0.07, 0.035, 0.04], [xx, 0.07, z], { color: '#f4ead2', rot: [0, r, 0], parent: 'steamer' }).box([0.06, 0.006, 0.006], [xx, 0.087, z], { color: '#e8dcc0', rot: [0, r, 0], parent: 'steamer', round: 0.5 });
    return b
      .cyl([0.23, 0.06, 0.23], [0, 0.1, 0], { color: '#d8b07a', name: 'lid', mover: { kind: 'slide', axis: 'y', amount: 0.25 }, edge: 'sharp' })
      .dome([0.22, 0.03, 0.22], [0, 0.145, 0], { color: '#c89a5a', parent: 'lid' })
      .cyl([0.08, 0.02, 0.08], [0.17, 0.01, 0.1], { color: 'white', edge: 'sharp' })
      .cyl([0.065, 0.006, 0.065], [0.17, 0.02, 0.1], { color: '#5a2a1a' })
      .act({ click: [[A.operate('lid', 'up'), A.par(A.effect('steam', { dur: 2 }), A.say('Fsssh!', 1.5)), A.wait(1.5), A.operate('lid', 'down')]] })
      .done();
  }),
  // A russet potato (12 cm) with little eyes; given time, a sprout pushes out of one.
  e('potato', 'food', 'vegetables', () => {
    const b = m('potato').ball([0.12, 0.07, 0.08], [0, 0.035, 0], { color: '#b8915a', name: 'spud' });
    for (const [xx, y, z] of [[0.03, 0.05, 0.035], [-0.035, 0.04, 0.035], [0.0, 0.065, -0.01], [0.05, 0.03, -0.03]]) b.ball([0.008, 0.006, 0.004], [xx, y, z], { color: '#7a5a3a', noInk: true, parent: 'spud' });
    return b
      .cyl([0.006, 0.04, 0.006], [0.0, 0.085, -0.01], { color: '#c8a0e0', name: 'sprout', scale: 0, parent: 'spud' })
      .act({ click: [[A.par(A.pose('sprout', { scale: 1, dur: 0.8 }), A.say('Sprout!', 1.2))], [A.par(A.pose('sprout', { scale: 0, dur: 0.3 }), A.anim('hop'), A.say('Plop!', 1))]] })
      .done();
  }),
  // An open bag of ridged potato chips with chips spilling out on the table. One flies out: crunch!
  e('potato chips', 'food', 'snacks', () => {
    const b = m('potato chips')
      .box([0.17, 0.22, 0.06], [0, 0.11, -0.02], { color: '#f6d24a', round: 0.9, name: 'bag' })
      .label('CHIPS', [0.1, 0.04], [0, 0.13, 0.012], { color: '#c0392b', parent: 'bag', depth: 0.004 })
      .ball([0.07, 0.06, 0.01], [0, 0.07, 0.01], { color: '#e8b070', noInk: true, parent: 'bag' })
      .box([0.17, 0.018, 0.04], [0, 0.22, -0.02], { color: '#e8c03a', round: 0.3, parent: 'bag' });
    for (const [xx, z, r] of [[0.1, 0.06, 20], [0.05, 0.1, -30], [-0.06, 0.08, 60], [0.12, 0.0, 10]]) b.ball([0.05, 0.006, 0.04], [xx, 0.006, z], { color: '#f0c060', rot: [10, r, 5] });
    return b
      .ball([0.05, 0.008, 0.04], [0.0, 0.235, -0.02], { color: '#f0c060', rot: [60, 0, 0], name: 'chip', parent: 'bag', piece: true })
      .act({ click: [[A.detach('chip', 'chip'), A.say('Crunch!', 1)], [A.reattach('chip'), A.say('Rustle.', 1)]] })
      .done();
  }),
  // A zigzag wire potato masher standing in a bowl of mash. It mashes: squish, squish!
  e('potato masher', 'kitchen', 'utensils', () => {
    const b = m('potato masher')
      .cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: '#f7f5ef', taper: 1.3, edge: 'sharp' })
      .ball([0.2, 0.04, 0.2], [0, 0.08, 0], { color: '#f6e6b0' })
      .capsule([0.035, 0.13, 0.035], [0, 0.31, 0], { color: '#e0473b', name: 'masher', pivot: [0, 0.31, 0] })
      .rod([0.04, 0.09, 0], [0.01, 0.25, 0], 0.008, 'silver', { parent: 'masher', edge: 'sharp' })
      .rod([-0.04, 0.09, 0], [-0.01, 0.25, 0], 0.008, 'silver', { parent: 'masher', edge: 'sharp' });
    for (let i = 0; i < 5; i++) b.rod([-0.04 + i * 0.02, 0.09, i % 2 ? 0.02 : -0.02], [-0.02 + i * 0.02, 0.09, i % 2 ? -0.02 : 0.02], 0.007, 'silver', { parent: 'masher', edge: 'sharp' });
    return b.act({ click: [[A.par(A.pose('masher', { move: [0, -0.04, 0], dur: 0.25, times: 2 }), A.say('Squish, squish!', 1.5))]] }).done();
  }),
  // A bowl of creamy potato salad: chunks of potato in mayonnaise with chives and a little paprika, a serving
  // spoon in it. The spoon stirs.
  e('potato salad', 'food', 'salads', () => {
    const b = m('potato salad').cyl([0.2, 0.08, 0.2], [0, 0.04, 0], { color: '#4e8fd6', taper: 1.3, edge: 'sharp' }).ball([0.21, 0.07, 0.21], [0, 0.08, 0], { color: '#f6ecc8' });
    for (let i = 0; i < 9; i++) b.box([0.03, 0.025, 0.03], [Math.cos(i * 1.9) * 0.05 * (i % 3), 0.11, Math.sin(i * 1.9) * 0.05 * (i % 3)], { color: '#f0e0a0', rot: [i * 20, i * 30, 0], round: 0.4 });
    b.each(6, (i) => b.box([0.02, 0.003, 0.003], [Math.cos(i) * 0.06, 0.12, Math.sin(i) * 0.06], { color: '#3f7a3a', rot: [0, i * 40, 0], round: 0, noInk: true }));
    return b
      .rod([0.02, 0.1, 0.0], [0.1, 0.24, -0.04], 0.012, 'silver', { name: 'spoon', pivot: [0, 0.1, 0], edge: 'sharp' })
      .act({ click: [[A.par(A.pose('spoon', { rot: [0, 360, 0], dur: 1 }), A.say('Swish, swish!', 1.2)), A.pose('spoon', { rot: [0, 0, 0], dur: 0 })]] })
      .done();
  }),
  // A witch's potion: a round glass flask of glowing purple brew with a cork, a tag on a string and bubbles
  // rising. Uncorked, it bubbles and sparkles.
  e('potion', 'fantasy', 'magic items', () =>
    m('potion')
      .ball([0.12, 0.12, 0.12], [0, 0.06, 0], { color: '#b070e0', name: 'flask', mover: { kind: 'light', on: true } })
      .cyl([0.035, 0.07, 0.035], [0, 0.14, 0], { color: '#d8c8f0', parent: 'flask' })
      .cyl([0.04, 0.03, 0.04], [0, 0.185, 0], { color: 'wood', taper: 1.2, name: 'cork', parent: 'flask', piece: true })
      .rod([0.0, 0.16, 0.02], [0.04, 0.1, 0.06], 0.003, 'tan', { parent: 'flask' })
      .box([0.04, 0.025, 0.003], [0.045, 0.09, 0.062], { color: '#f2e6cf', rot: [0, 0, -15], parent: 'flask', round: 0 })
      .ball(0.015, [-0.02, 0.09, 0.05], { color: '#e8d0ff', noInk: true, parent: 'flask' })
      .ball(0.01, [0.015, 0.05, 0.055], { color: '#e8d0ff', noInk: true, parent: 'flask' })
      .act({ click: [[A.detach('cork', 'cork'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Bubble, bubble...', 1.8))], [A.reattach('cork'), A.operate('flask'), A.say('Glug.', 1)]] })
      .done(),
  ),
  // A shallow wooden bowl of potpourri: dried rose petals, orange slices, cinnamon sticks and little pine cones.
  // A waft of sweet scent.
  e('potpourri', 'home', 'decor', () => {
    const b = m('potpourri').cyl([0.24, 0.06, 0.24], [0, 0.03, 0], { color: 'darkwood', taper: 1.35, edge: 'sharp' });
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, r = 0.02 + (i % 4) * 0.022;
      b.ball([0.03, 0.008, 0.024], [Math.cos(a) * r, 0.066 + (i % 2) * 0.004, Math.sin(a) * r], { color: ['#c0392b', '#d64fa0', '#8a2b3a', '#f6d24a'][i % 4], rot: [i * 15, a * 57, 10] });
    }
    return b
      .cyl([0.05, 0.008, 0.05], [0.04, 0.075, 0.03], { color: '#f0923b', rot: [20, 0, 10] })
      .stick([-0.06, 0.075, -0.02], [0.02, 0.08, -0.05], 0.012, '#8c5a2b')
      .ball([0.03, 0.04, 0.03], [-0.03, 0.08, 0.05], { color: '#7a5230' })
      .act({ click: [[A.par(A.effect('hearts', { dur: 1.5 }), A.say('~ sweet scent ~', 1.8))]] })
      .done();
  }),
  // A rubber plant in a glazed pot on a saucer (60 cm): glossy dark oval leaves up a stem. Its leaves stir and it
  // perks up.
  e('potted plant', 'home', 'houseplants', () => {
    const b = m('potted plant')
      .cyl([0.28, 0.025, 0.28], [0, 0.0125, 0], { color: '#c8693e', edge: 'sharp' })
      .cyl([0.22, 0.22, 0.22], [0, 0.135, 0], { color: '#e8e4dc', taper: 1.2, edge: 'sharp' })
      .ball([0.24, 0.04, 0.24], [0, 0.24, 0], { color: 'dirt' })
      .stick([0, 0.24, 0], [0.02, 0.6, 0], 0.025, '#5a6a3a', { name: 'top', pivot: [0, 0.24, 0] });
    for (let i = 0; i < 8; i++) spoke(b, [0.01, 0.3 + i * 0.04, 0], i * 137 % 360, 25 - i * 2, 0.14, 0.012, 0.08, i % 2 ? '#2f6a32' : '#3f7a3a', { parent: 'top' });
    return b.ball([0.05, 0.08, 0.02], [0.02, 0.63, 0], { color: '#8a2b3a', parent: 'top' }).act({ click: [[A.par(A.pose('top', { rot: [0, 0, 6], dur: 0.4, times: 2 }), A.say('Rustle...', 1.2)), A.pose('top', { scale: 1.1, dur: 0.4 }), A.pose('top', { scale: 1, dur: 0.4 })]] }).done();
  }),
  // Pottery: a potter's wheel at real size (wheel head at 0.53 m) on four legs, with its cream splash pan, a wet
  // clay pot taking shape on the turning head, a sponge, the foot pedal, and the potter's stool behind it (a seat
  // at 0.45 m); finished pots on the floor beside it: a tall teal-glazed vase, a terracotta bowl and a little
  // cream jug. The wheel spins and the pot grows taller.
  e('pottery', 'home', 'decor', () => {
    const b = m('pottery', { edge: 'sharp' }), clay = '#b8703f';
    b.box([0.48, 0.16, 0.56], [0, 0.34, 0], { color: '#9da3a8', round: 0.15 })
      .pair((s) => b.cyl([0.04, 0.27, 0.04], [s * 0.19, 0.135, 0.2], { color: '#4a4f55' }).cyl([0.04, 0.27, 0.04], [s * 0.19, 0.135, -0.2], { color: '#4a4f55' }))
      .cyl([0.6, 0.1, 0.6], [0, 0.47, 0], { color: '#ece6d8', taper: 1.08, round: 0.2 })
      .cyl([0.56, 0.006, 0.56], [0, 0.521, 0], { color: '#8a7a68', noInk: true })
      .cyl([0.32, 0.03, 0.32], [0, 0.535, 0], { color: '#7a7f85', name: 'wheel', mover: { kind: 'spin', axis: 'y', amount: 360 } })
      .ball([0.17, 0.15, 0.17], [0, 0.615, 0], { color: clay, name: 'clay', parent: 'wheel', pivot: [0, 0.55, 0], edge: 'soft' })
      .cyl([0.1, 0.07, 0.1], [0, 0.705, 0], { color: clay, taper: 1.15, parent: 'clay', edge: 'soft' })
      .cyl([0.075, 0.004, 0.075], [0, 0.741, 0], { color: '#7a4424', parent: 'clay', noInk: true })
      .box([0.1, 0.04, 0.07], [0.19, 0.44, 0.245], { color: '#f6d24a', round: 0.5, edge: 'soft' })
      .box([0.12, 0.04, 0.2], [0.45, 0.03, 0.12], { color: '#3a3f44', rot: [8, 0, 0], round: 0.3 })
      .rod([0.45, 0.03, 0.02], [0.24, 0.3, -0.05], 0.012, '#2a2726', { edge: 'soft' })
      .cyl([0.36, 0.05, 0.36], [0, 0.45, -0.58], { color: 'wood', round: 0.3 });
    b.each(3, (i) => {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      b.stick([Math.cos(a) * 0.1, 0.43, -0.58 + Math.sin(a) * 0.1], [Math.cos(a) * 0.16, 0, -0.58 + Math.sin(a) * 0.16], 0.035, 'darkwood');
    });
    b.ball([0.2, 0.24, 0.2], [0.68, 0.14, 0.18], { color: '#2f8f88', edge: 'soft' })
      .cyl([0.08, 0.16, 0.08], [0.68, 0.32, 0.18], { color: '#2f8f88', taper: 0.85, edge: 'soft' })
      .torus([0.1, 0.1, 0.02], [0.68, 0.4, 0.18], { color: '#2f8f88', rot: [90, 0, 0], tube: 0.25, edge: 'soft' })
      .cyl([0.24, 0.09, 0.24], [-0.62, 0.045, 0.2], { color: '#c0643a', taper: 1.35, edge: 'soft' })
      .cyl([0.2, 0.004, 0.2], [-0.62, 0.091, 0.2], { color: '#7a3a1e', noInk: true })
      .cyl([0.11, 0.14, 0.11], [-0.66, 0.07, -0.1], { color: '#efe6cf', taper: 0.8, edge: 'soft' })
      .arc([0.07, 0.08, 0.015], [-0.705, 0.08, -0.1], { color: '#efe6cf', rot: [0, 0, 90], tube: 0.25, arc: 200, edge: 'soft' })
      .socket('seat', [0, 0.475, -0.58], 'seat');
    return b.act({ click: [[A.par(A.operate('wheel', 'on'), A.pose('clay', { scale: 1.3, dur: 1.5 }), A.say('Whirr...', 1.5)), A.wait(1), A.par(A.operate('wheel', 'off'), A.pose('clay', { scale: 1, dur: 0.5 }))]] }).done();
  }),
  // A speedboat (6.5 m): a deep-V white hull with a red stripe, a wraparound windscreen, two bucket seats and a
  // bench in the open cockpit, a steering wheel, and a big outboard motor whose propeller spins. Vroom!
  e('power boat', 'garage', 'boats', () => {
    const prof: Array<[number, number, number, number?]> = [[0, 0.95, 0.85, 0.04], [0.2, 1, 0.95, 0.02], [0.6, 0.95, 1, 0], [0.85, 0.65, 1, 0.04], [1, 0.08, 0.7, 0.12]];
    const b = m('power boat', { view: 'side', edge: 'sharp' })
      .loft([2.4, 1.8, 6.5], [0, 1.1, 0], prof, { color: 'white', cut: 'bottom', boxy: 0.25, name: 'hull', edge: 'soft' })
      .loft([2.45, 0.25, 6.0], [0, 0.75, -0.1], prof.map(([t, w]) => [t, Math.min(1, w * 1.02), 1, 0] as [number, number, number, number]), { color: '#e0473b', boxy: 0.4, parent: 'hull', noInk: true, edge: 'soft' })
      .loft([2.2, 0.1, 6.2], [0, 1.12, 0], prof.map(([t, w]) => [t, w * 0.97, 1, 0] as [number, number, number, number]), { color: '#d8dcdf', boxy: 0.9, parent: 'hull' });
    b.box([2.0, 0.5, 2.6], [0, 0.95, -0.9], { color: '#5c6166', parent: 'hull', round: 0.1 })
      .box([1.9, 0.5, 0.08], [0, 1.4, 0.75], { color: '#bfe3f5', rot: [-30, 0, 0], parent: 'hull', round: 0.1 })
      .box([0.6, 0.5, 0.08], [0.95, 1.38, 0.5], { color: '#bfe3f5', rot: [-20, 60, 0], parent: 'hull', round: 0.1 })
      .box([0.6, 0.5, 0.08], [-0.95, 1.38, 0.5], { color: '#bfe3f5', rot: [-20, -60, 0], parent: 'hull', round: 0.1 })
      .box([0.7, 0.5, 0.4], [0, 1.4, 0.5], { color: '#2a2726', parent: 'hull', round: 0.2 })
      .torus([0.36, 0.36, 0.05], [0.4, 1.6, 0.25], { color: '#2a2726', rot: [-60, 0, 0], tube: 0.18, parent: 'hull' });
    for (const s of [1, -1]) b.box([0.55, 0.15, 0.55], [s * 0.45, 1.27, -0.3], { color: '#f2eee4', parent: 'hull', round: 0.4, edge: 'soft' }).box([0.55, 0.6, 0.12], [s * 0.45, 1.55, -0.6], { color: '#f2eee4', parent: 'hull', round: 0.4, edge: 'soft', rot: [-10, 0, 0] });
    b.box([1.9, 0.18, 0.6], [0, 1.27, -1.7], { color: '#f2eee4', parent: 'hull', round: 0.4, edge: 'soft' }).box([1.9, 0.5, 0.12], [0, 1.5, -2.0], { color: '#f2eee4', parent: 'hull', round: 0.4, edge: 'soft' });
    b.box([0.5, 0.9, 0.6], [0, 1.45, -3.45], { color: '#2a2726', parent: 'hull', round: 0.3, name: 'motor' })
      .box([0.2, 1.1, 0.3], [0, 0.6, -3.55], { color: '#5c6166', parent: 'motor' })
      .cyl([0.4, 0.08, 0.4], [0, 0.25, -3.75], { color: '#9da3a8', rot: [90, 0, 0], name: 'propeller', parent: 'motor', mover: { kind: 'spin', axis: 'z', amount: 900 } })
      .label('SPEED', [0.4, 0.15], [0, 1.6, -3.14], { color: '#2a2726', parent: 'motor', depth: 0.01 })
      .socket('seat', [0.45, 1.35, -0.3], 'seat');
    return b
      .act({ click: [[A.par(A.operate('propeller', 'on'), A.effect('water_spray', { dur: 2 }), A.anim('wobble'), A.say('VROOOOM!', 2)), A.wait(2), A.operate('propeller', 'off')]] })
      .done();
  }),
  // Power lines: two 10.5 m creosoted wooden poles 22 m apart. Each has a crossarm ACROSS the line (along z) on
  // two steel braces, green glass insulators on the arm ends and a pole-top pin, so the three conductors run side
  // by side and sag between the poles; a lower phone cable on a bracket, lineman's steps, a pole-top transformer
  // can with its drop wires, and a cobra-head street light. The wires hum; a pigeon lands on them; the lamp lights.
  e('power lines', 'places', 'street things', () => {
    const b = m('power lines', { edge: 'sharp' });
    const half = 11, P = '#6b4f35', G = '#8f99a3', arm = 9.6;
    /** A wire sagging from (-half, y0, z) to (half, y0, z), `sag` lower in the middle, as short straight runs. */
    const wire = (y0: number, z: number, sag: number, t: number, c = '#2a2726') => {
      const yAt = (x: number) => y0 - sag * (1 - (x / half) ** 2);
      for (let i = 0; i < 10; i++) {
        const x0 = -half + (i * 2 * half) / 10, x1 = -half + ((i + 1) * 2 * half) / 10;
        b.stick([x0, yAt(x0), z], [x1, yAt(x1), z], t, c);
      }
    };
    for (const s of [1, -1]) {
      const xx = s * half;
      b.cyl([0.3, 10.5, 0.3], [xx, 5.25, 0], { color: P, taper: 0.78 })
        .cyl([0.25, 0.06, 0.25], [xx, 10.53, 0], { color: '#3a3633' })
        .box([0.13, 0.14, 2.7], [xx, arm, 0], { color: P, round: 0.15 });
      b.pair((k) => void b.stick([xx, arm - 0.75, 0.12 * k], [xx, arm - 0.07, k * 0.95], 0.05, G));
      // insulators: a steel pin and a ribbed glass bell on each arm end, one on the pole top
      for (const [y, z] of [[arm + 0.07, -1.2], [arm + 0.07, 1.2], [10.56, 0]] as const) {
        b.stick([xx, y, z], [xx, y + 0.14, z], 0.035, G)
          .cyl([0.17, 0.2, 0.17], [xx, y + 0.22, z], { color: '#6fbf96', taper: 0.55, edge: 'soft' })
          .cyl([0.2, 0.035, 0.2], [xx, y + 0.13, z], { color: '#6fbf96', edge: 'soft' });
      }
      // the phone cable's bracket and the lineman's steps
      b.stick([xx, 7.2, 0], [xx, 7.2, 0.55], 0.05, G);
      b.each(8, (i) => b.box([0.28, 0.035, 0.035], [xx + (i % 2 ? 0.18 : -0.18), 2.6 + i * 0.5, 0], { color: G, round: 0.2 }));
    }
    // three conductors side by side, the phone cable lower and fatter
    wire(arm + 0.36, -1.2, 0.85, 0.03);
    wire(arm + 0.36, 1.2, 0.85, 0.03);
    wire(10.85, 0, 0.85, 0.03);
    wire(7.2, 0.55, 0.7, 0.06, '#1e1e1e');
    // a transformer can on a bracket on the left pole, its bushings dropped to the front conductor by a fuse
    const tx = -half;
    b.box([0.12, 0.6, 0.12], [tx, 7.75, 0.22], { color: G })
      .cyl([0.62, 1.05, 0.62], [tx, 7.75, 0.6], { color: '#9da3a8', segs: 16 })
      .cyl([0.66, 0.08, 0.66], [tx, 8.3, 0.6], { color: '#7f878f', segs: 16 })
      .cyl([0.1, 0.22, 0.1], [tx - 0.15, 8.45, 0.6], { color: '#6b7078' })
      .cyl([0.1, 0.22, 0.1], [tx + 0.15, 8.45, 0.6], { color: '#6b7078' })
      .label('25 kVA', [0.32, 0.1], [tx, 7.75, 0.92], { color: '#7f878f', depth: 0.01 })
      .stick([tx + 0.15, 8.56, 0.6], [tx + 0.05, 9.95, 1.2], 0.02, '#2a2726')
      .cyl([0.05, 0.3, 0.05], [tx + 0.08, 9.4, 1.0], { color: '#c8c2b4', rot: [-20, 0, 0] });
    // a cobra-head street light on the right pole
    const lx = half;
    b.rod([lx, 7.6, 0.12], [lx, 8.1, 1.5], 0.07, G)
      .box([0.32, 0.14, 0.62], [lx, 8.12, 1.75], { color: '#5c6166', round: 0.4 })
      .box([0.24, 0.04, 0.42], [lx, 8.04, 1.78], { color: '#fff3c0', glow: true, name: 'lamp', mover: { kind: 'light', on: false } });
    return b
      .socket('wire', [0, arm + 0.36 - 0.85 + 0.02, 1.2], 'top', { size: 0.4 })
      .act({
        click: [
          [A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Bzzzzzz...', 1.8))],
          [A.spawn('bird', 'pigeon', { rel: 'above', of: 'self', dist: 'close' }), A.attach('bird', 'self', 'wire'), A.say('Coo!', 1.2, 'bird'), A.wait(1.5), A.remove('bird', 'fly_away')],
          [A.operate('lamp', 'on'), A.say('Hummm...', 1.5), A.wait(2), A.operate('lamp', 'off')],
        ],
      })
      .done();
  }),
  // A power station: two waisted cooling towers (30 m), a turbine hall with tall windows, a 45 m chimney banded
  // red and white with a warning light, and a switchyard of transformers and a pylon. Steam billows from the
  // towers; smoke rises from the chimney.
  e('power plant', 'places', 'industry', () => {
    const b = m('power plant', { edge: 'sharp' }).box([60, 0.2, 40], [0, 0.1, 0], { color: '#a7a39b', round: 0.01 });
    for (const xx of [-16, 4]) {
      b.cyl([20, 16, 20], [xx, 8.2, -8], { color: '#d4d0c8', taper: 0.62, edge: 'soft' })
        .cyl([12.4, 14, 12.4], [xx, 23.2, -8], { color: '#d4d0c8', taper: 1.25, edge: 'soft' })
        .torus([15.6, 15.6, 0.6], [xx, 30.1, -8], { color: '#c4c0b8', rot: [90, 0, 0], tube: 0.06, edge: 'soft' })
        .cyl([20.6, 1.6, 20.6], [xx, 1.0, -8], { color: '#9da3a8' });
    }
    // turbine hall
    b.box([24, 14, 12], [8, 7.2, 10], { color: '#b9c2ca', round: 0.01 })
      .box([24.6, 0.6, 12.6], [8, 14.4, 10], { color: '#8f99a3', round: 0.05 });
    b.each(6, (i) => b.box([2.2, 8, 0.1], [-2 + i * 4, 7, 16.05], { color: '#8fc6e6', round: 0.05 }));
    b.box([4, 5, 0.12], [-5.5, 2.7, 16.05], { color: '#5c6166', name: 'door', pivot: [-7.5, 2.7, 16.05], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .label('POWER STATION', [10, 1.2], [8, 12.5, 16.1], { color: '#2f4f8f', depth: 0.1 });
    // chimney
    b.cyl([4, 44, 4], [24, 22.2, -6], { color: '#d4d0c8', taper: 0.65, edge: 'soft' });
    b.each(3, (i) => b.cyl([3.2 - i * 0.35, 2.2, 3.2 - i * 0.35], [24, 30 + i * 6, -6], { color: '#e0473b', taper: 0.97, edge: 'soft' }));
    b.ball(0.8, [24, 44.6, -6], { color: '#ff4040', name: 'beacon', mover: { kind: 'light', on: true } });
    // switchyard
    for (const xx of [-20, -14]) b.box([3, 3, 2.4], [xx, 1.7, 14], { color: '#7a7f85', round: 0.1 }).cyl([0.4, 1.2, 0.4], [xx, 3.8, 14], { color: '#7fc8a0' });
    for (const [px, pz] of [[-27, 10], [-25, 10], [-27, 13], [-25, 13]]) b.rod([px, 0.2, pz], [-26, 16, 11.5], 0.25, '#7a7f85');
    b.box([8, 0.25, 0.25], [-26, 13, 11.5], { color: '#7a7f85' });
    return b
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 3 }), A.say('Hummmmm...', 2))],
          [A.par(A.effect('smoke', { dur: 2.5 }), A.operate('beacon'), A.say('Chug chug chug...', 2)), A.wait(1), A.operate('beacon')],
        ],
      })
      .done();
  }),
  // A pair of quilted oven mitts (30 cm) with checked cuffs and hanging loops. They clap together: "hot hot!"
  e('oven mitts', 'kitchen', 'kitchen supplies', () => {
    const b = m('oven mitts');
    for (const s of [1, -1]) {
      const nm = s > 0 ? 'mittL' : 'mittR', xx = s * 0.09;
      b.box([0.14, 0.24, 0.05], [xx, 0.17, 0], { color: '#c0392b', round: 0.7, name: nm, pivot: [xx, 0.05, 0] })
        .box([0.06, 0.1, 0.045], [xx + s * 0.065, 0.16, 0.0], { color: '#c0392b', rot: [0, 0, s * -30], round: 0.8, parent: nm })
        .box([0.15, 0.07, 0.055], [xx, 0.035, 0], { color: '#f7f5ef', round: 0.4, parent: nm })
        .torus([0.03, 0.03, 0.006], [xx, 0.3, 0], { color: '#f7f5ef', tube: 0.2, parent: nm });
      b.each(3, (i) => b.box([0.12, 0.004, 0.003], [xx, 0.13 + i * 0.05, 0.026], { color: '#a3322a', parent: nm, noInk: true, round: 0 }));
    }
    return b.act({ click: [[A.par(A.pose('mittL', { rot: [0, 0, 15], dur: 0.15, times: 2 }), A.pose('mittR', { rot: [0, 0, -15], dur: 0.15, times: 2 }), A.say('Pat pat pat!', 1.5))]] }).done();
  }),
  // A computer power supply (15 x 8.6 x 14 cm): a black steel box with a fan grille on top, a switch and a socket
  // at the back, and a bundle of coloured cables. Click: the fan spins up.
  e('power supply', 'tech', 'computer parts', () => {
    const b = m('power supply', { edge: 'sharp' })
      .box([0.15, 0.086, 0.14], [0, 0.043, 0], { color: '#2a2726', round: 0.08 })
      .cyl([0.12, 0.004, 0.12], [0, 0.088, 0], { color: '#5c6166' })
      .cyl([0.11, 0.004, 0.11], [0, 0.091, 0], { color: '#3a3633', name: 'fan', mover: { kind: 'spin', axis: 'y', amount: 900 } });
    b.each(4, (i) => b.box([0.1, 0.002, 0.014], [0, 0.0935, 0], { color: '#5c6166', rot: [0, i * 45, 0], parent: 'fan', round: 0 }));
    b.label('500W', [0.06, 0.025], [-0.035, 0.045, 0.071], { color: '#9da3a8', depth: 0.002 })
      .box([0.02, 0.012, 0.006], [0.05, 0.06, -0.072], { color: '#2a2726', name: 'switch', round: 0.3 })
      .box([0.035, 0.025, 0.006], [0.0, 0.04, -0.072], { color: '#5c6166', round: 0.1 });
    ['#e0473b', '#f6d24a', '#2a2726', '#e0473b', '#f6d24a'].forEach((c, i) => b.rod([0.06, 0.03 + i * 0.006, 0.07], [0.09 + i * 0.01, 0.006, 0.14 + i * 0.01], 0.006, c, { edge: 'soft' }));
    return b.act({ click: [[A.par(A.pose('switch', { rot: [0, 0, 20], dur: 0.1 }), A.say('Click... whirrr!', 1.5), A.operate('fan', 'on')), A.wait(2), A.par(A.operate('fan', 'off'), A.pose('switch', { rot: [0, 0, 0], dur: 0.1 }))]] }).done();
  }),
  // A soft pretzel (15 cm): a glossy brown loop twisted into its knot, scattered with coarse salt. It twists.
  e('pretzel', 'food', 'bakery', () => {
    const b = m('pretzel', { edge: 'soft' })
      .torus([0.075, 0.075, 0.028], [-0.03, 0.08, 0], { color: '#8a4a1e', tube: 0.3, rot: [0, 0, 30], name: 'knot', pivot: [0, 0.06, 0] })
      .torus([0.075, 0.075, 0.028], [0.03, 0.08, 0], { color: '#8a4a1e', tube: 0.3, rot: [0, 0, -30], parent: 'knot' })
      .rod([-0.05, 0.035, 0.0], [0.03, 0.1, 0.012], 0.028, '#9a5a2a', { parent: 'knot' })
      .rod([0.05, 0.035, 0.0], [-0.03, 0.1, 0.012], 0.028, '#9a5a2a', { parent: 'knot' })
      .box([0.12, 0.01, 0.06], [0, 0.005, 0], { color: '#d8b07a', round: 0.5 });
    for (const [xx, y] of [[-0.06, 0.1], [0.05, 0.11], [0.0, 0.07], [-0.03, 0.04], [0.065, 0.06]]) b.box([0.008, 0.008, 0.008], [xx, y, 0.016], { color: 'white', rot: [30, 40, 0], parent: 'knot', edge: 'sharp', round: 0.2 });
    return b.act({ click: [[A.par(A.pose('knot', { rot: [0, 360, 0], dur: 0.8 }), A.say('Twist!', 1)), A.pose('knot', { rot: [0, 0, 0], dur: 0 })]] }).done();
  }),
  // A desktop printer (45 x 35 cm): a stack of paper in the feeder at the back, an output tray, a control panel
  // with a ready light. A page whirrs out and goes back for the next.
  e('printer', 'tech', 'office machines', () =>
    m('printer', { edge: 'sharp' })
      .box([0.45, 0.2, 0.35], [0, 0.1, 0], { color: '#e8e4dc', round: 0.15 })
      .box([0.43, 0.04, 0.3], [0, 0.22, -0.02], { color: '#d4d0c8', round: 0.3 })
      .box([0.24, 0.003, 0.3], [0, 0.29, -0.2], { color: 'paper', rot: [-60, 0, 0], round: 0 })
      .box([0.3, 0.15, 0.03], [0, 0.26, -0.22], { color: '#5c6166', rot: [-60, 0, 0], round: 0.2 })
      .box([0.32, 0.02, 0.18], [0, 0.07, 0.24], { color: '#5c6166', round: 0.3 })
      .box([0.21, 0.003, 0.25], [0, 0.11, 0.08], { color: 'paper', name: 'page', mover: { kind: 'slide', axis: 'z', amount: 0.18 }, round: 0 })
      .box([0.12, 0.004, 0.06], [0, 0.112, 0.06], { color: '#4e8fd6', parent: 'page', round: 0, noInk: true })
      .box([0.1, 0.04, 0.05], [0.15, 0.21, 0.13], { color: '#3a3633', rot: [-30, 0, 0], round: 0.3 })
      .ball(0.012, [0.12, 0.225, 0.15], { color: '#5ad06a', name: 'ready', mover: { kind: 'light', on: true } })
      .act({ click: [[A.par(A.say('Whirr... chk chk chk...', 2), A.operate('ready', 'off')), A.operate('page', 'out'), A.par(A.operate('ready', 'on'), A.say('Ding!', 1)), A.wait(1.5), A.operate('page', 'in')]] })
      .done(),
  ),
  // A wooden hand printing press (2 m): two heavy uprights and crossbeams, a big iron screw turned by a long bar,
  // a platen that presses down on the bed where the paper lies on the inked type. Thunk: a printed page.
  e('printing press', 'tech', 'machines', () => {
    const b = m('printing press', { edge: 'sharp' });
    for (const s of [1, -1]) b.box([0.2, 2.0, 0.25], [s * 0.6, 1.0, 0], { color: '#6b4226', round: 0.1 }).box([0.25, 0.15, 1.2], [s * 0.6, 0.075, 0], { color: '#5a3a22', round: 0.1 });
    b.box([1.5, 0.25, 0.3], [0, 2.05, 0], { color: '#6b4226', round: 0.1 })
      .box([1.4, 0.2, 0.3], [0, 1.45, 0], { color: '#6b4226', round: 0.1 })
      .box([1.1, 0.1, 1.4], [0, 0.85, 0.1], { color: '#7a5230', round: 0.1 })
      .box([0.7, 0.05, 0.55], [0, 0.92, 0.1], { color: '#2a2726', round: 0.1 })
      .box([0.62, 0.006, 0.48], [0, 0.948, 0.1], { color: 'paper', round: 0 })
      .label('NEWS', [0.4, 0.14], [0, 0.955, 0.1], { color: 'paper', rot: [-90, 0, 0], depth: 0.002 });
    for (const [xx, z] of [[0.45, 0.7], [-0.45, 0.7], [0.45, -0.5], [-0.45, -0.5]]) b.box([0.1, 0.8, 0.1], [xx, 0.4, z], { color: '#5a3a22' });
    b.cyl([0.12, 0.5, 0.12], [0, 1.68, 0], { color: '#5c6166', name: 'screw', mover: { kind: 'spin', axis: 'y', amount: 300 } })
      .rod([0, 1.6, 0], [0.75, 1.75, 0.2], 0.05, '#3a3633', { parent: 'screw' })
      .box([0.7, 0.12, 0.55], [0, 1.25, 0.1], { color: '#8a6a4a', name: 'platen', mover: { kind: 'slide', axis: 'y', amount: -0.25 }, round: 0.1 });
    return b
      .act({ click: [[A.par(A.operate('screw', 'on'), A.operate('platen', 'down'), A.say('Creak...', 1)), A.par(A.operate('screw', 'off'), A.say('THUNK!', 1)), A.par(A.operate('platen', 'up'), A.say('Ka-chunk!', 1.2))]] })
      .done();
  }),
  // A prison (26 x 20 m): a 6 m perimeter wall topped with coils of barbed wire, a barred gate that slides
  // open, a three-storey cell block with rows of barred windows, and a watchtower whose searchlight sweeps.
  e('prison', 'places', 'civic buildings', () => {
    const W = 26, D = 20, h = 6;
    const b = m('prison', { edge: 'sharp' }).box([W + 2, 0.15, D + 2], [0, 0.075, 0], { color: '#8f8a82' });
    b.box([W, h, 0.6], [0, h / 2, -D / 2], { color: '#9da3a8', round: 0.02 })
      .box([0.6, h, D], [W / 2, h / 2, 0], { color: '#9da3a8', round: 0.02 })
      .box([0.6, h, D], [-W / 2, h / 2, 0], { color: '#9da3a8', round: 0.02 })
      .box([(W - 6) / 2, h, 0.6], [-(W + 6) / 4, h / 2, D / 2], { color: '#9da3a8', round: 0.02 })
      .box([(W - 6) / 2, h, 0.6], [(W + 6) / 4, h / 2, D / 2], { color: '#9da3a8', round: 0.02 });
    for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, W / 2, -D / 2], [-W / 2, -D / 2, -W / 2, D / 2], [W / 2, -D / 2, W / 2, D / 2], [-W / 2, D / 2, -3, D / 2], [3, D / 2, W / 2, D / 2]])
      b.stick([x0, h + 0.4, z0], [x1, h + 0.4, z1], 0.7, '#7a7f85', { segs: 6 });
    b.box([4, 4.2, 0.4], [4, 2.25, D / 2 + 0.3], { color: '#7a7f85', round: 0.05 })
      .box([6.2, 0.6, 0.8], [0, 4.7, D / 2], { color: '#7a7f85', round: 0.05 })
      .label('STATE PRISON', [5, 0.5], [0, 4.7, D / 2 + 0.42], { color: '#2a2726', depth: 0.04 })
      .box([5.6, 4.2, 0.15], [0, 2.25, D / 2 + 0.6], { color: '#5c6166', name: 'gate', mover: { kind: 'slide', axis: 'x', amount: 5.8 }, round: 0.05 });
    b.each(11, (i) => b.box([0.1, 4.1, 0.12], [-2.5 + i * 0.5, 2.25, D / 2 + 0.7], { color: '#3a3633', parent: 'gate', round: 0.2 }));
    // the cell block
    b.box([18, 9.6, 8], [0, 4.95, -3], { color: '#b9b5ad', round: 0.01 }).box([18.4, 0.4, 8.4], [0, 9.9, -3], { color: '#8f8a82' });
    for (let f = 0; f < 3; f++)
      for (let c = 0; c < 8; c++) {
        const xx = -7.7 + c * 2.2, y = 2.0 + f * 3.0;
        b.box([0.9, 1.0, 0.08], [xx, y, 1.04], { color: '#2a2726', round: 0.05 });
        b.each(3, (i) => b.box([0.05, 1.0, 0.06], [xx - 0.25 + i * 0.25, y, 1.1], { color: '#9da3a8', round: 0.2 }));
      }
    // watchtower with a sweeping searchlight
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.stick([W / 2 - 1.5 + dx * 1.0, 0, D / 2 - 1.5 + dz * 1.0], [W / 2 - 1.5 + dx * 1.0, 9, D / 2 - 1.5 + dz * 1.0], 0.3, '#7a7f85');
    b.box([3.2, 2.4, 3.2], [W / 2 - 1.5, 10.2, D / 2 - 1.5], { color: '#b9b5ad', round: 0.05 })
      .box([3.0, 1.0, 0.1], [W / 2 - 1.5, 10.6, D / 2 + 0.11], { color: '#8fc6e6' })
      .pyramid([3.6 * Math.SQRT2, 1.4, 3.6 * Math.SQRT2], [W / 2 - 1.5, 12.1, D / 2 - 1.5], 4, { color: '#5c6166' })
      .cyl([0.8, 0.8, 0.8], [W / 2 - 1.5, 11.8, D / 2 + 0.6], { color: '#5c6166', rot: [70, 0, 0], name: 'search', pivot: [W / 2 - 1.5, 11.8, D / 2 + 0.3] })
      .cyl([0.7, 0.05, 0.7], [W / 2 - 1.5, 11.65, D / 2 + 1.0], { color: '#fff6c8', rot: [70, 0, 0], name: 'beam', parent: 'search', mover: { kind: 'light' } });
    return b
      .act({
        click: [
          [A.par(A.operate('beam', 'on'), A.say('Wee-ooo! Wee-ooo!', 2)), A.pose('search', { rot: [0, 50, 0], dur: 1 }), A.pose('search', { rot: [0, -50, 0], dur: 1.5 }), A.pose('search', { rot: [0, 0, 0], dur: 0.8 }), A.operate('beam', 'off')],
          [A.operate('gate', 'open'), A.say('Clank... clank...', 1.5), A.wait(2), A.operate('gate', 'close'), A.say('CLANG!', 1)],
        ],
      })
      .done();
  }),
  // An inmate's orange jumpsuit with a number on it, worn by someone who protests their innocence.
  e('prison uniform', 'wardrobe', 'uniforms', () =>
    withAct(who('prison uniform', { top: '#f0923b', bottom: '#f0923b', shoes: 'white', long: true, acc: [wear('badge', 'white')] }), {
      click: [[says('shake_head', "I didn't do it!")], [says('shrug', 'It was like that when I got here!')]],
    }),
  ),
  // A data projector (30 cm): a grey box with a lens, focus ring, vents and a ready light. It switches on and
  // throws a cone of light from its lens.
  e('projector', 'tech', 'audio video', () =>
    m('projector', { edge: 'sharp' })
      .box([0.3, 0.1, 0.24], [0, 0.07, 0], { color: '#7a7f85', round: 0.3 })
      .cyl([0.04, 0.02, 0.04], [0.1, 0.01, 0.08], { color: '#2a2726' }).cyl([0.04, 0.02, 0.04], [-0.1, 0.01, 0.08], { color: '#2a2726' })
      .cyl([0.08, 0.05, 0.08], [0.07, 0.07, 0.13], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([0.06, 0.01, 0.06], [0.07, 0.07, 0.156], { color: '#a8d8f5', rot: [90, 0, 0], name: 'lens', mover: { kind: 'light' } })
      .cone([1.2, 2.0, 0.9], [0.07, 0.25, 1.15], { color: '#fff6c8', rot: [-95, 0, 0], name: 'beam', scale: 0, noInk: true, edge: 'soft' })
      .box([0.12, 0.05, 0.004], [-0.06, 0.07, 0.121], { color: '#5c6166', round: 0, noInk: true })
      .ball(0.012, [-0.1, 0.12, 0.08], { color: '#5ad06a' })
      .act({ click: [[A.par(A.operate('lens', 'on'), A.pose('beam', { scale: 1, dur: 0.4 }), A.say('Click... whirr.', 1.5))], [A.par(A.operate('lens', 'off'), A.pose('beam', { scale: 0, dur: 0.3 }), A.say('Click.', 1))]] })
      .done(),
  ),
  // A tripod projection screen (2 m): a white screen with a black border pulled up from its case on a pole, on
  // three splayed legs. It rolls down into its case and pulls back up, with a picture shown on it.
  e('projector screen', 'tech', 'audio video', () => {
    const b = m('projector screen', { edge: 'sharp' })
      .stick([0, 0.3, 0], [0, 2.3, 0], 0.04, '#2a2726')
      .box([1.6, 0.1, 0.1], [0, 0.85, 0.06], { color: '#2a2726', round: 0.3 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      b.rod([0, 0.35, 0], [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], 0.03, '#2a2726');
    }
    return b
      .box([1.5, 1.2, 0.02], [0, 1.5, 0.08], { color: '#f7f5ef', name: 'screen', round: 0, pivot: [0, 0.9, 0.08] })
      .box([1.5, 0.04, 0.025], [0, 2.1, 0.08], { color: '#2a2726', parent: 'screen', round: 0.3 })
      .box([1.2, 0.85, 0.005], [0, 1.52, 0.092], { color: '#a8d8f5', name: 'picture', parent: 'screen', mover: { kind: 'light' }, round: 0 })
      .ball([0.6, 0.3, 0.004], [0.1, 1.25, 0.096], { color: '#5aa553', parent: 'picture', noInk: true })
      .ball(0.16, [-0.35, 1.75, 0.096], { color: '#f6d24a', parent: 'picture', noInk: true })
      .stick([0, 2.1, 0.08], [0, 2.3, 0.02], 0.02, '#2a2726', { parent: 'screen' })
      .act({ click: [[A.operate('picture', 'on'), A.say('Click!', 1.2)], [A.operate('picture', 'off'), A.pose('screen', { scale: 0.1, dur: 0.6 }), A.say('Zzzip!', 1), A.pose('screen', { scale: 1, dur: 0.6 })]] })
      .done();
  }),
  // A 100 lb propane cylinder (1.2 m): a white steel tank with domed ends, a protective collar round the valve
  // and its handwheel, a foot ring and a red label. The valve opens with a hiss.
  e('propane tank', 'workshop', 'drums and tanks', () =>
    m('propane tank', { edge: 'sharp' })
      .cyl([0.4, 0.06, 0.4], [0, 0.03, 0], { color: '#9da3a8' })
      .cyl([0.37, 0.85, 0.37], [0, 0.5, 0], { color: '#f7f5ef', edge: 'soft' })
      .dome([0.37, 0.16, 0.37], [0, 1.005, 0], { color: '#f7f5ef', edge: 'soft' })
      .cyl([0.26, 0.16, 0.26], [0, 1.12, 0], { color: '#f7f5ef' })
      .box([0.12, 0.08, 0.27], [0, 1.18, 0], { color: '#f7f5ef', round: 0.3 })
      .cyl([0.06, 0.08, 0.06], [0, 1.12, 0], { color: 'brass' })
      .torus([0.1, 0.1, 0.02], [0, 1.18, 0], { color: '#e0473b', rot: [90, 0, 0], name: 'valve', tube: 0.2 })
      .label('PROPANE', [0.22, 0.08], [0, 0.6, 0.186], { color: '#e0473b', depth: 0.004 })
      .label('FLAMMABLE', [0.18, 0.04], [0, 0.5, 0.186], { color: '#f7f5ef', depth: 0.003 })
      .act({ click: [[A.pose('valve', { rot: [0, 270, 0], dur: 0.6 }), A.par(A.effect('smoke', { dur: 1.2 }), A.say('Hisssss...', 1.5)), A.pose('valve', { rot: [0, 0, 0], dur: 0.6 })]] })
      .done(),
  ),
  // An aircraft propeller (2 m) on a display stand: three twisted, varnished wooden blades with brass-tipped
  // edges round a polished spinner. It spins up: whoom!
  e('propeller', 'garage', 'aircraft parts', () => {
    const b = m('propeller', { edge: 'sharp' })
      .box([0.6, 0.1, 0.6], [0, 0.05, 0], { color: '#3a3633', round: 0.2 })
      .stick([0, 0.1, -0.1], [0, 1.2, -0.1], 0.12, '#5c6166')
      .cone([0.36, 0.4, 0.36], [0, 1.3, 0.22], { color: 'silver', rot: [90, 0, 0], name: 'prop', mover: { kind: 'spin', axis: 'z', amount: 900 }, pivot: [0, 1.3, 0.1] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 360 + 90, r = rad(a);
      b.box([0.16, 0.95, 0.04], [Math.cos(r) * 0.5, 1.3 + Math.sin(r) * 0.5, 0.1], { color: '#8c5a2b', rot: [0, 15, a - 90], round: 0.6, parent: 'prop' });
      b.box([0.16, 0.1, 0.045], [Math.cos(r) * 0.94, 1.3 + Math.sin(r) * 0.94, 0.1], { color: 'brass', rot: [0, 15, a - 90], round: 0.6, parent: 'prop' });
    }
    return b.act({ click: [[A.par(A.operate('prop', 'on'), A.say('Whoom whoom whoom!', 2)), A.wait(2), A.operate('prop', 'off')]] }).done();
  }),
  // A hand-lettered protest placard on a wooden stake: SAVE THE TREES. It bobs up and down with the chant.
  e('protest sign', 'ideas', 'signs', () =>
    m('protest sign', { edge: 'sharp' })
      .stick([0, 0, 0], [0, 1.5, 0], 0.04, 'lightwood', { name: 'sign', pivot: [0, 0, 0] })
      .box([0.7, 0.5, 0.02], [0, 1.4, 0.03], { color: '#f2e6cf', round: 0.05, parent: 'sign' })
      .label('SAVE THE TREES!', [0.62, 0.36], [0, 1.4, 0.05], { color: '#f2e6cf', parent: 'sign', depth: 0.004 })
      .act({ click: [[A.par(A.pose('sign', { move: [0, 0.15, 0], dur: 0.3, times: 3 }), A.say('Hey hey! Ho ho!', 2))]] })
      .done(),
  ),
  // A clear plastic protractor (15 cm): a half disc marked in degrees with a centre mark, and a swinging arm
  // that measures an angle.
  e('protractor', 'study', 'math tools', () => {
    const b = m('protractor', { edge: 'sharp' })
      .box([0.16, 0.012, 0.03], [0, 0.006, 0], { color: '#2a2726', round: 0.2 })
      .dome([0.15, 0.075, 0.004], [0, 0.0495, 0.0], { color: '#bfe6f5', name: 'body' })
      .box([0.15, 0.006, 0.005], [0, 0.015, 0.0], { color: '#bfe6f5', parent: 'body', round: 0 });
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI;
      b.box([0.0008, i % 9 === 0 ? 0.012 : i % 3 === 0 ? 0.008 : 0.005, 0.001], [Math.cos(a) * 0.068, 0.012 + Math.sin(a) * 0.068, 0.0025], { color: '#2a2726', rot: [0, 0, deg(a) - 90], parent: 'body', round: 0, noInk: true });
    }
    return b
      .box([0.003, 0.07, 0.002], [0, 0.047, 0.004], { color: '#e0473b', name: 'arm', pivot: [0, 0.012, 0.004], rot: [0, 0, 0], round: 0 })
      .act({ click: [[A.pose('arm', { rot: [0, 0, 60], dur: 0.6 }), A.say('Tick!', 1), A.pose('arm', { rot: [0, 0, -45], dur: 0.6 }), A.pose('arm', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A portable PA: a speaker cabinet with a woofer and a horn tweeter, a little mixer with knobs on top, and a
  // desk microphone. "Testing, testing!" Then a squeal of feedback.
  e('public address system', 'music', 'audio', () =>
    m('public address system', { edge: 'sharp' })
      .box([0.36, 0.56, 0.3], [0, 0.28, 0], { color: '#2a2726', round: 0.1 })
      .cyl([0.28, 0.02, 0.28], [0, 0.22, 0.151], { color: '#3a3633', rot: [90, 0, 0] })
      .cyl([0.16, 0.04, 0.16], [0, 0.22, 0.155], { color: '#5c6166', rot: [90, 0, 0], name: 'woofer' })
      .box([0.16, 0.06, 0.02], [0, 0.45, 0.152], { color: '#5c6166', round: 0.3 })
      .box([0.3, 0.06, 0.2], [0, 0.59, -0.02], { color: '#3a3633', round: 0.2 })
      .cyl([0.14, 0.02, 0.14], [0.35, 0.01, 0.1], { color: '#2a2726' })
      .stick([0.35, 0.02, 0.1], [0.35, 0.25, 0.1], 0.015, '#9da3a8')
      .rod([0.35, 0.25, 0.1], [0.35, 0.3, 0.16], 0.012, '#2a2726')
      .ball([0.04, 0.05, 0.04], [0.35, 0.32, 0.18], { color: '#5c6166', edge: 'soft' })
      .act({
        click: [
          [A.par(A.pose('woofer', { scale: 1.15, dur: 0.15, times: 4 }), A.say('Testing, testing, one, two!', 2.2))],
          [A.par(A.anim('shake'), A.say('EEEEEEEEE!', 1.5))],
        ],
      })
      .done(),
  ),
  // A crème caramel turned out on a plate: a quivering cylinder of custard under a dark caramel top running down
  // its sides, with a cherry on top. It wobbles.
  e('pudding', 'food', 'desserts', () =>
    plate(m('pudding'), 0.22)
      .cyl([0.11, 0.07, 0.11], [0, 0.046, 0], { color: '#f6d98a', taper: 0.85, name: 'flan', pivot: [0, 0.011, 0] })
      .cyl([0.095, 0.012, 0.095], [0, 0.085, 0], { color: '#8a4a1e', parent: 'flan' })
      .capsule([0.016, 0.04, 0.01], [0.045, 0.06, 0.02], { color: '#8a4a1e', parent: 'flan', noInk: true })
      .capsule([0.014, 0.03, 0.01], [-0.03, 0.065, 0.04], { color: '#8a4a1e', parent: 'flan', noInk: true })
      .ball(0.025, [0, 0.105, 0], { color: '#c0392b', parent: 'flan' })
      .ball([0.12, 0.004, 0.12], [0, 0.012, 0], { color: '#8a4a1e', noInk: true })
      .act({ click: [[A.par(A.anim('wobble'), A.pose('flan', { rot: [0, 0, 6], dur: 0.15, times: 3 }), A.say('Jiggle jiggle!', 1.5))]] })
      .done(),
  ),
  // A rain puddle (1.4 m) on the pavement reflecting the sky, with rings of ripples. Splash!
  e('puddle', 'nature', 'puddles', () =>
    m('puddle')
      .ball([1.4, 0.02, 0.9], [0, 0.01, 0], { color: '#5a8fc0' })
      .ball([0.5, 0.022, 0.3], [0.2, 0.012, -0.1], { color: '#a8d8f5', noInk: true })
      .ball([0.6, 0.02, 0.4], [-0.5, 0.01, 0.25], { color: '#5a8fc0' })
      .torus([0.4, 0.4, 0.01], [-0.1, 0.025, 0.05], { color: '#d6f0fa', rot: [90, 0, 0], tube: 0.05, name: 'ripple', noInk: true })
      .torus([0.2, 0.2, 0.01], [-0.1, 0.026, 0.05], { color: '#d6f0fa', rot: [90, 0, 0], tube: 0.08, parent: 'ripple', noInk: true })
      .act({ click: [[A.par(A.effect('water_spray', { dur: 1 }), A.say('SPLASH!', 1.2), A.pose('ripple', { scale: 1.8, dur: 0.6 })), A.pose('ripple', { scale: 1, dur: 0.4 })]] })
      .done(),
  ),
  // A pulley block (the hardware itself, 38 cm with its stand): a hook hanging from a little wooden gallows, an
  // iron-strapped block with its grooved sheave, and a rope over it to a cast-iron weight that is hauled up and
  // let down again.
  e('pulley', 'workshop', 'hardware', () =>
    m('pulley', { edge: 'sharp' })
      .box([0.22, 0.02, 0.12], [0, 0.01, 0], { color: 'darkwood', round: 0.2 })
      .stick([-0.09, 0.02, 0], [-0.09, 0.37, 0], 0.025, 'wood')
      .box([0.16, 0.025, 0.03], [-0.02, 0.37, 0], { color: 'wood', round: 0.2 })
      .arc([0.025, 0.03, 0.005], [0.03, 0.345, 0], { color: 'iron', rot: [0, 0, 180], arc: 270, tube: 0.25 })
      .box([0.05, 0.075, 0.03], [0.03, 0.29, 0], { color: '#7a5230', round: 0.4 })
      .box([0.054, 0.012, 0.034], [0.03, 0.32, 0], { color: 'iron', round: 0.2 })
      .cyl([0.06, 0.016, 0.06], [0.03, 0.28, 0], { color: '#5c6166', rot: [90, 0, 0], name: 'sheave', mover: { kind: 'spin', axis: 'z', amount: 400 } })
      .stick([0.0, 0.28, 0.0], [0.0, 0.06, 0.0], 0.005, '#d9b98a')
      .stick([0.06, 0.28, 0.0], [0.06, 0.12, 0.0], 0.005, '#d9b98a', { name: 'rope', pivot: [0.06, 0.28, 0], mover: { kind: 'slide', axis: 'y', amount: 0.09 } })
      .cyl([0.04, 0.05, 0.04], [0.06, 0.09, 0.0], { color: '#3a3633', taper: 0.8, parent: 'rope' })
      .arc([0.02, 0.02, 0.004], [0.06, 0.118, 0], { color: '#3a3633', tube: 0.2, parent: 'rope' })
      .act({ click: [[A.par(A.operate('rope', 'up'), A.operate('sheave', 'on'), A.say('Squeak, squeak...', 1.5)), A.operate('sheave', 'off'), A.wait(1), A.par(A.operate('rope', 'down'), A.say('Thunk.', 1))]] })
      .done(),
  ),
  // A cast-iron pitcher pump (1.3 m) on a stone block: a fluted barrel, a long curved handle on its pivot, a
  // spout and a bucket underneath. Pump the handle and water gushes out.
  e('pump', 'garden', 'garden things', () =>
    m('pump', { edge: 'sharp' })
      .box([0.6, 0.45, 0.6], [0, 0.225, 0], { color: '#a7a39b', round: 0.1 })
      .cyl([0.18, 0.55, 0.18], [0, 0.72, 0], { color: '#3f6a4a', taper: 0.9 })
      .cyl([0.22, 0.06, 0.22], [0, 1.02, 0], { color: '#3f6a4a' })
      .cyl([0.14, 0.12, 0.14], [0, 1.11, 0], { color: '#3f6a4a', taper: 0.7 })
      .cone([0.08, 0.3, 0.08], [0, 0.82, 0.2], { color: '#3f6a4a', rot: [80, 0, 0] })
      .rod([0, 1.12, -0.05], [0, 1.25, -0.55], 0.05, '#3f6a4a', { name: 'handle', pivot: [0, 1.12, -0.05], edge: 'soft' })
      .ball(0.07, [0, 1.27, -0.6], { color: '#3f6a4a', parent: 'handle' })
      .cyl([0.28, 0.26, 0.28], [0, 0.58, 0.38], { color: '#9da3a8', taper: 1.2 })
      .cyl([0.25, 0.02, 0.25], [0, 0.66, 0.38], { color: 'water', edge: 'soft' })
      .act({ click: [[A.par(A.pose('handle', { rot: [-30, 0, 0], dur: 0.3, times: 3 }), A.say('Squeak... squeak...', 1.5)), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Gush!', 1.2))]] })
      .done(),
  ),
  // A big orange pumpkin (45 cm) with deep ribs, a twisted stalk and a curling tendril and leaf. Click: a carved
  // jack-o'-lantern face lights up. Boo!
  e('pumpkin', 'food', 'vegetables', () => {
    const b = m('pumpkin').ball([0.36, 0.32, 0.36], [0, 0.17, 0], { color: '#e8761e', name: 'body' });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      b.ball([0.17, 0.3, 0.17], [Math.cos(a) * 0.12, 0.165, Math.sin(a) * 0.12], { color: i % 2 ? '#f0923b' : '#e8761e', parent: 'body' });
    }
    b.cyl([0.05, 0.1, 0.05], [0.01, 0.37, 0], { color: '#5a6a2a', taper: 0.7, rot: [0, 0, -12], parent: 'body' })
      .torus([0.08, 0.08, 0.012], [0.08, 0.34, 0.03], { color: '#5aa553', rot: [70, 20, 0], tube: 0.15, parent: 'body' })
      .ball([0.16, 0.012, 0.12], [-0.12, 0.33, -0.06], { color: '#3f7a3a', rot: [10, 30, 15], parent: 'body' });
    // the carved face, hidden until it lights
    b.cone([0.07, 0.06, 0.02], [0.07, 0.22, 0.23], { color: '#ffc04a', segs: 3, name: 'eyeL', scale: 0, parent: 'body', mover: { kind: 'light', on: true } })
      .cone([0.07, 0.06, 0.02], [-0.07, 0.22, 0.23], { color: '#ffc04a', segs: 3, name: 'eyeR', scale: 0, parent: 'body', mover: { kind: 'light', on: true } })
      .box([0.18, 0.05, 0.02], [0, 0.12, 0.23], { color: '#ffc04a', name: 'mouth', scale: 0, parent: 'body', mover: { kind: 'light', on: true } });
    return b
      .act({
        click: [
          [A.par(A.pose('eyeL', { scale: 1, dur: 0.3 }), A.pose('eyeR', { scale: 1, dur: 0.3 }), A.pose('mouth', { scale: 1, dur: 0.3 }), A.anim('hop'), A.say('BOO!', 1.5))],
          [A.par(A.pose('eyeL', { scale: 0, dur: 0.3 }), A.pose('eyeR', { scale: 0, dur: 0.3 }), A.pose('mouth', { scale: 0, dur: 0.3 }), A.say('Fwoomp.', 1.2))],
        ],
      })
      .done();
  }),
  // A pumpkin pie (23 cm) in its fluted crust, the smooth orange custard topped with swirls of whipped cream and a
  // dusting of cinnamon. A slice is lifted out.
  e('pumpkin pie', 'food', 'desserts', () => {
    const b = m('pumpkin pie')
      .cyl([0.23, 0.035, 0.23], [0, 0.0175, 0], { color: '#c8843a', taper: 1.15, name: 'tin' })
      .cyl([0.21, 0.01, 0.21], [0, 0.036, 0], { color: '#d8762a', parent: 'tin' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      b.ball([0.035, 0.022, 0.03], [Math.cos(a) * 0.112, 0.038, Math.sin(a) * 0.112], { color: '#d99a50', rot: [0, -deg(a), 0], parent: 'tin' });
    }
    for (const [xx, z] of [[0.04, -0.03], [-0.05, -0.02], [0.0, -0.06]]) b.cone([0.035, 0.03, 0.035], [xx, 0.055, z], { color: '#fbf8f0', segs: 8, parent: 'tin' });
    return b
      .wedge([0.08, 0.1, 0.03], [0, 0.028, 0.06], { color: '#d8762a', rot: [-90, 0, 0], name: 'slice', parent: 'tin', piece: true })
      .box([0.085, 0.024, 0.02], [0, 0.03, 0.11], { color: '#d99a50', parent: 'slice', round: 0.5 })
      .cone([0.03, 0.026, 0.03], [0, 0.056, 0.07], { color: '#fbf8f0', segs: 8, parent: 'slice' })
      .act({ click: [[A.detach('slice', 'slice'), A.say('Slice!', 1.2)], [A.reattach('slice')]] })
      .done();
  }),
  // A heavy punching bag (1.2 m) hanging on chains from a steel stand: a leather bag with a red band and a
  // padded base. Thwack: it swings and sways back.
  e('punching bag', 'sports', 'gym', () => {
    const b = m('punching bag', { edge: 'sharp' });
    for (const s of [1, -1]) b.rod([s * 0.8, 0, -0.5], [s * 0.6, 2.4, -0.4], 0.07, '#2a2726').box([0.12, 0.06, 1.2], [s * 0.8, 0.03, -0.2], { color: '#2a2726', round: 0.3 });
    b.box([1.4, 0.1, 0.1], [0, 2.4, -0.4], { color: '#2a2726', round: 0.3 }).box([0.1, 0.1, 0.5], [0, 2.4, -0.15], { color: '#2a2726', round: 0.3 });
    b.stick([0, 2.35, 0.08], [0, 2.1, 0.08], 0.02, '#9da3a8', { name: 'bag', pivot: [0, 2.35, 0.08] })
      .rod([0, 2.1, 0.08], [0.12, 1.95, 0.08], 0.015, '#9da3a8', { parent: 'bag' }).rod([0, 2.1, 0.08], [-0.12, 1.95, 0.08], 0.015, '#9da3a8', { parent: 'bag' })
      .cyl([0.36, 1.2, 0.36], [0, 1.33, 0.08], { color: '#2a2726', parent: 'bag', edge: 'soft' })
      .cyl([0.365, 0.2, 0.365], [0, 1.45, 0.08], { color: '#c0392b', parent: 'bag', edge: 'soft', noInk: true })
      .dome([0.36, 0.06, 0.36], [0, 1.93, 0.08], { color: '#3a3633', parent: 'bag', edge: 'soft' })
      .label('PUNCH', [0.2, 0.08], [0, 1.45, 0.27], { color: '#c0392b', parent: 'bag', depth: 0.01 });
    return b.act({ click: [[A.par(A.pose('bag', { rot: [-18, 0, 0], dur: 0.15 }), A.say('THWACK!', 1)), A.pose('bag', { rot: [10, 0, 0], dur: 0.5 }), A.pose('bag', { rot: [-5, 0, 0], dur: 0.4 }), A.pose('bag', { rot: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // A leather handbag (30 cm) with two arched handles, a front flap with a gold clasp, and stitched seams. The
  // flap opens: there's a lipstick inside.
  e('purse', 'wardrobe', 'bags', () =>
    m('purse')
      .box([0.3, 0.2, 0.12], [0, 0.1, 0], { color: '#c0392b', round: 0.3, name: 'bag', edge: 'sharp' })
      .arc([0.2, 0.2, 0.015], [0.04, 0.2, 0], { color: '#a3322a', tube: 0.12, rot: [0, 0, 0], parent: 'bag' })
      .arc([0.2, 0.2, 0.015], [-0.04, 0.2, 0], { color: '#a3322a', tube: 0.12, rot: [0, 0, 0], parent: 'bag' })
      .box([0.31, 0.11, 0.015], [0, 0.155, 0.065], { color: '#a3322a', round: 0.3, name: 'flap', parent: 'bag', pivot: [0, 0.205, 0.06], mover: { kind: 'swing', axis: 'x', amount: -120 }, edge: 'sharp' })
      .box([0.04, 0.03, 0.01], [0, 0.11, 0.075], { color: 'gold', parent: 'flap', round: 0.3 })
      .box([0.3, 0.004, 0.004], [0, 0.02, 0.061], { color: '#e8b0a0', parent: 'bag', round: 0, noInk: true })
      .socket('inside', [0, 0.12, 0], 'inside', { size: 0.2 })
      .act({ click: [[A.operate('flap', 'open'), A.spawn('lip', 'lipstick', { rel: 'on', of: 'self', dist: 'touch' }), A.say('Click!', 1), A.wait(1.5), A.remove('lip', 'sink'), A.operate('flap', 'close')]] })
      .done(),
  ),
  // A wide push broom (60 cm head, 1.5 m handle): a wooden block with stiff black bristles and a brace to the
  // handle. It sweeps up a cloud of dust.
  e('push broom', 'home', 'cleaning', () =>
    m('push broom')
      .box([0.6, 0.06, 0.08], [0, 0.11, 0], { color: '#a0703f', round: 0.2, name: 'broom', pivot: [0, 0, 0], edge: 'sharp' })
      .box([0.58, 0.09, 0.07], [0, 0.045, 0], { color: '#2a2726', round: 0.1, parent: 'broom' })
      .stick([0, 0.14, 0], [0, 1.45, -0.55], 0.032, 'lightwood', { parent: 'broom' })
      .rod([0.15, 0.14, 0], [0, 0.45, -0.12], 0.02, '#9da3a8', { parent: 'broom' })
      .rod([-0.15, 0.14, 0], [0, 0.45, -0.12], 0.02, '#9da3a8', { parent: 'broom' })
      .act({ click: [[A.par(A.pose('broom', { move: [0, 0, 0.3], dur: 0.4, times: 2 }), A.effect('dust', { dur: 1.2 }), A.say('Swish, swish!', 1.5))]] })
      .done(),
  ),
  // A tin of glazier's putty with its lid off and a soft beige blob being kneaded beside it. Squish!
  e('putty', 'workshop', 'materials', () =>
    m('putty')
      .cyl([0.1, 0.07, 0.1], [0, 0.035, 0], { color: '#9da3a8', edge: 'sharp' })
      .cyl([0.094, 0.01, 0.094], [0, 0.07, 0], { color: '#d8c8a0' })
      .label('PUTTY', [0.07, 0.025], [0, 0.035, 0.051], { color: '#f6d24a', depth: 0.003 })
      .cyl([0.104, 0.012, 0.104], [0.11, 0.006, 0.06], { color: '#9da3a8', edge: 'sharp' })
      .ball([0.08, 0.04, 0.06], [-0.1, 0.02, 0.05], { color: '#d8c8a0', name: 'blob', pivot: [-0.1, 0, 0.05] })
      .act({ click: [[A.par(A.pose('blob', { scale: 0.7, dur: 0.2 }), A.say('Squish!', 1)), A.pose('blob', { scale: 1.2, dur: 0.2 }), A.pose('blob', { scale: 1, dur: 0.2 })]] })
      .done(),
  ),
  // The Great Pyramid for the miniature park, kept to the town's 80 m limit: a 70 m square base rising 45 m in
  // its real proportions (the vocabulary's 1.46 m is a souvenir), smooth limestone faces, a gilded capstone, an
  // entrance on the north face, a sphinx keeping watch and palms in the sand. A sandstorm blows past.
  e('pyramid (landmark)', 'places', 'landmarks', () => {
    const b = m('pyramid (landmark)', { edge: 'sharp' }).box([86, 0.4, 86], [0, 0.2, 0], { color: '#d4b47a', round: 0.01, edge: 'soft' });
    pyramid(b, 0, 0, 0.4, 70, 44.5, '#ecdaa8', 1.5);
    b.pyramid([6.4 * Math.SQRT2, 4.1, 6.4 * Math.SQRT2], [0, 42.45, 0], 4, { color: 'gold', name: 'cap' });
    b.box([3, 4, 1.2], [0, 17, 21.5], { color: '#5a4a32', rot: [-33, 0, 0], round: 0.05 });
    // the sphinx: a lion's body and paws and a pharaoh's head
    b.box([6, 5, 16], [30, 2.9, 35], { color: '#d9b878', round: 0.3, edge: 'soft' })
      .box([5, 1.5, 6], [30, 1.15, 45.5], { color: '#d9b878', round: 0.4, edge: 'soft' })
      .box([4, 4.5, 4], [30, 7.0, 41], { color: '#d9b878', round: 0.3, edge: 'soft' })
      .wedge([6, 4, 3.6], [30, 7.6, 40.5], { color: '#c8a868' });
    for (const [xx, z] of [[-38, 30], [-34, 38], [36, 18]]) b.rod([xx, 0.4, z], [xx + 1, 9, z], 0.8, '#8a6440').ball([5, 2, 5], [xx + 1, 9.2, z], { color: '#3f7a3a', edge: 'soft' });
    return b
      .act({ click: [[A.par(A.effect('dust', { dur: 2.5 }), A.say('Whooosh...', 2)), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Gleam!', 1.5))]] })
      .done();
  }),
  // A square pyramid on a stand: a point over four triangular faces. It turns.
  e('pyramid (shape)', 'ideas', 'shapes', () => {
    const b = plinth(m('pyramid (shape)'), 0.2).box([0.01, 0.01, 0.01], [0, 0.04, 0], { color: '#f6d24a', name: 'shape', round: 0 });
    pyramid(b, 0, 0, 0.03, 0.12, 0.1, '#f6d24a', 0.008, { parent: 'shape', edge: 'sharp' });
    return b.act({ click: [[A.par(A.pose('shape', { rot: [0, 360, 0], dur: 1.2 }), A.say('Whirl!', 1.2)), A.pose('shape', { rot: [0, 0, 0], dur: 0 })]] }).done();
  }),
  // A lucky rabbit's foot keyring: a fluffy white foot with a little pink pad, on a chain and a split ring. Luck!
  e('rabbits foot', 'toys', 'lucky charms', () =>
    m('rabbits foot')
      .torus([0.03, 0.03, 0.004], [0, 0.13, 0], { color: 'silver', tube: 0.15 })
      .rod([0, 0.115, 0], [0, 0.085, 0], 0.004, 'silver')
      .cyl([0.016, 0.012, 0.016], [0, 0.078, 0], { color: 'gold', name: 'foot', pivot: [0, 0.13, 0] })
      .capsule([0.034, 0.07, 0.03], [0, 0.045, 0], { color: '#f7f5ef', parent: 'foot' })
      .ball([0.03, 0.02, 0.026], [0, 0.012, 0.008], { color: '#f7f5ef', parent: 'foot' })
      .ball([0.012, 0.008, 0.004], [0, 0.01, 0.022], { color: '#f4a1c0', parent: 'foot', noInk: true })
      .act({ click: [[A.par(A.pose('foot', { rot: [0, 0, 20], dur: 0.25, times: 2 }), A.effect('sparkle', { dur: 1.2 }), A.say('Jingle!', 1.2))]] })
      .done(),
  ),
  // A Formula-style race car (5 m, 0.95 m tall): a slim red nose and tub with an open cockpit, the driver's helmet
  // under a halo, sidepods, an airbox and shark fin, front and rear wings, suspension arms out to four fat slick
  // tyres. The engine roars; a pit stop swaps a wheel.
  e('race car', 'garage', 'cars', () => {
    const b = m('race car', { view: 'side', edge: 'sharp' })
      .loft([0.9, 0.55, 4.6], [0, 0.38, 0.2], [[0, 0.6, 0.85, 0.05], [0.25, 0.85, 1, 0.02], [0.5, 0.75, 0.9, 0], [0.75, 0.42, 0.6, -0.08], [1, 0.18, 0.25, -0.2]], { color: '#d42a2a', boxy: 0.5, name: 'body', edge: 'soft' })
      .label('7', [0.22, 0.18], [0, 0.42, 1.95], { color: 'white', rot: [-80, 0, 0], parent: 'body', depth: 0.01 });
    for (const s of [1, -1]) {
      b.loft([0.5, 0.42, 1.7], [s * 0.6, 0.35, -0.35], [[0, 0.5, 0.6, 0], [0.3, 0.95, 1, 0], [0.8, 1, 1, 0], [1, 0.7, 0.85, 0]], { color: '#d42a2a', boxy: 0.6, parent: 'body', edge: 'soft' });
      b.box([0.06, 0.3, 0.4], [s * 0.88, 0.17, 2.4], { color: '#2a2726', parent: 'body', round: 0.2 });
      b.box([0.06, 0.4, 0.45], [s * 0.5, 0.82, -2.2], { color: '#2a2726', parent: 'body', round: 0.2 });
      b.box([0.08, 0.05, 0.12], [s * 0.45, 0.72, 0.65], { color: '#2a2726', parent: 'body', round: 0.4 });
      // suspension arms to the wheels
      b.rod([s * 0.3, 0.32, 1.65], [s * 0.72, 0.33, 1.65], 0.035, '#2a2726', { parent: 'body' }).rod([s * 0.3, 0.42, 1.55], [s * 0.72, 0.4, 1.65], 0.035, '#2a2726', { parent: 'body' });
      b.rod([s * 0.5, 0.32, -1.55], [s * 0.72, 0.35, -1.55], 0.035, '#2a2726', { parent: 'body' });
    }
    b.loft([0.5, 0.5, 1.7], [0, 0.72, -0.95], [[0, 0.4, 0.5, -0.1], [0.5, 0.8, 0.9, 0], [0.85, 1, 1, 0.02], [1, 0.8, 0.8, 0]], { color: '#d42a2a', boxy: 0.5, parent: 'body', edge: 'soft' })
      .box([0.03, 0.4, 0.9], [0, 0.95, -1.4], { color: '#d42a2a', parent: 'body', round: 0.3 })
      .ball([0.3, 0.12, 0.6], [0, 0.6, 0.55], { color: '#1e1b1f', parent: 'body' })
      .ball(0.27, [0, 0.72, 0.42], { color: '#f6d24a', parent: 'body', edge: 'soft' })
      .box([0.22, 0.08, 0.04], [0, 0.74, 0.55], { color: '#2a2726', parent: 'body', round: 0.5 })
      .arc([0.5, 0.36, 0.05], [0, 0.72, 0.5], { color: '#2a2726', rot: [-10, 90, 0], tube: 0.12, parent: 'body' })
      .box([1.8, 0.04, 0.42], [0, 0.11, 2.42], { color: '#2a2726', parent: 'body', round: 0.3 })
      .box([1.6, 0.04, 0.2], [0, 0.18, 2.3], { color: '#d42a2a', parent: 'body', round: 0.3 })
      .box([1.0, 0.05, 0.4], [0, 1.0, -2.2], { color: '#2a2726', parent: 'body', round: 0.3 })
      .box([1.0, 0.04, 0.25], [0, 0.88, -2.2], { color: '#d42a2a', parent: 'body', round: 0.3 })
      .stick([0, 0.6, -2.0], [0, 0.98, -2.2], 0.05, '#2a2726', { parent: 'body' })
      .box([0.12, 0.08, 0.08], [0, 0.25, -2.4], { color: '#e0473b', parent: 'body', round: 0.3, name: 'taillight', mover: { kind: 'light' } });
    // the wheels: fat slicks with coloured rims; the front-left comes off at a pit stop
    for (const [nm, xx, z, d, w] of [['wheel1', 0.78, 1.65, 0.66, 0.32], ['wheel2', -0.78, 1.65, 0.66, 0.32], ['wheel3', 0.8, -1.55, 0.72, 0.4], ['wheel4', -0.8, -1.55, 0.72, 0.4]] as Array<[string, number, number, number, number]>) {
      b.cyl([d, w, d], [xx, d / 2, z], { color: 'rubber', rot: [0, 0, 90], name: nm, parent: 'body', edge: 'soft', ...(nm === 'wheel1' ? { piece: true } : {}) });
      b.cyl([d * 0.62, 0.02, d * 0.62], [xx + Math.sign(xx) * w * 0.5, d / 2, z], { color: '#c9ccd1', rot: [0, 0, 90], parent: nm });
      b.cyl([d * 0.66, 0.012, d * 0.66], [xx + Math.sign(xx) * w * 0.51, d / 2, z], { color: '#f6d24a', rot: [0, 0, 90], parent: nm, noInk: true });
    }
    return b
      .socket('cockpit', [0, 0.45, 0.4], 'seat')
      .act({
        click: [
          [A.par(A.operate('taillight', 'on'), A.anim('shake'), A.effect('smoke', { dur: 1.5 }), A.say('VROOOOOM!', 2)), A.wait(1), A.operate('taillight', 'off')],
          [A.detach('wheel1', 'tyre'), A.say('Whirr-clunk!', 1.2), A.wait(1), A.reattach('wheel1'), A.say('Vroom!', 1.2)],
        ],
      })
      .done();
  }),
  // A chrome wire shelving rack (1.8 m): four posts, four wire shelves, storage boxes, tins and a pull-out bin.
  e('rack', 'home', 'storage', () => {
    const b = m('rack', { edge: 'sharp' });
    for (const [xx, z] of [[0.45, 0.22], [-0.45, 0.22], [0.45, -0.22], [-0.45, -0.22]]) b.cyl([0.03, 1.8, 0.03], [xx, 0.9, z], { color: '#c9ccd1' }).cyl([0.04, 0.02, 0.04], [xx, 0.01, z], { color: '#2a2726' });
    for (const y of [0.15, 0.6, 1.05, 1.5]) {
      b.box([0.92, 0.02, 0.46], [0, y, 0], { color: '#c9ccd1', round: 0.2 });
      b.each(5, (i) => b.box([0.006, 0.022, 0.44], [-0.36 + i * 0.18, y + 0.002, 0], { color: '#9da3a8', round: 0, noInk: true }));
    }
    b.box([0.35, 0.25, 0.35], [-0.2, 0.735, 0], { color: '#d8b07a', round: 0.05 })
      .box([0.3, 0.2, 0.3], [0.22, 1.16, 0.02], { color: '#4e8fd6', round: 0.1 })
      .cyl([0.1, 0.14, 0.1], [0.25, 0.68, 0.05], { color: '#e0473b' }).cyl([0.1, 0.14, 0.1], [0.35, 0.68, -0.08], { color: '#f6d24a' })
      .ball([0.2, 0.18, 0.2], [-0.25, 1.6, 0], { color: '#5aa553', edge: 'soft' })
      .box([0.4, 0.2, 0.4], [0.1, 0.27, 0.0], { color: '#5c6166', round: 0.1, name: 'bin', mover: { kind: 'slide', axis: 'z', amount: 0.3 } })
      .box([0.12, 0.04, 0.02], [0.1, 0.3, 0.205], { color: '#9da3a8', parent: 'bin', round: 0.3 });
    return b.socket('shelf', [0, 1.52, 0], 'top', { size: 0.4 }).act({ click: [[A.operate('bin', 'out'), A.say('Shhk!', 1), A.wait(1.5), A.operate('bin', 'in')]] }).done();
  }),
  // A tennis racket (68 cm) standing on its grip: an oval graphite frame strung in a tight grid, an open throat
  // and a wrapped handle, with a ball. It swings: thwock!
  e('racket', 'sports', 'rackets', () => {
    const b = m('racket')
      .capsule([0.035, 0.2, 0.03], [0, 0.11, 0], { color: '#2a2726', name: 'racket', pivot: [0, 0, 0] })
      .rod([0, 0.21, 0], [0.07, 0.33, 0], 0.016, '#2f6fd0', { parent: 'racket' })
      .rod([0, 0.21, 0], [-0.07, 0.33, 0], 0.016, '#2f6fd0', { parent: 'racket' })
      .torus([0.27, 0.34, 0.018], [0, 0.49, 0], { color: '#2f6fd0', tube: 0.08, parent: 'racket' });
    for (let i = -4; i <= 4; i++) b.box([0.002, 0.31 * Math.sqrt(1 - (i / 5) ** 2), 0.002], [i * 0.025, 0.49, 0], { color: '#f7f5ef', parent: 'racket', round: 0, noInk: true });
    for (let i = -5; i <= 5; i++) b.box([0.25 * Math.sqrt(1 - (i / 6) ** 2), 0.002, 0.002], [0, 0.49 + i * 0.027, 0], { color: '#f7f5ef', parent: 'racket', round: 0, noInk: true });
    return b
      .ball(0.067, [0.15, 0.0335, 0.05], { color: '#d8f04a' })
      .act({ click: [[A.pose('racket', { rot: [0, 0, 35], dur: 0.3 }), A.par(A.pose('racket', { rot: [0, 0, -45], dur: 0.15 }), A.say('Thwock!', 1)), A.pose('racket', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A rotating radar antenna (1.9 m): a steel pedestal and turning yoke carrying a curved reflector dish and its
  // feed horn. It sweeps round and round: ping... ping...
  e('radar', 'tech', 'antennas', () =>
    m('radar', { edge: 'sharp' })
      .box([0.6, 0.1, 0.6], [0, 0.05, 0], { color: '#5c6166', round: 0.2 })
      .cyl([0.25, 1.0, 0.25], [0, 0.6, 0], { color: '#9da3a8', taper: 0.8 })
      .cyl([0.35, 0.15, 0.35], [0, 1.15, 0], { color: '#5c6166', name: 'head', mover: { kind: 'spin', axis: 'y', amount: 120 } })
      .rod([0, 1.2, 0], [0, 1.45, 0.05], 0.06, '#5c6166', { parent: 'head' })
      .dome([1.1, 0.4, 0.5], [0, 1.6, 0.0], { color: '#f7f5ef', rot: [-90, 0, 0], parent: 'head', edge: 'soft' })
      .rod([0, 1.6, 0.05], [0, 1.6, 0.42], 0.025, '#5c6166', { parent: 'head' })
      .cone([0.08, 0.1, 0.06], [0, 1.6, 0.46], { color: '#2a2726', rot: [-90, 0, 0], parent: 'head' })
      .act({ click: [[A.par(A.operate('head', 'on'), A.say('Ping... ping... ping...', 2.5)), A.wait(2.5), A.operate('head', 'off')]] })
      .done(),
  ),
  // A radar detector on its dashboard suction mount: a little black box with a red LED display and a row of
  // warning lights. Beep beep beep!
  e('radar detector', 'garage', 'car gadgets', () =>
    m('radar detector', { edge: 'sharp' })
      .box([0.14, 0.015, 0.1], [0, 0.0075, 0], { color: '#3a3633', round: 0.3 })
      .cyl([0.04, 0.02, 0.04], [0, 0.025, -0.02], { color: '#5c6166' })
      .box([0.11, 0.035, 0.08], [0, 0.055, 0], { color: '#1e1b1f', round: 0.3, name: 'unit' })
      .box([0.05, 0.016, 0.004], [-0.02, 0.058, 0.041], { color: '#ff3a2a', name: 'display', parent: 'unit', mover: { kind: 'light' }, round: 0 })
      .ball(0.008, [0.022, 0.058, 0.041], { color: '#5ad06a', parent: 'unit', name: 'led1', mover: { kind: 'light' } })
      .ball(0.008, [0.038, 0.058, 0.041], { color: '#f6d24a', parent: 'unit', name: 'led2', mover: { kind: 'light' } })
      .act({ click: [[A.par(A.operate('display', 'on'), A.operate('led', 'on'), A.anim('shake'), A.say('Beep beep beep!', 1.5)), A.wait(1.2), A.par(A.operate('display', 'off'), A.operate('led', 'off'))]] })
      .done(),
  ),
  // A radiation warning sign (32 cm) on a short stake: the black trefoil on yellow with RADIOACTIVE beneath. A
  // Geiger counter crackles, and it glows.
  e('radioactive material sign', 'ideas', 'signs', () => {
    const b = m('radioactive material sign', { edge: 'sharp' })
      .stick([0, 0, -0.02], [0, 0.32, -0.02], 0.025, '#9da3a8')
      .box([0.32, 0.32, 0.012], [0, 0.32, 0], { color: '#f6d24a', round: 0.1, name: 'board', mover: { kind: 'light' } })
      .box([0.33, 0.33, 0.008], [0, 0.32, -0.006], { color: '#2a2726', round: 0.1 });
    for (const st of [-30, 90, 210]) fan(b, 6, 0.1, 0, 0.34, 0.008, 0.006, '#2a2726', { start: st, count: 1, parent: 'board' });
    return b
      .cyl([0.04, 0.008, 0.04], [0, 0.34, 0.01], { color: '#f6d24a', rot: [90, 0, 0], parent: 'board' })
      .cyl([0.025, 0.01, 0.025], [0, 0.34, 0.012], { color: '#2a2726', rot: [90, 0, 0], parent: 'board' })
      .label('RADIOACTIVE', [0.26, 0.045], [0, 0.205, 0.008], { color: '#f6d24a', parent: 'board', depth: 0.002 })
      .act({ click: [[A.par(A.operate('board', 'on'), A.say('Click... click-click-click!', 2)), A.wait(1.5), A.operate('board', 'off')]] })
      .done();
  }),
  // A radish pulled from the ground: a round red root fading to white at its tip with a long taproot, and a tuft
  // of green leaves. It pops up out of the soil.
  e('radish', 'food', 'vegetables', () =>
    m('radish')
      .ball([0.12, 0.03, 0.1], [0, 0.015, 0], { color: 'dirt' })
      .ball([0.045, 0.042, 0.045], [0, 0.05, 0], { color: '#d42a4a', name: 'root', pivot: [0, 0.03, 0] })
      .ball([0.026, 0.02, 0.026], [0, 0.03, 0], { color: '#f7f0f4', parent: 'root' })
      .cone([0.01, 0.04, 0.01], [0, 0.008, 0], { color: '#f7f0f4', rot: [180, 0, 0], parent: 'root' })
      .ball([0.025, 0.09, 0.008], [0.015, 0.12, 0], { color: '#5aa553', rot: [0, 0, -15], parent: 'root' })
      .ball([0.025, 0.08, 0.008], [-0.015, 0.115, 0.005], { color: '#3f7a3a', rot: [0, 30, 18], parent: 'root' })
      .ball([0.022, 0.07, 0.008], [0.0, 0.11, -0.012], { color: '#5aa553', rot: [-15, 60, 0], parent: 'root' })
      .act({ click: [[A.par(A.pose('root', { move: [0, 0.08, 0], dur: 0.25 }), A.say('Pop!', 1)), A.wait(0.8), A.pose('root', { move: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A raffle drum (28 cm) on its stand full of ticket stubs, with a crank, and a strip of red raffle tickets on the
  // table. The drum spins and the winning number is drawn.
  e('raffle ticket', 'toys', 'party', () => {
    const b = m('raffle ticket', { edge: 'sharp' });
    for (const s of [1, -1]) b.box([0.02, 0.2, 0.14], [s * 0.12, 0.1, 0], { color: '#2a2726', round: 0.2 });
    b.cyl([0.18, 0.21, 0.18], [0, 0.18, 0], { color: '#e2b23a', rot: [0, 0, 90], segs: 8, name: 'drum', mover: { kind: 'spin', axis: 'x', amount: 360 } })
      .cyl([0.15, 0.215, 0.15], [0, 0.18, 0], { color: '#bfe3f5', rot: [0, 0, 90], segs: 8, parent: 'drum', noInk: true })
      .rod([0.13, 0.18, 0], [0.17, 0.18, 0], 0.014, '#5c6166')
      .rod([0.17, 0.18, 0], [0.17, 0.13, 0.04], 0.01, '#5c6166');
    b.each(4, (i) => b.box([0.05, 0.03, 0.003], [-0.1 + i * 0.055, 0.0015, 0.16], { color: '#e0473b', round: 0 }).label(String(41 + i), [0.03, 0.02], [-0.1 + i * 0.055, 0.004, 0.16], { color: '#e0473b', rot: [-90, 0, 0], depth: 0.001 }));
    return b.act({ click: [[A.par(A.operate('drum', 'on'), A.say('Clatter clatter...', 1.5)), A.wait(1.5), A.operate('drum', 'off'), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Ding! Number 42!', 2))]] }).done();
  }),
];
