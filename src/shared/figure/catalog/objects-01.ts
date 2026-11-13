/** Catalog chunk objects-01: the words in assign/objects-01.tsv. Everything at its real size next to a 1.7 m
 *  person; crisp edges for made things, soft for organic ones; named movers, pieces and sockets; an act each. */
import { e, type CatalogEntry } from './types';
import { A, around, col, m, withAct, type M, type PartOpts } from '../dsl';
import { face, hat, held, wear, who } from '../accessories';
import type { Vec3 } from '../types';

/* ---------- local helpers ---------- */

const RAD = 180 / Math.PI;
const RAINBOW = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
/** Tinted vehicle glass and lit/unlit building windows. */
const GL = '#33475c';
const WIN = '#8fc3e0';

/** A cone with its base at a and its tip at t (thorns, tines, flukes, teeth, leaves). */
function spike(b: M, a: Vec3, t: Vec3, w: number, color: string, o: PartOpts = {}): M {
  const d = [t[0] - a[0], t[1] - a[1], t[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const rx = Math.atan2(d[2] / len, d[1] / len) * RAD, rz = -Math.asin(Math.max(-1, Math.min(1, d[0] / len))) * RAD;
  return b.cone([w, len, w], [(a[0] + t[0]) / 2, (a[1] + t[1]) / 2, (a[2] + t[2]) / 2], { ...o, color, rot: [rx, 0, rz] });
}

/** A road wheel on an axle along x: a soft tyre that rolls (name it wheel*) with a crisp hub riding on it. */
function tyre(b: M, name: string, at: Vec3, dia: number, w: number, o: { hub?: string; tire?: string; parent?: string; hubK?: number } = {}): M {
  b.cyl([dia, w, dia], at, { color: o.tire ?? 'rubber', rot: [0, 0, 90], name, edge: 'soft', parent: o.parent });
  b.cyl([dia * (o.hubK ?? 0.55), w * 1.06, dia * (o.hubK ?? 0.55)], at, { color: o.hub ?? 'silver', rot: [0, 0, 90], parent: name, edge: 'sharp' });
  return b.cyl([dia * 0.16, w * 1.12, dia * 0.16], at, { color: 'darkgray', rot: [0, 0, 90], parent: name, edge: 'sharp' });
}

/** A tapered, swept wing (or tailplane) from a root point outward along s·x: a flat loft. */
function wing(b: M, root: Vec3, s: 1 | -1, span: number, chord: number, tip: number, thick: number, sweep: number, color: string, o: PartOpts = {}): M {
  const a = sweep / RAD;
  const c: Vec3 = [root[0] + (s * Math.cos(a) * span) / 2, root[1], root[2] - (Math.sin(a) * span) / 2];
  return b.loft([chord, thick, span], c, [[0, 1, 1, 0], [0.85, (tip / chord) * 1.1, 0.6, 0], [1, tip / chord, 0.45, 0]], { color, boxy: 0.75, rot: [0, s * (90 + sweep), 0], edge: 'sharp', ...o });
}

/** A swept fin standing up from a root point (tail fins, keels, sails' edges). */
function fin(b: M, root: Vec3, h: number, chord: number, tip: number, thick: number, sweep: number, color: string, o: PartOpts = {}): M {
  const a = sweep / RAD;
  const c: Vec3 = [root[0], root[1] + (Math.cos(a) * h) / 2, root[2] - (Math.sin(a) * h) / 2];
  return b.loft([thick, chord, h], c, [[0, 1, 1, 0], [1, 0.55, tip / chord, 0]], { color, boxy: 0.75, rot: [-(90 + sweep), 0, 0], edge: 'sharp', ...o });
}

/** A window on a wall facing +z: glass pane, frame, sill and a mullion cross; `lit` makes it a light mover. */
function win(b: M, at: Vec3, w: number, h: number, o: { frame?: string; glass?: string; name?: string; cross?: boolean; side?: 1 | -1; parent?: string } = {}): M {
  const f = o.frame ?? 'white';
  const g = o.glass ?? WIN;
  if (o.side) {
    // on a side wall facing s·x
    const s = o.side;
    b.box([0.06, h, w], at, { color: g, name: o.name, parent: o.parent, edge: 'sharp', round: 0.05, ...(o.name ? { mover: { kind: 'light' as const } } : {}) });
    b.box([0.08, h + 0.12, 0.06], [at[0] + s * 0.02, at[1], at[2] + w / 2], { color: f, edge: 'sharp', parent: o.parent });
    b.box([0.08, h + 0.12, 0.06], [at[0] + s * 0.02, at[1], at[2] - w / 2], { color: f, edge: 'sharp', parent: o.parent });
    b.box([0.08, 0.06, w], [at[0] + s * 0.02, at[1] + h / 2, at[2]], { color: f, edge: 'sharp', parent: o.parent });
    b.box([0.14, 0.07, w + 0.16], [at[0] + s * 0.05, at[1] - h / 2 - 0.03, at[2]], { color: f, edge: 'sharp', parent: o.parent });
    if (o.cross !== false) b.box([0.07, h, 0.04], [at[0] + s * 0.02, at[1], at[2]], { color: f, edge: 'sharp', parent: o.parent });
    return b;
  }
  b.box([w, h, 0.06], at, { color: g, name: o.name, parent: o.parent, edge: 'sharp', round: 0.05, ...(o.name ? { mover: { kind: 'light' as const } } : {}) });
  b.box([0.06, h + 0.12, 0.08], [at[0] - w / 2, at[1], at[2] + 0.02], { color: f, edge: 'sharp', parent: o.parent });
  b.box([0.06, h + 0.12, 0.08], [at[0] + w / 2, at[1], at[2] + 0.02], { color: f, edge: 'sharp', parent: o.parent });
  b.box([w, 0.06, 0.08], [at[0], at[1] + h / 2, at[2] + 0.02], { color: f, edge: 'sharp', parent: o.parent });
  b.box([w + 0.16, 0.07, 0.14], [at[0], at[1] - h / 2 - 0.03, at[2] + 0.05], { color: f, edge: 'sharp', parent: o.parent });
  if (o.cross !== false) {
    b.box([0.04, h, 0.07], [at[0], at[1], at[2] + 0.02], { color: f, edge: 'sharp', parent: o.parent });
    b.box([w, 0.04, 0.07], [at[0], at[1] + h * 0.1, at[2] + 0.02], { color: f, edge: 'sharp', parent: o.parent });
  }
  return b;
}

/** A door in a wall facing +z, hinged on its left (viewer's left, -x) edge: swings out toward the viewer. */
function door(b: M, at: Vec3, w: number, h: number, o: { color?: string; frame?: string; name?: string; glass?: boolean; knob?: string; side?: 1 | -1; amount?: number } = {}): M {
  const nm = o.name ?? 'door';
  const s = o.side ?? 1; // hinge on -x (1) or +x (-1)
  const c = o.color ?? 'darkwood';
  b.box([w, h, 0.07], [at[0], at[1] + h / 2, at[2] + 0.02], { color: c, name: nm, pivot: [at[0] - (s * w) / 2, at[1] + h / 2, at[2] + 0.02], mover: { kind: 'swing', axis: 'y', amount: o.amount ?? s * -95 }, edge: 'sharp', round: 0.08 });
  if (o.glass) b.box([w * 0.6, h * 0.35, 0.02], [at[0], at[1] + h * 0.7, at[2] + 0.06], { color: WIN, parent: nm, edge: 'sharp' });
  else b.box([w * 0.7, h * 0.3, 0.02], [at[0], at[1] + h * 0.7, at[2] + 0.06], { color: c, parent: nm, edge: 'sharp', round: 0.3 });
  b.box([w * 0.7, h * 0.3, 0.02], [at[0], at[1] + h * 0.28, at[2] + 0.06], { color: c, parent: nm, edge: 'sharp', round: 0.3 });
  b.ball(0.07, [at[0] + (s * w) * 0.38, at[1] + 1.0, at[2] + 0.09], { color: o.knob ?? 'brass', parent: nm });
  const f = o.frame ?? 'white';
  b.box([0.1, h + 0.1, 0.1], [at[0] - w / 2 - 0.05, at[1] + h / 2, at[2]], { color: f, edge: 'sharp' })
    .box([0.1, h + 0.1, 0.1], [at[0] + w / 2 + 0.05, at[1] + h / 2, at[2]], { color: f, edge: 'sharp' })
    .box([w + 0.3, 0.12, 0.12], [at[0], at[1] + h + 0.06, at[2]], { color: f, edge: 'sharp' });
  return b;
}

/**
 * A building: plinth, walls (storeys of 3 m), a door that opens, framed windows on every storey (those named
 * light1.. light up), a gable, hip or flat roof, a cornice and a sign over the door.
 */
function bldg(key: string, o: { w: number; d: number; floors?: number; storey?: number; wall?: string; trim?: string; roof?: string; roofKind?: 'gable' | 'flat' | 'hip' | 'none'; doorColor?: string; cols?: number; sign?: string; signColor?: string; signText?: string; shopWindow?: boolean; lights?: boolean; glassDoor?: boolean }): M {
  const st = o.storey ?? 3, n = o.floors ?? 1, H = st * n, w = o.w, d = o.d;
  const wall = o.wall ?? 'cream', trim = o.trim ?? 'white';
  const b = m(key, { edge: 'sharp' })
    .box([w + 0.3, 0.3, d + 0.3], [0, 0.15, 0], { color: 'stone', round: 0.1 })
    .box([w, H, d], [0, 0.3 + H / 2, 0], { color: wall, round: 0.02, name: 'walls' });
  const top = 0.3 + H;
  b.box([w + 0.3, 0.25, d + 0.3], [0, top + 0.12, 0], { color: trim, round: 0.1 });
  const rk = o.roofKind ?? 'gable';
  if (rk === 'gable') {
    // two roof planes overhanging the walls, wall-coloured gable ends and a ridge cap
    const W = w + 0.8, R = Math.min(w, 8) * 0.42, a = Math.atan2(R, W / 2), L = Math.hypot(W / 2, R) + 0.1, Rg = R * (w / W);
    b.pair((s) => b.box([L, 0.2, d + 0.6], [(s * W) / 4, top + 0.25 + R / 2, 0], { color: o.roof ?? 'darkred', rot: [0, 0, -s * a * RAD], round: 0.1 }));
    b.pair((s) => b.wedge([w, Rg, 0.1], [0, top + 0.25 + Rg / 2, s * (d / 2 - 0.05)], { color: wall }));
    b.box([0.3, 0.22, d + 0.7], [0, top + 0.27 + R, 0], { color: o.roof ?? 'darkred', round: 0.3 });
  }
  if (rk === 'hip') b.pyramid([w * 1.2, Math.min(w, d) * 0.45, d * 1.2], [0, top + 0.25 + Math.min(w, d) * 0.225, 0], 4, { color: o.roof ?? 'darkgray', rot: [0, 45, 0] });
  if (rk === 'flat') b.box([w + 0.1, 0.5, d + 0.1], [0, top + 0.5, 0], { color: o.roof ?? 'darkgray', round: 0.05 });
  const cols = o.cols ?? Math.max(2, Math.floor(w / 2.2));
  const fz = d / 2 + 0.02;
  // ground floor: a door in the middle and windows (or a shop window) either side
  door(b, [0, 0.3, fz], 1.1, 2.15, { color: o.doorColor ?? 'darkwood', frame: trim, glass: o.glassDoor });
  b.box([1.6, 0.15, 0.6], [0, 0.22, fz + 0.3], { color: 'stone', round: 0.1 });
  let li = 1;
  if (o.shopWindow) b.pair((s) => win(b, [s * (w / 4 + 0.45), 1.55, fz], w / 2 - 1.9, 1.8, { frame: trim, cross: false, name: o.lights ? `light${li++}` : undefined }));
  else
    for (let c = 0; c < cols; c++) {
      const xx = -w / 2 + (w / cols) * (c + 0.5);
      if (Math.abs(xx) < 1.0) continue;
      win(b, [xx, 1.75, fz], 1.0, 1.3, { frame: trim, name: o.lights ? `light${li++}` : undefined });
    }
  for (let f = 1; f < n; f++)
    for (let c = 0; c < cols; c++) win(b, [-w / 2 + (w / cols) * (c + 0.5), 0.3 + f * st + 1.45, fz], 1.0, 1.4, { frame: trim, name: o.lights ? `light${li++}` : undefined });
  if (o.sign) b.label(o.sign, [Math.min(w * 0.8, o.sign.length * 0.5 + 0.6), 0.6], [0, 0.3 + Math.min(st, 3) - 0.35 + (n > 1 ? 0 : 0), fz + 0.08], { color: o.signColor ?? 'navy', edge: 'sharp' });
  return b;
}

/** A sturdy person-height dress form (mannequin) to show a garment on: torso spans y 1.0..1.5, hips at 0.95. */
function mannequin(key: string, wood = 'darkwood'): M {
  return m(key)
    .cyl([0.42, 0.04, 0.42], [0, 0.02, 0], { color: wood, edge: 'sharp' })
    .stick([0, 0.04, 0], [0, 0.95, 0], 0.035, wood)
    .ball([0.34, 0.24, 0.24], [0, 1.0, 0], { color: 'beige' })
    .box([0.36, 0.5, 0.22], [0, 1.25, 0], { color: 'beige', round: 0.9 })
    .cyl([0.1, 0.12, 0.1], [0, 1.55, 0], { color: 'beige' })
    .ball([0.12, 0.06, 0.12], [0, 1.63, 0], { color: wood });
}

/** A tree at its real height: a tapering trunk with two limbs, a lumpy crown (the swaying 'top'), fruit on it. */
function tree2(key: string, h: number, o: { trunk?: string; crown?: string; crown2?: string; fruit?: string; fruitSize?: number; tall?: boolean; marks?: string; n?: number; w?: number; tk?: number } = {}): M {
  const b = m(key);
  const tw = h * (o.tk ?? 0.06);
  const cw = (o.w ?? (o.tall ? 0.45 : 0.75)) * h, ch = o.tall ? h * 0.66 : h * 0.55, cy = h - ch / 2;
  b.cyl([tw * 1.5, h * 0.62, tw * 1.5], [0, h * 0.31, 0], { color: o.trunk ?? 'bark', taper: 0.65, name: 'trunk' });
  b.pair((s) => b.rod([0, h * 0.5, 0], [s * cw * 0.22, h * 0.68, cw * 0.05], tw * 0.6, o.trunk ?? 'bark'));
  if (o.marks) b.each(7, (i) => { const y = h * (0.06 + i * 0.07); b.box([tw * 0.4, tw * 0.1, 0.02], [(i % 2 ? 1 : -1) * tw * 0.12, y, tw * 0.75 * (1 - 0.35 * (y / (h * 0.62))) - 0.004], { color: o.marks, noInk: true, round: 0.5 }); });
  b.ball([cw * 0.8, ch * 0.8, cw * 0.8], [0, cy + ch * 0.08, 0], { color: o.crown ?? 'leaf', name: 'top' });
  const c2 = o.crown2 ?? o.crown ?? 'leaf';
  around(5, cw * 0.3, 0.4).forEach(([x, z], i) => b.ball([cw * 0.5, ch * 0.5, cw * 0.5], [x, cy - ch * 0.12 + (i % 2) * ch * 0.12, z], { color: i % 2 ? c2 : o.crown ?? 'leaf', parent: 'top' }));
  if (o.fruit) {
    const fs = o.fruitSize ?? 0.08;
    const n = o.n ?? 10;
    b.each(n, (i) => {
      const a = -1.3 + (2.6 * i) / (n - 1);
      const y = cy - ch * 0.25 + (i % 3) * ch * 0.15;
      const r = cw * 0.5 * Math.sqrt(Math.max(0.25, 1 - ((y - cy) / (ch * 0.55)) ** 2));
      b.ball([fs, fs * 1.05, fs], [Math.sin(a) * r, y, Math.cos(a) * r], { color: o.fruit!, parent: 'top', name: i === 0 ? 'fruit' : undefined, piece: i === 0 });
    });
  }
  return b;
}

/** A plate at table height for food to sit on. */
function plate(b: M, d = 0.26, color = 'white'): M {
  return b.cyl([d, 0.012, d], [0, 0.006, 0], { color, edge: 'sharp' }).cyl([d * 0.7, 0.016, d * 0.7], [0, 0.012, 0], { color, edge: 'soft' });
}

/** A long flat leaf from a to t (palm and banana fronds). */
function leaf(b: M, a: Vec3, t: Vec3, w: number, color: string, parent?: string): M {
  const d = [t[0] - a[0], t[1] - a[1], t[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const rx = Math.atan2(d[2] / len, d[1] / len) * RAD, rz = -Math.asin(Math.max(-1, Math.min(1, d[0] / len))) * RAD;
  return b.ball([w, len, w * 0.15], [(a[0] + t[0]) / 2, (a[1] + t[1]) / 2, (a[2] + t[2]) / 2], { color, rot: [rx, 0, rz], parent });
}

/* ---------- entries ---------- */

export const ENTRIES: CatalogEntry[] = [
  // A school abacus: a crisp wooden frame on feet, brass rods, and rows of beads that slide along them.
  e('abacus', 'study', 'math tools', () => {
    const b = m('abacus', { edge: 'sharp' })
      .box([0.34, 0.022, 0.06], [0, 0.04, 0], { color: 'darkwood', round: 0.2 })
      .box([0.34, 0.022, 0.06], [0, 0.26, 0], { color: 'darkwood', round: 0.2 })
      .label('1 2 3', [0.12, 0.018], [0, 0.26, 0.031], { color: 'cream', depth: 0.003 });
    b.pair((s) => b.box([0.022, 0.25, 0.06], [s * 0.16, 0.15, 0], { color: 'darkwood', round: 0.2 }).box([0.04, 0.03, 0.12], [s * 0.16, 0.015, 0], { color: 'darkwood', round: 0.3 }));
    b.each(5, (i) => {
      const y = 0.08 + i * 0.036;
      b.stick([-0.15, y, 0], [0.15, y, 0], 0.004, 'brass');
      const n = 6 + (i % 3);
      b.each(n, (k) => b.ball([0.019, 0.028, 0.028], [-0.139 + k * 0.02, y, 0], { color: RAINBOW[i], edge: 'soft', name: k === 0 ? `row${i}` : undefined, parent: k ? `row${i}` : undefined, mover: k ? undefined : { kind: 'slide', axis: 'x', amount: 0.29 - n * 0.02 } }));
    });
    return b
      .act({ click: [[A.operate('row0', 'out'), A.wait(0.3), A.operate('row2', 'out'), A.wait(0.3), A.operate('row4', 'out'), A.say('Click clack!', 1.5)], [A.operate('rows', 'in'), A.say('Clack!', 1)]] })
      .done();
  }),
  // A piano accordion standing on its end: the treble block with its keyboard, pleated bellows, and the bass block
  // with its buttons, which slides in to squeeze the bellows.
  e('accordion', 'music', 'squeezeboxes', () => {
    const b = m('accordion', { edge: 'sharp' })
      .box([0.1, 0.46, 0.21], [0.16, 0.25, 0], { color: 'red', round: 0.15 })
      .box([0.055, 0.42, 0.03], [0.14, 0.25, 0.115], { color: 'white', round: 0.1 })
      .box([0.1, 0.03, 0.21], [0.16, 0.035, 0], { color: 'silver', round: 0.2 })
      .label('ACCORDION', [0.17, 0.03], [0.211, 0.42, 0], { color: 'gold', rot: [0, 0, 90], depth: 0.003 });
    b.each(9, (i) => b.box([0.032, 0.016, 0.016], [0.127, 0.07 + i * 0.042, 0.135], { color: 'black', round: 0.2 }));
    b.box([0.1, 0.44, 0.21], [-0.16, 0.25, 0], { color: 'red', round: 0.15, name: 'bass', mover: { kind: 'slide', axis: 'x', amount: 0.07 } })
      .box([0.1, 0.03, 0.21], [-0.16, 0.035, 0], { color: 'silver', round: 0.2, parent: 'bass' })
      .box([0.03, 0.3, 0.16], [-0.215, 0.27, 0], { color: 'darkbrown', round: 0.4, parent: 'bass' });
    b.each(12, (i) => b.ball(0.016, [-0.175 + (i % 2) * 0.03, 0.12 + Math.floor(i / 2) * 0.05, 0.11], { color: 'cream', parent: 'bass' }));
    b.each(8, (i) => b.box([0.026, 0.42, 0.2], [-0.095 + i * 0.026, 0.25, 0], { color: i % 2 ? 'white' : 'black', rot: [0, i % 2 ? 14 : -14, 0], round: 0.3, parent: i < 4 ? 'bass' : undefined }));
    b.rod([0.17, 0.48, 0], [-0.17, 0.48, 0], 0.025, 'black');
    return b
      .act({ click: [A.operate('bass', 'out'), A.say('Oom-pah!', 1.2), A.wait(0.5), A.operate('bass', 'in'), A.wait(0.5), A.operate('bass', 'out'), A.say('Oom-pah-pah!', 1.4), A.wait(0.5), A.operate('bass', 'in')] })
      .done();
  }),
  // A conical flask of glowing acid with a cork that pops when it fizzes.
  e('acid', 'study', 'lab chemicals', () =>
    m('acid')
      .cyl([0.13, 0.06, 0.13], [0, 0.031, 0], { color: 'lime', taper: 0.72, glow: true, name: 'liquid' })
      .cyl([0.136, 0.13, 0.136], [0, 0.065, 0], { color: 'glass', taper: 0.28 })
      .cyl([0.04, 0.05, 0.04], [0, 0.15, 0], { color: 'glass' })
      .torus([0.05, 0.05, 0.012], [0, 0.175, 0], { color: 'glass', rot: [90, 0, 0] })
      .cyl([0.036, 0.03, 0.036], [0, 0.186, 0], { color: 'wood', taper: 1.2, name: 'cork', piece: true })
      .ball(0.014, [0.02, 0.07, 0.03], { color: '#d8ffb0', glow: true, noInk: true })
      .ball(0.01, [-0.025, 0.05, 0.035], { color: '#d8ffb0', glow: true, noInk: true })
      .label('ACID', [0.06, 0.03], [0, 0.095, 0.046], { color: 'yellow', rot: [-25, 0, 0], depth: 0.003 })
      .act({
        click: [
          [A.pose('cork', { move: [0, 0.06, 0], dur: 0.15 }), A.par(A.effect('steam', { dur: 2 }), A.say('Fizzzz!', 1.5)), A.wait(1.5), A.pose('cork', { move: [0, 0, 0], dur: 0.3 })],
          [A.par(A.anim('shake'), A.effect('smoke', { dur: 1.5 }), A.say('Hisss!', 1.5))],
        ],
      })
      .done(),
  ),
  // An acorn at its real 3 cm: the nut and its scaly cap, which comes off.
  e('acorn', 'garden', 'nuts and seeds', () =>
    m('acorn')
      .ball([0.02, 0.026, 0.02], [0, 0.013, 0], { color: '#b5793a', name: 'nut' })
      .ball(0.005, [0, 0.0015, 0], { color: '#8c5a2b' })
      .dome([0.023, 0.012, 0.023], [0, 0.021, 0], { color: '#6b4a2a', name: 'cap', parent: 'nut', piece: true })
      .rod([0, 0.025, 0], [0.002, 0.033, 0], 0.003, 'darkbrown', { parent: 'cap' })
      .act({ click: [[A.detach('cap', 'cap')], [A.reattach('cap'), A.anim('hop')]] })
      .done(),
  ),
  // A steel-string guitar on its stand: flat spruce top, round sound hole, bridge, six strings, frets, tuners.
  e('acoustic guitar', 'music', 'strings', () => {
    const b = m('acoustic guitar')
      .cyl([0.39, 0.1, 0.39], [0, 0.3, 0], { color: '#9a5a2e', rot: [90, 0, 0], edge: 'sharp', name: 'body' })
      .cyl([0.29, 0.1, 0.29], [0, 0.57, 0], { color: '#9a5a2e', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.27, 0.2, 0.1], [0, 0.44, 0], { color: '#9a5a2e', edge: 'sharp', round: 0 })
      .cyl([0.38, 0.006, 0.38], [0, 0.3, 0.052], { color: '#e9c48a', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.28, 0.006, 0.28], [0, 0.57, 0.052], { color: '#e9c48a', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.26, 0.2, 0.006], [0, 0.44, 0.052], { color: '#e9c48a', edge: 'sharp', round: 0 })
      .cyl([0.09, 0.008, 0.09], [0, 0.5, 0.054], { color: '#1e1612', rot: [90, 0, 0], edge: 'sharp' })
      .torus([0.11, 0.11, 0.006], [0, 0.5, 0.056], { color: 'darkwood', tube: 0.1 })
      .box([0.13, 0.025, 0.012], [0, 0.26, 0.06], { color: '#2a1a12', edge: 'sharp', round: 0.4 })
      .box([0.055, 0.44, 0.03], [0, 0.84, 0.01], { color: '#7a4a28', edge: 'sharp', round: 0.3 })
      .box([0.05, 0.42, 0.008], [0, 0.85, 0.028], { color: '#2a1a12', edge: 'sharp', round: 0.2 })
      .box([0.085, 0.17, 0.022], [0, 1.14, 0.0], { color: '#2a1a12', rot: [-12, 0, 0], edge: 'sharp', round: 0.4 });
    b.each(8, (i) => b.box([0.05, 0.003, 0.004], [0, 0.66 + i * 0.045, 0.033], { color: 'silver', noInk: true }));
    b.each(6, (i) => b.stick([-0.02 + i * 0.008, 0.26, 0.062], [-0.017 + i * 0.0068, 1.06, 0.035], 0.0025, 'silver', { noInk: true }));
    b.pair((s) => b.each(3, (i) => b.cyl([0.02, 0.025, 0.02], [s * 0.055, 1.09 + i * 0.045, -0.005], { color: 'silver', rot: [0, 0, 90], edge: 'sharp' })));
    // a guitar stand: a cradle and a neck rest on a tripod
    b.box([0.32, 0.03, 0.08], [0, 0.07, 0.03], { color: 'black', edge: 'sharp', round: 0.4 })
      .rod([0, 0.07, -0.02], [0, 0.95, -0.06], 0.022, 'black')
      .arc([0.08, 0.06, 0.03], [0, 0.95, -0.03], { color: 'black', rot: [90, 0, 0] });
    b.pair((s) => b.rod([s * 0.14, 0.07, 0.03], [s * 0.22, 0.01, 0.12], 0.02, 'black').rod([0, 0.08, -0.03], [s * 0.15, 0.01, -0.22], 0.02, 'black'));
    return b
      .act({ click: [[A.par(A.anim('wobble'), A.say('Strum!', 1.5))], [A.par(A.anim('pulse', 2), A.say('Twang twang!', 1.5))]] })
      .done();
  }),
  // An anatomy model of the throat on a stand: jaw, neck and the Adam's apple, which bobs when it swallows.
  e("adam's apple", 'clinic', 'body parts', () =>
    m("adam's apple")
      .cyl([0.2, 0.03, 0.16], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.08, 0], 0.03, 'brass')
      .ball([0.2, 0.06, 0.15], [0, 0.11, -0.01], { color: 'skin2' })
      .cyl([0.11, 0.2, 0.11], [0, 0.2, 0], { color: 'skin2' })
      .ball([0.16, 0.12, 0.17], [0, 0.32, 0.015], { color: 'skin2' })
      .ball([0.07, 0.05, 0.08], [0, 0.28, 0.06], { color: 'skin2' })
      .ball([0.036, 0.046, 0.03], [0, 0.21, 0.052], { color: 'skin3', name: 'apple', piece: true })
      .rod([0.03, 0.14, 0.04], [0.045, 0.28, 0.02], 0.012, '#c98f7a', { noInk: true })
      .rod([-0.03, 0.14, 0.04], [-0.045, 0.28, 0.02], 0.012, '#c98f7a', { noInk: true })
      .act({ click: [[A.pose('apple', { move: [0, -0.025, 0], dur: 0.25 }), A.say('Gulp!', 1.2), A.pose('apple', { move: [0, 0, 0], dur: 0.35 })]] })
      .done(),
  ),
  // A little address book standing up, A-Z tabs down its edge; the front cover swings open on the spine.
  e('address book', 'study', 'books', () => {
    const b = m('address book', { edge: 'sharp' })
      .box([0.15, 0.2, 0.008], [0, 0.1, -0.016], { color: 'maroon', round: 0.2 })
      .box([0.012, 0.2, 0.04], [-0.072, 0.1, 0], { color: 'maroon', round: 0.4 })
      .box([0.142, 0.19, 0.026], [0.003, 0.1, 0], { color: 'paper', round: 0.1 })
      .box([0.15, 0.2, 0.008], [0, 0.1, 0.016], { color: 'maroon', round: 0.2, name: 'cover', pivot: [-0.075, 0.1, 0.016], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .label('ADDRESSES', [0.11, 0.025], [0, 0.15, 0.021], { color: 'gold', parent: 'cover', depth: 0.003 })
      .label('A-Z', [0.06, 0.04], [0, 0.1, 0.021], { color: 'maroon', parent: 'cover', depth: 0.003 });
    b.each(6, (i) => b.box([0.018, 0.024, 0.022], [0.078, 0.17 - i * 0.028, 0], { color: RAINBOW[i], round: 0.3 }));
    return b.act({ click: [[A.operate('cover', 'open'), A.wait(2), A.operate('cover', 'close')]] }).done();
  }),
  // A tank compressor on wheels: red tank, motor and pump with a flywheel that spins, gauges, a coiled hose.
  e('air compressor', 'workshop', 'power tools', () => {
    const b = m('air compressor', { view: 'side' })
      .capsule([0.32, 0.66, 0.32], [0, 0.3, 0], { color: 'red', rot: [90, 0, 0] })
      .box([0.3, 0.04, 0.4], [0, 0.48, -0.02], { color: 'darkgray', edge: 'sharp' })
      .cyl([0.16, 0.24, 0.16], [0.03, 0.58, -0.12], { color: '#3a3633', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.12, 0.1, 0.1], [-0.05, 0.56, 0.06], { color: 'silver', edge: 'sharp' })
      .cyl([0.22, 0.03, 0.22], [-0.13, 0.58, -0.05], { color: 'darkgray', rot: [0, 0, 90], name: 'flywheel', edge: 'sharp', mover: { kind: 'spin', axis: 'x', amount: 1200 } })
      .box([0.035, 0.2, 0.02], [-0.15, 0.58, -0.05], { color: 'yellow', parent: 'flywheel', edge: 'sharp' })
      .cyl([0.08, 0.02, 0.08], [0.06, 0.5, 0.2], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.004, 0.032, 0.004], [0.06, 0.512, 0.212], { color: 'red', name: 'needle', pivot: [0.06, 0.5, 0.212], round: 0 })
      .cyl([0.06, 0.02, 0.06], [-0.05, 0.5, 0.2], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .torus([0.22, 0.22, 0.03], [0.17, 0.3, -0.05], { color: 'black', rot: [0, 90, 0], tube: 0.12 })
      .rod([0.1, 0.62, -0.32], [0.1, 0.78, -0.45], 0.025, 'black')
      .rod([-0.1, 0.62, -0.32], [-0.1, 0.78, -0.45], 0.025, 'black')
      .stick([-0.12, 0.78, -0.45], [0.12, 0.78, -0.45], 0.03, 'black');
    tyre(b, 'wheelL', [0.19, 0.1, 0.24], 0.2, 0.06);
    tyre(b, 'wheelR', [-0.19, 0.1, 0.24], 0.2, 0.06);
    b.pair((s) => b.box([0.06, 0.12, 0.06], [s * 0.12, 0.06, -0.26], { color: 'rubber' }));
    return b
      .act({
        click: [
          [A.operate('flywheel', 'on'), A.par(A.anim('shake', 3), A.say('Rat-a-tat-tat!', 2), A.pose('needle', { rot: [0, 0, -120], dur: 2.5 })), A.operate('flywheel', 'off')],
          [A.par(A.effect('steam', { dur: 1.5 }), A.say('Psssst!', 1.5), A.pose('needle', { rot: [0, 0, 0], dur: 1.2 }))],
        ],
      })
      .done();
  }),
  // The outdoor unit of an air conditioner on its pad: a big fan behind a round grille, cooling fins, pipes.
  e('air conditioning', 'home', 'appliances', () => {
    const b = m('air conditioning', { edge: 'sharp' })
      .box([1.05, 0.08, 0.5], [0, 0.04, 0], { color: 'stone', round: 0.2 })
      .box([0.9, 0.74, 0.36], [0, 0.47, 0], { color: 'lightgray', round: 0.06 })
      .box([0.92, 0.04, 0.38], [0, 0.85, 0], { color: 'gray', round: 0.3 })
      .cyl([0.56, 0.02, 0.56], [-0.12, 0.47, 0.18], { color: '#2a2726', rot: [90, 0, 0] })
      .torus([0.6, 0.6, 0.03], [-0.12, 0.47, 0.195], { color: 'gray', tube: 0.06 })
      .torus([0.4, 0.4, 0.015], [-0.12, 0.47, 0.2], { color: 'gray', tube: 0.04 })
      .cyl([0.08, 0.04, 0.08], [-0.12, 0.47, 0.19], { color: 'darkgray', rot: [90, 0, 0], name: 'blades', mover: { kind: 'spin', axis: 'z', amount: 900 } })
      .stick([-0.42, 0.47, 0.205], [0.18, 0.47, 0.205], 0.012, 'gray')
      .stick([-0.12, 0.17, 0.205], [-0.12, 0.77, 0.205], 0.012, 'gray')
      .label('COOLAIR', [0.18, 0.05], [0.3, 0.76, 0.185], { color: 'navy', depth: 0.004 });
    b.each(3, (i) => b.box([0.09, 0.24, 0.012], [-0.12 + Math.sin((i * 2 * Math.PI) / 3) * 0.13, 0.47 + Math.cos((i * 2 * Math.PI) / 3) * 0.13, 0.185], { color: '#c9ccd1', rot: [0, 25, -i * 120], parent: 'blades', round: 0.8 }));
    b.each(9, (i) => b.box([0.22, 0.012, 0.03], [0.3, 0.17 + i * 0.065, 0.18], { color: 'gray', rot: [-25, 0, 0], round: 0 }));
    b.pair((s) => b.box([0.08, 0.06, 0.4], [s * 0.36, 0.11, 0], { color: 'darkgray' }));
    b.rod([0.47, 0.25, -0.08], [0.6, 0.25, -0.3], 0.025, 'copper').rod([0.47, 0.32, -0.1], [0.6, 0.32, -0.3], 0.03, 'copper');
    return b
      .act({ click: [[A.operate('blades', 'on'), A.par(A.effect('snow', { dur: 2.5 }), A.say('Whirrr...', 2)), A.wait(2.5), A.operate('blades', 'off')]] })
      .done();
  }),
  // A tower air purifier: slotted front, a fan under the top grille and a light ring that shows it is on.
  e('air filter', 'home', 'appliances', () => {
    const b = m('air filter', { edge: 'sharp' })
      .box([0.28, 0.52, 0.28], [0, 0.27, 0], { color: 'white', round: 0.45 })
      .box([0.29, 0.02, 0.29], [0, 0.01, 0], { color: 'lightgray', round: 0.4 })
      .cyl([0.22, 0.02, 0.22], [0, 0.535, 0], { color: '#3a3633' })
      .cyl([0.06, 0.03, 0.06], [0, 0.535, 0], { color: 'gray', name: 'impeller', mover: { kind: 'spin', axis: 'y', amount: 900 } })
      .torus([0.2, 0.2, 0.012], [0, 0.548, 0], { color: 'cyan', rot: [90, 0, 0], tube: 0.08, name: 'ring', mover: { kind: 'light' } })
      .box([0.08, 0.03, 0.01], [0, 0.45, 0.142], { color: '#2a2726', round: 0.3 })
      .ball([0.012, 0.012, 0.006], [-0.02, 0.45, 0.148], { color: 'lime', glow: true });
    b.each(4, (i) => b.box([0.09, 0.012, 0.004], [0, 0.535, -0.06 + i * 0.04], { color: 'gray', parent: 'impeller', rot: [0, i * 45, 0] }));
    b.each(7, (i) => b.box([0.014, 0.3, 0.006], [-0.075 + i * 0.025, 0.24, 0.141], { color: 'lightgray', round: 0.5 }));
    return b
      .act({
        click: [
          [A.operate('ring', 'on'), A.operate('impeller', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Whoosh...', 1.5))],
          [A.operate('ring', 'off'), A.operate('impeller', 'off')],
        ],
      })
      .done();
  }),
  // A twin trumpet air horn on its mounting bracket, polished chrome.
  e('air horn', 'garage', 'car parts', () =>
    m('air horn', { view: 'side', edge: 'sharp' })
      .box([0.12, 0.03, 0.3], [0, 0.015, -0.02], { color: 'darkgray', round: 0.3 })
      .box([0.08, 0.1, 0.1], [0, 0.08, -0.14], { color: 'darkgray', round: 0.3 })
      .cyl([0.04, 0.34, 0.04], [0.03, 0.09, 0.03], { color: 'silver', rot: [90, 0, 0], taper: 1.5, name: 'horn1' })
      .cyl([0.11, 0.07, 0.11], [0.03, 0.09, 0.23], { color: 'silver', rot: [90, 0, 0], taper: 1.6, parent: 'horn1' })
      .cyl([0.032, 0.24, 0.032], [-0.03, 0.15, -0.02], { color: 'silver', rot: [90, 0, 0], taper: 1.5 })
      .cyl([0.085, 0.06, 0.085], [-0.03, 0.15, 0.13], { color: 'silver', rot: [90, 0, 0], taper: 1.6 })
      .rod([0, 0.1, -0.19], [0, 0.04, -0.32], 0.016, 'black')
      .act({ click: [[A.par(A.anim('shake'), A.say('HOOONK!', 1.5))], [A.par(A.anim('shake', 2), A.say('BWAAAMP!', 1.5))]] })
      .done(),
  ),
  // An inflatable airbed: flocked tubes, a puffed pillow end and a valve. Someone can lie on it.
  e('air mattress', 'sports', 'camping gear', () => {
    const b = m('air mattress').box([0.98, 0.2, 1.9], [0, 0.1, 0], { color: '#3a7bd5', round: 0.8 });
    b.each(5, (i) => b.capsule([0.18, 1.46, 0.07], [-0.36 + i * 0.18, 0.2, -0.16], { color: '#4f8fe6', rot: [90, 0, 0] }));
    b.box([0.9, 0.12, 0.34], [0, 0.24, 0.74], { color: '#7fb0f0', round: 0.9 })
      .cyl([0.04, 0.03, 0.04], [0.47, 0.12, -0.8], { color: 'white', rot: [0, 0, 90], edge: 'sharp' })
      .socket('bed', [0, 0.26, 0], 'top', { size: 1.8 });
    return b.act({ click: [[A.par(A.anim('pulse', 3), A.say('Pff, pff, pff...', 2))], [A.par(A.anim('bounce'), A.say('Boing!', 1.2))]] }).done();
  }),
  // A scuba tank: yellow steel cylinder, black boot and bands, a valve knob that turns, regulator and gauge.
  e('air tank', 'sports', 'diving gear', () =>
    m('air tank')
      .capsule([0.18, 0.62, 0.18], [0, 0.33, 0], { color: 'yellow' })
      .cyl([0.19, 0.1, 0.19], [0, 0.05, 0], { color: 'black' })
      .torus([0.19, 0.19, 0.03], [0, 0.45, 0], { color: 'black', rot: [90, 0, 0], tube: 0.12 })
      .label('SCUBA', [0.08, 0.04], [0, 0.32, 0.09], { color: 'black', depth: 0.003 })
      .cyl([0.045, 0.06, 0.045], [0, 0.66, 0], { color: 'silver', edge: 'sharp' })
      .box([0.08, 0.04, 0.04], [0, 0.7, 0], { color: 'silver', edge: 'sharp', round: 0.3 })
      .cyl([0.06, 0.02, 0.06], [0.05, 0.7, 0], { color: 'black', rot: [0, 0, 90], name: 'valve', mover: { kind: 'swing', axis: 'x', amount: 180 }, edge: 'sharp' })
      .rod([-0.04, 0.7, 0], [-0.12, 0.66, 0.05], 0.022, 'black')
      .rod([-0.12, 0.66, 0.05], [-0.13, 0.42, 0.09], 0.022, 'black')
      .cyl([0.06, 0.03, 0.06], [-0.13, 0.4, 0.1], { color: 'darkgray', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.045, 0.006, 0.045], [-0.13, 0.4, 0.116], { color: 'white', rot: [90, 0, 0], edge: 'sharp' })
      .act({ click: [[A.operate('valve', 'open'), A.par(A.effect('steam', { dur: 1.5 }), A.say('Psssss!', 1.5)), A.wait(1.5), A.operate('valve', 'close')]] })
      .done(),
  ),
  // A wall vent grille: a crisp frame and slats that tilt open when the air comes on.
  e('air vent', 'home', 'fixtures', () => {
    const b = m('air vent', { edge: 'sharp' })
      .box([0.34, 0.22, 0.025], [0, 0.11, 0], { color: 'white', round: 0.2 })
      .box([0.29, 0.17, 0.02], [0, 0.11, 0.006], { color: '#2a2726', round: 0.1 });
    b.each(5, (i) => b.box([0.28, 0.014, 0.006], [0, 0.05 + i * 0.03, 0.02], { color: 'white', round: 0.3, name: `slat${i}`, mover: { kind: 'swing', axis: 'x', amount: -40 } }));
    b.pair((s) => b.cyl([0.014, 0.004, 0.014], [s * 0.155, 0.11, 0.014], { color: 'silver', rot: [90, 0, 0] }));
    return b.act({ click: [[A.operate('slats', 'open'), A.par(A.effect('dust', { dur: 1.5 }), A.say('Whoosh...', 1.5)), A.wait(1.5), A.operate('slats', 'close')]] }).done();
  }),
  // A steering wheel on its column with the airbag folded in the hub: click and it bursts out, then deflates.
  e('airbag', 'garage', 'car parts', () =>
    m('airbag')
      .box([0.5, 0.06, 0.4], [0, 0.03, -0.05], { color: '#3a3633', edge: 'sharp', round: 0.3 })
      .box([0.5, 0.32, 0.12], [0, 0.22, -0.2], { color: '#3a3633', edge: 'sharp', round: 0.3 })
      .rod([0, 0.3, -0.16], [0, 0.48, 0.0], 0.06, 'black')
      .torus([0.38, 0.38, 0.045], [0, 0.55, 0.04], { color: 'black', rot: [-25, 0, 0], tube: 0.14 })
      .rod([-0.17, 0.53, 0.035], [0.17, 0.53, 0.035], 0.035, 'black')
      .rod([0, 0.53, 0.035], [0, 0.4, -0.02], 0.035, 'black')
      .cyl([0.14, 0.05, 0.14], [0, 0.55, 0.05], { color: '#3a3633', rot: [65, 0, 0], edge: 'sharp' })
      .ball([0.12, 0.11, 0.05], [0, 0.56, 0.08], { color: 'white', name: 'bag', piece: true })
      .label('SRS AIRBAG', [0.08, 0.02], [0, 0.6, 0.07], { color: '#3a3633', rot: [-25, 0, 0], depth: 0.003 })
      .act({ click: [[A.par(A.pose('bag', { scale: 4.5, dur: 0.12 }), A.say('POOF!', 1.5), A.effect('dust', { dur: 1 }))], [A.pose('bag', { scale: 1, dur: 1.2 }), A.say('Pssss...', 1.2)]] })
      .done(),
  ),
  // An aircraft carrier at the 80 m cap, in its real proportions (a 1:4 model): a grey hull with red below the
  // waterline, the wide flight deck with its angled landing strip, the island on the starboard side with its mast
  // and a radar that turns, and jets on deck; one is on the bow catapult and launches.
  e('aircraft carrier', 'garage', 'ships', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.8, 0.85, 0.07], [0.08, 0.95, 1, 0], [0.7, 1, 1, 0], [0.9, 0.7, 1, 0.02], [1, 0.08, 0.85, 0.07]];
    const b = m('aircraft carrier', { view: 'side', edge: 'sharp' })
      .loft([12, 7, 76], [0, 3.5, -1], prof, { color: '#7d858c', boxy: 0.85, name: 'hull', edge: 'soft' })
      .loft([12.15, 2.2, 76.3], [0, 1.1, -1], prof.map(([t, w, h]) => [t, w, h, 0] as [number, number, number, number]), { color: '#a3322a', boxy: 0.85, edge: 'soft' })
      .box([17, 0.5, 78], [0, 7.2, 0], { color: '#53585e', round: 0.05 })
      .box([8, 0.5, 34], [6.5, 7.2, -9], { color: '#53585e', rot: [0, 9, 0], round: 0.05 })
      .box([4, 1.6, 30], [6, 6.2, -9], { color: '#7d858c' })
      .box([0.2, 0.03, 70], [-2, 7.47, 1], { color: 'yellow', noInk: true })
      .box([0.25, 0.03, 34], [3.6, 7.47, -9], { color: 'white', rot: [0, 9, 0], noInk: true })
      .box([0.25, 0.03, 34], [8.6, 7.47, -9], { color: 'white', rot: [0, 9, 0], noInk: true })
      .label('75', [6, 4], [-3, 7.46, 31], { color: '#53585e', rot: [-90, 0, 0], depth: 0.02 })
      // the island
      .box([3.6, 6, 12], [-6.8, 10.5, -5], { color: '#8a9298' })
      .box([3.65, 0.8, 12.05], [-6.8, 12.6, -5], { color: '#26313b' })
      .box([3.2, 3.2, 7], [-6.8, 15, -4], { color: '#8a9298' })
      .box([3.25, 0.6, 7.05], [-6.8, 15.9, -4], { color: '#26313b' })
      .label('75', [2.4, 2.4], [-8.65, 10.4, -5], { color: '#8a9298', rot: [0, -90, 0], depth: 0.05 })
      .stick([-6.8, 16.6, -5], [-6.8, 25, -5], 0.5, '#5c6166')
      .stick([-8.8, 22, -5], [-4.8, 22, -5], 0.2, '#5c6166')
      .stick([-6.8, 16.6, -1.5], [-6.8, 18, -1.5], 0.3, '#5c6166')
      .box([2.8, 1.0, 0.25], [-6.8, 18.5, -1.5], { color: '#c9ccd1', name: 'radar', mover: { kind: 'spin', axis: 'y', amount: 200 } })
      .ball([0.9, 0.9, 0.9], [-6.8, 25.4, -5], { color: 'white' });
    // hangar doors along the hull
    b.pair((s) => b.each(3, (i) => b.box([0.1, 2.2, 5], [s * 6.02, 4.6, -18 + i * 14], { color: '#3a3f45' })));
    // jets parked on deck, and one on the bow catapult that launches
    const jet = (at: Vec3, yaw: number, name?: string) => {
      const a = yaw / RAD, R = (x: number, y: number, z: number): Vec3 => [at[0] + x * Math.cos(a) + z * Math.sin(a), at[1] + y, at[2] - x * Math.sin(a) + z * Math.cos(a)];
      const o = name ? { parent: name } : {};
      b.rod(R(0, 0, 2.1), R(0, 0, -2.1), 0.6, '#9aa3ab', name ? { name, piece: true } : {});
      b.box([3.0, 0.1, 1.4], R(0, -0.05, -0.4), { color: '#9aa3ab', rot: [0, yaw, 0], ...o });
      b.box([1.6, 0.08, 0.6], R(0, 0, -1.8), { color: '#9aa3ab', rot: [0, yaw, 0], ...o });
      b.box([0.08, 0.8, 0.7], R(0.25, 0.45, -1.7), { color: '#9aa3ab', rot: [0, yaw, -15], ...o });
      b.box([0.08, 0.8, 0.7], R(-0.25, 0.45, -1.7), { color: '#9aa3ab', rot: [0, yaw, 15], ...o });
      b.ball([0.4, 0.3, 1.0], R(0, 0.3, 1.0), { color: GL, ...o });
    };
    jet([-2, 7.85, 26], 0, 'jet');
    jet([4, 7.85, -24], 9);
    jet([10, 7.85, -10], 9);
    jet([-4, 7.85, -20], -150);
    jet([-4, 7.85, -26], -150);
    return b
      .act({
        click: [
          [A.par(A.pose('jet', { move: [0, 6, 46], dur: 1.6 }), A.effect('steam', { dur: 1 }), A.say('Whoooosh!', 1.5)), A.pose('jet', { scale: 0.01, dur: 0.3 }), A.pose('jet', { move: [0, 0, 0], dur: 0.05 }), A.pose('jet', { scale: 1, dur: 0.8 })],
          [A.operate('radar', 'on'), A.say('BWAAAMP!', 2), A.wait(2.5), A.operate('radar', 'off')],
        ],
      })
      .done();
  }),
  // A spacecraft airlock: a bulkhead with a round pressure hatch. Its handwheel turns, the hatch swings open with
  // a hiss under a red warning beacon, and closes again. A short chamber behind it.
  e('airlock', 'garage', 'spacecraft', () => {
    const b = m('airlock', { edge: 'sharp' })
      .box([2.8, 2.9, 0.4], [0, 1.45, 0], { color: '#d4d7da', round: 0.05 })
      .cyl([2.3, 2.2, 2.3], [0, 1.35, -1.3], { color: 'metal', rot: [90, 0, 0] })
      .torus([1.95, 1.95, 0.22], [0, 1.35, 0.2], { color: 'metal', tube: 0.13 })
      .cyl([1.62, 0.02, 1.62], [0, 1.35, 0.205], { color: '#2a2f36', rot: [90, 0, 0] })
      .cyl([1.62, 0.14, 1.62], [0, 1.35, 0.27], { color: '#c9ccd1', rot: [90, 0, 0], name: 'door', pivot: [-0.81, 1.35, 0.27], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .torus([1.45, 1.45, 0.05], [0, 1.35, 0.35], { color: 'gray', tube: 0.06, parent: 'door' })
      .cyl([0.34, 0.05, 0.34], [0, 1.78, 0.35], { color: GL, rot: [90, 0, 0], parent: 'door' })
      .torus([0.56, 0.56, 0.05], [0, 1.15, 0.4], { color: 'red', tube: 0.12, parent: 'door', name: 'handle' })
      .stick([-0.27, 1.15, 0.4], [0.27, 1.15, 0.4], 0.04, 'red', { parent: 'handle' })
      .stick([0, 0.88, 0.4], [0, 1.42, 0.4], 0.04, 'red', { parent: 'handle' })
      .box([2.6, 0.05, 0.7], [0, 0.025, 0.55], { color: '#3a3633' })
      .label('AIRLOCK', [1.1, 0.22], [0, 2.6, 0.21], { color: 'yellow', depth: 0.02 })
      .cyl([0.3, 0.06, 0.3], [0, 2.92, 0.05], { color: 'darkgray' })
      .dome([0.26, 0.18, 0.26], [0, 2.95, 0.05], { color: 'red', glow: true, name: 'beacon', mover: { kind: 'light' } })
      .box([0.32, 0.5, 0.08], [1.1, 1.35, 0.22], { color: '#3a3633', round: 0.2 })
      .box([0.22, 0.14, 0.02], [1.1, 1.48, 0.27], { color: 'cyan', glow: true })
      .ball(0.04, [1.05, 1.25, 0.27], { color: 'lime', glow: true })
      .ball(0.04, [1.15, 1.25, 0.27], { color: 'red', glow: true });
    b.each(7, (i) => b.box([0.28, 0.14, 0.02], [-1.05 + i * 0.35, 0.18, 0.21], { color: i % 2 ? '#2a2726' : 'yellow', rot: [0, 0, 35], noInk: true }));
    return b
      .act({ click: [[A.operate('beacon', 'on'), A.pose('handle', { rot: [0, 0, -270], dur: 1.2 }), A.par(A.operate('door', 'open'), A.effect('steam', { dur: 1.5 }), A.say('Hissss...', 1.5)), A.wait(2.5), A.operate('door', 'close'), A.pose('handle', { rot: [0, 0, 0], dur: 0.8 }), A.operate('beacon', 'off')]] })
      .done();
  }),
  // A twin-engine airliner at 40 m: a lofted fuselage (white over grey), rows of cabin windows, the cockpit
  // windscreen, swept wings with winglets, engines whose fans spin up, a tall tail, landing gear on wheels, and a
  // front door that opens.
  e('airplane', 'garage', 'aircraft', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.12, 0.3, 0.32], [0.1, 0.55, 0.7, 0.16], [0.25, 0.97, 1, 0.01], [0.8, 1, 1, 0], [0.92, 0.85, 0.88, -0.03], [0.98, 0.5, 0.55, -0.08], [1, 0.12, 0.15, -0.1]];
    // A swept fin standing up from the centre of its root chord: a loft stood upright whose sections stay level
    // (root and tip chords run fore and aft) and slide back with height, so it sits flush on the fuselage and its
    // leading edge sweeps back (the shared fin() helper tilts the whole fin instead).
    const vfin = (root: Vec3, h: number, chord: number, tip: number, thick: number, sweep: number, color: string) => {
      const zf = root[2] + chord / 2, sw = h * Math.tan(sweep / RAD);
      const zb = Math.min(root[2] - chord / 2, zf - sw - tip), D = zf - zb, zc = (zf + zb) / 2;
      return b.loft([thick, D, h], [root[0], root[1] + h / 2, zc], [[0, 1, chord / D, (zc - root[2]) / D], [1, 0.45, tip / D, (zc - (zf - sw - tip / 2)) / D]], { color, boxy: 0.8, rot: [-90, 0, 0], edge: 'sharp' });
    };
    const b = m('airplane', { view: 'side' })
      .loft([4, 4.2, 38], [0, 4.3, -0.5], prof, { color: 'white', name: 'fuselage' })
      .loft([4.04, 4.24, 38.04], [0, 4.3, -0.5], prof, { color: '#c9ccd1', cut: 'bottom' })
      .box([2.2, 0.5, 1.1], [0, 5.45, 16.3], { color: GL, rot: [-32, 0, 0], edge: 'sharp' })
      .box([0.1, 1.9, 0.95], [1.96, 3.95, 14.0], { color: '#eef0f2', name: 'door', pivot: [1.96, 3.95, 14.48], mover: { kind: 'swing', axis: 'y', amount: -100 }, edge: 'sharp' })
      .box([0.06, 0.3, 0.2], [2.02, 4.4, 14.0], { color: GL, parent: 'door', edge: 'sharp' })
      .box([0.08, 1.9, 0.9], [1.93, 3.95, -12.5], { color: '#e2e4e6', edge: 'sharp' })
      .socket('pilot', [0.6, 4.4, 15.8], 'seat');
    b.each(20, (i) => b.pair((s) => b.box([0.1, 0.32, 0.22], [s * 1.95, 4.75, -9.5 + i * 1.15], { color: GL, edge: 'sharp' })));
    b.pair((s) => {
      wing(b, [s * 1.6, 3.0, 1.5], s, 16.5, 7, 1.8, 0.7, 26, 'lightgray');
      vfin([s * 16.4, 3.05, -5.6], 1.7, 1.4, 0.6, 0.14, 35, 'navy');
      wing(b, [s * 0.6, 5.6, -16.2], s, 6.4, 3.8, 1.4, 0.35, 30, 'lightgray');
      const nm = s > 0 ? 'engineL' : 'engineR';
      b.box([0.35, 1.1, 3.2], [s * 6, 2.85, 2.9], { color: 'lightgray', edge: 'sharp' })
        .cyl([2.2, 4.6, 2.2], [s * 6, 1.9, 3.6], { color: 'navy', rot: [90, 0, 0] })
        .cyl([1.4, 1.0, 1.4], [s * 6, 1.9, 0.9], { color: 'darkgray', rot: [90, 0, 0], taper: 0.6 })
        .torus([2.24, 2.24, 0.35], [s * 6, 1.9, 5.85], { color: 'silver', tube: 0.18 })
        .cyl([1.9, 0.08, 1.9], [s * 6, 1.9, 5.75], { color: '#3a3633', rot: [90, 0, 0], name: nm, mover: { kind: 'spin', axis: 'z', amount: 1500 }, edge: 'sharp' })
        .cone([0.6, 0.5, 0.6], [s * 6, 1.9, 6.0], { color: 'silver', rot: [90, 0, 0], parent: nm });
      b.each(4, (i) => b.box([0.22, 1.75, 0.05], [s * 6, 1.9, 5.82], { color: 'gray', rot: [0, 0, i * 45], parent: nm, edge: 'sharp' }));
      // main gear
      b.stick([s * 2.6, 3.2, -0.5], [s * 2.6, 0.6, -0.5], 0.22, 'gray');
      tyre(b, s > 0 ? 'wheelM1' : 'wheelM3', [s * 2.25, 0.6, -0.5], 1.2, 0.35);
      tyre(b, s > 0 ? 'wheelM2' : 'wheelM4', [s * 2.95, 0.6, -0.5], 1.2, 0.35);
      tyre(b, s > 0 ? 'wheelN1' : 'wheelN2', [s * 0.28, 0.45, 14.3], 0.9, 0.28);
    });
    vfin([0, 5.6, -15.0], 6.8, 6.5, 2.4, 0.5, 38, 'red');
    b.label('SKYLINE', [3.6, 0.8], [0.2, 8.9, -16.6], { color: 'red', rot: [0, 90, 0], depth: 0.02 });
    b.stick([0, 2.6, 14.3], [0, 0.45, 14.3], 0.16, 'gray');
    return b
      .act({
        click: [
          [A.operate('engines', 'on'), A.say('Whoooosh!', 2.5), A.wait(3), A.operate('engines', 'off')],
          [A.operate('door', 'open'), A.say('Ding!', 1.5), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // An airport terminal: a glass front under a curved roof, sliding entrance doors, a jet bridge on stilts, a
  // windsock, a radar on the roof, and the control tower with its glass cab and a beacon.
  e('airport', 'places', 'transport hubs', () => {
    const b = m('airport', { edge: 'sharp' })
      .box([38, 0.3, 18], [0, 0.15, 0], { color: 'stone', round: 0.05 })
      .box([36, 9, 16], [0, 4.8, 0], { color: '#dfe3e6', round: 0.02 })
      .box([32, 6.5, 0.1], [0, 3.6, 8.03], { color: '#6f9fbf', round: 0.05 })
      .box([32, 0.15, 0.2], [0, 4.0, 8.08], { color: 'white' })
      .dome([38, 3, 18], [0, 9.25, 0], { color: 'white', edge: 'soft' })
      .label('AIRPORT', [10, 1.5], [0, 8.2, 8.12], { color: 'navy', depth: 0.05 })
      .box([14, 0.35, 5], [0, 4.4, 10.6], { color: 'white', round: 0.1 })
      .box([3.0, 0.4, 0.3], [0, 3.15, 8.15], { color: 'steel' })
      .box([1.3, 2.6, 0.08], [-0.65, 1.6, 8.18], { color: '#a9dcf2', name: 'doorL', mover: { kind: 'slide', axis: 'x', amount: -1.25 } })
      .box([1.3, 2.6, 0.08], [0.65, 1.6, 8.18], { color: '#a9dcf2', name: 'doorR', mover: { kind: 'slide', axis: 'x', amount: 1.25 } })
      // control tower
      .cyl([3.2, 24, 3.2], [21, 12.3, -3], { color: '#e6e6e0' })
      .cyl([5.5, 1.2, 5.5], [21, 24.6, -3], { color: 'gray', segs: 8 })
      .cyl([6.4, 3.2, 6.4], [21, 26.8, -3], { color: '#3d6a7a', taper: 1.18, segs: 8 })
      .cyl([7.8, 0.5, 7.8], [21, 28.65, -3], { color: 'white', segs: 8 })
      .stick([21, 28.9, -3], [21, 32, -3], 0.15, 'gray')
      .ball(0.6, [21, 32.2, -3], { color: 'red', glow: true, name: 'beacon', mover: { kind: 'light' } })
      // radar on the roof
      .stick([-14, 9.3, -4], [-14, 12, -4], 0.3, 'gray')
      .box([3.2, 1.0, 0.3], [-14, 12.4, -4], { color: 'white', name: 'radar', mover: { kind: 'spin', axis: 'y', amount: 180 } })
      // jet bridge on stilts
      .box([2.6, 2.8, 14], [-12, 5, 15], { color: '#c9ccd1', round: 0.1 })
      .box([2.65, 0.6, 13.6], [-12, 5.2, 15], { color: GL })
      .cyl([3.6, 3.2, 3.6], [-12, 5, 22.5], { color: '#b9c2ca' })
      .stick([-12.8, 3.6, 20], [-12.8, 0.5, 20], 0.3, 'darkgray')
      .stick([-11.2, 3.6, 20], [-11.2, 0.5, 20], 0.3, 'darkgray')
      // windsock
      .stick([16, 0.3, 13], [16, 5.5, 13], 0.12, 'white')
      .cyl([0.7, 2.6, 0.7], [17.3, 5.3, 13], { color: 'orange', rot: [0, 0, 80], taper: 0.4, edge: 'soft' });
    b.each(12, (i) => b.box([0.15, 6.6, 0.18], [-15.95 + i * 2.9, 3.6, 8.06], { color: 'white' }));
    b.each(4, (i) => b.stick([-6 + i * 4, 0.3, 12.8], [-6 + i * 4, 4.25, 12.8], 0.3, 'white'));
    tyre(b, 'wheelL', [-12.8, 0.4, 20], 0.8, 0.3);
    tyre(b, 'wheelR', [-11.2, 0.4, 20], 0.8, 0.3);
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-dong! Now boarding.', 2.5), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('beacon', 'on'), A.operate('radar', 'on'), A.wait(3), A.operate('beacon', 'off'), A.operate('radar', 'off')],
        ],
      })
      .done();
  }),
  // A supermarket aisle at real size: two 1.9 m gondola shelves of goods with yellow price strips, a tiled floor
  // and an overhead aisle sign. A cereal box on the edge falls off when clicked, and is put back.
  e('aisle', 'places', 'shop interiors', () => {
    const b = m('aisle', { edge: 'sharp' }).box([4.2, 0.04, 4.4], [0, 0.02, 0], { color: '#e8e4dc', round: 0.1 });
    const goods = ['#e0473b', '#f6d24a', '#4e8fd6', '#5aa553', '#f0923b', '#f4a1c0', '#8a5fc4', '#3fa7a0', '#fff3d6', '#a3322a'];
    b.each(5, (i) => b.box([0.03, 0.005, 4.4], [-1.68 + i * 0.84, 0.042, 0], { color: '#cfcac0', noInk: true }));
    b.pair((s) => {
      b.box([0.1, 1.9, 4.0], [s * 1.6, 0.99, 0], { color: 'white', round: 0.1 })
        .box([0.55, 0.12, 4.0], [s * 1.35, 0.1, 0], { color: '#d4d7da', round: 0.1 });
      b.each(4, (r) => {
        const y = 0.16 + r * 0.45;
        b.box([0.5, 0.03, 4.0], [s * 1.33, y, 0], { color: 'white', round: 0.2, name: s > 0 && r === 2 ? 'shelfL' : undefined });
        b.box([0.02, 0.04, 4.0], [s * 1.07, y, 0], { color: 'yellow', noInk: true });
        b.each(4, (k) => {
          const c = goods[(r * 4 + k + (s > 0 ? 3 : 0)) % goods.length];
          const z = -1.5 + k * 1.0;
          if ((r + k) % 3 === 0) b.each(4, (q) => b.cyl([0.09, 0.13, 0.09], [s * 1.25, y + 0.08, z - 0.3 + q * 0.2], { color: c }));
          else b.box([0.3, 0.3 - (k % 2) * 0.06, 0.85], [s * 1.36, y + 0.17 - (k % 2) * 0.03, z], { color: c, round: 0.15 });
        });
      });
    });
    b.box([0.12, 0.3, 0.22], [1.15, 1.23, 1.9], { color: 'orange', round: 0.1, name: 'cereal', parent: 'shelfL', piece: true })
      .label('CEREAL', [0.2, 0.06], [1.15, 1.28, 2.012], { color: 'yellow', parent: 'cereal', depth: 0.003 });
    b.pair((s) => b.stick([s * 1.6, 1.94, 1.8], [s * 1.6, 2.7, 1.8], 0.04, 'gray'));
    b.stick([-1.6, 2.7, 1.8], [1.6, 2.7, 1.8], 0.04, 'gray')
      .label('AISLE 5', [1.3, 0.4], [0, 2.4, 1.8], { color: 'blue', depth: 0.03 });
    return b.act({ click: [[A.detach('cereal', 'cereal'), A.say('Thud!', 1)], [A.reattach('cereal'), A.say('Ding! Clean-up in aisle 5.', 2)]] }).done();
  }),
  // A twin-bell alarm clock at its real 16 cm: hands on the dial, two bells and the hammer between them.
  e('alarm clock', 'home', 'clocks', () => {
    const b = m('alarm clock', { edge: 'sharp' })
      .cyl([0.12, 0.05, 0.12], [0, 0.085, 0], { color: 'red', rot: [90, 0, 0] })
      .torus([0.124, 0.124, 0.012], [0, 0.085, 0.026], { color: 'silver', tube: 0.1 })
      .cyl([0.104, 0.004, 0.104], [0, 0.085, 0.026], { color: 'white', rot: [90, 0, 0] })
      .box([0.004, 0.026, 0.002], [-Math.sin(1.05) * 0.012, 0.085 + Math.cos(1.05) * 0.012, 0.03], { color: 'black', rot: [0, 0, 60], round: 0, name: 'hour', pivot: [0, 0.085, 0.03] })
      .box([0.003, 0.04, 0.002], [0, 0.104, 0.031], { color: 'black', round: 0, name: 'minute', pivot: [0, 0.085, 0.031] })
      .ball(0.006, [0, 0.085, 0.032], { color: 'red' })
      .stick([0, 0.11, 0], [0, 0.15, 0], 0.005, 'silver')
      .stick([0, 0.13, 0], [0, 0.162, 0], 0.004, 'silver', { name: 'hammer', pivot: [0, 0.13, 0] })
      .ball(0.01, [0, 0.165, 0], { color: 'silver', parent: 'hammer' })
      .box([0.03, 0.006, 0.006], [0, 0.085, -0.03], { color: 'silver' });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.003, i % 3 ? 0.006 : 0.011, 0.002], [Math.sin(a) * 0.044, 0.085 + Math.cos(a) * 0.044, 0.029], { color: 'black', rot: [0, 0, -i * 30], round: 0, noInk: true });
    });
    b.pair((s) => b.dome([0.055, 0.03, 0.055], [s * 0.036, 0.14, 0], { color: 'silver', rot: [0, 0, -s * 35] }).rod([s * 0.03, 0.05, 0], [s * 0.045, 0.004, 0.012], 0.01, 'silver'));
    const ring = [A.pose('hammer', { rot: [0, 0, 25], dur: 0.08 }), A.pose('hammer', { rot: [0, 0, -25], dur: 0.08 })];
    return b
      .act({
        click: [
          [A.pose('minute', { rot: [0, 0, -360], dur: 1.2 }), A.par(A.anim('shake', 4), A.say('RRRRRING!', 2)), ...ring, ...ring, ...ring, ...ring, A.pose('hammer', { rot: [0, 0, 0], dur: 0.1 }), A.pose('minute', { rot: [0, 0, 0], dur: 0.01 })],
          [A.par(A.say('Tick tock...', 2), A.pose('minute', { rot: [0, 0, -360], dur: 2 })), A.pose('minute', { rot: [0, 0, 0], dur: 0.01 })],
        ],
      })
      .done();
  }),
  // A little dish of almonds; the one on top can be taken.
  e('almond', 'food', 'nuts', () => {
    const b = m('almond').cyl([0.11, 0.025, 0.11], [0, 0.0125, 0], { color: 'white', taper: 1.3, name: 'dish', edge: 'sharp' });
    const nuts: Array<[number, number, number, number]> = [[0, 0.025, 0, 0], [0.025, 0.024, 0.015, 60], [-0.026, 0.024, 0.012, -50], [0.006, 0.024, -0.026, 100], [-0.012, 0.025, 0.028, 20]];
    for (const [x0, y, z, r] of nuts) b.ball([0.016, 0.024, 0.009], [x0, y, z], { color: '#b07040', rot: [-80, r, 0] });
    b.ball([0.016, 0.024, 0.009], [0.006, 0.034, 0.008], { color: '#a5653a', rot: [-70, 30, 15], name: 'nut', parent: 'dish', piece: true });
    return b.act({ click: [[A.detach('nut', 'almond')], [A.reattach('nut')]] }).done();
  }),
  // Wooden alphabet blocks: A and B side by side, C on top (it comes off).
  e('alphabet', 'ideas', 'letters', () => {
    const b = m('alphabet', { edge: 'sharp' });
    const blk = (t: string, side: string, at: Vec3, c: string, name: string, parent?: string) => {
      b.box([0.16, 0.16, 0.16], at, { color: 'lightwood', round: 0.15, name, parent, piece: !!parent });
      b.label(t, [0.12, 0.12], [at[0], at[1], at[2] + 0.081], { color: c, parent: name, depth: 0.004 });
      b.label(side, [0.12, 0.12], [at[0] + 0.081, at[1], at[2]], { color: c === 'red' ? 'blue' : 'red', rot: [0, 90, 0], parent: name, depth: 0.004 });
    };
    blk('A', 'D', [-0.085, 0.08, 0], 'red', 'blockA');
    blk('B', 'E', [0.085, 0.08, 0.01], 'blue', 'blockB');
    blk('C', 'F', [0, 0.24, 0.005], 'green', 'blockC', 'blockA');
    return b.act({ click: [[A.detach('blockC', 'c'), A.say('A, B, C!', 1.5)], [A.reattach('blockC'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A polished piece of amber with an insect caught inside, on a little stand; it glows when held to the light.
  e('amber', 'nature', 'gems and minerals', () =>
    m('amber')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'darkwood', round: 0.4, edge: 'sharp' })
      .ball([0.065, 0.08, 0.04], [0, 0.058, 0], { color: '#f0a020', name: 'amber', mover: { kind: 'light' } })
      .ball([0.025, 0.03, 0.01], [-0.014, 0.075, 0.016], { color: '#ffd27a', noInk: true, parent: 'amber' })
      .ball([0.008, 0.016, 0.006], [0.004, 0.055, 0.018], { color: 'darkbrown', noInk: true, parent: 'amber' })
      .ball([0.016, 0.006, 0.004], [-0.004, 0.06, 0.019], { color: '#8a6a4a', noInk: true, rot: [0, 0, 30], parent: 'amber' })
      .ball([0.016, 0.006, 0.004], [0.012, 0.06, 0.019], { color: '#8a6a4a', noInk: true, rot: [0, 0, -30], parent: 'amber' })
      .act({ click: [[A.operate('amber', 'on'), A.effect('sparkle', { dur: 1.5 }), A.wait(1.5), A.operate('amber', 'off')]] })
      .done(),
  ),
  // A box ambulance at real size (6.6 m long, 2.8 m to the light bar): van cab with windscreen and a driver's door,
  // the white patient module with red stripe, star-of-life crosses and AMBULANCE on the sides, rear doors that
  // open, emergency lights that flash, dual rear wheels and headlights.
  e('ambulance', 'garage', 'emergency vehicles', () => {
    const b = m('ambulance', { view: 'side', edge: 'sharp' })
      .box([2.2, 1.95, 4.3], [0, 1.8, -0.85], { color: 'white', round: 0.08, name: 'body' })
      .box([2.22, 0.22, 4.32], [0, 1.25, -0.85], { color: 'red' })
      .box([2.04, 1.5, 1.2], [0, 1.55, 1.9], { color: 'white', round: 0.15 })
      .box([2.0, 0.6, 0.9], [0, 1.05, 2.9], { color: 'white', round: 0.25 })
      .box([2.06, 0.16, 2.1], [0, 1.08, 2.3], { color: 'red' })
      .box([1.8, 0.62, 0.08], [0, 1.82, 2.55], { color: GL, rot: [-18, 0, 0] })
      .box([0.04, 0.5, 0.6], [-1.03, 1.85, 2.0], { color: GL })
      .box([0.05, 1.1, 1.0], [1.03, 1.4, 1.95], { color: 'white', name: 'door', pivot: [1.03, 1.4, 2.45], mover: { kind: 'swing', axis: 'y', amount: -70 } })
      .box([0.02, 0.48, 0.6], [1.06, 1.8, 2.0], { color: GL, parent: 'door' })
      .box([0.04, 0.03, 0.14], [1.07, 1.3, 1.6], { color: 'darkgray', parent: 'door' })
      .box([1.2, 0.35, 0.05], [0, 0.98, 3.36], { color: 'darkgray' })
      .box([0.3, 0.18, 0.06], [0.75, 1.05, 3.36], { color: '#fff6c8', glow: true, name: 'headlightL', mover: { kind: 'light' } })
      .box([0.3, 0.18, 0.06], [-0.75, 1.05, 3.36], { color: '#fff6c8', glow: true, name: 'headlightR', mover: { kind: 'light' } })
      .box([2.1, 0.25, 0.25], [0, 0.6, 3.38], { color: 'gray', round: 0.3 })
      .box([2.0, 0.15, 0.45], [0, 0.6, -3.15], { color: 'gray', round: 0.3 })
      .box([2.0, 0.3, 4.6], [0, 0.72, -0.4], { color: '#3a3633' })
      .label('AMBULANCE', [1.4, 0.26], [0, 1.68, 3.4], { color: 'white', depth: 0.01 })
      .box([1.05, 1.75, 0.06], [0.53, 1.75, -3.03], { color: 'white', name: 'backL', pivot: [1.08, 1.75, -3.03], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.55, 0.45, 0.02], [0.53, 2.2, -3.07], { color: GL, parent: 'backL' })
      .box([1.05, 1.75, 0.06], [-0.53, 1.75, -3.03], { color: 'white', name: 'backR', pivot: [-1.08, 1.75, -3.03], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .box([0.55, 0.45, 0.02], [-0.53, 2.2, -3.07], { color: GL, parent: 'backR' })
      .socket('driver', [0.5, 1.2, 1.9], 'seat');
    b.pair((s) => {
      b.box([0.03, 0.75, 0.24], [s * 1.11, 2.05, -0.9], { color: 'red', round: 0 }).box([0.03, 0.24, 0.75], [s * 1.11, 2.05, -0.9], { color: 'red', round: 0 });
      b.label('AMBULANCE', [2.0, 0.28], [s * 1.115, 2.55, -1.2], { color: 'white', rot: [0, s * 90, 0], depth: 0.01 });
      b.box([0.03, 0.4, 0.7], [s * 1.11, 2.1, 0.6], { color: GL });
      b.box([0.32, 0.16, 0.22], [s * 0.82, 2.84, 1.1], { color: s > 0 ? 'red' : 'blue', glow: true, name: s > 0 ? 'sirenL' : 'sirenR', mover: { kind: 'light' } });
      b.box([0.32, 0.16, 0.22], [s * 0.82, 2.84, -2.85], { color: s > 0 ? 'red' : 'blue', glow: true, name: s > 0 ? 'sirenBL' : 'sirenBR', mover: { kind: 'light' } });
      b.box([0.14, 0.24, 0.04], [s * 0.9, 1.1, -3.08], { color: 'red', glow: true });
      tyre(b, s > 0 ? 'wheelFL' : 'wheelFR', [s * 0.9, 0.4, 2.55], 0.8, 0.26);
      tyre(b, s > 0 ? 'wheelBL' : 'wheelBR', [s * 0.86, 0.4, -1.75], 0.8, 0.42);
    });
    return b
      .act({
        click: [
          [A.operate('siren', 'on'), A.operate('headlight', 'on'), A.say('Wee-woo! Wee-woo!', 2.5), A.wait(3), A.operate('siren', 'off'), A.operate('headlight', 'off')],
          [A.operate('back', 'open'), A.wait(2.5), A.operate('back', 'close')],
          [A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A stack of American cheese slices on a saucer; the top slice peels off.
  e('american cheese', 'food', 'cheese', () => {
    const b = plate(m('american cheese'), 0.16);
    b.each(6, (i) => b.box([0.09, 0.005, 0.09], [0, 0.022 + i * 0.006, 0], { color: i % 2 ? '#f5a623' : '#f7b23b', rot: [0, i * 9 - 25, 0], round: 0.1, name: i === 5 ? 'stack' : undefined }));
    b.box([0.09, 0.004, 0.09], [0.006, 0.06, 0.006], { color: '#f7b23b', rot: [0, 18, 0], round: 0.1, name: 'slice', parent: 'stack', piece: true });
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // A household ammonia jug with a handle; the cap twists off and the fumes rise.
  e('ammonia', 'home', 'cleaning', () =>
    m('ammonia')
      .box([0.16, 0.24, 0.1], [0, 0.12, 0], { color: '#e6f2fb', round: 0.45, name: 'jug' })
      .arc([0.09, 0.08, 0.03], [-0.04, 0.24, 0], { color: '#e6f2fb', tube: 0.35, rot: [0, 0, 0] })
      .cyl([0.04, 0.03, 0.04], [0.045, 0.255, 0], { color: '#e6f2fb' })
      .cyl([0.046, 0.028, 0.046], [0.045, 0.28, 0], { color: 'blue', name: 'cap', parent: 'jug', piece: true, edge: 'sharp' })
      .label('AMMONIA', [0.12, 0.08], [0, 0.11, 0.051], { color: 'yellow', depth: 0.003 })
      .act({ click: [[A.pose('cap', { move: [0, 0.05, 0], rot: [0, 360, 0], dur: 0.6 }), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Phew!', 1.2)), A.wait(1), A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A guitar combo amplifier: grille cloth, a control panel of knobs on top, a power light, a carrying handle.
  e('amp', 'music', 'audio gear', () => {
    const b = m('amp', { edge: 'sharp' })
      .box([0.5, 0.42, 0.25], [0, 0.23, 0], { color: '#2a2726', round: 0.12 })
      .box([0.44, 0.27, 0.02], [0, 0.18, 0.123], { color: '#5a5048', round: 0.05 })
      .cyl([0.22, 0.01, 0.22], [0, 0.18, 0.12], { color: '#3a3633', rot: [90, 0, 0] })
      .box([0.46, 0.07, 0.02], [0, 0.375, 0.123], { color: 'gold', round: 0.1 })
      .label('BLAZE', [0.1, 0.035], [-0.14, 0.27, 0.135], { color: 'white', depth: 0.003 })
      .ball(0.014, [0.2, 0.375, 0.135], { color: 'red', glow: true, name: 'power', mover: { kind: 'light' } })
      .rod([-0.08, 0.455, 0], [0.08, 0.455, 0], 0.025, 'black')
      .box([0.05, 0.03, 0.03], [-0.09, 0.44, 0], { color: 'black' })
      .box([0.05, 0.03, 0.03], [0.09, 0.44, 0], { color: 'black' });
    b.each(5, (i) => b.cyl([0.028, 0.02, 0.028], [-0.16 + i * 0.07, 0.375, 0.14], { color: 'black', rot: [90, 0, 0], name: i === 0 ? 'knob' : undefined }));
    b.pair((s) => b.pair((t) => b.box([0.04, 0.04, 0.04], [s * 0.235, 0.24 + t * 0.19, 0.11], { color: 'silver', round: 0.3 })));
    b.pair((s) => b.box([0.06, 0.02, 0.2], [s * 0.2, 0.01, 0], { color: 'rubber' }));
    return b
      .act({
        click: [
          [A.operate('power', 'on'), A.pose('knob', { rot: [0, 0, -120], dur: 0.6 }), A.par(A.anim('shake', 2), A.say('BZZT... WAAANG!', 2))],
          [A.pose('knob', { rot: [0, 0, 0], dur: 0.4 }), A.operate('power', 'off')],
        ],
      })
      .done();
  }),
  // A Greek-style open-air theatre, 30 m across: stone tiers of seats in a half ring with stairs, the round
  // orchestra floor, and a low stage with three doorways. The crowd applauds.
  e('amphitheater', 'places', 'landmarks', () => {
    const b = m('amphitheater', { edge: 'sharp' }).cyl([34, 0.2, 26], [0, 0.1, -2], { color: 'sand', edge: 'soft' });
    b.each(10, (i) => {
      const R = 6 + i * 1.0, hh = 0.25 + (i + 1) * 0.45;
      b.arc([2 * R, 2 * R, hh], [0, 0.2 + hh / 2, -2], { color: i % 2 ? '#d8cfb8' : '#cbc1a8', rot: [-90, 0, 0], tube: 1.0 / R, arc: 190 });
    });
    b.cyl([11, 0.1, 11], [0, 0.25, -2], { color: '#e8dcc0', edge: 'soft' })
      .box([16, 1.0, 4], [0, 0.5, 6.2], { color: '#c9bfa6', round: 0.05 })
      .box([16, 3.4, 0.8], [0, 2.7, 7.8], { color: '#d8cfb8', round: 0.05 });
    b.each(3, (i) => b.box([1.4, 2.2, 0.85], [-4.5 + i * 4.5, 2.1, 7.8], { color: '#5a4a3a' }));
    b.each(8, (i) => b.cyl([0.45, 3.4, 0.45], [-7 + i * 2, 2.7, 8.4], { color: 'white' }));
    return b.act({ click: [[A.par(A.effect('sparkle', { dur: 2 }), A.say('Clap clap clap! Bravo!', 2.5))]] }).done();
  }),
  // A gold amulet with a glowing purple stone on its chain, laid on a velvet cushion.
  e('amulet', 'fantasy', 'magic items', () =>
    m('amulet')
      .box([0.16, 0.04, 0.16], [0, 0.02, 0], { color: 'purple', round: 0.9 })
      .torus([0.11, 0.11, 0.006], [0, 0.043, -0.02], { color: 'gold', rot: [90, 0, 0], tube: 0.06 })
      .cyl([0.055, 0.01, 0.055], [0, 0.046, 0.04], { color: 'gold', edge: 'sharp' })
      .torus([0.058, 0.058, 0.01], [0, 0.05, 0.04], { color: 'gold', rot: [90, 0, 0], tube: 0.15 })
      .ball([0.028, 0.018, 0.028], [0, 0.055, 0.04], { color: 'violet', name: 'gem', mover: { kind: 'light' } })
      .act({ click: [[A.operate('gem', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Hmmmm...', 1.5)), A.wait(1.5), A.operate('gem', 'off')]] })
      .done(),
  ),
  // A funfair: a Ferris wheel with gondolas that turns, a carousel with a striped canopy that spins, an entrance
  // arch with lights, balloons and a ticket booth.
  e('amusement park', 'places', 'parks', () => {
    const b = m('amusement park', { edge: 'sharp' }).box([36, 0.2, 24], [0, 0.1, 0], { color: 'grass', round: 0.05, edge: 'soft' });
    b.box([30, 0.05, 3], [0, 0.22, 7], { color: 'sand' });
    // Ferris wheel
    b.pair((s) => b.rod([8 + s * 3.5, 0.2, -3 + 1.2], [8, 11, -3 + 0.3 * 1], 0.4, 'white').rod([8 + s * 3.5, 0.2, -3 - 1.2], [8, 11, -3 - 0.3], 0.4, 'white'));
    b.torus([18, 18, 0.4], [8, 11, -3], { color: 'pink', tube: 0.04, name: 'ride', mover: { kind: 'spin', axis: 'z', amount: 30 } })
      .torus([14, 14, 0.3], [8, 11, -3], { color: 'pink', tube: 0.03, parent: 'ride' })
      .cyl([1.2, 1.6, 1.2], [8, 11, -3], { color: 'gray', rot: [90, 0, 0], parent: 'ride' });
    b.each(6, (i) => {
      const a = (i * Math.PI) / 6;
      b.stick([8 - Math.cos(a) * 8.8, 11 - Math.sin(a) * 8.8, -3], [8 + Math.cos(a) * 8.8, 11 + Math.sin(a) * 8.8, -3], 0.12, 'white', { parent: 'ride' });
    });
    b.each(12, (i) => {
      const a = (i * Math.PI) / 6;
      b.box([1.4, 1.3, 1.6], [8 + Math.cos(a) * 9, 11 + Math.sin(a) * 9 - 0.9, -3], { color: RAINBOW[i % 6], round: 0.3, parent: 'ride' });
    });
    // carousel
    b.cyl([10, 0.5, 10], [-9, 0.45, -2], { color: 'gold', name: 'carousel', mover: { kind: 'spin', axis: 'y', amount: 60 } })
      .stick([-9, 0.7, -2], [-9, 5.2, -2], 0.8, 'gold', { parent: 'carousel' })
      .cone([11, 2.6, 11], [-9, 6.4, -2], { color: 'red', parent: 'carousel', segs: 12 })
      .cyl([11, 0.7, 11], [-9, 4.9, -2], { color: 'white', parent: 'carousel', segs: 12 })
      .ball(0.6, [-9, 7.9, -2], { color: 'gold', parent: 'carousel' });
    around(6, 3.8).forEach(([x, z], i) => {
      b.stick([-9 + x, 0.7, -2 + z], [-9 + x, 4.6, -2 + z], 0.1, 'silver', { parent: 'carousel' });
      b.box([0.4, 0.9, 1.5], [-9 + x, 1.9 + (i % 2) * 0.4, -2 + z], { color: i % 2 ? 'white' : 'tan', round: 0.5, parent: 'carousel', rot: [0, -Math.atan2(z, x) * RAD, 0] });
    });
    // entrance arch, ticket booth, balloons
    b.pair((s) => b.box([1.2, 6, 1.2], [s * 4, 3.2, 10], { color: 'red', round: 0.2 }).cone([1.6, 1.4, 1.6], [s * 4, 6.9, 10], { color: 'yellow', segs: 8 }));
    b.box([9, 1.4, 0.5], [0, 5.6, 10], { color: 'blue', round: 0.2 })
      .label('FUNFAIR', [6.5, 1.0], [0, 5.6, 10.27], { color: 'yellow', depth: 0.05 })
      .box([2.2, 2.6, 2], [-8, 1.5, 9], { color: 'white' })
      .wedge([2.8, 1.0, 2.4], [-8, 3.3, 9], { color: 'red' })
      .box([1.4, 0.8, 0.05], [-8, 1.8, 10.02], { color: WIN });
    b.each(5, (i) => b.ball([0.6, 0.75, 0.6], [12 + (i % 3) * 0.6, 4.5 + (i % 2) * 0.8, 9 + i * 0.3], { color: RAINBOW[i], edge: 'soft' }).stick([12 + (i % 3) * 0.6, 4.1 + (i % 2) * 0.8, 9 + i * 0.3], [12.5, 1.2, 9.6], 0.03, 'white'));
    b.ball([0.6, 1.0, 0.6], [12.5, 1.0, 9.6], { color: 'skin2', edge: 'soft' });
    return b
      .act({ click: [[A.operate('ride', 'on'), A.operate('carousel', 'on'), A.say('Wheee!', 2), A.wait(3.5), A.operate('ride', 'off'), A.operate('carousel', 'off')]] })
      .done();
  }),
  // A cast-iron admiralty anchor, 2 m tall: ring, stock, shank, curved arms and flukes, with a coil of rope.
  e('anchor (boat)', 'sea', 'nautical', () => {
    const b = m('anchor (boat)')
      .stick([0, 0.25, 0], [0, 1.8, 0], 0.13, 'iron')
      .torus([0.36, 0.36, 0.07], [0, 1.98, 0], { color: 'iron', tube: 0.22 })
      .stick([0, 1.6, -0.55], [0, 1.6, 0.55], 0.09, 'iron')
      .ball(0.22, [0, 0.22, 0], { color: 'iron' })
      .rod([0.12, 2.05, 0.04], [0.35, 1.7, 0.1], 0.05, 'tan')
      .rod([0.35, 1.7, 0.1], [0.3, 1.2, 0.12], 0.05, 'tan')
      .torus([0.5, 0.5, 0.1], [0.45, 0.06, 0.4], { color: 'tan', rot: [90, 0, 0], tube: 0.3 });
    b.pair((s) => {
      b.ball(0.13, [0, 1.6, s * 0.55], { color: 'iron' });
      b.rod([0, 0.2, 0], [s * 0.32, 0.12, 0], 0.11, 'iron').rod([s * 0.32, 0.12, 0], [s * 0.58, 0.28, 0], 0.11, 'iron').rod([s * 0.58, 0.28, 0], [s * 0.7, 0.55, 0], 0.11, 'iron');
      spike(b, [s * 0.62, 0.42, 0], [s * 0.76, 0.8, 0], 0.3, 'iron', { segs: 3, edge: 'sharp' });
    });
    return b.act({ click: [[A.anim('hop'), A.par(A.effect('dust', { dur: 1 }), A.say('CLANK!', 1.2))], [A.par(A.anim('wobble'), A.say('Heave ho!', 1.5))]] }).done();
  }),
  // A ring-shaped angel food cake on a cake stand, berries on top; a slice comes away.
  e('angel food cake', 'food', 'cakes', () => {
    const b = m('angel food cake')
      .cyl([0.3, 0.012, 0.3], [0, 0.1, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.1, 0.09, 0.1], [0, 0.05, 0], { color: 'white', taper: 0.5, edge: 'sharp' })
      .cyl([0.25, 0.1, 0.25], [0, 0.155, 0], { color: '#f3dfb5', taper: 0.88, name: 'cake' })
      .cyl([0.07, 0.102, 0.07], [0, 0.156, 0], { color: '#fff6e4' })
      .torus([0.22, 0.22, 0.03], [0, 0.205, 0], { color: '#d8a868', rot: [90, 0, 0], tube: 0.3 })
      .box([0.06, 0.098, 0.08], [0, 0.155, 0.11], { color: '#fff3d6', name: 'slice', parent: 'cake', piece: true, round: 0.2 })
      .box([0.062, 0.02, 0.082], [0, 0.205, 0.11], { color: '#d8a868', parent: 'slice', round: 0.4 });
    around(6, 0.08).forEach(([x0, z], i) => b.ball(0.025, [x0, 0.218, z], { color: i % 2 ? 'red' : '#3a4a9a' }));
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // Feathered costume angel wings hanging on a stand; they flap and shed sparkles.
  e('angel wings', 'wardrobe', 'costumes', () => {
    const b = m('angel wings')
      .cyl([0.36, 0.03, 0.36], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, -0.1], [0, 1.45, -0.1], 0.03, 'darkwood')
      .box([0.12, 0.16, 0.05], [0, 1.25, -0.06], { color: 'gold', round: 0.5 });
    b.pair((s) => {
      const w = s > 0 ? 'wingL' : 'wingR';
      b.ball([0.36, 0.56, 0.07], [s * 0.2, 1.33, -0.04], { color: 'white', rot: [0, 0, -s * 30], name: w, pivot: [s * 0.04, 1.25, -0.04] });
      b.ball([0.3, 0.44, 0.07], [s * 0.27, 1.15, -0.02], { color: 'white', rot: [0, 0, -s * 50], parent: w });
      b.ball([0.22, 0.3, 0.07], [s * 0.24, 0.98, 0.0], { color: 'snow', rot: [0, 0, -s * 70], parent: w });
      b.ball([0.12, 0.22, 0.04], [s * 0.36, 1.32, 0.0], { color: 'snow', rot: [0, 0, -s * 40], parent: w });
    });
    const flap = (a: number) => A.par(A.pose('wingL', { rot: [0, -a, 0], dur: 0.25 }), A.pose('wingR', { rot: [0, a, 0], dur: 0.25 }));
    return b.act({ click: [[A.effect('sparkle', { dur: 2 }), flap(35), flap(0), flap(35), flap(0)]] }).done();
  }),
  // A sack of pet food and a steel bowl of kibble: it gets eaten, then the bag tips and fills the bowl again.
  e('animal food', 'pets', 'pet supplies', () => {
    const b = m('animal food')
      .box([0.24, 0.36, 0.12], [0.1, 0.18, -0.05], { color: 'red', round: 0.3, name: 'bag', pivot: [0.0, 0.0, -0.05] })
      .box([0.24, 0.05, 0.08], [0.1, 0.375, -0.05], { color: 'darkred', round: 0.3, parent: 'bag' })
      .label('PET FOOD', [0.18, 0.08], [0.1, 0.22, 0.012], { color: 'yellow', parent: 'bag', depth: 0.003 })
      .ball([0.07, 0.05, 0.01], [0.1, 0.12, 0.014], { color: 'tan', parent: 'bag', noInk: true })
      .cyl([0.18, 0.06, 0.18], [-0.12, 0.03, 0.1], { color: 'steel', taper: 1.25, edge: 'sharp' })
      .ball([0.17, 0.05, 0.17], [-0.12, 0.06, 0.1], { color: '#8a5a2b', name: 'kibble', piece: true });
    around(5, 0.035).forEach(([x0, z]) => b.ball(0.02, [-0.12 + x0, 0.08, 0.1 + z], { color: '#a8703a', parent: 'kibble' }));
    return b
      .act({
        click: [
          [A.par(A.pose('kibble', { scale: 0.4, dur: 1.2 }), A.say('Crunch, crunch!', 1.5))],
          [A.pose('bag', { rot: [0, 0, 35], dur: 0.5 }), A.par(A.pose('kibble', { scale: 1, dur: 0.8 }), A.effect('dust', { dur: 0.8 })), A.pose('bag', { rot: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // An animal shelter: a single-storey building with a sign and a heart, a fenced dog run with a kennel; a pup
  // comes out to say hello.
  e('animal shelter', 'places', 'services', () => {
    const b = bldg('animal shelter', { w: 10, d: 7, wall: '#bfe0f0', roof: 'teal', trim: 'white', sign: 'ANIMAL SHELTER', signColor: 'navy', doorColor: '#3a6a8a' });
    b.heart(0.9, [3.3, 4.6, 3.6], { color: 'red' });
    b.box([4.5, 0.08, 5], [7.4, 0.04, 1], { color: 'grass', edge: 'soft' });
    b.each(6, (i) => b.stick([5.2 + i * 0.88, 0, 3.5], [5.2 + i * 0.88, 1.2, 3.5], 0.06, 'gray'));
    b.each(5, (i) => b.stick([9.6, 0, 3.5 - i * 1.2], [9.6, 1.2, 3.5 - i * 1.2], 0.06, 'gray'));
    b.box([4.4, 1.1, 0.03], [7.4, 0.6, 3.5], { color: '#c9ccd1', noInk: true }).box([0.03, 1.1, 4.8], [9.6, 0.6, 1.1], { color: '#c9ccd1', noInk: true });
    b.box([1.0, 0.8, 1.2], [8.4, 0.4, -0.2], { color: 'wood' }).wedge([1.3, 0.55, 1.4], [8.4, 1.07, -0.2], { color: 'red' }).box([0.4, 0.45, 0.04], [8.4, 0.3, 0.42], { color: '#2a2726', round: 0.5 });
    return b
      .act({ click: [[A.operate('door', 'open'), A.spawn('pup', 'dog', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.say('Woof! Woof!', 1.5, 'pup'), A.anim('wag', 2, 'pup')), A.wait(1.5), A.remove('pup', 'fade'), A.operate('door', 'close')]] })
      .done();
  }),
  // An anatomy model of the ankle: shin, heel and foot on a stand; the foot points and flexes at the joint.
  e('ankle', 'clinic', 'body parts', () => {
    const b = m('ankle')
      .box([0.2, 0.03, 0.3], [0, 0.015, 0.03], { color: 'darkwood', edge: 'sharp' })
      .capsule([0.09, 0.32, 0.09], [0, 0.32, -0.02], { color: 'skin2' })
      .ball([0.09, 0.09, 0.09], [0, 0.13, -0.025], { color: 'skin2' })
      .box([0.085, 0.06, 0.2], [0, 0.07, 0.06], { color: 'skin2', round: 0.9, name: 'foot', pivot: [0, 0.12, -0.02], piece: true })
      .ball([0.07, 0.06, 0.07], [0, 0.07, -0.04], { color: 'skin2', parent: 'foot' });
    b.pair((s) => b.ball(0.03, [s * 0.042, 0.13, -0.02], { color: 'skin3' }));
    b.each(5, (i) => b.ball(0.022 - i * 0.002, [0.03 - i * 0.015, 0.055, 0.165 - i * 0.004], { color: 'skin2', parent: 'foot' }));
    return b
      .act({ click: [[A.pose('foot', { rot: [25, 0, 0], dur: 0.5 }), A.wait(0.3), A.pose('foot', { rot: [-20, 0, 0], dur: 0.6 }), A.wait(0.3), A.pose('foot', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A desk answering machine with a cordless handset in its cradle, a tape window, buttons, a message counter and
  // a blinking light; it plays the message back.
  e('answering machine', 'tech', 'phones', () => {
    const b = m('answering machine', { edge: 'sharp' })
      .box([0.24, 0.05, 0.17], [0, 0.025, 0], { color: '#3a3633', round: 0.3 })
      .box([0.1, 0.012, 0.06], [0.05, 0.053, 0.03], { color: GL, round: 0.2 })
      .box([0.03, 0.02, 0.008], [-0.08, 0.052, 0.07], { color: '#300', round: 0.2 })
      .ball(0.012, [-0.1, 0.055, 0.05], { color: 'red', glow: true, name: 'led', mover: { kind: 'light' } })
      .box([0.06, 0.02, 0.2], [-0.04, 0.07, -0.05], { color: '#2a2726', round: 0.5, rot: [0, 90, 0], name: 'handset', piece: true })
      .box([0.03, 0.01, 0.025], [-0.13, 0.08, -0.05], { color: 'gray', parent: 'handset' })
      .label('MSG', [0.025, 0.012], [-0.08, 0.052, 0.076], { color: '#300', depth: 0.002 });
    b.each(4, (i) => b.box([0.022, 0.01, 0.018], [-0.06 + i * 0.03, 0.053, 0.0], { color: i === 0 ? 'green' : 'lightgray' }));
    b.each(4, (i) => b.box([0.025, 0.003, 0.002], [0.05, 0.06, 0.003 + i * 0.012], { color: 'darkgray', noInk: true }));
    return b
      .act({ click: [[A.operate('led', 'on'), A.say('Beep! You have one new message.', 2.5), A.wait(2.5), A.operate('led', 'off')], [A.pose('handset', { move: [0, 0.08, 0.03], dur: 0.4 }), A.say('Hello?', 1.5), A.wait(1.2), A.pose('handset', { move: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A sand-filled ant farm between two panes, green frame, tunnels and chambers, and ants that wander about.
  e('ant farm', 'bugs', 'bug homes', () => {
    const b = m('ant farm', { edge: 'sharp' })
      .box([0.34, 0.03, 0.08], [0, 0.015, 0], { color: 'green' })
      .box([0.3, 0.17, 0.025], [0, 0.115, 0], { color: 'sand', round: 0.05, edge: 'soft' })
      .box([0.3, 0.06, 0.025], [0, 0.23, 0], { color: 'glass', round: 0.05 })
      .box([0.32, 0.025, 0.04], [0, 0.27, 0], { color: 'green' });
    const tun: Array<[Vec3, Vec3]> = [[[-0.11, 0.2, 0.013], [-0.07, 0.12, 0.013]], [[-0.07, 0.12, 0.013], [0.04, 0.09, 0.013]], [[0.04, 0.09, 0.013], [0.09, 0.19, 0.013]], [[0.0, 0.1, 0.013], [-0.02, 0.05, 0.013]], [[0.04, 0.09, 0.013], [0.1, 0.06, 0.013]]];
    for (const [a, t] of tun) b.rod(a, t, 0.011, 'dirt', { noInk: true });
    b.ball([0.03, 0.014, 0.012], [-0.03, 0.05, 0.014], { color: 'dirt', noInk: true }).ball([0.028, 0.014, 0.012], [0.1, 0.06, 0.014], { color: 'dirt', noInk: true });
    b.pair((s) => b.box([0.018, 0.25, 0.04], [s * 0.159, 0.145, 0], { color: 'green' }));
    b.ball([0.012, 0.005, 0.005], [-0.09, 0.16, 0.016], { color: 'black', noInk: true, name: 'ant', piece: true })
      .ball([0.012, 0.005, 0.005], [0.06, 0.13, 0.016], { color: 'black', noInk: true, name: 'ant2', piece: true })
      .ball([0.012, 0.005, 0.005], [0.0, 0.092, 0.016], { color: 'black', noInk: true });
    return b
      .act({ click: [[A.par(A.pose('ant', { move: [0.03, -0.06, 0], dur: 1.5 }), A.pose('ant2', { move: [-0.08, -0.03, 0], dur: 1.5 })), A.par(A.pose('ant', { move: [0, 0, 0], dur: 1.5 }), A.pose('ant2', { move: [0, 0, 0], dur: 1.5 }))]] })
      .done();
  }),
  // An ant hill: a crumbly mound of soil and needles with an entrance at the top; ants march out and back.
  e('ant hill', 'bugs', 'bug homes', () => {
    const b = m('ant hill')
      .cyl([0.8, 0.3, 0.8], [0, 0.15, 0], { color: 'dirt', taper: 0.35 })
      .ball([0.32, 0.14, 0.32], [0, 0.3, 0], { color: '#7a5634' })
      .cyl([0.05, 0.02, 0.05], [0, 0.37, 0.0], { color: '#2a2726' });
    around(9, 0.3, 0.3).forEach(([x0, z]) => b.ball([0.03, 0.02, 0.025], [x0 * 0.8, 0.12, z * 0.8], { color: '#a07a50' }));
    around(6, 0.16).forEach(([x0, z]) => b.rod([x0, 0.27, z], [x0 * 1.3, 0.23, z * 1.3 + 0.02], 0.006, '#c9a46a', { noInk: true }));
    b.ball([0.012, 0.005, 0.005], [0.02, 0.36, 0.03], { color: 'black', name: 'ant', piece: true })
      .ball([0.012, 0.005, 0.005], [-0.03, 0.34, 0.05], { color: 'black', name: 'ant2', piece: true })
      .ball([0.012, 0.005, 0.005], [0.15, 0.17, 0.28], { color: 'black' });
    return b
      .act({ click: [[A.par(A.pose('ant', { move: [0.12, -0.2, 0.28], dur: 2 }), A.pose('ant2', { move: [-0.2, -0.22, 0.22], dur: 2 })), A.par(A.pose('ant', { move: [0, 0, 0], dur: 2 }), A.pose('ant2', { move: [0, 0, 0], dur: 2 }))]] })
      .done();
  }),
  // A rooftop TV aerial on a mast with a bracket base: a Yagi boom of elements and a reflector; it turns to find a
  // signal.
  e('antenna (metal)', 'tech', 'antennas', () => {
    const b = m('antenna (metal)', { edge: 'sharp' })
      .box([0.4, 0.1, 0.4], [0, 0.05, 0], { color: 'darkgray', round: 0.2 })
      .stick([0, 0.1, 0], [0, 2.2, 0], 0.045, 'steel')
      .stick([0, 2.0, -0.6], [0, 2.0, 0.7], 0.03, 'metal', { name: 'yagi', pivot: [0, 2.0, 0] })
      .box([0.12, 0.08, 0.08], [0, 2.0, 0], { color: 'darkgray', parent: 'yagi' });
    b.each(7, (i) => b.stick([-0.28 + i * 0.025, 2.0, -0.45 + i * 0.18], [0.28 - i * 0.025, 2.0, -0.45 + i * 0.18], 0.012, 'silver', { parent: 'yagi' }));
    b.box([0.6, 0.35, 0.02], [0, 2.0, -0.6], { color: 'silver', parent: 'yagi', round: 0 });
    b.pair((s) => b.rod([0, 0.12, 0], [s * 0.18, 0.8, 0], 0.02, 'steel').rod([0, 0.12, 0], [0, 0.8, s * 0.18], 0.02, 'steel'));
    b.rod([0.02, 1.9, 0.02], [0.12, 0.1, 0.12], 0.012, 'black');
    return b
      .act({ click: [[A.pose('yagi', { rot: [0, 90, 0], dur: 1.5 }), A.say('Bzzt... crackle...', 1.5), A.pose('yagi', { rot: [0, 0, 0], dur: 1.5 }), A.say('Ah, a picture!', 1.5)]] })
      .done();
  }),
  // A small vial of glowing antidote with a cork stopper and a cross on its label; the cork comes out.
  e('antidote', 'clinic', 'medicine', () =>
    m('antidote')
      .cyl([0.045, 0.06, 0.045], [0, 0.03, 0], { color: 'teal', glow: true, name: 'vial' })
      .cyl([0.047, 0.035, 0.047], [0, 0.077, 0], { color: 'glass' })
      .cyl([0.02, 0.025, 0.02], [0, 0.105, 0], { color: 'glass' })
      .torus([0.026, 0.026, 0.006], [0, 0.117, 0], { color: 'glass', rot: [90, 0, 0] })
      .cyl([0.022, 0.022, 0.022], [0, 0.125, 0], { color: 'wood', taper: 1.2, name: 'cork', parent: 'vial', piece: true })
      .box([0.032, 0.03, 0.004], [0, 0.04, 0.023], { color: 'white', round: 0.2, edge: 'sharp' })
      .box([0.016, 0.005, 0.002], [0, 0.04, 0.026], { color: 'red', round: 0 })
      .box([0.005, 0.016, 0.002], [0, 0.04, 0.026], { color: 'red', round: 0 })
      .act({ click: [[A.detach('cork', 'cork'), A.effect('sparkle', { dur: 1.5 })], [A.reattach('cork')]] })
      .done(),
  ),
  // A jug of bright green antifreeze with a handle and cap; it tips to pour and rights itself.
  e('antifreeze', 'garage', 'car care', () =>
    m('antifreeze')
      .box([0.2, 0.27, 0.11], [0, 0.135, 0], { color: '#3ccf4e', round: 0.35, name: 'jug', pivot: [-0.1, 0, 0] })
      .arc([0.1, 0.09, 0.035], [-0.04, 0.27, 0], { color: '#3ccf4e', tube: 0.35, parent: 'jug' })
      .cyl([0.045, 0.04, 0.045], [0.06, 0.29, 0], { color: 'yellow', parent: 'jug', edge: 'sharp' })
      .label('ANTIFREEZE', [0.16, 0.09], [0, 0.12, 0.056], { color: 'yellow', parent: 'jug', depth: 0.003 })
      .act({ click: [[A.pose('jug', { rot: [0, 0, -50], dur: 0.6 }), A.par(A.say('Glug glug glug...', 1.8), A.effect('water_spray', { dur: 1.2 })), A.wait(1.2), A.pose('jug', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // An antique shop: two storeys of dark red brick with gold lettering, a shop window full of old things (a
  // grandfather clock, a vase, a gramophone) and a bell over the door that rings when it opens.
  e('antique shop', 'places', 'shops', () => {
    const b = bldg('antique shop', { w: 7, d: 6, floors: 2, wall: 'maroon', trim: 'cream', roof: 'darkbrown', doorColor: 'darkgreen', sign: 'ANTIQUES', signColor: 'gold', shopWindow: true });
    b.box([0.5, 1.8, 0.35], [-2.2, 1.2, 2.7], { color: 'darkwood' })
      .cyl([0.36, 0.04, 0.36], [-2.2, 1.75, 2.88], { color: 'cream', rot: [90, 0, 0] })
      .cyl([0.4, 0.5, 0.4], [2.0, 0.65, 2.7], { color: 'blue', taper: 0.5, edge: 'soft' })
      .ball([0.5, 0.45, 0.5], [2.0, 0.95, 2.7], { color: 'blue', edge: 'soft' })
      .box([0.5, 0.25, 0.4], [3.0, 0.6, 2.7], { color: 'darkwood' })
      .cone([0.5, 0.5, 0.5], [3.0, 1.05, 2.8], { color: 'brass', rot: [-60, 0, 0] })
      .arc([0.3, 0.3, 0.05], [0, 2.75, 3.15], { color: 'brass', arc: 200 })
      .dome([0.22, 0.2, 0.22], [0, 2.55, 3.15], { color: 'brass', rot: [180, 0, 0], name: 'bell', pivot: [0, 2.75, 3.15] });
    return b
      .act({ click: [[A.operate('door', 'open'), A.par(A.pose('bell', { rot: [0, 0, 25], dur: 0.15 }), A.say('Ding-a-ling!', 1.5)), A.pose('bell', { rot: [0, 0, -25], dur: 0.2 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.2 }), A.wait(1.5), A.operate('door', 'close')]] })
      .done();
  }),
  // A shed deer antler lying on a log slice: the beam with its brow tine and points.
  e('antler', 'wild', 'antlers and horns', () => {
    const b = m('antler')
      .cyl([0.3, 0.06, 0.26], [0, 0.03, 0], { color: 'wood' })
      .cyl([0.28, 0.005, 0.24], [0, 0.062, 0], { color: 'lightwood' })
      .ball([0.07, 0.05, 0.07], [-0.08, 0.09, 0], { color: '#bfa98a' })
      .rod([-0.08, 0.09, 0], [0.0, 0.3, -0.03], 0.045, '#e3d6bd')
      .rod([0.0, 0.3, -0.03], [0.06, 0.55, -0.06], 0.04, '#e3d6bd')
      .rod([0.06, 0.55, -0.06], [0.0, 0.76, -0.02], 0.035, '#e3d6bd');
    const tines: Array<[Vec3, Vec3]> = [[[-0.06, 0.13, 0.0], [0.04, 0.22, 0.1]], [[0.0, 0.3, -0.03], [0.1, 0.46, 0.06]], [[0.05, 0.5, -0.05], [0.14, 0.66, 0.0]], [[0.04, 0.66, -0.05], [-0.08, 0.82, -0.06]]];
    for (const [a, t] of tines) spike(b, a, t, 0.035, '#efe4cf');
    return b.act({ click: [[A.par(A.anim('wobble'), A.say('Clack!', 1))]] }).done();
  }),
  // A mounted pair of antlers on a shield plaque, used as a hat hook: a beanie gets hung on a tine.
  e('antlers', 'wild', 'antlers and horns', () => {
    const b = m('antlers')
      .box([0.34, 0.42, 0.04], [0, 0.6, -0.04], { color: 'darkwood', round: 0.5, edge: 'sharp' })
      .cone([0.34, 0.16, 0.04], [0, 0.32, -0.04], { color: 'darkwood', rot: [180, 0, 0], segs: 4, edge: 'sharp' })
      .ball([0.16, 0.14, 0.12], [0, 0.7, 0.03], { color: '#bfa98a' })
      .box([0.6, 0.02, 0.4], [0, 0.01, -0.1], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.02, -0.08], [0, 0.4, -0.08], 0.04, 'darkwood');
    b.pair((s) => {
      b.rod([s * 0.05, 0.74, 0.04], [s * 0.22, 0.86, 0.06], 0.045, '#e3d6bd').rod([s * 0.22, 0.86, 0.06], [s * 0.32, 1.08, 0.04], 0.04, '#e3d6bd');
      spike(b, [s * 0.15, 0.82, 0.05], [s * 0.14, 1.0, 0.14], 0.035, '#efe4cf');
      spike(b, [s * 0.25, 0.93, 0.05], [s * 0.2, 1.14, 0.06], 0.035, '#efe4cf');
      spike(b, [s * 0.3, 1.04, 0.04], [s * 0.42, 1.18, 0.02], 0.035, '#efe4cf');
    });
    return b
      .socket('hook', [0.15, 0.96, 0.14], 'hook', { size: 0.25 })
      .act({ click: [[A.spawn('hat', 'beanie'), A.attach('hat', 'self', 'hook')], [A.remove('self.hook', 'pop')]] })
      .done();
  }),
  // A blacksmith's anvil on a tree stump, a red-hot horseshoe on its face: clang, sparks, then a hiss as it cools.
  e('anvil', 'workshop', 'blacksmith', () => {
    const b = m('anvil', { edge: 'sharp' })
      .cyl([0.5, 0.5, 0.5], [0, 0.25, 0], { color: 'bark', edge: 'soft' })
      .cyl([0.46, 0.02, 0.46], [0, 0.505, 0], { color: 'lightwood' })
      .box([0.34, 0.1, 0.24], [0, 0.565, 0], { color: 'iron', round: 0.2 })
      .box([0.17, 0.14, 0.13], [0, 0.685, 0], { color: 'iron', round: 0.1 })
      .box([0.44, 0.11, 0.17], [-0.03, 0.81, 0], { color: 'iron', round: 0.15 })
      .cone([0.13, 0.26, 0.12], [0.31, 0.815, 0], { color: 'iron', rot: [0, 0, -90], edge: 'soft' })
      .box([0.42, 0.01, 0.15], [-0.03, 0.866, 0], { color: 'steel', round: 0 })
      .arc([0.11, 0.12, 0.016], [-0.06, 0.876, 0], { color: 'orange', rot: [90, 0, 0], arc: 250, tube: 0.25, name: 'shoe', glow: true, mover: { kind: 'light', on: true } });
    return b
      .act({ click: [[A.par(A.effect('sparkle', { dur: 0.6 }), A.say('CLANG!', 0.8), A.anim('shake')), A.wait(0.5), A.par(A.effect('sparkle', { dur: 0.6 }), A.say('CLANG!', 0.8))], [A.operate('shoe', 'off'), A.par(A.effect('steam', { dur: 1.5 }), A.say('Tssssss!', 1.5)), A.wait(1.5), A.operate('shoe', 'on')]] })
      .done();
  }),
  // A three-storey apartment block: a door under a canopy, balconies on the upper floors, a water tank on the roof;
  // the flats' lights come on one by one.
  e('apartment', 'places', 'homes', () => {
    const b = bldg('apartment', { w: 10, d: 8, floors: 3, wall: '#d9a679', trim: 'white', roofKind: 'flat', roof: '#6b6f73', doorColor: '#3a3633', cols: 4, lights: true, glassDoor: true, sign: '12', signColor: 'white' });
    b.box([2.6, 0.2, 1.4], [0, 2.8, 4.7], { color: 'white' });
    b.each(2, (f) => b.pair((s) => {
      const y = 3.3 + f * 3;
      b.box([2.6, 0.15, 1.1], [s * 2.5, y, 4.55], { color: 'lightgray' });
      b.box([2.6, 0.9, 0.05], [s * 2.5, y + 0.5, 5.1], { color: 'white', noInk: true });
      b.box([0.05, 0.9, 1.1], [s * 2.5 + 1.28, y + 0.5, 4.55], { color: 'white', noInk: true }).box([0.05, 0.9, 1.1], [s * 2.5 - 1.28, y + 0.5, 4.55], { color: 'white', noInk: true });
    }));
    b.cyl([1.6, 1.2, 1.6], [3, 10.9, -2], { color: 'gray' }).cone([1.7, 0.5, 1.7], [3, 11.75, -2], { color: 'darkgray' });
    b.pair((s) => b.stick([3 + s * 0.6, 10.0, -2], [3 + s * 0.6, 10.4, -2], 0.1, 'darkgray'));
    const on = [1, 6, 3, 9, 12, 4, 11].map((i) => A.operate(`light${i}`, 'on'));
    return b
      .act({ click: [[on[0], A.wait(0.4), on[1], A.wait(0.4), on[2], A.wait(0.4), on[3], A.wait(0.4), on[4], A.wait(0.4), on[5], A.wait(0.4), on[6]], [A.operate('light', 'off')]] })
      .done();
  }),
  // Lab apparatus for distilling: a retort stand, a round flask over a burner, a glass condenser and a receiving
  // flask that fills when the burner is lit.
  e('apparatus', 'study', 'lab gear', () =>
    m('apparatus')
      .box([0.5, 0.02, 0.24], [0, 0.01, 0], { color: 'darkgray', round: 0.2, edge: 'sharp' })
      .stick([-0.17, 0.02, -0.06], [-0.17, 0.72, -0.06], 0.015, 'silver')
      .stick([-0.17, 0.4, -0.06], [-0.04, 0.4, -0.06], 0.01, 'silver')
      .torus([0.1, 0.1, 0.012], [0, 0.36, -0.06], { color: 'silver', rot: [90, 0, 0], tube: 0.12 })
      .ball(0.14, [0, 0.42, -0.06], { color: 'glass' })
      .ball([0.12, 0.07, 0.12], [0, 0.39, -0.06], { color: 'magenta' })
      .cyl([0.04, 0.12, 0.04], [0, 0.54, -0.06], { color: 'glass' })
      .rod([0, 0.6, -0.06], [0.2, 0.45, -0.06], 0.022, 'glass')
      .rod([0.2, 0.45, -0.06], [0.2, 0.2, -0.06], 0.012, 'glass')
      .cyl([0.12, 0.13, 0.12], [0.2, 0.09, -0.06], { color: 'glass', taper: 0.4 })
      .cyl([0.1, 0.06, 0.1], [0.2, 0.05, -0.06], { color: 'magenta', taper: 0.7, name: 'distillate', piece: true })
      .cyl([0.05, 0.16, 0.05], [0, 0.1, -0.06], { color: 'steel', edge: 'sharp' })
      .cone([0.045, 0.12, 0.045], [0, 0.24, -0.06], { color: 'cyan', glow: true, name: 'flame', mover: { kind: 'light' } })
      .act({ click: [[A.operate('flame', 'on'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Blub blub blub...', 2)), A.pose('distillate', { scale: 1.3, dur: 2 }), A.operate('flame', 'off')], [A.pose('distillate', { scale: 1, dur: 0.6 })]] })
      .done(),
  ),
  // An apple core with its stalk and pips; a little worm peeks out of it.
  e('apple core', 'food', 'fruit', () =>
    m('apple core')
      .ball([0.075, 0.035, 0.075], [0, 0.018, 0], { color: 'red', name: 'core' })
      .ball([0.07, 0.03, 0.07], [0, 0.034, 0], { color: '#f3e6c4' })
      .cyl([0.035, 0.05, 0.035], [0, 0.064, 0], { color: '#f3e6c4' })
      .ball([0.07, 0.03, 0.07], [0, 0.094, 0], { color: '#f3e6c4' })
      .ball([0.075, 0.035, 0.075], [0, 0.11, 0], { color: 'red' })
      .rod([0, 0.125, 0], [0.006, 0.15, 0], 0.007, 'darkbrown')
      .ball([0.008, 0.012, 0.006], [0.006, 0.065, 0.018], { color: 'darkbrown' })
      .ball([0.008, 0.012, 0.006], [-0.008, 0.06, 0.017], { color: 'darkbrown' })
      .capsule([0.01, 0.03, 0.01], [0, 0.07, 0.0], { color: 'lime', rot: [90, 0, 0], name: 'worm', parent: 'core', piece: true })
      .act({ click: [[A.pose('worm', { move: [0, 0, 0.03], dur: 0.6 }), A.say('Peekaboo!', 1.5), A.wait(1), A.pose('worm', { move: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // An apple pie in its tin: golden lattice, fluted crust; a slice comes out steaming.
  e('apple pie', 'food', 'pies', () => {
    const b = m('apple pie')
      .cyl([0.25, 0.04, 0.25], [0, 0.02, 0], { color: 'metal', taper: 1.12, edge: 'sharp', name: 'tin' })
      .cyl([0.25, 0.03, 0.25], [0, 0.045, 0], { color: '#d9a35f' })
      .torus([0.27, 0.27, 0.035], [0, 0.05, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.11 });
    b.each(3, (i) => b.box([0.21, 0.01, 0.022], [0, 0.066, -0.06 + i * 0.06], { color: 'crust', round: 0.5 }));
    b.each(3, (i) => b.box([0.022, 0.01, 0.21], [-0.06 + i * 0.06, 0.068, 0], { color: 'crust', round: 0.5 }));
    b.box([0.06, 0.05, 0.09], [0, 0.045, 0.08], { color: '#e8c06a', name: 'slice', parent: 'tin', piece: true, round: 0.2 })
      .box([0.065, 0.012, 0.095], [0, 0.072, 0.08], { color: 'crust', parent: 'slice', round: 0.4 });
    return b.act({ click: [[A.detach('slice', 'slice'), A.effect('steam', { dur: 1.5 })], [A.reattach('slice')]] }).done();
  }),
  // A jar of apple sauce with a red lid that twists off.
  e('apple sauce', 'food', 'jars', () =>
    m('apple sauce')
      .cyl([0.09, 0.12, 0.09], [0, 0.06, 0], { color: '#e8cf7a', name: 'jar' })
      .cyl([0.092, 0.05, 0.092], [0, 0.055, 0], { color: 'white' })
      .label('APPLE SAUCE', [0.06, 0.03], [0, 0.055, 0.045], { color: 'white', depth: 0.003 })
      .ball(0.025, [0.0, 0.08, 0.04], { color: 'red' })
      .cyl([0.094, 0.022, 0.094], [0, 0.131, 0], { color: 'red', name: 'lid', parent: 'jar', piece: true, edge: 'sharp' })
      .act({ click: [[A.pose('lid', { move: [0, 0.04, 0], rot: [0, 300, 0], dur: 0.6 }), A.say('Pop!', 1), A.wait(1), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })]] })
      .done(),
  ),
  // An apple tree at its real 5.5 m, red apples in the crown: shake it and one falls.
  e('apple tree', 'garden', 'fruit trees', () => tree2('apple tree', 5.5, { fruit: 'red', fruitSize: 0.09, n: 14 }).act({ click: [[A.anim('shake'), A.detach('fruit', 'apple')], [A.reattach('fruit')]] }).done()),
  // An apricot tree at its real 5 m, orange fruit among paler leaves: the wind sways it and drops one.
  e('apricot tree', 'garden', 'fruit trees', () =>
    tree2('apricot tree', 5, { fruit: '#f4a340', crown: '#6aa84f', crown2: '#7cb85a', fruitSize: 0.06, n: 14, w: 0.7 })
      .act({ click: [[A.pose('top', { rot: [0, 0, 6], dur: 0.6 }), A.pose('top', { rot: [0, 0, -4], dur: 0.6 }), A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.5 }), A.detach('fruit', 'apricot'))], [A.reattach('fruit')]] })
      .done(),
  ),
  // A kitchen apron on a dress form: bib, waist ties, a front pocket; dusted with flour, it gets a shake.
  e('apron', 'wardrobe', 'aprons', () =>
    mannequin('apron')
      .box([0.37, 0.04, 0.25], [0, 1.08, 0], { color: 'red', round: 0.5 })
      .box([0.26, 0.28, 0.025], [0, 1.28, 0.12], { color: 'red', round: 0.3 })
      .box([0.44, 0.52, 0.03], [0, 0.82, 0.13], { color: 'red', round: 0.3 })
      .box([0.22, 0.12, 0.02], [0, 0.84, 0.15], { color: 'white', round: 0.3 })
      .torus([0.14, 0.14, 0.018], [0, 1.47, 0.02], { color: 'red', rot: [70, 0, 0], tube: 0.15 })
      .ball([0.1, 0.06, 0.02], [0.08, 1.0, 0.15], { color: 'white', noInk: true })
      .act({ click: [[A.par(A.anim('wobble'), A.effect('dust', { dur: 1.2 }), A.say('Puff!', 1))]] })
      .done(),
  ),
  // A public aquarium: a long blue hall with a curved glass roof like a wave, fish murals on the glass front,
  // a revolving entrance, and a whale-tail fountain that splashes.
  e('aquarium (building)', 'places', 'attractions', () => {
    const b = m('aquarium (building)', { edge: 'sharp' })
      .box([22, 0.3, 14], [0, 0.15, 0], { color: 'stone', round: 0.05 })
      .box([20, 6, 12], [0, 3.3, 0], { color: '#3fa7c0', round: 0.02 })
      .loft([20.4, 6, 12.4], [0, 6.3, 0], [[0, 1, 1, 0], [1, 1, 1, 0]], { color: '#a9dcf2', rot: [0, 90, 0], cut: 'top', edge: 'soft' })
      .box([14, 4.2, 0.1], [0, 2.6, 6.03], { color: '#2f6f9a', round: 0.05 })
      .label('AQUARIUM', [7, 1.1], [0, 5.5, 6.1], { color: 'white', depth: 0.05 })
      .ball([1.6, 1.0, 0.1], [-4.2, 2.7, 6.1], { color: 'orange' })
      .wedge([0.9, 0.9, 0.1], [-3.1, 2.7, 6.1], { color: 'orange', rot: [0, 0, 90] })
      .ball([1.2, 0.8, 0.1], [4.6, 3.4, 6.1], { color: 'yellow' })
      .wedge([0.7, 0.7, 0.1], [3.8, 3.4, 6.1], { color: 'yellow', rot: [0, 0, -90] })
      .ball([3.4, 1.2, 0.1], [3.6, 1.6, 6.1], { color: '#5d6d7e' })
      .wedge([1.4, 1.2, 0.1], [1.6, 1.8, 6.1], { color: '#5d6d7e', rot: [0, 0, -90] });
    door(b, [-0.6, 0.3, 6.05], 1.1, 2.3, { color: '#2a5a7a', glass: true, frame: 'white' });
    door(b, [0.6, 0.3, 6.05], 1.1, 2.3, { color: '#2a5a7a', glass: true, frame: 'white', side: -1, name: 'door2' });
    b.cyl([4, 0.5, 4], [-6, 0.55, 10], { color: 'stone' })
      .cyl([3.6, 0.15, 3.6], [-6, 0.82, 10], { color: 'water', edge: 'soft' })
      .rod([-6, 0.8, 10], [-6, 2.4, 10], 0.5, '#2f4f6f', { name: 'tail', pivot: [-6, 0.8, 10] })
      .ball([2.4, 0.5, 0.6], [-6, 2.7, 10], { color: '#2f4f6f', parent: 'tail', rot: [0, 0, 0] });
    return b
      .act({
        click: [
          [A.par(A.pose('tail', { rot: [0, 0, 20], dur: 0.4 }), A.effect('water_spray', { dur: 2 }), A.say('Splash!', 1.5)), A.pose('tail', { rot: [0, 0, 0], dur: 0.6 })],
          [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A Roman aqueduct bridge in three tiers of stone arches (a 40 m stretch), the water channel on top.
  e('aqueduct', 'places', 'landmarks', () => {
    const b = m('aqueduct', { edge: 'sharp' });
    const C = ['#cdbf9c', '#c2b48f', '#d6c9a8'];
    const tier = (y0: number, n: number, span: number, pier: number, h: number, depth: number, c: string) => {
      const L = n * span;
      for (let i = 0; i <= n; i++) b.box([pier, h, depth], [-L / 2 + i * span, y0 + h / 2, 0], { color: c, round: 0.02 });
      for (let i = 0; i < n; i++) {
        const cx = -L / 2 + (i + 0.5) * span, r = (span - pier) / 2;
        b.arc([span, span, depth], [cx, y0 + h, 0], { color: c, tube: (pier * 0.9) / span, arc: 180 });
        b.box([span, pier * 0.6, depth], [cx, y0 + h + r + pier * 0.3, 0], { color: c, round: 0.02 });
      }
      b.box([L + pier, 0.35, depth + 0.3], [0, y0 + h + (span - pier) / 2 + pier * 0.6 + 0.17, 0], { color: '#b0a27e', round: 0.05 });
      return y0 + h + (span - pier) / 2 + pier * 0.6 + 0.35;
    };
    let y = tier(0, 6, 6.6, 1.6, 6, 4.4, C[0]);
    y = tier(y, 6, 6.6, 1.4, 4.2, 3.6, C[1]);
    y = tier(y, 18, 2.2, 0.6, 1.4, 3.0, C[2]);
    b.box([39.6, 1.1, 3.0], [0, y + 0.55, 0], { color: C[2], round: 0.02 })
      .box([38, 0.12, 1.2], [0, y + 1.12, 0], { color: 'water', glow: false });
    return b.act({ click: [[A.par(A.effect('water_spray', { dur: 2.5 }), A.say('Gurgle gurgle...', 2))]] }).done();
  }),
  // An upright arcade cabinet: lit marquee, the tilted screen in its bezel, a joystick and buttons on the control
  // deck, coin door below. Wiggle the stick and it plays.
  e('arcade machine', 'toys', 'arcade', () => {
    const b = m('arcade machine', { edge: 'sharp' })
      .box([0.72, 1.82, 0.8], [0, 0.91, -0.05], { color: 'purple', round: 0.05 })
      .box([0.66, 0.3, 0.06], [0, 1.66, 0.36], { color: 'yellow', glow: true, name: 'marquee', mover: { kind: 'light', on: true } })
      .label('SPACE BLAST', [0.56, 0.16], [0, 1.66, 0.4], { color: 'yellow', depth: 0.005 })
      .box([0.62, 0.55, 0.06], [0, 1.24, 0.32], { color: 'black', rot: [-14, 0, 0] })
      .box([0.5, 0.4, 0.02], [0, 1.25, 0.355], { color: 'cyan', glow: true, rot: [-14, 0, 0], name: 'screen', mover: { kind: 'light', on: true } })
      .box([0.76, 0.1, 0.38], [0, 0.98, 0.46], { color: 'black', rot: [10, 0, 0] })
      .stick([-0.16, 1.03, 0.48], [-0.16, 1.12, 0.48], 0.02, 'black', { name: 'joystick', pivot: [-0.16, 1.03, 0.48] })
      .ball(0.055, [-0.16, 1.14, 0.48], { color: 'red', parent: 'joystick' })
      .box([0.34, 0.36, 0.03], [0, 0.45, 0.36], { color: '#2a2726' })
      .socket('coin', [0.06, 0.52, 0.38], 'slot', { size: 0.03 });
    b.pair((s) => b.box([0.03, 0.08, 0.02], [s * 0.06, 0.52, 0.38], { color: 'orange', glow: true }));
    b.each(3, (i) => b.cyl([0.045, 0.03, 0.045], [0.02 + i * 0.08, 1.03, 0.48], { color: ['yellow', 'blue', 'lime'][i] }));
    b.pair((s) => b.box([0.02, 1.4, 0.7], [s * 0.37, 1.0, -0.05], { color: 'magenta', noInk: true }));
    const wig = (a: number) => A.pose('joystick', { rot: [0, 0, a], dur: 0.12 });
    return b
      .act({
        click: [
          [A.par(wig(20), A.say('Pew! Pew pew!', 2)), wig(-20), wig(20), wig(-20), wig(0), A.anim('pulse')],
          [A.operate('screen', 'off'), A.say('GAME OVER', 1.5), A.wait(1), A.operate('screen', 'on'), A.say('INSERT COIN', 1.5)],
        ],
      })
      .done();
  }),
  // A stone archway, 8 m tall: piers on plinths, voussoirs round the half circle and a pale keystone at the top.
  e('arch', 'places', 'landmarks', () => {
    const b = m('arch', { edge: 'sharp' });
    b.pair((s) => b.box([1.3, 4, 1.4], [s * 2.6, 2.3, 0], { color: 'stone', round: 0.05 }).box([1.7, 0.6, 1.8], [s * 2.6, 0.3, 0], { color: 'rock', round: 0.1 }).box([1.5, 0.3, 1.6], [s * 2.6, 4.35, 0], { color: '#bdb5a0', round: 0.1 }));
    b.each(9, (i) => {
      const a = (i / 8) * Math.PI;
      b.box([1.3, i === 4 ? 1.1 : 0.9, 1.4], [Math.cos(a) * 2.6, 4.5 + Math.sin(a) * 2.6, 0], { color: i === 4 ? '#d8d0bb' : i % 2 ? 'stone' : '#b5b2a8', rot: [0, 0, a * RAD - 90], round: 0.1, name: i === 4 ? 'keystone' : undefined });
    });
    b.pair((s) => b.box([1.7, 3.0, 1.38], [s * 2.75, 6.1, 0], { color: 'stone', round: 0.02 }));
    b.box([7.2, 0.7, 1.5], [0, 7.95, 0], { color: '#bdb5a0', round: 0.1 });
    return b.act({ click: [[A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('Rumble...', 1.5))]] }).done();
  }),
  // The Ark of the Covenant: a gold chest on its carrying poles, the lid with two kneeling cherubim; it opens in a
  // blaze of light.
  e('ark of the covenant', 'fantasy', 'relics', () => {
    const b = m('ark of the covenant', { edge: 'sharp' })
      .box([1.15, 0.65, 0.7], [0, 0.45, 0], { color: 'gold', round: 0.05 })
      .box([1.17, 0.06, 0.72], [0, 0.25, 0], { color: '#c9962a', round: 0.2 })
      .box([1.17, 0.06, 0.72], [0, 0.72, 0], { color: '#c9962a', round: 0.2 })
      .box([1.0, 0.06, 0.55], [0, 0.76, 0], { color: '#fff6c8', glow: true, name: 'light', mover: { kind: 'light' } })
      .box([1.25, 0.08, 0.8], [0, 0.82, 0], { color: 'gold', round: 0.2, name: 'lid', pivot: [0, 0.82, -0.4], mover: { kind: 'swing', axis: 'x', amount: -35 } });
    b.pair((s) => {
      b.stick([-1.1, 0.42, s * 0.42], [1.1, 0.42, s * 0.42], 0.06, 'gold');
      b.box([0.1, 0.12, 0.1], [s * 0.5, 0.06, 0.3], { color: 'gold' }).box([0.1, 0.12, 0.1], [s * 0.5, 0.06, -0.3], { color: 'gold' });
      b.ball([0.2, 0.26, 0.22], [s * 0.38, 0.99, 0], { color: 'gold', parent: 'lid', edge: 'soft' }).ball(0.13, [s * 0.36, 1.17, 0.05], { color: 'gold', parent: 'lid', edge: 'soft' });
      b.ball([0.08, 0.45, 0.34], [s * 0.24, 1.2, -0.02], { color: '#f0c850', rot: [0, 0, s * 45], parent: 'lid', edge: 'soft' });
    });
    return b
      .act({ click: [[A.operate('lid', 'open'), A.operate('light', 'on'), A.par(A.effect('sparkle', { dur: 2.5 }), A.say('Ahhhhh...', 2)), A.wait(2), A.operate('light', 'off'), A.operate('lid', 'close')]] })
      .done();
  }),
  // An anatomy model of an arm on a stand: shoulder, upper arm, and the forearm and hand, which bend up to flex.
  e('arm', 'clinic', 'body parts', () =>
    m('arm')
      .box([0.24, 0.03, 0.2], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([-0.06, 0.03, -0.04], [-0.06, 0.75, -0.04], 0.025, 'brass')
      .ball(0.12, [0, 0.74, 0], { color: 'skin2' })
      .capsule([0.1, 0.32, 0.1], [0, 0.56, 0], { color: 'skin2' })
      .ball([0.11, 0.1, 0.1], [0, 0.4, 0.01], { color: 'skin2' })
      .capsule([0.08, 0.28, 0.08], [0, 0.26, 0.01], { color: 'skin2', name: 'forearm', pivot: [0, 0.4, 0.01], piece: true })
      .ball([0.08, 0.1, 0.05], [0, 0.1, 0.01], { color: 'skin2', parent: 'forearm' })
      .capsule([0.025, 0.06, 0.025], [0.035, 0.12, 0.02], { color: 'skin2', parent: 'forearm', rot: [0, 0, 30] })
      .act({ click: [[A.pose('forearm', { rot: [-130, 0, 0], dur: 0.7 }), A.say('Flex!', 1.2), A.wait(1), A.pose('forearm', { rot: [0, 0, 0], dur: 0.6 })]] })
      .done(),
  ),
  // An upholstered armchair at real size (seat 0.45, back 0.95): rolled arms, a plump seat cushion, turned wooden
  // legs; someone sits down in it.
  e('armchair', 'home', 'seating', () => {
    const b = m('armchair')
      .box([0.86, 0.22, 0.8], [0, 0.27, 0], { color: 'maroon', round: 0.3 })
      .box([0.6, 0.14, 0.62], [0, 0.44, 0.05], { color: '#a8394a', round: 0.6, name: 'cushion' })
      .box([0.86, 0.6, 0.2], [0, 0.66, -0.3], { color: 'maroon', round: 0.4 })
      .box([0.58, 0.42, 0.1], [0, 0.66, -0.17], { color: '#a8394a', round: 0.7 });
    b.pair((s) => b.box([0.16, 0.3, 0.8], [s * 0.37, 0.52, 0], { color: 'maroon', round: 0.6 }).capsule([0.18, 0.8, 0.18], [s * 0.37, 0.66, 0.0], { color: 'maroon', rot: [90, 0, 0] }));
    for (const [x0, z] of [[0.35, 0.33], [-0.35, 0.33], [0.35, -0.33], [-0.35, -0.33]]) b.cyl([0.06, 0.16, 0.06], [x0, 0.08, z], { color: 'darkwood', taper: 0.7, edge: 'sharp' });
    return b
      .socket('seat', [0, 0.5, 0.05], 'seat')
      .act({ click: [[A.spawn('sitter', 'man'), A.attach('sitter', 'self', 'seat'), A.say('Ahh, comfy!', 2, 'sitter'), A.wait(2), A.remove('sitter', 'fade')]] })
      .done();
  }),
  // A suit of plate armour on its stand: helmet with a visor that lifts, plume, breastplate, pauldrons, gauntlets,
  // tassets and greaves, crisp steel plates.
  e('armor', 'armory', 'armour', () => {
    const b = m('armor', { edge: 'sharp' })
      .box([0.5, 0.04, 0.4], [0, 0.02, 0], { color: 'darkwood', round: 0.3 })
      .box([0.44, 0.22, 0.28], [0, 0.98, 0], { color: 'steel', round: 0.5 })
      .ball([0.46, 0.5, 0.3], [0, 1.28, 0], { color: 'silver' })
      .box([0.03, 0.4, 0.03], [0, 1.28, 0.15], { color: 'metal', round: 0.5 })
      .cyl([0.14, 0.08, 0.14], [0, 1.53, 0], { color: 'steel' })
      .capsule([0.25, 0.3, 0.27], [0, 1.68, 0], { color: 'silver' })
      .box([0.22, 0.16, 0.1], [0, 1.66, 0.12], { color: 'steel', round: 0.6, name: 'visor', pivot: [0, 1.74, 0.02], mover: { kind: 'swing', axis: 'x', amount: -80 } })
      .box([0.17, 0.02, 0.03], [0, 1.69, 0.17], { color: '#2a2726', round: 0, parent: 'visor' })
      .capsule([0.06, 0.24, 0.1], [0, 1.92, -0.06], { color: 'red', rot: [-40, 0, 0], edge: 'soft' });
    b.pair((s) => {
      b.capsule([0.13, 0.82, 0.14], [s * 0.1, 0.48, 0], { color: 'silver' }).ball(0.11, [s * 0.1, 0.5, 0.04], { color: 'steel' });
      b.box([0.13, 0.08, 0.26], [s * 0.1, 0.05, 0.04], { color: 'steel', round: 0.5 });
      b.box([0.2, 0.2, 0.06], [s * 0.12, 0.84, 0.12], { color: 'steel', round: 0.3, rot: [0, 0, s * 8] });
      b.ball([0.22, 0.16, 0.24], [s * 0.27, 1.48, 0], { color: 'steel' });
      b.capsule([0.1, 0.56, 0.1], [s * 0.3, 1.16, 0], { color: 'silver' }).ball(0.1, [s * 0.31, 0.85, 0.01], { color: 'iron' });
    });
    b.stick([0, 0.04, -0.18], [0, 1.5, -0.18], 0.04, 'darkwood');
    return b.act({ click: [[A.operate('visor', 'open'), A.say('Clank! Anyone in there?', 2), A.wait(1.5), A.operate('visor', 'close'), A.say('Clank!', 1)]] }).done();
  }),
  // An armoury: a stone keep with crenellated walls, round corner towers with red cone roofs, heavy double doors
  // under an arch, crossed swords on a shield above them.
  e('armory', 'places', 'military', () => {
    const b = m('armory', { edge: 'sharp' })
      .box([14.5, 0.3, 8.5], [0, 0.15, 0], { color: 'rock', round: 0.05 })
      .box([12, 6, 7], [0, 3.3, 0], { color: 'stone', round: 0.02 })
      .arc([3.2, 3.2, 0.2], [0, 3.0, 3.52], { color: '#8f8c86', arc: 180, tube: 0.18 })
      .box([1.4, 2.7, 0.1], [-0.7, 1.65, 3.55], { color: 'darkwood', name: 'doorL', pivot: [-1.4, 1.65, 3.55], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([1.4, 2.7, 0.1], [0.7, 1.65, 3.55], { color: 'darkwood', name: 'doorR', pivot: [1.4, 1.65, 3.55], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([2.8, 1.5, 0.1], [0, 3.6, 3.5], { color: 'darkwood' })
      .label('ARMORY', [3.4, 0.6], [0, 5.3, 3.56], { color: 'darkred', depth: 0.04 })
      .cyl([1.5, 0.12, 1.5], [0, 3.95, 3.62], { color: 'red', rot: [90, 0, 0] })
      .rod([-0.9, 3.3, 3.72], [0.9, 4.6, 3.72], 0.1, 'silver')
      .rod([0.9, 3.3, 3.72], [-0.9, 4.6, 3.72], 0.1, 'silver');
    b.pair((s) => {
      b.each(3, (i) => b.box([0.06, 0.05, 1.3], [s * 0.7, 1.0 + i * 0.7, 3.62], { color: 'iron', rot: [0, 90, 0], parent: s > 0 ? 'doorR' : 'doorL' }));
      b.cyl([3, 8, 3], [s * 6, 4.3, 3.2], { color: 'rock' }).cone([3.6, 2.6, 3.6], [s * 6, 9.6, 3.2], { color: 'darkred' });
      b.box([0.5, 1.0, 0.1], [s * 6, 5.5, 4.72], { color: '#2a2726' });
      b.cyl([3, 8, 3], [s * 6, 4.3, -3.2], { color: 'rock' }).cone([3.6, 2.6, 3.6], [s * 6, 9.6, -3.2], { color: 'darkred' });
      b.box([0.4, 1.0, 0.1], [s * 2.8, 4.5, 3.52], { color: '#2a2726' });
    });
    b.each(8, (i) => b.box([0.7, 0.8, 0.7], [-4.2 + i * 1.2, 6.7, 3.15], { color: 'stone' }));
    return b.act({ click: [[A.operate('door', 'open'), A.say('Creeeak...', 2), A.wait(2.5), A.operate('door', 'close'), A.say('BOOM.', 1)]] }).done();
  }),
  // A weapons rack: a sword, a spear, a battle axe and a round shield in a wooden frame; the sword can be taken.
  e('arms', 'armory', 'weapons', () => {
    const b = m('arms', { edge: 'sharp' }).box([1.6, 0.14, 0.5], [0, 0.07, -0.05], { color: 'darkwood', name: 'rack' });
    b.pair((s) => b.stick([s * 0.72, 0.1, -0.15], [s * 0.72, 1.55, -0.15], 0.08, 'darkwood'));
    b.stick([-0.76, 1.3, -0.15], [0.76, 1.3, -0.15], 0.06, 'darkwood').stick([-0.76, 0.35, -0.15], [0.76, 0.35, -0.15], 0.06, 'darkwood');
    b.box([0.07, 0.9, 0.015], [-0.45, 0.62, -0.05], { color: 'silver', round: 0.3, name: 'sword', parent: 'rack', piece: true })
      .box([0.22, 0.035, 0.05], [-0.45, 1.09, -0.05], { color: 'gold', parent: 'sword' })
      .capsule([0.04, 0.16, 0.04], [-0.45, 1.19, -0.05], { color: 'darkbrown', parent: 'sword' })
      .ball(0.06, [-0.45, 1.29, -0.05], { color: 'gold', parent: 'sword' });
    b.stick([-0.12, 0.1, -0.05], [-0.12, 1.5, -0.05], 0.035, 'wood');
    spike(b, [-0.12, 1.48, -0.05], [-0.12, 1.75, -0.05], 0.07, 'steel', { segs: 4 });
    b.stick([0.25, 0.1, -0.05], [0.25, 1.25, -0.05], 0.04, 'wood').box([0.12, 0.1, 0.04], [0.31, 1.12, -0.05], { color: 'iron' }).ball([0.14, 0.3, 0.03], [0.4, 1.12, -0.05], { color: 'steel' });
    b.cyl([0.55, 0.05, 0.55], [0.48, 0.42, 0.12], { color: 'red', rot: [75, 0, 0] }).ball([0.12, 0.12, 0.06], [0.48, 0.43, 0.15], { color: 'gold' });
    return b.act({ click: [[A.detach('sword', 'sword'), A.say('Clang!', 1)], [A.reattach('sword'), A.say('Shing!', 1)]] }).done();
  }),
  // Three green plastic toy soldiers on their bases (5 cm): a rifleman, one aiming, a radio man. One topples.
  e('army men', 'toys', 'toy soldiers', () => {
    const b = m('army men');
    const G = '#5c7a2e';
    ([[-0.06, 0.0, 0], [0.0, 0.03, 1], [0.06, -0.01, 2]] as Array<[number, number, number]>).forEach(([x0, z, aim], k) => {
      const o = k === 0 ? {} : {};
      const nm = `soldier${k}`;
      b.cyl([0.042, 0.006, 0.032], [x0, 0.003, z], { color: G, name: nm, pivot: [x0 + 0.02, 0, z], piece: true, ...o })
        .rod([x0 - 0.007, 0.006, z], [x0 - 0.007, 0.036, z], 0.011, G, { parent: nm })
        .rod([x0 + 0.007, 0.006, z], [x0 + 0.007, 0.036, z], 0.011, G, { parent: nm })
        .capsule([0.024, 0.034, 0.016], [x0, 0.05, z], { color: G, parent: nm })
        .ball(0.016, [x0, 0.073, z], { color: G, parent: nm })
        .ball([0.022, 0.012, 0.022], [x0, 0.079, z], { color: G, parent: nm });
      if (aim === 1) b.stick([x0 - 0.004, 0.064, z + 0.005], [x0 - 0.004, 0.064, z + 0.05], 0.006, G, { parent: nm });
      else if (aim === 2) b.box([0.016, 0.022, 0.01], [x0, 0.052, z - 0.012], { color: G, parent: nm }).stick([x0 + 0.005, 0.06, z - 0.015], [x0 + 0.008, 0.095, z - 0.015], 0.002, G, { parent: nm });
      else b.stick([x0 + 0.013, 0.035, z + 0.006], [x0 + 0.016, 0.085, z + 0.012], 0.006, G, { parent: nm });
    });
    return b.act({ click: [[A.pose('soldier2', { rot: [0, 0, -90], dur: 0.35 }), A.say('Man down!', 1.5), A.wait(1), A.pose('soldier2', { rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A soldier in combat uniform standing at the salute: helmet, olive drab, belt, badge.
  e('army uniform', 'wardrobe', 'uniforms', () =>
    withAct(who('army uniform', { top: '#5b6b3a', bottom: '#5b6b3a', shoes: 'black', long: true, style: 'short', pose: 'salute', acc: [hat('military', '#4a5a2e'), wear('belt', 'darkbrown'), wear('badge')] }), {
      click: [[A.par(A.anim('nod'), A.say('Yes, sir!', 2))], [A.par(A.anim('point'), A.say('Forward, march!', 2))]],
    }),
  ),
  // An arrow shot into the ground: wooden shaft, red and white fletching; it quivers.
  e('arrow', 'armory', 'archery', () =>
    m('arrow')
      .cyl([0.2, 0.05, 0.16], [0, 0.025, 0], { color: 'dirt', taper: 0.5 })
      .stick([0, 0.03, 0], [0.32, 0.72, 0], 0.012, 'wood', { name: 'arrow', pivot: [0, 0.03, 0] })
      .ball([0.005, 0.12, 0.045], [0.285, 0.645, 0], { color: 'red', rot: [0, 0, -25], parent: 'arrow' })
      .ball([0.045, 0.12, 0.005], [0.285, 0.645, 0], { color: 'white', rot: [0, 0, -25], parent: 'arrow' })
      .ball(0.016, [0.322, 0.725, 0], { color: 'darkbrown', parent: 'arrow' })
      .act({ click: [[A.pose('arrow', { rot: [0, 0, 6], dur: 0.06 }), A.pose('arrow', { rot: [0, 0, -5], dur: 0.06 }), A.pose('arrow', { rot: [0, 0, 3], dur: 0.06 }), A.pose('arrow', { rot: [0, 0, -2], dur: 0.06 }), A.pose('arrow', { rot: [0, 0, 0], dur: 0.06 }), A.say('Thwunk!', 1)]] })
      .done(),
  ),
  // A knapped flint arrowhead (5 cm) on a little museum stand; it turns to show both faces.
  e('arrowhead', 'armory', 'archery', () =>
    m('arrowhead')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .box([0.004, 0.02, 0.004], [0, 0.03, 0], { color: 'brass', round: 0 })
      .wedge([0.03, 0.05, 0.007], [0, 0.065, 0], { color: '#5a5d63', name: 'head', edge: 'sharp' })
      .box([0.012, 0.012, 0.006], [0, 0.036, 0], { color: '#4a4d52', parent: 'head', round: 0.3 })
      .ball([0.008, 0.008, 0.003], [-0.004, 0.058, 0.004], { color: '#7c8088', noInk: true, parent: 'head' })
      .act({ click: [[A.pose('head', { rot: [0, 360, 0], dur: 1.5 }), A.pose('head', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done(),
  ),
  // An art museum: a neoclassical front of steps and columns under a pediment, banners, a bronze statue in front.
  e('art museum', 'places', 'museums', () => {
    const b = m('art museum', { edge: 'sharp' })
      .box([22, 0.4, 13], [0, 0.2, 0], { color: 'stone', round: 0.05 })
      .box([20, 0.4, 12], [0, 0.6, 0], { color: 'lightgray', round: 0.05 })
      .box([18, 0.4, 11], [0, 1.0, -0.2], { color: 'lightgray', round: 0.05 })
      .box([17, 7, 8], [0, 4.7, -1.5], { color: '#e8d9c0', round: 0.02 })
      .box([18.6, 1.0, 10], [0, 8.7, -0.3], { color: 'white', round: 0.05 })
      .label('ART MUSEUM', [8, 0.7], [0, 8.7, 4.72], { color: 'white', depth: 0.04 })
      .wedge([18.8, 2.6, 10.2], [0, 10.5, -0.3], { color: 'white' })
      .wedge([16, 1.8, 0.2], [0, 10.25, 4.85], { color: '#e8d9c0' });
    b.each(8, (i) => b.cyl([0.7, 7, 0.7], [-7.7 + i * 2.2, 4.7, 4.0], { color: 'white' }).box([0.95, 0.3, 0.95], [-7.7 + i * 2.2, 1.35, 4.0], { color: 'lightgray' }).box([0.95, 0.3, 0.95], [-7.7 + i * 2.2, 8.05, 4.0], { color: 'lightgray' }));
    b.box([2.0, 3.6, 0.12], [-1.0, 3.0, 2.56], { color: 'darkwood', name: 'doorL', pivot: [-2.0, 3.0, 2.56], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([2.0, 3.6, 0.12], [1.0, 3.0, 2.56], { color: 'darkwood', name: 'doorR', pivot: [2.0, 3.0, 2.56], mover: { kind: 'swing', axis: 'y', amount: 90 } });
    b.pair((s) => b.box([1.4, 4, 0.05], [s * 5.5, 5.2, 2.55], { color: s > 0 ? 'red' : 'blue', edge: 'soft' }));
    b.box([1.6, 1.4, 1.6], [7, 0.7, 8.5], { color: 'stone' })
      .ball([0.5, 0.55, 0.45], [7, 3.2, 8.5], { color: '#6b5a3a', edge: 'soft' })
      .box([0.7, 1.4, 0.4], [7, 2.3, 8.5], { color: '#6b5a3a', round: 0.8, edge: 'soft' })
      .rod([7.3, 2.8, 8.5], [7.7, 3.6, 8.6], 0.15, '#6b5a3a')
      .box([0.6, 0.9, 0.35], [7, 1.85, 8.5], { color: '#6b5a3a', edge: 'soft' });
    return b.act({ click: [[A.operate('door', 'open'), A.say('Shhh... quiet, please.', 2), A.wait(2.5), A.operate('door', 'close')]] }).done();
  }),
  // An art supply store: a bright shop front with a striped awning, a giant pencil by the door and a painter's
  // palette sign that spins.
  e('art supply store', 'places', 'shops', () => {
    const b = bldg('art supply store', { w: 7, d: 6, floors: 1, wall: '#f7e08a', roofKind: 'flat', roof: 'blue', trim: 'white', sign: 'ART SUPPLIES', signColor: 'white', shopWindow: true });
    b.each(7, (i) => b.box([1.0, 0.06, 1.3], [-3.0 + i * 1.0, 3.0, 3.6], { color: i % 2 ? 'white' : 'magenta', rot: [22, 0, 0] }));
    b.stick([3.9, 0, 3.6], [3.9, 0.4, 3.6], 0.42, 'pink').stick([3.9, 0.4, 3.6], [3.9, 0.55, 3.6], 0.43, 'silver').prism([0.42, 2.4, 0.42], [3.9, 1.75, 3.6], 6, { color: 'yellow' });
    spike(b, [3.9, 2.95, 3.6], [3.9, 3.5, 3.6], 0.42, 'tan', { segs: 6 });
    spike(b, [3.9, 3.35, 3.6], [3.9, 3.52, 3.6], 0.13, 'darkgray');
    b.stick([0, 3.65, 3.0], [0, 4.0, 3.0], 0.08, 'gray');
    b.ball([2.2, 1.4, 0.15], [0, 4.7, 3.0], { color: 'lightwood', name: 'palette', edge: 'soft' });
    b.each(5, (i) => b.ball([0.3, 0.3, 0.1], [-0.6 + i * 0.32, 4.85 - (i % 2) * 0.3, 3.1], { color: RAINBOW[i], parent: 'palette' }));
    return b
      .act({ click: [[A.operate('door', 'open'), A.say('Ding!', 1), A.wait(2), A.operate('door', 'close')], [A.pose('palette', { rot: [0, 0, 360], dur: 1.5 }), A.pose('palette', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done();
  }),
  // A globe artichoke at its real 12 cm (the vocabulary's 1 m is the whole plant; this is the vegetable): layered
  // pointed bracts round a heart, on its cut stalk. A bract peels off.
  e('artichoke', 'food', 'vegetables', () => {
    const b = m('artichoke')
      .cyl([0.025, 0.04, 0.025], [0, 0.02, 0], { color: '#7a9a5a', name: 'stalk' })
      .ball([0.09, 0.1, 0.09], [0, 0.085, 0], { color: '#5f8a45' })
      .cone([0.05, 0.05, 0.05], [0, 0.14, 0], { color: '#6b8e4e' });
    around(7, 0.032).forEach(([x0, z]) => spike(b, [x0, 0.055, z], [x0 * 1.8, 0.115, z * 1.8], 0.045, '#7da35a'));
    around(6, 0.022, 0.4).forEach(([x0, z]) => spike(b, [x0, 0.1, z], [x0 * 1.6, 0.155, z * 1.6], 0.038, '#8aaa62'));
    spike(b, [0, 0.06, 0.035], [0, 0.11, 0.065], 0.045, '#9abb6a', { name: 'bract', parent: 'stalk', piece: true });
    return b.act({ click: [[A.detach('bract', 'leaf')], [A.reattach('bract')]] }).done();
  }),
  // An ancient amphora on a museum plinth, black-figure band round its belly; it wobbles and sheds dust.
  e('artifact', 'study', 'history', () =>
    m('artifact')
      .box([0.2, 0.12, 0.2], [0, 0.06, 0], { color: 'white', round: 0.1, edge: 'sharp' })
      .label('500 BC', [0.1, 0.03], [0, 0.06, 0.101], { color: 'white', depth: 0.002 })
      .cyl([0.05, 0.03, 0.05], [0, 0.135, 0], { color: '#b8653a', name: 'pot' })
      .ball([0.15, 0.18, 0.15], [0, 0.23, 0], { color: '#c0703a', parent: 'pot' })
      .cyl([0.152, 0.03, 0.152], [0, 0.24, 0], { color: '#2a2726', noInk: true, parent: 'pot' })
      .cyl([0.05, 0.08, 0.05], [0, 0.34, 0], { color: '#c0703a', parent: 'pot' })
      .torus([0.07, 0.07, 0.016], [0, 0.38, 0], { color: '#b8653a', rot: [90, 0, 0], parent: 'pot' })
      .arc([0.06, 0.1, 0.014], [0.055, 0.33, 0], { color: '#b8653a', rot: [0, 0, -90], parent: 'pot' })
      .arc([0.06, 0.1, 0.014], [-0.055, 0.33, 0], { color: '#b8653a', rot: [0, 0, 90], parent: 'pot' })
      .act({ click: [[A.par(A.pose('pot', { rot: [0, 0, 8], dur: 0.2 }), A.effect('dust', { dur: 1.2 })), A.pose('pot', { rot: [0, 0, -6], dur: 0.2 }), A.pose('pot', { rot: [0, 0, 0], dur: 0.2 }), A.say('Phew!', 1)]] })
      .done(),
  ),
  // The ash of a burnt-out campfire: a grey heap in a ring of stones, charred sticks and embers that glow again.
  e('ash', 'nature', 'fire', () => {
    const b = m('ash')
      .cyl([0.42, 0.12, 0.38], [0, 0.06, 0], { color: '#8f8d8a', taper: 0.35 })
      .ball([0.16, 0.08, 0.14], [0, 0.12, 0], { color: '#b5b3ae' })
      .rod([-0.14, 0.06, 0.06], [0.08, 0.13, -0.02], 0.035, '#2a2726')
      .rod([0.12, 0.05, 0.1], [-0.03, 0.12, -0.07], 0.03, '#3a3533')
      .ball(0.035, [0.03, 0.13, 0.05], { color: 'fire', glow: true, name: 'embers', mover: { kind: 'light' } })
      .ball(0.025, [-0.05, 0.1, 0.1], { color: 'orange', glow: true, parent: 'embers' });
    around(10, 0.27).forEach(([x0, z], i) => b.ball([0.1, 0.07, 0.09], [x0, 0.035, z], { color: i % 2 ? 'stone' : 'rock' }));
    return b.act({ click: [[A.operate('embers', 'on'), A.effect('smoke', { dur: 2.5 }), A.wait(2), A.operate('embers', 'off')], [A.effect('dust', { dur: 1.2 }), A.say('Puff!', 1)]] }).done();
  }),
  // A bunch of asparagus spears held by a purple band, at their real 22 cm (the vocabulary's 1.5 m is the grown
  // fern); a spear can be pulled out.
  e('asparagus', 'food', 'vegetables', () => {
    const b = m('asparagus').cyl([0.07, 0.01, 0.07], [0, 0.005, 0], { color: '#c9b98a', name: 'base' });
    const pos: Array<[number, number]> = [[0, 0], [0.02, 0.008], [-0.02, 0.006], [0.008, -0.018], [-0.012, -0.016], [0.004, 0.022], [0.022, -0.012]];
    for (const [x0, z] of pos) b.rod([x0, 0.01, z], [x0 * 1.8, 0.21, z * 1.8], 0.018, '#6fa646').ball([0.022, 0.04, 0.022], [x0 * 1.85, 0.225, z * 1.85], { color: '#4d6e3a' });
    b.rod([-0.03, 0.01, 0.03], [-0.05, 0.21, 0.05], 0.018, '#7ab350', { name: 'spear', parent: 'base', piece: true }).ball([0.022, 0.04, 0.022], [-0.051, 0.225, 0.051], { color: '#4d6e3a', parent: 'spear' });
    b.torus([0.075, 0.075, 0.02], [0, 0.06, 0], { color: 'purple', rot: [90, 0, 0], tube: 0.2 });
    return b.act({ click: [[A.detach('spear', 'spear')], [A.reattach('spear')]] }).done();
  }),
  // A quaking aspen, 12 m: a slender white trunk marked with black, a tall narrow crown of golden leaves that
  // quiver in the wind.
  e('aspen tree', 'garden', 'trees', () => {
    const b = tree2('aspen tree', 12, { trunk: '#eeeae0', marks: '#2a2726', crown: '#f2c43a', crown2: '#e8b02a', tall: true, w: 0.38, tk: 0.03 });
    const q = (a: number) => A.pose('top', { rot: [0, 0, a], dur: 0.12 });
    return b.act({ click: [[A.say('Rustle rustle...', 2), q(3), q(-3), q(3), q(-3), q(2), q(-2), q(0)]] }).done();
  }),
  // A section of fresh asphalt road, 3 m by 2 m: the dark surface with lane lines and a kerb, steaming hot.
  e('asphalt', 'workshop', 'building materials', () => {
    const b = m('asphalt', { edge: 'sharp' })
      .box([3, 0.06, 2], [0, 0.03, 0], { color: '#8a7a64', round: 0.1 })
      .box([3, 0.06, 1.8], [0, 0.08, -0.1], { color: '#3a3a3c', round: 0.1, edge: 'soft' })
      .box([3, 0.15, 0.2], [0, 0.11, 0.9], { color: 'lightgray', round: 0.2 })
      .box([3, 0.005, 0.08], [0, 0.112, 0.6], { color: 'white', noInk: true });
    b.each(3, (i) => b.box([0.6, 0.005, 0.1], [-1.0 + i * 1.0, 0.112, -0.2], { color: 'yellow', noInk: true }));
    around(8, 0.6, 0.3).forEach(([x0, z]) => b.ball([0.03, 0.01, 0.03], [x0 * 2, 0.11, z * 0.8 - 0.1], { color: 'gray', noInk: true }));
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2.5 }), A.say('Sssss... hot!', 2))]] }).done();
  }),
  // An assault rifle on a display stand: receiver, barrel, stock, grip, carry handle; its magazine clicks out.
  e('assault rifle', 'armory', 'guns', () =>
    m('assault rifle', { view: 'side', edge: 'sharp' })
      .box([0.3, 0.02, 0.18], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.02, 0.2], [0, 0.18, 0.2], 0.02, 'darkgray')
      .stick([0, 0.02, -0.2], [0, 0.18, -0.2], 0.02, 'darkgray')
      .box([0.06, 0.1, 0.36], [0, 0.24, 0.02], { color: '#2a2726', round: 0.2, name: 'gun' })
      .box([0.065, 0.08, 0.3], [0, 0.245, 0.33], { color: '#3a3633', round: 0.4 })
      .stick([0, 0.26, 0.47], [0, 0.26, 0.72], 0.02, '#2a2726')
      .box([0.02, 0.055, 0.02], [0, 0.3, 0.64], { color: '#2a2726' })
      .box([0.04, 0.15, 0.06], [0, 0.13, 0.12], { color: '#2a2726', rot: [-12, 0, 0], name: 'mag', parent: 'gun', piece: true })
      .box([0.04, 0.11, 0.05], [0, 0.15, -0.07], { color: '#2a2726', rot: [20, 0, 0] })
      .box([0.05, 0.11, 0.26], [0, 0.22, -0.3], { color: '#2a2726', round: 0.3 })
      .box([0.025, 0.04, 0.2], [0, 0.31, 0.02], { color: '#3a3633' })
      .act({ click: [[A.pose('mag', { move: [0, -0.08, 0], dur: 0.2 }), A.say('Click!', 1), A.wait(0.8), A.pose('mag', { move: [0, 0, 0], dur: 0.2 }), A.say('Clack!', 1)]] })
      .done(),
  ),
  // A big six-armed asterisk on a small stand; it spins.
  e('asterisk', 'ideas', 'symbols', () => {
    const b = m('asterisk', { edge: 'sharp' }).box([0.16, 0.03, 0.08], [0, 0.015, 0], { color: 'darkwood', round: 0.3 }).stick([0, 0.03, 0], [0, 0.07, 0], 0.015, 'darkwood');
    b.box([0.034, 0.17, 0.03], [0, 0.16, 0], { color: 'navy', round: 0.4, name: 'star' });
    b.each(2, (i) => b.box([0.034, 0.17, 0.03], [0, 0.16, 0], { color: 'navy', rot: [0, 0, (i + 1) * 60], round: 0.4, parent: 'star' }));
    return b.act({ click: [[A.pose('star', { rot: [0, 0, 360], dur: 1 }), A.pose('star', { rot: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // An asteroid as a 3 m planetarium model on a plinth: a cratered, lumpy rock that turns.
  e('asteroid', 'sky', 'space rocks', () =>
    m('asteroid')
      .cyl([1.2, 0.4, 1.2], [0, 0.2, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.4, 0], [0, 1.0, 0], 0.15, 'silver')
      .ball([3, 2.2, 2.4], [0, 2.1, 0], { color: '#7a6f66', name: 'rock' })
      .ball([1.5, 1.3, 1.4], [1.1, 2.6, 0.2], { color: '#857a70', parent: 'rock' })
      .ball([1.3, 1.1, 1.2], [-1.1, 1.7, 0.3], { color: '#6e645c', parent: 'rock' })
      .ball([0.6, 0.6, 0.2], [0.2, 2.3, 1.12], { color: '#5a524c', noInk: true, parent: 'rock' })
      .ball([0.4, 0.4, 0.15], [-0.6, 1.8, 1.08], { color: '#5a524c', noInk: true, parent: 'rock' })
      .ball([0.35, 0.35, 0.15], [1.3, 2.8, 0.85], { color: '#5a524c', noInk: true, parent: 'rock' })
      .act({ click: [[A.pose('rock', { rot: [0, 180, 15], dur: 2.5 }), A.effect('dust', { dur: 1 }), A.pose('rock', { rot: [0, 0, 0], dur: 2 })]] })
      .done(),
  ),
  // A model of the asteroid belt (3 m across, in the planetarium): a glowing sun on a post and a ring of rocks
  // round it that circles.
  e('asteroid belt', 'sky', 'space rocks', () => {
    const b = m('asteroid belt')
      .cyl([1.2, 0.3, 1.2], [0, 0.15, 0], { color: '#3a3633', edge: 'sharp' })
      .stick([0, 0.3, 0], [0, 2.7, 0], 0.08, 'silver')
      .ball(0.7, [0, 2.7, 0], { color: 'orange', glow: true })
      .torus([3, 3, 0.04], [0, 2.7, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.01, name: 'belt', mover: { kind: 'spin', axis: 'y', amount: 40 } });
    around(16, 1.5).forEach(([x0, z], i) => b.ball([0.16 + (i % 3) * 0.06, 0.12 + (i % 2) * 0.05, 0.15], [x0, 2.7 + ((i % 3) - 1) * 0.06, z], { color: i % 2 ? '#8a7f74' : '#6e645c', rot: [i * 20, i * 35, 0], parent: 'belt' }));
    return b.act({ click: [[A.operate('belt', 'on'), A.wait(3.5), A.operate('belt', 'off')]] }).done();
  }),
  // A Victorian sanatorium: three storeys of grey stone with tall windows under a true hipped slate roof (a ridge
  // between two hips) with dormers and chimneys, and a central entrance tower that rises well clear of the roof:
  // a canopied door, a lit lantern window, a clock and a pyramid cap with a finial; its lights flicker.
  e('asylum', 'places', 'hospitals', () => {
    const SL = '#3d3a40', TR = '#d4d0c8', TW = '#7a7672';
    const b = bldg('asylum', { w: 18, d: 9, floors: 3, wall: '#8d8a86', trim: TR, roofKind: 'none', doorColor: 'darkwood', cols: 7, lights: true });
    // hipped roof over the 18 x 9 m block: a ridge wedge along x and a square pyramid at each end (its inner half
    // hides inside the wedge), a ridge cap, two dormers on the front slope and two chimney stacks
    b.wedge([9.8, 3.6, 9.0], [0, 11.35, 0], { color: SL, rot: [0, 90, 0] })
      .box([9.4, 0.18, 0.3], [0, 13.15, 0], { color: '#2e2c31', round: 0.3 });
    b.pair((s) => {
      b.pyramid([9.8 * Math.SQRT2, 3.6, 9.8 * Math.SQRT2], [s * 4.5, 11.35, 0], 4, { color: SL });
      b.box([1.4, 1.6, 1.9], [s * 6.2, 11.0, 2.95], { color: '#8d8a86', round: 0.02 })
        .wedge([1.7, 0.7, 2.1], [s * 6.2, 12.15, 2.9], { color: SL })
        .box([0.8, 0.9, 0.05], [s * 6.2, 11.15, 3.92], { color: '#2f3d52', round: 0.05 })
        .box([0.95, 0.07, 0.12], [s * 6.2, 10.67, 3.95], { color: TR });
      b.box([0.8, 2.4, 0.9], [s * 7.0, 13.0, -1.2], { color: '#6a5a52', round: 0.05 }).box([1.0, 0.18, 1.1], [s * 7.0, 14.25, -1.2], { color: '#5a5450', round: 0.1 });
    });
    // the entrance tower: shaft with string courses, windows, lantern window, clock, cornice, cap and finial
    b.box([4, 15.2, 3], [0, 7.9, 3.6], { color: TW, round: 0.02 });
    for (const y of [3.3, 6.3, 9.4, 12.2]) b.box([4.2, 0.2, 3.2], [0, y, 3.6], { color: TR, round: 0.1 });
    for (const y of [5.0, 8.0]) win(b, [0, y, 5.12], 1.0, 1.6, { frame: TR });
    b.box([1.0, 1.4, 0.06], [0, 10.8, 5.12], { color: 'yellow', glow: true, name: 'lantern', mover: { kind: 'light', on: true } })
      .box([1.2, 0.08, 0.14], [0, 10.05, 5.16], { color: TR })
      .cyl([2.0, 0.12, 2.0], [0, 13.6, 5.12], { color: 'white', rot: [90, 0, 0] })
      .torus([2.1, 2.1, 0.1], [0, 13.6, 5.14], { color: '#2a2726', tube: 0.06 })
      .box([0.07, 0.7, 0.04], [0, 13.85, 5.2], { color: 'black', round: 0 })
      .box([0.55, 0.07, 0.04], [0.22, 13.6, 5.2], { color: 'black', round: 0 })
      .box([4.4, 0.35, 3.4], [0, 15.65, 3.6], { color: TR, round: 0.1 })
      .pyramid([4.4 * Math.SQRT2, 3.6, 3.4 * Math.SQRT2], [0, 17.62, 3.6], 4, { color: SL })
      .stick([0, 19.4, 3.6], [0, 20.4, 3.6], 0.08, '#3a3633')
      .ball(0.22, [0, 20.45, 3.6], { color: 'gold' })
      .box([2.4, 0.3, 1.2], [0, 2.8, 5.6], { color: TR })
      .label('ST. AGNES', [2.6, 0.4], [0, 3.75, 5.14], { color: TR, depth: 0.03 });
    door(b, [0, 0.3, 5.12], 1.4, 2.3, { color: 'darkwood', name: 'door2', frame: TR });
    const fl = (to: string, w: number) => [A.operate('light', to), A.wait(w)];
    return b.act({ click: [[...fl('on', 0.3), ...fl('off', 0.15), ...fl('on', 0.5), ...fl('off', 0.2), ...fl('on', 1.5), A.operate('light', 'off'), A.say('Creeeak...', 1.5)]] }).done();
  }),
  // The @ sign on a stand, a thick blue ring and the curled tail; it spins.
  e('at sign', 'ideas', 'symbols', () =>
    m('at sign', { edge: 'sharp' })
      .box([0.14, 0.02, 0.07], [0, 0.01, 0], { color: 'darkwood' })
      .stick([0, 0.02, 0], [0, 0.04, 0], 0.015, 'darkwood')
      .arc([0.2, 0.2, 0.03], [0, 0.14, 0], { color: 'blue', tube: 0.2, arc: 300, rot: [0, 0, -30], name: 'at' })
      .torus([0.085, 0.095, 0.03], [-0.005, 0.14, 0], { color: 'blue', tube: 0.3, parent: 'at' })
      .stick([0.04, 0.1, 0], [0.04, 0.18, 0], 0.024, 'blue', { parent: 'at' })
      .act({ click: [[A.pose('at', { rot: [0, 360, 0], dur: 1 }), A.pose('at', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done(),
  ),
  // A cash machine in its wall panel, 1.6 m: a screen, keypad, card slot, and the cash slot that pushes out notes.
  e('atm', 'tech', 'machines', () => {
    const b = m('atm', { edge: 'sharp' })
      .box([0.8, 1.7, 0.6], [0, 0.85, -0.05], { color: '#2b5fa8', round: 0.06 })
      .box([0.66, 0.6, 0.08], [0, 1.25, 0.26], { color: 'darkgray', round: 0.1 })
      .box([0.38, 0.28, 0.02], [0, 1.32, 0.3], { color: 'cyan', glow: true, round: 0.1, name: 'screen', mover: { kind: 'light', on: true } })
      .box([0.6, 0.1, 0.3], [0, 0.95, 0.34], { color: 'lightgray', rot: [20, 0, 0] })
      .box([0.12, 0.02, 0.04], [0.2, 1.06, 0.3], { color: 'lime', glow: true })
      .box([0.34, 0.05, 0.06], [0, 0.8, 0.27], { color: '#2a2726' })
      .box([0.24, 0.12, 0.004], [0, 0.8, 0.24], { color: '#9fd18a', name: 'cash', piece: true })
      .label('ATM', [0.4, 0.14], [0, 1.62, 0.26], { color: 'white', glow: true, depth: 0.02 })
      .socket('card', [0.2, 1.06, 0.32], 'slot', { size: 0.09 });
    b.each(12, (i) => b.box([0.035, 0.008, 0.03], [-0.08 + (i % 3) * 0.045, 0.98, 0.33 + Math.floor(i / 3) * 0.04], { color: 'darkgray', rot: [20, 0, 0], noInk: true }));
    return b
      .act({
        click: [
          [A.say('Beep boop... whirr!', 1.5), A.pose('cash', { move: [0, 0, 0.12], dur: 0.5 }), A.say('Ka-chunk!', 1)],
          [A.pose('cash', { move: [0, 0, 0], dur: 0.4 }), A.operate('screen', 'off'), A.wait(0.4), A.operate('screen', 'on'), A.say('Thank you!', 1.5)],
        ],
      })
      .done();
  }),
  // A model atom on a stand: a nucleus of red protons and blue neutrons and three tilted orbits with electrons,
  // which whirl round.
  e('atom', 'study', 'science', () => {
    const b = m('atom').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'darkgray', edge: 'sharp' }).stick([0, 0.02, 0], [0, 0.11, 0], 0.008, 'gray');
    b.ball(0.034, [0.012, 0.2, 0], { color: 'red' }).ball(0.034, [-0.014, 0.193, 0.01], { color: 'blue' }).ball(0.034, [0.002, 0.184, -0.012], { color: 'red' }).ball(0.034, [-0.004, 0.21, 0.012], { color: 'blue' });
    b.torus([0.26, 0.26, 0.006], [0, 0.2, 0], { color: 'gray', rot: [90, 0, 0], tube: 0.04, name: 'cloud', mover: { kind: 'spin', axis: 'y', amount: 240 } });
    b.ball(0.024, [0.125, 0.2, 0], { color: 'yellow', glow: true, parent: 'cloud' });
    b.each(2, (i) => {
      const a = (i ? -1 : 1) * 60;
      b.torus([0.26, 0.26, 0.006], [0, 0.2, 0], { color: 'gray', rot: [0, a, 0], tube: 0.04, parent: 'cloud' });
      b.ball(0.024, [0, 0.2 + 0.125, 0], { color: 'yellow', glow: true, parent: 'cloud' });
      b.ball(0.024, [Math.cos(a / RAD) * 0.088, 0.2 - 0.088, -Math.sin(a / RAD) * 0.088], { color: 'yellow', glow: true, parent: 'cloud' });
    });
    return b.act({ click: [[A.operate('cloud', 'on'), A.effect('sparkle', { dur: 2 }), A.wait(2.5), A.operate('cloud', 'off')]] }).done();
  }),
  // An attic, seen cut away: floorboards under a steep roof of rafters, a round window in the gable, a hanging
  // bulb, boxes and an old trunk whose lid creaks open in a puff of dust.
  e('attic', 'places', 'rooms', () => {
    const b = m('attic', { edge: 'sharp' })
      .box([4.4, 0.15, 3.4], [0, 0.075, 0], { color: 'lightwood', round: 0.05 });
    b.each(6, (i) => b.box([0.02, 0.005, 3.4], [-1.85 + i * 0.74, 0.152, 0], { color: 'darkwood', noInk: true }));
    // the far roof plane is boarded; the near one is cut away to its rafters so you can see in
    b.box([0.14, 3.1, 3.5], [-1.1, 1.35, 0], { color: '#a8743f', rot: [0, 0, -45], round: 0.1 });
    b.each(4, (i) => b.pair((s) => b.box([0.1, 3.1, 0.12], [s * 1.0, 1.35, -1.5 + i * 1.0], { color: 'darkwood', rot: [0, 0, s * 45] })));
    b.box([0.12, 0.14, 3.5], [0, 2.43, 0], { color: 'darkwood' });
    b.wedge([4.2, 2.1, 0.1], [0, 1.2, -1.7], { color: 'wood' })
      .torus([0.7, 0.7, 0.08], [0, 1.25, -1.62], { color: 'darkwood', tube: 0.15 })
      .cyl([0.6, 0.04, 0.6], [0, 1.25, -1.64], { color: WIN, rot: [90, 0, 0] })
      .stick([0, 2.3, 0.2], [0, 1.95, 0.2], 0.02, 'black')
      .ball(0.12, [0, 1.88, 0.2], { color: '#fff6c8', glow: true, name: 'bulb', mover: { kind: 'light' } })
      .box([0.9, 0.42, 0.5], [-0.8, 0.36, 0.5], { color: 'darkbrown', round: 0.2, name: 'trunk' })
      .box([0.92, 0.12, 0.52], [-0.8, 0.63, 0.5], { color: '#6b4a2a', round: 0.6, name: 'lid', pivot: [-0.8, 0.6, 0.25], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .box([0.94, 0.04, 0.06], [-0.8, 0.45, 0.76], { color: 'gold' })
      .box([0.45, 0.4, 0.45], [0.7, 0.35, 0.3], { color: 'tan', round: 0.1 })
      .box([0.35, 0.3, 0.35], [0.68, 0.7, 0.3], { color: '#c9a46a', round: 0.1 })
      .box([0.4, 0.3, 0.4], [1.0, 0.3, -0.6], { color: 'tan', round: 0.1 });
    return b
      .act({ click: [[A.operate('bulb', 'on')], [A.operate('lid', 'open'), A.par(A.effect('dust', { dur: 1.5 }), A.say('Creeeak... achoo!', 2)), A.wait(1.5), A.operate('lid', 'close'), A.operate('bulb', 'off')]] })
      .done();
  }),
  // A quad bike at real size (2 m long, 1.2 m tall): chunky knobbly tyres, red bodywork with front and rear
  // racks, a saddle, handlebars and headlights; it revs.
  e('atv', 'garage', 'off-road', () => {
    const b = m('atv', { view: 'side' })
      .loft([0.9, 0.5, 1.7], [0, 0.72, 0], [[0, 0.8, 0.6, 0], [0.25, 1, 1, 0], [0.75, 1, 1, 0], [1, 0.7, 0.6, -0.05]], { color: 'red', boxy: 0.6, name: 'body' })
      .box([0.38, 0.14, 0.62], [0, 0.98, -0.18], { color: '#2a2726', round: 0.7 })
      .box([1.15, 0.08, 0.6], [0, 0.86, 0.66], { color: 'red', round: 0.4, edge: 'sharp' })
      .box([1.15, 0.08, 0.6], [0, 0.86, -0.66], { color: 'red', round: 0.4, edge: 'sharp' })
      .stick([0, 0.85, 0.42], [0, 1.08, 0.36], 0.05, 'darkgray')
      .stick([-0.38, 1.1, 0.34], [0.38, 1.1, 0.34], 0.035, '#2a2726')
      .box([0.9, 0.04, 0.35], [0, 1.0, 0.78], { color: 'darkgray', edge: 'sharp' })
      .box([0.9, 0.04, 0.35], [0, 1.0, -0.82], { color: 'darkgray', edge: 'sharp' })
      .box([0.16, 0.08, 0.04], [0.2, 0.78, 0.86], { color: '#fff6c8', glow: true, name: 'lightL', mover: { kind: 'light' } })
      .box([0.16, 0.08, 0.04], [-0.2, 0.78, 0.86], { color: '#fff6c8', glow: true, name: 'lightR', mover: { kind: 'light' } })
      .stick([0.2, 0.35, -0.7], [0.2, 0.35, -0.95], 0.06, 'silver')
      .socket('seat', [0, 1.06, -0.2], 'seat');
    b.pair((s) => {
      tyre(b, s > 0 ? 'wheelFL' : 'wheelFR', [s * 0.48, 0.3, 0.6], 0.6, 0.26, { hub: 'darkgray' });
      tyre(b, s > 0 ? 'wheelBL' : 'wheelBR', [s * 0.48, 0.3, -0.62], 0.6, 0.3, { hub: 'darkgray' });
    });
    return b.act({ click: [[A.operate('light', 'on'), A.par(A.anim('shake', 3), A.say('Vroom vroom!', 2), A.effect('smoke', { dur: 1.5 })), A.wait(1), A.operate('light', 'off')]] }).done();
  }),
  // An auction house: a two-storey hall with columns and a banner, and a giant gavel sign over the door that bangs.
  e('auction house', 'places', 'shops', () => {
    const b = bldg('auction house', { w: 10, d: 7, floors: 2, storey: 3.4, wall: 'maroon', trim: 'cream', roofKind: 'flat', roof: '#5a2a2a', doorColor: 'darkwood', cols: 4, sign: 'AUCTION HOUSE', signColor: 'cream' });
    b.pair((s) => b.cyl([0.5, 6.6, 0.5], [s * 1.6, 3.6, 3.9], { color: 'cream' }));
    b.box([4.2, 0.5, 1.6], [0, 7.1, 3.4], { color: 'cream' })
      .stick([3.6, 5.2, 4.2], [3.6, 6.4, 4.2], 0.25, 'darkwood', { name: 'gavel', pivot: [3.6, 5.2, 4.2] })
      .cyl([0.6, 1.1, 0.6], [3.6, 6.5, 4.2], { color: 'darkwood', rot: [0, 0, 90], parent: 'gavel' })
      .cyl([1.0, 0.25, 0.8], [3.6, 4.9, 4.2], { color: 'darkwood' });
    const bang = [A.pose('gavel', { rot: [0, 0, 40], dur: 0.25 }), A.pose('gavel', { rot: [0, 0, 0], dur: 0.12 })];
    return b.act({ click: [[A.say('Going once, going twice...', 2), A.wait(1.5), ...bang, A.say('SOLD!', 1.5)]] }).done();
  }),
  // A sliding automatic door: steel frame and header with a motion sensor, two glass leaves that glide apart.
  e('automatic door', 'home', 'doors and windows', () => {
    const b = m('automatic door', { edge: 'sharp' })
      .box([2.8, 0.4, 0.3], [0, 2.4, 0], { color: 'steel', round: 0.1 })
      .box([2.8, 0.04, 0.4], [0, 0.02, 0], { color: 'gray', round: 0 })
      .box([0.3, 0.08, 0.06], [0, 2.3, 0.17], { color: '#2a2726' })
      .ball(0.03, [0.08, 2.3, 0.2], { color: 'red', glow: true, name: 'sensor', mover: { kind: 'light' } })
      .label('AUTOMATIC DOOR', [1.0, 0.12], [0, 1.5, 0.07], { color: 'white', depth: 0.003 });
    b.pair((s) => {
      b.box([0.2, 2.2, 0.25], [s * 1.3, 1.1, 0], { color: 'steel', round: 0.1 });
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([1.1, 2.15, 0.05], [s * 0.6, 1.1, 0.03], { color: 'glass', round: 0.05, name: n, mover: { kind: 'slide', axis: 'x', amount: s * 1.0 } });
      b.box([0.05, 2.15, 0.07], [s * 0.07, 1.1, 0.03], { color: 'silver', round: 0.2, parent: n });
      b.box([0.6, 0.06, 0.055], [s * 0.6, 1.3, 0.04], { color: 'white', noInk: true, parent: n });
    });
    return b.act({ click: [[A.operate('sensor', 'on'), A.operate('door', 'open'), A.say('Whoosh!', 1.2), A.wait(2.5), A.operate('door', 'close'), A.operate('sensor', 'off')]] }).done();
  }),
  // An avocado cut in half on a little board: dark pebbly skin, pale green flesh and the brown stone, which lifts out.
  e('avocado', 'food', 'fruit', () =>
    m('avocado')
      .box([0.2, 0.015, 0.14], [0, 0.0075, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .ball([0.075, 0.055, 0.11], [0.05, 0.04, 0], { color: '#2f4a1e' })
      .ball([0.07, 0.04, 0.1], [-0.045, 0.028, 0], { color: '#2f4a1e', name: 'half' })
      .ball([0.064, 0.012, 0.092], [-0.045, 0.048, 0], { color: '#c7d77a' })
      .ball([0.05, 0.012, 0.07], [-0.045, 0.05, 0], { color: '#e3e89a' })
      .ball(0.036, [-0.045, 0.054, -0.005], { color: '#7a4a28', name: 'stone', parent: 'half', piece: true })
      .act({ click: [[A.detach('stone', 'stone')], [A.reattach('stone')]] })
      .done(),
  ),
  // An avocado tree, 8 m, with a broad dark crown and pear-shaped fruit hanging in it: shake one down.
  e('avocado tree', 'garden', 'fruit trees', () => tree2('avocado tree', 8, { crown: 'darkgreen', crown2: '#356b30', fruit: '#2f4a1e', fruitSize: 0.12, n: 12 }).act({ click: [[A.anim('shake'), A.detach('fruit', 'avocado')], [A.reattach('fruit')]] }).done()),
  // A shop front with a red-and-white striped awning on arms; it winds in and out.
  e('awning', 'places', 'street things', () => {
    const b = m('awning', { edge: 'sharp' })
      .box([3.4, 3.2, 0.3], [0, 1.6, -0.15], { color: 'cream', round: 0.05 })
      .box([3.5, 0.2, 0.1], [0, 2.75, 0.03], { color: 'darkgreen' })
      .box([1.0, 2.1, 0.08], [-0.9, 1.05, 0.03], { color: 'darkwood' })
      .box([1.4, 1.2, 0.08], [0.7, 1.45, 0.03], { color: WIN })
      .box([3.3, 0.05, 1.4], [0, 2.55, 0.65], { color: 'white', rot: [20, 0, 0], name: 'awning', pivot: [0, 2.78, 0.05], mover: { kind: 'swing', axis: 'x', amount: -70 } });
    b.each(6, (i) => b.box([0.28, 0.055, 1.4], [-1.375 + i * 0.55, 2.552, 0.65], { color: 'red', rot: [20, 0, 0], parent: 'awning' }));
    b.each(6, (i) => b.ball([0.52, 0.22, 0.05], [-1.375 + i * 0.55, 2.2, 1.32], { color: i % 2 ? 'white' : 'red', parent: 'awning' }));
    b.pair((s) => b.rod([s * 1.6, 2.4, 0.02], [s * 1.6, 2.3, 1.2], 0.04, 'darkgray', { parent: 'awning' }));
    return b.act({ click: [[A.operate('awning', 'close'), A.say('Whirr...', 1.2)], [A.operate('awning', 'open'), A.say('Whirr...', 1.2)]] }).done();
  }),
  // An axe buried in a chopping block beside a split log: it swings up and comes down with a thwack.
  e('axe', 'workshop', 'hand tools', () =>
    m('axe')
      .cyl([0.5, 0.42, 0.5], [0, 0.21, 0], { color: 'bark' })
      .cyl([0.46, 0.02, 0.46], [0, 0.425, 0], { color: 'lightwood' })
      .box([0.2, 0.13, 0.04], [0.02, 0.47, 0], { color: 'iron', round: 0.2, edge: 'sharp', name: 'axe', pivot: [0.02, 0.44, 0] })
      .box([0.03, 0.13, 0.045], [-0.08, 0.47, 0], { color: 'silver', round: 0.2, edge: 'sharp', parent: 'axe' })
      .rod([0.1, 0.5, 0], [0.48, 0.92, 0], 0.045, 'wood', { parent: 'axe' })
      .cyl([0.2, 0.32, 0.1], [-0.42, 0.16, 0.15], { color: 'lightwood', rot: [0, 30, 0] })
      .cyl([0.2, 0.32, 0.1], [-0.45, 0.16, -0.12], { color: 'lightwood', rot: [0, -40, 0] })
      .act({ click: [[A.pose('axe', { rot: [0, 0, 70], dur: 0.5 }), A.pose('axe', { rot: [0, 0, 0], dur: 0.15 }), A.par(A.say('THWACK!', 1.2), A.effect('dust', { dur: 1 }))]] })
      .done(),
  ),
  // A baby bottle at its real 18 cm: milk, measuring marks, a screw ring and the teat; it tips to feed.
  e('baby bottle', 'home', 'baby things', () => {
    const b = m('baby bottle')
      .cyl([0.065, 0.085, 0.065], [0, 0.0425, 0], { color: 'milk', name: 'bottle', pivot: [0, 0, 0] })
      .cyl([0.066, 0.045, 0.066], [0, 0.1075, 0], { color: 'glass', parent: 'bottle' })
      .cyl([0.072, 0.025, 0.072], [0, 0.142, 0], { color: 'skyblue', parent: 'bottle', edge: 'sharp' })
      .cyl([0.04, 0.025, 0.04], [0, 0.165, 0], { color: '#e8c79a', taper: 0.5, parent: 'bottle' })
      .ball([0.022, 0.03, 0.022], [0, 0.18, 0], { color: '#e8c79a', parent: 'bottle' });
    b.each(3, (i) => b.box([0.016, 0.003, 0.005], [0.012, 0.04 + i * 0.025, 0.032], { color: 'skyblue', noInk: true, parent: 'bottle' }));
    return b.act({ click: [[A.pose('bottle', { rot: [0, 0, 70], dur: 0.5 }), A.say('Glug glug glug...', 2), A.wait(1.2), A.pose('bottle', { rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A baby monitor: the camera unit on its stand and the parent unit with a screen; it lights up with a cry.
  e('baby monitor', 'tech', 'gadgets', () =>
    m('baby monitor', { edge: 'sharp' })
      .box([0.08, 0.13, 0.035], [0.06, 0.065, 0.02], { color: 'white', round: 0.7 })
      .box([0.06, 0.05, 0.006], [0.06, 0.085, 0.038], { color: 'skyblue', glow: true, name: 'screen', mover: { kind: 'light' } })
      .rod([0.085, 0.12, 0.02], [0.09, 0.17, 0.02], 0.012, 'white')
      .box([0.05, 0.01, 0.004], [0.06, 0.035, 0.038], { color: 'lightgray' })
      .cyl([0.06, 0.012, 0.06], [-0.08, 0.006, -0.02], { color: 'white' })
      .stick([-0.08, 0.012, -0.02], [-0.08, 0.07, -0.02], 0.015, 'white')
      .ball(0.065, [-0.08, 0.1, -0.02], { color: 'white', edge: 'soft' })
      .cyl([0.032, 0.015, 0.032], [-0.08, 0.1, 0.015], { color: '#2a2726', rot: [90, 0, 0] })
      .ball(0.01, [-0.06, 0.125, 0.012], { color: 'lime', glow: true })
      .act({ click: [[A.operate('screen', 'on'), A.say('Waaah! Waaah!', 2), A.wait(2), A.operate('screen', 'off')]] })
      .done(),
  ),
  // A bottle of baby powder with a sifter cap: squeeze it and a white puff comes out.
  e('baby powder', 'home', 'baby things', () =>
    m('baby powder')
      .box([0.07, 0.15, 0.045], [0, 0.075, 0], { color: 'white', round: 0.7, name: 'bottle' })
      .cyl([0.045, 0.03, 0.045], [0, 0.165, 0], { color: 'pink', taper: 0.7, edge: 'sharp' })
      .label('BABY POWDER', [0.05, 0.05], [0, 0.08, 0.024], { color: 'skyblue', depth: 0.002 })
      .ball([0.02, 0.02, 0.006], [0, 0.11, 0.024], { color: 'pink', noInk: true })
      .act({ click: [[A.par(A.anim('pulse'), A.effect('dust', { dur: 1.2 }), A.say('Puff!', 1))]] })
      .done(),
  ),
  // A bamboo back scratcher (45 cm) leaning in a pot, its little carved hand at the top; it scratches.
  e('back scratcher', 'home', 'bathroom', () =>
    m('back scratcher')
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: 'teal', taper: 1.2, edge: 'sharp' })
      .stick([0, 0.04, 0], [0.04, 0.48, 0.02], 0.012, '#d6b26a', { name: 'stick', pivot: [0, 0.06, 0] })
      .box([0.04, 0.05, 0.012], [0.042, 0.5, 0.025], { color: '#d6b26a', round: 0.5, parent: 'stick', rot: [-20, 0, 5] })
      .act({ click: [[A.say('Scritch scratch!', 1.5), A.pose('stick', { rot: [0, 0, 12], dur: 0.15 }), A.pose('stick', { rot: [0, 0, -8], dur: 0.15 }), A.pose('stick', { rot: [0, 0, 12], dur: 0.15 }), A.pose('stick', { rot: [0, 0, 0], dur: 0.15 }), A.say('Ahhh...', 1.2)]] })
      .done(),
  ),
  // A backhoe loader at real size (2.9 m cab, 7 m long): yellow body, glass cab with a seat, big rear and small
  // front wheels, the front loader bucket that lifts, and the rear boom and dipper with a digging bucket.
  e('backhoe', 'garage', 'construction vehicles', () => {
    const Y = '#f2b632';
    const b = m('backhoe', { view: 'side', edge: 'sharp' })
      .box([2.0, 0.9, 3.6], [0, 1.25, 0.2], { color: Y, round: 0.15, name: 'body' })
      .box([1.6, 0.6, 1.6], [0, 1.95, 1.3], { color: Y, round: 0.3 })
      .box([0.8, 0.05, 1.4], [0, 1.73, 1.3], { color: '#2a2726' })
      .box([1.8, 1.4, 1.6], [0, 2.4, -0.6], { color: GL, round: 0.05 })
      .box([1.9, 0.12, 1.75], [0, 3.16, -0.6], { color: Y, round: 0.2 })
      .box([0.6, 0.5, 0.6], [0, 1.95, -0.5], { color: '#2a2726', round: 0.3 })
      .stick([0.6, 2.4, 1.6], [0.6, 3.2, 1.6], 0.12, '#2a2726')
      .socket('seat', [0, 2.1, -0.5], 'seat')
      // front loader: arms and a bucket that swings up
      .box([2.3, 0.85, 0.7], [0, 0.7, 3.3], { color: Y, round: 0.1, name: 'bucket', pivot: [0, 1.5, 2.2], mover: { kind: 'swing', axis: 'x', amount: -35 } })
      .box([2.32, 0.1, 0.25], [0, 0.32, 3.62], { color: 'silver', parent: 'bucket' })
      // rear boom, dipper and digging bucket
      .box([0.3, 0.6, 2.4], [0, 2.4, -2.6], { color: Y, rot: [-35, 0, 0], name: 'boom', pivot: [0, 1.4, -1.6] })
      .box([0.26, 2.0, 0.4], [0, 2.4, -3.8], { color: Y, rot: [15, 0, 0], parent: 'boom' })
      .box([0.6, 0.55, 0.6], [0, 1.25, -3.95], { color: Y, rot: [-30, 0, 0], parent: 'boom' })
      .box([0.62, 0.08, 0.5], [0, 1.0, -4.1], { color: 'silver', parent: 'boom' });
    b.pair((s) => {
      b.rod([s * 1.05, 1.5, 0.9], [s * 1.12, 1.2, 2.9], 0.18, Y, { parent: 'bucket' });
      b.box([0.25, 1.0, 0.25], [s * 1.2, 0.9, -1.5], { color: Y }).box([0.5, 0.08, 0.5], [s * 1.25, 0.4, -1.5], { color: '#2a2726' });
      tyre(b, s > 0 ? 'wheelFL' : 'wheelFR', [s * 0.95, 0.47, 1.6], 0.95, 0.4, { hub: Y });
      tyre(b, s > 0 ? 'wheelBL' : 'wheelBR', [s * 0.92, 0.75, -0.7], 1.5, 0.5, { hub: Y });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('boom', { rot: [-35, 0, 0], dur: 1 }), A.say('Rumble rumble...', 1.5)), A.pose('boom', { rot: [10, 0, 0], dur: 1 }), A.effect('dust', { dur: 1.5 }), A.pose('boom', { rot: [0, 0, 0], dur: 1 })],
          [A.operate('bucket', 'open'), A.par(A.anim('shake'), A.say('Beep, beep, beep!', 2)), A.wait(1.5), A.operate('bucket', 'close')],
        ],
      })
      .done();
  }),
  // A school backpack (45 cm): padded body, front zip pocket, a top flap that opens, straps and a grab handle.
  // A book goes in, and comes out again.
  e('backpack', 'wardrobe', 'bags', () =>
    m('backpack')
      .box([0.3, 0.42, 0.18], [0, 0.21, 0], { color: 'red', round: 0.6, name: 'pack' })
      .box([0.31, 0.12, 0.2], [0, 0.39, 0.01], { color: 'darkred', round: 0.7, name: 'flap', pivot: [0, 0.43, -0.08], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .box([0.24, 0.17, 0.06], [0, 0.14, 0.1], { color: 'darkred', round: 0.6 })
      .box([0.16, 0.012, 0.01], [0, 0.19, 0.13], { color: 'black', noInk: true })
      .box([0.012, 0.024, 0.012], [0.07, 0.19, 0.135], { color: 'silver' })
      .arc([0.08, 0.06, 0.02], [0, 0.44, -0.04], { color: 'black', tube: 0.25 })
      .capsule([0.045, 0.38, 0.03], [0.08, 0.22, -0.1], { color: 'black' })
      .capsule([0.045, 0.38, 0.03], [-0.08, 0.22, -0.1], { color: 'black' })
      .socket('inside', [0, 0.3, 0], 'inside', { size: 0.25 })
      .act({ click: [[A.operate('flap', 'open'), A.spawn('bk', 'book'), A.attach('bk', 'self', 'inside'), A.wait(0.5), A.operate('flap', 'close')], [A.operate('flap', 'open'), A.remove('self.inside', 'pop'), A.wait(0.5), A.operate('flap', 'close')]] })
      .done(),
  ),
  // Rashers of bacon on a plate: it sizzles, and a rasher can be taken.
  e('bacon', 'food', 'breakfast', () => {
    const b = plate(m('bacon'), 0.26);
    b.box([0.22, 0.004, 0.16], [0, 0.021, 0], { color: 'white', name: 'dish', round: 0 });
    for (const z of [-0.035, 0.035])
      b.each(5, (i) => {
        const x0 = -0.1 + i * 0.05, y = 0.03 + (i % 2) * 0.007, r = (i % 2 ? -1 : 1) * 12;
        b.box([0.056, 0.007, 0.034], [x0, y, z], { color: '#b5543c', rot: [0, 0, r], round: 0.3 });
        b.box([0.056, 0.0075, 0.011], [x0, y, z + 0.012], { color: '#f3d9c0', rot: [0, 0, r], round: 0.3, noInk: true });
      });
    b.box([0.24, 0.007, 0.034], [0.01, 0.045, 0.0], { color: '#a8442c', rot: [0, 25, 0], round: 0.3, name: 'rasher', parent: 'dish', piece: true });
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5))], [A.detach('rasher', 'rasher')], [A.reattach('rasher')]] }).done();
  }),
  // A police-style shield badge in an open leather wallet standing on its edge; it gleams.
  e('badge', 'wardrobe', 'pins and badges', () =>
    m('badge', { edge: 'sharp' })
      .box([0.1, 0.13, 0.012], [0, 0.07, -0.01], { color: 'black', round: 0.3 })
      .box([0.1, 0.13, 0.012], [-0.06, 0.07, -0.05], { color: 'black', round: 0.3, rot: [0, 50, 0] })
      .box([0.07, 0.045, 0.01], [0, 0.093, 0.0], { color: 'gold', round: 0.3, name: 'shield' })
      .cone([0.07, 0.05, 0.01], [0, 0.045, 0.0], { color: 'gold', rot: [180, 0, 0], segs: 4, parent: 'shield' })
      .cyl([0.036, 0.006, 0.036], [0, 0.075, 0.006], { color: 'navy', rot: [90, 0, 0], parent: 'shield' })
      .star(0.024, [0, 0.075, 0.01], { color: 'silver', parent: 'shield' })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1.2 }), A.anim('pulse'), A.say('Ting!', 1))]] })
      .done(),
  ),
  // A burlap sack tied at the neck with string; it thumps down.
  e('bag', 'home', 'bags and boxes', () =>
    m('bag')
      .ball([0.32, 0.34, 0.26], [0, 0.17, 0], { color: '#c8a46a' })
      .cyl([0.14, 0.08, 0.12], [0, 0.34, 0], { color: '#c8a46a', taper: 0.6 })
      .torus([0.1, 0.1, 0.02], [0, 0.37, 0], { color: 'brown', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.08, 0.06, 0.08], [0, 0.41, 0], { color: '#c8a46a', taper: 2 })
      .rod([0.04, 0.37, 0.04], [0.08, 0.3, 0.1], 0.008, 'brown')
      .box([0.004, 0.2, 0.004], [0.05, 0.18, 0.125], { color: '#9a7a4a', noInk: true })
      .box([0.004, 0.18, 0.004], [-0.06, 0.17, 0.122], { color: '#9a7a4a', noInk: true })
      .act({ click: [[A.anim('hop'), A.par(A.effect('dust', { dur: 0.8 }), A.say('Thump!', 1))]] })
      .done(),
  ),
  // A sesame bagel sliced in half on a board; the top half lifts to show the cream cheese.
  e('bagel', 'food', 'bread', () => {
    const b = m('bagel')
      .box([0.16, 0.015, 0.14], [0, 0.0075, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .torus([0.1, 0.1, 0.022], [0, 0.026, 0], { color: '#c98a45', rot: [90, 0, 0], tube: 0.34, name: 'bottom' })
      .torus([0.096, 0.096, 0.008], [0, 0.04, 0], { color: 'white', rot: [90, 0, 0], tube: 0.32 })
      .torus([0.1, 0.1, 0.024], [0, 0.056, 0], { color: '#c98a45', rot: [90, 0, 0], tube: 0.34, name: 'top', pivot: [-0.05, 0.045, 0], piece: true });
    b.each(8, (i) => { const a = (i / 8) * Math.PI * 2; b.ball([0.006, 0.003, 0.004], [Math.cos(a) * 0.034, 0.069, Math.sin(a) * 0.034], { color: 'cream', noInk: true, rot: [0, i * 40, 0], parent: 'top' }); });
    return b.act({ click: [[A.pose('top', { rot: [0, 0, 70], dur: 0.5 }), A.say('Mmm, cream cheese!', 1.5), A.wait(1), A.pose('top', { rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // Highland bagpipes on a stand: a tartan bag, three drones with cords and ribbons, the chanter and blowpipe.
  // The bag squeezes and they skirl.
  e('bagpipes', 'music', 'wind', () => {
    const b = m('bagpipes')
      .cyl([0.36, 0.03, 0.36], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, -0.05], [0, 0.7, -0.05], 0.03, 'darkwood')
      .ball([0.42, 0.34, 0.24], [0, 0.82, 0], { color: '#a3322a', name: 'bag' })
      .box([0.43, 0.02, 0.25], [0, 0.85, 0], { color: 'darkgreen', noInk: true, rot: [0, 0, 20], parent: 'bag' })
      .box([0.02, 0.35, 0.25], [0.05, 0.82, 0], { color: 'darkgreen', noInk: true, rot: [0, 0, 20], parent: 'bag' })
      .box([0.02, 0.35, 0.25], [-0.08, 0.82, 0], { color: 'navy', noInk: true, rot: [0, 0, 20], parent: 'bag' })
      .rod([-0.08, 0.72, 0.08], [-0.13, 0.4, 0.14], 0.03, '#2a2726')
      .cyl([0.045, 0.05, 0.045], [-0.135, 0.37, 0.145], { color: 'cream', taper: 1.3 })
      .rod([-0.12, 0.9, 0.07], [-0.24, 1.05, 0.16], 0.022, '#2a2726');
    for (const [x0, t] of [[0.1, 1.45], [0.02, 1.32], [-0.06, 1.2]] as Array<[number, number]>) {
      b.rod([x0, 0.92, -0.03], [x0 + 0.12, t, -0.12], 0.032, '#2a2726').cyl([0.05, 0.05, 0.05], [x0 + 0.12, t + 0.02, -0.12], { color: 'cream', taper: 1.3 });
      b.cyl([0.05, 0.03, 0.05], [x0 + 0.06, (0.92 + t) / 2, -0.075], { color: 'cream' });
    }
    b.rod([0.1, 1.2, -0.08], [0.16, 0.95, -0.05], 0.012, 'red');
    return b.act({ click: [[A.pose('bag', { scale: 0.92, dur: 0.6 }), A.par(A.say('Wheeee-drone-drone!', 2.5), A.anim('wobble')), A.pose('bag', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A baguette (65 cm) standing in a paper bag; the crusty end snaps off.
  e('baguette', 'food', 'bread', () =>
    m('baguette')
      .box([0.15, 0.28, 0.1], [0, 0.14, 0], { color: '#bf9a6a', round: 0.1, edge: 'sharp' })
      .box([0.152, 0.03, 0.102], [0, 0.265, 0], { color: '#a8845a', round: 0.1, edge: 'sharp' })
      .rod([-0.02, 0.12, 0.005], [0.06, 0.58, 0.014], 0.066, '#e0a85a', { name: 'loaf' })
      .rod([0.06, 0.58, 0.014], [0.072, 0.66, 0.016], 0.064, '#e0a85a', { name: 'end', parent: 'loaf', piece: true })
      .rod([0.03, 0.12, -0.012], [-0.07, 0.55, -0.02], 0.06, 'crust')
      .box([0.03, 0.008, 0.02], [0.045, 0.5, 0.045], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .box([0.03, 0.008, 0.02], [0.03, 0.42, 0.043], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .box([0.03, 0.008, 0.02], [0.015, 0.34, 0.042], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .act({ click: [[A.detach('end', 'crust'), A.say('Crunch!', 1)], [A.reattach('end')]] })
      .done(),
  ),
  // A tin of bait worms in damp soil; a worm wriggles.
  e('bait', 'sports', 'fishing', () =>
    m('bait')
      .cyl([0.09, 0.08, 0.09], [0, 0.04, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.092, 0.05, 0.092], [0, 0.04, 0], { color: 'teal' })
      .label('BAIT', [0.05, 0.026], [0, 0.04, 0.046], { color: 'teal', depth: 0.002 })
      .ball([0.084, 0.02, 0.084], [0, 0.08, 0], { color: 'dirt' })
      .rod([0.01, 0.08, 0.01], [0.02, 0.12, 0.02], 0.012, 'pink', { name: 'worm', pivot: [0.01, 0.08, 0.01] })
      .rod([0.02, 0.12, 0.02], [0.045, 0.125, 0.03], 0.012, 'pink', { parent: 'worm' })
      .rod([-0.015, 0.08, 0], [-0.03, 0.115, 0.01], 0.012, 'pink')
      .rod([-0.03, 0.115, 0.01], [-0.05, 0.1, 0.02], 0.012, 'pink')
      .act({ click: [[A.pose('worm', { rot: [0, 0, 30], dur: 0.2 }), A.pose('worm', { rot: [0, 0, -25], dur: 0.2 }), A.pose('worm', { rot: [0, 0, 20], dur: 0.2 }), A.pose('worm', { rot: [0, 0, 0], dur: 0.2 }), A.say('Wriggle!', 1)]] })
      .done(),
  ),
  // An opened can of baked beans, the lid curled back; they bubble as they heat.
  e('baked beans', 'food', 'canned food', () => {
    const b = m('baked beans')
      .cyl([0.08, 0.11, 0.08], [0, 0.055, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.082, 0.07, 0.082], [0, 0.055, 0], { color: 'teal' })
      .label('BEANS', [0.05, 0.03], [0, 0.055, 0.041], { color: 'teal', depth: 0.002 })
      .ball([0.072, 0.025, 0.072], [0, 0.105, 0], { color: '#d2691e' })
      .cyl([0.078, 0.004, 0.078], [0, 0.14, -0.045], { color: 'silver', rot: [70, 0, 0], name: 'lid', edge: 'sharp' });
    around(5, 0.018).forEach(([x0, z], i) => b.ball([0.014, 0.01, 0.009], [x0, 0.115, z], { color: '#e07a2e', rot: [0, i * 40, 0] }));
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.say('Blub blub blub...', 2))]] }).done();
  }),
  // A bakery: a two-storey shop with a striped awning, a window of loaves and cakes, a giant pretzel sign and a
  // chimney. The door opens on fresh bread.
  e('bakery', 'places', 'shops', () => {
    const b = bldg('bakery', { w: 7, d: 6, floors: 2, wall: '#f7d9b0', trim: 'white', roof: '#c0504d', doorColor: 'red', sign: 'BAKERY', signColor: 'white', shopWindow: true });
    b.each(7, (i) => b.box([1.0, 0.06, 1.2], [-3.0 + i * 1.0, 3.05, 3.55], { color: i % 2 ? 'white' : 'red', rot: [22, 0, 0] }));
    for (const x0 of [-2.5, -1.8, 1.8, 2.5]) b.capsule([0.25, 0.6, 0.25], [x0, 1.0, 2.85], { color: 'bread', rot: [0, 0, 90], edge: 'soft' });
    b.cyl([0.5, 0.3, 0.5], [-2.15, 1.3, 2.85], { color: 'pink' }).cyl([0.5, 0.3, 0.5], [2.15, 1.3, 2.85], { color: 'chocolate' });
    b.torus([1.2, 1.0, 0.25], [2.6, 5.4, 3.3], { color: 'crust', tube: 0.3 }).stick([2.6, 4.6, 3.0], [2.6, 4.6, 3.3], 0.08, 'darkgray');
    b.box([0.8, 2.2, 0.8], [-2.3, 8.4, -1.0], { color: '#a3322a', name: 'chimney' });
    return b
      .act({ click: [[A.operate('door', 'open'), A.effect('smoke', { dur: 3 }), A.spawn('loaf', 'baguette', { rel: 'front', of: 'self', dist: 'close' }), A.say('Ding! Fresh bread!', 2), A.wait(2), A.remove('loaf', 'pop'), A.operate('door', 'close')]] })
      .done();
  }),
  // A tin of baking powder; the lid comes off in a white puff.
  e('baking powder', 'food', 'baking', () =>
    m('baking powder')
      .cyl([0.08, 0.11, 0.08], [0, 0.055, 0], { color: 'white', name: 'tin' })
      .cyl([0.082, 0.06, 0.082], [0, 0.055, 0], { color: 'red' })
      .label('BAKING POWDER', [0.05, 0.03], [0, 0.055, 0.041], { color: 'red', depth: 0.002 })
      .cyl([0.084, 0.02, 0.084], [0, 0.118, 0], { color: 'silver', name: 'lid', parent: 'tin', piece: true, edge: 'sharp' })
      .act({ click: [[A.pose('lid', { move: [0.03, 0.05, 0], rot: [0, 0, -30], dur: 0.4 }), A.par(A.effect('dust', { dur: 1 }), A.say('Puff!', 1)), A.wait(0.8), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A baking sheet of cookies on a wire cooling rack: a flat tray (the vocabulary's 0.35 m is its length, not its
  // height). They steam fresh from the oven, and one is taken.
  e('baking sheet', 'kitchen', 'bakeware', () => {
    const b = m('baking sheet', { edge: 'sharp' })
      .box([0.42, 0.006, 0.32], [0, 0.03, 0], { color: 'silver', round: 0 });
    b.pair((s) => b.box([0.006, 0.03, 0.32], [s * 0.2, 0.015, 0], { color: 'silver', round: 0 }));
    b.box([0.4, 0.012, 0.3], [0, 0.04, 0], { color: '#9aa3ab', round: 0.2, name: 'tray' })
      .box([0.4, 0.02, 0.008], [0, 0.048, 0.152], { color: '#9aa3ab', round: 0.2 })
      .box([0.4, 0.02, 0.008], [0, 0.048, -0.152], { color: '#9aa3ab', round: 0.2 });
    b.each(6, (i) => b.cyl([0.07, 0.014, 0.07], [-0.12 + (i % 3) * 0.12, 0.053, -0.07 + Math.floor(i / 3) * 0.14], { color: '#c98a45', edge: 'soft', name: i === 4 ? 'cookie' : undefined, parent: i === 4 ? 'tray' : undefined, piece: i === 4 }));
    b.each(6, (i) => b.ball(0.012, [-0.11 + (i % 3) * 0.12, 0.061, -0.06 + Math.floor(i / 3) * 0.14], { color: 'chocolate', noInk: true, parent: i === 4 ? 'cookie' : undefined }));
    return b.act({ click: [[A.effect('steam', { dur: 2 })], [A.detach('cookie', 'cookie')], [A.reattach('cookie')]] }).done();
  }),
  // A first-floor balcony on a house wall: a slab with railings, flower boxes and French doors; someone steps out
  // and waves.
  e('balcony', 'places', 'house parts', () => {
    const b = m('balcony', { edge: 'sharp' })
      .box([5, 6, 0.3], [0, 3, -0.15], { color: '#f2e6cf', round: 0.02 })
      .box([2.8, 0.2, 1.3], [0, 3.0, 0.65], { color: 'lightgray', round: 0.1 })
      .box([2.6, 0.06, 0.06], [0, 4.05, 1.27], { color: 'darkgray' })
      .box([0.06, 0.06, 1.2], [1.3, 4.05, 0.67], { color: 'darkgray' })
      .box([0.06, 0.06, 1.2], [-1.3, 4.05, 0.67], { color: 'darkgray' })
      .box([0.9, 2.2, 0.06], [-0.45, 4.2, 0.03], { color: WIN, name: 'doorL', pivot: [-0.9, 4.2, 0.03], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([0.9, 2.2, 0.06], [0.45, 4.2, 0.03], { color: WIN, name: 'doorR', pivot: [0.9, 4.2, 0.03], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .box([0.06, 2.2, 0.08], [-0.45, 4.2, 0.07], { color: 'white', parent: 'doorL' })
      .box([0.06, 2.2, 0.08], [0.45, 4.2, 0.07], { color: 'white', parent: 'doorR' })
      .box([2.0, 0.12, 0.15], [0, 5.4, 0.05], { color: 'white' })
      .socket('balcony', [0.6, 3.1, 0.7], 'top', { size: 1.0 });
    b.each(12, (i) => b.stick([-1.3 + i * 0.236, 3.1, 1.27], [-1.3 + i * 0.236, 4.05, 1.27], 0.03, 'darkgray'));
    b.pair((s) => b.each(3, (i) => b.stick([s * 1.3, 3.1, 0.2 + i * 0.35], [s * 1.3, 4.05, 0.2 + i * 0.35], 0.03, 'darkgray')));
    b.box([1.0, 0.2, 0.22], [0, 4.2, 1.35], { color: '#c0603a' });
    b.each(5, (i) => b.ball(0.12, [-0.4 + i * 0.2, 4.36, 1.37], { color: i % 2 ? 'pink' : 'red', edge: 'soft' }));
    win(b, [-1.8, 1.5, 0.02], 1.0, 1.3, {});
    win(b, [1.8, 1.5, 0.02], 1.0, 1.3, {});
    return b
      .act({ click: [[A.operate('door', 'open'), A.spawn('p', 'woman'), A.attach('p', 'self', 'balcony'), A.par(A.anim('wave', 1, 'p'), A.say('Hello down there!', 2, 'p')), A.wait(2), A.remove('p', 'fade'), A.operate('door', 'close')]] })
      .done();
  }),
  // A red rubber playground ball (22 cm) with a white stripe; it bounces.
  e('ball', 'toys', 'balls', () =>
    m('ball')
      .ball(0.22, [0, 0.11, 0], { color: 'red' })
      .torus([0.222, 0.222, 0.03], [0, 0.11, 0], { color: 'white', rot: [0, 90, 0], tube: 0.06, noInk: true })
      .torus([0.222, 0.222, 0.03], [0, 0.11, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .act({ click: [[A.anim('bounce'), A.say('Boing!', 1)], [A.anim('bounce', 2), A.say('Boing boing!', 1)]] })
      .done(),
  ),
  // A ball bearing on a display pin: steel outer ring, a ring of balls in their cage, an inner race that spins.
  e('ball bearing', 'workshop', 'hardware', () => {
    const b = m('ball bearing', { edge: 'sharp' })
      .box([0.12, 0.02, 0.08], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.02, 0], [0, 0.04, 0], 0.012, 'brass')
      .torus([0.1, 0.1, 0.026], [0, 0.09, 0], { color: 'steel', tube: 0.14 })
      .torus([0.05, 0.05, 0.026], [0, 0.09, 0], { color: 'silver', tube: 0.28, name: 'race', mover: { kind: 'spin', axis: 'z', amount: 600 } })
      .cyl([0.022, 0.03, 0.022], [0, 0.09, 0], { color: '#2a2726', rot: [90, 0, 0], parent: 'race' });
    around(9, 0.0365).forEach(([x0, y]) => b.ball(0.015, [x0, 0.09 + y, 0], { color: 'silver', parent: 'race' }));
    return b.act({ click: [[A.operate('race', 'on'), A.say('Whirrrr...', 2), A.wait(2.5), A.operate('race', 'off')]] }).done();
  }),
  // A ball gown on a dress form: a fitted satin bodice and a full skirt to the floor with a sash; it twirls.
  e('ball gown', 'wardrobe', 'dresses', () =>
    mannequin('ball gown')
      .box([0.38, 0.42, 0.25], [0, 1.27, 0], { color: 'pink', round: 0.8 })
      .cyl([1.0, 0.96, 1.0], [0, 0.5, 0], { color: '#f6b8d0', taper: 0.36, segs: 18 })
      .cyl([1.02, 0.12, 1.02], [0, 0.07, 0], { color: '#f4a1c0', taper: 0.95, segs: 18 })
      .torus([0.4, 0.4, 0.07], [0, 1.03, 0], { color: 'magenta', rot: [90, 0, 0], tube: 0.2 })
      .ball(0.08, [0.0, 1.03, 0.19], { color: 'magenta' })
      .act({ click: [[A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.5 }))]] })
      .done(),
  ),
  // A soft-play ball pit (2.4 m square): padded blue walls, a sea of coloured balls; a child jumps in.
  e('ball pit', 'toys', 'playground', () => {
    const b = m('ball pit').box([2.4, 0.12, 2.4], [0, 0.06, 0], { color: 'blue', round: 0.3 });
    b.pair((s) => b.box([0.25, 0.65, 2.4], [s * 1.08, 0.33, 0], { color: '#4e8fd6', round: 0.6 }).box([2.4, 0.65, 0.25], [0, 0.33, s * 1.08], { color: s > 0 ? 'yellow' : '#4e8fd6', round: 0.6 }));
    b.box([1.9, 0.36, 1.9], [0, 0.3, 0], { color: '#f6d24a', round: 0.3, noInk: true });
    b.each(36, (i) => b.ball(0.12, [-0.85 + (i % 6) * 0.34 + (Math.floor(i / 6) % 2) * 0.1, 0.5 + ((i * 7) % 3) * 0.02, -0.85 + Math.floor(i / 6) * 0.34], { color: RAINBOW[(i * 5) % 6] }));
    return b
      .socket('pit', [0, 0.45, 0], 'top', { size: 1.5 })
      .act({ click: [[A.spawn('kid', 'girl'), A.attach('kid', 'self', 'pit'), A.par(A.anim('hop', 2, 'kid'), A.say('Wheee!', 1.5, 'kid')), A.wait(1.5), A.remove('kid', 'fade')]] })
      .done();
  }),
  // A shiny party balloon on a ribbon tied to a little weight; it swells and pops, and a new one fills up.
  e('balloon (fun)', 'toys', 'party', () =>
    m('balloon (fun)')
      .box([0.06, 0.05, 0.06], [0, 0.025, 0], { color: 'pink', round: 0.5, edge: 'sharp' })
      .stick([0, 0.05, 0], [0.02, 0.76, 0], 0.004, 'white', { noInk: true })
      .ball([0.3, 0.36, 0.3], [0.02, 0.94, 0], { color: 'red', name: 'balloon' })
      .cone([0.04, 0.03, 0.04], [0.02, 0.76, 0], { color: 'red', parent: 'balloon' })
      .ball([0.06, 0.08, 0.02], [-0.04, 1.02, 0.13], { color: '#ff9a8a', noInk: true, parent: 'balloon' })
      .act({ click: [[A.pose('balloon', { scale: 1.3, dur: 0.6 }), A.par(A.pose('balloon', { scale: 0.01, dur: 0.05 }), A.say('POP!', 1.2), A.effect('sparkle', { dur: 0.6 })), A.wait(0.8), A.pose('balloon', { scale: 1, dur: 1 })]] })
      .done(),
  ),
  // A ballroom, cut away: a parquet dance floor, tall mirrored walls between pilasters, a crystal chandelier that
  // lights up, and a couple who dance a turn.
  e('ballroom', 'places', 'rooms', () => {
    const b = m('ballroom', { edge: 'sharp' })
      .box([10, 0.2, 8], [0, 0.1, 0], { color: '#c98a45', round: 0.02 })
      .box([7, 0.02, 5], [0, 0.21, 0.4], { color: '#e0b070', noInk: true })
      .box([10, 5, 0.25], [0, 2.7, -4], { color: '#f2e6cf', round: 0.02 })
      .box([0.25, 5, 8], [-5, 2.7, 0], { color: '#f2e6cf', round: 0.02 })
      .box([10.2, 0.4, 0.4], [0, 5.3, -3.9], { color: 'gold' })
      .box([0.4, 0.4, 8.2], [-4.9, 5.3, 0], { color: 'gold' })
      .stick([0, 5.6, 0], [0, 4.4, 0], 0.05, 'gold')
      .cyl([1.4, 0.5, 1.4], [0, 4.1, 0], { color: 'gold', taper: 0.4 })
      .ball([1.3, 0.8, 1.3], [0, 3.7, 0], { color: '#fff6c8', glow: true, name: 'chandelier', mover: { kind: 'light' } });
    around(8, 0.75).forEach(([x0, z]) => b.cone([0.12, 0.3, 0.12], [x0, 4.45, z], { color: '#fff6c8', glow: true, parent: 'chandelier' }));
    b.each(4, (i) => b.box([1.6, 3.2, 0.05], [-3.6 + i * 2.4, 2.3, -3.86], { color: '#cfe6f2' }).box([0.4, 4.6, 0.4], [-4.8 + i * 2.4, 2.5, -3.8], { color: 'white' }));
    b.each(3, (i) => b.box([0.05, 3.2, 1.6], [-4.86, 2.3, -2.4 + i * 2.4], { color: '#cfe6f2' }));
    return b
      .act({ click: [[A.operate('chandelier', 'on'), A.spawn('d1', 'man'), A.spawn('d2', 'woman'), A.par(A.anim('dance', 2, 'd1'), A.anim('dance', 2, 'd2'), A.effect('sparkle', { dur: 2 })), A.wait(1), A.remove('d1', 'fade'), A.remove('d2', 'fade'), A.operate('chandelier', 'off')]] })
      .done();
  }),
  // A heap of balls: a football, a basketball, a tennis ball and a beach ball; one rolls away and back.
  e('balls', 'toys', 'balls', () =>
    m('balls')
      .ball(0.22, [-0.11, 0.11, 0], { color: 'white', name: 'football' })
      .ball([0.06, 0.06, 0.03], [-0.11, 0.15, 0.1], { color: 'black', noInk: true, parent: 'football' })
      .ball([0.05, 0.05, 0.03], [-0.04, 0.09, 0.08], { color: 'black', noInk: true, parent: 'football' })
      .ball(0.24, [0.13, 0.12, -0.02], { color: 'orange' })
      .torus([0.242, 0.242, 0.006], [0.13, 0.12, -0.02], { color: 'black', rot: [0, 90, 0], tube: 0.03, noInk: true })
      .ball(0.067, [0.05, 0.034, 0.16], { color: 'lime', name: 'tennis', piece: true, parent: 'football' })
      .ball(0.18, [0.02, 0.3, -0.04], { color: 'yellow' })
      .torus([0.182, 0.182, 0.05], [0.02, 0.3, -0.04], { color: 'blue', rot: [0, 30, 0], tube: 0.2, noInk: true })
      .act({ click: [[A.pose('tennis', { move: [0.3, 0, 0.2], rot: [0, 0, -360], dur: 0.8 }), A.wait(0.5), A.pose('tennis', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 })]] })
      .done(),
  ),
  // A pair of pink satin pointe shoes with their ribbons; one does a pirouette.
  // A pair of pink satin pointe shoes: flat soles, the boxed toes, the opening and satin ribbons; one does a
  // pirouette.
  e('ballet shoes', 'wardrobe', 'shoes', () => {
    const b = m('ballet shoes');
    b.pair((s) => {
      const n = s > 0 ? 'shoeL' : 'shoeR';
      b.box([0.068, 0.01, 0.23], [s * 0.05, 0.005, 0], { color: '#d8909f', round: 0.8, name: n, rot: [0, s * 8, 0] });
      b.ball([0.07, 0.05, 0.12], [s * 0.05 + s * 0.008, 0.028, 0.05], { color: 'pink', parent: n });
      b.box([0.066, 0.04, 0.12], [s * 0.05 - s * 0.007, 0.026, -0.055], { color: 'pink', round: 0.9, parent: n, rot: [0, s * 8, 0] });
      b.ball([0.046, 0.01, 0.1], [s * 0.05 - s * 0.006, 0.047, -0.04], { color: '#b0607a', parent: n, rot: [0, s * 8, 0], noInk: true });
      b.cyl([0.04, 0.012, 0.03], [s * 0.05 + s * 0.016, 0.03, 0.112], { color: '#f6c8d8', rot: [90, 0, 0], parent: n });
      b.rod([s * 0.08, 0.045, -0.04], [s * 0.15, 0.004, 0.03], 0.012, '#f6c8d8', { parent: n }).rod([s * 0.08, 0.045, -0.04], [s * 0.13, 0.004, -0.17], 0.012, '#f6c8d8', { parent: n });
    });
    return b.act({ click: [[A.pose('shoeL', { rot: [0, 360, 0], move: [0, 0.05, 0], dur: 0.9 }), A.pose('shoeL', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  e('bamboo', 'garden', 'grasses', () => {
    const b = m('bamboo').cyl([1.4, 0.15, 1.4], [0, 0.075, 0], { color: 'dirt', name: 'clump', pivot: [0, 0, 0] });
    const culms: Array<[number, number, number]> = [[0, 0, 8], [0.35, 0.2, 7.2], [-0.3, 0.25, 7.6], [0.2, -0.35, 6.5], [-0.25, -0.2, 6.9]];
    for (const [x0, z, h] of culms) {
      const tip: Vec3 = [x0 * 1.6, h, z * 1.6];
      b.rod([x0, 0.1, z], tip, 0.09, '#6a9a3a', { parent: 'clump' });
      b.each(Math.floor(h / 0.7), (k) => {
        const t = (k + 1) * 0.7 / h;
        b.cyl([0.105, 0.04, 0.105], [x0 + (tip[0] - x0) * t, 0.1 + (h - 0.1) * t, z + (tip[2] - z) * t], { color: '#c9d98a', parent: 'clump', noInk: true });
      });
      for (const k of [0.6, 0.75, 0.9]) b.ball([0.9, 0.12, 0.5], [x0 + (tip[0] - x0) * k + 0.3, h * k, z + (tip[2] - z) * k], { color: '#7cb342', rot: [0, k * 300, -25], parent: 'clump' }).ball([0.9, 0.12, 0.5], [x0 + (tip[0] - x0) * k - 0.3, h * k - 0.2, z + (tip[2] - z) * k], { color: '#5aa553', rot: [0, k * 200, 25], parent: 'clump' });
    }
    const sway = (a: number) => A.pose('clump', { rot: [0, 0, a], dur: 0.6 });
    return b.act({ click: [[A.say('Clack clack...', 2), sway(3), sway(-3), sway(2), sway(0)]] }).done();
  }),
  // A ripe banana (20 cm) lying on its side; its peel opens in three strips, and closes again.
  // A ripe banana (20 cm) lying on its curve, its stalk and dark tip: it gets eaten, leaving the peel, then a new
  // one appears.
  e('banana', 'food', 'fruit', () =>
    m('banana')
      .arc([0.2, 0.2, 0.036], [0, 0.1, 0], { color: 'banana', arc: 120, tube: 0.18, rot: [0, 0, 180], name: 'fruit' })
      .stick([0.071, 0.059, 0], [0.081, 0.076, 0], 0.012, '#7a6a2a', { parent: 'fruit' })
      .ball(0.012, [-0.074, 0.062, 0], { color: '#3a2a1a', parent: 'fruit' })
      .socket('peel', [0, 0, 0], 'top', { size: 0.3 })
      .act({ click: [[A.say('Yum!', 1.2), A.pose('fruit', { scale: 0.01, dur: 0.6 }), A.spawn('pl', 'banana peel'), A.attach('pl', 'self', 'peel')], [A.remove('self.peel', 'fade'), A.pose('fruit', { scale: 1, dur: 0.6 })]] })
      .done(),
  ),
  e('banana bread', 'food', 'cakes', () =>
    m('banana bread')
      .box([0.32, 0.015, 0.16], [0, 0.0075, 0], { color: 'lightwood', round: 0.3, edge: 'sharp' })
      .box([0.2, 0.08, 0.1], [-0.02, 0.055, 0], { color: '#8c5a2b', round: 0.5, name: 'loaf' })
      .box([0.17, 0.02, 0.07], [-0.02, 0.098, 0], { color: '#6b3e26', round: 0.8, parent: 'loaf' })
      .box([0.02, 0.075, 0.095], [0.1, 0.053, 0], { color: '#c9925a', round: 0.3, name: 'slice', parent: 'loaf', piece: true })
      .box([0.03, 0.006, 0.012], [-0.05, 0.11, 0.02], { color: 'banana', noInk: true, rot: [0, 30, 0] })
      .act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] })
      .done(),
  ),
  // A bowl of crunchy banana chips; one gets taken.
  e('banana chips', 'food', 'snacks', () => {
    const b = m('banana chips').cyl([0.15, 0.05, 0.15], [0, 0.025, 0], { color: 'teal', taper: 1.4, name: 'bowl', edge: 'sharp' });
    around(9, 0.045).forEach(([x0, z], i) => b.cyl([0.032, 0.005, 0.032], [x0, 0.055 + (i % 3) * 0.006, z], { color: i % 2 ? '#f2d27a' : '#e8c060', rot: [((i * 37) % 60) - 30, 0, ((i * 23) % 50) - 25] }));
    b.cyl([0.032, 0.005, 0.032], [0, 0.07, 0], { color: '#f2d27a', rot: [10, 0, 20], name: 'chip', parent: 'bowl', piece: true });
    return b.act({ click: [[A.detach('chip', 'chip'), A.say('Crunch!', 1)], [A.reattach('chip')]] }).done();
  }),
  // A banana skin splayed on the ground, four limp strips and the stalk; someone slips on it.
  e('banana peel', 'food', 'leftovers', () => {
    const b = m('banana peel')
      .cyl([0.04, 0.04, 0.04], [0, 0.025, 0], { color: 'banana', taper: 0.6 })
      .rod([0, 0.045, 0], [0.006, 0.07, 0], 0.014, '#8a8f3a');
    around(4, 1, 0.5).forEach(([x0, z]) => {
      b.ball([0.035, 0.012, 0.13], [x0 * 0.07, 0.008, z * 0.07], { color: 'banana', rot: [0, Math.atan2(x0, z) * RAD, 0] });
      b.ball([0.022, 0.004, 0.09], [x0 * 0.07, 0.014, z * 0.07], { color: '#fff3c8', rot: [0, Math.atan2(x0, z) * RAD, 0], noInk: true });
      b.ball(0.014, [x0 * 0.13, 0.008, z * 0.13], { color: 'darkbrown' });
    });
    return b.act({ click: [[A.spawn('p', 'man', { rel: 'near', of: 'self', dist: 'touch' }), A.par(A.anim('fall_over', 1, 'p'), A.say('Whoa!', 1.5, 'p')), A.wait(1), A.remove('p', 'fade')]] }).done();
  }),
  // Someone in a banana costume: a long yellow body from the knees up, a hood round the face with the banana's
  // tip and stalk on top. They dance and wave.
  e('banana suit', 'wardrobe', 'costumes', () =>
    withAct(
      who('banana suit', {
        top: 'banana', bottom: 'denim', shoes: 'black', long: true, style: 'short',
        acc: [
          (p, d) => {
            p.add({ name: 'suit', parent: 'torso', at: [0, d.torsoH * 0.32, 0], shape: 'capsule', size: [d.tw * 1.55, d.torsoH * 1.75, d.td * 1.8], srot: [0, 0, 5], color: col('banana'), layer: 2 });
            p.add({ name: 'suitHood', parent: 'head', at: [0, d.headY, -d.headD * 0.16], shape: 'ball', size: [d.headW * 1.3, d.headH * 1.25, d.headD * 1.1], color: col('banana'), layer: -1 });
            p.add({ name: 'suitTip', parent: 'head', at: [d.headW * 0.05, d.headY + d.headH * 0.85, -d.headD * 0.12], shape: 'capsule', size: [d.headW * 0.5, d.headH * 0.9, d.headW * 0.5], srot: [0, 0, 18], color: col('banana'), layer: 1 });
            p.add({ name: 'suitStalk', parent: 'head', at: [-d.headW * 0.1, d.headY + d.headH * 1.32, -d.headD * 0.12], shape: 'cyl', size: [d.headW * 0.22, d.headH * 0.2, d.headW * 0.22], color: col('darkbrown'), layer: 1 });
          },
        ],
      }),
      { click: [[A.par(A.anim('dance', 2), A.say("Let's go bananas!", 2))], [A.par(A.anim('wave'), A.say("Hi! I'm a banana!", 2))]] },
    ),
  ),
  // A banana plant, 4.5 m: a fibrous pseudostem, huge paddle leaves (the swaying top), and a hanging bunch with
  // its purple flower bell; the bunch can come down.
  e('banana tree', 'garden', 'fruit trees', () => {
    const b = m('banana tree')
      .cyl([0.4, 3.4, 0.4], [0, 1.7, 0], { color: '#7a8a4a', taper: 0.7 })
      .ball(0.4, [0, 3.45, 0], { color: '#5f8a45', name: 'top' });
    around(7, 1, 0.3).forEach(([x0, z], i) => leaf(b, [x0 * 0.15, 3.45, z * 0.15], [x0 * 2.1, 3.5 + (i % 2 ? 0.8 : -0.2), z * 2.1], 0.7, i % 2 ? 'leaf' : '#4f9a48', 'top'));
    b.rod([0.15, 3.2, 0.2], [0.35, 2.8, 0.35], 0.06, '#7a8a4a', { name: 'stalk' });
    b.ball([0.5, 0.6, 0.45], [0.4, 2.5, 0.4], { color: '#e8d040', name: 'bunch', parent: 'stalk', piece: true });
    around(8, 0.2).forEach(([x0, z], i) => b.capsule([0.07, 0.24, 0.07], [0.4 + x0, 2.42 + (i % 2) * 0.12, 0.4 + z], { color: '#d8c838', rot: [z * 120, 0, -x0 * 120], parent: 'bunch' }));
    b.rod([0.4, 2.2, 0.4], [0.42, 1.85, 0.42], 0.04, '#7a8a4a', { parent: 'bunch' }).ball([0.2, 0.3, 0.2], [0.42, 1.7, 0.42], { color: '#7a2a4a', parent: 'bunch' });
    const sway = (a: number) => A.pose('top', { rot: [0, 0, a], dur: 0.5 });
    return b.act({ click: [[A.say('Rustle...', 1.5), sway(5), sway(-4), sway(0)], [A.detach('bunch', 'bunch')], [A.reattach('bunch')]] }).done();
  }),
  // A floor-standing band saw, 1.75 m, its wheel doors to the front: a steel stand cabinet, the round lower and upper
  // wheel housings joined by the column on the left, the cast-iron table (at 1.18 m) in the throat with its fence,
  // the blade running down through it under the guide post, the tension knob on top and the motor behind. A block of
  // wood is fed through the blade.
  e('band saw', 'workshop', 'power tools', () => {
    const G = '#3f7a3a', G2 = '#4f9147';
    const b = m('band saw', { edge: 'sharp' })
      .box([0.52, 0.6, 0.46], [0, 0.3, -0.02], { color: '#4a4d52', round: 0.08 })
      .box([0.4, 0.44, 0.01], [0, 0.32, 0.21], { color: '#55595e', round: 0.2 })
      .box([0.02, 0.08, 0.02], [0.15, 0.36, 0.22], { color: 'black', round: 0.4 })
      .cyl([0.2, 0.24, 0.2], [0, 0.84, -0.22], { color: '#56605a', rot: [90, 0, 0] })
      // the wheel housings, their doors and the column joining them
      .box([0.13, 0.78, 0.15], [-0.21, 1.17, -0.03], { color: G, round: 0.3 });
    for (const y of [0.86, 1.47]) {
      b.cyl([0.5, 0.22, 0.5], [0, y, 0], { color: G, rot: [90, 0, 0] })
        .cyl([0.46, 0.012, 0.46], [0, y, 0.114], { color: G2, rot: [90, 0, 0] })
        .cyl([0.04, 0.03, 0.04], [-0.17, y, 0.125], { color: 'black', rot: [90, 0, 0] });
    }
    b.label('BAND SAW', [0.26, 0.06], [0, 1.56, 0.121], { color: G, depth: 0.003 })
      .cyl([0.07, 0.07, 0.07], [0, 1.76, 0], { color: 'black' })
      .stick([0, 1.72, 0], [0, 1.8, 0], 0.016, 'silver')
      .box([0.08, 0.1, 0.05], [-0.21, 1.02, 0.07], { color: '#2a2c30', round: 0.2 })
      .box([0.05, 0.03, 0.02], [-0.21, 1.03, 0.1], { color: 'red', round: 0.3 })
      // the table in the throat on its trunnion, fence and mitre slot
      .box([0.1, 0.12, 0.12], [0.2, 1.1, 0], { color: '#5a5f66', round: 0.2 })
      .box([0.44, 0.035, 0.44], [0.2, 1.165, 0.02], { color: 'steel', round: 0.1 })
      .box([0.014, 0.003, 0.44], [0.09, 1.183, 0.02], { color: '#3a3d42', round: 0, noInk: true })
      .box([0.03, 0.05, 0.44], [0.34, 1.207, 0.02], { color: 'silver', round: 0.2 })
      // the blade below its guide post, and the post coming down from the upper housing
      .box([0.003, 0.12, 0.014], [0.2, 1.24, 0.035], { color: 'silver', round: 0 })
      .box([0.045, 0.18, 0.05], [0.2, 1.39, 0.035], { color: '#5a5f66', round: 0.2 })
      .box([0.05, 0.03, 0.06], [0.2, 1.3, 0.035], { color: '#2a2c30', round: 0.2 })
      .box([0.14, 0.06, 0.2], [0.2, 1.2125, 0.22], { color: 'lightwood', name: 'block', round: 0.15 })
      .box([0.002, 0.061, 0.06], [0.2, 1.2125, 0.13], { color: '#8a6a40', parent: 'block', round: 0, noInk: true });
    return b
      .act({ click: [[A.par(A.anim('shake', 3), A.say('Zzzzzzzz!', 2)), A.par(A.pose('block', { move: [0, 0, -0.3], dur: 1.5 }), A.effect('dust', { dur: 1.5 })), A.pose('block', { move: [0, 0, 0], dur: 0.6 })]] })
      .done();
  }),
  // A roll of gauze bandage with its loose end and an adhesive plaster beside it; the roll unrolls.
  e('bandage', 'clinic', 'first aid', () =>
    m('bandage')
      .box([0.2, 0.004, 0.068], [0.06, 0.002, 0], { color: 'white', round: 0, name: 'strip' })
      .cyl([0.09, 0.07, 0.09], [-0.04, 0.045, 0], { color: 'white', rot: [90, 0, 0], name: 'roll', piece: true })
      .cyl([0.03, 0.072, 0.03], [-0.04, 0.045, 0], { color: 'lightgray', rot: [90, 0, 0], parent: 'roll' })
      .box([0.09, 0.006, 0.028], [-0.04, 0.003, 0.09], { color: 'tan', round: 0.6 })
      .box([0.03, 0.007, 0.02], [-0.04, 0.004, 0.09], { color: 'cream', round: 0.3 })
      .act({ click: [[A.pose('roll', { move: [-0.14, 0, 0], rot: [0, 0, 360], dur: 0.9 }), A.wait(0.6), A.pose('roll', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.9 })]] })
      .done(),
  ),
  // A red paisley bandana tied on a display head; its tails flutter.
  e('bandana', 'wardrobe', 'scarves', () => {
    const b = m('bandana')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.14, 0], 0.03, 'darkwood')
      .cyl([0.1, 0.06, 0.1], [0, 0.16, 0], { color: 'beige' })
      .ball([0.17, 0.22, 0.19], [0, 0.29, 0], { color: 'beige' })
      .ball([0.185, 0.15, 0.2], [0, 0.345, -0.005], { color: 'red' })
      .ball([0.05, 0.045, 0.045], [0, 0.33, -0.1], { color: 'red', name: 'knot' })
      .box([0.04, 0.1, 0.01], [0.025, 0.28, -0.11], { color: 'red', rot: [0, 0, 20], round: 0.3, name: 'tailL', pivot: [0.01, 0.33, -0.11] })
      .box([0.04, 0.1, 0.01], [-0.025, 0.28, -0.11], { color: 'red', rot: [0, 0, -20], round: 0.3, name: 'tailR', pivot: [-0.01, 0.33, -0.11] });
    for (const [x0, y, z] of [[-0.05, 0.38, 0.07], [0.04, 0.4, 0.07], [0, 0.35, 0.095], [0.07, 0.35, 0.05], [-0.075, 0.33, 0.05]]) b.ball([0.02, 0.02, 0.008], [x0, y, z], { color: 'white', noInk: true });
    const fl = (a: number) => A.par(A.pose('tailL', { rot: [a, 0, 0], dur: 0.2 }), A.pose('tailR', { rot: [-a, 0, 0], dur: 0.2 }));
    return b.act({ click: [[fl(30), fl(-20), fl(25), fl(0)]] }).done();
  }),
  // A black bandit's eye mask on a display head, its ties hanging behind.
  e('bandit mask', 'wardrobe', 'masks', () =>
    m('bandit mask')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.14, 0], 0.03, 'darkwood')
      .cyl([0.1, 0.06, 0.1], [0, 0.16, 0], { color: 'beige' })
      .ball([0.17, 0.22, 0.19], [0, 0.29, 0], { color: 'beige', name: 'head' })
      .box([0.19, 0.055, 0.12], [0, 0.315, 0.045], { color: 'black', round: 0.8, parent: 'head' })
      .ball([0.035, 0.024, 0.01], [0.04, 0.315, 0.104], { color: 'white', parent: 'head' })
      .ball([0.035, 0.024, 0.01], [-0.04, 0.315, 0.104], { color: 'white', parent: 'head' })
      .rod([0.0, 0.315, -0.08], [-0.03, 0.27, -0.13], 0.014, 'black', { parent: 'head' })
      .act({ click: [[A.pose('head', { rot: [0, 40, 0], dur: 0.3 }), A.pose('head', { rot: [0, -40, 0], dur: 0.4 }), A.pose('head', { rot: [0, 0, 0], dur: 0.3 }), A.say('Shhh!', 1.2)]] })
      .done(),
  ),
  // A five-string banjo on a stand: the round pot with its drumhead and resonator, a long neck with frets and the
  // short fifth-string peg.
  e('banjo', 'music', 'strings', () => {
    const b = m('banjo')
      .cyl([0.33, 0.08, 0.33], [0, 0.27, -0.01], { color: '#7a4a28', rot: [90, 0, 0], edge: 'sharp' })
      .torus([0.32, 0.32, 0.03], [0, 0.27, 0.03], { color: 'silver', tube: 0.06 })
      .cyl([0.29, 0.01, 0.29], [0, 0.27, 0.035], { color: 'cream', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.05, 0.6, 0.03], [0, 0.73, 0.01], { color: 'darkwood', edge: 'sharp' })
      .box([0.045, 0.6, 0.006], [0, 0.73, 0.028], { color: '#2a1a12', edge: 'sharp' })
      .box([0.09, 0.15, 0.03], [0, 1.1, 0.0], { color: 'darkwood', rot: [-10, 0, 0], edge: 'sharp' })
      .box([0.06, 0.012, 0.012], [0, 0.22, 0.045], { color: 'tan' })
      .cyl([0.016, 0.03, 0.016], [0.035, 0.68, 0.01], { color: 'cream', rot: [0, 0, 90] })
      .box([0.32, 0.03, 0.08], [0, 0.07, 0.03], { color: 'black', edge: 'sharp', round: 0.4 })
      .rod([0, 0.07, -0.02], [0, 1.0, -0.07], 0.022, 'black');
    b.each(7, (i) => b.box([0.045, 0.003, 0.004], [0, 0.5 + i * 0.07, 0.032], { color: 'silver', noInk: true }));
    b.each(5, (i) => b.stick([-0.012 + i * 0.006, 0.2, 0.045], [-0.012 + i * 0.006, 1.03, 0.032], 0.0025, 'silver', { noInk: true }));
    b.pair((s) => b.each(2, (i) => b.ball(0.02, [s * 0.055, 1.08 + i * 0.05, -0.01], { color: 'cream' })));
    b.pair((s) => b.rod([s * 0.14, 0.07, 0.03], [s * 0.22, 0.01, 0.12], 0.02, 'black').rod([0, 0.08, -0.03], [s * 0.15, 0.01, -0.22], 0.02, 'black'));
    return b.act({ click: [[A.par(A.anim('wobble'), A.say('Plinka-plunka-plink!', 2))]] }).done();
  }),
  // A bank: a stone hall raised on steps behind a portico of columns, a pediment with BANK on the frieze, a clock,
  // and bronze double doors. Cha-ching!
  e('bank', 'places', 'banks', () => {
    const b = m('bank', { edge: 'sharp' })
      .box([13, 0.3, 11], [0, 0.15, 0], { color: 'stone', round: 0.05 })
      .box([12, 0.3, 10], [0, 0.45, 0], { color: 'lightgray', round: 0.05 })
      .box([11, 0.3, 9.4], [0, 0.75, -0.2], { color: 'lightgray', round: 0.05 })
      .box([10, 6.5, 6.5], [0, 4.15, -1.4], { color: '#e8e2d0', round: 0.02 })
      .box([11.4, 0.9, 8.8], [0, 7.85, -0.3], { color: 'white', round: 0.05 })
      .label('BANK', [4, 0.7], [0, 7.85, 4.12], { color: 'white', depth: 0.04 })
      .wedge([11.6, 2.2, 9.0], [0, 9.4, -0.3], { color: 'white' })
      .cyl([1.2, 0.15, 1.2], [0, 9.0, 4.2], { color: 'white', rot: [90, 0, 0] })
      .cyl([1.0, 0.05, 1.0], [0, 9.0, 4.28], { color: 'cream', rot: [90, 0, 0] })
      .box([1.5, 3.2, 0.12], [-0.75, 2.5, 1.92], { color: '#8a6a3a', name: 'doorL', pivot: [-1.5, 2.5, 1.92], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([1.5, 3.2, 0.12], [0.75, 2.5, 1.92], { color: '#8a6a3a', name: 'doorR', pivot: [1.5, 2.5, 1.92], mover: { kind: 'swing', axis: 'y', amount: 90 } });
    b.each(6, (i) => b.cyl([0.75, 6.6, 0.75], [-4.5 + i * 1.8, 4.2, 3.5], { color: 'white' }).box([1.0, 0.3, 1.0], [-4.5 + i * 1.8, 1.05, 3.5], { color: 'lightgray' }));
    b.pair((s) => win(b, [s * 3.3, 3.5, 1.86], 1.2, 2.6, { frame: 'white' }));
    return b.act({ click: [[A.operate('door', 'open'), A.say('Cha-ching!', 1.5), A.wait(2.5), A.operate('door', 'close')]] }).done();
  }),
  // A heraldic banner on a 3 m pole: a crossbar, a red cloth with a gold emblem and a fringe; it waves.
  e('banner', 'ideas', 'flags', () => {
    const b = m('banner')
      .cyl([0.4, 0.06, 0.4], [0, 0.03, 0], { color: 'darkgray', edge: 'sharp' })
      .stick([0, 0.06, 0], [0, 3.0, 0], 0.05, 'darkwood')
      .ball(0.1, [0, 3.04, 0], { color: 'gold' })
      .stick([-0.6, 2.85, 0.03], [0.6, 2.85, 0.03], 0.04, 'darkwood', { name: 'bar', pivot: [0, 2.85, 0.03] })
      .box([1.1, 1.4, 0.03], [0, 2.1, 0.05], { color: 'red', round: 0.1, parent: 'bar', edge: 'soft' })
      .cone([1.1, 0.4, 0.03], [0, 1.2, 0.05], { color: 'red', rot: [180, 0, 0], segs: 4, parent: 'bar' })
      .star(0.5, [0, 2.2, 0.075], { color: 'gold', parent: 'bar' });
    b.each(8, (i) => b.box([0.04, 0.1, 0.02], [-0.49 + i * 0.14, 1.36 - Math.abs(i - 3.5) * 0.05, 0.05], { color: 'gold', parent: 'bar' }));
    const wave = (a: number) => A.pose('bar', { rot: [0, a, 0], dur: 0.35 });
    return b.act({ click: [[wave(25), wave(-20), wave(15), wave(0)]] }).done();
  }),
  // A bar stool (seat at 0.76 m): a padded round seat on a chrome column, a footrest ring and a heavy base; the
  // seat swivels.
  e('bar stool', 'home', 'seating', () =>
    m('bar stool', { edge: 'sharp' })
      .cyl([0.45, 0.03, 0.45], [0, 0.015, 0], { color: 'silver' })
      .stick([0, 0.03, 0], [0, 0.7, 0], 0.06, 'silver')
      .torus([0.42, 0.42, 0.025], [0, 0.32, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.06 })
      .cyl([0.4, 0.05, 0.4], [0, 0.71, 0], { color: '#3a3633', name: 'seat' })
      .cyl([0.4, 0.07, 0.4], [0, 0.765, 0], { color: 'red', parent: 'seat', edge: 'soft' })
      .socket('seat', [0, 0.8, 0], 'seat')
      .act({ click: [[A.pose('seat', { rot: [0, 360, 0], dur: 1.2 }), A.pose('seat', { rot: [0, 0, 0], dur: 0.01 }), A.say('Squeak!', 1)]] })
      .done(),
  ),
  // A run of barbed-wire fence (2 m): wooden posts and three strands of twisted wire studded with barbs; it twangs.
  e('barbed wire', 'workshop', 'fencing', () => {
    const b = m('barbed wire');
    b.each(2, (i) => b.cyl([0.1, 1.25, 0.1], [-0.95 + i * 1.9, 0.625, 0], { color: 'wood', edge: 'sharp' }).cone([0.11, 0.06, 0.11], [-0.95 + i * 1.9, 1.28, 0], { color: 'wood' }));
    b.each(3, (k) => {
      const y = 0.35 + k * 0.35;
      b.stick([-0.95, y, 0.06], [0.95, y - 0.02, 0.06], 0.008, 'steel', { name: k === 1 ? 'wire' : undefined });
      b.each(8, (i) => {
        const x0 = -0.8 + i * 0.22;
        b.stick([x0 - 0.02, y - 0.02, 0.06], [x0 + 0.02, y + 0.02, 0.06], 0.005, 'steel').stick([x0 - 0.02, y + 0.02, 0.06], [x0 + 0.02, y - 0.02, 0.06], 0.005, 'steel');
      });
    });
    return b.act({ click: [[A.par(A.anim('wobble'), A.say('Twang!', 1))]] }).done();
  }),
  // A barber's pole: a glass cylinder of red, white and blue stripes between chrome caps, on its wall bracket; the
  // stripes turn and the globe lights.
  e("barber's pole", 'places', 'street things', () => {
    const b = m("barber's pole")
      .box([0.3, 1.0, 0.06], [0, 1.5, -0.2], { color: 'white', edge: 'sharp', round: 0.2 })
      .box([0.1, 0.1, 0.22], [0, 1.95, -0.08], { color: 'silver', edge: 'sharp' })
      .box([0.1, 0.1, 0.22], [0, 1.05, -0.08], { color: 'silver', edge: 'sharp' })
      .cyl([0.22, 0.12, 0.22], [0, 1.95, 0], { color: 'silver', edge: 'sharp' })
      .cyl([0.22, 0.12, 0.22], [0, 1.05, 0], { color: 'silver', edge: 'sharp' })
      .ball(0.22, [0, 2.12, 0], { color: '#fff6c8', glow: true, name: 'globe', mover: { kind: 'light' } })
      .cyl([0.18, 0.78, 0.18], [0, 1.5, 0], { color: 'white', name: 'stripes', mover: { kind: 'spin', axis: 'y', amount: 180 } })
      .stick([0, 0, -0.2], [0, 1.0, -0.2], 0.05, 'darkgray')
      .cyl([0.3, 0.04, 0.3], [0, 0.02, -0.2], { color: 'darkgray', edge: 'sharp' });
    b.each(6, (i) => b.box([0.19, 0.06, 0.19], [0, 1.18 + i * 0.13, 0], { color: i % 2 ? 'blue' : 'red', rot: [0, i * 30, 22], round: 0.2, parent: 'stripes' }));
    return b.act({ click: [[A.operate('globe', 'on'), A.operate('stripes', 'on')], [A.operate('globe', 'off'), A.operate('stripes', 'off')]] }).done();
  }),
  // A product box with its barcode label, and a scanner that beeps when its red beam sweeps it.
  e('barcode', 'ideas', 'symbols', () => {
    const b = m('barcode', { edge: 'sharp' })
      .box([0.16, 0.1, 0.06], [0, 0.05, 0], { color: 'orange', round: 0.1 })
      .box([0.12, 0.06, 0.004], [0, 0.05, 0.031], { color: 'white', round: 0 })
      .label('0 12345 67890 5', [0.1, 0.01], [0, 0.026, 0.034], { color: 'white', depth: 0.001 });
    b.each(14, (i) => b.box([i % 3 ? 0.003 : 0.006, 0.035, 0.002], [-0.05 + i * 0.0075, 0.055, 0.034], { color: 'black', round: 0, noInk: true }));
    b.box([0.04, 0.12, 0.05], [0.13, 0.08, 0.09], { color: '#3a3633', round: 0.4, rot: [0, -30, 15] })
      .box([0.12, 0.004, 0.004], [0.05, 0.055, 0.05], { color: 'red', glow: true, name: 'beam', mover: { kind: 'light' }, rot: [0, -20, 0] });
    return b.act({ click: [[A.operate('beam', 'on'), A.wait(0.4), A.say('Beep!', 1), A.operate('beam', 'off')]] }).done();
  }),
  // A log section wearing thick, ridged bark; a curl of bark peels away.
  e('bark', 'garden', 'tree parts', () => {
    const b = m('bark')
      .cyl([0.3, 0.35, 0.3], [0, 0.175, 0], { color: 'bark', name: 'log' })
      .cyl([0.25, 0.01, 0.25], [0, 0.355, 0], { color: 'lightwood' })
      .torus([0.12, 0.12, 0.006], [0, 0.361, 0], { color: 'wood', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([0.06, 0.06, 0.006], [0, 0.361, 0], { color: 'wood', rot: [90, 0, 0], tube: 0.08, noInk: true });
    around(10, 0.15).forEach(([x0, z], i) => b.box([0.035, 0.3 - (i % 3) * 0.04, 0.025], [x0, 0.17, z], { color: i % 2 ? '#6a4429' : '#5a3a22', rot: [0, Math.atan2(x0, z) * RAD, 0], round: 0.5 }));
    b.box([0.12, 0.2, 0.025], [0, 0.18, 0.16], { color: '#7a5134', round: 0.4, name: 'curl', parent: 'log', piece: true });
    return b.act({ click: [[A.detach('curl', 'bark')], [A.reattach('curl')]] }).done();
  }),
  // A big red barn (9 m): a gambrel roof, white X-braced double doors that swing open, a hayloft door, a cupola
  // with a weathervane that turns, windows down the side and a silo beside it. A cow comes out to moo.
  e('barn', 'farm', 'farm buildings', () => {
    const R = '#b23a2e', RF = '#5a3a30';
    const b = m('barn', { edge: 'sharp' })
      .box([11, 0.3, 14], [0, 0.15, 0], { color: 'stone', round: 0.05 })
      .box([10, 4.6, 13], [0, 2.6, 0], { color: R, round: 0.02 })
      .box([10.2, 0.2, 13.2], [0, 4.95, 0], { color: 'white' })
      .box([0.4, 0.3, 13.8], [0, 9.15, 0], { color: RF, round: 0.3 });
    // gambrel roof: steep lower slopes, shallow upper ones, red gable ends filled in between
    b.pair((s) => {
      b.box([0.25, 2.86, 13.6], [s * 4.35, 6.33, 0], { color: RF, rot: [0, 0, s * 27], round: 0.1 });
      b.box([3.99, 0.25, 13.6], [s * 1.85, 8.35, 0], { color: RF, rot: [0, 0, -s * 22], round: 0.1 });
      for (const z of [6.45, -6.45]) b.wedge([1.3, 2.55, 0.12], [s * 4.35, 6.33, z], { color: R, apex: -s * 0.5 });
    });
    for (const z of [6.45, -6.45]) b.box([7.4, 2.56, 0.12], [0, 6.33, z], { color: R }).wedge([7.4, 1.5, 0.12], [0, 8.35, z], { color: R });
    // double doors with white trim and X braces, and the hayloft door
    b.pair((s) => {
      const n = s > 0 ? 'doorR' : 'doorL';
      b.box([1.8, 3.6, 0.12], [s * 0.9, 2.1, 6.56], { color: R, name: n, pivot: [s * 1.8, 2.1, 6.56], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
      b.box([1.8, 0.12, 0.05], [s * 0.9, 3.85, 6.64], { color: 'white', parent: n }).box([1.8, 0.12, 0.05], [s * 0.9, 0.35, 6.64], { color: 'white', parent: n });
      b.box([0.12, 3.6, 0.05], [s * 1.74, 2.1, 6.64], { color: 'white', parent: n }).box([0.12, 3.6, 0.05], [s * 0.06, 2.1, 6.64], { color: 'white', parent: n });
      b.box([0.12, 3.9, 0.05], [s * 0.9, 2.1, 6.65], { color: 'white', rot: [0, 0, 25], parent: n }).box([0.12, 3.9, 0.05], [s * 0.9, 2.1, 6.65], { color: 'white', rot: [0, 0, -25], parent: n });
      b.box([0.08, 2.6, 13.04], [s * 5.0, 2.6, 0], { color: R, noInk: true });
      b.each(3, (i) => win(b, [s * 5.02, 2.8, -4 + i * 4], 1.0, 1.0, { side: s, frame: 'white' }));
    });
    b.box([1.6, 1.6, 0.1], [0, 6.0, 6.58], { color: R, name: 'loft', pivot: [-0.8, 6.0, 6.58], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([1.6, 0.1, 0.05], [0, 6.0, 6.65], { color: 'white', rot: [0, 0, 45], parent: 'loft' })
      .box([1.6, 0.1, 0.05], [0, 6.0, 6.65], { color: 'white', rot: [0, 0, -45], parent: 'loft' })
      .box([1.9, 0.12, 0.12], [0, 6.85, 6.6], { color: 'white' })
      // cupola and weathervane
      .box([1.2, 1.0, 1.2], [0, 9.7, 0], { color: 'white' })
      .pyramid([1.7, 0.8, 1.7], [0, 10.6, 0], 4, { color: RF, rot: [0, 45, 0] })
      .stick([0, 11.0, 0], [0, 11.8, 0], 0.04, 'iron')
      .box([0.9, 0.05, 0.05], [0, 11.6, 0], { color: 'iron', name: 'vane' })
      .cone([0.14, 0.2, 0.05], [0.5, 11.6, 0], { color: 'iron', rot: [0, 0, -90], parent: 'vane' })
      .box([0.2, 0.18, 0.02], [-0.45, 11.6, 0], { color: 'iron', parent: 'vane' })
      // silo
      .cyl([3.2, 10, 3.2], [7.6, 5.3, -3], { color: '#c9ccd1' })
      .dome([3.3, 1.6, 3.3], [7.6, 10.3, -3], { color: '#9aa3ab' });
    b.each(5, (i) => b.torus([3.24, 3.24, 0.1], [7.6, 1.5 + i * 2, -3], { color: 'gray', rot: [90, 0, 0], tube: 0.02, noInk: true }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.spawn('cow', 'cow', { rel: 'front', of: 'self', dist: 'close' }), A.say('Moo!', 1.5, 'cow'), A.wait(2), A.remove('cow', 'fade'), A.operate('door', 'close')],
          [A.operate('loft', 'open'), A.pose('vane', { rot: [0, 360, 0], dur: 2 }), A.pose('vane', { rot: [0, 0, 0], dur: 0.01 }), A.operate('loft', 'close')],
        ],
      })
      .done();
  }),
  // Army barracks: a long two-storey block in khaki with a green roof, rows of windows, a sign over the door, a
  // sandbag wall and a flagpole; the bugle sounds and the flag goes up.
  e('barracks', 'places', 'military', () => {
    const b = bldg('barracks', { w: 20, d: 8, floors: 2, wall: '#c9b98a', trim: '#5b6b3a', roof: '#4a5a2e', doorColor: '#5b6b3a', cols: 8, sign: 'BARRACKS', signColor: '#5b6b3a' });
    b.stick([-12, 0, 6], [-12, 9, 6], 0.12, 'silver').ball(0.2, [-12, 9.1, 6], { color: 'gold' })
      .box([1.6, 1.0, 0.04], [-11.15, 4.0, 6], { color: 'red', name: 'flag', edge: 'soft' })
      .box([0.7, 0.5, 0.045], [-11.6, 4.25, 6], { color: 'navy', parent: 'flag' });
    b.each(8, (i) => b.capsule([0.35, 0.8, 0.35], [4 + i * 0.75, 0.2 + (i % 2) * 0.32, 6.5], { color: '#c9b98a', rot: [0, 0, 90] }));
    b.each(7, (i) => b.capsule([0.35, 0.8, 0.35], [4.37 + i * 0.75, 0.55, 6.5], { color: '#b5a578', rot: [0, 0, 90] }));
    return b.act({ click: [[A.say('Ta-ta-taaa! Ta-ta-taaa!', 2.5), A.pose('flag', { move: [0, 4.4, 0], dur: 2.5 })], [A.pose('flag', { move: [0, 0, 0], dur: 2 })]] }).done();
  }),
  // A tortoiseshell hair barrette (8 cm) on a little card; its clasp snaps open and shut.
  e('barrette', 'wardrobe', 'hair accessories', () =>
    m('barrette', { edge: 'sharp' })
      .box([0.1, 0.14, 0.006], [0, 0.07, -0.01], { color: 'pink', round: 0.2 })
      .box([0.016, 0.012, 0.004], [0, 0.125, -0.005], { color: 'white', round: 0 })
      .box([0.085, 0.022, 0.01], [0, 0.07, 0.0], { color: '#8a5a2b', round: 0.9 })
      .ball([0.02, 0.018, 0.006], [-0.02, 0.071, 0.006], { color: '#c98a45', noInk: true })
      .ball([0.016, 0.012, 0.006], [0.022, 0.07, 0.006], { color: '#5a3a22', noInk: true })
      .box([0.08, 0.006, 0.004], [0, 0.065, -0.006], { color: 'silver', round: 0, name: 'clasp', pivot: [-0.04, 0.065, -0.006], mover: { kind: 'swing', axis: 'y', amount: -40 } })
      .act({ click: [[A.operate('clasp', 'open'), A.wait(0.6), A.operate('clasp', 'close'), A.say('Snap!', 1)]] })
      .done(),
  ),
  // A boom barrier at a car-park entrance: a cabinet with a warning light and a red-and-white striped arm that
  // lifts to let you through.
  e('barrier', 'workshop', 'roadworks', () => {
    const b = m('barrier', { edge: 'sharp' })
      .box([0.6, 0.06, 0.5], [0, 0.03, 0], { color: 'stone' })
      .box([0.4, 1.0, 0.35], [0, 0.56, 0], { color: 'yellow', round: 0.1 })
      .box([0.42, 0.06, 0.37], [0, 1.08, 0], { color: '#3a3633' })
      .dome([0.14, 0.14, 0.14], [0, 1.11, 0], { color: 'orange', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .box([4, 0.1, 0.08], [2.15, 0.95, 0.22], { color: 'white', name: 'arm', pivot: [0.1, 0.95, 0.22], mover: { kind: 'swing', axis: 'z', amount: 85 } })
      .box([0.4, 1.0, 0.08], [4.2, 0.5, 0.0], { color: 'darkgray' });
    b.each(5, (i) => b.box([0.35, 0.105, 0.085], [0.6 + i * 0.75, 0.95, 0.22], { color: 'red', parent: 'arm' }));
    return b.act({ click: [[A.operate('lamp', 'on'), A.operate('arm', 'open'), A.wait(2.5), A.operate('arm', 'close'), A.operate('lamp', 'off')]] }).done();
  }),
  // A baseball at its real 7.4 cm: white leather with red curved stitching; it spins off the bat.
  e('baseball', 'sports', 'balls', () => {
    const b = m('baseball').ball(0.074, [0, 0.037, 0], { color: 'white', name: 'ball' });
    b.pair((s) => b.torus([0.05, 0.072, 0.006], [s * 0.012, 0.037, 0], { color: 'red', rot: [0, s * 70, 0], tube: 0.06, parent: 'ball', noInk: true }));
    return b.act({ click: [[A.par(A.pose('ball', { rot: [720, 0, 0], move: [0, 0.05, 0], dur: 0.8 }), A.say('Crack!', 1)), A.pose('ball', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // A baseball base: a square white canvas bag (38 cm) on the dirt; someone slides in, safe.
  e('baseball base', 'sports', 'baseball', () =>
    m('baseball base')
      .cyl([0.9, 0.02, 0.9], [0, 0.01, 0], { color: '#c9a46a' })
      .box([0.38, 0.08, 0.38], [0, 0.06, 0], { color: 'white', round: 0.4, rot: [0, 45, 0] })
      .box([0.34, 0.01, 0.34], [0, 0.1, 0], { color: '#f2f2ee', round: 0.2, rot: [0, 45, 0], noInk: true })
      .act({ click: [[A.par(A.effect('dust', { dur: 1.5 }), A.say('Safe!', 1.5))]] })
      .done(),
  ),
  // A tan leather baseball glove with laced fingers and a deep pocket: it catches a ball.
  e('baseball glove', 'sports', 'baseball', () => {
    const b = m('baseball glove')
      .ball([0.2, 0.24, 0.1], [0, 0.13, 0], { color: '#c07a3a' })
      .ball([0.14, 0.14, 0.04], [0, 0.12, 0.045], { color: '#8a5a2b' })
      .box([0.15, 0.07, 0.11], [0.01, 0.03, -0.01], { color: '#a8682e', round: 0.6 });
    b.each(4, (i) => b.capsule([0.045, 0.14, 0.05], [-0.06 + i * 0.04, 0.27, -0.01], { color: '#c07a3a', rot: [0, 0, 10 - i * 8] }));
    b.capsule([0.05, 0.12, 0.05], [0.11, 0.13, 0.02], { color: '#c07a3a', rot: [0, 0, -40] });
    b.each(4, (i) => b.box([0.012, 0.03, 0.006], [-0.04 + i * 0.03, 0.22, 0.04], { color: '#5a3a22', noInk: true }));
    return b.socket('pocket', [0, 0.14, 0.06], 'hand', { size: 0.08 }).act({ click: [[A.spawn('ball', 'baseball'), A.attach('ball', 'self', 'pocket'), A.say('Thwap!', 1)], [A.remove('self.pocket', 'pop')]] }).done();
  }),
  // A length of white skirting board along the bottom of a wall, a mouse hole in it; a mouse pokes out.
  e('baseboard', 'home', 'fixtures', () =>
    m('baseboard', { edge: 'sharp' })
      .box([1.2, 0.5, 0.06], [0, 0.25, -0.03], { color: '#d8e4ea', round: 0.02 })
      .box([1.2, 0.15, 0.025], [0, 0.075, 0.012], { color: 'white', round: 0.2 })
      .box([1.2, 0.02, 0.035], [0, 0.155, 0.015], { color: 'white', round: 0.5 })
      .arc([0.1, 0.1, 0.03], [0.3, 0.0, 0.01], { color: '#2a2726', tube: 0.5, arc: 180 })
      .ball([0.05, 0.04, 0.07], [0.3, 0.02, -0.02], { color: 'gray', name: 'mouse', piece: true, edge: 'soft' })
      .ball([0.02, 0.02, 0.006], [0.315, 0.05, 0.0], { color: 'pink', parent: 'mouse', edge: 'soft' })
      .act({ click: [[A.pose('mouse', { move: [0, 0, 0.07], dur: 0.4 }), A.say('Squeak!', 1.2), A.wait(0.8), A.pose('mouse', { move: [0, 0, 0], dur: 0.25 })]] })
      .done(),
  ),
  // A basement, cut away: concrete walls and floor, wooden stairs coming down, a water heater, shelves of jars and
  // a bare bulb that clicks on.
  e('basement', 'places', 'rooms', () => {
    const b = m('basement', { edge: 'sharp' })
      .box([4.4, 0.15, 3.6], [0, 0.075, 0], { color: '#9aa0a5', round: 0.02 })
      .box([4.4, 2.5, 0.2], [0, 1.25, -1.7], { color: '#b5b9bc', round: 0.02 })
      .box([0.2, 2.5, 3.6], [-2.1, 1.25, 0], { color: '#a8adb1', round: 0.02 })
      .box([1.0, 0.1, 0.25], [1.4, 0.2, -1.4], { color: 'wood' })
      .cyl([0.6, 1.6, 0.6], [-1.4, 0.95, -1.1], { color: 'white' })
      .cyl([0.62, 0.1, 0.62], [-1.4, 1.75, -1.1], { color: 'gray' })
      .stick([-1.4, 1.8, -1.1], [-1.4, 2.5, -1.1], 0.08, 'copper')
      .box([1.2, 1.6, 0.35], [0.2, 0.95, -1.4], { color: 'darkwood' })
      .stick([0.5, 2.5, 0.3], [0.5, 2.1, 0.3], 0.02, 'black')
      .ball(0.12, [0.5, 2.04, 0.3], { color: '#fff6c8', glow: true, name: 'bulb', mover: { kind: 'light' } });
    b.each(3, (i) => b.box([1.2, 0.04, 0.35], [0.2, 0.45 + i * 0.5, -1.25], { color: 'wood' }));
    b.each(9, (i) => b.cyl([0.1, 0.16, 0.1], [-0.25 + (i % 3) * 0.3, 0.55 + Math.floor(i / 3) * 0.5, -1.25], { color: ['#e0473b', '#f6d24a', '#8a5fc4'][i % 3], edge: 'soft' }));
    b.each(8, (i) => b.box([0.9, 0.06, 0.3], [1.6, 0.25 + i * 0.28, 1.4 - i * 0.32], { color: 'wood' }));
    b.stick([2.05, 0.2, 1.6], [2.05, 2.5, -0.9], 0.06, 'darkwood');
    return b.act({ click: [[A.operate('bulb', 'on'), A.say('Click.', 1)], [A.operate('bulb', 'off'), A.say('Creak... creak...', 1.5)]] }).done();
  }),
  // A wicker picnic basket with a handle and two lids that open: a banana goes in, and comes out again.
  e('basket', 'home', 'baskets', () => {
    const b = m('basket')
      .box([0.45, 0.24, 0.3], [0, 0.12, 0], { color: '#c9a060', round: 0.3 })
      .box([0.24, 0.03, 0.32], [0.115, 0.255, 0], { color: '#b08850', round: 0.4, name: 'lidL', pivot: [0.0, 0.255, 0], mover: { kind: 'swing', axis: 'z', amount: 110 } })
      .box([0.24, 0.03, 0.32], [-0.115, 0.255, 0], { color: '#b08850', round: 0.4, name: 'lidR', pivot: [0.0, 0.255, 0], mover: { kind: 'swing', axis: 'z', amount: -110 } })
      .arc([0.36, 0.32, 0.03], [0, 0.27, 0], { color: '#9a7040', tube: 0.08 });
    b.each(4, (i) => b.box([0.46, 0.012, 0.31], [0, 0.04 + i * 0.055, 0], { color: '#a8804a', round: 0.5, noInk: true }));
    return b
      .socket('inside', [0, 0.15, 0], 'inside', { size: 0.25 })
      .act({ click: [[A.operate('lid', 'open'), A.spawn('fruit', 'banana'), A.attach('fruit', 'self', 'inside'), A.wait(0.6), A.operate('lid', 'close')], [A.operate('lid', 'open'), A.remove('self.inside', 'pop'), A.wait(0.6), A.operate('lid', 'close')]] })
      .done();
  }),
  // A basketball at its real 24 cm: pebbled orange with black seams; it dribbles, and spins on a finger.
  e('basketball', 'sports', 'balls', () =>
    m('basketball')
      .ball(0.24, [0, 0.12, 0], { color: '#e8752e', name: 'ball' })
      .torus([0.242, 0.242, 0.006], [0, 0.12, 0], { color: '#2a2726', tube: 0.03, noInk: true, parent: 'ball' })
      .torus([0.242, 0.242, 0.006], [0, 0.12, 0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.03, noInk: true, parent: 'ball' })
      .torus([0.2, 0.2, 0.006], [0.06, 0.12, 0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.03, noInk: true, parent: 'ball' })
      .torus([0.2, 0.2, 0.006], [-0.06, 0.12, 0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.03, noInk: true, parent: 'ball' })
      .act({ click: [[A.anim('bounce', 3), A.say('Dribble, dribble...', 1.5)], [A.pose('ball', { rot: [0, 720, 0], dur: 1.5 }), A.pose('ball', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done(),
  ),
  // A half basketball court (15 m by 14 m): maple boards, painted key and lines, the three-point arc, and the
  // hoop with its glass backboard on a padded pole. Score!
  e('basketball court', 'sports', 'courts', () => {
    const b = m('basketball court', { edge: 'sharp' })
      .box([15, 0.1, 14], [0, 0.05, 0], { color: '#d9a35f', round: 0.02 })
      .box([4.9, 0.012, 5.8], [0, 0.106, -4.1], { color: '#c0504d', noInk: true })
      .arc([13.4, 13.4, 0.012], [0, 0.11, -5.8], { color: 'white', rot: [-90, 0, 0], arc: 170, tube: 0.008, noInk: true })
      .torus([3.6, 3.6, 0.012], [0, 0.112, -1.2], { color: 'white', rot: [90, 0, 0], tube: 0.03, noInk: true })
      .box([15, 0.012, 0.08], [0, 0.113, 6.96], { color: 'white', noInk: true })
      .box([0.08, 0.012, 14], [7.46, 0.113, 0], { color: 'white', noInk: true })
      .box([0.08, 0.012, 14], [-7.46, 0.113, 0], { color: 'white', noInk: true })
      .box([0.3, 3.2, 0.3], [0, 1.7, -7.6], { color: 'navy' })
      .box([0.2, 0.2, 1.4], [0, 3.25, -6.9], { color: 'navy' })
      .box([1.8, 1.05, 0.05], [0, 3.55, -6.2], { color: '#cfe6f2', round: 0.1 })
      .box([0.6, 0.45, 0.055], [0, 3.35, -6.18], { color: 'white', round: 0, noInk: true })
      .torus([0.46, 0.46, 0.03], [0, 3.05, -5.9], { color: 'orange', rot: [90, 0, 0], tube: 0.06 })
      .cyl([0.44, 0.4, 0.44], [0, 2.84, -5.9], { color: 'white', taper: 0.7, edge: 'soft' })
      .socket('hoop', [0, 3.08, -5.9], 'top', { size: 0.3 });
    return b.act({ click: [[A.spawn('bb', 'basketball'), A.attach('bb', 'self', 'hoop'), A.say('Swish! Two points!', 2), A.wait(1.2), A.remove('bb', 'pop')]] }).done();
  }),
  // A basketball goal: the hoop at 3.05 m with its net, a backboard with the target square, on a pole with a
  // weighted base. A ball drops through.
  e('basketball goal', 'sports', 'basketball', () =>
    m('basketball goal', { edge: 'sharp' })
      .box([1.2, 0.5, 0.9], [0, 0.25, -0.6], { color: '#3a3633', round: 0.2 })
      .stick([0, 0.5, -0.6], [0, 3.4, -0.6], 0.14, 'gray')
      .box([0.1, 0.1, 0.6], [0, 3.3, -0.35], { color: 'gray' })
      .box([1.8, 1.05, 0.05], [0, 3.5, -0.05], { color: '#cfe6f2', round: 0.1 })
      .box([0.6, 0.45, 0.055], [0, 3.3, -0.03], { color: 'white', round: 0, noInk: true })
      .torus([0.46, 0.46, 0.03], [0, 3.05, 0.25], { color: 'orange', rot: [90, 0, 0], tube: 0.06 })
      .cyl([0.44, 0.4, 0.44], [0, 2.84, 0.25], { color: 'white', taper: 0.7, edge: 'soft', name: 'net', pivot: [0, 3.04, 0.25] })
      .socket('hoop', [0, 3.08, 0.25], 'top', { size: 0.3 })
      .act({ click: [[A.spawn('bb', 'basketball'), A.attach('bb', 'self', 'hoop'), A.par(A.say('Swish!', 1.5), A.pose('net', { rot: [12, 0, 0], dur: 0.2 })), A.pose('net', { rot: [0, 0, 0], dur: 0.3 }), A.wait(0.8), A.remove('bb', 'pop')]] })
      .done(),
  ),
  // A basketball jersey on a dress form: sleeveless mesh top with trim, the team name and number 23; it turns.
  e('basketball jersey', 'wardrobe', 'sportswear', () =>
    mannequin('basketball jersey')
      .box([0.4, 0.55, 0.25], [0, 1.24, 0], { color: 'purple', round: 0.6 })
      .torus([0.16, 0.12, 0.03], [0, 1.5, 0.05], { color: 'gold', rot: [70, 0, 0], tube: 0.2 })
      .label('23', [0.16, 0.14], [0, 1.2, 0.128], { color: 'purple', depth: 0.004 })
      .label('HAWKS', [0.22, 0.05], [0, 1.36, 0.124], { color: 'purple', depth: 0.004 })
      .act({ click: [[A.anim('spin'), A.say('Number 23!', 1.5)]] })
      .done(),
  ),
  // A wooden baseball bat (86 cm) leaning on a post, a ball at its foot; it swings.
  e('bat (sports)', 'sports', 'baseball', () =>
    m('bat (sports)')
      .box([0.4, 0.03, 0.3], [0, 0.015, 0], { color: 'grass', round: 0.3 })
      .cyl([0.08, 0.6, 0.08], [-0.1, 0.33, -0.08], { color: 'darkwood', edge: 'sharp' })
      .cyl([0.04, 0.04, 0.04], [0.1, 0.05, 0.05], { color: 'darkwood', name: 'bat', pivot: [0.1, 0.03, 0.05] })
      .cyl([0.026, 0.3, 0.026], [0.07, 0.22, 0.03], { color: 'lightwood', rot: [0, 0, 12], parent: 'bat' })
      .cyl([0.065, 0.48, 0.065], [0.0, 0.6, -0.01], { color: 'lightwood', rot: [0, 0, 12], taper: 0.6, parent: 'bat' })
      .ball(0.074, [0.15, 0.04, 0.14], { color: 'white' })
      .act({ click: [[A.pose('bat', { rot: [0, 0, 80], dur: 0.3 }), A.pose('bat', { rot: [0, 0, -40], dur: 0.15 }), A.say('Crack!', 1.2), A.pose('bat', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A rooftop searchlight on its turntable, the bat emblem on its lens: the beam shoots up with the bat sign.
  e('bat-signal', 'tech', 'lights', () => {
    const b = m('bat-signal', { edge: 'sharp' })
      .box([1.6, 0.4, 1.6], [0, 0.2, 0], { color: 'darkgray', round: 0.2 })
      .cyl([1.2, 0.2, 1.2], [0, 0.5, 0], { color: 'gray' })
      .cyl([1.2, 1.3, 1.2], [0, 1.45, 0.1], { color: 'steel', rot: [40, 0, 0] })
      .cyl([1.1, 0.06, 1.1], [0, 1.95, 0.53], { color: 'yellow', glow: true, rot: [40, 0, 0], name: 'lens', mover: { kind: 'light' } })
      .cone([0.9, 0.3, 0.9], [0, 2.07, 0.63], { color: '#fff6c8', glow: true, rot: [40, 0, 0], name: 'beam', pivot: [0, 1.95, 0.53], piece: true, taper: 2.2 })
      .ball([0.6, 0.35, 0.03], [0, 2.2, 0.75], { color: 'yellow', glow: true, parent: 'beam' })
      .ball([0.12, 0.08, 0.035], [0, 2.2, 0.76], { color: 'black', parent: 'beam' });
    b.pair((s) => {
      b.rod([s * 0.65, 0.6, 0], [s * 0.62, 1.45, 0.1], 0.1, 'darkgray');
      b.wedge([0.25, 0.14, 0.02], [s * 0.16, 1.98, 0.56], { color: 'black', rot: [40, 0, s * -100], apex: s * 0.3 });
    });
    return b.act({ click: [[A.operate('lens', 'on'), A.pose('beam', { scale: 18, dur: 0.8 }), A.wait(3), A.pose('beam', { scale: 1, dur: 0.5 }), A.operate('lens', 'off')]] }).done();
  }),
  // A plush bath mat (80 by 50 cm): a soft white pile with a blue border; wet feet squish on it.
  e('bath mat', 'home', 'bathroom', () =>
    m('bath mat')
      .box([0.8, 0.03, 0.5], [0, 0.015, 0], { color: 'skyblue', round: 0.6 })
      .box([0.7, 0.012, 0.4], [0, 0.03, 0], { color: 'white', round: 0.6, noInk: true })
      .ball([0.08, 0.004, 0.12], [-0.1, 0.037, 0.05], { color: '#cfe6f2', noInk: true })
      .ball([0.08, 0.004, 0.12], [0.08, 0.037, -0.05], { color: '#cfe6f2', noInk: true })
      .act({ click: [[A.par(A.effect('water_spray', { dur: 1 }), A.say('Squish!', 1))]] })
      .done(),
  ),
  // A bathroom, cut away: tiled walls, a tub with a shower curtain, a toilet whose lid lifts to flush, and a
  // basin under a mirror with a tap that runs.
  e('bathroom', 'places', 'rooms', () => {
    const b = m('bathroom', { edge: 'sharp' })
      .box([3.2, 0.12, 2.6], [0, 0.06, 0], { color: '#e8e8f0', round: 0.02 })
      .box([3.2, 2.5, 0.12], [0, 1.25, -1.3], { color: '#bfe0f0', round: 0.02 })
      .box([0.12, 2.5, 2.6], [-1.6, 1.25, 0], { color: '#cfe8f5', round: 0.02 });
    b.each(7, (i) => b.box([3.2, 0.01, 0.01], [0, 0.3 * (i + 1), -1.23], { color: 'white', noInk: true }));
    b.box([0.75, 0.55, 1.7], [-1.15, 0.33, 0.3], { color: 'white', round: 0.3 })
      .box([0.6, 0.06, 1.55], [-1.15, 0.58, 0.3], { color: '#9fd3ea', round: 0.3 })
      .stick([-1.5, 2.1, -0.55], [-1.5, 2.1, 1.15], 0.03, 'silver')
      .box([0.02, 1.4, 0.7], [-0.8, 1.4, 0.8], { color: 'pink', edge: 'soft' })
      .box([0.42, 0.45, 0.25], [0.7, 0.3, -1.05], { color: 'white', round: 0.4 })
      .box([0.4, 0.4, 0.55], [0.7, 0.32, -0.75], { color: 'white', round: 0.6 })
      .box([0.42, 0.04, 0.5], [0.7, 0.55, -0.72], { color: 'white', round: 0.6, name: 'lid', pivot: [0.7, 0.57, -0.97], mover: { kind: 'swing', axis: 'x', amount: -95 } })
      .box([0.6, 0.18, 0.45], [-0.2, 0.85, -1.0], { color: 'white', round: 0.3 })
      .stick([-0.2, 0.1, -1.1], [-0.2, 0.78, -1.1], 0.14, 'white')
      .rod([-0.2, 0.95, -1.18], [-0.2, 1.0, -1.05], 0.03, 'silver')
      .box([0.6, 0.75, 0.03], [-0.2, 1.55, -1.23], { color: '#cfe6f2' })
      .box([0.025, 0.08, 0.025], [-0.2, 0.92, -0.96], { color: '#9fd3ea', name: 'water', piece: true })
      .socket('seat', [0.7, 0.55, -0.7], 'seat');
    return b
      .act({
        click: [
          [A.operate('lid', 'open'), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('FLUSH!', 1.5)), A.wait(1.2), A.operate('lid', 'close')],
          [A.pose('water', { scale: 2, move: [0, -0.05, 0], dur: 0.3 }), A.effect('water_spray', { dur: 1.5 }), A.wait(1.5), A.pose('water', { scale: 1, move: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A roll-top clawfoot bathtub at real size (1.7 m long, rim at 0.62 m), its long side to the front: a painted
  // cast-iron shell with a white rolled lip round the pale enamel basin, brass pillar taps and spout at one end, and
  // four brass claw feet. It fills with bubbly water (hidden in the shell until then) and drains.
  e('bathtub', 'home', 'bathroom', () => {
    // plan of the tub along its length: rounded ends, full width for the middle two thirds
    const plan: Array<[number, number, number, number]> = [[0, 0.2, 0.6, 0], [0.03, 0.55, 0.8, 0], [0.08, 0.83, 0.92, 0], [0.12, 0.94, 0.97, 0], [0.18, 1, 1, 0], [0.82, 1, 1, 0], [0.88, 0.94, 0.97, 0], [0.92, 0.83, 0.92, 0], [0.97, 0.55, 0.8, 0], [1, 0.2, 0.6, 0]];
    const b = m('bathtub', { edge: 'sharp' })
      .loft([0.78, 1.0, 1.7], [0, 0.62, 0], plan, { color: '#3c5566', boxy: 0.35, cut: 'bottom', rot: [0, 90, 0], name: 'tub' })
      .loft([0.6, 0.84, 1.47], [0, 0.6215, 0], plan, { color: '#b7c8d0', boxy: 0.35, cut: 'bottom', rot: [0, 90, 0], name: 'basin' })
      .loft([0.56, 0.1, 1.41], [0, 0.5, 0], plan, { color: '#8fcbe6', boxy: 0.35, rot: [0, 90, 0], name: 'water', piece: true });
    for (const [x0, z] of [[0.4, 0.1], [0.15, -0.12], [-0.2, 0.08], [-0.45, -0.06], [0.55, -0.1]]) b.ball([0.12, 0.05, 0.1], [x0, 0.56, z], { color: 'white', parent: 'water', edge: 'soft' });
    // the white rolled rim: two straight rails and a half-round at each end
    b.pair((s) => b.capsule([0.05, 1.14, 0.05], [0, 0.628, s * 0.37], { color: 'white', rot: [0, 0, 90] }).arc([0.79, 0.63, 0.05], [s * 0.544, 0.628, 0], { color: 'white', rot: [90, 0, -s * 90], tube: 0.063 }));
    // brass pillar taps and a swan-neck spout on the left end of the rim
    b.stick([-0.79, 0.62, 0], [-0.79, 0.76, 0], 0.03, 'brass')
      .rod([-0.79, 0.76, 0], [-0.7, 0.745, 0], 0.026, 'brass')
      .stick([-0.7, 0.745, 0], [-0.7, 0.72, 0], 0.02, 'brass');
    b.pair((s) => b.cyl([0.034, 0.06, 0.034], [-0.79, 0.65, s * 0.1], { color: 'brass' }).box([0.07, 0.012, 0.012], [-0.79, 0.685, s * 0.1], { color: 'brass', round: 0.5 }).ball(0.022, [-0.79, 0.695, s * 0.1], { color: 'white' }));
    // four claw feet under the shell
    for (const [x0, z] of [[0.56, 0.24], [-0.56, 0.24], [0.56, -0.24], [-0.56, -0.24]]) {
      b.capsule([0.07, 0.17, 0.07], [x0, 0.1, z], { color: 'brass', rot: [-z * 40, 0, x0 * 18] });
      b.ball([0.1, 0.045, 0.11], [x0 * 1.04, 0.022, z * 1.12], { color: 'brass' });
    }
    return b
      .socket('bath', [0, 0.45, 0], 'inside', { size: 1.4 })
      .act({
        click: [
          [A.par(A.pose('water', { move: [0, 0.077, 0], dur: 2 }), A.effect('water_spray', { dur: 1.8 })), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Splish splash!', 1.5))],
          [A.pose('water', { move: [0, 0, 0], dur: 1.5 }), A.say('Glug glug...', 1.5)],
        ],
      })
      .done();
  }),
  // Someone in a bat costume: grey suit, black cowl with ears, cape and a gold utility belt, hands on hips.
  e('batman costume', 'wardrobe', 'costumes', () =>
    withAct(who('batman costume', { top: '#5a5d63', bottom: '#5a5d63', shoes: 'black', long: true, style: 'none', pose: 'hips', acc: [hat('catears', 'black'), face('mask', 'black'), wear('cape', 'black'), wear('belt', 'gold')] }), {
      click: [[A.par(A.anim('point'), A.say('To the Batmobile!', 2))], [A.par(A.anim('hands_on_hips'), A.say('Never fear!', 2))]],
    }),
  ),
  // A long, low black super-car (5.6 m long, 2.2 m wide, 1.4 m to the canopy top): a soft lofted body with a long
  // low hood that ends in a round turbine intake at the nose, slim headlights, a dark glass bubble canopy that slides
  // forward to let the driver in, black side strakes, two crisp bat-wing tail fins rising to points at the back
  // (triangles standing edge-on, not slabs), red tail lights and a jet exhaust that lights up when it roars off.
  e('batmobile (regular)', 'garage', 'cars', () => {
    const k = '#2a2726', dk = '#1a1a1c';
    const b = m('batmobile (regular)', { view: 'side' })
      .loft([2.2, 0.85, 5.6], [0, 0.72, 0], [[0, 0.75, 0.85, 0.05], [0.15, 0.98, 1, 0], [0.55, 1, 0.9, -0.03], [0.85, 0.82, 0.62, -0.1], [1, 0.45, 0.5, -0.1]], { color: k, boxy: 0.6, name: 'body', edge: 'soft' })
      .loft([1.15, 0.72, 2.1], [0, 1.04, -0.35], [[0, 0.55, 0.5, -0.15], [0.35, 1, 1, 0], [0.75, 0.92, 0.85, -0.02], [1, 0.45, 0.3, -0.2]], { color: GL, cut: 'top', boxy: 0.3, name: 'canopy', parent: 'body', mover: { kind: 'slide', axis: 'z', amount: 0.9 }, edge: 'sharp' })
      .box([0.08, 0.05, 1.5], [0, 1.39, -0.35], { color: k, round: 0.4, parent: 'canopy', edge: 'sharp' })
      // turbine intake in the nose
      .torus([0.42, 0.4, 0.14], [0, 0.63, 2.76], { color: dk, tube: 0.22, parent: 'body', edge: 'sharp' })
      .cyl([0.3, 0.06, 0.28], [0, 0.63, 2.74], { color: '#5c6166', rot: [90, 0, 0], parent: 'body', edge: 'sharp' })
      .box([0.03, 0.26, 0.04], [0, 0.63, 2.78], { color: dk, parent: 'body', edge: 'sharp' })
      // jet exhaust at the tail
      .cyl([0.62, 0.3, 0.62], [0, 0.78, -2.8], { color: '#3a3633', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.46, 0.06, 0.46], [0, 0.78, -2.96], { color: 'fire', rot: [90, 0, 0], glow: true, name: 'afterburner', mover: { kind: 'light' } })
      .socket('seat', [0.32, 0.72, -0.25], 'seat');
    b.pair((s) => {
      b.wedge([2.0, 0.62, 0.07], [s * 0.8, 1.27, -1.9], { color: k, rot: [0, 90, 0], apex: 0.5, edge: 'sharp' });
      b.wedge([1.1, 0.3, 0.075], [s * 0.8, 1.1, -1.25], { color: dk, rot: [0, 90, 0], apex: 0.5, edge: 'sharp' });
      b.box([0.05, 0.1, 2.2], [s * 1.1, 0.5, 0.1], { color: dk, round: 0.3, edge: 'sharp' });
      b.box([0.32, 0.07, 0.1], [s * 0.45, 0.62, 2.7], { color: '#fff6c8', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light' }, edge: 'sharp' });
      b.box([0.36, 0.08, 0.05], [s * 0.6, 0.92, -2.78], { color: '#d4241c', glow: true, edge: 'sharp' });
      tyre(b, s > 0 ? 'wheelFL' : 'wheelFR', [s * 0.98, 0.4, 1.75], 0.8, 0.35, { hub: '#3a3633' });
      tyre(b, s > 0 ? 'wheelBL' : 'wheelBR', [s * 0.98, 0.43, -1.6], 0.86, 0.42, { hub: '#3a3633' });
    });
    return b
      .act({
        click: [
          [A.operate('light', 'on'), A.operate('afterburner', 'on'), A.par(A.say('VROOOOM!', 2), A.effect('smoke', { dur: 2 }), A.anim('shake', 2)), A.wait(1), A.operate('afterburner', 'off'), A.operate('light', 'off')],
          [A.operate('canopy', 'open'), A.say('Hsssss...', 1.5), A.wait(2.5), A.operate('canopy', 'close')],
        ],
      })
      .done();
  }),
  // A majorette's twirling baton (60 cm) with white rubber ends, standing in a weighted stand; it twirls up.
  e('baton (performance)', 'music', 'marching band', () =>
    m('baton (performance)')
      .cyl([0.16, 0.03, 0.16], [0, 0.015, 0], { color: 'navy', edge: 'sharp' })
      .cyl([0.03, 0.06, 0.03], [0, 0.06, 0], { color: 'navy', edge: 'sharp' })
      .stick([0, 0.07, 0], [0, 0.66, 0], 0.012, 'silver', { name: 'baton', pivot: [0, 0.36, 0] })
      .ball([0.045, 0.045, 0.045], [0, 0.08, 0], { color: 'white', parent: 'baton' })
      .ball([0.035, 0.035, 0.035], [0, 0.66, 0], { color: 'white', parent: 'baton' })
      .act({ click: [[A.pose('baton', { move: [0, 0.6, 0], rot: [0, 0, 720], dur: 1.2 }), A.pose('baton', { move: [0, 0, 0], rot: [0, 0, 1080], dur: 0.6 }), A.pose('baton', { rot: [0, 0, 0], dur: 0.01 }), A.effect('sparkle', { dur: 0.8 })]] })
      .done(),
  ),
  // A mixing bowl of pancake batter with a whisk standing in it; the whisk whirls.
  e('batter (food)', 'food', 'baking', () =>
    m('batter (food)')
      .cyl([0.26, 0.12, 0.26], [0, 0.06, 0], { color: 'skyblue', taper: 1.35, edge: 'sharp' })
      .ball([0.32, 0.05, 0.32], [0, 0.115, 0], { color: '#f3dc9a' })
      .stick([0.02, 0.12, 0], [0.1, 0.32, 0.02], 0.016, 'silver', { name: 'whisk', pivot: [0.02, 0.12, 0] })
      .torus([0.04, 0.09, 0.008], [0.015, 0.14, 0], { color: 'silver', rot: [0, 0, -24], tube: 0.12, parent: 'whisk' })
      .torus([0.04, 0.09, 0.008], [0.015, 0.14, 0], { color: 'silver', rot: [0, 90, -24], tube: 0.12, parent: 'whisk' })
      .capsule([0.02, 0.05, 0.015], [0.0, 0.1, 0.13], { color: '#f3dc9a' })
      .act({ click: [[A.pose('whisk', { rot: [0, 1080, 0], dur: 1.5 }), A.pose('whisk', { rot: [0, 0, 0], dur: 0.01 }), A.say('Whisk whisk!', 1)]] })
      .done(),
  ),
  // A siege battering ram (5 m): a roofed timber frame on four wheels, an iron-capped log slung on ropes that
  // swings back and smashes forward.
  e('battering ram', 'armory', 'siege weapons', () => {
    const b = m('battering ram', { view: 'side' })
      .stick([0, 2.3, -2.0], [0, 2.3, 2.0], 0.18, 'darkwood')
      .capsule([0.45, 4.6, 0.45], [0, 1.2, 0.5], { color: 'bark', rot: [90, 0, 0], name: 'ram', pivot: [0, 2.3, 0.5] })
      .cyl([0.56, 0.45, 0.56], [0, 1.2, 2.8], { color: 'iron', rot: [90, 0, 0], parent: 'ram', edge: 'sharp' })
      .cone([0.4, 0.3, 0.4], [0, 1.2, 3.15], { color: 'iron', rot: [90, 0, 0], parent: 'ram', edge: 'sharp' })
      .stick([0, 2.3, -0.6], [0, 1.4, -0.6], 0.04, 'tan', { parent: 'ram' })
      .stick([0, 2.3, 1.4], [0, 1.4, 1.4], 0.04, 'tan', { parent: 'ram' });
    for (const z of [-1.8, 0, 1.8]) b.pair((s) => b.rod([s * 0.95, 0.55, z], [0, 2.3, z], 0.14, 'wood'));
    b.pair((s) => {
      b.stick([s * 0.95, 0.55, -2.1], [s * 0.95, 0.55, 2.1], 0.22, 'darkwood');
      b.box([0.08, 1.8, 4.4], [s * 0.55, 1.65, 0], { color: '#8a6440', rot: [0, 0, s * 33], edge: 'sharp' });
      tyre(b, s > 0 ? 'wheelFL' : 'wheelFR', [s * 1.15, 0.5, 1.5], 1.0, 0.22, { tire: 'darkwood', hub: 'iron' });
      tyre(b, s > 0 ? 'wheelBL' : 'wheelBR', [s * 1.15, 0.5, -1.5], 1.0, 0.22, { tire: 'darkwood', hub: 'iron' });
    });
    return b.act({ click: [[A.pose('ram', { rot: [-25, 0, 0], dur: 0.8 }), A.pose('ram', { rot: [15, 0, 0], dur: 0.25 }), A.par(A.say('BOOM!', 1.2), A.effect('dust', { dur: 1 }), A.anim('shake')), A.pose('ram', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A battery cell standing on end (6 cm): the copper top with its button, the black body, + and - marks; it buzzes
  // with charge.
  e('battery', 'tech', 'power', () =>
    m('battery', { edge: 'sharp' })
      .cyl([0.034, 0.045, 0.034], [0, 0.0225, 0], { color: '#2a2726' })
      .cyl([0.0345, 0.012, 0.0345], [0, 0.051, 0], { color: 'copper' })
      .cyl([0.012, 0.005, 0.012], [0, 0.0595, 0], { color: 'silver' })
      .label('+', [0.012, 0.012], [0, 0.05, 0.017], { color: 'copper', depth: 0.001 })
      .label('1.5V', [0.02, 0.008], [0, 0.025, 0.017], { color: '#2a2726', depth: 0.001 })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1 }), A.anim('pulse'), A.say('Bzzt!', 1))]] })
      .done(),
  ),
  // A double-bladed battle axe (1.5 m) standing in an iron stand; it swings.
  e('battle axe', 'armory', 'axes', () =>
    m('battle axe', { edge: 'sharp' })
      .cyl([0.4, 0.06, 0.4], [0, 0.03, 0], { color: 'iron' })
      .cyl([0.08, 0.12, 0.08], [0, 0.12, 0], { color: 'iron' })
      .stick([0, 0.06, 0], [0, 1.4, 0], 0.045, 'darkwood', { name: 'axe', pivot: [0, 0.1, 0] })
      .box([0.07, 0.14, 0.07], [0, 1.28, 0], { color: 'iron', parent: 'axe' })
      .wedge([0.36, 0.3, 0.025], [0.17, 1.28, 0], { color: 'steel', rot: [0, 0, 90], apex: 0, parent: 'axe' })
      .wedge([0.36, 0.3, 0.025], [-0.17, 1.28, 0], { color: 'steel', rot: [0, 0, -90], apex: 0, parent: 'axe' })
      .cone([0.05, 0.12, 0.05], [0, 1.46, 0], { color: 'steel', parent: 'axe' })
      .box([0.05, 0.25, 0.05], [0, 0.6, 0], { color: 'leather', round: 0.4, parent: 'axe' })
      .act({ click: [[A.pose('axe', { rot: [0, 0, 50], dur: 0.35 }), A.pose('axe', { rot: [0, 0, -50], dur: 0.25 }), A.say('Whoosh!', 1), A.pose('axe', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A battleship at the 80 m cap (a 1:3.4 model in its real proportions): a long grey hull with a sharp bow, red
  // below the waterline, three big gun turrets that swing and fire, the tower bridge, a funnel and masts.
  e('battleship', 'garage', 'ships', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.7, 0.85, 0.05], [0.1, 0.95, 0.95, 0], [0.7, 1, 1, 0], [0.92, 0.6, 1.05, 0.03], [1, 0.05, 1.1, 0.06]];
    const b = m('battleship', { view: 'side', edge: 'sharp' })
      .loft([11, 6, 80], [0, 3, 0], prof, { color: '#7d858c', boxy: 0.7, edge: 'soft' })
      .loft([11.15, 2.0, 80.3], [0, 1.0, 0], prof.map(([t, w, h]) => [t, w, h, 0] as [number, number, number, number]), { color: '#a3322a', boxy: 0.7, edge: 'soft' })
      .box([9.6, 0.25, 64], [0, 6.0, -2], { color: '#a8946a', round: 0.05 })
      .box([7, 3.5, 16], [0, 7.8, -2], { color: '#8a9298' })
      .box([5, 3.5, 8], [0, 11.3, 0], { color: '#8a9298' })
      .box([5.05, 0.8, 8.05], [0, 12.2, 0], { color: '#26313b' })
      .box([3, 3, 4], [0, 14.5, 1], { color: '#8a9298' })
      .box([3.05, 0.6, 4.05], [0, 15.4, 1], { color: '#26313b' })
      .stick([0, 16, 1], [0, 24, 1], 0.4, '#5c6166')
      .stick([-2.5, 21, 1], [2.5, 21, 1], 0.2, '#5c6166')
      .cyl([3.2, 6, 2.6], [0, 12.5, -7], { color: '#8a9298', rot: [-8, 0, 0] })
      .cyl([3.25, 0.8, 2.65], [0, 15.4, -7.4], { color: '#2a2726', rot: [-8, 0, 0] })
      .stick([0, 9, -14], [0, 17, -14], 0.35, '#5c6166');
    const turret = (name: string, z: number, y: number, dir: 1 | -1) => {
      b.cyl([5, 0.6, 5], [0, y - 0.4, z], { color: '#6b7378' });
      b.box([4.2, 1.8, 5.2], [0, y + 0.5, z], { color: '#8a9298', round: 0.25, name, pivot: [0, y, z] });
      b.each(3, (i) => b.stick([-1.1 + i * 1.1, y + 0.6, z + dir * 2.4], [-1.1 + i * 1.1, y + 0.9, z + dir * 9.5], 0.45, '#5c6166', { parent: name }));
    };
    turret('turret1', 22, 6.9, 1);
    turret('turret2', 13, 8.6, 1);
    b.box([6, 1.6, 6], [0, 7.3, 13], { color: '#8a9298' });
    turret('turret3', -22, 6.9, -1);
    b.label('BB-61', [3, 1.2], [5.45, 4.2, 30], { color: '#7d858c', rot: [0, 90, 0], depth: 0.05 });
    const swing = (a: number, d: number) => A.par(A.pose('turret1', { rot: [0, a, 0], dur: d }), A.pose('turret2', { rot: [0, a, 0], dur: d }), A.pose('turret3', { rot: [0, -a, 0], dur: d }));
    return b.act({ click: [[swing(35, 1.5), A.par(A.effect('smoke', { dur: 2 }), A.say('BOOM!', 1.5), A.anim('shake')), A.wait(1), swing(0, 1.5)]] }).done();
  }),
  // A bayonet on a wall-display plaque: a long steel blade, crossguard with a muzzle ring, a wooden grip; it gleams.
  e('bayonet', 'armory', 'blades', () =>
    m('bayonet', { edge: 'sharp' })
      .box([0.6, 0.16, 0.025], [0, 0.08, -0.02], { color: 'darkwood', round: 0.3 })
      .box([0.3, 0.035, 0.008], [0.1, 0.09, 0.0], { color: 'silver', round: 0.1, name: 'blade' })
      .cone([0.035, 0.05, 0.008], [0.275, 0.09, 0.0], { color: 'silver', rot: [0, 0, -90], parent: 'blade' })
      .box([0.012, 0.07, 0.016], [-0.055, 0.09, 0.0], { color: 'steel' })
      .torus([0.025, 0.025, 0.008], [-0.055, 0.135, 0.0], { color: 'steel', tube: 0.25 })
      .box([0.12, 0.03, 0.02], [-0.12, 0.09, 0.0], { color: 'wood', round: 0.5 })
      .box([0.02, 0.034, 0.022], [-0.185, 0.09, 0.0], { color: 'steel' })
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1 }), A.say('Shing!', 1))]] })
      .done(),
  ),
  // A BB air rifle (90 cm) on a rack: wooden stock, a lever under the action, a long barrel and a sight; pop!
  e('bb gun', 'armory', 'guns', () =>
    m('bb gun', { view: 'side', edge: 'sharp' })
      .box([0.24, 0.02, 0.2], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.02, 0.25], [0, 0.17, 0.25], 0.02, 'darkwood')
      .stick([0, 0.02, -0.25], [0, 0.17, -0.25], 0.02, 'darkwood')
      .box([0.05, 0.13, 0.32], [0, 0.17, -0.3], { color: 'wood', round: 0.4, name: 'gun' })
      .box([0.045, 0.06, 0.2], [0, 0.21, -0.06], { color: '#3a3633', round: 0.3, parent: 'gun' })
      .stick([0, 0.215, 0.04], [0, 0.215, 0.6], 0.022, '#3a3633', { parent: 'gun' })
      .stick([0, 0.19, 0.04], [0, 0.19, 0.42], 0.028, 'wood', { parent: 'gun' })
      .box([0.012, 0.025, 0.012], [0, 0.235, 0.56], { color: '#3a3633', parent: 'gun' })
      .torus([0.07, 0.05, 0.015], [0, 0.15, -0.02], { color: '#3a3633', rot: [0, 90, 0], tube: 0.2, parent: 'gun' })
      .act({ click: [[A.pose('gun', { move: [0, 0, -0.03], dur: 0.05 }), A.par(A.say('Pop!', 1), A.effect('smoke', { dur: 0.6 })), A.pose('gun', { move: [0, 0, 0], dur: 0.25 })]] })
      .done(),
  ),
  // A squeeze bottle of barbecue sauce, dark and glossy, with a flip cap; it turns over and squirts.
  e('bbq sauce', 'food', 'sauces', () =>
    m('bbq sauce')
      .cyl([0.075, 0.15, 0.075], [0, 0.075, 0], { color: '#5a2010', name: 'bottle', pivot: [0, 0.1, 0] })
      .cyl([0.07, 0.08, 0.07], [0, 0.18, 0], { color: '#5a2010', taper: 0.45, parent: 'bottle' })
      .cyl([0.034, 0.03, 0.034], [0, 0.23, 0], { color: 'red', parent: 'bottle', edge: 'sharp' })
      .label('BBQ', [0.05, 0.05], [0, 0.08, 0.038], { color: 'orange', parent: 'bottle', depth: 0.002 })
      .act({ click: [[A.pose('bottle', { rot: [0, 0, 160], dur: 0.5 }), A.par(A.say('Splort!', 1.2), A.anim('pulse')), A.pose('bottle', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // Sticky barbecue chicken wings on a plate with celery; they sizzle, and one can be taken.
  e('bbq wing', 'food', 'meat', () => {
    const b = plate(m('bbq wing'), 0.24);
    b.capsule([0.04, 0.09, 0.036], [-0.02, 0.035, 0.03], { color: '#a0401c', rot: [0, 0, 80] })
      .ball([0.055, 0.048, 0.048], [-0.07, 0.038, 0.03], { color: '#a0401c' })
      .ball(0.018, [0.03, 0.03, 0.03], { color: 'cream' })
      .ball([0.08, 0.03, 0.05], [0.04, 0.03, -0.045], { color: '#8a3518', rot: [0, 30, 0], name: 'wing' })
      .capsule([0.04, 0.08, 0.036], [0.05, 0.05, 0.05], { color: '#8a3518', rot: [0, 30, 80], name: 'drumette', parent: 'wing', piece: true })
      .rod([-0.07, 0.025, -0.05], [-0.01, 0.025, -0.08], 0.018, 'lime')
      .ball([0.008, 0.004, 0.008], [-0.03, 0.054, 0.03], { color: 'cream', noInk: true });
    return b.act({ click: [[A.par(A.effect('steam', { dur: 1.5 }), A.say('Sizzle!', 1.2))], [A.detach('drumette', 'wing')], [A.reattach('drumette')]] }).done();
  }),
  // An inflatable beach ball (50 cm) in six coloured panels with white caps; it bounces high and spins.
  e('beach ball', 'toys', 'balls', () => {
    const b = m('beach ball').ball(0.5, [0, 0.25, 0], { color: 'white', name: 'ball' });
    b.each(6, (i) => b.ball([0.12, 0.5, 0.505], [0, 0.25, 0], { color: RAINBOW[i], rot: [0, i * 30, 0], parent: 'ball', noInk: true }));
    b.cyl([0.1, 0.505, 0.1], [0, 0.25, 0], { color: 'white', parent: 'ball' });
    return b.act({ click: [[A.par(A.anim('hop', 2), A.pose('ball', { rot: [0, 360, 0], dur: 1.2 }), A.say('Boing!', 1)), A.pose('ball', { rot: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // A beach umbrella (2.2 m): a striped canopy with a scalloped edge on a pole spiked into the sand; it folds up
  // and opens again.
  e('beach umbrella', 'sports', 'beach', () => {
    const b = m('beach umbrella')
      .cyl([1.0, 0.06, 1.0], [0, 0.03, 0], { color: 'sand' })
      .stick([0, 0, 0], [0, 2.2, 0], 0.04, 'white')
      .cone([2.2, 0.5, 2.2], [0, 2.0, 0], { color: 'red', segs: 8, name: 'canopy', pivot: [0, 2.2, 0] })
      .cone([1.1, 0.26, 1.1], [0, 2.16, 0], { color: 'white', segs: 8, parent: 'canopy' })
      .ball(0.06, [0, 2.28, 0], { color: 'white', parent: 'canopy' });
    around(8, 1.05, Math.PI / 8).forEach(([x0, z], i) => b.ball([0.36, 0.12, 0.06], [x0, 1.72, z], { color: i % 2 ? 'white' : 'red', rot: [0, -Math.atan2(z, x0) * RAD + 90, 0], parent: 'canopy' }));
    return b.act({ click: [[A.pose('canopy', { scale: 0.35, dur: 0.8 })], [A.pose('canopy', { scale: 1, dur: 0.8 })]] }).done();
  }),
  // A lighthouse beacon (18 m): a tapering tower in red and white bands on its rock, a keeper's door, the gallery
  // with its railing, and the glass lantern room whose lamp lights and turns.
  e('beacon', 'places', 'lighthouses', () => {
    const b = m('beacon', { edge: 'sharp' }).cyl([7, 1.2, 6], [0, 0.6, 0], { color: 'rock', edge: 'soft' });
    const ds = [4.2, 3.8, 3.4, 3.0, 2.7, 2.4];
    b.each(5, (i) => b.cyl([ds[i], 2.6, ds[i]], [0, 2.5 + i * 2.6, 0], { color: i % 2 ? 'white' : 'red', taper: ds[i + 1] / ds[i] }));
    b.cyl([3.6, 0.3, 3.6], [0, 14.35, 0], { color: '#3a3633' })
      .torus([3.6, 3.6, 0.9], [0, 14.9, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.015 })
      .cyl([2.2, 2.2, 2.2], [0, 15.6, 0], { color: GL, segs: 8 })
      .cyl([1.2, 1.2, 1.2], [0, 15.6, 0], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .box([1.3, 0.9, 0.1], [0, 15.6, 0], { color: 'gold', name: 'lens', mover: { kind: 'spin', axis: 'y', amount: 120 } })
      .dome([2.6, 1.4, 2.6], [0, 16.7, 0], { color: 'red' })
      .ball(0.4, [0, 18.2, 0], { color: '#3a3633' })
      .box([1.0, 2.0, 0.1], [0, 2.2, 2.08], { color: 'darkwood' });
    b.each(4, (i) => b.box([0.5, 0.8, 0.08], [0, 5 + i * 2.6, (ds[i + 1] / 2) * 0.98], { color: '#2a2726' }));
    return b.act({ click: [[A.operate('lamp', 'on'), A.operate('lens', 'on')], [A.operate('lamp', 'off'), A.operate('lens', 'off')]] }).done();
  }),
  // A bird's head on a display base with its orange beak; the lower half opens to sing.
  e('beak', 'aviary', 'bird parts', () =>
    m('beak', { view: 'side' })
      .box([0.08, 0.02, 0.1], [0, 0.01, -0.02], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .ball([0.07, 0.08, 0.08], [0, 0.06, -0.02], { color: 'skyblue' })
      .cone([0.045, 0.08, 0.03], [0, 0.07, 0.055], { color: 'orange', rot: [90, 0, 0] })
      .cone([0.036, 0.06, 0.02], [0, 0.052, 0.045], { color: '#e07a1a', rot: [95, 0, 0], name: 'jaw', pivot: [0, 0.055, 0.02] })
      .ball(0.016, [0.03, 0.08, 0.0], { color: 'black', eye: true })
      .ball(0.016, [-0.03, 0.08, 0.0], { color: 'black', eye: true })
      .act({ click: [[A.pose('jaw', { rot: [25, 0, 0], dur: 0.15 }), A.say('Tweet tweet!', 1.5), A.pose('jaw', { rot: [0, 0, 0], dur: 0.15 }), A.pose('jaw', { rot: [25, 0, 0], dur: 0.15 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.15 })]] })
      .done(),
  ),
  // A glass lab beaker (250 ml) with a pouring lip and printed graduations, half full of blue liquid; it pours.
  e('beaker', 'study', 'lab gear', () => {
    const b = m('beaker')
      .cyl([0.08, 0.06, 0.08], [0, 0.03, 0], { color: 'cyan', name: 'beaker', pivot: [0.04, 0, 0] })
      .cyl([0.084, 0.12, 0.084], [0, 0.06, 0], { color: 'glass', parent: 'beaker' })
      .torus([0.088, 0.088, 0.01], [0, 0.12, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.12, parent: 'beaker' })
      .cone([0.025, 0.02, 0.012], [0.042, 0.12, 0], { color: 'glass', rot: [0, 0, -70], parent: 'beaker' });
    b.each(4, (i) => b.box([0.018, 0.003, 0.003], [-0.01, 0.025 + i * 0.022, 0.042], { color: 'white', noInk: true, parent: 'beaker' }));
    return b.act({ click: [[A.pose('beaker', { rot: [0, 0, -70], dur: 0.6 }), A.effect('water_spray', { dur: 1 }), A.say('Gloop...', 1), A.pose('beaker', { rot: [0, 0, 0], dur: 0.5 })], [A.par(A.effect('steam', { dur: 1.5 }), A.say('Blub blub!', 1.2))]] }).done();
  }),
  // An open broad-bean pod (16 cm) with its fat green beans inside; one pops out.
  e('bean', 'food', 'vegetables', () => {
    const b = m('bean')
      .loft([0.035, 0.03, 0.17], [0, 0.015, 0], [[0, 0.3, 0.3, 0], [0.15, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.2, 0.3, 0.1]], { color: '#6aa84f', rot: [0, 90, 0], cut: 'bottom', name: 'pod' })
      .loft([0.03, 0.024, 0.16], [0, 0.017, 0], [[0, 0.3, 0.3, 0], [0.15, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.2, 0.3, 0.1]], { color: '#e8f0c8', rot: [0, 90, 0], cut: 'bottom' });
    b.each(4, (i) => b.ball([0.022, 0.016, 0.02], [-0.05 + i * 0.033, 0.02, 0], { color: '#9bc85a', name: i === 3 ? 'bean' : undefined, parent: i === 3 ? 'pod' : undefined, piece: i === 3 }));
    return b.act({ click: [[A.detach('bean', 'bean'), A.say('Pop!', 1)], [A.reattach('bean')]] }).done();
  }),
  // A big squashy bean bag chair (0.8 m tall, 1 m across) in red cord with a dent for sitting; someone flops in.
  e('bean bag (chair)', 'home', 'seating', () =>
    m('bean bag (chair)')
      .ball([1.0, 0.55, 1.0], [0, 0.27, 0], { color: '#c0392b', name: 'bag' })
      .ball([0.8, 0.6, 0.45], [0, 0.55, -0.25], { color: '#c0392b', parent: 'bag' })
      .ball([0.55, 0.12, 0.45], [0, 0.52, 0.12], { color: '#a8302a', noInk: true, parent: 'bag' })
      .box([0.1, 0.05, 0.02], [0.3, 0.2, 0.47], { color: 'white', noInk: true, parent: 'bag' })
      .socket('seat', [0, 0.45, 0.1], 'seat')
      .act({ click: [[A.spawn('kid', 'boy'), A.attach('kid', 'self', 'seat'), A.par(A.pose('bag', { scale: 0.92, dur: 0.2 }), A.say('Flop! Ahh...', 2, 'kid')), A.pose('bag', { scale: 1, dur: 0.4 }), A.wait(1.5), A.remove('kid', 'fade')]] })
      .done(),
  ),
  // A knitted beanie with a folded ribbed brim and a pompom that bounces.
  e('beanie', 'wardrobe', 'hats', () =>
    m('beanie')
      .dome([0.21, 0.17, 0.21], [0, 0.145, 0], { color: 'red' })
      .cyl([0.215, 0.06, 0.215], [0, 0.03, 0], { color: 'white' })
      .torus([0.216, 0.216, 0.02], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .ball(0.08, [0, 0.26, 0], { color: 'white', name: 'pompom', pivot: [0, 0.23, 0] })
      .act({ click: [[A.pose('pompom', { rot: [0, 0, 25], dur: 0.15 }), A.pose('pompom', { rot: [0, 0, -20], dur: 0.15 }), A.pose('pompom', { rot: [0, 0, 10], dur: 0.15 }), A.pose('pompom', { rot: [0, 0, 0], dur: 0.15 })]] })
      .done(),
  ),
  // A bearskin rug (2.4 m long, flat; the head lifts it to 0.35 m): a dark pelt with four splayed paws and claws,
  // the head with open jaws that roar.
  e('bear rug', 'home', 'rugs', () => {
    const B = '#4a3020';
    const b = m('bear rug')
      .ball([1.2, 0.05, 1.7], [0, 0.025, -0.1], { color: B })
      .ball([0.32, 0.26, 0.34], [0, 0.15, 0.85], { color: B, name: 'head' })
      .ball([0.16, 0.12, 0.18], [0, 0.11, 1.04], { color: '#5a4030', parent: 'head' })
      .ball([0.06, 0.04, 0.04], [0, 0.15, 1.12], { color: 'black', parent: 'head' })
      .box([0.13, 0.04, 0.14], [0, 0.04, 1.03], { color: '#8a3030', name: 'jaw', pivot: [0, 0.08, 0.95], parent: 'head', round: 0.5 })
      .ball(0.035, [0.07, 0.2, 0.98], { color: 'black', eye: true, parent: 'head' })
      .ball(0.035, [-0.07, 0.2, 0.98], { color: 'black', eye: true, parent: 'head' });
    b.pair((s) => {
      b.ball([0.1, 0.1, 0.06], [s * 0.12, 0.28, 0.8], { color: B, parent: 'head' });
      for (const z of [0.45, -0.75]) {
        b.ball([0.5, 0.04, 0.28], [s * 0.72, 0.022, z], { color: B, rot: [0, s * 20, 0] });
        b.each(4, (i) => spike(b, [s * 0.95, 0.03, z - 0.09 + i * 0.06], [s * 1.04, 0.02, z - 0.09 + i * 0.06], 0.02, 'cream'));
      }
    });
    return b.act({ click: [[A.pose('jaw', { rot: [30, 0, 0], dur: 0.25 }), A.say('Rrraaah!', 1.5), A.wait(0.6), A.pose('jaw', { rot: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // Someone in a bear costume: furry brown suit and a bear hood with round ears and a muzzle, paws up.
  e('bear suit', 'wardrobe', 'costumes', () =>
    withAct(
      who('bear suit', {
        top: '#6b4226', bottom: '#6b4226', shoes: '#4a2a18', long: true, style: 'none', pose: 'arms_up',
        acc: [
          (p, d) => {
            p.add({ name: 'hood', parent: 'head', at: [0, d.headY, -d.headD * 0.12], shape: 'ball', size: [d.headW * 1.25, d.headH * 1.2, d.headD * 1.08], color: col('#6b4226'), layer: -1 });
            for (const s of [1, -1]) p.add({ name: s > 0 ? 'bearEarL' : 'bearEarR', parent: 'head', at: [s * d.headW * 0.48, d.headY + d.headH * 0.55, -d.headD * 0.1], shape: 'ball', size: [d.headW * 0.36, d.headW * 0.36, d.headW * 0.18], color: col('#6b4226'), layer: 1 });
            p.add({ name: 'belly', parent: 'torso', at: [0, d.torsoH * 0.45, d.td * 0.42], shape: 'ball', size: [d.tw * 0.75, d.torsoH * 0.7, d.td * 0.3], color: col('#c9a46a'), layer: 2 });
          },
        ],
      }),
      { click: [[A.par(A.anim('arms_up'), A.say("Grrr! I'm a bear!", 2))], [A.par(A.anim('wave'), A.say('Want a bear hug?', 2))]] },
    ),
  ),
  // A steel jaw trap (45 cm), set open on its base plate with the pan in the middle and a chain: it snaps shut.
  e('bear trap', 'sports', 'hunting', () => {
    const b = m('bear trap', { edge: 'sharp' })
      .box([0.5, 0.025, 0.12], [0, 0.0125, 0], { color: 'iron', round: 0.2 })
      .cyl([0.12, 0.015, 0.12], [0, 0.03, 0], { color: 'steel' })
      .torus([0.04, 0.04, 0.012], [0.28, 0.02, 0], { color: 'iron', rot: [90, 0, 0] })
      .torus([0.04, 0.04, 0.012], [0.32, 0.02, 0.0], { color: 'iron' });
    b.pair((s) => {
      const n = s > 0 ? 'jawF' : 'jawB';
      b.arc([0.4, 0.4, 0.012], [0, 0.025, s * 0.18], { color: 'steel', arc: 180, tube: 0.06, rot: [s * 75, 0, 0], name: n, pivot: [0, 0.025, s * 0.06], mover: { kind: 'swing', axis: 'x', amount: -s * 75 } });
      b.each(5, (i) => spike(b, [-0.12 + i * 0.06, 0.06, s * 0.18], [-0.12 + i * 0.06, 0.1, s * 0.13], 0.025, 'steel', { parent: n, segs: 3 }));
      b.capsule([0.04, 0.16, 0.04], [s * 0.22, 0.03, 0], { color: 'iron', rot: [0, 0, 90] });
    });
    return b.act({ click: [[A.operate('jaw', 'close'), A.par(A.say('SNAP!', 1.2), A.anim('shake'))], [A.operate('jaw', 'open'), A.say('Click.', 1)]] }).done();
  }),
  // A big bushy false beard with a curled moustache on a display head; it wags as it mumbles.
  e('beard', 'wardrobe', 'hair and beards', () =>
    m('beard')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.12, 0], 0.03, 'darkwood')
      .ball([0.17, 0.22, 0.19], [0, 0.27, 0], { color: 'beige' })
      .ball([0.16, 0.18, 0.1], [0, 0.2, 0.07], { color: '#6b4226', name: 'beard', pivot: [0, 0.27, 0.06] })
      .cone([0.12, 0.08, 0.08], [0, 0.1, 0.08], { color: '#6b4226', rot: [180, 0, 0], parent: 'beard' })
      .capsule([0.025, 0.08, 0.025], [0.035, 0.265, 0.1], { color: '#5a3a22', rot: [0, 0, 70] })
      .capsule([0.025, 0.08, 0.025], [-0.035, 0.265, 0.1], { color: '#5a3a22', rot: [0, 0, -70] })
      .act({ click: [[A.say('Hmm, hmm...', 1.5), A.pose('beard', { rot: [8, 0, 0], dur: 0.15 }), A.pose('beard', { rot: [0, 0, 0], dur: 0.15 }), A.pose('beard', { rot: [8, 0, 0], dur: 0.15 }), A.pose('beard', { rot: [0, 0, 0], dur: 0.15 })]] })
      .done(),
  ),
  // A beaver dam across a stream (6 m long, 1.5 m tall): a mound of criss-crossed sticks and mud holding back a
  // pond; a beaver's tail slaps the water.
  e('beaver dam', 'wild', 'animal homes', () => {
    const b = m('beaver dam')
      .box([7, 0.1, 6], [0, 0.05, 0], { color: 'dirt', round: 0.1 })
      .box([6.8, 0.06, 2.6], [0, 0.11, 1.6], { color: 'water', edge: 'sharp', round: 0.05 })
      .box([6.8, 1.2, 2.6], [0, 0.65, -1.6], { color: 'water', round: 0.05 })
      .loft([2.0, 3.0, 6.6], [0, 0.05, 0], [[0, 0.6, 0.5, 0], [0.15, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.6, 0.5, 0]], { color: '#6a4a30', rot: [0, 90, 0], cut: 'top' });
    b.each(16, (i) => {
      const x0 = -2.8 + (i % 8) * 0.8, y = 0.5 + Math.floor(i / 8) * 0.6;
      b.stick([x0 - 0.5, y, 0.35 - (i % 3) * 0.2], [x0 + 0.6, y + ((i % 2) - 0.5) * 0.6, 0.5 - (i % 2) * 0.4], 0.07 + (i % 3) * 0.02, i % 2 ? 'bark' : '#8a6440');
    });
    b.ball([0.5, 0.3, 0.7], [1.5, 1.35, -1.2], { color: '#5a3a22', name: 'beaver' })
      .box([0.25, 0.06, 0.4], [1.5, 1.28, -1.7], { color: '#3a2a20', name: 'tail', pivot: [1.5, 1.3, -1.5], parent: 'beaver', round: 0.6 });
    return b.act({ click: [[A.pose('tail', { rot: [-50, 0, 0], dur: 0.25 }), A.pose('tail', { rot: [10, 0, 0], dur: 0.12 }), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Slap! Splash!', 1.5)), A.pose('tail', { rot: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // A double bed (2.1 m by 1.6 m, mattress at 0.55 m): a wooden frame and padded headboard, a mattress, plump
  // pillows and a duvet whose corner folds back.
  e('bed', 'home', 'bedroom', () => {
    const b = m('bed')
      .box([1.7, 0.3, 2.15], [0, 0.25, 0], { color: 'darkwood', edge: 'sharp', round: 0.1 })
      .box([1.7, 1.15, 0.1], [0, 0.6, -1.07], { color: 'darkwood', edge: 'sharp', round: 0.1 })
      .box([1.5, 0.6, 0.08], [0, 0.82, -1.0], { color: '#8a5a9a', round: 0.6 })
      .box([1.6, 0.22, 2.0], [0, 0.48, 0.02], { color: 'white', round: 0.4 })
      .box([1.64, 0.08, 1.45], [0, 0.6, 0.3], { color: '#4e8fd6', round: 0.5, name: 'duvet', pivot: [0, 0.62, -0.42] })
      .box([1.64, 0.02, 0.1], [0, 0.64, -0.38], { color: 'white', round: 0.5, parent: 'duvet' })
      .socket('bed', [0, 0.62, 0.1], 'top', { size: 1.8 });
    b.pair((s) => b.box([0.6, 0.14, 0.38], [s * 0.38, 0.65, -0.72], { color: 'white', round: 0.8, name: s > 0 ? 'pillowL' : 'pillowR' }));
    for (const [x0, z] of [[0.78, 1.0], [-0.78, 1.0], [0.78, -1.0], [-0.78, -1.0]]) b.box([0.08, 0.1, 0.08], [x0, 0.05, z], { color: 'darkwood', edge: 'sharp' });
    return b
      .act({ click: [[A.pose('duvet', { rot: [-150, 0, 0], move: [0, 0.05, 0], dur: 0.7 }), A.say('Time for bed...', 1.5)], [A.pose('duvet', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.7 }), A.par(A.pose('pillowL', { scale: 1.15, dur: 0.2 }), A.say('Zzz...', 2)), A.pose('pillowL', { scale: 1, dur: 0.3 })]] })
      .done();
  }),
  // A bedroom, cut away: a bed with a duvet, a bedside table with a lamp that switches, a wardrobe whose door
  // opens, a rug and a window with curtains.
  e('bedroom', 'places', 'rooms', () => {
    const b = m('bedroom', { edge: 'sharp' })
      .box([4, 0.12, 3.6], [0, 0.06, 0], { color: 'lightwood', round: 0.02 })
      .box([4, 2.6, 0.12], [0, 1.3, -1.8], { color: '#f4d6e0', round: 0.02 })
      .box([0.12, 2.6, 3.6], [-2.0, 1.3, 0], { color: '#f8e2ea', round: 0.02 })
      .box([1.5, 0.3, 2.0], [-0.6, 0.27, -0.75], { color: 'darkwood', round: 0.1 })
      .box([1.5, 0.9, 0.08], [-0.6, 0.6, -1.72], { color: 'darkwood', round: 0.1 })
      .box([1.44, 0.2, 1.9], [-0.6, 0.5, -0.75], { color: 'white', round: 0.4, edge: 'soft' })
      .box([1.48, 0.07, 1.35], [-0.6, 0.62, -0.45], { color: 'purple', round: 0.5, edge: 'soft' })
      .box([1.0, 0.12, 0.35], [-0.6, 0.66, -1.45], { color: 'white', round: 0.8, edge: 'soft' })
      .box([0.45, 0.55, 0.4], [0.5, 0.33, -1.5], { color: 'wood', round: 0.1 })
      .cyl([0.12, 0.25, 0.12], [0.5, 0.73, -1.5], { color: 'brass' })
      .cyl([0.3, 0.22, 0.3], [0.5, 0.95, -1.5], { color: 'cream', taper: 0.65 })
      .ball(0.12, [0.5, 0.9, -1.5], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
      .box([1.1, 2.0, 0.6], [1.4, 1.06, -1.45], { color: 'wood', round: 0.05 })
      .box([0.53, 1.9, 0.04], [1.13, 1.06, -1.13], { color: '#c9925a', name: 'door', pivot: [0.87, 1.06, -1.13], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([0.53, 1.9, 0.04], [1.67, 1.06, -1.13], { color: '#c9925a' })
      .cyl([1.6, 0.02, 1.2], [0.4, 0.13, 0.6], { color: '#8a5fc4', edge: 'soft' })
      .box([0.06, 1.0, 1.0], [-1.93, 1.5, 0.6], { color: WIN })
      .box([0.08, 1.3, 0.3], [-1.9, 1.45, 0.0], { color: 'pink', edge: 'soft' })
      .box([0.08, 1.3, 0.3], [-1.9, 1.45, 1.2], { color: 'pink', edge: 'soft' });
    return b.act({ click: [[A.operate('lamp', 'off'), A.say('Good night!', 2)], [A.operate('lamp', 'on'), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A patchwork quilt folded in a soft stack; its top fold flips open.
  e('bedspread', 'home', 'bedding', () => {
    const b = m('bedspread');
    const C = ['#e0473b', '#f6d24a', '#4e8fd6', '#5aa553', '#f4a1c0', '#f0923b'];
    b.each(3, (i) => b.box([0.6, 0.05, 0.45], [0, 0.025 + i * 0.05, 0], { color: C[i * 2], round: 0.5, name: i === 2 ? 'fold' : undefined, pivot: i === 2 ? [-0.3, 0.13, 0] : undefined }));
    b.each(9, (i) => b.box([0.18, 0.006, 0.13], [-0.2 + (i % 3) * 0.2, 0.152, -0.15 + Math.floor(i / 3) * 0.15], { color: C[(i * 4) % 6], round: 0.2, noInk: true, parent: 'fold' }));
    return b.act({ click: [[A.pose('fold', { rot: [0, 0, 170], dur: 0.6 }), A.say('Flap!', 1)], [A.pose('fold', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A T-bone steak (the vocabulary's 1.7 m is the cow; this is the meat) on a wooden board with a sprig of
  // rosemary: it sizzles, and a slice is cut off.
  e('beef', 'food', 'meat', () =>
    m('beef')
      .box([0.4, 0.025, 0.28], [0, 0.0125, 0], { color: 'lightwood', round: 0.3, edge: 'sharp', name: 'board' })
      .ball([0.24, 0.035, 0.17], [-0.01, 0.042, 0], { color: '#8a3b2a' })
      .ball([0.24, 0.02, 0.17], [-0.01, 0.052, 0], { color: '#a04a35', noInk: true })
      .box([0.012, 0.03, 0.12], [0.0, 0.05, 0.0], { color: 'cream', round: 0.4 })
      .box([0.13, 0.03, 0.012], [-0.06, 0.05, 0.0], { color: 'cream', round: 0.4 })
      .box([0.06, 0.03, 0.12], [0.14, 0.045, 0.0], { color: '#9a4030', round: 0.5, name: 'slice', parent: 'board', piece: true })
      .box([0.06, 0.005, 0.12], [0.14, 0.058, 0.0], { color: '#d06a5a', round: 0.5, parent: 'slice', noInk: true })
      .rod([-0.12, 0.03, 0.1], [0.04, 0.03, 0.12], 0.01, 'darkgreen')
      .act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5))], [A.detach('slice', 'slice')], [A.reattach('slice')]] })
      .done(),
  ),
  // A straw bee skep on a wooden stand, coiled in rings with an entrance hole; bees buzz out and back.
  e('beehive', 'bugs', 'bug homes', () => {
    const b = m('beehive')
      .box([0.6, 0.04, 0.6], [0, 0.42, 0], { color: 'wood', edge: 'sharp' })
      .dome([0.55, 0.6, 0.55], [0, 0.74, 0], { color: '#d9b45a' });
    b.each(5, (i) => { const y = 0.47 + i * 0.11, dd = 0.56 * Math.sqrt(Math.max(0.05, 1 - ((y - 0.44) / 0.6) ** 2)); b.torus([dd, dd, 0.04], [0, y, 0], { color: '#c9a04a', rot: [90, 0, 0], tube: 0.12, noInk: true }); });
    for (const [x0, z] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) b.box([0.05, 0.42, 0.05], [x0, 0.21, z], { color: 'darkwood', edge: 'sharp' });
    b.box([0.1, 0.06, 0.04], [0, 0.48, 0.26], { color: '#2a2726', round: 0.6 });
    b.ball([0.02, 0.014, 0.014], [0.05, 0.6, 0.35], { color: 'yellow', name: 'bee1', piece: true }).ball([0.008, 0.016, 0.014], [0.05, 0.6, 0.35], { color: 'black', parent: 'bee1' });
    b.ball([0.02, 0.014, 0.014], [-0.1, 0.75, 0.3], { color: 'yellow', name: 'bee2', piece: true }).ball([0.008, 0.016, 0.014], [-0.1, 0.75, 0.3], { color: 'black', parent: 'bee2' });
    b.ball([0.02, 0.014, 0.014], [0.2, 0.9, 0.1], { color: 'yellow', name: 'bee3', piece: true }).ball([0.008, 0.016, 0.014], [0.2, 0.9, 0.1], { color: 'black', parent: 'bee3' });
    return b
      .act({ click: [[A.par(A.pose('bee1', { move: [0.3, 0.4, 0.2], dur: 1 }), A.pose('bee2', { move: [-0.3, 0.3, 0.3], dur: 1 }), A.pose('bee3', { move: [0.1, 0.4, 0.4], dur: 1 }), A.say('Bzzzzz!', 2)), A.par(A.pose('bee1', { move: [0, 0, 0], dur: 1 }), A.pose('bee2', { move: [0, 0, 0], dur: 1 }), A.pose('bee3', { move: [0, 0, 0], dur: 1 }))]] })
      .done();
  }),
  // A beetroot growing in a patch of soil, red-veined leaves above; it gets pulled up, and planted again.
  e('beet', 'food', 'vegetables', () => {
    const b = m('beet')
      .cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: 'dirt' })
      .ball([0.09, 0.09, 0.09], [0, 0.05, 0], { color: '#7a1f3d', name: 'root' })
      .rod([0, 0.0, 0], [0.005, -0.03, 0], 0.01, '#7a1f3d', { parent: 'root' });
    b.each(4, (i) => {
      const a = (i / 4) * Math.PI * 2;
      b.rod([0, 0.09, 0], [Math.cos(a) * 0.06, 0.2, Math.sin(a) * 0.06], 0.008, '#a02040', { parent: 'root' });
      b.ball([0.06, 0.13, 0.015], [Math.cos(a) * 0.08, 0.27, Math.sin(a) * 0.08], { color: 'darkgreen', rot: [0, -a * RAD + 90, Math.cos(a) * -20], parent: 'root' });
    });
    return b.act({ click: [[A.pose('root', { move: [0, 0.12, 0], dur: 0.5 }), A.effect('dust', { dur: 1 })], [A.pose('root', { move: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A brass handbell with a turned wooden handle; it swings and rings.
  e('bell (handbell)', 'music', 'bells', () =>
    m('bell (handbell)')
      .cyl([0.13, 0.11, 0.13], [0, 0.06, 0], { color: 'gold', taper: 0.45, name: 'bell', pivot: [0, 0.2, 0] })
      .torus([0.13, 0.13, 0.015], [0, 0.008, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.15, parent: 'bell' })
      .dome([0.06, 0.03, 0.06], [0, 0.115, 0], { color: 'gold', parent: 'bell' })
      .cyl([0.03, 0.04, 0.03], [0, 0.14, 0], { color: 'darkwood', parent: 'bell' })
      .capsule([0.04, 0.09, 0.04], [0, 0.2, 0], { color: 'darkwood', parent: 'bell' })
      .act({ click: [[A.par(A.pose('bell', { rot: [0, 0, 30], dur: 0.2 }), A.say('Ding-a-ling!', 1.5)), A.pose('bell', { rot: [0, 0, -30], dur: 0.25 }), A.pose('bell', { rot: [0, 0, 20], dur: 0.2 }), A.pose('bell', { rot: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // A brick bell tower (campanile), 20 m: a square shaft on a stone plinth with corner pilasters and stone string
  // courses, an arched door that opens, slit windows, a clock; the belfry is OPEN, four corner piers carrying round
  // arches on every side, so you see the bronze bell hanging from its oak yoke; a square spire with corner
  // pinnacles and a gilt cross on top. (The vocabulary's 5 m is a toy steeple; a campanile is this tall.)
  e('bell tower', 'places', 'towers', () => {
    const BR = '#b5654a', ST = '#d8cfbd', RF = '#5a3a30';
    const b = m('bell tower', { edge: 'sharp' })
      .box([4.4, 0.4, 4.4], [0, 0.2, 0], { color: 'stone', round: 0.05 })
      .box([3.6, 11, 3.6], [0, 5.9, 0], { color: BR, round: 0.02 });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      b.box([0.45, 11, 0.45], [x * 1.65, 5.9, z * 1.65], { color: '#a85a42', round: 0.05 });
      b.box([0.8, 2.9, 0.8], [x * 1.45, 13.1, z * 1.45], { color: BR, round: 0.03 });
      b.pyramid([0.55 * Math.SQRT2, 1.1, 0.55 * Math.SQRT2], [x * 1.78, 15.5, z * 1.78], 4, { color: RF });
    }
    for (const y of [4.4, 8.0]) b.box([3.8, 0.18, 3.8], [0, y, 0], { color: ST, round: 0.1 });
    b.box([4.0, 0.3, 4.0], [0, 11.5, 0], { color: ST, round: 0.1 })
      .box([3.8, 0.5, 3.8], [0, 14.4, 0], { color: BR, round: 0.03 })
      .box([4.1, 0.3, 4.1], [0, 14.8, 0], { color: ST, round: 0.1 })
      .pyramid([3.1 * Math.SQRT2, 4.6, 3.1 * Math.SQRT2], [0, 17.25, 0], 4, { color: RF })
      .stick([0, 19.4, 0], [0, 20.6, 0], 0.09, 'gold')
      .stick([-0.32, 20.15, 0], [0.32, 20.15, 0], 0.09, 'gold');
    // an arch on every face of the belfry, its spandrels filled up to the frieze
    for (const [x0, z, ry] of [[0, 1.75, 0], [0, -1.75, 0], [1.75, 0, 90], [-1.75, 0, 90]] as Array<[number, number, number]>) {
      b.arc([2.5, 2.5, 0.5], [x0, 13.15, z], { color: ST, rot: [0, ry, 0], tube: 0.1 });
      b.pair((s) => void b.box(ry ? [0.45, 0.3, 0.3] : [0.3, 0.3, 0.45], ry ? [x0, 14.0, s * 0.9] : [s * 0.9, 14.0, z], { color: BR, round: 0 }));
      b.box(ry ? [0.06, 1.1, 0.35] : [0.35, 1.1, 0.06], [x0 * 1.03, 6.2, z * 1.03], { color: '#2a2726' });
    }
    // the bell on its yoke, a clapper inside
    b.box([3.0, 0.22, 0.24], [0, 13.95, 0], { color: 'darkwood', round: 0.1 })
      .stick([0, 13.84, 0], [0, 13.5, 0], 0.1, 'iron', { name: 'bell', pivot: [0, 13.9, 0] })
      .cyl([1.25, 1.0, 1.25], [0, 12.95, 0], { color: 'bronze', taper: 0.58, parent: 'bell' })
      .dome([0.74, 0.3, 0.74], [0, 13.6, 0], { color: 'bronze', parent: 'bell' })
      .torus([1.3, 1.3, 0.12], [0, 12.47, 0], { color: '#9a6a2e', rot: [90, 0, 0], tube: 0.08, parent: 'bell' })
      .ball(0.22, [0, 12.35, 0], { color: 'iron', parent: 'bell' });
    // the clock
    b.cyl([1.6, 0.12, 1.6], [0, 9.8, 1.82], { color: 'white', rot: [90, 0, 0] })
      .torus([1.72, 1.72, 0.1], [0, 9.8, 1.84], { color: ST, tube: 0.07 })
      .box([0.08, 0.6, 0.04], [0, 10.0, 1.9], { color: 'black', round: 0 })
      .box([0.45, 0.08, 0.04], [0.2, 9.8, 1.9], { color: 'black', round: 0 });
    door(b, [0, 0.4, 1.82], 1.1, 2.2, { color: 'darkwood', frame: ST });
    const sw = (a: number) => A.pose('bell', { rot: [0, 0, a], dur: 0.45 });
    return b.act({ click: [[sw(35), A.say('DONG!', 1), sw(-35), A.say('DONG!', 1), sw(25), sw(0)]] }).done();
  }),
  // A brown leather belt rolled up, its brass buckle on top; the tongue clicks into place.
  // A brown leather belt (1 m long) hanging from a peg on a wooden stand, its brass buckle at the bottom; it swings
  // and the buckle clinks.
  e('belt', 'wardrobe', 'belts', () =>
    m('belt')
      .cyl([0.3, 0.03, 0.3], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, -0.06], [0, 1.15, -0.06], 0.035, 'darkwood')
      .stick([0, 1.08, -0.06], [0, 1.08, 0.04], 0.025, 'darkwood')
      .arc([0.06, 0.06, 0.035], [0, 1.065, 0.03], { color: 'leather', tube: 0.25, arc: 180, name: 'belt', pivot: [0, 1.08, 0.03] })
      .box([0.004, 0.5, 0.035], [0.027, 0.82, 0.03], { color: 'leather', round: 0.3, parent: 'belt' })
      .box([0.004, 0.42, 0.035], [-0.027, 0.86, 0.03], { color: 'leather', round: 0.3, parent: 'belt' })
      .torus([0.05, 0.06, 0.008], [0.027, 0.55, 0.03], { color: 'brass', rot: [0, 90, 0], tube: 0.18, parent: 'belt' })
      .act({ click: [[A.pose('belt', { rot: [20, 0, 0], dur: 0.3 }), A.pose('belt', { rot: [-15, 0, 0], dur: 0.3 }), A.say('Clink!', 1), A.pose('belt', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  e('beret', 'wardrobe', 'hats', () =>
    m('beret')
      .cyl([0.2, 0.03, 0.2], [0, 0.015, 0], { color: '#a3322a', name: 'beret' })
      .ball([0.26, 0.06, 0.26], [0.01, 0.045, 0], { color: 'red', parent: 'beret', rot: [0, 0, -6] })
      .cyl([0.012, 0.02, 0.012], [0.01, 0.08, 0], { color: 'red', parent: 'beret' })
      .act({ click: [[A.pose('beret', { rot: [0, 360, 0], move: [0, 0.1, 0], dur: 0.8 }), A.pose('beret', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 }), A.say('Ooh la la!', 1.2)]] })
      .done(),
  ),
  // A little bowl of mixed berries: a strawberry, raspberries and blueberries; the strawberry can be taken.
  e('berry', 'food', 'fruit', () => {
    const b = m('berry').cyl([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'white', taper: 1.35, name: 'bowl', edge: 'sharp' });
    around(6, 0.035).forEach(([x0, z], i) => b.ball(i % 2 ? 0.018 : 0.022, [x0, 0.05, z], { color: i % 2 ? '#3a4a9a' : '#c0304a' }));
    b.ball([0.035, 0.042, 0.035], [0, 0.066, 0], { color: 'red', name: 'strawberry', parent: 'bowl', piece: true })
      .cone([0.032, 0.012, 0.032], [0, 0.088, 0], { color: 'green', parent: 'strawberry', segs: 5 });
    b.each(4, (i) => b.ball(0.004, [Math.cos(i * 1.6) * 0.012, 0.06 + i * 0.005, 0.016], { color: 'yellow', noInk: true, parent: 'strawberry' }));
    return b.act({ click: [[A.detach('strawberry', 'strawberry')], [A.reattach('strawberry')]] }).done();
  }),
  // A baby's terry bib (22 cm wide) hanging by its neck snap from a little wooden peg stand: a rounded body with
  // white piping, the two neck straps arching round the neck hole to the snap, a crumb pocket along the bottom and a
  // duck on the front. Splat, a stain appears; then it is washed clean.
  e('bib', 'home', 'baby things', () => {
    const blue = '#9fd8f0';
    const b = m('bib')
      .cyl([0.13, 0.016, 0.1], [0, 0.008, -0.02], { color: 'lightwood', edge: 'sharp' })
      .stick([0, 0.016, -0.03], [0, 0.31, -0.03], 0.014, 'lightwood', { edge: 'sharp' })
      .rod([0, 0.296, -0.03], [0, 0.3, 0.025], 0.012, 'lightwood', { edge: 'sharp' })
      // the body, its piping and the neck straps round the hole
      .ball([0.21, 0.18, 0.012], [0, 0.13, 0.012], { color: blue, name: 'body' })
      .torus([0.215, 0.185, 0.014], [0, 0.13, 0.012], { color: 'white', tube: 0.05 })
      .arc([0.16, 0.16, 0.012], [0, 0.222, 0.012], { color: blue, arc: 236, tube: 0.22 })
      .ball([0.018, 0.018, 0.01], [0, 0.293, 0.02], { color: 'white', edge: 'sharp' })
      // crumb pocket along the bottom
      .ball([0.17, 0.06, 0.016], [0, 0.07, 0.018], { color: '#7cc6e6' })
      .box([0.15, 0.006, 0.004], [0, 0.098, 0.026], { color: 'white', round: 0.5, noInk: true })
      // the duck
      .ball([0.065, 0.042, 0.006], [0.0, 0.135, 0.02], { color: 'yellow', noInk: true })
      .ball([0.034, 0.034, 0.006], [0.028, 0.165, 0.021], { color: 'yellow', noInk: true })
      .ball([0.02, 0.01, 0.005], [0.05, 0.162, 0.023], { color: 'orange', noInk: true })
      .ball(0.006, [0.032, 0.17, 0.025], { color: 'black', noInk: true })
      .ball([0.05, 0.04, 0.006], [-0.045, 0.165, 0.022], { color: '#e07a2e', noInk: true, name: 'stain', scale: 0.4, piece: true });
    return b.act({ click: [[A.pose('stain', { scale: 1.4, dur: 0.15 }), A.say('Splat!', 1)], [A.pose('stain', { scale: 0.05, dur: 0.6 }), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A city bicycle at real size (1.75 m long, wheels 0.7 m): a diamond frame, spoked wheels, saddle,
  // handlebars with a bell, chain and pedals. The pedals turn and the wheels spin.
  e('bicycle', 'garage', 'bikes', () => {
    const F = 'red';
    const b = m('bicycle', { view: 'side' });
    const wheel = (name: string, z: number) => {
      b.torus([0.7, 0.7, 0.045], [0, 0.35, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.08, name, edge: 'soft' })
        .torus([0.62, 0.62, 0.02], [0, 0.35, z], { color: 'silver', rot: [0, 90, 0], tube: 0.04, parent: name })
        .cyl([0.06, 0.1, 0.06], [0, 0.35, z], { color: 'silver', rot: [0, 0, 90], parent: name });
      b.each(6, (i) => b.box([0.006, 0.6, 0.006], [0, 0.35, z], { color: 'silver', rot: [i * 30, 0, 0], parent: name, noInk: true }));
    };
    wheel('wheelF', 0.55);
    wheel('wheelB', -0.5);
    b.rod([0, 0.35, -0.5], [0, 0.32, 0.02], 0.03, F) // chain stay
      .rod([0, 0.32, 0.02], [0, 0.85, -0.12], 0.035, F) // seat tube
      .rod([0, 0.35, -0.5], [0, 0.85, -0.12], 0.025, F) // seat stay
      .rod([0, 0.32, 0.02], [0, 0.8, 0.42], 0.04, F) // down tube
      .rod([0, 0.85, -0.12], [0, 0.83, 0.42], 0.035, F) // top tube
      .rod([0, 0.95, 0.4], [0, 0.35, 0.55], 0.03, 'silver') // fork
      .rod([0, 0.85, -0.12], [0, 0.95, -0.16], 0.025, 'silver')
      .box([0.14, 0.05, 0.24], [0, 0.98, -0.17], { color: '#2a2726', round: 0.7 })
      .stick([0, 0.95, 0.4], [0, 1.03, 0.38], 0.03, 'silver')
      .stick([-0.28, 1.03, 0.36], [0.28, 1.03, 0.36], 0.025, 'silver')
      .capsule([0.035, 0.1, 0.035], [0.3, 1.03, 0.36], { color: '#2a2726', rot: [0, 0, 90] })
      .capsule([0.035, 0.1, 0.035], [-0.3, 1.03, 0.36], { color: '#2a2726', rot: [0, 0, 90] })
      .dome([0.05, 0.03, 0.05], [0.15, 1.05, 0.36], { color: 'silver' })
      .torus([0.32, 0.12, 0.012], [0.04, 0.33, -0.24], { color: '#3a3633', rot: [0, 90, 0], tube: 0.08, noInk: true })
      .cyl([0.16, 0.02, 0.16], [0.05, 0.32, 0.02], { color: 'silver', rot: [0, 0, 90], name: 'crank', pivot: [0.05, 0.32, 0.02], mover: { kind: 'spin', axis: 'x', amount: 360 } })
      .stick([0.07, 0.32, 0.02], [0.07, 0.15, 0.02], 0.02, 'silver', { parent: 'crank' })
      .box([0.1, 0.02, 0.05], [0.11, 0.15, 0.02], { color: '#2a2726', parent: 'crank' })
      .socket('seat', [0, 1.0, -0.17], 'seat');
    return b
      .act({ click: [[A.operate('crank', 'on'), A.par(A.pose('wheelF', { spin: [400, 0, 0] }), A.pose('wheelB', { spin: [400, 0, 0] }), A.say('Ring ring!', 1.5)), A.wait(2.5), A.operate('crank', 'off'), A.pose('wheelF', { spin: [0, 0, 0], rot: [0, 0, 0] }), A.pose('wheelB', { spin: [0, 0, 0], rot: [0, 0, 0] })]] })
      .done();
  }),
  // A bicycle bulb horn clamped to a bit of handlebar: a red rubber bulb and a brass trumpet; squeeze, honk.
  e('bicycle horn', 'garage', 'bike parts', () =>
    m('bicycle horn')
      .stick([-0.08, 0.05, 0], [0.08, 0.05, 0], 0.025, 'silver')
      .box([0.03, 0.04, 0.04], [0, 0.05, 0], { color: 'darkgray', edge: 'sharp' })
      .ball([0.06, 0.07, 0.06], [0, 0.09, -0.06], { color: 'red', name: 'bulb' })
      .cyl([0.025, 0.12, 0.025], [0, 0.08, 0.04], { color: 'brass', rot: [80, 0, 0], taper: 2.4 })
      .cyl([0.06, 0.01, 0.06], [0, 0.07, 0.1], { color: 'brass', rot: [80, 0, 0] })
      .act({ click: [[A.pose('bulb', { scale: 0.7, dur: 0.1 }), A.say('Honk!', 0.8), A.pose('bulb', { scale: 1, dur: 0.15 }), A.pose('bulb', { scale: 0.7, dur: 0.1 }), A.say('Honk!', 0.8), A.pose('bulb', { scale: 1, dur: 0.15 })]] })
      .done(),
  ),
  // An anatomy model of a foot on a stand, with its big toe, which wiggles.
  e('big toe', 'clinic', 'body parts', () => {
    const b = m('big toe')
      .box([0.16, 0.02, 0.3], [0, 0.01, 0.0], { color: 'darkwood', edge: 'sharp' })
      .box([0.1, 0.07, 0.22], [0, 0.055, 0.0], { color: 'skin2', round: 0.9 })
      .ball([0.09, 0.08, 0.08], [0, 0.06, -0.09], { color: 'skin2' })
      .capsule([0.08, 0.12, 0.08], [0, 0.14, -0.08], { color: 'skin2' })
      .ball([0.036, 0.034, 0.05], [0.03, 0.04, 0.125], { color: 'skin2', name: 'toe', pivot: [0.03, 0.04, 0.1], piece: true })
      .ball([0.024, 0.008, 0.02], [0.03, 0.058, 0.135], { color: '#f8e0d0', parent: 'toe', noInk: true });
    b.each(4, (i) => b.ball(0.022 - i * 0.002, [-0.005 - i * 0.017, 0.035, 0.12 - i * 0.008], { color: 'skin2' }));
    return b.act({ click: [[A.pose('toe', { rot: [-30, 0, 0], dur: 0.2 }), A.pose('toe', { rot: [15, 0, 0], dur: 0.2 }), A.pose('toe', { rot: [-30, 0, 0], dur: 0.2 }), A.pose('toe', { rot: [0, 0, 0], dur: 0.2 }), A.say('Wiggle!', 1)]] }).done();
  }),
  // A vented cycling helmet with straps and buckle, and a peak that flips up and down.
  e('bike helmet', 'sports', 'helmets', () => {
    const b = m('bike helmet')
      .dome([0.22, 0.17, 0.3], [0, 0.125, 0], { color: 'lime' })
      .cyl([0.225, 0.03, 0.305], [0, 0.03, 0], { color: '#2a2726' })
      .box([0.16, 0.012, 0.06], [0, 0.07, 0.16], { color: '#2a2726', round: 0.4, rot: [-15, 0, 0], name: 'visor', pivot: [0, 0.08, 0.13], mover: { kind: 'swing', axis: 'x', amount: -35 } });
    b.each(3, (i) => b.box([0.03, 0.02, 0.14], [-0.05 + i * 0.05, 0.2, 0.0], { color: '#2a2726', round: 0.6, noInk: true }));
    b.pair((s) => b.rod([s * 0.1, 0.03, 0.02], [s * 0.05, 0.005, 0.08], 0.01, '#2a2726'));
    return b.act({ click: [[A.operate('visor', 'open')], [A.operate('visor', 'close'), A.say('Click!', 1)]] }).done();
  }),
  // A galvanised bike rack (2.4 m) of five hoops on a rail; a bicycle gets parked and locked.
  e('bike rack', 'places', 'street things', () => {
    const b = m('bike rack', { edge: 'sharp' })
      .box([2.6, 0.06, 0.5], [0, 0.03, 0], { color: 'stone' })
      .stick([-1.2, 0.08, 0], [1.2, 0.08, 0], 0.05, 'silver');
    b.each(5, (i) => b.arc([0.5, 0.75, 0.05], [-1.0 + i * 0.5, 0.45, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.1, arc: 180 }).stick([-1.0 + i * 0.5, 0.06, -0.2], [-1.0 + i * 0.5, 0.45, -0.2], 0.05, 'silver').stick([-1.0 + i * 0.5, 0.06, 0.2], [-1.0 + i * 0.5, 0.45, 0.2], 0.05, 'silver'));
    return b
      .socket('park', [0.1, 0, 0], 'inside', { size: 2 })
      .act({ click: [[A.spawn('bk', 'bicycle'), A.attach('bk', 'self', 'park'), A.say('Click! Locked.', 1.5)], [A.remove('self.park', 'fade')]] })
      .done();
  }),
  // A red polka-dot bikini on a dress form; it splashes.
  e('bikini', 'wardrobe', 'swimwear', () => {
    const b = mannequin('bikini')
      .box([0.35, 0.1, 0.23], [0, 0.98, 0], { color: 'red', round: 0.7 })
      .box([0.37, 0.02, 0.25], [0, 1.31, 0], { color: 'red', round: 0.5 });
    b.pair((s) => b.ball([0.13, 0.1, 0.06], [s * 0.075, 1.34, 0.1], { color: 'red' }).rod([s * 0.075, 1.38, 0.1], [s * 0.04, 1.55, 0.02], 0.01, 'red'));
    b.each(6, (i) => b.ball(0.02, [-0.12 + (i % 3) * 0.12, 0.96 + Math.floor(i / 3) * 0.38, 0.13], { color: 'white', noInk: true }));
    return b.act({ click: [[A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Splash!', 1.2))]] }).done();
  }),
  // A $100 banknote propped on a little stack of notes with a paper band; it flutters.
  e('bill (paper)', 'ideas', 'money', () =>
    m('bill (paper)')
      .box([0.16, 0.025, 0.068], [0, 0.0125, 0], { color: '#8db88a', round: 0.1 })
      .box([0.035, 0.027, 0.07], [0, 0.0135, 0], { color: 'cream', round: 0.1 })
      .box([0.16, 0.068, 0.003], [0, 0.06, 0.03], { color: '#a8d0a2', rot: [-15, 0, 0], round: 0, name: 'note', pivot: [0, 0.026, 0.03] })
      .label('$100', [0.04, 0.02], [0.05, 0.075, 0.036], { color: '#a8d0a2', rot: [-15, 0, 0], depth: 0.001, parent: 'note' })
      .ball([0.03, 0.04, 0.004], [-0.03, 0.06, 0.034], { color: '#5f8f5c', rot: [-15, 0, 0], noInk: true, parent: 'note' })
      .act({ click: [[A.pose('note', { rot: [-25, 0, 0], dur: 0.15 }), A.pose('note', { rot: [15, 0, 0], dur: 0.15 }), A.pose('note', { rot: [0, 0, 0], dur: 0.15 }), A.say('Ka-ching!', 1.2)]] })
      .done(),
  ),
  // A roadside billboard, 9 m tall: a framed 10 m panel on two steel legs with a catwalk and lamps; the lamps
  // switch on, and the advert flips to the next one.
  e('billboard', 'places', 'street things', () => {
    const b = m('billboard', { edge: 'sharp' });
    b.pair((s) => b.stick([s * 3, 0, -0.3], [s * 3, 5.5, -0.3], 0.5, 'gray').box([1.2, 0.4, 1.2], [s * 3, 0.2, -0.3], { color: 'stone' }));
    b.box([10.4, 3.6, 0.3], [0, 7.2, -0.25], { color: '#3a3633', round: 0.05 })
      .box([10, 3.2, 0.1], [0, 7.2, 0.0], { color: 'yellow', name: 'ad', pivot: [0, 7.2, -0.05] })
      .label("EAT AT JOE'S", [6, 1.0], [-1.2, 7.6, 0.06], { color: 'yellow', parent: 'ad', depth: 0.03 })
      .ball([1.6, 0.9, 0.12], [3.3, 7.2, 0.1], { color: 'bread', parent: 'ad' })
      .box([1.7, 0.25, 0.12], [3.3, 7.1, 0.12], { color: 'meat', parent: 'ad' })
      .label('DRINK FIZZ!', [6, 1.0], [0, 7.2, -0.16], { color: 'red', rot: [0, 180, 0], parent: 'ad', depth: 0.03 })
      .box([10.4, 0.1, 0.9], [0, 5.35, 0.3], { color: 'gray' })
      .stick([-5.2, 5.9, 0.75], [5.2, 5.9, 0.75], 0.04, 'gray');
    b.each(4, (i) => b.rod([-3.9 + i * 2.6, 5.4, 0.2], [-3.9 + i * 2.6, 5.8, 1.0], 0.06, 'darkgray').cone([0.4, 0.3, 0.3], [-3.9 + i * 2.6, 5.9, 1.05], { color: '#fff6c8', glow: true, rot: [-120, 0, 0], name: `lamp${i}`, mover: { kind: 'light' } }));
    return b.act({ click: [[A.operate('lamp', 'on')], [A.pose('ad', { rot: [0, 180, 0], dur: 1.2 }), A.wait(1.5), A.pose('ad', { rot: [0, 0, 0], dur: 1.2 }), A.operate('lamp', 'off')]] }).done();
  }),
  // A blue ring binder standing on its spine end; the cover swings open on the rings and papers.
  e('binder', 'study', 'office supplies', () => {
    const b = m('binder', { edge: 'sharp' })
      .box([0.24, 0.31, 0.006], [0, 0.155, -0.03], { color: 'blue', round: 0.2 })
      .box([0.012, 0.31, 0.06], [-0.12, 0.155, 0], { color: 'navy', round: 0.3 })
      .box([0.22, 0.29, 0.03], [0.005, 0.155, -0.008], { color: 'paper', round: 0.05 })
      .box([0.24, 0.31, 0.006], [0, 0.155, 0.03], { color: 'blue', round: 0.2, name: 'cover', pivot: [-0.12, 0.155, 0.03], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .box([0.12, 0.06, 0.003], [0.02, 0.22, 0.034], { color: 'white', round: 0.2, parent: 'cover' })
      .cyl([0.02, 0.005, 0.02], [-0.1, 0.06, -0.012], { color: '#2a2726', rot: [0, 0, 90] });
    b.each(3, (i) => b.torus([0.03, 0.03, 0.005], [-0.1, 0.06 + i * 0.09, 0.0], { color: 'silver', rot: [0, 90, 0], tube: 0.2 }));
    return b.act({ click: [[A.operate('cover', 'open'), A.say('Clack!', 1)], [A.operate('cover', 'close')]] }).done();
  }),
  // A pair of binoculars on a little tripod, with a neck strap and a focus wheel; they scan the horizon.
  e('binoculars', 'sports', 'outdoor gear', () => {
    const b = m('binoculars')
      .stick([0, 0, 0], [0, 0.14, 0], 0.012, '#2a2726')
      .box([0.03, 0.02, 0.03], [0, 0.15, 0], { color: '#2a2726', name: 'binos', edge: 'sharp' });
    b.pair((s) => {
      b.cyl([0.05, 0.12, 0.05], [s * 0.035, 0.18, 0.0], { color: '#2a2726', rot: [90, 0, 0], parent: 'binos' });
      b.cyl([0.06, 0.04, 0.06], [s * 0.035, 0.18, 0.07], { color: '#3a3633', rot: [90, 0, 0], parent: 'binos' });
      b.cyl([0.045, 0.004, 0.045], [s * 0.035, 0.18, 0.091], { color: GL, rot: [90, 0, 0], parent: 'binos' });
      b.rod([s * 0.06, 0.17, -0.03], [s * 0.08, 0.08, 0.0], 0.006, '#2a2726', { parent: 'binos' });
      b.rod([0, 0.0, 0], [s * 0.08, 0.005, 0.05], 0.01, '#2a2726').rod([0, 0.0, 0], [0, 0.005, -0.09], 0.01, '#2a2726');
    });
    b.cyl([0.018, 0.02, 0.018], [0, 0.2, -0.02], { color: 'gray', rot: [0, 0, 90], parent: 'binos' });
    return b.act({ click: [[A.pose('binos', { rot: [0, 35, 0], dur: 0.8 }), A.pose('binos', { rot: [0, -35, 0], dur: 1.2 }), A.pose('binos', { rot: [0, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 0.6 })]] }).done();
  }),
  // A yellow biohazard warning sign on a stand, the black trefoil symbol, and a warning lamp that flashes.
  e('biohazard sign', 'ideas', 'signs', () => {
    const b = m('biohazard sign', { edge: 'sharp' })
      .box([0.24, 0.02, 0.16], [0, 0.01, 0], { color: '#3a3633' })
      .stick([0, 0.02, 0], [0, 0.12, 0], 0.02, '#3a3633')
      .cone([0.36, 0.32, 0.02], [0, 0.29, 0], { color: 'yellow', segs: 3 })
      .cone([0.39, 0.345, 0.018], [0, 0.29, -0.003], { color: '#2a2726', segs: 3 })
      .torus([0.07, 0.07, 0.006], [0, 0.27, 0.012], { color: '#2a2726', tube: 0.18 })
      .ball([0.024, 0.024, 0.006], [0, 0.27, 0.013], { color: '#2a2726' })
      .dome([0.05, 0.04, 0.05], [0, 0.47, 0], { color: 'orange', glow: true, name: 'lamp', mover: { kind: 'light' } });
    for (const a of [0, 120, 240]) {
      const r = (a + 90) / RAD;
      b.arc([0.06, 0.06, 0.006], [Math.cos(r) * 0.04, 0.27 + Math.sin(r) * 0.04, 0.013], { color: '#2a2726', arc: 250, tube: 0.2, rot: [0, 0, a + 180] });
    }
    return b.act({ click: [[A.operate('lamp', 'on'), A.wait(0.4), A.operate('lamp', 'off'), A.wait(0.3), A.operate('lamp', 'on'), A.say('Warning!', 1.5), A.wait(0.8), A.operate('lamp', 'off')]] }).done();
  }),
  // A biplane at real size (7 m long, 9 m span, 2.7 m tall): a lofted red fuselage with an open cockpit and
  // windscreen, two yellow wings joined by struts and bracing wires, the tailplane and fin, the engine cowling,
  // and a propeller that starts up.
  e('biplane', 'garage', 'aircraft', () => {
    const b = m('biplane', { view: 'side' })
      .loft([1.0, 1.25, 6.8], [0, 1.6, 0], [[0, 0.12, 0.3, 0.18], [0.35, 0.8, 0.85, 0.03], [0.8, 1, 1, 0], [0.95, 0.98, 0.95, 0], [1, 0.85, 0.85, 0]], { color: '#e0473b', name: 'fuselage' })
      .cyl([1.1, 0.5, 1.1], [0, 1.6, 3.15], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' })
      .box([9, 0.12, 1.5], [0, 2.8, 1.2], { color: '#f6d24a', edge: 'sharp', round: 0.4 })
      .box([8.2, 0.12, 1.4], [0, 1.08, 1.3], { color: '#f6d24a', edge: 'sharp', round: 0.4 })
      .cyl([0.6, 0.12, 0.7], [0, 2.18, -0.3], { color: '#2a2726' })
      .box([0.6, 0.3, 0.05], [0, 2.3, 0.1], { color: GL, rot: [-25, 0, 0], edge: 'sharp' })
      .wedge([1.1, 1.1, 0.1], [0, 2.4, -2.95], { color: '#e0473b', rot: [0, 90, 0], apex: 0.4, edge: 'sharp' })
      .box([2.6, 0.08, 0.8], [0, 1.85, -3.0], { color: '#f6d24a', edge: 'sharp' })
      .ball(0.42, [0, 1.6, 3.42], { color: '#3a3633', name: 'hub' })
      .box([0.16, 2.2, 0.08], [0, 1.6, 3.55], { color: 'darkwood', name: 'propeller', pivot: [0, 1.6, 3.55], mover: { kind: 'spin', axis: 'z', amount: 900 }, edge: 'sharp' })
      .socket('pilot', [0, 1.9, -0.3], 'seat');
    b.pair((s) => {
      b.rod([s * 2.8, 1.12, 1.3], [s * 2.8, 2.76, 1.2], 0.06, 'darkwood').rod([s * 2.8, 1.12, 0.7], [s * 2.8, 2.76, 0.6], 0.06, 'darkwood');
      b.stick([s * 2.8, 1.12, 1.0], [s * 0.4, 2.76, 0.9], 0.015, 'gray');
      b.rod([s * 0.4, 1.12, 1.4], [s * 0.4, 2.76, 1.3], 0.05, 'darkwood');
      b.rod([s * 0.55, 0.45, 1.7], [s * 0.35, 1.1, 1.5], 0.06, 'gray');
      tyre(b, s > 0 ? 'wheelL' : 'wheelR', [s * 0.62, 0.32, 1.7], 0.64, 0.14, { hub: 'silver' });
    });
    b.ball([0.15, 0.15, 0.15], [0, 1.2, -3.2], { color: 'rubber' });
    return b.act({ click: [[A.operate('propeller', 'on'), A.par(A.say('Vrrrrm!', 2), A.effect('smoke', { dur: 1 }))], [A.operate('propeller', 'off'), A.say('Phut phut...', 1.5)]] }).done();
  }),
  // A silver birch, 12 m: a slender white trunk with black marks, a light airy crown; a strip of its papery bark
  // peels away.
  e('birch tree', 'garden', 'trees', () => {
    const b = tree2('birch tree', 12, { trunk: '#f2efe8', marks: '#2a2726', crown: '#8cc152', crown2: '#a0d468', tall: true, w: 0.45, tk: 0.03 });
    b.box([0.18, 0.5, 0.03], [0.05, 2.5, 0.27], { color: '#fbfaf5', round: 0.4, name: 'strip', parent: 'trunk', piece: true });
    return b.act({ click: [[A.detach('strip', 'bark')], [A.reattach('strip')]] }).done();
  }),
  // A brass bird cage with a domed top, a swing perch and a canary; the little door opens and the bird hops out
  // to sing, then back in.
  e('bird cage', 'pets', 'pet supplies', () => {
    const b = m('bird cage', { edge: 'sharp' })
      .cyl([0.42, 0.05, 0.42], [0, 0.025, 0], { color: 'brass' })
      .dome([0.4, 0.2, 0.4], [0, 0.55, 0], { color: 'brass', edge: 'soft' })
      .torus([0.06, 0.06, 0.012], [0, 0.68, 0], { color: 'brass', tube: 0.2 })
      .stick([-0.14, 0.2, 0], [0.14, 0.2, 0], 0.012, 'darkwood')
      .ball([0.06, 0.06, 0.08], [0, 0.25, 0], { color: 'yellow', name: 'bird', piece: true, edge: 'soft' })
      .cone([0.015, 0.02, 0.015], [0, 0.26, 0.05], { color: 'orange', rot: [90, 0, 0], parent: 'bird' })
      .box([0.12, 0.18, 0.01], [0.0, 0.15, 0.2], { color: 'brass', name: 'door', pivot: [-0.06, 0.15, 0.2], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    around(14, 0.2).forEach(([x0, z]) => b.stick([x0, 0.05, z], [x0, 0.46, z], 0.006, 'brass'));
    b.torus([0.4, 0.4, 0.015], [0, 0.3, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.05 });
    return b
      .act({ click: [[A.operate('door', 'open'), A.pose('bird', { move: [0, -0.05, 0.25], dur: 0.6 }), A.say('Tweet tweet!', 1.5), A.wait(1), A.pose('bird', { move: [0, 0, 0], dur: 0.6 }), A.operate('door', 'close')]] })
      .done();
  }),
  // A stone birdbath (0.8 m): a fluted pedestal and a wide bowl of water with a sparrow on the rim, which splashes.
  e('birdbath', 'garden', 'garden decor', () =>
    m('birdbath')
      .cyl([0.4, 0.08, 0.4], [0, 0.04, 0], { color: 'stone', edge: 'sharp', segs: 8 })
      .cyl([0.16, 0.55, 0.16], [0, 0.35, 0], { color: 'stone', taper: 0.8, segs: 8 })
      .cyl([0.62, 0.12, 0.62], [0, 0.68, 0], { color: 'stone', taper: 1.25 })
      .cyl([0.56, 0.03, 0.56], [0, 0.74, 0], { color: 'water', edge: 'sharp' })
      .ball([0.06, 0.06, 0.09], [0.24, 0.79, 0.12], { color: '#8a6440', name: 'sparrow', piece: true })
      .ball(0.04, [0.24, 0.84, 0.16], { color: '#8a6440', parent: 'sparrow' })
      .cone([0.012, 0.02, 0.012], [0.24, 0.84, 0.19], { color: 'darkgray', rot: [90, 0, 0], parent: 'sparrow' })
      .act({ click: [[A.pose('sparrow', { move: [-0.1, -0.03, -0.05], dur: 0.3 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Chirp! Splash!', 1.5)), A.pose('sparrow', { move: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A wooden birdhouse on a pole (1.7 m): a pitched roof, a round entrance hole with a perch; a bird pops out.
  e('birdhouse', 'garden', 'garden decor', () =>
    m('birdhouse', { edge: 'sharp' })
      .stick([0, 0, 0], [0, 1.15, 0], 0.07, 'darkwood')
      .box([0.24, 0.3, 0.22], [0, 1.28, 0], { color: 'lightwood' })
      .box([0.2, 0.025, 0.3], [0.08, 1.48, 0], { color: 'red', rot: [0, 0, -35] })
      .box([0.2, 0.025, 0.3], [-0.08, 1.48, 0], { color: 'red', rot: [0, 0, 35] })
      .wedge([0.24, 0.12, 0.2], [0, 1.49, 0], { color: 'lightwood' })
      .cyl([0.06, 0.01, 0.06], [0, 1.33, 0.11], { color: '#2a2726', rot: [90, 0, 0] })
      .stick([0, 1.25, 0.11], [0, 1.25, 0.17], 0.012, 'darkwood')
      .ball([0.05, 0.05, 0.06], [0, 1.33, 0.06], { color: 'blue', name: 'bird', piece: true, edge: 'soft' })
      .cone([0.012, 0.02, 0.012], [0, 1.33, 0.095], { color: 'orange', rot: [90, 0, 0], parent: 'bird' })
      .act({ click: [[A.pose('bird', { move: [0, 0, 0.06], dur: 0.3 }), A.say('Tweet tweet!', 1.5), A.wait(1), A.pose('bird', { move: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A two-tier birthday cake with pink icing, sprinkles and lit candles: blow them out, then light them again.
  e('birthday cake', 'food', 'cakes', () => {
    const b = m('birthday cake')
      .cyl([0.34, 0.015, 0.34], [0, 0.0075, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.28, 0.1, 0.28], [0, 0.065, 0], { color: 'pink' })
      .torus([0.29, 0.29, 0.02], [0, 0.115, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08 })
      .cyl([0.18, 0.08, 0.18], [0, 0.155, 0], { color: 'pink' })
      .torus([0.19, 0.19, 0.02], [0, 0.195, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08 });
    around(10, 0.12).forEach(([x0, z], i) => b.ball(0.012, [x0, 0.09, z], { color: RAINBOW[i % 6], noInk: true }));
    around(5, 0.055).forEach(([x0, z], i) => {
      b.cyl([0.01, 0.06, 0.01], [x0, 0.225, z], { color: i % 2 ? 'skyblue' : 'yellow' });
      b.ball([0.012, 0.022, 0.012], [x0, 0.266, z], { color: 'flame', glow: true, name: `flame${i}`, mover: { kind: 'light', on: true } });
    });
    return b.act({ click: [[A.operate('flame', 'off'), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Happy birthday!', 2))], [A.operate('flame', 'on'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A spiral-striped birthday candle in a little holder, lit; it gets blown out and relit.
  e('birthday candle', 'toys', 'party', () =>
    m('birthday candle')
      .cyl([0.05, 0.012, 0.05], [0, 0.006, 0], { color: 'pink', edge: 'sharp' })
      .cyl([0.012, 0.08, 0.012], [0, 0.052, 0], { color: 'white' })
      .torus([0.014, 0.014, 0.004], [0, 0.04, 0], { color: 'blue', rot: [80, 0, 0], tube: 0.25, noInk: true })
      .torus([0.014, 0.014, 0.004], [0, 0.065, 0], { color: 'blue', rot: [80, 0, 0], tube: 0.25, noInk: true })
      .stick([0, 0.092, 0], [0, 0.1, 0], 0.002, 'black')
      .ball([0.012, 0.024, 0.012], [0, 0.112, 0], { color: 'flame', glow: true, name: 'flame', mover: { kind: 'light', on: true } })
      .act({ click: [[A.operate('flame', 'off'), A.effect('smoke', { dur: 1.2 }), A.say('Whoosh!', 1)], [A.operate('flame', 'on')]] })
      .done(),
  ),
  // Chocolate-chip biscuits on a little plate (7 cm each); one is taken with a crunch.
  e('biscuit', 'food', 'baked goods', () => {
    const b = plate(m('biscuit'), 0.18);
    b.cyl([0.07, 0.012, 0.07], [-0.03, 0.024, 0.0], { color: '#c98a45', name: 'stack' })
      .cyl([0.07, 0.012, 0.07], [0.035, 0.024, 0.02], { color: '#c98a45' })
      .cyl([0.07, 0.012, 0.07], [0.0, 0.037, 0.01], { color: '#d29a55', rot: [8, 0, 5], name: 'biscuit', parent: 'stack', piece: true });
    b.each(5, (i) => b.ball(0.01, [Math.cos(i * 1.3) * 0.02, 0.044, 0.01 + Math.sin(i * 1.3) * 0.02], { color: 'chocolate', noInk: true, parent: 'biscuit' }));
    return b.act({ click: [[A.detach('biscuit', 'biscuit'), A.say('Crunch!', 1)], [A.reattach('biscuit')]] }).done();
  }),
  // An old black-and-white photograph in a black frame on its easel back: a landscape with a mountain and sun.
  e('black and white photo', 'home', 'decor', () =>
    m('black and white photo', { edge: 'sharp' })
      .box([0.22, 0.17, 0.02], [0, 0.09, 0], { color: 'black', round: 0.1 })
      .box([0.18, 0.13, 0.022], [0, 0.09, 0.002], { color: 'lightgray', round: 0 })
      .box([0.18, 0.03, 0.024], [0, 0.04, 0.003], { color: 'darkgray', round: 0 })
      .wedge([0.12, 0.07, 0.024], [-0.02, 0.09, 0.003], { color: 'gray' })
      .ball([0.03, 0.03, 0.01], [0.05, 0.125, 0.013], { color: 'white', noInk: true })
      .rod([0, 0.11, -0.01], [0, 0.005, -0.08], 0.012, 'black')
      .act({ click: [[A.par(A.effect('sparkle', { dur: 0.6 }), A.say('Click! Say cheese!', 1.5))]] })
      .done(),
  ),
  // A karate gi on a dress form, tied with a black belt; its ends flick as it shouts.
  e('black belt', 'sports', 'martial arts', () => {
    const b = mannequin('black belt')
      .box([0.42, 0.56, 0.27], [0, 1.25, 0], { color: 'white', round: 0.85 })
      .box([0.42, 0.16, 0.26], [0, 0.94, 0], { color: 'white', round: 0.85 })
      .torus([0.42, 0.28, 0.06], [0, 1.0, 0], { color: 'black', rot: [90, 0, 0], tube: 0.08 })
      .ball([0.06, 0.05, 0.04], [0, 1.0, 0.145], { color: 'black', name: 'knot' })
      .box([0.04, 0.22, 0.01], [0.03, 0.88, 0.15], { color: 'black', rot: [0, 0, 12], round: 0.3, parent: 'knot' })
      .box([0.04, 0.22, 0.01], [-0.03, 0.88, 0.15], { color: 'black', rot: [0, 0, -12], round: 0.3, parent: 'knot' });
    b.pair((s) => b.rod([s * 0.1, 1.5, 0.08], [s * -0.04, 1.08, 0.135], 0.03, 'wool').capsule([0.13, 0.32, 0.13], [s * 0.25, 1.33, 0], { color: 'white', rot: [0, 0, s * 25] }));
    return b.act({ click: [[A.par(A.pose('knot', { rot: [-30, 0, 0], dur: 0.15 }), A.say('Hi-yah!', 1.2)), A.pose('knot', { rot: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // An anatomy model of the bladder on its stand, the two ureters coming down; it fills up and empties.
  e('bladder', 'clinic', 'organs', () => {
    const b = m('bladder')
      .box([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'white', round: 0.3, edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.06, 0], 0.02, '#d98080')
      .cone([0.06, 0.04, 0.05], [0, 0.07, 0], { color: '#e8a0a0', rot: [180, 0, 0] })
      .ball([0.13, 0.12, 0.1], [0, 0.14, 0], { color: '#e8a0a0', name: 'bag', pivot: [0, 0.09, 0] });
    b.pair((s) => b.rod([s * 0.04, 0.18, 0], [s * 0.09, 0.23, 0], 0.014, '#d98080').rod([s * 0.09, 0.23, 0], [s * 0.1, 0.31, 0], 0.014, '#d98080'));
    return b.act({ click: [[A.pose('bag', { scale: 1.3, dur: 1.2 })], [A.pose('bag', { scale: 1, dur: 0.8 }), A.say('Phew!', 1)]] }).done();
  }),
  // A folded red tartan blanket with a fringe; so cosy it glows with hearts.
  e('blanket', 'home', 'bedding', () => {
    const b = m('blanket')
      .box([0.55, 0.07, 0.38], [0, 0.035, 0], { color: 'red', round: 0.6 })
      .box([0.55, 0.07, 0.38], [0, 0.105, 0], { color: 'red', round: 0.6, name: 'top' });
    b.each(3, (i) => b.box([0.04, 0.142, 0.385], [-0.18 + i * 0.18, 0.07, 0], { color: 'darkgreen', noInk: true, round: 0.3 }));
    b.box([0.555, 0.03, 0.385], [0, 0.1, 0], { color: 'cream', noInk: true, round: 0.3 });
    b.each(6, (i) => b.rod([-0.24 + i * 0.096, 0.03, 0.19], [-0.24 + i * 0.096, 0.005, 0.22], 0.012, 'cream'));
    return b.act({ click: [[A.par(A.anim('pulse'), A.effect('hearts', { dur: 1.5 }), A.say('So cosy!', 1.5))]] }).done();
  }),
  // A jug of bleach with a handle and a blue child-proof cap; it sparkles everything clean.
  e('bleach', 'home', 'cleaning', () =>
    m('bleach')
      .box([0.16, 0.26, 0.1], [0, 0.13, 0], { color: 'white', round: 0.4, name: 'jug' })
      .arc([0.09, 0.08, 0.035], [-0.035, 0.26, 0], { color: 'white', tube: 0.3 })
      .cyl([0.045, 0.04, 0.045], [0.045, 0.28, 0], { color: 'blue', name: 'cap', parent: 'jug', piece: true, edge: 'sharp' })
      .label('BLEACH', [0.12, 0.08], [0, 0.12, 0.051], { color: 'blue', depth: 0.003 })
      .act({ click: [[A.pose('cap', { move: [0, 0.04, 0], rot: [0, 300, 0], dur: 0.5 }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Squeaky clean!', 1.5)), A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // Aluminium bleachers, 6 m wide and 2.6 m tall: five rows of plank seats on a steel frame, stairs and back
  // railings; the crowd stomps and cheers.
  e('bleachers', 'sports', 'stadium', () => {
    const b = m('bleachers', { edge: 'sharp' });
    b.each(5, (i) => {
      const y = 0.42 + i * 0.42, z = 1.2 - i * 0.6;
      b.box([6, 0.06, 0.32], [0, y, z], { color: 'silver', round: 0.3 }).box([6, 0.05, 0.28], [0, y - 0.22, z - 0.3], { color: '#c9ccd1', round: 0.3 });
      b.pair((s) => b.stick([s * 2.9, 0, z], [s * 2.9, y, z], 0.06, 'gray'));
    });
    b.box([0.8, 0.05, 3.0], [0, 1.1, 0.0], { color: '#9aa3ab', rot: [35, 0, 0] });
    b.pair((s) => b.rod([s * 3.0, 2.5, -1.25], [s * 3.0, 0.5, 1.4], 0.05, 'silver'));
    b.stick([-3, 2.9, -1.3], [3, 2.9, -1.3], 0.05, 'silver').pair((s) => b.stick([s * 3, 2.1, -1.3], [s * 3, 2.9, -1.3], 0.05, 'silver'));
    return b.act({ click: [[A.par(A.anim('shake', 3), A.say('Go, team, go!', 2))]] }).done();
  }),
  // A countertop blender (40 cm): a base with a dial and buttons, a jug of strawberry smoothie with the blades at
  // the bottom and a lid; it whirrs.
  e('blender', 'kitchen', 'appliances', () =>
    m('blender', { edge: 'sharp' })
      .box([0.17, 0.13, 0.17], [0, 0.065, 0], { color: 'red', round: 0.3 })
      .cyl([0.045, 0.015, 0.045], [0, 0.07, 0.087], { color: 'silver', rot: [90, 0, 0], name: 'dial' })
      .box([0.02, 0.012, 0.01], [0.05, 0.035, 0.086], { color: 'white' })
      .box([0.02, 0.012, 0.01], [-0.05, 0.035, 0.086], { color: 'white' })
      .cyl([0.12, 0.03, 0.12], [0, 0.145, 0], { color: '#3a3633' })
      .cyl([0.124, 0.2, 0.124], [0, 0.26, 0], { color: 'glass', taper: 1.2, edge: 'soft' })
      .cyl([0.12, 0.1, 0.12], [0, 0.21, 0], { color: 'pink', taper: 1.1, edge: 'soft' })
      .box([0.1, 0.008, 0.02], [0, 0.17, 0], { color: 'silver', name: 'blades', mover: { kind: 'spin', axis: 'y', amount: 1500 } })
      .cyl([0.155, 0.03, 0.155], [0, 0.375, 0], { color: '#2a2726', name: 'lid', piece: true })
      .arc([0.07, 0.15, 0.025], [0.09, 0.26, 0], { color: 'glass', rot: [0, 0, -90], tube: 0.2 })
      .act({ click: [[A.operate('blades', 'on'), A.pose('dial', { rot: [0, 0, -90], dur: 0.3 }), A.par(A.anim('shake', 3), A.say('Whirrrrr!', 2)), A.operate('blades', 'off'), A.pose('dial', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A blimp at its real 60 m (the vocabulary's 0.3 m is a toy), moored nose-first to its mast: a lofted silver
  // envelope with a blue stripe and name, four tail fins, the gondola with windows, and two engines whose
  // propellers start.
  e('blimp', 'garage', 'aircraft', () => {
    const b = m('blimp', { view: 'side' })
      .loft([14, 14, 58], [0, 10.5, -2], [[0, 0.1, 0.1, 0], [0.12, 0.6, 0.6, 0], [0.4, 1, 1, 0], [0.75, 0.95, 0.95, 0], [0.93, 0.6, 0.6, 0], [1, 0.08, 0.08, 0]], { color: 'silver', name: 'envelope' })
      .loft([14.1, 2.0, 40], [0, 10.5, 2], [[0, 0.75, 1, 0], [0.5, 1, 1, 0], [1, 0.9, 1, 0]], { color: 'blue', edge: 'soft' })
      .label('SKYSHIP', [14, 2.6], [7.05, 14.5, 0], { color: 'silver', rot: [0, 90, 0], depth: 0.1 })
      .label('SKYSHIP', [14, 2.6], [-7.05, 14.5, 0], { color: 'silver', rot: [0, -90, 0], depth: 0.1 })
      .loft([2.6, 2.4, 11], [0, 2.7, 4], [[0, 0.6, 0.6, 0.1], [0.2, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.6, 0.7, -0.05]], { color: 'white', boxy: 0.6, edge: 'sharp' })
      .box([2.65, 0.8, 8], [0, 3.0, 4.2], { color: GL, edge: 'sharp' })
      .box([0.8, 0.8, 0.8], [0, 1.2, 4], { color: 'rubber' })
      .socket('pilot', [0.6, 2.5, 8.5], 'seat');
    b.pair((s) => {
      b.cyl([0.9, 2.2, 0.9], [s * 2.2, 3.4, 1.5], { color: 'darkgray', rot: [90, 0, 0], edge: 'sharp' });
      b.rod([s * 1.2, 3.2, 1.5], [s * 2.0, 3.4, 1.5], 0.25, 'gray');
      b.box([0.15, 2.6, 0.1], [s * 2.2, 3.4, 2.7], { color: '#3a3633', name: s > 0 ? 'propL' : 'propR', pivot: [s * 2.2, 3.4, 2.7], mover: { kind: 'spin', axis: 'z', amount: 900 }, edge: 'sharp' });
    });
    for (const r of [0, 90, 180, 270]) {
      const a = r / RAD;
      b.box([0.3, 4.2, 6], [Math.sin(a) * 6.2, 10.5 + Math.cos(a) * 6.2, -25], { color: 'blue', rot: [0, 0, -r], edge: 'sharp', round: 0.3 });
    }
    // the mooring mast at the nose
    b.stick([0, 0, 28], [0, 10.5, 28], 0.6, 'red').box([3, 0.6, 3], [0, 0.3, 28], { color: 'darkgray', edge: 'sharp' });
    b.pair((s) => b.rod([s * 2.5, 0, 28], [0, 6, 28], 0.2, 'red'));
    return b.act({ click: [[A.operate('prop', 'on'), A.say('Vrrrrrm...', 2), A.wait(3), A.operate('prop', 'off')]] }).done();
  }),
  // A blindfold tied round a display head; it slips up for a peek.
  e('blindfold', 'wardrobe', 'masks', () =>
    m('blindfold')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.14, 0], 0.03, 'darkwood')
      .cyl([0.1, 0.06, 0.1], [0, 0.16, 0], { color: 'beige' })
      .ball([0.17, 0.22, 0.19], [0, 0.29, 0], { color: 'beige' })
      .ball(0.022, [0.04, 0.315, 0.088], { color: '#2a2726', eye: true })
      .ball(0.022, [-0.04, 0.315, 0.088], { color: '#2a2726', eye: true })
      .box([0.19, 0.06, 0.2], [0, 0.315, 0.0], { color: 'navy', round: 0.8, name: 'fold' })
      .ball([0.05, 0.04, 0.04], [0, 0.315, -0.11], { color: 'navy', parent: 'fold' })
      .box([0.035, 0.12, 0.008], [0.02, 0.26, -0.115], { color: 'navy', rot: [0, 0, 15], round: 0.3, parent: 'fold' })
      .box([0.035, 0.12, 0.008], [-0.02, 0.26, -0.115], { color: 'navy', rot: [0, 0, -15], round: 0.3, parent: 'fold' })
      .act({ click: [[A.pose('fold', { move: [0, 0.06, 0], dur: 0.4 }), A.say('Peekaboo!', 1.5), A.wait(1), A.pose('fold', { move: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A chunky gold chain with a diamond-studded dollar pendant on a velvet neck stand: bling!
  e('bling', 'wardrobe', 'jewellery', () => {
    const b = m('bling')
      .box([0.24, 0.03, 0.18], [0, 0.015, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.1, 0.32, 0.08], [0, 0.19, -0.02], { color: '#2a2726' })
      .ball([0.3, 0.14, 0.14], [0, 0.38, -0.02], { color: '#2a2726' })
      .torus([0.3, 0.32, 0.03], [0, 0.32, 0.04], { color: 'gold', tube: 0.1, rot: [-15, 0, 0] })
      .cyl([0.14, 0.03, 0.14], [0, 0.16, 0.07], { color: 'gold', rot: [90, 0, 0], name: 'pendant', edge: 'sharp' })
      .label('$', [0.08, 0.09], [0, 0.16, 0.086], { color: 'gold', parent: 'pendant', depth: 0.003 });
    around(8, 0.058).forEach(([x0, y]) => b.ball(0.014, [x0, 0.16 + y, 0.087], { color: 'white', glow: true, parent: 'pendant' }));
    return b.act({ click: [[A.par(A.effect('sparkle', { dur: 2 }), A.pose('pendant', { rot: [0, 360, 0], dur: 1 }), A.say('Bling bling!', 1.5)), A.pose('pendant', { rot: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // Wooden toy building blocks: two cubes, a plank across them, a triangle roof on top and a cylinder beside.
  e('block', 'toys', 'blocks', () =>
    m('block', { edge: 'sharp' })
      .box([0.1, 0.1, 0.1], [-0.055, 0.05, 0], { color: 'red', round: 0.1, name: 'base' })
      .box([0.1, 0.1, 0.1], [0.055, 0.05, 0], { color: 'blue', round: 0.1 })
      .box([0.22, 0.05, 0.1], [0, 0.125, 0], { color: 'yellow', round: 0.1 })
      .wedge([0.16, 0.08, 0.1], [0, 0.19, 0], { color: 'green', name: 'roof', parent: 'base', piece: true })
      .cyl([0.06, 0.1, 0.06], [0.16, 0.05, 0.08], { color: 'orange' })
      .act({ click: [[A.detach('roof', 'block')], [A.reattach('roof'), A.say('Tada!', 1)]] })
      .done(),
  ),
  // A blood-bank refrigerator (1.9 m): white cabinet, a glass door over shelves of blood bags, a temperature
  // display and a red cross; the door opens on the cold.
  e('blood bank', 'clinic', 'hospital things', () => {
    const b = m('blood bank', { edge: 'sharp' })
      .box([0.9, 1.9, 0.75], [0, 0.95, 0], { color: 'white', round: 0.06 })
      .box([0.8, 1.45, 0.05], [0, 0.92, 0.395], { color: '#cfe6f2', round: 0.1, name: 'door', pivot: [0.4, 0.92, 0.395], mover: { kind: 'swing', axis: 'y', amount: 105 } })
      .box([0.03, 0.5, 0.05], [-0.34, 0.95, 0.44], { color: 'silver', parent: 'door' })
      .box([0.25, 0.1, 0.02], [-0.2, 1.75, 0.38], { color: '#2a2726' })
      .label('4°C', [0.12, 0.06], [-0.2, 1.75, 0.395], { color: 'lime', glow: true, depth: 0.004 })
      .box([0.06, 0.18, 0.02], [0.25, 1.76, 0.38], { color: 'red' })
      .box([0.18, 0.06, 0.02], [0.25, 1.76, 0.38], { color: 'red' })
      .box([0.86, 0.06, 0.7], [0, 0.03, 0], { color: '#3a3633' });
    b.each(4, (r) => {
      b.box([0.78, 0.02, 0.6], [0, 0.32 + r * 0.36, 0.0], { color: 'lightgray' });
      b.each(4, (k) => b.box([0.13, 0.22, 0.05], [-0.26 + k * 0.17, 0.45 + r * 0.36, 0.2], { color: 'darkred', round: 0.6, edge: 'soft' }));
    });
    return b.act({ click: [[A.operate('door', 'open'), A.par(A.effect('snow', { dur: 1.5 }), A.say('Brrr!', 1.2)), A.wait(2), A.operate('door', 'close')]] }).done();
  }),
  // A blood-pressure cuff: the grey cuff with its Velcro, a dial gauge and the black squeeze bulb; pump it up and
  // let it hiss down.
  e('blood pressure cuff', 'clinic', 'medical tools', () =>
    m('blood pressure cuff')
      .cyl([0.11, 0.18, 0.11], [0, 0.055, 0], { color: 'navy', rot: [0, 0, 90] })
      .box([0.06, 0.112, 0.03], [0.05, 0.055, 0.045], { color: 'gray', round: 0.4 })
      .cyl([0.08, 0.025, 0.08], [-0.03, 0.12, 0.03], { color: 'silver', rot: [60, 0, 0], edge: 'sharp' })
      .cyl([0.068, 0.01, 0.068], [-0.03, 0.125, 0.042], { color: 'white', rot: [60, 0, 0], edge: 'sharp' })
      .box([0.004, 0.028, 0.004], [-0.03, 0.135, 0.05], { color: 'red', rot: [60, 0, 0], round: 0, name: 'needle', pivot: [-0.03, 0.125, 0.045] })
      .rod([-0.08, 0.07, 0.04], [-0.13, 0.04, 0.12], 0.012, 'black')
      .ball([0.05, 0.05, 0.08], [-0.15, 0.03, 0.16], { color: 'black', name: 'bulb' })
      .act({
        click: [
          [A.pose('bulb', { scale: 0.75, dur: 0.15 }), A.pose('bulb', { scale: 1, dur: 0.15 }), A.pose('bulb', { scale: 0.75, dur: 0.15 }), A.pose('bulb', { scale: 1, dur: 0.15 }), A.par(A.pose('needle', { rot: [0, 0, -150], dur: 0.8 }), A.say('Pff, pff, pff!', 1.2))],
          [A.par(A.pose('needle', { rot: [0, 0, 0], dur: 1.5 }), A.say('Hisss...', 1.5))],
        ],
      })
      .done(),
  ),
  // A pink silk blouse with a white collar, puffed sleeves and pearl buttons on a dress form; it shimmers.
  e('blouse', 'wardrobe', 'tops', () => {
    const b = mannequin('blouse')
      .box([0.4, 0.52, 0.25], [0, 1.25, 0], { color: '#f4c2d4', round: 0.85 })
      .ball([0.06, 0.04, 0.03], [0, 1.5, 0.12], { color: 'white' });
    b.pair((s) => {
      b.ball([0.11, 0.05, 0.07], [s * 0.05, 1.51, 0.095], { color: 'white', rot: [0, 0, s * 25] });
      b.ball([0.16, 0.16, 0.16], [s * 0.23, 1.43, 0], { color: '#f4c2d4' });
      b.capsule([0.09, 0.28, 0.09], [s * 0.27, 1.25, 0], { color: '#f4c2d4', rot: [0, 0, s * 12] });
    });
    b.each(4, (i) => b.ball(0.016, [0, 1.42 - i * 0.08, 0.126], { color: 'white' }));
    return b.act({ click: [[A.par(A.anim('wobble'), A.effect('sparkle', { dur: 1.5 }))]] }).done();
  }),
  // A pink hair dryer standing on its handle: nozzle, rear air intake, switches and a coiled cord; hot air
  // blasts out.
  e('blowdryer', 'home', 'bathroom', () =>
    m('blowdryer', { view: 'side' })
      .cyl([0.08, 0.2, 0.08], [0, 0.2, 0.02], { color: 'pink', rot: [90, 0, 0] })
      .ball([0.11, 0.11, 0.1], [0, 0.2, -0.08], { color: 'pink' })
      .cyl([0.065, 0.04, 0.065], [0, 0.2, 0.14], { color: 'darkgray', rot: [90, 0, 0], taper: 0.8, edge: 'sharp' })
      .cyl([0.07, 0.01, 0.07], [0, 0.2, -0.132], { color: 'darkgray', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.05, 0.01, 0.005], [0, 0.2, -0.138], { color: 'gray', name: 'impeller', mover: { kind: 'spin', axis: 'z', amount: 1500 } })
      .box([0.045, 0.16, 0.055], [0, 0.1, -0.05], { color: 'pink', rot: [-15, 0, 0], round: 0.5 })
      .box([0.02, 0.03, 0.01], [0, 0.13, -0.02], { color: 'white', rot: [-15, 0, 0], edge: 'sharp' })
      .torus([0.06, 0.03, 0.01], [0.0, 0.015, -0.12], { color: 'black', rot: [90, 0, 0], tube: 0.2 })
      .act({ click: [[A.operate('impeller', 'on'), A.par(A.effect('steam', { dur: 2 }), A.say('Whoooosh!', 1.5), A.anim('shake', 2)), A.operate('impeller', 'off')]] })
      .done(),
  ),
  // A BLT on a plate: toasted bread, crisp bacon, lettuce and tomato, held with a cocktail stick; the top slice
  // lifts for a look.
  e('blt', 'food', 'sandwiches', () =>
    m('blt')
      .cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white', edge: 'sharp' })
      .box([0.12, 0.022, 0.12], [0, 0.023, 0], { color: '#e3b26a', round: 0.4, name: 'bread' })
      .box([0.135, 0.012, 0.135], [0, 0.04, 0], { color: 'lettuce', round: 0.8, rot: [0, 10, 0] })
      .cyl([0.06, 0.012, 0.06], [0.03, 0.052, 0.02], { color: 'tomato' })
      .cyl([0.06, 0.012, 0.06], [-0.03, 0.052, -0.02], { color: 'tomato' })
      .box([0.135, 0.009, 0.035], [0, 0.064, 0.025], { color: '#b5543c', rot: [0, 12, 0], round: 0.5 })
      .box([0.135, 0.009, 0.035], [0, 0.064, -0.025], { color: '#c9704a', rot: [0, -8, 0], round: 0.5 })
      .box([0.12, 0.022, 0.12], [0, 0.08, 0], { color: '#e3b26a', round: 0.4, name: 'lid', parent: 'bread', piece: true, pivot: [-0.06, 0.08, 0] })
      .stick([0, 0.085, 0], [0, 0.13, 0], 0.005, 'tan', { parent: 'lid' })
      .ball(0.018, [0, 0.12, 0], { color: 'green', parent: 'lid' })
      .act({ click: [[A.pose('lid', { rot: [0, 0, 40], dur: 0.4 }), A.say('Mmm, bacon!', 1.5), A.wait(0.8), A.pose('lid', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done(),
  ),
  // A wedge of blue cheese, marbled with blue veins, on a board with a cheese knife; it is rather smelly.
  e('blue cheese', 'food', 'cheese', () => {
    const b = m('blue cheese')
      .cyl([0.22, 0.015, 0.22], [0, 0.0075, 0], { color: 'lightwood', edge: 'sharp' })
      .wedge([0.14, 0.13, 0.065], [0, 0.048, 0], { color: '#f3ecd6', rot: [90, 0, 0] })
      .box([0.012, 0.004, 0.12], [0.08, 0.02, 0.0], { color: 'silver', edge: 'sharp', rot: [0, 20, 0] })
      .box([0.02, 0.014, 0.06], [0.1, 0.022, -0.08], { color: 'darkwood', edge: 'sharp', rot: [0, 20, 0] });
    for (const [x0, y, z] of [[0, 0.082, 0], [-0.03, 0.082, -0.03], [0.02, 0.082, -0.04], [0.04, 0.04, -0.05], [-0.05, 0.03, -0.05], [0.025, 0.05, 0.02], [-0.015, 0.03, 0.035]]) b.ball([0.016, 0.006, 0.012], [x0, y, z], { color: '#5a7a9a', noInk: true });
    return b.act({ click: [[A.par(A.effect('smoke', { dur: 1.5 }), A.say('Pee-yew!', 1.5))]] }).done();
  }),
  // A businessperson in a navy suit and red tie, carrying a briefcase.
  e('blue suit', 'wardrobe', 'suits', () =>
    withAct(who('blue suit', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [wear('suit', 'navy'), wear('tie', 'red'), held('briefcase')] }), {
      click: [[A.par(A.anim('wave'), A.say('Good morning!', 2))], [A.par(A.anim('nod'), A.say("Let's do business.", 2))]],
    }),
  ),
  // An architect's drafting table (1 m) with a blueprint pinned to its tilted top, rolls of plans in a bin, a
  // T-square and a lamp that switches on; a roll unrolls.
  e('blueprints', 'study', 'plans and maps', () => {
    const B = '#2f5fa8';
    const b = m('blueprints', { edge: 'sharp' })
      .box([1.2, 0.04, 0.85], [0, 0.95, 0], { color: 'lightwood', rot: [20, 0, 0] })
      .box([1.0, 0.01, 0.7], [0, 0.975, 0.0], { color: B, rot: [20, 0, 0], round: 0 })
      .box([0.9, 0.02, 0.04], [0.05, 0.99, 0.18], { color: 'black', rot: [20, 0, 0] })
      .stick([0.6, 0.97, -0.35], [0.6, 1.5, -0.3], 0.025, 'gray')
      .rod([0.6, 1.5, -0.3], [0.4, 1.55, -0.05], 0.025, 'gray')
      .cone([0.2, 0.15, 0.2], [0.38, 1.47, 0.0], { color: 'green', rot: [150, 0, 0] })
      .ball(0.07, [0.37, 1.42, 0.02], { color: '#fff6c8', glow: true, name: 'lamp', mover: { kind: 'light' } })
      .cyl([0.3, 0.5, 0.3], [-0.85, 0.25, 0.2], { color: 'darkgray' })
      .cyl([0.07, 0.7, 0.07], [-0.85, 0.45, 0.15], { color: B, rot: [8, 0, 6] })
      .cyl([0.07, 0.7, 0.07], [-0.9, 0.45, 0.25], { color: B, rot: [-6, 0, -8] })
      .cyl([0.07, 0.7, 0.07], [-0.78, 0.45, 0.25], { color: 'white', rot: [4, 0, 10] })
      .cyl([0.07, 0.6, 0.07], [0, 0.04, 0.6], { color: B, rot: [0, 0, 90], name: 'roll' });
    for (const [w, d, x0, z] of [[0.6, 0.006, 0, 0.15], [0.6, 0.006, 0, -0.15], [0.006, 0.3, -0.3, 0], [0.006, 0.3, 0.3, 0], [0.006, 0.3, 0.05, 0]] as Array<[number, number, number, number]>) b.box([w, 0.004, d], [x0, 0.985 + z * 0.36, z * 0.94], { color: 'white', noInk: true, round: 0, rot: [20, 0, 0] });
    b.pair((s) => b.box([0.05, 0.9, 0.05], [s * 0.5, 0.45, 0.25], { color: 'darkgray' }).box([0.05, 1.05, 0.05], [s * 0.5, 0.52, -0.25], { color: 'darkgray' }));
    return b.act({ click: [[A.operate('lamp', 'on')], [A.pose('roll', { move: [0, 0, 0.3], rot: [-720, 0, 0], dur: 0.8 }), A.wait(0.5), A.pose('roll', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 }), A.operate('lamp', 'off')]] }).done();
  }),
  // A compact of blush with a mirror in the lid and a little brush; it opens with a pink puff.
  e('blush', 'wardrobe', 'makeup', () =>
    m('blush', { edge: 'sharp' })
      .cyl([0.08, 0.016, 0.08], [0, 0.008, 0], { color: 'black' })
      .cyl([0.064, 0.004, 0.064], [0, 0.017, 0], { color: '#e88a9a' })
      .cyl([0.08, 0.01, 0.08], [0, 0.021, 0], { color: 'black', name: 'lid', pivot: [0, 0.018, -0.04], mover: { kind: 'swing', axis: 'x', amount: -105 } })
      .cyl([0.064, 0.004, 0.064], [0, 0.027, 0], { color: '#cfe6f2', parent: 'lid' })
      .stick([0.03, 0.006, 0.06], [0.1, 0.008, 0.02], 0.01, 'darkwood')
      .ball([0.03, 0.025, 0.04], [0.02, 0.012, 0.068], { color: '#e8b8a0', rot: [0, 60, 0], edge: 'soft' })
      .act({ click: [[A.operate('lid', 'open'), A.par(A.effect('dust', { dur: 1 }), A.say('Puff!', 1))], [A.operate('lid', 'close'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A board game set out on the floor: the board with its coloured corners and track, the box lid, pawns and two
  // dice that roll.
  e('board game', 'toys', 'games', () => {
    const b = m('board game', { edge: 'sharp' })
      .box([0.4, 0.3, 0.04], [0, 0.15, -0.26], { color: 'red', rot: [-12, 0, 0], round: 0.1 })
      .label('GAME NIGHT', [0.3, 0.08], [0, 0.2, -0.235], { color: 'yellow', rot: [-12, 0, 0], depth: 0.004 })
      .box([0.42, 0.02, 0.42], [0, 0.01, 0.05], { color: 'cream', round: 0.1 });
    ['red', 'blue', 'green', 'yellow'].forEach((c, i) => b.box([0.11, 0.004, 0.11], [(i % 2 ? 1 : -1) * 0.145, 0.021, 0.05 + (i < 2 ? -0.145 : 0.145)], { color: c, noInk: true, round: 0 }));
    b.each(12, (i) => b.box([0.03, 0.003, 0.03], [-0.165 + i * 0.03, 0.022, 0.05], { color: i % 3 ? 'white' : 'skyblue', noInk: true, round: 0 }));
    for (const [x0, z, c] of [[-0.05, 0.0, 'red'], [0.06, 0.1, 'blue'], [0.0, 0.16, 'green']] as Array<[number, number, string]>) b.cone([0.03, 0.04, 0.03], [x0, 0.04, z], { color: c, edge: 'soft', name: c === 'red' ? 'pawn' : undefined }).ball(0.022, [x0, 0.065, z], { color: c, edge: 'soft', parent: c === 'red' ? 'pawn' : undefined });
    b.box([0.035, 0.035, 0.035], [0.1, 0.038, -0.02], { color: 'white', round: 0.3, rot: [0, 20, 0], name: 'die1' }).box([0.035, 0.035, 0.035], [0.15, 0.038, 0.02], { color: 'white', round: 0.3, rot: [0, -15, 0], name: 'die2' });
    return b
      .act({ click: [[A.par(A.pose('die1', { rot: [720, 180, 0], move: [0.03, 0, 0.05], dur: 0.8 }), A.pose('die2', { rot: [0, 90, 720], move: [-0.02, 0, 0.06], dur: 0.8 })), A.say('Rattle... a six!', 1.5), A.pose('pawn', { move: [0.09, 0, 0.05], dur: 0.6 })], [A.par(A.pose('die1', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 }), A.pose('die2', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 }), A.pose('pawn', { move: [0, 0, 0], dur: 0.4 }))]] })
      .done();
  }),
  // A motor boat at real size (7.5 m): a white lofted hull with a blue boot stripe, a cabin with windows and a
  // windscreen, seats in the cockpit, a rail round the bow, and an outboard whose propeller starts.
  e('boat', 'garage', 'boats', () => {
    const b = m('boat', { view: 'side' })
      .loft([2.5, 2.0, 7.5], [0, 1.0, 0], [[0, 0.85, 0.9, 0.05], [0.3, 1, 1, 0], [0.75, 0.92, 1, 0], [1, 0.05, 1, 0.05]], { color: 'white', cut: 'bottom', boxy: 0.35, name: 'hull' })
      .loft([2.54, 0.5, 7.52], [0, 0.65, 0], [[0, 0.85, 0.9, 0], [0.3, 1, 1, 0], [0.75, 0.92, 1, 0], [1, 0.05, 1, 0]], { color: 'blue', cut: 'bottom', boxy: 0.35, edge: 'soft' })
      .box([2.1, 0.08, 5.4], [0, 1.0, -0.9], { color: 'lightwood', edge: 'sharp' })
      .box([1.8, 0.9, 2.4], [0, 1.45, 0.7], { color: 'white', edge: 'sharp', round: 0.2 })
      .box([1.82, 0.35, 2.2], [0, 1.55, 0.7], { color: GL, edge: 'sharp' })
      .box([1.7, 0.6, 0.06], [0, 2.05, -0.45], { color: '#cfe6f2', rot: [-25, 0, 0], edge: 'sharp' })
      .box([1.6, 0.4, 0.5], [0, 1.25, -1.6], { color: 'cream', edge: 'sharp', round: 0.4 })
      .box([1.6, 0.6, 0.15], [0, 1.45, -1.9], { color: 'cream', edge: 'sharp', round: 0.4 })
      .box([0.4, 0.9, 0.4], [0, 1.15, -3.85], { color: '#2a2726', edge: 'sharp', round: 0.3 })
      .box([0.12, 0.5, 0.15], [0, 0.5, -3.95], { color: '#2a2726', edge: 'sharp' })
      .box([0.08, 0.5, 0.06], [0, 0.32, -4.1], { color: 'silver', name: 'propeller', pivot: [0, 0.32, -4.1], mover: { kind: 'spin', axis: 'z', amount: 1200 }, edge: 'sharp' })
      .stick([0, 1.3, -3.6], [0, 2.6, -3.6], 0.04, 'silver')
      .box([0.6, 0.4, 0.02], [0.3, 2.4, -3.6], { color: 'red', edge: 'soft' })
      .socket('helm', [0.4, 1.3, -0.9], 'seat');
    b.pair((s) => b.stick([s * 1.0, 1.4, 1.9], [s * 0.15, 1.4, 3.6], 0.03, 'silver').stick([s * 1.0, 1.0, 1.9], [s * 1.0, 1.4, 1.9], 0.03, 'silver'));
    return b.act({ click: [[A.operate('propeller', 'on'), A.par(A.effect('water_spray', { dur: 2 }), A.say('Putt-putt-putt!', 2)), A.wait(1.5), A.operate('propeller', 'off')]] }).done();
  }),
  // A timber boat house over the water: a gable roof, a sign, wide doors on the water side that swing open and a
  // little rowing boat that slides out, a jetty beside it.
  e('boat house', 'places', 'harbour', () => {
    const b = m('boat house', { edge: 'sharp' })
      .box([10, 0.25, 9], [0, 0.125, 1.5], { color: 'water', round: 0.05, edge: 'soft' })
      .box([6, 3.2, 6], [0, 1.85, -0.5], { color: '#8a5a3a', round: 0.02 })
      .label('BOAT HOUSE', [3.0, 0.5], [0, 3.95, 2.56], { color: 'cream', depth: 0.04 });
    const W = 6.8, R = 2.2, a = Math.atan2(R, W / 2), L = Math.hypot(W / 2, R) + 0.1;
    b.pair((s) => b.box([L, 0.2, 6.6], [(s * W) / 4, 3.45 + R / 2, -0.5], { color: 'darkred', rot: [0, 0, -s * a * RAD], round: 0.1 }));
    b.pair((s) => b.wedge([6, R * (6 / W), 0.1], [0, 3.45 + (R * (6 / W)) / 2, -0.5 + s * 2.95], { color: '#8a5a3a' }));
    b.each(10, (i) => b.box([0.04, 3.2, 0.04], [-2.7 + i * 0.6, 1.85, 2.52], { color: '#6b4a2a', noInk: true }));
    b.box([1.8, 2.4, 0.1], [-0.9, 1.45, 2.56], { color: '#6b4a2a', name: 'doorL', pivot: [-1.8, 1.45, 2.56], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .box([1.8, 2.4, 0.1], [0.9, 1.45, 2.56], { color: '#6b4a2a', name: 'doorR', pivot: [1.8, 1.45, 2.56], mover: { kind: 'swing', axis: 'y', amount: 100 } })
      .loft([1.1, 0.5, 3.0], [0, 0.45, 0.5], [[0, 0.8, 1, 0], [0.5, 1, 1, 0], [1, 0.1, 1, 0]], { color: 'red', cut: 'bottom', name: 'rowboat', edge: 'soft' })
      .box([4, 0.15, 1.4], [5, 0.5, 2.5], { color: 'wood' });
    b.each(4, (i) => b.stick([3.3 + i * 1.1, 0, 3.15], [3.3 + i * 1.1, 0.6, 3.15], 0.15, 'darkwood'));
    win(b, [3.02, 2.2, -0.5], 1.2, 1.0, { side: 1, frame: 'cream' });
    return b
      .act({ click: [[A.operate('door', 'open'), A.wait(0.6), A.pose('rowboat', { move: [0, 0, 3.6], dur: 1.6 }), A.say('Splash!', 1)], [A.pose('rowboat', { move: [0, 0, 0], dur: 1.6 }), A.operate('door', 'close')]] })
      .done();
  }),
  // A bobblehead figure (20 cm) of a ball player on a base, its big head on a spring; it nods and nods.
  e('bobblehead', 'toys', 'figurines', () =>
    m('bobblehead')
      .cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: '#2a2726', edge: 'sharp' })
      .label('#1 FAN', [0.06, 0.016], [0, 0.015, 0.049], { color: 'gold', depth: 0.002 })
      .box([0.05, 0.05, 0.03], [0, 0.055, 0], { color: 'navy', round: 0.5 })
      .box([0.055, 0.05, 0.035], [0, 0.1, 0], { color: 'blue', round: 0.6 })
      .rod([0.03, 0.12, 0], [0.045, 0.085, 0.01], 0.014, 'skin2')
      .rod([-0.03, 0.12, 0], [-0.045, 0.085, 0.01], 0.014, 'skin2')
      .ball([0.09, 0.09, 0.085], [0, 0.17, 0], { color: 'skin2', name: 'head', pivot: [0, 0.125, 0] })
      .dome([0.095, 0.04, 0.09], [0, 0.205, -0.003], { color: 'blue', parent: 'head' })
      .box([0.05, 0.008, 0.035], [0, 0.19, 0.045], { color: 'blue', parent: 'head', round: 0.5 })
      .ball(0.012, [0.02, 0.175, 0.04], { color: 'black', eye: true, parent: 'head' })
      .ball(0.012, [-0.02, 0.175, 0.04], { color: 'black', eye: true, parent: 'head' })
      .box([0.03, 0.006, 0.006], [0, 0.15, 0.043], { color: 'darkred', parent: 'head', round: 0.5 })
      .act({ click: [[A.pose('head', { rot: [20, 0, 0], dur: 0.12 }), A.pose('head', { rot: [-15, 0, 0], dur: 0.12 }), A.pose('head', { rot: [15, 0, 0], dur: 0.12 }), A.pose('head', { rot: [-10, 0, 8], dur: 0.12 }), A.pose('head', { rot: [8, 0, -6], dur: 0.12 }), A.pose('head', { rot: [0, 0, 0], dur: 0.15 }), A.say('Boing boing!', 1)]] })
      .done(),
  ),
  // Bobby pins (6 cm) clipped on a card; one springs off and back.
  e('bobby pin', 'wardrobe', 'hair accessories', () => {
    const b = m('bobby pin', { edge: 'sharp' })
      .box([0.1, 0.12, 0.004], [0, 0.06, -0.01], { color: 'pink', round: 0.2 })
      .box([0.08, 0.02, 0.004], [0, 0.11, -0.006], { color: 'white', round: 0 });
    b.each(3, (i) => {
      const x0 = -0.03 + i * 0.03;
      b.box([0.003, 0.065, 0.003], [x0 - 0.002, 0.06, 0.0], { color: '#3a3633', round: 0, name: i === 1 ? 'pin' : undefined, piece: i === 1 });
      b.box([0.003, 0.06, 0.003], [x0 + 0.003, 0.062, 0.002], { color: '#3a3633', round: 0, rot: [0, 0, 2], parent: i === 1 ? 'pin' : undefined });
    });
    return b.act({ click: [[A.pose('pin', { move: [0, 0.03, 0.03], rot: [0, 0, 30], dur: 0.2 }), A.say('Boing!', 1), A.pose('pin', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })]] }).done();
  }),
  // A zipped black body bag on a wheeled hospital gurney; its zip runs open a little and closed again.
  e('body bag', 'clinic', 'hospital things', () => {
    const b = m('body bag', { view: 'side' })
      .box([0.65, 0.06, 2.0], [0, 0.85, 0], { color: 'silver', edge: 'sharp' })
      .box([0.55, 0.22, 1.85], [0, 0.98, 0], { color: '#2a2726', round: 0.8 })
      .box([0.02, 0.01, 1.6], [0, 1.09, 0], { color: 'gray', noInk: true })
      .box([0.03, 0.02, 0.04], [0, 1.1, 0.75], { color: 'silver', name: 'zip', edge: 'sharp' })
      .box([0.7, 0.04, 0.04], [0, 0.4, 0.9], { color: 'silver', edge: 'sharp' })
      .box([0.7, 0.04, 0.04], [0, 0.4, -0.9], { color: 'silver', edge: 'sharp' });
    for (const [x0, z] of [[0.3, 0.9], [-0.3, 0.9], [0.3, -0.9], [-0.3, -0.9]]) {
      b.stick([x0, 0.12, z], [x0, 0.85, z], 0.035, 'silver');
      tyre(b, `wheel${x0 > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`, [x0, 0.06, z], 0.12, 0.04, { hub: 'gray' });
    }
    return b.act({ click: [[A.pose('zip', { move: [0, 0, -0.6], dur: 0.8 }), A.say('Zzzip.', 1), A.pose('zip', { move: [0, 0, 0], dur: 0.8 })]] }).done();
  }),
  // An auto body shop: a workshop with a sign, two roll-up doors (one bay has a car with a dented wing), a
  // spray-paint booth vent and a tyre stack; sparks fly as the welder works.
  e('body shop', 'places', 'shops', () => {
    const b = bldg('body shop', { w: 12, d: 9, wall: '#d4d7da', trim: '#c0392b', roofKind: 'flat', roof: '#5c6166', doorColor: '#3a3633', cols: 2, sign: 'BODY SHOP', signColor: '#c0392b' });
    b.pair((s) => {
      b.box([3.6, 3.2, 0.1], [s * 3.6, 1.9, 4.52], { color: '#2a2726', round: 0.02 });
      b.box([3.6, 3.2, 0.12], [s * 3.6, 1.9, 4.58], { color: '#9aa3ab', name: s > 0 ? 'bayL' : 'bayR', mover: { kind: 'slide', axis: 'y', amount: 2.6 }, round: 0.02 });
      b.each(6, (i) => b.box([3.6, 0.03, 0.02], [s * 3.6, 0.55 + i * 0.5, 4.65], { color: '#7d858c', parent: s > 0 ? 'bayL' : 'bayR', noInk: true }));
    });
    b.loft([1.8, 1.2, 4.2], [3.6, 0.9, 2.2], [[0, 0.9, 0.7, -0.1], [0.3, 1, 1, 0.05], [0.7, 1, 1, 0.05], [1, 0.9, 0.7, -0.15]], { color: 'orange', boxy: 0.6, edge: 'soft' })
      .cyl([1.2, 0.8, 1.2], [-3, 4.6, -2], { color: 'silver' })
      .cone([1.4, 0.5, 1.4], [-3, 5.25, -2], { color: 'darkgray' });
    b.each(4, (i) => b.torus([0.7, 0.7, 0.25], [6.8, 0.45 + i * 0.26, 4.5], { color: 'rubber', rot: [90, 0, 0], tube: 0.3 }));
    return b.act({ click: [[A.operate('bayL', 'open'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Bzzt! Bzzt!', 2)), A.wait(1.5), A.operate('bayL', 'close')]] }).done();
  }),
  // A squeeze bottle of body wash with a flip cap, foam bubbles round its foot; squeeze it for more bubbles.
  e('body wash', 'home', 'bathroom', () => {
    const b = m('body wash')
      .box([0.08, 0.2, 0.045], [0, 0.1, 0], { color: 'teal', round: 0.8, name: 'bottle', pivot: [0, 0, 0] })
      .cyl([0.04, 0.03, 0.03], [0, 0.215, 0], { color: 'white', parent: 'bottle', edge: 'sharp' })
      .label('BODY WASH', [0.055, 0.07], [0, 0.1, 0.024], { color: 'white', parent: 'bottle', depth: 0.002 });
    for (const [x0, y, z, r] of [[0.06, 0.03, 0.04, 0.03], [0.08, 0.06, 0.0, 0.022], [-0.06, 0.02, 0.05, 0.026], [0.05, 0.012, 0.07, 0.024]]) b.ball(r, [x0, y, z], { color: 'white' });
    return b.act({ click: [[A.pose('bottle', { scale: 0.92, dur: 0.15 }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Squirt!', 1)), A.pose('bottle', { scale: 1, dur: 0.2 })]] }).done();
  }),
  // A home boiler (1.8 m): a red cylinder on its plinth with a burner window that lights, a pressure gauge, a
  // valve wheel and copper flue pipe; it roars into life.
  e('boiler', 'home', 'appliances', () =>
    m('boiler', { edge: 'sharp' })
      .cyl([0.9, 0.1, 0.9], [0, 0.05, 0], { color: 'darkgray' })
      .cyl([0.8, 1.5, 0.8], [0, 0.85, 0], { color: 'red', edge: 'soft' })
      .dome([0.8, 0.3, 0.8], [0, 1.75, 0], { color: 'red', edge: 'soft' })
      .torus([0.82, 0.82, 0.05], [0, 0.5, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.04 })
      .torus([0.82, 0.82, 0.05], [0, 1.2, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.04 })
      .box([0.36, 0.3, 0.06], [0, 0.32, 0.39], { color: 'darkgray', round: 0.2 })
      .box([0.24, 0.12, 0.02], [0, 0.32, 0.43], { color: 'fire', glow: true, round: 0, name: 'burner', mover: { kind: 'light' } })
      .cyl([0.2, 0.05, 0.2], [0.14, 0.95, 0.39], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.16, 0.02, 0.16], [0.14, 0.95, 0.42], { color: 'white', rot: [90, 0, 0] })
      .box([0.008, 0.06, 0.004], [0.14, 0.97, 0.432], { color: 'red', round: 0, name: 'needle', pivot: [0.14, 0.95, 0.432] })
      .stick([0.2, 1.8, 0], [0.2, 2.1, 0], 0.12, 'copper')
      .stick([0.2, 2.05, 0], [0.2, 2.05, -0.5], 0.12, 'copper')
      .torus([0.2, 0.2, 0.03], [-0.3, 1.45, 0.25], { color: 'gold', tube: 0.15, rot: [0, 45, 0] })
      .act({ click: [[A.operate('burner', 'on'), A.par(A.pose('needle', { rot: [0, 0, -100], dur: 1.5 }), A.say('Whoomph... rumble...', 2), A.effect('steam', { dur: 2 }))], [A.operate('burner', 'off'), A.pose('needle', { rot: [0, 0, 0], dur: 1 })]] })
      .done(),
  ),
  // A head of bok choy (25 cm): pale crunchy stalks fanning out into dark green leaves; a leaf snaps off.
  e('bok choi', 'food', 'vegetables', () => {
    const b = m('bok choi').cyl([0.07, 0.025, 0.07], [0, 0.0125, 0], { color: '#dfe8c8', name: 'base' });
    around(5, 0.035, 0.3).forEach(([x0, z]) => {
      b.rod([x0 * 0.3, 0.015, z * 0.3], [x0 * 1.3, 0.13, z * 1.3], 0.034, '#f0f5e4');
      leaf(b, [x0 * 1.2, 0.11, z * 1.2], [x0 * 2.2, 0.27, z * 2.2], 0.09, 'darkgreen');
    });
    b.rod([0, 0.015, 0.012], [0.0, 0.14, 0.05], 0.03, '#f0f5e4', { name: 'stalk', parent: 'base', piece: true });
    leaf(b, [0, 0.12, 0.05], [0, 0.28, 0.1], 0.08, '#3f7a3a', 'stalk');
    return b.act({ click: [[A.detach('stalk', 'leaf'), A.say('Snap!', 1)], [A.reattach('stalk')]] }).done();
  }),
  // A steel hex bolt (8 cm) standing on its head, threaded, with a nut that spins up the thread and back down.
  e('bolt (metal)', 'workshop', 'hardware', () => {
    const b = m('bolt (metal)', { edge: 'sharp' })
      .prism([0.045, 0.018, 0.045], [0, 0.009, 0], 6, { color: 'steel' })
      .cyl([0.02, 0.08, 0.02], [0, 0.058, 0], { color: 'silver' })
      .prism([0.04, 0.015, 0.04], [0, 0.03, 0], 6, { color: 'steel', name: 'nut' });
    b.each(6, (i) => b.torus([0.023, 0.023, 0.004], [0, 0.05 + i * 0.008, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 }));
    return b.act({ click: [[A.pose('nut', { move: [0, 0.055, 0], rot: [0, 1080, 0], dur: 1.2 }), A.say('Zzzip!', 1), A.pose('nut', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.2 })]] }).done();
  }),
  // A round black cartoon bomb with its cap and a fuse; the fuse fizzes and... KA-BOOM!
  e('bomb', 'armory', 'explosives', () =>
    m('bomb')
      .ball(0.26, [0, 0.13, 0], { color: '#2a2726' })
      .cyl([0.08, 0.045, 0.08], [0.04, 0.255, 0], { color: 'darkgray', rot: [0, 0, -20], edge: 'sharp' })
      .rod([0.05, 0.27, 0], [0.09, 0.33, 0.01], 0.012, 'tan')
      .star(0.07, [0.1, 0.36, 0.01], { color: 'flame', glow: true, name: 'spark', mover: { kind: 'light' } })
      .ball([0.05, 0.035, 0.02], [-0.05, 0.19, 0.1], { color: 'white', noInk: true, rot: [0, 0, 30] })
      .act({ click: [[A.operate('spark', 'on'), A.say('Tssssss...', 1.5), A.wait(1.5), A.par(A.effect('explosion', { dur: 1.2 }), A.say('KA-BOOM!', 1.5), A.anim('shake', 2)), A.operate('spark', 'off')]] })
      .done(),
  ),
  // A fallout shelter entrance: a grassy earth mound with a concrete portal, a heavy steel door with a hand wheel,
  // a yellow sign and vent pipes; the wheel turns and the door swings open.
  e('bomb shelter', 'places', 'shelters', () => {
    const b = m('bomb shelter', { edge: 'sharp' })
      .dome([8, 2.6, 7], [0, 1.3, -1.0], { color: 'grass', edge: 'soft' })
      .box([2.6, 2.6, 1.6], [0, 1.3, 2.2], { color: 'stone', round: 0.05 })
      .box([2.8, 0.25, 1.8], [0, 2.7, 2.2], { color: '#8f8c86', round: 0.05 })
      .box([1.2, 1.9, 0.1], [0, 1.05, 3.02], { color: '#2a2726' })
      .box([1.1, 1.8, 0.14], [0, 1.0, 3.06], { color: 'steel', name: 'door', pivot: [-0.55, 1.0, 3.06], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .torus([0.5, 0.5, 0.06], [0, 1.1, 3.16], { color: 'red', tube: 0.15, parent: 'door', name: 'wheel0' })
      .stick([-0.24, 1.1, 3.16], [0.24, 1.1, 3.16], 0.04, 'red', { parent: 'wheel0' })
      .stick([0, 0.86, 3.16], [0, 1.34, 3.16], 0.04, 'red', { parent: 'wheel0' })
      .box([1.6, 0.4, 0.04], [0, 2.25, 3.02], { color: 'yellow' })
      .label('SHELTER', [1.4, 0.3], [0, 2.25, 3.05], { color: 'yellow', depth: 0.01 });
    b.pair((s) => b.stick([s * 1.6, 1.8, -1.2], [s * 1.6, 3.2, -1.2], 0.18, 'gray').arc([0.5, 0.5, 0.18], [s * 1.6, 3.2, -1.05], { color: 'gray', rot: [90, 0, 0], tube: 0.3 }));
    return b.act({ click: [[A.pose('wheel0', { rot: [0, 0, -360], dur: 1 }), A.operate('door', 'open'), A.say('Clunk!', 1), A.wait(2.5), A.operate('door', 'close'), A.pose('wheel0', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A four-engined bomber at real size (23 m long, 32 m span): an olive-drab lofted fuselage with a glazed nose,
  // a top turret and tail gun, broad wings with four engines whose propellers start, star roundels, a big tail
  // fin and landing gear.
  e('bomber (plane)', 'garage', 'aircraft', () => {
    const O = '#6b7350';
    // the tall fin as a loft stood upright with level root and tip chords sliding back with height (flush on the
    // fuselage; the shared fin() helper tilts the whole fin)
    const vfin = (root: Vec3, h: number, chord: number, tip: number, thick: number, sweep: number, color: string) => {
      const zf = root[2] + chord / 2, sw = h * Math.tan(sweep / RAD);
      const zb = Math.min(root[2] - chord / 2, zf - sw - tip), D = zf - zb, zc = (zf + zb) / 2;
      return b.loft([thick, D, h], [root[0], root[1] + h / 2, zc], [[0, 1, chord / D, (zc - root[2]) / D], [1, 0.5, tip / D, (zc - (zf - sw - tip / 2)) / D]], { color, boxy: 0.75, rot: [-90, 0, 0], edge: 'sharp' });
    };
    const b = m('bomber (plane)', { view: 'side' })
      .loft([2.4, 2.6, 22.5], [0, 2.8, 0], [[0, 0.2, 0.35, 0.15], [0.12, 0.55, 0.7, 0.08], [0.3, 0.95, 1, 0], [0.85, 1, 1, 0], [0.95, 0.85, 0.85, -0.03], [1, 0.4, 0.45, -0.05]], { color: O, name: 'fuselage' })
      .ball([1.3, 1.3, 1.6], [0, 2.75, 11.0], { color: GL })
      .dome([1.3, 0.7, 1.3], [0, 4.35, 5.5], { color: GL })
      .ball([0.8, 0.9, 0.9], [0, 3.25, -11.2], { color: GL })
      .box([1.8, 0.5, 1.0], [0, 3.5, 9.2], { color: GL, rot: [-20, 0, 0], edge: 'sharp' })
      .socket('pilot', [0.5, 3.0, 8.8], 'seat');
    b.pair((s) => {
      wing(b, [s * 1.1, 2.6, 2.0], s, 15, 5.5, 2.0, 0.7, 6, O);
      wing(b, [s * 0.5, 3.6, -9.8], s, 5.3, 3.2, 1.4, 0.3, 10, O);
      b.cyl([1.4, 0.06, 1.4], [s * 4.5, 2.6, -1.0], { color: 'white', rot: [0, 0, 90], noInk: true });
      b.cyl([0.5, 0.07, 0.5], [s * 4.5, 2.6, -1.0], { color: 'navy', rot: [0, 0, 90], noInk: true });
      b.each(2, (i) => {
        const x0 = s * (4.2 + i * 4.2), z0 = 2.0 - (i + 0.6) * 4.2 * Math.tan(6 / RAD) + 1.8;
        const nm = `prop${s > 0 ? i + 1 : i + 3}`;
        b.cyl([1.2, 3.0, 1.2], [x0, 2.5, z0], { color: O, rot: [90, 0, 0] })
          .cyl([1.25, 0.4, 1.25], [x0, 2.5, z0 + 1.45], { color: '#3a3633', rot: [90, 0, 0] })
          .cone([0.4, 0.4, 0.4], [x0, 2.5, z0 + 1.8], { color: 'darkgray', rot: [90, 0, 0] })
          .box([0.22, 3.4, 0.08], [x0, 2.5, z0 + 1.75], { color: '#2a2726', name: nm, pivot: [x0, 2.5, z0 + 1.75], mover: { kind: 'spin', axis: 'z', amount: 1100 }, edge: 'sharp' });
        b.box([0.22, 3.4, 0.08], [x0, 2.5, z0 + 1.75], { color: '#2a2726', rot: [0, 0, 90], parent: nm, edge: 'sharp' });
      });
      b.stick([s * 4.2, 2.2, 2.6], [s * 4.2, 0.7, 2.6], 0.25, 'darkgray');
      tyre(b, s > 0 ? 'wheelL' : 'wheelR', [s * 4.2, 0.65, 2.6], 1.3, 0.4);
    });
    vfin([0, 3.6, -8.5], 3.9, 5.5, 2.2, 0.38, 32, O);
    b.ball([0.4, 0.4, 0.4], [0, 0.6, -9.5], { color: 'rubber' });
    return b.act({ click: [[A.operate('prop', 'on'), A.say('Rrrrrrrrrrr!', 2.5), A.wait(3), A.operate('prop', 'off')]] }).done();
  }),
  // A bone (30 cm), long shaft and knobbly ends; under the X-ray it glows.
  e('bone', 'clinic', 'bones', () => {
    const b = m('bone').capsule([0.05, 0.26, 0.045], [0, 0.045, 0], { color: 'cream', rot: [0, 0, 90], name: 'bone', mover: { kind: 'light' } });
    b.pair((s) => b.ball(0.055, [s * 0.14, 0.07, 0], { color: 'cream', parent: 'bone' }).ball(0.055, [s * 0.14, 0.028, 0.0], { color: 'cream', parent: 'bone' }));
    return b.act({ click: [[A.operate('bone', 'on'), A.say('Bzzt! X-ray!', 1.5), A.wait(1.2), A.operate('bone', 'off')]] }).done();
  }),
  // A pair of bongo drums joined by a wooden block, skins tacked on with metal rims; they get a quick beat.
  e('bongo (music)', 'music', 'drums', () => {
    const b = m('bongo (music)').box([0.06, 0.07, 0.08], [0, 0.17, 0], { color: 'darkwood', edge: 'sharp' });
    for (const [x0, d, h, n] of [[0.12, 0.18, 0.26, 'drumL'], [-0.11, 0.15, 0.24, 'drumR']] as Array<[number, number, number, string]>) {
      b.cyl([d, h, d], [x0, h / 2, 0], { color: 'wood', taper: 1.3 });
      b.cyl([d * 1.3, 0.012, d * 1.3], [x0, h + 0.006, 0], { color: 'cream', name: n, edge: 'sharp' });
      b.torus([d * 1.36, d * 1.36, 0.025], [x0, h - 0.005, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.08 });
    }
    const hit = (n: string) => [A.pose(n, { move: [0, -0.008, 0], dur: 0.06 }), A.pose(n, { move: [0, 0, 0], dur: 0.08 })];
    return b.act({ click: [[A.say('Bongo, bongo, bong!', 1.5), ...hit('drumL'), ...hit('drumR'), ...hit('drumL'), ...hit('drumL'), ...hit('drumR')]] }).done();
  }),
  // A lilac baby bonnet with a frilled brim on a display head, tied with ribbons that flutter.
  e('bonnet', 'wardrobe', 'hats', () =>
    m('bonnet')
      .cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.12, 0], 0.03, 'darkwood')
      .ball([0.17, 0.2, 0.18], [0, 0.23, 0], { color: 'beige' })
      .ball([0.2, 0.22, 0.19], [0, 0.26, -0.035], { color: '#c8b0e8' })
      .torus([0.21, 0.23, 0.06], [0, 0.255, 0.04], { color: '#c8b0e8', tube: 0.14 })
      .torus([0.23, 0.25, 0.02], [0, 0.255, 0.07], { color: 'white', tube: 0.08 })
      .ball([0.05, 0.04, 0.03], [0, 0.16, 0.07], { color: 'pink', name: 'bow' })
      .box([0.02, 0.07, 0.006], [0.015, 0.11, 0.08], { color: 'pink', rot: [0, 0, 15], parent: 'bow' })
      .box([0.02, 0.07, 0.006], [-0.015, 0.11, 0.08], { color: 'pink', rot: [0, 0, -15], parent: 'bow' })
      .act({ click: [[A.pose('bow', { rot: [0, 0, 20], dur: 0.15 }), A.pose('bow', { rot: [0, 0, -20], dur: 0.2 }), A.pose('bow', { rot: [0, 0, 0], dur: 0.15 })]] })
      .done(),
  ),
  // A bonsai juniper in a shallow blue tray: a twisting trunk, layered pads of foliage; a twig is snipped and
  // regrows.
  e('bonsai', 'garden', 'house plants', () =>
    m('bonsai')
      .box([0.34, 0.08, 0.22], [0, 0.04, 0], { color: 'navy', round: 0.2, edge: 'sharp' })
      .box([0.3, 0.012, 0.18], [0, 0.082, 0], { color: 'dirt', round: 0 })
      .ball([0.04, 0.02, 0.04], [-0.09, 0.09, 0.04], { color: 'darkgreen' })
      .rod([0, 0.08, 0], [0.04, 0.18, 0], 0.04, 'bark')
      .rod([0.04, 0.18, 0], [-0.03, 0.28, 0], 0.035, 'bark')
      .rod([-0.03, 0.28, 0], [0.02, 0.36, 0], 0.03, 'bark')
      .rod([0.04, 0.18, 0], [0.14, 0.22, 0], 0.022, 'bark')
      .rod([-0.03, 0.28, 0], [-0.14, 0.3, 0], 0.022, 'bark')
      .ball([0.16, 0.06, 0.12], [0.02, 0.4, 0], { color: 'darkgreen', name: 'top' })
      .ball([0.15, 0.06, 0.12], [0.16, 0.25, 0], { color: 'darkgreen', parent: 'top' })
      .ball([0.15, 0.06, 0.12], [-0.16, 0.33, 0], { color: '#356b30', parent: 'top' })
      .ball([0.06, 0.04, 0.05], [0.22, 0.27, 0.03], { color: '#4a8a40', name: 'twig', parent: 'top', piece: true })
      .act({ click: [[A.detach('twig', 'twig'), A.say('Snip!', 1)], [A.reattach('twig'), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // A hardback book standing up, gold title on its red cover and ribbon marker; the cover swings open.
  e('book', 'study', 'books', () =>
    m('book', { edge: 'sharp' })
      .box([0.16, 0.24, 0.006], [0, 0.12, -0.016], { color: 'red', round: 0.2 })
      .box([0.012, 0.24, 0.038], [-0.078, 0.12, 0], { color: '#a3322a', round: 0.4 })
      .box([0.15, 0.23, 0.026], [0.004, 0.12, 0], { color: 'paper', round: 0.05 })
      .box([0.16, 0.24, 0.006], [0, 0.12, 0.016], { color: 'red', round: 0.2, name: 'cover', pivot: [-0.08, 0.12, 0.016], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .box([0.11, 0.04, 0.003], [0, 0.18, 0.02], { color: 'gold', round: 0.3, parent: 'cover' })
      .box([0.012, 0.04, 0.002], [0.03, 0.25, -0.004], { color: 'gold', round: 0 })
      .act({ click: [[A.operate('cover', 'open'), A.effect('sparkle', { dur: 1 })], [A.operate('cover', 'close'), A.say('Thump.', 1)]] })
      .done(),
  ),
  // A wooden book stand holding an open book; a page turns.
  e('book holder', 'study', 'books', () => {
    const b = m('book holder', { edge: 'sharp' })
      .box([0.4, 0.02, 0.22], [0, 0.01, 0], { color: 'darkwood', round: 0.3 })
      .box([0.4, 0.28, 0.02], [0, 0.16, -0.04], { color: 'darkwood', rot: [-20, 0, 0], round: 0.3 })
      .box([0.4, 0.03, 0.05], [0, 0.04, 0.03], { color: 'darkwood', round: 0.3 })
      .rod([0, 0.02, -0.1], [0, 0.12, -0.14], 0.02, 'darkwood');
    b.pair((s) => b.box([0.17, 0.24, 0.012], [s * 0.088, 0.17, -0.02], { color: 'paper', rot: [-20, s * 6, 0], round: 0.1 }));
    b.box([0.16, 0.23, 0.003], [0.085, 0.17, -0.008], { color: '#fbf6e0', rot: [-20, 0, 0], round: 0, name: 'page', pivot: [0.0, 0.17, -0.008], mover: { kind: 'swing', axis: 'y', amount: 170 } });
    b.each(5, (i) => b.box([0.1, 0.006, 0.002], [-0.09, 0.24 - i * 0.03, -0.006 + i * 0.011], { color: 'gray', rot: [-20, 0, 0], noInk: true, round: 0 }));
    return b.act({ click: [[A.operate('page', 'open'), A.say('Flip.', 1)], [A.operate('page', 'close'), A.say('Flip.', 1)]] }).done();
  }),
  // A bookshop: a two-storey front with a bay window of books, a sign, and a giant book hung over the door that
  // opens; the door bell rings.
  e('book store', 'places', 'shops', () => {
    const b = bldg('book store', { w: 8, d: 6, floors: 2, wall: '#3f6b5a', trim: 'cream', roof: '#2f3d52', doorColor: 'darkwood', sign: 'BOOKS', signColor: 'cream', shopWindow: true });
    b.each(8, (i) => b.box([0.12, 0.35 + (i % 3) * 0.05, 0.25], [-3.0 + i * 0.13, 0.95, 2.85], { color: RAINBOW[i % 6] }));
    b.each(8, (i) => b.box([0.12, 0.35 + ((i + 1) % 3) * 0.05, 0.25], [2.1 + i * 0.13, 0.95, 2.85], { color: RAINBOW[(i + 3) % 6] }));
    b.stick([2.3, 3.4, 3.0], [2.3, 3.4, 4.0], 0.08, 'darkgray')
      .box([0.9, 1.1, 0.08], [2.3, 2.8, 3.85], { color: 'red', name: 'bigbook' })
      .box([0.9, 1.1, 0.08], [2.3, 2.8, 3.85], { color: 'navy', name: 'bookcover', pivot: [2.3, 2.8, 3.42], mover: { kind: 'swing', axis: 'y', amount: 120 } })
      .box([0.1, 1.1, 0.9], [2.3, 2.8, 3.4], { color: 'cream' });
    return b.act({ click: [[A.operate('door', 'open'), A.operate('bookcover', 'open'), A.say('Ding! Happy reading!', 2), A.wait(2), A.operate('bookcover', 'close'), A.operate('door', 'close')]] }).done();
  }),
  // A wooden bookcase (1.8 m by 0.9 m): five shelves of books of all heights and colours, a plant on top; one book
  // slides out and back.
  e('bookcase', 'home', 'storage', () => {
    const b = m('bookcase', { edge: 'sharp' })
      .box([0.9, 1.8, 0.03], [0, 0.9, -0.145], { color: 'darkwood' })
      .box([0.9, 0.04, 0.32], [0, 1.78, 0], { color: 'wood' })
      .box([0.9, 0.08, 0.32], [0, 0.04, 0], { color: 'wood' });
    b.pair((s) => b.box([0.03, 1.8, 0.32], [s * 0.435, 0.9, 0], { color: 'wood' }));
    b.each(4, (i) => b.box([0.84, 0.025, 0.3], [0, 0.42 + i * 0.34, 0], { color: 'wood' }));
    b.each(5, (r) => {
      let x0 = -0.4;
      b.each(11, (k) => {
        const w = 0.045 + ((r * 7 + k * 3) % 4) * 0.012, h = 0.2 + ((r * 5 + k * 7) % 4) * 0.025;
        if (x0 + w > 0.4) return;
        const isBook = r === 2 && k === 4;
        b.box([w, h, 0.22], [x0 + w / 2, 0.08 + r * 0.34 + h / 2, 0.02], { color: ['#c0392b', '#2f5fa8', '#3f7a3a', '#f2b632', '#8a5fc4', '#5a3a22', '#3fa7a0'][(r * 3 + k) % 7], round: 0.1, name: isBook ? 'book' : undefined, piece: isBook });
        x0 += w + 0.004;
      });
    });
    b.cyl([0.14, 0.14, 0.14], [0.25, 1.87, 0], { color: '#c0603a', taper: 1.2 }).ball([0.25, 0.2, 0.25], [0.25, 2.02, 0], { color: 'leaf', edge: 'soft' });
    return b.socket('top', [-0.15, 1.8, 0], 'top', { size: 0.5 }).act({ click: [[A.pose('book', { move: [0, 0, 0.15], dur: 0.4 }), A.wait(1.2), A.pose('book', { move: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A painted boomerang (50 cm) on a little display stand; it spins off in a loop and comes back.
  e('boomerang', 'sports', 'throwing toys', () =>
    m('boomerang')
      .box([0.12, 0.02, 0.08], [0, 0.01, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.02, 0], [0, 0.1, 0], 0.012, 'darkwood')
      .box([0.3, 0.07, 0.016], [0.1, 0.18, 0], { color: '#c98a45', rot: [0, 0, 25], round: 0.8, name: 'boomerang', pivot: [0, 0.14, 0] })
      .box([0.3, 0.07, 0.016], [-0.1, 0.18, 0], { color: '#c98a45', rot: [0, 0, -25], round: 0.8, parent: 'boomerang' })
      .ball([0.03, 0.03, 0.006], [0.12, 0.19, 0.009], { color: 'white', noInk: true, parent: 'boomerang' })
      .ball([0.03, 0.03, 0.006], [-0.12, 0.19, 0.009], { color: 'red', noInk: true, parent: 'boomerang' })
      .act({ click: [[A.pose('boomerang', { move: [1.2, 0.6, 1.0], rot: [0, 0, 1080], dur: 1.2 }), A.pose('boomerang', { move: [0, 0, 0], rot: [0, 0, 2160], dur: 1.2 }), A.pose('boomerang', { rot: [0, 0, 0], dur: 0.01 }), A.say('Whup whup whup!', 1.5)]] })
      .done(),
  ),
  // A child's booster seat (40 cm): a moulded grey shell, blue padded seat and back, armrests; a child climbs in.
  e('booster seat', 'home', 'baby things', () => {
    const b = m('booster seat')
      .box([0.44, 0.16, 0.42], [0, 0.08, 0], { color: 'darkgray', round: 0.4 })
      .box([0.32, 0.06, 0.32], [0, 0.18, 0.02], { color: 'blue', round: 0.6 })
      .box([0.44, 0.45, 0.1], [0, 0.34, -0.18], { color: 'darkgray', round: 0.5 })
      .box([0.3, 0.32, 0.04], [0, 0.35, -0.12], { color: 'blue', round: 0.6 });
    b.pair((s) => b.box([0.07, 0.13, 0.38], [s * 0.19, 0.22, 0], { color: 'darkgray', round: 0.6 }));
    return b.socket('seat', [0, 0.2, 0.02], 'seat').act({ click: [[A.spawn('kid', 'boy'), A.attach('kid', 'self', 'seat'), A.par(A.anim('arms_up', 1, 'kid'), A.say('Yay! Up high!', 1.5, 'kid')), A.wait(1.5), A.remove('kid', 'fade')]] }).done();
  }),
  // A tall leather riding boot (40 cm): sole and heel, rounded toe, the shaft with a turned-down cuff; it stomps.
  e('boot', 'wardrobe', 'shoes', () =>
    m('boot')
      .box([0.105, 0.016, 0.28], [0, 0.008, 0.04], { color: 'black', round: 0.5 })
      .box([0.1, 0.07, 0.27], [0, 0.045, 0.045], { color: 'darkbrown', round: 0.8 })
      .box([0.09, 0.045, 0.07], [0, 0.025, -0.06], { color: 'black', round: 0.3, edge: 'sharp' })
      .cyl([0.11, 0.3, 0.12], [0, 0.21, -0.04], { color: 'darkbrown', taper: 1.1 })
      .torus([0.128, 0.138, 0.035], [0, 0.36, -0.04], { color: 'tan', rot: [90, 0, 0], tube: 0.15 })
      .act({ click: [[A.anim('hop'), A.par(A.effect('dust', { dur: 1 }), A.say('Stomp!', 1))]] })
      .done(),
  ),
  // A Boston cream pie on a plate: two sponge layers with custard between and a chocolate glaze dripping down; a
  // slice comes out.
  e('boston cream pie', 'food', 'cakes', () => {
    const b = m('boston cream pie')
      .cyl([0.32, 0.015, 0.32], [0, 0.0075, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.24, 0.04, 0.24], [0, 0.035, 0], { color: '#f2d27a', name: 'cake' })
      .cyl([0.236, 0.02, 0.236], [0, 0.065, 0], { color: '#fff1b0' })
      .cyl([0.24, 0.04, 0.24], [0, 0.095, 0], { color: '#f2d27a' })
      .cyl([0.246, 0.016, 0.246], [0, 0.122, 0], { color: 'chocolate' });
    around(7, 0.121).forEach(([x0, z]) => b.capsule([0.018, 0.04, 0.012], [x0, 0.105, z], { color: 'chocolate', rot: [0, Math.atan2(x0, z) * RAD, 0] }));
    b.box([0.06, 0.1, 0.08], [0, 0.065, 0.1], { color: '#f2d27a', name: 'slice', parent: 'cake', piece: true, round: 0.2 })
      .box([0.062, 0.018, 0.082], [0, 0.123, 0.1], { color: 'chocolate', parent: 'slice', round: 0.3 })
      .box([0.062, 0.016, 0.082], [0, 0.065, 0.1], { color: '#fff1b0', parent: 'slice', round: 0.3 });
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // A green glass bottle (30 cm) with a label and a cork; the cork pops out, and goes back in.
  e('bottle', 'kitchen', 'bottles', () =>
    m('bottle')
      .cyl([0.08, 0.19, 0.08], [0, 0.095, 0], { color: '#3f7a4a', name: 'bottle' })
      .ball([0.08, 0.07, 0.08], [0, 0.19, 0], { color: '#3f7a4a' })
      .cyl([0.032, 0.08, 0.032], [0, 0.25, 0], { color: '#3f7a4a' })
      .torus([0.036, 0.036, 0.008], [0, 0.288, 0], { color: '#3f7a4a', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.082, 0.07, 0.082], [0, 0.09, 0], { color: 'cream', edge: 'sharp' })
      .label('1999', [0.05, 0.03], [0, 0.09, 0.041], { color: 'cream', depth: 0.002 })
      .cyl([0.026, 0.035, 0.026], [0, 0.305, 0], { color: 'tan', name: 'cork', parent: 'bottle', piece: true })
      .act({ click: [[A.detach('cork', 'cork'), A.say('Pop!', 1)], [A.reattach('cork')]] })
      .done(),
  ),
  // A bottle opener with a wooden handle, hooked over the cap of a bottle; it levers the cap off with a hiss.
  e('bottle opener', 'kitchen', 'utensils', () =>
    m('bottle opener')
      .cyl([0.065, 0.16, 0.065], [0, 0.08, 0], { color: '#7a4a28', name: 'bottle' })
      .cyl([0.028, 0.05, 0.028], [0, 0.18, 0], { color: '#7a4a28' })
      .cyl([0.032, 0.008, 0.032], [0, 0.209, 0], { color: 'red', segs: 12, name: 'cap', parent: 'bottle', piece: true, edge: 'sharp' })
      .label('FIZZ', [0.04, 0.04], [0, 0.08, 0.033], { color: 'yellow', depth: 0.002 })
      .box([0.05, 0.012, 0.03], [0.01, 0.212, 0], { color: 'silver', name: 'opener', pivot: [-0.016, 0.21, 0], edge: 'sharp', round: 0.2 })
      .box([0.12, 0.022, 0.026], [0.09, 0.212, 0], { color: 'darkwood', parent: 'opener', round: 0.6, edge: 'sharp' })
      .act({ click: [[A.pose('opener', { rot: [0, 0, 25], dur: 0.25 }), A.par(A.detach('cap', 'cap'), A.effect('steam', { dur: 0.8 }), A.say('Pssht!', 1)), A.pose('opener', { rot: [0, 0, 0], dur: 0.2 })], [A.reattach('cap')]] })
      .done(),
  ),
];
