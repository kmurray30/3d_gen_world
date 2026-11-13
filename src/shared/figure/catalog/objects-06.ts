/** Catalog chunk objects-06: the words in assign/objects-06.tsv (laundry detergent .. odometer), each at its real
 *  size beside a 1.7 m person, with crisp or soft edges chosen per part, named movers, pieces and sockets where the
 *  real thing has them, and an act: what it does when clicked. */
import { e, type CatalogEntry } from './types';
import { A, around, col, m, withAct, type M } from '../dsl';
import { who, type Extra } from '../accessories';

type V = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/* ----- v2 helpers: real-size parts with crisp or soft edges, movers and pieces ----- */

const S = 'sharp' as const;
const F = 'soft' as const;

/** A tyre on an axle along x, with a crisp hub riding on it. Name it wheel* so it rolls when the thing moves. */
const tyre = (b: M, name: string, at: V, d: number, w: number, hub = '#c9ccd1', parent?: string): M =>
  b.torus([d, d, w], at, { color: 'rubber', rot: [0, 90, 0], tube: 0.4, name, edge: F, ...(parent ? { parent } : {}) })
    .cyl([d * 0.64, w * 0.8, d * 0.64], at, { color: hub, rot: [0, 0, 90], parent: name, edge: S, round: 0.3 })
    .cyl([d * 0.22, w * 0.92, d * 0.22], at, { color: '#5c6166', rot: [0, 0, 90], parent: name, edge: S });

/** A lamp that switches (a `light` mover, off at rest): headlights, tail lights, porch lamps. */
const lamp = (b: M, name: string, size: [number, number, number] | number, at: V, color = '#fff6c8', o: { parent?: string; on?: boolean; box?: boolean } = {}): M =>
  (o.box ? b.box.bind(b) : b.ball.bind(b))(size, at, { color, glow: true, name, edge: S, mover: { kind: 'light', on: !!o.on }, ...(o.parent ? { parent: o.parent } : {}) });

/** A window on a wall facing +z, -z, +x or -x: a crisp frame, glass a little proud of it, a cross bar and a sill.
 *  `at` is its centre on the wall's surface. */
const win = (b: M, at: V, w: number, h: number, o: { face?: 'z' | '-z' | 'x' | '-x'; frame?: string; glass?: string; bars?: boolean; sill?: boolean; parent?: string } = {}): M => {
  const f = o.face ?? 'z';
  const n: V = f === 'z' ? [0, 0, 1] : f === '-z' ? [0, 0, -1] : f === 'x' ? [1, 0, 0] : [-1, 0, 0];
  const along = f === 'z' || f === '-z';
  const s = (a: number, hh: number, t: number): V => (along ? [a, hh, t] : [t, hh, a]);
  const p = (k: number, dy = 0): V => [at[0] + n[0] * k, at[1] + dy, at[2] + n[2] * k];
  const fr = o.frame ?? 'white';
  const par = o.parent ? { parent: o.parent } : {};
  b.box(s(w + 0.16, h + 0.16, 0.06), p(0.02), { color: fr, edge: S, round: 0.2, ...par })
    .box(s(w, h, 0.04), p(0.045), { color: o.glass ?? '#8fbcd8', edge: S, round: 0.1, ...par });
  if (o.bars !== false) b.box(s(0.05, h, 0.03), p(0.07), { color: fr, edge: S, round: 0.2, ...par }).box(s(w, 0.05, 0.03), p(0.07), { color: fr, edge: S, round: 0.2, ...par });
  if (o.sill !== false) b.box(s(w + 0.26, 0.07, 0.14), p(0.07, -h / 2 - 0.06), { color: fr, edge: S, round: 0.2, ...par });
  return b;
};

/** A door in a wall facing +z: a crisp frame and a leaf that swings out on its hinge (the viewer's left), with a
 *  handle at 1 m. `at` is [centre x, floor y, wall surface z]. */
const door = (b: M, at: V, w: number, h: number, o: { color?: string; frame?: string; name?: string; glass?: boolean; amount?: number; parent?: string } = {}): M => {
  const [x, y0, z] = at, name = o.name ?? 'door';
  const par = o.parent ? { parent: o.parent } : {};
  b.box([w + 0.24, h + 0.12, 0.08], [x, y0 + (h + 0.12) / 2, z + 0.01], { color: o.frame ?? 'white', edge: S, round: 0.15, ...par })
    .box([w, h, 0.07], [x, y0 + h / 2, z + 0.07], { color: o.color ?? 'darkwood', edge: S, round: 0.15, name, pivot: [x - w / 2, y0 + h / 2, z + 0.07], mover: { kind: 'swing', axis: 'y', amount: o.amount ?? -100 }, ...par })
    .ball(0.07, [x + w / 2 - 0.1, y0 + 1.0, z + 0.13], { color: 'brass', parent: name, edge: S });
  if (o.glass) b.box([w * 0.62, h * 0.38, 0.02], [x, y0 + h * 0.7, z + 0.11], { color: '#8fbcd8', parent: name, edge: S, round: 0.2 });
  else b.box([w * 0.66, h * 0.3, 0.02], [x, y0 + h * 0.7, z + 0.11], { color: o.color ?? 'darkwood', parent: name, edge: S, round: 0.3 }).box([w * 0.66, h * 0.3, 0.02], [x, y0 + h * 0.3, z + 0.11], { color: o.color ?? 'darkwood', parent: name, edge: S, round: 0.3 });
  return b;
};

/** A gable roof over a w x d box whose walls end at y: the ridge runs along x (ridgeX) or z, with eaves. */
const gable = (b: M, w: number, d: number, y: number, rise: number, color: string, o: { ridgeX?: boolean; z?: number; x?: number; eave?: number } = {}): M => {
  const ev = o.eave ?? 0.35, cx = o.x ?? 0, cz = o.z ?? 0;
  return o.ridgeX
    ? b.wedge([d + ev * 2, rise, w + ev * 2], [cx, y + rise / 2, cz], { color, rot: [0, 90, 0], edge: S })
    : b.wedge([w + ev * 2, rise, d + ev * 2], [cx, y + rise / 2, cz], { color, edge: S });
};

/** A tree at its real size: a tapering trunk with boughs, a crown of leafy clumps (the 'top', which sways) and
 *  fruit that are pieces (fruit0..n), so one can drop off. */
const tree2 = (key: string, h: number, leaf: string, o: { leaf2?: string; trunk?: string; fruit?: string; fs?: number; n?: number; shape?: 'round' | 'wide' | 'tall'; bough?: number } = {}): M => {
  const b = m(key);
  const shape = o.shape ?? 'round';
  const tk = o.trunk ?? 'bark', tw = h * (shape === 'wide' ? 0.075 : 0.06);
  const cw = shape === 'wide' ? h * 0.95 : shape === 'tall' ? h * 0.5 : h * 0.7;
  const ch = shape === 'tall' ? h * 0.66 : shape === 'wide' ? h * 0.5 : h * 0.58;
  const cy = h - ch / 2;
  const fork = h - ch * 0.82;
  b.cyl([tw, fork + h * 0.06, tw], [0, (fork + h * 0.06) / 2, 0], { color: tk, taper: 0.72, name: 'trunk' })
    .cyl([tw * 1.5, h * 0.03, tw * 1.5], [0, h * 0.012, 0], { color: tk, taper: 0.6, parent: 'trunk', blend: 2 });
  around(o.bough ?? 3, cw * 0.22, 0.6).forEach(([bx, bz]) => b.rod([0, fork * 0.92, 0], [bx, fork + ch * 0.32, bz], tw * 0.45, tk, { parent: 'trunk' }));
  b.ball([cw * 0.7, ch * 0.72, cw * 0.7], [0, cy, 0], { color: leaf, name: 'top', pivot: [0, fork, 0] });
  const l2 = o.leaf2 ?? leaf;
  around(6, cw * 0.3, 0.3).forEach(([x, z], i) => b.ball([cw * 0.46, ch * 0.5, cw * 0.46], [x, cy - ch * (i % 2 ? 0.12 : 0.02), z], { color: i % 2 ? l2 : leaf, parent: 'top' }));
  b.ball([cw * 0.42, ch * 0.42, cw * 0.42], [cw * 0.05, cy + ch * 0.3, -cw * 0.04], { color: l2, parent: 'top' });
  if (o.fruit) around(o.n ?? 8, cw * 0.47, 0.2).forEach(([x, z], i) => b.ball(o.fs ?? 0.08, [x * (i % 2 ? 0.92 : 1), cy - ch * (0.08 + 0.09 * (i % 3)), z * (i % 2 ? 0.92 : 1)], { color: o.fruit!, parent: 'top', name: `fruit${i}`, piece: true }));
  return b;
};

/** The act of a fruit tree: a shake and a fruit drops; next click it grows back. */
const fruitAct = (thud = 'Thud!'): Parameters<M['act']>[0] => ({
  click: [
    [A.par(A.anim('shake'), A.say('Rustle rustle', 1.2)), A.detach('fruit0', 'fruit'), A.say(thud, 1)],
    [A.reattach('fruit0'), A.effect('sparkle', { dur: 1.2 })],
  ],
});

/** A cut-away room 4 m wide: a floor with a rug line, a back and a side wall with skirting, at real size. */
const room2 = (key: string, w: number, d: number, h: number, floor: string, wall: string, side?: string): M =>
  m(key, { edge: S })
    .box([w, 0.12, d], [0, 0.06, 0], { color: floor, round: 0.1 })
    .box([w, h, 0.14], [0, h / 2 + 0.12, -d / 2 + 0.07], { color: wall, round: 0.05 })
    .box([0.14, h, d], [-w / 2 + 0.07, h / 2 + 0.12, 0], { color: side ?? wall, round: 0.05 })
    .box([w - 0.14, 0.1, 0.03], [0.07, 0.17, -d / 2 + 0.155], { color: 'white', round: 0.2 })
    .box([0.03, 0.1, d - 0.14], [-w / 2 + 0.155, 0.17, 0.07], { color: 'white', round: 0.2 });

interface CarO { L: number; W: number; H: number; wheel: number; axles: number[]; color: string; glass?: string; belt?: number; hood?: number; tail?: number; boxy?: number; pillars?: number[]; door?: [number, number]; slide?: boolean; bumper?: string; nose?: number }
/** A car-like road vehicle in profile (nose to +z) at its real size: a soft body loft, a glasshouse (crisp dark
 *  glass) with pillars and a roof, bumpers, a grille, head and tail lights that switch, mirrors, wheels in arches,
 *  and a side door (on its hinge, or sliding back) on the vehicle's left (+x). */
const car = (b: M, o: CarO): M => {
  const { L, W, H, wheel: wd } = o;
  const belt = o.belt ?? H * 0.62, floor = wd * 0.42, glass = o.glass ?? '#2b3f66', bump = o.bumper ?? '#3a3633';
  const nose = o.nose ?? 0.78;
  b.loft([W, belt - floor, L], [0, (belt + floor) / 2, 0], [[0, 0.95, 0.86, 0.04], [0.05, 1, 1, 0], [0.93, 1, 1, 0], [1, 0.9, nose, (nose - 1) / 2]], { color: o.color, boxy: o.boxy ?? 0.8, name: 'body' });
  const hood = o.hood ?? 0.24, tail = o.tail ?? 0.08, cl = L * (1 - hood - tail), cz = -L / 2 + L * tail + cl / 2;
  b.loft([W * 0.93, (H - belt) * 2, cl], [0, belt, cz], [[0, 0.86, 0.82], [0.1, 0.98, 1], [0.84, 1, 1], [1, 0.92, 0.3]], { color: glass, cut: 'top', boxy: 0.78, parent: 'body', edge: S })
    .box([W * 0.86, 0.06, cl * 0.74], [0, H - 0.025, cz - cl * 0.05], { color: o.color, parent: 'body', round: 0.4 });
  for (const z of o.pillars ?? []) b.box([W * 0.95, (H - belt) * 0.86, 0.11], [0, belt + (H - belt) * 0.45, z], { color: o.color, parent: 'body', edge: S, round: 0.3 });
  b.box([W * 1.02, 0.2, 0.18], [0, floor + 0.1, L / 2], { color: bump, edge: S, round: 0.4, parent: 'body' })
    .box([W * 1.02, 0.2, 0.18], [0, floor + 0.1, -L / 2], { color: bump, edge: S, round: 0.4, parent: 'body' })
    .box([W * 0.42, (belt - floor) * 0.34, 0.05], [0, floor + (belt - floor) * 0.42, L / 2 + 0.01], { color: '#2a2726', edge: S, parent: 'body' })
    .pair((s) => {
      lamp(b, s > 0 ? 'headlightL' : 'headlightR', [W * 0.2, 0.14, 0.06], [s * W * 0.34, floor + (belt - floor) * 0.6, L / 2 + 0.005], '#fff6c8', { box: true, parent: 'body' });
      lamp(b, s > 0 ? 'taillightL' : 'taillightR', [W * 0.16, 0.16, 0.06], [s * W * 0.38, floor + (belt - floor) * 0.66, -L / 2 - 0.005], '#e0473b', { box: true, parent: 'body' });
      b.box([0.1, 0.1, 0.16], [s * (W / 2 + 0.06), belt + 0.08, cz + cl / 2 - 0.25], { color: o.color, edge: S, parent: 'body', round: 0.4 });
    });
  o.axles.forEach((z, i) => {
    b.pair((s) => b.arc([wd * 1.18, wd * 1.18, 0.04], [s * (W / 2 + 0.005), wd / 2, z], { color: '#2a2726', rot: [0, 90, 0], tube: 0.08, parent: 'body', edge: S }));
    tyre(b, `wheel${i * 2 + 1}`, [W / 2 - 0.08, wd / 2, z], wd, 0.24);
    tyre(b, `wheel${i * 2 + 2}`, [-W / 2 + 0.08, wd / 2, z], wd, 0.24);
  });
  if (o.door) {
    const [z0, len] = o.door, h = belt - floor - 0.1;
    b.box([0.04, h, len], [W / 2 + 0.02, floor + 0.08 + h / 2, z0], { color: o.color, edge: S, round: 0.3, name: 'door', ...(o.slide ? { mover: { kind: 'slide', axis: 'z', amount: -len * 0.85 } } : { pivot: [W / 2 + 0.02, floor + 0.08 + h / 2, z0 + len / 2], mover: { kind: 'swing', axis: 'y', amount: -70 } }) })
      .box([0.03, (H - belt) * 0.7, len * 0.86], [W * 0.465 + 0.02, belt + (H - belt) * 0.4, z0], { color: glass, edge: S, parent: 'door' })
      .box([0.03, 0.04, 0.16], [W / 2 + 0.05, belt - 0.12, z0 + (o.slide ? len * 0.4 : -len * 0.38)], { color: '#c9ccd1', edge: S, parent: 'door' });
  }
  return b;
};

/** A round prohibition sign on a 2 m post: a disc (white unless given) in a red ring on a plate named 'sign';
 *  add its symbol with parent 'sign', then noSlash() for the red bar across. */
const noSign = (key: string, disc = 'white'): M =>
  m(key, { edge: S })
    .cyl([0.36, 0.06, 0.36], [0, 0.03, 0], { color: '#5c6166' })
    .stick([0, 0.06, -0.03], [0, 1.95, -0.03], 0.05, '#9da3a8')
    .cyl([0.5, 0.02, 0.5], [0, 1.55, 0], { color: disc, rot: [90, 0, 0], name: 'sign', pivot: [0, 1.55, -0.03] })
    .torus([0.52, 0.52, 0.03], [0, 1.55, 0.004], { color: '#e0473b', tube: 0.16, parent: 'sign' });
const noSlash = (b: M): M => b.box([0.44, 0.06, 0.02], [0, 1.55, 0.045], { color: '#e0473b', rot: [0, 0, -45], parent: 'sign' });

export const ENTRIES: CatalogEntry[] = [
  // A jug of liquid detergent: moulded plastic (soft), a measuring cap that comes off, a carry handle, a label.
  e('laundry detergent', 'home', 'cleaning', () =>
    m('laundry detergent')
      .box([0.2, 0.24, 0.12], [0, 0.12, 0], { color: '#f0923b', round: 0.5, name: 'jug' })
      .box([0.12, 0.06, 0.1], [-0.035, 0.245, 0], { color: '#f0923b', round: 0.6, parent: 'jug' })
      .torus([0.1, 0.1, 0.04], [0.05, 0.255, 0], { color: '#f0923b', tube: 0.32, parent: 'jug' })
      .cyl([0.05, 0.02, 0.05], [-0.05, 0.28, 0], { color: 'white', parent: 'jug' })
      .cyl([0.064, 0.05, 0.064], [-0.05, 0.31, 0], { color: '#2f6fc8', name: 'cap', parent: 'jug', piece: true, edge: S })
      .box([0.15, 0.13, 0.008], [0, 0.11, 0.061], { color: 'white', edge: S, round: 0.3 })
      .label('SUDS', [0.12, 0.035], [0, 0.145, 0.066], { color: 'white', depth: 0.004 })
      .ball([0.09, 0.045, 0.006], [0, 0.085, 0.066], { color: '#4e8fd6', noInk: true })
      .ball([0.03, 0.03, 0.006], [0.04, 0.1, 0.067], { color: '#a8d8f5', noInk: true })
      .act({
        click: [
          [A.detach('cap', 'cap'), A.spawn('suds', 'bubble', { rel: 'above', of: 'self', dist: 'close' }), A.effect('sparkle', { dur: 1.2 }), A.wait(2), A.remove('suds', 'pop')],
          [A.reattach('cap'), A.say('Click!', 1)],
        ],
      })
      .done(),
  ),
  // A pool of molten rock at its real spread: glowing orange melt, black crust plates, a bubble that swells and pops.
  e('lava', 'nature', 'elements', () => {
    const b = m('lava');
    b.ball([2.2, 0.12, 1.6], [0, 0.04, 0], { color: '#ff6a1a', glow: true, name: 'melt' })
      .ball([1.2, 0.1, 0.8], [0.15, 0.07, 0.1], { color: '#ffb02a', glow: true, noInk: true });
    for (const [x, z, w, d] of [[-0.7, -0.4, 0.6, 0.45], [0.6, -0.45, 0.5, 0.4], [-0.55, 0.45, 0.45, 0.35], [0.85, 0.3, 0.35, 0.3], [0.05, -0.62, 0.4, 0.22], [-1.0, 0.05, 0.3, 0.5]] as const)
      b.ball([w, 0.16, d], [x, 0.08, z], { color: '#2e2622' }).ball([w * 0.7, 0.05, d * 0.6], [x + 0.03, 0.15, z], { color: '#4a3a32', noInk: true });
    b.each(4, (i) => b.rod([-0.3 + i * 0.25, 0.1, 0.2 - (i % 2) * 0.35], [-0.1 + i * 0.22, 0.1, -0.05 + (i % 2) * 0.3], 0.03, '#ffe08a', { glow: true, noInk: true }))
      .ball(0.22, [0.2, 0.12, 0.1], { color: '#ff8a2a', glow: true, name: 'bubble' })
      .ball(0.08, [-0.25, 0.1, 0.25], { color: '#ffd24a', glow: true });
    return b.act({
      click: [
        [A.pose('bubble', { scale: 1.8, dur: 1 }), A.pose('bubble', { scale: 0.05, dur: 0.1 }), A.par(A.effect('fire', { dur: 1 }), A.say('Blorp!', 1.2)), A.pose('bubble', { scale: 1, dur: 1 })],
        [A.par(A.effect('smoke', { dur: 2 }), A.say('Hisss...', 1.5))],
      ],
    }).done();
  }),
  // A 1960s lava lamp: a spun-metal cone base and cap (crisp), the tapering bottle whose wax blobs (soft) rise and
  // sink when it is switched on.
  e('lava lamp', 'home', 'lamps', () =>
    m('lava lamp', { edge: S })
      .cyl([0.17, 0.15, 0.17], [0, 0.075, 0], { color: '#c9ccd1', taper: 0.52, round: 0.2 })
      .cyl([0.09, 0.012, 0.09], [0, 0.156, 0], { color: '#8f99a3' })
      .cyl([0.088, 0.12, 0.088], [0, 0.222, 0], { color: '#8a3fc8', taper: 1.3, name: 'liquid', mover: { kind: 'light' } })
      .cyl([0.115, 0.16, 0.115], [0, 0.362, 0], { color: '#8a3fc8', taper: 0.5, parent: 'liquid' })
      .cyl([0.058, 0.07, 0.058], [0, 0.475, 0], { color: '#c9ccd1', taper: 0.45, round: 0.2 })
      .ball([0.06, 0.07, 0.06], [0.012, 0.2, 0.024], { color: '#ff7a2a', name: 'blob1', edge: F })
      .ball([0.05, 0.06, 0.05], [-0.016, 0.31, 0.03], { color: '#ff9a3a', name: 'blob2', edge: F })
      .ball([0.035, 0.04, 0.035], [0.01, 0.39, 0.02], { color: '#ffb03a', name: 'blob3', edge: F })
      .act({
        click: [
          [A.operate('liquid', 'on'), A.par(A.pose('blob1', { move: [0, 0.07, -0.004], dur: 3 }), A.pose('blob2', { move: [0, 0.06, -0.012], dur: 3 }), A.pose('blob3', { move: [0, -0.1, 0.012], dur: 3 }))],
          [A.par(A.pose('blob1', { move: [0, 0, 0], dur: 2.5 }), A.pose('blob2', { move: [0, 0, 0], dur: 2.5 }), A.pose('blob3', { move: [0, 0, 0], dur: 2.5 })), A.operate('liquid', 'off')],
        ],
      })
      .done(),
  ),
  // A two-storey brick law office with a classical portico: columns, a pediment with the scales of justice (they
  // tip when clicked), a panelled door that opens, sash windows and the firm's name.
  e('law office', 'places', 'offices', () => {
    const b = m('law office', { edge: S });
    const brick = '#a5523f', trim = '#f2ece0';
    b.box([8, 0.3, 6], [0, 0.15, 0], { color: '#8a8a84' })
      .box([8, 6.3, 6], [0, 3.45, 0], { color: brick, round: 0.02 })
      .box([8.2, 0.3, 6.2], [0, 6.75, 0], { color: trim })
      .box([8.0, 0.25, 6.0], [0, 3.15, 0.01], { color: trim })
      .each(3, (i) => b.box([4.6 - i * 0.2, 0.15, 2.6 - i * 0.2], [0, 0.375 + i * 0.15, 4.0 - i * 0.1], { color: '#d4d0c4' }))
      .each(4, (i) => b.cyl([0.42, 5.1, 0.42], [-1.8 + i * 1.2, 3.3, 4.4], { color: trim, segs: 16 }).box([0.6, 0.18, 0.6], [-1.8 + i * 1.2, 5.9, 4.4], { color: trim }))
      .box([4.4, 0.5, 1.7], [0, 6.2, 3.85], { color: trim })
      .wedge([4.6, 1.15, 1.7], [0, 7.025, 3.85], { color: trim })
      .label('LAW OFFICE', [3.4, 0.36], [0, 6.2, 4.72], { color: trim, depth: 0.04 })
      .stick([0, 6.55, 4.72], [0, 7.3, 4.72], 0.05, 'gold')
      .box([0.9, 0.05, 0.05], [0, 7.3, 4.74], { color: 'gold', name: 'scales', pivot: [0, 7.3, 4.74], mover: { kind: 'swing', axis: 'z', amount: 14 } })
      .pair((s) => b.stick([s * 0.42, 7.28, 4.75], [s * 0.42, 6.98, 4.75], 0.015, 'gold', { parent: 'scales' }).cyl([0.26, 0.05, 0.12], [s * 0.42, 6.96, 4.75], { color: 'gold', parent: 'scales', taper: 0.6 }));
    door(b, [0, 0.75, 3.0], 1.3, 2.3, { color: '#3a2a20', frame: trim });
    b.box([1.5, 0.4, 0.06], [0, 3.35, 3.03], { color: '#8fbcd8' });
    for (const x of [-3.1, 3.1]) win(b, [x, 1.9, 3.0], 1.0, 1.6, { frame: trim });
    for (const x of [-3.1, -1.8, 1.8, 3.1]) win(b, [x, 4.8, 3.0], 0.9, 1.5, { frame: trim });
    for (const z of [-1.5, 1.2]) for (const y of [1.9, 4.8]) win(b, [4.0, y, z], 0.9, 1.5, { frame: trim, face: 'x' });
    lamp(b, 'lamp', 0.25, [1.0, 2.9, 3.15], '#ffe9a0');
    return b.act({
      click: [
        [A.par(A.operate('door', 'open'), A.operate('lamp', 'on')), A.pose('scales', { rot: [0, 0, 14], dur: 0.6 }), A.pose('scales', { rot: [0, 0, -14], dur: 0.8 }), A.pose('scales', { rot: [0, 0, 0], dur: 0.6 }), A.wait(1), A.par(A.operate('door', 'close'), A.operate('lamp', 'off'))],
      ],
    }).done();
  }),
  // An aluminium folding lawn chair with green and white woven webbing; the back folds down onto the seat.
  e('lawn chair', 'home', 'outdoor furniture', () => {
    const b = m('lawn chair', { edge: S }), al = '#d4d7da';
    b.pair((s) => {
      b.rod([s * 0.29, 0.43, 0.22], [s * 0.29, 0.43, -0.22], 0.025, al)
        .rod([s * 0.29, 0.43, 0.2], [s * 0.29, 0.01, 0.27], 0.025, al)
        .rod([s * 0.29, 0.43, -0.2], [s * 0.29, 0.01, -0.3], 0.025, al)
        .rod([s * 0.29, 0.01, 0.27], [s * 0.29, 0.01, -0.3], 0.022, al)
        .rod([s * 0.29, 0.43, 0.2], [s * 0.31, 0.64, 0.2], 0.022, al)
        .box([0.06, 0.03, 0.44], [s * 0.31, 0.655, 0.0], { color: 'white', round: 0.4 });
    });
    b.rod([-0.29, 0.43, 0.22], [0.29, 0.43, 0.22], 0.025, al)
      .each(4, (i) => b.box([0.58, 0.012, 0.075], [0, 0.44, -0.16 + i * 0.105], { color: '#3f9a4a', round: 0.3, edge: F }))
      .each(3, (i) => b.box([0.07, 0.014, 0.44], [-0.18 + i * 0.18, 0.445, 0], { color: 'white', round: 0.3, edge: F }))
      .rod([0.29, 0.43, -0.22], [0.29, 1.0, -0.31], 0.025, al, { name: 'back', pivot: [0, 0.43, -0.22], mover: { kind: 'swing', axis: 'x', amount: 78 } })
      .rod([-0.29, 0.43, -0.22], [-0.29, 1.0, -0.31], 0.025, al, { parent: 'back' })
      .rod([-0.29, 1.0, -0.31], [0.29, 1.0, -0.31], 0.025, al, { parent: 'back' })
      .each(5, (i) => b.box([0.58, 0.075, 0.012], [0, 0.5 + i * 0.105, -0.234 - i * 0.017], { color: '#3f9a4a', rot: [-9, 0, 0], round: 0.3, parent: 'back', edge: F }))
      .each(3, (i) => b.box([0.07, 0.54, 0.014], [-0.18 + i * 0.18, 0.71, -0.268], { color: 'white', rot: [-9, 0, 0], round: 0.3, parent: 'back', edge: F }))
      .socket('seat', [0, 0.45, 0.02], 'seat');
    return b.act({ click: [A.operate('back'), A.say('Clack!', 1)] }).done();
  }),
  // A petrol push mower: a pressed-steel deck on four wheels, the engine with its pull cord, a grass bag and the
  // handle; the blade under the deck spins when it starts.
  e('lawn mower', 'garden', 'garden tools', () => {
    const b = m('lawn mower', { view: 'side', edge: S });
    b.box([0.54, 0.16, 0.6], [0, 0.2, 0.06], { color: '#d23a2e', round: 0.5, name: 'deck' })
      .box([0.58, 0.06, 0.64], [0, 0.13, 0.06], { color: '#a3322a', round: 0.4 })
      .box([0.12, 0.05, 0.2], [-0.32, 0.15, 0.08], { color: '#3a3633', round: 0.4 })
      .cyl([0.28, 0.14, 0.28], [0, 0.34, 0.1], { color: '#3a3633', segs: 12 })
      .dome([0.3, 0.12, 0.3], [0, 0.47, 0.1], { color: '#c9ccd1' })
      .cyl([0.05, 0.03, 0.05], [0.08, 0.48, 0.16], { color: 'yellow' })
      .box([0.12, 0.08, 0.09], [-0.08, 0.38, 0.27], { color: '#5c6166', round: 0.3 })
      .capsule([0.025, 0.08, 0.025], [0.02, 0.5, 0.04], { color: 'black', rot: [0, 0, 90] })
      .rod([0.02, 0.49, 0.04], [0.15, 0.82, -0.62], 0.006, '#3a3633')
      .box([0.46, 0.012, 0.06], [0, 0.085, 0.06], { color: 'steel', name: 'blade', pivot: [0, 0.085, 0.06], mover: { kind: 'spin', axis: 'y', amount: 1600 } })
      .box([0.42, 0.26, 0.34], [0, 0.3, -0.42], { color: '#2f5a2a', round: 0.5, edge: F })
      .box([0.44, 0.04, 0.36], [0, 0.44, -0.42], { color: '#3a3633', round: 0.4 })
      .pair((s) => b.rod([s * 0.21, 0.24, -0.22], [s * 0.24, 0.98, -0.78], 0.026, '#3a3633'))
      .capsule([0.04, 0.5, 0.04], [0, 0.98, -0.78], { color: 'black', rot: [0, 0, 90] })
      .rod([-0.22, 0.92, -0.72], [0.22, 0.92, -0.72], 0.016, '#c9ccd1');
    tyre(b, 'wheel1', [0.3, 0.1, 0.28], 0.2, 0.05);
    tyre(b, 'wheel2', [-0.3, 0.1, 0.28], 0.2, 0.05);
    tyre(b, 'wheel3', [0.3, 0.12, -0.18], 0.24, 0.055);
    tyre(b, 'wheel4', [-0.3, 0.12, -0.18], 0.24, 0.055);
    return b.act({
      click: [
        [A.operate('blade', 'on'), A.par(A.say('Brrrrrm!', 1.6), A.anim('shake'), A.effect('dust', { dur: 2.5 }))],
        [A.operate('blade', 'off'), A.say('Putt... putt.', 1.4)],
      ],
    }).done();
  }),
  // A retractable dog lead: a moulded grip (soft) round a cassette, a brake button, and the cord that runs out in
  // telescoping lengths (each a slide mover) to its clip.
  e('lead', 'pets', 'pet supplies', () => {
    const b = m('lead');
    b.torus([0.085, 0.1, 0.034], [0, 0.05, 0], { color: '#2e6fb0', tube: 0.34, name: 'grip' })
      .cyl([0.12, 0.046, 0.12], [0, 0.135, 0], { color: '#2e6fb0', rot: [90, 0, 0] })
      .cyl([0.07, 0.05, 0.07], [0, 0.135, 0], { color: '#c9ccd1', rot: [90, 0, 0], edge: S })
      .box([0.04, 0.03, 0.03], [0.065, 0.14, 0], { color: '#3a3633', edge: S })
      .box([0.025, 0.014, 0.022], [-0.018, 0.098, 0], { color: 'red', edge: S, name: 'button', mover: { kind: 'slide', axis: 'y', amount: -0.006 } })
      .each(3, (i) => b.stick([0.0, 0.14, 0], [0.09, 0.14, 0], 0.007, 'red', { name: `cord${i + 1}`, mover: { kind: 'slide', axis: 'x', amount: 0.085 * (i + 1) } }))
      .box([0.03, 0.016, 0.012], [0.1, 0.14, 0], { color: '#c9ccd1', edge: S, name: 'cordclip', mover: { kind: 'slide', axis: 'x', amount: 0.26 } })
      .torus([0.018, 0.018, 0.006], [0.12, 0.14, 0], { color: '#c9ccd1', parent: 'cordclip', edge: S });
    return b.act({
      click: [
        [A.operate('cord', 'out'), A.say('Zzzip!', 1.2)],
        [A.operate('button', 'on'), A.operate('cord', 'in'), A.operate('button', 'off'), A.say('Click!', 1)],
      ],
    }).done();
  }),
  // A single broad leaf on its stalk, with a midrib and veins; click it and it turns autumn orange (and back).
  e('leaf', 'garden', 'leaves', () => {
    const b = m('leaf');
    b.ball([0.085, 0.13, 0.014], [0, 0.09, 0], { color: 'leaf', name: 'blade', rot: [8, 0, 0] })
      .cone([0.03, 0.04, 0.008], [0, 0.165, -0.004], { color: 'leaf', parent: 'blade', rot: [8, 0, 0] })
      .ball([0.087, 0.132, 0.016], [0, 0.09, 0], { color: '#e0782a', name: 'autumn', scale: 0, rot: [8, 0, 0] })
      .stick([0, 0, 0], [0, 0.03, 0.002], 0.006, '#4f7a2a')
      .rod([0, 0.03, 0.006], [0, 0.16, -0.012], 0.003, '#8cc46a', { noInk: true });
    b.each(3, (i) => b.pair((s) => b.rod([0, 0.06 + i * 0.03, 0.006 - i * 0.003], [s * (0.03 - i * 0.004), 0.08 + i * 0.03, 0.004 - i * 0.003], 0.002, '#8cc46a', { noInk: true })));
    return b.act({
      click: [
        [A.par(A.pose('autumn', { scale: 1, dur: 1.2 }), A.anim('wobble')), A.say('Rustle', 1)],
        [A.par(A.pose('autumn', { scale: 0, dur: 1 }), A.anim('spin'))],
      ],
    }).done();
  }),
  // A handheld petrol leaf blower: the engine housing with its top handle and trigger, the intake fan, and the long
  // tube; it starts, roars and blows a leaf away.
  e('leaf blower', 'garden', 'garden tools', () => {
    const b = m('leaf blower', { view: 'side' });
    return b.box([0.2, 0.22, 0.3], [0, 0.13, -0.14], { color: '#f0923b', round: 0.55, name: 'housing' })
      .box([0.14, 0.1, 0.18], [0, 0.07, -0.16], { color: '#5c6166', round: 0.4, edge: S })
      .cyl([0.17, 0.03, 0.17], [-0.105, 0.14, -0.14], { color: '#3a3633', rot: [0, 0, 90], edge: S })
      .box([0.012, 0.12, 0.02], [-0.123, 0.14, -0.14], { color: '#9da3a8', name: 'impeller', pivot: [-0.123, 0.14, -0.14], edge: S, mover: { kind: 'spin', axis: 'x', amount: 1400 } })
      .rod([0, 0.25, -0.24], [0, 0.32, -0.18], 0.032, '#3a3633')
      .rod([0, 0.32, -0.18], [0, 0.32, -0.02], 0.032, '#3a3633')
      .rod([0, 0.32, -0.02], [0, 0.22, 0.02], 0.032, '#3a3633')
      .box([0.016, 0.03, 0.02], [0, 0.29, -0.06], { color: 'red', edge: S })
      .capsule([0.022, 0.05, 0.022], [0.09, 0.22, -0.26], { color: 'black', rot: [0, 0, 90] })
      .stick([0, 0.12, 0.0], [0, 0.07, 0.62], 0.1, '#f0923b', { taper: 0.7 })
      .stick([0, 0.07, 0.62], [0, 0.045, 0.92], 0.07, '#3a3633')
      .torus([0.1, 0.1, 0.03], [0, 0.11, 0.1], { color: '#3a3633', rot: [0, 0, 0], tube: 0.25 })
      .act({
        click: [
          [A.operate('impeller', 'on'), A.par(A.say('Whoooosh!', 1.6), A.anim('shake'), A.effect('dust', { dur: 2 })), A.spawn('lf', 'leaf', { rel: 'front', of: 'self', dist: 'close' }), A.move('lf', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('lf', 'fade')],
          [A.operate('impeller', 'off'), A.say('Putt...', 1.2)],
        ],
      })
      .done();
  }),
  // A dog's leash hanging on a hall hook-post: the handle loop over the brass hook, the red strap and its clip,
  // and the collar beside it. Click it and a dog comes for a walk.
  e('leash', 'pets', 'pet supplies', () => {
    const b = m('leash', { edge: S });
    b.cyl([0.36, 0.05, 0.36], [0, 0.025, 0], { color: '#5a3a22' })
      .box([0.07, 1.25, 0.07], [0, 0.65, -0.05], { color: 'wood', round: 0.2 })
      .ball(0.09, [0, 1.3, -0.05], { color: 'wood' })
      .rod([0, 1.12, -0.01], [0, 1.12, 0.06], 0.02, 'brass')
      .rod([0, 1.12, 0.06], [0, 1.16, 0.08], 0.02, 'brass')
      .torus([0.1, 0.16, 0.022], [0, 1.06, 0.06], { color: '#d23a2e', rot: [0, 90, 0], tube: 0.18, edge: F });
    const pts: V[] = [[0, 0.98, 0.07], [0.02, 0.8, 0.08], [0.0, 0.62, 0.09], [0.04, 0.44, 0.1], [0.02, 0.28, 0.11]];
    for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], 0.022, '#d23a2e', { edge: F });
    return b.box([0.025, 0.05, 0.015], [0.02, 0.24, 0.11], { color: '#c9ccd1' })
      .torus([0.03, 0.03, 0.008], [0.02, 0.205, 0.11], { color: '#c9ccd1' })
      .rod([0.0, 1.12, 0.06], [0.08, 0.95, 0.07], 0.012, 'brass')
      .torus([0.16, 0.16, 0.035], [0.1, 0.86, 0.07], { color: '#2e6fb0', tube: 0.16, edge: F })
      .ball([0.035, 0.035, 0.008], [0.1, 0.77, 0.09], { color: 'gold' })
      .act({
        click: [
          [A.spawn('dog', 'dog', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('wag', 2, 'dog'), A.say('Woof woof!', 1.5, 'dog')), A.wait(1.2), A.par(A.anim('hop', 1, 'dog'), A.say('Arf!', 1.2, 'dog')), A.remove('dog', 'fade')],
        ],
      })
      .done();
  }),
  // A tanned hide: a big flat piece with stitched edges lying beside a roll of it; the roll unrolls a little.
  e('leather', 'workshop', 'materials', () => {
    const b = m('leather');
    return b.box([0.8, 0.012, 0.5], [0.05, 0.006, 0.18], { color: 'leather', round: 0.5 })
      .ball([0.3, 0.012, 0.2], [0.42, 0.007, 0.32], { color: 'leather' })
      .ball([0.26, 0.012, 0.18], [-0.32, 0.007, 0.38], { color: 'leather' })
      .ball([0.24, 0.012, 0.16], [0.45, 0.007, 0.0], { color: 'leather' })
      .each(8, (i) => b.box([0.05, 0.004, 0.008], [-0.25 + i * 0.075, 0.014, 0.4], { color: 'cream', noInk: true }))
      .cyl([0.14, 0.72, 0.14], [0, 0.07, -0.2], { color: '#7a4a2a', rot: [0, 0, 90], name: 'roll', mover: { kind: 'slide', axis: 'z', amount: 0.12 } })
      .cyl([0.08, 0.725, 0.08], [0, 0.07, -0.2], { color: '#5a3a22', rot: [0, 0, 90], parent: 'roll' })
      .torus([0.15, 0.15, 0.03], [0.22, 0.07, -0.2], { color: 'tan', rot: [0, 90, 0], parent: 'roll', tube: 0.12 })
      .torus([0.15, 0.15, 0.03], [-0.22, 0.07, -0.2], { color: 'tan', rot: [0, 90, 0], parent: 'roll', tube: 0.12 })
      .box([0.05, 0.035, 0.004], [0.3, 0.02, 0.38], { color: 'tan', edge: S })
      .act({
        click: [
          [A.par(A.operate('roll', 'out'), A.pose('roll', { rot: [180, 0, 0], dur: 0.6 })), A.say('Fwump', 1)],
          [A.par(A.operate('roll', 'in'), A.pose('roll', { rot: [0, 0, 0], dur: 0.6 }))],
        ],
      })
      .done();
  }),
  // A black biker jacket on its hanger: soft leather body and hanging sleeves, a wide collar with snapped-down
  // lapels, zipped pockets, a belt with a buckle, and a silver zip whose pull runs up and down.
  e('leather jacket', 'wardrobe', 'coats', () => {
    const b = m('leather jacket'), j = '#2e2724', k = '#1c1816', z = '#c9ccd1';
    return b.stick([0, 0.66, -0.01], [0, 0.73, -0.01], 0.008, 'silver', { edge: S })
      .arc([0.06, 0.05, 0.008], [0.0, 0.735, -0.01], { color: 'silver', arc: 220, edge: S })
      .box([0.44, 0.5, 0.19], [0, 0.4, 0], { color: j, round: 0.4, name: 'body' })
      .ball([0.5, 0.14, 0.2], [0, 0.61, 0], { color: j })
      .box([0.24, 0.06, 0.16], [0, 0.67, -0.02], { color: k, round: 0.5 })
      .box([0.43, 0.065, 0.2], [0, 0.17, 0], { color: k, round: 0.4 })
      .box([0.06, 0.05, 0.015], [0.1, 0.17, 0.104], { color: z, edge: S })
      .stick([0.02, 0.2, 0.1], [0.02, 0.6, 0.1], 0.01, z, { edge: S })
      .box([0.026, 0.036, 0.01], [0.02, 0.22, 0.108], { color: '#e6e8ea', edge: S, name: 'zip', mover: { kind: 'slide', axis: 'y', amount: 0.34 } })
      .pair((s) => {
        b.box([0.1, 0.17, 0.012], [s * 0.08, 0.55, 0.1], { color: k, rot: [0, 0, -s * 25], round: 0.3 })
          .ball(0.014, [s * 0.15, 0.6, 0.106], { color: z, edge: S })
          .rod([s * 0.25, 0.6, 0], [s * 0.33, 0.2, 0.03], 0.11, j)
          .cyl([0.1, 0.06, 0.1], [s * 0.335, 0.15, 0.03], { color: k })
          .stick([s * 0.13, 0.36, 0.1], [s * 0.18, 0.28, 0.1], 0.008, z, { edge: S });
      })
      .act({ click: [[A.operate('zip', 'up'), A.say('Zzzip!', 1)], [A.operate('zip', 'down'), A.say('Zzzip!', 1)]] })
      .done();
  }),
  // A 5 mm red LED at its real size: two legs (the anode longer), the flange and the epoxy dome, which blinks.
  e('led', 'tech', 'electronics', () =>
    m('led', { edge: S })
      .stick([0.0025, 0, 0], [0.0025, 0.028, 0], 0.0007, 'silver')
      .stick([-0.0025, 0.004, 0], [-0.0025, 0.028, 0], 0.0007, 'silver')
      .cyl([0.0058, 0.0012, 0.0058], [0, 0.0286, 0], { color: '#e0473b', round: 0.3 })
      .capsule([0.005, 0.0086, 0.005], [0, 0.0333, 0], { color: '#ff4a3a', name: 'dome', edge: F, mover: { kind: 'light' } })
      .act({
        click: [
          [A.operate('dome', 'on'), A.wait(0.4), A.operate('dome', 'off'), A.wait(0.4), A.operate('dome', 'on'), A.say('Blink!', 1)],
          [A.operate('dome', 'off')],
        ],
      })
      .done(),
  ),
  // A leek standing up as it is sold: the root tuft, the long white shank, the pale green middle and the fan of
  // dark flat leaves. A ring of it can be sliced off.
  e('leek', 'food', 'vegetables', () => {
    const b = m('leek');
    b.ball([0.05, 0.03, 0.05], [0, 0.02, 0], { color: '#efe6cc' })
      .cyl([0.046, 0.24, 0.046], [0, 0.15, 0], { color: '#f6f0dc', name: 'shank' })
      .cyl([0.047, 0.022, 0.047], [0, 0.04, 0], { color: '#f8f4e6', name: 'ring', parent: 'shank', piece: true })
      .cyl([0.046, 0.1, 0.046], [0, 0.32, 0], { color: '#cfe39a', taper: 1.05, parent: 'shank' });
    const ls: Array<[number, number, string]> = [[-14, 0.38, '#3f7a3a'], [9, 0.4, '#4f8a42'], [-3, 0.44, '#5a9a4a'], [20, 0.32, '#3f7a3a'], [-24, 0.3, '#4f8a42']];
    ls.forEach(([a, L, c], i) => b.ball([0.05, L, 0.014], [Math.sin(rad(a)) * L * 0.45, 0.36 + Math.cos(rad(a)) * L * 0.45, i % 2 ? 0.006 : -0.006], { color: c, rot: [0, 0, -a], parent: 'shank' }));
    b.each(6, (i) => b.rod([0, 0.012, 0], [Math.cos(i) * 0.04, 0.002, Math.sin(i) * 0.04], 0.004, 'tan', { noInk: true }));
    return b.act({ click: [[A.detach('ring', 'leek ring'), A.say('Chop!', 1)], [A.reattach('ring')]] }).done();
  }),
  // An anatomy-class leg on a stand: hip, thigh, knee and the shin, which kicks when the knee is tapped.
  e('leg', 'clinic', 'body parts', () => {
    const b = m('leg'), k = 'skin2';
    return b.box([0.34, 0.03, 0.34], [0, 0.015, -0.05], { color: '#5c6166', edge: S })
      .stick([0, 0.03, -0.16], [0, 0.9, -0.16], 0.025, 'silver', { edge: S })
      .box([0.06, 0.05, 0.12], [0, 0.88, -0.1], { color: 'silver', edge: S })
      .cyl([0.2, 0.1, 0.18], [0, 0.92, 0], { color: '#2f4f8f' })
      .rod([0, 0.9, 0], [0, 0.52, 0.02], 0.15, k)
      .ball([0.12, 0.12, 0.13], [0, 0.5, 0.025], { color: k })
      .rod([0, 0.48, 0.02], [0, 0.12, 0], 0.105, k, { name: 'shin', pivot: [0, 0.5, 0.02], mover: { kind: 'swing', axis: 'x', amount: -55 } })
      .ball([0.08, 0.08, 0.08], [0, 0.08, 0], { color: k, parent: 'shin' })
      .ball([0.095, 0.06, 0.24], [0, 0.04, 0.06], { color: k, parent: 'shin' })
      .act({ click: [A.say('Tap!', 0.8), A.operate('shin', 'on'), A.wait(0.4), A.operate('shin', 'off')] })
      .done();
  }),
  // A pair of knitted leg warmers, ribbed and striped, slouching a little; they scrunch down and back up.
  e('leg warmer', 'wardrobe', 'legwear', () => {
    const b = m('leg warmer');
    b.pair((s) => {
      const n = s > 0 ? 'warmerL' : 'warmerR';
      b.cyl([0.11, 0.38, 0.11], [s * 0.08, 0.2, 0], { color: '#f4a1c0', name: n, pivot: [s * 0.08, 0.01, 0] });
      b.each(5, (i) => b.torus([0.122, 0.122, 0.04], [s * 0.08, 0.04 + i * 0.075, 0], { color: i % 2 ? '#8a5fc4' : '#d64fa0', rot: [90, 0, 0], tube: 0.18, parent: n }));
      b.torus([0.124, 0.124, 0.03], [s * 0.08, 0.385, 0], { color: '#f4a1c0', rot: [90, 0, 0], tube: 0.25, parent: n });
    });
    return b.act({
      click: [A.par(A.pose('warmerL', { scale: 0.82, dur: 0.4 }), A.pose('warmerR', { scale: 0.82, dur: 0.4 }), A.say('Scrunch!', 1)), A.wait(0.6), A.par(A.pose('warmerL', { scale: 1, dur: 0.4 }), A.pose('warmerR', { scale: 1, dur: 0.4 }))],
    }).done();
  }),
  // An anatomy-class pair of legs from the waist: thighs, knees and shins that march on the spot.
  e('legs', 'clinic', 'body parts', () => {
    const b = m('legs'), k = 'skin3';
    b.box([0.38, 0.16, 0.22], [0, 0.95, 0], { color: '#d23a2e', round: 0.45 });
    b.pair((s) => {
      const t = s > 0 ? 'thighL' : 'thighR', sh = s > 0 ? 'shinL' : 'shinR';
      b.rod([s * 0.1, 0.92, 0], [s * 0.1, 0.5, 0.01], 0.15, k, { name: t, pivot: [s * 0.1, 0.92, 0] })
        .ball([0.12, 0.12, 0.13], [s * 0.1, 0.49, 0.015], { color: k, parent: t })
        .rod([s * 0.1, 0.48, 0.01], [s * 0.1, 0.1, 0], 0.11, k, { name: sh, parent: t, pivot: [s * 0.1, 0.49, 0.015] })
        .ball([0.1, 0.07, 0.25], [s * 0.1, 0.035, 0.06], { color: k, parent: sh });
    });
    const step = (u: string, v: string, a: number) => A.par(A.pose(u, { rot: [-a, 0, 0], dur: 0.35 }), A.pose(v, { rot: [a * 1.6, 0, 0], dur: 0.35 }));
    return b.act({
      click: [step('thighL', 'shinL', 40), step('thighL', 'shinL', 0), step('thighR', 'shinR', 40), step('thighR', 'shinR', 0), step('thighL', 'shinL', 40), step('thighL', 'shinL', 0), A.say('Stomp stomp!', 1.2)],
    }).done();
  }),
  // A Hawaiian lei hung up on a peg: a loop of plumeria-like blooms in five colours with yellow hearts.
  e('lei', 'wardrobe', 'jewellery', () => {
    const b = m('lei'), cols = ['#f4a1c0', '#f6d24a', 'white', '#d64fa0', '#f0923b'];
    b.box([0.04, 0.04, 0.06], [0, 0.98, -0.04], { color: 'wood', edge: S })
      .cyl([0.08, 0.04, 0.01], [0, 0.98, -0.07], { color: 'darkwood', rot: [90, 0, 0], edge: S });
    b.each(26, (i) => {
      const a = (i / 26) * Math.PI * 2;
      const at: V = [Math.sin(a) * 0.21, 0.6 - Math.cos(a) * 0.37, 0.02 * Math.cos(a * 2)];
      b.ball([0.075, 0.075, 0.035], at, { color: cols[i % 5], rot: [0, 0, i * 25] }).ball(0.022, [at[0], at[1], at[2] + 0.018], { color: '#f6c445', noInk: true });
    });
    return b.act({ click: [A.par(A.anim('spin'), A.effect('hearts', { dur: 1.5 }), A.say('Swish!', 1.2))] }).done();
  }),
  // A lemon at its real size: oval with a nub at each end and a leaf; a slice comes off (with a squirt).
  e('lemon', 'food', 'fruit', () =>
    m('lemon')
      .loft([0.06, 0.06, 0.072], [0.008, 0.03, 0], [[0, 0.82, 0.82], [0.3, 1, 1], [0.65, 0.92, 0.92], [0.88, 0.6, 0.6], [1, 0.25, 0.25]], { color: '#f6dc3a', rot: [0, 90, 0], name: 'body' })
      .ball([0.016, 0.016, 0.016], [0.046, 0.03, 0], { color: '#e8c82a', parent: 'body' })
      .cyl([0.047, 0.012, 0.047], [-0.034, 0.03, 0], { color: '#fbf0a0', rot: [0, 0, 90], name: 'slice', parent: 'body', piece: true })
      .cyl([0.05, 0.011, 0.05], [-0.0345, 0.03, 0], { color: '#f6dc3a', rot: [0, 0, 90], parent: 'slice', noInk: true })
      .ball([0.04, 0.006, 0.018], [0.0, 0.062, -0.006], { color: 'leaf', rot: [0, 20, 10] })
      .act({ click: [[A.par(A.detach('slice', 'lemon slice'), A.effect('water_spray', { dur: 0.8 }))], [A.reattach('slice')]] })
      .done(),
  ),
  // A lemon tree 4 m tall, glossy dark leaves and yellow lemons; shake it and one drops.
  e('lemon tree', 'garden', 'fruit trees', () => tree2('lemon tree', 4, '#3f7a3a', { leaf2: '#4f8a42', fruit: '#f6dc3a', fs: 0.1, n: 10, shape: 'round' }).act(fruitAct()).done()),
  // A tall glass of lemonade: the glass (crisp) full of pale lemonade, ice cubes, a lemon slice on the rim (it can
  // come off) and a striped straw.
  e('lemonade', 'food', 'drinks', () =>
    m('lemonade')
      .cyl([0.075, 0.15, 0.075], [0, 0.075, 0], { color: '#f8ef9a', taper: 1.12, name: 'glass' })
      .cyl([0.08, 0.012, 0.08], [0, 0.006, 0], { color: 'glass', edge: S })
      .torus([0.086, 0.086, 0.008], [0, 0.15, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.08, edge: S })
      .box([0.024, 0.024, 0.024], [-0.012, 0.146, 0.01], { color: 'ice', rot: [10, 30, 0], edge: S, name: 'ice' })
      .box([0.022, 0.022, 0.022], [0.016, 0.144, -0.012], { color: 'ice', rot: [-12, 50, 8], edge: S })
      .cyl([0.05, 0.008, 0.05], [0.04, 0.15, 0.0], { color: '#f6dc3a', rot: [90, 0, 0], name: 'slice', parent: 'glass', piece: true })
      .cyl([0.04, 0.009, 0.04], [0.04, 0.15, 0.0], { color: '#fbf0a0', rot: [90, 0, 0], parent: 'slice', noInk: true })
      .stick([0.008, 0.06, 0], [-0.02, 0.21, 0.01], 0.007, '#f4a1c0', { name: 'straw', pivot: [0.008, 0.06, 0] })
      .act({
        click: [
          [A.par(A.pose('straw', { rot: [0, 0, -8], dur: 0.3 }), A.say('Slurp!', 1.2)), A.pose('ice', { rot: [20, 40, 0], dur: 0.3 }), A.pose('straw', { rot: [0, 0, 0], dur: 0.3 }), A.say('Clink!', 0.8)],
          [A.par(A.detach('slice', 'lemon slice'), A.effect('water_spray', { dur: 0.7 }))],
          [A.reattach('slice')],
        ],
      })
      .done(),
  ),
  // A kid's lemonade stand: a crisp wooden counter with a painted sign, a striped awning on posts, a pitcher,
  // cups and lemons, and a cash tin whose lid opens for a coin.
  e('lemonade stand', 'places', 'stalls', () => {
    const b = m('lemonade stand', { edge: S });
    return b.box([1.3, 0.9, 0.55], [0, 0.45, 0], { color: '#e8cf9a' })
      .each(5, (i) => b.box([0.012, 0.88, 0.02], [-0.52 + i * 0.26, 0.45, 0.28], { color: '#c8a870' }))
      .box([1.44, 0.05, 0.66], [0, 0.925, 0], { color: 'wood' })
      .box([1.1, 0.32, 0.03], [0, 0.56, 0.29], { color: '#f6dc3a' })
      .label('LEMONADE 50c', [1.0, 0.24], [0, 0.56, 0.31], { color: '#f6dc3a' })
      .pair((s) => b.box([0.06, 1.25, 0.06], [s * 0.66, 1.55, -0.24], { color: 'wood' }).box([0.06, 1.0, 0.06], [s * 0.66, 1.42, 0.24], { color: 'wood' }))
      .box([1.5, 0.05, 0.7], [0, 2.08, -0.02], { color: '#f6dc3a', rot: [12, 0, 0] })
      .each(3, (i) => b.box([0.2, 0.055, 0.7], [-0.5 + i * 0.5, 2.085, -0.02], { color: 'white', rot: [12, 0, 0], noInk: true }))
      .each(6, (i) => b.cone([0.25, 0.14, 0.03], [-0.62 + i * 0.25, 1.95, 0.33], { color: i % 2 ? 'white' : '#f6dc3a', rot: [180, 0, 0], edge: F }))
      .cyl([0.15, 0.22, 0.15], [-0.35, 1.06, 0.05], { color: '#f8ef9a', taper: 0.85, edge: F })
      .torus([0.1, 0.13, 0.025], [-0.44, 1.08, 0.05], { color: 'glass', rot: [0, 90, 0] })
      .each(3, (i) => b.cyl([0.065, 0.1, 0.065], [0.0 + i * 0.12, 1.0, 0.12], { color: 'white', taper: 1.15, edge: F }))
      .ball([0.09, 0.065, 0.065], [0.45, 0.985, -0.12], { color: '#f6dc3a', edge: F })
      .ball([0.09, 0.065, 0.065], [0.35, 0.985, -0.2], { color: '#f6dc3a', edge: F })
      .box([0.22, 0.08, 0.14], [0.4, 0.99, 0.12], { color: '#3fa7a0' })
      .box([0.22, 0.02, 0.14], [0.4, 1.04, 0.12], { color: '#2f8a84', name: 'lid', pivot: [0.4, 1.035, 0.05], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .socket('till', [0.4, 1.0, 0.12], 'inside', { size: 0.05 })
      .socket('counter', [-0.1, 0.95, 0.15], 'top', { size: 0.3 })
      .act({
        click: [
          [A.operate('lid', 'open'), A.spawn('c', 'nickel', { rel: 'front', of: 'self', dist: 'close' }), A.attach('c', 'self', 'till'), A.say('Ka-ching!', 1.4), A.wait(1), A.operate('lid', 'close'), A.remove('c', 'fade')],
          [A.spawn('cup', 'lemonade', { rel: 'front', of: 'self', dist: 'close' }), A.attach('cup', 'self', 'counter'), A.effect('sparkle', { dur: 1 }), A.wait(2), A.remove('cup', 'pop')],
        ],
      })
      .done();
  }),
  // A camera lens at its real size: the black barrel with a ribbed focus ring that turns, the red index line, the
  // mount at the back and the glass at the front.
  e('lens', 'tech', 'cameras', () => {
    const b = m('lens', { edge: S });
    b.cyl([0.075, 0.1, 0.075], [0, 0.0375, 0], { color: '#2a2726', rot: [90, 0, 0], round: 0.2 })
      .cyl([0.081, 0.03, 0.081], [0, 0.0375, 0.015], { color: '#3a3633', rot: [90, 0, 0], name: 'ring', pivot: [0, 0.0375, 0.015], mover: { kind: 'spin', axis: 'z', amount: 90 } });
    around(14, 0.041).forEach(([x, y]) => b.box([0.006, 0.006, 0.028], [x, 0.0375 + y, 0.015], { color: '#1c1816', parent: 'ring' }));
    b.torus([0.076, 0.076, 0.004], [0, 0.0375, -0.015], { color: '#e0473b', tube: 0.06 })
      .cyl([0.064, 0.014, 0.064], [0, 0.0375, -0.057], { color: '#c9ccd1', rot: [90, 0, 0] })
      .cyl([0.06, 0.004, 0.06], [0, 0.0375, 0.05], { color: '#3a4a7a', rot: [90, 0, 0] })
      .ball([0.018, 0.018, 0.003], [0.012, 0.05, 0.053], { color: 'white', noInk: true });
    return b.act({ click: [A.par(A.pose('ring', { rot: [0, 0, 120], dur: 0.8 }), A.say('Zzt', 0.8)), A.pose('ring', { rot: [0, 0, 0], dur: 0.8 }), A.say('Click!', 1)] }).done();
  }),
  // A gymnast's leotard on a hanger: long sleeves, a scoop neck and sparkly stones; it twirls.
  e('leotard', 'wardrobe', 'dancewear', () => {
    const b = m('leotard'), c = '#d64fa0';
    return b.stick([0, 0.66, -0.01], [0, 0.72, -0.01], 0.006, 'silver', { edge: S })
      .arc([0.05, 0.04, 0.006], [0, 0.725, -0.01], { color: 'silver', arc: 220, edge: S })
      .rod([-0.2, 0.62, -0.01], [0.2, 0.62, -0.01], 0.012, 'wood', { edge: S })
      .box([0.3, 0.36, 0.14], [0, 0.42, 0], { color: c, round: 0.6 })
      .ball([0.36, 0.1, 0.15], [0, 0.6, 0], { color: c })
      .cone([0.3, 0.2, 0.13], [0, 0.17, 0], { color: c, rot: [180, 0, 0] })
      .ball([0.12, 0.05, 0.05], [0, 0.6, 0.06], { color: '#7a2a5a' })
      .pair((s) => b.rod([s * 0.17, 0.6, 0], [s * 0.26, 0.24, 0.02], 0.065, c).ball([0.05, 0.06, 0.05], [s * 0.265, 0.21, 0.02], { color: '#7a2a5a' }))
      .each(7, (i) => b.ball(0.014, [-0.09 + i * 0.03, 0.44 + Math.sin(i * 1.3) * 0.06, 0.072], { color: 'silver', noInk: true, glow: true }))
      .act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.2 }))] })
      .done();
  }),
  // The less-than sign as a sculpture: a chunky blue chevron on a wooden plinth; it snaps shut like a beak.
  e('less than sign', 'ideas', 'symbols', () =>
    m('less than sign', { edge: S })
      .box([0.16, 0.02, 0.07], [0, 0.01, 0], { color: 'wood', round: 0.3 })
      .box([0.12, 0.026, 0.03], [0, 0.0975, 0], { color: '#2f6fc8', rot: [0, 0, 22], round: 0.3, name: 'upper', pivot: [-0.056, 0.075, 0] })
      .box([0.12, 0.026, 0.03], [0, 0.0525, 0], { color: '#2f6fc8', rot: [0, 0, -22], round: 0.3, name: 'lower', pivot: [-0.056, 0.075, 0] })
      .act({
        click: [A.par(A.pose('upper', { rot: [0, 0, -10], dur: 0.25 }), A.pose('lower', { rot: [0, 0, 10], dur: 0.25 })), A.say('Snap!', 0.8), A.par(A.pose('upper', { rot: [0, 0, 0], dur: 0.25 }), A.pose('lower', { rot: [0, 0, 0], dur: 0.25 }))],
      })
      .done(),
  ),
  // An envelope standing up: the address and a stamp on the front, the flap at the back opens and the letter
  // inside slides up out of it.
  e('letter', 'study', 'mail', () => {
    const b = m('letter', { edge: S });
    b.box([0.24, 0.15, 0.006], [0, 0.075, 0], { color: '#f6efdc', round: 0.2, name: 'envelope' })
      .box([0.22, 0.13, 0.002], [0, 0.085, -0.002], { color: 'white', round: 0.2, name: 'paper', mover: { kind: 'slide', axis: 'y', amount: 0.09 } })
      .each(3, (i) => b.box([0.15, 0.004, 0.002], [0, 0.13 - i * 0.015, -0.0035], { color: '#5c6166', parent: 'paper', noInk: true }))
      .wedge([0.24, 0.08, 0.004], [0, 0.11, -0.005], { color: '#ecdfbe', rot: [0, 0, 180], name: 'flap', pivot: [0, 0.15, -0.005], mover: { kind: 'swing', axis: 'x', amount: -150 } })
      .cyl([0.028, 0.004, 0.028], [0, 0.075, -0.008], { color: '#a3322a', rot: [90, 0, 0], parent: 'flap' })
      .box([0.035, 0.042, 0.002], [0.09, 0.12, 0.004], { color: '#d23a2e', round: 0.2 })
      .box([0.025, 0.03, 0.002], [0.09, 0.12, 0.0055], { color: '#a8d8f5', noInk: true })
      .each(3, (i) => b.box([0.1 - i * 0.015, 0.006, 0.002], [-0.02, 0.07 - i * 0.016, 0.004], { color: '#3a3633', noInk: true }));
    return b.act({
      click: [
        [A.operate('flap', 'open'), A.operate('paper', 'up'), A.say('Rustle...', 1.2)],
        [A.operate('paper', 'down'), A.operate('flap', 'close')],
      ],
    }).done();
  }),
  // A brass-handled paper knife standing in its desk holder; it slides out and slits a letter open.
  e('letter opener', 'study', 'desk supplies', () =>
    m('letter opener', { edge: S })
      .box([0.07, 0.012, 0.05], [0, 0.006, 0], { color: 'darkwood', round: 0.3 })
      .box([0.045, 0.07, 0.03], [0, 0.047, 0], { color: 'brass', round: 0.2 })
      .box([0.03, 0.004, 0.006], [0, 0.083, 0], { color: '#2a2726' })
      .cyl([0.016, 0.08, 0.011], [0, 0.125, 0], { color: '#7a5230', segs: 8, name: 'knife', mover: { kind: 'slide', axis: 'y', amount: 0.08 } })
      .ball([0.022, 0.022, 0.013], [0, 0.168, 0], { color: 'brass', parent: 'knife' })
      .box([0.034, 0.008, 0.014], [0, 0.086, 0], { color: 'brass', parent: 'knife' })
      .box([0.016, 0.08, 0.003], [0, 0.044, 0], { color: '#d4d7da', parent: 'knife' })
      .act({
        click: [
          [A.spawn('l', 'letter', { rel: 'front', of: 'self', dist: 'close' }), A.operate('knife', 'out'), A.pose('knife', { rot: [0, 0, 35], dur: 0.2 }), A.say('Shhk!', 0.8), A.pose('knife', { rot: [0, 0, 0], dur: 0.2 }), A.operate('knife', 'in'), A.wait(0.8), A.remove('l', 'fade')],
        ],
      })
      .done(),
  ),
  // Three chunky wooden alphabet letters, A B C, painted red, blue and green; they hop up one after another.
  e('letters', 'ideas', 'letters', () => {
    const b = m('letters', { edge: S }), t = 0.03;
    b.box([0.024, 0.11, t], [-0.125, 0.055, 0], { color: '#e0473b', rot: [0, 0, -16], name: 'letterA' })
      .box([0.024, 0.11, t], [-0.08, 0.055, 0], { color: '#e0473b', rot: [0, 0, 16], parent: 'letterA' })
      .box([0.04, 0.018, t], [-0.1025, 0.04, 0], { color: '#e0473b', parent: 'letterA' })
      .box([0.024, 0.11, t], [-0.035, 0.055, 0], { color: '#2f6fc8', name: 'letterB' })
      .arc([0.06, 0.055, t], [-0.025, 0.0805, 0], { color: '#2f6fc8', rot: [0, 0, -90], tube: 0.36, parent: 'letterB' })
      .arc([0.07, 0.06, t], [-0.025, 0.03, 0], { color: '#2f6fc8', rot: [0, 0, -90], tube: 0.34, parent: 'letterB' })
      .arc([0.1, 0.11, t], [0.1, 0.055, 0], { color: '#3f9a4a', rot: [0, 0, 90], arc: 280, tube: 0.36, name: 'letterC' });
    const hop = (n: string) => [A.pose(n, { move: [0, 0.05, 0], dur: 0.2 }), A.pose(n, { move: [0, 0, 0], dur: 0.2 })];
    return b.act({ click: [...hop('letterA'), ...hop('letterB'), ...hop('letterC'), A.say('Hop hop hop!', 1.4)] }).done();
  }),
  // A head of lettuce: a pale tight heart wrapped in ruffled outer leaves; an outer leaf peels off.
  e('lettuce', 'food', 'vegetables', () => {
    const b = m('lettuce');
    b.ball([0.15, 0.13, 0.15], [0, 0.075, 0], { color: '#c8eb8a', name: 'heart' });
    around(7, 0.07, 0.3).forEach(([x, z], i) => {
      const a = (Math.atan2(z, x) * 180) / Math.PI;
      b.ball([0.13, 0.14, 0.04], [x, 0.075, z], { color: i % 2 ? '#7cc45a' : '#6aae4a', rot: [0, 90 - a, 0], parent: 'heart', ...(i === 0 ? { name: 'leaf', piece: true } : {}) })
        .ball([0.14, 0.03, 0.045], [x * 1.08, 0.14, z * 1.08], { color: '#9bd86a', rot: [0, 90 - a, 0], parent: i === 0 ? 'leaf' : 'heart', noInk: true });
    });
    b.ball([0.1, 0.06, 0.1], [0, 0.145, 0], { color: '#dff2a8', parent: 'heart' })
      .cyl([0.04, 0.02, 0.04], [0, 0.008, 0], { color: '#eef4c8' });
    return b.act({ click: [[A.detach('leaf', 'lettuce leaf'), A.say('Crunch!', 1)], [A.reattach('leaf')]] }).done();
  }),
  // An aluminium spirit level 60 cm long with rubber end caps, a grip hole and three vials; tilt it and the
  // bubble runs to one side, then settles back in the middle. (It lies on its edge, 6.5 cm tall: the vocabulary's
  // 0.3 m is about its length.)
  e('level', 'workshop', 'hand tools', () =>
    m('level', { edge: S })
      .box([0.6, 0.065, 0.028], [0, 0.0325, 0], { color: '#f6d24a', round: 0.15 })
      .box([0.6, 0.012, 0.03], [0, 0.006, 0], { color: '#c9ccd1', round: 0.2 })
      .box([0.6, 0.012, 0.03], [0, 0.059, 0], { color: '#c9ccd1', round: 0.2 })
      .box([0.03, 0.068, 0.032], [0.3, 0.034, 0], { color: '#2a2726', round: 0.3 })
      .box([0.03, 0.068, 0.032], [-0.3, 0.034, 0], { color: '#2a2726', round: 0.3 })
      .box([0.07, 0.03, 0.031], [-0.17, 0.034, 0], { color: '#3a3633', round: 0.8 })
      .box([0.07, 0.034, 0.03], [0, 0.034, 0], { color: '#3a3633', round: 0.3 })
      .capsule([0.016, 0.05, 0.016], [0, 0.034, 0.012], { color: '#b8e05a', rot: [0, 0, 90], edge: F })
      .ball(0.009, [0, 0.038, 0.019], { color: 'white', name: 'bubble', edge: F })
      .capsule([0.014, 0.03, 0.014], [0.2, 0.034, 0.013], { color: '#b8e05a', edge: F })
      .label('LEVEL', [0.08, 0.02], [0.1, 0.034, 0.015], { color: '#f6d24a', depth: 0.002 })
      .act({ click: [A.par(A.set({ tilt: 5 }), A.pose('bubble', { move: [0.016, 0, 0], dur: 0.5 })), A.wait(0.6), A.par(A.set({ tilt: 0 }), A.pose('bubble', { move: [0, 0, 0], dur: 0.6 })), A.say('Ding!', 1)] })
      .done(),
  ),
  // A crowbar at work (a 90 cm bar, as you would find it on a site): the red steel bar rests on a wooden block
  // as its fulcrum, its bent chisel toe tucked under a heavy stone and its gooseneck claw up at the handle end.
  // Push the handle down and the stone tips up.
  e('lever', 'workshop', 'hand tools', () => {
    const b = m('lever', { edge: S }), c = '#c8322a', F0: V = [0.17, 0.088, 0];
    b.box([0.1, 0.08, 0.14], [0.17, 0.04, 0], { color: 'wood', round: 0.15 })
      .box([0.4, 0.24, 0.32], [0.45, 0.12, 0], { color: 'stone', round: 0.6, edge: F, name: 'stone', pivot: [0.65, 0, 0] })
      .ball([0.2, 0.08, 0.18], [0.5, 0.22, 0.03], { color: '#9a9a92', parent: 'stone', edge: F })
      .rod([0.27, 0.04, 0], [-0.38, 0.357, 0], 0.03, c, { name: 'lever', pivot: F0, mover: { kind: 'swing', axis: 'z', amount: 11 } })
      .rod([0.27, 0.04, 0], [0.335, 0.016, 0], 0.028, c, { parent: 'lever' })
      .rod([-0.38, 0.357, 0], [-0.425, 0.402, 0], 0.03, c, { parent: 'lever' })
      .rod([-0.425, 0.402, 0], [-0.46, 0.394, 0], 0.028, c, { parent: 'lever' })
      .rod([-0.46, 0.394, 0], [-0.472, 0.362, 0], 0.026, c, { parent: 'lever' })
      .pair((s) => b.rod([-0.472, 0.362, s * 0.006], [-0.468, 0.335, s * 0.007], 0.012, 'iron', { parent: 'lever' }))
      .box([0.014, 0.014, 0.03], [0.34, 0.013, 0], { color: 'iron', parent: 'lever' });
    return b
      .act({
        click: [
          A.par(A.pose('lever', { rot: [0, 0, 11], dur: 0.6 }), A.pose('stone', { rot: [0, 0, -6], dur: 0.6 }), A.say('Heave!', 1.2)),
          A.wait(0.8),
          A.par(A.pose('lever', { rot: [0, 0, 0], dur: 0.3 }), A.pose('stone', { rot: [0, 0, 0], dur: 0.3 })),
          A.par(A.effect('dust', { dur: 0.6 }), A.say('Thud.', 0.8)),
        ],
      })
      .done();
  }),
  // A grand public library: a stone hall 16 m wide on a podium of steps, a portico of six columns under a
  // pediment, tall arched windows, double doors that open, and lamps either side. "Shhh!"
  e('library', 'places', 'public buildings', () => {
    const b = m('library', { edge: S }), st = '#ded5c2', tr = '#f2ece0';
    b.box([17, 0.5, 10], [0, 0.25, -0.5], { color: '#b8b2a4' })
      .box([16, 8, 9], [0, 4.5, -1], { color: st, round: 0.02 })
      .box([16.4, 0.5, 9.4], [0, 8.75, -1], { color: tr })
      .box([16, 0.6, 9], [0, 9.3, -1], { color: st })
      .box([16.2, 0.2, 9.2], [0, 9.7, -1], { color: tr })
      .each(4, (i) => b.box([8.6 - i * 0.2, 0.25, 4.2 - i * 0.5], [0, 0.625 + i * 0.25, 5.0 - i * 0.25], { color: '#cfc8b8' }))
      .each(6, (i) => b.cyl([0.7, 6.6, 0.7], [-3.5 + i * 1.4, 4.85, 4.4], { color: tr, segs: 16 }).box([0.95, 0.3, 0.95], [-3.5 + i * 1.4, 8.3, 4.4], { color: tr }).box([0.95, 0.3, 0.95], [-3.5 + i * 1.4, 1.65, 4.4], { color: tr }))
      .box([8.4, 0.9, 1.4], [0, 8.9, 4.2], { color: tr })
      .wedge([8.8, 2.0, 1.4], [0, 10.35, 4.2], { color: st })
      .label('PUBLIC LIBRARY', [6, 0.6], [0, 8.9, 4.92], { color: tr, depth: 0.05 })
      .cyl([1.2, 0.12, 1.2], [0, 10.0, 4.92], { color: '#e2b23a', rot: [90, 0, 0] });
    door(b, [-0.6, 1.5, 3.5], 1.2, 3.2, { color: '#5a3a22', frame: tr, name: 'doorL' });
    b.box([1.2, 3.2, 0.07], [0.6, 3.1, 3.57], { color: '#5a3a22', name: 'doorR', pivot: [1.2, 3.1, 3.57], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .ball(0.08, [0.1, 2.5, 3.63], { color: 'brass', parent: 'doorR' })
      .box([1.4, 0.9, 0.06], [0, 5.3, 3.53], { color: '#8fbcd8' });
    for (const x of [-6.6, -5.0, 5.0, 6.6]) for (const y of [2.8, 6.3]) win(b, [x, y, 3.5], 1.1, 2.2, { frame: tr }).arc([1.3, 1.3, 0.1], [x, y + 1.1, 3.55], { color: tr, tube: 0.12 });
    for (const z of [-4, -1, 2]) win(b, [8, 4.4, z], 1.2, 3.6, { frame: tr, face: 'x' });
    b.pair((s) => {
      b.stick([s * 4.6, 1.5, 5.6], [s * 4.6, 4.2, 5.6], 0.12, '#2a2726').box([0.3, 0.3, 0.3], [s * 4.6, 1.6, 5.6], { color: '#2a2726' });
      lamp(b, s > 0 ? 'lampL' : 'lampR', [0.45, 0.6, 0.45], [s * 4.6, 4.5, 5.6], '#ffe9a0');
      b.cone([0.6, 0.3, 0.6], [s * 4.6, 4.95, 5.6], { color: '#2a2726' });
    });
    return b.act({
      click: [
        [A.par(A.operate('door', 'open'), A.operate('lamp', 'on')), A.say('Shhh!', 2), A.wait(2.5), A.par(A.operate('door', 'close'), A.operate('lamp', 'off'))],
      ],
    }).done();
  }),
  // A driving licence at its real size in a little acrylic stand: the photo, the name lines and the title on the
  // front, the magnetic stripe on the back; it flips over.
  e('license', 'study', 'documents', () => {
    const b = m('license', { edge: S });
    b.box([0.07, 0.008, 0.03], [0, 0.004, 0], { color: '#d6ecf8', round: 0.4 })
      .box([0.086, 0.054, 0.002], [0, 0.035, 0], { color: '#e6f2fa', round: 0.4, name: 'card' })
      .box([0.086, 0.011, 0.0005], [0, 0.0565, 0.0012], { color: '#2f4f8f', parent: 'card', noInk: true })
      .label('DRIVER LICENSE', [0.07, 0.008], [0, 0.0565, 0.0016], { color: '#2f4f8f', depth: 0.0004, parent: 'card' })
      .box([0.022, 0.028, 0.0005], [-0.027, 0.033, 0.0012], { color: '#f0c39f', parent: 'card', noInk: true })
      .ball([0.014, 0.013, 0.0006], [-0.027, 0.037, 0.0014], { color: '#8c5a2b', parent: 'card', noInk: true })
      .each(4, (i) => b.box([0.036 - (i % 2) * 0.01, 0.003, 0.0005], [0.014 - (i % 2) * 0.005, 0.044 - i * 0.008, 0.0012], { color: '#5c6166', parent: 'card', noInk: true }))
      .box([0.086, 0.01, 0.0005], [0, 0.044, -0.0012], { color: '#2a2726', parent: 'card', noInk: true });
    return b.act({ click: [A.pose('card', { rot: [0, 180, 0], dur: 0.6 }), A.wait(1.2), A.pose('card', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A pressed-aluminium number plate on a little bracket: the blue band, raised black characters and four bolts.
  e('license plate', 'garage', 'car parts', () => {
    const b = m('license plate', { edge: S });
    b.box([0.2, 0.012, 0.06], [0, 0.006, -0.01], { color: '#3a3633' })
      .box([0.03, 0.06, 0.012], [0, 0.04, -0.012], { color: '#3a3633' })
      .box([0.52, 0.11, 0.008], [0, 0.12, 0], { color: 'white', round: 0.3, name: 'plate' })
      .box([0.045, 0.104, 0.003], [-0.232, 0.12, 0.005], { color: '#2f4f8f', parent: 'plate', round: 0.2 })
      .label('ABC 123', [0.4, 0.08], [0.025, 0.12, 0.005], { color: 'white', depth: 0.003, parent: 'plate' });
    for (const x of [-0.19, 0.19]) for (const y of [0.08, 0.16]) b.cyl([0.012, 0.004, 0.012], [x, y, 0.006], { color: '#c9ccd1', rot: [90, 0, 0], parent: 'plate' });
    return b.act({ click: [A.par(A.pose('plate', { rot: [0, 0, 6], dur: 0.12 })), A.pose('plate', { rot: [0, 0, -6], dur: 0.12 }), A.pose('plate', { rot: [0, 0, 0], dur: 0.12 }), A.say('Rattle rattle', 1.2)] }).done();
  }),
  // A saucepan lid: domed steel with a rolled rim and a black knob; it rattles in the steam, then lifts.
  e('lid', 'kitchen', 'cookware', () =>
    m('lid', { edge: S })
      .dome([0.26, 0.05, 0.26], [0, 0.031, 0], { color: '#c9ccd1', name: 'lid', pivot: [0, 0.006, 0] })
      .torus([0.264, 0.264, 0.012], [0, 0.008, 0], { color: '#8f99a3', rot: [90, 0, 0], tube: 0.05, parent: 'lid' })
      .cyl([0.06, 0.01, 0.06], [0, 0.058, 0], { color: '#8f99a3', parent: 'lid' })
      .stick([0, 0.06, 0], [0, 0.075, 0], 0.016, '#2a2726', { parent: 'lid' })
      .ball([0.055, 0.028, 0.055], [0, 0.084, 0], { color: '#2a2726', parent: 'lid', edge: F })
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 1.5 }), A.say('Rattle rattle!', 1.2)), A.pose('lid', { rot: [5, 0, 0], dur: 0.1 }), A.pose('lid', { rot: [-5, 0, 0], dur: 0.1 }), A.pose('lid', { rot: [4, 0, 3], dur: 0.1 }), A.pose('lid', { rot: [0, 0, 0], dur: 0.1 })],
          [A.pose('lid', { move: [0, 0.12, 0], dur: 0.4 }), A.effect('steam', { dur: 1 }), A.wait(0.8), A.pose('lid', { move: [0, 0, 0], dur: 0.3 }), A.say('Clang', 0.8)],
        ],
      })
      .done(),
  ),
  // A polygraph: a crisp case on the desk with a slanted control panel, the paper chart and four pens that
  // scribble; it stays calm for the truth and goes wild for a lie.
  e('lie detector', 'tech', 'machines', () => {
    const b = m('lie detector', { edge: S });
    b.box([0.5, 0.1, 0.34], [0, 0.05, 0], { color: '#5c6166', round: 0.15 })
      .box([0.5, 0.18, 0.1], [0, 0.17, -0.12], { color: '#3a3633', rot: [-20, 0, 0], round: 0.15 })
      .pair((s) => b.cyl([0.07, 0.012, 0.07], [s * 0.15, 0.19, -0.09], { color: 'white', rot: [70, 0, 0] }).box([0.004, 0.026, 0.004], [s * 0.15, 0.19, -0.082], { color: 'red', rot: [70, 0, s * 30] }))
      .box([0.04, 0.025, 0.012], [0, 0.18, -0.07], { color: '#9be34d', glow: true, name: 'ok', mover: { kind: 'light' } })
      .box([0.3, 0.004, 0.24], [0, 0.102, 0.04], { color: '#faf6ea' })
      .cyl([0.04, 0.32, 0.04], [0, 0.12, -0.08], { color: 'white', rot: [0, 0, 90], name: 'roll', mover: { kind: 'spin', axis: 'x', amount: 200 } })
      .each(4, (i) => {
        const x = -0.105 + i * 0.07;
        b.box([0.006, 0.006, 0.12], [x, 0.11, -0.01], { color: '#2a2726', name: `pen${i}`, pivot: [x, 0.11, -0.07] })
          .ball(0.008, [x, 0.106, 0.05], { color: i === 2 ? 'red' : 'blue', parent: `pen${i}` });
        b.each(4, (k) => b.box([0.012, 0.0015, 0.004], [x + (k % 2 ? 0.006 : -0.006), 0.105, 0.08 + k * 0.02], { color: i === 2 ? 'red' : 'blue', rot: [0, k % 2 ? 50 : -50, 0], noInk: true }));
      })
      .rod([0.25, 0.08, 0.1], [0.4, 0.02, 0.2], 0.01, '#2a2726')
      .torus([0.04, 0.04, 0.02], [0.4, 0.02, 0.22], { color: '#2a2726', rot: [90, 0, 0] });
    const wig = (a: number) => A.par(...[0, 1, 2, 3].map((i) => A.pose(`pen${i}`, { rot: [0, i % 2 ? a : -a, 0], dur: 0.1 })));
    return b.act({
      click: [
        [A.operate('roll', 'on'), A.operate('ok', 'on'), wig(4), wig(-4), wig(0), A.say('Bip... bip.', 1.4), A.operate('roll', 'off'), A.operate('ok', 'off')],
        [A.operate('roll', 'on'), wig(25), wig(-25), wig(25), wig(-25), A.par(wig(0), A.anim('shake'), A.say('BZZZT!', 1.4)), A.operate('roll', 'off')],
      ],
    }).done();
  }),
  // A white ring buoy with red quarters and a grab line, hung on a wooden post by the water under its name
  // board; it comes off the post to be thrown.
  e('life preserver (ring)', 'sea', 'lifesaving', () => {
    const b = m('life preserver (ring)');
    b.box([0.6, 0.08, 0.6], [0, 0.04, -0.1], { color: '#8a8a84', edge: S })
      .box([0.14, 1.6, 0.14], [0, 0.8, -0.14], { color: 'wood', edge: S, round: 0.15, name: 'post' })
      .box([0.56, 0.13, 0.04], [0, 1.5, -0.05], { color: '#2f4f8f', edge: S, parent: 'post' })
      .label('S.S. TOWN', [0.5, 0.09], [0, 1.5, -0.025], { color: '#2f4f8f', depth: 0.01, parent: 'post' })
      .stick([0, 1.3, -0.07], [0, 1.3, 0.0], 0.04, 'brass', { parent: 'post' })
      .torus([0.76, 0.76, 0.16], [0, 0.93, 0.0], { color: 'white', tube: 0.27, name: 'ring', parent: 'post', piece: true });
    for (const a of [45, 135, 225, 315]) b.cyl([0.21, 0.13, 0.17], [Math.cos(rad(a)) * 0.278, 0.93 + Math.sin(rad(a)) * 0.278, 0], { color: '#e0473b', rot: [0, 0, a], parent: 'ring' });
    b.torus([0.8, 0.8, 0.02], [0, 0.93, 0.0], { color: 'tan', tube: 0.03, parent: 'ring' });
    for (const a of [0, 90, 180, 270]) b.box([0.03, 0.05, 0.17], [Math.cos(rad(a)) * 0.385, 0.93 + Math.sin(rad(a)) * 0.385, 0], { color: 'tan', rot: [0, 0, a], parent: 'ring' });
    return b.act({ click: [[A.detach('ring', 'buoy'), A.say('Splash!', 1.2)], [A.reattach('ring')]] }).done();
  }),
  // A canopied inflatable life raft for six: twin black buoyancy tubes, an orange canopy on an arch with a door
  // flap that rolls open, a beacon on top and a grab line round it.
  e('life raft', 'garage', 'boats', () => {
    const b = m('life raft');
    return b.cyl([2.5, 0.08, 2.5], [0, 0.04, 0], { color: '#3a3633' })
      .torus([2.6, 2.6, 0.38], [0, 0.2, 0], { color: '#2a2726', rot: [90, 0, 0], tube: 0.15 })
      .torus([2.55, 2.55, 0.34], [0, 0.55, 0], { color: '#2a2726', rot: [90, 0, 0], tube: 0.14 })
      .torus([2.72, 2.72, 0.04], [0, 0.4, 0], { color: 'white', rot: [90, 0, 0], tube: 0.02 })
      .dome([2.3, 1.1, 2.3], [0, 1.21, 0], { color: '#f0782a' })
      .arc([2.34, 2.24, 0.14], [0, 0.66, 0], { color: '#e0662a', rot: [0, 90, 0], tube: 0.05 })
      .box([0.9, 0.7, 0.06], [0, 1.06, 1.06], { color: '#c85a20', name: 'flap', pivot: [0, 1.4, 1.0], mover: { kind: 'swing', axis: 'x', amount: -110 }, edge: S, round: 0.4 })
      .ball([0.7, 0.55, 0.08], [0, 1.0, 1.05], { color: '#2a1e18', noInk: true })
      .cyl([0.08, 0.3, 0.08], [0, 1.85, 0], { color: '#3a3633', edge: S })
      .ball(0.18, [0, 2.05, 0], { color: '#fff6c8', glow: true, name: 'beacon', mover: { kind: 'light' } })
      .label('SOLAS', [0.6, 0.18], [0.75, 1.0, 0.7], { color: '#f0782a', rot: [0, 45, 0], depth: 0.01 })
      .act({
        click: [
          [A.par(A.say('Psssshhht!', 1.5), A.anim('pulse')), A.operate('flap', 'open'), A.operate('beacon', 'on')],
          [A.operate('flap', 'close'), A.operate('beacon', 'off')],
        ],
      })
      .done();
  }),
  // An orange ring buoy with white bands and a rope grab line; thrown, it spins and splashes down.
  e('life ring', 'sea', 'lifesaving', () => {
    const b = m('life ring');
    b.torus([0.76, 0.76, 0.16], [0, 0.38, 0], { color: '#f0782a', tube: 0.27, name: 'ring' });
    for (const a of [0, 90, 180, 270]) b.cyl([0.2, 0.11, 0.17], [Math.cos(rad(a)) * 0.278, 0.38 + Math.sin(rad(a)) * 0.278, 0], { color: 'white', rot: [0, 0, a + 90], parent: 'ring' });
    b.torus([0.8, 0.8, 0.02], [0, 0.38, 0], { color: 'tan', tube: 0.03, parent: 'ring' })
      .label('LIFE RING', [0.2, 0.05], [0, 0.66, 0.08], { color: '#f0782a', depth: 0.004, parent: 'ring' });
    for (const a of [45, 135, 225, 315]) b.box([0.03, 0.05, 0.17], [Math.cos(rad(a)) * 0.385, 0.38 + Math.sin(rad(a)) * 0.385, 0], { color: 'tan', rot: [0, 0, a], parent: 'ring' });
    return b.act({ click: [A.anim('spin'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Splash!', 1.2))] }).done();
  }),
  // A totally enclosed lifeboat 7.5 m long: a white hull (a loft), the orange canopy over it with portholes, the
  // steering tower, a roof hatch that opens, a beacon, release hooks, and the propeller and rudder at the stern.
  e('lifeboat', 'garage', 'boats', () => {
    const b = m('lifeboat', { view: 'side' });
    b.loft([2.6, 2.2, 7.5], [0, 1.3, 0], [[0, 0.82, 0.8, 0.05], [0.2, 1, 1, 0], [0.7, 0.96, 1, 0], [0.9, 0.62, 0.95, 0.02], [1, 0.1, 0.85, 0.08]], { color: 'white', cut: 'bottom', boxy: 0.35, name: 'hull' })
      .loft([2.66, 0.2, 7.6], [0, 1.25, 0], [[0, 0.82, 1], [0.2, 1, 1], [0.7, 0.96, 1], [0.9, 0.62, 1], [1, 0.1, 1]], { color: '#e0662a', boxy: 0.4, parent: 'hull' })
      .loft([2.5, 1.5, 7.0], [0, 1.3, -0.15], [[0, 0.8, 0.85], [0.18, 1, 1], [0.72, 0.95, 0.95], [0.93, 0.6, 0.7], [1, 0.12, 0.3]], { color: '#f0782a', cut: 'top', boxy: 0.3, parent: 'hull' })
      .box([0.4, 0.3, 6.6], [0, 0.18, -0.2], { color: '#3a3633', edge: S })
      .box([1.1, 0.75, 1.3], [0, 2.3, -1.4], { color: '#f0782a', round: 0.35, edge: S, parent: 'hull' })
      .box([1.12, 0.3, 1.0], [0, 2.42, -1.35], { color: '#2b3f66', edge: S, parent: 'hull' })
      .box([0.9, 0.08, 0.8], [0, 2.07, 1.5], { color: '#e0662a', edge: S, round: 0.4, name: 'hatch', pivot: [0, 2.08, 1.1], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .stick([0, 2.67, -1.4], [0, 2.95, -1.4], 0.06, '#3a3633')
      .ball(0.2, [0, 3.05, -1.4], { color: '#fff6c8', glow: true, name: 'beacon', mover: { kind: 'light' } });
    b.pair((s) => {
      b.each(5, (i) => b.cyl([0.3, 0.06, 0.3], [s * 1.14, 1.68, -2.4 + i * 1.05], { color: '#2b3f66', rot: [0, 0, 90 - s * 22], edge: S, parent: 'hull' }));
      b.label('RESCUE', [1.4, 0.3], [s * 1.31, 0.95, 0.6], { color: 'white', rot: [0, s * 90, 0], depth: 0.02, parent: 'hull' });
    });
    for (const z of [-2.9, 2.6]) b.box([0.12, 0.35, 0.3], [0, 2.1, z], { color: '#f6d24a', edge: S, parent: 'hull' });
    return b.box([0.06, 0.8, 0.5], [0, 0.6, -3.95], { color: '#3a3633', edge: S, name: 'rudder', pivot: [0, 0.6, -3.72] })
      .torus([0.7, 0.7, 0.25], [0, 0.55, -3.55], { color: '#5c6166', tube: 0.12, edge: S })
      .box([0.12, 0.58, 0.04], [0, 0.55, -3.55], { color: 'brass', name: 'propeller', pivot: [0, 0.55, -3.55], edge: S, mover: { kind: 'spin', axis: 'z', amount: 900 } })
      .box([0.58, 0.12, 0.04], [0, 0.55, -3.55], { color: 'brass', parent: 'propeller', edge: S })
      .act({
        click: [
          [A.par(A.operate('propeller', 'on'), A.operate('beacon', 'on')), A.par(A.say('Toot toot!', 1.5), A.effect('water_spray', { dur: 2 })), A.pose('rudder', { rot: [0, 20, 0], dur: 0.6 }), A.pose('rudder', { rot: [0, 0, 0], dur: 0.6 })],
          [A.operate('hatch', 'open'), A.wait(2), A.operate('hatch', 'close'), A.par(A.operate('propeller', 'off'), A.operate('beacon', 'off'))],
        ],
      })
      .done();
  }),
  // A beach lifeguard chair: white timber legs in an A-frame, a ladder, the seat with its backrest 1.9 m up, a
  // parasol, a red cross board, a rescue tube hanging off it and a flag the lifeguard waves.
  e('lifeguard stand', 'sea', 'beach', () => {
    const b = m('lifeguard stand', { edge: S }), w = '#f7f5ef';
    for (const [x, z] of [[0.75, 0.65], [-0.75, 0.65], [0.75, -0.65], [-0.75, -0.65]]) b.box([0.12, 2.0, 0.12], [x * 0.85, 1.0, z * 0.85], { color: w, rot: [-z * 6, 0, x * 7] });
    b.pair((s) => b.box([1.5, 0.08, 0.08], [0, 0.7, s * 0.6], { color: w }).box([0.08, 0.08, 1.3], [s * 0.7, 0.7, 0], { color: w }))
      .box([1.3, 0.1, 1.1], [0, 1.95, 0], { color: w })
      .box([1.1, 0.06, 0.5], [0, 2.05, 0.05], { color: '#d23a2e', round: 0.4 })
      .box([1.1, 0.8, 0.08], [0, 2.4, -0.48], { color: w })
      .box([0.5, 0.14, 0.09], [0, 2.45, -0.43], { color: '#e0473b' })
      .box([0.14, 0.5, 0.09], [0, 2.45, -0.43], { color: '#e0473b' })
      .pair((s) => b.box([0.08, 0.3, 0.6], [s * 0.6, 2.2, 0.0], { color: w }))
      .pair((s) => b.box([0.08, 2.2, 0.08], [s * 0.32, 1.0, 1.05], { color: w, rot: [-20, 0, 0] }))
      .each(6, (i) => b.box([0.6, 0.05, 0.14], [0, 0.3 + i * 0.3, 1.38 - i * 0.11], { color: w }))
      .stick([0.5, 2.0, -0.45], [0.5, 3.6, -0.45], 0.05, '#9da3a8')
      .cone([2.2, 0.5, 2.2], [0.5, 3.7, -0.45], { color: '#e0473b', segs: 8, edge: F })
      .cone([1.1, 0.25, 1.1], [0.5, 3.825, -0.45], { color: 'white', segs: 8, edge: F })
      .capsule([0.16, 0.7, 0.1], [-0.72, 1.55, 0.2], { color: '#e0473b', edge: F })
      .stick([-0.6, 1.95, -0.5], [-0.6, 3.0, -0.5], 0.03, '#9da3a8')
      .box([0.45, 0.3, 0.02], [-0.37, 2.82, -0.5], { color: '#f6d24a', name: 'flag', pivot: [-0.6, 2.82, -0.5] })
      .box([0.45, 0.15, 0.022], [-0.37, 2.75, -0.5], { color: '#e0473b', parent: 'flag' })
      .socket('seat', [0, 2.08, 0.05], 'seat');
    return b.act({ click: [A.pose('flag', { rot: [0, 50, 0], dur: 0.3 }), A.say('Tweeeet!', 1.4), A.pose('flag', { rot: [0, -40, 0], dur: 0.4 }), A.pose('flag', { rot: [0, 40, 0], dur: 0.4 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A foam lifejacket: two orange front panels with reflective tape, a collar, black buckled straps and a whistle;
  // pull the tag and it puffs up.
  e('lifejacket', 'sea', 'lifesaving', () => {
    const b = m('lifejacket');
    return b.box([0.5, 0.55, 0.2], [0, 0.32, -0.02], { color: '#f0782a', round: 0.5, name: 'vest', pivot: [0, 0.32, -0.02] })
      .ball([0.36, 0.16, 0.2], [0, 0.62, -0.05], { color: '#f0782a', parent: 'vest' })
      .ball([0.16, 0.08, 0.1], [0, 0.65, 0.02], { color: '#7a3a10', parent: 'vest' })
      .box([0.03, 0.5, 0.03], [0, 0.32, 0.085], { color: '#3a3633', parent: 'vest' })
      .pair((s) => b.box([0.05, 0.32, 0.01], [s * 0.15, 0.4, 0.085], { color: '#d4d7da', parent: 'vest', noInk: true, edge: S }).ball([0.06, 0.18, 0.16], [s * 0.24, 0.52, -0.02], { color: '#7a3a10', parent: 'vest' }))
      .each(2, (i) => b.box([0.52, 0.04, 0.22], [0, 0.18 + i * 0.16, -0.02], { color: '#2a2726', parent: 'vest' }).box([0.08, 0.06, 0.04], [0, 0.18 + i * 0.16, 0.09], { color: '#5c6166', edge: S, parent: 'vest' }))
      .rod([0.15, 0.56, 0.09], [0.17, 0.46, 0.1], 0.006, '#3a3633')
      .box([0.025, 0.05, 0.02], [0.17, 0.43, 0.1], { color: '#f6d24a', edge: S })
      .box([0.03, 0.06, 0.012], [-0.12, 0.08, 0.09], { color: '#e0473b', edge: S, name: 'tag' })
      .act({ click: [A.pose('tag', { move: [0, -0.04, 0], dur: 0.15 }), A.par(A.pose('vest', { scale: 1.12, dur: 0.5 }), A.say('Pssshhh!', 1.2)), A.wait(1.2), A.par(A.pose('vest', { scale: 1, dur: 0.8 }), A.pose('tag', { move: [0, 0, 0], dur: 0.2 }))] })
      .done();
  }),
  // A rocker light switch on its wall plate, with screws and a little neon pilot light; it clicks on and off.
  e('light switch', 'home', 'electrics', () =>
    m('light switch', { edge: S })
      .box([0.09, 0.012, 0.04], [0, 0.006, -0.01], { color: '#d4d7da' })
      .box([0.086, 0.086, 0.01], [0, 0.055, 0], { color: 'white', round: 0.3 })
      .box([0.04, 0.05, 0.012], [0, 0.055, 0.008], { color: '#f2f0ea', round: 0.3, name: 'rocker', mover: { kind: 'swing', axis: 'x', amount: 16 } })
      .box([0.006, 0.004, 0.003], [0, 0.072, 0.0145], { color: '#f0923b', glow: true, parent: 'rocker', name: 'pilot', mover: { kind: 'light' } })
      .cyl([0.007, 0.003, 0.007], [0, 0.093, 0.0055], { color: '#9da3a8', rot: [90, 0, 0] })
      .cyl([0.007, 0.003, 0.007], [0, 0.017, 0.0055], { color: '#9da3a8', rot: [90, 0, 0] })
      .act({ click: [A.operate('rocker'), A.operate('pilot'), A.say('Click!', 0.8)] })
      .done(),
  ),
  // A classic incandescent light bulb: the pear of glass (it lights), the filament on its stem, the threaded
  // brass screw base and the contact; clicked, it lights up like a bright idea.
  e('lightbulb', 'home', 'lighting', () => {
    const b = m('lightbulb');
    b.cyl([0.012, 0.006, 0.012], [0, 0.003, 0], { color: '#2a2726', edge: S })
      .cyl([0.026, 0.008, 0.026], [0, 0.01, 0], { color: '#2a2726', taper: 1.2, edge: S })
      .cyl([0.027, 0.024, 0.027], [0, 0.026, 0], { color: 'brass', edge: S })
      .each(3, (i) => b.torus([0.03, 0.03, 0.005], [0, 0.018 + i * 0.008, 0], { color: '#b8902a', rot: [90, 0, 0], tube: 0.22, edge: S }))
      .cyl([0.03, 0.022, 0.03], [0, 0.048, 0], { color: '#fff6c8', taper: 1.5, name: 'glass', mover: { kind: 'light' } })
      .ball(0.062, [0, 0.088, 0], { color: '#fff6c8', parent: 'glass' })
      .stick([0, 0.058, 0], [0, 0.08, 0], 0.006, '#d6f0fa', { noInk: true })
      .rod([-0.008, 0.083, 0], [0.008, 0.083, 0], 0.003, '#f0923b', { glow: true, noInk: true });
    return b.act({ click: [[A.operate('glass', 'on'), A.effect('sparkle', { dur: 1 }), A.say('Ping!', 1)], [A.operate('glass', 'off')]] }).done();
  }),
  // A disposable lighter at its real size: the plastic body, the steel hood, the spark wheel and the button; the
  // wheel turns and a little flame appears.
  e('lighter', 'home', 'household', () =>
    m('lighter', { edge: S })
      .box([0.025, 0.058, 0.012], [0, 0.029, 0], { color: '#e0473b', round: 0.5 })
      .box([0.022, 0.014, 0.011], [0, 0.065, 0], { color: '#c9ccd1', round: 0.15 })
      .box([0.003, 0.012, 0.0115], [0.0, 0.065, 0], { color: '#8f99a3' })
      .cyl([0.01, 0.008, 0.01], [-0.004, 0.074, 0], { color: '#5c6166', rot: [0, 0, 90], name: 'wheel', pivot: [-0.004, 0.074, 0] })
      .box([0.008, 0.005, 0.009], [0.006, 0.06, 0.002], { color: '#2a2726' })
      .cone([0.008, 0.022, 0.008], [0.004, 0.086, 0], { color: '#ffd24a', glow: true, name: 'flame', scale: 0, edge: F })
      .act({ click: [A.pose('wheel', { rot: [-200, 0, 0], dur: 0.2 }), A.par(A.pose('flame', { scale: 1, dur: 0.1 }), A.say('Flick!', 0.8)), A.wait(1.6), A.pose('flame', { scale: 0, dur: 0.2 }), A.pose('wheel', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A 20 m lighthouse: a tapering white tower with red bands on a rock base, a door and little windows, the
  // gallery with its railing, the glazed lantern room whose lamp lights and lens turns, and the red cap; the
  // keeper's cottage beside it.
  e('lighthouse', 'places', 'landmarks', () => {
    const b = m('lighthouse', { edge: S });
    const d = (y: number) => 4.4 - (y / 16) * 1.6;
    b.cyl([6.5, 0.8, 6.0], [0, 0.4, 0], { color: '#8f8c86', edge: F })
      .cyl([4.4, 15.2, 4.4], [0, 8.4, 0], { color: 'white', taper: 2.8 / 4.4, segs: 24, name: 'tower' });
    for (const [y0, y1] of [[3.5, 5.5], [9.0, 11.0]]) b.cyl([d(y0) + 0.06, y1 - y0, d(y0) + 0.06], [0, (y0 + y1) / 2, 0], { color: '#d23a2e', taper: (d(y1) + 0.06) / (d(y0) + 0.06), segs: 24, parent: 'tower' });
    b.box([1.0, 2.1, 0.3], [0, 1.85, 2.08], { color: '#3a2a20', round: 0.1, name: 'door', pivot: [-0.5, 1.85, 2.2], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .arc([1.2, 1.2, 0.32], [0, 2.9, 2.06], { color: '#d23a2e', tube: 0.18 });
    for (const [y, a] of [[7, 30], [12.5, -20]] as const) b.box([0.5, 0.8, 0.2], [Math.sin(rad(a)) * d(y) / 2, y, Math.cos(rad(a)) * d(y) / 2], { color: '#2b3f66', rot: [0, a, 0] });
    b.cyl([3.9, 0.3, 3.9], [0, 16.15, 0], { color: '#3a3633' })
      .torus([3.8, 3.8, 0.08], [0, 17.15, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.03 });
    around(12, 1.88).forEach(([x, z]) => b.stick([x, 16.3, z], [x, 17.15, z], 0.05, '#3a3633'));
    b.cyl([2.4, 0.5, 2.4], [0, 16.55, 0], { color: '#d23a2e', segs: 10 })
      .cyl([2.3, 1.9, 2.3], [0, 17.75, 0], { color: '#bfe3f2', segs: 10 })
      .ball(0.9, [0, 17.7, 0], { color: '#fff3a0', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .box([2.0, 0.6, 0.12], [0, 17.7, 0], { color: '#f6d24a', name: 'lens', pivot: [0, 17.7, 0], mover: { kind: 'spin', axis: 'y', amount: 120 } })
      .cyl([0.5, 0.5, 0.18], [0.95, 17.7, 0], { color: '#fff6c8', rot: [0, 0, 90], parent: 'lens' })
      .cyl([0.5, 0.5, 0.18], [-0.95, 17.7, 0], { color: '#fff6c8', rot: [0, 0, 90], parent: 'lens' });
    around(10, 1.17, 0.31).forEach(([x, z]) => b.stick([x, 16.8, z], [x, 18.7, z], 0.06, '#3a3633'));
    b.cone([2.8, 1.3, 2.8], [0, 19.35, 0], { color: '#d23a2e', segs: 10 })
      .ball(0.4, [0, 20.1, 0], { color: '#3a3633' })
      .stick([0, 20.2, 0], [0, 20.9, 0], 0.04, '#3a3633');
    b.box([4.0, 2.8, 3.2], [4.6, 2.2, 0.6], { color: 'white' });
    gable(b, 4.0, 3.2, 3.6, 1.4, '#d23a2e', { x: 4.6, z: 0.6, eave: 0.25 });
    b.box([0.5, 1.4, 0.5], [5.6, 4.6, 0.0], { color: '#8f8c86' });
    door(b, [4.2, 0.8, 2.2], 0.9, 1.9, { color: '#2f4f8f', name: 'cottage' });
    win(b, [5.6, 2.3, 2.2], 0.8, 0.8);
    return b.act({
      click: [
        [A.par(A.operate('lamp', 'on'), A.operate('lens', 'on')), A.say('Hoooonk!', 2)],
        [A.par(A.operate('lamp', 'off'), A.operate('lens', 'off')), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')],
      ],
    }).done();
  }),
  // A lightning rod on the ridge of a real garden shed (walls 2.1 m, so a person fits through its door): the
  // copper spike with an old-fashioned blue glass ball on its finial, and the copper strip running along the
  // ridge, down the gable end and the corner of the wall to its earth stake. Clicked, lightning strikes it
  // harmlessly.
  e('lightning rod', 'workshop', 'building parts', () => {
    const b = m('lightning rod', { edge: S }), wall = '#e6d8bc', trim = 'white';
    b.box([2.1, 0.1, 1.7], [0, 0.05, 0], { color: '#9da3a8', round: 0.1 })
      .box([2.0, 2.1, 1.6], [0, 1.15, 0], { color: wall, round: 0.02 });
    b.each(6, (i) => b.box([2.02, 0.025, 0.02], [0, 0.45 + i * 0.3, 0.805], { color: '#d6c6a6', noInk: true }));
    b.pair((s) => b.box([0.08, 2.1, 0.08], [s * 0.99, 1.15, 0.79], { color: trim }).box([0.08, 2.1, 0.08], [s * 0.99, 1.15, -0.79], { color: trim }));
    gable(b, 2.0, 1.6, 2.2, 0.7, '#a3322a', { ridgeX: true, eave: 0.15 });
    door(b, [-0.4, 0.1, 0.8], 0.8, 1.85, { color: '#5a7a5a', frame: trim });
    win(b, [0.5, 1.5, 0.8], 0.6, 0.5, { frame: trim });
    b.cyl([0.12, 0.06, 0.12], [0, 2.93, 0], { color: 'copper' })
      .ball(0.08, [0, 3.0, 0], { color: 'copper' })
      .stick([0, 3.02, 0], [0, 3.9, 0], 0.03, 'copper')
      .ball(0.1, [0, 3.35, 0], { color: '#4f8fd0' })
      .cone([0.06, 0.15, 0.06], [0, 3.97, 0], { color: 'copper' })
      .rod([0.05, 2.93, 0], [1.16, 2.92, 0], 0.016, 'copper')
      .rod([1.16, 2.92, 0], [1.16, 2.27, 0], 0.016, 'copper')
      .rod([1.16, 2.27, 0], [1.02, 2.15, 0], 0.016, 'copper')
      .rod([1.02, 2.15, 0], [1.02, 0.12, 0], 0.016, 'copper')
      .box([0.05, 0.08, 0.05], [1.03, 0.5, 0], { color: '#8a5a35' })
      .cyl([0.06, 0.13, 0.06], [1.04, 0.065, 0], { color: '#5c6166' });
    const bolt: V[] = [[0.0, 4.05, 0], [0.25, 4.6, 0], [-0.1, 4.9, 0], [0.2, 5.5, 0]];
    for (let i = 0; i < bolt.length - 1; i++) b.rod(bolt[i], bolt[i + 1], 0.06, '#fff6a0', { glow: true, name: `bolt${i}`, scale: 0, noInk: true });
    const flash = (k: number) => A.par(A.pose('bolt0', { scale: k, dur: 0.05 }), A.pose('bolt1', { scale: k, dur: 0.05 }), A.pose('bolt2', { scale: k, dur: 0.05 }));
    return b.act({ click: [flash(1), A.par(A.effect('sparkle', { dur: 1 }), A.say('KRAKOOM!', 1.5), A.anim('shake')), A.wait(0.3), flash(0)] }).done();
  }),
  // A garden lily 90 cm tall: a stem with narrow leaves all the way up, two open trumpet flowers of six
  // recurved pink petals with long stamens, and a bud. The flowers open wider when clicked.
  e('lily (flower)', 'garden', 'flowers', () => {
    const b = m('lily (flower)');
    b.stick([0, 0, 0], [0, 0.82, 0], 0.014, '#4f8a42', { name: 'stem' });
    b.each(8, (i) => b.ball([0.025, 0.14, 0.008], [(i % 2 ? 0.04 : -0.04), 0.12 + i * 0.08, (i % 3 - 1) * 0.02], { color: 'leaf', rot: [0, i * 47, i % 2 ? -50 : 50], parent: 'stem' }));
    const flower = (name: string, at: V, tilt: number) => {
      b.rod([0, 0.78, 0], at, 0.01, '#4f8a42', { parent: 'stem' })
        .ball([0.03, 0.03, 0.03], at, { color: '#5aa553', name, parent: 'stem', pivot: at });
      b.each(6, (i) => {
        const a = i * 60;
        b.ball([0.04, 0.13, 0.012], [at[0] + Math.sin(rad(a)) * 0.05, at[1] + 0.03, at[2] + Math.cos(rad(a)) * 0.05], { color: i % 2 ? '#f7b0c8' : '#f490b4', rot: [55 * Math.cos(rad(a)) + tilt, 0, -55 * Math.sin(rad(a))], parent: name });
      });
      b.each(5, (i) => b.rod(at, [at[0] + (i - 2) * 0.015, at[1] + 0.09, at[2] + 0.02], 0.003, '#f6e08a', { parent: name, noInk: true }).ball(0.01, [at[0] + (i - 2) * 0.015, at[1] + 0.095, at[2] + 0.02], { color: '#c8642a', parent: name }));
    };
    flower('head', [0.07, 0.86, 0.04], 10);
    flower('head2', [-0.08, 0.8, 0.02], -10);
    b.capsule([0.03, 0.09, 0.03], [0.02, 0.92, -0.04], { color: '#c8e08a', parent: 'stem', rot: [-15, 0, 10] });
    return b.act({ click: [A.par(A.pose('head', { scale: 1.25, dur: 0.8 }), A.pose('head2', { scale: 1.25, dur: 0.8 }), A.effect('sparkle', { dur: 1 })), A.wait(1.5), A.par(A.pose('head', { scale: 1, dur: 0.8 }), A.pose('head2', { scale: 1, dur: 0.8 }))] }).done();
  }),
  // Lily of the valley: two broad leaves and an arching stem hung with little white bells, which ring.
  e('lily of the valley', 'garden', 'flowers', () => {
    const b = m('lily of the valley');
    b.ball([0.06, 0.22, 0.02], [-0.03, 0.11, -0.015], { color: 'leaf', rot: [0, 20, 10] })
      .ball([0.065, 0.2, 0.02], [0.035, 0.1, -0.025], { color: '#3f7a3a', rot: [0, -20, -12] });
    const pts: V[] = [[0, 0, 0.01], [0.005, 0.12, 0.015], [0.025, 0.17, 0.02], [0.05, 0.185, 0.025], [0.075, 0.175, 0.03], [0.095, 0.15, 0.03]];
    b.rod(pts[0], pts[1], 0.004, '#5aa553', { name: 'stem', pivot: pts[0] });
    for (let i = 1; i < 5; i++) b.rod(pts[i], pts[i + 1], 0.004, '#5aa553', { parent: 'stem' });
    for (let i = 1; i < 6; i++) {
      b.cyl([0.018, 0.016, 0.018], [pts[i][0] + 0.004, pts[i][1] - 0.018, pts[i][2] + 0.008], { color: 'white', taper: 0.6, rot: [180, 0, 0], parent: 'stem' })
        .rod([pts[i][0], pts[i][1], pts[i][2]], [pts[i][0] + 0.004, pts[i][1] - 0.01, pts[i][2] + 0.008], 0.002, '#5aa553', { parent: 'stem', noInk: true });
    }
    return b.act({ click: [A.pose('stem', { rot: [0, 0, 8], dur: 0.25 }), A.say('Ting-a-ling', 1.2), A.pose('stem', { rot: [0, 0, -6], dur: 0.25 }), A.pose('stem', { rot: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // An anatomy-class arm on a stand: shoulder, upper arm, elbow and a forearm with a hand that waves.
  e('limb', 'clinic', 'body parts', () => {
    const b = m('limb'), k = 'skin3';
    b.cyl([0.24, 0.03, 0.24], [0, 0.015, 0], { color: '#5c6166', edge: S })
      .stick([0, 0.03, 0], [0, 0.32, 0], 0.025, 'silver', { edge: S })
      .ball([0.13, 0.13, 0.13], [0, 0.36, 0], { color: k })
      .rod([0, 0.36, 0], [0.06, 0.62, 0], 0.1, k)
      .ball(0.085, [0.06, 0.63, 0], { color: k })
      .rod([0.06, 0.63, 0], [0.22, 0.76, 0.02], 0.075, k, { name: 'forearm', pivot: [0.06, 0.63, 0] })
      .box([0.07, 0.09, 0.03], [0.25, 0.82, 0.02], { color: k, round: 0.6, rot: [0, 0, -40], parent: 'forearm' })
      .each(4, (i) => b.capsule([0.016, 0.05, 0.017], [0.25 + i * 0.016, 0.88 - i * 0.008, 0.02], { color: k, rot: [0, 0, -25 + i * 6], parent: 'forearm' }))
      .capsule([0.018, 0.045, 0.018], [0.21, 0.84, 0.03], { color: k, rot: [0, 0, 30], parent: 'forearm' });
    return b.act({ click: [A.pose('forearm', { rot: [0, 0, 25], dur: 0.3 }), A.pose('forearm', { rot: [0, 0, -10], dur: 0.3 }), A.pose('forearm', { rot: [0, 0, 25], dur: 0.3 }), A.pose('forearm', { rot: [0, 0, 0], dur: 0.3 }), A.say('Wiggle!', 1)] }).done();
  }),
  // A lime at its real size, glossy green with a nub, and a wedge cut from it that comes away.
  e('lime', 'food', 'fruit', () =>
    m('lime')
      .loft([0.056, 0.056, 0.064], [0.004, 0.028, 0], [[0, 0.86, 0.86], [0.35, 1, 1], [0.75, 0.94, 0.94], [0.94, 0.6, 0.6], [1, 0.3, 0.3]], { color: '#5aa52e', rot: [0, 90, 0], name: 'body' })
      .ball(0.01, [0.036, 0.028, 0], { color: '#4f9a2a', parent: 'body' })
      .cyl([0.046, 0.01, 0.046], [-0.032, 0.028, 0], { color: '#d4ef8a', rot: [0, 0, 90], name: 'slice', parent: 'body', piece: true })
      .cyl([0.049, 0.009, 0.049], [-0.0325, 0.028, 0], { color: '#5aa52e', rot: [0, 0, 90], parent: 'slice', noInk: true })
      .act({ click: [[A.par(A.detach('slice', 'lime slice'), A.effect('water_spray', { dur: 0.6 }))], [A.reattach('slice')]] })
      .done(),
  ),
  // A lime tree (linden) 12 m tall: a straight trunk and a tall dome of heart-shaped leaves hung with pale
  // blossom. Shake it and the bees come buzzing.
  e('lime tree', 'garden', 'trees', () =>
    tree2('lime tree', 12, '#6aa84a', { leaf2: '#5a9a3a', fruit: '#f2e6a0', fs: 0.45, n: 12, shape: 'tall', bough: 4 })
      .act({ click: [A.anim('shake'), A.spawn('bee', 'bee', { rel: 'front', of: 'self', dist: 'close' }), A.say('Bzzzz!', 1.5, 'bee'), A.move('bee', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('bee', 'fade')] })
      .done(),
  ),
  // A block of pale limestone with its bedding lines and a fossil ammonite in the face; a chip knocks off.
  e('limestone', 'nature', 'rocks', () => {
    const b = m('limestone');
    b.box([0.8, 0.5, 0.55], [0, 0.25, 0], { color: '#e6dcc0', round: 0.3, name: 'block' })
      .each(3, (i) => b.box([0.81, 0.02, 0.56], [0, 0.11 + i * 0.13, 0], { color: '#cfc2a0', noInk: true, round: 0.3, parent: 'block' }))
      .torus([0.13, 0.13, 0.02], [0.14, 0.26, 0.275], { color: '#b8a682', tube: 0.3, parent: 'block' })
      .torus([0.07, 0.07, 0.022], [0.15, 0.265, 0.277], { color: '#b8a682', tube: 0.35, parent: 'block' })
      .ball(0.02, [0.155, 0.27, 0.279], { color: '#a8966f', parent: 'block' })
      .ball([0.22, 0.14, 0.18], [-0.32, 0.47, 0.18], { color: '#ddd2b4', name: 'chip', parent: 'block', piece: true })
      .ball([0.36, 0.2, 0.3], [-0.42, 0.1, 0.32], { color: '#d8ccac' });
    return b.act({ click: [[A.par(A.effect('dust', { dur: 1 }), A.say('Chink!', 1)), A.detach('chip', 'limestone chip')], [A.reattach('chip')]] }).done();
  }),
  // A black stretch limousine 8.5 m long: the long body (a loft) and its tinted glasshouse with many pillars,
  // chrome trim, a grille, lights that switch on and a rear door that opens for the VIP.
  e('limo', 'garage', 'cars', () => {
    const b = m('limo', { view: 'side' });
    car(b, { L: 8.5, W: 1.95, H: 1.48, wheel: 0.7, axles: [2.95, -3.05], color: '#1e1c1c', glass: '#202a38', belt: 0.95, hood: 0.18, tail: 0.1, pillars: [2.0, 1.1, -0.6, -2.2], door: [-1.5, 1.1], bumper: '#c9ccd1' });
    b.box([1.97, 0.04, 8.3], [0, 0.88, 0], { color: '#c9ccd1', parent: 'body', edge: S, noInk: true })
      .box([0.9, 0.24, 0.05], [0, 0.66, 4.26], { color: '#c9ccd1', parent: 'body', edge: S })
      .socket('seat', [0.4, 0.55, 1.7], 'seat')
      .socket('back', [0, 0.55, -1.5], 'seat');
    return b.act({
      click: [
        [A.par(A.operate('headlight', 'on'), A.operate('taillight', 'on')), A.operate('door', 'open'), A.say('Honk honk!', 1.5), A.wait(2), A.operate('door', 'close')],
        [A.par(A.operate('headlight', 'off'), A.operate('taillight', 'off'))],
      ],
    }).done();
  }),
  // A lacy bra and briefs set in blush pink on a padded satin hanger; it sways and blushes.
  e('lingerie', 'wardrobe', 'underwear', () => {
    const b = m('lingerie'), c = '#f4a1c0', l = 'white';
    b.stick([0, 0.5, 0], [0, 0.56, 0], 0.006, 'silver', { edge: S, name: 'hook', pivot: [0, 0.56, 0] })
      .arc([0.05, 0.04, 0.006], [0, 0.565, 0], { color: 'silver', arc: 220, edge: S, parent: 'hook' })
      .capsule([0.035, 0.38, 0.035], [0, 0.47, 0], { color: '#f6e0ea', rot: [0, 0, 90], parent: 'hook' })
      .pair((s) => b.rod([s * 0.1, 0.46, 0], [s * 0.08, 0.36, 0.02], 0.008, c, { parent: 'hook' }).ball([0.1, 0.09, 0.06], [s * 0.055, 0.33, 0.03], { color: c, parent: 'hook' }).torus([0.1, 0.06, 0.014], [s * 0.055, 0.3, 0.05], { color: l, tube: 0.2, parent: 'hook', noInk: true }))
      .box([0.2, 0.02, 0.05], [0, 0.295, 0.0], { color: c, parent: 'hook' })
      .ball(0.014, [0, 0.31, 0.065], { color: '#e0473b', parent: 'hook' })
      .stick([0.0, 0.29, 0.0], [0.0, 0.21, 0.0], 0.006, 'silver', { parent: 'hook' })
      .cone([0.22, 0.16, 0.08], [0, 0.13, 0.0], { color: c, rot: [180, 0, 0], parent: 'hook' })
      .box([0.22, 0.03, 0.085], [0, 0.205, 0.0], { color: l, parent: 'hook', noInk: true })
      .ball(0.012, [0, 0.19, 0.045], { color: '#e0473b', parent: 'hook' });
    return b.act({ click: [A.pose('hook', { rot: [0, 0, 8], dur: 0.4 }), A.par(A.pose('hook', { rot: [0, 0, -8], dur: 0.5 }), A.effect('hearts', { dur: 1.2 })), A.pose('hook', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A clump of grey dryer lint beside a sticky lint roller; the roller rolls over it and picks it all up.
  e('lint', 'home', 'laundry', () => {
    const b = m('lint');
    b.ball([0.12, 0.04, 0.09], [0.08, 0.02, 0.04], { color: '#b8b4bc', name: 'fluff' })
      .ball([0.06, 0.035, 0.05], [0.11, 0.035, 0.05], { color: '#c8c4cc', parent: 'fluff' })
      .ball([0.05, 0.03, 0.05], [0.05, 0.03, 0.03], { color: '#a8a4b0', parent: 'fluff' })
      .rod([0.05, 0.04, 0.06], [0.1, 0.05, 0.07], 0.004, '#4e8fd6', { noInk: true, parent: 'fluff' })
      .rod([0.08, 0.045, 0.02], [0.12, 0.03, 0.06], 0.004, '#e0473b', { noInk: true, parent: 'fluff' })
      .cyl([0.06, 0.11, 0.06], [-0.1, 0.03, 0.0], { color: 'white', rot: [0, 0, 90], name: 'roller', edge: S })
      .cyl([0.062, 0.1, 0.062], [-0.1, 0.03, 0.0], { color: '#f2f0ea', rot: [0, 0, 90], parent: 'roller', noInk: true })
      .rod([-0.1, 0.03, 0], [-0.1, 0.03, -0.07], 0.01, '#9da3a8', { parent: 'roller' })
      .rod([-0.1, 0.03, -0.07], [-0.1, 0.17, -0.12], 0.026, '#4e8fd6', { parent: 'roller' });
    return b.act({
      click: [
        [A.pose('roller', { move: [0.18, 0, 0.04], dur: 0.8 }), A.par(A.pose('fluff', { scale: 0, dur: 0.2 }), A.say('Sticky!', 1)), A.pose('roller', { move: [0, 0, 0], dur: 0.8 })],
        [A.par(A.pose('fluff', { scale: 1, dur: 0.6 }), A.effect('dust', { dur: 0.8 }))],
      ],
    }).done();
  }),
  // A stick of lip balm at its real size: the cap comes off and the balm twists up.
  e('lip balm', 'wardrobe', 'makeup', () =>
    m('lip balm', { edge: S })
      .cyl([0.017, 0.045, 0.017], [0, 0.0225, 0], { color: 'white', round: 0.3 })
      .cyl([0.0175, 0.025, 0.0175], [0, 0.026, 0], { color: '#7ab8e8', noInk: true })
      .cyl([0.012, 0.012, 0.012], [0, 0.046, 0], { color: '#f2ece0', name: 'balm', edge: F, mover: { kind: 'slide', axis: 'y', amount: 0.008 } })
      .cyl([0.0178, 0.024, 0.0178], [0, 0.057, 0], { color: '#2f6fc8', name: 'cap', piece: true, parent: 'balm', round: 0.4 })
      .act({ click: [[A.detach('cap', 'cap'), A.operate('balm', 'up')], [A.operate('balm', 'down'), A.reattach('cap')]] })
      .done(),
  ),
  // A liquid lip stain: a little square bottle of deep red stain with a gold collar; the cap is the wand, which
  // pulls out with a pop.
  e('lip stain', 'wardrobe', 'makeup', () =>
    m('lip stain', { edge: S })
      .box([0.022, 0.05, 0.016], [0, 0.025, 0], { color: '#9a1a32', round: 0.35 })
      .box([0.023, 0.02, 0.017], [0, 0.03, 0], { color: '#f4e0e4', noInk: true, round: 0.35 })
      .cyl([0.013, 0.006, 0.013], [0, 0.053, 0], { color: 'gold' })
      .cyl([0.013, 0.045, 0.013], [0, 0.078, 0], { color: '#2a2726', name: 'wand', mover: { kind: 'slide', axis: 'y', amount: 0.05 } })
      .stick([0, 0.055, 0], [0, 0.03, 0], 0.003, '#d4d7da', { parent: 'wand' })
      .ball([0.007, 0.012, 0.004], [0, 0.026, 0], { color: '#9a1a32', parent: 'wand', edge: F })
      .act({ click: [[A.operate('wand', 'out'), A.say('Pop!', 0.8)], [A.operate('wand', 'in')]] })
      .done(),
  ),
  // A lipstick in its gold case: the black base, the gold sleeve and the red bullet that twists up; the cap
  // stands beside it.
  e('lipstick', 'wardrobe', 'makeup', () =>
    m('lipstick', { edge: S })
      .cyl([0.021, 0.032, 0.021], [0, 0.016, 0], { color: '#2a2726', round: 0.2 })
      .cyl([0.019, 0.022, 0.019], [0, 0.043, 0], { color: 'gold' })
      .cyl([0.014, 0.024, 0.014], [0, 0.05, 0], { color: '#d42a4a', name: 'bullet', edge: F, mover: { kind: 'slide', axis: 'y', amount: 0.016 } })
      .cyl([0.014, 0.012, 0.014], [0, 0.066, 0], { color: '#d42a4a', taper: 0.4, rot: [0, 0, 28], parent: 'bullet', edge: F })
      .cyl([0.022, 0.045, 0.022], [0.035, 0.0225, 0], { color: 'gold', round: 0.2 })
      .torus([0.023, 0.023, 0.004], [0.035, 0.035, 0], { color: '#b8902a', rot: [90, 0, 0] })
      .act({ click: [[A.par(A.operate('bullet', 'up'), A.pose('bullet', { rot: [0, 360, 0], dur: 0.4 }))], [A.par(A.operate('bullet', 'down'), A.pose('bullet', { rot: [0, 0, 0], dur: 0.4 }))]] })
      .done(),
  ),
  // A liquorice wheel (black coil round a pink sweet) and two twists; one twist can be pulled off.
  e('liquorice', 'food', 'sweets', () => {
    const b = m('liquorice');
    b.cyl([0.13, 0.02, 0.13], [0, 0.066, 0], { color: '#2a2726', rot: [90, 0, 0], name: 'wheel', pivot: [0, 0.066, 0] });
    b.each(4, (i) => b.torus([0.125 - i * 0.026, 0.125 - i * 0.026, 0.022], [0, 0.066, 0.002], { color: i % 2 ? '#1c1816' : '#3a3633', tube: 0.14 + i * 0.03, parent: 'wheel' }));
    b.cyl([0.026, 0.024, 0.026], [0, 0.066, 0.004], { color: '#f490b4', rot: [90, 0, 0], parent: 'wheel' })
      .ball([0.012, 0.012, 0.006], [0, 0.066, 0.017], { color: '#4e8fd6', parent: 'wheel' })
      .box([0.12, 0.012, 0.04], [0, 0.006, 0], { color: '#3a3633', round: 0.5 })
      .rod([0.09, 0.012, -0.03], [0.1, 0.15, -0.04], 0.014, '#1c1816', { name: 'twist', piece: true, parent: 'wheel' })
      .rod([0.11, 0.012, -0.01], [0.13, 0.14, -0.02], 0.014, '#c8322a');
    return b.act({ click: [[A.pose('wheel', { rot: [0, 0, 360], dur: 0.8 }), A.detach('twist', 'liquorice twist'), A.say('Chewy!', 1)], [A.reattach('twist')]] }).done();
  }),
  // An anatomical liver: the big right lobe and the smaller left one in deep red, the green gall bladder tucked
  // beneath and the blue and red vessels on top. It gives a healthy squish.
  e('liver', 'clinic', 'organs', () =>
    m('liver')
      .ball([0.22, 0.13, 0.14], [0.04, 0.07, 0], { color: '#8a2b2b', name: 'lobe' })
      .ball([0.15, 0.08, 0.1], [-0.1, 0.085, 0.005], { color: '#9a3333', rot: [0, 0, -14], parent: 'lobe' })
      .ball([0.035, 0.05, 0.035], [0.04, 0.035, 0.065], { color: '#4f9a3a', parent: 'lobe' })
      .rod([0.01, 0.11, -0.01], [0.015, 0.17, -0.02], 0.024, '#4e6fd6', { parent: 'lobe' })
      .rod([-0.02, 0.11, 0.02], [-0.03, 0.16, 0.02], 0.018, '#c8322a', { parent: 'lobe' })
      .box([0.24, 0.012, 0.16], [0, 0.006, 0], { color: '#d4d7da', edge: S })
      .act({ click: [A.par(A.pose('lobe', { scale: 1.08, dur: 0.2 }), A.say('Squish!', 1)), A.pose('lobe', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // A living room cut away: a teal three-seat sofa with soft cushions, a coffee table, a TV on its stand (it
  // switches on), a floor lamp, a rug, a window with curtains, a picture and a plant.
  e('living room', 'places', 'rooms', () => {
    const b = room2('living room', 4.4, 3.8, 2.6, '#c8955a', '#efe4d2', '#f2d6c2');
    b.box([2.4, 0.02, 1.6], [0.1, 0.13, 0.3], { color: '#c84a3a', round: 0.3 })
      .box([2.1, 0.42, 0.9], [-0.6, 0.33, -1.25], { color: '#2f8a84', round: 0.3, edge: F })
      .box([2.1, 0.5, 0.25], [-0.6, 0.75, -1.6], { color: '#2f8a84', round: 0.5, edge: F })
      .each(3, (i) => b.box([0.64, 0.14, 0.72], [-1.27 + i * 0.67, 0.6, -1.18], { color: '#3fa7a0', round: 0.6, edge: F }))
      .pair((s) => b.box([0.22, 0.62, 0.9], [-0.6 + s * 1.12, 0.43, -1.25], { color: '#2f8a84', round: 0.5, edge: F }))
      .box([1.1, 0.06, 0.55], [-0.5, 0.45, 0.2], { color: 'darkwood' })
      .pair((s) => b.box([0.06, 0.32, 0.5], [-0.5 + s * 0.48, 0.28, 0.2], { color: 'darkwood' }))
      .cyl([0.1, 0.1, 0.1], [-0.3, 0.53, 0.2], { color: 'white' })
      .box([1.2, 0.5, 0.42], [1.4, 0.37, -1.55], { color: '#5a3a22' })
      .box([1.2, 0.7, 0.06], [1.4, 1.1, -1.6], { color: '#2a2726' })
      .box([1.1, 0.6, 0.02], [1.4, 1.1, -1.565], { color: '#7ab8e8', name: 'tv', mover: { kind: 'light' } })
      .stick([-1.85, 0.12, 0.6], [-1.85, 1.55, 0.6], 0.04, '#3a3633')
      .cyl([0.3, 0.04, 0.3], [-1.85, 0.14, 0.6], { color: '#3a3633' })
      .ball(0.12, [-1.85, 1.5, 0.6], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .cyl([0.44, 0.32, 0.44], [-1.85, 1.62, 0.6], { color: 'cream', taper: 0.6, edge: F });
    win(b, [0.4, 1.55, -1.76], 1.2, 1.0);
    b.pair((s) => b.box([0.35, 1.5, 0.05], [0.4 + s * 0.85, 1.45, -1.72], { color: '#d64f6a', round: 0.5, edge: F }))
      .box([0.08, 0.7, 0.9], [-2.06, 1.6, -0.2], { color: '#e2b23a' })
      .box([0.04, 0.56, 0.76], [-2.03, 1.6, -0.2], { color: '#7ab8a0' })
      .cyl([0.3, 0.32, 0.3], [1.9, 0.28, 0.9], { color: '#c8643a', taper: 0.8 })
      .ball([0.6, 0.7, 0.6], [1.9, 0.85, 0.9], { color: 'leaf', edge: F })
      .socket('sofa', [-0.6, 0.62, -1.15], 'seat')
      .socket('table', [-0.6, 0.48, 0.2], 'top', { size: 0.4 });
    return b.act({ click: [[A.operate('tv', 'on'), A.operate('lamp', 'on'), A.say('Click!', 1)], [A.operate('tv', 'off'), A.operate('lamp', 'off')]] }).done();
  }),
  // A lobster pot: wooden slats bowed over a timber base, a net funnel at each end, a door, a float on its rope
  // and a lobster inside who snaps when the door opens.
  e('lobster trap', 'sea', 'fishing', () => {
    const b = m('lobster trap', { edge: S });
    b.box([0.9, 0.05, 0.55], [0, 0.025, 0], { color: '#8a6440' })
      .pair((s) => b.box([0.04, 0.34, 0.55], [s * 0.43, 0.2, 0], { color: '#8a6440' }));
    b.each(5, (i) => {
      const a = -60 + i * 30;
      b.box([0.9, 0.03, 0.08], [0, 0.14 + 0.24 * Math.cos(rad(a)), 0.24 * Math.sin(rad(a))], { color: '#c8a870', rot: [a, 0, 0] });
    });
    b.each(3, (i) => b.box([0.9, 0.035, 0.03], [0, 0.08 + i * 0.09, 0.27], { color: '#c8a870' }).box([0.9, 0.035, 0.03], [0, 0.08 + i * 0.09, -0.27], { color: '#c8a870' }))
      .pair((s) => b.cyl([0.24, 0.2, 0.24], [s * 0.33, 0.2, 0], { color: '#3f7a3a', taper: 0.35, rot: [0, 0, s * 90], edge: F }))
      .box([0.3, 0.2, 0.03], [0.05, 0.18, 0.29], { color: '#a8885a', name: 'door', pivot: [0.05, 0.08, 0.29], mover: { kind: 'swing', axis: 'x', amount: 80 } })
      .rod([0.0, 0.38, 0], [0.25, 0.48, -0.2], 0.01, 'tan')
      .capsule([0.12, 0.28, 0.12], [0.3, 0.55, -0.25], { color: '#e0473b', rot: [0, 0, 60], edge: F })
      .capsule([0.124, 0.08, 0.124], [0.3, 0.55, -0.25], { color: 'white', rot: [0, 0, 60], edge: F })
      .socket('inside', [-0.05, 0.06, 0], 'inside', { size: 0.4 });
    return b.act({
      setup: [A.spawn('lob', 'lobster'), A.attach('lob', 'self', 'inside')],
      click: [[A.operate('door', 'open'), A.say('Snap snap!', 1.4, 'self.inside'), A.wait(1.5), A.operate('door', 'close')]],
    }).done();
  }),
  // A bank of three steel school lockers with louvred doors, numbers, lift handles and a combination lock; a
  // door swings open on its hinge, a book inside.
  e('locker', 'study', 'school', () => {
    const b = m('locker', { edge: S });
    b.box([1.0, 1.85, 0.46], [0, 0.95, 0], { color: '#2f5f9a', round: 0.05 })
      .box([1.0, 0.1, 0.46], [0, 0.05, 0], { color: '#1e2a3a' });
    b.each(3, (i) => {
      const x = -0.32 + i * 0.32, n = i === 1 ? 'door' : `panel${i}`;
      b.box([0.3, 1.7, 0.03], [x, 0.97, 0.245], { color: '#4f7fc0', round: 0.1, name: n, ...(i === 1 ? { pivot: [x - 0.15, 0.97, 0.245], mover: { kind: 'swing', axis: 'y', amount: -110 } } : {}) });
      b.each(4, (j) => b.box([0.18, 0.012, 0.02], [x, 1.66 - j * 0.035, 0.265], { color: '#2a4a80', parent: n }));
      b.each(4, (j) => b.box([0.18, 0.012, 0.02], [x, 0.35 - j * 0.035, 0.265], { color: '#2a4a80', parent: n }));
      b.box([0.03, 0.14, 0.04], [x + 0.1, 1.0, 0.275], { color: '#c9ccd1', parent: n })
        .label(`${21 + i}`, [0.08, 0.05], [x, 1.47, 0.265], { color: 'white', depth: 0.005, parent: n });
    });
    b.cyl([0.05, 0.02, 0.05], [0.42, 1.0, 0.29], { color: '#3a3633', rot: [90, 0, 0], parent: 'panel2' })
      .box([0.29, 0.02, 0.4], [0, 1.45, 0.0], { color: '#3a5a8a' })
      .socket('shelf', [0, 1.47, 0.0], 'top', { size: 0.25 })
      .socket('inside', [0, 0.2, 0.0], 'inside', { size: 0.4 });
    return b.act({
      setup: [A.spawn('bk', 'book'), A.attach('bk', 'self', 'shelf')],
      click: [[A.operate('door', 'open'), A.say('Creak...', 1), A.wait(2), A.operate('door', 'close'), A.say('Clang!', 1)]],
    }).done();
  }),
  // A school locker room cut away: a row of blue lockers along the back wall, a long slatted bench on steel legs,
  // a towel, a shower and a sign. A locker slams.
  e('locker room', 'places', 'rooms', () => {
    const b = room2('locker room', 4.4, 3.4, 2.6, '#c8ccd1', '#e8eef2');
    b.each(6, (i) => {
      const x = -1.75 + i * 0.6;
      b.box([0.58, 1.9, 0.48], [x, 1.07, -1.42], { color: i % 2 ? '#2f5f9a' : '#3f6fb0' })
        .each(3, (j) => b.box([0.3, 0.02, 0.02], [x, 1.8 - j * 0.05, -1.17], { color: '#1e3a6a' }))
        .box([0.03, 0.12, 0.03], [x + 0.2, 1.05, -1.17], { color: '#c9ccd1' });
    });
    b.box([0.56, 1.8, 0.03], [1.25, 1.05, -1.16], { color: '#4f7fc0', name: 'door', pivot: [0.97, 1.05, -1.16], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([2.6, 0.06, 0.4], [0.0, 0.47, 0.2], { color: 'wood' })
      .each(3, (i) => b.box([2.6, 0.012, 0.1], [0, 0.505, 0.07 + i * 0.13], { color: '#c8955a', noInk: true }))
      .pair((s) => b.box([0.06, 0.36, 0.34], [s * 1.1, 0.29, 0.2], { color: '#9da3a8' }))
      .box([0.55, 0.05, 0.32], [0.6, 0.52, 0.2], { color: 'white', round: 0.6, edge: F })
      .box([0.06, 2.3, 0.9], [-2.08, 1.3, 0.8], { color: '#c8ccd1' })
      .stick([-1.9, 2.2, 1.0], [-1.7, 2.2, 1.0], 0.04, '#c9ccd1')
      .cyl([0.18, 0.06, 0.18], [-1.65, 2.15, 1.0], { color: '#c9ccd1' })
      .box([1.6, 0.3, 0.04], [-0.3, 2.35, -1.62], { color: '#2f4f8f' })
      .label('LOCKER ROOM', [1.5, 0.24], [-0.3, 2.35, -1.6], { color: '#2f4f8f', depth: 0.01 })
      .socket('bench', [-0.6, 0.5, 0.2], 'seat');
    return b.act({ click: [A.operate('door', 'open'), A.wait(1.5), A.operate('door', 'close'), A.par(A.say('CLANG!', 1.2), A.anim('shake'))] }).done();
  }),
  // An attic loft cut away under its sloping roof: exposed rafters and a skylight that opens, a mezzanine with a
  // bed and a railing on posts, and the ladder up to it.
  e('loft', 'places', 'rooms', () => {
    const b = m('loft', { edge: S });
    b.box([4.4, 0.12, 3.6], [0, 0.06, 0], { color: '#c8955a' })
      .box([4.4, 3.6, 0.14], [0, 1.92, -1.73], { color: '#e8d8c0' })
      .box([0.14, 2.0, 3.6], [-2.13, 1.12, 0], { color: '#f2e6cf' })
      .wedge([3.6, 1.6, 0.14], [-2.13, 2.92, 0], { color: '#f2e6cf', rot: [0, 90, 0], apex: 0.5 })
      .box([4.5, 0.12, 1.95], [0, 3.18, -1.0], { color: '#8a5a35', rot: [34, 0, 0] });
    b.each(5, (i) => b.box([0.12, 0.16, 1.95], [-1.9 + i * 0.95, 3.06, -1.02], { color: '#6b4228', rot: [34, 0, 0] }));
    b.box([0.9, 0.06, 0.8], [0.4, 3.25, -0.96], { color: '#8fbcd8', name: 'skylight', pivot: [0.4, 3.46, -1.29], rot: [34, 0, 0], mover: { kind: 'swing', axis: 'x', amount: -40 } })
      .box([4.4, 0.15, 1.5], [0, 2.1, -0.95], { color: '#7a5230' })
      .pair((s) => b.box([0.12, 2.05, 0.12], [s * 2.0, 1.05, -0.25], { color: '#7a5230' }))
      .box([4.0, 0.06, 0.06], [0, 2.65, -0.24], { color: '#7a5230' })
      .each(7, (i) => b.box([0.04, 0.5, 0.04], [-1.8 + i * 0.6, 2.4, -0.24], { color: '#7a5230' }))
      .box([1.6, 0.25, 0.95], [0.8, 2.3, -1.1], { color: 'white', round: 0.4, edge: F })
      .box([1.1, 0.1, 0.9], [1.0, 2.46, -1.1], { color: '#4e8fd6', round: 0.5, edge: F })
      .box([0.45, 0.12, 0.3], [0.15, 2.5, -1.15], { color: 'white', round: 0.6, edge: F })
      .pair((s) => b.box([0.06, 2.3, 0.06], [-1.0 + s * 0.22, 1.1, 0.25], { color: 'wood', rot: [-22, 0, 0] }))
      .each(6, (i) => b.box([0.44, 0.04, 0.05], [-1.0, 0.35 + i * 0.32, 0.6 - i * 0.13], { color: 'wood' }))
      .box([0.9, 0.5, 0.6], [1.4, 0.37, 0.6], { color: '#c8955a' })
      .socket('bed', [0.8, 2.45, -1.1], 'seat');
    return b.act({ click: [[A.operate('skylight', 'open'), A.say('Creak...', 1.2)], [A.operate('skylight', 'close')]] }).done();
  }),
  // A log cabin 6 m long: round logs stacked with crossed corners, a shingled gable roof, a stone chimney that
  // smokes, a porch on posts, a plank door and four-pane windows, and a lantern by the door.
  e('log cabin', 'places', 'houses', () => {
    const b = m('log cabin', { edge: S }), lg = ['#a0693c', '#946036'];
    b.box([6.0, 0.3, 4.6], [0, 0.15, -0.2], { color: '#8f8c86' })
      .box([5.6, 2.6, 4.0], [0, 1.6, -0.3], { color: '#7a4a2a' });
    b.each(6, (i) => b.cyl([0.44, 6.2, 0.44], [0, 0.52 + i * 0.44, 1.72], { color: lg[i % 2], rot: [0, 0, 90], edge: F }).cyl([0.44, 6.2, 0.44], [0, 0.52 + i * 0.44, -2.32], { color: lg[i % 2], rot: [0, 0, 90], edge: F }));
    b.pair((s) => b.each(6, (i) => b.cyl([0.44, 4.6, 0.44], [s * 2.8, 0.74 + i * 0.44, -0.3], { color: lg[(i + 1) % 2], rot: [90, 0, 0], edge: F })));
    gable(b, 5.6, 4.0, 3.0, 2.0, '#5a3a22', { ridgeX: true, z: -0.3, eave: 0.6 });
    b.box([0.8, 2.6, 0.8], [1.9, 3.8, -1.0], { color: '#a7a7a0', edge: F })
      .box([1.0, 0.2, 1.0], [1.9, 5.15, -1.0], { color: '#8f8c86' })
      .box([5.6, 0.12, 1.6], [0, 0.36, 2.7], { color: '#8a5a35' })
      .pair((s) => b.cyl([0.2, 2.6, 0.2], [s * 2.6, 1.6, 3.35], { color: '#946036' }))
      .box([6.0, 0.12, 1.9], [0, 3.0, 2.75], { color: '#5a3a22', rot: [10, 0, 0] });
    door(b, [0, 0.42, 1.94], 1.0, 2.0, { color: '#6b4228', frame: '#5a3a22' });
    for (const x of [-1.6, 1.6]) win(b, [x, 1.75, 1.94], 0.9, 0.8, { frame: '#5a3a22', glass: '#9cc8e0' });
    lamp(b, 'lantern', 0.2, [0.85, 2.35, 2.1], '#ffd27a');
    return b.act({
      click: [
        [A.par(A.effect('smoke', { dur: 3 }), A.operate('lantern', 'on')), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')],
        [A.operate('lantern', 'off')],
      ],
    }).done();
  }),
  // A swirly lollipop on its stick: a round disc of coloured rings, wrapped in a twist of cellophane; it spins
  // like a hypnotist's wheel.
  e('lollipop', 'food', 'sweets', () => {
    const b = m('lollipop');
    b.stick([0, 0, 0], [0, 0.1, 0], 0.006, 'white', { edge: S })
      .cyl([0.08, 0.02, 0.08], [0, 0.135, 0], { color: '#f4a1c0', rot: [90, 0, 0], name: 'candy', pivot: [0, 0.135, 0] });
    b.each(3, (i) => b.torus([0.072 - i * 0.02, 0.072 - i * 0.02, 0.021], [0, 0.135, 0], { color: ['#d64fa0', '#f6d24a', '#6fd3e8'][i], tube: 0.16 + i * 0.06, parent: 'candy' }));
    return b.act({ click: [A.pose('candy', { rot: [0, 0, 720], dur: 1.2 }), A.pose('candy', { rot: [0, 0, 0], dur: 0 }), A.say('Mmm!', 1)] }).done();
  }),
  // A red union suit of long johns on a hanger: a button front, ribbed cuffs and ankles, and the famous button
  // flap at the back, which drops open when it turns round.
  e('long johns', 'wardrobe', 'underwear', () => {
    const b = m('long johns'), c = '#c8322a', k = '#a82820';
    return b.stick([0, 1.02, 0], [0, 1.08, 0], 0.008, 'silver', { edge: S })
      .arc([0.06, 0.05, 0.008], [0, 1.085, 0], { color: 'silver', arc: 220, edge: S })
      .capsule([0.04, 0.46, 0.04], [0, 0.98, 0], { color: 'wood', rot: [0, 0, 90], edge: S })
      .box([0.4, 0.45, 0.19], [0, 0.74, 0], { color: c, round: 0.4 })
      .box([0.38, 0.18, 0.19], [0, 0.48, 0], { color: c, round: 0.45 })
      .ball([0.44, 0.12, 0.2], [0, 0.94, 0], { color: c })
      .cyl([0.16, 0.04, 0.12], [0, 0.98, 0.02], { color: k })
      .box([0.3, 0.18, 0.02], [0, 0.5, -0.1], { color: k, round: 0.3, name: 'flap', pivot: [0, 0.59, -0.1], mover: { kind: 'swing', axis: 'x', amount: -80 } })
      .pair((s) => b.rod([s * 0.1, 0.44, 0], [s * 0.12, 0.08, 0], 0.13, c).cyl([0.12, 0.06, 0.12], [s * 0.12, 0.04, 0], { color: k }).rod([s * 0.21, 0.92, 0], [s * 0.33, 0.5, 0.02], 0.1, c).cyl([0.09, 0.05, 0.09], [s * 0.34, 0.46, 0.02], { color: k }))
      .each(5, (i) => b.ball(0.022, [0, 0.9 - i * 0.08, 0.098], { color: 'white' }))
      .act({ click: [A.anim('spin'), A.operate('flap', 'open'), A.say('Oops!', 1), A.wait(1), A.operate('flap', 'close')] })
      .done();
  }),
  // A floor loom: the timber frame, the warp threads running from the back beam over the cloth, the harness
  // that lifts, the beater that swings, the shuttle that flies across, and the treadles.
  e('loom', 'workshop', 'crafts', () => {
    const b = m('loom', { edge: S });
    b.pair((s) => b.box([0.08, 1.5, 0.08], [s * 0.62, 0.75, -0.45], { color: 'wood' }).box([0.08, 1.0, 0.08], [s * 0.62, 0.5, 0.45], { color: 'wood' }).box([0.08, 0.08, 0.98], [s * 0.62, 0.9, 0], { color: 'wood' }).box([0.08, 0.08, 0.98], [s * 0.62, 0.12, 0], { color: 'wood' }))
      .box([1.32, 0.1, 0.1], [0, 1.46, -0.45], { color: 'darkwood' })
      .cyl([0.12, 1.24, 0.12], [0, 0.95, -0.42], { color: 'darkwood', rot: [0, 0, 90] })
      .cyl([0.16, 1.24, 0.16], [0, 0.9, 0.45], { color: '#c8322a', rot: [0, 0, 90] })
      .box([1.0, 0.012, 0.6], [0, 0.95, 0.02], { color: '#f2e6cf' })
      .each(10, (i) => b.stick([-0.45 + i * 0.1, 0.96, -0.42], [-0.45 + i * 0.1, 0.96, 0.4], 0.006, '#e8d8b8', { noInk: true }))
      .box([1.0, 0.014, 0.22], [0, 0.957, 0.3], { color: '#4e8fd6' })
      .box([1.0, 0.016, 0.08], [0, 0.96, 0.16], { color: '#c8322a' })
      .box([1.1, 0.3, 0.05], [0, 1.25, -0.2], { color: '#7a5230', name: 'harness', mover: { kind: 'slide', axis: 'y', amount: 0.08 } })
      .each(8, (i) => b.box([0.012, 0.26, 0.012], [-0.42 + i * 0.12, 1.25, -0.17], { color: '#d4d7da', parent: 'harness' }))
      .box([1.16, 0.06, 0.08], [0, 1.25, 0.22], { color: '#7a5230', name: 'beater', pivot: [0, 0.3, 0.22] })
      .pair((s) => b.box([0.05, 0.9, 0.05], [s * 0.56, 0.78, 0.22], { color: '#7a5230', parent: 'beater' }))
      .box([0.9, 0.18, 0.02], [0, 1.02, 0.22], { color: '#c9ccd1', parent: 'beater' })
      .capsule([0.035, 0.26, 0.04], [-0.3, 0.98, 0.08], { color: 'lightwood', rot: [0, 0, 90], name: 'shuttle' })
      .each(3, (i) => b.box([0.08, 0.03, 0.5], [-0.2 + i * 0.2, 0.06, 0.1], { color: 'wood' }));
    return b.act({
      click: [A.operate('harness', 'up'), A.pose('shuttle', { move: [0.6, 0, 0], dur: 0.5 }), A.pose('beater', { rot: [-12, 0, 0], dur: 0.2 }), A.pose('beater', { rot: [0, 0, 0], dur: 0.2 }), A.operate('harness', 'down'), A.pose('shuttle', { move: [0, 0, 0], dur: 0.5 }), A.say('Clack clack', 1.2)],
    }).done();
  }),
  // A pump bottle of hand lotion: the moulded bottle with its label, the pump head that presses down, and a
  // dollop that appears.
  e('lotion', 'home', 'toiletries', () =>
    m('lotion')
      .box([0.075, 0.15, 0.05], [0, 0.075, 0], { color: '#fff3d6', round: 0.6 })
      .box([0.077, 0.07, 0.052], [0, 0.07, 0], { color: '#3fa7a0', round: 0.6, noInk: true })
      .ball([0.03, 0.02, 0.006], [0, 0.07, 0.027], { color: 'white', noInk: true })
      .cyl([0.032, 0.014, 0.032], [0, 0.157, 0], { color: 'white', edge: S })
      .stick([0, 0.16, 0], [0, 0.19, 0], 0.01, 'white', { name: 'pump', edge: S, mover: { kind: 'slide', axis: 'y', amount: -0.015 } })
      .box([0.024, 0.016, 0.024], [0, 0.197, 0], { color: 'white', parent: 'pump', edge: S })
      .stick([0, 0.197, 0.01], [0, 0.197, 0.034], 0.007, 'white', { parent: 'pump', edge: S })
      .ball([0.018, 0.012, 0.018], [0, 0.006, 0.06], { color: '#fbf9f2', name: 'dollop', scale: 0 })
      .act({ click: [A.operate('pump', 'down'), A.par(A.pose('dollop', { scale: 1, dur: 0.2 }), A.say('Squirt!', 1)), A.operate('pump', 'up'), A.wait(1.5), A.pose('dollop', { scale: 0, dur: 0.4 })] })
      .done(),
  ),
  // A scratch-off lottery ticket at its real size in a little stand: three silver panels scratch away to show
  // three stars. A winner!
  e('lottery ticket', 'toys', 'games', () => {
    const b = m('lottery ticket', { edge: S });
    b.box([0.07, 0.006, 0.03], [0, 0.003, 0], { color: '#9da3a8' })
      .box([0.1, 0.07, 0.002], [0, 0.04, 0], { color: '#f6d24a', round: 0.3 })
      .box([0.1, 0.016, 0.0006], [0, 0.068, 0.0012], { color: '#e0473b', noInk: true })
      .label('LUCKY 7', [0.06, 0.011], [0, 0.068, 0.0016], { color: '#e0473b', depth: 0.0004 })
      .each(3, (i) => {
        b.star(0.018, [-0.03 + i * 0.03, 0.036, 0.0014], { color: '#e0473b', round: 0.0006 });
        b.box([0.024, 0.024, 0.0008], [-0.03 + i * 0.03, 0.036, 0.0022], { color: '#c9ccd1', name: `foil${i}` });
      })
      .label('$100', [0.04, 0.008], [0, 0.016, 0.0016], { color: '#f6d24a', depth: 0.0004 });
    const scratch = (k: number) => A.par(A.pose('foil0', { scale: k, dur: 0.3 }), A.pose('foil1', { scale: k, dur: 0.6 }), A.pose('foil2', { scale: k, dur: 0.9 }));
    return b.act({ click: [[scratch(0), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Ding ding ding!', 1.5))], [scratch(1)]] }).done();
  }),
  // A sacred lotus in its pond: round pads on the water and a pink flower on a tall stalk, with a seed pod in
  // its middle; the bloom opens wide.
  e('lotus', 'garden', 'flowers', () => {
    const b = m('lotus');
    b.cyl([1.4, 0.06, 1.2], [0, 0.03, 0], { color: '#4f9bd6' })
      .cyl([1.5, 0.05, 1.3], [0, 0.02, 0], { color: '#7a5a3a' })
      .cyl([0.45, 0.012, 0.45], [-0.3, 0.07, 0.15], { color: '#4f8a42' })
      .cyl([0.36, 0.012, 0.36], [0.35, 0.07, -0.2], { color: '#3f7a3a' })
      .stick([-0.3, 0.06, 0.15], [-0.3, 0.08, 0.15], 0.012, '#4f8a42')
      .stick([0, 0.06, 0], [0.02, 0.62, 0.02], 0.016, '#5a9a4a')
      .cyl([0.06, 0.04, 0.06], [0.02, 0.68, 0.02], { color: '#f6d24a', taper: 1.3, name: 'head', pivot: [0.02, 0.64, 0.02] });
    around(8, 0.075).forEach(([x, z], i) => b.ball([0.08, 0.16, 0.035], [0.02 + x, 0.71, 0.02 + z], { color: '#f490b4', rot: [32, 90 - i * 45, 0], parent: 'head' }));
    around(6, 0.045, 0.5).forEach(([x, z], i) => b.ball([0.065, 0.14, 0.03], [0.02 + x, 0.73, 0.02 + z], { color: '#fbc8dc', rot: [14, 90 - i * 60 - 28.6, 0], parent: 'head' }));
    return b.act({ click: [A.par(A.pose('head', { scale: 1.3, dur: 1 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1.5), A.pose('head', { scale: 1, dur: 1 })] }).done();
  }),
  // A poolside chaise longue: a white aluminium frame on legs with little wheels, a padded striped cushion and a
  // back that reclines in steps.
  e('lounge chair', 'home', 'outdoor furniture', () => {
    const b = m('lounge chair', { view: 'side', edge: S });
    b.pair((s) => {
      b.box([0.04, 0.05, 1.95], [s * 0.33, 0.32, -0.05], { color: 'white' })
        .box([0.04, 0.3, 0.04], [s * 0.33, 0.15, 0.85], { color: 'white' })
        .box([0.04, 0.3, 0.04], [s * 0.33, 0.15, -0.88], { color: 'white' });
      tyre(b, s > 0 ? 'wheel1' : 'wheel2', [s * 0.36, 0.06, -0.92], 0.12, 0.04);
    });
    b.box([0.64, 0.04, 1.2], [0, 0.36, 0.33], { color: 'white' })
      .box([0.62, 0.08, 1.2], [0, 0.42, 0.33], { color: '#6fb8e8', round: 0.5, edge: F })
      .each(4, (i) => b.box([0.63, 0.082, 0.1], [0, 0.42, -0.1 + i * 0.3], { color: 'white', noInk: true, round: 0.5, edge: F }))
      .box([0.64, 0.04, 0.78], [0, 0.36, -0.66], { color: 'white', name: 'back', pivot: [0, 0.36, -0.27], mover: { kind: 'swing', axis: 'x', amount: 55 } })
      .box([0.62, 0.08, 0.78], [0, 0.42, -0.66], { color: '#6fb8e8', round: 0.5, edge: F, parent: 'back' })
      .each(2, (i) => b.box([0.63, 0.082, 0.1], [0, 0.42, -0.5 - i * 0.3], { color: 'white', noInk: true, round: 0.5, edge: F, parent: 'back' }))
      .box([0.5, 0.1, 0.24], [0, 0.5, -0.92], { color: '#f7f5ef', round: 0.6, edge: F, parent: 'back' })
      .socket('seat', [0, 0.46, 0.1], 'seat');
    return b.act({ click: [[A.operate('back', 'up'), A.say('Click click', 1)], [A.operate('back', 'down'), A.say('Ahh...', 1)]] }).done();
  }),
  // A love potion in a heart-shaped flask of pink glass, glowing, with a cork that pops out in a burst of hearts
  // and a red ribbon round the neck.
  e('love potion', 'fantasy', 'potions', () => {
    const b = m('love potion');
    b.pair((s) => b.ball([0.08, 0.08, 0.06], [s * 0.032, 0.085, 0], { color: '#f06aa8', glow: true }))
      .cone([0.13, 0.09, 0.06], [0, 0.04, 0], { color: '#f06aa8', rot: [180, 0, 0], glow: true })
      .cyl([0.026, 0.05, 0.026], [0, 0.14, 0], { color: '#f7c6dc', edge: S, name: 'neck' })
      .torus([0.04, 0.04, 0.01], [0, 0.135, 0], { color: '#d23a2e', rot: [90, 0, 0], tube: 0.25 })
      .ball([0.02, 0.012, 0.008], [0.02, 0.13, 0.015], { color: '#d23a2e' })
      .cyl([0.03, 0.026, 0.03], [0, 0.175, 0], { color: 'wood', taper: 1.15, name: 'cork', piece: true, parent: 'neck' })
      .ball([0.02, 0.03, 0.006], [0.025, 0.1, 0.032], { color: 'white', noInk: true });
    return b.act({ click: [[A.par(A.detach('cork', 'cork'), A.effect('hearts', { dur: 2 }), A.say('Pop!', 1))], [A.reattach('cork')]] }).done();
  }),
  // The Apollo lunar module at its real size, 7 m tall on legs 9 m apart: the gold-foil descent stage on four
  // legs with footpads and the engine bell, a ladder, and the angular grey ascent stage with its windows, hatch,
  // thruster quads and dish. The ascent stage lifts off.
  e('lunar lander', 'garage', 'spacecraft', () => {
    const b = m('lunar lander', { edge: S });
    b.prism([4.2, 1.7, 4.2], [0, 2.35, 0], 8, { color: '#d9a83a', round: 0.05, name: 'descent' })
      .prism([4.25, 0.12, 4.25], [0, 3.22, 0], 8, { color: '#2a2726', parent: 'descent' })
      .cone([1.6, 1.0, 1.6], [0, 1.15, 0], { color: '#5c6166', taper: 0.45, parent: 'descent' });
    around(4, 4.4, Math.PI / 4).forEach(([x, z]) => {
      b.rod([x * 0.42, 2.9, z * 0.42], [x, 0.3, z], 0.16, '#c9ccd1', { parent: 'descent' })
        .rod([x * 0.45, 1.6, z * 0.45], [x * 0.85, 0.6, z * 0.85], 0.08, '#c9ccd1', { parent: 'descent' })
        .cyl([0.9, 0.18, 0.9], [x, 0.09, z], { color: '#c9ccd1', taper: 0.7, parent: 'descent' });
    });
    b.each(7, (i) => b.box([0.5, 0.05, 0.06], [0, 0.6 + i * 0.3, 2.35], { color: '#c9ccd1', parent: 'descent' }))
      .pair((s) => b.box([0.06, 2.2, 0.06], [s * 0.25, 1.5, 2.35], { color: '#c9ccd1', parent: 'descent' }))
      .box([2.8, 1.9, 2.6], [0, 4.25, -0.15], { color: '#c9ccd1', round: 0.08, name: 'ascent' })
      .box([2.2, 1.3, 1.2], [0, 4.4, 1.15], { color: '#d4d7da', round: 0.1, parent: 'ascent' })
      .pair((s) => b.box([0.55, 0.45, 0.08], [s * 0.55, 4.7, 1.76], { color: '#1e2a3a', rot: [0, 0, s * 18], parent: 'ascent' }))
      .box([0.9, 0.9, 0.08], [0, 3.85, 1.76], { color: '#9da3a8', parent: 'ascent', name: 'hatch', pivot: [0.45, 3.85, 1.8], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .cyl([0.9, 0.4, 0.9], [0, 5.4, -0.3], { color: '#9da3a8', parent: 'ascent' })
      .stick([1.0, 5.0, -0.8], [1.6, 5.9, -1.0], 0.07, '#c9ccd1', { parent: 'ascent' })
      .cyl([0.9, 0.2, 0.9], [1.7, 6.0, -1.05], { color: 'white', taper: 0.25, rot: [150, 0, 20], parent: 'ascent' });
    around(4, 2.0, Math.PI / 4).forEach(([x, z]) => b.box([0.3, 0.3, 0.3], [x, 4.8, z - 0.15], { color: '#5c6166', parent: 'ascent' }).cone([0.12, 0.25, 0.12], [x * 1.12, 4.8, z * 1.12 - 0.15], { color: '#3a3633', rot: [0, 0, x > 0 ? -90 : 90], parent: 'ascent' }));
    return b.act({
      click: [
        [A.par(A.effect('fire', { dur: 2 }), A.effect('dust', { dur: 2 }), A.say('FWOOOSH!', 1.5)), A.pose('ascent', { move: [0, 4, 0], dur: 2.5 })],
        [A.pose('ascent', { move: [0, 0, 0], dur: 2.5 }), A.effect('dust', { dur: 1.5 }), A.operate('hatch', 'open'), A.wait(1.5), A.operate('hatch', 'close')],
      ],
    }).done();
  }),
  // The lunar roving vehicle 3.1 m long: an open aluminium chassis on four wire-mesh wheels under gold fenders,
  // two folding seats, the T-handle console, the TV camera and the umbrella-like high-gain antenna.
  e('lunar rover', 'garage', 'spacecraft', () => {
    const b = m('lunar rover', { view: 'side', edge: S });
    b.box([1.3, 0.1, 2.6], [0, 0.72, 0], { color: '#c9ccd1', round: 0.2 })
      .box([1.2, 0.3, 0.6], [0, 0.88, 1.15], { color: '#d4d7da', round: 0.15 })
      .box([1.2, 0.25, 0.5], [0, 0.86, -1.1], { color: '#9da3a8', round: 0.15 })
      .pair((s) => {
        b.box([0.5, 0.06, 0.5], [s * 0.32, 0.8, -0.1], { color: '#7a8a9a' }).box([0.5, 0.5, 0.06], [s * 0.32, 1.06, -0.36], { color: '#7a8a9a', rot: [-10, 0, 0] });
        for (const z of [1.0, -1.0]) b.box([0.36, 0.05, 0.9], [s * 0.95, 0.98, z], { color: '#d9a83a', round: 0.5, rot: [0, 0, s * -12] });
      })
      .socket('seat', [0.32, 0.84, -0.1], 'seat')
      .socket('seat2', [-0.32, 0.84, -0.1], 'seat')
      .stick([0, 0.78, 0.35], [0, 1.25, 0.4], 0.06, '#5c6166')
      .box([0.5, 0.35, 0.08], [0, 1.3, 0.42], { color: '#3a3633', rot: [-20, 0, 0] })
      .stick([0, 1.0, 0.15], [0, 1.15, 0.15], 0.04, '#2a2726')
      .box([0.14, 0.04, 0.04], [0, 1.16, 0.15], { color: '#2a2726' })
      .stick([0.3, 0.95, 1.3], [0.3, 1.45, 1.3], 0.04, '#c9ccd1')
      .box([0.18, 0.16, 0.28], [0.3, 1.52, 1.32], { color: '#d9a83a' })
      .stick([-0.35, 0.95, 1.3], [-0.35, 1.8, 1.3], 0.04, '#c9ccd1')
      .cone([1.0, 0.3, 1.0], [-0.35, 1.9, 1.3], { color: 'white', rot: [180, 0, 0], name: 'antenna', pivot: [-0.35, 1.8, 1.3], edge: F });
    let n = 1;
    for (const z of [1.0, -1.0]) b.pair((s) => tyre(b, `wheel${n++}`, [s * 0.95, 0.41, z], 0.82, 0.24, '#d9a83a'));
    const roll = (k: number) => A.par(...[1, 2, 3, 4].map((i) => A.pose(`wheel${i}`, { spin: [k, 0, 0] })));
    return b.act({
      click: [
        [roll(240), A.par(A.effect('dust', { dur: 2.5 }), A.pose('antenna', { rot: [0, 120, 0], dur: 2 }), A.say('Beep beep!', 1.4)), roll(0)],
        [A.pose('antenna', { rot: [0, 0, 0], dur: 1.5 }), A.say('Kssht... over.', 1.5)],
      ],
    }).done();
  }),
  // A tin lunchbox with a hinged domed lid, a carry handle, two latches and a rocket decal; a sandwich waits
  // inside.
  e('lunchbox', 'kitchen', 'lunch', () => {
    const b = m('lunchbox', { edge: S });
    b.box([0.24, 0.13, 0.11], [0, 0.065, 0], { color: '#e0473b', round: 0.25 })
      .box([0.242, 0.04, 0.112], [0, 0.15, 0], { color: '#c8322a', round: 0.5, name: 'lid', pivot: [0, 0.13, -0.056], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .arc([0.11, 0.08, 0.02], [0, 0.17, 0], { color: '#2a2726', tube: 0.22, parent: 'lid' })
      .pair((s) => b.box([0.025, 0.035, 0.01], [s * 0.075, 0.125, 0.058], { color: '#c9ccd1' }))
      .box([0.12, 0.08, 0.004], [0, 0.06, 0.056], { color: '#2f4f8f', round: 0.3 })
      .cone([0.03, 0.06, 0.004], [0, 0.065, 0.059], { color: 'white', rot: [0, 0, -30], edge: F })
      .star(0.02, [0.04, 0.08, 0.059], { color: '#f6d24a', round: 0.003 })
      .socket('inside', [0, 0.04, 0], 'inside', { size: 0.2 });
    return b.act({
      setup: [A.spawn('sw', 'sandwich'), A.attach('sw', 'self', 'inside')],
      click: [[A.operate('lid', 'open'), A.say('Click!', 1)], [A.operate('lid', 'close'), A.say('Clack', 0.8)]],
    }).done();
  }),
  // A pair of lungs with the windpipe and its rings branching into them; they breathe in and out.
  e('lung', 'clinic', 'organs', () => {
    const b = m('lung'), p = '#f08a9a';
    b.box([0.26, 0.012, 0.14], [0, 0.006, 0], { color: '#d4d7da', edge: S });
    b.pair((s) => b.ball([0.11, 0.21, 0.1], [s * 0.065, 0.125, 0], { color: p, name: s > 0 ? 'lungL' : 'lungR' }).rod([0, 0.2, 0], [s * 0.05, 0.16, 0.01], 0.02, '#f4c0c8'));
    b.cyl([0.026, 0.09, 0.026], [0, 0.25, 0], { color: '#f4c0c8' })
      .each(4, (i) => b.torus([0.03, 0.03, 0.007], [0, 0.215 + i * 0.02, 0], { color: '#e8a0b0', rot: [90, 0, 0], tube: 0.25 }));
    const breathe = (k: number, d: number) => A.par(A.pose('lungL', { scale: k, dur: d }), A.pose('lungR', { scale: k, dur: d }));
    return b.act({ click: [A.par(breathe(1.12, 1.2), A.say('Hhhhh...', 1.2)), A.par(breathe(1, 1.2), A.say('...haaah', 1.2))] }).done();
  }),
  // A blue enamel dish of baked macaroni and cheese: golden crust, macaroni tubes and a fork; it steams.
  e('macaroni and cheese', 'food', 'meals', () => {
    const b = m('macaroni and cheese');
    b.cyl([0.18, 0.06, 0.18], [0, 0.03, 0], { color: '#2f6fc8', taper: 1.25, edge: S })
      .torus([0.225, 0.225, 0.015], [0, 0.06, 0], { color: '#2f6fc8', rot: [90, 0, 0], tube: 0.08, edge: S })
      .ball([0.2, 0.05, 0.2], [0, 0.058, 0], { color: '#f6c445' })
      .ball([0.12, 0.03, 0.1], [0.03, 0.078, -0.02], { color: '#e8a83a', noInk: true });
    around(9, 0.06).forEach(([x, z], i) => b.torus([0.026, 0.026, 0.014], [x, 0.082, z], { color: '#f6b83a', rot: [70 + i * 13, i * 40, 0], tube: 0.32 }));
    b.stick([0.03, 0.08, 0.02], [0.1, 0.16, 0.08], 0.008, '#c9ccd1', { edge: S })
      .box([0.03, 0.004, 0.035], [0.025, 0.075, 0.015], { color: '#c9ccd1', rot: [0, 45, 0], edge: S });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Mmm!', 1.2))] }).done();
  }),
  // A flanged mace on a weapon stand: the leather grip and steel shaft, a head of seven flanges and a spike;
  // it lifts and swings.
  e('mace (weapon)', 'armory', 'medieval weapons', () => {
    const b = m('mace (weapon)', { edge: S });
    b.box([0.3, 0.04, 0.2], [0, 0.02, 0], { color: 'darkwood' })
      .box([0.04, 0.3, 0.04], [0, 0.17, -0.06], { color: 'darkwood' })
      .box([0.12, 0.03, 0.06], [0, 0.31, -0.03], { color: 'darkwood' })
      .ball(0.045, [0, 0.07, 0], { color: 'iron', name: 'mace', pivot: [0, 0.05, 0] })
      .stick([0, 0.07, 0], [0, 0.6, 0], 0.032, '#8f99a3', { parent: 'mace' })
      .cyl([0.042, 0.18, 0.042], [0, 0.18, 0], { color: 'leather', parent: 'mace', edge: F })
      .cyl([0.085, 0.16, 0.085], [0, 0.66, 0], { color: 'iron', parent: 'mace' })
      .cone([0.05, 0.1, 0.05], [0, 0.79, 0], { color: '#8f99a3', parent: 'mace' });
    around(7, 0.055).forEach(([x, z], i) => b.box([0.012, 0.17, 0.06], [x, 0.66, z], { color: '#8f99a3', rot: [0, 90 - (i * 360) / 7, 0], parent: 'mace' }));
    return b.act({ click: [A.pose('mace', { rot: [0, 0, 35], dur: 0.3 }), A.par(A.pose('mace', { rot: [0, 0, -30], dur: 0.25 }), A.say('Whoosh!', 0.8)), A.pose('mace', { rot: [0, 0, 0], dur: 0.3 }), A.say('Clang!', 0.8)] }).done();
  }),
  // A machete stuck in a chopping stump: the broad steel blade, the black grip with its rivets and lanyard hole.
  // It is pulled out, and goes back in with a thunk.
  e('machete', 'armory', 'blades', () => {
    const b = m('machete');
    b.cyl([0.36, 0.3, 0.36], [0, 0.15, 0], { color: '#8a6440', segs: 14, edge: S })
      .cyl([0.32, 0.01, 0.32], [0, 0.302, 0], { color: '#d8b07a', edge: S })
      .each(3, (i) => b.torus([0.08 + i * 0.07, 0.08 + i * 0.07, 0.004], [0, 0.306, 0], { color: '#b8905a', rot: [90, 0, 0], tube: 0.05, noInk: true }))
      .box([0.06, 0.42, 0.006], [0, 0.42, 0], { color: '#d4d7da', round: 0.1, edge: S, name: 'blade', mover: { kind: 'slide', axis: 'y', amount: 0.18 } })
      .ball([0.08, 0.14, 0.006], [0.012, 0.3, 0], { color: '#d4d7da', parent: 'blade', edge: S })
      .box([0.012, 0.42, 0.007], [0.024, 0.42, 0], { color: '#eef0f2', parent: 'blade', noInk: true, edge: S })
      .box([0.07, 0.016, 0.03], [0, 0.636, 0], { color: '#3a3633', parent: 'blade', edge: S })
      .capsule([0.04, 0.15, 0.032], [0, 0.72, 0], { color: '#2a2726', parent: 'blade' })
      .each(2, (i) => b.cyl([0.012, 0.036, 0.012], [0, 0.69 + i * 0.05, 0], { color: '#c9ccd1', rot: [90, 0, 0], parent: 'blade', edge: S }))
      .torus([0.018, 0.018, 0.036], [0, 0.785, 0], { color: '#2a2726', parent: 'blade' });
    return b.act({ click: [[A.operate('blade', 'up'), A.say('Shing!', 1)], [A.operate('blade', 'down'), A.par(A.say('Thunk!', 1), A.effect('dust', { dur: 0.6 }))]] }).done();
  }),
  // A water-cooled heavy machine gun on its tripod: the ribbed barrel jacket, the receiver with spade grips, the
  // ammunition belt from its box; it fires a noisy burst.
  e('machine gun', 'armory', 'guns', () => {
    const b = m('machine gun', { view: 'side', edge: S });
    b.box([0.14, 0.18, 0.4], [0, 0.6, -0.1], { color: '#3a3d40', round: 0.15, name: 'gun', pivot: [0, 0.55, 0] })
      .cyl([0.12, 0.6, 0.12], [0, 0.63, 0.4], { color: '#5c6166', rot: [90, 0, 0], parent: 'gun' })
      .each(6, (i) => b.torus([0.13, 0.13, 0.02], [0, 0.63, 0.15 + i * 0.1], { color: '#3a3d40', parent: 'gun' }))
      .stick([0, 0.63, 0.7], [0, 0.63, 0.86], 0.03, '#2a2726', { parent: 'gun' })
      .cone([0.07, 0.08, 0.07], [0, 0.63, 0.89], { color: '#2a2726', rot: [90, 0, 0], parent: 'gun' })
      .pair((s) => b.rod([s * 0.05, 0.58, -0.3], [s * 0.05, 0.58, -0.42], 0.03, '#5a3a22', { parent: 'gun' }))
      .box([0.2, 0.06, 0.04], [0, 0.72, -0.05], { color: '#2a2726', parent: 'gun' })
      .box([0.18, 0.14, 0.24], [0.2, 0.42, 0.0], { color: '#5a6a3a', round: 0.1 })
      .each(5, (i) => b.box([0.08, 0.02, 0.03], [0.12 - i * 0.035, 0.5 + i * 0.02, -0.01], { color: 'brass', rot: [0, 0, 30], parent: 'gun' }))
      .cyl([0.08, 0.06, 0.08], [0, 0.5, 0], { color: '#3a3d40' })
      .rod([0, 0.48, 0.02], [0, 0.0, 0.55], 0.04, '#3a3d40')
      .pair((s) => b.rod([0, 0.48, -0.02], [s * 0.38, 0.0, -0.4], 0.04, '#3a3d40'));
    return b.act({ click: [A.par(A.pose('gun', { rot: [4, 0, 0], dur: 0.08 }), A.say('Rat-a-tat-tat!', 1.5), A.effect('smoke', { dur: 1.2 }), A.anim('shake', 2)), A.pose('gun', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A glossy magazine standing up: the masthead, a cover photo and headlines; the cover swings open on the spine.
  e('magazine (reading)', 'study', 'books', () =>
    m('magazine (reading)', { edge: S })
      .box([0.21, 0.28, 0.008], [0, 0.14, -0.004], { color: '#f2f0ea', round: 0.1 })
      .box([0.21, 0.28, 0.002], [0, 0.14, 0.001], { color: '#a8d8f5', round: 0.1, name: 'cover', pivot: [-0.105, 0.14, 0.001], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .label('VOGUE-ISH', [0.19, 0.04], [0, 0.25, 0.0025], { color: '#e0473b', depth: 0.001, parent: 'cover' })
      .ball([0.08, 0.1, 0.002], [0.02, 0.13, 0.0025], { color: '#f0c39f', parent: 'cover', noInk: true })
      .ball([0.1, 0.06, 0.002], [0.02, 0.18, 0.0028], { color: '#5a3a22', parent: 'cover', noInk: true })
      .box([0.12, 0.08, 0.002], [0.02, 0.05, 0.0026], { color: '#d64fa0', parent: 'cover', noInk: true })
      .box([0.07, 0.014, 0.002], [-0.06, 0.09, 0.003], { color: '#f6d24a', parent: 'cover', noInk: true })
      .box([0.06, 0.01, 0.002], [-0.065, 0.065, 0.003], { color: 'white', parent: 'cover', noInk: true })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip!', 0.8)], [A.operate('cover', 'close')]] })
      .done(),
  ),
  // A magic bean, green and glowing with gold sparkles; click it and a beanstalk shoots up (and shrinks back).
  e('magic bean', 'fantasy', 'magic items', () =>
    m('magic bean')
      .ball([0.05, 0.03, 0.032], [0, 0.016, 0], { color: '#4fc06a', rot: [0, 0, 10], glow: true })
      .ball([0.016, 0.01, 0.008], [-0.01, 0.022, 0.015], { color: '#9be8a8', noInk: true })
      .ball([0.008, 0.006, 0.004], [0.014, 0.012, 0.014], { color: '#2f7a3a', noInk: true })
      .star(0.02, [-0.03, 0.05, 0.01], { color: 'gold', glow: true })
      .star(0.014, [0.03, 0.04, 0.0], { color: 'gold', glow: true })
      .capsule([0.03, 0.9, 0.03], [0.0, 0.47, 0], { color: '#5aa553', name: 'stalk', scale: 0 })
      .ball([0.16, 0.08, 0.02], [0.08, 0.5, 0], { color: '#4f9a3a', name: 'leaf1', scale: 0, rot: [0, 0, 20] })
      .ball([0.16, 0.08, 0.02], [-0.08, 0.75, 0], { color: '#4f9a3a', name: 'leaf2', scale: 0, rot: [0, 0, -20] })
      .act({
        click: [
          [A.par(A.effect('sparkle', { dur: 1.5 }), A.pose('stalk', { scale: 1, dur: 1.2 }), A.pose('leaf1', { scale: 1, dur: 1.2 }), A.pose('leaf2', { scale: 1, dur: 1.2 })), A.say('Fwoosh!', 1.2)],
          [A.par(A.pose('stalk', { scale: 0, dur: 0.8 }), A.pose('leaf1', { scale: 0, dur: 0.8 }), A.pose('leaf2', { scale: 0, dur: 0.8 }))],
        ],
      })
      .done(),
  ),
  // A witch's broomstick floating at hip height over a few glowing sparkles: a crooked handle, the twig brush
  // bound with cord; it swoops up and loops.
  e('magic broomstick', 'fantasy', 'magic items', () => {
    const b = m('magic broomstick', { view: 'side' });
    b.stick([0, 0.85, -0.45], [0, 1.0, 0.85], 0.04, '#6b4228', { name: 'broom', pivot: [0, 0.9, 0] })
      .rod([0, 1.0, 0.85], [0, 1.06, 0.95], 0.04, '#6b4228', { parent: 'broom' })
      .cone([0.36, 0.7, 0.36], [0, 0.78, -0.78], { color: '#d9b04a', rot: [-80, 0, 0], parent: 'broom' })
      .torus([0.14, 0.14, 0.05], [0, 0.84, -0.48], { color: '#8a5fc4', rot: [0, 0, 0], tube: 0.3, parent: 'broom' })
      .torus([0.18, 0.18, 0.04], [0, 0.82, -0.62], { color: '#8a5fc4', tube: 0.25, parent: 'broom' })
      .star(0.1, [0, 0.45, -0.3], { color: 'gold', glow: true })
      .star(0.07, [0, 0.3, -0.6], { color: 'gold', glow: true })
      .star(0.05, [0, 0.18, 0.2], { color: 'gold', glow: true });
    return b.act({ click: [A.par(A.pose('broom', { move: [0, 0.6, 0], rot: [-15, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 1.5 }), A.say('Whoosh!', 1)), A.pose('broom', { rot: [-375, 0, 0], dur: 1 }), A.pose('broom', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A flying carpet 2.4 m long hovering half a metre up: a red Persian rug with a gold border, a blue medallion
  // and tassels; it ripples and rises. (The vocabulary's 3 m is its length; it floats 0.6 m high.)
  e('magic carpet', 'fantasy', 'magic items', () => {
    const b = m('magic carpet');
    const segs = 4, L = 2.4, sl = L / segs;
    for (let i = 0; i < segs; i++) {
      const z = -L / 2 + sl * (i + 0.5), n = `seg${i}`;
      b.box([1.5, 0.04, sl + 0.01], [0, 0.55, z], { color: '#a3322a', round: 0.3, name: n, ...(i ? { parent: `seg${i - 1}`, pivot: [0, 0.55, z - sl / 2] as V } : { pivot: [0, 0.55, z] as V }) })
        .box([1.2, 0.045, sl * 0.9], [0, 0.55, z], { color: '#e2b23a', parent: n, noInk: true, round: 0.2 })
        .box([1.0, 0.05, sl * 0.8], [0, 0.55, z], { color: i === 1 || i === 2 ? '#2f4f8f' : '#a3322a', parent: n, noInk: true, round: 0.2 });
    }
    b.ball([0.5, 0.055, 0.5], [0, 0.55, 0], { color: '#e2b23a', parent: 'seg2', noInk: true });
    b.pair((s) => b.each(5, (i) => b.capsule([0.03, 0.1, 0.03], [-0.6 + i * 0.3, 0.55, s * (L / 2 + 0.05)], { color: '#e2b23a', rot: [90, 0, 0], parent: s > 0 ? 'seg3' : 'seg0' })))
      .star(0.08, [0.6, 0.3, 0.5], { color: 'gold', glow: true })
      .star(0.06, [-0.5, 0.2, -0.4], { color: 'gold', glow: true })
      .socket('seat', [0, 0.58, 0], 'seat');
    const wave = (a: number) => A.par(A.pose('seg1', { rot: [a, 0, 0], dur: 0.35 }), A.pose('seg2', { rot: [-a, 0, 0], dur: 0.35 }), A.pose('seg3', { rot: [a, 0, 0], dur: 0.35 }));
    return b.act({ click: [A.par(wave(8), A.pose('seg0', { move: [0, 0.4, 0], dur: 0.7 }), A.effect('sparkle', { dur: 2 })), wave(-8), wave(8), A.par(wave(0), A.pose('seg0', { move: [0, 0, 0], dur: 0.7 }))] }).done();
  }),
  // A magician's black top hat set upside down, brim and red band up round its open crown; a rabbit pops out of
  // it, and next time a dove flies out.
  e('magicians hat', 'toys', 'magic tricks', () =>
    m('magicians hat')
      .cyl([0.2, 0.17, 0.2], [0, 0.085, 0], { color: '#2a2726', taper: 1.05, name: 'crown' })
      .cyl([0.212, 0.04, 0.212], [0, 0.15, 0], { color: '#c8322a', taper: 1.01, parent: 'crown' })
      .cyl([0.34, 0.012, 0.34], [0, 0.18, 0], { color: '#2a2726', edge: S, parent: 'crown' })
      .torus([0.345, 0.345, 0.014], [0, 0.183, 0], { color: '#2a2726', rot: [90, 0, 0], tube: 0.06, parent: 'crown' })
      .cyl([0.19, 0.006, 0.19], [0, 0.186, 0], { color: '#1a1716', parent: 'crown' })
      .socket('top', [0, 0.19, 0], 'top', { size: 0.4 })
      .act({
        click: [
          [A.effect('sparkle', { dur: 1 }), A.spawn('rb', 'rabbit', { rel: 'on', of: 'self' }), A.attach('rb', 'self', 'top'), A.say('Ta-da!', 1.5), A.wait(1.5), A.remove('rb', 'pop')],
          [A.effect('sparkle', { dur: 1 }), A.spawn('dv', 'dove', { rel: 'above', of: 'self', dist: 'close' }), A.move('dv', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('dv', 'fade')],
        ],
      })
      .done(),
  ),
  // A red horseshoe magnet with silver poles; it pulls a nail across and holds it with a clink.
  e('magnet', 'study', 'science', () => {
    const b = m('magnet', { edge: S });
    b.arc([0.09, 0.09, 0.025], [0, 0.045, 0], { color: '#e0473b', rot: [0, 0, 180], tube: 0.38 });
    b.pair((s) => b.box([0.026, 0.05, 0.025], [s * 0.0285, 0.07, 0], { color: '#e0473b', round: 0.2 }).box([0.026, 0.022, 0.025], [s * 0.0285, 0.105, 0], { color: '#c9ccd1', round: 0.2 }));
    return b.act({ click: [A.spawn('n', 'nail', { rel: 'front', of: 'self', dist: 'near' }), A.move('n', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run', style: 'slide' }), A.say('Clink!', 1), A.wait(1), A.remove('n', 'fade')] }).done();
  }),
  // A magnifying glass standing on its handle: the black grip, brass ferrule and rim, and the lens, which
  // swells as if to look closer.
  e('magnifying glass', 'study', 'science', () =>
    m('magnifying glass')
      .capsule([0.024, 0.09, 0.024], [0, 0.045, 0], { color: '#2a2726' })
      .stick([0, 0.088, 0], [0, 0.1, 0], 0.018, 'brass', { edge: S })
      .torus([0.1, 0.1, 0.014], [0, 0.152, 0], { color: 'brass', tube: 0.11, edge: S, name: 'lens', pivot: [0, 0.152, 0] })
      .cyl([0.09, 0.006, 0.09], [0, 0.152, 0], { color: '#bfe3f2', rot: [90, 0, 0], parent: 'lens', edge: S })
      .ball([0.02, 0.02, 0.003], [0.02, 0.17, 0.004], { color: 'white', noInk: true, parent: 'lens' })
      .act({ click: [A.par(A.pose('lens', { scale: 1.4, dur: 0.5 }), A.effect('sparkle', { dur: 1 })), A.say('Zoom!', 1), A.pose('lens', { scale: 1, dur: 0.5 })] })
      .done(),
  ),
  // A rural mailbox on its post: the round-topped tin box with a door that drops open, the red flag that goes
  // up, and a letter waiting inside.
  e('mailbox', 'home', 'outdoor', () =>
    m('mailbox', { edge: S })
      .box([0.1, 1.05, 0.1], [0, 0.525, -0.05], { color: 'wood', round: 0.15 })
      .box([0.24, 0.04, 0.5], [0, 1.07, 0], { color: 'wood' })
      .box([0.2, 0.12, 0.48], [0, 1.15, 0], { color: '#2f4f8f', round: 0.1 })
      .cyl([0.2, 0.48, 0.2], [0, 1.21, 0], { color: '#2f4f8f', rot: [90, 0, 0] })
      .box([0.2, 0.2, 0.02], [0, 1.18, 0.25], { color: '#3a5a9a', round: 0.4, name: 'door', pivot: [0, 1.09, 0.25], mover: { kind: 'swing', axis: 'x', amount: 95 } })
      .box([0.04, 0.02, 0.03], [0, 1.25, 0.265], { color: '#c9ccd1', parent: 'door' })
      .box([0.012, 0.03, 0.22], [0.115, 1.15, -0.09], { color: '#e0473b', name: 'flag', pivot: [0.115, 1.15, -0.2], mover: { kind: 'swing', axis: 'x', amount: -90 } })
      .box([0.012, 0.08, 0.1], [0.115, 1.17, 0.0], { color: '#e0473b', parent: 'flag' })
      .socket('inside', [0, 1.15, 0], 'inside', { size: 0.3 })
      .act({
        setup: [A.spawn('mail', 'letter'), A.attach('mail', 'self', 'inside')],
        click: [[A.operate('door', 'open'), A.operate('flag', 'on'), A.say('Clunk!', 1)], [A.operate('door', 'close'), A.operate('flag', 'off')]],
      })
      .done(),
  ),
  // A roll of mailing labels on its desk dispenser: the roll turns and the next printed label feeds out.
  e('mailing labels', 'study', 'mail', () => {
    const b = m('mailing labels', { edge: S });
    b.box([0.14, 0.02, 0.1], [0, 0.01, 0], { color: '#3a3633', round: 0.3 })
      .pair((s) => b.box([0.01, 0.1, 0.06], [s * 0.06, 0.07, -0.01], { color: '#3a3633', round: 0.3 }))
      .cyl([0.11, 0.1, 0.11], [0, 0.08, -0.01], { color: 'white', rot: [0, 0, 90], name: 'roll', pivot: [0, 0.08, -0.01] })
      .cyl([0.04, 0.104, 0.04], [0, 0.08, -0.01], { color: '#c8955a', rot: [0, 0, 90], parent: 'roll' })
      .box([0.09, 0.002, 0.08], [0, 0.135, 0.03], { color: 'white', rot: [-12, 0, 0] })
      .box([0.07, 0.003, 0.05], [0, 0.138, 0.04], { color: '#fbf6e8', rot: [-12, 0, 0], name: 'label', mover: { kind: 'slide', axis: 'z', amount: 0.05 } })
      .each(3, (i) => b.box([0.05 - i * 0.008, 0.002, 0.004], [-0.005, 0.14 + i * 0.002, 0.03 + i * 0.01], { color: '#3a3633', rot: [-12, 0, 0], parent: 'label', noInk: true }));
    return b.act({ click: [[A.par(A.pose('roll', { rot: [-90, 0, 0], dur: 0.5 }), A.operate('label', 'out')), A.say('Rrrip!', 1)], [A.par(A.pose('roll', { rot: [0, 0, 0], dur: 0.4 }), A.operate('label', 'in'))]] }).done();
  }),
  // A two-storey shopping mall 30 m wide: a glass atrium entrance with sliding doors and a curved glass roof under
  // a big sign that lights, shop fronts with awnings either side, upper windows and rooftop plant.
  e('mall (building)', 'places', 'shops', () => {
    const b = m('mall (building)', { edge: S }), wall = '#e8dcc4';
    b.box([32, 0.2, 22], [0, 0.1, -1], { color: '#9da3a8' })
      .box([30, 9, 18], [0, 4.7, -2], { color: wall, round: 0.01 })
      .box([30.4, 0.5, 18.4], [0, 9.45, -2], { color: '#c8b898' })
      .box([30.1, 0.35, 18.1], [0, 4.6, -2], { color: '#c8b898' })
      .each(3, (i) => b.box([2.5, 1.4, 2], [-8 + i * 8, 10.4, -6], { color: '#9da3a8' }))
      .box([9, 10.5, 3.2], [0, 5.45, 8.4], { color: '#9cc8e0' })
      .each(5, (i) => b.box([0.18, 10.5, 0.2], [-4.4 + i * 2.2, 5.45, 10.02], { color: '#5c6166' }))
      .each(3, (i) => b.box([9, 0.18, 0.2], [0, 3.3 + i * 3, 10.02], { color: '#5c6166' }))
      .dome([9, 2.6, 3.2], [0, 12.0, 8.4], { color: '#9cc8e0' })
      .box([10, 0.4, 2.6], [0, 3.6, 11.2], { color: '#5c6166' })
      .box([5.6, 1.6, 0.3], [0, 12.0, 9.9], { color: '#c8322a', name: 'sign', mover: { kind: 'light' } })
      .label('MALL', [5, 1.3], [0, 12.0, 10.08], { color: '#c8322a', depth: 0.05 })
      .box([1.6, 2.6, 0.1], [-0.8, 1.5, 10.06], { color: '#bfe3f2', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -1.5 } })
      .box([1.6, 2.6, 0.1], [0.8, 1.5, 10.06], { color: '#bfe3f2', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 1.5 } });
    const shops = [['#e0473b', 'SHOES'], ['#3fa7a0', 'BOOKS'], ['#f0923b', 'TOYS'], ['#8a5fc4', 'CAFE']];
    shops.forEach(([c, t], i) => {
      const x = [-12, -7, 7, 12][i];
      b.box([4.2, 3.0, 0.1], [x, 1.8, 7.05], { color: '#9cc8e0' })
        .box([0.15, 3.2, 0.2], [x - 2.15, 1.8, 7.05], { color: '#5c6166' })
        .box([4.6, 0.12, 1.4], [x, 3.6, 7.6], { color: c, rot: [-14, 0, 0] })
        .label(t, [3.2, 0.6], [x, 4.15, 7.07], { color: c, depth: 0.05 });
      b.each(3, (k) => b.box([1.2, 1.8, 0.1], [x - 1.4 + k * 1.4, 7.0, 7.05], { color: '#9cc8e0' }));
    });
    b.pair((s) => b.cyl([1.4, 0.8, 1.4], [s * 6.5, 0.6, 12], { color: '#a7a7a0' }).ball([1.3, 1.2, 1.3], [s * 6.5, 1.5, 12], { color: 'leaf', edge: F }));
    return b.act({
      click: [
        [A.par(A.operate('door', 'open'), A.operate('sign', 'on')), A.say('Ding!', 1.2), A.wait(2.5), A.operate('door', 'close')],
        [A.operate('sign', 'off')],
      ],
    }).done();
  }),
  // A croquet mallet stood head-down beside its ball: the long ash shaft and the striped barrel head. It taps
  // the ball away, and next time the ball rolls back.
  e('mallet', 'workshop', 'hand tools', () =>
    m('mallet')
      .cyl([0.08, 0.24, 0.08], [0, 0.04, 0], { color: 'wood', rot: [0, 0, 90], edge: S, name: 'head', pivot: [0, 0.04, 0] })
      .cyl([0.082, 0.02, 0.082], [0.1, 0.04, 0], { color: '#2f4f8f', rot: [0, 0, 90], parent: 'head', edge: S })
      .cyl([0.082, 0.02, 0.082], [-0.1, 0.04, 0], { color: '#2f4f8f', rot: [0, 0, 90], parent: 'head', edge: S })
      .stick([0, 0.08, 0], [0, 0.9, 0], 0.028, 'lightwood', { parent: 'head' })
      .cyl([0.034, 0.16, 0.034], [0, 0.8, 0], { color: '#2a2726', parent: 'head' })
      .ball(0.09, [0.3, 0.045, 0.1], { color: '#2f6fc8', name: 'ball' })
      .act({ click: [[A.pose('head', { rot: [0, 0, -18], dur: 0.3 }), A.par(A.pose('head', { rot: [0, 0, 0], dur: 0.12 }), A.say('Tock!', 0.8)), A.pose('ball', { move: [0.6, 0, 0], rot: [0, 0, -400], dur: 0.8 })], [A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })]] })
      .done(),
  ),
  // A lion's mane on a sculpted bust: the great ruff of tawny locks round a calm face; it shakes and roars.
  e('mane', 'wild', 'animal parts', () => {
    const b = m('mane');
    b.box([0.3, 0.06, 0.25], [0, 0.03, -0.02], { color: '#5c6166', edge: S })
      .ball([0.42, 0.42, 0.18], [0, 0.3, -0.05], { color: '#a8551e', name: 'mane', pivot: [0, 0.2, -0.05] });
    around(14, 0.17).forEach(([x, y], i) => b.ball([0.12, 0.14, 0.1], [x, 0.3 + y, -0.02], { color: i % 2 ? '#b8642a' : '#94491a', parent: 'mane' }));
    b.ball([0.2, 0.21, 0.15], [0, 0.29, 0.05], { color: '#e2a95a' })
      .ball([0.1, 0.07, 0.07], [0, 0.24, 0.12], { color: '#f2d6a8' })
      .ball([0.045, 0.03, 0.025], [0, 0.27, 0.155], { color: '#5a3a22' })
      .pair((s) => b.ball(0.026, [s * 0.045, 0.32, 0.115], { color: '#2a2726', eye: true }).ball([0.05, 0.05, 0.03], [s * 0.08, 0.4, 0.0], { color: '#e2a95a' }));
    return b.act({ click: [A.par(A.pose('mane', { rot: [0, 0, 8], dur: 0.15 }), A.say('ROAAAR!', 1.5)), A.pose('mane', { rot: [0, 0, -8], dur: 0.15 }), A.pose('mane', { rot: [0, 0, 5], dur: 0.15 }), A.pose('mane', { rot: [0, 0, 0], dur: 0.15 })] }).done();
  }),
  // A ripe mango: a plump kidney-shaped fruit blushing from green to red with a stalk and a leaf; one cheek can be
  // cut off to show the gold flesh.
  e('mango', 'food', 'fruit', () =>
    m('mango')
      .loft([0.09, 0.1, 0.13], [0, 0.05, 0], [[0, 0.4, 0.4], [0.2, 0.85, 0.85], [0.55, 1, 1], [0.85, 0.85, 0.8], [1, 0.3, 0.3]], { color: '#f2a63a', rot: [-80, 0, 15], name: 'body' })
      .ball([0.07, 0.08, 0.05], [-0.015, 0.075, 0.02], { color: '#e0553a', noInk: true, parent: 'body' })
      .ball([0.06, 0.06, 0.04], [0.02, 0.03, 0.018], { color: '#a8c040', noInk: true, parent: 'body' })
      .ball([0.07, 0.09, 0.022], [0.0, 0.05, -0.038], { color: '#f6c445', name: 'cheek', parent: 'body', piece: true })
      .stick([0.012, 0.11, 0], [0.016, 0.13, 0], 0.007, '#5a3a22')
      .ball([0.06, 0.012, 0.025], [0.04, 0.128, 0], { color: 'leaf', rot: [0, 0, -15] })
      .act({ click: [[A.detach('cheek', 'mango cheek'), A.say('Slice!', 1)], [A.reattach('cheek')]] })
      .done(),
  ),
  // A tall glass of thick mango juice with a mango slice on the rim and a green straw; it slurps.
  e('mango juice', 'food', 'drinks', () =>
    m('mango juice')
      .cyl([0.075, 0.16, 0.075], [0, 0.08, 0], { color: '#f6a531', taper: 1.12, name: 'glass' })
      .cyl([0.08, 0.012, 0.08], [0, 0.006, 0], { color: 'glass', edge: S })
      .torus([0.086, 0.086, 0.008], [0, 0.16, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.08, edge: S })
      .ball([0.05, 0.03, 0.024], [0.042, 0.16, 0.0], { color: '#f6c445', rot: [0, 0, 30], name: 'slice', parent: 'glass', piece: true })
      .ball([0.05, 0.03, 0.012], [0.044, 0.162, -0.012], { color: '#7cae3a', rot: [0, 0, 30], parent: 'slice' })
      .stick([0.0, 0.06, 0], [-0.025, 0.22, 0.01], 0.008, '#5aa553', { name: 'straw', pivot: [0, 0.06, 0] })
      .act({ click: [[A.par(A.pose('straw', { rot: [0, 0, -8], dur: 0.3 }), A.say('Slurp!', 1)), A.pose('straw', { rot: [0, 0, 0], dur: 0.3 })], [A.detach('slice', 'mango slice')], [A.reattach('slice')]] })
      .done(),
  ),
  // A mango tree 12 m tall with a broad dense dome of dark leaves and mangoes hanging below it; shake it and one
  // drops.
  e('mango tree', 'garden', 'fruit trees', () => tree2('mango tree', 12, '#2f6a32', { leaf2: '#3f7a3a', fruit: '#f2a63a', fs: 0.13, n: 12, shape: 'wide', bough: 4 }).act(fruitAct()).done()),
  // A patch of mangrove swamp 10 m across: brown water and mud banks, three mangroves standing on arching stilt
  // roots with breathing roots poking up; a crab scuttles out.
  e('mangrove swamp', 'nature', 'wetlands', () => {
    const b = m('mangrove swamp');
    b.cyl([10, 0.12, 8], [0, 0.06, 0], { color: '#5a7a6a' })
      .ball([3.2, 0.3, 2.2], [-3.0, 0.1, 2.0], { color: '#7a5a3a' })
      .ball([2.4, 0.25, 1.8], [3.2, 0.1, -2.2], { color: '#7a5a3a' });
    const mang = (x: number, z: number, h: number) => {
      b.cyl([h * 0.06, h * 0.45, h * 0.06], [x, h * 0.55, z], { color: '#6b5034', taper: 0.7 });
      around(6, h * 0.28, x).forEach(([dx, dz]) => b.rod([x, h * 0.36, z], [x + dx * 0.55, h * 0.26, z + dz * 0.55], h * 0.025, '#6b5034').rod([x + dx * 0.55, h * 0.26, z + dz * 0.55], [x + dx, 0.08, z + dz], h * 0.025, '#6b5034'));
      b.ball([h * 0.62, h * 0.32, h * 0.58], [x, h * 0.86, z], { color: '#3f7a3a' }).ball([h * 0.4, h * 0.24, h * 0.4], [x + h * 0.18, h * 0.96, z - h * 0.1], { color: '#4f8a42' });
    };
    mang(-1.2, -0.6, 6);
    mang(2.4, 1.2, 4.5);
    mang(-3.4, 2.2, 3.5);
    b.each(10, (i) => b.stick([Math.cos(i * 2.3) * (1 + i * 0.35), 0.06, Math.sin(i * 2.3) * (0.8 + i * 0.25)], [Math.cos(i * 2.3) * (1 + i * 0.35), 0.32, Math.sin(i * 2.3) * (0.8 + i * 0.25)], 0.04, '#7a6040'));
    return b.act({ click: [A.spawn('cr', 'crab', { rel: 'front', of: 'self', dist: 'close' }), A.say('Click click!', 1.2, 'cr'), A.move('cr', { rel: 'away', of: 'self', dist: 'near' }, { speed: 'walk', style: 'slide' }), A.remove('cr', 'sink')] }).done();
  }),
  // A manhole in a patch of road: the cast-iron cover with its grid pattern lifts and slides aside in a puff of
  // steam, showing the dark shaft and the top of its ladder; a traffic cone stands by.
  e('manhole', 'places', 'street', () => {
    const b = m('manhole', { edge: S });
    b.box([1.8, 0.06, 1.8], [0, 0.03, 0], { color: '#55595e', round: 0.1 })
      .cyl([0.78, 0.065, 0.78], [0, 0.0325, 0], { color: '#3a3d40' })
      .cyl([0.62, 0.066, 0.62], [0, 0.033, 0], { color: '#141210' })
      .pair((s) => b.box([0.04, 0.02, 0.04], [s * 0.15, 0.066, -0.22], { color: '#8f99a3' }))
      .box([0.34, 0.02, 0.04], [0, 0.066, -0.22], { color: '#8f99a3' })
      .cyl([0.7, 0.04, 0.7], [0, 0.085, 0], { color: '#45484c', name: 'cover', pivot: [0, 0.085, 0] });
    b.each(4, (i) => b.box([0.6 - Math.abs(i - 1.5) * 0.18, 0.012, 0.04], [0, 0.11, -0.18 + i * 0.12], { color: '#5c6166', parent: 'cover', noInk: true }))
      .each(4, (i) => b.box([0.04, 0.012, 0.6 - Math.abs(i - 1.5) * 0.18], [-0.18 + i * 0.12, 0.111, 0], { color: '#5c6166', parent: 'cover', noInk: true }))
      .cone([0.3, 0.55, 0.3], [0.65, 0.3, 0.6], { color: '#f0782a', edge: F })
      .cyl([0.22, 0.09, 0.22], [0.65, 0.25, 0.6], { color: 'white', taper: 0.75, noInk: true, edge: F })
      .box([0.4, 0.03, 0.4], [0.65, 0.015, 0.6], { color: '#2a2726' });
    return b.act({ click: [[A.pose('cover', { move: [0, 0.15, 0], dur: 0.4 }), A.par(A.pose('cover', { move: [-0.75, 0.0, 0.2], dur: 0.6 }), A.effect('steam', { dur: 2.5 })), A.say('Clunk!', 1)], [A.pose('cover', { move: [0, 0.15, 0], dur: 0.6 }), A.pose('cover', { move: [0, 0, 0], dur: 0.3 }), A.say('Clank!', 0.8)]] }).done();
  }),
  // A Georgian manor house 20 m wide: a symmetrical brick front of three storeys, a stone-trimmed central bay
  // with a pediment, a fanlit front door up a flight of steps, sash windows, a slate roof with dormers and tall
  // chimneys. The door opens to the bell.
  e('manor', 'places', 'houses', () => {
    const b = m('manor', { edge: S }), brick = '#b8664a', st = '#efe6d4', slate = '#5c6166';
    b.box([21, 0.4, 11], [0, 0.2, 0], { color: '#a7a7a0' })
      .box([20, 9, 10], [0, 4.9, 0], { color: brick, round: 0.01 })
      .box([20.3, 0.4, 10.3], [0, 9.6, 0], { color: st })
      .box([20.1, 0.25, 10.1], [0, 3.6, 0], { color: st })
      .box([6, 9.4, 0.6], [0, 5.1, 5.2], { color: '#c87a5a' })
      .box([6.4, 0.5, 0.9], [0, 9.8, 5.2], { color: st })
      .wedge([6.6, 1.6, 0.9], [0, 10.85, 5.2], { color: st })
      .pair((s) => b.box([0.5, 9.4, 0.7], [s * 2.9, 5.1, 5.25], { color: st }));
    gable(b, 20, 10, 9.8, 3.6, slate, { ridgeX: true, eave: 0.3 });
    b.pair((s) => {
      b.box([1.4, 4.0, 1.0], [s * 8.5, 12.4, 0], { color: brick }).box([1.6, 0.3, 1.2], [s * 8.5, 14.5, 0], { color: st });
      for (const x of [4.5, 7.5]) b.box([1.2, 1.4, 1.4], [s * x, 11.0, 3.6], { color: slate }).wedge([1.4, 0.6, 1.5], [s * x, 12.0, 3.6], { color: slate }).box([0.7, 0.9, 0.05], [s * x, 11.0, 4.32], { color: '#8fbcd8' });
    });
    b.each(4, (i) => b.box([5 - i * 0.4, 0.2, 1.6 - i * 0.3], [0, 0.5 + i * 0.2, 6.3 - i * 0.15], { color: '#c8c2b4' }));
    door(b, [0, 1.2, 5.5], 1.4, 2.6, { color: '#1e3a2a', frame: st });
    b.arc([1.6, 1.6, 0.1], [0, 3.9, 5.56], { color: '#8fbcd8', tube: 0.45 });
    for (const x of [-8, -5.5, 5.5, 8]) for (const y of [2.0, 5.0, 7.8]) win(b, [x, y, 5.0], 1.1, y > 7 ? 1.3 : 1.8, { frame: st });
    for (const x of [-1.6, 1.6]) for (const y of [5.0, 7.8]) win(b, [x, y, 5.5], 1.0, y > 7 ? 1.2 : 1.7, { frame: st });
    win(b, [0, 5.0, 5.5], 1.0, 1.7, { frame: st });
    b.pair((s) => lamp(b, s > 0 ? 'lampL' : 'lampR', [0.3, 0.45, 0.3], [s * 1.25, 3.0, 5.7], '#ffe9a0'));
    return b.act({ click: [[A.say('Ding-dong!', 1.4), A.par(A.operate('door', 'open'), A.operate('lamp', 'on')), A.wait(2.5), A.operate('door', 'close')], [A.operate('lamp', 'off')]] }).done();
  }),
  // A white neoclassical mansion 34 m wide: a great portico of four two-storey columns under a pediment, a
  // balustraded roof, two lower wings, rows of tall windows, a grand door, and a fountain on the drive that plays.
  e('mansion', 'places', 'houses', () => {
    const b = m('mansion', { edge: S }), w = '#f7f5ef', tr = '#d4d0c4';
    b.box([36, 0.4, 24], [0, 0.2, 2], { color: '#c8c2b4' })
      .box([16, 10, 11], [0, 5.4, 0], { color: w, round: 0.01 })
      .box([16.4, 0.6, 11.4], [0, 10.7, 0], { color: tr })
      .each(16, (i) => b.box([0.3, 0.8, 0.3], [-7.5 + i * 1.0, 11.4, 5.5], { color: w }))
      .box([16.2, 0.2, 0.3], [0, 11.9, 5.5], { color: tr })
      .pair((s) => {
        b.box([9, 7, 9], [s * 12.5, 3.9, -0.6], { color: '#f2ece0', round: 0.01 }).box([9.3, 0.5, 9.3], [s * 12.5, 7.65, -0.6], { color: tr });
        for (const x of [10, 12.5, 15]) for (const y of [2.2, 5.4]) win(b, [s * x, y, 3.9], 1.2, 2.0, { frame: tr });
        b.cyl([0.3, 1.2, 0.3], [s * 5.8, 12.6, -2], { color: '#b8664a' });
      })
      .each(4, (i) => b.cyl([1.0, 8.6, 1.0], [-4.5 + i * 3, 5.1, 7.2], { color: w, segs: 18 }).box([1.3, 0.4, 1.3], [-4.5 + i * 3, 9.6, 7.2], { color: tr }).box([1.3, 0.4, 1.3], [-4.5 + i * 3, 0.95, 7.2], { color: tr }))
      .box([11, 1.0, 2.6], [0, 10.3, 6.7], { color: tr })
      .wedge([11.6, 2.6, 2.6], [0, 12.1, 6.7], { color: w })
      .label('MANSION', [4.5, 0.6], [0, 10.3, 8.02], { color: tr, depth: 0.05 })
      .each(3, (i) => b.box([12 - i * 0.6, 0.25, 3.4 - i * 0.6], [0, 0.525 + i * 0.25, 7.3 - i * 0.3], { color: '#e6e0d2' }));
    door(b, [0, 1.15, 5.5], 2.0, 3.6, { color: '#5a3a22', frame: tr });
    for (const x of [-6, -3, 3, 6]) win(b, [x, 2.6, 5.5], 1.3, 2.4, { frame: tr });
    for (const x of [-6, -3, 0, 3, 6]) win(b, [x, 7.2, 5.5], 1.3, 2.2, { frame: tr });
    b.cyl([5, 0.6, 5], [0, 0.3, 13], { color: '#c8c2b4' })
      .cyl([4.4, 0.62, 4.4], [0, 0.32, 13], { color: '#4f9bd6' })
      .cyl([0.6, 1.6, 0.6], [0, 1.1, 13], { color: w })
      .cyl([1.8, 0.3, 1.8], [0, 1.9, 13], { color: w })
      .cyl([0.3, 0.6, 0.3], [0, 2.3, 13], { color: w });
    return b.act({ click: [[A.par(A.effect('water_spray', { dur: 3 }), A.operate('door', 'open')), A.say('Splish splash', 1.5), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A parchment treasure map hung on two rollers on a little stand: green islands, blue sea, a dotted trail and a
  // red X, which glows.
  e('map', 'study', 'maps', () => {
    const b = m('map', { edge: S });
    b.box([0.3, 0.012, 0.08], [0, 0.006, 0], { color: 'darkwood' })
      .pair((s) => b.stick([s * 0.17, 0.012, -0.01], [s * 0.17, 0.08, -0.01], 0.012, 'darkwood'))
      .box([0.32, 0.24, 0.003], [0, 0.2, 0], { color: '#f2e2b8', round: 0.2 })
      .pair((s) => b.cyl([0.026, 0.26, 0.026], [s * 0.17, 0.2, 0], { color: '#e6d2a0', edge: F }).ball([0.03, 0.02, 0.03], [s * 0.17, 0.34, 0], { color: 'darkwood' }))
      .ball([0.13, 0.09, 0.004], [-0.06, 0.22, 0.002], { color: '#7cb85a', noInk: true })
      .ball([0.08, 0.06, 0.004], [0.08, 0.15, 0.002], { color: '#7cb85a', noInk: true })
      .ball([0.06, 0.04, 0.004], [0.09, 0.27, 0.002], { color: '#4f9bd6', noInk: true })
      .each(5, (i) => b.box([0.012, 0.004, 0.004], [-0.1 + i * 0.035, 0.19 - Math.sin(i) * 0.02, 0.004], { color: '#a3322a', noInk: true }))
      .box([0.03, 0.006, 0.004], [0.08, 0.15, 0.005], { color: '#d23a2e', rot: [0, 0, 45], name: 'mark' })
      .box([0.03, 0.006, 0.004], [0.08, 0.15, 0.005], { color: '#d23a2e', rot: [0, 0, -45], parent: 'mark' })
      .cyl([0.03, 0.002, 0.03], [-0.11, 0.29, 0.003], { color: '#5c6166', rot: [90, 0, 0], noInk: true });
    return b.act({ click: [A.par(A.pose('mark', { scale: 1.8, dur: 0.4 }), A.effect('sparkle', { dur: 1.2 })), A.wait(0.8), A.pose('mark', { scale: 1, dur: 0.4 })] }).done();
  }),
  // A sugar maple 12 m tall in autumn colours, red and orange, hung with winged seeds; shake it and a seed
  // helicopters down.
  e('maple tree', 'garden', 'trees', () => tree2('maple tree', 12, '#d9541e', { leaf2: '#f0923b', fruit: '#c8a060', fs: 0.2, n: 10, shape: 'round', bough: 4 }).act(fruitAct('Whirr...')).done()),
  // A pair of maracas, painted red and green with yellow bands on turned wooden handles; they shake.
  e('maraca', 'music', 'percussion', () => {
    const b = m('maraca');
    b.pair((s) => {
      const n = s > 0 ? 'maracaL' : 'maracaR';
      b.rod([s * 0.03, 0.01, 0], [s * 0.07, 0.14, 0], 0.024, 'wood', { name: n, pivot: [s * 0.03, 0.01, 0] })
        .ball([0.1, 0.12, 0.1], [s * 0.095, 0.22, 0], { color: s > 0 ? '#e0473b' : '#3f9a4a', rot: [0, 0, -s * 18], parent: n })
        .torus([0.1, 0.1, 0.02], [s * 0.095, 0.22, 0], { color: '#f6d24a', rot: [90, 0, -s * 18], tube: 0.12, parent: n })
        .ball(0.018, [s * 0.11, 0.25, 0.045], { color: 'white', noInk: true, parent: n });
    });
    const shake = (a: number) => A.par(A.pose('maracaL', { rot: [0, 0, a], dur: 0.12 }), A.pose('maracaR', { rot: [0, 0, -a], dur: 0.12 }));
    return b.act({ click: [A.say('Chick-a-chick!', 1.4), shake(-15), shake(10), shake(-15), shake(10), shake(0)] }).done();
  }),
  // Glass marbles at their real size, 1.6 cm, with coloured swirls inside, and a bigger shooter; the shooter rolls
  // and clacks into them. (The vocabulary's 10 cm is too big for a marble.)
  e('marble (ball)', 'toys', 'marbles', () =>
    m('marble (ball)')
      .ball(0.025, [-0.03, 0.0125, 0], { color: '#8fd0f0', name: 'shooter' })
      .ball([0.014, 0.024, 0.005], [-0.03, 0.0125, 0], { color: '#f0923b', rot: [0, 0, 30], noInk: true, parent: 'shooter' })
      .ball(0.016, [0.02, 0.008, 0.005], { color: '#7cd07a' })
      .ball([0.009, 0.015, 0.004], [0.02, 0.008, 0.005], { color: '#f6d24a', rot: [0, 30, -30], noInk: true })
      .ball(0.016, [0.035, 0.008, -0.012], { color: '#e86a6a' })
      .ball(0.016, [0.034, 0.008, 0.02], { color: '#8a5fc4' })
      .ball(0.006, [-0.036, 0.02, 0.008], { color: 'white', noInk: true, parent: 'shooter' })
      .act({ click: [[A.pose('shooter', { move: [0.03, 0, 0], rot: [0, 0, -300], dur: 0.4 }), A.say('Clack!', 0.8), A.anim('wobble')], [A.pose('shooter', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A block of white Carrara marble fresh from the quarry, grey-veined, with a slab sawn off beside it; a chip
  // flies off as it is chiselled.
  e('marble (stone)', 'nature', 'rocks', () => {
    const b = m('marble (stone)', { edge: S });
    b.box([1.4, 1.0, 0.9], [0, 0.5, 0], { color: '#f2f0ea', round: 0.08, name: 'block' })
      .box([0.9, 1.4, 0.15], [1.05, 0.7, -0.15], { color: '#ecebe6', round: 0.08, rot: [0, 0, -8] })
      .box([0.25, 0.2, 0.2], [0.55, 1.05, 0.32], { color: '#e8e6e0', name: 'chip', parent: 'block', piece: true });
    const v = (a: V, c: V) => b.rod(a, c, 0.014, '#9da3a8', { noInk: true, parent: 'block' });
    v([-0.6, 0.85, 0.455], [-0.15, 0.5, 0.455]);
    v([-0.15, 0.5, 0.455], [0.25, 0.56, 0.455]);
    v([0.25, 0.56, 0.455], [0.6, 0.15, 0.455]);
    v([-0.45, 0.12, 0.455], [0.0, 0.3, 0.455]);
    v([0.7, 0.6, -0.15], [0.3, 0.9, 0.2]);
    return b.act({ click: [[A.par(A.effect('dust', { dur: 1 }), A.say('Tink tink!', 1)), A.detach('chip', 'marble chip')], [A.reattach('chip')]] }).done();
  }),
  // A marble loaf cake: vanilla swirled with chocolate under a golden crust, with a slice cut that comes away.
  e('marble cake', 'food', 'cakes', () => {
    const b = m('marble cake');
    b.box([0.24, 0.012, 0.13], [0, 0.006, 0], { color: 'white', round: 0.5, edge: S, name: 'base' })
      .box([0.2, 0.08, 0.1], [-0.015, 0.052, 0], { color: '#f2dca0', round: 0.25 })
      .box([0.2, 0.02, 0.1], [-0.015, 0.096, 0], { color: '#b8742f', round: 0.6 })
      .ball([0.05, 0.025, 0.006], [-0.07, 0.06, 0.05], { color: '#6b3e26', noInk: true, rot: [0, 0, 20] })
      .ball([0.06, 0.02, 0.006], [0.02, 0.04, 0.05], { color: '#6b3e26', noInk: true, rot: [0, 0, -15] })
      .box([0.025, 0.08, 0.1], [0.1, 0.052, 0], { color: '#f2dca0', round: 0.2, name: 'slice', piece: true, parent: 'base' })
      .ball([0.006, 0.05, 0.07], [0.113, 0.05, 0.0], { color: '#6b3e26', noInk: true, parent: 'slice' })
      .box([0.025, 0.02, 0.1], [0.1, 0.096, 0], { color: '#b8742f', round: 0.6, parent: 'slice' });
    return b.act({ click: [[A.detach('slice', 'cake slice'), A.say('Yum!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A felt-tip marker: the white barrel with a red band, the grip, the chisel nib, and a red cap with its clip
  // that comes off (and goes back on with a click).
  e('marker (writing)', 'study', 'stationery', () =>
    m('marker (writing)', { edge: S })
      .cyl([0.02, 0.11, 0.02], [0, 0.055, 0], { color: 'white', round: 0.3, name: 'barrel' })
      .cyl([0.0205, 0.03, 0.0205], [0, 0.02, 0], { color: '#e0473b', noInk: true, parent: 'barrel' })
      .cyl([0.016, 0.012, 0.016], [0, 0.116, 0], { color: '#5c6166', taper: 0.7, parent: 'barrel' })
      .cone([0.01, 0.016, 0.01], [0, 0.129, 0], { color: '#e0473b', parent: 'barrel' })
      .cyl([0.023, 0.045, 0.023], [0, 0.13, 0], { color: '#e0473b', round: 0.4, name: 'cap', parent: 'barrel', piece: true })
      .box([0.004, 0.032, 0.006], [0.013, 0.13, 0], { color: '#e0473b', parent: 'cap' })
      .act({ click: [[A.detach('cap', 'cap'), A.say('Squeak squeak', 1.2)], [A.reattach('cap'), A.say('Click!', 0.8)]] })
      .done(),
  ),
  // A farmers' market of two timber stalls under striped awnings: crates of apples, oranges, lemons, grapes and
  // greens, a hanging scale, and a board that flips from OPEN to CLOSED.
  e('market', 'places', 'shops', () => {
    const b = m('market', { edge: S });
    b.pair((s) => {
      const x = s * 1.5, c = s > 0 ? '#e0473b' : '#3f9a4a';
      b.box([2.6, 0.9, 1.1], [x, 0.45, 0], { color: '#b5814e' })
        .box([2.7, 0.06, 1.2], [x, 0.93, 0], { color: '#7a5230' })
        .box([0.08, 2.5, 0.08], [x - 1.25, 1.25, -0.5], { color: '#7a5230' }).box([0.08, 2.5, 0.08], [x + 1.25, 1.25, -0.5], { color: '#7a5230' })
        .box([0.08, 2.2, 0.08], [x - 1.25, 1.1, 0.5], { color: '#7a5230' }).box([0.08, 2.2, 0.08], [x + 1.25, 1.1, 0.5], { color: '#7a5230' })
        .box([2.8, 0.06, 1.5], [x, 2.38, 0.1], { color: c, rot: [14, 0, 0] })
        .each(4, (i) => b.box([0.3, 0.065, 1.5], [x - 1.05 + i * 0.7, 2.385, 0.1], { color: 'white', rot: [14, 0, 0], noInk: true }));
      const fruit = s > 0 ? ['#e0473b', '#f0923b', '#f6dc3a'] : ['#7cc45a', '#8a5fc4', '#e0473b'];
      b.each(3, (i) => b.box([0.7, 0.18, 0.45], [x - 0.8 + i * 0.8, 1.05, 0.15], { color: '#c8a870', rot: [-12, 0, 0] }).ball([0.6, 0.15, 0.36], [x - 0.8 + i * 0.8, 1.18, 0.15], { color: fruit[i], edge: F }));
    });
    b.stick([1.5, 2.2, 0.3], [1.5, 1.7, 0.3], 0.01, '#5c6166')
      .cyl([0.25, 0.08, 0.25], [1.5, 1.62, 0.3], { color: '#c9ccd1', taper: 1.4 })
      .box([0.9, 0.06, 0.06], [0, 2.75, -0.5], { color: '#7a5230' })
      .box([0.8, 0.5, 0.04], [0, 2.45, -0.5], { color: 'white', name: 'board', pivot: [0, 2.45, -0.5] })
      .label('OPEN', [0.7, 0.36], [0, 2.45, -0.47], { color: '#3f9a4a', depth: 0.01, parent: 'board' })
      .label('CLOSED', [0.7, 0.36], [0, 2.45, -0.53], { color: '#e0473b', depth: 0.01, rot: [0, 180, 0], parent: 'board' })
      .socket('stall', [-1.5, 0.98, 0.35], 'top', { size: 0.5 });
    return b.act({ click: [[A.pose('board', { rot: [0, 180, 0], dur: 0.6 }), A.say('Flip!', 1)], [A.pose('board', { rot: [0, 0, 0], dur: 0.6 }), A.say('Ding-a-ling!', 1.2)]] }).done();
  }),
  // A jar of orange marmalade with shreds of peel in it, a gingham cloth cap tied with string over the lid, and a
  // label; the lid comes off.
  e('marmalade', 'food', 'spreads', () => {
    const b = m('marmalade');
    b.cyl([0.085, 0.095, 0.085], [0, 0.0475, 0], { color: '#f08a2a', name: 'jar', edge: S, round: 0.3 })
      .cyl([0.088, 0.04, 0.088], [0, 0.05, 0], { color: 'white', noInk: true, parent: 'jar' })
      .label('MARMALADE', [0.06, 0.018], [0, 0.05, 0.044], { color: 'white', depth: 0.002, parent: 'jar' });
    b.each(5, (i) => b.box([0.012, 0.003, 0.002], [Math.cos(i * 1.3) * 0.03, 0.02 + i * 0.012, 0.0435], { color: '#c8642a', rot: [0, 0, i * 40], noInk: true, parent: 'jar' }));
    b.cyl([0.08, 0.02, 0.08], [0, 0.105, 0], { color: '#c9ccd1', name: 'lid', parent: 'jar', piece: true, edge: S })
      .dome([0.1, 0.012, 0.1], [0, 0.121, 0], { color: '#e0473b', parent: 'lid' })
      .cyl([0.1, 0.025, 0.1], [0, 0.103, 0], { color: '#e0473b', taper: 0.9, rot: [180, 0, 0], parent: 'lid' })
      .torus([0.088, 0.088, 0.006], [0, 0.1, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.08, parent: 'lid' });
    b.each(3, (i) => b.box([0.09, 0.002, 0.01], [0, 0.123, -0.03 + i * 0.03], { color: 'white', noInk: true, parent: 'lid' }));
    return b.act({ click: [[A.detach('lid', 'jar lid'), A.say('Pop!', 1)], [A.reattach('lid')]] }).done();
  }),
  // Marshmallows, pink and white, beside one on a toasting stick over a little camp flame; it toasts golden.
  e('marshmallow', 'food', 'sweets', () => {
    const b = m('marshmallow');
    b.cyl([0.035, 0.032, 0.035], [-0.05, 0.016, 0.02], { color: 'white' })
      .cyl([0.035, 0.032, 0.035], [-0.01, 0.016, 0.04], { color: '#f4c0d0' })
      .cyl([0.035, 0.032, 0.035], [-0.03, 0.048, 0.03], { color: 'white' })
      .stick([0.03, 0.0, -0.06], [0.07, 0.2, -0.02], 0.006, 'wood', { edge: S })
      .cyl([0.036, 0.034, 0.036], [0.073, 0.215, -0.018], { color: 'white', rot: [0, 0, -12], name: 'mallow' })
      .cyl([0.038, 0.036, 0.038], [0.073, 0.215, -0.018], { color: '#d9a35f', rot: [0, 0, -12], name: 'toasted', scale: 0 })
      .stick([0.074, 0.23, -0.018], [0.075, 0.25, -0.017], 0.004, 'wood', { edge: S });
    return b.act({ click: [[A.effect('fire', { dur: 1.5 }), A.pose('toasted', { scale: 1, dur: 1.5 }), A.say('Sizzle!', 1)], [A.pose('toasted', { scale: 0, dur: 0.3 }), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // A tube of mascara at its real size: the pink barrel and the black cap that is the wand, which pulls out to
  // show its bristly brush.
  e('mascara', 'wardrobe', 'makeup', () => {
    const b = m('mascara', { edge: S });
    b.cyl([0.017, 0.085, 0.017], [0, 0.0425, 0], { color: '#f490b4', round: 0.4 })
      .cyl([0.0175, 0.012, 0.0175], [0, 0.07, 0], { color: '#2a2726', noInk: true })
      .cyl([0.016, 0.05, 0.016], [0, 0.11, 0], { color: '#2a2726', round: 0.4, name: 'wand', mover: { kind: 'slide', axis: 'y', amount: 0.075 } })
      .stick([0, 0.085, 0], [0, 0.05, 0], 0.003, '#c9ccd1', { parent: 'wand' })
      .capsule([0.009, 0.025, 0.009], [0, 0.038, 0], { color: '#1a1716', parent: 'wand', edge: F });
    return b.act({ click: [[A.operate('wand', 'out'), A.say('Flutter!', 1)], [A.operate('wand', 'in')]] }).done();
  }),
  // A sports mascot in a bear suit: fur paws and a team jersey, and the huge friendly bear head, which comes off
  // to show the person sweating inside.
  e('mascot outfit', 'wardrobe', 'costumes', () => {
    const fur = '#a0682a', light = '#e8c08a';
    const bearHead = (p: Parameters<Extra>[0], d: Parameters<Extra>[1]) => {
      const W = d.headW, H = d.headH, D = d.headD, y = d.headY;
      // the big head hangs off the person's head joint; its features hang off the big head (at is in the parent's frame)
      const hy = y + H * 0.2;
      const add = (name: string, shape: 'ball' | 'cyl', size: V, at: V, color: string, o: Record<string, unknown> = {}) =>
        p.add({ name, parent: name === 'bearhead' ? 'head' : 'bearhead', at: name === 'bearhead' ? at : [at[0], at[1] - hy, at[2]], shape, size, color: col(color), layer: 4, ...o });
      add('bearhead', 'ball', [W * 2.1, H * 1.9, D * 2.0], [0, y + H * 0.2, 0], fur, { piece: true });
      add('bear_snout', 'ball', [W * 0.9, H * 0.65, D * 0.6], [0, y - H * 0.1, D * 0.95], light);
      add('bear_nose', 'ball', [W * 0.35, H * 0.22, D * 0.2], [0, y + H * 0.05, D * 1.25], '#2a2726');
      add('bear_mouth', 'ball', [W * 0.4, H * 0.08, D * 0.1], [0, y - H * 0.3, D * 1.2], '#7a2a20');
      for (const s of [1, -1]) {
        add(`bear_ear${s > 0 ? 'L' : 'R'}`, 'ball', [W * 0.6, H * 0.6, D * 0.35], [s * W * 0.82, y + H * 1.0, 0], fur);
        add(`bear_earin${s > 0 ? 'L' : 'R'}`, 'ball', [W * 0.35, H * 0.35, D * 0.2], [s * W * 0.82, y + H * 1.0, D * 0.12], light);
        add(`bear_eye${s > 0 ? 'L' : 'R'}`, 'ball', [W * 0.3, H * 0.34, D * 0.15], [s * W * 0.38, y + H * 0.45, D * 0.88], 'white');
        add(`bear_pupil${s > 0 ? 'L' : 'R'}`, 'ball', [W * 0.15, H * 0.17, D * 0.1], [s * W * 0.36, y + H * 0.42, D * 0.96], '#2a2726');
      }
    };
    return withAct(who('mascot outfit', { h: 1.75, top: '#2f6fc8', bottom: fur, shoes: light, skin: 'skin2', long: true, build: 1.25, pose: 'wave', acc: [bearHead] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('Go team go!', 1.6))],
        [A.detach('bearhead', 'mascot head'), A.par(A.anim('laugh'), A.say('Ha! It was me all along!', 2))],
        [A.reattach('bearhead'), A.par(A.anim('dance'), A.say('Dance with me!', 1.6))],
      ],
    });
  }),
  // A plate of mashed potato: a fluffy swirled mound with a pat of butter melting on top, a pool of gravy and a
  // sprig of parsley; it steams and the butter melts away.
  e('mashed potato', 'food', 'meals', () => {
    const b = m('mashed potato');
    b.cyl([0.24, 0.014, 0.24], [0, 0.007, 0], { color: 'white', edge: S })
      .ball([0.16, 0.07, 0.15], [0, 0.045, 0], { color: '#f3e6b8' })
      .ball([0.1, 0.05, 0.1], [0.01, 0.08, -0.01], { color: '#f6ecc4' })
      .cone([0.05, 0.04, 0.05], [0.01, 0.115, -0.01], { color: '#f3e6b8', rot: [0, 0, 8] })
      .box([0.035, 0.012, 0.035], [0.0, 0.11, 0.025], { color: '#f6d24a', rot: [20, 30, 0], name: 'butter', edge: S })
      .ball([0.07, 0.012, 0.05], [0.06, 0.016, 0.06], { color: '#8a5a35', noInk: true })
      .ball([0.012, 0.012, 0.012], [-0.05, 0.06, 0.05], { color: '#3f7a3a', noInk: true });
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.pose('butter', { scale: 0.3, dur: 2 })), A.say('Mmm...', 1)], [A.pose('butter', { scale: 1, dur: 0.4 })]] }).done();
  }),
  // A masquerade mask on a gold stick: a purple eye mask with gold trim, sequins and a plume of feathers; it
  // twirls with a flourish.
  e('mask (party)', 'toys', 'party', () => {
    const b = m('mask (party)');
    b.stick([0.06, 0.0, 0], [0.11, 0.24, 0], 0.01, 'gold', { edge: S })
      .pair((s) => b.ball([0.1, 0.06, 0.025], [s * 0.048, 0.28, 0], { color: '#8a5fc4', rot: [0, 0, s * 12], name: s > 0 ? 'mask' : 'maskR' }).ball([0.04, 0.024, 0.01], [s * 0.05, 0.282, 0.012], { color: '#1a1716', noInk: true }))
      .ball([0.04, 0.03, 0.03], [0, 0.27, 0.005], { color: '#8a5fc4' })
      .torus([0.2, 0.08, 0.01], [0, 0.28, 0.006], { color: 'gold', tube: 0.08 })
      .each(5, (i) => b.ball(0.008, [-0.07 + i * 0.035, 0.31 - Math.abs(i - 2) * 0.01, 0.014], { color: '#f6d24a', glow: true, noInk: true }))
      .capsule([0.03, 0.16, 0.012], [-0.1, 0.38, -0.01], { color: '#d64fa0', rot: [0, 0, 30], edge: F })
      .capsule([0.028, 0.14, 0.012], [-0.07, 0.39, -0.012], { color: '#3fa7a0', rot: [0, 0, 15], edge: F })
      .capsule([0.025, 0.12, 0.012], [-0.04, 0.37, -0.014], { color: '#f6d24a', rot: [0, 0, 0], edge: F });
    return b.act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.2 }), A.say('Ta-da!', 1.2))] }).done();
  }),
  // A Mason jar of home-made pickles: thick glass with the brand embossed, pickles and dill inside, and the
  // two-part screw lid, which unscrews and comes off.
  e('mason jar', 'kitchen', 'storage', () => {
    const b = m('mason jar');
    b.cyl([0.09, 0.13, 0.09], [0, 0.065, 0], { color: '#c8e0a0', name: 'jar', edge: S, round: 0.3 })
      .torus([0.094, 0.094, 0.01], [0, 0.11, 0], { color: '#d6f0fa', rot: [90, 0, 0], tube: 0.1, parent: 'jar' })
      .cyl([0.07, 0.015, 0.07], [0, 0.135, 0], { color: '#c8e0a0', parent: 'jar' });
    b.each(3, (i) => b.capsule([0.022, 0.08, 0.012], [-0.025 + i * 0.025, 0.06, 0.042], { color: '#5a8a3a', rot: [0, 0, (i - 1) * 8], noInk: true, parent: 'jar' }));
    b.label('MASON', [0.05, 0.014], [0, 0.085, 0.046], { color: '#c8e0a0', depth: 0.002, parent: 'jar' })
      .cyl([0.08, 0.018, 0.08], [0, 0.148, 0], { color: '#c9ccd1', name: 'lid', parent: 'jar', piece: true, edge: S })
      .cyl([0.072, 0.004, 0.072], [0, 0.158, 0], { color: '#d4d7da', parent: 'lid', edge: S });
    return b.act({ click: [[A.pose('lid', { rot: [0, 270, 0], dur: 0.6 }), A.detach('lid', 'jar lid'), A.say('Pop!', 0.8)], [A.reattach('lid'), A.pose('lid', { rot: [0, 0, 0], dur: 0.2 })]] }).done();
  }),
  // A calm little massage parlour 6 m wide: sage-green walls, a bamboo screen, a glazed door that opens, a
  // window with a massage table and a candle in it, a stack of pebbles, a paper lantern and the sign.
  e('massage parlor', 'places', 'shops', () => {
    const b = m('massage parlor', { edge: S }), wall = '#bfd8c8', tr = '#f2ece0';
    b.box([6.2, 0.2, 5.2], [0, 0.1, 0], { color: '#a7a7a0' })
      .box([6, 4.0, 5], [0, 2.2, 0], { color: wall })
      .box([6.4, 0.3, 5.4], [0, 4.35, 0], { color: '#3f6a5a' })
      .box([4.2, 0.7, 0.1], [0, 3.6, 2.56], { color: '#3f6a5a' })
      .label('MASSAGE', [3.6, 0.5], [0, 3.6, 2.62], { color: '#3f6a5a', depth: 0.03 });
    door(b, [-1.6, 0.2, 2.5], 1.0, 2.2, { color: '#8a6440', frame: tr, glass: true });
    win(b, [1.0, 1.7, 2.5], 2.4, 1.6, { frame: tr, bars: false });
    b.box([1.6, 0.12, 0.6], [1.0, 1.0, 2.2], { color: 'white', round: 0.4, edge: F })
      .box([1.6, 0.6, 0.06], [1.0, 0.65, 2.45], { color: tr })
      .cyl([0.12, 0.15, 0.12], [1.9, 1.05, 2.4], { color: 'cream', edge: F })
      .ball(0.06, [1.9, 1.18, 2.4], { color: '#ffd27a', glow: true, name: 'candle', mover: { kind: 'light' } })
      .each(6, (i) => b.cyl([0.08, 2.4, 0.08], [2.4 + (i % 3) * 0.12, 1.4, 2.7 + Math.floor(i / 3) * 0.1], { color: '#c8b860', segs: 8 }))
      .ball([0.6, 0.2, 0.5], [-2.5, 0.3, 3.0], { color: '#8f8c86', edge: F })
      .ball([0.45, 0.16, 0.38], [-2.5, 0.48, 3.0], { color: '#a7a7a0', edge: F })
      .ball([0.3, 0.12, 0.26], [-2.5, 0.62, 3.0], { color: '#8f8c86', edge: F })
      .stick([-0.6, 3.2, 2.5], [-0.6, 3.2, 2.85], 0.04, '#3a3633')
      .ball([0.4, 0.5, 0.4], [-0.6, 2.85, 2.85], { color: '#e0473b', glow: true, name: 'lantern', mover: { kind: 'light' }, edge: F });
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.operate('candle', 'on'), A.operate('lantern', 'on'), A.effect('steam', { dur: 2 })), A.say('Ahhh...', 1.5), A.wait(1.5), A.operate('door', 'close')], [A.operate('candle', 'off'), A.operate('lantern', 'off')]] }).done();
  }),
  // A street flagpole 6 m tall on its concrete base: the white mast with a gold ball, the halyard and its cleat,
  // and the flag, which runs up the pole and waves. (The vocabulary's 0.3 m does not fit a mast.)
  e('mast', 'places', 'street', () => {
    const b = m('mast', { edge: S });
    b.cyl([0.6, 0.3, 0.6], [0, 0.15, 0], { color: '#c8c2b4' })
      .cyl([0.14, 6.0, 0.14], [0, 3.3, 0], { color: 'white', taper: 0.55 })
      .ball(0.16, [0, 6.35, 0], { color: 'gold' })
      .stick([0.07, 0.3, 0.02], [0.05, 6.2, 0.02], 0.008, '#9da3a8')
      .box([0.04, 0.14, 0.04], [0.09, 1.3, 0.02], { color: '#9da3a8' })
      .box([1.2, 0.8, 0.02], [0.66, 2.0, 0], { color: '#2f4f8f', name: 'flag', mover: { kind: 'slide', axis: 'y', amount: 3.7 } })
      .box([1.2, 0.27, 0.025], [0.66, 2.0, 0], { color: 'white', parent: 'flag', noInk: true })
      .star(0.22, [0.66, 2.0, 0.016], { color: '#e0473b', parent: 'flag', round: 0.01 });
    return b.act({ click: [[A.operate('flag', 'up'), A.pose('flag', { rot: [0, 12, 0], dur: 0.3 }), A.pose('flag', { rot: [0, -8, 0], dur: 0.3 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.3 })], [A.operate('flag', 'down')]] }).done();
  }),
  // A cardboard matchbook folded open: two rows of paper matches with red heads above the striker strip, and the
  // cover; a match flares and goes out.
  e('matchbook', 'home', 'household', () => {
    const b = m('matchbook', { edge: S });
    b.box([0.04, 0.045, 0.004], [0, 0.0225, 0], { color: '#c8322a' })
      .box([0.04, 0.01, 0.01], [0, 0.005, 0.005], { color: '#5a3a22' })
      .each(6, (i) => b.box([0.005, 0.034, 0.0015], [-0.0145 + i * 0.0058, 0.03, 0.003], { color: '#f2e6cf' }).ball([0.006, 0.006, 0.004], [-0.0145 + i * 0.0058, 0.048, 0.003], { color: '#a3322a', name: i === 5 ? 'head' : undefined }))
      .cone([0.006, 0.016, 0.006], [0.0145, 0.06, 0.003], { color: '#ffd24a', glow: true, name: 'flame', scale: 0, edge: F })
      .box([0.04, 0.045, 0.003], [0, 0.06, -0.022], { color: '#c8322a', rot: [-60, 0, 0] })
      .label('HOTEL', [0.03, 0.008], [0, 0.065, -0.02], { color: '#c8322a', rot: [-60, 0, 0], depth: 0.0006 });
    return b.act({ click: [A.par(A.pose('flame', { scale: 1, dur: 0.1 }), A.say('Fsst!', 0.8)), A.wait(1.5), A.pose('flame', { scale: 0, dur: 0.3 }), A.effect('smoke', { dur: 1 })] }).done();
  }),
  // A box of matches: the printed sleeve with brown strikers down its sides, the tray of red-headed matches,
  // which slides out, and a match that strikes and flares.
  e('matchbox', 'home', 'household', () => {
    const b = m('matchbox', { edge: S });
    b.box([0.055, 0.016, 0.036], [0, 0.008, 0], { color: '#f6d24a', round: 0.1 })
      .box([0.035, 0.0165, 0.02], [0, 0.008, 0], { color: '#e0473b', noInk: true })
      .pair((s) => b.box([0.055, 0.014, 0.002], [0, 0.008, s * 0.0185], { color: '#5a3a22', noInk: true }))
      .box([0.052, 0.013, 0.033], [0.0, 0.0085, 0], { color: '#d8b07a', name: 'tray', mover: { kind: 'slide', axis: 'x', amount: 0.03 } })
      .each(4, (i) => b.box([0.044, 0.003, 0.003], [0.0, 0.0145, -0.01 + i * 0.0066], { color: '#f2e6cf', parent: 'tray' }).ball(0.005, [0.023, 0.0145, -0.01 + i * 0.0066], { color: '#c8322a', parent: 'tray' }))
      .stick([-0.045, 0.0, 0.03], [-0.045, 0.045, 0.03], 0.003, '#f2e6cf')
      .ball(0.006, [-0.045, 0.047, 0.03], { color: '#5a3a22' })
      .cone([0.008, 0.02, 0.008], [-0.045, 0.06, 0.03], { color: '#ffd24a', glow: true, name: 'flame', scale: 0, edge: F });
    return b.act({ click: [[A.operate('tray', 'out'), A.say('Shhk', 0.6)], [A.par(A.pose('flame', { scale: 1, dur: 0.1 }), A.say('Fsst!', 0.8)), A.wait(1.2), A.pose('flame', { scale: 0, dur: 0.3 }), A.operate('tray', 'in')]] }).done();
  }),
  // A queen mattress, 1.5 x 2 m and 25 cm deep: a quilted top with button tufts, piped edges, a striped border
  // and side handles; it bounces.
  e('mattress', 'home', 'bedroom', () => {
    const b = m('mattress');
    b.box([1.5, 0.25, 2.0], [0, 0.125, 0], { color: 'white', round: 0.4, name: 'mat' })
      .box([1.51, 0.09, 2.01], [0, 0.12, 0], { color: '#8fb8e0', round: 0.4, noInk: true, parent: 'mat' })
      .pair((s) => b.box([1.52, 0.02, 2.02], [0, s > 0 ? 0.235 : 0.015, 0], { color: '#d4d7da', round: 0.6, noInk: true, parent: 'mat' }));
    for (const x of [-0.5, 0, 0.5]) for (const z of [-0.7, -0.23, 0.23, 0.7]) b.ball([0.05, 0.02, 0.05], [x, 0.248, z], { color: '#c8ccd1', noInk: true, parent: 'mat' });
    b.pair((s) => b.box([0.02, 0.03, 0.2], [s * 0.755, 0.13, 0], { color: '#5c6166', parent: 'mat', edge: S }))
      .box([0.1, 0.06, 0.004], [0.4, 0.12, 1.006], { color: 'white', parent: 'mat', edge: S })
      .socket('top', [0, 0.26, 0], 'seat');
    return b.act({ click: [A.par(A.anim('bounce', 2), A.say('Boing boing!', 1.4))] }).done();
  }),
  // El Castillo, the Maya pyramid of Chichen Itza, 24 m tall in its real proportions: nine stepped terraces, a
  // broad stairway up each face with serpent balustrades, and the temple on top, whose doorway glows.
  e('mayan pyramid', 'places', 'landmarks', () => {
    const b = m('mayan pyramid', { edge: S }), c = ['#c8bc9a', '#b8ac8a'];
    const base = 44, top = 15, h = 2.1;
    b.each(9, (i) => {
      const w = base - (i * (base - top)) / 9;
      b.box([w, h, w], [0, h / 2 + i * h, 0], { color: c[i % 2], round: 0.03 }).box([w + 0.2, 0.25, w + 0.2], [0, (i + 1) * h - 0.3, 0], { color: '#a89c7a', round: 0.1 });
    });
    const H = 9 * h, run = (base - top) / 2, len = Math.hypot(H, run), ang = (Math.atan2(H, run) * 180) / Math.PI;
    const faces: Array<[number, number, number]> = [[0, 1, 0], [0, -1, 0], [1, 0, 1], [-1, 0, 1]];
    const r = top / 2 + run / 2;
    for (const [fx, fz, side] of faces) {
      const at: V = [fx * r, H / 2, fz * r];
      const size: V = side ? [len, 0.8, 8] : [8, 0.8, len];
      const rot: V = side ? [0, 0, -fx * ang] : [fz * ang, 0, 0];
      b.box(size, at, { color: '#d8ccaa', rot })
        .pair((s) => b.box(side ? [len, 1.2, 0.9] : [0.9, 1.2, len], [at[0] + (side ? 0 : s * 4.4), at[1] + 0.2, at[2] + (side ? s * 4.4 : 0)], { color: '#988c6a', rot }));
    }
    b.pair((s) => b.ball([1.6, 1.4, 2.0], [s * 4.4, 0.7, base / 2 + 0.6], { color: '#988c6a' }));
    b.box([10, 5, 10], [0, H + 2.5, 0], { color: '#d8ccaa' })
      .box([10.6, 0.8, 10.6], [0, H + 5.4, 0], { color: '#b8ac8a' })
      .box([7, 1.2, 7], [0, H + 6.4, 0], { color: '#c8bc9a' });
    for (const x of [-2.6, 0, 2.6]) b.box([1.6, 3.0, 0.3], [x, H + 1.7, 5.0], { color: '#2a2422' });
    b.box([1.0, 1.2, 0.3], [0, H + 1.5, 4.9], { color: '#ffb84a', glow: true, name: 'altar', mover: { kind: 'light' } });
    return b.act({ click: [[A.par(A.operate('altar', 'on'), A.effect('sparkle', { dur: 2 })), A.say('Ooooh...', 1.5)], [A.operate('altar', 'off')]] }).done();
  }),
  // A squat jar of mayonnaise: creamy white with a blue lid and a yellow-and-blue label; the lid comes off.
  e('mayonnaise', 'food', 'sauces', () => {
    const b = m('mayonnaise');
    b.cyl([0.1, 0.12, 0.1], [0, 0.06, 0], { color: '#fbf6e6', name: 'jar', edge: S, round: 0.3 })
      .cyl([0.102, 0.06, 0.102], [0, 0.06, 0], { color: '#2f6fc8', noInk: true, parent: 'jar' })
      .label('MAYO', [0.06, 0.025], [0, 0.065, 0.05], { color: '#f6d24a', depth: 0.003, parent: 'jar' })
      .cyl([0.094, 0.03, 0.094], [0, 0.135, 0], { color: '#2f6fc8', name: 'lid', parent: 'jar', piece: true, edge: S })
      .torus([0.095, 0.095, 0.006], [0, 0.125, 0], { color: '#1f5fb8', rot: [90, 0, 0], tube: 0.08, parent: 'lid', edge: S });
    return b.act({ click: [[A.detach('lid', 'jar lid'), A.say('Pop!', 0.8)], [A.reattach('lid')]] }).done();
  }),
  // A hedge maze 10 m square: clipped yew walls 2 m high with an entrance gap, winding paths of gravel and a
  // fountain in the middle; a mouse runs in to find the way.
  e('maze', 'garden', 'garden features', () => {
    const b = m('maze', { edge: S });
    const hedge = (w: number, d: number, x: number, z: number) => b.box([w, 2.0, d], [x, 1.1, z], { color: '#2f6a32', round: 0.15 });
    b.box([10.4, 0.1, 10.4], [0, 0.05, 0], { color: '#d8c8a0' });
    hedge(10, 0.6, 0, -4.7);
    hedge(0.6, 10, -4.7, 0);
    hedge(0.6, 10, 4.7, 0);
    hedge(4, 0.6, -2.7, 4.7);
    hedge(4, 0.6, 2.7, 4.7);
    hedge(6.6, 0.6, -0.6, 2.4);
    hedge(5.4, 0.6, 1.4, -2.4);
    hedge(0.6, 3.6, -2.4, -0.6);
    hedge(0.6, 2.4, 2.4, 0.9);
    hedge(2.4, 0.6, -1.2, 0.0);
    b.cyl([2.0, 0.4, 2.0], [0.6, 0.3, -0.9], { color: '#c8c2b4' })
      .cyl([1.7, 0.42, 1.7], [0.6, 0.32, -0.9], { color: '#4f9bd6' })
      .cyl([0.25, 1.0, 0.25], [0.6, 0.8, -0.9], { color: '#c8c2b4' })
      .ball(0.35, [0.6, 1.4, -0.9], { color: '#c8c2b4' });
    return b.act({ click: [A.spawn('ms', 'mouse', { rel: 'front', of: 'self', dist: 'close' }), A.say('Squeak?', 1, 'ms'), A.move('ms', { rel: 'at', of: 'self' }, { speed: 'run' }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Squeak!', 1, 'ms')), A.remove('ms', 'fade')] }).done();
  }),
  // A glass measuring jug with red graduations, a spout and a handle, half full of milk; it tips and pours.
  e('measuring cup', 'kitchen', 'baking', () => {
    const b = m('measuring cup');
    b.cyl([0.11, 0.13, 0.11], [0, 0.065, 0], { color: '#bfe3f2', taper: 1.08, edge: S })
      .cyl([0.106, 0.075, 0.106], [0, 0.04, 0], { color: '#fbf9f2', taper: 1.04 })
      .arc([0.07, 0.1, 0.018], [-0.062, 0.075, 0], { color: '#bfe3f2', rot: [0, 0, 90], tube: 0.25, edge: S })
      .cone([0.04, 0.035, 0.03], [0.062, 0.122, 0], { color: '#bfe3f2', rot: [0, 0, -75], edge: S });
    b.each(5, (i) => b.box([0.022 + (i % 2) * 0.014, 0.003, 0.003], [-0.01, 0.025 + i * 0.022, 0.056], { color: '#e0473b', noInk: true }))
      .label('ml', [0.016, 0.01], [0.018, 0.105, 0.057], { color: '#bfe3f2', depth: 0.001 });
    return b.act({ click: [A.set({ tilt: -35, dur: 0.5 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Glug glug', 1)), A.set({ tilt: 0, dur: 0.5 })] }).done();
  }),
  // A cast-iron hand mincer (31 cm) on its weighted foot, real size: the round hopper with meat in it on top of
  // the screw barrel, the polished ring nut and cutting plate at the outlet, the crank with a wooden handle at
  // the back, and a bowl of mince under the outlet. Turn it and a sausage of mince comes out.
  e('meat grinder', 'kitchen', 'appliances', () => {
    const b = m('meat grinder', { edge: S }), iron = '#55595e', steel = '#8f99a3';
    b.box([0.18, 0.022, 0.12], [0.015, 0.011, 0], { color: iron, round: 0.45 })
      .cyl([0.06, 0.11, 0.05], [0.01, 0.075, 0], { color: iron, taper: 0.7, edge: F })
      .cyl([0.072, 0.17, 0.072], [0, 0.16, 0], { color: iron, rot: [0, 0, 90], name: 'barrel' })
      .cyl([0.08, 0.018, 0.08], [0.082, 0.16, 0], { color: iron, rot: [0, 0, 90] })
      .cyl([0.094, 0.03, 0.094], [-0.098, 0.16, 0], { color: steel, rot: [0, 0, 90], round: 0.3 })
      .cyl([0.07, 0.006, 0.07], [-0.116, 0.16, 0], { color: '#3a3f44', rot: [0, 0, 90] })
      .ball([0.006, 0.05, 0.05], [-0.12, 0.16, 0], { color: '#d9746a', noInk: true, edge: F })
      .cyl([0.05, 0.04, 0.05], [0, 0.215, 0], { color: iron })
      .cyl([0.085, 0.06, 0.085], [0, 0.262, 0], { color: iron, taper: 1.45 })
      .torus([0.126, 0.126, 0.01], [0, 0.292, 0], { color: iron, rot: [90, 0, 0], tube: 0.12 })
      .ball([0.1, 0.03, 0.1], [0, 0.288, 0], { color: '#c85a5a', edge: F })
      .cyl([0.02, 0.03, 0.02], [0.105, 0.16, 0], { color: steel, rot: [0, 0, 90] })
      .box([0.012, 0.135, 0.024], [0.122, 0.21, 0], { color: steel, round: 0.4, name: 'crank', pivot: [0.122, 0.16, 0] })
      .cyl([0.02, 0.012, 0.02], [0.122, 0.16, 0], { color: steel, rot: [0, 0, 90], segs: 6, parent: 'crank' })
      .capsule([0.026, 0.075, 0.026], [0.165, 0.265, 0], { color: 'wood', rot: [0, 0, 90], parent: 'crank', edge: F })
      .cyl([0.12, 0.05, 0.12], [-0.165, 0.025, 0.01], { color: 'white', taper: 1.35, round: 0.3 })
      .ball([0.12, 0.035, 0.12], [-0.165, 0.05, 0.01], { color: '#d9746a', edge: F });
    b.pair((s) => b.box([0.012, 0.03, 0.016], [-0.098, 0.16 + s * 0.05, 0], { color: steel }).box([0.012, 0.016, 0.03], [-0.098, 0.16, s * 0.05], { color: steel }));
    return b.act({ click: [A.pose('crank', { rot: [-720, 0, 0], dur: 2 }), A.spawn('s', 'sausage', { rel: 'front', of: 'self', dist: 'close' }), A.say('Crunch crunch', 1.2), A.pose('crank', { rot: [0, 0, 0], dur: 0 }), A.wait(1.5), A.remove('s', 'pop')] }).done();
  }),
  // A walk-in cold room 3 m long: insulated steel panels, a thick door on heavy hinges with a lever latch and a
  // thermometer; inside, sides of meat hang on hooks. The door opens in a puff of cold.
  e('meat locker', 'places', 'rooms', () => {
    const b = m('meat locker', { edge: S }), p = '#dfe6ea';
    b.box([3.2, 0.12, 2.6], [0, 0.06, 0], { color: '#9da3a8' })
      .box([3.2, 2.5, 0.12], [0, 1.37, -1.24], { color: p })
      .pair((s) => b.box([0.12, 2.5, 2.6], [s * 1.54, 1.37, 0], { color: p }))
      .box([3.3, 0.14, 2.7], [0, 2.69, 0], { color: '#c8d0d6' })
      .box([1.7, 2.5, 0.12], [-0.73, 1.37, 1.24], { color: p })
      .box([0.4, 2.5, 0.12], [1.36, 1.37, 1.24], { color: p })
      .box([1.0, 0.4, 0.12], [0.66, 2.42, 1.24], { color: p })
      .box([1.0, 2.0, 0.16], [0.66, 1.12, 1.32], { color: '#c8d0d6', round: 0.1, name: 'door', pivot: [1.16, 1.12, 1.32], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .box([0.08, 0.35, 0.08], [0.3, 1.1, 1.44], { color: '#8f99a3', parent: 'door' })
      .box([0.1, 0.12, 0.06], [0.3, 1.25, 1.42], { color: '#3a3633', parent: 'door' })
      .box([0.4, 0.22, 0.05], [-0.73, 1.9, 1.32], { color: '#2a2726' })
      .label('-18 C', [0.34, 0.16], [-0.73, 1.9, 1.35], { color: '#2a2726', depth: 0.01 })
      .stick([-1.3, 2.3, 0.0], [1.3, 2.3, 0.0], 0.06, '#8f99a3');
    b.each(3, (i) => {
      const x = -0.8 + i * 0.7;
      b.stick([x, 2.3, 0], [x, 2.05, 0], 0.02, '#c9ccd1')
        .ball([0.36, 0.8, 0.3], [x, 1.55, 0], { color: i === 1 ? '#c8643a' : '#b5543c', edge: F })
        .ball([0.08, 0.55, 0.04], [x + 0.06, 1.55, 0.15], { color: '#f2e6cf', noInk: true, edge: F });
    });
    b.box([0.6, 0.4, 0.5], [-1.0, 0.32, 0.6], { color: '#c8a870' });
    return b.act({ click: [[A.operate('door', 'open'), A.par(A.effect('snow', { dur: 2 }), A.say('Brrrr!', 1.4)), A.wait(1.5), A.operate('door', 'close'), A.say('Clunk', 0.8)]] }).done();
  }),
  // A dial meat thermometer pushed into a roast on its board: the steel probe and the round gauge, whose needle
  // swings up to "done".
  e('meat thermometer', 'kitchen', 'utensils', () => {
    const b = m('meat thermometer');
    return b.box([0.24, 0.02, 0.16], [0, 0.01, 0], { color: 'wood', edge: S })
      .ball([0.16, 0.08, 0.11], [0, 0.055, 0], { color: '#8a4a2a' })
      .ball([0.12, 0.03, 0.07], [0.01, 0.085, 0.01], { color: '#a05a32', noInk: true })
      .stick([0, 0.06, 0], [0, 0.15, 0], 0.005, '#c9ccd1', { edge: S })
      .cyl([0.055, 0.018, 0.055], [0, 0.175, 0], { color: '#c9ccd1', rot: [90, 0, 0], edge: S })
      .cyl([0.046, 0.004, 0.046], [0, 0.175, 0.009], { color: 'white', rot: [90, 0, 0], edge: S })
      .box([0.014, 0.004, 0.002], [0.012, 0.194, 0.0115], { color: '#e0473b', rot: [0, 0, -45], noInk: true })
      .box([0.003, 0.018, 0.003], [0, 0.183, 0.012], { color: '#2a2726', name: 'needle', pivot: [0, 0.175, 0.012], rot: [0, 0, 60] })
      .act({ click: [A.pose('needle', { rot: [0, 0, -100], dur: 1.5 }), A.say('Ding!', 1.2), A.wait(1), A.pose('needle', { rot: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A plate of spaghetti and meatballs in tomato sauce with basil; one meatball rolls off the top.
  e('meatball', 'food', 'meals', () => {
    const b = m('meatball');
    b.cyl([0.24, 0.014, 0.24], [0, 0.007, 0], { color: 'white', edge: S, name: 'plate' })
      .ball([0.18, 0.03, 0.17], [0, 0.025, 0], { color: '#f2d27a' });
    b.each(8, (i) => b.torus([0.06 + (i % 3) * 0.02, 0.06 + (i % 3) * 0.02, 0.004], [Math.cos(i) * 0.03, 0.035 + (i % 2) * 0.005, Math.sin(i) * 0.03], { color: '#f6dc8a', rot: [90, 0, i * 20], tube: 0.06, noInk: true }));
    b.ball([0.12, 0.02, 0.11], [0, 0.045, 0], { color: '#c8322a' })
      .ball(0.045, [-0.03, 0.065, 0.02], { color: '#7a4a2a' })
      .ball(0.045, [0.03, 0.065, 0.01], { color: '#6b3e26' })
      .ball(0.044, [0.0, 0.1, -0.005], { color: '#7a4a2a', name: 'top', parent: 'plate', piece: true })
      .ball([0.02, 0.006, 0.012], [0.03, 0.09, 0.03], { color: '#3f9a4a', noInk: true });
    return b.act({ click: [[A.detach('top', 'meatball'), A.say('Plop!', 1)], [A.reattach('top')]] }).done();
  }),
  // A gold medal on a red-white-blue ribbon hung on a little display post: a laurel rim, a raised star; it turns
  // and glints.
  e('medal', 'sports', 'awards', () => {
    const b = m('medal', { edge: S });
    b.box([0.1, 0.012, 0.06], [0, 0.006, 0], { color: 'darkwood' })
      .stick([0, 0.012, -0.02], [0, 0.3, -0.02], 0.008, 'darkwood')
      .box([0.04, 0.006, 0.02], [0, 0.29, -0.01], { color: 'darkwood' })
      .box([0.035, 0.2, 0.003], [-0.014, 0.19, 0.0], { color: '#e0473b', rot: [0, 0, -12], edge: F, name: 'medal', pivot: [0, 0.29, 0] })
      .box([0.035, 0.2, 0.003], [0.014, 0.19, 0.001], { color: '#2f4f8f', rot: [0, 0, 12], edge: F, parent: 'medal' })
      .box([0.012, 0.2, 0.0035], [0.014, 0.19, 0.0015], { color: 'white', rot: [0, 0, 12], parent: 'medal', noInk: true })
      .cyl([0.065, 0.006, 0.065], [0, 0.065, 0.003], { color: '#e2b23a', rot: [90, 0, 0], parent: 'medal' })
      .torus([0.066, 0.066, 0.008], [0, 0.065, 0.003], { color: '#c8962a', tube: 0.1, parent: 'medal' })
      .star(0.04, [0, 0.065, 0.007], { color: '#f6d24a', parent: 'medal', round: 0.003 });
    return b.act({ click: [A.pose('medal', { rot: [0, 360, 0], dur: 1 }), A.par(A.pose('medal', { rot: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 1 }), A.say('Ting!', 1))] }).done();
  }),
  // A brown pill bottle with a white label and a child-proof cap, a blister pack and capsules; the cap pops off.
  e('medicine', 'clinic', 'medicine', () => {
    const b = m('medicine');
    b.cyl([0.045, 0.075, 0.045], [0, 0.0375, 0], { color: '#c8702a', name: 'bottle', edge: S, round: 0.3 })
      .cyl([0.047, 0.04, 0.047], [0, 0.036, 0], { color: 'white', noInk: true, parent: 'bottle' })
      .label('Rx', [0.02, 0.014], [0, 0.04, 0.0235], { color: 'white', depth: 0.001, parent: 'bottle' })
      .cyl([0.05, 0.02, 0.05], [0, 0.085, 0], { color: 'white', name: 'cap', parent: 'bottle', piece: true, edge: S })
      .box([0.07, 0.004, 0.05], [0.06, 0.002, 0.03], { color: '#c9ccd1', edge: S, rot: [0, 20, 0] });
    b.each(4, (i) => b.ball([0.012, 0.004, 0.012], [0.04 + (i % 2) * 0.02, 0.006, 0.02 + Math.floor(i / 2) * 0.02], { color: '#d4d7da' }))
      .capsule([0.012, 0.028, 0.012], [-0.045, 0.006, 0.03], { color: '#e0473b', rot: [0, 30, 90] })
      .capsule([0.0122, 0.014, 0.0122], [-0.04, 0.006, 0.033], { color: 'white', rot: [0, 30, 90] });
    return b.act({ click: [[A.detach('cap', 'cap'), A.say('Pop!', 0.8)], [A.reattach('cap'), A.say('Click', 0.8)]] }).done();
  }),
  // A leather medicine ball 35 cm across, panelled with stitched seams and a yellow weight badge; it lands with
  // a thud.
  e('medicine ball', 'sports', 'gym', () => {
    const b = m('medicine ball');
    b.ball(0.35, [0, 0.175, 0], { color: '#3a3633', name: 'ball' })
      .torus([0.352, 0.352, 0.012], [0, 0.175, 0], { color: '#e0473b', rot: [0, 90, 0], tube: 0.04, parent: 'ball' })
      .torus([0.352, 0.352, 0.012], [0, 0.175, 0], { color: '#e0473b', rot: [90, 0, 0], tube: 0.04, parent: 'ball' })
      .torus([0.352, 0.352, 0.012], [0, 0.175, 0], { color: '#5c6166', tube: 0.03, parent: 'ball', noInk: true })
      .box([0.09, 0.05, 0.02], [0, 0.2, 0.165], { color: '#f6d24a', rot: [-8, 0, 0], parent: 'ball', edge: S })
      .label('5kg', [0.07, 0.03], [0, 0.2, 0.176], { color: '#f6d24a', depth: 0.003, rot: [-8, 0, 0], parent: 'ball' });
    return b.act({ click: [A.pose('ball', { move: [0, 0.4, 0], dur: 0.35 }), A.pose('ball', { move: [0, 0, 0], dur: 0.25 }), A.par(A.effect('dust', { dur: 0.8 }), A.say('THUD!', 1), A.anim('shake'))] }).done();
  }),
  // A loudhailer: the white horn with its red rim, the black body with the pistol grip and trigger and the
  // little microphone; it booms.
  e('megaphone', 'tech', 'gadgets', () => {
    const b = m('megaphone', { view: 'side' });
    b.cyl([0.25, 0.3, 0.25], [0, 0.26, 0.12], { color: 'white', taper: 0.3, rot: [-90, 0, 0], edge: S, name: 'horn', pivot: [0, 0.26, 0] })
      .torus([0.255, 0.255, 0.03], [0, 0.26, 0.27], { color: '#e0473b', tube: 0.08, parent: 'horn' })
      .cyl([0.21, 0.01, 0.21], [0, 0.26, 0.265], { color: '#5c6166', rot: [90, 0, 0], parent: 'horn', noInk: true })
      .cyl([0.09, 0.14, 0.09], [0, 0.26, -0.08], { color: '#2a2726', rot: [90, 0, 0], edge: S })
      .box([0.045, 0.17, 0.06], [0, 0.11, -0.06], { color: '#2a2726', round: 0.4, rot: [10, 0, 0] })
      .box([0.016, 0.04, 0.03], [0, 0.17, -0.02], { color: '#e0473b', edge: S })
      .capsule([0.04, 0.06, 0.04], [0, 0.3, -0.18], { color: '#3a3633', rot: [70, 0, 0] });
    return b.act({ click: [A.par(A.pose('horn', { scale: 1.1, dur: 0.15 }), A.say('BWAAARP!', 1.4), A.anim('shake')), A.pose('horn', { scale: 1, dur: 0.2 })] }).done();
  }),
  // A whole striped watermelon with a wedge cut out of it: red flesh with black seeds and a white-green rind; the
  // wedge comes away.
  e('melon', 'food', 'fruit', () => {
    const b = m('melon');
    b.ball([0.36, 0.26, 0.26], [0, 0.13, 0], { color: '#3f8a3a', name: 'melon' });
    for (const a of [0, 30, 60, 90, 120, 150]) b.ball([0.362, 0.264, 0.03], [0, 0.13, 0], { color: '#2a5a26', noInk: true, rot: [a, 0, 0], parent: 'melon' });
    b.wedge([0.16, 0.12, 0.05], [0.12, 0.2, 0.08], { color: '#e8483a', rot: [0, -30, 180], name: 'wedge', parent: 'melon', piece: true })
      .box([0.17, 0.02, 0.055], [0.12, 0.27, 0.08], { color: '#7cb85a', rot: [0, -30, 0], parent: 'wedge' })
      .box([0.17, 0.008, 0.056], [0.12, 0.258, 0.08], { color: '#f2f6d0', rot: [0, -30, 0], parent: 'wedge', noInk: true });
    b.each(4, (i) => b.ball([0.008, 0.012, 0.006], [0.09 + i * 0.022, 0.215 + (i % 2) * 0.015, 0.105 - i * 0.012], { color: '#2a2726', noInk: true, parent: 'wedge' }));
    return b.act({ click: [[A.detach('wedge', 'melon slice'), A.say('Slice!', 1)], [A.reattach('wedge')]] }).done();
  }),
  // A brass Hanukkah menorah: nine branches on a stepped stand, the shamash raised in the middle, blue and white
  // candles; the candles light one after another.
  e('menorah', 'toys', 'holiday', () => {
    const b = m('menorah', { edge: S });
    b.cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'gold', taper: 0.8 })
      .cyl([0.08, 0.02, 0.08], [0, 0.03, 0], { color: 'gold' })
      .stick([0, 0.04, 0], [0, 0.26, 0], 0.016, 'gold')
      .box([0.34, 0.016, 0.016], [0, 0.19, 0], { color: 'gold' });
    for (let k = 1; k <= 4; k++) b.arc([k * 0.08, k * 0.05, 0.012], [0, 0.19, 0], { color: 'gold', rot: [0, 0, 180], tube: 0.2 / k });
    b.each(9, (i) => {
      const x = -0.16 + i * 0.04, y = i === 4 ? 0.27 : 0.2;
      b.cyl([0.022, 0.015, 0.022], [x, y, 0], { color: 'gold' })
        .cyl([0.01, 0.05, 0.01], [x, y + 0.032, 0], { color: i === 4 ? 'white' : ['#4e8fd6', 'white'][i % 2], edge: F })
        .ball([0.012, 0.02, 0.012], [x, y + 0.067, 0], { color: '#ffd24a', glow: true, name: `flame${i}`, scale: 0, edge: F });
    });
    const light = (is: number[], k: number) => A.par(...is.map((i) => A.pose(`flame${i}`, { scale: k, dur: 0.2 })));
    return b.act({
      click: [
        [light([4], 1), A.wait(0.3), light([0, 8], 1), A.wait(0.3), light([1, 7], 1), A.wait(0.3), light([2, 6], 1), A.wait(0.3), light([3, 5], 1), A.effect('sparkle', { dur: 1 })],
        [light([0, 1, 2, 3, 4, 5, 6, 7, 8], 0), A.effect('smoke', { dur: 1 })],
      ],
    }).done();
  }),
  // A leather-bound restaurant menu standing open: the maroon cover, cream pages listing the dishes and prices;
  // it closes and opens.
  e('menu', 'food', 'restaurant', () => {
    const b = m('menu', { edge: S });
    b.box([0.16, 0.3, 0.012], [0.08, 0.15, 0], { color: '#7a2a32', round: 0.2 })
      .box([0.14, 0.27, 0.004], [0.08, 0.15, 0.007], { color: '#fff3d6' })
      .label('MENU', [0.1, 0.03], [0.08, 0.26, 0.01], { color: '#fff3d6', depth: 0.001 });
    b.each(6, (i) => b.box([0.09, 0.006, 0.002], [0.07, 0.22 - i * 0.03, 0.01], { color: '#5c6166', noInk: true }).box([0.02, 0.006, 0.002], [0.13, 0.22 - i * 0.03, 0.01], { color: '#a3322a', noInk: true }));
    b.box([0.16, 0.3, 0.012], [-0.069, 0.15, 0.04], { color: '#7a2a32', round: 0.2, name: 'cover', pivot: [0, 0.15, 0], rot: [0, 30, 0], mover: { kind: 'swing', axis: 'y', amount: 140 } })
      .box([0.14, 0.27, 0.004], [-0.0655, 0.15, 0.046], { color: '#fff3d6', parent: 'cover', rot: [0, 30, 0] });
    b.each(4, (i) => b.box([0.08, 0.006, 0.002], [-0.064, 0.22 - i * 0.035, 0.0495], { color: '#5c6166', noInk: true, parent: 'cover', rot: [0, 30, 0] }));
    return b.act({ click: [[A.operate('cover', 'open'), A.say('Flap', 0.8)], [A.operate('cover', 'close'), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // Mercury, the liquid metal: bright beads of it in a glass dish beside its sealed flask; the beads run together.
  e('mercury (material)', 'nature', 'elements', () => {
    const b = m('mercury (material)');
    b.cyl([0.2, 0.02, 0.2], [0, 0.01, 0], { color: '#d6f0fa', taper: 1.1, edge: S })
      .ball([0.08, 0.03, 0.07], [-0.02, 0.03, 0], { color: '#d8dde2', name: 'bead1' })
      .ball([0.04, 0.022, 0.04], [0.05, 0.028, 0.03], { color: '#d8dde2', name: 'bead2' })
      .ball([0.025, 0.016, 0.025], [0.04, 0.026, -0.04], { color: '#d8dde2', name: 'bead3' })
      .ball(0.012, [-0.035, 0.044, 0.012], { color: 'white', noInk: true, parent: 'bead1' })
      .cyl([0.05, 0.1, 0.05], [0.13, 0.05, -0.05], { color: '#d6f0fa', edge: S })
      .cyl([0.045, 0.04, 0.045], [0.13, 0.02, -0.05], { color: '#c8ccd1' })
      .cyl([0.03, 0.02, 0.03], [0.13, 0.11, -0.05], { color: '#2a2726', edge: S })
      .label('Hg', [0.03, 0.02], [0.13, 0.065, -0.024], { color: 'white', depth: 0.002 });
    return b.act({ click: [[A.par(A.pose('bead2', { move: [-0.05, 0, -0.025], scale: 0.5, dur: 0.6 }), A.pose('bead3', { move: [-0.045, 0, 0.035], scale: 0.5, dur: 0.6 }), A.pose('bead1', { scale: 1.2, dur: 0.6 })), A.say('Bloop', 0.8)], [A.par(A.pose('bead2', { move: [0, 0, 0], scale: 1, dur: 0.5 }), A.pose('bead3', { move: [0, 0, 0], scale: 1, dur: 0.5 }), A.pose('bead1', { scale: 1, dur: 0.5 }))]] }).done();
  }),
  // A fairground carousel 8 m across: a turning platform on a gilded base, painted horses on twisted brass poles
  // that rise and fall, the mirrored centre column, a scalloped red-and-white canopy with lights and a flag.
  e('merry go round', 'places', 'fairground', () => {
    const b = m('merry go round');
    b.cyl([8.2, 0.4, 8.2], [0, 0.2, 0], { color: '#e2b23a', segs: 16, edge: S })
      .cyl([7.8, 0.2, 7.8], [0, 0.5, 0], { color: '#a3322a', segs: 16, edge: S, name: 'platform', pivot: [0, 0.5, 0], mover: { kind: 'spin', axis: 'y', amount: 40 } })
      .cyl([1.2, 3.4, 1.2], [0, 2.3, 0], { color: '#e2b23a', segs: 12, edge: S, parent: 'platform' })
      .each(6, (i) => b.box([0.36, 1.4, 0.03], [Math.sin((i * Math.PI) / 3) * 0.6, 2.4, Math.cos((i * Math.PI) / 3) * 0.6], { color: '#bfe3f2', rot: [0, i * 60, 0], edge: S, parent: 'platform' }))
      .cyl([8.4, 0.5, 8.4], [0, 4.25, 0], { color: 'white', segs: 16, edge: S, parent: 'platform' })
      .cone([8.6, 1.8, 8.6], [0, 5.4, 0], { color: '#e0473b', segs: 16, parent: 'platform' })
      .stick([0, 6.2, 0], [0, 7.0, 0], 0.08, '#e2b23a', { parent: 'platform' })
      .box([0.6, 0.35, 0.03], [0.3, 6.85, 0], { color: '#2f6fc8', parent: 'platform' });
    b.each(16, (i) => {
      const a = (i / 16) * Math.PI * 2;
      b.cone([0.55, 0.35, 0.1], [Math.sin(a) * 4.15, 3.85, Math.cos(a) * 4.15], { color: i % 2 ? '#e0473b' : 'white', rot: [180, (a * 180) / Math.PI, 0], parent: 'platform' })
        .ball(0.12, [Math.sin(a) * 4.22, 4.25, Math.cos(a) * 4.22], { color: '#fff6c8', glow: true, parent: 'platform' });
    });
    const cols = ['white', '#8c5a2b', '#3a3633', '#d9b98a', '#9da3a8', 'white'];
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3, x = Math.sin(a) * 2.8, z = Math.cos(a) * 2.8, yaw = (a * 180) / Math.PI + 90, c = cols[i];
      const tx = Math.cos(a), tz = -Math.sin(a), y = 1.5;
      const n = `horse${i}`;
      b.stick([x, 0.6, z], [x, 4.0, z], 0.07, '#e2b23a', { parent: 'platform' })
        .ball([0.32, 0.38, 0.95], [x, y, z], { color: c, rot: [0, yaw, 0], name: n, parent: 'platform' })
        .rod([x + tx * 0.35, y + 0.1, z + tz * 0.35], [x + tx * 0.5, y + 0.45, z + tz * 0.5], 0.17, c, { parent: n })
        .ball([0.16, 0.18, 0.34], [x + tx * 0.6, y + 0.52, z + tz * 0.6], { color: c, rot: [20, yaw, 0], parent: n })
        .ball([0.08, 0.3, 0.14], [x + tx * 0.42, y + 0.45, z + tz * 0.42], { color: '#e2b23a', rot: [0, yaw, 20], parent: n })
        .box([0.34, 0.06, 0.3], [x, y + 0.2, z], { color: '#e0473b', rot: [0, yaw, 0], parent: n });
      for (const [u, k] of [[0.28, 1], [-0.28, -1]] as const) b.rod([x + tx * u, y - 0.1, z + tz * u], [x + tx * (u + k * 0.15), y - 0.6, z + tz * (u + k * 0.15)], 0.08, c, { parent: n });
    });
    const bob = (k: number) => A.par(...[0, 1, 2, 3, 4, 5].map((i) => A.pose(`horse${i}`, { move: [0, (i % 2 ? k : -k) * 0.25, 0], dur: 0.8 })));
    return b.act({
      click: [
        [A.operate('platform', 'on'), A.say('Oom-pah-pah!', 1.6), bob(1), bob(-1), bob(1), bob(0)],
        [A.operate('platform', 'off'), A.say('Wheee...', 1.2)],
      ],
    }).done();
  }),
  // A mesa 12 m high: a flat-topped table of red rock with banded cliffs above a skirt of scree, a saguaro at its
  // foot; a boulder tumbles off its rim in a cloud of dust. (A hill-sized version; the vocabulary's 3 m is far
  // too small for a mesa.)
  e('mesa', 'nature', 'landforms', () => {
    const b = m('mesa');
    b.cyl([34, 3, 26], [0, 1.5, 0], { color: '#d9a070', taper: 0.8, segs: 14 })
      .cyl([26, 8.4, 19], [0, 7.2, 0], { color: '#c8643a', taper: 0.94, segs: 12, edge: S, name: 'rock' })
      .cyl([25.6, 1.2, 18.7], [0, 5.0, 0], { color: '#a84a2a', taper: 0.99, segs: 12, noInk: true, edge: S })
      .cyl([24.8, 1.0, 18.1], [0, 8.3, 0], { color: '#e08a5a', taper: 0.99, segs: 12, noInk: true, edge: S })
      .cyl([24.6, 0.4, 17.9], [0, 11.6, 0], { color: '#b85a30', segs: 12, edge: S })
      .ball([2.2, 1.2, 2.0], [6, 11.3, 6.6], { color: '#a84a2a', name: 'boulder', parent: 'rock', piece: true })
      .capsule([0.5, 3.0, 0.5], [12, 4.0, 10], { color: '#3f8a3a' })
      .capsule([0.3, 1.2, 0.3], [12.5, 4.2, 10], { color: '#3f8a3a', rot: [0, 0, -30] })
      .ball([3, 1.4, 2.5], [-14, 0.7, 10], { color: '#b8a070' });
    return b.act({ click: [[A.par(A.detach('boulder', 'boulder'), A.effect('dust', { dur: 2.5 }), A.say('Rumble rumble...', 1.6))], [A.reattach('boulder')]] }).done();
  }),
  // A canvas messenger bag: the big flap with two buckled straps that lifts open, a front pocket, and the wide
  // shoulder strap.
  e('messenger bag', 'wardrobe', 'bags', () => {
    const b = m('messenger bag'), c = '#6b6b3a';
    b.box([0.38, 0.28, 0.12], [0, 0.14, 0], { color: c, round: 0.3 })
      .box([0.39, 0.22, 0.02], [0, 0.18, 0.066], { color: '#55552e', round: 0.3, name: 'flap', pivot: [0, 0.285, 0.066], mover: { kind: 'swing', axis: 'x', amount: -120 } })
      .pair((s) => b.box([0.03, 0.12, 0.012], [s * 0.1, 0.16, 0.078], { color: '#3a2a20', parent: 'flap' }).box([0.035, 0.025, 0.014], [s * 0.1, 0.1, 0.08], { color: '#c9ccd1', edge: S, parent: 'flap' }))
      .box([0.2, 0.1, 0.02], [0, 0.07, 0.065], { color: '#55552e', round: 0.3 })
      .rod([-0.19, 0.25, 0], [-0.12, 0.6, 0], 0.045, '#2a2726')
      .rod([-0.12, 0.6, 0], [0.12, 0.6, 0], 0.045, '#2a2726')
      .rod([0.12, 0.6, 0], [0.19, 0.25, 0], 0.045, '#2a2726')
      .box([0.06, 0.04, 0.03], [0.14, 0.5, 0], { color: '#c9ccd1', edge: S })
      .socket('inside', [0, 0.12, 0], 'inside', { size: 0.3 });
    return b.act({ click: [[A.operate('flap', 'open'), A.say('Rip!', 0.8)], [A.operate('flap', 'close')]] }).done();
  }),
  // A metal detector: the search coil on its shaft, the control box with its glowing screen and dial, the grip
  // and the arm cuff; it sweeps, beeps and finds a coin.
  e('metal detector', 'tech', 'gadgets', () => {
    const b = m('metal detector');
    b.cyl([0.3, 0.035, 0.22], [-0.45, 0.02, 0], { color: '#2a2726', name: 'coil', pivot: [-0.34, 0.12, 0] })
      .torus([0.27, 0.19, 0.04], [-0.45, 0.03, 0], { color: '#f6d24a', rot: [90, 0, 0], tube: 0.12, parent: 'coil' })
      .rod([-0.45, 0.04, 0], [-0.34, 0.12, 0], 0.03, '#5c6166', { parent: 'coil' })
      .stick([-0.34, 0.12, 0], [0.25, 0.92, 0], 0.03, '#c9ccd1', { edge: S })
      .box([0.16, 0.1, 0.08], [0.06, 0.7, 0.03], { color: '#3a3633', rot: [0, 0, -36], edge: S })
      .box([0.08, 0.045, 0.01], [0.06, 0.72, 0.072], { color: '#9be34d', rot: [0, 0, -36], glow: true, name: 'screen', mover: { kind: 'light' }, edge: S })
      .capsule([0.04, 0.14, 0.04], [0.16, 0.83, 0.0], { color: '#2a2726', rot: [0, 0, -36] })
      .arc([0.12, 0.1, 0.06], [0.28, 0.96, 0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.2, arc: 220 });
    return b.act({
      click: [
        [A.operate('screen', 'on'), A.pose('coil', { rot: [0, 25, 0], dur: 0.5 }), A.pose('coil', { rot: [0, -25, 0], dur: 0.5 }), A.say('Beep... beep... BEEP!', 1.6), A.spawn('c', 'nickel', { rel: 'front', of: 'self', dist: 'close' }), A.effect('sparkle', { dur: 1 }), A.pose('coil', { rot: [0, 0, 0], dur: 0.3 }), A.wait(1.5), A.remove('c', 'fade'), A.operate('screen', 'off')],
      ],
    }).done();
  }),
  // A handheld dynamic microphone: the black tapering handle, the silver collar and the mesh ball grille, on a
  // little desk stand; it goes "testing".
  e('microphone', 'music', 'audio', () => {
    const b = m('microphone');
    b.cyl([0.08, 0.012, 0.08], [0, 0.006, 0], { color: '#2a2726', edge: S })
      .stick([0, 0.012, 0], [0, 0.05, 0], 0.012, '#5c6166', { edge: S })
      .cyl([0.032, 0.15, 0.032], [0, 0.12, 0.0], { color: '#2a2726', taper: 1.35, rot: [-15, 0, 0], name: 'mic', pivot: [0, 0.05, 0] })
      .cyl([0.046, 0.014, 0.046], [0, 0.19, 0.02], { color: '#c9ccd1', rot: [-15, 0, 0], parent: 'mic', edge: S })
      .ball(0.06, [0, 0.225, 0.028], { color: '#9da3a8', parent: 'mic' })
      .torus([0.061, 0.061, 0.008], [0, 0.225, 0.028], { color: '#5c6166', rot: [75, 0, 0], tube: 0.08, parent: 'mic' })
      .box([0.012, 0.02, 0.006], [0, 0.13, 0.025], { color: '#c9ccd1', parent: 'mic', edge: S });
    return b.act({ click: [A.par(A.pose('mic', { rot: [8, 0, 0], dur: 0.1 }), A.say('Tap tap... eeeee!', 1.5)), A.pose('mic', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A boom microphone stand: a tripod base, the telescoping upright with its clutch, the boom arm with a
  // counterweight and the mic in its clip at singing height; the boom swings round.
  e('microphone stand', 'music', 'audio', () => {
    const b = m('microphone stand', { edge: S });
    around(3, 0.38, Math.PI / 2).forEach(([x, z]) => b.rod([0, 0.18, 0], [x, 0.01, z], 0.025, '#2a2726'));
    b.stick([0, 0.1, 0], [0, 0.75, 0], 0.035, '#2a2726')
      .cyl([0.055, 0.05, 0.055], [0, 0.76, 0], { color: '#5c6166' })
      .stick([0, 0.76, 0], [0, 1.15, 0], 0.022, '#3a3633')
      .ball(0.05, [0, 1.16, 0], { color: '#5c6166', name: 'boom', pivot: [0, 1.16, 0] })
      .stick([-0.25, 1.03, 0], [0.4, 1.38, 0.0], 0.02, '#2a2726', { parent: 'boom' })
      .cyl([0.08, 0.08, 0.08], [-0.27, 1.02, 0], { color: '#3a3633', rot: [0, 0, 62], parent: 'boom' })
      .capsule([0.035, 0.15, 0.035], [0.46, 1.42, 0], { color: '#2a2726', rot: [0, 0, -60], parent: 'boom', edge: F })
      .ball(0.06, [0.53, 1.46, 0], { color: '#9da3a8', parent: 'boom', edge: F });
    return b.act({ click: [A.pose('boom', { rot: [0, 90, 0], dur: 0.6 }), A.say('Eeeeee!', 1.2), A.pose('boom', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A school compound microscope: the heavy base with its lamp, the curved arm, the stage with slide clips, the
  // turret of three objectives that clicks round, the eyepiece tube and the focus knobs.
  e('microscope', 'study', 'science', () => {
    const b = m('microscope', { edge: S });
    b.box([0.16, 0.035, 0.2], [0, 0.0175, 0], { color: 'white', round: 0.4 })
      .cyl([0.04, 0.02, 0.04], [0, 0.045, 0.03], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .box([0.05, 0.1, 0.05], [0, 0.085, -0.07], { color: 'white', round: 0.3 })
      .rod([0, 0.13, -0.075], [0, 0.26, -0.06], 0.05, 'white')
      .rod([0, 0.26, -0.06], [0, 0.3, -0.02], 0.045, 'white')
      .box([0.13, 0.012, 0.12], [0, 0.14, 0.03], { color: '#2a2726' })
      .box([0.075, 0.003, 0.025], [0, 0.148, 0.03], { color: '#bfe3f2' })
      .pair((s) => b.box([0.012, 0.004, 0.04], [s * 0.04, 0.149, 0.04], { color: '#c9ccd1' }))
      .cyl([0.06, 0.025, 0.06], [0, 0.24, 0.025], { color: '#2a2726', name: 'turret', pivot: [0, 0.24, 0.025] });
    around(3, 0.018).forEach(([x, z], i) => b.cyl([0.014, 0.04 + i * 0.008, 0.014], [x, 0.21 - i * 0.004, 0.025 + z], { color: '#c9ccd1', parent: 'turret' }));
    b.stick([0, 0.255, 0.02], [0, 0.36, -0.04], 0.034, 'white')
      .cyl([0.03, 0.04, 0.03], [0, 0.375, -0.05], { color: '#2a2726', rot: [-30, 0, 0] })
      .pair((s) => b.cyl([0.045, 0.014, 0.045], [s * 0.035, 0.18, -0.07], { color: '#5c6166', rot: [0, 0, 90] }));
    return b.act({ click: [[A.operate('lamp', 'on'), A.pose('turret', { rot: [0, 120, 0], dur: 0.4 }), A.say('Click!', 0.8)], [A.pose('turret', { rot: [0, 0, 0], dur: 0.4 }), A.operate('lamp', 'off')]] }).done();
  }),
  // A countertop microwave: the steel case, the door with its dark window (it swings open on the left), the
  // keypad and display, and inside a glass turntable that turns under the light; a mug of coffee warms up.
  e('microwave', 'kitchen', 'appliances', () => {
    const b = m('microwave', { edge: S });
    b.box([0.5, 0.3, 0.4], [0, 0.155, 0], { color: '#c9ccd1', round: 0.1 })
      .box([0.46, 0.012, 0.36], [0, 0.005, 0], { color: '#2a2726' })
      .box([0.34, 0.26, 0.02], [-0.07, 0.155, 0.21], { color: '#5c6166', name: 'door', pivot: [-0.24, 0.155, 0.21], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.26, 0.18, 0.006], [-0.075, 0.155, 0.222], { color: '#2a3440', parent: 'door' })
      .box([0.02, 0.2, 0.025], [0.08, 0.155, 0.225], { color: '#c9ccd1', parent: 'door' })
      .box([0.11, 0.26, 0.012], [0.18, 0.155, 0.204], { color: '#2a2726' })
      .box([0.08, 0.03, 0.006], [0.18, 0.255, 0.212], { color: '#9be34d', glow: true, name: 'display', mover: { kind: 'light' } });
    b.each(9, (i) => b.box([0.018, 0.012, 0.006], [0.155 + (i % 3) * 0.025, 0.2 - Math.floor(i / 3) * 0.022, 0.212], { color: '#9da3a8' }))
      .box([0.07, 0.022, 0.006], [0.18, 0.11, 0.212], { color: '#3f9a4a' })
      .cyl([0.26, 0.008, 0.26], [-0.07, 0.03, 0.0], { color: '#bfe3f2', name: 'turntable', mover: { kind: 'spin', axis: 'y', amount: 90 } })
      .ball(0.04, [-0.07, 0.27, -0.12], { color: '#fff6c8', glow: true, name: 'light', mover: { kind: 'light' } })
      .socket('inside', [-0.07, 0.035, 0.0], 'inside', { size: 0.18, part: 'turntable' });
    return b.act({
      setup: [A.spawn('mug', 'mug'), A.attach('mug', 'self', 'inside')],
      click: [
        [A.par(A.operate('turntable', 'on'), A.operate('light', 'on'), A.operate('display', 'on')), A.say('Mmmmmm...', 2.5), A.wait(2.5), A.par(A.operate('turntable', 'off'), A.operate('light', 'off')), A.say('Ding!', 1), A.operate('display', 'off')],
        [A.operate('door', 'open'), A.effect('steam', { dur: 1.5 }, ), A.wait(2), A.operate('door', 'close')],
      ],
    }).done();
  }),
  // A litre carton of milk with a gable top: a blue band, a black-and-white cow pattern and a cow, and the
  // spout, which opens; it tips and pours.
  e('milk', 'food', 'drinks', () => {
    const b = m('milk', { edge: S });
    b.box([0.075, 0.18, 0.075], [0, 0.09, 0], { color: 'white', round: 0.1 })
      .wedge([0.075, 0.04, 0.075], [0, 0.2, 0], { color: 'white', rot: [0, 90, 0] })
      .box([0.012, 0.016, 0.075], [0, 0.226, 0], { color: 'white' })
      .box([0.077, 0.035, 0.077], [0, 0.14, 0], { color: '#4e8fd6', noInk: true })
      .label('MILK', [0.06, 0.022], [0, 0.14, 0.039], { color: '#4e8fd6', depth: 0.002 })
      .ball([0.03, 0.025, 0.004], [-0.015, 0.07, 0.039], { color: '#2a2726', noInk: true, edge: F })
      .ball([0.02, 0.02, 0.004], [0.02, 0.04, 0.039], { color: '#2a2726', noInk: true, edge: F })
      .ball([0.004, 0.025, 0.02], [-0.039, 0.06, 0.01], { color: '#2a2726', noInk: true, edge: F })
      .box([0.03, 0.03, 0.004], [0.0, 0.205, 0.035], { color: 'white', rot: [-60, 0, 0], name: 'spout', pivot: [0, 0.19, 0.035], mover: { kind: 'swing', axis: 'x', amount: 50 } });
    return b.act({ click: [A.operate('spout', 'open'), A.set({ tilt: -50, dur: 0.5 }), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Glug glug', 1.2)), A.set({ tilt: 0, dur: 0.5 }), A.operate('spout', 'close')] }).done();
  }),
  // An old-fashioned glass pint bottle of milk with a wide neck, a printed band and a foil cap, which peels off.
  e('milk bottle', 'food', 'drinks', () => {
    const b = m('milk bottle');
    return b.cyl([0.075, 0.13, 0.075], [0, 0.065, 0], { color: '#fbf9f2', name: 'bottle', edge: S, round: 0.3 })
      .ball([0.075, 0.06, 0.075], [0, 0.13, 0], { color: '#fbf9f2', parent: 'bottle' })
      .cyl([0.05, 0.05, 0.05], [0, 0.17, 0], { color: '#fbf9f2', taper: 0.95, parent: 'bottle' })
      .torus([0.052, 0.052, 0.008], [0, 0.192, 0], { color: '#d6f0fa', rot: [90, 0, 0], tube: 0.12, parent: 'bottle' })
      .cyl([0.077, 0.03, 0.077], [0, 0.06, 0], { color: '#4e8fd6', noInk: true, parent: 'bottle' })
      .cyl([0.052, 0.01, 0.052], [0, 0.199, 0], { color: '#c9ccd1', name: 'cap', parent: 'bottle', piece: true, edge: S })
      .act({ click: [[A.detach('cap', 'foil cap'), A.say('Pop!', 0.8)], [A.reattach('cap')]] })
      .done();
  }),
  // A blue plastic milk crate with open grid sides, carrying four pint bottles; one lifts out and goes back.
  e('milk crate', 'kitchen', 'storage', () => {
    const b = m('milk crate', { edge: S });
    b.box([0.33, 0.02, 0.33], [0, 0.01, 0], { color: '#2f6fc8' })
      .pair((s) => b.box([0.33, 0.28, 0.02], [0, 0.15, s * 0.155], { color: '#2f6fc8', round: 0.15 }).box([0.02, 0.28, 0.33], [s * 0.155, 0.15, 0], { color: '#2f6fc8', round: 0.15 }));
    for (const x of [-0.09, 0, 0.09]) for (const y of [0.09, 0.2]) b.box([0.06, 0.07, 0.024], [x, y, 0.16], { color: '#1f4f9a', noInk: true }).box([0.024, 0.07, 0.06], [0.16, y, x], { color: '#1f4f9a', noInk: true });
    let i = 0;
    for (const x of [-0.07, 0.07]) for (const z of [-0.07, 0.07]) {
      const n = `bottle${i++}`;
      b.cyl([0.062, 0.2, 0.062], [x, 0.12, z], { color: '#fbf9f2', name: n, edge: F, round: 0.4 })
        .cyl([0.044, 0.04, 0.044], [x, 0.24, z], { color: '#fbf9f2', parent: n, edge: F })
        .cyl([0.046, 0.008, 0.046], [x, 0.262, z], { color: '#c9ccd1', parent: n });
    }
    return b.act({ click: [A.pose('bottle3', { move: [0, 0.25, 0], dur: 0.5 }), A.say('Clink!', 0.8), A.wait(0.8), A.pose('bottle3', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A gallon jug of milk: moulded plastic with its carry handle, a red screw cap that comes off and a red label.
  e('milk jug', 'food', 'drinks', () => {
    const b = m('milk jug');
    b.box([0.15, 0.22, 0.15], [0, 0.11, 0], { color: '#fbf9f2', round: 0.45, name: 'jug' })
      .box([0.152, 0.07, 0.152], [0, 0.1, 0], { color: '#e0473b', noInk: true, round: 0.45, parent: 'jug' })
      .label('MILK', [0.08, 0.03], [0, 0.1, 0.077], { color: '#e0473b', depth: 0.002, parent: 'jug' })
      .cyl([0.06, 0.04, 0.06], [-0.035, 0.235, 0], { color: '#fbf9f2', taper: 0.7, parent: 'jug' })
      .cyl([0.04, 0.02, 0.04], [-0.035, 0.262, 0], { color: '#e0473b', name: 'cap', parent: 'jug', piece: true, edge: S })
      .torus([0.07, 0.1, 0.03], [0.045, 0.21, 0], { color: '#fbf9f2', tube: 0.25, rot: [0, 90, 0], parent: 'jug' });
    return b.act({ click: [[A.detach('cap', 'cap'), A.set({ tilt: -40, dur: 0.4 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Glug!', 1)), A.set({ tilt: 0, dur: 0.4 })], [A.reattach('cap')]] }).done();
  }),
  // A diner milkshake: a tall fluted glass of strawberry shake under whipped cream with a cherry (it comes off)
  // and a striped straw; it slurps.
  e('milkshake', 'food', 'drinks', () => {
    const b = m('milkshake');
    b.cyl([0.05, 0.012, 0.05], [0, 0.006, 0], { color: '#d6f0fa', edge: S })
      .stick([0, 0.012, 0], [0, 0.04, 0], 0.014, '#d6f0fa', { edge: S })
      .cyl([0.06, 0.16, 0.06], [0, 0.12, 0], { color: '#f4a1c0', taper: 1.45, name: 'glass' })
      .torus([0.09, 0.09, 0.008], [0, 0.2, 0], { color: '#d6f0fa', rot: [90, 0, 0], tube: 0.08, edge: S })
      .ball([0.085, 0.04, 0.085], [0, 0.21, 0], { color: 'white' })
      .ball([0.06, 0.04, 0.06], [0, 0.235, 0], { color: 'white' })
      .cone([0.035, 0.03, 0.035], [0, 0.26, 0], { color: 'white' })
      .ball(0.026, [0.005, 0.282, 0.005], { color: '#c8322a', name: 'cherry', parent: 'glass', piece: true })
      .rod([0.005, 0.294, 0.005], [0.015, 0.315, 0], 0.003, '#3f7a3a', { parent: 'cherry' })
      .stick([0.015, 0.1, 0], [-0.03, 0.31, 0.01], 0.009, '#e0473b', { name: 'straw', pivot: [0.015, 0.1, 0] });
    return b.act({ click: [[A.par(A.pose('straw', { rot: [0, 0, -6], dur: 0.3 }), A.say('Slurrrp!', 1.2)), A.pose('straw', { rot: [0, 0, 0], dur: 0.3 })], [A.detach('cherry', 'cherry')], [A.reattach('cherry')]] }).done();
  }),
  // An anti-tank mine half dug in: an olive steel disc with a pressure plate and fuse in a mound of dirt with a
  // warning stencil; it clicks... and goes off.
  e('mine (explosive)', 'armory', 'explosives', () => {
    const b = m('mine (explosive)');
    b.ball([0.5, 0.06, 0.44], [0, 0.02, 0], { color: '#8a6440' })
      .cyl([0.3, 0.07, 0.3], [0, 0.06, 0], { color: '#5a6a3a', edge: S, round: 0.3 })
      .cyl([0.18, 0.025, 0.18], [0, 0.105, 0], { color: '#4a5a2a', edge: S, name: 'plate', mover: { kind: 'slide', axis: 'y', amount: -0.012 } })
      .cyl([0.04, 0.03, 0.04], [0, 0.125, 0], { color: '#55595e', edge: S, parent: 'plate' })
      .box([0.1, 0.012, 0.004], [0, 0.07, 0.15], { color: '#f6d24a', noInk: true })
      .ball([0.1, 0.03, 0.08], [0.2, 0.03, -0.12], { color: '#7a5a3a' })
      .ball([0.08, 0.025, 0.07], [-0.22, 0.025, 0.1], { color: '#7a5a3a' });
    return b.act({ click: [A.operate('plate', 'down'), A.say('Click...', 1), A.wait(1), A.par(A.effect('explosion', { dur: 1.2 }), A.anim('shake', 2), A.say('KABOOM!', 1.4)), A.operate('plate', 'up')] }).done();
  }),
  // The mouth of a mine in a rocky hill: a timber portal with a lintel and sign, a lantern, rails running out of
  // the dark, and an ore cart full of rocks that rolls out on its wheels and back in.
  e('mine (place)', 'places', 'landmarks', () => {
    const b = m('mine (place)');
    b.ball([12, 7, 7], [0, 1.6, -2.2], { color: '#8f8c86' })
      .ball([5, 3.2, 3], [-4.2, 1.0, 0.4], { color: '#7f7c76' })
      .ball([4, 2.6, 3], [4.4, 0.8, 0.2], { color: '#9a968e' })
      .box([2.6, 2.8, 0.6], [0, 1.4, 1.0], { color: '#141210', edge: S })
      .pair((s) => b.box([0.3, 3.1, 0.3], [s * 1.4, 1.55, 1.35], { color: '#6b4228', edge: S }))
      .box([3.4, 0.35, 0.35], [0, 3.15, 1.35], { color: '#6b4228', edge: S })
      .box([1.6, 0.45, 0.06], [0, 3.6, 1.45], { color: '#d8b07a', edge: S })
      .label('GOLD MINE', [1.5, 0.36], [0, 3.6, 1.49], { color: '#d8b07a', depth: 0.02 })
      .stick([1.1, 2.9, 1.5], [1.1, 2.6, 1.5], 0.02, '#3a3633')
      .ball([0.2, 0.28, 0.2], [1.1, 2.45, 1.5], { color: '#ffd27a', glow: true, name: 'lantern', mover: { kind: 'light' }, edge: S })
      .pair((s) => b.box([0.06, 0.08, 4.6], [s * 0.42, 0.04, 2.6], { color: '#8f99a3', edge: S }));
    b.each(9, (i) => b.box([1.2, 0.05, 0.14], [0, 0.025, 0.8 + i * 0.5], { color: '#5a3a22', edge: S }));
    b.box([0.95, 0.55, 1.3], [0, 0.62, 1.8], { color: '#5c6166', edge: S, round: 0.1, name: 'cart', mover: { kind: 'slide', axis: 'z', amount: 2.6 } })
      .ball([0.8, 0.3, 1.1], [0, 0.92, 1.8], { color: '#6b5034', parent: 'cart' })
      .ball(0.18, [0.2, 1.02, 1.6], { color: '#e2b23a', parent: 'cart', glow: true });
    let n = 1;
    for (const z of [1.4, 2.2]) b.pair((s) => tyre(b, `wheel${n++}`, [s * 0.42, 0.2, z], 0.36, 0.08, '#55595e', 'cart'));
    return b.act({ click: [[A.operate('lantern', 'on'), A.operate('cart', 'out'), A.say('Clatter clatter!', 1.4)], [A.operate('cart', 'in'), A.operate('lantern', 'off')]] }).done();
  }),
  // A compact bar fridge 85 cm tall: a white cabinet with a door on its hinge, a recessed handle, a little freezer
  // box and shelves inside, and a can of soda waiting.
  e('mini fridge', 'kitchen', 'appliances', () => {
    const b = m('mini fridge', { edge: S });
    b.box([0.5, 0.82, 0.5], [0, 0.44, 0], { color: '#f2f0ea', round: 0.08 })
      .box([0.46, 0.03, 0.46], [0, 0.015, 0], { color: '#3a3633' })
      .box([0.44, 0.12, 0.3], [0, 0.72, 0.0], { color: '#d4d7da' })
      .box([0.44, 0.012, 0.4], [0, 0.4, 0.0], { color: '#bfe3f2' })
      .box([0.5, 0.78, 0.04], [0, 0.44, 0.27], { color: 'white', round: 0.15, name: 'door', pivot: [0.25, 0.44, 0.27], mover: { kind: 'swing', axis: 'y', amount: 110 } })
      .box([0.03, 0.2, 0.03], [-0.2, 0.62, 0.3], { color: '#9da3a8', parent: 'door' })
      .box([0.42, 0.04, 0.04], [0, 0.2, 0.24], { color: '#e8e4dc', parent: 'door' })
      .label('COOL', [0.12, 0.04], [0.15, 0.78, 0.292], { color: 'white', depth: 0.004, parent: 'door' })
      .socket('shelf', [0, 0.41, 0.0], 'inside', { size: 0.25 });
    return b.act({ setup: [A.spawn('can', 'soda'), A.attach('can', 'self', 'shelf')], click: [[A.operate('door', 'open'), A.say('Brrr!', 1.2), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A short pleated miniskirt in tartan red on a little clip hanger: the waistband, the flared pleats and a
  // safety pin; it twirls.
  e('mini skirt', 'wardrobe', 'skirts', () => {
    const b = m('mini skirt');
    b.stick([0, 0.4, 0], [0, 0.46, 0], 0.006, 'silver', { edge: S })
      .arc([0.05, 0.04, 0.006], [0, 0.465, 0], { color: 'silver', arc: 220, edge: S })
      .box([0.34, 0.02, 0.02], [0, 0.39, 0], { color: '#3a3633', edge: S })
      .cyl([0.25, 0.05, 0.17], [0, 0.345, 0], { color: '#8a1a22' })
      .cyl([0.36, 0.27, 0.26], [0, 0.185, 0], { color: '#c8322a', taper: 0.7, rot: [180, 0, 0], segs: 16 });
    b.each(2, (i) => b.torus([0.33 - i * 0.04, 0.24 - i * 0.03, 0.012], [0, 0.11 + i * 0.1, 0], { color: '#2f4f8f', rot: [90, 0, 0], tube: 0.04, noInk: true }))
      .box([0.012, 0.05, 0.004], [0.08, 0.15, 0.115], { color: '#c9ccd1', rot: [0, 0, 20], edge: S });
    return b.act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1 }))] }).done();
  }),
  // A family minivan 5.1 m long: a tall soft body (a loft) with a long glasshouse, a sliding side door that
  // runs back, a tailgate, roof rails, lights that come on and seats for the driver.
  e('minivan', 'garage', 'cars', () => {
    const b = m('minivan', { view: 'side' });
    car(b, { L: 5.1, W: 1.96, H: 1.78, wheel: 0.68, axles: [1.6, -1.5], color: '#4f7fc0', belt: 1.02, hood: 0.18, tail: 0.04, pillars: [1.1, 0.0], door: [-0.45, 0.95], slide: true, nose: 0.7 });
    b.pair((s) => b.box([0.05, 0.06, 2.8], [s * 0.8, 1.81, -0.3], { color: '#3a3633', edge: S, parent: 'body' }))
      .socket('seat', [0.45, 0.6, 0.7], 'seat')
      .socket('seat2', [-0.45, 0.6, -0.4], 'seat');
    return b.act({
      click: [
        [A.operate('door', 'open'), A.say('Whirrr... thunk!', 1.4), A.wait(2), A.operate('door', 'close')],
        [A.par(A.operate('headlight', 'on'), A.operate('taillight', 'on')), A.say('Beep beep!', 1.2), A.wait(1.5), A.par(A.operate('headlight', 'off'), A.operate('taillight', 'off'))],
      ],
    }).done();
  }),
  // A pot of peppermint: a terracotta pot with a rim, and a bushy clump of square stems with pairs of serrated
  // bright leaves; a sprig is picked.
  e('mint', 'garden', 'herbs', () => {
    const b = m('mint');
    b.cyl([0.2, 0.18, 0.2], [0, 0.09, 0], { color: '#c8643a', taper: 1.2, edge: S })
      .cyl([0.25, 0.04, 0.25], [0, 0.19, 0], { color: '#b8582e', edge: S })
      .cyl([0.21, 0.01, 0.21], [0, 0.205, 0], { color: '#5a3a22' });
    const pts = around(7, 0.06, 0.4);
    [1, 2, 3, 4, 5, 6, 0].forEach((i) => {
      const [x, z] = pts[i];
      const h = 0.36 + (i % 3) * 0.06, n = i === 0 ? 'sprig' : `stem${i}`;
      b.stick([x * 0.5, 0.2, z * 0.5], [x * 1.3, h, z * 1.3], 0.006, '#5a8a3a', { name: n, ...(i === 0 ? { parent: 'stem1', piece: true } : {}) });
      b.each(3, (k) => b.pair((s) => b.ball([0.05, 0.012, 0.03], [x * (0.7 + k * 0.25) + s * 0.025, 0.25 + k * (h - 0.22) / 3, z * (0.7 + k * 0.25)], { color: k % 2 ? '#5aa553' : '#6ab04c', rot: [0, (i * 51 + k * 90) % 180, s * 25], parent: n })));
    });
    return b.act({ click: [[A.detach('sprig', 'mint sprig'), A.effect('sparkle', { dur: 0.8 }), A.say('Snip!', 1)], [A.reattach('sprig')]] }).done();
  }),
  // The minus sign as a sculpture: a chunky red bar on a little plinth; it flips over with a swish.
  e('minus sign', 'ideas', 'symbols', () =>
    m('minus sign', { edge: S })
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'wood', round: 0.3 })
      .box([0.012, 0.03, 0.012], [0, 0.035, 0], { color: '#5c6166' })
      .box([0.12, 0.03, 0.03], [0, 0.065, 0], { color: '#e0473b', round: 0.35, name: 'bar', pivot: [0, 0.065, 0] })
      .act({ click: [A.pose('bar', { rot: [360, 0, 0], dur: 0.6 }), A.pose('bar', { rot: [0, 0, 0], dur: 0 }), A.say('Swish!', 0.8)] })
      .done(),
  ),
  // A cheval mirror 1.6 m tall: an oval glass in a carved wooden frame, pivoting between two posts on a footed
  // stand; it tilts and catches the light.
  e('mirror', 'home', 'decor', () => {
    const b = m('mirror', { edge: S });
    b.pair((s) => b.box([0.06, 1.3, 0.06], [s * 0.36, 0.7, 0], { color: '#7a5230' }).box([0.08, 0.05, 0.5], [s * 0.36, 0.03, 0], { color: '#7a5230', round: 0.4 }).ball(0.07, [s * 0.36, 1.38, 0], { color: '#7a5230' }))
      .box([0.7, 0.05, 0.05], [0, 0.2, 0], { color: '#7a5230' })
      .torus([0.62, 1.12, 0.06], [0, 0.85, 0], { color: '#8a5a35', tube: 0.1, name: 'frame', pivot: [0, 0.85, 0] })
      .ball([0.55, 1.05, 0.02], [0, 0.85, 0.0], { color: '#cfe8f4', parent: 'frame' })
      .ball([0.12, 0.3, 0.005], [-0.12, 1.0, 0.012], { color: 'white', noInk: true, parent: 'frame', rot: [0, 0, 20] })
      .pair((s) => b.cyl([0.05, 0.04, 0.05], [s * 0.31, 0.85, 0], { color: 'brass', rot: [0, 0, 90] }));
    return b.act({ click: [A.pose('frame', { rot: [-18, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 1 }), A.pose('frame', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A rocket missile 6 m long standing on its launch pad beside a gantry: the white body, the nose cone, the red
  // fins and the exhaust bell; it lifts off in fire and smoke, and next time it is back.
  e('missile', 'armory', 'missiles', () => {
    const b = m('missile', { edge: S });
    b.box([2.6, 0.3, 2.6], [0, 0.15, 0], { color: '#9da3a8' })
      .box([0.3, 7.0, 0.3], [-1.1, 3.8, -0.6], { color: '#e0473b' })
      .each(6, (i) => b.box([0.9, 0.08, 0.08], [-0.75, 1.2 + i * 1.1, -0.6], { color: '#e0473b' }))
      .cyl([0.62, 4.6, 0.62], [0, 3.1, 0], { color: '#f2f0ea', segs: 18, name: 'missile', edge: F })
      .cone([0.62, 1.4, 0.62], [0, 6.1, 0], { color: '#e0473b', parent: 'missile', edge: F })
      .cyl([0.64, 0.3, 0.64], [0, 4.6, 0], { color: '#2a2726', parent: 'missile' })
      .label('USA', [0.4, 0.3], [0, 3.6, 0.31], { color: '#f2f0ea', depth: 0.02, parent: 'missile' })
      .cone([0.5, 0.4, 0.5], [0, 0.6, 0], { color: '#3a3633', taper: 0.7, rot: [180, 0, 0], parent: 'missile' });
    around(4, 0.5, Math.PI / 4).forEach(([x, z]) => b.wedge([0.06, 1.0, 0.7], [x, 1.2, z], { color: '#e0473b', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, 0], parent: 'missile', apex: -0.5 }));
    return b.act({
      click: [
        [A.say('Beep... beep... beep...', 1.8), A.wait(1.8), A.par(A.effect('fire', { dur: 2.5 }), A.effect('smoke', { dur: 3 }), A.say('WHOOOOSH!', 1.5), A.pose('missile', { move: [0, 30, 0], dur: 2.5 }))],
        [A.pose('missile', { move: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 1 })],
      ],
    }).done();
  }),
  // A sprig of mistletoe hung from a little hook on a red ribbon bow: forked stems, pairs of pale leaves and
  // white berries; underneath, hearts.
  e('mistletoe', 'garden', 'holiday plants', () => {
    const b = m('mistletoe');
    b.box([0.16, 0.02, 0.12], [0, 0.01, 0], { color: 'darkwood', edge: S })
      .stick([0, 0.02, -0.04], [0, 0.6, -0.04], 0.012, 'darkwood', { edge: S })
      .stick([0, 0.6, -0.04], [0, 0.6, 0.06], 0.012, 'darkwood', { edge: S })
      .stick([0, 0.6, 0.06], [0, 0.52, 0.06], 0.004, '#c8322a', { name: 'sprig', pivot: [0, 0.6, 0.06] })
      .pair((s) => b.ball([0.05, 0.03, 0.02], [s * 0.025, 0.52, 0.06], { color: '#c8322a', rot: [0, 0, s * 30], parent: 'sprig' }));
    const tips: V[] = [[-0.07, 0.38, 0.06], [0.06, 0.37, 0.08], [0.0, 0.34, 0.04], [-0.03, 0.4, 0.1], [0.08, 0.42, 0.04]];
    tips.forEach((t, i) => {
      b.rod([0, 0.5, 0.06], t, 0.006, '#9aa84a', { parent: 'sprig' })
        .ball([0.025, 0.06, 0.012], [t[0] + 0.012, t[1] + 0.01, t[2]], { color: '#8aa84a', rot: [0, i * 40, 30], parent: 'sprig' })
        .ball([0.025, 0.06, 0.012], [t[0] - 0.012, t[1] + 0.01, t[2]], { color: '#9ab85a', rot: [0, i * 40, -30], parent: 'sprig' })
        .ball(0.012, [t[0], t[1] + 0.02, t[2] + 0.01], { color: '#f7f5ef', parent: 'sprig' });
    });
    return b.act({ click: [A.par(A.pose('sprig', { rot: [0, 0, 10], dur: 0.3 }), A.effect('hearts', { dur: 1.8 }), A.say('Mwah!', 1.2)), A.pose('sprig', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A pair of knitted mittens joined by a string: a thumb each, ribbed cuffs and a snowflake pattern; they wave.
  e('mitten', 'wardrobe', 'gloves', () => {
    const b = m('mitten');
    b.pair((s) => {
      const n = s > 0 ? 'mittenL' : 'mittenR';
      b.box([0.1, 0.16, 0.04], [s * 0.08, 0.14, 0], { color: '#c8322a', round: 0.8, name: n, pivot: [s * 0.08, 0.05, 0] })
        .capsule([0.035, 0.07, 0.035], [s * 0.035, 0.15, 0.0], { color: '#c8322a', rot: [0, 0, s * 35], parent: n })
        .cyl([0.1, 0.05, 0.05], [s * 0.08, 0.04, 0], { color: 'white', parent: n })
        .star(0.04, [s * 0.08, 0.16, 0.022], { color: 'white', parent: n, round: 0.004 });
    });
    b.rod([0.08, 0.02, 0], [0, 0.0, 0.02], 0.006, '#c8322a').rod([0, 0.0, 0.02], [-0.08, 0.02, 0], 0.006, '#c8322a');
    return b.act({ click: [A.pose('mittenL', { rot: [0, 0, -20], dur: 0.25 }), A.pose('mittenL', { rot: [0, 0, 10], dur: 0.25 }), A.pose('mittenR', { rot: [0, 0, 20], dur: 0.25 }), A.pose('mittenR', { rot: [0, 0, -10], dur: 0.25 }), A.par(A.pose('mittenL', { rot: [0, 0, 0], dur: 0.25 }), A.pose('mittenR', { rot: [0, 0, 0], dur: 0.25 })), A.say('Flap flap', 1)] }).done();
  }),
  // A castle moat 16 m across: a ring of green water round a grassy island with a little stone keep, crossed by a
  // timber drawbridge that lowers over the water and rises again.
  e('moat', 'places', 'castles', () => {
    const b = m('moat', { edge: S });
    b.box([18, 0.3, 18], [0, 0.15, 0], { color: '#6ab04c' })
      .box([14, 0.32, 14], [0, 0.16, 0], { color: '#4f8a7a' })
      .box([7.2, 0.8, 7.2], [0, 0.4, 0], { color: '#5aa553' })
      .box([5, 5, 5], [0, 3.3, 0.5], { color: '#a7a7a0' });
    b.each(5, (i) => b.box([0.7, 0.8, 0.7], [-2.15 + i * 1.075, 6.2, 2.85], { color: '#a7a7a0' }).box([0.7, 0.8, 0.7], [-2.15 + i * 1.075, 6.2, -1.85], { color: '#a7a7a0' }));
    b.pair((s) => b.each(3, (i) => b.box([0.7, 0.8, 0.7], [s * 2.15, 6.2, -0.8 + i * 1.3], { color: '#a7a7a0' })));
    b.box([1.6, 2.2, 0.1], [0, 1.9, 3.02], { color: '#2a2422' })
      .arc([1.6, 1.6, 0.12], [0, 3.0, 3.03], { color: '#2a2422', tube: 0.5 })
      .box([1.8, 4.2, 0.16], [0, 2.9, 3.16], { color: '#8a5a35', name: 'bridge', pivot: [0, 0.8, 3.1], mover: { kind: 'swing', axis: 'x', amount: 90 } });
    b.each(8, (i) => b.box([1.82, 0.05, 0.02], [0, 1.1 + i * 0.5, 3.25], { color: '#6b4228', parent: 'bridge', noInk: true }));
    b.pair((s) => b.stick([s * 0.8, 4.9, 3.25], [s * 0.8, 5.6, 3.02], 0.04, '#3a3633'));
    return b.act({ click: [[A.operate('bridge', 'open'), A.say('Creeeak... clunk!', 1.6)], [A.operate('bridge', 'close'), A.say('Clank clank', 1.2)]] }).done();
  }),
  // A cot mobile on its arm: a wooden hanger with a felt moon, stars, a cloud and a bird hanging on threads; it
  // turns and plays a lullaby.
  e('mobile (baby)', 'toys', 'baby toys', () => {
    const b = m('mobile (baby)');
    b.box([0.12, 0.04, 0.08], [0, 0.02, -0.12], { color: 'white', edge: S })
      .stick([0, 0.04, -0.12], [0, 0.62, -0.12], 0.02, 'white', { edge: S })
      .rod([0, 0.62, -0.12], [0, 0.68, 0.0], 0.02, 'white', { edge: S })
      .cyl([0.06, 0.04, 0.06], [0, 0.66, 0.0], { color: '#f4a1c0', name: 'hub', edge: S, mover: { kind: 'spin', axis: 'y', amount: 60 } });
    const things = ['moon', 'star', 'cloud', 'bird'];
    around(4, 0.15).forEach(([x, z], i) => {
      b.rod([0, 0.64, 0], [x, 0.62, z], 0.008, 'wood', { parent: 'hub' })
        .stick([x, 0.62, z], [x, 0.48, z], 0.002, '#9da3a8', { parent: 'hub' });
      const at: V = [x, 0.44, z];
      if (things[i] === 'moon') b.arc([0.08, 0.08, 0.02], at, { color: '#f6d24a', rot: [0, 0, 120], arc: 200, tube: 0.4, parent: 'hub' });
      else if (things[i] === 'star') b.star(0.08, at, { color: '#f6dc8a', parent: 'hub' });
      else if (things[i] === 'cloud') b.ball([0.08, 0.05, 0.03], at, { color: 'white', parent: 'hub' }).ball([0.05, 0.04, 0.03], [x + 0.03, 0.46, z], { color: 'white', parent: 'hub' });
      else b.ball([0.07, 0.045, 0.035], at, { color: '#6fb8e8', parent: 'hub' }).ball([0.03, 0.05, 0.01], [x, 0.47, z], { color: '#4e8fd6', parent: 'hub', rot: [0, 0, 30] });
    });
    return b.act({ click: [[A.operate('hub', 'on'), A.say('Twinkle twinkle...', 2)], [A.operate('hub', 'off')]] }).done();
  }),
  // A single-wide mobile home 14 m long on its skirting: ribbed siding with a stripe, windows with shutters, a
  // door up a flight of steps under a little awning, a porch lamp, a hitch at the end and an air conditioner.
  e('mobile home', 'places', 'houses', () => {
    const b = m('mobile home', { edge: S }), wall = '#f2ece0';
    b.box([14, 0.7, 4.0], [0, 0.35, 0], { color: '#9da3a8' })
      .box([14, 2.8, 4.3], [0, 2.1, 0], { color: wall, round: 0.03 })
      .box([14.1, 0.2, 4.35], [0, 2.4, 0], { color: '#4f7fc0' })
      .box([14.2, 0.3, 4.5], [0, 3.55, 0], { color: '#c8c2b4', round: 0.4 })
      .box([1.0, 0.5, 0.8], [5.0, 3.9, -0.6], { color: '#d4d7da' })
      .box([0.3, 0.3, 1.4], [-7.2, 0.6, 0], { color: '#3a3633' })
      .wedge([1.4, 0.6, 1.4], [-7.6, 0.6, 0], { color: '#3a3633', rot: [0, 90, 0] });
    for (const x of [-5, -2, 4.5]) {
      win(b, [x, 2.1, 2.15], 1.4, 1.0, { frame: 'white' });
      b.pair((s) => b.box([0.35, 1.1, 0.05], [x + s * 0.95, 2.1, 2.18], { color: '#2f4f8f' }));
    }
    door(b, [1.2, 0.75, 2.15], 0.9, 2.0, { color: '#c8c2b4', glass: true });
    b.each(3, (i) => b.box([1.1, 0.12, 0.35], [1.2, 0.18 + i * 0.22, 2.9 - i * 0.3], { color: '#8a6440' }))
      .box([2.2, 0.08, 1.4], [1.2, 3.0, 2.85], { color: '#4f7fc0', rot: [-12, 0, 0] });
    lamp(b, 'porchlight', 0.2, [0.4, 2.7, 2.25], '#ffe9a0');
    return b.act({ click: [[A.par(A.operate('door', 'open'), A.operate('porchlight', 'on')), A.say('Creak', 1), A.wait(2), A.operate('door', 'close')], [A.operate('porchlight', 'off')]] }).done();
  }),
  // A home internet modem-router: a black box on feet with two aerials and a row of status lights that blink.
  e('modem', 'tech', 'electronics', () => {
    const b = m('modem', { edge: S });
    b.box([0.24, 0.05, 0.16], [0, 0.035, 0], { color: '#2a2726', round: 0.3 })
      .pair((s) => b.box([0.03, 0.01, 0.12], [s * 0.09, 0.005, 0], { color: '#3a3633' }))
      .pair((s) => b.stick([s * 0.1, 0.05, -0.07], [s * 0.11, 0.22, -0.08], 0.012, '#2a2726').cyl([0.018, 0.02, 0.018], [s * 0.1, 0.05, -0.07], { color: '#3a3633' }));
    b.each(4, (i) => lamp(b, `led${i}`, [0.012, 0.006, 0.004], [-0.06 + i * 0.03, 0.04, 0.081], i === 3 ? '#f0923b' : '#9be34d', { box: true }));
    b.label('NET', [0.04, 0.012], [0.08, 0.04, 0.081], { color: '#2a2726', depth: 0.002 });
    const led = (i: number, on: boolean) => A.operate(`led${i}`, on ? 'on' : 'off');
    return b.act({ click: [led(0, true), A.wait(0.3), led(1, true), A.wait(0.3), led(2, true), A.wait(0.3), led(3, true), A.say('Beep! Online.', 1.2), A.wait(0.4), led(2, false), A.wait(0.2), led(2, true), A.wait(0.2), led(2, false), A.wait(0.2), A.par(led(0, false), led(1, false), led(3, false))] }).done();
  }),
  // A tin of dark molasses with its lid off and a spoon in it, a sticky drip down the side; it pours v-e-r-y
  // slowly.
  e('molasses', 'food', 'sweets', () => {
    const b = m('molasses');
    b.cyl([0.1, 0.13, 0.1], [0, 0.065, 0], { color: '#c8a050', name: 'tin', edge: S })
      .cyl([0.102, 0.06, 0.102], [0, 0.07, 0], { color: '#2f4f8f', noInk: true, parent: 'tin', edge: S })
      .label('MOLASSES', [0.07, 0.016], [0, 0.07, 0.052], { color: '#2f4f8f', depth: 0.002, parent: 'tin' })
      .cyl([0.094, 0.005, 0.094], [0, 0.128, 0], { color: '#2a1608' })
      .ball([0.012, 0.04, 0.008], [0.03, 0.11, 0.046], { color: '#2a1608', name: 'drip' })
      .rod([-0.01, 0.12, 0.0], [-0.04, 0.2, 0.02], 0.01, '#c9ccd1', { edge: S })
      .cyl([0.11, 0.008, 0.11], [0.09, 0.004, 0.05], { color: '#c8a050', edge: S });
    return b.act({ click: [A.set({ tilt: -30, dur: 1.5 }), A.par(A.pose('drip', { move: [0, -0.05, 0], scale: 1.5, dur: 2.5 }), A.say('Glooooop...', 2.5)), A.set({ tilt: 0, dur: 1 }), A.pose('drip', { move: [0, 0, 0], scale: 1, dur: 0.5 })] }).done();
  }),
  // A sample length of plaster crown moulding on a little display stand: an ogee curve with beads and a fillet,
  // shown end-on; it turns to show its profile.
  e('molding', 'workshop', 'building parts', () => {
    const b = m('molding', { edge: S });
    b.box([0.5, 0.02, 0.14], [0, 0.01, 0], { color: 'darkwood' })
      .box([0.48, 0.04, 0.05], [0, 0.04, -0.03], { color: '#f2ece0', name: 'trim', pivot: [0, 0.07, 0] })
      .cyl([0.04, 0.48, 0.04], [0, 0.07, 0.0], { color: '#f2ece0', rot: [0, 0, 90], parent: 'trim' })
      .box([0.48, 0.02, 0.03], [0, 0.1, -0.02], { color: '#f7f5ef', parent: 'trim' })
      .cyl([0.022, 0.48, 0.022], [0, 0.118, 0.012], { color: '#f2ece0', rot: [0, 0, 90], parent: 'trim' })
      .box([0.48, 0.02, 0.06], [0, 0.135, -0.015], { color: '#f7f5ef', parent: 'trim' });
    b.each(12, (i) => b.ball(0.012, [-0.22 + i * 0.04, 0.056, 0.0], { color: '#e8e0cc', parent: 'trim' }));
    return b.act({ click: [A.pose('trim', { rot: [0, 90, 0], dur: 0.6 }), A.wait(1), A.pose('trim', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A memorial column 14 m tall: a stepped granite base with a bronze plaque and wreath, a fluted column, and a
  // bronze statue on top; an eternal flame lights at its foot and doves take wing.
  e('monument', 'places', 'landmarks', () => {
    const b = m('monument', { edge: S }), st = '#d8d2c4';
    b.each(3, (i) => b.box([6 - i * 1.2, 0.4, 6 - i * 1.2], [0, 0.2 + i * 0.4, 0], { color: '#b8b2a4' }))
      .box([2.2, 2.6, 2.2], [0, 2.5, 0], { color: st })
      .box([2.5, 0.3, 2.5], [0, 3.95, 0], { color: st })
      .box([1.2, 0.8, 0.06], [0, 2.6, 1.13], { color: '#b0804a' })
      .label('LEST WE FORGET', [1.1, 0.25], [0, 2.75, 1.17], { color: '#b0804a', depth: 0.02 })
      .torus([0.8, 0.8, 0.14], [0, 1.9, 1.2], { color: '#3f7a3a', tube: 0.3, edge: F })
      .cyl([1.1, 7.0, 1.1], [0, 7.6, 0], { color: st, taper: 0.85, segs: 16 })
      .box([1.6, 0.4, 1.6], [0, 11.3, 0], { color: st })
      .box([1.2, 0.4, 1.2], [0, 11.7, 0], { color: st })
      .capsule([0.5, 1.2, 0.4], [0, 12.6, 0], { color: '#7a6a3a', edge: F })
      .ball(0.32, [0, 13.4, 0], { color: '#7a6a3a', edge: F })
      .rod([0.2, 12.9, 0], [0.55, 13.7, 0.1], 0.15, '#7a6a3a', { edge: F })
      .rod([-0.2, 12.9, 0], [-0.35, 12.3, 0.1], 0.15, '#7a6a3a', { edge: F })
      .cyl([0.4, 0.3, 0.4], [1.8, 0.95, 1.8], { color: '#5c6166' })
      .cone([0.25, 0.45, 0.25], [1.8, 1.32, 1.8], { color: '#ffb84a', glow: true, name: 'flame', scale: 0, edge: F });
    return b.act({ click: [[A.pose('flame', { scale: 1, dur: 0.5 }), A.spawn('dv', 'dove', { rel: 'above', of: 'self', dist: 'close' }), A.move('dv', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('dv', 'fade')], [A.pose('flame', { scale: 0, dur: 0.5 })]] }).done();
  }),
  // A planetarium model of the Moon 2 m across on its stand: grey with dark seas and pale craters; it turns to
  // show its far side and glows. (Planets and moons are 1-3 m models, as the size guide asks.)
  e('moon', 'sky', 'moons', () => {
    const b = m('moon');
    b.cyl([0.8, 0.1, 0.8], [0, 0.05, 0], { color: '#3a3633', edge: S })
      .stick([0, 0.1, 0], [0, 0.6, 0], 0.08, '#5c6166', { edge: S })
      .ball(2.0, [0, 1.6, 0], { color: '#c8c8c0', name: 'moon', glow: false, mover: { kind: 'light' } });
    const spots: Array<[number, number, number, string]> = [[0.3, 0.3, 0.5, '#8f8f88'], [-0.35, 0.1, 0.42, '#9a9a92'], [0.1, -0.45, 0.32, '#a0a098'], [-0.1, 0.55, 0.26, '#e0e0d8'], [0.55, -0.2, 0.22, '#e0e0d8'], [-0.55, -0.35, 0.2, '#8f8f88']];
    for (const [x, y, d, c] of spots) {
      const z = Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.98;
      b.ball([d, d, d * 0.3], [x, 1.6 + y, z], { color: c, parent: 'moon', noInk: true, rot: [(-Math.asin(y) * 180) / Math.PI, (Math.asin(x / Math.max(0.01, Math.hypot(x, z))) * 180) / Math.PI, 0] });
    }
    return b.act({ click: [[A.operate('moon', 'on'), A.pose('moon', { rot: [0, 180, 0], dur: 2 }), A.effect('sparkle', { dur: 1 })], [A.pose('moon', { rot: [0, 0, 0], dur: 2 }), A.operate('moon', 'off')]] }).done();
  }),
  // A string mop leaning in its yellow bucket with the wringer on top; it dunks, swishes and splashes.
  e('mop', 'home', 'cleaning', () => {
    const b = m('mop', { edge: S });
    b.cyl([0.36, 0.3, 0.3], [0, 0.17, 0], { color: '#f6d24a', taper: 1.1, round: 0.2 })
      .cyl([0.33, 0.01, 0.27], [0, 0.3, 0], { color: '#4f9bd6' })
      .box([0.24, 0.12, 0.2], [0, 0.36, -0.03], { color: '#d4d7da' })
      .rod([0.15, 0.33, 0], [0.15, 0.55, 0], 0.025, '#2a2726')
      .arc([0.34, 0.3, 0.012], [0, 0.3, 0], { color: '#9da3a8', tube: 0.05 });
    b.each(4, (i) => b.box([0.06, 0.04, 0.04], [0.12 * Math.cos(i * 1.6), 0.03, 0.1 * Math.sin(i * 1.6)], { color: '#3a3633' }));
    b.stick([0.0, 0.25, 0.08], [-0.15, 1.45, -0.05], 0.03, '#4e8fd6', { name: 'mop', pivot: [0, 0.25, 0.08] })
      .box([0.08, 0.04, 0.05], [0.0, 0.25, 0.08], { color: '#3a3633', parent: 'mop' });
    b.each(10, (i) => b.capsule([0.02, 0.2, 0.02], [Math.cos(i * 0.63) * 0.07, 0.14, 0.08 + Math.sin(i * 0.63) * 0.06], { color: '#f2ece0', rot: [Math.sin(i) * 20, 0, Math.cos(i) * 20], parent: 'mop', edge: F }));
    return b.act({ click: [A.pose('mop', { move: [0, 0.15, 0.3], dur: 0.4 }), A.pose('mop', { move: [0.25, 0.15, 0.4], rot: [0, 0, 15], dur: 0.4 }), A.par(A.pose('mop', { move: [-0.25, 0.15, 0.4], rot: [0, 0, -15], dur: 0.4 }), A.effect('water_spray', { dur: 0.8 }), A.say('Swish swash!', 1)), A.pose('mop', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A mortuary room cut away: a wall of steel cold-chamber doors with lever handles, a steel table on castors and
  // a sink; one drawer slides out with someone under a sheet.
  e('morgue', 'places', 'rooms', () => {
    const b = room2('morgue', 4.4, 3.6, 2.6, '#c8ccd1', '#dfe6ea');
    b.box([3.4, 2.3, 2.0], [-0.2, 1.27, -2.8], { color: '#c9ccd1' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = -1.4 + c * 0.8, y = 0.55 + r * 0.7, drawer = r === 1 && c === 2;
      b.box([0.72, 0.62, 0.06], [x, y, -1.6], { color: '#c9ccd1', ...(drawer ? { name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 1.2 } } : {}) })
        .box([0.2, 0.05, 0.05], [x, y + 0.15, -1.55], { color: '#5c6166', ...(drawer ? { parent: 'drawer' } : {}) });
    }
    b.box([0.7, 0.05, 1.9], [0.2, 1.22, -2.5], { color: '#9da3a8', parent: 'drawer' })
      .box([0.55, 0.16, 1.6], [0.2, 1.3, -2.45], { color: 'white', round: 0.6, parent: 'drawer', edge: F })
      .ball([0.24, 0.18, 0.26], [0.2, 1.36, -1.8], { color: 'white', parent: 'drawer', edge: F })
      .pair((s) => b.ball([0.08, 0.1, 0.08], [0.2 + s * 0.1, 1.36, -3.2], { color: 'white', parent: 'drawer', edge: F }))
      .box([0.8, 0.06, 1.9], [0.9, 0.9, 0.6], { color: '#c9ccd1' })
      .pair((s) => b.stick([0.9 + s * 0.3, 0.12, 0.6 + s * 0.8], [0.9 + s * 0.3, 0.87, 0.6 + s * 0.8], 0.04, '#9da3a8').stick([0.9 - s * 0.3, 0.12, 0.6 + s * 0.8], [0.9 - s * 0.3, 0.87, 0.6 + s * 0.8], 0.04, '#9da3a8'))
      .box([0.6, 0.3, 0.5], [-1.85, 0.95, 0.9], { color: '#c9ccd1' })
      .stick([-1.9, 1.1, 0.75], [-1.9, 1.35, 0.85], 0.02, '#9da3a8');
    return b.act({ click: [[A.operate('drawer', 'out'), A.say('Creeeeak...', 1.6)], [A.operate('drawer', 'in'), A.say('Clunk.', 0.8)]] }).done();
  }),
  // A tub of grey cement mortar on a board with a trowel stuck in it, a hawk and a few bricks laid in a fresh
  // course; the trowel scoops and spreads.
  e('mortar (material)', 'workshop', 'materials', () => {
    const b = m('mortar (material)');
    b.cyl([0.55, 0.2, 0.55], [0, 0.1, 0], { color: '#3a3633', taper: 1.15, edge: S })
      .ball([0.56, 0.12, 0.56], [0, 0.19, 0], { color: '#a7a7a0' })
      .box([0.12, 0.004, 0.22], [0.08, 0.3, 0.05], { color: '#c9ccd1', rot: [-50, 20, 0], edge: S, name: 'trowel', pivot: [0.08, 0.24, 0.05] })
      .rod([0.08, 0.36, -0.02], [0.08, 0.42, -0.08], 0.022, '#c8322a', { parent: 'trowel' });
    b.each(3, (i) => b.box([0.22, 0.07, 0.1], [0.5 + i * 0.235, 0.035, 0.0], { color: '#b5543c', edge: S }).box([0.22, 0.012, 0.1], [0.5 + i * 0.235, 0.076, 0.0], { color: '#a7a7a0' }));
    b.box([0.22, 0.07, 0.1], [0.62, 0.115, 0.0], { color: '#b5543c', edge: S });
    return b.act({ click: [A.pose('trowel', { rot: [40, -20, 0], dur: 0.4 }), A.par(A.pose('trowel', { move: [0.35, -0.1, 0], rot: [60, 0, 0], dur: 0.5 }), A.say('Splat!', 0.8)), A.pose('trowel', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // An infantry mortar: the smooth-bore tube on its bipod with traversing wheel, set in a square base plate, and
  // a bomb by its side; it fires with a thoomp and a puff of smoke.
  e('mortar (weapon)', 'armory', 'artillery', () => {
    const b = m('mortar (weapon)', { edge: S });
    b.box([0.5, 0.05, 0.5], [0, 0.025, -0.25], { color: '#4a5a2a', round: 0.3 })
      .stick([0, 0.08, -0.3], [0, 1.25, 0.25], 0.09, '#5a6a3a', { name: 'tube', pivot: [0, 0.08, -0.3] })
      .torus([0.11, 0.11, 0.03], [0, 1.25, 0.25], { color: '#3a3d40', rot: [65, 0, 0], parent: 'tube' })
      .cyl([0.12, 0.06, 0.12], [0, 0.8, 0.0], { color: '#3a3d40', rot: [65, 0, 0], parent: 'tube' })
      .pair((s) => b.rod([0, 0.8, 0.02], [s * 0.35, 0.02, 0.35], 0.035, '#3a3d40'))
      .rod([-0.35, 0.03, 0.35], [0.35, 0.03, 0.35], 0.025, '#3a3d40')
      .torus([0.12, 0.12, 0.02], [0.1, 0.65, 0.12], { color: '#2a2726', rot: [0, 90, 0] })
      .capsule([0.07, 0.3, 0.07], [0.4, 0.035, -0.4], { color: '#5a6a3a', rot: [0, 0, 90] })
      .cone([0.07, 0.08, 0.07], [0.6, 0.035, -0.4], { color: '#5a6a3a', rot: [0, 0, -90] });
    return b.act({ click: [A.par(A.pose('tube', { rot: [-3, 0, 0], dur: 0.06 }), A.effect('smoke', { dur: 1.5 }), A.say('THOOMP!', 1.2), A.anim('shake')), A.pose('tube', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A framed mosaic panel 60 cm square: a sun of gold and orange tesserae on blue, set in grout; one tile pops
  // out and is pressed back in.
  e('mosaic', 'home', 'decor', () => {
    const b = m('mosaic', { edge: S });
    b.box([0.66, 0.66, 0.04], [0, 0.35, 0], { color: '#7a5230' })
      .box([0.4, 0.04, 0.18], [0, 0.02, -0.06], { color: '#7a5230' })
      .box([0.6, 0.6, 0.02], [0, 0.35, 0.015], { color: '#d4d0c4' });
    const n = 12, t = 0.6 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -0.3 + t * (i + 0.5), y = 0.05 + t * (j + 0.5), r = Math.hypot(x, y - 0.35);
      const c = r < 0.1 ? '#f6d24a' : r < 0.14 ? '#f0923b' : (Math.atan2(y - 0.35, x) * 4 / Math.PI + 8) % 1 < 0.3 && r < 0.25 ? '#e2b23a' : (i + j) % 3 ? '#2f6fc8' : '#4e8fd6';
      b.box([t * 0.86, t * 0.86, 0.012], [x, y, 0.03], { color: c, ...(i === 6 && j === 6 ? { name: 'tile', piece: true, parent: 'board' } : i === 0 && j === 0 ? { name: 'board' } : {}) });
    }
    return b.act({ click: [[A.detach('tile', 'tile'), A.say('Tink!', 0.8)], [A.reattach('tile'), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // A white mosque 30 m across: a prayer hall with a great dome on a drum of windows, smaller domes at the
  // corners, a tall arched entrance, arched windows and two slender minarets with balconies and crescent finials;
  // its lanterns light at dusk.
  e('mosque', 'places', 'religious buildings', () => {
    const b = m('mosque', { edge: S }), w = '#f7f5ef', tr = '#3fa7a0';
    b.box([30, 0.4, 24], [0, 0.2, 0], { color: '#d8d2c4' })
      .box([20, 9, 16], [0, 4.9, -1], { color: w, round: 0.01 })
      .box([20.4, 0.5, 16.4], [0, 9.6, -1], { color: tr })
      .cyl([10, 3, 10], [0, 11.3, -1], { color: w, segs: 16 })
      .dome([11, 8, 11], [0, 16.8, -1], { color: tr, edge: F })
      .stick([0, 20.8, -1], [0, 22.4, -1], 0.12, 'gold')
      .arc([1.0, 1.0, 0.12], [0, 22.6, -1], { color: 'gold', arc: 250, tube: 0.25, rot: [0, 0, 60] });
    around(8, 5.02).forEach(([x, z]) => b.box([0.8, 1.4, 0.2], [x, 11.3, z - 1], { color: '#2b3f66', rot: [0, (Math.atan2(x, z) * 180) / Math.PI, 0] }));
    for (const [x, z] of [[-7.5, 5.5], [7.5, 5.5], [-7.5, -7.5], [7.5, -7.5]]) b.cyl([3, 1.0, 3], [x, 10.3, z], { color: w }).dome([3.4, 2.6, 3.4], [x, 12.1, z], { color: tr, edge: F });
    b.box([7, 11, 2], [0, 5.9, 7.6], { color: w })
      .arc([5, 6, 0.4], [0, 6.0, 8.62], { color: tr, tube: 0.12 })
      .box([4.2, 6.0, 0.2], [0, 3.4, 8.5], { color: '#2b3f66' })
      .arc([4.2, 4.2, 0.2], [0, 6.4, 8.5], { color: '#2b3f66', tube: 0.5 });
    door(b, [0, 0.4, 8.62], 2.4, 3.4, { color: '#8a5a35', frame: tr });
    for (const x of [-7.6, -4.8, 4.8, 7.6]) for (const y of [2.6, 6.4]) b.box([1.2, 2.2, 0.2], [x, y, 7.05], { color: '#2b3f66' }).arc([1.2, 1.2, 0.2], [x, y + 1.1, 7.05], { color: '#2b3f66', tube: 0.5 });
    b.pair((s) => {
      const x = s * 13;
      b.cyl([1.8, 2, 1.8], [x, 1.4, 6.5], { color: w, segs: 8 })
        .cyl([1.3, 20, 1.3], [x, 12.4, 6.5], { color: w, segs: 12, taper: 0.85 })
        .cyl([2.2, 0.5, 2.2], [x, 16.5, 6.5], { color: tr, segs: 12 })
        .torus([2.2, 2.2, 0.08], [x, 17.2, 6.5], { color: tr, rot: [90, 0, 0], tube: 0.04 })
        .cyl([1.0, 3, 1.0], [x, 23.8, 6.5], { color: w, segs: 12 })
        .cone([1.4, 2.6, 1.4], [x, 26.6, 6.5], { color: tr, segs: 12 })
        .stick([x, 27.9, 6.5], [x, 29, 6.5], 0.08, 'gold')
        .arc([0.7, 0.7, 0.1], [x, 29.15, 6.5], { color: 'gold', arc: 250, tube: 0.25, rot: [0, 0, 60] });
      lamp(b, s > 0 ? 'lanternL' : 'lanternR', [0.7, 1.0, 0.7], [x, 23.8, 6.5], '#ffe9a0');
      b.ball([0.6, 0.9, 0.6], [s * 2.3, 5.0, 8.75], { color: '#e2b23a', glow: true, name: s > 0 ? 'lanternG' : 'lanternH', mover: { kind: 'light' } });
    });
    return b.act({ click: [[A.operate('lantern', 'on'), A.effect('sparkle', { dur: 1.5 }), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')], [A.operate('lantern', 'off')]] }).done();
  }),
  // A mosquito net over a single bed (1 x 2 m, mattress top at 0.53): the wooden bed on its legs with a
  // headboard and a blue blanket, and the fine white net falling from a ring on the ceiling hook, flaring out in
  // soft drapes to tuck in round the mattress; a mosquito bumps into it and gives up.
  e('mosquito net', 'home', 'bedroom', () => {
    const b = m('mosquito net');
    b.box([1.0, 0.25, 2.0], [0, 0.225, 0], { color: '#8a5a35', edge: S, round: 0.1 })
      .pair((s) => b.box([0.07, 0.12, 0.07], [s * 0.45, 0.06, 0.95], { color: '#6b4226', edge: S }).box([0.07, 0.12, 0.07], [s * 0.45, 0.06, -0.95], { color: '#6b4226', edge: S }))
      .box([1.04, 0.85, 0.05], [0, 0.525, -1.0], { color: '#8a5a35', edge: S, round: 0.15 })
      .box([0.95, 0.18, 1.95], [0, 0.44, 0], { color: 'white', round: 0.4 })
      .box([0.99, 0.12, 1.3], [0, 0.49, 0.3], { color: '#8fb8e0', round: 0.4 })
      .stick([0, 2.4, 0], [0, 2.25, 0], 0.02, '#9da3a8', { edge: S })
      .torus([0.5, 0.5, 0.02], [0, 2.22, 0], { color: '#d4d7da', rot: [90, 0, 0], tube: 0.04, edge: S, name: 'net', pivot: [0, 2.3, 0] })
      .loft([1.08, 2.08, 1.72], [0, 1.36, 0], [[0, 1, 1, 0], [0.1, 0.97, 0.98, 0], [0.45, 0.66, 0.5, 0], [0.82, 0.48, 0.27, 0], [1, 0.44, 0.23, 0]], { color: '#f2f6f8', rot: [-90, 0, 0], boxy: 0.45, parent: 'net' });
    return b.act({ click: [A.spawn('mz', 'mosquito', { rel: 'front', of: 'self', dist: 'close' }), A.say('Bzzzz!', 1.2, 'mz'), A.pose('net', { rot: [0, 0, 4], dur: 0.3 }), A.pose('net', { rot: [0, 0, -3], dur: 0.3 }), A.pose('net', { rot: [0, 0, 0], dur: 0.3 }), A.move('mz', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('mz', 'fade')] }).done();
  }),
  // An aerosol of insect repellent: a green can with a crossed-out mosquito on the label and a white cap that
  // comes off; it sprays with a pssht.
  e('mosquito repellent', 'home', 'household', () => {
    const b = m('mosquito repellent', { edge: S });
    b.cyl([0.065, 0.17, 0.065], [0, 0.085, 0], { color: '#3f9a4a', round: 0.3, name: 'can' })
      .dome([0.065, 0.03, 0.065], [0, 0.185, 0], { color: '#c9ccd1', parent: 'can' })
      .cyl([0.018, 0.016, 0.018], [0, 0.192, 0], { color: 'white', parent: 'can', name: 'nozzle', mover: { kind: 'slide', axis: 'y', amount: -0.005 } })
      .cyl([0.066, 0.06, 0.066], [0, 0.21, 0], { color: 'white', round: 0.4, name: 'cap', parent: 'can', piece: true })
      .cyl([0.067, 0.07, 0.067], [0, 0.09, 0], { color: '#f6d24a', noInk: true, parent: 'can' })
      .ball([0.03, 0.012, 0.006], [0, 0.095, 0.034], { color: '#2a2726', noInk: true, parent: 'can', edge: F })
      .box([0.05, 0.007, 0.004], [0, 0.095, 0.036], { color: '#e0473b', rot: [0, 0, 40], parent: 'can' })
      .box([0.05, 0.007, 0.004], [0, 0.095, 0.036], { color: '#e0473b', rot: [0, 0, -40], parent: 'can' });
    return b.act({ click: [[A.detach('cap', 'cap'), A.operate('nozzle', 'down'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Psssht!', 1)), A.operate('nozzle', 'up')], [A.reattach('cap')]] }).done();
  }),
  // A cushion of green moss growing over a stone: soft velvety mounds with little brown spore stalks; a rain
  // shower makes it swell.
  e('moss', 'garden', 'plants', () => {
    const b = m('moss');
    b.ball([0.4, 0.16, 0.32], [0, 0.07, 0], { color: '#8f8c86', edge: S })
      .ball([0.42, 0.1, 0.34], [0, 0.11, 0.0], { color: '#5a8a3a', name: 'moss' })
      .ball([0.2, 0.08, 0.16], [0.1, 0.15, 0.04], { color: '#6aa84a', parent: 'moss' })
      .ball([0.16, 0.07, 0.14], [-0.1, 0.14, -0.04], { color: '#4f7a2a', parent: 'moss' });
    b.each(8, (i) => b.stick([Math.cos(i) * 0.1, 0.15, Math.sin(i * 1.7) * 0.08], [Math.cos(i) * 0.1, 0.2, Math.sin(i * 1.7) * 0.08], 0.003, '#8a5a35', { parent: 'moss', noInk: true }).ball(0.007, [Math.cos(i) * 0.1, 0.203, Math.sin(i * 1.7) * 0.08], { color: '#a0682a', parent: 'moss' }));
    return b.act({ click: [A.effect('rain', { dur: 2 }), A.pose('moss', { scale: 1.15, dur: 1 }), A.say('Squish', 1), A.pose('moss', { scale: 1, dur: 1 })] }).done();
  }),
  // A saucer of white mothballs; a moth flutters up, catches a whiff and flies off.
  e('mothball', 'home', 'household', () => {
    const b = m('mothball');
    b.cyl([0.12, 0.012, 0.12], [0, 0.006, 0], { color: '#d4d7da', taper: 1.15, edge: S });
    around(5, 0.03).forEach(([x, z]) => b.ball(0.022, [x, 0.022, z], { color: '#fbf9f2' }));
    b.ball(0.022, [0, 0.038, 0], { color: '#fbf9f2' });
    return b.act({ click: [A.spawn('mo', 'moth', { rel: 'front', of: 'self', dist: 'close' }), A.wait(0.6), A.say('!', 1, 'mo'), A.move('mo', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('mo', 'fade')] }).done();
  }),
  // A computer motherboard standing in a display stand: the green board with a CPU heatsink and fan, four RAM
  // slots, expansion slots, capacitors and chips, and a power light; it boots with a beep.
  e('motherboard', 'tech', 'computers', () => {
    const b = m('motherboard', { edge: S });
    b.box([0.3, 0.02, 0.1], [0, 0.01, 0], { color: '#3a3633' })
      .box([0.305, 0.244, 0.004], [0, 0.145, 0], { color: '#2f7a4a', round: 0.1 })
      .box([0.07, 0.07, 0.012], [-0.03, 0.2, 0.008], { color: '#9da3a8' })
      .cyl([0.06, 0.012, 0.06], [-0.03, 0.2, 0.02], { color: '#2a2726', rot: [90, 0, 0] })
      .box([0.05, 0.008, 0.004], [-0.03, 0.2, 0.027], { color: '#5c6166', name: 'fan1', pivot: [-0.03, 0.2, 0.027], mover: { kind: 'spin', axis: 'z', amount: 900 } })
      .box([0.008, 0.05, 0.004], [-0.03, 0.2, 0.027], { color: '#5c6166', parent: 'fan1' });
    b.each(4, (i) => b.box([0.008, 0.12, 0.012], [0.06 + i * 0.016, 0.2, 0.008], { color: i % 2 ? '#2a2726' : '#3a3633' }))
      .each(3, (i) => b.box([0.16, 0.008, 0.01], [-0.04, 0.09 - i * 0.028, 0.007], { color: i === 0 ? '#2a2726' : '#d4d7da' }))
      .each(6, (i) => b.cyl([0.008, 0.012, 0.008], [0.06 + (i % 3) * 0.014, 0.08 + Math.floor(i / 3) * 0.02, 0.008], { color: '#2a3a8a', rot: [90, 0, 0] }))
      .box([0.03, 0.03, 0.004], [0.1, 0.06, 0.004], { color: '#2a2726' })
      .box([0.02, 0.12, 0.016], [-0.14, 0.17, 0.008], { color: '#9da3a8' });
    lamp(b, 'power', [0.008, 0.008, 0.004], [0.13, 0.04, 0.004], '#9be34d', { box: true });
    return b.act({ click: [[A.par(A.operate('power', 'on'), A.operate('fan1', 'on')), A.say('Beep!', 1)], [A.par(A.operate('power', 'off'), A.operate('fan1', 'off'))]] }).done();
  }),
  // A PIR motion sensor on its wall plate: the faceted white dome lens on a swivel and a red light that flashes
  // when it sees you.
  e('motion detector', 'tech', 'electronics', () => {
    const b = m('motion detector', { edge: S });
    b.box([0.08, 0.012, 0.05], [0, 0.006, -0.01], { color: '#9da3a8' })
      .box([0.08, 0.1, 0.012], [0, 0.06, -0.03], { color: 'white', round: 0.3 })
      .box([0.07, 0.06, 0.05], [0, 0.07, 0.0], { color: 'white', round: 0.4, name: 'head', pivot: [0, 0.07, -0.02] })
      .dome([0.05, 0.03, 0.03], [0, 0.07, 0.025], { color: '#f2f0ea', rot: [90, 0, 0], parent: 'head', edge: F })
      .ball(0.008, [0.025, 0.09, 0.026], { color: '#e0473b', glow: true, name: 'eye', mover: { kind: 'light' }, parent: 'head' });
    return b.act({ click: [A.operate('eye', 'on'), A.par(A.pose('head', { rot: [0, 20, 0], dur: 0.3 }), A.say('Beep!', 0.8)), A.pose('head', { rot: [0, 0, 0], dur: 0.3 }), A.wait(0.8), A.operate('eye', 'off')] }).done();
  }),
  // A small electric motor: the finned grey housing on mounting feet, the end bell, the terminal box with its
  // wires and the shaft with a pulley, which whirrs round.
  e('motor', 'tech', 'machines', () => {
    const b = m('motor', { edge: S });
    b.cyl([0.12, 0.16, 0.12], [0, 0.085, 0], { color: '#4e8fd6', rot: [0, 0, 90] });
    b.each(6, (i) => b.torus([0.13, 0.13, 0.01], [-0.06 + i * 0.024, 0.085, 0], { color: '#3a6fb0', rot: [0, 90, 0], tube: 0.12 }));
    b.cyl([0.11, 0.03, 0.11], [0.095, 0.085, 0], { color: '#9da3a8', rot: [0, 0, 90] })
      .cyl([0.11, 0.03, 0.11], [-0.095, 0.085, 0], { color: '#9da3a8', rot: [0, 0, 90] })
      .pair((s) => b.box([0.03, 0.03, 0.14], [s * 0.06, 0.015, 0], { color: '#5c6166' }))
      .box([0.05, 0.03, 0.05], [0, 0.155, 0], { color: '#3a3633' })
      .rod([0.02, 0.16, 0.02], [0.08, 0.17, 0.08], 0.006, '#e0473b')
      .rod([-0.02, 0.16, 0.02], [-0.06, 0.17, 0.09], 0.006, '#2a2726')
      .stick([0.11, 0.085, 0], [0.17, 0.085, 0], 0.014, '#c9ccd1', { name: 'shaft', pivot: [0.11, 0.085, 0], mover: { kind: 'spin', axis: 'x', amount: 1200 } })
      .cyl([0.05, 0.02, 0.05], [0.16, 0.085, 0], { color: '#5c6166', rot: [0, 0, 90], parent: 'shaft' })
      .box([0.004, 0.04, 0.006], [0.171, 0.085, 0], { color: '#f6d24a', parent: 'shaft' });
    return b.act({ click: [[A.operate('shaft', 'on'), A.par(A.say('Whirrrrr', 1.4), A.anim('shake'))], [A.operate('shaft', 'off')]] }).done();
  }),
  // A class C motor home 7.4 m long: the van cab with its sloping hood and windscreen, the sleeping bunk over the
  // cab, the tall living box with windows, a side door with a step, a roll-out awning, a ladder and an air
  // conditioner on the roof.
  e('motor home', 'garage', 'cars', () => {
    const b = m('motor home', { view: 'side' }), c = '#f2ece0';
    b.box([2.4, 2.4, 5.6], [0, 1.85, -0.9], { color: c, round: 0.08, name: 'body' })
      .box([2.4, 0.85, 1.5], [0, 2.62, 2.5], { color: c, round: 0.35, parent: 'body' })
      .loft([2.3, 1.7, 1.9], [0, 1.3, 2.7], [[0, 1, 1, 0], [0.45, 1, 1, 0], [0.72, 1, 0.78, -0.11], [1, 0.95, 0.5, -0.25]], { color: 'white', boxy: 0.8, parent: 'body' })
      .box([2.1, 0.62, 0.08], [0, 1.72, 3.05], { color: '#2b3f66', rot: [-35, 0, 0], edge: S, parent: 'body' })
      .pair((s) => b.box([0.05, 0.55, 0.9], [s * 1.16, 1.65, 2.4], { color: '#2b3f66', edge: S, parent: 'body' }).box([0.04, 0.15, 7.2], [s * 1.205, 1.2, -0.3], { color: '#c8642a', edge: S, parent: 'body' }).box([0.04, 0.08, 7.2], [s * 1.21, 1.05, -0.3], { color: '#8a3a20', edge: S, parent: 'body' }))
      .box([2.42, 0.25, 0.3], [0, 0.55, 3.6], { color: '#9da3a8', edge: S, parent: 'body' })
      .box([2.42, 0.25, 0.2], [0, 0.65, -3.75], { color: '#9da3a8', edge: S, parent: 'body' });
    for (const z of [-2.8, -0.2]) b.pair((s) => b.box([0.05, 0.75, 1.2], [s * 1.22, 2.15, z], { color: '#2b3f66', edge: S, parent: 'body' }));
    b.box([0.05, 1.9, 0.75], [1.23, 1.6, 1.1], { color: '#e8e0cc', edge: S, name: 'door', pivot: [1.23, 1.6, 1.475], mover: { kind: 'swing', axis: 'y', amount: -80 } })
      .box([0.04, 0.45, 0.45], [1.26, 2.05, 1.1], { color: '#2b3f66', parent: 'door', edge: S })
      .box([0.4, 0.08, 0.6], [1.45, 0.45, 1.1], { color: '#9da3a8', edge: S })
      .cyl([0.12, 3.4, 0.12], [1.22, 2.95, -1.4], { color: '#9da3a8', rot: [90, 0, 0], edge: S })
      .box([0.04, 2.0, 3.3], [1.14, 1.95, -1.4], { color: '#3fa7a0', name: 'awning', pivot: [1.24, 2.95, -1.4], mover: { kind: 'swing', axis: 'z', amount: 80 } })
      .each(3, (i) => b.box([0.045, 2.0, 0.35], [1.14, 1.95, -2.6 + i * 1.2], { color: 'white', parent: 'awning', noInk: true }))
      .box([1.0, 0.4, 0.8], [0, 3.25, -1.6], { color: '#d4d7da', edge: S })
      .each(7, (i) => b.box([0.5, 0.04, 0.04], [-0.6, 0.9 + i * 0.3, -3.72], { color: '#9da3a8', edge: S }))
      .pair((s) => b.box([0.04, 2.1, 0.04], [-0.6 + s * 0.25, 1.95, -3.72], { color: '#9da3a8', edge: S }));
    b.pair((s) => {
      lamp(b, s > 0 ? 'headlightL' : 'headlightR', [0.3, 0.2, 0.06], [s * 0.82, 1.0, 3.64], '#fff6c8', { box: true });
      lamp(b, s > 0 ? 'taillightL' : 'taillightR', [0.15, 0.4, 0.06], [s * 1.05, 1.3, -3.72], '#e0473b', { box: true });
    });
    let n = 1;
    for (const z of [2.6, -2.2]) b.pair((s) => tyre(b, `wheel${n++}`, [s * 1.0, 0.4, z], 0.8, 0.3));
    b.socket('seat', [0.5, 1.0, 2.4], 'seat');
    return b.act({
      click: [
        [A.operate('awning', 'out'), A.operate('door', 'open'), A.say('Whirrr...', 1.4)],
        [A.operate('door', 'close'), A.operate('awning', 'in'), A.par(A.operate('headlight', 'on'), A.say('Honk!', 1)), A.wait(1), A.operate('headlight', 'off')],
      ],
    }).done();
  }),
  // A road motorcycle 2.1 m long: spoked wheels with disc brakes, raked front forks, a red fuel tank, the finned
  // engine and chrome exhaust, a black saddle, handlebars with mirrors and a headlight that comes on.
  e('motorcycle', 'garage', 'motorbikes', () => {
    const b = m('motorcycle', { view: 'side', edge: S });
    tyre(b, 'wheelF', [0, 0.32, 0.72], 0.64, 0.12, '#c9ccd1');
    tyre(b, 'wheelR', [0, 0.32, -0.72], 0.64, 0.14, '#c9ccd1');
    b.cyl([0.28, 0.01, 0.28], [0.07, 0.32, 0.72], { color: '#8f99a3', rot: [0, 0, 90], parent: 'wheelF' })
      .pair((s) => b.stick([s * 0.08, 0.32, 0.72], [s * 0.085, 1.0, 0.5], 0.045, '#c9ccd1'))
      .arc([0.72, 0.72, 0.14], [0, 0.32, 0.72], { color: '#c8322a', rot: [-20, 90, 0], tube: 0.08, arc: 100 })
      .rod([0, 0.95, 0.48], [0, 0.85, -0.1], 0.06, '#3a3633')
      .rod([0, 0.5, 0.25], [0, 0.32, -0.72], 0.05, '#3a3633')
      .rod([0, 0.85, -0.3], [0, 0.32, -0.72], 0.05, '#3a3633')
      .box([0.3, 0.34, 0.42], [0, 0.5, 0.06], { color: '#5c6166', round: 0.2 });
    b.each(4, (i) => b.box([0.34, 0.025, 0.2], [0, 0.6 + i * 0.05, 0.16], { color: '#9da3a8', rot: [-20, 0, 0] }));
    b.ball([0.34, 0.22, 0.52], [0, 0.92, 0.18], { color: '#c8322a', edge: F })
      .box([0.34, 0.08, 0.04], [0, 0.92, 0.36], { color: '#c9ccd1' })
      .box([0.3, 0.11, 0.62], [0, 0.9, -0.36], { color: '#2a2726', round: 0.6, edge: F })
      .wedge([0.26, 0.12, 0.4], [0, 0.88, -0.75], { color: '#c8322a', rot: [0, 90, 0], apex: -0.5 })
      .rod([0.17, 0.38, 0.15], [0.17, 0.4, -0.6], 0.07, '#c9ccd1')
      .cyl([0.11, 0.3, 0.11], [0.17, 0.42, -0.72], { color: '#c9ccd1', rot: [80, 0, 0] })
      .rod([-0.36, 1.08, 0.46], [0.36, 1.08, 0.46], 0.03, '#2a2726')
      .pair((s) => b.capsule([0.04, 0.12, 0.04], [s * 0.36, 1.08, 0.46], { color: '#2a2726', rot: [0, 0, 90] }).stick([s * 0.26, 1.08, 0.46], [s * 0.3, 1.3, 0.42], 0.012, '#9da3a8').box([0.1, 0.06, 0.02], [s * 0.31, 1.32, 0.42], { color: '#c9ccd1' }))
      .cyl([0.22, 0.12, 0.22], [0, 0.98, 0.6], { color: '#c9ccd1', rot: [90, 0, 0] });
    lamp(b, 'headlight', [0.18, 0.18, 0.06], [0, 0.98, 0.665], '#fff6c8');
    lamp(b, 'taillight', [0.1, 0.06, 0.04], [0, 0.92, -0.95], '#e0473b', { box: true });
    b.rod([-0.12, 0.3, -0.2], [-0.2, 0.02, -0.1], 0.02, '#5c6166')
      .socket('seat', [0, 0.95, -0.3], 'seat');
    return b.act({
      click: [
        [A.operate('headlight', 'on'), A.par(A.say('Vroom vroom!', 1.4), A.anim('shake'), A.effect('smoke', { dur: 1.5 }))],
        [A.operate('headlight', 'off'), A.say('Putt putt...', 1.2)],
      ],
    }).done();
  }),
  // A mountain as a 34 m hill: grey rock flanks with ridges, a jagged summit under a snow cap, a lower shoulder
  // peak, scree and dark pines round its foot; an avalanche rumbles down.
  e('mountain', 'nature', 'landforms', () => {
    const b = m('mountain');
    b.cyl([60, 6, 50], [0, 3, 0], { color: '#7a8a5a', taper: 0.8, segs: 9 })
      .cyl([46, 30, 40], [0, 18, 0], { color: '#8f8c86', taper: 0, segs: 7, edge: S })
      .cyl([30, 18, 26], [-12, 12, 4], { color: '#9a968e', taper: 0, segs: 6, edge: S })
      .cyl([14.6, 10.8, 12.7], [0, 27.6, 0], { color: '#f4f8fb', taper: 0, segs: 7, edge: S, name: 'snow' })
      .cyl([6.4, 4, 5.5], [-12, 19.2, 4], { color: '#f4f8fb', taper: 0, segs: 6, edge: S });
    around(12, 26, 0.4).forEach(([x, z], i) => {
      const k = 0.8 + (i % 3) * 0.25;
      b.cyl([0.5, 2.0 * k, 0.5], [x, 6 + k, z], { color: '#6b4228' }).cone([3 * k, 7 * k, 3 * k], [x, 7.5 + 3.5 * k, z], { color: '#2f5a32' });
    });
    return b.act({ click: [A.par(A.effect('snow', { dur: 3 }), A.effect('dust', { dur: 3 }), A.anim('shake'), A.say('Rumble rumble...', 2))] }).done();
  }),
  // A computer mouse on its mouse pad: a round-cornered pad printed with a wave, and a soft grey mouse with two
  // buttons, a scroll wheel and a cord; it scoots about and clicks.
  e('mouse pad', 'tech', 'computers', () => {
    const b = m('mouse pad');
    b.box([0.25, 0.004, 0.21], [0, 0.002, 0], { color: '#2f4f8f', round: 0.5, edge: S })
      .ball([0.16, 0.002, 0.06], [0.02, 0.0045, 0.04], { color: '#6fb8e8', noInk: true, rot: [0, 20, 0] })
      .ball([0.06, 0.035, 0.105], [0.02, 0.02, -0.01], { color: '#9da3a8', name: 'mouse' })
      .box([0.002, 0.012, 0.04], [0.02, 0.034, 0.02], { color: '#5c6166', parent: 'mouse', noInk: true })
      .cyl([0.01, 0.006, 0.01], [0.02, 0.037, 0.018], { color: '#2a2726', rot: [0, 0, 90], parent: 'mouse' })
      .rod([0.02, 0.012, 0.04], [0.03, 0.006, 0.12], 0.004, '#3a3633', { parent: 'mouse' });
    return b.act({ click: [A.pose('mouse', { move: [0.04, 0, 0.03], dur: 0.3 }), A.pose('mouse', { move: [-0.05, 0, -0.02], dur: 0.4 }), A.say('Click click!', 1), A.pose('mouse', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A wooden snap mousetrap: the pine board, the copper spring and the wire bar pulled back over it, the catch
  // and a wedge of cheese as bait. SNAP!
  e('mouse trap', 'home', 'household', () => {
    const b = m('mouse trap', { edge: S });
    b.box([0.1, 0.012, 0.18], [0, 0.006, 0], { color: '#d8b07a', round: 0.2 })
      .label('VICTOR', [0.05, 0.012], [0, 0.0125, 0.06], { color: '#d8b07a', rot: [-90, 0, 0], depth: 0.001 })
      .pair((s) => b.torus([0.018, 0.018, 0.008], [s * 0.025, 0.02, 0], { color: '#c87a4a', rot: [0, 90, 0], tube: 0.3 }))
      .box([0.08, 0.004, 0.08], [0, 0.016, -0.04], { color: '#c9ccd1', name: 'bar', pivot: [0, 0.016, 0], mover: { kind: 'swing', axis: 'x', amount: 175 } })
      .box([0.07, 0.006, 0.07], [0, 0.016, -0.04], { color: '#d8b07a', parent: 'bar', noInk: true })
      .box([0.012, 0.004, 0.08], [0.0, 0.017, 0.03], { color: '#9da3a8' })
      .box([0.025, 0.006, 0.025], [0, 0.015, 0.05], { color: '#c87a4a' })
      .wedge([0.03, 0.022, 0.025], [0, 0.03, 0.05], { color: '#f6c445', apex: -0.5, name: 'cheese' });
    return b.act({ click: [[A.operate('bar', 'on'), A.par(A.say('SNAP!', 1), A.anim('hop'))], [A.operate('bar', 'off'), A.say('Click', 0.6)]] }).done();
  }),
  // A handlebar moustache on a stick for the photo booth: two waxed curls of dark brown standing in a little
  // base; it twirls its ends.
  e('moustache', 'wardrobe', 'costumes', () => {
    const b = m('moustache');
    b.cyl([0.06, 0.012, 0.06], [0, 0.006, 0], { color: 'darkwood', edge: S })
      .stick([0, 0.012, 0], [0, 0.17, 0], 0.006, '#2a2726', { edge: S })
      .ball([0.04, 0.025, 0.02], [0, 0.18, 0.004], { color: '#3a2a20', name: 'stache', pivot: [0, 0.18, 0] })
      .pair((s) => b.ball([0.07, 0.024, 0.018], [s * 0.045, 0.176, 0.004], { color: '#3a2a20', rot: [0, 0, s * -12], parent: 'stache' }).arc([0.04, 0.04, 0.012], [s * 0.085, 0.188, 0.004], { color: '#3a2a20', rot: [0, 0, s * -100], arc: 220, tube: 0.3, parent: 'stache' }));
    return b.act({ click: [A.pose('stache', { rot: [0, 0, 10], dur: 0.2 }), A.pose('stache', { rot: [0, 0, -10], dur: 0.2 }), A.pose('stache', { rot: [0, 0, 0], dur: 0.2 }), A.say('Ho ho!', 1)] }).done();
  }),
  // A sports mouth guard in its open plastic case: a horseshoe of blue moulded rubber; the lid snaps shut.
  e('mouth guard', 'sports', 'protective gear', () => {
    const b = m('mouth guard');
    b.box([0.09, 0.02, 0.08], [0, 0.01, 0], { color: '#3fa7a0', round: 0.5, edge: S })
      .box([0.09, 0.02, 0.08], [0, 0.06, -0.05], { color: '#3fa7a0', round: 0.5, edge: S, rot: [-90, 0, 0], name: 'lid', pivot: [0, 0.02, -0.04], mover: { kind: 'swing', axis: 'x', amount: 90 } })
      .arc([0.07, 0.06, 0.016], [0, 0.026, -0.005], { color: '#2f6fc8', rot: [-90, 0, 0], arc: 220, tube: 0.3 });
    return b.act({ click: [[A.operate('lid', 'on'), A.say('Snap!', 0.8)], [A.operate('lid', 'off')]] }).done();
  }),
  // A bottle of minty mouthwash: a blue-green bottle with a waist, a label and the measuring cap, which comes
  // off; then gargling.
  e('mouth wash', 'home', 'toiletries', () => {
    const b = m('mouth wash');
    b.box([0.08, 0.17, 0.06], [0, 0.085, 0], { color: '#3fb8a8', round: 0.45, name: 'bottle' })
      .box([0.082, 0.07, 0.062], [0, 0.08, 0], { color: 'white', round: 0.45, noInk: true, parent: 'bottle' })
      .label('FRESH', [0.05, 0.018], [0, 0.085, 0.032], { color: 'white', depth: 0.002, parent: 'bottle' })
      .cyl([0.04, 0.03, 0.04], [0, 0.185, 0], { color: '#3fb8a8', taper: 0.7, parent: 'bottle' })
      .cyl([0.05, 0.04, 0.05], [0, 0.215, 0], { color: 'white', name: 'cap', parent: 'bottle', piece: true, edge: S });
    return b.act({ click: [[A.detach('cap', 'cap'), A.say('Gargle gargle!', 1.4)], [A.reattach('cap'), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // An art-deco cinema 16 m wide: a cream facade with a tall blade sign, a marquee canopy rimmed with bulbs and
  // NOW SHOWING letters, poster cases, a ticket booth and glass doors; the bulbs light up for the show.
  e('movie theatre', 'places', 'entertainment', () => {
    const b = m('movie theatre', { edge: S }), w = '#efe0c0', tr = '#c8322a';
    b.box([16, 0.2, 14], [0, 0.1, -2], { color: '#9da3a8' })
      .box([16, 10, 12], [0, 5.2, -3], { color: w, round: 0.01 })
      .box([16.4, 0.6, 12.4], [0, 10.5, -3], { color: tr })
      .each(5, (i) => b.box([0.5, 10, 0.3], [-6 + i * 3, 5.2, 3.1], { color: '#e8d4a8' }))
      .box([12, 1.6, 2.6], [0, 4.4, 4.2], { color: tr })
      .box([11, 1.0, 0.1], [0, 4.4, 5.52], { color: 'white' })
      .label('NOW SHOWING', [10, 0.8], [0, 4.4, 5.58], { color: 'white', depth: 0.04 })
      .box([1.6, 7, 0.6], [0, 9.0, 4.3], { color: tr })
      .label('CINEMA', [1.2, 5.5], [0, 9.0, 4.63], { color: tr, depth: 0.04 })
      .box([2.2, 2.6, 1.8], [0, 1.4, 4.4], { color: '#e8d4a8' })
      .box([1.4, 1.0, 0.06], [0, 1.9, 5.32], { color: '#8fbcd8' })
      .label('TICKETS', [1.4, 0.3], [0, 2.75, 5.33], { color: '#e8d4a8', depth: 0.02 });
    for (let i = 0; i < 14; i++) lamp(b, `bulb${i}`, 0.18, [-5.6 + i * (11.2 / 13), 5.25, 5.52], '#fff3a0');
    for (let i = 0; i < 6; i++) lamp(b, `bulb${14 + i}`, 0.16, [0.85, 6.2 + i * 1.1, 4.62], '#fff3a0');
    b.pair((s) => {
      b.box([1.4, 2.0, 0.12], [s * 6.0, 1.8, 3.1], { color: '#3a3633' }).box([1.2, 1.8, 0.04], [s * 6.0, 1.8, 3.18], { color: s > 0 ? '#4e8fd6' : '#8a5fc4' });
      b.box([1.4, 2.6, 0.08], [s * 2.6, 1.5, 3.04], { color: '#8fbcd8', name: s > 0 ? 'doorL' : 'doorR', pivot: [s * 3.3, 1.5, 3.04], mover: { kind: 'swing', axis: 'y', amount: s * 90 } });
    });
    return b.act({ click: [[A.operate('bulb', 'on'), A.operate('door', 'open'), A.effect('sparkle', { dur: 1.5 }), A.say('Ta-da-da-daaa!', 1.6)], [A.operate('door', 'close'), A.operate('bulb', 'off')]] }).done();
  }),
  // A removal box truck 8 m long: a cab with its windscreen and door, the tall white box with MOVING on its side,
  // dual rear wheels, and a roll-up back door that rattles up on stacked cartons.
  e('moving truck', 'garage', 'trucks', () => {
    const b = m('moving truck', { view: 'side', edge: S });
    b.box([2.5, 3.0, 5.8], [0, 2.15, -1.2], { color: 'white', round: 0.04, name: 'box' })
      .box([2.52, 0.6, 5.82], [0, 1.0, -1.2], { color: '#f0923b', parent: 'box' })
      .pair((s) => b.label('MOVING CO.', [3.6, 0.7], [s * 1.27, 2.5, -1.2], { color: 'white', rot: [0, s * 90, 0], depth: 0.02, parent: 'box' }))
      .box([2.3, 2.6, 0.1], [0, 2.0, -4.14], { color: '#d4d7da', name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 2.3 } });
    b.each(5, (i) => b.box([2.3, 0.04, 0.12], [0, 0.85 + i * 0.5, -4.2], { color: '#9da3a8', parent: 'shutter' }));
    b.box([0.6, 0.6, 0.6], [-0.6, 0.95, -3.6], { color: '#c8955a' })
      .box([0.6, 0.6, 0.6], [0.2, 0.95, -3.7], { color: '#c8955a' })
      .box([0.6, 0.5, 0.6], [-0.4, 1.5, -3.65], { color: '#d8a86a' })
      .box([2.4, 0.3, 7.6], [0, 0.6, -0.4], { color: '#3a3633' })
      .loft([2.4, 2.2, 2.2], [0, 1.7, 2.7], [[0, 1, 1, 0], [0.45, 1, 1, 0], [0.75, 0.98, 0.72, -0.14], [1, 0.94, 0.52, -0.24]], { color: '#f0923b', boxy: 0.85, edge: F })
      .box([2.2, 0.75, 0.08], [0, 2.25, 3.25], { color: '#2b3f66', rot: [-28, 0, 0] })
      .pair((s) => b.box([0.05, 0.6, 0.8], [s * 1.2, 2.2, 2.55], { color: '#2b3f66' }))
      .box([0.05, 1.2, 1.0], [1.22, 1.55, 2.5], { color: '#e0822a', name: 'door', pivot: [1.22, 1.55, 3.0], mover: { kind: 'swing', axis: 'y', amount: -75 } })
      .box([2.5, 0.3, 0.25], [0, 0.65, 3.85], { color: '#5c6166' });
    b.pair((s) => {
      lamp(b, s > 0 ? 'headlightL' : 'headlightR', [0.35, 0.22, 0.06], [s * 0.85, 1.15, 3.82], '#fff6c8', { box: true });
      lamp(b, s > 0 ? 'taillightL' : 'taillightR', [0.2, 0.3, 0.06], [s * 1.1, 0.95, -4.2], '#e0473b', { box: true });
    });
    let n = 1;
    for (const z of [2.6, -2.6, -3.3]) b.pair((s) => tyre(b, `wheel${n++}`, [s * 1.0, 0.5, z], 1.0, 0.32));
    b.socket('seat', [0.55, 1.4, 2.4], 'seat');
    return b.act({ click: [[A.operate('shutter', 'up'), A.say('Rattle rattle!', 1.4)], [A.operate('shutter', 'down'), A.operate('headlight', 'on'), A.say('Honk honk!', 1.2), A.operate('headlight', 'off')]] }).done();
  }),
  // A caprese plate: a soft white ball of fresh mozzarella among slices of tomato and basil leaves with a drizzle
  // of oil; a slice of the cheese is cut away.
  e('mozzarella', 'food', 'cheese', () => {
    const b = m('mozzarella');
    b.cyl([0.26, 0.014, 0.26], [0, 0.007, 0], { color: 'white', edge: S, name: 'plate' })
      .ball([0.1, 0.085, 0.1], [0, 0.055, 0], { color: '#fbf9f2' })
      .cyl([0.09, 0.015, 0.09], [0.07, 0.022, 0.03], { color: '#fbf9f2', rot: [70, 0, -20], name: 'slice', parent: 'plate', piece: true });
    around(5, 0.09, 0.6).forEach(([x, z], i) => b.cyl([0.06, 0.012, 0.06], [x, 0.02, z], { color: '#e0473b', rot: [0, 0, 8] }).ball([0.04, 0.006, 0.025], [x * 0.75, 0.03, z * 0.75], { color: '#3f9a4a', rot: [0, i * 70, 0] }));
    b.ball([0.08, 0.003, 0.04], [-0.02, 0.016, -0.06], { color: '#c8a83a', noInk: true });
    return b.act({ click: [[A.detach('slice', 'mozzarella slice'), A.say('Slice!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A muddy puddle 2 m across: brown sludge with wetter dark pools, ruts and splatters; a pig comes to wallow.
  e('mud', 'nature', 'elements', () => {
    const b = m('mud');
    b.ball([2.0, 0.1, 1.6], [0, 0.03, 0], { color: '#7a5a3a' })
      .ball([1.2, 0.06, 0.8], [0.2, 0.06, 0.1], { color: '#5a3a22', noInk: true })
      .ball([0.5, 0.05, 0.3], [-0.5, 0.06, -0.4], { color: '#4a3020', noInk: true });
    b.each(6, (i) => b.ball([0.18, 0.06, 0.14], [Math.cos(i * 1.1) * 0.9, 0.04, Math.sin(i * 1.1) * 0.7], { color: '#8a6440' }));
    return b.act({ click: [A.spawn('pg', 'pig', { rel: 'front', of: 'self', dist: 'near' }), A.move('pg', { rel: 'at', of: 'self' }, { speed: 'run' }), A.par(A.effect('dust', { dur: 1.5 }), A.say('Oink oink!', 1.4, 'pg'), A.anim('wobble', 2, 'pg')), A.wait(1), A.remove('pg', 'fade')] }).done();
  }),
  // A blueberry muffin in a fluted paper case: a golden domed top studded with berries and sugar; the top comes
  // off (the best bit).
  e('muffin', 'food', 'baked goods', () => {
    const b = m('muffin');
    b.cyl([0.065, 0.05, 0.065], [0, 0.025, 0], { color: '#f4a1c0', taper: 1.3, segs: 16, edge: S, name: 'case' })
      .cyl([0.086, 0.012, 0.086], [0, 0.052, 0], { color: '#d9a35f', parent: 'case' })
      .dome([0.1, 0.06, 0.1], [0, 0.085, 0], { color: '#d9a35f', name: 'top', parent: 'case', piece: true });
    around(7, 0.03, 0.3).forEach(([x, z], i) => b.ball(0.014, [x, 0.1 + (i % 2) * 0.004, z], { color: '#3a3a7a', parent: 'top' }));
    b.ball(0.014, [0, 0.112, 0], { color: '#3a3a7a', parent: 'top' });
    return b.act({ click: [[A.detach('top', 'muffin top'), A.say('Mmm!', 1)], [A.reattach('top')]] }).done();
  }),
  // A six-cup muffin tin fresh from the oven, the muffins rising golden in their cups; they puff up and steam.
  e('muffin tin', 'kitchen', 'baking', () => {
    const b = m('muffin tin', { edge: S });
    b.box([0.3, 0.03, 0.2], [0, 0.015, 0], { color: '#9da3a8', round: 0.3 })
      .box([0.34, 0.01, 0.24], [0, 0.031, 0], { color: '#c9ccd1', round: 0.4 });
    for (let i = 0; i < 6; i++) {
      const x = -0.09 + (i % 3) * 0.09, z = i < 3 ? -0.045 : 0.045;
      b.cyl([0.07, 0.008, 0.07], [x, 0.036, z], { color: '#5c6166' })
        .dome([0.075, 0.035, 0.075], [x, 0.0535, z], { color: i === 4 ? '#e8c890' : '#d9a35f', name: `muffin${i}`, pivot: [x, 0.036, z], edge: F });
    }
    const rise = (k: number) => A.par(...[0, 1, 2, 3, 4, 5].map((i) => A.pose(`muffin${i}`, { scale: k, dur: 1 })));
    return b.act({ click: [[A.par(rise(1.3), A.effect('steam', { dur: 2 })), A.say('Ding!', 1)], [rise(1)]] }).done();
  }),
  // A car exhaust silencer: the oval steel can with its seams and rubber-mounted hangers, the inlet pipe and the
  // chrome tailpipe; it pops and puffs smoke.
  e('muffler', 'garage', 'car parts', () => {
    const b = m('muffler', { edge: S });
    b.cyl([0.24, 0.5, 0.16], [0, 0.14, 0], { color: '#8f99a3', rot: [0, 0, 90], name: 'can' })
      .pair((s) => b.cyl([0.25, 0.02, 0.17], [s * 0.24, 0.14, 0], { color: '#5c6166', rot: [0, 0, 90] }))
      .stick([0.25, 0.14, 0.03], [0.5, 0.14, 0.03], 0.05, '#8f99a3')
      .stick([-0.25, 0.14, -0.03], [-0.48, 0.14, -0.03], 0.06, '#c9ccd1')
      .cyl([0.07, 0.04, 0.07], [-0.5, 0.14, -0.03], { color: '#d4d7da', rot: [0, 0, 90] })
      .pair((s) => b.stick([s * 0.12, 0.26, 0], [s * 0.12, 0.33, 0], 0.012, '#5c6166').torus([0.04, 0.04, 0.015], [s * 0.12, 0.35, 0], { color: '#2a2726', tube: 0.3 }))
      .pair((s) => b.box([0.06, 0.03, 0.06], [s * 0.15, 0.015, 0], { color: '#3a3633' }));
    return b.act({ click: [A.par(A.effect('smoke', { dur: 1.5 }), A.anim('shake'), A.say('Pop pop pop!', 1.2))] }).done();
  }),
  // A big ceramic coffee mug with a handle, full of hot coffee with a teaspoon in it; the spoon stirs and it
  // steams.
  e('mug', 'kitchen', 'tableware', () => {
    const b = m('mug');
    b.cyl([0.085, 0.1, 0.085], [0, 0.05, 0], { color: '#e0473b', edge: S, round: 0.25 })
      .cyl([0.074, 0.006, 0.074], [0, 0.095, 0], { color: '#6b4226' })
      .torus([0.06, 0.07, 0.018], [0.055, 0.05, 0], { color: '#e0473b', rot: [0, 90, 0], tube: 0.25 })
      .label('#1', [0.03, 0.025], [0, 0.05, 0.043], { color: '#e0473b', depth: 0.002 })
      .stick([0.0, 0.07, 0.0], [-0.02, 0.15, 0.02], 0.006, '#c9ccd1', { name: 'spoon', pivot: [0, 0.07, 0], edge: S });
    return b.act({ click: [A.pose('spoon', { rot: [0, 720, 0], dur: 1 }), A.pose('spoon', { rot: [0, 0, 0], dur: 0 }), A.par(A.effect('steam', { dur: 1.5 }), A.say('Clink clink', 1))] }).done();
  }),
  // A police mug shot: the photo print, 15 cm tall, on a little easel: a scruffy suspect in front of the height
  // chart holding the number board, and the side view printed on the back; the flash pops and it turns over.
  e('mug shot', 'study', 'documents', () => {
    const b = m('mug shot', { edge: S });
    b.box([0.08, 0.006, 0.05], [0, 0.003, 0], { color: 'darkwood' })
      .rod([0, 0.006, -0.02], [0, 0.12, -0.03], 0.004, 'darkwood')
      .box([0.11, 0.155, 0.003], [0, 0.085, 0.0], { color: 'white', name: 'photo' })
      .box([0.1, 0.12, 0.0005], [0, 0.092, 0.0018], { color: '#dfe6ea', parent: 'photo', noInk: true })
      .box([0.1, 0.12, 0.0005], [0, 0.092, -0.0018], { color: '#dfe6ea', parent: 'photo', noInk: true });
    for (const z of [1, -1]) {
      for (let i = 0; i < 5; i++) b.box([0.1, 0.0012, 0.0005], [0, 0.04 + i * 0.024, z * 0.0022], { color: '#5c6166', parent: 'photo', noInk: true });
      b.ball([0.05, 0.036, 0.0006], [0, 0.05, z * 0.0024], { color: '#f0923b', parent: 'photo', noInk: true })
        .ball([0.028, 0.034, 0.0006], [z * 0.0, 0.088, z * 0.0026], { color: '#d9a173', parent: 'photo', noInk: true })
        .ball([0.03, 0.014, 0.0006], [z > 0 ? 0 : 0.004, 0.103, z * 0.0028], { color: '#3a2a20', parent: 'photo', noInk: true })
        .box([0.05, 0.022, 0.0006], [0, 0.052, z * 0.003], { color: '#2a2726', parent: 'photo', noInk: true });
    }
    b.pair((s) => b.ball(0.004, [s * 0.006, 0.09, 0.003], { color: '#2a2726', parent: 'photo', noInk: true }))
      .ball([0.008, 0.012, 0.0006], [-0.014, 0.088, -0.003], { color: '#c88a63', parent: 'photo', noInk: true })
      .label('7734', [0.044, 0.016], [0, 0.052, 0.0036], { color: '#2a2726', depth: 0.0005, parent: 'photo' });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 0.6 }), A.say('Flash!', 0.8)), A.pose('photo', { rot: [0, 180, 0], dur: 0.5 }), A.wait(1.2), A.pose('photo', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A mulberry tree 10 m tall: a broad round head of glossy leaves on a gnarled trunk, hung with dark berries;
  // shake it and a berry drops.
  e('mulberry tree', 'garden', 'fruit trees', () => tree2('mulberry tree', 10, '#4f8a42', { leaf2: '#3f7a3a', fruit: '#4a1a3a', fs: 0.1, n: 12, shape: 'wide', bough: 4, trunk: '#6b5034' }).act(fruitAct('Plop!')).done()),
  // A wooden ammunition crate with rope handles, stencilled markings and a hinged lid that opens on rows of
  // brass cartridges.
  e('munitions', 'armory', 'ammunition', () => {
    const b = m('munitions', { edge: S });
    b.box([0.6, 0.3, 0.32], [0, 0.15, 0], { color: '#5a6a3a', round: 0.1 })
      .box([0.62, 0.04, 0.34], [0, 0.04, 0], { color: '#4a5a2a' })
      .label('AMMO 7.62', [0.36, 0.08], [0, 0.17, 0.165], { color: '#5a6a3a', depth: 0.004 })
      .pair((s) => b.arc([0.1, 0.08, 0.02], [s * 0.31, 0.2, 0], { color: 'tan', rot: [0, 90, 0], tube: 0.25 }));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) b.cyl([0.03, 0.12, 0.03], [-0.2 + i * 0.1, 0.27, -0.08 + j * 0.08], { color: 'brass' }).cone([0.026, 0.04, 0.026], [-0.2 + i * 0.1, 0.35, -0.08 + j * 0.08], { color: '#c87a4a' });
    b.box([0.6, 0.05, 0.32], [0, 0.325, 0], { color: '#5a6a3a', round: 0.2, name: 'lid', pivot: [0, 0.3, -0.16], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .pair((s) => b.box([0.06, 0.04, 0.03], [s * 0.2, 0.3, 0.17], { color: '#3a3d40' }));
    return b.act({ click: [[A.operate('lid', 'open'), A.say('Clack', 0.8)], [A.operate('lid', 'close')]] }).done();
  }),
  // A muscle model: a strong arm on a stand, bent at the elbow, with the bicep bulging when it flexes.
  e('muscle', 'clinic', 'body parts', () => {
    const b = m('muscle'), k = 'skin3';
    b.cyl([0.24, 0.03, 0.24], [0, 0.015, 0], { color: '#5c6166', edge: S })
      .stick([0, 0.03, -0.06], [0, 0.18, -0.06], 0.03, 'silver', { edge: S })
      .ball([0.16, 0.14, 0.15], [0, 0.22, 0], { color: k })
      .rod([0, 0.22, 0], [0.24, 0.24, 0], 0.11, k)
      .ball([0.13, 0.1, 0.11], [0.12, 0.28, 0.01], { color: '#e0a07a', name: 'bicep' })
      .ball(0.1, [0.25, 0.24, 0], { color: k })
      .rod([0.25, 0.24, 0], [0.22, 0.5, 0.02], 0.09, k, { name: 'forearm', pivot: [0.25, 0.24, 0] })
      .ball([0.11, 0.1, 0.09], [0.22, 0.55, 0.02], { color: k, parent: 'forearm' });
    return b.act({ click: [A.par(A.pose('bicep', { scale: 1.35, dur: 0.4 }), A.pose('forearm', { rot: [0, 0, 15], dur: 0.4 }), A.say('Hnnngh!', 1.2)), A.effect('sparkle', { dur: 0.8 }), A.wait(0.6), A.par(A.pose('bicep', { scale: 1, dur: 0.4 }), A.pose('forearm', { rot: [0, 0, 0], dur: 0.4 }))] }).done();
  }),
  // A classical museum 26 m wide: a broad flight of steps up to a colonnade of eight columns under a carved
  // pediment, MUSEUM on the frieze, banners hung between the columns, tall windows and bronze doors that open.
  e('museum', 'places', 'public buildings', () => {
    const b = m('museum', { edge: S }), st = '#e6e0d2', tr = '#f7f5ef';
    b.box([28, 0.4, 20], [0, 0.2, -1], { color: '#c8c2b4' })
      .box([26, 11, 14], [0, 6.0, -3], { color: st, round: 0.01 })
      .box([26.4, 0.8, 14.4], [0, 11.9, -3], { color: tr })
      .each(5, (i) => b.box([18 - i * 0.4, 0.3, 5 - i * 0.6], [0, 0.55 + i * 0.3, 6.2 - i * 0.3], { color: '#d8d2c4' }))
      .box([18, 0.3, 4], [0, 1.95, 5.6], { color: '#d8d2c4' });
    b.each(8, (i) => b.cyl([1.0, 9.0, 1.0], [-7.7 + i * 2.2, 6.6, 6.2], { color: tr, segs: 18 }).box([1.3, 0.4, 1.3], [-7.7 + i * 2.2, 11.2, 6.2], { color: tr }).box([1.3, 0.4, 1.3], [-7.7 + i * 2.2, 2.3, 6.2], { color: tr }));
    b.box([18.4, 1.4, 3.0], [0, 12.1, 5.4], { color: tr })
      .label('MUSEUM', [8, 0.9], [0, 12.1, 6.92], { color: tr, depth: 0.05 })
      .wedge([19, 3.2, 3.0], [0, 14.4, 5.4], { color: st })
      .cyl([1.4, 0.15, 1.4], [0, 14.0, 6.92], { color: '#c8b070', rot: [90, 0, 0] });
    const ban = ['#c8322a', '#2f6fc8', '#e2b23a'];
    for (let i = 0; i < 3; i++) b.box([1.0, 3.4, 0.05], [-5.5 + i * 5.5, 7.6, 6.0], { color: ban[i] }).box([1.1, 0.1, 0.1], [-5.5 + i * 5.5, 9.35, 6.0], { color: '#3a3633' });
    door(b, [-0.9, 2.1, 4.0], 1.8, 4.2, { color: '#8a6a3a', frame: tr, name: 'doorL' });
    b.box([1.8, 4.2, 0.07], [0.9, 4.2, 4.07], { color: '#8a6a3a', name: 'doorR', pivot: [1.8, 4.2, 4.07], mover: { kind: 'swing', axis: 'y', amount: 100 } });
    for (const x of [-11, -9, 9, 11]) for (const y of [4.0, 8.4]) win(b, [x, y, 4.0], 1.2, 2.6, { frame: tr });
    return b.act({ click: [[A.operate('door', 'open'), A.effect('sparkle', { dur: 1.2 }), A.say('Ooooh!', 1.2), A.wait(2.5), A.operate('door', 'close')]] }).done();
  }),
  // A fly agaric toadstool and its little twin: red caps flecked with white, frilled white stems with a ring;
  // the big cap bobs and puffs out spores.
  e('mushroom (fungi)', 'garden', 'mushrooms', () => {
    const b = m('mushroom (fungi)');
    b.cyl([0.05, 0.13, 0.05], [0, 0.065, 0], { color: '#f7f5ef', taper: 0.85 })
      .cyl([0.08, 0.025, 0.08], [0, 0.012, 0], { color: '#efe6cc' })
      .cyl([0.07, 0.02, 0.07], [0, 0.11, 0], { color: '#f2ece0', taper: 1.3 })
      .dome([0.2, 0.09, 0.2], [0, 0.17, 0], { color: '#d23a2e', name: 'cap', pivot: [0, 0.12, 0] });
    around(8, 0.065, 0.3).forEach(([x, z], i) => b.ball([0.022, 0.012, 0.022], [x, 0.19 - (i % 2) * 0.012, z], { color: 'white', parent: 'cap' }));
    b.ball([0.02, 0.012, 0.02], [0, 0.214, 0], { color: 'white', parent: 'cap' })
      .cyl([0.025, 0.05, 0.025], [0.1, 0.025, 0.05], { color: '#f7f5ef' })
      .dome([0.07, 0.035, 0.07], [0.1, 0.0655, 0.05], { color: '#e0473b' })
      .ball([0.01, 0.006, 0.01], [0.1, 0.08, 0.05], { color: 'white' });
    return b.act({ click: [A.pose('cap', { move: [0, -0.015, 0], dur: 0.15 }), A.par(A.pose('cap', { move: [0, 0, 0], dur: 0.2 }), A.effect('dust', { dur: 1.2 }), A.say('Poof!', 0.8))] }).done();
  }),
  // A black folding music stand at reading height: a tripod, a telescoping post and a slotted desk holding open
  // sheet music; a page turns.
  e('music stand', 'music', 'accessories', () => {
    const b = m('music stand', { edge: S });
    around(3, 0.3, Math.PI / 2).forEach(([x, z]) => b.rod([0, 0.25, 0], [x, 0.01, z], 0.018, '#2a2726'));
    b.stick([0, 0.2, 0], [0, 1.05, -0.02], 0.022, '#2a2726')
      .box([0.5, 0.34, 0.012], [0, 1.2, 0.0], { color: '#2a2726', rot: [-20, 0, 0] })
      .box([0.5, 0.03, 0.04], [0, 1.03, 0.06], { color: '#2a2726' })
      .box([0.21, 0.29, 0.004], [-0.11, 1.21, 0.012], { color: '#faf6ea', rot: [-20, 0, 0] })
      .box([0.21, 0.29, 0.004], [0.11, 1.21, 0.012], { color: '#faf6ea', rot: [-20, 0, 0], name: 'page', pivot: [0, 1.21, 0.012] });
    for (let i = 0; i < 5; i++) for (const x of [-0.11, 0.11]) b.box([0.18, 0.003, 0.002], [x, 1.32 - i * 0.05, 0.018 + i * 0.017], { color: '#3a3633', rot: [-20, 0, 0], noInk: true, ...(x > 0 ? { parent: 'page' } : {}) });
    return b.act({ click: [A.pose('page', { rot: [0, -175, 0], dur: 0.6 }), A.say('Flip', 0.8), A.wait(0.8), A.pose('page', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A flintlock musket 1.5 m long standing in a wooden rack: the walnut stock, the long steel barrel with its
  // ramrod, brass bands and the lock with its hammer; it fires with a flash, a bang and smoke.
  e('musket', 'armory', 'guns', () => {
    const b = m('musket', { edge: S });
    b.box([0.4, 0.05, 0.2], [0, 0.025, 0], { color: '#5a3a22' })
      .box([0.4, 0.06, 0.05], [0, 1.1, -0.08], { color: '#5a3a22' })
      .pair((s) => b.box([0.04, 1.1, 0.04], [s * 0.18, 0.58, -0.08], { color: '#5a3a22' }))
      .box([0.05, 0.36, 0.1], [0, 0.23, 0], { color: '#8a5a35', rot: [0, 0, 0], round: 0.4, name: 'gun', pivot: [0, 0.05, 0] })
      .box([0.045, 0.6, 0.06], [0, 0.6, 0.02], { color: '#8a5a35', parent: 'gun' })
      .stick([0, 0.4, 0.05], [0, 1.52, 0.05], 0.025, '#5c6166', { parent: 'gun' })
      .stick([0, 0.6, 0.02], [0, 1.4, 0.03], 0.008, '#8a5a35', { parent: 'gun' })
      .each(3, (i) => b.torus([0.04, 0.04, 0.012], [0, 0.85 + i * 0.22, 0.05], { color: 'brass', rot: [90, 0, 0], parent: 'gun' }))
      .box([0.012, 0.08, 0.04], [0.03, 0.48, 0.04], { color: '#5c6166', parent: 'gun' })
      .box([0.01, 0.04, 0.012], [0.035, 0.53, 0.06], { color: '#3a3633', parent: 'gun', name: 'hammer', pivot: [0.035, 0.5, 0.05] });
    return b.act({ click: [A.pose('hammer', { rot: [40, 0, 0], dur: 0.1 }), A.par(A.effect('smoke', { dur: 2 }), A.say('BANG!', 1.2), A.pose('gun', { rot: [-4, 0, 0], dur: 0.08 })), A.par(A.pose('gun', { rot: [0, 0, 0], dur: 0.4 }), A.pose('hammer', { rot: [0, 0, 0], dur: 0.4 }))] }).done();
  }),
  // A squeezy bottle of yellow mustard with its red pointed nozzle cap; it squeezes and squirts.
  e('mustard', 'food', 'sauces', () => {
    const b = m('mustard');
    b.cyl([0.065, 0.16, 0.065], [0, 0.08, 0], { color: '#f6c82a', round: 0.4, name: 'bottle', pivot: [0, 0, 0] })
      .cyl([0.067, 0.05, 0.067], [0, 0.08, 0], { color: '#e0473b', noInk: true, parent: 'bottle' })
      .label('MUSTARD', [0.045, 0.014], [0, 0.08, 0.034], { color: '#e0473b', depth: 0.002, parent: 'bottle' })
      .cone([0.05, 0.03, 0.05], [0, 0.175, 0], { color: '#f6c82a', taper: 0.6, parent: 'bottle' })
      .cone([0.03, 0.05, 0.03], [0, 0.215, 0], { color: '#e0473b', parent: 'bottle', edge: S });
    return b.act({ click: [A.pose('bottle', { scale: 0.92, dur: 0.15 }), A.par(A.effect('water_spray', { dur: 0.6 }), A.say('Splort!', 0.8)), A.pose('bottle', { scale: 1, dur: 0.3 })] }).done();
  }),
  // The muzzle end of a rifle barrel on a display block: the steel barrel with its slotted muzzle brake and the
  // front sight; it flashes and booms.
  e('muzzle', 'armory', 'gun parts', () => {
    const b = m('muzzle', { edge: S, view: 'side' });
    b.box([0.1, 0.04, 0.2], [0, 0.02, -0.05], { color: 'darkwood' })
      .box([0.03, 0.05, 0.03], [0, 0.065, -0.1], { color: 'darkwood' })
      .cyl([0.028, 0.26, 0.028], [0, 0.1, -0.05], { color: '#3a3d40', rot: [90, 0, 0] })
      .cyl([0.04, 0.06, 0.04], [0, 0.1, 0.1], { color: '#5c6166', rot: [90, 0, 0] })
      .pair((s) => b.box([0.008, 0.016, 0.03], [s * 0.019, 0.1, 0.1], { color: '#2a2726' }))
      .box([0.008, 0.02, 0.01], [0, 0.125, 0.06], { color: '#3a3d40' })
      .cone([0.05, 0.08, 0.05], [0, 0.1, 0.17], { color: '#ffd24a', glow: true, rot: [90, 0, 0], name: 'flash', scale: 0, edge: F });
    return b.act({ click: [A.pose('flash', { scale: 1, dur: 0.05 }), A.par(A.say('BOOM!', 1), A.effect('smoke', { dur: 1.2 })), A.pose('flash', { scale: 0, dur: 0.1 })] }).done();
  }),
  // A 10 cm steel nail half driven into a block of pine; it is hammered down and pulled out again.
  e('nail', 'workshop', 'hardware', () =>
    m('nail', { edge: S })
      .box([0.12, 0.05, 0.08], [0, 0.025, 0], { color: '#d8b07a', round: 0.15 })
      .stick([0, 0.0, 0], [0, 0.1, 0], 0.004, '#9da3a8', { name: 'nail', mover: { kind: 'slide', axis: 'y', amount: -0.045 } })
      .cyl([0.011, 0.002, 0.011], [0, 0.101, 0], { color: '#9da3a8', parent: 'nail' })
      .act({ click: [[A.operate('nail', 'down'), A.say('Tink! Tink! Tonk!', 1.2)], [A.operate('nail', 'up'), A.say('Creak', 0.8)]] })
      .done(),
  ),
  // A nail clipper at its real size, 6 cm long and lying flat (so 2 cm tall): two steel jaws and the lever on its
  // pivot pin; it clips.
  e('nail clipper', 'home', 'toiletries', () =>
    m('nail clipper', { edge: S })
      .box([0.012, 0.004, 0.058], [0, 0.004, 0], { color: '#c9ccd1', round: 0.4 })
      .box([0.012, 0.004, 0.058], [0, 0.011, 0.002], { color: '#c9ccd1', round: 0.4, rot: [-6, 0, 0] })
      .cyl([0.004, 0.012, 0.004], [0, 0.012, 0.012], { color: '#9da3a8' })
      .box([0.011, 0.003, 0.05], [0, 0.019, -0.005], { color: '#d4d7da', round: 0.4, rot: [6, 0, 0], name: 'lever', pivot: [0, 0.018, 0.012] })
      .act({ click: [A.pose('lever', { rot: [-10, 0, 0], dur: 0.1 }), A.say('Clip!', 0.8), A.pose('lever', { rot: [0, 0, 0], dur: 0.1 })] })
      .done(),
  ),
  // An emery board standing in a little cup: pink grit on both faces of a curved card; it files back and forth.
  e('nail file', 'home', 'toiletries', () =>
    m('nail file', { edge: S })
      .cyl([0.05, 0.05, 0.05], [0, 0.025, 0], { color: 'white', taper: 1.2 })
      .box([0.02, 0.18, 0.003], [0.0, 0.13, 0], { color: '#f4a1c0', round: 0.6, name: 'file', mover: { kind: 'slide', axis: 'y', amount: 0.02 } })
      .box([0.021, 0.16, 0.002], [0.0, 0.13, 0.002], { color: '#e8829a', parent: 'file', noInk: true })
      .act({ click: [A.operate('file', 'up'), A.operate('file', 'down'), A.operate('file', 'up'), A.operate('file', 'down'), A.say('Scritch scritch', 1.2)] })
      .done(),
  ),
  // A pneumatic framing nailer (46 cm) pressed nose-down on a plank: the yellow cylinder housing with its black
  // cap and exhaust, the steel drive nose and safety tip, the rubber-gripped handle with a red trigger, the long
  // angled magazine of nails braced back to the handle, and the air hose from the brass fitting. Each THWACK
  // sinks a nail in the plank.
  e('nail gun', 'workshop', 'power tools', () => {
    const b = m('nail gun', { edge: S, view: 'side' }), y0 = 0.03, yel = '#f6c82a';
    const P = (y: number, z: number): V => [0, y0 + y, z];
    b.box([0.16, 0.03, 0.6], [0, 0.015, 0.05], { color: 'lightwood', round: 0.1 })
      .cyl([0.09, 0.15, 0.085], P(0.25, 0.13), { color: yel, round: 0.3, name: 'gun', pivot: P(0, 0.165) })
      .cyl([0.096, 0.035, 0.09], P(0.34, 0.13), { color: '#2a2726', parent: 'gun' })
      .box([0.05, 0.02, 0.05], P(0.365, 0.12), { color: '#3a3633', rot: [0, 30, 0], parent: 'gun' })
      .box([0.034, 0.12, 0.045], P(0.12, 0.155), { color: '#5c6166', parent: 'gun' })
      .box([0.028, 0.05, 0.03], P(0.04, 0.165), { color: '#c9ccd1', parent: 'gun' })
      .cyl([0.024, 0.012, 0.024], [0.021, y0 + 0.13, 0.155], { color: '#e0473b', rot: [0, 0, 90], parent: 'gun' })
      .box([0.042, 0.05, 0.25], P(0.285, -0.04), { color: yel, rot: [-8, 0, 0], round: 0.4, parent: 'gun' })
      .box([0.047, 0.055, 0.12], P(0.276, -0.09), { color: '#2a2726', rot: [-8, 0, 0], round: 0.45, parent: 'gun', edge: F })
      .box([0.012, 0.04, 0.018], P(0.235, 0.06), { color: '#e0473b', rot: [12, 0, 0], round: 0.4, parent: 'gun' })
      .box([0.03, 0.055, 0.35], P(0.13, -0.035), { color: '#3a3f44', rot: [20, 0, 0], round: 0.2, parent: 'gun' })
      .box([0.012, 0.012, 0.3], P(0.158, -0.025), { color: '#c9ccd1', rot: [20, 0, 0], parent: 'gun', noInk: true })
      .box([0.035, 0.08, 0.035], P(0.23, -0.185), { color: '#3a3f44', parent: 'gun' })
      .cyl([0.016, 0.035, 0.016], P(0.265, -0.19), { color: 'brass', rot: [90, 0, 0], parent: 'gun' })
      .rod(P(0.265, -0.205), [0, 0.02, -0.3], 0.018, '#e0473b', { edge: F })
      .rod([0, 0.02, -0.3], [0.05, 0.011, -0.45], 0.018, '#e0473b', { edge: F });
    b.each(2, (i) => b.cyl([0.012, 0.003, 0.012], [0, 0.031, 0.23 + i * 0.05], { color: '#9da3a8', name: `nail${i + 1}`, scale: 0 }));
    const shot = (n: string) => [A.par(A.pose('gun', { rot: [-6, 0, 0], dur: 0.06 }), A.pose(n, { scale: 1, dur: 0.06 }), A.say('THWACK!', 0.8)), A.pose('gun', { rot: [0, 0, 0], dur: 0.25 })];
    return b.act({ click: [A.par(A.pose('nail1', { scale: 0, dur: 0 }), A.pose('nail2', { scale: 0, dur: 0 })), ...shot('nail1'), ...shot('nail2')] }).done();
  }),
  // A bottle of nail varnish: a glossy faceted pink bottle and a tall black cap with its brush, which comes off.
  e('nail polish', 'wardrobe', 'makeup', () =>
    m('nail polish', { edge: S })
      .prism([0.04, 0.035, 0.04], [0, 0.0175, 0], 8, { color: '#e8306a', round: 0.3, name: 'bottle' })
      .cyl([0.014, 0.008, 0.014], [0, 0.039, 0], { color: '#e8306a', parent: 'bottle' })
      .cyl([0.018, 0.05, 0.018], [0, 0.068, 0], { color: '#2a2726', name: 'cap', parent: 'bottle', piece: true })
      .ball([0.012, 0.015, 0.003], [0.008, 0.022, 0.02], { color: 'white', noInk: true, parent: 'bottle' })
      .act({ click: [[A.detach('cap', 'cap'), A.effect('sparkle', { dur: 1 })], [A.reattach('cap')]] })
      .done(),
  ),
  // A HELLO MY NAME IS badge in a little stand: the red header and the white space with a name written in;
  // it gives a little bounce.
  e('name badge', 'study', 'office supplies', () =>
    m('name badge', { edge: S })
      .box([0.05, 0.006, 0.025], [0, 0.003, 0], { color: '#9da3a8' })
      .box([0.09, 0.06, 0.002], [0, 0.036, 0], { color: 'white', round: 0.3, name: 'badge' })
      .box([0.09, 0.02, 0.0025], [0, 0.056, 0.0002], { color: '#e0473b', round: 0.3, parent: 'badge' })
      .label('HELLO', [0.06, 0.012], [0, 0.057, 0.0016], { color: '#e0473b', depth: 0.0005, parent: 'badge' })
      .label('Sam', [0.05, 0.02], [0, 0.03, 0.0016], { color: 'white', depth: 0.0005, parent: 'badge' })
      .act({ click: [A.pose('badge', { move: [0, 0.01, 0], dur: 0.15 }), A.pose('badge', { move: [0, 0, 0], dur: 0.15 }), A.effect('sparkle', { dur: 0.6 })] })
      .done(),
  ),
  // A linen napkin folded into a standing cone on a side plate, with a silver napkin ring beside it; it flops open.
  e('napkin', 'kitchen', 'tableware', () =>
    m('napkin')
      .cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'white', edge: S })
      .cone([0.12, 0.22, 0.06], [0, 0.12, 0], { color: '#f2ece0', segs: 4, name: 'napkin', pivot: [0, 0.012, -0.03] })
      .box([0.06, 0.18, 0.004], [0, 0.11, 0.022], { color: '#e8e0cc', parent: 'napkin', rot: [-8, 0, 0] })
      .torus([0.04, 0.04, 0.018], [0.13, 0.02, 0.08], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.2, edge: S })
      .act({ click: [[A.pose('napkin', { rot: [-85, 0, 0], dur: 0.4 }), A.say('Flop', 0.8)], [A.pose('napkin', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A neck on an anatomy bust: shoulders and collarbones, the long neck with its Adam's apple and the head above;
  // the head turns on it.
  e('neck', 'clinic', 'body parts', () => {
    const b = m('neck'), k = 'skin2';
    b.box([0.2, 0.04, 0.14], [0, 0.02, 0], { color: '#5c6166', edge: S })
      .ball([0.36, 0.14, 0.18], [0, 0.1, 0], { color: k })
      .pair((s) => b.rod([s * 0.03, 0.16, 0.06], [s * 0.14, 0.15, 0.05], 0.02, '#e8b08a'))
      .cyl([0.11, 0.14, 0.11], [0, 0.22, 0], { color: k })
      .ball([0.025, 0.03, 0.02], [0, 0.22, 0.052], { color: '#e8b08a' })
      .ball([0.16, 0.2, 0.18], [0, 0.37, 0.01], { color: k, name: 'head', pivot: [0, 0.28, 0] })
      .ball([0.17, 0.08, 0.19], [0, 0.44, -0.01], { color: '#5a3a22', parent: 'head' })
      .pair((s) => b.ball(0.016, [s * 0.035, 0.38, 0.09], { color: '#2a2726', parent: 'head', eye: true }));
    return b.act({ click: [A.pose('head', { rot: [0, 50, 0], dur: 0.5 }), A.pose('head', { rot: [0, -50, 0], dur: 0.8 }), A.pose('head', { rot: [0, 0, 0], dur: 0.5 }), A.say('Crick crack', 1)] }).done();
  }),
  // A string of pearls with a gold clasp and a pendant, displayed on a black velvet bust; the pendant sways and
  // the pearls gleam.
  e('necklace', 'wardrobe', 'jewellery', () => {
    const b = m('necklace');
    b.box([0.18, 0.02, 0.1], [0, 0.01, 0], { color: '#2a2726', edge: S })
      .cyl([0.06, 0.16, 0.05], [0, 0.1, -0.02], { color: '#2a2726', taper: 0.7 })
      .ball([0.26, 0.2, 0.08], [0, 0.26, -0.01], { color: '#2a2726' })
      .cyl([0.08, 0.1, 0.06], [0, 0.4, -0.01], { color: '#2a2726' });
    for (let i = 0; i < 17; i++) {
      const a = Math.PI * (0.1 + (i / 16) * 0.8);
      b.ball(0.016, [Math.cos(a) * 0.075, 0.37 - Math.sin(a) * 0.1, 0.035 + Math.sin(a) * 0.012], { color: '#f7f2e8', glow: false });
    }
    b.stick([0, 0.27, 0.05], [0, 0.25, 0.05], 0.003, 'gold', { name: 'pendant', pivot: [0, 0.27, 0.05] })
      .ball([0.025, 0.03, 0.012], [0, 0.235, 0.052], { color: '#3fa7a0', parent: 'pendant', edge: S })
      .torus([0.03, 0.035, 0.006], [0, 0.235, 0.052], { color: 'gold', parent: 'pendant', tube: 0.15 });
    return b.act({ click: [A.pose('pendant', { rot: [0, 0, 18], dur: 0.3 }), A.par(A.pose('pendant', { rot: [0, 0, -14], dur: 0.4 }), A.effect('sparkle', { dur: 1 })), A.pose('pendant', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A sewing needle threaded with red cotton, stuck in a tomato pincushion with its strawberry; it is pulled out
  // and the thread follows.
  e('needle', 'workshop', 'crafts', () => {
    const b = m('needle');
    b.ball([0.1, 0.07, 0.1], [0, 0.035, 0], { color: '#d23a2e' })
      .each(3, (i) => b.torus([0.102, 0.072, 0.003], [0, 0.035, 0], { color: '#a3322a', rot: [0, i * 60, 0], tube: 0.04, noInk: true }))
      .cone([0.02, 0.012, 0.02], [0, 0.074, 0], { color: '#3f9a4a' })
      .ball([0.02, 0.026, 0.02], [0.05, 0.015, 0.04], { color: '#d23a2e' })
      .stick([0.02, 0.05, 0.0], [0.03, 0.12, 0.0], 0.0015, '#c9ccd1', { name: 'needle', edge: S, mover: { kind: 'slide', axis: 'y', amount: 0.05 } })
      .rod([0.03, 0.118, 0], [0.06, 0.1, 0.01], 0.0015, '#e0473b', { parent: 'needle', noInk: true })
      .rod([0.06, 0.1, 0.01], [0.07, 0.03, 0.03], 0.0015, '#e0473b', { parent: 'needle', noInk: true })
      .ball(0.008, [-0.03, 0.06, 0.03], { color: '#f6d24a' })
      .stick([-0.03, 0.06, 0.03], [-0.025, 0.03, 0.02], 0.0012, '#c9ccd1', { edge: S });
    return b.act({ click: [[A.operate('needle', 'out'), A.say('Stitch!', 0.8)], [A.operate('needle', 'in')]] }).done();
  }),
  // A neon OPEN sign on its black backing grid: glass tube letters in red and a blue border, a transformer and
  // the chains it hangs from; it buzzes and flickers on.
  e('neon sign', 'home', 'decor', () => {
    const b = m('neon sign', { edge: S });
    b.box([0.9, 0.4, 0.02], [0, 0.5, 0], { color: '#2a2726', round: 0.2 })
      .box([0.2, 0.06, 0.06], [0, 0.27, -0.02], { color: '#3a3633' })
      .pair((s) => b.stick([s * 0.38, 0.7, 0], [s * 0.38, 0.95, 0], 0.006, '#9da3a8'));
    const tube = (n: string, a: V, c: V, col2: string) => b.rod(a, c, 0.018, col2, { glow: true, name: n, mover: { kind: 'light' }, edge: F });
    tube('neon0', [-0.38, 0.34, 0.02], [0.38, 0.34, 0.02], '#4e8fd6');
    tube('neon1', [-0.38, 0.66, 0.02], [0.38, 0.66, 0.02], '#4e8fd6');
    tube('neon2', [-0.4, 0.34, 0.02], [-0.4, 0.66, 0.02], '#4e8fd6');
    tube('neon3', [0.4, 0.34, 0.02], [0.4, 0.66, 0.02], '#4e8fd6');
    b.torus([0.12, 0.18, 0.018], [-0.25, 0.5, 0.02], { color: '#ff4a5a', glow: true, tube: 0.12, name: 'neonO', mover: { kind: 'light' }, edge: F })
      .rod([-0.12, 0.42, 0.02], [-0.12, 0.58, 0.02], 0.018, '#ff4a5a', { glow: true, name: 'neonP', mover: { kind: 'light' }, edge: F })
      .torus([0.08, 0.08, 0.018], [-0.09, 0.545, 0.02], { color: '#ff4a5a', glow: true, tube: 0.2, name: 'neonP2', mover: { kind: 'light' }, edge: F })
      .rod([0.02, 0.42, 0.02], [0.02, 0.58, 0.02], 0.018, '#ff4a5a', { glow: true, name: 'neonE', mover: { kind: 'light' }, edge: F })
      .each(3, (i) => b.rod([0.02, 0.42 + i * 0.08, 0.02], [0.1, 0.42 + i * 0.08, 0.02], 0.018, '#ff4a5a', { glow: true, name: `neonE${i}`, mover: { kind: 'light' }, edge: F }))
      .rod([0.16, 0.42, 0.02], [0.16, 0.58, 0.02], 0.018, '#ff4a5a', { glow: true, name: 'neonN', mover: { kind: 'light' }, edge: F })
      .rod([0.16, 0.58, 0.02], [0.28, 0.42, 0.02], 0.018, '#ff4a5a', { glow: true, name: 'neonN2', mover: { kind: 'light' }, edge: F })
      .rod([0.28, 0.42, 0.02], [0.28, 0.58, 0.02], 0.018, '#ff4a5a', { glow: true, name: 'neonN3', mover: { kind: 'light' }, edge: F });
    return b.act({ click: [[A.say('Bzzzt...', 1), A.operate('neon', 'on'), A.wait(0.2), A.operate('neon', 'off'), A.wait(0.2), A.operate('neon', 'on')], [A.operate('neon', 'off')]] }).done();
  }),
  // A planetarium model of Neptune 1.8 m across on its stand: deep blue with paler cloud bands, a dark spot and a
  // faint ring; it turns and glows. (Planets are 1-3 m models, as the size guide asks.)
  e('neptune (planet)', 'sky', 'planets', () => {
    const b = m('neptune (planet)');
    b.cyl([0.8, 0.1, 0.8], [0, 0.05, 0], { color: '#3a3633', edge: S })
      .stick([0, 0.1, 0], [0, 0.55, 0], 0.08, '#5c6166', { edge: S })
      .ball(1.8, [0, 1.45, 0], { color: '#3a6fd8', name: 'planet', mover: { kind: 'light' } })
      .torus([1.82, 1.82, 0.06], [0, 1.6, 0], { color: '#6f9fe8', rot: [90, 0, 0], tube: 0.04, parent: 'planet', noInk: true })
      .torus([1.82, 1.82, 0.05], [0, 1.2, 0], { color: '#2f5fc0', rot: [90, 0, 0], tube: 0.04, parent: 'planet', noInk: true })
      .ball([0.36, 0.2, 0.08], [0.2, 1.3, 0.86], { color: '#1f3f90', parent: 'planet', noInk: true })
      .torus([2.6, 2.6, 0.02], [0, 1.45, 0], { color: '#9fb0c8', rot: [70, 0, 10], tube: 0.01, parent: 'planet' });
    return b.act({ click: [[A.operate('planet', 'on'), A.pose('planet', { rot: [0, 180, 0], dur: 2 })], [A.pose('planet', { rot: [0, 0, 0], dur: 2 }), A.operate('planet', 'off')]] }).done();
  }),
  // A bird's nest of woven twigs, lined with down, holding three speckled blue eggs; one hatches and a bird
  // pops out with a tweet.
  e('nest', 'aviary', 'bird things', () => {
    const b = m('nest');
    b.torus([0.24, 0.24, 0.1], [0, 0.05, 0], { color: '#8a6440', rot: [90, 0, 0], tube: 0.35 })
      .cyl([0.16, 0.04, 0.16], [0, 0.03, 0], { color: '#c8a870' });
    for (let i = 0; i < 14; i++) b.stick([Math.cos(i) * 0.12, 0.04 + (i % 3) * 0.02, Math.sin(i) * 0.12], [Math.cos(i + 1.2) * 0.13, 0.05 + (i % 2) * 0.03, Math.sin(i + 1.2) * 0.13], 0.006, i % 2 ? '#6b4228' : '#a07a50');
    around(3, 0.03).forEach(([x, z], i) => b.ball([0.035, 0.045, 0.035], [x, 0.065, z], { color: '#a8d8e8', name: `egg${i}`, rot: [10, 0, i * 30] }).ball(0.006, [x + 0.01, 0.075, z + 0.015], { color: '#5a3a22', parent: `egg${i}`, noInk: true }));
    return b.act({ click: [[A.pose('egg0', { rot: [0, 0, 20], dur: 0.15 }), A.pose('egg0', { rot: [0, 0, -20], dur: 0.15 }), A.pose('egg0', { scale: 0, dur: 0.1 }), A.spawn('bd', 'bird', { rel: 'on', of: 'self' }), A.say('Tweet tweet!', 1.4, 'bd'), A.wait(1), A.move('bd', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.remove('bd', 'fade')], [A.pose('egg0', { scale: 1, dur: 0.4 })]] }).done();
  }),
  // A fishing net hung out to dry on a timber frame: the knotted green mesh, a row of cork floats along the top
  // and lead weights along the bottom; it is hauled up with a catch.
  e('net (fish)', 'sea', 'fishing', () => {
    const b = m('net (fish)', { edge: S });
    b.pair((s) => b.box([0.1, 2.2, 0.1], [s * 1.3, 1.1, 0], { color: '#7a5230' }).box([0.4, 0.06, 0.4], [s * 1.3, 0.03, 0], { color: '#7a5230' }))
      .box([2.8, 0.08, 0.08], [0, 2.15, 0], { color: '#7a5230' })
      .box([2.4, 1.7, 0.02], [0, 1.25, 0.05], { color: '#3f7a5a', name: 'net', pivot: [0, 2.1, 0.05], edge: F });
    for (let i = 0; i < 9; i++) b.box([0.012, 1.7, 0.03], [-1.2 + i * 0.3, 1.25, 0.06], { color: '#2f5a4a', parent: 'net', noInk: true });
    for (let i = 0; i < 6; i++) b.box([2.4, 0.012, 0.03], [0, 0.45 + i * 0.3, 0.06], { color: '#2f5a4a', parent: 'net', noInk: true });
    for (let i = 0; i < 6; i++) b.capsule([0.08, 0.12, 0.08], [-1.0 + i * 0.4, 2.02, 0.08], { color: '#d8a860', rot: [0, 0, 90], parent: 'net', edge: F }).ball(0.04, [-1.0 + i * 0.4, 0.42, 0.07], { color: '#5c6166', parent: 'net' });
    return b.act({ click: [A.pose('net', { rot: [-40, 0, 0], dur: 0.6 }), A.spawn('f', 'goldfish', { rel: 'front', of: 'self', dist: 'close' }), A.say('Splash!', 1.2), A.pose('net', { rot: [0, 0, 0], dur: 0.5 }), A.wait(1), A.remove('f', 'sink')] }).done();
  }),
  // A street news kiosk: a green booth with a counter window, racks of newspapers and colourful magazines, a
  // NEWS sign on its roof, and a roller shutter that rattles up for business.
  e('news stand', 'places', 'shops', () => {
    const b = m('news stand', { edge: S }), g = '#2f6a42';
    b.box([2.6, 0.15, 2.0], [0, 0.075, 0], { color: '#9da3a8' })
      .box([2.4, 2.4, 1.8], [0, 1.35, -0.1], { color: g })
      .box([2.8, 0.15, 2.4], [0, 2.62, 0.1], { color: '#1f4a2f' })
      .box([2.2, 0.5, 0.1], [0, 2.95, 0.6], { color: 'white' })
      .label('NEWS', [2.0, 0.42], [0, 2.95, 0.66], { color: 'white', depth: 0.03 })
      .box([1.8, 0.9, 0.06], [0, 1.65, 0.81], { color: '#3a3633' })
      .box([1.8, 0.06, 0.4], [0, 1.18, 0.98], { color: '#8a6440' })
      .box([1.8, 0.95, 0.04], [0, 1.65, 0.86], { color: '#c9ccd1', name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 0.85 } });
    for (let i = 0; i < 5; i++) b.box([1.8, 0.02, 0.05], [0, 1.25 + i * 0.18, 0.89], { color: '#9da3a8', parent: 'shutter', noInk: true });
    const mags = ['#e0473b', '#f6d24a', '#4e8fd6', '#d64fa0', '#3fa7a0', '#f0923b'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) b.box([0.16, 0.22, 0.02], [-1.21, 0.5 + r * 0.45, -0.7 + c * 0.24], { color: mags[(r + c) % 6], rot: [0, 0, 10] });
    for (let c = 0; c < 6; c++) b.box([0.28, 0.06, 0.2], [-0.8 + c * 0.32, 0.55, 0.95], { color: '#f2f0ea' });
    return b.act({ click: [[A.operate('shutter', 'up'), A.say('Rattle rattle!', 1.2)], [A.operate('shutter', 'down')]] }).done();
  }),
  // A broadsheet newspaper standing open as if being read: the masthead, a big headline, a photo and columns of
  // print; the front page turns.
  e('newspaper', 'study', 'books', () => {
    const b = m('newspaper', { edge: S });
    b.box([0.3, 0.012, 0.12], [0, 0.006, 0], { color: '#3a3633' })
      .box([0.38, 0.56, 0.004], [0.19, 0.3, 0], { color: '#f2f0e6' })
      .box([0.38, 0.56, 0.004], [-0.19, 0.3, 0.0], { color: '#f2f0e6', name: 'page', pivot: [0, 0.3, 0] })
      .label('THE DAILY TOWN', [0.34, 0.05], [-0.19, 0.54, 0.003], { color: '#f2f0e6', depth: 0.001, parent: 'page' })
      .box([0.34, 0.035, 0.001], [-0.19, 0.48, 0.003], { color: '#2a2726', parent: 'page', noInk: true })
      .box([0.16, 0.13, 0.001], [-0.27, 0.37, 0.003], { color: '#9da3a8', parent: 'page', noInk: true });
    for (let i = 0; i < 8; i++) b.box([0.14, 0.006, 0.001], [-0.1, 0.43 - i * 0.022, 0.003], { color: '#5c6166', parent: 'page', noInk: true }).box([0.34, 0.006, 0.001], [-0.19, 0.27 - i * 0.022, 0.003], { color: '#5c6166', parent: 'page', noInk: true });
    for (let i = 0; i < 18; i++) b.box([0.16, 0.006, 0.001], [i < 9 ? 0.1 : 0.28, 0.5 - (i % 9) * 0.045, 0.003], { color: '#5c6166', noInk: true });
    return b.act({ click: [[A.pose('page', { rot: [0, 178, 0], dur: 0.6 }), A.say('Rustle!', 0.8)], [A.pose('page', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A US nickel at its real size, 21 mm across, standing on its milled edge: Jefferson's profile on the front,
  // Monticello on the back; it flips heads or tails. (The vocabulary's 10 cm is far too big for a coin.)
  e('nickel', 'ideas', 'money', () => {
    const b = m('nickel', { edge: S });
    b.cyl([0.0212, 0.002, 0.0212], [0, 0.0106, 0], { color: '#c9ccd1', rot: [90, 0, 0], name: 'coin', pivot: [0, 0.0106, 0] })
      .torus([0.0212, 0.0212, 0.0022], [0, 0.0106, 0], { color: '#a8acb0', tube: 0.08, parent: 'coin' })
      .ball([0.008, 0.01, 0.0006], [0.001, 0.0112, 0.0011], { color: '#a8acb0', noInk: true, parent: 'coin' })
      .box([0.01, 0.005, 0.0006], [0, 0.009, -0.0011], { color: '#a8acb0', noInk: true, parent: 'coin' })
      .dome([0.004, 0.003, 0.0006], [0, 0.0128, -0.0011], { color: '#a8acb0', noInk: true, parent: 'coin', rot: [180, 0, 0] });
    return b.act({ click: [[A.pose('coin', { rot: [0, 720, 0], dur: 0.8 }), A.say('Heads!', 1)], [A.pose('coin', { rot: [0, 900, 0], dur: 0.8 }), A.say('Tails!', 1)]] }).done();
  }),
  // A plug-in night light: the white plug body on its wall plate and a frosted crescent moon shade that glows
  // softly; it clicks on and off.
  e('night light', 'home', 'lighting', () => {
    const b = m('night light', { edge: S });
    b.box([0.08, 0.012, 0.05], [0, 0.006, -0.02], { color: '#d4d7da' })
      .box([0.08, 0.12, 0.012], [0, 0.07, -0.03], { color: '#f2f0ea', round: 0.3 })
      .box([0.05, 0.07, 0.03], [0, 0.07, -0.01], { color: 'white', round: 0.4 })
      .arc([0.09, 0.09, 0.03], [0, 0.07, 0.015], { color: '#fff3a0', rot: [0, 0, 120], arc: 220, tube: 0.45, name: 'moon', mover: { kind: 'light' }, edge: F })
      .ball(0.01, [0.022, 0.1, 0.02], { color: '#fff3a0', glow: true });
    return b.act({ click: [A.operate('moon'), A.say('Click', 0.6)] }).done();
  }),
  // Night-vision goggles on their head harness: a twin-tube binocular in olive drab with green-glowing lenses,
  // the mount, and the strap; they whine as they power up.
  e('night vision goggles', 'tech', 'gadgets', () => {
    const b = m('night vision goggles', { edge: S });
    b.box([0.16, 0.06, 0.07], [0, 0.07, 0], { color: '#3a4a2a', round: 0.4 })
      .pair((s) => b.cyl([0.05, 0.09, 0.05], [s * 0.04, 0.07, 0.07], { color: '#2a3420', rot: [90, 0, 0] }).cyl([0.054, 0.02, 0.054], [s * 0.04, 0.07, 0.11], { color: '#3a4a2a', rot: [90, 0, 0] }))
      .cyl([0.04, 0.004, 0.04], [0.04, 0.07, 0.121], { color: '#7cf06a', rot: [90, 0, 0], name: 'lensL', mover: { kind: 'light' } })
      .cyl([0.04, 0.004, 0.04], [-0.04, 0.07, 0.121], { color: '#7cf06a', rot: [90, 0, 0], name: 'lensR', mover: { kind: 'light' } })
      .box([0.03, 0.05, 0.04], [0, 0.115, -0.01], { color: '#2a3420' })
      .torus([0.2, 0.16, 0.03], [0, 0.08, -0.1], { color: '#2a2726', rot: [90, 0, 0], tube: 0.1, edge: F })
      .box([0.12, 0.03, 0.1], [0, 0.015, -0.04], { color: '#5c6166' });
    return b.act({ click: [[A.operate('lens', 'on'), A.say('Vweeeee...', 1.2)], [A.operate('lens', 'off')]] }).done();
  }),
  // A long striped flannel nightcap with a floppy tip and a white pom-pom; the tip flops over sleepily.
  e('nightcap', 'wardrobe', 'hats', () => {
    const b = m('nightcap');
    b.cyl([0.2, 0.05, 0.2], [0, 0.025, 0], { color: 'white' })
      .cyl([0.19, 0.16, 0.19], [0, 0.13, 0], { color: '#4e8fd6', taper: 0.55 })
      .each(2, (i) => b.cyl([0.18 - i * 0.04, 0.025, 0.18 - i * 0.04], [0, 0.09 + i * 0.06, 0], { color: 'white', taper: 0.9, noInk: true }))
      .cyl([0.1, 0.18, 0.1], [0.05, 0.25, 0], { color: '#4e8fd6', taper: 0.3, rot: [0, 0, -40], name: 'tip', pivot: [0.0, 0.2, 0] })
      .ball(0.06, [0.12, 0.33, 0], { color: 'white', parent: 'tip' });
    return b.act({ click: [A.pose('tip', { rot: [0, 0, -60], dur: 0.6 }), A.say('Yawn... zzz', 1.6), A.pose('tip', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A nightclub 10 m wide: a dark purple box with a neon NIGHTCLUB sign, a light strip along the roof, a disco
  // ball on top that turns, a heavy door and a velvet rope on brass posts; the beat starts.
  e('nightclub', 'places', 'entertainment', () => {
    const b = m('nightclub', { edge: S });
    b.box([10, 0.2, 8], [0, 0.1, 0], { color: '#3a3633' })
      .box([10, 5, 7], [0, 2.7, -0.5], { color: '#3a2a5a', round: 0.02 })
      .box([10.2, 0.3, 7.2], [0, 5.35, -0.5], { color: '#1a1716' })
      .box([6, 1.0, 0.1], [0, 4.2, 3.06], { color: '#1a1716' })
      .label('NIGHTCLUB', [5.6, 0.8], [0, 4.2, 3.12], { color: '#1a1716', depth: 0.03 })
      .box([5.8, 0.08, 0.06], [0, 3.62, 3.14], { color: '#d64fa0', glow: true, name: 'neon', mover: { kind: 'light' } })
      .box([10.1, 0.12, 0.12], [0, 5.1, 3.05], { color: '#6fd3e8', glow: true, name: 'neonStrip', mover: { kind: 'light' } })
      .stick([2.5, 5.5, -0.5], [2.5, 6.4, -0.5], 0.08, '#5c6166')
      .ball(1.2, [2.5, 7.0, -0.5], { color: '#d4d7da', name: 'disco', mover: { kind: 'spin', axis: 'y', amount: 90 } });
    for (let i = 0; i < 10; i++) b.box([0.22, 0.22, 0.04], [2.5 + Math.cos(i * 0.63) * 0.6, 7.0 + Math.sin(i * 1.7) * 0.3, -0.5 + Math.sin(i * 0.63) * 0.6], { color: i % 2 ? '#a8d8f5' : 'white', rot: [0, i * 36, 0], parent: 'disco' });
    door(b, [0, 0.2, 3.0], 1.4, 2.4, { color: '#1a1716', frame: '#d64fa0' });
    b.pair((s) => b.stick([s * 1.6, 0.2, 4.2], [s * 1.6, 1.15, 4.2], 0.07, 'gold').ball(0.12, [s * 1.6, 1.18, 4.2], { color: 'gold' }))
      .rod([-1.6, 1.05, 4.2], [0, 0.8, 4.3], 0.06, '#a3322a', { edge: F })
      .rod([0, 0.8, 4.3], [1.6, 1.05, 4.2], 0.06, '#a3322a', { edge: F });
    return b.act({
      click: [
        [A.par(A.operate('neon', 'on'), A.operate('disco', 'on'), A.say('Boom tss, boom tss!', 2)), A.anim('pulse', 2)],
        [A.par(A.operate('neon', 'off'), A.operate('disco', 'off'))],
      ],
    }).done();
  }),
  // A long cotton nightgown on its hanger: a smocked yoke with a lace collar, puffed sleeves with frilled cuffs, a
  // satin bow and a ruffled hem; it sways.
  e('nightgown', 'wardrobe', 'sleepwear', () => {
    const b = m('nightgown'), c = '#f7c6dc';
    b.stick([0, 1.28, 0], [0, 1.36, 0], 0.008, 'silver', { edge: S, name: 'hook', pivot: [0, 1.36, 0] })
      .arc([0.06, 0.05, 0.008], [0, 1.365, 0], { color: 'silver', arc: 220, edge: S, parent: 'hook' })
      .capsule([0.04, 0.46, 0.04], [0, 1.26, 0], { color: 'wood', rot: [0, 0, 90], edge: S, parent: 'hook' })
      .cyl([0.66, 0.95, 0.42], [0, 0.5, 0], { color: c, taper: 0.52, parent: 'hook' })
      .box([0.4, 0.3, 0.2], [0, 1.1, 0], { color: c, round: 0.5, parent: 'hook' })
      .torus([0.67, 0.43, 0.05], [0, 0.04, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08, parent: 'hook' })
      .torus([0.2, 0.12, 0.03], [0, 1.24, 0.03], { color: 'white', rot: [80, 0, 0], tube: 0.2, parent: 'hook' })
      .pair((s) => b.ball([0.2, 0.17, 0.18], [s * 0.24, 1.17, 0], { color: c, parent: 'hook' }).rod([s * 0.29, 1.1, 0], [s * 0.34, 0.86, 0.02], 0.09, c, { parent: 'hook' }).torus([0.1, 0.1, 0.03], [s * 0.345, 0.83, 0.02], { color: 'white', rot: [90, 0, 0], tube: 0.2, parent: 'hook' }))
      .box([0.44, 0.03, 0.24], [0, 0.95, 0], { color: '#d64fa0', noInk: true, parent: 'hook' })
      .pair((s) => b.ball([0.06, 0.04, 0.02], [s * 0.035, 0.95, 0.125], { color: '#d64fa0', parent: 'hook', rot: [0, 0, s * 20] }));
    return b.act({ click: [A.pose('hook', { rot: [0, 0, 5], dur: 0.5 }), A.pose('hook', { rot: [0, 0, -5], dur: 0.6 }), A.pose('hook', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A rodeo mechanical bull: a padded inflatable ring, the motor post and a leather-brown bull with a saddle,
  // horns and a rope; it bucks and spins.
  e('mechanical bull', 'toys', 'rides', () => {
    const b = m('mechanical bull', { view: 'side' }), c = '#6b3e26';
    b.cyl([4, 0.4, 4], [0, 0.2, 0], { color: '#e0473b' })
      .torus([4.1, 4.1, 0.5], [0, 0.4, 0], { color: '#c8322a', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.5, 0.6, 0.5], [0, 0.7, 0], { color: '#3a3633', edge: S })
      .capsule([0.6, 1.4, 0.55], [0, 1.25, 0], { color: c, rot: [90, 0, 0], name: 'bull', pivot: [0, 1.0, 0] })
      .ball([0.42, 0.42, 0.46], [0, 1.3, 0.78], { color: c, parent: 'bull' })
      .ball([0.26, 0.2, 0.22], [0, 1.18, 1.0], { color: '#d9b98a', parent: 'bull' })
      .box([0.6, 0.1, 0.5], [0, 1.56, -0.05], { color: '#2a2726', round: 0.4, parent: 'bull' })
      .stick([0, 1.56, 0.25], [0, 1.72, 0.27], 0.05, '#2a2726', { parent: 'bull' })
      .rod([0, 1.2, -0.7], [0, 0.9, -0.85], 0.06, c, { parent: 'bull' })
      .pair((s) => {
        b.rod([s * 0.16, 1.42, 0.82], [s * 0.38, 1.58, 0.86], 0.07, '#f2e6cf', { parent: 'bull' })
          .ball(0.04, [s * 0.14, 1.36, 1.0], { color: '#2a2726', eye: true, parent: 'bull' })
          .capsule([0.14, 0.4, 0.14], [s * 0.18, 0.82, 0.42], { color: c, parent: 'bull' })
          .capsule([0.14, 0.4, 0.14], [s * 0.18, 0.82, -0.42], { color: c, parent: 'bull' });
      })
      .socket('saddle', [0, 1.62, -0.05], 'seat');
    return b.act({ click: [A.pose('bull', { rot: [-15, 30, 0], dur: 0.3 }), A.say('Whirr-clunk!', 1.2), A.pose('bull', { rot: [12, -30, 0], dur: 0.3 }), A.pose('bull', { rot: [-15, 30, 0], dur: 0.3 }), A.pose('bull', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A bedside table: a wooden cabinet on tapered legs with a drawer that slides out, a shelf, a little lamp that
  // switches on and a red alarm clock.
  e('nightstand', 'home', 'bedroom', () => {
    const b = m('nightstand', { edge: S });
    b.box([0.48, 0.42, 0.38], [0, 0.39, 0], { color: '#b5814e', round: 0.1 })
      .box([0.5, 0.03, 0.4], [0, 0.615, 0], { color: '#7a5230', round: 0.3 })
      .box([0.42, 0.15, 0.36], [0, 0.5, 0.02], { color: '#d8b07a', round: 0.2, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.25 } })
      .ball(0.03, [0, 0.5, 0.21], { color: 'brass', parent: 'drawer' })
      .box([0.42, 0.02, 0.34], [0, 0.28, 0.0], { color: '#7a5230' });
    for (const x of [-0.2, 0.2]) for (const z of [-0.15, 0.15]) b.cyl([0.04, 0.18, 0.04], [x, 0.09, z], { color: '#7a5230', taper: 0.6, rot: [180, 0, 0] });
    b.cyl([0.12, 0.03, 0.12], [-0.12, 0.645, -0.05], { color: 'cream' })
      .stick([-0.12, 0.66, -0.05], [-0.12, 0.8, -0.05], 0.02, 'brass')
      .ball(0.07, [-0.12, 0.83, -0.05], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .cyl([0.22, 0.15, 0.22], [-0.12, 0.88, -0.05], { color: 'cream', taper: 0.65, edge: F })
      .box([0.1, 0.08, 0.05], [0.13, 0.67, 0.06], { color: '#e0473b', round: 0.4 })
      .cyl([0.06, 0.005, 0.06], [0.13, 0.67, 0.087], { color: 'white', rot: [90, 0, 0] })
      .socket('top', [0.1, 0.63, -0.05], 'top', { size: 0.25 });
    return b.act({ click: [[A.operate('lamp', 'on'), A.say('Click', 0.6)], [A.operate('drawer', 'out'), A.wait(1.5), A.operate('drawer', 'in'), A.operate('lamp', 'off')]] }).done();
  }),
  // A round NO EATING sign on its post: a white disc in a red ring with a red slash across a sandwich.
  e('no eating sign', 'ideas', 'signs', () => {
    const b = noSign('no eating sign');
    b.ball([0.2, 0.08, 0.02], [0, 1.6, 0.03], { color: '#d9a35f', parent: 'sign' })
      .box([0.22, 0.03, 0.022], [0, 1.57, 0.031], { color: '#7cc45a', parent: 'sign' })
      .box([0.2, 0.05, 0.022], [0, 1.53, 0.032], { color: '#b5543c', round: 0.5, parent: 'sign' })
      .box([0.2, 0.05, 0.02], [0, 1.49, 0.03], { color: '#d9a35f', round: 0.6, parent: 'sign' });
    noSlash(b);
    return b.act({ click: [A.pose('sign', { rot: [0, 0, 8], dur: 0.15 }), A.pose('sign', { rot: [0, 0, -8], dur: 0.15 }), A.pose('sign', { rot: [0, 0, 0], dur: 0.15 }), A.say('Tsk tsk!', 1.2)] }).done();
  }),
  // A round NO PARKING sign on its post: a blue disc in a red ring with a red slash, and a TOW AWAY plate below.
  e('no parking sign', 'ideas', 'signs', () => {
    const b = noSign('no parking sign', '#2f6fc8');
    noSlash(b);
    b.box([0.4, 0.14, 0.02], [0, 1.1, 0.0], { color: 'white', parent: 'sign' })
      .label('TOW AWAY', [0.36, 0.1], [0, 1.1, 0.012], { color: 'white', depth: 0.004, parent: 'sign' });
    return b.act({ click: [A.pose('sign', { rot: [0, 360, 0], dur: 0.8 }), A.pose('sign', { rot: [0, 0, 0], dur: 0 }), A.say('Tweeet!', 1.2)] }).done();
  }),
  // A bowl of ramen: a red lacquer bowl of broth with wavy noodles, a halved egg, spring onion and nori, and
  // chopsticks that lift a slurp of noodles.
  e('noodles', 'food', 'meals', () => {
    const b = m('noodles'), n = '#f6dc8a';
    b.cyl([0.12, 0.08, 0.12], [0, 0.04, 0], { color: '#c8322a', taper: 1.6, edge: S })
      .torus([0.195, 0.195, 0.015], [0, 0.08, 0], { color: '#8a1a22', rot: [90, 0, 0], tube: 0.08, edge: S })
      .cyl([0.18, 0.01, 0.18], [0, 0.075, 0], { color: '#e8b060' });
    around(6, 0.04, 0.4).forEach(([x, z]) => b.rod([x, 0.082, z], [-z * 1.2, 0.084, x * 1.2], 0.008, n));
    b.ball([0.045, 0.02, 0.035], [0.045, 0.085, 0.02], { color: 'white' })
      .ball(0.02, [0.045, 0.092, 0.02], { color: '#f0923b' })
      .box([0.05, 0.05, 0.004], [-0.05, 0.1, -0.05], { color: '#1e2a1e', rot: [0, 30, 0], edge: S })
      .each(5, (i) => b.cyl([0.012, 0.006, 0.012], [-0.02 + i * 0.012, 0.083, 0.05], { color: '#7cc45a' }))
      .stick([-0.02, 0.1, 0.03], [0.1, 0.24, -0.03], 0.008, '#7a5230', { name: 'sticks', pivot: [0.1, 0.24, -0.03] })
      .stick([-0.01, 0.1, 0.04], [0.11, 0.23, -0.02], 0.008, '#7a5230', { parent: 'sticks' })
      .rod([-0.015, 0.1, 0.035], [-0.02, 0.085, 0.03], 0.007, n, { parent: 'sticks' });
    return b.act({ click: [A.pose('sticks', { move: [0, 0.08, 0], dur: 0.4 }), A.say('Slurrrp!', 1.2), A.pose('sticks', { move: [0, 0, 0], dur: 0.4 }), A.effect('steam', { dur: 1.2 })] }).done();
  }),
  // A hangman's knot in heavy hemp rope hung from a hook on a post: the loop and the thirteen tight coils above
  // it; it sways and creaks.
  e('noose', 'workshop', 'rope', () => {
    const b = m('noose'), t = '#c8a870';
    b.box([0.25, 0.04, 0.2], [0, 0.02, 0], { color: '#7a5230', edge: S })
      .box([0.05, 0.8, 0.05], [0, 0.42, -0.08], { color: '#7a5230', edge: S })
      .stick([0, 0.75, -0.06], [0, 0.75, 0.0], 0.02, '#5c6166', { edge: S })
      .stick([0, 0.75, 0.0], [0, 0.62, 0.0], 0.03, t, { name: 'rope', pivot: [0, 0.75, 0] })
      .cyl([0.045, 0.12, 0.045], [0, 0.56, 0], { color: t, parent: 'rope' })
      .each(5, (i) => b.torus([0.05, 0.05, 0.018], [0, 0.51 + i * 0.025, 0], { color: '#a88850', rot: [90, 0, 0], tube: 0.25, noInk: true, parent: 'rope' }))
      .torus([0.13, 0.16, 0.03], [0, 0.42, 0], { color: t, tube: 0.16, parent: 'rope' });
    return b.act({ click: [A.pose('rope', { rot: [0, 0, 10], dur: 0.6 }), A.say('Creak...', 1.2), A.pose('rope', { rot: [0, 0, -8], dur: 0.6 }), A.pose('rope', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A big model nose on a stand, as in a doctor's office: the bridge, the round tip and the nostrils; it sneezes.
  e('nose', 'clinic', 'body parts', () => {
    const b = m('nose', { view: 'side' }), k = 'skin2';
    b.box([0.1, 0.025, 0.1], [0, 0.0125, -0.02], { color: '#5c6166', edge: S })
      .box([0.13, 0.17, 0.03], [0, 0.11, -0.04], { color: k, round: 0.5, name: 'face' })
      .rod([0, 0.17, -0.02], [0, 0.09, 0.045], 0.045, k, { parent: 'face' })
      .ball(0.055, [0, 0.078, 0.05], { color: k, parent: 'face' })
      .pair((s) => b.ball([0.035, 0.032, 0.04], [s * 0.028, 0.068, 0.025], { color: k, parent: 'face' }).ball([0.014, 0.01, 0.014], [s * 0.016, 0.054, 0.045], { color: '#5a3a2a', noInk: true, parent: 'face' }));
    return b.act({ click: [A.pose('face', { rot: [-10, 0, 0], dur: 0.5 }), A.say('Ah... ah...', 1), A.par(A.pose('face', { rot: [12, 0, 0], dur: 0.1 }), A.say('ACHOO!', 1.2), A.effect('water_spray', { dur: 0.6 })), A.pose('face', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A model nose wearing a gold nose ring through one nostril, beaded at the ends; it glints.
  e('nose ring', 'wardrobe', 'jewellery', () => {
    const b = m('nose ring', { view: 'side' }), k = 'skin3';
    b.box([0.1, 0.025, 0.1], [0, 0.0125, -0.02], { color: '#5c6166', edge: S })
      .box([0.13, 0.17, 0.03], [0, 0.11, -0.04], { color: k, round: 0.5 })
      .rod([0, 0.17, -0.02], [0, 0.09, 0.045], 0.045, k)
      .ball(0.055, [0, 0.078, 0.05], { color: k })
      .pair((s) => b.ball([0.035, 0.032, 0.04], [s * 0.028, 0.068, 0.025], { color: k }).ball([0.014, 0.01, 0.014], [s * 0.016, 0.054, 0.045], { color: '#4a2a1a', noInk: true }))
      .torus([0.036, 0.036, 0.007], [0.03, 0.045, 0.035], { color: 'gold', tube: 0.18, rot: [0, 90, 0], name: 'ring', pivot: [0.03, 0.06, 0.035], edge: S })
      .ball(0.009, [0.03, 0.03, 0.03], { color: 'gold', parent: 'ring' });
    return b.act({ click: [A.pose('ring', { rot: [20, 0, 0], dur: 0.2 }), A.par(A.pose('ring', { rot: [0, 0, 0], dur: 0.3 }), A.effect('sparkle', { dur: 0.8 }), A.say('Bling!', 0.8))] }).done();
  }),
  // A handwritten note folded in half and stood up like a little tent card on the desk, a heart doodled on its
  // front; it flips open to show the message.
  e('note', 'study', 'stationery', () => {
    const b = m('note', { edge: S });
    b.box([0.1, 0.07, 0.002], [0, 0.034, -0.012], { color: '#faf6ea', rot: [20, 0, 0] })
      .box([0.1, 0.07, 0.002], [0, 0.034, 0.012], { color: '#faf6ea', rot: [-20, 0, 0], name: 'flap', pivot: [0, 0.067, 0] })
      .heart(0.018, [0.025, 0.035, 0.0245], { color: '#e0473b', rot: [-20, 0, 0], parent: 'flap' })
      .box([0.05, 0.003, 0.001], [-0.015, 0.045, 0.0185], { color: '#2f4f8f', rot: [-20, 0, 0], parent: 'flap', noInk: true })
      .box([0.04, 0.003, 0.001], [-0.02, 0.03, 0.0235], { color: '#2f4f8f', rot: [-20, 0, 0], parent: 'flap', noInk: true });
    b.each(3, (i) => b.box([0.07 - i * 0.012, 0.003, 0.001], [-0.005, 0.05 - i * 0.012, 0.0005 - 0.01 + i * 0.0044], { color: '#2f4f8f', rot: [20, 0, 0], noInk: true }));
    return b.act({ click: [[A.pose('flap', { rot: [-140, 0, 0], dur: 0.5 }), A.say('Back soon!', 1.5)], [A.pose('flap', { rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A spiral-bound notebook standing up: a blue card cover with a white label and the silver coil; the cover
  // swings open on lined pages.
  e('notebook', 'study', 'books', () => {
    const b = m('notebook', { edge: S });
    b.box([0.17, 0.235, 0.02], [0.005, 0.12, -0.002], { color: '#faf6ea' })
      .each(8, (i) => b.box([0.14, 0.002, 0.001], [0.01, 0.2 - i * 0.022, 0.0085], { color: '#a8d8f5', noInk: true }))
      .box([0.18, 0.24, 0.004], [0, 0.12, 0.012], { color: '#2f6fc8', round: 0.2, name: 'cover', pivot: [-0.088, 0.12, 0.012], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .box([0.1, 0.04, 0.002], [0.01, 0.17, 0.0145], { color: 'white', parent: 'cover' })
      .label('NOTES', [0.08, 0.02], [0.01, 0.17, 0.015], { color: 'white', depth: 0.001, parent: 'cover' });
    b.each(9, (i) => b.torus([0.022, 0.022, 0.005], [-0.088, 0.015 + i * 0.026, 0.004], { color: '#c9ccd1', rot: [0, 90, 0], tube: 0.22 }));
    return b.act({ click: [[A.operate('cover', 'open'), A.say('Flip', 0.6)], [A.operate('cover', 'close')]] }).done();
  }),
  // A bar of white nougat studded with pistachios and almonds, on wafer paper, with a piece broken off the end.
  e('nougat', 'food', 'sweets', () => {
    const b = m('nougat');
    b.box([0.15, 0.004, 0.055], [-0.005, 0.002, 0], { color: '#f2e6cf', edge: S })
      .box([0.12, 0.04, 0.05], [-0.02, 0.024, 0], { color: '#f6efe0', round: 0.15, name: 'bar' })
      .box([0.025, 0.04, 0.05], [0.058, 0.024, 0], { color: '#f6efe0', round: 0.15, name: 'piece', parent: 'bar', piece: true });
    const nuts: Array<[number, number, string]> = [[-0.07, 0.015, '#7cb84a'], [-0.04, 0.032, '#c89a5a'], [-0.01, 0.014, '#7cb84a'], [0.02, 0.03, '#c89a5a'], [0.03, 0.014, '#7cb84a']];
    for (const [x, y, c] of nuts) b.ball([0.014, 0.01, 0.006], [x, y, 0.026], { color: c, noInk: true, parent: 'bar' });
    b.ball([0.012, 0.01, 0.006], [0.058, 0.03, 0.026], { color: '#7cb84a', noInk: true, parent: 'piece' });
    return b.act({ click: [[A.detach('piece', 'nougat piece'), A.say('Snap!', 0.8)], [A.reattach('piece')]] }).done();
  }),
  // A pistol-grip hose nozzle on a coil of green garden hose: the metal body, the trigger and the adjustable
  // orange head; it sprays.
  e('nozzle', 'garden', 'garden tools', () => {
    const b = m('nozzle');
    b.torus([0.26, 0.26, 0.03], [0, 0.015, 0], { color: '#3f9a4a', rot: [90, 0, 0], tube: 0.12 })
      .torus([0.2, 0.2, 0.03], [0, 0.04, 0], { color: '#3f9a4a', rot: [90, 0, 0], tube: 0.15 })
      .rod([0.1, 0.04, 0.0], [0.12, 0.08, 0.04], 0.025, '#3f9a4a')
      .box([0.035, 0.11, 0.035], [0.12, 0.13, 0.04], { color: '#5c6166', round: 0.3, rot: [0, 0, -12], edge: S })
      .box([0.13, 0.04, 0.04], [0.17, 0.195, 0.04], { color: '#c9ccd1', round: 0.3, edge: S })
      .cyl([0.05, 0.03, 0.05], [0.245, 0.195, 0.04], { color: '#f0923b', rot: [0, 0, 90], edge: S })
      .box([0.012, 0.06, 0.02], [0.15, 0.145, 0.04], { color: '#2a2726', rot: [0, 0, -15], name: 'trigger', pivot: [0.15, 0.175, 0.04], edge: S });
    return b.act({ click: [A.pose('trigger', { rot: [0, 0, 15], dur: 0.1 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Pssshhhh!', 1.4)), A.pose('trigger', { rot: [0, 0, 0], dur: 0.1 })] }).done();
  }),
  // A nuclear power station 60 m across: two hyperbolic cooling towers, the domed containment building with its
  // trefoil sign, the turbine hall and a chimney; steam billows from the towers.
  e('nuclear reactor', 'places', 'industry', () => {
    const b = m('nuclear reactor', { edge: S });
    b.box([62, 0.4, 40], [0, 0.2, 0], { color: '#9da3a8' });
    b.pair((s) => {
      const x = s * 16, z = -6;
      b.cyl([20, 16, 20], [x, 8.4, z], { color: '#d4d7da', taper: 0.62, segs: 20 })
        .cyl([12.4, 12, 12.4], [x, 22.4, z], { color: '#d4d7da', taper: 1.18, segs: 20 })
        .torus([14.6, 14.6, 0.6], [x, 28.3, z], { color: '#c8ccd1', rot: [90, 0, 0], tube: 0.04 })
        .cyl([20.4, 1.2, 20.4], [x, 1.0, z], { color: '#b8bcc0', segs: 20 })
        .cyl([12.6, 0.8, 12.6], [x, 16.6, z], { color: '#e0473b', segs: 20, noInk: true });
    });
    b.cyl([14, 12, 14], [0, 6.4, 10], { color: '#e8e4dc', segs: 20 })
      .dome([14, 8, 14], [0, 16.4, 10], { color: '#e8e4dc', edge: F })
      .cyl([4, 0.2, 4], [0, 8, 17.02], { color: '#f6d24a', rot: [90, 0, 0] });
    for (const a of [90, 210, 330]) b.wedge([1.6, 1.4, 0.1], [Math.cos(rad(a)) * 0.9, 8 + Math.sin(rad(a)) * 0.9, 17.1], { color: '#2a2726', rot: [0, 0, a + 90] });
    b.box([20, 10, 10], [22, 5.2, 12], { color: '#c8ccd1' })
      .each(6, (i) => b.box([2, 3, 0.1], [14 + i * 3.2, 6.5, 17.05], { color: '#8fbcd8' }))
      .cyl([2.4, 34, 2.4], [-24, 17.4, 14], { color: '#d4d7da', taper: 0.7 })
      .cyl([2.5, 2, 2.5], [-24, 30, 14], { color: '#e0473b', noInk: true });
    lamp(b, 'beacon', 1.0, [-24, 34.8, 14], '#e0473b');
    return b.act({ click: [[A.par(A.effect('steam', { dur: 3 }), A.operate('beacon', 'on'), A.say('Hummmmm...', 2))], [A.operate('beacon', 'off')]] }).done();
  }),
  // A gold nugget: a lumpy, water-worn lump of bright gold on a little velvet cushion; it gleams.
  e('nugget', 'nature', 'minerals', () => {
    const b = m('nugget');
    b.box([0.09, 0.012, 0.07], [0, 0.006, 0], { color: '#7a2a3a', round: 0.6 })
      .ball([0.04, 0.026, 0.032], [0, 0.025, 0], { color: '#e2b23a', name: 'gold' })
      .ball([0.022, 0.02, 0.02], [0.016, 0.03, 0.008], { color: '#f6d24a', parent: 'gold' })
      .ball([0.018, 0.016, 0.016], [-0.016, 0.022, -0.006], { color: '#c8962a', parent: 'gold' })
      .ball(0.006, [0.004, 0.036, 0.01], { color: '#fff3a0', noInk: true, parent: 'gold' });
    return b.act({ click: [A.par(A.pose('gold', { scale: 1.15, dur: 0.3 }), A.effect('sparkle', { dur: 1.2 }), A.say('Bling!', 1)), A.pose('gold', { scale: 1, dur: 0.3 })] }).done();
  }),
  // A Fat Man style atomic bomb on its transport cradle: the fat olive steel casing with its seams, the box tail
  // fins and a warning lamp; the lamp flashes and it beeps (it never goes off).
  e('nuke', 'armory', 'explosives', () => {
    const b = m('nuke', { view: 'side', edge: S });
    b.box([0.9, 0.2, 1.6], [0, 0.1, 0], { color: '#5c6166' })
      .pair((s) => b.box([0.1, 0.35, 0.1], [s * 0.4, 0.37, 0.5], { color: '#5c6166' }).box([0.1, 0.35, 0.1], [s * 0.4, 0.37, -0.5], { color: '#5c6166' }))
      .loft([1.5, 1.5, 3.2], [0, 1.25, 0], [[0, 0.5, 0.5], [0.15, 0.95, 0.95], [0.55, 1, 1], [0.85, 0.92, 0.92], [1, 0.55, 0.55]], { color: '#6a7a4a', edge: F })
      .each(3, (i) => b.torus([1.5, 1.5, 0.03], [0, 1.25, -0.6 + i * 0.6], { color: '#4a5a2a', tube: 0.02, rot: [0, 0, 0], noInk: true }))
      .box([1.3, 1.3, 0.6], [0, 1.25, -1.85], { color: '#5a6a3a' })
      .box([1.1, 1.1, 0.62], [0, 1.25, -1.85], { color: '#3a4a2a' })
      .box([0.2, 0.2, 0.04], [0, 1.6, 1.42], { color: '#f6d24a' });
    lamp(b, 'warning', 0.14, [0, 2.05, 0.6], '#e0473b');
    return b.act({ click: [A.operate('warning', 'on'), A.say('Beep beep beep!', 1.4), A.wait(0.3), A.operate('warning', 'off'), A.wait(0.3), A.operate('warning', 'on'), A.wait(0.3), A.operate('warning', 'off')] }).done();
  }),
  // A two-storey nursing home 24 m wide: cream clapboard walls, a long porch with white posts and rocking
  // chairs, a wheelchair ramp, window boxes of flowers, a gable over the entrance and a sign; a rocker rocks.
  e('nursing home', 'places', 'houses', () => {
    const b = m('nursing home', { edge: S }), w = '#f2e6cf', tr = 'white';
    b.box([26, 0.3, 14], [0, 0.15, 0], { color: '#9da3a8' })
      .box([24, 6.4, 10], [0, 3.5, -1.5], { color: w, round: 0.01 });
    gable(b, 24, 10, 6.7, 2.8, '#5c6166', { ridgeX: true, z: -1.5, eave: 0.4 });
    b.box([6, 2, 0.6], [0, 7.6, 3.6], { color: w })
      .wedge([6.4, 2.0, 0.8], [0, 9.6, 3.6], { color: '#5c6166' })
      .box([20, 0.25, 3], [0, 0.55, 5.0], { color: '#b8a888' })
      .box([20.4, 0.15, 3.4], [0, 3.2, 5.0], { color: '#5c6166' })
      .each(7, (i) => b.box([0.15, 2.6, 0.15], [-9.6 + i * 3.2, 1.9, 6.4], { color: tr }))
      .box([20, 0.08, 0.08], [0, 1.4, 6.4], { color: tr })
      .box([1.6, 0.15, 4.5], [11.6, 0.3, 5.3], { color: '#b8a888', rot: [-4, 0, 0] })
      .box([4.4, 0.6, 0.1], [0, 4.1, 3.62], { color: '#3f7a5a' })
      .label('SUNNY ACRES', [4.0, 0.45], [0, 4.1, 3.68], { color: '#3f7a5a', depth: 0.02 });
    door(b, [0, 0.67, 3.52], 1.6, 2.3, { color: '#3f7a5a', frame: tr, glass: true });
    for (const x of [-9, -6, -3, 3, 6, 9]) {
      win(b, [x, 2.0, 3.52], 1.2, 1.4, { frame: tr });
      win(b, [x, 5.0, 3.52], 1.2, 1.3, { frame: tr });
      b.box([1.3, 0.2, 0.25], [x, 4.25, 3.7], { color: '#8a5a35' }).ball([1.2, 0.2, 0.2], [x, 4.42, 3.7], { color: '#e0473b', edge: F });
    }
    for (const x of [-5, 5]) {
      const n = x < 0 ? 'rocker' : 'rocker2';
      b.box([0.6, 0.06, 0.55], [x, 1.1, 5.2], { color: '#7a5230', name: n, pivot: [x, 0.7, 5.2] })
        .box([0.6, 0.7, 0.06], [x, 1.45, 4.92], { color: '#7a5230', rot: [-10, 0, 0], parent: n })
        .pair((s) => b.arc([0.9, 0.3, 0.04], [x + s * 0.28, 0.85, 5.2], { color: '#5a3a22', rot: [180, 90, 0], tube: 0.15, parent: n }).box([0.05, 0.4, 0.05], [x + s * 0.28, 0.95, 5.4], { color: '#7a5230', parent: n }));
    }
    return b.act({ click: [A.pose('rocker', { rot: [8, 0, 0], dur: 0.5 }), A.pose('rocker', { rot: [-8, 0, 0], dur: 0.6 }), A.pose('rocker', { rot: [0, 0, 0], dur: 0.5 }), A.say('Creak, creak', 1.2), A.operate('door', 'open'), A.wait(1.5), A.operate('door', 'close')] }).done();
  }),
  // A hex nut threaded on a bolt standing head-down: the bolt's hexagon head, the threaded shank and the nut,
  // which spins down the thread and back up.
  e('nut (hardware)', 'workshop', 'hardware', () => {
    const b = m('nut (hardware)', { edge: S });
    b.prism([0.03, 0.012, 0.03], [0, 0.006, 0], 6, { color: '#8f99a3' })
      .cyl([0.016, 0.08, 0.016], [0, 0.052, 0], { color: '#9da3a8' });
    b.each(12, (i) => b.torus([0.017, 0.017, 0.002], [0, 0.02 + i * 0.006, 0], { color: '#7a838c', rot: [90, 0, 0], tube: 0.15, noInk: true }));
    b.prism([0.03, 0.014, 0.03], [0, 0.08, 0], 6, { color: '#c9ccd1', name: 'nut', mover: { kind: 'slide', axis: 'y', amount: -0.05 } })
      .cyl([0.017, 0.015, 0.017], [0, 0.08, 0], { color: '#5c6166', parent: 'nut' });
    return b.act({ click: [[A.par(A.operate('nut', 'down'), A.pose('nut', { rot: [0, 720, 0], dur: 0.4 })), A.say('Whirr', 0.8)], [A.par(A.operate('nut', 'up'), A.pose('nut', { rot: [0, 0, 0], dur: 0.4 }))]] }).done();
  }),
  // A chrome lever nutcracker (19 cm) stood on its handles: two arms on a riveted hinge, each bowing out round a
  // toothed jaw that holds a walnut, then running down into a red rubber grip; squeeze, crack.
  e('nutcracker (kitchen)', 'kitchen', 'utensils', () => {
    const b = m('nutcracker (kitchen)', { edge: S }), H: V = [0, 0.19, 0], chrome = '#c9ccd1';
    b.pair((s) => {
      const arm = `arm${s > 0 ? 'L' : 'R'}`;
      b.rod([s * 0.004, 0.19, 0], [s * 0.021, 0.168, 0], 0.012, chrome, { name: arm, pivot: H })
        .rod([s * 0.021, 0.168, 0], [s * 0.025, 0.122, 0], 0.013, chrome, { parent: arm })
        .rod([s * 0.025, 0.122, 0], [s * 0.048, 0.012, 0], 0.012, chrome, { parent: arm })
        .rod([s * 0.035, 0.078, 0], [s * 0.047, 0.016, 0], 0.017, '#c8322a', { parent: arm, edge: F })
        .each(3, (i) => b.box([0.005, 0.004, 0.012], [s * 0.0165, 0.134 + i * 0.011, 0], { color: '#9da3a8', parent: arm }));
    });
    b.cyl([0.017, 0.022, 0.017], H, { color: '#8f99a3', rot: [90, 0, 0] })
      .cyl([0.008, 0.026, 0.008], H, { color: '#5c6166', rot: [90, 0, 0] })
      .ball([0.031, 0.029, 0.029], [0, 0.145, 0], { color: '#a87a4a', name: 'walnut', edge: F })
      .ball([0.004, 0.03, 0.031], [0, 0.145, 0], { color: '#7a5230', parent: 'walnut', noInk: true, edge: F });
    return b.act({ click: [A.par(A.pose('armL', { rot: [0, 0, -5], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 5], dur: 0.3 })), A.par(A.pose('walnut', { scale: 0.75, dur: 0.1 }), A.say('CRACK!', 1), A.effect('dust', { dur: 0.6 })), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('walnut', { scale: 1, dur: 0.3 }))] }).done();
  }),
  // A wooden nutcracker soldier 40 cm tall: tall black busby with a gold plume, painted face and white beard, red
  // tunic with gold buttons and belt, black boots on a stand; his jaw drops and snaps shut.
  e('nutcracker (toy)', 'toys', 'holiday', () => {
    const b = m('nutcracker (toy)');
    b.box([0.14, 0.02, 0.1], [0, 0.01, 0], { color: '#3f7a3a', edge: S })
      .pair((s) => b.cyl([0.05, 0.1, 0.06], [s * 0.032, 0.07, 0], { color: '#2a2726' }).cyl([0.042, 0.08, 0.042], [s * 0.032, 0.16, 0], { color: 'white' }))
      .cyl([0.11, 0.14, 0.08], [0, 0.26, 0], { color: '#c8322a', name: 'body' })
      .box([0.112, 0.016, 0.082], [0, 0.21, 0], { color: '#2a2726', parent: 'body' })
      .box([0.03, 0.02, 0.01], [0, 0.21, 0.042], { color: 'gold', parent: 'body', edge: S })
      .each(3, (i) => b.ball(0.008, [0, 0.25 + i * 0.03, 0.042], { color: 'gold', parent: 'body' }))
      .pair((s) => b.capsule([0.035, 0.13, 0.035], [s * 0.07, 0.26, 0], { color: '#c8322a', parent: 'body' }).ball(0.022, [s * 0.075, 0.19, 0.0], { color: '#f2d6c2', parent: 'body' }))
      .box([0.08, 0.07, 0.07], [0, 0.37, 0], { color: '#f2d6c2', round: 0.4, parent: 'body' })
      .pair((s) => b.ball(0.01, [s * 0.017, 0.38, 0.036], { color: '#2a2726', parent: 'body', eye: true }))
      .ball([0.04, 0.012, 0.012], [0, 0.39, 0.037], { color: 'white', parent: 'body' })
      .box([0.07, 0.03, 0.04], [0, 0.322, 0.02], { color: 'white', round: 0.4, name: 'jaw', parent: 'body', pivot: [0, 0.34, 0.0] })
      .cyl([0.09, 0.1, 0.08], [0, 0.45, 0], { color: '#2a2726', parent: 'body' })
      .capsule([0.016, 0.06, 0.016], [0.035, 0.5, 0.0], { color: 'gold', parent: 'body' });
    return b.act({ click: [A.pose('jaw', { rot: [25, 0, 0], dur: 0.25 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.12 }), A.say('Crack!', 0.8), A.pose('jaw', { rot: [25, 0, 0], dur: 0.25 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.12 })] }).done();
  }),
  // A walnut in its shell, split along its seam: the wrinkled brown halves and the kernel inside; the top half
  // lifts off and goes back.
  e('nutshell', 'food', 'nuts', () => {
    const b = m('nutshell');
    b.dome([0.04, 0.016, 0.034], [0, 0.009, 0], { color: '#a87a4a', rot: [180, 0, 0] })
      .ball([0.034, 0.02, 0.028], [0, 0.017, 0], { color: '#c8a070' })
      .dome([0.04, 0.016, 0.034], [0, 0.026, 0], { color: '#a87a4a', name: 'half', pivot: [0, 0.018, -0.017] })
      .ball([0.02, 0.006, 0.026], [-0.008, 0.03, 0], { color: '#8a5a35', parent: 'half', noInk: true })
      .ball([0.016, 0.006, 0.022], [0.009, 0.029, 0.002], { color: '#8a5a35', parent: 'half', noInk: true })
      .torus([0.041, 0.035, 0.003], [0, 0.018, 0], { color: '#7a5230', rot: [90, 0, 0], tube: 0.08, noInk: true });
    return b.act({ click: [[A.pose('half', { rot: [-100, 0, 0], dur: 0.4 }), A.say('Crack!', 0.8)], [A.pose('half', { rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A wooden rowing oar 2.4 m long stood in its rack: a varnished loom with a leather collar, the grip, and the
  // painted spoon blade; it pulls a stroke with a splash.
  e('oar', 'sea', 'boating', () => {
    const b = m('oar', { edge: S });
    b.box([0.4, 0.06, 0.3], [0, 0.03, 0], { color: '#7a5230' })
      .box([0.06, 1.2, 0.06], [-0.12, 0.6, -0.1], { color: '#7a5230' })
      .box([0.2, 0.05, 0.08], [-0.05, 1.15, -0.08], { color: '#7a5230' })
      .stick([0, 0.06, 0], [0, 2.4, 0], 0.045, '#d8b07a', { name: 'oar', pivot: [0, 1.15, 0] })
      .box([0.16, 0.55, 0.02], [0, 0.34, 0], { color: '#2f6fc8', round: 0.5, parent: 'oar' })
      .box([0.162, 0.12, 0.022], [0, 0.5, 0], { color: 'white', round: 0.3, parent: 'oar', noInk: true })
      .cyl([0.06, 0.18, 0.06], [0, 1.45, 0], { color: '#8a5a35', parent: 'oar', edge: F })
      .capsule([0.04, 0.2, 0.04], [0, 2.32, 0], { color: '#5a3a22', parent: 'oar', edge: F });
    return b.act({ click: [A.pose('oar', { rot: [30, 0, 0], dur: 0.5 }), A.par(A.pose('oar', { rot: [-25, 0, 0], dur: 0.6 }), A.effect('water_spray', { dur: 0.8 }), A.say('Splash!', 1)), A.pose('oar', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A desert oasis 12 m across: a spring-fed pool among golden dunes and rocks, date palms leaning over it and
  // green grass round the water; a camel wanders up for a drink. (Real size wins over the vocabulary's 10 cm.)
  e('oasis', 'nature', 'landforms', () => {
    const b = m('oasis');
    b.cyl([12, 0.3, 10], [0, 0.15, 0], { color: '#e8d29a' })
      .ball([5, 1.2, 3], [-3.5, 0.3, -3], { color: '#e0c888' })
      .ball([4, 1.0, 3], [4, 0.25, -2.6], { color: '#e8d29a' })
      .cyl([5.6, 0.32, 4.2], [0.3, 0.16, 0.8], { color: '#7ab84a' })
      .cyl([4.4, 0.34, 3.2], [0.3, 0.17, 0.8], { color: '#3f9bd6' })
      .ball([1.2, 0.6, 1.0], [2.8, 0.3, 2.6], { color: '#b8a070' })
      .ball([0.8, 0.4, 0.7], [-2.8, 0.2, 2.8], { color: '#a89060' });
    const palm = (x: number, z: number, h: number, lean: number, n: string) => {
      const top: V = [x + lean, h, z];
      b.rod([x, 0.2, z], [x + lean * 0.5, h * 0.55, z], 0.32, '#8a6440', { name: n, pivot: [x, 0.2, z] })
        .rod([x + lean * 0.5, h * 0.55, z], top, 0.26, '#7a5a3a', { parent: n });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        b.ball([2.4, 0.1, 0.5], [top[0] + Math.cos(a) * 1.1, h - 0.35, z + Math.sin(a) * 1.1], { color: i % 2 ? '#3f8a3a' : '#4f9a42', rot: [0, (-a * 180) / Math.PI, -18], parent: n, edge: F });
      }
      b.ball(0.5, [top[0], h - 0.4, z], { color: '#c8642a', parent: n });
    };
    palm(-1.8, 0.2, 6.5, 0.6, 'palm1');
    palm(2.4, -0.4, 5.2, -0.5, 'palm2');
    palm(-0.6, 2.6, 4.2, 0.3, 'palm3');
    return b.act({ click: [A.par(A.pose('palm1', { rot: [0, 0, 4], dur: 0.6 }), A.pose('palm2', { rot: [0, 0, -4], dur: 0.6 })), A.spawn('cm', 'camel', { rel: 'front', of: 'self', dist: 'near' }), A.say('Hrrumph!', 1.2, 'cm'), A.par(A.pose('palm1', { rot: [0, 0, 0], dur: 0.6 }), A.pose('palm2', { rot: [0, 0, 0], dur: 0.6 })), A.wait(1), A.remove('cm', 'fade')] }).done();
  }),
  // A bowl of oatmeal porridge with blueberries, banana slices and a swirl of honey, and a spoon that stirs it.
  e('oatmeal', 'food', 'breakfast', () => {
    const b = m('oatmeal');
    b.cyl([0.15, 0.065, 0.15], [0, 0.0325, 0], { color: 'white', taper: 1.35, edge: S })
      .cyl([0.18, 0.01, 0.18], [0, 0.062, 0], { color: '#e8d4a8' });
    around(5, 0.04, 0.3).forEach(([x, z]) => b.ball(0.014, [x, 0.07, z], { color: '#3a3a7a' }));
    b.each(3, (i) => b.cyl([0.025, 0.008, 0.025], [0.04 - i * 0.02, 0.068, -0.03 + i * 0.01], { color: '#f6e8a0' }))
      .torus([0.05, 0.05, 0.006], [-0.03, 0.068, 0.02], { color: '#e8a83a', rot: [90, 0, 0], tube: 0.15, noInk: true })
      .stick([0.02, 0.07, 0.02], [0.1, 0.16, 0.04], 0.008, '#c9ccd1', { name: 'spoon', pivot: [0.02, 0.07, 0.02], edge: S });
    return b.act({ click: [A.pose('spoon', { rot: [0, 360, 0], dur: 0.8 }), A.pose('spoon', { rot: [0, 0, 0], dur: 0 }), A.par(A.effect('steam', { dur: 1.5 }), A.say('Mmm!', 1))] }).done();
  }),
  // Cleopatra's Needle, an Egyptian obelisk 21 m tall in its real proportions: a single shaft of pink granite
  // carved with hieroglyphs, a gilded pyramidion on top and a stepped plinth; the sun glints off its cap.
  e('obelisk', 'places', 'landmarks', () => {
    // (a 4-sided prism's faces already face front with no turn: its size is the corner-to-corner width, so a
    // 2.4 m square shaft is 2.4 * sqrt 2 across; the glyphs sit on the tapering front and right faces)
    const b = m('obelisk', { edge: S }), g = '#c8a090', half = 1.2, tp = 0.62, y0 = 2.7, L = 17.6;
    const face = (y: number) => half * (1 - (1 - tp) * ((y - y0) / L));
    b.each(3, (i) => b.box([6 - i * 1.0, 0.5, 6 - i * 1.0], [0, 0.25 + i * 0.5, 0], { color: '#b8b2a4' }))
      .box([3.4, 1.2, 3.4], [0, 2.1, 0], { color: '#a8a296' })
      .box([3.6, 0.15, 3.6], [0, 2.62, 0], { color: '#b8b2a4' })
      .cyl([2 * half * Math.SQRT2, L, 2 * half * Math.SQRT2], [0, y0 + L / 2, 0], { color: g, segs: 4, taper: tp })
      .pyramid([2 * half * tp * Math.SQRT2, 1.4, 2 * half * tp * Math.SQRT2], [0, y0 + L + 0.7, 0], 4, { color: '#e2b23a', name: 'cap' });
    for (let i = 0; i < 9; i++) {
      const y = 4.5 + i * 1.7, f = face(y), k = f / half;
      for (const c of [-1, 0, 1]) {
        b.box([0.26, 0.36, 0.03], [c * 0.55 * k, y, f - 0.008], { color: '#9a7060', noInk: true, round: 0.1 });
        b.box([0.03, 0.36, 0.26], [f - 0.008, y, c * 0.55 * k], { color: '#9a7060', noInk: true, round: 0.1 });
      }
    }
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.pose('cap', { scale: 1.1, dur: 0.3 })), A.pose('cap', { scale: 1, dur: 0.3 })] }).done();
  }),
  // An oboe standing on its peg: the black grenadilla body in three joints, silver keys and rings, the flared
  // bell and the double reed; it plays a reedy note.
  e('oboe', 'music', 'woodwinds', () => {
    const b = m('oboe');
    b.cyl([0.12, 0.012, 0.12], [0, 0.006, 0], { color: '#3a3633', edge: S })
      .stick([0, 0.012, 0], [0, 0.06, 0], 0.012, '#5c6166', { edge: S })
      .cyl([0.065, 0.08, 0.065], [0, 0.07, 0], { color: '#2a2726', taper: 0.45, name: 'oboe' })
      .cyl([0.032, 0.5, 0.032], [0, 0.36, 0], { color: '#2a2726', taper: 0.7, parent: 'oboe' })
      .each(3, (i) => b.torus([0.036, 0.036, 0.006], [0, 0.13 + i * 0.17, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.15, parent: 'oboe' }))
      .each(8, (i) => b.cyl([0.012, 0.004, 0.012], [0.012 * (i % 2 ? 1 : -1), 0.17 + i * 0.045, 0.016], { color: '#c9ccd1', rot: [90, 0, 0], parent: 'oboe', edge: S }))
      .rod([0.016, 0.2, 0.012], [0.016, 0.5, 0.012], 0.004, '#c9ccd1', { parent: 'oboe' })
      .cyl([0.01, 0.04, 0.01], [0, 0.63, 0], { color: '#c87a4a', parent: 'oboe' })
      .box([0.008, 0.025, 0.003], [0, 0.66, 0], { color: '#d8c890', parent: 'oboe', edge: S });
    return b.act({ click: [A.par(A.pose('oboe', { rot: [0, 0, 5], dur: 0.4 }), A.say('Toot-toooo!', 1.6)), A.pose('oboe', { rot: [0, 0, -4], dur: 0.4 }), A.pose('oboe', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // An astronomical observatory 14 m tall: a round white tower with a door and windows, the silver dome on top
  // with its shutter slit; the dome turns, the shutter slides open and the telescope tilts up to the stars.
  e('observatory', 'places', 'science buildings', () => {
    const b = m('observatory', { edge: S });
    b.box([14, 0.3, 14], [0, 0.15, 0], { color: '#9da3a8' })
      .cyl([10, 7, 10], [0, 3.8, 0], { color: '#f2f0ea', segs: 24 })
      .cyl([10.6, 0.4, 10.6], [0, 7.4, 0], { color: '#c9ccd1', segs: 24 })
      .dome([10.2, 5.2, 10.2], [0, 10.2, 0], { color: '#d4d7da', name: 'dome', pivot: [0, 7.6, 0], mover: { kind: 'spin', axis: 'y', amount: 20 } })
      .box([1.6, 4.6, 0.3], [0, 10.9, 3.75], { color: '#3a3d40', rot: [-48, 0, 0], parent: 'dome' })
      .box([1.9, 4.8, 0.2], [0, 11.0, 3.88], { color: '#c9ccd1', rot: [-48, 0, 0], parent: 'dome', name: 'shutter', mover: { kind: 'slide', axis: 'x', amount: 2.0 } })
      .cyl([1.0, 4.4, 1.0], [0, 10.0, 0.6], { color: 'white', rot: [-40, 0, 0], parent: 'dome', name: 'telescope', pivot: [0, 8.6, -0.6] });
    door(b, [0, 0.3, 4.98], 1.2, 2.3, { color: '#2f4f8f' });
    for (const a of [40, -40]) b.box([0.8, 1.2, 0.2], [Math.sin(rad(a)) * 5.0, 4.6, Math.cos(rad(a)) * 5.0], { color: '#2b3f66', rot: [0, a, 0] });
    return b.act({ click: [[A.operate('dome', 'on'), A.wait(1.5), A.operate('dome', 'off'), A.operate('shutter', 'open'), A.pose('telescope', { rot: [-20, 0, 0], dur: 1 }), A.effect('sparkle', { dur: 1.5 })], [A.pose('telescope', { rot: [0, 0, 0], dur: 1 }), A.operate('shutter', 'close')]] }).done();
  }),
  // A lump of obsidian, black volcanic glass with sharp glossy conchoidal facets, and a flaked arrowhead knapped
  // from it that comes away.
  e('obsidian', 'nature', 'rocks', () => {
    const b = m('obsidian', { edge: S });
    b.pyramid([0.2, 0.14, 0.18], [0, 0.07, 0], 5, { color: '#1a1716', taper: 0.3, name: 'rock' })
      .pyramid([0.12, 0.1, 0.12], [0.07, 0.05, 0.05], 4, { color: '#2a2630', rot: [0, 30, 20], parent: 'rock' })
      .ball([0.05, 0.03, 0.01], [-0.03, 0.09, 0.07], { color: '#6a6a7a', noInk: true, parent: 'rock' })
      .cone([0.04, 0.07, 0.008], [0.14, 0.035, 0.06], { color: '#2a2630', segs: 3, name: 'arrowhead', parent: 'rock', piece: true });
    return b.act({ click: [[A.effect('sparkle', { dur: 1 }), A.detach('arrowhead', 'arrowhead')], [A.reattach('arrowhead')]] }).done();
  }),
  // A patch of open ocean 20 m across: deep blue water heaving in rolling wave crests with white foam; a shark
  // cuts through. (Flat by nature: the vocabulary's 12 m is its span, not its height.)
  e('ocean', 'nature', 'water', () => {
    const b = m('ocean');
    b.box([20, 0.4, 20], [0, 0.2, 0], { color: '#2f6fb8', round: 0.1, name: 'sea' });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      const x = -8 + i * 4 + (j % 2) * 2, z = -7.5 + j * 5;
      b.ball([3.2, 0.5, 1.4], [x, 0.4, z], { color: j % 2 ? '#3f7fc8' : '#2a64a8', parent: 'sea', name: `wave${i}_${j}` })
        .ball([1.4, 0.12, 0.5], [x + 0.4, 0.62, z + 0.2], { color: 'white', parent: `wave${i}_${j}`, noInk: true });
    }
    const swell = (k: number) => A.par(...[0, 2, 4].map((i) => A.pose(`wave${i}_1`, { move: [0, k, 0], dur: 0.6 })), ...[1, 3].map((i) => A.pose(`wave${i}_2`, { move: [0, -k, 0], dur: 0.6 })));
    return b.act({ click: [A.par(swell(0.3), A.effect('water_spray', { dur: 1.5 })), A.spawn('sh', 'shark', { rel: 'front', of: 'self', dist: 'close' }), A.say('Swoosh...', 1.2), swell(0), A.wait(1), A.remove('sh', 'sink')] }).done();
  }),
  // A regular octagon as a sculpture: a chunky eight-sided red tile with a white rim, on a plinth; it turns.
  e('octagon', 'ideas', 'shapes', () =>
    m('octagon', { edge: S })
      .box([0.1, 0.012, 0.05], [0, 0.006, 0], { color: 'wood', round: 0.3 })
      .prism([0.1, 0.02, 0.1], [0, 0.065, 0], 8, { color: '#e0473b', rot: [90, 22.5, 0], name: 'shape', pivot: [0, 0.065, 0] })
      .prism([0.08, 0.022, 0.08], [0, 0.065, 0], 8, { color: '#f7f5ef', rot: [90, 22.5, 0], parent: 'shape' })
      .prism([0.07, 0.024, 0.07], [0, 0.065, 0], 8, { color: '#e0473b', rot: [90, 22.5, 0], parent: 'shape' })
      .act({ click: [A.pose('shape', { rot: [0, 360, 0], dur: 0.8 }), A.pose('shape', { rot: [0, 0, 0], dur: 0 }), A.say('Whirl!', 1)] })
      .done(),
  ),
  // A car's mileage counter on a dashboard gauge: the black dial with its needle and the row of rolling digit
  // drums; the needle swings up and the last drum rolls on.
  e('odometer', 'garage', 'car parts', () => {
    const b = m('odometer', { edge: S });
    b.box([0.12, 0.012, 0.06], [0, 0.006, -0.01], { color: '#3a3633' })
      .cyl([0.12, 0.03, 0.12], [0, 0.07, 0], { color: '#2a2726', rot: [90, 0, 0] })
      .torus([0.122, 0.122, 0.01], [0, 0.07, 0.012], { color: '#c9ccd1', tube: 0.06 })
      .cyl([0.105, 0.004, 0.105], [0, 0.07, 0.016], { color: '#1a1716', rot: [90, 0, 0] });
    for (let i = 0; i < 9; i++) {
      const a = rad(-120 + i * 30);
      b.box([0.003, 0.01, 0.002], [Math.sin(a) * 0.045, 0.07 + Math.cos(a) * 0.045, 0.019], { color: 'white', rot: [0, 0, -(-120 + i * 30)], noInk: true });
    }
    b.box([0.003, 0.04, 0.002], [0, 0.085, 0.021], { color: '#f0923b', name: 'needle', pivot: [0, 0.07, 0.021], rot: [0, 0, 100] })
      .box([0.06, 0.014, 0.004], [0, 0.045, 0.019], { color: '#3a3633' });
    for (let i = 0; i < 6; i++) b.label(`${[0, 4, 2, 7, 1, 9][i]}`, [0.008, 0.011], [-0.0225 + i * 0.009, 0.045, 0.021], { color: i === 5 ? '#e0473b' : 'white', depth: 0.002, name: i === 5 ? 'drum' : `digit${i}`, ...(i === 5 ? { pivot: [0.0225, 0.045, 0.016] } : {}) });
    return b.act({ click: [A.pose('needle', { rot: [0, 0, -100], dur: 1 }), A.pose('drum', { rot: [-360, 0, 0], dur: 0.6 }), A.say('Click... click', 1), A.pose('needle', { rot: [0, 0, 0], dur: 0.8 }), A.pose('drum', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
];

