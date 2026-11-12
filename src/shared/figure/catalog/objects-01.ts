/** Catalog chunk objects-01: the words in assign/objects-01.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M, type PartOpts } from '../dsl';
import { face, hat, wear, who } from '../accessories';
import type { Vec3 } from '../types';

/* ---------- local helpers ---------- */

const RAD = 180 / Math.PI;
const RAINBOW = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/** A cone with its base at a and its tip at t (thorns, tines, flukes, teeth, leaves). */
function spike(b: M, a: Vec3, t: Vec3, w: number, color: string, o: PartOpts = {}): M {
  const d = [t[0] - a[0], t[1] - a[1], t[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const rx = Math.atan2(d[2] / len, d[1] / len) * RAD, rz = -Math.asin(Math.max(-1, Math.min(1, d[0] / len))) * RAD;
  return b.cone([w, len, w], [(a[0] + t[0]) / 2, (a[1] + t[1]) / 2, (a[2] + t[2]) / 2], { ...o, color, rot: [rx, 0, rz] });
}

/** Four (or more) wheels on axles along x at ±x, one pair per z; the first one is the rolling 'wheel'. */
function wheels(b: M, x: number, zs: number[], dia: number, t: number, o: { tire?: string; hub?: string; y?: number; named?: boolean } = {}): M {
  let n = o.named === false ? 1 : 0;
  for (const z of zs)
    for (const s of [1, -1]) {
      const at: Vec3 = [s * x, o.y ?? dia / 2, z];
      b.torus([dia, dia, t], at, { color: o.tire ?? 'rubber', rot: [0, 90, 0], tube: 0.34, name: n++ ? undefined : 'wheel' });
      b.cyl([dia * 0.42, t * 0.7, dia * 0.42], at, { color: o.hub ?? 'silver', rot: [0, 0, 90] });
    }
  return b;
}

/** A bottle: body, shoulder, neck, cap and a label band with text. */
function bottle(b: M, o: { h: number; w?: number; x?: number; z?: number; body: string; cap: string; label?: string; text?: string; neck?: number }): M {
  const { h } = o, w = o.w ?? h * 0.38, x = o.x ?? 0, z = o.z ?? 0, nk = o.neck ?? 0.42;
  b.cyl([w, h * 0.62, w], [x, h * 0.31, z], { color: o.body })
    .ball([w, h * 0.3, w], [x, h * 0.62, z], { color: o.body })
    .cyl([w * nk, h * 0.2, w * nk], [x, h * 0.8, z], { color: o.body })
    .cyl([w * nk * 1.15, h * 0.1, w * nk * 1.15], [x, h * 0.94, z], { color: o.cap });
  if (o.label) {
    b.cyl([w * 1.02, h * 0.3, w * 1.02], [x, h * 0.3, z], { color: o.label });
    if (o.text) b.label(o.text, [w * 0.62, h * 0.22], [x, h * 0.3, z + w * 0.5 - 0.006], { color: o.label });
  }
  return b;
}

/** A jar or tin: body in the colour of what is inside, lid, label. */
function jar(b: M, o: { h: number; w: number; x?: number; z?: number; fill: string; lid: string; label?: string; text?: string; tin?: boolean }): M {
  const { h, w } = o, x = o.x ?? 0, z = o.z ?? 0;
  b.cyl([w, h * 0.88, w], [x, h * 0.44, z], { color: o.fill })
    .cyl([w * 1.04, h * 0.14, w * 1.04], [x, h * 0.93, z], { color: o.lid, round: 0.3 });
  if (o.label) {
    b.cyl([w * 1.02, h * 0.45, w * 1.02], [x, h * 0.42, z], { color: o.label });
    if (o.text) b.label(o.text, [w * 0.66, h * 0.3], [x, h * 0.42, z + w * 0.5 - 0.004], { color: o.label });
  }
  return b;
}

/** A shop or small building with a sign over the door. */
function shop(key: string, text: string, o: { w?: number; h?: number; d?: number; wall?: string; roof?: string; flat?: boolean; door?: string; sign?: string; win?: string } = {}): M {
  const w = o.w ?? 5, h = o.h ?? 3, d = o.d ?? 4;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall ?? 'cream', round: 0.05 });
  if (o.flat) b.box([w + 0.3, 0.35, d + 0.3], [0, h + 0.17, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  else b.wedge([w + 0.5, h * 0.55, d + 0.4], [0, h + h * 0.275, 0], { color: o.roof ?? 'red' });
  b.box([w * 0.2, h * 0.55, 0.12], [0, h * 0.275, d / 2], { color: o.door ?? 'darkwood', name: 'door', pivot: [-w * 0.1, h * 0.275, d / 2] })
    .pair((s) => b.box([w * 0.22, h * 0.3, 0.1], [s * w * 0.3, h * 0.42, d / 2], { color: o.win ?? 'glass' }))
    .label(text, [w * 0.72, h * 0.2], [0, h * 0.8, d / 2 + 0.05], { color: o.sign ?? 'white' });
  return b;
}

/** A classical building: steps, a row of columns, a pediment and a name on the frieze. */
function temple(key: string, text: string, o: { w?: number; h?: number; d?: number; col?: string; wall?: string; roof?: string; n?: number } = {}): M {
  const w = o.w ?? 7, h = o.h ?? 4, d = o.d ?? 4, n = o.n ?? 6, c = o.col ?? 'white';
  const b = m(key)
    .box([w + 0.8, 0.3, d + 0.8], [0, 0.15, 0], { color: 'stone', round: 0.05 })
    .box([w + 0.3, 0.3, d + 0.3], [0, 0.45, 0], { color: 'lightgray', round: 0.05 })
    .box([w - 0.6, h, d - 1.2], [0, 0.6 + h / 2, -0.5], { color: o.wall ?? 'beige', round: 0.05 });
  b.each(n, (i) => b.cyl([0.45, h, 0.45], [-w / 2 + 0.45 + (i * (w - 0.9)) / (n - 1), 0.6 + h / 2, d / 2 - 0.35], { color: c }))
    .box([w + 0.2, 0.7, d], [0, 0.95 + h, 0], { color: c, round: 0.05 })
    .wedge([w + 0.4, 1.4, d], [0, 2 + h, 0], { color: o.roof ?? c })
    .label(text, [w * 0.62, 0.5], [0, 0.95 + h, d / 2 + 0.02], { color: c });
  return b;
}

/** A cutaway room: floor, back wall and a side wall on the viewer's left. */
function room(key: string, o: { w?: number; d?: number; h?: number; floor?: string; wall?: string; wall2?: string } = {}): M {
  const w = o.w ?? 3, d = o.d ?? 3, h = o.h ?? 2.4;
  return m(key)
    .box([w, 0.12, d], [0, 0.06, 0], { color: o.floor ?? 'lightwood', round: 0.05 })
    .box([w, h, 0.12], [0, h / 2, -d / 2 + 0.06], { color: o.wall ?? 'cream', round: 0.05 })
    .box([0.12, h, d], [-w / 2 + 0.06, h / 2, 0], { color: o.wall2 ?? o.wall ?? 'cream', round: 0.05 });
}

/** A dress form (mannequin torso on a pole) to show a garment on: torso spans y 0.8..1.36. */
function form(key: string): M {
  return m(key)
    .cyl([0.4, 0.04, 0.4], [0, 0.02, 0], { color: 'darkwood' })
    .stick([0, 0.04, 0], [0, 0.82, 0], 0.035, 'darkwood')
    .box([0.36, 0.56, 0.22], [0, 1.08, 0], { color: 'beige', round: 0.9 })
    .cyl([0.09, 0.1, 0.09], [0, 1.4, 0], { color: 'beige' })
    .ball([0.1, 0.05, 0.1], [0, 1.47, 0], { color: 'darkwood' });
}

/** A tree: trunk, a lumpy crown (the swaying 'top') and fruit hanging on its front. */
function tree(key: string, h: number, o: { trunk?: string; crown?: string; crown2?: string; fruit?: string; fruitSize?: number; tall?: boolean; marks?: string; n?: number } = {}): M {
  const b = m(key);
  const tw = h * 0.075;
  const cw = o.tall ? h * 0.4 : h * 0.62, ch = o.tall ? h * 0.62 : h * 0.55, cy = h - ch / 2;
  b.cyl([tw * 1.3, h * 0.62, tw * 1.3], [0, h * 0.31, 0], { color: o.trunk ?? 'bark', taper: 0.7 });
  if (o.marks) b.each(4, (i) => b.box([tw * 0.5, tw * 0.18, 0.03], [(i % 2 ? 1 : -1) * tw * 0.12, h * (0.1 + i * 0.1), tw * 0.58], { color: o.marks, noInk: true, round: 0.5 }));
  b.ball([cw, ch, cw], [0, cy, 0], { color: o.crown ?? 'leaf', name: 'top' });
  b.pair((s) => b.ball([cw * 0.62, ch * 0.6, cw * 0.62], [s * cw * 0.36, cy - ch * 0.14, cw * 0.06], { color: o.crown2 ?? o.crown ?? 'leaf', parent: 'top' }));
  if (o.fruit) {
    const fs = o.fruitSize ?? h * 0.05;
    const n = o.n ?? 7;
    b.each(n, (i) => {
      const a = -1.1 + (2.2 * i) / (n - 1);
      const y = cy - ch * 0.2 + (i % 3) * ch * 0.16;
      const r = (cw / 2) * Math.sqrt(Math.max(0.2, 1 - ((y - cy) / (ch / 2)) ** 2)) * 0.97;
      b.ball([fs, fs * 1.05, fs], [Math.sin(a) * r, y, Math.cos(a) * r], { color: o.fruit!, parent: 'top' });
    });
  }
  return b;
}

/** A shallow bowl with a mound of something in it. */
function bowl(b: M, o: { d: number; h: number; x?: number; z?: number; color?: string; fill?: string }): M {
  const x = o.x ?? 0, z = o.z ?? 0;
  b.cyl([o.d * 0.7, o.h, o.d * 0.7], [x, o.h / 2, z], { color: o.color ?? 'white', taper: 1.43 });
  if (o.fill) b.ball([o.d * 0.92, o.h * 0.7, o.d * 0.92], [x, o.h * 0.95, z], { color: o.fill });
  return b;
}

/** A sign card on a short post with a base (symbols, letters). */
function plinth(b: M, w: number, color = 'darkwood'): M {
  return b.box([w, 0.03, w * 0.5], [0, 0.015, 0], { color, round: 0.3 });
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
  e('abacus', 'study', 'math tools', () => {
    const b = m('abacus')
      .box([0.34, 0.03, 0.07], [0, 0.015, 0], { color: 'darkwood' })
      .box([0.34, 0.03, 0.07], [0, 0.205, 0], { color: 'darkwood' });
    b.pair((s) => b.box([0.03, 0.22, 0.07], [s * 0.155, 0.11, 0], { color: 'darkwood' }));
    b.each(4, (i) => {
      const y = 0.05 + i * 0.04;
      b.stick([-0.14, y, 0], [0.14, y, 0], 0.005, 'metal');
      b.each(4, (k) => b.ball([0.026, 0.026, 0.03], [-0.12 + k * 0.027 + (i % 2) * 0.09, y, 0], { color: RAINBOW[i] }));
    });
    return b.done();
  }),
  e('accordion', 'music', 'squeezeboxes', () => {
    const b = m('accordion');
    b.pair((s) => b.box([0.1, 0.44, 0.2], [s * 0.17, 0.23, 0], { color: 'red', round: 0.2 }));
    b.each(7, (i) => b.box([0.03, 0.4, 0.19], [-0.105 + i * 0.035, 0.23, 0], { color: i % 2 ? 'white' : 'black', round: 0.5 }));
    b.box([0.06, 0.38, 0.02], [-0.17, 0.23, 0.105], { color: 'white', round: 0.1 });
    b.each(5, (i) => b.box([0.035, 0.03, 0.02], [-0.185, 0.1 + i * 0.065, 0.115], { color: 'black', round: 0.2 }));
    b.each(6, (i) => b.ball(0.022, [0.15 + (i % 2) * 0.03, 0.12 + Math.floor(i / 2) * 0.08, 0.105], { color: 'cream' }));
    b.rod([0.17, 0.46, 0], [-0.17, 0.46, 0], 0.025, 'black');
    return b.done();
  }),
  e('acid', 'study', 'lab chemicals', () =>
    m('acid')
      .cyl([0.13, 0.06, 0.13], [0, 0.03, 0], { color: 'lime', taper: 0.72, glow: true })
      .cyl([0.094, 0.06, 0.094], [0, 0.09, 0], { color: 'glass', taper: 0.45 })
      .cyl([0.04, 0.05, 0.04], [0, 0.14, 0], { color: 'glass' })
      .torus([0.05, 0.05, 0.012], [0, 0.165, 0], { color: 'glass', rot: [90, 0, 0] })
      .ball(0.02, [0.01, 0.19, 0], { color: 'lime', glow: true })
      .ball(0.026, [-0.012, 0.22, 0.004], { color: 'lime', glow: true })
      .ball(0.018, [0.006, 0.25, 0], { color: 'lime', glow: true })
      .label('ACID', [0.06, 0.03], [0, 0.06, 0.046], { color: 'yellow', rot: [-20, 0, 0] })
      .done(),
  ),
  e('acorn', 'garden', 'nuts and seeds', () =>
    m('acorn')
      .ball([0.05, 0.065, 0.05], [0, 0.034, 0], { color: '#b5793a' })
      .ball(0.012, [0, 0.004, 0], { color: '#8c5a2b' })
      .ball([0.058, 0.032, 0.058], [0, 0.064, 0], { color: '#6b4a2a' })
      .rod([0, 0.078, 0], [0.006, 0.095, 0], 0.008, 'darkbrown')
      .done(),
  ),
  e('acoustic guitar', 'music', 'strings', () => {
    const b = m('acoustic guitar')
      .ball([0.44, 0.38, 0.12], [0, 0.2, 0], { color: '#d9a066' })
      .ball([0.34, 0.3, 0.12], [0, 0.45, 0], { color: '#d9a066' })
      .box([0.06, 0.45, 0.04], [0, 0.76, 0], { color: 'darkwood' })
      .box([0.09, 0.13, 0.04], [0, 1.04, -0.01], { color: 'darkwood', rot: [-8, 0, 0] })
      .cyl([0.1, 0.01, 0.1], [0, 0.33, 0.055], { color: 'black', rot: [90, 0, 0] })
      .torus([0.12, 0.12, 0.012], [0, 0.33, 0.055], { color: 'cream', tube: 0.12 })
      .box([0.12, 0.02, 0.02], [0, 0.14, 0.055], { color: 'darkwood' });
    b.each(3, (i) => b.stick([-0.012 + i * 0.012, 0.14, 0.058], [-0.012 + i * 0.012, 0.98, 0.025], 0.003, 'silver', { noInk: true }));
    b.pair((s) => b.each(3, (i) => b.ball(0.018, [s * 0.055, 0.995 + i * 0.035, -0.01], { color: 'silver' })));
    return b.done();
  }),
  e("adam's apple", 'clinic', 'body parts', () =>
    m("adam's apple")
      .ball([0.38, 0.12, 0.2], [0, 0.06, 0], { color: 'skyblue' })
      .torus([0.15, 0.15, 0.03], [0, 0.11, 0.0], { color: 'white', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.12, 0.16, 0.12], [0, 0.17, 0], { color: 'skin2' })
      .ball([0.16, 0.13, 0.18], [0, 0.29, 0.02], { color: 'skin2' })
      .ball([0.035, 0.045, 0.03], [0, 0.18, 0.058], { color: 'skin3' })
      .done(),
  ),
  e('address book', 'study', 'books', () => {
    const b = m('address book')
      .box([0.15, 0.2, 0.008], [0, 0.1, 0.016], { color: 'maroon', round: 0.2 })
      .box([0.15, 0.2, 0.008], [0, 0.1, -0.016], { color: 'maroon', round: 0.2 })
      .box([0.012, 0.2, 0.04], [-0.072, 0.1, 0], { color: 'maroon', round: 0.4 })
      .box([0.142, 0.19, 0.026], [0.003, 0.1, 0], { color: 'paper', round: 0.1 });
    b.each(6, (i) => b.box([0.018, 0.024, 0.022], [0.078, 0.17 - i * 0.028, 0], { color: RAINBOW[i], round: 0.3 }));
    b.label('A-Z', [0.08, 0.04], [0, 0.135, 0.022], { color: 'gold' });
    return b.done();
  }),
  e('air compressor', 'workshop', 'power tools', () => {
    const b = m('air compressor')
      .capsule([0.3, 0.72, 0.3], [0, 0.27, 0], { color: 'red', rot: [0, 0, 90] })
      .box([0.24, 0.16, 0.2], [0.05, 0.5, 0], { color: 'darkgray' })
      .cyl([0.11, 0.14, 0.11], [-0.14, 0.49, 0], { color: 'black' })
      .cyl([0.08, 0.02, 0.08], [0.22, 0.48, 0.06], { color: 'white', rot: [90, 0, 0] })
      .torus([0.2, 0.2, 0.035], [-0.12, 0.27, 0.17], { color: 'black', tube: 0.15 })
      .rod([0.32, 0.12, 0], [0.42, 0.45, 0], 0.025, 'black');
    b.pair((s) => b.torus([0.14, 0.14, 0.05], [0.24, 0.07, s * 0.15], { color: 'rubber', tube: 0.35 }));
    b.pair((s) => b.box([0.05, 0.08, 0.05], [-0.28, 0.04, s * 0.1], { color: 'rubber' }));
    return b.done();
  }),
  e('air conditioning', 'home', 'appliances', () => {
    const b = m('air conditioning')
      .box([0.85, 0.72, 0.36], [0, 0.42, 0], { color: 'lightgray', round: 0.12 })
      .cyl([0.56, 0.03, 0.56], [-0.1, 0.42, 0.18], { color: 'darkgray', rot: [90, 0, 0] })
      .torus([0.58, 0.58, 0.03], [-0.1, 0.42, 0.19], { color: 'gray', tube: 0.06 })
      .cyl([0.08, 0.04, 0.08], [-0.1, 0.42, 0.2], { color: 'gray', rot: [90, 0, 0], name: 'fan' });
    b.each(3, (i) => b.box([0.07, 0.24, 0.015], [-0.1 + Math.sin((i * 2 * Math.PI) / 3) * 0.12, 0.42 + Math.cos((i * 2 * Math.PI) / 3) * 0.12, 0.2], { color: 'silver', rot: [0, 0, -i * 120], parent: 'fan', round: 0.8 }));
    b.each(4, (i) => b.box([0.18, 0.02, 0.02], [0.3, 0.25 + i * 0.1, 0.18], { color: 'gray', noInk: true }));
    b.ball([0.04, 0.04, 0.02], [0.3, 0.68, 0.18], { color: 'cyan', glow: true });
    b.pair((s) => b.box([0.1, 0.06, 0.4], [s * 0.33, 0.03, 0], { color: 'darkgray' }));
    return b.done();
  }),
  e('air filter', 'home', 'appliances', () => {
    const b = m('air filter')
      .box([0.26, 0.42, 0.26], [0, 0.21, 0], { color: 'white', round: 0.5 })
      .cyl([0.2, 0.02, 0.2], [0, 0.42, 0], { color: 'darkgray' })
      .torus([0.18, 0.18, 0.01], [0, 0.432, 0], { color: 'cyan', rot: [90, 0, 0], glow: true, tube: 0.08 });
    b.each(6, (i) => b.box([0.018, 0.26, 0.01], [-0.075 + i * 0.03, 0.2, 0.13], { color: 'lightgray', noInk: true }));
    b.ball([0.03, 0.03, 0.01], [0, 0.37, 0.13], { color: 'lime', glow: true });
    return b.done();
  }),
  e('air horn', 'garage', 'car parts', () =>
    m('air horn', { view: 'side' })
      .box([0.08, 0.04, 0.3], [0, 0.02, -0.02], { color: 'darkgray' })
      .cyl([0.035, 0.36, 0.035], [0.025, 0.08, 0.0], { color: 'silver', rot: [90, 0, 0], taper: 1.6 })
      .cyl([0.085, 0.07, 0.085], [0.025, 0.08, 0.2], { color: 'silver', rot: [90, 0, 0], taper: 1.5 })
      .cyl([0.03, 0.26, 0.03], [-0.025, 0.14, -0.04], { color: 'silver', rot: [90, 0, 0], taper: 1.6 })
      .cyl([0.07, 0.06, 0.07], [-0.025, 0.14, 0.11], { color: 'silver', rot: [90, 0, 0], taper: 1.5 })
      .box([0.07, 0.12, 0.04], [0, 0.08, -0.16], { color: 'darkgray' })
      .rod([0, 0.06, -0.18], [0, 0.04, -0.3], 0.02, 'black')
      .done(),
  ),
  e('air mattress', 'sports', 'camping gear', () => {
    const b = m('air mattress', { view: 'side' }).box([0.8, 0.15, 1.9], [0, 0.085, 0], { color: '#3a7bd5', round: 0.6 });
    b.each(5, (i) => b.capsule([0.16, 1.5, 0.12], [-0.32 + i * 0.16, 0.15, -0.15], { color: '#4f8fe6', rot: [90, 0, 0] }));
    b.box([0.74, 0.14, 0.3], [0, 0.19, 0.75], { color: '#7fb0f0', round: 0.8 });
    b.cyl([0.03, 0.03, 0.03], [0.38, 0.1, -0.85], { color: 'white', rot: [0, 0, 90] });
    return b.done();
  }),
  e('air tank', 'sports', 'diving gear', () =>
    m('air tank')
      .capsule([0.18, 0.6, 0.18], [0, 0.3, 0], { color: 'yellow' })
      .torus([0.19, 0.19, 0.03], [0, 0.42, 0], { color: 'black', rot: [90, 0, 0], tube: 0.12 })
      .torus([0.19, 0.19, 0.03], [0, 0.22, 0], { color: 'black', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.045, 0.06, 0.045], [0, 0.63, 0], { color: 'silver' })
      .cyl([0.05, 0.02, 0.05], [0.04, 0.65, 0], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.06, 0.04, 0.06], [-0.04, 0.65, 0], { color: 'metal', rot: [0, 0, 90] })
      .rod([-0.06, 0.65, 0], [-0.13, 0.6, 0.05], 0.022, 'black')
      .rod([-0.13, 0.6, 0.05], [-0.14, 0.4, 0.08], 0.022, 'black')
      .cyl([0.06, 0.03, 0.06], [-0.14, 0.38, 0.09], { color: 'darkgray', rot: [90, 0, 0] })
      .done(),
  ),
  e('air vent', 'home', 'fixtures', () => {
    const b = m('air vent')
      .box([0.32, 0.2, 0.03], [0, 0.1, 0], { color: 'white', round: 0.2 })
      .box([0.27, 0.15, 0.02], [0, 0.1, 0.008], { color: 'darkgray', round: 0.1 });
    b.each(5, (i) => b.box([0.27, 0.012, 0.03], [0, 0.04 + i * 0.03, 0.016], { color: 'white', rot: [-30, 0, 0], round: 0.3 }));
    b.pair((s) => b.ball(0.012, [s * 0.145, 0.1, 0.016], { color: 'silver' }));
    return b.done();
  }),
  e('airbag', 'garage', 'car parts', () =>
    m('airbag')
      .box([0.6, 0.2, 0.3], [0, 0.1, -0.15], { color: 'darkgray', round: 0.4 })
      .rod([0, 0.18, -0.08], [0, 0.36, 0.02], 0.06, 'black')
      .torus([0.42, 0.42, 0.05], [0, 0.42, 0.04], { color: 'black', rot: [-20, 0, 0], tube: 0.12 })
      .stick([-0.18, 0.42, 0.04], [0.18, 0.42, 0.04], 0.04, 'black')
      .ball([0.36, 0.32, 0.22], [0, 0.45, 0.17], { color: 'white' })
      .ball([0.16, 0.12, 0.05], [0.06, 0.5, 0.27], { color: 'wool', noInk: true })
      .done(),
  ),
  e('aircraft carrier', 'garage', 'ships', () => {
    const b = m('aircraft carrier', { view: 'side' })
      .box([2.6, 1.8, 16], [0, 0.9, 0], { color: 'gray', round: 0.4 })
      .box([2.7, 0.25, 16.6], [0, 0.12, 0], { color: 'darkred', round: 0.3 })
      .box([3.8, 0.3, 17.5], [0, 1.95, 0.3], { color: 'darkgray', round: 0.1 })
      .box([0.8, 2, 2.6], [1.4, 3.1, -1.5], { color: 'gray', round: 0.15 })
      .box([0.82, 0.3, 2.3], [1.4, 3.6, -1.5], { color: 'navy', noInk: true })
      .stick([1.4, 4.1, -1.5], [1.4, 5.4, -1.5], 0.15, 'darkgray')
      .box([0.6, 0.1, 0.8], [1.4, 4.8, -1.5], { color: 'gray' })
      .box([0.12, 0.02, 15], [0, 2.11, 0.3], { color: 'yellow', noInk: true })
      .label('75', [1.1, 0.7], [1.82, 3.1, -1.5], { color: 'gray', rot: [0, 90, 0] });
    for (const z of [3.5, -5.5]) b.capsule([0.3, 1.6, 0.3], [-0.6, 2.25, z], { color: 'lightgray', rot: [90, 0, 0] }).box([1.5, 0.08, 0.5], [-0.6, 2.2, z + 0.1], { color: 'lightgray' });
    return b.done();
  }),
  e('airlock', 'garage', 'spacecraft', () => {
    const b = m('airlock')
      .box([2.4, 2.4, 0.4], [0, 1.2, 0], { color: 'lightgray', round: 0.1 })
      .torus([1.75, 1.75, 0.2], [0, 1.2, 0.2], { color: 'metal', tube: 0.12 })
      .cyl([1.55, 0.12, 1.55], [0, 1.2, 0.24], { color: 'silver', rot: [90, 0, 0], name: 'door', pivot: [-0.77, 1.2, 0.24] })
      .torus([0.6, 0.6, 0.06], [0, 1.2, 0.32], { color: 'red', tube: 0.12, parent: 'door' })
      .stick([-0.28, 1.2, 0.32], [0.28, 1.2, 0.32], 0.05, 'red', { parent: 'door' })
      .stick([0, 0.92, 0.32], [0, 1.48, 0.32], 0.05, 'red', { parent: 'door' })
      .ball([0.16, 0.1, 0.1], [0, 2.3, 0.22], { color: 'red', glow: true })
      .label('AIRLOCK', [1.2, 0.22], [0, 2.18, 0.21], { color: 'yellow' });
    b.each(5, (i) => b.box([0.3, 0.16, 0.03], [-0.9 + i * 0.45, 0.12, 0.21], { color: i % 2 ? 'black' : 'yellow', rot: [0, 0, 30], noInk: true }));
    return b.done();
  }),
  e('airplane', 'garage', 'aircraft', () => {
    const b = m('airplane', { view: 'side' })
      .capsule([2.2, 14, 2.2], [0, 2.4, 0], { color: 'white', rot: [90, 0, 0] })
      .box([2.24, 0.25, 9], [0, 2.8, 0.6], { color: 'navy', noInk: true })
      .ball([1.2, 0.5, 0.8], [0, 2.9, 6.3], { color: 'navy' })
      .box([14, 0.25, 2.4], [0, 1.9, 0.4], { color: 'lightgray', rot: [0, 0, 0] })
      .wedge([3.2, 2.8, 0.25], [0, 4.6, -5.6], { color: 'red', rot: [0, 90, 0], apex: 0.3 })
      .box([5, 0.18, 1.3], [0, 3.1, -6.2], { color: 'lightgray' });
    b.pair((s) => b.cyl([0.9, 1.8, 0.9], [s * 2.6, 1.4, 0.9], { color: 'gray', rot: [90, 0, 0] }));
    b.stick([0, 1.3, 4.2], [0, 0.35, 4.2], 0.15, 'darkgray').ball([0.35, 0.5, 0.5], [0, 0.25, 4.2], { color: 'rubber', name: 'wheel' });
    b.pair((s) => b.stick([s * 1.2, 1.4, -0.6], [s * 1.2, 0.35, -0.6], 0.15, 'darkgray').ball([0.4, 0.55, 0.55], [s * 1.2, 0.27, -0.6], { color: 'rubber' }));
    return b.done();
  }),
  e('airport', 'places', 'transport hubs', () => {
    const b = m('airport')
      .box([9, 2.6, 3.4], [0, 1.3, 0], { color: 'lightgray', round: 0.05 })
      .box([8.4, 1.6, 0.1], [0, 1.2, 1.7], { color: 'glass', round: 0.05 })
      .capsule([3.6, 9.8, 4.2], [0, 2.6, 0], { color: 'white', rot: [0, 0, 90] })
      .label('AIRPORT', [3.6, 0.55], [0, 2.4, 1.95], { color: 'navy' })
      .cyl([0.8, 5, 0.8], [3.4, 5, -0.6], { color: 'white' })
      .cyl([1.6, 1.1, 1.6], [3.4, 7.9, -0.6], { color: 'glass', taper: 1.25 })
      .cyl([2.2, 0.3, 2.2], [3.4, 8.6, -0.6], { color: 'darkgray' })
      .stick([3.4, 8.7, -0.6], [3.4, 9.6, -0.6], 0.08, 'gray')
      .ball(0.25, [3.4, 9.7, -0.6], { color: 'red', glow: true })
      .capsule([0.5, 3.2, 0.5], [-3, 0.5, 3.2], { color: 'white', rot: [0, 90, 0] })
      .box([0.6, 0.08, 3.4], [-3.2, 0.5, 3.2], { color: 'lightgray' })
      .wedge([0.9, 0.8, 0.08], [-4.4, 0.95, 3.2], { color: 'blue', rot: [0, 90, 0], apex: 0.4 });
    return b.done();
  }),
  e('aisle', 'places', 'shop interiors', () => {
    const b = m('aisle').box([3, 0.06, 4], [0, 0.03, 0], { color: 'lightgray', round: 0.1 });
    const goods = ['red', 'yellow', 'blue', 'green', 'orange', 'pink', 'purple', 'teal', 'cream'];
    b.pair((s) => {
      b.box([0.7, 1.9, 3.6], [s * 1.05, 1.0, 0], { color: 'white', round: 0.05 });
      b.each(3, (r) => b.each(3, (k) => b.box([0.12, 0.38, 1.0], [s * 0.68, 0.35 + r * 0.6, -1.15 + k * 1.15], { color: goods[(r * 3 + k + (s > 0 ? 4 : 0)) % 9], round: 0.2 })));
    });
    b.stick([0, 2.1, 0], [0, 2.6, 0], 0.04, 'gray').label('5', [0.6, 0.45], [0, 1.95, 0], { color: 'blue' });
    return b.done();
  }),
  e('alarm clock', 'home', 'clocks', () => {
    const b = m('alarm clock')
      .cyl([0.12, 0.05, 0.12], [0, 0.085, 0], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.1, 0.01, 0.1], [0, 0.085, 0.026], { color: 'white', rot: [90, 0, 0] })
      .box([0.006, 0.04, 0.004], [0, 0.1, 0.033], { color: 'black', round: 0 })
      .box([0.03, 0.006, 0.004], [0.013, 0.085, 0.033], { color: 'black', round: 0 })
      .stick([0, 0.145, 0], [0, 0.175, 0], 0.005, 'silver')
      .box([0.04, 0.008, 0.008], [0, 0.17, 0], { color: 'silver' });
    b.pair((s) => b.ball([0.06, 0.035, 0.05], [s * 0.04, 0.155, 0], { color: 'silver', rot: [0, 0, -s * 35] }));
    b.pair((s) => b.rod([s * 0.03, 0.04, 0], [s * 0.045, 0.006, 0.01], 0.012, 'silver'));
    return b.done();
  }),
  e('almond', 'food', 'nuts', () => {
    const b = bowl(m('almond'), { d: 0.14, h: 0.045, color: 'white' });
    const nuts: Array<[number, number, number, number]> = [[0, 0.06, 0, 0], [0.03, 0.055, 0.02, 60], [-0.03, 0.055, 0.015, -50], [0.005, 0.055, -0.03, 100]];
    for (const [x, y, z, r] of nuts) b.ball([0.022, 0.034, 0.014], [x, y, z], { color: '#b07040', rot: [-70, r, 0] });
    b.ball([0.022, 0.034, 0.014], [0.012, 0.075, 0.04], { color: '#a5653a', rot: [-20, 0, 15] });
    return b.done();
  }),
  e('alphabet', 'ideas', 'letters', () => {
    const b = m('alphabet');
    const blocks: Array<[string, number, number, string]> = [['A', -0.085, 0.08, 'red'], ['B', 0.085, 0.08, 'blue'], ['C', 0, 0.24, 'green']];
    for (const [t, x, y, c] of blocks) b.box([0.16, 0.16, 0.16], [x, y, 0], { color: 'cream', round: 0.15 }).label(t, [0.12, 0.12], [x, y, 0.08], { color: c });
    return b.done();
  }),
  e('amber', 'nature', 'gems and minerals', () =>
    m('amber')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'darkwood', round: 0.4 })
      .ball([0.065, 0.085, 0.04], [0, 0.06, 0], { color: '#f0a020' })
      .ball([0.025, 0.03, 0.01], [-0.012, 0.075, 0.016], { color: '#ffd27a', noInk: true })
      .ball([0.008, 0.016, 0.006], [0.004, 0.055, 0.019], { color: 'darkbrown', noInk: true })
      .ball([0.016, 0.006, 0.004], [-0.004, 0.06, 0.02], { color: '#8a6a4a', noInk: true, rot: [0, 0, 30] })
      .ball([0.016, 0.006, 0.004], [0.012, 0.06, 0.02], { color: '#8a6a4a', noInk: true, rot: [0, 0, -30] })
      .done(),
  ),
  e('ambulance', 'garage', 'emergency vehicles', () => {
    const b = m('ambulance', { view: 'side' })
      .box([1.9, 2.0, 3.4], [0, 1.45, -0.6], { color: 'white', round: 0.12 })
      .box([1.9, 1.4, 1.5], [0, 1.15, 1.8], { color: 'white', round: 0.25 })
      .box([1.7, 0.6, 0.3], [0, 1.55, 2.45], { color: 'glass', rot: [-15, 0, 0] })
      .box([1.94, 0.24, 4.9], [0, 1.0, 0.15], { color: 'red', noInk: true })
      .box([0.04, 0.7, 0.22], [0.97, 1.65, -0.6], { color: 'red', round: 0 })
      .box([0.04, 0.22, 0.7], [0.97, 1.65, -0.6], { color: 'red', round: 0 })
      .box([0.5, 0.18, 0.3], [0.3, 2.55, 0.8], { color: 'red', glow: true })
      .box([0.5, 0.18, 0.3], [-0.3, 2.55, 0.8], { color: 'blue', glow: true })
      .ball([0.3, 0.2, 0.06], [0.6, 0.8, 2.55], { color: 'yellow', glow: true });
    wheels(b, 0.85, [1.6, -1.5], 0.8, 0.28);
    return b.done();
  }),
  e('american cheese', 'food', 'cheese', () => {
    const b = m('american cheese').cyl([0.16, 0.012, 0.16], [0, 0.006, 0], { color: 'white' });
    b.each(6, (i) => b.box([0.09, 0.005, 0.09], [0, 0.016 + i * 0.007, 0], { color: i % 2 ? '#f5a623' : '#f7b23b', rot: [0, i * 12 - 30, 0], round: 0.1 }));
    b.box([0.09, 0.004, 0.06], [0.01, 0.06, 0.012], { color: '#f7b23b', rot: [-30, 20, 0], round: 0.1 });
    return b.done();
  }),
  e('ammonia', 'home', 'cleaning', () => bottle(m('ammonia'), { h: 0.26, w: 0.1, body: '#e6f2fb', cap: 'blue', label: 'yellow', text: 'AMMONIA' }).done()),
  e('amp', 'music', 'audio gear', () => {
    const b = m('amp')
      .box([0.38, 0.3, 0.2], [0, 0.15, 0], { color: 'black', round: 0.12 })
      .box([0.33, 0.17, 0.02], [0, 0.11, 0.1], { color: 'darkgray', round: 0.1 })
      .box([0.33, 0.05, 0.02], [0, 0.25, 0.1], { color: 'gold', round: 0.1 })
      .label('AMP', [0.08, 0.035], [-0.1, 0.17, 0.112], { color: 'white' })
      .rod([-0.08, 0.31, 0], [0.08, 0.31, 0], 0.025, 'black');
    b.each(5, (i) => b.cyl([0.022, 0.02, 0.022], [-0.12 + i * 0.05, 0.25, 0.115], { color: 'black', rot: [90, 0, 0] }));
    b.pair((s) => b.pair((t) => b.box([0.04, 0.04, 0.04], [s * 0.18, 0.15 + t * 0.14, 0.09], { color: 'silver', round: 0.3 })));
    return b.done();
  }),
  e('amphitheater', 'places', 'landmarks', () => {
    const b = m('amphitheater')
      .cyl([8, 0.3, 8], [0, 0.15, 0], { color: 'sand' })
      .torus([8.4, 8.4, 1.5], [0, 0.75, 0], { color: 'stone', rot: [90, 0, 0], tube: 0.14 })
      .torus([10.4, 10.4, 3.6], [0, 1.8, 0], { color: '#d8c9a6', rot: [90, 0, 0], tube: 0.1 });
    for (const [row, y] of [[0, 1.0], [1, 2.4]] as const)
      around(10, 5.16, row * 0.3).forEach(([x, z]) => b.box([0.55, 0.9, 0.2], [x, y, z], { color: '#6b5a44', rot: [0, Math.atan2(x, z) * RAD, 0], noInk: true, round: 0.5 }));
    return b.done();
  }),
  e('amulet', 'fantasy', 'magic items', () =>
    m('amulet')
      .torus([0.1, 0.12, 0.01], [0, 0.11, 0], { color: 'gold', tube: 0.06 })
      .cyl([0.06, 0.012, 0.06], [0, 0.035, 0], { color: 'gold', rot: [90, 0, 0] })
      .torus([0.066, 0.066, 0.016], [0, 0.035, 0], { color: 'gold', tube: 0.15 })
      .ball([0.032, 0.032, 0.02], [0, 0.035, 0.008], { color: 'purple', glow: true })
      .ball(0.012, [0, 0.067, 0], { color: 'gold' })
      .done(),
  ),
  e('amusement park', 'places', 'parks', () => {
    const b = m('amusement park')
      .cyl([11, 0.15, 7], [0, 0.075, 0], { color: 'grass' })
      .rod([1.2, 0.15, -0.6], [2.5, 3.4, -0.6], 0.18, 'gray')
      .rod([3.8, 0.15, -0.6], [2.5, 3.4, -0.6], 0.18, 'gray')
      .torus([5, 5, 0.2], [2.5, 3.4, -0.4], { color: 'pink', tube: 0.04, name: 'fan' })
      .cyl([0.4, 0.3, 0.4], [2.5, 3.4, -0.4], { color: 'gray', rot: [90, 0, 0], parent: 'fan' });
    b.each(4, (i) => { const a = (i * Math.PI) / 4; b.stick([2.5 - Math.cos(a) * 2.4, 3.4 - Math.sin(a) * 2.4, -0.4], [2.5 + Math.cos(a) * 2.4, 3.4 + Math.sin(a) * 2.4, -0.4], 0.06, 'white', { parent: 'fan' }); });
    b.each(8, (i) => { const a = (i * Math.PI) / 4; b.box([0.5, 0.5, 0.5], [2.5 + Math.cos(a) * 2.45, 3.4 + Math.sin(a) * 2.45, -0.2], { color: RAINBOW[i % 6], parent: 'fan', round: 0.4 }); });
    b.each(3, (i) => b.cyl([3 - i * 0.9, 0.8, 3 - i * 0.9], [-2.8, 0.55 + i * 0.8, 0.4], { color: i % 2 ? 'white' : 'red', taper: (3 - (i + 1) * 0.9) / (3 - i * 0.9) }));
    b.cone([0.8, 0.6, 0.8], [-2.8, 2.65, 0.4], { color: 'red' });
    b.stick([-2.8, 2.9, 0.4], [-2.8, 3.5, 0.4], 0.05, 'gray').wedge([0.5, 0.35, 0.03], [-2.55, 3.35, 0.4], { color: 'yellow', rot: [0, 0, -90] });
    b.pair((s) => b.stick([s * 1.4, 0.15, 3.0], [s * 1.4, 2.0, 3.0], 0.15, 'red'));
    b.label('FUNFAIR', [3.2, 0.6], [0, 2.1, 3.0], { color: 'yellow' });
    return b.done();
  }),
  e('anchor (boat)', 'sea', 'nautical', () => {
    const b = m('anchor (boat)')
      .stick([0, 0.25, 0], [0, 1.8, 0], 0.13, 'iron')
      .torus([0.36, 0.36, 0.07], [0, 1.98, 0], { color: 'iron', tube: 0.22 })
      .stick([-0.5, 1.6, 0], [0.5, 1.6, 0], 0.09, 'iron')
      .ball(0.22, [0, 0.22, 0], { color: 'iron' })
      .rod([0.12, 2.05, 0.04], [0.35, 1.7, 0.1], 0.05, 'tan')
      .rod([0.35, 1.7, 0.1], [0.3, 1.2, 0.12], 0.05, 'tan');
    b.pair((s) => {
      b.ball(0.13, [s * 0.5, 1.6, 0], { color: 'iron' });
      b.rod([0, 0.2, 0], [s * 0.32, 0.12, 0], 0.11, 'iron').rod([s * 0.32, 0.12, 0], [s * 0.58, 0.28, 0], 0.11, 'iron').rod([s * 0.58, 0.28, 0], [s * 0.7, 0.55, 0], 0.11, 'iron');
      spike(b, [s * 0.62, 0.42, 0], [s * 0.76, 0.8, 0], 0.3, 'iron', { segs: 3 });
    });
    return b.done();
  }),
  e('angel food cake', 'food', 'cakes', () => {
    const b = m('angel food cake')
      .cyl([0.32, 0.015, 0.32], [0, 0.008, 0], { color: 'white' })
      .cyl([0.24, 0.1, 0.24], [0, 0.065, 0], { color: '#e3b874', taper: 0.88 })
      .cyl([0.07, 0.102, 0.07], [0, 0.066, 0], { color: '#fff1d0', taper: 0.88 })
      .ball([0.2, 0.025, 0.2], [0, 0.115, 0], { color: '#c98a45' });
    around(5, 0.075).forEach(([x, z], i) => b.ball(0.03, [x, 0.13, z], { color: i % 2 ? 'red' : 'white' }));
    return b.done();
  }),
  e('angel wings', 'wardrobe', 'costumes', () => {
    const b = m('angel wings').box([0.08, 0.12, 0.04], [0, 0.32, 0], { color: 'gold', round: 0.5 });
    b.pair((s) => {
      b.ball([0.28, 0.5, 0.06], [s * 0.17, 0.4, -0.02], { color: 'white', rot: [0, 0, -s * 30] });
      b.ball([0.22, 0.38, 0.06], [s * 0.2, 0.26, 0.01], { color: 'white', rot: [0, 0, -s * 50] });
      b.ball([0.16, 0.26, 0.06], [s * 0.16, 0.14, 0.04], { color: 'snow', rot: [0, 0, -s * 70] });
    });
    return b.done();
  }),
  e('animal food', 'pets', 'pet supplies', () => {
    const b = m('animal food')
      .box([0.18, 0.28, 0.1], [0.05, 0.14, -0.05], { color: 'red', round: 0.2 })
      .box([0.18, 0.04, 0.06], [0.05, 0.29, -0.05], { color: 'darkred', round: 0.3 })
      .label('PET FOOD', [0.14, 0.06], [0.05, 0.19, 0.0], { color: 'yellow' })
      .rod([0.0, 0.1, 0.006], [0.1, 0.1, 0.006], 0.02, 'cream')
      .ball(0.022, [0.0, 0.108, 0.006], { color: 'cream' })
      .ball(0.022, [0.1, 0.108, 0.006], { color: 'cream' });
    bowl(b, { d: 0.15, h: 0.05, x: -0.1, z: 0.08, color: 'steel', fill: '#8a5a2b' });
    around(4, 0.03).forEach(([x, z]) => b.ball(0.018, [-0.1 + x, 0.08, 0.08 + z], { color: '#a8703a' }));
    return b.done();
  }),
  e('animal shelter', 'places', 'services', () => {
    const b = shop('animal shelter', 'ANIMAL SHELTER', { w: 5, h: 2.8, wall: '#bfe0f0', roof: 'teal' });
    b.heart(0.6, [1.6, 3.3, 2.05], { color: 'red' });
    b.box([0.9, 0.7, 0.9], [-2.0, 0.35, 3.0], { color: 'wood' }).wedge([1.1, 0.5, 1.0], [-2.0, 0.95, 3.0], { color: 'red' }).box([0.35, 0.4, 0.05], [-2.0, 0.25, 3.46], { color: 'black', round: 0.5 });
    return b.done();
  }),
  e('ankle', 'clinic', 'body parts', () => {
    const b = m('ankle')
      .capsule([0.1, 0.38, 0.1], [0, 0.26, -0.01], { color: 'skin2' })
      .box([0.09, 0.07, 0.22], [0, 0.04, 0.06], { color: 'skin2', round: 0.9 })
      .ball([0.08, 0.08, 0.08], [0, 0.05, -0.04], { color: 'skin2' });
    b.pair((s) => b.ball(0.035, [s * 0.045, 0.085, -0.005], { color: 'skin3' }));
    b.each(5, (i) => b.ball(0.024 - i * 0.002, [0.03 - i * 0.017, 0.025, 0.17 - i * 0.005], { color: 'skin2' }));
    return b.done();
  }),
  e('answering machine', 'tech', 'phones', () => {
    const b = m('answering machine')
      .box([0.22, 0.05, 0.16], [0, 0.025, 0], { color: 'darkgray', round: 0.3 })
      .box([0.08, 0.012, 0.05], [0.05, 0.053, 0.03], { color: 'glass', round: 0.2 })
      .ball(0.014, [-0.08, 0.055, 0.05], { color: 'red', glow: true })
      .label('1', [0.03, 0.025], [-0.04, 0.06, 0.06], { color: 'black', rot: [-60, 0, 0] })
      .capsule([0.04, 0.2, 0.04], [0, 0.07, -0.05], { color: 'black', rot: [0, 0, 90] })
      .ball([0.05, 0.035, 0.05], [-0.09, 0.075, -0.05], { color: 'black' })
      .ball([0.05, 0.035, 0.05], [0.09, 0.075, -0.05], { color: 'black' });
    b.each(4, (i) => b.box([0.022, 0.01, 0.018], [-0.07 + i * 0.03, 0.053, 0.0], { color: i === 0 ? 'green' : 'lightgray' }));
    return b.done();
  }),
  e('ant farm', 'bugs', 'bug homes', () => {
    const b = m('ant farm')
      .box([0.32, 0.03, 0.06], [0, 0.015, 0], { color: 'green' })
      .box([0.3, 0.13, 0.03], [0, 0.095, 0], { color: 'sand', round: 0.05 })
      .box([0.3, 0.07, 0.03], [0, 0.195, 0], { color: 'glass', round: 0.05 })
      .box([0.32, 0.025, 0.04], [0, 0.24, 0], { color: 'green' })
      .rod([-0.1, 0.155, 0.016], [-0.06, 0.09, 0.016], 0.012, 'dirt', { noInk: true })
      .rod([-0.06, 0.09, 0.016], [0.05, 0.07, 0.016], 0.012, 'dirt', { noInk: true })
      .rod([0.05, 0.07, 0.016], [0.08, 0.155, 0.016], 0.012, 'dirt', { noInk: true })
      .rod([0.0, 0.08, 0.016], [-0.02, 0.04, 0.016], 0.012, 'dirt', { noInk: true })
      .ball([0.025, 0.012, 0.012], [-0.04, 0.045, 0.017], { color: 'dirt', noInk: true });
    b.pair((s) => b.box([0.015, 0.22, 0.04], [s * 0.153, 0.13, 0], { color: 'green' }));
    for (const [x, y] of [[-0.08, 0.12], [0.02, 0.075], [0.07, 0.14]]) b.ball([0.012, 0.006, 0.006], [x, y, 0.018], { color: 'black', noInk: true });
    return b.done();
  }),
  e('ant hill', 'bugs', 'bug homes', () => {
    const b = m('ant hill')
      .cyl([0.42, 0.2, 0.42], [0, 0.1, 0], { color: 'dirt', taper: 0.3 })
      .ball([0.14, 0.08, 0.14], [0, 0.19, 0], { color: 'dirt' })
      .cyl([0.045, 0.02, 0.045], [0, 0.225, 0], { color: 'black' });
    for (const [x, y, z] of [[0.1, 0.1, 0.1], [-0.06, 0.14, 0.08], [0.04, 0.05, 0.17], [-0.12, 0.06, 0.12]]) b.ball([0.022, 0.01, 0.012], [x, y, z], { color: 'black' });
    around(6, 0.22, 0.3).forEach(([x, z]) => b.ball(0.02, [x, 0.01, z], { color: '#a07a50' }));
    return b.done();
  }),
  e('antenna (metal)', 'tech', 'antennas', () => {
    const b = m('antenna (metal)')
      .box([0.22, 0.08, 0.22], [0, 0.04, 0], { color: 'darkgray' })
      .stick([0, 0.08, 0], [0, 0.95, 0], 0.03, 'steel')
      .stick([0, 0.85, -0.42], [0, 0.85, 0.42], 0.025, 'metal');
    b.each(6, (i) => b.stick([-0.32 + i * 0.03, 0.85, -0.38 + i * 0.15], [0.32 - i * 0.03, 0.85, -0.38 + i * 0.15], 0.014, 'silver'));
    b.rod([-0.12, 0.85, 0.35], [0, 0.98, 0.42], 0.014, 'silver').rod([0.12, 0.85, 0.35], [0, 0.98, 0.42], 0.014, 'silver');
    return b.done();
  }),
  e('antidote', 'clinic', 'medicine', () =>
    m('antidote')
      .cyl([0.045, 0.06, 0.045], [0, 0.03, 0], { color: 'teal', glow: true })
      .cyl([0.045, 0.03, 0.045], [0, 0.075, 0], { color: 'glass' })
      .cyl([0.02, 0.025, 0.02], [0, 0.1, 0], { color: 'glass' })
      .cyl([0.026, 0.025, 0.026], [0, 0.12, 0], { color: 'wood', taper: 1.2 })
      .box([0.035, 0.012, 0.01], [0, 0.035, 0.022], { color: 'white', round: 0 })
      .box([0.012, 0.035, 0.01], [0, 0.035, 0.022], { color: 'white', round: 0 })
      .done(),
  ),
  e('antifreeze', 'garage', 'car care', () =>
    m('antifreeze')
      .box([0.2, 0.26, 0.1], [0, 0.13, 0], { color: '#3ccf4e', round: 0.35 })
      .torus([0.09, 0.08, 0.04], [-0.04, 0.28, 0], { color: '#3ccf4e', tube: 0.25 })
      .cyl([0.045, 0.04, 0.045], [0.06, 0.28, 0], { color: 'yellow' })
      .label('ANTIFREEZE', [0.16, 0.1], [0, 0.12, 0.05], { color: 'yellow' })
      .done(),
  ),
  e('antique shop', 'places', 'shops', () => {
    const b = shop('antique shop', 'ANTIQUES', { w: 4.5, h: 3, wall: 'maroon', roof: 'darkbrown', sign: 'gold', door: 'darkgreen' });
    b.box([0.4, 1.4, 0.3], [-1.35, 0.75, 2.2], { color: 'darkwood' }).cyl([0.26, 0.04, 0.26], [-1.35, 1.2, 2.37], { color: 'cream', rot: [90, 0, 0] });
    b.cyl([0.5, 0.5, 0.5], [1.35, 0.25, 2.3], { color: 'blue', taper: 0.5 }).ball([0.6, 0.5, 0.6], [1.35, 0.55, 2.3], { color: 'blue' }).cyl([0.24, 0.3, 0.24], [1.35, 0.9, 2.3], { color: 'blue', taper: 1.3 });
    return b.done();
  }),
  e('antler', 'wild', 'antlers and horns', () => {
    const b = m('antler')
      .box([0.16, 0.07, 0.12], [0, 0.035, 0], { color: 'darkwood' })
      .ball([0.08, 0.05, 0.08], [0, 0.07, 0], { color: '#bfa98a' })
      .rod([0, 0.07, 0], [0.04, 0.3, -0.04], 0.05, '#e3d6bd')
      .rod([0.04, 0.3, -0.04], [0.0, 0.56, -0.08], 0.045, '#e3d6bd')
      .rod([0.0, 0.56, -0.08], [-0.1, 0.76, -0.04], 0.04, '#e3d6bd');
    const tines: Array<[Vec3, Vec3]> = [[[0.02, 0.12, -0.01], [0.04, 0.22, 0.12]], [[0.04, 0.3, -0.04], [0.08, 0.5, 0.08]], [[0.0, 0.52, -0.07], [0.04, 0.72, 0.02]], [[-0.04, 0.66, -0.07], [-0.18, 0.8, -0.1]]];
    for (const [a, t] of tines) spike(b, a, t, 0.04, '#efe4cf');
    return b.done();
  }),
  e('antlers', 'wild', 'antlers and horns', () => {
    const b = m('antlers')
      .box([0.36, 0.4, 0.04], [0, 0.22, -0.04], { color: 'darkwood', round: 0.5 })
      .cone([0.36, 0.16, 0.04], [0, -0.0, -0.04], { color: 'darkwood', rot: [180, 0, 0], segs: 4 })
      .ball([0.16, 0.14, 0.12], [0, 0.32, 0.03], { color: 'cream' });
    b.pair((s) => {
      b.rod([s * 0.05, 0.36, 0.04], [s * 0.22, 0.48, 0.06], 0.045, '#e3d6bd').rod([s * 0.22, 0.48, 0.06], [s * 0.32, 0.7, 0.04], 0.04, '#e3d6bd');
      spike(b, [s * 0.15, 0.44, 0.05], [s * 0.14, 0.62, 0.12], 0.035, '#efe4cf');
      spike(b, [s * 0.25, 0.55, 0.05], [s * 0.2, 0.76, 0.06], 0.035, '#efe4cf');
      spike(b, [s * 0.3, 0.66, 0.04], [s * 0.42, 0.8, 0.02], 0.035, '#efe4cf');
    });
    return b.done();
  }),
  e('anvil', 'workshop', 'blacksmith', () =>
    m('anvil')
      .cyl([0.42, 0.26, 0.42], [0, 0.13, 0], { color: 'wood' })
      .cyl([0.4, 0.02, 0.4], [0, 0.265, 0], { color: 'lightwood' })
      .box([0.32, 0.1, 0.24], [0, 0.32, 0], { color: 'iron', round: 0.2 })
      .box([0.16, 0.14, 0.13], [0, 0.43, 0], { color: 'iron', round: 0.1 })
      .box([0.4, 0.11, 0.17], [-0.03, 0.55, 0], { color: 'iron', round: 0.15 })
      .cone([0.13, 0.24, 0.12], [0.28, 0.555, 0], { color: 'iron', rot: [0, 0, -90] })
      .box([0.38, 0.01, 0.15], [-0.03, 0.606, 0], { color: 'steel', round: 0 })
      .done(),
  ),
  e('apartment', 'places', 'homes', () => {
    const b = m('apartment')
      .box([5, 8, 4], [0, 4, 0], { color: '#d9a679', round: 0.03 })
      .box([5.3, 0.3, 4.3], [0, 8.15, 0], { color: 'darkgray', round: 0.1 })
      .box([1.1, 1.6, 0.12], [0, 0.8, 2.0], { color: 'darkwood', name: 'door', pivot: [-0.55, 0.8, 2.0] })
      .label('APARTMENTS', [2.4, 0.4], [0, 1.9, 2.06], { color: 'white' });
    b.each(3, (f) => {
      const y = 3.2 + f * 1.8;
      b.pair((s) => b.box([0.9, 1.0, 0.1], [s * 1.6, y, 2.0], { color: 'glass' }));
      b.box([1.6, 0.12, 0.8], [0, y - 0.6, 2.35], { color: 'lightgray', round: 0.1 }).box([1.6, 0.5, 0.06], [0, y - 0.3, 2.72], { color: 'white', round: 0.2 });
      b.box([0.8, 1.2, 0.1], [0, y, 2.0], { color: 'glass' });
    });
    return b.done();
  }),
  e('apparatus', 'study', 'lab gear', () =>
    m('apparatus')
      .box([0.4, 0.02, 0.22], [0, 0.01, 0], { color: 'darkgray', round: 0.2 })
      .stick([-0.15, 0.02, -0.05], [-0.15, 0.7, -0.05], 0.015, 'silver')
      .stick([-0.15, 0.36, -0.05], [-0.02, 0.36, -0.05], 0.01, 'silver')
      .torus([0.1, 0.1, 0.012], [0, 0.36, -0.05], { color: 'silver', rot: [90, 0, 0], tube: 0.12 })
      .ball(0.14, [0, 0.42, -0.05], { color: 'magenta', glow: true })
      .cyl([0.04, 0.12, 0.04], [0, 0.54, -0.05], { color: 'glass' })
      .rod([0, 0.6, -0.05], [0.16, 0.5, -0.05], 0.012, 'glass')
      .rod([0.16, 0.5, -0.05], [0.16, 0.18, -0.05], 0.012, 'glass')
      .cyl([0.1, 0.12, 0.1], [0.16, 0.08, -0.05], { color: 'glass' })
      .cyl([0.09, 0.06, 0.09], [0.16, 0.05, -0.05], { color: 'magenta' })
      .cyl([0.04, 0.16, 0.04], [0, 0.1, -0.05], { color: 'steel' })
      .cone([0.04, 0.12, 0.04], [0, 0.24, -0.05], { color: 'cyan', glow: true })
      .done(),
  ),
  e('apple core', 'food', 'fruit', () =>
    m('apple core')
      .ball([0.075, 0.035, 0.075], [0, 0.018, 0], { color: 'red' })
      .ball([0.07, 0.03, 0.07], [0, 0.034, 0], { color: '#f3e6c4' })
      .cyl([0.035, 0.05, 0.035], [0, 0.064, 0], { color: '#f3e6c4' })
      .ball([0.07, 0.03, 0.07], [0, 0.094, 0], { color: '#f3e6c4' })
      .ball([0.075, 0.035, 0.075], [0, 0.11, 0], { color: 'red' })
      .rod([0, 0.125, 0], [0.006, 0.15, 0], 0.007, 'darkbrown')
      .ball([0.008, 0.012, 0.006], [0.006, 0.065, 0.018], { color: 'darkbrown' })
      .ball([0.008, 0.012, 0.006], [-0.008, 0.06, 0.017], { color: 'darkbrown' })
      .done(),
  ),
  e('apple pie', 'food', 'pies', () => {
    const b = m('apple pie')
      .cyl([0.26, 0.04, 0.26], [0, 0.02, 0], { color: 'metal', taper: 1.12 })
      .ball([0.26, 0.06, 0.26], [0, 0.045, 0], { color: '#d9a35f' })
      .torus([0.28, 0.28, 0.035], [0, 0.045, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.11 });
    b.each(3, (i) => b.box([0.2, 0.01, 0.022], [0, 0.074, -0.06 + i * 0.06], { color: 'crust', round: 0.5 }));
    b.each(3, (i) => b.box([0.022, 0.01, 0.2], [-0.06 + i * 0.06, 0.076, 0], { color: 'crust', round: 0.5 }));
    return b.done();
  }),
  e('apple sauce', 'food', 'jars', () => jar(m('apple sauce'), { h: 0.14, w: 0.09, fill: '#e8cf7a', lid: 'red', label: 'white', text: 'APPLE SAUCE' }).ball(0.03, [0, 0.07, 0.048], { color: 'red' }).done()),
  e('apple tree', 'garden', 'fruit trees', () => tree('apple tree', 5, { fruit: 'red', fruitSize: 0.3 }).done()),
  e('apricot tree', 'garden', 'fruit trees', () => tree('apricot tree', 5, { fruit: '#f4a340', crown: '#6aa84f', crown2: '#5c9a46', fruitSize: 0.28, n: 8 }).done()),
  e('apron', 'wardrobe', 'aprons', () =>
    form('apron')
      .box([0.37, 0.04, 0.23], [0, 1.02, 0], { color: 'red', round: 0.5 })
      .box([0.24, 0.24, 0.03], [0, 1.18, 0.115], { color: 'red', round: 0.3 })
      .box([0.42, 0.44, 0.035], [0, 0.82, 0.12], { color: 'red', round: 0.3 })
      .box([0.2, 0.1, 0.02], [0, 0.84, 0.14], { color: 'white', round: 0.3 })
      .torus([0.13, 0.13, 0.02], [0, 1.35, 0.01], { color: 'red', rot: [70, 0, 0], tube: 0.15 })
      .done(),
  ),
  e('aquarium (building)', 'places', 'attractions', () =>
    m('aquarium (building)')
      .box([8, 3.2, 4.5], [0, 1.6, 0], { color: '#3fa7c0', round: 0.05 })
      .ball([5, 3.6, 4], [0, 3.2, -0.3], { color: 'glass' })
      .box([7.2, 1.5, 0.1], [0, 1.1, 2.25], { color: 'water', round: 0.1 })
      .label('AQUARIUM', [4.2, 0.6], [0, 2.6, 2.3], { color: 'white' })
      .ball([0.9, 0.55, 0.12], [-1.6, 1.15, 2.33], { color: 'orange' })
      .wedge([0.5, 0.5, 0.08], [-1.0, 1.15, 2.33], { color: 'orange', rot: [0, 0, 90] })
      .ball([0.7, 0.45, 0.12], [1.8, 0.9, 2.33], { color: 'yellow' })
      .wedge([0.4, 0.4, 0.08], [1.33, 0.9, 2.33], { color: 'yellow', rot: [0, 0, -90] })
      .capsule([0.7, 2.2, 0.7], [0, 5.1, -0.3], { color: 'gray', rot: [0, 0, 80] })
      .wedge([0.6, 0.6, 0.1], [0, 5.55, -0.3], { color: 'gray' })
      .done(),
  ),
  e('aqueduct', 'places', 'landmarks', () => {
    const dark = { color: '#4a4540', noInk: true };
    const b = m('aqueduct')
      .box([12, 3, 1.1], [0, 1.5, 0], { color: 'stone', round: 0.03 })
      .box([12.3, 0.3, 1.3], [0, 3.1, 0], { color: 'lightgray', round: 0.1 })
      .box([12, 2.2, 1.0], [0, 4.35, 0], { color: 'stone', round: 0.03 })
      .box([12, 0.35, 1.0], [0, 5.6, 0], { color: '#bdb5a0', round: 0.1 })
      .box([11.8, 0.1, 0.5], [0, 5.79, 0], { color: 'water' });
    b.each(4, (i) => b.box([1.9, 1.7, 0.05], [-4.5 + i * 3, 0.85, 0.56], dark).cyl([1.9, 0.05, 1.9], [-4.5 + i * 3, 1.7, 0.56], { ...dark, rot: [90, 0, 0] }));
    b.each(6, (i) => b.box([1.0, 1.0, 0.05], [-5 + i * 2, 3.75, 0.51], dark).cyl([1.0, 0.05, 1.0], [-5 + i * 2, 4.25, 0.51], { ...dark, rot: [90, 0, 0] }));
    return b.done();
  }),
  e('arcade machine', 'toys', 'arcade', () => {
    const b = m('arcade machine')
      .box([0.72, 1.8, 0.7], [0, 0.9, -0.05], { color: 'purple', round: 0.05 })
      .box([0.6, 0.5, 0.06], [0, 1.32, 0.3], { color: 'black', rot: [-12, 0, 0] })
      .box([0.5, 0.38, 0.02], [0, 1.32, 0.335], { color: 'cyan', glow: true, rot: [-12, 0, 0] })
      .box([0.76, 0.1, 0.36], [0, 1.0, 0.45], { color: 'black', rot: [12, 0, 0] })
      .stick([-0.16, 1.05, 0.46], [-0.16, 1.13, 0.46], 0.02, 'black')
      .ball(0.05, [-0.16, 1.15, 0.46], { color: 'red' })
      .label('ARCADE', [0.62, 0.18], [0, 1.68, 0.31], { color: 'yellow', glow: true })
      .box([0.3, 0.32, 0.03], [0, 0.45, 0.3], { color: 'black' });
    b.pair((s) => b.box([0.03, 0.08, 0.02], [s * 0.06, 0.5, 0.32], { color: 'orange', glow: true }));
    b.each(3, (i) => b.cyl([0.04, 0.03, 0.04], [0.02 + i * 0.08, 1.07, 0.46], { color: ['yellow', 'blue', 'lime'][i] }));
    b.pair((s) => b.box([0.02, 1.2, 0.5], [s * 0.36, 0.9, -0.05], { color: 'magenta', noInk: true }));
    return b.done();
  }),
  e('arch', 'places', 'landmarks', () => {
    const b = m('arch');
    b.pair((s) => b.box([1.3, 4, 1.3], [s * 2.6, 2.2, 0], { color: 'stone', round: 0.05 }).box([1.6, 0.4, 1.6], [s * 2.6, 0.2, 0], { color: 'rock', round: 0.1 }));
    b.each(9, (i) => {
      const a = (i / 8) * Math.PI;
      b.box([1.3, i === 4 ? 1.0 : 0.86, 1.3], [Math.cos(a) * 2.6, 4.2 + Math.sin(a) * 2.6, 0], { color: i === 4 ? '#c9c2b0' : i % 2 ? 'stone' : '#b5b2a8', rot: [0, 0, a * RAD], round: 0.1 });
    });
    return b.done();
  }),
  e('ark of the covenant', 'fantasy', 'relics', () => {
    const b = m('ark of the covenant')
      .box([1.15, 0.7, 0.7], [0, 0.45, 0], { color: 'gold', round: 0.05 })
      .box([1.25, 0.08, 0.8], [0, 0.84, 0], { color: 'gold', round: 0.2 })
      .box([1.17, 0.06, 0.72], [0, 0.25, 0], { color: '#c9962a', round: 0.2 });
    b.pair((s) => {
      b.stick([-1.1, 0.4, s * 0.42], [1.1, 0.4, s * 0.42], 0.06, 'gold');
      b.box([0.1, 0.1, 0.1], [s * 0.5, 0.05, s * 0.3], { color: 'gold' }).box([0.1, 0.1, 0.1], [s * 0.5, 0.05, -s * 0.3], { color: 'gold' });
      b.ball([0.2, 0.26, 0.22], [s * 0.4, 1.0, 0], { color: 'gold' }).ball(0.13, [s * 0.38, 1.18, 0.04], { color: 'gold' });
      b.ball([0.08, 0.45, 0.34], [s * 0.26, 1.22, -0.02], { color: '#f0c850', rot: [0, 0, s * 45] });
    });
    return b.done();
  }),
  e('arm', 'clinic', 'body parts', () =>
    m('arm')
      .capsule([0.12, 0.38, 0.12], [0.05, 0.08, 0], { color: 'skin2', rot: [0, 0, 90] })
      .ball([0.17, 0.14, 0.12], [0.06, 0.15, 0.0], { color: 'skin2' })
      .ball(0.12, [-0.12, 0.08, 0], { color: 'skin2' })
      .rod([-0.12, 0.08, 0], [-0.14, 0.38, 0], 0.1, 'skin2')
      .ball([0.12, 0.13, 0.11], [-0.14, 0.45, 0.005], { color: 'skin2' })
      .capsule([0.035, 0.07, 0.035], [-0.1, 0.47, 0.05], { color: 'skin2', rot: [0, 0, -40] })
      .cyl([0.15, 0.1, 0.15], [0.25, 0.08, 0], { color: 'blue', rot: [0, 0, 90] })
      .done(),
  ),
  e('armchair', 'home', 'seating', () => {
    const b = m('armchair')
      .box([0.82, 0.26, 0.74], [0, 0.3, 0], { color: 'maroon', round: 0.3 })
      .box([0.56, 0.12, 0.6], [0, 0.48, 0.04], { color: '#a8394a', round: 0.6 })
      .box([0.82, 0.6, 0.2], [0, 0.66, -0.28], { color: 'maroon', round: 0.4 });
    b.pair((s) => b.box([0.16, 0.3, 0.74], [s * 0.36, 0.55, 0], { color: 'maroon', round: 0.6 }));
    for (const [x, z] of [[0.33, 0.3], [-0.33, 0.3], [0.33, -0.3], [-0.33, -0.3]]) b.cyl([0.06, 0.17, 0.06], [x, 0.085, z], { color: 'darkwood', taper: 0.7 });
    return b.done();
  }),
  e('armor', 'armory', 'armour', () => {
    const b = m('armor')
      .cyl([0.44, 0.2, 0.3], [0, 0.9, 0], { color: 'steel', taper: 0.85 })
      .ball([0.46, 0.56, 0.32], [0, 1.2, 0], { color: 'silver' })
      .box([0.03, 0.4, 0.03], [0, 1.22, 0.155], { color: 'metal', round: 0.5 })
      .capsule([0.25, 0.32, 0.27], [0, 1.62, 0], { color: 'silver' })
      .box([0.17, 0.025, 0.03], [0, 1.64, 0.13], { color: 'black', round: 0 })
      .capsule([0.06, 0.24, 0.1], [0, 1.86, -0.06], { color: 'red', rot: [-40, 0, 0] });
    b.pair((s) => {
      b.capsule([0.13, 0.78, 0.14], [s * 0.1, 0.45, 0], { color: 'silver' }).ball(0.11, [s * 0.1, 0.48, 0.04], { color: 'steel' });
      b.box([0.13, 0.08, 0.24], [s * 0.1, 0.04, 0.04], { color: 'steel', round: 0.5 });
      b.ball([0.2, 0.15, 0.22], [s * 0.26, 1.42, 0], { color: 'steel' });
      b.capsule([0.1, 0.56, 0.1], [s * 0.3, 1.1, 0], { color: 'silver' }).ball(0.1, [s * 0.31, 0.8, 0.01], { color: 'iron' });
    });
    return b.done();
  }),
  e('armory', 'places', 'military', () => {
    const b = m('armory')
      .box([7, 4, 4], [0, 2, 0], { color: 'stone', round: 0.03 })
      .box([1.4, 2.0, 0.12], [0, 1.0, 2.0], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.0, 2.0] })
      .cyl([1.4, 0.12, 1.4], [0, 2.0, 2.0], { color: 'darkwood', rot: [90, 0, 0] })
      .label('ARMORY', [3, 0.5], [0, 3.3, 2.06], { color: 'darkred' })
      .rod([-0.9, 2.2, 2.08], [0.9, 3.0, 2.08], 0.1, 'silver')
      .rod([0.9, 2.2, 2.08], [-0.9, 3.0, 2.08], 0.1, 'silver')
      .cyl([0.7, 0.1, 0.8], [0, 2.6, 2.12], { color: 'red', rot: [90, 0, 0] });
    b.each(6, (i) => b.box([0.6, 0.6, 0.5], [-2.5 + i, 4.3, 1.75], { color: 'stone' }));
    b.pair((s) => b.cyl([1.7, 5.4, 1.7], [s * 3.5, 2.7, 1.5], { color: 'rock' }).cone([2, 1.4, 2], [s * 3.5, 6.1, 1.5], { color: 'darkred' }));
    return b.done();
  }),
  e('arms', 'armory', 'weapons', () => {
    const b = m('arms').box([1.6, 0.14, 0.5], [0, 0.07, -0.05], { color: 'darkwood' });
    b.pair((s) => b.stick([s * 0.72, 0.1, -0.15], [s * 0.72, 1.55, -0.15], 0.08, 'darkwood'));
    b.stick([-0.76, 1.3, -0.15], [0.76, 1.3, -0.15], 0.06, 'darkwood').stick([-0.76, 0.35, -0.15], [0.76, 0.35, -0.15], 0.06, 'darkwood');
    b.box([0.07, 0.9, 0.015], [-0.45, 0.72, -0.05], { color: 'silver', round: 0.3 }).box([0.22, 0.035, 0.05], [-0.45, 1.19, -0.05], { color: 'gold' })
      .capsule([0.04, 0.16, 0.04], [-0.45, 1.29, -0.05], { color: 'darkbrown' }).ball(0.06, [-0.45, 1.39, -0.05], { color: 'gold' });
    b.stick([-0.12, 0.1, -0.05], [-0.12, 1.5, -0.05], 0.035, 'wood');
    spike(b, [-0.12, 1.48, -0.05], [-0.12, 1.75, -0.05], 0.07, 'steel', { segs: 4 });
    b.stick([0.25, 0.1, -0.05], [0.25, 1.25, -0.05], 0.04, 'wood').box([0.12, 0.1, 0.04], [0.31, 1.12, -0.05], { color: 'iron' }).ball([0.14, 0.3, 0.03], [0.4, 1.12, -0.05], { color: 'steel' });
    b.cyl([0.55, 0.05, 0.55], [0.48, 0.38, 0.12], { color: 'red', rot: [75, 0, 0] }).ball([0.12, 0.12, 0.06], [0.48, 0.39, 0.15], { color: 'gold' });
    return b.done();
  }),
  e('army men', 'toys', 'toy soldiers', () => {
    const b = m('army men');
    const G = '#5c7a2e';
    for (const [x, z, aim] of [[-0.06, 0.0, 0], [0.0, 0.03, 1], [0.06, -0.01, 0]] as Array<[number, number, number]>) {
      b.cyl([0.042, 0.006, 0.032], [x, 0.003, z], { color: G })
        .rod([x - 0.007, 0.006, z], [x - 0.007, 0.036, z], 0.011, G)
        .rod([x + 0.007, 0.006, z], [x + 0.007, 0.036, z], 0.011, G)
        .capsule([0.024, 0.034, 0.016], [x, 0.05, z], { color: G })
        .ball(0.016, [x, 0.073, z], { color: G })
        .ball([0.022, 0.012, 0.022], [x, 0.079, z], { color: G });
      if (aim) b.stick([x - 0.004, 0.064, z + 0.005], [x - 0.004, 0.064, z + 0.05], 0.006, G);
      else b.stick([x + 0.013, 0.035, z + 0.006], [x + 0.016, 0.085, z + 0.012], 0.006, G);
    }
    return b.done();
  }),
  e('army uniform', 'wardrobe', 'uniforms', () => who('army uniform', { top: '#5b6b3a', bottom: '#5b6b3a', shoes: 'black', long: true, style: 'short', acc: [hat('military', '#4a5a2e'), wear('belt', 'darkbrown'), wear('badge')] })),
  e('arrow', 'armory', 'archery', () =>
    m('arrow')
      .cyl([0.18, 0.06, 0.15], [0, 0.03, 0], { color: 'dirt', taper: 0.5 })
      .stick([0, 0.04, 0], [0.3, 0.62, 0], 0.014, 'wood')
      .ball([0.006, 0.12, 0.05], [0.265, 0.56, 0], { color: 'red', rot: [0, 0, -27] })
      .ball([0.05, 0.12, 0.006], [0.265, 0.56, 0], { color: 'white', rot: [0, 0, -27] })
      .ball(0.018, [0.302, 0.626, 0], { color: 'darkbrown' })
      .done(),
  ),
  e('arrowhead', 'armory', 'archery', () =>
    m('arrowhead')
      .box([0.1, 0.03, 0.06], [0, 0.015, 0], { color: 'darkwood', round: 0.3 })
      .box([0.016, 0.025, 0.01], [0, 0.04, 0], { color: '#4a4d52', round: 0.3 })
      .wedge([0.06, 0.09, 0.012], [0, 0.095, 0], { color: '#5a5d63' })
      .ball([0.012, 0.012, 0.004], [-0.008, 0.08, 0.006], { color: '#7c8088', noInk: true })
      .ball([0.01, 0.01, 0.004], [0.01, 0.1, 0.006], { color: '#7c8088', noInk: true })
      .done(),
  ),
  e('art museum', 'places', 'museums', () => {
    const b = temple('art museum', 'ART MUSEUM', { wall: '#e8d9c0' });
    b.pair((s) => b.stick([s * 0.4 - 4.6, 0, 3.6 + s * 0.2], [-4.6, 2.2, 3.4], 0.08, 'darkwood'));
    b.box([1.5, 1.2, 0.12], [-4.6, 1.8, 3.5], { color: 'gold', rot: [-10, 0, 0] }).box([1.25, 0.95, 0.04], [-4.6, 1.8, 3.57], { color: 'skyblue', rot: [-10, 0, 0] })
      .ball([0.9, 0.5, 0.04], [-4.6, 1.5, 3.6], { color: 'green', rot: [-10, 0, 0], noInk: true }).ball(0.3, [-4.3, 2.0, 3.62], { color: 'yellow', noInk: true });
    return b.done();
  }),
  e('art supply store', 'places', 'shops', () => {
    const b = shop('art supply store', 'ART SUPPLIES', { w: 5, h: 3, wall: '#f7e08a', roof: 'blue', flat: true, sign: 'white' });
    b.stick([2.95, 0, 1.8], [2.95, 0.35, 1.8], 0.42, 'pink').stick([2.95, 0.35, 1.8], [2.95, 0.5, 1.8], 0.43, 'silver')
      .stick([2.95, 0.5, 1.8], [2.95, 2.8, 1.8], 0.42, 'yellow', { segs: 6 });
    spike(b, [2.95, 2.8, 1.8], [2.95, 3.4, 1.8], 0.42, 'tan', { segs: 6 });
    spike(b, [2.95, 3.25, 1.8], [2.95, 3.42, 1.8], 0.12, 'darkgray');
    b.ball([1.8, 1.1, 0.15], [-0.6, 3.95, 1.6], { color: 'lightwood' });
    b.each(5, (i) => b.ball([0.25, 0.25, 0.1], [-1.2 + i * 0.3, 4.1 - (i % 2) * 0.25, 1.68], { color: RAINBOW[i] }));
    return b.done();
  }),
  e('artichoke', 'food', 'vegetables', () => {
    const b = m('artichoke')
      .cyl([0.03, 0.03, 0.03], [0, 0.015, 0], { color: '#7a9a5a' })
      .ball([0.1, 0.11, 0.1], [0, 0.08, 0], { color: '#5f8a45' })
      .cone([0.05, 0.05, 0.05], [0, 0.15, 0], { color: '#6b8e4e' });
    around(7, 0.035).forEach(([x, z]) => spike(b, [x, 0.05, z], [x * 1.9, 0.12, z * 1.9], 0.05, '#7da35a'));
    around(6, 0.025, 0.4).forEach(([x, z]) => spike(b, [x, 0.1, z], [x * 1.6, 0.165, z * 1.6], 0.042, '#8aaa62'));
    return b.done();
  }),
  e('artifact', 'study', 'history', () =>
    m('artifact')
      .box([0.18, 0.06, 0.18], [0, 0.03, 0], { color: 'white', round: 0.1 })
      .cyl([0.045, 0.03, 0.045], [0, 0.075, 0], { color: '#b8653a' })
      .ball([0.13, 0.16, 0.13], [0, 0.16, 0], { color: '#c0703a' })
      .cyl([0.132, 0.025, 0.132], [0, 0.17, 0], { color: '#2a2726', noInk: true })
      .cyl([0.045, 0.07, 0.045], [0, 0.26, 0], { color: '#c0703a' })
      .torus([0.065, 0.065, 0.016], [0, 0.295, 0], { color: '#b8653a', rot: [90, 0, 0] })
      .torus([0.05, 0.08, 0.014], [0.05, 0.25, 0], { color: '#b8653a' })
      .torus([0.05, 0.08, 0.014], [-0.05, 0.25, 0], { color: '#b8653a' })
      .done(),
  ),
  e('ash', 'nature', 'fire', () =>
    m('ash')
      .cyl([0.34, 0.15, 0.3], [0, 0.075, 0], { color: '#8f8d8a', taper: 0.3 })
      .ball([0.14, 0.1, 0.13], [0, 0.15, 0], { color: '#b5b3ae' })
      .ball([0.12, 0.06, 0.1], [0.12, 0.03, 0.06], { color: '#a3a19d' })
      .rod([-0.12, 0.05, 0.05], [0.06, 0.12, -0.02], 0.035, 'black')
      .rod([0.1, 0.04, 0.08], [-0.02, 0.1, -0.06], 0.03, '#3a3533')
      .ball(0.03, [0.03, 0.12, 0.06], { color: 'fire', glow: true })
      .ball(0.022, [-0.05, 0.08, 0.11], { color: 'orange', glow: true })
      .done(),
  ),
  e('asparagus', 'food', 'vegetables', () => {
    const b = m('asparagus');
    const pos: Array<[number, number]> = [[0, 0], [0.02, 0.008], [-0.02, 0.006], [0.008, -0.018], [-0.012, -0.016], [0.004, 0.022], [0.022, -0.012]];
    for (const [x, z] of pos) b.rod([x, 0.01, z], [x * 1.8, 0.21, z * 1.8], 0.018, '#6fa646').ball([0.022, 0.04, 0.022], [x * 1.85, 0.225, z * 1.85], { color: '#4d6e3a' });
    b.torus([0.075, 0.075, 0.02], [0, 0.06, 0], { color: 'purple', rot: [90, 0, 0], tube: 0.2 });
    return b.done();
  }),
  e('aspen tree', 'garden', 'trees', () => tree('aspen tree', 8, { trunk: '#eeeae0', marks: '#2a2726', crown: '#f2c43a', crown2: '#e8b02a', tall: true }).done()),
  e('asphalt', 'workshop', 'building materials', () => {
    const b = m('asphalt')
      .box([0.8, 0.04, 0.5], [0, 0.02, 0], { color: '#8a7a64', round: 0.1 })
      .box([0.8, 0.06, 0.5], [0, 0.07, 0], { color: '#3a3a3c', round: 0.1 })
      .box([0.8, 0.005, 0.03], [0, 0.1, 0.2], { color: 'white', noInk: true });
    b.each(3, (i) => b.box([0.14, 0.005, 0.04], [-0.26 + i * 0.26, 0.1, 0], { color: 'yellow', noInk: true }));
    around(6, 0.15, 0.3).forEach(([x, z]) => b.ball([0.02, 0.008, 0.02], [x * 2, 0.1, z], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('assault rifle', 'armory', 'guns', () =>
    m('assault rifle', { view: 'side' })
      .box([0.085, 0.11, 0.36], [0, 0.26, 0.02], { color: 'black', round: 0.2 })
      .box([0.07, 0.08, 0.28], [0, 0.26, 0.33], { color: 'darkgray', round: 0.3 })
      .stick([0, 0.27, 0.45], [0, 0.27, 0.7], 0.022, 'black')
      .box([0.025, 0.06, 0.025], [0, 0.31, 0.62], { color: 'black' })
      .box([0.045, 0.2, 0.075], [0, 0.13, 0.12], { color: 'black', rot: [-15, 0, 0] })
      .box([0.04, 0.12, 0.05], [0, 0.17, -0.07], { color: 'black', rot: [20, 0, 0] })
      .box([0.05, 0.12, 0.26], [0, 0.24, -0.3], { color: 'black' })
      .box([0.03, 0.04, 0.2], [0, 0.33, 0.02], { color: 'darkgray' })
      .done(),
  ),
  e('asterisk', 'ideas', 'symbols', () => {
    const b = plinth(m('asterisk'), 0.14).stick([0, 0.03, 0], [0, 0.06, 0], 0.015, 'darkwood');
    b.each(3, (i) => b.box([0.032, 0.15, 0.025], [0, 0.13, 0], { color: 'navy', rot: [0, 0, i * 60], round: 0.4 }));
    return b.done();
  }),
  e('asteroid', 'sky', 'space rocks', () =>
    m('asteroid')
      .ball([3, 2.4, 2.6], [0, 1.7, 0], { color: '#7a6f66' })
      .ball([1.6, 1.4, 1.5], [1.1, 2.3, 0.2], { color: '#857a70' })
      .ball([1.4, 1.2, 1.3], [-1.1, 1.2, 0.3], { color: '#6e645c' })
      .ball([0.6, 0.6, 0.2], [0.2, 1.9, 1.22], { color: '#5a524c', noInk: true })
      .ball([0.4, 0.4, 0.15], [-0.6, 1.3, 1.15], { color: '#5a524c', noInk: true })
      .ball([0.35, 0.35, 0.15], [1.3, 2.5, 0.9], { color: '#5a524c', noInk: true })
      .done(),
  ),
  e('asteroid belt', 'sky', 'space rocks', () => {
    const b = m('asteroid belt').ball(3, [0, 4.2, 0], { color: 'orange', glow: true });
    around(13, 4.4).forEach(([x, z], i) => b.ball([1.1 + (i % 3) * 0.35, 0.95 + (i % 2) * 0.3, 1.1 + (i % 4) * 0.15], [x, 4.2 + z * 0.6 + x * 0.3 + ((i % 3) - 1) * 0.2, z], { color: i % 2 ? '#8a7f74' : '#6e645c', rot: [i * 20, i * 35, 0] }));
    return b.done();
  }),
  e('asylum', 'places', 'hospitals', () => {
    const b = m('asylum')
      .box([8, 4, 3.5], [0, 2, 0], { color: '#8d8a86', round: 0.03 })
      .wedge([8.4, 1.6, 3.9], [0, 4.8, 0], { color: '#3d3a40' })
      .box([2, 7, 2], [0, 3.5, 1.0], { color: '#7a7672', round: 0.03 })
      .cone([2.8, 2.2, 2.8], [0, 8.1, 1.0], { color: '#3d3a40', segs: 4 })
      .box([1, 1.8, 0.1], [0, 0.9, 2.02], { color: 'darkwood', name: 'door', pivot: [-0.5, 0.9, 2.02] })
      .label('ASYLUM', [1.8, 0.4], [0, 2.2, 2.05], { color: 'lightgray' })
      .box([0.6, 0.8, 0.06], [0, 5.6, 2.02], { color: 'yellow', glow: true });
    for (const x of [-3.2, -1.8, 1.8, 3.2]) for (const y of [1.2, 2.9]) b.box([0.7, 1.0, 0.06], [x, y, 1.76], { color: '#2e2a33' }).box([0.06, 1.0, 0.08], [x, y, 1.78], { color: 'gray', round: 0 });
    return b.done();
  }),
  e('at sign', 'ideas', 'symbols', () =>
    m('at sign')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'darkwood' })
      .torus([0.18, 0.18, 0.03], [0, 0.11, 0], { color: 'blue', tube: 0.13 })
      .torus([0.075, 0.085, 0.03], [-0.008, 0.11, 0], { color: 'blue', tube: 0.3 })
      .stick([0.032, 0.08, 0], [0.032, 0.145, 0], 0.022, 'blue')
      .rod([0.032, 0.08, 0], [0.072, 0.085, 0], 0.02, 'blue')
      .done(),
  ),
  e('atm', 'tech', 'machines', () => {
    const b = m('atm')
      .box([0.7, 1.6, 0.5], [0, 0.8, 0], { color: '#2b5fa8', round: 0.08 })
      .box([0.6, 0.55, 0.06], [0, 1.25, 0.25], { color: 'darkgray', round: 0.1 })
      .box([0.36, 0.26, 0.03], [0, 1.3, 0.28], { color: 'cyan', glow: true, round: 0.1 })
      .box([0.22, 0.14, 0.06], [-0.08, 0.98, 0.28], { color: 'lightgray', rot: [30, 0, 0] })
      .box([0.12, 0.02, 0.04], [0.18, 1.0, 0.27], { color: 'lime', glow: true })
      .box([0.3, 0.04, 0.05], [0, 0.8, 0.26], { color: 'black' })
      .label('ATM', [0.4, 0.14], [0, 1.68, 0.0], { color: 'white', glow: true });
    b.each(3, (i) => b.box([0.18, 0.02, 0.005], [-0.08, 0.95 + i * 0.03, 0.31], { color: 'darkgray', noInk: true, rot: [30, 0, 0] }));
    return b.done();
  }),
  e('atom', 'study', 'science', () => {
    const b = m('atom').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'darkgray' }).stick([0, 0.02, 0], [0, 0.13, 0], 0.008, 'gray');
    b.ball(0.032, [0.01, 0.155, 0], { color: 'red' }).ball(0.032, [-0.012, 0.148, 0.008], { color: 'blue' }).ball(0.032, [0.002, 0.14, -0.01], { color: 'red' }).ball(0.032, [-0.004, 0.164, 0.01], { color: 'blue' });
    b.each(3, (i) => {
      const a = (i * Math.PI) / 3;
      b.torus([0.24, 0.085, 0.008], [0, 0.152, 0], { color: 'gray', rot: [0, 0, i * 60], tube: 0.04 });
      b.ball(0.022, [Math.cos(a) * 0.118, 0.152 + Math.sin(a) * 0.118, 0], { color: 'yellow', glow: true });
    });
    return b.done();
  }),
  e('attic', 'places', 'rooms', () => {
    const H = 1.5;
    const b = m('attic')
      .box([3.2, H, 2.6], [0, H / 2, 0], { color: 'cream', round: 0.03 })
      .box([0.7, 0.8, 0.08], [-0.8, 0.8, 1.3], { color: 'glass' })
      .box([0.7, 1.2, 0.08], [0.6, 0.6, 1.3], { color: 'darkwood' })
      .box([3.3, 0.14, 2.7], [0, H + 0.07, 0], { color: 'lightwood', round: 0.05 });
    b.pair((s) => b.box([0.14, 2.4, 2.8], [s * 0.78, H + 1.04, 0], { color: 'red', rot: [0, 0, s * 40], round: 0.1 }));
    b.wedge([2.9, 1.8, 0.1], [0, H + 1.04, -1.25], { color: 'wood' })
      .torus([0.5, 0.5, 0.06], [0, H + 1.0, -1.18], { color: 'darkwood', tube: 0.15 })
      .cyl([0.4, 0.04, 0.4], [0, H + 1.0, -1.2], { color: 'glass', rot: [90, 0, 0] })
      .box([0.8, 0.42, 0.5], [-0.35, H + 0.35, 0.3], { color: 'darkbrown', round: 0.2 })
      .box([0.82, 0.06, 0.52], [-0.35, H + 0.47, 0.3], { color: 'gold', round: 0.2 })
      .box([0.42, 0.38, 0.42], [0.45, H + 0.33, 0.4], { color: 'tan', round: 0.1 })
      .box([0.32, 0.28, 0.32], [0.42, H + 0.66, 0.4], { color: '#c9a46a', round: 0.1 })
      .stick([0, H + 1.95, 0.2], [0, H + 1.55, 0.2], 0.02, 'black')
      .ball(0.12, [0, H + 1.5, 0.2], { color: 'yellow', glow: true });
    return b.done();
  }),
  e('atv', 'garage', 'off-road', () => {
    const b = m('atv', { view: 'side' })
      .box([0.85, 0.4, 1.4], [0, 0.6, 0], { color: 'red', round: 0.4 })
      .box([0.4, 0.15, 0.6], [0, 0.88, -0.2], { color: 'black', round: 0.6 })
      .box([1.05, 0.1, 0.55], [0, 0.82, 0.62], { color: 'red', round: 0.4 })
      .box([1.05, 0.1, 0.55], [0, 0.82, -0.62], { color: 'red', round: 0.4 })
      .stick([0, 0.8, 0.35], [0, 1.05, 0.3], 0.05, 'darkgray')
      .stick([-0.35, 1.05, 0.3], [0.35, 1.05, 0.3], 0.04, 'black')
      .ball([0.2, 0.12, 0.08], [0, 0.72, 0.72], { color: 'yellow', glow: true });
    wheels(b, 0.52, [0.6, -0.6], 0.56, 0.3);
    return b.done();
  }),
  e('auction house', 'places', 'shops', () => {
    const b = temple('auction house', 'AUCTION', { col: 'cream', wall: 'maroon', n: 4 });
    b.cyl([0.9, 0.25, 0.9], [2.6, 0.125, 3.3], { color: 'darkwood' })
      .cyl([0.45, 1.1, 0.45], [2.6, 0.48, 3.3], { color: 'darkwood', rot: [0, 0, 90] })
      .cyl([0.48, 0.12, 0.48], [2.2, 0.48, 3.3], { color: 'gold', rot: [0, 0, 90] })
      .cyl([0.48, 0.12, 0.48], [3.0, 0.48, 3.3], { color: 'gold', rot: [0, 0, 90] })
      .stick([2.6, 0.5, 3.4], [2.6, 0.5, 4.6], 0.14, 'wood');
    return b.done();
  }),
  e('automatic door', 'home', 'doors and windows', () => {
    const b = m('automatic door')
      .box([2.6, 0.35, 0.3], [0, 2.38, 0], { color: 'steel', round: 0.1 })
      .box([2.6, 0.04, 0.3], [0, 0.02, 0], { color: 'gray', round: 0 })
      .box([0.3, 0.08, 0.06], [0, 2.3, 0.17], { color: 'black' })
      .ball(0.03, [0.08, 2.3, 0.2], { color: 'red', glow: true });
    b.pair((s) => {
      b.box([0.15, 2.2, 0.25], [s * 1.22, 1.1, 0], { color: 'steel', round: 0.1 });
      b.box([0.95, 2.1, 0.05], [s * 0.64, 1.09, 0.03], { color: 'glass', round: 0.05 });
      b.box([0.05, 2.1, 0.07], [s * 0.17, 1.09, 0.03], { color: 'silver', round: 0.2 });
      b.box([0.5, 0.06, 0.055], [s * 0.64, 1.3, 0.04], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('avocado', 'food', 'fruit', () =>
    m('avocado')
      .ball([0.095, 0.1, 0.055], [0, 0.05, -0.01], { color: '#2f4a1e' })
      .ball([0.07, 0.08, 0.05], [0, 0.11, -0.01], { color: '#2f4a1e' })
      .ball([0.088, 0.092, 0.03], [0, 0.05, 0.008], { color: '#a7c25a' })
      .ball([0.064, 0.074, 0.03], [0, 0.108, 0.008], { color: '#a7c25a' })
      .ball([0.072, 0.072, 0.03], [0, 0.054, 0.012], { color: '#e3e89a' })
      .ball([0.05, 0.06, 0.03], [0, 0.104, 0.012], { color: '#e3e89a' })
      .ball(0.044, [0, 0.06, 0.02], { color: '#7a4a28' })
      .done(),
  ),
  e('avocado tree', 'garden', 'fruit trees', () => tree('avocado tree', 6, { crown: 'darkgreen', crown2: '#356b30', fruit: '#2f4a1e', fruitSize: 0.3 }).done()),
  e('awning', 'places', 'street things', () => {
    const b = m('awning')
      .box([3.2, 3, 0.3], [0, 1.5, -0.15], { color: 'cream', round: 0.05 })
      .box([1, 2, 0.1], [-0.7, 1.0, 0.02], { color: 'darkwood' })
      .box([1.1, 1.0, 0.1], [0.8, 1.4, 0.02], { color: 'glass' });
    b.each(6, (i) => b.box([0.52, 0.05, 1.1], [-1.25 + i * 0.5, 2.45, 0.5], { color: i % 2 ? 'white' : 'red', rot: [25, 0, 0], round: 0 }));
    b.each(6, (i) => b.ball([0.5, 0.25, 0.06], [-1.25 + i * 0.5, 2.14, 1.0], { color: i % 2 ? 'white' : 'red' }));
    b.pair((s) => b.rod([s * 1.5, 1.8, 0], [s * 1.5, 2.2, 0.95], 0.04, 'darkgray'));
    return b.done();
  }),
  e('axe', 'workshop', 'hand tools', () =>
    m('axe')
      .cyl([0.42, 0.3, 0.42], [0, 0.15, 0], { color: 'bark' })
      .cyl([0.38, 0.02, 0.38], [0, 0.305, 0], { color: 'lightwood' })
      .box([0.2, 0.12, 0.045], [0, 0.33, 0], { color: 'iron', round: 0.2 })
      .box([0.03, 0.12, 0.05], [-0.1, 0.33, 0], { color: 'silver', round: 0.2 })
      .rod([0.08, 0.36, 0], [0.42, 0.75, 0], 0.045, 'wood')
      .done(),
  ),
  e('baby bottle', 'home', 'baby things', () => {
    const b = m('baby bottle')
      .cyl([0.065, 0.085, 0.065], [0, 0.0425, 0], { color: 'milk' })
      .cyl([0.065, 0.045, 0.065], [0, 0.1075, 0], { color: 'glass' })
      .cyl([0.072, 0.025, 0.072], [0, 0.142, 0], { color: 'skyblue' })
      .cyl([0.04, 0.025, 0.04], [0, 0.165, 0], { color: '#e8c79a', taper: 0.5 })
      .ball([0.022, 0.03, 0.022], [0, 0.18, 0], { color: '#e8c79a' });
    b.each(3, (i) => b.box([0.016, 0.003, 0.005], [0.012, 0.04 + i * 0.025, 0.032], { color: 'skyblue', noInk: true }));
    return b.done();
  }),
  e('baby monitor', 'tech', 'gadgets', () => {
    const b = m('baby monitor')
      .box([0.08, 0.12, 0.04], [0, 0.06, 0], { color: 'white', round: 0.7 })
      .box([0.055, 0.035, 0.01], [0, 0.085, 0.02], { color: 'skyblue', glow: true })
      .rod([0.025, 0.11, 0], [0.03, 0.16, 0], 0.012, 'white')
      .ball(0.016, [0.03, 0.165, 0], { color: 'white' })
      .ball([0.06, 0.06, 0.06], [-0.1, 0.09, -0.02], { color: 'white' })
      .stick([-0.1, 0, -0.02], [-0.1, 0.06, -0.02], 0.015, 'white')
      .cyl([0.05, 0.01, 0.04], [-0.1, 0.005, -0.02], { color: 'white' })
      .cyl([0.03, 0.012, 0.03], [-0.1, 0.09, 0.012], { color: 'black', rot: [90, 0, 0] });
    b.each(3, (i) => b.ball(0.009, [-0.018 + i * 0.018, 0.045, 0.02], { color: ['lime', 'yellow', 'red'][i], glow: true }));
    b.each(3, (i) => b.ball(0.007, [-0.014 + i * 0.014, 0.025, 0.02], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('baby powder', 'home', 'baby things', () => {
    const b = bottle(m('baby powder'), { h: 0.2, w: 0.075, body: 'white', cap: 'pink', label: 'skyblue', text: 'BABY POWDER', neck: 0.7 });
    b.ball([0.07, 0.03, 0.07], [0.08, 0.015, 0.04], { color: 'pink' });
    b.each(4, (i) => b.ball(0.012, [0.02 + i * 0.012, 0.205 + (i % 2) * 0.015, 0.01], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('back scratcher', 'home', 'bathroom', () => {
    const b = m('back scratcher')
      .box([0.1, 0.04, 0.08], [0, 0.02, 0], { color: 'darkwood', round: 0.3 })
      .rod([0, 0.03, 0], [0, 0.4, 0.015], 0.016, 'tan')
      .ball([0.024, 0.012, 0.024], [0, 0.15, 0.006], { color: 'lightwood' })
      .ball([0.024, 0.012, 0.024], [0, 0.28, 0.011], { color: 'lightwood' })
      .ball([0.05, 0.05, 0.02], [0, 0.42, 0.022], { color: 'tan', rot: [-20, 0, 0] });
    b.each(4, (i) => b.rod([-0.018 + i * 0.012, 0.44, 0.026], [-0.018 + i * 0.012, 0.455, 0.045], 0.01, 'tan'));
    return b.done();
  }),
  e('backhoe', 'garage', 'construction vehicles', () => {
    const Y = '#f2b21b', Y2 = '#d9961b';
    const b = m('backhoe', { view: 'side' })
      .box([1.3, 0.8, 2.6], [0, 1.15, 0.1], { color: Y, round: 0.2 })
      .box([1.2, 0.5, 1.1], [0, 1.65, 0.85], { color: Y, round: 0.3 })
      .box([1.15, 1.2, 1.15], [0, 2.15, -0.55], { color: 'glass', round: 0.1 })
      .box([1.3, 0.12, 1.35], [0, 2.8, -0.55], { color: Y, round: 0.2 })
      .stick([0.4, 1.8, 1.2], [0.4, 2.6, 1.2], 0.09, 'black');
    for (const [x, z] of [[0.55, 0.0], [-0.55, 0.0], [0.55, -1.1], [-0.55, -1.1]]) b.stick([x, 1.55, z], [x, 2.75, z], 0.07, Y);
    b.pair((s) => b.rod([s * 0.7, 1.4, 0.4], [s * 0.7, 0.75, 2.15], 0.13, Y).rod([s * 0.65, 1.0, -1.2], [s * 0.9, 0.15, -1.45], 0.12, Y).box([0.3, 0.08, 0.3], [s * 0.9, 0.04, -1.45], { color: 'darkgray' }));
    b.box([1.6, 0.6, 0.5], [0, 0.45, 2.4], { color: Y2, round: 0.2 })
      .rod([0, 1.4, -1.3], [0, 2.9, -2.1], 0.22, Y)
      .rod([0, 2.9, -2.1], [0, 1.0, -2.9], 0.17, Y)
      .stick([0, 1.7, -1.25], [0, 2.6, -1.8], 0.08, 'silver')
      .box([0.6, 0.45, 0.45], [0, 0.75, -3.0], { color: Y2, rot: [20, 0, 0], round: 0.2 });
    wheels(b, 0.7, [-0.5], 1.3, 0.45);
    wheels(b, 0.6, [1.2], 0.9, 0.35, { named: false });
    return b.done();
  }),
  e('backpack', 'wardrobe', 'bags', () =>
    m('backpack')
      .box([0.3, 0.42, 0.18], [0, 0.21, 0], { color: 'red', round: 0.6 })
      .box([0.31, 0.12, 0.19], [0, 0.38, 0], { color: 'darkred', round: 0.7 })
      .box([0.24, 0.17, 0.06], [0, 0.13, 0.1], { color: 'darkred', round: 0.6 })
      .box([0.12, 0.012, 0.01], [0, 0.17, 0.13], { color: 'black', noInk: true })
      .torus([0.08, 0.06, 0.02], [0, 0.45, -0.02], { color: 'black', tube: 0.18 })
      .capsule([0.04, 0.36, 0.03], [0.08, 0.22, -0.1], { color: 'black' })
      .capsule([0.04, 0.36, 0.03], [-0.08, 0.22, -0.1], { color: 'black' })
      .done(),
  ),
  e('bacon', 'food', 'breakfast', () => {
    const b = m('bacon').cyl([0.28, 0.02, 0.2], [0, 0.01, 0], { color: 'white' });
    for (const z of [-0.035, 0.035])
      b.each(5, (i) => {
        const x = -0.1 + i * 0.05, y = 0.026 + (i % 2) * 0.007, r = (i % 2 ? -1 : 1) * 12;
        b.box([0.056, 0.007, 0.034], [x, y, z], { color: '#b5543c', rot: [0, 0, r], round: 0.3 });
        b.box([0.056, 0.0075, 0.011], [x, y, z + 0.012], { color: '#f3d9c0', rot: [0, 0, r], round: 0.3, noInk: true });
      });
    return b.done();
  }),
  e('badge', 'wardrobe', 'pins and badges', () =>
    m('badge')
      .box([0.09, 0.12, 0.015], [0, 0.065, -0.008], { color: 'black', round: 0.3 })
      .box([0.07, 0.045, 0.012], [0, 0.088, 0.004], { color: 'gold', round: 0.3 })
      .cone([0.07, 0.05, 0.012], [0, 0.04, 0.004], { color: 'gold', rot: [180, 0, 0], segs: 4 })
      .cyl([0.036, 0.008, 0.036], [0, 0.07, 0.012], { color: 'navy', rot: [90, 0, 0] })
      .star(0.024, [0, 0.07, 0.017], { color: 'silver' })
      .done(),
  ),
  e('bag', 'home', 'bags and boxes', () =>
    m('bag')
      .ball([0.26, 0.28, 0.22], [0, 0.14, 0], { color: '#c8a46a' })
      .cyl([0.12, 0.06, 0.1], [0, 0.28, 0], { color: '#c8a46a', taper: 0.6 })
      .torus([0.085, 0.085, 0.02], [0, 0.3, 0], { color: 'brown', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.06, 0.05, 0.06], [0, 0.335, 0], { color: '#c8a46a', taper: 2 })
      .box([0.004, 0.16, 0.004], [0.04, 0.15, 0.105], { color: '#9a7a4a', noInk: true })
      .done(),
  ),
  e('bagel', 'food', 'bread', () => {
    const b = m('bagel')
      .box([0.14, 0.015, 0.08], [0, 0.0075, 0], { color: 'lightwood', round: 0.3 })
      .torus([0.1, 0.1, 0.038], [0, 0.064, 0], { color: '#c98a45', tube: 0.34 });
    b.each(7, (i) => { const a = (i / 7) * Math.PI * 2; b.ball([0.008, 0.005, 0.004], [Math.cos(a) * 0.034, 0.064 + Math.sin(a) * 0.034, 0.018], { color: 'cream', noInk: true, rot: [0, 0, i * 40] }); });
    return b.done();
  }),
  e('bagpipes', 'music', 'wind', () => {
    const b = m('bagpipes')
      .ball([0.3, 0.26, 0.2], [0, 0.28, 0], { color: 'red' })
      .box([0.31, 0.018, 0.21], [0, 0.3, 0], { color: 'darkgreen', noInk: true, rot: [0, 0, 20] })
      .box([0.018, 0.27, 0.21], [0.04, 0.28, 0], { color: 'darkgreen', noInk: true, rot: [0, 0, 20] })
      .rod([-0.06, 0.2, 0.06], [-0.1, 0.03, 0.1], 0.03, 'black')
      .rod([-0.08, 0.36, 0.05], [-0.16, 0.48, 0.12], 0.022, 'black');
    for (const [x, t] of [[0.08, 0.78], [0.0, 0.7], [-0.08, 0.62]] as Array<[number, number]>) b.rod([x, 0.36, -0.03], [x + 0.08, t, -0.1], 0.03, 'black').cyl([0.04, 0.04, 0.04], [x + 0.08, t + 0.02, -0.1], { color: 'cream' });
    return b.done();
  }),
  e('baguette', 'food', 'bread', () =>
    m('baguette')
      .box([0.15, 0.28, 0.1], [0, 0.14, 0], { color: '#bf9a6a', round: 0.1 })
      .box([0.152, 0.03, 0.102], [0, 0.265, 0], { color: '#a8845a', round: 0.1 })
      .rod([-0.02, 0.12, 0.005], [0.07, 0.62, 0.015], 0.066, '#e0a85a')
      .rod([0.03, 0.12, -0.012], [-0.07, 0.55, -0.02], 0.06, 'crust')
      .box([0.03, 0.008, 0.02], [0.05, 0.5, 0.045], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .box([0.03, 0.008, 0.02], [0.035, 0.42, 0.043], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .box([0.03, 0.008, 0.02], [0.065, 0.58, 0.046], { color: 'cream', rot: [0, 0, 35], noInk: true })
      .done(),
  ),
  e('bait', 'sports', 'fishing', () =>
    m('bait')
      .cyl([0.08, 0.08, 0.08], [0, 0.04, 0], { color: 'silver' })
      .cyl([0.082, 0.05, 0.082], [0, 0.04, 0], { color: 'teal' })
      .label('BAIT', [0.05, 0.026], [0, 0.04, 0.037], { color: 'teal' })
      .ball([0.074, 0.02, 0.074], [0, 0.08, 0], { color: 'dirt' })
      .rod([0.01, 0.08, 0.01], [0.02, 0.12, 0.02], 0.012, 'pink')
      .rod([0.02, 0.12, 0.02], [0.045, 0.125, 0.03], 0.012, 'pink')
      .rod([-0.015, 0.08, 0], [-0.03, 0.115, 0.01], 0.012, 'pink')
      .rod([-0.03, 0.115, 0.01], [-0.05, 0.1, 0.02], 0.012, 'pink')
      .done(),
  ),
  e('baked beans', 'food', 'canned food', () => {
    const b = m('baked beans')
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: 'silver' })
      .cyl([0.082, 0.06, 0.082], [0, 0.05, 0], { color: 'teal' })
      .label('BEANS', [0.05, 0.03], [0, 0.05, 0.037], { color: 'teal' })
      .ball([0.072, 0.025, 0.072], [0, 0.1, 0], { color: '#d2691e' })
      .cyl([0.078, 0.004, 0.078], [0, 0.135, -0.045], { color: 'silver', rot: [70, 0, 0] });
    around(5, 0.018).forEach(([x, z], i) => b.ball([0.014, 0.01, 0.009], [x, 0.11, z], { color: '#e07a2e', rot: [0, i * 40, 0] }));
    return b.done();
  }),
  e('bakery', 'places', 'shops', () => {
    const b = shop('bakery', 'BAKERY', { wall: '#f7d9b0', roof: '#c0504d', sign: 'white', door: 'red' });
    b.capsule([0.6, 1.6, 0.4], [0, 3.6, 2.1], { color: 'bread', rot: [0, 0, 90] });
    b.each(3, (i) => b.box([0.05, 0.3, 0.05], [-0.4 + i * 0.4, 3.72, 2.3], { color: 'cream', rot: [0, 0, 30], noInk: true }));
    b.cyl([0.6, 0.3, 0.6], [1.5, 0.9, 2.15], { color: 'pink' }).ball(0.12, [1.5, 1.1, 2.15], { color: 'red' });
    return b.done();
  }),
  e('baking powder', 'food', 'baking', () => jar(m('baking powder'), { h: 0.12, w: 0.08, fill: 'red', lid: 'silver', label: 'white', text: 'BAKING POWDER' }).done()),
  e('baking sheet', 'kitchen', 'bakeware', () => {
    const b = m('baking sheet')
      .box([0.42, 0.03, 0.3], [0, 0.015, 0], { color: 'steel', round: 0.3 })
      .box([0.38, 0.006, 0.26], [0, 0.03, 0], { color: 'metal', round: 0.2 });
    b.each(6, (i) => b.cyl([0.07, 0.016, 0.07], [-0.12 + (i % 3) * 0.12, 0.04, -0.06 + Math.floor(i / 3) * 0.12], { color: 'bread' }));
    b.each(6, (i) => b.ball([0.014, 0.008, 0.014], [-0.11 + (i % 3) * 0.12, 0.05, -0.05 + Math.floor(i / 3) * 0.12], { color: 'chocolate', noInk: true }));
    return b.done();
  }),
  e('balcony', 'places', 'house parts', () => {
    const b = m('balcony')
      .box([3.4, 3.4, 0.3], [0, 1.7, -0.6], { color: '#e8c9a0', round: 0.03 })
      .box([1.0, 1.85, 0.1], [0, 1.97, -0.42], { color: 'glass' })
      .box([2.6, 0.15, 1.2], [0, 1.0, 0.15], { color: 'lightgray', round: 0.1 })
      .box([2.6, 0.07, 0.07], [0, 1.95, 0.72], { color: 'white', round: 0.3 });
    b.pair((s) => b.box([0.07, 0.07, 1.15], [s * 1.27, 1.95, 0.15], { color: 'white', round: 0.3 }).stick([s * 1.27, 1.08, 0.72], [s * 1.27, 1.95, 0.72], 0.06, 'white'));
    b.each(7, (i) => b.stick([-0.9 + i * 0.3, 1.08, 0.72], [-0.9 + i * 0.3, 1.95, 0.72], 0.04, 'white'));
    b.pair((s) => b.box([0.3, 0.22, 0.2], [s * 0.8, 2.1, 0.72], { color: '#c0703a' }).ball([0.32, 0.2, 0.22], [s * 0.8, 2.28, 0.72], { color: s > 0 ? 'red' : 'pink' }));
    return b.done();
  }),
  e('ball', 'toys', 'balls', () =>
    m('ball')
      .ball(0.22, [0, 0.11, 0], { color: 'red' })
      .torus([0.223, 0.223, 0.06], [0, 0.11, 0], { color: 'yellow', tube: 0.03, noInk: true })
      .torus([0.223, 0.223, 0.06], [0, 0.11, 0], { color: 'blue', tube: 0.03, rot: [0, 90, 0], noInk: true })
      .ball([0.04, 0.03, 0.01], [-0.04, 0.17, 0.088], { color: 'white', noInk: true, rot: [-30, 0, 20] })
      .done(),
  ),
  e('ball bearing', 'workshop', 'hardware', () => {
    const b = m('ball bearing')
      .box([0.1, 0.012, 0.05], [0, 0.006, 0], { color: 'darkwood', round: 0.3 })
      .torus([0.1, 0.1, 0.028], [0, 0.062, 0], { color: 'steel', tube: 0.18 })
      .torus([0.052, 0.052, 0.028], [0, 0.062, 0], { color: 'steel', tube: 0.26 });
    around(8, 0.038).forEach(([x, y]) => b.ball(0.02, [x, 0.062 + y, 0], { color: 'silver' }));
    return b.done();
  }),
  e('ball gown', 'wardrobe', 'dresses', () =>
    form('ball gown')
      .box([0.38, 0.32, 0.24], [0, 1.18, 0], { color: 'pink', round: 0.8 })
      .cyl([1.0, 0.85, 1.0], [0, 0.44, 0], { color: 'pink', taper: 0.36 })
      .torus([1.02, 1.02, 0.08], [0, 0.05, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06 })
      .torus([0.4, 0.4, 0.06], [0, 0.9, 0], { color: 'magenta', rot: [90, 0, 0], tube: 0.12 })
      .ball([0.12, 0.1, 0.06], [0, 0.9, -0.2], { color: 'magenta' })
      .capsule([0.04, 0.12, 0.04], [0.12, 1.34, 0], { color: 'pink', rot: [0, 0, 20] })
      .capsule([0.04, 0.12, 0.04], [-0.12, 1.34, 0], { color: 'pink', rot: [0, 0, -20] })
      .done(),
  ),
  e('ball pit', 'toys', 'playground', () => {
    const b = m('ball pit').box([1.6, 0.36, 1.6], [0, 0.2, 0], { color: 'yellow', round: 0.2 });
    b.pair((s) => b.box([2, 0.5, 0.25], [0, 0.25, s * 0.9], { color: 'blue', round: 0.5 }).box([0.25, 0.5, 1.55], [s * 0.9, 0.25, 0], { color: 'blue', round: 0.5 }));
    b.each(20, (i) => b.ball(0.2, [((i * 37) % 9) / 8 * 1.4 - 0.7, 0.42 + (i % 3) * 0.03, ((i * 53) % 7) / 6 * 1.4 - 0.7], { color: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink'][i % 7] }));
    return b.done();
  }),
  e('balloon (fun)', 'toys', 'party', () =>
    m('balloon (fun)')
      .ball([0.26, 0.32, 0.26], [0, 0.6, 0], { color: 'red' })
      .cone([0.04, 0.035, 0.04], [0, 0.432, 0], { color: 'red', rot: [180, 0, 0] })
      .ball([0.05, 0.08, 0.02], [-0.05, 0.67, 0.115], { color: 'white', noInk: true, rot: [0, 0, 20] })
      .rod([0, 0.42, 0], [0.03, 0.22, 0], 0.006, 'white')
      .rod([0.03, 0.22, 0], [0, 0.05, 0], 0.006, 'white')
      .cyl([0.07, 0.05, 0.07], [0, 0.025, 0], { color: 'silver' })
      .done(),
  ),
  e('ballroom', 'places', 'rooms', () => {
    const b = room('ballroom', { w: 5, d: 4, h: 3.6, floor: '#d8b07a', wall: '#f3e2c0' });
    b.each(3, (i) => b.box([0.7, 1.7, 0.06], [-1.2 + i * 1.4, 1.6, -1.92], { color: 'glass' }).cyl([0.7, 0.06, 0.7], [-1.2 + i * 1.4, 2.45, -1.92], { color: 'glass', rot: [90, 0, 0] }));
    b.each(4, (i) => b.box([0.8, 0.01, 0.8], [-1.3 + (i % 2) * 2.2, 0.125, -0.8 + Math.floor(i / 2) * 1.8], { color: '#a8763a', rot: [0, 45, 0], noInk: true }));
    b.pair((s) => b.cyl([0.4, 3.5, 0.4], [s * 2.2, 1.8, -1.7], { color: 'white' }));
    b.stick([0, 3.6, 0], [0, 3.0, 0], 0.04, 'gold').ball([0.35, 0.3, 0.35], [0, 2.9, 0], { color: 'gold' }).torus([1.2, 1.2, 0.08], [0, 2.85, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.1 });
    around(6, 0.6).forEach(([x, z]) => b.ball([0.1, 0.16, 0.1], [x, 2.98, z], { color: 'flame', glow: true }));
    return b.done();
  }),
  e('balls', 'toys', 'balls', () =>
    m('balls')
      .ball(0.08, [0, 0.04, 0], { color: 'red' })
      .ball(0.065, [0.075, 0.0325, 0.01], { color: 'blue' })
      .ball(0.06, [-0.07, 0.03, 0.02], { color: 'yellow' })
      .ball(0.055, [0.02, 0.0275, 0.07], { color: 'lime' })
      .ball(0.05, [0.0, 0.1, -0.01], { color: 'purple' })
      .done(),
  ),
  e('ballet shoes', 'wardrobe', 'shoes', () => {
    const b = m('ballet shoes');
    b.pair((s) => {
      b.ball([0.07, 0.055, 0.21], [s * 0.045, 0.028, 0], { color: '#f6b7c8' });
      b.ball([0.045, 0.02, 0.09], [s * 0.045, 0.05, -0.04], { color: '#e88aa5' });
      b.rod([s * 0.045, 0.05, -0.03], [s * 0.012, 0.13, -0.02], 0.012, '#f6b7c8');
      b.ball([0.04, 0.025, 0.015], [s * 0.022, 0.14, -0.02], { color: '#f6b7c8', rot: [0, 0, s * 20] });
    });
    return b.done();
  }),
  e('bamboo', 'garden', 'grasses', () => {
    const b = m('bamboo').cyl([1.4, 0.5, 1.2], [0, 0.25, 0], { color: 'dirt', taper: 0.6 });
    const st: Array<[number, number, number]> = [[0, 0, 6], [0.35, 0.15, 5.2], [-0.3, 0.2, 4.6], [0.15, -0.3, 5.6], [-0.2, -0.2, 4.0]];
    st.forEach(([x, z, h], i) => {
      b.stick([x, 0.3, z], [x * 1.3, h, z * 1.3], 0.16, i % 2 ? '#7cb854' : '#5aa553');
      b.each(3, (k) => { const t = (k + 1) / 4; b.cyl([0.2, 0.06, 0.2], [x * (1 + 0.3 * t), 0.3 + (h - 0.3) * t, z * (1 + 0.3 * t)], { color: '#3f7a3a' }); });
      if (i < 3) b.pair((s) => leaf(b, [x * 1.25, h * 0.85, z * 1.25], [x * 1.25 + s * 0.9, h * 0.85 + 0.3, z * 1.25 + 0.2], 0.22, 'leaf'));
    });
    return b.done();
  }),
  e('banana', 'food', 'fruit', () => {
    const b = m('banana');
    const pts: Array<[number, number]> = [[-0.1, 0.07], [-0.06, 0.035], [0, 0.022], [0.06, 0.035], [0.095, 0.065]];
    for (const [z, dy] of [[-0.036, 0], [0, 0.006], [0.036, 0]] as Array<[number, number]>) {
      for (let i = 0; i < 4; i++) b.rod([pts[i][0], pts[i][1] + dy, z], [pts[i + 1][0], pts[i + 1][1] + dy, z], 0.038, 'banana');
      b.ball(0.016, [0.1, 0.07 + dy, z], { color: 'darkbrown' });
    }
    b.rod([-0.1, 0.07, 0], [-0.125, 0.1, 0], 0.03, '#8a8f3a');
    return b.done();
  }),
  e('banana bread', 'food', 'cakes', () =>
    m('banana bread')
      .box([0.32, 0.025, 0.18], [0, 0.0125, 0], { color: 'lightwood', round: 0.3 })
      .box([0.22, 0.08, 0.11], [-0.03, 0.065, 0], { color: '#8a5a2b', round: 0.4 })
      .ball([0.2, 0.05, 0.09], [-0.03, 0.1, 0], { color: '#6b4226' })
      .box([0.12, 0.008, 0.01], [-0.03, 0.124, 0], { color: '#c99a5a', noInk: true })
      .box([0.022, 0.08, 0.1], [0.12, 0.065, 0.01], { color: '#d9a866', rot: [0, 0, -12], round: 0.3 })
      .cyl([0.03, 0.01, 0.03], [-0.07, 0.124, 0.01], { color: 'cream' })
      .cyl([0.03, 0.01, 0.03], [0.0, 0.126, -0.01], { color: 'cream' })
      .done(),
  ),
  e('banana chips', 'food', 'snacks', () => {
    const b = bowl(m('banana chips'), { d: 0.16, h: 0.05, color: 'teal', fill: '#f2d27a' });
    around(7, 0.042).forEach(([x, z], i) => b.cyl([0.036, 0.008, 0.036], [x, 0.068 + (i % 2) * 0.006, z], { color: '#f7dc8a', rot: [20 + i * 15, i * 50, 0] }));
    b.cyl([0.036, 0.008, 0.036], [0, 0.08, 0], { color: '#f7dc8a', rot: [30, 0, 0] });
    return b.done();
  }),
  e('banana peel', 'food', 'leftovers', () => {
    const b = m('banana peel')
      .cyl([0.04, 0.05, 0.04], [0, 0.03, 0], { color: 'banana', taper: 0.6 })
      .rod([0, 0.05, 0], [0.006, 0.08, 0], 0.016, '#8a8f3a');
    around(4, 1, 0.5).forEach(([x, z]) => {
      b.ball([0.04, 0.014, 0.12], [x * 0.065, 0.01, z * 0.065], { color: 'banana', rot: [0, Math.atan2(x, z) * RAD, 0] });
      b.ball(0.016, [x * 0.12, 0.01, z * 0.12], { color: 'darkbrown' });
    });
    return b.done();
  }),
  e('banana suit', 'wardrobe', 'costumes', () => {
    const b = m('banana suit')
      .capsule([0.52, 1.45, 0.44], [0, 1.05, 0], { color: 'banana', rot: [0, 0, 6] })
      .capsule([0.2, 0.4, 0.2], [-0.07, 1.82, 0], { color: 'banana', rot: [0, 0, 18] })
      .ball(0.08, [-0.12, 2.02, 0], { color: 'darkbrown' })
      .ball([0.22, 0.26, 0.08], [0, 1.4, 0.19], { color: 'skin2' })
      .ball(0.03, [0.045, 1.43, 0.23], { color: 'black', eye: true })
      .ball(0.03, [-0.045, 1.43, 0.23], { color: 'black', eye: true })
      .box([0.06, 0.012, 0.01], [0, 1.34, 0.23], { color: 'darkred', round: 0.5 });
    b.pair((s) => {
      b.capsule([0.12, 0.62, 0.12], [s * 0.1, 0.33, 0], { color: 'denim' });
      b.box([0.12, 0.08, 0.2], [s * 0.1, 0.04, 0.04], { color: 'black', round: 0.5 });
      b.rod([s * 0.24, 1.25, 0], [s * 0.38, 0.85, 0.05], 0.1, 'banana');
      b.ball(0.08, [s * 0.39, 0.8, 0.06], { color: 'skin2' });
    });
    return b.done();
  }),
  e('banana tree', 'garden', 'fruit trees', () => {
    const b = m('banana tree')
      .cyl([0.45, 3.3, 0.45], [0, 1.65, 0], { color: '#7a8a4a', taper: 0.75 })
      .ball(0.4, [0, 3.35, 0], { color: '#5f8a45', name: 'top' });
    around(6, 1, 0.3).forEach(([x, z], i) => leaf(b, [x * 0.15, 3.35, z * 0.15], [x * 2.0, 3.35 + (i % 2 ? 0.7 : -0.3), z * 2.0], 0.7, i % 2 ? 'leaf' : '#4f9a48', 'top'));
    b.rod([0.15, 3.1, 0.2], [0.35, 2.7, 0.35], 0.06, '#7a8a4a').ball([0.55, 0.65, 0.5], [0.4, 2.45, 0.4], { color: 'banana' }).ball([0.2, 0.3, 0.2], [0.42, 1.95, 0.42], { color: '#7a2a4a' });
    return b.done();
  }),
  e('band saw', 'workshop', 'power tools', () =>
    m('band saw')
      .box([0.5, 0.75, 0.42], [0, 0.375, 0], { color: 'darkgray', round: 0.1 })
      .box([0.56, 0.34, 0.3], [0, 0.95, 0], { color: '#3f7a3a', round: 0.5 })
      .box([0.56, 0.34, 0.3], [0, 1.6, 0], { color: '#3f7a3a', round: 0.5 })
      .box([0.14, 0.42, 0.22], [-0.2, 1.28, 0], { color: '#3f7a3a', round: 0.2 })
      .box([0.6, 0.04, 0.5], [0.05, 1.14, 0.02], { color: 'steel', round: 0.2 })
      .stick([0.12, 1.12, 0.06], [0.12, 1.45, 0.06], 0.012, 'silver')
      .box([0.06, 0.12, 0.07], [0.12, 1.42, 0.06], { color: 'black' })
      .box([0.06, 0.05, 0.03], [0.18, 0.95, 0.16], { color: 'red' })
      .done(),
  ),
  e('bandage', 'clinic', 'first aid', () =>
    m('bandage')
      .cyl([0.09, 0.07, 0.09], [0, 0.045, 0], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.03, 0.072, 0.03], [0, 0.045, 0], { color: 'lightgray', rot: [90, 0, 0] })
      .box([0.16, 0.004, 0.068], [0.1, 0.002, 0], { color: 'white', round: 0 })
      .box([0.09, 0.006, 0.028], [-0.04, 0.003, 0.08], { color: 'tan', round: 0.6 })
      .box([0.03, 0.007, 0.02], [-0.04, 0.004, 0.08], { color: 'cream', round: 0.3 })
      .done(),
  ),
  e('bandana', 'wardrobe', 'scarves', () => {
    const b = m('bandana')
      .cyl([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' })
      .stick([0, 0.04, 0], [0, 0.11, 0], 0.03, 'darkwood')
      .ball([0.17, 0.22, 0.19], [0, 0.21, 0], { color: 'beige' })
      .ball([0.185, 0.15, 0.2], [0, 0.265, -0.005], { color: 'red' })
      .ball([0.05, 0.045, 0.045], [0, 0.25, -0.1], { color: 'red' })
      .box([0.04, 0.1, 0.01], [0.025, 0.2, -0.11], { color: 'red', rot: [0, 0, 20], round: 0.3 })
      .box([0.04, 0.1, 0.01], [-0.025, 0.2, -0.11], { color: 'red', rot: [0, 0, -20], round: 0.3 });
    for (const [x, y, z] of [[-0.05, 0.3, 0.07], [0.04, 0.32, 0.07], [0, 0.27, 0.095], [0.07, 0.27, 0.05], [-0.075, 0.25, 0.05]]) b.ball([0.02, 0.02, 0.008], [x, y, z], { color: 'white', noInk: true });
    return b.done();
  }),
  e('bandit mask', 'wardrobe', 'masks', () =>
    m('bandit mask')
      .cyl([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' })
      .stick([0, 0.04, 0], [0, 0.11, 0], 0.03, 'darkwood')
      .ball([0.17, 0.22, 0.19], [0, 0.21, 0], { color: 'beige' })
      .box([0.19, 0.055, 0.12], [0, 0.235, 0.045], { color: 'black', round: 0.8 })
      .ball([0.035, 0.024, 0.01], [0.04, 0.235, 0.104], { color: 'white' })
      .ball([0.035, 0.024, 0.01], [-0.04, 0.235, 0.104], { color: 'white' })
      .rod([0.0, 0.235, -0.08], [-0.03, 0.2, -0.13], 0.014, 'black')
      .done(),
  ),
  e('banjo', 'music', 'strings', () => {
    const b = m('banjo')
      .cyl([0.3, 0.085, 0.3], [0, 0.17, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.27, 0.02, 0.27], [0, 0.17, 0.037], { color: 'cream', rot: [90, 0, 0] })
      .box([0.05, 0.56, 0.035], [0, 0.6, 0], { color: 'darkwood' })
      .box([0.09, 0.14, 0.035], [0, 0.94, -0.01], { color: 'darkwood' })
      .box([0.06, 0.012, 0.012], [0, 0.12, 0.04], { color: 'tan' })
      .box([0.04, 0.05, 0.015], [0, 0.05, 0.03], { color: 'silver' })
      .ball(0.018, [0.035, 0.55, 0], { color: 'cream' });
    b.each(3, (i) => b.stick([-0.012 + i * 0.012, 0.06, 0.04], [-0.012 + i * 0.012, 0.88, 0.022], 0.003, 'silver', { noInk: true }));
    b.pair((s) => b.each(2, (i) => b.ball(0.02, [s * 0.055, 0.92 + i * 0.05, -0.01], { color: 'cream' })));
    return b.done();
  }),
  e('bank', 'places', 'banks', () => {
    const b = temple('bank', 'BANK', { w: 6, h: 3.5, n: 4, wall: 'stone' });
    b.cyl([0.8, 0.1, 0.8], [0, 5.45, 2.05], { color: 'gold', rot: [90, 0, 0] }).label('$', [0.45, 0.45], [0, 5.45, 2.1], { color: 'gold' });
    return b.done();
  }),
  e('banner', 'ideas', 'flags', () => {
    const b = m('banner')
      .cyl([0.4, 0.17, 0.4], [0, 0.085, 0], { color: 'darkgray' })
      .stick([0, 0.17, 0], [0, 2.1, 0], 0.05, 'darkwood')
      .ball(0.09, [0, 2.15, 0], { color: 'gold' })
      .stick([-0.45, 1.95, 0.03], [0.45, 1.95, 0.03], 0.035, 'darkwood')
      .box([0.8, 0.95, 0.02], [0, 1.45, 0.05], { color: 'red', round: 0.1 })
      .box([0.8, 0.05, 0.025], [0, 1.9, 0.05], { color: 'gold', round: 0.3 })
      .star(0.35, [0, 1.5, 0.065], { color: 'gold' });
    b.pair((s) => b.wedge([0.4, 0.3, 0.02], [s * 0.2, 0.83, 0.05], { color: 'red', rot: [0, 0, 180] }));
    return b.done();
  }),
  e('bar stool', 'home', 'seating', () =>
    m('bar stool')
      .cyl([0.42, 0.05, 0.42], [0, 0.025, 0], { color: 'silver' })
      .stick([0, 0.05, 0], [0, 0.95, 0], 0.06, 'silver')
      .torus([0.38, 0.38, 0.025], [0, 0.35, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.08 })
      .rod([0, 0.35, 0], [0.18, 0.35, 0], 0.02, 'silver')
      .rod([0, 0.35, 0], [-0.18, 0.35, 0], 0.02, 'silver')
      .cyl([0.4, 0.1, 0.4], [0, 1.0, 0], { color: 'red' })
      .ball([0.4, 0.06, 0.4], [0, 1.05, 0], { color: 'red' })
      .done(),
  ),
  e('barbed wire', 'workshop', 'fencing', () => {
    const b = m('barbed wire');
    b.each(3, (i) => b.box([0.16, 1.2, 0.16], [-1 + i, 0.6, 0], { color: 'wood', round: 0.2 }));
    for (const y of [0.4, 0.75, 1.1]) {
      b.stick([-1.1, y, 0.09], [1.1, y, 0.09], 0.014, 'steel');
      for (const x of [-0.5, 0.5]) b.rod([x - 0.03, y - 0.03, 0.09], [x + 0.03, y + 0.03, 0.09], 0.01, 'steel').rod([x - 0.03, y + 0.03, 0.09], [x + 0.03, y - 0.03, 0.09], 0.01, 'steel');
    }
    return b.done();
  }),
  e("barber's pole", 'places', 'street things', () => {
    const t = 25;
    const b = m("barber's pole")
      .cyl([0.3, 0.1, 0.3], [0, 0.05, 0], { color: 'silver' })
      .ball([0.3, 0.12, 0.3], [0, 0.14, 0], { color: 'silver' })
      .cyl([0.24, 1.0, 0.24], [0, 0.7, 0], { color: 'white' })
      .ball([0.3, 0.14, 0.3], [0, 1.24, 0], { color: 'silver' })
      .ball(0.08, [0, 1.34, 0], { color: 'silver' });
    b.each(6, (i) => b.torus([0.245, 0.245 / Math.cos(t / RAD), 0.05], [0, 0.32 + i * 0.15, 0], { color: i % 2 ? 'blue' : 'red', rot: [90 - t, 0, 0], tube: 0.06, noInk: true }));
    return b.done();
  }),
  e('barcode', 'ideas', 'symbols', () => {
    const b = plinth(m('barcode'), 0.16).box([0.16, 0.11, 0.012], [0, 0.088, 0], { color: 'white', round: 0.1 });
    const bars = [0.004, 0.008, 0.004, 0.012, 0.004, 0.006, 0.01, 0.004, 0.008, 0.004, 0.012, 0.006];
    let x = -0.065;
    for (const w of bars) { b.box([w, 0.06, 0.004], [x + w / 2, 0.1, 0.007], { color: 'black', noInk: true, round: 0 }); x += w + 0.0045; }
    b.label('0 12345 67890', [0.13, 0.02], [0, 0.054, 0.006], { color: 'white' });
    return b.done();
  }),
  e('bark', 'garden', 'tree parts', () => {
    const b = m('bark')
      .box([0.16, 0.2, 0.04], [0, 0.1, 0], { color: 'bark', round: 0.3 })
      .box([0.15, 0.19, 0.01], [0, 0.1, -0.02], { color: 'tan', round: 0.3 })
      .ball([0.05, 0.04, 0.01], [0.03, 0.15, 0.03], { color: 'green', noInk: true });
    b.each(4, (i) => b.capsule([0.026, 0.17 + (i % 2) * 0.03, 0.02], [-0.06 + i * 0.04, 0.1, 0.022], { color: '#5e3d26' }));
    return b.done();
  }),
  e('barn', 'farm', 'farm buildings', () => {
    const R = '#b8362e';
    const b = m('barn')
      .box([5, 3.5, 6], [0, 1.75, 0], { color: R, round: 0.03 })
      .wedge([5.6, 2.6, 6.4], [0, 4.8, 0], { color: 'darkgray' })
      .wedge([4.8, 2.3, 0.1], [0, 4.65, 3.06], { color: R })
      .box([2.1, 2.5, 0.1], [0, 1.25, 3.02], { color: 'white', round: 0 })
      .box([1.9, 2.3, 0.1], [0, 1.2, 3.06], { color: R, name: 'door', pivot: [-0.95, 1.2, 3.06], round: 0 })
      .box([0.12, 2.8, 0.06], [0, 1.2, 3.12], { color: 'white', rot: [0, 0, 39], parent: 'door' })
      .box([0.12, 2.8, 0.06], [0, 1.2, 3.12], { color: 'white', rot: [0, 0, -39], parent: 'door' })
      .box([1.0, 1.0, 0.1], [0, 4.3, 3.14], { color: 'white', round: 0 })
      .box([0.8, 0.8, 0.1], [0, 4.3, 3.17], { color: 'darkbrown', round: 0 })
      .cyl([1.8, 6, 1.8], [-3.6, 3, -1], { color: 'lightgray' })
      .ball([1.8, 1.2, 1.8], [-3.6, 6, -1], { color: 'silver' });
    b.each(3, (i) => b.cyl([1.84, 0.1, 1.84], [-3.6, 1.5 + i * 1.5, -1], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('barracks', 'places', 'military', () => {
    const b = m('barracks')
      .box([9, 2.6, 3.5], [0, 1.3, 0], { color: '#8a8f5a', round: 0.03 })
      .wedge([3.9, 1.4, 9.4], [0, 3.3, 0], { color: 'darkgreen', rot: [0, 90, 0] })
      .box([1.0, 1.8, 0.1], [0, 0.9, 1.76], { color: 'darkwood', name: 'door', pivot: [-0.5, 0.9, 1.76] })
      .label('BARRACKS', [2.4, 0.4], [0, 2.2, 1.8], { color: 'white' })
      .stick([5.2, 0, 2], [5.2, 5, 2], 0.1, 'silver')
      .box([1.2, 0.75, 0.04], [5.82, 4.55, 2], { color: 'red', round: 0.1 })
      .star(0.4, [5.82, 4.55, 2.03], { color: 'white' });
    for (const x of [-4, -2.8, -1.5, 1.5, 2.8, 4]) b.box([0.8, 0.9, 0.08], [x, 1.5, 1.76], { color: 'glass' });
    return b.done();
  }),
  e('barrette', 'wardrobe', 'hair accessories', () => {
    const b = m('barrette')
      .box([0.1, 0.02, 0.025], [0, 0.01, 0], { color: 'silver', round: 0.8 })
      .capsule([0.024, 0.1, 0.022], [0, 0.028, 0], { color: 'pink', rot: [0, 0, 90] })
      .ball(0.018, [0, 0.052, 0], { color: 'magenta' });
    b.pair((s) => b.ball([0.042, 0.034, 0.02], [s * 0.022, 0.052, 0], { color: 'pink', rot: [0, 0, s * 25] }).ball(0.01, [s * 0.04, 0.03, 0.01], { color: 'white' }));
    return b.done();
  }),
  e('barrier', 'workshop', 'roadworks', () => {
    const b = m('barrier');
    b.pair((s) => {
      b.box([0.3, 0.17, 0.6], [s * 0.75, 0.085, 0], { color: 'darkgray', round: 0.3 });
      b.rod([s * 0.75, 0.1, 0.22], [s * 0.75, 1.1, 0], 0.06, 'gray').rod([s * 0.75, 0.1, -0.22], [s * 0.75, 1.1, 0], 0.06, 'gray');
    });
    for (const y of [0.55, 0.92]) {
      b.box([1.7, 0.22, 0.05], [0, y, 0.08], { color: 'white', round: 0.1 });
      b.each(4, (i) => b.box([0.12, 0.22, 0.054], [-0.6 + i * 0.4, y, 0.08], { color: 'orange', rot: [0, 0, 35], noInk: true, round: 0 }));
    }
    b.box([0.12, 0.1, 0.08], [0.75, 1.17, 0], { color: 'black' }).ball(0.1, [0.75, 1.26, 0], { color: 'orange', glow: true });
    return b.done();
  }),
  e('baseball', 'sports', 'balls', () =>
    m('baseball')
      .ball(0.075, [0, 0.0375, 0], { color: 'white' })
      .torus([0.0755, 0.0755, 0.008], [0, 0.0375, 0], { color: 'red', tube: 0.04, rot: [0, 40, 25], noInk: true })
      .torus([0.0755, 0.0755, 0.008], [0, 0.0375, 0], { color: 'red', tube: 0.04, rot: [0, -40, -25], noInk: true })
      .done(),
  ),
  e('baseball base', 'sports', 'baseball', () =>
    m('baseball base')
      .box([0.4, 0.03, 0.4], [0, 0.015, 0], { color: 'gray', round: 0.3, rot: [0, 45, 0] })
      .box([0.38, 0.07, 0.38], [0, 0.06, 0], { color: 'white', round: 0.4, rot: [0, 45, 0] })
      .done(),
  ),
  e('baseball glove', 'sports', 'baseball', () => {
    const b = m('baseball glove')
      .cyl([0.14, 0.05, 0.09], [0, 0.025, 0], { color: 'darkbrown' })
      .ball([0.22, 0.24, 0.1], [0, 0.15, 0], { color: 'leather' })
      .capsule([0.055, 0.16, 0.055], [0.13, 0.16, 0], { color: '#9a6a3a', rot: [0, 0, -38] })
      .box([0.08, 0.08, 0.02], [0.1, 0.26, 0], { color: 'darkbrown', rot: [0, 0, -20] })
      .ball([0.13, 0.14, 0.03], [0, 0.15, 0.045], { color: '#6b4226' })
      .ball(0.074, [0, 0.16, 0.07], { color: 'white' })
      .torus([0.075, 0.075, 0.008], [0, 0.16, 0.07], { color: 'red', tube: 0.04, rot: [0, 40, 25], noInk: true });
    b.each(4, (i) => b.capsule([0.05, 0.15, 0.055], [-0.075 + i * 0.042, 0.3, -0.005], { color: '#9a6a3a', rot: [0, 0, (1.5 - i) * 8] }));
    return b.done();
  }),
  e('baseboard', 'home', 'fixtures', () =>
    m('baseboard')
      .box([0.8, 0.02, 0.4], [0, 0.01, 0], { color: 'lightwood', round: 0 })
      .box([0.8, 0.4, 0.08], [0, 0.22, -0.16], { color: '#b8d4e8', round: 0.05 })
      .box([0.8, 0.12, 0.03], [0, 0.08, -0.105], { color: 'white', round: 0.2 })
      .box([0.8, 0.02, 0.04], [0, 0.145, -0.1], { color: 'white', round: 0.5 })
      .done(),
  ),
  e('basement', 'places', 'rooms', () => {
    const b = room('basement', { w: 3.2, d: 3, h: 2.4, floor: '#9a9a96', wall: '#b5b3ae' });
    b.each(6, (i) => b.box([0.8, 0.1, 0.4], [-1.1, 2.2 - i * 0.38, -1.25 + i * 0.38], { color: 'wood', round: 0.1 }));
    b.stick([-0.7, 2.3, -1.3], [-0.7, 0.3, 0.7], 0.06, 'darkwood');
    b.cyl([0.6, 1.5, 0.6], [1.0, 0.87, -1.0], { color: 'lightgray' }).stick([1.0, 1.6, -1.0], [1.0, 2.4, -1.0], 0.08, 'copper');
    b.box([0.5, 0.4, 0.5], [0.4, 0.32, 0.4], { color: 'tan', round: 0.1 }).box([0.4, 0.3, 0.4], [0.45, 0.67, 0.4], { color: '#c9a46a', round: 0.1 });
    b.box([0.6, 0.3, 0.06], [0.2, 2.05, -1.43], { color: 'glass' });
    b.stick([0.2, 2.4, 0.0], [0.2, 2.0, 0.0], 0.02, 'black').ball(0.12, [0.2, 1.95, 0], { color: 'yellow', glow: true });
    return b.done();
  }),
  e('basket', 'home', 'baskets', () => {
    const b = m('basket')
      .cyl([0.3, 0.18, 0.24], [0, 0.09, 0], { color: '#c8964a', taper: 1.15 })
      .torus([0.345, 0.276, 0.03], [0, 0.18, 0], { color: '#a8763a', rot: [90, 0, 0], tube: 0.08 })
      .torus([0.3, 0.32, 0.03], [0, 0.18, 0], { color: '#a8763a', tube: 0.1 })
      .ball([0.2, 0.06, 0.16], [0.02, 0.185, 0], { color: 'red' });
    b.each(2, (i) => b.torus([0.314 + i * 0.022, 0.25 + i * 0.018, 0.02], [0, 0.05 + i * 0.06, 0], { color: '#a8763a', rot: [90, 0, 0], tube: 0.06, noInk: true }));
    return b.done();
  }),
  e('basketball', 'sports', 'balls', () =>
    m('basketball')
      .ball(0.24, [0, 0.12, 0], { color: '#e8792b' })
      .torus([0.242, 0.242, 0.008], [0, 0.12, 0], { color: 'black', tube: 0.03, noInk: true })
      .torus([0.242, 0.242, 0.008], [0, 0.12, 0], { color: 'black', tube: 0.03, rot: [0, 90, 0], noInk: true })
      .torus([0.242, 0.242, 0.008], [0, 0.12, 0], { color: 'black', tube: 0.03, rot: [90, 0, 0], noInk: true })
      .done(),
  ),
  e('basketball court', 'sports', 'courts', () => {
    const b = m('basketball court', { view: 'side' })
      .box([8, 0.1, 14], [0, 0.05, 0], { color: 'lightwood', round: 0.05 })
      .box([8, 0.01, 0.1], [0, 0.105, 0], { color: 'white', noInk: true })
      .torus([1.8, 1.8, 0.02], [0, 0.105, 0], { color: 'white', rot: [90, 0, 0], tube: 0.04, noInk: true });
    b.each(3, (i) => b.box([1.2, 0.6 + i * 0.6, 10], [-4.6 - i * 1.1, (0.6 + i * 0.6) / 2, 0], { color: i % 2 ? 'blue' : 'navy', round: 0.05 }));
    b.pair((s) => {
      b.box([2.4, 0.01, 2.8], [0, 0.105, s * 5.6], { color: 'orange', noInk: true, round: 0 });
      b.stick([0, 0.1, s * 7.2], [0, 3.4, s * 7.2], 0.2, 'gray');
      b.box([1.8, 1.05, 0.08], [0, 3.5, s * 6.9], { color: 'white' });
      b.torus([0.46, 0.46, 0.04], [0, 3.05, s * 6.6], { color: 'orange', rot: [90, 0, 0], tube: 0.1 });
      b.cyl([0.26, 0.4, 0.26], [0, 2.83, s * 6.6], { color: 'white', taper: 1.7 });
    });
    return b.done();
  }),
  e('basketball goal', 'sports', 'basketball', () =>
    m('basketball goal')
      .box([0.6, 0.3, 0.9], [0, 0.15, -0.35], { color: 'darkgray', round: 0.2 })
      .stick([0, 0.3, -0.5], [0, 3.25, -0.5], 0.12, 'gray')
      .rod([0, 3.2, -0.5], [0, 3.3, -0.17], 0.08, 'gray')
      .box([1.8, 1.05, 0.06], [0, 3.4, -0.15], { color: 'white', round: 0.1 })
      .box([0.6, 0.45, 0.02], [0, 3.3, -0.11], { color: 'red', round: 0 })
      .box([0.5, 0.35, 0.024], [0, 3.32, -0.11], { color: 'white', round: 0 })
      .torus([0.46, 0.46, 0.04], [0, 3.05, 0.15], { color: 'orange', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.26, 0.42, 0.26], [0, 2.83, 0.15], { color: 'white', taper: 1.7 })
      .done(),
  ),
  e('basketball jersey', 'wardrobe', 'sportswear', () => {
    const b = form('basketball jersey')
      .box([0.38, 0.52, 0.235], [0, 1.06, 0], { color: 'red', round: 0.85 })
      .label('23', [0.16, 0.14], [0, 1.06, 0.122], { color: 'white' });
    b.pair((s) => b.rod([s * 0.065, 1.33, 0.09], [0, 1.25, 0.12], 0.018, 'white').torus([0.08, 0.15, 0.02], [s * 0.18, 1.22, 0], { color: 'white', rot: [0, 90, 0], tube: 0.15 }));
    return b.done();
  }),
  e('bat (sports)', 'sports', 'baseball', () =>
    m('bat (sports)')
      .ball([0.065, 0.03, 0.065], [0, 0.015, 0], { color: 'darkwood' })
      .cyl([0.032, 0.42, 0.032], [0, 0.24, 0], { color: 'lightwood', taper: 1.6 })
      .cyl([0.036, 0.15, 0.036], [0, 0.11, 0], { color: 'black' })
      .cyl([0.06, 0.32, 0.06], [0, 0.6, 0], { color: 'lightwood', taper: 1.15 })
      .ball([0.07, 0.06, 0.07], [0, 0.76, 0], { color: 'lightwood' })
      .ball(0.075, [0.09, 0.0375, 0.05], { color: 'white' })
      .torus([0.0755, 0.0755, 0.008], [0.09, 0.0375, 0.05], { color: 'red', tube: 0.04, rot: [0, 40, 25], noInk: true })
      .done(),
  ),
  e('bat-signal', 'tech', 'lights', () => {
    const b = m('bat-signal')
      .box([1.4, 0.6, 1.4], [0, 0.3, 0], { color: 'darkgray', round: 0.2 })
      .cyl([1.0, 1.2, 1.0], [0, 1.3, 0], { color: 'steel', rot: [40, 0, 0] })
      .cyl([0.95, 0.06, 0.95], [0, 1.76, 0.39], { color: 'yellow', glow: true, rot: [40, 0, 0] })
      .cyl([0.9, 2.4, 0.9], [0, 2.7, 1.35], { color: 'flame', glow: true, taper: 2.2, rot: [40, 0, 0] })
      .ball([2.6, 1.5, 0.12], [0, 4.4, 2.6], { color: 'yellow', glow: true })
      .ball([0.45, 0.35, 0.1], [0, 4.4, 2.68], { color: 'black' });
    b.pair((s) => {
      b.rod([s * 0.65, 0.6, 0], [s * 0.6, 1.3, 0], 0.1, 'darkgray');
      b.wedge([0.9, 0.55, 0.08], [s * 0.6, 4.45, 2.68], { color: 'black', rot: [0, 0, s * -100], apex: s * 0.3 });
    });
    return b.done();
  }),
  e('bath mat', 'home', 'bathroom', () =>
    m('bath mat')
      .box([0.7, 0.03, 0.42], [0, 0.015, 0.03], { color: 'skyblue', round: 0.8 })
      .cyl([0.08, 0.7, 0.08], [0, 0.04, -0.2], { color: 'skyblue', rot: [0, 0, 90] })
      .box([0.7, 0.032, 0.05], [0, 0.016, 0.1], { color: 'white', noInk: true, round: 0.5 })
      .box([0.7, 0.032, 0.05], [0, 0.016, -0.05], { color: 'white', noInk: true, round: 0.5 })
      .done(),
  ),
  e('bathroom', 'places', 'rooms', () => {
    const b = room('bathroom', { w: 3, d: 2.6, h: 2.4, floor: '#d4e6f0', wall: '#a8d8f5' });
    b.cyl([0.36, 0.4, 0.46], [-0.9, 0.32, -0.6], { color: 'white', taper: 1.2 }).torus([0.42, 0.52, 0.06], [-0.9, 0.53, -0.6], { color: 'white', rot: [90, 0, 0], tube: 0.18 })
      .box([0.44, 0.45, 0.2], [-0.9, 0.72, -1.08], { color: 'white', round: 0.3 });
    b.stick([0.2, 0.1, -1.05], [0.2, 0.75, -1.05], 0.14, 'white').box([0.55, 0.15, 0.4], [0.2, 0.82, -1.0], { color: 'white', round: 0.5 })
      .rod([0.2, 0.9, -1.17], [0.2, 0.96, -1.05], 0.03, 'silver').box([0.6, 0.7, 0.04], [0.2, 1.6, -1.22], { color: 'glass', round: 0.2 });
    b.box([0.8, 0.55, 1.5], [1.0, 0.39, -0.4], { color: 'white', round: 0.5 }).box([0.62, 0.05, 1.3], [1.0, 0.64, -0.4], { color: 'water', round: 0.5 });
    b.box([0.45, 0.6, 0.04], [-0.4, 1.3, -1.22], { color: 'pink', round: 0.3 });
    return b.done();
  }),
  e('bathtub', 'home', 'bathroom', () => {
    const b = m('bathtub')
      .box([1.6, 0.5, 0.75], [0, 0.4, 0], { color: 'white', round: 0.8 })
      .box([1.45, 0.05, 0.6], [0, 0.63, 0], { color: 'water', round: 0.5 })
      .stick([-0.7, 0.6, 0], [-0.7, 0.85, 0], 0.04, 'silver')
      .rod([-0.7, 0.85, 0], [-0.6, 0.8, 0], 0.035, 'silver')
      .ball([0.09, 0.07, 0.08], [0.3, 0.68, 0.1], { color: 'yellow' })
      .ball(0.06, [0.33, 0.74, 0.1], { color: 'yellow' })
      .cone([0.025, 0.03, 0.02], [0.37, 0.74, 0.1], { color: 'orange', rot: [0, 0, -90] });
    for (const [x, z] of [[0.6, 0.25], [-0.6, 0.25], [0.6, -0.25], [-0.6, -0.25]]) b.ball([0.1, 0.16, 0.1], [x, 0.09, z], { color: 'gold' });
    around(4, 0.15, 0.4).forEach(([x, z]) => b.ball(0.08, [x + 0.05, 0.66, z], { color: 'white' }));
    return b.done();
  }),
  e('batman costume', 'wardrobe', 'costumes', () => who('batman costume', { top: '#5a5d63', bottom: '#5a5d63', shoes: 'black', long: true, style: 'none', acc: [hat('catears', 'black'), face('mask', 'black'), wear('cape', 'black'), wear('belt', 'gold')] })),
  e('batmobile (regular)', 'garage', 'cars', () => {
    const b = m('batmobile (regular)', { view: 'side' })
      .box([2.0, 0.55, 4.6], [0, 0.62, -0.2], { color: '#2a2726', round: 0.6 })
      .ball([1.8, 0.45, 1.8], [0, 0.6, 2.2], { color: '#2a2726' })
      .ball([1.2, 0.55, 1.8], [0, 1.0, -0.3], { color: '#3a4a5a' })
      .cyl([0.55, 0.25, 0.55], [0, 0.65, -2.55], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.4, 0.05, 0.4], [0, 0.65, -2.68], { color: 'fire', rot: [90, 0, 0], glow: true });
    b.pair((s) => {
      b.wedge([1.8, 0.9, 0.08], [s * 0.85, 1.25, -1.8], { color: '#2a2726', rot: [0, 90, 0], apex: 0.4 });
      b.ball([0.25, 0.1, 0.06], [s * 0.55, 0.68, 3.0], { color: 'yellow', glow: true });
    });
    wheels(b, 0.95, [1.6, -1.5], 0.75, 0.35, { hub: 'darkgray' });
    return b.done();
  }),
  e('baton (performance)', 'music', 'marching band', () =>
    m('baton (performance)')
      .ball(0.07, [0, 0.035, 0], { color: 'white' })
      .stick([0, 0.06, 0], [0, 0.6, 0], 0.016, 'silver')
      .ball([0.045, 0.055, 0.045], [0, 0.62, 0], { color: 'white' })
      .torus([0.03, 0.03, 0.01], [0, 0.33, 0], { color: 'pink', rot: [90, 0, 0], tube: 0.3 })
      .done(),
  ),
  e('batter (food)', 'food', 'baking', () => {
    const b = bowl(m('batter (food)'), { d: 0.24, h: 0.11, color: 'skyblue', fill: '#f3dc9a' });
    b.stick([0.02, 0.12, 0], [0.1, 0.3, 0.02], 0.016, 'silver')
      .torus([0.04, 0.09, 0.008], [0.015, 0.12, 0], { color: 'silver', rot: [0, 0, -24], tube: 0.12 })
      .torus([0.04, 0.09, 0.008], [0.015, 0.12, 0], { color: 'silver', rot: [0, 90, -24], tube: 0.12 })
      .capsule([0.02, 0.05, 0.015], [0.0, 0.09, 0.115], { color: '#f3dc9a' });
    return b.done();
  }),
  e('battering ram', 'armory', 'siege weapons', () => {
    const b = m('battering ram', { view: 'side' })
      .stick([0, 2.2, -1.4], [0, 2.2, 1.4], 0.16, 'darkwood')
      .capsule([0.42, 3.6, 0.42], [0, 1.2, 0.3], { color: 'bark', rot: [90, 0, 0] })
      .cyl([0.52, 0.4, 0.52], [0, 1.2, 2.2], { color: 'iron', rot: [90, 0, 0] })
      .cone([0.36, 0.25, 0.36], [0, 1.2, 2.5], { color: 'iron', rot: [90, 0, 0] })
      .stick([0, 2.2, -0.6], [0, 1.4, -0.6], 0.04, 'tan')
      .stick([0, 2.2, 0.9], [0, 1.4, 0.9], 0.04, 'tan');
    for (const z of [-1.2, 1.2]) b.pair((s) => b.rod([s * 0.8, 0.5, z], [0, 2.2, z], 0.14, 'wood'));
    b.pair((s) => b.stick([s * 0.8, 0.5, -1.6], [s * 0.8, 0.5, 1.6], 0.22, 'darkwood'));
    wheels(b, 0.95, [1.2, -1.2], 0.9, 0.2, { hub: 'darkwood', tire: 'darkwood' });
    return b.done();
  }),
  e('battery', 'tech', 'power', () =>
    m('battery')
      .cyl([0.045, 0.085, 0.045], [0, 0.0425, 0], { color: 'black' })
      .cyl([0.0455, 0.035, 0.0455], [0, 0.085, 0], { color: 'copper' })
      .cyl([0.016, 0.008, 0.016], [0, 0.106, 0], { color: 'silver' })
      .label('+', [0.018, 0.018], [0, 0.085, 0.019], { color: 'copper' })
      .done(),
  ),
  e('battle axe', 'armory', 'axes', () => {
    const b = m('battle axe')
      .box([0.35, 0.12, 0.25], [0, 0.06, 0], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.1, 0], [0, 1.4, 0], 0.05, 'darkwood')
      .cyl([0.06, 0.25, 0.06], [0, 0.35, 0], { color: 'leather' })
      .box([0.1, 0.16, 0.07], [0, 1.15, 0], { color: 'iron', round: 0.2 });
    b.pair((s) => b.ball([0.28, 0.42, 0.04], [s * 0.17, 1.15, 0], { color: 'steel' }));
    spike(b, [0, 1.3, 0], [0, 1.58, 0], 0.06, 'steel', { segs: 4 });
    return b.done();
  }),
  e('battleship', 'garage', 'ships', () => {
    const b = m('battleship', { view: 'side' })
      .box([2.4, 1.4, 16], [0, 0.7, 0], { color: 'gray', round: 0.4 })
      .cone([2.4, 2.4, 1.4], [0, 0.7, 9.2], { color: 'gray', rot: [90, 0, 0] })
      .box([2.45, 0.3, 16], [0, 0.15, 0], { color: 'darkred', round: 0.3 })
      .box([2.3, 0.1, 16], [0, 1.45, 0], { color: 'darkgray', round: 0.2 })
      .box([1.6, 1.4, 3], [0, 2.1, -0.5], { color: 'gray', round: 0.1 })
      .box([1.2, 0.9, 1.6], [0, 3.2, 0.0], { color: 'gray', round: 0.1 })
      .stick([0, 3.6, 0], [0, 5.6, 0], 0.15, 'darkgray')
      .cyl([0.8, 1.6, 1.0], [0, 3.0, -2.0], { color: 'darkgray' });
    for (const [z, d] of [[4.6, 1], [2.6, 1], [-4.6, -1]] as Array<[number, number]>) {
      b.box([1.2, 0.6, 1.4], [0, 1.8, z], { color: 'gray', round: 0.6 });
      b.pair((s) => b.stick([s * 0.2, 1.85, z + d * 0.6], [s * 0.2, 2.0, z + d * 2.4], 0.12, 'darkgray'));
    }
    return b.done();
  }),
  e('bayonet', 'armory', 'blades', () =>
    m('bayonet')
      .box([0.16, 0.05, 0.08], [0, 0.025, 0], { color: 'darkwood', round: 0.3 })
      .box([0.035, 0.1, 0.03], [0, 0.1, 0], { color: 'black', round: 0.3 })
      .box([0.09, 0.016, 0.022], [0.005, 0.157, 0], { color: 'steel' })
      .torus([0.04, 0.04, 0.014], [0.03, 0.18, 0], { color: 'steel', tube: 0.2 })
      .box([0.03, 0.3, 0.008], [0, 0.31, 0], { color: 'silver', round: 0.2 })
      .cone([0.03, 0.06, 0.008], [0, 0.49, 0], { color: 'silver', segs: 4 })
      .box([0.004, 0.25, 0.009], [0, 0.3, 0], { color: 'steel', noInk: true, round: 0 })
      .done(),
  ),
  e('bb gun', 'armory', 'guns', () =>
    m('bb gun', { view: 'side' })
      .box([0.085, 0.14, 0.32], [0, 0.17, -0.36], { color: 'wood', rot: [-8, 0, 0], round: 0.3 })
      .box([0.05, 0.065, 0.24], [0, 0.22, -0.08], { color: 'darkgray', round: 0.3 })
      .stick([0, 0.245, 0.04], [0, 0.245, 0.56], 0.022, 'darkgray')
      .stick([0, 0.215, 0.04], [0, 0.215, 0.45], 0.018, 'darkgray')
      .box([0.05, 0.045, 0.18], [0, 0.205, 0.14], { color: 'wood', round: 0.4 })
      .torus([0.08, 0.06, 0.014], [0, 0.15, -0.1], { color: 'darkgray', rot: [0, 90, 0], tube: 0.18 })
      .box([0.01, 0.025, 0.012], [0, 0.265, 0.54], { color: 'black' })
      .done(),
  ),
  e('bbq sauce', 'food', 'sauces', () => bottle(m('bbq sauce'), { h: 0.2, w: 0.075, body: '#5a1e14', cap: 'red', label: 'orange', text: 'BBQ', neck: 0.55 }).cone([0.022, 0.035, 0.022], [0, 0.215, 0], { color: 'red' }).done()),
  e('bbq wing', 'food', 'meat', () =>
    m('bbq wing')
      .cyl([0.22, 0.015, 0.22], [0, 0.0075, 0], { color: 'white' })
      .capsule([0.04, 0.09, 0.036], [-0.02, 0.035, 0.03], { color: '#a0401c', rot: [0, 0, 80] })
      .ball([0.055, 0.048, 0.048], [-0.07, 0.038, 0.03], { color: '#a0401c' })
      .ball(0.018, [0.03, 0.03, 0.03], { color: 'cream' })
      .ball([0.08, 0.03, 0.05], [0.04, 0.03, -0.045], { color: '#8a3518', rot: [0, 30, 0] })
      .rod([-0.07, 0.025, -0.05], [-0.01, 0.025, -0.08], 0.018, 'lime')
      .ball([0.008, 0.004, 0.008], [-0.03, 0.054, 0.03], { color: 'cream', noInk: true })
      .ball([0.008, 0.004, 0.008], [-0.06, 0.06, 0.035], { color: 'cream', noInk: true })
      .done(),
  ),
  e('beach ball', 'toys', 'balls', () => {
    const b = m('beach ball').ball(0.6, [0, 0.3, 0], { color: 'white' });
    ['red', 'yellow', 'blue'].forEach((c, i) => b.torus([0.604, 0.604, 0.2], [0, 0.3, 0], { color: c, tube: 0.11, rot: [0, i * 60, 0], noInk: true }));
    b.ball([0.16, 0.04, 0.16], [0, 0.592, 0], { color: 'white' });
    return b.done();
  }),
  e('beach umbrella', 'sports', 'beach', () => {
    const b = m('beach umbrella')
      .cyl([0.6, 0.15, 0.6], [0, 0.075, 0], { color: 'sand', taper: 0.4 })
      .stick([0, 0.1, 0], [0, 2.0, 0], 0.05, 'white')
      .cyl([2.2, 0.17, 2.2], [0, 1.645, 0], { color: 'red', taper: 0.667 })
      .cyl([1.467, 0.17, 1.467], [0, 1.81, 0], { color: 'white', taper: 0.5 })
      .cone([0.733, 0.17, 0.733], [0, 1.975, 0], { color: 'red' })
      .ball(0.07, [0, 2.07, 0], { color: 'white' });
    around(8, 1.08).forEach(([x, z], i) => b.ball([0.2, 0.1, 0.2], [x, 1.55, z], { color: i % 2 ? 'white' : 'red' }));
    return b.done();
  }),
  e('beacon', 'places', 'lighthouses', () => {
    const b = m('beacon').cyl([2, 0.4, 2], [0, 0.2, 0], { color: 'rock' });
    const ds = [1.4, 1.25, 1.1, 0.95, 0.8];
    b.each(4, (i) => b.cyl([ds[i], 0.8, ds[i]], [0, 0.8 + i * 0.8, 0], { color: i % 2 ? 'white' : 'red', taper: ds[i + 1] / ds[i] }));
    b.cyl([1.3, 0.12, 1.3], [0, 3.66, 0], { color: 'darkgray' })
      .torus([1.3, 1.3, 0.2], [0, 3.82, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.04 })
      .cyl([0.7, 0.6, 0.7], [0, 4.0, 0], { color: 'yellow', glow: true })
      .cone([0.95, 0.5, 0.95], [0, 4.55, 0], { color: 'red' })
      .ball(0.15, [0, 4.85, 0], { color: 'darkgray' })
      .box([0.35, 0.6, 0.06], [0, 1.2, 0.66], { color: 'darkwood' });
    return b.done();
  }),
  e('beak', 'aviary', 'bird parts', () =>
    m('beak', { view: 'side' })
      .box([0.08, 0.02, 0.1], [0, 0.01, -0.02], { color: 'darkwood', round: 0.3 })
      .ball([0.07, 0.08, 0.08], [0, 0.06, -0.02], { color: 'skyblue' })
      .cone([0.045, 0.1, 0.035], [0, 0.07, 0.065], { color: 'orange', rot: [90, 0, 0] })
      .cone([0.032, 0.065, 0.024], [0, 0.048, 0.05], { color: '#e07a1a', rot: [100, 0, 0] })
      .ball(0.016, [0.03, 0.08, 0.0], { color: 'black', eye: true })
      .ball(0.016, [-0.03, 0.08, 0.0], { color: 'black', eye: true })
      .done(),
  ),
  e('beaker', 'study', 'lab gear', () => {
    const b = m('beaker')
      .cyl([0.09, 0.07, 0.09], [0, 0.035, 0], { color: 'cyan' })
      .cyl([0.09, 0.06, 0.09], [0, 0.1, 0], { color: 'glass' })
      .torus([0.096, 0.096, 0.012], [0, 0.13, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.12 })
      .cone([0.025, 0.025, 0.012], [0, 0.13, 0.048], { color: 'glass', rot: [70, 0, 0] });
    b.each(3, (i) => b.box([0.02, 0.004, 0.004], [0.015, 0.03 + i * 0.03, 0.045], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('bean', 'food', 'vegetables', () => {
    const b = m('bean');
    const pts: Array<[number, number]> = [[-0.07, 0.014], [-0.04, 0.046], [0, 0.062], [0.04, 0.052], [0.072, 0.02]];
    for (let i = 0; i < 4; i++) b.rod([pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.024, '#6fa646');
    for (let i = 1; i < 4; i++) b.ball([0.03, 0.028, 0.028], [pts[i][0], pts[i][1], 0], { color: '#7cb854' });
    b.rod([-0.07, 0.014, 0], [-0.085, 0.004, 0], 0.012, '#5a8a3a');
    b.ball([0.02, 0.014, 0.028], [0.03, 0.007, 0.05], { color: '#b8d98a' }).ball([0.02, 0.014, 0.028], [-0.01, 0.007, 0.055], { color: '#b8d98a', rot: [0, 40, 0] });
    return b.done();
  }),
  e('bean bag (chair)', 'home', 'seating', () =>
    m('bean bag (chair)')
      .ball([0.95, 0.55, 0.9], [0, 0.28, 0], { color: 'purple' })
      .ball([0.82, 0.62, 0.45], [0, 0.55, -0.24], { color: 'purple' })
      .ball([0.52, 0.14, 0.42], [0, 0.52, 0.12], { color: '#7a4fb0' })
      .done(),
  ),
  e('beanie', 'wardrobe', 'hats', () =>
    m('beanie')
      .cyl([0.2, 0.06, 0.2], [0, 0.03, 0], { color: 'darkred' })
      .ball([0.19, 0.2, 0.19], [0, 0.1, 0], { color: 'red' })
      .cyl([0.192, 0.025, 0.192], [0, 0.11, 0], { color: 'white' })
      .ball(0.07, [0, 0.21, 0], { color: 'white' })
      .done(),
  ),
  e('bear rug', 'home', 'rugs', () => {
    const B = '#5a3a22';
    const b = m('bear rug')
      .ball([1.0, 0.06, 1.6], [0, 0.03, -0.1], { color: B })
      .ball([0.36, 0.3, 0.42], [0, 0.15, 0.82], { color: B })
      .ball([0.18, 0.14, 0.22], [0, 0.12, 1.06], { color: 'tan' })
      .ball(0.05, [0, 0.16, 1.17], { color: 'black' })
      .ball([0.12, 0.05, 0.1], [0, 0.06, 1.1], { color: 'darkred' })
      .ball(0.04, [0, 0.07, -0.92], { color: B });
    b.pair((s) => {
      for (const [z, r] of [[0.35, 35], [-0.6, -35]] as Array<[number, number]>) b.ball([0.6, 0.05, 0.26], [s * 0.58, 0.025, z], { color: B, rot: [0, s * r, 0] }).ball([0.1, 0.03, 0.1], [s * 0.86, 0.03, z + Math.sign(z) * 0.15], { color: 'cream' });
      b.ball(0.11, [s * 0.14, 0.3, 0.75], { color: B });
      b.ball(0.04, [s * 0.08, 0.22, 0.98], { color: 'black', eye: true });
    });
    return b.done();
  }),
  e('bear suit', 'wardrobe', 'costumes', () => who('bear suit', { top: 'brown', bottom: 'brown', shoes: 'darkbrown', long: true, style: 'none', acc: [hat('hood', 'brown'), hat('catears', 'brown')] })),
  e('bear trap', 'sports', 'hunting', () => {
    const b = m('bear trap')
      .cyl([0.38, 0.03, 0.1], [0, 0.015, 0], { color: 'iron' })
      .cyl([0.1, 0.02, 0.1], [0, 0.035, 0], { color: 'steel' });
    b.pair((s) => {
      b.box([0.08, 0.05, 0.08], [s * 0.21, 0.025, 0], { color: 'iron' });
      const p = [0, 45, 90, 135, 180].map((d) => { const a = d / RAD; return [0.15 * Math.cos(a), 0.03 + 0.11 * Math.sin(a), s * 0.1 * Math.sin(a)] as Vec3; });
      for (let i = 0; i < 4; i++) {
        b.rod(p[i], p[i + 1], 0.02, 'iron');
        const mid: Vec3 = [(p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2 + 0.02, (p[i][2] + p[i + 1][2]) / 2 * 0.9];
        b.cone([0.022, 0.04, 0.022], mid, { color: 'steel' });
      }
    });
    b.each(3, (i) => b.torus([0.04, 0.03, 0.01], [0, 0.015, -0.08 - i * 0.03], { color: 'iron', rot: [i % 2 ? 0 : 90, 90, 0], tube: 0.2 }));
    return b.done();
  }),
  e('beard', 'wardrobe', 'hair and beards', () =>
    m('beard')
      .cyl([0.14, 0.03, 0.12], [0, 0.015, 0], { color: 'darkwood' })
      .ball([0.17, 0.2, 0.18], [0, 0.17, 0], { color: 'skin2' })
      .ball([0.19, 0.2, 0.13], [0, 0.11, 0.045], { color: 'brown' })
      .ball([0.06, 0.03, 0.04], [0.03, 0.17, 0.09], { color: 'brown', rot: [0, 0, -15] })
      .ball([0.06, 0.03, 0.04], [-0.03, 0.17, 0.09], { color: 'brown', rot: [0, 0, 15] })
      .ball(0.022, [0, 0.195, 0.09], { color: 'skin3' })
      .ball(0.02, [0.035, 0.22, 0.08], { color: 'black', eye: true })
      .ball(0.02, [-0.035, 0.22, 0.08], { color: 'black', eye: true })
      .ball([0.18, 0.08, 0.18], [0, 0.26, -0.01], { color: 'brown' })
      .done(),
  ),
  e('beaver dam', 'wild', 'animal homes', () => {
    const b = m('beaver dam')
      .box([4, 0.6, 1.6], [0, 0.3, -1.0], { color: 'water', round: 0.1 })
      .box([4, 0.1, 1.2], [0, 0.05, 1.0], { color: 'water', round: 0.1 })
      .cyl([3.8, 0.9, 1.2], [0, 0.45, 0], { color: 'darkbrown', taper: 0.65 });
    b.each(9, (i) => {
      const x = -1.6 + i * 0.4, y = 0.35 + (i % 3) * 0.2, z = 0.35 - (i % 3) * 0.15;
      b.rod([x - 0.4, y - 0.1, z], [x + 0.4, y + 0.12, z + 0.05], 0.08, i % 2 ? 'wood' : 'bark');
    });
    b.ball([0.35, 0.28, 0.45], [0.8, 1.0, 0.1], { color: 'brown' }).ball(0.2, [0.8, 1.12, 0.35], { color: 'brown' })
      .ball([0.2, 0.05, 0.3], [0.8, 0.92, -0.25], { color: '#3a2a1e' }).box([0.06, 0.05, 0.02], [0.8, 1.08, 0.46], { color: 'white', round: 0 });
    return b.done();
  }),
  e('bed', 'home', 'bedroom', () => {
    const b = m('bed')
      .box([1.5, 0.3, 2.0], [0, 0.3, 0], { color: 'wood', round: 0.1 })
      .box([1.4, 0.2, 1.9], [0, 0.55, 0], { color: 'white', round: 0.4 })
      .box([1.46, 0.08, 1.35], [0, 0.66, 0.28], { color: 'blue', round: 0.5 })
      .box([1.46, 0.07, 0.2], [0, 0.69, -0.42], { color: 'white', round: 0.6 })
      .box([1.6, 1.0, 0.1], [0, 0.65, -1.0], { color: 'darkwood', round: 0.2 })
      .box([1.6, 0.55, 0.1], [0, 0.42, 1.0], { color: 'darkwood', round: 0.2 });
    b.pair((s) => b.box([0.55, 0.14, 0.32], [s * 0.35, 0.72, -0.72], { color: 'white', round: 0.8 }));
    return b.done();
  }),
  e('bedroom', 'places', 'rooms', () => {
    const b = room('bedroom', { w: 3.2, d: 3, h: 2.4, wall: '#f4d6e0', wall2: '#e8c4d4' })
      .box([1.2, 0.3, 1.8], [0.4, 0.27, -0.5], { color: 'wood', round: 0.1 })
      .box([1.15, 0.18, 1.75], [0.4, 0.5, -0.5], { color: 'white', round: 0.4 })
      .box([1.2, 0.07, 1.2], [0.4, 0.6, -0.22], { color: 'purple', round: 0.5 })
      .box([0.8, 0.12, 0.3], [0.4, 0.64, -1.18], { color: 'white', round: 0.8 })
      .box([1.3, 0.9, 0.08], [0.4, 0.6, -1.42], { color: 'darkwood', round: 0.2 })
      .box([0.45, 0.5, 0.4], [-0.75, 0.37, -1.2], { color: 'darkwood', round: 0.1 })
      .stick([-0.75, 0.62, -1.2], [-0.75, 0.82, -1.2], 0.03, 'gold')
      .cyl([0.3, 0.22, 0.3], [-0.75, 0.9, -1.2], { color: 'cream', taper: 0.6, glow: true })
      .box([0.06, 0.8, 0.8], [-1.54, 1.5, 0.2], { color: 'glass' })
      .cyl([1.0, 0.02, 0.7], [0.3, 0.13, 0.8], { color: 'pink' });
    return b.done();
  }),
  e('bedspread', 'home', 'bedding', () => {
    const b = m('bedspread');
    ['blue', 'red', 'teal'].forEach((c, i) => b.box([0.6, 0.06, 0.45], [0, 0.03 + i * 0.062, 0], { color: c, round: 0.6 }));
    const P = ['yellow', 'pink', 'green', 'orange', 'skyblue', 'purple', 'cream', 'red', 'lime'];
    b.each(9, (i) => b.box([0.17, 0.006, 0.12], [-0.19 + (i % 3) * 0.19, 0.188, -0.14 + Math.floor(i / 3) * 0.14], { color: P[i], noInk: true, round: 0.3 }));
    b.each(4, (i) => b.box([0.1, 0.04, 0.006], [-0.21 + i * 0.14, 0.09, 0.226], { color: P[(i * 2) % 9], noInk: true, round: 0.3 }));
    return b.done();
  }),
  e('beef', 'food', 'meat', () =>
    m('beef')
      .box([0.4, 0.03, 0.28], [0, 0.015, 0], { color: 'wood', round: 0.3 })
      .ball([0.3, 0.05, 0.2], [0, 0.05, 0], { color: '#b03a2e' })
      .torus([0.31, 0.21, 0.035], [0, 0.05, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.08 })
      .box([0.016, 0.012, 0.15], [0.03, 0.074, 0], { color: 'cream', round: 0.5 })
      .box([0.06, 0.012, 0.016], [0.0, 0.075, -0.02], { color: 'cream', round: 0.5 })
      .ball([0.04, 0.006, 0.02], [-0.07, 0.074, 0.03], { color: '#f0c0b0', noInk: true })
      .ball([0.03, 0.006, 0.02], [0.08, 0.074, -0.04], { color: '#f0c0b0', noInk: true })
      .rod([-0.17, 0.035, -0.1], [-0.09, 0.035, -0.12], 0.012, 'darkgreen')
      .done(),
  ),
  e('beehive', 'bugs', 'bug homes', () => {
    const b = m('beehive')
      .cyl([0.5, 0.04, 0.5], [0, 0.02, 0], { color: 'wood' })
      .ball([0.38, 0.5, 0.38], [0, 0.25, 0], { color: '#c8963a' });
    b.each(5, (i) => b.torus([0.44 - i * 0.07, 0.44 - i * 0.07, 0.1], [0, 0.08 + i * 0.085, 0], { color: i % 2 ? '#d9a84a' : '#c8963a', rot: [90, 0, 0], tube: 0.3 }));
    b.ball([0.12, 0.08, 0.12], [0, 0.49, 0], { color: '#c8963a' }).ball([0.1, 0.06, 0.04], [0, 0.08, 0.21], { color: 'black' });
    for (const [x, y, z] of [[0.26, 0.35, 0.18], [-0.2, 0.45, 0.16]]) b.ball([0.04, 0.03, 0.03], [x, y, z], { color: 'yellow' }).ball([0.03, 0.02, 0.01], [x, y + 0.02, z - 0.01], { color: 'white', noInk: true });
    return b.done();
  }),
  e('beet', 'food', 'vegetables', () => {
    const b = m('beet')
      .ball([0.1, 0.1, 0.1], [0, 0.08, 0], { color: '#8a1a3a' })
      .cone([0.04, 0.05, 0.04], [0, 0.025, 0], { color: '#8a1a3a', rot: [180, 0, 0] });
    for (const [x, z] of [[0.06, 0.01], [-0.05, 0.02], [0.0, -0.06]]) {
      b.rod([0, 0.12, 0], [x * 0.5, 0.19, z * 0.5], 0.01, 'darkred');
      leaf(b, [x * 0.5, 0.18, z * 0.5], [x * 1.3, 0.31, z * 1.3], 0.06, 'darkgreen');
    }
    return b.done();
  }),
  e('bell (handbell)', 'music', 'bells', () =>
    m('bell (handbell)')
      .cyl([0.13, 0.11, 0.13], [0, 0.065, 0], { color: 'gold', taper: 0.55 })
      .torus([0.14, 0.14, 0.022], [0, 0.012, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.12 })
      .ball([0.075, 0.04, 0.075], [0, 0.12, 0], { color: 'gold' })
      .cyl([0.03, 0.02, 0.03], [0, 0.145, 0], { color: 'darkgray' })
      .capsule([0.035, 0.1, 0.035], [0, 0.2, 0], { color: 'darkwood' })
      .done(),
  ),
  e('bell tower', 'places', 'towers', () => {
    const b = m('bell tower')
      .box([1.6, 3.2, 1.6], [0, 1.6, 0], { color: 'stone', round: 0.03 })
      .box([1.8, 0.2, 1.8], [0, 3.3, 0], { color: 'lightgray' })
      .box([1.8, 0.2, 1.8], [0, 4.5, 0], { color: 'lightgray' })
      .cone([2.6, 1.4, 2.6], [0, 5.3, 0], { color: 'darkred', segs: 4 })
      .stick([0, 6.0, 0], [0, 6.4, 0], 0.06, 'gold')
      .ball(0.12, [0, 6.45, 0], { color: 'gold' })
      .cyl([0.6, 0.55, 0.6], [0, 3.75, 0], { color: 'gold', taper: 0.55 })
      .torus([0.64, 0.64, 0.08], [0, 3.5, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.12 })
      .cyl([0.7, 0.05, 0.7], [0, 2.5, 0.82], { color: 'white', rot: [90, 0, 0] })
      .box([0.04, 0.25, 0.02], [0, 2.58, 0.86], { color: 'black', round: 0 })
      .box([0.6, 1.0, 0.06], [0, 0.5, 0.81], { color: 'darkwood', name: 'door', pivot: [-0.3, 0.5, 0.81] });
    b.pair((s) => b.pair((t) => b.box([0.3, 1.0, 0.3], [s * 0.65, 3.9, t * 0.65], { color: 'stone' })));
    return b.done();
  }),
  e('belt', 'wardrobe', 'belts', () =>
    m('belt')
      .torus([0.36, 0.36, 0.04], [0, 0.14, 0], { color: 'leather', rot: [-50, 0, 0], tube: 0.04 })
      .box([0.075, 0.06, 0.012], [0, 0.024, 0.146], { color: 'gold', rot: [40, 0, 0], round: 0.3 })
      .box([0.05, 0.035, 0.014], [0, 0.024, 0.148], { color: 'leather', rot: [40, 0, 0], round: 0.2 })
      .box([0.14, 0.035, 0.008], [0.08, 0.02, 0.16], { color: 'leather', rot: [40, -25, 0], round: 0.4 })
      .done(),
  ),
  e('beret', 'wardrobe', 'hats', () =>
    m('beret')
      .cyl([0.2, 0.025, 0.2], [0, 0.0125, 0], { color: 'darkred' })
      .ball([0.3, 0.08, 0.28], [0.02, 0.05, 0], { color: 'red', rot: [0, 0, -8] })
      .rod([0.02, 0.085, 0], [0.025, 0.11, 0], 0.012, 'red')
      .done(),
  ),
  e('berry', 'food', 'fruit', () => {
    const b = m('berry')
      .ball([0.045, 0.05, 0.045], [0, 0.034, 0], { color: 'red' })
      .cone([0.04, 0.025, 0.04], [0, 0.01, 0], { color: 'red', rot: [180, 0, 0] });
    around(5, 0.012).forEach(([x, z]) => spike(b, [x, 0.058, z], [x * 2.4, 0.06, z * 2.4], 0.014, 'green'));
    for (const [x, y] of [[-0.01, 0.04], [0.01, 0.03], [0, 0.02], [0.012, 0.045]]) b.ball(0.004, [x, y, 0.021], { color: 'yellow', noInk: true });
    b.ball(0.024, [0.045, 0.012, 0.02], { color: 'navy' }).ball(0.024, [0.038, 0.012, -0.026], { color: 'navy' }).ball(0.026, [-0.042, 0.013, 0.02], { color: 'darkred' });
    return b.done();
  }),
  e('bib', 'home', 'baby things', () =>
    m('bib')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'white', round: 0.3 })
      .ball([0.2, 0.22, 0.012], [0, 0.13, 0], { color: 'skyblue' })
      .torus([0.09, 0.07, 0.016], [0, 0.22, 0.0], { color: 'white', tube: 0.15 })
      .ball([0.07, 0.055, 0.008], [0, 0.08, 0.007], { color: 'yellow' })
      .ball(0.04, [0.025, 0.115, 0.007], { color: 'yellow' })
      .cone([0.016, 0.02, 0.006], [0.05, 0.112, 0.008], { color: 'orange', rot: [0, 0, -90] })
      .rod([0.04, 0.25, 0], [0.09, 0.27, 0], 0.01, 'white')
      .rod([-0.04, 0.25, 0], [-0.09, 0.27, 0], 0.01, 'white')
      .done(),
  ),
  e('bicycle', 'garage', 'bikes', () => {
    const b = m('bicycle', { view: 'side' });
    const R = 'red', rear: Vec3 = [0, 0.34, -0.52], front: Vec3 = [0, 0.34, 0.52], bb: Vec3 = [0, 0.3, -0.05], seat: Vec3 = [0, 0.78, -0.2], head: Vec3 = [0, 0.8, 0.38];
    for (const [i, z] of [[0, -0.52], [1, 0.52]] as Array<[number, number]>) {
      b.torus([0.66, 0.66, 0.045], [0, 0.34, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.09, name: i ? undefined : 'wheel' });
      b.stick([0, 0.06, z], [0, 0.62, z], 0.008, 'silver', { noInk: true }).stick([0, 0.34, z - 0.28], [0, 0.34, z + 0.28], 0.008, 'silver', { noInk: true });
    }
    b.rod(rear, bb, 0.04, R).rod(bb, seat, 0.045, R).rod(seat, rear, 0.035, R).rod(seat, head, 0.045, R).rod(bb, head, 0.05, R).rod(head, front, 0.04, R)
      .rod(head, [0, 0.95, 0.33], 0.035, 'darkgray').stick([0.22, 0.95, 0.32], [-0.22, 0.95, 0.32], 0.03, 'black')
      .box([0.14, 0.09, 0.26], [0, 0.84, -0.24], { color: 'black', round: 0.6 })
      .cyl([0.18, 0.03, 0.18], bb, { color: 'silver', rot: [0, 0, 90] })
      .box([0.1, 0.02, 0.05], [0.1, 0.2, 0.0], { color: 'black' })
      .box([0.3, 0.2, 0.24], [0, 0.88, 0.5], { color: '#c8964a', round: 0.2 });
    return b.done();
  }),
  e('bicycle horn', 'garage', 'bike parts', () =>
    m('bicycle horn', { view: 'side' })
      .box([0.03, 0.03, 0.04], [0, 0.015, 0.0], { color: 'black' })
      .ball([0.06, 0.06, 0.07], [0, 0.05, -0.06], { color: 'red' })
      .cyl([0.022, 0.04, 0.022], [0, 0.048, -0.015], { color: 'brass', rot: [90, 0, 0] })
      .rod([0, 0.048, 0.005], [0, 0.065, 0.06], 0.016, 'brass')
      .cyl([0.03, 0.035, 0.03], [0, 0.075, 0.085], { color: 'brass', rot: [70, 0, 0], taper: 2.2 })
      .done(),
  ),
  e('big toe', 'clinic', 'body parts', () => {
    const b = m('big toe')
      .box([0.11, 0.055, 0.13], [-0.01, 0.0275, -0.04], { color: 'skin2', round: 0.9 })
      .capsule([0.042, 0.075, 0.038], [0.03, 0.022, 0.05], { color: 'skin2', rot: [90, 0, 0] })
      .box([0.028, 0.006, 0.024], [0.03, 0.041, 0.072], { color: 'pink', round: 0.5 });
    b.each(4, (i) => b.ball([0.022 - i * 0.002, 0.022, 0.03], [0.0 - i * 0.02, 0.014, 0.04 - i * 0.008], { color: 'skin2' }));
    return b.done();
  }),
  e('bike helmet', 'sports', 'helmets', () => {
    const b = m('bike helmet')
      .ball([0.24, 0.16, 0.3], [0, 0.08, 0], { color: 'blue' })
      .box([0.2, 0.015, 0.06], [0, 0.09, 0.15], { color: 'black', rot: [-15, 0, 0], round: 0.5 })
      .box([0.245, 0.012, 0.29], [0, 0.03, 0], { color: 'white', round: 0.6, noInk: true });
    b.each(3, (i) => b.box([0.025, 0.012, 0.14], [-0.05 + i * 0.05, 0.155, 0], { color: 'black', noInk: true, round: 0.5 }));
    b.pair((s) => b.rod([s * 0.11, 0.04, 0.02], [s * 0.05, -0.0, 0.08], 0.01, 'black'));
    return b.done();
  }),
  e('bike rack', 'places', 'street things', () => {
    const b = m('bike rack').box([2.2, 0.16, 0.4], [0, 0.08, 0], { color: 'stone', round: 0.1 });
    b.each(4, (i) => {
      const x = -0.8 + i * 0.53;
      b.stick([x - 0.2, 0.16, 0], [x - 0.2, 0.7, 0], 0.05, 'yellow').stick([x + 0.2, 0.16, 0], [x + 0.2, 0.7, 0], 0.05, 'yellow')
        .capsule([0.05, 0.45, 0.05], [x, 0.72, 0], { color: 'yellow', rot: [0, 0, 90] });
    });
    return b.done();
  }),
  e('bikini', 'wardrobe', 'swimwear', () => {
    const b = form('bikini')
      .box([0.37, 0.025, 0.23], [0, 1.15, 0], { color: 'red', round: 0.5 })
      .box([0.37, 0.03, 0.23], [0, 0.88, 0], { color: 'red', round: 0.5 })
      .cone([0.24, 0.11, 0.03], [0, 0.84, 0.11], { color: 'red', rot: [180, 0, 0], segs: 3 });
    b.pair((s) => b.cone([0.11, 0.1, 0.03], [s * 0.075, 1.2, 0.115], { color: 'red', segs: 3 }).rod([s * 0.075, 1.25, 0.11], [s * 0.035, 1.38, 0.0], 0.01, 'red'));
    return b.done();
  }),
  e('bill (paper)', 'ideas', 'money', () =>
    m('bill (paper)')
      .box([0.17, 0.03, 0.08], [0, 0.015, 0], { color: '#8db88a', round: 0.1 })
      .box([0.035, 0.032, 0.082], [0, 0.016, 0], { color: 'cream', round: 0.1 })
      .label('$100', [0.2, 0.09], [0, 0.07, 0.05], { color: '#9cc49a', rot: [-12, 0, 0] })
      .ball([0.04, 0.05, 0.01], [0, 0.072, 0.062], { color: '#5f8f5c', rot: [-12, 0, 0], noInk: true })
      .done(),
  ),
  e('billboard', 'places', 'street things', () => {
    const b = m('billboard')
      .box([8, 3.6, 0.7], [0, 6.9, 0], { color: 'darkgray', round: 0.05 })
      .label('BIG SALE', [7.4, 3.0], [0, 6.9, 0.37], { color: 'yellow' })
      .box([8, 0.1, 0.8], [0, 5.0, 0.5], { color: 'gray' })
      .stick([-4, 5.4, 0.85], [4, 5.4, 0.85], 0.05, 'gray');
    b.pair((s) => b.box([0.6, 5.1, 0.6], [s * 2.5, 2.55, 0], { color: 'darkgray', round: 0.1 }));
    b.each(3, (i) => b.rod([-2.6 + i * 2.6, 8.7, 0.1], [-2.6 + i * 2.6, 9.0, 0.7], 0.08, 'gray').ball([0.3, 0.2, 0.3], [-2.6 + i * 2.6, 8.95, 0.75], { color: 'yellow', glow: true }));
    return b.done();
  }),
  e('binder', 'study', 'office supplies', () =>
    m('binder')
      .box([0.06, 0.3, 0.27], [0, 0.15, 0], { color: 'blue', round: 0.15 })
      .box([0.07, 0.3, 0.02], [0, 0.15, 0.135], { color: 'navy', round: 0.3 })
      .label('', [0.045, 0.09], [0, 0.21, 0.15], { color: 'white' })
      .torus([0.035, 0.035, 0.01], [0, 0.07, 0.148], { color: 'black', tube: 0.3 })
      .box([0.05, 0.02, 0.24], [0, 0.31, -0.01], { color: 'paper', round: 0.1 })
      .done(),
  ),
  e('binoculars', 'sports', 'outdoor gear', () => {
    const b = m('binoculars')
      .box([0.04, 0.035, 0.06], [0, 0.07, -0.02], { color: 'black', round: 0.4 })
      .cyl([0.03, 0.025, 0.03], [0, 0.095, -0.03], { color: 'darkgray', rot: [0, 0, 90] });
    b.pair((s) => {
      b.cyl([0.056, 0.12, 0.056], [s * 0.042, 0.048, 0], { color: 'black', rot: [90, 0, 0] });
      b.cyl([0.06, 0.02, 0.06], [s * 0.042, 0.048, 0.055], { color: 'darkgray', rot: [90, 0, 0] });
      b.cyl([0.044, 0.01, 0.044], [s * 0.042, 0.048, 0.066], { color: 'glass', rot: [90, 0, 0] });
      b.cyl([0.036, 0.03, 0.036], [s * 0.036, 0.048, -0.072], { color: 'darkgray', rot: [90, 0, 0] });
    });
    return b.done();
  }),
  e('biohazard sign', 'ideas', 'signs', () => {
    const b = m('biohazard sign')
      .box([0.16, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3 })
      .stick([0, 0.03, -0.012], [0, 0.12, -0.012], 0.02, 'gray')
      .box([0.21, 0.21, 0.014], [0, 0.23, -0.002], { color: 'black', rot: [0, 0, 45], round: 0.2 })
      .box([0.18, 0.18, 0.016], [0, 0.23, 0], { color: 'yellow', rot: [0, 0, 45], round: 0.2 })
      .torus([0.04, 0.04, 0.01], [0, 0.23, 0.01], { color: 'black', tube: 0.25 });
    b.each(3, (i) => { const a = (90 + i * 120) / RAD; b.torus([0.07, 0.07, 0.01], [Math.cos(a) * 0.032, 0.23 + Math.sin(a) * 0.032, 0.01], { color: 'black', tube: 0.22 }); });
    return b.done();
  }),
  e('biplane', 'garage', 'aircraft', () => {
    const b = m('biplane', { view: 'side' })
      .capsule([0.7, 3.4, 0.75], [0, 1.2, 0], { color: 'red', rot: [90, 0, 0] })
      .box([4.4, 0.08, 0.9], [0, 1.95, 0.4], { color: 'yellow', round: 0.5 })
      .box([4.2, 0.08, 0.9], [0, 0.95, 0.4], { color: 'yellow', round: 0.5 })
      .wedge([0.8, 0.7, 0.06], [0, 1.6, -1.45], { color: 'red', rot: [0, 90, 0], apex: 0.3 })
      .box([1.3, 0.06, 0.5], [0, 1.25, -1.5], { color: 'yellow', round: 0.5 })
      .cyl([0.72, 0.2, 0.72], [0, 1.2, 1.75], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.14, 0.12, 0.14], [0, 1.2, 1.9], { color: 'darkgray', rot: [90, 0, 0], name: 'fan' })
      .box([0.12, 1.4, 0.04], [0, 1.2, 1.94], { color: 'darkwood', parent: 'fan', round: 0.5 })
      .ball([0.4, 0.2, 0.5], [0, 1.52, -0.25], { color: 'black' })
      .ball(0.22, [0, 1.68, -0.25], { color: 'skin2' })
      .ball([0.24, 0.12, 0.24], [0, 1.76, -0.27], { color: 'brown' });
    b.pair((s) => {
      for (const z of [0.15, 0.65]) b.stick([s * 1.6, 0.98, z], [s * 1.6, 1.92, z], 0.04, 'darkbrown');
      b.rod([s * 0.25, 0.95, 0.65], [s * 0.4, 0.28, 0.75], 0.05, 'darkgray');
    });
    b.torus([0.5, 0.5, 0.12], [0.42, 0.25, 0.75], { color: 'rubber', rot: [0, 90, 0], tube: 0.35, name: 'wheel' }).torus([0.5, 0.5, 0.12], [-0.42, 0.25, 0.75], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    return b.done();
  }),
  e('birch tree', 'garden', 'trees', () => tree('birch tree', 8, { trunk: '#f2efe8', marks: '#2a2726', crown: '#7cc45a', crown2: '#6ab04c', tall: true }).done()),
  e('bird cage', 'pets', 'pet supplies', () => {
    const b = m('bird cage')
      .cyl([0.42, 0.06, 0.42], [0, 0.03, 0], { color: 'gold' })
      .torus([0.4, 0.4, 0.02], [0, 0.42, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.05 })
      .torus([0.08, 0.08, 0.015], [0, 0.66, 0], { color: 'gold', tube: 0.2 })
      .stick([-0.19, 0.24, 0], [0.19, 0.24, 0], 0.015, 'wood')
      .ball([0.07, 0.08, 0.07], [0, 0.29, 0], { color: 'yellow' })
      .ball(0.05, [0, 0.35, 0.02], { color: 'yellow' })
      .cone([0.015, 0.025, 0.015], [0, 0.35, 0.055], { color: 'orange', rot: [90, 0, 0] });
    around(8, 0.19).forEach(([x, z]) => b.stick([x, 0.06, z], [x, 0.42, z], 0.012, 'gold').rod([x, 0.42, z], [0, 0.62, 0], 0.012, 'gold'));
    return b.done();
  }),
  e('birdbath', 'garden', 'garden decor', () =>
    m('birdbath')
      .cyl([0.36, 0.06, 0.36], [0, 0.03, 0], { color: 'stone' })
      .cyl([0.14, 0.55, 0.14], [0, 0.33, 0], { color: 'stone', taper: 0.75 })
      .cyl([0.46, 0.12, 0.46], [0, 0.66, 0], { color: 'stone', taper: 1.35 })
      .cyl([0.56, 0.02, 0.56], [0, 0.72, 0], { color: 'water' })
      .ball([0.07, 0.06, 0.1], [0.25, 0.77, 0], { color: 'skyblue' })
      .ball(0.05, [0.25, 0.81, 0.045], { color: 'skyblue' })
      .cone([0.014, 0.025, 0.014], [0.25, 0.81, 0.08], { color: 'orange', rot: [90, 0, 0] })
      .done(),
  ),
  e('birdhouse', 'garden', 'garden decor', () =>
    m('birdhouse')
      .cyl([0.05, 0.12, 0.05], [0, 0.06, 0], { color: 'darkwood' })
      .box([0.2, 0.2, 0.18], [0, 0.22, 0], { color: 'wood', round: 0.1 })
      .wedge([0.27, 0.12, 0.24], [0, 0.38, 0], { color: 'red' })
      .cyl([0.05, 0.01, 0.05], [0, 0.25, 0.091], { color: 'black', rot: [90, 0, 0] })
      .stick([0, 0.19, 0.09], [0, 0.19, 0.14], 0.012, 'darkwood')
      .done(),
  ),
  e('birthday cake', 'food', 'cakes', () => {
    const b = m('birthday cake')
      .cyl([0.32, 0.015, 0.32], [0, 0.0075, 0], { color: 'white' })
      .cyl([0.26, 0.09, 0.26], [0, 0.06, 0], { color: 'pink' })
      .cyl([0.18, 0.07, 0.18], [0, 0.14, 0], { color: 'pink' })
      .torus([0.266, 0.266, 0.024], [0, 0.103, 0], { color: 'white', rot: [90, 0, 0], tube: 0.1 })
      .torus([0.186, 0.186, 0.022], [0, 0.173, 0], { color: 'white', rot: [90, 0, 0], tube: 0.12 });
    around(3, 0.045, 0.5).forEach(([x, z], i) => b.stick([x, 0.175, z], [x, 0.235, z], 0.012, ['blue', 'yellow', 'lime'][i]).ball([0.014, 0.024, 0.014], [x, 0.25, z], { color: 'flame', glow: true }));
    around(6, 0.131, 0.2).forEach(([x, z], i) => b.ball(0.012, [x, 0.06, z], { color: RAINBOW[i], noInk: true }));
    return b.done();
  }),
  e('birthday candle', 'toys', 'party', () => {
    const b = m('birthday candle').cyl([0.045, 0.015, 0.045], [0, 0.0075, 0], { color: 'pink' });
    b.each(6, (i) => b.cyl([0.02, 0.017, 0.02], [0, 0.023 + i * 0.017, 0], { color: i % 2 ? 'white' : 'blue' }));
    b.stick([0, 0.115, 0], [0, 0.125, 0], 0.003, 'black').ball([0.02, 0.035, 0.02], [0, 0.14, 0], { color: 'flame', glow: true }).ball([0.01, 0.016, 0.01], [0, 0.132, 0.004], { color: 'orange', glow: true });
    return b.done();
  }),
  e('biscuit', 'food', 'baked goods', () => {
    const b = m('biscuit');
    b.each(3, (i) => b.cyl([0.075, 0.016, 0.075], [0, 0.008 + i * 0.017, 0], { color: 'bread', rot: [0, i * 30, 0] }));
    b.cyl([0.075, 0.016, 0.075], [0.035, 0.038, 0.05], { color: '#d9a35f', rot: [75, 0, 0] });
    for (const [x, y] of [[0.02, 0.05], [0.05, 0.03], [0.035, 0.06], [0.05, 0.05]]) b.ball(0.01, [x, y, 0.06], { color: 'chocolate', noInk: true });
    return b.done();
  }),
  e('black and white photo', 'home', 'decor', () =>
    m('black and white photo')
      .box([0.22, 0.17, 0.02], [0, 0.085, 0], { color: 'black', round: 0.1 })
      .box([0.18, 0.13, 0.022], [0, 0.085, 0.002], { color: 'lightgray', round: 0 })
      .box([0.18, 0.03, 0.024], [0, 0.035, 0.003], { color: 'darkgray', round: 0 })
      .wedge([0.12, 0.07, 0.024], [-0.02, 0.085, 0.003], { color: 'gray' })
      .ball([0.03, 0.03, 0.01], [0.05, 0.12, 0.013], { color: 'white', noInk: true })
      .rod([0, 0.1, -0.01], [0, 0.0, -0.08], 0.012, 'black')
      .done(),
  ),
  e('black belt', 'sports', 'martial arts', () => {
    const b = form('black belt')
      .box([0.4, 0.5, 0.25], [0, 1.08, 0], { color: 'white', round: 0.85 })
      .torus([0.4, 0.27, 0.06], [0, 0.92, 0], { color: 'black', rot: [90, 0, 0], tube: 0.08 })
      .ball([0.06, 0.05, 0.04], [0, 0.92, 0.135], { color: 'black' })
      .box([0.04, 0.2, 0.01], [0.03, 0.8, 0.14], { color: 'black', rot: [0, 0, 12], round: 0.3 })
      .box([0.04, 0.2, 0.01], [-0.03, 0.8, 0.14], { color: 'black', rot: [0, 0, -12], round: 0.3 });
    b.pair((s) => b.rod([s * 0.1, 1.33, 0.08], [s * -0.04, 1.0, 0.125], 0.03, 'wool').capsule([0.12, 0.3, 0.12], [s * 0.24, 1.18, 0], { color: 'white', rot: [0, 0, s * 25] }));
    return b.done();
  }),
  e('bladder', 'clinic', 'organs', () => {
    const b = m('bladder')
      .box([0.12, 0.03, 0.08], [0, 0.015, 0], { color: 'white', round: 0.3 })
      .stick([0, 0.03, 0], [0, 0.06, 0], 0.02, '#d98080')
      .cone([0.06, 0.04, 0.05], [0, 0.07, 0], { color: '#e8a0a0', rot: [180, 0, 0] })
      .ball([0.13, 0.12, 0.1], [0, 0.13, 0], { color: '#e8a0a0' });
    b.pair((s) => b.rod([s * 0.04, 0.17, 0], [s * 0.09, 0.22, 0], 0.014, '#d98080').rod([s * 0.09, 0.22, 0], [s * 0.1, 0.3, 0], 0.014, '#d98080'));
    return b.done();
  }),
  e('blanket', 'home', 'bedding', () => {
    const b = m('blanket')
      .box([0.55, 0.07, 0.38], [0, 0.035, 0], { color: 'red', round: 0.6 })
      .box([0.55, 0.07, 0.38], [0, 0.105, 0], { color: 'red', round: 0.6 });
    b.each(3, (i) => b.box([0.04, 0.142, 0.385], [-0.18 + i * 0.18, 0.07, 0], { color: 'darkgreen', noInk: true, round: 0.3 }));
    b.box([0.555, 0.03, 0.385], [0, 0.1, 0], { color: 'cream', noInk: true, round: 0.3 });
    b.each(6, (i) => b.rod([-0.24 + i * 0.096, 0.03, 0.19], [-0.24 + i * 0.096, 0.005, 0.22], 0.012, 'cream'));
    return b.done();
  }),
  e('bleach', 'home', 'cleaning', () =>
    m('bleach')
      .box([0.16, 0.26, 0.1], [0, 0.13, 0], { color: 'white', round: 0.4 })
      .torus([0.08, 0.08, 0.04], [-0.035, 0.27, 0], { color: 'white', tube: 0.25 })
      .cyl([0.045, 0.04, 0.045], [0.045, 0.28, 0], { color: 'blue' })
      .label('BLEACH', [0.12, 0.08], [0, 0.12, 0.048], { color: 'blue' })
      .done(),
  ),
  e('bleachers', 'sports', 'stadium', () => {
    const b = m('bleachers');
    b.each(4, (i) => b.box([4, 0.45 * (i + 1), 0.6], [0, 0.225 * (i + 1), 0.9 - i * 0.6], { color: 'gray', round: 0.05 }).box([4, 0.08, 0.35], [0, 0.45 * (i + 1) + 0.04, 0.95 - i * 0.6], { color: 'skyblue', round: 0.3 }));
    b.pair((s) => b.rod([s * 2.05, 0.45, 1.2], [s * 2.05, 2.3, -0.9], 0.06, 'silver'));
    return b.done();
  }),
  e('blender', 'kitchen', 'appliances', () =>
    m('blender')
      .box([0.16, 0.12, 0.16], [0, 0.06, 0], { color: 'red', round: 0.3 })
      .cyl([0.04, 0.015, 0.04], [0, 0.06, 0.082], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.11, 0.08, 0.11], [0, 0.16, 0], { color: 'pink', taper: 1.1 })
      .cyl([0.121, 0.13, 0.121], [0, 0.265, 0], { color: 'glass', taper: 1.12 })
      .cyl([0.14, 0.03, 0.14], [0, 0.345, 0], { color: 'black' })
      .torus([0.06, 0.14, 0.02], [0.09, 0.24, 0], { color: 'glass', tube: 0.25 })
      .done(),
  ),
  e('blimp', 'garage', 'aircraft', () => {
    const b = m('blimp', { view: 'side' })
      .capsule([0.3, 1.0, 0.3], [0, 0.42, 0], { color: 'silver', rot: [90, 0, 0] })
      .box([0.08, 0.06, 0.18], [0, 0.25, 0.05], { color: 'navy', round: 0.4 })
      .box([0.302, 0.06, 0.5], [0, 0.42, 0.05], { color: 'blue', noInk: true, round: 0.5 });
    for (const r of [0, 90, 180, 270]) b.wedge([0.14, 0.12, 0.012], [Math.sin(r / RAD) * 0.15, 0.42 + Math.cos(r / RAD) * 0.15, -0.42], { color: 'blue', rot: [90, 0, r === 0 ? 0 : r === 180 ? 180 : r === 90 ? -90 : 90] });
    return b.done();
  }),
  e('blindfold', 'wardrobe', 'masks', () =>
    m('blindfold')
      .cyl([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' })
      .stick([0, 0.04, 0], [0, 0.11, 0], 0.03, 'darkwood')
      .ball([0.17, 0.22, 0.19], [0, 0.21, 0], { color: 'beige' })
      .box([0.19, 0.06, 0.2], [0, 0.235, 0.0], { color: 'navy', round: 0.8 })
      .ball([0.05, 0.04, 0.04], [0, 0.235, -0.11], { color: 'navy' })
      .box([0.035, 0.12, 0.008], [0.02, 0.18, -0.115], { color: 'navy', rot: [0, 0, 15], round: 0.3 })
      .box([0.035, 0.12, 0.008], [-0.02, 0.18, -0.115], { color: 'navy', rot: [0, 0, -15], round: 0.3 })
      .done(),
  ),
  e('bling', 'wardrobe', 'jewellery', () => {
    const b = m('bling')
      .torus([0.3, 0.4, 0.03], [0, 0.31, 0], { color: 'gold', tube: 0.1 })
      .cyl([0.17, 0.04, 0.17], [0, 0.095, 0], { color: 'gold', rot: [90, 0, 0] })
      .label('$', [0.11, 0.12], [0, 0.095, 0.025], { color: 'gold' });
    around(8, 0.08).forEach(([x, y]) => b.ball(0.018, [x, 0.095 + y, 0.022], { color: 'white', glow: true }));
    return b.done();
  }),
  e('block', 'toys', 'blocks', () =>
    m('block')
      .box([0.1, 0.1, 0.1], [-0.055, 0.05, 0], { color: 'red', round: 0.1 })
      .box([0.1, 0.1, 0.1], [0.055, 0.05, 0], { color: 'blue', round: 0.1 })
      .box([0.2, 0.05, 0.1], [0, 0.125, 0], { color: 'yellow', round: 0.1 })
      .wedge([0.16, 0.08, 0.1], [0, 0.19, 0], { color: 'green' })
      .cyl([0.06, 0.1, 0.06], [0.15, 0.05, 0.08], { color: 'orange' })
      .done(),
  ),
  e('blood bank', 'clinic', 'hospital things', () => {
    const b = m('blood bank')
      .box([0.9, 1.9, 0.7], [0, 0.95, 0], { color: 'white', round: 0.08 })
      .box([0.76, 1.5, 0.04], [0, 0.95, 0.35], { color: 'glass', round: 0.1, name: 'door', pivot: [-0.38, 0.95, 0.35] })
      .label('BLOOD BANK', [0.8, 0.16], [0, 1.8, 0.36], { color: 'red' })
      .stick([0.33, 0.7, 0.4], [0.33, 1.2, 0.4], 0.03, 'silver', { parent: 'door' });
    b.each(4, (r) => b.each(4, (k) => b.box([0.13, 0.22, 0.04], [-0.24 + k * 0.16, 0.42 + r * 0.36, 0.38], { color: 'darkred', round: 0.6, parent: 'door' })));
    return b.done();
  }),
  e('blood pressure cuff', 'clinic', 'medical tools', () =>
    m('blood pressure cuff')
      .cyl([0.11, 0.18, 0.11], [0, 0.055, 0], { color: 'navy', rot: [0, 0, 90] })
      .box([0.06, 0.112, 0.03], [0.05, 0.055, 0.045], { color: 'gray', round: 0.4 })
      .cyl([0.08, 0.025, 0.08], [-0.03, 0.12, 0.03], { color: 'silver', rot: [60, 0, 0] })
      .cyl([0.068, 0.01, 0.068], [-0.03, 0.124, 0.042], { color: 'white', rot: [60, 0, 0] })
      .box([0.004, 0.028, 0.004], [-0.025, 0.13, 0.05], { color: 'red', rot: [60, 0, -30], round: 0 })
      .rod([-0.08, 0.07, 0.04], [-0.13, 0.04, 0.12], 0.012, 'black')
      .ball([0.05, 0.05, 0.08], [-0.15, 0.03, 0.16], { color: 'black' })
      .done(),
  ),
  e('blouse', 'wardrobe', 'tops', () => {
    const b = form('blouse')
      .box([0.4, 0.5, 0.25], [0, 1.08, 0], { color: '#f4c2d4', round: 0.85 })
      .ball([0.06, 0.04, 0.03], [0, 1.31, 0.12], { color: 'white' });
    b.pair((s) => {
      b.ball([0.11, 0.05, 0.07], [s * 0.05, 1.32, 0.095], { color: 'white', rot: [0, 0, s * 25] });
      b.ball([0.16, 0.16, 0.16], [s * 0.23, 1.25, 0], { color: '#f4c2d4' });
      b.capsule([0.09, 0.28, 0.09], [s * 0.27, 1.07, 0], { color: '#f4c2d4', rot: [0, 0, s * 12] });
    });
    b.each(4, (i) => b.ball(0.016, [0, 1.24 - i * 0.08, 0.126], { color: 'white' }));
    return b.done();
  }),
  e('blowdryer', 'home', 'bathroom', () =>
    m('blowdryer', { view: 'side' })
      .cyl([0.08, 0.2, 0.08], [0, 0.2, 0.02], { color: 'pink', rot: [90, 0, 0] })
      .ball([0.11, 0.11, 0.1], [0, 0.2, -0.08], { color: 'pink' })
      .cyl([0.065, 0.04, 0.065], [0, 0.2, 0.14], { color: 'darkgray', rot: [90, 0, 0], taper: 0.8 })
      .cyl([0.07, 0.01, 0.07], [0, 0.2, -0.132], { color: 'darkgray', rot: [90, 0, 0] })
      .box([0.045, 0.16, 0.055], [0, 0.1, -0.05], { color: 'pink', rot: [-15, 0, 0], round: 0.5 })
      .box([0.02, 0.03, 0.01], [0, 0.13, -0.02], { color: 'white', rot: [-15, 0, 0] })
      .rod([0, 0.025, -0.07], [0, 0.01, -0.2], 0.01, 'black')
      .done(),
  ),
  e('blt', 'food', 'sandwiches', () =>
    m('blt')
      .cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'white' })
      .box([0.12, 0.022, 0.12], [0, 0.023, 0], { color: '#e3b26a', round: 0.4 })
      .box([0.135, 0.012, 0.135], [0, 0.04, 0], { color: 'lettuce', round: 0.8, rot: [0, 10, 0] })
      .cyl([0.06, 0.012, 0.06], [0.03, 0.052, 0.02], { color: 'tomato' })
      .cyl([0.06, 0.012, 0.06], [-0.03, 0.052, -0.02], { color: 'tomato' })
      .box([0.135, 0.009, 0.035], [0, 0.064, 0.025], { color: '#b5543c', rot: [0, 12, 0], round: 0.5 })
      .box([0.135, 0.009, 0.035], [0, 0.064, -0.025], { color: '#c9704a', rot: [0, -8, 0], round: 0.5 })
      .box([0.12, 0.022, 0.12], [0, 0.08, 0], { color: '#e3b26a', round: 0.4 })
      .stick([0, 0.085, 0], [0, 0.13, 0], 0.005, 'tan')
      .ball(0.018, [0, 0.12, 0], { color: 'green' })
      .done(),
  ),
  e('blue cheese', 'food', 'cheese', () => {
    const b = m('blue cheese')
      .cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'lightwood' })
      .wedge([0.14, 0.13, 0.065], [0, 0.045, 0], { color: '#f3ecd6', rot: [90, 0, 0] });
    for (const [x, y, z] of [[0, 0.078, 0], [-0.03, 0.078, -0.03], [0.02, 0.078, -0.04], [0.04, 0.04, -0.05], [-0.05, 0.03, -0.05], [0.025, 0.05, 0.02], [-0.015, 0.03, 0.035]]) b.ball([0.016, 0.006, 0.012], [x, y, z], { color: '#5a7a9a', noInk: true });
    return b.done();
  }),
  e('blue suit', 'wardrobe', 'suits', () => who('blue suit', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [wear('suit', 'navy'), wear('tie', 'red')] })),
  e('blueprints', 'study', 'plans and maps', () => {
    const B = '#2f5fa8';
    const b = m('blueprints')
      .box([0.6, 0.01, 0.42], [0, 0.005, 0.05], { color: B, round: 0 })
      .cyl([0.07, 0.6, 0.07], [0, 0.035, -0.18], { color: B, rot: [0, 0, 90] })
      .cyl([0.07, 0.6, 0.07], [0.36, 0.3, -0.2], { color: B, rot: [0, 0, -6] })
      .cyl([0.072, 0.01, 0.072], [0.39, 0.6, -0.2], { color: 'white', rot: [0, 0, -6] });
    for (const [w, d, x, z] of [[0.4, 0.008, 0, 0.2], [0.4, 0.008, 0, -0.06], [0.008, 0.26, -0.2, 0.07], [0.008, 0.26, 0.2, 0.07], [0.008, 0.26, 0.02, 0.07], [0.2, 0.008, 0.11, 0.08]] as Array<[number, number, number, number]>) b.box([w, 0.004, d], [x, 0.011, z], { color: 'white', noInk: true, round: 0 });
    return b.done();
  }),
  e('blush', 'wardrobe', 'makeup', () =>
    m('blush')
      .cyl([0.08, 0.016, 0.08], [0, 0.008, 0], { color: 'black' })
      .cyl([0.064, 0.004, 0.064], [0, 0.017, 0], { color: '#e88a9a' })
      .cyl([0.08, 0.01, 0.08], [0, 0.052, -0.045], { color: 'black', rot: [75, 0, 0], name: 'lid', pivot: [0, 0.012, -0.04] })
      .cyl([0.064, 0.004, 0.064], [0, 0.052, -0.039], { color: 'glass', rot: [75, 0, 0], parent: 'lid' })
      .stick([0.03, 0.006, 0.06], [0.1, 0.008, 0.02], 0.01, 'darkwood')
      .ball([0.03, 0.025, 0.04], [0.02, 0.012, 0.068], { color: '#e8b8a0', rot: [0, 60, 0] })
      .done(),
  ),
  e('board game', 'toys', 'games', () => {
    const b = m('board game')
      .box([0.4, 0.3, 0.04], [0, 0.15, -0.22], { color: 'red', rot: [-12, 0, 0], round: 0.1 })
      .label('GAME', [0.25, 0.08], [0, 0.2, -0.19], { color: 'yellow', rot: [-12, 0, 0] })
      .box([0.4, 0.03, 0.4], [0, 0.015, 0.05], { color: 'cream', round: 0.1 });
    ['red', 'blue', 'green', 'yellow'].forEach((c, i) => b.box([0.1, 0.004, 0.1], [(i % 2 ? 1 : -1) * 0.14, 0.031, 0.05 + (i < 2 ? -0.14 : 0.14)], { color: c, noInk: true, round: 0 }));
    for (const [x, z, c] of [[-0.05, 0.0, 'red'], [0.06, 0.1, 'blue'], [0.0, 0.16, 'green']] as Array<[number, number, string]>) b.cone([0.03, 0.04, 0.03], [x, 0.05, z], { color: c }).ball(0.022, [x, 0.075, z], { color: c });
    b.box([0.035, 0.035, 0.035], [0.1, 0.048, -0.02], { color: 'white', round: 0.3, rot: [0, 20, 0] }).box([0.035, 0.035, 0.035], [0.15, 0.048, 0.02], { color: 'white', round: 0.3, rot: [0, -15, 0] });
    return b.done();
  }),
  e('boat', 'garage', 'boats', () =>
    m('boat', { view: 'side' })
      .capsule([2.2, 7.5, 1.4], [0, 0.7, 0], { color: 'white', rot: [90, 0, 0] })
      .box([2.25, 0.22, 6.6], [0, 0.6, 0], { color: 'blue', noInk: true, round: 0.5 })
      .box([1.9, 0.15, 6.0], [0, 1.25, 0], { color: 'wood', round: 0.3 })
      .stick([0, 1.2, 0.5], [0, 7.0, 0.5], 0.15, 'darkwood')
      .stick([0, 1.6, 0.5], [0, 1.6, -2.8], 0.1, 'darkwood')
      .wedge([3.2, 5.3, 0.06], [0, 4.3, -1.1], { color: 'white', rot: [0, 90, 0], apex: -0.5 })
      .wedge([2.2, 4.6, 0.05], [0, 3.7, 1.6], { color: 'cream', rot: [0, 90, 0], apex: 0.5 })
      .box([0.04, 0.4, 0.6], [0, 6.9, 0.15], { color: 'red' })
      .done(),
  ),
  e('boat house', 'places', 'harbour', () => {
    const b = m('boat house')
      .box([7, 0.3, 6], [0, 0.15, 0.4], { color: 'water', round: 0.1 })
      .box([5, 2.6, 4], [0, 1.6, -0.6], { color: 'wood', round: 0.03 })
      .wedge([5.5, 1.6, 4.4], [0, 3.7, -0.6], { color: 'darkred' })
      .box([2.4, 1.8, 0.1], [0, 1.2, 1.42], { color: '#2a2726', round: 0 })
      .label('BOAT HOUSE', [2.6, 0.4], [0, 2.5, 1.45], { color: 'white' })
      .ball([1.1, 0.5, 1.8], [0, 0.48, 1.7], { color: 'white' })
      .box([1.12, 0.12, 1.4], [0, 0.45, 1.5], { color: 'red', noInk: true, round: 0.5 })
      .box([1.2, 0.15, 2.8], [3.2, 0.4, 1.4], { color: 'lightwood', round: 0.1 });
    b.each(3, (i) => b.cyl([0.18, 0.7, 0.18], [3.75, 0.35, 0.3 + i * 1.1], { color: 'darkwood' }));
    return b.done();
  }),
  e('bobblehead', 'toys', 'figurines', () =>
    m('bobblehead')
      .cyl([0.08, 0.025, 0.08], [0, 0.0125, 0], { color: 'black' })
      .capsule([0.024, 0.04, 0.024], [0.012, 0.045, 0], { color: 'white' })
      .capsule([0.024, 0.04, 0.024], [-0.012, 0.045, 0], { color: 'white' })
      .capsule([0.05, 0.06, 0.04], [0, 0.085, 0], { color: 'blue' })
      .stick([0, 0.11, 0], [0, 0.125, 0], 0.012, 'silver')
      .ball(0.1, [0, 0.17, 0], { color: 'skin2', name: 'head', pivot: [0, 0.12, 0] })
      .ball([0.104, 0.06, 0.104], [0, 0.2, -0.008], { color: 'brown', parent: 'head' })
      .ball(0.016, [0.022, 0.175, 0.045], { color: 'black', parent: 'head', eye: true })
      .ball(0.016, [-0.022, 0.175, 0.045], { color: 'black', parent: 'head', eye: true })
      .box([0.03, 0.008, 0.01], [0, 0.145, 0.047], { color: 'darkred', parent: 'head', round: 0.5 })
      .done(),
  ),
  e('bobby pin', 'wardrobe', 'hair accessories', () => {
    const b = m('bobby pin')
      .box([0.05, 0.02, 0.03], [0, 0.01, 0], { color: 'pink', round: 0.4 })
      .stick([-0.006, 0.02, 0], [-0.006, 0.09, 0], 0.004, 'black')
      .torus([0.014, 0.012, 0.004], [0, 0.092, 0], { color: 'black', tube: 0.3 })
      .ball(0.008, [-0.006, 0.02, 0], { color: 'black' });
    const zz = [0.09, 0.075, 0.06, 0.045, 0.03, 0.02];
    for (let i = 0; i < 5; i++) b.rod([0.006 + (i % 2) * 0.004, zz[i], 0], [0.006 + ((i + 1) % 2) * 0.004, zz[i + 1], 0], 0.004, 'black');
    return b.done();
  }),
  e('body bag', 'clinic', 'hospital things', () => {
    const b = m('body bag', { view: 'side' })
      .box([0.7, 0.06, 2.0], [0, 0.78, 0], { color: 'silver', round: 0.3 })
      .capsule([0.55, 1.9, 0.3], [0, 0.94, 0], { color: 'black', rot: [90, 0, 0] })
      .stick([0, 1.09, -0.85], [0, 1.09, 0.85], 0.015, 'silver')
      .box([0.08, 0.04, 0.005], [0.1, 0.94, -1.0], { color: 'white', round: 0 });
    for (const z of [0.85, -0.85]) b.pair((s) => b.stick([s * 0.3, 0.12, z], [s * 0.3, 0.76, z], 0.04, 'silver').torus([0.12, 0.12, 0.04], [s * 0.3, 0.06, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    b.stick([0, 0.4, -0.85], [0, 0.4, 0.85], 0.03, 'silver');
    return b.done();
  }),
  e('body shop', 'places', 'shops', () => {
    const b = shop('body shop', 'BODY SHOP', { w: 6, h: 3.4, wall: '#d4d7da', roof: 'blue', flat: true, sign: 'yellow' });
    b.box([2.6, 2.2, 0.1], [-1.4, 1.1, 2.04], { color: 'gray', round: 0 });
    b.each(5, (i) => b.box([2.6, 0.04, 0.12], [-1.4, 0.3 + i * 0.42, 2.06], { color: 'darkgray', noInk: true, round: 0 }));
    b.box([1.6, 0.6, 1.2], [-1.4, 0.55, 3.0], { color: 'red', round: 0.5 }).box([1.2, 0.4, 0.6], [-1.4, 1.0, 2.8], { color: 'glass', round: 0.5 });
    b.pair((s) => b.torus([0.5, 0.5, 0.2], [-1.4 + s * 0.6, 0.25, 3.3], { color: 'rubber', tube: 0.35, rot: [0, 90, 0] }));
    b.rod([1.9, 2.2, 2.1], [2.5, 2.8, 2.1], 0.12, 'silver').torus([0.4, 0.4, 0.1], [2.6, 2.9, 2.1], { color: 'silver', tube: 0.3 });
    return b.done();
  }),
  e('body wash', 'home', 'bathroom', () => {
    const b = bottle(m('body wash'), { h: 0.22, w: 0.075, body: 'teal', cap: 'white', label: 'white', text: 'BODY WASH', neck: 0.7 });
    for (const [x, y, z, r] of [[0.06, 0.05, 0.04, 0.03], [0.08, 0.09, 0.0, 0.022], [-0.06, 0.03, 0.05, 0.026], [0.05, 0.015, 0.07, 0.03]]) b.ball(r, [x, y, z], { color: 'white' });
    return b.done();
  }),
  e('boiler', 'home', 'appliances', () =>
    m('boiler')
      .cyl([0.9, 0.1, 0.9], [0, 0.05, 0], { color: 'darkgray' })
      .cyl([0.8, 1.5, 0.8], [0, 0.85, 0], { color: 'red' })
      .ball([0.8, 0.36, 0.8], [0, 1.6, 0], { color: 'red' })
      .torus([0.82, 0.82, 0.05], [0, 0.5, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.04 })
      .torus([0.82, 0.82, 0.05], [0, 1.2, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.04 })
      .box([0.36, 0.3, 0.06], [0, 0.32, 0.39], { color: 'darkgray', round: 0.2 })
      .box([0.24, 0.04, 0.02], [0, 0.32, 0.43], { color: 'fire', glow: true, round: 0 })
      .cyl([0.2, 0.05, 0.2], [0.14, 0.95, 0.39], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.16, 0.02, 0.16], [0.14, 0.95, 0.42], { color: 'white', rot: [90, 0, 0] })
      .stick([0.2, 1.7, 0], [0.2, 2.0, 0], 0.1, 'copper')
      .stick([0.2, 1.95, 0], [0.2, 1.95, -0.5], 0.1, 'copper')
      .torus([0.2, 0.2, 0.03], [-0.3, 1.45, 0.25], { color: 'gold', tube: 0.15, rot: [0, 45, 0] })
      .done(),
  ),
  e('bok choi', 'food', 'vegetables', () => {
    const b = m('bok choi').cyl([0.07, 0.025, 0.07], [0, 0.0125, 0], { color: '#dfe8c8' });
    around(5, 0.035, 0.3).forEach(([x, z]) => {
      b.rod([x * 0.3, 0.015, z * 0.3], [x * 1.3, 0.13, z * 1.3], 0.034, '#f0f5e4');
      leaf(b, [x * 1.2, 0.11, z * 1.2], [x * 2.2, 0.27, z * 2.2], 0.09, 'darkgreen');
    });
    return b.done();
  }),
  e('bolt (metal)', 'workshop', 'hardware', () => {
    const b = m('bolt (metal)')
      .cyl([0.045, 0.018, 0.045], [0, 0.009, 0], { color: 'steel', segs: 6 })
      .cyl([0.02, 0.08, 0.02], [0, 0.058, 0], { color: 'silver' })
      .cyl([0.04, 0.015, 0.04], [0, 0.04, 0], { color: 'steel', segs: 6 });
    b.each(5, (i) => b.torus([0.023, 0.023, 0.004], [0, 0.06 + i * 0.008, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 }));
    return b.done();
  }),
  e('bomb', 'armory', 'explosives', () =>
    m('bomb')
      .ball(0.24, [0, 0.12, 0], { color: 'black' })
      .cyl([0.07, 0.04, 0.07], [0.04, 0.235, 0], { color: 'darkgray', rot: [0, 0, -20] })
      .rod([0.05, 0.25, 0], [0.09, 0.31, 0.01], 0.012, 'tan')
      .star(0.07, [0.1, 0.34, 0.01], { color: 'flame', glow: true })
      .ball([0.05, 0.035, 0.02], [-0.05, 0.18, 0.09], { color: 'white', noInk: true, rot: [0, 0, 30] })
      .done(),
  ),
  e('bomb shelter', 'places', 'shelters', () =>
    m('bomb shelter')
      .cyl([5, 1.4, 4], [0, 0.7, -0.4], { color: 'grass', taper: 0.65 })
      .ball([3.2, 0.9, 2.6], [0, 1.35, -0.4], { color: 'grass' })
      .box([1.7, 1.9, 1.1], [0, 0.95, 1.6], { color: 'stone', round: 0.1 })
      .box([1.0, 1.4, 0.1], [0, 0.75, 2.17], { color: 'steel', name: 'door', pivot: [-0.5, 0.75, 2.17] })
      .torus([0.45, 0.45, 0.06], [0, 0.8, 2.24], { color: 'red', tube: 0.15, parent: 'door' })
      .label('SHELTER', [1.3, 0.3], [0, 1.65, 2.17], { color: 'yellow' })
      .stick([1.2, 1.5, -0.6], [1.2, 2.3, -0.6], 0.15, 'gray')
      .cone([0.4, 0.2, 0.4], [1.2, 2.4, -0.6], { color: 'gray' })
      .done(),
  ),
  e('bomber (plane)', 'garage', 'aircraft', () => {
    const O = '#6b7350';
    const b = m('bomber (plane)', { view: 'side' })
      .capsule([1.8, 13, 1.8], [0, 2.2, 0], { color: O, rot: [90, 0, 0] })
      .box([16, 0.25, 2.4], [0, 2.2, 0.6], { color: O, round: 0.5 })
      .wedge([2.8, 2.6, 0.2], [0, 4.2, -5.2], { color: O, rot: [0, 90, 0], apex: 0.3 })
      .box([5.2, 0.2, 1.3], [0, 2.6, -5.8], { color: O, round: 0.5 })
      .ball([1.2, 1.2, 1.4], [0, 2.2, 6.0], { color: 'glass' })
      .ball([1.0, 0.5, 1.4], [0, 3.05, 3.8], { color: 'glass' })
      .ball([0.9, 0.9, 0.1], [0.9, 2.3, -2.0], { color: 'white', rot: [0, 90, 0], noInk: true })
      .ball([0.4, 0.4, 0.11], [0.9, 2.3, -2.0], { color: 'navy', rot: [0, 90, 0], noInk: true });
    let k = 0;
    b.pair((s) => b.each(2, (i) => {
      const x = s * (2.4 + i * 2.6);
      b.cyl([0.8, 1.6, 0.8], [x, 2.0, 1.4], { color: 'darkgray', rot: [90, 0, 0] });
      b.box([0.15, 1.6, 0.06], [x, 2.0, 2.25], { color: 'black', name: k++ ? undefined : 'fan', round: 0.5 });
    }));
    b.pair((s) => b.stick([s * 2.4, 1.6, 1.0], [s * 2.4, 0.5, 1.0], 0.15, 'darkgray').torus([0.9, 0.9, 0.35], [s * 2.4, 0.45, 1.0], { color: 'rubber', rot: [0, 90, 0], tube: 0.35, name: s > 0 ? 'wheel' : undefined }));
    return b.done();
  }),
  e('bone', 'clinic', 'bones', () => {
    const b = m('bone').capsule([0.055, 0.26, 0.05], [0, 0.065, 0], { color: 'cream', rot: [0, 0, 90] });
    b.pair((s) => b.ball(0.065, [s * 0.135, 0.092, 0], { color: 'cream' }).ball(0.065, [s * 0.135, 0.035, 0], { color: 'cream' }));
    return b.done();
  }),
  e('bongo (music)', 'music', 'drums', () => {
    const b = m('bongo (music)').box([0.06, 0.07, 0.08], [0, 0.17, 0], { color: 'darkwood' });
    for (const [x, d, h] of [[0.12, 0.18, 0.26], [-0.11, 0.15, 0.24]] as Array<[number, number, number]>) {
      b.cyl([d, h, d], [x, h / 2, 0], { color: 'wood', taper: 1.3 });
      b.cyl([d * 1.3, 0.012, d * 1.3], [x, h + 0.006, 0], { color: 'cream' });
      b.torus([d * 1.36, d * 1.36, 0.025], [x, h - 0.005, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.08 });
    }
    return b.done();
  }),
  e('bonnet', 'wardrobe', 'hats', () =>
    m('bonnet')
      .cyl([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' })
      .stick([0, 0.04, 0], [0, 0.11, 0], 0.03, 'darkwood')
      .ball([0.17, 0.22, 0.19], [0, 0.21, 0], { color: 'beige' })
      .ball([0.2, 0.25, 0.19], [0, 0.24, -0.035], { color: '#c8b0e8' })
      .torus([0.21, 0.25, 0.06], [0, 0.235, 0.04], { color: '#c8b0e8', tube: 0.14 })
      .ball(0.02, [0.035, 0.215, 0.09], { color: 'black', eye: true })
      .ball(0.02, [-0.035, 0.215, 0.09], { color: 'black', eye: true })
      .ball([0.03, 0.02, 0.01], [0.055, 0.18, 0.085], { color: 'pink', noInk: true })
      .ball([0.03, 0.02, 0.01], [-0.055, 0.18, 0.085], { color: 'pink', noInk: true })
      .ball([0.04, 0.03, 0.02], [0.025, 0.1, 0.07], { color: 'pink', rot: [0, 0, 20] })
      .ball([0.04, 0.03, 0.02], [-0.025, 0.1, 0.07], { color: 'pink', rot: [0, 0, -20] })
      .done(),
  ),
  e('bonsai', 'garden', 'house plants', () =>
    m('bonsai')
      .box([0.34, 0.08, 0.22], [0, 0.04, 0], { color: 'navy', round: 0.2 })
      .box([0.3, 0.012, 0.18], [0, 0.082, 0], { color: 'dirt', round: 0 })
      .rod([0, 0.08, 0], [0.04, 0.18, 0], 0.04, 'bark')
      .rod([0.04, 0.18, 0], [-0.03, 0.28, 0], 0.035, 'bark')
      .rod([-0.03, 0.28, 0], [0.02, 0.36, 0], 0.03, 'bark')
      .rod([0.04, 0.18, 0], [0.14, 0.22, 0], 0.022, 'bark')
      .rod([-0.03, 0.28, 0], [-0.14, 0.3, 0], 0.022, 'bark')
      .ball([0.16, 0.06, 0.12], [0.02, 0.4, 0], { color: 'darkgreen', name: 'top' })
      .ball([0.15, 0.06, 0.12], [0.16, 0.25, 0], { color: 'darkgreen', parent: 'top' })
      .ball([0.15, 0.06, 0.12], [-0.16, 0.33, 0], { color: '#356b30', parent: 'top' })
      .done(),
  ),
  e('book', 'study', 'books', () =>
    m('book')
      .box([0.17, 0.24, 0.008], [0, 0.12, 0.02], { color: 'red', round: 0.2 })
      .box([0.17, 0.24, 0.008], [0, 0.12, -0.02], { color: 'red', round: 0.2 })
      .box([0.014, 0.24, 0.048], [-0.082, 0.12, 0], { color: 'darkred', round: 0.5 })
      .box([0.16, 0.228, 0.034], [0.004, 0.12, 0], { color: 'paper', round: 0.1 })
      .label('BOOK', [0.1, 0.04], [0, 0.17, 0.026], { color: 'gold' })
      .box([0.012, 0.05, 0.004], [0.03, -0.0, 0.0], { color: 'gold', round: 0 })
      .done(),
  ),
  e('book holder', 'study', 'books', () => {
    const b = m('book holder')
      .box([0.3, 0.025, 0.2], [0, 0.0125, 0], { color: 'wood', round: 0.3 })
      .box([0.32, 0.26, 0.016], [0, 0.15, -0.03], { color: 'wood', rot: [-25, 0, 0], round: 0.2 })
      .box([0.32, 0.025, 0.035], [0, 0.04, 0.04], { color: 'darkwood', round: 0.3 })
      .box([0.3, 0.21, 0.008], [0, 0.155, -0.012], { color: 'red', rot: [-25, 0, 0], round: 0.1 });
    b.pair((s) => {
      b.box([0.14, 0.2, 0.012], [s * 0.074, 0.155, -0.0], { color: 'paper', rot: [-25, s * -10, 0], round: 0.1 });
      b.each(4, (i) => b.box([0.09, 0.006, 0.004], [s * 0.074, 0.2 - i * 0.03, 0.012 + i * 0.013], { color: 'gray', noInk: true, rot: [-25, s * -10, 0], round: 0 }));
    });
    return b.done();
  }),
  e('book store', 'places', 'shops', () => {
    const b = shop('book store', 'BOOKS', { w: 5, h: 3, wall: '#2f6b4a', roof: 'darkbrown', sign: 'cream' });
    b.pair((s) => b.each(4, (i) => b.box([0.18, 0.6 - (i % 2) * 0.12, 0.06], [s * 1.5 - 0.3 + i * 0.2, 1.06 - (i % 2) * 0.06, 2.07], { color: RAINBOW[(i + (s > 0 ? 2 : 0)) % 6], round: 0.2 })));
    ['red', 'blue', 'yellow'].forEach((c, i) => b.box([0.9 - i * 0.1, 0.25, 0.7], [3.0, 0.125 + i * 0.25, 1.8], { color: c, round: 0.2, rot: [0, i * 12, 0] }));
    return b.done();
  }),
  e('bookcase', 'home', 'storage', () => {
    const b = m('bookcase')
      .box([1.0, 1.8, 0.04], [0, 0.9, -0.16], { color: 'darkwood', round: 0.1 });
    b.pair((s) => b.box([0.05, 1.8, 0.35], [s * 0.475, 0.9, 0], { color: 'darkwood', round: 0.1 }));
    b.each(5, (i) => b.box([0.95, 0.04, 0.34], [0, 0.02 + i * 0.44, 0], { color: 'wood', round: 0.1 }));
    const C3 = ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'teal', 'maroon', 'navy', 'gold', 'darkgreen', 'pink'];
    b.each(4, (r) => b.each(3, (k) => {
      const w = 0.22 + ((r + k) % 3) * 0.03, h = 0.28 + ((r * 2 + k) % 3) * 0.04;
      b.box([w, h, 0.25], [-0.3 + k * 0.29, 0.04 + r * 0.44 + h / 2, 0.02], { color: C3[r * 3 + k], round: 0.1 });
    }));
    return b.done();
  }),
  e('boomerang', 'sports', 'throwing toys', () => {
    const b = m('boomerang').box([0.22, 0.05, 0.09], [0, 0.025, 0], { color: 'darkwood', round: 0.3 });
    b.pair((s) => b.box([0.42, 0.075, 0.025], [s * 0.15, 0.2, 0], { color: 'wood', rot: [0, 0, s * 38], round: 0.9 }));
    b.ball([0.09, 0.08, 0.025], [0, 0.08, 0], { color: 'wood' });
    for (const [x, y, c] of [[0.1, 0.16, 'white'], [0.2, 0.24, 'red'], [-0.1, 0.16, 'red'], [-0.2, 0.24, 'white'], [0, 0.09, 'yellow']] as Array<[number, number, string]>) b.ball([0.02, 0.02, 0.006], [x, y, 0.013], { color: c, noInk: true });
    return b.done();
  }),
  e('booster seat', 'home', 'baby things', () => {
    const b = m('booster seat')
      .box([0.42, 0.14, 0.4], [0, 0.07, 0], { color: 'darkgray', round: 0.4 })
      .box([0.32, 0.06, 0.32], [0, 0.17, 0.02], { color: 'blue', round: 0.6 })
      .box([0.42, 0.45, 0.1], [0, 0.32, -0.18], { color: 'darkgray', round: 0.5 })
      .box([0.3, 0.32, 0.04], [0, 0.33, -0.12], { color: 'blue', round: 0.6 });
    b.pair((s) => b.box([0.07, 0.13, 0.36], [s * 0.19, 0.2, 0], { color: 'darkgray', round: 0.6 }));
    return b.done();
  }),
  e('boot', 'wardrobe', 'shoes', () =>
    m('boot')
      .box([0.105, 0.016, 0.28], [0, 0.008, 0.04], { color: 'black', round: 0.5 })
      .box([0.1, 0.07, 0.27], [0, 0.045, 0.045], { color: 'darkbrown', round: 0.8 })
      .box([0.09, 0.045, 0.07], [0, 0.025, -0.06], { color: 'black', round: 0.3 })
      .cyl([0.11, 0.3, 0.12], [0, 0.21, -0.04], { color: 'darkbrown', taper: 1.1 })
      .torus([0.128, 0.138, 0.035], [0, 0.36, -0.04], { color: 'tan', rot: [90, 0, 0], tube: 0.15 })
      .done(),
  ),
  e('boston cream pie', 'food', 'cakes', () => {
    const b = m('boston cream pie')
      .cyl([0.32, 0.015, 0.32], [0, 0.0075, 0], { color: 'white' })
      .cyl([0.24, 0.04, 0.24], [0, 0.035, 0], { color: '#f2d27a' })
      .cyl([0.236, 0.02, 0.236], [0, 0.065, 0], { color: '#fff1b0' })
      .cyl([0.24, 0.04, 0.24], [0, 0.095, 0], { color: '#f2d27a' })
      .cyl([0.246, 0.016, 0.246], [0, 0.122, 0], { color: 'chocolate' });
    around(7, 0.121).forEach(([x, z]) => b.capsule([0.018, 0.04, 0.012], [x, 0.105, z], { color: 'chocolate', rot: [0, Math.atan2(x, z) * RAD, 0] }));
    return b.done();
  }),
  e('bottle', 'kitchen', 'bottles', () => bottle(m('bottle'), { h: 0.28, w: 0.08, body: '#4a9a5a', cap: 'gold', label: 'cream', neck: 0.4 }).done()),
  e('bottle opener', 'kitchen', 'utensils', () =>
    m('bottle opener')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'darkgray', round: 0.3 })
      .box([0.032, 0.11, 0.016], [0, 0.075, 0], { color: 'darkwood', round: 0.6 })
      .cyl([0.055, 0.014, 0.055], [0, 0.15, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.026, 0.016, 0.022], [0, 0.155, 0], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.032, 0.008, 0.032], [0.06, 0.004, 0.03], { color: 'red', segs: 12 })
      .done(),
  ),
];
