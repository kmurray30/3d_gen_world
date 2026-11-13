/**
 * Catalog chunk objects-10: the words in assign/objects-10.tsv (toadstool .. éclair), at their real size beside a
 * 1.7 m person, with crisp or soft edges per part, named movers, pieces and sockets, and an act for every entry.
 */
import { e, x, type CatalogEntry } from './types';
import { A, around, m, withAct, type M } from '../dsl';
import { hat, held, wear, who } from '../accessories';

type V = [number, number, number];
/** Mannequin / dress-form colour. */
const FORM = '#e3d6c3';
const TERRA = '#c0643a';
const DEG = Math.PI / 180;

/* ----- vehicles ----- */

/** A road wheel for a side-view vehicle (axle along x): a soft tyre named `name` (wheel* names roll when it
 *  drives) with a sharp rim and hub riding on it. */
function wheel(b: M, name: string, d: number, w: number, at: V, rim = 'silver', parent?: string): M {
  b.torus([d, d, w], at, { color: 'rubber', rot: [0, 90, 0], tube: 0.32, name, edge: 'soft', parent });
  b.cyl([d * 0.66, w * 0.7, d * 0.66], at, { color: rim, rot: [0, 0, 90], parent: name, edge: 'sharp' });
  return b.cyl([d * 0.2, w * 0.86, d * 0.2], at, { color: '#4a4744', rot: [0, 0, 90], parent: name, edge: 'sharp' });
}
/** Two wheels on one axle at z, `track` apart centre to centre: wheel<tag>L (+x) and wheel<tag>R. */
function axle2(b: M, tag: string, d: number, w: number, track: number, z: number, rim = 'silver'): M {
  return b.pair((s) => wheel(b, `wheel${tag}${s > 0 ? 'L' : 'R'}`, d, w, [(s * track) / 2, d / 2, z], rim));
}

/* ----- buildings ----- */

type Face = 'front' | 'back' | 'left' | 'right';
const FACE_ROT: Record<Face, number> = { front: 0, back: 180, left: 90, right: -90 };
/** Along the wall, to the right as you face it from outside... in figure terms: +x on the front. */
const ALONG: Record<Face, V> = { front: [1, 0, 0], back: [-1, 0, 0], left: [0, 0, -1], right: [0, 0, 1] };
/** A point on a wall: `at` on the wall's surface, moved du along it, dv up and dn out of it. */
function onWall(at: V, face: Face, du: number, dv: number, dn: number): V {
  const u = ALONG[face];
  const n: V = face === 'front' ? [0, 0, 1] : face === 'back' ? [0, 0, -1] : face === 'left' ? [1, 0, 0] : [-1, 0, 0];
  return [at[0] + u[0] * du + n[0] * dn, at[1] + dv, at[2] + u[2] * du + n[2] * dn];
}
/** A framed window (at = centre of the glass on the wall's surface): frame, glass, glazing bars and a sill. */
function win(b: M, w: number, h: number, at: V, face: Face = 'front', frame = 'white', o: { bars?: boolean; sill?: boolean; glass?: string } = {}): M {
  const r: V = [0, FACE_ROT[face], 0];
  b.box([w + 0.14, h + 0.14, 0.05], onWall(at, face, 0, 0, 0.02), { color: frame, rot: r, round: 0.15 });
  b.box([w, h, 0.03], onWall(at, face, 0, 0, 0.04), { color: o.glass ?? 'glass', rot: r, round: 0.1 });
  if (o.bars !== false) b.box([0.05, h, 0.025], onWall(at, face, 0, 0, 0.06), { color: frame, rot: r }).box([w, 0.05, 0.025], onWall(at, face, 0, 0, 0.06), { color: frame, rot: r });
  if (o.sill !== false) b.box([w + 0.26, 0.07, 0.14], onWall(at, face, 0, -h / 2 - 0.1, 0.06), { color: frame, rot: r });
  return b;
}
/** A hinged door (at = middle of its bottom edge on the wall's surface) that swings outward about its hinge
 *  side (hinge +1: the +x end on a front wall), with a frame and a handle at 1 m. */
function door(b: M, name: string, w: number, h: number, at: V, color: string, o: { face?: Face; hinge?: 1 | -1; frame?: string; glass?: boolean; amount?: number } = {}): M {
  const face = o.face ?? 'front', hg = o.hinge ?? 1, r: V = [0, FACE_ROT[face], 0];
  b.box([w + 0.18, h + 0.09, 0.06], onWall(at, face, 0, (h + 0.09) / 2, 0.02), { color: o.frame ?? 'white', rot: r, round: 0.1 });
  b.box([w, h, 0.06], onWall(at, face, 0, h / 2, 0.06), { color, rot: r, round: 0.06, name, pivot: onWall(at, face, (hg * w) / 2, h / 2, 0.06), mover: { kind: 'swing', axis: 'y', amount: hg * (o.amount ?? 95) } });
  if (o.glass) b.box([w * 0.6, h * 0.36, 0.02], onWall(at, face, 0, h * 0.7, 0.095), { color: 'glass', rot: r, parent: name });
  return b.ball([0.07, 0.07, 0.07], onWall(at, face, -hg * (w / 2 - 0.1), Math.min(1.0, h * 0.5), 0.11), { color: 'brass', parent: name });
}
/** A gable roof over a w (x) by d (z) block whose walls are h tall, ridge along x. */
function gable(b: M, w: number, d: number, h: number, rise: number, color: string, over = 0.3): M {
  return b.wedge([d + over * 2, rise, w + over * 2], [0, h + rise / 2, 0], { color, rot: [0, 90, 0], edge: 'sharp' });
}
/** A soft round tree: trunk and three blobs of leaves. */
function tree(b: M, at: V, h: number, leaf = 'leaf'): M {
  const [x0, y0, z0] = at;
  b.cyl([h * 0.08, h * 0.55, h * 0.08], [x0, y0 + h * 0.275, z0], { color: 'bark', taper: 0.75, edge: 'soft' });
  return b.ball([h * 0.55, h * 0.45, h * 0.55], [x0, y0 + h * 0.7, z0], { color: leaf, edge: 'soft' })
    .ball([h * 0.36, h * 0.3, h * 0.36], [x0 + h * 0.18, y0 + h * 0.58, z0 + h * 0.08], { color: leaf, edge: 'soft' })
    .ball([h * 0.34, h * 0.3, h * 0.34], [x0 - h * 0.16, y0 + h * 0.62, z0 - h * 0.06], { color: '#4e9448', edge: 'soft' });
}

/** Tread lugs round a big tractor tyre (wheel `name`, diameter d, width w, centre at). */
function lugs(b: M, name: string, d: number, w: number, at: V, n = 10): M {
  return b.each(n, (i) => {
    const a = (i / n) * Math.PI * 2, r = d / 2 - 0.035;
    b.box([w * 0.92, 0.07, d * 0.1], [at[0], at[1] + Math.cos(a) * r, at[2] + Math.sin(a) * r], { color: 'rubber', rot: [a / DEG, 0, 0], parent: name, edge: 'soft', round: 0.4 });
  });
}
/** A shop at real size, w frontage x h x d: a glass door (named door) between two display windows, a striped
 *  awning, a sign board, a cornice and a plinth. Things in the windows go at y 0.6 to 2.3, z just inside d / 2. */
function shopFront(key: string, o: { w?: number; h?: number; d?: number; wall: string; trim?: string; sign: string; signC?: string; awning: [string, string]; doorC?: string }): M {
  const w = o.w ?? 8, h = o.h ?? 5, d = o.d ?? 6, trim = o.trim ?? 'white', z = d / 2;
  const b = m(key, { edge: 'sharp' })
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.03 })
    .box([w + 0.3, 0.35, d + 0.3], [0, h + 0.12, 0], { color: trim, round: 0.1 })
    .box([w + 0.1, 0.45, d + 0.1], [0, 0.225, 0], { color: '#8a8a84', round: 0.05 });
  door(b, 'door', 1.1, 2.3, [0, 0.0, z], o.doorC ?? '#2f4f8f', { glass: true, frame: trim });
  const ww = w / 2 - 1.3;
  b.pair((s) => {
    const cx = s * (0.85 + ww / 2);
    b.box([ww + 0.2, 2.0, 0.08], [cx, 1.55, z + 0.02], { color: trim, round: 0.1 })
      .box([ww, 1.8, 0.05], [cx, 1.55, z + 0.06], { color: 'glass', round: 0.05 })
      .box([ww + 0.3, 0.12, 0.25], [cx, 0.5, z + 0.1], { color: trim });
  });
  const n = Math.round(w / 0.8), sw = w / n;
  b.each(n, (i) => b.box([sw, 0.06, 1.25], [-w / 2 + sw * (i + 0.5), 3.05, z + 0.62], { color: i % 2 ? o.awning[1] : o.awning[0], rot: [22, 0, 0], round: 0.2 }).box([sw, 0.28, 0.04], [-w / 2 + sw * (i + 0.5), 2.68, z + 1.2], { color: i % 2 ? o.awning[1] : o.awning[0], round: 0.2 }));
  return b.box([w * 0.72, 0.95, 0.14], [0, h - 0.85, z + 0.07], { color: trim, round: 0.1 }).label(o.sign, [w * 0.66, 0.8], [0, h - 0.85, z + 0.16], { color: o.signC ?? 'white', depth: 0.04 });
}

/** A modern wind turbine with its foot at (x, y0, z): a tapering white tower h tall, a nacelle with a red lamp
 *  (lamp<tag>), and three blades on a hub (blades<tag>) that turn and can be braked. */
function windTurbineX(b: M, x: number, z: number, y0: number, h: number, tag: string): M {
  const top = y0 + h, hy = top + h * 0.01, hz = z + h * 0.07, L = h * 0.42;
  b.cyl([h * 0.075, h, h * 0.075], [x, y0 + h / 2, z], { color: 'white', taper: 0.5, edge: 'soft' })
    .box([h * 0.06, h * 0.06, h * 0.16], [x, hy, z - h * 0.02], { color: 'white', round: 0.4, edge: 'sharp' })
    .ball(h * 0.014, [x, hy + h * 0.035, z - h * 0.08], { color: '#e0473b', glow: true, name: `lamp${tag}`, mover: { kind: 'light', on: true } })
    .ball([h * 0.06, h * 0.06, h * 0.08], [x, hy, hz], { color: '#e6e6e2', name: `blades${tag}`, pivot: [x, hy, hz], mover: { kind: 'spin', axis: 'z', amount: 70, on: true } });
  return b.each(3, (i) => {
    const a = (i / 3) * Math.PI * 2;
    b.box([h * 0.04, L, h * 0.012], [x + Math.sin(a) * L * 0.52, hy + Math.cos(a) * L * 0.52, hz + h * 0.01], { color: 'white', rot: [0, 0, -a / DEG], parent: `blades${tag}`, edge: 'sharp' });
  });
}

/** A spread feathered wing on side s (+1 spreads toward +x) from the shoulder `sh`, `span` across: a leading
 *  edge up to the wrist and out to the tip, rows of coverts, and a fan of flight feathers turning from hanging
 *  down at the body to pointing out at the tip. Everything hangs off `name` (which turns at the shoulder). */
function featherWing(b: M, s: 1 | -1, sh: V, span: number, name: string, c: { bone: string; covert: string; quill: [string, string] }): M {
  const P = (u: number, v: number): V => [sh[0] + s * u * span, sh[1] + v * span, sh[2]];
  const wrist = P(0.42, 0.3), tip = P(1, 0.36);
  const along = (t: number): V => {
    const [a, q, k] = t < 0.45 ? [sh, wrist, t / 0.45] : [wrist, tip, (t - 0.45) / 0.55];
    return [a[0] + (q[0] - a[0]) * k, a[1] + (q[1] - a[1]) * k, a[2] + (q[2] - a[2]) * k];
  };
  b.rod(sh, wrist, span * 0.08, c.bone, { name, pivot: sh }).rod(wrist, tip, span * 0.05, c.bone, { parent: name });
  for (let i = 0; i < 11; i++) {
    const t = i / 10, base = along(t), phi = (-100 + 88 * t) * DEG, L = span * (0.32 + 0.26 * t);
    const d: V = [s * Math.cos(phi), Math.sin(phi), 0];
    b.ball([span * 0.075, L, span * 0.018], [base[0] + d[0] * L * 0.46, base[1] + d[1] * L * 0.46, base[2] - 0.004 - (i % 2) * span * 0.012], { color: i % 2 ? c.quill[0] : c.quill[1], rot: [0, 0, s * (phi / DEG - 90) + (s < 0 ? 180 : 0)], parent: name });
  }
  for (const t of [0.12, 0.32, 0.52, 0.72]) {
    const p = along(t);
    b.ball([span * 0.24, span * 0.14, span * 0.05], [p[0] + s * span * 0.02, p[1] - span * 0.06, p[2] + span * 0.01], { color: c.covert, parent: name });
  }
  return b;
}

/* ----- mannequins, dress forms, pots ----- */

/** A dress form on a stand wearing a top (torso from y 1.1 down by len). */
function form(key: string, top: string, o: { sleeve?: 'short' | 'long' | 'none'; len?: number } = {}): M {
  const b = m(key).cyl([0.34, 0.035, 0.34], [0, 0.0175, 0], { color: 'darkwood' })
    .stick([0, 0.03, 0], [0, 0.62, 0], 0.035, 'darkwood')
    .cyl([0.085, 0.1, 0.085], [0, 1.13, 0], { color: FORM })
    .ball([0.11, 0.05, 0.11], [0, 1.19, 0], { color: 'darkwood' });
  const len = o.len ?? 0.5;
  b.box([0.4, len, 0.24], [0, 1.1 - len / 2, 0], { color: top, round: 0.5 });
  if (o.sleeve === 'short') b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.25, 0.87, 0], 0.11, top));
  if (o.sleeve === 'long') b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.27, 0.62, 0], 0.09, top));
  return b;
}

/** A full faceless mannequin wearing an outfit: legs (trousers) or a skirt to the floor. */
interface DO { top: string; legs?: string; skirt?: string; skirtW?: number; sleeve?: 'long' | 'short' | 'none'; arm?: string; shoes?: string }
function dummy(key: string, o: DO): M {
  const b = m(key);
  const arm = o.arm ?? o.top;
  if (o.skirt) b.cyl([o.skirtW ?? 0.7, 0.98, o.skirtW ?? 0.7], [0, 0.49, 0], { color: o.skirt, taper: 0.45 });
  else {
    b.pair((s) => b.rod([s * 0.1, 0.12, 0], [s * 0.1, 0.92, 0], 0.15, o.legs ?? 'navy'));
    b.pair((s) => b.ball([0.12, 0.09, 0.24], [s * 0.1, 0.045, 0.04], { color: o.shoes ?? 'black' }));
  }
  b.box([0.4, 0.2, 0.24], [0, 0.95, 0], { color: o.skirt ?? o.legs ?? 'navy', round: 0.5 });
  b.box([0.44, 0.52, 0.25], [0, 1.24, 0], { color: o.top, round: 0.5 });
  const sl = o.sleeve ?? 'long';
  b.pair((s) => {
    if (sl === 'long') b.rod([s * 0.25, 1.44, 0], [s * 0.3, 0.92, 0], 0.1, arm);
    else if (sl === 'short') b.rod([s * 0.25, 1.44, 0], [s * 0.28, 1.22, 0], 0.11, arm).rod([s * 0.28, 1.22, 0], [s * 0.3, 0.92, 0], 0.085, FORM);
    else b.rod([s * 0.25, 1.44, 0], [s * 0.3, 0.92, 0], 0.085, FORM);
    b.ball(0.09, [s * 0.305, 0.86, 0], { color: FORM });
  });
  b.cyl([0.09, 0.1, 0.09], [0, 1.53, 0], { color: FORM }).ball([0.2, 0.25, 0.21], [0, 1.66, 0], { color: FORM });
  return b;
}

/** A head form on a little stand (for wigs, hairpieces, veils). Head centre at y 0.24. */
function headForm(key: string): M {
  return m(key).cyl([0.13, 0.03, 0.13], [0, 0.015, 0], { color: 'darkwood' }).cyl([0.07, 0.13, 0.07], [0, 0.09, 0], { color: FORM }).ball([0.17, 0.21, 0.19], [0, 0.24, 0], { color: FORM, name: 'form' });
}

/** A flowerpot (terracotta) of diameter d and height h, with soil. */
function pot(b: M, d: number, h: number, color = TERRA): M {
  return b.cyl([d, h, d], [0, h / 2, 0], { color, taper: 1.25 }).cyl([d * 1.3, h * 0.18, d * 1.3], [0, h * 0.95, 0], { color }).cyl([d * 1.15, 0.02, d * 1.15], [0, h * 1.04, 0], { color: 'dirt' });
}

export const ENTRIES: CatalogEntry[] = [
  // Fly agaric: a soft stem with its skirt and bulb, and a cap that is its own piece so it can bob and puff.
  e('toadstool', 'garden', 'mushrooms', () => {
    const b = m('toadstool')
      .cyl([0.05, 0.026, 0.05], [0, 0.013, 0], { color: '#ece2cc', taper: 0.72 })
      .cyl([0.03, 0.1, 0.03], [0, 0.07, 0], { color: '#f7f2e6', taper: 0.82, name: 'stem' })
      .cyl([0.054, 0.012, 0.054], [0, 0.1, 0], { color: 'white', taper: 1.4, parent: 'stem' })
      .dome([0.15, 0.062, 0.15], [0, 0.141, 0], { color: '#d8281c', name: 'cap', parent: 'stem', piece: true, pivot: [0, 0.115, 0] })
      .cyl([0.136, 0.012, 0.136], [0, 0.112, 0], { color: '#f1e8d2', parent: 'cap' })
      .ball([0.026, 0.01, 0.026], [0, 0.171, 0], { color: 'white', parent: 'cap', noInk: true });
    for (const [x, z] of around(7, 0.052)) b.ball([0.022, 0.011, 0.022], [x, 0.155, z], { color: 'white', parent: 'cap', noInk: true });
    for (const [x, z] of around(4, 0.027, 0.5)) b.ball([0.018, 0.01, 0.018], [x, 0.166, z], { color: 'white', parent: 'cap', noInk: true });
    return b
      .act({
        click: [
          [A.par(A.pose('cap', { rot: [0, 0, 10], dur: 0.2 }), A.effect('dust', { dur: 1.6 }), A.say('Poof!', 1.2)), A.pose('cap', { rot: [0, 0, 0], dur: 0.4 })],
          [A.par(A.anim('hop'), A.effect('sparkle', { dur: 2 }), A.say('Ting!', 1.2))],
        ],
      })
      .done();
  }),
  // A slice of toast standing on its edge (it pops out of toasters like this), crumb face both sides, a pat of
  // butter that melts.
  e('toast', 'food', 'bread', () => {
    const crust = '#a9662c', crumb = '#dda15a';
    const b = m('toast').box([0.112, 0.088, 0.013], [0, 0.044, 0], { color: crust, round: 0.35, name: 'body' });
    b.pair((s) => b.ball([0.068, 0.05, 0.013], [s * 0.027, 0.09, 0], { color: crust }).ball([0.056, 0.038, 0.0142], [s * 0.027, 0.089, 0], { color: crumb, noInk: true }));
    return b
      .box([0.098, 0.078, 0.0142], [0, 0.046, 0], { color: crumb, round: 0.4, noInk: true })
      .box([0.036, 0.03, 0.007], [0.008, 0.058, 0.0095], { color: '#f7e17a', round: 0.3, rot: [0, 0, 12], name: 'butter', parent: 'body', piece: true })
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 1.6 }), A.pose('butter', { scale: 0.35, dur: 1.6 }), A.say('Sizzle...', 1.5))],
          [A.par(A.pose('butter', { scale: 1, dur: 0.3 }), A.anim('hop'), A.say('Crunch!', 1.2))],
        ],
      })
      .done();
  }),
  // Pressed metal, so sharp; the lever slides down, two slot sockets take the bread.
  e('toaster', 'kitchen', 'appliances', () =>
    m('toaster', { edge: 'sharp' })
      .box([0.29, 0.18, 0.17], [0, 0.112, 0], { color: 'silver', round: 0.4, name: 'body' })
      .box([0.3, 0.022, 0.18], [0, 0.011, 0], { color: '#2a2726', round: 0.3 })
      .box([0.22, 0.012, 0.032], [0, 0.2025, 0.036], { color: '#2a2726', parent: 'body' })
      .box([0.22, 0.012, 0.032], [0, 0.2025, -0.036], { color: '#2a2726', parent: 'body' })
      .box([0.008, 0.11, 0.016], [0.146, 0.12, 0], { color: '#3a3633', parent: 'body' })
      .box([0.034, 0.022, 0.056], [0.163, 0.17, 0], { color: '#2a2726', round: 0.4, name: 'lever', parent: 'body', mover: { kind: 'slide', axis: 'y', amount: -0.09 } })
      .cyl([0.036, 0.016, 0.036], [0.153, 0.062, 0.048], { color: '#2a2726', rot: [0, 0, 90], parent: 'body' })
      .box([0.006, 0.014, 0.004], [0.162, 0.072, 0.048], { color: 'white', parent: 'body', noInk: true })
      .box([0.012, 0.016, 0.026], [0.151, 0.062, -0.048], { color: '#d23a2a', round: 0.3, parent: 'body' })
      .box([0.2, 0.012, 0.006], [0, 0.04, 0.088], { color: '#3a3633', parent: 'body' })
      .socket('slot1', [0, 0.2, 0.036], 'slot', { size: 0.13 })
      .socket('slot2', [0, 0.2, -0.036], 'slot', { size: 0.13 })
      .act({
        setup: [A.spawn('a', 'slice of bread'), A.spawn('b', 'slice of bread'), A.attach('a', 'self', 'slot1'), A.attach('b', 'self', 'slot2')],
        click: [
          [A.operate('lever', 'down'), A.say('Tick tick tick...', 2.5), A.wait(3), A.par(A.morph('toast', 'self.slot1'), A.morph('toast', 'self.slot2')), A.operate('lever', 'up'), A.par(A.anim('hop', 1, 'self.slot1'), A.anim('hop', 1, 'self.slot2'), A.say('Ding!', 1.5))],
          [A.operate('lever', 'down'), A.wait(2.5), A.effect('smoke', { dur: 2 }), A.par(A.morph('burnt toast', 'self.slot1'), A.morph('burnt toast', 'self.slot2')), A.operate('lever', 'up'), A.say('Ding... cough!', 1.5)],
          [A.par(A.remove('self.slot1', 'pop'), A.remove('self.slot2', 'pop')), A.spawn('a', 'slice of bread'), A.spawn('b', 'slice of bread'), A.attach('a', 'self', 'slot1'), A.attach('b', 'self', 'slot2'), A.say('Fresh bread!', 1.5)],
        ],
      })
      .done(),
  ),
  // Act-only props for the toaster: a slice of bread to go in and the burnt toast that comes out.
  x('slice of bread', () => {
    const b = m('slice of bread').box([0.112, 0.088, 0.013], [0, 0.044, 0], { color: '#c98a45', round: 0.35 });
    b.pair((s) => b.ball([0.068, 0.05, 0.013], [s * 0.027, 0.09, 0], { color: '#c98a45' }).ball([0.056, 0.038, 0.0142], [s * 0.027, 0.089, 0], { color: '#f6e6c4', noInk: true }));
    return b.box([0.098, 0.078, 0.0142], [0, 0.046, 0], { color: '#f6e6c4', round: 0.4, noInk: true }).act({ click: [A.anim('hop')] }).done();
  }),
  x('burnt toast', () => {
    const b = m('burnt toast').box([0.112, 0.088, 0.013], [0, 0.044, 0], { color: '#1e1612', round: 0.35 });
    b.pair((s) => b.ball([0.068, 0.05, 0.013], [s * 0.027, 0.09, 0], { color: '#1e1612' }).ball([0.056, 0.038, 0.0142], [s * 0.027, 0.089, 0], { color: '#3a2a1e', noInk: true }));
    return b.box([0.098, 0.078, 0.0142], [0, 0.046, 0], { color: '#3a2a1e', round: 0.4, noInk: true }).act({ click: [A.effect('smoke', { dur: 1.5 })] }).done();
  }),
  // A frosted pastry with sprinkles; its top corner is a piece, so a bite can be taken out of it.
  e('toaster pastry', 'food', 'snacks', () => {
    const dough = '#d9a865', icing = '#f2a6c4';
    const b = m('toaster pastry')
      .box([0.078, 0.078, 0.012], [0, 0.039, 0], { color: dough, round: 0.3, name: 'body' })
      .box([0.048, 0.03, 0.012], [-0.015, 0.093, 0], { color: dough, round: 0.3 })
      .box([0.062, 0.07, 0.0136], [0, 0.044, 0], { color: icing, round: 0.4, noInk: true })
      .box([0.034, 0.022, 0.0136], [-0.014, 0.088, 0], { color: icing, round: 0.4, noInk: true })
      .box([0.03, 0.03, 0.012], [0.024, 0.093, 0], { color: dough, round: 0.3, name: 'corner', parent: 'body', piece: true })
      .box([0.02, 0.022, 0.0136], [0.022, 0.09, 0], { color: icing, round: 0.4, parent: 'corner', noInk: true });
    const sp: Array<[number, number, string]> = [[-0.02, 0.075, 'red'], [0.012, 0.07, 'yellow'], [0.02, 0.045, 'blue'], [-0.016, 0.05, 'lime'], [0.004, 0.028, 'purple'], [-0.022, 0.022, 'orange'], [0.022, 0.02, 'white'], [-0.004, 0.058, 'cyan'], [-0.018, 0.092, 'yellow']];
    sp.forEach(([x0, y, c], i) => b.box([0.011, 0.0035, 0.002], [x0, y, 0.0072], { color: c, noInk: true, rot: [0, 0, i * 47] }));
    return b
      .act({
        click: [
          [A.par(A.pose('corner', { scale: 0, dur: 0.25 }), A.say('Crunch!', 1.2))],
          [A.par(A.pose('corner', { scale: 1, dur: 0.3 }), A.anim('hop'), A.say('Pop!', 1.2))],
        ],
      })
      .done();
  }),
  // The front of a foot: five soft toes with their nails; they wiggle.
  e('toe', 'clinic', 'body parts', () => {
    const b = m('toe').ball([0.112, 0.058, 0.12], [-0.01, 0.03, -0.05], { color: 'skin2', name: 'foot' }).ball([0.09, 0.05, 0.08], [0.0, 0.026, -0.1], { color: 'skin2' });
    const toes: Array<[number, number, number]> = [[0.036, 0.031, 0.048], [0.003, 0.023, 0.036], [-0.02, 0.021, 0.031], [-0.04, 0.019, 0.027], [-0.057, 0.016, 0.022]];
    toes.forEach(([x0, s, len], i) => {
      const z = 0.012 + len / 2 - i * 0.006;
      b.ball([s, s * 0.92, len], [x0, s * 0.46, z], { color: 'skin2', name: `toe${i + 1}`, parent: 'foot', pivot: [x0, s * 0.46, z - len / 2] })
        .ball([s * 0.64, s * 0.2, len * 0.36], [x0, s * 0.9, z + len * 0.2], { color: '#f6d8cf', parent: `toe${i + 1}` });
    });
    const wig = (r: number) => A.par(...toes.map((_, i) => A.pose(`toe${i + 1}`, { rot: [i % 2 ? r * 0.7 : r, 0, 0], dur: 0.18 })));
    return b.act({ click: [wig(-28), wig(6), wig(-28), A.par(wig(0), A.say('Wiggle wiggle!', 1.4))] }).done();
  }),
  // A big toe with its nail; the white tip of the nail is a piece that the clippers snip off.
  e('toenail', 'clinic', 'body parts', () =>
    m('toenail')
      .capsule([0.05, 0.1, 0.046], [-0.005, 0.024, 0], { color: 'skin2', rot: [0, 0, -90], name: 'toe' })
      .ball([0.07, 0.05, 0.06], [-0.055, 0.026, 0], { color: 'skin2' })
      .ball([0.034, 0.008, 0.034], [0.02, 0.047, 0], { color: '#f4cfc6', rot: [0, 0, 12], name: 'nail', parent: 'toe' })
      .ball([0.01, 0.007, 0.03], [0.039, 0.043, 0], { color: '#fbf6ee', rot: [0, 0, 20], name: 'tip', parent: 'nail', piece: true })
      .box([0.06, 0.008, 0.012], [0.01, 0.004, 0.055], { color: 'silver', rot: [0, -12, 0], edge: 'sharp', round: 0.4 })
      .box([0.055, 0.006, 0.012], [0.012, 0.011, 0.058], { color: 'silver', rot: [0, -12, 6], edge: 'sharp', round: 0.4 })
      .act({ click: [[A.say('Snip!', 1.2), A.detach('tip', 'clipping')], [A.reattach('tip'), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // Toffee: a wrapped sweet in twisted gold cellophane (it spins to unwrap) beside broken chunks.
  e('toffee', 'food', 'sweets', () => {
    const b = m('toffee')
      .ball([0.046, 0.028, 0.03], [0, 0.015, 0.03], { color: '#e8b33a', name: 'candy', piece: true })
      .ball([0.034, 0.022, 0.024], [0, 0.017, 0.03], { color: '#f6d877', parent: 'candy', noInk: true });
    b.pair((s) => b.cone([0.026, 0.022, 0.024], [s * 0.033, 0.015, 0.03], { color: '#e8b33a', rot: [0, 0, s * 90], parent: 'candy' }).cyl([0.006, 0.012, 0.012], [s * 0.022, 0.015, 0.03], { color: '#c8901e', rot: [0, 0, 90], parent: 'candy' }));
    b.box([0.03, 0.02, 0.028], [-0.018, 0.01, -0.025], { color: '#a8622a', round: 0.3, rot: [0, 15, 0] })
      .box([0.028, 0.02, 0.03], [0.018, 0.01, -0.028], { color: '#b8733a', round: 0.3, rot: [0, -20, 0] })
      .box([0.026, 0.018, 0.026], [0.0, 0.029, -0.026], { color: '#9a5622', round: 0.3, rot: [8, 40, 4] });
    return b.act({ click: [[A.par(A.pose('candy', { rot: [720, 0, 0], dur: 0.9 }), A.say('Crinkle!', 1.2))], [A.par(A.pose('candy', { rot: [0, 0, 0], dur: 0.9 }), A.anim('hop'), A.say('Chew chew!', 1.2))]] }).done();
  }),
  // A block of silken tofu on a dark plate, two cubes cut off, spring onion on top; the block wobbles.
  e('tofu', 'food', 'ingredients', () =>
    m('tofu')
      .cyl([0.19, 0.014, 0.19], [0, 0.007, 0], { color: '#33333f' })
      .torus([0.19, 0.19, 0.012], [0, 0.016, 0], { color: '#3f3f4c', rot: [90, 0, 0], tube: 0.08 })
      .box([0.09, 0.062, 0.07], [-0.015, 0.045, -0.012], { color: '#f6f1df', round: 0.14, name: 'block', piece: true, pivot: [-0.015, 0.014, -0.012] })
      .box([0.032, 0.03, 0.032], [0.05, 0.029, 0.04], { color: '#f6f1df', round: 0.18, rot: [0, 20, 0] })
      .box([0.032, 0.03, 0.032], [0.012, 0.029, 0.055], { color: '#f2ecd6', round: 0.18, rot: [0, -12, 0] })
      .cyl([0.012, 0.005, 0.012], [-0.03, 0.078, -0.01], { color: 'lime', parent: 'block', noInk: true })
      .cyl([0.012, 0.005, 0.012], [-0.005, 0.078, -0.025], { color: '#5aa553', parent: 'block', noInk: true })
      .cyl([0.012, 0.005, 0.012], [-0.022, 0.078, -0.03], { color: 'lime', parent: 'block', noInk: true })
      .ball([0.03, 0.006, 0.02], [-0.01, 0.077, 0.005], { color: '#6a3a1e', parent: 'block', noInk: true })
      .act({ click: [A.pose('block', { scale: 1.1, dur: 0.12 }), A.pose('block', { scale: 0.93, dur: 0.12 }), A.pose('block', { scale: 1.05, dur: 0.1 }), A.par(A.pose('block', { scale: 1, dur: 0.12 }), A.say('Wibble wobble!', 1.4))] })
      .done(),
  ),
  // A toga draped over a faceless mannequin: one shoulder bare, a purple border, a laurel wreath on the head.
  e('toga', 'wardrobe', 'clothes', () => {
    const b = dummy('toga', { top: 'white', skirt: 'white', skirtW: 0.62, sleeve: 'none' })
      .rod([0.2, 1.47, 0.08], [-0.22, 0.98, 0.13], 0.1, '#f3eee0')
      .rod([0.2, 1.47, -0.08], [-0.22, 0.98, -0.13], 0.1, '#f3eee0')
      .rod([0.22, 1.44, 0.135], [-0.2, 0.95, 0.165], 0.028, 'purple', { noInk: true })
      .rod([-0.18, 0.95, 0.18], [-0.24, 0.1, 0.2], 0.08, '#f3eee0', { name: 'drape' })
      .ball(0.06, [0.21, 1.47, 0.1], { color: 'gold' })
      .torus([0.2, 0.2, 0.035], [0, 1.72, 0], { color: '#5a8a3a', rot: [90, 0, 0], tube: 0.18, name: 'wreath', piece: true });
    b.each(3, (i) => b.rod([-0.05 - i * 0.05, 0.85 - i * 0.2, 0.33], [-0.07 - i * 0.05, 0.25 - i * 0.04, 0.3], 0.02, '#e6dfcc', { noInk: true }));
    return b
      .act({
        click: [
          [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.2 }))],
          [A.par(A.pose('wreath', { move: [0, 0.08, 0], rot: [0, 90, 0], dur: 0.35 }), A.pose('drape', { rot: [0, 0, -8], dur: 0.35 })), A.par(A.pose('wreath', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 }), A.pose('drape', { rot: [0, 0, 0], dur: 0.35 }))],
        ],
      })
      .done();
  }),
  // A close-coupled toilet (0.8 m, seat at 0.42): one moulded ceramic body (soft) that flares from a footed
  // pedestal into an elongated bowl, a deck under the cistern, the cistern with its lid, a chrome flush lever and
  // supply pipe; the plastic seat and lid on chrome hinges (crisp pieces of their own).
  e('toilet', 'home', 'bathroom', () => {
    const b = m('toilet')
      .loft([0.38, 0.52, 0.39], [0, 0.195, 0.06], [[0, 0.6, 0.66, 0.12], [0.1, 0.56, 0.6, 0.12], [0.4, 0.5, 0.56, 0.1], [0.72, 0.88, 0.86, 0], [0.92, 1, 1, -0.02], [1, 0.98, 0.98, -0.02]], { color: 'white', rot: [-90, 0, 0], name: 'bowl' })
      .box([0.3, 0.15, 0.2], [0, 0.33, -0.22], { color: 'white', round: 0.3 })
      .cyl([0.24, 0.006, 0.31], [0, 0.392, 0.09], { color: '#9fd2ee', noInk: true })
      .box([0.46, 0.37, 0.19], [0, 0.6, -0.245], { color: 'white', round: 0.22, name: 'tank' })
      .box([0.485, 0.045, 0.21], [0, 0.807, -0.245], { color: '#f6f6f2', round: 0.35, blend: 0 })
      .stick([-0.15, 0, -0.3], [-0.15, 0.42, -0.3], 0.014, 'silver', { edge: 'sharp' })
      .cyl([0.03, 0.04, 0.03], [-0.15, 0.1, -0.3], { color: 'silver', edge: 'sharp' })
      .cyl([0.04, 0.012, 0.04], [-0.17, 0.73, -0.146], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.085, 0.018, 0.022], [-0.13, 0.73, -0.137], { color: 'silver', edge: 'sharp', round: 0.4, name: 'lever', pivot: [-0.17, 0.73, -0.137], mover: { kind: 'swing', axis: 'z', amount: -30 } });
    // bolt caps either side of the foot, and the seat's two chrome hinges
    b.pair((s) => b.ball([0.03, 0.035, 0.04], [s * 0.112, 0.03, 0.0], { color: 'white' }).cyl([0.03, 0.03, 0.03], [s * 0.08, 0.41, -0.125], { color: 'silver', rot: [0, 0, 90], edge: 'sharp' }));
    return b
      .torus([0.37, 0.45, 0.03], [0, 0.405, 0.095], { color: '#f4f4f0', rot: [90, 0, 0], tube: 0.24, name: 'seat', pivot: [0, 0.405, -0.12], mover: { kind: 'swing', axis: 'x', amount: -94 } })
      .cyl([0.37, 0.022, 0.45], [0, 0.431, 0.095], { color: '#f4f4f0', name: 'lid', pivot: [0, 0.431, -0.115], mover: { kind: 'swing', axis: 'x', amount: -97 } })
      .socket('seat', [0, 0.43, 0.06], 'seat')
      .act({
        click: [
          [A.operate('lid', 'open'), A.wait(0.4), A.operate('lever', 'down'), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Whoooosh!', 1.6)), A.operate('lever', 'up'), A.wait(1), A.operate('lid', 'close')],
          [A.operate('lid', 'open'), A.operate('seat', 'open'), A.wait(1.5), A.operate('seat', 'close'), A.operate('lid', 'close'), A.say('Clonk!', 1)],
        ],
      })
      .done();
  }),
  // A roll on its side with the paper coming off the front; more sheets roll out along the floor, then tear off.
  e('toilet paper', 'home', 'bathroom', () => {
    const b = m('toilet paper')
      .cyl([0.115, 0.1, 0.115], [0, 0.0575, 0], { color: 'white', rot: [0, 0, 90], name: 'roll', piece: true })
      .cyl([0.042, 0.102, 0.042], [0, 0.0575, 0], { color: '#b88a58', rot: [0, 0, 90], parent: 'roll' })
      .cyl([0.032, 0.104, 0.032], [0, 0.0575, 0], { color: '#4a3424', rot: [0, 0, 90], parent: 'roll', noInk: true })
      .box([0.098, 0.05, 0.004], [0, 0.026, 0.057], { color: 'white', edge: 'sharp', round: 0.2 });
    b.box([0.098, 0.0034, 0.002], [0, 0.0015, 0.17], { color: '#d9d4c8', noInk: true });
    ['sheet1', 'sheet2', 'sheet3'].forEach((n, i) => b.box([0.098, 0.003, 0.11], [0, 0.0015, 0.115 + i * 0.111], { color: 'white', edge: 'sharp', round: 0.2, name: n, ...(i ? { scale: 0, pivot: [0, 0.0015, 0.06 + i * 0.111] as V } : {}) }));
    return b
      .act({
        click: [
          [A.par(A.pose('roll', { rot: [-540, 0, 0], dur: 1.2 }), A.pose('sheet2', { scale: 1, dur: 0.4, delay: 0.2 }), A.pose('sheet3', { scale: 1, dur: 0.4, delay: 0.7 }))],
          [A.say('Rrrip!', 1.2), A.par(A.pose('sheet2', { scale: 0, dur: 0.2 }), A.pose('sheet3', { scale: 0, dur: 0.2 }), A.pose('roll', { rot: [0, 0, 0], dur: 0.6 }))],
        ],
      })
      .done();
  }),
  // The cardboard tube left at the end of a roll, spiral seam and all; every child knows it is a trumpet.
  e('toilet roll tube', 'home', 'bathroom', () =>
    m('toilet roll tube')
      .cyl([0.045, 0.1, 0.045], [0, 0.05, 0], { color: '#c39a6b', name: 'tube', piece: true, pivot: [0, 0, 0] })
      .cyl([0.037, 0.004, 0.037], [0, 0.099, 0], { color: '#5c3d20', parent: 'tube', noInk: true })
      .torus([0.046, 0.046, 0.005], [0, 0.1, 0], { color: '#a87f50', rot: [90, 0, 0], tube: 0.1, parent: 'tube', noInk: true })
      .stick([-0.021, 0.004, 0.012], [0.021, 0.096, 0.012], 0.002, '#9a7246', { parent: 'tube', noInk: true })
      .box([0.012, 0.01, 0.003], [0.008, 0.07, 0.0225], { color: 'white', rot: [0, 0, 20], parent: 'tube', noInk: true })
      .act({ click: [A.par(A.pose('tube', { rot: [-75, 0, 0], move: [0, 0.02, 0], dur: 0.3 }), A.say('Toot toot!', 1.5)), A.wait(1), A.pose('tube', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A new seat in its box... out of it: the ring and lid lying flat, chrome hinges at the back.
  e('toilet seat', 'home', 'bathroom', () =>
    m('toilet seat')
      .torus([0.37, 0.45, 0.034], [0, 0.017, 0.02], { color: 'white', rot: [90, 0, 0], tube: 0.24, name: 'seat' })
      .box([0.05, 0.03, 0.05], [0.09, 0.02, -0.215], { color: 'silver', edge: 'sharp' })
      .box([0.05, 0.03, 0.05], [-0.09, 0.02, -0.215], { color: 'silver', edge: 'sharp' })
      .cyl([0.36, 0.022, 0.44], [0, 0.045, 0.02], { color: '#f4f4f0', name: 'lid', pivot: [0, 0.045, -0.2], mover: { kind: 'swing', axis: 'x', amount: -95, on: true } })
      .act({ click: [A.operate('lid', 'close'), A.say('Clack!', 1), A.wait(1.2), A.operate('lid', 'open')] })
      .done(),
  ),
  // The fluffy pink cover over a seat's lid, with a fringe; the lid lifts with it.
  e('toilet seat cover', 'home', 'bathroom', () =>
    m('toilet seat cover')
      .torus([0.37, 0.45, 0.034], [0, 0.017, 0.02], { color: 'white', rot: [90, 0, 0], tube: 0.24 })
      .box([0.05, 0.03, 0.05], [0.09, 0.02, -0.215], { color: 'silver', edge: 'sharp' })
      .box([0.05, 0.03, 0.05], [-0.09, 0.02, -0.215], { color: 'silver', edge: 'sharp' })
      .cyl([0.36, 0.022, 0.44], [0, 0.045, 0.02], { color: '#f4f4f0', name: 'lid', pivot: [0, 0.045, -0.2], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .ball([0.39, 0.05, 0.47], [0, 0.07, 0.02], { color: '#f4a1c0', parent: 'lid' })
      .torus([0.39, 0.47, 0.02], [0, 0.058, 0.02], { color: '#f7c3d6', rot: [90, 0, 0], tube: 0.1, parent: 'lid' })
      .heart(0.09, [0, 0.096, 0.06], { color: '#e05a8a', rot: [-90, 0, 0], parent: 'lid' })
      .act({ click: [A.operate('lid', 'open'), A.say('Fwump!', 1.2), A.wait(1.2), A.operate('lid', 'close')] })
      .done(),
  ),
  // A brush in its pot; it comes out, scrubs and goes back.
  e('toiletbrush', 'home', 'bathroom', () =>
    m('toiletbrush')
      .cyl([0.118, 0.012, 0.118], [0, 0.006, 0], { color: 'lightgray' })
      .cyl([0.11, 0.17, 0.11], [0, 0.092, 0], { color: 'white', taper: 0.88 })
      .torus([0.1, 0.1, 0.014], [0, 0.177, 0], { color: 'lightgray', rot: [90, 0, 0], tube: 0.18 })
      .stick([0, 0.12, 0], [0, 0.4, 0], 0.018, 'white', { name: 'brush', piece: true })
      .ball(0.032, [0, 0.405, 0], { color: 'skyblue', parent: 'brush' })
      .cyl([0.075, 0.07, 0.075], [0, 0.085, 0], { color: '#8a9096', parent: 'brush' })
      .act({
        click: [
          A.pose('brush', { move: [0, 0.22, 0.03], dur: 0.4 }),
          A.pose('brush', { move: [0, 0.22, 0.03], rot: [0, 0, 20], dur: 0.15 }),
          A.pose('brush', { move: [0, 0.22, 0.03], rot: [0, 0, -20], dur: 0.15 }),
          A.par(A.pose('brush', { move: [0, 0.22, 0.03], rot: [0, 0, 20], dur: 0.15 }), A.say('Scrub scrub!', 1.4)),
          A.pose('brush', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }),
        ],
      })
      .done(),
  ),
  // A toll plaza island: a booth with windows all round and a door at the back, a canopy on two pillars, a striped
  // barrier arm across the lane that lifts, and a stop/go light.
  e('toll booth', 'places', 'roadside', () => {
    const b = m('toll booth', { edge: 'sharp' })
      .box([1.6, 0.22, 7], [0, 0.11, 0], { color: '#c9c3b6', round: 0.1 })
      .box([1.62, 0.23, 0.4], [0, 0.11, 3.32], { color: 'yellow' })
      .box([1.62, 0.23, 0.4], [0, 0.11, -3.32], { color: 'yellow' })
      .box([1.4, 2.3, 2.0], [0, 1.37, 0], { color: 'white', round: 0.05 })
      .box([1.5, 0.18, 2.1], [0, 2.6, 0], { color: '#d23a2a', round: 0.1 })
      .box([1.42, 0.3, 2.02], [0, 0.37, 0], { color: '#d23a2a', round: 0.05 });
    win(b, 1.0, 0.95, [0, 1.75, 1.0], 'front', '#d23a2a', { bars: false });
    win(b, 1.5, 0.95, [0.7, 1.75, 0], 'left', '#d23a2a', { bars: false, sill: false });
    win(b, 1.5, 0.95, [-0.7, 1.75, 0], 'right', '#d23a2a', { bars: false, sill: false });
    door(b, 'door', 0.75, 2.0, [0, 0.22, -1.0], 'white', { face: 'back', frame: '#d23a2a', glass: true });
    b.label('PAY TOLL', [1.0, 0.24], [0, 2.32, 1.02], { color: 'white', depth: 0.03 });
    b.pair((s) => b.box([0.35, 4.9, 0.35], [0, 2.67, s * 2.8], { color: '#9da3a8' }));
    b.box([10, 0.7, 4.2], [0, 5.45, 0], { color: 'white', round: 0.05 })
      .box([10.06, 0.32, 4.26], [0, 5.3, 0], { color: '#2f4f8f', round: 0.05 })
      .label('TOLL PLAZA', [3.4, 0.5], [0, 5.45, 2.14], { color: 'white', depth: 0.03 });
    b.pair((s) => b.box([1.6, 0.04, 0.6], [s * 3, 5.08, 0], { color: '#fff6c8', glow: true }));
    b.box([0.3, 1.0, 0.3], [0.62, 0.72, 1.6], { color: '#3a3633' })
      .box([3.3, 0.1, 0.1], [2.3, 1.12, 1.6], { color: 'white', round: 0.4, name: 'barrier', pivot: [0.62, 1.12, 1.6], mover: { kind: 'swing', axis: 'z', amount: 80 } });
    b.each(4, (i) => b.box([0.4, 0.106, 0.106], [1.05 + i * 0.8, 1.12, 1.6], { color: '#d23a2a', parent: 'barrier' }));
    b.stick([0.5, 0.22, 2.9], [0.5, 2.6, 2.9], 0.1, '#5c6166')
      .box([0.3, 0.62, 0.24], [0.5, 2.85, 2.9], { color: '#2a2726', round: 0.2 })
      .ball(0.16, [0.5, 2.99, 3.03], { color: '#e0473b', glow: true, name: 'stop', mover: { kind: 'light', on: true } })
      .ball(0.16, [0.5, 2.71, 3.03], { color: '#5ad65a', glow: true, name: 'go', mover: { kind: 'light', on: false } })
      .cyl([0.4, 0.3, 0.4], [0.72, 1.05, 0.55], { color: 'yellow', taper: 1.4 })
      .stick([0.72, 0.22, 0.55], [0.72, 0.9, 0.55], 0.08, '#5c6166');
    return b
      .act({
        click: [[A.par(A.operate('stop', 'off'), A.operate('go', 'on'), A.operate('barrier', 'up'), A.say('Beep! Thank you.', 1.8)), A.wait(3), A.par(A.operate('barrier', 'down'), A.operate('go', 'off'), A.operate('stop', 'on'))]],
      })
      .done();
  }),
  // A throwing axe at its real 0.5 m: a flared steel bit (sharp), a pipe-bowl poll, a leather grip and feathers.
  e('tomahawk', 'armory', 'axes', () =>
    m('tomahawk', { view: 'side' })
      .stick([0, 0, 0], [0, 0.52, 0], 0.03, 'wood')
      .cyl([0.036, 0.14, 0.036], [0, 0.1, 0], { color: 'leather' })
      .cyl([0.04, 0.006, 0.04], [0, 0.17, 0], { color: '#5a3a22', noInk: true })
      .cyl([0.044, 0.05, 0.044], [0, 0.47, 0], { color: 'iron', edge: 'sharp' })
      .box([0.014, 0.05, 0.08], [0, 0.465, 0.055], { color: 'steel', edge: 'sharp', round: 0.2 })
      .box([0.01, 0.11, 0.035], [0, 0.465, 0.105], { color: '#c9ccd1', edge: 'sharp', round: 0.45 })
      .cyl([0.032, 0.04, 0.032], [0, 0.5, -0.035], { color: 'iron', edge: 'sharp', taper: 1.3 })
      .rod([0, 0.42, -0.018], [0, 0.34, -0.035], 0.006, 'brown')
      .ball([0.012, 0.07, 0.008], [0, 0.3, -0.04], { color: 'white' })
      .ball([0.012, 0.06, 0.008], [0.01, 0.31, -0.034], { color: '#c0392b' })
      .act({ click: [[A.par(A.anim('spin'), A.say('Whoosh!', 1.2))], [A.par(A.anim('shake'), A.say('Thunk!', 1.2))]] })
      .done(),
  ),
  // A ripe tomato with its green star of sepals; a slice comes off to show the seeds.
  e('tomato', 'food', 'vegetables', () => {
    const b = m('tomato').loft([0.082, 0.068, 0.066], [-0.008, 0.034, 0], [[0, 0.3, 0.3], [0.1, 0.62, 0.6], [0.3, 0.88, 0.86], [0.62, 1, 1], [0.85, 0.94, 0.94], [1, 0.79, 0.79]], { color: '#e23a2c', rot: [0, 90, 0], name: 'body' })
      .cyl([0.06, 0.003, 0.05], [0.0255, 0.034, 0], { color: '#f2a080', rot: [0, 0, 90], noInk: true })
      .cyl([0.016, 0.0035, 0.014], [0.0257, 0.034, 0], { color: '#f8d0b8', rot: [0, 0, 90], noInk: true });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.ball([0.012, 0.006, 0.03], [Math.cos(a) * 0.012, 0.069, Math.sin(a) * 0.012], { color: '#4f9a3a', rot: [0, -a / DEG + 90, 0], parent: 'body' });
    });
    return b
      .stick([0, 0.066, 0], [0.003, 0.085, 0], 0.006, '#3f7a3a', { parent: 'body' })
      .dome([0.054, 0.016, 0.064], [0.034, 0.034, 0], { color: '#e23a2c', rot: [0, 0, -90], name: 'slice', parent: 'body', piece: true })
      .cyl([0.05, 0.003, 0.058], [0.0265, 0.034, 0], { color: '#f2a080', rot: [0, 0, 90], parent: 'slice', noInk: true })
      .act({ click: [[A.detach('slice', 'bit')], [A.reattach('slice')]] })
      .done();
  }),
  // A tall glass of tomato juice with a celery stick that stirs and a lemon wedge on the rim.
  e('tomato juice', 'food', 'drinks', () =>
    m('tomato juice')
      .cyl([0.07, 0.12, 0.07], [0, 0.064, 0], { color: '#c8302a', taper: 1.12 })
      .cyl([0.074, 0.008, 0.074], [0, 0.004, 0], { color: 'glass' })
      .cyl([0.08, 0.03, 0.08], [0, 0.138, 0], { color: 'glass', taper: 1.04 })
      .cyl([0.076, 0.004, 0.076], [0, 0.125, 0], { color: '#a8241e', noInk: true })
      .stick([0.008, 0.06, 0], [0.026, 0.21, 0.01], 0.013, '#9bd36a', { name: 'celery', piece: true, pivot: [0, 0.06, 0] })
      .ball([0.04, 0.03, 0.03], [0.03, 0.218, 0.012], { color: '#5aa553', parent: 'celery' })
      .wedge([0.03, 0.022, 0.02], [-0.04, 0.155, 0.0], { color: '#f6e04a', rot: [0, 0, 180] })
      .act({ click: [[A.par(A.pose('celery', { rot: [0, 720, 0], dur: 1.2 }), A.say('Clink clink!', 1.3))], [A.par(A.pose('celery', { rot: [0, 0, 0], dur: 0.6 }), A.say('Slurp!', 1.2))]] })
      .done(),
  ),
  // A tomato plant in a terracotta pot inside a wire cage: green fruit that ripens red, and one ripe one to pick.
  e('tomato plant', 'garden', 'vegetable plants', () => {
    const b = m('tomato plant')
      .cyl([0.34, 0.3, 0.34], [0, 0.15, 0], { color: TERRA, taper: 1.2 })
      .cyl([0.43, 0.06, 0.43], [0, 0.32, 0], { color: TERRA })
      .cyl([0.38, 0.02, 0.38], [0, 0.345, 0], { color: 'dirt' });
    [0.62, 0.95, 1.28].forEach((y, i) => b.torus([0.4 + i * 0.06, 0.4 + i * 0.06, 0.012], [0, y, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.04, edge: 'sharp' }));
    for (const [x0, z0] of around(3, 0.19, 0.4)) b.stick([x0 * 0.9, 0.34, z0 * 0.9], [x0 * 1.35, 1.3, z0 * 1.35], 0.012, '#9da3a8', { edge: 'sharp' });
    b.rod([0, 0.34, 0], [-0.03, 0.7, 0.02], 0.03, '#4f8a3a', { name: 'stem' }).rod([-0.03, 0.7, 0.02], [0.03, 1.02, 0], 0.026, '#4f8a3a').rod([0.03, 1.02, 0], [-0.01, 1.36, 0.02], 0.022, '#4f8a3a')
      .rod([-0.03, 0.62, 0.02], [-0.2, 0.78, 0.06], 0.016, '#4f8a3a').rod([0.02, 0.92, 0], [0.2, 1.04, 0.06], 0.016, '#4f8a3a').rod([-0.01, 1.15, 0.01], [-0.18, 1.24, -0.04], 0.014, '#4f8a3a');
    const leaves: Array<[number, number, number, number, string]> = [[-0.2, 0.8, 0.05, 0.22, 'leaf'], [0.21, 1.06, 0.05, 0.22, 'leaf'], [-0.02, 1.38, 0.02, 0.2, '#4e9448'], [0.1, 0.55, -0.05, 0.18, '#4e9448'], [-0.17, 1.24, -0.05, 0.18, 'leaf'], [0.12, 0.8, -0.12, 0.16, '#4e9448'], [-0.12, 1.0, -0.1, 0.17, 'leaf']];
    for (const [x0, y, z0, s, c] of leaves) b.ball([s, s * 0.5, s * 0.75], [x0, y, z0], { color: c });
    const fruit: V[] = [[-0.17, 0.7, 0.13], [-0.08, 0.66, 0.15], [0.19, 0.96, 0.13], [0.06, 0.52, 0.12], [0.02, 1.13, 0.12], [-0.15, 1.16, 0.1]];
    fruit.forEach((p, i) => b.ball(0.06, p, { color: '#8cc04a' }).ball(0.066, p, { color: '#e23a2c', name: `ripe${i + 1}`, scale: 0 }));
    return b
      .ball(0.068, [0.13, 0.86, 0.15], { color: '#e23a2c', name: 'pick', parent: 'stem', piece: true })
      .act({
        click: [
          [A.par(...fruit.map((_, i) => A.pose(`ripe${i + 1}`, { scale: 1, dur: 0.6, delay: i * 0.15 })), A.effect('sparkle', { dur: 1.5 }))],
          [A.say('Plop!', 1), A.detach('pick', 'picked')],
          [A.reattach('pick'), A.par(...fruit.map((_, i) => A.pose(`ripe${i + 1}`, { scale: 0, dur: 0.4 })))],
        ],
      })
      .done();
  }),
  // A small stone mausoleum: steps, two columns, a pediment, an iron door that creaks open, lanterns either side.
  e('tomb', 'places', 'graveyard', () => {
    const b = m('tomb', { edge: 'sharp' })
      .box([3.6, 0.2, 4.2], [0, 0.1, 0.1], { color: '#9a9a92', round: 0.1 })
      .box([3.2, 0.2, 0.5], [0, 0.3, 2.0], { color: '#a7a7a0', round: 0.1 })
      .box([3.0, 0.2, 3.6], [0, 0.3, -0.05], { color: '#a7a7a0', round: 0.1 })
      .box([2.8, 2.4, 3.0], [0, 1.6, -0.3], { color: '#c4c2b8', round: 0.04 })
      .box([3.1, 0.25, 3.5], [0, 2.9, -0.05], { color: '#a7a7a0', round: 0.1 });
    b.wedge([3.2, 0.9, 3.6], [0, 3.47, -0.05], { color: '#b8b6ac' });
    b.box([1.0, 1.9, 0.12], [0, 1.35, 1.22], { color: '#2e3135', round: 0.05 })
      .box([0.92, 1.82, 0.06], [0, 1.31, 1.27], { color: '#3a3f44', name: 'door', pivot: [0.46, 1.31, 1.27], mover: { kind: 'swing', axis: 'y', amount: 85 } });
    b.each(5, (i) => b.box([0.03, 1.7, 0.04], [-0.32 + i * 0.16, 1.31, 1.31], { color: '#55595e', parent: 'door' }));
    b.ball(0.07, [-0.36, 1.25, 1.33], { color: 'iron', parent: 'door' })
      .label('REST IN PEACE', [1.6, 0.26], [0, 2.6, 1.22], { color: '#c4c2b8', depth: 0.03 });
    b.pair((s) => {
      b.cyl([0.36, 2.3, 0.36], [s * 1.2, 1.55, 1.45], { color: '#e0ded4', edge: 'soft' })
        .box([0.5, 0.15, 0.5], [s * 1.2, 0.47, 1.45], { color: '#d4d2c8' })
        .box([0.5, 0.15, 0.5], [s * 1.2, 2.77, 1.45], { color: '#d4d2c8' })
        .box([0.22, 0.32, 0.22], [s * 1.75, 1.75, 1.32], { color: '#2a2726', round: 0.2 })
        .ball(0.14, [s * 1.75, 1.75, 1.32], { color: '#ffcf6a', glow: true, name: s > 0 ? 'lanternL' : 'lanternR', mover: { kind: 'light', on: false } });
    });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Creeeak...', 2), A.effect('smoke', { dur: 2.5 })), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('lantern', 'on'), A.say('Hoooo...', 1.6), A.wait(2), A.operate('lantern', 'off')],
        ],
      })
      .done();
  }),
  // A 1920s submachine gun at its real 0.85 m, lying on its side: finned barrel, front grip, drum magazine, stock.
  e('tommy gun', 'armory', 'guns', () => {
    const b = m('tommy gun', { view: 'side', edge: 'sharp' })
      .box([0.05, 0.075, 0.3], [0, 0.2, -0.02], { color: '#3a3f44', round: 0.15 })
      .cyl([0.022, 0.34, 0.022], [0, 0.215, 0.3], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.022, 0.03, 0.022], [0, 0.215, 0.475], { color: 'iron', rot: [90, 0, 0] })
      .box([0.034, 0.04, 0.03], [0, 0.23, 0.46], { color: 'iron' })
      .cyl([0.21, 0.06, 0.21], [0, 0.108, 0.07], { color: '#2e3135', rot: [0, 0, 90], name: 'drum' })
      .cyl([0.06, 0.064, 0.06], [0, 0.108, 0.07], { color: '#55595e', rot: [0, 0, 90], parent: 'drum' })
      .box([0.04, 0.09, 0.045], [0, 0.13, 0.27], { color: 'wood', rot: [-12, 0, 0], round: 0.4, edge: 'soft' })
      .box([0.036, 0.11, 0.05], [0, 0.13, -0.12], { color: 'wood', rot: [18, 0, 0], round: 0.4, edge: 'soft' })
      .box([0.03, 0.04, 0.06], [0, 0.16, -0.06], { color: '#3a3f44', round: 0.3 })
      .box([0.042, 0.08, 0.26], [0, 0.18, -0.29], { color: 'wood', rot: [-7, 0, 0], round: 0.3, edge: 'soft' })
      .box([0.046, 0.13, 0.04], [0, 0.155, -0.42], { color: 'darkwood', round: 0.3 });
    b.each(7, (i) => b.cyl([0.03, 0.008, 0.03], [0, 0.215, 0.17 + i * 0.022], { color: '#55595e', rot: [90, 0, 0] }));
    return b.act({ click: [A.par(A.anim('shake'), A.effect('smoke', { dur: 1.2 }), A.pose('drum', { rot: [720, 0, 0], dur: 1.2 }), A.say('Rat-a-tat-tat!', 1.5))] }).done();
  }),
  // Spring kitchen tongs standing on their scalloped heads, hanging loop up: they snap open and shut.
  e('tongs', 'kitchen', 'utensils', () => {
    const b = m('tongs', { edge: 'sharp' }).torus([0.05, 0.05, 0.026], [0, 0.272, 0], { color: 'silver', tube: 0.3 }).box([0.03, 0.02, 0.02], [0, 0.25, 0], { color: 'silver' });
    b.pair((s) => {
      const n = s > 0 ? 'armL' : 'armR';
      b.box([0.012, 0.23, 0.022], [s * 0.017, 0.135, 0], { color: 'silver', rot: [0, 0, s * 6], round: 0.3, name: n, pivot: [0, 0.25, 0] })
        .box([0.016, 0.08, 0.026], [s * 0.01, 0.2, 0], { color: '#2a2726', rot: [0, 0, s * 6], round: 0.5, parent: n, edge: 'soft' })
        .box([0.014, 0.035, 0.032], [s * 0.03, 0.02, 0], { color: 'silver', round: 0.3, parent: n });
    });
    const snap = (r: number) => A.par(A.pose('armL', { rot: [0, 0, r], dur: 0.12 }), A.pose('armR', { rot: [0, 0, -r], dur: 0.12 }));
    return b.act({ click: [snap(9), snap(0), snap(9), A.par(snap(0), A.say('Clack clack!', 1.2))] }).done();
  }),
  // A tongue poking out between lips: it wags and goes "blep".
  e('tongue', 'clinic', 'body parts', () =>
    m('tongue')
      .ball([0.085, 0.05, 0.03], [0, 0.085, -0.004], { color: '#4a1414' })
      .torus([0.12, 0.08, 0.036], [0, 0.085, 0.004], { color: '#d24a5c', tube: 0.3 })
      .ball([0.056, 0.085, 0.024], [0, 0.05, 0.03], { color: '#f07a8a', rot: [35, 0, 0], name: 'tongue', piece: true, pivot: [0, 0.075, 0.01] })
      .stick([0, 0.07, 0.034], [0, 0.025, 0.06], 0.004, '#d05a6a', { parent: 'tongue', noInk: true })
      .act({ click: [A.pose('tongue', { rot: [0, 0, 16], dur: 0.15 }), A.pose('tongue', { rot: [0, 0, -16], dur: 0.15 }), A.pose('tongue', { rot: [0, 0, 16], dur: 0.15 }), A.par(A.pose('tongue', { rot: [0, 0, 0], dur: 0.15 }), A.say('Blehh!', 1.2))] })
      .done(),
  ),
  // A green bottle of tonic water (its cap pops) beside a glass with ice and lime.
  e('tonic', 'food', 'drinks', () =>
    m('tonic')
      .cyl([0.068, 0.15, 0.068], [-0.045, 0.075, 0], { color: '#7fbf8f', name: 'bottle' })
      .cyl([0.068, 0.04, 0.068], [-0.045, 0.17, 0], { color: '#7fbf8f', taper: 0.42 })
      .cyl([0.028, 0.05, 0.028], [-0.045, 0.214, 0], { color: '#7fbf8f' })
      .cyl([0.032, 0.014, 0.032], [-0.045, 0.245, 0], { color: 'gold', name: 'cap', parent: 'bottle', piece: true, edge: 'sharp' })
      .label('TONIC', [0.06, 0.06], [-0.045, 0.08, 0.034], { color: 'white', depth: 0.004 })
      .cyl([0.07, 0.1, 0.07], [0.05, 0.05, 0.03], { color: 'glass', taper: 1.08 })
      .cyl([0.068, 0.004, 0.068], [0.05, 0.09, 0.03], { color: '#e8f4f8', noInk: true })
      .box([0.025, 0.022, 0.025], [0.04, 0.092, 0.025], { color: 'ice', rot: [10, 30, 0], edge: 'sharp', round: 0.3 })
      .box([0.022, 0.02, 0.022], [0.062, 0.094, 0.04], { color: 'ice', rot: [-8, 10, 12], edge: 'sharp', round: 0.3 })
      .cyl([0.045, 0.01, 0.045], [0.07, 0.1, 0.01], { color: 'lime', rot: [80, 0, 0] })
      .act({ click: [[A.say('Pop! Fizzz...', 1.6), A.detach('cap', 'cap'), A.effect('sparkle', { dur: 1.5 })], [A.reattach('cap')]] })
      .done(),
  ),
  // A red steel cantilever toolbox: the lid swings up on its back hinge to show the tray of tools.
  e('toolbox', 'workshop', 'tool storage', () => {
    const b = m('toolbox', { edge: 'sharp' })
      .box([0.5, 0.2, 0.24], [0, 0.105, 0], { color: '#d23a2a', round: 0.12, name: 'body' })
      .box([0.46, 0.012, 0.2], [0, 0.2, 0], { color: '#5c6166' })
      .capsule([0.026, 0.2, 0.026], [-0.08, 0.214, 0.03], { color: 'yellow', rot: [0, 0, 90] })
      .box([0.16, 0.012, 0.03], [0.1, 0.212, -0.04], { color: 'silver', rot: [0, 20, 0], round: 0.4 })
      .box([0.51, 0.06, 0.25], [0, 0.24, 0], { color: '#a3322a', round: 0.2, name: 'lid', pivot: [0, 0.21, -0.125], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .stick([-0.13, 0.325, 0], [0.13, 0.325, 0], 0.026, '#2a2726', { parent: 'lid' })
      .socket('tray', [0, 0.21, 0], 'inside', { size: 0.3 });
    b.pair((s) => b.stick([s * 0.12, 0.27, 0], [s * 0.12, 0.33, 0], 0.018, '#2a2726', { parent: 'lid' }).box([0.04, 0.05, 0.02], [s * 0.17, 0.205, 0.125], { color: 'silver' }).box([0.03, 0.06, 0.08], [s * 0.255, 0.12, 0], { color: '#2a2726' }));
    return b.act({ click: [A.operate('lid', 'open'), A.say('Clank!', 1.2), A.wait(2), A.operate('lid', 'close')] }).done();
  }),
  // A molar at its real 3 cm: a soft white crown with four cusps and two roots; it shines, then wobbles loose.
  e('tooth', 'clinic', 'dental', () => {
    const b = m('tooth').box([0.022, 0.014, 0.02], [0, 0.022, 0], { color: 'white', round: 0.8 });
    b.pair((s) => b.ball([0.011, 0.009, 0.01], [s * 0.005, 0.03, 0.005], { color: 'white' }).ball([0.011, 0.009, 0.01], [s * 0.005, 0.03, -0.005], { color: 'white' }).cone([0.009, 0.018, 0.012], [s * 0.006, 0.008, 0], { color: '#f4efe2', rot: [180, 0, s * -8] }));
    return b.act({ click: [[A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ting!', 1.2))], [A.par(A.anim('wobble'), A.say('Wiggle...', 1.2))]] }).done();
  }),
  // A toothbrush standing in a glass beaker: rubber grip, white and teal bristles with a dab of paste; it hops
  // out and scrubs.
  e('toothbrush', 'home', 'bathroom', () =>
    m('toothbrush')
      .cyl([0.075, 0.1, 0.075], [0, 0.05, 0], { color: 'glass', taper: 1.1 })
      .cyl([0.06, 0.004, 0.06], [0, 0.099, 0], { color: '#7fb5d9', noInk: true })
      .capsule([0.014, 0.15, 0.011], [0.012, 0.11, 0], { color: '#4e8fd6', rot: [0, 0, -8], name: 'brush', piece: true, pivot: [0.012, 0.04, 0] })
      .capsule([0.017, 0.06, 0.013], [0.007, 0.07, 0], { color: '#a8d8f5', rot: [0, 0, -8], parent: 'brush' })
      .box([0.012, 0.03, 0.007], [0.022, 0.19, 0.002], { color: '#4e8fd6', rot: [0, 0, -8], round: 0.5, parent: 'brush' })
      .box([0.011, 0.028, 0.014], [0.023, 0.192, 0.011], { color: 'white', rot: [0, 0, -8], round: 0.2, parent: 'brush' })
      .box([0.0115, 0.01, 0.0145], [0.022, 0.185, 0.011], { color: '#3fa7a0', rot: [0, 0, -8], round: 0.2, parent: 'brush', noInk: true })
      .capsule([0.009, 0.026, 0.009], [0.024, 0.193, 0.021], { color: '#f2f6fb', rot: [0, 0, -8], parent: 'brush' })
      .act({ click: [A.pose('brush', { move: [0.05, 0.1, 0.03], rot: [0, 0, 20], dur: 0.3 }), A.pose('brush', { move: [0.05, 0.12, 0.03], rot: [0, 0, -10], dur: 0.15 }), A.pose('brush', { move: [0.05, 0.1, 0.03], rot: [0, 0, 20], dur: 0.15 }), A.par(A.pose('brush', { move: [0.05, 0.12, 0.03], rot: [0, 0, -10], dur: 0.15 }), A.effect('sparkle', { dur: 1 }), A.say('Brush brush!', 1.3)), A.pose('brush', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 })] })
      .done(),
  ),
  // A tube of toothpaste lying down, crimped at the back, cap off beside it: a squeeze and a stripe comes out.
  e('toothpaste', 'home', 'bathroom', () =>
    m('toothpaste')
      .loft([0.05, 0.036, 0.16], [-0.02, 0.018, 0], [[0, 1, 0.12], [0.15, 0.95, 0.55], [0.5, 0.88, 0.9], [0.9, 0.78, 1], [1, 0.72, 0.92]], { color: 'white', rot: [0, 90, 0], name: 'tube' })
      .box([0.051, 0.006, 0.012], [-0.098, 0.018, 0], { color: '#d9d4c8', rot: [0, 90, 0] })
      .loft([0.0505, 0.0365, 0.07], [-0.02, 0.018, 0], [[0, 0.88, 0.9], [1, 0.84, 0.95]], { color: '#4e8fd6', rot: [0, 90, 0], parent: 'tube', noInk: true })
      .label('MINT', [0.04, 0.012], [-0.02, 0.0365, 0], { color: '#4e8fd6', rot: [-90, 0, 0], depth: 0.002, parent: 'tube' })
      .cyl([0.028, 0.012, 0.028], [0.066, 0.018, 0], { color: 'white', rot: [0, 0, -90], taper: 0.6 })
      .cyl([0.012, 0.012, 0.012], [0.077, 0.018, 0], { color: 'white', rot: [0, 0, 90] })
      .cyl([0.024, 0.018, 0.024], [0.07, 0.012, 0.045], { color: '#e0473b', edge: 'sharp' })
      .capsule([0.011, 0.05, 0.011], [0.105, 0.012, 0], { color: '#f2f6fb', rot: [0, 0, 90], name: 'paste', scale: 0, pivot: [0.082, 0.016, 0] })
      .act({
        click: [
          [A.par(A.pose('tube', { scale: 0.92, dur: 0.3 }), A.pose('paste', { scale: 1, dur: 0.6 }), A.say('Squish!', 1.2))],
          [A.par(A.pose('tube', { scale: 1, dur: 0.3 }), A.pose('paste', { scale: 0, dur: 0.3 }))],
        ],
      })
      .done(),
  ),
  // A pot of wooden toothpicks; one pokes up, ready to pick.
  e('toothpick', 'kitchen', 'utensils', () => {
    const b = m('toothpick').cyl([0.04, 0.05, 0.04], [0, 0.025, 0], { color: '#3fa7a0' }).cyl([0.032, 0.002, 0.032], [0, 0.05, 0], { color: '#1a4a4a', noInk: true });
    for (const [x0, z] of around(7, 0.01)) b.stick([x0, 0.03, z], [x0 * 2.4, 0.092, z * 2.4], 0.0025, '#e8d2a0');
    return b.stick([0, 0.03, 0], [0.002, 0.1, 0], 0.0025, '#e8d2a0', { name: 'pick', piece: true })
      .act({ click: [A.par(A.pose('pick', { move: [0, 0.04, 0], dur: 0.25 }), A.say('Pop!', 1)), A.wait(0.8), A.pose('pick', { move: [0, 0, 0], dur: 0.25 })] })
      .done();
  }),
  // A black silk top hat at its real 18 cm: a crown a little wider at the top, a red band, a curled brim. A
  // rabbit comes out of it.
  e('top hat', 'wardrobe', 'hats', () =>
    m('top hat')
      .cyl([0.32, 0.012, 0.28], [0, 0.006, 0], { color: '#1e1c1c' })
      .torus([0.32, 0.28, 0.02], [0, 0.014, 0], { color: '#1e1c1c', rot: [90, 0, 0], tube: 0.08 })
      .cyl([0.175, 0.17, 0.155], [0, 0.097, 0], { color: '#2a2726', taper: 1.07 })
      .cyl([0.188, 0.005, 0.166], [0, 0.183, 0], { color: '#3a3636' })
      .cyl([0.179, 0.036, 0.159], [0, 0.032, 0], { color: '#a3322a' })
      .socket('crown', [0, 0.185, 0], 'top', { size: 0.3 })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Abracadabra!', 1.5)), A.spawn('bunny', 'rabbit', { rel: 'on', of: 'self' }), A.wait(2.5), A.remove('bunny', 'pop')], [A.par(A.anim('spin'), A.say('Ta-da!', 1.2))]] })
      .done(),
  ),
  // A torch (flashlight) standing on its tail: ribbed grip, a slide switch, a reflector head and a lens that lights.
  e('torch', 'tech', 'gadgets', () => {
    const b = m('torch', { edge: 'sharp' })
      .cyl([0.04, 0.2, 0.04], [0, 0.1, 0], { color: '#f6d24a' })
      .cyl([0.043, 0.02, 0.043], [0, 0.01, 0], { color: '#2a2726' })
      .cyl([0.04, 0.06, 0.04], [0, 0.23, 0], { color: '#2a2726', taper: 1.8 })
      .cyl([0.076, 0.03, 0.076], [0, 0.275, 0], { color: '#2a2726' })
      .cyl([0.064, 0.006, 0.064], [0, 0.292, 0], { color: '#fff7c0', glow: true, name: 'lamp', mover: { kind: 'light', on: false } })
      .box([0.014, 0.026, 0.01], [0, 0.15, 0.021], { color: '#2a2726', name: 'switch', mover: { kind: 'slide', axis: 'y', amount: 0.012 } });
    b.each(4, (i) => b.cyl([0.042, 0.006, 0.042], [0, 0.04 + i * 0.016, 0], { color: '#2a2726', noInk: true }));
    return b.act({ click: [A.par(A.operate('switch'), A.operate('lamp'), A.say('Click!', 1))] }).done();
  }),
  // A torpedo at its real 6.5 m on two cradles: a rounded warhead, a steel body, cross fins and twin propellers
  // that spin up.
  e('torpedo', 'armory', 'military', () => {
    const b = m('torpedo', { view: 'side', edge: 'sharp' })
      .loft([0.53, 0.53, 6.4], [0, 1.0, 0], [[0, 0.3, 0.3], [0.06, 0.7, 0.7], [0.14, 1, 1], [0.86, 1, 1], [0.95, 0.85, 0.85], [1, 0.25, 0.25]], { color: '#8f99a3', name: 'body', edge: 'soft' })
      .cyl([0.545, 0.14, 0.545], [0, 1.0, 1.8], { color: '#d23a2a', rot: [90, 0, 0] })
      .cyl([0.545, 0.05, 0.545], [0, 1.0, 0.4], { color: '#5c6166', rot: [90, 0, 0], noInk: true })
      .cyl([0.545, 0.05, 0.545], [0, 1.0, -1.4], { color: '#5c6166', rot: [90, 0, 0], noInk: true })
      .label('MK 14', [0.5, 0.14], [0, 1.0, 0.95], { color: '#8f99a3', rot: [0, 90, 0], depth: 0.003 })
      .box([0.03, 0.62, 0.32], [0, 1.0, -2.95], { color: '#5c6166' })
      .box([0.62, 0.03, 0.32], [0, 1.0, -2.95], { color: '#5c6166' })
      .cyl([0.06, 0.3, 0.06], [0, 1.0, -3.25], { color: 'brass', rot: [90, 0, 0] })
      .box([0.07, 0.42, 0.03], [0, 1.0, -3.3], { color: 'brass', rot: [0, 0, 45], name: 'propA', pivot: [0, 1.0, -3.3], mover: { kind: 'spin', axis: 'z', amount: 900 } })
      .box([0.42, 0.07, 0.03], [0, 1.0, -3.3], { color: 'brass', rot: [0, 0, 45], parent: 'propA' })
      .box([0.06, 0.36, 0.03], [0, 1.0, -3.38], { color: 'brass', name: 'propB', pivot: [0, 1.0, -3.38], mover: { kind: 'spin', axis: 'z', amount: -900 } })
      .box([0.36, 0.06, 0.03], [0, 1.0, -3.38], { color: 'brass', parent: 'propB' });
    b.pair((s) => b.box([0.9, 0.12, 0.3], [0, 0.06, s * 1.6], { color: '#3a3f44' }).box([0.12, 0.62, 0.25], [0.32, 0.4, s * 1.6], { color: '#3a3f44' }).box([0.12, 0.62, 0.25], [-0.32, 0.4, s * 1.6], { color: '#3a3f44' }).arc([0.75, 0.75, 0.25], [0, 0.95, s * 1.6], { color: '#3a3f44', arc: 140, rot: [0, 0, 180], tube: 0.18 }));
    return b.act({ click: [[A.operate('prop', 'on'), A.say('Whirrrr!', 1.8)], [A.operate('prop', 'off'), A.say('Whrr... clunk.', 1.4)]] }).done();
  }),
  // A stack of soft flour tortillas with toasty spots; the top one flips.
  e('tortilla', 'food', 'bread', () => {
    const b = m('tortilla').cyl([0.24, 0.012, 0.24], [0, 0.006, 0], { color: '#33333f' });
    b.each(4, (i) => b.cyl([0.232, 0.006, 0.232], [i % 2 ? 0.003 : -0.003, 0.016 + i * 0.0065, 0], { color: i % 2 ? '#efd9a6' : '#e6cc92' }));
    b.cyl([0.232, 0.006, 0.232], [0.004, 0.044, 0.002], { color: '#f0dcaa', name: 'upper', piece: true });
    for (const [x0, z] of around(7, 0.065)) b.cyl([0.02, 0.0065, 0.016], [x0, 0.0445, z], { color: '#b8864a', parent: 'upper', noInk: true });
    return b.act({ click: [A.par(A.pose('upper', { move: [0, 0.08, 0], rot: [0, 0, 90], dur: 0.25 })), A.par(A.pose('upper', { move: [0, 0, 0], rot: [0, 0, 180], dur: 0.25 }), A.say('Flip!', 1))] }).done();
  }),
  // A canvas tote with long handles and a printed heart, a baguette and leaves poking out of the top.
  e('tote bag', 'wardrobe', 'bags', () => {
    const b = m('tote bag')
      .box([0.38, 0.4, 0.1], [0, 0.2, 0], { color: '#efe4c8', round: 0.12, name: 'bag' })
      .heart(0.12, [0, 0.2, 0.052], { color: '#d23a2a', noInk: true })
      .capsule([0.05, 0.36, 0.05], [0.1, 0.4, -0.01], { color: '#d9a35f', rot: [0, 0, -12] })
      .ball([0.1, 0.08, 0.05], [-0.1, 0.42, 0.0], { color: '#6ab04c' })
      .ball([0.08, 0.07, 0.04], [-0.05, 0.43, -0.02], { color: '#5aa553' })
      .socket('inside', [0, 0.32, 0], 'inside', { size: 0.3 });
    b.pair((s) => b.arc([0.22, 0.34, 0.016], [0, 0.4, s * 0.035], { color: '#d9c9a2', arc: 180, tube: 0.08 }));
    return b.act({ click: [A.par(A.pose('bag', { rot: [0, 0, 6], dur: 0.2 })), A.pose('bag', { rot: [0, 0, -6], dur: 0.2 }), A.par(A.pose('bag', { rot: [0, 0, 0], dur: 0.2 }), A.say('Rustle rustle!', 1.3))] }).done();
  }),
  // A hairpiece on a head form; a gust lifts it like a lid and it flops back.
  e('toupee', 'wardrobe', 'hairpieces', () =>
    headForm('toupee')
      .ball([0.15, 0.055, 0.17], [0, 0.338, -0.005], { color: '#6b4226', name: 'piece', piece: true, pivot: [0, 0.33, -0.08] })
      .ball([0.07, 0.035, 0.06], [0.03, 0.35, 0.07], { color: '#6b4226', rot: [0, 0, -20], parent: 'piece' })
      .ball([0.04, 0.06, 0.05], [0.07, 0.3, -0.01], { color: '#4a2e1a' })
      .ball([0.04, 0.06, 0.05], [-0.07, 0.3, -0.01], { color: '#4a2e1a' })
      .act({ click: [A.par(A.pose('piece', { rot: [-50, 0, 0], move: [0, 0.03, 0], dur: 0.25 }), A.say('Whoosh!', 1.2)), A.wait(0.6), A.pose('piece', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.say('Flop.', 1)] })
      .done(),
  ),
  // A wrecker at real size (8 m, cab roof 2.7 m): bonnet, cab with doors and windows, a roof light bar, side tool
  // lockers, a boom that lifts with its hook and chain, a wheel lift, and three axles.
  e('tow truck', 'garage', 'trucks', () => {
    const Y = '#f2c230';
    const b = m('tow truck', { view: 'side', edge: 'sharp' })
      .box([0.9, 0.3, 7.4], [0, 0.8, -0.15], { color: '#3a3633' })
      .box([2.3, 0.3, 0.24], [0, 0.82, 3.78], { color: 'silver', round: 0.3 })
      .box([2.2, 0.85, 1.5], [0, 1.35, 3.0], { color: Y, round: 0.15 })
      .box([1.5, 0.62, 0.05], [0, 1.3, 3.77], { color: '#3a3633' })
      .box([2.3, 1.55, 1.9], [0, 1.95, 1.3], { color: Y, round: 0.08 })
      .box([2.0, 0.75, 0.06], [0, 2.3, 2.26], { color: 'glass' })
      .box([1.6, 0.16, 0.32], [0, 2.82, 1.4], { color: '#3a3633' })
      .box([1.5, 0.16, 0.3], [0, 2.95, 1.4], { color: '#f0923b', glow: true, name: 'beacon', mover: { kind: 'light', on: false } })
      .stick([1.05, 1.2, 0.3], [1.05, 3.15, 0.3], 0.12, 'silver')
      .box([2.3, 0.25, 4.1], [0, 1.05, -1.65], { color: '#5c6166' })
      .box([0.7, 0.5, 0.7], [0, 1.45, -1.2], { color: '#3a3633' })
      .box([0.34, 0.34, 3.4], [0, 2.55, -2.4], { color: '#d23a2a', rot: [34, 0, 0], round: 0.1, name: 'boom', pivot: [0, 1.6, -1.2], mover: { kind: 'swing', axis: 'x', amount: 16 } })
      .stick([0, 3.45, -3.82], [0, 1.85, -3.82], 0.04, '#2a2726', { parent: 'boom' })
      .arc([0.26, 0.26, 0.06], [0, 1.75, -3.82], { color: 'iron', arc: 270, rot: [0, 0, 180], tube: 0.25, parent: 'boom' })
      .box([1.3, 0.12, 0.12], [0, 0.5, -4.05], { color: '#2a2726' })
      .box([0.16, 0.12, 0.85], [0, 0.6, -3.65], { color: '#2a2726' });
    b.each(4, (i) => b.box([1.42, 0.035, 0.03], [0, 1.12 + i * 0.12, 3.8], { color: 'silver', noInk: true }));
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.ball([0.28, 0.24, 0.08], [s * 0.82, 1.32, 3.77], { color: '#fff6c8', glow: true })
        .box([0.2, 0.12, 0.05], [s * 0.82, 1.62, 3.76], { color: '#f0923b', glow: true })
        .arc([1.3, 1.3, 0.4], [s * 1.0, 0.55, 2.7], { color: Y, arc: 170, rot: [0, 90, 0], tube: 0.12 })
        .box([0.06, 1.35, 1.15], [s * 1.165, 1.8, 1.45], { color: Y, round: 0.1, name: n, pivot: [s * 1.165, 1.8, 2.02], mover: { kind: 'swing', axis: 'y', amount: -s * 70 } })
        .box([0.04, 0.6, 0.95], [s * 1.2, 2.25, 1.47], { color: 'glass', parent: n })
        .box([0.04, 0.05, 0.16], [s * 1.2, 1.75, 1.15], { color: 'silver', parent: n })
        .stick([s * 1.16, 2.3, 2.15], [s * 1.38, 2.3, 2.15], 0.04, '#2a2726')
        .box([0.08, 0.36, 0.2], [s * 1.42, 2.3, 2.15], { color: '#2a2726', round: 0.3 })
        .box([0.55, 0.85, 3.2], [s * 0.88, 1.6, -1.45], { color: Y, round: 0.06 })
        .box([0.02, 0.7, 1.4], [s * 1.16, 1.6, -0.75], { color: '#d8a820', noInk: true })
        .box([0.02, 0.7, 1.4], [s * 1.16, 1.6, -2.2], { color: '#d8a820', noInk: true })
        .box([0.2, 0.14, 0.05], [s * 0.95, 1.05, -3.72], { color: '#e0473b', glow: true });
    });
    b.label('24H TOWING', [2.2, 0.32], [1.17, 2.13, -1.45], { color: '#2a2726', rot: [0, 90, 0], depth: 0.02 });
    axle2(b, 'F', 1.0, 0.34, 2.0, 2.7);
    axle2(b, 'M', 1.0, 0.34, 1.96, -1.25);
    axle2(b, 'B', 1.0, 0.34, 1.96, -2.5);
    return b
      .socket('seat', [0.5, 1.6, 1.3], 'seat')
      .act({
        click: [
          [A.par(A.operate('beacon', 'on'), A.say('Honk honk!', 1.5)), A.operate('boom', 'up'), A.wait(2), A.operate('boom', 'down'), A.operate('beacon', 'off')],
          [A.operate('doorL', 'open'), A.wait(1.8), A.operate('doorL', 'close'), A.say('Slam!', 1)],
        ],
      })
      .done();
  }),
  // A stack of fluffy folded towels; the top one shakes out and folds back.
  e('towel', 'home', 'bathroom', () => {
    const b = m('towel');
    ['#a8d8f5', '#f4a1c0', 'white'].forEach((c, i) => b.box([0.42, 0.1, 0.3], [0, 0.05 + i * 0.105, 0], { color: c, round: 0.5, rot: [0, i * 4 - 4, 0] }).box([0.425, 0.018, 0.305], [0, 0.08 + i * 0.105, 0], { color: i === 2 ? '#2f4f8f' : 'white', round: 0.5, rot: [0, i * 4 - 4, 0], noInk: true }));
    b.box([0.42, 0.1, 0.3], [0, 0.365, 0], { color: '#f6d24a', round: 0.5, rot: [0, 6, 0], name: 'upper', piece: true, pivot: [0, 0.32, -0.15] })
      .box([0.425, 0.018, 0.305], [0, 0.395, 0], { color: 'white', round: 0.5, rot: [0, 6, 0], parent: 'upper', noInk: true });
    return b.act({ click: [A.pose('upper', { rot: [-80, 0, 0], move: [0, 0.1, 0], dur: 0.3 }), A.par(A.pose('upper', { rot: [-60, 0, 8], move: [0, 0.1, 0], dur: 0.15 }), A.say('Flap!', 1)), A.pose('upper', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.35 })] }).done();
  }),
  // A free-standing chrome towel rail 1 m tall with a towel over the top bar; the towel slips off and goes back.
  e('towel rack', 'home', 'bathroom', () => {
    const b = m('towel rack', { edge: 'sharp' })
      .stick([-0.35, 0.95, 0], [0.35, 0.95, 0], 0.025, 'silver', { name: 'rail' })
      .stick([-0.35, 0.55, 0], [0.35, 0.55, 0], 0.022, 'silver')
      .capsule([0.08, 0.52, 0.08], [0, 0.955, 0], { color: '#3fa7a0', rot: [0, 0, 90], name: 'towel', parent: 'rail', piece: true, edge: 'soft' })
      .box([0.52, 0.4, 0.035], [0, 0.76, 0.03], { color: '#3fa7a0', round: 0.4, parent: 'towel', edge: 'soft' })
      .box([0.52, 0.32, 0.035], [0, 0.8, -0.03], { color: '#3fa7a0', round: 0.4, parent: 'towel', edge: 'soft' })
      .box([0.525, 0.04, 0.04], [0, 0.6, 0.03], { color: 'white', parent: 'towel', noInk: true });
    b.pair((s) => b.stick([s * 0.35, 0.02, 0], [s * 0.35, 1.0, 0], 0.03, 'silver').stick([s * 0.35, 0.015, -0.16], [s * 0.35, 0.015, 0.16], 0.03, 'silver').ball(0.04, [s * 0.35, 1.0, 0], { color: 'silver' }));
    return b.act({ click: [[A.say('Flop!', 1), A.detach('towel', 'fallen towel')], [A.reattach('towel'), A.say('Swish!', 1)]] }).done();
  }),
  // A round stone castle tower 17 m tall: battlements on a corbelled parapet, arrow slits, an arched door, a flag.
  e('tower', 'places', 'landmarks', () => {
    const b = m('tower', { edge: 'sharp' })
      .cyl([6.8, 0.7, 6.8], [0, 0.35, 0], { color: '#8f8c86', segs: 16 })
      .cyl([6, 14, 6], [0, 7.6, 0], { color: '#b8b4a8', taper: 0.95, segs: 16 })
      .cyl([6.7, 0.6, 6.7], [0, 14.6, 0], { color: '#a7a7a0', taper: 1.08, segs: 16 })
      .cyl([6.9, 1.2, 6.9], [0, 15.5, 0], { color: '#b8b4a8', segs: 16 });
    [4, 8.5, 12].forEach((y) => b.cyl([6.06 - y * 0.017, 0.18, 6.06 - y * 0.017], [0, y, 0], { color: '#a19d92', segs: 16, noInk: true }));
    around(12, 3.2, Math.PI / 12).forEach(([x0, z]) => b.box([1.0, 0.95, 0.5], [x0, 16.55, z], { color: '#b8b4a8', rot: [0, -Math.atan2(z, x0) / DEG + 90, 0] }));
    door(b, 'door', 1.3, 2.5, [0, 0.7, 2.98], '#7a5230', { frame: '#8f8c86', hinge: 1 });
    b.arc([1.66, 1.4, 0.3], [0, 3.25, 2.99], { color: '#8f8c86', arc: 180, tube: 0.16 })
      .box([2.2, 0.35, 1.0], [0, 0.17, 3.6], { color: '#8f8c86' });
    for (const [a, y] of [[0, 6.5], [0, 10.5], [70, 8.5], [-70, 8.5], [150, 6], [-150, 11]] as Array<[number, number]>) {
      const r = 2.96 - y * 0.0085;
      b.box([0.28, 1.3, 0.12], [Math.sin(a * DEG) * r, y, Math.cos(a * DEG) * r], { color: '#2e3135', rot: [0, a, 0] });
    }
    return b
      .stick([0, 16, 0], [0, 21.5, 0], 0.12, '#55595e')
      .box([1.8, 1.1, 0.04], [0.92, 20.8, 0], { color: '#c0392b', name: 'flag', pivot: [0.02, 20.8, 0], piece: true })
      .star(0.6, [0.92, 20.8, 0.03], { color: 'gold', parent: 'flag' })
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Creeeak...', 1.6)), A.wait(2.2), A.operate('door', 'close')],
          [A.par(A.pose('flag', { rot: [0, 30, 0], dur: 0.3 }), A.say('Ta-ra-ra!', 1.6)), A.pose('flag', { rot: [0, -25, 0], dur: 0.3 }), A.pose('flag', { rot: [0, 20, 0], dur: 0.3 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A two-storey town hall 20 m wide: a columned portico with a pediment, double doors, rows of tall windows, a hip
  // roof and a clock tower with a copper dome; the clock's hands race round while the bell rings.
  e('town hall', 'places', 'civic buildings', () => {
    const b = m('town hall', { edge: 'sharp' })
      .box([20.4, 0.8, 10.4], [0, 0.4, 0], { color: '#a7a7a0', round: 0.05 })
      .box([20, 8.6, 10], [0, 5.1, 0], { color: '#efe6cf', round: 0.02 })
      .box([20.2, 0.3, 10.2], [0, 4.7, 0], { color: '#d9cfb4', noInk: true })
      .box([20.6, 0.5, 10.6], [0, 9.6, 0], { color: 'white', round: 0.1 })
      .pyramid([29.4, 2.4, 15.3], [0, 11.05, 0], 4, { color: '#55595e', taper: 0.35 });
    b.each(3, (i) => b.box([8.4 - i * 0.4, 0.27, 0.6], [0, 0.135 + i * 0.27, 6.4 - i * 0.5], { color: '#bdbab0' }));
    b.each(4, (i) => b.cyl([0.72, 6.6, 0.72], [-3 + i * 2, 4.1, 5.9], { color: 'white', edge: 'soft' }).box([0.95, 0.3, 0.95], [-3 + i * 2, 0.95, 5.9], { color: '#e6e1d4' }));
    b.box([8.6, 0.9, 1.9], [0, 7.85, 5.75], { color: 'white', round: 0.05 })
      .wedge([9.0, 2.2, 2.0], [0, 9.4, 5.7], { color: '#f2ecdc' })
      .label('TOWN HALL', [5.2, 0.6], [0, 7.85, 6.72], { color: 'white', depth: 0.04 })
      .ball([1.2, 1.2, 0.2], [0, 9.0, 6.72], { color: '#2f4f8f' });
    door(b, 'doorL', 1.2, 3.2, [0.6, 0.8, 5.0], '#7a5230', { hinge: 1 });
    door(b, 'doorR', 1.2, 3.2, [-0.6, 0.8, 5.0], '#7a5230', { hinge: -1 });
    b.arc([2.4, 2.4, 0.08], [0, 4.0, 5.05], { color: 'glass', arc: 180, tube: 0.5 });
    for (const x0 of [-8, -5.5, 5.5, 8]) for (const y of [2.9, 6.9]) win(b, 1.3, 2.1, [x0, y, 5.0], 'front', 'white', { bars: false });
    for (const z of [-2.5, 2.5]) for (const y of [2.9, 6.9]) win(b, 1.3, 2.1, [10, y, z], 'left', 'white', { bars: false }).box([0.05, 2.1, 1.3], [-10.04, y, z], { color: 'glass' });
    b.box([4.2, 6.4, 4.2], [0, 13.2, -0.5], { color: '#efe6cf' })
      .box([4.6, 0.4, 4.6], [0, 16.6, -0.5], { color: 'white' })
      .cyl([2.7, 0.15, 2.7], [0, 13.8, 1.62], { color: 'white', rot: [90, 0, 0] })
      .torus([2.9, 2.9, 0.2], [0, 13.8, 1.66], { color: '#2a2726', tube: 0.08 })
      .box([0.16, 0.85, 0.06], [0, 14.1, 1.74], { color: '#2a2726', name: 'hourHand', pivot: [0, 13.8, 1.74] })
      .box([0.1, 1.15, 0.06], [0, 14.3, 1.78], { color: '#2a2726', name: 'minuteHand', pivot: [0, 13.8, 1.78] })
      .ball(0.2, [0, 13.8, 1.82], { color: 'gold' })
      .cyl([3.2, 1.8, 3.2], [0, 17.7, -0.5], { color: '#efe6cf', segs: 8 })
      .dome([3.8, 2.4, 3.8], [0, 19.8, -0.5], { color: '#4fa08a', edge: 'soft' })
      .stick([0, 20.8, -0.5], [0, 23, -0.5], 0.1, '#55595e')
      .ball(0.4, [0, 21.3, -0.5], { color: 'gold' });
    b.pair((s) => b.box([0.6, 1.0, 0.1], [s * 0.9, 17.7, 1.0], { color: '#3a3633' }).stick([s * 4.7, 0.8, 6.7], [s * 4.7, 3.4, 6.7], 0.12, '#2a2726').ball(0.45, [s * 4.7, 3.6, 6.7], { color: '#fff1c0', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: false } }));
    return b
      .act({
        click: [
          [A.par(A.pose('minuteHand', { rot: [0, 0, -1440], dur: 3 }), A.pose('hourHand', { rot: [0, 0, -360], dur: 3 }), A.say('Dong! Dong! Dong!', 3)), A.par(A.pose('minuteHand', { rot: [0, 0, 0], dur: 0 }), A.pose('hourHand', { rot: [0, 0, 0], dur: 0 }))],
          [A.par(A.operate('doorL', 'open'), A.operate('doorR', 'open'), A.operate('lamp', 'on')), A.wait(2.5), A.par(A.operate('doorL', 'close'), A.operate('doorR', 'close'), A.operate('lamp', 'off'))],
        ],
      })
      .done();
  }),
  // Three terraced houses in a row, three storeys each: stoops, front doors, sash windows (some light up),
  // cornices, one shared slate roof with chimneys.
  e('townhouse', 'places', 'houses', () => {
    const b = m('townhouse', { edge: 'sharp' });
    const units: Array<[string, string]> = [['#b5543c', '#2f4f8f'], ['#efe2c0', '#3f7a3a'], ['#9fb8c8', '#a3322a']];
    units.forEach(([wall, dc], i) => {
      const x0 = (i - 1) * 5;
      b.box([5, 9.5, 9], [x0, 4.75, 0], { color: wall, round: 0.02 })
        .box([5.04, 0.3, 9.1], [x0, 9.35, 0], { color: 'white' })
        .box([5.04, 0.6, 9.04], [x0, 0.3, 0], { color: '#8a8a84' })
        .box([1.7, 0.3, 1.4], [x0 - 1.2, 0.15, 5.2], { color: '#bdbab0' })
        .box([1.7, 0.3, 0.9], [x0 - 1.2, 0.45, 4.95], { color: '#bdbab0' })
        .box([1.4, 0.25, 0.6], [x0 - 1.2, 3.0, 4.8], { color: 'white' });
      door(b, `door${i + 1}`, 1.0, 2.2, [x0 - 1.2, 0.6, 4.5], dc, { hinge: -1 });
      win(b, 1.3, 1.8, [x0 + 1.1, 2.0, 4.5], 'front', 'white', { bars: false });
      win(b, 1.1, 1.7, [x0 - 1.2, 5.0, 4.5], 'front', 'white', { bars: false });
      win(b, 1.1, 1.7, [x0 + 1.1, 5.0, 4.5], 'front', 'white', { bars: false });
      win(b, 1.1, 1.4, [x0 - 1.2, 7.9, 4.5], 'front', 'white', { bars: false });
      win(b, 1.1, 1.4, [x0 + 1.1, 7.9, 4.5], 'front', 'white', { bars: false });
      b.box([1.0, 1.6, 0.03], [x0 + 1.1, 5.0, 4.56], { color: '#ffe39a', glow: true, name: `light${i + 1}`, mover: { kind: 'light', on: false } });
    });
    gable(b, 15, 9, 9.5, 2.8, '#4a4f55', 0.3);
    b.pair((s) => b.box([0.8, 2.2, 0.9], [s * 2.5, 11.4, -1.0], { color: '#9a5a3a' }).cyl([0.22, 0.4, 0.22], [s * 2.5 + 0.15, 12.7, -1.0], { color: TERRA }).cyl([0.22, 0.4, 0.22], [s * 2.5 - 0.15, 12.7, -1.0], { color: TERRA }));
    return b
      .act({
        click: [
          [A.operate('door2', 'open'), A.say('Knock knock!', 1.5), A.wait(2), A.operate('door2', 'close')],
          [A.operate('light1', 'on'), A.wait(0.4), A.operate('light3', 'on'), A.wait(0.4), A.operate('light2', 'on'), A.wait(2), A.par(A.operate('light1', 'off'), A.operate('light2', 'off'), A.operate('light3', 'off'))],
        ],
      })
      .done();
  }),
  // A painted wooden toy chest on bun feet: the lid lifts on its back hinge to show a ball and blocks inside.
  e('toy chest', 'toys', 'toy boxes', () => {
    const b = m('toy chest', { edge: 'sharp' })
      .box([0.8, 0.44, 0.46], [0, 0.29, 0], { color: '#4e8fd6', round: 0.08 })
      .box([0.82, 0.05, 0.48], [0, 0.07, 0], { color: '#f6d24a', round: 0.3 })
      .ball(0.18, [-0.18, 0.44, -0.02], { color: '#e0473b', edge: 'soft' })
      .box([0.12, 0.12, 0.12], [0.15, 0.45, 0.05], { color: '#5aa553', rot: [0, 20, 0] })
      .box([0.12, 0.12, 0.12], [0.24, 0.44, -0.08], { color: '#f6d24a', rot: [0, -10, 0] })
      .box([0.83, 0.1, 0.49], [0, 0.56, 0], { color: '#e0473b', round: 0.3, name: 'lid', pivot: [0, 0.51, -0.245], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .label('TOYS', [0.36, 0.14], [0, 0.3, 0.235], { color: '#f6d24a', depth: 0.01 })
      .star(0.11, [0.3, 0.3, 0.235], { color: 'gold', noInk: true })
      .star(0.11, [-0.3, 0.3, 0.235], { color: 'gold', noInk: true })
      .socket('inside', [0, 0.35, 0], 'inside', { size: 0.6 });
    for (const [x0, z] of [[0.35, 0.18], [-0.35, 0.18], [0.35, -0.18], [-0.35, -0.18]]) b.ball(0.08, [x0, 0.04, z], { color: '#f6d24a', edge: 'soft' });
    b.pair((s) => b.box([0.05, 0.04, 0.1], [s * 0.42, 0.42, 0], { color: '#2a2726' }));
    return b.act({ click: [A.operate('lid', 'open'), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ta-da!', 1.3)), A.wait(1.5), A.operate('lid', 'close')] }).done();
  }),
  // A toy shop 8 m wide: display windows full of toys (a teddy, a rocking horse, blocks), a striped awning, a big
  // TOYS sign with a pinwheel, and a giant teddy on the roof who nods.
  e('toy store', 'places', 'shops', () => {
    const b = shopFront('toy store', { w: 8.5, h: 5.2, d: 6, wall: '#f6d24a', trim: 'white', sign: 'TOYS', signC: '#e0473b', awning: ['#e0473b', 'white'], doorC: '#4e8fd6' });
    const z = 2.85;
    b.ball([0.55, 0.6, 0.4], [-2.6, 1.05, z], { color: '#a0662c', edge: 'soft' }).ball(0.36, [-2.6, 1.6, z], { color: '#a0662c', edge: 'soft' })
      .pair((s) => b.ball(0.15, [-2.6 + s * 0.16, 1.82, z], { color: '#a0662c', edge: 'soft' }))
      .box([0.4, 0.4, 0.4], [-1.6, 0.8, z - 0.1], { color: '#e0473b' }).box([0.35, 0.35, 0.35], [-1.6, 1.18, z - 0.1], { color: '#4e8fd6', rot: [0, 25, 0] })
      .ball(0.45, [1.6, 0.85, z], { color: '#5aa553', edge: 'soft' })
      .box([0.8, 0.45, 0.25], [2.65, 1.2, z], { color: 'white', round: 0.4 }).box([0.25, 0.4, 0.25], [3.0, 1.55, z], { color: 'white', round: 0.4 })
      .arc([1.1, 0.4, 0.1], [2.65, 0.8, z], { color: '#e0473b', arc: 140, rot: [0, 0, 180] });
    b.ball([1.6, 1.4, 1.0], [0, 6.0, -1.0], { color: '#a0662c', edge: 'soft', name: 'teddy', pivot: [0, 5.3, -1.0] })
      .ball(1.2, [0, 7.1, -0.9], { color: '#a0662c', parent: 'teddy', edge: 'soft' })
      .ball([0.55, 0.42, 0.35], [0, 6.95, -0.35], { color: '#d9b98a', parent: 'teddy', edge: 'soft' })
      .ball(0.16, [0, 7.05, -0.2], { color: '#2a2726', parent: 'teddy' })
      .pair((s) => b.ball(0.5, [s * 0.5, 7.65, -0.95], { color: '#a0662c', parent: 'teddy', edge: 'soft' }).ball(0.13, [s * 0.25, 7.3, -0.4], { color: '#2a2726', parent: 'teddy' }));
    b.stick([3.5, 4.6, 3.18], [3.5, 5.6, 3.18], 0.05, '#55595e');
    b.each(4, (i) => b.wedge([0.4, 0.42, 0.02], [3.5 + Math.sin(i * Math.PI / 2) * 0.18, 5.8 + Math.cos(i * Math.PI / 2) * 0.18, 3.22], { color: ['#e0473b', '#f6d24a', '#4e8fd6', '#5aa553'][i], rot: [0, 0, -i * 90], ...(i ? { parent: 'fan1' } : { name: 'fan1', pivot: [3.5, 5.8, 3.22] as V }) }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5), A.wait(2), A.operate('door', 'close')],
          [A.pose('teddy', { rot: [0, 0, 12], dur: 0.3 }), A.pose('teddy', { rot: [0, 0, -12], dur: 0.3 }), A.par(A.pose('teddy', { rot: [0, 0, 0], dur: 0.3 }), A.say('Squeak!', 1.2))],
        ],
      })
      .done();
  }),
  // A tracksuit on a mannequin: white stripes down arms and legs, a collar and a zip pull that runs down and up.
  e('tracksuit', 'wardrobe', 'sportswear', () => {
    const b = dummy('tracksuit', { top: '#2f4f8f', legs: '#2f4f8f', shoes: 'white' })
      .stick([0, 1.0, 0.128], [0, 1.48, 0.128], 0.012, '#c9ccd1', { noInk: true })
      .torus([0.2, 0.08, 0.1], [0, 1.5, 0], { color: '#2f4f8f', rot: [90, 0, 0] })
      .box([0.025, 0.04, 0.012], [0, 1.44, 0.135], { color: 'silver', name: 'zip', mover: { kind: 'slide', axis: 'y', amount: -0.3 }, edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.3, 1.43, 0], [s * 0.35, 0.94, 0], 0.025, 'white', { noInk: true }).rod([s * 0.175, 0.95, 0], [s * 0.175, 0.15, 0], 0.025, 'white', { noInk: true }));
    return b.act({ click: [A.par(A.operate('zip', 'out'), A.say('Zzzip!', 1)), A.wait(0.8), A.par(A.operate('zip', 'in'), A.say('Zzzip!', 1))] }).done();
  }),
  // A farm tractor 2.8 m tall: 1.7 m treaded rear wheels under arched fenders, small steering front wheels, a long
  // bonnet with a grille and an exhaust stack, an open cab on four posts with a seat and a steering wheel.
  e('tractor', 'garage', 'farm vehicles', () => {
    const G = '#3f8a3a';
    const b = m('tractor', { view: 'side', edge: 'sharp' })
      .box([0.75, 0.5, 3.0], [0, 0.95, 0.4], { color: '#3a3633' })
      .box([0.95, 0.85, 1.9], [0, 1.45, 1.25], { color: G, round: 0.18 })
      .box([0.9, 0.7, 0.06], [0, 1.4, 2.21], { color: '#3a3633' })
      .box([1.0, 0.6, 1.2], [0, 1.25, -0.55], { color: G, round: 0.1 })
      .box([1.7, 0.1, 1.0], [0, 1.58, -0.55], { color: '#3a3633' })
      .box([0.55, 0.12, 0.5], [0, 1.85, -0.6], { color: '#3a3633', round: 0.4, edge: 'soft' })
      .box([0.55, 0.55, 0.1], [0, 2.1, -0.88], { color: '#3a3633', round: 0.4, rot: [-10, 0, 0], edge: 'soft' })
      .stick([0, 1.6, 0.0], [0, 2.1, 0.35], 0.05, '#3a3633')
      .torus([0.42, 0.42, 0.04], [0, 2.12, 0.38], { color: '#2a2726', rot: [60, 0, 0], tube: 0.12 })
      .box([1.75, 0.1, 1.75], [0, 3.0, -0.4], { color: G, round: 0.3 })
      .box([1.5, 0.95, 0.04], [0, 2.4, 0.45], { color: 'glass' })
      .stick([0.38, 1.85, 1.6], [0.38, 2.75, 1.6], 0.12, '#2a2726')
      .cyl([0.16, 0.08, 0.16], [0.38, 2.78, 1.6], { color: '#2a2726' })
      .box([0.05, 0.3, 0.06], [0, 1.15, 2.25], { color: '#f6d24a' })
      .box([1.2, 0.12, 0.2], [0, 0.75, -1.45], { color: '#3a3633' });
    b.pair((s) => {
      b.stick([s * 0.82, 1.6, 0.45], [s * 0.82, 3.0, 0.45], 0.07, '#2a2726').stick([s * 0.82, 1.6, -1.25], [s * 0.82, 3.0, -1.25], 0.07, '#2a2726')
        .arc([2.0, 2.0, 0.62], [s * 0.98, 0.85, -0.6], { color: G, arc: 150, rot: [0, 90, 0], tube: 0.05 })
        .ball([0.18, 0.14, 0.06], [s * 0.32, 1.55, 2.24], { color: '#fff6c8', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light', on: false } })
        .box([0.12, 0.1, 0.05], [s * 0.86, 2.9, -1.3], { color: '#e0473b', glow: true });
      const name = `wheelR${s > 0 ? 'L' : 'R'}`, at: V = [s * 0.98, 0.85, -0.6];
      wheel(b, name, 1.7, 0.55, at, '#f6d24a');
      lugs(b, name, 1.7, 0.55, at, 10);
    });
    axle2(b, 'F', 0.95, 0.3, 1.5, 1.7, '#f6d24a');
    return b
      .socket('seat', [0, 1.95, -0.55], 'seat')
      .act({
        click: [
          [A.par(A.effect('smoke', { dur: 2.5 }), A.anim('shake'), A.say('Putt-putt-putt!', 2))],
          [A.operate('light', 'on'), A.say('Beep beep!', 1.2), A.wait(2), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A holographic trading card in a little clear stand; it flips to show its back.
  e('trading card', 'toys', 'cards', () =>
    m('trading card', { edge: 'sharp' })
      .box([0.08, 0.014, 0.04], [0, 0.007, 0], { color: 'glass', round: 0.3 })
      .box([0.066, 0.092, 0.002], [0, 0.06, 0], { color: '#e2b23a', round: 0.2, name: 'card', pivot: [0, 0.06, 0] })
      .box([0.056, 0.048, 0.0024], [0, 0.072, 0], { color: '#a8d8f5', parent: 'card', noInk: true })
      .star(0.03, [0, 0.072, 0.0015], { color: '#e0473b', parent: 'card', noInk: true })
      .box([0.056, 0.022, 0.0024], [0, 0.032, 0], { color: 'cream', parent: 'card', noInk: true })
      .box([0.04, 0.004, 0.003], [0, 0.036, 0], { color: 'gray', parent: 'card', noInk: true })
      .box([0.04, 0.004, 0.003], [0, 0.028, 0], { color: 'gray', parent: 'card', noInk: true })
      .box([0.062, 0.088, 0.0012], [0, 0.06, -0.0012], { color: '#2f4f8f', parent: 'card', noInk: true })
      .act({ click: [[A.par(A.pose('card', { rot: [0, 180, 0], dur: 0.5 }), A.effect('sparkle', { dur: 1 }))], [A.pose('card', { rot: [0, 360, 0], dur: 0.5 }), A.pose('card', { rot: [0, 0, 0], dur: 0 })]] })
      .done(),
  ),
  // A road-works drum 1 m tall: orange with reflective white bands, a heavy black base, a flashing amber lamp.
  e('traffic barrel', 'workshop', 'road works', () =>
    m('traffic barrel')
      .cyl([0.66, 0.08, 0.66], [0, 0.04, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.52, 0.9, 0.52], [0, 0.53, 0], { color: '#f0782a', taper: 0.85 })
      .cyl([0.508, 0.1, 0.508], [0, 0.36, 0], { color: 'white', taper: 0.98 })
      .cyl([0.48, 0.1, 0.48], [0, 0.64, 0], { color: 'white', taper: 0.98 })
      .cyl([0.36, 0.06, 0.36], [0, 1.0, 0], { color: '#f0782a' })
      .box([0.08, 0.1, 0.06], [0, 1.08, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.16, 0.16, 0.08], [0, 1.2, 0], { color: '#f6b030', rot: [90, 0, 0], glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
      .act({ click: [A.operate('lamp', 'off'), A.wait(0.3), A.operate('lamp', 'on'), A.wait(0.3), A.operate('lamp', 'off'), A.wait(0.3), A.par(A.operate('lamp', 'on'), A.say('Blink blink!', 1.2))] })
      .done(),
  ),
  // A traffic signal at its real 4.3 m: a pole with a push-button box, a backed signal head with visors and red,
  // amber and green lamps that cycle.
  e('traffic lights', 'places', 'street furniture', () => {
    const b = m('traffic lights', { edge: 'sharp' })
      .cyl([0.45, 0.12, 0.45], [0, 0.06, 0], { color: '#5c6166' })
      .cyl([0.15, 3.3, 0.15], [0, 1.7, 0], { color: '#5c6166' })
      .box([0.4, 1.2, 0.35], [0, 3.85, 0.1], { color: '#2a2726', round: 0.15 })
      .box([0.62, 1.42, 0.04], [0, 3.85, -0.09], { color: '#2a2726', round: 0.2 })
      .box([0.16, 0.24, 0.12], [0, 1.1, 0.12], { color: '#f6d24a', round: 0.3 })
      .cyl([0.06, 0.03, 0.06], [0, 1.12, 0.19], { color: '#2a2726', rot: [90, 0, 0] });
    const lamps: Array<[string, string, number, boolean]> = [['red', '#e0473b', 4.22, true], ['amber', '#f6b030', 3.85, false], ['green', '#5ad65a', 3.48, false]];
    for (const [n, c, y, on] of lamps) b.cyl([0.26, 0.05, 0.26], [0, y, 0.29], { color: c, rot: [90, 0, 0], glow: true, name: n, mover: { kind: 'light', on } }).arc([0.34, 0.34, 0.16], [0, y, 0.34], { color: '#2a2726', arc: 180, tube: 0.12, rot: [90, 0, 0] });
    return b
      .act({
        click: [
          [A.par(A.operate('red', 'off'), A.operate('green', 'on')), A.say('Click!', 1), A.wait(2), A.par(A.operate('green', 'off'), A.operate('amber', 'on')), A.wait(1.2), A.par(A.operate('amber', 'off'), A.operate('red', 'on'))],
          [A.par(A.operate('red', 'off'), A.operate('amber', 'on'), A.say('Blink... blink...', 1.8)), A.wait(0.4), A.operate('amber', 'off'), A.wait(0.4), A.operate('amber', 'on'), A.wait(0.4), A.par(A.operate('amber', 'off'), A.operate('red', 'on'))],
        ],
      })
      .done();
  }),
  // A wooden bowl of trail mix: peanuts, raisins, almonds and candy-coated chocolates; a shake mixes it.
  e('trail mix', 'food', 'snacks', () => {
    const b = m('trail mix').cyl([0.15, 0.06, 0.15], [0, 0.03, 0], { color: 'wood', taper: 1.35 }).ball([0.19, 0.04, 0.19], [0, 0.062, 0], { color: '#8a5a2b' });
    const bits: Array<[number, number, string]> = [[0, 0, 'tan'], [0.05, 0, '#e0473b'], [-0.05, 0.02, '#f6d24a'], [0.02, 0.05, '#4a2e1a'], [-0.02, -0.05, '#4e8fd6'], [0.06, -0.04, 'cream'], [-0.06, -0.03, '#5aa553'], [0.03, -0.025, 'tan'], [-0.03, 0.06, '#f0923b'], [0.065, 0.045, '#c8955a'], [-0.025, 0.02, '#4a2e1a'], [0.025, 0.025, 'cream'], [-0.07, 0.05, 'tan'], [0.0, -0.075, '#e0473b']];
    for (const [x0, z, c] of bits) b.ball([0.022, 0.016, 0.018], [x0, 0.086 - (x0 * x0 + z * z) * 3, z], { color: c, rot: [0, x0 * 900, 0] });
    return b.act({ click: [A.par(A.anim('shake'), A.say('Rattle rattle!', 1.3))] }).done();
  }),
  // A travel trailer (caravan) at real size, 6.5 m long and 2.8 m tall: a rounded two-tone body, a side door with
  // a step, wraparound front window, a roof air conditioner, an A-frame drawbar with gas bottles and a jockey
  // wheel, one axle under mudguards, and an awning that rolls out of its tube along the side.
  e('trailer', 'garage', 'trailers', () => {
    const b = m('trailer', { view: 'side', edge: 'sharp' })
      .loft([2.3, 2.3, 6.0], [0, 1.65, 0], [[0, 0.92, 0.88, 0], [0.06, 1, 0.97, 0], [0.9, 1, 1, 0], [0.97, 0.95, 0.92, -0.01], [1, 0.8, 0.78, -0.02]], { color: '#f4ecd6', boxy: 0.78, name: 'body', edge: 'soft' })
      .box([2.34, 0.45, 5.7], [0, 1.1, 0], { color: '#3fa7a0', round: 0.4 })
      .box([1.9, 0.18, 5.6], [0, 0.42, 0], { color: '#3a3633' })
      .box([0.06, 1.85, 0.7], [1.17, 1.5, -1.0], { color: '#3fa7a0', round: 0.1, name: 'door', pivot: [1.17, 1.5, -0.65], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([0.04, 0.45, 0.4], [1.2, 1.95, -1.0], { color: 'glass', parent: 'door' })
      .box([0.04, 0.05, 0.12], [1.21, 1.35, -1.25], { color: 'silver', parent: 'door' })
      .box([0.42, 0.06, 0.55], [1.35, 0.32, -1.0], { color: '#9da3a8' })
      .box([0.05, 0.7, 1.3], [1.16, 1.95, 1.25], { color: 'glass', round: 0.2 })
      .box([0.05, 0.6, 0.9], [1.16, 2.0, -2.45], { color: 'glass', round: 0.2 })
      .box([0.05, 0.7, 1.6], [-1.16, 1.95, 0.6], { color: 'glass', round: 0.2 })
      .box([0.05, 0.6, 0.9], [-1.16, 2.0, -2.0], { color: 'glass', round: 0.2 })
      .box([1.7, 0.55, 0.08], [0, 2.0, 2.97], { color: 'glass', rot: [-12, 0, 0], round: 0.3 })
      .box([0.9, 0.4, 0.06], [0, 2.0, -3.0], { color: 'glass', round: 0.3 })
      .box([0.8, 0.28, 0.9], [0, 2.92, 0.3], { color: 'white', round: 0.3 })
      .box([0.5, 0.12, 0.5], [0, 2.84, -1.8], { color: '#d4d7da', round: 0.3 })
      .box([0.08, 0.08, 4.0], [1.17, 2.62, -0.3], { color: '#9da3a8' })
      .cyl([0.12, 3.2, 0.12], [1.22, 2.55, -0.3], { color: 'white', rot: [90, 0, 0] })
      .box([1.6, 0.04, 3.0], [2.0, 2.45, -0.3], { color: '#e0473b', rot: [0, 0, -8], round: 0.3, name: 'awning', pivot: [1.22, 2.55, -0.3], scale: 0 })
      .box([0.04, 0.22, 3.0], [2.8, 2.25, -0.3], { color: 'white', round: 0.3, name: 'valance', pivot: [1.22, 2.55, -0.3], scale: 0 })
      .rod([0.8, 0.45, 2.8], [0.05, 0.5, 4.3], 0.1, '#3a3633')
      .rod([-0.8, 0.45, 2.8], [-0.05, 0.5, 4.3], 0.1, '#3a3633')
      .box([0.22, 0.16, 0.3], [0, 0.55, 4.4], { color: '#3a3633', round: 0.3 })
      .stick([0.3, 0.5, 3.9], [0.3, 0.18, 3.9], 0.07, '#9da3a8')
      .cyl([0.18, 0.06, 0.18], [0.3, 0.09, 3.9], { color: 'rubber', rot: [0, 0, 90], edge: 'soft' })
      .cyl([0.3, 0.55, 0.3], [0.3, 0.82, 3.35], { color: 'white', edge: 'soft' })
      .cyl([0.3, 0.55, 0.3], [-0.3, 0.82, 3.35], { color: 'white', edge: 'soft' });
    b.pair((s) => {
      b.arc([0.95, 0.95, 0.26], [s * 1.05, 0.4, -0.4], { color: '#9da3a8', arc: 180, rot: [0, 90, 0], tube: 0.12 })
        .box([0.2, 0.25, 0.05], [s * 0.85, 0.85, -3.02], { color: '#e0473b', glow: true })
        .stick([s * 0.9, 0.38, -2.6], [s * 0.9, 0.0, -2.6], 0.06, '#5c6166')
        .stick([s * 0.9, 0.38, 2.4], [s * 0.9, 0.0, 2.4], 0.06, '#5c6166');
    });
    axle2(b, '', 0.72, 0.2, 2.1, -0.4);
    return b
      .socket('inside', [0, 1.3, 0], 'inside', { size: 1.2 })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Creak!', 1.2), A.wait(2), A.operate('door', 'close')],
          [A.par(A.pose('awning', { scale: 1, dur: 1 }), A.pose('valance', { scale: 1, dur: 1 }), A.say('Whirrr...', 1.5)), A.wait(2.5), A.par(A.pose('awning', { scale: 0, dur: 0.8 }), A.pose('valance', { scale: 0, dur: 0.8 }))],
        ],
      })
      .done();
  }),
  // A trailer park: three single-wide mobile homes on skirting along a gravel lane, each with steps and a door;
  // a picket fence, a mailbox, trees, a barbecue and a welcome sign. A dog comes out to say hello.
  e('trailer park', 'places', 'neighbourhoods', () => {
    const b = m('trailer park', { edge: 'sharp' })
      .box([36, 0.12, 22], [0, 0.06, 0], { color: '#7ab85a', round: 0.02 })
      .box([36, 0.05, 4], [0, 0.13, 4.5], { color: '#c9bfa8' });
    const homes: Array<[number, string, string]> = [[-12, '#f4ecd6', '#3fa7a0'], [0, '#a8d8f5', 'white'], [12, '#f6e3a0', '#a3322a']];
    homes.forEach(([x0, wall, trim], i) => {
      const n = `door${i + 1}`;
      b.box([10, 0.6, 3.4], [x0, 0.42, -3], { color: '#9da3a8' })
        .box([10, 2.6, 3.6], [x0, 2.0, -3], { color: wall, round: 0.05 })
        .box([10.1, 0.35, 3.7], [x0, 1.0, -3], { color: trim, noInk: true })
        .wedge([4.0, 0.5, 10.2], [x0, 3.55, -3], { color: '#7a7f86', rot: [0, 90, 0] })
        .box([1.4, 0.3, 1.0], [x0 + 2.5, 0.27, -0.7], { color: '#bdbab0' })
        .box([1.4, 0.3, 0.6], [x0 + 2.5, 0.57, -0.95], { color: '#bdbab0' });
      door(b, n, 0.9, 2.0, [x0 + 2.5, 0.72, -1.2], trim === 'white' ? '#2f4f8f' : trim, { hinge: -1, glass: true });
      win(b, 1.6, 0.9, [x0 - 2.5, 2.2, -1.2], 'front', trim, { bars: false });
      win(b, 1.2, 0.9, [x0 + 0.4, 2.2, -1.2], 'front', trim, { bars: false });
    });
    b.box([0.6, 0.55, 0.12], [-12 + 2.5, 3.05, -1.15], { color: '#fff1c0', glow: true, name: 'lamp', mover: { kind: 'light', on: false } });
    b.each(12, (i) => b.box([0.12, 1.0, 0.06], [-17 + i * 0.55, 0.62, 8.5], { color: 'white' }));
    b.box([6.4, 0.1, 0.05], [-14, 0.85, 8.5], { color: 'white' }).box([6.4, 0.1, 0.05], [-14, 0.45, 8.5], { color: 'white' });
    b.stick([6, 0.12, 7.2], [6, 1.1, 7.2], 0.1, '#7a5230').box([0.25, 0.25, 0.5], [6, 1.2, 7.2], { color: '#4e8fd6', round: 0.4 })
      .cyl([0.6, 0.5, 0.6], [4, 0.85, 1.2], { color: '#2a2726', rot: [0, 0, 0] }).stick([4, 0.12, 1.2], [4, 0.6, 1.2], 0.08, '#2a2726')
      .stick([-15, 0.12, 10], [-15, 2.6, 10], 0.15, '#7a5230').stick([-11, 0.12, 10], [-11, 2.6, 10], 0.15, '#7a5230')
      .box([4.4, 1.0, 0.15], [-13, 2.4, 10], { color: '#f6d24a', round: 0.2 })
      .label('SUNNY ACRES', [4.0, 0.7], [-13, 2.4, 10.09], { color: '#f6d24a', depth: 0.04 });
    tree(b, [16, 0.12, 8], 7);
    tree(b, [-17, 0.12, -9], 8, '#4e9448');
    tree(b, [6, 0.12, -9.5], 6.5);
    return b
      .act({
        click: [
          [A.operate('door2', 'open'), A.spawn('pup', 'dog', { rel: 'front', of: 'self', dist: 'close' }), A.say('Woof woof!', 1.5, 'pup'), A.wait(2), A.remove('pup', 'fade'), A.operate('door2', 'close')],
          [A.operate('lamp', 'on'), A.effect('smoke', { dur: 2 }), A.say('Sizzle!', 1.5), A.wait(1.5), A.operate('lamp', 'off')],
        ],
      })
      .done();
  }),
  // A steam locomotive and its tender, 19.5 m long and 4.4 m tall: boiler, smokebox with a headlamp, chimney,
  // domes and a bell, three big red driving wheels a side with a coupling rod, a pony truck, a cowcatcher, a cab
  // with spectacle windows, and a tender heaped with coal.
  e('train', 'garage', 'trains', () => {
    const b = m('train', { view: 'side', edge: 'sharp' })
      .box([2.2, 0.35, 11.6], [0, 1.25, 3.4], { color: '#2a2726' })
      .cyl([1.8, 7.0, 1.8], [0, 2.6, 4.5], { color: '#2e5e3e', rot: [90, 0, 0] })
      .cyl([1.84, 0.12, 1.84], [0, 2.6, 2.4], { color: 'brass', rot: [90, 0, 0] })
      .cyl([1.84, 0.12, 1.84], [0, 2.6, 5.4], { color: 'brass', rot: [90, 0, 0] })
      .cyl([1.9, 1.1, 1.9], [0, 2.6, 8.55], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([1.55, 0.1, 1.55], [0, 2.6, 9.12], { color: '#3a3633', rot: [90, 0, 0] })
      .ball(0.16, [0, 2.6, 9.2], { color: 'silver' })
      .cyl([0.62, 0.9, 0.62], [0, 3.85, 8.5], { color: '#2a2726', taper: 1.3 })
      .cyl([0.86, 0.15, 0.86], [0, 4.35, 8.5], { color: '#2a2726' })
      .dome([0.8, 0.55, 0.8], [0, 3.62, 5.6], { color: 'brass', edge: 'soft' })
      .dome([0.7, 0.45, 0.7], [0, 3.58, 3.6], { color: '#2e5e3e', edge: 'soft' })
      .cyl([0.3, 0.32, 0.3], [0, 3.62, 6.9], { color: 'brass', taper: 1.4 })
      .box([0.55, 0.45, 0.4], [0, 3.62, 9.05], { color: '#2a2726' })
      .cyl([0.36, 0.08, 0.36], [0, 3.62, 9.27], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: 'headlamp', mover: { kind: 'light', on: false } })
      .box([2.9, 0.45, 0.25], [0, 1.05, 9.25], { color: '#c0392b' })
      .wedge([0.9, 0.95, 2.4], [0, 0.55, 9.75], { color: '#5c6166', rot: [0, 90, 0], apex: 0.5 })
      .box([3.0, 2.6, 2.6], [0, 2.95, -0.3], { color: '#2e5e3e', round: 0.04 })
      .box([3.3, 0.2, 3.2], [0, 4.35, -0.4], { color: '#2a2726', round: 0.2 })
      .box([0.06, 1.0, 1.0], [1.51, 3.2, -0.6], { color: '#2a2726' })
      .box([0.06, 1.0, 1.0], [-1.51, 3.2, -0.6], { color: '#2a2726' })
      .label('No. 9', [0.8, 0.35], [1.52, 2.25, -0.3], { color: 'gold', rot: [0, 90, 0], depth: 0.02 })
      .cyl([0.12, 0.35, 0.12], [0.5, 4.6, 0.8], { color: 'brass', name: 'whistle' })
      .box([2.8, 2.1, 6.4], [0, 2.1, -5.6], { color: '#2e5e3e', round: 0.04 })
      .box([2.9, 0.18, 6.5], [0, 3.15, -5.6], { color: '#2a2726' })
      .ball([2.5, 0.9, 5.6], [0, 3.2, -5.5], { color: '#2e3135', edge: 'soft' })
      .box([2.2, 0.3, 6.8], [0, 0.9, -5.6], { color: '#2a2726' })
      .label('NORTHERN LINE', [3.2, 0.4], [1.41, 2.2, -5.6], { color: 'gold', rot: [0, 90, 0], depth: 0.02 })
      .socket('seat', [0.7, 2.0, -0.4], 'seat');
    b.pair((s) => {
      b.box([0.5, 0.08, 7.6], [s * 1.25, 1.62, 5.0], { color: '#2a2726' })
        .cyl([0.5, 1.0, 0.5], [s * 1.2, 1.15, 7.0], { color: '#2a2726', rot: [90, 0, 0] })
        .cyl([0.75, 0.75, 0.2], [s * 1.0, 1.15, 9.45], { color: '#2a2726', rot: [90, 0, 0] })
        .cyl([0.5, 0.06, 0.5], [s * 1.1, 3.4, 1.0], { color: 'glass', rot: [90, 0, 0] })
        .stick([s * 1.45, 0.8, 1.9], [s * 1.45, 0.8, 5.5], 0.1, 'silver')
        .stick([s * 1.45, 0.8, 5.5], [s * 1.25, 1.15, 7.0], 0.08, 'silver');
      [1.9, 3.7, 5.5].forEach((z, i) => {
        const n = `wheelD${i}${s > 0 ? 'L' : 'R'}`;
        b.cyl([1.6, 0.16, 1.6], [s * 1.3, 0.8, z], { color: '#c0392b', rot: [0, 0, 90], name: n });
        b.cyl([1.3, 0.18, 1.3], [s * 1.3, 0.8, z], { color: '#2a2726', rot: [0, 0, 90], parent: n });
        b.box([0.19, 1.25, 0.12], [s * 1.3, 0.8, z], { color: '#c0392b', parent: n }).box([0.19, 0.12, 1.25], [s * 1.3, 0.8, z], { color: '#c0392b', parent: n });
      });
      for (const [z, d, t] of [[7.9, 0.8, 'P'], [-0.6, 0.9, 'T'], [-3.3, 0.95, 'A'], [-4.5, 0.95, 'B'], [-6.7, 0.95, 'C'], [-7.9, 0.95, 'E']] as Array<[number, number, string]>) {
        const n = `wheel${t}${s > 0 ? 'L' : 'R'}`;
        b.cyl([d, 0.14, d], [s * 1.2, d / 2, z], { color: '#2a2726', rot: [0, 0, 90], name: n }).cyl([d * 0.35, 0.16, d * 0.35], [s * 1.2, d / 2, z], { color: '#c0392b', rot: [0, 0, 90], parent: n });
      }
    });
    return b
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 2.5 }), A.say('Choo choo!', 2), A.anim('shake'))],
          [A.operate('headlamp', 'on'), A.say('Toot toot!', 1.5), A.wait(2), A.operate('headlamp', 'off')],
        ],
      })
      .done();
  }),
  // A boxcar at real size, 14 m long and 4.2 m tall: ribbed sides, a sliding door, a roof walk, corner ladders,
  // two bogies of two axles and couplers at each end.
  e('train car', 'garage', 'trains', () => {
    const R = '#8a3a2a';
    const b = m('train car', { view: 'side', edge: 'sharp' })
      .box([2.9, 2.9, 14], [0, 2.65, 0], { color: R, round: 0.03 })
      .box([3.0, 0.15, 14.1], [0, 4.15, 0], { color: '#6a2a20', round: 0.3 })
      .box([0.6, 0.08, 13.8], [0, 4.27, 0], { color: '#5c6166' })
      .box([2.6, 0.35, 13.6], [0, 1.05, 0], { color: '#2a2726' })
      .box([0.03, 2.6, 2.4], [1.44, 2.55, 0], { color: '#1e1c1c' })
      .box([0.08, 2.65, 2.5], [1.5, 2.55, 0], { color: '#7a3226', round: 0.1, name: 'door', mover: { kind: 'slide', axis: 'z', amount: -2.4 } })
      .stick([1.56, 1.25, -2.6], [1.56, 1.25, 2.6], 0.06, '#3a3633')
      .stick([1.56, 3.9, -2.6], [1.56, 3.9, 2.6], 0.06, '#3a3633')
      .box([0.03, 2.6, 2.4], [-1.44, 2.55, 0], { color: '#7a3226' })
      .label('RAILWAY EXPRESS', [3.4, 0.5], [1.46, 3.5, -4.2], { color: R, rot: [0, 90, 0], depth: 0.02 })
      .label('RAILWAY EXPRESS', [3.4, 0.5], [-1.46, 3.5, 4.2], { color: R, rot: [0, -90, 0], depth: 0.02 })
      .socket('inside', [0, 1.6, 0], 'inside', { size: 2.5 });
    b.box([0.06, 0.08, 0.3], [1.56, 2.4, -1.0], { color: 'silver', parent: 'door' });
    for (const z of [-6.2, -4.6, -3.0, 3.0, 4.6, 6.2]) b.pair((s) => b.box([0.06, 2.8, 0.12], [s * 1.47, 2.65, z], { color: '#7a3226', noInk: true }));
    b.pair((s) => {
      b.box([1.0, 0.3, 0.6], [0, 1.0, s * 7.2], { color: '#3a3633' }).cyl([0.3, 0.2, 0.3], [0, 1.0, s * 7.5], { color: '#5c6166', rot: [90, 0, 0] });
      b.each(6, (i) => b.box([0.6, 0.05, 0.05], [1.0, 1.6 + i * 0.45, s * 7.03], { color: '#3a3633' }));
      b.box([2.6, 0.5, 2.4], [0, 0.65, s * 5.0], { color: '#3a3633' });
      for (const k of [-1, 1]) {
        const z = s * 5.0 + k * 0.85, tag = `${s > 0 ? 'F' : 'B'}${k > 0 ? 1 : 2}`;
        b.pair((t) => b.cyl([0.9, 0.14, 0.9], [t * 1.2, 0.45, z], { color: '#2a2726', rot: [0, 0, 90], name: `wheel${tag}${t > 0 ? 'L' : 'R'}` }).cyl([0.3, 0.16, 0.3], [t * 1.2, 0.45, z], { color: '#5c6166', rot: [0, 0, 90], parent: `wheel${tag}${t > 0 ? 'L' : 'R'}` }));
      }
    });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.say('Rumble...', 1.5)), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.anim('shake'), A.say('Clickety-clack!', 1.8))],
        ],
      })
      .done();
  }),
  // A brick railway station 18 m wide: arched windows, double doors under a clock gable, a slate roof, a raised
  // platform with a canopy on iron columns, benches and lamps, the line in front and a signal at the end.
  e('train station', 'places', 'transport', () => {
    const B = '#b5634a';
    const b = m('train station', { edge: 'sharp' })
      .box([28, 0.1, 22], [0, 0.05, 0], { color: '#9a9a92', round: 0.02 })
      .box([18, 6, 8], [0, 3.05, -6], { color: B, round: 0.02 })
      .box([18.3, 0.4, 8.3], [0, 6.1, -6], { color: '#efe6cf' });
    b.wedge([8.8, 3, 18.8], [0, 7.8, -6], { color: '#4a4f55', rot: [0, 90, 0] });
    b.box([5, 2.5, 0.6], [0, 7.2, -1.8], { color: B }).wedge([5.6, 2.0, 0.8], [0, 9.4, -1.8], { color: '#4a4f55' })
      .cyl([2.0, 0.15, 2.0], [0, 7.3, -1.42], { color: 'white', rot: [90, 0, 0] })
      .torus([2.2, 2.2, 0.16], [0, 7.3, -1.4], { color: '#2a2726', tube: 0.08 })
      .box([0.12, 0.65, 0.06], [0, 7.55, -1.3], { color: '#2a2726', name: 'hourHand', pivot: [0, 7.3, -1.3] })
      .box([0.08, 0.85, 0.06], [0, 7.7, -1.26], { color: '#2a2726', name: 'minuteHand', pivot: [0, 7.3, -1.26] });
    door(b, 'doorL', 1.1, 2.6, [0.55, 1.05, -2], '#2e5e3e', { hinge: 1, glass: true });
    door(b, 'doorR', 1.1, 2.6, [-0.55, 1.05, -2], '#2e5e3e', { hinge: -1, glass: true });
    for (const x0 of [-7, -4.2, 4.2, 7]) {
      win(b, 1.4, 1.9, [x0, 2.9, -2], 'front', '#efe6cf', { bars: false });
      b.arc([1.6, 1.0, 0.1], [x0, 3.85, -1.95], { color: '#efe6cf', arc: 180, tube: 0.18 });
    }
    b.box([26, 1.0, 6], [0, 0.55, 1.0], { color: '#bdbab0' }).box([26, 0.06, 0.4], [0, 1.08, 3.8], { color: '#f6d24a' })
      .box([20, 0.3, 5.2], [0, 4.8, 0.4], { color: '#2e5e3e', round: 0.1 })
      .box([20.2, 0.5, 0.15], [0, 4.55, 3.0], { color: 'white' })
      .box([4.2, 0.7, 0.12], [-5, 3.7, 2.8], { color: '#2f4f8f' })
      .label('MAPLE JUNCTION', [4.0, 0.55], [-5, 3.7, 2.87], { color: '#2f4f8f', depth: 0.03 })
      .stick([-5.8, 4.1, 2.8], [-5.8, 4.65, 2.8], 0.04, '#2a2726').stick([-4.2, 4.1, 2.8], [-4.2, 4.65, 2.8], 0.04, '#2a2726');
    b.each(5, (i) => b.cyl([0.22, 3.6, 0.22], [-8 + i * 4, 2.85, 2.6], { color: '#2e5e3e' }));
    b.pair((s) => b.box([1.8, 0.1, 0.5], [s * 7, 1.5, 0], { color: '#7a5230' }).box([1.8, 0.5, 0.08], [s * 7, 1.8, -0.25], { color: '#7a5230' }).box([0.1, 0.45, 0.5], [s * 7.8, 1.27, 0], { color: '#2a2726' }).box([0.1, 0.45, 0.5], [s * 6.2, 1.27, 0], { color: '#2a2726' }));
    b.each(13, (i) => b.box([0.25, 0.15, 3.0], [-12 + i * 2, 0.15, 6.0], { color: '#7a5230' }));
    b.pair((s) => b.box([26, 0.15, 0.1], [0, 0.29, 6.0 + s * 0.72], { color: '#8f99a3' }));
    b.stick([12.5, 1.05, 3.4], [12.5, 4.5, 3.4], 0.15, '#2a2726').box([0.5, 1.0, 0.3], [12.5, 4.6, 3.4], { color: '#2a2726', round: 0.2 })
      .ball(0.3, [12.5, 4.85, 3.57], { color: '#e0473b', glow: true, name: 'stopLight', mover: { kind: 'light', on: true } })
      .ball(0.3, [12.5, 4.4, 3.57], { color: '#5ad65a', glow: true, name: 'goLight', mover: { kind: 'light', on: false } });
    return b
      .act({
        click: [
          [A.par(A.pose('minuteHand', { rot: [0, 0, -720], dur: 2 }), A.pose('hourHand', { rot: [0, 0, -360], dur: 2 }), A.say('Ding-dong!', 2)), A.par(A.pose('minuteHand', { rot: [0, 0, 0], dur: 0 }), A.pose('hourHand', { rot: [0, 0, 0], dur: 0 }))],
          [A.par(A.operate('stopLight', 'off'), A.operate('goLight', 'on'), A.say('Toot toot!', 1.5)), A.wait(2.5), A.par(A.operate('goLight', 'off'), A.operate('stopLight', 'on'))],
          [A.par(A.operate('doorL', 'open'), A.operate('doorR', 'open')), A.wait(2), A.par(A.operate('doorL', 'close'), A.operate('doorR', 'close'))],
        ],
      })
      .done();
  }),
  // A brass steam whistle on a pipe stub: a pull lever with its cord; pulled, it screams and steams.
  e('train whistle', 'music', 'whistles', () =>
    m('train whistle', { edge: 'sharp' })
      .cyl([0.06, 0.03, 0.06], [0, 0.015, 0], { color: '#5c6166', segs: 6 })
      .cyl([0.035, 0.05, 0.035], [0, 0.055, 0], { color: '#5c6166' })
      .box([0.06, 0.045, 0.05], [0, 0.1, 0], { color: 'brass', round: 0.3 })
      .cyl([0.04, 0.02, 0.04], [0, 0.13, 0], { color: '#2a2726' })
      .cyl([0.07, 0.12, 0.07], [0, 0.2, 0], { color: 'brass', edge: 'soft' })
      .box([0.03, 0.006, 0.072], [0, 0.18, 0], { color: '#2a2726', noInk: true })
      .ball([0.072, 0.035, 0.072], [0, 0.26, 0], { color: 'brass', edge: 'soft' })
      .rod([0.03, 0.1, 0], [0.12, 0.12, 0], 0.01, 'iron', { name: 'lever', pivot: [0.03, 0.1, 0], mover: { kind: 'swing', axis: 'z', amount: -20 } })
      .stick([0.12, 0.12, 0], [0.12, 0.0, 0], 0.004, 'tan', { parent: 'lever' })
      .act({ click: [A.operate('lever', 'down'), A.par(A.effect('steam', { dur: 1.8 }), A.say('Wheeeeee!', 1.8)), A.operate('lever', 'up')] })
      .done(),
  ),
  // A backyard trampoline 3.6 m across: a black mat on a sprung steel ring with a blue pad, W legs, and safety-net
  // poles. A child comes to bounce.
  e('trampoline', 'sports', 'backyard play', () => {
    const b = m('trampoline')
      .cyl([3.1, 0.03, 3.1], [0, 0.86, 0], { color: '#2a2726', name: 'mat', piece: true })
      .torus([3.6, 3.6, 0.12], [0, 0.88, 0], { color: '#4e8fd6', rot: [90, 0, 0], tube: 0.1 })
      .torus([3.5, 3.5, 0.06], [0, 0.82, 0], { color: '#9da3a8', rot: [90, 0, 0], tube: 0.03, edge: 'sharp' })
      .torus([3.7, 3.7, 0.05], [0, 2.6, 0], { color: '#4e8fd6', rot: [90, 0, 0], tube: 0.02 });
    around(6, 1.72).forEach(([x0, z]) => b.stick([x0, 0.82, z], [x0 * 0.9, 0.0, z * 0.9], 0.05, '#9da3a8', { edge: 'sharp' }).stick([x0 * 1.05, 0.0, z * 1.05], [x0 * 1.05, 2.6, z * 1.05], 0.05, '#2a2726', { edge: 'sharp' }).ball([0.12, 0.08, 0.12], [x0 * 0.9, 0.04, z * 0.9], { color: '#2a2726' }));
    b.socket('mat', [0, 0.88, 0], 'top', { size: 2.5 });
    return b
      .act({
        click: [
          [A.spawn('kid', 'boy', { rel: 'on', of: 'self' }), A.par(A.anim('hop', 3, 'kid'), A.say('Wheee!', 1.8, 'kid'), A.pose('mat', { move: [0, -0.15, 0], dur: 0.3 })), A.pose('mat', { move: [0, 0, 0], dur: 0.3 }), A.remove('kid', 'fade')],
          [A.pose('mat', { move: [0, -0.18, 0], dur: 0.2 }), A.par(A.pose('mat', { move: [0, 0, 0], dur: 0.2 }), A.say('Boing!', 1))],
        ],
      })
      .done();
  }),
  // An amber pill bottle with a child-proof white cap, a few capsules beside it; the cap twists off.
  e('tranquilizer', 'clinic', 'medicine', () =>
    m('tranquilizer')
      .cyl([0.055, 0.085, 0.055], [0, 0.0425, 0], { color: '#d9822b', name: 'bottle' })
      .label('Rx  CALM', [0.05, 0.045], [0, 0.042, 0.026], { color: 'white', depth: 0.003 })
      .cyl([0.062, 0.026, 0.062], [0, 0.098, 0], { color: 'white', name: 'cap', parent: 'bottle', piece: true, edge: 'sharp' })
      .capsule([0.012, 0.028, 0.012], [0.055, 0.006, 0.02], { color: '#a8d8f5', rot: [0, 30, 90] })
      .capsule([0.012, 0.028, 0.012], [0.05, 0.006, -0.02], { color: 'white', rot: [0, -20, 90] })
      .capsule([0.012, 0.028, 0.012], [-0.05, 0.006, 0.03], { color: '#a8d8f5', rot: [0, 70, 90] })
      .act({ click: [[A.pose('cap', { rot: [0, 360, 0], move: [0, 0.04, 0], dur: 0.5 }), A.say('Click... Zzz.', 1.5)], [A.pose('cap', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // An academic transcript clipped to a board: a list of grades, a header; a rubber stamp comes down and leaves a
  // red seal.
  e('transcript', 'study', 'documents', () => {
    const b = m('transcript', { edge: 'sharp' })
      .box([0.25, 0.03, 0.08], [0, 0.015, 0], { color: 'wood' })
      .box([0.23, 0.31, 0.012], [0, 0.18, 0], { color: '#7a5230', round: 0.1 })
      .box([0.21, 0.27, 0.004], [0, 0.17, 0.008], { color: 'white', round: 0.05 })
      .box([0.08, 0.03, 0.02], [0, 0.33, 0.01], { color: 'silver' })
      .label('TRANSCRIPT', [0.17, 0.03], [0, 0.285, 0.011], { color: 'white', depth: 0.003 })
      .cyl([0.05, 0.004, 0.05], [0.06, 0.075, 0.012], { color: '#c0392b', rot: [90, 0, 0], name: 'seal', scale: 0 })
      .cyl([0.04, 0.05, 0.04], [0.06, 0.2, 0.05], { color: '#2a2726', name: 'stamp', piece: true })
      .ball([0.05, 0.05, 0.05], [0.06, 0.24, 0.05], { color: '#a3322a', parent: 'stamp', edge: 'soft' });
    b.each(6, (i) => b.box([i % 3 === 2 ? 0.1 : 0.15, 0.006, 0.002], [i % 3 === 2 ? -0.03 : -0.01, 0.245 - i * 0.025, 0.011], { color: 'gray', noInk: true }).label(['A', 'B+', 'A', 'A-', 'B', 'A'][i], [0.02, 0.014], [0.08, 0.245 - i * 0.025, 0.011], { color: 'white', depth: 0.002 }));
    return b
      .act({
        click: [
          [A.pose('stamp', { move: [0, -0.1, -0.02], dur: 0.25 }), A.par(A.pose('seal', { scale: 1, dur: 0.1 }), A.say('Thunk!', 1)), A.pose('stamp', { move: [0, 0, 0], dur: 0.3 })],
          [A.pose('seal', { scale: 0, dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A car gearbox, 0.8 m long, cast aluminium: bell housing, ribbed case, tail housing, oil pan and the gear stick
  // that clunks through the gears.
  e('transmission', 'garage', 'car parts', () => {
    const b = m('transmission', { view: 'side', edge: 'sharp' })
      .cyl([0.42, 0.22, 0.42], [0, 0.27, 0.3], { color: '#c9ccd1', rot: [-90, 0, 0], taper: 0.62, edge: 'soft' })
      .box([0.26, 0.26, 0.36], [0, 0.24, 0.0], { color: '#c9ccd1', round: 0.35, edge: 'soft' })
      .cyl([0.13, 0.28, 0.13], [0, 0.24, -0.3], { color: '#c9ccd1', rot: [-90, 0, 0], taper: 0.8, edge: 'soft' })
      .cyl([0.1, 0.05, 0.1], [0, 0.24, -0.46], { color: '#5c6166', rot: [90, 0, 0], segs: 8 })
      .box([0.22, 0.06, 0.32], [0, 0.08, 0.0], { color: '#9da3a8', round: 0.3 })
      .cyl([0.06, 0.05, 0.06], [0, 0.24, 0.43], { color: '#5c6166', rot: [90, 0, 0] })
      .box([0.08, 0.06, 0.08], [0, 0.39, -0.04], { color: '#5c6166', round: 0.3 })
      .stick([0, 0.4, -0.04], [0, 0.6, -0.04], 0.02, '#2a2726', { name: 'shifter', pivot: [0, 0.41, -0.04] })
      .ball(0.05, [0, 0.62, -0.04], { color: '#2a2726', parent: 'shifter' });
    b.each(4, (i) => b.box([0.27, 0.02, 0.02], [0, 0.18 + i * 0.04, 0.12], { color: '#b4b8be', noInk: true }));
    b.pair((s) => b.each(3, (i) => b.cyl([0.022, 0.02, 0.022], [s * 0.1, 0.045, -0.1 + i * 0.1], { color: '#5c6166', segs: 6 })));
    return b.act({ click: [A.pose('shifter', { rot: [18, 0, 0], dur: 0.2 }), A.say('Clunk!', 0.8), A.pose('shifter', { rot: [-18, 0, 0], dur: 0.2 }), A.say('Clunk!', 0.8), A.pose('shifter', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // (The vocabulary's 1 m is wrong: a pylon is about 30 m.) An electricity pylon 30 m tall: four steel legs braced in a lattice, two cross-arms with strings of glass
  // insulators, an earth-wire peak and a danger sign; it hums.
  e('transmission tower', 'tech', 'power', () => {
    const b = m('transmission tower', { edge: 'sharp' });
    const half = (y: number) => (y <= 22 ? 3 - (2.1 * y) / 22 : 0.9 - (0.35 * (y - 22)) / 7.5);
    const S = '#8f99a3';
    for (const [x0, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      b.stick([x0 * 3, 0, z * 3], [x0 * 0.9, 22, z * 0.9], 0.22, S).stick([x0 * 0.9, 22, z * 0.9], [x0 * 0.55, 29.5, z * 0.55], 0.18, S).box([0.8, 0.5, 0.8], [x0 * 3, 0.25, z * 3], { color: '#a7a7a0' });
    }
    const levels = [0.4, 6, 11.5, 16.5, 22, 26];
    for (let k = 0; k < levels.length - 1; k++) {
      const y0 = levels[k], y1 = levels[k + 1], w0 = half(y0), w1 = half(y1);
      b.pair((s) => {
        b.stick([-w0, y0, s * w0], [w1, y1, s * w1], 0.09, S).stick([w0, y0, s * w0], [-w1, y1, s * w1], 0.09, S);
        b.stick([s * w0, y0, -w0], [s * w1, y1, w1], 0.09, S).stick([s * w0, y0, w0], [s * w1, y1, -w1], 0.09, S);
      });
      b.box([w1 * 2, 0.12, 0.12], [0, y1, w1], { color: S }).box([w1 * 2, 0.12, 0.12], [0, y1, -w1], { color: S });
    }
    b.box([14, 0.45, 0.45], [0, 20, 0], { color: S }).box([10, 0.4, 0.4], [0, 25.5, 0], { color: S })
      .rod([-7, 20, 0], [-0.9, 22, 0], 0.12, S).rod([7, 20, 0], [0.9, 22, 0], 0.12, S)
      .rod([-5, 25.5, 0], [-0.7, 27.5, 0], 0.1, S).rod([5, 25.5, 0], [0.7, 27.5, 0], 0.1, S)
      .cone([1.1, 1.5, 1.1], [0, 30.2, 0], { color: S, segs: 4 })
      .box([0.9, 0.7, 0.05], [0, 2.4, 2.72], { color: '#f6d24a' })
      .label('DANGER', [0.8, 0.25], [0, 2.45, 2.76], { color: '#f6d24a', depth: 0.02 });
    for (const [x0, y] of [[-6.6, 20], [6.6, 20], [-3.4, 20], [3.4, 20], [-4.6, 25.5], [4.6, 25.5]] as Array<[number, number]>) {
      b.each(6, (i) => b.cyl([0.32, 0.08, 0.32], [x0, y - 0.45 - i * 0.28, 0], { color: '#7fb5d9' }));
      b.stick([x0, y - 2.1, 0], [x0, y - 2.1, 1.6], 0.06, '#2a2726').stick([x0, y - 2.1, 0], [x0, y - 2.1, -1.6], 0.06, '#2a2726');
    }
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 1.8 }), A.say('Bzzzzzt!', 1.8))] }).done();
  }),
  // A desktop radio transmitter: a meter, two tuning dials, a Morse key, a red lamp and a telescopic aerial that
  // pulls out to send.
  e('transmitter', 'tech', 'radio gear', () =>
    m('transmitter', { edge: 'sharp' })
      .box([0.28, 0.16, 0.18], [0, 0.08, 0], { color: '#3a3f44', round: 0.15 })
      .box([0.26, 0.13, 0.01], [0, 0.085, 0.09], { color: '#55595e' })
      .box([0.08, 0.05, 0.006], [-0.07, 0.115, 0.096], { color: '#f6efd6' })
      .stick([-0.07, 0.096, 0.1], [-0.055, 0.13, 0.1], 0.003, '#2a2726', { noInk: true })
      .cyl([0.04, 0.016, 0.04], [0.04, 0.115, 0.097], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([0.04, 0.016, 0.04], [0.04, 0.05, 0.097], { color: '#2a2726', rot: [90, 0, 0] })
      .box([0.06, 0.012, 0.03], [-0.07, 0.05, 0.097], { color: '#9be34d', glow: true })
      .ball(0.018, [0.1, 0.14, 0.095], { color: '#e0473b', glow: true, name: 'led', mover: { kind: 'light', on: false } })
      .box([0.07, 0.012, 0.04], [0.06, 0.006, 0.16], { color: '#2a2726' })
      .box([0.05, 0.006, 0.012], [0.06, 0.02, 0.17], { color: 'brass', rot: [8, 0, 0] })
      .cyl([0.016, 0.01, 0.016], [0.06, 0.028, 0.18], { color: '#2a2726' })
      .cyl([0.02, 0.04, 0.02], [0.11, 0.18, -0.06], { color: '#5c6166' })
      .stick([0.11, 0.2, -0.06], [0.11, 0.36, -0.06], 0.008, 'silver', { name: 'aerial', mover: { kind: 'slide', axis: 'y', amount: 0.18 } })
      .ball(0.014, [0.11, 0.365, -0.06], { color: 'silver', parent: 'aerial' })
      .act({ click: [A.par(A.operate('aerial', 'out'), A.operate('led', 'on')), A.say('Beep... beep-beep... beep!', 2.2), A.wait(0.5), A.par(A.operate('aerial', 'in'), A.operate('led', 'off'))] })
      .done(),
  ),
  // A trapdoor in a plank floor: the hatch lifts on its back hinges by an iron ring, over a dark hole. (It lies in
  // the floor, so it is lower than the vocabulary's 2 m door.)
  e('trapdoor', 'home', 'doors', () => {
    const b = m('trapdoor', { edge: 'sharp' })
      .box([2.2, 0.14, 2.2], [0, 0.07, 0], { color: '#b5814e' })
      .box([1.0, 0.012, 1.0], [0, 0.142, 0.1], { color: '#1e1c1c', noInk: true })
      .box([1.02, 0.05, 1.02], [0, 0.17, 0.1], { color: '#d8b07a', name: 'hatch', pivot: [0, 0.17, -0.41], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .torus([0.12, 0.12, 0.022], [0, 0.2, 0.45], { color: 'iron', rot: [90, 0, 0], tube: 0.14, parent: 'hatch' });
    b.each(3, (i) => b.box([1.0, 0.012, 0.08], [0, 0.198, -0.25 + i * 0.32], { color: '#9a6a3a', parent: 'hatch' }));
    b.pair((s) => b.box([0.08, 0.02, 0.22], [s * 0.3, 0.2, -0.32], { color: 'iron', parent: 'hatch' }));
    b.each(5, (i) => b.box([0.012, 0.004, 2.2], [-0.88 + i * 0.44, 0.142, 0], { color: '#7a5230', noInk: true }));
    b.pair((s) => b.box([0.05, 0.03, 0.03], [s * 0.25, 0.141, 0.4], { color: '#7a5230', noInk: true }));
    return b.act({ click: [A.operate('hatch', 'open'), A.say('Creeeak...', 1.6), A.wait(2.2), A.operate('hatch', 'close'), A.say('Thud!', 1)] }).done();
  }),
  // A circus trapeze rig 4 m tall: red A-frame legs, a top bar, and the swing (ropes and a bar) that swings.
  e('trapeze', 'sports', 'circus', () => {
    const b = m('trapeze', { edge: 'sharp' })
      .stick([-1.2, 3.9, 0], [1.2, 3.9, 0], 0.1, '#c0392b');
    b.pair((s) => b.stick([s * 1.2, 3.95, 0], [s * 1.5, 0, 0.9], 0.09, '#c0392b').stick([s * 1.2, 3.95, 0], [s * 1.5, 0, -0.9], 0.09, '#c0392b').box([0.3, 0.12, 2.0], [s * 1.5, 0.06, 0], { color: '#5c6166' }));
    b.stick([-0.45, 3.85, 0], [-0.45, 2.45, 0], 0.025, 'tan', { name: 'swing', pivot: [0, 3.88, 0], piece: true })
      .stick([0.45, 3.85, 0], [0.45, 2.45, 0], 0.025, 'tan', { parent: 'swing' })
      .stick([-0.5, 2.45, 0], [0.5, 2.45, 0], 0.05, 'silver', { parent: 'swing' })
      .box([0.22, 0.08, 0.06], [-0.4, 2.45, 0], { color: '#f6d24a', parent: 'swing' })
      .box([0.22, 0.08, 0.06], [0.4, 2.45, 0], { color: '#f6d24a', parent: 'swing' });
    return b.act({ click: [A.pose('swing', { rot: [35, 0, 0], dur: 0.6 }), A.par(A.pose('swing', { rot: [-35, 0, 0], dur: 0.9 }), A.say('Swoosh!', 1.2)), A.pose('swing', { rot: [20, 0, 0], dur: 0.7 }), A.pose('swing', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A flat purple trapezoid tile on a little wooden stand (a shape from the shape set); it turns round.
  e('trapezoid', 'ideas', 'shapes', () => {
    const b = m('trapezoid', { edge: 'sharp' }).box([0.13, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' }).box([0.06, 0.075, 0.025], [0, 0.0575, 0], { color: '#8a5fc4', round: 0.05, name: 'shape', pivot: [0, 0.02, 0] });
    b.pair((s) => b.wedge([0.03, 0.075, 0.025], [s * 0.045, 0.0575, 0], { color: '#8a5fc4', apex: -s * 0.5, parent: 'shape' }));
    return b.act({ click: [A.par(A.pose('shape', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1 })), A.pose('shape', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A chrome serving tray with raised rims and cut-out handles: a teacup on its saucer and a croissant. The cup
  // rattles.
  e('tray', 'kitchen', 'tableware', () => {
    const b = m('tray', { edge: 'sharp' }).box([0.46, 0.012, 0.32], [0, 0.006, 0], { color: 'silver', round: 0.3 })
      .cyl([0.13, 0.008, 0.13], [-0.08, 0.016, 0], { color: 'white', edge: 'soft' })
      .cyl([0.075, 0.055, 0.075], [-0.08, 0.047, 0], { color: 'white', taper: 1.25, name: 'cup', edge: 'soft' })
      .cyl([0.075, 0.004, 0.075], [-0.08, 0.072, 0], { color: '#8a5530', parent: 'cup', noInk: true })
      .torus([0.035, 0.035, 0.01], [-0.128, 0.05, 0], { color: 'white', rot: [0, 90, 0], parent: 'cup' })
      .ball([0.11, 0.04, 0.05], [0.1, 0.03, 0.04], { color: '#d9a35f', rot: [0, 30, 0], edge: 'soft' })
      .socket('top', [0.05, 0.015, -0.05], 'top', { size: 0.25 });
    b.pair((s) => b.box([0.012, 0.035, 0.32], [s * 0.23, 0.02, 0], { color: 'silver' }).box([0.46, 0.035, 0.012], [0, 0.02, s * 0.16], { color: 'silver' }).box([0.012, 0.05, 0.16], [s * 0.232, 0.04, 0], { color: 'silver' }).box([0.014, 0.018, 0.08], [s * 0.232, 0.045, 0], { color: '#5c6166', noInk: true }));
    return b.act({ click: [A.pose('cup', { rot: [0, 0, 6], dur: 0.08 }), A.pose('cup', { rot: [0, 0, -6], dur: 0.08 }), A.pose('cup', { rot: [0, 0, 6], dur: 0.08 }), A.par(A.pose('cup', { rot: [0, 0, 0], dur: 0.08 }), A.say('Clink clink!', 1.2))] }).done();
  }),
  // A home treadmill: a 2 m deck with a black belt between rollers, upright posts and handrails, a console at
  // 1.4 m with a screen that lights when it starts.
  e('treadmill', 'sports', 'gym things', () => {
    const b = m('treadmill', { view: 'side', edge: 'sharp' })
      .box([0.84, 0.16, 2.0], [0, 0.14, -0.1], { color: '#3a3f44', round: 0.3 })
      .box([0.56, 0.03, 1.8], [0, 0.235, -0.12], { color: '#1e1c1c' })
      .box([0.84, 0.26, 0.32], [0, 0.2, 0.95], { color: '#5c6166', round: 0.3 })
      .box([0.86, 0.32, 0.22], [0, 1.38, 0.74], { color: '#3a3f44', rot: [-30, 0, 0], round: 0.3 })
      .box([0.42, 0.16, 0.02], [0, 1.41, 0.835], { color: '#a8d8f5', rot: [-30, 0, 0], glow: true, name: 'screen', mover: { kind: 'light', on: false } });
    b.pair((s) => {
      b.cyl([0.1, 0.6, 0.1], [0, 0.18, s * 0.86 - 0.12], { color: '#9da3a8', rot: [0, 0, 90], name: `roller${s > 0 ? 'F' : 'B'}`, mover: { kind: 'spin', axis: 'x', amount: 720 } });
      b.box([0.06, 0.02, 1.7], [s * 0.3, 0.255, -0.12], { color: '#9da3a8' })
        .stick([s * 0.4, 0.2, 0.95], [s * 0.4, 1.28, 0.74], 0.07, '#9da3a8')
        .stick([s * 0.4, 1.05, 0.76], [s * 0.4, 1.05, 0.2], 0.05, '#9da3a8')
        .box([0.06, 0.06, 0.25], [s * 0.4, 1.05, 0.35], { color: '#2a2726', round: 0.4 });
    });
    return b
      .act({
        click: [
          [A.par(A.operate('screen', 'on'), A.operate('roller', 'on'), A.say('Beep! Whirrr...', 2)), A.wait(3), A.par(A.operate('roller', 'off'), A.operate('screen', 'off'))],
        ],
      })
      .done();
  }),
  // A pirate's treasure chest, open and brimming: gold coins and jewels, iron bands and a lock; the lid shuts with
  // a clunk and opens again to a sparkle.
  e('treasure', 'fantasy', 'treasure', () => {
    const b = m('treasure', { edge: 'sharp' })
      .box([0.8, 0.42, 0.5], [0, 0.21, 0], { color: '#8a5530', round: 0.06 })
      .ball([0.74, 0.22, 0.44], [0, 0.42, 0], { color: '#e2b23a', edge: 'soft' })
      .box([0.82, 0.12, 0.52], [0, 0.48, 0], { color: '#8a5530', round: 0.2, name: 'lid', pivot: [0, 0.42, -0.26], mover: { kind: 'swing', axis: 'x', amount: -110, on: true } })
      .loft([0.82, 0.18, 0.52], [0, 0.54, 0], [[0, 1, 1], [1, 1, 1]], { color: '#8a5530', rot: [0, 90, 0], cut: 'top', parent: 'lid' })
      .box([0.1, 0.12, 0.04], [0, 0.32, 0.26], { color: '#e2b23a' })
      .ball(0.08, [-0.15, 0.53, 0.08], { color: '#e0473b', edge: 'soft' })
      .ball(0.07, [0.18, 0.51, 0.1], { color: '#5aa553', edge: 'soft' })
      .ball(0.07, [0.02, 0.55, -0.05], { color: '#4e8fd6', edge: 'soft' })
      .torus([0.16, 0.16, 0.03], [0.25, 0.5, -0.05], { color: '#e2b23a', rot: [60, 0, 0], tube: 0.25 })
      .socket('hoard', [0, 0.5, 0], 'inside', { size: 0.6 });
    for (const [x0, z] of [[0.45, 0.4], [0.55, 0.3], [-0.5, 0.38], [0.35, 0.5]]) b.cyl([0.06, 0.01, 0.06], [x0, 0.005, z], { color: '#e2b23a' });
    b.pair((s) => b.box([0.06, 0.43, 0.52], [s * 0.3, 0.215, 0], { color: '#55595e' }).box([0.06, 0.13, 0.53], [s * 0.3, 0.49, 0], { color: '#55595e', parent: 'lid' }));
    return b.act({ click: [A.operate('lid', 'close'), A.say('Clunk!', 1), A.wait(1), A.operate('lid', 'open'), A.par(A.effect('sparkle', { dur: 1.8 }), A.say('Ting ting!', 1.4))] }).done();
  }),
  // A tree house in a big oak: a platform at 3 m on the trunk with a rail, a little hut with a shingle roof, a
  // door and a window, a rope ladder, and a rope swing hanging from a branch.
  e('tree house', 'places', 'houses', () => {
    const b = m('tree house', { edge: 'sharp' })
      .cyl([1.0, 6.5, 1.0], [0, 3.25, -0.6], { color: 'bark', taper: 0.7, edge: 'soft' })
      .rod([0, 5.2, -0.6], [-2.6, 7.0, -0.2], 0.4, 'bark', { edge: 'soft' })
      .rod([0, 5.6, -0.6], [2.4, 7.4, -0.8], 0.35, 'bark', { edge: 'soft' })
      .rod([0.1, 4.2, -0.4], [2.6, 4.9, 0.4], 0.28, 'bark', { edge: 'soft' })
      .ball([5.2, 3.2, 4.4], [0, 8.2, -0.8], { color: 'leaf', edge: 'soft' })
      .ball([3.0, 2.4, 2.8], [-2.6, 7.2, 0.2], { color: '#4e9448', edge: 'soft' })
      .ball([3.0, 2.4, 2.8], [2.6, 7.5, -0.4], { color: '#4e9448', edge: 'soft' })
      .box([3.0, 0.2, 2.8], [0, 3.0, 0.2], { color: '#b5814e' })
      .rod([0.4, 2.9, 1.4], [0, 1.4, -0.4], 0.16, '#7a5230').rod([-0.4, 2.9, 1.4], [0, 1.4, -0.4], 0.16, '#7a5230')
      .box([2.2, 1.9, 1.9], [0, 4.05, -0.1], { color: '#d8b07a' })
      .wedge([2.4, 1.0, 2.6], [0, 5.5, -0.1], { color: '#a3322a', rot: [0, 0, 0] });
    door(b, 'door', 0.7, 1.5, [-0.4, 3.1, 0.85], '#7a5230', { hinge: -1, frame: '#9a6a3a' });
    win(b, 0.55, 0.5, [0.55, 4.25, 0.85], 'front', '#9a6a3a');
    b.each(8, (i) => b.box([0.08, 0.6, 0.08], [-1.45 + i * 0.414, 3.4, 1.55], { color: '#9a6a3a' }));
    b.box([3.0, 0.08, 0.1], [0, 3.7, 1.55], { color: '#9a6a3a' });
    b.pair((s) => b.stick([0.9 + s * 0.22, 0, 1.75], [0.9 + s * 0.22, 3.0, 1.6], 0.04, 'tan'));
    b.each(7, (i) => b.stick([0.66, 0.3 + i * 0.4, 1.74 - i * 0.02], [1.14, 0.3 + i * 0.4, 1.74 - i * 0.02], 0.05, '#9a6a3a'));
    b.stick([2.1, 4.7, 0.2], [2.1, 0.7, 0.2], 0.03, 'tan', { name: 'swing', pivot: [2.1, 4.7, 0.2], piece: true })
      .stick([2.5, 4.8, 0.2], [2.5, 0.7, 0.2], 0.03, 'tan', { parent: 'swing' })
      .box([0.6, 0.06, 0.25], [2.3, 0.68, 0.2], { color: '#7a5230', parent: 'swing' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Creak!', 1.2), A.wait(2), A.operate('door', 'close')],
          [A.pose('swing', { rot: [30, 0, 0], dur: 0.6 }), A.par(A.pose('swing', { rot: [-30, 0, 0], dur: 0.9 }), A.say('Whoosh!', 1.2)), A.pose('swing', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A sawn tree stump 0.5 m tall: bark sides, growth rings on top, flaring roots, a little sprout and an axe stuck
  // in it that can be pulled out.
  e('tree stump', 'garden', 'trees', () => {
    const b = m('tree stump')
      .cyl([0.75, 0.5, 0.75], [0, 0.25, 0], { color: 'bark', taper: 0.9, name: 'stump' })
      .cyl([0.66, 0.02, 0.66], [0, 0.505, 0], { color: '#e0c08a' })
      .torus([0.46, 0.46, 0.01], [0, 0.516, 0], { color: '#b5814e', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([0.24, 0.24, 0.01], [0, 0.516, 0], { color: '#b5814e', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .rod([0.25, 0.5, 0.2], [0.29, 0.66, 0.24], 0.022, '#5aa553').ball([0.08, 0.04, 0.06], [0.31, 0.68, 0.24], { color: 'leaf' })
      .ball([0.08, 0.06, 0.08], [-0.3, 0.05, 0.38], { color: '#d23a2a' }).cyl([0.03, 0.05, 0.03], [-0.3, 0.02, 0.38], { color: 'cream' })
      .stick([-0.12, 0.47, 0.06], [-0.32, 0.88, 0.12], 0.035, 'wood', { name: 'axe', parent: 'stump', piece: true, edge: 'sharp' })
      .box([0.16, 0.09, 0.025], [-0.08, 0.5, 0.05], { color: '#9da3a8', rot: [0, 0, -25], parent: 'axe', edge: 'sharp' });
    for (const [x0, z] of around(5, 0.4, 0.4)) b.rod([x0 * 0.7, 0.14, z * 0.7], [x0 * 1.4, 0.07, z * 1.4], 0.14, 'bark');
    return b.act({ click: [[A.say('Shhunk!', 1.2), A.detach('axe', 'axe')], [A.reattach('axe'), A.say('Thwack!', 1.2)]] }).done();
  }),
  // A glittering gold star to crown a Christmas tree, on its spiral spring; it lights up and twinkles.
  e('tree topper', 'toys', 'christmas', () =>
    m('tree topper')
      .cyl([0.06, 0.14, 0.06], [0, 0.07, 0], { color: '#e2b23a', taper: 0.4 })
      .ball(0.05, [0, 0.15, 0], { color: '#e2b23a' })
      .star(0.24, [0, 0.27, 0], { color: '#f6d24a', name: 'star' })
      .ball(0.05, [0, 0.27, 0.025], { color: '#fff7c0', glow: true, name: 'glow', mover: { kind: 'light', on: false } })
      .act({ click: [A.par(A.operate('glow', 'on'), A.effect('sparkle', { dur: 2 }), A.say('Twinkle!', 1.5)), A.wait(1.5), A.operate('glow', 'off')] })
      .done(),
  ),
  // A tall dead trunk 5 m high with broken branch stubs and a hollow; two eyes light up in the hole and hoot.
  e('tree trunk', 'garden', 'trees', () => {
    const b = m('tree trunk')
      .cyl([1.0, 4.8, 1.0], [0, 2.4, 0], { color: 'bark', taper: 0.72 })
      .cyl([0.74, 0.04, 0.74], [0, 4.8, 0], { color: '#d8b07a' })
      .rod([0.25, 3.0, 0], [0.9, 3.6, 0.1], 0.2, 'bark').rod([-0.3, 2.2, 0.05], [-0.85, 2.7, 0.15], 0.18, 'bark')
      .ball([0.36, 0.5, 0.2], [0.05, 2.0, 0.42], { color: '#2a1e14' })
      .ball(0.08, [-0.04, 2.08, 0.5], { color: '#f6d24a', glow: true, name: 'eyeL', mover: { kind: 'light', on: false } })
      .ball(0.08, [0.14, 2.08, 0.5], { color: '#f6d24a', glow: true, name: 'eyeR', mover: { kind: 'light', on: false } });
    for (const [x0, z] of around(5, 0.5, 0.3)) b.rod([x0, 0.25, z], [x0 * 2, 0.11, z * 2], 0.22, 'bark');
    return b.act({ click: [A.par(A.operate('eye', 'on'), A.say('Hoo-hoo!', 1.6)), A.wait(1.8), A.operate('eye', 'off')] }).done();
  }),
  // A steel triangle hanging by a red cord from a little stand, with its beater: struck, it rings.
  e('triangle (music)', 'music', 'percussion', () =>
    m('triangle (music)', { edge: 'sharp' })
      .box([0.28, 0.025, 0.12], [0, 0.0125, 0], { color: '#7a5230' })
      .stick([-0.13, 0.02, 0], [-0.13, 0.33, 0], 0.016, '#7a5230').stick([-0.13, 0.33, 0], [0.02, 0.33, 0], 0.014, '#7a5230')
      .stick([0.02, 0.33, 0], [0.02, 0.26, 0], 0.003, '#c0392b', { name: 'tri', pivot: [0.02, 0.33, 0] })
      .stick([-0.06, 0.07, 0], [0.1, 0.07, 0], 0.01, '#c9ccd1', { parent: 'tri' })
      .stick([-0.06, 0.07, 0], [0.02, 0.25, 0], 0.01, '#c9ccd1', { parent: 'tri' })
      .stick([0.1, 0.07, 0], [0.032, 0.22, 0], 0.01, '#c9ccd1', { parent: 'tri' })
      .stick([0.08, 0.14, 0.06], [0.2, 0.2, 0.08], 0.007, 'silver', { name: 'beater', pivot: [0.2, 0.2, 0.08], piece: true })
      .act({ click: [A.pose('beater', { rot: [0, 0, -15], dur: 0.12 }), A.par(A.pose('beater', { rot: [0, 0, 0], dur: 0.12 }), A.pose('tri', { rot: [0, 0, 8], dur: 0.12 }), A.say('Ting-a-ling!', 1.5)), A.pose('tri', { rot: [0, 0, -6], dur: 0.2 }), A.pose('tri', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A flat red triangle tile on a wooden stand, from the shape set; it wobbles and sparkles.
  e('triangle (shape)', 'ideas', 'shapes', () =>
    m('triangle (shape)', { edge: 'sharp' })
      .box([0.11, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' })
      .wedge([0.1, 0.09, 0.025], [0, 0.065, 0], { color: '#e0473b', name: 'shape', pivot: [0, 0.02, 0] })
      .act({ click: [A.pose('shape', { rot: [0, 0, 12], dur: 0.15 }), A.pose('shape', { rot: [0, 0, -12], dur: 0.15 }), A.par(A.pose('shape', { rot: [0, 0, 0], dur: 0.15 }), A.effect('sparkle', { dur: 1 }))] })
      .done(),
  ),
  // A child's tricycle 0.65 m tall: a big pedalled front wheel, two back wheels on an axle, a saddle, handlebars
  // with grips and streamers, a bell and a step at the back.
  e('tricycle', 'garage', 'bikes', () => {
    const b = m('tricycle', { view: 'side' });
    wheel(b, 'wheelF', 0.45, 0.07, [0, 0.225, 0.38], '#e0473b');
    b.pair((s) => b.box([0.05, 0.02, 0.1], [s * 0.08, 0.225, 0.38], { color: '#2a2726', parent: 'wheelF', edge: 'sharp' }).stick([s * 0.045, 0.225, 0.38], [s * 0.08, 0.225, 0.38], 0.015, 'silver', { parent: 'wheelF' }));
    axle2(b, 'B', 0.3, 0.06, 0.5, -0.3, '#e0473b');
    return b
      .rod([0, 0.44, 0.33], [0, 0.32, -0.25], 0.05, '#e0473b')
      .stick([-0.26, 0.15, -0.3], [0.26, 0.15, -0.3], 0.03, '#e0473b')
      .stick([0, 0.225, 0.38], [0, 0.6, 0.32], 0.035, '#e0473b')
      .stick([-0.2, 0.62, 0.3], [0.2, 0.62, 0.3], 0.025, 'silver')
      .capsule([0.035, 0.08, 0.035], [0.22, 0.62, 0.3], { color: 'white', rot: [0, 0, 90] })
      .capsule([0.035, 0.08, 0.035], [-0.22, 0.62, 0.3], { color: 'white', rot: [0, 0, 90] })
      .stick([0.26, 0.62, 0.3], [0.3, 0.5, 0.26], 0.01, '#f4a1c0').stick([-0.26, 0.62, 0.3], [-0.3, 0.5, 0.26], 0.01, '#4e8fd6')
      .dome([0.05, 0.03, 0.05], [0.1, 0.645, 0.3], { color: 'silver' })
      .stick([0, 0.32, -0.08], [0, 0.45, -0.08], 0.03, 'silver')
      .box([0.17, 0.05, 0.2], [0, 0.47, -0.08], { color: '#2a2726', round: 0.5 })
      .box([0.42, 0.03, 0.12], [0, 0.17, -0.42], { color: 'silver', edge: 'sharp' })
      .socket('seat', [0, 0.5, -0.08], 'seat')
      .act({ click: [A.par(A.pose('wheelF', { rot: [720, 0, 0], dur: 1.2 }), A.say('Ring ring!', 1.4)), A.pose('wheelF', { rot: [0, 0, 0], dur: 0 })] })
      .done();
  }),
  // Poseidon's golden trident, 1.8 m, standing in a sea rock: barbed prongs; it calls up the waves.
  e('trident', 'armory', 'spears', () => {
    const b = m('trident')
      .ball([0.5, 0.3, 0.42], [0, 0.12, 0], { color: '#7f8a86' })
      .ball([0.3, 0.16, 0.26], [0.18, 0.08, 0.1], { color: '#6e7a76' })
      .stick([0, 0.15, 0], [0, 1.5, 0], 0.035, 'gold', { name: 'shaft', edge: 'sharp' })
      .ball(0.06, [0, 1.47, 0], { color: 'gold', parent: 'shaft' })
      .arc([0.32, 0.18, 0.035], [0, 1.52, 0], { color: 'gold', arc: 180, rot: [0, 0, 180], tube: 0.18, parent: 'shaft', edge: 'sharp' })
      .stick([0, 1.5, 0], [0, 1.78, 0], 0.03, 'gold', { parent: 'shaft', edge: 'sharp' })
      .cone([0.06, 0.12, 0.025], [0, 1.83, 0], { color: 'gold', parent: 'shaft', edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.14, 1.52, 0], [s * 0.14, 1.7, 0], 0.028, 'gold', { parent: 'shaft', edge: 'sharp' }).cone([0.06, 0.12, 0.025], [s * 0.14, 1.75, 0], { color: 'gold', parent: 'shaft', edge: 'sharp' }).cone([0.03, 0.05, 0.02], [s * 0.165, 1.69, 0], { color: 'gold', rot: [0, 0, s * 140], parent: 'shaft', edge: 'sharp' }));
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 2 }), A.anim('shake'), A.say('Sploosh!', 1.5))] }).done();
  }),
  // A camera on a tripod, 1.5 m: three telescoping legs, a centre column, a pan head with a handle; the camera pans
  // and its flash fires.
  e('tripod', 'tech', 'camera gear', () => {
    const b = m('tripod', { edge: 'sharp' })
      .stick([0, 0.95, 0], [0, 1.28, 0], 0.04, '#2a2726')
      .box([0.12, 0.07, 0.12], [0, 1.0, 0], { color: '#2a2726', round: 0.3 })
      .box([0.08, 0.05, 0.08], [0, 1.31, 0], { color: '#3a3633', name: 'head' })
      .box([0.18, 0.12, 0.1], [0, 1.4, 0], { color: '#2a2726', round: 0.2, parent: 'head' })
      .cyl([0.085, 0.09, 0.085], [0, 1.4, 0.09], { color: '#3a3633', rot: [90, 0, 0], parent: 'head' })
      .cyl([0.065, 0.01, 0.065], [0, 1.4, 0.137], { color: 'glass', rot: [90, 0, 0], parent: 'head' })
      .box([0.05, 0.03, 0.03], [0.05, 1.475, 0.0], { color: '#3a3633', parent: 'head' })
      .box([0.05, 0.025, 0.012], [-0.05, 1.47, 0.045], { color: '#fffbe8', glow: true, name: 'flash', parent: 'head', mover: { kind: 'light', on: false } })
      .stick([0, 1.31, -0.04], [0, 1.25, -0.28], 0.018, '#2a2726', { parent: 'head' });
    around(3, 0.5, Math.PI / 2).forEach(([x0, z]) => b.stick([0, 0.98, 0], [x0 * 0.5, 0.5, z * 0.5], 0.03, '#3a3633').stick([x0 * 0.5, 0.5, z * 0.5], [x0, 0.02, z], 0.022, '#9da3a8').ball(0.03, [x0, 0.015, z], { color: 'rubber' }));
    return b
      .act({ click: [A.pose('head', { rot: [0, 30, 0], dur: 0.4 }), A.pose('head', { rot: [0, -20, 0], dur: 0.5 }), A.pose('head', { rot: [0, 0, 0], dur: 0.3 }), A.par(A.operate('flash', 'on'), A.say('Click!', 1)), A.wait(0.2), A.operate('flash', 'off')] })
      .done();
  }),
  // The Trojan horse, 10.5 m of planked wood on a wheeled platform: a hatch in its side drops open and a soldier
  // jumps out.
  e('trojan horse', 'fantasy', 'myths', () => {
    const W = '#b5814e', D = '#7a5230';
    const b = m('trojan horse', { view: 'side', edge: 'sharp' })
      .box([4.2, 0.6, 9], [0, 1.0, 0], { color: D, round: 0.05 })
      .loft([2.8, 3.2, 6.6], [0, 5.7, -0.2], [[0, 0.7, 0.75, 0.05], [0.12, 0.95, 0.95, 0], [0.6, 1, 1, 0], [0.9, 0.9, 0.95, 0.04], [1, 0.62, 0.75, 0.08]], { color: W, boxy: 0.55, name: 'body', edge: 'soft' })
      .loft([1.3, 1.6, 3.4], [0, 8.1, 3.4], [[0, 1, 1, 0], [1, 0.75, 0.8, 0]], { color: W, rot: [-48, 0, 0], boxy: 0.5, edge: 'soft' })
      .box([1.15, 1.25, 2.4], [0, 9.4, 4.6], { color: W, rot: [25, 0, 0], round: 0.35, edge: 'soft' })
      .box([0.22, 1.4, 2.8], [0, 8.6, 2.85], { color: D, rot: [-48, 0, 0] })
      .rod([0, 6.4, -3.4], [0, 4.0, -4.3], 0.35, D)
      .box([0.06, 1.3, 1.7], [1.42, 5.1, -0.1], { color: D, name: 'hatch', pivot: [1.42, 4.45, -0.1], mover: { kind: 'swing', axis: 'z', amount: -85 } });
    b.pair((s) => {
      b.cone([0.3, 0.6, 0.3], [s * 0.35, 10.25, 4.05], { color: W, rot: [-15, 0, 0] })
        .ball([0.22, 0.26, 0.1], [s * 0.58, 9.6, 5.0], { color: '#2a1e14' })
        .box([0.06, 0.06, 6.2], [s * 1.36, 5.9, -0.2], { color: D, noInk: true })
        .box([0.06, 0.06, 6.0], [s * 1.38, 4.9, -0.2], { color: D, noInk: true });
      for (const z of [2.0, -2.4]) b.box([0.75, 3.4, 0.75], [s * 0.85, 2.9, z], { color: W, round: 0.15 }).box([0.85, 0.3, 0.85], [s * 0.85, 1.4, z], { color: D });
      for (const z of [3.2, -3.2]) {
        const n = `wheel${z > 0 ? 'F' : 'B'}${s > 0 ? 'L' : 'R'}`;
        b.cyl([1.5, 0.3, 1.5], [s * 2.2, 0.75, z], { color: D, rot: [0, 0, 90], name: n }).box([0.32, 1.3, 0.16], [s * 2.2, 0.75, z], { color: W, parent: n }).box([0.32, 0.16, 1.3], [s * 2.2, 0.75, z], { color: W, parent: n });
      }
    });
    return b
      .act({
        click: [
          [A.operate('hatch', 'open'), A.spawn('greek', 'knight', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('arms_up', 1, 'greek'), A.say('Surprise!', 1.8, 'greek')), A.wait(1.5), A.remove('greek', 'fade'), A.operate('hatch', 'close')],
          [A.par(A.anim('wobble'), A.say('Creak... creak...', 1.6))],
        ],
      })
      .done();
  }),
  // A trombone resting on its stand, 1.2 m of brass lying along its length: a flared bell, the tuning bow and the
  // hand slide that pushes out and back.
  e('trombone', 'music', 'brass', () =>
    m('trombone', { view: 'side', edge: 'sharp' })
      .cyl([0.3, 0.03, 0.3], [0, 0.015, 0], { color: '#2a2726' })
      .stick([0, 0.03, 0], [0, 0.42, 0], 0.025, '#2a2726')
      .box([0.08, 0.04, 0.12], [0, 0.42, 0], { color: '#2a2726', round: 0.3 })
      .stick([0, 0.66, -0.45], [0, 0.66, 0.25], 0.026, 'brass')
      .cyl([0.22, 0.3, 0.22], [0, 0.66, 0.38], { color: 'brass', rot: [-90, 0, 0], taper: 0.12 })
      .arc([0.15, 0.15, 0.026], [0, 0.6, -0.45], { color: 'brass', arc: 180, rot: [-90, 90, 0], tube: 0.2 })
      .stick([0, 0.54, -0.45], [0, 0.54, 0.0], 0.022, 'brass')
      .stick([0, 0.46, -0.32], [0, 0.46, 0.0], 0.022, 'brass')
      .cone([0.03, 0.07, 0.03], [0, 0.46, -0.36], { color: 'silver', rot: [-90, 0, 0] })
      .stick([0, 0.54, -0.1], [0, 0.66, -0.1], 0.012, 'brass')
      .stick([0, 0.54, -0.02], [0, 0.46, -0.02], 0.012, 'brass')
      .stick([0, 0.54, 0.0], [0, 0.54, 0.45], 0.03, '#e6c068', { name: 'slide', mover: { kind: 'slide', axis: 'z', amount: 0.35 } })
      .stick([0, 0.46, 0.0], [0, 0.46, 0.45], 0.03, '#e6c068', { parent: 'slide' })
      .arc([0.11, 0.1, 0.03], [0, 0.5, 0.45], { color: '#e6c068', arc: 180, rot: [90, 90, 0], tube: 0.27, parent: 'slide' })
      .stick([0, 0.54, 0.36], [0, 0.46, 0.36], 0.012, '#e6c068', { parent: 'slide' })
      .act({ click: [A.par(A.operate('slide', 'out'), A.say('Wah-wah-wahhh!', 2)), A.wait(0.6), A.operate('slide', 'in')] })
      .done(),
  ),
  // A golden trophy cup, 0.5 m: a wooden plinth with an engraved plaque, a stepped base, a stem, a two-handled
  // cup that turns and gleams.
  e('trophy', 'sports', 'awards', () => {
    const b = m('trophy', { edge: 'sharp' })
      .box([0.2, 0.09, 0.2], [0, 0.045, 0], { color: '#7a5230' })
      .box([0.14, 0.05, 0.004], [0, 0.045, 0.101], { color: 'gold' })
      .label('CHAMPION', [0.12, 0.03], [0, 0.045, 0.104], { color: 'gold', depth: 0.002 })
      .box([0.15, 0.05, 0.15], [0, 0.115, 0], { color: '#2a2726' })
      .cyl([0.1, 0.03, 0.1], [0, 0.155, 0], { color: 'gold', edge: 'soft' })
      .cyl([0.035, 0.1, 0.035], [0, 0.22, 0], { color: 'gold', edge: 'soft' })
      .ball(0.06, [0, 0.27, 0], { color: 'gold', edge: 'soft' })
      .cyl([0.13, 0.19, 0.13], [0, 0.385, 0], { color: 'gold', taper: 1.55, name: 'cup', edge: 'soft' })
      .torus([0.2, 0.2, 0.01], [0, 0.48, 0], { color: '#f0c850', rot: [90, 0, 0], tube: 0.06, parent: 'cup' });
    b.pair((s) => b.arc([0.12, 0.16, 0.022], [s * 0.115, 0.39, 0], { color: 'gold', arc: 200, rot: [0, 0, s * -90], tube: 0.18, parent: 'cup' }));
    return b.act({ click: [A.par(A.pose('cup', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1.5 }), A.say('Ding!', 1)), A.pose('cup', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A galvanised water trough on legs, 1.6 m long; a pig trots up for a drink.
  e('trough', 'farm', 'farm things', () => {
    const b = m('trough', { edge: 'sharp' })
      .loft([0.64, 0.64, 1.6], [0, 0.66, 0], [[0, 1, 1, 0], [1, 1, 1, 0]], { color: '#9da3a8', rot: [0, 90, 0], cut: 'bottom', boxy: 0.6, name: 'tub' })
      .box([1.56, 0.01, 0.56], [0, 0.6, 0], { color: '#4f9bd6', name: 'water', piece: true })
      .box([1.62, 0.04, 0.05], [0, 0.66, 0.31], { color: '#b4b8be', round: 0.5 })
      .box([1.62, 0.04, 0.05], [0, 0.66, -0.31], { color: '#b4b8be', round: 0.5 });
    b.pair((s) => b.stick([s * 0.6, 0, 0.22], [s * 0.6, 0.4, 0.22], 0.05, '#5c6166').stick([s * 0.6, 0, -0.22], [s * 0.6, 0.4, -0.22], 0.05, '#5c6166').stick([s * 0.6, 0.38, -0.24], [s * 0.6, 0.38, 0.24], 0.04, '#5c6166').box([0.03, 0.3, 0.6], [s * 0.79, 0.5, 0], { color: '#8a9096' }));
    return b
      .act({
        click: [
          [A.spawn('piggy', 'pig', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.anim('hop', 1, 'piggy'), A.say('Oink oink!', 1.5, 'piggy')), A.wait(1.5), A.remove('piggy', 'fade')],
          [A.par(A.pose('water', { rot: [6, 0, 0], dur: 0.2 }), A.effect('water_spray', { dur: 1 }), A.say('Slosh!', 1)), A.pose('water', { rot: [-5, 0, 0], dur: 0.25 }), A.pose('water', { rot: [0, 0, 0], dur: 0.25 })],
        ],
      })
      .done();
  }),
  // A lorry at real size, 8.6 m long and 3.7 m tall: a cab-over cab with a big windscreen, doors with steps and
  // mirrors, a box body open at the back behind a roller shutter (crates inside), dual rear wheels.
  e('truck', 'garage', 'trucks', () => {
    const C = '#2f6fc0';
    const b = m('truck', { view: 'side', edge: 'sharp' })
      .box([1.0, 0.3, 8.2], [0, 0.78, -0.1], { color: '#2a2726' })
      .box([2.45, 2.6, 2.2], [0, 1.95, 3.15], { color: C, round: 0.08 })
      .box([2.2, 1.05, 0.06], [0, 2.55, 4.26], { color: 'glass', round: 0.1 })
      .box([1.7, 0.5, 0.05], [0, 1.25, 4.26], { color: '#3a3633' })
      .box([2.5, 0.35, 0.3], [0, 0.85, 4.3], { color: '#5c6166', round: 0.2 })
      .box([2.2, 0.45, 1.6], [0, 3.48, 3.0], { color: C, round: 0.3 })
      .cyl([0.5, 0.9, 0.5], [1.0, 0.85, 1.2], { color: 'silver', rot: [90, 0, 0] })
      .box([2.3, 0.08, 5.8], [0, 0.95, -1.1], { color: '#5c6166' })
      .box([2.3, 0.1, 5.8], [0, 3.7, -1.1], { color: 'white', round: 0.2 })
      .box([2.3, 2.75, 0.1], [0, 2.32, 1.75], { color: 'white' })
      .box([0.1, 2.75, 5.8], [1.2, 2.32, -1.1], { color: 'white' })
      .box([0.1, 2.75, 5.8], [-1.2, 2.32, -1.1], { color: 'white' })
      .box([2.3, 0.3, 0.12], [0, 3.6, -4.0], { color: '#5c6166' })
      .box([2.3, 2.3, 0.06], [0, 2.3, -4.02], { color: '#d4d7da', name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 2.2 } })
      .box([0.9, 0.8, 0.9], [0.5, 1.4, -3.2], { color: '#b5814e' })
      .box([0.8, 0.7, 0.8], [-0.55, 1.35, -3.0], { color: '#d8b07a' })
      .box([0.7, 0.6, 0.7], [0.4, 2.1, -3.3], { color: '#d8b07a' })
      .box([2.2, 0.15, 0.15], [0, 0.55, -4.1], { color: '#5c6166' })
      .label('FRESH FOODS', [3.6, 0.8], [1.26, 2.5, -1.1], { color: C, rot: [0, 90, 0], depth: 0.02 })
      .label('FRESH FOODS', [3.6, 0.8], [-1.26, 2.5, -1.1], { color: C, rot: [0, -90, 0], depth: 0.02 })
      .socket('cargo', [0, 1.1, -2.0], 'inside', { size: 2 })
      .socket('seat', [0.6, 1.7, 3.2], 'seat');
    b.each(6, (i) => b.box([2.3, 0.03, 0.03], [0, 1.35 + i * 0.35, -4.06], { color: '#9da3a8', parent: 'shutter', noInk: true }));
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([0.06, 1.7, 1.2], [s * 1.23, 2.05, 3.3], { color: C, round: 0.1, name: n, pivot: [s * 1.23, 2.05, 3.9], mover: { kind: 'swing', axis: 'y', amount: -s * 70 } })
        .box([0.04, 0.7, 0.95], [s * 1.26, 2.5, 3.3], { color: 'glass', parent: n })
        .box([0.4, 0.06, 0.3], [s * 1.0, 0.65, 3.3], { color: '#5c6166' })
        .stick([s * 1.22, 2.6, 4.1], [s * 1.42, 2.6, 4.2], 0.04, '#2a2726').box([0.08, 0.4, 0.22], [s * 1.46, 2.5, 4.2], { color: '#2a2726', round: 0.3 })
        .ball([0.3, 0.22, 0.08], [s * 0.85, 1.2, 4.28], { color: '#fff6c8', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: true } })
        .box([0.2, 0.3, 0.05], [s * 1.0, 0.9, -4.18], { color: '#e0473b', glow: true })
        .arc([1.2, 1.2, 0.4], [s * 1.05, 0.55, 2.95], { color: C, arc: 170, rot: [0, 90, 0], tube: 0.1 });
    });
    axle2(b, 'F', 1.0, 0.34, 2.0, 2.95);
    axle2(b, 'B', 1.0, 0.6, 1.8, -2.4);
    return b
      .act({
        click: [
          [A.par(A.anim('shake'), A.say('HONK!', 1.4)), A.operate('lamp', 'off'), A.wait(0.3), A.operate('lamp', 'on'), A.wait(0.3), A.operate('lamp', 'off'), A.wait(0.3), A.operate('lamp', 'on')],
          [A.operate('shutter', 'up'), A.say('Rrrrattle!', 1.5), A.wait(2.5), A.operate('shutter', 'down')],
        ],
      })
      .done();
  }),
  // Two cocoa-dusted chocolate truffles in fluted paper cups; one twirls in a puff of cocoa.
  e('truffle', 'food', 'sweets', () => {
    const b = m('truffle');
    for (const [x0, z, c, n] of [[0, 0, 'chocolate', 'truffle1'], [0.05, -0.03, '#7a4a2a', 'truffle2']] as Array<[number, number, string, string]>) {
      b.cyl([0.04, 0.02, 0.04], [x0, 0.01, z], { color: '#4a3020', taper: 1.3 })
        .torus([0.054, 0.054, 0.008], [x0, 0.02, z], { color: '#4a3020', rot: [90, 0, 0], tube: 0.2 })
        .ball([0.044, 0.04, 0.044], [x0, 0.036, z], { color: c, name: n, ...(n === 'truffle1' ? { piece: true } : {}) });
    }
    b.rod([-0.018, 0.048, 0.012], [0.018, 0.05, 0.014], 0.004, 'cream', { parent: 'truffle1', noInk: true }).rod([-0.018, 0.04, 0.019], [0.018, 0.042, 0.018], 0.004, 'cream', { parent: 'truffle1', noInk: true });
    return b.act({ click: [A.par(A.pose('truffle1', { rot: [0, 360, 0], move: [0, 0.02, 0], dur: 0.6 }), A.effect('dust', { dur: 1 }), A.say('Puff!', 1)), A.pose('truffle1', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A trumpet lying on its side at its real 0.48 m: lead pipe, three valves with pearl buttons, a tuning slide and
  // a flared bell; the valves go down as it plays.
  e('trumpet', 'music', 'brass', () => {
    const b = m('trumpet', { view: 'side', edge: 'sharp' })
      .stick([0, 0.035, -0.22], [0, 0.035, 0.16], 0.022, 'brass')
      .stick([0, 0.095, -0.16], [0, 0.095, 0.22], 0.022, 'brass')
      .cyl([0.12, 0.17, 0.12], [0, 0.085, 0.3], { color: 'brass', rot: [-90, 0, 0], taper: 0.15 })
      .torus([0.085, 0.085, 0.022], [0, 0.065, -0.2], { color: 'brass', rot: [0, 90, 0], tube: 0.26 })
      .torus([0.07, 0.07, 0.022], [0, 0.065, 0.16], { color: 'brass', rot: [0, 90, 0], tube: 0.3 })
      .cone([0.025, 0.05, 0.025], [0, 0.035, -0.25], { color: 'silver', rot: [90, 0, 0] });
    b.each(3, (i) => b.cyl([0.03, 0.12, 0.03], [0, 0.08, -0.05 + i * 0.045], { color: 'silver' }).cyl([0.034, 0.018, 0.034], [0, 0.15, -0.05 + i * 0.045], { color: '#f3eee0', name: `valve${i + 1}`, mover: { kind: 'slide', axis: 'y', amount: -0.015 } }));
    return b.act({ click: [A.operate('valve1', 'down'), A.operate('valve1', 'up'), A.operate('valve2', 'down'), A.operate('valve2', 'up'), A.par(A.operate('valve3', 'down'), A.say('Toot-toot-tooo!', 1.6)), A.operate('valve3', 'up')] }).done();
  }),
  // A tuba standing on its coils, 1.0 m: the big wrap, four valves, a mouthpiece and a wide bell facing up.
  e('tuba', 'music', 'brass', () => {
    const b = m('tuba', { edge: 'sharp' })
      .torus([0.55, 0.6, 0.18], [0, 0.45, 0], { color: 'brass', tube: 0.3, edge: 'soft' })
      .ball([0.3, 0.2, 0.2], [0, 0.12, 0], { color: 'brass', edge: 'soft' })
      .cyl([0.2, 0.35, 0.2], [0.12, 0.62, -0.05], { color: 'brass', taper: 1.3, edge: 'soft' })
      .cyl([0.5, 0.42, 0.5], [0.12, 0.98, -0.05], { color: 'brass', taper: 1.9, name: 'bell', edge: 'soft' })
      .cyl([0.86, 0.02, 0.86], [0.12, 1.19, -0.05], { color: '#3a2a10', noInk: true })
      .torus([0.95, 0.95, 0.03], [0.12, 1.19, -0.05], { color: 'brass', rot: [90, 0, 0], tube: 0.04 })
      .rod([-0.2, 0.55, 0.1], [-0.35, 0.72, 0.15], 0.025, 'brass')
      .cone([0.05, 0.06, 0.05], [-0.36, 0.75, 0.15], { color: 'silver', rot: [180, 0, 0] });
    b.each(4, (i) => b.cyl([0.045, 0.16, 0.045], [-0.1 + i * 0.055, 0.6, 0.12], { color: 'silver' }).cyl([0.05, 0.03, 0.05], [-0.1 + i * 0.055, 0.69, 0.12], { color: '#f3eee0' }));
    return b.act({ click: [A.par(A.pose('bell', { scale: 1.08, dur: 0.2 }), A.say('Oom-pah-pah!', 1.8)), A.pose('bell', { scale: 1, dur: 0.2 }), A.pose('bell', { scale: 1.08, dur: 0.2 }), A.pose('bell', { scale: 1, dur: 0.2 })] }).done();
  }),
  // A wooden rack of three test tubes with coloured liquids; one lifts out, swirls and fizzes.
  e('tube', 'study', 'lab gear', () => {
    const b = m('tube', { edge: 'sharp' }).box([0.2, 0.02, 0.07], [0, 0.01, 0], { color: 'wood' }).box([0.2, 0.015, 0.07], [0, 0.09, 0], { color: 'wood' });
    b.pair((s) => b.box([0.015, 0.09, 0.07], [s * 0.095, 0.055, 0], { color: 'wood' }));
    (['#e0473b', '#9be34d', '#4e8fd6'] as const).forEach((c, i) => {
      const x0 = (i - 1) * 0.05, n = `tube${i + 1}`;
      b.capsule([0.022, 0.07, 0.022], [x0, 0.056, 0], { color: c, name: n, edge: 'soft', piece: true })
        .cyl([0.022, 0.09, 0.022], [x0, 0.125, 0], { color: 'glass', parent: n })
        .torus([0.026, 0.026, 0.006], [x0, 0.17, 0], { color: 'glass', rot: [90, 0, 0], parent: n });
    });
    return b.act({ click: [A.pose('tube2', { move: [0, 0.1, 0.03], dur: 0.35 }), A.pose('tube2', { move: [0, 0.1, 0.03], rot: [0, 0, 20], dur: 0.2 }), A.par(A.pose('tube2', { move: [0, 0.1, 0.03], rot: [0, 0, -20], dur: 0.2 }), A.effect('steam', { dur: 1.2 }), A.say('Bloop!', 1.2)), A.pose('tube2', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 })] }).done();
  }),
  // A tumbleweed, 0.7 m: a tangle of dry twigs round a ball; it rolls away in the dust and back.
  e('tumbleweed', 'nature', 'desert', () => {
    const b = m('tumbleweed').ball([0.62, 0.56, 0.62], [0, 0.36, 0], { color: '#b08850', name: 'weed', piece: true });
    b.each(6, (i) => b.torus([0.66, 0.6, 0.035], [0, 0.36, 0], { color: '#7a5a30', rot: [i * 30, i * 60, i * 20], tube: 0.06, parent: 'weed', noInk: true }));
    for (const [x0, z] of around(6, 0.32, 0.5)) b.rod([x0 * 0.8, 0.4 + z * 0.3, z * 0.8], [x0 * 1.15, 0.45 + z * 0.5, z * 1.15], 0.02, '#7a5a30', { parent: 'weed' });
    return b.act({ click: [A.par(A.pose('weed', { rot: [0, 0, -540], move: [2.2, 0, 0], dur: 1.6 }), A.effect('dust', { dur: 1.6 })), A.pose('weed', { rot: [0, 0, 0], move: [0, 0, 0], dur: 1.6 })] }).done();
  }),
  // A lumpy growth (a model, as in a doctor's drawer); it throbs.
  e('tumour', 'clinic', 'illness', () => {
    const b = m('tumour');
    const lumps: Array<[number, number, number, number]> = [[0, 0.035, 0, 0.07], [0.035, 0.03, 0.01, 0.05], [-0.032, 0.028, 0.012, 0.05], [0.01, 0.065, 0.005, 0.045], [-0.01, 0.025, -0.03, 0.05], [0.02, 0.022, 0.035, 0.04]];
    lumps.forEach(([x0, y, z, s], i) => b.ball([s, s * 0.9, s], [x0, y, z], { color: i % 2 ? '#d46a7a' : '#e58a8a', ...(i === 0 ? { name: 'mass' } : { parent: 'mass' }) }));
    return b.rod([-0.02, 0.05, 0.03], [0.02, 0.06, 0.035], 0.003, 'darkred', { noInk: true, parent: 'mass' }).rod([0.03, 0.04, 0.03], [0.04, 0.02, 0.03], 0.003, 'darkred', { noInk: true, parent: 'mass' })
      .act({ click: [A.pose('mass', { scale: 1.12, dur: 0.25 }), A.pose('mass', { scale: 1, dur: 0.25 }), A.pose('mass', { scale: 1.12, dur: 0.25 }), A.par(A.pose('mass', { scale: 1, dur: 0.25 }), A.say('Throb... throb...', 1.5))] })
      .done();
  }),
  // A bowl of tuna salad on lettuce with cherry tomatoes and cucumber, a fork that dives in.
  e('tuna salad', 'food', 'salads', () => {
    const b = m('tuna salad')
      .cyl([0.12, 0.05, 0.12], [0, 0.025, 0], { color: 'white', taper: 1.45 })
      .ball([0.17, 0.035, 0.17], [0, 0.056, 0], { color: 'lettuce' })
      .ball([0.12, 0.06, 0.12], [0, 0.072, 0], { color: '#e8d6b0' })
      .ball([0.03, 0.026, 0.03], [0.06, 0.072, 0.03], { color: 'tomato' }).ball([0.03, 0.026, 0.03], [-0.06, 0.072, 0.02], { color: 'tomato' })
      .cyl([0.03, 0.008, 0.03], [0.02, 0.07, -0.06], { color: '#cfe8a8', rot: [20, 0, 0] })
      .stick([0.03, 0.09, 0.0], [0.13, 0.17, 0.03], 0.008, 'silver', { name: 'fork', piece: true, edge: 'sharp', pivot: [0.13, 0.17, 0.03] })
      .box([0.025, 0.004, 0.035], [0.025, 0.088, -0.005], { color: 'silver', rot: [0, 0, 40], parent: 'fork', edge: 'sharp' });
    for (const [x0, z] of around(6, 0.03)) b.box([0.01, 0.006, 0.01], [x0, 0.101, z], { color: x0 > 0 ? 'lime' : '#5c6166', noInk: true });
    return b.act({ click: [A.pose('fork', { rot: [0, 0, 25], dur: 0.25 }), A.par(A.pose('fork', { rot: [0, 0, -10], move: [0, 0.03, 0], dur: 0.3 }), A.say('Nom nom!', 1.2)), A.pose('fork', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A tuna sandwich cut corner to corner: one half lying flat, the other leaning on it showing tuna, lettuce and
  // tomato; its top slice lifts for a peek.
  e('tuna sandwich', 'food', 'sandwiches', () => {
    const b = m('tuna sandwich').cyl([0.24, 0.008, 0.2], [0, 0.004, 0], { color: 'white' });
    const layer = (y: number, h: number, c: string, o: { name?: string; pivot?: V } = {}) => b.wedge([0.12, 0.12, h], [-0.035, y, 0.01], { color: c, rot: [90, 0, 0], apex: -0.5, ...o });
    layer(0.016, 0.014, 'bread');
    layer(0.027, 0.006, 'lettuce');
    layer(0.035, 0.012, '#e8d6b0');
    layer(0.044, 0.005, 'tomato');
    layer(0.053, 0.014, 'bread', { name: 'lid', pivot: [-0.095, 0.06, 0.01] });
    b.wedge([0.124, 0.124, 0.042], [0.05, 0.068, -0.02], { color: 'crust', rot: [0, 0, 0], apex: -0.5 })
      .wedge([0.1, 0.1, 0.044], [0.046, 0.061, -0.02], { color: '#e8d6b0', apex: -0.5, noInk: true })
      .box([0.12, 0.012, 0.0445], [0.05, 0.035, -0.02], { color: 'lettuce', noInk: true });
    return b.act({ click: [A.pose('lid', { rot: [0, 0, 40], dur: 0.3 }), A.say('Peek!', 1), A.wait(0.6), A.pose('lid', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A medieval green tunic on a dress form: long sleeves, a laced neck, a leather belt with a brass buckle.
  e('tunic', 'wardrobe', 'clothes', () =>
    form('tunic', '#3f7a3a', { sleeve: 'long', len: 0.62 })
      .cyl([0.46, 0.18, 0.3], [0, 0.54, 0], { color: '#3f7a3a', taper: 0.88 })
      .box([0.42, 0.05, 0.26], [0, 0.75, 0], { color: 'leather', round: 0.5 })
      .box([0.05, 0.05, 0.02], [0, 0.75, 0.13], { color: 'gold', name: 'buckle' })
      .stick([-0.015, 1.08, 0.122], [0.015, 1.0, 0.124], 0.006, 'tan', { noInk: true })
      .stick([0.015, 1.08, 0.122], [-0.015, 1.0, 0.124], 0.006, 'tan', { noInk: true })
      .box([0.1, 0.12, 0.04], [0.15, 0.66, 0.12], { color: 'leather', round: 0.4 })
      .act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1 }))] })
      .done(),
  ),
  // A steel tuning fork on a wooden sounding box, with its rubber mallet: struck, the prongs hum.
  e('tuning fork', 'music', 'music gear', () => {
    const b = m('tuning fork', { edge: 'sharp' })
      .box([0.2, 0.08, 0.1], [0, 0.04, 0], { color: '#b5814e', round: 0.1 })
      .box([0.12, 0.04, 0.005], [0, 0.04, 0.051], { color: '#2a1e14' })
      .stick([0, 0.08, 0], [0, 0.13, 0], 0.01, 'silver')
      .box([0.04, 0.012, 0.01], [0, 0.135, 0], { color: 'silver', round: 0.5 });
    b.pair((s) => b.stick([s * 0.015, 0.135, 0], [s * 0.015, 0.27, 0], 0.009, 'silver', { name: s > 0 ? 'prongL' : 'prongR', pivot: [s * 0.015, 0.135, 0] }));
    b.stick([0.14, 0.0, 0.08], [0.2, 0.0, 0.0], 0.012, '#7a5230', { name: 'mallet', piece: true }).ball(0.035, [0.13, 0.017, 0.093], { color: '#e0473b', parent: 'mallet' });
    const hum = (r: number) => A.par(A.pose('prongL', { rot: [0, 0, r], dur: 0.06 }), A.pose('prongR', { rot: [0, 0, -r], dur: 0.06 }));
    return b.act({ click: [A.pose('mallet', { move: [-0.09, 0.2, -0.08], dur: 0.3 }), A.par(A.pose('mallet', { move: [0, 0, 0], dur: 0.3 }), A.say('Mmmmmmm...', 2)), hum(2), hum(-2), hum(2), hum(-2), hum(1), hum(0)] }).done();
  }),
  // A road tunnel through a grassy hill 14 m high: a stone portal round a 5.3 m arch over a dark bore, portal
  // floodlights that come on, a two-lane road with markings running in.
  e('tunnel', 'places', 'roads and rails', () => {
    const b = m('tunnel', { edge: 'sharp' })
      .dome([30, 14, 22], [0, 7, -6], { color: '#6ab04c', edge: 'soft' })
      .dome([12, 6, 9], [-8, 9.5, -7], { color: '#8f8c86', edge: 'soft' })
      .box([11, 7.5, 1.2], [0, 3.75, 4.6], { color: '#a7a7a0' })
      .box([11.4, 0.6, 1.4], [0, 7.7, 4.6], { color: '#8f8c86' })
      .box([7, 3.5, 1.3], [0, 1.75, 4.6], { color: '#1e1c1c' })
      .cyl([7, 1.3, 3.6], [0, 3.5, 4.6], { color: '#1e1c1c', rot: [90, 0, 0] })
      .arc([8.2, 4.6, 1.3], [0, 3.5, 4.65], { color: '#8f8c86', arc: 180, tube: 0.15 })
      .label('TUNNEL', [2.6, 0.5], [0, 6.6, 5.22], { color: '#a7a7a0', depth: 0.03 })
      .box([8, 0.08, 14], [0, 0.04, 11], { color: '#55595e' })
      .box([0.15, 0.02, 14], [3.6, 0.09, 11], { color: 'white', noInk: true })
      .box([0.15, 0.02, 14], [-3.6, 0.09, 11], { color: 'white', noInk: true });
    b.each(4, (i) => b.box([0.15, 0.02, 2], [0, 0.09, 6 + i * 3.3], { color: '#f6d24a', noInk: true }));
    b.each(3, (i) => b.box([0.7, 0.25, 0.2], [(i - 1) * 2.6, 6.1, 5.25], { color: '#fff1a8', glow: true, name: `lamp${i + 1}`, mover: { kind: 'light', on: false } }));
    tree(b, [-6, 11.6, -4], 5, '#3f7a3a');
    tree(b, [5, 11.8, -8], 5.5);
    tree(b, [9, 8.6, 0], 4.5, '#3f7a3a');
    tree(b, [-11, 7.8, -2], 4.5);
    return b.act({ click: [A.operate('lamp1', 'on'), A.wait(0.3), A.operate('lamp2', 'on'), A.wait(0.3), A.par(A.operate('lamp3', 'on'), A.say('Vroooom... oom... oom!', 2.2)), A.wait(2.2), A.operate('lamp', 'off')] }).done();
  }),
  // A saffron turban wound round a head form: layered wraps in two shades, a jewelled brooch and a white plume
  // that sways.
  e('turban', 'wardrobe', 'hats', () =>
    headForm('turban')
      .ball([0.23, 0.15, 0.24], [0, 0.34, -0.005], { color: '#f0923b' })
      .torus([0.23, 0.22, 0.05], [0, 0.31, 0], { color: '#d8641a', rot: [78, 0, 12], tube: 0.2 })
      .torus([0.22, 0.21, 0.05], [0, 0.35, 0], { color: '#f6a84a', rot: [102, 0, -12], tube: 0.2 })
      .torus([0.2, 0.19, 0.045], [0, 0.385, 0], { color: '#d8641a', rot: [85, 0, 18], tube: 0.2 })
      .ball(0.04, [0, 0.36, 0.115], { color: '#c0392b', name: 'jewel' })
      .torus([0.055, 0.055, 0.012], [0, 0.36, 0.113], { color: 'gold', tube: 0.25 })
      .rod([0, 0.38, 0.1], [0.02, 0.5, 0.08], 0.022, 'white', { name: 'plume', pivot: [0, 0.38, 0.1] })
      .act({ click: [A.par(A.effect('sparkle', { dur: 1.2 }), A.pose('plume', { rot: [0, 0, 18], dur: 0.25, times: 2 }))] })
      .done(),
  ),
  // A jet-style turbine 4 m long on its yellow service stand: an intake with a spinner and fan blades that spool
  // up, a ribbed casing, pipes, and an exhaust cone.
  e('turbine', 'tech', 'power', () => {
    const b = m('turbine', { view: 'side', edge: 'sharp' })
      .loft([2.0, 2.0, 3.8], [0, 1.9, 0], [[0, 0.62, 0.62], [0.1, 0.78, 0.78], [0.55, 0.95, 0.95], [0.88, 1, 1], [1, 1, 1]], { color: '#c9ccd1', edge: 'soft' })
      .torus([2.06, 2.06, 0.25], [0, 1.9, 1.85], { color: '#9da3a8', tube: 0.08 })
      .cyl([1.8, 0.06, 1.8], [0, 1.9, 1.75], { color: '#2a2726', rot: [90, 0, 0] })
      .cone([0.55, 0.5, 0.55], [0, 1.9, 2.05], { color: 'white', rot: [90, 0, 0], name: 'fan', mover: { kind: 'spin', axis: 'z', amount: 1440 } })
      .cyl([0.9, 0.5, 0.9], [0, 1.9, -2.1], { color: '#5c6166', rot: [-90, 0, 0], taper: 0.55 })
      .cone([0.45, 0.4, 0.45], [0, 1.9, -2.4], { color: '#3a3633', rot: [-90, 0, 0] })
      .stick([0.9, 2.3, 1.0], [0.9, 2.3, -1.2], 0.12, '#c87a4a').stick([-0.85, 1.6, 0.8], [-0.85, 1.6, -1.4], 0.1, '#c87a4a')
      .box([0.5, 0.3, 0.8], [0, 0.95, 0.2], { color: '#9da3a8' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.box([0.22, 0.72, 0.04], [Math.sin(a) * 0.5, 1.9 + Math.cos(a) * 0.5, 1.92], { color: '#8f99a3', rot: [0, 25, -a / DEG], parent: 'fan' });
    });
    for (const z of [0.8, 0, -0.8]) b.cyl([1.98, 0.06, 1.98], [0, 1.9, z], { color: '#b4b8be', rot: [90, 0, 0], noInk: true });
    b.pair((s) => b.box([0.2, 0.8, 2.6], [s * 0.7, 0.55, 0], { color: '#f6d24a' }).box([0.3, 0.2, 0.3], [s * 0.7, 0.85, 1.0], { color: '#f6d24a' }).box([0.3, 0.2, 0.3], [s * 0.7, 0.85, -1.0], { color: '#f6d24a' }));
    axle2(b, 'F', 0.3, 0.1, 1.5, 1.0, '#2a2726');
    axle2(b, 'B', 0.3, 0.1, 1.5, -1.0, '#2a2726');
    return b.act({ click: [[A.par(A.operate('fan', 'on'), A.say('Whiiiine... WHOOOSH!', 2.2), A.effect('steam', { dur: 2.5 }))], [A.operate('fan', 'off'), A.say('Whrrr...', 1.5)]] }).done();
  }),
  // A turnip half pulled from its mound of earth: white root, purple shoulders, leafy greens; it pops up.
  e('turnip', 'food', 'vegetables', () => {
    const b = m('turnip')
      .dome([0.16, 0.025, 0.16], [0, 0.0125, 0], { color: 'dirt' })
      .ball([0.09, 0.08, 0.09], [0, 0.045, 0], { color: 'white', name: 'root', piece: true })
      .ball([0.086, 0.05, 0.086], [0, 0.066, 0], { color: '#8a3fa0', parent: 'root' })
      .cone([0.025, 0.035, 0.025], [0, 0.005, 0], { color: 'white', rot: [180, 0, 0], parent: 'root' });
    for (const [x0, z] of [[-0.03, 0], [0.03, 0.005], [0, -0.02]]) b.rod([0, 0.09, 0], [x0, 0.16, z], 0.01, '#5aa553', { parent: 'root' }).ball([0.03, 0.05, 0.012], [x0 * 1.2, 0.18, z * 1.2], { color: 'leaf', rot: [0, 0, -x0 * 600], parent: 'root' });
    return b.act({ click: [A.par(A.pose('root', { move: [0, 0.06, 0], dur: 0.25 }), A.say('Pop!', 1)), A.wait(0.6), A.pose('root', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A full-height stadium turnstile, 2.2 m: a canopy, a comb of bars on one side, and a three-armed rotor of bars
  // that turns a third of a round per person, with a card reader that blinks green.
  e('turnstile', 'places', 'street furniture', () => {
    const b = m('turnstile', { edge: 'sharp' })
      .box([1.8, 0.06, 1.4], [0, 0.03, 0], { color: '#9da3a8' })
      .box([0.12, 2.15, 0.12], [-0.85, 1.1, 0.62], { color: '#5c6166' })
      .box([0.12, 2.15, 0.12], [-0.85, 1.1, -0.62], { color: '#5c6166' })
      .box([1.9, 0.14, 1.5], [0, 2.22, 0], { color: '#5c6166', round: 0.2 })
      .cyl([0.12, 2.1, 0.12], [0.1, 1.11, 0], { color: 'silver', name: 'gate' })
      .box([0.2, 0.3, 0.12], [-0.85, 1.15, 0.72], { color: '#2a2726' })
      .box([0.12, 0.06, 0.02], [-0.85, 1.2, 0.785], { color: '#5ad65a', glow: true, name: 'reader', mover: { kind: 'light', on: false } });
    b.each(5, (k) => {
      const y = 0.3 + k * 0.4;
      for (const [x0, z] of around(3, 0.62, 0.3)) b.stick([0.1, y, 0], [0.1 + x0, y, z], 0.04, 'silver', { parent: 'gate' });
      b.stick([-0.85, y + 0.2, 0.6], [-0.85, y + 0.2, -0.6], 0.035, '#5c6166').stick([-0.85, y + 0.2, 0], [-0.3, y + 0.2, 0], 0.035, '#5c6166');
    });
    return b.act({ click: [A.operate('reader', 'on'), A.par(A.pose('gate', { rot: [0, 120, 0], dur: 0.8 }), A.say('Click-clack!', 1.2)), A.par(A.pose('gate', { rot: [0, 0, 0], dur: 0 }), A.operate('reader', 'off'))] }).done();
  }),
  // A record player: a wooden plinth, a platter with a record that spins, a tone arm that swings onto it, speed
  // buttons and a volume knob.
  e('turntable', 'music', 'audio gear', () =>
    m('turntable', { edge: 'sharp' })
      .box([0.45, 0.1, 0.36], [0, 0.05, 0], { color: '#7a5230', round: 0.2 })
      .box([0.44, 0.012, 0.35], [0, 0.104, 0], { color: '#2a2726', round: 0.3 })
      .cyl([0.3, 0.02, 0.3], [-0.04, 0.12, 0], { color: 'silver', name: 'platter', mover: { kind: 'spin', axis: 'y', amount: 200 } })
      .cyl([0.29, 0.008, 0.29], [-0.04, 0.134, 0], { color: '#1e1c1c', parent: 'platter' })
      .cyl([0.09, 0.01, 0.09], [-0.04, 0.136, 0], { color: '#e0473b', parent: 'platter' })
      .box([0.02, 0.012, 0.004], [-0.02, 0.142, 0], { color: 'white', parent: 'platter', noInk: true })
      .cyl([0.045, 0.035, 0.045], [0.16, 0.125, -0.12], { color: 'silver' })
      .stick([0.16, 0.145, -0.12], [0.17, 0.145, 0.08], 0.008, 'silver', { name: 'arm', pivot: [0.16, 0.145, -0.12] })
      .box([0.02, 0.015, 0.035], [0.17, 0.142, 0.095], { color: '#2a2726', parent: 'arm' })
      .cyl([0.025, 0.015, 0.025], [0.17, 0.11, 0.14], { color: 'silver' })
      .box([0.03, 0.012, 0.02], [0.12, 0.11, 0.16], { color: 'silver' })
      .box([0.03, 0.012, 0.02], [0.08, 0.11, 0.16], { color: 'silver' })
      .act({
        click: [
          [A.operate('platter', 'on'), A.pose('arm', { rot: [0, -30, 0], dur: 0.6 }), A.say('Doo-be-doo-be-doo!', 2.2)],
          [A.pose('arm', { rot: [0, 0, 0], dur: 0.5 }), A.operate('platter', 'off')],
        ],
      })
      .done(),
  ),
  // A gun turret 3.4 m tall on its ring: an armoured olive dome with a hatch, a long barrel with a muzzle brake;
  // it swings round and fires.
  e('turret', 'armory', 'military', () =>
    m('turret', { edge: 'sharp' })
      .cyl([3.4, 0.7, 3.4], [0, 0.35, 0], { color: '#5c6166', segs: 12 })
      .cyl([3.0, 0.2, 3.0], [0, 0.8, 0], { color: '#3a3f44' })
      .dome([2.8, 1.8, 2.8], [0, 1.8, 0], { color: '#6b7040', name: 'dome', mover: { kind: 'swing', axis: 'y', amount: 40 } })
      .box([1.0, 0.8, 0.5], [0, 1.6, 1.25], { color: '#5a5e36', parent: 'dome' })
      .cyl([0.28, 3.0, 0.28], [0, 1.65, 2.9], { color: '#3a3f44', rot: [90, 0, 0], name: 'barrel', parent: 'dome' })
      .cyl([0.42, 0.45, 0.42], [0, 1.65, 4.4], { color: '#3a3f44', rot: [90, 0, 0], parent: 'barrel' })
      .cyl([0.9, 0.16, 0.9], [0.3, 2.75, -0.2], { color: '#5a5e36', parent: 'dome', name: 'hatch' })
      .box([0.3, 0.35, 0.3], [-0.6, 2.7, 0.3], { color: '#3a3f44', parent: 'dome' })
      .cyl([0.06, 0.6, 0.06], [-0.9, 2.9, -0.4], { color: '#2a2726', parent: 'dome' })
      .act({
        click: [
          [A.operate('dome', 'open'), A.pose('barrel', { move: [0, 0, -0.5], dur: 0.08 }), A.par(A.effect('smoke', { dur: 1.8 }), A.anim('shake'), A.say('BOOM!', 1.4)), A.pose('barrel', { move: [0, 0, 0], dur: 0.6 })],
          [A.operate('dome', 'close'), A.say('Whirr...', 1)],
        ],
      })
      .done(),
  ),
  // A deep-red polo-neck jumper on a dress form; its rolled collar unrolls up and folds back down.
  e('turtle neck', 'wardrobe', 'clothes', () =>
    form('turtle neck', '#a3322a', { sleeve: 'long', len: 0.55 })
      .cyl([0.17, 0.12, 0.17], [0, 1.13, 0], { color: '#a3322a' })
      .torus([0.2, 0.2, 0.06], [0, 1.17, 0], { color: '#8a2a24', rot: [90, 0, 0], tube: 0.25, name: 'collar', piece: true })
      .box([0.405, 0.05, 0.245], [0, 0.58, 0], { color: '#8a2a24', round: 0.5, noInk: true })
      .act({ click: [A.pose('collar', { move: [0, 0.06, 0], dur: 0.3 }), A.say('Fluff!', 1), A.wait(0.5), A.pose('collar', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // An empty turtle shell, 0.5 m: a domed carapace of hexagonal scutes over a flat pale plastron; knock on it.
  e('turtle shell', 'wild', 'animal parts', () => {
    const b = m('turtle shell')
      .cyl([0.4, 0.035, 0.48], [0, 0.02, 0], { color: '#d9c48a' })
      .dome([0.42, 0.21, 0.5], [0, 0.135, 0], { color: '#6b7a3a', name: 'shell' })
      .prism([0.11, 0.02, 0.12], [0, 0.236, 0], 6, { color: '#55642a', parent: 'shell', noInk: true });
    for (const [x0, z] of around(6, 0.11, Math.PI / 6)) {
      const r = Math.hypot(x0 / 0.21, z / 0.25);
      b.prism([0.1, 0.018, 0.1], [x0, 0.03 + 0.21 * Math.sqrt(Math.max(0, 1 - r * r)) + 0.002, z], 6, { color: '#55642a', noInk: true, parent: 'shell', rot: [(z / 0.11) * 30, 0, (-x0 / 0.11) * 30] });
    }
    for (const [x0, z] of around(14, 1)) b.box([0.06, 0.035, 0.045], [x0 * 0.2, 0.05, z * 0.24], { color: '#5a6a30', rot: [0, -Math.atan2(z, x0) / DEG, 0], parent: 'shell', round: 0.4 });
    return b.act({ click: [A.pose('shell', { rot: [0, 0, 6], dur: 0.1 }), A.pose('shell', { rot: [0, 0, -6], dur: 0.1 }), A.par(A.pose('shell', { rot: [0, 0, 0], dur: 0.1 }), A.say('Knock knock!', 1.3))] }).done();
  }),
  // A single curved elephant tusk, 1.5 m, on a turning wooden display stand.
  e('tusk (bone)', 'wild', 'animal parts', () =>
    m('tusk (bone)')
      .box([0.5, 0.12, 0.32], [0, 0.06, 0], { color: '#7a5230', edge: 'sharp' })
      .cyl([0.36, 0.04, 0.3], [0, 0.14, 0], { color: '#5a3a22', name: 'stand', edge: 'sharp' })
      .rod([0, 0.15, 0], [0.05, 0.6, 0.02], 0.15, '#f2e8d0', { parent: 'stand' })
      .rod([0.05, 0.6, 0.02], [0.02, 1.0, 0.1], 0.12, '#f2e8d0', { parent: 'stand' })
      .rod([0.02, 1.0, 0.1], [-0.12, 1.3, 0.2], 0.09, '#f6eedc', { parent: 'stand' })
      .rod([-0.12, 1.3, 0.2], [-0.28, 1.46, 0.28], 0.055, '#faf4e6', { parent: 'stand' })
      .act({ click: [A.par(A.pose('stand', { rot: [0, 360, 0], dur: 1.6 }), A.effect('sparkle', { dur: 1.4 })), A.pose('stand', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A pair of tusks on a long wooden plinth, curving in towards each other like an arch; they clack.
  e('tusks', 'wild', 'animal parts', () => {
    const b = m('tusks').box([0.95, 0.14, 0.36], [0, 0.07, 0], { color: '#7a5230', edge: 'sharp' });
    b.pair((s) => {
      const n = s > 0 ? 'tuskL' : 'tuskR';
      b.rod([s * 0.26, 0.14, 0], [s * 0.33, 0.6, 0.03], 0.14, '#f2e8d0', { name: n, pivot: [s * 0.26, 0.14, 0] }).rod([s * 0.33, 0.6, 0.03], [s * 0.26, 1.0, 0.08], 0.11, '#f2e8d0', { parent: n }).rod([s * 0.26, 1.0, 0.08], [s * 0.1, 1.28, 0.12], 0.08, '#f6eedc', { parent: n }).rod([s * 0.1, 1.28, 0.12], [s * 0.03, 1.36, 0.13], 0.05, '#faf4e6', { parent: n });
    });
    const clack = (r: number) => A.par(A.pose('tuskL', { rot: [0, 0, r], dur: 0.15 }), A.pose('tuskR', { rot: [0, 0, -r], dur: 0.15 }));
    return b.act({ click: [clack(3), clack(-2), clack(3), A.par(clack(0), A.say('Clack!', 1))] }).done();
  }),
  // A pink ballet tutu on a dress form: a fitted bodice and layers of stiff net that twirl and flare.
  e('tutu', 'wardrobe', 'dance wear', () =>
    form('tutu', '#f4a1c0', { len: 0.38 })
      .cyl([0.8, 0.05, 0.8], [0, 0.73, 0], { color: '#f7b6cf', name: 'skirt', piece: true })
      .cyl([0.68, 0.05, 0.68], [0, 0.78, 0], { color: '#f4a1c0', parent: 'skirt' })
      .cyl([0.9, 0.03, 0.9], [0, 0.7, 0], { color: '#fbd3e2', parent: 'skirt' })
      .ball(0.05, [0, 0.82, 0.12], { color: 'white' })
      .act({ click: [A.par(A.pose('skirt', { rot: [0, 360, 0], scale: 1.12, dur: 0.8 }), A.effect('sparkle', { dur: 1 })), A.pose('skirt', { rot: [0, 0, 0], scale: 1, dur: 0 })] })
      .done(),
  ),
  // A black tuxedo on a mannequin: satin lapels, a white shirt front with studs, a pocket square and a bow tie
  // that spins.
  e('tuxedo', 'wardrobe', 'formal wear', () => {
    const b = dummy('tuxedo', { top: '#1e1c1c', legs: '#1e1c1c', shoes: 'black' })
      .wedge([0.16, 0.32, 0.02], [0, 1.33, 0.12], { color: 'white', rot: [0, 0, 180] })
      .box([0.07, 0.03, 0.02], [0, 1.47, 0.135], { color: '#1e1c1c', name: 'bowtie', piece: true })
      .box([0.06, 0.03, 0.02], [0.13, 1.37, 0.128], { color: 'white' });
    b.pair((s) => b.cone([0.05, 0.05, 0.03], [s * 0.035, 1.47, 0.135], { color: '#1e1c1c', rot: [0, 0, s * 90], parent: 'bowtie' }).rod([s * 0.05, 1.47, 0.13], [s * 0.04, 1.15, 0.13], 0.035, '#3a3636'));
    b.each(3, (i) => b.ball(0.012, [0, 1.38 - i * 0.06, 0.128], { color: '#2a2726' }));
    return b.act({ click: [A.par(A.pose('bowtie', { rot: [0, 0, 360], dur: 0.6 }), A.effect('sparkle', { dur: 1 }), A.say('Ding!', 1)), A.pose('bowtie', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A 1960s television in a wooden cabinet on splayed legs, 1.1 m: a curved screen that lights up, two knobs (the
  // channel knob turns), a speaker grille and rabbit-ear aerials.
  e('tv', 'tech', 'screens', () => {
    const b = m('tv', { edge: 'sharp' })
      .box([0.75, 0.56, 0.48], [0, 0.66, 0], { color: '#a0662c', round: 0.15 })
      .box([0.5, 0.42, 0.04], [-0.08, 0.67, 0.23], { color: '#2a2726', round: 0.3 })
      .box([0.46, 0.38, 0.02], [-0.08, 0.67, 0.25], { color: '#8fb8c8', round: 0.4, glow: true, name: 'screen', mover: { kind: 'light', on: false }, edge: 'soft' })
      .cyl([0.07, 0.03, 0.07], [0.26, 0.75, 0.245], { color: '#2a2726', rot: [90, 0, 0], name: 'knob' })
      .box([0.012, 0.04, 0.01], [0.26, 0.765, 0.262], { color: 'white', parent: 'knob' })
      .cyl([0.06, 0.03, 0.06], [0.26, 0.62, 0.245], { color: '#2a2726', rot: [90, 0, 0] })
      .box([0.12, 0.08, 0.01], [0.26, 0.5, 0.242], { color: '#5a3a22', noInk: true })
      .ball([0.16, 0.08, 0.16], [0, 0.95, -0.05], { color: '#3a3633' });
    b.pair((s) => b.stick([s * 0.3, 0.38, 0.17], [s * 0.34, 0, 0.23], 0.03, '#5a3a22').stick([s * 0.3, 0.38, -0.17], [s * 0.34, 0, -0.23], 0.03, '#5a3a22').stick([0, 0.97, -0.05], [s * 0.22, 1.28, -0.08], 0.01, 'silver').ball(0.02, [s * 0.22, 1.28, -0.08], { color: 'silver' }));
    return b
      .act({
        click: [
          [A.par(A.pose('knob', { rot: [0, 0, -90], dur: 0.3 }), A.operate('screen', 'on'), A.say('Bzzt... la la la!', 1.8))],
          [A.par(A.pose('knob', { rot: [0, 0, 0], dur: 0.3 }), A.operate('screen', 'off'), A.say('Blip.', 1))],
        ],
      })
      .done();
  }),
  // A low media cabinet 1.6 m wide with a 55-inch flat screen on its stand, a soundbar, a games console behind a
  // glass door and a drawer that slides out.
  e('tv stand', 'home', 'furniture', () => {
    const b = m('tv stand', { edge: 'sharp' })
      .box([1.6, 0.48, 0.45], [0, 0.3, 0], { color: '#5a3a22', round: 0.05 })
      .box([0.62, 0.32, 0.02], [-0.42, 0.3, 0.226], { color: '#2a2726' })
      .box([0.62, 0.32, 0.02], [-0.42, 0.3, 0.235], { color: 'glass', round: 0.1 })
      .box([0.42, 0.06, 0.3], [-0.42, 0.22, 0.05], { color: '#3a3633' })
      .box([0.7, 0.18, 0.4], [0.4, 0.42, 0.04], { color: '#7a5230', round: 0.08, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.3 } })
      .box([0.12, 0.02, 0.02], [0.4, 0.42, 0.25], { color: 'silver', parent: 'drawer' })
      .box([0.7, 0.16, 0.4], [0.4, 0.2, 0.04], { color: '#7a5230', round: 0.08 })
      .box([0.4, 0.03, 0.22], [0, 0.555, 0], { color: '#2a2726' })
      .box([0.08, 0.12, 0.04], [0, 0.62, -0.02], { color: '#2a2726' })
      .box([1.24, 0.72, 0.05], [0, 1.03, -0.03], { color: '#1e1c1c', round: 0.1 })
      .box([1.18, 0.66, 0.01], [0, 1.03, 0.0], { color: '#3a6fb0', glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .box([0.9, 0.07, 0.09], [0, 0.6, 0.15], { color: '#2a2726', round: 0.5 })
      .socket('top', [0.65, 0.54, 0.05], 'top', { size: 0.3 })
      .socket('drawer', [0.4, 0.43, 0.04], 'inside', { part: 'drawer', size: 0.3 });
    b.pair((s) => b.cyl([0.05, 0.06, 0.05], [s * 0.72, 0.03, 0.17], { color: '#2a2726' }).cyl([0.05, 0.06, 0.05], [s * 0.72, 0.03, -0.17], { color: '#2a2726' }));
    return b
      .act({
        click: [
          [A.operate('screen', 'on'), A.say('Pew pew pew!', 1.6), A.wait(2), A.operate('screen', 'off')],
          [A.operate('drawer', 'out'), A.wait(1.8), A.operate('drawer', 'in')],
        ],
      })
      .done();
  }),
  // Steel tweezers with red grips, standing on their tips; they pinch.
  e('tweezers', 'home', 'bathroom', () => {
    const b = m('tweezers', { edge: 'sharp' }).box([0.02, 0.022, 0.012], [0, 0.128, 0], { color: 'silver', round: 0.5 });
    b.pair((s) => {
      const n = s > 0 ? 'armL' : 'armR';
      b.box([0.01, 0.13, 0.006], [s * 0.013, 0.066, 0], { color: 'silver', rot: [0, 0, s * 11], round: 0.3, name: n, pivot: [0, 0.13, 0] }).box([0.011, 0.035, 0.007], [s * 0.014, 0.075, 0], { color: '#e0473b', rot: [0, 0, s * 11], parent: n, noInk: true });
    });
    const pinch = (r: number) => A.par(A.pose('armL', { rot: [0, 0, r], dur: 0.12 }), A.pose('armR', { rot: [0, 0, -r], dur: 0.12 }));
    return b.act({ click: [pinch(-9), pinch(0), pinch(-9), A.par(pinch(0), A.say('Pinch!', 1))] }).done();
  }),
  // A manual typewriter: a green body, rows of round keys, a carriage with a black platen and paper that steps
  // along as it types, a return lever, and the bell.
  e('typewriter', 'study', 'office', () => {
    const b = m('typewriter', { edge: 'sharp' })
      .box([0.42, 0.12, 0.34], [0, 0.07, -0.02], { color: '#3f7a5a', round: 0.3 })
      .box([0.38, 0.03, 0.18], [0, 0.1, 0.12], { color: '#1e1c1c', rot: [20, 0, 0] })
      .box([0.5, 0.06, 0.1], [0, 0.16, -0.1], { color: '#3f7a5a', round: 0.3, name: 'carriage', mover: { kind: 'slide', axis: 'x', amount: -0.12 } })
      .cyl([0.045, 0.46, 0.045], [0, 0.2, -0.1], { color: '#1e1c1c', rot: [0, 0, 90], parent: 'carriage' })
      .box([0.21, 0.16, 0.004], [0, 0.29, -0.11], { color: 'white', rot: [-10, 0, 0], parent: 'carriage' })
      .rod([-0.26, 0.2, -0.08], [-0.33, 0.24, -0.02], 0.012, 'silver', { parent: 'carriage' })
      .label('DEAR DIARY...', [0.14, 0.02], [0, 0.31, -0.104], { color: 'white', rot: [-10, 0, 0], depth: 0.002, parent: 'carriage' });
    b.pair((s) => b.cyl([0.05, 0.02, 0.05], [s * 0.25, 0.2, -0.1], { color: '#5c6166', rot: [0, 0, 90], parent: 'carriage' }));
    for (let r = 0; r < 3; r++) b.each(7, (i) => b.cyl([0.022, 0.014, 0.022], [-0.15 + i * 0.05 + (r % 2) * 0.012, 0.125 - r * 0.02, 0.07 + r * 0.045], { color: '#f3eee0' }));
    b.box([0.2, 0.014, 0.02], [0, 0.085, 0.2], { color: '#f3eee0' });
    return b.act({ click: [A.say('Clack clack clack!', 1.5), A.pose('carriage', { move: [-0.04, 0, 0], dur: 0.3 }), A.pose('carriage', { move: [-0.08, 0, 0], dur: 0.3 }), A.pose('carriage', { move: [-0.12, 0, 0], dur: 0.3 }), A.say('Ding!', 1), A.pose('carriage', { move: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // A flying saucer 9 m across hovering on three legs: a silver disc, a ring of lights that turns, a glass dome
  // with a pilot, and a tractor beam that lifts a curious cow.
  e('ufo', 'sky', 'flying saucers', () => {
    const b = m('ufo', { edge: 'sharp' })
      .loft([9, 1.6, 9], [0, 2.6, 0], [[0, 0.15, 0.2], [0.1, 0.6, 0.6], [0.5, 1, 1], [0.9, 0.6, 0.6], [1, 0.15, 0.2]], { color: '#c9ccd1', edge: 'soft' })
      .cyl([9.1, 0.25, 9.1], [0, 2.6, 0], { color: '#8f99a3' })
      .dome([3.4, 1.9, 3.4], [0, 4.05, 0], { color: '#a9dcf2', edge: 'soft' })
      .ball([0.8, 0.9, 0.8], [0, 3.8, 0], { color: '#7ad06a' })
      .ball(0.26, [0.2, 3.95, 0.33], { color: 'black' })
      .ball(0.26, [-0.2, 3.95, 0.33], { color: 'black' })
      .cyl([2.4, 0.3, 2.4], [0, 1.75, 0], { color: '#5c6166' })
      .cone([2.6, 1.6, 2.6], [0, 0.8, 0], { color: '#c8ffb0', glow: true, noInk: true, name: 'beam', mover: { kind: 'light', on: false } })
      .torus([8.6, 8.6, 0.25], [0, 2.6, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.03, name: 'rotor' });
    for (const [x0, z] of around(10, 4.3)) b.ball(0.35, [x0, 2.6, z], { color: x0 > 0 ? '#f6d24a' : '#6fd3e8', glow: true, parent: 'rotor' });
    for (const [x0, z] of around(3, 2.4, Math.PI / 2)) b.rod([x0 * 0.7, 2.0, z * 0.7], [x0, 0.15, z], 0.12, '#8f99a3').cyl([0.5, 0.1, 0.5], [x0, 0.05, z], { color: '#5c6166' });
    return b
      .act({
        click: [
          [A.operate('beam', 'on'), A.spawn('moo', 'cow', { rel: 'front', of: 'self', dist: 'close' }), A.say('Moo?', 1.2, 'moo'), A.move('moo', { rel: 'above', of: 'self' }, { speed: 'fly', style: 'fly' }), A.remove('moo', 'fade'), A.operate('beam', 'off'), A.say('Bleep bloop!', 1.2)],
          [A.par(A.anim('bounce'), A.say('Wub-wub-wub!', 1.5))],
        ],
      })
      .done();
  }),
  // A soprano ukulele standing on its end, 0.55 m: a figure-of-eight body with its sound hole and bridge, a fretted
  // neck, a headstock with four pegs and four nylon strings; strummed, it wobbles and plinks.
  e('ukelele', 'music', 'strings', () => {
    const b = m('ukelele')
      .ball([0.22, 0.18, 0.065], [0, 0.1, 0], { color: '#d9a066', name: 'body' })
      .ball([0.17, 0.15, 0.065], [0, 0.23, 0], { color: '#d9a066', parent: 'body' })
      .cyl([0.055, 0.01, 0.055], [0, 0.2, 0.031], { color: '#3a2414', rot: [90, 0, 0], parent: 'body', noInk: true })
      .box([0.07, 0.015, 0.01], [0, 0.085, 0.034], { color: '#5a3a22', parent: 'body', edge: 'sharp' })
      .box([0.04, 0.24, 0.025], [0, 0.42, 0.005], { color: '#7a5230', parent: 'body', edge: 'sharp' })
      .box([0.055, 0.075, 0.025], [0, 0.585, 0.0], { color: '#5a3a22', parent: 'body', edge: 'sharp' });
    b.each(6, (i) => b.box([0.041, 0.003, 0.004], [0, 0.32 + i * 0.035, 0.018], { color: 'silver', parent: 'body', noInk: true }));
    b.pair((s) => b.cyl([0.014, 0.025, 0.014], [s * 0.035, 0.57, 0], { color: 'silver', rot: [0, 0, 90], parent: 'body' }).cyl([0.014, 0.025, 0.014], [s * 0.035, 0.6, 0], { color: 'silver', rot: [0, 0, 90], parent: 'body' }));
    b.each(4, (i) => b.stick([-0.012 + i * 0.008, 0.085, 0.038], [-0.012 + i * 0.008, 0.56, 0.02], 0.002, 'white', { parent: 'body', noInk: true }));
    return b.act({ click: [A.par(A.pose('body', { rot: [0, 0, 5], dur: 0.15 }), A.say('Plink-a-plunk!', 1.5)), A.pose('body', { rot: [0, 0, -4], dur: 0.15 }), A.pose('body', { rot: [0, 0, 0], dur: 0.15 })] }).done();
  }),
  // A hospital ultrasound cart 1.5 m tall: wheeled base, column, a control panel with a trackball, a monitor that
  // shows the scan, a probe in its holder and a bottle of gel.
  e('ultrasound machine', 'clinic', 'hospital machines', () => {
    const b = m('ultrasound machine', { edge: 'sharp' })
      .box([0.6, 0.12, 0.7], [0, 0.16, 0], { color: '#d4d7da', round: 0.3 })
      .box([0.24, 0.62, 0.24], [0, 0.52, -0.1], { color: 'white', round: 0.2 })
      .box([0.7, 0.12, 0.5], [0, 0.9, 0.05], { color: 'white', round: 0.3 })
      .box([0.5, 0.012, 0.28], [0, 0.962, 0.08], { color: '#5c6166', noInk: true })
      .ball(0.05, [0.17, 0.97, 0.15], { color: '#a8d8f5' })
      .box([0.56, 0.4, 0.06], [0, 1.28, -0.14], { color: '#2a2726', round: 0.2, rot: [-8, 0, 0] })
      .box([0.5, 0.34, 0.01], [0, 1.28, -0.105], { color: '#2a3a4a', rot: [-8, 0, 0], glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .wedge([0.24, 0.2, 0.012], [0, 1.27, -0.098], { color: '#c0ccd4', rot: [-8, 0, 180], noInk: true })
      .box([0.08, 0.1, 0.08], [0.38, 0.9, 0.12], { color: '#d4d7da' })
      .capsule([0.04, 0.12, 0.04], [0.38, 1.0, 0.12], { color: 'white', name: 'probe', piece: true })
      .stick([0.38, 0.95, 0.12], [0.45, 0.7, 0.2], 0.015, '#5c6166')
      .cyl([0.06, 0.13, 0.06], [-0.3, 1.02, 0.18], { color: '#4e8fd6', edge: 'soft' })
      .cone([0.03, 0.04, 0.03], [-0.3, 1.1, 0.18], { color: 'white' });
    for (const [x0, z] of [[0.25, 0.3], [-0.25, 0.3], [0.25, -0.3], [-0.25, -0.3]]) b.ball(0.08, [x0, 0.045, z], { color: '#2a2726', edge: 'soft' });
    return b.act({ click: [A.par(A.operate('screen', 'on'), A.pose('probe', { move: [0, 0.12, 0.1], dur: 0.3 })), A.say('Thump-thump, thump-thump!', 2.4), A.wait(1), A.par(A.operate('screen', 'off'), A.pose('probe', { move: [0, 0, 0], dur: 0.3 }))] }).done();
  }),
  // A big red umbrella, open, standing on its crook handle: eight panels on a black shaft; it furls shut and
  // opens again in the rain.
  e('umbrella', 'wardrobe', 'rain gear', () => {
    const b = m('umbrella')
      .cone([1.05, 0.34, 1.05], [0, 0.78, 0], { color: '#d23a2a', segs: 8, name: 'canopy', piece: true })
      .cone([0.14, 0.5, 0.14], [0, 0.63, 0], { color: '#d23a2a', segs: 8, name: 'furled', scale: 0 })
      .stick([0, 0.94, 0], [0, 1.04, 0], 0.02, '#2a2726')
      .stick([0, 0.1, 0], [0, 0.62, 0], 0.02, '#2a2726')
      .arc([0.1, 0.1, 0.03], [0.04, 0.09, 0], { color: '#7a5230', arc: 200, rot: [0, 0, 180], tube: 0.3 });
    for (const [x0, z] of around(8, 0.51, Math.PI / 8)) b.ball(0.025, [x0, 0.61, z], { color: '#2a2726', parent: 'canopy' });
    return b
      .act({
        click: [
          [A.par(A.pose('canopy', { scale: 0, dur: 0.4 }), A.pose('furled', { scale: 1, dur: 0.4 }), A.say('Fwup!', 1))],
          [A.par(A.pose('canopy', { scale: 1, dur: 0.4 }), A.pose('furled', { scale: 0, dur: 0.4 }), A.effect('rain', { dur: 2.5 }), A.say('Pitter-patter!', 1.8))],
        ],
      })
      .done();
  }),
  // A circus unicycle, 0.95 m: a 20-inch wheel with cranks and pedals, a fork, a seat post and a saddle; it rocks
  // to balance while the wheel turns.
  e('unicycle', 'sports', 'circus', () => {
    const b = m('unicycle', { view: 'side' });
    wheel(b, 'wheel', 0.5, 0.06, [0, 0.25, 0], 'silver');
    b.pair((s) => b.stick([s * 0.045, 0.25, 0], [s * 0.045, 0.55, 0], 0.024, '#d23a2a').stick([s * 0.06, 0.25, 0], [s * 0.06, 0.13, s * 0.08], 0.02, 'silver', { parent: 'wheel' }).box([0.08, 0.02, 0.04], [s * 0.1, 0.13, s * 0.08], { color: '#2a2726', parent: 'wheel', edge: 'sharp' }));
    return b.box([0.12, 0.04, 0.05], [0, 0.56, 0], { color: '#d23a2a' }).stick([0, 0.56, 0], [0, 0.85, -0.02], 0.03, 'silver').box([0.12, 0.05, 0.26], [0, 0.88, -0.02], { color: '#2a2726', round: 0.6 })
      .socket('seat', [0, 0.9, -0.02], 'seat')
      .act({ click: [A.par(A.anim('wobble'), A.pose('wheel', { rot: [360, 0, 0], dur: 1 }), A.say('Whoa, whoa!', 1.4)), A.pose('wheel', { rot: [0, 0, 0], dur: 0 })] })
      .done();
  }),
  // A lump of uranium ore glowing green in an open lead pot with a radiation sign, and a Geiger counter that clicks.
  e('uranium', 'nature', 'minerals', () =>
    m('uranium')
      .cyl([0.15, 0.07, 0.15], [0, 0.035, 0], { color: '#5c6166', taper: 1.1, edge: 'sharp' })
      .ball([0.07, 0.05, 0.06], [0, 0.08, 0], { color: '#7dff5a', glow: true, name: 'ore', mover: { kind: 'light', on: true } })
      .ball([0.05, 0.04, 0.045], [0.035, 0.075, 0.02], { color: '#9be34d', glow: true })
      .cyl([0.07, 0.006, 0.07], [0, 0.035, 0.077], { color: '#f6d24a', rot: [90, 0, 0] })
      .cyl([0.02, 0.008, 0.02], [0, 0.035, 0.079], { color: '#2a2726', rot: [90, 0, 0], segs: 3 })
      .box([0.07, 0.11, 0.035], [0.15, 0.055, 0.02], { color: '#f6d24a', round: 0.3, edge: 'sharp' })
      .box([0.05, 0.03, 0.004], [0.15, 0.08, 0.038], { color: '#2a2726', edge: 'sharp' })
      .stick([0.15, 0.11, 0.02], [0.15, 0.17, 0.02], 0.012, '#2a2726')
      .act({ click: [A.say('Click-click-click-click!', 1.8), A.operate('ore', 'off'), A.wait(0.2), A.operate('ore', 'on'), A.wait(0.2), A.operate('ore', 'off'), A.wait(0.2), A.operate('ore', 'on')] })
      .done(),
  ),
  // A wall-hung urinal on a tiled panel: a porcelain bowl with its rim at 0.6 m, a chrome flush valve with a
  // handle that flushes, a drain and a blue cake.
  e('urinal', 'home', 'bathroom', () => {
    const b = m('urinal')
      .box([0.8, 1.6, 0.08], [0, 0.8, -0.04], { color: '#cfe3e8', edge: 'sharp', round: 0.05 })
      .box([0.42, 0.62, 0.34], [0, 0.66, 0.16], { color: 'white', round: 0.6 })
      .ball([0.3, 0.45, 0.12], [0, 0.64, 0.29], { color: '#e6ecef' })
      .cyl([0.08, 0.01, 0.06], [0, 0.5, 0.28], { color: '#4e8fd6', noInk: true })
      .stick([0, 0.97, 0.1], [0, 1.3, 0.1], 0.03, 'silver', { edge: 'sharp' })
      .box([0.09, 0.08, 0.08], [0, 1.25, 0.11], { color: 'silver', edge: 'sharp', round: 0.3 })
      .box([0.1, 0.018, 0.018], [0.07, 1.24, 0.13], { color: 'silver', edge: 'sharp', name: 'handle', pivot: [0.03, 1.24, 0.13], mover: { kind: 'swing', axis: 'z', amount: -30 } });
    b.each(4, (i) => b.box([0.8, 0.008, 0.002], [0, 0.3 + i * 0.35, 0.001], { color: 'white', noInk: true }));
    b.each(2, (i) => b.box([0.008, 1.6, 0.002], [-0.13 + i * 0.26, 0.8, 0.001], { color: 'white', noInk: true }));
    return b.act({ click: [A.operate('handle', 'down'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Whoosh!', 1.2)), A.operate('handle', 'up')] }).done();
  }),
  // A classical bronze urn, 0.42 m: a footed base, a full round body with a gold band and two scroll handles, and a
  // lid with a finial that lifts.
  e('urn', 'home', 'decor', () => {
    const b = m('urn')
      .cyl([0.13, 0.03, 0.13], [0, 0.015, 0], { color: 'bronze' })
      .cyl([0.07, 0.06, 0.07], [0, 0.06, 0], { color: 'bronze', taper: 0.8 })
      .ball([0.24, 0.24, 0.24], [0, 0.2, 0], { color: 'bronze', name: 'body' })
      .cyl([0.242, 0.025, 0.242], [0, 0.21, 0], { color: 'gold' })
      .cyl([0.12, 0.06, 0.12], [0, 0.33, 0], { color: 'bronze', taper: 1.2 })
      .ball([0.15, 0.05, 0.15], [0, 0.37, 0], { color: 'bronze', name: 'lid', piece: true })
      .ball(0.04, [0, 0.41, 0], { color: 'gold', parent: 'lid' });
    b.pair((s) => b.arc([0.09, 0.12, 0.018], [s * 0.13, 0.27, 0], { color: 'bronze', arc: 220, rot: [0, 0, s * -90], tube: 0.2 }));
    return b.act({ click: [A.pose('lid', { move: [0, 0.08, 0], rot: [0, 90, 0], dur: 0.4 }), A.par(A.effect('sparkle', { dur: 1 }), A.say('Clink!', 1)), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A superhero's yellow utility belt laid in a ring: a bat-shaped gold buckle and capsule pouches; a pouch pops
  // open.
  e('utility belt', 'wardrobe', 'belts', () => {
    const b = m('utility belt').torus([0.36, 0.3, 0.06], [0, 0.03, 0], { color: '#f2c230', rot: [90, 0, 0], tube: 0.08 })
      .box([0.1, 0.07, 0.022], [0, 0.04, 0.155], { color: 'gold', edge: 'sharp', round: 0.3 })
      .wedge([0.08, 0.04, 0.008], [0, 0.05, 0.168], { color: '#2a2726', rot: [0, 0, 180] });
    for (const d of [30, 150, 205, 250, 290, 335]) {
      const a = d * DEG;
      b.box([0.06, 0.07, 0.04], [Math.cos(a) * 0.19, 0.04, Math.sin(a) * 0.16], { color: '#d8a820', rot: [0, 90 - d, 0], round: 0.3 });
    }
    b.box([0.065, 0.025, 0.045], [Math.cos(30 * DEG) * 0.19, 0.085, Math.sin(30 * DEG) * 0.16], { color: '#f2c230', rot: [0, 60, 0], round: 0.3, name: 'flap', pivot: [Math.cos(30 * DEG) * 0.17, 0.085, Math.sin(30 * DEG) * 0.145], mover: { kind: 'swing', axis: 'x', amount: -80 } });
    return b.act({ click: [A.operate('flap', 'open'), A.par(A.effect('sparkle', { dur: 1 }), A.say('Click!', 1)), A.wait(1), A.operate('flap', 'close')] }).done();
  }),
  // A green valley between two 25 m mountains (snowy tops, rocky flanks), a river down the middle with a little
  // bridge, pine woods; shout and it echoes.
  e('valley', 'nature', 'landforms', () => {
    const b = m('valley')
      .box([46, 0.4, 32], [0, 0.2, 0], { color: '#6ab04c', round: 0.05 })
      .cone([24, 25, 26], [-14, 12.7, -2], { color: '#8a8f80', segs: 9 })
      .cone([9, 8, 9.6], [-14, 21.2, -2], { color: 'snow', segs: 9 })
      .cone([22, 21, 24], [14, 10.7, -1], { color: '#7f8a76', segs: 8 })
      .cone([7.5, 6.6, 8], [14, 17.9, -1], { color: 'snow', segs: 8 })
      .dome([16, 4, 14], [-12, 2.4, 8], { color: '#5aa553' })
      .dome([14, 3.5, 12], [13, 2.15, 9], { color: '#5aa553' })
      .box([3.5, 0.06, 34], [0.4, 0.43, 0], { color: '#4f9bd6', rot: [0, 6, 0] })
      .box([4.8, 0.3, 1.6], [0.6, 1.0, 6], { color: '#7a5230', edge: 'sharp' })
      .arc([5.0, 2.0, 1.6], [0.6, 0.4, 6], { color: '#7a5230', arc: 140, tube: 0.12, edge: 'sharp' });
    for (const [x0, z, h] of [[-6, 12, 5], [-4, 14, 4], [6, 13, 4.5], [8, 11, 5.5], [-8, 4, 4], [7, 3, 4.2]] as Array<[number, number, number]>) b.cyl([h * 0.12, h * 0.25, h * 0.12], [x0, 0.4 + h * 0.12, z], { color: 'bark' }).cone([h * 0.45, h * 0.8, h * 0.45], [x0, 0.4 + h * 0.6, z], { color: '#3f7a3a' });
    return b.act({ click: [[A.say('Hellooo...', 1.2), A.say('...ooo...', 1), A.say('...oo.', 1)], [A.par(A.effect('rain', { dur: 2.5 }), A.say('Pitter-patter...', 1.8))]] }).done();
  }),
  // A brass gate valve between two copper pipe ends: hex unions, a stem and a red handwheel that turns to let the
  // water through.
  e('valve', 'workshop', 'plumbing', () =>
    m('valve', { edge: 'sharp' })
      .cyl([0.04, 0.24, 0.04], [0, 0.03, 0], { color: 'copper', rot: [0, 0, 90] })
      .ball([0.07, 0.065, 0.065], [0, 0.035, 0], { color: 'brass', edge: 'soft' })
      .prism([0.052, 0.025, 0.052], [0.065, 0.03, 0], 6, { color: 'brass', rot: [0, 0, 90] })
      .prism([0.052, 0.025, 0.052], [-0.065, 0.03, 0], 6, { color: 'brass', rot: [0, 0, 90] })
      .cyl([0.03, 0.03, 0.03], [0, 0.075, 0], { color: 'brass' })
      .stick([0, 0.08, 0], [0, 0.11, 0], 0.012, 'silver')
      .torus([0.085, 0.085, 0.012], [0, 0.112, 0], { color: '#d23a2a', rot: [90, 0, 0], tube: 0.15, name: 'handwheel' })
      .stick([-0.035, 0.112, 0], [0.035, 0.112, 0], 0.008, '#d23a2a', { parent: 'handwheel' })
      .stick([0, 0.112, -0.035], [0, 0.112, 0.035], 0.008, '#d23a2a', { parent: 'handwheel' })
      .act({ click: [[A.par(A.pose('handwheel', { rot: [0, -720, 0], dur: 1 }), A.say('Squeak!', 1)), A.effect('water_spray', { dur: 1.5 })], [A.par(A.pose('handwheel', { rot: [0, 0, 0], dur: 1 }), A.say('Squeak... drip.', 1.3))]] })
      .done(),
  ),
  // A panel van at real size, 5.4 m long and 2.35 m tall: a sloping bonnet and windscreen, cab doors with windows,
  // a big sliding side door, twin rear doors, bumpers, headlights, mirrors and four wheels in their arches.
  e('van', 'garage', 'cars', () => {
    const W = '#f4f2ee';
    const b = m('van', { view: 'side', edge: 'sharp' })
      .loft([2.0, 2.0, 5.4], [0, 1.37, 0], [[0, 0.97, 0.97, 0], [0.04, 1, 1, 0], [0.74, 1, 1, 0], [0.82, 0.98, 0.9, -0.05], [0.9, 0.96, 0.58, -0.21], [1, 0.9, 0.45, -0.27]], { color: W, boxy: 0.86, name: 'body', edge: 'soft' })
      .box([1.75, 0.82, 0.05], [0, 1.88, 1.82], { color: 'glass', rot: [-38, 0, 0], round: 0.2 })
      .box([1.9, 0.3, 0.22], [0, 0.55, 2.68], { color: '#3a3633', round: 0.3 })
      .box([1.9, 0.3, 0.2], [0, 0.55, -2.68], { color: '#3a3633', round: 0.3 })
      .box([1.1, 0.28, 0.04], [0, 0.95, 2.71], { color: '#3a3633' })
      .box([0.06, 1.7, 1.25], [1.02, 1.3, -0.05], { color: W, round: 0.1, name: 'sideDoor', mover: { kind: 'slide', axis: 'z', amount: -1.2 } })
      .box([0.04, 0.05, 0.16], [1.06, 1.25, 0.45], { color: '#5c6166', parent: 'sideDoor' })
      .box([0.03, 0.04, 2.6], [1.02, 2.15, -1.2], { color: '#9da3a8' })
      .label('SPEEDY DELIVERIES', [2.2, 0.36], [1.02, 1.5, -1.65], { color: '#2f6fc0', rot: [0, 90, 0], depth: 0.02 })
      .label('SPEEDY DELIVERIES', [2.2, 0.36], [-1.02, 1.5, -1.0], { color: '#2f6fc0', rot: [0, -90, 0], depth: 0.02 })
      .socket('seat', [0.45, 1.0, 1.0], 'seat')
      .socket('cargo', [0, 0.6, -1.4], 'inside', { size: 1.4 });
    b.pair((s) => {
      b.box([0.05, 0.62, 0.9], [s * 1.0, 1.86, 1.15], { color: 'glass', round: 0.2 })
        .box([0.05, 0.05, 0.14], [s * 1.02, 1.42, 1.05], { color: '#5c6166' })
        .box([0.04, 1.2, 0.02], [s * 0.995, 1.2, 0.65], { color: '#c9c6bf', noInk: true })
        .ball([0.36, 0.22, 0.08], [s * 0.72, 1.05, 2.68], { color: '#fff6c8', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: true } })
        .box([0.16, 0.42, 0.05], [s * 0.88, 1.15, -2.72], { color: '#e0473b', glow: true })
        .box([0.94, 1.6, 0.05], [s * 0.48, 1.35, -2.71], { color: W, round: 0.1, name: s > 0 ? 'rearL' : 'rearR', pivot: [s * 0.95, 1.35, -2.71], mover: { kind: 'swing', axis: 'y', amount: s * -100 } })
        .box([0.6, 0.45, 0.02], [s * 0.48, 1.8, -2.74], { color: 'glass', parent: s > 0 ? 'rearL' : 'rearR' })
        .stick([s * 1.0, 1.9, 1.6], [s * 1.18, 1.9, 1.7], 0.04, '#2a2726').box([0.06, 0.28, 0.18], [s * 1.2, 1.85, 1.7], { color: '#2a2726', round: 0.3 })
        .arc([0.9, 0.9, 0.3], [s * 0.88, 0.42, 1.7], { color: '#3a3633', arc: 170, rot: [0, 90, 0], tube: 0.08 })
        .arc([0.9, 0.9, 0.3], [s * 0.88, 0.42, -1.6], { color: '#3a3633', arc: 170, rot: [0, 90, 0], tube: 0.08 });
    });
    axle2(b, 'F', 0.72, 0.24, 1.72, 1.7);
    axle2(b, 'B', 0.72, 0.24, 1.72, -1.6);
    return b
      .act({
        click: [
          [A.operate('sideDoor', 'open'), A.say('Whoosh... clunk!', 1.6), A.wait(2), A.operate('sideDoor', 'close')],
          [A.par(A.anim('shake'), A.say('Beep beep!', 1.2)), A.operate('lamp', 'off'), A.wait(0.3), A.operate('lamp', 'on')],
          [A.par(A.operate('rearL', 'open'), A.operate('rearR', 'open')), A.wait(2), A.par(A.operate('rearL', 'close'), A.operate('rearR', 'close'))],
        ],
      })
      .done();
  }),
  // Vanilla: a glass jar of dark cured pods with a label, and a pale yellow vanilla orchid on its stem that opens.
  e('vanilla', 'food', 'spices', () => {
    const b = m('vanilla').cyl([0.07, 0.1, 0.07], [0, 0.05, 0], { color: 'glass' }).label('VANILLA', [0.06, 0.03], [0, 0.045, 0.035], { color: 'cream', depth: 0.004 });
    for (const [x0, z, tx] of [[-0.015, 0, -0.04], [0.01, 0.01, 0.02], [0.005, -0.012, -0.005], [0.018, -0.005, 0.05]]) b.rod([x0, 0.02, z], [tx, 0.24, z], 0.009, '#3a2414');
    b.rod([0.02, 0.1, 0], [0.07, 0.18, 0.02], 0.006, '#5aa553').ball(0.02, [0.07, 0.19, 0.02], { color: '#f6d24a', name: 'bloom', piece: true });
    around(5, 0.022).forEach(([x0, y]) => b.ball([0.022, 0.012, 0.01], [0.07 + x0, 0.19 + y, 0.025], { color: '#f3e6a0', rot: [0, 0, Math.atan2(y, x0) / DEG], parent: 'bloom' }));
    return b.act({ click: [A.par(A.pose('bloom', { scale: 1.4, dur: 0.5 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1), A.pose('bloom', { scale: 1, dur: 0.5 })] }).done();
  }),
  // A little stack of vanilla wafer cookies with one beside it; the top one gets a bite (crunch) and is whole again.
  e('vanilla wafer', 'food', 'cookies', () => {
    const b = m('vanilla wafer');
    ([[0, 0.007, 0], [0.004, 0.022, 0.003], [0.05, 0.007, 0.02]] as V[]).forEach(([x0, y, z]) => b.cyl([0.045, 0.012, 0.045], [x0, y, z], { color: '#e8c07a' }).ball([0.042, 0.008, 0.042], [x0, y + 0.006, z], { color: '#d9a85a' }));
    b.cyl([0.045, 0.012, 0.045], [-0.003, 0.037, -0.002], { color: '#e8c07a', name: 'upper', piece: true }).ball([0.042, 0.008, 0.042], [-0.003, 0.043, -0.002], { color: '#d9a85a', parent: 'upper' });
    return b.act({ click: [[A.par(A.pose('upper', { scale: 0, dur: 0.25 }), A.say('Crunch!', 1))], [A.par(A.pose('upper', { scale: 1, dur: 0.3 }), A.anim('hop'))]] }).done();
  }),
  // A dressing table at 0.75 m: two drawer pedestals, an oval mirror ringed with bulbs that light up, perfume and
  // a lipstick on top, and a padded stool tucked in front.
  e('vanity', 'home', 'furniture', () => {
    const b = m('vanity', { edge: 'sharp' })
      .box([1.2, 0.05, 0.48], [0, 0.75, 0], { color: 'white', round: 0.2 })
      .cyl([0.62, 0.03, 0.8], [0, 1.24, -0.2], { color: 'glass', rot: [90, 0, 0] })
      .torus([0.68, 0.86, 0.05], [0, 1.24, -0.2], { color: '#e2b23a', tube: 0.08 })
      .cyl([0.06, 0.09, 0.06], [0.32, 0.82, 0.05], { color: '#f4a1c0', edge: 'soft' }).ball(0.035, [0.32, 0.885, 0.05], { color: 'gold' })
      .cyl([0.02, 0.06, 0.02], [0.42, 0.805, 0.1], { color: '#d23a2a' })
      .box([0.34, 0.22, 0.38], [0.6, 0.2, 0.62], { color: 'white', round: 0.2 })
      .cyl([0.4, 0.12, 0.4], [0.6, 0.47, 0.62], { color: '#f4a1c0', edge: 'soft' })
      .box([0.36, 0.2, 0.42], [-0.39, 0.5, 0.03], { color: '#f4ecdf', round: 0.1, name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.28 } })
      .ball(0.03, [-0.39, 0.5, 0.25], { color: 'gold', parent: 'drawer' })
      .socket('top', [-0.3, 0.775, 0.1], 'top', { size: 0.3 })
      .socket('stool', [0.6, 0.53, 0.62], 'seat');
    b.pair((s) => b.box([0.38, 0.72, 0.46], [s * 0.4, 0.36, 0], { color: 'white', round: 0.05 }).stick([s * 0.26, 0.77, -0.2], [s * 0.26, 0.95, -0.2], 0.03, 'gold'));
    b.box([0.36, 0.25, 0.42], [0.39, 0.5, 0.03], { color: '#f4ecdf', round: 0.1 }).ball(0.03, [0.39, 0.5, 0.25], { color: 'gold' });
    around(10, 1, Math.PI / 10).forEach(([c, sn], i) => b.ball(0.05, [c * 0.36, 1.24 + sn * 0.45, -0.17], { color: '#fff1c0', glow: true, name: `bulb${i + 1}`, mover: { kind: 'light', on: false } }));
    return b
      .act({
        click: [
          [A.par(A.operate('bulb', 'on'), A.effect('sparkle', { dur: 1.2 }), A.say('Bling!', 1.2)), A.wait(2), A.operate('bulb', 'off')],
          [A.operate('drawer', 'out'), A.wait(1.5), A.operate('drawer', 'in')],
        ],
      })
      .done();
  }),
  // A blue-and-white porcelain vase with three flowers in it; they bloom open.
  e('vase', 'home', 'decor', () => {
    const b = m('vase').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: '#2f4f8f' }).ball([0.16, 0.2, 0.16], [0, 0.11, 0], { color: '#2f4f8f' })
      .cyl([0.07, 0.08, 0.07], [0, 0.23, 0], { color: '#2f4f8f' }).cyl([0.1, 0.02, 0.1], [0, 0.27, 0], { color: '#2f4f8f' })
      .torus([0.165, 0.165, 0.03], [0, 0.12, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .socket('neck', [0, 0.27, 0], 'slot', { size: 0.2 });
    ([[-0.07, 0.42, 0.02, '#e0473b'], [0.07, 0.41, 0.0, '#f6d24a'], [0, 0.46, -0.03, '#f4a1c0']] as Array<[number, number, number, string]>).forEach(([x0, y, z, c], i) => b.rod([0, 0.26, 0], [x0, y, z], 0.01, '#5aa553').ball([0.07, 0.06, 0.04], [x0, y, z], { color: c, name: `flower${i + 1}`, piece: true }).ball(0.025, [x0, y, z + 0.02], { color: 'gold', parent: `flower${i + 1}` }));
    return b.act({ click: [A.par(A.pose('flower1', { scale: 1.35, dur: 0.5 }), A.pose('flower2', { scale: 1.35, dur: 0.5, delay: 0.15 }), A.pose('flower3', { scale: 1.35, dur: 0.5, delay: 0.3 }), A.effect('hearts', { dur: 1.2 })), A.wait(1), A.par(A.pose('flower1', { scale: 1, dur: 0.4 }), A.pose('flower2', { scale: 1, dur: 0.4 }), A.pose('flower3', { scale: 1, dur: 0.4 }))] }).done();
  }),
  // A market vegetable stall: a wooden counter 0.9 m high with tilted crates of tomatoes, lettuces and carrots, a
  // striped canopy on four posts, a chalkboard and a hanging scale that weighs a tomato.
  e('vegetable stand', 'places', 'market', () => {
    const b = m('vegetable stand', { edge: 'sharp' })
      .box([2.6, 0.9, 1.0], [0, 0.45, 0], { color: '#b5814e', round: 0.05 })
      .box([2.62, 0.08, 1.02], [0, 0.91, 0], { color: '#7a5230' })
      .box([1.0, 0.4, 0.04], [0, 0.55, 0.52], { color: '#2a2726' })
      .label('FRESH TODAY', [0.9, 0.3], [0, 0.55, 0.545], { color: '#2a2726', depth: 0.01 });
    const crates: Array<[number, string, 'ball' | 'cone']> = [[-0.85, '#e0473b', 'ball'], [0, '#7cc45a', 'ball'], [0.85, '#f0923b', 'cone']];
    for (const [x0, c, kind] of crates) {
      b.box([0.78, 0.18, 0.62], [x0, 1.02, 0.08], { color: '#d8b07a', rot: [18, 0, 0] });
      for (const [dx, dz] of [[-0.2, -0.12], [0, -0.1], [0.2, -0.12], [-0.12, 0.1], [0.12, 0.1], [0.27, 0.12], [-0.27, 0.12]]) {
        const y = 1.1 - dz * 0.33;
        if (kind === 'ball') b.ball(c === '#7cc45a' ? 0.16 : 0.09, [x0 + dx, y + 0.02, 0.08 + dz], { color: c, edge: 'soft' });
        else b.cone([0.05, 0.22, 0.05], [x0 + dx, y + 0.02, 0.08 + dz], { color: c, rot: [100, 0, 0], edge: 'soft' });
      }
    }
    b.pair((s) => b.stick([s * 1.25, 0.9, -0.45], [s * 1.25, 2.4, -0.45], 0.07, '#7a5230').stick([s * 1.25, 0.9, 0.45], [s * 1.25, 2.25, 0.45], 0.07, '#7a5230'));
    b.each(7, (i) => b.box([0.4, 0.05, 1.35], [-1.2 + i * 0.4, 2.36, 0.05], { color: i % 2 ? 'white' : '#2e8a4a', rot: [-7, 0, 0] }).box([0.4, 0.2, 0.03], [-1.2 + i * 0.4, 2.2, 0.73], { color: i % 2 ? 'white' : '#2e8a4a' }));
    b.stick([1.05, 2.3, 0.4], [1.05, 1.9, 0.4], 0.01, '#2a2726').cyl([0.12, 0.12, 0.05], [1.05, 1.8, 0.42], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.25, 0.03, 0.25], [1.05, 1.55, 0.42], { color: 'silver', name: 'pan' })
      .socket('scale', [1.05, 1.57, 0.42], 'top', { size: 0.2 })
      .socket('counter', [0, 0.95, -0.3], 'top', { size: 0.5 });
    return b.act({ click: [A.spawn('veg', 'tomato'), A.attach('veg', 'self', 'scale'), A.par(A.pose('pan', { move: [0, -0.06, 0], dur: 0.3 }), A.say('Ding!', 1)), A.wait(1.5), A.remove('veg', 'pop'), A.pose('pan', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A bridal veil on a head form: a pearl tiara, a long tulle veil down the back and a short blusher that lifts.
  e('veil', 'wardrobe', 'wedding', () =>
    m('veil')
      .cyl([0.25, 0.03, 0.25], [0, 0.015, 0], { color: '#7a5230', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.72, 0], 0.03, '#7a5230')
      .cyl([0.08, 0.1, 0.08], [0, 0.76, 0], { color: FORM })
      .ball([0.17, 0.21, 0.19], [0, 0.9, 0], { color: FORM })
      .cyl([0.45, 0.7, 0.32], [0, 0.62, -0.08], { color: 'white', taper: 0.38 })
      .ball([0.2, 0.12, 0.2], [0, 0.97, -0.025], { color: 'white' })
      .torus([0.16, 0.16, 0.02], [0, 0.985, 0.01], { color: 'silver', rot: [70, 0, 0], tube: 0.12 })
      .ball(0.022, [0, 1.0, 0.085], { color: 'white' })
      .ball([0.2, 0.2, 0.03], [0, 0.88, 0.11], { color: '#fbfaf6', name: 'blusher', pivot: [0, 0.98, 0.07], mover: { kind: 'swing', axis: 'x', amount: -150 } })
      .act({ click: [[A.operate('blusher', 'open'), A.effect('hearts', { dur: 1.5 })], [A.operate('blusher', 'close')]] })
      .done(),
  ),
  // A bolt of purple velvet with a length unrolled across the table; it ripples.
  e('velvet', 'home', 'fabrics', () =>
    m('velvet')
      .cyl([0.12, 0.36, 0.12], [0, 0.06, -0.06], { color: '#7a3fa8', rot: [0, 0, 90] })
      .cyl([0.04, 0.38, 0.04], [0, 0.06, -0.06], { color: '#c39a6b', rot: [0, 0, 90] })
      .box([0.34, 0.012, 0.3], [0, 0.006, 0.13], { color: '#7a3fa8', round: 0.3, name: 'cloth', pivot: [0, 0.01, -0.02] })
      .box([0.345, 0.02, 0.01], [0, 0.09, -0.0], { color: '#b070d0', noInk: true })
      .box([0.3, 0.004, 0.02], [0, 0.0125, 0.16], { color: '#b070d0', parent: 'cloth', noInk: true })
      .act({ click: [A.par(A.pose('cloth', { rot: [-10, 0, 0], dur: 0.2 }), A.say('Swish!', 1)), A.pose('cloth', { rot: [4, 0, 0], dur: 0.2 }), A.par(A.pose('cloth', { rot: [0, 0, 0], dur: 0.2 }), A.effect('sparkle', { dur: 1 }))] })
      .done(),
  ),
  // Two brass stanchions 1 m tall with a red velvet rope on hooks between them; the rope unhooks and swings aside.
  e('velvet rope', 'places', 'street furniture', () => {
    const b = m('velvet rope');
    b.pair((s) => b.cyl([0.34, 0.06, 0.34], [s * 0.75, 0.03, 0], { color: 'brass', edge: 'sharp' }).cyl([0.2, 0.08, 0.2], [s * 0.75, 0.1, 0], { color: 'brass', taper: 0.5 }).cyl([0.06, 0.88, 0.06], [s * 0.75, 0.56, 0], { color: 'brass' }).ball(0.1, [s * 0.75, 1.02, 0], { color: 'brass' }).torus([0.06, 0.06, 0.015], [s * 0.7, 0.93, 0], { color: 'brass', rot: [0, 90, 0] }));
    b.rod([-0.68, 0.92, 0], [-0.3, 0.72, 0], 0.05, '#a3222a', { name: 'rope', pivot: [-0.7, 0.93, 0] }).rod([-0.3, 0.72, 0], [0.3, 0.72, 0], 0.05, '#a3222a', { parent: 'rope' }).rod([0.3, 0.72, 0], [0.68, 0.92, 0], 0.05, '#a3222a', { parent: 'rope' });
    return b.act({ click: [[A.pose('rope', { rot: [0, -70, 0], dur: 0.5 }), A.say('Click!', 1)], [A.pose('rope', { rot: [0, 0, 0], dur: 0.5 }), A.say('Click!', 1)]] }).done();
  }),
  // A snack vending machine 1.85 m tall: a glass front with spirals of snacks, a keypad, a coin slot and a pickup
  // flap at the bottom; a chocolate bar drops out.
  e('vending machine', 'tech', 'machines', () => {
    const b = m('vending machine', { edge: 'sharp' })
      .box([0.92, 1.85, 0.82], [0, 0.925, 0], { color: '#d23a2a', round: 0.05 })
      .box([0.62, 1.2, 0.04], [-0.1, 1.17, 0.41], { color: 'glass', round: 0.05 })
      .box([0.2, 0.6, 0.04], [0.34, 1.2, 0.41], { color: '#2a2726', round: 0.1 })
      .box([0.12, 0.06, 0.01], [0.34, 1.42, 0.435], { color: '#9be34d', glow: true })
      .box([0.06, 0.03, 0.02], [0.34, 1.02, 0.44], { color: 'silver' })
      .box([0.6, 0.22, 0.04], [-0.1, 0.32, 0.41], { color: '#2a2726' })
      .box([0.56, 0.2, 0.03], [-0.1, 0.33, 0.43], { color: '#3a3633', name: 'flap', pivot: [-0.1, 0.43, 0.43], mover: { kind: 'swing', axis: 'x', amount: -60 } })
      .label('SNACKS', [0.62, 0.16], [-0.1, 1.7, 0.42], { color: '#d23a2a', depth: 0.02 })
      .socket('coin', [0.34, 1.02, 0.45], 'slot', { size: 0.03 });
    const cs = ['#f6d24a', '#4e8fd6', '#f0923b', '#5aa553', '#8a5fc4', '#8c5a2b'];
    for (let r = 0; r < 4; r++) b.each(3, (i) => b.box([0.15, 0.17, 0.05], [-0.3 + i * 0.2, 1.6 - r * 0.27, 0.36], { color: cs[(r + i) % 6], round: 0.2 }).box([0.18, 0.012, 0.3], [-0.3 + i * 0.2, 1.505 - r * 0.27, 0.22], { color: 'silver' }));
    b.each(9, (i) => b.box([0.035, 0.035, 0.01], [0.3 + (i % 3) * 0.04, 1.3 - Math.floor(i / 3) * 0.05, 0.435], { color: 'silver', noInk: true }));
    return b.act({ click: [A.say('Beep boop... ka-chunk!', 1.8), A.operate('flap', 'open'), A.spawn('snack', 'wrapper', { rel: 'front', of: 'self', dist: 'touch' }), A.wait(1.5), A.operate('flap', 'close'), A.remove('snack', 'pop')] }).done();
  }),
  // A venison steak on a board: a seared loin with a pink sliced end, a bone, rosemary, and steam off it.
  e('venison', 'food', 'meat', () =>
    m('venison')
      .box([0.42, 0.03, 0.27], [0, 0.015, 0], { color: '#b5814e', edge: 'sharp', round: 0.3 })
      .ball([0.26, 0.14, 0.18], [-0.03, 0.1, 0], { color: '#5a2214' })
      .cyl([0.12, 0.016, 0.11], [0.13, 0.068, 0.02], { color: '#b5485a', rot: [0, 0, 70] })
      .cyl([0.12, 0.016, 0.11], [0.15, 0.062, 0.03], { color: '#c05a68', rot: [0, 0, 60] })
      .stick([-0.14, 0.1, 0], [-0.22, 0.13, 0], 0.03, 'cream').ball(0.045, [-0.225, 0.13, 0], { color: 'cream' })
      .rod([-0.05, 0.17, 0.02], [0.05, 0.16, 0.05], 0.012, '#3f7a3a')
      .ball([0.02, 0.01, 0.02], [0.02, 0.172, -0.03], { color: '#e8d6b0' })
      .act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5))] })
      .done(),
  ),
  // A wall air vent: a white frame with angled louvres that open and blow.
  e('vent', 'home', 'fixtures', () => {
    const b = m('vent', { edge: 'sharp' }).box([0.3, 0.22, 0.03], [0, 0.11, 0], { color: '#e6e6e2', round: 0.2 }).box([0.25, 0.17, 0.012], [0, 0.11, 0.012], { color: '#2a2726' });
    b.each(5, (i) => b.box([0.25, 0.02, 0.025], [0, 0.05 + i * 0.03, 0.018], { color: '#c9ccd1', rot: [25, 0, 0], name: `louvre${i + 1}`, mover: { kind: 'swing', axis: 'x', amount: 40 } }));
    b.pair((s) => b.ball(0.012, [s * 0.13, 0.2, 0.017], { color: 'silver' }).ball(0.012, [s * 0.13, 0.02, 0.017], { color: 'silver' }));
    return b.act({ click: [A.operate('louvre', 'open'), A.par(A.effect('dust', { dur: 1.6 }), A.say('Whoooosh...', 1.6)), A.wait(0.4), A.operate('louvre', 'close')] }).done();
  }),
  // A hospital ventilator 1.6 m tall on a wheeled stand: a screen with a breathing trace, bellows that rise and fall,
  // and a loop of blue breathing tubes.
  e('ventilator', 'clinic', 'hospital machines', () => {
    const b = m('ventilator', { edge: 'sharp' })
      .box([0.6, 0.1, 0.6], [0, 0.15, 0], { color: '#d4d7da', round: 0.3 })
      .box([0.12, 0.62, 0.12], [0, 0.5, 0], { color: 'silver' })
      .box([0.5, 0.45, 0.35], [0, 1.03, 0], { color: 'white', round: 0.2 })
      .box([0.36, 0.26, 0.02], [0, 1.08, 0.18], { color: '#1a2a4a', glow: true, name: 'screen', mover: { kind: 'light', on: true } })
      .rod([-0.15, 1.08, 0.192], [-0.05, 1.13, 0.192], 0.008, '#9be34d', { noInk: true }).rod([-0.05, 1.13, 0.192], [0.05, 1.03, 0.192], 0.008, '#9be34d', { noInk: true }).rod([0.05, 1.03, 0.192], [0.15, 1.11, 0.192], 0.008, '#9be34d', { noInk: true })
      .cyl([0.15, 0.24, 0.15], [-0.33, 0.97, 0], { color: '#a8d8f5', name: 'bellows', pivot: [-0.33, 0.85, 0], edge: 'soft' })
      .rod([0.2, 0.92, 0.1], [0.45, 1.22, 0.3], 0.045, '#a8d8f5', { edge: 'soft' }).rod([0.45, 1.22, 0.3], [0.4, 1.47, 0.2], 0.045, '#a8d8f5', { edge: 'soft' })
      .rod([0.2, 0.87, 0.05], [0.5, 1.07, 0.2], 0.045, '#a8d8f5', { edge: 'soft' });
    b.each(3, (i) => b.torus([0.16, 0.16, 0.03], [-0.33, 0.89 + i * 0.08, 0], { color: '#7ab0d0', rot: [90, 0, 0], parent: 'bellows' }));
    for (const [x0, z] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) b.ball(0.08, [x0, 0.04, z], { color: '#2a2726', edge: 'soft' });
    return b.act({ click: [A.par(A.pose('bellows', { scale: 1.2, dur: 0.8 }), A.say('Hisss...', 1)), A.par(A.pose('bellows', { scale: 1, dur: 0.8 }), A.say('...puff.', 1)), A.pose('bellows', { scale: 1.2, dur: 0.8 }), A.pose('bellows', { scale: 1, dur: 0.8 })] }).done();
  }),
  // A Venus flytrap in a little pot: rosettes of red-lined traps with bristly lips; one snaps shut.
  e('venus flytrap', 'garden', 'plants', () => {
    const b = m('venus flytrap')
      .cyl([0.09, 0.07, 0.09], [0, 0.035, 0], { color: TERRA, taper: 1.25 })
      .cyl([0.11, 0.014, 0.11], [0, 0.072, 0], { color: TERRA })
      .cyl([0.1, 0.01, 0.1], [0, 0.078, 0], { color: '#5a4a3a' });
    ([[0, 0.14, 0.03, 0], [-0.045, 0.12, 0, -50], [0.048, 0.125, -0.01, 50]] as Array<[number, number, number, number]>).forEach(([x0, y, z, ry], i) => {
      const n = `jaw${i + 1}`;
      b.rod([0, 0.08, 0], [x0 * 0.8, y - 0.012, z - 0.01], 0.008, '#5aa553')
        .ball([0.045, 0.014, 0.035], [x0, y, z], { color: '#7cc45a', rot: [20, ry, 0] })
        .ball([0.036, 0.008, 0.026], [x0, y + 0.006, z + 0.003], { color: '#c0392b', rot: [20, ry, 0], noInk: true })
        .ball([0.045, 0.014, 0.035], [x0, y + 0.026, z], { color: '#7cc45a', rot: [-35, ry, 0], name: n, pivot: [x0, y + 0.008, z - 0.012] })
        .ball([0.036, 0.008, 0.026], [x0, y + 0.02, z + 0.003], { color: '#c0392b', rot: [-35, ry, 0], parent: n, noInk: true });
    });
    return b.act({ click: [[A.par(A.pose('jaw1', { rot: [32, 0, 0], dur: 0.1 }), A.say('SNAP!', 1))], [A.pose('jaw1', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // Vertical blinds 2 m tall across a window: a head rail and eight fabric slats on a wand that turn open and shut.
  e('vertical blinds', 'home', 'window things', () => {
    const b = m('vertical blinds', { edge: 'sharp' })
      .box([1.6, 2.0, 0.12], [0, 1.0, -0.14], { color: '#f4f2ee', round: 0.05 })
      .box([1.4, 1.75, 0.02], [0, 1.0, -0.07], { color: '#a8d8f5' })
      .box([1.5, 0.08, 0.1], [0, 1.94, 0], { color: 'white' })
      .stick([0.74, 1.9, 0.06], [0.74, 1.0, 0.06], 0.012, 'silver');
    b.each(8, (i) => b.box([0.15, 1.8, 0.012], [-0.63 + i * 0.18, 0.99, 0.01], { color: i % 2 ? '#efe4c8' : '#e6dab8', name: `slat${i + 1}`, mover: { kind: 'swing', axis: 'y', amount: 75, on: true } }));
    return b.act({ click: [[A.operate('slat', 'close'), A.say('Swish!', 1)], [A.operate('slat', 'open'), A.say('Swish!', 1)]] }).done();
  }),
  // A brown waistcoat over a white shirt on a dress form: welt pockets, brass buttons and a pocket watch on a chain
  // that pops out.
  e('vest', 'wardrobe', 'clothes', () => {
    const b = form('vest', '#7a4a2a', { len: 0.52 })
      .wedge([0.15, 0.2, 0.02], [0, 1.0, 0.118], { color: 'white', rot: [0, 0, 180] })
      .box([0.06, 0.025, 0.02], [0, 1.08, 0.12], { color: 'white' })
      .rod([0.07, 0.8, 0.125], [-0.06, 0.75, 0.125], 0.006, 'gold', { noInk: true })
      .cyl([0.04, 0.012, 0.04], [0.1, 0.8, 0.13], { color: 'gold', rot: [90, 0, 0], name: 'watch', piece: true })
      .cyl([0.032, 0.013, 0.032], [0.1, 0.8, 0.131], { color: 'white', rot: [90, 0, 0], parent: 'watch' });
    b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.27, 0.62, 0], 0.08, 'white').box([0.07, 0.01, 0.005], [s * 0.1, 0.72, 0.122], { color: '#5a3a22', noInk: true }));
    b.each(3, (i) => b.ball(0.02, [0, 0.88 - i * 0.07, 0.122], { color: 'gold' }));
    return b.act({ click: [A.pose('watch', { move: [0.04, 0.1, 0.05], dur: 0.3 }), A.say('Tick tock!', 1.3), A.wait(0.6), A.pose('watch', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A VHS cassette leaning on its cardboard sleeve; its spools turn as it rewinds.
  e('vhs', 'tech', 'media', () =>
    m('vhs', { edge: 'sharp' })
      .box([0.19, 0.105, 0.025], [0, 0.0525, 0], { color: '#2a2726', round: 0.1 })
      .box([0.09, 0.035, 0.002], [0, 0.055, 0.013], { color: '#3a3a4a', noInk: true })
      .cyl([0.03, 0.004, 0.03], [0.03, 0.055, 0.0135], { color: 'white', rot: [90, 0, 0], name: 'spoolL' })
      .box([0.004, 0.026, 0.002], [0.03, 0.055, 0.016], { color: '#2a2726', parent: 'spoolL', noInk: true })
      .cyl([0.03, 0.004, 0.03], [-0.03, 0.055, 0.0135], { color: 'white', rot: [90, 0, 0], name: 'spoolR' })
      .box([0.004, 0.026, 0.002], [-0.03, 0.055, 0.016], { color: '#2a2726', parent: 'spoolR', noInk: true })
      .box([0.15, 0.022, 0.002], [0, 0.09, 0.013], { color: 'white', noInk: true })
      .box([0.21, 0.125, 0.035], [0.02, 0.0625, -0.04], { color: '#2f4f8f', round: 0.1, rot: [0, -8, 0] })
      .box([0.212, 0.03, 0.036], [0.02, 0.09, -0.04], { color: '#d23a2a', noInk: true, rot: [0, -8, 0] })
      .act({ click: [A.par(A.pose('spoolL', { rot: [0, 0, 1080], dur: 1.5 }), A.pose('spoolR', { rot: [0, 0, 1080], dur: 1.5 }), A.say('Whirrr... rewind!', 1.6)), A.par(A.pose('spoolL', { rot: [0, 0, 0], dur: 0 }), A.pose('spoolR', { rot: [0, 0, 0], dur: 0 }))] })
      .done(),
  ),
  // A games console controller: two grips, a D-pad, a thumbstick that tilts and four coloured buttons that press.
  e('video game', 'tech', 'gaming', () => {
    const b = m('video game')
      .box([0.14, 0.03, 0.07], [0, 0.025, 0], { color: '#3a3f44', round: 0.6 })
      .box([0.03, 0.008, 0.01], [-0.04, 0.042, 0], { color: '#1e1c1c', edge: 'sharp' }).box([0.01, 0.008, 0.03], [-0.04, 0.042, 0], { color: '#1e1c1c', edge: 'sharp' })
      .cyl([0.018, 0.016, 0.018], [-0.015, 0.046, 0.022], { color: '#1e1c1c', name: 'stick', pivot: [-0.015, 0.04, 0.022] });
    b.pair((s) => b.ball([0.06, 0.035, 0.09], [s * 0.06, 0.02, 0.025], { color: '#3a3f44', rot: [0, s * 15, 0] }));
    ([[0.04, -0.012, '#f6d24a'], [0.04, 0.012, '#5aa553'], [0.028, 0, '#4e8fd6'], [0.052, 0, '#e0473b']] as Array<[number, number, string]>).forEach(([x0, z, c], i) => b.ball(0.011, [x0, 0.042, z], { color: c, name: `btn${i + 1}`, mover: { kind: 'slide', axis: 'y', amount: -0.004 } }));
    return b.act({ click: [A.pose('stick', { rot: [0, 0, 20], dur: 0.12 }), A.pose('stick', { rot: [0, 0, -20], dur: 0.12 }), A.par(A.pose('stick', { rot: [0, 0, 0], dur: 0.12 }), A.operate('btn4', 'down')), A.par(A.operate('btn4', 'up'), A.operate('btn2', 'down'), A.say('Pew pew! Level up!', 1.6)), A.operate('btn2', 'up')] }).done();
  }),
  // A video game shop 8 m wide: a purple front with an arcade cabinet in the window, a lime awning, a GAMES sign,
  // and a giant controller on the roof whose neon buttons light up.
  e('video game store', 'places', 'shops', () => {
    const b = shopFront('video game store', { w: 8, h: 5, d: 6, wall: '#6a3fa0', trim: '#2a2726', sign: 'GAMES', signC: '#9be34d', awning: ['#9be34d', '#2a2726'], doorC: '#2a2726' });
    const z = 2.85;
    b.box([0.8, 1.8, 0.6], [-2.4, 1.2, z - 0.15], { color: '#2f4f8f' }).box([0.6, 0.45, 0.04], [-2.4, 1.55, z + 0.16], { color: '#7ad06a', glow: true }).box([0.7, 0.12, 0.3], [-2.4, 1.15, z + 0.1], { color: '#2a2726' })
      .box([0.5, 0.7, 0.1], [2.0, 1.4, z], { color: '#e0473b' }).box([0.5, 0.7, 0.1], [2.7, 1.4, z], { color: '#4e8fd6' })
      .box([3.2, 1.2, 0.5], [0, 5.6, -1.0], { color: '#3a3f44', round: 0.5 })
      .pair((s) => b.ball([1.2, 1.3, 0.55], [s * 1.5, 5.4, -1.0], { color: '#3a3f44' }))
      .box([0.6, 0.2, 0.12], [-0.8, 5.65, -0.72], { color: '#1e1c1c' }).box([0.2, 0.6, 0.12], [-0.8, 5.65, -0.72], { color: '#1e1c1c' });
    ([[0.6, 5.85, '#f6d24a'], [0.6, 5.45, '#5aa553'], [0.4, 5.65, '#4e8fd6'], [0.8, 5.65, '#e0473b']] as Array<[number, number, string]>).forEach(([x0, y, c], i) => b.ball(0.2, [x0, y, -0.72], { color: c, glow: true, name: `neon${i + 1}`, mover: { kind: 'light', on: false } }));
    return b
      .act({
        click: [
          [A.operate('neon', 'on'), A.say('Pew pew! Game on!', 1.8), A.wait(1.5), A.operate('neon', 'off')],
          [A.operate('door', 'open'), A.say('Bleep-bloop!', 1.2), A.wait(1.8), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A video rental shop 8 m wide: navy front, film posters in the windows, a yellow awning, a giant VHS tape on the
  // roof and a returns slot by the door that swallows a tape.
  e('video store', 'places', 'shops', () => {
    const b = shopFront('video store', { w: 8, h: 5, d: 6, wall: '#2f4f8f', trim: 'white', sign: 'VIDEO RENTALS', signC: '#f6d24a', awning: ['#f6d24a', 'white'], doorC: '#d23a2a' });
    const z = 3.06;
    b.pair((s) => b.box([0.6, 0.85, 0.03], [s * 1.6, 1.5, z], { color: s > 0 ? '#e0473b' : '#f0923b', noInk: true }).box([0.6, 0.85, 0.03], [s * 2.4, 1.5, z], { color: s > 0 ? '#3fa7a0' : '#8a5fc4', noInk: true }));
    b.box([3.0, 1.6, 0.5], [0, 5.9, -1.0], { color: '#2a2726', round: 0.08 })
      .box([1.8, 0.35, 0.05], [0, 6.3, -0.73], { color: 'white' })
      .box([1.4, 0.55, 0.05], [0, 5.7, -0.73], { color: '#3a3a4a' })
      .pair((s) => b.cyl([0.45, 0.06, 0.45], [s * 0.35, 5.7, -0.7], { color: 'white', rot: [90, 0, 0] }))
      .box([0.5, 0.35, 0.15], [1.0, 1.2, 3.08], { color: 'silver' })
      .box([0.3, 0.04, 0.05], [1.0, 1.28, 3.16], { color: '#2a2726' })
      .label('RETURNS', [0.42, 0.1], [1.0, 1.12, 3.16], { color: 'silver', depth: 0.01 })
      .socket('returns', [1.0, 1.3, 3.17], 'slot', { size: 0.2 });
    return b
      .act({
        click: [
          [A.spawn('tape', 'vhs'), A.attach('tape', 'self', 'returns'), A.say('Thunk!', 1), A.wait(1), A.remove('tape', 'sink')],
          [A.operate('door', 'open'), A.say('Ding-dong!', 1.2), A.wait(1.8), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A Viking-style helmet on a stand: a riveted steel cap with a nose guard, bronze bands and two curved horns; it
  // rattles to a war-horn blast.
  e('viking helmet', 'armory', 'helmets', () => {
    const b = m('viking helmet')
      .cyl([0.1, 0.06, 0.1], [0, 0.03, 0], { color: '#7a5230', edge: 'sharp' })
      .ball([0.24, 0.22, 0.26], [0, 0.17, 0], { color: '#8f99a3', name: 'cap' })
      .cyl([0.25, 0.05, 0.27], [0, 0.1, 0], { color: 'bronze', parent: 'cap' })
      .box([0.025, 0.09, 0.015], [0, 0.08, 0.137], { color: 'bronze', parent: 'cap', edge: 'sharp' })
      .torus([0.24, 0.2, 0.02], [0, 0.17, 0], { color: 'bronze', rot: [0, 90, 0], tube: 0.06, parent: 'cap' });
    b.pair((s) => b.rod([s * 0.11, 0.19, 0], [s * 0.2, 0.27, 0.02], 0.05, '#efe4c8', { parent: 'cap' }).rod([s * 0.2, 0.27, 0.02], [s * 0.23, 0.36, 0.04], 0.035, '#efe4c8', { parent: 'cap' }).cone([0.03, 0.05, 0.03], [s * 0.232, 0.39, 0.045], { color: '#efe4c8', parent: 'cap' }));
    for (const [x0, z] of around(8, 0.125)) b.ball(0.012, [x0, 0.1, z], { color: '#d8b07a', parent: 'cap' });
    return b.act({ click: [A.par(A.say('Hoooooo!', 1.6), A.pose('cap', { rot: [0, 0, 8], dur: 0.12 })), A.pose('cap', { rot: [0, 0, -8], dur: 0.12 }), A.pose('cap', { rot: [0, 0, 0], dur: 0.12 })] }).done();
  }),
  // A climbing vine 2.4 m up a wooden post: a twisting green stem, heart-shaped leaves and curling tendrils; its tip
  // sways and a flower opens.
  e('vine', 'garden', 'plants', () => {
    const b = m('vine').box([0.14, 2.4, 0.14], [0, 1.2, 0], { color: 'wood', edge: 'sharp' }).box([0.4, 0.1, 0.4], [0, 0.05, 0], { color: 'dirt' });
    let prev: V = [0.1, 0.08, 0];
    for (let i = 1; i <= 8; i++) {
      const a = i * 1.3, p: V = [Math.cos(a) * 0.12, 0.08 + i * 0.28, Math.sin(a) * 0.12];
      b.rod(prev, p, 0.03, '#4f8a3a', i === 8 ? { name: 'tip', pivot: prev } : {}).ball([0.18, 0.15, 0.05], [Math.cos(a) * 0.22, p[1] + 0.03, Math.sin(a) * 0.22], { color: i % 2 ? 'leaf' : '#3f7a3a', rot: [0, -a / DEG + 90, 0] });
      prev = p;
    }
    return b.ball(0.07, [Math.cos(10.4) * 0.12, 2.44, Math.sin(10.4) * 0.12], { color: '#f4a1c0', name: 'flower', parent: 'tip', piece: true })
      .act({ click: [A.par(A.pose('tip', { rot: [0, 0, 15], dur: 0.4 }), A.pose('flower', { scale: 1.6, dur: 0.5 }), A.effect('sparkle', { dur: 1 })), A.pose('tip', { rot: [0, 0, -10], dur: 0.4 }), A.par(A.pose('tip', { rot: [0, 0, 0], dur: 0.4 }), A.pose('flower', { scale: 1, dur: 0.5 }))] })
      .done();
  }),
  // A glass cruet of vinegar with a cork stopper; it tips and pours.
  e('vinegar', 'food', 'condiments', () =>
    m('vinegar')
      .cyl([0.075, 0.15, 0.075], [0, 0.075, 0], { color: '#d9c88a', name: 'bottle', pivot: [0.04, 0, 0] })
      .cyl([0.075, 0.04, 0.075], [0, 0.17, 0], { color: '#d9c88a', taper: 0.4, parent: 'bottle' })
      .cyl([0.03, 0.05, 0.03], [0, 0.215, 0], { color: '#d9c88a', parent: 'bottle' })
      .cyl([0.034, 0.03, 0.034], [0, 0.25, 0], { color: '#b5814e', parent: 'bottle', taper: 1.15 })
      .label('VINEGAR', [0.06, 0.05], [0, 0.075, 0.037], { color: 'cream', depth: 0.004, parent: 'bottle' })
      .act({ click: [A.pose('bottle', { rot: [0, 0, 70], dur: 0.4 }), A.say('Glug glug...', 1.4), A.wait(0.8), A.pose('bottle', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A vineyard 30 m across: five rows of grapevines on posts and wires with purple bunches, a stone winery with a
  // red roof and an arched door, and oak barrels.
  e('vineyard', 'farm', 'fields', () => {
    const b = m('vineyard', { edge: 'sharp' }).box([32, 0.15, 22], [0, 0.075, 0], { color: '#8a6440', round: 0.02 });
    b.each(5, (r) => {
      const z = -8 + r * 3.2;
      b.box([22, 0.04, 1.0], [-4, 0.17, z], { color: '#6ab04c' });
      b.each(6, (k) => b.stick([-14 + k * 4, 0.15, z], [-14 + k * 4, 1.7, z], 0.1, '#7a5230'));
      b.stick([-14, 1.2, z], [6, 1.2, z], 0.02, '#9da3a8').stick([-14, 1.6, z], [6, 1.6, z], 0.02, '#9da3a8');
      b.each(5, (k) => b.ball([3.6, 0.9, 0.7], [-12 + k * 4, 1.35, z], { color: k % 2 ? '#5aa553' : '#4e9448', edge: 'soft' }).ball([0.25, 0.4, 0.22], [-12.6 + k * 4, 0.95, z + 0.3], { color: '#5a2a6a', edge: 'soft' }).ball([0.22, 0.36, 0.2], [-11.2 + k * 4, 0.98, z + 0.3], { color: '#6a3a7a', edge: 'soft' }));
    });
    b.box([7, 4.5, 6], [11.5, 2.4, 3], { color: '#d9cdb4', round: 0.03 });
    b.wedge([6.6, 2.4, 7.6], [11.5, 5.85, 3], { color: '#a3322a', rot: [0, 90, 0] });
    door(b, 'door', 1.6, 2.6, [11.5, 0.15, 6.0], '#7a5230', { frame: '#a7a7a0' });
    win(b, 0.9, 1.2, [9.4, 2.8, 6.0], 'front', '#7a5230');
    win(b, 0.9, 1.2, [13.6, 2.8, 6.0], 'front', '#7a5230');
    for (const [x0, z] of [[8.5, 7.4], [9.8, 7.6], [14.5, 7.3]]) b.cyl([0.75, 1.0, 0.75], [x0, 0.65, z], { color: '#9a6a3a', rot: [0, 0, 90], edge: 'soft' }).torus([0.78, 0.78, 0.06], [x0 - 0.3, 0.65, z], { color: '#55595e', rot: [0, 90, 0], tube: 0.05 }).torus([0.78, 0.78, 0.06], [x0 + 0.3, 0.65, z], { color: '#55595e', rot: [0, 90, 0], tube: 0.05 });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creak!', 1.2), A.wait(2), A.operate('door', 'close')], [A.par(A.effect('sparkle', { dur: 2 }), A.say('Squish squish!', 1.6))]] }).done();
  }),
  // A 1910s motor car, 3.5 m long and 2.1 m tall: a black body, brass radiator and lamps, a folding canvas top on
  // struts, sweeping mudguards with running boards, wooden-spoked wheels, a spare at the back and a bulb horn.
  e('vintage car', 'garage', 'cars', () => {
    const b = m('vintage car', { view: 'side', edge: 'sharp' })
      .box([1.2, 0.2, 2.9], [0, 0.6, -0.1], { color: '#2a2726' })
      .box([1.4, 0.75, 1.7], [0, 1.05, -0.6], { color: '#1e1c1c', round: 0.12 })
      .box([0.95, 0.55, 1.1], [0, 0.98, 0.8], { color: '#1e1c1c', round: 0.2 })
      .box([0.92, 0.7, 0.12], [0, 1.05, 1.38], { color: 'brass', round: 0.15 })
      .box([0.75, 0.55, 0.02], [0, 1.05, 1.445], { color: '#3a3633', noInk: true })
      .box([1.2, 0.5, 0.04], [0, 1.65, 0.28], { color: 'glass', rot: [-5, 0, 0] })
      .box([1.45, 0.06, 1.5], [0, 2.05, -0.5], { color: '#55595e', round: 0.3 })
      .box([0.6, 0.4, 0.06], [0, 1.35, -0.25], { color: '#7a5230', edge: 'soft' })
      .box([1.1, 0.12, 0.45], [0, 1.0, -0.6], { color: '#7a3226', round: 0.3, edge: 'soft' })
      .stick([0.2, 1.35, 0.2], [0.25, 1.5, -0.05], 0.03, '#2a2726')
      .torus([0.32, 0.32, 0.03], [0.25, 1.52, -0.08], { color: '#2a2726', rot: [55, 0, 0], tube: 0.12 })
      .torus([0.72, 0.72, 0.12], [0, 1.1, -1.55], { color: 'rubber', tube: 0.25, edge: 'soft' })
      .stick([0.55, 1.4, 0.95], [0.75, 1.4, 1.3], 0.03, 'brass')
      .cone([0.12, 0.25, 0.12], [0.8, 1.4, 1.42], { color: 'brass', rot: [-90, 0, 0] })
      .ball(0.1, [0.65, 1.4, 1.05], { color: '#2a2726', name: 'horn', piece: true });
    b.pair((s) => {
      b.stick([s * 0.68, 1.4, 0.25], [s * 0.68, 2.05, 0.25], 0.035, '#2a2726').stick([s * 0.68, 1.4, -1.2], [s * 0.68, 2.05, -1.2], 0.035, '#2a2726')
        .cyl([0.22, 0.2, 0.22], [s * 0.45, 1.25, 1.42], { color: 'brass', rot: [90, 0, 0] })
        .cyl([0.17, 0.02, 0.17], [s * 0.45, 1.25, 1.53], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: false } })
        .arc([0.95, 0.85, 0.32], [s * 0.7, 0.4, 1.05], { color: '#1e1c1c', arc: 150, rot: [0, 90, 0], tube: 0.06 })
        .arc([0.95, 0.85, 0.32], [s * 0.7, 0.4, -1.0], { color: '#1e1c1c', arc: 150, rot: [0, 90, 0], tube: 0.06 })
        .box([0.3, 0.05, 1.4], [s * 0.7, 0.55, 0.02], { color: '#1e1c1c' });
      for (const [z, t] of [[1.05, 'F'], [-1.0, 'B']] as Array<[number, string]>) {
        const n = `wheel${t}${s > 0 ? 'L' : 'R'}`;
        b.torus([0.8, 0.8, 0.12], [s * 0.7, 0.4, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.14, name: n, edge: 'soft' })
          .cyl([0.14, 0.14, 0.14], [s * 0.7, 0.4, z], { color: '#c8a050', rot: [0, 0, 90], parent: n });
        b.each(6, (i) => b.box([0.04, 0.62, 0.04], [s * 0.7, 0.4, z], { color: '#d8b07a', rot: [i * 30, 0, 0], parent: n }));
      }
    });
    return b
      .socket('seat', [0.3, 1.1, -0.6], 'seat')
      .act({
        click: [
          [A.pose('horn', { scale: 0.7, dur: 0.15 }), A.par(A.pose('horn', { scale: 1, dur: 0.2 }), A.say('Awooga! Awooga!', 1.8), A.operate('lamp', 'on')), A.wait(1.5), A.operate('lamp', 'off')],
          [A.par(A.effect('smoke', { dur: 2 }), A.anim('shake'), A.say('Putt-putt-putt!', 1.8))],
        ],
      })
      .done();
  }),
  // A 1930s cathedral radio in walnut, 0.4 m: an arched top, a fretwork speaker grille, a dial that glows and two
  // knobs; it crackles into a tune.
  e('vintage radio', 'music', 'audio gear', () => {
    const b = m('vintage radio', { edge: 'sharp' })
      .box([0.34, 0.03, 0.19], [0, 0.015, 0], { color: '#5a3a22' })
      .box([0.32, 0.24, 0.18], [0, 0.15, 0], { color: '#8c5a2b', round: 0.12 })
      .cyl([0.32, 0.18, 0.32], [0, 0.26, 0], { color: '#8c5a2b', rot: [90, 0, 0], edge: 'soft' })
      .cyl([0.22, 0.01, 0.22], [0, 0.27, 0.091], { color: '#e8d8b0', rot: [90, 0, 0] })
      .cyl([0.08, 0.01, 0.08], [0, 0.1, 0.092], { color: '#f6d24a', rot: [90, 0, 0], glow: true, name: 'dial', mover: { kind: 'light', on: false } })
      .cyl([0.045, 0.025, 0.045], [-0.1, 0.08, 0.098], { color: '#3a2414', rot: [90, 0, 0], name: 'knob' })
      .box([0.008, 0.02, 0.006], [-0.1, 0.09, 0.112], { color: 'cream', parent: 'knob' })
      .cyl([0.045, 0.025, 0.045], [0.1, 0.08, 0.098], { color: '#3a2414', rot: [90, 0, 0] });
    b.each(3, (i) => b.stick([(i - 1) * 0.05, 0.19, 0.1], [(i - 1) * 0.05, 0.36 - Math.abs(i - 1) * 0.025, 0.1], 0.012, '#5a3a22'));
    return b
      .act({
        click: [
          [A.par(A.operate('dial', 'on'), A.pose('knob', { rot: [0, 0, -120], dur: 0.5 })), A.say('Crackle... la-di-da!', 2)],
          [A.par(A.operate('dial', 'off'), A.pose('knob', { rot: [0, 0, 0], dur: 0.4 }), A.say('Click.', 1))],
        ],
      })
      .done();
  }),
  // A violin standing on its end, 0.6 m, with its bow across it: a varnished waisted body, f-holes, a black
  // fingerboard, a scroll with pegs; the bow saws and it sings.
  e('violin', 'music', 'strings', () => {
    const b = m('violin')
      .ball([0.2, 0.16, 0.06], [0, 0.1, 0], { color: '#b5521f' })
      .ball([0.14, 0.1, 0.055], [0, 0.18, 0], { color: '#b5521f' })
      .ball([0.16, 0.13, 0.06], [0, 0.25, 0], { color: '#b5521f' })
      .box([0.03, 0.24, 0.02], [0, 0.32, 0.03], { color: '#1e1c1c', edge: 'sharp' })
      .box([0.025, 0.08, 0.025], [0, 0.48, 0], { color: '#8a3a12' })
      .ball([0.035, 0.04, 0.03], [0, 0.535, 0.005], { color: '#8a3a12' })
      .box([0.05, 0.012, 0.01], [0, 0.14, 0.035], { color: 'cream', edge: 'sharp' })
      .box([0.035, 0.06, 0.008], [0, 0.07, 0.031], { color: '#1e1c1c', edge: 'sharp' })
      .stick([-0.25, 0.08, 0.06], [0.28, 0.3, 0.06], 0.008, '#5a3a22', { name: 'bow', piece: true })
      .stick([-0.24, 0.065, 0.065], [0.27, 0.285, 0.065], 0.004, '#f3eee0', { parent: 'bow', noInk: true });
    b.pair((s) => b.stick([s * 0.04, 0.12, 0.031], [s * 0.04, 0.2, 0.031], 0.006, '#1e1c1c', { noInk: true }).ball(0.012, [s * 0.02, 0.47, 0], { color: '#1e1c1c' }));
    return b.act({ click: [A.par(A.pose('bow', { move: [-0.1, -0.04, 0], dur: 0.4 }), A.say('Eeee-ooo-eeee!', 2)), A.pose('bow', { move: [0.08, 0.035, 0], dur: 0.4 }), A.pose('bow', { move: [-0.1, -0.04, 0], dur: 0.4 }), A.pose('bow', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A blue bench vice: a fixed jaw, a sliding jaw on its screw with a tommy-bar handle that turns to close it.
  e('vise', 'workshop', 'bench tools', () =>
    m('vise', { edge: 'sharp' })
      .box([0.18, 0.03, 0.14], [0, 0.015, 0], { color: '#2f6fc0' })
      .box([0.1, 0.08, 0.22], [0, 0.07, 0], { color: '#2f6fc0', round: 0.2 })
      .box([0.15, 0.07, 0.035], [0, 0.145, -0.07], { color: '#2f6fc0' })
      .box([0.15, 0.045, 0.008], [0, 0.155, -0.05], { color: '#5c6166' })
      .box([0.15, 0.07, 0.035], [0, 0.145, 0.06], { color: '#2f6fc0', name: 'jaw', mover: { kind: 'slide', axis: 'z', amount: -0.09 } })
      .box([0.15, 0.045, 0.008], [0, 0.155, 0.04], { color: '#5c6166', parent: 'jaw' })
      .stick([0, 0.09, 0.08], [0, 0.09, 0.17], 0.02, 'silver', { parent: 'jaw' })
      .stick([-0.09, 0.09, 0.17], [0.09, 0.09, 0.17], 0.012, 'silver', { name: 'bar', parent: 'jaw' })
      .ball(0.022, [0.095, 0.09, 0.17], { color: 'silver', parent: 'bar' }).ball(0.022, [-0.095, 0.09, 0.17], { color: 'silver', parent: 'bar' })
      .act({ click: [[A.par(A.operate('jaw', 'in'), A.pose('bar', { rot: [0, 0, 540], dur: 0.6 }), A.say('Squeak squeak!', 1.4))], [A.par(A.operate('jaw', 'out'), A.pose('bar', { rot: [0, 0, 0], dur: 0.6 }))]] })
      .done(),
  ),
  // A volcano as a 35 m hill: a steep rocky cone with a glowing crater, lava rivers down its flanks, a plume of
  // smoke; it erupts.
  e('volcano', 'nature', 'landforms', () => {
    const b = m('volcano')
      .cyl([56, 30, 56], [0, 15, 0], { color: '#6b5a4a', taper: 0.22, segs: 11 })
      .cyl([13, 5, 13], [0, 32, 0], { color: '#5a4a3a', taper: 0.85, segs: 9 })
      .cyl([9, 0.4, 9], [0, 34.3, 0], { color: '#ff8a2a', glow: true, name: 'lava', mover: { kind: 'light', on: true } })
      .ball([9, 5, 9], [1, 37, -1], { color: '#9da3a8' })
      .ball([10, 5, 9], [4, 40, -3], { color: '#c9ccd1' })
      .dome([16, 3, 50], [-8, 1.5, 6], { color: '#5aa553' });
    for (const [x0, z, x1, z1] of [[2, 4, 14, 18], [-3, 3, -16, 14], [4, -2, 20, -8]]) b.rod([x0, 33, z], [x1, 3, z1], 1.6, '#ff6a1a', { glow: true });
    return b.act({ click: [A.par(A.anim('shake'), A.effect('explosion', { dur: 1.5 }), A.effect('fire', { dur: 2.5 }), A.effect('smoke', { dur: 3 }), A.say('KA-BOOM!', 2))] }).done();
  }),
  // A volleyball at its real 21 cm: white, yellow and blue curved panels; it bounces.
  e('volleyball', 'sports', 'balls', () =>
    m('volleyball')
      .ball(0.21, [0, 0.105, 0], { color: 'white', name: 'ball', piece: true })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: '#4e8fd6', tube: 0.04, noInk: true, parent: 'ball' })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: '#f6d24a', tube: 0.04, noInk: true, rot: [0, 90, 0], parent: 'ball' })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: '#4e8fd6', tube: 0.04, noInk: true, rot: [90, 0, 0], parent: 'ball' })
      .act({ click: [A.pose('ball', { move: [0, 0.6, 0], rot: [0, 0, 180], dur: 0.35 }), A.par(A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 360], dur: 0.35 }), A.say('Boing!', 1)), A.pose('ball', { move: [0, 0.25, 0], rot: [0, 0, 450], dur: 0.2 }), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A beach volleyball court at real size, 18 x 9 m of sand: boundary lines, posts and a net 2.43 m high, and a
  // ball that gets spiked over it.
  e('volleyball court', 'sports', 'courts', () => {
    const b = m('volleyball court', { edge: 'sharp' })
      .box([22, 0.12, 13], [0, 0.06, 0], { color: '#6ab04c', round: 0.02 })
      .box([19, 0.1, 10], [0, 0.13, 0], { color: '#e8d29a' })
      .ball(0.21, [2, 0.29, 3.2], { color: 'white', name: 'ball', piece: true })
      .torus([0.214, 0.214, 0.06], [2, 0.29, 3.2], { color: '#4e8fd6', tube: 0.04, noInk: true, parent: 'ball' });
    b.box([9.6, 1.0, 0.02], [0, 1.93, 0], { color: '#2a2726', rot: [0, 90, 0] })
      .box([9.6, 0.07, 0.04], [0, 2.43, 0], { color: 'white', rot: [0, 90, 0] })
      .box([9.6, 0.05, 0.04], [0, 1.44, 0], { color: 'white', rot: [0, 90, 0] });
    b.pair((s) => {
      b.cyl([0.12, 2.6, 0.12], [0, 1.43, s * 5.1], { color: 'silver' }).box([0.4, 0.5, 0.3], [0, 0.4, s * 5.1], { color: '#2f4f8f' })
        .box([0.06, 0.012, 9], [s * 9, 0.185, 0], { color: '#2f4f8f', noInk: true })
        .box([18, 0.012, 0.06], [0, 0.185, s * 4.5], { color: '#2f4f8f', noInk: true });
    });
    b.box([0.06, 0.012, 9], [0, 0.185, 0], { color: '#2f4f8f', noInk: true });
    return b
      .act({
        click: [
          [A.pose('ball', { move: [-1, 3.2, -1.6], dur: 0.45 }), A.par(A.pose('ball', { move: [-5, 0, -4.4], dur: 0.45 }), A.say('Thwack!', 1.2)), A.effect('dust', { dur: 1 })],
          [A.pose('ball', { move: [-2.5, 2.5, -2.2], dur: 0.6 }), A.pose('ball', { move: [0, 0, 0], dur: 0.6 }), A.say('Boing!', 1)],
        ],
      })
      .done();
  }),
  // A burlap voodoo doll: button eyes, a stitched mouth and seams, coloured pins; one pin pokes in and it shivers.
  e('voodoo doll', 'fantasy', 'magic items', () => {
    const b = m('voodoo doll').capsule([0.1, 0.12, 0.06], [0, 0.12, 0], { color: '#c2a36b', name: 'doll' })
      .ball([0.11, 0.1, 0.08], [0, 0.23, 0], { color: '#c2a36b', parent: 'doll' })
      .rod([-0.1, 0.16, 0], [0.1, 0.16, 0], 0.04, '#c2a36b', { parent: 'doll' })
      .stick([-0.025, 0.205, 0.04], [0.025, 0.205, 0.04], 0.005, '#4a2e1a', { noInk: true, parent: 'doll' })
      .stick([0, 0.08, 0.031], [0, 0.18, 0.031], 0.004, '#4a2e1a', { noInk: true, parent: 'doll' });
    b.pair((s) => b.rod([s * 0.03, 0.08, 0], [s * 0.05, 0.02, 0], 0.045, '#c2a36b', { parent: 'doll' }).cyl([0.026, 0.006, 0.026], [s * 0.025, 0.24, 0.04], { color: '#1e1c1c', rot: [90, 0, 0], parent: 'doll' }));
    for (const [a, c] of [[[-0.04, 0.27, 0.03], '#f6d24a'], [[0.06, 0.25, -0.01], '#4e8fd6']] as Array<[V, string]>) b.stick([a[0] * 0.4, a[1] - 0.02, 0], a, 0.004, 'silver', { parent: 'doll' }).ball(0.016, a, { color: c, parent: 'doll' });
    b.stick([0.06, 0.18, 0.07], [0.03, 0.14, 0.03], 0.004, 'silver', { name: 'pin', piece: true }).ball(0.016, [0.06, 0.18, 0.07], { color: '#e0473b', parent: 'pin' });
    return b.act({ click: [A.pose('pin', { move: [-0.015, -0.015, -0.02], dur: 0.15 }), A.par(A.pose('doll', { rot: [0, 0, 8], dur: 0.08 }), A.say('Eek!', 1)), A.pose('doll', { rot: [0, 0, -8], dur: 0.08 }), A.pose('doll', { rot: [0, 0, 0], dur: 0.08 }), A.pose('pin', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A gift voucher standing in a little wooden block: a cream card with an orange tear-off stub along a perforated
  // edge; the stub tears off.
  e('voucher', 'study', 'documents', () => {
    const b = m('voucher', { edge: 'sharp' })
      .box([0.18, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' })
      .box([0.135, 0.08, 0.004], [-0.018, 0.065, 0], { color: 'cream', round: 0.05, name: 'card' })
      .box([0.035, 0.08, 0.004], [0.068, 0.065, 0], { color: '#f0923b', round: 0.05, name: 'stub', parent: 'card', piece: true })
      .label('50% OFF', [0.11, 0.04], [-0.018, 0.07, 0.003], { color: 'cream', depth: 0.002 });
    b.each(5, (i) => b.box([0.002, 0.008, 0.005], [0.049, 0.033 + i * 0.016, 0], { color: 'gray', noInk: true }));
    return b.act({ click: [[A.say('Rrrip!', 1), A.detach('stub', 'stub')], [A.reattach('stub')]] }).done();
  }),
  // A VR headset on a display head: the visor, a padded strap, two cameras; its lights come on.
  e('vr headset', 'tech', 'gadgets', () =>
    m('vr headset')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.06, 0.12, 0.06], [0, 0.08, 0], { color: '#d4d7da' })
      .ball([0.17, 0.21, 0.19], [0, 0.24, 0], { color: '#d4d7da' })
      .box([0.19, 0.1, 0.1], [0, 0.26, 0.1], { color: 'white', round: 0.5 })
      .box([0.17, 0.08, 0.01], [0, 0.26, 0.152], { color: '#1e1c1c', round: 0.4 })
      .torus([0.21, 0.24, 0.035], [0, 0.26, -0.01], { color: '#3a3f44', rot: [90, 0, 0], tube: 0.1 })
      .ball(0.014, [0.05, 0.28, 0.158], { color: '#5c6166' }).ball(0.014, [-0.05, 0.28, 0.158], { color: '#5c6166' })
      .box([0.1, 0.012, 0.004], [0, 0.235, 0.158], { color: '#6fd3e8', glow: true, name: 'leds', mover: { kind: 'light', on: false } })
      .act({ click: [A.par(A.operate('leds', 'on'), A.effect('sparkle', { dur: 1.5 }), A.say('Bloop-bleep!', 1.4)), A.wait(1.5), A.operate('leds', 'off')] })
      .done(),
  ),
  // A Belgian waffle on a plate with a pat of butter; a little jug tips and maple syrup spreads over it.
  e('waffle', 'food', 'breakfast', () => {
    const b = m('waffle').cyl([0.24, 0.012, 0.24], [0, 0.006, 0], { color: 'white' })
      .box([0.16, 0.028, 0.16], [0, 0.026, 0], { color: '#d9963e', round: 0.2 })
      .box([0.035, 0.018, 0.035], [0.01, 0.048, 0.005], { color: '#f7e17a', rot: [0, 35, 0] })
      .ball([0.12, 0.006, 0.11], [-0.01, 0.041, 0.01], { color: '#8a4a1a', name: 'syrup', scale: 0 })
      .cyl([0.05, 0.07, 0.05], [0.13, 0.035, -0.08], { color: 'white', name: 'jug', pivot: [0.13, 0.0, -0.08] })
      .cyl([0.044, 0.004, 0.044], [0.13, 0.07, -0.08], { color: '#8a4a1a', parent: 'jug', noInk: true });
    for (const u of [-0.05, 0, 0.05]) for (const v of [-0.05, 0, 0.05]) b.box([0.034, 0.004, 0.034], [u, 0.04, v], { color: '#b8742f', noInk: true });
    return b.act({ click: [[A.pose('jug', { rot: [0, 0, 60], dur: 0.4 }), A.par(A.pose('syrup', { scale: 1, dur: 0.8 }), A.say('Drizzle...', 1.4)), A.pose('jug', { rot: [0, 0, 0], dur: 0.4 })], [A.pose('syrup', { scale: 0, dur: 0.3 })]] }).done();
  }),
  // A round Belgian waffle maker (19 cm tall): a black base on four feet with a front grip and two lights, the
  // dark grid plate holding a golden waffle, and a domed brushed-steel lid on a back hinge with a black
  // cool-touch handle; it opens on the cooked waffle in a puff of steam.
  e('waffle iron', 'kitchen', 'appliances', () => {
    const blk = '#2a2726', steel = '#c9ccd1';
    const b = m('waffle iron', { edge: 'sharp' })
      .cyl([0.27, 0.07, 0.27], [0, 0.045, 0], { color: blk, taper: 1.04, round: 0.2 })
      .box([0.05, 0.03, 0.1], [0, 0.06, 0.17], { color: blk, round: 0.4 })
      .box([0.09, 0.06, 0.05], [0, 0.11, -0.145], { color: blk, round: 0.3 })
      .cyl([0.225, 0.012, 0.225], [0, 0.086, 0], { color: '#4a4f55' })
      .cyl([0.2, 0.02, 0.2], [0, 0.098, 0], { color: '#e0a24e', edge: 'soft' })
      .ball(0.014, [0.05, 0.06, 0.137], { color: '#5ad06a', glow: true, name: 'ready', mover: { kind: 'light', on: false } })
      .ball(0.012, [-0.05, 0.06, 0.137], { color: '#e0473b', glow: true })
      .cyl([0.275, 0.035, 0.275], [0, 0.126, 0], { color: steel, name: 'lid', pivot: [0, 0.11, -0.14], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .dome([0.25, 0.05, 0.25], [0, 0.168, 0], { color: steel, parent: 'lid' })
      .cyl([0.08, 0.004, 0.08], [0, 0.194, 0], { color: '#9da3a8', parent: 'lid' })
      .box([0.048, 0.032, 0.13], [0, 0.132, 0.19], { color: blk, round: 0.4, parent: 'lid' });
    b.each(4, (i) => b.cyl([0.03, 0.012, 0.03], [i % 2 ? 0.09 : -0.09, 0.006, i < 2 ? 0.09 : -0.09], { color: '#3a3633' }));
    for (const u of [-0.06, -0.02, 0.02, 0.06]) {
      const len = 2 * Math.sqrt(0.01 - u * u) - 0.012;
      b.box([0.004, 0.005, len], [u, 0.109, 0], { color: '#b8742f', noInk: true }).box([len, 0.005, 0.004], [0, 0.109, u], { color: '#b8742f', noInk: true });
    }
    return b.act({ click: [A.operate('ready', 'on'), A.wait(0.6), A.par(A.operate('lid', 'open'), A.effect('steam', { dur: 1.8 }), A.say('Ding!', 1)), A.wait(1.8), A.par(A.operate('lid', 'close'), A.operate('ready', 'off'))] }).done();
  }),
  // A covered wagon of the old West, 3.1 m tall and 4.5 m long (plus its tongue): a wooden bed on big spoked wheels
  // (bigger at the back), a white canvas bonnet on hoops with a puckered back that opens, a driver's bench. A horse
  // comes to pull it.
  e('wagon (traditional)', 'garage', 'carts', () => {
    const b = m('wagon (traditional)', { view: 'side', edge: 'sharp' })
      .box([1.4, 0.55, 3.6], [0, 1.25, 0], { color: '#9a6a3a', round: 0.04 })
      .box([1.44, 0.08, 3.64], [0, 1.5, 0], { color: '#5a3a22' })
      .loft([1.7, 1.7, 3.4], [0, 2.3, 0], [[0, 0.88, 0.9, 0.0], [0.06, 1, 1, 0], [0.94, 1, 1, 0], [1, 0.9, 0.92, 0.0]], { color: '#f4ecd6', cut: 'top', edge: 'soft' })
      .box([1.3, 0.08, 0.5], [0, 1.95, 2.05], { color: '#7a5230' })
      .box([1.3, 0.4, 0.06], [0, 2.15, 1.82], { color: '#7a5230' })
      .rod([0, 0.95, 1.9], [0, 0.75, 4.0], 0.1, '#7a5230')
      .stick([-0.5, 0.78, 3.9], [0.5, 0.78, 3.9], 0.07, '#7a5230')
      .ball([1.2, 1.2, 0.2], [0, 2.3, -1.72], { color: '#e8dfc6', name: 'flap', pivot: [0, 3.15, -1.72], mover: { kind: 'swing', axis: 'x', amount: 70 } })
      .cyl([0.3, 0.45, 0.3], [0.5, 1.55, -1.95], { color: '#9a6a3a', rot: [0, 0, 90], edge: 'soft' });
    b.each(4, (i) => b.torus([1.74, 1.74, 0.06], [0, 2.3, -1.4 + i * 0.93], { color: '#e8dfc6', tube: 0.04, noInk: true }));
    b.pair((s) => {
      for (const [z, d, t] of [[1.25, 1.1, 'F'], [-1.2, 1.5, 'B']] as Array<[number, number, string]>) {
        const n = `wheel${t}${s > 0 ? 'L' : 'R'}`;
        b.torus([d, d, 0.1], [s * 0.85, d / 2, z], { color: '#3a3633', rot: [0, 90, 0], tube: 0.08, name: n })
          .cyl([0.22, 0.26, 0.22], [s * 0.85, d / 2, z], { color: '#7a5230', rot: [0, 0, 90], parent: n });
        b.each(6, (i) => b.box([0.05, d * 0.92, 0.05], [s * 0.85, d / 2, z], { color: '#9a6a3a', rot: [i * 30, 0, 0], parent: n }));
      }
    });
    return b
      .socket('seat', [0.2, 2.0, 2.05], 'seat')
      .socket('load', [0, 1.55, -0.3], 'inside', { size: 1.4 })
      .act({
        click: [
          [A.spawn('nag', 'horse', { rel: 'front', of: 'self', dist: 'close' }), A.say('Neigh!', 1.5, 'nag'), A.wait(2), A.remove('nag', 'fade')],
          [A.operate('flap', 'open'), A.say('Creak, creak!', 1.4), A.wait(1.8), A.operate('flap', 'close')],
        ],
      })
      .done();
  }),
  // A pedestrian signal head: a black box with a white walking figure and an orange hand that swap over.
  e('walk sign', 'ideas', 'signs', () => {
    const b = m('walk sign', { edge: 'sharp' })
      .box([0.2, 0.03, 0.12], [0, 0.015, 0], { color: '#3a3633' })
      .box([0.32, 0.4, 0.14], [0, 0.23, 0], { color: '#2a2726', round: 0.1 })
      .box([0.34, 0.02, 0.12], [0, 0.44, 0.06], { color: '#2a2726' })
      .box([0.26, 0.16, 0.01], [0, 0.32, 0.071], { color: '#1e1c1c' })
      .box([0.26, 0.16, 0.01], [0, 0.14, 0.071], { color: '#1e1c1c' })
      .box([0.08, 0.1, 0.006], [0, 0.33, 0.077], { color: '#f0923b', glow: true, name: 'hand', mover: { kind: 'light', on: true } })
      .ball(0.025, [0.01, 0.2, 0.08], { color: 'white', glow: true, name: 'walker', mover: { kind: 'light', on: false } })
      .rod([0, 0.185, 0.08], [-0.008, 0.13, 0.08], 0.022, 'white', { parent: 'walker' });
    b.pair((s) => b.rod([-0.008, 0.13, 0.08], [-0.008 + s * 0.03, 0.08, 0.08], 0.018, 'white', { parent: 'walker' }).rod([0, 0.17, 0.08], [s * 0.035, 0.13, 0.08], 0.016, 'white', { parent: 'walker' }));
    return b.act({ click: [A.par(A.operate('hand', 'off'), A.operate('walker', 'on'), A.say('Beep-beep-beep!', 2)), A.wait(2.5), A.par(A.operate('walker', 'off'), A.operate('hand', 'on'))] }).done();
  }),
  // A pedestrian crossing post at real size (the signal head sits at 2.4 m, above the vocabulary's 0.3 m): a
  // yellow push-button box at 1 m with a WAIT light, and the walking-man signal on top.
  e('walk signal', 'ideas', 'signs', () => {
    const b = m('walk signal', { edge: 'sharp' })
      .cyl([0.3, 0.06, 0.3], [0, 0.03, 0], { color: '#5c6166' })
      .cyl([0.11, 2.6, 0.11], [0, 1.33, 0], { color: '#5c6166' })
      .box([0.34, 0.6, 0.18], [0, 2.4, 0.1], { color: '#2a2726', round: 0.1 })
      .box([0.28, 0.24, 0.01], [0, 2.53, 0.191], { color: '#1e1c1c' })
      .box([0.28, 0.24, 0.01], [0, 2.26, 0.191], { color: '#1e1c1c' })
      .ball([0.1, 0.12, 0.02], [0, 2.53, 0.2], { color: '#f0923b', glow: true, name: 'hand', mover: { kind: 'light', on: true } })
      .ball(0.03, [0.005, 2.32, 0.2], { color: 'white', glow: true, name: 'walker', mover: { kind: 'light', on: false } })
      .rod([0, 2.3, 0.2], [-0.006, 2.23, 0.2], 0.024, 'white', { parent: 'walker' })
      .box([0.16, 0.26, 0.1], [0, 1.05, 0.1], { color: '#f6d24a', round: 0.3 })
      .box([0.1, 0.035, 0.01], [0, 1.12, 0.155], { color: '#e0473b', glow: true, name: 'wait', mover: { kind: 'light', on: false } })
      .cyl([0.06, 0.02, 0.06], [0, 1.0, 0.155], { color: '#2a2726', rot: [90, 0, 0], name: 'button', mover: { kind: 'slide', axis: 'z', amount: -0.01 } });
    b.pair((s) => b.rod([-0.006, 2.23, 0.2], [-0.006 + s * 0.035, 2.17, 0.2], 0.02, 'white', { parent: 'walker' }));
    return b
      .act({ click: [A.operate('button', 'in'), A.par(A.operate('button', 'out'), A.operate('wait', 'on'), A.say('Wait...', 1.2)), A.wait(1.2), A.par(A.operate('wait', 'off'), A.operate('hand', 'off'), A.operate('walker', 'on'), A.say('Beep-beep-beep!', 2)), A.wait(2.2), A.par(A.operate('walker', 'off'), A.operate('hand', 'on'))] })
      .done();
  }),
  // A walking frame 0.85 m tall: aluminium side frames with grips, front wheels, rubber feet and tennis-ball glides
  // at the back; it shuffles forward and back.
  e('walker', 'clinic', 'mobility aids', () => {
    const b = m('walker', { edge: 'sharp' }).stick([-0.27, 0.75, 0.2], [0.27, 0.75, 0.2], 0.028, 'silver', { name: 'frame', piece: true });
    b.pair((s) => {
      b.stick([s * 0.27, 0.12, 0.2], [s * 0.27, 0.86, 0.18], 0.028, 'silver', { parent: 'frame' }).stick([s * 0.27, 0.05, -0.2], [s * 0.27, 0.86, -0.18], 0.028, 'silver', { parent: 'frame' })
        .stick([s * 0.27, 0.86, 0.2], [s * 0.27, 0.86, -0.22], 0.028, 'silver', { parent: 'frame' }).capsule([0.045, 0.14, 0.045], [s * 0.27, 0.865, -0.12], { color: '#5c6166', rot: [90, 0, 0], parent: 'frame', edge: 'soft' })
        .stick([s * 0.27, 0.4, 0.2], [s * 0.27, 0.4, -0.2], 0.022, 'silver', { parent: 'frame' }).ball(0.065, [s * 0.27, 0.033, -0.2], { color: '#c8e04a', parent: 'frame', edge: 'soft' });
      wheel(b, `wheel${s > 0 ? 'L' : 'R'}`, 0.13, 0.035, [s * 0.27, 0.065, 0.2], '#5c6166', 'frame');
    });
    return b.act({ click: [A.pose('frame', { move: [0, 0.03, 0.15], dur: 0.4 }), A.pose('frame', { move: [0, 0, 0.15], dur: 0.2 }), A.say('Squeak... squeak.', 1.4), A.pose('frame', { move: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A walkie-talkie, 0.2 m with its aerial: a speaker grille, a little screen, a channel knob and a talk button on
  // the side; it crackles.
  e('walkie talkie', 'tech', 'radios', () =>
    m('walkie talkie', { edge: 'sharp' })
      .box([0.06, 0.14, 0.035], [0, 0.07, 0], { color: '#2a2726', round: 0.3 })
      .box([0.062, 0.03, 0.037], [0, 0.02, 0], { color: '#f6d24a', round: 0.3 })
      .box([0.045, 0.05, 0.004], [0, 0.05, 0.018], { color: '#3a3633', noInk: true })
      .box([0.04, 0.02, 0.004], [0, 0.11, 0.018], { color: '#9be34d', glow: true, name: 'screen', mover: { kind: 'light', on: false } })
      .cyl([0.012, 0.09, 0.012], [0.017, 0.185, 0], { color: '#2a2726', edge: 'soft' })
      .cyl([0.016, 0.015, 0.016], [-0.017, 0.147, 0], { color: '#f0923b' })
      .box([0.006, 0.03, 0.015], [-0.032, 0.09, 0], { color: '#5c6166', name: 'talk', mover: { kind: 'slide', axis: 'x', amount: 0.004 } })
      .act({ click: [A.par(A.operate('talk', 'out'), A.operate('screen', 'on'), A.say('Kssht! Come in... over!', 2)), A.wait(0.5), A.par(A.operate('talk', 'in'), A.operate('screen', 'off'))] })
      .done(),
  ),
  // A section of brick garden wall 2 m long and 1.2 m tall with a stone coping; one loose brick slides out.
  e('wall', 'workshop', 'building materials', () => {
    const b = m('wall', { edge: 'sharp' }).box([2.0, 1.2, 0.3], [0, 0.6, 0], { color: '#b04a32', round: 0.02, name: 'wall' }).box([2.1, 0.08, 0.36], [0, 1.24, 0], { color: '#bdbab0' });
    b.each(5, (i) => b.box([2.0, 0.015, 0.302], [0, 0.2 + i * 0.2, 0], { color: '#d8cfc4', noInk: true }));
    for (let r = 0; r < 6; r++) b.each(4, (i) => b.box([0.015, 0.2, 0.304], [-0.75 + i * 0.5 + (r % 2) * 0.25, 0.1 + r * 0.2, 0], { color: '#d8cfc4', noInk: true }));
    b.box([0.22, 0.17, 0.3], [0.25, 0.7, 0.04], { color: '#c05a3e', round: 0.1, name: 'brick', parent: 'wall', piece: true });
    return b.act({ click: [[A.say('Clunk!', 1), A.detach('brick', 'brick')], [A.reattach('brick'), A.say('Scrape!', 1)]] }).done();
  }),
  // A leather bifold wallet with cards in its slots and a banknote showing; it opens and shuts.
  e('wallet', 'wardrobe', 'bags', () =>
    m('wallet')
      .box([0.11, 0.012, 0.09], [0, 0.006, 0], { color: 'leather', round: 0.3 })
      .box([0.1, 0.004, 0.08], [0, 0.013, 0.0], { color: '#7a4a2a', noInk: true })
      .box([0.085, 0.003, 0.025], [0.004, 0.0155, 0.022], { color: '#e2b23a', round: 0.2 })
      .box([0.085, 0.003, 0.025], [0.004, 0.0158, -0.004], { color: '#4e8fd6', round: 0.2 })
      .box([0.1, 0.003, 0.06], [0, 0.016, -0.02], { color: '#7ab07a', round: 0.1 })
      .box([0.11, 0.012, 0.09], [0, 0.018, 0], { color: '#8a5a35', round: 0.3, name: 'flap', pivot: [0, 0.012, -0.045], mover: { kind: 'swing', axis: 'x', amount: -150, on: true } })
      .ball([0.015, 0.006, 0.015], [0.04, 0.025, 0.03], { color: 'silver', parent: 'flap' })
      .act({ click: [[A.operate('flap', 'close'), A.say('Snap!', 1)], [A.operate('flap', 'open'), A.say('Cha-ching!', 1.2)]] })
      .done(),
  ),
  // A roll of patterned wallpaper on a table edge with a length hanging down; it unrolls to the floor and rolls up.
  e('wallpaper', 'home', 'decor', () => {
    const b = m('wallpaper')
      .box([0.6, 0.04, 0.4], [0, 0.48, -0.1], { color: '#d8b07a', edge: 'sharp' })
      .cyl([0.12, 0.55, 0.12], [0, 0.56, 0.0], { color: '#f2e8d0', rot: [0, 0, 90], name: 'roll' })
      .cyl([0.04, 0.552, 0.04], [0, 0.56, 0.0], { color: '#c39a6b', rot: [0, 0, 90], parent: 'roll' })
      .box([0.53, 0.42, 0.006], [0, 0.35, 0.06], { color: '#f2e8d0', name: 'strip', pivot: [0, 0.56, 0.06], scale: 0 });
    b.pair((s) => b.stick([s * 0.27, 0.46, -0.27], [s * 0.27, 0, -0.27], 0.04, '#7a5230').stick([s * 0.27, 0.46, 0.07], [s * 0.27, 0, 0.07], 0.04, '#7a5230'));
    b.each(4, (i) => b.box([0.012, 0.42, 0.002], [-0.18 + i * 0.12, 0.35, 0.064], { color: '#3fa7a0', name: `stripe${i + 1}`, pivot: [-0.18 + i * 0.12, 0.56, 0.064], scale: 0, noInk: true }));
    const show = (k: number, dur: number) => A.par(A.pose('strip', { scale: k, dur }), ...[1, 2, 3, 4].map((i) => A.pose(`stripe${i}`, { scale: k, dur })), A.pose('roll', { rot: [k * -540, 0, 0], dur }));
    return b.act({ click: [[show(1, 0.8), A.say('Swish!', 1)], [show(0, 0.6)]] }).done();
  }),
  // A whole walnut and one cracked in half to show the kernel; the whole one cracks open.
  e('walnut', 'food', 'nuts', () =>
    m('walnut')
      .ball([0.034, 0.016, 0.034], [-0.022, 0.008, 0], { color: '#a87a4a', name: 'nut' })
      .ball([0.034, 0.018, 0.034], [-0.022, 0.024, 0], { color: '#a87a4a', name: 'shell', parent: 'nut', piece: true })
      .rod([-0.038, 0.016, 0], [-0.006, 0.016, 0], 0.003, '#7a5a30', { noInk: true, parent: 'nut' })
      .ball([0.034, 0.016, 0.03], [0.026, 0.008, 0.012], { color: '#a87a4a' })
      .ball([0.016, 0.012, 0.024], [0.019, 0.016, 0.012], { color: '#d9b07a' })
      .ball([0.016, 0.012, 0.024], [0.033, 0.016, 0.012], { color: '#d9b07a' })
      .act({ click: [[A.say('Crack!', 1), A.detach('shell', 'half')], [A.reattach('shell')]] })
      .done(),
  ),
  // A walnut tree 12 m tall: a stout grey trunk, spreading limbs and a broad crown (it sways), green walnuts; one
  // falls.
  e('walnut tree', 'garden', 'trees', () => {
    const b = m('walnut tree')
      .cyl([0.8, 4.0, 0.8], [0, 2.0, 0], { color: '#7a6a5a', taper: 0.75 })
      .rod([0, 3.4, 0], [-2.0, 5.2, 0.4], 0.35, '#7a6a5a').rod([0, 3.7, 0], [2.0, 5.4, -0.2], 0.35, '#7a6a5a').rod([0, 3.9, 0], [0.3, 6.2, -1.2], 0.3, '#7a6a5a')
      .ball([9, 5.5, 8], [0, 8.2, 0], { color: '#4e8a3a', name: 'top' })
      .ball([4.5, 3.5, 4], [-3.2, 7.0, 1.0], { color: '#5aa553', parent: 'top' })
      .ball([4.5, 3.5, 4], [3.2, 7.2, 0.6], { color: '#5aa553', parent: 'top' })
      .ball([4, 3, 4], [0.5, 10.4, -0.5], { color: '#5aa553', parent: 'top' });
    for (const [x0, y, z] of [[-3.0, 5.6, 2.6], [0.6, 5.5, 3.6], [3.6, 6.0, 2.4], [-1.2, 8.6, 3.6], [2.0, 9.2, 2.6], [-4.6, 7.4, 1.6]] as V[]) b.ball(0.12, [x0, y, z], { color: '#9acd5a', parent: 'top' });
    return b.ball(0.13, [1.2, 5.3, 3.3], { color: '#9acd5a', name: 'nut', parent: 'top', piece: true })
      .act({ click: [[A.say('Thunk!', 1), A.detach('nut', 'walnut')], [A.reattach('nut'), A.say('Rustle...', 1)]] })
      .done();
  }),
  // A magician's wand, 0.35 m, black with white tips, standing in a little velvet-topped stand; it floats up in a
  // shower of sparkles.
  e('wand', 'fantasy', 'magic items', () =>
    m('wand')
      .cyl([0.1, 0.04, 0.1], [0, 0.02, 0], { color: '#5a2a6a', edge: 'sharp' })
      .cyl([0.08, 0.012, 0.08], [0, 0.046, 0], { color: '#8a5fc4' })
      .stick([0, 0.03, 0], [0, 0.32, 0], 0.012, '#1e1c1c', { name: 'wand', piece: true })
      .stick([0, 0.32, 0], [0, 0.355, 0], 0.013, 'white', { parent: 'wand' })
      .stick([0, 0.03, 0], [0, 0.06, 0], 0.013, 'white', { parent: 'wand' })
      .act({ click: [A.par(A.pose('wand', { move: [0, 0.25, 0], rot: [0, 0, 40], dur: 0.5 }), A.effect('sparkle', { dur: 2 }), A.say('Bibbidi-bobbidi-boo!', 2)), A.wait(0.6), A.pose('wand', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A WANTED poster nailed to a weathered board: a sketch of the outlaw and the reward; its corner flaps in the wind.
  e('wanted poster', 'ideas', 'signs', () =>
    m('wanted poster', { edge: 'sharp' })
      .box([0.55, 0.78, 0.05], [0, 0.39, -0.02], { color: '#7a5230' })
      .box([0.42, 0.62, 0.006], [0, 0.42, 0.012], { color: '#e8d4a0', name: 'poster', pivot: [0, 0.72, 0.012] })
      .label('WANTED', [0.36, 0.08], [0, 0.65, 0.016], { color: '#e8d4a0', depth: 0.003, parent: 'poster' })
      .box([0.22, 0.22, 0.004], [0, 0.45, 0.017], { color: '#c8a878', parent: 'poster' })
      .ball([0.09, 0.11, 0.006], [0, 0.44, 0.02], { color: '#5a3a22', parent: 'poster', noInk: true })
      .box([0.14, 0.03, 0.006], [0, 0.51, 0.021], { color: '#1e1c1c', parent: 'poster', noInk: true })
      .label('$500 REWARD', [0.3, 0.06], [0, 0.24, 0.016], { color: '#e8d4a0', depth: 0.003, parent: 'poster' })
      .ball(0.02, [0.18, 0.7, 0.02], { color: 'iron' }).ball(0.02, [-0.18, 0.7, 0.02], { color: 'iron' })
      .act({ click: [A.par(A.pose('poster', { rot: [-18, 0, 0], dur: 0.25 }), A.say('Flap flap!', 1.2)), A.pose('poster', { rot: [-6, 0, 0], dur: 0.2 }), A.pose('poster', { rot: [-14, 0, 0], dur: 0.2 }), A.pose('poster', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A warehouse 30 m long and 9 m tall: corrugated walls, a low-pitched roof with skylights, three loading-dock
  // roller doors on a raised dock with bumpers, a staff door, pallets and a big sign.
  e('warehouse', 'places', 'industrial', () => {
    const b = m('warehouse', { edge: 'sharp' })
      .box([30, 8, 20], [0, 4, 0], { color: '#8a9aa8', round: 0.01 })
      .wedge([20.6, 1.6, 30.6], [0, 8.8, 0], { color: '#6a737c', rot: [0, 90, 0] })
      .box([30.2, 0.4, 20.2], [0, 7.9, 0], { color: '#5c6166' })
      .box([24, 1.2, 2.0], [-2, 0.6, 11], { color: '#a7a7a0' })
      .box([10, 1.5, 0.15], [0, 6.4, 10.08], { color: 'white' })
      .label('BIG BOX STORAGE', [9.4, 1.2], [0, 6.4, 10.17], { color: 'white', depth: 0.05 });
    b.each(16, (i) => b.box([0.06, 7.6, 0.06], [-14.5 + i * 1.93, 3.9, 10.02], { color: '#7a8a98', noInk: true }));
    [-9, -3, 3].forEach((x0, i) => {
      b.box([3.6, 4.2, 0.1], [x0, 3.3, 10.04], { color: '#5c6166' })
        .box([3.4, 4.0, 0.08], [x0, 3.25, 10.1], { color: '#d4d7da', name: `dock${i + 1}`, mover: { kind: 'slide', axis: 'y', amount: 3.6 } })
        .box([0.3, 0.4, 0.2], [x0 - 1.4, 1.0, 12.05], { color: '#2a2726' }).box([0.3, 0.4, 0.2], [x0 + 1.4, 1.0, 12.05], { color: '#2a2726' });
      b.each(5, (k) => b.box([3.4, 0.04, 0.02], [x0, 1.6 + k * 0.75, 10.15], { color: '#9da3a8', parent: `dock${i + 1}`, noInk: true }));
    });
    door(b, 'door', 1.0, 2.1, [12, 0, 10], '#2f4f8f', { hinge: 1 });
    b.box([1.6, 0.15, 1.0], [12, 2.4, 10.5], { color: '#5c6166' }).ball([0.3, 0.2, 0.2], [12, 2.25, 10.6], { color: '#fff1c0', glow: true, name: 'lamp', mover: { kind: 'light', on: false } });
    b.pair((s) => b.box([4, 0.1, 1.6], [s * 7, 9.15, -3], { color: '#a9dcf2', rot: [-9, 0, 0] }).box([4, 0.1, 1.6], [s * 7, 9.15, 3], { color: '#a9dcf2', rot: [9, 0, 0] }));
    for (const [x0, z, h] of [[6, 13, 1.0], [7.4, 13.5, 0.6], [6.6, 14.6, 1.4]] as Array<[number, number, number]>) b.box([1.2, 0.15, 1.0], [x0, 0.075, z], { color: '#c39a6b' }).box([1.1, h, 0.9], [x0, 0.15 + h / 2, z], { color: '#d8b07a' });
    return b
      .act({
        click: [
          [A.operate('dock2', 'out'), A.say('Beep... beep... beep...', 2), A.wait(2), A.operate('dock2', 'in')],
          [A.operate('lamp', 'on'), A.operate('door', 'open'), A.wait(1.8), A.operate('door', 'close'), A.operate('lamp', 'off')],
        ],
      })
      .done();
  }),
  // A wart on a patch of skin, with a hair; a dab of magic and it is gone (then back).
  e('wart', 'clinic', 'illness', () => {
    const b = m('wart').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'skin2' }).ball([0.045, 0.032, 0.045], [0, 0.026, 0], { color: '#b8907a', name: 'wart' });
    for (const [x0, z] of around(5, 0.012)) b.ball(0.016, [x0, 0.038, z], { color: '#a07a68', parent: 'wart' });
    return b.rod([0.004, 0.04, 0], [0.012, 0.075, 0.01], 0.003, '#2a2726', { parent: 'wart' })
      .act({ click: [[A.par(A.pose('wart', { scale: 0, dur: 0.4 }), A.effect('sparkle', { dur: 1.2 }), A.say('Poof!', 1))], [A.par(A.pose('wart', { scale: 1, dur: 0.3 }), A.say('Boing!', 1))]] })
      .done();
  }),
  // A dab of wasabi shaped into a leaf on a little sushi plate with pink pickled ginger; so hot it flares.
  e('wasabi', 'food', 'condiments', () =>
    m('wasabi')
      .box([0.12, 0.012, 0.08], [0, 0.006, 0], { color: 'white', round: 0.4, edge: 'sharp' })
      .ball([0.045, 0.03, 0.04], [-0.02, 0.025, 0], { color: '#8fbf3a', name: 'dab' })
      .cone([0.026, 0.025, 0.022], [-0.02, 0.045, 0], { color: '#8fbf3a', parent: 'dab' })
      .ball([0.032, 0.006, 0.026], [0.028, 0.015, 0.005], { color: '#f5b0a0', rot: [0, 0, 15] })
      .ball([0.032, 0.006, 0.026], [0.03, 0.019, -0.008], { color: '#f5b0a0', rot: [0, 30, 20] })
      .stick([-0.06, 0.016, 0.05], [0.06, 0.016, 0.055], 0.006, '#d8b07a').stick([-0.06, 0.016, 0.042], [0.06, 0.016, 0.044], 0.006, '#d8b07a')
      .act({ click: [A.par(A.effect('fire', { dur: 1.2 }), A.pose('dab', { scale: 1.2, dur: 0.15 }), A.say('Hot hot hot!', 1.4)), A.pose('dab', { scale: 1, dur: 0.2 })] })
      .done(),
  ),
  // An old-fashioned washboard, 0.62 m: a wooden frame with a ridged metal panel and a sock being scrubbed up and
  // down it.
  e('washboard', 'home', 'laundry', () => {
    const b = m('washboard', { edge: 'sharp' }).box([0.34, 0.12, 0.05], [0, 0.56, 0], { color: 'wood' }).box([0.34, 0.04, 0.04], [0, 0.06, 0], { color: 'wood' });
    b.pair((s) => b.box([0.04, 0.62, 0.045], [s * 0.15, 0.31, 0], { color: 'wood' }));
    b.each(9, (i) => b.capsule([0.022, 0.26, 0.02], [0, 0.12 + i * 0.042, 0.005], { color: 'silver', rot: [0, 0, 90], edge: 'soft' }));
    b.ball([0.12, 0.1, 0.05], [0.02, 0.3, 0.035], { color: '#e0473b', name: 'sock', piece: true }).capsule([0.06, 0.12, 0.05], [0.06, 0.38, 0.035], { color: '#e0473b', rot: [0, 0, -30], parent: 'sock' });
    return b.act({ click: [A.pose('sock', { move: [0, 0.1, 0], dur: 0.15 }), A.pose('sock', { move: [0, -0.08, 0], dur: 0.15 }), A.pose('sock', { move: [0, 0.1, 0], dur: 0.15 }), A.par(A.pose('sock', { move: [0, 0, 0], dur: 0.15 }), A.say('Rub-a-dub-dub!', 1.5))] }).done();
  }),
  // A folded blue facecloth hanging on a little wooden stand with a bar of soap in a dish; it gets a squeaky scrub.
  e('washcloth', 'home', 'bathroom', () => {
    const b = m('washcloth')
      .box([0.18, 0.025, 0.12], [0, 0.0125, 0], { color: 'wood', edge: 'sharp' })
      .stick([0, 0.025, -0.04], [0, 0.31, -0.04], 0.025, 'wood').stick([0, 0.28, -0.04], [0, 0.28, 0.06], 0.015, 'wood')
      .capsule([0.03, 0.2, 0.04], [0, 0.29, 0.04], { color: '#a8d8f5', rot: [0, 0, 90], name: 'cloth', pivot: [0, 0.29, 0.04] })
      .box([0.2, 0.2, 0.014], [0, 0.19, 0.058], { color: '#a8d8f5', round: 0.2, parent: 'cloth' })
      .box([0.2, 0.16, 0.014], [0, 0.21, 0.022], { color: '#a8d8f5', round: 0.2, parent: 'cloth' })
      .box([0.07, 0.012, 0.05], [0.05, 0.031, 0.02], { color: 'white', round: 0.4, edge: 'sharp' })
      .box([0.05, 0.022, 0.035], [0.05, 0.048, 0.02], { color: '#f4a1c0', round: 0.6, name: 'soap', piece: true });
    b.each(3, (i) => b.box([0.2, 0.008, 0.002], [0, 0.12 + i * 0.05, 0.066], { color: 'white', parent: 'cloth', noInk: true }));
    return b.act({ click: [A.pose('cloth', { rot: [0, 0, 10], dur: 0.15 }), A.pose('cloth', { rot: [0, 0, -10], dur: 0.15 }), A.par(A.pose('cloth', { rot: [0, 0, 0], dur: 0.15 }), A.pose('soap', { move: [0, 0.02, 0], dur: 0.15 }), A.effect('sparkle', { dur: 1 }), A.say('Squeaky clean!', 1.3)), A.pose('soap', { move: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A front-loading washing machine 0.85 m tall: a control panel with a dial and display, a detergent drawer, a
  // round door with a chrome ring, and the drum full of clothes that spins behind it.
  e('washer (appliance)', 'home', 'laundry', () => {
    const b = m('washer (appliance)', { edge: 'sharp' })
      .box([0.6, 0.85, 0.6], [0, 0.425, 0], { color: 'white', round: 0.08 })
      .box([0.58, 0.12, 0.02], [0, 0.77, 0.3], { color: '#e6e6e2' })
      .box([0.16, 0.07, 0.25], [-0.18, 0.77, 0.19], { color: '#f4f4f0', name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.2 } })
      .cyl([0.08, 0.03, 0.08], [0.18, 0.77, 0.31], { color: 'silver', rot: [90, 0, 0], name: 'dial' })
      .box([0.12, 0.05, 0.01], [0.0, 0.77, 0.312], { color: '#a8d8f5', glow: true, name: 'display', mover: { kind: 'light', on: false } })
      .cyl([0.36, 0.02, 0.36], [0, 0.38, 0.296], { color: '#2f4f8f', rot: [90, 0, 0], name: 'drum', mover: { kind: 'spin', axis: 'z', amount: 720 } })
      .ball([0.1, 0.07, 0.03], [0.06, 0.32, 0.306], { color: '#e0473b', parent: 'drum', edge: 'soft' })
      .ball([0.09, 0.08, 0.03], [-0.07, 0.42, 0.306], { color: '#f6d24a', parent: 'drum', edge: 'soft' })
      .ball([0.08, 0.06, 0.03], [0.05, 0.46, 0.306], { color: 'white', parent: 'drum', edge: 'soft' })
      .torus([0.44, 0.44, 0.05], [0, 0.38, 0.32], { color: 'silver', tube: 0.12, name: 'door', pivot: [-0.22, 0.38, 0.32], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .socket('drum', [0, 0.38, 0.1], 'inside', { size: 0.35 });
    return b
      .act({
        click: [
          [A.par(A.operate('display', 'on'), A.pose('dial', { rot: [0, 0, -90], dur: 0.3 })), A.par(A.operate('drum', 'on'), A.anim('shake'), A.say('Swish-swash, whirrr!', 2.2)), A.wait(1.5), A.par(A.operate('drum', 'off'), A.operate('display', 'off'), A.pose('dial', { rot: [0, 0, 0], dur: 0.3 }))],
          [A.operate('door', 'open'), A.wait(1.8), A.operate('door', 'close'), A.say('Click.', 1)],
        ],
      })
      .done();
  }),
  // Flat steel washers: one lying flat, one on its edge that rolls off and back.
  e('washer (hardware)', 'workshop', 'hardware', () =>
    m('washer (hardware)', { edge: 'sharp' })
      .torus([0.05, 0.05, 0.006], [0, 0.003, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.04, 0.04, 0.005], [0.06, 0.003, -0.03], { color: '#8f99a3', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.05, 0.05, 0.008], [0.045, 0.025, 0.04], { color: 'silver', tube: 0.3, name: 'ring', piece: true })
      .act({ click: [A.pose('ring', { move: [0.12, 0, 0], rot: [0, 0, -360], dur: 0.6 }), A.say('Clink!', 1), A.pose('ring', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A wristwatch standing on its leather strap: a gold case with a crown, a white face with hour marks and hands
  // that race round.
  e('watch', 'wardrobe', 'jewellery', () => {
    const b = m('watch')
      .torus([0.075, 0.08, 0.022], [0, 0.04, -0.01], { color: 'leather', rot: [0, 90, 0], tube: 0.12 })
      .cyl([0.044, 0.012, 0.044], [0, 0.045, 0.028], { color: 'gold', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.036, 0.004, 0.036], [0, 0.045, 0.035], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.007, 0.006, 0.007], [0.024, 0.045, 0.028], { color: 'gold', rot: [0, 0, 90] })
      .box([0.0025, 0.012, 0.002], [0, 0.051, 0.038], { color: '#1e1c1c', name: 'minute', pivot: [0, 0.045, 0.038], noInk: true })
      .box([0.003, 0.008, 0.002], [0.003, 0.047, 0.039], { color: '#1e1c1c', rot: [0, 0, -60], name: 'hour', pivot: [0, 0.045, 0.039], noInk: true });
    b.each(4, (i) => b.box([0.002, 0.004, 0.001], [Math.sin(i * Math.PI / 2) * 0.014, 0.045 + Math.cos(i * Math.PI / 2) * 0.014, 0.037], { color: '#5c6166', rot: [0, 0, -i * 90], noInk: true }));
    return b.act({ click: [A.par(A.pose('minute', { rot: [0, 0, -1440], dur: 2 }), A.pose('hour', { rot: [0, 0, -120], dur: 2 }), A.say('Tick tock tick tock!', 2)), A.par(A.pose('minute', { rot: [0, 0, 0], dur: 0 }), A.pose('hour', { rot: [0, 0, 0], dur: 0 }))] }).done();
  }),
  // A water balloon, round and wobbly with its knot; it bursts in a splash, then refills.
  e('water bomb', 'toys', 'water toys', () =>
    m('water bomb')
      .ball([0.12, 0.13, 0.12], [0, 0.068, 0], { color: '#4e9fe6', name: 'balloon', piece: true })
      .cone([0.025, 0.02, 0.025], [0, 0.138, 0], { color: '#4e9fe6', rot: [180, 0, 0], parent: 'balloon' })
      .ball([0.02, 0.012, 0.02], [0, 0.15, 0], { color: '#4e9fe6', parent: 'balloon' })
      .ball([0.04, 0.03, 0.01], [-0.03, 0.1, 0.05], { color: '#cfe8fa', parent: 'balloon', noInk: true })
      .act({ click: [[A.par(A.pose('balloon', { scale: 0, dur: 0.1 }), A.effect('water_spray', { dur: 1.2 }), A.say('SPLASH!', 1.2))], [A.par(A.pose('balloon', { scale: 1, dur: 0.4 }), A.say('Squish!', 1))]] })
      .done(),
  ),
  // A steel water bottle with a carry loop and a flip-top spout that pops open.
  e('water bottle', 'kitchen', 'drinkware', () =>
    m('water bottle')
      .cyl([0.075, 0.2, 0.075], [0, 0.1, 0], { color: '#3fa7a0' })
      .cyl([0.077, 0.04, 0.077], [0, 0.07, 0], { color: '#2e8a84', noInk: true })
      .cyl([0.065, 0.03, 0.065], [0, 0.215, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.022, 0.02, 0.022], [0, 0.238, 0.0], { color: '#2a2726' })
      .box([0.03, 0.015, 0.045], [0, 0.236, 0.005], { color: '#3a3633', name: 'cap', pivot: [0, 0.232, -0.018], mover: { kind: 'swing', axis: 'x', amount: -110 }, edge: 'sharp' })
      .torus([0.04, 0.04, 0.01], [0, 0.235, -0.04], { color: '#2a2726', rot: [0, 90, 0] })
      .act({ click: [A.operate('cap', 'open'), A.say('Pop! Glug glug...', 1.6), A.wait(1.2), A.operate('cap', 'close')] })
      .done(),
  ),
  // An office water cooler 1.3 m tall: a white cabinet with a cup holder, hot and cold taps, and an upturned blue
  // bottle on top that gulps a bubble.
  e('water cooler', 'home', 'appliances', () =>
    m('water cooler')
      .box([0.32, 0.95, 0.32], [0, 0.475, 0], { color: 'white', round: 0.1, edge: 'sharp' })
      .box([0.24, 0.2, 0.01], [0, 0.72, 0.161], { color: '#3a3633', edge: 'sharp' })
      .box([0.2, 0.03, 0.08], [0, 0.63, 0.18], { color: '#5c6166', edge: 'sharp' })
      .box([0.03, 0.04, 0.04], [0.05, 0.76, 0.18], { color: '#4e8fd6', name: 'tap', mover: { kind: 'slide', axis: 'y', amount: -0.015 } })
      .box([0.03, 0.04, 0.04], [-0.05, 0.76, 0.18], { color: '#e0473b' })
      .cyl([0.07, 0.25, 0.07], [0.19, 0.6, 0.0], { color: 'white' })
      .cyl([0.27, 0.06, 0.27], [0, 0.98, 0], { color: '#7fc0e6', taper: 0.35, rot: [180, 0, 0] })
      .cyl([0.27, 0.32, 0.27], [0, 1.17, 0], { color: '#7fc0e6' })
      .torus([0.28, 0.28, 0.02], [0, 1.1, 0], { color: '#b8e0f5', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([0.28, 0.28, 0.02], [0, 1.25, 0], { color: '#b8e0f5', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .ball(0.045, [0.03, 1.03, 0.13], { color: 'white', name: 'bubble', piece: true, noInk: true })
      .act({ click: [A.operate('tap', 'down'), A.par(A.pose('bubble', { move: [0, 0.27, 0], dur: 0.6 }), A.say('Glug-glug... bloop!', 1.6)), A.par(A.pose('bubble', { move: [0, 0, 0], dur: 0 }), A.operate('tap', 'up'))] })
      .done(),
  ),
  // A stone drinking fountain 1 m tall on a fluted pedestal: a round basin with a spout and a push button; a
  // little arc of water springs up.
  e('water fountain', 'places', 'street furniture', () => {
    const b = m('water fountain')
      .cyl([0.5, 0.06, 0.5], [0, 0.03, 0], { color: '#a7a7a0', edge: 'sharp' })
      .cyl([0.3, 0.8, 0.3], [0, 0.46, 0], { color: '#b8b4a8', taper: 0.8, segs: 12 })
      .cyl([0.5, 0.14, 0.5], [0, 0.92, 0], { color: '#b8b4a8', taper: 1.3 })
      .cyl([0.44, 0.012, 0.44], [0, 0.99, 0], { color: '#7fc0e6' })
      .stick([0, 0.97, -0.08], [0, 1.03, -0.08], 0.025, 'silver')
      .box([0.07, 0.04, 0.03], [0, 0.9, 0.27], { color: 'silver', edge: 'sharp' })
      .cyl([0.04, 0.015, 0.04], [0, 0.9, 0.29], { color: 'silver', rot: [90, 0, 0], name: 'button', mover: { kind: 'slide', axis: 'z', amount: -0.01 } })
      .rod([0, 1.03, -0.08], [0, 1.12, -0.02], 0.02, '#7fc0e6', { name: 'jet1', scale: 0, noInk: true })
      .rod([0, 1.12, -0.02], [0, 1.03, 0.06], 0.02, '#7fc0e6', { name: 'jet2', scale: 0, noInk: true });
    return b.act({ click: [A.operate('button', 'in'), A.par(A.pose('jet1', { scale: 1, dur: 0.2 }), A.pose('jet2', { scale: 1, dur: 0.2, delay: 0.1 }), A.say('Splish!', 1)), A.wait(1.5), A.par(A.pose('jet1', { scale: 0, dur: 0.2 }), A.pose('jet2', { scale: 0, dur: 0.2 }), A.operate('button', 'out'))] }).done();
  }),
  // A pump-action water pistol: a lime body, an orange tank on top, a blue nozzle, a pump grip that slides and a
  // trigger; it squirts.
  e('water gun', 'toys', 'water toys', () =>
    m('water gun', { view: 'side' })
      .box([0.06, 0.08, 0.3], [0, 0.12, 0], { color: '#9be34d', round: 0.5 })
      .cyl([0.035, 0.12, 0.035], [0, 0.14, 0.2], { color: '#f0923b', rot: [90, 0, 0] })
      .cyl([0.02, 0.03, 0.02], [0, 0.14, 0.27], { color: '#4e8fd6', rot: [90, 0, 0] })
      .capsule([0.09, 0.14, 0.09], [0, 0.205, -0.03], { color: '#f0923b', rot: [90, 0, 0] })
      .box([0.04, 0.1, 0.05], [0, 0.05, -0.1], { color: '#9be34d', rot: [15, 0, 0], round: 0.4 })
      .box([0.012, 0.03, 0.012], [0, 0.07, -0.05], { color: '#f0923b', name: 'trigger', mover: { kind: 'slide', axis: 'z', amount: -0.012 } })
      .cyl([0.05, 0.1, 0.05], [0, 0.07, 0.13], { color: '#4e8fd6', rot: [90, 0, 0], name: 'pump', mover: { kind: 'slide', axis: 'z', amount: -0.05 } })
      .act({ click: [A.operate('pump', 'out'), A.operate('pump', 'in'), A.operate('trigger', 'in'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Squirt!', 1)), A.operate('trigger', 'out')] })
      .done(),
  ),
  // A gas water heater 1.5 m tall: a white tank on legs, a lagged top with copper hot and cold pipes and a flue, a
  // thermostat and a little window where the pilot flame lights.
  e('water heater', 'home', 'appliances', () =>
    m('water heater')
      .cyl([0.5, 0.05, 0.5], [0, 0.1, 0], { color: '#5c6166', edge: 'sharp' })
      .cyl([0.55, 1.3, 0.55], [0, 0.78, 0], { color: 'white' })
      .cyl([0.56, 0.05, 0.56], [0, 1.44, 0], { color: '#d4d7da' })
      .cyl([0.14, 0.18, 0.14], [0, 1.55, 0], { color: 'silver', edge: 'sharp' })
      .stick([0.16, 1.44, 0], [0.16, 1.62, 0], 0.045, 'copper').stick([-0.16, 1.44, 0], [-0.16, 1.62, 0], 0.045, 'copper')
      .box([0.14, 0.16, 0.08], [0, 0.4, 0.27], { color: '#5c6166', round: 0.2, edge: 'sharp' })
      .cyl([0.05, 0.02, 0.05], [0, 0.42, 0.315], { color: '#e0473b', rot: [90, 0, 0], name: 'knob' })
      .box([0.08, 0.05, 0.012], [0, 0.22, 0.275], { color: '#2a2726', edge: 'sharp' })
      .box([0.05, 0.035, 0.01], [0, 0.22, 0.282], { color: '#4e8fd6', glow: true, name: 'pilot', mover: { kind: 'light', on: false } })
      .label('HOT', [0.14, 0.05], [0.1, 1.0, 0.276], { color: '#e0473b', depth: 0.004 })
      .act({ click: [[A.pose('knob', { rot: [0, 0, -90], dur: 0.3 }), A.par(A.operate('pilot', 'on'), A.say('Click... whoomph!', 1.6)), A.effect('steam', { dur: 1.5 })], [A.par(A.pose('knob', { rot: [0, 0, 0], dur: 0.3 }), A.operate('pilot', 'off'))]] })
      .done(),
  ),
  // A water park 34 m across: a big blue pool on a tiled deck, a 10 m slide tower with a straight slide and a
  // twisting tube slide, a play frame with a giant tipping bucket, sun loungers, umbrellas, palms and a sign.
  e('water park', 'places', 'parks', () => {
    const b = m('water park', { edge: 'sharp' })
      .box([34, 0.3, 26], [0, 0.15, 0], { color: '#efe6cf', round: 0.02 })
      .box([16, 0.06, 10], [3, 0.31, 2], { color: '#4fb0e6' })
      .box([16.4, 0.35, 10.4], [3, 0.2, 2], { color: '#e6e1d4' })
      .box([3, 10, 3], [-11, 5.3, -6], { color: '#f6d24a' })
      .pyramid([5.2, 1.6, 5.2], [-11, 11.1, -6], 4, { color: '#e0473b' })
      .wedge([0.4, 9.6, 3], [-11, 5.1, -4.3], { color: '#e6e1d4', apex: 0.5, rot: [0, 90, 0] });
    b.rod([-9.6, 9.6, -6], [-5, 5, -2.5], 1.0, '#e0473b', { edge: 'soft' }).rod([-5, 5, -2.5], [-3.5, 0.5, 0], 1.0, '#e0473b', { edge: 'soft' });
    const pts: V[] = [[-11, 8, -4.5], [-8.5, 7, -3.5], [-8, 5.6, -6], [-10.5, 4.4, -8], [-13, 3.2, -6], [-12, 1.8, -3], [-8.5, 0.8, -1.5]];
    for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], 1.1, '#4e8fd6', { edge: 'soft' });
    b.box([6, 0.3, 6], [11, 3.5, -7], { color: '#3fa7a0' });
    b.pair((s) => b.stick([11 + s * 2.8, 0.3, -7 + 2.8], [11 + s * 2.8, 6.5, -7 + 2.8], 0.25, '#f0923b').stick([11 + s * 2.8, 0.3, -7 - 2.8], [11 + s * 2.8, 6.5, -7 - 2.8], 0.25, '#f0923b'));
    b.stick([8.2, 6.4, -7], [13.8, 6.4, -7], 0.25, '#f0923b')
      .cyl([2.2, 1.8, 2.2], [11, 5.3, -7], { color: '#f6d24a', taper: 1.3, name: 'bucket', pivot: [11, 6.3, -7] });
    for (const [x0, z] of [[-6, 9], [-3, 9.5], [0, 9]]) b.box([0.8, 0.3, 2.0], [x0, 0.5, z], { color: 'white', rot: [0, 0, 0] }).stick([x0 + 1, 0.3, z - 0.6], [x0 + 1, 2.6, z - 0.6], 0.06, '#5c6166').cone([2.4, 0.6, 2.4], [x0 + 1, 2.7, z - 0.6], { color: x0 % 2 ? '#e0473b' : '#f6d24a', segs: 8 });
    for (const [x0, z] of [[15, 9], [-15, 8], [15, -1]]) b.cyl([0.4, 6, 0.4], [x0, 3.3, z], { color: 'bark', taper: 0.7, edge: 'soft' }).ball([3.2, 1.0, 3.2], [x0, 6.4, z], { color: '#5aa553', edge: 'soft' });
    b.stick([-14, 0.3, 12], [-14, 3.2, 12], 0.2, '#4e8fd6').stick([-9, 0.3, 12], [-9, 3.2, 12], 0.2, '#4e8fd6').box([5.6, 1.2, 0.2], [-11.5, 3.0, 12], { color: '#4e8fd6', round: 0.2 })
      .label('SPLASH ZONE', [5.0, 0.9], [-11.5, 3.0, 12.12], { color: '#4e8fd6', depth: 0.04 });
    return b.act({ click: [[A.pose('bucket', { rot: [0, 0, 110], dur: 0.6 }), A.par(A.effect('water_spray', { dur: 1.8 }), A.say('SPLOOSH!', 1.5)), A.pose('bucket', { rot: [0, 0, 0], dur: 1.2 })], [A.par(A.effect('water_spray', { dur: 2 }), A.say('Wheee... splash!', 1.8))]] }).done();
  }),
  // A cast-iron hand pump on a stone plinth with a bucket under its spout: the handle pumps and water gushes.
  e('water pump', 'farm', 'farm things', () =>
    m('water pump', { edge: 'sharp' })
      .box([0.5, 0.15, 0.7], [0, 0.075, 0.1], { color: '#a7a7a0' })
      .cyl([0.13, 0.6, 0.13], [0, 0.45, 0], { color: '#3a5a3a', edge: 'soft' })
      .cyl([0.15, 0.06, 0.15], [0, 0.78, 0], { color: '#3a5a3a' }).ball(0.08, [0, 0.83, 0], { color: '#3a5a3a' })
      .rod([0, 0.6, 0.06], [0, 0.56, 0.22], 0.05, '#3a5a3a')
      .rod([0, 0.76, -0.05], [0, 0.94, -0.36], 0.035, '#3a5a3a', { name: 'handle', pivot: [0, 0.78, 0] })
      .ball(0.05, [0, 0.95, -0.37], { color: '#3a5a3a', parent: 'handle' })
      .cyl([0.17, 0.15, 0.17], [0, 0.225, 0.27], { color: '#8f99a3', taper: 1.2 })
      .cyl([0.18, 0.01, 0.18], [0, 0.29, 0.27], { color: '#4f9bd6' })
      .arc([0.19, 0.1, 0.01], [0, 0.3, 0.27], { color: '#5c6166', arc: 180, tube: 0.06 })
      .act({ click: [A.pose('handle', { rot: [30, 0, 0], dur: 0.25 }), A.pose('handle', { rot: [0, 0, 0], dur: 0.25 }), A.pose('handle', { rot: [30, 0, 0], dur: 0.25 }), A.par(A.pose('handle', { rot: [0, 0, 0], dur: 0.25 }), A.effect('water_spray', { dur: 1.3 }), A.say('Squeak... gush!', 1.5))] })
      .done(),
  ),
  // A pair of water skis 1.7 m long standing up, with rubber bindings and curled tips; they wobble in a spray.
  e('water ski', 'sports', 'water sports', () => {
    const b = m('water ski');
    b.pair((s) => b.box([0.17, 1.6, 0.03], [s * 0.15, 0.82, 0], { color: s > 0 ? '#e0473b' : '#f6d24a', round: 0.5, rot: [0, 0, s * -3] }).box([0.17, 0.2, 0.03], [s * 0.19, 1.68, 0.05], { color: s > 0 ? '#e0473b' : '#f6d24a', rot: [30, 0, s * -3], round: 0.5 }).box([0.13, 0.2, 0.13], [s * 0.15, 0.85, 0.08], { color: '#2a2726', round: 0.4 }).box([0.172, 0.06, 0.032], [s * 0.15, 0.3, 0], { color: 'white', noInk: true, rot: [0, 0, s * -3] }));
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('water_spray', { dur: 1.5 }), A.say('Whoosh!', 1.2))] }).done();
  }),
  // A waterspout, 12 m: a grey storm cloud with a twisting funnel of spray down to a churning patch of sea.
  e('water spout', 'nature', 'weather', () => {
    const b = m('water spout').cyl([12, 0.1, 12], [0, 0.05, 0], { color: '#4f9bd6' }).ball([4, 1.2, 4], [0, 0.4, 0], { color: '#dff0f8' });
    const ds = [0.6, 0.9, 1.3, 1.9, 2.8, 4.0];
    b.cyl([ds[0], 2, ds[0]], [0, 1.6, 0], { color: '#9ab8c8', taper: ds[1] / ds[0], name: 'rotor' });
    for (let i = 1; i < 5; i++) b.cyl([ds[i], 2, ds[i]], [0, 1.6 + i * 2, 0], { color: i % 2 ? '#b8ccd8' : '#9ab8c8', taper: ds[i + 1] / ds[i], parent: 'rotor' });
    b.each(3, (i) => b.torus([ds[i + 1] * 1.05, ds[i + 1] * 1.05, 0.15], [0.1, 3.4 + i * 2.2, 0], { color: '#e6f0f6', rot: [90, 0, 0], tube: 0.05, parent: 'rotor', noInk: true }));
    b.ball([12, 2.4, 9], [0, 10.6, 0], { color: '#7f8a94' }).ball([6, 2, 5], [-4, 10.4, 1.5], { color: '#6a737c' }).ball([6, 2, 5], [4.5, 10.5, 1], { color: '#8f99a3' });
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 2.5 }), A.effect('rain', { dur: 2.5 }), A.say('Whoooosh!', 2))] }).done();
  }),
  // A water tower 26 m tall: a steel tank with a conical roof and finial, a catwalk with a rail, four braced legs, a
  // ladder, the town's name, and a red warning light on top.
  e('water tower', 'places', 'landmarks', () => {
    const b = m('water tower', { edge: 'sharp' })
      .cyl([8, 6, 8], [0, 19, 0], { color: '#c9ccd1', segs: 16 })
      .cyl([8.2, 0.3, 8.2], [0, 16.05, 0], { color: '#9da3a8' })
      .cone([8.6, 3, 8.6], [0, 23.5, 0], { color: '#9da3a8', segs: 16 })
      .ball(0.5, [0, 25.1, 0], { color: '#9da3a8' })
      .ball(0.4, [0, 25.6, 0], { color: '#e0473b', glow: true, name: 'beacon', mover: { kind: 'light', on: true } })
      .torus([9.4, 9.4, 0.12], [0, 17.2, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.02 })
      .cyl([9.4, 0.12, 9.4], [0, 16.0, 0], { color: '#8f99a3' })
      .label('MAPLETON', [5, 1.2], [0, 19.5, 4.02], { color: '#c9ccd1', depth: 0.05 });
    for (const [x0, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.stick([x0 * 2.6, 16, z * 2.6], [x0 * 3.6, 0, z * 3.6], 0.45, '#8f99a3').box([1.2, 0.6, 1.2], [x0 * 3.6, 0.3, z * 3.6], { color: '#a7a7a0' });
    for (const [y0, y1] of [[1, 8], [8, 15]]) {
      const w0 = 3.6 - (y0 / 16), w1 = 3.6 - (y1 / 16);
      b.pair((s) => b.stick([-w0, y0, s * w0], [w1, y1, s * w1], 0.12, '#8f99a3').stick([w0, y0, s * w0], [-w1, y1, s * w1], 0.12, '#8f99a3').stick([s * w0, y0, -w0], [s * w1, y1, w1], 0.12, '#8f99a3').stick([s * w0, y0, w0], [s * w1, y1, -w1], 0.12, '#8f99a3'));
    }
    b.pair((s) => b.stick([s * 0.3, 0, 3.7], [s * 0.3, 16, 3.0], 0.08, '#5c6166'));
    b.each(16, (i) => b.stick([-0.3, 0.8 + i, 3.66 - i * 0.044], [0.3, 0.8 + i, 3.66 - i * 0.044], 0.05, '#5c6166'));
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 1.8 }), A.say('Gurgle-gurgle!', 1.6)), A.operate('beacon', 'off'), A.wait(0.4), A.operate('beacon', 'on')] }).done();
  }),
  // A water treatment plant 40 m across: two round settling tanks whose bridges sweep round, a bubbling aeration
  // basin, a pump house with a door, and blue pipes between them.
  e('water treatment plant', 'places', 'industrial', () => {
    const b = m('water treatment plant', { edge: 'sharp' })
      .box([40, 0.2, 30], [0, 0.1, 0], { color: '#9a9a92', round: 0.01 });
    for (const [x0, z, n] of [[-10, 5, 'rotorA'], [8, 7, 'rotorB']] as Array<[number, number, string]>) {
      b.cyl([14, 2.4, 14], [x0, 1.3, z], { color: '#bdbab0', segs: 16 })
        .cyl([13, 0.05, 13], [x0, 2.52, z], { color: x0 < 0 ? '#4f9bd6' : '#4a8a6a' })
        .box([13.4, 0.5, 0.8], [x0, 2.9, z], { color: '#f6d24a', name: n })
        .box([13.6, 0.6, 0.06], [x0, 3.3, z + 0.4], { color: '#f0923b', parent: n })
        .cyl([1.2, 1.2, 1.2], [x0, 3.2, z], { color: '#5c6166' });
    }
    b.box([16, 2.2, 6], [-8, 1.2, -9], { color: '#bdbab0' }).box([15.4, 0.05, 5.4], [-8, 2.32, -9], { color: '#6a9a8a', name: 'basin' });
    b.box([10, 6, 8], [12, 3.2, -8], { color: '#efe6cf' }).box([10.4, 0.4, 8.4], [12, 6.4, -8], { color: '#5c6166' })
      .label('WATER WORKS', [6, 0.9], [12, 5.2, -3.96], { color: '#2f6fc0', depth: 0.04 });
    door(b, 'door', 1.2, 2.4, [12, 0.2, -4], '#2f6fc0', { hinge: 1 });
    win(b, 1.6, 1.2, [9, 3.2, -4], 'front', 'white', { bars: false });
    win(b, 1.6, 1.2, [15, 3.2, -4], 'front', 'white', { bars: false });
    b.stick([-3, 0.8, 5], [1, 0.8, 7], 0.6, '#2f6fc0').stick([8, 0.8, -0.1], [10, 0.8, -4], 0.6, '#2f6fc0').stick([-8, 0.8, -6], [-9, 0.8, -2], 0.6, '#2f6fc0');
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.say('Bloop... bloop... bloop!', 2))], [A.operate('door', 'open'), A.wait(1.8), A.operate('door', 'close')]] }).done();
  }),
  // An overshot water wheel 6 m across on a stone mill wall: a wooden rim of buckets that always turns, a chute
  // bringing water over the top, the mill race below and the mill's door.
  e('water wheel', 'farm', 'farm things', () => {
    const b = m('water wheel', { edge: 'sharp' })
      .box([8, 7, 2], [0, 3.5, -2.2], { color: '#a7a19a' })
      .box([5.6, 0.4, 3.6], [0, 0.2, 0.4], { color: '#4f9bd6' })
      .box([1.6, 0.5, 4.0], [0, 6.8, 0.2], { color: '#7a5230', rot: [5, 0, 0] })
      .box([1.4, 0.06, 3.8], [0, 6.97, 0.2], { color: '#4f9bd6', rot: [5, 0, 0], noInk: true })
      .torus([6, 6, 1.2], [0, 3.4, 0.3], { color: '#9a6a3a', tube: 0.06, name: 'fan1', pivot: [0, 3.4, 0.3] })
      .torus([4.6, 4.6, 1.2], [0, 3.4, 0.3], { color: '#9a6a3a', tube: 0.06, parent: 'fan1' })
      .cyl([0.7, 1.6, 0.7], [0, 3.4, 0.3], { color: '#5a3a22', rot: [90, 0, 0], parent: 'fan1' });
    b.each(4, (i) => b.box([0.2, 5.8, 0.2], [0, 3.4, 0.3], { color: '#7a5230', rot: [0, 0, i * 45], parent: 'fan1' }));
    b.each(16, (i) => {
      const a = (i / 16) * Math.PI * 2;
      b.box([0.1, 0.65, 1.2], [Math.sin(a) * 2.65, 3.4 + Math.cos(a) * 2.65, 0.3], { color: '#5a3a22', rot: [0, 0, -a / DEG], parent: 'fan1' });
    });
    b.pair((s) => b.box([0.4, 3.2, 0.4], [s * 0.6, 1.6, 0.3 + s * 0], { color: '#7a5230' }));
    door(b, 'door', 1.2, 2.2, [3.0, 0, -1.2], '#7a5230', { hinge: 1, frame: '#8f8c86' });
    win(b, 0.9, 0.9, [-3.0, 4.5, -1.2], 'front', '#7a5230');
    return b.act({ click: [[A.par(A.effect('water_spray', { dur: 2 }), A.say('Splish, splash, creak!', 1.8))], [A.operate('door', 'open'), A.wait(1.8), A.operate('door', 'close')]] }).done();
  }),
  // A waterbed: a dark wooden frame 2.1 m long with a padded rail, a blue water mattress with ripples, a headboard
  // and pillows; it sloshes and wobbles.
  e('waterbed', 'home', 'furniture', () => {
    const b = m('waterbed', { edge: 'sharp' })
      .box([1.7, 0.35, 2.2], [0, 0.175, 0], { color: '#5a3a22' })
      .box([1.55, 0.22, 2.05], [0, 0.42, 0], { color: '#4f9bd6', round: 0.7, name: 'mattress', edge: 'soft' })
      .box([1.7, 0.95, 0.1], [0, 0.6, -1.12], { color: '#5a3a22', round: 0.1 })
      .box([0.65, 0.12, 0.35], [-0.38, 0.58, -0.8], { color: 'white', round: 0.8, edge: 'soft' })
      .box([0.65, 0.12, 0.35], [0.38, 0.58, -0.8], { color: 'white', round: 0.8, edge: 'soft' })
      .socket('bed', [0, 0.55, 0.2], 'top', { size: 1.4 });
    for (const z of [-0.2, 0.25, 0.7]) b.each(3, (i) => b.rod([-0.55 + i * 0.4, 0.535, z + (i % 2) * 0.05], [-0.38 + i * 0.4, 0.535, z + ((i + 1) % 2) * 0.05], 0.025, '#cfe8fa', { noInk: true, parent: 'mattress' }));
    return b.act({ click: [A.par(A.pose('mattress', { scale: 1.05, rot: [3, 0, 0], dur: 0.25 }), A.say('Sloooosh!', 1.5)), A.pose('mattress', { scale: 0.97, rot: [-3, 0, 0], dur: 0.25 }), A.pose('mattress', { scale: 1.02, rot: [2, 0, 0], dur: 0.25 }), A.pose('mattress', { scale: 1, rot: [0, 0, 0], dur: 0.25 })] }).done();
  }),
  // A waterfall 8 m high off a rocky cliff topped with grass and pines, falling into a foaming pool among
  // boulders; when the sun comes out a rainbow appears in the spray.
  e('waterfall', 'nature', 'water', () => {
    const b = m('waterfall')
      .box([14, 8, 5], [0, 4, -2.5], { color: '#8f8c86', round: 0.15 })
      .ball([8, 6, 4], [-5, 5, -1.2], { color: '#7f7c76' })
      .ball([7, 5, 4], [5, 5.2, -1.4], { color: '#8a8780' })
      .box([14, 0.4, 5], [0, 8.2, -2.5], { color: '#6ab04c' })
      .box([3.4, 0.25, 4], [0, 8.35, -2.2], { color: '#4f9bd6' })
      .box([3.4, 7.8, 0.4], [0, 4.3, 0.15], { color: '#7fc0e6', round: 0.3 })
      .box([0.2, 6.8, 0.05], [-0.8, 4.6, 0.38], { color: 'white', noInk: true }).box([0.2, 5.8, 0.05], [0.9, 5.0, 0.38], { color: 'white', noInk: true })
      .cyl([12, 0.2, 7], [0, 0.1, 3.5], { color: '#4f9bd6' })
      .ball([5, 1.2, 2.5], [0, 0.6, 1.6], { color: 'white' })
      .ball([2.4, 1.8, 2.0], [-4.6, 0.8, 3.5], { color: '#a7a7a0' }).ball([2.0, 1.4, 1.8], [4.4, 0.6, 4.4], { color: '#9a9a92' });
    for (const [x0, h] of [[-5, 3.2], [-3.6, 2.6], [4.6, 3], [6, 3.4]]) b.cyl([h * 0.1, h * 0.3, h * 0.1], [x0, 8.4 + h * 0.15, -3.5], { color: 'bark' }).cone([h * 0.45, h * 0.8, h * 0.45], [x0, 8.4 + h * 0.6, -3.5], { color: '#3f7a3a' });
    ['#e0473b', '#f6d24a', '#5aa553', '#4e8fd6'].forEach((c, i) => b.arc([8 - i * 0.6, 8 - i * 0.6, 0.12], [0, 0.6, 3.8], { color: c, arc: 180, tube: 0.04, name: `bow${i + 1}`, scale: 0, glow: true, noInk: true }));
    return b
      .act({
        click: [
          [A.par(A.effect('water_spray', { dur: 2 }), A.say('Rrrroarrr...', 1.8))],
          [A.par(...[1, 2, 3, 4].map((i) => A.pose(`bow${i}`, { scale: 1, dur: 0.6, delay: i * 0.1 })), A.effect('sparkle', { dur: 1.5 })), A.wait(2), A.par(...[1, 2, 3, 4].map((i) => A.pose(`bow${i}`, { scale: 0, dur: 0.5 })))],
        ],
      })
      .done();
  }),
  // A green metal watering can with a long spout and a sprinkler rose; it tips and sprinkles.
  e('watering can', 'garden', 'garden tools', () =>
    m('watering can')
      .cyl([0.22, 0.2, 0.15], [0, 0.1, 0], { color: '#3f8a4a', name: 'can', pivot: [0.11, 0, 0] })
      .cyl([0.08, 0.02, 0.08], [-0.05, 0.21, 0], { color: '#2e6a38', parent: 'can' })
      .rod([0.09, 0.06, 0], [0.27, 0.26, 0], 0.025, '#3f8a4a', { parent: 'can' })
      .cyl([0.05, 0.03, 0.05], [0.285, 0.275, 0], { color: '#3f8a4a', rot: [0, 0, -45], parent: 'can' })
      .cyl([0.045, 0.005, 0.045], [0.297, 0.287, 0], { color: 'silver', rot: [0, 0, -45], parent: 'can' })
      .arc([0.18, 0.14, 0.025], [-0.05, 0.2, 0], { color: '#3f8a4a', arc: 180, tube: 0.15, parent: 'can' })
      .act({ click: [A.pose('can', { rot: [0, 0, -35], dur: 0.4 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Sprinkle sprinkle!', 1.5)), A.pose('can', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A whole striped watermelon and a juicy wedge with black seeds; knock it to hear if it's ripe.
  e('watermelon', 'food', 'fruit', () => {
    const b = m('watermelon').ball([0.34, 0.26, 0.26], [-0.05, 0.13, -0.03], { color: '#3f8a3a', name: 'melon' });
    b.each(5, (i) => b.torus([0.344, 0.264, 0.035], [-0.05, 0.13, -0.03], { color: '#2a5a26', tube: 0.04, rot: [i * 36, 0, 0], noInk: true, parent: 'melon' }));
    b.box([0.2, 0.022, 0.04], [0.19, 0.011, 0.14], { color: '#3f8a3a' })
      .box([0.2, 0.01, 0.042], [0.19, 0.027, 0.14], { color: '#d8f0b0', noInk: true })
      .wedge([0.19, 0.11, 0.035], [0.19, 0.087, 0.14], { color: '#e0473b', name: 'slice' });
    for (const [x0, y] of [[0.16, 0.06], [0.22, 0.06], [0.19, 0.09], [0.17, 0.045], [0.21, 0.045]]) b.ball([0.008, 0.012, 0.004], [x0, y, 0.158], { color: 'black', noInk: true, parent: 'slice' });
    return b.act({ click: [[A.pose('melon', { rot: [0, 0, 4], dur: 0.1 }), A.pose('melon', { rot: [0, 0, 0], dur: 0.1 }), A.say('Thunk thunk!', 1.2)], [A.par(A.pose('slice', { scale: 1.1, dur: 0.15 }), A.say('Crunch!', 1)), A.pose('slice', { scale: 1, dur: 0.15 })]] }).done();
  }),
  // Candle wax and sealing wax: a block of beeswax, a red sealing-wax stick, and a brass seal that presses a red
  // seal into a blob of wax.
  e('wax', 'home', 'candles', () =>
    m('wax')
      .box([0.1, 0.05, 0.07], [-0.03, 0.025, -0.02], { color: '#f5e6a8', round: 0.2 })
      .box([0.08, 0.04, 0.06], [-0.02, 0.07, -0.02], { color: '#f2dc8a', round: 0.2, rot: [0, 20, 0] })
      .capsule([0.02, 0.12, 0.02], [-0.04, 0.01, 0.07], { color: '#c0392b', rot: [0, 10, 90] })
      .cyl([0.045, 0.008, 0.045], [0.07, 0.004, 0.06], { color: '#a3222a' })
      .stick([0.07, 0.04, 0.06], [0.07, 0.12, 0.06], 0.02, '#5a3a22', { name: 'seal', piece: true })
      .cyl([0.03, 0.02, 0.03], [0.07, 0.03, 0.06], { color: 'brass', parent: 'seal' })
      .ball(0.03, [0.07, 0.125, 0.06], { color: '#5a3a22', parent: 'seal' })
      .act({ click: [A.pose('seal', { move: [0, -0.02, 0], dur: 0.2 }), A.say('Press!', 1), A.pose('seal', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A weather vane on a little roof cupola, 1 m: N, E, S, W arms and a black cockerel on an arrow that swings round
  // in a gust.
  e('weather vane', 'farm', 'farm things', () =>
    m('weather vane', { edge: 'sharp' })
      .pyramid([0.42, 0.22, 0.42], [0, 0.11, 0], 4, { color: '#a3322a' })
      .stick([0, 0.2, 0], [0, 0.95, 0], 0.025, '#2a2726')
      .stick([-0.2, 0.55, 0], [0.2, 0.55, 0], 0.015, '#2a2726').stick([0, 0.55, -0.2], [0, 0.55, 0.2], 0.015, '#2a2726')
      .label('N', [0.06, 0.06], [0, 0.55, 0.23], { color: 'gold' }).label('E', [0.06, 0.06], [0.23, 0.55, 0], { color: 'gold', rot: [0, 90, 0] }).label('W', [0.06, 0.06], [-0.23, 0.55, 0], { color: 'gold', rot: [0, -90, 0] })
      .stick([-0.25, 0.8, 0], [0.25, 0.8, 0], 0.02, '#2a2726', { name: 'vane' })
      .cone([0.06, 0.08, 0.02], [0.28, 0.8, 0], { color: '#2a2726', rot: [0, 0, -90], parent: 'vane' })
      .box([0.08, 0.1, 0.012], [-0.25, 0.8, 0], { color: '#2a2726', parent: 'vane' })
      .ball([0.16, 0.1, 0.03], [0, 0.88, 0], { color: '#2a2726', parent: 'vane' })
      .ball(0.05, [0.09, 0.95, 0], { color: '#2a2726', parent: 'vane' })
      .wedge([0.1, 0.12, 0.012], [-0.09, 0.95, 0], { color: '#2a2726', apex: -0.4, parent: 'vane' })
      .cone([0.03, 0.03, 0.01], [0.09, 0.99, 0], { color: '#c0392b', parent: 'vane' })
      .act({ click: [[A.par(A.pose('vane', { rot: [0, 160, 0], dur: 0.8 }), A.effect('dust', { dur: 1 }), A.say('Creak!', 1))], [A.par(A.pose('vane', { rot: [0, 0, 0], dur: 0.8 }), A.say('Creak!', 1))]] })
      .done(),
  ),
  // A webcam clipped on a stand: a round lens, a privacy light that comes on, and a head that swivels to look.
  e('web cam', 'tech', 'computers', () =>
    m('web cam', { edge: 'sharp' })
      .box([0.05, 0.015, 0.04], [0, 0.0075, 0], { color: '#2a2726', round: 0.3 })
      .box([0.02, 0.04, 0.02], [0, 0.03, 0], { color: '#2a2726' })
      .capsule([0.045, 0.09, 0.045], [0, 0.07, 0], { color: '#2a2726', rot: [0, 0, 90], name: 'cam', pivot: [0, 0.05, 0], edge: 'soft' })
      .cyl([0.032, 0.01, 0.032], [0, 0.07, 0.022], { color: '#223344', rot: [90, 0, 0], parent: 'cam' })
      .cyl([0.016, 0.004, 0.016], [0, 0.07, 0.028], { color: 'glass', rot: [90, 0, 0], parent: 'cam' })
      .ball(0.006, [0.03, 0.075, 0.02], { color: '#9be34d', glow: true, name: 'led', parent: 'cam', mover: { kind: 'light', on: false } })
      .act({ click: [A.operate('led', 'on'), A.pose('cam', { rot: [0, 30, 0], dur: 0.3 }), A.pose('cam', { rot: [0, -30, 0], dur: 0.4 }), A.par(A.pose('cam', { rot: [0, 0, 0], dur: 0.3 }), A.say('Click!', 1)), A.operate('led', 'off')] })
      .done(),
  ),
  // A three-tier wedding cake, 0.55 m, on a silver stand: white icing with pink piped swags and roses, and a pair of
  // hearts on top that twirl among hearts.
  e('wedding cake', 'food', 'cakes', () => {
    const b = m('wedding cake').cyl([0.44, 0.02, 0.44], [0, 0.01, 0], { color: 'silver', edge: 'sharp' });
    [[0.36, 0.14, 0.09], [0.26, 0.12, 0.22], [0.17, 0.1, 0.33]].forEach(([d, h, y]) => b.cyl([d, h, d], [0, y, 0], { color: 'white' }).torus([d + 0.01, d + 0.01, 0.025], [0, y - h / 2 + 0.01, 0], { color: '#f4a1c0', rot: [90, 0, 0], tube: 0.06 }));
    for (const [x0, z] of around(5, 0.13, 0.3)) b.ball(0.035, [x0, 0.17, z], { color: '#f4a1c0' });
    for (const [x0, z] of around(4, 0.09, 0.8)) b.ball(0.03, [x0, 0.29, z], { color: '#e0607a' });
    b.cyl([0.02, 0.04, 0.02], [0, 0.4, 0], { color: 'gold', name: 'topper' })
      .heart(0.07, [-0.025, 0.45, 0], { color: '#e0473b', parent: 'topper' })
      .heart(0.06, [0.03, 0.44, -0.01], { color: '#f4a1c0', parent: 'topper' });
    return b.act({ click: [A.par(A.pose('topper', { rot: [0, 360, 0], dur: 1 }), A.effect('hearts', { dur: 1.8 }), A.say('Ding ding!', 1.2)), A.pose('topper', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A wedding gown on a mannequin: a fitted bodice with a sash and a rose, a full skirt with a long train, a veil
  // on a tiara.
  e('wedding dress', 'wardrobe', 'wedding', () =>
    dummy('wedding dress', { top: 'white', skirt: 'white', skirtW: 1.0, sleeve: 'none' })
      .ball([0.9, 0.08, 0.8], [0, 0.04, -0.4], { color: 'white' })
      .torus([0.44, 0.2, 0.06], [0, 1.0, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.15 })
      .ball(0.06, [0, 1.0, 0.13], { color: '#f4a1c0' })
      .torus([0.18, 0.18, 0.02], [0, 1.77, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.5, 1.0, 0.3], [0, 1.25, -0.15], { color: '#fbfaf6', taper: 0.35, name: 'veil', piece: true })
      .act({ click: [A.par(A.anim('spin'), A.effect('hearts', { dur: 1.8 }))] })
      .done(),
  ),
  // A steel splitting wedge driven into the top of a log round: a tap and the log cracks in two.
  e('wedge (tool)', 'workshop', 'hand tools', () => {
    const b = m('wedge (tool)').cyl([0.34, 0.02, 0.34], [0, 0.01, 0], { color: '#9a6a3a' });
    b.pair((s) => b.cyl([0.3, 0.26, 0.15], [s * 0.075, 0.15, 0], { color: '#8a6040', name: s > 0 ? 'halfL' : 'halfR', pivot: [s * 0.01, 0.02, 0] }).cyl([0.28, 0.01, 0.14], [s * 0.075, 0.282, 0], { color: '#d8b07a', parent: s > 0 ? 'halfL' : 'halfR' }));
    return b.wedge([0.06, 0.14, 0.08], [0, 0.31, 0], { color: '#8f99a3', rot: [0, 0, 180], name: 'wedge', edge: 'sharp' })
      .box([0.065, 0.02, 0.085], [0, 0.385, 0], { color: '#5c6166', parent: 'wedge', edge: 'sharp' })
      .act({
        click: [
          [A.say('Tink... tink...', 1.2), A.pose('wedge', { move: [0, -0.06, 0], dur: 0.15 }), A.par(A.pose('halfL', { rot: [0, 0, -14], dur: 0.2 }), A.pose('halfR', { rot: [0, 0, 14], dur: 0.2 }), A.say('CRACK!', 1.2))],
          [A.par(A.pose('halfL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('halfR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('wedge', { move: [0, 0, 0], dur: 0.4 }))],
        ],
      })
      .done();
  }),
  // A potted cannabis plant, 1 m: a green stem with fans of serrated leaves (the crown sways); it rustles.
  e('weed', 'garden', 'plants', () => {
    const b = pot(m('weed'), 0.28, 0.26).stick([0, 0.27, 0], [0, 0.95, 0], 0.03, '#4f8a3a', { name: 'top', pivot: [0, 0.27, 0] });
    const leaf = (y: number, t: number, sc: number, n: number) => {
      for (let k = -(n - 1) / 2; k <= (n - 1) / 2; k++) {
        const a = (t + k * 28) * DEG, L = sc * (1 - Math.abs(k) * 0.18);
        b.ball([0.05 * sc * 5, L, 0.014], [Math.sin(a) * L * 0.5, y + Math.cos(a) * L * 0.5, 0.01], { color: 'leaf', rot: [0, 0, -a / DEG], parent: 'top' });
      }
    };
    leaf(0.95, 0, 0.2, 7);
    leaf(0.72, 55, 0.18, 5);
    leaf(0.72, -55, 0.18, 5);
    leaf(0.5, 70, 0.16, 5);
    leaf(0.5, -70, 0.16, 5);
    return b.act({ click: [A.pose('top', { rot: [0, 0, 10], dur: 0.25 }), A.pose('top', { rot: [0, 0, -8], dur: 0.25 }), A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.25 }), A.say('Rustle rustle...', 1.4))] }).done();
  }),
  // A petrol string trimmer 1.5 m long leaning on its guard: an engine at the top with a pull cord and handle, a
  // loop grip on the shaft, a guard and a trimmer head with its lines that whirls when it starts.
  e('weed wacker', 'garden', 'garden tools', () =>
    m('weed wacker', { view: 'side' })
      .stick([0, 0.12, 0.45], [0, 1.05, -0.45], 0.03, 'silver')
      .box([0.16, 0.2, 0.26], [0, 1.1, -0.5], { color: '#f0782a', round: 0.4, edge: 'sharp' })
      .box([0.1, 0.08, 0.1], [0, 1.23, -0.62], { color: '#2a2726', round: 0.3 })
      .cyl([0.05, 0.03, 0.05], [0.09, 1.12, -0.5], { color: '#2a2726', rot: [0, 0, 90] })
      .stick([-0.14, 0.75, -0.12], [0.14, 0.75, -0.12], 0.025, '#2a2726')
      .rod([0, 0.68, -0.1], [0, 0.75, -0.12], 0.025, '#2a2726')
      .rod([0, 0.95, -0.36], [0, 1.05, -0.3], 0.03, '#2a2726')
      .cyl([0.28, 0.02, 0.28], [0, 0.16, 0.42], { color: '#f0782a', taper: 0.9, edge: 'sharp' })
      .cyl([0.11, 0.05, 0.11], [0, 0.07, 0.5], { color: '#5c6166', name: 'head', mover: { kind: 'spin', axis: 'y', amount: 1800 } })
      .stick([0, 0.05, 0.5], [0.15, 0.04, 0.56], 0.005, '#9be34d', { parent: 'head' })
      .stick([0, 0.05, 0.5], [-0.15, 0.04, 0.44], 0.005, '#9be34d', { parent: 'head' })
      .act({ click: [[A.par(A.operate('head', 'on'), A.effect('smoke', { dur: 1.5 }), A.say('Brrrrm... bzzzzzz!', 2))], [A.operate('head', 'off'), A.say('Bzz... putt.', 1.2)]] })
      .done(),
  ),
  // A yellow A-frame caution sign 0.62 m tall: a slipping figure, CAUTION and WET FLOOR; it wobbles in a splash.
  e('wetfloor sign', 'home', 'cleaning', () => {
    const t = -15 * DEG, up: V = [0, Math.cos(t), Math.sin(t)], nz: V = [0, -Math.sin(t), Math.cos(t)];
    const at = (h: number, d: number): V => [0, 0.29 + h * up[1] + d * nz[1], 0.08 + h * up[2] + d * nz[2]];
    return m('wetfloor sign', { edge: 'sharp' })
      .box([0.3, 0.6, 0.02], [0, 0.29, 0.08], { color: '#f6d24a', rot: [-15, 0, 0] })
      .box([0.3, 0.6, 0.02], [0, 0.29, -0.08], { color: '#f6d24a', rot: [15, 0, 0] })
      .box([0.12, 0.08, 0.05], [0, 0.6, 0], { color: '#f6d24a', round: 0.3 })
      .label('CAUTION', [0.24, 0.06], at(0.2, 0.012), { color: '#f6d24a', rot: [-15, 0, 0], depth: 0.003 })
      .wedge([0.13, 0.11, 0.004], at(0.05, 0.012), { color: '#2a2726', rot: [-15, 0, 0], noInk: true })
      .wedge([0.09, 0.075, 0.004], at(0.045, 0.015), { color: '#f6d24a', rot: [-15, 0, 0], noInk: true })
      .label('WET FLOOR', [0.26, 0.07], at(-0.12, 0.012), { color: '#f6d24a', rot: [-15, 0, 0], depth: 0.003 })
      .act({ click: [A.par(A.anim('wobble'), A.effect('water_spray', { dur: 1 }), A.say('Squeak... whoops!', 1.5))] })
      .done();
  }),
  // A black neoprene wetsuit on a mannequin with blue side panels, knee pads and a long back-zip cord; it drips.
  e('wetsuit', 'sports', 'water sports', () => {
    const b = dummy('wetsuit', { top: '#1e1c1c', legs: '#1e1c1c', shoes: '#1e1c1c' }).box([0.445, 0.12, 0.255], [0, 1.42, 0], { color: '#2f6fc0', round: 0.5 });
    b.pair((s) => b.rod([s * 0.29, 1.4, 0], [s * 0.34, 0.95, 0], 0.03, '#2f6fc0', { noInk: true }).rod([s * 0.18, 0.95, 0], [s * 0.178, 0.2, 0], 0.03, '#2f6fc0', { noInk: true }).ball([0.1, 0.12, 0.06], [s * 0.1, 0.5, 0.06], { color: '#3a3f44' }));
    b.rod([0, 1.45, -0.13], [0, 0.98, -0.13], 0.012, '#5c6166', { noInk: true }).rod([0, 1.45, -0.14], [0.05, 1.0, -0.2], 0.01, '#2f6fc0');
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Drip... drip...', 1.5))] }).done();
  }),
  // A sheaf of ripe wheat tied with twine, 1 m: golden stalks with bearded ears that sway, shedding chaff.
  e('wheat', 'farm', 'crops', () => {
    const b = m('wheat').torus([0.12, 0.12, 0.08], [0, 0.32, 0], { color: '#8a5a2b', rot: [90, 0, 0], tube: 0.25 }).cyl([0.06, 0.02, 0.06], [0, 0.01, 0], { color: '#c8a050' });
    b.cyl([0.02, 0.02, 0.02], [0, 0.62, 0], { color: '#d9b44a', name: 'top', pivot: [0, 0.32, 0] });
    for (const [x0, z] of [[0, 0], [-0.08, 0.02], [0.08, 0.01], [-0.04, -0.06], [0.05, -0.05], [0.02, 0.07], [-0.06, 0.06]]) {
      const top: V = [x0 * 2.2, 0.78 + (x0 === 0 ? 0.05 : 0), z * 2];
      b.stick([x0 * 0.3, 0.02, z * 0.3], [x0 * 0.4, 0.32, z * 0.4], 0.012, '#d9b44a').stick([x0 * 0.4, 0.32, z * 0.4], top, 0.012, '#d9b44a', { parent: 'top' })
        .capsule([0.05, 0.19, 0.04], [top[0] * 1.1, top[1] + 0.1, top[2] * 1.1], { color: '#d9a530', rot: [z * 200, 0, -x0 * 200], parent: 'top' });
      b.stick([top[0] * 1.1, top[1] + 0.12, top[2] * 1.1], [top[0] * 1.25 - 0.02, top[1] + 0.26, top[2] * 1.1], 0.004, '#d9b44a', { parent: 'top' });
    }
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 12], dur: 0.3 }), A.effect('dust', { dur: 1.2 })), A.pose('top', { rot: [0, 0, -9], dur: 0.3 }), A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.3 }), A.say('Rustle...', 1.2))] }).done();
  }),
  // A car wheel standing on its tread, 0.65 m: a treaded tyre, a five-spoke alloy rim, lug nuts and a valve; it
  // rolls out and back.
  e('wheel', 'garage', 'car parts', () => {
    const b = m('wheel', { view: 'side' })
      .torus([0.65, 0.65, 0.22], [0, 0.325, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.3, name: 'wheel' })
      .cyl([0.42, 0.18, 0.42], [0, 0.325, 0], { color: '#c9ccd1', rot: [0, 0, 90], parent: 'wheel', edge: 'sharp' })
      .cyl([0.12, 0.2, 0.12], [0, 0.325, 0], { color: '#5c6166', rot: [0, 0, 90], parent: 'wheel', edge: 'sharp' })
      .stick([0.08, 0.5, 0.0], [0.1, 0.52, 0.0], 0.012, '#2a2726', { parent: 'wheel' });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.box([0.02, 0.13, 0.045], [0.095, 0.325 + Math.cos(a) * 0.12, Math.sin(a) * 0.12], { color: '#9da3a8', rot: [a / DEG, 0, 0], parent: 'wheel', edge: 'sharp' })
        .cyl([0.022, 0.02, 0.022], [0.105, 0.325 + Math.cos(a + 0.6) * 0.045, Math.sin(a + 0.6) * 0.045], { color: 'silver', rot: [0, 0, 90], parent: 'wheel', segs: 6 });
    });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.2, 0.05, 0.06], [0, 0.325 + Math.cos(a) * 0.3, Math.sin(a) * 0.3], { color: '#2e2a28', rot: [a / DEG, 0, 0], parent: 'wheel', noInk: true });
    });
    return b.act({ click: [A.pose('wheel', { move: [0, 0, 1.0], rot: [180, 0, 0], dur: 0.8 }), A.say('Rrrumble...', 1.2), A.pose('wheel', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })] }).done();
  }),
  // A folding wheelchair: a blue sling seat at 0.5 m and back, armrests, push handles, 0.6 m rear wheels with hand
  // rims, small front castors and footplates; its big wheels turn.
  e('wheelchair', 'clinic', 'mobility aids', () => {
    const b = m('wheelchair', { view: 'side' })
      .box([0.45, 0.06, 0.42], [0, 0.5, 0.02], { color: '#2f6fc0', round: 0.4 })
      .box([0.45, 0.42, 0.04], [0, 0.75, -0.2], { color: '#2f6fc0', rot: [-8, 0, 0], round: 0.3 })
      .box([0.4, 0.02, 0.12], [0, 0.1, 0.38], { color: 'silver', edge: 'sharp' })
      .socket('seat', [0, 0.53, 0.0], 'seat');
    b.pair((s) => {
      const n = `wheel${s > 0 ? 'L' : 'R'}`;
      wheel(b, n, 0.6, 0.05, [s * 0.3, 0.3, -0.05], 'silver');
      b.torus([0.54, 0.54, 0.015], [s * 0.335, 0.3, -0.05], { color: 'silver', rot: [0, 90, 0], tube: 0.04, parent: n, edge: 'sharp' });
      wheel(b, `wheelC${s > 0 ? 'L' : 'R'}`, 0.13, 0.03, [s * 0.22, 0.065, 0.3], '#5c6166');
      b.stick([s * 0.24, 0.5, 0.2], [s * 0.22, 0.13, 0.3], 0.025, 'silver', { edge: 'sharp' }).stick([s * 0.24, 0.5, -0.2], [s * 0.24, 0.96, -0.25], 0.025, 'silver', { edge: 'sharp' })
        .stick([s * 0.24, 0.96, -0.25], [s * 0.24, 0.98, -0.36], 0.03, '#2a2726').box([0.05, 0.03, 0.3], [s * 0.24, 0.68, 0.0], { color: '#2a2726', edge: 'sharp' })
        .stick([s * 0.24, 0.5, 0.1], [s * 0.24, 0.67, 0.1], 0.02, 'silver').stick([s * 0.2, 0.3, 0.3], [s * 0.18, 0.1, 0.38], 0.02, 'silver');
    });
    return b.act({ click: [A.par(A.pose('wheelL', { rot: [360, 0, 0], dur: 1 }), A.pose('wheelR', { rot: [360, 0, 0], dur: 1 }), A.say('Whirr!', 1)), A.par(A.pose('wheelL', { rot: [0, 0, 0], dur: 0 }), A.pose('wheelR', { rot: [0, 0, 0], dur: 0 }))] }).done();
  }),
  // A coiled leather bullwhip with a plaited handle and a knob; it cracks.
  e('whip', 'armory', 'whips', () => {
    const b = m('whip');
    [[0.3, 0.0125], [0.27, 0.0375], [0.24, 0.0625]].forEach(([d, y]) => b.torus([d, d, 0.025], [0, y, 0], { color: 'leather', rot: [90, 0, 0], tube: 0.12 }));
    return b.rod([0.1, 0.07, 0.05], [0.12, 0.35, 0.1], 0.04, '#5a3a22', { name: 'handle', pivot: [0.1, 0.07, 0.05] }).ball(0.05, [0.12, 0.37, 0.1], { color: '#5a3a22', parent: 'handle' })
      .rod([-0.12, 0.012, 0.08], [-0.3, 0.008, 0.2], 0.012, 'leather').rod([-0.3, 0.008, 0.2], [-0.36, 0.006, 0.16], 0.006, 'tan')
      .act({ click: [A.pose('handle', { rot: [-30, 0, 0], dur: 0.15 }), A.par(A.pose('handle', { rot: [10, 0, 0], dur: 0.1 }), A.effect('dust', { dur: 0.8 }), A.say('CRACK!', 1.2)), A.pose('handle', { rot: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A glass dish of whipped cream piped in a swirl with a cherry, beside its aerosol can; a squirt tops it up.
  e('whipped cream', 'food', 'desserts', () =>
    m('whipped cream')
      .cyl([0.14, 0.04, 0.14], [0, 0.02, 0], { color: 'glass', taper: 1.3 })
      .ball([0.13, 0.05, 0.13], [0, 0.06, 0], { color: 'white', name: 'swirl', pivot: [0, 0.045, 0] })
      .torus([0.13, 0.13, 0.045], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0], tube: 0.3, parent: 'swirl' })
      .torus([0.1, 0.1, 0.04], [0, 0.09, 0], { color: 'white', rot: [90, 0, 0], tube: 0.3, parent: 'swirl' })
      .torus([0.07, 0.07, 0.035], [0, 0.115, 0], { color: 'white', rot: [90, 0, 0], tube: 0.35, parent: 'swirl' })
      .cone([0.045, 0.05, 0.045], [0, 0.145, 0], { color: 'white', parent: 'swirl' })
      .ball(0.03, [0.012, 0.175, 0], { color: '#c0392b', parent: 'swirl' })
      .rod([0.012, 0.19, 0], [0.025, 0.215, -0.005], 0.004, '#3f7a3a', { parent: 'swirl' })
      .cyl([0.065, 0.2, 0.065], [0.14, 0.1, -0.04], { color: '#c9ccd1', name: 'can', pivot: [0.14, 0, -0.04], edge: 'sharp' })
      .cyl([0.06, 0.04, 0.06], [0.14, 0.22, -0.04], { color: '#4e8fd6', parent: 'can', taper: 0.6 })
      .cyl([0.02, 0.04, 0.02], [0.14, 0.26, -0.04], { color: 'white', parent: 'can' })
      .label('CREAM', [0.05, 0.05], [0.14, 0.1, -0.006], { color: '#c9ccd1', depth: 0.003, parent: 'can' })
      .act({ click: [A.pose('can', { rot: [0, 0, 50], dur: 0.3 }), A.par(A.pose('swirl', { scale: 1.2, dur: 0.4 }), A.say('Psssssht!', 1.3)), A.pose('can', { rot: [0, 0, 0], dur: 0.3 }), A.pose('swirl', { scale: 1, dur: 0.3 })] })
      .done(),
  ),
  // An outdoor hot tub 2 m across: cedar sides with steel hoops, a rim, warm blue water with jets and a seat ledge,
  // wooden steps; it bubbles and steams.
  e('whirlpool', 'home', 'bathroom', () => {
    const b = m('whirlpool')
      .cyl([2.0, 0.85, 2.0], [0, 0.425, 0], { color: '#b5814e', segs: 16 })
      .torus([2.1, 2.1, 0.12], [0, 0.88, 0], { color: '#7a5230', rot: [90, 0, 0], tube: 0.09 })
      .cyl([1.85, 0.02, 1.85], [0, 0.84, 0], { color: '#5ab4e0', name: 'water' })
      .box([0.8, 0.25, 0.4], [0, 0.125, 1.2], { color: '#9a6a3a', edge: 'sharp' })
      .box([0.8, 0.25, 0.3], [0, 0.375, 1.08], { color: '#9a6a3a', edge: 'sharp' })
      .socket('soak', [0, 0.5, 0], 'seat');
    b.each(2, (i) => b.cyl([2.02, 0.05, 2.02], [0, 0.18 + i * 0.45, 0], { color: '#55595e', noInk: true }));
    for (const [x0, z] of [...around(6, 0.55), ...around(3, 0.2, 1)]) b.ball(0.1, [x0, 0.85, z], { color: 'white', parent: 'water', noInk: true });
    return b.act({ click: [A.par(A.pose('water', { scale: 1.04, move: [0, 0.03, 0], dur: 0.3 }), A.effect('steam', { dur: 2.5 }), A.say('Blub blub blub...', 2)), A.pose('water', { scale: 1, move: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A balloon whisk standing on its red handle: loops of steel wire that whirl round.
  e('whisk', 'kitchen', 'utensils', () => {
    const b = m('whisk').cyl([0.032, 0.12, 0.032], [0, 0.06, 0], { color: '#e0473b' }).cyl([0.034, 0.02, 0.034], [0, 0.13, 0], { color: 'silver', name: 'wires', piece: true, edge: 'sharp' });
    b.each(4, (i) => b.torus([0.09, 0.18, 0.006], [0, 0.225, 0], { color: 'silver', tube: 0.07, rot: [0, i * 45, 0], parent: 'wires', edge: 'sharp' }));
    return b.act({ click: [A.par(A.pose('wires', { rot: [0, 1080, 0], dur: 1.2 }), A.say('Whisk whisk whisk!', 1.5)), A.pose('wires', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A ginger cat's face, all about its long white whiskers, which twitch.
  e('whisker', 'wild', 'animal parts', () => {
    const b = m('whisker').ball([0.14, 0.12, 0.1], [0, 0.075, -0.02], { color: '#f0923b' }).ball([0.025, 0.018, 0.015], [0, 0.078, 0.048], { color: '#f4a1c0' });
    b.pair((s) => {
      const n = s > 0 ? 'whiskersL' : 'whiskersR';
      b.ball([0.05, 0.04, 0.04], [s * 0.022, 0.055, 0.03], { color: 'white', name: n, pivot: [s * 0.03, 0.058, 0.045] })
        .cone([0.05, 0.06, 0.03], [s * 0.045, 0.14, -0.02], { color: '#f0923b' })
        .ball(0.022, [s * 0.03, 0.1, 0.025], { color: '#2a2726', eye: true });
      for (const d of [-0.012, 0, 0.012]) b.stick([s * 0.035, 0.058 + d, 0.045], [s * 0.15, 0.062 + d * 3, 0.06], 0.003, 'white', { parent: n });
    });
    return b.act({ click: [A.par(A.pose('whiskersL', { rot: [0, 0, 12], dur: 0.12 }), A.pose('whiskersR', { rot: [0, 0, -12], dur: 0.12 })), A.par(A.pose('whiskersL', { rot: [0, 0, 0], dur: 0.12 }), A.pose('whiskersR', { rot: [0, 0, 0], dur: 0.12 }), A.say('Mrrrow?', 1.2))] }).done();
  }),
  // A chrome referee's whistle on a red lanyard; it blasts.
  e('whistle', 'music', 'whistles', () =>
    m('whistle', { edge: 'sharp' })
      .cyl([0.06, 0.04, 0.06], [0, 0.03, 0], { color: 'silver', rot: [0, 0, 90], edge: 'soft' })
      .box([0.03, 0.025, 0.07], [0, 0.0475, 0.045], { color: 'silver', round: 0.3 })
      .box([0.02, 0.004, 0.015], [0, 0.06, 0.02], { color: '#2a2726', noInk: true })
      .torus([0.02, 0.02, 0.006], [0, 0.03, -0.035], { color: 'silver', rot: [0, 90, 0] })
      .torus([0.12, 0.14, 0.008], [0, 0.004, -0.1], { color: '#e0473b', rot: [90, 0, 0], tube: 0.06, edge: 'soft' })
      .act({ click: [A.par(A.anim('shake'), A.say('TWEEEEET!', 1.4))] })
      .done(),
  ),
  // A mobile whiteboard 1.8 m tall on castors: a white board in a silver frame with a marker tray; a smiley gets
  // drawn on it, then wiped off.
  e('white board', 'study', 'office', () => {
    const b = m('white board', { edge: 'sharp' })
      .box([1.24, 0.84, 0.03], [0, 1.35, -0.01], { color: 'silver' })
      .box([1.2, 0.8, 0.04], [0, 1.35, 0], { color: 'white' })
      .box([1.0, 0.03, 0.06], [0, 0.94, 0.04], { color: 'silver' })
      .rod([-0.45, 1.6, 0.022], [-0.15, 1.6, 0.022], 0.012, '#e0473b', { noInk: true }).rod([-0.45, 1.5, 0.022], [-0.2, 1.5, 0.022], 0.012, '#4e8fd6', { noInk: true })
      .torus([0.3, 0.3, 0.008], [0.25, 1.35, 0.022], { color: '#3f7a3a', tube: 0.05, name: 'smile', scale: 0, noInk: true })
      .ball(0.035, [0.2, 1.4, 0.024], { color: '#3f7a3a', name: 'eyeL', scale: 0, noInk: true })
      .ball(0.035, [0.3, 1.4, 0.024], { color: '#3f7a3a', name: 'eyeR', scale: 0, noInk: true })
      .arc([0.16, 0.1, 0.008], [0.25, 1.33, 0.024], { color: '#3f7a3a', arc: 140, rot: [0, 0, 180], tube: 0.15, name: 'mouth', scale: 0, noInk: true });
    ['#e0473b', '#4e8fd6', '#1e1c1c'].forEach((c, i) => b.capsule([0.02, 0.12, 0.02], [-0.2 + i * 0.15, 0.965, 0.04], { color: c, rot: [0, 0, 90], edge: 'soft' }));
    b.pair((s) => b.stick([s * 0.62, 0.12, 0], [s * 0.62, 1.78, 0], 0.035, 'silver').stick([s * 0.62, 0.12, -0.25], [s * 0.62, 0.12, 0.25], 0.04, 'silver').ball(0.12, [s * 0.62, 0.06, 0.22], { color: '#2a2726', edge: 'soft' }).ball(0.12, [s * 0.62, 0.06, -0.22], { color: '#2a2726', edge: 'soft' }));
    const face = (k: number, dur: number, gap: number) => A.par(...['smile', 'eyeL', 'eyeR', 'mouth'].map((n, i) => A.pose(n, { scale: k, dur, delay: i * gap })));
    return b.act({ click: [[A.par(face(1, 0.3, 0.3), A.say('Squeak squeak!', 1.6))], [A.par(face(0, 0.4, 0), A.say('Swish!', 1))]] }).done();
  }),
  // A saucepan of white sauce on a little burner, a wooden spoon stirring it and steam rising.
  e('white sauce', 'food', 'sauces', () =>
    m('white sauce')
      .cyl([0.2, 0.03, 0.2], [0, 0.015, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.17, 0.09, 0.17], [0, 0.075, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.16, 0.01, 0.16], [0, 0.116, 0], { color: '#f8f2e0' })
      .stick([0.08, 0.1, 0], [0.24, 0.11, 0], 0.02, '#2a2726')
      .stick([0.04, 0.11, 0], [0.01, 0.26, -0.04], 0.012, 'lightwood', { name: 'spoon', pivot: [0, 0.11, 0] })
      .ball([0.035, 0.012, 0.03], [0.045, 0.118, 0.005], { color: 'lightwood', parent: 'spoon' })
      .act({ click: [A.par(A.pose('spoon', { rot: [0, 720, 0], dur: 1.5 }), A.effect('steam', { dur: 1.8 }), A.say('Bloop... bloop...', 1.6)), A.pose('spoon', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A red rubber whoopee cushion with its neck; sat on, it lets rip.
  e('whoopee cushion', 'toys', 'pranks', () =>
    m('whoopee cushion')
      .ball([0.22, 0.055, 0.22], [0, 0.0275, 0], { color: '#e0473b', name: 'cushion', pivot: [0, 0, 0] })
      .cyl([0.05, 0.06, 0.02], [0, 0.012, 0.13], { color: '#e0473b', rot: [90, 0, 0], taper: 0.6, parent: 'cushion' })
      .ball([0.08, 0.012, 0.06], [-0.03, 0.05, -0.03], { color: '#ff8a8a', parent: 'cushion', noInk: true })
      .act({ click: [A.par(A.pose('cushion', { scale: 0.6, dur: 0.25 }), A.say('PFFFRRRT!', 1.5)), A.wait(0.5), A.pose('cushion', { scale: 1, dur: 0.5 })] })
      .done(),
  ),
  // A pillar candle on a brass dish with its wick alight; the flame is blown out in a curl of smoke, then lit again.
  e('wick', 'home', 'candles', () =>
    m('wick')
      .cyl([0.12, 0.012, 0.12], [0, 0.006, 0], { color: 'brass', edge: 'sharp' })
      .cyl([0.07, 0.1, 0.07], [0, 0.06, 0], { color: 'cream' })
      .cyl([0.06, 0.005, 0.06], [0, 0.11, 0], { color: '#f5e8c8' })
      .capsule([0.012, 0.035, 0.012], [0.03, 0.09, 0.018], { color: 'cream' })
      .stick([0, 0.11, 0], [0.004, 0.14, 0], 0.005, '#1e1c1c')
      .ball([0.024, 0.05, 0.024], [0.004, 0.17, 0], { color: '#f0923b', glow: true, name: 'flame' })
      .ball([0.012, 0.025, 0.012], [0.004, 0.163, 0.008], { color: '#f6d24a', glow: true, parent: 'flame' })
      .act({ click: [[A.par(A.pose('flame', { scale: 0, dur: 0.2 }), A.effect('smoke', { dur: 1.5 }), A.say('Fff!', 1))], [A.par(A.pose('flame', { scale: 1, dur: 0.3 }), A.say('Whoosh!', 1))]] })
      .done(),
  ),
  // A long blonde wig on a head form, with a fringe and curls; it slips off, then goes back on.
  e('wig', 'wardrobe', 'hairpieces', () => {
    const b = headForm('wig').ball([0.22, 0.2, 0.23], [0, 0.27, -0.015], { color: '#e8c060', name: 'hair', parent: 'form', piece: true })
      .ball([0.2, 0.26, 0.08], [0, 0.17, -0.08], { color: '#e8c060', parent: 'hair' })
      .ball([0.16, 0.05, 0.07], [0, 0.32, 0.07], { color: '#e8c060', parent: 'hair' });
    b.pair((s) => b.capsule([0.07, 0.24, 0.07], [s * 0.085, 0.17, -0.02], { color: '#e8c060', parent: 'hair' }));
    return b.act({ click: [[A.say('Whoops!', 1), A.detach('hair', 'wig')], [A.reattach('hair'), A.say('Ta-da!', 1)]] }).done();
  }),
  // A weeping willow 12 m tall: a gnarled trunk, a broad dome of fine leaves and long curtains of hanging fronds
  // that sway in the breeze.
  e('willow tree', 'garden', 'trees', () => {
    const b = m('willow tree').cyl([0.9, 4.5, 0.9], [0, 2.25, 0], { color: 'bark', taper: 0.7 })
      .rod([0, 3.8, 0], [-1.8, 6.0, 0.4], 0.35, 'bark').rod([0, 4.0, 0], [1.8, 6.2, -0.3], 0.35, 'bark')
      .ball([9, 5, 8.5], [0, 8.5, 0], { color: '#9acd5a', name: 'top', pivot: [0, 6, 0] });
    for (const [x0, z] of around(14, 3.9)) b.capsule([0.7, 5.5, 0.7], [x0, 5.4, z * 0.95], { color: '#8cc04a', parent: 'top' });
    for (const [x0, z] of around(9, 2.4, 0.4)) b.capsule([0.7, 4.5, 0.7], [x0, 6.2, z], { color: '#7ab03a', parent: 'top' });
    return b.act({ click: [A.par(A.pose('top', { rot: [0, 0, 5], dur: 0.6 }), A.say('Whoosh...', 1.5)), A.pose('top', { rot: [0, 0, -4], dur: 0.6 }), A.pose('top', { rot: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A hand winch bolted to a base plate: a ratchet gear, a drum wound with steel cable, a hook, and a crank that
  // winds the hook in.
  e('winch', 'workshop', 'machines', () => {
    const b = m('winch', { edge: 'sharp' })
      .box([0.42, 0.04, 0.3], [0, 0.02, 0], { color: '#5c6166' })
      .cyl([0.14, 0.28, 0.14], [0, 0.2, 0], { color: 'silver', rot: [0, 0, 90] })
      .cyl([0.17, 0.2, 0.17], [0, 0.2, 0], { color: '#8f99a3', rot: [0, 0, 90], name: 'drum' })
      .stick([0, 0.13, 0.06], [0, 0.04, 0.42], 0.012, '#8f99a3')
      .cyl([0.22, 0.02, 0.22], [-0.175, 0.2, 0], { color: 'brass', rot: [0, 0, 90], segs: 12 })
      .cyl([0.05, 0.03, 0.05], [0.18, 0.2, 0], { color: '#2a2726', rot: [0, 0, 90], name: 'crank' })
      .stick([0.18, 0.2, 0], [0.18, 0.34, 0.05], 0.025, '#2a2726', { parent: 'crank' })
      .stick([0.18, 0.34, 0.05], [0.28, 0.34, 0.05], 0.025, '#e0473b', { parent: 'crank' })
      .arc([0.07, 0.07, 0.014], [0, 0.035, 0.46], { color: 'iron', arc: 270, rot: [90, 0, 0], tube: 0.25, name: 'hook', piece: true });
    b.pair((s) => b.box([0.03, 0.3, 0.26], [s * 0.155, 0.18, 0], { color: '#2f6fc0' }));
    return b.act({ click: [A.par(A.pose('crank', { rot: [-720, 0, 0], dur: 1.6 }), A.pose('drum', { rot: [-720, 0, 0], dur: 1.6 }), A.pose('hook', { move: [0, 0.03, -0.2], dur: 1.6 }), A.say('Clack-clack-clack!', 1.6)), A.par(A.pose('crank', { rot: [0, 0, 0], dur: 0 }), A.pose('drum', { rot: [0, 0, 0], dur: 0 }), A.pose('hook', { move: [0, 0, 0], dur: 0.6 }))] }).done();
  }),
  // Wind chimes hanging from a shepherd's-crook garden stand: a wooden top disc, five silver tubes of different
  // lengths and a sail; they swing and ring.
  e('wind chime', 'garden', 'garden things', () => {
    const b = m('wind chime').box([0.3, 0.06, 0.3], [0, 0.03, 0], { color: '#a7a7a0', edge: 'sharp' })
      .stick([0, 0.06, 0], [0, 1.0, 0], 0.025, '#2a2726').rod([0, 1.0, 0], [0.15, 1.05, 0], 0.025, '#2a2726').rod([0.15, 1.05, 0], [0.25, 0.99, 0], 0.025, '#2a2726')
      .stick([0.25, 0.99, 0], [0.25, 0.86, 0], 0.004, 'tan')
      .cyl([0.16, 0.025, 0.16], [0.25, 0.85, 0], { color: 'wood' })
      .stick([0.25, 0.84, 0], [0.25, 0.5, 0], 0.003, 'tan', { name: 'cord', pivot: [0.25, 0.84, 0] })
      .cyl([0.04, 0.012, 0.04], [0.25, 0.62, 0], { color: 'wood', parent: 'cord' })
      .box([0.06, 0.08, 0.006], [0.25, 0.46, 0], { color: 'wood', parent: 'cord' });
    around(5, 0.06).forEach(([x0, z], i) => {
      const L = 0.22 + i * 0.035;
      b.stick([0.25 + x0, 0.84, z], [0.25 + x0, 0.8, z], 0.003, 'tan').cyl([0.018, L, 0.018], [0.25 + x0, 0.8 - L / 2, z], { color: 'silver', name: `chime${i + 1}`, pivot: [0.25 + x0, 0.8, z], edge: 'sharp' });
    });
    const swing = (r: number) => A.par(A.pose('cord', { rot: [0, 0, r], dur: 0.25 }), ...[1, 2, 3, 4, 5].map((i) => A.pose(`chime${i}`, { rot: [0, 0, i % 2 ? r : -r], dur: 0.25 })));
    return b.act({ click: [A.par(swing(14), A.say('Ting-a-ling-ling!', 1.8)), swing(-10), swing(6), swing(0)] }).done();
  }),
  // (The vocabulary's 1 m is wrong: these are real turbines.) A wind farm on a grassy rise: three white turbines,
  // 46 m to the blade tips, their rotors always turning, red lights on the nacelles that blink.
  e('wind farm', 'tech', 'power', () => {
    const b = m('wind farm').cyl([70, 1.2, 40], [0, 0.6, 0], { color: '#6ab04c', taper: 0.95 });
    windTurbineX(b, 0, 4, 1.2, 32, 'A');
    windTurbineX(b, -26, -6, 1.2, 30, 'B');
    windTurbineX(b, 26, -8, 1.2, 28, 'C');
    return b.act({ click: [A.par(A.operate('lamp', 'off'), A.say('Whoom... whoom... whoom...', 2)), A.wait(0.4), A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on')] }).done();
  }),
  // (The vocabulary's 1 m is wrong: a wind turbine is tall.) A wind turbine 60 m to the blade tip: a tapering
  // white tower on a concrete base with a door, a nacelle and three long blades that turn, and can be braked.
  e('wind turbine', 'tech', 'power', () => {
    const b = m('wind turbine').box([5, 0.6, 5], [0, 0.3, 0], { color: '#a7a7a0', edge: 'sharp' });
    windTurbineX(b, 0, 0, 0.6, 42, 'A');
    door(b, 'door', 0.9, 2.1, [0, 0.6, 1.6], '#d4d7da', { hinge: 1, frame: '#9da3a8' });
    return b.act({ click: [[A.operate('blades', 'off'), A.say('Whirr... clunk.', 1.4)], [A.operate('blades', 'on'), A.say('Whoosh... whoosh...', 1.6)]] }).done();
  }),
  // A Dutch smock windmill 21 m to the sail tips: a brick base, an octagonal tapering tower with a reefing stage,
  // a boat-shaped cap, four latticed sails that turn (or brake), a door and little windows.
  e('windmill', 'places', 'landmarks', () => {
    const b = m('windmill', { edge: 'sharp' })
      .cyl([8.4, 3.2, 8.4], [0, 1.6, 0], { color: '#b5634a', segs: 8 })
      .cyl([7.4, 9.0, 7.4], [0, 7.7, 0], { color: '#d9cdb4', taper: 0.62, segs: 8 })
      .cyl([10, 0.25, 10], [0, 4.4, 0], { color: '#7a5230', segs: 8 })
      .torus([10.1, 10.1, 0.08], [0, 5.3, 0], { color: '#7a5230', rot: [90, 0, 0], tube: 0.015 })
      .loft([4.8, 2.6, 5.4], [0, 13.3, -0.2], [[0, 0.5, 0.6, -0.1], [0.4, 1, 1, 0], [1, 0.75, 0.8, 0]], { color: '#4a4f55', cut: 'top', boxy: 0.3 })
      .cyl([0.9, 1.6, 0.9], [0, 13.2, 2.8], { color: '#5a3a22', rot: [90, 0, 0] });
    door(b, 'door', 1.2, 2.2, [0, 0, 4.1], '#3f7a3a', { hinge: 1, frame: 'white' });
    win(b, 0.7, 0.9, [0, 7.5, 3.3], 'front', 'white');
    win(b, 0.6, 0.8, [0, 10.6, 2.75], 'front', 'white');
    b.ball(0.5, [0, 13.2, 3.7], { color: '#5a3a22', name: 'sails', pivot: [0, 13.2, 3.7], mover: { kind: 'spin', axis: 'z', amount: 50, on: true } });
    b.each(4, (i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a), deg = -a / DEG;
      b.stick([0, 13.2, 3.75], [s * 9.0, 13.2 + c * 9.0, 3.75], 0.3, '#5a3a22', { parent: 'sails' })
        .box([1.6, 6.4, 0.06], [s * 5.4 + c * 0.85, 13.2 + c * 5.4 - s * 0.85, 3.7], { color: '#f2ecdc', rot: [0, 0, deg], parent: 'sails' });
      b.each(3, (k) => b.box([1.7, 0.08, 0.08], [s * (3.0 + k * 2.4) + c * 0.85, 13.2 + c * (3.0 + k * 2.4) - s * 0.85, 3.78], { color: '#7a5230', rot: [0, 0, deg], parent: 'sails', noInk: true }));
    });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Creak!', 1), A.wait(1.8), A.operate('door', 'close')],
          [A.operate('sails', 'off'), A.say('Creak... clunk.', 1.4)],
          [A.operate('sails', 'on'), A.say('Whoosh... whoosh...', 1.6)],
        ],
      })
      .done();
  }),
  // A white sash window set in a short stretch of brick wall: a sill, two panes and a lower sash that slides up,
  // with a pot plant on the sill.
  e('window', 'home', 'window things', () => {
    const b = m('window', { edge: 'sharp' })
      .box([1.7, 1.75, 0.25], [0, 0.875, -0.1], { color: '#b04a32', round: 0.02 })
      .box([1.0, 1.3, 0.06], [0, 0.95, 0.03], { color: '#3a5068' })
      .box([1.1, 0.08, 0.1], [0, 1.64, 0.06], { color: 'white' })
      .box([1.2, 0.08, 0.22], [0, 0.26, 0.1], { color: 'white' })
      .box([0.94, 0.62, 0.04], [0, 1.28, 0.06], { color: 'glass' })
      .box([1.0, 0.68, 0.03], [0, 1.28, 0.065], { color: 'white' })
      .box([0.94, 0.62, 0.04], [0, 0.63, 0.1], { color: 'glass', name: 'sash', mover: { kind: 'slide', axis: 'y', amount: 0.55 } })
      .box([1.0, 0.06, 0.05], [0, 0.97, 0.1], { color: 'white', parent: 'sash' })
      .box([1.0, 0.06, 0.05], [0, 0.29, 0.1], { color: 'white', parent: 'sash' })
      .box([0.05, 0.6, 0.05], [0, 0.63, 0.1], { color: 'white', parent: 'sash' })
      .cyl([0.12, 0.1, 0.12], [0.35, 0.35, 0.12], { color: TERRA, taper: 1.25 })
      .ball([0.18, 0.14, 0.16], [0.35, 0.46, 0.12], { color: '#5aa553', edge: 'soft' })
      .socket('sill', [-0.3, 0.3, 0.12], 'top', { size: 0.25 });
    b.pair((s) => b.box([0.06, 1.38, 0.1], [s * 0.53, 0.95, 0.06], { color: 'white' }));
    return b.act({ click: [[A.operate('sash', 'up'), A.say('Squeak!', 1)], [A.operate('sash', 'down'), A.say('Thump.', 1)]] }).done();
  }),
  // Venetian blinds in a white window frame: a head rail, fourteen slats that tilt open and shut, ladder strings and
  // a pull cord with a tassel.
  e('window blinds', 'home', 'window things', () => {
    const b = m('window blinds', { edge: 'sharp' })
      .box([1.1, 0.06, 0.2], [0, 0.03, 0.03], { color: 'white' })
      .box([1.0, 1.25, 0.1], [0, 0.68, -0.06], { color: 'white' })
      .box([0.9, 1.15, 0.02], [0, 0.68, 0.0], { color: '#a8d8f5' })
      .box([1.0, 0.08, 0.1], [0, 1.27, 0.06], { color: 'white' })
      .box([0.96, 0.03, 0.07], [0, 0.12, 0.06], { color: 'white' })
      .stick([0.42, 1.24, 0.12], [0.42, 0.5, 0.12], 0.008, 'gray').ball(0.03, [0.42, 0.48, 0.12], { color: 'gray' });
    b.each(14, (i) => b.box([0.94, 0.06, 0.012], [0, 0.18 + i * 0.075, 0.06], { color: '#f4ecdc', name: `slat${i + 1}`, mover: { kind: 'swing', axis: 'x', amount: 65, on: true } }));
    b.pair((s) => b.stick([s * 0.3, 1.24, 0.07], [s * 0.3, 0.12, 0.07], 0.004, '#d4d7da', { noInk: true }));
    return b.act({ click: [[A.operate('slat', 'close'), A.say('Clatter!', 1)], [A.operate('slat', 'open'), A.say('Clatter!', 1)]] }).done();
  }),
  // A window cleaner in a cap and overalls holding a long squeegee pole: the wiping wave goes with "wipe, wipe",
  // the thumbs-up with "spotless".
  e('window cleaner', 'town', 'workers', () =>
    withAct(who('window cleaner', { top: 'skyblue', bottom: 'navy', shoes: 'black', pose: 'hold', acc: [hat('cap', 'blue'), wear('overalls', 'navy'), held('mop', '#4e8fd6')] }), {
      click: [
        [A.par(A.anim('wave', 2), A.say('Wipe, wipe... squeaky clean!', 2))],
        [A.par(A.anim('thumbs_up'), A.say('Spotless! You can see your face in it.', 2.2))],
      ],
    }),
  ),
  // A box fan sitting in an open window frame: a white case, a guard and five blades that whirl, a speed dial.
  e('window fan', 'home', 'appliances', () => {
    const b = m('window fan', { edge: 'sharp' })
      .box([0.46, 0.46, 0.12], [0, 0.25, 0], { color: 'white', round: 0.2 })
      .cyl([0.4, 0.02, 0.4], [0, 0.25, 0.05], { color: '#3a3633', rot: [90, 0, 0] })
      .cyl([0.08, 0.03, 0.08], [0, 0.25, 0.065], { color: '#a8d8f5', rot: [90, 0, 0], name: 'blades', pivot: [0, 0.25, 0.065], mover: { kind: 'spin', axis: 'z', amount: 1440 } })
      .torus([0.4, 0.4, 0.01], [0, 0.25, 0.08], { color: '#9da3a8', tube: 0.04, noInk: true })
      .torus([0.24, 0.24, 0.01], [0, 0.25, 0.08], { color: '#9da3a8', tube: 0.06, noInk: true })
      .stick([-0.2, 0.25, 0.082], [0.2, 0.25, 0.082], 0.006, '#9da3a8', { noInk: true })
      .box([0.12, 0.03, 0.04], [0, 0.49, 0], { color: '#9da3a8', round: 0.4 })
      .cyl([0.04, 0.02, 0.04], [0.18, 0.44, 0.065], { color: '#9da3a8', rot: [90, 0, 0], name: 'dial' });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.box([0.08, 0.15, 0.01], [Math.sin(a) * 0.1, 0.25 + Math.cos(a) * 0.1, 0.07], { color: '#a8d8f5', rot: [0, 15, -a / DEG], parent: 'blades' });
    });
    b.pair((s) => b.box([0.06, 0.03, 0.16], [s * 0.16, 0.015, 0], { color: '#9da3a8' }));
    return b.act({ click: [[A.par(A.operate('blades', 'on'), A.pose('dial', { rot: [0, 0, -90], dur: 0.2 }), A.effect('dust', { dur: 1.5 }), A.say('Whirrrr!', 1.5))], [A.par(A.operate('blades', 'off'), A.pose('dial', { rot: [0, 0, 0], dur: 0.2 }), A.say('Whrr...', 1))]] }).done();
  }),
  // A deep window sill under the bottom of a window: a painted ledge with a pot of geraniums that blooms.
  e('window sill', 'home', 'window things', () =>
    m('window sill', { edge: 'sharp' })
      .box([0.9, 0.18, 0.12], [0, 0.09, -0.04], { color: '#efe2c0' })
      .box([1.0, 0.04, 0.24], [0, 0.2, 0.01], { color: 'white' })
      .box([0.8, 0.12, 0.06], [0, 0.28, -0.08], { color: 'white' })
      .box([0.7, 0.08, 0.02], [0, 0.31, -0.045], { color: 'glass' })
      .cyl([0.08, 0.07, 0.08], [0.28, 0.255, 0.04], { color: TERRA, taper: 1.25, edge: 'soft' })
      .ball([0.12, 0.08, 0.1], [0.28, 0.32, 0.04], { color: '#5aa553', edge: 'soft' })
      .ball([0.05, 0.04, 0.04], [0.29, 0.37, 0.07], { color: '#e0473b', name: 'bloom', edge: 'soft' })
      .socket('ledge', [-0.2, 0.22, 0.04], 'top', { size: 0.25 })
      .act({ click: [A.par(A.pose('bloom', { scale: 1.6, dur: 0.5 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1), A.pose('bloom', { scale: 1, dur: 0.5 })] })
      .done(),
  ),
  // The front of a red car with its windscreen: a raked pane in a black seal, the bonnet, wings, headlights and two
  // wipers that sweep in the rain.
  e('windscreens', 'garage', 'car parts', () => {
    const t = -35 * DEG, up: V = [0, Math.cos(t), Math.sin(t)], nz: V = [0, -Math.sin(t), Math.cos(t)];
    const c: V = [0, 0.86, 0.0];
    const at = (u: number, v: number, d: number): V => [u, c[1] + v * up[1] + d * nz[1], c[2] + v * up[2] + d * nz[2]];
    const b = m('windscreens', { edge: 'sharp' })
      .box([1.7, 0.5, 1.0], [0, 0.4, 0.55], { color: '#d23a2a', round: 0.4, edge: 'soft' })
      .box([1.6, 0.12, 0.5], [0, 1.2, -0.48], { color: '#d23a2a', round: 0.3 })
      .box([0.9, 0.16, 0.05], [0, 0.42, 1.06], { color: '#3a3633' })
      .ball([0.26, 0.14, 0.06], [0.6, 0.48, 1.05], { color: '#fff6c8', glow: true }).ball([0.26, 0.14, 0.06], [-0.6, 0.48, 1.05], { color: '#fff6c8', glow: true })
      .box([1.7, 0.18, 1.0], [0, 0.2, 0.55], { color: '#3a3633', round: 0.3 })
      .stick(at(0.78, -0.4, 0), at(0.72, 0.4, 0), 0.08, '#d23a2a').stick(at(-0.78, -0.4, 0), at(-0.72, 0.4, 0), 0.08, '#d23a2a')
      .box([1.5, 0.82, 0.03], c, { color: '#2a2726', rot: [-35, 0, 0], round: 0.2 })
      .box([1.42, 0.75, 0.04], at(0, 0, 0.012), { color: 'glass', rot: [-35, 0, 0], round: 0.3 });
    b.pair((s) => b.stick(at(s * 0.05 - 0.3, -0.36, 0.04), at(s * 0.05 - 0.3 + 0.55, -0.33, 0.04), 0.02, '#1e1c1c', { name: s > 0 ? 'wiperL' : 'wiperR', pivot: at(s * 0.05 - 0.3, -0.36, 0.04) }));
    return b.act({ click: [A.par(A.effect('rain', { dur: 2.5 }), A.pose('wiperL', { rot: [0, 0, 70], dur: 0.4, times: 3 }), A.pose('wiperR', { rot: [0, 0, 70], dur: 0.4, times: 3 }), A.say('Swish... swish... swish!', 2.2))] }).done();
  }),
  // (The vocabulary's 12 m is an aeroplane's; this is a bird's.) An eagle's wing, 1.1 m across, spread on a
  // little display stand: brown coverts and a fan of long flight feathers; it flaps.
  e('wing', 'aviary', 'feathers', () => {
    const b = m('wing').box([0.3, 0.05, 0.2], [0, 0.025, 0], { color: '#7a5230', edge: 'sharp' }).stick([0, 0.05, 0], [0, 0.42, 0], 0.03, '#5a3a22');
    featherWing(b, 1, [-0.05, 0.45, 0], 1.1, 'wing', { bone: '#6b4a2e', covert: '#8a6a4a', quill: ['#5a3a22', '#6b4a2e'] });
    return b.act({ click: [A.par(A.pose('wing', { rot: [0, 0, 22], dur: 0.25, times: 2 }), A.say('Flap flap!', 1.2))] }).done();
  }),
  // (The vocabulary's 12 m is an aeroplane's.) A pair of white angel wings on a harness stand, 3 m across: a soft
  // shoulder pad and two feathered wings that flap.
  e('wings', 'fantasy', 'magic items', () => {
    const b = m('wings').cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: '#7a5230', edge: 'sharp' }).stick([0, 0.04, 0], [0, 1.25, 0], 0.04, '#5a3a22')
      .ball([0.4, 0.5, 0.22], [0, 1.4, -0.05], { color: '#e6ecf5' });
    b.pair((s) => featherWing(b, s, [s * 0.12, 1.45, -0.08], 1.45, s > 0 ? 'wingL' : 'wingR', { bone: 'white', covert: '#fbf8f0', quill: ['white', '#d6e0ee'] }));
    return b.act({ click: [A.par(A.pose('wingL', { rot: [0, 0, 18], dur: 0.3, times: 2 }), A.pose('wingR', { rot: [0, 0, -18], dur: 0.3, times: 2 }), A.effect('sparkle', { dur: 1.5 }), A.say('Whoosh!', 1.2))] }).done();
  }),
  // A spool of copper wire with black flanges, its end trailing off; it unwinds a turn.
  e('wire (string)', 'workshop', 'hardware', () =>
    m('wire (string)')
      .cyl([0.1, 0.012, 0.1], [0.035, 0.05, 0], { color: '#2a2726', rot: [0, 0, 90], name: 'spool' })
      .cyl([0.1, 0.012, 0.1], [-0.035, 0.05, 0], { color: '#2a2726', rot: [0, 0, 90], parent: 'spool' })
      .cyl([0.08, 0.06, 0.08], [0, 0.05, 0], { color: 'copper', rot: [0, 0, 90], parent: 'spool' })
      .cyl([0.02, 0.09, 0.02], [0, 0.05, 0], { color: '#5c6166', rot: [0, 0, 90], parent: 'spool' })
      .rod([0.0, 0.012, 0.04], [0.06, 0.004, 0.1], 0.006, 'copper').rod([0.06, 0.004, 0.1], [0.12, 0.004, 0.08], 0.006, 'copper')
      .act({ click: [A.par(A.pose('spool', { rot: [360, 0, 0], dur: 0.8 }), A.say('Zzzip!', 1)), A.pose('spool', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // Diagonal wire cutters standing on their red grips: steel jaws on a pivot; they snip.
  e('wire cutter', 'workshop', 'hand tools', () => {
    const b = m('wire cutter', { edge: 'sharp' }).cyl([0.026, 0.016, 0.026], [0, 0.145, 0], { color: 'silver', rot: [90, 0, 0] });
    b.pair((s) => {
      const n = s > 0 ? 'armL' : 'armR';
      b.rod([s * 0.005, 0.15, 0], [s * 0.012, 0.115, 0], 0.012, 'silver', { name: n, pivot: [0, 0.145, 0] }).rod([s * 0.012, 0.12, 0], [s * 0.042, 0.01, 0], 0.022, '#d23a2a', { parent: n, edge: 'soft' }).cone([0.02, 0.06, 0.012], [s * 0.007, 0.18, 0], { color: 'silver', rot: [0, 0, s * -8], parent: n });
    });
    const snip = (r: number) => A.par(A.pose('armL', { rot: [0, 0, r], dur: 0.12 }), A.pose('armR', { rot: [0, 0, -r], dur: 0.12 }));
    return b.act({ click: [snip(-10), A.par(snip(0), A.say('Snip!', 1))] }).done();
  }),
  // A chicken's wishbone: two forked arms; pull, and one half snaps off with a wish.
  e('wishbone', 'ideas', 'good luck', () => {
    const b = m('wishbone').ball([0.022, 0.02, 0.012], [0, 0.012, 0], { color: 'cream', name: 'bone' });
    b.rod([0, 0.015, 0], [0.018, 0.05, 0], 0.009, 'cream', { parent: 'bone' }).rod([0.018, 0.05, 0], [0.035, 0.1, 0], 0.008, 'cream', { parent: 'bone' }).ball(0.012, [0.036, 0.104, 0], { color: 'cream', parent: 'bone' });
    b.rod([-0.002, 0.03, 0], [-0.018, 0.05, 0], 0.009, 'cream', { name: 'half', parent: 'bone', piece: true }).rod([-0.018, 0.05, 0], [-0.035, 0.1, 0], 0.008, 'cream', { parent: 'half' }).ball(0.012, [-0.036, 0.104, 0], { color: 'cream', parent: 'half' });
    return b.act({ click: [[A.say('Snap!', 1.2), A.detach('half', 'half'), A.effect('sparkle', { dur: 1.2 })], [A.reattach('half')]] }).done();
  }),
  // A witch's black hat, 0.4 m: a wide brim, a tall crooked crown whose tip wiggles, a purple band and a gold
  // buckle.
  e('witch hat', 'wardrobe', 'hats', () =>
    m('witch hat')
      .cyl([0.46, 0.015, 0.46], [0, 0.0075, 0], { color: '#1e1c1c' })
      .cone([0.24, 0.3, 0.24], [0, 0.16, 0], { color: '#1e1c1c' })
      .cone([0.07, 0.13, 0.07], [0.03, 0.34, 0], { color: '#1e1c1c', rot: [0, 0, -35], name: 'tip', pivot: [0.0, 0.29, 0] })
      .cyl([0.225, 0.04, 0.225], [0, 0.04, 0], { color: '#8a5fc4', taper: 0.9 })
      .box([0.06, 0.045, 0.01], [0, 0.04, 0.108], { color: 'gold', edge: 'sharp' })
      .box([0.03, 0.022, 0.012], [0, 0.04, 0.108], { color: '#1e1c1c', edge: 'sharp' })
      .act({ click: [A.par(A.pose('tip', { rot: [0, 0, 20], dur: 0.2, times: 3 }), A.effect('sparkle', { dur: 1.5 }), A.say('Hee hee hee!', 1.6))] })
      .done(),
  ),
  // A witch's gnarled wand standing in a crooked wooden holder, its green tip crackling with light.
  e("witch's wand", 'fantasy', 'magic items', () =>
    m("witch's wand")
      .cyl([0.1, 0.04, 0.1], [0, 0.02, 0], { color: '#3a2414', edge: 'sharp' })
      .rod([0, 0.03, 0], [0.01, 0.14, 0.005], 0.018, '#4a2e1a', { name: 'wand', piece: true })
      .rod([0.01, 0.14, 0.005], [-0.012, 0.25, 0], 0.014, '#4a2e1a', { parent: 'wand' })
      .rod([-0.012, 0.25, 0], [0.006, 0.33, 0.004], 0.011, '#4a2e1a', { parent: 'wand' })
      .ball(0.022, [0.01, 0.14, 0.005], { color: '#4a2e1a', parent: 'wand' })
      .ball(0.03, [0.007, 0.345, 0.004], { color: '#9be34d', glow: true, name: 'tipLight', parent: 'wand', mover: { kind: 'light', on: false } })
      .act({ click: [A.par(A.operate('tipLight', 'on'), A.pose('wand', { move: [0, 0.15, 0], rot: [0, 0, -25], dur: 0.4 }), A.effect('sparkle', { dur: 1.5 }), A.say('Zap!', 1)), A.wait(0.6), A.par(A.operate('tipLight', 'off'), A.pose('wand', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 }))] })
      .done(),
  ),
  // A wizard's tall blue hat, 0.45 m: a wide navy brim, a gold band, stars and a crescent moon; its stars twinkle
  // and the point sways.
  e('wizard hat', 'wardrobe', 'hats', () =>
    m('wizard hat')
      .cyl([0.42, 0.015, 0.42], [0, 0.0075, 0], { color: 'navy' })
      .cone([0.26, 0.42, 0.26], [0, 0.22, 0], { color: '#4e6fd6', name: 'cone', pivot: [0, 0.02, 0] })
      .cyl([0.25, 0.035, 0.25], [0, 0.03, 0], { color: 'gold', taper: 0.92 })
      .star(0.06, [0.0, 0.12, 0.1], { color: 'gold', noInk: true, parent: 'cone' })
      .star(0.045, [0.04, 0.25, 0.05], { color: 'gold', noInk: true, parent: 'cone' })
      .ball([0.04, 0.05, 0.01], [-0.06, 0.18, 0.085], { color: '#f6d24a', noInk: true, parent: 'cone' })
      .act({ click: [A.par(A.pose('cone', { rot: [0, 0, 8], dur: 0.3, times: 2 }), A.effect('sparkle', { dur: 1.8 }), A.say('Twinkle twinkle!', 1.5))] })
      .done(),
  ),
  // A wizard's staff 1.75 m: a gnarled shaft with a knot, twisting roots at the top cradling a crystal orb that
  // blazes up.
  e('wizard staff', 'fantasy', 'magic items', () => {
    const b = m('wizard staff').cyl([0.25, 0.03, 0.25], [0, 0.015, 0], { color: '#5c6166', edge: 'sharp' })
      .rod([0, 0.03, 0], [0.02, 0.75, 0], 0.05, 'wood').rod([0.02, 0.75, 0], [-0.01, 1.45, 0], 0.05, 'wood')
      .ball(0.07, [0.02, 0.75, 0], { color: '#7a5230' })
      .ball(0.18, [-0.01, 1.6, 0], { color: '#6fd3e8', glow: true, name: 'orb', mover: { kind: 'light', on: false } });
    for (const [x0, z] of around(3, 0.11, 0.5)) b.rod([-0.01, 1.42, 0], [x0 - 0.01, 1.66, z], 0.025, 'wood');
    return b.act({ click: [A.par(A.operate('orb', 'on'), A.effect('sparkle', { dur: 2 }), A.say('Whooom!', 1.4)), A.wait(1.5), A.operate('orb', 'off')] }).done();
  }),
  // A stack of sawn logs, 1 m long, bark on the sides and rings on the ends; the top log rolls off and back.
  e('wood', 'workshop', 'building materials', () => {
    const b = m('wood');
    ([[-0.31, 0.15], [0, 0.15], [0.31, 0.15], [-0.155, 0.41], [0.155, 0.41]] as Array<[number, number]>).forEach(([x0, y], i) => {
      b.cyl([0.3, 1.0, 0.3], [x0, y, 0], { color: 'bark', rot: [90, 0, 0], ...(i === 0 ? { name: 'pile' } : {}) }).cyl([0.26, 0.012, 0.26], [x0, y, 0.5], { color: '#e0c08a', rot: [90, 0, 0] })
        .torus([0.14, 0.14, 0.006], [x0, y, 0.507], { color: '#b5814e', tube: 0.1, noInk: true });
    });
    b.cyl([0.3, 1.0, 0.3], [0, 0.67, 0], { color: 'bark', rot: [90, 0, 0], name: 'log', parent: 'pile', piece: true })
      .cyl([0.26, 0.012, 0.26], [0, 0.67, 0.5], { color: '#e0c08a', rot: [90, 0, 0], parent: 'log' })
      .torus([0.14, 0.14, 0.006], [0, 0.67, 0.507], { color: '#b5814e', tube: 0.1, noInk: true, parent: 'log' });
    return b.act({ click: [[A.say('Clonk!', 1), A.detach('log', 'log')], [A.reattach('log'), A.say('Thunk.', 1)]] }).done();
  }),
  // A heap of fresh wood chips in pale and dark shades; a crunchy puff of dust when trodden.
  e('wood chip', 'garden', 'garden things', () => {
    const b = m('wood chip').cyl([0.24, 0.035, 0.22], [0, 0.0175, 0], { color: '#8a5a2b', taper: 0.6, name: 'heap' });
    b.each(14, (i) => {
      const a = i * 2.4, r = 0.015 + (i % 4) * 0.02;
      b.box([0.035, 0.008, 0.02], [Math.cos(a) * r, 0.04 - r * 0.25, Math.sin(a) * r], { color: ['#c8955a', '#a8743a', '#d9b07a'][i % 3], rot: [((i * 37) % 40) - 20, (i * 53) % 180, ((i * 29) % 40) - 20], parent: 'heap', edge: 'sharp' });
    });
    return b.act({ click: [A.par(A.pose('heap', { scale: 0.9, dur: 0.15, times: 2 }), A.effect('dust', { dur: 1 }), A.say('Crunch crunch!', 1.2))] }).done();
  }),
  // A towable wood chipper 2.6 m tall: an orange body on two wheels with a tow bar, a wide feed hopper at the back,
  // the engine housing, and a curved discharge chute up top; it roars and spits chips.
  e('wood chipper', 'garden', 'garden tools', () => {
    const b = m('wood chipper', { view: 'side', edge: 'sharp' })
      .box([1.1, 0.25, 2.3], [0, 0.55, 0], { color: '#3a3633' })
      .box([1.0, 0.95, 1.1], [0, 1.15, -0.1], { color: '#f0782a', round: 0.15 })
      .box([1.0, 0.65, 1.0], [0, 1.0, -1.05], { color: '#f0782a', rot: [-25, 0, 0], round: 0.1 })
      .box([0.75, 0.45, 0.05], [0, 0.85, -1.5], { color: '#2a2726', rot: [-25, 0, 0] })
      .box([0.8, 0.6, 0.7], [0, 1.0, 0.75], { color: '#5c6166', round: 0.15 })
      .box([0.3, 0.2, 0.3], [0.25, 1.4, 0.75], { color: '#2a2726' })
      .rod([0, 1.55, 0.0], [0, 2.3, 0.35], 0.28, '#f0782a')
      .box([0.32, 0.22, 0.45], [0, 2.38, 0.6], { color: '#f0782a', round: 0.3, rot: [-15, 0, 0] })
      .stick([0.3, 1.3, 0.85], [0.3, 1.65, 0.85], 0.07, '#2a2726')
      .rod([0, 0.5, 1.1], [0, 0.42, 1.9], 0.09, '#3a3633')
      .torus([0.12, 0.12, 0.03], [0, 0.42, 1.95], { color: '#5c6166', rot: [0, 90, 0] })
      .label('CHIPPER', [0.6, 0.18], [0.51, 1.3, -0.1], { color: '#f0782a', rot: [0, 90, 0], depth: 0.01 });
    axle2(b, '', 0.62, 0.2, 1.3, -0.15);
    b.pair((s) => b.arc([0.75, 0.7, 0.25], [s * 0.65, 0.31, -0.15], { color: '#3a3633', arc: 160, rot: [0, 90, 0], tube: 0.08 }));
    return b.act({ click: [A.par(A.anim('shake'), A.effect('smoke', { dur: 1.5 }), A.effect('dust', { dur: 2 }), A.say('RRRRRGH!', 1.8))] }).done();
  }),
  // A wooden poultry cage 1.5 m tall: a slatted box on a frame with a door at the front and straw inside; a
  // rooster lives in it and crows when the door opens.
  e('wooden cage', 'pets', 'cages', () => {
    const b = m('wooden cage', { edge: 'sharp' }).box([1.2, 0.1, 0.9], [0, 0.05, 0], { color: 'wood' }).box([1.2, 0.1, 0.9], [0, 1.45, 0], { color: 'wood' })
      .box([1.1, 0.04, 0.8], [0, 0.12, 0], { color: '#e8c860' });
    for (const [x0, z] of [[0.56, 0.41], [-0.56, 0.41], [0.56, -0.41], [-0.56, -0.41]]) b.box([0.08, 1.4, 0.08], [x0, 0.75, z], { color: '#7a5230' });
    b.box([0.5, 1.28, 0.04], [0.22, 0.75, 0.43], { color: 'wood', name: 'door', pivot: [0.47, 0.75, 0.43], mover: { kind: 'swing', axis: 'y', amount: 100 } });
    b.each(3, (i) => b.box([0.03, 1.2, 0.05], [0.04 + i * 0.16, 0.75, 0.45], { color: '#9a6a3a', parent: 'door' }));
    b.each(3, (i) => b.stick([-0.52 + i * 0.16, 0.1, 0.42], [-0.52 + i * 0.16, 1.4, 0.42], 0.04, 'wood'));
    b.pair((s) => b.each(3, (i) => b.stick([s * 0.58, 0.1, -0.2 + i * 0.2], [s * 0.58, 1.4, -0.2 + i * 0.2], 0.04, 'wood')));
    b.each(5, (i) => b.stick([-0.48 + i * 0.24, 0.1, -0.43], [-0.48 + i * 0.24, 1.4, -0.43], 0.04, 'wood'));
    return b
      .socket('inside', [0, 0.14, 0], 'inside', { size: 0.8 })
      .act({
        setup: [A.spawn('bird', 'rooster'), A.attach('bird', 'self', 'inside')],
        click: [A.operate('door', 'open'), A.par(A.anim('hop', 1, 'self.inside'), A.say('Cock-a-doodle-doo!', 1.6, 'self.inside')), A.wait(1.2), A.operate('door', 'close')],
      })
      .done();
  }),
  // A five-bar wooden field gate 1.1 m tall between two capped posts, with a diagonal brace and an iron latch; it
  // swings open.
  e('wooden gate', 'garden', 'fences', () => {
    const b = m('wooden gate', { edge: 'sharp' })
      .box([0.1, 1.1, 0.06], [-0.68, 0.65, 0], { color: '#d8b07a', name: 'door', pivot: [-0.76, 0.65, 0], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.1, 1.1, 0.06], [0.68, 0.65, 0], { color: '#d8b07a', parent: 'door' })
      .rod([-0.64, 0.2, 0.035], [0.64, 1.1, 0.035], 0.07, '#d8b07a', { parent: 'door' })
      .box([0.08, 0.1, 0.06], [0.79, 0.95, 0.03], { color: 'iron' });
    b.each(5, (i) => b.box([1.46, 0.09, 0.05], [0, 0.17 + i * 0.235, 0], { color: '#d8b07a', parent: 'door' }));
    b.pair((s) => b.box([0.16, 1.5, 0.16], [s * 0.85, 0.75, 0], { color: '#7a5230' }).pyramid([0.25, 0.12, 0.25], [s * 0.85, 1.56, 0], 4, { color: '#7a5230' }));
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creeeak!', 1.2)], [A.operate('door', 'close'), A.say('Clack!', 1)]] }).done();
  }),
  // A wooden spoon standing in a little stoneware crock; it lifts out and taps the rim.
  e('wooden spoon', 'kitchen', 'utensils', () =>
    m('wooden spoon')
      .cyl([0.1, 0.12, 0.1], [0, 0.06, 0], { color: '#d9cdb4', taper: 0.9 })
      .cyl([0.085, 0.01, 0.085], [0, 0.12, 0], { color: '#3a3633', noInk: true })
      .stick([0, 0.05, 0], [0, 0.27, 0], 0.018, 'lightwood', { name: 'spoon', piece: true })
      .ball([0.06, 0.085, 0.025], [0, 0.31, 0], { color: 'lightwood', parent: 'spoon' })
      .ball([0.045, 0.062, 0.006], [0, 0.312, 0.011], { color: 'wood', parent: 'spoon', noInk: true })
      .act({ click: [A.pose('spoon', { move: [0, 0.08, 0], rot: [0, 0, 20], dur: 0.3 }), A.pose('spoon', { move: [0, 0.06, 0], rot: [0, 0, 35], dur: 0.12, times: 2 }), A.par(A.pose('spoon', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.say('Tap tap!', 1))] })
      .done(),
  ),
  // A ball of pink wool yarn with two knitting needles through it and a loose end; it rolls away unravelling and
  // back.
  e('wool', 'home', 'fabrics', () => {
    const b = m('wool').ball(0.14, [0, 0.07, 0], { color: '#f4a1c0', name: 'ball', piece: true });
    b.each(4, (i) => b.torus([0.142, 0.142, 0.02], [0, 0.07, 0], { color: '#e87aa8', tube: 0.06, rot: [i * 45, i * 30, 20], noInk: true, parent: 'ball' }));
    return b.rod([0.03, 0.01, 0.06], [0.15, 0.004, 0.12], 0.008, '#f4a1c0')
      .stick([-0.12, 0.03, -0.04], [0.1, 0.17, 0.02], 0.008, 'silver', { parent: 'ball' }).stick([-0.1, 0.17, 0.03], [0.12, 0.04, -0.03], 0.008, 'silver', { parent: 'ball' })
      .ball(0.018, [-0.12, 0.03, -0.04], { color: '#e0473b', parent: 'ball' }).ball(0.018, [-0.1, 0.17, 0.03], { color: '#e0473b', parent: 'ball' })
      .act({ click: [A.pose('ball', { move: [0.4, 0, 0.1], rot: [0, 0, -360], dur: 0.8 }), A.say('Roll roll...', 1.2), A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })] })
      .done();
  }),
  // A sturdy workbench 0.9 m high: a thick wooden top with a vice, a pegboard of tools behind (the hammer comes down
  // to knock), a drawer that slides out and a toolbox on the shelf below.
  e('workbench', 'workshop', 'workshop furniture', () => {
    const b = m('workbench', { edge: 'sharp' })
      .box([1.8, 0.08, 0.75], [0, 0.88, 0], { color: '#b5814e' })
      .box([1.7, 0.04, 0.65], [0, 0.22, 0], { color: '#9a6a3a' })
      .box([1.8, 0.8, 0.03], [0, 1.32, -0.36], { color: '#c8a878' })
      .box([0.5, 0.12, 0.6], [0.5, 0.77, 0.05], { color: '#9a6a3a', name: 'drawer', mover: { kind: 'slide', axis: 'z', amount: 0.35 } })
      .box([0.12, 0.03, 0.02], [0.5, 0.77, 0.36], { color: 'silver', parent: 'drawer' })
      .stick([-0.2, 1.4, -0.33], [-0.15, 1.12, -0.33], 0.03, 'silver')
      .box([0.3, 0.12, 0.02], [0.25, 1.42, -0.33], { color: '#8f99a3' }).box([0.1, 0.05, 0.03], [0.43, 1.42, -0.33], { color: '#e0473b' })
      .box([0.14, 0.22, 0.05], [-0.62, 1.22, -0.32], { color: '#f6d24a' })
      .stick([-0.5, 1.5, -0.32], [-0.5, 1.18, -0.32], 0.025, 'wood', { name: 'hammer', pivot: [-0.5, 1.5, -0.32] })
      .box([0.12, 0.05, 0.05], [-0.5, 1.52, -0.3], { color: '#55595e', parent: 'hammer' })
      .box([0.16, 0.1, 0.18], [0.72, 0.97, 0.22], { color: '#2f6fc0' })
      .box([0.16, 0.06, 0.03], [0.72, 1.04, 0.32], { color: '#5c6166' })
      .box([0.45, 0.2, 0.22], [-0.4, 0.34, 0.05], { color: '#d23a2a', round: 0.2 })
      .socket('top', [-0.2, 0.93, 0.15], 'top', { size: 0.6 });
    for (const [x0, z] of [[0.84, 0.33], [-0.84, 0.33], [0.84, -0.33], [-0.84, -0.33]]) b.box([0.08, 0.84, 0.08], [x0, 0.42, z], { color: '#7a5230' });
    return b
      .act({
        click: [
          [A.operate('drawer', 'out'), A.say('Rattle!', 1), A.wait(1.5), A.operate('drawer', 'in')],
          [A.pose('hammer', { rot: [70, 0, 0], dur: 0.15, times: 2 }), A.say('Bang bang!', 1.2)],
        ],
      })
      .done();
  }),
  // A chocolate bar half out of its red paper wrapper and silver foil: the wrapper peels back.
  e('wrapper', 'food', 'sweets', () =>
    m('wrapper')
      .box([0.08, 0.14, 0.015], [0, 0.07, 0], { color: '#d23a2a', round: 0.2 })
      .box([0.082, 0.03, 0.017], [0, 0.155, 0], { color: 'silver', round: 0.3 })
      .box([0.07, 0.03, 0.012], [0, 0.18, 0], { color: 'chocolate', round: 0.2 })
      .box([0.002, 0.03, 0.013], [0, 0.18, 0], { color: '#3a2010', noInk: true })
      .box([0.08, 0.05, 0.004], [0, 0.17, 0.009], { color: '#d23a2a', round: 0.2, name: 'peel', pivot: [0, 0.145, 0.009] })
      .label('CHOCO', [0.065, 0.03], [0, 0.08, 0.008], { color: '#f6d24a', depth: 0.003 })
      .act({ click: [[A.pose('peel', { rot: [70, 0, 0], dur: 0.3 }), A.say('Crinkle!', 1)], [A.pose('peel', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // Rolls of gift wrap, red and green with gold stars, beside a wrapped present whose lid pops up.
  e('wrapping paper', 'toys', 'party things', () => {
    const b = m('wrapping paper').cyl([0.08, 0.5, 0.08], [-0.06, 0.25, 0], { color: '#d23a2a' })
      .cyl([0.08, 0.45, 0.08], [0.04, 0.225, -0.08], { color: '#3f8a4a' })
      .box([0.14, 0.09, 0.14], [0.1, 0.045, 0.12], { color: '#4e8fd6', edge: 'sharp' })
      .box([0.146, 0.03, 0.146], [0.1, 0.1, 0.12], { color: '#4e8fd6', name: 'lid', piece: true, edge: 'sharp' })
      .box([0.148, 0.032, 0.03], [0.1, 0.1, 0.12], { color: 'gold', parent: 'lid' }).box([0.03, 0.032, 0.148], [0.1, 0.1, 0.12], { color: 'gold', parent: 'lid' })
      .box([0.142, 0.09, 0.03], [0.1, 0.045, 0.12], { color: 'gold' }).box([0.03, 0.09, 0.142], [0.1, 0.045, 0.12], { color: 'gold' });
    b.pair((s) => b.ball([0.05, 0.035, 0.03], [0.1 + s * 0.025, 0.13, 0.12], { color: 'gold', rot: [0, 0, s * 25], parent: 'lid' }));
    for (let k = 0; k < 4; k++) for (const [x0, z] of around(3, 0.04, k)) b.ball([0.015, 0.015, 0.004], [-0.06 + x0, 0.07 + k * 0.11, z], { color: 'gold', noInk: true, rot: [0, -Math.atan2(z, x0) / DEG + 90, 0] });
    return b.act({ click: [A.par(A.pose('lid', { move: [0, 0.12, 0], rot: [0, 30, 0], dur: 0.3 }), A.effect('sparkle', { dur: 1.2 }), A.say('Pop!', 1)), A.wait(0.8), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A Christmas wreath on a little easel: fir twigs, red berries, a red bow and a string of lights that twinkle.
  e('wreath', 'toys', 'christmas', () => {
    const b = m('wreath').torus([0.55, 0.55, 0.12], [0, 0.36, 0], { color: '#2e6a38', tube: 0.3 })
      .stick([-0.18, 0, -0.12], [0, 0.6, -0.08], 0.025, '#7a5230').stick([0.18, 0, -0.12], [0, 0.6, -0.08], 0.025, '#7a5230');
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      b.ball([0.1, 0.1, 0.06], [Math.sin(a) * 0.2, 0.36 + Math.cos(a) * 0.2, 0.04], { color: '#3f8a4a' });
    });
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      b.ball(0.035, [Math.sin(a) * 0.22, 0.36 + Math.cos(a) * 0.22, 0.07], { color: '#c0392b' });
    });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      b.ball(0.03, [Math.sin(a) * 0.25, 0.36 + Math.cos(a) * 0.25, 0.06], { color: ['#f6d24a', '#6fd3e8', '#f4a1c0', '#9be34d'][i % 4], glow: true, name: `light${i + 1}`, mover: { kind: 'light', on: false } });
    });
    b.ball(0.05, [0, 0.16, 0.08], { color: '#c0392b' });
    b.pair((s) => b.ball([0.12, 0.08, 0.04], [s * 0.07, 0.17, 0.07], { color: '#c0392b', rot: [0, 0, s * 15] }).rod([s * 0.01, 0.15, 0.08], [s * 0.06, 0.06, 0.08], 0.025, '#c0392b'));
    return b.act({ click: [[A.operate('light', 'on'), A.say('Twinkle!', 1.2)], [A.operate('light', 'off')]] }).done();
  }),
  // (The vocabulary's 1.5 m is the ball; it hangs from its crane.) A crawler crane 14 m tall: tracks, a cab and
  // engine house, a lattice boom, and a 1.2 m steel wrecking ball on its chain that swings and smashes.
  e('wrecking ball', 'workshop', 'construction', () => {
    const Y = '#f2c230';
    const b = m('wrecking ball', { view: 'side', edge: 'sharp' })
      .box([2.6, 0.3, 4.2], [0, 1.05, -0.4], { color: '#3a3633' })
      .box([2.8, 2.0, 3.0], [0, 2.2, -1.0], { color: Y, round: 0.05 })
      .box([1.2, 1.5, 1.3], [0.7, 2.6, 1.0], { color: Y, round: 0.05 })
      .box([1.1, 0.9, 0.05], [0.7, 2.9, 1.66], { color: 'glass' })
      .box([0.05, 0.9, 1.0], [1.31, 2.9, 1.0], { color: 'glass' })
      .box([2.8, 1.0, 1.0], [0, 1.8, -2.9], { color: '#5c6166' })
      .stick([-0.6, 3.2, -1.6], [-0.6, 4.0, -1.6], 0.2, '#2a2726');
    b.pair((s) => b.box([0.7, 0.9, 5.0], [s * 1.25, 0.45, -0.4], { color: '#2a2726', round: 0.4 }).cyl([0.8, 0.72, 0.8], [s * 1.25, 0.45, 1.9], { color: '#55595e', rot: [0, 0, 90] }).cyl([0.8, 0.72, 0.8], [s * 1.25, 0.45, -2.7], { color: '#55595e', rot: [0, 0, 90] }));
    const foot: V = [0, 2.6, 0.2], tip: V = [0, 13.6, 6.6];
    b.pair((s) => b.stick([s * 0.4, foot[1], foot[2]], [s * 0.15, tip[1], tip[2]], 0.12, Y));
    b.each(8, (i) => {
      const k0 = i / 8, k1 = (i + 1) / 8, w0 = 0.4 - 0.25 * k0, w1 = 0.4 - 0.25 * k1;
      const p0: V = [0, foot[1] + (tip[1] - foot[1]) * k0, foot[2] + (tip[2] - foot[2]) * k0], p1: V = [0, foot[1] + (tip[1] - foot[1]) * k1, foot[2] + (tip[2] - foot[2]) * k1];
      b.stick([w0, p0[1], p0[2]], [-w1, p1[1], p1[2]], 0.05, Y);
    });
    b.stick([0, 3.6, -2.5], [0, tip[1], tip[2]], 0.04, '#2a2726')
      .stick([0, tip[1], tip[2]], [0, 4.6, tip[2]], 0.06, '#5c6166', { name: 'chain', pivot: tip })
      .ball(1.2, [0, 4.0, tip[2]], { color: '#3a3f44', parent: 'chain' })
      .socket('seat', [0.7, 2.3, 1.0], 'seat');
    return b.act({ click: [A.pose('chain', { rot: [-25, 0, 0], dur: 0.6 }), A.pose('chain', { rot: [20, 0, 0], dur: 0.5 }), A.par(A.effect('dust', { dur: 1.5 }), A.anim('shake'), A.say('WHAM!', 1.4)), A.pose('chain', { rot: [0, 0, 0], dur: 0.8 })] }).done();
  }),
  // A chrome combination spanner on the hex nut of a bolt through a steel bracket; it cranks the nut round.
  e('wrench', 'workshop', 'hand tools', () => {
    const b = m('wrench', { edge: 'sharp' })
      .box([0.2, 0.02, 0.12], [0, 0.01, 0], { color: '#5c6166' })
      .box([0.2, 0.3, 0.02], [0, 0.16, -0.03], { color: '#8f99a3' })
      .prism([0.04, 0.025, 0.04], [0, 0.2, -0.008], 6, { color: '#9da3a8', rot: [90, 0, 0] })
      .cyl([0.016, 0.04, 0.016], [0, 0.2, 0.0], { color: '#c9ccd1', rot: [90, 0, 0] })
      .box([0.16, 0.026, 0.012], [0.1, 0.2, 0.012], { color: 'silver', round: 0.5, name: 'spanner', pivot: [0, 0.2, 0.012] })
      .torus([0.055, 0.055, 0.012], [0, 0.2, 0.012], { color: 'silver', tube: 0.25, parent: 'spanner' })
      .box([0.045, 0.05, 0.012], [0.2, 0.2, 0.012], { color: 'silver', round: 0.3, parent: 'spanner' });
    b.pair((s) => b.box([0.035, 0.014, 0.012], [0.235, 0.2 + s * 0.017, 0.012], { color: 'silver', round: 0.3, parent: 'spanner' }));
    return b.act({ click: [A.pose('spanner', { rot: [0, 0, 60], dur: 0.4 }), A.say('Crank!', 0.8), A.pose('spanner', { rot: [0, 0, 120], dur: 0.4 }), A.say('Crank!', 0.8), A.pose('spanner', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A red terry sweatband with white stripes; it stretches.
  e('wristband', 'wardrobe', 'accessories', () =>
    m('wristband')
      .torus([0.09, 0.09, 0.06], [0, 0.045, 0], { color: '#d23a2a', tube: 0.25, name: 'band' })
      .torus([0.092, 0.092, 0.01], [0, 0.045, 0.016], { color: 'white', tube: 0.2, noInk: true, parent: 'band' })
      .torus([0.092, 0.092, 0.01], [0, 0.045, -0.016], { color: 'white', tube: 0.2, noInk: true, parent: 'band' })
      .act({ click: [A.par(A.pose('band', { scale: 1.25, dur: 0.2, times: 2 }), A.say('Boing!', 1))] })
      .done(),
  ),
  // A hospital X-ray room in one: a padded table on a pedestal, an X-ray tube on a column and arm above it, and a
  // light box that glows with a picture of a ribcage.
  e('x-ray (machine)', 'clinic', 'hospital machines', () => {
    const b = m('x-ray (machine)', { edge: 'sharp' })
      .box([0.4, 0.72, 0.6], [0, 0.36, 0], { color: '#d4d7da' })
      .box([0.72, 0.1, 2.0], [0, 0.78, 0], { color: 'white', round: 0.3 })
      .box([0.62, 0.05, 1.8], [0, 0.85, 0], { color: '#a8d8f5', round: 0.4, edge: 'soft' })
      .box([0.22, 2.1, 0.22], [-0.7, 1.05, -0.5], { color: '#9da3a8' })
      .box([0.8, 0.16, 0.16], [-0.35, 1.95, -0.5], { color: '#9da3a8' })
      .box([0.36, 0.28, 0.32], [0, 1.75, -0.5], { color: 'white', round: 0.3, name: 'tube', mover: { kind: 'slide', axis: 'y', amount: -0.35 } })
      .box([0.24, 0.14, 0.24], [0, 1.55, -0.5], { color: '#5c6166', parent: 'tube' })
      .cyl([0.12, 0.01, 0.12], [0.185, 1.77, -0.5], { color: '#f6d24a', rot: [0, 0, 90], parent: 'tube' })
      .stick([0.8, 0, -1.0], [0.8, 1.15, -1.0], 0.05, '#9da3a8')
      .box([0.56, 0.46, 0.05], [0.8, 1.4, -1.0], { color: '#2a2726' })
      .box([0.5, 0.4, 0.02], [0.8, 1.4, -0.97], { color: '#cfe8ff', glow: true, name: 'viewer', mover: { kind: 'light', on: false } })
      .stick([0.8, 1.56, -0.955], [0.8, 1.26, -0.955], 0.03, 'white', { noInk: true });
    b.each(4, (i) => b.ball([0.24 - i * 0.02, 0.025, 0.01], [0.8, 1.52 - i * 0.07, -0.955], { color: 'white', noInk: true }));
    return b.act({ click: [A.operate('tube', 'down'), A.par(A.say('Whirr... BZZT!', 1.8), A.effect('sparkle', { dur: 0.8 })), A.operate('viewer', 'on'), A.wait(1.5), A.par(A.operate('tube', 'up'), A.operate('viewer', 'off'))] }).done();
  }),
  // A xylophone on a stand at 0.7 m: eight rainbow bars from long to short and two mallets that play a run.
  e('xylophone', 'music', 'percussion', () => {
    const b = m('xylophone', { edge: 'sharp' });
    b.pair((s) => b.box([0.74, 0.07, 0.07], [0, 0.6, s * 0.13], { color: '#7a5230' }).stick([0.33, 0.58, s * 0.12], [0.36, 0, s * 0.18], 0.035, '#7a5230').stick([-0.33, 0.58, s * 0.12], [-0.36, 0, s * 0.18], 0.035, '#7a5230'));
    ['#e0473b', '#f0923b', '#f6d24a', '#9be34d', '#5aa553', '#a8d8f5', '#4e8fd6', '#8a5fc4'].forEach((c, i) => b.box([0.07, 0.03, 0.4 - i * 0.025], [-0.31 + i * 0.088, 0.65, 0], { color: c, round: 0.3 }));
    b.stick([-0.2, 0.7, 0.24], [0.1, 0.72, 0.32], 0.012, 'wood', { name: 'malletA', pivot: [0.1, 0.72, 0.32] }).ball(0.04, [-0.2, 0.7, 0.24], { color: '#e0473b', parent: 'malletA' });
    b.stick([0.05, 0.7, 0.26], [0.35, 0.72, 0.34], 0.012, 'wood', { name: 'malletB', pivot: [0.35, 0.72, 0.34] }).ball(0.04, [0.05, 0.7, 0.26], { color: '#e0473b', parent: 'malletB' });
    return b.act({ click: [A.par(A.pose('malletA', { rot: [0, 0, -15], dur: 0.12, times: 2 }), A.say('Ding-dong-ding!', 1.6)), A.pose('malletB', { rot: [0, 0, -15], dur: 0.12, times: 2 }), A.pose('malletA', { rot: [0, 0, -15], dur: 0.12 })] }).done();
  }),
  // A motor yacht 18 m long: a sleek white hull with a dark stripe and portholes, a swim platform, a cabin with
  // tinted windows, a flybridge under a radar arch whose scanner turns, rails, and navigation lights; it toots.
  e('yacht', 'garage', 'boats', () => {
    const b = m('yacht', { view: 'side', edge: 'sharp' })
      .loft([4.6, 2.6, 17], [0, 1.3, 0.2], [[0, 0.88, 0.85, 0.08], [0.15, 0.97, 0.95, 0.03], [0.6, 1, 1, 0], [0.85, 0.85, 1, 0.02], [1, 0.08, 1, 0.12]], { color: 'white', cut: 'bottom', boxy: 0.35, name: 'hull', edge: 'soft' })
      .loft([4.62, 0.3, 16.6], [0, 0.95, 0.2], [[0, 0.86, 1], [0.6, 1, 1], [0.85, 0.85, 1], [1, 0.1, 1]], { color: '#1e3a5a', boxy: 0.35, noInk: true })
      .box([4.4, 0.08, 15], [0, 2.6, -0.4], { color: '#d8b07a' })
      .box([4.2, 0.3, 1.6], [0, 0.4, -8.6], { color: '#d8b07a' })
      .box([3.6, 1.6, 7.0], [0, 3.4, -1.6], { color: 'white', round: 0.15 })
      .box([3.65, 0.7, 6.4], [0, 3.55, -1.4], { color: '#2a3a4a', round: 0.2 })
      .box([3.0, 1.0, 0.1], [0, 3.6, 1.95], { color: '#2a3a4a', rot: [-25, 0, 0] })
      .box([3.2, 0.3, 4.4], [0, 4.35, -2.2], { color: 'white', round: 0.2 })
      .box([2.6, 0.9, 0.08], [0, 4.9, -0.4], { color: '#2a3a4a', rot: [-20, 0, 0] })
      .box([2.8, 0.12, 2.2], [0, 6.3, -3.0], { color: 'white', round: 0.3 })
      .cyl([0.12, 0.6, 0.12], [0, 6.65, -3.0], { color: '#5c6166' })
      .box([1.4, 0.1, 0.2], [0, 6.98, -3.0], { color: '#2a2726', name: 'rotor' })
      .box([0.4, 0.25, 0.4], [0.6, 6.5, -3.4], { color: 'white', round: 0.4 })
      .ball(0.18, [0, 7.0, -3.6], { color: 'white', glow: true, name: 'mastLight', mover: { kind: 'light', on: false } })
      .label('SEA BREEZE', [2.2, 0.4], [0, 1.9, -8.2], { color: 'white', depth: 0.02 });
    b.pair((s) => {
      b.stick([s * 1.4, 4.4, -0.2], [s * 1.2, 6.3, -2.2], 0.15, 'white').stick([s * 1.4, 4.4, -3.6], [s * 1.2, 6.3, -3.4], 0.15, 'white')
        .stick([s * 2.1, 3.15, -7.0], [s * 1.9, 3.15, 6.0], 0.05, 'silver')
        .ball(0.2, [s * 1.85, 3.0, 2.2], { color: s > 0 ? '#5ad65a' : '#e0473b', glow: true });
      b.each(6, (i) => b.stick([s * (2.05 - (i > 4 ? 0.25 : 0)), 2.6, -6.5 + i * 2.4], [s * (2.05 - (i > 4 ? 0.25 : 0)), 3.15, -6.5 + i * 2.4], 0.04, 'silver'));
      b.each(5, (i) => b.cyl([0.3, 0.06, 0.3], [s * 2.27, 1.7, -5 + i * 1.6], { color: '#2a3a4a', rot: [0, 0, 90] }));
    });
    return b
      .socket('deck', [0, 2.7, 4.0], 'top', { size: 2.5 })
      .act({
        click: [
          [A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Toot tooot!', 1.6))],
          [A.operate('mastLight', 'on'), A.par(A.anim('bounce'), A.say('Splish, splosh!', 1.4)), A.wait(1), A.operate('mastLight', 'off')],
        ],
      })
      .done();
  }),
  // A yam: a long knobbly tuber with a slice cut at one end that comes off to show its orange flesh.
  e('yam', 'food', 'vegetables', () =>
    m('yam')
      .loft([0.075, 0.07, 0.22], [-0.012, 0.036, 0], [[0, 0.2, 0.2], [0.2, 0.85, 0.8], [0.6, 1, 1], [1, 0.85, 0.85]], { color: '#8a3f2e', name: 'body', rot: [0, 90, 0] })
      .ball(0.02, [-0.06, 0.06, 0.02], { color: '#7a3424', parent: 'body' })
      .ball(0.016, [0.02, 0.066, -0.015], { color: '#7a3424', parent: 'body' })
      .cyl([0.06, 0.022, 0.058], [0.111, 0.036, 0], { color: '#f0923b', rot: [0, 0, 90], name: 'slice', parent: 'body', piece: true })
      .cyl([0.064, 0.02, 0.062], [0.111, 0.036, 0], { color: '#8a3f2e', rot: [0, 0, 90], parent: 'slice', noInk: true })
      .act({ click: [[A.detach('slice', 'bit'), A.say('Chop!', 1)], [A.reattach('slice')]] })
      .done(),
  ),
  // A wooden ox yoke 1.3 m: a carved beam with an iron ring and two U-shaped bows for the necks; an ox comes along.
  e('yoke', 'farm', 'farm things', () => {
    const b = m('yoke', { edge: 'sharp' }).box([1.3, 0.13, 0.15], [0, 0.42, 0], { color: '#9a6a3a', round: 0.5 }).torus([0.09, 0.09, 0.02], [0, 0.52, 0.0], { color: 'iron', rot: [0, 90, 0] });
    b.pair((s) => b.arc([0.3, 0.42, 0.04], [s * 0.38, 0.42, 0], { color: '#7a5230', arc: 180, rot: [0, 0, 180], tube: 0.13 }).cyl([0.06, 0.04, 0.06], [s * 0.25, 0.5, 0], { color: 'iron' }).cyl([0.06, 0.04, 0.06], [s * 0.51, 0.5, 0], { color: 'iron' }));
    return b.act({ click: [A.spawn('ox', 'cow', { rel: 'front', of: 'self', dist: 'close' }), A.say('Mooo!', 1.5, 'ox'), A.wait(1.8), A.remove('ox', 'fade')] }).done();
  }),
  // An egg yolk sitting in half of its shell: round, glossy and golden; it wobbles.
  e('yolk', 'food', 'breakfast', () => {
    const b = m('yolk').cyl([0.042, 0.03, 0.042], [0, 0.015, 0], { color: 'cream', taper: 1.5 })
      .ball([0.045, 0.04, 0.045], [0, 0.045, 0], { color: '#ffb020', name: 'yolk', pivot: [0, 0.028, 0] })
      .ball([0.012, 0.008, 0.006], [-0.01, 0.06, 0.016], { color: 'white', noInk: true, parent: 'yolk' });
    for (const [x0, z] of around(6, 0.031)) b.cone([0.014, 0.014, 0.01], [x0, 0.035, z], { color: 'cream', rot: [0, -Math.atan2(z, x0) / DEG, 0] });
    return b.act({ click: [A.par(A.pose('yolk', { scale: 1.12, dur: 0.15, times: 3 }), A.say('Wibble!', 1))] }).done();
  }),
  // A navy zip on its tapes, partly open: the metal teeth and a slider with its pull that zips down and up.
  e('zipper', 'wardrobe', 'sewing', () => {
    const b = m('zipper')
      .box([0.026, 0.02, 0.016], [0, 0.087, 0], { color: 'silver', round: 0.3, name: 'slider', mover: { kind: 'slide', axis: 'y', amount: -0.06 }, edge: 'sharp' })
      .box([0.012, 0.03, 0.004], [0, 0.068, 0.011], { color: 'silver', round: 0.3, parent: 'slider', edge: 'sharp' });
    b.pair((s) => b.box([0.028, 0.085, 0.012], [s * 0.015, 0.0425, 0], { color: 'navy' }).box([0.028, 0.08, 0.012], [s * 0.025, 0.125, 0], { color: 'navy', rot: [0, 0, -s * 10] }));
    b.each(6, (i) => b.box([0.012, 0.006, 0.014], [(i % 2 ? 1 : -1) * 0.003, 0.01 + i * 0.012, 0], { color: 'silver', edge: 'sharp' }));
    for (const k of [0, 1, 2]) b.pair((s) => b.box([0.01, 0.006, 0.014], [s * (0.011 + k * 0.004), 0.105 + k * 0.02, 0], { color: 'silver', rot: [0, 0, -s * 10], edge: 'sharp' }));
    return b.act({ click: [A.par(A.operate('slider', 'out'), A.say('Zzzip!', 1)), A.wait(0.4), A.par(A.operate('slider', 'in'), A.say('Zzzip!', 1))] }).done();
  }),
  // A zoo 30 m across: a stone entrance arch with a ZOO sign and gates that open, a ticket kiosk, fenced enclosures
  // with a grey elephant (who raises her trunk and trumpets) and a giraffe among trees.
  e('zoo', 'places', 'parks', () => {
    const b = m('zoo', { edge: 'sharp' })
      .box([32, 0.2, 24], [0, 0.1, 0], { color: '#6ab04c', round: 0.01 })
      .box([5, 0.06, 12], [0, 0.23, 7], { color: '#c9bfa8' });
    b.pair((s) => b.box([1.4, 5.6, 1.4], [s * 2.6, 2.9, 9], { color: '#a7a19a' }).box([1.7, 0.4, 1.7], [s * 2.6, 5.9, 9], { color: '#8f8c86' }));
    b.box([6.6, 1.3, 1.2], [0, 6.0, 9], { color: '#3f7a3a' }).label('CITY ZOO', [5.4, 1.0], [0, 6.0, 9.64], { color: '#f6d24a', depth: 0.05 });
    b.box([1.9, 2.4, 0.12], [0.95, 1.4, 9], { color: '#2a2726', name: 'gateL', pivot: [1.9, 1.4, 9], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([1.9, 2.4, 0.12], [-0.95, 1.4, 9], { color: '#2a2726', name: 'gateR', pivot: [-1.9, 1.4, 9], mover: { kind: 'swing', axis: 'y', amount: -95 } });
    b.box([2.2, 2.6, 2.0], [-6, 1.5, 10], { color: '#e0473b', round: 0.05 }).box([2.6, 0.3, 2.4], [-6, 2.95, 10], { color: '#f6d24a' }).box([1.2, 0.8, 0.06], [-6, 1.8, 11.02], { color: 'glass' });
    b.each(14, (i) => b.box([0.12, 1.4, 0.12], [-15 + i * 2.3, 0.9, 1], { color: '#7a5230' }));
    b.box([30, 0.1, 0.08], [0, 1.3, 1], { color: '#7a5230' }).box([30, 0.1, 0.08], [0, 0.7, 1], { color: '#7a5230' });
    // the elephant, about 3 m at the shoulder
    b.ball([2.4, 2.2, 3.6], [-7, 2.8, -4], { color: '#9da3a8', edge: 'soft' })
      .ball([1.6, 1.6, 1.5], [-7, 3.6, -1.8], { color: '#9da3a8', edge: 'soft' })
      .pair((s) => b.ball([0.25, 1.3, 1.0], [-7 + s * 0.85, 3.6, -2.1], { color: '#8f959a', edge: 'soft' }))
      .rod([-7, 3.2, -1.2], [-7, 1.4, -0.9], 0.45, '#9da3a8', { name: 'trunk', pivot: [-7, 3.3, -1.3], edge: 'soft' })
      .pair((s) => b.rod([-7 + s * 0.35, 2.9, -1.3], [-7 + s * 0.4, 2.4, -0.7], 0.12, '#f2e8d0'));
    for (const [x0, z] of [[-7.7, -2.8], [-6.3, -2.8], [-7.7, -5.2], [-6.3, -5.2]]) b.cyl([0.65, 1.9, 0.65], [x0, 1.15, z], { color: '#9da3a8', edge: 'soft' });
    // the giraffe, 5 m tall
    b.ball([1.0, 1.1, 2.0], [7, 2.6, -5], { color: '#e8b04a', edge: 'soft' })
      .rod([7, 3.0, -4.3], [7, 4.9, -3.6], 0.35, '#e8b04a', { edge: 'soft' })
      .ball([0.4, 0.4, 0.8], [7, 5.0, -3.3], { color: '#e8b04a', edge: 'soft' });
    for (const [x0, z] of [[6.7, -4.4], [7.3, -4.4], [6.7, -5.6], [7.3, -5.6]]) b.stick([x0, 0.2, z], [x0, 2.3, z], 0.15, '#e8b04a', { edge: 'soft' });
    for (const [x0, y, z] of [[6.75, 2.8, -5.2], [7.25, 2.4, -4.6], [6.9, 3.6, -4.0], [7.15, 4.3, -3.8]] as V[]) b.ball(0.22, [x0, y, z], { color: '#8a5a2b', noInk: true });
    tree(b, [11, 0.2, -6], 6.5);
    tree(b, [-12, 0.2, -8], 7, '#4e9448');
    tree(b, [13, 0.2, 5], 5.5);
    return b
      .act({
        click: [
          [A.par(A.operate('gateL', 'open'), A.operate('gateR', 'open'), A.say('Roar! Squawk! Ook-ook!', 1.8)), A.wait(2.5), A.par(A.operate('gateL', 'close'), A.operate('gateR', 'close'))],
          [A.pose('trunk', { rot: [-110, 0, 0], dur: 0.5 }), A.say('PAWOOO!', 1.6), A.wait(0.6), A.pose('trunk', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A dark green courgette with its pale stripes and stalk, and its yellow flower that opens.
  e('zucchini', 'food', 'vegetables', () =>
    m('zucchini')
      .capsule([0.055, 0.2, 0.055], [-0.02, 0.0275, 0], { color: '#2e6a38', rot: [0, 0, 90] })
      .capsule([0.02, 0.18, 0.04], [-0.02, 0.045, 0.012], { color: '#4a8a3a', rot: [0, 0, 90], noInk: true })
      .cyl([0.02, 0.025, 0.02], [0.095, 0.03, 0], { color: '#8ab84a', rot: [0, 0, 90] })
      .cone([0.05, 0.07, 0.05], [-0.15, 0.03, 0], { color: '#f6c030', rot: [0, 0, 90], name: 'flower', pivot: [-0.12, 0.03, 0] })
      .act({ click: [A.par(A.pose('flower', { scale: 1.5, dur: 0.4 }), A.effect('sparkle', { dur: 1 })), A.wait(0.8), A.pose('flower', { scale: 1, dur: 0.4 })] })
      .done(),
  ),
  // A chocolate éclair on a little plate: a long choux bun glazed with chocolate; squeezed, cream oozes out of the
  // end.
  e('éclair', 'food', 'pastries', () =>
    m('éclair')
      .cyl([0.2, 0.01, 0.12], [0, 0.005, 0], { color: 'white' })
      .capsule([0.04, 0.15, 0.035], [0, 0.03, 0], { color: '#d9a050', rot: [0, 0, 90], name: 'bun' })
      .capsule([0.034, 0.14, 0.02], [0, 0.044, 0], { color: 'chocolate', rot: [0, 0, 90], parent: 'bun' })
      .ball([0.03, 0.026, 0.03], [0.085, 0.03, 0], { color: 'cream', name: 'cream', scale: 0 })
      .act({ click: [A.par(A.pose('bun', { scale: 0.92, dur: 0.2 }), A.pose('cream', { scale: 1, dur: 0.3 }), A.say('Squish!', 1)), A.wait(0.8), A.par(A.pose('bun', { scale: 1, dur: 0.2 }), A.pose('cream', { scale: 0, dur: 0.3 }))] })
      .done(),
  ),
];

