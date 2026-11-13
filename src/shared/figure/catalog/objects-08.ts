/**
 * Catalog chunk objects-08: the words in assign/objects-08.tsv, at their real size next to a 1.7 m person, each
 * with crisp or soft edges chosen per part, named movers / pieces / sockets where the real thing has them, and an
 * act (what it does when clicked).
 */
import { e, type CatalogEntry } from './types';
import { A, col, m, around, withAct, type M } from '../dsl';
import { face, hat, held, wear, who } from '../accessories';

type V = [number, number, number];
const D2R = Math.PI / 180;

/** A point on the surface of an ellipsoid (centre c, radii r): yaw 0 is the front (+z), pitch up from the equator. */
const surf = (c: V, r: V, yaw: number, pitch: number): V => [
  c[0] + r[0] * Math.cos(pitch * D2R) * Math.sin(yaw * D2R),
  c[1] + r[1] * Math.sin(pitch * D2R),
  c[2] + r[2] * Math.cos(pitch * D2R) * Math.cos(yaw * D2R),
];

/** Turn a vector about +y by a degrees (yaw 90 turns the front, +z, to face +x). */
const ry = (v: V, a: number): V => {
  const c = Math.cos(a * D2R), s = Math.sin(a * D2R);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
};
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A colour darkened (k < 1) or lightened (k > 1). */
const shade = (c: string, k: number): string => {
  const n = parseInt(col(c).slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

/** A road wheel with its axle across x: a soft tyre, a sharp rim and hub. The name starts with 'wheel' so it
 *  rolls when the thing moves. */
function wheel(b: M, name: string, at: V, dia: number, w: number, rim = 'silver'): M {
  b.cyl([dia, w, dia], at, { color: 'rubber', rot: [0, 0, 90], name, edge: 'soft' });
  b.cyl([dia * 0.62, w * 1.04, dia * 0.62], at, { color: rim, rot: [0, 0, 90], parent: name, edge: 'sharp' });
  return b.cyl([dia * 0.22, w * 1.12, dia * 0.22], at, { color: '#5c6166', rot: [0, 0, 90], parent: name, edge: 'sharp' });
}

/** Two wheels on an axle at z (track: tyre centre to tyre centre), named wheel<tag>L / wheel<tag>R. */
function axle(b: M, tag: string, z: number, track: number, dia: number, w: number, rim?: string, y = dia / 2): M {
  b.stick([-track / 2, y, z], [track / 2, y, z], Math.max(0.02, dia * 0.1), '#3a3633');
  wheel(b, `wheel${tag}L`, [track / 2, y, z], dia, w, rim);
  return wheel(b, `wheel${tag}R`, [-track / 2, y, z], dia, w, rim);
}

/** A framed window on a wall that faces +z (yaw turns it): sharp frame, glass, glazing bars and a sill. */
function win(b: M, at: V, w: number, h: number, o: { frame?: string; glass?: string; bars?: boolean; sill?: boolean; yaw?: number; name?: string; lit?: boolean } = {}): M {
  const yaw = o.yaw ?? 0, P = (v: V) => add(at, ry(v, yaw)), R: V = [0, yaw, 0], fr = o.frame ?? 'white';
  const t = Math.min(w, h) * 0.08;
  b.box([w, h, 0.07], P([0, 0, 0]), { color: fr, rot: R, round: 0.12, edge: 'sharp' });
  b.box([w - 2 * t, h - 2 * t, 0.05], P([0, 0, 0.02]), { color: o.glass ?? (o.lit ? '#fff1b8' : 'glass'), rot: R, round: 0.05, edge: 'sharp', ...(o.name ? { name: o.name } : {}), ...(o.lit ? { mover: { kind: 'light' as const } } : {}) });
  if (o.bars !== false) {
    b.box([t * 0.6, h - 2 * t, 0.06], P([0, 0, 0.03]), { color: fr, rot: R, round: 0.1, edge: 'sharp' });
    b.box([w - 2 * t, t * 0.6, 0.06], P([0, 0, 0.03]), { color: fr, rot: R, round: 0.1, edge: 'sharp' });
  }
  if (o.sill !== false) b.box([w + 0.12, 0.07, 0.14], P([0, -h / 2 - 0.035, 0.05]), { color: fr, rot: R, round: 0.15, edge: 'sharp' });
  return b;
}

/** A door on a wall that faces +z (yaw turns it), hinged on its -x edge so it swings out when opened: frame, leaf,
 *  a glass light or two raised panels, and a handle at 1 m. Named 'door' (or o.name) so operate('door') reaches it. */
function door(b: M, at: V, w: number, h: number, color: string, o: { name?: string; glass?: boolean; yaw?: number; frame?: string; amount?: number } = {}): M {
  const yaw = o.yaw ?? 0, P = (v: V) => add(at, ry(v, yaw)), R: V = [0, yaw, 0], name = o.name ?? 'door';
  b.box([w + 0.18, h + 0.09, 0.07], P([0, 0.045, -0.025]), { color: o.frame ?? 'white', rot: R, round: 0.1, edge: 'sharp' });
  b.box([w, h, 0.06], P([0, 0, 0.02]), { color, rot: R, round: 0.08, edge: 'sharp', name, pivot: P([-w / 2, 0, 0.02]), mover: { kind: 'swing', axis: 'y', amount: o.amount ?? -95 } });
  if (o.glass) b.box([w * 0.64, h * 0.44, 0.02], P([0, h * 0.17, 0.055]), { color: 'glass', rot: R, round: 0.1, parent: name, edge: 'sharp' });
  else b.pair((s) => b.box([w * 0.64, h * 0.32, 0.02], P([0, s * h * 0.21, 0.055]), { color: shade(color, 0.85), rot: R, round: 0.2, parent: name, edge: 'sharp' }));
  return b.cyl([0.05, 0.12, 0.05], P([w / 2 - 0.11, 1.0 - h / 2, 0.08]), { color: 'brass', rot: [90, 0, 0], parent: name, edge: 'sharp' });
}

interface ShopO {
  w: number;
  h: number;
  d: number;
  wall: string;
  sign: string;
  trim?: string;
  signBg?: string;
  roof?: 'flat' | 'gable';
  roofColor?: string;
  door?: string;
  awning?: [string, string];
  upper?: boolean;
  base?: string;
  doorX?: number;
}

/**
 * A shop or small public building at real size, front at +z, on a kerb: sharp walls, a cornice, framed shop
 * windows either side of a door that swings open, a striped awning, a sign board, side windows, and a flat roof
 * or a gable. `upper` adds a row of first-floor windows (give h 6.5 or more). Returns the builder for details.
 */
function shop(key: string, o: ShopO): M {
  const { w, h, d } = o, y0 = 0.15, zf = d / 2, trim = o.trim ?? 'white', dx = o.doorX ?? 0;
  const b = m(key, { edge: 'sharp' })
    .box([w + 0.8, y0, d + 1.6], [0, y0 / 2, 0.4], { color: o.base ?? '#c9c6bd', round: 0.05 })
    .box([w, h, d], [0, y0 + h / 2, 0], { color: o.wall, round: 0.02, name: 'walls' })
    .box([w + 0.26, 0.32, d + 0.26], [0, y0 + h - 0.16, 0], { color: trim, round: 0.1 })
    .box([w + 0.06, 0.4, 0.06], [0, y0 + 0.2, zf + 0.03], { color: shade(o.wall, 0.7), round: 0.1 });
  door(b, [dx, y0 + 1.1, zf + 0.03], 1.0, 2.2, o.door ?? 'darkwood', { glass: true, frame: trim });
  const left = -w / 2 + 0.35, right = w / 2 - 0.35;
  for (const [a, c] of [[left, dx - 0.85], [dx + 0.85, right]]) if (c - a > 0.6) win(b, [(a + c) / 2, y0 + 1.45, zf + 0.04], c - a, 1.8, { frame: trim, bars: false });
  if (o.awning) {
    const n = Math.max(4, Math.round((w - 0.4) / 0.5)), sw = (w - 0.4) / n;
    b.each(n, (i) => b.box([sw + 0.01, 0.05, 1.2], [-(w - 0.4) / 2 + sw * (i + 0.5), y0 + 2.85, zf + 0.58], { color: o.awning![i % 2], rot: [22, 0, 0], round: 0.1 }));
    b.each(n, (i) => b.box([sw + 0.01, 0.25, 0.03], [-(w - 0.4) / 2 + sw * (i + 0.5), y0 + 2.5, zf + 1.13], { color: o.awning![i % 2], round: 0.1 }));
  }
  const signY = o.upper ? y0 + 3.45 : y0 + Math.min(h - 0.8, 3.8);
  b.label(o.sign, [Math.min(w * 0.72, 6), 0.7], [0, signY, zf + 0.05], { color: o.signBg ?? 'cream', depth: 0.06 });
  if (o.upper) {
    const n = Math.max(2, Math.floor(w / 1.8));
    b.each(n, (i) => win(b, [-w / 2 + (w / n) * (i + 0.5), y0 + 5.0, zf + 0.04], 1.0, 1.4, { frame: trim }));
  }
  b.pair((s) => win(b, [s * (w / 2 + 0.04), y0 + 1.6, -d * 0.1], 1.0, 1.3, { frame: trim, yaw: s * 90 }));
  if (o.roof === 'gable') {
    const rh = Math.min(w, d) * 0.32;
    b.wedge([w + 0.5, rh, d + 0.5], [0, y0 + h + rh / 2, 0], { color: o.roofColor ?? 'darkred', round: 0.05 });
  } else b.box([w - 0.1, 0.12, d - 0.1], [0, y0 + h + 0.02, 0], { color: o.roofColor ?? '#5c6166', round: 0.1 });
  return b;
}

/** Recycling arrows: three arrows chasing round a triangle in the x-y plane (optionally riding a parent part). */
function arrows3(b: M, c: V, size: number, color = '#2e9e4f', o: { noInk?: boolean; parent?: string } = {}): M {
  const P: Array<[number, number]> = [[0, 0.55], [0.5, -0.32], [-0.5, -0.32]];
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 3];
    const p = (t: number): V => [c[0] + (ax + (bx - ax) * t) * size, c[1] + (ay + (by - ay) * t) * size, c[2]];
    b.rod(p(0.12), p(0.62), size * 0.13, color, { noInk: o.noInk, parent: o.parent });
    const dx = bx - ax, dy = by - ay;
    b.cone([size * 0.3, size * 0.24, size * 0.1], p(0.72), { color, noInk: o.noInk, parent: o.parent, rot: [0, 0, -Math.atan2(dx, dy) / D2R] });
  }
  return b;
}
/** A sneaker along z at x (scaled by k, lifted by y0): sole, upper, toe, tongue and laces (optionally riding a
 *  parent part). */
function sneaker(b: M, x: number, up: string, k = 1, y0 = 0, z = 0, parent?: string): M {
  const p = (v: V): V => [x + v[0] * k, y0 + v[1] * k, z + v[2] * k];
  const S = (v: V): V => [v[0] * k, v[1] * k, v[2] * k];
  const P = parent ? { parent } : {};
  b.box(S([0.1, 0.03, 0.28]), p([0, 0.015, 0]), { color: 'white', round: 0.6, ...P });
  b.box(S([0.09, 0.09, 0.16]), p([0, 0.07, -0.05]), { color: up, round: 0.5, ...P });
  b.ball(S([0.09, 0.07, 0.15]), p([0, 0.04, 0.065]), { color: up, ...P });
  b.ball(S([0.06, 0.014, 0.08]), p([0, 0.114, -0.07]), { color: 'black', noInk: true, ...P });
  b.box(S([0.05, 0.03, 0.1]), p([0, 0.1, 0.02]), { color: up, round: 0.5, rot: [-20, 0, 0], ...P });
  b.each(3, (i) => b.box(S([0.06, 0.008, 0.012]), p([0, 0.085 - i * 0.012, 0.0 + i * 0.03]), { color: 'white', noInk: true, ...P }));
  return b.box(S([0.092, 0.02, 0.06]), p([0, 0.04, -0.12]), { color: 'white', round: 0.4, noInk: true, ...P });
}

/** A flat slab from a to c in the x-y plane (a drape, a ramp, a board): width w along z, thickness t. */
function plank(b: M, a: V, c: V, w: number, t: number, color: string, o: { noInk?: boolean; round?: number } = {}): M {
  const dx = c[0] - a[0], dy = c[1] - a[1];
  return b.box([Math.hypot(dx, dy), t, w], [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], { color, rot: [0, 0, Math.atan2(dy, dx) / D2R], round: o.round ?? 0.3, noInk: o.noInk });
}

/** A flat shape on a small wooden plinth (ideas: shapes). */
const plinth = (b: M, w = 0.1): M => b.box([w, 0.025, 0.05], [0, 0.0125, 0], { color: 'wood' });

/** A bowl (wider at the top) at a position, with an optional mound of food in it. */
function bowl(b: M, dia: number, color: string, food?: string, at: V = [0, 0, 0]): M {
  const [x, y, z] = at;
  b.cyl([dia * 0.62, dia * 0.36, dia * 0.62], [x, y + dia * 0.18, z], { color, taper: 1.6 });
  if (food) b.ball([dia * 0.92, dia * 0.22, dia * 0.92], [x, y + dia * 0.36, z], { color: food });
  return b;
}

/** A plate. */
const plate = (b: M, dia: number, color = 'white', at: V = [0, 0, 0]): M => b.cyl([dia, dia * 0.07, dia], [at[0], at[1] + dia * 0.035, at[2]], { color, taper: 1.15 });

export const ENTRIES: CatalogEntry[] = [
  // A log raft two people can stand on (3.2 m x 2.1 m): seven soft logs with pale cut ends, lashed to two cross
  // poles, a short mast with a square cloth sail, and a steering oar on a forked post that sweeps side to side.
  // (The vocabulary's 0.5 m is the deck; the mast takes it to 1.9 m.)
  e('raft', 'garage', 'boats', () => {
    const b = m('raft', { view: 'side' });
    b.each(7, (i) => {
      const xx = -0.9 + i * 0.3, len = 3.2 - Math.abs(i - 3) * 0.12;
      b.cyl([0.3, len, 0.3], [xx, 0.15, 0], { color: i % 2 ? '#a8784a' : '#94653a', rot: [90, 0, 0], edge: 'soft' });
      b.pair((s) => b.cyl([0.24, 0.02, 0.24], [xx, 0.15, s * (len / 2 + 0.005)], { color: '#d8b07a', rot: [90, 0, 0], noInk: true }));
    });
    b.pair((s) => {
      b.stick([-1.1, 0.33, s * 1.1], [1.1, 0.33, s * 1.1], 0.1, '#7a5230', { edge: 'soft' });
      b.each(4, (i) => b.box([0.08, 0.12, 0.16], [-0.75 + i * 0.5, 0.31, s * 1.1], { color: '#d9c08a', round: 0.5, edge: 'soft' }));
    });
    b.box([0.5, 0.35, 0.4], [-0.55, 0.47, -0.4], { color: '#b5814e', edge: 'sharp', round: 0.1 })
      .box([0.52, 0.04, 0.42], [-0.55, 0.62, -0.4], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.3, 0.35], [0, 1.9, 0.35], 0.1, '#7a5230')
      .stick([-0.65, 1.82, 0.38], [0.65, 1.82, 0.38], 0.06, '#7a5230')
      .box([1.2, 1.25, 0.03], [0, 1.18, 0.42], { color: '#efe3c4', round: 0.4, edge: 'soft', name: 'sail' })
      .box([0.3, 0.26, 0.01], [0.28, 0.9, 0.44], { color: '#c9a86a', noInk: true, parent: 'sail' })
      .stick([0, 0.3, -1.45], [0, 0.8, -1.45], 0.09, '#7a5230')
      .rod([0, 0.85, -0.95], [0, 0.12, -2.45], 0.06, '#8c5a2b', { name: 'oar', pivot: [0, 0.82, -1.45], mover: { kind: 'swing', axis: 'y', amount: 30 } })
      .box([0.03, 0.12, 0.5], [0, 0.18, -2.3], { color: '#8c5a2b', rot: [-35, 0, 0], parent: 'oar', edge: 'sharp' })
      .socket('deck', [0.3, 0.32, 0.5], 'top', { size: 1.2 });
    return b
      .act({ click: [[A.operate('oar', 'open'), A.par(A.effect('water_spray', { dur: 1.5 }), A.anim('wobble'))], [A.operate('oar', 'close'), A.effect('water_spray', { dur: 1.2 })]] })
      .done();
  }),
  // A galvanised bucket of soapy water with a cleaning rag draped over the rim: the rag is a piece that comes off
  // (to be wrung out) and goes back.
  e('rag', 'home', 'cleaning', () => {
    const c = '#c9b892';
    const b = m('rag', { edge: 'sharp' })
      .cyl([0.27, 0.3, 0.27], [0, 0.15, 0], { color: '#aab2b8', taper: 1.18, name: 'bucket' })
      .torus([0.33, 0.33, 0.02], [0, 0.3, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.08 })
      .torus([0.3, 0.3, 0.014], [0, 0.1, 0], { color: '#9aa2a8', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .cyl([0.3, 0.02, 0.3], [0, 0.27, 0], { color: '#9fc6d8', edge: 'soft' })
      .arc([0.34, 0.2, 0.012], [0, 0.3, 0], { color: '#c9ccd1', tube: 0.06, rot: [0, 30, 0] });
    b.each(5, (i) => b.ball(0.03 + (i % 2) * 0.015, [-0.08 + i * 0.035, 0.285, -0.04 + (i % 3) * 0.03], { color: 'white', edge: 'soft', noInk: true }));
    b.box([0.17, 0.04, 0.12], [0.02, 0.305, 0.1], { color: c, round: 0.6, rot: [0, 15, 0], edge: 'soft', name: 'rag', parent: 'bucket', piece: true })
      .box([0.16, 0.17, 0.025], [0.03, 0.22, 0.165], { color: c, round: 0.4, rot: [-8, 0, 4], edge: 'soft', parent: 'rag' })
      .box([0.05, 0.05, 0.006], [0.0, 0.24, 0.18], { color: 'denim', noInk: true, rot: [0, 0, 10], parent: 'rag' });
    b.each(5, (i) => b.cone([0.025, 0.035, 0.012], [-0.03 + i * 0.03, 0.12, 0.172], { color: c, rot: [180, 0, (i - 2) * 8], parent: 'rag', edge: 'soft' }));
    return b
      .act({ click: [[A.detach('rag', 'cloth'), A.par(A.effect('water_spray', { dur: 1 }), A.say('Drip, drip...', 1.5))], [A.reattach('rag'), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A floppy rag doll sitting with its legs out (0.36 m): yarn hair in bunches, button eyes, a stitched smile, a
  // patched dress and striped stockings. Its arms are named so the act can lift them for a hug.
  e('ragdoll', 'toys', 'dolls', () => {
    const sk = '#f6dcc4', hair = '#d2452f';
    const b = m('ragdoll')
      .cyl([0.22, 0.15, 0.18], [0, 0.085, 0], { color: '#5d8fd0', taper: 0.55, name: 'body' })
      .box([0.045, 0.045, 0.01], [0.05, 0.08, 0.075], { color: '#f2c14e', round: 0.2, rot: [0, 0, 12], noInk: true })
      .box([0.12, 0.09, 0.09], [0, 0.19, 0], { color: '#5d8fd0', round: 0.5 })
      .box([0.13, 0.03, 0.095], [0, 0.225, 0], { color: 'white', round: 0.5 })
      .ball([0.13, 0.13, 0.12], [0, 0.29, 0], { color: sk, name: 'head' })
      .ball([0.14, 0.07, 0.13], [0, 0.335, -0.01], { color: hair, parent: 'head' })
      .cone([0.02, 0.015, 0.01], [0, 0.285, 0.062], { color: '#e0473b', rot: [-90, 0, 0], parent: 'head' })
      .arc([0.05, 0.03, 0.006], [0, 0.272, 0.056], { color: '#a3322a', rot: [0, 0, 180], tube: 0.15, parent: 'head' });
    b.pair((s) => {
      b.ball([0.06, 0.07, 0.06], [s * 0.075, 0.3, -0.01], { color: hair, parent: 'head' });
      b.ball([0.05, 0.06, 0.05], [s * 0.08, 0.25, -0.01], { color: hair, parent: 'head' });
      b.cyl([0.022, 0.006, 0.022], [s * 0.026, 0.3, 0.06], { color: '#2a2726', rot: [90, 0, 0], parent: 'head' });
      b.ball([0.022, 0.016, 0.008], [s * 0.042, 0.275, 0.055], { color: '#f4a1c0', noInk: true, parent: 'head' });
      b.rod([s * 0.045, 0.03, 0.03], [s * 0.065, 0.03, 0.19], 0.04, 'white');
      b.each(3, (i) => b.cyl([0.043, 0.012, 0.043], [s * (0.05 + i * 0.005), 0.03, 0.07 + i * 0.04], { color: '#e0473b', rot: [90, 0, 0], noInk: true }));
      b.ball([0.05, 0.04, 0.06], [s * 0.066, 0.028, 0.215], { color: '#2a2726' });
      b.rod([s * 0.06, 0.205, 0], [s * 0.1, 0.09, 0.04], 0.03, sk, { name: s > 0 ? 'armL' : 'armR', pivot: [s * 0.06, 0.205, 0] });
      b.ball(0.036, [s * 0.104, 0.08, 0.045], { color: sk, parent: s > 0 ? 'armL' : 'armR' });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('armL', { rot: [-60, 0, 70], dur: 0.5 }), A.pose('armR', { rot: [-60, 0, -70], dur: 0.5 }), A.effect('hearts', { dur: 1.5 })), A.wait(1.5), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.6 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.6 }))],
          [A.par(A.anim('wobble'), A.pose('head', { rot: [0, 0, 18], dur: 0.4 })), A.wait(0.8), A.pose('head', { rot: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A staircase banister: five wooden steps, white balusters, a handrail along the slope, newel posts with ball
  // caps, and a baby gate at the foot of the stairs that swings open and shut.
  e('railing', 'home', 'stairs', () => {
    const b = m('railing', { edge: 'sharp' }), x0 = -0.9, run = 0.28, rise = 0.18, rw = '#7a5230';
    b.each(5, (i) => {
      const a = x0 + i * run, c = x0 + 5 * run + 0.7;
      b.box([c - a, rise, 1.0], [(a + c) / 2, rise * (i + 0.5), 0], { color: i % 2 ? '#c9a36a' : '#c29a62', round: 0.06 });
      b.box([0.02, rise * 0.9, 1.0], [a + 0.01, rise * (i + 0.5), 0], { color: 'white', noInk: true });
    });
    const yRail = (xx: number) => 0.9 + Math.min(5 * rise, Math.max(0, (xx - x0) / run) * rise);
    b.each(10, (j) => {
      const xx = x0 + 0.07 + j * 0.14, yb = (Math.floor((xx - x0) / run) + 1) * rise;
      b.stick([xx, yb, 0.43], [xx, yRail(xx) - 0.02, 0.43], 0.035, 'white');
    });
    b.each(4, (j) => {
      const xx = x0 + 5 * run + 0.12 + j * 0.14;
      b.stick([xx, 5 * rise, 0.43], [xx, yRail(xx) - 0.02, 0.43], 0.035, 'white');
    });
    b.rod([x0 - 0.08, 0.97, 0.43], [x0 + 5 * run, yRail(x0 + 5 * run), 0.43], 0.07, rw, { edge: 'soft' })
      .rod([x0 + 5 * run, yRail(x0 + 5 * run), 0.43], [x0 + 5 * run + 0.62, yRail(x0 + 5 * run), 0.43], 0.07, rw, { edge: 'soft' });
    b.box([0.13, 1.02, 0.13], [x0 - 0.08, 0.51, 0.43], { color: rw, round: 0.15 }).ball(0.15, [x0 - 0.08, 1.08, 0.43], { color: rw, edge: 'soft' });
    b.box([0.13, 1.0, 0.13], [x0 + 5 * run + 0.66, 5 * rise + 0.5, 0.43], { color: rw, round: 0.15 }).ball(0.15, [x0 + 5 * run + 0.66, 5 * rise + 1.06, 0.43], { color: rw, edge: 'soft' });
    // baby gate across the foot of the stairs, hinged on the newel post
    const gx = x0 - 0.2;
    b.box([0.04, 0.72, 0.84], [gx, 0.42, 0.0], { color: 'white', round: 0.2, name: 'gate', pivot: [gx, 0.42, 0.4], mover: { kind: 'swing', axis: 'y', amount: 95 } });
    b.box([0.06, 0.62, 0.74], [gx, 0.42, 0.0], { color: '#f2f2ee', parent: 'gate', round: 0.1 });
    b.each(6, (i) => b.stick([gx + 0.035, 0.12, -0.32 + i * 0.13], [gx + 0.035, 0.72, -0.32 + i * 0.13], 0.025, '#d4d7da', { parent: 'gate' }));
    b.box([0.06, 0.05, 0.12], [gx + 0.02, 0.74, -0.36], { color: '#9da3a8', parent: 'gate' });
    return b
      .act({ click: [[A.operate('gate', 'open'), A.say('Click!', 1)], [A.operate('gate', 'close'), A.say('Click!', 1)]] })
      .done();
  }),
  // A level-crossing signal at its real height: a crossbuck on a 3.8 m mast, a bell, twin red lamps on a crossbar,
  // and a striped barrier arm that drops across the road while the lamps flash and the bell rings.
  e('railroad crossing sign', 'ideas', 'road signs', () => {
    const b = m('railroad crossing sign', { edge: 'sharp' })
      .box([0.6, 0.2, 0.6], [0, 0.1, 0], { color: '#a7a7a0', round: 0.1 })
      .stick([0, 0.2, 0], [0, 3.85, 0], 0.13, '#c9ccd1')
      .dome([0.3, 0.18, 0.3], [0, 3.85, 0.0], { color: 'black' })
      .cyl([0.22, 0.04, 0.22], [0, 3.87, 0], { color: '#5c6166' });
    for (const [t, r] of [['RAILROAD', 40], ['CROSSING', -40]] as Array<[string, number]>) {
      b.box([1.32, 0.26, 0.03], [0, 3.25, 0.1 + (r > 0 ? 0 : 0.02)], { color: 'black', rot: [0, 0, r], round: 0.1 });
      b.label(t, [1.26, 0.2], [0, 3.25, 0.12 + (r > 0 ? 0 : 0.02)], { color: 'white', rot: [0, 0, r], depth: 0.012 });
    }
    b.box([1.3, 0.1, 0.1], [0, 2.4, 0.08], { color: 'black', round: 0.2 }).label('2 TRACKS', [0.7, 0.2], [0, 2.75, 0.09], { color: 'white', depth: 0.015 });
    b.pair((s) => {
      b.cyl([0.46, 0.05, 0.46], [s * 0.48, 2.4, 0.15], { color: 'black', rot: [90, 0, 0] });
      b.cyl([0.3, 0.06, 0.3], [s * 0.48, 2.4, 0.18], { color: '#e8312a', rot: [90, 0, 0], name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light' } });
      b.cyl([0.34, 0.16, 0.34], [s * 0.48, 2.55, 0.26], { color: 'black', rot: [90, 0, 0], taper: 1, segs: 12 });
    });
    b.box([0.8, 0.12, 0.12], [0.4, 1.15, 0.0], { color: '#5c6166', round: 0.1 })
      .box([0.36, 0.55, 0.36], [0.85, 1.1, 0.0], { color: '#5c6166', round: 0.1 })
      .box([0.1, 4.0, 0.07], [0.85, 3.2, 0.24], { color: 'white', round: 0.3, name: 'gate', pivot: [0.85, 1.2, 0.24], mover: { kind: 'swing', axis: 'z', amount: -88 } })
      .box([0.3, 0.3, 0.16], [0.85, 1.05, 0.26], { color: '#5c6166', parent: 'gate' });
    b.each(5, (i) => b.box([0.105, 0.38, 0.075], [0.85, 1.75 + i * 0.75, 0.24], { color: '#e8312a', round: 0.3, parent: 'gate', noInk: true }));
    return b
      .act({
        click: [A.par(A.operate('lamp', 'on'), A.say('Ding ding ding!', 3)), A.operate('gate', 'down'), A.wait(3), A.operate('gate', 'up'), A.operate('lamp', 'off')],
      })
      .done();
  }),
  // Six metres of standard-gauge track (1.435 m between the rails) on a ballast bed: sharp sleepers, steel rails
  // with shiny heads and tie plates. A train rattles past along it.
  e('railroad tracks', 'garage', 'trains', () => {
    const b = m('railroad tracks', { edge: 'sharp' })
      .box([6.4, 0.22, 3.0], [0, 0.11, 0], { color: '#8f8c86', round: 0.5, edge: 'soft' })
      .box([6.2, 0.06, 2.4], [0, 0.22, 0], { color: '#a39f97', round: 0.5, edge: 'soft' });
    b.each(10, (i) => b.box([0.24, 0.16, 2.5], [-2.7 + i * 0.6, 0.29, 0], { color: i % 3 ? '#6a4a30' : '#5e4129', round: 0.12 }));
    b.pair((s) => {
      const z = s * 0.7175;
      b.box([6.2, 0.025, 0.15], [0, 0.385, z], { color: '#5c6166', round: 0.1 })
        .box([6.2, 0.11, 0.03], [0, 0.45, z], { color: '#7a5a48', round: 0.1 })
        .box([6.2, 0.05, 0.075], [0, 0.525, z], { color: '#8f99a3', round: 0.2 })
        .box([6.2, 0.012, 0.06], [0, 0.553, z], { color: '#d4d7da', noInk: true });
      b.each(10, (i) => b.box([0.2, 0.02, 0.26], [-2.7 + i * 0.6, 0.38, z], { color: '#55595e', round: 0.1 }));
    });
    return b
      .act({ click: [A.spawn('train', 'train', { rel: 'left', of: 'self', dist: 'near' }), A.par(A.move('train', { rel: 'right', of: 'self', dist: 'near' }, { speed: 'run' }), A.say('Clickety-clack!', 2.5), A.anim('shake')), A.remove('train', 'fade')] })
      .done();
  }),
  // A yellow rain slicker hanging from a coat stand (1.75 m): a hood down its back, toggle clasps, flapped pockets
  // and sleeves hanging straight. Click: it rains, and the coat shakes the water off.
  e('raincoat', 'wardrobe', 'coats', () => {
    const y = '#f6c92e', d = '#d9a91c';
    const b = m('raincoat')
      .cyl([0.4, 0.03, 0.4], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.03, -0.06], [0, 1.72, -0.06], 0.04, '#3a3633', { edge: 'sharp' })
      .arc([0.12, 0.08, 0.015], [0, 1.72, -0.03], { color: '#3a3633', rot: [0, 90, 0], arc: 220, tube: 0.2, edge: 'sharp' })
      .rod([-0.2, 1.6, -0.03], [0.2, 1.6, -0.03], 0.02, 'wood', { edge: 'sharp' })
      .cyl([0.62, 1.0, 0.3], [0, 1.0, 0], { color: y, taper: 0.72, name: 'coat' })
      .ball([0.52, 0.16, 0.26], [0, 1.53, 0], { color: y, parent: 'coat' })
      .ball([0.32, 0.3, 0.2], [0, 1.45, -0.14], { color: y, parent: 'coat' })
      .box([0.2, 0.1, 0.05], [0, 1.57, 0.1], { color: d, round: 0.5, parent: 'coat' })
      .box([0.016, 0.92, 0.01], [0, 1.0, 0.152], { color: d, noInk: true, parent: 'coat' });
    b.each(4, (i) => b.box([0.06, 0.018, 0.02], [0.0, 0.7 + i * 0.2, 0.16], { color: '#2a2726', round: 0.4, parent: 'coat' }));
    b.pair((s) => {
      b.rod([s * 0.24, 1.48, 0], [s * 0.33, 0.82, 0.03], 0.14, y, { parent: 'coat' });
      b.cyl([0.13, 0.05, 0.13], [s * 0.335, 0.8, 0.03], { color: d, rot: [0, 0, s * 8], parent: 'coat' });
      b.box([0.15, 0.04, 0.03], [s * 0.15, 0.82, 0.15], { color: d, round: 0.4, parent: 'coat' });
      b.box([0.14, 0.13, 0.015], [s * 0.15, 0.76, 0.145], { color: y, round: 0.3, parent: 'coat', noInk: true });
    });
    return b.act({ click: [A.effect('rain', { dur: 3 }), A.wait(2.5), A.par(A.anim('shake'), A.effect('water_spray', { dur: 1 }), A.say('Pitter-patter!', 1.5))] }).done();
  }),
  // A raindrop about to fall from the tip of a leaf (the drop is its real 1 cm; the leaf makes it findable).
  // The drop is a piece: it lets go and falls, and the next click a new one gathers.
  e('raindrop', 'nature', 'water', () =>
    m('raindrop')
      .stick([0, 0, -0.07], [0, 0.04, -0.05], 0.004, '#3f7a3a')
      .ball([0.065, 0.006, 0.12], [0, 0.05, 0.0], { color: '#5aa553', rot: [-12, 0, 0], name: 'leaf' })
      .stick([0, 0.044, -0.055], [0, 0.064, 0.055], 0.003, '#8fc76a', { parent: 'leaf', noInk: true })
      .ball([0.012, 0.012, 0.012], [0, 0.056, 0.068], { color: '#8fd0f5', name: 'drop', parent: 'leaf', piece: true })
      .cone([0.011, 0.01, 0.011], [0, 0.065, 0.068], { color: '#8fd0f5', parent: 'drop', rot: [0, 0, 0] })
      .ball(0.003, [-0.002, 0.058, 0.074], { color: 'white', noInk: true, parent: 'drop' })
      .act({ click: [[A.detach('drop', 'drip'), A.say('Plip!', 1)], [A.reattach('drop'), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // A little red box of raisins (9 cm) with a sun on the front and a flip-top lid; a few wrinkly raisins spilled
  // in front. Click: the lid flips open and a raisin hops out.
  e('raisin', 'food', 'dried fruit', () => {
    const r = '#4a2a3a';
    const b = m('raisin', { edge: 'sharp' })
      .box([0.066, 0.088, 0.036], [0, 0.044, 0], { color: '#d8312a', round: 0.08, name: 'box' })
      .cyl([0.04, 0.004, 0.04], [0, 0.055, 0.019], { color: '#f6d24a', rot: [90, 0, 0], noInk: true, parent: 'box' })
      .label('RAISINS', [0.058, 0.014], [0, 0.016, 0.019], { color: '#d8312a', depth: 0.003, parent: 'box' })
      .box([0.066, 0.004, 0.036], [0, 0.09, 0], { color: '#d8312a', round: 0.1, name: 'lid', parent: 'box', pivot: [0, 0.09, -0.018], mover: { kind: 'swing', axis: 'x', amount: -115 } })
      .box([0.058, 0.006, 0.028], [0, 0.085, 0], { color: r, round: 0.5, edge: 'soft' })
      .ball([0.016, 0.012, 0.014], [0.006, 0.09, 0.004], { color: r, name: 'raisin', parent: 'box', piece: true, edge: 'soft' });
    for (const [xx, z, a] of [[0.05, 0.03, 20], [0.07, 0.0, -30], [0.035, 0.06, 60], [0.075, 0.045, 0], [-0.045, 0.05, 45]]) b.ball([0.017, 0.011, 0.013], [xx, 0.0055, z], { color: r, rot: [0, a, 0], edge: 'soft' });
    return b.act({ click: [[A.operate('lid', 'open'), A.detach('raisin', 'r'), A.say('Pop!', 1)], [A.reattach('raisin'), A.operate('lid', 'close')]] }).done();
  }),
  // A bow rake standing on its steel head (1.55 m) beside a heap of autumn leaves: click and it rakes them into
  // a bigger pile; click again and the wind scatters them.
  e('rake', 'garden', 'garden tools', () => {
    const b = m('rake')
      .stick([0, 0.06, 0], [0, 1.55, 0], 0.035, 'lightwood', { name: 'rake', pivot: [0, 0.02, 0] })
      .box([0.42, 0.035, 0.035], [0, 0.07, 0.02], { color: '#5c6166', parent: 'rake', edge: 'sharp', round: 0.2 })
      .cyl([0.05, 0.06, 0.05], [0, 0.1, 0], { color: '#5c6166', parent: 'rake', edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.2, 0.08, 0.02], [s * 0.03, 0.2, 0.0], 0.014, '#5c6166', { parent: 'rake', edge: 'sharp' }));
    b.each(12, (i) => b.stick([-0.19 + i * 0.0345, 0.07, 0.03], [-0.19 + i * 0.0345, 0.005, 0.065], 0.012, '#5c6166', { parent: 'rake', edge: 'sharp' }));
    b.ball([0.6, 0.22, 0.45], [0.55, 0.07, 0.3], { color: '#d9792a', name: 'pile' });
    for (const [xx, z, c, a] of [[0.4, 0.42, '#e0473b', 30], [0.7, 0.4, '#f2c14e', -20], [0.55, 0.2, '#a3322a', 70], [0.3, 0.25, '#f0923b', 10], [0.8, 0.22, '#e2b23a', 50]] as Array<[number, number, string, number]>)
      b.ball([0.09, 0.015, 0.06], [xx, 0.12 + (xx % 0.2) * 0.2, z], { color: c, rot: [10, a, 0], parent: 'pile', noInk: true });
    return b
      .act({
        click: [
          [A.pose('rake', { rot: [22, 0, -8], dur: 0.35 }), A.pose('rake', { rot: [0, 0, 0], dur: 0.35 }), A.par(A.pose('pile', { scale: 1.35, dur: 0.4 }), A.effect('dust', { dur: 1 }), A.say('Scritch, scratch!', 1.5))],
          [A.par(A.effect('dust', { dur: 1.2 }), A.pose('pile', { scale: 1, dur: 0.5 }), A.say('Whoosh!', 1.2))],
        ],
      })
      .done();
  }),
  // A skate-park quarter pipe (1.6 m transition, 2.4 m wide): a curved plywood face built from slats, a steel
  // coping pipe at the lip, a deck on posts with a safety rail. A skateboard rolls in and pops off the lip.
  e('ramp', 'sports', 'skate park', () => {
    const b = m('ramp', { edge: 'sharp' }), R = 1.6, W = 2.4, zc = 0.6, n = 9;
    b.each(n, (i) => {
      const ph = ((i + 0.5) / n) * 90 * D2R;
      b.box([W, 0.04, R * (Math.PI / 2 / n) + 0.04], [0, R - R * Math.cos(ph), zc - R * Math.sin(ph)], { color: i % 2 ? '#d1ad74' : '#c9a36a', rot: [(ph / D2R), 0, 0], round: 0.1 });
    });
    b.pair((s) => {
      b.each(6, (k) => {
        const yy = (k + 0.5) * (R / 6), zz = zc - Math.sqrt(Math.max(0, R * R - (R - yy) * (R - yy)));
        const back = zc - R - 1.1;
        b.box([0.05, R / 6 + 0.01, zz - back], [s * (W / 2 + 0.02), yy, (zz + back) / 2], { color: '#9a7448', round: 0.05 });
      });
    });
    b.box([W + 0.1, 0.07, 1.15], [0, R + 0.02, zc - R - 0.55], { color: '#b5814e', round: 0.1 })
      .stick([-W / 2 - 0.05, R + 0.04, zc - R + 0.02], [W / 2 + 0.05, R + 0.04, zc - R + 0.02], 0.06, '#c9ccd1');
    b.pair((s) => {
      b.stick([s * (W / 2 - 0.1), 0, zc - R - 1.05], [s * (W / 2 - 0.1), R, zc - R - 1.05], 0.08, '#7a5230');
      b.stick([s * (W / 2), R + 0.05, zc - R - 1.08], [s * (W / 2), R + 1.0, zc - R - 1.08], 0.05, '#8f99a3');
    });
    b.stick([-W / 2, R + 1.0, zc - R - 1.08], [W / 2, R + 1.0, zc - R - 1.08], 0.05, '#8f99a3').stick([-W / 2, R + 0.55, zc - R - 1.08], [W / 2, R + 0.55, zc - R - 1.08], 0.04, '#8f99a3');
    b.socket('deck', [0, R + 0.06, zc - R - 0.55], 'top', { size: 1 });
    return b
      .act({ click: [A.spawn('board', 'skateboard', { rel: 'front', of: 'self', dist: 'near' }), A.move('board', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run', style: 'slide' }), A.par(A.anim('hop', 2, 'board'), A.say('Clack!', 1)), A.remove('board', 'fade')] })
      .done();
  }),
  // A raspberry bush (1.5 m): arching brown canes, soft clumps of leaves, red berries in clusters. One ripe berry
  // is a piece you can pick (and it grows back).
  e('raspberry bush', 'garden', 'berry bushes', () => {
    const b = m('raspberry bush');
    b.each(7, (i) => {
      const a = (i / 7) * Math.PI * 2, rx = Math.cos(a), rz = Math.sin(a);
      b.rod([rx * 0.08, 0, rz * 0.08], [rx * 0.3, 1.1, rz * 0.25], 0.035, '#8a5a3a').rod([rx * 0.3, 1.1, rz * 0.25], [rx * 0.6, 0.85, rz * 0.5], 0.03, '#8a5a3a');
    });
    b.ball([1.3, 0.75, 1.1], [0, 0.85, 0], { color: '#4f9a48', name: 'top' })
      .ball([0.75, 0.55, 0.65], [0.35, 1.22, 0.05], { color: '#3f7a3a', parent: 'top' })
      .ball([0.7, 0.5, 0.6], [-0.38, 1.15, -0.05], { color: '#5aa553', parent: 'top' })
      .ball([0.6, 0.45, 0.5], [0.0, 0.62, 0.32], { color: '#4a8f42', parent: 'top' })
      .ball([0.5, 0.4, 0.45], [-0.15, 1.35, 0.1], { color: '#5aa553', parent: 'top' });
    b.each(26, (i) => b.ball([0.035, 0.04, 0.035], surf([0, 0.88, 0.02], [0.66, 0.42, 0.56], -115 + ((i * 41) % 230), -25 + ((i * 29) % 70)), { color: i % 4 ? '#c8243c' : '#e0566a', parent: 'top', edge: 'soft' }));
    b.ball([0.04, 0.045, 0.04], surf([0, 0.88, 0.02], [0.67, 0.43, 0.57], 10, 10), { color: '#d42a44', name: 'berry', parent: 'top', piece: true });
    return b.act({ click: [[A.detach('berry', 'picked'), A.say('Pick!', 1)], [A.reattach('berry'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A baby's rattle (15 cm): a striped ball on a chunky handle with a ring of bright beads that spin as it shakes.
  e('rattle (baby)', 'toys', 'baby toys', () =>
    m('rattle (baby)')
      .ball([0.04, 0.025, 0.04], [0, 0.0125, 0], { color: '#6fd3e8' })
      .capsule([0.024, 0.08, 0.024], [0, 0.06, 0], { color: '#f6d24a' })
      .ball(0.07, [0, 0.12, 0], { color: '#f4a1c0', name: 'ball' })
      .torus([0.071, 0.071, 0.012], [0, 0.12, 0], { color: 'white', rot: [90, 0, 0], tube: 0.15, parent: 'ball', noInk: true })
      .torus([0.1, 0.1, 0.006], [0, 0.12, 0], { color: '#c9ccd1', rot: [0, 0, 0], tube: 0.08, name: 'beads' })
      .ball(0.018, [0.0, 0.17, 0], { color: '#e0473b', parent: 'beads' })
      .ball(0.018, [0.043, 0.145, 0], { color: '#f6d24a', parent: 'beads' })
      .ball(0.018, [0.043, 0.095, 0], { color: '#5aa553', parent: 'beads' })
      .ball(0.018, [0, 0.07, 0], { color: '#4e8fd6', parent: 'beads' })
      .ball(0.018, [-0.043, 0.095, 0], { color: '#8a5fc4', parent: 'beads' })
      .ball(0.018, [-0.043, 0.145, 0], { color: '#f0923b', parent: 'beads' })
      .act({ click: [A.par(A.anim('shake', 2), A.pose('beads', { rot: [0, 0, 360], dur: 0.8 }), A.say('Rattle rattle!', 1.5)), A.pose('beads', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A plate of ravioli in tomato sauce with basil and parmesan; a fork lifts one ravioli in a puff of steam.
  e('ravioli', 'food', 'pasta', () => {
    const p = '#f2d98a';
    const b = m('ravioli')
      .cyl([0.26, 0.018, 0.26], [0, 0.009, 0], { color: 'white', taper: 1.12 })
      .cyl([0.2, 0.01, 0.2], [0, 0.02, 0], { color: '#c8402f', noInk: true });
    for (const [xx, z, a] of [[0.045, 0.04, 10], [-0.05, 0.035, -15], [0.05, -0.045, 25], [-0.04, -0.05, 5], [0, 0.0, 40]] as Array<[number, number, number]>) {
      b.box([0.06, 0.008, 0.06], [xx, 0.027, z], { color: p, round: 0.2, rot: [0, a, 0], edge: 'sharp' }).ball([0.042, 0.022, 0.042], [xx, 0.034, z], { color: p, rot: [0, a, 0] });
    }
    b.ball([0.04, 0.006, 0.022], [0.01, 0.05, 0.01], { color: '#3f7a3a', rot: [0, 30, 0], noInk: true });
    b.each(8, (i) => b.ball(0.006, [Math.cos(i * 2.3) * 0.05, 0.047, Math.sin(i * 2.3) * 0.05], { color: '#fff3d6', noInk: true }));
    b.rod([0.14, 0.03, 0.09], [0.08, 0.06, -0.02], 0.009, '#c9ccd1', { name: 'fork', pivot: [0.14, 0.03, 0.09], edge: 'sharp' })
      .box([0.025, 0.004, 0.035], [0.075, 0.062, -0.035], { color: '#c9ccd1', parent: 'fork', rot: [0, 30, 0], edge: 'sharp' })
      .box([0.045, 0.012, 0.045], [0.075, 0.07, -0.035], { color: p, round: 0.5, parent: 'fork' });
    return b.act({ click: [A.par(A.pose('fork', { rot: [0, 0, 25], move: [0, 0.06, 0], dur: 0.6 }), A.effect('steam', { dur: 2.5 })), A.wait(1.5), A.pose('fork', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A butterfly safety razor (10 cm) standing on its knurled handle: twist the knob and the two doors of the head
  // open to take a blade.
  e('razor', 'home', 'bathroom', () => {
    const b = m('razor', { edge: 'sharp' })
      .cyl([0.022, 0.012, 0.022], [0, 0.006, 0], { color: '#c9ccd1' })
      .cyl([0.017, 0.075, 0.017], [0, 0.048, 0], { color: '#8f99a3' });
    b.pair((s) => b.cyl([0.0185, 0.006, 0.0185], [0, 0.048 + s * 0.03, 0], { color: '#b9c2ca', noInk: true }));
    b.cyl([0.014, 0.012, 0.014], [0, 0.091, 0], { color: '#c9ccd1' })
      .box([0.048, 0.006, 0.02], [0, 0.1, 0], { color: '#c9ccd1', round: 0.3 })
      .box([0.044, 0.002, 0.022], [0, 0.104, 0], { color: '#eef2f5', noInk: true });
    b.pair((s) =>
      b.box([0.024, 0.008, 0.022], [s * 0.012, 0.108, 0], { color: '#d4d7da', round: 0.5, name: s > 0 ? 'doorL' : 'doorR', pivot: [0, 0.106, 0], mover: { kind: 'swing', axis: 'z', amount: s * 70 } }),
    );
    return b.act({ click: [[A.operate('door', 'open'), A.say('Click!', 1)], [A.operate('door', 'close'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A nuclear power station (built smaller than life, 34 m): a concrete cooling tower with its waisted shape, the
  // domed containment building with a radiation sign, the turbine hall and an office. Steam rises; a warning
  // lamp on the dome lights.
  e('reactor', 'places', 'power plants', () => {
    const b = m('reactor', { edge: 'sharp' })
      .box([44, 0.3, 30], [2, 0.15, 0], { color: '#a7a7a0', round: 0.02 })
      .cyl([24, 22, 24], [-11, 11.3, -5], { color: '#d4d7da', taper: 0.66, edge: 'soft' })
      .cyl([15.8, 12, 15.8], [-11, 28.2, -5], { color: '#d4d7da', taper: 1.12, edge: 'soft' })
      .cyl([17.4, 0.6, 17.4], [-11, 34.2, -5], { color: '#c4c7ca', edge: 'soft' })
      .cyl([14.5, 0.5, 14.5], [-11, 34.3, -5], { color: '#5c6166' });
    b.each(8, (i) => b.box([1.2, 2.4, 1.2], [-11 + Math.cos(i * 0.785) * 11, 1.4, -5 + Math.sin(i * 0.785) * 11], { color: '#9da3a8', round: 0.1 }));
    b.cyl([16, 14, 16], [8, 7.3, 4], { color: '#e8e4dc' })
      .dome([16, 8, 16], [8, 14.3, 4], { color: '#e8e4dc', edge: 'soft' })
      .cyl([0.8, 0.5, 0.8], [8, 22.5, 4], { color: '#5c6166' })
      .ball(0.9, [8, 23.1, 4], { color: '#e8312a', name: 'lamp', mover: { kind: 'light' } })
      .cyl([3.4, 0.12, 3.4], [8, 9, 12.05], { color: '#f6d24a', rot: [90, 0, 0] });
    b.each(3, (i) => b.cone([0.9, 0.8, 0.1], [8 + Math.sin(i * 2.094) * 0.75, 9 + Math.cos(i * 2.094) * 0.75, 12.12], { color: '#2a2726', rot: [0, 0, 180 - i * 120], noInk: true }));
    b.cyl([0.5, 0.14, 0.5], [8, 9, 12.14], { color: '#2a2726', rot: [90, 0, 0] });
    b.box([16, 11, 12], [16, 5.65, -9], { color: '#9fb4c4', round: 0.02 }).box([16.4, 0.5, 12.4], [16, 11.4, -9], { color: '#5c6166' });
    b.each(5, (i) => win(b, [9.6 + i * 3.2, 8, -2.95], 2.2, 3.2, { frame: '#5c6166', bars: false, sill: false }));
    b.box([10, 4, 5], [-4, 2.3, 9], { color: '#e8e4dc', round: 0.03 });
    b.each(4, (i) => win(b, [-7.6 + i * 2.4, 2.6, 11.53], 1.4, 1.2, { frame: '#5c6166' }));
    door(b, [-4, 1.4, 11.53], 1.2, 2.2, '#3f6f9a', { glass: true });
    b.label('POWER STATION', [6, 0.8], [-4, 3.8, 11.55], { color: 'white', depth: 0.06 });
    b.stick([22, 0.3, 4], [22, 30, 4], 1.6, '#c9ccd1').box([1.8, 1, 1.8], [22, 25, 4], { color: '#e8312a', round: 0.1 });
    return b.act({ click: [[A.operate('lamp', 'on'), A.par(A.effect('steam', { dur: 4 }), A.say('Hmmmmmm...', 2.5))], [A.operate('lamp', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A car's rear-view mirror on its windscreen mount (a patch of windscreen behind it): the mirror tilts on its
  // ball joint, and the day/night tab flips.
  e('rear view mirror', 'garage', 'car parts', () =>
    m('rear view mirror', { edge: 'sharp' })
      .box([0.05, 0.03, 0.02], [0, 0.29, -0.09], { color: '#2a2726', round: 0.3, rot: [-25, 0, 0] })
      .rod([0, 0.28, -0.08], [0, 0.17, -0.02], 0.016, '#2a2726')
      .box([0.26, 0.075, 0.04], [0, 0.14, 0], { color: '#2a2726', round: 0.6, name: 'mirror', pivot: [0, 0.16, -0.02], mover: { kind: 'swing', axis: 'y', amount: 18 } })
      .box([0.245, 0.06, 0.01], [0, 0.14, 0.022], { color: '#cfe8f4', round: 0.6, parent: 'mirror' })
      .box([0.06, 0.008, 0.01], [-0.06, 0.145, 0.026], { color: 'white', noInk: true, parent: 'mirror', rot: [0, 0, 20] })
      .box([0.03, 0.016, 0.02], [0, 0.095, 0.0], { color: '#3a3633', parent: 'mirror', name: 'tab', pivot: [0, 0.103, 0], mover: { kind: 'swing', axis: 'x', amount: 30 } })
      .act({ click: [[A.operate('mirror'), A.say('Click!', 1)], [A.operate('tab'), A.operate('mirror')]] })
      .done(),
  ),
  // An overstuffed leather recliner at real size (seat 0.47 m): rolled arms, a pillow back that tips back, and a
  // footrest that flips up when you pull the side handle.
  e('recliner', 'home', 'seating', () => {
    const c = '#7a4a2e', c2 = '#8c5a38';
    const b = m('recliner')
      .box([0.96, 0.28, 0.86], [0, 0.22, 0], { color: c, round: 0.4 })
      .box([0.62, 0.16, 0.66], [0, 0.42, 0.05], { color: c2, round: 0.6 })
      .box([0.7, 0.72, 0.26], [0, 0.8, -0.32], { color: c, round: 0.5, name: 'back', pivot: [0, 0.45, -0.3], mover: { kind: 'swing', axis: 'x', amount: -28 } })
      .box([0.58, 0.22, 0.16], [0, 1.05, -0.2], { color: c2, round: 0.8, parent: 'back' })
      .box([0.58, 0.26, 0.14], [0, 0.72, -0.18], { color: c2, round: 0.8, parent: 'back' })
      .box([0.6, 0.3, 0.08], [0, 0.22, 0.45], { color: c2, round: 0.4, name: 'footrest', pivot: [0, 0.36, 0.45], mover: { kind: 'swing', axis: 'x', amount: -82 } });
    b.pair((s) => {
      b.box([0.17, 0.5, 0.86], [s * 0.4, 0.42, 0.0], { color: c, round: 0.5 });
      b.capsule([0.21, 0.86, 0.2], [s * 0.41, 0.66, 0.0], { color: c2, rot: [90, 0, 0] });
      b.box([0.06, 0.05, 0.06], [s * 0.36, 0.03, 0.34], { color: '#3a2a1e', edge: 'sharp' }).box([0.06, 0.05, 0.06], [s * 0.36, 0.03, -0.34], { color: '#3a2a1e', edge: 'sharp' });
    });
    b.box([0.03, 0.09, 0.04], [0.5, 0.5, 0.26], { color: '#5a3a22', edge: 'sharp', round: 0.4 });
    return b
      .socket('seat', [0, 0.5, 0.05], 'seat')
      .act({ click: [[A.par(A.operate('footrest', 'open'), A.operate('back', 'open')), A.say('Ahhh...', 1.5)], [A.par(A.operate('footrest', 'close'), A.operate('back', 'close')), A.say('Clunk!', 1)]] })
      .done();
  }),
  // A vinyl LP (30 cm) half out of its printed sleeve: the record slides out and spins, then goes back.
  e('record', 'music', 'audio', () => {
    const b = m('record', { edge: 'sharp' })
      .box([0.315, 0.315, 0.008], [-0.06, 0.158, 0], { color: '#7a4fb0', round: 0.05 })
      .cyl([0.17, 0.004, 0.17], [-0.06, 0.18, 0.005], { color: '#f6d24a', rot: [90, 0, 0], noInk: true })
      .cyl([0.08, 0.005, 0.08], [-0.06, 0.18, 0.006], { color: '#e0473b', rot: [90, 0, 0], noInk: true })
      .label('GREATEST HITS', [0.26, 0.04], [-0.06, 0.04, 0.006], { color: '#7a4fb0', depth: 0.003 })
      .cyl([0.3, 0.003, 0.3], [0.03, 0.155, -0.007], { color: '#1e1c1b', rot: [90, 0, 0], name: 'disc', mover: { kind: 'slide', axis: 'x', amount: 0.17 } })
      .torus([0.27, 0.27, 0.003], [0.03, 0.155, -0.005], { color: '#3a3633', tube: 0.02, noInk: true, parent: 'disc' })
      .torus([0.2, 0.2, 0.003], [0.03, 0.155, -0.005], { color: '#3a3633', tube: 0.025, noInk: true, parent: 'disc' })
      .cyl([0.1, 0.004, 0.1], [0.03, 0.155, -0.005], { color: '#e0473b', rot: [90, 0, 0], name: 'centre', parent: 'disc', mover: { kind: 'spin', axis: 'z', amount: 200 } })
      .box([0.1, 0.022, 0.0015], [0.03, 0.155, -0.0035], { color: 'white', noInk: true, parent: 'centre' })
      .cyl([0.008, 0.005, 0.008], [0.03, 0.155, -0.004], { color: 'black', rot: [90, 0, 0], parent: 'centre' });
    return b.act({ click: [[A.operate('disc', 'out'), A.operate('centre', 'on'), A.say('♪ ♫ ♪', 2)], [A.operate('centre', 'off'), A.operate('disc', 'in')]] }).done();
  }),
  // A record shop (7 m frontage): purple walls, a striped awning, sleeves in the window, and a giant spinning
  // record on the roof. Click: the door opens and the rooftop record starts to turn.
  e('record store', 'places', 'shops', () => {
    const b = shop('record store', { w: 7, h: 4.6, d: 7, wall: '#6a3fa0', trim: '#f6d24a', sign: 'RECORDS', signBg: '#2a2726', awning: ['#2a2726', '#f6d24a'] });
    b.each(4, (i) => b.box([0.42, 0.42, 0.02], [(i < 2 ? -2.6 : 1.4) + (i % 2) * 0.55, 1.35, 3.57], { color: ['#e0473b', '#4e8fd6', '#5aa553', '#f0923b'][i], round: 0.1, noInk: true }));
    b.stick([0, 4.9, 1.5], [0, 5.6, 1.5], 0.2, '#5c6166')
      .cyl([2.6, 0.12, 2.6], [0, 6.3, 1.5], { color: '#1e1c1b', rot: [90, 0, 0], name: 'disc', pivot: [0, 6.3, 1.5], mover: { kind: 'spin', axis: 'z', amount: 120 } })
      .cyl([0.9, 0.14, 0.9], [0, 6.3, 1.5], { color: '#e0473b', rot: [90, 0, 0], parent: 'disc' })
      .box([0.9, 0.16, 0.02], [0, 6.3, 1.58], { color: '#f6d24a', parent: 'disc', noInk: true })
      .torus([2.0, 2.0, 0.13], [0, 6.3, 1.5], { color: '#3a3633', tube: 0.03, parent: 'disc', noInk: true });
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.operate('disc', 'on'), A.say('♪ Now playing! ♪', 2)), A.wait(2.5), A.operate('door', 'close')], [A.operate('disc', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A tow truck at real size: 8 m long, cab roof 3.1 m, so a person reaches the door handle. Sharp painted body
  // and glass, soft tyres on three axles (twin rears), doors that open, a boom that lifts its hook, and an amber
  // light bar that flashes.
  e('recovery vehicle', 'garage', 'trucks', () => {
    const o = '#f0a020', b = m('recovery vehicle', { view: 'side', edge: 'sharp' });
    b.box([1.0, 0.3, 7.9], [0, 0.95, -0.1], { color: '#2a2726', round: 0.1 })
      .loft([2.3, 1.0, 1.5], [0, 1.52, 3.2], [[0, 1, 1, 0], [0.7, 1, 0.98, 0], [1, 0.92, 0.9, -0.03]], { color: o, boxy: 0.85 })
      .box([2.45, 2.05, 1.75], [0, 2.08, 1.62], { color: o, round: 0.1 })
      .box([2.2, 0.9, 0.05], [0, 2.55, 2.5], { color: '#9fd0ea', rot: [-8, 0, 0], round: 0.1 })
      .box([1.6, 0.66, 0.05], [0, 1.48, 3.96], { color: '#3a3633', round: 0.1 })
      .box([2.5, 0.3, 0.26], [0, 0.95, 4.05], { color: '#c9ccd1', round: 0.2 });
    b.each(4, (i) => b.box([1.5, 0.04, 0.03], [0, 1.25 + i * 0.14, 3.99], { color: '#c9ccd1', noInk: true }));
    b.pair((s) => {
      const nm = s > 0 ? 'doorL' : 'doorR';
      b.ball([0.32, 0.26, 0.08], [s * 0.85, 1.58, 3.96], { color: '#fff6c8', name: s > 0 ? 'lightsL' : 'lightsR', mover: { kind: 'light' } });
      b.box([0.05, 1.8, 1.4], [s * 1.235, 2.0, 1.6], { color: o, round: 0.1, name: nm, pivot: [s * 1.235, 2.0, 2.3], mover: { kind: 'swing', axis: 'y', amount: s * -70 } })
        .box([0.06, 0.72, 1.05], [s * 1.25, 2.55, 1.65], { color: '#9fd0ea', round: 0.1, parent: nm })
        .box([0.04, 0.05, 0.18], [s * 1.27, 2.0, 1.1], { color: '#3a3633', parent: nm })
        .label('TOWING', [0.9, 0.22], [s * 1.26, 1.62, 1.6], { color: 'white', rot: [0, s * 90, 0], depth: 0.01, parent: nm });
      b.box([0.4, 0.08, 0.55], [s * 1.12, 0.95, 1.6], { color: '#8f99a3' });
      b.arc([1.3, 0.68, 0.4], [s * 1.04, 0.5, 3.0], { color: o, rot: [0, 90, 0], tube: 0.12 });
      b.rod([s * 1.24, 2.7, 2.35], [s * 1.5, 2.6, 2.4], 0.04, '#3a3633').box([0.06, 0.4, 0.2], [s * 1.52, 2.45, 2.4], { color: '#3a3633', round: 0.2 });
      b.box([0.5, 0.6, 1.1], [s * 0.98, 0.95, 0.15], { color: '#c9ccd1', round: 0.08 });
      b.box([0.6, 0.1, 2.5], [s * 1.0, 1.08, -2.1], { color: '#3a3633' });
      b.box([0.08, 0.18, 0.3], [s * 1.1, 1.15, -3.95], { color: '#e0473b', glow: true });
    });
    b.box([1.6, 0.14, 0.32], [0, 3.18, 1.75], { color: '#2a2726' })
      .box([0.5, 0.16, 0.28], [0.5, 3.3, 1.75], { color: '#ffb020', name: 'beacon1', mover: { kind: 'light' } })
      .box([0.5, 0.16, 0.28], [-0.5, 3.3, 1.75], { color: '#ffb020', name: 'beacon2', mover: { kind: 'light' } })
      .stick([0.95, 1.9, 0.62], [0.95, 3.45, 0.62], 0.14, '#c9ccd1')
      .box([2.45, 0.26, 4.6], [0, 1.25, -1.65], { color: '#3a3f45', round: 0.05 })
      .label('24/7 RECOVERY', [2.2, 0.22], [1.24, 1.25, -1.65], { color: '#f6d24a', rot: [0, 90, 0], depth: 0.01 })
      .box([0.9, 0.7, 0.9], [0, 1.73, -0.1], { color: o, round: 0.08 })
      .rod([0, 1.95, -0.1], [0, 3.55, -3.4], 0.32, o, { name: 'boom', pivot: [0, 1.95, -0.1], mover: { kind: 'swing', axis: 'x', amount: 14 } })
      .cyl([0.3, 0.36, 0.3], [0, 3.55, -3.45], { color: '#3a3633', rot: [0, 0, 90], parent: 'boom' })
      .rod([0, 1.45, -0.8], [0, 2.35, -1.55], 0.14, '#c9ccd1', { parent: 'boom' })
      .stick([0, 3.45, -3.6], [0, 1.95, -3.6], 0.025, '#2a2726', { parent: 'boom' })
      .arc([0.26, 0.26, 0.05], [0, 1.82, -3.6], { color: '#8f99a3', rot: [0, 0, 180], arc: 270, tube: 0.25, parent: 'boom' })
      .box([1.8, 0.12, 0.2], [0, 0.65, -4.2], { color: o, round: 0.2 });
    b.pair((s) => b.box([0.18, 0.18, 0.4], [s * 0.75, 0.6, -4.35], { color: '#3a3633', round: 0.2 }));
    axle(b, 'F', 3.0, 2.05, 1.0, 0.32);
    axle(b, 'B', -1.5, 1.85, 1.0, 0.55);
    axle(b, 'C', -2.7, 1.85, 1.0, 0.55);
    return b
      .socket('seat', [0.55, 1.8, 1.6], 'seat')
      .act({
        click: [
          [A.par(A.operate('beacon', 'on'), A.operate('lights', 'on'), A.operate('boom', 'up'), A.say('Beep beep beep!', 2))],
          [A.par(A.operate('boom', 'down'), A.operate('beacon', 'off'), A.operate('lights', 'off')), A.operate('doorL', 'open'), A.wait(2), A.operate('doorL', 'close')],
        ],
      })
      .done();
  }),
  // A rectangle: a flat blue tile with a darker border on a little wooden plinth.
  e('rectangle', 'ideas', 'shapes', () =>
    plinth(m('rectangle', { edge: 'sharp' }), 0.12)
      .box([0.16, 0.09, 0.016], [0, 0.07, 0], { color: '#2f6fb5', round: 0.06, name: 'shape' })
      .box([0.14, 0.07, 0.006], [0, 0.07, 0.009], { color: '#4e8fd6', round: 0.06, noInk: true, parent: 'shape' })
      .act({ click: [A.par(A.anim('spin'), A.say('Four sides, four square corners!', 2.5))] })
      .done(),
  ),
  // A recycling sign on a post (2.1 m): white board, green rim, the three chasing arrows, which turn when clicked.
  e('recycle sign', 'ideas', 'symbols', () => {
    const b = m('recycle sign', { edge: 'sharp' })
      .box([0.4, 0.1, 0.4], [0, 0.05, 0], { color: '#a7a7a0' })
      .stick([0, 0.1, -0.05], [0, 1.95, -0.05], 0.07, '#c9ccd1')
      .box([0.95, 0.95, 0.04], [0, 1.55, 0.0], { color: '#2e9e4f', round: 0.12 })
      .box([0.86, 0.86, 0.04], [0, 1.55, 0.012], { color: 'white', round: 0.12 })
      .cyl([0.08, 0.02, 0.08], [0, 1.56, 0.04], { color: 'white', rot: [90, 0, 0], name: 'arrows', mover: { kind: 'spin', axis: 'z', amount: 90 }, noInk: true });
    arrows3(b, [0, 1.56, 0.045], 0.62, '#2e9e4f', { parent: 'arrows' });
    return b.act({ click: [[A.operate('arrows', 'on'), A.say('Reduce, reuse, recycle!', 2.5)], [A.operate('arrows', 'off')]] }).done();
  }),
  // A blue wheelie bin for recycling (1.05 m): a lid hinged at the back that opens, a handle bar and two wheels.
  // Click: the lid lifts, an empty tin goes in, clunk, and it shuts.
  e('recycling bin', 'home', 'bins', () => {
    const b = m('recycling bin', { edge: 'sharp' })
      .box([0.58, 0.92, 0.7], [0, 0.5, 0], { color: '#3f7ac4', round: 0.1 })
      .box([0.6, 0.06, 0.1], [0, 0.9, 0.33], { color: '#2f5f9f', round: 0.3 })
      .box([0.64, 0.06, 0.78], [0, 0.99, 0.0], { color: '#2f5f9f', round: 0.25, name: 'lid', pivot: [0, 0.99, -0.38], mover: { kind: 'swing', axis: 'x', amount: -115 } })
      .box([0.3, 0.04, 0.05], [0, 0.98, 0.4], { color: '#2f5f9f', parent: 'lid', round: 0.3 })
      .stick([-0.27, 0.92, -0.42], [0.27, 0.92, -0.42], 0.04, '#2a2726')
      .stick([-0.25, 0.11, -0.3], [0.25, 0.11, -0.3], 0.03, '#5c6166');
    arrows3(b, [0, 0.58, 0.355], 0.3, 'white', { noInk: true });
    b.pair((s) => wheel(b, s > 0 ? 'wheelL' : 'wheelR', [s * 0.32, 0.11, -0.3], 0.22, 0.06, '#5c6166'));
    return b
      .socket('inside', [0, 0.5, 0], 'inside', { size: 0.4 })
      .act({ click: [A.operate('lid', 'open'), A.spawn('tin', 'sardine can', { rel: 'front', of: 'self', dist: 'close' }), A.attach('tin', 'self', 'inside'), A.say('Clunk!', 1), A.operate('lid', 'close'), A.remove('tin')] })
      .done();
  }),
  // A recycling plant (20 m shed, 9 m walls): a roll-up loading door, an office with windows, a conveyor climbing
  // to a hatch, bales of sorted paper, glass, plastic and cans, and a chimney. Click: the loading door rolls up.
  e('recycling plant', 'places', 'factories', () => {
    const b = m('recycling plant', { edge: 'sharp' })
      .box([28, 0.2, 22], [0, 0.1, 2], { color: '#a7a7a0', round: 0.02 })
      .box([20, 9, 14], [0, 4.7, -2], { color: '#7fa58a', round: 0.01 })
      .wedge([14.6, 2.4, 20.6], [0, 10.4, -2], { color: '#5c6166', rot: [0, 90, 0] })
      .box([20.2, 0.4, 14.2], [0, 9.2, -2], { color: '#5f8a6a' });
    b.each(9, (i) => b.box([0.08, 8.6, 0.06], [-9.4 + i * 2.35, 4.5, 5.03], { color: '#6c9277', noInk: true }));
    b.box([5.4, 5.3, 0.2], [-5, 2.85, 5.05], { color: '#5c6166', round: 0.05 })
      .box([5, 4.9, 0.12], [-5, 2.65, 5.15], { color: '#b9c2ca', name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 4.2 } });
    b.each(12, (i) => b.box([5, 0.05, 0.03], [-5, 0.45 + i * 0.4, 5.22], { color: '#9da3a8', parent: 'shutter', noInk: true }));
    b.box([7, 3.4, 2.2], [5.5, 1.9, 6.1], { color: '#e8e4dc', round: 0.03 }).box([7.2, 0.25, 2.4], [5.5, 3.7, 6.1], { color: '#5c6166' });
    b.each(3, (i) => win(b, [3.2 + i * 2.2, 2.2, 7.23], 1.4, 1.1, { frame: '#5c6166' }));
    door(b, [8.2, 1.3, 7.23], 1.0, 2.2, '#3f6f9a', { glass: true });
    b.label('RECYCLING', [7, 1.2], [3.5, 7.4, 5.08], { color: 'white', depth: 0.08 });
    arrows3(b, [-5, 7.3, 5.1], 2.0, '#2e9e4f');
    b.box([1.6, 0.3, 11], [9.5, 4.5, 9.0], { color: '#3a3633', rot: [32, 0, 0] });
    b.each(3, (i) => b.stick([9.5, 0.2, 13.2 - i * 3], [9.5, 1.4 + i * 1.9, 13.2 - i * 3], 0.2, '#f6d24a'));
    b.box([3, 1.6, 2.6], [9.5, 0.95, 13.6], { color: '#f6d24a', round: 0.05 });
    const bales: Array<[V, string]> = [[[-9, 0.8, 7], '#4e8fd6'], [[-7.6, 0.8, 7.2], '#5aa553'], [[-6.2, 0.8, 7], '#f6d24a'], [[-8.3, 2.2, 7.1], '#c9ccd1'], [[-6.9, 2.2, 7.1], '#4e8fd6'], [[-9, 0.8, 8.6], '#e0473b']];
    for (const [p, c] of bales) b.box([1.3, 1.3, 1.3], p, { color: c, round: 0.15 });
    b.stick([7, 9, -6], [7, 18, -6], 1.4, '#9da3a8').cyl([1.6, 0.6, 1.6], [7, 17.8, -6], { color: '#e0473b' });
    return b.act({ click: [[A.operate('shutter', 'up'), A.par(A.effect('dust', { dur: 2 }), A.say('Crunch, crunch!', 2))], [A.operate('shutter', 'down'), A.say('Clang!', 1)]] }).done();
  }),
  // A big red mushroom button on a yellow-and-black housing marked DO NOT PRESS. Click: it goes down with a
  // boop; click again and... kaboom.
  e('red button', 'tech', 'buttons', () => {
    const b = m('red button', { edge: 'sharp' })
      .box([0.14, 0.05, 0.14], [0, 0.025, 0], { color: '#f6d24a', round: 0.2 })
      .cyl([0.11, 0.012, 0.11], [0, 0.056, 0], { color: '#2a2726' })
      .label('DO NOT PRESS', [0.11, 0.018], [0, 0.022, 0.071], { color: '#2a2726', depth: 0.003 })
      .cyl([0.065, 0.025, 0.065], [0, 0.072, 0], { color: '#c8302a', name: 'button', edge: 'soft' })
      .dome([0.085, 0.03, 0.085], [0, 0.095, 0], { color: '#e0473b', parent: 'button', edge: 'soft' })
      .ball([0.02, 0.008, 0.015], [-0.015, 0.108, 0.015], { color: 'white', noInk: true, parent: 'button' });
    b.each(4, (i) => b.box([0.012, 0.004, 0.03], [0.045 * Math.cos(i * 1.57 + 0.78), 0.0505, 0.045 * Math.sin(i * 1.57 + 0.78)], { color: '#f6d24a', rot: [0, -i * 90 - 45, 0], noInk: true }));
    return b
      .act({
        click: [
          [A.pose('button', { move: [0, -0.014, 0], dur: 0.12 }), A.par(A.say('Boop!', 1.2), A.effect('sparkle', { dur: 1 })), A.pose('button', { move: [0, 0, 0], dur: 0.2 })],
          [A.pose('button', { move: [0, -0.014, 0], dur: 0.12 }), A.par(A.effect('explosion', { dur: 1 }), A.say('Kaboom!', 1.5)), A.pose('button', { move: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A red baseball cap (real size): six-panel crown, stiff curved brim, a button on top, air holes and a strap at
  // the back. Click: it flips round to wear backwards, and back again.
  e('red cap', 'wardrobe', 'hats', () => {
    const r = '#d8312a', dk = '#a3322a';
    const b = m('red cap')
      .dome([0.19, 0.115, 0.21], [0, 0.0625, 0], { color: r, name: 'cap' })
      .ball([0.19, 0.016, 0.12], [0, 0.012, 0.14], { color: r, rot: [8, 0, 0], parent: 'cap', edge: 'sharp' })
      .ball([0.17, 0.01, 0.1], [0, 0.006, 0.14], { color: dk, rot: [8, 0, 0], parent: 'cap', noInk: true })
      .ball([0.022, 0.014, 0.022], [0, 0.123, 0], { color: r, parent: 'cap' })
      .box([0.04, 0.035, 0.006], [0, 0.07, 0.1], { color: 'white', round: 0.3, rot: [-30, 0, 0], parent: 'cap', noInk: true })
      .box([0.06, 0.018, 0.008], [0, 0.03, -0.103], { color: dk, round: 0.3, parent: 'cap' })
      .box([0.014, 0.012, 0.008], [0.01, 0.03, -0.107], { color: '#c9ccd1', parent: 'cap' });
    b.pair((s) => b.ball(0.007, [s * 0.06, 0.09, 0.03], { color: dk, noInk: true, parent: 'cap' }));
    b.each(3, (i) => b.stick([0, 0.122, 0], surf([0, 0.0, 0], [0.095, 0.12, 0.105], i * 60 + 30, 20), 0.003, dk, { parent: 'cap', noInk: true }));
    return b.act({ click: [[A.pose('cap', { rot: [0, 180, 0], dur: 0.5 }), A.say('Swish!', 1)], [A.pose('cap', { rot: [0, 0, 0], dur: 0.5 }), A.say('Swish!', 1)]] }).done();
  }),
  // A toggle switch on a grey panel with ON / OFF marks and a red lamp that lights when it is flipped up.
  e('red switch', 'tech', 'buttons', () =>
    m('red switch', { edge: 'sharp' })
      .box([0.1, 0.035, 0.12], [0, 0.0175, 0], { color: '#5c6166', round: 0.2 })
      .box([0.08, 0.004, 0.1], [0, 0.036, 0], { color: '#9da3a8', round: 0.2 })
      .label('ON', [0.025, 0.012], [0, 0.04, -0.04], { color: '#9da3a8', rot: [-90, 0, 0], depth: 0.002 })
      .label('OFF', [0.03, 0.012], [0, 0.04, 0.04], { color: '#9da3a8', rot: [-90, 0, 0], depth: 0.002 })
      .cyl([0.03, 0.012, 0.03], [0, 0.044, 0], { color: '#c9ccd1' })
      .rod([0, 0.045, 0], [0, 0.09, 0.03], 0.012, '#c9ccd1', { name: 'lever', pivot: [0, 0.045, 0], mover: { kind: 'swing', axis: 'x', amount: -66 } })
      .capsule([0.022, 0.03, 0.022], [0, 0.098, 0.036], { color: '#e0473b', rot: [34, 0, 0], parent: 'lever', edge: 'soft' })
      .cyl([0.024, 0.014, 0.024], [0.03, 0.045, -0.04], { color: '#2a2726' })
      .dome([0.018, 0.012, 0.018], [0.03, 0.057, -0.04], { color: '#ff3a2a', name: 'lamp', mover: { kind: 'light' } })
      .act({ click: [A.par(A.operate('lever'), A.operate('lamp'), A.say('Click!', 1))] })
      .done(),
  ),
  // A giant redwood (built at 40 m; the real trees reach 90 m, the vocabulary's 1 m is wrong): a flared base, a
  // ridged red trunk four metres across, branches only high up, and a soft crown that sways. Click: it creaks in
  // the wind, or a crow flies out of it.
  e('redwood', 'garden', 'trees', () => {
    const b = m('redwood')
      .cyl([6.2, 3, 6.2], [0, 1.5, 0], { color: '#8a3f22', taper: 0.68 })
      .cyl([4.2, 30, 4.2], [0, 17, 0], { color: '#9a4a2a', taper: 0.3 });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.stick([Math.cos(a) * 2.0, 0.5, Math.sin(a) * 2.0], [Math.cos(a) * 0.75, 30, Math.sin(a) * 0.75], 0.3, i % 2 ? '#7a3620' : '#a8563a', { noInk: true });
    });
    b.each(6, (i) => {
      const a = i * 1.05, y = 19 + i * 2.2;
      b.rod([Math.cos(a) * 1, y, Math.sin(a) * 1], [Math.cos(a) * 4.2, y + 2.2, Math.sin(a) * 4.2], 0.45, '#7a3620');
    });
    b.ball([10, 7, 10], [0, 27, 0], { color: '#2f6a34', name: 'top' })
      .ball([8, 6, 8], [1.2, 22, 0.8], { color: '#3a7a3a', parent: 'top' })
      .ball([7, 6, 7], [-1.5, 23, -1], { color: '#2a5e30', parent: 'top' })
      .ball([7.5, 7, 7.5], [0, 32, 0], { color: '#3a7a3a', parent: 'top' })
      .ball([5, 5, 5], [0.5, 36.5, 0], { color: '#2f6a34', parent: 'top' })
      .cone([2.6, 3.5, 2.6], [0, 39.5, 0], { color: '#3a7a3a', parent: 'top' });
    return b
      .act({
        click: [
          [A.par(A.pose('top', { rot: [0, 0, 3], dur: 1.2 }), A.say('Creeeak...', 2)), A.pose('top', { rot: [0, 0, -2], dur: 1.2 }), A.pose('top', { rot: [0, 0, 0], dur: 1 })],
          [A.spawn('crow', 'crow', { rel: 'near', of: 'self', dist: 'close' }), A.say('Caw! Caw!', 1.5), A.remove('crow', 'fly_away')],
        ],
      })
      .done();
  }),
  // A clarinet mouthpiece standing on its cork (9 cm) with the cane reed clamped on by a metal ligature, and a
  // spare reed lying beside it. Click: the reed buzzes.
  e('reed (music)', 'music', 'wind instruments', () => {
    const cane = '#e2c27a';
    const b = m('reed (music)', { edge: 'sharp' })
      .cyl([0.026, 0.02, 0.026], [0, 0.01, 0], { color: '#b5814e' })
      .cyl([0.028, 0.06, 0.028], [0, 0.05, 0], { color: '#2a2726', taper: 0.85 })
      .box([0.022, 0.03, 0.016], [0, 0.093, 0.002], { color: '#2a2726', round: 0.5, rot: [8, 0, 0] })
      .box([0.014, 0.075, 0.003], [0, 0.06, -0.0135], { color: cane, round: 0.3, name: 'reed' })
      .box([0.013, 0.025, 0.0015], [0, 0.085, -0.0155], { color: '#f2dda6', noInk: true, parent: 'reed' });
    b.pair((s) => b.torus([0.034, 0.034, 0.006], [0, 0.05 + s * 0.012, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.12 }).cyl([0.004, 0.012, 0.004], [0.019, 0.05 + s * 0.012, -0.012], { color: '#d0a84a', rot: [0, 0, 90] }));
    b.box([0.014, 0.003, 0.068], [0.04, 0.0015, 0.02], { color: cane, round: 0.3, rot: [0, 15, 0] }).box([0.013, 0.002, 0.024], [0.046, 0.0035, 0.04], { color: '#f2dda6', noInk: true, rot: [0, 15, 0] });
    return b.act({ click: [A.par(A.pose('reed', { rot: [3, 0, 0], dur: 0.1 }), A.anim('shake', 2), A.say('Toot!', 1.5)), A.pose('reed', { rot: [0, 0, 0], dur: 0.1 })] }).done();
  }),
  // A patch of coral reef (2.6 m across, 1.2 m tall): a rocky base, brain coral, branching staghorn coral, sea
  // fans, tube sponges, an anemone, and a clownfish that swims a lap round it when clicked.
  e('reef', 'sea', 'coral', () => {
    const b = m('reef')
      .ball([2.6, 0.8, 1.6], [0, 0.15, 0], { color: '#9a8f86' })
      .ball([1.0, 0.7, 0.9], [-0.55, 0.4, -0.2], { color: '#8a8078' })
      .ball([0.55, 0.42, 0.5], [0.45, 0.6, -0.15], { color: '#d8b04a' })
      .ball([0.5, 0.36, 0.45], [-0.9, 0.5, 0.3], { color: '#e8a05a' });
    b.each(5, (i) => b.torus([0.5 - i * 0.07, 0.36, 0.02], [0.45, 0.6, -0.15], { color: '#b08a30', rot: [0, i * 36, 0], tube: 0.04, noInk: true }));
    for (const [xx, z, h] of [[-0.35, 0.2, 1.15], [-0.15, 0.1, 1.0], [-0.55, 0.0, 0.95]] as Array<[number, number, number]>) {
      b.rod([xx, 0.4, z], [xx - 0.1, h, z + 0.05], 0.07, '#f4a1c0').rod([xx - 0.04, 0.65, z], [xx + 0.14, h - 0.1, z], 0.06, '#f4a1c0').rod([xx - 0.06, 0.8, z], [xx - 0.22, h - 0.05, z - 0.05], 0.05, '#f4a1c0');
    }
    b.ball([0.55, 0.55, 0.04], [0.15, 0.95, -0.35], { color: '#8a5fc4', rot: [0, 10, 0] }).ball([0.42, 0.45, 0.04], [0.55, 0.9, -0.3], { color: '#d64fa0', rot: [0, -15, 0] });
    b.each(4, (i) => b.cyl([0.1, 0.28 + i * 0.07, 0.1], [0.75 + (i % 2) * 0.12, 0.45 + i * 0.035, 0.1 + i * 0.07], { color: '#f0923b', taper: 1.15 }));
    b.ball([0.2, 0.08, 0.2], [0.1, 0.55, 0.45], { color: '#9be34d' });
    b.each(8, (i) => b.capsule([0.025, 0.12, 0.025], [0.1 + Math.cos(i * 0.785) * 0.07, 0.62, 0.45 + Math.sin(i * 0.785) * 0.07], { color: '#c6f07a', rot: [Math.sin(i * 0.785) * 25, 0, -Math.cos(i * 0.785) * 25] }));
    b.ball([0.13, 0.08, 0.04], [1.0, 0.75, 0.0], { color: '#f0923b', name: 'fish', pivot: [0, 0.75, 0] })
      .cone([0.07, 0.06, 0.02], [1.0, 0.75, -0.08], { color: '#f0923b', rot: [-90, 0, 0], parent: 'fish' })
      .box([0.015, 0.075, 0.042], [1.0, 0.75, 0.025], { color: 'white', round: 0.5, parent: 'fish', noInk: true })
      .box([0.015, 0.06, 0.04], [1.0, 0.75, -0.035], { color: 'white', round: 0.5, parent: 'fish', noInk: true })
      .ball(0.014, [1.02, 0.765, 0.05], { color: 'black', parent: 'fish' });
    return b.act({ click: [A.par(A.pose('fish', { rot: [0, 360, 0], dur: 3 }), A.effect('water_spray', { dur: 1 })), A.pose('fish', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A bicycle's rear reflector (8 cm): a faceted red lens in a black bracket clamped to a stub of seat post.
  // Click: it catches the light and flashes.
  e('reflector', 'garage', 'bike parts', () => {
    const b = m('reflector', { edge: 'sharp' })
      .cyl([0.06, 0.012, 0.06], [0, 0.006, 0], { color: '#5c6166' })
      .stick([0, 0.012, -0.03], [0, 0.22, -0.03], 0.028, '#c9ccd1')
      .box([0.04, 0.035, 0.04], [0, 0.15, -0.03], { color: '#2a2726', round: 0.3 })
      .box([0.03, 0.03, 0.03], [0, 0.15, -0.005], { color: '#2a2726', round: 0.3 })
      .prism([0.09, 0.016, 0.07], [0, 0.15, 0.015], 6, { color: '#2a2726', rot: [90, 0, 0] })
      .prism([0.08, 0.016, 0.06], [0, 0.15, 0.02], 6, { color: '#e8312a', rot: [90, 0, 0], name: 'lens', mover: { kind: 'light' } });
    b.each(3, (i) => b.prism([0.06 - i * 0.018, 0.004, 0.045 - i * 0.013], [0, 0.15, 0.029 + i * 0.001], 6, { color: '#b8241f', rot: [90, 0, 0], parent: 'lens', noInk: true }));
    return b.act({ click: [A.operate('lens', 'on'), A.say('Flash!', 1), A.wait(1.2), A.operate('lens', 'off')] }).done();
  }),
  // A rounded retro refrigerator (1.8 m) built hollow so there is something inside: shelves with milk, eggs,
  // a jar, cheese and an apple, a light that comes on, door bins, and a freezer drawer that pulls out.
  e('refrigerator', 'kitchen', 'appliances', () => {
    const c = '#f3ead2', inn = '#eef2f2';
    const b = m('refrigerator', { edge: 'sharp' })
      .box([0.76, 1.66, 0.05], [0, 0.93, -0.325], { color: c, round: 0.3 })
      .box([0.7, 1.1, 0.02], [0, 1.16, -0.295], { color: inn, round: 0.1 })
      .box([0.78, 0.1, 0.7], [0, 1.75, 0], { color: c, round: 0.7 })
      .box([0.7, 0.08, 0.66], [0, 0.04, 0], { color: '#3a3633', round: 0.2 })
      .box([0.76, 0.06, 0.68], [0, 0.585, 0], { color: c, round: 0.3 });
    b.pair((s) => b.box([0.05, 1.66, 0.7], [s * 0.355, 0.93, 0], { color: c, round: 0.3 }).box([0.02, 1.1, 0.6], [s * 0.325, 1.16, 0], { color: inn, round: 0.1 }));
    b.each(2, (i) => b.box([0.66, 0.012, 0.58], [0, 0.95 + i * 0.32, 0], { color: '#cfe8f4', round: 0.2 }));
    b.box([0.07, 0.19, 0.07], [-0.18, 0.71, 0.05], { color: 'white', round: 0.1 })
      .wedge([0.07, 0.04, 0.07], [-0.18, 0.825, 0.05], { color: '#4e8fd6' })
      .box([0.072, 0.07, 0.072], [-0.18, 0.7, 0.05], { color: '#4e8fd6', noInk: true })
      .cyl([0.09, 0.12, 0.09], [0.12, 0.67, -0.05], { color: '#e0473b' })
      .cyl([0.095, 0.03, 0.095], [0.12, 0.745, -0.05], { color: '#f2c14e' })
      .wedge([0.16, 0.07, 0.1], [0.15, 1.29, 0.0], { color: '#f6c445', edge: 'soft' })
      .ball(0.08, [-0.15, 1.31, 0.05], { color: '#9be34d', edge: 'soft' });
    b.each(4, (i) => b.ball([0.042, 0.055, 0.042], [-0.05 + i * 0.05, 0.985, 0.15], { color: '#f7f0e2', edge: 'soft' }));
    b.ball([0.06, 0.04, 0.06], [0, 1.67, -0.12], { color: '#fff6c8', name: 'bulb', mover: { kind: 'light' } });
    b.box([0.76, 1.12, 0.06], [0, 1.17, 0.38], { color: c, round: 0.3, name: 'door', pivot: [-0.38, 1.17, 0.38], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .box([0.035, 0.36, 0.05], [0.3, 1.2, 0.43], { color: '#c9ccd1', round: 0.5, parent: 'door' })
      .label('COOL', [0.16, 0.05], [0, 1.6, 0.415], { color: '#c9ccd1', depth: 0.01, parent: 'door' })
      .box([0.07, 0.09, 0.008], [-0.15, 1.3, 0.414], { color: 'white', round: 0.1, rot: [0, 0, -6], parent: 'door' })
      .ball([0.03, 0.03, 0.012], [-0.15, 1.35, 0.418], { color: '#e0473b', parent: 'door' })
      .ball([0.03, 0.03, 0.012], [0.05, 0.95, 0.418], { color: '#4e8fd6', parent: 'door' })
      .ball([0.03, 0.03, 0.012], [-0.05, 1.1, 0.418], { color: '#5aa553', parent: 'door' });
    b.each(3, (i) => b.box([0.62, 0.07, 0.08], [0, 0.8 + i * 0.3, 0.31], { color: '#cfe8f4', round: 0.2, parent: 'door' }));
    b.box([0.76, 0.46, 0.06], [0, 0.33, 0.38], { color: c, round: 0.3, name: 'freezer', mover: { kind: 'slide', axis: 'z', amount: 0.42 } })
      .box([0.62, 0.32, 0.5], [0, 0.3, 0.08], { color: '#d4d7da', round: 0.1, parent: 'freezer' })
      .box([0.4, 0.035, 0.05], [0, 0.5, 0.43], { color: '#c9ccd1', round: 0.5, parent: 'freezer' });
    return b
      .socket('shelf', [0.1, 0.97, -0.05], 'inside', { size: 0.3 })
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.operate('bulb', 'on')), A.say('Brrr!', 1.5), A.wait(2.5), A.par(A.operate('door', 'close'), A.operate('bulb', 'off'))],
          [A.operate('freezer', 'out'), A.effect('snow', { dur: 1.5 }), A.wait(2), A.operate('freezer', 'in')],
        ],
      })
      .done();
  }),
  // A two-storey rehabilitation centre (14 m x 8 m): a raised entrance reached by a wheelchair ramp with
  // handrails (and steps), sliding glass doors under a canopy, rows of windows, a green cross, a bench and
  // planters. Click: the doors slide open.
  e('rehabilitation center', 'places', 'hospitals', () => {
    const b = m('rehabilitation center', { edge: 'sharp' }), y0 = 0.6, zf = 5;
    b.box([20, 0.15, 16], [0, 0.075, 2], { color: '#c9c6bd', round: 0.02 })
      .box([14, 7.6, 10], [0, 3.95, 0], { color: '#efe6d2', round: 0.01 })
      .box([14.3, 0.4, 10.3], [0, 7.75, 0], { color: '#3fa7a0', round: 0.1 })
      .box([3, 1.4, 2], [3, 8.6, -1], { color: '#9da3a8', round: 0.1 })
      .box([14.05, 0.3, 0.06], [0, 3.9, zf + 0.03], { color: '#3fa7a0' });
    b.each(5, (i) => {
      const xx = -5.6 + i * 2.8;
      win(b, [xx, 5.6, zf + 0.04], 1.7, 1.5, { frame: '#3fa7a0' });
      if (i !== 2) win(b, [xx, 2.2, zf + 0.04], 1.7, 1.5, { frame: '#3fa7a0' });
    });
    b.box([3.4, 2.9, 0.08], [0, y0 + 1.45, zf + 0.04], { color: '#5c6166', round: 0.05 })
      .box([0.78, 2.4, 0.05], [-0.39, y0 + 1.2, zf + 0.1], { color: '#bfe3f2', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -0.75 } })
      .box([0.78, 2.4, 0.05], [0.39, y0 + 1.2, zf + 0.1], { color: '#bfe3f2', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 0.75 } })
      .box([4.2, 0.25, 2.4], [0, 3.35, zf + 1.2], { color: '#3fa7a0', round: 0.1 })
      .label('REHABILITATION CENTER', [7.5, 0.7], [0, 4.4, zf + 0.06], { color: 'white', depth: 0.06 })
      .box([0.5, 1.6, 0.1], [5.4, 6.2, zf + 0.06], { color: '#2e9e4f' })
      .box([1.6, 0.5, 0.1], [5.4, 6.2, zf + 0.06], { color: '#2e9e4f' })
      .box([3.6, y0, 2.6], [0, y0 / 2, zf + 1.3], { color: '#d4d7da', round: 0.05 });
    b.pair((s) => b.stick([s * 1.9, y0, zf + 2.3], [s * 1.9, 3.25, zf + 2.3], 0.16, '#c9ccd1'));
    const rl = 7, ang = Math.atan2(y0 - 0.15, rl) / D2R;
    b.box([rl, 0.14, 1.5], [1.8 + rl / 2, 0.15 + (y0 - 0.15) / 2, zf + 3.3], { color: '#b8b5ac', rot: [0, 0, -ang], round: 0.05 })
      .box([1.6, y0, 1.5], [1.4, y0 / 2, zf + 3.3], { color: '#d4d7da', round: 0.05 });
    b.pair((s) => {
      const z = zf + 3.3 + s * 0.72;
      b.rod([1.8, y0 + 0.9, z], [1.8 + rl, 0.15 + 0.9, z], 0.05, '#c9ccd1');
      b.each(4, (i) => b.stick([1.8 + i * (rl / 3), y0 - (i * (y0 - 0.15)) / 3, z], [1.8 + i * (rl / 3), y0 + 0.9 - (i * (y0 - 0.15)) / 3, z], 0.05, '#c9ccd1'));
    });
    b.each(3, (i) => b.box([2.4, y0 - i * 0.18, 0.32], [-2.6, (y0 - i * 0.18) / 2, zf + 1.6 + i * 0.32], { color: '#d4d7da', round: 0.05 }));
    b.box([1.8, 0.08, 0.5], [-5, 0.5, zf + 2.6], { color: 'wood' });
    b.pair((s) => b.stick([-5 + s * 0.8, 0.1, zf + 2.6], [-5 + s * 0.8, 0.46, zf + 2.6], 0.08, '#5c6166'));
    b.pair((s) => b.box([1, 0.6, 1], [s * 6.2, 0.45, zf + 1.4], { color: '#a7a7a0', round: 0.1 }).ball([1.1, 0.9, 1.1], [s * 6.2, 1.1, zf + 1.4], { color: '#4f9a48', edge: 'soft' }));
    return b.act({ click: [A.operate('door', 'open'), A.say('Swish!', 1.5), A.wait(2.5), A.operate('door', 'close')] }).done();
  }),
  // A single leather rein hanging in a loop from a hook on a stable post, with its buckle and a snap clip.
  // Click: it swings on the hook.
  e('rein', 'farm', 'horse tack', () => {
    const lc = '#6b3f22';
    const b = m('rein', { edge: 'sharp' })
      .box([0.4, 0.08, 0.4], [0, 0.04, 0], { color: '#7a5230' })
      .box([0.14, 1.6, 0.14], [0, 0.84, -0.1], { color: '#8c5a2b', round: 0.1 })
      .arc([0.1, 0.08, 0.02], [0, 1.42, 0.02], { color: '#5c6166', rot: [0, 90, 0], arc: 220, tube: 0.25 })
      .box([0.035, 0.05, 0.08], [0, 1.43, -0.02], { color: '#5c6166' })
      .stick([0, 1.46, 0.03], [0.04, 0.6, 0.04], 0.03, lc, { name: 'rein', pivot: [0, 1.46, 0.03], edge: 'soft' })
      .stick([0, 1.46, 0.03], [-0.04, 0.6, 0.04], 0.03, lc, { parent: 'rein', edge: 'soft' })
      .arc([0.11, 0.06, 0.03], [0, 0.6, 0.04], { color: lc, rot: [0, 0, 180], tube: 0.35, parent: 'rein', edge: 'soft' })
      .box([0.05, 0.04, 0.012], [0.04, 1.1, 0.05], { color: '#d0a84a', round: 0.2, parent: 'rein' })
      .arc([0.04, 0.05, 0.01], [-0.04, 0.95, 0.05], { color: '#c9ccd1', arc: 300, tube: 0.3, parent: 'rein' })
      .box([0.4, 0.3, 0.02], [0, 0.18, 0.0], { color: '#8a3f22', rot: [0, 0, 0], round: 0.1 });
    b.arc([0.12, 0.12, 0.02], [0, 0.95, -0.02], { color: '#9da3a8', arc: 270, tube: 0.25 });
    return b.act({ click: [A.pose('rein', { rot: [0, 0, 20], dur: 0.4 }), A.pose('rein', { rot: [0, 0, -14], dur: 0.5 }), A.pose('rein', { rot: [0, 0, 0], dur: 0.5 }), A.say('Swish!', 1)] }).done();
  }),
  // A tack-room horse-head mannequin on a stand (1.9 m) wearing a bridle: crownpiece, browband, noseband,
  // cheekpieces to the bit, and reins looping back over the neck. Click: the reins shake and the head nods.
  e('reins', 'farm', 'horse tack', () => {
    const hc = '#9a6038', lc = '#3a2a1e', HC: V = [0, 1.58, 0.12], th = 35 * D2R;
    const hp = (v: V): V => [HC[0] + v[0], HC[1] + v[1] * Math.cos(th) - v[2] * Math.sin(th), HC[2] + v[1] * Math.sin(th) + v[2] * Math.cos(th)];
    const b = m('reins')
      .box([0.5, 0.08, 0.5], [0, 0.04, -0.2], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.08, -0.25], [0, 1.15, -0.25], 0.08, '#5c6166', { edge: 'sharp' })
      .rod([0, 1.12, -0.32], [0, 1.6, -0.08], 0.3, hc)
      .box([0.05, 0.44, 0.1], [0, 1.45, -0.27], { color: '#3a2a1e', rot: [-48, 0, 0], round: 0.5 })
      .loft([0.26, 0.3, 0.62], HC, [[0, 0.85, 0.9, 0.05], [0.25, 1, 1, 0], [0.6, 0.78, 0.7, -0.08], [0.9, 0.72, 0.6, -0.12], [1, 0.5, 0.42, -0.12]], { color: hc, rot: [35, 0, 0], name: 'head', pivot: [0, 1.6, -0.08] })
      .box([0.05, 0.12, 0.02], hp([0, 0.08, 0.05]), { color: 'white', rot: [35, 0, 0], parent: 'head', noInk: true });
    b.pair((s) => {
      b.cone([0.06, 0.13, 0.05], hp([s * 0.07, 0.17, -0.24]), { color: hc, rot: [35 - 20, 0, s * -12], parent: 'head' });
      b.ball(0.035, hp([s * 0.12, 0.05, -0.1]), { color: '#1e1612', eye: true, parent: 'head' });
      b.ball([0.02, 0.03, 0.02], hp([s * 0.045, -0.07, 0.31]), { color: '#3a2a1e', parent: 'head', noInk: true });
      b.stick(hp([s * 0.125, 0.12, -0.22]), hp([s * 0.12, -0.08, 0.16]), 0.022, lc, { parent: 'head' });
      b.torus([0.05, 0.05, 0.01], hp([s * 0.11, -0.1, 0.19]), { color: '#c9ccd1', rot: [0, 90, 0], tube: 0.2, parent: 'head' });
    });
    b.arc([0.27, 0.14, 0.03], hp([0, 0.11, -0.22]), { color: lc, rot: [35, 0, 0], tube: 0.12, parent: 'head' })
      .torus([0.27, 0.22, 0.025], hp([0, -0.02, 0.12]), { color: lc, rot: [35 + 90, 0, 0], tube: 0.08, parent: 'head' })
      .stick(hp([-0.12, 0.08, -0.14]), hp([0.12, 0.08, -0.14]), 0.02, lc, { parent: 'head' })
      .stick(hp([-0.11, -0.1, 0.19]), hp([0.11, -0.1, 0.19]), 0.012, '#c9ccd1', { parent: 'head' })
      .rod(hp([0.11, -0.1, 0.19]), [0.14, 1.1, -0.05], 0.022, lc, { parent: 'head', name: 'reins', pivot: hp([0, -0.1, 0.19]) })
      .rod(hp([-0.11, -0.1, 0.19]), [-0.14, 1.1, -0.05], 0.022, lc, { parent: 'reins' })
      .arc([0.3, 0.12, 0.025], [0, 1.12, -0.05], { color: lc, rot: [0, 0, 180], tube: 0.12, parent: 'reins' });
    return b
      .act({
        click: [
          [A.par(A.pose('reins', { rot: [-20, 0, 0], dur: 0.25 }), A.say('Giddy-up!', 1.5)), A.par(A.pose('reins', { rot: [0, 0, 0], dur: 0.3 }), A.pose('head', { rot: [10, 0, 0], dur: 0.3 })), A.pose('head', { rot: [0, 0, 0], dur: 0.4 })],
          [A.par(A.pose('head', { rot: [-12, 0, 0], dur: 0.4 }), A.pose('reins', { rot: [15, 0, 0], dur: 0.4 }), A.say('Whoa there!', 1.5)), A.wait(0.6), A.par(A.pose('head', { rot: [0, 0, 0], dur: 0.4 }), A.pose('reins', { rot: [0, 0, 0], dur: 0.4 }))],
        ],
      })
      .done();
  }),
  // A glass jar of pickle relish (13 cm): green relish with flecks, a red screw lid (a piece: it twists off and
  // goes back), a paper label with a pickle on it.
  e('relish', 'food', 'condiments', () => {
    const b = m('relish')
      .cyl([0.08, 0.105, 0.08], [0, 0.0525, 0], { color: '#7aa53a', name: 'jar' })
      .cyl([0.074, 0.012, 0.074], [0, 0.111, 0], { color: '#8fb85a', parent: 'jar' })
      .cyl([0.068, 0.018, 0.068], [0, 0.124, 0], { color: '#e0473b', name: 'lid', parent: 'jar', piece: true, edge: 'sharp' })
      .cyl([0.0815, 0.05, 0.0815], [0, 0.055, 0], { color: '#fff3d6', parent: 'jar', edge: 'sharp' })
      .capsule([0.016, 0.04, 0.012], [0, 0.058, 0.041], { color: '#3f7a3a', rot: [0, 0, 70], parent: 'jar', noInk: true })
      .label('RELISH', [0.05, 0.012], [0, 0.04, 0.041], { color: '#fff3d6', depth: 0.002, parent: 'jar' });
    b.each(10, (i) => b.ball(0.008, surf([0, 0.09, 0], [0.04, 0.012, 0.04], -70 + i * 15, (i % 3) * 20 - 20), { color: '#c9d86a', noInk: true, parent: 'jar' }));
    b.each(8, (i) => b.box([0.004, 0.016, 0.004], [Math.cos(i * 0.785) * 0.034, 0.124, Math.sin(i * 0.785) * 0.034], { color: '#b8302a', noInk: true, parent: 'lid' }));
    return b.act({ click: [[A.detach('lid', 'lid'), A.say('Pop!', 1)], [A.reattach('lid'), A.say('Twist!', 1)]] }).done();
  }),
  // A TV remote (20 cm) stood on end: power, a direction pad, volume and channel rockers, number keys, coloured
  // keys, and an infrared window at the tip that blinks when clicked.
  e('remote', 'tech', 'gadgets', () => {
    const b = m('remote', { edge: 'sharp' })
      .box([0.05, 0.2, 0.024], [0, 0.1, 0], { color: '#2a2726', round: 0.45 })
      .box([0.046, 0.19, 0.004], [0, 0.1, 0.012], { color: '#3a3633', round: 0.3, noInk: true })
      .box([0.03, 0.006, 0.014], [0, 0.2, 0], { color: '#8a1a1a', round: 0.3, name: 'led', mover: { kind: 'light' } })
      .cyl([0.012, 0.005, 0.012], [-0.012, 0.183, 0.014], { color: '#e0473b', rot: [90, 0, 0] })
      .torus([0.032, 0.032, 0.006], [0, 0.145, 0.014], { color: '#5c6166', tube: 0.3 })
      .cyl([0.012, 0.006, 0.012], [0, 0.145, 0.015], { color: '#9da3a8', rot: [90, 0, 0] });
    b.pair((s) => b.capsule([0.009, 0.026, 0.006], [s * 0.016, 0.11, 0.014], { color: '#9da3a8' }));
    for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) b.cyl([0.009, 0.005, 0.009], [c * 0.014, 0.035 + r * 0.014, 0.014], { color: '#d4d7da', rot: [90, 0, 0], noInk: true });
    b.each(4, (i) => b.box([0.008, 0.005, 0.005], [-0.0165 + i * 0.011, 0.093, 0.014], { color: ['#e0473b', '#5aa553', '#f6d24a', '#4e8fd6'][i], round: 0.3, noInk: true }));
    return b.act({ click: [A.operate('led', 'on'), A.say('Click!', 1), A.wait(0.3), A.operate('led', 'off')] }).done();
  }),
  // A radio-controlled trainer plane (1.5 m wingspan): a foam fuselage loft, sharp high wing with red tips, tail,
  // canopy, wire landing gear on little wheels, and a propeller that starts when clicked.
  e('remote controlled aircraft', 'toys', 'rc toys', () => {
    const b = m('remote controlled aircraft', { view: 'side' })
      .loft([0.14, 0.17, 1.1], [0, 0.28, 0], [[0, 0.15, 0.25, 0.25], [0.3, 0.7, 0.75, 0.05], [0.65, 1, 1, 0], [0.92, 0.9, 0.85, -0.02], [1, 0.7, 0.65, -0.02]], { color: '#e8312a' })
      .box([1.5, 0.03, 0.24], [0, 0.375, 0.12], { color: 'white', edge: 'sharp', round: 0.6 })
      .box([0.5, 0.025, 0.13], [0, 0.32, -0.48], { color: 'white', edge: 'sharp', round: 0.5 })
      .box([0.02, 0.17, 0.15], [0, 0.42, -0.5], { color: '#e8312a', edge: 'sharp', round: 0.4 })
      .ball([0.09, 0.08, 0.16], [0, 0.36, 0.25], { color: '#2f3d52' })
      .cone([0.07, 0.06, 0.07], [0, 0.28, 0.58], { color: '#f6d24a', rot: [90, 0, 0] })
      .box([0.025, 0.28, 0.008], [0, 0.28, 0.6], { color: '#2a2726', edge: 'sharp', round: 0.5, name: 'propeller', pivot: [0, 0.28, 0.6], mover: { kind: 'spin', axis: 'z', amount: 1500 } });
    b.pair((s) => {
      b.box([0.18, 0.032, 0.245], [s * 0.66, 0.376, 0.12], { color: '#e8312a', edge: 'sharp', round: 0.6 });
      b.rod([s * 0.02, 0.2, 0.25], [s * 0.12, 0.04, 0.27], 0.008, '#5c6166');
    });
    axle(b, 'M', 0.27, 0.26, 0.08, 0.025, '#f6d24a', 0.04);
    b.rod([0, 0.22, -0.45], [0, 0.03, -0.5], 0.006, '#5c6166').ball(0.03, [0, 0.015, -0.5], { color: 'rubber' });
    return b.act({ click: [[A.operate('propeller', 'on'), A.say('Bzzzzzz!', 2)], [A.operate('propeller', 'off'), A.say('Bzz... zz.', 1.2)]] }).done();
  }),
  // A radio-controlled buggy (42 cm): a moulded lime shell on a black chassis, big knobbly tyres, a spoiler, an
  // aerial and a little driver. Click: it spins a doughnut in a cloud of dust.
  e('remote controlled car', 'toys', 'rc toys', () => {
    const b = m('remote controlled car', { view: 'side' })
      .box([0.2, 0.02, 0.42], [0, 0.05, 0], { color: '#2a2726', edge: 'sharp', round: 0.3 })
      .loft([0.2, 0.09, 0.34], [0, 0.1, 0.0], [[0, 0.8, 0.6, 0], [0.3, 1, 1, 0], [0.75, 0.95, 0.8, -0.05], [1, 0.7, 0.4, -0.2]], { color: '#9be34d', boxy: 0.6 })
      .ball([0.07, 0.05, 0.08], [0, 0.15, -0.02], { color: '#2f3d52' })
      .ball(0.03, [0, 0.17, -0.02], { color: '#f6d24a' })
      .box([0.24, 0.012, 0.06], [0, 0.19, -0.2], { color: '#e0473b', edge: 'sharp' })
      .stick([0.06, 0.1, -0.12], [0.07, 0.36, -0.15], 0.004, '#2a2726');
    b.pair((s) => {
      b.stick([s * 0.07, 0.12, -0.19], [s * 0.07, 0.19, -0.2], 0.01, '#2a2726');
      b.ball([0.03, 0.02, 0.01], [s * 0.05, 0.1, 0.17], { color: '#fff6c8', glow: true });
    });
    axle(b, 'F', 0.13, 0.22, 0.12, 0.055, '#f6d24a');
    axle(b, 'B', -0.13, 0.22, 0.12, 0.06, '#f6d24a');
    return b.act({ click: [A.par(A.anim('spin', 2), A.effect('dust', { dur: 1.5 }), A.say('Vrrrooom!', 1.5))] }).done();
  }),
  // A radio-controlled helicopter (45 cm long): a blue body with a bubble canopy, tail boom with fin and tail
  // rotor, skids, and a main rotor that is always turning. Click: it lifts off, hovers and lands.
  e('remote controlled helicopter', 'toys', 'rc toys', () => {
    const b = m('remote controlled helicopter', { view: 'side' })
      .loft([0.1, 0.12, 0.24], [0, 0.11, 0.03], [[0, 0.4, 0.4, 0.1], [0.35, 1, 1, 0], [0.8, 0.9, 0.9, -0.02], [1, 0.4, 0.45, -0.05]], { color: '#3f7ac4', name: 'body' })
      .ball([0.085, 0.075, 0.1], [0, 0.13, 0.1], { color: '#2f3d52', parent: 'body' })
      .rod([0, 0.13, -0.08], [0, 0.15, -0.32], 0.02, '#3f7ac4', { parent: 'body' })
      .box([0.008, 0.07, 0.05], [0, 0.18, -0.32], { color: '#f6d24a', parent: 'body', edge: 'sharp' })
      .box([0.07, 0.006, 0.012], [0.012, 0.15, -0.325], { color: '#2a2726', parent: 'body', edge: 'sharp' })
      .stick([0, 0.17, 0.02], [0, 0.21, 0.02], 0.012, '#2a2726', { parent: 'body' })
      .box([0.44, 0.006, 0.025], [0, 0.215, 0.02], { color: '#2a2726', name: 'rotor', parent: 'body', edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.05, 0.008, -0.07], [s * 0.05, 0.008, 0.13], 0.01, '#2a2726', { parent: 'body' }).stick([s * 0.05, 0.008, 0.07], [s * 0.025, 0.07, 0.07], 0.007, '#2a2726', { parent: 'body' }).stick([s * 0.05, 0.008, -0.02], [s * 0.025, 0.07, -0.02], 0.007, '#2a2726', { parent: 'body' }));
    return b.act({ click: [A.par(A.pose('body', { move: [0, 0.45, 0], dur: 1.2 }), A.say('Whirrrr!', 2)), A.pose('body', { rot: [0, 90, 0], dur: 1 }), A.pose('body', { rot: [0, 0, 0], move: [0, 0, 0], dur: 1.2 })] }).done();
  }),
  // An air-ambulance helicopter at real size (13 m long, rotor 11 m): a red-and-white loft fuselage with a bubble
  // windscreen, a sliding side door with a rescue hoist above it, skids, a tail boom with fin and tail rotor, a
  // searchlight. Click: rotors start; then the door slides and the hoist lowers; then all stops.
  e('rescue helicopter', 'garage', 'aircraft', () => {
    const r = '#d8312a', prof: Array<[number, number, number, number]> = [[0, 0.45, 0.5, 0.2], [0.25, 0.95, 0.95, 0.02], [0.6, 1, 1, 0], [0.85, 0.92, 0.88, -0.04], [1, 0.45, 0.42, -0.14]];
    const b = m('rescue helicopter', { view: 'side' })
      .loft([1.9, 2.3, 7.2], [0, 1.8, 0.6], prof, { color: r, boxy: 0.4 })
      .loft([1.93, 1.4, 7.22], [0, 1.45, 0.6], prof, { color: 'white', boxy: 0.4, cut: 'bottom', edge: 'sharp' })
      .ball([1.55, 1.25, 1.5], [0, 2.1, 3.45], { color: '#2f3d52' })
      .loft([0.62, 0.75, 5.6], [0, 2.25, -5.6], [[0, 0.5, 0.55, 0.1], [1, 1, 1, 0]], { color: r })
      .box([0.12, 1.7, 1.1], [0, 3.0, -8.25], { color: r, rot: [-22, 0, 0], round: 0.4, edge: 'sharp' })
      .box([2.2, 0.08, 0.6], [0, 2.3, -7.4], { color: 'white', edge: 'sharp', round: 0.4 })
      .cyl([0.22, 0.3, 0.22], [0.16, 3.2, -8.5], { color: '#5c6166', rot: [0, 0, 90] })
      .box([0.05, 1.6, 0.16], [0.3, 3.2, -8.5], { color: '#3a3633', edge: 'sharp', name: 'tailrotor', pivot: [0.3, 3.2, -8.5], mover: { kind: 'spin', axis: 'x', amount: 1400 } })
      .loft([1.25, 0.7, 2.8], [0, 3.15, 0.0], [[0, 0.6, 0.5, -0.1], [0.3, 1, 1, 0], [1, 0.8, 0.7, -0.1]], { color: r, boxy: 0.5 })
      .stick([0, 3.3, 0.2], [0, 3.85, 0.2], 0.24, '#5c6166')
      .cyl([0.5, 0.2, 0.5], [0, 3.85, 0.2], { color: '#3a3633', name: 'blades', mover: { kind: 'spin', axis: 'y', amount: 600 } })
      .box([11, 0.07, 0.36], [0, 3.95, 0.2], { color: '#3a3633', edge: 'sharp', round: 0.3, parent: 'blades' })
      .box([0.36, 0.07, 11], [0, 3.95, 0.2], { color: '#3a3633', edge: 'sharp', round: 0.3, parent: 'blades' })
      .ball([0.4, 0.3, 0.4], [0, 0.72, 3.4], { color: '#fff6c8', name: 'searchlight', mover: { kind: 'light' } })
      .label('AIR AMBULANCE', [2.6, 0.32], [0.33, 2.25, -5.2], { color: 'white', rot: [0, 90, 0], depth: 0.02 })
      .box([0.06, 1.55, 1.5], [0.96, 1.75, 1.1], { color: 'white', round: 0.15, edge: 'sharp', name: 'door', mover: { kind: 'slide', axis: 'z', amount: -1.5 } })
      .box([0.06, 0.6, 0.9], [0.98, 2.15, 1.1], { color: '#2f3d52', round: 0.2, parent: 'door', edge: 'sharp' })
      .box([0.07, 0.42, 0.14], [0.99, 1.45, 1.1], { color: r, parent: 'door', edge: 'sharp' })
      .box([0.07, 0.14, 0.42], [0.99, 1.45, 1.1], { color: r, parent: 'door', edge: 'sharp' })
      .box([0.06, 0.6, 0.9], [-0.98, 2.15, 1.1], { color: '#2f3d52', round: 0.2, edge: 'sharp' })
      .box([0.75, 0.14, 0.14], [1.2, 2.95, 1.2], { color: '#5c6166', edge: 'sharp' })
      .stick([1.55, 2.9, 1.2], [1.55, 2.45, 1.2], 0.025, '#2a2726', { name: 'hoist', mover: { kind: 'slide', axis: 'y', amount: -1.6 } })
      .arc([0.2, 0.2, 0.04], [1.55, 2.38, 1.2], { color: '#f6d24a', rot: [0, 0, 180], arc: 270, parent: 'hoist', edge: 'sharp' });
    b.pair((s) => {
      b.stick([s * 1.05, 0.12, -1.2], [s * 1.05, 0.12, 2.6], 0.1, '#5c6166').rod([s * 1.05, 0.12, 2.6], [s * 1.05, 0.3, 2.95], 0.1, '#5c6166');
      b.rod([s * 1.05, 0.12, 1.6], [s * 0.6, 0.8, 1.6], 0.08, '#5c6166').rod([s * 1.05, 0.12, -0.5], [s * 0.6, 0.8, -0.5], 0.08, '#5c6166');
      b.ball([0.1, 0.1, 0.1], [s * 1.1, 1.0, -2.6], { color: s > 0 ? '#5aa553' : '#e0473b', glow: true });
    });
    return b
      .socket('seat', [0.45, 1.3, 2.6], 'seat')
      .act({
        click: [
          [A.par(A.operate('blades', 'on'), A.operate('tailrotor', 'on'), A.operate('searchlight', 'on'), A.say('Whup whup whup!', 2))],
          [A.operate('door', 'open'), A.operate('hoist', 'down'), A.say('Whirrr!', 1.5)],
          [A.operate('hoist', 'up'), A.operate('door', 'close'), A.par(A.operate('blades', 'off'), A.operate('tailrotor', 'off'), A.operate('searchlight', 'off'))],
        ],
      })
      .done();
  }),
  // A full-face gas mask on a grey head form (45 cm): rubber face piece, two round glass eyepieces in metal rims,
  // a screw-in filter canister (a piece) and head straps. Click: it breathes; the filter unscrews and goes back.
  e('respirator', 'workshop', 'safety gear', () => {
    const rb = '#4a5040';
    const b = m('respirator')
      .box([0.2, 0.03, 0.2], [0, 0.015, -0.02], { color: '#5c6166', edge: 'sharp' })
      .cyl([0.07, 0.16, 0.07], [0, 0.1, -0.03], { color: '#c4c7ca' })
      .ball([0.16, 0.22, 0.19], [0, 0.29, -0.03], { color: '#d4d7da' })
      .ball([0.17, 0.2, 0.1], [0, 0.28, 0.035], { color: rb, name: 'mask' })
      .rod([0.075, 0.33, 0.0], [0.07, 0.35, -0.12], 0.02, '#2a2726', { parent: 'mask' })
      .rod([-0.075, 0.33, 0.0], [-0.07, 0.35, -0.12], 0.02, '#2a2726', { parent: 'mask' })
      .arc([0.17, 0.12, 0.02], [0, 0.34, -0.12], { color: '#2a2726', rot: [-90, 0, 0], tube: 0.12, arc: 200, parent: 'mask' })
      .cyl([0.045, 0.025, 0.045], [0, 0.2, 0.09], { color: '#3a3633', rot: [70, 0, 0], parent: 'mask', edge: 'sharp' })
      .cyl([0.07, 0.07, 0.07], [0, 0.17, 0.13], { color: '#6a6f5a', rot: [60, 0, 0], name: 'filter', parent: 'mask', piece: true, edge: 'sharp' })
      .cyl([0.05, 0.072, 0.05], [0, 0.17, 0.132], { color: '#3a3633', rot: [60, 0, 0], parent: 'filter', noInk: true });
    b.pair((s) => b.cyl([0.06, 0.02, 0.06], [s * 0.04, 0.315, 0.09], { color: '#c9ccd1', rot: [80, 0, 0], parent: 'mask', edge: 'sharp' }).cyl([0.045, 0.022, 0.045], [s * 0.04, 0.315, 0.092], { color: '#9fc6d8', rot: [80, 0, 0], parent: 'mask', edge: 'sharp' }));
    return b
      .act({
        click: [
          [A.par(A.pose('mask', { scale: 1.04, dur: 0.6 }), A.say('Hooo... pahhh...', 2)), A.pose('mask', { scale: 1, dur: 0.6 })],
          [A.detach('filter', 'canister'), A.say('Clack!', 1)],
          [A.reattach('filter'), A.say('Twist, click.', 1.2)],
        ],
      })
      .done();
  }),
  // A corner restaurant (8 m frontage): red-and-white awning, sign, a menu board by the door, a kitchen chimney,
  // and two pavement tables with parasols and chairs. Click: the door opens with a bell and the kitchen steams.
  e('restaurant', 'places', 'restaurants', () => {
    const b = shop('restaurant', { w: 8, h: 4.6, d: 8, wall: '#f3e2c4', trim: '#a3322a', sign: 'RESTAURANT', signBg: 'white', awning: ['#e0473b', 'white'], door: '#5a3a22' });
    b.stick([2.6, 4.7, -2], [2.6, 6.6, -2], 0.5, '#9da3a8').cyl([0.7, 0.15, 0.7], [2.6, 6.65, -2], { color: '#5c6166' });
    for (const xx of [-2.5, 2.4]) {
      b.cyl([0.75, 0.04, 0.75], [xx, 0.9, 6.0], { color: 'white' }).stick([xx, 0.15, 6.0], [xx, 0.9, 6.0], 0.06, '#5c6166').cyl([0.4, 0.03, 0.4], [xx, 0.165, 6.0], { color: '#5c6166' });
      b.stick([xx, 0.92, 6.0], [xx, 2.6, 6.0], 0.04, '#c9ccd1').cone([2.2, 0.55, 2.2], [xx, 2.55, 6.0], { color: '#e0473b', segs: 8 });
      b.pair((s) => {
        b.box([0.42, 0.04, 0.42], [xx + s * 0.62, 0.6, 6.0], { color: '#7a5230' }).box([0.42, 0.45, 0.04], [xx + s * 0.82, 0.83, 6.0], { color: '#7a5230', rot: [0, 90, 0] });
        b.pair((t) => b.stick([xx + s * 0.62 + t * 0.17, 0.15, 6.17], [xx + s * 0.62 + t * 0.17, 0.58, 6.17], 0.03, '#2a2726').stick([xx + s * 0.62 + t * 0.17, 0.15, 5.83], [xx + s * 0.62 + t * 0.17, 0.58, 5.83], 0.03, '#2a2726'));
      });
    }
    b.wedge([0.6, 1.0, 0.25], [1.1, 0.65, 4.7], { color: '#5a3a22' }).label('MENU', [0.4, 0.5], [1.1, 0.6, 4.84], { color: '#2a2726', rot: [-7, 0, 0], depth: 0.01 });
    return b.act({ click: [A.par(A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5), A.effect('steam', { dur: 3 })), A.wait(2.5), A.operate('door', 'close')] }).done();
  }),
  // A section of security fence (3 m x 2.1 m): steel posts, chain-link mesh, barbed wire on angled arms, a
  // DANGER / RESTRICTED AREA sign, and a beacon that flashes when someone comes near.
  e('restricted area sign', 'ideas', 'warning signs', () => {
    const b = m('restricted area sign', { edge: 'sharp' });
    b.pair((s) => {
      b.box([0.3, 0.12, 0.3], [s * 1.5, 0.06, 0], { color: '#a7a7a0' }).stick([s * 1.5, 0.1, 0], [s * 1.5, 2.05, 0], 0.08, '#9da3a8');
      b.rod([s * 1.5, 2.0, 0], [s * 1.5, 2.35, 0.28], 0.04, '#9da3a8');
    });
    b.stick([-1.5, 2.0, 0], [1.5, 2.0, 0], 0.05, '#9da3a8').stick([-1.5, 0.12, 0], [1.5, 0.12, 0], 0.03, '#9da3a8');
    b.each(13, (i) => {
      const x0 = -1.5 + i * 0.25;
      b.stick([x0, 0.12, 0], [Math.min(1.5, x0 + 1.88), 0.12 + Math.min(1.88, 1.5 - x0), 0], 0.012, '#b9c2ca', { noInk: true });
      b.stick([-x0, 0.12, 0.005], [Math.max(-1.5, -x0 - 1.88), 0.12 + Math.min(1.88, 1.5 - x0), 0.005], 0.012, '#b9c2ca', { noInk: true });
    });
    b.each(3, (i) => b.stick([-1.5, 2.12 + i * 0.1, 0.1 + i * 0.08], [1.5, 2.12 + i * 0.1, 0.1 + i * 0.08], 0.012, '#5c6166'));
    b.box([1.1, 0.7, 0.03], [0, 1.25, 0.04], { color: 'white', round: 0.1 })
      .box([1.1, 0.2, 0.035], [0, 1.5, 0.045], { color: '#d8312a', round: 0.1 })
      .label('DANGER', [0.6, 0.14], [0, 1.5, 0.065], { color: '#d8312a', depth: 0.01 })
      .label('RESTRICTED AREA', [0.95, 0.16], [0, 1.27, 0.06], { color: 'white', depth: 0.01 })
      .label('AUTHORISED PERSONNEL ONLY', [0.95, 0.1], [0, 1.05, 0.06], { color: 'white', depth: 0.01 })
      .cyl([0.14, 0.06, 0.14], [1.5, 2.08, 0], { color: '#2a2726' })
      .dome([0.12, 0.14, 0.12], [1.5, 2.18, 0], { color: '#ff8a2a', name: 'beacon', mover: { kind: 'light' } });
    return b.act({ click: [A.par(A.operate('beacon', 'on'), A.say('Bzzzt! Keep out!', 2)), A.wait(2), A.operate('beacon', 'off')] }).done();
  }),
  // Retro wayfarer sunglasses (14 cm): thick black acetate frames with dark lenses and silver rivets; the arms
  // fold in on their hinges and open again.
  e('retro glasses', 'wardrobe', 'glasses', () => {
    const b = m('retro glasses', { edge: 'sharp' }).box([0.026, 0.014, 0.012], [0, 0.052, 0.07], { color: '#2a2726', round: 0.4 });
    b.pair((s) => {
      b.box([0.062, 0.046, 0.013], [s * 0.043, 0.044, 0.07], { color: '#2a2726', round: 0.45 })
        .box([0.048, 0.033, 0.006], [s * 0.043, 0.042, 0.077], { color: '#2b3a44', round: 0.5 })
        .cyl([0.005, 0.003, 0.005], [s * 0.066, 0.06, 0.077], { color: '#c9ccd1', rot: [90, 0, 0] })
        .box([0.008, 0.012, 0.13], [s * 0.071, 0.055, 0.002], { color: '#2a2726', round: 0.4, name: s > 0 ? 'armL' : 'armR', pivot: [s * 0.071, 0.055, 0.066], mover: { kind: 'swing', axis: 'y', amount: s * 85 } })
        .box([0.008, 0.035, 0.012], [s * 0.071, 0.04, -0.066], { color: '#2a2726', round: 0.4, rot: [-30, 0, 0], parent: s > 0 ? 'armL' : 'armR' });
    });
    return b.act({ click: [A.operate('arm'), A.say('Snap!', 1)] }).done();
  }),
  // A six-shooter on a little wooden display stand (28 cm long): barrel with sight, a cylinder of six chambers
  // that spins, a hammer that cocks, trigger guard and a walnut grip.
  e('revolver', 'armory', 'guns', () => {
    const st = '#5c6166';
    const b = m('revolver', { view: 'side', edge: 'sharp' })
      .box([0.08, 0.02, 0.3], [0, 0.01, 0], { color: '#7a5230' })
      .stick([0, 0.02, 0.07], [0, 0.11, 0.07], 0.012, '#d0a84a')
      .stick([0, 0.02, -0.06], [0, 0.07, -0.06], 0.012, '#d0a84a')
      .cyl([0.02, 0.15, 0.02], [0, 0.135, 0.12], { color: st, rot: [90, 0, 0] })
      .box([0.008, 0.012, 0.01], [0, 0.149, 0.19], { color: st })
      .box([0.026, 0.045, 0.09], [0, 0.128, -0.005], { color: st, round: 0.3 })
      .cyl([0.048, 0.05, 0.048], [0, 0.128, 0.015], { color: '#8f99a3', rot: [90, 0, 0], name: 'cylinder', mover: { kind: 'spin', axis: 'z', amount: 900 } });
    b.each(6, (i) => b.cyl([0.01, 0.052, 0.01], [Math.cos(i * 1.047) * 0.014, 0.128 + Math.sin(i * 1.047) * 0.014, 0.015], { color: '#2a2726', rot: [90, 0, 0], parent: 'cylinder', noInk: true }));
    b.box([0.014, 0.03, 0.02], [0, 0.155, -0.055], { color: st, round: 0.3, rot: [20, 0, 0], name: 'hammer', pivot: [0, 0.14, -0.05], mover: { kind: 'swing', axis: 'x', amount: -35 } })
      .arc([0.04, 0.04, 0.008], [0, 0.1, -0.01], { color: st, rot: [0, 90, 180], tube: 0.2 })
      .box([0.005, 0.022, 0.005], [0, 0.098, -0.015], { color: st, rot: [-15, 0, 0] })
      .box([0.03, 0.1, 0.04], [0, 0.07, -0.075], { color: '#5a3a22', round: 0.5, rot: [22, 0, 0], edge: 'soft' })
      .cyl([0.006, 0.032, 0.006], [0, 0.075, -0.075], { color: '#d0a84a', rot: [0, 0, 90] });
    return b
      .act({
        click: [
          [A.operate('cylinder', 'on'), A.say('Whirrr... click!', 1.5), A.wait(1), A.operate('cylinder', 'off')],
          [A.operate('hammer'), A.say('Click!', 1)],
        ],
      })
      .done();
  }),
  // A revolving door at real size (2.2 m drum, 2.5 m tall): a floor disc, curved glass side walls, a dark canopy
  // with ENTRANCE, glass shop-front either side, and four glass wings on a centre post that turn when clicked.
  e('revolving door', 'home', 'doors', () => {
    const b = m('revolving door', { edge: 'sharp' })
      .cyl([2.4, 0.06, 2.4], [0, 0.03, 0], { color: '#5c6166' })
      .cyl([2.5, 0.35, 2.5], [0, 2.58, 0], { color: '#3a3f45' })
      .label('ENTRANCE', [1.3, 0.22], [0, 2.58, 1.26], { color: '#3a3f45', depth: 0.02 });
    b.pair((s) => b.arc([2.3, 2.3, 2.4], [0, 1.2, 0], { color: '#bfe3f2', rot: [90, 0, s * 90], arc: 100, tube: 0.03 }));
    b.pair((s) => {
      b.box([1.6, 2.75, 0.06], [s * 1.95, 1.375, 0], { color: '#bfe3f2', round: 0.05 });
      b.box([1.7, 0.1, 0.1], [s * 1.95, 2.72, 0], { color: '#3a3f45' }).box([1.7, 0.1, 0.1], [s * 1.95, 0.05, 0], { color: '#3a3f45' }).box([0.1, 2.75, 0.1], [s * 2.75, 1.375, 0], { color: '#3a3f45' });
    });
    b.cyl([0.12, 2.36, 0.12], [0, 1.24, 0], { color: '#c9ccd1', name: 'wings', mover: { kind: 'spin', axis: 'y', amount: 90 } })
      .box([2.1, 2.2, 0.04], [0, 1.2, 0], { color: '#cfe8f4', parent: 'wings', round: 0.05 })
      .box([0.04, 2.2, 2.1], [0, 1.2, 0], { color: '#cfe8f4', parent: 'wings', round: 0.05 })
      .box([2.12, 0.08, 0.07], [0, 0.95, 0], { color: '#c9ccd1', parent: 'wings' })
      .box([0.07, 0.08, 2.12], [0, 0.95, 0], { color: '#c9ccd1', parent: 'wings' });
    return b.act({ click: [A.operate('wings', 'on'), A.say('Whoosh!', 1.5), A.wait(3), A.operate('wings', 'off')] }).done();
  }),
  // A reservoir at its dam (26 m wide, 10 m high): a concrete dam with buttresses and a walkway between two green
  // hills, the lake brimming behind it, a valve tower, a spillway chute with a sluice gate, and the river below.
  // Click: the sluice gate lifts and water thunders down the spillway.
  e('reservoir', 'places', 'waterworks', () => {
    const b = m('reservoir', { edge: 'sharp' })
      .box([46, 0.4, 40], [0, 0.2, -4], { color: '#6ab04c', round: 0.02 })
      .box([24, 10, 4], [0, 5.2, 0], { color: '#c4c2b8', round: 0.02 })
      .box([25, 0.4, 5], [0, 10.4, 0], { color: '#d4d7da', round: 0.05 })
      .box([26, 0.35, 22], [0, 9.6, -13], { color: '#4f9bd6', edge: 'soft' })
      .ball([20, 13, 30], [-21, 2.5, -6], { color: '#6ab04c', edge: 'soft' })
      .ball([20, 13, 30], [21, 2.5, -6], { color: '#5aa553', edge: 'soft' })
      .ball([50, 9, 12], [0, 3, -26], { color: '#6ab04c', edge: 'soft' })
      .box([7, 0.15, 14], [0, 0.42, 9], { color: '#4f9bd6' });
    b.each(6, (i) => i !== 2 && i !== 3 && b.box([1.2, 10, 1.2], [-10 + i * 4, 5.2, 2.2], { color: '#b8b5ac', round: 0.05 }));
    b.pair((s) => b.stick([-12.4, 11.1, s * 2.4], [12.4, 11.1, s * 2.4], 0.08, '#9da3a8').each(5, (i) => b.stick([-12 + i * 6, 10.6, s * 2.4], [-12 + i * 6, 11.15, s * 2.4], 0.08, '#9da3a8')));
    b.box([3, 3, 3], [7, 12.1, 0], { color: '#e8e4dc' }).pyramid([3.4 * Math.SQRT2, 1.6, 3.4 * Math.SQRT2], [7, 14.4, 0], 4, { color: '#a3322a' });
    door(b, [7, 11.7, 1.53], 0.9, 2.0, '#3f6f9a');
    b.box([4, 0.4, 11], [0, 5.3, 3.6], { color: '#d4d7da', rot: [-60, 0, 0] })
      .box([3.4, 0.1, 10.6], [0, 5.5, 3.6], { color: '#7fc4ef', rot: [-60, 0, 0], noInk: true })
      .box([3.6, 2.2, 0.3], [0, 9.0, 2.3], { color: '#5c6166', name: 'gate', mover: { kind: 'slide', axis: 'y', amount: 1.8 } })
      .box([4.4, 0.4, 0.5], [0, 10.9, 2.3], { color: '#3a3f45' });
    b.pair((s) => b.stick([s * 11, 10.6, 2.2], [s * 11, 12.6, 2.2], 0.12, '#3a3f45').ball(0.35, [s * 11, 12.7, 2.2], { color: '#fff6c8', glow: true }));
    return b.act({ click: [A.operate('gate', 'up'), A.par(A.effect('water_spray', { dur: 3 }), A.say('Whooooosh!', 2.5)), A.wait(1), A.operate('gate', 'down')] }).done();
  }),
  // A rhombus: a purple diamond tile (four equal sides) on a little wooden plinth.
  e('rhombus (shape)', 'ideas', 'shapes', () =>
    plinth(m('rhombus (shape)', { edge: 'sharp' }))
      .wedge([0.1, 0.075, 0.02], [0, 0.1375, 0], { color: '#8a5fc4', name: 'shape' })
      .wedge([0.1, 0.075, 0.02], [0, 0.0625, 0], { color: '#8a5fc4', rot: [0, 0, 180], parent: 'shape' })
      .act({ click: [A.par(A.anim('spin'), A.say('Four equal sides!', 2))] })
      .done(),
  ),
  // A rhubarb pie (24 cm) in its tin, built from eight slices so one can come out and leave a real gap: pink
  // filling, a golden lattice top and a crimped rim. Click: a slice lifts out, steaming; click again, back in.
  e('rhubarb pie', 'food', 'pies', () => {
    const R = 0.115, hgt = R * Math.cos(Math.PI / 8), base = 2 * R * Math.sin(Math.PI / 8) + 0.002;
    const b = m('rhubarb pie')
      .cyl([0.25, 0.035, 0.25], [0, 0.0175, 0], { color: '#c9ccd1', taper: 1.1, edge: 'sharp' })
      .torus([0.262, 0.262, 0.034], [0, 0.058, 0], { color: '#d9a35f', rot: [90, 0, 0], tube: 0.13 });
    b.each(16, (i) => b.ball([0.022, 0.02, 0.022], [Math.sin(i * 0.3927) * 0.12, 0.066, Math.cos(i * 0.3927) * 0.12], { color: '#e0b06a' }));
    b.each(8, (k) => {
      const ph = (k + 0.5) * 45, sx = Math.sin(ph * D2R), sz = Math.cos(ph * D2R), at: V = [sx * hgt * 0.5, 0.05, sz * hgt * 0.5];
      const o = k === 0 ? { name: 'slice', piece: true } : {};
      b.wedge([base, hgt, 0.028], at, { color: '#c0405a', rot: [-90, 0, ph], ...o });
      const par = k === 0 ? { parent: 'slice' } : {};
      b.wedge([base * 0.98, hgt * 0.98, 0.006], [at[0], 0.066, at[2]], { color: '#e0b06a', rot: [-90, 0, ph], ...par });
      b.box([0.006, 0.008, 0.04], [sx * hgt * 0.55, 0.069, sz * hgt * 0.55], { color: '#b03050', rot: [0, ph, 0], noInk: true, ...par });
    });
    return b.act({ click: [[A.pose('slice', { move: [0.02, 0.06, 0.1], dur: 0.6 }), A.effect('steam', { dur: 2 })], [A.pose('slice', { move: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A big satin ribbon bow (35 cm) with two loops, a knot and long tails cut in a V. Click: the loops plump up
  // and it sparkles.
  e('ribbon', 'toys', 'party things', () => {
    const r = '#d8312a', dk = '#a3322a';
    const b = m('ribbon').ball([0.075, 0.07, 0.06], [0, 0.27, 0.02], { color: r, name: 'knot' });
    b.pair((s) => {
      const nm = s > 0 ? 'loopL' : 'loopR';
      b.ball([0.19, 0.12, 0.07], [s * 0.1, 0.3, 0], { color: r, rot: [0, 0, s * 14], name: nm, pivot: [0, 0.27, 0.01] });
      b.ball([0.07, 0.035, 0.02], [s * 0.08, 0.3, 0.03], { color: dk, noInk: true, rot: [0, 0, s * 14], parent: nm });
      b.box([0.075, 0.2, 0.014], [s * 0.075, 0.17, 0.012], { color: r, rot: [0, s * 10, s * 28], round: 0.3, name: s > 0 ? 'tailL' : 'tailR', pivot: [0, 0.26, 0.01] });
      b.wedge([0.075, 0.03, 0.014], [s * 0.125, 0.072, 0.012], { color: r, rot: [0, s * 10, 180 + s * 28], parent: s > 0 ? 'tailL' : 'tailR' });
    });
    return b
      .act({ click: [A.par(A.pose('loopL', { rot: [0, 0, -12], dur: 0.3 }), A.pose('loopR', { rot: [0, 0, 12], dur: 0.3 }), A.pose('tailL', { rot: [0, 0, 10], dur: 0.3 }), A.pose('tailR', { rot: [0, 0, -10], dur: 0.3 }), A.effect('sparkle', { dur: 1.5 })), A.par(A.pose('loopL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('loopR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('tailL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('tailR', { rot: [0, 0, 0], dur: 0.4 }))] })
      .done();
  }),
  // An anatomy model of the rib cage on a stand (real adult size, 30 cm of ribs): the spine at the back, twelve
  // pairs of curving ribs, the breastbone and collarbones. Click: it breathes in and out.
  e('ribcage', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('ribcage', { edge: 'sharp' })
      .box([0.24, 0.025, 0.2], [0, 0.0125, -0.04], { color: '#3a3633', round: 0.2 })
      .stick([0, 0.02, -0.14], [0, 0.18, -0.14], 0.012, '#c9ccd1')
      .capsule([0.04, 0.4, 0.04], [0, 0.36, -0.12], { color: bone, name: 'spine', edge: 'soft' });
    b.each(10, (i) => b.box([0.05, 0.022, 0.035], [0, 0.19 + i * 0.036, -0.135], { color: '#e2d9c2', round: 0.5, parent: 'spine', edge: 'soft' }));
    b.each(9, (i) => {
      const w = 0.16 + 0.11 * Math.sin(((i + 1.5) / 10) * Math.PI), y = 0.5 - i * 0.032;
      b.arc([w, w * 0.8, 0.014], [0, y, -0.12 + w * 0.02], { color: bone, rot: [-90 - 12, 0, 0], arc: 300, tube: 0.07, parent: 'spine', edge: 'soft' });
    });
    b.box([0.035, 0.18, 0.02], [0, 0.42, 0.03], { color: bone, round: 0.4, rot: [-10, 0, 0], parent: 'spine' });
    b.pair((s) => b.rod([s * 0.02, 0.52, 0.03], [s * 0.15, 0.53, -0.06], 0.018, bone, { parent: 'spine', edge: 'soft' }));
    return b.act({ click: [A.par(A.anim('pulse', 2), A.say('Breathe in... and out.', 2.5))] }).done();
  }),
  // A blue-and-white bowl of steamed rice, grains on top, chopsticks resting across the rim. Click: the
  // chopsticks pick up a bite as it steams.
  e('rice', 'food', 'grains', () => {
    const b = m('rice')
      .cyl([0.08, 0.02, 0.08], [0, 0.01, 0], { color: 'white' })
      .cyl([0.15, 0.07, 0.15], [0, 0.05, 0], { color: 'white', taper: 1.25 })
      .cyl([0.17, 0.018, 0.17], [0, 0.05, 0], { color: '#3f6fb5', noInk: true })
      .dome([0.17, 0.05, 0.17], [0, 0.098, 0], { color: '#fbf9f2' });
    b.each(16, (i) => b.ball([0.008, 0.004, 0.004], surf([0, 0.073, 0], [0.08, 0.05, 0.08], i * 67, 30 + (i % 4) * 12), { color: 'white', rot: [0, i * 40, 0], noInk: true }));
    b.stick([-0.1, 0.09, 0.07], [0.12, 0.12, 0.0], 0.007, '#7a5230', { name: 'chopsticks', pivot: [0.12, 0.12, 0.0], edge: 'sharp' })
      .stick([-0.1, 0.09, 0.05], [0.12, 0.12, -0.02], 0.007, '#7a5230', { parent: 'chopsticks', edge: 'sharp' })
      .ball([0.02, 0.014, 0.014], [-0.1, 0.09, 0.06], { color: 'white', parent: 'chopsticks' });
    return b.act({ click: [A.par(A.pose('chopsticks', { rot: [0, 0, -20], dur: 0.6 }), A.effect('steam', { dur: 2 })), A.wait(1), A.pose('chopsticks', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A stack of puffed rice cakes (10 cm) on a little plate; the top cake is a piece that lifts off. Crunch.
  e('rice cake', 'food', 'snacks', () => {
    const b = plate(m('rice cake'), 0.16);
    b.each(3, (i) => b.cyl([0.1, 0.02, 0.1], [i * 0.004, 0.022 + i * 0.021, i * 0.003], { color: i % 2 ? '#e9d9ae' : '#efe2bc' }));
    b.cyl([0.1, 0.02, 0.1], [0.008, 0.085, 0.004], { color: '#f3e7c6', name: 'cake', piece: true });
    b.each(10, (i) => b.ball([0.012, 0.006, 0.009], [0.008 + Math.cos(i * 2.4) * 0.032, 0.096, 0.004 + Math.sin(i * 2.4) * 0.032], { color: '#d9c48e', noInk: true, rot: [0, i * 30, 0] }));
    return b.act({ click: [[A.pose('cake', { move: [0.04, 0.05, 0.04], rot: [20, 0, 0], dur: 0.5 }), A.say('Crunch!', 1)], [A.pose('cake', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // An electric rice cooker (26 cm): a white body, a domed lid on a back hinge with a release button and steam
  // vent, a control panel with COOK and WARM lights, and the rice paddle in its holder. Click: it cooks (steam,
  // the light on), dings and pops its lid; click again to close it.
  e('rice cooker', 'kitchen', 'appliances', () => {
    const b = m('rice cooker', { edge: 'sharp' })
      .cyl([0.28, 0.17, 0.26], [0, 0.095, 0], { color: '#f7f5ef', edge: 'soft' })
      .cyl([0.24, 0.012, 0.22], [0, 0.006, 0], { color: '#5c6166' })
      .cyl([0.285, 0.02, 0.265], [0, 0.18, 0], { color: '#d4d7da' })
      .dome([0.27, 0.07, 0.25], [0, 0.225, 0], { color: '#f7f5ef', name: 'lid', pivot: [0, 0.19, -0.125], mover: { kind: 'swing', axis: 'x', amount: -95 }, edge: 'soft' })
      .cyl([0.035, 0.015, 0.035], [0.04, 0.263, -0.03], { color: '#9da3a8', parent: 'lid' })
      .box([0.1, 0.03, 0.04], [0, 0.245, -0.09], { color: '#d4d7da', round: 0.5, parent: 'lid' })
      .box([0.045, 0.025, 0.03], [0, 0.17, 0.135], { color: '#9da3a8', round: 0.3 })
      .box([0.12, 0.07, 0.02], [0, 0.085, 0.13], { color: '#3a3633', round: 0.3, rot: [-12, 0, 0] })
      .ball([0.016, 0.016, 0.01], [-0.03, 0.095, 0.141], { color: '#ff5a3a', name: 'cook', mover: { kind: 'light' } })
      .ball([0.016, 0.016, 0.01], [0.03, 0.095, 0.141], { color: '#ffb84a', name: 'warm', mover: { kind: 'light' } })
      .box([0.03, 0.012, 0.012], [0, 0.068, 0.138], { color: '#e8e4dc', rot: [-12, 0, 0] })
      .box([0.04, 0.07, 0.03], [0.155, 0.12, 0], { color: '#d4d7da', round: 0.3 })
      .box([0.035, 0.012, 0.11], [0.163, 0.17, 0.02], { color: 'white', round: 0.5, rot: [-75, 0, 0] });
    return b
      .act({
        click: [
          [A.operate('cook', 'on'), A.par(A.effect('steam', { dur: 3 }), A.say('Bubble, bubble...', 2.5)), A.wait(1), A.par(A.operate('cook', 'off'), A.operate('warm', 'on')), A.say('Ding!', 1), A.operate('lid', 'open')],
          [A.operate('lid', 'close'), A.operate('warm', 'off')],
        ],
      })
      .done();
  }),
  // A tuk-tuk at real size (2.7 m long, 1.9 m tall): a single steered front wheel, a narrow driver's nose with a
  // windscreen and handlebars, a bench for passengers under a canvas roof on posts, two rear wheels, a headlight.
  // Click: it beeps, flashes and rocks on its springs.
  e('rickshaw', 'garage', 'cars', () => {
    const g = '#2e9e4f', y = '#f6c92e';
    const b = m('rickshaw', { view: 'side', edge: 'sharp' })
      .box([1.2, 0.1, 2.3], [0, 0.4, -0.25], { color: '#3a3633', round: 0.2 })
      .loft([1.3, 0.62, 2.55], [0, 0.72, -0.1], [[0, 0.95, 1, 0], [0.55, 1, 1, 0], [0.78, 0.62, 1, 0.04], [1, 0.32, 0.95, 0.1]], { color: g, boxy: 0.75, edge: 'soft' })
      .box([0.42, 0.5, 0.06], [0, 0.95, 1.12], { color: g, round: 0.3 })
      .box([1.0, 0.62, 0.04], [0, 1.38, 0.98], { color: '#bfe3f2', rot: [-8, 0, 0], round: 0.1 })
      .box([1.38, 0.08, 2.15], [0, 1.86, -0.15], { color: '#2a2726', round: 0.4 })
      .capsule([0.14, 1.38, 0.14], [0, 1.83, 0.92], { color: '#2a2726', rot: [0, 0, 90] })
      .box([1.3, 0.12, 0.05], [0, 1.76, -1.2], { color: y })
      .box([0.42, 0.1, 0.4], [0, 0.95, 0.45], { color: '#2a2726', round: 0.4, edge: 'soft' })
      .stick([0, 0.72, 1.05], [0, 1.12, 0.78], 0.05, '#3a3633')
      .stick([-0.32, 1.12, 0.78], [0.32, 1.12, 0.78], 0.035, '#3a3633')
      .box([1.12, 0.14, 0.52], [0, 0.88, -0.62], { color: '#a3322a', round: 0.5, edge: 'soft' })
      .box([1.12, 0.5, 0.12], [0, 1.18, -0.92], { color: '#a3322a', round: 0.5, edge: 'soft', rot: [-8, 0, 0] })
      .box([1.32, 0.55, 0.06], [0, 0.72, -1.36], { color: y, round: 0.1 })
      .label('TUK TUK', [0.6, 0.14], [0, 0.82, -1.395], { color: y, rot: [0, 180, 0], depth: 0.01 })
      .ball([0.2, 0.16, 0.08], [0, 1.05, 1.16], { color: '#fff6c8', name: 'lights', mover: { kind: 'light' } })
      .arc([0.56, 0.32, 0.16], [0, 0.24, 1.08], { color: g, rot: [0, 90, 0], tube: 0.12 });
    b.pair((s) => {
      b.stick([s * 0.64, 0.8, 0.88], [s * 0.66, 1.84, 0.88], 0.04, '#2a2726').stick([s * 0.64, 0.8, -1.15], [s * 0.66, 1.84, -1.15], 0.04, '#2a2726');
      b.box([0.02, 0.06, 1.6], [s * 0.655, 0.86, -0.2], { color: y, noInk: true });
      b.box([0.12, 0.08, 0.04], [s * 0.5, 0.62, -1.4], { color: '#e0473b', glow: true });
      b.box([0.06, 0.1, 0.12], [s * 0.36, 1.22, 0.8], { color: '#3a3633', round: 0.3 });
    });
    wheel(b, 'wheelF', [0, 0.23, 1.08], 0.46, 0.12, '#c9ccd1');
    b.stick([0, 0.23, 1.08], [0, 0.72, 1.05], 0.05, '#3a3633');
    axle(b, 'B', -0.9, 1.12, 0.46, 0.14, '#c9ccd1');
    return b
      .socket('seat', [0, 0.95, -0.6], 'seat')
      .act({ click: [A.operate('lights', 'on'), A.par(A.say('Beep beep!', 1.5), A.anim('wobble')), A.operate('lights', 'off')] })
      .done();
  }),
  // A tub of ricotta (14 cm) with its lid off leaning against it and a spoon in the soft curds. Click: the spoon
  // scoops a dollop.
  e('ricotta', 'food', 'cheese', () => {
    const b = m('ricotta')
      .cyl([0.12, 0.075, 0.12], [0, 0.0375, 0], { color: 'white', taper: 1.12, edge: 'sharp' })
      .cyl([0.136, 0.03, 0.136], [0, 0.05, 0], { color: '#6fb6e0', edge: 'sharp' })
      .label('RICOTTA', [0.09, 0.016], [0, 0.05, 0.068], { color: '#6fb6e0', depth: 0.003 })
      .dome([0.125, 0.025, 0.125], [0, 0.0875, 0], { color: '#fbf9f2' });
    for (const [xx, z, r] of [[0.02, 0.01, 0.04], [-0.025, -0.02, 0.035], [0.0, -0.03, 0.03]] as V[]) b.ball(r, [xx, 0.096, z], { color: '#fbf9f2' });
    b.cyl([0.14, 0.012, 0.14], [0.11, 0.065, -0.07], { color: '#6fb6e0', rot: [70, 25, 0], edge: 'sharp' })
      .stick([0.02, 0.09, 0.0], [0.09, 0.18, 0.04], 0.008, '#c9ccd1', { name: 'spoon', pivot: [0.02, 0.09, 0.0], edge: 'sharp' })
      .ball([0.03, 0.01, 0.045], [0.012, 0.088, -0.01], { color: '#c9ccd1', rot: [30, 0, 0], parent: 'spoon' })
      .ball([0.025, 0.015, 0.03], [0.012, 0.095, -0.01], { color: '#fbf9f2', parent: 'spoon' });
    return b.act({ click: [A.pose('spoon', { rot: [-40, 0, -20], move: [0, 0.05, 0.03], dur: 0.6 }), A.say('Mmm!', 1.2), A.pose('spoon', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A ride-on lawn mower at real size (1.85 m long, seat 0.8 m): a green hood loft with a grille, a black seat,
  // steering wheel, a cutting deck with a side chute and blades underneath, big yellow-rimmed back wheels.
  // Click: the blades whirr and grass flies; it seats one.
  e('riding mower', 'garden', 'garden machines', () => {
    const g = '#367c2b', yl = '#f6d24a';
    const b = m('riding mower', { view: 'side', edge: 'sharp' })
      .box([1.15, 0.12, 0.85], [0, 0.22, 0.12], { color: '#3a3f45', round: 0.3 })
      .box([0.3, 0.12, 0.42], [-0.68, 0.2, 0.12], { color: '#3a3f45', round: 0.3, rot: [0, 0, -12] })
      .box([1.0, 0.02, 0.08], [0, 0.15, 0.12], { color: '#c9ccd1', name: 'blade', mover: { kind: 'spin', axis: 'y', amount: 1200 } })
      .box([0.62, 0.12, 1.6], [0, 0.4, 0.0], { color: '#2a2726', round: 0.2 })
      .loft([0.62, 0.44, 0.8], [0, 0.66, 0.5], [[0, 1, 1, 0], [0.6, 1, 1, 0.02], [1, 0.82, 0.75, -0.08]], { color: g, boxy: 0.75, edge: 'soft' })
      .box([0.46, 0.26, 0.04], [0, 0.6, 0.9], { color: '#2a2726', round: 0.2 })
      .box([0.9, 0.3, 0.8], [0, 0.6, -0.42], { color: g, round: 0.25 })
      .box([0.46, 0.1, 0.4], [0, 0.82, -0.36], { color: '#2a2726', round: 0.5, edge: 'soft' })
      .box([0.46, 0.34, 0.09], [0, 1.02, -0.56], { color: '#2a2726', round: 0.5, rot: [-12, 0, 0], edge: 'soft' })
      .box([0.4, 0.12, 0.2], [0, 0.85, 0.1], { color: g, round: 0.4 })
      .rod([0, 0.86, 0.14], [0, 1.05, 0.0], 0.04, '#2a2726')
      .torus([0.32, 0.32, 0.04], [0, 1.06, -0.01], { color: '#2a2726', rot: [62, 0, 0], tube: 0.16 })
      .label('MOW 42', [0.36, 0.08], [0.46, 0.62, -0.4], { color: yl, rot: [0, 90, 0], depth: 0.01 });
    b.pair((s) => {
      b.ball([0.1, 0.07, 0.05], [s * 0.17, 0.72, 0.88], { color: '#fff6c8', name: s > 0 ? 'lightsL' : 'lightsR', mover: { kind: 'light' } });
      b.box([0.3, 0.06, 0.7], [s * 0.46, 0.76, -0.42], { color: g, round: 0.3 });
    });
    axle(b, 'B', -0.42, 0.88, 0.62, 0.24, yl);
    axle(b, 'F', 0.62, 0.66, 0.38, 0.14, yl);
    return b
      .socket('seat', [0, 0.88, -0.34], 'seat')
      .act({ click: [A.par(A.operate('blade', 'on'), A.operate('lights', 'on')), A.par(A.effect('dust', { dur: 2.5 }), A.say('Brrrrrrm!', 2), A.anim('shake', 2)), A.par(A.operate('blade', 'off'), A.operate('lights', 'off'))] })
      .done();
  }),
  // A bolt-action hunting rifle (1.1 m) resting on its bipod: a shaped walnut stock, blued barrel and action, a
  // scope with lens caps, the bolt handle (which slides back and forward), trigger guard and a leather sling.
  e('rifle', 'armory', 'guns', () => {
    const st = '#3a3f45', wd = '#7a4a2a';
    const b = m('rifle', { view: 'side', edge: 'sharp' })
      .cyl([0.024, 0.62, 0.024], [0, 0.37, 0.42], { color: st, rot: [90, 0, 0] })
      .cyl([0.03, 0.02, 0.03], [0, 0.37, 0.73], { color: '#2a2726', rot: [90, 0, 0] })
      .box([0.05, 0.05, 0.22], [0, 0.375, 0.02], { color: st, round: 0.3 })
      .box([0.055, 0.06, 0.5], [0, 0.34, 0.2], { color: wd, round: 0.5, edge: 'soft' })
      .box([0.05, 0.11, 0.14], [0, 0.31, -0.13], { color: wd, round: 0.5, rot: [-18, 0, 0], edge: 'soft' })
      .box([0.045, 0.15, 0.32], [0, 0.29, -0.33], { color: wd, round: 0.4, rot: [-6, 0, 0], edge: 'soft' })
      .box([0.05, 0.16, 0.025], [0, 0.28, -0.5], { color: '#2a2726', round: 0.3 })
      .cyl([0.036, 0.3, 0.036], [0, 0.44, 0.03], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([0.05, 0.06, 0.05], [0, 0.44, 0.19], { color: '#2a2726', rot: [90, 0, 0], taper: 0.7 })
      .cyl([0.046, 0.05, 0.046], [0, 0.44, -0.14], { color: '#2a2726', rot: [90, 0, 0], taper: 1.3 })
      .cyl([0.044, 0.006, 0.044], [0, 0.44, 0.225], { color: '#6fd3e8', rot: [90, 0, 0], noInk: true })
      .stick([0, 0.4, 0.06], [0, 0.42, 0.06], 0.02, st)
      .stick([0, 0.4, -0.04], [0, 0.42, -0.04], 0.02, st)
      .arc([0.07, 0.06, 0.012], [0, 0.31, -0.04], { color: st, rot: [0, 90, 180], tube: 0.2 })
      .box([0.006, 0.03, 0.006], [0, 0.31, -0.035], { color: st, rot: [-15, 0, 0] })
      .stick([0.03, 0.39, -0.06], [0.06, 0.37, -0.07], 0.012, st, { name: 'bolt', mover: { kind: 'slide', axis: 'z', amount: -0.07 } })
      .ball(0.02, [0.065, 0.365, -0.07], { color: st, parent: 'bolt' })
      .rod([0, 0.3, 0.38], [0.0, 0.2, 0.0], 0.012, '#8a5a35')
      .rod([0, 0.2, 0.0], [0, 0.24, -0.4], 0.012, '#8a5a35')
      .stick([0, 0.33, 0.5], [0.13, 0.0, 0.54], 0.016, '#2a2726')
      .stick([0, 0.33, 0.5], [-0.13, 0.0, 0.54], 0.016, '#2a2726')
      .box([0.05, 0.08, 0.04], [0, 0.2, -0.5], { color: '#3a3633', round: 0.4 });
    return b.act({ click: [A.operate('bolt', 'out'), A.say('Click-clack!', 1.2), A.operate('bolt', 'in')] }).done();
  }),
  // A diamond ring in an open red velvet ring box (6 cm): a gold band with a claw-set faceted diamond in its
  // cushion slot. Click: the ring rises, turns and sparkles, then settles back.
  e('ring', 'wardrobe', 'jewellery', () => {
    const v = '#a3222a';
    const b = m('ring', { edge: 'sharp' })
      .box([0.066, 0.036, 0.06], [0, 0.018, 0], { color: v, round: 0.35 })
      .box([0.066, 0.004, 0.06], [0, 0.036, 0], { color: '#d0a84a', round: 0.2 })
      .box([0.066, 0.06, 0.03], [0, 0.068, -0.045], { color: v, round: 0.35, rot: [-15, 0, 0] })
      .box([0.056, 0.05, 0.008], [0, 0.068, -0.028], { color: '#fff3d6', round: 0.4, rot: [-15, 0, 0] })
      .box([0.05, 0.014, 0.046], [0, 0.04, 0], { color: '#fff3d6', round: 0.5, edge: 'soft' })
      .torus([0.03, 0.03, 0.006], [0, 0.052, 0.002], { color: '#e2b23a', tube: 0.18, name: 'ring' })
      .cyl([0.009, 0.006, 0.009], [0, 0.068, 0.002], { color: '#e2b23a', parent: 'ring' })
      .cone([0.016, 0.01, 0.016], [0, 0.069, 0.002], { color: '#eaf8ff', rot: [180, 0, 0], segs: 8, parent: 'ring' })
      .cyl([0.016, 0.005, 0.016], [0, 0.0765, 0.002], { color: '#eaf8ff', taper: 0.6, segs: 8, parent: 'ring' });
    return b.act({ click: [A.pose('ring', { move: [0, 0.03, 0.01], rot: [0, 360, 0], dur: 1 }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ting!', 1)), A.pose('ring', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A riot officer in full gear: helmet and goggles, armour, shield on the left arm and a baton. Click: they point
  // ("Stay behind the line!") or shake their head ("No entry!").
  e('riot gear', 'armory', 'armour', () =>
    withAct(who('riot gear', { top: '#2a2726', bottom: '#2a2726', shoes: 'black', long: true, build: 1.25, acc: [hat('helmet', '#2a2726'), face('goggles', 'darkgray'), wear('armor', '#3a3f45'), held('shield', '#bfe3f2', 'L'), held('baton', 'black')] }), {
      click: [[A.par(A.anim('point'), A.say('Stay behind the line!', 2))], [A.par(A.anim('shake_head'), A.say('No entry!', 1.8))]],
    }),
  ),
  // A clear police riot shield (1.2 m) standing on its edge: a curved polycarbonate panel with a black rim, a
  // white POLICE band and a view port, a grip on the back. Click: something bounces off it with a thunk.
  e('riot shield', 'armory', 'shields', () =>
    m('riot shield', { edge: 'sharp' })
      .box([0.64, 1.22, 0.06], [0, 0.61, -0.02], { color: '#2a2726', round: 0.15 })
      .box([0.58, 1.16, 0.065], [0, 0.61, -0.005], { color: '#cfe8f4', round: 0.15 })
      .box([0.5, 0.14, 0.02], [0, 0.98, 0.03], { color: 'white', round: 0.3 })
      .label('POLICE', [0.42, 0.11], [0, 0.98, 0.042], { color: 'white', depth: 0.006 })
      .box([0.3, 0.1, 0.01], [0, 0.78, 0.03], { color: '#9fd0ea', round: 0.4, noInk: true })
      .box([0.16, 0.05, 0.08], [0, 0.6, -0.08], { color: '#2a2726', round: 0.4 })
      .box([0.24, 0.05, 0.06], [0, 0.42, -0.07], { color: '#2a2726', round: 0.4 })
      .act({ click: [A.par(A.anim('shake'), A.say('Thunk!', 1.2))] })
      .done(),
  ),
  // A cardboard roach trap shaped like a little motel (12 cm), with entrance holes, a striped roof and its sign.
  // Click: a cockroach scuttles up and checks in.
  e('roach motel', 'home', 'pest control', () =>
    m('roach motel', { edge: 'sharp' })
      .box([0.12, 0.05, 0.08], [0, 0.025, 0], { color: '#f6d24a', round: 0.08 })
      .wedge([0.13, 0.035, 0.09], [0, 0.0675, 0], { color: '#e0473b', rot: [0, 90, 0] })
      .label('ROACH MOTEL', [0.1, 0.014], [0, 0.036, 0.041], { color: '#f6d24a', depth: 0.002 })
      .box([0.022, 0.016, 0.004], [-0.035, 0.012, 0.041], { color: '#2a2726' })
      .box([0.022, 0.016, 0.004], [0.035, 0.012, 0.041], { color: '#2a2726' })
      .box([0.004, 0.016, 0.022], [0.061, 0.012, 0.0], { color: '#2a2726' })
      .box([0.04, 0.02, 0.003], [0.0, 0.088, 0.0], { color: 'white', round: 0.2, noInk: true })
      .act({ click: [A.spawn('roach', 'cockroach', { rel: 'front', of: 'self', dist: 'close' }), A.move('roach', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'walk' }), A.say('Check in!', 1.5), A.remove('roach', 'fade')] })
      .done(),
  ),
  // Eight metres of two-lane street (11 m across): asphalt, dashed centre line and edge lines, kerbs and
  // pavements on both sides, a zebra crossing and a manhole cover. Click: a car drives along it.
  e('road', 'places', 'streets', () => {
    const b = m('road', { edge: 'sharp' })
      .box([8, 0.1, 7], [0, 0.05, 0], { color: '#4a4c50', round: 0.02 });
    b.pair((s) => {
      b.box([8, 0.18, 2], [0, 0.09, s * 4.5], { color: '#c9c6bd', round: 0.05 })
        .box([8, 0.2, 0.18], [0, 0.1, s * 3.55], { color: '#a7a7a0', round: 0.2 })
        .box([8, 0.01, 0.12], [0, 0.103, s * 3.25], { color: 'white', noInk: true });
      b.each(5, (i) => b.box([0.04, 0.005, 1.95], [-3.6 + i * 1.8, 0.182, s * 4.5], { color: '#b8b5ac', noInk: true }));
    });
    b.each(4, (i) => b.box([1.2, 0.01, 0.14], [-3.0 + i * 2.0, 0.103, 0], { color: '#f6d24a', noInk: true }));
    b.each(7, (i) => b.box([0.5, 0.012, 2.6], [2.8, 0.103, -3.0 + i * 1.0], { color: 'white', noInk: true, rot: [0, 90, 0] }));
    b.cyl([0.7, 0.02, 0.7], [-2.2, 0.105, -1.6], { color: '#5c6166' }).torus([0.5, 0.5, 0.01], [-2.2, 0.115, -1.6], { color: '#3a3633', rot: [90, 0, 0], tube: 0.08, noInk: true });
    return b.act({ click: [A.spawn('car', 'car', { rel: 'left', of: 'self', dist: 'near' }), A.par(A.move('car', { rel: 'right', of: 'self', dist: 'near' }, { speed: 'run' }), A.say('Vroom!', 1.5)), A.remove('car', 'fade')] }).done();
  }),
  // A warning road sign at real height (2.6 m): a red-rimmed triangle with an exclamation mark on a galvanised
  // post with a bracket and bolts. Click: it wobbles in the wind.
  e('road sign', 'ideas', 'road signs', () => {
    const b = m('road sign', { edge: 'sharp' })
      .cyl([0.3, 0.08, 0.3], [0, 0.04, 0], { color: '#a7a7a0' })
      .stick([0, 0.08, -0.05], [0, 2.6, -0.05], 0.075, '#b9c2ca')
      .cyl([0.08, 0.04, 0.08], [0, 2.62, -0.05], { color: '#9da3a8' })
      .wedge([0.9, 0.8, 0.03], [0, 2.1, 0.0], { color: '#d8312a', name: 'board', pivot: [0, 2.1, -0.05] })
      .wedge([0.68, 0.6, 0.032], [0, 2.04, 0.004], { color: 'white', parent: 'board' })
      .box([0.07, 0.24, 0.01], [0, 2.07, 0.022], { color: '#2a2726', round: 0.4, parent: 'board' })
      .box([0.07, 0.06, 0.01], [0, 1.89, 0.022], { color: '#2a2726', round: 0.5, parent: 'board' })
      .box([0.2, 0.06, 0.04], [0, 1.92, -0.04], { color: '#9da3a8', parent: 'board' })
      .box([0.2, 0.06, 0.04], [0, 2.25, -0.04], { color: '#9da3a8', parent: 'board' });
    return b.act({ click: [A.pose('board', { rot: [0, 0, 6], dur: 0.25 }), A.pose('board', { rot: [0, 0, -5], dur: 0.3 }), A.par(A.pose('board', { rot: [0, 0, 0], dur: 0.3 }), A.say('Wobble wobble!', 1.2))] }).done();
  }),
  // A striped road barricade (2.4 m): two A-frame legs, three orange-and-white striped rails, a ROAD CLOSED sign
  // and two amber lamps that flash when clicked.
  e('roadblock', 'workshop', 'road works', () => {
    const b = m('roadblock', { edge: 'sharp' });
    b.pair((s) => {
      b.stick([s * 1.0, 0, 0.35], [s * 1.0, 1.35, 0.0], 0.07, '#e8e4dc').stick([s * 1.0, 0, -0.35], [s * 1.0, 1.35, 0.0], 0.07, '#e8e4dc');
      b.box([0.12, 0.08, 0.8], [s * 1.0, 0.04, 0], { color: '#2a2726', round: 0.2 });
      b.cyl([0.2, 0.14, 0.2], [s * 1.0, 1.42, 0.0], { color: '#2a2726' });
      b.ball([0.18, 0.18, 0.12], [s * 1.0, 1.58, 0.0], { color: '#ffb020', name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light' } });
    });
    b.each(3, (r) => {
      const yy = 0.45 + r * 0.38, zz = 0.35 - (yy / 1.35) * 0.35 + 0.04;
      b.box([2.4, 0.22, 0.04], [0, yy, zz], { color: 'white', round: 0.1 });
      b.each(6, (i) => b.box([0.16, 0.3, 0.01], [-1.0 + i * 0.4, yy, zz + 0.022], { color: '#f0782a', rot: [0, 0, 45], noInk: true }));
    });
    b.label('ROAD CLOSED', [0.9, 0.24], [0, 1.27, 0.12], { color: 'white', depth: 0.02 });
    return b.act({ click: [A.par(A.operate('lamp', 'on'), A.say('Road closed!', 2)), A.wait(2), A.operate('lamp', 'off')] }).done();
  }),
  // A portable roadworks sign (1.5 m): an orange diamond with the black digging-worker symbol on a folding stand
  // weighed down with a sandbag, and two orange flags on top that wave when clicked.
  e('roadwork sign', 'ideas', 'road signs', () => {
    const b = m('roadwork sign', { edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.4, 0, 0.25], [0, 0.6, 0.0], 0.04, '#d8312a').stick([s * 0.4, 0, -0.25], [0, 0.6, 0.0], 0.04, '#d8312a'));
    b.box([0.4, 0.12, 0.25], [0, 0.06, 0], { color: '#c9a86a', round: 0.6, edge: 'soft' })
      .stick([0, 0.55, -0.02], [0, 1.6, -0.02], 0.04, '#9da3a8')
      .box([0.76, 0.76, 0.03], [0, 1.1, 0.02], { color: '#2a2726', rot: [0, 0, 45], round: 0.1 })
      .box([0.7, 0.7, 0.03], [0, 1.1, 0.03], { color: '#f0923b', rot: [0, 0, 45], round: 0.1 })
      .ball(0.07, [0.03, 1.27, 0.05], { color: '#2a2726' })
      .rod([0.02, 1.22, 0.05], [0.0, 1.06, 0.05], 0.05, '#2a2726')
      .rod([0.0, 1.06, 0.05], [-0.07, 0.92, 0.05], 0.035, '#2a2726')
      .rod([0.0, 1.06, 0.05], [0.07, 0.93, 0.05], 0.035, '#2a2726')
      .rod([0.0, 1.18, 0.05], [0.12, 1.08, 0.05], 0.03, '#2a2726')
      .stick([0.16, 1.2, 0.05], [0.12, 0.96, 0.05], 0.02, '#2a2726')
      .ball([0.14, 0.05, 0.02], [0.17, 0.94, 0.05], { color: '#2a2726' })
      .ball([0.16, 0.06, 0.02], [-0.16, 0.9, 0.05], { color: '#2a2726' });
    b.pair((s) => b.stick([s * 0.36, 1.1, 0.0], [s * 0.42, 1.55, 0.0], 0.015, '#5c6166').box([0.2, 0.16, 0.01], [s * 0.53, 1.48, 0.0], { color: '#f0782a', name: s > 0 ? 'flagL' : 'flagR', pivot: [s * 0.42, 1.48, 0], round: 0.1, edge: 'soft' }));
    return b
      .act({ click: [A.par(A.pose('flagL', { rot: [0, 40, 0], dur: 0.3 }), A.pose('flagR', { rot: [0, -40, 0], dur: 0.3 })), A.par(A.pose('flagL', { rot: [0, -20, 0], dur: 0.3 }), A.pose('flagR', { rot: [0, 20, 0], dur: 0.3 })), A.par(A.pose('flagL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('flagR', { rot: [0, 0, 0], dur: 0.3 }), A.say('Slow down!', 1.5))] })
      .done();
  }),
  // A roast beef joint on a carving board (40 cm): a browned crust, a pink cut face, slices fanned out, a sprig
  // of rosemary and a carving fork. One slice is a piece: click and it comes away; click again and it is back.
  e('roast beef', 'food', 'meat', () => {
    const b = m('roast beef')
      .box([0.42, 0.025, 0.28], [0, 0.0125, 0], { color: '#b5814e', round: 0.3, edge: 'sharp' })
      .ball([0.22, 0.13, 0.16], [-0.06, 0.085, -0.01], { color: '#6b3a22', name: 'joint' })
      .ball([0.13, 0.11, 0.025], [0.045, 0.085, -0.005], { color: '#c9606a', rot: [0, 90, 0], parent: 'joint' })
      .ball([0.12, 0.1, 0.022], [0.06, 0.07, 0.02], { color: '#d06a70', rot: [0, 60, 10], parent: 'joint', name: 'slice', piece: true })
      .ball([0.13, 0.008, 0.11], [0.06, 0.07, 0.02], { color: '#6b3a22', rot: [0, 60, 10], parent: 'slice', noInk: true, scale: 0.98 });
    b.each(3, (i) => b.ball([0.11, 0.012, 0.09], [0.11 + i * 0.03, 0.03 + i * 0.006, 0.07 - i * 0.03], { color: '#d06a70', rot: [12, 20, 0] }));
    b.rod([-0.17, 0.035, 0.09], [-0.09, 0.04, 0.11], 0.008, '#3f7a3a');
    b.each(5, (i) => b.capsule([0.006, 0.02, 0.004], [-0.16 + i * 0.016, 0.042, 0.095 + (i % 2) * 0.012], { color: '#3f7a3a', rot: [90, 0, 60] }));
    b.stick([0.06, 0.05, -0.1], [0.2, 0.06, -0.12], 0.01, '#c9ccd1', { edge: 'sharp' }).box([0.06, 0.02, 0.025], [0.24, 0.06, -0.125], { color: '#2a2726', round: 0.4, edge: 'sharp' });
    return b.act({ click: [[A.pose('slice', { move: [0.08, 0.02, 0.06], rot: [0, 0, -50], dur: 0.6 }), A.effect('steam', { dur: 1.5 })], [A.pose('slice', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A fluffy blue bathrobe hanging on a stand (1.75 m): a white shawl collar, turned-back cuffs, patch pockets
  // and a tie belt knotted at the waist. Click: the belt comes undone and drops; click again, it is tied.
  e('robe', 'wardrobe', 'nightwear', () => {
    const c = '#7a9fd1', w = '#f7f5ef';
    const b = m('robe')
      .cyl([0.42, 0.03, 0.42], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.03, -0.08], [0, 1.72, -0.08], 0.04, '#3a3633', { edge: 'sharp' })
      .rod([-0.21, 1.62, -0.04], [0.21, 1.62, -0.04], 0.02, 'wood', { edge: 'sharp' })
      .cyl([0.64, 1.28, 0.3], [0, 0.98, 0], { color: c, taper: 0.8, name: 'body' })
      .ball([0.56, 0.18, 0.28], [0, 1.58, 0], { color: c, parent: 'body' });
    b.pair((s) => {
      b.rod([s * 0.1, 1.62, 0.12], [s * 0.02, 1.0, 0.15], 0.08, w, { parent: 'body' });
      b.rod([s * 0.27, 1.55, 0], [s * 0.36, 0.95, 0.03], 0.16, c, { parent: 'body' });
      b.cyl([0.17, 0.08, 0.17], [s * 0.365, 0.92, 0.03], { color: w, rot: [0, 0, s * 8], parent: 'body' });
      b.box([0.16, 0.16, 0.03], [s * 0.17, 0.72, 0.135], { color: shade(c, 0.9), round: 0.4, parent: 'body' });
    });
    b.torus([0.58, 0.27, 0.06], [0, 0.98, 0], { color: shade(c, 0.85), rot: [90, 0, 0], tube: 0.16, parent: 'body' })
      .ball([0.08, 0.06, 0.05], [0.04, 0.98, 0.15], { color: shade(c, 0.85), name: 'belt', parent: 'body', piece: true })
      .rod([0.05, 0.97, 0.16], [0.09, 0.66, 0.17], 0.045, shade(c, 0.85), { parent: 'belt' })
      .rod([0.03, 0.97, 0.16], [-0.01, 0.7, 0.17], 0.045, shade(c, 0.85), { parent: 'belt' });
    return b.act({ click: [[A.detach('belt', 'tie'), A.say('Flop!', 1)], [A.reattach('belt'), A.say('Snug!', 1)]] }).done();
  }),
  // A child in a home-made robot costume (1.35 m): silver-painted boxes for body and head with a face window,
  // dials and lights on the chest, dryer-hose arms and legs, an antenna with a glowing tip. Click: the robot
  // dance, arms out stiffly, "Beep boop! I am a robot!"; then arms forward, "Take me to your leader!".
  e('robot costume', 'toys', 'costumes', () => {
    const sv = '#c9ccd1', hose = '#9da3a8';
    const b = m('robot costume')
      .box([0.42, 0.46, 0.3], [0, 0.88, 0], { color: sv, round: 0.08, edge: 'sharp' })
      .box([0.3, 0.29, 0.28], [0, 1.24, 0], { color: sv, round: 0.08, edge: 'sharp', name: 'head', pivot: [0, 1.1, 0] })
      .box([0.2, 0.13, 0.02], [0, 1.24, 0.142], { color: '#2a2726', round: 0.3, parent: 'head', edge: 'sharp' })
      .box([0.17, 0.1, 0.02], [0, 1.24, 0.146], { color: '#f0c39f', round: 0.5, parent: 'head' })
      .cyl([0.022, 0.008, 0.022], [0.035, 1.255, 0.157], { color: '#2a2726', rot: [90, 0, 0], parent: 'head' })
      .cyl([0.022, 0.008, 0.022], [-0.035, 1.255, 0.157], { color: '#2a2726', rot: [90, 0, 0], parent: 'head' })
      .arc([0.05, 0.03, 0.006], [0, 1.215, 0.157], { color: '#a3322a', rot: [0, 0, 180], tube: 0.15, parent: 'head' })
      .stick([0, 1.38, 0], [0, 1.5, 0], 0.015, '#5c6166', { parent: 'head' })
      .ball(0.05, [0, 1.52, 0], { color: '#ff3a2a', name: 'antenna', parent: 'head', mover: { kind: 'light' } })
      .box([0.22, 0.16, 0.02], [0, 0.95, 0.152], { color: '#3a3f45', round: 0.2, edge: 'sharp' })
      .cyl([0.05, 0.02, 0.05], [-0.06, 0.95, 0.16], { color: '#f6d24a', rot: [90, 0, 0] })
      .cyl([0.05, 0.02, 0.05], [0.06, 0.95, 0.16], { color: '#4e8fd6', rot: [90, 0, 0] })
      .heart(0.06, [0, 0.78, 0.155], { color: '#e0473b', glow: true });
    b.pair((s) => {
      b.cyl([0.06, 0.03, 0.06], [s * 0.152, 1.24, 0], { color: '#5c6166', rot: [0, 0, 90], parent: 'head' });
      const arm = s > 0 ? 'armL' : 'armR';
      b.rod([s * 0.25, 1.04, 0], [s * 0.29, 0.66, 0.02], 0.1, hose, { name: arm, pivot: [s * 0.24, 1.05, 0] });
      b.each(4, (i) => b.torus([0.11, 0.11, 0.025], [s * (0.255 + i * 0.01), 0.96 - i * 0.08, 0.005 + i * 0.004], { color: sv, rot: [90, 0, 0], tube: 0.2, parent: arm, noInk: true }));
      b.box([0.1, 0.07, 0.08], [s * 0.3, 0.6, 0.02], { color: '#5c6166', round: 0.2, parent: arm, edge: 'sharp' });
      b.rod([s * 0.1, 0.66, 0], [s * 0.11, 0.1, 0], 0.12, hose);
      b.each(4, (i) => b.torus([0.13, 0.13, 0.025], [s * 0.105, 0.55 - i * 0.12, 0], { color: sv, rot: [90, 0, 0], tube: 0.2, noInk: true }));
      b.box([0.12, 0.08, 0.22], [s * 0.11, 0.04, 0.03], { color: '#e0473b', round: 0.4 });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('armL', { rot: [0, 0, 80], dur: 0.3 }), A.pose('armR', { rot: [0, 0, -80], dur: 0.3 }), A.operate('antenna', 'on'), A.say('Beep boop! I am a robot!', 2)), A.pose('head', { rot: [0, 25, 0], dur: 0.3 }), A.pose('head', { rot: [0, -25, 0], dur: 0.3 }), A.par(A.pose('head', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.operate('antenna', 'off'))],
          [A.par(A.pose('armL', { rot: [-90, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [-90, 0, 0], dur: 0.4 }), A.say('Take me to your leader!', 2)), A.wait(1.2), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }))],
        ],
      })
      .done();
  }),
  // Two sticks of rock candy (24 cm): sharp sugar crystals grown on wooden sticks, pink and blue, standing in a
  // little glass. Click: they glitter.
  e('rock candy', 'food', 'sweets', () => {
    const b = m('rock candy')
      .cyl([0.08, 0.07, 0.08], [0, 0.035, 0], { color: '#cfe8f4', taper: 1.1, edge: 'sharp' })
      .cyl([0.074, 0.02, 0.074], [0, 0.015, 0], { color: '#bfe3f2' });
    for (const [xx, c, h, lean] of [[-0.016, '#f4a1c0', 0.25, -8], [0.016, '#8fc4f0', 0.23, 8]] as Array<[number, string, number, number]>) {
      const top: V = [xx + Math.sin(lean * D2R) * h, h, 0];
      b.stick([xx, 0.02, 0], top, 0.007, '#d8b07a');
      b.each(10, (i) => {
        const t = 0.45 + i * 0.05, p: V = [xx + (top[0] - xx) * t, 0.02 + (h - 0.02) * t, 0];
        b.box(0.026 + (i % 3) * 0.004, [p[0] + Math.sin(i * 2.1) * 0.01, p[1], Math.cos(i * 2.1) * 0.01], { color: c, round: 0.08, rot: [i * 37, i * 53, i * 21], edge: 'sharp' });
      });
    }
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Crunch!', 1))] }).done();
  }),
  // A wooden dish of pink rock-salt crystals and a salt mill beside it. Click: the mill's crown turns and salt
  // dust falls.
  e('rock salt', 'food', 'spices', () => {
    const b = m('rock salt')
      .cyl([0.16, 0.03, 0.16], [0, 0.015, 0], { color: '#d8b07a', edge: 'sharp' })
      .cyl([0.13, 0.008, 0.13], [0, 0.031, 0], { color: '#b5814e', noInk: true });
    for (const [xx, z, sz, c] of [[0, 0, 0.045, '#f6d6d0'], [0.04, 0.03, 0.032, 'white'], [-0.04, 0.02, 0.036, '#f2c8c0'], [0.02, -0.04, 0.03, 'white'], [-0.03, -0.03, 0.028, '#f6d6d0'], [0.0, 0.01, 0.026, '#f2c8c0']] as Array<[number, number, number, string]>)
      b.box(sz, [xx, 0.035 + sz * 0.5 + (xx === 0 && z === 0.01 ? 0.035 : 0), z], { color: c, round: 0.12, rot: [xx * 400, z * 500, 20], edge: 'sharp' });
    b.cyl([0.05, 0.13, 0.05], [0.13, 0.065, 0.02], { color: '#7a5230', taper: 0.85 })
      .cyl([0.035, 0.05, 0.035], [0.13, 0.11, 0.02], { color: '#f2e6e2' })
      .cyl([0.054, 0.04, 0.054], [0.13, 0.15, 0.02], { color: '#5a3a22', name: 'crown', edge: 'sharp' })
      .ball(0.022, [0.13, 0.18, 0.02], { color: '#5a3a22', parent: 'crown' });
    return b.act({ click: [A.par(A.pose('crown', { rot: [0, 720, 0], dur: 1.5 }), A.effect('dust', { dur: 1.5 }), A.say('Grind, grind!', 1.5)), A.pose('crown', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A moon rocket on its pad, built smaller than life at 50 m (the vocabulary's 3 m is a toy): five engine bells
  // and fins at the base, three white stages with black roll stripes, the capsule and escape tower, and a red
  // launch tower with swing arms. Click: countdown and lift-off in fire and smoke; click again, back on the pad.
  e('rocket', 'garage', 'spacecraft', () => {
    const b = m('rocket', { edge: 'sharp' })
      .box([18, 1.6, 18], [0, 0.8, 0], { color: '#a7a7a0', round: 0.02 })
      .box([5, 0.4, 18.2], [0, 1.5, 0], { color: '#3a3633' })
      .cyl([4.6, 19, 4.6], [0, 13.1, 0], { color: 'white', name: 'rocket' });
    b.each(5, (i) => {
      const p: V = i === 4 ? [0, 2.4, 0] : [Math.cos(i * 1.571 + 0.785) * 1.3, 2.4, Math.sin(i * 1.571 + 0.785) * 1.3];
      b.cyl([1.3, 1.6, 1.3], p, { color: '#3a3633', taper: 0.45, rot: [180, 0, 0], parent: 'rocket' });
    });
    b.each(4, (i) => {
      const a = i * 90 + 45;
      b.wedge([1.8, 3.4, 0.25], [Math.sin(a * D2R) * 2.9, 5.0, Math.cos(a * D2R) * 2.9], { color: '#2a2726', rot: [0, a + 90, 0], apex: 0.5, parent: 'rocket' });
      b.box([0.12, 4.5, 1.5], [Math.sin(a * D2R) * 2.28, 19.5, Math.cos(a * D2R) * 2.28], { color: '#2a2726', rot: [0, a, 0], parent: 'rocket', noInk: true });
    });
    b.cyl([4.62, 0.6, 4.62], [0, 22.6, 0], { color: '#2a2726', parent: 'rocket' })
      .cyl([4.6, 10.4, 4.6], [0, 28.1, 0], { color: 'white', parent: 'rocket' })
      .cyl([4.62, 0.8, 4.62], [0, 31.5, 0], { color: '#2a2726', parent: 'rocket' })
      .cyl([4.6, 2.2, 4.6], [0, 34.4, 0], { color: 'white', taper: 0.66, parent: 'rocket' })
      .cyl([3.05, 7, 3.05], [0, 39, 0], { color: 'white', parent: 'rocket' })
      .cyl([3.07, 0.8, 3.07], [0, 42.9, 0], { color: '#2a2726', parent: 'rocket' })
      .cyl([3.05, 3.2, 3.05], [0, 44.9, 0], { color: '#e8e4dc', taper: 0.62, parent: 'rocket' })
      .cyl([1.9, 2.0, 1.9], [0, 47.5, 0], { color: '#c9ccd1', taper: 0.35, parent: 'rocket' })
      .stick([0, 48.4, 0], [0, 51.4, 0], 0.3, '#d8312a', { parent: 'rocket' })
      .cyl([0.45, 1.4, 0.45], [0, 51.6, 0], { color: '#d8312a', parent: 'rocket' })
      .label('USA', [2.4, 1.0], [0, 14, 2.31], { color: 'white', depth: 0.03, parent: 'rocket' });
    const tx = 7;
    b.pair((s) => b.pair((t) => b.stick([tx + s * 1.3, 1.6, t * 1.3], [tx + s * 1.3, 49, t * 1.3], 0.35, '#d8312a')));
    b.each(9, (i) => {
      const yy = 4 + i * 5.4;
      b.box([2.9, 0.25, 0.25], [tx, yy, 1.3], { color: '#d8312a', noInk: true }).box([2.9, 0.25, 0.25], [tx, yy, -1.3], { color: '#d8312a', noInk: true });
      b.box([0.25, 0.25, 2.9], [tx + 1.3, yy, 0], { color: '#d8312a', noInk: true }).box([0.25, 0.25, 2.9], [tx - 1.3, yy, 0], { color: '#d8312a', noInk: true });
      if (i % 3 === 1) b.box([4.1, 0.6, 1.1], [tx - 3.3, yy, 0], { color: '#9da3a8' });
    });
    b.cyl([2.2, 1.2, 2.2], [tx, 49.6, 0], { color: '#d8312a' });
    return b
      .act({
        click: [
          [A.say('3... 2... 1... Lift-off!', 3), A.wait(2.2), A.par(A.effect('fire', { dur: 3.5 }), A.effect('smoke', { dur: 4.5 }), A.pose('rocket', { move: [0, 40, 0], dur: 4 }))],
          [A.pose('rocket', { move: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 1 })],
        ],
      })
      .done();
  }),
  // A big liquid-fuel rocket engine on a test stand (5.8 m): a flared bell nozzle with cooling bands, the
  // combustion chamber, gimbal and injector dome, a turbopump and its pipes, standing in a steel frame. Click:
  // it fires, a flame roaring from the bell.
  e('rocket engine', 'garage', 'spacecraft', () => {
    const br = '#5c4a3a';
    const b = m('rocket engine', { edge: 'sharp' })
      .box([5.2, 0.3, 5.2], [0, 0.15, 0], { color: '#a7a7a0' });
    b.pair((s) => b.pair((t) => b.stick([s * 2.2, 0.3, t * 2.2], [s * 2.2, 5.6, t * 2.2], 0.2, '#f6d24a')));
    b.pair((s) => b.box([4.6, 0.2, 0.2], [0, 5.5, s * 2.2], { color: '#f6d24a' }).box([0.2, 0.2, 4.6], [s * 2.2, 5.5, 0], { color: '#f6d24a' }).box([4.6, 0.16, 0.16], [0, 1.6, s * 2.2], { color: '#f6d24a' }));
    b.cyl([3.6, 3.0, 3.6], [0, 3.0, 0], { color: br, taper: 0.3 })
      .torus([3.7, 3.7, 0.16], [0, 1.55, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.06 })
      .torus([2.95, 2.95, 0.14], [0, 2.4, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([2.2, 2.2, 0.12], [0, 3.3, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .cyl([1.15, 0.8, 1.15], [0, 4.85, 0], { color: '#8f99a3' })
      .dome([1.5, 0.5, 1.5], [0, 5.5, 0], { color: '#c9ccd1' })
      .box([5.0, 0.3, 0.6], [0, 5.9, 0], { color: '#5c6166' })
      .cyl([0.9, 1.4, 0.9], [1.25, 4.6, 0.3], { color: '#9da3a8' })
      .dome([0.9, 0.3, 0.9], [1.25, 5.45, 0.3], { color: '#c9ccd1' })
      .rod([1.25, 4.1, 0.3], [0.45, 4.6, 0.3], 0.3, '#c9ccd1')
      .rod([1.25, 4.0, 0.3], [1.6, 2.7, 0.6], 0.36, '#3a3633')
      .rod([0.3, 5.0, -0.6], [-1.0, 4.4, -0.5], 0.28, '#c9ccd1')
      .rod([-1.0, 4.4, -0.5], [-1.2, 5.6, -0.5], 0.28, '#c9ccd1')
      .label('F-1', [0.8, 0.5], [0, 4.85, 0.58], { color: '#2a2726', depth: 0.02 })
      .cone([3.0, 1.4, 3.0], [0, 0.85, 0], { color: '#ffb02a', rot: [180, 0, 0], glow: true, name: 'flame', scale: 0 });
    return b.act({ click: [A.par(A.pose('flame', { scale: 1, dur: 0.3 }), A.effect('smoke', { dur: 3 }), A.anim('shake', 3), A.say('ROOOOAR!', 2)), A.wait(1.5), A.pose('flame', { scale: 0, dur: 0.4 })] }).done();
  }),
  // A shoulder-fired rocket launcher (1.3 m tube) on its bipod: an olive tube with a flared blast cone, a pistol
  // grip, shoulder rest and optical sight, and a practice warhead in the muzzle. Click: fwoosh, the warhead
  // flies off in smoke and a fresh one slides in.
  e('rocket launcher', 'armory', 'weapons', () => {
    const ol = '#5d6b3a';
    const b = m('rocket launcher', { view: 'side', edge: 'sharp' })
      .cyl([0.11, 1.25, 0.11], [0, 0.42, 0], { color: ol, rot: [90, 0, 0] })
      .cyl([0.16, 0.22, 0.16], [0, 0.42, -0.68], { color: '#4a5530', rot: [-90, 0, 0], taper: 0.6 })
      .torus([0.13, 0.13, 0.03], [0, 0.42, 0.25], { color: '#3a3f2a', tube: 0.25 })
      .torus([0.13, 0.13, 0.03], [0, 0.42, -0.3], { color: '#3a3f2a', tube: 0.25 })
      .box([0.035, 0.13, 0.05], [0, 0.31, 0.12], { color: '#2a2726', round: 0.3, rot: [12, 0, 0] })
      .box([0.035, 0.12, 0.05], [0, 0.3, -0.12], { color: '#2a2726', round: 0.3, rot: [12, 0, 0] })
      .box([0.08, 0.06, 0.16], [0, 0.35, -0.3], { color: '#3a3f2a', round: 0.4 })
      .box([0.04, 0.06, 0.16], [0.07, 0.5, 0.05], { color: '#2a2726', round: 0.3 })
      .cyl([0.035, 0.02, 0.035], [0.07, 0.5, 0.14], { color: '#6fd3e8', rot: [90, 0, 0] })
      .cyl([0.1, 0.16, 0.1], [0, 0.42, 0.68], { color: '#7a8a4a', rot: [90, 0, 0], name: 'warhead' })
      .cone([0.1, 0.18, 0.1], [0, 0.42, 0.85], { color: '#7a8a4a', rot: [90, 0, 0], parent: 'warhead' })
      .cyl([0.105, 0.02, 0.105], [0, 0.42, 0.72], { color: '#f6d24a', rot: [90, 0, 0], parent: 'warhead', noInk: true })
      .stick([0, 0.37, 0.4], [0.14, 0.0, 0.46], 0.022, '#2a2726')
      .stick([0, 0.37, 0.4], [-0.14, 0.0, 0.46], 0.022, '#2a2726');
    return b
      .act({ click: [A.par(A.pose('warhead', { move: [0, 0.4, 5], dur: 0.5 }), A.effect('smoke', { dur: 2 }), A.anim('shake'), A.say('Fwoosh!', 1.5)), A.pose('warhead', { scale: 0, dur: 0 }), A.pose('warhead', { move: [0, 0, 0], dur: 0 }), A.wait(0.6), A.pose('warhead', { scale: 1, dur: 0.4 })] })
      .done();
  }),
  // A retro rocket ship (16 m; a fictional ship has no real size, this one carries a crew of three): a gleaming
  // body lofted to a red nose, three swept red fins standing on ball feet, portholes, a boarding ramp that lowers
  // from the hatch, and an engine nozzle. Click: the ramp comes down; click again, it closes and the ship blasts.
  e('rocket ship', 'garage', 'spacecraft', () => {
    const r = '#d8312a';
    const b = m('rocket ship')
      .loft([4.4, 4.4, 12.5], [0, 9.3, 0], [[0, 0.62, 0.62], [0.12, 0.9, 0.9], [0.4, 1, 1], [0.7, 0.86, 0.86], [0.88, 0.55, 0.55], [1, 0.06, 0.06]], { color: '#dfe3e8', rot: [-90, 0, 0] })
      .cone([2.9, 3.0, 2.9], [0, 14.3, 0], { color: r })
      .cyl([2.8, 1.0, 2.8], [0, 2.7, 0], { color: '#5c6166', taper: 0.75, edge: 'sharp' })
      .cyl([2.2, 1.2, 2.2], [0, 1.8, 0], { color: '#3a3633', taper: 1.4, edge: 'sharp' })
      .cone([1.8, 2.4, 1.8], [0, 0.6, 0], { color: '#ffb02a', rot: [180, 0, 0], glow: true, name: 'flame', scale: 0 });
    b.each(3, (i) => {
      const a = i * 120 + 60, sx = Math.sin(a * D2R), sz = Math.cos(a * D2R);
      b.wedge([3.2, 5.5, 0.35], [sx * 3.0, 3.6, sz * 3.0], { color: r, rot: [0, a - 90, 0], apex: -0.5, edge: 'sharp' });
      b.ball(0.9, [sx * 4.4, 0.45, sz * 4.4], { color: '#5c6166' });
    });
    b.each(3, (i) => {
      const yy = 7.5 + i * 2.2, rr = 2.2 * (i === 2 ? 0.93 : 1);
      b.cyl([0.9, 0.12, 0.9], [0, yy, rr], { color: '#6fb6e0', rot: [90, 0, 0], edge: 'sharp' }).torus([1.15, 1.15, 0.22], [0, yy, rr + 0.02], { color: r, tube: 0.2, edge: 'sharp' });
    });
    b.box([1.4, 2.1, 0.12], [1.85, 5.1, 1.1], { color: '#c9ccd1', rot: [0, 60, 0], edge: 'sharp' })
      .box([1.3, 2.4, 0.1], [2.55, 5.25, 1.45], { color: '#b9c2ca', rot: [0, 60, 0], edge: 'sharp', name: 'hatch', pivot: [2.55, 4.05, 1.45], mover: { kind: 'swing', axis: 'x', amount: 100 } })
      .label('STAR 1', [2.4, 0.7], [0, 12.0, 1.62], { color: '#dfe3e8', depth: 0.05 });
    return b
      .act({
        click: [
          [A.operate('hatch', 'open'), A.say('Hisss...', 1.5)],
          [A.operate('hatch', 'close'), A.par(A.pose('flame', { scale: 1, dur: 0.4 }), A.effect('smoke', { dur: 3 }), A.anim('shake', 3), A.say('Blast off!', 2)), A.wait(1), A.pose('flame', { scale: 0, dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A wooden rocking chair at real size (seat 0.45 m, back 1.1 m): spindle back under a curved top rail, arms on
  // turned posts, a plaid seat cushion and long curved rockers. Click: it rocks, creaking.
  e('rocking chair', 'home', 'seating', () => {
    const w = '#9a6a3e', dw = '#7a5230';
    const b = m('rocking chair', { edge: 'sharp' })
      .box([0.52, 0.06, 0.48], [0, 0.45, 0.0], { color: w, round: 0.2, name: 'chair', pivot: [0, 0.03, 0] })
      .box([0.46, 0.06, 0.42], [0, 0.505, 0.01], { color: '#b8433a', round: 0.6, edge: 'soft', parent: 'chair' })
      .box([0.54, 0.09, 0.06], [0, 1.12, -0.33], { color: dw, round: 0.4, rot: [-12, 0, 0], parent: 'chair' });
    b.each(5, (i) => b.stick([-0.16 + i * 0.08, 0.48, -0.22], [-0.16 + i * 0.08, 1.08, -0.32], 0.025, w, { parent: 'chair' }));
    b.pair((s) => {
      b.stick([s * 0.24, 0.1, 0.2], [s * 0.24, 0.45, 0.2], 0.04, dw, { parent: 'chair' }).stick([s * 0.24, 0.1, -0.2], [s * 0.25, 1.12, -0.33], 0.045, dw, { parent: 'chair' });
      b.stick([s * 0.25, 0.48, 0.2], [s * 0.25, 0.68, 0.2], 0.035, dw, { parent: 'chair' }).box([0.07, 0.04, 0.52], [s * 0.26, 0.7, -0.03], { color: w, round: 0.5, parent: 'chair' });
      b.stick([s * 0.24, 0.24, 0.2], [s * 0.24, 0.24, -0.2], 0.025, dw, { parent: 'chair' });
      b.arc([2.8, 2.8, 0.05], [s * 0.24, 1.46, -0.02], { color: dw, rot: [0, 90, 180], arc: 40, tube: 0.025, parent: 'chair' });
    });
    return b
      .socket('seat', [0, 0.53, 0.02], 'seat')
      .act({ click: [A.pose('chair', { rot: [9, 0, 0], dur: 0.6 }), A.par(A.pose('chair', { rot: [-9, 0, 0], dur: 0.8 }), A.say('Creak... creak...', 2)), A.pose('chair', { rot: [6, 0, 0], dur: 0.7 }), A.pose('chair', { rot: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A dappled-grey rocking horse (1.0 m) on red bow rockers: lofted body, wool mane and tail, a red saddle with
  // stirrups, bridle and reins, handle pegs through the head. Click: it rocks, clip-clop.
  e('rocking horse', 'toys', 'ride-on toys', () => {
    const g = '#d4d7da', mn = '#5a3a22', rd = '#c8302a';
    const b = m('rocking horse', { view: 'side' })
      .loft([0.32, 0.34, 0.75], [0, 0.6, 0], [[0, 0.7, 0.8, 0.02], [0.2, 1, 1, 0], [0.75, 0.95, 0.95, 0], [1, 0.6, 0.75, 0.06]], { color: g, boxy: 0.2, name: 'horse', pivot: [0, 0.05, 0] })
      .rod([0, 0.7, 0.28], [0, 0.94, 0.42], 0.17, g, { parent: 'horse' })
      .box([0.14, 0.15, 0.32], [0, 0.98, 0.54], { color: g, round: 0.6, rot: [30, 0, 0], parent: 'horse' })
      .ball([0.1, 0.08, 0.06], [0, 0.9, 0.68], { color: '#9da3a8', parent: 'horse' })
      .box([0.34, 0.06, 0.32], [0, 0.78, -0.02], { color: rd, round: 0.5, parent: 'horse', edge: 'sharp' })
      .box([0.24, 0.07, 0.08], [0, 0.81, -0.16], { color: rd, round: 0.6, parent: 'horse' })
      .stick([-0.12, 1.02, 0.47], [0.12, 1.02, 0.47], 0.025, '#d0a84a', { parent: 'horse', edge: 'sharp' })
      .rod([0, 0.68, -0.37], [0, 0.42, -0.47], 0.06, mn, { parent: 'horse' });
    b.each(6, (i) => b.ball(0.07, [0, 0.82 + i * 0.045, 0.3 + i * 0.03], { color: mn, parent: 'horse' }));
    b.each(5, (i) => b.ball([0.06, 0.05, 0.04], [i % 2 ? 0.13 : -0.13, 0.55 + (i % 3) * 0.08, -0.2 + i * 0.1], { color: 'white', parent: 'horse', noInk: true }));
    b.pair((s) => {
      b.cone([0.04, 0.08, 0.04], [s * 0.045, 1.08, 0.42], { color: g, parent: 'horse' });
      b.ball(0.03, [s * 0.07, 1.0, 0.56], { color: '#1e1612', eye: true, parent: 'horse' });
      b.rod([s * 0.07, 0.92, 0.66], [s * 0.15, 0.8, 0.12], 0.015, '#2a2726', { parent: 'horse' });
      b.stick([s * 0.17, 0.78, -0.02], [s * 0.17, 0.62, -0.02], 0.01, '#2a2726', { parent: 'horse' }).arc([0.06, 0.06, 0.01], [s * 0.17, 0.6, -0.02], { color: '#c9ccd1', rot: [0, 90, 180], arc: 220, parent: 'horse', edge: 'sharp' });
      b.rod([s * 0.1, 0.52, 0.24], [s * 0.15, 0.14, 0.42], 0.07, g, { parent: 'horse' }).rod([s * 0.1, 0.52, -0.24], [s * 0.15, 0.14, -0.42], 0.07, g, { parent: 'horse' });
      b.ball([0.08, 0.05, 0.09], [s * 0.15, 0.12, 0.43], { color: '#2a2726', parent: 'horse' }).ball([0.08, 0.05, 0.09], [s * 0.15, 0.12, -0.43], { color: '#2a2726', parent: 'horse' });
      b.arc([2.8, 2.8, 0.06], [s * 0.15, 1.45, 0], { color: rd, rot: [0, 90, 180], arc: 50, tube: 0.03, parent: 'horse', edge: 'sharp' });
    });
    return b
      .socket('seat', [0, 0.83, -0.02], 'seat')
      .act({ click: [A.pose('horse', { rot: [10, 0, 0], dur: 0.5 }), A.par(A.pose('horse', { rot: [-10, 0, 0], dur: 0.7 }), A.say('Clip-clop!', 1.5)), A.pose('horse', { rot: [7, 0, 0], dur: 0.6 }), A.pose('horse', { rot: [0, 0, 0], dur: 0.5 })] })
      .done();
  }),
  // A fishing rod (2.1 m) propped on a forked stick: cork handle, a spinning reel with a crank, line guides, the
  // line down to a red-and-white float. Click: the reel whirrs and a salmon comes up; next click it is let go.
  e('rod', 'sports', 'fishing', () => {
    const b = m('rod')
      .stick([0.3, 0, 0.1], [0.32, 0.75, 0.1], 0.05, '#7a5230')
      .stick([0.32, 0.65, 0.1], [0.26, 0.85, 0.1], 0.03, '#7a5230')
      .stick([0.32, 0.65, 0.1], [0.4, 0.85, 0.1], 0.03, '#7a5230')
      .stick([-0.35, 0.02, 0.1], [-0.05, 0.42, 0.1], 0.04, '#c9a46a')
      .stick([-0.05, 0.42, 0.1], [1.0, 1.82, 0.1], 0.02, '#2a2726')
      .box([0.03, 0.07, 0.06], [-0.18, 0.25, 0.1], { color: '#c9ccd1', edge: 'sharp' })
      .cyl([0.08, 0.06, 0.08], [-0.2, 0.18, 0.1], { color: '#5c6166', rot: [0, 0, 90], edge: 'sharp' })
      .cyl([0.04, 0.02, 0.04], [-0.23, 0.18, 0.15], { color: '#3a3633', rot: [90, 0, 0], name: 'reel', pivot: [-0.2, 0.18, 0.15], mover: { kind: 'spin', axis: 'z', amount: 900 }, edge: 'sharp' })
      .box([0.012, 0.07, 0.012], [-0.2, 0.2, 0.17], { color: '#c9ccd1', parent: 'reel', edge: 'sharp' })
      .ball(0.02, [-0.2, 0.235, 0.18], { color: '#2a2726', parent: 'reel' });
    b.each(4, (i) => b.torus([0.025, 0.025, 0.006], [0.15 + i * 0.22, 0.68 + i * 0.3, 0.1], { color: '#c9ccd1', rot: [0, 90, 0], tube: 0.2 }));
    b.stick([1.0, 1.82, 0.1], [1.25, 0.06, 0.25], 0.004, 'white')
      .ball([0.05, 0.05, 0.05], [1.25, 0.04, 0.25], { color: '#e0473b' })
      .ball([0.045, 0.03, 0.045], [1.25, 0.075, 0.25], { color: 'white' })
      .stick([1.25, 0.09, 0.25], [1.25, 0.14, 0.25], 0.006, '#e0473b');
    return b
      .act({
        click: [
          [A.operate('reel', 'on'), A.say('Zzzzzz!', 1.5), A.wait(1), A.operate('reel', 'off'), A.spawn('catch', 'salmon', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.effect('water_spray', { dur: 1 }), A.anim('hop', 2, 'catch'))],
          [A.remove('catch', 'sink'), A.effect('water_spray', { dur: 1 })],
        ],
      })
      .done();
  }),
  // A pair of quad roller skates (27 cm boots): white leather boots with pink laces, padded collars, toe stops,
  // a steel plate and four pink wheels each. Click: they roll off a little way and back.
  e('roller-skates', 'sports', 'skating', () => {
    const b = m('roller-skates', { view: 'side' });
    b.pair((s) => {
      const x = s * 0.08;
      b.box([0.085, 0.035, 0.27], [x, 0.085, 0.0], { color: '#f7f5ef', round: 0.4, edge: 'sharp' })
        .box([0.085, 0.16, 0.12], [x, 0.18, -0.06], { color: '#f7f5ef', round: 0.45 })
        .ball([0.085, 0.07, 0.15], [x, 0.12, 0.06], { color: '#f7f5ef' })
        .cyl([0.095, 0.035, 0.11], [x, 0.265, -0.06], { color: '#f4a1c0' })
        .box([0.06, 0.1, 0.03], [x, 0.2, 0.0], { color: '#f7f5ef', round: 0.5, rot: [-25, 0, 0] })
        .box([0.06, 0.012, 0.25], [x, 0.06, 0], { color: '#c9ccd1', edge: 'sharp' })
        .cyl([0.04, 0.035, 0.04], [x, 0.04, 0.15], { color: '#d64fa0', rot: [-20, 0, 0] });
      b.each(4, (i) => b.box([0.05, 0.008, 0.012], [x, 0.14 + i * 0.03, 0.06 - i * 0.025], { color: '#f4a1c0', noInk: true, rot: [-30, 0, 0] }));
      b.stick([x - 0.04, 0.03, 0.08], [x + 0.04, 0.03, 0.08], 0.01, '#9da3a8').stick([x - 0.04, 0.03, -0.08], [x + 0.04, 0.03, -0.08], 0.01, '#9da3a8');
      for (const z of [0.08, -0.08]) b.pair((t) => wheel(b, `wheel${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}${t > 0 ? '1' : '2'}`, [x + t * 0.032, 0.03, z], 0.06, 0.022, '#f4a1c0'));
    });
    return b.act({ click: [A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' }), A.say('Wheee!', 1.2), A.move('self', { rel: 'right', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' })] }).done();
  }),
  // A roller coaster (32 m long, 19 m high): the station, a lift hill with its chain, a steep drop, a vertical
  // loop and a return track, red rails on white supports, and a three-car train waiting at the top. Click: the
  // train plunges down the drop and round the loop; click again and it returns and climbs the lift.
  e('rollercoaster', 'places', 'amusement park', () => {
    const b = m('rollercoaster', { edge: 'sharp' }), rc = '#d8312a';
    const P: Array<[number, number]> = [[-15, 1.3], [-9, 1.3], [-7, 3], [-2, 17.5], [0, 18.2], [1.6, 17.6], [5, 6], [7.2, 1.7], [12, 1.5], [19, 1.5]];
    for (let i = 0; i < P.length - 1; i++) {
      const [a, c] = [P[i], P[i + 1]];
      b.pair((s) => b.stick([a[0], a[1], s * 0.55], [c[0], c[1], s * 0.55], 0.2, rc));
      if (a[1] > 2.2) b.stick([a[0], 0, 0], [a[0], a[1] - 0.1, 0], 0.4, 'white');
    }
    for (let k = 0; k < 14; k++) {
      const t = k / 13, xx = -15 + t * 34, seg = P.findIndex((p, i) => i < P.length - 1 && xx >= p[0] && xx <= P[i + 1][0]);
      if (seg < 0) continue;
      const [a, c] = [P[seg], P[seg + 1]], yy = a[1] + ((xx - a[0]) / (c[0] - a[0])) * (c[1] - a[1]);
      b.box([0.2, 0.12, 1.3], [xx, yy - 0.1, 0], { color: '#5c6166' });
    }
    b.stick([-7, 3.1, 0], [-2, 17.6, 0], 0.12, '#2a2726');
    b.pair((s) => b.torus([11.6, 11.6, 0.2], [12, 7.3, s * 0.55], { color: rc, tube: 0.03 }));
    b.stick([12, 0, 0], [12, 1.4, 0], 0.4, 'white').stick([6.3, 0, 0.9], [6.3, 7.3, 0.9], 0.35, 'white').stick([17.7, 0, 0.9], [17.7, 7.3, 0.9], 0.35, 'white');
    b.pair((s) => b.stick([-15, 0.5, -3 + s * 0.55], [19, 0.5, -3 + s * 0.55], 0.18, rc));
    b.box([7, 0.9, 4], [-12, 0.45, 0], { color: '#c9c6bd' })
      .box([7.4, 0.3, 4.4], [-12, 4.4, 0], { color: '#4e8fd6', round: 0.1 })
      .label('THUNDER RIDE', [5, 0.8], [-12, 3.75, 2.2], { color: '#f6d24a', depth: 0.06 });
    b.pair((s) => b.stick([-15, 0.9, s * 1.8], [-15, 4.3, s * 1.8], 0.2, '#5c6166').stick([-9, 0.9, s * 1.8], [-9, 4.3, s * 1.8], 0.2, '#5c6166'));
    const car = (xx: number, c: string, o: { name?: string; parent?: string }) => {
      b.box([1.55, 0.6, 1.3], [xx, 18.7, 0], { color: c, round: 0.3, ...o });
      const par = { parent: o.name ?? o.parent };
      b.box([0.5, 0.5, 1.1], [xx - 0.25, 19.15, 0], { color: '#2a2726', round: 0.4, ...par });
      b.stick([xx + 0.1, 19.2, -0.55], [xx + 0.1, 19.2, 0.55], 0.06, '#f6d24a', par);
    };
    car(0, '#f6d24a', { name: 'train' });
    car(1.65, '#4e8fd6', { parent: 'train' });
    car(-1.65, '#5aa553', { parent: 'train' });
    b.cone([0.6, 0.7, 1.2], [2.6, 18.7, 0], { color: '#f6d24a', rot: [0, 0, -90], parent: 'train' });
    return b
      .act({
        click: [
          [
            A.pose('train', { rot: [0, 0, -55], move: [1.5, -0.6, 0], dur: 0.5 }),
            A.par(A.pose('train', { rot: [0, 0, -60], move: [6, -16.4, 0], dur: 0.9 }), A.say('Wheeeee!', 2.5)),
            A.pose('train', { rot: [0, 0, 0], move: [10, -16.9, 0], dur: 0.4 }),
            A.pose('train', { rot: [0, 0, 90], move: [17.2, -11.4, 0], dur: 0.5 }),
            A.pose('train', { rot: [0, 0, 180], move: [12, -6.1, 0], dur: 0.5 }),
            A.pose('train', { rot: [0, 0, 270], move: [6.8, -11.4, 0], dur: 0.5 }),
            A.pose('train', { rot: [0, 0, 360], move: [12, -16.9, 0], dur: 0.5 }),
            A.pose('train', { rot: [0, 0, 360], move: [18, -16.9, 0], dur: 0.4 }),
          ],
          [
            A.pose('train', { rot: [0, 0, 0], move: [18, -16.9, -3], dur: 0.3 }),
            A.pose('train', { move: [-13, -16.9, -3], dur: 1.6 }),
            A.pose('train', { move: [-9, -16.9, 0], dur: 0.4 }),
            A.par(A.pose('train', { rot: [0, 0, 71], move: [-6, -15.5, 0], dur: 0.4 }), A.say('Click, click, click...', 3)),
            A.pose('train', { rot: [0, 0, 71], move: [-2, -1.2, 0], dur: 2.2 }),
            A.pose('train', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 }),
          ],
        ],
      })
      .done();
  }),
  // A wooden rolling pin (45 cm) lying on a floured pastry board on a disc of dough. Click: it rolls across and
  // the dough spreads; click again and it rolls back. (The vocabulary's 0.5 m is its length; lying down it
  // stands 7 cm high.)
  e('rolling pin', 'kitchen', 'baking', () => {
    const b = m('rolling pin')
      .box([0.5, 0.02, 0.36], [0, 0.01, 0], { color: '#d8b07a', round: 0.3, edge: 'sharp' })
      .cyl([0.26, 0.012, 0.26], [0, 0.026, -0.02], { color: '#f2dfb0', name: 'dough' });
    b.each(6, (i) => b.ball([0.05, 0.003, 0.03], [-0.18 + i * 0.07, 0.021, 0.12 - (i % 2) * 0.24], { color: 'white', noInk: true }));
    b.cyl([0.06, 0.26, 0.06], [0, 0.063, 0.06], { color: '#e2c08a', rot: [0, 0, 90], name: 'pin' })
      .torus([0.061, 0.061, 0.004], [0.09, 0.063, 0.06], { color: '#cfa870', rot: [0, 90, 0], tube: 0.1, parent: 'pin', noInk: true });
    b.pair((s) => b.capsule([0.03, 0.1, 0.03], [s * 0.18, 0.063, 0.06], { color: '#9a6a3e', rot: [0, 0, 90], parent: 'pin' }));
    return b
      .act({
        click: [
          [A.par(A.pose('pin', { move: [0, 0, -0.14], rot: [-200, 0, 0], dur: 0.8 }), A.pose('dough', { scale: 1.2, dur: 0.8 }))],
          [A.pose('pin', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 }), A.effect('dust', { dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A gable roof (8.4 m x 6 m) as it sits on the top of a house: rows of clay tiles, a ridge cap, a brick chimney,
  // a dormer window, bargeboards, gutters and a downpipe, on a strip of wall. Click: the chimney smokes; or a
  // pigeon lands on the ridge and flies off.
  e('roof', 'places', 'building parts', () => {
    const t = '#b8503a', W = 8.4, D = 6, H = 3.4;
    const b = m('roof', { edge: 'sharp' })
      .box([W - 0.4, 0.8, D - 0.4], [0, 0.4, 0], { color: '#f0e2c4', round: 0.02 })
      .wedge([D + 0.6, H, W + 0.4], [0, 0.8 + H / 2, 0], { color: t, rot: [0, 90, 0] })
      .box([W + 0.5, 0.3, 0.3], [0, 0.8 + H + 0.05, 0], { color: '#8a3a2a', rot: [45, 0, 0], round: 0.2 });
    const slope = Math.atan2(H, D / 2 + 0.3) / D2R;
    b.pair((s) => {
      b.each(6, (i) => {
        const f = (i + 0.5) / 6, yy = 0.8 + H * (1 - f), zz = s * (D / 2 + 0.3) * f;
        b.box([W + 0.42, 0.06, 0.08], [0, yy + 0.04, zz + s * 0.03], { color: '#9a3e2c', rot: [s * slope, 0, 0], noInk: true });
      });
      b.box([W + 0.5, 0.14, 0.18], [0, 0.82, s * (D / 2 + 0.32)], { color: '#e8e4dc', round: 0.3 });
      b.cyl([0.12, 0.8, 0.12], [W / 2 + 0.1, 0.4, s * (D / 2 + 0.3)], { color: '#e8e4dc' });
    });
    b.pair((s) => b.stick([s * (W / 2 + 0.22), 0.8, D / 2 + 0.3], [s * (W / 2 + 0.22), 0.8 + H, 0], 0.12, '#f7f5ef').stick([s * (W / 2 + 0.22), 0.8, -D / 2 - 0.3], [s * (W / 2 + 0.22), 0.8 + H, 0], 0.12, '#f7f5ef'));
    b.box([0.9, 2.6, 0.9], [2.4, 3.6, -1.2], { color: '#a0503a', round: 0.05 })
      .box([1.0, 0.15, 1.0], [2.4, 4.95, -1.2], { color: '#7a3a2a' })
      .cyl([0.25, 0.4, 0.25], [2.4, 5.2, -1.2], { color: '#c87a4a' });
    b.box([1.6, 1.4, 1.8], [-1.6, 2.4, 1.6], { color: '#f0e2c4' })
      .wedge([1.9, 0.8, 2.0], [-1.6, 3.5, 1.6], { color: t });
    win(b, [-1.6, 2.35, 2.52], 0.9, 0.9, { frame: 'white' });
    return b
      .act({
        click: [
          [A.effect('smoke', { dur: 3 }), A.say('Puff, puff...', 2)],
          [A.spawn('bird', 'pigeon', { rel: 'near', of: 'self', dist: 'close' }), A.say('Coo!', 1.2), A.remove('bird', 'fly_away')],
        ],
      })
      .done();
  }),
  // A seedling pulled up to show its root (20 cm): two leaves on a stem, soil still clinging to the crown, a
  // thick taproot branching into fine rootlets. Click: the shoot grows a little; click again, back.
  e('root', 'garden', 'plant parts', () => {
    const tan = '#c9a46a';
    const b = m('root')
      .ball([0.05, 0.035, 0.05], [0, 0.145, 0], { color: '#7a5a40' })
      .cone([0.035, 0.13, 0.035], [0, 0.075, 0], { color: tan, rot: [180, 0, 0] });
    for (const [x, y, z, l] of [[0.06, 0.11, 0.02, 0.06], [-0.06, 0.12, 0.0, 0.05], [0.05, 0.07, -0.03, 0.05], [-0.05, 0.06, 0.03, 0.05], [0.0, 0.12, 0.06, 0.05], [0.02, 0.04, 0.04, 0.03]] as Array<[number, number, number, number]>) {
      b.rod([0, y + 0.01, 0], [x, y - l * 0.6, z], 0.007, tan);
      b.rod([x, y - l * 0.6, z], [x * 1.4, y - l * 1.2, z * 1.4 + 0.01], 0.004, '#d9b98a');
    }
    b.stick([0, 0.16, 0], [0, 0.23, 0], 0.008, '#5aa553', { name: 'shoot', pivot: [0, 0.16, 0] })
      .ball([0.05, 0.01, 0.025], [0.025, 0.235, 0], { color: '#5aa553', rot: [0, 0, 25], parent: 'shoot' })
      .ball([0.05, 0.01, 0.025], [-0.025, 0.235, 0], { color: '#5aa553', rot: [0, 0, -25], parent: 'shoot' });
    return b.act({ click: [[A.par(A.pose('shoot', { scale: 1.3, dur: 1 }), A.effect('sparkle', { dur: 1 }))], [A.pose('shoot', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A brown glass bottle of root beer (26 cm) with a cream label and crown cap, and a frosty mug of it with a
  // foam head. Click: the cap pops off with a fizz; click again, it is back on.
  e('root beer', 'food', 'drinks', () => {
    const g = '#4a2414';
    const b = m('root beer')
      .cyl([0.07, 0.156, 0.07], [0, 0.078, 0], { color: g, name: 'bottle' })
      .cyl([0.07, 0.04, 0.07], [0, 0.175, 0], { color: g, taper: 0.4, parent: 'bottle' })
      .cyl([0.028, 0.06, 0.028], [0, 0.225, 0], { color: g, parent: 'bottle' })
      .cyl([0.072, 0.07, 0.072], [0, 0.08, 0], { color: '#fff3d6', parent: 'bottle', edge: 'sharp' })
      .label('ROOT BEER', [0.055, 0.02], [0, 0.085, 0.037], { color: '#fff3d6', depth: 0.002, parent: 'bottle' })
      .cyl([0.034, 0.014, 0.034], [0, 0.26, 0], { color: '#d8312a', name: 'cap', parent: 'bottle', piece: true, edge: 'sharp' })
      .cyl([0.09, 0.12, 0.09], [0.11, 0.06, 0.05], { color: '#6b3a22', edge: 'sharp' })
      .dome([0.088, 0.025, 0.088], [0.11, 0.13, 0.05], { color: '#f2e6cf' })
      .torus([0.06, 0.08, 0.016], [0.165, 0.065, 0.05], { color: '#cfe8f4', tube: 0.22 });
    return b.act({ click: [[A.detach('cap', 'cap'), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Fssst!', 1))], [A.reattach('cap'), A.say('Click.', 1)]] }).done();
  }),
  // A root beer float in a tall glass mug (24 cm): dark root beer, scoops of vanilla ice cream in a foam head, a
  // striped straw and a cherry. Click: it fizzes and the top scoop bobs.
  e('root beer float', 'food', 'drinks', () =>
    m('root beer float')
      .cyl([0.09, 0.17, 0.09], [0, 0.085, 0], { color: '#5a2e1a', taper: 1.12 })
      .cyl([0.08, 0.012, 0.08], [0, 0.006, 0], { color: '#cfe8f4', edge: 'sharp' })
      .torus([0.1, 0.1, 0.012], [0, 0.17, 0], { color: '#cfe8f4', rot: [90, 0, 0], tube: 0.12 })
      .torus([0.07, 0.1, 0.02], [0.065, 0.09, 0], { color: '#cfe8f4', tube: 0.25 })
      .ball([0.1, 0.05, 0.1], [0, 0.17, 0], { color: '#f2e6cf' })
      .ball(0.07, [0, 0.2, 0], { color: '#fbf6e8', name: 'scoop' })
      .ball(0.05, [0.02, 0.24, 0.0], { color: '#fbf6e8', parent: 'scoop' })
      .ball(0.02, [0.02, 0.272, 0.01], { color: '#a3222a', parent: 'scoop' })
      .stick([0.02, 0.272, 0.01], [0.03, 0.3, 0.0], 0.003, '#3f7a3a', { parent: 'scoop' })
      .stick([-0.02, 0.12, 0], [-0.05, 0.31, -0.01], 0.008, '#e0473b')
      .act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.pose('scoop', { move: [0, 0.015, 0], dur: 0.3 }), A.say('Fizz!', 1)), A.pose('scoop', { move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A hank of three-strand rope (about 15 m of it, coiled) hanging from a peg on a wooden post, its free end
  // whipped and trailing. Click: the free end swings loose; click again, it is tucked up.
  e('rope', 'workshop', 'rope & chain', () => {
    const b = m('rope')
      .cyl([0.36, 0.06, 0.36], [0, 0.03, -0.1], { color: '#7a5230', edge: 'sharp' })
      .box([0.1, 1.7, 0.1], [0, 0.85, -0.1], { color: '#8c5a2b', round: 0.1, edge: 'sharp' })
      .rod([0, 1.4, -0.06], [0, 1.43, 0.08], 0.03, '#55595e');
    b.each(6, (i) => b.torus([0.46 - i * 0.012, 0.72 - i * 0.02, 0.045], [(i - 2.5) * 0.008, 1.04, 0.0 + i * 0.012], { color: i % 2 ? '#d9b98a' : '#c9a46a', tube: 0.11 }));
    b.each(5, (i) => b.torus([0.08, 0.08, 0.06], [0, 1.32 - i * 0.035, 0.04], { color: '#b8945a', rot: [90, 0, 0], tube: 0.35, noInk: true }));
    b.rod([0.12, 0.72, 0.05], [0.2, 0.35, 0.07], 0.045, '#c9a46a', { name: 'end', pivot: [0.12, 0.72, 0.05] })
      .rod([0.2, 0.35, 0.07], [0.16, 0.12, 0.09], 0.045, '#c9a46a', { parent: 'end' })
      .cyl([0.05, 0.05, 0.05], [0.16, 0.1, 0.09], { color: '#e0473b', parent: 'end' });
    return b.act({ click: [[A.pose('end', { rot: [0, 0, 35], dur: 0.4 }), A.pose('end', { rot: [0, 0, -15], dur: 0.5 }), A.pose('end', { rot: [0, 0, 8], dur: 0.4 })], [A.pose('end', { rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A rope ladder (3.2 m) hanging from a timber frame in a playground: rope sides with wooden rungs every 30 cm,
  // knotted under each rung. Click: it swings.
  e('rope ladder', 'sports', 'playground', () => {
    const b = m('rope ladder', { edge: 'sharp' })
      .box([2.2, 0.2, 0.2], [0, 3.5, 0], { color: '#7a5230', round: 0.1 });
    b.pair((s) => b.stick([s * 1.0, 0, 0], [s * 1.0, 3.6, 0], 0.2, '#7a5230').box([0.5, 0.1, 0.5], [s * 1.0, 0.05, 0], { color: '#a7a7a0' }));
    b.pair((s) => b.stick([s * 1.0, 0.2, 0.6], [s * 1.0, 2.8, 0.05], 0.12, '#7a5230'));
    b.stick([-0.25, 3.45, 0], [-0.25, 0.3, 0], 0.035, '#c9a46a', { name: 'ladder', pivot: [0, 3.45, 0] }).stick([0.25, 3.45, 0], [0.25, 0.3, 0], 0.035, '#c9a46a', { parent: 'ladder' });
    b.each(10, (i) => b.box([0.6, 0.04, 0.08], [0, 0.4 + i * 0.3, 0], { color: '#d8b07a', round: 0.4, parent: 'ladder' }).pair((s) => b.ball(0.05, [s * 0.25, 0.37 + i * 0.3, 0], { color: '#b8945a', parent: 'ladder', edge: 'soft' })));
    return b.act({ click: [A.pose('ladder', { rot: [20, 0, 0], dur: 0.6 }), A.pose('ladder', { rot: [-14, 0, 0], dur: 0.8 }), A.pose('ladder', { rot: [6, 0, 0], dur: 0.6 }), A.pose('ladder', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A rope swing on an oak (4.8 m): a gnarled trunk, a long side branch at 3.6 m, a knotted rope and a wooden
  // disc seat at sitting height. Click: it swings out and back, whee!
  e('rope swing', 'sports', 'playground', () => {
    const b = m('rope swing')
      .cyl([0.6, 4.0, 0.6], [-1.2, 2.0, -0.3], { color: '#7a5134', taper: 0.65 })
      .cyl([0.9, 0.4, 0.9], [-1.2, 0.2, -0.3], { color: '#6a4529', taper: 0.7 })
      .rod([-1.2, 3.3, -0.3], [1.3, 3.65, -0.1], 0.22, '#7a5134')
      .ball([3.4, 1.8, 2.6], [-0.8, 4.1, -0.4], { color: '#4f9a48', name: 'top' })
      .ball([1.6, 1.0, 1.4], [1.0, 3.95, 0.1], { color: '#3f7a3a', parent: 'top' })
      .ball([1.5, 1.1, 1.3], [-2.0, 3.8, 0.2], { color: '#5aa553', parent: 'top' })
      .torus([0.18, 0.18, 0.06], [0.7, 3.6, -0.14], { color: '#c9a46a', rot: [0, 90, 0], tube: 0.25 })
      .stick([0.7, 3.55, -0.14], [0.7, 0.62, -0.14], 0.045, '#c9a46a', { name: 'swing', pivot: [0.7, 3.55, -0.14] })
      .ball(0.13, [0.7, 0.62, -0.14], { color: '#b8945a', parent: 'swing' })
      .cyl([0.42, 0.07, 0.42], [0.7, 0.5, -0.14], { color: '#9a6a3e', parent: 'swing', edge: 'sharp' });
    return b
      .socket('seat', [0.7, 0.56, -0.14], 'seat')
      .act({ click: [A.pose('swing', { rot: [32, 0, 0], dur: 0.7 }), A.par(A.pose('swing', { rot: [-28, 0, 0], dur: 1 }), A.say('Wheee!', 1.5)), A.pose('swing', { rot: [15, 0, 0], dur: 0.8 }), A.pose('swing', { rot: [0, 0, 0], dur: 0.7 })] })
      .done();
  }),
  // A wooden rosary (60 cm loop) hanging from the peg of a little stand: decades of brown beads with larger red
  // beads between, a short tail and a gold crucifix. Click: it sways and glints.
  e('rosary beads', 'wardrobe', 'jewellery', () => {
    const b = m('rosary beads', { edge: 'sharp' })
      .box([0.24, 0.04, 0.14], [0, 0.02, -0.04], { color: '#7a5230' })
      .stick([0, 0.04, -0.06], [0, 0.7, -0.06], 0.025, '#7a5230')
      .rod([0, 0.68, -0.06], [0, 0.68, 0.0], 0.02, '#7a5230')
      .ball(0.014, [0, 0.67, 0.0], { color: '#8c5a2b', name: 'beads', pivot: [0, 0.68, 0.0], edge: 'soft' });
    b.each(24, (i) => {
      const a = (i / 24) * Math.PI * 2;
      b.ball(i % 6 === 0 ? 0.028 : 0.02, [Math.sin(a) * 0.1, 0.5 + Math.cos(a) * 0.17, 0.0], { color: i % 6 === 0 ? '#a3222a' : '#8c5a2b', parent: 'beads', edge: 'soft' });
    });
    b.each(4, (i) => b.ball(i === 0 ? 0.026 : 0.02, [0, 0.3 - i * 0.035, 0.0], { color: i === 0 ? '#a3222a' : '#8c5a2b', parent: 'beads', edge: 'soft' }));
    b.box([0.016, 0.1, 0.01], [0, 0.11, 0.0], { color: '#e2b23a', parent: 'beads' }).box([0.06, 0.016, 0.01], [0, 0.13, 0.0], { color: '#e2b23a', parent: 'beads' });
    return b.act({ click: [A.par(A.pose('beads', { rot: [0, 0, 12], dur: 0.5 }), A.effect('sparkle', { dur: 1.2 })), A.pose('beads', { rot: [0, 0, -8], dur: 0.6 }), A.pose('beads', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A long-stemmed red rose (60 cm): a thorny stem, serrated leaves, green sepals and a cupped bloom of layered
  // petals. Click: it opens wide with hearts; click again, it closes.
  e('rose', 'garden', 'flowers', () => {
    const b = m('rose').stick([0, 0, 0], [0, 0.5, 0], 0.012, '#3f7a3a');
    b.each(5, (i) => b.cone([0.008, 0.014, 0.008], [(i % 2 ? 1 : -1) * 0.007, 0.08 + i * 0.08, 0], { color: '#5a3a22', rot: [0, 0, (i % 2 ? -1 : 1) * 75] }));
    b.pair((s) => {
      b.rod([0, 0.22 + (s > 0 ? 0.08 : 0), 0], [s * 0.05, 0.27 + (s > 0 ? 0.08 : 0), 0.01], 0.006, '#3f7a3a');
      b.ball([0.055, 0.008, 0.032], [s * 0.075, 0.28 + (s > 0 ? 0.08 : 0), 0.015], { color: '#4f9a48', rot: [10, s * 20, s * 20] });
      b.ball([0.04, 0.007, 0.024], [s * 0.05, 0.3 + (s > 0 ? 0.08 : 0), 0.05], { color: '#4f9a48', rot: [30, s * -30, s * 15] });
    });
    b.each(5, (i) => b.cone([0.018, 0.035, 0.01], [Math.cos(i * 1.256) * 0.018, 0.497, Math.sin(i * 1.256) * 0.018], { color: '#3f7a3a', rot: [Math.sin(i * 1.256) * 110, 0, -Math.cos(i * 1.256) * 110] }));
    b.ball([0.07, 0.075, 0.07], [0, 0.54, 0], { color: '#c41e30', name: 'head', pivot: [0, 0.5, 0] });
    for (const [xx, z] of around(5, 0.03)) b.ball([0.05, 0.065, 0.035], [xx, 0.535, z], { color: '#d42a3a', rot: [0, Math.atan2(xx, z) / D2R, 0], parent: 'head' });
    for (const [xx, z] of around(3, 0.014, 0.5)) b.ball([0.032, 0.05, 0.022], [xx, 0.555, z], { color: '#b81a2a', rot: [0, Math.atan2(xx, z) / D2R, 0], parent: 'head' });
    b.cone([0.025, 0.03, 0.025], [0, 0.585, 0], { color: '#a3122a', parent: 'head' });
    return b.act({ click: [[A.par(A.pose('head', { scale: 1.3, dur: 0.8 }), A.effect('hearts', { dur: 1.5 }))], [A.pose('head', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A home Wi-Fi router (26 cm wide): a black ventilated case on little feet, four antennas, ports at the back
  // and a row of status lights that come on when clicked.
  e('router', 'tech', 'computers', () => {
    const b = m('router', { edge: 'sharp' })
      .box([0.26, 0.045, 0.17], [0, 0.03, 0], { color: '#2a2726', round: 0.3 })
      .box([0.2, 0.004, 0.11], [0, 0.0535, 0], { color: '#3a3633', round: 0.2, noInk: true })
      .label('WI-FI', [0.06, 0.012], [-0.08, 0.03, 0.086], { color: '#2a2726', depth: 0.002 });
    b.each(4, (i) => b.box([0.018, 0.02, 0.01], [-0.06 + i * 0.03, 0.03, -0.085], { color: '#5c6166' }));
    b.each(4, (i) => {
      const xx = -0.1 + i * 0.067;
      b.cyl([0.018, 0.02, 0.018], [xx, 0.06, -0.075], { color: '#3a3633' }).box([0.016, 0.17, 0.008], [xx + (i - 1.5) * 0.008, 0.15, -0.08], { color: '#2a2726', round: 0.5, rot: [0, 0, (1.5 - i) * 6] });
    });
    b.each(5, (i) => b.ball([0.008, 0.008, 0.004], [-0.02 + i * 0.022, 0.03, 0.086], { color: '#7cff6a', name: `led${i}`, mover: { kind: 'light' } }));
    b.pair((s) => b.cyl([0.02, 0.008, 0.02], [s * 0.1, 0.004, 0.06], { color: '#3a3633' }).cyl([0.02, 0.008, 0.02], [s * 0.1, 0.004, -0.06], { color: '#3a3633' }));
    return b.act({ click: [[A.operate('led', 'on'), A.say('Blink blink!', 1.5)], [A.operate('led', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A wooden rowing boat at real size (3.5 m long, 1.4 m beam): a lofted white hull with a blue sheer stripe, a
  // wooden inside with two thwarts, oarlocks, and two oars that sweep through the water when clicked.
  e('rowboat', 'garage', 'boats', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.72, 0.8, 0], [0.25, 0.95, 0.95, 0], [0.55, 1, 1, 0], [0.85, 0.72, 0.95, 0.02], [1, 0.06, 0.85, 0.05]];
    const b = m('rowboat', { view: 'side' })
      .loft([1.4, 1.2, 3.5], [0, 0.6, 0], prof, { color: '#f7f5ef', cut: 'bottom', boxy: 0.3, name: 'hull' })
      .loft([1.42, 0.3, 3.52], [0, 0.6, 0], prof, { color: '#3f6fb5', cut: 'bottom', boxy: 0.3, edge: 'sharp' })
      .loft([1.26, 1.24, 3.3], [0, 0.62, -0.02], prof, { color: '#b5814e', cut: 'bottom', boxy: 0.3, edge: 'sharp' });
    b.each(2, (i) => b.box([1.18, 0.05, 0.26], [0, 0.66, -0.75 + i * 0.95], { color: '#d8b07a', edge: 'sharp', round: 0.2 }));
    b.box([0.7, 0.05, 0.3], [0, 0.66, -1.4], { color: '#d8b07a', edge: 'sharp', round: 0.2 });
    b.pair((s) => {
      const nm = s > 0 ? 'oarL' : 'oarR';
      b.cyl([0.03, 0.08, 0.03], [s * 0.66, 0.69, 0.05], { color: '#5c6166', edge: 'sharp' });
      b.stick([s * 0.3, 0.8, 0.15], [s * 2.0, 0.12, -0.25], 0.045, '#d8b07a', { name: nm, pivot: [s * 0.66, 0.72, 0.05] });
      b.box([0.03, 0.05, 0.4], [s * 2.05, 0.1, -0.27], { color: '#d8b07a', rot: [0, 0, s * -22], parent: nm, edge: 'sharp', round: 0.4 });
    });
    return b
      .socket('seat', [0, 0.7, -0.75], 'seat')
      .act({
        click: [
          A.par(A.pose('oarL', { rot: [0, 30, 0], dur: 0.5 }), A.pose('oarR', { rot: [0, -30, 0], dur: 0.5 })),
          A.par(A.pose('oarL', { rot: [0, -25, 0], dur: 0.7 }), A.pose('oarR', { rot: [0, 25, 0], dur: 0.7 }), A.effect('water_spray', { dur: 1 }), A.say('Splash!', 1)),
          A.par(A.pose('oarL', { rot: [0, 0, 0], dur: 0.5 }), A.pose('oarR', { rot: [0, 0, 0], dur: 0.5 })),
        ],
      })
      .done();
  }),
  // A rowing machine (2.4 m long): an aluminium rail, a seat that slides, footplates with straps, a handle on a
  // chain to the fan flywheel, and a monitor on an arm. Click: one stroke, whoosh, the fan spins and the screen
  // lights.
  e('rowing machine', 'sports', 'gym', () => {
    const b = m('rowing machine', { view: 'side', edge: 'sharp' })
      .box([0.12, 0.06, 1.9], [0, 0.3, -0.35], { color: '#c9ccd1', round: 0.3 })
      .box([0.5, 0.06, 0.08], [0, 0.03, -1.25], { color: '#3a3633' })
      .stick([0, 0.06, -1.25], [0, 0.28, -1.25], 0.06, '#3a3633')
      .box([0.5, 0.06, 0.08], [0, 0.03, 0.85], { color: '#3a3633' })
      .cyl([0.6, 0.26, 0.6], [0, 0.42, 0.85], { color: '#2a2726', rot: [0, 0, 90] })
      .cyl([0.4, 0.02, 0.4], [0.135, 0.42, 0.85], { color: '#5c6166', rot: [0, 0, 90], name: 'fan', pivot: [0.135, 0.42, 0.85], mover: { kind: 'spin', axis: 'x', amount: 900 } })
      .box([0.025, 0.36, 0.05], [0.15, 0.42, 0.85], { color: '#f0923b', parent: 'fan' })
      .box([0.025, 0.05, 0.36], [0.15, 0.42, 0.85], { color: '#f0923b', parent: 'fan' })
      .box([0.32, 0.07, 0.32], [0, 0.4, -0.25], { color: '#2a2726', round: 0.5, name: 'seat', mover: { kind: 'slide', axis: 'z', amount: -0.6 }, edge: 'soft' })
      .stick([-0.25, 0.62, 0.62], [0.25, 0.62, 0.62], 0.035, '#2a2726')
      .stick([0, 0.62, 0.64], [0, 0.48, 0.78], 0.012, '#5c6166')
      .rod([0, 0.55, 0.95], [0, 1.0, 0.78], 0.04, '#3a3633')
      .box([0.2, 0.14, 0.04], [0, 1.04, 0.76], { color: '#2a2726', round: 0.2, rot: [-20, 0, 0] })
      .box([0.16, 0.1, 0.01], [0, 1.04, 0.738], { color: '#7cff6a', rot: [-20, 0, 0], name: 'screen', mover: { kind: 'light' } });
    b.pair((s) => b.box([0.14, 0.03, 0.3], [s * 0.11, 0.38, 0.5], { color: '#3a3633', rot: [45, 0, 0], round: 0.2 }).box([0.15, 0.04, 0.06], [s * 0.11, 0.42, 0.52], { color: '#e0473b', rot: [45, 0, 0], round: 0.4 }));
    return b
      .socket('seat', [0, 0.44, -0.25], 'seat')
      .act({ click: [A.par(A.operate('fan', 'on'), A.operate('screen', 'on'), A.operate('seat', 'out'), A.say('Whoosh!', 1.5)), A.operate('seat', 'in'), A.operate('seat', 'out'), A.operate('seat', 'in'), A.par(A.operate('fan', 'off'), A.operate('screen', 'off'))] })
      .done();
  }),
  // Rubber as a material: a black roll of sheet rubber partly unrolled, a natural-latex block and a bouncy red
  // rubber ball. Click: the ball bounces.
  e('rubber (material)', 'workshop', 'materials', () =>
    m('rubber (material)')
      .cyl([0.14, 0.32, 0.14], [0, 0.07, -0.08], { color: '#2a2726', rot: [0, 0, 90] })
      .cyl([0.04, 0.33, 0.04], [0, 0.07, -0.08], { color: '#5c6166', rot: [0, 0, 90] })
      .box([0.32, 0.008, 0.26], [0, 0.004, 0.1], { color: '#2a2726', round: 0.1, edge: 'sharp' })
      .box([0.1, 0.06, 0.07], [-0.2, 0.03, 0.12], { color: '#e8c36a', round: 0.25 })
      .ball(0.07, [0.12, 0.043, 0.12], { color: '#e0473b', name: 'ball' })
      .act({ click: [A.pose('ball', { move: [0, 0.25, 0], dur: 0.3 }), A.pose('ball', { move: [0, 0, 0], dur: 0.25 }), A.pose('ball', { move: [0, 0.12, 0], dur: 0.2 }), A.par(A.pose('ball', { move: [0, 0, 0], dur: 0.2 }), A.say('Boing!', 1))] })
      .done(),
  ),
  // A rubber-band ball (6 cm) of many colours and a few loose bands on the desk. Click: one band stretches and
  // snaps back, twang!
  e('rubber band', 'study', 'office supplies', () => {
    const b = m('rubber band').ball(0.06, [0, 0.03, 0], { color: '#c99a5a' });
    const cs = ['#e0473b', '#4e8fd6', '#5aa553', '#f6d24a', '#c99a5a', '#d64fa0'];
    b.each(8, (i) => b.torus([0.063, 0.063, 0.006], [0, 0.03, 0], { color: cs[i % 6], rot: [i * 23, i * 47, i * 31], tube: 0.08, noInk: true }));
    b.torus([0.07, 0.05, 0.004], [0.08, 0.002, 0.03], { color: '#e0473b', rot: [90, 0, 20], tube: 0.08, name: 'band' })
      .torus([0.06, 0.045, 0.004], [-0.07, 0.002, 0.05], { color: '#4e8fd6', rot: [90, 0, -30], tube: 0.08 });
    return b.act({ click: [A.pose('band', { scale: 1.6, dur: 0.4 }), A.par(A.pose('band', { scale: 1, dur: 0.1 }), A.say('Twang!', 1))] }).done();
  }),
  // A wooden rubber-band gun (30 cm) with a clothes-peg trigger at the back and a band stretched to the muzzle.
  // Click: twang, the band flies off; then a new one is loaded.
  e('rubber band gun', 'toys', 'toy guns', () =>
    m('rubber band gun', { view: 'side', edge: 'sharp' })
      .box([0.025, 0.03, 0.3], [0, 0.14, 0.05], { color: '#d8b07a', round: 0.2 })
      .box([0.028, 0.12, 0.05], [0, 0.075, -0.075], { color: '#b5814e', round: 0.3, rot: [15, 0, 0] })
      .arc([0.05, 0.05, 0.01], [0, 0.11, -0.03], { color: '#b5814e', rot: [0, 90, 180], tube: 0.25 })
      .box([0.008, 0.035, 0.008], [0, 0.105, -0.035], { color: '#7a5230', rot: [-15, 0, 0] })
      .box([0.022, 0.035, 0.05], [0, 0.17, -0.07], { color: '#c9a46a', round: 0.2 })
      .box([0.004, 0.035, 0.05], [0.012, 0.17, -0.07], { color: '#9da3a8' })
      .box([0.02, 0.02, 0.01], [0, 0.165, 0.2], { color: '#b5814e' })
      .stick([0, 0.165, 0.2], [0.008, 0.17, -0.07], 0.006, '#e0473b', { name: 'band' })
      .stick([0, 0.165, 0.2], [-0.008, 0.17, -0.07], 0.006, '#e0473b', { parent: 'band' })
      .act({ click: [A.par(A.pose('band', { move: [0, 0.05, 1.2], scale: 0.3, dur: 0.3 }), A.say('Twang!', 1)), A.pose('band', { scale: 0, dur: 0 }), A.pose('band', { move: [0, 0, 0], dur: 0 }), A.wait(0.5), A.pose('band', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // A rubber chicken (50 cm), the joke-shop classic: a long plucked yellow body, droopy wings, a gangly neck with
  // a red comb and an open orange beak, skinny legs. Click: squeeze, SQUAWK!
  e('rubber chicken', 'toys', 'joke toys', () => {
    const y = '#f3d23a';
    const b = m('rubber chicken')
      .ball([0.13, 0.22, 0.11], [0, 0.22, 0], { color: y, name: 'body' })
      .rod([0, 0.3, 0.01], [0.02, 0.43, 0.05], 0.035, y, { parent: 'body' })
      .ball([0.055, 0.06, 0.075], [0.025, 0.45, 0.07], { color: y, parent: 'body' })
      .box([0.012, 0.045, 0.05], [0.025, 0.495, 0.065], { color: '#e0473b', round: 0.6, parent: 'body' })
      .cone([0.025, 0.06, 0.02], [0.025, 0.45, 0.13], { color: '#f0923b', rot: [80, 0, 0], parent: 'body' })
      .cone([0.022, 0.05, 0.016], [0.025, 0.43, 0.12], { color: '#f0923b', rot: [115, 0, 0], parent: 'body' })
      .ball([0.02, 0.03, 0.015], [0.025, 0.415, 0.09], { color: '#e0473b', parent: 'body' });
    b.pair((s) => {
      b.ball([0.014, 0.014, 0.008], [0.025 + s * 0.022, 0.465, 0.095], { color: 'black', eye: true, parent: 'body' });
      b.ball([0.035, 0.1, 0.05], [s * 0.07, 0.2, 0.0], { color: y, rot: [10, 0, s * -18], parent: 'body' });
      b.stick([s * 0.03, 0.12, 0], [s * 0.04, 0.0, 0.01], 0.01, '#f0923b');
      b.box([0.045, 0.006, 0.05], [s * 0.04, 0.003, 0.025], { color: '#f0923b', round: 0.3 });
    });
    return b.act({ click: [A.pose('body', { scale: 0.82, dur: 0.15 }), A.par(A.pose('body', { scale: 1, dur: 0.3 }), A.anim('shake'), A.say('SQUAWK!', 1.5))] }).done();
  }),
  // A yellow rubber duck (10 cm): round body with an upturned tail, a big head, an orange bill and dot eyes,
  // bobbing on a little puddle of bath water. Click: squeak!
  e('rubber duck', 'toys', 'bath toys', () => {
    const y = '#f6d24a';
    const b = m('rubber duck')
      .cyl([0.16, 0.004, 0.14], [0, 0.002, 0], { color: '#9fd0ea', noInk: true })
      .ball([0.09, 0.062, 0.105], [0, 0.034, -0.005], { color: y, name: 'duck' })
      .cone([0.04, 0.035, 0.03], [0, 0.058, -0.062], { color: y, rot: [-55, 0, 0], parent: 'duck' })
      .ball(0.062, [0, 0.087, 0.02], { color: y, parent: 'duck' })
      .ball([0.042, 0.012, 0.035], [0, 0.083, 0.058], { color: '#f0923b', parent: 'duck' })
      .ball([0.036, 0.008, 0.028], [0, 0.075, 0.055], { color: '#e07a2a', parent: 'duck' });
    b.pair((s) => b.ball(0.012, [s * 0.018, 0.098, 0.044], { color: 'black', eye: true, parent: 'duck' }).ball([0.024, 0.035, 0.05], [s * 0.041, 0.042, -0.008], { color: '#efc23a', parent: 'duck' }));
    return b.act({ click: [A.pose('duck', { scale: 0.88, dur: 0.12 }), A.par(A.pose('duck', { scale: 1, dur: 0.2 }), A.anim('hop'), A.say('Squeak!', 1))] }).done();
  }),
  // A pair of yellow washing-up gloves (30 cm): one standing on its cuff with the fingers up, one lying flat,
  // both with a rolled cuff and a grippy palm. Click: the standing glove waves its fingers, squeak squeak.
  e('rubber gloves', 'home', 'cleaning', () => {
    const y = '#f6d24a';
    const glove = (x: number, nm: string, lying: boolean) => {
      const P = (v: V): V => (lying ? [x + v[0], 0.022, v[1] - 0.12] : [x + v[0], v[1], v[2]]);
      const rot: V = lying ? [-90, 0, 0] : [0, 0, 0];
      b.cyl([0.1, 0.13, 0.05], P([0, 0.065, 0]), { color: y, taper: 0.85, rot, name: nm, pivot: P([0, 0.0, 0]) });
      b.torus([0.105, 0.06, 0.02], P([0, 0.01, 0]), { color: shade(y, 0.9), rot: lying ? [0, 0, 0] : [90, 0, 0], tube: 0.25, parent: nm });
      b.box([0.088, 0.09, 0.036], P([0, 0.17, 0]), { color: y, round: 0.6, rot, parent: nm });
      b.each(4, (i) => b.capsule([0.019, 0.075 - Math.abs(i - 1.5) * 0.012, 0.019], P([-0.03 + i * 0.02, 0.245 - Math.abs(i - 1.5) * 0.008, 0]), { color: y, rot, parent: nm }));
      b.rod(P([-0.04, 0.15, 0]), P([-0.07, 0.2, 0]), 0.022, y, { parent: nm });
    };
    const b = m('rubber gloves');
    glove(0.06, 'glove', false);
    glove(-0.08, 'glove2', true);
    return b.act({ click: [A.pose('glove', { rot: [0, 0, 18], dur: 0.25 }), A.pose('glove', { rot: [0, 0, -18], dur: 0.3 }), A.par(A.pose('glove', { rot: [0, 0, 0], dur: 0.25 }), A.say('Squeak squeak!', 1.2))] }).done();
  }),
  // A wooden rubber stamp with a red knob, standing on its ink pad beside a sheet of paper. Click: it stamps the
  // paper, APPROVED; click again for a fresh sheet.
  e('rubber stamp', 'study', 'office supplies', () =>
    m('rubber stamp', { edge: 'sharp' })
      .box([0.08, 0.014, 0.06], [-0.05, 0.007, 0], { color: '#3a3633', round: 0.2 })
      .box([0.07, 0.004, 0.05], [-0.05, 0.016, 0], { color: '#a3222a', noInk: true })
      .box([0.06, 0.03, 0.04], [-0.05, 0.038, 0], { color: '#b5814e', round: 0.1, name: 'stamp' })
      .box([0.058, 0.006, 0.038], [-0.05, 0.02, 0], { color: '#a3222a', round: 0.1, parent: 'stamp' })
      .cyl([0.018, 0.04, 0.018], [-0.05, 0.073, 0], { color: '#7a5230', parent: 'stamp' })
      .ball(0.036, [-0.05, 0.105, 0], { color: '#d8312a', parent: 'stamp', edge: 'soft' })
      .box([0.12, 0.002, 0.16], [0.08, 0.001, 0.02], { color: '#faf6ea' })
      .label('APPROVED', [0.055, 0.035], [0.08, 0.0025, 0.0], { color: '#faf6ea', rot: [-90, 0, 0], depth: 0.001, name: 'mark', scale: 0 })
      .act({
        click: [
          [A.pose('stamp', { move: [0.065, 0.03, 0], dur: 0.35 }), A.pose('stamp', { move: [0.13, 0.0, 0], dur: 0.3 }), A.par(A.pose('mark', { scale: 1, dur: 0.1 }), A.say('Thunk!', 1)), A.pose('stamp', { move: [0, 0, 0], dur: 0.5 })],
          [A.pose('mark', { scale: 0, dur: 0.2 }), A.say('Next!', 1)],
        ],
      })
      .done(),
  ),
  // A heap of rubble (0.6 m high, 1.6 m across): broken concrete slabs, bricks, a lump of wall with rebar
  // sticking out, and dust. Click: a chunk tumbles off in a puff of dust; click again and it is back.
  e('rubble', 'workshop', 'debris', () => {
    const b = m('rubble', { edge: 'sharp' }).ball([1.6, 0.35, 1.3], [0, 0.1, 0], { color: '#9a958c', edge: 'soft' });
    for (const [xx, y, z, w, c, r] of [[0, 0.3, 0, 0.55, '#c4c2b8', 10], [0.4, 0.2, 0.2, 0.4, '#a7a7a0', 35], [-0.4, 0.2, 0.15, 0.42, '#b8b5ac', -20], [0.1, 0.48, -0.1, 0.36, '#a7a7a0', 50], [-0.25, 0.14, 0.45, 0.22, '#b5543c', 15], [0.35, 0.12, -0.35, 0.24, '#b5543c', -30], [-0.3, 0.42, -0.2, 0.32, '#c4c2b8', 65], [0.55, 0.1, -0.05, 0.2, '#b5543c', 80]] as Array<[number, number, number, number, string, number]>)
      b.box([w, w * 0.45, w * 0.75], [xx, y, z], { color: c, round: 0.08, rot: [r, r * 1.5, r * 0.5] });
    b.rod([0.05, 0.45, 0.0], [0.35, 0.8, 0.1], 0.025, '#8a4a2a').rod([0.0, 0.4, 0.1], [-0.2, 0.75, 0.25], 0.025, '#8a4a2a').rod([0.15, 0.5, -0.1], [0.25, 0.85, -0.25], 0.022, '#8a4a2a');
    b.box([0.24, 0.12, 0.18], [0.12, 0.72, 0.05], { color: '#c4c2b8', round: 0.1, rot: [20, 30, 10], name: 'chunk', piece: true });
    return b.act({ click: [[A.pose('chunk', { move: [0.45, -0.55, 0.35], rot: [80, 0, 60], dur: 0.6 }), A.effect('dust', { dur: 1.5 })], [A.pose('chunk', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A cut ruby (4 cm) standing in a little silver claw pedestal: a faceted crimson crown and pavilion. Click: it
  // turns and glows from inside.
  e('ruby', 'nature', 'gems', () => {
    const r = '#d0103a', s = 0.045;
    const b = m('ruby', { edge: 'sharp' })
      .cyl([0.04, 0.01, 0.04], [0, 0.005, 0], { color: '#c9ccd1' })
      .cyl([0.012, 0.025, 0.012], [0, 0.022, 0], { color: '#c9ccd1' })
      .cone([s, s * 0.55, s], [0, 0.035 + s * 0.275, 0], { color: r, rot: [180, 0, 0], segs: 8, name: 'gem', mover: { kind: 'light' } })
      .cyl([s, s * 0.24, s], [0, 0.035 + s * 0.67, 0], { color: '#e0204a', taper: 0.62, segs: 8, parent: 'gem' })
      .ball([s * 0.3, s * 0.08, s * 0.3], [-0.006, 0.035 + s * 0.79, 0.006], { color: '#ffb0c0', noInk: true, parent: 'gem' });
    b.each(4, (i) => b.stick([Math.cos(i * 1.571) * 0.006, 0.03, Math.sin(i * 1.571) * 0.006], [Math.cos(i * 1.571) * 0.02, 0.06, Math.sin(i * 1.571) * 0.02], 0.003, '#c9ccd1'));
    return b.act({ click: [A.par(A.operate('gem', 'on'), A.pose('gem', { rot: [0, 360, 0], dur: 1.2 }), A.effect('sparkle', { dur: 1.5 })), A.pose('gem', { rot: [0, 0, 0], dur: 0 }), A.operate('gem', 'off')] }).done();
  }),
  // A boat's rudder hung on the stern post (2.4 m): a broad tapering blade on its stock, bronze hinges (pintles
  // and gudgeons) and the tiller on top. Click: the rudder swings across in a spray of water, and back.
  e('rudder', 'garage', 'boat parts', () =>
    m('rudder', { edge: 'sharp' })
      .box([0.8, 0.12, 0.8], [-0.15, 0.06, 0], { color: '#7a5230' })
      .box([0.24, 2.3, 0.24], [-0.15, 1.25, 0], { color: '#7a5230', round: 0.1 })
      .box([0.12, 1.4, 0.7], [-0.15, 1.5, -0.45], { color: '#f7f5ef', round: 0.1 })
      .box([0.8, 1.5, 0.12], [0.34, 0.95, 0], { color: '#a3322a', round: 0.3, name: 'rudder', pivot: [0.0, 0.95, 0], mover: { kind: 'swing', axis: 'y', amount: 35 } })
      .box([0.5, 0.4, 0.13], [0.48, 0.32, 0], { color: '#a3322a', round: 0.4, parent: 'rudder' })
      .stick([0.0, 0.2, 0], [0.0, 2.45, 0], 0.1, '#5c6166', { parent: 'rudder' })
      .rod([0.0, 2.4, 0], [0.95, 2.45, 0.0], 0.07, '#b5814e', { parent: 'rudder' })
      .box([0.2, 0.08, 0.18], [-0.06, 0.4, 0], { color: '#b0804a' })
      .box([0.2, 0.08, 0.18], [-0.06, 1.0, 0], { color: '#b0804a' })
      .box([0.2, 0.08, 0.18], [-0.06, 1.6, 0], { color: '#b0804a' })
      .act({ click: [A.operate('rudder'), A.par(A.effect('water_spray', { dur: 1 }), A.say('Creak!', 1))] })
      .done(),
  ),
  // A Persian rug (2 m x 3 m) with a fringe, laid on the floor with its far end still rolled: a red field, gold
  // border, a navy medallion. Click: it gets a good beating, dust flying.
  e('rug', 'home', 'decor', () => {
    const b = m('rug')
      .box([2.0, 0.015, 2.6], [0, 0.0075, 0.15], { color: '#8a2230', round: 0.1, edge: 'sharp' })
      .cyl([0.2, 2.0, 0.2], [0, 0.1, -1.2], { color: '#8a2230', rot: [0, 0, 90], name: 'roll' })
      .torus([0.2, 0.2, 2.0], [0, 0.1, -1.2], { color: '#c99a3a', rot: [0, 90, 0], tube: 0.05, noInk: true, parent: 'roll' })
      .box([1.8, 0.004, 2.3], [0, 0.017, 0.2], { color: '#c99a3a', noInk: true })
      .box([1.6, 0.006, 2.1], [0, 0.019, 0.2], { color: '#8a2230', noInk: true })
      .ball([0.9, 0.01, 1.2], [0, 0.022, 0.2], { color: '#2f3d6a', noInk: true })
      .ball([0.45, 0.012, 0.6], [0, 0.026, 0.2], { color: '#c99a3a', noInk: true });
    b.pair((s) => b.each(4, (i) => b.ball([0.12, 0.008, 0.12], [s * (0.55 - i * 0.04), 0.022, 0.2 + (i - 1.5) * 0.45], { color: '#f2e6cf', noInk: true })));
    b.each(20, (i) => b.box([0.03, 0.006, 0.1], [-0.95 + i * 0.1, 0.003, 1.5], { color: '#fff3d6', noInk: true }));
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('dust', { dur: 2 }), A.say('Whap! Whap!', 1.5))] }).done();
  }),
  // A rugby ball (28 cm) on a kicking tee: the pointed oval in panels with white stitched seams and a stripe.
  // Click: it is kicked high, end over end, and comes back to the tee.
  e('rugby ball', 'sports', 'balls', () =>
    m('rugby ball')
      .cyl([0.12, 0.06, 0.12], [0, 0.03, 0], { color: '#f0923b', taper: 0.5 })
      .ball([0.19, 0.29, 0.19], [0, 0.2, 0], { color: '#9a5a30', name: 'ball' })
      .torus([0.195, 0.29, 0.006], [0, 0.2, 0], { color: '#6a3a1a', rot: [0, 90, 0], tube: 0.03, parent: 'ball', noInk: true })
      .torus([0.195, 0.29, 0.006], [0, 0.2, 0], { color: '#6a3a1a', rot: [0, 0, 0], tube: 0.03, parent: 'ball', noInk: true })
      .torus([0.2, 0.2, 0.02], [0, 0.2, 0], { color: 'white', rot: [90, 0, 0], tube: 0.1, parent: 'ball' })
      .box([0.012, 0.09, 0.012], [0.02, 0.22, 0.094], { color: 'white', parent: 'ball' })
      .box([0.035, 0.008, 0.012], [0.02, 0.19, 0.096], { color: 'white', parent: 'ball' })
      .box([0.035, 0.008, 0.012], [0.02, 0.22, 0.097], { color: 'white', parent: 'ball' })
      .box([0.035, 0.008, 0.012], [0.02, 0.25, 0.096], { color: 'white', parent: 'ball' })
      .act({ click: [A.par(A.pose('ball', { move: [0, 2.2, -1.5], rot: [540, 0, 0], dur: 0.9 }), A.say('Thwump!', 1)), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })] })
      .done(),
  ),
  // An ancient temple ruin (12 m x 8 m, columns 6 m): a stepped stone platform, fluted columns standing at
  // different heights, a fragment of architrave, a wall with an arched window, fallen drums, grass and ivy.
  // Click: a loose capital topples in a cloud of dust; click again and it is back.
  e('ruin', 'places', 'ruins', () => {
    const st = '#e2d6b8', st2 = '#cfc2a2';
    const b = m('ruin', { edge: 'sharp' })
      .box([13, 0.2, 9], [0, 0.1, 0], { color: '#6ab04c', round: 0.05 })
      .box([12, 0.3, 8], [0, 0.35, 0], { color: st2, round: 0.05 })
      .box([11.2, 0.3, 7.2], [0, 0.65, 0], { color: st, round: 0.05 })
      .box([10.4, 0.3, 6.4], [0, 0.95, 0], { color: st2, round: 0.05 });
    const hs = [6, 6, 2.4, 4.2, 1.1, 5.4];
    hs.forEach((h, i) => {
      const xx = -4.5 + i * 1.8, y0 = 1.1;
      b.box([1.05, 0.3, 1.05], [xx, y0 + 0.15, 2.4], { color: st, round: 0.08 });
      b.prism([0.82, h, 0.82], [xx, y0 + 0.3 + h / 2, 2.4], 12, { color: i % 2 ? st : '#e8dcc0' });
      if (h >= 5.9) b.box([1.1, 0.4, 1.1], [xx, y0 + 0.3 + h + 0.2, 2.4], { color: st, round: 0.08 });
      else b.prism([0.86, 0.12, 0.86], [xx, y0 + 0.3 + h + 0.03, 2.4], 7, { color: st2, rot: [8, 0, 5] });
    });
    b.box([2.9, 0.75, 1.1], [-3.6, 8.15, 2.4], { color: st, round: 0.05 })
      .box([5.2, 4.4, 0.9], [1.5, 3.3, -2.4], { color: st2, round: 0.03 })
      .box([1.6, 2.2, 0.92], [1.5, 3.0, -2.4], { color: '#5a5040', round: 0.05 })
      .arc([1.6, 1.6, 0.92], [1.5, 4.1, -2.4], { color: '#5a5040', tube: 0.98 })
      .box([1.8, 1.4, 0.9], [4.5, 1.8, -2.4], { color: st2, round: 0.05 })
      .cyl([0.82, 1.1, 0.82], [3.8, 1.6, 0.6], { color: st, rot: [0, 0, 90] })
      .cyl([0.82, 0.9, 0.82], [5.2, 0.6, 3.6], { color: st, rot: [0, 30, 90] })
      .box([1.1, 0.4, 1.1], [-5.6, 0.4, 3.9], { color: st, rot: [0, 25, 12], round: 0.08 });
    b.each(4, (i) => b.rod([-4.5 + 0.38, 1.4 + i * 1.2, 2.55], [-4.5 + 0.3, 2.0 + i * 1.2, 2.75], 0.08, '#3f7a3a'));
    b.each(6, (i) => b.ball([0.6, 0.3, 0.5], [-5.5 + i * 2.2, 0.25, 4.1 - (i % 2) * 8.2], { color: '#5aa553', edge: 'soft' }));
    b.box([1.1, 0.4, 1.1], [0.9, 5.85, 2.4], { color: st, round: 0.08, name: 'block', rot: [0, 0, 6] });
    return b.act({ click: [[A.pose('block', { move: [1.2, -4.3, 1.3], rot: [30, 40, 85], dur: 0.8 }), A.par(A.effect('dust', { dur: 2 }), A.say('Crumble...', 1.5))], [A.pose('block', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A 30 cm wooden ruler standing in a pencil pot with two pencils: printed centimetre marks and numbers. Click:
  // it lifts out and twangs.
  e('ruler', 'study', 'stationery', () => {
    const b = m('ruler', { edge: 'sharp' })
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: '#3f6fb5' })
      .cyl([0.07, 0.005, 0.07], [0, 0.098, 0], { color: '#2a2726', noInk: true })
      .box([0.032, 0.3, 0.004], [0, 0.2, 0.0], { color: '#e2c08a', round: 0.1, name: 'ruler', pivot: [0, 0.06, 0] });
    b.each(15, (i) => b.box([i % 5 === 0 ? 0.012 : 0.007, 0.0015, 0.001], [-0.0105 + (i % 5 === 0 ? 0 : -0.0025), 0.11 + i * 0.0125, 0.0025], { color: '#2a2726', noInk: true, parent: 'ruler' }));
    b.label('cm', [0.012, 0.01], [0.008, 0.33, 0.0025], { color: '#e2c08a', depth: 0.001, parent: 'ruler' });
    b.stick([0.02, 0.05, -0.015], [0.03, 0.24, -0.02], 0.008, '#f6d24a').cone([0.008, 0.015, 0.008], [0.0305, 0.247, -0.02], { color: '#f2dfb0', rot: [0, 0, -3] });
    b.stick([-0.02, 0.05, 0.012], [-0.03, 0.22, 0.018], 0.008, '#e0473b').cyl([0.009, 0.012, 0.009], [-0.031, 0.226, 0.018], { color: '#f4a1c0' });
    return b.act({ click: [A.pose('ruler', { move: [0, 0.06, 0], dur: 0.3 }), A.pose('ruler', { rot: [0, 0, 8], dur: 0.08 }), A.pose('ruler', { rot: [0, 0, -6], dur: 0.08 }), A.pose('ruler', { rot: [0, 0, 4], dur: 0.08 }), A.par(A.pose('ruler', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.say('Twang!', 1))] }).done();
  }),
  // A stretch of airport runway (40 m of a 20 m wide strip): asphalt with grass either side, threshold stripes,
  // the painted runway number, a dashed centre line, edge lights and approach-path lights. Click: the lights come
  // on and an airliner rolls past.
  e('runway', 'places', 'airport', () => {
    const b = m('runway', { edge: 'sharp' })
      .box([32, 0.1, 40], [0, 0.05, 0], { color: '#6ab04c', round: 0.01 })
      .box([20, 0.12, 40], [0, 0.06, 0], { color: '#4a4c50', round: 0.01 });
    b.each(8, (i) => b.pair((s) => b.box([0.9, 0.01, 6], [s * (1.5 + i * 1.1), 0.125, 15.5], { color: 'white', noInk: true })));
    b.label('27', [5, 4], [0, 0.13, 9], { color: '#4a4c50', rot: [-90, 0, 0], depth: 0.005 });
    b.each(4, (i) => b.box([0.6, 0.01, 4], [0, 0.125, 3 - i * 8], { color: 'white', noInk: true }));
    b.pair((s) => b.box([0.4, 0.01, 40], [s * 9.6, 0.125, 0], { color: 'white', noInk: true }));
    b.pair((s) => b.each(5, (i) => b.cyl([0.26, 0.12, 0.26], [s * 10.6, 0.18, -18 + i * 9], { color: '#5c6166' }).dome([0.22, 0.12, 0.22], [s * 10.6, 0.3, -18 + i * 9], { color: '#ffe48a', name: `light${s > 0 ? 'L' : 'R'}${i}`, mover: { kind: 'light' } })));
    b.each(4, (i) => b.box([0.8, 0.26, 0.5], [-12.5 - i * 1.0, 0.23, 14], { color: '#3a3633' }).ball(0.2, [-12.5 - i * 1.0, 0.25, 14.26], { color: i < 2 ? '#ff3a2a' : 'white', glow: true }));
    return b
      .act({ click: [A.operate('light', 'on'), A.spawn('plane', 'airplane', { rel: 'left', of: 'self', dist: 'near' }), A.par(A.move('plane', { rel: 'right', of: 'self', dist: 'near' }, { speed: 'run' }), A.say('Cleared to land!', 2.5)), A.remove('plane', 'fade'), A.operate('light', 'off')] })
      .done();
  }),
  // A green rupee from the Zelda games (10 cm): an elongated six-sided gem with bevelled facets, floating over a
  // little pedestal. Click: it rises, spins and the item jingle plays.
  e('rupee (nintendo)', 'toys', 'video games', () =>
    m('rupee (nintendo)', { edge: 'sharp' })
      .cyl([0.06, 0.012, 0.06], [0, 0.006, 0], { color: '#5c6166' })
      .box([0.05, 0.05, 0.026], [0, 0.07, 0], { color: '#2fbf4a', round: 0.05, name: 'rupee' })
      .wedge([0.05, 0.03, 0.026], [0, 0.11, 0], { color: '#2fbf4a', parent: 'rupee' })
      .wedge([0.05, 0.03, 0.026], [0, 0.03, 0], { color: '#2fbf4a', rot: [0, 0, 180], parent: 'rupee' })
      .box([0.022, 0.05, 0.03], [0, 0.07, 0], { color: '#7ae88a', round: 0.05, parent: 'rupee' })
      .wedge([0.022, 0.016, 0.03], [0, 0.103, 0], { color: '#7ae88a', parent: 'rupee' })
      .wedge([0.022, 0.016, 0.03], [0, 0.037, 0], { color: '#7ae88a', rot: [0, 0, 180], parent: 'rupee' })
      .act({ click: [A.par(A.pose('rupee', { move: [0, 0.06, 0], rot: [0, 720, 0], dur: 1 }), A.effect('sparkle', { dur: 1.5 }), A.say('Da-da-da-daaa!', 2)), A.pose('rupee', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // Rust, shown on a length of old steel girder (40 cm): orange-brown scale, flakes and blisters, a seized nut
  // and bolt, and flakes on the ground. Click: it creaks and rust flakes off.
  e('rust', 'workshop', 'materials', () => {
    const b = m('rust', { edge: 'sharp' })
      .box([0.4, 0.012, 0.12], [0, 0.006, 0], { color: '#7a3a1a' })
      .box([0.4, 0.012, 0.12], [0, 0.114, 0], { color: '#8a4a22' })
      .box([0.4, 0.1, 0.012], [0, 0.06, 0], { color: '#8a4a22' })
      .prism([0.035, 0.02, 0.035], [0.1, 0.13, 0.03], 6, { color: '#a85020' })
      .cyl([0.016, 0.04, 0.016], [0.1, 0.12, 0.03], { color: '#7a3a1a' });
    b.each(10, (i) => b.ball([0.035 + (i % 3) * 0.01, 0.008, 0.03], [-0.17 + i * 0.037, 0.122, ((i * 37) % 9) * 0.01 - 0.04], { color: i % 2 ? '#c8642a' : '#a85020', noInk: true, rot: [0, i * 40, 0] }));
    b.each(6, (i) => b.ball([0.025, 0.03, 0.006], [-0.15 + i * 0.06, 0.06 + ((i * 13) % 5) * 0.008, 0.008], { color: i % 2 ? '#c8642a' : '#6a3010', noInk: true }));
    b.box([0.03, 0.004, 0.02], [0.08, 0.002, 0.1], { color: '#c8642a', rot: [0, 30, 0] }).box([0.02, 0.004, 0.02], [-0.1, 0.002, 0.09], { color: '#a85020' });
    return b.act({ click: [A.par(A.effect('dust', { dur: 1.5 }), A.anim('shake'), A.say('Creeak...', 1.5))] }).done();
  }),
  // A western saddle on a wooden saddle stand (1.1 m): a striped saddle blanket, the leather seat, horn and
  // cantle, fenders and swinging stirrups. A person can sit on it. Click: the stirrups swing and the leather
  // creaks.
  e('saddle', 'farm', 'horse tack', () => {
    const lt = '#8a5a35', dk = '#6a4228';
    const b = m('saddle')
      .box([0.16, 0.12, 0.95], [0, 0.66, 0], { color: '#9a6a3e', round: 0.2, edge: 'sharp' });
    b.each(2, (i) => b.pair((s) => b.stick([0, 0.62, (i ? 1 : -1) * 0.42], [s * 0.28, 0, (i ? 1 : -1) * 0.45], 0.06, '#7a5230', { edge: 'sharp' })));
    b.box([0.66, 0.04, 0.74], [0, 0.73, 0], { color: '#3f6fb5', round: 0.3, rot: [0, 0, 0] })
      .box([0.67, 0.042, 0.1], [0, 0.73, 0.2], { color: '#e0473b', noInk: true })
      .box([0.67, 0.042, 0.1], [0, 0.73, -0.2], { color: '#e0473b', noInk: true })
      .loft([0.42, 0.22, 0.62], [0, 0.8, 0], [[0, 0.9, 1, 0.1], [0.25, 1, 0.7, 0], [0.6, 0.85, 0.6, 0], [1, 0.6, 1, 0.12]], { color: lt, cut: 'bottom' })
      .ball([0.3, 0.06, 0.34], [0, 0.82, -0.02], { color: dk })
      .box([0.34, 0.14, 0.06], [0, 0.87, -0.27], { color: lt, round: 0.5, rot: [-15, 0, 0] })
      .cyl([0.05, 0.12, 0.05], [0, 0.9, 0.26], { color: lt })
      .cyl([0.1, 0.03, 0.1], [0, 0.97, 0.27], { color: dk });
    b.pair((s) => {
      const nm = s > 0 ? 'stirrupL' : 'stirrupR';
      b.box([0.04, 0.38, 0.4], [s * 0.24, 0.6, 0.02], { color: dk, round: 0.3, rot: [0, 0, s * 8] });
      b.stick([s * 0.27, 0.6, 0.05], [s * 0.29, 0.3, 0.05], 0.03, '#5a3a22', { name: nm, pivot: [s * 0.27, 0.62, 0.05] });
      b.box([0.05, 0.1, 0.14], [s * 0.29, 0.25, 0.05], { color: '#9a6a3e', round: 0.4, parent: nm, edge: 'sharp' });
    });
    return b
      .socket('seat', [0, 0.88, -0.02], 'seat')
      .act({ click: [A.par(A.pose('stirrupL', { rot: [25, 0, 0], dur: 0.4 }), A.pose('stirrupR', { rot: [-20, 0, 0], dur: 0.4 }), A.say('Creak!', 1)), A.par(A.pose('stirrupL', { rot: [-15, 0, 0], dur: 0.5 }), A.pose('stirrupR', { rot: [15, 0, 0], dur: 0.5 })), A.par(A.pose('stirrupL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('stirrupR', { rot: [0, 0, 0], dur: 0.4 }))] })
      .done();
  }),
  // A heavy steel safe (65 cm) built hollow: thick walls, a door with a combination dial and a handle, and inside,
  // gold bars and stacks of money. Click: the dial spins, click-click, and the door swings open; click again,
  // clunk, shut.
  e('safe', 'home', 'storage', () => {
    const c = '#3a4048';
    const b = m('safe', { edge: 'sharp' })
      .box([0.56, 0.6, 0.06], [0, 0.35, -0.22], { color: c, round: 0.1 })
      .box([0.56, 0.07, 0.5], [0, 0.085, 0], { color: c, round: 0.1 })
      .box([0.56, 0.07, 0.5], [0, 0.615, 0], { color: c, round: 0.1 })
      .box([0.46, 0.012, 0.42], [0, 0.38, -0.01], { color: '#5c6166' });
    b.pair((s) => b.box([0.07, 0.6, 0.5], [s * 0.245, 0.35, 0], { color: c, round: 0.1 }).box([0.08, 0.04, 0.08], [s * 0.2, 0.02, 0.18], { color: '#2a2726' }).box([0.08, 0.04, 0.08], [s * 0.2, 0.02, -0.18], { color: '#2a2726' }));
    b.each(3, (i) => b.box([0.12, 0.04, 0.06], [-0.12 + i * 0.12, 0.14, 0.0], { color: '#e2b23a', round: 0.2 }));
    b.box([0.12, 0.04, 0.06], [-0.06, 0.18, 0.0], { color: '#e2b23a', round: 0.2 }).box([0.12, 0.04, 0.06], [0.06, 0.18, 0.0], { color: '#e2b23a', round: 0.2 });
    b.each(3, (i) => b.box([0.12, 0.05, 0.07], [-0.12 + i * 0.12, 0.415, -0.02], { color: '#7cb87a', round: 0.1 }));
    b.box([0.5, 0.52, 0.06], [0, 0.35, 0.28], { color: '#4a525c', round: 0.1, name: 'door', pivot: [-0.25, 0.35, 0.28], mover: { kind: 'swing', axis: 'y', amount: -105 } })
      .cyl([0.15, 0.03, 0.15], [0.02, 0.4, 0.32], { color: '#c9ccd1', rot: [90, 0, 0], parent: 'door' })
      .cyl([0.08, 0.04, 0.08], [0.02, 0.4, 0.34], { color: '#2a2726', rot: [90, 0, 0], parent: 'door', name: 'dial' })
      .box([0.01, 0.03, 0.01], [0.02, 0.43, 0.36], { color: 'white', parent: 'dial' })
      .stick([0.15, 0.25, 0.31], [0.15, 0.25, 0.36], 0.02, '#c9ccd1', { parent: 'door' })
      .box([0.14, 0.025, 0.025], [0.15, 0.25, 0.365], { color: '#c9ccd1', parent: 'door' })
      .label('STRONG', [0.18, 0.05], [0, 0.56, 0.315], { color: '#4a525c', depth: 0.005, parent: 'door' });
    return b
      .socket('inside', [0, 0.45, 0], 'inside', { size: 0.3 })
      .act({
        click: [
          [A.pose('dial', { rot: [0, 0, 300], dur: 0.6 }), A.pose('dial', { rot: [0, 0, 120], dur: 0.4 }), A.par(A.pose('dial', { rot: [0, 0, 0], dur: 0.3 }), A.say('Click... click...', 1.5)), A.operate('door', 'open'), A.effect('sparkle', { dur: 1.2 })],
          [A.operate('door', 'close'), A.say('Clunk!', 1)],
        ],
      })
      .done();
  }),
  // A traffic cone (70 cm): a square black rubber base, a bright orange cone with two reflective white bands.
  // Click: it is knocked over, bonk; click again and it is stood back up.
  e('safety cone', 'workshop', 'road works', () =>
    m('safety cone')
      .box([0.4, 0.04, 0.4], [0, 0.02, 0], { color: '#2a2726', round: 0.25, name: 'cone', pivot: [0.2, 0.0, 0], edge: 'sharp' })
      .cyl([0.32, 0.66, 0.32], [0, 0.37, 0], { color: '#f0782a', taper: 0.14, parent: 'cone' })
      .cyl([0.25, 0.09, 0.25], [0, 0.4, 0], { color: '#f7f5ef', taper: 0.75, parent: 'cone' })
      .cyl([0.17, 0.07, 0.17], [0, 0.56, 0], { color: '#f7f5ef', taper: 0.72, parent: 'cone' })
      .act({ click: [[A.par(A.pose('cone', { rot: [0, 0, -88], dur: 0.4 }), A.say('Bonk!', 1))], [A.pose('cone', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A safety pin (5.5 cm, real size): the coiled spring at the foot, the pin and the shield clasp at the top.
  // Click: the pin springs open; click again, it closes.
  e('safety pin', 'wardrobe', 'sewing', () =>
    m('safety pin', { edge: 'sharp' })
      .torus([0.016, 0.016, 0.005], [0, 0.008, 0], { color: '#c9ccd1', tube: 0.3 })
      .stick([-0.006, 0.012, 0], [-0.006, 0.068, 0], 0.0035, '#c9ccd1')
      .box([0.016, 0.016, 0.009], [-0.002, 0.074, 0], { color: '#c9ccd1', round: 0.4 })
      .stick([0.006, 0.012, 0], [0.003, 0.07, 0.002], 0.003, '#c9ccd1', { name: 'pin', pivot: [0.005, 0.01, 0], mover: { kind: 'swing', axis: 'z', amount: -30 } })
      .cone([0.003, 0.006, 0.003], [0.003, 0.073, 0.002], { color: '#c9ccd1', parent: 'pin' })
      .act({ click: [A.operate('pin'), A.say('Click!', 1)] })
      .done(),
  ),
  // A hi-vis safety vest on a hanger stand (1.7 m): fluorescent yellow with a V-neck and zip, two silver
  // reflective bands round the body and two over the shoulders. Click: the bands catch the light and flash.
  e('safety vest', 'wardrobe', 'workwear', () => {
    const y = '#d8f03a';
    const b = m('safety vest')
      .cyl([0.4, 0.03, 0.4], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.03, -0.06], [0, 1.68, -0.06], 0.035, '#3a3633', { edge: 'sharp' })
      .rod([-0.2, 1.56, -0.03], [0.2, 1.56, -0.03], 0.02, 'wood', { edge: 'sharp' })
      .cyl([0.52, 0.66, 0.24], [0, 1.2, 0], { color: y, taper: 0.92, name: 'vest' })
      .wedge([0.18, 0.22, 0.03], [0, 1.43, 0.11], { color: '#3a3f45', rot: [0, 0, 180], parent: 'vest' })
      .box([0.012, 0.42, 0.01], [0, 1.1, 0.122], { color: '#9da3a8', parent: 'vest', noInk: true });
    b.each(2, (i) => b.box([0.535, 0.05, 0.25], [0, 0.98 + i * 0.13, 0], { color: '#dfe3e8', round: 0.3, name: `band${i}`, mover: { kind: 'light' }, parent: 'vest' }));
    b.pair((s) => {
      b.box([0.05, 0.62, 0.25], [s * 0.15, 1.2, 0.0], { color: '#dfe3e8', round: 0.3, name: s > 0 ? 'bandL' : 'bandR', mover: { kind: 'light' }, parent: 'vest' });
      b.box([0.12, 0.08, 0.2], [s * 0.15, 1.54, 0], { color: y, round: 0.5, parent: 'vest' });
    });
    return b.act({ click: [A.operate('band', 'on'), A.say('Flash!', 1.2), A.wait(1.2), A.operate('band', 'off')] }).done();
  }),
  // A big square sail (8 m x 6 m) on its yard and mast, stepped in a piece of a ship's wooden deck: canvas cloths
  // with reef bands, a red stripe, rigging lines. Click: the wind fills it and it bellies out; click again, slack.
  e('sail', 'garage', 'boat parts', () => {
    const b = m('sail')
      .box([4, 0.4, 3], [0, 0.2, 0], { color: '#9a6a3e', round: 0.05, edge: 'sharp' })
      .stick([0, 0.4, 0], [0, 10.4, 0], 0.32, '#7a5230')
      .stick([-4.2, 9.4, 0.25], [4.2, 9.4, 0.25], 0.2, '#7a5230')
      .stick([-3.6, 2.6, 0.25], [3.6, 2.6, 0.25], 0.14, '#7a5230')
      .box([7.6, 6.6, 0.12], [0, 6.0, 0.35], { color: '#efe3c4', round: 0.4, name: 'sail', pivot: [0, 9.4, 0.3], edge: 'soft' })
      .box([7.62, 0.7, 0.13], [0, 5.6, 0.35], { color: '#c8302a', round: 0.2, parent: 'sail', noInk: true });
    b.each(3, (i) => b.box([7.62, 0.05, 0.13], [0, 8.4 - i * 0.6, 0.35], { color: '#c9b892', parent: 'sail', noInk: true }));
    b.pair((s) => b.stick([s * 4.1, 9.4, 0.25], [s * 1.9, 0.4, 1.4], 0.04, '#5a3a22').stick([s * 3.6, 2.6, 0.25], [s * 1.9, 0.4, 1.0], 0.04, '#5a3a22'));
    b.box([0.4, 0.5, 0.4], [0, 10.5, 0], { color: '#7a5230', edge: 'sharp' });
    return b.act({ click: [[A.par(A.pose('sail', { rot: [-12, 0, 0], scale: 1.04, dur: 0.6 }), A.say('Whoosh!', 1.5))], [A.pose('sail', { rot: [0, 0, 0], scale: 1, dur: 0.6 }), A.say('Flap... flap.', 1.2)]] }).done();
  }),
  // A cruising sailboat (9 m hull, mast 12 m above the deck): a lofted white hull with a navy stripe and teak
  // deck, a cabin with portholes, a cockpit wheel, mainsail on a boom that swings, a blue jib, stays and a
  // pulpit. Click: the boom swings across in a gust; click again, back.
  e('sailboat', 'garage', 'boats', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.75, 0.75, 0.04], [0.3, 1, 1, 0], [0.7, 0.92, 0.98, 0], [1, 0.05, 0.9, 0.06]];
    const b = m('sailboat', { view: 'side' })
      .loft([3.0, 2.6, 9], [0, 1.3, 0], prof, { color: '#f7f5ef', cut: 'bottom', boxy: 0.35 })
      .loft([3.02, 0.5, 9.02], [0, 1.15, 0], prof, { color: '#2f4f8f', cut: 'bottom', boxy: 0.35, edge: 'sharp' })
      .loft([2.7, 2.64, 8.6], [0, 1.32, -0.1], prof, { color: '#c9a36a', cut: 'bottom', boxy: 0.35, edge: 'sharp' })
      .box([1.8, 0.6, 3.0], [0, 1.6, 0.4], { color: '#f7f5ef', round: 0.3, edge: 'sharp' })
      .box([1.6, 0.06, 2.6], [0, 1.92, 0.4], { color: '#c9a36a', edge: 'sharp' })
      .box([1.6, 0.6, 1.8], [0, 1.0, -2.8], { color: '#a68a5a', edge: 'sharp' })
      .torus([0.8, 0.8, 0.05], [0, 1.85, -3.0], { color: '#c9ccd1', tube: 0.08, edge: 'sharp' })
      .stick([0, 1.3, -3.0], [0, 1.85, -3.0], 0.08, '#c9ccd1')
      .stick([0, 1.9, 1.3], [0, 13.2, 1.3], 0.16, '#c9ccd1')
      .stick([0, 1.35, 4.35], [0, 12.9, 1.32], 0.025, '#5c6166')
      .stick([0, 1.35, -4.3], [0, 12.9, 1.28], 0.025, '#5c6166')
      .stick([0, 2.4, 1.3], [0, 2.4, -3.5], 0.12, '#c9ccd1', { name: 'boom', pivot: [0, 2.4, 1.3], mover: { kind: 'swing', axis: 'y', amount: 38 } })
      .wedge([4.6, 10.4, 0.04], [0, 7.6, -1.0], { color: 'white', rot: [0, -90, 0], apex: 0.5, parent: 'boom', edge: 'sharp' })
      .box([0.02, 0.05, 3.0], [0, 6.0, -0.4], { color: '#d4d7da', parent: 'boom', noInk: true })
      .label('GBR 42', [1.2, 0.5], [0.03, 9.0, 0.4], { color: 'white', rot: [0, 90, 0], depth: 0.01, parent: 'boom' })
      .wedge([2.8, 9.4, 0.03], [0, 6.2, 2.85], { color: '#8fc4f0', rot: [0, -90, 0], apex: -0.5, edge: 'sharp' });
    b.pair((s) => {
      b.each(3, (i) => b.cyl([0.22, 0.05, 0.22], [s * 0.91, 1.6, -0.4 + i * 0.8], { color: '#3a3633', rot: [0, 0, 90], edge: 'sharp' }));
      b.each(4, (i) => b.stick([s * 1.25, 1.3, -3.6 + i * 2.2], [s * 1.25, 2.0, -3.6 + i * 2.2], 0.04, '#c9ccd1'));
      b.stick([s * 1.25, 2.0, -3.6], [s * 1.0, 2.0, 3.8], 0.025, '#c9ccd1');
    });
    return b
      .socket('seat', [0.5, 1.35, -2.6], 'seat')
      .act({ click: [[A.operate('boom', 'open'), A.par(A.effect('water_spray', { dur: 1.5 }), A.anim('wobble'), A.say('Whoosh!', 1.2))], [A.operate('boom', 'close'), A.effect('water_spray', { dur: 1 })]] })
      .done();
  }),
  // A big wooden bowl of salad: lettuce leaves, cherry tomatoes, cucumber slices, red onion rings and croutons,
  // with wooden salad servers. Click: the servers toss it.
  e('salad', 'food', 'salads', () => {
    const b = m('salad')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: '#9a6a3e', edge: 'sharp' })
      .cyl([0.26, 0.1, 0.26], [0, 0.06, 0], { color: '#b5814e', taper: 1.3 })
      .dome([0.3, 0.06, 0.3], [0, 0.115, 0], { color: '#7cc45a', name: 'leaves' });
    b.each(8, (i) => b.ball([0.08, 0.035, 0.06], surf([0, 0.115, 0], [0.11, 0.03, 0.11], i * 45, 20), { color: i % 2 ? '#7cc45a' : '#5aa553', rot: [25, i * 45, 0], parent: 'leaves' }));
    for (const [xx, z] of [[0.04, 0.04], [-0.05, 0.0], [0.02, -0.06], [-0.02, 0.07]] as Array<[number, number]>) b.ball(0.03, [xx, 0.15, z], { color: '#e0473b', parent: 'leaves' });
    b.each(4, (i) => b.cyl([0.035, 0.008, 0.035], [Math.cos(i * 1.6) * 0.07, 0.155, Math.sin(i * 1.6) * 0.07], { color: '#cfe8a0', rot: [20, 0, i * 20], parent: 'leaves' }));
    b.each(3, (i) => b.torus([0.035, 0.035, 0.006], [Math.cos(i * 2.1 + 1) * 0.05, 0.16, Math.sin(i * 2.1 + 1) * 0.05], { color: '#a34a8a', rot: [70, i * 40, 0], tube: 0.15, parent: 'leaves', noInk: true }));
    b.each(4, (i) => b.box(0.016, [Math.cos(i * 1.4 + 0.3) * 0.04, 0.16, Math.sin(i * 1.4 + 0.3) * 0.04], { color: '#d9a35f', round: 0.2, rot: [i * 30, i * 20, 0], parent: 'leaves' }));
    b.stick([0.06, 0.12, 0.02], [0.2, 0.3, -0.04], 0.012, '#b5814e', { name: 'servers', pivot: [0.2, 0.3, -0.04] })
      .ball([0.045, 0.014, 0.06], [0.05, 0.115, 0.02], { color: '#b5814e', parent: 'servers' })
      .stick([0.03, 0.12, -0.04], [0.17, 0.3, -0.1], 0.012, '#b5814e', { parent: 'servers' })
      .box([0.045, 0.012, 0.06], [0.02, 0.115, -0.04], { color: '#b5814e', parent: 'servers', round: 0.4 });
    return b.act({ click: [A.par(A.pose('servers', { rot: [0, 0, -20], dur: 0.3 }), A.pose('leaves', { move: [0, 0.03, 0], dur: 0.3 })), A.par(A.pose('servers', { rot: [0, 0, 0], dur: 0.3 }), A.pose('leaves', { move: [0, 0, 0], dur: 0.3 }), A.say('Toss, toss!', 1.2))] }).done();
  }),
  // A glass cruet of vinaigrette (20 cm): golden oil floating on vinegar with herbs, a cork stopper and a label.
  // Click: it is shaken until the layers mix.
  e('salad dressing', 'food', 'condiments', () =>
    m('salad dressing')
      .cyl([0.07, 0.11, 0.07], [0, 0.055, 0], { color: '#c87a4a', name: 'bottle' })
      .cyl([0.071, 0.04, 0.071], [0, 0.13, 0], { color: '#e8c36a', parent: 'bottle' })
      .cyl([0.07, 0.04, 0.07], [0, 0.17, 0], { color: '#e8e4dc', taper: 0.45, parent: 'bottle' })
      .cyl([0.03, 0.05, 0.03], [0, 0.21, 0], { color: '#e8e4dc', parent: 'bottle' })
      .cyl([0.032, 0.03, 0.032], [0, 0.245, 0], { color: '#b5814e', parent: 'bottle', edge: 'sharp' })
      .cyl([0.072, 0.045, 0.072], [0, 0.06, 0], { color: '#faf6ea', parent: 'bottle', edge: 'sharp' })
      .label('VINAIGRETTE', [0.055, 0.015], [0, 0.06, 0.037], { color: '#faf6ea', depth: 0.002, parent: 'bottle' })
      .ball([0.012, 0.004, 0.008], [0.02, 0.11, 0.03], { color: '#3f7a3a', noInk: true, parent: 'bottle' })
      .ball([0.01, 0.004, 0.008], [-0.02, 0.09, 0.032], { color: '#3f7a3a', noInk: true, parent: 'bottle' })
      .act({ click: [A.par(A.anim('shake', 3), A.say('Shake, shake!', 1.5))] })
      .done(),
  ),
  // Saliva: a dental model of a mouth (25 cm) on a stand, lips parted over two rows of teeth and a pink tongue,
  // with a drop of drool hanging from the lip. Click: the drop falls, drip! Next click, a new drop forms.
  e('saliva', 'clinic', 'body', () => {
    const b = m('saliva')
      .box([0.22, 0.03, 0.16], [0, 0.015, 0], { color: '#3a3633', round: 0.2, edge: 'sharp' })
      .stick([0, 0.03, -0.03], [0, 0.08, -0.03], 0.03, '#9da3a8')
      .ball([0.22, 0.17, 0.15], [0, 0.17, 0], { color: '#e8a0a0' })
      .ball([0.18, 0.06, 0.1], [0, 0.16, 0.04], { color: '#5a1a22' })
      .ball([0.12, 0.035, 0.08], [0, 0.145, 0.055], { color: '#e86a7a' })
      .torus([0.2, 0.11, 0.06], [0, 0.165, 0.065], { color: '#d0505a', tube: 0.22 });
    b.each(6, (i) => b.box([0.022, 0.025, 0.02], [-0.055 + i * 0.022, 0.2, 0.08], { color: 'white', round: 0.4 }).box([0.022, 0.022, 0.02], [-0.055 + i * 0.022, 0.125, 0.08], { color: 'white', round: 0.4 }));
    b.ball([0.016, 0.02, 0.016], [0.04, 0.1, 0.1], { color: '#bfe3f2', name: 'drop' })
      .cone([0.012, 0.02, 0.012], [0.04, 0.118, 0.1], { color: '#bfe3f2', parent: 'drop' });
    return b.act({ click: [[A.pose('drop', { move: [0, -0.1, 0], dur: 0.3 }), A.par(A.pose('drop', { scale: 0, dur: 0.1 }), A.say('Drip!', 1))], [A.pose('drop', { move: [0, 0, 0], dur: 0 }), A.pose('drop', { scale: 1, dur: 0.8 })]] }).done();
  }),
  // A hair salon (6 m frontage): pink walls, a pink-and-white awning, a big scissors sign, hood dryers seen in
  // the window and a spinning barber's pole by the door. Click: the door opens, the pole spins, snip snip.
  e('salon', 'places', 'shops', () => {
    const b = shop('salon', { w: 6.5, h: 4.4, d: 7, wall: '#f4b8cc', trim: 'white', sign: 'HAIR SALON', signBg: '#d64fa0', awning: ['#d64fa0', 'white'], door: 'white' });
    b.pair((s) => b.torus([0.5, 0.5, 0.1], [s * 0.35, 4.7, 3.62], { color: '#2a2726', tube: 0.25 }));
    b.rod([-0.2, 4.85, 3.62], [0.6, 6.0, 3.62], 0.14, '#c9ccd1').rod([0.2, 4.85, 3.62], [-0.6, 6.0, 3.62], 0.14, '#c9ccd1');
    b.each(2, (i) => b.dome([0.6, 0.45, 0.5], [-2.2 + i * 0.9, 1.9, 3.3], { color: '#c9ccd1' }));
    b.cyl([0.24, 1.3, 0.24], [0.95, 1.6, 3.75], { color: 'white', name: 'pole', mover: { kind: 'spin', axis: 'y', amount: 180 } })
      .dome([0.28, 0.16, 0.28], [0.95, 2.33, 3.75], { color: '#c9ccd1' })
      .cyl([0.28, 0.08, 0.28], [0.95, 0.91, 3.75], { color: '#c9ccd1' });
    b.each(4, (i) => b.box([0.26, 0.08, 0.26], [0.95, 1.1 + i * 0.32, 3.75], { color: i % 2 ? '#d8312a' : '#3f6fb5', rot: [30, 0, 0], parent: 'pole', noInk: true }));
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.operate('pole', 'on'), A.say('Snip snip!', 1.5)), A.wait(2.5), A.operate('door', 'close')], [A.operate('pole', 'off')]] }).done();
  }),
  // A bowl of chunky tomato salsa with onion and coriander, ringed by tortilla chips on a plate. Click: a chip
  // dips in and comes out loaded. Crunch!
  e('salsa', 'food', 'dips', () => {
    const b = plate(m('salsa'), 0.3);
    bowl(b, 0.13, '#f0923b', '#c8302a', [0, 0.02, 0]);
    b.each(8, (i) => b.box(0.014, surf([0, 0.07, 0], [0.045, 0.01, 0.045], i * 45, 30), { color: i % 3 === 0 ? 'white' : i % 3 === 1 ? '#3f7a3a' : '#e0473b', noInk: true, round: 0.2, rot: [i * 20, i * 30, 0] }));
    for (const [a, r] of [[30, 0], [100, 15], [200, -10], [300, 20], [250, 5]]) b.wedge([0.06, 0.06, 0.006], [Math.sin(a * D2R) * 0.11, 0.03, Math.cos(a * D2R) * 0.11], { color: '#e8b84a', rot: [r, a, 20] });
    b.wedge([0.06, 0.06, 0.006], [0.08, 0.04, 0.09], { color: '#e8b84a', rot: [-20, 40, 0], name: 'chip' });
    return b.act({ click: [A.pose('chip', { move: [-0.07, 0.03, -0.08], dur: 0.4 }), A.pose('chip', { move: [-0.06, 0.08, -0.06], rot: [-30, 0, 0], dur: 0.4 }), A.par(A.say('Crunch!', 1), A.pose('chip', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 }))] }).done();
  }),
  // A round blue canister of table salt (14 cm) with a metal pour spout and a little white heap beside it. Click:
  // the spout opens and salt pours out; click again and it shuts.
  e('salt', 'food', 'spices', () =>
    m('salt')
      .cyl([0.08, 0.14, 0.08], [0, 0.07, 0], { color: '#3f6fb5' })
      .cyl([0.082, 0.06, 0.082], [0, 0.075, 0], { color: 'white', edge: 'sharp' })
      .label('SALT', [0.05, 0.02], [0, 0.075, 0.041], { color: 'white', depth: 0.002 })
      .ball([0.025, 0.025, 0.004], [0, 0.11, 0.04], { color: '#f6d24a', noInk: true })
      .cyl([0.082, 0.006, 0.082], [0, 0.143, 0], { color: '#3f6fb5', edge: 'sharp' })
      .box([0.025, 0.004, 0.02], [0, 0.147, 0.03], { color: '#c9ccd1', name: 'spout', pivot: [0, 0.147, 0.02], mover: { kind: 'swing', axis: 'x', amount: -70 }, edge: 'sharp' })
      .cone([0.1, 0.035, 0.08], [0.09, 0.0175, 0.05], { color: 'white', name: 'heap' })
      .act({ click: [[A.operate('spout', 'open'), A.par(A.effect('snow', { dur: 1.5 }), A.pose('heap', { scale: 1.25, dur: 1.2 }))], [A.operate('spout', 'close'), A.pose('heap', { scale: 1, dur: 0.3 })]] })
      .done(),
  ),
  // A mineral salt lick for livestock: a pink salt block worn into a hollow by tongues, in a wire holder on a
  // fence post at cow height (1.1 m). Click: a goat trots up for a lick.
  e('salt lick', 'farm', 'farm things', () =>
    m('salt lick', { edge: 'sharp' })
      .box([0.12, 1.15, 0.12], [0, 0.575, -0.12], { color: '#8c5a2b', round: 0.1 })
      .stick([-0.9, 0.9, -0.14], [0.9, 0.9, -0.14], 0.06, '#9a6a3e')
      .stick([-0.9, 0.45, -0.14], [0.9, 0.45, -0.14], 0.06, '#9a6a3e')
      .box([0.26, 0.04, 0.24], [0, 0.82, 0.02], { color: '#5c6166', round: 0.2 })
      .box([0.22, 0.2, 0.2], [0, 0.94, 0.02], { color: '#ecc8bc', round: 0.25 })
      .ball([0.14, 0.06, 0.1], [0, 1.04, 0.06], { color: '#d9a89a', noInk: true })
      .ball([0.06, 0.03, 0.02], [0.05, 0.92, 0.12], { color: 'white', noInk: true })
      .stick([-0.12, 0.8, 0.13], [-0.12, 1.0, 0.13], 0.01, '#5c6166')
      .stick([0.12, 0.8, 0.13], [0.12, 1.0, 0.13], 0.01, '#5c6166')
      .act({ click: [A.spawn('goat', 'goat', { rel: 'front', of: 'self', dist: 'near' }), A.move('goat', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'walk' }), A.say('Lick, lick!', 1.5, 'goat'), A.remove('goat', 'fade')] })
      .done(),
  ),
  // A salt mine (built at 13 m): a steel headframe with two winding wheels, the winding house with its chimney,
  // a timbered tunnel mouth in a hill streaked with salt, rails, a mine cart heaped with salt, and white salt
  // piles. Click: the wheels turn and the cart trundles out of the tunnel and back.
  e('salt mine', 'places', 'mines', () => {
    const b = m('salt mine', { edge: 'sharp' })
      .box([28, 0.2, 22], [0, 0.1, 0], { color: '#a39f97', round: 0.01 })
      .dome([16, 6, 12], [-5, 3.2, -4], { color: '#a8977e', edge: 'soft' })
      .ball([5, 2.5, 3], [-2.5, 4.5, -0.5], { color: '#f2ece0', edge: 'soft' })
      .ball([4, 2, 3], [-8.5, 3.5, -1.0], { color: '#f2ece0', edge: 'soft' })
      .box([3.0, 3.2, 0.6], [-4, 1.8, 1.7], { color: '#1e1c1b', round: 0.1 })
      .box([3.8, 0.4, 0.5], [-4, 3.6, 1.95], { color: '#7a5230' })
      .label('SALT MINE', [3.2, 0.6], [-4, 4.2, 2.0], { color: '#f2ece0', depth: 0.06 });
    b.pair((s) => b.box([0.35, 3.4, 0.4], [-4 + s * 1.7, 1.9, 1.95], { color: '#7a5230' }));
    b.pair((s) => b.stick([-4 + s * 0.6, 0.25, 1.6], [-4 + s * 0.6, 0.25, 10], 0.12, '#8f99a3'));
    b.each(9, (i) => b.box([1.7, 0.1, 0.25], [-4, 0.22, 2.4 + i * 0.9], { color: '#6a4a30' }));
    b.box([1.3, 0.7, 1.7], [-4, 0.9, 4.5], { color: '#55595e', round: 0.1, name: 'cart' })
      .dome([1.3, 0.5, 1.6], [-4, 1.5, 4.5], { color: '#f7f5ef', parent: 'cart', edge: 'soft' });
    b.pair((s) => b.pair((t) => b.cyl([0.36, 0.1, 0.36], [-4 + s * 0.6, 0.45, 4.5 + t * 0.55], { color: '#2a2726', rot: [0, 0, 90], parent: 'cart' })));
    const hx = 7, hz = -2;
    b.pair((s) => b.pair((t) => b.stick([hx + s * 2.2, 0.2, hz + t * 2.2], [hx + s * 0.8, 12.5, hz + t * 0.8], 0.3, '#5c6166')));
    b.each(4, (i) => {
      const y = 2.5 + i * 2.6, w = 2.2 - (i + 0.5) * 0.35;
      b.pair((t) => b.stick([hx - w, y, hz + t * w], [hx + w, y, hz + t * w], 0.18, '#5c6166').stick([hx + t * w, y, hz - w], [hx + t * w, y, hz + w], 0.18, '#5c6166'));
    });
    b.box([2.2, 0.4, 2.2], [hx, 12.6, hz], { color: '#3a3f45' });
    b.pair((s) => b.torus([2.4, 2.4, 0.25], [hx, 13.6, hz + s * 0.5], { color: '#8f99a3', tube: 0.12, name: s > 0 ? 'sheave1' : 'sheave2', mover: { kind: 'spin', axis: 'z', amount: 120 } }));
    b.box([6, 4.5, 4.5], [12, 2.45, 4], { color: '#a0503a', round: 0.02 }).wedge([6.4, 1.8, 4.9], [12, 5.6, 4], { color: '#5c6166' })
      .stick([13.5, 4, 3], [13.5, 9, 3], 0.6, '#8a3a2a');
    door(b, [12, 1.3, 6.28], 1.2, 2.2, '#5c6166');
    b.pair((s) => b.stick([hx + 0.1, 13.6, hz + s * 0.5], [12 - s * 0.4, 4.6, 2.2], 0.05, '#2a2726'));
    for (const [xx, z, r] of [[3, 7, 2.6], [5.2, 8.2, 1.8], [1.4, 9.2, 1.4]] as V[]) b.cone([r * 2, r * 1.2, r * 2], [xx, r * 0.6 + 0.2, z], { color: '#f7f5ef', edge: 'soft' });
    return b
      .act({ click: [A.par(A.operate('sheave', 'on'), A.pose('cart', { move: [0, 0, 3.5], dur: 1.6 }), A.say('Rumble, rumble...', 2)), A.effect('dust', { dur: 1.2 }), A.pose('cart', { move: [0, 0, 0], dur: 1.6 }), A.operate('sheave', 'off')] })
      .done();
  }),
  // A glass salt shaker (11 cm) with a domed chrome cap pierced with holes, the salt showing through. Click: it
  // tips over and shakes salt out.
  e('salt shaker', 'kitchen', 'tableware', () => {
    const b = m('salt shaker')
      .cyl([0.052, 0.085, 0.052], [0, 0.0425, 0], { color: '#d8eef7', taper: 0.88, name: 'shaker', pivot: [0, 0.06, 0], edge: 'sharp' })
      .cyl([0.045, 0.045, 0.045], [0, 0.025, 0], { color: 'white', taper: 0.92, parent: 'shaker' })
      .cyl([0.048, 0.016, 0.048], [0, 0.093, 0], { color: '#c9ccd1', parent: 'shaker', edge: 'sharp' })
      .dome([0.048, 0.022, 0.048], [0, 0.112, 0], { color: '#c9ccd1', parent: 'shaker' });
    b.each(5, (i) => b.ball(0.006, surf([0, 0.101, 0], [0.023, 0.022, 0.023], -60 + i * 30, 45), { color: '#2a2726', noInk: true, parent: 'shaker' }));
    return b.act({ click: [A.pose('shaker', { rot: [0, 0, 140], move: [0.03, 0.06, 0], dur: 0.4 }), A.par(A.anim('shake', 2), A.effect('snow', { dur: 1.2 }), A.say('Shake, shake!', 1.2)), A.pose('shaker', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A cross-stitch sampler (26 cm) in a wooden frame on a little easel: rows of coloured stitches, a cottage, a
  // heart and HOME SWEET HOME, with a needle and red thread still in it. Click: the needle stitches in and out.
  e('sampler', 'home', 'decor', () => {
    const b = m('sampler', { edge: 'sharp' })
      .box([0.24, 0.29, 0.03], [0, 0.155, 0], { color: '#7a5230', round: 0.1, rot: [-10, 0, 0] })
      .box([0.2, 0.25, 0.01], [0, 0.155, 0.017], { color: '#f2e6cf', rot: [-10, 0, 0] })
      .stick([0, 0.01, -0.08], [0, 0.2, -0.03], 0.012, '#7a5230');
    const cs = ['#d8312a', '#3f6fb5', '#5aa553', '#8a5fc4', '#f0923b'];
    const P = (xx: number, y: number): V => [xx, y, 0.024 + (y - 0.155) * Math.tan(10 * D2R) * -1];
    b.each(3, (r) => b.each(7, (c) => b.box([0.016, 0.016, 0.004], P(-0.072 + c * 0.024, 0.255 - r * 0.026), { color: cs[(r + c) % 5], noInk: true, rot: [-10, 0, 0] })));
    b.box([0.06, 0.04, 0.004], P(-0.04, 0.12), { color: '#d8312a', noInk: true, rot: [-10, 0, 0] }).wedge([0.07, 0.03, 0.004], P(-0.04, 0.155), { color: '#7a4a22', noInk: true, rot: [-10, 0, 0] });
    b.heart(0.04, P(0.045, 0.13), { color: '#d8312a', noInk: true, rot: [-10, 0, 0] });
    b.label('HOME SWEET HOME', [0.17, 0.02], P(0, 0.065), { color: '#f2e6cf', depth: 0.003, rot: [-10, 0, 0] });
    b.stick([0.075, 0.05, 0.035], [0.085, 0.09, 0.05], 0.003, '#c9ccd1', { name: 'needle' }).stick([0.075, 0.05, 0.035], [0.05, 0.03, 0.06], 0.002, '#d8312a');
    return b.act({ click: [A.pose('needle', { move: [0, 0, -0.012], dur: 0.2 }), A.pose('needle', { move: [0, 0, 0.004], dur: 0.2 }), A.pose('needle', { move: [0, 0, -0.012], dur: 0.2 }), A.par(A.pose('needle', { move: [0, 0, 0], dur: 0.2 }), A.effect('hearts', { dur: 1.2 }))] }).done();
  }),
  // A heap of fine golden sand (60 cm across) with wind ripples, a little spade stuck in it and a pink shell.
  // Click: it shifts and sifts, shhhh.
  e('sand', 'nature', 'earth', () => {
    const b = m('sand')
      .cyl([0.62, 0.05, 0.54], [0, 0.025, 0], { color: '#e8d29a', taper: 0.8 })
      .ball([0.48, 0.22, 0.42], [0, 0.07, 0], { color: '#e8d29a', name: 'pile' });
    b.each(3, (i) => b.torus([0.5 - i * 0.12, 0.42 - i * 0.1, 0.005], [0, 0.06 + i * 0.04, 0], { color: '#d6bd7a', rot: [90, 0, 0], tube: 0.04, noInk: true }));
    b.ball([0.04, 0.02, 0.035], [0.18, 0.06, 0.15], { color: '#f4a1c0' })
      .stick([0.05, 0.15, 0.0], [0.14, 0.32, -0.06], 0.014, '#3f6fb5', { edge: 'sharp' })
      .box([0.06, 0.08, 0.01], [0.03, 0.13, 0.01], { color: '#3f6fb5', rot: [0, 0, -25], edge: 'sharp' });
    return b.act({ click: [A.par(A.pose('pile', { scale: 0.92, dur: 0.6 }), A.effect('dust', { dur: 1.5 }), A.say('Shhhhh...', 1.5)), A.pose('pile', { scale: 1, dur: 0.6 })] }).done();
  }),
  // A sand dollar (8 cm) propped on edge in a patch of sand: the pale disc with its five-petal flower pattern.
  // Click: it burrows down into the sand; click again, it pops back up.
  e('sand dollar', 'sea', 'sea life', () => {
    const b = m('sand dollar')
      .ball([0.16, 0.03, 0.12], [0, 0.01, 0], { color: '#e8d29a' })
      .cyl([0.08, 0.01, 0.08], [0, 0.05, 0], { color: '#f1e6cf', rot: [80, 0, 0], name: 'dollar' });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      b.ball([0.008, 0.022, 0.003], [Math.sin(a) * 0.018, 0.05 + Math.cos(a) * 0.018, 0.006], { color: '#c9b48a', noInk: true, rot: [0, 0, (-a * 180) / Math.PI], parent: 'dollar' });
    }
    b.cyl([0.008, 0.012, 0.008], [0, 0.05, 0.004], { color: '#c9b48a', rot: [80, 0, 0], parent: 'dollar' });
    return b.act({ click: [[A.par(A.pose('dollar', { move: [0, -0.045, 0], dur: 0.8 }), A.effect('dust', { dur: 1 }))], [A.pose('dollar', { move: [0, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // A red beach bucket full of damp sand with a blue spade. Click: the bucket flips over and lifts off to leave a
  // sand tower; click again, the tower is knocked flat and the bucket is refilled.
  e('sand toy', 'toys', 'beach toys', () => {
    const b = m('sand toy')
      .cyl([0.13, 0.14, 0.13], [0, 0.07, 0], { color: '#e0473b', taper: 1.25, name: 'bucket', pivot: [0, 0.07, 0] })
      .cyl([0.15, 0.02, 0.15], [0, 0.13, 0], { color: '#d6bd7a', parent: 'bucket' })
      .arc([0.17, 0.12, 0.008], [0, 0.14, 0], { color: '#f6d24a', tube: 0.08, parent: 'bucket' })
      .cyl([0.13, 0.14, 0.13], [0.24, 0.07, 0], { color: '#d6bd7a', taper: 0.8, name: 'tower', scale: 0 })
      .stick([-0.12, 0.0, 0.08], [-0.06, 0.22, -0.02], 0.014, '#3f6fb5', { edge: 'sharp' })
      .box([0.06, 0.07, 0.01], [-0.13, 0.01, 0.1], { color: '#3f6fb5', rot: [-80, 30, 0], edge: 'sharp' })
      .ball([0.04, 0.02, 0.03], [-0.06, 0.23, -0.02], { color: '#3f6fb5' })
      .star(0.07, [0.12, 0.004, 0.12], { color: '#f6d24a', rot: [90, 0, 0] });
    return b
      .act({
        click: [
          [A.pose('bucket', { rot: [0, 0, -180], move: [0.24, 0.0, 0], dur: 0.6 }), A.pose('tower', { scale: 1, dur: 0 }), A.pose('bucket', { rot: [0, 0, -180], move: [0.24, 0.2, 0], dur: 0.4 }), A.par(A.pose('bucket', { rot: [0, 0, 0], move: [0.45, 0.0, 0.1], dur: 0.5 }), A.say('Ta-da!', 1.2))],
          [A.par(A.pose('tower', { scale: 0, dur: 0.3 }), A.effect('dust', { dur: 1 })), A.pose('bucket', { move: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A pair of leather sandals (26 cm) on cork footbeds: crossed straps, an ankle strap with a brass buckle.
  // Click: they hop, flip-flop.
  e('sandal', 'wardrobe', 'shoes', () => {
    const b = m('sandal');
    b.pair((s) => {
      const x = s * 0.07;
      b.box([0.1, 0.022, 0.26], [x, 0.011, 0], { color: '#c9a46a', round: 0.6 }).box([0.098, 0.008, 0.25], [x, 0.026, 0], { color: '#8a5a35', round: 0.6 });
      for (const z of [0.07, -0.0]) b.rod([x - 0.045, 0.03, z], [x, 0.06, z + 0.02], 0.016, '#7a4a2a').rod([x, 0.06, z + 0.02], [x + 0.045, 0.03, z], 0.016, '#7a4a2a');
      b.rod([x - 0.045, 0.03, -0.1], [x, 0.075, -0.125], 0.012, '#7a4a2a').rod([x, 0.075, -0.125], [x + 0.045, 0.03, -0.1], 0.012, '#7a4a2a').box([0.012, 0.016, 0.008], [x + s * 0.043, 0.035, -0.1], { color: '#d0a84a', edge: 'sharp' });
    });
    return b.act({ click: [A.par(A.anim('hop', 2), A.say('Flip, flop!', 1.2))] }).done();
  }),
  // A wall of hessian sandbags (1.2 m long, 0.6 m high): plump tied bags stacked in a pyramid. The top bag is a
  // piece: click and it is heaved off, thud; click again and it goes back on.
  e('sandbag', 'workshop', 'construction', () => {
    const c = '#c8b07a', d = '#b09860';
    const b = m('sandbag');
    for (const [xx, y] of [[-0.4, 0.1], [0.12, 0.1], [0.62, 0.1], [-0.14, 0.29], [0.38, 0.29]] as Array<[number, number]>) b.box([0.5, 0.2, 0.32], [xx, y, 0], { color: c, round: 0.85, ...(xx === 0.38 ? { name: 'mid' } : {}) }).ball([0.07, 0.08, 0.07], [xx + 0.27, y, 0], { color: d });
    b.box([0.5, 0.2, 0.32], [0.12, 0.47, 0], { color: '#d2bc88', round: 0.85, name: 'bag', parent: 'mid', piece: true })
      .ball([0.07, 0.08, 0.07], [0.39, 0.47, 0], { color: d, parent: 'bag' })
      .stick([0.38, 0.47, -0.05], [0.38, 0.47, 0.05], 0.012, '#7a5230', { parent: 'bag' });
    return b.act({ click: [[A.detach('bag', 'sack'), A.par(A.effect('dust', { dur: 1 }), A.say('Thud!', 1))], [A.reattach('bag'), A.say('Heave!', 1)]] }).done();
  }),
  // A wooden playground sandbox (2 m square) with seat ledges on its sides, sand, a bucket and spade, and a
  // little sandcastle in the middle. Click: the sandcastle is patted into shape; click again, it gets squashed.
  e('sandbox', 'sports', 'playground', () => {
    const b = m('sandbox')
      .box([1.9, 0.22, 1.9], [0, 0.11, 0], { color: '#e8d29a', round: 0.1 });
    b.pair((s) => b.box([2.1, 0.32, 0.12], [0, 0.16, s * 1.0], { color: '#b5814e', edge: 'sharp' }).box([0.12, 0.32, 2.1], [s * 1.0, 0.16, 0], { color: '#b5814e', edge: 'sharp' }).box([2.1, 0.04, 0.26], [0, 0.34, s * 0.95], { color: '#d8b07a', edge: 'sharp' }));
    b.cyl([0.2, 0.2, 0.2], [0.5, 0.32, 0.4], { color: '#e0473b', taper: 1.2 })
      .stick([0.2, 0.22, 0.5], [0.3, 0.45, 0.4], 0.03, '#f6d24a').box([0.12, 0.02, 0.15], [0.17, 0.23, 0.57], { color: '#f6d24a', edge: 'sharp' })
      .cyl([0.36, 0.2, 0.36], [-0.25, 0.32, -0.15], { color: '#d6bd7a', taper: 0.85, name: 'castle', pivot: [-0.25, 0.22, -0.15] })
      .cyl([0.22, 0.16, 0.22], [-0.25, 0.5, -0.15], { color: '#d6bd7a', taper: 0.8, parent: 'castle' })
      .stick([-0.25, 0.57, -0.15], [-0.25, 0.75, -0.15], 0.01, '#b5814e', { parent: 'castle' })
      .wedge([0.1, 0.07, 0.01], [-0.2, 0.72, -0.15], { color: '#e0473b', rot: [0, 0, -90], parent: 'castle' });
    return b.act({ click: [[A.par(A.pose('castle', { scale: 1.15, dur: 0.3 }), A.say('Pat, pat!', 1.2)), A.pose('castle', { scale: 1, dur: 0.3 })], [A.par(A.pose('castle', { scale: 0.3, dur: 0.3 }), A.effect('dust', { dur: 1 }), A.say('Squish!', 1)), A.wait(1), A.pose('castle', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A grand sandcastle (1 m): a keep and four round towers with crenellations, a wall with a gateway, a moat,
  // shells pressed into it and a flag on top. Click: the flag flutters; click again, a wave washes in and the
  // keep crumbles; click again to rebuild.
  e('sandcastle', 'toys', 'beach toys', () => {
    const sd = '#e2c78a', dk = '#cdb070';
    const b = m('sandcastle')
      .cyl([1.5, 0.08, 1.3], [0, 0.04, 0], { color: '#e8d29a' })
      .torus([1.3, 1.1, 0.06], [0, 0.07, 0], { color: '#7fc4ef', rot: [90, 0, 0], tube: 0.08, noInk: true })
      .box([0.7, 0.3, 0.55], [0, 0.23, 0], { color: sd, round: 0.15 })
      .box([0.5, 0.35, 0.4], [0, 0.55, -0.02], { color: sd, round: 0.15, name: 'keep', pivot: [0, 0.38, 0] })
      .cyl([0.26, 0.24, 0.26], [0, 0.84, -0.02], { color: sd, parent: 'keep' })
      .stick([0, 0.96, -0.02], [0, 1.2, -0.02], 0.012, '#b5814e', { parent: 'keep' })
      .box([0.14, 0.09, 0.01], [0.075, 1.15, -0.02], { color: '#e0473b', name: 'flag', parent: 'keep', pivot: [0.005, 1.15, -0.02] })
      .box([0.16, 0.18, 0.03], [0, 0.17, 0.28], { color: '#8a6a40', round: 0.6 });
    b.each(4, (i) => b.box([0.06, 0.06, 0.06], [-0.18 + i * 0.12, 0.76, 0.18], { color: dk, parent: 'keep' }));
    b.pair((s) => b.pair((t) => {
      b.cyl([0.22, 0.48, 0.22], [s * 0.38, 0.28, t * 0.3], { color: sd, taper: 0.85 });
      b.each(4, (i) => b.box(0.05, [s * 0.38 + Math.cos(i * 1.571) * 0.08, 0.54, t * 0.3 + Math.sin(i * 1.571) * 0.08], { color: dk }));
    }));
    b.each(4, (i) => b.ball([0.04, 0.03, 0.015], [-0.25 + i * 0.16, 0.25, 0.285], { color: i % 2 ? '#f4a1c0' : 'white', noInk: true }));
    return b
      .act({
        click: [
          [A.pose('flag', { rot: [0, 35, 0], dur: 0.25 }), A.pose('flag', { rot: [0, -25, 0], dur: 0.25 }), A.par(A.pose('flag', { rot: [0, 0, 0], dur: 0.25 }), A.effect('sparkle', { dur: 1 }))],
          [A.effect('water_spray', { dur: 1.5 }), A.par(A.pose('keep', { move: [0, -0.2, 0], rot: [0, 0, 12], dur: 0.8 }), A.say('Splosh!', 1.2))],
          [A.pose('keep', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 }), A.say('Pat, pat!', 1.2)],
        ],
      })
      .done();
  }),
  // A cork sanding block wrapped in sandpaper on a plank, a fresh sheet of paper beside it, sawdust about. Click:
  // it sands back and forth, scritch-scratch.
  e('sandpaper', 'workshop', 'materials', () => {
    const b = m('sandpaper', { edge: 'sharp' })
      .box([0.5, 0.03, 0.16], [0, 0.015, 0], { color: '#d8b07a', round: 0.1 })
      .box([0.12, 0.05, 0.08], [0.05, 0.06, 0.0], { color: '#c9a46a', round: 0.25, name: 'block' })
      .box([0.124, 0.008, 0.084], [0.05, 0.034, 0.0], { color: '#b8743a', parent: 'block' })
      .box([0.124, 0.03, 0.004], [0.05, 0.05, 0.042], { color: '#b8743a', parent: 'block' })
      .box([0.2, 0.004, 0.26], [-0.2, 0.002, 0.2], { color: '#b8743a', round: 0.1, rot: [0, 15, 0] })
      .box([0.2, 0.004, 0.26], [-0.2, 0.001, 0.2], { color: '#f2e6cf', round: 0.1, rot: [0, 15, 0], noInk: true });
    b.each(8, (i) => b.ball([0.012, 0.004, 0.012], [-0.15 + i * 0.04, 0.032, 0.05 - (i % 3) * 0.04], { color: '#e8d29a', noInk: true }));
    return b.act({ click: [A.pose('block', { move: [-0.08, 0, 0], dur: 0.2 }), A.pose('block', { move: [0.06, 0, 0], dur: 0.2 }), A.pose('block', { move: [-0.08, 0, 0], dur: 0.2 }), A.par(A.pose('block', { move: [0, 0, 0], dur: 0.2 }), A.effect('dust', { dur: 1 }), A.say('Scritch, scratch!', 1.2))] }).done();
  }),
  // A chunk of sandstone (25 cm) with its layers showing: bands of orange, tan and cream laid down by old rivers,
  // worn edges. Click: grains crumble off.
  e('sandstone', 'nature', 'rocks', () => {
    const b = m('sandstone', { edge: 'sharp' });
    const cs = ['#d9a066', '#e8c08a', '#c88a52', '#f0d4a2', '#d49660', '#e2b47a'];
    b.each(6, (i) => b.box([0.26 - i * 0.02 - (i % 2) * 0.01, 0.026, 0.18 - i * 0.012], [i * 0.006 - 0.01, 0.013 + i * 0.026, (i % 2) * -0.006], { color: cs[i], round: 0.3, rot: [0, i * 4 - 8, 0] }));
    b.box([0.08, 0.06, 0.06], [0.16, 0.03, 0.06], { color: '#e2b47a', round: 0.3, rot: [0, 30, 10] });
    return b.act({ click: [A.par(A.effect('dust', { dur: 1.2 }), A.say('Crumble...', 1.2))] }).done();
  }),
  // A club sandwich cut corner to corner on a plate (12 cm squares): toasted bread, lettuce, ham, cheese and
  // tomato, each half held with a cocktail stick and an olive. Click: one half is lifted for a bite; click again,
  // it goes back.
  e('sandwich', 'food', 'sandwiches', () => {
    const b = plate(m('sandwich'), 0.26);
    const half = (dx: number, rz: number, o: { name?: string; parent?: string }) => {
      const L: Array<[number, string, number]> = [[0.02, '#d9a35f', 0.026], [0.039, '#7cc45a', 0.012], [0.05, '#f2a0a8', 0.01], [0.059, '#f6c445', 0.008], [0.066, '#e0473b', 0.008], [0.083, '#d9a35f', 0.026]];
      L.forEach(([y, c, t], i) => b.wedge([0.17, 0.085, t], [dx, y, 0], { color: c, rot: [-90, 0, rz], ...(i === 0 ? o : { parent: o.name ?? o.parent }) }));
      b.stick([dx, 0.08, 0.0], [dx, 0.14, 0.0], 0.004, '#d8b07a', { parent: o.name ?? o.parent }).ball(0.02, [dx, 0.14, 0], { color: '#5a6b2a', parent: o.name ?? o.parent });
    };
    half(-0.0425, 90, { name: 'base' });
    half(0.0425, -90, { name: 'half' });
    return b.act({ click: [[A.pose('half', { move: [0.05, 0.08, 0.06], rot: [0, 0, 15], dur: 0.5 }), A.say('Mmm!', 1)], [A.pose('half', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A Santa hat (real size): a red velvet cone flopping over to one side, a thick white fur brim and a white
  // pompom. Click: the tip bobs, jingle, with a little snow.
  e('santa hat', 'wardrobe', 'hats', () =>
    m('santa hat')
      .torus([0.22, 0.22, 0.07], [0, 0.035, 0], { color: '#f7f5ef', rot: [90, 0, 0], tube: 0.32 })
      .cone([0.19, 0.2, 0.19], [0, 0.14, 0], { color: '#d8312a', taper: 0.35 })
      .rod([0, 0.235, 0], [0.09, 0.2, 0.0], 0.055, '#d8312a', { name: 'tip', pivot: [0, 0.235, 0] })
      .ball(0.07, [0.115, 0.175, 0], { color: '#f7f5ef', parent: 'tip' })
      .act({ click: [A.pose('tip', { rot: [0, 0, 25], dur: 0.25 }), A.pose('tip', { rot: [0, 0, -10], dur: 0.3 }), A.par(A.pose('tip', { rot: [0, 0, 0], dur: 0.25 }), A.effect('snow', { dur: 1.2 }), A.say('Jingle!', 1))] })
      .done(),
  ),
  // A young tree (1.3 m) just planted: a slim trunk tied to a stake, a few branches with fresh leaves, a ring of
  // mulch. Click: it grows a little, sparkling; click again, back.
  e('sapling', 'garden', 'trees', () => {
    const b = m('sapling')
      .cyl([0.6, 0.06, 0.6], [0, 0.03, 0], { color: '#6a4a30' })
      .stick([0, 0, 0], [0, 0.95, 0], 0.035, '#7a5134', { name: 'trunk', pivot: [0, 0, 0] })
      .stick([0.09, 0, -0.05], [0.09, 0.8, -0.05], 0.03, '#d8b07a', { edge: 'sharp' })
      .torus([0.13, 0.05, 0.025], [0.045, 0.5, -0.025], { color: '#5aa553', rot: [90, 0, 0], tube: 0.3 })
      .rod([0, 0.65, 0], [0.18, 0.82, 0.02], 0.016, '#7a5134', { parent: 'trunk' })
      .rod([0, 0.55, 0], [-0.16, 0.72, 0.04], 0.016, '#7a5134', { parent: 'trunk' })
      .rod([0, 0.75, 0], [-0.08, 0.95, -0.06], 0.014, '#7a5134', { parent: 'trunk' });
    for (const [xx, y, z, r] of [[0, 1.05, 0, 0.2], [0.2, 0.9, 0.03, 0.16], [-0.18, 0.8, 0.05, 0.15], [-0.08, 1.0, -0.08, 0.14], [0.06, 0.88, 0.1, 0.13]] as Array<[number, number, number, number]>) b.ball([r, r * 0.8, r], [xx, y, z], { color: '#7cc45a', parent: 'trunk' });
    return b.act({ click: [[A.par(A.pose('trunk', { scale: 1.25, dur: 1 }), A.effect('sparkle', { dur: 1.2 }))], [A.pose('trunk', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A cushion-cut blue sapphire (3.5 cm) resting in a little black velvet box. Click: it turns and lights up deep
  // blue.
  e('sapphire', 'nature', 'gems', () => {
    const s = 0.04, bl = '#1f4fbf';
    const b = m('sapphire', { edge: 'sharp' })
      .box([0.07, 0.03, 0.07], [0, 0.015, 0], { color: '#2a2726', round: 0.3 })
      .box([0.06, 0.006, 0.06], [0, 0.031, 0], { color: '#3a3633', round: 0.4, edge: 'soft' })
      .cone([s, s * 0.5, s * 0.8], [0, 0.034 + s * 0.25, 0], { color: bl, rot: [180, 0, 0], segs: 10, name: 'gem', mover: { kind: 'light' } })
      .cyl([s, s * 0.22, s * 0.8], [0, 0.034 + s * 0.61, 0], { color: '#2f62d8', taper: 0.65, segs: 10, parent: 'gem' })
      .ball([s * 0.3, s * 0.06, s * 0.2], [-0.005, 0.034 + s * 0.73, 0.004], { color: '#bcd0ff', noInk: true, parent: 'gem' });
    return b.act({ click: [A.par(A.operate('gem', 'on'), A.pose('gem', { rot: [0, 360, 0], dur: 1.2 }), A.effect('sparkle', { dur: 1.5 })), A.pose('gem', { rot: [0, 0, 0], dur: 0 }), A.operate('gem', 'off')] }).done();
  }),
  // A tin of sardines (14 cm) with a peel-back lid and its key. Click: the lid rolls back to show the fish packed
  // in oil; click again, it closes.
  e('sardine can', 'food', 'canned food', () => {
    const b = m('sardine can', { edge: 'sharp' })
      .box([0.14, 0.03, 0.09], [0, 0.015, 0], { color: '#c9ccd1', round: 0.35 })
      .box([0.13, 0.004, 0.08], [0, 0.029, 0], { color: '#d8b84a', noInk: true });
    b.each(4, (i) => b.loft([0.018, 0.012, 0.12], [0, 0.034, -0.03 + i * 0.02], [[0, 0.3, 0.3], [0.25, 1, 1], [0.8, 0.9, 0.9], [1, 0.3, 0.4]], { color: i % 2 ? '#9fb0bf' : '#b8c6d2', rot: [0, 90, 0], edge: 'soft' }));
    b.box([0.14, 0.004, 0.09], [0, 0.032, 0], { color: '#c0402a', round: 0.3, name: 'lid', pivot: [0, 0.032, -0.045], mover: { kind: 'swing', axis: 'x', amount: -150 } })
      .label('SARDINES', [0.1, 0.03], [0, 0.0345, 0.0], { color: '#c0402a', rot: [-90, 0, 0], depth: 0.002, parent: 'lid' })
      .stick([0.07, 0.034, 0.04], [0.1, 0.034, 0.04], 0.006, '#8f99a3', { parent: 'lid' })
      .torus([0.025, 0.025, 0.005], [0.11, 0.034, 0.04], { color: '#8f99a3', rot: [90, 0, 0], tube: 0.2, parent: 'lid' });
    return b.socket('tin', [0, 0.03, 0], 'inside', { size: 0.12 }).act({ click: [[A.operate('lid', 'open'), A.say('Peel...', 1)], [A.operate('lid', 'close')]] }).done();
  }),
  // A pageant sash on a dress form (1.6 m): a cream tailor's dummy on a turned stand wearing a red satin sash
  // printed MISS TOWN, with a gold rosette at the hip. Click: the rosette spins and it sparkles.
  e('sash', 'wardrobe', 'accessories', () =>
    m('sash')
      .cyl([0.4, 0.05, 0.4], [0, 0.025, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.05, 0], [0, 0.95, 0], 0.05, '#7a5230', { edge: 'sharp' })
      .cyl([0.36, 0.5, 0.24], [0, 1.17, 0], { color: '#f2e6cf', taper: 1.15 })
      .ball([0.4, 0.22, 0.26], [0, 1.42, 0], { color: '#f2e6cf' })
      .cyl([0.1, 0.12, 0.1], [0, 1.58, 0], { color: '#f2e6cf' })
      .cyl([0.12, 0.04, 0.12], [0, 1.66, 0], { color: '#7a5230', edge: 'sharp' })
      .box([0.13, 0.78, 0.03], [0, 1.2, 0.135], { color: '#d8312a', rot: [0, 0, 38], round: 0.3 })
      .box([0.13, 0.78, 0.03], [0, 1.2, -0.135], { color: '#d8312a', rot: [0, 0, 38], round: 0.3 })
      .label('MISS TOWN', [0.09, 0.4], [0.0, 1.22, 0.155], { color: '#d8312a', rot: [0, 0, 38], depth: 0.004 })
      .cyl([0.12, 0.02, 0.12], [0.2, 0.93, 0.13], { color: '#e2b23a', rot: [80, 0, 0], name: 'rosette', edge: 'sharp' })
      .cyl([0.06, 0.03, 0.06], [0.2, 0.93, 0.14], { color: '#d8312a', rot: [80, 0, 0], parent: 'rosette' })
      .box([0.03, 0.1, 0.01], [0.18, 0.85, 0.14], { color: '#e2b23a', rot: [0, 0, 10], parent: 'rosette' })
      .act({ click: [A.par(A.pose('rosette', { rot: [0, 0, 360], dur: 0.8 }), A.effect('sparkle', { dur: 1.5 }), A.say('Ta-da!', 1.2)), A.pose('rosette', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A communications satellite on a display pylon (3.4 m): a gold-foil body, two long solar wings that turn to
  // find the sun, a big dish antenna, thrusters and a blinking beacon. Click: the wings tilt and it beeps.
  e('satellite', 'sky', 'satellites', () => {
    const b = m('satellite', { edge: 'sharp' })
      .cyl([1.0, 0.2, 1.0], [0, 0.1, 0], { color: '#5c6166' })
      .cyl([0.4, 1.1, 0.4], [0, 0.75, 0], { color: '#9da3a8' })
      .box([1.6, 1.8, 1.6], [0, 2.2, 0], { color: '#d9a83a', round: 0.08 })
      .box([1.62, 0.5, 1.62], [0, 2.8, 0], { color: '#e8e4dc', round: 0.08 })
      .ball([0.5, 0.3, 0.3], [0.3, 1.9, 0.8], { color: '#f0c860', noInk: true })
      .dome([1.4, 0.4, 1.4], [0, 2.3, 1.0], { color: 'white', rot: [-90, 0, 0] })
      .rod([0, 2.3, 1.05], [0, 2.3, 1.7], 0.05, '#9da3a8')
      .box([0.16, 0.16, 0.2], [0, 2.3, 1.75], { color: '#5c6166' })
      .stick([0.5, 3.05, 0.5], [0.5, 3.4, 0.5], 0.03, '#9da3a8')
      .ball(0.1, [0.5, 3.42, 0.5], { color: '#ff3a2a', name: 'beacon', mover: { kind: 'light' } });
    b.pair((s) => {
      b.stick([s * 0.8, 2.2, 0], [s * 1.4, 2.2, 0], 0.08, '#9da3a8');
      const nm = s > 0 ? 'panelL' : 'panelR';
      b.box([4.0, 0.05, 1.5], [s * 3.4, 2.2, 0], { color: '#2f3d6a', round: 0.05, name: nm, pivot: [s * 1.4, 2.2, 0], mover: { kind: 'swing', axis: 'x', amount: 50 } });
      b.each(5, (i) => b.box([0.02, 0.06, 1.5], [s * (1.8 + i * 0.8), 2.2, 0], { color: '#c9ccd1', parent: nm, noInk: true }));
      b.box([4.0, 0.06, 0.02], [s * 3.4, 2.2, 0], { color: '#c9ccd1', parent: nm, noInk: true });
      b.cone([0.2, 0.25, 0.2], [s * 0.6, 1.2, 0.6], { color: '#5c6166', rot: [180, 0, 0] });
    });
    return b.act({ click: [A.par(A.operate('panel', 'open'), A.operate('beacon', 'on'), A.say('Beep... beep...', 2)), A.wait(1.5), A.par(A.operate('panel', 'close'), A.operate('beacon', 'off'))] }).done();
  }),
  // A home satellite dish (80 cm) on a pole: a white parabolic reflector, the arm holding the receiver (LNB) out
  // in front, the mounting bracket. Click: it swivels hunting for the signal, then beeps.
  e('satellite dish', 'tech', 'antennas', () =>
    m('satellite dish', { edge: 'sharp' })
      .box([0.4, 0.06, 0.4], [0, 0.03, 0], { color: '#5c6166' })
      .stick([0, 0.06, -0.05], [0, 0.6, -0.05], 0.06, '#9da3a8')
      .box([0.1, 0.12, 0.1], [0, 0.62, -0.02], { color: '#5c6166', name: 'dish', pivot: [0, 0.62, -0.05] })
      .dome([0.8, 0.14, 0.72], [0, 0.68, 0.06], { color: '#f7f5ef', rot: [-120, 0, 0], parent: 'dish' })
      .cyl([0.76, 0.012, 0.68], [0, 0.716, 0.122], { color: '#dcd8d0', rot: [60, 0, 0], parent: 'dish', noInk: true })
      .rod([0, 0.37, 0.24], [0, 0.9, 0.45], 0.025, '#9da3a8', { parent: 'dish' })
      .box([0.07, 0.07, 0.13], [0, 0.92, 0.47], { color: '#3a3633', rot: [-30, 0, 0], parent: 'dish' })
      .act({ click: [A.pose('dish', { rot: [0, 30, 0], dur: 0.6 }), A.pose('dish', { rot: [0, -25, 0], dur: 0.8 }), A.par(A.pose('dish', { rot: [0, 0, 0], dur: 0.5 }), A.say('Beep! Signal!', 1.5))] })
      .done(),
  ),
  // A white gravy boat of rich brown gravy on its saucer, with a handle and a pouring lip. Click: it tips and
  // pours, glug glug.
  e('sauce', 'food', 'sauces', () =>
    m('sauce')
      .cyl([0.24, 0.012, 0.17], [0, 0.006, 0], { color: 'white', edge: 'sharp' })
      .ball([0.18, 0.09, 0.1], [0, 0.055, 0], { color: 'white', name: 'boat', pivot: [0.08, 0.02, 0] })
      .ball([0.16, 0.02, 0.085], [0, 0.093, 0], { color: '#7a4a22', parent: 'boat' })
      .cone([0.06, 0.06, 0.04], [0.105, 0.088, 0], { color: 'white', rot: [0, 0, -70], parent: 'boat' })
      .torus([0.07, 0.07, 0.015], [-0.1, 0.07, 0], { color: 'white', tube: 0.25, parent: 'boat' })
      .act({ click: [A.pose('boat', { rot: [0, 0, -30], dur: 0.5 }), A.say('Glug, glug...', 1.5), A.wait(0.6), A.pose('boat', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A flying saucer (6 m across; the vocabulary's 0.15 m is a teacup saucer, but this one is filed with the
  // UFOs): a silver disc on three landing legs, a ring of lights that never stops turning, a glass dome with a
  // little green pilot, and a tractor beam underneath. Click: it lifts off and beams down; click again, it lands.
  e('saucer', 'sky', 'ufos', () => {
    const b = m('saucer')
      .ball([6, 0.9, 6], [0, 1.6, 0], { color: '#c9ccd1', name: 'ufo' })
      .ball([5.2, 0.6, 5.2], [0, 1.85, 0], { color: '#dfe3e8', parent: 'ufo' })
      .dome([2.2, 1.3, 2.2], [0, 2.7, 0], { color: '#9fd8f0', parent: 'ufo' })
      .ball([0.6, 0.7, 0.6], [0, 2.5, 0], { color: '#7cd04a', parent: 'ufo' })
      .ball([0.6, 0.15, 0.6], [0, 2.6, 0.25], { color: '#2a2726', parent: 'ufo', noInk: true })
      .cyl([1.6, 0.3, 1.6], [0, 1.08, 0], { color: '#9da3a8', parent: 'ufo' })
      .torus([5.9, 5.9, 0.2], [0, 1.6, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.04, name: 'rotorRim', parent: 'ufo' })
      .cone([2.2, 1.0, 2.2], [0, 0.5, 0], { color: '#c8f0a0', glow: true, parent: 'ufo', name: 'beam', scale: 0 });
    b.each(10, (i) => b.ball(0.32, [Math.cos(i * 0.628) * 2.95, 1.6, Math.sin(i * 0.628) * 2.95], { color: i % 2 ? '#f6d24a' : '#ff6a3a', glow: true, parent: 'rotorRim' }));
    b.each(3, (i) => {
      const a = i * 2.094 + 0.5;
      b.rod([Math.cos(a) * 1.3, 1.2, Math.sin(a) * 1.3], [Math.cos(a) * 2.1, 0.15, Math.sin(a) * 2.1], 0.14, '#9da3a8', { parent: 'ufo' }).cyl([0.5, 0.1, 0.5], [Math.cos(a) * 2.1, 0.05, Math.sin(a) * 2.1], { color: '#5c6166', parent: 'ufo' });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('ufo', { move: [0, 2.5, 0], dur: 1.2 }), A.say('Bleep bloop!', 2)), A.pose('beam', { scale: 1.4, dur: 0.4 }), A.effect('sparkle', { dur: 1.5 })],
          [A.pose('beam', { scale: 0, dur: 0.3 }), A.pose('ufo', { move: [0, 0, 0], dur: 1.2 })],
        ],
      })
      .done();
  }),
  // A wooden sauna cabin (3 m x 2.6 m): horizontal pine boards, a shingled gable roof, a stovepipe chimney, a
  // door with a little window, a bench outside with a bucket and ladle. Click: the door opens and steam billows
  // out; then it shuts.
  e('sauna', 'places', 'rooms', () => {
    const w = '#d8b07a';
    const b = m('sauna', { edge: 'sharp' })
      .box([4, 0.15, 3.6], [0, 0.075, 0.3], { color: '#a7a7a0' })
      .box([3.0, 2.2, 2.6], [0, 1.25, 0], { color: w, round: 0.02 })
      .wedge([3.5, 1.1, 3.0], [0, 2.9, 0], { color: '#5a3a22' })
      .stick([0.8, 2.5, -0.6], [0.8, 4.2, -0.6], 0.22, '#5c6166')
      .cyl([0.4, 0.12, 0.4], [0.8, 4.22, -0.6], { color: '#3a3633' });
    b.each(8, (i) => b.box([3.02, 0.03, 2.62], [0, 0.3 + i * 0.27, 0], { color: '#b5814e', noInk: true }));
    door(b, [-0.6, 1.2, 1.33], 0.8, 1.9, '#b5814e', { glass: true, frame: '#8c5a2b' });
    win(b, [0.75, 1.6, 1.33], 0.6, 0.5, { frame: '#8c5a2b' });
    b.label('SAUNA', [1.0, 0.3], [0, 2.48, 1.34], { color: '#f2e6cf', depth: 0.03 });
    b.box([1.2, 0.06, 0.35], [0.8, 0.6, 1.75], { color: '#b5814e' }).pair((s) => b.stick([0.8 + s * 0.5, 0.15, 1.75], [0.8 + s * 0.5, 0.57, 1.75], 0.06, '#8c5a2b'));
    b.cyl([0.3, 0.26, 0.3], [0.6, 0.76, 1.75], { color: '#b5814e', taper: 1.15 }).torus([0.32, 0.32, 0.02], [0.6, 0.7, 1.75], { color: '#5c6166', rot: [90, 0, 0], tube: 0.1, noInk: true }).rod([0.62, 0.9, 1.75], [0.95, 1.15, 1.85], 0.04, '#8c5a2b');
    return b.act({ click: [A.operate('door', 'open'), A.par(A.effect('steam', { dur: 3 }), A.say('Hssssss!', 2)), A.wait(1.5), A.operate('door', 'close')] }).done();
  }),
  // Grilled sausages on a plate (24 cm): three plump browned links with grill marks, a squiggle of mustard and a
  // fork. Click: they sizzle and one hops.
  e('sausage', 'food', 'meat', () => {
    const b = plate(m('sausage'), 0.24);
    [-0.045, 0.0, 0.045].forEach((z, i) => {
      const nm = i === 1 ? 'link' : undefined;
      b.capsule([0.036, 0.15, 0.036], [0.0, 0.036, z], { color: i === 1 ? '#a8502e' : '#9a4a2a', rot: [0, 0, 90], ...(nm ? { name: nm } : {}) });
      b.each(3, (k) => b.box([0.004, 0.003, 0.036], [-0.04 + k * 0.04, 0.054, z], { color: '#4a2414', noInk: true, rot: [0, 30, 0], ...(nm ? { parent: nm } : {}) }));
    });
    b.rod([-0.05, 0.057, -0.03], [-0.02, 0.058, 0.0], 0.007, '#f6c42a', { noInk: true }).rod([-0.02, 0.058, 0.0], [0.02, 0.058, -0.02], 0.007, '#f6c42a', { noInk: true }).rod([0.02, 0.058, -0.02], [0.05, 0.057, 0.03], 0.007, '#f6c42a', { noInk: true });
    b.stick([0.06, 0.02, 0.09], [0.13, 0.02, 0.04], 0.008, '#c9ccd1', { edge: 'sharp' });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5), A.pose('link', { move: [0, 0.03, 0], dur: 0.2 })), A.pose('link', { move: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A hand saw (60 cm) standing in the cut it is making through a plank propped on two blocks: a tapered steel
  // blade with teeth and a closed beech handle with brass screws. Click: it saws back and forth, sawdust flying.
  e('saw', 'workshop', 'hand tools', () => {
    const b = m('saw', { edge: 'sharp' })
      .box([0.12, 0.08, 0.1], [0.0, 0.04, -0.25], { color: '#9a6a3e', round: 0.1 })
      .box([0.12, 0.08, 0.1], [0.0, 0.04, 0.25], { color: '#9a6a3e', round: 0.1 })
      .box([0.6, 0.03, 0.18], [0, 0.095, 0.0], { color: '#d8b07a', round: 0.1, rot: [0, 90, 0] })
      .box([0.006, 0.18, 0.5], [0.0, 0.16, 0.05], { color: '#c9ccd1', round: 0.1, name: 'saw' })
      .wedge([0.006, 0.07, 0.5], [0.0, 0.284, 0.05], { color: '#c9ccd1', rot: [0, 0, 0], parent: 'saw' })
      .box([0.03, 0.14, 0.12], [0.0, 0.28, -0.24], { color: '#b5814e', round: 0.4, rot: [20, 0, 0], parent: 'saw' })
      .torus([0.04, 0.12, 0.065], [0.0, 0.29, -0.25], { color: '#b5814e', rot: [0, 90, 20], tube: 0.35, parent: 'saw' });
    b.pair((s) => b.cyl([0.012, 0.035, 0.012], [0, 0.24 + s * 0.03, -0.18], { color: '#d0a84a', rot: [0, 0, 90], parent: 'saw' }));
    b.each(12, (i) => b.cone([0.008, 0.02, 0.03], [0.0, 0.062, -0.17 + i * 0.038], { color: '#8f99a3', rot: [180, 0, 0], parent: 'saw' }));
    b.each(5, (i) => b.ball([0.02, 0.006, 0.02], [0.05 + (i % 2) * 0.03, 0.003, -0.05 + i * 0.03], { color: '#e8d29a', noInk: true }));
    return b.act({ click: [A.pose('saw', { move: [0, -0.01, -0.12], dur: 0.25 }), A.pose('saw', { move: [0, -0.02, 0.1], dur: 0.25 }), A.pose('saw', { move: [0, -0.03, -0.12], dur: 0.25 }), A.par(A.pose('saw', { move: [0, 0, 0], dur: 0.25 }), A.effect('dust', { dur: 1.2 }), A.say('Zzzip, zzzip!', 1.2))] }).done();
  }),
  // A circular saw blade (25 cm) on a workshop display stand: carbide-tipped teeth, expansion slots and the arbor
  // hole. Click: it whirrs up to speed, throwing sparks, and winds down.
  e('sawblade', 'workshop', 'power tools', () => {
    const b = m('sawblade', { edge: 'sharp' })
      .box([0.22, 0.03, 0.12], [0, 0.015, 0], { color: '#3a3633' })
      .stick([0, 0.03, -0.02], [0, 0.17, -0.02], 0.03, '#5c6166')
      .cyl([0.25, 0.008, 0.25], [0, 0.17, 0], { color: '#c9ccd1', rot: [90, 0, 0], name: 'blade', mover: { kind: 'spin', axis: 'z', amount: 1500 } })
      .cyl([0.07, 0.012, 0.07], [0, 0.17, 0.002], { color: '#9da3a8', rot: [90, 0, 0], parent: 'blade' })
      .cyl([0.022, 0.014, 0.022], [0, 0.17, 0.003], { color: '#2a2726', rot: [90, 0, 0], parent: 'blade' })
      .label('24T', [0.04, 0.015], [0, 0.21, 0.005], { color: '#c9ccd1', depth: 0.002, parent: 'blade' });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      b.box([0.012, 0.018, 0.012], [Math.sin(a) * 0.126, 0.17 + Math.cos(a) * 0.126, 0], { color: '#5c6166', parent: 'blade', rot: [0, 0, (-a * 180) / Math.PI - 25] });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      b.box([0.004, 0.03, 0.01], [Math.sin(a) * 0.09, 0.17 + Math.cos(a) * 0.09, 0.002], { color: '#5c6166', parent: 'blade', rot: [0, 0, (-a * 180) / Math.PI], noInk: true });
    }
    return b.act({ click: [A.operate('blade', 'on'), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Whirrrrr!', 1.5)), A.wait(1), A.operate('blade', 'off')] }).done();
  }),
  // A heap of pale sawdust with curly wood shavings and an offcut of pine. Click: it puffs up in a cloud.
  e('sawdust', 'workshop', 'materials', () => {
    const b = m('sawdust')
      .cyl([0.36, 0.1, 0.3], [0, 0.05, 0], { color: '#e0be82', taper: 0.35, name: 'heap' })
      .ball([0.14, 0.06, 0.12], [0, 0.1, 0], { color: '#e8c890', parent: 'heap' });
    b.each(6, (i) => b.torus([0.045, 0.035, 0.012], surf([0, 0.04, 0], [0.15, 0.035, 0.13], i * 60 + 20, 10), { color: i % 2 ? '#c8985a' : '#d8b07a', rot: [i * 40, i * 70, 0], tube: 0.2 }));
    return b.box([0.12, 0.04, 0.06], [0.18, 0.02, -0.08], { color: '#d8b07a', rot: [0, 25, 0], edge: 'sharp' }).act({ click: [A.par(A.pose('heap', { scale: 1.15, dur: 0.2 }), A.effect('dust', { dur: 1.5 }), A.say('Pfff!', 1)), A.pose('heap', { scale: 1, dur: 0.4 })] }).done();
  }),
  // A carpenter's sawhorse (0.75 m) with splayed legs and braces, a plank across it marked for cutting. Click:
  // the end is sawn off and drops, thunk; click again and a new plank is ready.
  e('sawhorse', 'workshop', 'workbenches', () => {
    const b = m('sawhorse', { edge: 'sharp' }).box([1.0, 0.1, 0.1], [0, 0.72, 0], { color: '#b5814e', round: 0.1 });
    b.pair((s) => b.stick([s * 0.4, 0.7, 0], [s * 0.46, 0, 0.26], 0.06, '#d8b07a').stick([s * 0.4, 0.7, 0], [s * 0.46, 0, -0.26], 0.06, '#d8b07a').box([0.04, 0.06, 0.4], [s * 0.435, 0.3, 0], { color: '#d8b07a' }));
    b.box([1.3, 0.03, 0.2], [0.05, 0.785, 0.0], { color: '#e2c08a', round: 0.1, name: 'plank' })
      .box([0.3, 0.03, 0.2], [0.85, 0.785, 0.0], { color: '#e2c08a', round: 0.1, name: 'end', parent: 'plank', piece: true })
      .box([0.004, 0.032, 0.2], [0.7, 0.786, 0.0], { color: '#2a2726', noInk: true, parent: 'plank' });
    return b.act({ click: [[A.par(A.effect('dust', { dur: 1 }), A.say('Zzzip... thunk!', 1.5)), A.detach('end', 'offcut')], [A.reattach('end'), A.say('Ready!', 1)]] }).done();
  }),
  // A water-powered sawmill (14 m shed): an open-fronted timber shed with a big circular head saw, a log riding
  // on its carriage, an overshot waterwheel turning in its millrace at the side, stacks of sawn boards and a log
  // pile. Click: the wheel and the saw start and the log is cut through.
  e('sawmill', 'places', 'factories', () => {
    const w = '#9a6a3e';
    const b = m('sawmill', { edge: 'sharp' })
      .box([28, 0.2, 20], [0, 0.1, 1], { color: '#8a7a5a', round: 0.01 })
      .box([14, 5, 0.3], [0, 2.7, -4], { color: w })
      .box([0.3, 5, 8], [-7, 2.7, 0], { color: w })
      .box([0.3, 5, 8], [7, 2.7, 0], { color: w })
      .wedge([9.0, 2.6, 15], [0, 6.5, 0], { color: '#5a3a22', rot: [0, 90, 0] })
      .label('SAWMILL', [5, 0.9], [0, 6.0, 4.4], { color: '#f2e6cf', depth: 0.08 });
    b.each(5, (i) => b.box([0.3, 5, 0.3], [-7 + i * 3.5, 2.7, 4], { color: '#7a5230' }));
    b.box([14, 0.3, 0.3], [0, 5.1, 4], { color: '#7a5230' });
    b.pair((s) => b.stick([-6.5, 0.3, 1 + s * 0.6], [6.5, 0.3, 1 + s * 0.6], 0.15, '#8f99a3'));
    b.box([1.4, 1.2, 1.8], [1.5, 0.8, 1], { color: '#5c6166' })
      .cyl([1.8, 0.05, 1.8], [1.5, 1.7, 1.3], { color: '#c9ccd1', rot: [90, 0, 0], name: 'blade', mover: { kind: 'spin', axis: 'z', amount: 720 } });
    b.each(12, (i) => b.box([0.12, 0.16, 0.06], [1.5 + Math.sin(i * 0.5236) * 0.9, 1.7 + Math.cos(i * 0.5236) * 0.9, 1.3], { color: '#8f99a3', rot: [0, 0, -i * 30 - 20], parent: 'blade' }));
    b.box([2.6, 0.3, 1.6], [-3.5, 0.55, 1], { color: '#5c6166', name: 'carriage' })
      .cyl([0.9, 5.5, 0.9], [-3.5, 1.15, 1], { color: '#7a5134', rot: [0, 0, 90], parent: 'carriage' })
      .cyl([0.75, 5.52, 0.75], [-3.5, 1.15, 1], { color: '#e2c08a', rot: [0, 0, 90], parent: 'carriage', noInk: true, scale: 1 });
    b.box([3, 0.8, 1.2], [10, 7.6, -1], { color: '#6a4a30' }).box([2.6, 0.2, 1.0], [10, 7.9, -1], { color: '#4f9bd6' })
      .stick([11.4, 0, -1], [11.4, 7.2, -1], 0.4, '#6a4a30')
      .cyl([5.5, 0.6, 5.5], [8.2, 3.3, -1], { color: '#7a5230', rot: [0, 0, 90], name: 'waterwheel', mover: { kind: 'spin', axis: 'x', amount: 90 } });
    b.each(8, (i) => b.box([0.7, 5.4, 0.35], [8.2, 3.3, -1], { color: '#5a3a22', rot: [i * 22.5, 0, 0], parent: 'waterwheel' }));
    b.box([3, 0.8, 4], [8.6, 0.4, 2.2], { color: '#4f9bd6', edge: 'soft' });
    b.each(4, (r) => b.each(3, (c) => b.box([3.2, 0.18, 0.4], [-9.5, 0.3 + r * 0.2, 6 + c * 0.45], { color: r % 2 ? '#e2c08a' : '#d8b07a', round: 0.1 })));
    for (const [xx, y, z] of [[-10, 0.6, -3], [-10, 0.6, -1.9], [-10, 1.5, -2.45], [-10, 0.6, -4.1]] as V[]) b.cyl([1.0, 4.5, 1.0], [xx, y, z], { color: '#7a5134', rot: [0, 0, 90] }).cyl([0.85, 4.52, 0.85], [xx, y, z], { color: '#e2c08a', rot: [0, 0, 90], noInk: true });
    return b
      .act({ click: [A.par(A.operate('waterwheel', 'on'), A.operate('blade', 'on'), A.say('Bzzzzzzzz!', 2.5)), A.par(A.pose('carriage', { move: [6.5, 0, 0], dur: 2.5 }), A.effect('dust', { dur: 2.5 })), A.par(A.operate('waterwheel', 'off'), A.operate('blade', 'off'), A.pose('carriage', { move: [0, 0, 0], dur: 1.5 }))] })
      .done();
  }),
  // An alto saxophone (70 cm) on its stand: a brass body flaring from the neck to the upturned bell, pearl key
  // touches, rods and pads, a black mouthpiece. Click: it plays a jazzy riff.
  e('saxophone', 'music', 'wind instruments', () => {
    const br = '#d8a83a';
    const b = m('saxophone')
      .box([0.24, 0.02, 0.24], [0, 0.01, 0], { color: '#2a2726', edge: 'sharp' })
      .rod([0.0, 0.02, 0], [0.0, 0.14, 0], 0.03, '#2a2726', { edge: 'sharp' })
      .cyl([0.1, 0.52, 0.1], [0, 0.45, 0], { color: br, taper: 0.55, name: 'sax', pivot: [0, 0.1, 0] })
      .rod([0, 0.19, 0], [0.02, 0.1, 0], 0.1, br, { parent: 'sax' })
      .rod([0.02, 0.1, 0], [0.13, 0.1, 0], 0.1, br, { parent: 'sax' })
      .rod([0.13, 0.1, 0], [0.17, 0.18, 0], 0.1, br, { parent: 'sax' })
      .cyl([0.1, 0.22, 0.1], [0.185, 0.29, 0.01], { color: br, taper: 1.9, rot: [8, 0, -10], parent: 'sax' })
      .torus([0.2, 0.2, 0.02], [0.2, 0.4, 0.025], { color: '#e8c060', rot: [82, 0, 0], tube: 0.1, parent: 'sax' })
      .rod([0, 0.71, 0], [-0.03, 0.8, 0], 0.035, br, { parent: 'sax' })
      .rod([-0.03, 0.8, 0], [-0.12, 0.8, 0], 0.03, br, { parent: 'sax' })
      .capsule([0.028, 0.06, 0.028], [-0.16, 0.8, 0], { color: '#2a2726', rot: [0, 0, 90], parent: 'sax' });
    b.each(6, (i) => b.cyl([0.03, 0.008, 0.03], [0, 0.28 + i * 0.065, 0.045 - i * 0.002], { color: '#f2e6cf', rot: [90, 0, 0], parent: 'sax' }));
    b.stick([0.04, 0.27, 0.035], [0.035, 0.62, 0.03], 0.008, '#c99a3a', { parent: 'sax' });
    b.each(3, (i) => b.cyl([0.036, 0.012, 0.036], [0.05, 0.3 + i * 0.12, 0.0], { color: '#c99a3a', rot: [0, 0, 90], parent: 'sax' }));
    return b.act({ click: [A.par(A.pose('sax', { rot: [0, 0, 8], dur: 0.3 }), A.say('♪ Doo-be-doo-wah! ♪', 2.5)), A.pose('sax', { rot: [0, 0, -6], dur: 0.4 }), A.pose('sax', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // Builder's scaffolding (7 m) against a half-built brick wall: steel tubes, three boarded lifts with guard rails
  // and toe boards, cross braces, a ladder, and a gin wheel at the top hoisting a bucket. Click: the bucket goes
  // up, heave-ho, and comes back down.
  e('scaffold', 'workshop', 'construction', () => {
    const st = '#9da3a8', bw = '#c9a36a';
    const b = m('scaffold', { edge: 'sharp' })
      .box([5.6, 4.6, 0.3], [0, 2.3, -0.75], { color: '#b5543c', round: 0.02 });
    b.each(11, (i) => b.box([5.62, 0.02, 0.31], [0, 0.3 + i * 0.4, -0.75], { color: '#d9c9b0', noInk: true }));
    for (const xx of [-2.5, 0, 2.5]) b.pair((s) => b.stick([xx, 0, s * 0.5 - 0.1], [xx, 7.2, s * 0.5 - 0.1], 0.06, st).box([0.18, 0.02, 0.18], [xx, 0.01, s * 0.5 - 0.1], { color: '#5c6166' }));
    b.each(3, (i) => {
      const y = 2.0 + i * 2.0;
      b.pair((s) => b.stick([-2.5, y, s * 0.5 - 0.1], [2.5, y, s * 0.5 - 0.1], 0.05, st));
      b.box([5.0, 0.05, 0.95], [0, y + 0.05, -0.1], { color: bw, round: 0.1 });
      b.box([5.0, 0.15, 0.03], [0, y + 0.15, 0.4], { color: '#e8c34a', round: 0.1 });
      b.stick([-2.5, y + 1.0, 0.4], [2.5, y + 1.0, 0.4], 0.045, st).stick([-2.5, y + 0.5, 0.4], [2.5, y + 0.5, 0.4], 0.04, st);
      b.stick([-2.5, y - 2.0, 0.4], [0, y, 0.4], 0.04, st);
    });
    b.pair((s) => b.stick([1.2 + s * 0.2, 0, 0.1], [1.2 + s * 0.2, 6.6, -0.2], 0.04, '#b9c2ca'));
    b.each(16, (i) => b.box([0.4, 0.03, 0.04], [1.2, 0.3 + i * 0.4, 0.1 - i * 0.019], { color: '#b9c2ca' }));
    b.stick([-2.5, 7.2, 0.4], [-2.5, 7.2, 1.2], 0.05, st).torus([0.3, 0.3, 0.06], [-2.5, 7.0, 1.2], { color: '#5c6166', rot: [0, 90, 0], tube: 0.25 })
      .stick([-2.5, 6.85, 1.3], [-2.5, 0.9, 1.3], 0.02, '#c9a46a')
      .cyl([0.32, 0.3, 0.32], [-2.5, 0.2, 1.3], { color: '#2a2726', taper: 1.2, name: 'bucket' })
      .arc([0.32, 0.2, 0.02], [-2.5, 0.35, 1.3], { color: '#5c6166', parent: 'bucket' })
      .box([0.6, 0.2, 0.4], [1.0, 2.2, -0.2], { color: '#b5543c', round: 0.1 });
    return b.act({ click: [A.par(A.pose('bucket', { move: [0, 5.2, 0], dur: 2 }), A.say('Heave-ho!', 2)), A.wait(0.5), A.pose('bucket', { move: [0, 0, 0], dur: 1.8 })] }).done();
  }),
  // A brass balance scale (30 cm): a pillar on a wooden base, a pivoting beam with a pointer, two pans hanging on
  // chains, a little weight in one pan. Click: it tips one way, then the other, and settles level.
  e('scale (balance)', 'study', 'lab equipment', () => {
    const br = '#d0a84a';
    const b = m('scale (balance)', { edge: 'sharp' })
      .box([0.24, 0.025, 0.12], [0, 0.0125, 0], { color: '#7a5230', round: 0.2 })
      .stick([0, 0.025, 0], [0, 0.26, 0], 0.016, br)
      .cone([0.04, 0.05, 0.04], [0, 0.045, 0], { color: br })
      .stick([-0.13, 0.26, 0], [0.13, 0.26, 0], 0.012, br, { name: 'beam', pivot: [0, 0.26, 0] })
      .ball(0.025, [0, 0.27, 0], { color: br, parent: 'beam' })
      .stick([0, 0.26, 0.012], [0, 0.18, 0.012], 0.005, '#2a2726', { parent: 'beam' });
    b.pair((s) => {
      b.stick([s * 0.125, 0.26, 0], [s * 0.095, 0.1, 0], 0.003, br, { parent: 'beam' }).stick([s * 0.125, 0.26, 0], [s * 0.155, 0.1, 0], 0.003, br, { parent: 'beam' });
      b.cyl([0.085, 0.012, 0.085], [s * 0.125, 0.095, 0], { color: br, taper: 1.3, parent: 'beam' });
    });
    b.cyl([0.025, 0.03, 0.025], [0.125, 0.115, 0], { color: '#8f99a3', parent: 'beam' }).cyl([0.012, 0.012, 0.012], [0.125, 0.136, 0], { color: '#8f99a3', parent: 'beam' });
    return b.act({ click: [A.pose('beam', { rot: [0, 0, -12], dur: 0.4 }), A.pose('beam', { rot: [0, 0, 9], dur: 0.5 }), A.par(A.pose('beam', { rot: [0, 0, 0], dur: 0.5 }), A.say('Clink!', 1))] }).done();
  }),
  // Fish scales, shown on a little mounted fish (25 cm): rows of overlapping silver-green scales over a lofted
  // body, fins and tail, with one loose scale on the plinth. Click: the scales shimmer.
  e('scale (organic)', 'sea', 'fish parts', () => {
    const b = m('scale (organic)')
      .box([0.24, 0.03, 0.08], [0, 0.015, 0], { color: '#7a5230', round: 0.2, edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.08, 0], 0.012, '#c9ccd1', { edge: 'sharp' })
      .loft([0.05, 0.08, 0.22], [0, 0.13, 0], [[0, 0.2, 0.3], [0.2, 0.8, 0.8], [0.55, 1, 1], [0.9, 0.7, 0.65], [1, 0.3, 0.3]], { color: '#b8ccd4', rot: [0, 90, 0] })
      .loft([0.052, 0.04, 0.2], [0, 0.152, 0], [[0, 0.2, 0.3], [0.2, 0.8, 0.8], [0.55, 1, 1], [0.9, 0.7, 0.65], [1, 0.3, 0.3]], { color: '#3f6a7a', rot: [0, 90, 0], cut: 'top' })
      .wedge([0.012, 0.05, 0.07], [-0.135, 0.13, 0], { color: '#3f6a7a', rot: [0, 90, 90] })
      .wedge([0.06, 0.03, 0.006], [0.0, 0.18, 0], { color: '#3f6a7a', apex: 0.3 })
      .ball(0.014, [0.085, 0.14, 0.021], { color: '#2a2726' })
      .ball(0.006, [0.088, 0.143, 0.027], { color: 'white', noInk: true });
    b.each(3, (r) => b.each(6, (c) => b.cyl([0.026, 0.004, 0.026], [-0.07 + c * 0.026 + (r % 2) * 0.013, 0.16 - r * 0.025, 0.024 - Math.abs(r - 1) * 0.003], { color: r % 2 ? '#9fd0d8' : '#c4e6ee', rot: [90, 0, 0], noInk: true })));
    b.cyl([0.03, 0.003, 0.03], [0.09, 0.032, 0.025], { color: '#d8eef4', rot: [10, 0, 0] });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.anim('wobble'))] }).done();
  }),
  // A bunch of spring onions (35 cm) held with a red band: white bulbs with whiskery roots, long hollow green
  // leaves that droop at the tips. Click: they wave and crunch.
  e('scallion', 'food', 'vegetables', () => {
    const b = m('scallion').ball([0.06, 0.03, 0.05], [0, 0.012, 0], { color: '#f2ece0', name: 'top' });
    b.each(4, (i) => {
      const xx = (i - 1.5) * 0.02;
      b.cyl([0.024, 0.08, 0.024], [xx, 0.05, 0], { color: '#f7f5ef', parent: 'top' }).rod([xx, 0.09, 0], [xx + (i - 1.5) * 0.025, 0.28, (i % 2) * 0.02], 0.013, i % 2 ? '#5aa553' : '#4f9a48', { parent: 'top' });
      b.rod([xx + (i - 1.5) * 0.025, 0.28, (i % 2) * 0.02], [xx + (i - 1.5) * 0.06, 0.34, (i % 2) * 0.04 + 0.03], 0.011, '#6ab04c', { parent: 'top' });
      b.rod([xx, 0.012, 0], [xx + 0.012, 0.0, 0.02], 0.004, '#d9b98a').rod([xx, 0.012, 0], [xx - 0.012, 0.0, -0.015], 0.004, '#d9b98a');
    });
    return b.torus([0.075, 0.035, 0.012], [0, 0.07, 0], { color: '#e0473b', rot: [90, 0, 0], tube: 0.2, parent: 'top' }).act({ click: [A.pose('top', { rot: [0, 0, 10], dur: 0.3 }), A.pose('top', { rot: [0, 0, -8], dur: 0.3 }), A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.3 }), A.say('Crunch!', 1))] }).done();
  }),
  // A surgeon's scalpel (15 cm) stood in its steel instrument stand: a ridged handle and a curved steel blade.
  // Click: it glints under the theatre lights.
  e('scalpel', 'clinic', 'surgery tools', () =>
    m('scalpel', { edge: 'sharp' })
      .box([0.07, 0.03, 0.05], [0, 0.015, 0], { color: '#c9ccd1', round: 0.3 })
      .box([0.016, 0.005, 0.006], [0, 0.032, 0], { color: '#3a3633' })
      .box([0.01, 0.12, 0.004], [0, 0.088, 0], { color: '#b9c2ca', round: 0.3, name: 'scalpel' })
      .box([0.011, 0.04, 0.0045], [0, 0.06, 0], { color: '#9da3a8', round: 0.3, parent: 'scalpel' })
      .wedge([0.012, 0.045, 0.002], [0.002, 0.168, 0], { color: '#e8eef2', apex: -0.45, parent: 'scalpel' })
      .act({ click: [A.par(A.pose('scalpel', { rot: [0, 40, 0], dur: 0.4 }), A.effect('sparkle', { dur: 1.2 }), A.say('Shing!', 1)), A.pose('scalpel', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A flatbed scanner (45 cm): a pale case, a glass bed, a hinged grey lid, a ready light, and a glowing scan
  // bar under the glass. Click: the lid lifts and the bar sweeps the glass with light; click again, the lid
  // closes.
  e('scanner', 'tech', 'computers', () =>
    m('scanner', { edge: 'sharp' })
      .box([0.46, 0.07, 0.33], [0, 0.035, 0], { color: '#d4d7da', round: 0.2 })
      .box([0.38, 0.004, 0.25], [0, 0.071, 0.01], { color: '#9fc6d8', noInk: true })
      .box([0.37, 0.006, 0.02], [0, 0.074, -0.1], { color: '#8af0ff', glow: true, name: 'bar', mover: { kind: 'slide', axis: 'z', amount: 0.22 } })
      .box([0.46, 0.025, 0.33], [0, 0.085, 0.0], { color: '#9da3a8', round: 0.3, name: 'lid', pivot: [0, 0.085, -0.165], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .label('SCAN', [0.06, 0.016], [0.17, 0.035, 0.166], { color: '#d4d7da', depth: 0.002 })
      .ball(0.012, [0.2, 0.05, 0.166], { color: '#7cff6a', glow: true })
      .act({ click: [[A.operate('lid', 'open'), A.operate('bar', 'out'), A.say('Bzzzzt...', 1.5), A.operate('bar', 'in')], [A.operate('lid', 'close'), A.say('Done!', 1)]] })
      .done(),
  ),
  // A scarecrow (1.9 m) on a post in a field: a burlap sack head with a stitched grin, a battered straw hat, a red
  // plaid shirt and patched jeans stuffed with straw sticking out of every cuff, arms out on a crossbar, and a
  // crow perched on one arm. Click: the crow flies off, caw!; click again and it comes back.
  e('scarecrow', 'farm', 'farm things', () => {
    const st = '#e8c95a', sh = '#c0503a';
    const b = m('scarecrow')
      .stick([0, 0, -0.05], [0, 1.7, -0.05], 0.08, '#8c5a2b', { edge: 'sharp' })
      .box([1.4, 0.07, 0.07], [0, 1.3, -0.08], { color: '#8c5a2b', edge: 'sharp' })
      .box([0.44, 0.56, 0.24], [0, 1.1, 0], { color: sh, round: 0.35, name: 'body', pivot: [0, 0.8, 0] })
      .box([0.45, 0.02, 0.245], [0, 1.2, 0], { color: '#7a2a1a', noInk: true, parent: 'body' })
      .box([0.02, 0.56, 0.245], [0.08, 1.1, 0], { color: '#7a2a1a', noInk: true, parent: 'body' })
      .box([0.46, 0.14, 0.26], [0, 0.8, 0], { color: '#4a6fa5', round: 0.3, parent: 'body' })
      .ball([0.27, 0.29, 0.25], [0, 1.54, 0], { color: '#d6b47a', parent: 'body' })
      .torus([0.1, 0.05, 0.03], [0, 1.4, 0.0], { color: '#a8865a', rot: [90, 0, 0], tube: 0.3, parent: 'body' })
      .cyl([0.56, 0.03, 0.56], [0, 1.65, 0], { color: st, rot: [6, 0, -5], parent: 'body' })
      .cyl([0.27, 0.15, 0.27], [0, 1.74, 0], { color: st, taper: 0.82, parent: 'body' })
      .cyl([0.28, 0.04, 0.28], [0, 1.69, 0], { color: '#a3322a', parent: 'body' })
      .arc([0.14, 0.06, 0.012], [0, 1.47, 0.12], { color: '#2a2726', rot: [0, 0, 180], tube: 0.15, parent: 'body' })
      .box([0.08, 0.08, 0.01], [0.1, 0.98, 0.125], { color: '#f6d24a', noInk: true, rot: [0, 0, 20], parent: 'body' });
    b.pair((s) => {
      b.rod([s * 0.2, 1.3, 0], [s * 0.6, 1.3, 0], 0.13, sh, { parent: 'body' });
      b.cone([0.09, 0.14, 0.07], [s * 0.7, 1.3, 0], { color: st, rot: [0, 0, s * -90], parent: 'body' });
      b.rod([s * 0.11, 0.8, 0], [s * 0.13, 0.4, 0.03], 0.14, '#4a6fa5', { parent: 'body' });
      b.cone([0.09, 0.12, 0.07], [s * 0.13, 0.3, 0.03], { color: st, rot: [180, 0, 0], parent: 'body' });
      b.box([0.05, 0.05, 0.01], [s * 0.06, 1.57, 0.12], { color: '#2a2726', rot: [0, 0, 45], noInk: true, parent: 'body' });
      b.box([0.07, 0.07, 0.01], [s * 0.1, 0.55, 0.15], { color: s > 0 ? '#5aa553' : '#f0923b', noInk: true, parent: 'body' });
    });
    b.ball([0.12, 0.1, 0.22], [0.5, 1.42, 0.0], { color: '#2a2726', name: 'crow' })
      .ball(0.08, [0.5, 1.5, 0.08], { color: '#2a2726', parent: 'crow' })
      .cone([0.03, 0.06, 0.03], [0.5, 1.5, 0.15], { color: '#5c6166', rot: [90, 0, 0], parent: 'crow' })
      .box([0.08, 0.02, 0.12], [0.5, 1.43, -0.14], { color: '#2a2726', rot: [20, 0, 0], parent: 'crow' })
      .ball(0.015, [0.53, 1.52, 0.11], { color: '#f6d24a', parent: 'crow' });
    return b
      .act({
        click: [
          [A.par(A.pose('crow', { move: [1.5, 1.8, 0.5], scale: 0.4, dur: 1 }), A.say('Caw! Caw!', 1.5)), A.pose('crow', { scale: 0, dur: 0.2 }), A.pose('body', { rot: [0, 0, 4], dur: 0.4 }), A.pose('body', { rot: [0, 0, 0], dur: 0.4 })],
          [A.pose('crow', { move: [1.5, 1.8, 0.5], scale: 0.4, dur: 0 }), A.par(A.pose('crow', { move: [0, 0, 0], scale: 1, dur: 1 }), A.say('Caw?', 1))],
        ],
      })
      .done();
  }),
  // A long knitted winter scarf in red and white stripes wound round a neck form on a stand, its fringed ends
  // hanging down the front. Click: the ends flutter in a snowy gust.
  e('scarf', 'wardrobe', 'winter wear', () => {
    const r = '#d8312a';
    const b = m('scarf')
      .cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 0.42, 0], 0.04, '#7a5230', { edge: 'sharp' })
      .cyl([0.3, 0.2, 0.2], [0, 0.52, 0], { color: '#f2e6cf', taper: 0.8 })
      .cyl([0.12, 0.2, 0.12], [0, 0.7, 0], { color: '#f2e6cf' })
      .ball([0.2, 0.24, 0.2], [0, 0.88, 0], { color: '#f2e6cf' })
      .torus([0.24, 0.24, 0.12], [0, 0.66, 0], { color: r, rot: [90, 0, 0], tube: 0.38 })
      .torus([0.22, 0.22, 0.1], [0, 0.72, 0], { color: '#f7f5ef', rot: [90, 0, 0], tube: 0.35 });
    b.pair((s) => {
      const nm = s > 0 ? 'endL' : 'endR';
      b.box([0.1, 0.42, 0.03], [s * 0.05, 0.42, 0.11], { color: r, round: 0.3, rot: [0, 0, s * -6], name: nm, pivot: [s * 0.05, 0.63, 0.1] });
      b.each(3, (i) => b.box([0.102, 0.035, 0.032], [s * (0.05 + i * 0.004), 0.3 + i * 0.09, 0.11], { color: '#f7f5ef', round: 0.3, rot: [0, 0, s * -6], noInk: true, parent: nm }));
      b.each(4, (i) => b.stick([s * 0.03 + (i - 1.5) * 0.022, 0.21, 0.11], [s * 0.03 + (i - 1.5) * 0.022, 0.16, 0.11], 0.01, r, { parent: nm }));
    });
    return b.act({ click: [A.par(A.pose('endL', { rot: [-30, 0, 15], dur: 0.4 }), A.pose('endR', { rot: [-25, 0, -10], dur: 0.4 }), A.effect('snow', { dur: 2 })), A.par(A.pose('endL', { rot: [0, 0, 0], dur: 0.6 }), A.pose('endR', { rot: [0, 0, 0], dur: 0.6 }))] }).done();
  }),
  // A royal sceptre (80 cm) resting upright on a red velvet cushion on a gilt stand: a gold shaft with bands, a
  // jewelled collar, an amethyst orb topped with a cross. Click: the orb glows and it sparkles.
  e('scepter', 'fantasy', 'royal things', () =>
    m('scepter')
      .box([0.3, 0.06, 0.3], [0, 0.03, 0], { color: '#d0a84a', edge: 'sharp', round: 0.2 })
      .box([0.26, 0.08, 0.26], [0, 0.1, 0], { color: '#a3222a', round: 0.6 })
      .cyl([0.03, 0.66, 0.03], [0, 0.47, 0], { color: '#e2b23a', edge: 'sharp' })
      .ball(0.05, [0, 0.15, 0], { color: '#e2b23a' })
      .torus([0.06, 0.06, 0.03], [0, 0.35, 0], { color: '#e2b23a', rot: [90, 0, 0], tube: 0.4 })
      .torus([0.06, 0.06, 0.03], [0, 0.6, 0], { color: '#e2b23a', rot: [90, 0, 0], tube: 0.4 })
      .cyl([0.09, 0.07, 0.09], [0, 0.81, 0], { color: '#e2b23a', taper: 1.5, edge: 'sharp' })
      .ball(0.018, [0.04, 0.81, 0.03], { color: '#d0103a' })
      .ball(0.018, [-0.04, 0.81, 0.03], { color: '#2f62d8' })
      .ball(0.12, [0, 0.9, 0], { color: '#8a5fc4', name: 'orb', mover: { kind: 'light' } })
      .box([0.025, 0.1, 0.025], [0, 1.0, 0], { color: '#e2b23a', edge: 'sharp' })
      .box([0.07, 0.025, 0.025], [0, 1.01, 0], { color: '#e2b23a', edge: 'sharp' })
      .act({ click: [A.par(A.operate('orb', 'on'), A.effect('sparkle', { dur: 1.5 }), A.say('Shing!', 1)), A.wait(1), A.operate('orb', 'off')] })
      .done(),
  ),
  // A two-storey brick school (22 m wide): rows of tall windows, a pedimented entrance block with a clock, steps
  // and double doors, a cupola on the roof, a flagpole. Click: the bell rings, the clock hands race round and
  // the doors open.
  e('school', 'places', 'schools', () => {
    const br = '#b8553a', tr = '#f2e6cf';
    const b = m('school', { edge: 'sharp' })
      .box([30, 0.2, 22], [0, 0.1, 2], { color: '#a7a7a0', round: 0.01 })
      .box([22, 8, 12], [0, 4.2, 0], { color: br, round: 0.01 })
      .box([22.4, 0.5, 12.4], [0, 8.4, 0], { color: tr, round: 0.1 })
      .box([22.6, 0.4, 0.1], [0, 4.4, 6.02], { color: tr })
      .box([5.6, 9.6, 1.6], [0, 4.9, 6.6], { color: '#c8654a', round: 0.02 })
      .wedge([6.2, 1.6, 1.8], [0, 10.5, 6.6], { color: tr });
    b.each(8, (i) => {
      const xx = -9.6 + i * 2.75;
      if (Math.abs(xx) < 3.2) return;
      win(b, [xx, 2.4, 6.04], 1.5, 2.2, { frame: tr });
      win(b, [xx, 6.3, 6.04], 1.5, 2.2, { frame: tr });
    });
    door(b, [0, 1.65, 7.43], 1.8, 2.6, '#2f5f9f', { glass: true, frame: tr });
    win(b, [0, 6.3, 7.43], 2.0, 2.2, { frame: tr });
    b.label('SCHOOL', [4, 0.7], [0, 3.6, 7.43], { color: tr, depth: 0.05 })
      .cyl([1.5, 0.15, 1.5], [0, 8.7, 7.42], { color: 'white', rot: [90, 0, 0] })
      .box([0.08, 0.6, 0.04], [0, 8.9, 7.52], { color: '#2a2726', name: 'hand', pivot: [0, 8.7, 7.52] })
      .box([0.35, 0.08, 0.04], [0.15, 8.7, 7.54], { color: '#2a2726' });
    b.each(3, (i) => b.box([6.4 - i * 0.4, 0.2, 1.0 - i * 0.2], [0, 0.3 + i * 0.2, 8.2 - i * 0.2], { color: '#c9c6bd' }));
    b.box([2.2, 2.4, 2.2], [0, 9.8, 0], { color: tr })
      .pyramid([2.6 * Math.SQRT2, 1.6, 2.6 * Math.SQRT2], [0, 11.8, 0], 4, { color: '#3f6a4a' })
      .cone([0.9, 0.8, 0.9], [0, 9.6, 1.15], { color: '#d0a84a', name: 'bell', pivot: [0, 10.2, 1.15] });
    b.stick([-9, 0.2, 9], [-9, 12, 9], 0.14, '#c9ccd1').box([1.8, 1.1, 0.04], [-8.05, 11.3, 9], { color: '#3f6fb5', round: 0.1 });
    return b
      .act({ click: [A.par(A.pose('bell', { rot: [0, 0, 30], dur: 0.25 }), A.pose('hand', { rot: [0, 0, -360], dur: 1 }), A.say('Brrrriiing!', 2)), A.pose('bell', { rot: [0, 0, -30], dur: 0.3 }), A.par(A.pose('bell', { rot: [0, 0, 0], dur: 0.25 }), A.pose('hand', { rot: [0, 0, 0], dur: 0 }), A.operate('door', 'open')), A.wait(2), A.operate('door', 'close')] })
      .done();
  }),
  // A school hand bell's big brother: a brass bell hung in a little oak frame on the teacher's desk (50 cm), with
  // a rope to pull. Click: ding! dong!
  e('school bell', 'study', 'school things', () =>
    m('school bell')
      .box([0.42, 0.06, 0.22], [0, 0.03, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0.16, 0.06, 0], [0.16, 0.48, 0], 0.04, '#9a6a3e', { edge: 'sharp' })
      .stick([-0.16, 0.06, 0], [-0.16, 0.48, 0], 0.04, '#9a6a3e', { edge: 'sharp' })
      .box([0.4, 0.05, 0.06], [0, 0.48, 0], { color: '#9a6a3e', edge: 'sharp' })
      .cyl([0.2, 0.2, 0.2], [0, 0.32, 0], { color: '#d0a84a', taper: 0.55, name: 'bell', pivot: [0, 0.46, 0] })
      .ball([0.11, 0.07, 0.11], [0, 0.42, 0], { color: '#d0a84a', parent: 'bell' })
      .torus([0.21, 0.21, 0.02], [0, 0.225, 0], { color: '#e2b23a', rot: [90, 0, 0], tube: 0.15, parent: 'bell' })
      .ball(0.045, [0, 0.2, 0], { color: '#55595e', parent: 'bell' })
      .stick([0.1, 0.4, 0], [0.12, 0.1, 0.05], 0.012, '#c9a46a', { parent: 'bell' })
      .act({ click: [A.par(A.pose('bell', { rot: [0, 0, 28], dur: 0.25 }), A.say('Ding!', 0.8)), A.par(A.pose('bell', { rot: [0, 0, -28], dur: 0.3 }), A.say('Dong!', 0.8)), A.pose('bell', { rot: [0, 0, 0], dur: 0.25 })] })
      .done(),
  ),
  // A yellow school bus at real size (11 m long, 3.2 m tall): a long box body with a rounded roof, black rub
  // rails, a row of windows, an engine hood loft with a black grille, the SCHOOL BUS sign, red and amber
  // flashers, a folding door, a stop arm that swings out, mirrors and twin rear wheels. Click: it stops for
  // children (lights, stop arm, door); click again it closes up.
  e('school bus', 'garage', 'buses', () => {
    const y = '#f6b81a';
    const b = m('school bus', { view: 'side', edge: 'sharp' })
      .box([2.5, 2.2, 8.6], [0, 1.88, -1.2], { color: y, round: 0.12 })
      .box([2.5, 0.35, 8.6], [0, 2.95, -1.2], { color: y, round: 0.8 })
      .loft([2.1, 1.0, 2.0], [0, 1.45, 4.1], [[0, 1, 1, 0], [0.7, 1, 0.95, 0], [1, 0.9, 0.82, -0.05]], { color: y, boxy: 0.8 })
      .box([1.5, 0.66, 0.05], [0, 1.42, 5.1], { color: '#2a2726', round: 0.1 })
      .box([2.6, 0.3, 0.26], [0, 0.78, 5.18], { color: '#2a2726', round: 0.2 })
      .box([2.6, 0.3, 0.26], [0, 0.78, -5.6], { color: '#2a2726', round: 0.2 })
      .box([2.3, 0.95, 0.06], [0, 2.38, 3.12], { color: '#9fd0ea', rot: [-4, 0, 0] })
      .label('SCHOOL BUS', [1.9, 0.32], [0, 3.0, 3.13], { color: '#2a2726', depth: 0.03 })
      .box([1.6, 0.9, 0.06], [0, 2.3, -5.52], { color: '#9fd0ea' })
      .box([2.2, 0.9, 0.05], [0, 1.4, -5.52], { color: y, round: 0.1 })
      .label('STOP WHEN RED LIGHTS FLASH', [2.0, 0.18], [0, 1.6, -5.55], { color: y, rot: [0, 180, 0], depth: 0.01 });
    b.pair((s) => {
      b.box([0.05, 0.85, 7.4], [s * 1.255, 2.35, -1.35], { color: '#2a2726' });
      b.each(9, (i) => b.box([0.06, 0.66, 0.68], [s * 1.27, 2.36, -4.95 + i * 0.83], { color: '#9fd0ea', round: 0.15 }));
      b.box([0.03, 0.08, 8.6], [s * 1.26, 1.62, -1.2], { color: '#2a2726', noInk: true }).box([0.03, 0.08, 8.6], [s * 1.26, 1.2, -1.2], { color: '#2a2726', noInk: true });
      b.ball([0.28, 0.22, 0.08], [s * 0.8, 1.5, 5.11], { color: '#fff6c8', glow: true });
      b.ball([0.2, 0.2, 0.08], [s * 0.95, 3.05, 3.14], { color: '#e8312a', name: s > 0 ? 'flashL' : 'flashR', mover: { kind: 'light' } });
      b.ball([0.18, 0.18, 0.08], [s * 0.6, 3.05, 3.14], { color: '#ffb020', name: s > 0 ? 'flashAL' : 'flashAR', mover: { kind: 'light' } });
      b.ball([0.2, 0.2, 0.08], [s * 0.95, 3.0, -5.53], { color: '#e8312a', name: s > 0 ? 'flashBL' : 'flashBR', mover: { kind: 'light' } });
      b.arc([1.3, 0.7, 0.4], [s * 1.03, 0.5, 4.1], { color: y, rot: [0, 90, 0], tube: 0.12 });
      b.rod([s * 1.2, 2.6, 3.05], [s * 1.45, 2.5, 3.1], 0.04, '#2a2726').box([0.06, 0.36, 0.2], [s * 1.47, 2.35, 3.1], { color: '#2a2726', round: 0.3 });
    });
    b.box([0.06, 2.0, 0.8], [-1.27, 1.75, 2.6], { color: '#2a2726', round: 0.1, name: 'door', pivot: [-1.27, 1.75, 3.0], mover: { kind: 'swing', axis: 'y', amount: 80 } })
      .box([0.07, 0.8, 0.6], [-1.29, 2.3, 2.6], { color: '#9fd0ea', parent: 'door' })
      .box([0.07, 0.7, 0.6], [-1.29, 1.3, 2.6], { color: '#9fd0ea', parent: 'door' })
      .box([0.5, 0.15, 0.8], [-1.1, 0.75, 2.6], { color: '#2a2726' })
      .prism([0.5, 0.04, 0.5], [1.32, 1.95, 1.8], 8, { color: '#d8312a', rot: [0, 0, 90], name: 'stop', pivot: [1.32, 1.95, 2.08], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .label('STOP', [0.3, 0.12], [1.345, 1.95, 1.8], { color: '#d8312a', rot: [0, 90, 0], depth: 0.01, parent: 'stop' });
    axle(b, 'F', 4.1, 2.1, 1.0, 0.32, '#c9ccd1');
    axle(b, 'B', -3.0, 1.9, 1.0, 0.55, '#c9ccd1');
    return b
      .socket('seat', [0.6, 1.3, 2.5], 'seat')
      .act({
        click: [
          [A.par(A.operate('flash', 'on'), A.operate('stop', 'open'), A.say('Ding ding!', 1.5)), A.operate('door', 'open')],
          [A.operate('door', 'close'), A.par(A.operate('stop', 'close'), A.operate('flash', 'off'), A.say('Beep beep!', 1.2))],
        ],
      })
      .done();
  }),
  // A classroom desk with its chair attached (desk 0.75 m, seat 0.43 m): a lift-up wooden lid over a book box,
  // a pencil groove, steel legs. Click: the lid lifts to show books and a pencil case; click again, it shuts.
  e('school desk', 'study', 'school furniture', () => {
    const st = '#5c6166', lw = '#d8b07a';
    const b = m('school desk', { edge: 'sharp' })
      .box([0.62, 0.14, 0.42], [0, 0.63, 0.15], { color: '#3f6fb5', round: 0.1 })
      .box([0.42, 0.04, 0.38], [0, 0.43, -0.38], { color: lw, round: 0.3 })
      .box([0.42, 0.28, 0.035], [0, 0.66, -0.58], { color: lw, round: 0.3, rot: [-8, 0, 0] })
      .box([0.25, 0.07, 0.18], [-0.12, 0.6, 0.15], { color: '#e0473b', round: 0.1 })
      .box([0.22, 0.05, 0.16], [0.14, 0.59, 0.1], { color: '#5aa553', round: 0.1 })
      .box([0.16, 0.04, 0.06], [0.12, 0.6, 0.27], { color: '#f6d24a', round: 0.5 })
      .box([0.66, 0.035, 0.44], [0, 0.72, 0.15], { color: lw, round: 0.2, name: 'lid', pivot: [0, 0.72, -0.07], mover: { kind: 'swing', axis: 'x', amount: -75 } })
      .box([0.5, 0.008, 0.03], [0, 0.74, -0.04], { color: '#b5814e', parent: 'lid', noInk: true })
      .stick([0.1, 0.745, -0.04], [0.24, 0.745, -0.04], 0.01, '#f6d24a', { parent: 'lid' });
    b.pair((s) => {
      b.stick([s * 0.28, 0, 0.32], [s * 0.28, 0.56, 0.32], 0.035, st).stick([s * 0.28, 0, -0.02], [s * 0.28, 0.56, -0.02], 0.035, st);
      b.stick([s * 0.18, 0, -0.55], [s * 0.18, 0.8, -0.58], 0.03, st).stick([s * 0.18, 0, -0.22], [s * 0.18, 0.42, -0.22], 0.03, st);
      b.stick([s * 0.28, 0.02, 0.32], [s * 0.18, 0.02, -0.55], 0.03, st);
    });
    return b.socket('seat', [0, 0.46, -0.38], 'seat').act({ click: [[A.operate('lid', 'open'), A.say('Creak!', 1)], [A.operate('lid', 'close'), A.say('Thunk!', 1)]] }).done();
  }),
  // A little red one-room schoolhouse (6 m x 9 m): clapboard walls with white corner boards, a steep gable roof,
  // a white belfry with its bell, tall windows, a panelled door up stone steps, and a flagpole. Click: the bell
  // swings, ding-dong, and the door opens.
  e('schoolhouse', 'places', 'schools', () => {
    const rd = '#b0302a', wt = '#f7f5ef';
    const b = m('schoolhouse', { edge: 'sharp' })
      .box([10, 0.15, 13], [0, 0.075, 1], { color: '#8a9a5a' })
      .box([6.4, 0.6, 9.4], [0, 0.3, 0], { color: '#a7a7a0', round: 0.05 })
      .box([6, 3.6, 9], [0, 2.4, 0], { color: rd, round: 0.01 })
      .wedge([6.8, 2.6, 9.6], [0, 5.5, 0], { color: '#4a4c50' });
    b.each(8, (i) => b.box([6.02, 0.03, 9.02], [0, 0.85 + i * 0.42, 0], { color: '#8a2420', noInk: true }));
    b.pair((s) => b.pair((t) => b.box([0.16, 3.6, 0.16], [s * 2.98, 2.4, t * 4.48], { color: wt })));
    b.pair((s) => b.stick([0, 6.8, 4.75], [s * 3.4, 4.2, 4.75], 0.18, wt));
    b.box([1.5, 0.3, 1.5], [0, 6.6, 3.3], { color: wt })
      .box([1.3, 0.25, 1.3], [0, 8.3, 3.3], { color: wt })
      .pyramid([1.7 * Math.SQRT2, 1.4, 1.7 * Math.SQRT2], [0, 9.1, 3.3], 4, { color: '#4a4c50' })
      .cyl([0.7, 0.65, 0.7], [0, 7.75, 3.3], { color: '#d0a84a', taper: 0.55, name: 'bell', pivot: [0, 8.15, 3.3] });
    b.pair((s) => b.pair((t) => b.stick([s * 0.6, 6.7, 3.3 + t * 0.6], [s * 0.6, 8.2, 3.3 + t * 0.6], 0.12, wt)));
    door(b, [0, 1.75, 4.53], 1.2, 2.3, '#7a2a20', { frame: wt });
    b.pair((s) => win(b, [s * 1.9, 2.5, 4.53], 0.9, 1.7, { frame: wt }));
    b.pair((s) => b.each(3, (i) => win(b, [s * 3.03, 2.5, -2.8 + i * 2.8], 0.9, 1.7, { frame: wt, yaw: s * 90 })));
    b.label('SCHOOL', [2.4, 0.45], [0, 4.6, 4.55], { color: wt, depth: 0.04 });
    b.each(2, (i) => b.box([2.2 - i * 0.3, 0.2, 0.5], [0, 0.1 + i * 0.2 + 0.15, 4.95 - i * 0.25], { color: '#c9c6bd' }));
    b.stick([4.2, 0.15, 5], [4.2, 8, 5], 0.1, '#c9ccd1').box([1.4, 0.85, 0.03], [4.95, 7.5, 5], { color: '#d8312a', round: 0.1 });
    return b.act({ click: [A.par(A.pose('bell', { rot: [0, 0, 35], dur: 0.3 }), A.say('Ding!', 0.9)), A.par(A.pose('bell', { rot: [0, 0, -35], dur: 0.35 }), A.say('Dong!', 0.9)), A.pose('bell', { rot: [0, 0, 0], dur: 0.3 }), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')] }).done();
  }),
  // A science museum (20 m wide): a white hall with a tall glass entrance, a silver planetarium dome on the roof,
  // a real-size rocket standing outside and an atom sculpture whose electron rings spin. Click: the rings whirl,
  // sparks fly and the doors open; click again, the rings stop.
  e('science museum', 'places', 'museums', () => {
    const b = m('science museum', { edge: 'sharp' })
      .box([32, 0.2, 24], [0, 0.1, 2], { color: '#c9c6bd', round: 0.01 })
      .box([20, 8, 12], [0, 4.2, 0], { color: '#f2f2ee', round: 0.01 })
      .box([20.4, 0.5, 12.4], [0, 8.4, 0], { color: '#3fa7a0', round: 0.1 })
      .box([8, 6.4, 0.2], [0, 3.4, 6.05], { color: '#5c6166' });
    b.each(4, (i) => b.box([1.9, 6.1, 0.1], [-3 + i * 2, 3.4, 6.18], { color: '#9fd0ea' }));
    door(b, [0, 1.35, 6.25], 1.8, 2.4, '#9fd0ea', { glass: true, frame: '#5c6166' });
    b.label('SCIENCE MUSEUM', [10, 1.0], [0, 7.5, 6.1], { color: '#2f4f8f', depth: 0.06 });
    b.each(3, (i) => b.pair((s) => win(b, [s * (6.5 + i * 1.2), 4.4, 6.04], 0.9, 4.5, { frame: '#3fa7a0', bars: false, sill: false })));
    b.cyl([8.4, 1.2, 8.4], [-4, 9.2, -1.5], { color: '#d4d7da', edge: 'soft' }).dome([8.2, 4.4, 8.2], [-4, 12.0, -1.5], { color: '#c9ccd1', edge: 'soft' }).box([1.0, 4.0, 0.3], [-4, 11.8, 2.4], { color: '#2f3d52', rot: [-40, 0, 0] });
    const rx = 12.5, rz = 7;
    b.cyl([1.7, 11, 1.7], [rx, 6.3, rz], { color: 'white', edge: 'soft' }).cone([1.7, 2.8, 1.7], [rx, 13.2, rz], { color: '#d8312a', edge: 'soft' }).cyl([1.72, 1.2, 1.72], [rx, 9.5, rz], { color: '#2a2726' });
    b.each(4, (i) => b.wedge([0.2, 2.6, 1.6], [rx + Math.sin(i * 1.571) * 1.3, 2.1, rz + Math.cos(i * 1.571) * 1.3], { color: '#d8312a', rot: [0, i * 90 + 90, 0], apex: -0.5 }));
    b.box([2.5, 0.8, 2.5], [rx, 0.6, rz], { color: '#9da3a8' });
    b.box([1.4, 2.4, 1.4], [-10, 1.4, 8], { color: '#9da3a8' })
      .ball(0.9, [-10, 4.2, 8], { color: '#d8312a', name: 'atom', mover: { kind: 'spin', axis: 'y', amount: 120 } });
    for (const r of [0, 60, -60]) b.torus([3.6, 1.6, 0.18], [-10, 4.2, 8], { color: '#e2b23a', rot: [0, 0, r], tube: 0.06, parent: 'atom' });
    return b
      .act({ click: [[A.par(A.operate('atom', 'on'), A.operate('door', 'open'), A.effect('sparkle', { dur: 2 }), A.say('Zap! Whoa!', 1.8)), A.wait(2), A.operate('door', 'close')], [A.operate('atom', 'off'), A.say('Hmmm...', 1)]] })
      .done();
  }),
  // A pair of red-handled scissors (20 cm) stood on their finger loops: two steel blades crossing at the pivot
  // screw. Click: snip, snip!
  e('scissors', 'study', 'stationery', () => {
    const b = m('scissors', { edge: 'sharp' });
    b.pair((s) => {
      const nm = s > 0 ? 'halfL' : 'halfR';
      b.box([0.016, 0.12, 0.004], [-s * 0.016, 0.16, s * 0.003], { color: '#c9ccd1', round: 0.3, rot: [0, 0, s * 14], name: nm, pivot: [0, 0.1, 0] });
      b.wedge([0.016, 0.03, 0.004], [-s * 0.031, 0.232, s * 0.003], { color: '#c9ccd1', rot: [0, 0, s * 14], parent: nm });
      b.rod([0, 0.1, s * 0.003], [s * 0.03, 0.06, s * 0.003], 0.014, '#c9ccd1', { parent: nm });
      b.torus([0.05, 0.065, 0.016], [s * 0.035, 0.035, s * 0.003], { color: '#d8312a', tube: 0.25, parent: nm, edge: 'soft' });
    });
    b.cyl([0.012, 0.014, 0.012], [0, 0.1, 0.0], { color: '#5c6166', rot: [90, 0, 0] });
    const snip = [A.par(A.pose('halfL', { rot: [0, 0, 12], dur: 0.15 }), A.pose('halfR', { rot: [0, 0, -12], dur: 0.15 })), A.par(A.pose('halfL', { rot: [0, 0, -12], dur: 0.12 }), A.pose('halfR', { rot: [0, 0, 12], dur: 0.12 }), A.say('Snip!', 0.6))];
    return b.act({ click: [...snip, ...snip, A.par(A.pose('halfL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('halfR', { rot: [0, 0, 0], dur: 0.15 }))] }).done();
  }),
  // An ice-cream scoop (22 cm) resting on the rim of a tub of strawberry ice cream, a perfect ball in its bowl.
  // Click: the thumb lever pops the scoop of ice cream out; click again, a new one is scooped.
  e('scoop', 'kitchen', 'utensils', () => {
    const b = m('scoop')
      .cyl([0.16, 0.12, 0.13], [0, 0.06, 0], { color: '#f7f5ef', taper: 1.1, edge: 'sharp' })
      .label('STRAWBERRY', [0.1, 0.025], [0, 0.07, 0.069], { color: '#f7f5ef', depth: 0.002 })
      .dome([0.16, 0.025, 0.13], [0, 0.132, 0], { color: '#f4a1c0' })
      .rod([0.03, 0.15, 0.0], [0.19, 0.2, 0.05], 0.018, '#c9ccd1', { name: 'scoop', edge: 'sharp' })
      .dome([0.07, 0.035, 0.07], [0.02, 0.135, -0.005], { color: '#c9ccd1', rot: [180, 0, 0], parent: 'scoop', edge: 'sharp' })
      .ball(0.06, [0.02, 0.165, -0.005], { color: '#f4a1c0', name: 'icecream', parent: 'scoop', piece: true })
      .box([0.01, 0.008, 0.06], [0.1, 0.19, 0.02], { color: '#9da3a8', parent: 'scoop', rot: [0, 20, 15] })
      .capsule([0.03, 0.07, 0.03], [0.17, 0.195, 0.045], { color: '#2a2726', rot: [0, 20, 72], parent: 'scoop' });
    return b.act({ click: [[A.detach('icecream', 'ball'), A.say('Plop!', 1)], [A.reattach('icecream'), A.say('Scoop!', 1)]] }).done();
  }),
  // A kick scooter at real size (handlebar 0.9 m): a grippy deck, a steering column with a T-bar and grips,
  // two polyurethane wheels, a rear foot brake and a kickstand. Click: it rolls off a little and back.
  e('scooter', 'garage', 'bikes', () => {
    const b = m('scooter', { view: 'side', edge: 'sharp' })
      .box([0.14, 0.035, 0.6], [0, 0.11, -0.04], { color: '#3f6fb5', round: 0.4 })
      .box([0.12, 0.004, 0.52], [0, 0.13, -0.04], { color: '#2a2726', noInk: true })
      .rod([0, 0.13, 0.27], [0, 0.18, 0.33], 0.04, '#3f6fb5')
      .rod([0, 0.08, 0.34], [0, 0.88, 0.32], 0.035, '#c9ccd1')
      .stick([-0.22, 0.88, 0.32], [0.22, 0.88, 0.32], 0.03, '#c9ccd1')
      .capsule([0.04, 0.1, 0.04], [0.25, 0.88, 0.32], { color: '#2a2726', rot: [0, 0, 90], edge: 'soft' })
      .capsule([0.04, 0.1, 0.04], [-0.25, 0.88, 0.32], { color: '#2a2726', rot: [0, 0, 90], edge: 'soft' })
      .box([0.08, 0.015, 0.14], [0, 0.17, -0.39], { color: '#5c6166', rot: [-15, 0, 0] })
      .rod([0.06, 0.09, -0.15], [0.12, 0.01, -0.3], 0.012, '#5c6166');
    b.pair((s) => b.stick([s * 0.03, 0.1, 0.34], [s * 0.03, 0.18, 0.33], 0.012, '#c9ccd1'));
    wheel(b, 'wheelF', [0, 0.1, 0.36], 0.2, 0.04, '#f6d24a');
    wheel(b, 'wheelB', [0, 0.1, -0.38], 0.2, 0.04, '#f6d24a');
    return b.act({ click: [A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' }), A.say('Whee!', 1), A.move('self', { rel: 'right', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' })] }).done();
  }),
  // A stadium scoreboard (5.5 m) on two posts: HOME and GUEST scores in glowing digits, the clock, the period,
  // and a horn. Click: the home team scores, horn and all; click again, the score resets.
  e('scoreboard', 'sports', 'stadium things', () => {
    const b = m('scoreboard', { edge: 'sharp' })
      .box([5, 2.6, 0.4], [0, 4.0, 0], { color: '#2a2726', round: 0.05 })
      .box([5.1, 0.3, 0.45], [0, 5.4, 0], { color: '#3f6fb5', round: 0.1 })
      .label('STADIUM', [1.6, 0.24], [0, 5.4, 0.24], { color: '#3f6fb5', depth: 0.02 });
    b.pair((s) => {
      b.box([0.3, 2.8, 0.3], [s * 1.8, 1.4, -0.1], { color: '#5c6166' }).box([0.7, 0.2, 0.7], [s * 1.8, 0.1, -0.1], { color: '#a7a7a0' });
      b.label(s > 0 ? 'GUEST' : 'HOME', [1.3, 0.32], [s * 1.5, 4.95, 0.21], { color: '#2a2726', depth: 0.02 });
      b.box([1.3, 1.0, 0.05], [s * 1.5, 4.0, 0.21], { color: '#3a3633' });
    });
    b.label('2', [0.7, 0.9], [-1.5, 4.0, 0.25], { color: '#ff4a2a', depth: 0.02, name: 'home2' })
      .label('3', [0.7, 0.9], [-1.5, 4.0, 0.25], { color: '#ff4a2a', depth: 0.02, name: 'home3', scale: 0 })
      .label('1', [0.7, 0.9], [1.5, 4.0, 0.25], { color: '#ff4a2a', depth: 0.02 })
      .label('12:00', [1.1, 0.4], [0, 4.5, 0.22], { color: '#f6d24a', depth: 0.02 })
      .label('PERIOD 2', [1.1, 0.25], [0, 3.6, 0.22], { color: '#2a2726', depth: 0.02 })
      .box([0.5, 0.3, 0.3], [0, 3.05, 0.1], { color: '#5c6166' })
      .dome([0.3, 0.25, 0.3], [0, 3.2, 0.2], { color: '#e8312a', name: 'horn', mover: { kind: 'light' } });
    return b
      .act({
        click: [
          [A.par(A.pose('home2', { scale: 0, dur: 0.1 }), A.pose('home3', { scale: 1, dur: 0.1 }), A.operate('horn', 'on'), A.say('BWAAAMP! Goal!', 2), A.effect('sparkle', { dur: 1.5 })), A.wait(1), A.operate('horn', 'off')],
          [A.par(A.pose('home2', { scale: 1, dur: 0.1 }), A.pose('home3', { scale: 0, dur: 0.1 }), A.say('Beep!', 1))],
        ],
      })
      .done();
  }),
  // A putty knife (22 cm) scraping old blue paint off a board: a flexible steel blade with a riveted red handle,
  // curls of paint flaking off. Click: it scrapes, flakes flying.
  e('scraper (tool)', 'workshop', 'hand tools', () => {
    const b = m('scraper (tool)', { edge: 'sharp' })
      .box([0.4, 0.02, 0.25], [0, 0.01, 0], { color: '#d8b07a', round: 0.1 })
      .box([0.24, 0.006, 0.25], [0.08, 0.023, 0], { color: '#4e8fd6', round: 0.1 })
      .box([0.08, 0.002, 0.07], [-0.06, 0.025, 0.02], { color: '#4e8fd6', name: 'knife', pivot: [-0.04, 0.02, 0.02] })
      .box([0.03, 0.02, 0.012], [-0.12, 0.05, 0.02], { color: '#c9ccd1', rot: [0, 0, 25], parent: 'knife' })
      .capsule([0.032, 0.13, 0.026], [-0.19, 0.08, 0.02], { color: '#d8312a', rot: [0, 0, 65], parent: 'knife', edge: 'soft' })
      .box([0.075, 0.003, 0.075], [-0.08, 0.03, 0.02], { color: '#c9ccd1', rot: [0, 0, 25], parent: 'knife' });
    b.each(4, (i) => b.torus([0.02, 0.02, 0.006], [-0.02 + i * 0.03, 0.03, -0.04 + (i % 2) * 0.04], { color: '#4e8fd6', rot: [70, i * 30, 0], tube: 0.3 }));
    return b.act({ click: [A.pose('knife', { move: [0.06, 0, 0], dur: 0.25, times: 2 }), A.par(A.effect('dust', { dur: 1 }), A.say('Scrape!', 1))] }).done();
  }),
  // A screen door (2.1 m) in a porch doorway: a wooden frame with fine mesh panels and a middle rail, a brass
  // pull handle and a closer spring, the house door standing open behind it. Click: it creaks open and slaps
  // shut.
  e('screen door', 'home', 'doors', () => {
    const b = m('screen door', { edge: 'sharp' })
      .box([2.4, 2.6, 0.2], [0, 1.3, -0.1], { color: '#e8dcc4', round: 0.02 })
      .box([1.0, 2.15, 0.05], [0, 1.2, -0.02], { color: '#2a2726' })
      .box([1.4, 0.15, 1.0], [0, 0.075, 0.4], { color: '#b8b5ac', round: 0.05 })
      .box([1.15, 0.1, 0.1], [0, 2.3, 0.04], { color: 'white' })
      .box([0.9, 2.05, 0.04], [0.0, 1.2, 0.08], { color: '#9aa4aa', name: 'door', pivot: [-0.45, 1.2, 0.08], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    b.pair((s) => b.box([0.1, 2.2, 0.1], [s * 0.53, 1.25, 0.04], { color: 'white' }));
    for (const [y, h] of [[0.22, 0.14], [1.1, 0.1], [2.15, 0.1]] as Array<[number, number]>) b.box([0.9, h, 0.05], [0, y, 0.09], { color: '#b5814e', parent: 'door' });
    b.pair((s) => b.box([0.08, 2.05, 0.05], [s * 0.41, 1.2, 0.09], { color: '#b5814e', parent: 'door' }));
    b.each(6, (i) => b.box([0.003, 1.85, 0.01], [-0.3 + i * 0.12, 1.2, 0.085], { color: '#5c6166', noInk: true, parent: 'door' }));
    b.box([0.04, 0.16, 0.05], [0.33, 1.05, 0.13], { color: '#d0a84a', parent: 'door' })
      .stick([-0.3, 1.75, 0.12], [-0.05, 1.82, 0.12], 0.015, '#9da3a8', { parent: 'door' });
    return b.act({ click: [A.operate('door', 'open'), A.say('Creeeak...', 1.2), A.wait(1.2), A.operate('door', 'close'), A.say('Slap!', 1)] }).done();
  }),
  // A wood screw (6 cm, shown big enough to see the thread) half driven into a block of pine: a Phillips cross
  // in its countersunk head, a spiral thread. Click: it turns and sinks in; click again, it backs out.
  e('screw', 'workshop', 'hardware', () => {
    const b = m('screw', { edge: 'sharp' })
      .box([0.12, 0.04, 0.08], [0, 0.02, 0], { color: '#e2c08a', round: 0.1 })
      .cyl([0.022, 0.006, 0.022], [0, 0.0405, 0], { color: '#c9a46a', noInk: true })
      .cyl([0.03, 0.008, 0.03], [0, 0.088, 0], { color: '#c9ccd1', name: 'screw' })
      .cyl([0.03, 0.01, 0.03], [0, 0.079, 0], { color: '#c9ccd1', taper: 0.45, parent: 'screw' })
      .box([0.022, 0.003, 0.004], [0, 0.0925, 0], { color: '#3a3633', parent: 'screw' })
      .box([0.004, 0.003, 0.022], [0, 0.0925, 0], { color: '#3a3633', parent: 'screw' })
      .cyl([0.012, 0.05, 0.012], [0, 0.05, 0], { color: '#c9ccd1', parent: 'screw' });
    b.each(4, (i) => b.torus([0.02, 0.02, 0.003], [0, 0.044 + i * 0.008, 0], { color: '#9da3a8', rot: [82, 0, 0], tube: 0.2, parent: 'screw' }));
    return b.act({ click: [[A.pose('screw', { rot: [0, 720, 0], move: [0, -0.025, 0], dur: 1.2 }), A.say('Squeak!', 1)], [A.pose('screw', { rot: [0, 0, 0], move: [0, 0, 0], dur: 1.2 })]] }).done();
  }),
  // A flat-head screwdriver (24 cm) at work, its tip in the slot of a screw in a wooden block: a fluted red and
  // yellow handle, steel ferrule and shaft. Click: it turns the screw down.
  e('screwdriver', 'workshop', 'hand tools', () => {
    const b = m('screwdriver', { edge: 'sharp' })
      .box([0.1, 0.03, 0.08], [0, 0.015, 0], { color: '#e2c08a', round: 0.1 })
      .cyl([0.025, 0.006, 0.025], [0, 0.033, 0], { color: '#c9ccd1', name: 'screwhead' })
      .box([0.02, 0.003, 0.003], [0, 0.0365, 0], { color: '#3a3633', parent: 'screwhead' })
      .cyl([0.006, 0.09, 0.006], [0, 0.082, 0], { color: '#c9ccd1', name: 'driver' })
      .box([0.01, 0.012, 0.0025], [0, 0.04, 0], { color: '#c9ccd1', parent: 'driver' })
      .cyl([0.012, 0.012, 0.012], [0, 0.132, 0], { color: '#9da3a8', parent: 'driver' })
      .prism([0.036, 0.09, 0.036], [0, 0.183, 0], 6, { color: '#d8312a', parent: 'driver' })
      .cyl([0.038, 0.025, 0.038], [0, 0.155, 0], { color: '#f6d24a', parent: 'driver' })
      .dome([0.034, 0.012, 0.034], [0, 0.234, 0], { color: '#d8312a', parent: 'driver' });
    return b.act({ click: [A.par(A.pose('driver', { rot: [0, 540, 0], move: [0, -0.004, 0], dur: 1.2 }), A.pose('screwhead', { rot: [0, 540, 0], move: [0, -0.004, 0], dur: 1.2 }), A.say('Twist, twist!', 1.2)), A.par(A.pose('driver', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0 }), A.pose('screwhead', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0 }))] }).done();
  }),
  // A parchment scroll (30 cm) hanging open between two turned wooden rollers with gold knobs, lines of
  // writing and a red wax seal on a ribbon. Click: it rolls up; click again, it unrolls.
  e('scroll', 'study', 'paper things', () => {
    const b = m('scroll')
      .box([0.2, 0.24, 0.008], [0, 0.15, 0], { color: '#efdcaa', round: 0.1, name: 'paper', pivot: [0, 0.27, 0] })
      .cyl([0.035, 0.24, 0.035], [0, 0.025, 0], { color: '#7a5230', rot: [0, 0, 90], name: 'roll' })
      .cyl([0.035, 0.24, 0.035], [0, 0.275, 0], { color: '#7a5230', rot: [0, 0, 90] });
    b.pair((s) => b.ball(0.04, [s * 0.13, 0.025, 0], { color: '#e2b23a', parent: 'roll' }).ball(0.04, [s * 0.13, 0.275, 0], { color: '#e2b23a' }));
    b.each(6, (i) => b.box([0.14 - (i % 3) * 0.02, 0.007, 0.003], [-0.01 * (i % 2), 0.235 - i * 0.025, 0.005], { color: '#5a3a22', noInk: true, parent: 'paper' }));
    b.cyl([0.04, 0.008, 0.04], [0.05, 0.075, 0.006], { color: '#a3222a', rot: [90, 0, 0], parent: 'paper' }).box([0.015, 0.06, 0.003], [0.05, 0.04, 0.005], { color: '#d8312a', parent: 'paper' });
    return b.act({ click: [[A.par(A.pose('roll', { move: [0, 0.22, 0], rot: [-600, 0, 0], dur: 0.8 }), A.pose('paper', { scale: 0.1, dur: 0.8 }))], [A.par(A.pose('roll', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 }), A.pose('paper', { scale: 1, dur: 0.8 }))]] }).done();
  }),
  // Teal hospital scrubs on a mannequin (1.75 m): a V-neck tunic with a chest pocket and pen, drawstring
  // trousers, a surgical cap on the head form, and an ID badge that swings. Click: a squeaky-clean sparkle.
  e('scrubs', 'wardrobe', 'workwear', () => {
    const c = '#4fa3a5', dk = '#3a7f80';
    const b = m('scrubs')
      .box([0.3, 0.04, 0.3], [0, 0.02, 0], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.04, -0.05], [0, 0.45, -0.05], 0.03, '#9da3a8', { edge: 'sharp' })
      .cyl([0.46, 0.66, 0.26], [0, 1.2, 0], { color: c, taper: 1.08 })
      .ball([0.48, 0.16, 0.27], [0, 1.52, 0], { color: c })
      .wedge([0.15, 0.17, 0.03], [0, 1.47, 0.12], { color: '#e8e4dc', rot: [0, 0, 180] })
      .box([0.1, 0.1, 0.02], [0.12, 1.32, 0.13], { color: dk, round: 0.2 })
      .stick([0.1, 1.33, 0.142], [0.1, 1.41, 0.142], 0.008, '#3f6fb5')
      .cyl([0.12, 0.1, 0.12], [0, 1.66, 0], { color: '#e8e4dc' })
      .ball([0.2, 0.25, 0.22], [0, 1.83, 0], { color: '#e8e4dc' })
      .dome([0.23, 0.13, 0.25], [0, 1.9, -0.01], { color: dk })
      .stick([-0.12, 1.36, 0.13], [-0.12, 1.24, 0.135], 0.006, '#2a2726', { name: 'badge', pivot: [-0.12, 1.36, 0.13] })
      .box([0.05, 0.07, 0.005], [-0.12, 1.2, 0.138], { color: 'white', parent: 'badge', edge: 'sharp' });
    b.pair((s) => {
      b.rod([s * 0.22, 1.5, 0], [s * 0.3, 1.32, 0.02], 0.13, c);
      b.rod([s * 0.1, 0.9, 0], [s * 0.12, 0.08, 0.02], 0.18, c);
      b.box([0.12, 0.07, 0.24], [s * 0.12, 0.035, 0.05], { color: 'white', round: 0.5 });
    });
    b.stick([0.02, 0.9, 0.13], [0.03, 0.78, 0.135], 0.006, 'white');
    return b.act({ click: [A.par(A.pose('badge', { rot: [0, 0, 25], dur: 0.25, times: 2 }), A.effect('sparkle', { dur: 1.2 }), A.say('Squeaky clean!', 1.5))] }).done();
  }),
  // A diver's scuba set on its stand (1.1 m): a yellow air tank with valve and regulator, a black buoyancy vest,
  // the mask and snorkel hung on top, a depth gauge, and blue fins on the floor. Click: the regulator blows
  // bubbles, blub blub.
  e('scuba gear', 'sports', 'diving', () => {
    const b = m('scuba gear')
      .box([0.5, 0.04, 0.4], [0, 0.02, -0.05], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.04, -0.2], [0, 0.95, -0.2], 0.04, '#9da3a8', { edge: 'sharp' })
      .cyl([0.2, 0.62, 0.2], [0, 0.43, -0.08], { color: '#f6c92e' })
      .dome([0.2, 0.08, 0.2], [0, 0.78, -0.08], { color: '#f6c92e' })
      .cyl([0.05, 0.06, 0.05], [0, 0.84, -0.08], { color: '#c9ccd1', edge: 'sharp' })
      .box([0.1, 0.05, 0.06], [0, 0.88, -0.08], { color: '#2a2726', edge: 'sharp' })
      .box([0.34, 0.52, 0.08], [0, 0.5, 0.06], { color: '#2a2726', round: 0.3 })
      .box([0.36, 0.08, 0.1], [0, 0.32, 0.06], { color: '#3a3633', round: 0.4 })
      .ball([0.12, 0.08, 0.06], [0.1, 0.6, 0.11], { color: '#3f6fb5' })
      .rod([0.05, 0.88, -0.05], [0.2, 0.74, 0.12], 0.025, '#2a2726')
      .ball(0.07, [0.2, 0.72, 0.15], { color: '#5c6166', name: 'regulator' })
      .rod([-0.05, 0.88, -0.05], [-0.2, 0.5, 0.12], 0.02, '#2a2726')
      .cyl([0.07, 0.03, 0.07], [-0.2, 0.47, 0.14], { color: '#2a2726', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.05, 0.032, 0.05], [-0.2, 0.47, 0.145], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.2, 0.08, 0.05], [0, 0.98, -0.16], { color: '#2a2726', round: 0.5 })
      .box([0.17, 0.06, 0.03], [0, 0.98, -0.13], { color: '#9fd0ea', round: 0.5, edge: 'sharp' })
      .rod([0.11, 0.96, -0.16], [0.13, 1.12, -0.17], 0.025, '#f0923b');
    b.pair((s) => b.box([0.17, 0.02, 0.5], [s * 0.13, 0.05, 0.45], { color: '#3f6fb5', round: 0.6, rot: [0, s * 8, 0] }).box([0.13, 0.08, 0.14], [s * 0.13, 0.08, 0.24], { color: '#2a2726', round: 0.5 }));
    return b.act({ click: [A.par(A.pose('regulator', { scale: 1.2, dur: 0.3, times: 2 }), A.effect('water_spray', { dur: 1.5 }), A.say('Blub, blub...', 1.5))] }).done();
  }),
  // A scythe (1.7 m) mowing a patch of long grass: a curved wooden snath with two hand grips and the long curved
  // blade low to the ground. Click: it swings through the grass, swish!
  e('scythe', 'farm', 'farm tools', () => {
    const b = m('scythe')
      .cyl([1.2, 0.06, 0.9], [0, 0.03, 0], { color: '#6ab04c' })
      .rod([0.0, 0.06, 0.2], [0.05, 0.9, 0.05], 0.045, '#9a6a3e', { name: 'scythe', pivot: [0.0, 0.06, 0.15] })
      .rod([0.05, 0.9, 0.05], [0.12, 1.7, -0.05], 0.042, '#9a6a3e', { parent: 'scythe' })
      .rod([0.04, 0.75, 0.06], [0.18, 0.78, 0.12], 0.03, '#7a5230', { parent: 'scythe' })
      .rod([0.1, 1.3, 0.0], [0.24, 1.33, 0.06], 0.03, '#7a5230', { parent: 'scythe' })
      .box([0.34, 0.012, 0.08], [-0.15, 0.12, 0.3], { color: '#c9ccd1', rot: [0, -20, 0], parent: 'scythe', edge: 'sharp' })
      .box([0.3, 0.012, 0.07], [-0.46, 0.12, 0.34], { color: '#c9ccd1', rot: [0, 5, 0], parent: 'scythe', edge: 'sharp' })
      .box([0.24, 0.012, 0.05], [-0.72, 0.12, 0.27], { color: '#c9ccd1', rot: [0, 35, 0], parent: 'scythe', edge: 'sharp' })
      .box([0.86, 0.03, 0.012], [-0.42, 0.13, 0.36], { color: '#9da3a8', rot: [0, 8, 0], parent: 'scythe', edge: 'sharp' });
    b.each(14, (i) => b.cone([0.04, 0.3 + (i % 3) * 0.1, 0.04], [-0.5 + (i % 5) * 0.25, 0.2 + (i % 3) * 0.05, -0.4 + Math.floor(i / 5) * 0.12], { color: i % 2 ? '#5aa553' : '#7cc45a', rot: [(i % 3) * 6 - 6, 0, (i % 4) * 5 - 8] }));
    return b.act({ click: [A.pose('scythe', { rot: [0, -35, 0], dur: 0.3 }), A.par(A.pose('scythe', { rot: [0, 30, 0], dur: 0.4 }), A.effect('dust', { dur: 1 }), A.say('Swish!', 1)), A.pose('scythe', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A spiral sea shell, a whelk (12 cm): a cream body with brown bands winding up to a pointed spire, and a
  // flared pink lip. Click: listen, you can hear the sea.
  e('sea shell', 'sea', 'shells', () => {
    const b = m('sea shell')
      .loft([0.075, 0.07, 0.14], [0, 0.036, 0], [[0, 0.05, 0.05], [0.3, 0.55, 0.55], [0.55, 1, 1], [0.8, 0.85, 0.8], [1, 0.25, 0.2]], { color: '#f2e2c4', rot: [0, 90, 0], name: 'shell' })
      .ball([0.06, 0.03, 0.045], [0.02, 0.05, 0.018], { color: '#f4a1a8', parent: 'shell' })
      .ball([0.045, 0.022, 0.03], [0.02, 0.058, 0.02], { color: '#e8808a', parent: 'shell', noInk: true })
      .cone([0.018, 0.05, 0.016], [0.085, 0.03, 0], { color: '#efdcba', rot: [0, 0, -95], parent: 'shell' });
    b.each(4, (i) => b.torus([0.065 - i * 0.013, 0.06 - i * 0.012, 0.007], [-0.012 - i * 0.014, 0.036, 0], { color: i % 2 ? '#a8764a' : '#c89a6a', rot: [0, 90, 0], tube: 0.12, parent: 'shell', noInk: true }));
    return b.act({ click: [A.par(A.pose('shell', { rot: [0, 0, 10], dur: 0.4, times: 1 }), A.effect('water_spray', { dur: 1.2 }), A.say('Shhhhh... the sea!', 2))] }).done();
  }),
  // A car seat with its seat belt (1.3 m): a padded bucket seat on rails, the B-pillar with the belt reel, the
  // shoulder and lap belt buckled across, and a dashboard warning light. Click: ding-ding, the warning light;
  // click again, click, it is buckled and the light goes out.
  e('seat belt', 'garage', 'car parts', () => {
    const g = '#5c6166';
    const b = m('seat belt')
      .box([0.6, 0.08, 0.7], [0, 0.04, 0.0], { color: '#3a3633', edge: 'sharp' })
      .box([0.56, 0.18, 0.55], [0, 0.32, 0.05], { color: g, round: 0.5 })
      .box([0.5, 0.12, 0.48], [0, 0.44, 0.06], { color: '#7a7f85', round: 0.6 })
      .box([0.54, 0.78, 0.16], [0, 0.86, -0.24], { color: g, round: 0.5, rot: [-10, 0, 0] })
      .box([0.42, 0.6, 0.06], [0, 0.88, -0.15], { color: '#7a7f85', round: 0.6, rot: [-10, 0, 0] })
      .box([0.3, 0.2, 0.12], [0, 1.36, -0.31], { color: g, round: 0.6 })
      .stick([0, 0.08, 0.05], [0, 0.24, 0.05], 0.14, '#2a2726', { edge: 'sharp' })
      .box([0.1, 1.2, 0.12], [0.42, 0.62, -0.32], { color: '#3a3633', edge: 'sharp' })
      .box([0.08, 0.12, 0.08], [0.42, 0.2, -0.24], { color: '#2a2726', edge: 'sharp' })
      .box([0.06, 0.76, 0.015], [0.08, 0.86, -0.09], { color: '#2a2726', rot: [-10, 0, 38] })
      .box([0.48, 0.06, 0.015], [0.0, 0.56, 0.2], { color: '#2a2726' })
      .box([0.07, 0.1, 0.06], [-0.25, 0.53, 0.18], { color: '#2a2726', round: 0.3, edge: 'sharp' })
      .box([0.03, 0.04, 0.02], [-0.25, 0.58, 0.21], { color: '#d8312a', edge: 'sharp' })
      .box([0.06, 0.04, 0.02], [-0.19, 0.56, 0.205], { color: '#c9ccd1', name: 'tongue', edge: 'sharp' })
      .box([0.3, 0.12, 0.12], [0.0, 0.85, 0.6], { color: '#3a3633', round: 0.3, edge: 'sharp' })
      .stick([0, 0.08, 0.6], [0, 0.8, 0.6], 0.06, '#3a3633')
      .box([0.06, 0.05, 0.02], [0.0, 0.86, 0.665], { color: '#e8312a', name: 'lamp', mover: { kind: 'light' }, edge: 'sharp' });
    return b
      .socket('seat', [0, 0.5, 0.05], 'seat')
      .act({ click: [[A.operate('lamp', 'on'), A.say('Ding! Ding! Ding!', 2)], [A.pose('tongue', { move: [-0.03, 0, 0], dur: 0.2 }), A.par(A.operate('lamp', 'off'), A.say('Click!', 1)), A.pose('tongue', { move: [0, 0, 0], dur: 0 })]] })
      .done();
  }),
  // Kelp growing from a rock on the sea floor (1.2 m): long olive stems with leafy blades and round air
  // bladders, swaying with the current. Click: a surge sweeps through it, bubbles rising.
  e('seaweed (plant)', 'sea', 'sea plants', () => {
    const b = m('seaweed (plant)').ball([0.6, 0.3, 0.45], [0, 0.06, 0], { color: '#8f8c86' }).ball([0.3, 0.2, 0.3], [0.2, 0.1, 0.1], { color: '#7a7670' });
    b.rod([0, 0.12, 0], [0.05, 0.55, 0], 0.035, '#8a8f3a').rod([0.05, 0.55, 0], [-0.03, 0.85, 0.02], 0.03, '#8a8f3a', { name: 'top', pivot: [0.05, 0.55, 0] }).rod([-0.03, 0.85, 0.02], [0.06, 1.2, 0], 0.025, '#8a8f3a', { parent: 'top' });
    for (const [xx, y, r] of [[0.09, 0.32, -35], [-0.05, 0.45, 35], [0.12, 0.65, -35], [-0.08, 0.78, 35], [0.08, 0.95, -35], [-0.02, 1.1, 30]] as V[]) b.ball([0.1, 0.22, 0.025], [xx, y, 0.01], { color: y > 0.55 ? '#6a8a2a' : '#5a7a22', rot: [0, 0, r], ...(y > 0.55 ? { parent: 'top' } : {}) });
    for (const [xx, y] of [[0.04, 0.6], [-0.01, 0.9], [0.05, 1.05]] as Array<[number, number]>) b.ball(0.04, [xx, y, 0.03], { color: '#b8a23a', parent: 'top' });
    b.rod([-0.12, 0.12, 0.06], [-0.18, 0.6, 0.07], 0.025, '#6a8a2a', { name: 'top2', pivot: [-0.12, 0.12, 0.06] }).ball([0.08, 0.18, 0.025], [-0.2, 0.48, 0.08], { color: '#7a9a32', rot: [0, 0, 20], parent: 'top2' });
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 18], dur: 0.6, times: 1 }), A.pose('top2', { rot: [0, 0, -15], dur: 0.6, times: 1 }), A.effect('water_spray', { dur: 1.5 }), A.say('Swish...', 1.2))] }).done();
  }),
  // A bullet security camera (CCTV) as it is really seen, high out of reach: on a bracket at the top of a 2.5 m
  // steel pole with a CCTV sign and a junction box: a white housing tipped down, with a sun visor, a dark lens and a
  // red recording light. Click: it pans round to look, light on.
  // Real size: the camera sits at 2.4 m (the tsv's 0.2 m is the camera alone, so the size check may warn).
  e('security camera', 'tech', 'gadgets', () => {
    const P = [0, 2.42, 0.1]; // the swivel at the end of the bracket
    const t = (15 * Math.PI) / 180;
    /** A point in the camera's frame (from the swivel, z along the housing), tipped down 15 degrees. */
    const c = (x: number, y: number, z: number): [number, number, number] => [P[0] + x, P[1] + y * Math.cos(t) - z * Math.sin(t), P[2] + y * Math.sin(t) + z * Math.cos(t)];
    const b = m('security camera', { edge: 'sharp' }).box([0.3, 0.03, 0.3], [0, 0.015, -0.1], { color: '#5c6166', round: 0.1 });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.cyl([0.025, 0.02, 0.025], [x * 0.11, 0.035, -0.1 + z * 0.11], { color: '#3a3e42', segs: 6 });
    b.cyl([0.08, 2.4, 0.08], [0, 1.23, -0.1], { color: '#9da3a8' })
      .cyl([0.09, 0.03, 0.09], [0, 2.445, -0.1], { color: '#7d8388' })
      .box([0.14, 0.2, 0.08], [0, 1.0, -0.02], { color: '#8a9095', round: 0.15 })
      .label('CCTV', [0.24, 0.16], [0, 1.75, -0.05], { color: '#f2c14e', depth: 0.012 })
      .box([0.1, 0.16, 0.03], [0, 2.4, -0.045], { color: 'white', round: 0.2 })
      .rod([0, 2.42, -0.03], [0, 2.42, P[2]], 0.03, 'white')
      .ball(0.04, P as [number, number, number], { color: '#e8e8e4' })
      .rod([0, 2.36, -0.035], [0, 2.2, -0.055], 0.012, '#2a2726')
      .box([0.09, 0.09, 0.26], c(0, 0, 0.13), { color: '#f2f2ee', round: 0.35, rot: [15, 0, 0], name: 'cam', pivot: P as [number, number, number] })
      .box([0.115, 0.012, 0.29], c(0, 0.052, 0.15), { color: '#f2f2ee', rot: [15, 0, 0], parent: 'cam' })
      .cyl([0.078, 0.02, 0.078], c(0, -0.002, 0.265), { color: '#2a2726', rot: [105, 0, 0], parent: 'cam' })
      .cyl([0.05, 0.022, 0.05], c(0, -0.002, 0.268), { color: '#3a5a8a', rot: [105, 0, 0], parent: 'cam' })
      .ball(0.014, c(0.031, 0.032, 0.262), { color: '#ff3a2a', name: 'led', parent: 'cam', mover: { kind: 'light' } });
    return b
      .act({ click: [A.operate('led', 'on'), A.pose('cam', { rot: [0, 40, 0], dur: 0.7 }), A.pose('cam', { rot: [0, -40, 0], dur: 1.2 }), A.par(A.pose('cam', { rot: [0, 0, 0], dur: 0.6 }), A.say('Bzzt. Recording.', 1.5)), A.operate('led', 'off')] })
      .done();
  }),
  // A bean seed sprouting in a little pot cut away to show it: the split seed coat in the dark soil, a root
  // going down and a curled green shoot with two seed leaves. Click: the shoot grows; click again, it settles.
  e('seed', 'garden', 'plant parts', () => {
    const b = m('seed')
      .cyl([0.11, 0.07, 0.11], [0, 0.035, 0], { color: '#c87a4a', taper: 1.2, edge: 'sharp' })
      .cyl([0.12, 0.012, 0.12], [0, 0.072, 0], { color: '#b8693a', edge: 'sharp' })
      .cyl([0.105, 0.01, 0.105], [0, 0.068, 0], { color: '#5a3a22' })
      .ball([0.035, 0.025, 0.026], [0.01, 0.075, 0.02], { color: '#a0683a', rot: [0, 0, 15] })
      .ball([0.02, 0.012, 0.014], [0.018, 0.084, 0.025], { color: '#d8b07a', noInk: true })
      .rod([0.0, 0.08, 0.02], [0.0, 0.11, 0.02], 0.007, '#9be34d', { name: 'sprout', pivot: [0, 0.08, 0.02] })
      .ball([0.025, 0.008, 0.015], [0.014, 0.115, 0.02], { color: '#7cc45a', rot: [0, 0, 30], parent: 'sprout' })
      .ball([0.025, 0.008, 0.015], [-0.012, 0.115, 0.02], { color: '#7cc45a', rot: [0, 0, -30], parent: 'sprout' });
    return b.act({ click: [[A.par(A.pose('sprout', { scale: 1.6, dur: 1 }), A.effect('sparkle', { dur: 1 }))], [A.pose('sprout', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A playground seesaw (3.6 m long): a red fulcrum frame, a long yellow plank with blue seats and handles at
  // each end. Two can sit on it. Click: it goes up and down, whee!
  e('seesaw', 'sports', 'playground', () => {
    const b = m('seesaw', { edge: 'sharp' })
      .box([0.5, 0.08, 0.7], [0, 0.04, 0], { color: '#5c6166' })
      .wedge([0.6, 0.55, 0.12], [0, 0.31, 0.22], { color: '#d8312a' })
      .wedge([0.6, 0.55, 0.12], [0, 0.31, -0.22], { color: '#d8312a' })
      .stick([0, 0.6, -0.3], [0, 0.6, 0.3], 0.08, '#9da3a8')
      .box([3.6, 0.07, 0.3], [0, 0.65, 0], { color: '#f6d24a', round: 0.2, name: 'plank', pivot: [0, 0.6, 0] });
    b.pair((s) => {
      b.box([0.36, 0.06, 0.34], [s * 1.55, 0.71, 0], { color: '#3f6fb5', round: 0.4, parent: 'plank', edge: 'soft' });
      b.stick([s * 1.25, 0.68, -0.12], [s * 1.25, 0.95, -0.12], 0.04, '#3f6fb5', { parent: 'plank' }).stick([s * 1.25, 0.68, 0.12], [s * 1.25, 0.95, 0.12], 0.04, '#3f6fb5', { parent: 'plank' }).stick([s * 1.25, 0.95, -0.14], [s * 1.25, 0.95, 0.14], 0.04, '#3f6fb5', { parent: 'plank' });
      b.cyl([0.3, 0.12, 0.3], [s * 1.6, 0.06, 0], { color: '#2a2726' });
    });
    return b
      .socket('seatL', [1.55, 0.74, 0], 'seat', { part: 'plank' })
      .socket('seatR', [-1.55, 0.74, 0], 'seat', { part: 'plank' })
      .act({ click: [A.pose('plank', { rot: [0, 0, 12], dur: 0.6 }), A.par(A.pose('plank', { rot: [0, 0, -12], dur: 0.8 }), A.say('Whee!', 1.2)), A.pose('plank', { rot: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // An articulated lorry at real size (20 m, 4 m high): a red tractor with a long hood loft, chrome grille and
  // bumper, a sleeper cab with roof fairing, twin exhaust stacks and fuel tanks, and a 15 m white box trailer
  // with landing legs, rear doors and tandem axles. Click: the air horn blasts and the lights come on; click
  // again, the rear doors open to load; then close.
  e('semi trailer', 'garage', 'trucks', () => {
    const rd = '#c8302a', ch = '#c9ccd1';
    const b = m('semi trailer', { view: 'side', edge: 'sharp' })
      .box([2.6, 2.9, 15.0], [0, 2.55, -4.0], { color: '#f2f2ee', round: 0.04 })
      .box([2.62, 0.35, 15.02], [0, 1.4, -4.0], { color: rd })
      .label('FREIGHT CO.', [5, 0.9], [1.32, 2.8, -4.0], { color: '#f2f2ee', rot: [0, 90, 0], depth: 0.02 })
      .label('FREIGHT CO.', [5, 0.9], [-1.32, 2.8, -4.0], { color: '#f2f2ee', rot: [0, -90, 0], depth: 0.02 })
      .box([1.2, 0.3, 14], [0, 0.95, -4.3], { color: '#3a3633' })
      .box([2.4, 0.15, 0.15], [0, 0.65, -11.45], { color: '#3a3633' })
      .box([1.0, 0.3, 7.0], [0, 0.95, 5.3], { color: '#2a2726' })
      .loft([2.2, 1.3, 2.5], [0, 1.85, 7.7], [[0, 1, 1, 0], [0.6, 1, 0.98, 0], [1, 0.88, 0.85, -0.05]], { color: rd, boxy: 0.8, edge: 'soft' })
      .box([1.5, 1.1, 0.06], [0, 1.75, 8.95], { color: ch })
      .box([2.6, 0.32, 0.3], [0, 0.95, 9.05], { color: ch, round: 0.3 })
      .box([2.5, 2.2, 1.8], [0, 2.5, 5.55], { color: rd, round: 0.1 })
      .box([2.3, 0.9, 0.06], [0, 3.0, 6.46], { color: '#9fd0ea', rot: [-8, 0, 0] })
      .box([2.5, 2.4, 1.5], [0, 2.6, 3.95], { color: rd, round: 0.1 })
      .wedge([2.5, 0.6, 3.3], [0, 4.0, 4.8], { color: rd, rot: [0, 90, 0], apex: 0.5 });
    b.each(6, (i) => b.box([1.4, 0.04, 0.03], [0, 1.35 + i * 0.16, 8.99], { color: '#9da3a8', noInk: true }));
    b.pair((s) => {
      b.ball([0.3, 0.24, 0.08], [s * 0.95, 1.85, 8.95], { color: '#fff6c8', name: s > 0 ? 'lightsL' : 'lightsR', mover: { kind: 'light' } });
      b.box([0.06, 0.75, 1.1], [s * 1.26, 3.0, 5.6], { color: '#9fd0ea', round: 0.1 });
      b.box([0.04, 0.05, 0.2], [s * 1.28, 2.4, 5.2], { color: ch });
      b.stick([s * 1.2, 1.4, 4.65], [s * 1.2, 4.4, 4.65], 0.16, ch);
      b.cyl([0.65, 1.4, 0.65], [s * 1.12, 0.95, 5.9], { color: ch, rot: [90, 0, 0] });
      b.rod([s * 1.25, 3.2, 6.3], [s * 1.55, 3.1, 6.4], 0.05, '#2a2726').box([0.08, 0.5, 0.25], [s * 1.58, 2.85, 6.4], { color: '#2a2726', round: 0.3 });
      b.arc([1.3, 0.7, 0.4], [s * 1.05, 0.5, 7.7], { color: rd, rot: [0, 90, 0], tube: 0.12 });
      b.box([0.15, 1.0, 0.15], [s * 0.9, 0.6, 0.5], { color: '#5c6166' }).box([0.3, 0.06, 0.4], [s * 0.9, 0.05, 0.5], { color: '#5c6166' });
      b.box([0.12, 0.2, 0.08], [s * 1.1, 1.1, -11.52], { color: '#e8312a', glow: true });
      const dn = s > 0 ? 'doorL' : 'doorR';
      b.box([1.3, 2.8, 0.05], [s * 0.65, 2.55, -11.53], { color: '#e8e4dc', round: 0.05, name: dn, pivot: [s * 1.3, 2.55, -11.53], mover: { kind: 'swing', axis: 'y', amount: s * -100 } })
        .stick([s * 0.15, 1.3, -11.57], [s * 0.15, 3.8, -11.57], 0.04, '#9da3a8', { parent: dn });
    });
    axle(b, 'F', 7.7, 2.05, 1.0, 0.3, ch);
    axle(b, 'D1', 3.4, 1.85, 1.0, 0.55, ch);
    axle(b, 'D2', 2.1, 1.85, 1.0, 0.55, ch);
    axle(b, 'T1', -9.0, 1.85, 1.0, 0.55, ch);
    axle(b, 'T2', -10.3, 1.85, 1.0, 0.55, ch);
    return b
      .socket('seat', [0.6, 2.1, 5.6], 'seat')
      .act({
        click: [
          [A.par(A.operate('lights', 'on'), A.say('HONK HONK!', 2), A.anim('shake'))],
          [A.operate('door', 'open'), A.wait(2.5), A.par(A.operate('door', 'close'), A.operate('lights', 'off'))],
        ],
      })
      .done();
  }),
  // A septic tank shown in a cut-away bank of earth (4.2 m): the concrete tank buried below the grass, the
  // inlet pipe from the house and the outlet to the field, two access risers with green lids. Click: one lid
  // comes off, pee-yew!; click again, it goes back.
  e('septic tank', 'workshop', 'plumbing', () =>
    m('septic tank', { edge: 'sharp' })
      .box([4.4, 2.0, 2.0], [0, 1.0, -0.5], { color: '#8a6440', round: 0.05 })
      .box([4.42, 0.15, 2.02], [0, 2.05, -0.5], { color: '#6ab04c', round: 0.1 })
      .box([3.0, 1.4, 1.5], [0, 0.85, 0.0], { color: '#9da3a8', round: 0.15 })
      .box([2.8, 1.2, 0.02], [0, 0.85, 0.76], { color: '#7a7f85', noInk: true })
      .box([0.08, 1.0, 0.02], [0, 0.8, 0.77], { color: '#5c6166', noInk: true })
      .box([2.7, 0.5, 0.02], [0, 0.55, 0.775], { color: '#6a5a3a', noInk: true })
      .cyl([0.6, 0.65, 0.6], [-0.8, 1.85, 0], { color: '#5c6166', name: 'riser' })
      .cyl([0.6, 0.65, 0.6], [0.8, 1.85, 0], { color: '#5c6166' })
      .cyl([0.68, 0.08, 0.68], [-0.8, 2.2, 0], { color: '#2e9e4f', name: 'lid', parent: 'riser', piece: true })
      .cyl([0.68, 0.08, 0.68], [0.8, 2.2, 0], { color: '#2e9e4f' })
      .stick([-2.4, 1.25, 0], [-1.5, 1.25, 0], 0.18, '#f7f5ef')
      .stick([1.5, 1.05, 0], [2.4, 1.05, 0], 0.18, '#f7f5ef')
      .act({ click: [[A.detach('lid', 'lid'), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Pee-yew!', 1.5))], [A.reattach('lid'), A.say('Clunk.', 1)]] })
      .done(),
  ),
  // Sequins (8 mm each, real size) in a little glass dish and scattered beside it: shiny cupped discs with a hole
  // in the middle, gold, pink, silver and blue. Click: they glitter.
  e('sequin', 'wardrobe', 'sewing', () => {
    const b = m('sequin')
      .cyl([0.07, 0.015, 0.07], [0, 0.0075, 0], { color: '#cfe8f4', taper: 1.25, edge: 'sharp' });
    const cs = ['#e2b23a', '#f4a1c0', '#c9ccd1', '#6fd3e8', '#d64fa0', '#9be34d'];
    b.each(12, (i) => b.torus([0.009, 0.009, 0.002], [Math.cos(i * 1.7) * 0.024, 0.017 + (i % 3) * 0.002, Math.sin(i * 1.7) * 0.024], { color: cs[i % 6], tube: 0.6, rot: [80 + (i % 4) * 5, i * 30, 0] }));
    b.each(5, (i) => b.torus([0.009, 0.009, 0.002], [0.05 + i * 0.012, 0.001, 0.03 - i * 0.015], { color: cs[(i + 2) % 6], tube: 0.6, rot: [90, 0, 0] }));
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Glitter!', 1.2))] }).done();
  }),
  // A Victorian brick sewer (3.2 m tunnel): an arched brick vault, walkways either side of the channel of murky
  // water, an iron ladder up to the manhole, pipes, and the dark tunnel beyond. Click: a rat scurries past;
  // click again, the manhole cover above clangs open and shut.
  e('sewer (place)', 'places', 'underground', () => {
    const brick = '#8a4a34';
    const b = m('sewer (place)', { edge: 'sharp' })
      .box([4.4, 0.3, 4], [0, 0.15, 0], { color: '#a7a7a0', round: 0.05 })
      .box([3.2, 3.0, 0.1], [0, 1.5, -1.9], { color: '#1e1c1b' })
      .box([1.4, 0.12, 4], [0, 0.34, 0], { color: '#5a7a4a' })
      .box([0.8, 0.45, 4], [1.15, 0.52, 0], { color: '#b8b5ac', round: 0.05 })
      .box([0.8, 0.45, 4], [-1.15, 0.52, 0], { color: '#b8b5ac', round: 0.05 });
    b.pair((s) => b.box([0.4, 2.0, 4], [s * 1.75, 1.3, 0], { color: brick, round: 0.03 }));
    b.each(3, (i) => b.arc([3.9, 3.9, 1.3], [0, 2.2, -1.3 + i * 1.3], { color: i % 2 ? brick : '#9a5440', tube: 0.11 }));
    b.each(6, (i) => b.box([0.42, 0.02, 4.02], [1.75, 0.5 + i * 0.3, 0], { color: '#c9b8a0', noInk: true }).box([0.42, 0.02, 4.02], [-1.75, 0.5 + i * 0.3, 0], { color: '#c9b8a0', noInk: true }));
    b.stick([0.95, 0.75, 1.2], [0.95, 3.9, 1.2], 0.05, '#55595e').stick([1.3, 0.75, 1.2], [1.3, 3.9, 1.2], 0.05, '#55595e');
    b.each(7, (i) => b.stick([0.95, 1.0 + i * 0.4, 1.2], [1.3, 1.0 + i * 0.4, 1.2], 0.04, '#55595e'));
    b.cyl([1.0, 0.4, 1.0], [1.12, 3.9, 1.2], { color: '#5c6166' }).cyl([0.9, 0.08, 0.9], [1.12, 4.14, 1.2], { color: '#3a3633', name: 'cover' });
    b.stick([-1.5, 1.4, -2], [-1.5, 1.4, 2], 0.25, '#7a7f85').stick([-1.45, 1.9, -2], [-1.45, 1.9, 2], 0.15, '#8f99a3');
    b.ball([0.25, 0.12, 0.35], [-1.1, 0.8, 0.6], { color: '#5a7a4a', edge: 'soft' });
    return b
      .act({
        click: [
          [A.spawn('rat', 'rat', { rel: 'left', of: 'self', dist: 'close' }), A.par(A.move('rat', { rel: 'right', of: 'self', dist: 'close' }, { speed: 'run' }), A.say('Squeak!', 1.2, 'rat')), A.remove('rat', 'fade')],
          [A.par(A.pose('cover', { move: [0, 0.3, 0.4], rot: [30, 0, 0], dur: 0.4 }), A.say('Clang!', 1)), A.wait(1), A.pose('cover', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.effect('dust', { dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A wicker sewing basket (26 cm) with its lid hinged open: reels of thread, a tomato pincushion bristling with
  // pins, small scissors and a tape measure. Click: the lid closes; click again, it opens.
  e('sewing kit', 'wardrobe', 'sewing', () => {
    const b = m('sewing kit')
      .box([0.26, 0.08, 0.18], [0, 0.04, 0], { color: '#c9a46a', round: 0.2, edge: 'sharp' })
      .box([0.24, 0.02, 0.16], [0, 0.081, 0], { color: '#a3322a', round: 0.2 })
      .box([0.26, 0.03, 0.18], [0, 0.095, 0.0], { color: '#b8945a', round: 0.3, edge: 'sharp', name: 'lid', pivot: [0, 0.08, -0.09], mover: { kind: 'swing', axis: 'x', amount: -105 } });
    b.each(5, (i) => b.box([0.262, 0.004, 0.182], [0, 0.015 + i * 0.015, 0], { color: '#a8865a', noInk: true }));
    ['#d8312a', '#3f6fb5', '#f6d24a', '#5aa553'].forEach((c, i) => b.cyl([0.03, 0.04, 0.03], [-0.09 + i * 0.035, 0.11, -0.04], { color: c }).cyl([0.036, 0.006, 0.036], [-0.09 + i * 0.035, 0.13, -0.04], { color: '#d8b07a' }).cyl([0.036, 0.006, 0.036], [-0.09 + i * 0.035, 0.09, -0.04], { color: '#d8b07a' }));
    b.ball([0.06, 0.05, 0.06], [0.08, 0.11, 0.035], { color: '#e0473b' }).cyl([0.012, 0.012, 0.012], [0.08, 0.14, 0.035], { color: '#3f7a3a' });
    b.each(3, (i) => b.stick([0.07 + i * 0.01, 0.12, 0.03], [0.065 + i * 0.012, 0.155, 0.04], 0.003, '#c9ccd1').ball(0.008, [0.065 + i * 0.012, 0.155, 0.04], { color: ['#d8312a', '#f6d24a', '#3f6fb5'][i] }));
    b.cyl([0.05, 0.02, 0.05], [-0.05, 0.1, 0.045], { color: '#f6d24a', edge: 'sharp' });
    return b.act({ click: [[A.operate('lid', 'open'), A.say('Creak.', 1)], [A.operate('lid', 'close'), A.say('Pat.', 1)]] }).done();
  }),
  // A domestic sewing machine (42 cm): a cream body arching over the bed, the handwheel, the spool of thread on
  // top, the needle bar and presser foot over a piece of fabric, a light and a stitch dial. Click: the handwheel
  // spins and the needle goes rat-a-tat.
  e('sewing machine', 'wardrobe', 'sewing', () =>
    m('sewing machine', { edge: 'sharp' })
      .box([0.42, 0.05, 0.2], [0, 0.025, 0], { color: '#f2e6cf', round: 0.3 })
      .box([0.1, 0.2, 0.15], [0.14, 0.15, 0], { color: '#f2e6cf', round: 0.3 })
      .box([0.38, 0.08, 0.14], [0.0, 0.27, 0], { color: '#f2e6cf', round: 0.4 })
      .box([0.07, 0.1, 0.1], [-0.15, 0.2, 0], { color: '#f2e6cf', round: 0.3 })
      .box([0.4, 0.012, 0.15], [0, 0.29, 0.0], { color: '#3fa7a0', noInk: true })
      .stick([-0.15, 0.15, 0.02], [-0.15, 0.08, 0.02], 0.006, '#c9ccd1', { name: 'needle', mover: { kind: 'slide', axis: 'y', amount: -0.02 } })
      .box([0.03, 0.008, 0.04], [-0.15, 0.058, 0.03], { color: '#9da3a8' })
      .box([0.2, 0.004, 0.14], [-0.12, 0.052, 0.03], { color: '#e88aa8', round: 0.2, rot: [0, 10, 0] })
      .cyl([0.12, 0.03, 0.12], [0.205, 0.23, 0], { color: '#c9ccd1', rot: [0, 0, 90], name: 'handwheel', mover: { kind: 'spin', axis: 'x', amount: 720 } })
      .box([0.008, 0.1, 0.03], [0.222, 0.23, 0], { color: '#9da3a8', parent: 'handwheel' })
      .stick([0.05, 0.31, 0], [0.05, 0.36, 0], 0.008, '#c9ccd1')
      .cyl([0.03, 0.035, 0.03], [0.05, 0.345, 0], { color: '#d8312a' })
      .cyl([0.04, 0.012, 0.04], [0.14, 0.18, 0.076], { color: '#5c6166', rot: [90, 0, 0] })
      .ball(0.012, [-0.15, 0.235, 0.06], { color: '#fff6c8', glow: true })
      .act({ click: [A.operate('handwheel', 'on'), A.par(A.pose('needle', { move: [0, -0.02, 0], dur: 0.08, times: 8 }), A.say('Rat-a-tat-tat!', 1.5)), A.operate('handwheel', 'off')] })
      .done(),
  ),
  // Iron shackles hanging from a ring on a dungeon post (55 cm): two hinged cuffs with keyholes on a heavy
  // chain. Click: the chain swings and rattles, clank clank!
  e('shackles', 'armory', 'restraints', () => {
    const b = m('shackles', { edge: 'sharp' })
      .box([0.3, 0.04, 0.2], [0, 0.02, -0.06], { color: '#5c6166' })
      .box([0.12, 0.56, 0.12], [0, 0.3, -0.1], { color: '#5a3a22', round: 0.1 })
      .torus([0.07, 0.07, 0.015], [0, 0.5, -0.03], { color: '#55595e', tube: 0.22, rot: [90, 0, 0] })
      .torus([0.04, 0.05, 0.012], [0, 0.46, -0.01], { color: '#55595e', tube: 0.3, name: 'chain', pivot: [0, 0.5, -0.02] });
    b.each(5, (i) => b.torus([0.035, 0.045, 0.01], [0, 0.42 - i * 0.035, -0.01], { color: '#6a6f75', tube: 0.3, rot: [0, i % 2 ? 90 : 0, 0], parent: 'chain' }));
    b.pair((s) => {
      b.rod([0, 0.25, -0.01], [s * 0.09, 0.17, -0.01], 0.012, '#6a6f75', { parent: 'chain' });
      b.torus([0.1, 0.1, 0.025], [s * 0.12, 0.11, -0.01], { color: '#55595e', tube: 0.18, parent: 'chain' });
      b.box([0.03, 0.035, 0.03], [s * 0.12, 0.165, -0.01], { color: '#3a3f45', parent: 'chain' });
    });
    return b.act({ click: [A.pose('chain', { rot: [0, 0, 18], dur: 0.25, times: 2 }), A.par(A.anim('shake'), A.say('Clank, clank!', 1.2))] }).done();
  }),
  // A squeezy bottle of shampoo (22 cm) standing on its flip cap: a teal body with a label, and a heap of foam
  // bubbles beside it. Click: the cap flips open and bubbles froth up; click again, they pop and it shuts.
  e('shampoo', 'home', 'bathroom', () =>
    m('shampoo')
      .box([0.09, 0.18, 0.05], [0, 0.115, 0], { color: '#3fa7a0', round: 0.6, name: 'bottle' })
      .box([0.065, 0.025, 0.045], [0, 0.0125, 0], { color: 'white', round: 0.4, edge: 'sharp' })
      .box([0.07, 0.08, 0.005], [0, 0.12, 0.026], { color: 'white', noInk: true, round: 0.3, parent: 'bottle' })
      .label('SHAMPOO', [0.06, 0.014], [0, 0.14, 0.029], { color: 'white', depth: 0.002, parent: 'bottle' })
      .heart(0.025, [0, 0.105, 0.03], { color: '#f4a1c0', noInk: true, parent: 'bottle' })
      .box([0.06, 0.01, 0.04], [0, 0.002, 0.022], { color: 'white', round: 0.4, name: 'cap', pivot: [0, 0.002, 0.0], mover: { kind: 'swing', axis: 'x', amount: 80 }, edge: 'sharp' })
      .ball(0.04, [0.08, 0.02, 0.03], { color: '#f2fbff', name: 'bubbles' })
      .ball(0.03, [0.1, 0.045, 0.01], { color: '#e8f6ff', parent: 'bubbles' })
      .ball(0.025, [0.065, 0.05, 0.04], { color: '#f2fbff', parent: 'bubbles' })
      .act({ click: [[A.operate('cap', 'open'), A.par(A.pose('bubbles', { scale: 1.6, dur: 0.8 }), A.effect('sparkle', { dur: 1.2 }), A.say('Squish! Bubbles!', 1.5))], [A.par(A.pose('bubbles', { scale: 1, dur: 0.3 }), A.operate('cap', 'close'), A.say('Pop!', 0.8))]] })
      .done(),
  ),
  // An electric rotary shaver (19 cm) in its charging stand: a moulded black grip that waists in and widens to
  // the head, a silver front panel with the power button and a blue charge light, and the trefoil head of three
  // silver cutters with their slotted rings. Click: it buzzes, heads whirring.
  e('shaver', 'home', 'bathroom', () => {
    const b = m('shaver', { edge: 'sharp' })
      .box([0.085, 0.022, 0.075], [0, 0.011, 0], { color: '#3a3633', round: 0.4 })
      .box([0.066, 0.035, 0.05], [0, 0.035, 0], { color: '#3a3633', round: 0.4 })
      .loft([0.056, 0.042, 0.14], [0, 0.09, 0], [[0, 0.78, 0.8, 0], [0.35, 0.72, 0.76, 0], [0.75, 0.95, 0.95, 0], [1, 1, 0.98, 0]], { color: '#2a2726', rot: [-90, 0, 0], boxy: 0.5, edge: 'soft' })
      .box([0.03, 0.07, 0.006], [0, 0.1, 0.0175], { color: '#c9ccd1', round: 0.5 })
      .cyl([0.014, 0.004, 0.014], [0, 0.118, 0.021], { color: '#8f99a3', rot: [90, 0, 0] })
      .ball(0.008, [0, 0.077, 0.0205], { color: '#4ab0ff', name: 'led', mover: { kind: 'light' } })
      .cyl([0.044, 0.016, 0.036], [0, 0.166, 0], { color: '#3a3f44', round: 0.3 })
      .cyl([0.016, 0.01, 0.016], [0, 0.178, 0], { color: '#3a3f44', name: 'heads', mover: { kind: 'spin', axis: 'y', amount: 900 } });
    b.each(3, (i) => {
      const a = i * 2.094 + 1.57, x = Math.cos(a) * 0.019, z = Math.sin(a) * 0.019;
      b.cyl([0.04, 0.018, 0.04], [x, 0.181, z], { color: '#4a4f55', parent: 'heads', edge: 'soft' })
        .cyl([0.03, 0.006, 0.03], [x, 0.192, z], { color: '#c9ccd1', parent: 'heads' })
        .torus([0.022, 0.022, 0.002], [x, 0.1955, z], { color: '#5c6166', rot: [90, 0, 0], tube: 0.12, parent: 'heads', noInk: true })
        .cyl([0.009, 0.007, 0.009], [x, 0.193, z], { color: '#3a3f44', parent: 'heads' });
    });
    return b.act({ click: [A.par(A.operate('heads', 'on'), A.operate('led', 'on')), A.par(A.anim('shake', 2), A.say('Bzzzzzzz!', 1.5)), A.par(A.operate('heads', 'off'), A.operate('led', 'off'))] }).done();
  }),
  // Pruning shears (secateurs, 21 cm) stood on their red handles with a cut twig: a curved bypass blade and
  // anvil hook, the pivot bolt and spring. Click: snip, and the twig end drops; click again, a new twig.
  e('shears', 'garden', 'garden tools', () => {
    const b = m('shears', { edge: 'sharp' });
    b.pair((s) => {
      const nm = s > 0 ? 'halfL' : 'halfR';
      b.rod([s * 0.055, 0.005, 0], [s * 0.012, 0.11, s * 0.003], 0.024, '#d8312a', { name: nm, pivot: [0, 0.13, 0], edge: 'soft' });
      b.rod([s * 0.012, 0.11, s * 0.003], [-s * 0.006, 0.16, s * 0.003], 0.016, '#c9ccd1', { parent: nm });
      b.rod([-s * 0.006, 0.16, s * 0.003], [-s * 0.016, 0.205, s * 0.003], s > 0 ? 0.014 : 0.01, '#c9ccd1', { parent: nm });
    });
    b.cyl([0.016, 0.02, 0.016], [0, 0.13, 0.0], { color: '#5c6166', rot: [90, 0, 0] })
      .torus([0.03, 0.03, 0.006], [0, 0.1, 0.01], { color: '#f6d24a', tube: 0.2 })
      .stick([-0.06, 0.19, 0.02], [0.02, 0.185, 0.02], 0.008, '#7a5134', { name: 'twigbase' })
      .stick([0.02, 0.185, 0.02], [0.08, 0.2, 0.02], 0.007, '#7a5134', { name: 'twig', parent: 'twigbase', piece: true })
      .ball([0.025, 0.006, 0.015], [0.07, 0.2, 0.025], { color: '#5aa553', parent: 'twig' });
    return b
      .act({ click: [[A.par(A.pose('halfL', { rot: [0, 0, -10], dur: 0.12 }), A.pose('halfR', { rot: [0, 0, 10], dur: 0.12 })), A.par(A.say('Snip!', 0.8), A.detach('twig', 'cut')), A.par(A.pose('halfL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('halfR', { rot: [0, 0, 0], dur: 0.15 }))], [A.reattach('twig')]] })
      .done();
  }),
  // A dagger in its leather sheath on a little stand (32 cm): brass chape and locket, the hilt with a cross-guard
  // and pommel showing. Click: the dagger is drawn, shing!; click again, it slides home.
  e('sheath', 'armory', 'swords', () =>
    m('sheath', { edge: 'sharp' })
      .box([0.1, 0.03, 0.08], [0, 0.015, 0], { color: '#7a5230' })
      .cyl([0.05, 0.17, 0.026], [0, 0.115, 0], { color: '#8a5a35', taper: 1.35, edge: 'soft' })
      .cyl([0.032, 0.03, 0.02], [0, 0.045, 0], { color: '#d0a84a' })
      .cyl([0.068, 0.018, 0.034], [0, 0.192, 0], { color: '#d0a84a' })
      .box([0.012, 0.15, 0.006], [0, 0.13, 0], { color: '#c9ccd1', name: 'dagger' })
      .box([0.1, 0.016, 0.026], [0, 0.207, 0], { color: '#d0a84a', parent: 'dagger' })
      .cyl([0.022, 0.065, 0.022], [0, 0.248, 0], { color: '#5a3a22', parent: 'dagger' })
      .ball(0.03, [0, 0.288, 0], { color: '#d0a84a', parent: 'dagger' })
      .act({ click: [[A.pose('dagger', { move: [0, 0.16, 0], dur: 0.35 }), A.say('Shiiing!', 1)], [A.pose('dagger', { move: [0, 0, 0], dur: 0.35 }), A.say('Clack.', 0.8)]] })
      .done(),
  ),
  // A garden shed (2.5 m x 1.9 m, 2.6 m to the ridge): shiplap walls, a green felt gable roof, a ledged-and-
  // braced door, a window with a flower box, a rake leaning by the door. Click: the door creaks open; click
  // again, shut.
  e('shed', 'places', 'sheds', () => {
    const w = '#b5814e';
    const b = m('shed', { edge: 'sharp' })
      .box([3.2, 0.1, 2.8], [0, 0.05, 0.3], { color: '#a7a7a0' })
      .box([2.5, 2.0, 1.9], [0, 1.1, 0], { color: w, round: 0.02 })
      .wedge([2.2, 0.75, 2.9], [0, 2.47, 0], { color: '#3f6a3a', rot: [0, 90, 0] })
      .box([2.95, 0.08, 0.1], [0, 2.08, 1.05], { color: '#7a5230' });
    b.each(9, (i) => b.box([2.52, 0.02, 1.92], [0, 0.25 + i * 0.22, 0], { color: '#9a6a3e', noInk: true }));
    door(b, [-0.55, 0.98, 0.98], 0.85, 1.75, '#c9a36a', { frame: '#7a5230', amount: -100 });
    b.rod([-0.92, 0.3, 1.06], [-0.18, 1.6, 1.06], 0.05, '#9a6a3e', { parent: 'door' });
    win(b, [0.6, 1.4, 0.98], 0.7, 0.6, { frame: 'white' });
    b.box([0.8, 0.18, 0.2], [0.6, 0.98, 1.08], { color: '#a0503a' });
    b.each(4, (i) => b.ball(0.09, [0.33 + i * 0.18, 1.1, 1.1], { color: ['#e0473b', '#f6d24a', '#d64fa0', '#f0923b'][i], edge: 'soft' }));
    b.stick([1.05, 0.1, 1.15], [1.15, 1.55, 1.0], 0.03, '#d8b07a').box([0.32, 0.04, 0.05], [1.05, 0.12, 1.17], { color: '#5c6166' });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creak!', 1)], [A.operate('door', 'close'), A.say('Bang.', 1)]] }).done();
  }),
  // Sheet music open on a wooden tabletop music stand (40 cm): two pages of staves with notes and a pencil on the
  // ledge. Click: a page turns and a tune plays.
  e('sheet music', 'music', 'music things', () => {
    const b = m('sheet music', { edge: 'sharp' })
      .box([0.46, 0.02, 0.22], [0, 0.01, -0.02], { color: '#7a5230', round: 0.2 })
      .box([0.04, 0.3, 0.02], [0, 0.15, -0.1], { color: '#7a5230', rot: [20, 0, 0] })
      .box([0.5, 0.34, 0.015], [0, 0.2, 0.0], { color: '#9a6a3e', rot: [-20, 0, 0], round: 0.1 })
      .box([0.5, 0.03, 0.05], [0, 0.04, 0.07], { color: '#7a5230', rot: [-20, 0, 0] });
    const tilt = Math.tan(20 * D2R);
    const page = (x: number, o: { name?: string; pivot?: V; mover?: { kind: 'swing'; axis: 'y'; amount: number } }) => {
      b.box([0.22, 0.29, 0.004], [x, 0.205, 0.012], { color: '#faf6ea', rot: [-20, 0, 0], ...o });
      const par = o.name ? { parent: o.name } : {};
      b.each(4, (i) => {
        const y = 0.3 - i * 0.06;
        b.box([0.18, 0.003, 0.002], [x, y, 0.016 - (y - 0.205) * tilt], { color: '#2a2726', noInk: true, rot: [-20, 0, 0], ...par });
        b.each(3, (k) => b.ball([0.012, 0.009, 0.003], [x - 0.06 + k * 0.05, y + ((k + i) % 3) * 0.008 - 0.008, 0.018 - (y - 0.205) * tilt], { color: '#2a2726', noInk: true, rot: [-20, 0, -20], ...par }));
      });
    };
    page(-0.115, { name: 'left' });
    page(0.115, { name: 'page', pivot: [0, 0.205, 0.012], mover: { kind: 'swing', axis: 'y', amount: 170 } });
    b.stick([0.05, 0.075, 0.085], [0.2, 0.075, 0.085], 0.008, '#f6d24a');
    return b.act({ click: [A.operate('page'), A.say('♪ La la la ♪', 2)] }).done();
  }),
  // A scallop shell (10 cm) that opens: two fan-shaped valves of radiating ribs with little ears at the hinge,
  // and inside a pearl. Click: it opens to show the pearl; click again, it closes.
  e('shell (sea)', 'sea', 'shells', () => {
    const c1 = '#f2c8a8', c2 = '#e8a080';
    const b = m('shell (sea)')
      .box([0.045, 0.012, 0.018], [0, 0.008, -0.04], { color: c2, round: 0.3 })
      .ball(0.022, [0, 0.022, 0.0], { color: '#f7f2ea', name: 'pearl' })
      .box([0.045, 0.012, 0.018], [0, 0.022, -0.04], { color: c2, round: 0.3, name: 'lid', pivot: [0, 0.016, -0.045], mover: { kind: 'swing', axis: 'x', amount: -65 } });
    b.dome([0.1, 0.012, 0.085], [0, 0.006, 0.0], { color: c1 })
      .dome([0.1, 0.022, 0.085], [0, 0.027, 0.0], { color: c1, parent: 'lid' });
    b.each(9, (i) => {
      const a = (-60 + i * 15) * D2R, c = i % 2 ? c2 : '#f6dcc4';
      b.ball([0.01, 0.008, 0.06], [Math.sin(a) * 0.035, 0.009, -0.035 + Math.cos(a) * 0.035], { color: c, rot: [0, a / D2R, 0], noInk: true });
      b.ball([0.01, 0.01, 0.06], [Math.sin(a) * 0.035, 0.032, -0.035 + Math.cos(a) * 0.035], { color: c, rot: [-6, a / D2R, 0], parent: 'lid', noInk: true });
    });
    return b.act({ click: [[A.operate('lid', 'open'), A.effect('sparkle', { dur: 1.2 })], [A.operate('lid', 'close'), A.say('Clap!', 1)]] }).done();
  }),
  // Rainbow sherbet in a glass coupe (15 cm): scoops of orange, raspberry and lime sherbet, a fan wafer and a
  // long spoon. Click: the spoon dips in for a taste.
  e('sherbet', 'food', 'desserts', () =>
    m('sherbet')
      .cyl([0.07, 0.01, 0.07], [0, 0.005, 0], { color: '#cfe8f4', edge: 'sharp' })
      .stick([0, 0.01, 0], [0, 0.05, 0], 0.014, '#cfe8f4')
      .cyl([0.065, 0.035, 0.065], [0, 0.066, 0], { color: '#cfe8f4', taper: 1.8 })
      .ball(0.055, [-0.025, 0.1, 0.01], { color: '#f0923b' })
      .ball(0.055, [0.025, 0.1, 0.0], { color: '#f4a1c0' })
      .ball(0.05, [0, 0.135, -0.005], { color: '#9be34d' })
      .wedge([0.05, 0.05, 0.008], [-0.02, 0.165, -0.03], { color: '#e8c36a', rot: [0, 30, 0], edge: 'sharp' })
      .stick([0.03, 0.12, 0.03], [0.08, 0.22, 0.06], 0.006, '#c9ccd1', { name: 'spoon', pivot: [0.08, 0.22, 0.06], edge: 'sharp' })
      .ball([0.018, 0.006, 0.026], [0.028, 0.118, 0.028], { color: '#c9ccd1', parent: 'spoon' })
      .act({ click: [A.pose('spoon', { rot: [-25, 0, 15], move: [0, 0.03, 0.02], dur: 0.5 }), A.say('Yum!', 1), A.pose('spoon', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A sheriff's cowboy hat (real size): a tan felt crown pinched at the front, a brim curled up at the sides, a
  // leather band with a gold star. Click: it tips politely, howdy!
  e('sheriff hat', 'wardrobe', 'hats', () => {
    const t = '#c9a46a';
    const b = m('sheriff hat')
      .ball([0.42, 0.035, 0.34], [0, 0.03, 0], { color: t, name: 'hat', pivot: [0, 0.0, -0.17] })
      .cyl([0.2, 0.1, 0.18], [0, 0.1, 0], { color: t, taper: 0.88, parent: 'hat' })
      .ball([0.2, 0.06, 0.18], [0, 0.15, 0], { color: t, parent: 'hat' })
      .box([0.03, 0.03, 0.08], [0, 0.17, 0.0], { color: '#a8865a', round: 0.5, parent: 'hat', noInk: true })
      .cyl([0.205, 0.026, 0.185], [0, 0.065, 0], { color: '#5a3a22', parent: 'hat' })
      .star(0.06, [0, 0.1, 0.095], { color: '#e2b23a', parent: 'hat' });
    b.pair((s) => b.capsule([0.06, 0.3, 0.05], [s * 0.19, 0.07, 0], { color: t, rot: [90, 0, 0], parent: 'hat' }));
    return b.act({ click: [A.pose('hat', { rot: [-20, 0, 0], dur: 0.3 }), A.say('Howdy!', 1.2), A.pose('hat', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A knight's heater shield (90 cm) leaning on a little stand: a steel rim, a blue field with a gold cross, a
  // central boss, and leather straps on the back. Click: clang! something glances off it.
  e('shield', 'armory', 'shields', () =>
    m('shield', { edge: 'sharp' })
      .box([0.4, 0.04, 0.3], [0, 0.02, -0.12], { color: '#7a5230' })
      .box([0.76, 0.52, 0.08], [0, 0.66, 0], { color: '#c9ccd1', round: 0.15, rot: [-8, 0, 0] })
      .wedge([0.76, 0.48, 0.08], [0, 0.17, 0.03], { color: '#c9ccd1', rot: [-8, 0, 180] })
      .box([0.68, 0.46, 0.06], [0, 0.66, 0.02], { color: '#2f5f9f', round: 0.15, rot: [-8, 0, 0] })
      .wedge([0.68, 0.42, 0.06], [0, 0.2, 0.05], { color: '#2f5f9f', rot: [-8, 0, 180] })
      .box([0.1, 0.78, 0.02], [0, 0.5, 0.06], { color: '#e2b23a', noInk: true, rot: [-8, 0, 0] })
      .box([0.6, 0.1, 0.02], [0, 0.66, 0.05], { color: '#e2b23a', noInk: true, rot: [-8, 0, 0] })
      .dome([0.14, 0.05, 0.14], [0, 0.6, 0.07], { color: '#e2b23a', rot: [82, 0, 0] })
      .box([0.08, 0.3, 0.03], [0, 0.6, -0.06], { color: '#5a3a22', round: 0.3, rot: [-8, 0, 0] })
      .act({ click: [A.par(A.anim('shake'), A.effect('sparkle', { dur: 0.8 }), A.say('Clang!', 1))] })
      .done(),
  ),
  // A roofing sample on a stand (40 cm): a sloping board covered in overlapping rows of grey asphalt shingles
  // with their tab slots, and a loose shingle on top. Click: the loose one flaps up in the wind and settles.
  e('shingle', 'workshop', 'building materials', () => {
    const b = m('shingle', { edge: 'sharp' }).wedge([0.4, 0.25, 0.36], [0, 0.125, 0], { color: '#d8b07a', apex: -0.5 });
    const ang = (-Math.atan2(0.25, 0.4) * 180) / Math.PI;
    for (const [t, c] of [[0.2, '#5c6166'], [0.47, '#6c7176'], [0.74, '#5c6166']] as Array<[number, string]>) {
      b.box([0.17, 0.014, 0.38], [-0.2 + 0.4 * t + 0.53 * 0.012, 0.25 - 0.25 * t + 0.85 * 0.012, 0], { color: c, rot: [0, 0, ang], round: 0.1 });
      b.each(3, (i) => b.box([0.12, 0.016, 0.006], [-0.2 + 0.4 * t + 0.01, 0.25 - 0.25 * t + 0.012, -0.12 + i * 0.12], { color: '#2a2726', rot: [0, 0, ang], noInk: true }));
    }
    b.box([0.17, 0.012, 0.13], [0.0, 0.16, 0.05], { color: '#7c8186', rot: [0, 0, ang], round: 0.1, name: 'loose', pivot: [-0.07, 0.2, 0.05] });
    return b.act({ click: [A.pose('loose', { rot: [0, 0, 45], dur: 0.3 }), A.pose('loose', { rot: [0, 0, 10], dur: 0.25, times: 2 }), A.par(A.pose('loose', { rot: [0, 0, 0], dur: 0.3 }), A.say('Flap!', 1))] }).done();
  }),
  // A shipyard (built at 40 m): a cargo ship's hull on keel blocks on the slipway, primer red below and grey
  // above, scaffolding along its side, a huge yellow gantry crane straddling it with a travelling trolley and
  // hook, stacks of steel plate, and the water at the end of the slip. Click: the trolley rolls across with a
  // plate and the welders' sparks fly; click again, it rolls back.
  e('shipyard', 'places', 'harbour', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.7, 0.8, 0], [0.2, 1, 1, 0], [0.8, 1, 1, 0], [1, 0.08, 0.9, 0.05]];
    const b = m('shipyard', { edge: 'sharp' })
      .box([36, 0.4, 32], [0, 0.2, 0], { color: '#a7a7a0', round: 0.01 })
      .box([36, 0.2, 6], [0, 0.12, 18], { color: '#4f9bd6' })
      .box([10, 0.3, 30], [0, 0.45, 0], { color: '#8f8c86', rot: [-2, 0, 0] });
    b.each(8, (i) => b.box([1.0, 1.0, 1.0], [0, 1.0, -11 + i * 3.2], { color: '#7a5230' }));
    b.loft([6.4, 8.6, 26], [0, 5.8, 0], prof, { color: '#a3322a', cut: 'bottom', boxy: 0.6 })
      .loft([6.42, 3.0, 26.02], [0, 5.8, 0], prof, { color: '#7a7f85', cut: 'bottom', boxy: 0.6 })
      .loft([6.0, 8.62, 24.8], [0, 5.82, -0.4], prof, { color: '#9da3a8', cut: 'bottom', boxy: 0.6 })
      .label('HULL 207', [4, 0.9], [3.22, 4.4, -2], { color: '#a3322a', rot: [0, 90, 0], depth: 0.04 });
    b.each(5, (i) => b.stick([4.2, 0.4, -10 + i * 5], [4.2, 6.8, -10 + i * 5], 0.12, '#c9ccd1'));
    b.each(3, (i) => b.box([0.9, 0.08, 21], [4.2, 2.2 + i * 2.2, 0], { color: '#c9a36a' }));
    b.pair((s) => b.pair((t) => b.box([1.2, 18, 1.2], [s * 9, 9.4, t * 5], { color: '#f6c92e' })));
    b.pair((t) => b.box([20, 1.6, 1.6], [0, 18.8, t * 5], { color: '#f6c92e' }));
    b.pair((s) => b.box([2.4, 1.2, 12], [s * 9, 0.9, 0], { color: '#f6c92e' }));
    b.box([3.2, 2.2, 12.2], [5, 17.0, 0], { color: '#e8a02a', name: 'trolley', mover: { kind: 'slide', axis: 'x', amount: -6 } })
      .stick([5, 15.9, 0], [5, 9.0, 0], 0.1, '#2a2726', { parent: 'trolley' })
      .box([3.0, 0.15, 2.0], [5, 8.8, 0], { color: '#5c6166', parent: 'trolley' })
      .label('SHIPYARD', [8, 1.2], [0, 18.8, 5.82], { color: '#2a2726', depth: 0.05 });
    b.each(4, (i) => b.box([4, 0.25, 2], [-13, 0.53 + i * 0.26, 6], { color: '#7a7f85' }));
    b.box([6, 2.6, 2.4], [-12, 1.7, -8], { color: '#3f6fb5' }).box([6, 2.6, 2.4], [-12, 1.7, -10.6], { color: '#d8312a' }).box([6, 2.6, 2.4], [-12, 4.3, -9.3], { color: '#5aa553' });
    return b
      .act({ click: [[A.par(A.operate('trolley', 'out'), A.say('Clang! Clang!', 2)), A.effect('sparkle', { dur: 2 })], [A.operate('trolley', 'in'), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A cotton T-shirt on a hanger hanging from a hook stand (1.6 m): crew neck, short sleeves, a star print.
  // Click: it swings on its hanger.
  e('shirt', 'wardrobe', 'shirts', () => {
    const c = '#4e8fd6';
    const b = m('shirt')
      .cyl([0.36, 0.03, 0.36], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.03, -0.08], [0, 1.66, -0.08], 0.035, '#3a3633', { edge: 'sharp' })
      .arc([0.1, 0.06, 0.012], [0, 1.62, -0.04], { color: '#3a3633', rot: [0, 90, 0], arc: 220, tube: 0.2, edge: 'sharp' })
      .rod([-0.2, 1.5, -0.02], [0.2, 1.5, -0.02], 0.018, '#d8b07a', { name: 'shirt', pivot: [0, 1.62, -0.04], edge: 'sharp' })
      .box([0.5, 0.66, 0.16], [0, 1.14, 0], { color: c, round: 0.35, parent: 'shirt' })
      .torus([0.17, 0.09, 0.04], [0, 1.45, 0.04], { color: '#2f4f8f', rot: [80, 0, 0], tube: 0.25, parent: 'shirt' })
      .star(0.18, [0, 1.12, 0.085], { color: 'white', noInk: true, round: 0.01, parent: 'shirt' });
    b.pair((s) => b.rod([s * 0.22, 1.4, 0], [s * 0.36, 1.24, 0], 0.15, c, { parent: 'shirt' }));
    return b.act({ click: [A.pose('shirt', { rot: [0, 0, 12], dur: 0.4, times: 2 }), A.say('Swish!', 1)] }).done();
  }),
  // A canvas sneaker (28 cm, real size): a white rubber sole and toe cap, a red upper with a side stripe, white
  // laces through eyelets, a padded tongue and heel tab. Click: squeak! it hops.
  e('shoe', 'wardrobe', 'shoes', () => {
    const b = sneaker(m('shoe'), 0, '#d8312a');
    b.box([0.004, 0.03, 0.12], [0.046, 0.06, -0.01], { color: 'white', round: 0.4, rot: [-10, 0, 0], noInk: true });
    return b.act({ click: [A.par(A.anim('hop'), A.say('Squeak!', 1))] }).done();
  }),
  // A tin of black shoe polish with its lid off, a shoe brush and a polishing cloth, beside a brown leather shoe
  // being shined. Click: the brush buffs back and forth and the shoe gleams.
  e('shoe polish', 'wardrobe', 'shoes', () => {
    const b = m('shoe polish')
      .cyl([0.08, 0.025, 0.08], [-0.12, 0.0125, 0.06], { color: '#c9ccd1', edge: 'sharp' })
      .cyl([0.074, 0.004, 0.074], [-0.12, 0.026, 0.06], { color: '#2a2726' })
      .cyl([0.082, 0.012, 0.082], [-0.13, 0.04, -0.02], { color: '#d8312a', rot: [60, 0, 0], edge: 'sharp' })
      .box([0.16, 0.06, 0.1], [0.1, 0.03, 0.08], { color: '#f2e6cf', round: 0.6 })
      .box([0.15, 0.035, 0.05], [0.0, 0.11, 0.0], { color: '#9a6a3e', round: 0.4, name: 'brush', edge: 'sharp' })
      .box([0.14, 0.03, 0.045], [0.0, 0.085, 0.0], { color: '#2a2726', round: 0.2, parent: 'brush' });
    b.loft([0.1, 0.09, 0.27], [0.0, 0.0, -0.05], [[0, 0.8, 0.9, 0.3], [0.3, 1, 1, 0.3], [0.75, 0.95, 0.6, 0.2], [1, 0.6, 0.35, 0.1]], { color: '#7a4a2a', boxy: 0.5, cut: 'top', rot: [0, 90, 0] });
    return b.act({ click: [A.pose('brush', { move: [0.05, 0, 0], dur: 0.15, times: 3 }), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Shine!', 1))] }).done();
  }),
  // A shoe shop (6.5 m frontage): white walls with a red trim, shoes on display in the windows, a red-and-white
  // awning, and a giant blue sneaker on the roof as its sign. Click: the door opens with a ding and the big
  // sneaker hops.
  e('shoe store', 'places', 'shops', () => {
    const b = shop('shoe store', { w: 6.5, h: 4.4, d: 7, wall: '#f2f2ee', trim: '#d8312a', sign: 'SHOES', signBg: '#d8312a', awning: ['#d8312a', 'white'], door: '#d8312a' });
    b.each(4, (i) => b.box([0.36, 0.16, 0.6], [(i < 2 ? -2.5 : 1.4) + (i % 2) * 0.7, 0.95, 3.4], { color: ['#3f6fb5', '#f0923b', '#2a2726', '#5aa553'][i], round: 0.5 }));
    b.box([0.2, 0.6, 0.2], [0, 4.85, 1.5], { color: '#5c6166', name: 'sign', pivot: [0, 4.6, 1.5] });
    sneaker(b, 0, '#3f6fb5', 9, 5.1, 1.5, 'sign');
    return b.act({ click: [A.par(A.operate('door', 'open'), A.say('Ding!', 1), A.pose('sign', { move: [0, 0.6, 0], dur: 0.2, times: 2 })), A.wait(2), A.operate('door', 'close')] }).done();
  }),
  // An orange shoebox (34 cm) holding a new pair of shoes in tissue paper. Click: the lid comes off to show them;
  // click again, it goes back on.
  e('shoebox', 'wardrobe', 'shoes', () => {
    const b = m('shoebox', { edge: 'sharp' })
      .box([0.34, 0.12, 0.21], [0, 0.06, 0], { color: '#f0923b', round: 0.05, name: 'box' })
      .box([0.3, 0.01, 0.18], [0, 0.1, 0], { color: '#f7f5ef', parent: 'box' })
      .label('SHOES', [0.1, 0.03], [0, 0.06, 0.106], { color: '#f0923b', depth: 0.003, parent: 'box' })
      .box([0.35, 0.04, 0.22], [0, 0.14, 0], { color: '#e8822a', round: 0.05, name: 'lid', parent: 'box', piece: true });
    sneaker(b, 0.07, '#5aa553', 0.55, 0.095, 0.0);
    sneaker(b, -0.07, '#5aa553', 0.55, 0.095, 0.0);
    return b.act({ click: [[A.detach('lid', 'lid'), A.say('Ta-da!', 1)], [A.reattach('lid'), A.say('Pop.', 0.8)]] }).done();
  }),
  // A brass shoehorn (20 cm) tucked into the heel of a brown leather shoe. Click: it slides out, shoop!; click
  // again and it goes back in.
  e('shoehorn', 'wardrobe', 'shoes', () => {
    const b = m('shoehorn');
    b.loft([0.1, 0.09, 0.27], [0.0, 0.0, 0.0], [[0, 0.8, 0.9, 0.3], [0.3, 1, 1, 0.3], [0.75, 0.95, 0.6, 0.2], [1, 0.6, 0.35, 0.1]], { color: '#6a3a1a', boxy: 0.5, cut: 'top' })
      .box([0.06, 0.012, 0.08], [0, 0.07, 0.04], { color: '#4a2a14', round: 0.4 })
      .box([0.055, 0.12, 0.012], [0, 0.1, -0.12], { color: '#d0a84a', round: 0.5, rot: [-8, 0, 0], name: 'horn', edge: 'sharp' })
      .box([0.028, 0.08, 0.012], [0, 0.19, -0.13], { color: '#d0a84a', round: 0.5, parent: 'horn', edge: 'sharp' })
      .torus([0.035, 0.035, 0.012], [0, 0.24, -0.135], { color: '#d0a84a', tube: 0.3, parent: 'horn' });
    return b.act({ click: [[A.pose('horn', { move: [0, 0.12, -0.03], dur: 0.4 }), A.say('Shoop!', 1)], [A.pose('horn', { move: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A pair of long white shoelaces (1 m) hanging from a peg on a little stand, tied in a bow at the top, with
  // black plastic aglets on the ends. Click: they swing.
  e('shoelace', 'wardrobe', 'shoes', () => {
    const b = m('shoelace')
      .cyl([0.2, 0.04, 0.2], [0, 0.02, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.04, -0.03], [0, 0.62, -0.03], 0.025, '#9a6a3e', { edge: 'sharp' })
      .rod([0, 0.58, -0.03], [0, 0.58, 0.04], 0.02, '#9a6a3e')
      .ball(0.03, [0, 0.58, 0.035], { color: 'white', name: 'laces', pivot: [0, 0.58, 0.035] });
    b.pair((s) => {
      b.torus([0.1, 0.07, 0.012], [s * 0.05, 0.61, 0.035], { color: 'white', rot: [0, 0, s * 25], tube: 0.18, parent: 'laces' });
      b.rod([s * 0.01, 0.57, 0.04], [s * 0.04, 0.34, 0.06], 0.012, 'white', { parent: 'laces' }).rod([s * 0.04, 0.34, 0.06], [s * 0.03, 0.1, 0.05], 0.012, 'white', { parent: 'laces' });
      b.capsule([0.016, 0.035, 0.016], [s * 0.03, 0.09, 0.05], { color: '#2a2726', parent: 'laces' });
    });
    return b.act({ click: [A.pose('laces', { rot: [0, 0, 15], dur: 0.35, times: 2 }), A.say('Swish!', 1)] }).done();
  }),
  // A pair of brown leather Oxford shoes (28 cm): polished toe caps, laced fronts, stacked heels. Click: they tap
  // a little dance, left, right.
  e('shoes', 'wardrobe', 'shoes', () => {
    const b = m('shoes');
    b.pair((s) => {
      const nm = s > 0 ? 'shoeL' : 'shoeR', x = s * 0.07;
      b.loft([0.1, 0.09, 0.28], [x, 0.0, 0], [[0, 0.8, 0.9, 0.3], [0.3, 1, 1, 0.3], [0.75, 0.95, 0.6, 0.2], [1, 0.6, 0.35, 0.1]], { color: '#6a3a1a', boxy: 0.5, cut: 'top', name: nm });
      b.box([0.1, 0.015, 0.27], [x, 0.0075, 0.0], { color: '#3a2a1e', round: 0.6, parent: nm });
      b.box([0.07, 0.03, 0.06], [x, 0.02, -0.11], { color: '#3a2a1e', round: 0.3, parent: nm });
      b.box([0.05, 0.012, 0.07], [x, 0.075, 0.05], { color: '#4a2a14', round: 0.5, rot: [-15, 0, 0], parent: nm });
      b.each(3, (i) => b.box([0.05, 0.005, 0.006], [x, 0.08 - i * 0.008, 0.035 + i * 0.016], { color: '#f2e6cf', noInk: true, parent: nm }));
      b.ball([0.07, 0.04, 0.06], [x, 0.04, 0.1], { color: '#7a4a2a', parent: nm });
    });
    return b.act({ click: [A.pose('shoeL', { move: [0, 0.04, 0.03], dur: 0.15, times: 1 }), A.pose('shoeR', { move: [0, 0.04, 0.03], dur: 0.15, times: 1 }), A.pose('shoeL', { move: [0, 0.04, 0.03], dur: 0.15, times: 1 }), A.par(A.pose('shoeR', { move: [0, 0.04, 0.03], dur: 0.15, times: 1 }), A.say('Tap, tap!', 1))] }).done();
  }),
  // A shooting range (10 m deep, 2 m high): a covered shooting bench with lane dividers, three lanes of paper
  // targets on frames in front of an earth backstop. Click: ping! a target is hit and swings back; it rights
  // itself.
  e('shooting range', 'places', 'sports grounds', () => {
    const b = m('shooting range', { edge: 'sharp' })
      .box([6, 0.1, 10], [0, 0.05, 0], { color: '#d8c89a' })
      .box([6, 1.6, 1.4], [0, 0.8, -4.4], { color: '#8a6440', round: 0.3, edge: 'soft' })
      .box([6, 0.08, 1.0], [0, 0.95, 4.2], { color: '#9a6a3e' })
      .box([6, 0.8, 0.1], [0, 0.5, 4.65], { color: '#7a5230' })
      .box([6.2, 0.1, 1.8], [0, 1.85, 4.4], { color: '#5c6166' });
    b.each(4, (i) => b.box([0.06, 1.8, 1.4], [-3 + i * 2, 0.9, 4.3], { color: '#c9a36a' }));
    for (const xx of [-2, 0, 2]) {
      const nm = xx === 0 ? 'target' : undefined;
      b.stick([xx - 0.35, 0.1, -3], [xx - 0.35, 0.8, -3], 0.05, '#7a5230').stick([xx + 0.35, 0.1, -3], [xx + 0.35, 0.8, -3], 0.05, '#7a5230');
      b.box([0.6, 0.8, 0.03], [xx, 1.2, -3], { color: '#f2e6cf', ...(nm ? { name: nm, pivot: [xx, 0.8, -3] } : {}) });
      const par = nm ? { parent: nm } : {};
      b.cyl([0.5, 0.01, 0.5], [xx, 1.25, -2.98], { color: '#2a2726', rot: [90, 0, 0], ...par }).cyl([0.32, 0.012, 0.32], [xx, 1.25, -2.975], { color: '#f2e6cf', rot: [90, 0, 0], ...par }).cyl([0.14, 0.014, 0.14], [xx, 1.25, -2.97], { color: '#d8312a', rot: [90, 0, 0], ...par });
    }
    return b.act({ click: [A.par(A.pose('target', { rot: [-70, 0, 0], dur: 0.15 }), A.say('Ping!', 1)), A.wait(0.8), A.pose('target', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A paper shopping bag (38 cm) with rope handles, full of groceries: a baguette, a leek and a bunch of flowers
  // poking out of the top. Click: it rustles and the flowers bob.
  e('shopping bag', 'wardrobe', 'bags', () =>
    m('shopping bag')
      .box([0.3, 0.32, 0.14], [0, 0.16, 0], { color: '#c99a5a', round: 0.08, edge: 'sharp' })
      .box([0.302, 0.08, 0.142], [0, 0.08, 0], { color: '#d64fa0', round: 0.08, noInk: true, edge: 'sharp' })
      .arc([0.12, 0.12, 0.012], [0, 0.32, 0.04], { color: '#7a5230', tube: 0.15 })
      .arc([0.12, 0.12, 0.012], [0, 0.32, -0.04], { color: '#7a5230', tube: 0.15 })
      .capsule([0.05, 0.4, 0.05], [-0.08, 0.38, 0.0], { color: '#d9a35f', rot: [0, 0, 15] })
      .rod([0.06, 0.25, 0.02], [0.1, 0.45, 0.02], 0.03, '#f2ece0')
      .rod([0.1, 0.45, 0.02], [0.13, 0.55, 0.02], 0.03, '#5aa553')
      .stick([0.0, 0.28, -0.03], [0.02, 0.44, -0.04], 0.008, '#3f7a3a', { name: 'flowers', pivot: [0.0, 0.3, -0.03] })
      .ball(0.05, [0.02, 0.46, -0.04], { color: '#e0473b', parent: 'flowers' })
      .ball(0.045, [-0.03, 0.44, -0.03], { color: '#f6d24a', parent: 'flowers' })
      .ball(0.045, [0.05, 0.43, -0.02], { color: '#f4a1c0', parent: 'flowers' })
      .act({ click: [A.par(A.anim('wobble'), A.pose('flowers', { rot: [0, 0, 12], dur: 0.3, times: 2 }), A.say('Rustle, rustle!', 1.2))] })
      .done(),
  ),
  // A supermarket trolley at real size (1 m handle): a wire basket with a fold-down child seat, a red plastic
  // handle, a lower tray, and four swivel castors. Click: it rolls off a little and back, squeak squeak.
  e('shopping cart', 'home', 'shopping', () => {
    const st = '#b9c2ca';
    const b = m('shopping cart', { view: 'side', edge: 'sharp' })
      .box([0.52, 0.015, 0.8], [0, 0.56, 0.02], { color: st });
    b.pair((s) => {
      b.stick([s * 0.27, 0.56, 0.42], [s * 0.27, 0.98, 0.45], 0.022, st).stick([s * 0.27, 0.56, -0.38], [s * 0.27, 0.98, -0.46], 0.022, st);
      b.stick([s * 0.27, 0.98, 0.45], [s * 0.27, 0.98, -0.46], 0.022, st).stick([s * 0.27, 0.77, 0.43], [s * 0.27, 0.77, -0.42], 0.015, st);
      b.each(8, (i) => b.stick([s * 0.27, 0.56, -0.34 + i * 0.1], [s * 0.27, 0.98, -0.35 + i * 0.1], 0.008, st, { noInk: true }));
      b.stick([s * 0.22, 0.1, 0.38], [s * 0.26, 0.56, 0.4], 0.03, st).stick([s * 0.22, 0.1, -0.38], [s * 0.26, 0.56, -0.38], 0.03, st);
      b.stick([s * 0.22, 0.1, 0.4], [s * 0.22, 0.1, -0.4], 0.03, st);
      b.stick([s * 0.25, 0.98, -0.46], [s * 0.24, 1.0, -0.56], 0.03, st);
    });
    b.stick([-0.27, 0.98, 0.45], [0.27, 0.98, 0.45], 0.022, st).stick([-0.27, 0.77, 0.44], [0.27, 0.77, 0.44], 0.015, st);
    b.each(6, (i) => b.stick([-0.22 + i * 0.09, 0.56, 0.43], [-0.22 + i * 0.09, 0.98, 0.45], 0.008, st, { noInk: true }));
    b.box([0.5, 0.35, 0.02], [0, 0.85, -0.42], { color: st, rot: [-12, 0, 0] })
      .box([0.44, 0.06, 0.2], [0, 0.96, -0.3], { color: '#d8312a', round: 0.3 })
      .stick([-0.27, 1.0, -0.56], [0.27, 1.0, -0.56], 0.045, '#d8312a')
      .box([0.48, 0.015, 0.7], [0, 0.18, 0], { color: st });
    for (const [xx, z, n] of [[0.22, 0.4, 'wheelFL'], [-0.22, 0.4, 'wheelFR'], [0.22, -0.4, 'wheelBL'], [-0.22, -0.4, 'wheelBR']] as Array<[number, number, string]>) {
      b.box([0.04, 0.04, 0.06], [xx, 0.1, z], { color: '#5c6166' });
      wheel(b, n, [xx, 0.055, z + 0.03], 0.11, 0.035, '#5c6166');
    }
    return b.act({ click: [A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' }), A.say('Squeak, squeak!', 1.2), A.move('self', { rel: 'right', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' })] }).done();
  }),
  // Khaki cargo shorts on a clip hanger hanging from a stand (1.2 m): a belt with buckle, belt loops, front
  // pockets and a cargo pocket with a flap that buttons. Click: the cargo flap pops open; click again, shut.
  e('shorts', 'wardrobe', 'trousers', () => {
    const k = '#c9a46a', dk = '#a8865a';
    const b = m('shorts')
      .cyl([0.32, 0.03, 0.32], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.03, -0.08], [0, 1.2, -0.08], 0.03, '#3a3633', { edge: 'sharp' })
      .stick([-0.24, 1.14, -0.04], [0.24, 1.14, -0.04], 0.015, '#c9ccd1', { edge: 'sharp' })
      .box([0.44, 0.06, 0.2], [0, 1.07, 0], { color: '#5a3a22', round: 0.3 })
      .box([0.06, 0.04, 0.01], [0, 1.07, 0.1], { color: '#c9ccd1', edge: 'sharp' })
      .box([0.44, 0.14, 0.2], [0, 0.97, 0], { color: k, round: 0.3 });
    b.pair((s) => {
      b.box([0.21, 0.28, 0.19], [s * 0.115, 0.78, 0], { color: k, round: 0.3, rot: [0, 0, s * -5] });
      b.box([0.08, 0.06, 0.01], [s * 0.13, 0.96, 0.1], { color: dk, noInk: true });
    });
    b.box([0.1, 0.12, 0.03], [0.21, 0.76, 0.03], { color: dk, round: 0.3 })
      .box([0.11, 0.045, 0.035], [0.215, 0.83, 0.035], { color: dk, round: 0.3, name: 'flap', pivot: [0.215, 0.85, 0.035], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .ball(0.012, [0.215, 0.815, 0.054], { color: '#5a3a22', parent: 'flap' });
    return b.act({ click: [[A.operate('flap', 'open'), A.say('Pop!', 0.8)], [A.operate('flap', 'close'), A.say('Snap.', 0.8)]] }).done();
  }),
  // A double-barrelled shotgun (1.15 m) on a wooden rack: side-by-side barrels, the break-open action, walnut
  // stock and fore-end, trigger guard. Click: it breaks open on its hinge, click; click again, snaps shut.
  e('shotgun', 'armory', 'guns', () => {
    const b = m('shotgun', { view: 'side', edge: 'sharp' })
      .box([0.25, 0.05, 0.7], [0, 0.025, 0], { color: '#5a3a22' });
    b.each(2, (i) => b.stick([0, 0.05, -0.25 + i * 0.5], [0, 0.32, -0.25 + i * 0.5], 0.04, '#7a5230'));
    b.box([0.06, 0.08, 0.14], [0, 0.37, -0.12], { color: '#55595e', round: 0.3 })
      .box([0.1, 0.13, 0.42], [0, 0.32, -0.42], { color: '#6a3a1a', round: 0.4, rot: [-10, 0, 0], edge: 'soft' })
      .arc([0.06, 0.05, 0.012], [0, 0.33, -0.12], { color: '#55595e', rot: [0, 90, 180], tube: 0.2 })
      .box([0.07, 0.04, 0.05], [0, 0.39, -0.08], { color: '#55595e', name: 'barrels', pivot: [0, 0.35, -0.05], mover: { kind: 'swing', axis: 'x', amount: 25 } })
      .box([0.07, 0.06, 0.26], [0, 0.35, 0.08], { color: '#6a3a1a', round: 0.4, parent: 'barrels', edge: 'soft' });
    b.pair((s) => b.cyl([0.026, 0.66, 0.026], [s * 0.014, 0.4, 0.27], { color: '#3a3f45', rot: [90, 0, 0], parent: 'barrels' }));
    return b.act({ click: [A.operate('barrels'), A.say('Click!', 1)] }).done();
  }),
  // American-football shoulder pads on a tackling dummy's torso (75 cm): two big domed shoulder caps, chest and
  // back plates, laces and straps. Click: thud! a hit.
  e('shoulder pads', 'sports', 'protective gear', () => {
    const b = m('shoulder pads')
      .box([0.3, 0.04, 0.3], [0, 0.02, 0], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 0.35, 0], 0.05, '#9da3a8', { edge: 'sharp' })
      .cyl([0.34, 0.36, 0.22], [0, 0.52, 0], { color: '#3a3633', taper: 1.15 })
      .box([0.42, 0.26, 0.12], [0, 0.6, 0.09], { color: 'white', round: 0.5, name: 'pads', pivot: [0, 0.35, 0] })
      .box([0.42, 0.26, 0.12], [0, 0.6, -0.09], { color: 'white', round: 0.5, parent: 'pads' });
    b.pair((s) => b.dome([0.22, 0.12, 0.34], [s * 0.22, 0.7, 0], { color: '#d4d7da', rot: [0, 0, s * -20], parent: 'pads' }).dome([0.16, 0.08, 0.26], [s * 0.27, 0.66, 0], { color: 'white', rot: [0, 0, s * -35], parent: 'pads' }));
    b.box([0.3, 0.03, 0.02], [0, 0.56, 0.155], { color: '#2a2726', noInk: true, parent: 'pads' }).box([0.3, 0.03, 0.02], [0, 0.63, 0.155], { color: '#2a2726', noInk: true, parent: 'pads' });
    return b.act({ click: [A.pose('pads', { rot: [-10, 0, 6], dur: 0.12 }), A.par(A.pose('pads', { rot: [0, 0, 0], dur: 0.4 }), A.anim('shake'), A.say('Thud!', 1))] }).done();
  }),
  // A garden spade (1.1 m) dug into a heap of earth: a steel blade with a tread, an ash shaft and a D-grip. Click:
  // it digs a spadeful and tosses it on the heap.
  e('shovel', 'garden', 'garden tools', () =>
    m('shovel')
      .dome([0.7, 0.25, 0.55], [0.25, 0.125, -0.05], { color: '#7a5a40', name: 'heap' })
      .dome([0.5, 0.06, 0.4], [-0.15, 0.03, 0.05], { color: '#8a6440' })
      .box([0.2, 0.26, 0.03], [-0.15, 0.13, 0.05], { color: '#9da3a8', round: 0.2, edge: 'sharp', name: 'spade', pivot: [-0.15, 0.1, 0.05] })
      .box([0.2, 0.03, 0.05], [-0.15, 0.27, 0.05], { color: '#5c6166', parent: 'spade', edge: 'sharp' })
      .stick([-0.15, 0.27, 0.05], [-0.15, 1.0, 0.05], 0.04, '#d8b07a', { parent: 'spade' })
      .arc([0.16, 0.14, 0.03], [-0.15, 1.0, 0.05], { color: '#2a2726', tube: 0.18, parent: 'spade' })
      .stick([-0.22, 1.12, 0.05], [-0.08, 1.12, 0.05], 0.03, '#d8b07a', { parent: 'spade' })
      .act({ click: [A.pose('spade', { rot: [-35, 0, 0], move: [0, 0.05, 0], dur: 0.4 }), A.par(A.pose('spade', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 }), A.pose('heap', { scale: 1.12, dur: 0.4 }), A.effect('dust', { dur: 1 }), A.say('Dig!', 1)), A.pose('heap', { scale: 1, dur: 0.6 })] })
      .done(),
  ),
  // A walk-in shower (2.1 m): a white tray, tiled back and side walls, a half glass screen on one side, a riser
  // rail with the shower head, the mixer valve, a towel on its hook and a rubber duck in the tray. Click:
  // the water runs, shhhh; click again, it stops.
  e('shower', 'home', 'bathroom', () => {
    const t = '#e8eef2';
    const b = m('shower', { edge: 'sharp' })
      .box([1.0, 0.12, 1.0], [0, 0.06, 0], { color: 'white', round: 0.2 })
      .box([1.0, 2.1, 0.06], [0, 1.17, -0.48], { color: t })
      .box([0.06, 2.1, 1.0], [-0.48, 1.17, 0], { color: t })
      .box([0.02, 1.95, 0.5], [0.49, 1.1, -0.23], { color: '#d8eef7' })
      .box([0.04, 2.0, 0.04], [0.49, 1.12, 0.02], { color: '#c9ccd1' })
      .stick([0.49, 2.08, -0.48], [0.49, 2.08, 0.02], 0.025, '#c9ccd1');
    b.each(6, (i) => b.box([1.0, 0.01, 0.005], [0, 0.4 + i * 0.3, -0.447], { color: '#c9d4da', noInk: true }).box([0.005, 0.01, 1.0], [-0.447, 0.4 + i * 0.3, 0], { color: '#c9d4da', noInk: true }));
    b.each(3, (i) => b.box([0.01, 2.0, 0.005], [-0.25 + i * 0.25, 1.17, -0.447], { color: '#c9d4da', noInk: true }));
    b.stick([0.2, 1.0, -0.43], [0.2, 2.05, -0.43], 0.03, '#c9ccd1')
      .rod([0.2, 1.95, -0.43], [0.2, 1.97, -0.25], 0.025, '#c9ccd1')
      .cyl([0.2, 0.04, 0.2], [0.2, 1.95, -0.22], { color: '#c9ccd1', rot: [-15, 0, 0] })
      .cone([0.5, 1.75, 0.5], [0.2, 1.05, -0.12], { color: '#9fd8f0', rot: [180, 0, 0], name: 'spray', scale: 0, edge: 'soft' })
      .cyl([0.12, 0.04, 0.12], [-0.15, 1.1, -0.44], { color: '#c9ccd1', rot: [90, 0, 0] })
      .box([0.1, 0.02, 0.02], [-0.15, 1.1, -0.41], { color: '#9da3a8' })
      .ball([0.09, 0.07, 0.1], [-0.25, 0.155, 0.2], { color: '#f6d24a', edge: 'soft' })
      .ball(0.06, [-0.25, 0.21, 0.23], { color: '#f6d24a', edge: 'soft' })
      .box([0.04, 0.04, 0.06], [0.52, 1.6, 0.2], { color: '#c9ccd1' })
      .box([0.03, 0.7, 0.4], [0.55, 1.3, 0.2], { color: '#4fa3a5', round: 0.4, edge: 'soft' });
    return b.act({ click: [[A.par(A.pose('spray', { scale: 1, dur: 0.3 }), A.effect('water_spray', { dur: 2.5 }), A.say('Shhhhhh!', 2))], [A.pose('spray', { scale: 0, dur: 0.3 }), A.say('Drip... drip.', 1.2)]] }).done();
  }),
  // A pink shower cap with white polka dots and a frilly elastic edge, on a white head form. Click: it wobbles,
  // splish splash.
  e('shower cap', 'home', 'bathroom', () => {
    const b = m('shower cap')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: '#9da3a8', edge: 'sharp' })
      .cyl([0.08, 0.12, 0.08], [0, 0.09, 0], { color: '#f2f2ee' })
      .ball([0.18, 0.22, 0.2], [0, 0.26, 0], { color: '#f2f2ee' })
      .dome([0.25, 0.14, 0.27], [0, 0.34, -0.01], { color: '#f4a1c0', name: 'cap', pivot: [0, 0.27, 0] })
      .torus([0.25, 0.27, 0.035], [0, 0.29, -0.01], { color: '#f8c8dc', rot: [90, 0, 0], tube: 0.18, parent: 'cap' });
    b.each(9, (i) => b.ball(0.022, surf([0, 0.27, -0.01], [0.125, 0.14, 0.135], i * 40, 20 + (i % 3) * 18), { color: 'white', noInk: true, parent: 'cap' }));
    b.pair((s) => b.ball(0.02, [s * 0.04, 0.27, 0.095], { color: '#5c6166', noInk: true }));
    return b.act({ click: [A.par(A.pose('cap', { rot: [0, 0, 8], dur: 0.2, times: 2 }), A.effect('water_spray', { dur: 1 }), A.say('Splish, splash!', 1.2))] }).done();
  }),
  // A shower curtain (1.8 m drop) on a rail over a white bathtub: two pleated halves on rings, printed with
  // rubber ducks. Click: the curtain slides open; click again, it closes.
  e('shower curtain', 'home', 'bathroom', () => {
    const b = m('shower curtain')
      .box([1.7, 0.55, 0.75], [0, 0.275, -0.1], { color: '#f7f5ef', round: 0.25, edge: 'sharp' })
      .box([1.5, 0.05, 0.55], [0, 0.53, -0.1], { color: '#9fd0ea', round: 0.4 })
      .stick([-0.9, 2.05, 0.28], [0.9, 2.05, 0.28], 0.03, '#c9ccd1', { edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.86, 0.55, 0.28], [s * 0.86, 2.06, 0.28], 0.04, '#c9ccd1', { edge: 'sharp' }));
    b.pair((s) => {
      const nm = s > 0 ? 'curtainL' : 'curtainR';
      b.box([0.86, 0.02, 0.02], [s * 0.44, 2.0, 0.3], { color: '#a8dcf0', name: nm, mover: { kind: 'slide', axis: 'x', amount: s * 0.55 } });
      b.each(4, (i) => {
        const xx = s * (0.11 + i * 0.21);
        b.box([0.22, 1.8, 0.04], [xx, 1.08, 0.3 + (i % 2) * 0.04], { color: i % 2 ? '#a8dcf0' : '#c8ecf8', round: 0.5, parent: nm, edge: 'soft' });
        b.torus([0.05, 0.05, 0.01], [xx, 2.04, 0.3], { color: '#c9ccd1', rot: [0, 90, 0], tube: 0.2, parent: nm });
      });
      b.each(2, (i) => b.ball([0.1, 0.07, 0.01], [s * (0.25 + i * 0.35), 0.8 + i * 0.6, 0.35], { color: '#f6d24a', noInk: true, parent: nm }));
    });
    return b.act({ click: [A.operate('curtain'), A.say('Shhk!', 1)] }).done();
  }),
  // A rain shower head (25 cm) on its arm from a tiled wall plate, with a wall valve. Click: water streams down;
  // click again, it stops.
  e('shower head', 'home', 'bathroom', () =>
    m('shower head', { edge: 'sharp' })
      .box([0.3, 0.42, 0.03], [0, 0.21, -0.12], { color: '#e8eef2', round: 0.1 })
      .box([0.31, 0.005, 0.032], [0, 0.14, -0.12], { color: '#c9d4da', noInk: true })
      .box([0.31, 0.005, 0.032], [0, 0.28, -0.12], { color: '#c9d4da', noInk: true })
      .cyl([0.06, 0.02, 0.06], [0, 0.38, -0.1], { color: '#c9ccd1', rot: [90, 0, 0] })
      .rod([0, 0.38, -0.1], [0, 0.4, 0.05], 0.022, '#c9ccd1')
      .cyl([0.16, 0.025, 0.16], [0, 0.39, 0.1], { color: '#c9ccd1', rot: [-10, 0, 0] })
      .cyl([0.14, 0.004, 0.14], [0, 0.376, 0.1], { color: '#9da3a8', rot: [-10, 0, 0], noInk: true })
      .cyl([0.08, 0.02, 0.08], [0, 0.18, -0.1], { color: '#c9ccd1', rot: [90, 0, 0] })
      .box([0.08, 0.015, 0.02], [0.02, 0.18, -0.08], { color: '#9da3a8', name: 'valve', pivot: [0, 0.18, -0.08] })
      .cone([0.16, 0.36, 0.16], [0, 0.19, 0.12], { color: '#9fd8f0', rot: [180, 0, 0], name: 'spray', scale: 0, edge: 'soft' })
      .act({ click: [[A.pose('valve', { rot: [0, 0, 90], dur: 0.3 }), A.par(A.pose('spray', { scale: 1, dur: 0.3 }), A.effect('water_spray', { dur: 2 }), A.say('Shhhhh!', 1.5))], [A.par(A.pose('valve', { rot: [0, 0, 0], dur: 0.3 }), A.pose('spray', { scale: 0, dur: 0.3 }), A.say('Drip.', 0.8))]] })
      .done(),
  ),
  // The seven ball (5.7 cm, real size) on a patch of green baize: maroon with a white circle and a black 7.
  // Click: it rolls away, clack; click again, it rolls back.
  e('seven ball', 'sports', 'billiards', () =>
    m('seven ball')
      .box([0.3, 0.01, 0.16], [0.05, 0.005, 0], { color: '#2e8a4a', round: 0.3, edge: 'sharp' })
      .ball(0.057, [0, 0.0385, 0], { color: '#7a1a2a', name: 'ball' })
      .ball([0.028, 0.028, 0.006], [0, 0.042, 0.027], { color: 'white', noInk: true, parent: 'ball' })
      .label('7', [0.018, 0.02], [0, 0.042, 0.03], { color: 'white', depth: 0.002, parent: 'ball' })
      .ball([0.014, 0.008, 0.004], [-0.012, 0.058, 0.018], { color: '#ffffff', noInk: true })
      .act({ click: [[A.pose('ball', { move: [0.17, 0, 0], rot: [0, 0, -340], dur: 0.8 }), A.say('Clack!', 1)], [A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })]] })
      .done(),
  ),
  // Shrapnel in a museum tray (16 cm): jagged, twisted fragments of iron and a copper driving band. Click:
  // they glint, clink.
  e('shrapnel', 'armory', 'explosives', () => {
    const b = m('shrapnel', { edge: 'sharp' })
      .box([0.2, 0.012, 0.14], [0, 0.006, 0], { color: '#3a3633', round: 0.2 })
      .box([0.18, 0.004, 0.12], [0, 0.013, 0], { color: '#a3222a', round: 0.3, noInk: true });
    for (const [xx, z, w, r] of [[0, 0, 0.05, 20], [0.05, 0.03, 0.035, 70], [-0.05, 0.02, 0.04, -40], [0.03, -0.035, 0.03, 120], [-0.035, -0.03, 0.028, 200]] as Array<[number, number, number, number]>)
      b.wedge([w, w * 0.8, w * 0.35], [xx, 0.015 + w * 0.3, z], { color: r % 3 ? '#55595e' : '#7a7f85', rot: [r * 0.3, r, r * 0.2], apex: 0.3 });
    b.arc([0.03, 0.03, 0.008], [0.065, 0.02, -0.04], { color: '#c87a4a', rot: [70, 30, 0], tube: 0.25, arc: 220 });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1 }), A.say('Clink!', 0.8))] }).done();
  }),
  // A paper shredder (55 cm) on its bin: a dark cutting head with a feed slot and buttons, a window into the bin
  // full of strips, and a sheet waiting in the slot. Click: grrrr, the sheet is pulled in and shredded; click
  // again, a new sheet.
  e('shredder', 'study', 'office machines', () =>
    m('shredder', { edge: 'sharp' })
      .box([0.36, 0.42, 0.26], [0, 0.21, 0], { color: '#5c6166', round: 0.1 })
      .box([0.22, 0.26, 0.01], [0, 0.22, 0.13], { color: '#9fc6d8' })
      .box([0.38, 0.1, 0.28], [0, 0.47, 0], { color: '#2a2726', round: 0.3 })
      .box([0.26, 0.012, 0.02], [0, 0.522, 0.0], { color: '#1e1c1b' })
      .box([0.22, 0.24, 0.004], [0, 0.64, 0.0], { color: '#faf6ea', name: 'sheet' })
      .box([0.012, 0.15, 0.002], [-0.06, 0.2, 0.136], { color: '#faf6ea', noInk: true })
      .box([0.012, 0.18, 0.002], [-0.02, 0.18, 0.136], { color: '#faf6ea', noInk: true })
      .box([0.012, 0.14, 0.002], [0.02, 0.2, 0.136], { color: '#faf6ea', noInk: true })
      .box([0.012, 0.17, 0.002], [0.06, 0.19, 0.136], { color: '#faf6ea', noInk: true })
      .ball(0.016, [0.15, 0.5, 0.13], { color: '#7cff6a', glow: true })
      .box([0.03, 0.015, 0.03], [0.1, 0.525, 0.1], { color: '#d8312a' })
      .act({ click: [[A.par(A.pose('sheet', { move: [0, -0.2, 0], scale: 0.2, dur: 1 }), A.anim('shake', 2), A.say('Grrrrrr!', 1.5)), A.pose('sheet', { scale: 0, dur: 0 })], [A.pose('sheet', { move: [0, 0, 0], dur: 0 }), A.pose('sheet', { scale: 1, dur: 0.4 })]] })
      .done(),
  ),
  // A small Shinto shrine (6 m): a vermilion torii gate over a stone path, a little hall with a sweeping dark
  // roof and gilt ridge, an offering box and a bell on a thick rope. Click: the rope swings and the bell rings.
  e('shrine', 'places', 'temples', () => {
    const v = '#d8402a';
    const b = m('shrine', { edge: 'sharp' })
      .box([7, 0.15, 9], [0, 0.075, 0.5], { color: '#a7a7a0' })
      .box([1.4, 0.05, 6], [0, 0.17, 2.0], { color: '#c9c6bd' })
      .box([3.6, 0.6, 3.2], [0, 0.45, -2.0], { color: '#8f8c86' })
      .box([3.0, 2.0, 2.6], [0, 1.75, -2.0], { color: '#9a6a3e' })
      .wedge([3.0, 1.4, 4.2], [0, 3.45, -2.0], { color: '#3a3f45', rot: [0, 90, 0] })
      .box([4.4, 0.2, 0.25], [0, 4.15, -2.0], { color: '#d0a84a' })
      .box([2.0, 1.6, 0.1], [0, 1.55, -0.68], { color: '#f2e6cf' })
      .box([0.9, 0.4, 0.5], [0, 0.95, -0.2], { color: '#7a5230' })
      .stick([0, 2.7, -0.55], [0, 1.25, -0.55], 0.12, '#f2e6cf', { name: 'rope', pivot: [0, 2.7, -0.55] })
      .ball(0.3, [0, 2.6, -0.55], { color: '#d0a84a', parent: 'rope' });
    b.pair((s) => b.stick([s * 1.2, 0.15, 4.0], [s * 1.1, 4.0, 4.0], 0.32, v));
    b.box([3.8, 0.3, 0.4], [0, 4.1, 4.0], { color: '#2a2726', round: 0.3 }).box([3.3, 0.28, 0.32], [0, 3.85, 4.0], { color: v }).box([2.8, 0.22, 0.24], [0, 3.2, 4.0], { color: v });
    b.box([0.4, 0.5, 0.06], [0, 3.52, 4.12], { color: '#2a2726' });
    b.pair((s) => b.box([0.5, 0.8, 0.5], [s * 1.8, 0.55, 1.5], { color: '#b8b5ac' }).box([0.7, 0.2, 0.7], [s * 1.8, 1.05, 1.5], { color: '#b8b5ac' }));
    return b.act({ click: [A.pose('rope', { rot: [25, 0, 10], dur: 0.3, times: 2 }), A.par(A.say('Clang, clang!', 1.5), A.effect('sparkle', { dur: 1 }))] }).done();
  }),
  // A linen dust sheet (a shroud) draped over an armchair in a closed-up room. Click: it is whisked off to show the
  // red chair; click again, it is put back.
  e('shroud', 'home', 'linens', () => {
    const c = '#ebe8de';
    const b = m('shroud')
      .box([0.9, 0.4, 0.85], [0, 0.25, 0], { color: '#a3322a', round: 0.4 })
      .box([0.7, 0.75, 0.22], [0, 0.75, -0.32], { color: '#a3322a', round: 0.5 });
    b.pair((s) => b.box([0.18, 0.55, 0.85], [s * 0.4, 0.42, 0], { color: '#8a2420', round: 0.5 }).box([0.06, 0.06, 0.06], [s * 0.36, 0.03, 0.34], { color: '#3a2a1e' }));
    b.box([1.08, 0.66, 0.98], [0, 0.39, 0.02], { color: c, round: 0.5, name: 'sheet', pivot: [0, 1.3, 0] })
      .box([0.86, 0.6, 0.36], [0, 0.85, -0.32], { color: c, round: 0.6, parent: 'sheet' })
      .ball([0.9, 0.2, 0.5], [0, 1.15, -0.25], { color: c, parent: 'sheet' });
    b.each(4, (i) => b.box([0.03, 0.5, 0.03], [-0.42 + i * 0.28, 0.3, 0.5], { color: '#d6d2c4', noInk: true, parent: 'sheet' }));
    return b.act({ click: [[A.pose('sheet', { move: [0.8, 0.8, 0.4], rot: [0, 0, -40], scale: 0.4, dur: 0.6 }), A.pose('sheet', { scale: 0, dur: 0.1 }), A.say('Whoosh!', 1)], [A.pose('sheet', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.pose('sheet', { scale: 1, dur: 0.5 })]] }).done();
  }),
  // A rounded garden shrub (1.5 m): soft clumps of foliage on woody stems, dotted with white flowers. Click: it
  // rustles and a sparrow flutters out.
  e('shrub', 'garden', 'shrubs', () => {
    const b = m('shrub')
      .stick([0, 0, 0], [0, 0.35, 0], 0.09, '#7a5134')
      .stick([0.05, 0, 0.05], [0.25, 0.4, 0.1], 0.05, '#7a5134')
      .stick([-0.05, 0, 0.0], [-0.25, 0.4, -0.05], 0.05, '#7a5134')
      .ball([1.2, 0.9, 1.1], [0, 0.75, 0], { color: '#4f9a48', name: 'top' });
    for (const [xx, y, z, r, c] of [[0.4, 0.6, 0.15, 0.62, '#3f7a3a'], [-0.4, 0.62, 0.1, 0.62, '#5aa553'], [0.1, 1.1, -0.1, 0.65, '#5aa553'], [-0.15, 0.55, 0.4, 0.5, '#4f9a48'], [0.2, 0.9, 0.35, 0.45, '#5aa553']] as Array<[number, number, number, number, string]>) b.ball(r, [xx, y, z], { color: c, parent: 'top' });
    b.each(14, (i) => b.ball(0.06, surf([0, 0.78, 0], [0.62, 0.48, 0.58], -110 + ((i * 47) % 220), -10 + ((i * 31) % 60)), { color: i % 3 ? 'white' : '#f8e0ec', parent: 'top', noInk: true }));
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 4], dur: 0.15, times: 3 }), A.say('Rustle!', 1)), A.spawn('bird', 'sparrow', { rel: 'near', of: 'self', dist: 'close' }), A.say('Tweet!', 1, 'bird'), A.remove('bird', 'fly_away')] }).done();
  }),
  // A cottage window with a pair of green louvred shutters (wall section 2 m): a white sash window with glazing
  // bars and a sill, shutters on hinges either side. Click: the shutters swing shut; click again, open.
  e('shutter', 'home', 'windows', () => {
    const b = m('shutter', { edge: 'sharp' })
      .box([2.0, 1.6, 0.2], [0, 0.8, -0.12], { color: '#f2e6cf', round: 0.03 });
    win(b, [0, 0.85, 0.0], 0.66, 0.9, { frame: 'white' });
    b.pair((s) => {
      const nm = s > 0 ? 'shutterL' : 'shutterR';
      b.box([0.34, 0.92, 0.04], [s * 0.53, 0.85, 0.02], { color: '#2f6a3a', round: 0.1, name: nm, pivot: [s * 0.36, 0.85, 0.02], mover: { kind: 'swing', axis: 'y', amount: s * -175 } });
      b.each(8, (i) => b.box([0.26, 0.02, 0.02], [s * 0.53, 0.47 + i * 0.1, 0.045], { color: '#22522c', noInk: true, rot: [20, 0, 0], parent: nm }));
      b.box([0.03, 0.06, 0.02], [s * 0.36, 1.15, 0.05], { color: '#2a2726' }).box([0.03, 0.06, 0.02], [s * 0.36, 0.55, 0.05], { color: '#2a2726' });
    });
    b.box([0.6, 0.15, 0.2], [0, 0.32, 0.15], { color: '#a0503a' });
    b.each(3, (i) => b.ball(0.1, [-0.2 + i * 0.2, 0.44, 0.15], { color: ['#e0473b', '#f6d24a', '#d64fa0'][i], edge: 'soft' }));
    return b.act({ click: [[A.operate('shutter', 'close'), A.say('Clap!', 1)], [A.operate('shutter', 'open'), A.say('Creak.', 1)]] }).done();
  }),
  // A sickle (50 cm) beside a sheaf of standing wheat: a crescent steel blade on a turned wooden handle. Click: it
  // swings and the wheat ears fly.
  e('sickle', 'farm', 'farm tools', () => {
    const b = m('sickle')
      .box([0.4, 0.03, 0.3], [0.1, 0.015, 0], { color: '#8a6440', edge: 'sharp' })
      .cyl([0.05, 0.22, 0.05], [0, 0.14, 0], { color: '#9a6a3e', name: 'sickle', pivot: [0, 0.03, 0] })
      .cyl([0.055, 0.03, 0.055], [0, 0.265, 0], { color: '#8f99a3', parent: 'sickle' });
    const pts: V[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = (180 - i * 40) * D2R;
      pts.push([0.16 + Math.cos(a) * 0.18, 0.43 + Math.sin(a) * 0.17, 0]);
    }
    b.rod([0, 0.27, 0], pts[0], 0.03, '#8f99a3', { parent: 'sickle', edge: 'sharp' });
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], 0.05 - i * 0.007, '#c9ccd1', { parent: 'sickle', edge: 'sharp' });
    b.each(7, (i) => b.stick([0.2 + (i % 4) * 0.03, 0.03, -0.05 + Math.floor(i / 4) * 0.06], [0.2 + (i % 4) * 0.035, 0.45, -0.06 + Math.floor(i / 4) * 0.07], 0.008, '#d9b44a').capsule([0.02, 0.07, 0.02], [0.2 + (i % 4) * 0.035, 0.48, -0.06 + Math.floor(i / 4) * 0.07], { color: '#e8c35a' }));
    return b.act({ click: [A.pose('sickle', { rot: [0, 0, 35], dur: 0.25 }), A.par(A.pose('sickle', { rot: [0, 0, -25], dur: 0.3 }), A.effect('dust', { dur: 1 }), A.say('Swish!', 1)), A.pose('sickle', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A mesh sieve (20 cm) with a long handle resting over a mixing bowl, flour in the mesh. Click: it is shaken
  // and flour snows down into the bowl.
  e('sieve', 'kitchen', 'utensils', () => {
    const b = m('sieve')
      .cyl([0.22, 0.1, 0.22], [0, 0.05, 0], { color: '#f2f2ee', taper: 1.4, edge: 'sharp' })
      .cyl([0.16, 0.08, 0.16], [0, 0.15, 0], { color: '#b9c2ca', taper: 1.8, name: 'sieve' })
      .torus([0.27, 0.27, 0.012], [0, 0.19, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.06, parent: 'sieve' })
      .dome([0.2, 0.03, 0.2], [0, 0.17, 0], { color: '#fbf9f2', parent: 'sieve' });
    b.each(3, (i) => b.torus([0.24 - i * 0.05, 0.24 - i * 0.05, 0.004], [0, 0.192, 0], { color: '#8f99a3', rot: [90, 0, 0], tube: 0.05, noInk: true, parent: 'sieve' }));
    b.rod([0.13, 0.19, 0], [0.34, 0.22, 0], 0.016, '#c9ccd1', { parent: 'sieve' }).torus([0.035, 0.035, 0.01], [0.36, 0.225, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.25, parent: 'sieve' });
    return b.act({ click: [A.par(A.pose('sieve', { move: [0.02, 0.01, 0], dur: 0.1, times: 6 }), A.effect('snow', { dur: 1.5 }), A.say('Shake, shake!', 1.2))] }).done();
  }),
  // A hanging inn sign (2.6 m): a painted board swinging on chains from the arm of a wooden post. Click: it
  // swings and creaks in the wind.
  e('sign', 'ideas', 'signs', () => {
    const b = m('sign', { edge: 'sharp' })
      .box([0.5, 0.1, 0.5], [0, 0.05, 0], { color: '#a7a7a0' })
      .box([0.15, 2.6, 0.15], [-0.6, 1.3, 0], { color: '#5a3a22' })
      .box([1.5, 0.12, 0.12], [0.08, 2.5, 0], { color: '#5a3a22' })
      .rod([-0.55, 2.1, 0], [-0.1, 2.45, 0], 0.06, '#5a3a22')
      .box([1.0, 0.08, 0.08], [0.15, 2.4, 0], { color: '#2a2726', name: 'board', pivot: [0.15, 2.48, 0] })
      .stick([-0.25, 2.4, 0], [-0.25, 2.2, 0], 0.015, '#55595e', { parent: 'board' })
      .stick([0.55, 2.4, 0], [0.55, 2.2, 0], 0.015, '#55595e', { parent: 'board' })
      .box([1.0, 0.7, 0.06], [0.15, 1.83, 0], { color: '#2f4f8f', round: 0.1, parent: 'board' })
      .box([0.92, 0.62, 0.065], [0.15, 1.83, 0], { color: '#e8d29a', round: 0.1, parent: 'board' })
      .label('WELCOME', [0.8, 0.22], [0.15, 1.92, 0.035], { color: '#e8d29a', depth: 0.01, parent: 'board' })
      .star(0.18, [0.15, 1.7, 0.04], { color: '#d8312a', parent: 'board' });
    return b.act({ click: [A.pose('board', { rot: [20, 0, 0], dur: 0.4, times: 2 }), A.say('Creak... creak...', 1.5)] }).done();
  }),
  // A wooden fingerpost (2.6 m) at a crossroads: three pointed arms to NORTH, TOWN and LAKE on a post with a
  // cap, in a tuft of grass. Click: the arms whirl round and settle back.
  e('signpost', 'ideas', 'road signs', () => {
    const b = m('signpost', { edge: 'sharp' })
      .cyl([0.7, 0.15, 0.7], [0, 0.075, 0], { color: '#6ab04c', edge: 'soft' })
      .box([0.13, 2.5, 0.13], [0, 1.25, 0], { color: '#7a5230' })
      .pyramid([0.2, 0.14, 0.2], [0, 2.57, 0], 4, { color: '#5a3a22' })
      .cyl([0.05, 0.05, 0.05], [0, 2.2, 0], { color: '#7a5230', name: 'arms', pivot: [0, 2.2, 0] });
    for (const [y, a, t, c] of [[2.25, 20, 'NORTH', '#f2e6cf'], [1.9, 160, 'TOWN', '#d8b07a'], [1.55, 60, 'LAKE', '#f2e6cf']] as Array<[number, number, string, string]>) {
      const dx = Math.cos(a * D2R), dz = -Math.sin(a * D2R);
      b.box([0.7, 0.2, 0.05], [dx * 0.42, y, dz * 0.42], { color: c, rot: [0, a, 0], round: 0.1, parent: 'arms' }).wedge([0.24, 0.12, 0.05], [dx * 0.84, y, dz * 0.84], { color: c, rot: [0, a, -90], parent: 'arms' });
      b.label(t, [0.5, 0.14], [dx * 0.42 - dz * 0.03, y, dz * 0.42 + dx * 0.03], { color: c, rot: [0, a, 0], depth: 0.01, parent: 'arms' });
    }
    return b.act({ click: [A.pose('arms', { rot: [0, 720, 0], dur: 1 }), A.par(A.pose('arms', { rot: [0, 0, 0], dur: 0 }), A.say('Whirr... this way!', 1.5))] }).done();
  }),
  // A bolt of shimmering pink silk on a cardboard tube with a length unrolled and draped over the table edge.
  // Click: it ripples and shimmers.
  e('silk', 'wardrobe', 'fabrics', () => {
    const c = '#d64f9a';
    const b = m('silk')
      .box([0.7, 0.03, 0.5], [0, 0.015, 0], { color: '#9a6a3e', edge: 'sharp' })
      .cyl([0.16, 0.52, 0.16], [0, 0.11, -0.12], { color: c, rot: [0, 0, 90] })
      .cyl([0.05, 0.56, 0.05], [0, 0.11, -0.12], { color: '#c9a46a', rot: [0, 0, 90] })
      .box([0.5, 0.01, 0.3], [0, 0.04, 0.06], { color: c, round: 0.2, name: 'drape', pivot: [0, 0.1, -0.06] })
      .capsule([0.05, 0.5, 0.05], [0, 0.04, 0.22], { color: '#e870b0', rot: [0, 0, 90], parent: 'drape' })
      .box([0.5, 0.2, 0.01], [0, -0.06, 0.25], { color: c, round: 0.3, parent: 'drape' });
    b.each(3, (i) => b.box([0.012, 0.004, 0.28], [-0.15 + i * 0.15, 0.047, 0.06], { color: '#f6c8e0', noInk: true, parent: 'drape' }));
    return b.act({ click: [A.par(A.pose('drape', { rot: [6, 0, 0], dur: 0.25, times: 2 }), A.effect('sparkle', { dur: 1.5 }), A.say('Shimmer!', 1.2))] }).done();
  }),
  // A grain silo (14 m): a corrugated steel bin with a conical roof and top hatch, a caged ladder, the bucket
  // elevator leg with its spout, and a red farm truck waiting under the chute. Click: grain pours out of the
  // spout into the truck; click again, the chute swings back.
  e('silo', 'farm', 'farm buildings', () => {
    const b = m('silo', { edge: 'sharp' })
      .box([14, 0.2, 12], [1.5, 0.1, 1], { color: '#a7a7a0' })
      .cyl([6, 10, 6], [0, 5.2, 0], { color: '#c9ccd1' })
      .cone([6.4, 2.6, 6.4], [0, 11.5, 0], { color: '#dfe3e8' })
      .cyl([0.8, 0.5, 0.8], [0, 12.8, 0], { color: '#9da3a8' });
    b.each(9, (i) => b.torus([6.06, 6.06, 0.08], [0, 0.8 + i * 1.1, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.02, noInk: true }));
    b.pair((s) => b.stick([s * 0.25 + 1.0, 0.2, 3.0], [s * 0.25 + 1.0, 10.6, 3.0], 0.06, '#5c6166'));
    b.each(10, (i) => b.stick([0.75, 0.6 + i * 1.0, 3.0], [1.25, 0.6 + i * 1.0, 3.0], 0.04, '#5c6166'));
    b.each(5, (i) => b.torus([0.8, 0.8, 0.05], [1.0, 3.0 + i * 1.6, 3.2], { color: '#7a7f85', rot: [90, 0, 0], tube: 0.05, noInk: true }));
    b.box([0.8, 13.5, 0.8], [4.0, 6.95, -1.0], { color: '#9da3a8' })
      .box([1.2, 1.0, 1.2], [4.0, 13.9, -1.0], { color: '#7a7f85' })
      .rod([4.0, 13.6, -1.0], [0.6, 12.6, 0], 0.3, '#9da3a8')
      .rod([4.0, 6.0, -0.6], [6.0, 3.6, 1.2], 0.35, '#e8a02a', { name: 'chute', pivot: [4.0, 6.0, -0.6] });
    b.box([2.4, 1.4, 3.0], [6.2, 1.3, 3.2], { color: '#d8312a', round: 0.1 })
      .box([2.4, 1.6, 1.8], [6.2, 1.4, 5.6], { color: '#d8312a', round: 0.1 })
      .box([2.2, 0.6, 0.06], [6.2, 1.9, 6.52], { color: '#9fd0ea' })
      .dome([2.0, 0.6, 2.6], [6.2, 2.0, 3.2], { color: '#e2c35a', name: 'grain', edge: 'soft' });
    axle(b, 'F', 5.6, 2.2, 0.9, 0.3);
    axle(b, 'B', 2.6, 2.2, 0.9, 0.4);
    return b
      .act({ click: [[A.pose('chute', { rot: [0, 0, -8], dur: 0.4 }), A.par(A.effect('dust', { dur: 2.5 }), A.pose('grain', { scale: 1.3, dur: 2.5 }), A.say('Whoosh!', 2))], [A.par(A.pose('chute', { rot: [0, 0, 0], dur: 0.4 }), A.pose('grain', { scale: 1, dur: 0.4 }))]] })
      .done();
  }),
  // Silver as a material: a pyramid of stamped silver ingots and a stack of silver coins beside it. Click: they
  // gleam, ting!
  e('silver (material)', 'workshop', 'materials', () => {
    const b = m('silver (material)', { edge: 'sharp' });
    for (const [xx, y] of [[-0.25, 0.04], [0, 0.04], [0.25, 0.04], [-0.125, 0.12], [0.125, 0.12], [0, 0.2]] as Array<[number, number]>) b.box([0.24, 0.08, 0.11], [xx, y, 0], { color: '#dfe3e8', round: 0.15 }).label('999', [0.08, 0.025], [xx, y + 0.041, 0.0], { color: '#dfe3e8', rot: [-90, 0, 0], depth: 0.002 });
    b.each(5, (i) => b.cyl([0.07, 0.01, 0.07], [0.42 + (i % 2) * 0.003, 0.005 + i * 0.011, 0.12], { color: '#d4d7da' }));
    b.cyl([0.07, 0.01, 0.07], [0.5, 0.005, 0.04], { color: '#d4d7da', rot: [0, 0, 8] });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ting!', 1))] }).done();
  }),
  // A silver bullet (7 cm cartridge) standing on a little black velvet cushion: a brass case with its rim and
  // primer, and the gleaming silver bullet. Click: it glints with a gleam of moonlight.
  e('silver bullet', 'armory', 'ammo', () =>
    m('silver bullet')
      .box([0.08, 0.02, 0.08], [0, 0.01, 0], { color: '#2a2726', round: 0.6 })
      .cyl([0.03, 0.05, 0.03], [0, 0.045, 0], { color: '#d0a84a', edge: 'sharp', name: 'bullet' })
      .cyl([0.032, 0.006, 0.032], [0, 0.023, 0], { color: '#d0a84a', edge: 'sharp', parent: 'bullet' })
      .cyl([0.03, 0.02, 0.03], [0, 0.08, 0], { color: '#dfe3e8', taper: 0.85, parent: 'bullet' })
      .ball([0.026, 0.04, 0.026], [0, 0.095, 0], { color: '#eef2f5', parent: 'bullet' })
      .act({ click: [A.par(A.pose('bullet', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1.2 }), A.say('Gleam!', 1)), A.pose('bullet', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A kitchen sink unit at real size (worktop 0.9 m): a white cabinet with two doors, a dark worktop with a
  // stainless basin and drainer, a swan-neck mixer tap with a lever, a sponge and washing-up liquid. Click: the
  // tap runs; click again, it stops.
  e('sink', 'kitchen', 'fixtures', () =>
    m('sink', { edge: 'sharp' })
      .box([1.0, 0.84, 0.6], [0, 0.42, 0], { color: '#f2f2ee', round: 0.04 })
      .box([1.04, 0.05, 0.64], [0, 0.865, 0], { color: '#3a3f45', round: 0.1 })
      .box([0.5, 0.02, 0.42], [-0.18, 0.88, 0.03], { color: '#b9c2ca', round: 0.3 })
      .box([0.44, 0.01, 0.36], [-0.18, 0.886, 0.03], { color: '#5c6166', round: 0.3, noInk: true })
      .box([0.34, 0.012, 0.42], [0.28, 0.881, 0.03], { color: '#c9ccd1', round: 0.2 })
      .rod([-0.18, 0.88, -0.24], [-0.18, 1.2, -0.22], 0.035, '#c9ccd1')
      .arc([0.26, 0.24, 0.035], [-0.18, 1.08, -0.1], { color: '#c9ccd1', rot: [0, 90, 0], tube: 0.13 })
      .box([0.03, 0.02, 0.1], [-0.12, 1.15, -0.22], { color: '#9da3a8', name: 'lever', pivot: [-0.12, 1.15, -0.27] })
      .stick([-0.18, 1.06, 0.03], [-0.18, 0.9, 0.03], 0.03, '#9fd8f0', { name: 'water', scale: 0, edge: 'soft' })
      .box([0.1, 0.05, 0.07], [0.25, 0.905, 0.1], { color: '#f6d24a', round: 0.4, edge: 'soft' })
      .box([0.1, 0.012, 0.07], [0.25, 0.934, 0.1], { color: '#5aa553', round: 0.2 })
      .box([0.07, 0.18, 0.05], [0.38, 0.97, -0.15], { color: '#4fc3a5', round: 0.4, edge: 'soft' })
      .box([0.47, 0.66, 0.02], [-0.24, 0.42, 0.31], { color: '#f7f5ef', round: 0.1, name: 'doorL', pivot: [-0.48, 0.42, 0.31], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.02, 0.12, 0.03], [-0.04, 0.6, 0.33], { color: '#c9ccd1', parent: 'doorL' })
      .box([0.47, 0.66, 0.02], [0.24, 0.42, 0.31], { color: '#f7f5ef', round: 0.1 })
      .box([0.02, 0.12, 0.03], [0.04, 0.6, 0.33], { color: '#c9ccd1' })
      .act({ click: [[A.pose('lever', { rot: [-30, 0, 0], dur: 0.2 }), A.par(A.pose('water', { scale: 1, dur: 0.2 }), A.effect('water_spray', { dur: 2 }), A.say('Splish!', 1))], [A.par(A.pose('lever', { rot: [0, 0, 0], dur: 0.2 }), A.pose('water', { scale: 0, dur: 0.2 }), A.say('Drip.', 0.8))]] })
      .done(),
  ),
  // A sinkhole (12 m patch of ground): a dark pit that has swallowed part of a road, broken asphalt slabs tipping
  // into it, warning cones and a barrier with tape, a tree leaning at the edge. Click: rumble, another slab of
  // road breaks off and slides in; click again, the scene settles back.
  e('sinkhole', 'nature', 'landforms', () => {
    const b = m('sinkhole', { edge: 'sharp' })
      .box([12, 0.3, 12], [0, 0.15, 0], { color: '#6ab04c' })
      .box([4, 0.32, 12], [3.5, 0.16, 0], { color: '#4a4c50' })
      .cyl([5.2, 0.05, 4.6], [0.5, 0.33, 0.3], { color: '#1e1c1b' })
      .torus([5.6, 5.0, 0.4], [0.5, 0.3, 0.3], { color: '#8a6440', rot: [90, 0, 0], tube: 0.1, edge: 'soft' })
      .box([1.6, 0.3, 1.2], [2.5, 0.1, 0.3], { color: '#4a4c50', rot: [0, 10, 25], name: 'slab', pivot: [3.3, 0.3, 0.3] })
      .box([1.2, 0.3, 1.0], [2.4, -0.1, -1.0], { color: '#4a4c50', rot: [10, -15, 35] })
      .cyl([0.35, 3.2, 0.35], [-2.3, 1.7, -2.0], { color: '#7a5134', rot: [0, 0, 18] })
      .ball([2.0, 1.6, 1.8], [-2.9, 3.5, -2.0], { color: '#4f9a48', edge: 'soft' });
    for (const [xx, z] of [[3.2, 3.6], [4.4, 3.6], [3.2, -3.4], [4.4, -3.4], [-2.4, 3.0]] as Array<[number, number]>) b.box([0.38, 0.04, 0.38], [xx, 0.34, z], { color: '#2a2726' }).cyl([0.3, 0.65, 0.3], [xx, 0.68, z], { color: '#f0782a', taper: 0.14, edge: 'soft' }).cyl([0.22, 0.08, 0.22], [xx, 0.7, z], { color: 'white', taper: 0.75, edge: 'soft' });
    b.stick([3.2, 0.9, 3.6], [-2.4, 0.9, 3.0], 0.04, '#f6d24a').stick([3.2, 0.9, -3.4], [4.4, 0.9, -3.4], 0.04, '#f6d24a');
    return b.act({ click: [[A.par(A.pose('slab', { rot: [0, 0, 30], move: [-0.6, -0.6, 0], dur: 0.8 }), A.effect('dust', { dur: 2 }), A.anim('shake', 2), A.say('Rumble...', 2))], [A.pose('slab', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A skate park (16 m x 12 m): a concrete half-pipe of two curved plywood walls with decks, coping and rails, a
  // grind rail, a funbox with ramps, and graffiti. Click: a skater rolls up, thumbs up, "Gnarly!", and leaves.
  e('skate park', 'places', 'parks', () => {
    const b = m('skate park', { edge: 'sharp' }), R = 1.8, W = 4, n = 8;
    b.box([16, 0.2, 13], [0, 0.1, 0], { color: '#c4c2b8', round: 0.01 });
    b.pair((s) => {
      const cx = s * 2.2;
      b.each(n, (i) => {
        const ph = ((i + 0.5) / n) * 90 * D2R;
        b.box([R * (Math.PI / 2 / n) + 0.05, 0.05, W], [cx + s * R * Math.sin(ph), 0.2 + R - R * Math.cos(ph), -2], { color: i % 2 ? '#a7a39a' : '#b8b5ac', rot: [0, 0, s * (ph / D2R)], round: 0.1 });
      });
      b.each(5, (k) => {
        const yy = 0.2 + (k + 0.5) * (R / 5), xx = cx + s * Math.sqrt(Math.max(0, R * R - (R - (yy - 0.2)) * (R - (yy - 0.2))));
        const outer = cx + s * (R + 1.3);
        b.box([Math.abs(outer - xx), R / 5 + 0.01, 0.1], [(xx + outer) / 2, yy, -2 + s * 0 + W / 2], { color: '#8f8c86' });
        b.box([Math.abs(outer - xx), R / 5 + 0.01, 0.1], [(xx + outer) / 2, yy, -2 - W / 2], { color: '#8f8c86' });
      });
      b.box([1.3, 0.08, W + 0.1], [cx + s * (R + 0.65), 0.2 + R + 0.02, -2], { color: '#9a6a3e' });
      b.stick([cx + s * R, 0.2 + R + 0.05, -2 - W / 2], [cx + s * R, 0.2 + R + 0.05, -2 + W / 2], 0.07, '#c9ccd1');
      b.stick([cx + s * (R + 1.25), 0.2 + R, -2 - W / 2], [cx + s * (R + 1.25), 0.2 + R + 1.0, -2 - W / 2], 0.06, '#8f99a3').stick([cx + s * (R + 1.25), 0.2 + R, -2 + W / 2], [cx + s * (R + 1.25), 0.2 + R + 1.0, -2 + W / 2], 0.06, '#8f99a3').stick([cx + s * (R + 1.25), 0.2 + R + 1.0, -2 - W / 2], [cx + s * (R + 1.25), 0.2 + R + 1.0, -2 + W / 2], 0.06, '#8f99a3');
      b.ball([1.4, 0.7, 0.04], [cx + s * (R + 0.6), 1.0, -2 + W / 2 + 0.06], { color: s > 0 ? '#d64fa0' : '#9be34d', noInk: true });
    });
    b.box([4.4, 0.2, W], [0, 0.3, -2], { color: '#b8b5ac' });
    b.stick([-3, 0.6, 3.5], [3, 0.6, 3.5], 0.08, '#f6d24a');
    b.pair((s) => b.stick([s * 2.6, 0.2, 3.5], [s * 2.6, 0.6, 3.5], 0.08, '#f6d24a'));
    b.box([2.4, 0.6, 1.6], [-4.5, 0.5, 4.5], { color: '#b8b5ac' }).wedge([1.6, 0.6, 1.6], [-6.3, 0.5, 4.5], { color: '#a7a39a', rot: [0, 90, 0], apex: 0.5 });
    return b.act({ click: [A.spawn('sk', 'skater', { rel: 'front', of: 'self', dist: 'near' }), A.par(A.anim('thumbs_up', 1, 'sk'), A.say('Gnarly!', 1.8, 'sk')), A.wait(0.5), A.remove('sk', 'fade')] }).done();
  }),
  // A skateboard (80 cm) stood up on its tail: the printed graphic on the underside, black grip tape on top,
  // trucks with four cream wheels. Click: it drops onto its wheels, clack; click again, it pops back up.
  e('skateboard', 'sports', 'skating', () => {
    const b = m('skateboard')
      .box([0.21, 0.8, 0.02], [0, 0.43, 0], { color: '#2a2726', round: 0.6, edge: 'sharp', name: 'board', pivot: [0, 0.03, -0.01] })
      .box([0.19, 0.7, 0.006], [0, 0.43, 0.012], { color: '#f0923b', noInk: true, round: 0.6, parent: 'board' })
      .star(0.12, [0, 0.43, 0.018], { color: '#f6d24a', noInk: true, parent: 'board' });
    for (const y of [0.18, 0.68]) {
      b.box([0.14, 0.04, 0.04], [0, y, 0.035], { color: '#c9ccd1', round: 0.3, parent: 'board', edge: 'sharp' });
      b.pair((s) => b.cyl([0.06, 0.05, 0.06], [s * 0.1, y, 0.06], { color: '#f2e6cf', rot: [0, 0, 90], parent: 'board' }));
    }
    return b.act({ click: [[A.pose('board', { rot: [90, 0, 0], move: [0, 0.07, 0], dur: 0.35 }), A.say('Clack!', 1)], [A.pose('board', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.say('Pop!', 0.8)]] }).done();
  }),
  // An anatomy-class skeleton on its stand (1.75 m): skull with a hinged jaw, spine, rib cage, collarbones, pelvis,
  // arm and leg bones with kneecaps, hands and feet. Click: its jaw chatters, clack clack; click again, it waves.
  e('skeleton', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('skeleton')
      .cyl([0.4, 0.04, 0.4], [0, 0.02, -0.05], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.04, -0.14], [0, 1.45, -0.14], 0.03, '#9da3a8', { edge: 'sharp' })
      .ball([0.16, 0.19, 0.19], [0, 1.6, 0], { color: bone })
      .box([0.12, 0.05, 0.11], [0, 1.5, 0.03], { color: bone, round: 0.5 })
      .box([0.1, 0.035, 0.09], [0, 1.465, 0.035], { color: bone, round: 0.5, name: 'jaw', pivot: [0, 1.49, -0.02] })
      .box([0.07, 0.012, 0.01], [0, 1.483, 0.08], { color: 'white', parent: 'jaw' })
      .box([0.07, 0.012, 0.01], [0, 1.495, 0.085], { color: 'white' })
      .cone([0.025, 0.03, 0.01], [0, 1.53, 0.09], { color: '#3a3633', rot: [180, 0, 0] });
    b.pair((s) => b.ball([0.05, 0.05, 0.03], [s * 0.035, 1.6, 0.08], { color: '#2a2726' }));
    b.each(14, (i) => b.box([0.04, 0.03, 0.035], [0, 0.96 + i * 0.037, -0.08], { color: '#e2d9c2', round: 0.5 }));
    b.each(7, (i) => {
      const w = 0.24 + 0.08 * Math.sin(((i + 1.5) / 8) * Math.PI);
      b.arc([w, w * 0.75, 0.016], [0, 1.37 - i * 0.045, -0.06 + w * 0.05], { color: bone, rot: [-102, 0, 0], arc: 300, tube: 0.07 });
    });
    b.box([0.035, 0.18, 0.02], [0, 1.25, 0.06], { color: bone, round: 0.4, rot: [-8, 0, 0] });
    b.ball([0.28, 0.12, 0.14], [0, 0.92, -0.04], { color: bone }).ball([0.12, 0.08, 0.06], [0, 0.88, 0.02], { color: '#2a2726', noInk: true });
    b.pair((s) => {
      b.rod([s * 0.02, 1.4, 0.03], [s * 0.17, 1.42, -0.03], 0.025, bone);
      const arm = s > 0 ? 'armL' : 'armR';
      b.rod([s * 0.19, 1.38, -0.02], [s * 0.23, 1.1, -0.02], 0.035, bone, { name: arm, pivot: [s * 0.19, 1.39, -0.02] });
      b.rod([s * 0.23, 1.1, -0.02], [s * 0.26, 0.85, 0.02], 0.022, bone, { parent: arm }).rod([s * 0.245, 1.1, -0.04], [s * 0.275, 0.85, 0.0], 0.018, bone, { parent: arm });
      b.box([0.05, 0.07, 0.02], [s * 0.27, 0.8, 0.02], { color: bone, round: 0.4, parent: arm });
      b.each(3, (i) => b.rod([s * (0.26 + i * 0.012), 0.77, 0.02], [s * (0.265 + i * 0.014), 0.71, 0.03], 0.01, bone, { parent: arm }));
      b.rod([s * 0.09, 0.9, -0.02], [s * 0.1, 0.5, 0.0], 0.045, bone);
      b.ball(0.045, [s * 0.1, 0.5, 0.03], { color: bone });
      b.rod([s * 0.1, 0.48, 0.0], [s * 0.1, 0.08, -0.01], 0.035, bone).rod([s * 0.125, 0.47, -0.02], [s * 0.125, 0.09, -0.02], 0.02, bone);
      b.box([0.08, 0.035, 0.18], [s * 0.1, 0.045, 0.05], { color: bone, round: 0.5 });
    });
    return b
      .act({
        click: [
          [A.pose('jaw', { rot: [20, 0, 0], dur: 0.1, times: 4 }), A.say('Clack clack clack!', 1.5)],
          [A.pose('armR', { rot: [0, 0, -150], dur: 0.4 }), A.par(A.pose('armR', { rot: [0, 0, -120], dur: 0.2, times: 2 }), A.say('Rattle, rattle!', 1.5)), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A pencil sketch of a house on a pad propped on a little tabletop easel, with the pencil and an eraser. Click:
  // the pencil draws a new line; click again, the eraser rubs it out.
  e('sketch', 'study', 'art supplies', () => {
    const g = '#5c6166', t = -12;
    const P = (xx: number, y: number): V => [xx, y, 0.018 - (y - 0.17) * Math.tan(-t * D2R)];
    const b = m('sketch', { edge: 'sharp' })
      .box([0.28, 0.03, 0.12], [0, 0.015, 0.02], { color: '#9a6a3e' })
      .rod([0, 0.0, -0.08], [0, 0.26, -0.02], 0.015, '#9a6a3e')
      .box([0.28, 0.025, 0.035], [0, 0.045, 0.03], { color: '#9a6a3e' })
      .box([0.24, 0.26, 0.008], [0, 0.17, 0.01], { color: '#faf6ea', rot: [t, 0, 0] });
    b.rod(P(-0.07, 0.1), P(0.07, 0.1), 0.004, g, { noInk: true }).rod(P(-0.07, 0.1), P(-0.07, 0.19), 0.004, g, { noInk: true }).rod(P(0.07, 0.1), P(0.07, 0.19), 0.004, g, { noInk: true });
    b.rod(P(-0.09, 0.19), P(0, 0.26), 0.004, g, { noInk: true }).rod(P(0, 0.26), P(0.09, 0.19), 0.004, g, { noInk: true }).rod(P(-0.09, 0.19), P(0.09, 0.19), 0.004, g, { noInk: true });
    b.rod(P(-0.015, 0.1), P(-0.015, 0.15), 0.004, g, { noInk: true }).rod(P(0.015, 0.1), P(0.015, 0.15), 0.004, g, { noInk: true }).rod(P(-0.015, 0.15), P(0.015, 0.15), 0.004, g, { noInk: true });
    b.torus([0.045, 0.045, 0.003], P(0.075, 0.26), { color: g, noInk: true, rot: [t, 0, 0], tube: 0.08 });
    b.rod(P(-0.1, 0.085), P(0.1, 0.085), 0.004, g, { noInk: true, name: 'line', scale: 0 });
    b.stick([0.06, 0.075, 0.07], [0.16, 0.16, 0.06], 0.009, '#f6d24a', { name: 'pencil' }).cone([0.009, 0.02, 0.009], [0.052, 0.068, 0.07], { color: '#e2c08a', rot: [0, 0, 130], parent: 'pencil' });
    b.box([0.04, 0.02, 0.025], [-0.1, 0.07, 0.065], { color: '#f4a1c0', round: 0.4, name: 'eraser' });
    return b
      .act({
        click: [
          [A.par(A.pose('pencil', { move: [-0.03, -0.01, 0], dur: 0.15, times: 3 }), A.pose('line', { scale: 1, dur: 0.9 }), A.say('Scritch!', 1))],
          [A.par(A.pose('eraser', { move: [0.06, 0.02, 0], dur: 0.15, times: 3 }), A.pose('line', { scale: 0, dur: 0.9 }), A.effect('dust', { dur: 0.8 }))],
        ],
      })
      .done();
  }),
  // A kebab skewer (30 cm) over a little charcoal grill: chunks of meat, green and red pepper, onion and tomato on
  // a steel skewer above glowing coals. Click: it is turned over, sizzling.
  e('skewer', 'food', 'grilled food', () => {
    const b = m('skewer')
      .box([0.4, 0.08, 0.2], [0, 0.1, 0], { color: '#2a2726', round: 0.2, edge: 'sharp' })
      .box([0.36, 0.02, 0.17], [0, 0.135, 0], { color: '#e8502a', glow: true });
    b.pair((s) => b.pair((t) => b.stick([s * 0.17, 0, t * 0.08], [s * 0.17, 0.07, t * 0.08], 0.015, '#2a2726')));
    b.each(6, (i) => b.stick([-0.19, 0.15, -0.075 + i * 0.03], [0.19, 0.15, -0.075 + i * 0.03], 0.006, '#9da3a8', { noInk: true }));
    b.stick([-0.22, 0.18, 0], [0.22, 0.18, 0], 0.006, '#c9ccd1', { name: 'skewer', edge: 'sharp' });
    ['#8a4a2a', '#5aa553', '#8a4a2a', '#e0473b', '#f2ece0', '#8a4a2a', '#e0473b'].forEach((c, i) => b.box(c === '#8a4a2a' ? 0.04 : [0.035, 0.035, 0.04], [-0.12 + i * 0.04, 0.18, 0], { color: c, round: 0.3, rot: [i * 35, 0, 0], parent: 'skewer' }));
    b.torus([0.025, 0.025, 0.006], [0.235, 0.18, 0], { color: '#c9ccd1', tube: 0.25, rot: [0, 90, 0], parent: 'skewer' });
    return b.act({ click: [A.par(A.pose('skewer', { rot: [180, 0, 0], dur: 0.6 }), A.effect('smoke', { dur: 2 }), A.say('Sizzle!', 1.5)), A.pose('skewer', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A ski hill (16 m): a snowy mountain with groomed runs marked by slalom flags, pine trees on its flanks, a
  // line of chairlift towers up the slope and a timber lodge at the bottom. Click: fresh snow falls; click
  // again, a skier swooshes up, thumbs up.
  e('ski hill', 'sports', 'ski resort', () => {
    const b = m('ski hill', { edge: 'sharp' })
      .box([34, 0.2, 30], [0, 0.1, 0], { color: '#f4f8fb' })
      .dome([28, 16, 22], [0, 8.1, -4], { color: '#f4f8fb', edge: 'soft' })
      .dome([12, 6, 10], [-10, 3.1, 4], { color: '#eaf2f7', edge: 'soft' });
    for (const [xx, z, h] of [[9, 4, 4], [11, 1, 5], [-12, -2, 4.5], [-8, 8, 3.5], [12, -6, 5], [7, 8, 3]] as V[]) b.cyl([0.4, 1, 0.4], [xx, 0.6, z], { color: '#7a5134' }).cone([h * 0.6, h, h * 0.6], [xx, h / 2 + 1, z], { color: '#2f6a34', edge: 'soft' });
    b.each(6, (i) => {
      const t = i / 6, yy = 1 + t * 12, z = 6.5 - t * 8.5;
      b.stick([-1.5 + (i % 2) * 3, yy - 0.2, z], [-1.5 + (i % 2) * 3, yy + 1.2, z], 0.08, i % 2 ? '#d8312a' : '#3f6fb5').box([0.5, 0.4, 0.02], [-1.25 + (i % 2) * 3, yy + 1.0, z], { color: i % 2 ? '#d8312a' : '#3f6fb5' });
    });
    b.each(4, (i) => b.stick([5, 1 + i * 3.6, 7.5 - i * 3], [5, 4.5 + i * 3.6, 7.5 - i * 3], 0.25, '#9da3a8').stick([4.2, 4.5 + i * 3.6, 7.5 - i * 3], [5.8, 4.5 + i * 3.6, 7.5 - i * 3], 0.15, '#9da3a8'));
    b.stick([5, 4.5, 7.5], [5, 15.3, -1.5], 0.06, '#2a2726');
    b.box([5, 3, 4], [-5, 1.7, 11], { color: '#7a5230' }).wedge([5.6, 2, 4.6], [-5, 4.2, 11], { color: '#f4f8fb', rot: [0, 90, 0] }).stick([-3.8, 3, 10.5], [-3.8, 5.2, 10.5], 0.4, '#8f8c86');
    door(b, [-5, 1.3, 13.03], 1.0, 2.2, '#5a3a22', { frame: '#3a2a1e' });
    b.pair((s) => win(b, [-5 + s * 1.5, 1.9, 13.03], 0.8, 0.8, { frame: '#3a2a1e' }));
    return b
      .act({
        click: [
          [A.par(A.effect('snow', { dur: 3 }), A.say('Fresh powder!', 2))],
          [A.spawn('sk', 'skier', { rel: 'front', of: 'self', dist: 'near' }), A.par(A.anim('thumbs_up', 1, 'sk'), A.say('Whoo-hoo!', 1.5, 'sk')), A.remove('sk', 'fade')],
        ],
      })
      .done();
  }),
  // A training ski jump (4 m): a timber in-run on a scaffold with a start platform, the take-off table, a snowy
  // landing slope with marker flags, and a crouching jumper waiting at the top. Click: the jumper races down,
  // flies and lands; click again, the next jumper is at the top.
  e('ski jump', 'sports', 'ski resort', () => {
    const b = m('ski jump', { edge: 'sharp' })
      .box([12, 0.1, 4], [1.5, 0.05, 0], { color: '#f4f8fb' })
      .box([0.9, 0.12, 1.4], [-3.4, 2.9, 0], { color: '#7a5230' });
    plank(b, [-3.0, 2.9, 0], [0.0, 0.85, 0], 1.0, 0.12, '#f4f8fb');
    plank(b, [0.0, 0.85, 0], [0.5, 0.88, 0], 1.0, 0.12, '#f4f8fb');
    b.pair((s) => plank(b, [-3.0, 3.0, s * 0.52], [0.4, 0.95, s * 0.52], 0.04, 0.12, '#d8312a'));
    b.each(5, (i) => {
      const xx = -3.6 + i * 0.85, top = Math.min(2.85, 2.85 - (xx + 3.0) * (2.05 / 3.0));
      b.pair((s) => b.stick([xx, 0.1, s * 0.45], [xx, Math.max(0.6, top), s * 0.45], 0.1, '#9a6a3e'));
    });
    b.wedge([6, 1.0, 3.6], [3.5, 0.6, 0], { color: '#f4f8fb', apex: -0.5, edge: 'soft' });
    b.each(4, (i) => b.stick([1.5 + i * 1.4, 0.1, 1.7], [1.5 + i * 1.4, 1.1 - i * 0.2, 1.7], 0.04, '#2a2726').box([0.3, 0.2, 0.02], [1.65 + i * 1.4, 1.0 - i * 0.2, 1.7], { color: i % 2 ? '#3f6fb5' : '#d8312a' }));
    b.box([1.6, 0.03, 0.06], [-3.3, 3.0, 0.1], { color: '#3f6fb5', name: 'jumper', round: 0.4 })
      .box([1.6, 0.03, 0.06], [-3.3, 3.0, -0.1], { color: '#3f6fb5', round: 0.4, parent: 'jumper' })
      .rod([-3.35, 3.05, 0.05], [-3.2, 3.38, 0.05], 0.08, '#2a2726', { parent: 'jumper' })
      .rod([-3.35, 3.05, -0.05], [-3.2, 3.38, -0.05], 0.08, '#2a2726', { parent: 'jumper' })
      .capsule([0.24, 0.42, 0.2], [-3.1, 3.5, 0], { color: '#d8312a', rot: [0, 0, -55], parent: 'jumper' })
      .ball(0.2, [-2.9, 3.68, 0], { color: '#f6d24a', parent: 'jumper' })
      .rod([-3.15, 3.5, 0.12], [-3.45, 3.35, 0.14], 0.06, '#d8312a', { parent: 'jumper' })
      .rod([-3.15, 3.5, -0.12], [-3.45, 3.35, -0.14], 0.06, '#d8312a', { parent: 'jumper' });
    return b
      .act({
        click: [
          [A.pose('jumper', { move: [3.1, -2.05, 0], rot: [0, 0, -30], dur: 0.9 }), A.par(A.pose('jumper', { move: [5.6, -1.6, 0], rot: [0, 0, -15], dur: 0.6 }), A.say('Wheee!', 1.5)), A.pose('jumper', { move: [8.2, -2.85, 0], rot: [0, 0, -5], dur: 0.6 }), A.par(A.pose('jumper', { move: [9.5, -2.9, 0], rot: [0, 0, 0], dur: 0.4 }), A.effect('snow', { dur: 1 }))],
          [A.pose('jumper', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.say('Next jumper!', 1.2)],
        ],
      })
      .done();
  }),
  // A chairlift (10.5 m): the bottom station with its bullwheel, two lattice towers with cross-arms and sheaves,
  // the haul rope up and down, three chairs with foot rests and safety bars, and the top station on the hill.
  // Click: the bullwheel turns and the chairs ride up the line.
  e('ski lift', 'sports', 'ski resort', () => {
    const b = m('ski lift', { edge: 'sharp' })
      .box([22, 0.2, 8], [0, 0.1, 0], { color: '#f4f8fb' })
      .dome([10, 5.4, 8], [8, 2.9, 0], { color: '#f4f8fb', edge: 'soft' })
      .box([2.4, 2.4, 3.2], [-9, 1.4, 0], { color: '#7a5230' })
      .wedge([3.6, 0.8, 2.8], [-9, 3.0, 0], { color: '#d8312a', rot: [0, 90, 0] })
      .box([2.4, 0.4, 3.2], [-8.6, 3.8, 0], { color: '#5c6166' })
      .torus([2.8, 2.8, 0.2], [-8.6, 4.2, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.06, name: 'bullwheel', mover: { kind: 'spin', axis: 'y', amount: 120 } })
      .box([2.0, 1.6, 2.4], [8.5, 6.3, 0], { color: '#7a5230' })
      .wedge([2.9, 0.6, 2.3], [8.5, 7.4, 0], { color: '#d8312a', rot: [0, 90, 0] });
    const top = (xx: number) => 4.2 + ((xx + 8.6) / 17.1) * 3.4;
    for (const xx of [-3, 3]) {
      const h = top(xx) + 2.4;
      b.box([0.5, h, 0.5], [xx, h / 2 + 0.2, 0], { color: '#9da3a8' }).box([0.2, 0.2, 3.0], [xx, h + 0.1, 0], { color: '#5c6166' });
      b.pair((s) => b.box([0.6, 0.15, 0.25], [xx, h - 0.05, s * 1.2], { color: '#2a2726' }));
    }
    b.pair((s) => b.stick([-8.6, 4.2, s * 1.2], [8.5, 7.6, s * 1.2], 0.05, '#2a2726'));
    b.box([0.05, 0.05, 0.05], [0, 0.5, 0], { color: '#f4f8fb', name: 'chairs' });
    for (const xx of [-6, -0.5, 5]) {
      const y = top(xx) + 0.0;
      b.stick([xx, y, 1.2], [xx, y - 1.5, 1.2], 0.05, '#2a2726', { parent: 'chairs' })
        .box([1.0, 0.08, 0.5], [xx, y - 1.6, 1.25], { color: '#3f6fb5', round: 0.3, parent: 'chairs' })
        .box([1.0, 0.45, 0.07], [xx, y - 1.35, 1.0], { color: '#3f6fb5', round: 0.3, parent: 'chairs' })
        .stick([xx - 0.5, y - 1.1, 1.55], [xx + 0.5, y - 1.1, 1.55], 0.03, '#c9ccd1', { parent: 'chairs' });
    }
    return b
      .socket('seat', [-6, top(-6) - 1.55, 1.25], 'seat', { part: 'chairs' })
      .act({ click: [A.operate('bullwheel', 'on'), A.par(A.pose('chairs', { move: [3.4, 0.68, 0], dur: 3 }), A.say('Clunk... whirrr...', 2)), A.pose('chairs', { move: [0, 0, 0], dur: 0 }), A.operate('bullwheel', 'off')] })
      .done();
  }),
  // A knitted balaclava (ski mask) on a head form: black wool with a red stripe, an opening for the eyes and one
  // for the mouth. Click: brrr, a flurry of snow and a shiver.
  e('ski mask', 'wardrobe', 'winter wear', () => {
    const b = m('ski mask')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: '#9da3a8', edge: 'sharp' })
      .cyl([0.09, 0.08, 0.09], [0, 0.07, 0], { color: '#2a2726' })
      .ball([0.19, 0.25, 0.21], [0, 0.22, 0], { color: '#2a2726' })
      .box([0.15, 0.045, 0.04], [0, 0.24, 0.085], { color: '#e8e4dc', round: 0.5 })
      .ball([0.05, 0.035, 0.02], [0, 0.155, 0.098], { color: '#e8e4dc' })
      .torus([0.2, 0.2, 0.03], [0, 0.29, 0], { color: '#d8312a', rot: [90, 0, 0], tube: 0.15, noInk: true });
    b.pair((s) => b.ball(0.022, [s * 0.035, 0.24, 0.1], { color: '#5c6166', noInk: true }));
    return b.act({ click: [A.par(A.effect('snow', { dur: 2 }), A.anim('shake'), A.say('Brrr!', 1.2))] }).done();
  }),
  // A pair of ski poles (1.2 m) stuck in a heap of snow: aluminium shafts, black grips with red wrist straps, and
  // round baskets near the tips. Click: they wobble, shhk.
  e('ski pole', 'sports', 'skiing', () => {
    const b = m('ski pole').dome([0.7, 0.2, 0.5], [0, 0.1, 0], { color: '#f4f8fb' });
    b.pair((s) => {
      const nm = s > 0 ? 'poleL' : 'poleR';
      b.stick([s * 0.12, 0.0, 0], [s * -0.18, 1.2, 0.05], 0.022, '#c9ccd1', { name: nm, pivot: [s * 0.12, 0.05, 0], edge: 'sharp' });
      b.cyl([0.04, 0.15, 0.04], [s * -0.19, 1.26, 0.05], { color: '#2a2726', rot: [0, 0, s * 14], parent: nm });
      b.torus([0.05, 0.08, 0.01], [s * -0.2, 1.18, 0.08], { color: '#d8312a', tube: 0.2, parent: nm });
      b.cyl([0.11, 0.015, 0.11], [s * 0.07, 0.24, 0.005], { color: '#d8312a', rot: [0, 0, s * 14], parent: nm });
    });
    return b.act({ click: [A.par(A.pose('poleL', { rot: [0, 0, 6], dur: 0.15, times: 2 }), A.pose('poleR', { rot: [0, 0, -6], dur: 0.15, times: 2 }), A.say('Shhk!', 1))] }).done();
  }),
  // A pot of skin cream (9 cm): a white jar of thick cream whipped into a peak, its pink lid beside it. Click: the
  // lid goes back on and it gleams; click again, off it comes.
  e('skin cream', 'home', 'bathroom', () =>
    m('skin cream')
      .cyl([0.09, 0.05, 0.09], [0, 0.025, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.08, 0.004, 0.08], [0, 0.051, 0], { color: '#fff3d6' })
      .ball([0.05, 0.025, 0.05], [0, 0.058, 0], { color: '#fff3d6' })
      .cone([0.015, 0.025, 0.015], [0.005, 0.078, 0], { color: '#fff3d6', rot: [0, 0, -30] })
      .label('CREAM', [0.05, 0.014], [0, 0.025, 0.046], { color: 'white', depth: 0.002 })
      .cyl([0.095, 0.022, 0.095], [0.09, 0.04, -0.03], { color: '#f4a1c0', rot: [60, 0, -20], name: 'lid', edge: 'sharp' })
      .act({ click: [[A.pose('lid', { move: [-0.09, 0.025, 0.03], rot: [-60, 0, 20], dur: 0.5 }), A.effect('sparkle', { dur: 1 })], [A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 }), A.say('Smooth!', 1)]] })
      .done(),
  ),
  // A red pleated skirt on a dressmaker's waist form (1.1 m): a waistband with a button and knife pleats all
  // round. Click: it twirls and flares.
  e('skirt', 'wardrobe', 'dresses', () => {
    const b = m('skirt')
      .cyl([0.36, 0.03, 0.36], [0, 0.015, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.5, 0], 0.04, '#7a5230', { edge: 'sharp' })
      .cyl([0.3, 0.26, 0.22], [0, 1.0, 0], { color: '#f2e6cf', taper: 1.15 })
      .cyl([0.5, 0.52, 0.42], [0, 0.6, 0], { color: '#d8312a', taper: 0.55, name: 'skirt', pivot: [0, 0.86, 0] })
      .cyl([0.28, 0.06, 0.24], [0, 0.87, 0], { color: '#a3322a', parent: 'skirt' })
      .ball(0.02, [0.0, 0.87, 0.12], { color: '#e2b23a', parent: 'skirt' });
    b.each(10, (i) => b.rod(surf([0, 0.84, 0], [0.135, 0, 0.115], -90 + i * 20, 0), surf([0, 0.35, 0], [0.245, 0, 0.205], -90 + i * 20, 0), 0.01, '#a3322a', { noInk: true, parent: 'skirt' }));
    return b.act({ click: [A.par(A.pose('skirt', { rot: [0, 360, 0], scale: 1.12, dur: 0.8 }), A.say('Twirl!', 1)), A.pose('skirt', { rot: [0, 0, 0], scale: 1, dur: 0.3 })] }).done();
  }),
  // A pair of skis (1.7 m) standing upright in the snow, tips curled, red and blue tops with bindings. Click: they
  // clack together.
  e('skis', 'sports', 'skiing', () => {
    const b = m('skis').dome([0.7, 0.2, 0.5], [0, 0.1, 0], { color: '#f4f8fb' });
    b.pair((s) => {
      const nm = s > 0 ? 'skiL' : 'skiR', c = s > 0 ? '#d8312a' : '#3f6fb5';
      b.box([0.085, 1.55, 0.022], [s * 0.06, 0.8, 0], { color: c, round: 0.4, name: nm, pivot: [s * 0.06, 0.05, 0], edge: 'sharp' });
      b.rod([s * 0.06, 1.56, 0.0], [s * 0.06, 1.68, 0.06], 0.03, c, { parent: nm });
      b.box([0.08, 0.14, 0.06], [s * 0.06, 0.8, 0.035], { color: '#3a3633', round: 0.3, parent: nm, edge: 'sharp' });
      b.box([0.087, 0.5, 0.004], [s * 0.06, 1.1, 0.012], { color: 'white', noInk: true, parent: nm });
    });
    return b.act({ click: [A.par(A.pose('skiL', { rot: [0, 0, 4], dur: 0.12, times: 2 }), A.pose('skiR', { rot: [0, 0, -4], dur: 0.12, times: 2 }), A.say('Clack, clack!', 1))] }).done();
  }),
  // A human skull (22 cm, real size): the rounded cranium, deep eye sockets, cheekbones, the nasal opening, a row
  // of upper teeth, and a hinged jaw with its own teeth. Click: it chatters, clack clack.
  e('skull', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('skull')
      .ball([0.16, 0.17, 0.2], [0, 0.15, -0.01], { color: bone })
      .box([0.12, 0.05, 0.1], [0, 0.07, 0.04], { color: bone, round: 0.5 })
      .box([0.1, 0.035, 0.09], [0, 0.03, 0.04], { color: bone, round: 0.5, name: 'jaw', pivot: [0, 0.06, -0.02] });
    b.pair((s) => b.ball([0.045, 0.045, 0.02], [s * 0.035, 0.13, 0.085], { color: '#2a2726' }).ball([0.04, 0.03, 0.05], [s * 0.065, 0.1, 0.05], { color: bone }));
    b.cone([0.026, 0.03, 0.012], [0, 0.093, 0.093], { color: '#2a2726', rot: [180, 0, 0] });
    b.each(6, (i) => b.box([0.011, 0.016, 0.006], [-0.028 + i * 0.011, 0.055, 0.087], { color: 'white' }));
    b.each(6, (i) => b.box([0.011, 0.014, 0.006], [-0.028 + i * 0.011, 0.043, 0.083], { color: 'white', parent: 'jaw' }));
    return b.act({ click: [A.pose('jaw', { rot: [18, 0, 0], dur: 0.1, times: 4 }), A.say('Clack clack!', 1.2)] }).done();
  }),
  // A knitted navy skullcap (beanie) with a ribbed, turned-up cuff, on a head form. Click: it is tugged snug.
  e('skullcap', 'wardrobe', 'hats', () => {
    const b = m('skullcap')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: '#9da3a8', edge: 'sharp' })
      .cyl([0.08, 0.08, 0.08], [0, 0.07, 0], { color: '#e8e4dc' })
      .ball([0.18, 0.22, 0.2], [0, 0.22, 0], { color: '#e8e4dc' })
      .dome([0.205, 0.13, 0.22], [0, 0.305, -0.005], { color: '#2f4f8f', name: 'cap', pivot: [0, 0.25, 0] })
      .torus([0.21, 0.22, 0.05], [0, 0.27, -0.005], { color: '#3a5a9a', rot: [90, 0, 0], tube: 0.2, parent: 'cap' });
    b.each(8, (i) => b.stick(surf([0, 0.25, -0.005], [0.105, 0.04, 0.113], i * 45, 0), surf([0, 0.25, -0.005], [0.105, 0.04, 0.113], i * 45, 60), 0.006, '#26427a', { parent: 'cap', noInk: true }));
    b.pair((s) => b.ball(0.018, [s * 0.035, 0.22, 0.095], { color: '#5c6166', noInk: true }));
    return b.act({ click: [A.pose('cap', { move: [0, -0.012, 0], dur: 0.15, times: 2 }), A.say('Snug!', 1)] }).done();
  }),
  // A piece of tiled roof (1.8 m) with a skylight set into the slope: a white frame and a glazed sash hinged at
  // the top. Click: the sash opens outward for fresh air; click again, it shuts.
  e('skylight', 'home', 'windows', () => {
    const b = m('skylight', { edge: 'sharp' }).wedge([1.8, 1.0, 1.4], [0, 0.5, 0], { color: '#c0503a', apex: -0.5 });
    const ang = (-Math.atan2(1.0, 1.8) * 180) / Math.PI, sl = ang * D2R;
    const along = (u: number, h: number): V => [-0.9 + Math.cos(-sl) * 0 + u * Math.cos(sl) - h * Math.sin(sl), 1.0 + u * Math.sin(sl) + h * Math.cos(sl), 0];
    b.each(5, (i) => b.box([0.03, 0.02, 1.42], along(0.2 + i * 0.36, 0.01), { color: '#a0402a', rot: [0, 0, ang], noInk: true }));
    b.box([0.66, 0.08, 0.66], along(1.0, 0.04), { color: 'white', rot: [0, 0, ang] });
    const hinge = along(0.7, 0.09), mid = along(1.0, 0.09);
    b.box([0.58, 0.05, 0.58], mid, { color: '#9fd0ea', rot: [0, 0, ang], name: 'sash', pivot: hinge, mover: { kind: 'swing', axis: 'z', amount: 35 } })
      .box([0.6, 0.06, 0.04], along(1.0, 0.1), { color: 'white', rot: [0, 0, ang], parent: 'sash' });
    return b.act({ click: [[A.operate('sash', 'open'), A.say('Creak!', 1)], [A.operate('sash', 'close'), A.say('Click.', 0.8)]] }).done();
  }),
  // A glass skyscraper (built at 80 m, the most the town allows; the vocabulary's 3 m is a model): a stone podium
  // with a glazed lobby, a tall tower with mullions and floor bands, a set-back upper tower, a crown and a spire
  // with an aircraft beacon. Click: the windows light up floor by floor and the beacon blinks; click again, off.
  e('skyscraper', 'places', 'towers', () => {
    const g = '#3f5f8a', gl = '#a9cce8';
    const b = m('skyscraper', { edge: 'sharp' })
      .box([40, 0.3, 40], [0, 0.15, 0], { color: '#c9c6bd' })
      .box([26, 8, 26], [0, 4.3, 0], { color: '#d4cfc2', round: 0.01 })
      .box([16, 6, 0.3], [0, 3.3, 13.1], { color: '#9fd0ea' })
      .box([18, 50, 18], [0, 33.3, 0], { color: g, round: 0 })
      .box([12, 14, 12], [0, 65.3, 0], { color: g, round: 0 })
      .box([8, 3, 8], [0, 73.8, 0], { color: '#c9ccd1', round: 0 })
      .stick([0, 75.3, 0], [0, 79.4, 0], 0.4, '#c9ccd1')
      .ball(0.8, [0, 79.6, 0], { color: '#ff3a2a', name: 'beacon', mover: { kind: 'light' } });
    door(b, [0, 1.4, 13.28], 2.0, 2.5, '#9fd0ea', { glass: true, frame: '#5c6166' });
    b.label('TOWER ONE', [8, 1.2], [0, 7.2, 13.05], { color: '#d4cfc2', depth: 0.1 });
    b.each(8, (i) => b.box([18.06, 3.2, 18.06], [0, 10.6 + i * 6, 0], { color: gl, round: 0, name: `lights${i}`, mover: { kind: 'light' }, noInk: true }));
    b.each(3, (i) => b.box([12.06, 3.2, 12.06], [0, 60.6 + i * 4.5, 0], { color: gl, round: 0, name: `lightsU${i}`, mover: { kind: 'light' }, noInk: true }));
    b.pair((s) => b.each(5, (i) => b.box([0.25, 50, 0.25], [s * 9.05, 33.3, -6 + i * 3], { color: '#2f4570' }).box([0.25, 50, 0.25], [-6 + i * 3, 33.3, s * 9.05], { color: '#2f4570' })));
    return b.act({ click: [[A.operate('lights', 'on'), A.operate('beacon', 'on'), A.say('Ding!', 1)], [A.operate('lights', 'off'), A.operate('beacon', 'off')]] }).done();
  }),
  // A wooden sled (1 m): slatted deck on steam-bent runners that curl up at the front, cross braces, a steering
  // bar and a pull rope. Click: it slides off a little way, whee!, and back.
  e('sled', 'sports', 'winter sports', () => {
    const b = m('sled', { view: 'side' })
      .box([0.4, 0.04, 0.72], [0, 0.17, -0.05], { color: '#b5814e', round: 0.3, edge: 'sharp' });
    b.each(4, (i) => b.box([0.41, 0.012, 0.012], [0, 0.192, -0.32 + i * 0.18], { color: '#7a5230', noInk: true }));
    b.pair((s) => {
      b.rod([s * 0.16, 0.02, -0.45], [s * 0.16, 0.02, 0.32], 0.025, '#d8312a').arc([0.3, 0.3, 0.025], [s * 0.16, 0.17, 0.32], { color: '#d8312a', rot: [0, 90, 0], arc: 120, tube: 0.1 });
      b.stick([s * 0.16, 0.03, -0.25], [s * 0.16, 0.15, -0.25], 0.03, '#d8312a').stick([s * 0.16, 0.03, 0.1], [s * 0.16, 0.15, 0.1], 0.03, '#d8312a');
    });
    b.box([0.42, 0.03, 0.07], [0, 0.2, 0.36], { color: '#7a5230', edge: 'sharp' });
    b.rod([0.12, 0.2, 0.38], [0.0, 0.08, 0.62], 0.012, '#d9b98a').rod([-0.12, 0.2, 0.38], [0.0, 0.08, 0.62], 0.012, '#d9b98a');
    return b
      .socket('seat', [0, 0.2, -0.1], 'seat')
      .act({ click: [A.move('self', { rel: 'left', of: 'self', dist: 'close' }, { speed: 'run', style: 'slide' }), A.say('Wheee!', 1), A.move('self', { rel: 'right', of: 'self', dist: 'close' }, { speed: 'walk', style: 'slide' })] })
      .done();
  }),
];

