/**
 * Catalog chunk objects-04: the words in assign/objects-04.tsv. Everything at its real size beside a 1.7 m person:
 * shops have 2.2 m doors that open and display windows at eye level, vehicles have seats, glass, lights and wheels
 * on axles, small things are their hand-held size. Sharp edges for made things, soft for organic ones.
 */
import { e, type CatalogEntry } from './types';
import { A, around, m, type M } from '../dsl';

type V = [number, number, number];

/** A tyre on its axle: soft rubber (named wheel*, so it rolls) with a sharp hub that rides on it. `dir` is which
 *  side faces out (+1 the thing's left, -1 its right). */
function wheel(b: M, name: string, at: V, dia: number, w: number, hub = 'silver', o: { dir?: number; parent?: string } = {}): M {
  const dir = o.dir ?? (Math.sign(at[0]) || 1);
  b.cyl([dia, w, dia], at, { color: 'rubber', rot: [0, 0, 90], name, edge: 'soft', segs: 20, ...(o.parent ? { parent: o.parent } : {}) });
  b.cyl([dia * 0.58, w * 0.3, dia * 0.58], [at[0] + dir * w * 0.38, at[1], at[2]], { color: hub, rot: [0, 0, 90], parent: name, edge: 'sharp' });
  b.cyl([dia * 0.2, w * 0.3, dia * 0.2], [at[0] + dir * w * 0.5, at[1], at[2]], { color: '#5a5f66', rot: [0, 0, 90], parent: name, edge: 'sharp' });
  return b;
}

/** A framed window on a wall facing +z (its glass at z): frame, glass, a sill, optional cross bars. */
function win(b: M, at: V, w: number, h: number, o: { frame?: string; glass?: string; sill?: string; bars?: boolean; name?: string; light?: boolean } = {}): M {
  const [x0, y, z] = at;
  b.box([w + 0.14, h + 0.14, 0.06], [x0, y, z], { color: o.frame ?? 'white', round: 0.15 });
  b.box([w, h, 0.05], [x0, y, z + 0.02], { color: o.glass ?? '#8fb8cc', round: 0.05, ...(o.name ? { name: o.name } : {}), ...(o.light ? { glow: true, mover: { kind: 'light', on: false } } : {}) });
  if (o.sill !== '') b.box([w + 0.3, 0.07, 0.16], [x0, y - h / 2 - 0.08, z + 0.06], { color: o.sill ?? o.frame ?? 'white', round: 0.2 });
  if (o.bars) {
    b.box([0.05, h, 0.03], [x0, y, z + 0.05], { color: o.frame ?? 'white', round: 0.2 });
    b.box([w, 0.05, 0.03], [x0, y + h * 0.1, z + 0.05], { color: o.frame ?? 'white', round: 0.2 });
  }
  return b;
}

/** A door on a wall facing +z: a dark opening behind, a frame, and the leaf `name` hinged on its -x edge that
 *  swings outward (toward the viewer) when opened, with a handle at 1.0 m. */
function door(b: M, name: string, at: V, w: number, h: number, o: { color?: string; frame?: string; glass?: boolean; hinge?: 1 | -1; amount?: number; parent?: string } = {}): M {
  const [x0, , z] = at;
  const hs = o.hinge ?? -1;
  const P = o.parent ? { parent: o.parent } : {};
  b.box([w + 0.16, h + 0.08, 0.07], [x0, h / 2 + 0.04 + at[1], z], { color: o.frame ?? '#3a3633', round: 0.1, ...P });
  b.box([w, h, 0.02], [x0, h / 2 + at[1], z + 0.03], { color: '#22201f', round: 0, noInk: true, ...P });
  b.box([w - 0.02, h - 0.02, 0.05], [x0, h / 2 + at[1], z + 0.06], { color: o.color ?? 'darkwood', round: 0.1, name, pivot: [x0 + hs * w / 2, h / 2 + at[1], z + 0.06], mover: { kind: 'swing', axis: 'y', amount: o.amount ?? hs * 100 }, ...P });
  if (o.glass) b.box([w * 0.62, h * 0.55, 0.02], [x0, h * 0.62 + at[1], z + 0.09], { color: '#8fb8cc', parent: name, round: 0.1 });
  b.box([0.04, 0.2, 0.05], [x0 - hs * (w / 2 - 0.1), 1.0 + at[1], z + 0.11], { color: 'silver', parent: name, round: 0.5 });
  return b;
}

interface ShopOpts {
  w: number;
  d: number;
  /** Wall height: 4-4.5 for one storey with a sign band, 6.5-7.5 for two. */
  h: number;
  wall: string;
  trim?: string;
  base?: string;
  sign: string;
  signC?: string;
  signBg?: string;
  /** Striped awning colours over the display windows (leave out for none). */
  awning?: [string, string];
  roof?: 'flat' | 'gable';
  roofC?: string;
  doorC?: string;
  frame?: string;
  glass?: string;
  /** Windows on the upper floor. */
  upper?: number;
}

/**
 * A shop or office at real size: a stone plinth, walls, a glass shopfront (two display windows either side of a
 * 2.2 m glazed door that swings out), a fascia sign over them, an optional striped awning, a cornice and a flat
 * roof with a parapet (or a gable), and a row of upper windows on two-storey buildings. Returns the builder so
 * each shop adds what it sells.
 */
function shop(key: string, o: ShopOpts): M {
  const { w, d, h } = o;
  const fz = d / 2, trim = o.trim ?? 'white', frame = o.frame ?? '#3a3633';
  const b = m(key, { edge: 'sharp' });
  b.box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.02, name: 'walls' })
    .box([w + 0.12, 0.35, d + 0.12], [0, 0.175, 0], { color: o.base ?? '#8a8580', round: 0.1 })
    .box([w + 0.3, 0.28, d + 0.3], [0, h - 0.1, 0], { color: trim, round: 0.15 })
    .box([w - 0.2, 0.06, d - 0.2], [0, h + 0.06, 0], { color: '#5a5550', round: 0 });
  door(b, 'door', [0, 0.1, fz], 1.0, 2.2, { color: o.doorC ?? frame, frame, glass: true });
  b.box([1.4, 0.1, 0.5], [0, 0.05, fz + 0.25], { color: o.base ?? '#8a8580', round: 0.2 });
  // display windows either side of the door: sill wall, frame, glass, a mullion
  const ww = w / 2 - 1.0;
  b.pair((s) => {
    const cx = s * (0.75 + ww / 2);
    b.box([ww + 0.12, 2.2, 0.06], [cx, 1.65, fz + 0.01], { color: frame, round: 0.1 });
    b.box([ww - 0.06, 2.05, 0.04], [cx, 1.65, fz + 0.04], { color: o.glass ?? '#9cc3d6', round: 0.05 });
    b.box([0.05, 2.05, 0.03], [cx, 1.65, fz + 0.06], { color: frame, round: 0.2 });
    b.box([ww + 0.2, 0.08, 0.2], [cx, 0.52, fz + 0.08], { color: trim, round: 0.2 });
  });
  // fascia sign
  const sy = Math.min(3.25, h - 0.7);
  b.box([w - 0.3, 0.62, 0.1], [0, sy, fz + 0.06], { color: o.signBg ?? frame, round: 0.15, name: 'fascia' });
  b.label(o.sign, [Math.min(w - 0.8, o.sign.length * 0.42), 0.42], [0, sy, fz + 0.12], { color: o.signC ?? 'white', depth: 0.02 });
  if (o.awning) {
    const n = Math.max(4, Math.round((w - 0.4) / 0.5));
    const sw = (w - 0.4) / n;
    for (let i = 0; i < n; i++) b.box([sw, 0.05, 1.1], [-(w - 0.4) / 2 + sw * (i + 0.5), 2.72, fz + 0.55], { color: o.awning[i % 2], rot: [22, 0, 0], round: 0.1 });
    b.box([w - 0.4, 0.22, 0.04], [0, 2.43, fz + 1.07], { color: o.awning[0], round: 0.1 });
  }
  if (o.upper) {
    const n = o.upper;
    for (let i = 0; i < n; i++) win(b, [(-(n - 1) / 2 + i) * ((w - 1) / n), h - 1.55, fz + 0.01], 0.9, 1.3, { frame: trim, bars: true });
  }
  // a gable roof with its ridge along x (the wedge's triangle turned to face the sides)
  if (o.roof === 'gable') b.wedge([d + 0.6, Math.min(3, d * 0.35), w + 0.6], [0, h + Math.min(3, d * 0.35) / 2 - 0.02, 0], { color: o.roofC ?? '#8a3b2e', rot: [0, 90, 0] });
  else {
    b.box([w + 0.1, 0.55, 0.16], [0, h + 0.27, fz - 0.03], { color: o.roofC ?? trim, round: 0.15 })
      .box([w + 0.1, 0.55, 0.16], [0, h + 0.27, -fz + 0.03], { color: o.roofC ?? trim, round: 0.15 })
      .pair((s) => void b.box([0.16, 0.55, d], [s * (w / 2 - 0.03), h + 0.27, 0], { color: o.roofC ?? trim, round: 0.15 }));
  }
  return b;
}

/** A tree at real size: a tapering trunk, a few branches and a crown of leaf clusters on a part named `top` (so it
 *  sways), with optional fruit hanging in it. */
function tree(key: string, o: { h: number; trunk?: string; crown: string; crown2?: string; w?: number; fruit?: string; nf?: number; fs?: number; split?: number }): M {
  const { h } = o, w = o.w ?? h * 0.7, tc = o.trunk ?? 'bark';
  const b = m(key);
  const ty = h * (o.split ?? 0.42);
  b.cyl([h * 0.075, ty, h * 0.075], [0, ty / 2, 0], { color: tc, taper: 0.75 });
  b.cyl([h * 0.11, h * 0.05, h * 0.11], [0, h * 0.025, 0], { color: tc, taper: 0.6 });
  for (const [bx, bz] of around(3, w * 0.22, 0.6)) b.rod([0, ty * 0.92, 0], [bx, h * 0.68, bz], h * 0.035, tc);
  b.ball([w * 0.72, h * 0.42, w * 0.72], [0, h * 0.74, 0], { color: o.crown, name: 'top' });
  for (const [cx, cz] of around(5, w * 0.3, 0.3)) b.ball([w * 0.46, h * 0.3, w * 0.46], [cx, h * 0.66 + Math.abs(cx) * 0.08, cz], { color: o.crown2 ?? o.crown, parent: 'top' });
  b.ball([w * 0.42, h * 0.26, w * 0.42], [0, h * 0.88, 0], { color: o.crown2 ?? o.crown, parent: 'top' });
  if (o.fruit) {
    const fs = o.fs ?? h * 0.03;
    around(o.nf ?? 9, w * 0.4, 0.2).forEach(([fx, fz], i) => void b.ball(fs, [fx * (0.9 + (i % 3) * 0.08), h * (0.56 + (i % 4) * 0.05), fz * (0.9 + (i % 2) * 0.12)], { color: o.fruit, parent: 'top', name: `fruit${i}`, piece: true }));
  }
  return b;
}

/** A square key-cap tile for a symbol; draw the glyph on its front at z = 0.02. */
function tile(key: string, c = 'white'): M {
  return m(key, { edge: 'sharp' }).box([0.13, 0.13, 0.03], [0, 0.065, 0], { color: c, round: 0.25, name: 'tile' });
}

/** A bottle standing at (x, z): body, shoulder, neck, cap (named `cap` when `capName` is given), label band. */
function bottle(b: M, x0: number, z: number, h: number, dia: number, color: string, cap: string, band?: string, capName?: string): M {
  const bh = h * 0.62;
  b.cyl([dia, bh, dia], [x0, bh / 2, z], { color })
    .cyl([dia, h * 0.18, dia], [x0, bh + h * 0.09, z], { color, taper: 0.4 })
    .cyl([dia * 0.4, h * 0.12, dia * 0.4], [x0, h * 0.86, z], { color })
    .cyl([dia * 0.46, h * 0.08, dia * 0.46], [x0, h * 0.96, z], { color: cap, edge: 'sharp', ...(capName ? { name: capName, piece: true } : {}) });
  if (band) b.cyl([dia * 1.03, bh * 0.5, dia * 1.03], [x0, bh * 0.5, z], { color: band, noInk: true });
  return b;
}

/** A plate (white china, sharp rim) for food to sit on. */
function plate(b: M, d = 0.26, y = 0, c = 'white'): M {
  b.cyl([d, 0.012, d], [0, y + 0.006, 0], { color: c, edge: 'sharp', name: 'plate' })
    .cyl([d * 0.7, 0.008, d * 0.7], [0, y + 0.006, 0], { color: c, taper: 0.9, edge: 'sharp', parent: 'plate', noInk: true });
  return b;
}

export const ENTRIES: CatalogEntry[] = [
  // Shown on a low bed so it reads as a blanket: quilted, with heating wires that glow when switched on at the
  // hand controller (whose LED lights too).
  e('electric blanket', 'home', 'bedding', () => {
    const b = m('electric blanket', { edge: 'sharp' });
    b.box([1.5, 0.2, 2.05], [0, 0.22, 0], { color: 'lightwood', round: 0.1 })
      .box([1.6, 0.95, 0.08], [0, 0.48, -1.06], { color: 'lightwood', round: 0.15 })
      .box([1.6, 0.08, 0.12], [0, 0.97, -1.06], { color: 'wood', round: 0.3 })
      .pair((s) => void b.box([0.08, 0.14, 0.08], [s * 0.7, 0.07, 0.95], { color: 'darkwood' }))
      .box([1.42, 0.2, 1.98], [0, 0.42, 0], { color: 'white', edge: 'soft', round: 0.4 })
      .pair((s) => void b.box([0.6, 0.13, 0.36], [s * 0.34, 0.585, -0.76], { color: '#f4efe6', edge: 'soft', round: 0.8 }))
      .box([1.54, 0.06, 1.5], [0, 0.55, 0.24], { color: '#ef9a8a', edge: 'soft', round: 0.6, name: 'blanket' })
      .box([1.54, 0.08, 0.26], [0, 0.58, -0.45], { color: '#f6b7aa', edge: 'soft', round: 0.8 })
      .pair((s) => void b.box([0.05, 0.34, 1.5], [s * 0.78, 0.4, 0.24], { color: '#ef9a8a', edge: 'soft', round: 0.6 }))
      .box([1.54, 0.34, 0.05], [0, 0.4, 0.99], { color: '#ef9a8a', edge: 'soft', round: 0.6 });
    for (let i = 0; i < 6; i++) b.box([0.018, 0.008, 1.36], [-0.6 + i * 0.24, 0.585, 0.26], { color: '#ff7a3a', glow: true, noInk: true, name: `wire${i}`, mover: { kind: 'light', on: false } });
    b.rod([0.62, 0.58, 0.8], [0.74, 0.5, 0.95], 0.012, 'white')
      .box([0.07, 0.03, 0.12], [0.5, 0.6, 0.72], { color: 'white', round: 0.4, rot: [0, 20, 0] })
      .cyl([0.03, 0.012, 0.03], [0.5, 0.62, 0.7], { color: '#c95a52' })
      .ball(0.012, [0.52, 0.62, 0.76], { color: '#ffb347', glow: true, name: 'led', mover: { kind: 'light', on: false } });
    return b
      .act({
        click: [
          [A.say('Click!', 1), A.par(A.operate('led', 'on'), A.operate('wire', 'on')), A.wait(1), A.effect('steam', { dur: 1.5 })],
          [A.par(A.operate('led', 'off'), A.operate('wire', 'off')), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A heavy oak chair with straps and a metal headpiece; the wall switch box beside it has a big lever and a lamp.
  e('electric chair', 'armory', 'execution', () => {
    const b = m('electric chair', { edge: 'sharp' });
    b.box([0.7, 0.1, 0.6], [0, 0.48, 0], { color: '#5a3a22', round: 0.1 })
      .box([0.7, 1.05, 0.1], [0, 1.0, -0.27], { color: '#5a3a22', round: 0.1 })
      .box([0.6, 0.12, 0.12], [0, 1.58, -0.27], { color: '#4a2f1c', round: 0.3 })
      .pair((s) => {
        b.box([0.1, 0.48, 0.1], [s * 0.3, 0.24, 0.24], { color: '#4a2f1c' }).box([0.1, 0.48, 0.1], [s * 0.3, 0.24, -0.24], { color: '#4a2f1c' });
        b.box([0.08, 0.28, 0.08], [s * 0.31, 0.67, 0.25], { color: '#4a2f1c' }).box([0.14, 0.07, 0.62], [s * 0.31, 0.84, 0], { color: '#5a3a22', round: 0.3 });
        b.box([0.16, 0.05, 0.08], [s * 0.31, 0.88, 0.12], { color: 'leather', edge: 'soft', round: 0.4 }).box([0.12, 0.08, 0.12], [s * 0.3, 0.12, 0.28], { color: 'leather', edge: 'soft', round: 0.4 });
        b.box([0.03, 0.03, 0.03], [s * 0.39, 0.88, 0.12], { color: 'brass' });
      })
      .box([0.75, 0.06, 0.05], [0, 0.9, -0.2], { color: 'leather', edge: 'soft', round: 0.4 })
      .box([0.6, 0.03, 0.62], [0, 0.07, 0.02], { color: '#3a3633' })
      .stick([0, 1.62, -0.28], [0, 1.95, -0.28], 0.05, 'iron')
      .stick([0, 1.95, -0.28], [0, 1.95, -0.08], 0.05, 'iron')
      .dome([0.26, 0.14, 0.26], [0, 1.6, -0.08], { color: 'metal', rot: [0, 0, 0] })
      .cyl([0.28, 0.04, 0.28], [0, 1.6, -0.08], { color: 'leather' })
      .rod([0.05, 1.95, -0.08], [0.6, 1.6, -0.45], 0.025, 'black', { edge: 'soft' })
      .stick([0.85, 0, -0.45], [0.85, 1.2, -0.45], 0.08, 'darkgray')
      .box([0.36, 0.5, 0.18], [0.85, 1.4, -0.45], { color: 'gray', round: 0.1, name: 'switchbox' })
      .box([0.3, 0.06, 0.2], [0.85, 1.67, -0.45], { color: 'darkgray', round: 0.2 })
      .box([0.06, 0.08, 0.06], [0.85, 1.38, -0.35], { color: 'darkgray' })
      .stick([0.85, 1.38, -0.33], [0.85, 1.62, -0.33], 0.035, 'black', { name: 'lever', pivot: [0.85, 1.38, -0.33], mover: { kind: 'swing', axis: 'x', amount: 140 } })
      .ball(0.06, [0.85, 1.64, -0.33], { color: 'red', parent: 'lever' })
      .ball(0.09, [0.85, 1.78, -0.45], { color: '#ff5a3a', glow: true, name: 'lamp', mover: { kind: 'light', on: false } })
      .label('DANGER', [0.28, 0.08], [0.85, 1.52, -0.355], { color: 'yellow', depth: 0.005 });
    return b
      .act({
        click: [
          [A.par(A.operate('lever', 'on'), A.operate('lamp', 'on')), A.par(A.effect('sparkle', { dur: 1.5 }), A.anim('shake', 2), A.say('BZZZZT!', 1.5)), A.wait(0.5), A.par(A.operate('lever', 'off'), A.operate('lamp', 'off'))],
        ],
      })
      .done();
  }),
  // A solid-body guitar (double cutaway, pickguard, three pickups, six tuners in a row) resting on its stand, a
  // little combo amp beside it whose light comes on when it plays.
  e('electric guitar', 'music', 'strings', () => {
    const b = m('electric guitar', { edge: 'sharp' });
    const red = '#c4202b';
    // stand: two splayed legs, a padded cradle and a neck yoke
    b.rod([-0.16, 0.0, 0.16], [0, 0.1, 0.0], 0.02, 'black')
      .rod([0.16, 0.0, 0.16], [0, 0.1, 0.0], 0.02, 'black')
      .rod([0, 0.0, -0.22], [0, 0.72, -0.06], 0.02, 'black')
      .box([0.34, 0.04, 0.08], [0, 0.1, 0.02], { color: '#3a3633', edge: 'soft', round: 0.6 })
      .arc([0.09, 0.07, 0.02], [0, 0.72, -0.04], { color: 'black', rot: [90, 0, 0], arc: 200 });
    // the guitar, leaning back a little against the yoke
    const g = (y: number, z = 0): V => [0, y, 0.02 - (y - 0.1) * 0.08 + z];
    b.ball([0.33, 0.24, 0.045], g(0.24), { color: red, rot: [-5, 0, 0], name: 'body', edge: 'soft' })
      .ball([0.27, 0.2, 0.045], g(0.4), { color: red, rot: [-5, 0, 0], parent: 'body', edge: 'soft' })
      .capsule([0.065, 0.16, 0.045], [0.1, 0.5, g(0.5)[2]], { color: red, rot: [-5, 0, -12], parent: 'body', edge: 'soft' })
      .capsule([0.06, 0.11, 0.045], [-0.1, 0.47, g(0.47)[2]], { color: red, rot: [-5, 0, 14], parent: 'body', edge: 'soft' })
      .box([0.2, 0.26, 0.006], [0.025, 0.3, g(0.3, 0.025)[2]], { color: 'white', rot: [-5, 0, 0], round: 0.6, noInk: true });
    for (const y of [0.4, 0.33, 0.24]) b.box([0.075, 0.022, 0.01], [0, y, g(y, 0.03)[2]], { color: '#1e1e1e', rot: [-5, 0, -4] });
    b.box([0.09, 0.03, 0.012], [0, 0.17, g(0.17, 0.028)[2]], { color: 'silver', rot: [-5, 0, 0] })
      .each(3, (i) => void b.cyl([0.022, 0.012, 0.022], [-0.07 - i * 0.012, 0.25 - i * 0.04, g(0.25 - i * 0.04, 0.03)[2]], { color: 'cream', rot: [85, 0, 0] }))
      .box([0.056, 0.58, 0.024], g(0.73), { color: '#e8c690', rot: [-5, 0, 0], parent: 'body' })
      .box([0.05, 0.52, 0.008], g(0.73, 0.016), { color: '#5a3a22', rot: [-5, 0, 0], parent: 'body' })
      .box([0.075, 0.17, 0.016], [0.012, 1.08, g(1.08)[2]], { color: '#e8c690', rot: [-5, 0, -6], round: 0.4, parent: 'body' })
      .each(6, (i) => void b.cyl([0.012, 0.025, 0.012], [-0.03, 1.02 + i * 0.024, g(1.02 + i * 0.024)[2]], { color: 'silver', rot: [0, 0, 90], parent: 'body' }))
      .each(6, (i) => void b.box([0.0025, 0.86, 0.003], [(i - 2.5) * 0.007, 0.6, g(0.6, 0.026)[2]], { color: '#d8d8d8', rot: [-5, 0, 0], noInk: true, round: 0 }));
    // amp
    b.box([0.42, 0.38, 0.22], [0.5, 0.19, -0.05], { color: '#1e1e1e', round: 0.12, name: 'amp' })
      .box([0.36, 0.25, 0.01], [0.5, 0.16, 0.065], { color: '#5a5550', round: 0.1, noInk: true, parent: 'amp' })
      .box([0.38, 0.06, 0.012], [0.5, 0.33, 0.065], { color: '#d9c48a', round: 0.2, parent: 'amp' })
      .each(4, (i) => void b.cyl([0.02, 0.012, 0.02], [0.36 + i * 0.05, 0.33, 0.075], { color: 'black', rot: [90, 0, 0], parent: 'amp' }))
      .ball(0.012, [0.66, 0.33, 0.075], { color: 'red', glow: true, name: 'ampLight', parent: 'amp', mover: { kind: 'light', on: false } })
      .arc([0.14, 0.05, 0.02], [0.5, 0.38, -0.05], { color: 'black', parent: 'amp' })
      .rod([0.6, 0.3, 0.07], [0.12, 0.02, 0.15], 0.01, 'black', { edge: 'soft' });
    return b
      .act({
        click: [
          [A.operate('ampLight', 'on'), A.par(A.say('Twaaang! ♪', 2), A.pose('amp', { scale: 1.06, dur: 0.15 }), A.effect('sparkle', { dur: 1.5 })), A.pose('amp', { scale: 1, dur: 0.3 })],
          [A.par(A.say('Wah-wah-WAAAH! ♪', 2), A.anim('shake', 2)), A.operate('ampLight', 'off')],
        ],
      })
      .done();
  }),
  // A stand mixer: the head tilts back on its hinge, the beater spins in the steel bowl.
  e('electric mixer', 'kitchen', 'appliances', () => {
    const red = '#c8262e';
    const b = m('electric mixer', { edge: 'soft' });
    b.box([0.22, 0.04, 0.34], [0, 0.02, 0.0], { color: red, round: 0.7 })
      .box([0.13, 0.27, 0.12], [0, 0.17, -0.11], { color: red, round: 0.6 })
      .loft([0.15, 0.135, 0.36], [0, 0.345, -0.01], [[0, 0.75, 0.8, 0], [0.15, 1, 1, 0], [0.75, 0.95, 0.92, 0], [0.95, 0.75, 0.7, -0.02], [1, 0.4, 0.4, -0.02]], { color: red, name: 'head', pivot: [0, 0.31, -0.13], mover: { kind: 'swing', axis: 'x', amount: -50 } })
      .cyl([0.05, 0.012, 0.05], [0, 0.345, 0.175], { color: 'silver', rot: [90, 0, 0], parent: 'head', edge: 'sharp' })
      .box([0.012, 0.012, 0.05], [0.075, 0.36, -0.06], { color: 'silver', parent: 'head', edge: 'sharp' })
      .cyl([0.03, 0.025, 0.03], [0, 0.27, 0.07], { color: 'silver', parent: 'head', edge: 'sharp' })
      .stick([0, 0.26, 0.07], [0, 0.17, 0.07], 0.012, 'silver', { name: 'beater', parent: 'head', mover: { kind: 'spin', axis: 'y', amount: 900 }, edge: 'sharp' })
      .ball([0.065, 0.085, 0.02], [0, 0.135, 0.07], { color: 'silver', parent: 'beater', edge: 'sharp' })
      .box([0.17, 0.015, 0.15], [0, 0.048, 0.07], { color: 'silver', edge: 'sharp', round: 0.4 })
      .cyl([0.2, 0.15, 0.2], [0, 0.13, 0.07], { color: 'metal', taper: 1.2, edge: 'sharp', name: 'bowl' })
      .cyl([0.21, 0.006, 0.21], [0, 0.206, 0.07], { color: 'silver', taper: 1.2, edge: 'sharp', noInk: true })
      .arc([0.06, 0.06, 0.012], [0.135, 0.15, 0.07], { color: 'metal', rot: [0, 90, -90], edge: 'sharp' })
      .socket('bowl', [0, 0.1, 0.07], 'inside', { size: 0.14 });
    return b
      .act({
        click: [
          [A.operate('beater', 'on'), A.par(A.say('Whirrrrr!', 2), A.effect('dust', { dur: 1.5 })), A.wait(1.5), A.operate('beater', 'off')],
          [A.operate('head', 'open'), A.wait(2), A.operate('head', 'close'), A.say('Clunk.', 1)],
        ],
      })
      .done();
  }),
  // A rotary shaver: three round heads on a hinged head that flips open for cleaning, a power button and an LED.
  e('electric razor', 'home', 'bathroom', () => {
    const b = m('electric razor', { edge: 'soft' });
    b.box([0.055, 0.12, 0.036], [0, 0.06, 0], { color: '#1e1e22', round: 0.8, name: 'body' })
      .box([0.012, 0.09, 0.03], [0.029, 0.06, 0], { color: '#3a3a40', round: 0.6 })
      .box([0.012, 0.09, 0.03], [-0.029, 0.06, 0], { color: '#3a3a40', round: 0.6 })
      .cyl([0.02, 0.006, 0.02], [0, 0.085, 0.019], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.008, 0.02, 0.004], [0, 0.055, 0.019], { color: '#4ab0ff', glow: true, name: 'led', mover: { kind: 'light', on: false } })
      .box([0.07, 0.03, 0.044], [0, 0.133, 0], { color: 'silver', round: 0.6, edge: 'sharp', name: 'head', pivot: [0, 0.12, 0.022], mover: { kind: 'swing', axis: 'x', amount: 70 } });
    for (const [hx, hz] of around(3, 0.016, Math.PI / 2)) {
      b.cyl([0.026, 0.01, 0.026], [hx, 0.152, hz * 0.8], { color: 'metal', parent: 'head', edge: 'sharp' });
      b.torus([0.018, 0.018, 0.004], [hx, 0.158, hz * 0.8], { color: '#9aa0a8', rot: [90, 0, 0], parent: 'head', noInk: true });
    }
    return b
      .act({
        click: [
          [A.operate('led', 'on'), A.par(A.anim('shake', 3), A.say('Bzzzzzzz', 2)), A.operate('led', 'off')],
          [A.operate('head', 'open'), A.effect('dust', { dur: 1 }), A.wait(1.5), A.operate('head', 'close'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A duplex wall outlet with a plug in its top socket: the plug pulls out (with a spark) and goes back in.
  e('electrical outlet', 'home', 'electrical', () => {
    const b = m('electrical outlet', { edge: 'sharp' }).box([0.075, 0.12, 0.012], [0, 0.06, 0], { color: 'white', round: 0.2, name: 'plate' });
    for (const y of [0.088, 0.032]) {
      b.box([0.042, 0.038, 0.008], [0, y, 0.008], { color: '#f2eee4', round: 0.5, parent: 'plate' });
      b.pair((s) => void b.box([0.003, 0.011, 0.004], [s * 0.008, y + 0.004, 0.012], { color: 'black', noInk: true, parent: 'plate' }));
      b.ball(0.006, [0, y - 0.01, 0.012], { color: 'black', noInk: true, parent: 'plate' });
    }
    b.cyl([0.008, 0.003, 0.008], [0, 0.06, 0.008], { color: 'silver', rot: [90, 0, 0], parent: 'plate' })
      .box([0.032, 0.03, 0.026], [0, 0.088, 0.026], { color: '#2a2a2a', round: 0.4, name: 'plug', parent: 'plate', piece: true })
      .rod([0, 0.08, 0.04], [0, 0.03, 0.05], 0.009, '#2a2a2a', { parent: 'plug' });
    return b.act({ click: [[A.detach('plug', 'plug'), A.par(A.effect('sparkle', { dur: 0.8 }), A.say('Zap!', 1))], [A.reattach('plug'), A.say('Click.', 1)]] }).done();
  }),
  // A steel lattice transmission tower (25 m): four tapering legs braced in X panels, three crossarms with strings
  // of insulators, an earth-wire peak and a red warning beacon on top.
  e('electricity pylon', 'tech', 'power', () => {
    const b = m('electricity pylon', { edge: 'sharp' });
    const H = 25, waist = 17;
    const half = (y: number) => (y <= waist ? 3.0 - (2.1 * y) / waist : 0.9 - (0.55 * (y - waist)) / (H - waist));
    const lv = [0, 3.4, 6.8, 10.2, 13.6, waist, 20, 22.5, H];
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      for (let i = 0; i < lv.length - 1; i++) b.rod([sx * half(lv[i]), lv[i], sz * half(lv[i])], [sx * half(lv[i + 1]), lv[i + 1], sz * half(lv[i + 1])], 0.22, '#9aa3ab');
      b.box([0.7, 0.5, 0.7], [sx * 3.0, 0.25, sz * 3.0], { color: 'stone', round: 0.15 });
    }
    // X bracing on every face
    for (let i = 0; i < lv.length - 1; i++) {
      const a = lv[i], c = lv[i + 1], ha = half(a), hc = half(c);
      for (const s of [1, -1]) {
        b.rod([-ha, a, s * ha], [hc, c, s * hc], 0.09, '#9aa3ab').rod([ha, a, s * ha], [-hc, c, s * hc], 0.09, '#9aa3ab');
        b.rod([s * ha, a, -ha], [s * hc, c, hc], 0.09, '#9aa3ab').rod([s * ha, a, ha], [s * hc, c, -hc], 0.09, '#9aa3ab');
      }
    }
    // crossarms (tapering trusses) with hanging insulator strings
    for (const [y, span] of [[waist, 6.2], [20, 5.0], [22.5, 3.8]] as const) {
      b.pair((s) => {
        const hy = half(y);
        b.rod([s * hy, y, 0.5], [s * span, y, 0.05], 0.12, '#9aa3ab').rod([s * hy, y, -0.5], [s * span, y, -0.05], 0.12, '#9aa3ab');
        b.rod([s * hy, y + 1.1, 0], [s * span, y, 0], 0.1, '#9aa3ab');
        b.stick([s * (span - 0.15), y, 0], [s * (span - 0.15), y - 1.6, 0], 0.07, '#5a6068');
        for (let k = 0; k < 6; k++) b.cyl([0.32, 0.08, 0.32], [s * (span - 0.15), y - 0.25 - k * 0.22, 0], { color: '#8fb4c8', edge: 'soft' });
        b.box([0.4, 0.12, 0.2], [s * (span - 0.15), y - 1.68, 0], { color: '#5a6068' });
      });
    }
    b.cone([0.7, 2.2, 0.7], [0, H + 1.1, 0], { color: '#9aa3ab', segs: 4 })
      .ball(0.4, [0, H + 2.3, 0], { color: '#ff3b2e', glow: true, name: 'beacon', mover: { kind: 'light', on: false } })
      .label('DANGER', [0.9, 0.5], [0, 2.6, half(2.6) + 0.05], { color: 'yellow' });
    return b
      .act({
        click: [
          [A.operate('beacon', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Hummmmm...', 2.5))],
          [A.operate('beacon', 'off'), A.say('Bzzt.', 1)],
        ],
      })
      .done();
  }),
  // Three snap electrodes on sticky pads, their coloured leads running to a little ECG monitor.
  e('electrodes', 'clinic', 'medical devices', () => {
    const b = m('electrodes', { edge: 'sharp' });
    b.box([0.14, 0.09, 0.05], [0.0, 0.045, -0.06], { color: '#e8ecef', round: 0.2 })
      .box([0.11, 0.06, 0.006], [0.0, 0.05, -0.034], { color: '#14261c', round: 0.1 })
      .box([0.1, 0.05, 0.002], [0.0, 0.05, -0.0305], { color: '#1e5a30', glow: true, noInk: true, name: 'screen', mover: { kind: 'light', on: false } });
    const ecg: V[] = [[-0.045, 0.048], [-0.015, 0.048], [-0.008, 0.07], [-0.001, 0.034], [0.006, 0.048], [0.045, 0.048]].map(([px, py]) => [px, py, -0.028] as V);
    for (let i = 0; i < ecg.length - 1; i++) b.rod(ecg[i], ecg[i + 1], 0.003, '#7dff9a', { glow: true, noInk: true });
    ['red', 'green', 'yellow'].forEach((c, i) => {
      const xx = (i - 1) * 0.055;
      b.cyl([0.045, 0.004, 0.045], [xx, 0.002, 0.06], { color: 'white' })
        .cyl([0.022, 0.006, 0.022], [xx, 0.006, 0.06], { color: '#cfd5da' })
        .ball(0.01, [xx, 0.012, 0.06], { color: 'silver' })
        .rod([xx, 0.012, 0.06], [xx * 0.3, 0.02, -0.03], 0.005, c, { edge: 'soft' });
    });
    return b.act({ click: [[A.operate('screen', 'on'), A.say('Beep... beep... beep', 2.5)], [A.operate('screen', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A two-storey electronics shop: TVs glow in the display windows, a satellite dish on the roof.
  e('electronics store', 'places', 'shops', () => {
    const b = shop('electronics store', { w: 8, d: 6, h: 7, wall: '#d8dde6', trim: '#4a5a70', sign: 'ELECTRONICS', signC: '#4ab0ff', signBg: '#1e2430', frame: '#2a3040', glass: '#5a7086', upper: 3 });
    b.pair((s) => {
      for (const [k, y] of [[0, 1.9], [1, 1.1]] as const) {
        b.box([1.1, 0.68, 0.12], [s * (k ? 2.0 : 2.6), y, 2.9], { color: '#1e1e1e', round: 0.1 });
        b.box([1.0, 0.58, 0.02], [s * (k ? 2.0 : 2.6), y, 2.97], { color: '#4ab0ff', glow: true, name: `screen${s > 0 ? k : k + 2}`, mover: { kind: 'light', on: false } });
      }
    });
    b.stick([2.5, 7.3, -1], [2.5, 8.1, -1], 0.06, 'silver')
      .dome([1.1, 0.35, 1.1], [2.5, 8.3, -0.9], { color: '#e8ecef', rot: [-60, 0, 0] })
      .rod([2.5, 8.35, -0.6], [2.5, 8.6, -0.25], 0.03, 'silver');
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.operate('screen', 'on'), A.say('Ding-dong!', 1.5)), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('screen', 'off'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // An elephant's head at real size with its trunk: the trunk is a chain of joints that curls up to trumpet and
  // swings back down to spray.
  e('elephant trunk', 'wild', 'animal parts', () => {
    const g = '#9a9aa2';
    const b = m('elephant trunk');
    b.ball([1.15, 1.05, 1.0], [0, 2.55, -0.3], { color: g, name: 'head' })
      .ball([0.9, 0.55, 0.7], [0, 3.0, -0.2], { color: g, parent: 'head' })
      .ball([0.95, 1.1, 1.2], [0, 2.4, -1.0], { color: g, parent: 'head' })
      .pair((s) => {
        b.ball([0.12, 1.25, 0.95], [s * 0.72, 2.45, -0.6], { color: '#8a8a92', rot: [0, s * 30, s * 8], name: s > 0 ? 'earL' : 'earR', parent: 'head', pivot: [s * 0.5, 2.5, -0.5] });
        b.ball([0.09, 0.07, 0.06], [s * 0.32, 2.6, 0.12], { color: '#2a2726', eye: true, parent: 'head' });
        b.cone([0.12, 0.75, 0.12], [s * 0.24, 1.75, 0.45], { color: 'cream', rot: [150, 0, -s * 6], parent: 'head' });
      });
    const pts: V[] = [[0, 2.15, 0.12], [0, 1.75, 0.3], [0, 1.35, 0.38], [0, 0.98, 0.4], [0, 0.62, 0.38], [0, 0.3, 0.42], [0, 0.12, 0.58]];
    const th = [0.38, 0.32, 0.27, 0.22, 0.18, 0.14];
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], th[i], g, { name: `trunk${i}`, parent: i ? `trunk${i - 1}` : 'head', pivot: pts[i] });
    b.ball([0.15, 0.1, 0.15], [0, 0.11, 0.66], { color: '#7a7a82', parent: 'trunk5' });
    for (let i = 0; i < 5; i++) b.torus([th[i] * 1.02, th[i] * 0.3, 0.03], [0, pts[i][1] - 0.2, pts[i][2] + 0.09], { color: '#85858d', rot: [80, 0, 0], parent: `trunk${i}`, noInk: true });
    const curl = (r: number, d: number) => A.par(...[0, 1, 2, 3, 4, 5].map((i) => A.pose(`trunk${i}`, { rot: [r * (i < 2 ? 0.6 : 1), 0, 0], dur: d })));
    return b
      .act({
        click: [
          [curl(-34, 1.0), A.par(A.pose('earL', { rot: [0, 25, 0], dur: 0.4 }), A.pose('earR', { rot: [0, -25, 0], dur: 0.4 }), A.say('PAWOOOOO!', 2)), A.wait(1.2), A.par(A.pose('earL', { rot: [0, 0, 0] }), A.pose('earR', { rot: [0, 0, 0] })), curl(0, 1.0)],
          [curl(-18, 0.6), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Pffffsssh!', 1.5)), A.wait(1), curl(0, 0.8)],
        ],
      })
      .done();
  }),
  // Lift doors in a wall: brushed steel doors slide apart into the wall to show the lit car, the call button
  // lights, the arrow over the door turns to show which way it goes.
  e('elevator', 'places', 'building parts', () => {
    const b = m('elevator', { edge: 'sharp' });
    const wall = '#e6dfd2';
    b.pair((s) => void b.box([0.75, 2.9, 0.25], [s * 0.925, 1.45, -0.125], { color: wall, round: 0.02 }))
      .box([1.1, 0.75, 0.25], [0, 2.525, -0.125], { color: wall, round: 0.02 })
      .pair((s) => void b.box([0.12, 2.2, 0.1], [s * 0.61, 1.1, 0.02], { color: 'steel', round: 0.1 }))
      .box([1.34, 0.12, 0.1], [0, 2.21, 0.02], { color: 'steel', round: 0.1 })
      .box([1.2, 0.06, 0.3], [0, 0.03, 0.08], { color: '#9aa0a8' })
      // the car: back and side walls, floor, ceiling light, handrail
      .box([1.2, 2.2, 0.06], [0, 1.1, -1.6], { color: '#c9b48a' })
      .pair((s) => void b.box([0.06, 2.2, 1.4], [s * 0.58, 1.1, -0.9], { color: '#bfa97e' }))
      .box([1.2, 0.04, 1.4], [0, 0.02, -0.9], { color: '#5a5550' })
      .box([1.2, 0.04, 1.4], [0, 2.2, -0.9], { color: '#e8e2d6' })
      .box([0.6, 0.03, 0.6], [0, 2.17, -0.9], { color: '#fff6c8', glow: true })
      .box([1.0, 0.04, 0.04], [0, 0.95, -1.54], { color: 'silver', round: 0.5 })
      .box([0.53, 2.1, 0.05], [-0.27, 1.06, 0.06], { color: '#c5cbd2', round: 0.05, name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -0.52 } })
      .box([0.53, 2.1, 0.05], [0.27, 1.06, 0.06], { color: '#b8bec6', round: 0.05, name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 0.52 } })
      .box([0.5, 0.22, 0.05], [0, 2.5, 0.03], { color: '#1e1e1e', round: 0.2 })
      .label('3', [0.1, 0.14], [0.12, 2.5, 0.06], { color: '#ffb347', depth: 0.004 })
      .cone([0.1, 0.1, 0.012], [-0.1, 2.5, 0.06], { color: '#ffb347', glow: true, segs: 3, name: 'arrow' })
      .box([0.13, 0.3, 0.03], [0.95, 1.15, 0.015], { color: 'silver', round: 0.3 })
      .cyl([0.06, 0.02, 0.06], [0.95, 1.22, 0.035], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.06, 0.02, 0.06], [0.95, 1.08, 0.035], { color: '#ffd23a', rot: [90, 0, 0], glow: true, name: 'button', mover: { kind: 'light', on: false } })
      .socket('car', [0, 0.05, -0.9], 'inside', { size: 1.8 });
    return b
      .act({
        click: [
          [A.operate('button', 'on'), A.wait(0.8), A.say('Ding!', 1.5), A.operate('door', 'open'), A.wait(3), A.operate('door', 'close'), A.operate('button', 'off')],
          [A.pose('arrow', { rot: [0, 0, 180], dur: 0.3 }), A.say('Ding!', 1.5), A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close'), A.pose('arrow', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A cross trainer: rear flywheel under a shroud, two pedal arms with foot plates, two tall handles that swing
  // (one forward as the other goes back) and a console that lights up.
  e('elliptical machine', 'sports', 'gym', () => {
    const b = m('elliptical machine', { view: 'side', edge: 'sharp' });
    b.box([0.12, 0.08, 1.75], [0, 0.06, -0.05], { color: '#3a3d42', round: 0.3 })
      .box([0.7, 0.07, 0.1], [0, 0.04, 0.78], { color: '#3a3d42', round: 0.4 })
      .box([0.62, 0.07, 0.1], [0, 0.04, -0.85], { color: '#3a3d42', round: 0.4 })
      .loft([0.3, 0.55, 0.62], [0, 0.38, -0.62], [[0, 0.7, 0.6, -0.1], [0.4, 1, 1, 0], [1, 0.85, 0.7, -0.1]], { color: '#2a2c30', boxy: 0.6, edge: 'soft' })
      .cyl([0.5, 0.06, 0.5], [0.16, 0.38, -0.62], { color: '#c8ccd2', rot: [0, 0, 90], name: 'flywheel', mover: { kind: 'spin', axis: 'x', amount: 400 } })
      .rod([0, 0.08, 0.62], [0, 1.25, 0.5], 0.09, '#c8ccd2')
      .box([0.36, 0.22, 0.08], [0, 1.32, 0.48], { color: '#2a2c30', rot: [-35, 0, 0], round: 0.3 })
      .box([0.28, 0.14, 0.02], [0, 1.33, 0.515], { color: '#4ad0ff', rot: [-35, 0, 0], glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .stick([-0.25, 1.15, 0.5], [0.25, 1.15, 0.5], 0.04, '#c8ccd2');
    b.pair((s) => {
      const n = s > 0 ? 'L' : 'R';
      b.rod([s * 0.11, 0.38, -0.6], [s * 0.13, 0.32, 0.35], 0.05, '#c8ccd2', { name: `pedal${n}`, pivot: [s * 0.11, 0.38, -0.6] });
      b.box([0.14, 0.04, 0.36], [s * 0.13, 0.36, -0.05], { color: '#1e1e1e', round: 0.3, parent: `pedal${n}` });
      b.rod([s * 0.13, 0.33, 0.35], [s * 0.26, 1.7, 0.36], 0.045, '#c8ccd2', { name: `handle${n}`, pivot: [s * 0.2, 1.15, 0.45] });
      b.capsule([0.06, 0.4, 0.06], [s * 0.26, 1.55, 0.36], { color: '#1e1e1e', parent: `handle${n}` });
    });
    const stroke = (k: number) => A.par(A.pose('handleL', { rot: [18 * k, 0, 0], dur: 0.6 }), A.pose('handleR', { rot: [-18 * k, 0, 0], dur: 0.6 }), A.pose('pedalL', { rot: [-6 * k, 0, 0], dur: 0.6 }), A.pose('pedalR', { rot: [6 * k, 0, 0], dur: 0.6 }));
    return b
      .act({
        click: [
          [A.par(A.operate('screen', 'on'), A.operate('flywheel', 'on'), A.say('Whirr, whirr', 2)), stroke(1), stroke(-1), stroke(1), stroke(-1), stroke(0), A.par(A.operate('flywheel', 'off'), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A two-storey neoclassical embassy: a portico of four columns under a pediment, broad steps, rows of tall
  // windows, double doors that open, a brass plaque and a flag on a pole that waves.
  e('embassy', 'places', 'government', () => {
    const b = m('embassy', { edge: 'sharp' });
    const W = 14, D = 9, H = 8, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: '#efe6d2', round: 0.02 })
      .box([W + 0.2, 0.6, D + 0.2], [0, 0.3, 0], { color: '#bdb5a5', round: 0.05 })
      .box([W + 0.2, 0.15, D + 0.2], [0, 3.9, 0], { color: 'white', round: 0.2 })
      .box([W + 0.5, 0.45, D + 0.5], [0, H - 0.1, 0], { color: 'white', round: 0.1 })
      .box([W + 0.1, 0.7, D + 0.1], [0, H + 0.35, 0], { color: '#efe6d2', round: 0.05 })
      .box([W - 1, 0.4, D - 1], [0, H + 0.6, 0], { color: '#8a96a4', round: 0.05 });
    for (let i = 0; i < 4; i++) {
      b.box([6.4 + i * 0.6, 0.18, 2.4 - i * 0.5], [0, 0.09 + i * 0.18, fz + 2.4 - i * 0.25], { color: '#d8d0c0', round: 0.05 });
    }
    b.box([6.2, 0.2, 2.6], [0, 0.7, fz + 1.4], { color: '#d8d0c0', round: 0.05 });
    for (let i = 0; i < 4; i++) {
      const cx = -2.4 + i * 1.6;
      b.cyl([0.62, 0.25, 0.62], [cx, 0.92, fz + 2.3], { color: 'white', segs: 4 })
        .cyl([0.5, 5.6, 0.5], [cx, 3.85, fz + 2.3], { color: 'white', taper: 0.88, segs: 16 })
        .box([0.66, 0.25, 0.66], [cx, 6.75, fz + 2.3], { color: 'white', round: 0.2 });
    }
    b.box([6.4, 0.6, 2.8], [0, 7.15, fz + 1.4], { color: 'white', round: 0.05 })
      .wedge([6.8, 1.6, 3.0], [0, 8.25, fz + 1.4], { color: '#efe6d2', rot: [0, 0, 0] })
      .label('EMBASSY', [3.6, 0.4], [0, 7.15, fz + 2.82], { color: '#2a3a5a', depth: 0.02 });
    door(b, 'doorL', [-0.7, 0.8, fz], 1.4, 3.0, { color: '#4a2f1c', frame: 'white', hinge: -1 });
    door(b, 'doorR', [0.7, 0.8, fz], 1.4, 3.0, { color: '#4a2f1c', frame: 'white', hinge: 1 });
    for (const y of [2.4, 6.0]) for (const xx of [-5.6, -4.0, 4.0, 5.6]) win(b, [xx, y, fz + 0.01], 1.0, 2.0, { frame: 'white', glass: '#7a98b0', bars: true });
    for (const xx of [-1.6, 1.6]) win(b, [xx, 6.0, fz + 0.01], 0.9, 1.6, { frame: 'white', glass: '#7a98b0', bars: true });
    b.box([0.7, 0.45, 0.04], [2.0, 1.9, fz + 0.03], { color: 'brass', round: 0.2 })
      .stick([0, H + 0.9, -2.0], [0, H + 6.5, -2.0], 0.12, 'silver')
      .ball(0.22, [0, H + 6.55, -2.0], { color: 'gold' })
      .box([2.4, 1.5, 0.04], [1.25, H + 5.6, -2.0], { color: '#2a5aa8', name: 'flag', pivot: [0.05, H + 5.6, -2.0], round: 0.1 })
      .box([2.4, 0.5, 0.05], [1.25, H + 5.6, -2.0], { color: 'white', parent: 'flag', round: 0.1 })
      .star(0.35, [1.25, H + 5.6, -1.97], { color: 'gold', parent: 'flag' });
    const wave = (k: number) => A.pose('flag', { rot: [0, 25 * k, 0], dur: 0.5 });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), wave(1)), wave(-1), wave(1), A.par(wave(0), A.operate('door', 'close'))],
        ],
      })
      .done();
  }),
  // An emerald-cut stone (a stepped octagon with a flat table) standing up in the slot of a velvet ring box.
  e('emerald', 'nature', 'gems', () =>
    m('emerald', { edge: 'sharp' })
      .box([0.07, 0.03, 0.06], [0, 0.015, 0], { color: '#1e2a22', round: 0.4, edge: 'soft' })
      .box([0.05, 0.004, 0.012], [0, 0.031, 0], { color: '#0e140f', round: 0 })
      .prism([0.05, 0.016, 0.042], [0, 0.052, 0], 8, { color: '#0f7a42', rot: [90, 0, 22.5], name: 'gem' })
      .prism([0.04, 0.008, 0.032], [0, 0.052, 0.011], 8, { color: '#2fb26a', rot: [90, 0, 22.5], parent: 'gem' })
      .prism([0.026, 0.004, 0.02], [0, 0.052, 0.016], 8, { color: '#7fe8b0', rot: [90, 0, 22.5], parent: 'gem', noInk: true })
      .ball(0.005, [0.008, 0.062, 0.019], { color: 'white', glow: true, parent: 'gem' })
      .act({ click: [A.par(A.pose('gem', { rot: [0, 360, 0], dur: 1.5 }), A.effect('sparkle', { dur: 1.5 })), A.pose('gem', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A fire exit in a wall: a green steel door with a push bar that swings out, a lit EXIT sign over it.
  e('emergency exit', 'places', 'building parts', () => {
    const b = m('emergency exit', { edge: 'sharp' });
    b.box([2.2, 2.9, 0.25], [0, 1.45, -0.125], { color: '#d5d2cc', round: 0.02 });
    door(b, 'door', [0, 0, 0.0], 1.0, 2.1, { color: '#2e8b57', frame: '#5a5f66', hinge: -1 });
    b.box([0.8, 0.07, 0.07], [0, 1.0, 0.12], { color: 'silver', round: 0.4, parent: 'door', name: 'bar' })
      .box([0.6, 0.04, 0.02], [0, 1.6, 0.095], { color: 'white', parent: 'door' })
      .label('PUSH', [0.28, 0.07], [0, 1.0, 0.16], { color: 'red', parent: 'door', depth: 0.004 })
      .box([0.72, 0.28, 0.09], [0, 2.45, 0.05], { color: 'white', round: 0.2 })
      .box([0.64, 0.2, 0.02], [0, 2.45, 0.1], { color: '#22c25a', glow: true, name: 'sign', mover: { kind: 'light', on: true } })
      .label('EXIT', [0.4, 0.14], [0.08, 2.45, 0.115], { color: '#22c25a', depth: 0.004 })
      .ball([0.05, 0.06, 0.01], [-0.21, 2.5, 0.115], { color: 'white' })
      .rod([-0.21, 2.47, 0.115], [-0.18, 2.4, 0.115], 0.03, 'white');
    return b
      .act({ click: [[A.pose('bar', { move: [0, 0, -0.03], dur: 0.15 }), A.operate('door', 'open'), A.say('Clunk!', 1.5), A.wait(2.5), A.operate('door', 'close'), A.pose('bar', { move: [0, 0, 0], dur: 0.15 })]] })
      .done();
  }),
  // A hospital's emergency entrance: a canopy over the ambulance bay on steel posts, sliding glass doors, a big
  // red EMERGENCY sign that lights up, a red cross on the roof.
  e('emergency room', 'places', 'hospital', () => {
    const b = m('emergency room', { edge: 'sharp' });
    const W = 14, D = 9, H = 7.5, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: '#f2f2ee', round: 0.02 })
      .box([W + 0.12, 0.4, D + 0.12], [0, 0.2, 0], { color: '#9a9590' })
      .box([W + 0.3, 0.3, D + 0.3], [0, H, 0], { color: '#c8ccd2', round: 0.1 })
      .box([W - 0.4, 0.06, 0.08], [0, 3.6, fz + 0.03], { color: '#d6453a' });
    for (let i = 0; i < 6; i++) win(b, [-5.5 + i * 2.2, 5.4, fz + 0.01], 1.4, 1.4, { frame: '#c8ccd2', glass: '#7fa6bf' });
    b.pair((s) => void win(b, [s * 4.9, 1.9, fz + 0.01], 2.2, 1.6, { frame: '#c8ccd2', glass: '#7fa6bf' }));
    // sliding doors in a glass screen
    b.box([3.6, 2.8, 0.08], [0, 1.4, fz + 0.02], { color: '#5a6068', round: 0.05 })
      .box([3.4, 2.6, 0.04], [0, 1.4, fz + 0.05], { color: '#24282c', noInk: true })
      .box([0.9, 2.4, 0.04], [-0.46, 1.3, fz + 0.09], { color: '#9cc3d6', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -0.9 } })
      .box([0.9, 2.4, 0.04], [0.46, 1.3, fz + 0.09], { color: '#9cc3d6', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 0.9 } })
      // canopy on four posts
      .box([8, 0.35, 5], [0, 4.2, fz + 2.5], { color: 'white', round: 0.1 })
      .box([8.1, 0.12, 5.1], [0, 4.0, fz + 2.5], { color: '#d6453a', round: 0.3 })
      .box([5.6, 0.8, 0.14], [0, 4.85, fz + 4.95], { color: 'white', round: 0.1 })
      .label('EMERGENCY', [5.2, 0.6], [0, 4.85, fz + 5.04], { color: '#d6453a', name: 'sign', glow: true, mover: { kind: 'light', on: false }, depth: 0.04 });
    for (const [px, pz] of [[-3.7, fz + 4.7], [3.7, fz + 4.7]] as const) b.stick([px, 0, pz], [px, 4.0, pz], 0.3, 'silver');
    b.box([3.0, 0.02, 4.4], [0, 0.01, fz + 2.6], { color: '#e8d24a', round: 0 })
      .box([2.8, 0.03, 4.2], [0, 0.015, fz + 2.6], { color: '#6a6a6a', round: 0 })
      .box([1.6, 1.6, 0.3], [0, H + 1.0, 0], { color: 'white', round: 0.1 })
      .box([1.2, 0.36, 0.06], [0, H + 1.0, 0.17], { color: '#d6453a' })
      .box([0.36, 1.2, 0.06], [0, H + 1.0, 0.17], { color: '#d6453a' });
    return b
      .act({
        click: [
          [A.par(A.operate('sign', 'on'), A.say('Wee-ooo wee-ooo!', 2.5)), A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('sign', 'off'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // A job centre shopfront with a NOW HIRING sign hanging from a bracket that swings when the door opens.
  e('employment office', 'places', 'offices', () => {
    const b = shop('employment office', { w: 7, d: 6, h: 4.4, wall: '#d9c9a8', trim: '#4a6a4a', sign: 'JOB CENTER', signC: 'white', signBg: '#2e7d4f', awning: ['#2e7d4f', '#f2efe6'] });
    b.stick([3.55, 3.0, 3.0], [3.55, 3.0, 4.1], 0.05, 'black')
      .label('NOW HIRING', [1.0, 0.45], [3.55, 2.62, 3.75], { color: '#f2c14e', rot: [0, 90, 0], name: 'hiring', pivot: [3.55, 2.98, 3.75], depth: 0.04 });
    b.pair((s) => void b.box([0.6, 0.8, 0.03], [s * 2.2, 1.9, 3.08], { color: 'white' }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.say('Ding-dong!', 1.5), A.pose('hiring', { rot: [0, 0, 25], dur: 0.4 })), A.pose('hiring', { rot: [0, 0, -20], dur: 0.5 }), A.pose('hiring', { rot: [0, 0, 0], dur: 0.5 }), A.wait(1), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A cereal bar half out of its wrapper: one bite comes off, and a fresh bar is there next time.
  e('energy bar', 'food', 'snacks', () =>
    m('energy bar')
      .box([0.042, 0.09, 0.016], [0, 0.045, 0], { color: '#e8762a', round: 0.3, name: 'wrapper', edge: 'sharp' })
      .box([0.046, 0.012, 0.012], [0, 0.004, 0], { color: '#e8762a', round: 0.1, edge: 'sharp' })
      .box([0.038, 0.04, 0.014], [0, 0.11, 0], { color: '#7a4a2a', round: 0.3, name: 'bar' })
      .box([0.038, 0.03, 0.014], [0, 0.145, 0], { color: '#7a4a2a', round: 0.4, name: 'tip', parent: 'bar' })
      .ball(0.008, [-0.01, 0.12, 0.007], { color: 'tan', noInk: true, parent: 'bar' })
      .ball(0.008, [0.01, 0.1, 0.007], { color: 'cream', noInk: true, parent: 'bar' })
      .ball(0.007, [0.006, 0.15, 0.007], { color: '#c99a5a', noInk: true, parent: 'tip' })
      .label('ENERGY', [0.036, 0.016], [0, 0.05, 0.009], { color: '#1e1e1e', depth: 0.003 })
      .box([0.02, 0.014, 0.003], [0, 0.03, 0.009], { color: '#f2c14e', noInk: true })
      .act({ click: [[A.par(A.pose('tip', { scale: 0, dur: 0.2 }), A.say('Crunch!', 1.2))], [A.pose('tip', { scale: 1, dur: 0.3 }), A.effect('sparkle', { dur: 0.8 })]] })
      .done(),
  ),
  // A tall black can with a lightning bolt: the ring pull opens with a hiss.
  e('energy drink', 'food', 'drinks', () =>
    m('energy drink', { edge: 'sharp' })
      .cyl([0.058, 0.155, 0.058], [0, 0.08, 0], { color: '#1a1a1a', segs: 24 })
      .cyl([0.052, 0.008, 0.052], [0, 0.004, 0], { color: 'silver', taper: 1.1 })
      .cyl([0.058, 0.01, 0.058], [0, 0.162, 0], { color: 'silver', taper: 0.85 })
      .cyl([0.046, 0.003, 0.046], [0, 0.168, 0], { color: '#c8ccd2' })
      .box([0.012, 0.002, 0.022], [0, 0.171, 0.006], { color: 'silver', round: 0.5, name: 'tab', pivot: [0, 0.171, -0.004], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .rod([0.012, 0.13, 0.03], [-0.008, 0.085, 0.03], 0.01, '#7dff3a', { noInk: true })
      .rod([-0.008, 0.085, 0.03], [0.008, 0.085, 0.03], 0.01, '#7dff3a', { noInk: true })
      .rod([0.008, 0.085, 0.03], [-0.012, 0.035, 0.03], 0.01, '#7dff3a', { noInk: true })
      .act({ click: [[A.operate('tab', 'open'), A.par(A.say('Pssssht!', 1.5), A.effect('sparkle', { dur: 1 }))], [A.par(A.anim('shake', 2), A.say('Glug glug!', 1.5)), A.operate('tab', 'close')]] })
      .done(),
  ),
  // A split, toasted English muffin: the top half lifts to show the butter melting in its nooks.
  e('english muffin', 'food', 'bread', () => {
    const b = m('english muffin');
    plate(b, 0.2);
    b.cyl([0.095, 0.022, 0.095], [0, 0.023, 0], { color: '#d9a860', name: 'bottom' })
      .cyl([0.088, 0.004, 0.088], [0, 0.035, 0], { color: '#f0d9a0', noInk: true, parent: 'bottom' })
      .box([0.03, 0.008, 0.03], [0.01, 0.04, 0.005], { color: '#ffe680', round: 0.5, parent: 'bottom' })
      .cyl([0.095, 0.022, 0.095], [0.0, 0.052, 0.0], { color: '#d9a860', name: 'top', piece: true, parent: 'bottom' })
      .cyl([0.092, 0.006, 0.092], [0.0, 0.064, 0.0], { color: '#f2ead6', parent: 'top', noInk: true });
    for (const [px, pz] of around(5, 0.025, 0.3)) b.ball(0.006, [px, 0.068, pz], { color: '#e8dcc0', parent: 'top', noInk: true });
    return b
      .act({ click: [[A.pose('top', { move: [0.06, 0.03, 0], rot: [0, 0, -30], dur: 0.5 }), A.effect('steam', { dur: 1.5 }), A.wait(1.5), A.pose('top', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A media wall unit: two glass-fronted towers, a bridge shelf, a low cabinet with doors, a TV that switches on
  // and a games console under it.
  e('entertainment center', 'home', 'furniture', () => {
    const b = m('entertainment center', { edge: 'sharp' });
    const wd = '#5a3a22';
    b.box([1.5, 0.5, 0.45], [0, 0.27, 0], { color: wd, round: 0.05 })
      .box([1.5, 0.04, 0.47], [0, 0.03, 0], { color: '#3a2618' })
      .box([2.6, 0.1, 0.42], [0, 1.95, -0.02], { color: wd, round: 0.1 })
      .box([1.3, 0.02, 0.4], [0, 0.505, 0], { color: '#3a2618' })
      .pair((s) => {
        b.box([0.54, 2.0, 0.45], [s * 1.03, 1.0, 0], { color: wd, round: 0.04 });
        b.box([0.44, 1.5, 0.02], [s * 1.03, 1.15, 0.226], { color: '#9cc3d6', round: 0.05 });
        for (const y of [0.65, 1.15, 1.6]) b.box([0.44, 0.02, 0.4], [s * 1.03, y, 0.0], { color: '#3a2618' });
        b.box([0.7, 0.36, 0.03], [s * 0.36, 0.27, 0.235], { color: '#6a4a30', round: 0.1, name: s > 0 ? 'cabL' : 'cabR', pivot: [s * 0.71, 0.27, 0.235], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
        b.box([0.04, 0.12, 0.03], [s * 0.06, 0.27, 0.26], { color: 'brass', parent: s > 0 ? 'cabL' : 'cabR' });
        b.box([0.22, 0.3, 0.2], [s * 1.03, 0.8, 0.05], { color: '#1e1e1e', round: 0.1 });
        b.cyl([0.14, 0.02, 0.14], [s * 1.03, 0.84, 0.15], { color: '#3a3a3a', rot: [90, 0, 0] });
      })
      .box([0.5, 0.06, 0.25], [0, 0.56, 0.0], { color: '#1e1e1e', round: 0.2 })
      .box([0.3, 0.05, 0.2], [0, 0.54, 0.1], { color: 'white', round: 0.3 })
      .box([0.08, 0.1, 0.05], [0, 0.58, -0.05], { color: '#1e1e1e' })
      .box([1.24, 0.72, 0.05], [0, 1.0, -0.05], { color: '#1e1e1e', round: 0.1 })
      .box([1.18, 0.66, 0.01], [0, 1.0, -0.02], { color: '#3a6ab0', glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .socket('shelf', [0, 0.53, 0.1], 'top', { size: 0.4 });
    return b
      .act({
        click: [
          [A.operate('screen', 'on'), A.say('♪ Ta-da-da-daaa ♪', 2)],
          [A.operate('cab', 'open'), A.wait(1.5), A.par(A.operate('cab', 'close'), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A sealed letter: the flap swings open and the letter slides up out of it.
  e('envelope', 'study', 'mail', () =>
    m('envelope', { edge: 'sharp' })
      .box([0.22, 0.11, 0.006], [0, 0.055, 0], { color: '#f6f1e4', round: 0.1, name: 'body' })
      .box([0.2, 0.1, 0.002], [0, 0.06, -0.001], { color: 'white', round: 0.1, name: 'letter', parent: 'body', noInk: true })
      .wedge([0.22, 0.07, 0.002], [0, 0.075, 0.0045], { color: '#ece4cf', rot: [180, 0, 0], name: 'flap', parent: 'body', pivot: [0, 0.11, 0.0045], mover: { kind: 'swing', axis: 'x', amount: -170 } })
      .cyl([0.022, 0.004, 0.022], [0, 0.044, 0.008], { color: '#b8262e', rot: [90, 0, 0], parent: 'flap' })
      .box([0.03, 0.035, 0.001], [0.085, 0.085, 0.0035], { color: '#d6453a', noInk: true })
      .act({
        click: [
          [A.operate('flap', 'open'), A.pose('letter', { move: [0, 0.07, 0], dur: 0.6 })],
          [A.pose('letter', { move: [0, 0, 0], dur: 0.5 }), A.operate('flap', 'close')],
        ],
      })
      .done(),
  ),
  e('equal sign', 'ideas', 'math symbols', () =>
    tile('equal sign')
      .box([0.08, 0.02, 0.012], [0, 0.085, 0.018], { color: '#2a6ab0', round: 0.4, name: 'barTop', parent: 'tile' })
      .box([0.08, 0.02, 0.012], [0, 0.045, 0.018], { color: '#2a6ab0', round: 0.4, name: 'barBottom', parent: 'tile' })
      .act({ click: [A.par(A.pose('barTop', { move: [0, 0.012, 0], dur: 0.25 }), A.pose('barBottom', { move: [0, -0.012, 0], dur: 0.25 })), A.par(A.pose('barTop', { move: [0, 0, 0], dur: 0.25 }), A.pose('barBottom', { move: [0, 0, 0], dur: 0.25 }), A.effect('sparkle', { dur: 0.8 }))] })
      .done(),
  ),
  // A pencil eraser, half pink and half blue rubber in a card sleeve: it rubs, and crumbs fly.
  e('eraser', 'study', 'stationery', () =>
    m('eraser', { edge: 'soft' })
      .box([0.035, 0.034, 0.024], [-0.018, 0.017, 0], { color: '#f28aa6', round: 0.35 })
      .box([0.03, 0.034, 0.024], [0.02, 0.017, 0], { color: '#4e7fd6', round: 0.35 })
      .box([0.03, 0.036, 0.026], [0.002, 0.018, 0], { color: '#f2efe6', round: 0.1, edge: 'sharp' })
      .label('ERASER', [0.026, 0.01], [0.002, 0.02, 0.0135], { color: '#2a6ab0', depth: 0.002 })
      .act({ click: [A.par(A.anim('wobble', 2), A.effect('dust', { dur: 1 }), A.say('Scrub scrub', 1.5))] })
      .done(),
  ),
  // A shopping-centre escalator, 4.5 m rise at 30 degrees: a stainless truss, glass balustrades with black
  // handrails, steps with yellow edges that run up when it starts.
  e('escalator', 'places', 'building parts', () => {
    const b = m('escalator', { view: 'side', edge: 'sharp' });
    const rise = 4.5, run = rise / Math.tan(Math.PI / 6), z0 = run / 2, zt = -run / 2;
    const slope = (t: number, dy = 0): V => [0, t * rise + dy, z0 - t * run];
    const L = Math.hypot(rise, run);
    b.box([1.3, 0.9, L], slope(0.5, -0.25), { color: '#c8ccd2', rot: [30, 0, 0], round: 0.05 })
      .box([1.3, 0.9, 2.4], [0, 0.0, z0 + 1.2], { color: '#c8ccd2', round: 0.05 })
      .box([1.3, 0.9, 2.4], [0, rise, zt - 1.2], { color: '#c8ccd2', round: 0.05 })
      .box([1.6, 0.04, 2.4], [0, 0.47, z0 + 1.2], { color: '#9aa0a8' })
      .box([1.6, 0.04, 2.4], [0, rise + 0.47, zt - 1.2], { color: '#9aa0a8' })
      .box([3.2, 0.35, 2.6], [0, rise + 0.3, zt - 1.9], { color: '#d8d4cc', round: 0.05 })
      .pair((s) => void b.cyl([0.35, rise + 0.1, 0.35], [s * 1.3, (rise + 0.1) / 2, zt - 2.6], { color: '#d8d4cc' }))
      .box([1.0, 0.02, 0.4], [0, 0.48, z0 + 0.3], { color: '#5a5f66', name: 'steps' });
    const n = 15;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const p = slope(t, 0.45);
      b.box([1.0, 0.2, run / n], [0, p[1] - 0.06, p[2]], { color: '#6a6f76', round: 0.05, parent: 'steps' });
      b.box([1.0, 0.02, 0.04], [0, p[1] + 0.045, p[2] + run / n / 2 - 0.03], { color: '#f2c14e', parent: 'steps', noInk: true });
    }
    b.pair((s) => {
      b.box([0.03, 0.85, 1.8], [s * 0.56, 0.95, z0 + 0.6], { color: '#cfe3ec', round: 0.05 });
      b.box([0.03, 0.85, 1.8], [s * 0.56, rise + 0.95, zt - 0.6], { color: '#cfe3ec', round: 0.05 });
    });
    b.pair((s) => {
      b.box([0.03, 0.85, L], [s * 0.56, slope(0.5, 0.95)[1], slope(0.5)[2]], { color: '#cfe3ec', rot: [30, 0, 0], round: 0.05 });
      b.rod([s * 0.58, 1.42, z0 + 1.5], [s * 0.58, 1.42, z0], 0.1, '#1e1e1e');
      b.rod([s * 0.58, 1.42, z0], [s * 0.58, rise + 1.42, zt], 0.1, '#1e1e1e');
      b.rod([s * 0.58, rise + 1.42, zt], [s * 0.58, rise + 1.42, zt - 1.5], 0.1, '#1e1e1e');
      b.arc([0.4, 0.4, 0.1], [s * 0.58, 1.22, z0 + 1.5], { color: '#1e1e1e', rot: [0, 90, -90], arc: 180 });
    });
    const up = (k: number) => A.pose('steps', { move: [0, (rise / n) * k, (-run / n) * k], dur: 0.6 });
    return b
      .act({
        click: [
          [A.say('Whirrrr...', 1.5), up(1), A.pose('steps', { move: [0, 0, 0], dur: 0 }), up(1), A.pose('steps', { move: [0, 0, 0], dur: 0 }), up(1), A.pose('steps', { move: [0, 0, 0], dur: 0 }), up(1), A.pose('steps', { move: [0, 0, 0], dur: 0 })],
        ],
      })
      .done();
  }),
  // A tall gum tree (14 m): a smooth pale trunk with strips of bark peeling off it (one comes away), open
  // blue-green crown clusters on long branches.
  e('eucalyptus tree', 'garden', 'trees', () => {
    const b = m('eucalyptus tree');
    const tk = '#e2dccc';
    b.cyl([0.75, 0.6, 0.75], [0, 0.3, 0], { color: tk, taper: 0.75 })
      .cyl([0.55, 8.2, 0.55], [0.1, 4.4, 0], { color: tk, taper: 0.7, rot: [0, 0, -1.5], name: 'trunk' })
      .rod([0.2, 7.6, 0], [-2.4, 10.4, 0.6], 0.28, tk)
      .rod([0.2, 7.8, 0], [2.6, 11.0, -0.4], 0.26, tk)
      .rod([0.2, 8.2, 0], [0.4, 12.0, 0.5], 0.24, tk)
      .rod([0.15, 6.4, 0], [1.6, 8.2, 1.0], 0.18, tk)
      .ball([2.6, 2.0, 2.4], [0.3, 12.8, 0.3], { color: '#86b09b', name: 'top' });
    const tips: V[] = [[-2.5, 10.6, 0.6], [2.7, 11.2, -0.4], [0.4, 12.4, 0.5], [1.7, 8.6, 1.1], [-1.0, 12.0, -1.4]];
    tips.forEach(([tx, ty, tz], i) => {
      for (const [cx, cz] of around(4, 0.9, i)) b.ball([1.8, 1.4, 1.7], [tx + cx, ty + ((cx * 3) % 0.6), tz + cz], { color: i % 2 ? '#7fa894' : '#6f9a86', parent: 'top' });
      b.ball([1.9, 1.5, 1.8], [tx, ty + 0.6, tz], { color: '#86b09b', parent: 'top' });
    });
    b.each(5, (i) => void b.box([0.22, 0.9, 0.05], [0.08 + (i % 2) * 0.06, 1.3 + i * 1.3, 0.27], { color: '#b8a080', round: 0.6, rot: [0, 0, (i % 2 ? 6 : -5)], noInk: true, parent: 'trunk' }));
    b.box([0.3, 1.4, 0.05], [0.25, 2.4, -0.2], { color: '#a88a68', round: 0.6, rot: [0, 120, 8], name: 'bark', parent: 'trunk', piece: true });
    return b
      .act({
        click: [
          [A.par(A.pose('top', { rot: [0, 0, 5], dur: 0.8 }), A.say('Rustle rustle...', 2)), A.detach('bark', 'bark'), A.pose('top', { rot: [0, 0, -4], dur: 0.8 }), A.pose('top', { rot: [0, 0, 0], dur: 0.6 })],
          [A.reattach('bark'), A.effect('sparkle', { dur: 1 })],
        ],
      })
      .done();
  }),
  // The sword in the stone: a mossy boulder with a long blade sunk into it; it slides up, gleaming, and back.
  e('excalibur', 'fantasy', 'magic items', () =>
    m('excalibur')
      .ball([0.95, 0.55, 0.75], [0, 0.22, 0], { color: '#8a8a86', name: 'stone' })
      .ball([0.5, 0.35, 0.45], [0.3, 0.16, 0.18], { color: '#7a7a76', parent: 'stone' })
      .ball([0.4, 0.12, 0.35], [-0.2, 0.47, -0.05], { color: '#5f8a4a', parent: 'stone', noInk: true })
      .box([0.055, 0.82, 0.012], [0, 0.82, 0], { color: '#dfe5ea', round: 0.1, edge: 'sharp', name: 'sword', parent: 'stone', piece: true })
      .box([0.012, 0.8, 0.014], [0, 0.82, 0], { color: '#b8c0c8', edge: 'sharp', parent: 'sword', noInk: true })
      .box([0.28, 0.04, 0.04], [0, 1.24, 0], { color: 'gold', round: 0.5, edge: 'sharp', parent: 'sword' })
      .ball(0.03, [0, 1.24, 0.022], { color: '#2a5ad8', parent: 'sword' })
      .cyl([0.032, 0.16, 0.032], [0, 1.34, 0], { color: '#3a2a6a', parent: 'sword' })
      .ball(0.055, [0, 1.44, 0], { color: 'gold', parent: 'sword' })
      .act({
        click: [
          [A.pose('sword', { move: [0, 0.65, 0], dur: 1.2 }), A.par(A.effect('sparkle', { dur: 2 }), A.say('Shiiiing!', 2))],
          [A.pose('sword', { move: [0, 0, 0], dur: 0.5 }), A.say('Clunk.', 1)],
        ],
      })
      .done(),
  ),
  e('exclamation point (punctuation)', 'ideas', 'punctuation', () =>
    tile('exclamation point (punctuation)')
      .box([0.026, 0.062, 0.012], [0, 0.085, 0.018], { color: '#d6453a', round: 0.5, parent: 'tile', name: 'bar' })
      .ball([0.028, 0.028, 0.012], [0, 0.03, 0.018], { color: '#d6453a', parent: 'tile' })
      .act({ click: [A.par(A.anim('bounce', 2), A.say('!', 1.5))] })
      .done(),
  ),
  // A 65 cm gym ball with its valve plug: it bounces.
  e('exercise ball', 'sports', 'gym', () =>
    m('exercise ball')
      .ball(0.65, [0, 0.325, 0], { color: '#3a8fd8', name: 'ball' })
      .torus([0.652, 0.652, 0.012], [0, 0.325, 0], { color: '#6ab4f0', rot: [0, 30, 0], noInk: true, tube: 0.03, parent: 'ball' })
      .torus([0.652, 0.652, 0.012], [0, 0.325, 0], { color: '#6ab4f0', rot: [0, -40, 0], noInk: true, tube: 0.03, parent: 'ball' })
      .cyl([0.03, 0.015, 0.03], [0, 0.325, 0.325], { color: 'white', rot: [90, 0, 0], parent: 'ball' })
      .act({ click: [A.par(A.anim('bounce', 3), A.say('Boing! Boing!', 2))] })
      .done(),
  ),
  // An upright exercise bike: stabiliser feet, a shrouded flywheel, pedals on cranks that spin, a padded saddle
  // at 0.9 m, bars and a console that lights.
  e('exercise cycle', 'sports', 'gym', () => {
    const b = m('exercise cycle', { view: 'side', edge: 'sharp' });
    const fr = '#d6453a';
    b.box([0.55, 0.06, 0.08], [0, 0.04, 0.45], { color: '#2a2c30', round: 0.4 })
      .box([0.55, 0.06, 0.08], [0, 0.04, -0.5], { color: '#2a2c30', round: 0.4 })
      .rod([0, 0.07, -0.5], [0, 0.07, 0.45], 0.07, fr)
      .loft([0.14, 0.55, 0.55], [0, 0.42, 0.25], [[0, 0.6, 0.5, -0.1], [0.3, 1, 1, 0], [0.8, 1, 0.95, 0], [1, 0.6, 0.6, 0]], { color: '#2a2c30', boxy: 0.4, edge: 'soft' })
      .rod([0, 0.1, -0.45], [0, 0.55, -0.2], 0.07, fr)
      .rod([0, 0.55, -0.2], [0, 0.88, -0.3], 0.06, fr)
      .rod([0, 0.1, 0.4], [0, 1.08, 0.32], 0.07, fr)
      .rod([0, 0.42, -0.05], [0, 0.42, 0.2], 0.06, fr)
      .box([0.24, 0.09, 0.3], [0, 0.93, -0.32], { color: '#1e1e1e', round: 0.7, edge: 'soft' })
      .stick([-0.25, 1.1, 0.4], [0.25, 1.1, 0.4], 0.035, '#1e1e1e')
      .pair((s) => void b.rod([s * 0.25, 1.1, 0.4], [s * 0.22, 1.15, 0.22], 0.035, '#1e1e1e'))
      .box([0.2, 0.13, 0.05], [0, 1.2, 0.3], { color: '#1e1e1e', rot: [-30, 0, 0], round: 0.3 })
      .box([0.16, 0.08, 0.01], [0, 1.21, 0.33], { color: '#4ad0ff', rot: [-30, 0, 0], glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .cyl([0.12, 0.05, 0.12], [0.09, 0.42, -0.05], { color: 'silver', rot: [0, 0, 90], name: 'crank', mover: { kind: 'spin', axis: 'x', amount: 360 } });
    b.pair((s) => {
      b.box([0.03, 0.2, 0.03], [s * 0.12, 0.42, -0.05], { color: 'silver', parent: 'crank' });
      b.box([0.1, 0.03, 0.06], [s * 0.17, s > 0 ? 0.52 : 0.32, -0.05], { color: '#1e1e1e', parent: 'crank' });
    });
    return b
      .act({
        click: [
          [A.par(A.operate('crank', 'on'), A.operate('screen', 'on'), A.say('Whirr whirr whirr', 2.5)), A.wait(3), A.par(A.operate('crank', 'off'), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A boxed EXIT sign with a running arrow, lit from inside: it flickers.
  e('exit sign', 'ideas', 'signs', () =>
    m('exit sign', { edge: 'sharp' })
      .box([0.08, 0.05, 0.05], [0, 0.025, 0], { color: '#9aa0a8' })
      .box([0.38, 0.17, 0.07], [0, 0.135, 0], { color: 'white', round: 0.15 })
      .box([0.35, 0.14, 0.01], [0, 0.135, 0.036], { color: '#22c25a', glow: true, name: 'light', mover: { kind: 'light', on: true } })
      .label('EXIT', [0.18, 0.09], [-0.06, 0.135, 0.044], { color: '#22c25a', depth: 0.004 })
      .stick([0.06, 0.135, 0.044], [0.12, 0.135, 0.044], 0.02, 'white', { noInk: true })
      .cone([0.06, 0.045, 0.008], [0.14, 0.135, 0.044], { color: 'white', rot: [0, 0, -90], noInk: true })
      .act({ click: [A.operate('light', 'off'), A.wait(0.2), A.operate('light', 'on'), A.wait(0.15), A.operate('light', 'off'), A.wait(0.3), A.operate('light', 'on'), A.say('Bzzt.', 1)] })
      .done(),
  ),
  // An orange cord coiled on a reel, its four-way power strip with a lit rocker switch.
  e('extension cord', 'home', 'electrical', () => {
    const b = m('extension cord', { edge: 'sharp' });
    b.cyl([0.24, 0.02, 0.24], [0, 0.17, -0.07], { color: '#3a3633', rot: [90, 0, 0] })
      .cyl([0.24, 0.02, 0.24], [0, 0.17, 0.07], { color: '#3a3633', rot: [90, 0, 0] })
      .cyl([0.2, 0.12, 0.2], [0, 0.17, 0], { color: '#f0821e', rot: [90, 0, 0], edge: 'soft' })
      .rod([-0.1, 0.0, -0.08], [0, 0.17, -0.08], 0.02, '#3a3633')
      .rod([0.1, 0.0, -0.08], [0, 0.17, -0.08], 0.02, '#3a3633')
      .stick([0, 0.17, 0.08], [0, 0.17, 0.12], 0.02, '#3a3633')
      .box([0.03, 0.08, 0.02], [0.03, 0.17, 0.125], { color: '#3a3633' })
      .rod([0.0, 0.08, 0.05], [0.1, 0.01, 0.2], 0.018, '#f0821e', { edge: 'soft' })
      .rod([0.1, 0.01, 0.2], [0.2, 0.01, 0.24], 0.018, '#f0821e', { edge: 'soft' })
      .box([0.3, 0.045, 0.07], [0.37, 0.023, 0.24], { color: 'white', round: 0.4 });
    b.each(4, (i) => {
      b.box([0.04, 0.004, 0.04], [0.28 + i * 0.055, 0.046, 0.24], { color: '#e0e0e0', noInk: true });
      b.pair((s) => void b.box([0.003, 0.003, 0.01], [0.28 + i * 0.055 + s * 0.007, 0.048, 0.24], { color: 'black', noInk: true }));
    });
    b.box([0.035, 0.012, 0.03], [0.22 + 0.32, 0.05, 0.24], { color: '#ff3b2e', glow: true, name: 'switch', mover: { kind: 'light', on: false } });
    return b.act({ click: [[A.operate('switch', 'on'), A.say('Click!', 1)], [A.operate('switch', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A Snellen chart on a little stand with a pointer that runs down the lines.
  e('eye chart', 'clinic', 'eye care', () => {
    const b = m('eye chart', { edge: 'sharp' });
    b.box([0.24, 0.02, 0.16], [0, 0.01, 0], { color: '#3a3633', round: 0.3 })
      .stick([0, 0.02, -0.02], [0, 0.12, -0.02], 0.02, 'silver')
      .box([0.3, 0.5, 0.012], [0, 0.37, -0.02], { color: 'white', round: 0.05 })
      .box([0.31, 0.51, 0.008], [0, 0.37, -0.03], { color: '#3a3633', round: 0.05 });
    const rows: Array<[string, number]> = [['E', 0.085], ['F  P', 0.055], ['T  O  Z', 0.042], ['L  P  E  D', 0.032], ['P  E  C  F  D', 0.026], ['E  D  F  C  Z  P', 0.021], ['F  E  L  O  P  Z  D', 0.017]];
    let y = 0.57;
    rows.forEach(([t, h], i) => {
      y -= h / 2 + 0.012;
      b.label(t, [Math.min(0.26, 0.04 + t.length * h * 0.32), h], [0, y, -0.012], { color: 'white', depth: 0.002 });
      if (i === 4) b.box([0.26, 0.004, 0.002], [0, y - h / 2 - 0.006, -0.012], { color: '#d6453a', noInk: true });
      y -= h / 2;
    });
    b.stick([0.17, 0.2, 0.02], [0.02, 0.5, 0.02], 0.008, 'darkwood', { name: 'pointer', pivot: [0.17, 0.2, 0.02] });
    return b
      .act({
        click: [
          [A.pose('pointer', { rot: [0, 0, 0], dur: 0.2 }), A.say('E...', 1.2), A.pose('pointer', { rot: [0, 0, -10], dur: 0.4 }), A.say('F... P...', 1.2), A.pose('pointer', { rot: [0, 0, -22], dur: 0.4 }), A.say('T... O... Z?', 1.5), A.pose('pointer', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A squeeze bottle of eye drops: the cap comes off and a drop falls from the nozzle.
  e('eye drops', 'clinic', 'medicine', () =>
    m('eye drops')
      .box([0.032, 0.05, 0.022], [0, 0.025, 0], { color: 'white', round: 0.6, name: 'bottle' })
      .box([0.034, 0.024, 0.024], [0, 0.026, 0], { color: '#7ab8e8', round: 0.5, noInk: true, parent: 'bottle' })
      .cyl([0.028, 0.012, 0.02], [0, 0.056, 0], { color: 'white', taper: 0.5, parent: 'bottle' })
      .cone([0.01, 0.016, 0.01], [0, 0.069, 0], { color: 'white', parent: 'bottle' })
      .cyl([0.018, 0.026, 0.018], [0, 0.072, 0], { color: '#2a6ab0', edge: 'sharp', name: 'cap', parent: 'bottle', piece: true })
      .ball([0.008, 0.011, 0.008], [0, 0.072, 0], { color: '#a8dcff', name: 'drop', scale: 0 })
      .act({ click: [A.pose('cap', { move: [0.03, 0.03, 0], rot: [0, 0, -30], dur: 0.4 }), A.pose('drop', { scale: 1, move: [0, -0.008, 0], dur: 0.4 }), A.pose('drop', { move: [0, -0.07, 0], dur: 0.3 }), A.par(A.pose('drop', { scale: 0, move: [0, 0, 0], dur: 0.05 }), A.say('Drip!', 1)), A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A kohl eyeliner pencil: its cap pulls off to show the soft black tip.
  e('eye liner', 'wardrobe', 'makeup', () =>
    m('eye liner', { edge: 'sharp' })
      .cyl([0.011, 0.1, 0.011], [0, 0.05, 0], { color: '#1e1e1e', segs: 6 })
      .cyl([0.012, 0.006, 0.012], [0, 0.003, 0], { color: 'silver' })
      .cone([0.011, 0.016, 0.011], [0, 0.108, 0], { color: 'lightwood' })
      .cone([0.004, 0.006, 0.004], [0, 0.116, 0], { color: 'black' })
      .cyl([0.013, 0.035, 0.013], [0, 0.105, 0], { color: '#3a3a40', name: 'cap', piece: true })
      .cyl([0.0135, 0.004, 0.0135], [0, 0.09, 0], { color: 'gold', parent: 'cap', noInk: true })
      .act({ click: [[A.pose('cap', { move: [0.025, 0.03, 0], rot: [0, 0, -40], dur: 0.4 })], [A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }), A.say('Click.', 1)]] })
      .done(),
  ),
  // A pirate's eye patch on its cord.
  e('eye patch', 'wardrobe', 'accessories', () =>
    m('eye patch')
      .ball([0.075, 0.06, 0.02], [0, 0.045, 0], { color: '#1e1e1e', rot: [0, 0, -10], name: 'patch' })
      .ball([0.06, 0.045, 0.006], [0, 0.046, 0.009], { color: '#2e2e2e', rot: [0, 0, -10], noInk: true, parent: 'patch' })
      .rod([-0.035, 0.058, 0], [-0.1, 0.064, -0.02], 0.005, 'black', { parent: 'patch' })
      .rod([-0.1, 0.064, -0.02], [-0.13, 0.004, -0.04], 0.005, 'black', { parent: 'patch' })
      .rod([0.035, 0.032, 0], [0.1, 0.028, -0.02], 0.005, 'black', { parent: 'patch' })
      .rod([0.1, 0.028, -0.02], [0.12, 0.004, -0.04], 0.005, 'black', { parent: 'patch' })
      .act({ click: [A.par(A.anim('wobble'), A.say('Arrr!', 1.5))] })
      .done(),
  ),
  // An eye-shadow palette: six pans of colour, a mirrored lid on a hinge, a little brush.
  e('eye shadow', 'wardrobe', 'makeup', () => {
    const b = m('eye shadow', { edge: 'sharp' }).box([0.09, 0.012, 0.07], [0, 0.006, 0], { color: '#1e1e1e', round: 0.3 });
    ['#f2a0b8', '#a07ad0', '#d9b24a', '#8a5a3a', '#8ac8f0', '#f2c0a0'].forEach((c, i) => void b.cyl([0.022, 0.004, 0.022], [-0.027 + (i % 3) * 0.027, 0.013, -0.013 + Math.floor(i / 3) * 0.027], { color: c, edge: 'soft' }));
    return b
      .box([0.09, 0.07, 0.008], [0, 0.047, -0.039], { color: '#1e1e1e', round: 0.3, name: 'lid', pivot: [0, 0.012, -0.035], mover: { kind: 'swing', axis: 'x', amount: 95 } })
      .box([0.07, 0.05, 0.002], [0, 0.049, -0.0345], { color: '#dfe8ee', parent: 'lid', noInk: true })
      .rod([-0.03, 0.006, 0.05], [0.03, 0.006, 0.05], 0.004, 'black')
      .ball([0.012, 0.008, 0.008], [0.035, 0.006, 0.05], { color: '#c8a888', edge: 'soft' })
      .act({ click: [[A.operate('lid', 'on'), A.say('Snap!', 1)], [A.operate('lid', 'off'), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A brow pencil: a spoolie brush at one end, a capped tip at the other.
  e('eyebrow pencil', 'wardrobe', 'makeup', () =>
    m('eyebrow pencil', { edge: 'sharp' })
      .capsule([0.011, 0.028, 0.011], [0, 0.014, 0], { color: '#3a2a20', edge: 'soft' })
      .cyl([0.01, 0.006, 0.01], [0, 0.03, 0], { color: 'gold' })
      .cyl([0.009, 0.11, 0.009], [0, 0.088, 0], { color: '#6a4632', segs: 6 })
      .cone([0.009, 0.016, 0.009], [0, 0.151, 0], { color: 'lightwood' })
      .cone([0.004, 0.006, 0.004], [0, 0.157, 0], { color: '#4a2f1c' })
      .cyl([0.011, 0.032, 0.011], [0, 0.15, 0], { color: '#8a6a52', name: 'cap', piece: true })
      .act({ click: [[A.pose('cap', { move: [0.02, 0.03, 0], rot: [0, 0, -35], dur: 0.4 })], [A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A brown glass dropper bottle: the rubber-bulbed pipette lifts out and lets a drop fall.
  e('eyedropper', 'study', 'lab gear', () =>
    m('eyedropper')
      .cyl([0.04, 0.05, 0.04], [0, 0.025, 0], { color: '#8a4a1a', edge: 'sharp' })
      .cyl([0.04, 0.012, 0.04], [0, 0.056, 0], { color: '#8a4a1a', taper: 0.55, edge: 'sharp' })
      .box([0.042, 0.022, 0.042], [0, 0.025, 0], { color: 'white', round: 0.1, noInk: true })
      .cyl([0.026, 0.014, 0.026], [0, 0.069, 0], { color: 'black', edge: 'sharp', name: 'pipette', piece: true })
      .cyl([0.008, 0.06, 0.008], [0, 0.045, 0], { color: '#cfe8f2', parent: 'pipette' })
      .capsule([0.02, 0.035, 0.02], [0, 0.095, 0], { color: '#d6453a', parent: 'pipette' })
      .ball([0.007, 0.01, 0.007], [0, 0.012, 0], { color: '#a8dcff', name: 'drop', scale: 0 })
      .act({ click: [A.pose('pipette', { move: [0, 0.07, 0], dur: 0.5 }), A.pose('drop', { scale: 1, move: [0, 0.07, 0], dur: 0.2 }), A.pose('drop', { move: [0, -0.01, 0], dur: 0.3 }), A.par(A.pose('drop', { scale: 0, move: [0, 0, 0], dur: 0.05 }), A.say('Drip!', 1)), A.pose('pipette', { move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // Reading glasses resting on their folded-out arms: the arms fold in on their hinges and out again.
  e('eyeglasses', 'wardrobe', 'eyewear', () => {
    const b = m('eyeglasses', { edge: 'sharp' });
    b.pair((s) => {
      b.torus([0.05, 0.04, 0.008], [s * 0.032, 0.025, 0], { color: '#2a2726', tube: 0.16 })
        .cyl([0.044, 0.002, 0.034], [s * 0.032, 0.025, 0], { color: '#cfe8f2', rot: [90, 0, 0], noInk: true })
        .box([0.008, 0.006, 0.006], [s * 0.058, 0.03, -0.002], { color: '#2a2726' })
        .rod([s * 0.06, 0.03, -0.004], [s * 0.062, 0.03, -0.12], 0.004, '#2a2726', { name: s > 0 ? 'armL' : 'armR', pivot: [s * 0.06, 0.03, -0.004], mover: { kind: 'swing', axis: 'y', amount: s * 88 } })
        .rod([s * 0.062, 0.03, -0.12], [s * 0.062, 0.006, -0.142], 0.004, '#2a2726', { parent: s > 0 ? 'armL' : 'armR' })
        .ball([0.008, 0.01, 0.006], [s * 0.012, 0.018, 0.006], { color: '#e8e8e8', noInk: true });
    });
    return b
      .arc([0.022, 0.014, 0.006], [0, 0.03, 0], { color: '#2a2726', arc: 150 })
      .act({ click: [[A.operate('arm', 'on'), A.say('Click.', 1)], [A.operate('arm', 'off')]] })
      .done();
  }),
  // A brick works: a production hall with a sawtooth roof of north lights, a loading dock with a roller door
  // that rolls up, an office block with windows, a tall chimney that smokes and a steel tank piped to the hall.
  e('factory', 'places', 'industry', () => {
    const b = m('factory', { edge: 'sharp' });
    const brick = '#a9563e', W = 16, D = 10, H = 6;
    b.box([W, H, D], [0, H / 2, 0], { color: brick, round: 0.02 })
      .box([W + 0.12, 0.5, D + 0.12], [0, 0.25, 0], { color: '#6a6560' })
      .box([W + 0.2, 0.25, D + 0.2], [0, H, 0], { color: '#8a8580', round: 0.1 });
    for (let i = 0; i < 4; i++) {
      const cx = -W / 2 + W / 8 + (i * W) / 4;
      b.wedge([W / 4, 2.2, D], [cx, H + 1.1, 0], { color: '#7a7f86', apex: -0.5 });
      b.box([0.05, 1.7, D - 0.4], [cx - W / 8 + 0.1, H + 0.95, 0], { color: '#9cc3d6', round: 0.05 });
    }
    // loading dock + roller door
    b.box([5, 1.1, 2.2], [-3.5, 0.55, D / 2 + 1.1], { color: '#8a8580', round: 0.05 })
      .box([4.0, 3.6, 0.12], [-3.5, 2.9, D / 2 + 0.02], { color: '#3a3633', round: 0.05 })
      .box([3.8, 3.4, 0.1], [-3.5, 2.85, D / 2 + 0.08], { color: '#b8bec6', round: 0.02, name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 3.0 } })
      .each(8, (i) => void b.box([3.8, 0.04, 0.03], [-3.5, 1.3 + i * 0.4, D / 2 + 0.14], { color: '#9aa0a8', parent: 'shutter', noInk: true }))
      .box([4.2, 0.5, 0.5], [-3.5, 4.85, D / 2 + 0.25], { color: '#5a5f66', round: 0.2 })
      .pair((s) => void b.box([0.3, 0.6, 0.3], [-3.5 + s * 2.2, 1.2, D / 2 + 2.15], { color: '#f2c14e' }))
      .label('ACME WORKS', [4.4, 0.8], [3.6, 4.9, D / 2 + 0.03], { color: 'white', depth: 0.03 });
    // office block
    b.box([6, 7.5, 4], [4.5, 3.75, D / 2 + 2.0], { color: '#c9b9a0', round: 0.02 })
      .box([6.2, 0.25, 4.2], [4.5, 7.55, D / 2 + 2.0], { color: '#8a8580', round: 0.1 });
    for (const y of [2.2, 5.2]) for (const xx of [2.5, 4.5, 6.5]) win(b, [xx, y, D / 2 + 4.01], 1.3, 1.4, { frame: '#5a5f66', glass: '#7fa6bf' });
    door(b, 'door', [4.5, 0, D / 2 + 4.0], 1.0, 2.2, { color: '#3a5a7a', frame: '#5a5f66', glass: true });
    // chimney with smoke source, tank and pipes
    b.cyl([1.6, 18, 1.6], [-6, 9, -2.5], { color: '#9a4a36', taper: 0.75 })
      .cyl([1.35, 0.5, 1.35], [-6, 17.8, -2.5], { color: '#3a3633' })
      .each(3, (i) => void b.cyl([1.6 - i * 0.2, 0.25, 1.6 - i * 0.2], [-6, 8 + i * 3.5, -2.5], { color: '#e8e2d6', taper: 0.98 }))
      .cyl([3.2, 5.5, 3.2], [9.6, 2.75, -2.5], { color: '#c8ccd2' })
      .dome([3.2, 1.0, 3.2], [9.6, 5.5, -2.5], { color: '#c8ccd2' })
      .stick([8.0, 4.5, -2.5], [W / 2, 4.5, -2.5], 0.35, '#5a7a9a')
      .stick([8.4, 1.0, -1.2], [W / 2, 1.0, -1.2], 0.35, '#d6453a');
    return b
      .act({
        click: [
          [A.par(A.operate('shutter', 'up'), A.effect('smoke', { dur: 4 }), A.say('Clank! Clank! Hisss!', 2.5)), A.wait(2), A.operate('shutter', 'down')],
          [A.operate('door', 'open'), A.say('Toot-toot! Shift change!', 2), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A round paddle fan on a bamboo handle (uchiwa): it waves.
  e('fan (tool)', 'wardrobe', 'accessories', () => {
    const b = m('fan (tool)')
      .stick([0, 0, 0], [0, 0.14, 0], 0.024, 'lightwood', { name: 'fan', pivot: [0, 0.02, 0] })
      .cyl([0.24, 0.006, 0.22], [0, 0.25, 0], { color: '#f4b6c2', rot: [90, 0, 0], parent: 'fan', edge: 'sharp' })
      .torus([0.242, 0.222, 0.008], [0, 0.25, 0], { color: 'lightwood', tube: 0.04, parent: 'fan' });
    for (const a of [-60, -30, 0, 30, 60]) b.rod([0, 0.14, 0.004], [Math.sin((a * Math.PI) / 180) * 0.1, 0.25 + Math.cos((a * Math.PI) / 180) * 0.09, 0.004], 0.003, 'lightwood', { noInk: true, parent: 'fan' });
    b.ball([0.07, 0.07, 0.003], [0.04, 0.27, 0.005], { color: '#d6453a', noInk: true, parent: 'fan' })
      .ball([0.04, 0.04, 0.003], [-0.05, 0.22, 0.005], { color: 'white', noInk: true, parent: 'fan' });
    const w = (r: number) => A.pose('fan', { rot: [0, 0, r], dur: 0.25 });
    return b.act({ click: [w(20), w(-20), w(20), w(-20), w(0), A.say('Whoosh!', 1)] }).done();
  }),
  // A big carnivore's canine: a long curved cone of enamel on its root.
  e('fang', 'wild', 'animal parts', () =>
    m('fang')
      .cyl([0.036, 0.022, 0.03], [0, 0.011, 0], { color: '#d8c8a0', taper: 1.1 })
      .cone([0.034, 0.06, 0.029], [0.002, 0.052, 0], { color: '#f6f0de', rot: [0, 0, -8], taper: 0.45, name: 'tooth' })
      .cone([0.016, 0.042, 0.014], [0.011, 0.1, 0], { color: '#f6f0de', rot: [0, 0, -18], parent: 'tooth' })
      .act({ click: [A.par(A.anim('wobble'), A.effect('sparkle', { dur: 1 }), A.say('Grrr!', 1.2))] })
      .done(),
  ),
  // A set of snapping jaws with long fangs: the upper jaw is hinged at the back and chomps.
  e('fangs', 'wild', 'animal parts', () => {
    const b = m('fangs')
      .box([0.13, 0.025, 0.09], [0, 0.0125, -0.01], { color: '#e88a9a', round: 0.8, name: 'lower' })
      .box([0.13, 0.03, 0.09], [0, 0.07, -0.01], { color: '#e88a9a', round: 0.8, name: 'jaw', pivot: [0, 0.05, -0.055], mover: { kind: 'swing', axis: 'x', amount: -40 } });
    b.each(6, (i) => {
      const xx = -0.05 + i * 0.02;
      b.box([0.016, 0.014, 0.012], [xx, 0.03, 0.03 - Math.abs(xx) * 0.4], { color: 'white', round: 0.4, parent: 'lower' });
      if (i !== 1 && i !== 4) b.box([0.016, 0.016, 0.012], [xx, 0.05, 0.032 - Math.abs(xx) * 0.4], { color: 'white', round: 0.4, parent: 'jaw' });
    });
    b.pair((s) => void b.cone([0.018, 0.045, 0.014], [s * 0.03, 0.035, 0.022], { color: 'white', rot: [180, 0, 0], parent: 'jaw' }));
    return b.act({ click: [A.operate('jaw', 'open'), A.wait(0.4), A.par(A.operate('jaw', 'close'), A.say('CHOMP!', 1.2)), A.operate('jaw', 'open'), A.par(A.operate('jaw', 'close'), A.anim('hop'))] }).done();
  }),
  // A waist bag on its strap: a zipped front pocket that zips open, a side-release buckle.
  e('fanny pack', 'wardrobe', 'bags', () =>
    m('fanny pack')
      .box([0.26, 0.14, 0.09], [0, 0.075, 0], { color: '#1f8a8a', round: 0.75, name: 'bag' })
      .box([0.17, 0.07, 0.03], [0, 0.06, 0.045], { color: '#176a6a', round: 0.6 })
      .rod([-0.11, 0.118, 0.04], [0.11, 0.118, 0.04], 0.005, '#1e1e1e', { noInk: true })
      .box([0.012, 0.022, 0.006], [-0.08, 0.108, 0.048], { color: 'silver', edge: 'sharp', name: 'zip' })
      .torus([0.46, 0.36, 0.035], [0, 0.02, -0.15], { color: '#1e1e1e', rot: [90, 0, 0], tube: 0.08 })
      .box([0.05, 0.03, 0.04], [0, 0.02, -0.33], { color: '#3a3a3a', edge: 'sharp' })
      .act({ click: [[A.pose('zip', { move: [0.16, 0, 0], dur: 0.6 }), A.say('Zzzip!', 1)], [A.pose('zip', { move: [0, 0, 0], dur: 0.6 }), A.say('Zzzip!', 1)]] })
      .done(),
  ),
  // A farmyard: a red gambrel-roofed barn (9 m) with sliding doors and a hayloft, a silo with a domed cap, a white
  // rail fence, hay bales and a weathervane; a cow wanders out when the doors open.
  e('farm', 'places', 'countryside', () => {
    const b = m('farm', { edge: 'sharp' });
    const red = '#b8352b', W = 9, D = 12, H = 4.5, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: red, round: 0.02 })
      .box([W + 0.1, 0.3, D + 0.1], [0, 0.15, 0], { color: '#7a7570' })
      .pair((s) => {
        b.box([3.1, 0.25, D + 0.6], [s * 3.6, H + 1.2, 0], { color: '#5a5f66', rot: [0, 0, -s * 50], round: 0.1 });
        b.box([3.0, 0.25, D + 0.6], [s * 1.3, H + 2.95, 0], { color: '#5a5f66', rot: [0, 0, -s * 21], round: 0.1 });
      });
    for (const z of [fz - 0.05, -fz + 0.05]) {
      b.box([5.2, 2.3, 0.1], [0, H + 1.15, z], { color: red, round: 0.02 })
        .wedge([5.2, 1.0, 0.1], [0, H + 2.8, z], { color: red })
        .pair((s) => void b.wedge([3.8, 2.3, 0.1], [s * 2.6, H + 1.15, z], { color: red }));
    }
    b      .box([1.6, 1.6, 0.08], [0, H + 1.6, fz + 0.03], { color: '#f2efe6', round: 0.05 })
      .box([1.4, 1.4, 0.06], [0, H + 1.6, fz + 0.06], { color: '#7a3a2a', name: 'loft', pivot: [-0.7, H + 1.6, fz + 0.06], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([5.2, 0.15, 0.15], [0, 3.85, fz + 0.12], { color: '#f2efe6', round: 0.2 })
      .box([5.2, 3.6, 0.04], [0, 1.85, fz + 0.03], { color: '#22201f', noInk: true });
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([2.5, 3.6, 0.1], [s * 1.27, 1.85, fz + 0.12], { color: red, round: 0.05, name: n, mover: { kind: 'slide', axis: 'x', amount: s * 2.5 } });
      b.box([2.5, 0.12, 0.05], [s * 1.27, 3.55, fz + 0.18], { color: '#f2efe6', parent: n });
      b.box([2.5, 0.12, 0.05], [s * 1.27, 0.12, fz + 0.18], { color: '#f2efe6', parent: n });
      b.box([0.12, 3.6, 0.05], [s * 2.46, 1.85, fz + 0.18], { color: '#f2efe6', parent: n });
      b.rod([s * 0.1, 0.2, fz + 0.2], [s * 2.4, 3.5, fz + 0.2], 0.12, '#f2efe6', { parent: n });
    });
    win(b, [3.3, 2.4, fz + 0.01], 0.8, 0.8, { frame: '#f2efe6', glass: '#5a6a7a' });
    win(b, [-3.3, 2.4, fz + 0.01], 0.8, 0.8, { frame: '#f2efe6', glass: '#5a6a7a' });
    b.stick([0, H + 4.2, 0], [0, H + 5.6, 0], 0.06, '#3a3633')
      .cone([0.25, 0.6, 0.08], [0, H + 5.4, 0.3], { color: '#3a3633', rot: [90, 0, 0] })
      .box([0.08, 0.3, 0.6], [0, H + 5.4, -0.3], { color: '#3a3633' });
    b.cyl([3.4, 11, 3.4], [-7.2, 5.5, -3], { color: '#c8ccd2', segs: 24 })
      .dome([3.5, 1.6, 3.5], [-7.2, 11, -3], { color: '#9aa0a8' })
      .each(5, (i) => void b.cyl([3.45, 0.08, 3.45], [-7.2, 1.5 + i * 2, -3], { color: '#9aa0a8' }));
    for (let i = 0; i < 5; i++) b.stick([4.8 + i * 1.5, 0, fz + 3.5], [4.8 + i * 1.5, 1.25, fz + 3.5], 0.14, '#f2efe6');
    for (const y of [0.5, 1.05]) b.box([6.2, 0.14, 0.08], [7.8, y, fz + 3.5], { color: '#f2efe6' });
    for (const [hx, hz] of [[6, fz + 1.2], [7.2, fz + 1.2], [6.6, fz + 1.2]] as const) b.cyl([1.3, 1.2, 1.3], [hx, hz === fz + 1.2 && hx === 6.6 ? 1.75 : 0.6, hz], { color: '#e0c060', rot: [0, 0, 90], edge: 'soft' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.spawn('cow', 'cow', { rel: 'front', of: 'self', dist: 'close' }), A.say('Moooo!', 2, 'cow'), A.wait(2), A.remove('cow', 'fade'), A.operate('door', 'close')],
          [A.operate('loft', 'open'), A.effect('dust', { dur: 1.5 }), A.wait(1.5), A.operate('loft', 'close')],
        ],
      })
      .done();
  }),
  // A chrome kitchen tap: a curved swan-neck spout and two cross handles; turn one and water runs.
  e('faucet', 'home', 'plumbing', () => {
    const b = m('faucet', { edge: 'sharp' })
      .box([0.24, 0.02, 0.06], [0, 0.01, 0], { color: 'silver', round: 0.5 })
      .cyl([0.045, 0.14, 0.045], [0, 0.09, 0], { color: 'silver' })
      .arc([0.16, 0.2, 0.024], [0, 0.16, 0.06], { color: 'silver', rot: [0, 90, 0], arc: 180, tube: 0.18 })
      .cyl([0.028, 0.03, 0.028], [0, 0.145, 0.135], { color: 'silver' })
      .cyl([0.012, 0.18, 0.012], [0, 0.04, 0.135], { color: '#a8dcff', name: 'water', scale: 0, noInk: true });
    b.pair((s) => {
      const n = s > 0 ? 'cold' : 'hot';
      b.cyl([0.034, 0.045, 0.034], [s * 0.085, 0.04, 0], { color: 'silver' });
      b.box([0.07, 0.012, 0.012], [s * 0.085, 0.07, 0], { color: 'silver', name: n, round: 0.5 });
      b.box([0.012, 0.012, 0.07], [s * 0.085, 0.07, 0], { color: 'silver', parent: n, round: 0.5 });
      b.cyl([0.016, 0.006, 0.016], [s * 0.085, 0.078, 0], { color: s > 0 ? '#2a6ab0' : '#d6453a', parent: n });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('cold', { rot: [0, 90, 0], dur: 0.4 }), A.pose('water', { scale: 1, dur: 0.3 })), A.effect('water_spray', { dur: 2 }), A.wait(1.5)],
          [A.par(A.pose('cold', { rot: [0, 0, 0], dur: 0.4 }), A.pose('water', { scale: 0, dur: 0.3 })), A.say('Drip.', 1)],
        ],
      })
      .done();
  }),
  // A desktop fax: a sloped sheet feeder at the back, a keypad, a handset on its cradle, a little screen; a page
  // feeds out of the front when it rings.
  e('fax machine', 'tech', 'office machines', () => {
    const b = m('fax machine', { edge: 'sharp' })
      .box([0.34, 0.1, 0.28], [0, 0.05, 0], { color: '#e8e4d8', round: 0.3 })
      .box([0.24, 0.06, 0.1], [-0.03, 0.12, -0.1], { color: '#d8d4c8', round: 0.3 })
      .box([0.22, 0.01, 0.16], [-0.03, 0.17, -0.17], { color: '#9aa0a8', rot: [50, 0, 0] })
      .box([0.2, 0.012, 0.15], [-0.03, 0.18, -0.165], { color: 'white', rot: [50, 0, 0], noInk: true })
      .box([0.2, 0.004, 0.12], [-0.03, 0.06, 0.1], { color: 'white', rot: [-8, 0, 0], name: 'page', scale: 0.05 })
      .label('FAX', [0.08, 0.04], [-0.03, 0.062, 0.12], { color: 'white', rot: [-98, 0, 0], parent: 'page', depth: 0.002 })
      .box([0.06, 0.04, 0.24], [0.135, 0.12, 0.0], { color: '#3a3a40', round: 0.8, edge: 'soft', name: 'handset' })
      .box([0.08, 0.025, 0.003], [-0.02, 0.101, 0.06], { color: '#7dff9a', glow: true, name: 'screen', mover: { kind: 'light', on: false } });
    b.each(12, (i) => void b.box([0.016, 0.006, 0.014], [-0.11 + (i % 3) * 0.022, 0.102, -0.02 + Math.floor(i / 3) * 0.02], { color: '#9aa0a8' }));
    return b
      .act({
        click: [
          [A.par(A.operate('screen', 'on'), A.say('Brrring! Beeep... Screeeech!', 2.5)), A.pose('page', { scale: 1, move: [0, 0, 0.08], dur: 1.5 }), A.wait(1)],
          [A.par(A.pose('page', { scale: 0.05, move: [0, 0, 0], dur: 0.3 }), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A long white flight feather with a blue tip: it sways down like it is drifting.
  e('feather', 'aviary', 'feathers', () =>
    m('feather')
      .rod([0, 0, 0], [0.012, 0.17, 0], 0.004, 'cream', { name: 'quill', pivot: [0, 0, 0] })
      .ball([0.045, 0.13, 0.01], [0.01, 0.105, 0], { color: 'white', rot: [0, 0, -5], parent: 'quill' })
      .ball([0.03, 0.05, 0.011], [0.016, 0.15, 0], { color: '#5a9ad8', noInk: true, rot: [0, 0, -5], parent: 'quill' })
      .box([0.018, 0.003, 0.005], [-0.012, 0.07, 0.004], { color: '#e8e8e8', rot: [0, 0, 25], noInk: true, parent: 'quill' })
      .act({ click: [A.pose('quill', { rot: [0, 0, 25], dur: 0.6 }), A.pose('quill', { rot: [0, 0, -25], dur: 0.8 }), A.pose('quill', { rot: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // An ostrich-feather duster on a wooden handle: shaken, it sends up dust.
  e('feather duster', 'home', 'cleaning', () => {
    const b = m('feather duster').stick([0, 0, 0], [0, 0.42, 0], 0.03, 'darkwood', { edge: 'sharp', name: 'handle' }).cyl([0.04, 0.05, 0.04], [0, 0.44, 0], { color: 'brass', edge: 'sharp' });
    b.ball([0.24, 0.3, 0.24], [0, 0.62, 0], { color: '#5a4030' });
    for (const [px, pz] of around(7, 0.09)) b.ball([0.1, 0.26, 0.08], [px, 0.6, pz], { color: '#7a5a40', rot: [pz * 220, 0, -px * 220] });
    for (const [px, pz] of around(5, 0.05, 0.5)) b.ball([0.08, 0.2, 0.07], [px, 0.74, pz], { color: '#4a3428', rot: [pz * 200, 0, -px * 200] });
    return b.act({ click: [A.par(A.anim('shake', 3), A.effect('dust', { dur: 1.5 }), A.say('Swish swish!', 1.5))] }).done();
  }),
  // A felt fedora: a snap brim, a teardrop crown pinched at the front with a centre dent, a grosgrain band.
  e('fedora', 'wardrobe', 'hats', () =>
    m('fedora')
      .cyl([0.34, 0.012, 0.31], [0, 0.03, 0], { color: '#6a5a4a', name: 'hat' })
      .cyl([0.33, 0.012, 0.3], [0, 0.022, -0.01], { color: '#6a5a4a', parent: 'hat', rot: [-8, 0, 0], noInk: true })
      .cyl([0.2, 0.1, 0.18], [0, 0.085, 0], { color: '#6a5a4a', taper: 0.88, parent: 'hat' })
      .ball([0.19, 0.07, 0.17], [0, 0.135, 0], { color: '#6a5a4a', parent: 'hat' })
      .box([0.035, 0.03, 0.12], [0, 0.16, -0.01], { color: '#4a3e34', noInk: true, round: 0.8, parent: 'hat' })
      .cyl([0.205, 0.03, 0.185], [0, 0.05, 0], { color: '#1e1e1e', parent: 'hat' })
      .box([0.03, 0.03, 0.01], [0.07, 0.05, 0.085], { color: '#1e1e1e', rot: [0, 30, 0], parent: 'hat' })
      .act({ click: [A.pose('hat', { move: [0, 0.06, 0], rot: [-20, 0, 0], dur: 0.35 }), A.say('*tip*', 1.2), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 })] })
      .done(),
  ),
  // A pair of bare feet standing, ankles and all: the toes wiggle.
  e('feet', 'clinic', 'body parts', () => {
    const b = m('feet');
    b.pair((s) => {
      const n = s > 0 ? 'toesL' : 'toesR';
      b.ball([0.095, 0.065, 0.22], [s * 0.065, 0.034, 0.02], { color: 'skin2' })
        .cyl([0.065, 0.14, 0.07], [s * 0.065, 0.12, -0.04], { color: 'skin2', taper: 0.9 })
        .ball([0.05, 0.04, 0.05], [s * 0.095, 0.075, -0.05], { color: 'skin2' })
        .ball([0.03, 0.025, 0.03], [s * 0.065, 0.04, 0.12], { color: 'skin2', name: n, pivot: [s * 0.065, 0.03, 0.11] });
      b.each(5, (i) => void b.ball(0.03 - i * 0.003, [s * (0.04 + i * 0.015), 0.022 - i * 0.002, 0.135 - i * 0.012], { color: 'skin2', parent: n }));
      b.ball([0.016, 0.006, 0.012], [s * 0.04, 0.035, 0.148], { color: '#f2c4bc', noInk: true, parent: n });
    });
    const w = (r: number) => A.par(A.pose('toesL', { rot: [r, 0, 0], dur: 0.2 }), A.pose('toesR', { rot: [r, 0, 0], dur: 0.2 }));
    return b.act({ click: [w(-25), w(5), w(-25), w(0), A.say('Wiggle wiggle!', 1.5)] }).done();
  }),
  // A fairground big wheel (18 m): twin rims on a hub carried by two A-frames, ten cabins that stay level as it
  // turns (each counter-turns on its hanger), lights on the rim, a boarding platform and ticket booth.
  e('ferris wheel', 'places', 'fairground', () => {
    const b = m('ferris wheel', { edge: 'sharp' });
    const C = 9.6, R = 7.6, rim = 0.85;
    b.box([5, 0.6, 3.6], [0, 0.3, 1.2], { color: '#9a9590', round: 0.05 })
      .each(3, (i) => void b.box([1.6, 0.2, 0.4], [3.4, 0.1 + i * 0.2, 2.4 - i * 0.4], { color: '#9a9590' }))
      .box([1.6, 2.4, 1.4], [-4.0, 1.2, 3.2], { color: '#e8d24a', round: 0.1 })
      .box([1.8, 0.25, 1.6], [-4.0, 2.5, 3.2], { color: '#d6453a', round: 0.2 })
      .box([1.0, 0.8, 0.04], [-4.0, 1.5, 3.92], { color: '#2a2726' })
      .label('TICKETS', [1.4, 0.35], [-4.0, 2.15, 3.93], { color: '#d6453a', depth: 0.02 });
    for (const z of [1.5, -1.5]) {
      b.pair((s) => void b.rod([s * 4.6, 0, z * 1.25], [0, C, z], 0.4, '#e8e2d6'));
      b.stick([-2.6, 4.2, z * 1.12], [2.6, 4.2, z * 1.12], 0.2, '#e8e2d6');
      b.box([0.8, 0.5, 0.8], [4.6, 0.25, z * 1.25], { color: '#7a7570' }).box([0.8, 0.5, 0.8], [-4.6, 0.25, z * 1.25], { color: '#7a7570' });
    }
    b.cyl([0.5, 3.4, 0.5], [0, C, 0], { color: '#9aa0a8', rot: [90, 0, 0] })
      .cyl([1.4, 2.0, 1.4], [0, C, 0], { color: '#d6453a', rot: [90, 0, 0], name: 'ring', mover: { kind: 'spin', axis: 'z', amount: 18 } });
    for (const z of [rim, -rim]) {
      b.torus([R * 2 + 0.3, R * 2 + 0.3, 0.25], [0, C, z], { color: 'white', tube: 0.025, parent: 'ring' });
      b.torus([R * 1.2, R * 1.2, 0.18], [0, C, z], { color: '#d6453a', tube: 0.03, parent: 'ring' });
      for (let i = 0; i < 10; i++) {
        const a = ((i + 0.5) / 10) * Math.PI * 2;
        b.rod([0, C, z * 0.9], [Math.sin(a) * R, C + Math.cos(a) * R, z], 0.1, 'white', { parent: 'ring' });
      }
    }
    const cols = ['#d6453a', '#f2c14e', '#4e8fd6', '#55b05f', '#f0923b', '#8a5fc4', '#ef6f9a', '#3fa7a0', '#e8d24a', '#4e8fd6'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, px = Math.sin(a) * R, py = C + Math.cos(a) * R;
      const n = `cab${i}`;
      b.stick([px, py, -rim], [px, py, rim], 0.12, '#9aa0a8', { parent: 'ring' });
      b.stick([px, py, 0], [px, py - 0.7, 0], 0.08, '#9aa0a8', { name: n, parent: 'ring', pivot: [px, py, 0], mover: { kind: 'spin', axis: 'z', amount: -18 } });
      b.box([1.3, 1.1, 1.25], [px, py - 1.35, 0], { color: cols[i], round: 0.25, parent: n });
      b.box([1.32, 0.42, 1.27], [px, py - 1.15, 0], { color: '#2a3040', round: 0.2, parent: n, noInk: true });
      b.dome([1.4, 0.35, 1.35], [px, py - 0.82, 0], { color: 'white', parent: n });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      b.ball(0.35, [Math.sin(a) * (R + 0.2), C + Math.cos(a) * (R + 0.2), rim + 0.2], { color: '#fff2a0', glow: true, parent: 'ring', name: `light${i}`, mover: { kind: 'light', on: false } });
    }
    return b
      .act({
        click: [
          [A.par(A.operate('ring', 'on'), A.operate('cab', 'on'), A.operate('light', 'on'), A.say('Wheeee!', 2))],
          [A.par(A.operate('ring', 'off'), A.operate('cab', 'off'), A.operate('light', 'off'))],
        ],
      })
      .done();
  }),
  // A sack of garden fertilizer with a folded-over top and a scoop: tip it and a flower springs up.
  e('fertilizer', 'garden', 'garden supplies', () =>
    m('fertilizer')
      .box([0.34, 0.46, 0.16], [0, 0.23, 0], { color: '#5a8a3a', round: 0.45, name: 'sack' })
      .box([0.33, 0.08, 0.08], [0, 0.47, -0.02], { color: '#4a7a2e', round: 0.4, rot: [25, 0, 0], parent: 'sack' })
      .label('FERTILIZER', [0.26, 0.06], [0, 0.32, 0.085], { color: '#f2c14e', parent: 'sack', depth: 0.004 })
      .label('10-10-10', [0.14, 0.04], [0, 0.25, 0.085], { color: 'white', parent: 'sack', depth: 0.004 })
      .rod([0, 0.1, 0.082], [0, 0.18, 0.084], 0.012, '#3f7a2f', { noInk: true, parent: 'sack' })
      .ball([0.05, 0.025, 0.008], [0.025, 0.17, 0.086], { color: '#55b05f', noInk: true, parent: 'sack' })
      .ball([0.05, 0.025, 0.008], [-0.025, 0.15, 0.086], { color: '#55b05f', noInk: true, parent: 'sack' })
      .ball([0.2, 0.045, 0.14], [0.2, 0.022, 0.12], { color: '#4a3a2a' })
      .box([0.07, 0.04, 0.1], [0.22, 0.04, 0.14], { color: '#d6453a', rot: [0, 30, 0], edge: 'sharp', round: 0.3 })
      .act({ click: [A.pose('sack', { rot: [0, 0, -20], dur: 0.4 }), A.effect('dust', { dur: 1 }), A.pose('sack', { rot: [0, 0, 0], dur: 0.4 }), A.spawn('sprout', 'flower', { rel: 'front', of: 'self', dist: 'close' }), A.effect('sparkle', { id: 'sprout', dur: 1 }), A.wait(2), A.remove('sprout', 'sink')] })
      .done(),
  ),
  // A block of feta on a dish with olives and oregano: a crumbly cube breaks off.
  e('feta', 'food', 'cheese', () =>
    m('feta')
      .cyl([0.2, 0.014, 0.2], [0, 0.007, 0], { color: '#5a8ab8', edge: 'sharp' })
      .box([0.1, 0.055, 0.075], [-0.015, 0.042, 0], { color: '#f6f4ec', round: 0.12, name: 'block' })
      .box([0.03, 0.028, 0.03], [0.045, 0.042, 0.02], { color: '#f6f4ec', round: 0.25, name: 'cube', parent: 'block', piece: true })
      .box([0.022, 0.02, 0.022], [0.06, 0.024, -0.035], { color: '#f6f4ec', round: 0.3 })
      .ball([0.024, 0.02, 0.02], [-0.045, 0.024, 0.065], { color: '#2a2030' })
      .ball([0.022, 0.018, 0.02], [-0.065, 0.024, 0.045], { color: '#3a5a2a' })
      .ball(0.008, [0.0, 0.072, 0.01], { color: '#3f7a2f', noInk: true })
      .ball(0.006, [-0.03, 0.071, -0.02], { color: '#3f7a2f', noInk: true })
      .act({ click: [[A.detach('cube', 'crumb'), A.say('Crumble!', 1)], [A.reattach('cube')]] })
      .done(),
  ),
  // A three-lobed spinner balanced on a fingertip: it spins.
  e('fidget spinner', 'toys', 'fidget toys', () => {
    const b = m('fidget spinner')
      .capsule([0.022, 0.09, 0.022], [0, 0.045, 0], { color: 'skin2' })
      .box([0.016, 0.004, 0.01], [0, 0.088, 0.008], { color: '#f2c4bc', noInk: true })
      .cyl([0.022, 0.012, 0.022], [0, 0.098, 0], { color: 'silver', name: 'fan', mover: { kind: 'spin', axis: 'y', amount: 1200 }, edge: 'sharp' });
    for (let i = 0; i < 3; i++) {
      const a = ((90 + i * 120) * Math.PI) / 180, px = Math.cos(a) * 0.03, pz = Math.sin(a) * 0.03;
      b.stick([0, 0.098, 0], [px, 0.098, pz], 0.016, '#2a6ab0', { parent: 'fan', edge: 'sharp' })
        .cyl([0.032, 0.011, 0.032], [px, 0.098, pz], { color: '#2a6ab0', parent: 'fan', edge: 'sharp' })
        .cyl([0.018, 0.013, 0.018], [px, 0.098, pz], { color: 'silver', parent: 'fan', edge: 'sharp' });
    }
    return b.act({ click: [A.operate('fan', 'on'), A.say('Whirrrrr...', 2), A.wait(2.5), A.operate('fan', 'off')] }).done();
  }),
  // An American-football goalpost: a padded gooseneck post, the crossbar at 3.05 m, uprights 5.6 m apart rising
  // to 11 m with ribbons on top; a field goal sails through.
  e('field goalpost', 'sports', 'fields', () => {
    const b = m('field goalpost', { edge: 'sharp' });
    const Y = '#f2d21e';
    b.cyl([0.5, 2.0, 0.5], [0, 1.0, -1.6], { color: '#2a4a8a', edge: 'soft' })
      .stick([0, 0, -1.6], [0, 3.0, -1.6], 0.28, Y)
      .rod([0, 3.0, -1.6], [0, 3.05, 0], 0.26, Y)
      .stick([-2.85, 3.05, 0], [2.85, 3.05, 0], 0.2, Y)
      .box([2.0, 0.02, 0.15], [0, 0.01, 0.3], { color: 'white', round: 0 });
    b.pair((s) => {
      b.stick([s * 2.8, 3.05, 0], [s * 2.8, 11, 0], 0.15, Y);
      b.box([0.1, 1.0, 0.03], [s * 2.8, 10.4, 0.09], { color: '#f0821e', name: s > 0 ? 'ribbonL' : 'ribbonR', pivot: [s * 2.8, 10.95, 0.09] });
    });
    return b
      .act({
        click: [
          [A.spawn('ball', 'football', { rel: 'front', of: 'self', dist: 'near' }), A.move('ball', { rel: 'behind', of: 'self', dist: 'near' }, { speed: 'fly', style: 'fly' }), A.par(A.say("It's good!", 2, ''), A.pose('ribbonL', { rot: [0, 0, 20] }), A.pose('ribbonR', { rot: [0, 0, -20] })), A.remove('ball', 'pop'), A.par(A.pose('ribbonL', { rot: [0, 0, 0] }), A.pose('ribbonR', { rot: [0, 0, 0] }))],
        ],
      })
      .done();
  }),
  // A purple fig and a half cut open to its pink, seedy flesh: the halves come apart and back.
  e('fig', 'food', 'fruit', () =>
    m('fig')
      .ball([0.05, 0.05, 0.05], [-0.03, 0.025, 0], { color: '#5a2050' })
      .cone([0.04, 0.035, 0.04], [-0.03, 0.06, 0], { color: '#5a2050', taper: 0.25 })
      .rod([-0.03, 0.075, 0], [-0.026, 0.09, 0], 0.006, '#5a3a22')
      .ball([0.05, 0.065, 0.025], [0.035, 0.032, -0.005], { color: '#5a2050', name: 'half' })
      .ball([0.042, 0.054, 0.004], [0.035, 0.032, 0.007], { color: '#e0607a', parent: 'half' })
      .ball([0.022, 0.032, 0.004], [0.035, 0.03, 0.009], { color: '#f4c0a0', noInk: true, parent: 'half' })
      .act({ click: [[A.pose('half', { move: [0.03, 0, 0.02], rot: [0, 0, -15], dur: 0.4 })], [A.pose('half', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A fig tree (5.5 m), wide and low-branched, hung with purple figs: one drops and comes back.
  e('fig tree', 'garden', 'trees', () =>
    tree('fig tree', { h: 5.5, trunk: '#8a8478', crown: '#3f7a2f', crown2: '#4f8a3a', w: 5.2, fruit: '#5a2050', nf: 10, fs: 0.16, split: 0.32 })
      .act({ click: [[A.par(A.pose('top', { rot: [0, 0, 4], dur: 0.4 }), A.say('Rustle...', 1.5)), A.detach('fruit2', 'fig'), A.pose('top', { rot: [0, 0, 0], dur: 0.4 })], [A.reattach('fruit2')]] })
      .done(),
  ),
  // A single-seat jet fighter at real size (18 m long, 10 m span, 5 m to the fin tip): a lofted fuselage with a
  // belly intake, a bubble canopy hinged at the back, cropped-delta wings with wingtip missiles, tailplanes and
  // a swept fin, tricycle gear, a boarding ladder, and an afterburner that lights.
  e('fighter jet', 'garage', 'aircraft', () => {
    const b = m('fighter jet', { view: 'side' });
    const g = '#8a96a0', g2 = '#76828c';
    b.loft([1.5, 1.7, 15.5], [0, 2.1, 0.4], [[0, 0.62, 0.6, 0], [0.08, 0.82, 0.78, 0], [0.35, 1, 1, 0], [0.6, 0.92, 0.95, 0.03], [0.8, 0.62, 0.68, 0.06], [0.93, 0.36, 0.42, 0.04], [1, 0.05, 0.06, 0.02]], { color: g, boxy: 0.3, name: 'fuselage' })
      .loft([1.15, 0.85, 4.2], [0, 1.3, 2.4], [[0, 0.5, 0.5, 0.2], [0.5, 0.95, 0.95, 0], [1, 1, 1, 0]], { color: g, boxy: 0.6 })
      .cyl([1.0, 0.06, 0.7], [0, 1.3, 4.5], { color: '#1e1e1e', rot: [90, 0, 0], edge: 'sharp' })
      .loft([2.6, 0.22, 5.2], [0, 2.15, 2.6], [[0, 1, 1, 0], [1, 0.3, 1, 0]], { color: g })
      .loft([10, 0.3, 6.4], [0, 2.05, -1.9], [[0, 1, 0.6, 0], [0.18, 1, 0.9, 0], [1, 0.14, 1, 0]], { color: g2, boxy: 0.5, edge: 'sharp' })
      .loft([5.6, 0.2, 2.6], [0, 2.0, -6.6], [[0, 1, 0.8, 0], [0.3, 1, 1, 0], [1, 0.28, 1, 0]], { color: g2, boxy: 0.5, edge: 'sharp' })
      .loft([0.24, 5.6, 3.9], [0, 2.6, -5.7], [[0, 0.6, 0.95, 0], [0.25, 1, 1, 0], [1, 1, 0.1, 0]], { color: g2, cut: 'top', boxy: 0.5, edge: 'sharp' })
      .cyl([1.0, 1.1, 1.0], [0, 2.1, -7.75], { color: '#4a4d52', rot: [90, 0, 0], taper: 0.85, edge: 'sharp' })
      .cyl([0.75, 0.05, 0.75], [0, 2.1, -8.3], { color: '#1e1e1e', rot: [90, 0, 0], edge: 'sharp' })
      .cone([0.8, 2.6, 0.8], [0, 2.1, -9.6], { color: '#ff9a3a', rot: [-90, 0, 0], glow: true, name: 'flame', scale: 0 })
      .ball([0.88, 0.95, 3.4], [0, 2.8, 4.3], { color: '#6f9fc0', name: 'canopy', pivot: [0, 2.75, 2.65], mover: { kind: 'swing', axis: 'x', amount: -32 }, edge: 'sharp' })
      .box([0.5, 0.6, 0.3], [0, 2.85, 3.3], { color: '#2a2726', round: 0.3 })
      .star(0.5, [0, 4.0, -6.5], { color: '#2a3a5a', rot: [0, 90, 0] })
      .label('AF 042', [1.4, 0.3], [0.77, 2.2, -2.6], { color: g, rot: [0, 90, 0], depth: 0.01 });
    // wingtip missiles
    b.pair((s) => {
      b.cyl([0.14, 3.0, 0.14], [s * 5.1, 2.05, -1.9], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
        .cone([0.14, 0.4, 0.14], [s * 5.1, 2.05, -0.2], { color: '#9aa0a8', rot: [90, 0, 0], edge: 'sharp' })
        .box([0.4, 0.03, 0.3], [s * 5.1, 2.05, -3.2], { color: '#9aa0a8', edge: 'sharp' })
        .box([0.03, 0.4, 0.3], [s * 5.1, 2.05, -3.2], { color: '#9aa0a8', edge: 'sharp' });
    });
    // gear
    b.stick([0, 1.3, 5.6], [0, 0.28, 5.6], 0.1, '#c8ccd2', { edge: 'sharp' });
    wheel(b, 'wheelNose', [0, 0.28, 5.6], 0.56, 0.2, '#c8ccd2');
    b.pair((s) => {
      b.stick([s * 0.7, 1.4, -1.5], [s * 1.2, 0.38, -1.5], 0.13, '#c8ccd2', { edge: 'sharp' });
      wheel(b, s > 0 ? 'wheelL' : 'wheelR', [s * 1.22, 0.38, -1.5], 0.76, 0.26, '#c8ccd2');
    });
    // boarding ladder on the left of the cockpit
    b.pair((s) => void b.stick([-0.95, 0, 3.7 + s * 0.2], [-0.82, 2.55, 3.7 + s * 0.2], 0.05, '#f2c14e', { edge: 'sharp' }));
    b.each(6, (i) => void b.stick([-0.94 + i * 0.022, 0.3 + i * 0.4, 3.5], [-0.94 + i * 0.022, 0.3 + i * 0.4, 3.9], 0.04, '#f2c14e', { edge: 'sharp' }));
    return b
      .act({
        click: [
          [A.operate('canopy', 'open'), A.say('Hisssss...', 1.5)],
          [A.operate('canopy', 'close'), A.pose('flame', { scale: 1, dur: 0.3 }), A.par(A.effect('smoke', { dur: 2.5 }), A.anim('shake', 3), A.say('ROOOAAARRR!', 2.5)), A.wait(1), A.pose('flame', { scale: 0, dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A Second World War propeller fighter at real size (9.5 m long, 11 m span), sitting tail-down on its tail
  // wheel: a lofted fuselage, elliptical wings with roundels, a sliding bubble canopy, exhaust stacks, a belly
  // radiator, and a three-bladed propeller that spins up.
  e('fighter plane', 'garage', 'aircraft', () => {
    const b = m('fighter plane', { view: 'side' });
    const o = '#5a6a3a', o2 = '#4e5c32';
    b.loft([1.15, 1.55, 9.0], [0, 1.85, 0], [[0, 0.1, 0.3, -0.38], [0.25, 0.5, 0.6, -0.22], [0.55, 0.92, 1, -0.05], [0.85, 1, 0.95, 0.02], [0.97, 0.85, 0.8, 0.03], [1, 0.62, 0.6, 0.03]], { color: o, boxy: 0.2, name: 'fuselage' })
      .loft([11.2, 0.36, 2.6], [0, 1.45, 1.1], [[0, 0.55, 0.5, 0], [0.35, 1, 1, 0], [0.7, 0.93, 0.9, 0], [1, 0.42, 0.6, 0]], { color: o2, boxy: 0.3, edge: 'sharp' })
      .loft([3.8, 0.16, 1.3], [0, 1.4, -3.9], [[0, 0.6, 0.6, 0], [0.4, 1, 1, 0], [1, 0.5, 0.8, 0]], { color: o2, edge: 'sharp' })
      .loft([0.16, 3.2, 1.7], [0, 1.45, -3.85], [[0, 0.5, 0.75, 0], [0.35, 1, 1, 0], [1, 1, 0.15, 0]], { color: o2, cut: 'top', edge: 'sharp' })
      .loft([0.7, 0.55, 1.9], [0, 1.15, -0.2], [[0, 0.5, 0.5, 0.1], [0.5, 1, 1, 0], [1, 0.95, 0.9, 0]], { color: o })
      .ball([0.66, 0.78, 1.7], [0, 2.55, 0.5], { color: '#7fb0d0', name: 'canopy', mover: { kind: 'slide', axis: 'z', amount: -0.7, on: true }, edge: 'sharp' })
      .box([0.68, 0.06, 1.2], [0, 2.6, 0.5], { color: '#3a3633', parent: 'canopy', edge: 'sharp' })
      .cyl([0.62, 0.06, 0.62], [0, 1.94, 4.53], { color: '#3a3633', rot: [90, 0, 0], name: 'propeller', mover: { kind: 'spin', axis: 'z', amount: 1100 }, edge: 'sharp' })
      .cone([0.5, 0.65, 0.5], [0, 1.94, 4.85], { color: '#d6453a', rot: [90, 0, 0], parent: 'propeller' });
    for (let i = 0; i < 3; i++) {
      const a = (i * 120 * Math.PI) / 180;
      b.box([0.2, 1.55, 0.06], [Math.sin(a) * 0.8, 1.94 + Math.cos(a) * 0.8, 4.6], { color: '#2a2726', rot: [0, 0, (-i * 120)], round: 0.8, parent: 'propeller', edge: 'sharp' });
    }
    b.pair((s) => {
      for (let i = 0; i < 3; i++) b.box([0.12, 0.08, 0.16], [s * 0.53, 2.05, 3.1 + i * 0.3], { color: '#3a3633', edge: 'sharp' });
      b.cyl([0.9, 0.02, 0.9], [s * 3.6, 1.64, 1.2], { color: '#2a4a8a', noInk: true });
      b.cyl([0.55, 0.026, 0.55], [s * 3.6, 1.645, 1.2], { color: 'white', noInk: true });
      b.cyl([0.28, 0.03, 0.28], [s * 3.6, 1.65, 1.2], { color: '#c4202b', noInk: true });
      b.stick([s * 1.55, 1.35, 1.6], [s * 1.6, 0.36, 1.8], 0.1, '#9aa0a8', { edge: 'sharp' });
      wheel(b, s > 0 ? 'wheelL' : 'wheelR', [s * 1.62, 0.36, 1.8], 0.72, 0.2, '#9aa0a8');
    });
    b.stick([0, 1.2, -3.9], [0, 0.17, -4.05], 0.06, '#9aa0a8', { edge: 'sharp' });
    wheel(b, 'wheelTail', [0, 0.17, -4.05], 0.34, 0.12, '#9aa0a8');
    b.box([0.04, 0.5, 0.5], [0.58, 1.75, -1.8], { color: '#d8d4cc', edge: 'sharp' })
      .label('7', [0.3, 0.4], [0.6, 1.75, -1.8], { color: '#d8d4cc', rot: [0, 90, 0], depth: 0.01 });
    return b
      .act({
        click: [
          [A.operate('canopy', 'close'), A.operate('propeller', 'on'), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Brrrrrrrm!', 2))],
          [A.operate('propeller', 'off'), A.say('Phut... phut...', 1.5), A.operate('canopy', 'open')],
        ],
      })
      .done();
  }),
  // A porcelain ballerina on a music-box base: she turns to a tinkling tune.
  e('figurine', 'home', 'decor', () => {
    const b = m('figurine')
      .cyl([0.08, 0.025, 0.08], [0, 0.0125, 0], { color: '#d9b24a', edge: 'sharp' })
      .cyl([0.07, 0.006, 0.07], [0, 0.028, 0], { color: '#f2e6c8', edge: 'sharp' })
      .rod([0.004, 0.03, 0], [0.003, 0.065, 0], 0.01, '#f6e2d0', { name: 'dancer', pivot: [0, 0.03, 0] })
      .rod([-0.006, 0.05, 0], [-0.03, 0.06, -0.012], 0.009, '#f6e2d0', { parent: 'dancer' })
      .cone([0.075, 0.025, 0.075], [0, 0.072, 0], { color: '#f2a0b8', taper: 0.3, parent: 'dancer' })
      .cyl([0.02, 0.035, 0.016], [0, 0.098, 0], { color: '#f2a0b8', taper: 0.75, parent: 'dancer' })
      .cyl([0.008, 0.01, 0.008], [0, 0.12, 0], { color: '#f6e2d0', parent: 'dancer' })
      .ball(0.022, [0, 0.135, 0], { color: '#f6e2d0', parent: 'dancer' })
      .ball(0.012, [0, 0.15, -0.006], { color: '#6a4632', parent: 'dancer' })
      .arc([0.06, 0.05, 0.007], [0, 0.135, 0], { color: '#f6e2d0', arc: 220, tube: 0.12, parent: 'dancer' });
    return b.act({ click: [A.par(A.pose('dancer', { rot: [0, 360, 0], dur: 2.5 }), A.say('♪ Tinkle tinkle ♪', 2.5)), A.pose('dancer', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A flat bastard file with a wooden handle and a brass ferrule.
  e('file (tool)', 'workshop', 'hand tools', () => {
    const b = m('file (tool)', { edge: 'sharp' })
      .capsule([0.03, 0.1, 0.03], [0, 0.05, 0], { color: '#a8743e', edge: 'soft' })
      .cyl([0.032, 0.014, 0.032], [0, 0.104, 0], { color: 'brass' })
      .box([0.022, 0.18, 0.007], [0, 0.2, 0], { color: '#7a7f86', round: 0.1 })
      .box([0.014, 0.025, 0.004], [0, 0.3, 0], { color: '#7a7f86', round: 0.3 });
    b.each(9, (i) => void b.box([0.022, 0.002, 0.002], [0, 0.125 + i * 0.018, 0.004], { color: '#5a5f66', rot: [0, 0, 30], noInk: true }));
    return b.act({ click: [A.par(A.anim('shake', 3), A.effect('dust', { dur: 1 }), A.say('Rasp, rasp', 1.5))] }).done();
  }),
  // A four-drawer steel filing cabinet: label holders, recessed handles; the top drawer rolls out on its runners.
  e('filing cabinet', 'study', 'office furniture', () => {
    const b = m('filing cabinet', { edge: 'sharp' }).box([0.47, 1.32, 0.62], [0, 0.66, 0], { color: '#8a929a', round: 0.04 });
    b.box([0.47, 0.04, 0.6], [0, 0.02, 0], { color: '#5a5f66' });
    b.each(4, (i) => {
      const y = 0.2 + i * 0.31, n = `drawer${i}`;
      b.box([0.44, 0.29, 0.03], [0, y, 0.315], { color: '#9aa2aa', round: 0.1, name: n, mover: { kind: 'slide', axis: 'z', amount: 0.45 } })
        .box([0.4, 0.26, 0.5], [0, y, 0.07], { color: '#7a828a', parent: n, round: 0.02 })
        .box([0.16, 0.035, 0.03], [0, y + 0.03, 0.34], { color: 'silver', parent: n, round: 0.4 })
        .box([0.1, 0.05, 0.01], [0, y + 0.09, 0.334], { color: 'white', noInk: true, parent: n });
    });
    b.socket('drawer', [0, 1.13, 0.25], 'inside', { part: 'drawer3', size: 0.35 });
    return b.act({ click: [[A.operate('drawer3', 'out'), A.say('Rrrrrr...', 1)], [A.operate('drawer3', 'in'), A.say('Clunk!', 1)]] }).done();
  }),
  // A box of cling film with its serrated cutting edge: a sheet pulls out and tears off.
  e('film (material)', 'kitchen', 'kitchen supplies', () =>
    m('film (material)', { edge: 'sharp' })
      .box([0.32, 0.06, 0.06], [0, 0.03, 0], { color: '#2a5ab0', round: 0.15 })
      .box([0.32, 0.015, 0.06], [0, 0.068, -0.012], { color: '#3a6ac0', round: 0.2, rot: [-12, 0, 0] })
      .cyl([0.045, 0.3, 0.045], [0, 0.03, 0], { color: '#e8f4fa', rot: [0, 0, 90], noInk: true })
      .box([0.3, 0.004, 0.006], [0, 0.06, 0.03], { color: 'silver' })
      .label('CLING WRAP', [0.18, 0.035], [-0.03, 0.03, 0.032], { color: '#2a5ab0', depth: 0.003 })
      .box([0.28, 0.003, 0.14], [0, 0.04, 0.1], { color: '#d8eef6', rot: [-20, 0, 0], name: 'sheet', pivot: [0, 0.058, 0.032], noInk: true })
      .act({ click: [A.pose('sheet', { move: [0, 0, 0.08], dur: 0.6 }), A.say('Rrrrip!', 1), A.pose('sheet', { move: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A 35 mm film reel on a projector arm: an aluminium spool with five windows, film wound on it, a leader
  // trailing off; it turns with a clatter.
  e('film reel', 'tech', 'cinema', () => {
    const b = m('film reel', { edge: 'sharp' })
      .box([0.14, 0.03, 0.1], [0, 0.015, 0], { color: '#3a3633', round: 0.3 })
      .stick([0, 0.03, -0.02], [0, 0.2, -0.02], 0.025, '#3a3633')
      .cyl([0.34, 0.012, 0.34], [0, 0.2, 0.02], { color: '#c8ccd2', rot: [90, 0, 0], name: 'reel', pivot: [0, 0.2, 0.02], mover: { kind: 'spin', axis: 'z', amount: 300 } })
      .cyl([0.34, 0.012, 0.34], [0, 0.2, 0.065], { color: '#c8ccd2', rot: [90, 0, 0], parent: 'reel' })
      .cyl([0.24, 0.04, 0.24], [0, 0.2, 0.0425], { color: '#2a2420', rot: [90, 0, 0], parent: 'reel' })
      .cyl([0.05, 0.06, 0.05], [0, 0.2, 0.0425], { color: 'silver', rot: [90, 0, 0], parent: 'reel' });
    for (const [px, py] of around(5, 0.105)) b.cyl([0.05, 0.016, 0.05], [px, 0.2 + py, 0.075], { color: '#3a3a40', rot: [90, 0, 0], parent: 'reel', noInk: true });
    b.box([0.035, 0.18, 0.003], [0.13, 0.1, 0.04], { color: '#2a2420', rot: [0, 0, 20] });
    return b.act({ click: [A.operate('reel', 'on'), A.say('Clickety-clack...', 2.5), A.wait(2.5), A.operate('reel', 'off')] }).done();
  }),
  // A shark's dorsal fin cutting through a patch of sea: it circles.
  e('fin (organic)', 'sea', 'sea animal parts', () =>
    m('fin (organic)')
      .cyl([1.4, 0.03, 1.1], [0, 0.015, 0], { color: '#3f7fb8', edge: 'sharp' })
      .torus([0.5, 0.5, 0.05], [0, 0.03, 0], { color: '#9fd0f0', rot: [90, 0, 0], noInk: true, tube: 0.1 })
      .loft([0.08, 0.84, 0.5], [0, 0.02, 0], [[0, 0.5, 1, 0], [0.3, 1, 0.95, 0], [1, 1, 0.1, 0]], { color: '#5a6a7a', cut: 'top', name: 'fin' })
      .ball([0.4, 0.08, 0.14], [0, 0.03, 0.05], { color: '#5a6a7a', parent: 'fin' })
      .act({ click: [A.pose('fin', { move: [0.35, 0, 0], rot: [0, 90, 0], dur: 0.8 }), A.effect('water_spray', { dur: 1 }), A.pose('fin', { move: [0, 0, -0.3], rot: [0, 180, 0], dur: 0.8 }), A.pose('fin', { move: [-0.35, 0, 0], rot: [0, 270, 0], dur: 0.8 }), A.pose('fin', { move: [0, 0, 0], rot: [0, 360, 0], dur: 0.8 }), A.pose('fin', { rot: [0, 0, 0], dur: 0 }), A.say('Dun-dun... dun-dun...', 2)] })
      .done(),
  ),
  // A fist with its index finger raised: it wags.
  e('finger', 'clinic', 'body parts', () =>
    m('finger')
      .box([0.08, 0.06, 0.06], [0, 0.03, 0], { color: 'skin2', round: 0.7 })
      .capsule([0.024, 0.05, 0.03], [-0.04, 0.04, 0.025], { color: 'skin2', rot: [0, 0, 40] })
      .capsule([0.022, 0.09, 0.022], [0.022, 0.1, 0.012], { color: 'skin2', name: 'index', pivot: [0.022, 0.058, 0.012] })
      .box([0.015, 0.018, 0.006], [0.022, 0.135, 0.022], { color: '#f4c4c0', round: 0.5, parent: 'index' })
      .act({ click: [A.say('Tsk tsk!', 1.5), A.pose('index', { rot: [0, 0, 18], dur: 0.2 }), A.pose('index', { rot: [0, 0, -18], dur: 0.25 }), A.pose('index', { rot: [0, 0, 18], dur: 0.25 }), A.pose('index', { rot: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A red knit fingerless glove on a hand: the bare fingertips wiggle out of it.
  e('fingerless glove', 'wardrobe', 'gloves', () => {
    const b = m('fingerless glove')
      .box([0.1, 0.06, 0.04], [0, 0.03, 0], { color: '#8a2a2a', round: 0.4 })
      .box([0.095, 0.08, 0.034], [0, 0.1, 0], { color: '#c84040', round: 0.5 })
      .capsule([0.026, 0.05, 0.026], [-0.055, 0.11, 0.005], { color: '#c84040', rot: [0, 0, 40] })
      .ball(0.022, [-0.072, 0.132, 0.005], { color: 'skin2' })
      .box([0.09, 0.04, 0.03], [0, 0.16, 0], { color: '#c84040', round: 0.5, name: 'fingers', pivot: [0, 0.14, 0] });
    b.each(4, (i) => void b.capsule([0.017, 0.04, 0.017], [-0.032 + i * 0.021, 0.19, 0], { color: 'skin2', parent: 'fingers' }));
    b.each(5, (i) => void b.box([0.098, 0.004, 0.036], [0, 0.07 + i * 0.012, 0], { color: '#a83434', noInk: true }));
    return b.act({ click: [A.pose('fingers', { rot: [-30, 0, 0], dur: 0.25 }), A.pose('fingers', { rot: [10, 0, 0], dur: 0.25 }), A.pose('fingers', { rot: [-30, 0, 0], dur: 0.25 }), A.pose('fingers', { rot: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // A fingerprint on a scanner pad that lights up green and beeps.
  e('fingerprint', 'ideas', 'symbols', () => {
    const b = m('fingerprint', { edge: 'sharp' })
      .box([0.13, 0.16, 0.04], [0, 0.08, -0.02], { color: '#3a3d42', round: 0.2 })
      .box([0.1, 0.12, 0.004], [0, 0.085, 0.001], { color: '#1e5a30', glow: true, name: 'scan', mover: { kind: 'light', on: false } });
    for (let i = 0; i < 5; i++) {
      const w = 0.075 - i * 0.014, h = w * 1.3;
      b.torus([w, h, 0.003], [0, 0.085 - i * 0.003, 0.005], { color: '#e8f2ea', tube: 0.0035 / (w / 2), noInk: true });
    }
    return b.act({ click: [A.operate('scan', 'on'), A.say('Beep! Match found.', 2), A.wait(1), A.operate('scan', 'off')] }).done();
  }),
  // A painted chequered finish line across a running lane, a cone at each end and a ribbon stretched between
  // them that breaks when the winner crosses.
  e('finish line', 'sports', 'racing', () => {
    const b = m('finish line', { edge: 'sharp' }).box([1.3, 0.01, 0.42], [0, 0.005, 0], { color: 'white', round: 0 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) if ((r + c) % 2 === 0) b.box([0.105, 0.004, 0.13], [-0.5775 + c * 0.105, 0.012, -0.135 + r * 0.135], { color: '#1e1e1e', noInk: true, round: 0 });
    b.pair((s) => {
      b.cone([0.18, 0.32, 0.18], [s * 0.78, 0.16, 0], { color: '#f0821e', edge: 'soft' }).cyl([0.2, 0.02, 0.2], [s * 0.78, 0.01, 0], { color: '#f0821e', segs: 4 });
      b.cyl([0.13, 0.04, 0.13], [s * 0.78, 0.22, 0], { color: 'white', taper: 0.8, noInk: true });
      b.box([0.78, 0.03, 0.006], [s * 0.39, 0.3, 0.03], { color: '#d6453a', round: 0.2, name: s > 0 ? 'ribbonL' : 'ribbonR', pivot: [s * 0.78, 0.3, 0.03] });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('ribbonL', { rot: [0, -70, -20], dur: 0.3 }), A.pose('ribbonR', { rot: [0, 70, 20], dur: 0.3 }), A.effect('sparkle', { dur: 1.5 }), A.say('And the winner is...!', 2, ''))],
          [A.par(A.pose('ribbonL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('ribbonR', { rot: [0, 0, 0], dur: 0.4 }))],
        ],
      })
      .done();
  }),
  // A wall fire-alarm station: the red PULL handle comes down, the strobe flashes and the bell rings.
  e('fire alarm', 'home', 'safety', () =>
    m('fire alarm', { edge: 'sharp' })
      .box([0.16, 0.34, 0.03], [0, 0.17, -0.015], { color: '#e8e4dc', round: 0.2 })
      .cyl([0.15, 0.06, 0.15], [0, 0.26, 0.03], { color: '#d6262b', rot: [90, 0, 0], taper: 0.85, name: 'bell' })
      .ball(0.025, [0, 0.26, 0.065], { color: 'silver', parent: 'bell' })
      .box([0.07, 0.035, 0.03], [0, 0.32, 0.02], { color: '#fff2f0', glow: true, name: 'strobe', mover: { kind: 'light', on: false } })
      .box([0.11, 0.12, 0.05], [0, 0.08, 0.025], { color: '#d6262b', round: 0.2 })
      .box([0.07, 0.03, 0.03], [0, 0.07, 0.062], { color: 'white', round: 0.3, name: 'handle', pivot: [0, 0.085, 0.05], mover: { kind: 'swing', axis: 'x', amount: 60 } })
      .label('PULL', [0.05, 0.016], [0, 0.07, 0.078], { color: 'white', parent: 'handle', depth: 0.002 })
      .label('FIRE', [0.07, 0.022], [0, 0.125, 0.051], { color: '#d6262b', depth: 0.002 })
      .act({
        click: [
          [A.operate('handle', 'on'), A.operate('strobe', 'on'), A.par(A.pose('bell', { rot: [0, 0, 8], dur: 0.08 }), A.say('RIIIIIIING!', 2.5)), A.pose('bell', { rot: [0, 0, -8], dur: 0.08 }), A.pose('bell', { rot: [0, 0, 8], dur: 0.08 }), A.pose('bell', { rot: [0, 0, -8], dur: 0.08 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.08 }), A.wait(1.5)],
          [A.operate('handle', 'off'), A.operate('strobe', 'off'), A.say('Click.', 1)],
        ],
      })
      .done(),
  ),
  // A fire engine at real size (10 m long, 3.3 m tall): a crew cab with four doors and big windows, a roof light
  // bar that flashes, roller-shutter lockers, a pump panel, an aerial ladder on a turntable that raises and
  // swings, chrome bumper and steps, and three axles of wheels.
  e('fire engine', 'garage', 'emergency vehicles', () => {
    const b = m('fire engine', { view: 'side', edge: 'sharp' });
    const red = '#c8202a';
    b.box([1.0, 0.35, 9.6], [0, 0.75, 0.0], { color: '#2a2726', round: 0.1 })
      // cab
      .box([2.5, 2.15, 2.3], [0, 1.95, 3.9], { color: red, round: 0.12, name: 'cab' })
      .box([2.3, 0.95, 0.06], [0, 2.4, 5.06], { color: '#2f3d52', round: 0.1 })
      .box([1.9, 0.6, 0.06], [0, 1.25, 5.06], { color: 'silver', round: 0.1 })
      .each(6, (i) => void b.box([1.8, 0.03, 0.03], [0, 1.02 + i * 0.09, 5.1], { color: '#5a5f66', noInk: true }))
      .box([2.65, 0.32, 0.32], [0, 0.72, 5.15], { color: 'silver', round: 0.3 })
      .pair((s) => {
        b.box([0.32, 0.22, 0.06], [s * 1.0, 1.35, 5.07], { color: '#fff6c8', glow: true, name: s > 0 ? 'headlightL' : 'headlightR', mover: { kind: 'light', on: false } });
        b.box([0.06, 0.8, 0.95], [s * 1.255, 2.35, 4.45], { color: '#2f3d52', round: 0.1 });
        b.box([0.06, 0.8, 0.8], [s * 1.255, 2.35, 3.25], { color: '#2f3d52', round: 0.1 });
        b.box([0.04, 1.8, 0.03], [s * 1.26, 1.9, 3.85], { color: '#7a1218', noInk: true });
        b.rod([s * 1.25, 2.6, 4.9], [s * 1.5, 2.6, 5.0], 0.04, 'silver');
        b.box([0.08, 0.35, 0.2], [s * 1.52, 2.45, 5.0], { color: '#1e1e1e', round: 0.3 });
        b.box([0.5, 0.06, 0.35], [s * 1.2, 0.62, 3.9], { color: 'silver', round: 0.2 });
      })
      .box([0.06, 2.0, 0.92], [1.265, 1.85, 4.45], { color: red, round: 0.1, name: 'door', pivot: [1.265, 1.85, 4.91], mover: { kind: 'swing', axis: 'y', amount: 70 } })
      .box([0.03, 0.75, 0.82], [1.3, 2.35, 4.45], { color: '#2f3d52', parent: 'door' })
      .label('FIRE', [0.7, 0.3], [1.3, 1.45, 4.45], { color: red, rot: [0, 90, 0], parent: 'door', depth: 0.02 })
      .box([1.9, 0.15, 0.32], [0, 3.1, 4.4], { color: '#2a2726', round: 0.3 });
    ['#ff2a2a', '#3a6aff', '#ff2a2a', '#3a6aff'].forEach((c, i) => void b.box([0.4, 0.13, 0.28], [-0.69 + i * 0.46, 3.18, 4.4], { color: c, glow: true, name: `light${i}`, mover: { kind: 'light', on: false } }));
    // body with lockers
    b.box([2.5, 2.3, 6.3], [0, 2.0, -0.6], { color: red, round: 0.06 })
      .box([2.52, 0.2, 9.0], [0, 1.08, 0.4], { color: 'white', noInk: true, round: 0.2 })
      .box([2.1, 0.12, 4.6], [0, 3.2, -0.2], { color: '#3a3633', round: 0.2 });
    b.pair((s) => {
      for (const z of [1.5, -0.6, -2.6]) {
        b.box([0.04, 1.5, 1.8], [s * 1.26, 2.05, z], { color: '#b81c25', round: 0.1 });
        b.each(7, (i) => void b.box([0.02, 0.02, 1.76], [s * 1.285, 1.45 + i * 0.2, z], { color: '#8a141b', noInk: true }));
        b.box([0.03, 0.06, 0.3], [s * 1.29, 1.4, z], { color: 'silver' });
      }
      b.box([0.3, 0.06, 6.2], [s * 1.25, 0.95, -0.6], { color: 'silver', round: 0.2 });
    });
    b.box([0.05, 1.1, 0.9], [1.26, 2.1, 2.75], { color: '#3a3d42', round: 0.1 });
    for (const [gx, gy] of [[2.55, 2.4], [2.95, 2.4], [2.75, 1.95]] as const) b.cyl([0.22, 0.04, 0.22], [1.3, gy, gx], { color: 'white', rot: [0, 0, 90] });
    b.cyl([0.55, 0.5, 0.55], [-1.3, 2.0, 2.7], { color: '#c8ccd2', rot: [0, 0, 90] })
      .cyl([0.5, 0.42, 0.5], [-1.3, 2.0, 2.7], { color: '#f2c14e', rot: [0, 0, 90], edge: 'soft' });
    // aerial ladder on a turntable
    b.cyl([1.5, 0.35, 1.5], [0, 3.35, -2.8], { color: '#c8ccd2', name: 'turntable' })
      .box([0.6, 0.6, 0.8], [0, 3.7, -2.8], { color: '#c8ccd2', parent: 'turntable', round: 0.2 })
      .box([0.15, 0.15, 0.15], [0, 3.95, -2.8], { color: '#3a3633', name: 'ladder', parent: 'turntable', pivot: [0, 3.95, -2.8], mover: { kind: 'swing', axis: 'x', amount: -42 } });
    b.pair((s) => void b.box([0.08, 0.2, 8.2], [s * 0.42, 3.98, 1.25], { color: '#d8dce2', parent: 'ladder', round: 0.2 }));
    b.each(20, (i) => void b.box([0.84, 0.04, 0.04], [0, 3.92, -2.6 + i * 0.4], { color: '#b8bec6', parent: 'ladder', noInk: true }));
    b.box([0.5, 0.12, 0.4], [0, 3.9, 5.2], { color: '#c8ccd2', parent: 'ladder' });
    // wheels: a steered front axle and a rear tandem
    for (const [z, n] of [[3.85, 'F'], [-1.55, 'M'], [-2.85, 'B']] as const) b.pair((s) => void wheel(b, `wheel${n}${s > 0 ? 'L' : 'R'}`, [s * 1.07, 0.52, z], 1.04, 0.36, 'silver'));
    b.socket('seat', [0.6, 1.4, 4.2], 'seat');
    return b
      .act({
        click: [
          [A.par(A.operate('light', 'on'), A.operate('headlight', 'on'), A.say('Nee-naw! Nee-naw!', 2.5), A.anim('shake', 2))],
          [A.par(A.operate('ladder', 'open'), A.pose('turntable', { rot: [0, 35, 0], dur: 1.5 })), A.effect('water_spray', { dur: 2 }), A.wait(2)],
          [A.par(A.operate('ladder', 'close'), A.pose('turntable', { rot: [0, 0, 0], dur: 1.2 })), A.wait(0.8), A.par(A.operate('light', 'off'), A.operate('headlight', 'off'), A.operate('door', 'open')), A.wait(1.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A brick tenement wall, three storeys, with an iron fire escape zig-zagging down it: landings with railings,
  // stairs between them, and a drop ladder at the bottom that slides down to the street.
  e('fire escape', 'places', 'building parts', () => {
    const b = m('fire escape', { edge: 'sharp' });
    const W = 6, H = 9.6, iron = '#2a2c30';
    b.box([W, H, 0.4], [0, H / 2, -0.2], { color: '#a8503a', round: 0.02 })
      .box([W + 0.2, 0.3, 0.5], [0, H, -0.15], { color: '#d8d0c0', round: 0.1 })
      .box([W, 0.15, 0.06], [0, 3.2, 0.02], { color: '#d8d0c0' })
      .box([W, 0.15, 0.06], [0, 6.4, 0.02], { color: '#d8d0c0' });
    for (const y of [1.6, 4.6, 7.8]) b.pair((s) => void win(b, [s * 1.6, y, 0.01], 1.0, 1.5, { frame: '#e8e2d6', glass: '#5a6a7a', bars: true }));
    b.box([1.0, 2.2, 0.05], [-1.6, 1.15, 0.01], { color: '#4a2f1c', round: 0.1 });
    for (const y of [3.4, 6.6]) {
      b.box([3.4, 0.08, 1.2], [1.3, y, 0.6], { color: iron, round: 0 });
      b.stick([-0.4, y + 1.0, 1.2], [3.0, y + 1.0, 1.2], 0.05, iron);
      for (let i = 0; i < 8; i++) b.stick([-0.4 + i * 0.485, y, 1.2], [-0.4 + i * 0.485, y + 1.0, 1.2], 0.025, iron);
      b.pair((s) => void b.stick([1.3 + s * 1.7, y + 1.0, 0.0], [1.3 + s * 1.7, y + 1.0, 1.2], 0.05, iron));
      b.pair((s) => void b.rod([1.3 + s * 1.65, y, 1.18], [1.3 + s * 1.65, y - 0.6, 0.05], 0.06, iron));
    }
    // stairs between the landings
    const st = (y0: number, y1: number) => {
      const L = Math.hypot(2.4, y1 - y0), ang = (Math.atan2(y1 - y0, 2.4) * 180) / Math.PI;
      b.box([L, 0.06, 0.55], [1.5, (y0 + y1) / 2, 0.85], { color: '#3a3d42', rot: [0, 0, ang], round: 0 });
      b.rod([0.3, y0 + 0.9, 1.15], [2.7, y1 + 0.9, 1.15], 0.04, iron);
    };
    st(3.4, 6.6);
    // the drop ladder hangs from the first landing and slides down
    b.box([0.1, 0.1, 0.1], [2.7, 3.35, 1.1], { color: iron, name: 'ladder', mover: { kind: 'slide', axis: 'y', amount: -2.2 } });
    b.pair((s) => void b.stick([2.7 + s * 0.25, 1.4, 1.1], [2.7 + s * 0.25, 3.35, 1.1], 0.05, iron, { parent: 'ladder' }));
    b.each(6, (i) => void b.stick([2.45, 1.55 + i * 0.32, 1.1], [2.95, 1.55 + i * 0.32, 1.1], 0.035, iron, { parent: 'ladder' }));
    return b.act({ click: [[A.operate('ladder', 'down'), A.say('Clang!', 1.5)], [A.operate('ladder', 'up'), A.say('Clank.', 1)]] }).done();
  }),
  // A stored-pressure extinguisher: red cylinder, gauge, squeeze lever and carry handle, safety pin with its ring,
  // hose and horn clipped to the side: pull the pin, squeeze, and powder blasts out.
  e('fire extinguisher', 'home', 'safety', () =>
    m('fire extinguisher')
      .cyl([0.16, 0.44, 0.16], [0, 0.23, 0], { color: '#d6262b' })
      .dome([0.16, 0.08, 0.16], [0, 0.45, 0], { color: '#d6262b' })
      .cyl([0.15, 0.02, 0.15], [0, 0.01, 0], { color: '#1e1e1e', edge: 'sharp' })
      .cyl([0.162, 0.12, 0.162], [0, 0.24, 0], { color: 'white', noInk: true })
      .label('FIRE', [0.07, 0.03], [0, 0.26, 0.082], { color: 'white', depth: 0.003 })
      .cyl([0.045, 0.05, 0.045], [0, 0.55, 0], { color: 'brass', edge: 'sharp' })
      .box([0.035, 0.03, 0.06], [0, 0.585, 0.0], { color: '#1e1e1e', edge: 'sharp' })
      .box([0.03, 0.018, 0.15], [0, 0.565, -0.07], { color: 'silver', edge: 'sharp' })
      .box([0.03, 0.018, 0.15], [0, 0.61, -0.06], { color: 'silver', edge: 'sharp', name: 'lever', pivot: [0, 0.6, 0.0], rot: [-8, 0, 0] })
      .cyl([0.04, 0.012, 0.04], [0.035, 0.55, 0.02], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.004, 0.012, 0.002], [0.035, 0.556, 0.027], { color: '#d6262b', noInk: true })
      .stick([-0.03, 0.59, -0.02], [0.03, 0.59, -0.02], 0.006, 'silver', { name: 'pin', piece: true, edge: 'sharp' })
      .torus([0.025, 0.025, 0.004], [-0.045, 0.59, -0.02], { color: '#f2c14e', rot: [0, 90, 0], parent: 'pin' })
      .rod([0, 0.56, 0.03], [0, 0.5, 0.11], 0.022, '#1e1e1e')
      .rod([0, 0.5, 0.11], [0, 0.22, 0.1], 0.022, '#1e1e1e')
      .cone([0.05, 0.1, 0.05], [0, 0.17, 0.1], { color: '#1e1e1e', rot: [180, 0, 0], taper: 0.4 })
      .act({
        click: [
          [A.pose('pin', { move: [-0.08, 0, 0], dur: 0.3 }), A.pose('lever', { rot: [10, 0, 0], dur: 0.2 }), A.par(A.effect('snow', { dur: 2 }), A.say('Pssshhhhhh!', 2)), A.wait(1.5), A.pose('lever', { rot: [0, 0, 0], dur: 0.2 }), A.pose('pin', { move: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done(),
  ),
  // A rolled length of red lay-flat fire hose with a brass coupling and a branch nozzle: it blasts water.
  e('fire hose', 'home', 'safety', () => {
    const b = m('fire hose').cyl([0.42, 0.08, 0.42], [0, 0.21, 0], { color: '#c83a2a', rot: [90, 0, 0], name: 'roll' });
    b.each(4, (i) => void b.torus([0.36 - i * 0.07, 0.36 - i * 0.07, 0.082], [0, 0.21, 0], { color: '#9a2a1e', tube: 0.05, noInk: true, parent: 'roll' }));
    return b
      .cyl([0.08, 0.085, 0.08], [0, 0.21, 0], { color: '#2a2a2a', rot: [90, 0, 0] })
      .box([0.4, 0.012, 0.075], [0.2, 0.006, 0.08], { color: '#c83a2a', round: 0.3 })
      .cyl([0.07, 0.06, 0.07], [0.42, 0.035, 0.08], { color: 'brass', rot: [0, 0, 90], edge: 'sharp' })
      .cyl([0.065, 0.2, 0.065], [0.55, 0.035, 0.08], { color: '#2a2a2a', rot: [0, 0, -90], taper: 0.4, name: 'nozzle', pivot: [0.45, 0.035, 0.08] })
      .act({ click: [A.pose('nozzle', { rot: [0, 0, 12], dur: 0.15 }), A.par(A.effect('water_spray', { dur: 2.5 }), A.say('Fwoooosh!', 2)), A.pose('nozzle', { rot: [0, 0, -6], dur: 0.3 }), A.pose('nozzle', { rot: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A cast-iron pillar hydrant (0.8 m) on the kerb: bonnet, operating nut, two hose outlets and a pumper outlet
  // whose cap comes off to let the water gush.
  e('fire hydrant', 'places', 'street furniture', () => {
    const red = '#d6262b';
    const b = m('fire hydrant', { edge: 'soft' })
      .box([0.5, 0.06, 0.5], [0, 0.03, 0], { color: '#9a9590', edge: 'sharp' })
      .cyl([0.36, 0.06, 0.36], [0, 0.09, 0], { color: red })
      .cyl([0.27, 0.5, 0.27], [0, 0.37, 0], { color: red, name: 'body' })
      .cyl([0.33, 0.06, 0.33], [0, 0.63, 0], { color: red })
      .dome([0.28, 0.16, 0.28], [0, 0.66, 0], { color: '#f2c14e' })
      .prism([0.07, 0.07, 0.07], [0, 0.85, 0], 5, { color: '#f2c14e', edge: 'sharp' })
      .cyl([0.15, 0.12, 0.15], [0, 0.42, 0.15], { color: red, rot: [90, 0, 0] })
      .cyl([0.14, 0.05, 0.14], [0, 0.42, 0.23], { color: '#f2c14e', rot: [90, 0, 0], name: 'cap', parent: 'body', piece: true })
      .prism([0.05, 0.03, 0.05], [0, 0.42, 0.27], 5, { color: '#f2c14e', rot: [90, 0, 0], parent: 'cap' });
    b.pair((s) => void b.cyl([0.11, 0.12, 0.11], [s * 0.17, 0.46, 0], { color: red, rot: [0, 0, 90] }).cyl([0.1, 0.04, 0.1], [s * 0.245, 0.46, 0], { color: '#f2c14e', rot: [0, 0, 90] }));
    return b
      .act({
        click: [
          [A.pose('cap', { rot: [0, 0, 360], dur: 0.5 }), A.pose('cap', { move: [0, -0.05, 0.12], dur: 0.3 }), A.par(A.effect('water_spray', { dur: 3 }), A.say('Whoooosh!', 2))],
          [A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 }), A.say('Clank.', 1)],
        ],
      })
      .done();
  }),
  // Split logs stacked as a little fire, flames licking up: they flare and crackle, then die down to smoke.
  e('fire log', 'home', 'fireplace', () =>
    m('fire log')
      .cyl([0.14, 0.45, 0.14], [-0.08, 0.07, 0], { color: 'bark', rot: [0, 20, 90] })
      .cyl([0.13, 0.45, 0.13], [0.08, 0.065, 0.04], { color: 'bark', rot: [0, -15, 90] })
      .cyl([0.12, 0.42, 0.12], [0, 0.18, 0.02], { color: '#7a5030', rot: [0, 75, 90] })
      .cyl([0.1, 0.005, 0.1], [0.055, 0.18, 0.222], { color: '#e8c690', rot: [90, -15, 0], noInk: true })
      .torus([0.07, 0.07, 0.004], [0.055, 0.18, 0.224], { color: '#a8743e', rot: [0, -15, 0], noInk: true })
      .cone([0.14, 0.24, 0.1], [0, 0.34, 0], { color: '#ff8a2a', glow: true, name: 'flame1' })
      .cone([0.08, 0.16, 0.06], [0.06, 0.3, 0.03], { color: '#ffd23a', glow: true, name: 'flame2' })
      .cone([0.07, 0.14, 0.05], [-0.06, 0.29, -0.02], { color: '#ffb02a', glow: true, name: 'flame3' })
      .act({
        click: [
          [A.par(A.pose('flame1', { scale: 1.6, dur: 0.4 }), A.pose('flame2', { scale: 1.5, dur: 0.4 }), A.effect('fire', { dur: 2.5 }), A.say('Crackle, pop!', 2)), A.wait(1.5), A.par(A.pose('flame1', { scale: 1, dur: 0.6 }), A.pose('flame2', { scale: 1, dur: 0.6 }))],
          [A.par(A.pose('flame1', { scale: 0, dur: 0.6 }), A.pose('flame2', { scale: 0, dur: 0.6 }), A.pose('flame3', { scale: 0, dur: 0.6 }), A.effect('smoke', { dur: 2 })), A.wait(1.5), A.par(A.pose('flame1', { scale: 1, dur: 0.8 }), A.pose('flame2', { scale: 1, dur: 0.8 }), A.pose('flame3', { scale: 1, dur: 0.8 }))],
        ],
      })
      .done(),
  ),
  // A backyard fire pit (1.1 m across): a ring of fieldstones on gravel, a teepee of logs and a fire that can be
  // put out and lit again.
  e('fire pit', 'garden', 'backyard', () => {
    const b = m('fire pit').cyl([1.5, 0.03, 1.5], [0, 0.015, 0], { color: '#9a9590', edge: 'sharp' }).cyl([0.9, 0.02, 0.9], [0, 0.03, 0], { color: '#3a3633', edge: 'sharp' });
    for (const [px, pz] of around(12, 0.55)) b.ball([0.26, 0.22, 0.24], [px, 0.11, pz], { color: (px * 7) % 0.2 > 0.1 ? '#8a8a86' : '#7a7470' });
    for (const [px, pz] of around(12, 0.55, 0.26)) b.ball([0.22, 0.14, 0.2], [px, 0.27, pz], { color: '#9a9590' });
    for (const [px, pz] of around(4, 0.22, 0.4)) b.rod([px, 0.04, pz], [0, 0.42, 0], 0.08, 'bark');
    return b
      .cone([0.36, 0.5, 0.3], [0, 0.38, 0], { color: '#ff8a2a', glow: true, name: 'flame', mover: { kind: 'light', on: true } })
      .cone([0.2, 0.36, 0.16], [0.07, 0.34, 0.05], { color: '#ffd23a', glow: true, name: 'flameB', mover: { kind: 'light', on: true } })
      .act({
        click: [
          [A.par(A.operate('flame', 'off'), A.pose('flame', { scale: 0.2, dur: 0.6 }), A.pose('flameB', { scale: 0, dur: 0.6 }), A.effect('smoke', { dur: 2.5 }), A.say('Hsssss...', 1.5))],
          [A.par(A.operate('flame', 'on'), A.pose('flame', { scale: 1, dur: 0.8 }), A.pose('flameB', { scale: 1, dur: 0.8 }), A.effect('fire', { dur: 2 }), A.say('Crackle crackle!', 2))],
        ],
      })
      .done();
  }),
  // A two-bay brick fire station (9 m): red roll-up bay doors with window bands that rise, a hose-drying tower,
  // a bell, red lamps over the bays and the station's name in gold; a fire engine rolls out on a call.
  e('fire station', 'places', 'emergency', () => {
    const b = m('fire station', { edge: 'sharp' });
    const brick = '#a9463a', W = 12, D = 10, H = 8, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: brick, round: 0.02 })
      .box([W + 0.12, 0.4, D + 0.12], [0, 0.2, 0], { color: '#8a8580' })
      .box([W + 0.3, 0.35, D + 0.3], [0, H, 0], { color: '#e8e2d6', round: 0.1 })
      .box([W - 0.2, 0.06, D - 0.2], [0, H + 0.2, 0], { color: '#5a5550', round: 0 })
      .box([W + 0.1, 0.25, 0.1], [0, 4.6, fz + 0.03], { color: '#e8e2d6' })
      .box([7, 0.7, 0.1], [-1.5, 5.3, fz + 0.06], { color: '#2a2726', round: 0.1 })
      .label('FIRE STATION No 7', [6.4, 0.5], [-1.5, 5.3, fz + 0.12], { color: '#d9b24a', depth: 0.02 })
      .box([13, 0.04, 6], [-1.0, 0.02, fz + 3], { color: '#b8b4ac', round: 0 });
    for (const [cx, k] of [[-3.8, 0], [0.8, 1]] as const) {
      const n = `bay${k}`;
      b.box([4.0, 4.2, 0.12], [cx, 2.1, fz + 0.02], { color: '#e8e2d6', round: 0.05 })
        .box([3.6, 3.9, 0.04], [cx, 1.95, fz + 0.06], { color: '#22201f', noInk: true })
        .box([3.6, 3.9, 0.08], [cx, 1.95, fz + 0.1], { color: '#c8202a', round: 0.02, name: n, mover: { kind: 'slide', axis: 'y', amount: 3.6 } })
        .box([3.3, 0.5, 0.04], [cx, 2.6, fz + 0.15], { color: '#5a6a7a', parent: n });
      b.each(6, (i) => void b.box([3.6, 0.03, 0.03], [cx, 0.4 + i * 0.6, fz + 0.15], { color: '#8a141b', parent: n, noInk: true }));
      b.ball(0.28, [cx, 4.4, fz + 0.2], { color: '#ff2a2a', glow: true, name: `lamp${k}`, mover: { kind: 'light', on: false } });
    }
    for (const xx of [-4.0, -1.5, 1.0]) win(b, [xx, 6.6, fz + 0.01], 1.2, 1.4, { frame: '#e8e2d6', glass: '#5a6a7a', bars: true });
    door(b, 'door', [4.4, 0, fz], 1.0, 2.2, { color: '#4a2f1c', frame: '#e8e2d6' });
    win(b, [4.4, 6.6, fz + 0.01], 1.2, 1.4, { frame: '#e8e2d6', glass: '#5a6a7a', bars: true });
    // hose tower with a bell
    b.box([2.4, 14, 2.4], [W / 2 - 1.2, 7, -fz + 1.2], { color: brick, round: 0.02 })
      .box([2.7, 0.3, 2.7], [W / 2 - 1.2, 14, -fz + 1.2], { color: '#e8e2d6', round: 0.1 })
      .pyramid([2.7 * Math.SQRT2, 1.6, 2.7 * Math.SQRT2], [W / 2 - 1.2, 14.95, -fz + 1.2], 4, { color: '#5a5f66' })
      .box([1.2, 1.4, 0.06], [W / 2 - 1.2, 12.6, -fz + 2.42], { color: '#2a2726' })
      .cone([0.6, 0.6, 0.6], [W / 2 - 1.2, 12.6, -fz + 1.2], { color: 'brass', taper: 0.4, name: 'bell' })
      .stick([-W / 2 + 0.5, H, fz - 0.5], [-W / 2 + 0.5, H + 4.5, fz - 0.5], 0.08, 'silver')
      .box([1.5, 1.0, 0.03], [-W / 2 + 1.28, H + 4.0, fz - 0.5], { color: '#d6453a', round: 0.1 });
    return b
      .act({
        click: [
          [A.par(A.operate('lamp', 'on'), A.pose('bell', { rot: [0, 0, 25], dur: 0.2 }), A.say('Clang-clang-clang!', 2)), A.par(A.operate('bay0', 'up'), A.pose('bell', { rot: [0, 0, -25], dur: 0.3 })), A.pose('bell', { rot: [0, 0, 0], dur: 0.2 }), A.spawn('engine', 'fire engine', { rel: 'front', of: 'self', dist: 'close' }), A.say('Nee-naw!', 1.5, 'engine'), A.move('engine', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'run' }), A.remove('engine', 'fade'), A.par(A.operate('bay0', 'down'), A.operate('lamp', 'off'))],
          [A.operate('bay1', 'up'), A.wait(2), A.operate('bay1', 'down')],
        ],
      })
      .done();
  }),
  // A red banger with gold bands and a fuse: the fuse fizzes, it goes BANG, and a fresh one is there next time.
  e('firecracker', 'toys', 'fireworks', () =>
    m('firecracker')
      .cyl([0.045, 0.15, 0.045], [0, 0.075, 0], { color: '#d6262b', name: 'body' })
      .cyl([0.047, 0.012, 0.047], [0, 0.02, 0], { color: 'gold', parent: 'body' })
      .cyl([0.047, 0.012, 0.047], [0, 0.13, 0], { color: 'gold', parent: 'body' })
      .label('BANG', [0.03, 0.05], [0, 0.075, 0.023], { color: '#d6262b', parent: 'body', depth: 0.002 })
      .rod([0, 0.15, 0], [0.015, 0.18, 0], 0.005, 'tan', { parent: 'body' })
      .rod([0.015, 0.18, 0], [0.005, 0.2, 0], 0.005, 'tan', { parent: 'body' })
      .star(0.035, [0.005, 0.21, 0], { color: '#ffd23a', glow: true, name: 'spark' })
      .act({
        click: [
          [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Fssssss...', 1.5)), A.wait(1.5), A.par(A.effect('explosion', { dur: 1 }), A.say('BANG!', 1.5), A.pose('body', { scale: 0, dur: 0.05 }), A.pose('spark', { scale: 0, dur: 0.05 })), A.effect('smoke', { dur: 1.5 })],
          [A.par(A.pose('body', { scale: 1, dur: 0.4 }), A.pose('spark', { scale: 1, dur: 0.4 }))],
        ],
      })
      .done(),
  ),
  // A firefighter's turnout gear hung on a stand: boots with the bunker trousers standing in them, braces, a
  // heavy coat with reflective bands that light up, and a red helmet on top.
  e('fireman uniform', 'wardrobe', 'uniforms', () => {
    const tan = '#c9a24a', band = '#e8f04a';
    const b = m('fireman uniform');
    b.cyl([0.5, 0.04, 0.5], [0, 0.02, -0.15], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.04, -0.15], [0, 1.6, -0.15], 0.04, '#3a3633', { edge: 'sharp' })
      .pair((s) => {
        b.box([0.13, 0.36, 0.3], [s * 0.11, 0.2, 0.02], { color: '#1e1e1e', round: 0.4 });
        b.box([0.15, 0.06, 0.32], [s * 0.11, 0.03, 0.04], { color: '#3a3633', round: 0.4 });
        b.box([0.16, 0.5, 0.2], [s * 0.11, 0.62, 0], { color: tan, round: 0.4 });
        b.box([0.165, 0.05, 0.205], [s * 0.11, 0.48, 0], { color: band, glow: true, noInk: true, name: s > 0 ? 'stripeL' : 'stripeR', mover: { kind: 'light', on: false } });
        b.rod([s * 0.1, 0.92, 0.08], [s * 0.1, 1.35, 0.06], 0.025, '#d6262b');
      })
      .box([0.36, 0.12, 0.22], [0, 0.9, 0], { color: tan, round: 0.4 })
      .box([0.5, 0.62, 0.28], [0, 1.25, -0.04], { color: tan, round: 0.35, name: 'coat' })
      .pair((s) => void b.capsule([0.13, 0.5, 0.13], [s * 0.3, 1.2, -0.04], { color: tan, rot: [0, 0, s * 12] }))
      .box([0.51, 0.06, 0.29], [0, 1.08, -0.04], { color: band, glow: true, noInk: true, name: 'stripeC', mover: { kind: 'light', on: false } })
      .box([0.51, 0.06, 0.29], [0, 1.4, -0.04], { color: band, glow: true, noInk: true, name: 'stripeT', mover: { kind: 'light', on: false } })
      .box([0.03, 0.55, 0.02], [0, 1.25, 0.105], { color: '#1e1e1e', noInk: true })
      .box([0.42, 0.06, 0.04], [0, 1.58, -0.15], { color: '#5a3a22', edge: 'sharp' })
      .ball([0.3, 0.2, 0.34], [0, 1.72, -0.12], { color: '#d6262b', name: 'helmet' })
      .cyl([0.36, 0.03, 0.46], [0, 1.64, -0.16], { color: '#d6262b', parent: 'helmet' })
      .box([0.1, 0.12, 0.02], [0, 1.73, 0.06], { color: '#d9b24a', parent: 'helmet', round: 0.3 });
    return b
      .act({
        click: [
          [A.operate('stripe', 'on'), A.par(A.pose('helmet', { move: [0, 0.08, 0], dur: 0.25 }), A.effect('sparkle', { dur: 1.2 })), A.pose('helmet', { move: [0, 0, 0], dur: 0.25 })],
          [A.operate('stripe', 'off')],
        ],
      })
      .done();
  }),
  // A brick fireplace with a chimney breast to the ceiling: an arched firebox, a stone hearth, a wooden mantel
  // shelf with a clock and candlesticks, a spark screen, and a log fire that can be lit and put out.
  e('fireplace', 'home', 'fireplace', () => {
    const b = m('fireplace', { edge: 'sharp' });
    const brick = '#a8503a';
    b.box([1.8, 1.15, 0.45], [0, 0.575, 0], { color: brick, round: 0.02 })
      .box([1.2, 1.5, 0.4], [0, 1.9, -0.03], { color: brick, round: 0.02 })
      .box([2.0, 0.08, 0.32], [0, 1.2, 0.08], { color: '#5a3a22', round: 0.2 })
      .box([1.9, 0.1, 0.25], [0, 1.13, 0.1], { color: '#4a2f1c', round: 0.2 })
      .box([0.9, 0.7, 0.1], [0, 0.45, 0.19], { color: '#1a1414', round: 0.05 })
      .arc([0.9, 0.3, 0.1], [0, 0.8, 0.19], { color: '#1a1414', arc: 180, tube: 0.9 })
      .box([2.0, 0.08, 0.7], [0, 0.04, 0.25], { color: '#8a8580', round: 0.1 })
      .cyl([0.11, 0.65, 0.11], [0, 0.17, 0.2], { color: 'bark', rot: [0, 10, 90], edge: 'soft' })
      .cyl([0.1, 0.6, 0.1], [0.05, 0.27, 0.18], { color: '#7a5030', rot: [0, -25, 90], edge: 'soft' })
      .cone([0.35, 0.42, 0.14], [0, 0.48, 0.2], { color: '#ff8a2a', glow: true, name: 'flame', mover: { kind: 'light', on: true }, edge: 'soft' })
      .cone([0.18, 0.3, 0.1], [0.08, 0.44, 0.23], { color: '#ffd23a', glow: true, name: 'flameB', mover: { kind: 'light', on: true }, edge: 'soft' })
      .box([1.0, 0.65, 0.02], [0, 0.4, 0.4], { color: '#2a2726', round: 0.05, name: 'screen' })
      .each(8, (i) => void b.box([0.012, 0.6, 0.012], [-0.42 + i * 0.12, 0.4, 0.41], { color: '#4a4a4a', noInk: true, parent: 'screen' }))
      .box([0.2, 0.26, 0.12], [0, 1.37, 0.05], { color: '#5a3a22', round: 0.3 })
      .cyl([0.14, 0.02, 0.14], [0, 1.4, 0.12], { color: 'white', rot: [90, 0, 0] })
      .pair((s) => {
        b.cyl([0.06, 0.2, 0.06], [s * 0.7, 1.34, 0.08], { color: 'brass', taper: 0.5 });
        b.cyl([0.03, 0.1, 0.03], [s * 0.7, 1.49, 0.08], { color: 'cream' });
        b.cone([0.025, 0.05, 0.025], [s * 0.7, 1.565, 0.08], { color: '#ffd23a', glow: true });
      });
    return b
      .act({
        click: [
          [A.par(A.operate('flame', 'off'), A.pose('flame', { scale: 0.15, dur: 0.6 }), A.pose('flameB', { scale: 0, dur: 0.6 }), A.effect('smoke', { dur: 2 }))],
          [A.par(A.operate('flame', 'on'), A.pose('flame', { scale: 1, dur: 0.8 }), A.pose('flameB', { scale: 1, dur: 0.8 }), A.effect('fire', { dur: 2 }), A.say('Crackle...', 1.5))],
        ],
      })
      .done();
  }),
  // A skyrocket on its launching stake: lit, it shoots up and bursts.
  e('fireworks', 'toys', 'fireworks', () =>
    m('fireworks')
      .box([0.3, 0.12, 0.3], [0, 0.06, 0], { color: '#5a3a22', edge: 'sharp' })
      .stick([0, 0.12, -0.03], [0, 0.7, -0.03], 0.012, '#a8743e', { name: 'rocket', pivot: [0, 0.12, 0] })
      .cyl([0.05, 0.22, 0.05], [0, 0.74, 0], { color: '#2a5ab0', parent: 'rocket' })
      .cyl([0.052, 0.04, 0.052], [0, 0.68, 0], { color: '#f2c14e', parent: 'rocket', noInk: true })
      .cone([0.06, 0.1, 0.06], [0, 0.9, 0], { color: '#d6262b', parent: 'rocket' })
      .rod([0, 0.63, 0], [0.02, 0.58, 0.02], 0.004, 'tan', { parent: 'rocket' })
      .act({
        click: [
          [A.par(A.effect('sparkle', { dur: 1 }), A.say('Fssss...', 1)), A.pose('rocket', { move: [0, 9, 0], dur: 0.8 }), A.par(A.effect('explosion', { dur: 1 }), A.effect('sparkle', { dur: 2 }), A.say('BOOM! Ooooh!', 2), A.pose('rocket', { scale: 0, dur: 0.05 })), A.pose('rocket', { move: [0, 0, 0], dur: 0.05 }), A.wait(1), A.pose('rocket', { scale: 1, dur: 0.4 })],
        ],
      })
      .done(),
  ),
  // A wall-mount first aid box: a white cross on red, a carry handle, latches; the lid swings open to show
  // bandages, plasters and scissors.
  e('first aid kit', 'clinic', 'medical supplies', () =>
    m('first aid kit', { edge: 'sharp' })
      .box([0.32, 0.22, 0.1], [0, 0.11, 0], { color: '#d6262b', round: 0.2 })
      .box([0.28, 0.18, 0.02], [0, 0.11, 0.045], { color: 'white', round: 0.1 })
      .cyl([0.05, 0.12, 0.05], [-0.06, 0.08, 0.06], { color: '#f2efe6', rot: [0, 0, 90] })
      .box([0.08, 0.05, 0.02], [0.07, 0.14, 0.06], { color: '#e8c8a8', round: 0.4 })
      .box([0.32, 0.22, 0.03], [0, 0.11, 0.065], { color: '#d6262b', round: 0.2, name: 'lid', pivot: [-0.16, 0.11, 0.065], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .box([0.1, 0.03, 0.01], [0, 0.11, 0.084], { color: 'white', parent: 'lid' })
      .box([0.03, 0.1, 0.01], [0, 0.11, 0.084], { color: 'white', parent: 'lid' })
      .box([0.03, 0.04, 0.02], [0.15, 0.11, 0.085], { color: 'silver', parent: 'lid' })
      .arc([0.1, 0.05, 0.02], [0, 0.22, 0], { color: '#3a3633' })
      .act({ click: [[A.operate('lid', 'open'), A.say('Click!', 1)], [A.operate('lid', 'close')]] })
      .done(),
  ),
  // A tub of earthworms for bait: two worms wriggle over the rim.
  e('fish bait', 'sports', 'fishing', () => {
    const b = m('fish bait')
      .cyl([0.1, 0.06, 0.1], [0, 0.03, 0], { color: '#f2efe6', taper: 1.1, edge: 'sharp' })
      .cyl([0.104, 0.005, 0.104], [0, 0.06, 0], { color: '#4a3a2a' })
      .label('BAIT', [0.05, 0.022], [0, 0.03, 0.053], { color: '#3f7a2f', depth: 0.002 });
    b.rod([0.01, 0.06, 0], [0.03, 0.1, 0.01], 0.011, '#e0808a', { name: 'worm', pivot: [0.01, 0.06, 0] })
      .rod([0.03, 0.1, 0.01], [0.06, 0.09, 0.03], 0.011, '#e0808a', { parent: 'worm', name: 'worm2', pivot: [0.03, 0.1, 0.01] })
      .rod([0.06, 0.09, 0.03], [0.07, 0.06, 0.04], 0.011, '#d0707a', { parent: 'worm2' })
      .rod([-0.02, 0.06, 0.01], [-0.03, 0.09, 0.02], 0.01, '#e0808a', { name: 'wormB', pivot: [-0.02, 0.06, 0.01] })
      .rod([-0.03, 0.09, 0.02], [-0.01, 0.11, 0.02], 0.01, '#d0707a', { parent: 'wormB' });
    const w = (r: number) => A.par(A.pose('worm', { rot: [0, 0, r], dur: 0.2 }), A.pose('worm2', { rot: [r, 0, -r], dur: 0.2 }), A.pose('wormB', { rot: [0, 0, -r], dur: 0.2 }));
    return b.act({ click: [w(20), w(-20), w(20), w(-15), w(0), A.say('Wriggle wriggle', 1.5)] }).done();
  }),
  // A shaker tub of fish flakes: tipped, flakes sprinkle out.
  e('fish food', 'pets', 'pet supplies', () => {
    const b = m('fish food')
      .cyl([0.06, 0.1, 0.06], [0, 0.05, 0], { color: '#f2c14e', name: 'tub', pivot: [0.03, 0, 0] })
      .cyl([0.064, 0.025, 0.064], [0, 0.112, 0], { color: '#d6262b', parent: 'tub', edge: 'sharp' })
      .ball([0.03, 0.02, 0.008], [0, 0.05, 0.03], { color: '#f0821e', noInk: true, parent: 'tub' })
      .cone([0.012, 0.014, 0.006], [-0.02, 0.05, 0.03], { color: '#f0821e', rot: [0, 0, 90], noInk: true, parent: 'tub' });
    ['#f0821e', '#d6262b', 'tan', '#f2c14e', '#f0821e'].forEach((c, i) => void b.box([0.012, 0.003, 0.01], [0.05 + (i % 3) * 0.015, 0.0015, 0.02 + i * 0.008], { color: c, noInk: true, rot: [0, i * 30, 0] }));
    return b.act({ click: [A.pose('tub', { rot: [0, 0, -70], dur: 0.4 }), A.par(A.anim('shake', 2), A.effect('dust', { dur: 1 }), A.say('Shake shake', 1.2)), A.pose('tub', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A fishmonger's shop: a blue-and-white striped awning over an ice counter of whole fish out front, a hanging
  // scale, the shop sign; a fish on the ice gives a flop.
  e('fish market', 'places', 'shops', () => {
    const b = shop('fish market', { w: 7, d: 6, h: 4.6, wall: '#e8eef2', trim: '#2a5a8a', sign: 'FRESH FISH', signC: 'white', signBg: '#2a5a8a', awning: ['#2a5a8a', '#f2f2ee'], frame: '#2a5a8a' });
    b.box([3.6, 0.9, 1.0], [-1.6, 0.45, 3.6], { color: '#f2f2ee', round: 0.05 })
      .box([3.6, 0.15, 1.1], [-1.6, 0.95, 3.6], { color: '#d8eef6', round: 0.3, edge: 'soft' })
      .box([3.7, 0.12, 0.06], [-1.6, 0.92, 4.15], { color: '#2a5a8a' });
    const fc = ['#c8ccd2', '#e88a6a', '#c8ccd2', '#9aa8b8', '#e88a6a'];
    fc.forEach((c, i) => {
      const fx = -3.0 + i * 0.7, n = i === 2 ? 'flop' : undefined;
      b.loft([0.16, 0.13, 0.62], [fx, 1.08, 3.6], [[0, 0.1, 0.15], [0.15, 0.6, 0.65], [0.55, 1, 1], [0.9, 0.7, 0.75], [1, 0.25, 0.3]], { color: c, rot: [0, 90, 0], ...(n ? { name: n } : {}), edge: 'soft' });
      b.cone([0.12, 0.13, 0.03], [fx - 0.36, 1.08, 3.6], { color: c, rot: [0, 0, 90], ...(n ? { parent: n } : {}), edge: 'soft' });
    });
    b.stick([1.0, 2.4, 3.9], [1.0, 2.0, 3.9], 0.02, 'silver')
      .cyl([0.3, 0.12, 0.3], [1.0, 1.95, 3.9], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.4, 0.05, 0.4], [1.0, 1.7, 3.9], { color: 'silver', taper: 1.2 });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.say('Ding-dong!', 1.5), A.pose('flop', { rot: [0, 90, 40], move: [0, 0.15, 0], dur: 0.2 })), A.pose('flop', { rot: [0, 90, -20], move: [0, 0, 0], dur: 0.2 }), A.pose('flop', { rot: [0, 0, 0], dur: 0.2 }), A.wait(1.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // Golden breaded fish fingers on a plate with a dab of tartare sauce and a lemon wedge.
  e('fish stick', 'food', 'seafood', () => {
    const b = m('fish stick');
    plate(b, 0.22);
    return b
      .box([0.03, 0.022, 0.11], [-0.035, 0.024, 0], { color: '#e0a040', round: 0.25 })
      .box([0.03, 0.022, 0.11], [0.0, 0.024, 0.005], { color: '#d8983a', round: 0.25 })
      .box([0.03, 0.022, 0.11], [-0.018, 0.046, 0], { color: '#e0a040', round: 0.25, rot: [0, 25, 0], name: 'top', piece: true })
      .box([0.024, 0.016, 0.002], [0.0, 0.024, 0.061], { color: '#f6f2ea', noInk: true })
      .cyl([0.04, 0.02, 0.04], [0.055, 0.022, -0.03], { color: '#f2ead0' })
      .wedge([0.05, 0.025, 0.03], [0.06, 0.025, 0.05], { color: '#f2d21e' })
      .act({ click: [[A.pose('top', { move: [0, 0.04, 0.03], rot: [-30, 25, 0], dur: 0.3 }), A.say('Crunch!', 1), A.pose('top', { scale: 0.5, dur: 0.2 })], [A.pose('top', { move: [0, 0, 0], rot: [0, 0, 0], scale: 1, dur: 0.3 })]] })
      .done();
  }),
  // The tail of a diving fish standing up out of a ripple: it slaps the water.
  e('fish tail', 'sea', 'sea animal parts', () =>
    m('fish tail')
      .cyl([0.5, 0.02, 0.4], [0, 0.01, 0], { color: '#3f7fb8', edge: 'sharp' })
      .torus([0.3, 0.3, 0.03], [0, 0.02, 0], { color: '#9fd0f0', rot: [90, 0, 0], noInk: true, tube: 0.1 })
      .loft([0.09, 0.08, 0.2], [0, 0.08, 0], [[0, 0.8, 0.8], [1, 0.5, 0.55]], { color: '#f0821e', rot: [-90, 0, 0], name: 'tail', pivot: [0, 0.02, 0] })
      .ball([0.08, 0.2, 0.02], [0.05, 0.25, 0], { color: '#f0821e', rot: [0, 0, -32], parent: 'tail' })
      .ball([0.08, 0.2, 0.02], [-0.05, 0.25, 0], { color: '#f0821e', rot: [0, 0, 32], parent: 'tail' })
      .rod([0, 0.17, 0.011], [0.08, 0.3, 0.011], 0.005, '#d0601a', { noInk: true, parent: 'tail' })
      .rod([0, 0.17, 0.011], [-0.08, 0.3, 0.011], 0.005, '#d0601a', { noInk: true, parent: 'tail' })
      .act({ click: [A.pose('tail', { rot: [-35, 0, 0], dur: 0.25 }), A.pose('tail', { rot: [30, 0, 0], dur: 0.15 }), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Splash!', 1.2)), A.pose('tail', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A 60 L aquarium on its cabinet: a lit hood, sand, weed, a little castle, an air stone, and two fish that swim
  // across when the light comes on.
  e('fish tank', 'pets', 'pet supplies', () => {
    const b = m('fish tank', { edge: 'sharp' })
      .box([0.66, 0.7, 0.34], [0, 0.35, 0], { color: '#3a2a20', round: 0.05 })
      .box([0.3, 0.6, 0.02], [-0.16, 0.36, 0.17], { color: '#4a3628', round: 0.1 })
      .box([0.3, 0.6, 0.02], [0.16, 0.36, 0.17], { color: '#4a3628', round: 0.1 })
      .box([0.62, 0.02, 0.32], [0, 0.71, 0], { color: '#1e1e1e', round: 0.1 })
      .box([0.6, 0.36, 0.3], [0, 0.9, 0], { color: '#9ad4ea', round: 0.03 })
      .box([0.58, 0.05, 0.28], [0, 0.745, 0], { color: '#d8c890', edge: 'soft' })
      .box([0.62, 0.05, 0.32], [0, 1.1, 0], { color: '#1e1e1e', round: 0.1 })
      .box([0.56, 0.01, 0.06], [0, 1.074, 0.05], { color: '#f2f8ff', glow: true, name: 'light', mover: { kind: 'light', on: false } })
      .box([0.08, 0.09, 0.06], [0.18, 0.81, -0.06], { color: '#9a9590', round: 0.1 })
      .cyl([0.03, 0.02, 0.03], [-0.22, 0.78, -0.08], { color: '#5a5f66' });
    b.pair((s) => void b.cyl([0.03, 0.05, 0.03], [0.18 + s * 0.04, 0.88, -0.06], { color: '#9a9590', segs: 4 }));
    b.each(4, (i) => void b.ball(0.012, [-0.22, 0.82 + i * 0.06, -0.08], { color: 'white', noInk: true }));
    b.each(4, (i) => void b.rod([-0.18 + i * 0.05, 0.77, -0.06 + (i % 2) * 0.05], [-0.2 + i * 0.06, 0.95 + (i % 3) * 0.03, -0.06 + (i % 2) * 0.05], 0.022, i % 2 ? '#3f8a3a' : '#55a04a', { edge: 'soft' }));
    b.ball([0.07, 0.045, 0.02], [0.08, 0.93, 0.08], { color: '#f0821e', name: 'fishA', edge: 'soft' })
      .cone([0.04, 0.03, 0.01], [0.13, 0.93, 0.08], { color: '#f0821e', rot: [0, 0, 90], parent: 'fishA', edge: 'soft' })
      .ball([0.05, 0.035, 0.02], [-0.06, 1.0, 0.04], { color: '#f2d21e', name: 'fishB', edge: 'soft' })
      .cone([0.03, 0.025, 0.01], [-0.1, 1.0, 0.04], { color: '#f2d21e', rot: [0, 0, -90], parent: 'fishB', edge: 'soft' })
      .socket('water', [0, 0.95, 0], 'inside', { size: 0.25 });
    return b
      .act({
        click: [
          [A.operate('light', 'on'), A.par(A.pose('fishA', { move: [-0.25, 0.02, 0], dur: 1.5 }), A.pose('fishB', { move: [0.2, -0.05, 0], dur: 1.5 })), A.par(A.pose('fishA', { move: [0, 0, 0], dur: 1.5 }), A.pose('fishB', { move: [0, 0, 0], dur: 1.5 }), A.say('Blub blub', 1.5))],
          [A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A J-shaped fishing hook with its eye and barb, a worm already on it.
  e('fishing hook', 'sports', 'fishing', () =>
    m('fishing hook', { edge: 'sharp' })
      .torus([0.012, 0.012, 0.004], [0.009, 0.049, 0], { color: 'silver', tube: 0.3, name: 'hook' })
      .rod([0.009, 0.043, 0], [0.009, 0.015, 0], 0.005, 'silver', { parent: 'hook' })
      .arc([0.026, 0.02, 0.005], [-0.002, 0.012, 0], { color: 'silver', rot: [0, 0, 180], arc: 200, tube: 0.25, parent: 'hook' })
      .rod([-0.013, 0.012, 0], [-0.013, 0.026, 0], 0.005, 'silver', { parent: 'hook' })
      .cone([0.007, 0.01, 0.004], [-0.011, 0.024, 0], { color: 'silver', rot: [0, 0, -30], parent: 'hook' })
      .capsule([0.007, 0.03, 0.007], [0.009, 0.028, 0.004], { color: '#e0808a', rot: [0, 0, 8], edge: 'soft', parent: 'hook' })
      .act({ click: [A.pose('hook', { move: [0, 0.03, 0], dur: 0.15 }), A.par(A.say('Snag!', 1), A.effect('water_spray', { dur: 0.6 })), A.pose('hook', { move: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A spool of green monofilament line, the loose end trailing: it unwinds. (The vocabulary's 2 m is the line's
  // length; a spool of it is 10 cm.)
  e('fishing line', 'sports', 'fishing', () =>
    m('fishing line', { edge: 'sharp' })
      .cyl([0.1, 0.04, 0.1], [0, 0.05, 0], { color: '#3a3d42', rot: [90, 0, 0], name: 'spool', mover: { kind: 'spin', axis: 'z', amount: 500 } })
      .cyl([0.1, 0.006, 0.1], [0, 0.05, 0.022], { color: '#2a6ab0', rot: [90, 0, 0], parent: 'spool' })
      .cyl([0.1, 0.006, 0.1], [0, 0.05, -0.022], { color: '#2a6ab0', rot: [90, 0, 0], parent: 'spool' })
      .cyl([0.085, 0.038, 0.085], [0, 0.05, 0], { color: '#4ac0a0', rot: [90, 0, 0], parent: 'spool', edge: 'soft' })
      .cyl([0.02, 0.045, 0.02], [0, 0.05, 0], { color: 'white', rot: [90, 0, 0], parent: 'spool' })
      .label('50 m', [0.03, 0.015], [0, 0.05, 0.026], { color: '#2a6ab0', parent: 'spool', depth: 0.002 })
      .rod([0.04, 0.03, 0.0], [0.14, 0.003, 0.03], 0.002, '#4ac0a0', { noInk: true })
      .rod([0.14, 0.003, 0.03], [0.22, 0.003, -0.02], 0.002, '#4ac0a0', { noInk: true })
      .act({ click: [A.operate('spool', 'on'), A.say('Zzzzzzzz!', 1.5), A.wait(1.5), A.operate('spool', 'off')] })
      .done(),
  ),
  // A long cane fishing pole stuck in a bucket, line down to a red-and-white float: the float bobs under and the
  // pole jerks up.
  e('fishing pole', 'sports', 'fishing', () =>
    m('fishing pole')
      .cyl([0.28, 0.28, 0.28], [0, 0.14, 0], { color: '#2a6ab0', taper: 1.15, edge: 'sharp' })
      .cyl([0.3, 0.02, 0.3], [0, 0.28, 0], { color: 'silver', edge: 'sharp' })
      .arc([0.26, 0.15, 0.01], [0, 0.29, 0], { color: 'silver', arc: 180, rot: [0, 90, 0] })
      .rod([0, 0.08, 0], [1.1, 2.45, 0], 0.035, '#d8c070', { name: 'pole', pivot: [0, 0.25, 0] })
      .rod([1.1, 2.45, 0], [1.1, 0.42, 0], 0.004, 'white', { parent: 'pole', noInk: true })
      .ball(0.06, [1.1, 0.4, 0], { color: '#d6262b', name: 'float', parent: 'pole' })
      .ball([0.06, 0.03, 0.06], [1.1, 0.43, 0], { color: 'white', parent: 'float' })
      .cyl([0.8, 0.01, 0.8], [1.1, 0.005, 0], { color: '#3f7fb8', edge: 'sharp' })
      .act({ click: [A.pose('float', { move: [0, -0.1, 0], dur: 0.2 }), A.pose('float', { move: [0, 0, 0], dur: 0.2 }), A.pose('float', { move: [0, -0.15, 0], dur: 0.2 }), A.par(A.pose('pole', { rot: [0, 0, 18], dur: 0.25 }), A.effect('water_spray', { dur: 1 }), A.say('A bite!', 1.5)), A.pose('pole', { rot: [0, 0, 0], dur: 0.6 }), A.pose('float', { move: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A spinning reel on a length of rod: the handle winds and the bail arm flips.
  e('fishing reel', 'sports', 'fishing', () =>
    m('fishing reel', { edge: 'sharp' })
      .stick([0, 0.2, -0.25], [0, 0.2, 0.3], 0.025, '#1e1e1e')
      .box([0.025, 0.07, 0.04], [0, 0.155, 0], { color: '#3a3d42', round: 0.3 })
      .ball([0.08, 0.09, 0.08], [0, 0.08, 0], { color: '#3a3d42', edge: 'soft' })
      .cyl([0.075, 0.06, 0.075], [0, 0.08, 0.075], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.065, 0.062, 0.065], [0, 0.08, 0.075], { color: '#4ac0a0', rot: [90, 0, 0], edge: 'soft' })
      .arc([0.1, 0.1, 0.008], [0, 0.08, 0.11], { color: 'silver', rot: [0, 0, 30], arc: 200, name: 'bail', pivot: [0, 0.08, 0.11], mover: { kind: 'swing', axis: 'z', amount: 150 } })
      .stick([0.04, 0.08, 0], [0.06, 0.08, 0], 0.012, 'silver', { name: 'crank', pivot: [0.05, 0.08, 0], mover: { kind: 'spin', axis: 'x', amount: 600 } })
      .stick([0.06, 0.08, 0], [0.06, 0.03, 0], 0.01, 'silver', { parent: 'crank' })
      .capsule([0.02, 0.03, 0.02], [0.075, 0.03, 0], { color: '#1e1e1e', rot: [0, 0, 90], parent: 'crank' })
      .act({ click: [[A.operate('bail', 'open'), A.say('Click!', 1)], [A.operate('bail', 'close'), A.operate('crank', 'on'), A.say('Whirr-whirr-whirr', 1.5), A.wait(1.5), A.operate('crank', 'off')]] })
      .done(),
  ),
  // A carbon rod with a spinning reel, propped in its tackle box: it casts back and forward.
  e('fishing rod', 'sports', 'fishing', () =>
    m('fishing rod', { edge: 'sharp' })
      .box([0.42, 0.2, 0.24], [0, 0.1, 0], { color: '#3f7a3f', round: 0.15 })
      .box([0.44, 0.04, 0.26], [0, 0.2, 0], { color: '#2f5a2f', round: 0.15 })
      .box([0.12, 0.03, 0.04], [0, 0.23, 0], { color: '#3a3d42', round: 0.4 })
      .box([0.06, 0.04, 0.02], [0, 0.17, 0.125], { color: 'silver' })
      .capsule([0.035, 0.3, 0.035], [-0.3, 0.2, 0], { color: '#1e1e1e', rot: [0, 0, -40], name: 'rod', pivot: [-0.36, 0.1, 0] })
      .rod([-0.2, 0.32, 0], [0.95, 1.7, 0], 0.016, '#3a3d42', { parent: 'rod' })
      .cyl([0.07, 0.04, 0.07], [-0.22, 0.25, 0.05], { color: 'silver', rot: [90, 0, 0], parent: 'rod' })
      .rod([0.95, 1.7, 0], [0.95, 0.5, 0], 0.003, 'white', { parent: 'rod', noInk: true })
      .rod([0.95, 0.5, 0], [0.94, 0.47, 0], 0.006, 'silver', { parent: 'rod' })
      .act({ click: [A.pose('rod', { rot: [0, 0, 25], dur: 0.35 }), A.pose('rod', { rot: [0, 0, -15], dur: 0.2 }), A.par(A.say('Whizzz... plop!', 1.5), A.effect('water_spray', { dur: 0.8 })), A.pose('rod', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A fitness band: a soft strap with a little screen that lights up to count steps.
  e('fitness tracker', 'tech', 'wearables', () =>
    m('fitness tracker')
      .torus([0.07, 0.06, 0.02], [0, 0.03, 0], { color: '#2a2c30', tube: 0.16, rot: [90, 0, 0] })
      .box([0.024, 0.044, 0.012], [0, 0.03, 0.035], { color: '#1e1e1e', round: 0.4, edge: 'sharp' })
      .box([0.018, 0.034, 0.003], [0, 0.03, 0.042], { color: '#4ad0ff', glow: true, name: 'screen', mover: { kind: 'light', on: false }, edge: 'sharp' })
      .act({ click: [A.operate('screen', 'on'), A.par(A.anim('shake', 2), A.say('Bzz! 10,000 steps!', 2)), A.wait(1), A.operate('screen', 'off')] })
      .done(),
  ),
  // A steel access ladder fixed to the 4 m wall of a flat-roofed building, 5.2 m to the top of its stiles: rungs every
  // 0.3 m on wall brackets, a safety cage of thin flat hoops and bars from 2.3 m, the stiles running on past the
  // parapet and curving over it as grab rails down to the roof, and a locked anti-climb plate over the bottom rungs
  // that swings open on its hinge.
  e('fixed ladder', 'workshop', 'ladders', () => {
    const b = m('fixed ladder', { edge: 'sharp' });
    const Y = '#f2c14e', W = '#c8c2b8', S = '#7d8288';
    b.box([2.4, 4.0, 1.2], [0, 2.0, -0.8], { color: W, round: 0.02 })
      .box([2.4, 0.42, 0.22], [0, 4.21, -0.31], { color: W, round: 0.05 })
      .box([2.5, 0.06, 0.28], [0, 4.45, -0.31], { color: '#9a9590', round: 0.1 });
    b.pair((s) => {
      b.stick([s * 0.22, 0, 0], [s * 0.22, 5.2, 0], 0.06, Y);
      for (const y of [0.5, 1.7, 2.9, 4.1]) b.stick([s * 0.22, y, 0], [s * 0.22, y, -0.2], 0.04, Y).box([0.1, 0.14, 0.012], [s * 0.22, y, -0.2], { color: S, round: 0.1 });
      // the grab rail over the parapet and down to the roof
      b.arc([0.65, 0.55, 0.05], [s * 0.22, 5.2, -0.3], { color: Y, rot: [0, 90, 0], tube: 0.077 })
        .stick([s * 0.22, 5.2, -0.6], [s * 0.22, 4.0, -0.6], 0.05, Y);
    });
    b.each(15, (i) => void b.stick([-0.22, 0.3 + i * 0.3, 0], [0.22, 0.3 + i * 0.3, 0], 0.035, Y));
    // the cage: flat hoops tied to the stiles and seven upright bars
    for (const y of [2.3, 3.0, 3.7, 4.4, 5.1]) {
      b.arc([0.77, 1.4, 0.05], [0, y, 0], { color: Y, rot: [90, 0, 0], tube: 0.065 });
      b.pair((s) => b.stick([s * 0.22, y, 0], [s * 0.37, y, 0], 0.03, Y));
    }
    for (const a of [15, 40, 65, 90, 115, 140, 165]) {
      const r = (a * Math.PI) / 180;
      b.box([0.04, 2.85, 0.012], [Math.cos(r) * 0.36, 3.7, Math.sin(r) * 0.66], { color: Y, rot: [0, 90 - a, 0], round: 0.2 });
    }
    // the locked anti-climb plate over the bottom rungs, hinged on its left
    b.pair((s) => b.cyl([0.03, 0.08, 0.03], [0.3, 1.3 + s * 0.6, 0.06], { color: S }));
    b.box([0.56, 1.8, 0.025], [0, 1.3, 0.06], { color: S, round: 0.05, name: 'guard', pivot: [0.3, 1.3, 0.06], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .label('AUTHORISED ACCESS ONLY', [0.42, 0.14], [0, 1.65, 0.075], { color: '#d32f2f', depth: 0.004, parent: 'guard' })
      .box([0.05, 0.07, 0.03], [-0.25, 1.25, 0.085], { color: 'brass', round: 0.3, parent: 'guard' })
      .arc([0.04, 0.05, 0.008], [-0.25, 1.29, 0.085], { color: 'silver', tube: 0.25, parent: 'guard' });
    return b.act({ click: [[A.operate('guard', 'open'), A.say('Clang!', 1.5)], [A.operate('guard', 'close'), A.say('Clunk.', 1)]] }).done();
  }),
  // A 1.5 m indoor flag on a stand: the cloth hangs in three folds that ripple when it waves.
  e('flag', 'ideas', 'flags', () => {
    const b = m('flag')
      .cyl([0.36, 0.06, 0.36], [0, 0.03, 0], { color: '#3a3633', edge: 'sharp' })
      .cyl([0.12, 0.08, 0.12], [0, 0.1, 0], { color: 'brass', edge: 'sharp' })
      .stick([0, 0.1, 0], [0, 1.55, 0], 0.035, '#a8743e', { edge: 'sharp' })
      .ball(0.07, [0, 1.6, 0], { color: 'gold', edge: 'sharp' })
      .box([0.3, 0.6, 0.02], [0.17, 1.22, 0], { color: '#d6262b', name: 'cloth1', pivot: [0.02, 1.22, 0], round: 0.3 })
      .box([0.3, 0.6, 0.02], [0.47, 1.22, 0], { color: '#d6262b', name: 'cloth2', parent: 'cloth1', pivot: [0.32, 1.22, 0], round: 0.3 })
      .box([0.3, 0.6, 0.02], [0.77, 1.22, 0], { color: '#d6262b', name: 'cloth3', parent: 'cloth2', pivot: [0.62, 1.22, 0], round: 0.3 })
      .star(0.22, [0.32, 1.24, 0.015], { color: '#f2d21e', parent: 'cloth2' });
    const w = (a: number) => A.par(A.pose('cloth1', { rot: [0, a, 0], dur: 0.35 }), A.pose('cloth2', { rot: [0, -a * 1.5, 0], dur: 0.35 }), A.pose('cloth3', { rot: [0, a * 1.5, 0], dur: 0.35 }));
    return b.act({ click: [w(15), w(-15), w(15), w(-10), w(0)] }).done();
  }),
  // A 10 m street flagpole on a stone plinth: a gold finial, the halyard on its cleat, and a flag that is
  // lowered to the bottom and run back up.
  e('flagpole', 'places', 'street furniture', () =>
    m('flagpole', { edge: 'sharp' })
      .box([1.6, 0.5, 1.6], [0, 0.25, 0], { color: '#bdb5a5', round: 0.1 })
      .box([1.2, 0.3, 1.2], [0, 0.65, 0], { color: '#d8d0c0', round: 0.1 })
      .cyl([0.22, 9.6, 0.22], [0, 5.6, 0], { color: 'silver', taper: 0.6 })
      .ball(0.32, [0, 10.5, 0], { color: 'gold' })
      .rod([0.08, 1.2, 0.0], [0.08, 10.3, 0.0], 0.012, '#f2efe6', { noInk: true })
      .box([0.06, 0.15, 0.04], [0.12, 1.3, 0], { color: '#3a3633' })
      .box([2.4, 1.6, 0.04], [1.3, 9.5, 0], { color: '#2a5ab0', name: 'flag', mover: { kind: 'slide', axis: 'y', amount: -7.5 }, round: 0.1 })
      .box([2.4, 0.3, 0.05], [1.3, 9.5, 0], { color: 'white', parent: 'flag', noInk: true })
      .box([0.3, 1.6, 0.05], [0.9, 9.5, 0], { color: 'white', parent: 'flag', noInk: true })
      .act({ click: [[A.operate('flag', 'down'), A.wait(2)], [A.operate('flag', 'up'), A.wait(0.5), A.pose('flag', { rot: [0, 20, 0], dur: 0.4 }), A.pose('flag', { rot: [0, -15, 0], dur: 0.4 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A flamethrower: a backpack frame with twin fuel tanks and a gas bottle, a hose to the wand propped against
  // it; the wand's flame roars out.
  e('flamethrower', 'armory', 'heavy weapons', () => {
    const b = m('flamethrower', { edge: 'sharp' });
    b.pair((s) => void b.cyl([0.16, 0.6, 0.16], [s * 0.1, 0.4, -0.15], { color: '#5a6a3a', edge: 'soft' }).dome([0.16, 0.06, 0.16], [s * 0.1, 0.7, -0.15], { color: '#5a6a3a' }));
    b.cyl([0.1, 0.45, 0.1], [0, 0.38, -0.28], { color: '#9aa0a8' })
      .box([0.4, 0.06, 0.3], [0, 0.07, -0.2], { color: '#3a3633' })
      .pair((s) => void b.box([0.04, 0.7, 0.04], [s * 0.2, 0.42, -0.05], { color: '#3a3633' }))
      .box([0.32, 0.08, 0.05], [0, 0.78, -0.05], { color: '#5a3a22', edge: 'soft' })
      .rod([0.1, 0.12, -0.05], [0.25, 0.05, 0.25], 0.03, '#1e1e1e', { edge: 'soft' })
      .rod([0.25, 0.05, 0.25], [0.35, 0.35, 0.2], 0.03, '#1e1e1e', { edge: 'soft' })
      .stick([0.35, 0.25, 0.2], [0.4, 0.95, 0.15], 0.05, '#5a5f66', { name: 'wand', pivot: [0.35, 0.25, 0.2] })
      .box([0.05, 0.14, 0.06], [0.36, 0.35, 0.25], { color: '#1e1e1e', parent: 'wand' })
      .box([0.05, 0.12, 0.05], [0.38, 0.62, 0.22], { color: '#1e1e1e', parent: 'wand' })
      .cyl([0.07, 0.05, 0.07], [0.41, 0.98, 0.15], { color: '#1e1e1e', parent: 'wand' })
      .cone([0.25, 0.8, 0.25], [0.43, 1.4, 0.13], { color: '#ff8a2a', glow: true, name: 'flame', parent: 'wand', scale: 0 })
      .cone([0.12, 0.5, 0.12], [0.42, 1.25, 0.14], { color: '#ffd23a', glow: true, name: 'core', parent: 'wand', scale: 0 });
    return b
      .act({
        click: [
          [A.par(A.pose('flame', { scale: 1, dur: 0.2 }), A.pose('core', { scale: 1, dur: 0.2 }), A.effect('fire', { dur: 2 }), A.say('WHOOOOOSH!', 2)), A.wait(1.5), A.par(A.pose('flame', { scale: 0, dur: 0.3 }), A.pose('core', { scale: 0, dur: 0.3 }), A.effect('smoke', { dur: 1.5 }))],
        ],
      })
      .done();
  }),
  // A hand-held signal flare: struck, it burns a fierce red with a plume of smoke, then goes out.
  e('flare', 'sports', 'outdoor gear', () =>
    m('flare')
      .cyl([0.035, 0.18, 0.035], [0, 0.09, 0], { color: '#d6262b' })
      .cyl([0.038, 0.05, 0.038], [0, 0.025, 0], { color: '#1e1e1e' })
      .label('SOS', [0.025, 0.04], [0, 0.11, 0.018], { color: 'white', depth: 0.002 })
      .cyl([0.03, 0.02, 0.03], [0, 0.19, 0], { color: '#3a3633' })
      .ball([0.06, 0.08, 0.06], [0, 0.23, 0], { color: '#ff3040', glow: true, name: 'glow', mover: { kind: 'light', on: false }, scale: 0.6 })
      .act({ click: [[A.par(A.operate('glow', 'on'), A.pose('glow', { scale: 1.6, dur: 0.3 }), A.say('Fssssssss!', 2)), A.effect('smoke', { dur: 3 })], [A.par(A.operate('glow', 'off'), A.pose('glow', { scale: 0.6, dur: 0.5 }))]] })
      .done(),
  ),
  // An orange signal pistol with a fat barrel: it fires a red star high into the sky.
  e('flare gun', 'sports', 'outdoor gear', () =>
    m('flare gun', { view: 'side', edge: 'sharp' })
      .box([0.045, 0.12, 0.05], [0, 0.06, -0.06], { color: '#f0821e', rot: [-15, 0, 0], round: 0.4, name: 'gun', pivot: [0, 0.03, -0.06] })
      .box([0.05, 0.06, 0.1], [0, 0.14, -0.04], { color: '#f0821e', round: 0.3, parent: 'gun' })
      .cyl([0.055, 0.16, 0.055], [0, 0.15, 0.08], { color: '#f0821e', rot: [90, 0, 0], parent: 'gun' })
      .cyl([0.06, 0.02, 0.06], [0, 0.15, 0.16], { color: '#c8601a', rot: [90, 0, 0], parent: 'gun' })
      .torus([0.04, 0.04, 0.01], [0, 0.085, -0.01], { color: '#f0821e', rot: [0, 90, 0], parent: 'gun' })
      .box([0.012, 0.03, 0.012], [0, 0.09, -0.005], { color: '#1e1e1e', parent: 'gun' })
      .box([0.015, 0.03, 0.015], [0, 0.18, -0.09], { color: '#1e1e1e', parent: 'gun' })
      .ball(0.04, [0, 0.15, 0.17], { color: '#ff3040', glow: true, name: 'star', scale: 0 })
      .act({ click: [A.par(A.pose('gun', { rot: [-15, 0, 0], dur: 0.08 }), A.pose('star', { scale: 1, dur: 0.05 }), A.say('Phoomp!', 1.5)), A.par(A.pose('star', { move: [0, 15, 4], dur: 1.2 }), A.pose('gun', { rot: [0, 0, 0], dur: 0.3 })), A.effect('sparkle', { dur: 1 }), A.pose('star', { scale: 0, move: [0, 0, 0], dur: 0.05 })] })
      .done(),
  ),
  // A stun grenade: perforated steel body, spoon and pin: the pin comes out, a blinding flash, and it is back.
  e('flash bomb', 'armory', 'grenades', () => {
    const b = m('flash bomb', { edge: 'sharp' })
      .cyl([0.045, 0.11, 0.045], [0, 0.055, 0], { color: '#3a3a40', name: 'body' })
      .cyl([0.03, 0.02, 0.03], [0, 0.12, 0], { color: 'silver', parent: 'body' })
      .box([0.012, 0.09, 0.006], [0, 0.085, 0.026], { color: 'silver', rot: [-5, 0, 0], parent: 'body' })
      .torus([0.03, 0.03, 0.005], [0.03, 0.13, 0], { color: 'silver', tube: 0.15, name: 'pin', parent: 'body' })
      .cyl([0.047, 0.012, 0.047], [0, 0.1, 0], { color: '#f2d21e', noInk: true, parent: 'body' });
    for (const [px, pz] of around(6, 0.0225)) b.cyl([0.008, 0.06, 0.008], [px, 0.05, pz], { color: '#1e1e1e', noInk: true, parent: 'body' });
    return b
      .act({
        click: [
          [A.pose('pin', { move: [0.06, 0.02, 0], dur: 0.3 }), A.wait(0.6), A.par(A.effect('explosion', { dur: 0.6 }), A.effect('sparkle', { dur: 1.5 }), A.say('BANG!', 1.5), A.pose('body', { scale: 0, dur: 0.05 })), A.effect('smoke', { dur: 1.5 })],
          [A.pose('pin', { move: [0, 0, 0], dur: 0 }), A.pose('body', { scale: 1, dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A stack of index cards with the top one propped up on a little stand: it flips over to show the answer.
  e('flashcard', 'study', 'school supplies', () =>
    m('flashcard', { edge: 'sharp' })
      .box([0.14, 0.02, 0.09], [0, 0.01, 0], { color: 'white', round: 0.1 })
      .box([0.14, 0.003, 0.09], [0, 0.021, 0], { color: '#8ac8f0', noInk: true, round: 0 })
      .box([0.1, 0.015, 0.03], [0, 0.03, -0.02], { color: '#5a3a22' })
      .box([0.13, 0.08, 0.004], [0, 0.08, -0.02], { color: 'white', round: 0.1, name: 'card', pivot: [0, 0.08, -0.02] })
      .box([0.13, 0.006, 0.005], [0, 0.112, -0.019], { color: '#d6453a', noInk: true, parent: 'card' })
      .label('2 + 2 = ?', [0.1, 0.035], [0, 0.078, -0.017], { color: 'white', parent: 'card', depth: 0.002 })
      .label('4', [0.05, 0.05], [0, 0.078, -0.023], { color: 'white', rot: [0, 180, 0], parent: 'card', depth: 0.002 })
      .act({ click: [[A.pose('card', { rot: [0, 180, 0], dur: 0.5 }), A.say('4!', 1.5)], [A.pose('card', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A torch: a ribbed aluminium barrel, a flared head, a rubber switch; on, the lens glows and throws a beam.
  e('flashlight', 'tech', 'gadgets', () =>
    m('flashlight', { view: 'side', edge: 'sharp' })
      .cyl([0.034, 0.12, 0.034], [0, 0.018, -0.03], { color: '#2a2c30', rot: [90, 0, 0] })
      .cyl([0.036, 0.04, 0.036], [0, 0.018, 0.045], { color: '#2a2c30', rot: [90, 0, 0], taper: 1.45 })
      .cyl([0.05, 0.006, 0.05], [0, 0.018, 0.067], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: 'lens', mover: { kind: 'light', on: false } })
      .box([0.012, 0.008, 0.02], [0, 0.036, -0.01], { color: '#d6262b', round: 0.5 })
      .cone([0.3, 0.6, 0.3], [0, 0.018, 0.37], { color: '#fff6c8', rot: [-90, 0, 0], glow: true, name: 'beam', scale: 0, noInk: true })
      .act({ click: [[A.par(A.operate('lens', 'on'), A.pose('beam', { scale: 1, dur: 0.1 }), A.say('Click!', 1))], [A.par(A.operate('lens', 'off'), A.pose('beam', { scale: 0, dur: 0.1 }), A.say('Click.', 1))]] })
      .done(),
  ),
  // A sale flyer propped on a little wooden stand: a gust flutters it.
  e('flier (paper)', 'study', 'paper goods', () => {
    const b = m('flier (paper)', { edge: 'sharp' })
      .box([0.26, 0.03, 0.08], [0, 0.015, 0], { color: '#a8743e' })
      .box([0.21, 0.29, 0.004], [0, 0.17, -0.02], { color: 'white', rot: [-8, 0, 0], round: 0.05, name: 'sheet', pivot: [0, 0.03, -0.0] })
      .label('SALE!', [0.17, 0.05], [0, 0.27, -0.01], { color: '#d6262b', rot: [-8, 0, 0], parent: 'sheet', depth: 0.002 })
      .box([0.12, 0.08, 0.002], [0, 0.185, -0.016], { color: '#8ac8f0', rot: [-8, 0, 0], noInk: true, parent: 'sheet' })
      .ball([0.04, 0.04, 0.003], [0.03, 0.195, -0.014], { color: '#f2d21e', noInk: true, parent: 'sheet' });
    b.each(3, (i) => void b.box([0.16, 0.008, 0.002], [0, 0.12 - i * 0.025, -0.024 + (0.12 - i * 0.025) * 0.03], { color: '#9aa0a8', rot: [-8, 0, 0], noInk: true, parent: 'sheet' }));
    return b.act({ click: [A.pose('sheet', { rot: [-25, 0, 6], dur: 0.25 }), A.pose('sheet', { rot: [8, 0, -4], dur: 0.25 }), A.pose('sheet', { rot: [-12, 0, 3], dur: 0.25 }), A.pose('sheet', { rot: [0, 0, 0], dur: 0.25 }), A.say('Flap flap', 1)] }).done();
  }),
  // A security floodlight on its wall bracket: a finned housing and a big lens that throws a wide beam.
  e('floodlight', 'home', 'lighting', () =>
    m('floodlight', { edge: 'sharp' })
      .box([0.12, 0.2, 0.03], [0, 0.18, -0.12], { color: '#3a3d42', round: 0.2 })
      .stick([0, 0.2, -0.11], [0, 0.2, -0.04], 0.025, '#3a3d42')
      .box([0.24, 0.18, 0.08], [0, 0.18, 0.0], { color: '#2a2c30', rot: [-20, 0, 0], round: 0.15, name: 'head' })
      .box([0.21, 0.15, 0.01], [0, 0.192, 0.04], { color: '#fffbe0', rot: [-20, 0, 0], glow: true, name: 'lamp', mover: { kind: 'light', on: false }, parent: 'head' })
      .cone([0.9, 1.0, 0.6], [0, 0.0, 0.5], { color: '#fffbe0', rot: [-110, 0, 0], glow: true, name: 'beam', scale: 0, noInk: true })
      .act({ click: [[A.par(A.operate('lamp', 'on'), A.pose('beam', { scale: 1, dur: 0.1 }), A.say('Click!', 1))], [A.par(A.operate('lamp', 'off'), A.pose('beam', { scale: 0, dur: 0.1 }))]] })
      .done(),
  ),
  // A patch of oak strip flooring, boards of mixed tone laid in a staggered pattern: one board creaks.
  e('floor', 'home', 'flooring', () => {
    const b = m('floor', { edge: 'sharp' });
    const cols = ['#b07840', '#c08a50', '#a06a38', '#b8844a', '#c69460', '#a87444', '#b07840'];
    b.each(7, (i) => {
      const off = ((i * 37) % 10) / 10 - 0.5;
      b.box([0.14, 0.02, 1.0], [-0.42 + i * 0.14, 0.11, 0], { color: cols[i], round: 0.05, ...(i === 3 ? { name: 'board', pivot: [-0.42 + i * 0.14, 0.11, -0.5] } : {}) });
      b.box([0.142, 0.002, 0.006], [-0.42 + i * 0.14, 0.121, off * 0.8], { color: '#5a3a22', noInk: true });
      b.box([0.13, 0.1, 0.98], [-0.42 + i * 0.14, 0.05, 0], { color: '#8a6a4a', round: 0.02, noInk: true });
    });
    b.ball([0.02, 0.003, 0.03], [0.0, 0.121, 0.2], { color: '#7a5030', noInk: true });
    // a white skirting board along the back edge, where the floor meets the wall
    b.box([1.0, 0.1, 0.02], [0, 0.17, -0.49], { color: '#f2efe6', round: 0.2 }).box([1.0, 0.01, 0.03], [0, 0.225, -0.49], { color: '#f2efe6', round: 0.5 });
    return b.act({ click: [A.pose('board', { rot: [-4, 0, 0], dur: 0.2 }), A.say('Creeeak...', 1.5), A.pose('board', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A standing lamp (1.6 m): a weighted base, a brass pole, a pleated drum shade and a pull chain.
  e('floor lamp', 'home', 'lighting', () =>
    m('floor lamp')
      .cyl([0.32, 0.04, 0.32], [0, 0.02, 0], { color: '#2a2726', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 1.35, 0], 0.03, 'brass', { edge: 'sharp' })
      .ball(0.1, [0, 1.36, 0], { color: '#fff4c0', glow: true, name: 'bulb', mover: { kind: 'light', on: true } })
      .cyl([0.44, 0.34, 0.44], [0, 1.44, 0], { color: '#f2e6c8', taper: 0.7, edge: 'sharp' })
      .cyl([0.05, 0.04, 0.05], [0, 1.62, 0], { color: 'brass', edge: 'sharp' })
      .rod([0.06, 1.33, 0], [0.06, 1.15, 0], 0.006, 'brass', { name: 'chain', pivot: [0.06, 1.33, 0] })
      .ball(0.018, [0.06, 1.14, 0], { color: 'brass', parent: 'chain' })
      .act({ click: [A.pose('chain', { move: [0, -0.04, 0], dur: 0.1 }), A.par(A.operate('bulb'), A.say('Click!', 0.8)), A.pose('chain', { move: [0, 0, 0], dur: 0.1 })] })
      .done(),
  ),
  // A stack of glazed floor tiles with one stood up to show its pattern: it turns to show it off.
  e('floor tile', 'home', 'flooring', () =>
    m('floor tile', { edge: 'sharp' })
      .box([0.32, 0.08, 0.32], [0, 0.04, 0], { color: '#c8b8a0', round: 0.1 })
      .box([0.3, 0.3, 0.02], [0, 0.23, -0.1], { color: 'white', rot: [-12, 0, 0], round: 0.1, name: 'tile', pivot: [0, 0.08, -0.1] })
      .box([0.17, 0.17, 0.004], [0, 0.23, -0.087], { color: '#2a3a8a', rot: [-12, 0, 45], noInk: true, parent: 'tile' })
      .box([0.08, 0.08, 0.006], [0, 0.23, -0.084], { color: '#d9b24a', rot: [-12, 0, 45], noInk: true, parent: 'tile' })
      .act({ click: [A.pose('tile', { rot: [0, 360, 0], dur: 1.2 }), A.pose('tile', { rot: [0, 0, 0], dur: 0 }), A.say('Clack!', 1)] })
      .done(),
  ),
  // A 3.5-inch floppy disk: its metal shutter slides open to show the magnetic disc.
  e('floppy disk', 'tech', 'computer things', () =>
    m('floppy disk', { edge: 'sharp' })
      .box([0.09, 0.094, 0.01], [0, 0.047, 0], { color: '#2a3a8a', round: 0.1 })
      .box([0.02, 0.026, 0.002], [0.004, 0.079, 0.0055], { color: '#3a2a20', noInk: true })
      .box([0.045, 0.03, 0.012], [0.004, 0.079, 0], { color: 'silver', round: 0.05, name: 'shutter', mover: { kind: 'slide', axis: 'x', amount: -0.022 } })
      .box([0.065, 0.045, 0.004], [0, 0.03, 0.006], { color: 'white', noInk: true, round: 0.1 })
      .box([0.055, 0.003, 0.002], [0, 0.04, 0.009], { color: '#8ac8f0', noInk: true })
      .label('SAVE', [0.04, 0.014], [0, 0.025, 0.009], { color: 'white', depth: 0.002 })
      .act({ click: [[A.operate('shutter', 'open'), A.say('Click! Whirr...', 1.5)], [A.operate('shutter', 'close'), A.say('Saved!', 1)]] })
      .done(),
  ),
  // A dental floss dispenser: the lid flips up and a length of floss pulls out.
  e('floss', 'home', 'bathroom', () =>
    m('floss', { edge: 'sharp' })
      .box([0.05, 0.06, 0.022], [0, 0.03, 0], { color: 'white', round: 0.6 })
      .box([0.035, 0.015, 0.003], [0, 0.03, 0.012], { color: '#5ac8b0', noInk: true })
      .box([0.052, 0.022, 0.024], [0, 0.071, 0], { color: '#5ac8b0', round: 0.6, name: 'lid', pivot: [0, 0.06, -0.012], mover: { kind: 'swing', axis: 'x', amount: -80 } })
      .rod([0, 0.06, 0.008], [0.0, 0.065, 0.02], 0.003, 'white', { name: 'thread', noInk: true })
      .act({ click: [A.operate('lid', 'open'), A.pose('thread', { move: [0.03, 0.03, 0.02], dur: 0.4 }), A.say('Zip!', 1), A.pose('thread', { move: [0, 0, 0], dur: 0.3 }), A.operate('lid', 'close')] })
      .done(),
  ),
  // A paper bag of flour, folded shut, with a little heap spilled beside it: a puff of flour flies up.
  e('flour', 'food', 'baking', () =>
    m('flour')
      .box([0.16, 0.24, 0.1], [0, 0.12, 0], { color: '#f4ecd8', round: 0.2, name: 'bag', pivot: [0, 0, 0] })
      .box([0.16, 0.04, 0.03], [0, 0.255, 0], { color: '#f4ecd8', round: 0.3, parent: 'bag' })
      .label('FLOUR', [0.12, 0.04], [0, 0.17, 0.052], { color: '#2a5ab0', parent: 'bag', depth: 0.003 })
      .rod([0, 0.06, 0.052], [0, 0.12, 0.052], 0.008, 'gold', { noInk: true, parent: 'bag' })
      .ball([0.015, 0.025, 0.006], [0.01, 0.1, 0.053], { color: 'gold', noInk: true, parent: 'bag' })
      .ball([0.015, 0.025, 0.006], [-0.01, 0.09, 0.053], { color: 'gold', noInk: true, parent: 'bag' })
      .ball([0.12, 0.04, 0.1], [0.13, 0.02, 0.08], { color: 'white' })
      .act({ click: [A.pose('bag', { rot: [0, 0, -10], dur: 0.15 }), A.par(A.effect('dust', { dur: 1.5 }), A.say('Poof!', 1)), A.pose('bag', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A wooden window box of petunias and geraniums: the flowers open up.
  e('flower box', 'garden', 'planters', () => {
    const b = m('flower box').box([0.8, 0.18, 0.2], [0, 0.09, 0], { color: '#b8603a', round: 0.15, edge: 'sharp' }).box([0.76, 0.02, 0.17], [0, 0.18, 0], { color: 'dirt' });
    b.box([0.82, 0.03, 0.03], [0, 0.17, 0.1], { color: '#a8502a', edge: 'sharp' });
    ['#d6262b', '#f2d21e', '#ef6f9a', '#8a5fc4', '#f0821e', '#ef6f9a', '#d6262b'].forEach((c, i) => {
      const xx = -0.33 + i * 0.11;
      b.rod([xx, 0.18, 0], [xx, 0.27 + (i % 2) * 0.03, 0.01], 0.012, '#3f7a2f')
        .ball([0.07, 0.03, 0.035], [xx + 0.03, 0.21, 0.03], { color: '#3f7a2f' })
        .ball([0.07, 0.03, 0.035], [xx - 0.03, 0.22, -0.02], { color: '#4f8a3a' })
        .ball(0.06, [xx, 0.29 + (i % 2) * 0.03, 0.01], { color: c, name: `head${i}`, scale: 0.7 })
        .ball(0.02, [xx, 0.29 + (i % 2) * 0.03, 0.04], { color: '#f2d21e', parent: `head${i}` });
    });
    const bloom = (k: number) => A.par(...[0, 1, 2, 3, 4, 5, 6].map((i) => A.pose(`head${i}`, { scale: k, dur: 0.6 })));
    return b.act({ click: [[bloom(1.25), A.effect('sparkle', { dur: 1 })], [bloom(0.7)]] }).done();
  }),
  // A florist's: a pink-and-green awning, buckets of cut flowers on a tiered stand by the door, potted shrubs.
  e('flower shop', 'places', 'shops', () => {
    const b = shop('flower shop', { w: 6, d: 5, h: 4.4, wall: '#f8e8f0', trim: '#4f8a5a', sign: 'FLOWERS', signC: 'white', signBg: '#4f8a5a', awning: ['#ef6f9a', '#f8f0f4'], frame: '#4f8a5a' });
    const fz = 2.5;
    b.pair((s) => {
      for (let t = 0; t < 2; t++) b.box([1.5, 0.08, 0.4], [s * 1.9, 0.35 + t * 0.4, fz + 0.9 - t * 0.35], { color: '#a8743e' });
      b.pair((k) => void b.stick([s * 1.9 + k * 0.7, 0, fz + 1.05], [s * 1.9 + k * 0.7, 0.8, fz + 0.55], 0.04, '#a8743e'));
      for (let i = 0; i < 3; i++) {
        const cx = s * 1.9 + (i - 1) * 0.45;
        for (let t = 0; t < 2; t++) {
          const y = 0.39 + t * 0.4, z = fz + 0.9 - t * 0.35;
          b.cyl([0.24, 0.24, 0.24], [cx, y + 0.12, z], { color: '#9aa0a8', taper: 1.15 });
          const c = ['#d6262b', '#f2d21e', '#ef6f9a', '#8a5fc4', '#f0821e', 'white'][(i + t * 3 + (s > 0 ? 0 : 2)) % 6];
          b.ball([0.3, 0.2, 0.26], [cx, y + 0.36, z], { color: c, edge: 'soft' });
        }
      }
    });
    b.pair((s) => void b.cyl([0.4, 0.45, 0.4], [s * 3.4, 0.22, fz + 0.4], { color: '#c06a40', taper: 1.2 }).ball([0.6, 0.8, 0.6], [s * 3.4, 0.85, fz + 0.4], { color: '#3f7a2f', edge: 'soft' }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.say('Ding-dong!', 1.5), A.spawn('posy', 'flower', { rel: 'front', of: 'self', dist: 'close' })), A.effect('hearts', { id: 'posy', dur: 1.5 }), A.wait(1.5), A.par(A.remove('posy', 'fade'), A.operate('door', 'close'))],
        ],
      })
      .done();
  }),
  // A raised flowerbed (2 m x 1 m) edged in timber: rows of tulips and daisies that open in the sun.
  e('flowerbed', 'garden', 'beds', () => {
    const b = m('flowerbed');
    b.box([2.0, 0.2, 1.0], [0, 0.1, 0], { color: '#7a5030', round: 0.1, edge: 'sharp' }).box([1.9, 0.03, 0.9], [0, 0.2, 0], { color: 'dirt' });
    const cols = ['#d6262b', '#f2d21e', '#ef6f9a', '#8a5fc4', '#f0821e', 'white'];
    for (let i = 0; i < 18; i++) {
      const xx = -0.8 + (i % 6) * 0.32, zz = -0.3 + Math.floor(i / 6) * 0.3, h = 0.42 + ((i * 7) % 3) * 0.05;
      b.rod([xx, 0.2, zz], [xx, h, zz], 0.02, '#3f7a2f');
      b.ball([0.1, 0.04, 0.05], [xx + 0.05, 0.27, zz], { color: '#4f8a3a', rot: [0, 0, 25] });
      b.ball([0.12, 0.13, 0.12], [xx, h + 0.04, zz], { color: cols[(i + Math.floor(i / 6)) % 6], name: `head${i}`, scale: 0.75 });
    }
    const bloom = (k: number) => A.par(...[0, 2, 4, 7, 9, 11, 12, 14, 16, 17].map((i) => A.pose(`head${i}`, { scale: k, dur: 0.6 })));
    return b.act({ click: [[bloom(1.2), A.effect('sparkle', { dur: 1.5 })], [bloom(0.75)]] }).done();
  }),
  // A terracotta pot with a red geranium: it blooms.
  e('flowerpot', 'garden', 'planters', () =>
    m('flowerpot')
      .cyl([0.15, 0.15, 0.15], [0, 0.075, 0], { color: '#c06a40', taper: 1.3, edge: 'sharp' })
      .cyl([0.21, 0.04, 0.21], [0, 0.16, 0], { color: '#c06a40', edge: 'sharp' })
      .cyl([0.18, 0.01, 0.18], [0, 0.178, 0], { color: 'dirt' })
      .cyl([0.16, 0.012, 0.16], [0, 0.006, 0], { color: '#a8502a', edge: 'sharp' })
      .rod([0, 0.18, 0], [0, 0.3, 0], 0.012, '#3f7a2f')
      .ball([0.08, 0.025, 0.04], [0.04, 0.22, 0], { color: '#3f7a2f', rot: [0, 0, 20] })
      .ball([0.08, 0.025, 0.04], [-0.04, 0.24, 0.01], { color: '#4f8a3a', rot: [0, 0, -20] })
      .ball(0.08, [0, 0.32, 0], { color: '#d6262b', name: 'head', scale: 0.6 })
      .ball(0.025, [0, 0.32, 0.035], { color: '#f2d21e', parent: 'head' })
      .act({ click: [[A.pose('head', { scale: 1.1, dur: 0.8 }), A.effect('sparkle', { dur: 1 })], [A.pose('head', { scale: 0.6, dur: 0.6 })]] })
      .done(),
  ),
  // A silver concert flute (0.67 m) on its stand: lip plate, a row of keys and rods: it plays a trill.
  e('flute', 'music', 'woodwinds', () => {
    const b = m('flute', { edge: 'sharp' }).cyl([0.18, 0.03, 0.18], [0, 0.015, 0], { color: '#1e1e1e' });
    for (const [px, pz] of around(3, 0.08)) b.rod([px, 0.02, pz], [0, 0.1, 0], 0.012, '#1e1e1e');
    b.cone([0.03, 0.12, 0.03], [0, 0.14, 0], { color: '#1e1e1e' })
      .cyl([0.022, 0.68, 0.022], [0, 0.45, 0], { color: '#dfe5ea', name: 'flute' })
      .cyl([0.026, 0.02, 0.026], [0, 0.8, 0], { color: '#c8ccd2', parent: 'flute' })
      .box([0.02, 0.03, 0.01], [0, 0.73, 0.013], { color: '#c8ccd2', round: 0.4, parent: 'flute' })
      .stick([0.012, 0.2, 0.01], [0.012, 0.6, 0.01], 0.005, '#c8ccd2', { parent: 'flute' });
    b.each(10, (i) => void b.cyl([0.015, 0.006, 0.015], [0, 0.2 + i * 0.042, 0.014], { color: '#c8ccd2', rot: [90, 0, 0], parent: 'flute' }));
    return b.act({ click: [A.par(A.say('♪ Toodle-oodle-oo ♪', 2.5), A.effect('sparkle', { dur: 2 }), A.pose('flute', { rot: [0, 0, 4], dur: 0.4 })), A.pose('flute', { rot: [0, 0, -4], dur: 0.6 }), A.pose('flute', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A fly swatter: a wire handle and a perforated plastic paddle: it swats.
  e('fly swatter', 'home', 'cleaning', () => {
    const b = m('fly swatter', { edge: 'sharp' })
      .capsule([0.032, 0.12, 0.032], [0, 0.06, 0], { color: '#d6262b', name: 'swatter', pivot: [0, 0.02, 0] })
      .stick([0, 0.12, 0], [0, 0.38, 0], 0.007, 'silver', { parent: 'swatter' })
      .box([0.11, 0.13, 0.008], [0, 0.44, 0], { color: '#f2d21e', round: 0.2, parent: 'swatter' });
    b.each(4, (i) => void b.box([0.004, 0.12, 0.01], [-0.045 + i * 0.03, 0.44, 0], { color: '#c8a020', noInk: true, parent: 'swatter' }).box([0.1, 0.004, 0.01], [0, 0.395 + i * 0.03, 0], { color: '#c8a020', noInk: true, parent: 'swatter' }));
    return b.act({ click: [A.pose('swatter', { rot: [25, 0, 0], dur: 0.25 }), A.pose('swatter', { rot: [-80, 0, 0], dur: 0.1 }), A.say('SWAT!', 1.2), A.pose('swatter', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A two-seat flying car at road-car size (4.6 m long): a lofted body with a glass canopy over two seats, four
  // ducted fans on short arms, wheels that tuck up, head and tail lights. The fans spin up and it lifts off.
  e('flying car', 'garage', 'cars', () => {
    const b = m('flying car', { view: 'side' });
    const teal = '#2a8a8a';
    b.loft([1.8, 1.05, 4.6], [0, 0.9, 0], [[0, 0.75, 0.55, 0.05], [0.12, 0.92, 0.75, 0.0], [0.5, 1, 0.8, -0.05], [0.85, 0.92, 0.6, -0.12], [1, 0.55, 0.35, -0.18]], { color: teal, boxy: 0.5, name: 'body' })
      .loft([1.4, 0.95, 2.3], [0, 1.25, -0.15], [[0, 0.6, 0.3, 0], [0.25, 0.95, 0.9, 0], [0.7, 0.95, 0.9, 0], [1, 0.4, 0.2, -0.1]], { color: '#6fa8c8', cut: 'top', parent: 'body', edge: 'sharp' })
      .box([0.6, 0.3, 0.6], [0.32, 0.95, 0.1], { color: '#3a3633', parent: 'body', round: 0.4 })
      .box([0.6, 0.3, 0.6], [-0.32, 0.95, 0.1], { color: '#3a3633', parent: 'body', round: 0.4 })
      .box([1.3, 0.06, 0.06], [0, 0.95, 2.25], { color: '#d8dce2', parent: 'body', edge: 'sharp' });
    b.pair((s) => {
      b.box([0.36, 0.12, 0.06], [s * 0.6, 0.98, 2.24], { color: '#fff6c8', glow: true, parent: 'body', name: s > 0 ? 'headlightL' : 'headlightR', mover: { kind: 'light', on: false }, edge: 'sharp' });
      b.box([0.3, 0.1, 0.06], [s * 0.65, 1.05, -2.28], { color: '#ff3b2e', glow: true, parent: 'body', edge: 'sharp' });
      for (const z of [1.55, -1.55]) {
        const k = `${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`;
        b.stick([s * 0.8, 0.95, z * 0.8], [s * 1.25, 0.95, z], 0.12, '#c8ccd2', { parent: 'body', edge: 'sharp' })
          .torus([0.95, 0.95, 0.22], [s * 1.45, 0.95, z], { color: teal, rot: [90, 0, 0], tube: 0.12, parent: 'body' })
          .cyl([0.85, 0.06, 0.85], [s * 1.45, 0.95, z], { color: '#3a3d42', parent: 'body', name: `prop${k}`, mover: { kind: 'spin', axis: 'y', amount: 1500 }, edge: 'sharp' })
          .box([0.8, 0.02, 0.1], [s * 1.45, 0.97, z], { color: '#c8ccd2', parent: `prop${k}`, edge: 'sharp' })
          .cyl([0.15, 0.1, 0.15], [s * 1.45, 0.95, z], { color: '#c8ccd2', parent: 'body', edge: 'sharp' });
      }
      for (const z of [1.4, -1.3]) wheel(b, `wheel${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`, [s * 0.72, 0.3, z], 0.6, 0.2, 'silver', { parent: 'body' });
    });
    // everything hangs off the body, so the whole car lifts as one
    return b.socket('seat', [0.32, 1.1, 0.1], 'seat', { part: 'body' }).act({
      click: [
        [A.par(A.operate('prop', 'on'), A.operate('headlight', 'on'), A.say('Hmmmmmmm...', 2)), A.par(A.pose('body', { move: [0, 1.6, 0], dur: 1.5 }), A.effect('dust', { dur: 1.5 })), A.wait(1.5)],
        [A.pose('body', { move: [0, 0, 0], dur: 1.5 }), A.par(A.operate('prop', 'off'), A.operate('headlight', 'off'))],
      ],
    }).done();
  }),
  // A mound of soap foam, bubbles of every size: they pop and froth up again.
  e('foam', 'home', 'cleaning', () => {
    const b = m('foam');
    const B: Array<[number, V]> = [[0.07, [0, 0.035, 0]], [0.06, [0.05, 0.03, 0.02]], [0.055, [-0.05, 0.028, 0.01]], [0.05, [0.02, 0.07, -0.01]], [0.045, [-0.025, 0.065, 0.02]], [0.04, [0.035, 0.03, -0.045]], [0.04, [-0.03, 0.03, -0.04]], [0.035, [0, 0.1, 0]], [0.03, [0.08, 0.018, -0.01]]];
    B.forEach(([d, at], i) => void b.ball(d, at, { color: i % 3 ? 'white' : '#e0f0ff', ...(i >= 3 ? { name: `bubble${i}` } : {}) }));
    const pop = (k: number) => A.par(...[3, 4, 7, 8].map((i) => A.pose(`bubble${i}`, { scale: k, dur: k ? 0.6 : 0.08 })));
    return b.act({ click: [[pop(0), A.say('Pop pop pop!', 1.5)], [pop(1), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // Soft foam play blocks: a big yellow brick, a blue arch roof and a red cube on top that topples off.
  e('foam block', 'toys', 'blocks', () => {
    const b = m('foam block').box([0.4, 0.2, 0.25], [0, 0.1, 0], { color: '#f2d21e', round: 0.35 });
    b.each(8, (i) => void b.ball(0.012, [-0.15 + (i % 4) * 0.1, 0.05 + Math.floor(i / 4) * 0.08, 0.125], { color: '#d8b820', noInk: true }));
    return b
      .wedge([0.3, 0.16, 0.24], [-0.05, 0.28, 0], { color: '#2a6ab0' })
      .box([0.12, 0.12, 0.12], [0.13, 0.26, 0.0], { color: '#d6262b', round: 0.35, name: 'cube', pivot: [0.19, 0.2, 0] })
      .act({ click: [[A.pose('cube', { rot: [0, 0, -90], move: [0.08, -0.14, 0.05], dur: 0.5 }), A.say('Boing!', 1)], [A.pose('cube', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.5 })]] })
      .done();
  }),
  // A pair of foam darts with orange suction tips: one shoots off and boings back.
  e('foam dart', 'toys', 'toy guns', () =>
    m('foam dart')
      .cyl([0.015, 0.07, 0.015], [0, 0.035, 0], { color: '#2a6ab0', name: 'dart' })
      .cyl([0.016, 0.014, 0.016], [0, 0.077, 0], { color: '#f0821e', parent: 'dart' })
      .ball([0.016, 0.01, 0.016], [0, 0.084, 0], { color: '#f0821e', parent: 'dart' })
      .cyl([0.015, 0.07, 0.015], [0.07, 0.0075, 0.05], { color: '#2a6ab0', rot: [0, 30, 90] })
      .cyl([0.016, 0.014, 0.016], [0.108, 0.0075, 0.072], { color: '#f0821e', rot: [0, 30, 90] })
      .act({ click: [A.pose('dart', { move: [0, 0.5, 0], dur: 0.3 }), A.say('Fwip!', 1), A.pose('dart', { move: [0, 0, 0], dur: 0.4 }), A.anim('hop')] })
      .done(),
  ),
  // A foam dart blaster: a priming slide on top, a six-shot cylinder, an orange muzzle: a dart flies out.
  e('foam dart gun', 'toys', 'toy guns', () =>
    m('foam dart gun', { view: 'side' })
      .box([0.07, 0.12, 0.42], [0, 0.22, 0.02], { color: '#2a6ab0', round: 0.4 })
      .box([0.06, 0.16, 0.07], [0, 0.09, -0.08], { color: '#f0821e', rot: [-15, 0, 0], round: 0.4 })
      .cyl([0.06, 0.24, 0.06], [0, 0.24, 0.32], { color: '#2a6ab0', rot: [90, 0, 0] })
      .cyl([0.065, 0.03, 0.065], [0, 0.24, 0.45], { color: '#f0821e', rot: [90, 0, 0] })
      .prism([0.12, 0.1, 0.12], [0, 0.22, 0.1], 6, { color: '#f0821e', rot: [90, 0, 0], name: 'drum' })
      .box([0.06, 0.1, 0.16], [0, 0.18, -0.25], { color: '#f0821e', round: 0.4 })
      .box([0.05, 0.05, 0.12], [0, 0.31, -0.02], { color: '#f2d21e', round: 0.4, name: 'slide', mover: { kind: 'slide', axis: 'z', amount: -0.08 } })
      .torus([0.07, 0.07, 0.015], [0, 0.12, 0.0], { color: '#2a6ab0', rot: [0, 90, 0] })
      .cyl([0.015, 0.07, 0.015], [0, 0.24, 0.42], { color: '#2a6ab0', rot: [90, 0, 0], name: 'dart', scale: 0 })
      .act({ click: [A.operate('slide', 'out'), A.operate('slide', 'in'), A.pose('drum', { rot: [0, 0, 60], dur: 0.2 }), A.pose('dart', { scale: 1, dur: 0.05 }), A.par(A.pose('dart', { move: [0, 0.3, 4], dur: 0.6 }), A.say('Fwoomp!', 1.2)), A.par(A.pose('dart', { scale: 0, move: [0, 0, 0], dur: 0.05 }), A.pose('drum', { rot: [0, 0, 0], dur: 0 }))] })
      .done(),
  ),
  // A giant foam "#1" hand, index finger up, on a fan's arm-sized cuff: it waves.
  e('foam finger', 'sports', 'fan gear', () =>
    m('foam finger')
      .cyl([0.16, 0.14, 0.1], [0, 0.07, 0], { color: '#2a5ab0', name: 'hand', pivot: [0, 0, 0] })
      .box([0.24, 0.2, 0.09], [0, 0.23, 0], { color: '#2a5ab0', round: 0.45, parent: 'hand' })
      .capsule([0.075, 0.26, 0.08], [0.04, 0.44, 0], { color: '#2a5ab0', parent: 'hand' })
      .capsule([0.06, 0.12, 0.07], [-0.13, 0.27, 0.01], { color: '#2a5ab0', rot: [0, 0, 40], parent: 'hand' })
      .box([0.2, 0.06, 0.08], [-0.03, 0.33, 0.015], { color: '#2a5ab0', round: 0.6, parent: 'hand' })
      .label('#1', [0.14, 0.09], [0, 0.22, 0.05], { color: '#f2d21e', parent: 'hand', depth: 0.01 })
      .act({ click: [A.pose('hand', { rot: [0, 0, 15], dur: 0.25 }), A.say('Woo! Go team!', 1.5), A.pose('hand', { rot: [0, 0, -15], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 15], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 0], dur: 0.25 })] })
      .done(),
  ),
  // A lighthouse diaphone fog horn: a red trumpet on a pedestal with its air tank: BWAAAMP.
  e('fog horn', 'sea', 'seaside things', () =>
    m('fog horn', { edge: 'sharp' })
      .box([0.4, 0.12, 0.4], [0, 0.06, 0], { color: '#5a5f66', round: 0.1 })
      .cyl([0.18, 0.3, 0.18], [0, 0.27, -0.08], { color: '#9aa0a8' })
      .stick([0, 0.4, -0.08], [0, 0.48, -0.08], 0.08, '#5a5f66')
      .cyl([0.12, 0.3, 0.12], [0, 0.52, -0.2], { color: '#c8262e', rot: [90, 0, 0], name: 'horn' })
      .cyl([0.12, 0.45, 0.12], [0, 0.52, 0.17], { color: '#c8262e', rot: [90, 0, 0], taper: 3.4, parent: 'horn' })
      .cyl([0.38, 0.02, 0.38], [0, 0.52, 0.4], { color: '#2a1a1a', rot: [90, 0, 0], parent: 'horn' })
      .act({ click: [A.par(A.say('BWAAAAAAMP!', 2.5), A.anim('shake', 3), A.effect('steam', { dur: 2 }), A.pose('horn', { scale: 1.06, dur: 0.2 })), A.pose('horn', { scale: 1, dur: 0.4 })] })
      .done(),
  ),
  // A manila file folder standing up, papers inside, a tab with a label: the front cover swings open.
  e('folder', 'study', 'office supplies', () =>
    m('folder', { edge: 'sharp' })
      .box([0.24, 0.29, 0.004], [0, 0.145, -0.012], { color: '#e8c878', round: 0.05 })
      .box([0.08, 0.025, 0.004], [-0.07, 0.3, -0.012], { color: '#e8c878', round: 0.2 })
      .label('TAXES', [0.07, 0.016], [-0.07, 0.3, -0.009], { color: 'white', depth: 0.002 })
      .box([0.22, 0.27, 0.012], [0.005, 0.14, -0.003], { color: 'white', round: 0.02 })
      .box([0.24, 0.29, 0.004], [0, 0.145, 0.006], { color: '#f0d488', round: 0.05, name: 'cover', pivot: [-0.12, 0.145, 0.006], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip!', 1)], [A.operate('cover', 'close')]] })
      .done(),
  ),
  // A steel folding chair (seat at 0.45 m): the seat swings up and the legs close flat, then it opens again.
  e('folding chair', 'home', 'seating', () => {
    const b = m('folding chair', { edge: 'sharp' })
      .box([0.42, 0.04, 0.4], [0, 0.45, 0.02], { color: '#5a6470', round: 0.4, name: 'seat', pivot: [0, 0.45, -0.18], mover: { kind: 'swing', axis: 'x', amount: -80 } })
      .box([0.4, 0.22, 0.03], [0, 0.76, -0.21], { color: '#5a6470', rot: [-8, 0, 0], round: 0.3 });
    b.pair((s) => {
      b.stick([s * 0.21, 0, 0.25], [s * 0.21, 0.88, -0.22], 0.022, 'silver');
      b.stick([s * 0.2, 0, -0.24], [s * 0.2, 0.45, 0.1], 0.022, 'silver', { name: s > 0 ? 'legL' : 'legR', pivot: [s * 0.2, 0.32, -0.02] });
      b.box([0.04, 0.025, 0.05], [s * 0.21, 0.012, 0.25], { color: '#1e1e1e' });
    });
    b.socket('seat', [0, 0.47, 0.02], 'seat');
    const fold = (k: number) => A.par(A.operate('seat', k ? 'open' : 'close'), A.pose('legL', { rot: [k * 30, 0, 0], dur: 0.5 }), A.pose('legR', { rot: [k * 30, 0, 0], dur: 0.5 }));
    return b.act({ click: [[fold(1), A.say('Clack!', 1)], [fold(0), A.say('Clack!', 1)]] }).done();
  }),
  // A paper folding fan on bamboo ribs: it snaps shut and fans open again.
  e('folding fan', 'wardrobe', 'accessories', () => {
    const b = m('folding fan').ball(0.02, [0, 0.03, 0.01], { color: 'gold', edge: 'sharp' });
    for (let i = 0; i < 9; i++) {
      const a = -72 + i * 18, r = (a * Math.PI) / 180, n = `rib${i}`;
      b.box([0.05, 0.16, 0.003], [Math.sin(r) * 0.12, 0.03 + Math.cos(r) * 0.12, 0], { color: i % 2 ? '#c8262e' : '#e85060', rot: [0, 0, -a], round: 0.1, name: n, pivot: [0, 0.03, 0], edge: 'sharp' });
      b.stick([0, 0.03, 0.004], [Math.sin(r) * 0.06, 0.03 + Math.cos(r) * 0.06, 0.004], 0.006, '#5a3a22', { parent: n });
    }
    b.ball([0.05, 0.035, 0.004], [0.045, 0.16, 0.003], { color: '#f2d21e', noInk: true, parent: 'rib5' });
    const fan = (k: number) => A.par(...Array.from({ length: 9 }, (_, i) => A.pose(`rib${i}`, { rot: [0, 0, k * (-72 + i * 18)], dur: 0.35 })));
    return b.act({ click: [fan(1), A.say('Snap!', 1), fan(0)] }).done();
  }),
  // A four-panel shoji screen (1.8 m): dark frames over rice paper with a lattice; the end panels fold in.
  e('folding screen', 'home', 'furniture', () => {
    const b = m('folding screen', { edge: 'sharp' });
    for (let i = 0; i < 4; i++) {
      const xx = -0.69 + i * 0.46, zz = i % 2 ? 0.08 : -0.08, ry = i % 2 ? -20 : 20, n = `panel${i}`;
      const hinge: V = [i < 2 ? xx + 0.22 : xx - 0.22, 0.95, zz];
      b.box([0.48, 1.78, 0.04], [xx, 0.95, zz], { color: '#3a2618', rot: [0, ry, 0], round: 0.05, name: n, pivot: i === 0 || i === 3 ? hinge : [xx, 0.95, zz] });
      b.box([0.4, 1.6, 0.045], [xx, 0.97, zz], { color: '#f6efe0', rot: [0, ry, 0], round: 0.02, parent: n });
      for (const y of [0.55, 0.97, 1.39]) b.box([0.4, 0.015, 0.05], [xx, y, zz], { color: '#3a2618', rot: [0, ry, 0], noInk: true, parent: n });
      b.box([0.015, 1.6, 0.05], [xx, 0.97, zz], { color: '#3a2618', rot: [0, ry, 0], noInk: true, parent: n });
      b.box([0.48, 0.06, 0.06], [xx, 0.06, zz], { color: '#3a2618', rot: [0, ry, 0], parent: n });
    }
    return b.act({ click: [[A.par(A.pose('panel0', { rot: [0, -120, 0], dur: 0.7 }), A.pose('panel3', { rot: [0, 120, 0], dur: 0.7 })), A.say('Swish.', 1)], [A.par(A.pose('panel0', { rot: [0, 0, 0], dur: 0.7 }), A.pose('panel3', { rot: [0, 0, 0], dur: 0.7 }))]] }).done();
  }),
  // A 1.8 m folding trestle table: its legs fold flat under the top and it sinks to the ground, then stands again.
  e('folding table', 'home', 'furniture', () => {
    const b = m('folding table', { edge: 'sharp' })
      .box([1.8, 0.04, 0.75], [0, 0.73, 0], { color: '#e8e4dc', round: 0.3, name: 'top' })
      .box([1.78, 0.05, 0.73], [0, 0.69, 0], { color: '#5a5f66', round: 0.2, parent: 'top' });
    b.pair((s) => {
      const n = s > 0 ? 'legsL' : 'legsR';
      b.stick([s * 0.78, 0.67, -0.32], [s * 0.78, 0.67, 0.32], 0.03, '#3a3d42', { name: n, parent: 'top', pivot: [s * 0.78, 0.67, 0] });
      b.pair((k) => void b.stick([s * 0.78, 0.67, k * 0.3], [s * 0.78, 0.0, k * 0.3], 0.03, '#3a3d42', { parent: n }));
      b.stick([s * 0.78, 0.05, -0.3], [s * 0.78, 0.05, 0.3], 0.025, '#3a3d42', { parent: n });
    });
    b.socket('top', [0, 0.76, 0], 'top', { part: 'top', size: 1.2 });
    const fold = (k: number) => A.par(A.pose('legsL', { rot: [0, 0, -k * 88], dur: 0.6 }), A.pose('legsR', { rot: [0, 0, k * 88], dur: 0.6 }), A.pose('top', { move: [0, -k * 0.64, 0], dur: 0.6 }));
    return b.act({ click: [[fold(1), A.say('Clunk!', 1)], [fold(0), A.say('Clack!', 1)]] }).done();
  }),
  // A dinner plate: a steak, a scoop of mash with butter, peas and carrots: it steams and the steak gets eaten.
  e('food', 'food', 'meals', () => {
    const b = m('food');
    plate(b, 0.27);
    return b
      .box([0.1, 0.025, 0.07], [-0.03, 0.026, -0.02], { color: '#7a3a20', round: 0.45, name: 'steak' })
      .box([0.02, 0.003, 0.06], [-0.04, 0.04, -0.02], { color: '#4a2010', noInk: true, parent: 'steak', rot: [0, 30, 0] })
      .ball([0.08, 0.05, 0.07], [0.06, 0.035, -0.03], { color: '#f4ecc0' })
      .box([0.02, 0.008, 0.02], [0.06, 0.062, -0.03], { color: '#ffe680', round: 0.5 })
      .each(7, (i) => void b.ball(0.014, [0.02 + (i % 4) * 0.016, 0.017, 0.05 + Math.floor(i / 4) * 0.015], { color: '#5aa02a' }))
      .each(4, (i) => void b.capsule([0.012, 0.04, 0.012], [-0.07 + i * 0.016, 0.017, 0.06], { color: '#f0821e', rot: [90, 0, 20] }))
      .act({ click: [[A.effect('steam', { dur: 2 }), A.say('Mmm!', 1.5)], [A.pose('steak', { scale: 0, dur: 0.6 }), A.say('Yum!', 1)], [A.pose('steak', { scale: 1, dur: 0.4 })]] })
      .done();
  }),
  // A taco truck: a step van at real size (6.6 m long, 3.1 m tall) with a cab and windscreen, a big serving
  // hatch whose awning swings up over a steel counter, a menu board, roof vents that steam; an order comes up.
  e('food truck', 'garage', 'trucks', () => {
    const b = m('food truck', { view: 'side', edge: 'sharp' });
    const yel = '#f0b830';
    b.box([2.4, 2.5, 4.8], [0, 1.85, -0.75], { color: yel, round: 0.08 })
      .box([2.3, 1.7, 1.6], [0, 1.45, 2.4], { color: yel, round: 0.2 })
      .loft([2.3, 1.0, 1.6], [0, 2.3, 2.4], [[0, 1, 1, 0], [0.6, 1, 0.9, -0.05], [1, 0.95, 0.4, -0.3]], { color: yel, boxy: 0.8, cut: 'bottom' })
      .box([2.1, 0.75, 0.06], [0, 2.05, 3.22], { color: '#2f3d52', rot: [-12, 0, 0], round: 0.1 })
      .box([2.42, 0.25, 6.6], [0, 0.85, 0.1], { color: '#d6262b', round: 0.2 })
      .box([2.5, 0.3, 0.3], [0, 0.55, 3.3], { color: 'silver', round: 0.3 })
      .box([1.6, 0.4, 0.06], [0, 1.0, 3.22], { color: 'silver' })
      .pair((s) => {
        b.box([0.35, 0.22, 0.06], [s * 0.85, 1.05, 3.23], { color: '#fff6c8', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light', on: false } });
        b.box([0.06, 0.65, 0.9], [s * 1.155, 2.0, 2.45], { color: '#2f3d52', round: 0.1 });
        b.box([0.2, 0.18, 0.06], [s * 0.95, 1.2, -3.17], { color: '#ff3b2e', glow: true });
      })
      // the serving side: hatch, counter, awning
      .box([0.04, 1.2, 3.0], [1.2, 2.0, -0.8], { color: '#2a2726', round: 0.05 })
      .box([0.04, 0.6, 2.6], [1.18, 1.95, -0.8], { color: '#c8ccd2' })
      .box([0.5, 0.08, 3.0], [1.4, 1.38, -0.8], { color: 'silver', round: 0.2 })
      .box([0.06, 1.25, 3.1], [1.24, 2.62, -0.8], { color: '#d6262b', round: 0.1, name: 'awning', pivot: [1.24, 3.25, -0.8], mover: { kind: 'swing', axis: 'z', amount: 75 } })
      .label('TACOS', [0.03, 0.6], [1.28, 2.62, -0.8], { color: '#d6262b', rot: [0, 90, 90], parent: 'awning', depth: 0.02 })
      .label('TACOS  BURRITOS  NACHOS', [3.2, 0.5], [1.22, 3.35, -0.75], { color: '#2a2726', rot: [0, 90, 0], depth: 0.02 })
      .box([0.04, 0.5, 0.8], [1.21, 1.0, -2.6], { color: '#2a2726', round: 0.1 })
      .box([0.8, 0.25, 0.8], [0, 3.22, -1.6], { color: '#c8ccd2', round: 0.3 })
      .cyl([0.25, 0.5, 0.25], [0.6, 3.35, -2.6], { color: '#9aa0a8' })
      .socket('counter', [1.45, 1.43, -0.8], 'top', { size: 0.4 });
    for (const [z, n] of [[2.4, 'F'], [-2.3, 'B']] as const) b.pair((s) => void wheel(b, `wheel${n}${s > 0 ? 'L' : 'R'}`, [s * 1.08, 0.48, z], 0.95, 0.3, 'silver'));
    return b
      .act({
        click: [
          [A.operate('awning', 'open'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Ding! Order up!', 2)), A.spawn('order', 'fries'), A.attach('order', 'self', 'counter')],
          [A.remove('order', 'pop'), A.operate('awning', 'close'), A.par(A.operate('light', 'on'), A.say('Honk honk!', 1.5)), A.wait(1), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A foosball table: a green pitch with goals at each end, four rods of red and blue players with handles; a rod
  // spins and the ball shoots into the goal.
  e('foosball', 'toys', 'games', () => {
    const b = m('foosball', { edge: 'sharp' })
      .box([1.2, 0.22, 0.72], [0, 0.82, 0], { color: '#5a3a22', round: 0.1 })
      .box([1.12, 0.02, 0.64], [0, 0.93, 0], { color: '#3f8a3a', noInk: true })
      .box([0.02, 0.003, 0.6], [0, 0.942, 0], { color: 'white', noInk: true })
      .ball(0.035, [0.1, 0.96, 0.05], { color: 'white', name: 'ball' });
    b.pair((s) => void b.box([0.03, 0.08, 0.22], [s * 0.6, 0.86, 0], { color: '#1e1e1e' }));
    for (const [px, pz] of [[0.55, 0.3], [-0.55, 0.3], [0.55, -0.3], [-0.55, -0.3]] as const) b.box([0.08, 0.72, 0.08], [px, 0.36, pz], { color: '#5a3a22' });
    b.each(4, (i) => {
      const xx = -0.42 + i * 0.28, c = i % 2 ? '#2a5ab0' : '#d6262b', n = `rod${i}`;
      b.stick([xx, 0.97, -0.62], [xx, 0.97, 0.62], 0.016, 'silver', { name: n });
      b.each(3, (j) => void b.box([0.035, 0.1, 0.04], [xx, 0.94, -0.2 + j * 0.2], { color: c, round: 0.4, parent: n }));
      b.capsule([0.04, 0.12, 0.04], [xx, 0.97, 0.7], { color: '#1e1e1e', rot: [90, 0, 0], parent: n });
    });
    return b.act({ click: [A.pose('rod2', { rot: [0, 0, 360], dur: 0.3 }), A.pose('ball', { move: [0.48, 0, -0.05], dur: 0.3 }), A.par(A.say('GOAL!', 1.5), A.effect('sparkle', { dur: 1 })), A.pose('rod2', { rot: [0, 0, 0], dur: 0 }), A.pose('ball', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A bare foot, standing, with its ankle: the toes wiggle.
  e('foot', 'clinic', 'body parts', () => {
    const b = m('foot').ball([0.11, 0.075, 0.26], [0, 0.0375, 0.03], { color: 'skin3' }).cyl([0.08, 0.16, 0.09], [0, 0.12, -0.05], { color: 'skin3', taper: 0.9 }).ball([0.04, 0.03, 0.03], [0.045, 0.1, -0.05], { color: 'skin3' });
    b.ball([0.03, 0.02, 0.03], [0, 0.04, 0.14], { color: 'skin3', name: 'toes', pivot: [0, 0.03, 0.12] });
    b.each(5, (i) => void b.ball(0.034 - i * 0.004, [-0.035 + i * 0.018, 0.03 - i * 0.002, 0.16 - i * 0.012], { color: 'skin3', parent: 'toes' }));
    return b.act({ click: [A.pose('toes', { rot: [-25, 0, 0], dur: 0.2 }), A.pose('toes', { rot: [5, 0, 0], dur: 0.2 }), A.pose('toes', { rot: [-25, 0, 0], dur: 0.2 }), A.pose('toes', { rot: [0, 0, 0], dur: 0.2 }), A.say('Wiggle!', 1)] }).done();
  }),
  // A size-5 soccer ball, black pentagons on white: it is kicked up and bounces.
  e('football', 'sports', 'balls', () => {
    const b = m('football').ball(0.22, [0, 0.11, 0], { color: 'white', name: 'ball' });
    const f = 1.618;
    const N: V[] = [[0, 1, f], [0, 1, -f], [0, -1, f], [0, -1, -f], [1, f, 0], [-1, f, 0], [1, -f, 0], [-1, -f, 0], [f, 0, 1], [-f, 0, 1], [f, 0, -1], [-f, 0, -1]];
    for (const n of N) {
      const l = Math.hypot(...n), u = n.map((v) => v / l) as V;
      b.prism([0.06, 0.008, 0.06], [u[0] * 0.108, 0.11 + u[1] * 0.108, u[2] * 0.108], 5, { color: '#1e1e1e', noInk: true, parent: 'ball', rot: [(Math.atan2(u[2], u[1]) * 180) / Math.PI, 0, (-Math.asin(u[0]) * 180) / Math.PI] });
    }
    return b.act({ click: [A.par(A.pose('ball', { move: [0, 0.8, 0], rot: [360, 0, 0], dur: 0.5 }), A.say('Boing!', 1)), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }), A.anim('bounce', 2)] }).done();
  }),
  // A gridiron helmet: navy shell with a stripe, ear holes, a grey facemask cage and a chin strap.
  e('football helmet', 'sports', 'protective gear', () => {
    const b = m('football helmet')
      .ball([0.26, 0.24, 0.3], [0, 0.15, -0.02], { color: '#1e2a5a', name: 'shell' })
      .box([0.035, 0.008, 0.29], [0, 0.272, -0.02], { color: 'white', noInk: true, rot: [0, 0, 0], parent: 'shell' })
      .ball(0.05, [0.125, 0.13, 0], { color: '#3a3d42', parent: 'shell' })
      .ball(0.05, [-0.125, 0.13, 0], { color: '#3a3d42', parent: 'shell' })
      .star(0.06, [0.12, 0.2, 0.01], { color: '#f2c14e', rot: [0, 90, 0], parent: 'shell' });
    b.pair((s) => void b.rod([s * 0.11, 0.13, 0.04], [s * 0.06, 0.05, 0.15], 0.014, '#9aa0a8', { parent: 'shell', edge: 'sharp' }));
    b.each(3, (i) => void b.rod([-0.08, 0.04 + i * 0.045, 0.125 + i * 0.008], [0.08, 0.04 + i * 0.045, 0.125 + i * 0.008], 0.013, '#9aa0a8', { parent: 'shell', edge: 'sharp' }));
    b.stick([0, 0.04, 0.15], [0, 0.14, 0.15], 0.013, '#9aa0a8', { parent: 'shell', edge: 'sharp' }).arc([0.1, 0.05, 0.012], [0, 0.02, 0.08], { color: 'white', rot: [180, 0, 0], parent: 'shell' });
    return b.act({ click: [A.pose('shell', { move: [0, 0.08, 0], rot: [-10, 0, 0], dur: 0.2 }), A.say('Hut! Hut! Hike!', 1.5), A.pose('shell', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A 19 cm stainless dinner fork standing on its end, face to the front: one flat lofted blank with a broad
  // rounded handle that narrows to the neck and flares into the head, and four rounded tines with clean gaps. It
  // twirls and rings.
  e('fork', 'kitchen', 'cutlery', () => {
    const b = m('fork', { edge: 'sharp' })
      .loft([0.026, 0.004, 0.15], [0, 0.075, 0], [[0, 0.62, 1, 0], [0.05, 0.82, 1, 0], [0.3, 0.78, 0.95, 0], [0.55, 0.5, 0.85, 0], [0.66, 0.34, 0.8, 0], [0.74, 0.36, 0.8, 0], [0.86, 0.72, 0.8, 0], [1, 1, 0.8, 0]], { color: 'silver', boxy: 0.85, rot: [-90, 0, 0], name: 'fork', pivot: [0, 0.095, 0] });
    b.each(4, (i) => void b.box([0.0042, 0.048, 0.0032], [-0.0108 + i * 0.0072, 0.172, 0], { color: 'silver', round: 0.5, parent: 'fork' }));
    return b.act({ click: [A.pose('fork', { rot: [0, 720, 0], dur: 1 }), A.pose('fork', { rot: [0, 0, 0], dur: 0 }), A.say('Ting!', 1)] }).done();
  }),
  // A counterbalance forklift at real size: counterweight, a seat under the overhead guard, steering wheel, a
  // tilting mast with the carriage and forks carrying a pallet of boxes, which rise up the mast; a beacon flashes.
  e('forklift', 'garage', 'work vehicles', () => {
    const b = m('forklift', { view: 'side', edge: 'sharp' });
    const yel = '#f0b020';
    b.box([1.15, 0.75, 1.9], [0, 0.72, -0.15], { color: yel, round: 0.15 })
      .loft([1.15, 0.9, 0.7], [0, 0.75, -1.3], [[0, 0.8, 0.8, 0], [0.5, 1, 1, 0], [1, 1, 1, 0]], { color: '#3a3633', boxy: 0.8 })
      .box([0.55, 0.12, 0.5], [0, 1.18, -0.4], { color: '#1e1e1e', round: 0.4, edge: 'soft' })
      .box([0.55, 0.5, 0.12], [0, 1.45, -0.66], { color: '#1e1e1e', round: 0.4, edge: 'soft' })
      .rod([0, 1.1, 0.3], [0, 1.45, 0.05], 0.05, '#1e1e1e')
      .torus([0.36, 0.36, 0.04], [0, 1.47, 0.03], { color: '#1e1e1e', rot: [60, 0, 0] })
      .box([1.15, 0.06, 1.5], [0, 2.15, -0.25], { color: '#3a3633', round: 0.1 })
      .each(4, (i) => void b.box([0.04, 0.04, 1.4], [-0.45 + i * 0.3, 2.2, -0.25], { color: '#3a3633' }))
      .ball(0.12, [0.4, 2.25, -0.85], { color: '#ff9a2a', glow: true, name: 'beacon', mover: { kind: 'light', on: false } })
      .socket('seat', [0, 1.25, -0.4], 'seat');
    b.pair((s) => {
      b.stick([s * 0.52, 1.1, 0.55], [s * 0.52, 2.15, 0.45], 0.07, '#3a3633').stick([s * 0.52, 1.1, -0.95], [s * 0.52, 2.15, -0.95], 0.07, '#3a3633');
      b.box([0.1, 2.5, 0.12], [s * 0.36, 1.3, 0.9], { color: '#3a3d42', round: 0.1 });
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}F`, [s * 0.5, 0.33, 0.45], 0.66, 0.28, 'silver');
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}B`, [s * 0.5, 0.28, -1.0], 0.56, 0.24, 'silver');
    });
    b.stick([-0.36, 2.5, 0.9], [0.36, 2.5, 0.9], 0.1, '#3a3d42')
      .box([0.9, 0.5, 0.08], [0, 0.4, 1.02], { color: '#2a2c30', round: 0.1, name: 'carriage', mover: { kind: 'slide', axis: 'y', amount: 1.6 } })
      .pair((s) => void b.box([0.1, 0.05, 1.1], [s * 0.25, 0.12, 1.6], { color: '#5a5f66', parent: 'carriage' }).box([0.1, 0.45, 0.05], [s * 0.25, 0.35, 1.07], { color: '#5a5f66', parent: 'carriage' }))
      .box([1.0, 0.13, 1.0], [0, 0.22, 1.6], { color: '#c8a070', round: 0.05, parent: 'carriage' })
      .box([0.45, 0.4, 0.45], [-0.23, 0.49, 1.37], { color: '#c89a60', round: 0.1, parent: 'carriage' })
      .box([0.45, 0.4, 0.45], [0.23, 0.49, 1.37], { color: '#b88a50', round: 0.1, parent: 'carriage' })
      .box([0.45, 0.4, 0.45], [0, 0.49, 1.83], { color: '#c89a60', round: 0.1, parent: 'carriage' })
      .label('THIS WAY UP', [0.36, 0.08], [0, 0.55, 2.06], { color: '#c89a60', parent: 'carriage', depth: 0.005 });
    return b
      .act({
        click: [
          [A.operate('beacon', 'on'), A.par(A.operate('carriage', 'up'), A.say('Beep! Beep! Beep!', 2)), A.wait(1.5)],
          [A.operate('carriage', 'down'), A.wait(0.5), A.operate('beacon', 'off')],
        ],
      })
      .done();
  }),
  // A stone fort: crenellated curtain walls, four round corner towers with conical roofs, a gatehouse whose
  // portcullis winches up, a keep with a flag, and a cannon on the front wall that fires.
  e('fort', 'places', 'castles', () => {
    const b = m('fort', { edge: 'sharp' });
    const st = '#a8a296', st2 = '#968f82', W = 16, D = 14, H = 5.5;
    const wall = (x0: number, z0: number, x1: number, z1: number) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ang = (Math.atan2(z1 - z0, x1 - x0) * 180) / Math.PI;
      b.box([L, H, 1.2], [(x0 + x1) / 2, H / 2, (z0 + z1) / 2], { color: st, rot: [0, -ang, 0], round: 0.02 });
      const n = Math.floor(L / 1.3);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        b.box([0.65, 0.7, 1.25], [x0 + (x1 - x0) * t, H + 0.35, z0 + (z1 - z0) * t], { color: st2, rot: [0, -ang, 0], round: 0.05 });
      }
    };
    wall(-W / 2, D / 2, -2.2, D / 2);
    wall(2.2, D / 2, W / 2, D / 2);
    wall(-W / 2, -D / 2, W / 2, -D / 2);
    wall(-W / 2, -D / 2, -W / 2, D / 2);
    wall(W / 2, -D / 2, W / 2, D / 2);
    for (const [tx, tz] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]] as const) {
      b.cyl([3.4, 8, 3.4], [tx, 4, tz], { color: st2, taper: 0.92 })
        .cyl([3.6, 0.4, 3.6], [tx, 8.1, tz], { color: st })
        .cone([3.8, 2.6, 3.8], [tx, 9.6, tz], { color: '#7a3a2a' });
      win(b, [tx, 5.5, tz + 1.6 * Math.sign(tz)], 0.3, 0.9, { frame: st, glass: '#22201f', sill: '' });
    }
    // gatehouse
    b.pair((s) => void b.box([2.2, 7.2, 2.4], [s * 2.2, 3.6, D / 2 + 0.2], { color: st2, round: 0.02 }).box([2.4, 0.6, 2.6], [s * 2.2, 7.4, D / 2 + 0.2], { color: st, round: 0.05 }));
    b.box([2.2, 2.4, 2.4], [0, 6.0, D / 2 + 0.2], { color: st2, round: 0.02 })
      .arc([2.6, 1.4, 0.3], [0, 3.0, D / 2 + 1.3], { color: st, arc: 180, tube: 0.2 })
      .box([2.2, 4.0, 0.1], [0, 2.0, D / 2 + 0.6], { color: '#4a2f1c', round: 0.02 })
      .box([2.0, 3.6, 0.08], [0, 1.8, D / 2 + 1.25], { color: '#2a2c30', round: 0.02, name: 'portcullis', mover: { kind: 'slide', axis: 'y', amount: 3.4 } })
      .each(5, (i) => void b.box([0.08, 3.6, 0.1], [-0.8 + i * 0.4, 1.8, D / 2 + 1.3], { color: '#3a3d42', parent: 'portcullis', noInk: true }))
      .label('FORT', [1.6, 0.5], [0, 4.6, D / 2 + 1.42], { color: '#d8d0c0', depth: 0.03 });
    // keep with a flag
    b.box([5, 9, 5], [0, 4.5, -2], { color: st, round: 0.02 })
      .box([5.4, 0.6, 5.4], [0, 9.2, -2], { color: st2, round: 0.05 });
    for (const xx of [-1.2, 1.2]) win(b, [xx, 6.5, 0.51], 0.5, 1.2, { frame: st2, glass: '#22201f', sill: '' });
    b.stick([0, 9.5, -2], [0, 13.5, -2], 0.12, '#5a3a22')
      .box([2.2, 1.3, 0.05], [1.15, 12.8, -2], { color: '#c8262e', name: 'flag', pivot: [0.05, 12.8, -2], round: 0.1 });
    // cannon on the wall walk
    b.box([0.9, 0.4, 1.0], [5.0, H + 0.2, D / 2 - 0.9], { color: '#5a3a22', round: 0.1 })
      .cyl([0.4, 1.8, 0.4], [5.0, H + 0.55, D / 2 - 0.2], { color: '#2a2c30', rot: [80, 0, 0], taper: 0.8, name: 'cannon' });
    return b
      .act({
        click: [
          [A.par(A.operate('portcullis', 'up'), A.say('Creeeeak!', 2), A.pose('flag', { rot: [0, 20, 0], dur: 0.6 })), A.pose('flag', { rot: [0, -15, 0], dur: 0.6 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.5 }), A.wait(1), A.operate('portcullis', 'down')],
          [A.par(A.pose('cannon', { move: [0, 0, -0.4], dur: 0.08 }), A.effect('smoke', { dur: 2 }), A.say('BOOM!', 1.5)), A.pose('cannon', { move: [0, 0, 0], dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A folded fortune cookie: it snaps in two and the paper fortune pops out.
  e('fortune cookie', 'food', 'desserts', () =>
    m('fortune cookie')
      .ball([0.04, 0.04, 0.05], [0.0, 0.022, 0], { color: '#e8b860', name: 'halfL', pivot: [0, 0.01, 0] })
      .ball([0.045, 0.045, 0.045], [0.026, 0.026, 0], { color: '#e8b860', rot: [0, 0, -25], parent: 'halfL' })
      .ball([0.04, 0.04, 0.05], [0.0, 0.022, 0], { color: '#e0ac54', name: 'halfR', pivot: [0, 0.01, 0] })
      .ball([0.045, 0.045, 0.045], [-0.026, 0.026, 0], { color: '#e8b860', rot: [0, 0, 25], parent: 'halfR' })
      .box([0.012, 0.005, 0.03], [0, 0.044, 0.01], { color: '#c89040', noInk: true })
      .box([0.045, 0.01, 0.002], [0.012, 0.035, 0.026], { color: 'white', rot: [0, 0, -5], name: 'slip', edge: 'sharp' })
      .act({
        click: [
          [A.par(A.pose('halfL', { rot: [0, 0, -35], move: [0.02, 0, 0], dur: 0.3 }), A.pose('halfR', { rot: [0, 0, 35], move: [-0.02, 0, 0], dur: 0.3 }), A.say('Crack!', 1)), A.pose('slip', { move: [0, 0.05, 0], dur: 0.3 }), A.say('"A pleasant surprise is waiting for you."', 2.5, '')],
          [A.par(A.pose('halfL', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.pose('halfR', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.pose('slip', { move: [0, 0, 0], dur: 0.3 }))],
        ],
      })
      .done(),
  ),
  // A glass bottle of liquid foundation with a pump: a press, and a dab of it lands beside.
  e('foundation (makeup)', 'wardrobe', 'makeup', () =>
    m('foundation (makeup)', { edge: 'sharp' })
      .box([0.045, 0.08, 0.03], [0, 0.04, 0], { color: '#dfe8ee', round: 0.3 })
      .box([0.038, 0.065, 0.024], [0, 0.036, 0], { color: '#e0b090', round: 0.3 })
      .label('BASE', [0.03, 0.012], [0, 0.045, 0.016], { color: '#3a3633', depth: 0.002 })
      .cyl([0.022, 0.012, 0.022], [0, 0.086, 0], { color: 'gold' })
      .cyl([0.018, 0.025, 0.018], [0, 0.104, 0], { color: '#1e1e1e', name: 'pump', mover: { kind: 'slide', axis: 'y', amount: -0.01 } })
      .box([0.012, 0.008, 0.026], [0, 0.118, 0.006], { color: '#1e1e1e', parent: 'pump' })
      .ball([0.05, 0.006, 0.03], [0.05, 0.003, 0.02], { color: '#e0b090', name: 'dab', scale: 0.4, edge: 'soft' })
      .act({ click: [A.operate('pump', 'down'), A.operate('pump', 'up'), A.pose('dab', { scale: 1, dur: 0.3 }), A.say('Squish!', 1)] })
      .done(),
  ),
  // A house foundation going in: concrete strip footings and a course of blocks around a 6 x 4 m plot on a gravel
  // bed, rebar standing up, and a crane bucket of concrete that tips to pour.
  e('foundation (stone)', 'workshop', 'construction', () => {
    const b = m('foundation (stone)', { edge: 'sharp' });
    const conc = '#a8a8a0';
    b.box([6.8, 0.06, 4.8], [0, 0.03, 0], { color: '#9a8a70', round: 0 })
      .box([5.6, 0.04, 3.6], [0, 0.08, 0], { color: '#b8b0a0', round: 0 });
    for (const [x0, z0, x1, z1] of [[-3, 2, 3, 2], [-3, -2, 3, -2], [-3, -2, -3, 2], [3, -2, 3, 2], [0, -2, 0, 2]] as const) {
      const L = Math.hypot(x1 - x0, z1 - z0) + 0.3, along = x0 === x1;
      b.box(along ? [0.5, 0.3, L] : [L, 0.3, 0.5], [(x0 + x1) / 2, 0.15, (z0 + z1) / 2], { color: '#9a9a92', round: 0.05 })
        .box(along ? [0.3, 0.5, L] : [L, 0.5, 0.3], [(x0 + x1) / 2, 0.55, (z0 + z1) / 2], { color: conc, round: 0.03 });
      for (let t = 0.1; t < 1; t += 0.2) b.stick([x0 + (x1 - x0) * t, 0.8, z0 + (z1 - z0) * t], [x0 + (x1 - x0) * t, 1.4, z0 + (z1 - z0) * t], 0.025, '#8a4a2a');
    }
    b.stick([1.5, 0, -3.0], [1.5, 3.2, -3.0], 0.12, '#f2c14e')
      .stick([1.5, 3.2, -3.0], [1.5, 3.2, 0.5], 0.1, '#f2c14e')
      .stick([1.5, 3.2, 0.5], [1.5, 2.4, 0.5], 0.02, '#3a3633')
      .cone([0.8, 0.9, 0.8], [1.5, 1.9, 0.5], { color: '#5a5f66', rot: [180, 0, 0], taper: 0.4, name: 'bucket', pivot: [1.5, 2.4, 0.5] })
      .cyl([0.7, 0.04, 0.7], [1.5, 2.33, 0.5], { color: '#8a8a82', parent: 'bucket' });
    return b.act({ click: [A.pose('bucket', { rot: [0, 0, 60], dur: 0.6 }), A.par(A.effect('dust', { dur: 1.5 }), A.say('Sploosh!', 1.5)), A.wait(0.8), A.pose('bucket', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A town fountain: an octagonal stone basin (3.6 m), a pedestal carrying two tiers of bowls that spill water
  // into one another, a finial jet; the water can be stopped and started.
  e('fountain', 'garden', 'garden features', () => {
    const b = m('fountain');
    b.prism([3.8, 0.5, 3.8], [0, 0.25, 0], 8, { color: '#bdb5a5', edge: 'sharp' })
      .prism([3.5, 0.06, 3.5], [0, 0.46, 0], 8, { color: '#5aa8d0', edge: 'sharp' })
      .prism([3.95, 0.1, 3.95], [0, 0.52, 0], 8, { color: '#d8d0c0', edge: 'sharp' })
      .cyl([0.5, 1.0, 0.5], [0, 0.95, 0], { color: '#d8d0c0', taper: 0.8 })
      .cyl([1.7, 0.3, 1.7], [0, 1.55, 0], { color: '#d8d0c0', taper: 1.3 })
      .cyl([1.55, 0.04, 1.55], [0, 1.69, 0], { color: '#5aa8d0' })
      .cyl([0.25, 0.6, 0.25], [0, 1.95, 0], { color: '#d8d0c0' })
      .cyl([0.9, 0.2, 0.9], [0, 2.3, 0], { color: '#d8d0c0', taper: 1.3 })
      .cyl([0.8, 0.03, 0.8], [0, 2.39, 0], { color: '#5aa8d0' })
      .ball([0.25, 0.3, 0.25], [0, 2.55, 0], { color: '#d8d0c0' })
      .cone([0.1, 0.5, 0.1], [0, 2.95, 0], { color: '#bfe6f6', name: 'jet', noInk: true });
    around(8, 0.85).forEach(([px, pz], i) => void b.cyl([0.05, 1.05, 0.05], [px, 1.05, pz], { color: '#bfe6f6', noInk: true, name: `fall${i}` }));
    around(6, 0.47, 0.3).forEach(([px, pz], i) => void b.cyl([0.04, 0.6, 0.04], [px, 2.05, pz], { color: '#bfe6f6', noInk: true, name: `drip${i}` }));
    const water = (k: number) => A.par(A.pose('jet', { scale: k, dur: 0.4 }), ...Array.from({ length: 8 }, (_, i) => A.pose(`fall${i}`, { scale: k, dur: 0.4 })));
    const drips = (k: number) => A.par(...Array.from({ length: 6 }, (_, i) => A.pose(`drip${i}`, { scale: k, dur: 0.4 })));
    return b.act({ click: [[water(0), drips(0), A.say('Gurgle...', 1.5)], [water(1), drips(1), A.par(A.effect('water_spray', { dur: 2 }), A.say('Splish splash!', 1.5))]] }).done();
  }),
  // A gilt picture frame with a landscape in it, on its fold-out stand: it slips crooked and is set straight.
  e('frame', 'home', 'decor', () => {
    const b = m('frame', { edge: 'sharp' })
      .box([0.32, 0.4, 0.012], [0, 0.22, -0.005], { color: '#8ac8f0', round: 0, name: 'picture', pivot: [0, 0.0, 0] })
      .box([0.31, 0.12, 0.004], [0, 0.08, 0.002], { color: '#4f8a3a', noInk: true, parent: 'picture' })
      .pyramid([0.2, 0.16, 0.004], [-0.05, 0.2, 0.002], 3, { color: '#7a8a9a', noInk: true, parent: 'picture', rot: [90, 0, 0] })
      .ball([0.06, 0.06, 0.004], [0.09, 0.32, 0.003], { color: '#f2d21e', noInk: true, parent: 'picture' });
    b.pair((s) => void b.box([0.05, 0.46, 0.035], [s * 0.18, 0.23, 0], { color: '#d9b24a', round: 0.3, parent: 'picture' }).box([0.41, 0.05, 0.035], [0, s > 0 ? 0.435 : 0.025, 0], { color: '#d9b24a', round: 0.3, parent: 'picture' }));
    return b.rod([0, 0.3, -0.02], [0, 0.0, -0.15], 0.015, '#5a3a22').act({ click: [A.pose('picture', { rot: [0, 0, 12], dur: 0.3 }), A.say('Hmm...', 1.5), A.pose('picture', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A round, sunny face covered in freckles, ginger hair on top: it giggles.
  e('freckle', 'clinic', 'body parts', () => {
    const b = m('freckle').ball([0.2, 0.19, 0.17], [0, 0.095, 0], { color: 'skin1', name: 'face' }).ball([0.21, 0.09, 0.17], [0, 0.17, -0.015], { color: '#d9732a', parent: 'face' });
    b.pair((s) => {
      b.ball([0.02, 0.028, 0.01], [s * 0.04, 0.11, 0.08], { color: '#2a2726', eye: true, parent: 'face' });
      b.ball([0.035, 0.02, 0.006], [s * 0.06, 0.07, 0.074], { color: '#f2a0a0', noInk: true, parent: 'face' });
      [[0.03, 0.085], [0.045, 0.08], [0.055, 0.09], [0.04, 0.072], [0.065, 0.078], [0.025, 0.075]].forEach(([fx, fy]) => void b.ball(0.008, [s * fx, fy, 0.079], { color: '#b0603a', noInk: true, parent: 'face' }));
    });
    return b.arc([0.05, 0.025, 0.006], [0, 0.05, 0.08], { color: '#a0402a', rot: [0, 0, 180], parent: 'face' }).act({ click: [A.par(A.anim('wobble', 2), A.say('Hee hee!', 1.5))] }).done();
  }),
  // An upright freezer (1.75 m): the door opens on its hinges to wire baskets of frozen food and a cloud of cold.
  e('freezer', 'kitchen', 'appliances', () =>
    m('freezer', { edge: 'sharp' })
      .box([0.7, 1.75, 0.7], [0, 0.875, 0], { color: 'white', round: 0.06 })
      .box([0.6, 1.5, 0.05], [0, 0.95, 0.31], { color: '#cfe0e8', round: 0.05 })
      .box([0.56, 0.02, 0.5], [0, 0.5, 0.05], { color: '#c8ccd2' })
      .box([0.56, 0.02, 0.5], [0, 0.95, 0.05], { color: '#c8ccd2' })
      .box([0.56, 0.02, 0.5], [0, 1.4, 0.05], { color: '#c8ccd2' })
      .box([0.2, 0.15, 0.2], [-0.12, 1.03, 0.1], { color: '#f2a0b8', round: 0.2 })
      .box([0.25, 0.08, 0.2], [0.13, 0.55, 0.1], { color: '#8ac8f0', round: 0.2 })
      .box([0.7, 1.62, 0.05], [0, 0.9, 0.37], { color: '#f4f8fa', name: 'door', pivot: [0.35, 0.9, 0.37], mover: { kind: 'swing', axis: 'y', amount: 110 }, round: 0.1 })
      .box([0.03, 0.45, 0.04], [-0.3, 1.2, 0.41], { color: 'silver', parent: 'door' })
      .label('FREEZE', [0.2, 0.05], [0, 1.6, 0.4], { color: '#2a5ab0', parent: 'door', depth: 0.004 })
      .box([0.66, 0.08, 0.04], [0, 0.04, 0.34], { color: '#5a5f66' })
      .socket('shelf', [0, 0.97, 0.05], 'inside', { size: 0.4 })
      .act({ click: [A.operate('door', 'open'), A.par(A.effect('snow', { dur: 2 }), A.say('Brrrr!', 1.5)), A.wait(2), A.operate('door', 'close')] })
      .done(),
  ),
  // A French braid on a wig stand, seen from behind: the plait runs from the crown to a ribbon at the nape and
  // swings.
  e('french braid', 'wardrobe', 'hairstyles', () => {
    const b = m('french braid');
    b.cyl([0.18, 0.03, 0.18], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .cyl([0.04, 0.16, 0.04], [0, 0.11, 0], { color: '#3a3633', edge: 'sharp' })
      .ball([0.2, 0.08, 0.14], [0, 0.2, 0], { color: '#e8dccc' })
      .cyl([0.08, 0.08, 0.08], [0, 0.26, 0], { color: '#e8dccc' })
      .ball([0.19, 0.22, 0.2], [0, 0.4, 0], { color: '#e8dccc' })
      .ball([0.205, 0.2, 0.205], [0, 0.43, 0.0], { color: '#b07840' })
      .ball([0.02, 0.02, 0.02], [0, 0.48, 0.1], { color: '#b07840', name: 'braid', pivot: [0, 0.5, 0.08] });
    for (let i = 0; i < 8; i++) {
      const y = 0.5 - i * 0.04, s = i % 2 ? 1 : -1, w = 0.07 - i * 0.004, z = i < 4 ? 0.1 - i * 0.002 : 0.095 + (i - 4) * 0.01;
      b.ball([w, 0.055, 0.04], [s * 0.012, y, z], { color: i % 2 ? '#a06830' : '#c08850', rot: [0, 0, s * 25], parent: 'braid' });
    }
    b.ball([0.04, 0.025, 0.03], [0, 0.17, 0.13], { color: '#ef6f9a', parent: 'braid' })
      .cone([0.04, 0.06, 0.03], [0, 0.13, 0.13], { color: '#b07840', rot: [180, 0, 0], parent: 'braid' });
    return b.act({ click: [A.pose('braid', { rot: [0, 0, 15], dur: 0.3 }), A.pose('braid', { rot: [0, 0, -12], dur: 0.35 }), A.pose('braid', { rot: [0, 0, 0], dur: 0.3 }), A.say('Swish!', 1)] }).done();
  }),
  // A pair of glazed French doors (2.1 m) in a white frame with a fanlight: both leaves swing out onto the patio.
  e('french doors', 'home', 'doors', () => {
    const b = m('french doors', { edge: 'sharp' });
    b.box([1.7, 2.6, 0.2], [0, 1.3, -0.12], { color: '#e8e2d6' })
      .box([1.56, 2.12, 0.04], [0, 1.06, -0.01], { color: '#22201f', noInk: true })
      .box([1.6, 0.38, 0.06], [0, 2.32, 0.0], { color: 'white', round: 0.1 })
      .box([1.4, 0.26, 0.04], [0, 2.32, 0.03], { color: '#9cc3d6' })
      .each(3, (i) => void b.box([0.03, 0.26, 0.05], [-0.35 + i * 0.35, 2.32, 0.035], { color: 'white' }))
      .box([1.7, 0.06, 0.3], [0, 0.03, 0.05], { color: '#9a9590' });
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([0.76, 2.08, 0.05], [s * 0.39, 1.06, 0.03], { color: 'white', round: 0.1, name: n, pivot: [s * 0.77, 1.06, 0.03], mover: { kind: 'swing', axis: 'y', amount: s * -100 } });
      for (let i = 0; i < 8; i++) b.box([0.27, 0.4, 0.02], [s * 0.39 + (i % 2 ? 0.15 : -0.15), 0.42 + Math.floor(i / 2) * 0.46, 0.06], { color: '#9cc3d6', parent: n });
      b.box([0.03, 0.14, 0.04], [s * 0.06, 1.0, 0.08], { color: 'brass', parent: n, round: 0.4 });
    });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creak...', 1)], [A.operate('door', 'close'), A.say('Click.', 1)]] }).done();
  }),
  // A French horn on its stand: coiled brass tubing, a wide flared bell, three rotary valves with levers and a
  // mouthpiece: it plays a fanfare.
  e('french horn', 'music', 'brass', () => {
    const b = m('french horn', { edge: 'sharp' })
      .cyl([0.2, 0.03, 0.2], [0, 0.015, 0], { color: '#2a2726' })
      .stick([0, 0.03, 0], [0, 0.15, 0], 0.025, '#2a2726')
      .torus([0.36, 0.36, 0.035], [0, 0.36, 0], { color: 'brass', tube: 0.12, name: 'horn' })
      .torus([0.27, 0.27, 0.03], [0.01, 0.36, 0.02], { color: '#c8a040', tube: 0.13, parent: 'horn' })
      .torus([0.18, 0.18, 0.03], [0.02, 0.36, 0.04], { color: 'brass', tube: 0.18, parent: 'horn' })
      .cyl([0.06, 0.32, 0.06], [0.22, 0.25, -0.05], { color: 'brass', rot: [0, 0, 135], taper: 5, parent: 'horn' })
      .torus([0.3, 0.3, 0.02], [0.33, 0.14, -0.05], { color: '#c8a040', rot: [0, 0, 45], tube: 0.08, parent: 'horn' })
      .rod([-0.1, 0.5, 0.02], [-0.2, 0.6, 0.04], 0.018, 'brass', { parent: 'horn' })
      .cyl([0.025, 0.04, 0.025], [-0.21, 0.62, 0.04], { color: 'silver', rot: [0, 0, 40], parent: 'horn' });
    b.each(3, (i) => {
      b.cyl([0.04, 0.05, 0.04], [0.04 + i * 0.045, 0.42, 0.06], { color: '#c8a040', rot: [90, 0, 0], parent: 'horn' });
      b.box([0.015, 0.05, 0.012], [0.04 + i * 0.045, 0.47, 0.09], { color: 'silver', name: `valve${i}`, parent: 'horn', round: 0.4 });
    });
    const press = (k: number) => A.par(A.pose('valve0', { move: [0, -0.01 * k, 0], dur: 0.15 }), A.pose('valve2', { move: [0, -0.01 * k, 0], dur: 0.15 }));
    return b.act({ click: [A.par(A.say('♪ Pah-pah-PAHHHH! ♪', 2.5), A.effect('sparkle', { dur: 2 })), press(1), press(0), press(1), press(0)] }).done();
  }),
  // Two slices of French toast on a plate with butter, berries and a pour of maple syrup that spreads.
  e('french toast', 'food', 'breakfast', () => {
    const b = m('french toast');
    plate(b, 0.26);
    return b
      .box([0.12, 0.022, 0.12], [-0.02, 0.024, 0], { color: '#c8803a', round: 0.3, rot: [0, 15, 0] })
      .box([0.12, 0.022, 0.12], [0.02, 0.046, 0.01], { color: '#d8903a', round: 0.3, rot: [0, -10, 0] })
      .box([0.03, 0.014, 0.03], [0.02, 0.064, 0.01], { color: '#ffe680', round: 0.4, name: 'butter' })
      .ball(0.02, [-0.08, 0.026, 0.07], { color: '#d6262b' })
      .ball(0.018, [-0.06, 0.026, 0.09], { color: '#2a3a8a' })
      .ball(0.018, [-0.09, 0.026, 0.05], { color: '#2a3a8a' })
      .ball([0.1, 0.008, 0.08], [0.02, 0.059, 0.01], { color: '#a8601a', noInk: true, name: 'syrup', scale: 0.6 })
      .act({ click: [[A.par(A.pose('syrup', { scale: 1.2, dur: 1 }), A.pose('butter', { scale: 0.6, dur: 1 }), A.say('Drizzle...', 1.5))], [A.par(A.pose('syrup', { scale: 0.6, dur: 0.4 }), A.pose('butter', { scale: 1, dur: 0.4 }))]] })
      .done();
  }),
  // A striped bucket of fried chicken: a crispy drumstick lifts out.
  e('fried chicken', 'food', 'meals', () => {
    const b = m('fried chicken').cyl([0.16, 0.15, 0.16], [0, 0.075, 0], { color: 'white', taper: 1.25, edge: 'sharp' });
    b.each(7, (i) => {
      const a = (i - 3) * 0.45, sx = Math.sin(a), cz = Math.cos(a);
      b.stick([sx * 0.08, 0.003, cz * 0.08], [sx * 0.1, 0.147, cz * 0.1], 0.024, '#d6262b', { noInk: true });
    });
    b.ball([0.09, 0.06, 0.08], [-0.03, 0.16, 0.01], { color: '#c87a2a' }).ball([0.08, 0.06, 0.08], [0.04, 0.155, -0.02], { color: '#d0882a' });
    b.ball([0.06, 0.09, 0.06], [0.01, 0.19, 0.04], { color: '#c87a2a', rot: [30, 0, -20], name: 'drumstick', piece: true })
      .rod([0.03, 0.22, 0.06], [0.05, 0.25, 0.08], 0.015, 'cream', { parent: 'drumstick' })
      .ball(0.022, [0.052, 0.255, 0.082], { color: 'cream', parent: 'drumstick' });
    return b.act({ click: [[A.pose('drumstick', { move: [0.05, 0.1, 0.05], rot: [0, 0, -30], dur: 0.4 }), A.say('Crunch!', 1.2)], [A.pose('drumstick', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A blue-rimmed bowl of egg fried rice with peas, carrot and egg, chopsticks resting on it: it steams.
  e('fried rice', 'food', 'meals', () => {
    const b = m('fried rice')
      .cyl([0.1, 0.05, 0.1], [0, 0.025, 0], { color: 'white', taper: 1.5, edge: 'sharp' })
      .cyl([0.152, 0.008, 0.152], [0, 0.048, 0], { color: '#2a3a8a', noInk: true })
      .ball([0.13, 0.08, 0.13], [0, 0.058, 0], { color: '#f0dca0' });
    ['#5aa02a', '#f0821e', '#f2d21e', '#5aa02a', '#f0821e', '#f2d21e', '#5aa02a', '#ef9a9a'].forEach((c, i) => {
      const a = i * 0.8, r = 0.02 + (i % 3) * 0.015;
      b.ball(0.016, [Math.cos(a) * r, 0.094 - r * 0.6, Math.sin(a) * r + 0.012], { color: c, noInk: true });
    });
    b.stick([0.04, 0.09, -0.04], [0.1, 0.055, 0.08], 0.008, '#a8743e', { name: 'sticks', pivot: [0.1, 0.055, 0.08], edge: 'sharp' })
      .stick([0.055, 0.09, -0.045], [0.115, 0.055, 0.075], 0.008, '#a8743e', { parent: 'sticks', edge: 'sharp' });
    return b.act({ click: [A.pose('sticks', { rot: [20, 0, 0], dur: 0.3 }), A.par(A.effect('steam', { dur: 1.8 }), A.say('Slurp!', 1.2)), A.pose('sticks', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A red carton of golden fries: one is pulled out and crunched.
  e('fries', 'food', 'fast food', () => {
    const b = m('fries');
    b.each(11, (i) => {
      const xx = -0.035 + (i % 6) * 0.014, z = i < 6 ? 0.008 : -0.01;
      b.box([0.011, 0.11, 0.011], [xx, 0.1 + (i % 3) * 0.012, z], { color: '#f6c840', rot: [0, 0, (i - 5) * 3], round: 0.2, ...(i === 3 ? { name: 'fry' } : {}) });
    });
    return b
      .box([0.1, 0.1, 0.05], [0, 0.05, 0], { color: '#d6262b', round: 0.15, edge: 'sharp' })
      .box([0.104, 0.03, 0.054], [0, 0.085, 0], { color: '#d6262b', round: 0.15, edge: 'sharp' })
      .ball(0.03, [0, 0.05, 0.026], { color: '#f2d21e', noInk: true })
      .act({ click: [A.pose('fry', { move: [0.02, 0.08, 0.02], dur: 0.3 }), A.say('Crunch!', 1), A.pose('fry', { scale: 0.4, dur: 0.2 }), A.pose('fry', { move: [0, 0, 0], scale: 1, dur: 0.3 })] })
      .done();
  }),
  // A pair of crumbed frog legs on a plate with a lemon wedge: they give a kick.
  e('frog legs', 'food', 'meals', () => {
    const b = m('frog legs');
    plate(b, 0.24);
    b.ball([0.05, 0.035, 0.04], [0, 0.03, 0], { color: '#d8a050' });
    b.pair((s) => {
      const n = s > 0 ? 'legL' : 'legR';
      b.rod([s * 0.015, 0.035, 0], [s * 0.05, 0.11, 0], 0.03, '#d8a050', { name: n, pivot: [s * 0.015, 0.035, 0] })
        .rod([s * 0.05, 0.11, 0], [s * 0.08, 0.02, 0.01], 0.018, '#d8a050', { parent: n })
        .ball([0.035, 0.012, 0.03], [s * 0.095, 0.016, 0.02], { color: '#d8a050', parent: n });
    });
    return b
      .wedge([0.05, 0.03, 0.03], [0.0, 0.027, 0.08], { color: '#f2d21e' })
      .act({ click: [A.par(A.pose('legL', { rot: [0, 0, -25], dur: 0.15 }), A.pose('legR', { rot: [0, 0, 25], dur: 0.15 }), A.say('Ribbit?', 1.2)), A.par(A.pose('legL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('legR', { rot: [0, 0, 0], dur: 0.3 }))] })
      .done();
  }),
  // A wooden fruit bowl heaped with an apple, an orange, a pear, bananas and grapes: the apple rolls out.
  e('fruit', 'food', 'fruit', () =>
    m('fruit')
      .cyl([0.28, 0.08, 0.28], [0, 0.04, 0], { color: '#a8743e', taper: 1.3, edge: 'sharp', name: 'bowl' })
      .ball(0.08, [-0.05, 0.11, 0.04], { color: '#c8202a', name: 'apple', parent: 'bowl', piece: true })
      .rod([-0.05, 0.15, 0.04], [-0.045, 0.17, 0.04], 0.008, '#5a3a22', { parent: 'apple' })
      .ball(0.08, [0.06, 0.1, 0.02], { color: '#f0821e' })
      .ball([0.07, 0.09, 0.07], [0.0, 0.12, -0.07], { color: '#b8c840' })
      .rod([-0.1, 0.13, -0.02], [0.0, 0.16, 0.07], 0.035, 'banana')
      .rod([0.0, 0.16, 0.07], [0.09, 0.18, 0.03], 0.035, 'banana')
      .rod([-0.1, 0.15, -0.04], [0.0, 0.18, 0.05], 0.034, '#f2d24a')
      .ball(0.035, [0.1, 0.12, -0.06], { color: '#6a2a7a' })
      .ball(0.035, [0.08, 0.12, -0.085], { color: '#6a2a7a' })
      .ball(0.035, [0.1, 0.15, -0.075], { color: '#6a2a7a' })
      .act({ click: [[A.detach('apple', 'apple'), A.say('Oops!', 1)], [A.reattach('apple')]] })
      .done(),
  ),
  // A dark fruitcake loaf studded with cherries and peel, a slice cut from the end that comes away.
  e('fruitcake', 'food', 'cakes', () => {
    const b = m('fruitcake').box([0.24, 0.006, 0.14], [0, 0.003, 0], { color: '#f2efe6', edge: 'sharp' }).box([0.18, 0.08, 0.1], [-0.03, 0.046, 0], { color: '#7a4020', round: 0.2, name: 'loaf' });
    b.box([0.025, 0.08, 0.1], [0.075, 0.046, 0.0], { color: '#8a5028', round: 0.2, name: 'slice', parent: 'loaf', piece: true });
    ['#c8202a', '#3f8a3a', '#c8202a', '#f2c14e', '#3f8a3a', '#c8202a'].forEach((c, i) => {
      b.box([0.014, 0.012, 0.012], [-0.1 + i * 0.026, 0.087, (i % 2) * 0.03 - 0.015], { color: c, noInk: true, parent: 'loaf' });
      b.box([0.003, 0.012, 0.012], [0.088, 0.025 + (i % 3) * 0.02, -0.03 + (i % 2) * 0.04], { color: c, noInk: true, parent: 'slice' });
    });
    return b.act({ click: [[A.pose('slice', { move: [0.06, 0, 0.02], rot: [0, -20, 0], dur: 0.4 })], [A.pose('slice', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // Squares of chocolate fudge on baking paper, one with a nut on top: it gets eaten and replaced.
  e('fudge', 'food', 'sweets', () =>
    m('fudge')
      .box([0.16, 0.004, 0.1], [0, 0.002, 0], { color: 'white', round: 0, edge: 'sharp' })
      .box([0.045, 0.035, 0.045], [-0.03, 0.022, 0], { color: '#6a3a1a', round: 0.2 })
      .box([0.045, 0.035, 0.045], [0.025, 0.022, 0.01], { color: '#6a3a1a', round: 0.2 })
      .box([0.045, 0.035, 0.045], [-0.002, 0.058, 0.004], { color: '#7a4a24', round: 0.2, rot: [0, 25, 0], name: 'top' })
      .ball(0.012, [0.0, 0.078, 0.004], { color: 'tan', parent: 'top' })
      .act({ click: [[A.pose('top', { scale: 0, dur: 0.4 }), A.say('Mmm, fudge!', 1.5)], [A.pose('top', { scale: 1, dur: 0.3 })]] })
      .done(),
  ),
  // A fairground fun house: candy-striped walls, crooked windows, a giant clown face whose grinning mouth is the
  // door, a revolving barrel tunnel at the entrance and pennants on the roof.
  e('fun house', 'places', 'fairground', () => {
    const b = m('fun house', { edge: 'sharp' });
    const W = 9, D = 6, H = 5, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: '#f2d21e', round: 0.03 })
      .box([W + 0.2, 0.4, D + 0.2], [0, H, 0], { color: '#d6262b', round: 0.2 });
    for (let i = 0; i < 9; i++) b.box([0.5, H, 0.04], [-W / 2 + 0.5 + i * 1.0, H / 2, fz + 0.01], { color: i % 2 ? '#3fc0d0' : '#e0409a', noInk: true });
    for (const [wx, wy, r] of [[-3.3, 3.4, 12], [3.4, 3.2, -15], [-3.2, 1.4, -8]] as const) b.box([1.1, 1.0, 0.08], [wx, wy, fz + 0.05], { color: '#2a3040', rot: [0, 0, r], round: 0.2 }).box([1.3, 1.2, 0.06], [wx, wy, fz + 0.03], { color: 'white', rot: [0, 0, r], round: 0.2 });
    // clown face over the entrance
    b.ball([3.6, 3.6, 0.6], [0, 3.0, fz + 0.2], { color: '#f6efe0' })
      .pair((s) => void b.ball([0.6, 0.7, 0.2], [s * 0.7, 3.9, fz + 0.48], { color: '#2a2726' }).ball([1.0, 0.8, 0.5], [s * 1.6, 4.5, fz + 0.2], { color: '#f0821e' }))
      .ball(0.6, [0, 3.2, fz + 0.62], { color: '#d6262b' })
      .cone([0.9, 0.9, 0.8], [0, 5.1, fz + 0.2], { color: '#3fc0d0' })
      .box([1.6, 1.2, 0.1], [0, 2.0, fz + 0.5], { color: '#8a141b', round: 0.6, name: 'mouth', pivot: [0, 1.4, fz + 0.5], mover: { kind: 'swing', axis: 'x', amount: 80 } })
      .box([1.6, 0.2, 0.08], [0, 2.55, fz + 0.56], { color: 'white', parent: 'mouth', round: 0.6 })
      .box([1.8, 0.1, 2.0], [0, 0.05, fz + 1.0], { color: '#5a3a22', round: 0.1 });
    b.cyl([2.2, 2.4, 2.2], [0, 1.2, fz + 1.3], { color: '#e0409a', rot: [90, 0, 0], name: 'barrel', mover: { kind: 'spin', axis: 'z', amount: 120 } });
    for (let i = 0; i < 6; i++) b.box([0.3, 2.42, 0.05], [Math.sin((i * Math.PI) / 3) * 1.05, 1.2 + Math.cos((i * Math.PI) / 3) * 1.05, fz + 1.3], { color: '#f2d21e', rot: [90, 0, -i * 60], parent: 'barrel' });
    b.cyl([1.7, 2.45, 1.7], [0, 1.2, fz + 1.3], { color: '#22201f', rot: [90, 0, 0], parent: 'barrel' });
    for (let i = 0; i < 5; i++) b.stick([-W / 2 + 0.8 + i * 1.85, H, 0], [-W / 2 + 0.8 + i * 1.85, H + 1.8, 0], 0.06, 'white').cone([0.5, 0.7, 0.04], [-W / 2 + 1.05 + i * 1.85, H + 1.5, 0], { color: ['#d6262b', '#2a5ab0', '#5aa02a', '#8a5fc4', '#f0821e'][i], rot: [0, 0, -90] });
    b.label('FUN HOUSE', [5.0, 0.9], [0, H + 0.4, fz + 0.12], { color: '#e0409a', depth: 0.04 });
    return b
      .act({
        click: [
          [A.par(A.operate('barrel', 'on'), A.operate('mouth', 'open'), A.say('Ha ha ha ha!', 2.5)), A.wait(3), A.par(A.operate('barrel', 'off'), A.operate('mouth', 'close'))],
        ],
      })
      .done();
  }),
  // A quiet Georgian funeral home: two storeys under a slate roof, a white portico with a pediment, panelled double
  // doors, carriage lamps and clipped box hedges; the doors open slowly to a soft bell.
  e('funeral home', 'places', 'services', () => {
    const b = m('funeral home', { edge: 'sharp' });
    const W = 12, D = 8, H = 7, fz = D / 2;
    b.box([W, H, D], [0, H / 2, 0], { color: '#e8e4dc', round: 0.02 })
      .box([W + 0.1, 0.4, D + 0.1], [0, 0.2, 0], { color: '#9a9590' })
      .box([W + 0.3, 0.3, D + 0.3], [0, H, 0], { color: 'white', round: 0.15 })
      .wedge([D + 0.6, 2.6, W + 0.6], [0, H + 1.4, 0], { color: '#4a4a58', rot: [0, 90, 0] })
      .pair((s) => void b.box([0.7, 1.6, 0.7], [s * 3.5, H + 1.5, -0.5], { color: '#a8503a', round: 0.05 }));
    for (const y of [2.0, 5.2]) for (const xx of [-4.5, -2.6, 2.6, 4.5]) win(b, [xx, y, fz + 0.01], 1.0, 1.6, { frame: 'white', glass: '#5a6a7a', bars: true });
    win(b, [0, 5.2, fz + 0.01], 1.0, 1.6, { frame: 'white', glass: '#5a6a7a', bars: true });
    door(b, 'doorL', [-0.6, 0.4, fz], 1.2, 2.6, { color: '#2a2420', frame: 'white', hinge: -1 });
    door(b, 'doorR', [0.6, 0.4, fz], 1.2, 2.6, { color: '#2a2420', frame: 'white', hinge: 1 });
    b.box([4.0, 0.4, 2.4], [0, 0.2, fz + 1.2], { color: '#d8d0c0', round: 0.05 })
      .pair((s) => void b.cyl([0.36, 3.4, 0.36], [s * 1.6, 2.1, fz + 2.1], { color: 'white', taper: 0.9 }))
      .box([4.0, 0.4, 2.4], [0, 3.95, fz + 1.2], { color: 'white', round: 0.05 })
      .wedge([4.2, 0.9, 2.4], [0, 4.6, fz + 1.2], { color: 'white' })
      .label('FAIRVIEW', [2.4, 0.32], [0, 3.95, fz + 2.42], { color: 'white', depth: 0.02 });
    b.pair((s) => {
      b.box([0.25, 0.4, 0.25], [s * 2.2, 2.8, fz + 0.2], { color: '#2a2726', round: 0.2 });
      b.box([0.15, 0.25, 0.15], [s * 2.2, 2.8, fz + 0.3], { color: '#fff2c8', glow: true });
      b.box([2.6, 0.8, 0.8], [s * 4.2, 0.4, fz + 0.7], { color: '#2f5a2f', round: 0.5, edge: 'soft' });
    });
    return b.act({ click: [A.say('Dong...', 2), A.operate('door', 'open'), A.wait(3), A.operate('door', 'close')] }).done();
  }),
  // A mossy log with orange bracket fungi and a little clump of toadstools: they puff their spores.
  e('fungus', 'garden', 'mushrooms', () => {
    const b = m('fungus').cyl([0.2, 0.5, 0.2], [0, 0.1, 0], { color: 'bark', rot: [0, 30, 90] }).cyl([0.18, 0.01, 0.18], [0.22, 0.1, -0.12], { color: 'lightwood', rot: [0, 30, 90] });
    for (const [px, py, pz, sz] of [[-0.05, 0.16, 0.08, 0.12], [0.08, 0.12, 0.08, 0.1], [-0.12, 0.1, 0.1, 0.09]] as const) b.cyl([sz, 0.022, sz * 0.5], [px, py, pz], { color: '#e09040', rot: [0, -30, 0] });
    b.ball([0.3, 0.04, 0.12], [0.0, 0.2, -0.02], { color: '#5a8a3a', noInk: true });
    b.stick([-0.25, 0, 0.12], [-0.25, 0.06, 0.12], 0.014, 'cream').dome([0.07, 0.045, 0.07], [-0.25, 0.06, 0.12], { color: '#c8262e', name: 'cap1' });
    b.stick([-0.18, 0, 0.18], [-0.18, 0.04, 0.18], 0.012, 'cream').dome([0.05, 0.035, 0.05], [-0.18, 0.04, 0.18], { color: '#c8262e', name: 'cap2' });
    b.ball(0.01, [-0.24, 0.1, 0.13], { color: 'white', parent: 'cap1', noInk: true }).ball(0.008, [-0.27, 0.095, 0.12], { color: 'white', parent: 'cap1', noInk: true });
    return b.act({ click: [A.par(A.pose('cap1', { move: [0, 0.015, 0], dur: 0.15 }), A.pose('cap2', { move: [0, 0.012, 0], dur: 0.15 }), A.effect('dust', { dur: 1.2 }), A.say('Poof!', 1)), A.par(A.pose('cap1', { move: [0, 0, 0], dur: 0.2 }), A.pose('cap2', { move: [0, 0, 0], dur: 0.2 }))] }).done();
  }),
  // An orange kitchen funnel with a hanging ring: water pours through it.
  e('funnel', 'kitchen', 'utensils', () =>
    m('funnel', { edge: 'sharp' })
      .cyl([0.025, 0.06, 0.025], [0, 0.03, 0], { color: '#f0821e' })
      .cyl([0.04, 0.1, 0.04], [0, 0.11, 0], { color: '#f0821e', taper: 3.5 })
      .cyl([0.142, 0.01, 0.142], [0, 0.162, 0], { color: '#d86a10' })
      .cyl([0.12, 0.004, 0.12], [0, 0.166, 0], { color: '#5a2a08', noInk: true })
      .torus([0.04, 0.04, 0.008], [0.085, 0.15, 0], { color: '#f0821e', rot: [90, 0, 0] })
      .cyl([0.12, 0.01, 0.12], [0, 0.164, 0], { color: '#8ac8f0', name: 'water', scale: 0, noInk: true })
      .act({ click: [A.pose('water', { scale: 1, dur: 0.3 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Glug glug glug', 1.5)), A.pose('water', { scale: 0, dur: 1.2 })] })
      .done(),
  ),
  // A fairground funnel cake, a lattice of fried batter dusted with sugar and a strawberry: a puff of sugar.
  e('funnel cake', 'food', 'desserts', () => {
    const b = m('funnel cake');
    plate(b, 0.26);
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI;
      b.rod([Math.cos(a) * 0.09, 0.022 + (i % 2) * 0.008, Math.sin(a) * 0.09], [-Math.cos(a) * 0.09, 0.022 + ((i + 1) % 2) * 0.008, -Math.sin(a) * 0.09], 0.022, '#d89a48');
    });
    b.torus([0.2, 0.2, 0.022], [0, 0.024, 0], { color: '#d89a48', rot: [90, 0, 0], tube: 0.11 });
    b.each(7, (i) => void b.ball([0.04, 0.008, 0.04], [Math.cos(i * 0.9) * (0.02 + i * 0.01), 0.039, Math.sin(i * 0.9) * (0.02 + i * 0.01)], { color: 'white', noInk: true }));
    return b.ball([0.035, 0.03, 0.03], [0.02, 0.047, 0.02], { color: '#d6262b' }).act({ click: [A.par(A.effect('dust', { dur: 1.2 }), A.say('Mmm, sugary!', 1.5))] }).done();
  }),
  // A folded faux-fur throw in a soft stack: it fluffs up.
  e('fur', 'wardrobe', 'fabrics', () => {
    const b = m('fur').box([0.5, 0.06, 0.36], [0, 0.03, 0], { color: '#7a5034', round: 0.8, name: 'throw' });
    b.box([0.5, 0.06, 0.36], [0, 0.085, 0], { color: '#8a6040', round: 0.8, parent: 'throw' }).box([0.5, 0.06, 0.36], [0, 0.14, 0], { color: '#9a7050', round: 0.8, parent: 'throw' });
    b.each(16, (i) => {
      const a = i * 2.4, r = 0.04 + (i % 5) * 0.03;
      b.ball([0.08, 0.04, 0.06], [Math.cos(a) * r * 1.3, 0.17 + (i % 3) * 0.008, Math.sin(a) * r * 0.9], { color: i % 3 ? '#a87a58' : '#8a6040', rot: [0, i * 37, 0], parent: 'throw' });
    });
    return b.act({ click: [A.pose('throw', { scale: 1.1, dur: 0.25 }), A.say('Fluff!', 1), A.pose('throw', { scale: 1, dur: 0.3 })] }).done();
  }),
  // A long faux-fur coat on a coat stand: shawl collar, wide sleeves with fur cuffs, gold buttons: it sways.
  e('fur coat', 'wardrobe', 'coats', () => {
    const b = m('fur coat');
    b.cyl([0.45, 0.04, 0.45], [0, 0.02, 0], { color: '#3a2618', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 1.75, 0], 0.04, '#5a3a22', { edge: 'sharp' })
      .ball(0.06, [0, 1.78, 0], { color: '#5a3a22' })
      .rod([0, 1.62, 0], [0, 1.68, 0], 0.012, 'silver', { name: 'coat', pivot: [0, 1.68, 0] })
      .rod([-0.22, 1.56, 0], [0.22, 1.56, 0], 0.03, '#a8743e', { parent: 'coat' })
      .cyl([0.44, 1.0, 0.3], [0, 1.05, 0.0], { color: '#9a7050', taper: 0.75, parent: 'coat' })
      .torus([0.34, 0.24, 0.2], [0, 1.52, 0.02], { color: '#c8a880', rot: [90, 0, 0], tube: 0.35, parent: 'coat' });
    b.pair((s) => void b.capsule([0.14, 0.7, 0.14], [s * 0.26, 1.15, 0], { color: '#9a7050', rot: [0, 0, s * 8], parent: 'coat' }).ball([0.16, 0.12, 0.16], [s * 0.3, 0.8, 0], { color: '#c8a880', parent: 'coat' }));
    b.each(3, (i) => void b.ball(0.03, [0.0, 1.3 - i * 0.2, 0.16], { color: 'gold', parent: 'coat' }));
    b.each(8, (i) => void b.ball(0.08, [-0.15 + (i % 4) * 0.1, 0.75 + Math.floor(i / 4) * 0.3, 0.12], { color: '#8a6040', noInk: true, parent: 'coat' }));
    return b.act({ click: [A.pose('coat', { rot: [0, 0, 8], dur: 0.4 }), A.pose('coat', { rot: [0, 0, -6], dur: 0.5 }), A.pose('coat', { rot: [0, 0, 0], dur: 0.4 }), A.say('Swish...', 1)] }).done();
  }),
  // A gas furnace: a steel cabinet with louvred panels, a flue pipe and ducts up top, a sight window onto the burner
  // that lights with a whump.
  e('furnace (appliance)', 'home', 'appliances', () => {
    const b = m('furnace (appliance)', { edge: 'sharp' })
      .box([0.6, 1.4, 0.7], [0, 0.7, 0], { color: '#c8c4b8', round: 0.05 })
      .box([0.62, 0.3, 0.72], [0, 1.55, 0], { color: '#b8bec6', round: 0.05 })
      .box([0.5, 0.25, 0.4], [0, 1.82, -0.1], { color: '#c8ccd2', round: 0.05 })
      .cyl([0.15, 0.5, 0.15], [0.18, 1.9, 0.18], { color: '#9aa0a8' })
      .box([0.24, 0.16, 0.04], [0, 0.6, 0.36], { color: '#1e1e1e' })
      .box([0.16, 0.09, 0.02], [0, 0.6, 0.385], { color: '#ff8a2a', glow: true, name: 'flame', mover: { kind: 'light', on: false } })
      .box([0.12, 0.08, 0.03], [0.15, 1.1, 0.36], { color: '#3a3d42' })
      .ball(0.012, [0.15, 1.1, 0.38], { color: '#5aff7a', glow: true });
    b.each(5, (i) => void b.box([0.46, 0.02, 0.02], [0, 0.95 + i * 0.05, 0.355], { color: '#9a9590', noInk: true }).box([0.46, 0.02, 0.02], [0, 0.15 + i * 0.05, 0.355], { color: '#9a9590', noInk: true }));
    return b.act({ click: [[A.say('Click... click... WHUMP!', 2), A.operate('flame', 'on'), A.effect('steam', { dur: 1.5 })], [A.operate('flame', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A furniture showroom: a sofa, an armchair, a side table and a lamp set out in front of the windows.
  e('furniture store', 'places', 'shops', () => {
    const b = shop('furniture store', { w: 9, d: 7, h: 5, wall: '#d8c8a8', trim: '#6a4a30', sign: 'FURNITURE', signC: 'white', signBg: '#6a4a30', frame: '#3a2618' });
    const fz = 3.5;
    b.box([1.8, 0.42, 0.8], [-2.6, 0.31, fz + 0.9], { color: '#2a8a8a', round: 0.4, edge: 'soft' })
      .box([1.8, 0.5, 0.25], [-2.6, 0.7, fz + 0.6], { color: '#2a8a8a', round: 0.5, edge: 'soft' })
      .pair((s) => void b.box([0.22, 0.6, 0.8], [-2.6 + s * 0.95, 0.4, fz + 0.9], { color: '#247878', round: 0.5, edge: 'soft' }))
      .box([0.8, 0.42, 0.8], [2.4, 0.31, fz + 0.9], { color: '#c8803a', round: 0.4, edge: 'soft' })
      .box([0.8, 0.5, 0.25], [2.4, 0.7, fz + 0.6], { color: '#c8803a', round: 0.5, edge: 'soft' })
      .box([0.5, 0.05, 0.5], [3.4, 0.55, fz + 0.9], { color: '#a8743e' })
      .stick([3.4, 0, fz + 0.9], [3.4, 0.55, fz + 0.9], 0.06, '#5a3a22')
      .stick([3.4, 0.58, fz + 0.9], [3.4, 0.9, fz + 0.9], 0.02, 'brass')
      .ball(0.12, [3.4, 0.92, fz + 0.9], { color: '#fff4c0', glow: true, name: 'lamp', mover: { kind: 'light', on: false } })
      .cyl([0.3, 0.2, 0.3], [3.4, 1.0, fz + 0.9], { color: '#f2e6c8', taper: 0.7 })
      .label('SALE', [0.8, 0.4], [-2.4, 1.8, fz + 0.08], { color: '#d6262b', depth: 0.01 });
    return b.act({ click: [[A.operate('door', 'open'), A.par(A.operate('lamp', 'on'), A.say('Ding-dong!', 1.5)), A.wait(2), A.operate('door', 'close')], [A.operate('lamp', 'off')]] }).done();
  }),
  // A glass cartridge fuse with brass caps and the thin wire inside: it blows with a pop, and is fine again.
  e('fuse', 'home', 'electrical', () =>
    m('fuse', { edge: 'sharp' })
      .cyl([0.022, 0.05, 0.022], [0, 0.035, 0], { color: '#d8eef8' })
      .cyl([0.025, 0.012, 0.025], [0, 0.006, 0], { color: 'brass' })
      .cyl([0.025, 0.012, 0.025], [0, 0.064, 0], { color: 'brass' })
      .stick([0, 0.012, 0], [0, 0.058, 0], 0.003, 'copper', { noInk: true, name: 'wire' })
      .label('10A', [0.012, 0.008], [0, 0.064, 0.0126], { color: 'brass', depth: 0.001 })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 0.6 }), A.pose('wire', { scale: 0, dur: 0.05 }), A.say('Pop!', 1)), A.effect('smoke', { dur: 1 })], [A.pose('wire', { scale: 1, dur: 0.2 })]] })
      .done(),
  ),
  // A breaker panel: a grey steel box whose door opens on a row of breakers; one trips with a spark and is reset.
  e('fuse box', 'home', 'electrical', () => {
    const b = m('fuse box', { edge: 'sharp' })
      .box([0.3, 0.4, 0.1], [0, 0.2, 0], { color: '#9aa0a8', round: 0.08 })
      .box([0.26, 0.36, 0.02], [0.0, 0.2, 0.05], { color: '#4a4e54' })
      .box([0.3, 0.4, 0.02], [0, 0.2, 0.065], { color: '#aab0b8', round: 0.1, name: 'door', pivot: [-0.15, 0.2, 0.065], mover: { kind: 'swing', axis: 'y', amount: -110 } })
      .wedge([0.08, 0.07, 0.006], [0.0, 0.25, 0.078], { color: '#f2d21e', parent: 'door' })
      .box([0.03, 0.06, 0.02], [0.12, 0.2, 0.08], { color: '#5a5f66', parent: 'door' });
    b.each(8, (i) => void b.box([0.04, 0.06, 0.03], [-0.075 + (i % 4) * 0.05, 0.27 - Math.floor(i / 4) * 0.13, 0.065], { color: '#1e1e1e', round: 0.2, ...(i === 5 ? { name: 'breaker', color: '#d6262b' } : {}) }));
    return b.act({ click: [A.operate('door', 'open'), A.par(A.pose('breaker', { rot: [40, 0, 0], dur: 0.1 }), A.effect('sparkle', { dur: 0.8 }), A.say('Clack!', 1)), A.wait(1), A.pose('breaker', { rot: [0, 0, 0], dur: 0.2 }), A.operate('door', 'close')] }).done();
  }),
  // A tinkerer's gizmo: a little screen, red and yellow knobs, an antenna that shoots up and a lamp that blinks.
  e('gadget', 'tech', 'gadgets', () =>
    m('gadget', { edge: 'sharp' })
      .box([0.14, 0.1, 0.08], [0, 0.05, 0], { color: '#5a7a9a', round: 0.3 })
      .box([0.07, 0.045, 0.01], [-0.025, 0.06, 0.04], { color: '#5aff7a', glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .cyl([0.025, 0.012, 0.025], [0.04, 0.07, 0.042], { color: '#d6262b', rot: [90, 0, 0], name: 'knob' })
      .cyl([0.025, 0.012, 0.025], [0.04, 0.03, 0.042], { color: '#f2d21e', rot: [90, 0, 0] })
      .stick([0.04, 0.1, -0.02], [0.04, 0.16, -0.02], 0.006, 'silver', { name: 'antenna', mover: { kind: 'slide', axis: 'y', amount: 0.08 } })
      .ball(0.02, [0.04, 0.165, -0.02], { color: '#d6262b', glow: true, parent: 'antenna', name: 'blink', mover: { kind: 'light', on: false } })
      .torus([0.05, 0.05, 0.01], [-0.04, 0.115, 0], { color: 'silver', rot: [90, 0, 0] })
      .act({ click: [A.par(A.operate('antenna', 'out'), A.operate('screen', 'on'), A.pose('knob', { rot: [0, 0, 90], dur: 0.3 })), A.operate('blink', 'on'), A.say('Beep boop!', 1.5), A.operate('blink', 'off'), A.wait(0.3), A.operate('blink', 'on'), A.wait(0.5), A.par(A.operate('blink', 'off'), A.operate('antenna', 'in'), A.operate('screen', 'off'), A.pose('knob', { rot: [0, 0, 0], dur: 0.3 }))] })
      .done(),
  ),
  // An old wooden gallows: a raised platform reached by steps, a post and beam with a rope, and a trapdoor worked
  // by a lever.
  e('gallows', 'armory', 'execution', () => {
    const b = m('gallows', { edge: 'sharp' });
    const wd = '#5a3a22';
    b.box([3.0, 0.15, 2.4], [0, 1.9, 0], { color: '#6a4a30', round: 0.05 });
    for (const [px, pz] of [[1.4, 1.1], [-1.4, 1.1], [1.4, -1.1], [-1.4, -1.1]] as const) b.box([0.2, 1.9, 0.2], [px, 0.95, pz], { color: wd });
    b.box([3.0, 0.12, 0.1], [0, 1.0, 1.15], { color: wd }).box([3.0, 0.12, 0.1], [0, 1.0, -1.15], { color: wd })
      .stick([-1.0, 1.95, -0.7], [-1.0, 5.2, -0.7], 0.22, wd)
      .stick([-1.1, 5.1, -0.7], [0.7, 5.1, -0.7], 0.2, wd)
      .rod([-1.0, 4.3, -0.7], [-0.3, 5.05, -0.7], 0.12, wd)
      .stick([0.5, 5.0, -0.7], [0.5, 3.9, -0.7], 0.035, '#c8a060')
      .torus([0.28, 0.34, 0.04], [0.5, 3.75, -0.7], { color: '#c8a060', tube: 0.15 })
      .box([0.9, 0.05, 0.9], [0.5, 1.99, -0.7], { color: '#3a2a1a', round: 0, name: 'trapdoor', pivot: [0.05, 1.99, -0.7], mover: { kind: 'swing', axis: 'z', amount: -85 } })
      .stick([1.2, 1.97, 0.6], [1.2, 2.7, 0.75], 0.05, '#3a3633', { name: 'lever', pivot: [1.2, 1.97, 0.6] })
      .ball(0.07, [1.2, 2.72, 0.76], { color: '#1e1e1e', parent: 'lever' });
    b.each(6, (i) => void b.box([1.0, 0.1, 0.3], [-0.9, 0.16 + i * 0.32, 1.45 + (5 - i) * 0.3], { color: '#7a5030' }));
    return b.act({ click: [[A.pose('lever', { rot: [-40, 0, 0], dur: 0.3 }), A.operate('trapdoor', 'open'), A.say('Clunk!', 1.5)], [A.pose('lever', { rot: [0, 0, 0], dur: 0.3 }), A.operate('trapdoor', 'close')]] }).done();
  }),
  // A thick strategy guide with a glossy cover: it falls open to a map of the level.
  e('game guide', 'study', 'books', () =>
    m('game guide', { edge: 'sharp' })
      .box([0.17, 0.24, 0.01], [0, 0.12, -0.014], { color: '#6a2a8a', round: 0.08 })
      .box([0.16, 0.23, 0.026], [0.004, 0.12, 0.0], { color: 'white', round: 0.05 })
      .box([0.15, 0.2, 0.002], [0.004, 0.12, 0.014], { color: '#8ac8a0', noInk: true })
      .rod([-0.04, 0.08, 0.016], [0.05, 0.16, 0.016], 0.006, '#d6262b', { noInk: true })
      .box([0.17, 0.24, 0.01], [0, 0.12, 0.018], { color: '#6a2a8a', round: 0.1, name: 'cover', pivot: [-0.085, 0.12, 0.018], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .label('GAME GUIDE', [0.14, 0.04], [0, 0.2, 0.024], { color: '#f2d21e', parent: 'cover', depth: 0.002 })
      .ball([0.09, 0.05, 0.004], [0, 0.1, 0.024], { color: '#1e1e1e', noInk: true, parent: 'cover' })
      .box([0.03, 0.01, 0.003], [-0.022, 0.1, 0.027], { color: 'white', noInk: true, parent: 'cover' })
      .box([0.01, 0.03, 0.003], [-0.022, 0.1, 0.027], { color: 'white', noInk: true, parent: 'cover' })
      .ball(0.012, [0.025, 0.1, 0.027], { color: '#d6262b', noInk: true, parent: 'cover' })
      .act({ click: [[A.operate('cover', 'open'), A.effect('sparkle', { dur: 1 })], [A.operate('cover', 'close')]] })
      .done(),
  ),
  // A game controller: twin grips, a d-pad, four coloured face buttons and two thumbsticks: it rumbles.
  e('gamepad', 'tech', 'gaming', () => {
    const b = m('gamepad').ball([0.16, 0.08, 0.05], [0, 0.085, 0], { color: '#2a2a30' });
    b.pair((s) => void b.ball([0.055, 0.1, 0.048], [s * 0.058, 0.05, -0.002], { color: '#2a2a30', rot: [0, 0, s * 22] }));
    b.box([0.03, 0.01, 0.01], [-0.045, 0.09, 0.025], { color: '#5a5f66', edge: 'sharp' }).box([0.01, 0.03, 0.01], [-0.045, 0.09, 0.025], { color: '#5a5f66', edge: 'sharp' });
    ['#5aa02a', '#d6262b', '#2a5ab0', '#f2d21e'].forEach((c, i) => {
      const a = (i * Math.PI) / 2;
      b.ball(0.013, [0.045 + Math.sin(a) * 0.013, 0.09 - Math.cos(a) * 0.013, 0.024], { color: c, ...(i === 1 ? { name: 'button' } : {}) });
    });
    b.pair((s) => void b.cyl([0.02, 0.012, 0.02], [s * 0.022, 0.065, 0.024], { color: '#5a5f66', rot: [90, 0, 0] }));
    b.box([0.02, 0.006, 0.004], [0, 0.11, 0.022], { color: '#4ab0ff', glow: true, name: 'led', mover: { kind: 'light', on: false } });
    return b.act({ click: [A.operate('led', 'on'), A.pose('button', { move: [0, 0, -0.004], dur: 0.08 }), A.pose('button', { move: [0, 0, 0], dur: 0.08 }), A.par(A.anim('shake', 3), A.say('Bzz-bzz!', 1.5)), A.operate('led', 'off')] }).done();
  }),
  // A single garage: block walls under a pitched roof, a roller door that rolls up to show the family car, a
  // workbench and shelves; the light comes on inside.
  e('garage (room)', 'places', 'houses', () => {
    const b = m('garage (room)', { edge: 'sharp' });
    const W = 3.6, D = 6, H = 2.7, fz = D / 2, wall = '#e2dccc';
    b.box([W, H, 0.2], [0, H / 2, -fz + 0.1], { color: wall })
      .pair((s) => void b.box([0.2, H, D], [s * (W / 2 - 0.1), H / 2, 0], { color: wall }))
      .box([W, 0.4, 0.2], [0, H - 0.2, fz - 0.1], { color: wall })
      .wedge([D + 0.4, 1.3, W + 0.5], [0, H + 0.65, 0], { color: '#8a3b2e', rot: [0, 90, 0] })
      .box([W, 0.05, D], [0, 0.025, 0], { color: '#9a9a96' })
      .box([W - 0.4, 2.25, 0.05], [0, 1.13, fz - 0.05], { color: '#f2efe6', round: 0.02, name: 'door', mover: { kind: 'slide', axis: 'y', amount: 2.15 } })
      .each(8, (i) => void b.box([W - 0.4, 0.02, 0.02], [0, 0.2 + i * 0.27, fz - 0.02], { color: '#c8c4b8', parent: 'door', noInk: true }))
      .box([0.4, 0.04, 0.03], [0, 0.4, fz - 0.02], { color: '#9a9590', parent: 'door' })
      // the car inside
      .loft([1.75, 1.4, 4.3], [0, 0.72, -0.4], [[0, 0.9, 0.6, -0.1], [0.12, 1, 0.65, -0.1], [0.3, 0.95, 1, 0.05], [0.68, 0.95, 1, 0.05], [0.8, 1, 0.6, -0.1], [1, 0.9, 0.5, -0.12]], { color: '#2a5ab0', boxy: 0.7 })
      .box([1.5, 0.45, 1.6], [0, 1.18, -0.5], { color: '#2f3d52', round: 0.3 })
      .pair((s) => void b.cyl([0.62, 0.2, 0.62], [s * 0.82, 0.31, 0.95], { color: 'rubber', rot: [0, 0, 90] }).cyl([0.62, 0.2, 0.62], [s * 0.82, 0.31, -1.75], { color: 'rubber', rot: [0, 0, 90] }))
      .box([0.6, 0.9, 1.6], [-1.45, 0.45, -2.0], { color: '#a8743e' })
      .box([0.4, 1.2, 1.2], [-1.55, 1.8, -2.2], { color: '#c8ccd2' })
      .box([0.6, 0.04, 0.3], [0, H - 0.06, -0.5], { color: '#fff6c8', glow: true, name: 'light', mover: { kind: 'light', on: false } })
      .socket('bay', [0, 0.05, -0.4], 'inside', { size: 4.5 });
    return b.act({ click: [[A.operate('light', 'on'), A.operate('door', 'up'), A.say('Rrrrrumble...', 2)], [A.operate('door', 'down'), A.say('Clunk.', 1), A.operate('light', 'off')]] }).done();
  }),
  // A sectional garage door (2.4 m x 2.1 m) in a brick house front: four panels with a row of windows, a
  // handle and a light over it; it rolls up into the ceiling.
  e('garage door', 'places', 'building parts', () => {
    const b = m('garage door', { edge: 'sharp' });
    b.pair((s) => void b.box([0.6, 2.8, 0.3], [s * 1.5, 1.4, -0.15], { color: '#a8503a', round: 0.02 }));
    b.box([3.6, 0.7, 0.3], [0, 2.45, -0.15], { color: '#a8503a', round: 0.02 })
      .box([2.5, 0.1, 0.08], [0, 2.14, 0.02], { color: 'white', round: 0.2 })
      .pair((s) => void b.box([0.08, 2.14, 0.08], [s * 1.23, 1.07, 0.02], { color: 'white', round: 0.2 }))
      .box([2.4, 2.1, 1.2], [0, 1.05, -0.9], { color: '#2a2726' })
      .box([2.4, 2.08, 0.05], [0, 1.05, 0.01], { color: '#f2efe6', round: 0.02, name: 'door', mover: { kind: 'slide', axis: 'y', amount: 2.0 } });
    b.each(3, (i) => void b.box([2.4, 0.03, 0.06], [0, 0.52 * (i + 1), 0.02], { color: '#c8c4b8', noInk: true, parent: 'door' }));
    b.each(4, (i) => void b.box([0.45, 0.25, 0.06], [-0.84 + i * 0.56, 1.8, 0.02], { color: '#8fb8cc', parent: 'door' }));
    b.box([0.3, 0.05, 0.06], [0, 0.3, 0.05], { color: '#9a9590', parent: 'door' })
      .box([0.2, 0.25, 0.1], [0, 2.55, 0.05], { color: '#2a2726', round: 0.2 })
      .box([0.14, 0.12, 0.04], [0, 2.52, 0.1], { color: '#fff2c8', glow: true, name: 'light', mover: { kind: 'light', on: false } })
      .box([2.6, 0.08, 0.5], [0, 0.04, 0.3], { color: '#9a9a96' });
    return b.act({ click: [[A.operate('light', 'on'), A.operate('door', 'up'), A.say('Rrrrrrr...', 2)], [A.operate('door', 'down'), A.say('Clunk.', 1), A.operate('light', 'off')]] }).done();
  }),
  // A full black bin bag knotted at the top: it rustles and slumps.
  e('garbage bag', 'home', 'cleaning', () =>
    m('garbage bag')
      .ball([0.56, 0.62, 0.5], [0, 0.31, 0], { color: '#2a2a2e', name: 'bag' })
      .cone([0.2, 0.2, 0.2], [0, 0.66, 0], { color: '#2a2a2e', rot: [180, 0, 0], taper: 0.25, parent: 'bag' })
      .ball([0.12, 0.07, 0.07], [-0.06, 0.78, 0], { color: '#2a2a2e', rot: [0, 0, 30], parent: 'bag' })
      .ball([0.12, 0.07, 0.07], [0.06, 0.78, 0], { color: '#2a2a2e', rot: [0, 0, -30], parent: 'bag' })
      .ball([0.06, 0.15, 0.02], [-0.12, 0.42, 0.22], { color: '#5a5a64', noInk: true, rot: [0, 0, 20], parent: 'bag' })
      .ball([0.08, 0.1, 0.02], [0.14, 0.3, 0.22], { color: '#4a4a54', noInk: true, rot: [0, 0, -20], parent: 'bag' })
      .act({ click: [A.par(A.anim('wobble', 2), A.say('Rustle rustle', 1.5)), A.pose('bag', { scale: 0.92, dur: 0.3 }), A.pose('bag', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // A galvanised steel dustbin with ribs and a handled lid: the lid pops up and an alley cat jumps out.
  e('garbage can', 'home', 'cleaning', () => {
    const b = m('garbage can', { edge: 'sharp' }).cyl([0.5, 0.75, 0.5], [0, 0.375, 0], { color: '#9aa0a8', taper: 1.08 });
    b.each(3, (i) => void b.torus([0.52, 0.52, 0.025], [0, 0.18 + i * 0.22, 0], { color: '#8a9098', rot: [90, 0, 0], tube: 0.04 }));
    b.pair((s) => void b.arc([0.12, 0.06, 0.02], [s * 0.27, 0.62, 0], { color: '#7a8088', rot: [0, 90, 0] }));
    return b
      .cyl([0.58, 0.06, 0.58], [0, 0.78, 0], { color: '#8a9098', name: 'lid', pivot: [0, 0.78, -0.29] })
      .dome([0.4, 0.07, 0.4], [0, 0.81, 0], { color: '#8a9098', parent: 'lid' })
      .arc([0.16, 0.07, 0.03], [0, 0.88, 0], { color: '#5a5f66', parent: 'lid' })
      .socket('inside', [0, 0.4, 0], 'inside', { size: 0.4 })
      .act({
        click: [
          [A.pose('lid', { rot: [-50, 0, 0], move: [0, 0.1, 0], dur: 0.2 }), A.spawn('cat', 'cat', { rel: 'front', of: 'self', dist: 'touch' }), A.say('Mrrrow!', 1.5, 'cat'), A.move('cat', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'run' }), A.remove('cat', 'fade'), A.pose('lid', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.say('Clang!', 1)],
        ],
      })
      .done();
  }),
  // A landfill tip: a heap of earth and rubbish (bags, tyres, a crate, an old fridge and sofa), a chain-link
  // fence with the LANDFILL sign, and gulls that wheel up off it.
  e('garbage dump', 'places', 'industry', () => {
    const b = m('garbage dump');
    b.ball([9, 4.2, 7], [0, 0.6, 0], { color: '#7a6a50' })
      .ball([4, 2.4, 3], [-2.2, 2.0, 0.4], { color: '#6a6050' })
      .ball([3, 1.8, 2.6], [2.4, 1.4, -0.8], { color: '#857358' })
      .torus([0.9, 0.9, 0.3], [1.4, 2.0, 1.4], { color: 'rubber', rot: [20, 30, 0], tube: 0.35 })
      .torus([0.8, 0.8, 0.28], [-0.4, 2.55, 0.8], { color: 'rubber', rot: [70, 10, 0], tube: 0.35 })
      .box([0.7, 0.5, 0.5], [0.2, 2.6, 0.9], { color: '#2a5ab0', rot: [10, 30, 15], edge: 'sharp' })
      .box([0.8, 1.6, 0.7], [-2.6, 3.0, 1.0], { color: '#e8e4dc', rot: [0, 20, -25], edge: 'sharp' })
      .box([1.8, 0.6, 0.8], [2.3, 2.1, 1.4], { color: '#8a5a2a', rot: [0, -20, 8], round: 0.4 })
      .ball([0.6, 0.6, 0.6], [-1.0, 2.9, 1.3], { color: '#2a2a2e' })
      .ball([0.5, 0.5, 0.5], [1.0, 1.6, 2.6], { color: '#2a2a2e' })
      .ball([0.5, 0.5, 0.5], [-3.0, 1.4, 2.4], { color: '#3a5a2a' })
      .box([0.6, 0.6, 0.6], [-2.2, 1.6, 2.4], { color: 'tan', rot: [0, 20, 10], edge: 'sharp' });
    for (let i = 0; i < 6; i++) b.stick([-4.5 + i * 1.8, 0, 4.8], [-4.5 + i * 1.8, 1.3, 4.8], 0.08, '#9aa0a8');
    b.box([9.0, 1.2, 0.02], [0, 0.65, 4.8], { color: '#c8ccd2', noInk: true, round: 0 })
      .label('LANDFILL', [2.0, 0.5], [0, 0.9, 4.85], { color: '#f2c14e', depth: 0.03 });
    for (let i = 0; i < 3; i++) {
      const n = `gull${i}`;
      b.ball([0.3, 0.15, 0.15], [-1 + i * 1.2, 3.6 + (i % 2) * 0.4, 0.5], { color: 'white', name: n });
      b.ball([0.7, 0.04, 0.2], [-1 + i * 1.2, 3.68 + (i % 2) * 0.4, 0.5], { color: '#d8dce2', parent: n, rot: [0, 0, i % 2 ? 10 : -10] });
    }
    const fly = (k: number) => A.par(...[0, 1, 2].map((i) => A.pose(`gull${i}`, { move: [k * (i - 1) * 1.5, k * (2.5 + i), k * 0.5], dur: 1 })));
    return b.act({ click: [A.par(fly(1), A.say('Squawk! Squawk!', 2), A.effect('dust', { dur: 1.5 })), A.wait(0.8), fly(0)] }).done();
  }),
  // A papery bulb of garlic, cloves bulging, with one clove broken off beside it: it comes away and back.
  e('garlic', 'food', 'vegetables', () => {
    const b = m('garlic');
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2;
      b.ball([0.035, 0.05, 0.035], [Math.cos(a) * 0.016, 0.03, Math.sin(a) * 0.016], { color: i % 2 ? '#f4ecdc' : '#ece0cc', rot: [Math.sin(a) * 15, 0, -Math.cos(a) * 15], ...(i === 0 ? { name: 'bulb' } : {}) });
    });
    b.ball([0.055, 0.055, 0.055], [0, 0.03, 0], { color: '#f4ecdc' }).cone([0.03, 0.04, 0.03], [0, 0.07, 0], { color: '#ece0cc', taper: 0.15 });
    b.each(4, (i) => void b.rod([0, 0.004, 0], [(i - 1.5) * 0.008, 0.0, 0.006], 0.003, 'tan'));
    b.ball([0.022, 0.035, 0.018], [0.03, 0.03, 0.03], { color: '#f8f0e0', rot: [0, 0, -20], name: 'clove', parent: 'bulb', piece: true });
    return b.act({ click: [[A.detach('clove', 'clove'), A.say('Phew!', 1)], [A.reattach('clove')]] }).done();
  }),
  // Toasted slices of garlic bread on a board, golden with butter and flecked with parsley: one lifts, steaming.
  e('garlic bread', 'food', 'bread', () => {
    const b = m('garlic bread').box([0.36, 0.018, 0.14], [0.02, 0.009, 0], { color: '#a8743e', round: 0.2, edge: 'sharp' });
    b.each(4, (i) => {
      const xx = -0.09 + i * 0.065, n = i === 3 ? { name: 'slice' } : {};
      b.ball([0.075, 0.07, 0.024], [xx, 0.05, 0], { color: '#d89a48', rot: [0, 0, -28], ...n });
      const p = i === 3 ? { parent: 'slice' } : {};
      b.ball([0.06, 0.055, 0.004], [xx + 0.002, 0.051, 0.012], { color: '#f4d880', rot: [0, 0, -28], ...p })
        .ball(0.008, [xx - 0.01, 0.055, 0.015], { color: '#3f8a3a', noInk: true, ...p })
        .ball(0.008, [xx + 0.012, 0.045, 0.015], { color: '#3f8a3a', noInk: true, ...p });
    });
    return b.act({ click: [A.pose('slice', { move: [0.03, 0.06, 0.02], rot: [0, 0, 20], dur: 0.4 }), A.par(A.effect('steam', { dur: 1.5 }), A.say('Mmm, garlicky!', 1.5)), A.pose('slice', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A paper tray of fries tossed in garlic and parsley: one is picked out and it steams.
  e('garlic fries', 'food', 'fast food', () => {
    const b = m('garlic fries').box([0.16, 0.05, 0.1], [0, 0.025, 0], { color: 'white', round: 0.2, edge: 'sharp' });
    b.each(4, (i) => void b.box([0.02, 0.05, 0.004], [-0.06 + i * 0.04, 0.025, 0.051], { color: '#d6262b', noInk: true }));
    b.each(10, (i) => void b.box([0.012, 0.012, 0.09], [-0.06 + i * 0.013, 0.058 + (i % 3) * 0.008, 0], { color: '#f6c840', rot: [0, (i - 5) * 12, (i % 2) * 15], round: 0.2, ...(i === 4 ? { name: 'fry' } : {}) }));
    b.each(8, (i) => void b.ball(0.01, [-0.05 + i * 0.014, 0.08, ((i * 7) % 5) * 0.012 - 0.024], { color: i % 2 ? '#3f8a3a' : 'cream', noInk: true }));
    return b.act({ click: [A.pose('fry', { move: [0, 0.07, 0.02], rot: [40, 0, 0], dur: 0.3 }), A.par(A.effect('steam', { dur: 1.2 }), A.say('Crunch!', 1)), A.pose('fry', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A rubber gas mask: two round eyepieces, a filter canister on the snout, head straps: it breathes.
  e('gas mask', 'armory', 'protective gear', () => {
    const b = m('gas mask')
      .ball([0.18, 0.2, 0.13], [0, 0.11, 0], { color: '#4a5a3a', name: 'mask' })
      .cyl([0.08, 0.06, 0.08], [0, 0.05, 0.08], { color: '#3a3a3a', rot: [70, 0, 0], parent: 'mask' })
      .cyl([0.1, 0.07, 0.1], [0, 0.03, 0.13], { color: '#5a5f66', rot: [70, 0, 0], parent: 'mask', name: 'filter', edge: 'sharp' })
      .cyl([0.084, 0.01, 0.084], [0, 0.017, 0.165], { color: 'silver', rot: [70, 0, 0], parent: 'filter', edge: 'sharp' })
      .torus([0.22, 0.18, 0.02], [0, 0.12, -0.05], { color: '#1e1e1e', rot: [90, 0, 0], tube: 0.08, parent: 'mask' });
    b.pair((s) => void b.cyl([0.06, 0.03, 0.06], [s * 0.045, 0.14, 0.055], { color: '#8fb8cc', rot: [80, 0, 0], parent: 'mask', edge: 'sharp' }).torus([0.068, 0.068, 0.02], [s * 0.045, 0.14, 0.06], { color: '#1e1e1e', rot: [-10, 0, 0], tube: 0.2, parent: 'mask' }));
    return b.act({ click: [A.pose('mask', { scale: 1.04, dur: 0.6 }), A.say('Hooo... haaa...', 2), A.pose('mask', { scale: 1, dur: 0.6 }), A.pose('mask', { scale: 1.04, dur: 0.6 }), A.pose('mask', { scale: 1, dur: 0.6 })] }).done();
  }),
  // A petrol pump (1.9 m) on its island: a lit price display, three grade buttons, a nozzle in its holster on a
  // hose; the nozzle lifts out, the display runs up and it dings.
  e('gas pump', 'garage', 'gas station', () =>
    m('gas pump', { edge: 'sharp' })
      .box([0.9, 0.15, 0.6], [0, 0.075, 0], { color: '#c8c4b8', round: 0.1 })
      .box([0.7, 1.5, 0.45], [0, 0.9, 0], { color: '#d6262b', round: 0.08 })
      .box([0.72, 0.3, 0.47], [0, 1.78, 0], { color: 'white', round: 0.12 })
      .label('FUEL', [0.4, 0.16], [0, 1.78, 0.24], { color: '#d6262b', depth: 0.01 })
      .box([0.5, 0.36, 0.02], [0, 1.35, 0.23], { color: '#1e1e1e', round: 0.1 })
      .box([0.42, 0.12, 0.01], [0, 1.42, 0.24], { color: '#7dff9a', glow: true, name: 'display', mover: { kind: 'light', on: false } })
      .box([0.42, 0.08, 0.01], [0, 1.26, 0.24], { color: '#ffb347', glow: true })
      .box([0.14, 0.3, 0.1], [0.25, 0.85, 0.25], { color: '#3a3d42', round: 0.2 })
      .box([0.05, 0.2, 0.06], [0.25, 0.9, 0.31], { color: '#1e1e1e', rot: [20, 0, 0], name: 'nozzle', round: 0.4 })
      .stick([0.25, 1.0, 0.33], [0.25, 1.06, 0.4], 0.03, '#3a3d42', { parent: 'nozzle' })
      .rod([0.25, 0.78, 0.32], [0.38, 0.3, 0.35], 0.03, '#1e1e1e', { edge: 'soft' })
      .rod([0.38, 0.3, 0.35], [0.36, 1.2, 0.24], 0.03, '#1e1e1e', { edge: 'soft' })
      .act({ click: [A.pose('nozzle', { move: [0.1, 0.1, 0.25], rot: [-60, 0, 0], dur: 0.4 }), A.operate('display', 'on'), A.say('Glug glug glug...', 2), A.wait(1.5), A.say('Ding!', 1), A.pose('nozzle', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }), A.operate('display', 'off')] })
      .done(),
  ),
  // A filling station: a 5.5 m canopy on four columns with a lit fascia, two pump islands, a little shop with a
  // glass front behind, and a tall price sign; the canopy lights come on and the forecourt bell dings.
  e('gas station', 'places', 'shops', () => {
    const b = m('gas station', { edge: 'sharp' });
    b.box([12, 0.6, 8], [0, 5.5, 2], { color: 'white', round: 0.05 })
      .box([12.05, 0.45, 8.05], [0, 5.45, 2], { color: '#d6262b', noInk: true, round: 0.05 })
      .box([11.4, 0.05, 7.4], [0, 5.18, 2], { color: '#fff6e0', glow: true, name: 'lights', mover: { kind: 'light', on: false } })
      .label('FUEL', [2.0, 0.5], [0, 5.5, 6.04], { color: '#d6262b', depth: 0.03 })
      .box([16, 0.04, 14], [0, 0.02, 1], { color: '#8a8a86', round: 0 });
    for (const [px, pz] of [[-4.5, 0], [4.5, 0], [-4.5, 4], [4.5, 4]] as const) b.box([0.45, 5.2, 0.45], [px, 2.6, pz], { color: '#e8e4dc', round: 0.1 });
    for (const px of [-2.2, 2.2]) {
      b.box([1.0, 0.2, 4.0], [px, 0.1, 2], { color: '#c8c4b8', round: 0.1 });
      for (const pz of [0.8, 3.2]) b.box([0.6, 1.6, 0.4], [px, 0.95, pz], { color: '#d6262b', round: 0.1 }).box([0.62, 0.25, 0.42], [px, 1.8, pz], { color: 'white', round: 0.1 }).box([0.4, 0.25, 0.02], [px, 1.35, pz + 0.21], { color: '#1e1e1e' });
    }
    // the shop
    b.box([10, 3.6, 5], [0, 1.8, -4], { color: '#e8e0d0', round: 0.02 })
      .box([10.3, 0.5, 5.3], [0, 3.6, -4], { color: '#d6262b', round: 0.1 })
      .label('MART', [1.6, 0.4], [0, 3.6, -1.32], { color: '#d6262b', depth: 0.02 })
      .box([6, 2.4, 0.06], [-1.5, 1.4, -1.48], { color: '#9cc3d6' })
      .each(4, (i) => void b.box([0.06, 2.4, 0.08], [-4.5 + i * 2, 1.4, -1.46], { color: '#3a3633' }));
    door(b, 'door', [3.0, 0.0, -1.5], 1.0, 2.2, { color: '#3a3633', glass: true });
    // price sign
    b.box([0.3, 7, 0.3], [7, 3.5, 5], { color: '#9aa0a8' })
      .box([1.8, 2.4, 0.3], [7, 7.2, 5], { color: 'white', round: 0.1 })
      .box([1.6, 0.5, 0.32], [7, 8.0, 5], { color: '#d6262b', round: 0.1 })
      .label('1.59', [1.2, 0.5], [7, 7.2, 5.17], { color: '#1e1e1e', depth: 0.01 })
      .label('1.79', [1.2, 0.5], [7, 6.5, 5.17], { color: '#1e1e1e', depth: 0.01 });
    return b.act({ click: [[A.operate('lights', 'on'), A.say('Ding ding!', 1.5), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')], [A.operate('lights', 'off')]] }).done();
  }),
  // A domestic propane tank (2 m long) on concrete blocks: a dome guard over the valve and gauge; the valve
  // hisses.
  e('gas tank', 'garage', 'fuel', () =>
    m('gas tank')
      .cyl([0.9, 1.6, 0.9], [0, 0.75, 0], { color: '#f2f2ee', rot: [0, 0, 90] })
      .ball([0.36, 0.9, 0.9], [0.8, 0.75, 0], { color: '#f2f2ee' })
      .ball([0.36, 0.9, 0.9], [-0.8, 0.75, 0], { color: '#f2f2ee' })
      .box([0.3, 0.3, 0.8], [0.5, 0.15, 0], { color: '#9a9590', edge: 'sharp' })
      .box([0.3, 0.3, 0.8], [-0.5, 0.15, 0], { color: '#9a9590', edge: 'sharp' })
      .dome([0.4, 0.25, 0.4], [0.1, 1.18, 0], { color: '#e8e8e4', name: 'cover', pivot: [0.1, 1.2, -0.2], mover: { kind: 'swing', axis: 'x', amount: -80 } })
      .cyl([0.12, 0.08, 0.12], [0.1, 1.24, 0], { color: 'brass', edge: 'sharp' })
      .cyl([0.1, 0.02, 0.1], [0.22, 1.24, 0.05], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .label('PROPANE', [0.7, 0.2], [-0.3, 0.75, 0.46], { color: '#d6262b', depth: 0.01 })
      .act({ click: [A.operate('cover', 'open'), A.par(A.effect('steam', { dur: 1.5 }), A.say('Hisssss...', 1.5)), A.wait(1), A.operate('cover', 'close')] })
      .done(),
  ),
  // A red 20 L jerry can of petrol with its flexible spout: it tips and pours.
  e('gasoline', 'garage', 'fuel', () =>
    m('gasoline', { edge: 'sharp' })
      .box([0.34, 0.45, 0.17], [0, 0.225, 0], { color: '#d6262b', round: 0.15, name: 'can', pivot: [0.17, 0, 0] })
      .box([0.24, 0.04, 0.17], [-0.05, 0.47, 0], { color: '#d6262b', round: 0.3, parent: 'can' })
      .stick([-0.15, 0.45, 0], [-0.15, 0.52, 0], 0.04, '#b81c25', { parent: 'can' })
      .stick([0.05, 0.45, 0], [0.05, 0.52, 0], 0.04, '#b81c25', { parent: 'can' })
      .rod([-0.15, 0.52, 0], [0.05, 0.52, 0], 0.04, '#b81c25', { parent: 'can' })
      .cyl([0.05, 0.04, 0.05], [0.13, 0.48, 0], { color: '#1e1e1e', parent: 'can' })
      .stick([0.13, 0.5, 0], [0.22, 0.6, 0], 0.03, '#f2d21e', { parent: 'can', edge: 'soft' })
      .rod([-0.13, 0.08, 0.087], [0.13, 0.36, 0.087], 0.02, '#a8141b', { noInk: true, parent: 'can' })
      .rod([0.13, 0.08, 0.087], [-0.13, 0.36, 0.087], 0.02, '#a8141b', { noInk: true, parent: 'can' })
      .act({ click: [A.pose('can', { rot: [0, 0, -50], dur: 0.6 }), A.say('Glug glug glug', 1.8), A.wait(1.2), A.pose('can', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A gateway between two stone piers with ball finials and lanterns: a pair of wrought-iron gates swing open.
  e('gateway', 'places', 'landmarks', () => {
    const b = m('gateway', { edge: 'sharp' });
    const st = '#bdb5a5';
    b.pair((s) => {
      b.box([0.7, 2.6, 0.7], [s * 1.75, 1.3, 0], { color: st, round: 0.05 }).box([0.85, 0.2, 0.85], [s * 1.75, 2.7, 0], { color: '#d8d0c0', round: 0.1 }).ball(0.45, [s * 1.75, 3.05, 0], { color: '#d8d0c0' });
      b.box([0.2, 0.3, 0.2], [s * 1.75, 2.0, 0.42], { color: '#1e1e1e', round: 0.2 }).box([0.12, 0.18, 0.12], [s * 1.75, 2.0, 0.45], { color: '#fff2c8', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: false } });
      b.box([2.6, 1.2, 0.5], [s * 3.4, 0.6, 0], { color: st, round: 0.05 });
      const n = s > 0 ? 'gateL' : 'gateR';
      b.box([1.4, 0.06, 0.04], [s * 0.7, 2.0, 0.0], { color: '#1e1e1e', name: n, pivot: [s * 1.4, 1.1, 0], mover: { kind: 'swing', axis: 'y', amount: s * -100 } });
      b.box([1.4, 0.06, 0.04], [s * 0.7, 0.2, 0.0], { color: '#1e1e1e', parent: n });
      b.box([1.4, 0.06, 0.04], [s * 0.7, 1.7, 0.0], { color: '#1e1e1e', parent: n });
      for (let i = 0; i < 7; i++) b.stick([s * (0.1 + i * 0.2), 0.15, 0], [s * (0.1 + i * 0.2), 2.2 - Math.abs(i - 3) * 0.04, 0], 0.035, '#1e1e1e', { parent: n }).cone([0.06, 0.1, 0.06], [s * (0.1 + i * 0.2), 2.25 - Math.abs(i - 3) * 0.04, 0], { color: 'gold', parent: n });
    });
    return b.act({ click: [[A.par(A.operate('gate', 'open'), A.operate('lamp', 'on'), A.say('Creeeeak...', 2))], [A.par(A.operate('gate', 'close'), A.operate('lamp', 'off')), A.say('Clang.', 1)]] }).done();
  }),
  // A brass-cased pressure gauge on its stem: the needle swings up into the red and back.
  e('gauge', 'tech', 'instruments', () => {
    const b = m('gauge', { edge: 'sharp' })
      .stick([0, 0, 0], [0, 0.045, 0], 0.025, 'brass')
      .cyl([0.12, 0.04, 0.12], [0, 0.1, 0], { color: 'brass', rot: [90, 0, 0] })
      .cyl([0.105, 0.006, 0.105], [0, 0.1, 0.02], { color: 'white', rot: [90, 0, 0] });
    b.each(9, (i) => {
      const a = ((-120 + i * 30) * Math.PI) / 180;
      b.box([0.004, 0.012, 0.003], [Math.sin(a) * 0.042, 0.1 + Math.cos(a) * 0.042, 0.024], { color: i > 6 ? '#d6262b' : '#1e1e1e', rot: [0, 0, (-a * 180) / Math.PI], noInk: true });
    });
    return b
      .stick([0, 0.1, 0.026], [-0.028, 0.08, 0.026], 0.004, '#d6262b', { name: 'needle', pivot: [0, 0.1, 0.026] })
      .ball(0.01, [0, 0.1, 0.028], { color: '#1e1e1e' })
      .act({ click: [A.pose('needle', { rot: [0, 0, -200], dur: 1.0 }), A.say('Tick tick tick... ding!', 1.5), A.pose('needle', { rot: [0, 0, -180], dur: 0.2 }), A.pose('needle', { rot: [0, 0, 0], dur: 0.8 })] })
      .done();
  }),
  // A plate-armour gauntlet: a flared cuff, a lamellar back of the hand and jointed fingers that clench.
  e('gauntlet', 'armory', 'armour', () => {
    const b = m('gauntlet', { edge: 'sharp' })
      .cyl([0.14, 0.2, 0.12], [0, 0.1, 0], { color: '#a8b0bc', taper: 0.7 })
      .cyl([0.15, 0.02, 0.13], [0, 0.01, 0], { color: '#6a7480' })
      .box([0.11, 0.1, 0.06], [0, 0.25, 0], { color: '#a8b0bc', round: 0.4 })
      .ball([0.12, 0.04, 0.07], [0, 0.205, 0], { color: '#6a7480' })
      .capsule([0.035, 0.08, 0.035], [-0.07, 0.25, 0.01], { color: '#a8b0bc', rot: [0, 0, 35] })
      .box([0.1, 0.02, 0.05], [0, 0.3, 0], { color: '#6a7480', name: 'fingers', pivot: [0, 0.3, 0] });
    b.each(4, (i) => {
      const xx = -0.036 + i * 0.024;
      b.capsule([0.022, 0.05, 0.022], [xx, 0.33, 0], { color: '#a8b0bc', parent: 'fingers' }).capsule([0.02, 0.04, 0.02], [xx, 0.375, 0.003], { color: '#6a7480', parent: 'fingers' });
    });
    return b.act({ click: [A.pose('fingers', { rot: [80, 0, 0], dur: 0.3 }), A.say('Clank!', 1), A.wait(0.6), A.pose('fingers', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A roll of gauze bandage with a sterile pad beside it: the bandage unrolls across the table.
  e('gauze', 'clinic', 'medical supplies', () => {
    const b = m('gauze')
      .cyl([0.13, 0.1, 0.13], [0, 0.065, 0.02], { color: 'white', rot: [0, 0, 90], name: 'roll' })
      .cyl([0.04, 0.102, 0.04], [0, 0.065, 0.02], { color: '#e0e0e0', rot: [0, 0, 90], parent: 'roll' })
      .box([0.1, 0.004, 0.2], [0, 0.002, 0.18], { color: 'white', round: 0, name: 'strip', pivot: [0, 0.002, 0.08] })
      .box([0.17, 0.17, 0.03], [0.05, 0.085, -0.12], { color: 'white', round: 0.1, edge: 'sharp' })
      .box([0.09, 0.03, 0.01], [0.05, 0.1, -0.102], { color: '#2a5ab0', noInk: true })
      .box([0.03, 0.09, 0.01], [0.05, 0.1, -0.102], { color: '#2a5ab0', noInk: true });
    b.each(4, (i) => void b.box([0.1, 0.002, 0.004], [0, 0.005, 0.11 + i * 0.04], { color: '#d8d8d8', noInk: true, parent: 'strip' }));
    return b.act({ click: [[A.par(A.pose('roll', { move: [0, 0, 0.25], rot: [360, 0, 0], dur: 0.8 }), A.pose('strip', { scale: 2, dur: 0.8 }))], [A.par(A.pose('roll', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 }), A.pose('strip', { scale: 1, dur: 0.6 }))]] }).done();
  }),
  // A white hexagonal garden gazebo (3.6 m): a raised deck up two steps, turned posts and rails, a shingled roof
  // with a cupola, and fairy lights round the eaves that come on.
  e('gazebo', 'garden', 'garden features', () => {
    const b = m('gazebo', { edge: 'sharp' });
    const P = around(6, 1.6, Math.PI / 6);
    b.prism([3.6, 0.35, 3.6], [0, 0.175, 0], 6, { color: '#a8743e', rot: [0, 30, 0] })
      .box([1.2, 0.17, 0.5], [0, 0.085, 1.85], { color: '#a8743e' })
      .prism([4.2, 1.4, 4.2], [0, 3.35, 0], 6, { color: '#3f6a4a', taper: 0.15, rot: [0, 30, 0] })
      .prism([3.8, 0.2, 3.8], [0, 2.6, 0], 6, { color: 'white', rot: [0, 30, 0] })
      .prism([0.7, 0.5, 0.7], [0, 4.2, 0], 6, { color: 'white', rot: [0, 30, 0] })
      .cone([0.9, 0.5, 0.9], [0, 4.7, 0], { color: '#3f6a4a', segs: 6 })
      .ball(0.18, [0, 5.0, 0], { color: 'gold' });
    for (const [px, pz] of P) b.stick([px, 0.35, pz], [px, 2.55, pz], 0.14, 'white');
    for (let i = 0; i < 6; i++) {
      const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % 6];
      if (Math.abs((z1 + z2) / 2 - 1.6) < 0.4 && Math.abs((x1 + x2) / 2) < 0.4) continue;
      b.stick([x1, 1.25, z1], [x2, 1.25, z2], 0.07, 'white').stick([x1, 0.45, z1], [x2, 0.45, z2], 0.05, 'white');
      for (let k = 1; k < 5; k++) b.stick([x1 + ((x2 - x1) * k) / 5, 0.45, z1 + ((z2 - z1) * k) / 5], [x1 + ((x2 - x1) * k) / 5, 1.25, z1 + ((z2 - z1) * k) / 5], 0.03, 'white');
    }
    around(8, 1.85, 0.2).forEach(([px, pz], i) => void b.ball(0.1, [px, 2.45, pz], { color: '#fff2a0', glow: true, name: `light${i}`, mover: { kind: 'light', on: false } }));
    b.socket('bench', [0, 0.36, 0], 'top', { size: 2.5 });
    return b.act({ click: [[A.operate('light', 'on'), A.effect('sparkle', { dur: 1.5 })], [A.operate('light', 'off')]] }).done();
  }),
  // A big cast-iron cog meshed with a small brass pinion: they turn against each other.
  e('gear', 'workshop', 'machine parts', () => {
    const b = m('gear', { edge: 'sharp' });
    const cog = (n: string, cx: number, cy: number, r: number, teeth: number, c: string, rate: number) => {
      b.cyl([r * 1.8, 0.02, r * 1.8], [cx, cy, 0], { color: c, rot: [90, 0, 0], name: n, mover: { kind: 'spin', axis: 'z', amount: rate } });
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        b.box([r * 0.35, r * 0.3, 0.02], [cx + Math.sin(a) * r, cy + Math.cos(a) * r, 0], { color: c, rot: [0, 0, (-a * 180) / Math.PI], parent: n, round: 0.1 });
      }
      b.cyl([r * 0.4, 0.024, r * 0.4], [cx, cy, 0], { color: '#2a2a2a', rot: [90, 0, 0], parent: n });
      for (const [hx, hy] of around(4, r * 0.55, 0.4)) b.cyl([r * 0.3, 0.024, r * 0.3], [cx + hx, cy + hy, 0], { color: '#3a3a3a', rot: [90, 0, 0], parent: n, noInk: true });
    };
    cog('gearBig', -0.015, 0.06, 0.05, 12, '#7a7f86', 120);
    cog('gearSmall', 0.067, 0.035, 0.028, 7, 'brass', -205);
    b.box([0.17, 0.008, 0.04], [0.02, 0.004, -0.02], { color: '#5a5f66' })
      .stick([-0.015, 0.004, -0.02], [-0.015, 0.06, -0.02], 0.008, '#5a5f66')
      .stick([0.067, 0.004, -0.02], [0.067, 0.035, -0.02], 0.008, '#5a5f66');
    return b.act({ click: [A.par(A.operate('gear', 'on'), A.say('Clickety-click', 1.5)), A.wait(2.5), A.operate('gear', 'off')] }).done();
  }),
  // A yellow Geiger counter: a carry handle, an analogue meter, a speaker grille and a wand probe on its cable:
  // the needle jumps and it clicks faster and faster.
  e('geiger counter', 'tech', 'instruments', () =>
    m('geiger counter', { edge: 'sharp' })
      .box([0.2, 0.12, 0.1], [0, 0.06, 0], { color: '#f2c14e', round: 0.2 })
      .rod([-0.07, 0.12, 0], [-0.07, 0.17, 0], 0.025, '#1e1e1e')
      .rod([0.07, 0.12, 0], [0.07, 0.17, 0], 0.025, '#1e1e1e')
      .rod([-0.07, 0.17, 0], [0.07, 0.17, 0], 0.025, '#1e1e1e')
      .cyl([0.065, 0.01, 0.065], [-0.04, 0.065, 0.05], { color: 'white', rot: [90, 0, 0] })
      .stick([-0.04, 0.045, 0.057], [-0.055, 0.085, 0.057], 0.004, '#d6262b', { name: 'needle', pivot: [-0.04, 0.045, 0.057] })
      .label('mR/h', [0.03, 0.01], [-0.04, 0.05, 0.057], { color: 'white', depth: 0.001 })
      .cyl([0.02, 0.012, 0.02], [0.05, 0.08, 0.05], { color: '#1e1e1e', rot: [90, 0, 0] })
      .rod([0.1, 0.04, 0], [0.2, 0.02, 0.06], 0.012, '#1e1e1e', { edge: 'soft' })
      .cyl([0.035, 0.16, 0.035], [0.26, 0.0175, 0.12], { color: 'silver', rot: [90, 30, 0], name: 'probe' })
      .act({ click: [A.say('Click... click... click-click-clickclickclick!', 2.5), A.pose('needle', { rot: [0, 0, -40], dur: 0.4 }), A.pose('needle', { rot: [0, 0, -25], dur: 0.15 }), A.pose('needle', { rot: [0, 0, -70], dur: 0.4 }), A.pose('needle', { rot: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A tub of blue hair gel: the lid twists off to show the glossy gel inside.
  e('gel', 'home', 'bathroom', () =>
    m('gel', { edge: 'sharp' })
      .cyl([0.09, 0.06, 0.09], [0, 0.03, 0], { color: 'white' })
      .cyl([0.08, 0.008, 0.08], [0, 0.061, 0], { color: '#40a0e0', edge: 'soft' })
      .ball([0.04, 0.025, 0.04], [0, 0.066, 0], { color: '#60b8f0', edge: 'soft' })
      .cyl([0.095, 0.022, 0.095], [0, 0.072, 0], { color: '#2a5ab0', name: 'lid', piece: true })
      .label('GEL', [0.05, 0.025], [0, 0.03, 0.046], { color: '#2a5ab0', depth: 0.002 })
      .act({ click: [[A.pose('lid', { move: [0.07, -0.02, 0.02], rot: [0, 180, 70], dur: 0.5 }), A.effect('sparkle', { dur: 1 })], [A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A cherry jelly turned out of its fluted mould, cream and a cherry on top: it wibbles and wobbles.
  e('gelatin', 'food', 'desserts', () => {
    const b = m('gelatin');
    plate(b, 0.2);
    return b
      .cyl([0.12, 0.07, 0.12], [0, 0.047, 0], { color: '#e02040', taper: 0.75, segs: 12 })
      .torus([0.115, 0.115, 0.01], [0, 0.032, 0], { color: '#f04060', rot: [90, 0, 0], tube: 0.1 })
      .ball([0.09, 0.03, 0.09], [0, 0.082, 0], { color: '#e02040' })
      .ball([0.04, 0.03, 0.04], [0, 0.102, 0], { color: 'white' })
      .ball(0.014, [0, 0.122, 0], { color: '#c8101a' })
      .act({ click: [A.par(A.anim('wobble', 3), A.say('Wibble wobble!', 1.5))] })
      .done();
  }),
  // A round brilliant-cut amethyst on a small velvet cushion: it turns and sparkles.
  e('gem', 'nature', 'gems', () =>
    m('gem')
      .box([0.1, 0.03, 0.08], [0, 0.015, 0], { color: '#8a141b', round: 0.6 })
      .cone([0.07, 0.04, 0.07], [0, 0.05, 0], { color: '#7a30c0', rot: [180, 0, 0], segs: 8, edge: 'sharp', name: 'stone' })
      .cyl([0.07, 0.02, 0.07], [0, 0.08, 0], { color: '#a060e8', taper: 0.6, segs: 8, edge: 'sharp', parent: 'stone' })
      .ball(0.008, [0.012, 0.09, 0.015], { color: 'white', glow: true, parent: 'stone' })
      .act({ click: [A.par(A.pose('stone', { rot: [0, 360, 0], dur: 1.5 }), A.effect('sparkle', { dur: 1.5 })), A.pose('stone', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A portable petrol generator in its tube frame: engine, fuel tank, a panel of sockets and a recoil starter;
  // the cord is pulled and it chugs into life.
  e('generator', 'tech', 'power', () => {
    const b = m('generator', { edge: 'sharp' })
      .box([0.5, 0.35, 0.4], [0, 0.3, 0], { color: '#d6262b', round: 0.2 })
      .box([0.4, 0.15, 0.35], [0, 0.55, 0], { color: '#f2c14e', round: 0.3 })
      .cyl([0.06, 0.03, 0.06], [0.1, 0.64, 0], { color: '#1e1e1e' })
      .box([0.2, 0.14, 0.02], [-0.08, 0.3, 0.21], { color: '#3a3d42' })
      .cyl([0.025, 0.01, 0.025], [-0.12, 0.3, 0.225], { color: '#f0821e', rot: [90, 0, 0] })
      .cyl([0.025, 0.01, 0.025], [-0.04, 0.3, 0.225], { color: '#f0821e', rot: [90, 0, 0] })
      .ball(0.015, [-0.08, 0.35, 0.225], { color: '#5aff7a', glow: true, name: 'light', mover: { kind: 'light', on: false } })
      .cyl([0.1, 0.02, 0.1], [0.16, 0.3, 0.21], { color: '#9aa0a8', rot: [90, 0, 0] })
      .box([0.04, 0.03, 0.06], [0.16, 0.3, 0.24], { color: '#1e1e1e', name: 'cord', round: 0.4 });
    b.pair((s) => {
      b.stick([s * 0.3, 0.1, 0.22], [s * 0.3, 0.68, 0.22], 0.035, '#1e1e1e').stick([s * 0.3, 0.1, -0.22], [s * 0.3, 0.68, -0.22], 0.035, '#1e1e1e');
      b.stick([s * 0.3, 0.68, 0.22], [s * 0.3, 0.68, -0.22], 0.035, '#1e1e1e').stick([s * 0.3, 0.1, 0.22], [s * 0.3, 0.1, -0.22], 0.035, '#1e1e1e');
    });
    wheel(b, 'wheelL', [0.34, 0.1, -0.15], 0.2, 0.07, '#5a5f66');
    wheel(b, 'wheelR', [-0.34, 0.1, -0.15], 0.2, 0.07, '#5a5f66');
    return b.box([0.06, 0.1, 0.06], [-0.3, 0.05, 0.18], { color: '#1e1e1e' }).act({ click: [[A.pose('cord', { move: [0, 0, 0.3], dur: 0.2 }), A.pose('cord', { move: [0, 0, 0], dur: 0.2 }), A.operate('light', 'on'), A.par(A.anim('shake', 4), A.effect('smoke', { dur: 2 }), A.say('Put-put-put-put!', 2))], [A.operate('light', 'off'), A.say('Phut.', 1)]] }).done();
  }),
  // A present wrapped in red paper with a gold ribbon and bow: the lid pops off and a golden egg jumps out.
  e('gift', 'toys', 'party', () =>
    m('gift', { edge: 'sharp' })
      .box([0.2, 0.15, 0.2], [0, 0.075, 0], { color: '#d6262b', round: 0.05 })
      .box([0.04, 0.152, 0.202], [0, 0.075, 0], { color: 'gold', round: 0.05, noInk: true })
      .box([0.202, 0.152, 0.04], [0, 0.075, 0], { color: 'gold', round: 0.05, noInk: true })
      .box([0.22, 0.05, 0.22], [0, 0.175, 0], { color: '#d6262b', round: 0.1, name: 'lid', piece: true })
      .box([0.04, 0.052, 0.222], [0, 0.175, 0], { color: 'gold', parent: 'lid', noInk: true })
      .box([0.222, 0.052, 0.04], [0, 0.175, 0], { color: 'gold', parent: 'lid', noInk: true })
      .ball([0.08, 0.05, 0.03], [0.04, 0.215, 0], { color: 'gold', rot: [0, 0, 25], parent: 'lid', edge: 'soft' })
      .ball([0.08, 0.05, 0.03], [-0.04, 0.215, 0], { color: 'gold', rot: [0, 0, -25], parent: 'lid', edge: 'soft' })
      .ball(0.03, [0, 0.21, 0], { color: 'gold', parent: 'lid', edge: 'soft' })
      .socket('inside', [0, 0.1, 0], 'inside', { size: 0.15 })
      .act({
        click: [
          [A.pose('lid', { move: [0, 0.2, 0], rot: [0, 0, 20], dur: 0.3 }), A.spawn('egg', 'golden egg', { rel: 'front', of: 'self', dist: 'touch' }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Surprise!', 1.5)), A.wait(1.5), A.remove('egg', 'pop'), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done(),
  ),
  // A gold gift card on a little wooden stand, tied with a red bow: it turns to show itself off.
  e('gift certificate', 'toys', 'party', () =>
    m('gift certificate', { edge: 'sharp' })
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: '#5a3a22' })
      .box([0.16, 0.1, 0.006], [0, 0.07, 0], { color: '#d9b24a', round: 0.15, name: 'card', pivot: [0, 0.02, 0] })
      .box([0.025, 0.1, 0.008], [-0.045, 0.07, 0], { color: '#d6262b', noInk: true, parent: 'card' })
      .label('GIFT CARD', [0.08, 0.03], [0.025, 0.08, 0.004], { color: '#d9b24a', parent: 'card', depth: 0.002 })
      .label('$50', [0.05, 0.025], [0.03, 0.045, 0.004], { color: '#d9b24a', parent: 'card', depth: 0.002 })
      .ball([0.035, 0.022, 0.01], [-0.055, 0.1, 0.006], { color: '#d6262b', rot: [0, 0, 25], parent: 'card', edge: 'soft' })
      .ball([0.035, 0.022, 0.01], [-0.035, 0.1, 0.006], { color: '#d6262b', rot: [0, 0, -25], parent: 'card', edge: 'soft' })
      .act({ click: [A.par(A.pose('card', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1 }), A.say('Ta-da!', 1.2)), A.pose('card', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A souvenir and gift shop under a pitched roof: a red-and-cream awning, wrapped presents and a teddy in the
  // windows; a present pops out of the door when it opens.
  e('gift shop', 'places', 'shops', () => {
    const b = shop('gift shop', { w: 6, d: 5, h: 4.2, wall: '#f0e0c0', trim: '#c04050', sign: 'GIFTS', signC: 'white', signBg: '#c04050', awning: ['#c04050', '#f8f0e0'], roof: 'gable', roofC: '#7a3040', frame: '#5a2a30' });
    const fz = 2.5;
    b.pair((s) => {
      b.box([0.5, 0.4, 0.4], [s * 1.6, 0.8, fz - 0.3], { color: s > 0 ? '#2a5ab0' : '#3f8a3a', round: 0.05 }).box([0.52, 0.06, 0.42], [s * 1.6, 1.0, fz - 0.3], { color: 'gold' });
      b.box([0.35, 0.3, 0.35], [s * 2.1, 0.75, fz - 0.3], { color: '#d6262b', round: 0.05 });
    });
    b.ball([0.4, 0.45, 0.3], [-1.9, 1.3, fz - 0.3], { color: '#a8743e', edge: 'soft' }).ball(0.28, [-1.9, 1.65, fz - 0.3], { color: '#a8743e', edge: 'soft' });
    return b
      .act({ click: [A.operate('door', 'open'), A.par(A.say('Ding-dong!', 1.5), A.spawn('present', 'gift', { rel: 'front', of: 'self', dist: 'close' })), A.effect('sparkle', { id: 'present', dur: 1.2 }), A.wait(1.2), A.par(A.remove('present', 'pop'), A.operate('door', 'close'))] })
      .done();
  }),
  // A fish's head breaking the surface, the gill cover (operculum) open over red gill filaments: it breathes.
  e('gill', 'sea', 'sea animal parts', () =>
    m('gill', { view: 'side' })
      .cyl([0.3, 0.015, 0.24], [0, 0.0075, 0], { color: '#3f7fb8', edge: 'sharp' })
      .loft([0.07, 0.09, 0.26], [0, 0.07, 0], [[0, 0.5, 0.5], [0.3, 0.95, 0.95], [0.75, 1, 1], [1, 0.4, 0.45, -0.05]], { color: '#9aa8b8' })
      .cone([0.06, 0.06, 0.015], [0, 0.07, -0.15], { color: '#9aa8b8', rot: [-90, 0, 0] })
      .loft([0.05, 0.03, 0.22], [0, 0.105, -0.01], [[0, 0.4, 0.4], [0.5, 1, 1], [1, 0.4, 0.5]], { color: '#5a6a7a' })
      .box([0.04, 0.004, 0.01], [0, 0.06, 0.13], { color: '#3a3d42', noInk: true })
      .ball(0.014, [0.026, 0.085, 0.09], { color: '#1e1e1e', eye: true })
      .ball([0.006, 0.06, 0.05], [0.032, 0.07, 0.03], { color: '#d6262b' })
      .ball([0.006, 0.05, 0.04], [0.031, 0.07, 0.02], { color: '#e04050' })
      .ball([0.01, 0.07, 0.05], [0.036, 0.07, 0.04], { color: '#8a98a8', name: 'cover', pivot: [0.033, 0.07, 0.065] })
      .act({ click: [A.pose('cover', { rot: [0, 35, 0], dur: 0.4 }), A.par(A.effect('water_spray', { dur: 0.8 }), A.say('Blub...', 1)), A.pose('cover', { rot: [0, 0, 0], dur: 0.4 }), A.pose('cover', { rot: [0, 35, 0], dur: 0.4 }), A.pose('cover', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A green glass bottle of ginger ale with its label: the crown cap pops off with a fizz.
  e('ginger ale', 'food', 'drinks', () => {
    const b = bottle(m('ginger ale', { edge: 'sharp' }), 0, 0, 0.26, 0.068, '#2a8a3a', 'gold', '#f2e6c8', 'cap');
    return b
      .label('GINGER ALE', [0.05, 0.035], [0, 0.08, 0.036], { color: '#f2e6c8', depth: 0.002 })
      .act({ click: [[A.pose('cap', { move: [0.04, 0.08, 0], rot: [0, 0, -60], dur: 0.3 }), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Pop! Fizzzz...', 1.5))], [A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })]] })
      .done();
  }),
  // A gingerbread man with icing buttons and a smile, standing: he hops and dares you to catch him.
  e('gingerbread', 'food', 'sweets', () => {
    const b = m('gingerbread')
      .ball([0.05, 0.048, 0.016], [0, 0.105, 0], { color: '#a8602a' })
      .box([0.05, 0.05, 0.016], [0, 0.062, 0], { color: '#a8602a', round: 0.6 });
    b.pair((s) => {
      b.capsule([0.022, 0.05, 0.016], [s * 0.035, 0.072, 0], { color: '#a8602a', rot: [0, 0, s * 70] });
      b.capsule([0.022, 0.05, 0.016], [s * 0.015, 0.024, 0], { color: '#a8602a', rot: [0, 0, s * 15] });
      b.ball(0.007, [s * 0.01, 0.11, 0.008], { color: 'white', noInk: true });
      b.rod([s * 0.042, 0.082, 0.008], [s * 0.042, 0.062, 0.008], 0.004, 'white', { noInk: true });
    });
    b.each(2, (i) => void b.ball(0.009, [0, 0.072 - i * 0.02, 0.009], { color: i ? '#3f8a3a' : '#d6262b' }));
    return b.arc([0.022, 0.012, 0.004], [0, 0.097, 0.008], { color: 'white', rot: [0, 0, 180], noInk: true }).act({ click: [A.par(A.anim('hop', 3), A.say("Run, run, as fast as you can!", 2.5))] }).done();
  }),
  // A gingerbread cottage with an iced roof, gumdrops along the ridge, sugar windows and a candy-cane post: the
  // door opens and the windows twinkle.
  e('gingerbread house', 'food', 'sweets', () => {
    const b = m('gingerbread house')
      .box([0.34, 0.012, 0.28], [0, 0.006, 0], { color: 'white', edge: 'sharp' })
      .box([0.24, 0.16, 0.2], [0, 0.092, 0], { color: '#a8602a', round: 0.05, edge: 'sharp' })
      .wedge([0.26, 0.12, 0.26], [0, 0.23, 0], { color: '#a8602a', rot: [0, 90, 0] })
      .wedge([0.27, 0.13, 0.28], [0, 0.236, 0], { color: 'white', rot: [0, 90, 0] })
      .box([0.06, 0.09, 0.01], [0, 0.057, 0.102], { color: '#6a3a1a', round: 0.3, name: 'door', pivot: [-0.03, 0.057, 0.102], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .ball(0.008, [0.02, 0.06, 0.11], { color: '#d6262b', parent: 'door' })
      .box([0.05, 0.04, 0.01], [0.075, 0.11, 0.102], { color: '#f2d21e', glow: true, name: 'window', mover: { kind: 'light', on: false } })
      .box([0.05, 0.04, 0.01], [-0.075, 0.11, 0.102], { color: '#f2d21e', glow: true, name: 'window2', mover: { kind: 'light', on: false } });
    ['#d6262b', '#3f8a3a', '#f2d21e', '#ef6f9a', '#2a5ab0'].forEach((c, i) => void b.ball(0.022, [0, 0.3, -0.1 + i * 0.05], { color: c }).ball(0.02, [-0.1 + i * 0.05, 0.024, 0.13], { color: c }));
    return b.stick([0.15, 0.012, 0.12], [0.15, 0.14, 0.12], 0.016, 'white').stick([0.15, 0.04, 0.12], [0.15, 0.07, 0.12], 0.017, '#d6262b', { noInk: true }).arc([0.04, 0.03, 0.016], [0.13, 0.14, 0.12], { color: 'white' }).act({ click: [[A.operate('door', 'open'), A.operate('window', 'on'), A.effect('sparkle', { dur: 1.2 })], [A.operate('door', 'close'), A.operate('window', 'off')]] }).done();
  }),
  // A pink laced girdle on a dressmaker's form: the laces cinch it in.
  e('girdle', 'wardrobe', 'underwear', () => {
    const b = m('girdle')
      .cyl([0.22, 0.03, 0.22], [0, 0.015, 0], { color: '#3a2618', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.55, 0], 0.025, '#3a2618', { edge: 'sharp' })
      .ball([0.3, 0.3, 0.22], [0, 0.95, 0], { color: '#e8dccc' })
      .cyl([0.28, 0.3, 0.2], [0, 0.72, 0], { color: '#e8dccc', taper: 1.1 })
      .cyl([0.3, 0.2, 0.22], [0, 0.6, 0], { color: '#e8dccc', taper: 0.85 })
      .cyl([0.29, 0.34, 0.21], [0, 0.73, 0], { color: '#e85a8a', taper: 1.1, name: 'girdle' })
      .torus([0.33, 0.24, 0.012], [0, 0.9, 0], { color: 'white', rot: [90, 0, 0], tube: 0.05, parent: 'girdle' })
      .torus([0.3, 0.22, 0.012], [0, 0.56, 0], { color: 'white', rot: [90, 0, 0], tube: 0.05, parent: 'girdle' });
    b.each(5, (i) => {
      const y = 0.6 + i * 0.06;
      b.rod([-0.02, y, 0.105], [0.02, y + 0.05, 0.105], 0.005, '#1e1e1e', { noInk: true, parent: 'girdle' }).rod([0.02, y, 0.105], [-0.02, y + 0.05, 0.105], 0.005, '#1e1e1e', { noInk: true, parent: 'girdle' });
    });
    return b.act({ click: [A.pose('girdle', { scale: 0.94, dur: 0.4 }), A.say('Squeeeeze!', 1.5), A.pose('girdle', { scale: 1, dur: 0.4 })] }).done();
  }),
  // A glacier in miniature (15 m): a tongue of blue-white ice creeping down between two rocky peaks into a lake,
  // crevasses across it, icebergs bobbing; a slab breaks off the snout into the water.
  e('glacier', 'nature', 'landforms', () => {
    const b = m('glacier');
    b.cyl([18, 0.3, 12], [0, 0.15, 3], { color: '#3f7fb8', edge: 'sharp' })
      .cone([9, 15, 8], [-5.5, 7.5, -3], { color: '#7a7470' })
      .cone([4.5, 4, 4], [-5.5, 13.2, -3], { color: 'snow' })
      .cone([8, 12, 7], [5.5, 6, -3.5], { color: '#857f78' })
      .cone([3.5, 3, 3.2], [5.5, 10.6, -3.5], { color: 'snow' })
      .loft([6, 5, 12], [0, 2.0, -1.5], [[0, 1, 1, 0.5], [0.4, 0.95, 0.8, 0.1], [0.8, 0.85, 0.6, -0.15], [1, 0.75, 0.45, -0.25]], { color: '#d8f0fa', boxy: 0.5, cut: 'top' })
      .loft([5.6, 2.2, 4], [0, 4.6, -7], [[0, 1, 1], [1, 1, 0.9, -0.1]], { color: '#e8f6fc', boxy: 0.5 });
    for (let i = 0; i < 4; i++) b.box([2.4 - i * 0.2, 0.12, 0.2], [0, 3.9 - i * 0.55, -3 + i * 1.6], { color: '#6ab8e0', noInk: true, rot: [-15, 0, (i % 2 ? 6 : -6)], round: 0 });
    b.box([3.6, 1.8, 1.2], [0, 1.4, 4.5], { color: '#bfe6f6', round: 0.1, name: 'slab', edge: 'sharp' })
      .box([1.4, 0.8, 1.1], [4.0, 0.5, 5.5], { color: 'ice', rot: [0, 30, 8], edge: 'sharp' })
      .box([1.0, 0.6, 0.8], [-4.2, 0.4, 6.2], { color: 'ice', rot: [0, -20, -6], edge: 'sharp' });
    return b
      .act({
        click: [
          [A.pose('slab', { rot: [40, 0, 0], move: [0, -0.8, 1.2], dur: 0.6 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('CRAAACK! Splash!', 2)), A.wait(1)],
          [A.pose('slab', { rot: [0, 0, 0], move: [0, 0, 0], dur: 1 }), A.effect('snow', { dur: 1.5 })],
        ],
      })
      .done();
  }),
  // An anatomical model of the thyroid gland on its stand: two lobes joined by the isthmus, its blood vessels; it
  // pulses.
  e('gland', 'clinic', 'organs', () =>
    m('gland')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'white', round: 0.4, edge: 'sharp' })
      .stick([0, 0.02, -0.01], [0, 0.04, -0.01], 0.01, 'silver', { edge: 'sharp' })
      .ball([0.045, 0.08, 0.035], [0.035, 0.08, 0.01], { color: '#c8505a', rot: [0, 0, -12], name: 'lobes' })
      .ball([0.045, 0.08, 0.035], [-0.035, 0.08, 0.01], { color: '#c8505a', rot: [0, 0, 12], parent: 'lobes' })
      .box([0.04, 0.025, 0.025], [0, 0.065, 0.012], { color: '#b84050', round: 0.6, parent: 'lobes' })
      .rod([0.035, 0.11, 0.03], [0.02, 0.08, 0.03], 0.004, '#7a2a4a', { noInk: true, parent: 'lobes' })
      .rod([-0.035, 0.11, 0.03], [-0.02, 0.08, 0.03], 0.004, '#2a4a8a', { noInk: true, parent: 'lobes' })
      .act({ click: [A.pose('lobes', { scale: 1.1, dur: 0.25 }), A.pose('lobes', { scale: 1, dur: 0.25 }), A.pose('lobes', { scale: 1.1, dur: 0.25 }), A.pose('lobes', { scale: 1, dur: 0.25 }), A.say('Ba-bump.', 1)] })
      .done(),
  ),
  // Cinderella's glass slipper: a clear pointed court shoe on a slim heel: it turns and glitters.
  e('glass slipper', 'fantasy', 'magic items', () =>
    m('glass slipper', { view: 'side' })
      .dome([0.075, 0.05, 0.11], [0, 0.025, 0.06], { color: '#cfeefa', name: 'shoe' })
      .box([0.066, 0.008, 0.14], [0, 0.045, -0.035], { color: '#bfe6f6', rot: [28, 0, 0], round: 0.5, parent: 'shoe' })
      .ball([0.072, 0.055, 0.07], [0, 0.1, -0.085], { color: '#cfeefa', parent: 'shoe' })
      .ball([0.05, 0.02, 0.05], [0, 0.125, -0.075], { color: '#9fd0e8', noInk: true, parent: 'shoe' })
      .cyl([0.016, 0.08, 0.016], [0, 0.04, -0.1], { color: '#cfeefa', taper: 1.7, parent: 'shoe' })
      .ball(0.012, [0, 0.055, 0.09], { color: 'white', glow: true, parent: 'shoe' })
      .star(0.03, [0.04, 0.09, 0.03], { color: 'white', glow: true })
      .act({ click: [A.par(A.pose('shoe', { rot: [0, 360, 0], dur: 1.5 }), A.effect('sparkle', { dur: 2 })), A.pose('shoe', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A ring cake being glazed: white icing drips down its sides, and more runs down when it is poured.
  e('glaze', 'food', 'baking', () => {
    const b = m('glaze');
    plate(b, 0.22);
    b.cyl([0.16, 0.07, 0.16], [0, 0.047, 0], { color: '#b07038', taper: 0.85 }).ball([0.14, 0.03, 0.14], [0, 0.08, 0], { color: '#f6f0e0' }).cyl([0.04, 0.03, 0.04], [0, 0.09, 0], { color: '#b07038' });
    around(7, 0.07, 0.3).forEach(([px, pz], i) => void b.capsule([0.018, 0.04, 0.012], [px, 0.065, pz], { color: '#f6f0e0', name: `drip${i}`, pivot: [px, 0.085, pz] }));
    const drip = (k: number) => A.par(...[0, 2, 4, 6].map((i) => A.pose(`drip${i}`, { scale: k, dur: 0.6 })));
    return b.act({ click: [[drip(1.5), A.say('Drizzle...', 1.2)], [drip(1), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // A desk globe on a turned wooden stand inside its brass meridian ring: it spins.
  e('globe', 'study', 'geography', () =>
    m('globe')
      .cyl([0.16, 0.025, 0.16], [0, 0.0125, 0], { color: '#5a3a22', edge: 'sharp' })
      .cyl([0.04, 0.06, 0.04], [0, 0.05, 0], { color: '#5a3a22', taper: 0.6, edge: 'sharp' })
      .arc([0.3, 0.3, 0.012], [0, 0.22, 0], { color: 'brass', arc: 270, rot: [0, 0, 180], edge: 'sharp' })
      .ball(0.26, [0, 0.22, 0], { color: '#3a7ac8', name: 'earth', mover: { kind: 'spin', axis: 'y', amount: 240 } })
      .ball([0.1, 0.12, 0.05], [-0.04, 0.25, 0.1], { color: '#4f8a3a', parent: 'earth', noInk: true })
      .ball([0.08, 0.1, 0.05], [0.07, 0.18, 0.09], { color: '#4f8a3a', parent: 'earth', noInk: true })
      .ball([0.09, 0.06, 0.06], [0.08, 0.28, -0.07], { color: '#4f8a3a', parent: 'earth', noInk: true })
      .ball([0.12, 0.1, 0.06], [-0.06, 0.2, -0.09], { color: '#c8a060', parent: 'earth', noInk: true })
      .ball([0.06, 0.03, 0.06], [0, 0.345, 0], { color: 'white', parent: 'earth', noInk: true })
      .act({ click: [A.operate('earth', 'on'), A.say('Whirrr...', 1.5), A.wait(2), A.operate('earth', 'off')] })
      .done(),
  ),
  // A tan leather glove, fingers up: it waves hello.
  e('glove', 'wardrobe', 'gloves', () => {
    const b = m('glove')
      .cyl([0.1, 0.07, 0.045], [0, 0.035, 0], { color: '#8a5030', taper: 0.9, name: 'hand', pivot: [0, 0, 0] })
      .box([0.1, 0.1, 0.04], [0, 0.12, 0], { color: '#9a6038', round: 0.45, parent: 'hand' })
      .capsule([0.028, 0.07, 0.028], [-0.065, 0.13, 0.005], { color: '#9a6038', rot: [0, 0, 40], parent: 'hand' });
    b.each(4, (i) => void b.capsule([0.024, 0.075 + (i === 1 || i === 2 ? 0.015 : 0), 0.026], [-0.034 + i * 0.023, 0.2 + (i === 1 || i === 2 ? 0.007 : 0), 0], { color: '#9a6038', parent: 'hand' }));
    b.box([0.1, 0.008, 0.046], [0, 0.07, 0], { color: '#6a3a20', noInk: true, parent: 'hand' }).each(3, (i) => void b.box([0.002, 0.05, 0.002], [-0.02 + i * 0.02, 0.12, 0.021], { color: '#6a3a20', noInk: true, parent: 'hand' }));
    return b.act({ click: [A.pose('hand', { rot: [0, 0, 18], dur: 0.25 }), A.say('Flap flap!', 1.2), A.pose('hand', { rot: [0, 0, -18], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 18], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // A pair of red knitted mittens with snowflakes, joined by a string: they clap together.
  e('gloves', 'wardrobe', 'gloves', () => {
    const b = m('gloves');
    b.pair((s) => {
      const n = s > 0 ? 'mittenL' : 'mittenR';
      b.box([0.1, 0.05, 0.045], [s * 0.075, 0.025, 0], { color: 'white', round: 0.5, name: n })
        .box([0.1, 0.16, 0.042], [s * 0.075, 0.13, 0], { color: '#d6262b', round: 0.7, parent: n })
        .capsule([0.035, 0.07, 0.035], [s * 0.075 + s * 0.06, 0.12, 0.004], { color: '#d6262b', rot: [0, 0, -s * 35], parent: n })
        .star(0.04, [s * 0.075, 0.13, 0.024], { color: 'white', noInk: true, parent: n });
    });
    b.rod([-0.075, 0.03, -0.02], [0, 0.005, -0.05], 0.006, 'white').rod([0, 0.005, -0.05], [0.075, 0.03, -0.02], 0.006, 'white');
    const clap = (k: number) => A.par(A.pose('mittenL', { move: [-0.03 * k, 0, 0], rot: [0, -40 * k, 0], dur: 0.15 }), A.pose('mittenR', { move: [0.03 * k, 0, 0], rot: [0, 40 * k, 0], dur: 0.15 }));
    return b.act({ click: [clap(1), clap(0), clap(1), A.say('Clap clap!', 1), clap(0)] }).done();
  }),
  // A glow stick: bent to snap the vial inside, it lights up green; a pink one and a bracelet lie beside it.
  e('glow stick', 'toys', 'party', () =>
    m('glow stick')
      .capsule([0.022, 0.2, 0.022], [-0.02, 0.1, 0], { color: '#7add3a', rot: [0, 0, 12], name: 'stick', pivot: [-0.02, 0.1, 0] })
      .capsule([0.01, 0.16, 0.01], [-0.02, 0.1, 0.008], { color: '#d8ff80', rot: [0, 0, 12], glow: true, parent: 'stick', name: 'glow', mover: { kind: 'light', on: false } })
      .capsule([0.022, 0.2, 0.022], [0.03, 0.1, 0.02], { color: '#e040c0', rot: [0, 0, -15] })
      .capsule([0.01, 0.16, 0.01], [0.03, 0.1, 0.028], { color: '#ffa0f0', rot: [0, 0, -15], glow: true })
      .torus([0.1, 0.1, 0.014], [0.0, 0.007, 0.07], { color: '#3fc0d0', rot: [90, 0, 0], tube: 0.14 })
      .act({ click: [[A.pose('stick', { rot: [0, 0, 25], dur: 0.15 }), A.pose('stick', { rot: [0, 0, 0], dur: 0.15 }), A.par(A.operate('glow', 'on'), A.say('Snap!', 1), A.effect('sparkle', { dur: 1 }))], [A.operate('glow', 'off')]] })
      .done(),
  ),
  // A bottle of white school glue with an orange nozzle cap: a squeeze, and a drop wells up.
  e('glue', 'study', 'stationery', () =>
    m('glue')
      .cyl([0.055, 0.1, 0.035], [0, 0.05, 0], { color: 'white', name: 'bottle' })
      .cyl([0.055, 0.02, 0.035], [0, 0.11, 0], { color: 'white', taper: 0.5 })
      .cone([0.028, 0.04, 0.028], [0, 0.14, 0], { color: '#f0821e', taper: 0.2, edge: 'sharp' })
      .cyl([0.058, 0.05, 0.038], [0, 0.05, 0], { color: '#f0821e', noInk: true })
      .label('GLUE', [0.04, 0.025], [0, 0.05, 0.02], { color: 'white', depth: 0.002 })
      .ball(0.012, [0, 0.165, 0], { color: '#f6f6f0', name: 'drop', scale: 0 })
      .act({ click: [A.pose('bottle', { scale: 0.92, dur: 0.15 }), A.pose('drop', { scale: 1, dur: 0.3 }), A.say('Squelch!', 1), A.pose('bottle', { scale: 1, dur: 0.2 }), A.wait(0.8), A.pose('drop', { scale: 0, dur: 0.3 })] })
      .done(),
  ),
  // A hot glue gun: a pistol grip with its trigger, a metal nozzle, a glue stick fed in the back and a wire stand;
  // the trigger squeezes and a hot bead oozes out.
  e('glue gun', 'workshop', 'power tools', () =>
    m('glue gun', { view: 'side', edge: 'sharp' })
      .box([0.05, 0.07, 0.17], [0, 0.15, 0.0], { color: '#2a8a8a', round: 0.5 })
      .box([0.045, 0.13, 0.05], [0, 0.07, -0.04], { color: '#2a8a8a', rot: [-12, 0, 0], round: 0.5 })
      .box([0.015, 0.045, 0.02], [0, 0.1, 0.015], { color: '#f2d21e', round: 0.4, name: 'trigger', pivot: [0, 0.12, 0.015] })
      .cone([0.025, 0.05, 0.025], [0, 0.15, 0.11], { color: 'silver', rot: [90, 0, 0], taper: 0.3 })
      .cyl([0.012, 0.1, 0.012], [0, 0.16, -0.12], { color: '#f6f6f0', rot: [90, 0, 0] })
      .rod([0.0, 0.03, 0.03], [0.0, 0.0, 0.08], 0.012, 'silver')
      .rod([0, 0.13, -0.08], [0.05, 0.02, -0.2], 0.01, '#1e1e1e', { edge: 'soft' })
      .ball(0.012, [0, 0.15, 0.14], { color: '#ffe6a0', glow: true, name: 'bead', scale: 0 })
      .act({ click: [A.pose('trigger', { rot: [-25, 0, 0], dur: 0.2 }), A.pose('bead', { scale: 1, dur: 0.6 }), A.say('Ooze...', 1), A.pose('trigger', { rot: [0, 0, 0], dur: 0.2 }), A.wait(0.8), A.pose('bead', { scale: 0, dur: 0.2 })] })
      .done(),
  ),
  // A full-size football goal (7.32 m x 2.44 m): round white posts and crossbar, a net stretched back to the
  // ground frame; a shot hits the back of the net.
  e('goalpost', 'sports', 'fields', () => {
    const b = m('goalpost');
    b.stick([-3.66, 2.44, 0], [3.66, 2.44, 0], 0.12, 'white', { edge: 'sharp' })
      .box([7.3, 2.4, 0.03], [0, 1.2, -1.8], { color: '#e4e4e8', noInk: true, name: 'net', edge: 'sharp' })
      .box([7.3, 0.03, 1.8], [0, 2.42, -0.9], { color: '#e4e4e8', noInk: true, edge: 'sharp' })
      .stick([-3.66, 0.03, -1.8], [3.66, 0.03, -1.8], 0.05, 'white', { edge: 'sharp' });
    b.pair((s) => {
      b.stick([s * 3.66, 0, 0], [s * 3.66, 2.5, 0], 0.12, 'white', { edge: 'sharp' }).box([0.03, 2.4, 1.8], [s * 3.66, 1.2, -0.9], { color: '#e4e4e8', noInk: true, edge: 'sharp' });
      b.rod([s * 3.66, 2.44, 0], [s * 3.66, 0.03, -1.8], 0.04, 'white', { edge: 'sharp' });
    });
    b.each(9, (i) => void b.stick([-3.3 + i * 0.825, 0.05, -1.78], [-3.3 + i * 0.825, 2.38, -1.78], 0.02, '#c8ccd2', { noInk: true, parent: 'net' }));
    b.each(4, (i) => void b.stick([-3.6, 0.5 + i * 0.5, -1.78], [3.6, 0.5 + i * 0.5, -1.78], 0.02, '#c8ccd2', { noInk: true, parent: 'net' }));
    b.ball(0.22, [1.2, 0.11, 2.5], { color: 'white', name: 'ball' }).box([7.3, 0.01, 0.12], [0, 0.005, 0.06], { color: 'white', round: 0 });
    return b.act({ click: [A.pose('ball', { move: [0.6, 1.2, -4.0], rot: [720, 0, 0], dur: 0.5 }), A.par(A.pose('net', { move: [0, 0, -0.4], dur: 0.15 }), A.say('GOOOAL!', 2)), A.pose('net', { move: [0, 0, 0], dur: 0.4 }), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })] }).done();
  }),
  // A silver goblet, 18 cm: a stepped round foot, a slim stem with a knop and collar, and a round U-shaped bowl with
  // a rolled lip, ringed by a gold band set with six cabochon gems (ruby, sapphire, emerald); red wine in the bowl.
  // It tips and chimes.
  e('goblet', 'kitchen', 'tableware', () => {
    const b = m('goblet', { edge: 'sharp' })
      .cyl([0.085, 0.01, 0.085], [0, 0.005, 0], { color: 'silver', taper: 0.85, name: 'cup' })
      .dome([0.066, 0.022, 0.066], [0, 0.021, 0], { color: 'silver', parent: 'cup' })
      .cyl([0.016, 0.065, 0.016], [0, 0.058, 0], { color: 'silver', parent: 'cup' })
      .ball([0.03, 0.022, 0.03], [0, 0.06, 0], { color: 'silver', parent: 'cup' })
      .cyl([0.032, 0.012, 0.032], [0, 0.089, 0], { color: 'silver', taper: 1.4, parent: 'cup' })
      .ball([0.085, 0.07, 0.085], [0, 0.125, 0], { color: 'silver', parent: 'cup' })
      .cyl([0.085, 0.05, 0.085], [0, 0.15, 0], { color: 'silver', taper: 1.06, parent: 'cup' })
      .torus([0.092, 0.092, 0.008], [0, 0.175, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.1, parent: 'cup' })
      .cyl([0.082, 0.004, 0.082], [0, 0.172, 0], { color: '#6a101a', noInk: true, parent: 'cup' })
      .torus([0.09, 0.09, 0.01], [0, 0.142, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.12, parent: 'cup' });
    ['#c8101a', '#2a3a9a', '#1e8a4a', '#c8101a', '#2a3a9a', '#1e8a4a'].forEach((c, i) => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      b.ball([0.013, 0.016, 0.008], [Math.sin(a) * 0.046, 0.142, Math.cos(a) * 0.046], { color: c, rot: [0, (a * 180) / Math.PI, 0], parent: 'cup' });
    });
    return b.act({ click: [A.pose('cup', { rot: [0, 0, 8], dur: 0.15 }), A.par(A.say('Clink!', 1), A.effect('sparkle', { dur: 1 })), A.pose('cup', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // Swimming goggles: two tinted eyecups on a nose bridge and a split strap: the strap snaps.
  e('goggles', 'sports', 'protective gear', () => {
    const b = m('goggles');
    b.pair((s) => {
      b.ball([0.06, 0.045, 0.035], [s * 0.035, 0.035, 0], { color: '#1e1e1e' }).ball([0.05, 0.036, 0.012], [s * 0.035, 0.035, 0.014], { color: '#4ab0e0', edge: 'sharp' });
      b.rod([s * 0.062, 0.035, -0.01], [s * 0.075, 0.03, -0.1], 0.01, '#2a5ab0', { name: s > 0 ? 'strapL' : 'strapR', pivot: [s * 0.062, 0.035, -0.01] }).rod([s * 0.075, 0.03, -0.1], [s * 0.07, 0.006, -0.14], 0.01, '#2a5ab0', { parent: s > 0 ? 'strapL' : 'strapR' });
    });
    b.box([0.02, 0.008, 0.008], [0, 0.04, 0.005], { color: '#1e1e1e' });
    return b.act({ click: [A.par(A.pose('strapL', { rot: [0, 30, 0], dur: 0.2 }), A.pose('strapR', { rot: [0, -30, 0], dur: 0.2 })), A.par(A.pose('strapL', { rot: [0, 0, 0], dur: 0.08 }), A.pose('strapR', { rot: [0, 0, 0], dur: 0.08 }), A.say('Snap!', 1))] }).done();
  }),
  // Three stamped gold bullion bars stacked on each other, each a 10 x 4.5 cm bar with sloping sides: they gleam.
  // (A 4-sided pyramid is square to the axes and sized corner to corner, hence the SQRT2.)
  e('gold', 'nature', 'gems', () =>
    m('gold', { edge: 'sharp' })
      .pyramid([0.1 * Math.SQRT2, 0.035, 0.045 * Math.SQRT2], [-0.028, 0.0175, 0], 4, { color: 'gold', taper: 0.8 })
      .pyramid([0.1 * Math.SQRT2, 0.035, 0.045 * Math.SQRT2], [0.028, 0.0175, 0.005], 4, { color: '#e8b830', taper: 0.8 })
      .pyramid([0.1 * Math.SQRT2, 0.035, 0.045 * Math.SQRT2], [0, 0.0525, 0.002], 4, { color: '#f0c840', taper: 0.8, rot: [0, 8, 0], name: 'top' })
      .label('999.9', [0.04, 0.012], [0, 0.07, 0.002], { color: 'gold', rot: [-90, 8, 0], parent: 'top', depth: 0.002 })
      .star(0.025, [0.03, 0.085, 0.02], { color: 'white', glow: true })
      .act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ka-ching!', 1.5), A.pose('top', { move: [0, 0.02, 0], dur: 0.2 })), A.pose('top', { move: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // An old gold mine in a hillside: a timbered adit with a lantern, rails running out on sleepers, a mine cart heaped
  // with gold nuggets that rolls out of the tunnel and back, and a wooden headframe with its wheel on the hill.
  e('gold mine', 'places', 'industry', () => {
    const b = m('gold mine');
    b.ball([14, 9, 9], [0, 1.0, -3], { color: '#8a7058' })
      .ball([8, 6, 6], [-4, 1.0, -1.5], { color: '#7a6450' })
      .box([2.4, 2.8, 1.6], [0, 1.4, 1.0], { color: '#1a1410', edge: 'sharp' });
    b.pair((s) => void b.box([0.35, 3.0, 0.35], [s * 1.3, 1.5, 1.85], { color: '#7a5030', edge: 'sharp' }));
    b.box([3.2, 0.4, 0.45], [0, 3.1, 1.85], { color: '#7a5030', edge: 'sharp' })
      .label('GOLD MINE', [2.4, 0.5], [0, 3.6, 1.9], { color: '#a8743e', depth: 0.04 })
      .box([0.25, 0.35, 0.25], [1.3, 2.6, 2.1], { color: '#2a2726', edge: 'sharp' })
      .box([0.15, 0.22, 0.15], [1.3, 2.6, 2.2], { color: '#ffd27a', glow: true, name: 'lantern', mover: { kind: 'light', on: false } });
    b.pair((s) => void b.stick([s * 0.45, 0.06, 0.5], [s * 0.45, 0.06, 7.0], 0.08, '#5a5f66', { edge: 'sharp' }));
    b.each(10, (i) => void b.box([1.3, 0.06, 0.18], [0, 0.03, 0.8 + i * 0.65], { color: '#5a3a22', edge: 'sharp' }));
    b.box([1.1, 0.7, 1.4], [0, 0.65, 1.4], { color: '#5a5f66', round: 0.15, name: 'cart', edge: 'sharp' });
    b.pair((s) => {
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}F`, [s * 0.45, 0.22, 1.85], 0.36, 0.08, '#3a3d42', { parent: 'cart' });
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}B`, [s * 0.45, 0.22, 0.95], 0.36, 0.08, '#3a3d42', { parent: 'cart' });
    });
    for (const [gx, gy, gz] of [[-0.25, 1.05, 1.2], [0.2, 1.08, 1.5], [0.0, 1.2, 1.35], [0.25, 1.0, 1.1], [-0.2, 1.02, 1.65]] as const) b.ball([0.32, 0.26, 0.3], [gx, gy, gz], { color: 'gold', parent: 'cart' });
    // headframe on the hill
    b.pair((s) => void b.rod([s * 1.2, 5.0, -3.0], [s * 0.2, 9.5, -3.0], 0.25, '#7a5030'));
    b.rod([0, 5.0, -4.5], [0, 9.5, -3.0], 0.25, '#7a5030').torus([1.6, 1.6, 0.2], [0, 9.6, -3.0], { color: '#3a3d42', tube: 0.12 });
    return b
      .act({
        click: [
          [A.operate('lantern', 'on'), A.pose('cart', { move: [0, 0, 4.0], dur: 2 }), A.par(A.say('Clackety-clack! Gold!', 2), A.effect('sparkle', { dur: 1.5 }))],
          [A.pose('cart', { move: [0, 0, 0], dur: 2 }), A.operate('lantern', 'off')],
        ],
      })
      .done();
  }),
  // The goose's golden egg in a straw nest: it wobbles and glitters.
  e('golden egg', 'fantasy', 'magic items', () => {
    const b = m('golden egg').torus([0.16, 0.16, 0.05], [0, 0.02, 0], { color: '#b08848', rot: [90, 0, 0], tube: 0.35 }).cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#9a7040' });
    for (const [px, pz] of around(8, 0.07)) b.rod([px, 0.03, pz], [-pz * 0.5, 0.04, px * 0.5], 0.008, '#c8a060', { noInk: true });
    return b.ball([0.09, 0.12, 0.09], [0, 0.075, 0], { color: 'gold', name: 'egg', pivot: [0, 0.02, 0] }).star(0.03, [0.03, 0.12, 0.04], { color: 'white', glow: true }).act({ click: [A.pose('egg', { rot: [0, 0, 12], dur: 0.15 }), A.pose('egg', { rot: [0, 0, -12], dur: 0.2 }), A.pose('egg', { rot: [0, 0, 0], dur: 0.15 }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ooh, shiny!', 1.5))] }).done();
  }),
  // A golf bag on its kick-out stand: a padded strap, pockets, a towel, and woods and irons with head covers; a
  // club slides out.
  e('golf bag', 'sports', 'golf', () => {
    const b = m('golf bag');
    b.cyl([0.26, 0.85, 0.24], [0, 0.45, 0], { color: '#1e2a5a', rot: [-10, 0, 0] })
      .cyl([0.28, 0.08, 0.26], [0, 0.88, -0.07], { color: 'white', rot: [-10, 0, 0], edge: 'sharp' })
      .box([0.16, 0.42, 0.08], [0, 0.38, 0.13], { color: '#2a3a7a', round: 0.4, rot: [-10, 0, 0] })
      .box([0.12, 0.16, 0.02], [0.13, 0.55, 0.06], { color: 'white', round: 0.3, rot: [0, 60, 0] })
      .rod([-0.13, 0.78, -0.04], [-0.13, 0.3, 0.05], 0.04, 'white')
      .pair((s) => void b.stick([s * 0.08, 0.55, -0.12], [s * 0.15, 0.0, -0.32], 0.015, '#9aa0a8', { edge: 'sharp' }));
    [[-0.06, -0.04, '#d6262b'], [0.05, -0.03, '#1e1e1e'], [0.0, -0.13, '#c8ccd2'], [0.07, -0.11, '#9aa0a8']].forEach(([xx, zz, c], i) => {
      const n = i === 2 ? { name: 'club' } : {};
      b.stick([xx as number, 0.85, (zz as number)], [(xx as number) * 1.2, 1.05 + i * 0.03, (zz as number) * 1.3 - 0.04], 0.015, '#9aa0a8', { ...n, edge: 'sharp' })
        .ball([0.08, 0.06, 0.06], [(xx as number) * 1.2, 1.08 + i * 0.03, (zz as number) * 1.3 - 0.04], { color: c as string, ...(i === 2 ? { parent: 'club' } : {}) });
    });
    return b.act({ click: [A.pose('club', { move: [0, 0.4, 0], dur: 0.4 }), A.say('Shhhing!', 1), A.wait(0.8), A.pose('club', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A dimpled golf ball on a wooden tee: it is struck away (FORE!) and a new one sits there.
  e('golf ball', 'sports', 'golf', () => {
    const b = m('golf ball').cyl([0.012, 0.04, 0.012], [0, 0.02, 0], { color: '#d8b880', taper: 2 }).ball(0.043, [0, 0.0615, 0], { color: 'white', name: 'ball' });
    b.each(10, (i) => void b.ball(0.006, [Math.sin(i * 0.8) * 0.017, 0.0615 + Math.cos(i * 1.3) * 0.012, 0.019], { color: '#d8d8d8', noInk: true, parent: 'ball' }));
    return b.act({ click: [A.pose('ball', { move: [0, 2.5, -12], dur: 0.8 }), A.say('FORE!', 1.5), A.pose('ball', { scale: 0, move: [0, 0, 0], dur: 0.05 }), A.wait(0.6), A.pose('ball', { scale: 1, dur: 0.3 })] }).done();
  }),
  // An electric golf cart at real size (2.4 m long, roof at 1.8 m): a bench seat for two, a canopy on four posts,
  // a windscreen, steering wheel, bags strapped on the back; it beeps and its lights come on.
  e('golf cart', 'garage', 'cars', () => {
    const b = m('golf cart', { view: 'side' });
    b.loft([1.2, 0.55, 2.4], [0, 0.55, 0], [[0, 0.9, 0.8, 0.05], [0.15, 1, 1, 0], [0.75, 1, 0.9, -0.05], [0.95, 0.92, 0.75, -0.1], [1, 0.8, 0.6, -0.12]], { color: 'white', boxy: 0.75 })
      .box([1.1, 0.12, 0.6], [0, 0.88, -0.25], { color: '#d8c090', round: 0.5 })
      .box([1.1, 0.45, 0.12], [0, 1.1, -0.53], { color: '#d8c090', round: 0.5 })
      .box([1.24, 0.08, 2.0], [0, 1.85, -0.15], { color: '#2a5a3a', round: 0.3, edge: 'sharp' })
      .box([1.1, 0.55, 0.04], [0, 1.4, 0.82], { color: '#bfe0ee', rot: [-8, 0, 0], edge: 'sharp' })
      .rod([0, 0.85, 0.55], [0, 1.08, 0.38], 0.04, '#1e1e1e')
      .torus([0.32, 0.32, 0.04], [0, 1.1, 0.36], { color: '#1e1e1e', rot: [55, 0, 0] })
      .box([0.9, 0.3, 0.5], [0, 0.9, -1.0], { color: '#3a3d42', round: 0.2, edge: 'sharp' })
      .cyl([0.26, 0.85, 0.26], [0.25, 1.15, -1.0], { color: '#1e2a5a', rot: [-15, 0, 0] })
      .cyl([0.26, 0.85, 0.26], [-0.25, 1.15, -1.0], { color: '#8a141b', rot: [-15, 0, 0] })
      .socket('seat', [0.25, 0.95, -0.25], 'seat');
    b.pair((s) => {
      b.stick([s * 0.55, 0.75, 0.78], [s * 0.55, 1.85, 0.75], 0.05, '#9aa0a8', { edge: 'sharp' }).stick([s * 0.55, 0.75, -0.95], [s * 0.55, 1.85, -1.0], 0.05, '#9aa0a8', { edge: 'sharp' });
      b.box([0.22, 0.1, 0.05], [s * 0.4, 0.68, 1.19], { color: '#fff6c8', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light', on: false }, edge: 'sharp' });
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}F`, [s * 0.55, 0.23, 0.75], 0.46, 0.18, 'silver');
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}B`, [s * 0.55, 0.23, -0.75], 0.46, 0.18, 'silver');
    });
    return b.act({ click: [[A.par(A.operate('light', 'on'), A.say('Beep beep!', 1.5), A.anim('shake'))], [A.operate('light', 'off'), A.say('Whirrr...', 1)]] }).done();
  }),
  // A driver resting on its head beside a teed-up ball: it swings through and the ball flies.
  e('golf club', 'sports', 'golf', () =>
    m('golf club', { edge: 'sharp' })
      .stick([-0.28, 1.08, 0], [0.02, 0.07, 0], 0.016, 'silver', { name: 'club', pivot: [-0.28, 1.08, 0] })
      .capsule([0.032, 0.26, 0.032], [-0.245, 0.96, 0], { color: '#1e1e1e', rot: [0, 0, 16], parent: 'club', edge: 'soft' })
      .ball([0.12, 0.07, 0.1], [0.06, 0.04, 0], { color: '#2a2c30', parent: 'club', edge: 'soft' })
      .box([0.09, 0.05, 0.004], [0.07, 0.04, 0.05], { color: 'silver', noInk: true, parent: 'club' })
      .cyl([0.01, 0.03, 0.01], [0.22, 0.015, 0.05], { color: '#d8b880', taper: 2 })
      .ball(0.043, [0.22, 0.05, 0.05], { color: 'white', name: 'ball', edge: 'soft' })
      .act({ click: [A.pose('club', { rot: [0, 0, -70], dur: 0.5 }), A.pose('club', { rot: [0, 0, 40], dur: 0.15 }), A.par(A.pose('ball', { move: [8, 3, -6], dur: 0.8 }), A.say('Thwack! Fore!', 1.5)), A.pose('club', { rot: [0, 0, 0], dur: 0.5 }), A.pose('ball', { move: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // One golf hole in miniature (12 m): a striped fairway, a raised putting green with the pin and flag, a sand
  // bunker, a pond and two trees; a ball rolls up and drops in the cup.
  e('golf course', 'sports', 'golf', () => {
    const b = m('golf course');
    b.ball([16, 0.5, 9], [0, 0, 0], { color: '#5aa03a' })
      .each(4, (i) => void b.box([2.5, 0.02, 7], [-5.5 + i * 3.5, 0.24, 0], { color: i % 2 ? '#6ab84a' : '#62ac44', round: 0, noInk: true }))
      .ball([4.2, 0.5, 3.4], [4.2, 0.15, 0.4], { color: '#7ad05a' })
      .ball([2.2, 0.3, 1.4], [1.0, 0.13, 2.6], { color: '#e8d8a0' })
      .ball([3.0, 0.2, 2.0], [-3.0, 0.12, -2.6], { color: '#3f8ac8' })
      .cyl([0.12, 0.05, 0.12], [4.6, 0.39, 0.6], { color: '#1e1e1e' })
      .stick([4.6, 0.35, 0.6], [4.6, 2.5, 0.6], 0.04, 'white', { edge: 'sharp' })
      .box([0.7, 0.45, 0.02], [4.96, 2.25, 0.6], { color: '#d6262b', name: 'flag', pivot: [4.6, 2.25, 0.6], edge: 'sharp' })
      .ball(0.15, [1.5, 0.35, 0.8], { color: 'white', name: 'ball' })
      .box([0.9, 0.04, 0.9], [-6.0, 0.26, 0.5], { color: '#4a903a', round: 0 })
      .pair((s) => void b.ball(0.12, [-6.0 + s * 0.35, 0.33, 0.5], { color: s > 0 ? '#2a5ab0' : '#d6262b' }));
    for (const [tx, tz, h] of [[-5, -3.2, 7], [-1.5, -3.6, 8], [6.5, -3.2, 6.5]] as const) b.cyl([0.35, h * 0.5, 0.35], [tx, h * 0.25, tz], { color: 'bark', taper: 0.7 }).ball([h * 0.42, h * 0.5, h * 0.42], [tx, h * 0.7, tz], { color: '#2f6a2f' });
    return b.act({ click: [A.pose('ball', { move: [3.1, 0.05, -0.2], dur: 1.5 }), A.pose('ball', { move: [3.1, -0.2, -0.2], scale: 0.5, dur: 0.2 }), A.par(A.say('Hole in one!', 2, ''), A.pose('flag', { rot: [0, 30, 0], dur: 0.4 }), A.effect('sparkle', { dur: 1.5 })), A.pose('flag', { rot: [0, 0, 0], dur: 0.4 }), A.pose('ball', { move: [0, 0, 0], scale: 1, dur: 0 })] }).done();
  }),
  // A white leather golf glove with a navy tab and perforated fingers: it grips.
  e('golf glove', 'sports', 'golf', () => {
    const b = m('golf glove')
      .box([0.09, 0.03, 0.04], [0, 0.015, 0], { color: 'white', round: 0.4 })
      .box([0.09, 0.1, 0.036], [0, 0.08, 0], { color: 'white', round: 0.45 })
      .box([0.06, 0.04, 0.01], [0, 0.06, 0.02], { color: '#1e2a5a', round: 0.4 })
      .capsule([0.026, 0.06, 0.026], [-0.058, 0.09, 0.004], { color: 'white', rot: [0, 0, 40] })
      .box([0.08, 0.02, 0.03], [0, 0.13, 0], { color: 'white', round: 0.5, name: 'fingers', pivot: [0, 0.13, 0] });
    b.each(4, (i) => void b.capsule([0.022, 0.07 + (i === 1 || i === 2 ? 0.012 : 0), 0.024], [-0.032 + i * 0.021, 0.17 + (i === 1 || i === 2 ? 0.006 : 0), 0], { color: 'white', parent: 'fingers' }));
    b.each(6, (i) => void b.ball(0.005, [-0.025 + (i % 3) * 0.025, 0.1 + Math.floor(i / 3) * 0.015, 0.019], { color: '#c8ccd2', noInk: true }));
    return b.act({ click: [A.pose('fingers', { rot: [70, 0, 0], dur: 0.3 }), A.say('Grip!', 1), A.wait(0.5), A.pose('fingers', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A temple gong (0.9 m) hung in a lacquered frame with a padded mallet: the mallet strikes and it shivers.
  e('gong', 'music', 'percussion', () => {
    const b = m('gong');
    b.cyl([0.9, 0.035, 0.9], [0, 0.82, 0], { color: '#b8862a', rot: [90, 0, 0], name: 'disc', pivot: [0, 1.3, 0], edge: 'sharp' })
      .cyl([0.22, 0.06, 0.22], [0, 0.82, 0.015], { color: '#d8a040', rot: [90, 0, 0], parent: 'disc' })
      .torus([0.92, 0.92, 0.05], [0, 0.82, 0], { color: '#8a5a20', tube: 0.04, parent: 'disc' })
      .stick([-0.65, 1.4, 0], [0.65, 1.4, 0], 0.08, '#8a141b', { edge: 'sharp' })
      .stick([-0.75, 1.48, 0], [0.75, 1.48, 0], 0.06, '#1e1e1e', { edge: 'sharp' });
    b.pair((s) => {
      b.stick([s * 0.6, 0.06, 0], [s * 0.6, 1.42, 0], 0.08, '#8a141b', { edge: 'sharp' }).box([0.18, 0.1, 0.45], [s * 0.6, 0.05, 0], { color: '#1e1e1e', edge: 'sharp' });
      b.rod([s * 0.2, 1.24, 0], [s * 0.28, 1.38, 0], 0.012, '#d8b880');
    });
    return b
      .stick([0.55, 0.6, 0.35], [0.2, 0.75, 0.15], 0.025, '#a8743e', { name: 'mallet', pivot: [0.55, 0.6, 0.35] })
      .ball(0.1, [0.18, 0.77, 0.13], { color: '#f2e6c8', parent: 'mallet' })
      .act({ click: [A.pose('mallet', { rot: [0, -30, 0], dur: 0.3 }), A.pose('mallet', { rot: [0, 15, 0], dur: 0.1 }), A.par(A.say('GONNNNNG!', 2.5), A.pose('disc', { rot: [8, 0, 0], dur: 0.1 }), A.pose('mallet', { rot: [0, 0, 0], dur: 0.4 })), A.pose('disc', { rot: [-6, 0, 0], dur: 0.2 }), A.pose('disc', { rot: [4, 0, 0], dur: 0.2 }), A.pose('disc', { rot: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A gorge in miniature (13 m): two banded sandstone cliffs with a river far below and a rope bridge slung
  // between them that sways; shouts echo.
  e('gorge', 'nature', 'landforms', () => {
    const b = m('gorge');
    b.box([18, 0.3, 8], [0, 0.15, 0], { color: '#a8603a', edge: 'sharp' }).box([2.4, 0.12, 8], [0, 0.34, 0], { color: '#3f8ac8', edge: 'sharp' });
    b.pair((s) => {
      b.box([7, 12, 8], [s * 4.8, 6, 0], { color: '#c06a3a', round: 0.05, rot: [0, 0, s * 3] });
      for (let i = 0; i < 5; i++) b.box([7.05, 0.4, 8.05], [s * (4.8 - i * 0.12), 1.5 + i * 2.2, 0], { color: i % 2 ? '#e08a50' : '#a85a30', noInk: true, rot: [0, 0, s * 3] });
      b.ball([2.2, 1.6, 2.0], [s * 6.0, 12.4, -1.5], { color: '#3f6a2f' }).ball([1.6, 1.2, 1.6], [s * 4.0, 12.3, 2.0], { color: '#4f7a3a' });
      b.box([0.8, 1.2, 0.8], [s * 1.7, 12.4, 0], { color: '#5a3a22', edge: 'sharp' });
    });
    b.box([3.0, 0.08, 0.9], [0, 11.6, 0], { color: '#a8743e', name: 'bridge', pivot: [0, 12.6, 0], edge: 'sharp' });
    b.pair((s) => void b.rod([-1.6, 12.4, s * 0.45], [1.6, 12.4, s * 0.45], 0.04, '#c8a060', { parent: 'bridge' }));
    b.each(6, (i) => void b.box([0.1, 0.1, 0.9], [-1.25 + i * 0.5, 11.66, 0], { color: '#7a5030', parent: 'bridge', edge: 'sharp' }));
    return b.act({ click: [A.par(A.pose('bridge', { rot: [6, 0, 0], dur: 0.5 }), A.say('Hello-o-o...', 1.5, '')), A.pose('bridge', { rot: [-5, 0, 0], dur: 0.6 }), A.say('...hello... hello...', 2, ''), A.par(A.pose('bridge', { rot: [0, 0, 0], dur: 0.5 }), A.effect('water_spray', { dur: 1 }))] }).done();
  }),
  // A dashboard satnav on its suction mount: a map with the route and a pin; it speaks its directions.
  e('gps', 'tech', 'gadgets', () =>
    m('gps', { edge: 'sharp' })
      .cyl([0.06, 0.012, 0.06], [0, 0.006, 0], { color: '#1e1e1e' })
      .rod([0, 0.01, 0], [0, 0.035, -0.01], 0.012, '#1e1e1e')
      .box([0.13, 0.085, 0.02], [0, 0.075, 0], { color: '#2a2a2e', rot: [-10, 0, 0], round: 0.3 })
      .box([0.11, 0.065, 0.004], [0, 0.076, 0.011], { color: '#8ad08a', rot: [-10, 0, 0], glow: true, name: 'screen', mover: { kind: 'light', on: true } })
      .rod([-0.04, 0.06, 0.016], [0.0, 0.08, 0.012], 0.006, '#2a5ab0', { noInk: true })
      .rod([0.0, 0.08, 0.012], [0.035, 0.09, 0.01], 0.006, '#2a5ab0', { noInk: true })
      .cone([0.012, 0.018, 0.006], [0.035, 0.102, 0.012], { color: '#d6262b', rot: [180, 0, 0], name: 'pin' })
      .act({ click: [[A.par(A.say('In 200 metres, turn left.', 2.5), A.pose('pin', { move: [0, 0.006, 0], dur: 0.3 })), A.pose('pin', { move: [0, 0, 0], dur: 0.3 })], [A.say('You have arrived!', 2), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // A brick wall sprayed with a bubbly tag, a star and drips, a spray can on the pavement: it sprays a fresh heart.
  e('graffiti', 'places', 'street art', () => {
    const b = m('graffiti', { edge: 'sharp' }).box([4, 2.6, 0.3], [0, 1.3, -0.15], { color: '#b8705a', round: 0.02 });
    for (let r = 0; r < 8; r++) b.box([4, 0.02, 0.01], [0, 0.3 + r * 0.3, 0.005], { color: '#9a5a48', noInk: true });
    const C = ['#e0409a', '#7add3a', '#3fc0d0', '#f2d21e', '#f0821e', '#8a5fc4'];
    C.forEach((c, i) => void b.ball([0.65, 0.8, 0.04], [-1.5 + i * 0.6, 1.3 + (i % 2) * 0.15, 0.02], { color: c, noInk: true, rot: [0, 0, (i - 2.5) * 10], edge: 'soft' }));
    b.rod([-1.7, 0.6, 0.05], [1.7, 0.72, 0.05], 0.12, '#1e1e1e', { noInk: true })
      .star(0.5, [1.6, 2.1, 0.04], { color: '#f2d21e', noInk: true })
      .each(4, (i) => void b.box([0.04, 0.3, 0.01], [-1.4 + i * 0.8, 0.85, 0.04], { color: C[i], noInk: true }))
      .heart(0.5, [-1.5, 2.15, 0.05], { color: '#d6262b', name: 'heart', scale: 0 })
      .cyl([0.07, 0.2, 0.07], [0.9, 0.1, 0.5], { color: '#d6262b', name: 'can' })
      .cyl([0.03, 0.03, 0.03], [0.9, 0.215, 0.5], { color: 'white', parent: 'can' });
    return b.act({ click: [[A.pose('can', { move: [0, 0.05, 0], rot: [0, 0, 15], dur: 0.15 }), A.par(A.pose('heart', { scale: 1, dur: 1 }), A.say('Psssssht!', 1.5), A.effect('smoke', { dur: 1 })), A.pose('can', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.2 })], [A.pose('heart', { scale: 0, dur: 0.5 })]] }).done();
  }),
  // The Holy Grail: a golden chalice set with a ruby, with a shaft of heavenly light that blazes up above it.
  e('grail', 'fantasy', 'magic items', () =>
    m('grail')
      .cyl([0.1, 0.015, 0.1], [0, 0.0075, 0], { color: 'gold', edge: 'sharp' })
      .cyl([0.03, 0.07, 0.03], [0, 0.05, 0], { color: 'gold', taper: 0.6 })
      .ball([0.04, 0.025, 0.04], [0, 0.085, 0], { color: 'gold' })
      .ball([0.09, 0.08, 0.09], [0, 0.13, 0], { color: 'gold' })
      .cyl([0.09, 0.025, 0.09], [0, 0.16, 0], { color: 'gold', edge: 'sharp' })
      .ball(0.02, [0, 0.13, 0.044], { color: '#c8101a' })
      .ball([0.12, 0.08, 0.12], [0, 0.2, 0], { color: '#fff8c0', glow: true, name: 'light', mover: { kind: 'light', on: false }, scale: 0.6 })
      .star(0.05, [0, 0.28, 0], { color: '#fff2a0', glow: true })
      .act({ click: [[A.par(A.operate('light', 'on'), A.pose('light', { scale: 1.6, dur: 0.6 }), A.effect('sparkle', { dur: 2 }), A.say('Ahhhhhh!', 2))], [A.par(A.operate('light', 'off'), A.pose('light', { scale: 0.6, dur: 0.6 }))]] })
      .done(),
  ),
  // A longcase clock (2.1 m): a plinth, a trunk with a glazed door onto the brass pendulum and weights, a hood with
  // a painted dial and an arched pediment; the hands sweep round and it chimes the hour.
  e('grandfather clock', 'home', 'furniture', () =>
    m('grandfather clock', { edge: 'sharp' })
      .box([0.52, 0.32, 0.32], [0, 0.16, 0], { color: '#5a3a22', round: 0.05 })
      .box([0.56, 0.04, 0.36], [0, 0.34, 0], { color: '#4a2f1c', round: 0.2 })
      .box([0.42, 1.1, 0.27], [0, 0.9, 0], { color: '#5a3a22', round: 0.03 })
      .box([0.3, 0.86, 0.02], [0, 0.88, 0.135], { color: '#2a1a12' })
      .box([0.31, 0.88, 0.03], [0, 0.88, 0.15], { color: '#9cc3d6', name: 'case', pivot: [-0.155, 0.88, 0.15], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .stick([0, 1.28, 0.11], [0, 0.72, 0.11], 0.012, 'brass', { name: 'pendulum', pivot: [0, 1.28, 0.11] })
      .cyl([0.14, 0.02, 0.14], [0, 0.66, 0.11], { color: 'gold', rot: [90, 0, 0], parent: 'pendulum' })
      .cyl([0.05, 0.2, 0.05], [-0.08, 1.05, 0.07], { color: 'brass' })
      .cyl([0.05, 0.2, 0.05], [0.08, 1.0, 0.07], { color: 'brass' })
      .box([0.52, 0.5, 0.32], [0, 1.7, 0], { color: '#5a3a22', round: 0.05 })
      .box([0.58, 0.05, 0.36], [0, 1.47, 0], { color: '#4a2f1c', round: 0.2 })
      .arc([0.5, 0.3, 0.3], [0, 1.95, 0], { color: '#4a2f1c', arc: 180, tube: 0.25 })
      .ball(0.05, [0, 2.12, 0], { color: 'gold' })
      .cyl([0.36, 0.02, 0.36], [0, 1.7, 0.16], { color: '#f6efe0', rot: [90, 0, 0] })
      .torus([0.38, 0.38, 0.02], [0, 1.7, 0.165], { color: 'brass', tube: 0.06 })
      .stick([0, 1.7, 0.175], [0, 1.82, 0.175], 0.014, '#1e1e1e', { name: 'minute', pivot: [0, 1.7, 0.175] })
      .stick([0, 1.7, 0.18], [0.08, 1.68, 0.18], 0.016, '#1e1e1e', { name: 'hour', pivot: [0, 1.7, 0.18] })
      .act({
        click: [
          [A.par(A.pose('minute', { rot: [0, 0, -360], dur: 1.5 }), A.pose('hour', { rot: [0, 0, -30], dur: 1.5 })), A.pose('minute', { rot: [0, 0, 0], dur: 0 }), A.par(A.say('Bong... bong... bong!', 3), A.pose('pendulum', { rot: [0, 0, 12], dur: 0.5 })), A.pose('pendulum', { rot: [0, 0, -12], dur: 1 }), A.pose('pendulum', { rot: [0, 0, 12], dur: 1 }), A.pose('pendulum', { rot: [0, 0, 0], dur: 0.5 })],
          [A.operate('case', 'open'), A.say('Tick tock, tick tock', 2), A.wait(1.5), A.operate('case', 'close')],
        ],
      })
      .done(),
  ),
  // A speckled granite boulder with one face sawn and polished: a stonemason's chisel taps it.
  e('granite', 'nature', 'rocks', () => {
    const b = m('granite').ball([0.6, 0.45, 0.5], [0, 0.2, -0.05], { color: '#b8a8a0' }).ball([0.3, 0.25, 0.3], [0.22, 0.12, 0.08], { color: '#c8b0a8' });
    b.box([0.5, 0.36, 0.02], [-0.02, 0.2, 0.18], { color: '#c8b8b0', edge: 'sharp', rot: [0, -8, 0] });
    const P: V[] = [[0.1, 0.33, 0.12], [-0.15, 0.3, 0.12], [0.02, 0.22, 0.19], [-0.22, 0.15, 0.17], [0.18, 0.36, 0.0], [-0.05, 0.4, 0.05], [0.3, 0.18, 0.16], [0.12, 0.1, 0.19], [-0.1, 0.12, 0.19], [0.05, 0.28, 0.19]];
    P.forEach((p, i) => void b.ball(0.035, p, { color: i % 3 ? '#2a2a2a' : '#f0dcd8', noInk: true }));
    b.stick([0.42, 0.3, 0.3], [0.3, 0.24, 0.2], 0.02, '#9aa0a8', { name: 'chisel', pivot: [0.42, 0.3, 0.3], edge: 'sharp' });
    return b.act({ click: [A.pose('chisel', { move: [-0.03, -0.01, -0.03], dur: 0.08 }), A.par(A.effect('dust', { dur: 0.6 }), A.say('Tink!', 0.8)), A.pose('chisel', { move: [0, 0, 0], dur: 0.15 }), A.pose('chisel', { move: [-0.03, -0.01, -0.03], dur: 0.08 }), A.par(A.effect('dust', { dur: 0.6 }), A.say('Tink!', 0.8)), A.pose('chisel', { move: [0, 0, 0], dur: 0.15 })] }).done();
  }),
  // One purple grape with a bit of stem and a leaf: it gets squished and plumps back up.
  e('grape', 'food', 'fruit', () =>
    m('grape')
      .ball([0.024, 0.026, 0.024], [0, 0.013, 0], { color: '#6a2a7a', name: 'grape', pivot: [0, 0, 0] })
      .rod([0, 0.025, 0], [0.003, 0.035, 0], 0.003, '#3f6a2f', { parent: 'grape' })
      .ball([0.014, 0.003, 0.01], [0.01, 0.035, 0], { color: '#4f8a3a', rot: [0, 0, -20], parent: 'grape' })
      .ball(0.005, [-0.005, 0.019, 0.01], { color: 'white', noInk: true, parent: 'grape' })
      .act({ click: [A.pose('grape', { scale: 0.75, dur: 0.15 }), A.say('Squish!', 1), A.pose('grape', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // A tall bottle of purple grape juice with a label of grapes: the cap twists off and it glugs.
  e('grape juice', 'food', 'drinks', () => {
    const b = bottle(m('grape juice', { edge: 'sharp' }), 0, 0, 0.3, 0.09, '#5a1a6a', '#8a3fa0', 'white', 'cap');
    return b
      .label('GRAPE', [0.06, 0.04], [0, 0.093, 0.047], { color: 'white', depth: 0.002 })
      .ball(0.022, [-0.015, 0.072, 0.047], { color: '#6a2a7a', noInk: true })
      .ball(0.022, [0.015, 0.072, 0.047], { color: '#6a2a7a', noInk: true })
      .act({ click: [[A.pose('cap', { move: [0.04, 0.04, 0], rot: [0, 360, 0], dur: 0.5 }), A.say('Glug glug!', 1.5)], [A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A purple can of grape soda printed with a bunch of grapes: the ring pull pops and it fizzes.
  e('grape soda', 'food', 'drinks', () => {
    const b = m('grape soda', { edge: 'sharp' })
      .cyl([0.066, 0.16, 0.066], [0, 0.08, 0], { color: '#7a2a9a', segs: 24 })
      .cyl([0.058, 0.012, 0.058], [0, 0.166, 0], { color: 'silver', taper: 0.9 })
      .box([0.012, 0.003, 0.02], [0, 0.173, 0.01], { color: 'silver', name: 'tab', pivot: [0, 0.173, 0.0], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .label('GRAPE', [0.05, 0.02], [0, 0.125, 0.034], { color: '#f2d21e', depth: 0.002 });
    [[0, 0.08], [-0.01, 0.065], [0.01, 0.065], [0, 0.05], [-0.02, 0.08], [0.02, 0.08]].forEach(([px, py]) => void b.ball(0.014, [px, py, 0.032], { color: '#c060e0', noInk: true }));
    return b.ball([0.02, 0.012, 0.006], [0.012, 0.094, 0.033], { color: '#7add3a', noInk: true }).act({ click: [[A.operate('tab', 'open'), A.par(A.say('Pssht! Fizz!', 1.5), A.effect('sparkle', { dur: 1 }))], [A.operate('tab', 'close')]] }).done();
  }),
  // A grapefruit tree (5 m), glossy dark leaves hung with big yellow fruit: one falls and is back on the bough.
  e('grapefruit tree', 'garden', 'trees', () =>
    tree('grapefruit tree', { h: 5, trunk: 'bark', crown: '#2f7a3a', crown2: '#3f8a3a', w: 4.0, fruit: '#f8c850', nf: 12, fs: 0.2 })
      .act({ click: [[A.par(A.pose('top', { rot: [0, 0, 4], dur: 0.4 }), A.say('Rustle...', 1.2)), A.detach('fruit4', 'grapefruit'), A.pose('top', { rot: [0, 0, 0], dur: 0.4 })], [A.reattach('fruit4')]] })
      .done(),
  ),
  // A bunch of black grapes on its stalk with a vine leaf: one grape drops off and is put back.
  e('grapes', 'food', 'fruit', () => {
    const b = m('grapes');
    const rows = [4, 4, 3, 3, 2, 1];
    let y = 0.16;
    rows.forEach((n, r) => {
      for (let i = 0; i < n; i++) b.ball(0.028, [(i - (n - 1) / 2) * 0.025, y, (r % 2) * 0.008], { color: (i + r) % 3 ? '#5a1a6a' : '#6a2a7a', ...(r === 2 && i === 0 ? { name: 'berry', piece: true, parent: 'stalk' } : {}) });
      y -= 0.024;
      if (r === 0) b.rod([0, 0.17, 0], [0.01, 0.2, 0], 0.006, '#5a3a22', { name: 'stalk' });
    });
    return b.ball([0.08, 0.005, 0.06], [0.045, 0.19, 0], { color: '#4f8a3a', rot: [0, 0, -25] }).act({ click: [[A.detach('berry', 'grape'), A.say('Plip!', 1)], [A.reattach('berry')]] }).done();
  }),
  // A vineyard row on its trellis: posts and training wires, a gnarled trunk with two arms trained along the wire,
  // leaves, and bunches of grapes hanging; one bunch is picked and comes back.
  e('grapevine', 'garden', 'vines', () => {
    const b = m('grapevine');
    b.pair((s) => void b.stick([s * 1.6, 0, 0], [s * 1.6, 2.0, 0], 0.1, '#7a5030', { edge: 'sharp' }));
    for (const y of [0.9, 1.4, 1.9]) b.stick([-1.6, y, 0], [1.6, y, 0], 0.015, '#9aa0a8', { edge: 'sharp' });
    b.box([3.6, 0.04, 0.6], [0, 0.02, 0], { color: '#7a5a3a', round: 0 })
      .rod([0, 0, 0], [0.05, 0.9, 0.0], 0.1, 'bark', { name: 'vine' })
      .rod([0.05, 0.9, 0.0], [-1.4, 0.92, 0.0], 0.05, 'bark', { parent: 'vine' })
      .rod([0.05, 0.9, 0.0], [1.4, 0.9, 0.0], 0.05, 'bark', { parent: 'vine' });
    b.each(10, (i) => void b.ball([0.45, 0.4, 0.3], [-1.35 + i * 0.3, 1.35 + (i % 2) * 0.25, (i % 3 - 1) * 0.08], { color: i % 2 ? '#4f8a3a' : '#3f7a2f' }));
    [-1.0, -0.2, 0.6, 1.2].forEach((xx, i) => {
      const n = `bunch${i}`;
      b.cone([0.18, 0.26, 0.14], [xx, 0.72, 0.12], { color: '#5a1a6a', rot: [180, 0, 0], name: n, parent: 'vine', piece: true });
      for (let k = 0; k < 4; k++) b.ball(0.06, [xx + ((k % 2) - 0.5) * 0.08, 0.8 - Math.floor(k / 2) * 0.08, 0.16], { color: '#6a2a7a', parent: n, noInk: true });
    });
    return b.act({ click: [[A.detach('bunch1', 'bunch'), A.say('Ripe!', 1.2)], [A.reattach('bunch1')]] }).done();
  }),
  // A pad of graph paper on a clipboard stand: a pencil draws a rising red line across the grid.
  e('graph paper', 'study', 'paper goods', () => {
    const b = m('graph paper', { edge: 'sharp' })
      .box([0.26, 0.03, 0.08], [0, 0.015, 0.04], { color: '#5a3a22' })
      .box([0.24, 0.32, 0.012], [0, 0.17, -0.02], { color: '#a87a4a', rot: [-10, 0, 0], round: 0.1, name: 'board' })
      .box([0.21, 0.27, 0.004], [0, 0.155, -0.012], { color: 'white', rot: [-10, 0, 0], parent: 'board' })
      .box([0.08, 0.03, 0.03], [0, 0.31, -0.01], { color: 'silver', rot: [-10, 0, 0], parent: 'board' });
    for (let i = 0; i < 8; i++) {
      b.box([0.002, 0.26, 0.002], [-0.09 + i * 0.026, 0.155, -0.009], { color: '#8ac8f0', rot: [-10, 0, 0], noInk: true, parent: 'board' });
      b.box([0.2, 0.002, 0.002], [0, 0.04 + i * 0.033, -0.009 - (0.04 + i * 0.033 - 0.155) * 0.176], { color: '#8ac8f0', rot: [-10, 0, 0], noInk: true, parent: 'board' });
    }
    b.rod([-0.08, 0.07, -0.004], [0, 0.15, -0.018], 0.006, '#d6262b', { noInk: true, name: 'line', scale: 0 })
      .rod([0, 0.15, -0.018], [0.08, 0.22, -0.03], 0.006, '#d6262b', { noInk: true, name: 'line2', scale: 0 })
      .stick([0.08, 0.22, 0.0], [0.13, 0.32, 0.06], 0.01, '#f2c14e', { name: 'pencil', pivot: [0.08, 0.22, 0.0] });
    return b.act({ click: [[A.pose('pencil', { move: [-0.16, -0.15, 0], dur: 0 }), A.par(A.pose('line', { scale: 1, dur: 0.6 }), A.pose('pencil', { move: [-0.08, -0.07, 0], dur: 0.6 })), A.par(A.pose('line2', { scale: 1, dur: 0.6 }), A.pose('pencil', { move: [0, 0, 0], dur: 0.6 })), A.say('Scribble!', 1)], [A.par(A.pose('line', { scale: 0, dur: 0.3 }), A.pose('line2', { scale: 0, dur: 0.3 }))]] }).done();
  }),
  // A tuft of meadow grass on its plug of soil: it sways in a breeze.
  e('grass', 'garden', 'plants', () => {
    const b = m('grass').ball([0.24, 0.08, 0.24], [0, 0.02, 0], { color: 'dirt' }).ball([0.02, 0.02, 0.02], [0, 0.05, 0], { color: '#4f8a3a', name: 'top', pivot: [0, 0.04, 0] });
    b.each(15, (i) => {
      const a = (i / 15) * Math.PI * 2, r = 0.02 + (i % 3) * 0.025, t = 14 + (i % 4) * 8;
      b.cone([0.035, 0.3 + (i % 3) * 0.08, 0.01], [Math.cos(a) * r, 0.19 + (i % 3) * 0.04, Math.sin(a) * r], { color: i % 3 ? '#5aa02a' : '#3f8a2f', rot: [Math.sin(a) * t, 0, -Math.cos(a) * t], parent: 'top' });
    });
    return b.act({ click: [A.pose('top', { rot: [0, 0, 15], dur: 0.4 }), A.pose('top', { rot: [0, 0, -12], dur: 0.5 }), A.pose('top', { rot: [0, 0, 0], dur: 0.4 }), A.say('Swish...', 1)] }).done();
  }),
  // A patch of prairie: waist-high golden grass in clumps with a few wildflowers and a lone thorn tree; the wind
  // sweeps across it.
  e('grassland', 'nature', 'landforms', () => {
    const b = m('grassland').cyl([5, 0.1, 4], [0, 0.05, 0], { color: '#a8b860', edge: 'sharp' }).ball([0.02, 0.02, 0.02], [0, 0.1, 0], { color: '#c8c060', name: 'top' });
    for (let i = 0; i < 16; i++) {
      const xx = -2.0 + (i % 6) * 0.8 + (i % 2) * 0.2, zz = -1.4 + Math.floor(i / 6) * 1.1, h = 0.6 + (i % 3) * 0.2;
      b.cone([0.45, h, 0.4], [xx, 0.1 + h / 2, zz], { color: i % 2 ? '#d8c870' : '#b8b050', parent: 'top' });
    }
    for (const [fx, fz, c] of [[-1.2, 1.2, '#f2d21e'], [0.6, 1.4, '#8a5fc4'], [1.6, 0.5, '#f2d21e']] as const) b.ball(0.12, [fx, 0.75, fz], { color: c, parent: 'top' });
    b.stick([1.6, 0.1, -1.1], [1.6, 1.4, -1.1], 0.14, 'bark').rod([1.6, 1.3, -1.1], [1.1, 1.8, -1.1], 0.07, 'bark').rod([1.6, 1.3, -1.1], [2.1, 1.75, -1.1], 0.07, 'bark').ball([2.0, 0.35, 1.4], [1.6, 1.95, -1.1], { color: '#5a8a3a' });
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 6], dur: 0.6 }), A.say('Whooosh...', 2), A.effect('dust', { dur: 1.2 })), A.pose('top', { rot: [0, 0, -4], dur: 0.6 }), A.pose('top', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A cast-iron storm-drain grate set in the kerb: rain gurgles down it.
  e('grate', 'places', 'street furniture', () => {
    const b = m('grate', { edge: 'sharp' }).box([0.9, 0.12, 0.6], [0, 0.06, 0], { color: '#9a9590' }).box([0.6, 0.03, 0.38], [0, 0.11, 0], { color: '#1a1a1a' });
    b.box([0.9, 0.15, 0.2], [0, 0.075, -0.4], { color: '#bdb5a5', round: 0.1 });
    b.each(9, (i) => void b.box([0.025, 0.035, 0.38], [-0.26 + i * 0.065, 0.125, 0], { color: '#3a3d42', round: 0.2 }));
    return b.box([0.6, 0.035, 0.03], [0, 0.126, 0], { color: '#3a3d42' }).box([0.62, 0.04, 0.04], [0, 0.125, 0.2], { color: '#3a3d42' }).box([0.62, 0.04, 0.04], [0, 0.125, -0.2], { color: '#3a3d42' }).act({ click: [A.par(A.effect('rain', { dur: 2 }), A.say('Gurgle gurgle...', 2))] }).done();
  }),
  // A four-sided box grater with a black handle and a wedge of cheese that is grated down into a heap.
  e('grater', 'kitchen', 'utensils', () => {
    const b = m('grater', { edge: 'sharp' })
      .box([0.11, 0.22, 0.09], [0, 0.11, 0], { color: 'silver', round: 0.08 })
      .arc([0.08, 0.05, 0.02], [0, 0.235, 0], { color: '#1e1e1e', tube: 0.25 })
      .box([0.08, 0.02, 0.06], [0, 0.225, 0], { color: '#1e1e1e' });
    b.each(12, (i) => void b.box([0.014, 0.006, 0.004], [-0.03 + (i % 4) * 0.02, 0.05 + Math.floor(i / 4) * 0.055, 0.046], { color: '#4a4a52', noInk: true }));
    b.wedge([0.08, 0.06, 0.05], [0.0, 0.16, 0.08], { color: '#f2c14e', rot: [-90, 0, 0], name: 'cheese', edge: 'soft' })
      .ball([0.1, 0.03, 0.08], [0.0, 0.015, 0.11], { color: '#f2c14e', name: 'heap', scale: 0.4, edge: 'soft' });
    return b.act({ click: [[A.pose('cheese', { move: [0, -0.06, 0], dur: 0.3 }), A.pose('cheese', { move: [0, 0, 0], dur: 0.3 }), A.pose('cheese', { move: [0, -0.06, 0], dur: 0.3 }), A.par(A.pose('cheese', { move: [0, 0, 0], scale: 0.6, dur: 0.3 }), A.pose('heap', { scale: 1, dur: 0.6 }), A.say('Scritch scratch!', 1.5))], [A.par(A.pose('cheese', { scale: 1, dur: 0.3 }), A.pose('heap', { scale: 0.4, dur: 0.3 }))]] }).done();
  }),
  // A grave: a round-topped headstone, the mounded plot edged in stone and a pot of flowers that bloom.
  e('grave', 'places', 'cemetery', () =>
    m('grave')
      .box([0.6, 0.75, 0.14], [0, 0.375, -0.75], { color: '#9a9a96', round: 0.1, edge: 'sharp' })
      .cyl([0.6, 0.14, 0.3], [0, 0.75, -0.75], { color: '#9a9a96', rot: [90, 0, 0], edge: 'sharp' })
      .label('R.I.P.', [0.36, 0.14], [0, 0.6, -0.675], { color: '#9a9a96', depth: 0.01 })
      .box([0.86, 0.1, 1.9], [0, 0.05, 0.25], { color: '#bdb5a5', round: 0.1, edge: 'sharp' })
      .box([0.7, 0.14, 1.75], [0, 0.08, 0.25], { color: '#6a5a3a', round: 0.5 })
      .cyl([0.14, 0.12, 0.14], [0, 0.2, -0.55], { color: '#9a9590', taper: 1.2, edge: 'sharp' })
      .ball([0.22, 0.12, 0.14], [0, 0.3, -0.55], { color: '#4f8a3a' })
      .ball(0.07, [-0.06, 0.36, -0.55], { color: '#d6262b', name: 'bloom1', scale: 0.6 })
      .ball(0.07, [0.06, 0.36, -0.52], { color: '#f2d21e', name: 'bloom2', scale: 0.6 })
      .ball(0.06, [0, 0.4, -0.58], { color: 'white', name: 'bloom3', scale: 0.6 })
      .act({ click: [[A.par(A.pose('bloom1', { scale: 1.1, dur: 0.6 }), A.pose('bloom2', { scale: 1.1, dur: 0.6 }), A.pose('bloom3', { scale: 1.1, dur: 0.6 }), A.effect('sparkle', { dur: 1.5 }))], [A.par(A.pose('bloom1', { scale: 0.6, dur: 0.6 }), A.pose('bloom2', { scale: 0.6, dur: 0.6 }), A.pose('bloom3', { scale: 0.6, dur: 0.6 }))]] })
      .done(),
  ),
  // A heap of mixed gravel: a few stones roll down its side with a crunch.
  e('gravel', 'nature', 'rocks', () => {
    const b = m('gravel').ball([0.34, 0.08, 0.28], [0, 0.02, 0], { color: '#a8a098' });
    b.each(18, (i) => {
      const a = i * 2.4, r = 0.02 + (i % 5) * 0.024;
      b.ball([0.04, 0.03, 0.035], [Math.cos(a) * r, 0.04 + (0.12 - r) * 0.28, Math.sin(a) * r * 0.8], { color: ['#8a8680', '#b8b0a4', '#9a8a78', '#6a6a6a'][i % 4], rot: [0, i * 30, 0], ...(i < 2 ? { name: `stone${i}` } : {}) });
    });
    return b.act({ click: [A.par(A.pose('stone0', { move: [0.08, -0.03, 0.04], rot: [0, 0, -180], dur: 0.5 }), A.pose('stone1', { move: [-0.06, -0.02, 0.07], rot: [180, 0, 0], dur: 0.5 }), A.effect('dust', { dur: 0.8 }), A.say('Crunch!', 1)), A.wait(0.8), A.par(A.pose('stone0', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.pose('stone1', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }))] }).done();
  }),
  // An old churchyard: rows of headstones and a stone cross on the grass, a bare tree, a mist, and a wrought-iron
  // fence whose gate creaks open while an owl hoots.
  e('graveyard', 'places', 'cemetery', () => {
    const b = m('graveyard').box([9, 0.1, 7], [0, 0.05, 0], { color: '#5a8a3a', edge: 'sharp' });
    for (const [px, pz, h] of [[-3, -2, 0.85], [-1.4, -2.2, 1.0], [0.2, -2, 0.8], [1.8, -2.2, 0.9], [-2.2, 0, 0.75], [-0.6, -0.1, 0.9], [2.6, 0.1, 0.7], [-3, 1.8, 0.8], [0.8, 1.8, 0.85]] as const) {
      b.box([0.55, h, 0.14], [px, 0.1 + h / 2, pz], { color: '#9a9a96', round: 0.1, edge: 'sharp' }).cyl([0.55, 0.14, 0.27], [px, 0.1 + h, pz], { color: '#9a9a96', rot: [90, 0, 0], edge: 'sharp' });
      b.box([0.6, 0.06, 1.4], [px, 0.12, pz + 0.8], { color: '#6a5a3a', round: 0.5 });
    }
    b.box([0.14, 1.6, 0.14], [1.2, 0.9, 0.2], { color: '#bdb5a5', edge: 'sharp' }).box([0.8, 0.14, 0.14], [1.2, 1.3, 0.2], { color: '#bdb5a5', edge: 'sharp' });
    b.rod([3.5, 0.1, -2.6], [3.5, 3.2, -2.6], 0.25, '#3a2a20').rod([3.5, 2.4, -2.6], [2.6, 3.4, -2.6], 0.12, '#3a2a20').rod([3.5, 2.8, -2.6], [4.2, 3.6, -2.6], 0.1, '#3a2a20').rod([3.0, 2.95, -2.6], [2.8, 3.7, -2.4], 0.07, '#3a2a20');
    b.ball([0.3, 0.4, 0.3], [2.7, 3.55, -2.6], { color: '#7a5a3a', name: 'owl' }).ball(0.08, [2.65, 3.65, -2.45], { color: '#f2d21e', parent: 'owl', glow: true });
    for (let i = 0; i < 15; i++) {
      const xx = -4.4 + i * 0.63;
      if (Math.abs(xx) < 0.7) continue;
      b.stick([xx, 0.1, 3.4], [xx, 1.2, 3.4], 0.04, '#1e1e1e', { edge: 'sharp' });
    }
    b.stick([-4.4, 1.0, 3.4], [-0.7, 1.0, 3.4], 0.04, '#1e1e1e', { edge: 'sharp' }).stick([0.7, 1.0, 3.4], [4.4, 1.0, 3.4], 0.04, '#1e1e1e', { edge: 'sharp' });
    b.pair((s) => void b.box([0.25, 1.6, 0.25], [s * 0.75, 0.8, 3.4], { color: '#7a7470', edge: 'sharp' }));
    b.box([1.2, 1.1, 0.04], [0, 0.65, 3.4], { color: '#1e1e1e', name: 'gate', pivot: [-0.62, 0.65, 3.4], mover: { kind: 'swing', axis: 'y', amount: -95 }, edge: 'sharp' })
      .ball([3, 0.4, 2], [-1.5, 0.35, -1], { color: '#e8ecef', noInk: true });
    return b.act({ click: [[A.operate('gate', 'open'), A.say('Creeeeeak...', 2), A.pose('owl', { rot: [0, 40, 0], dur: 0.3 }), A.say('Hoo-hoooo!', 1.5, 'self'), A.pose('owl', { rot: [0, 0, 0], dur: 0.3 })], [A.operate('gate', 'close'), A.say('Clang.', 1)]] }).done();
  }),
  // A mound of mashed potato on a plate with rich brown gravy pooling over it: more gravy pours and it steams.
  e('gravy', 'food', 'sauces', () => {
    const b = m('gravy');
    plate(b, 0.22);
    return b
      .ball([0.13, 0.08, 0.12], [0, 0.05, 0], { color: '#f4ecd0' })
      .ball([0.1, 0.03, 0.09], [0, 0.082, 0], { color: '#7a4a20' })
      .capsule([0.02, 0.04, 0.015], [0.04, 0.06, 0.035], { color: '#7a4a20', rot: [20, 0, 20] })
      .ball([0.1, 0.01, 0.08], [0.05, 0.016, 0.05], { color: '#7a4a20', name: 'pool', scale: 0.7 })
      .act({ click: [[A.par(A.pose('pool', { scale: 1.4, dur: 0.8 }), A.effect('steam', { dur: 1.5 }), A.say('Mmm, gravy!', 1.5))], [A.pose('pool', { scale: 0.7, dur: 0.4 })]] })
      .done();
  }),
  // A white china gravy boat on its saucer, a loop handle and a long lip: it tips and pours.
  e('gravy boat', 'kitchen', 'tableware', () =>
    m('gravy boat')
      .ball([0.22, 0.012, 0.14], [0, 0.006, 0], { color: 'white', edge: 'sharp' })
      .ball([0.1, 0.08, 0.16], [0, 0.05, 0], { color: 'white', name: 'boat', pivot: [0, 0.012, 0.06] })
      .ball([0.085, 0.01, 0.13], [0, 0.086, 0], { color: '#7a4a20', noInk: true, parent: 'boat' })
      .cone([0.05, 0.06, 0.025], [0, 0.085, 0.085], { color: 'white', rot: [-60, 0, 0], taper: 0.4, parent: 'boat' })
      .arc([0.06, 0.06, 0.015], [0, 0.07, -0.09], { color: 'white', rot: [0, 90, 0], arc: 220, parent: 'boat' })
      .act({ click: [A.pose('boat', { rot: [35, 0, 0], dur: 0.5 }), A.say('Glug glug...', 1.5), A.wait(1), A.pose('boat', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  e('greater than sign', 'ideas', 'math symbols', () =>
    tile('greater than sign')
      .rod([-0.03, 0.1, 0.018], [0.032, 0.065, 0.018], 0.018, '#3f8a3a', { parent: 'tile' })
      .rod([0.032, 0.065, 0.018], [-0.03, 0.03, 0.018], 0.018, '#3f8a3a', { parent: 'tile' })
      .act({ click: [A.pose('tile', { move: [0.03, 0, 0], dur: 0.15 }), A.pose('tile', { move: [0, 0, 0], dur: 0.2 }), A.par(A.effect('sparkle', { dur: 0.8 }), A.say('More!', 1))] })
      .done(),
  ),
  // A Doric temple in miniature (13 m): a three-stepped stylobate, a peristyle of fluted columns, a frieze and a
  // pediment over the front, and inside the cella a golden statue that glows when its bronze doors open.
  e('greek temple', 'places', 'landmarks', () => {
    const b = m('greek temple', { edge: 'sharp' });
    const W = 14, D = 9, mar = '#efe9dc', mar2 = '#d8d0c0';
    for (let i = 0; i < 3; i++) b.box([W + 1.2 - i * 0.4, 0.35, D + 1.2 - i * 0.4], [0, 0.175 + i * 0.35, 0], { color: i % 2 ? mar : mar2, round: 0.02 });
    b.box([W - 3, 6.6, D - 3], [0, 1.05 + 3.3, -0.3], { color: mar2, round: 0.02 });
    const cy = 1.05, ch = 6.6;
    for (let i = 0; i < 8; i++) for (const z of [D / 2 - 0.5, -D / 2 + 0.5]) {
      const xx = -W / 2 + 0.6 + (i * (W - 1.2)) / 7;
      b.cyl([0.95, ch - 0.6, 0.95], [xx, cy + (ch - 0.6) / 2, z], { color: mar, taper: 0.82, segs: 16 }).box([1.15, 0.3, 1.15], [xx, cy + ch - 0.45, z], { color: mar, round: 0.1 });
    }
    for (let i = 1; i < 5; i++) for (const xx of [W / 2 - 0.6, -W / 2 + 0.6]) {
      const z = -D / 2 + 0.5 + (i * (D - 1)) / 5;
      b.cyl([0.95, ch - 0.6, 0.95], [xx, cy + (ch - 0.6) / 2, z], { color: mar, taper: 0.82, segs: 16 }).box([1.15, 0.3, 1.15], [xx, cy + ch - 0.45, z], { color: mar, round: 0.1 });
    }
    b.box([W, 0.7, D], [0, cy + ch + 0.05, 0], { color: mar, round: 0.02 })
      .box([W + 0.1, 0.6, D + 0.1], [0, cy + ch + 0.7, 0], { color: mar2, round: 0.02 })
      .each(14, (i) => void b.box([0.25, 0.5, 0.06], [-W / 2 + 0.5 + i * 1.0, cy + ch + 0.7, D / 2 + 0.06], { color: '#b8b0a0', noInk: true }))
      .wedge([D + 0.4, 2.2, W + 0.4], [0, cy + ch + 2.1, 0], { color: mar, rot: [0, 90, 0] })
      .wedge([W - 1, 1.6, 0.1], [0, cy + ch + 1.9, D / 2 + 0.15], { color: mar2 })
      .pair((s) => void b.ball([0.8, 0.9, 0.3], [s * 2.0, cy + ch + 1.55, D / 2 + 0.2], { color: '#c8c0b0' }))
      .ball([0.7, 1.2, 0.3], [0, cy + ch + 1.75, D / 2 + 0.2], { color: '#c8c0b0' });
    door(b, 'doorL', [-0.9, cy, D / 2 - 1.8], 1.8, 4.2, { color: '#a8743e', frame: mar, hinge: -1 });
    door(b, 'doorR', [0.9, cy, D / 2 - 1.8], 1.8, 4.2, { color: '#a8743e', frame: mar, hinge: 1 });
    b.cyl([0.8, 2.6, 0.8], [0, cy + 1.3, D / 2 - 2.6], { color: 'gold', taper: 0.6, name: 'statue', glow: true, mover: { kind: 'light', on: false } })
      .ball(0.5, [0, cy + 2.85, D / 2 - 2.6], { color: 'gold' });
    return b.act({ click: [[A.operate('door', 'open'), A.wait(0.4), A.par(A.operate('statue', 'on'), A.effect('sparkle', { dur: 2 }), A.say('Ahhhhh!', 2))], [A.operate('statue', 'off'), A.operate('door', 'close')]] }).done();
  }),
  // A big green arcade push-button in a steel bezel: it presses down and lights up with a ding.
  e('green button', 'tech', 'controls', () =>
    m('green button', { edge: 'sharp' })
      .box([0.12, 0.04, 0.12], [0, 0.02, 0], { color: '#3a3d42', round: 0.2 })
      .cyl([0.095, 0.012, 0.095], [0, 0.046, 0], { color: 'silver' })
      .cyl([0.075, 0.03, 0.075], [0, 0.065, 0], { color: '#3fcf3f', name: 'button', mover: { kind: 'slide', axis: 'y', amount: -0.015 } })
      .dome([0.075, 0.02, 0.075], [0, 0.08, 0], { color: '#5aff5a', glow: true, parent: 'button', name: 'lamp', mover: { kind: 'light', on: false }, edge: 'soft' })
      .act({ click: [A.operate('button', 'down'), A.par(A.operate('lamp', 'on'), A.say('Ding!', 1)), A.operate('button', 'up'), A.wait(1), A.operate('lamp', 'off')] })
      .done(),
  ),
  // A green rocker switch on a white wall plate: it flips on (its light glows) and off.
  e('green switch', 'tech', 'controls', () =>
    m('green switch', { edge: 'sharp' })
      .box([0.08, 0.12, 0.02], [0, 0.06, 0], { color: 'white', round: 0.2 })
      .box([0.045, 0.075, 0.02], [0, 0.06, 0.018], { color: '#2a2a2a', round: 0.2 })
      .box([0.035, 0.07, 0.02], [0, 0.06, 0.03], { color: '#2faf3f', round: 0.3, name: 'rocker', rot: [0, 0, 0], pivot: [0, 0.06, 0.025] })
      .box([0.004, 0.014, 0.004], [0, 0.08, 0.042], { color: '#d8ffd8', noInk: true, parent: 'rocker', glow: true, name: 'led', mover: { kind: 'light', on: false } })
      .act({ click: [[A.pose('rocker', { rot: [14, 0, 0], dur: 0.1 }), A.par(A.operate('led', 'on'), A.say('Click!', 0.8))], [A.pose('rocker', { rot: [-14, 0, 0], dur: 0.1 }), A.par(A.operate('led', 'off'), A.say('Click.', 0.8)), A.pose('rocker', { rot: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // A Victorian glasshouse (6 m long, 3.8 m to the ridge): white glazing bars over green-tinted glass, roof vents
  // that open, staging full of pots and tomatoes inside, and a door at the gable end.
  e('greenhouse', 'garden', 'garden features', () => {
    const b = m('greenhouse', { edge: 'sharp' });
    const L = 6, W = 3.6, H = 2.2, g = '#cfeee0';
    b.box([W + 0.2, 0.5, L + 0.2], [0, 0.25, 0], { color: '#a8503a', round: 0.02 })
      .box([W, H - 0.5, L], [0, 0.5 + (H - 0.5) / 2, 0], { color: g, round: 0.01 })
      .wedge([W, 1.6, L], [0, H + 0.8, 0], { color: g });
    for (let i = 0; i <= 6; i++) {
      const z = -L / 2 + (i * L) / 6;
      b.pair((s) => void b.stick([s * W / 2, 0.5, z], [s * W / 2, H, z], 0.05, 'white').rod([s * W / 2, H, z], [0, H + 1.6, z], 0.05, 'white'));
    }
    b.pair((s) => void b.stick([s * W / 2, H, -L / 2], [s * W / 2, H, L / 2], 0.06, 'white'));
    b.stick([0, H + 1.6, -L / 2], [0, H + 1.6, L / 2], 0.07, 'white');
    for (const z of [L / 2, -L / 2]) for (let i = 1; i < 4; i++) b.stick([-W / 2 + (i * W) / 4, 0.5, z], [-W / 2 + (i * W) / 4, H + (i === 2 ? 1.5 : 0.75), z], 0.05, 'white');
    b.pair((s) => void b.box([0.04, 0.8, 1.6], [s * 0.85, H + 1.2, -1.5], { color: '#bfe6d6', rot: [0, 0, -s * 42], name: s > 0 ? 'ventL' : 'ventR', pivot: [s * 0.1, H + 1.55, -1.5], mover: { kind: 'swing', axis: 'z', amount: s * 30 } }));
    door(b, 'door', [0, 0.5, L / 2], 0.9, 1.9, { color: '#bfe6d6', frame: 'white', glass: true });
    b.box([0.6, 0.8, L - 1.2], [1.3, 0.9, -0.3], { color: '#a8743e', round: 0.02 }).box([0.6, 0.8, L - 1.2], [-1.3, 0.9, -0.3], { color: '#a8743e', round: 0.02 });
    for (let i = 0; i < 5; i++) for (const xx of [1.3, -1.3]) b.cyl([0.22, 0.2, 0.22], [xx, 1.4, -2.4 + i * 1.0], { color: '#c06a40', taper: 1.2 }).ball([0.35, 0.4, 0.35], [xx, 1.7, -2.4 + i * 1.0], { color: i % 2 ? '#3f8a3a' : '#4f9a3a' }).ball(0.12, [xx + 0.1, 1.75, -2.35 + i * 1.0], { color: '#d6262b' });
    return b.act({ click: [[A.par(A.operate('vent', 'open'), A.operate('door', 'open')), A.effect('steam', { dur: 1.5 }), A.say('Ahh, warm in here!', 2, '')], [A.par(A.operate('vent', 'close'), A.operate('door', 'close'))]] }).done();
  }),
  // A pineapple hand grenade: a segmented olive body, the fuse head, spoon and ring pin: pin out, BOOM, and it is
  // back.
  e('grenade', 'armory', 'grenades', () => {
    const b = m('grenade').ball([0.065, 0.085, 0.065], [0, 0.043, 0], { color: '#5a6a3a', name: 'body' });
    b.each(3, (i) => void b.torus([0.067, 0.08, 0.004], [0, 0.043, 0], { color: '#3a4a2a', rot: [0, i * 60, 0], tube: 0.06, noInk: true, parent: 'body' }));
    b.torus([0.066, 0.066, 0.004], [0, 0.043, 0], { color: '#3a4a2a', rot: [90, 0, 0], tube: 0.06, noInk: true, parent: 'body' });
    return b
      .cyl([0.028, 0.025, 0.028], [0, 0.093, 0], { color: '#7a7f86', parent: 'body', edge: 'sharp' })
      .box([0.012, 0.08, 0.008], [0, 0.07, 0.035], { color: '#7a7f86', rot: [-12, 0, 0], parent: 'body', edge: 'sharp' })
      .torus([0.03, 0.03, 0.005], [0.025, 0.1, 0], { color: 'silver', tube: 0.15, rot: [0, 30, 0], name: 'pin', parent: 'body' })
      .act({
        click: [
          [A.pose('pin', { move: [0.06, 0.03, 0], dur: 0.3 }), A.say('Uh-oh...', 1), A.wait(1), A.par(A.effect('explosion', { dur: 1 }), A.say('BOOM!', 1.5), A.pose('body', { scale: 0, dur: 0.05 })), A.effect('smoke', { dur: 1.5 })],
          [A.pose('pin', { move: [0, 0, 0], dur: 0 }), A.pose('body', { scale: 1, dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A six-shot revolving grenade launcher: a fat cylinder, a stubby barrel, a folding stock and foregrip: it fires
  // with a thump and recoils.
  e('grenade launcher', 'armory', 'guns', () =>
    m('grenade launcher', { view: 'side', edge: 'sharp' })
      .prism([0.2, 0.2, 0.2], [0, 0.16, 0.0], 6, { color: '#3a3a3a', rot: [90, 0, 0], name: 'drum' })
      .stick([0, 0.17, 0.1], [0, 0.17, 0.52], 0.08, '#2a2a2a', { name: 'barrel' })
      .cyl([0.1, 0.02, 0.1], [0, 0.17, 0.53], { color: '#1e1e1e', rot: [90, 0, 0], parent: 'barrel' })
      .box([0.07, 0.08, 0.3], [0, 0.26, -0.12], { color: '#4a4a40' })
      .box([0.05, 0.13, 0.05], [0, 0.08, -0.14], { color: '#3a3a3a', rot: [-15, 0, 0] })
      .box([0.05, 0.1, 0.05], [0, 0.1, 0.3], { color: '#3a3a3a' })
      .box([0.06, 0.1, 0.3], [0, 0.22, -0.4], { color: '#5a5040', rot: [8, 0, 0], round: 0.3 })
      .box([0.03, 0.05, 0.03], [0, 0.28, 0.3], { color: '#2a2a2a' })
      .act({ click: [A.par(A.pose('barrel', { move: [0, 0, -0.06], dur: 0.06 }), A.effect('smoke', { dur: 1.5 }), A.say('THOOMP!', 1.5)), A.pose('barrel', { move: [0, 0, 0], dur: 0.3 }), A.pose('drum', { rot: [0, 0, 60], dur: 0.3 }), A.pose('drum', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A cast-iron griddle on the hob with two pancakes and a spatula: a pancake flips in the air.
  e('griddle', 'kitchen', 'cookware', () =>
    m('griddle')
      .box([0.42, 0.03, 0.28], [0, 0.015, 0], { color: '#2a2a2e', round: 0.2, edge: 'sharp' })
      .box([0.4, 0.015, 0.26], [0, 0.034, 0], { color: '#3a3a3e', round: 0.1, edge: 'sharp' })
      .box([0.08, 0.025, 0.06], [0.25, 0.022, 0], { color: '#2a2a2e', round: 0.3, edge: 'sharp' })
      .box([0.08, 0.025, 0.06], [-0.25, 0.022, 0], { color: '#2a2a2e', round: 0.3, edge: 'sharp' })
      .cyl([0.12, 0.018, 0.12], [-0.08, 0.05, 0], { color: '#d8a050', name: 'pancake' })
      .cyl([0.11, 0.002, 0.11], [-0.08, 0.06, 0], { color: '#b07830', parent: 'pancake', noInk: true })
      .cyl([0.12, 0.018, 0.12], [0.08, 0.05, 0.01], { color: '#d8a050' })
      .box([0.08, 0.004, 0.06], [0.12, 0.062, -0.06], { color: 'silver', rot: [0, 30, 0], edge: 'sharp' })
      .rod([0.12, 0.062, -0.06], [0.22, 0.1, -0.16], 0.014, '#1e1e1e')
      .act({ click: [A.pose('pancake', { move: [0, 0.18, 0], rot: [90, 0, 0], dur: 0.3 }), A.pose('pancake', { move: [0, 0, 0], rot: [180, 0, 0], dur: 0.3 }), A.par(A.say('Flip!', 1), A.effect('steam', { dur: 1 })), A.pose('pancake', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A kettle barbecue (1 m) on three legs with wheels: the domed lid lifts off sausages and burgers on the grate,
  // smoke billows and it sizzles.
  e('grill', 'garden', 'backyard', () => {
    const b = m('grill')
      .ball([0.58, 0.42, 0.58], [0, 0.72, 0], { color: '#1a1a1e', edge: 'sharp' })
      .cyl([0.58, 0.02, 0.58], [0, 0.72, 0], { color: 'silver', edge: 'sharp' })
      .ball([0.58, 0.38, 0.58], [0, 0.74, 0], { color: '#1a1a1e', name: 'lid', pivot: [0, 0.74, -0.29], mover: { kind: 'swing', axis: 'x', amount: -95 }, edge: 'sharp' })
      .cyl([0.06, 0.04, 0.06], [0, 0.94, 0], { color: 'silver', parent: 'lid' })
      .box([0.16, 0.03, 0.04], [0, 0.97, 0], { color: '#5a3a22', parent: 'lid' })
      .cyl([0.22, 0.02, 0.22], [0, 0.35, 0], { color: 'silver', edge: 'sharp' })
      .capsule([0.04, 0.16, 0.04], [-0.1, 0.75, 0.0], { color: '#a8502a', rot: [90, 0, 0] })
      .capsule([0.04, 0.16, 0.04], [-0.02, 0.75, 0.02], { color: '#a8502a', rot: [90, 0, 0] })
      .cyl([0.1, 0.03, 0.1], [0.12, 0.745, -0.03], { color: '#5a3018' });
    for (const [px, pz] of around(3, 0.22, Math.PI / 2)) b.stick([px * 1.1, 0, pz * 1.1], [px * 0.7, 0.6, pz * 0.7], 0.04, 'silver', { edge: 'sharp' });
    wheel(b, 'wheelL', [0.26, 0.08, -0.1], 0.16, 0.05, '#5a5f66');
    return b.act({ click: [A.operate('lid', 'open'), A.par(A.effect('smoke', { dur: 2.5 }), A.say('Sizzle sizzle!', 2)), A.wait(2), A.operate('lid', 'close')] }).done();
  }),
  // A toasted cheese sandwich cut corner to corner on a plate: the halves pull apart on a long string of cheese.
  e('grilled cheese', 'food', 'sandwiches', () => {
    const b = m('grilled cheese');
    plate(b, 0.24);
    return b
      .wedge([0.13, 0.13, 0.03], [-0.03, 0.03, 0.0], { color: '#d89a40', rot: [90, 0, 30], name: 'halfA' })
      .wedge([0.135, 0.135, 0.012], [-0.03, 0.048, 0.0], { color: '#f0a020', rot: [90, 0, 30], parent: 'halfA' })
      .wedge([0.13, 0.13, 0.03], [-0.03, 0.066, 0.0], { color: '#e0a848', rot: [90, 0, 30], parent: 'halfA' })
      .wedge([0.13, 0.13, 0.03], [0.075, 0.035, 0.015], { color: '#d89a40', rot: [90, 12, -150], name: 'halfB' })
      .wedge([0.135, 0.135, 0.012], [0.075, 0.053, 0.015], { color: '#f0a020', rot: [90, 12, -150], parent: 'halfB' })
      .wedge([0.13, 0.13, 0.03], [0.075, 0.071, 0.015], { color: '#e0a848', rot: [90, 12, -150], parent: 'halfB' })
      .capsule([0.014, 0.04, 0.01], [0.022, 0.05, 0.008], { color: '#f0a020', rot: [0, 0, 90], name: 'string' })
      .act({ click: [[A.par(A.pose('halfA', { move: [-0.04, 0, 0], dur: 0.6 }), A.pose('halfB', { move: [0.04, 0.02, 0], dur: 0.6 }), A.pose('string', { scale: 2.5, dur: 0.6 })), A.say('Stretchy!', 1.2)], [A.par(A.pose('halfA', { move: [0, 0, 0], dur: 0.4 }), A.pose('halfB', { move: [0, 0, 0], dur: 0.4 }), A.pose('string', { scale: 1, dur: 0.4 }))]] })
      .done();
  }),
  // A cordless angle grinder: a yellow motor body, a side handle, a guard over the cutting disc: the disc spins up
  // and throws sparks.
  e('grinder (tool)', 'workshop', 'power tools', () =>
    m('grinder (tool)', { edge: 'sharp' })
      .capsule([0.065, 0.24, 0.065], [-0.06, 0.075, 0], { color: '#f2c14e', rot: [0, 0, 80], edge: 'soft' })
      .box([0.07, 0.05, 0.08], [-0.2, 0.06, 0], { color: '#1e1e1e', round: 0.3 })
      .box([0.09, 0.07, 0.07], [0.08, 0.08, 0], { color: '#2a2a2a', round: 0.3 })
      .cyl([0.06, 0.04, 0.06], [0.09, 0.035, 0], { color: '#7a7f86' })
      .cyl([0.12, 0.008, 0.12], [0.09, 0.012, 0], { color: '#4a4a52', name: 'disc', mover: { kind: 'spin', axis: 'y', amount: 1500 } })
      .box([0.1, 0.004, 0.012], [0.09, 0.017, 0], { color: '#7a7f86', parent: 'disc' })
      .cyl([0.13, 0.03, 0.13], [0.07, 0.03, -0.01], { color: 'silver', taper: 0.9 })
      .rod([0.08, 0.09, 0.03], [0.08, 0.11, 0.12], 0.025, '#1e1e1e')
      .act({ click: [A.operate('disc', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Zzzzzzzzz!', 2), A.anim('shake', 3)), A.operate('disc', 'off')] })
      .done(),
  ),
];
