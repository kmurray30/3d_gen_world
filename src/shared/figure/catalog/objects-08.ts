/** Catalog chunk objects-08: the words in assign/objects-08.tsv. */
import { e, type CatalogEntry } from './types';
import { m, around, type M } from '../dsl';
import { face, hat, held, wear, who } from '../accessories';

type V = [number, number, number];
const D2R = Math.PI / 180;

/** A point on the surface of an ellipsoid (centre c, radii r): yaw 0 is the front (+z), pitch up from the equator. */
const surf = (c: V, r: V, yaw: number, pitch: number): V => [
  c[0] + r[0] * Math.cos(pitch * D2R) * Math.sin(yaw * D2R),
  c[1] + r[1] * Math.sin(pitch * D2R),
  c[2] + r[2] * Math.cos(pitch * D2R) * Math.cos(yaw * D2R),
];

/** A little building: walls, gable (or flat) roof, door, two windows and a sign over the door. */
function bld(key: string, sign: string, o: { w?: number; h?: number; d?: number; wall: string; roof?: string; flat?: boolean; door?: string; signBg?: string; win?: string }): M {
  const w = o.w ?? 4, h = o.h ?? 3, d = o.d ?? 3;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.flat) b.box([w + 0.2, 0.25, d + 0.2], [0, h + 0.12, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  else b.wedge([w + 0.4, h * 0.5, d + 0.3], [0, h * 1.25, 0], { color: o.roof ?? 'darkred' });
  b.box([0.9, 1.7, 0.08], [0, 0.85, d / 2 + 0.03], { color: o.door ?? 'darkwood', round: 0.1 });
  b.pair((s) => b.box([0.8, 0.8, 0.06], [s * w * 0.3, h * 0.42, d / 2 + 0.03], { color: o.win ?? 'glass', round: 0.1 }));
  return b.label(sign, [Math.min(w * 0.7, 3.2), 0.5], [0, h - 0.42, d / 2 + 0.06], { color: o.signBg ?? 'cream' });
}

/** Wheels on both sides of a side-view vehicle at the given z positions; the first is the named 'wheel'. */
function wheels(b: M, zs: number[], x: number, dia: number, hub = 'silver', named = true): M {
  zs.forEach((z, i) =>
    b.pair((s) => {
      b.torus([dia, dia, dia * 0.38], [s * x, dia / 2, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35, name: named && i === 0 && s === 1 ? 'wheel' : undefined });
      b.cyl([dia * 0.45, dia * 0.4, dia * 0.45], [s * x, dia / 2, z], { color: hub, rot: [0, 0, 90] });
    }),
  );
  return b;
}

/** A shirt or coat shape standing upright as if on a dress form: body and two sleeves. */
function garment(b: M, o: { w: number; len: number; y0?: number; color: string; sleeve: number; arm?: string; depth?: number }): M {
  const y0 = o.y0 ?? 0, top = y0 + o.len, d = o.depth ?? o.w * 0.4;
  b.box([o.w, o.len, d], [0, y0 + o.len / 2, 0], { color: o.color, round: 0.3 });
  if (o.sleeve > 0) b.pair((s) => b.rod([s * o.w * 0.4, top - o.w * 0.12, 0], [s * (o.w * 0.4 + o.sleeve * 0.45), top - o.w * 0.12 - o.sleeve * 0.85, 0], o.w * 0.27, o.arm ?? o.color));
  return b;
}

/** Recycling arrows: three green arrows chasing round a triangle in the x-y plane. */
function recycleMark(b: M, c: V, size: number, color = '#2e9e4f', noInk = false): M {
  const P: Array<[number, number]> = [[0, 0.55], [0.5, -0.32], [-0.5, -0.32]];
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 3];
    const p = (t: number): V => [c[0] + (ax + (bx - ax) * t) * size, c[1] + (ay + (by - ay) * t) * size, c[2]];
    b.rod(p(0.12), p(0.62), size * 0.13, color, { noInk });
    const dx = bx - ax, dy = by - ay;
    b.cone([size * 0.3, size * 0.24, size * 0.1], p(0.72), { color, noInk, rot: [0, 0, -Math.atan2(dx, dy) / D2R] });
  }
  return b;
}

/** A sign board on a post: rectangular, diamond, round or triangular. */
function postSign(key: string, text: string, o: { h: number; w: number; bh?: number; bg: string; shape?: 'box' | 'diamond' | 'round' | 'tri'; post?: string; edge?: string }): M {
  const bh = o.bh ?? o.w * 0.6, cy = o.h - bh / 2;
  const b = m(key).cyl([0.3, 0.12, 0.3], [0, 0.06, 0], { color: 'darkgray' }).stick([0, 0, 0], [0, cy, -0.04], 0.06, o.post ?? 'gray');
  const sh = o.shape ?? 'box';
  if (sh === 'box') b.box([o.w, bh, 0.04], [0, cy, 0], { color: o.edge ?? o.bg, round: 0.1 }).label(text, [o.w * 0.9, bh * 0.85], [0, cy, 0.02], { color: o.bg });
  if (sh === 'diamond') b.box([o.w * 0.72, o.w * 0.72, 0.04], [0, cy, 0], { color: o.edge ?? 'black', rot: [0, 0, 45], round: 0.1 }).box([o.w * 0.64, o.w * 0.64, 0.04], [0, cy, 0.01], { color: o.bg, rot: [0, 0, 45], round: 0.1 }).label(text, [o.w * 0.5, o.w * 0.3], [0, cy, 0.03], { color: o.bg });
  if (sh === 'round') b.cyl([o.w, 0.04, o.w], [0, cy, 0], { color: o.edge ?? o.bg, rot: [90, 0, 0] }).label(text, [o.w * 0.6, o.w * 0.3], [0, cy, 0.03], { color: o.bg });
  if (sh === 'tri') b.wedge([o.w, bh, 0.04], [0, cy, 0], { color: o.edge ?? 'red' }).wedge([o.w * 0.75, bh * 0.72, 0.04], [0, cy - bh * 0.06, 0.01], { color: o.bg }).label(text, [o.w * 0.3, bh * 0.25], [0, cy - bh * 0.15, 0.03], { color: o.bg });
  return b;
}

/** A horse's head and neck on a plinth with a bridle; reins hang from the bit in a loop (one strap if single). */
function horseBust(key: string, single: boolean): M {
  const hc = '#9a6038', lc = '#2a2726';
  const b = m(key)
    .box([0.36, 0.12, 0.34], [0, 0.06, 0], { color: 'darkwood' })
    .rod([0, 0.12, -0.08], [0, 0.6, -0.02], 0.2, hc)
    .ball([0.17, 0.19, 0.2], [0, 0.66, 0.0], { color: hc })
    .box([0.12, 0.13, 0.26], [0, 0.58, 0.14], { color: hc, round: 0.6, rot: [30, 0, 0] })
    .box([0.04, 0.16, 0.01], [0, 0.63, 0.115], { color: 'white', noInk: true, rot: [30, 0, 0] })
    .rod([0, 0.14, -0.17], [0, 0.76, -0.06], 0.06, lc);
  b.pair((s) => {
    b.cone([0.05, 0.1, 0.04], [s * 0.05, 0.78, -0.03], { color: hc, rot: [-10, 0, s * -10] });
    b.ball(0.03, [s * 0.075, 0.68, 0.06], { color: 'black', eye: true });
    b.rod([s * 0.075, 0.74, -0.01], [s * 0.065, 0.53, 0.2], 0.018, lc);
    b.torus([0.05, 0.05, 0.012], [s * 0.07, 0.51, 0.21], { color: 'silver', rot: [0, 90, 0], tube: 0.22 });
    if (s === 1 || !single) b.rod([s * 0.075, 0.5, 0.22], [s * 0.1, 0.24, 0.28], 0.022, lc).rod([s * 0.1, 0.24, 0.28], [s * 0.1, 0.36, 0.0], 0.022, lc);
  });
  if (!single) b.rod([-0.1, 0.24, 0.28], [0.1, 0.24, 0.28], 0.022, lc);
  return b.rod([-0.068, 0.56, 0.24], [0.068, 0.56, 0.24], 0.018, lc);
}

/** An open boat hull along z: body, pointed bow, a wooden floor seen from above and a stripe. */
function hull(b: M, len: number, w: number, h: number, color: string, inside = 'wood', stripe = 'white'): M {
  const body = len - w * 0.7;
  b.box([w, h, body], [0, h / 2, -w * 0.35], { color, round: 0.4 });
  b.wedge([w, w * 0.9, h], [0, h / 2, body / 2 - w * 0.35 + w * 0.42], { color, rot: [90, 0, 0] });
  b.box([w * 0.82, h * 0.06, body * 0.9], [0, h * 0.98, -w * 0.35], { color: inside, round: 0.3 });
  return b.pair((s) => b.box([0.02, h * 0.12, body * 0.9], [s * w * 0.5, h * 0.78, -w * 0.35], { color: stripe, noInk: true }));
}

/** A sneaker along z at x (scaled by k, lifted by y0): sole, upper, toe, tongue and laces. */
function sneaker(b: M, x: number, up: string, k = 1, y0 = 0, z = 0): M {
  const p = (v: V): V => [x + v[0] * k, y0 + v[1] * k, z + v[2] * k];
  const S = (v: V): V => [v[0] * k, v[1] * k, v[2] * k];
  b.box(S([0.1, 0.03, 0.28]), p([0, 0.015, 0]), { color: 'white', round: 0.6 });
  b.box(S([0.09, 0.09, 0.16]), p([0, 0.07, -0.05]), { color: up, round: 0.5 });
  b.ball(S([0.09, 0.07, 0.15]), p([0, 0.04, 0.065]), { color: up });
  b.ball(S([0.06, 0.014, 0.08]), p([0, 0.114, -0.07]), { color: 'black', noInk: true });
  b.box(S([0.05, 0.03, 0.1]), p([0, 0.1, 0.02]), { color: up, round: 0.5, rot: [-20, 0, 0] });
  b.each(3, (i) => b.box(S([0.06, 0.008, 0.012]), p([0, 0.085 - i * 0.012, 0.0 + i * 0.03]), { color: 'white', noInk: true }));
  return b.box(S([0.092, 0.02, 0.06]), p([0, 0.04, -0.12]), { color: 'white', round: 0.4, noInk: true });
}

/** A flat slab from a to c in the x-y plane (a drape, a ramp, a board): width w along z, thickness t. */
function plank(b: M, a: V, c: V, w: number, t: number, color: string, o: { noInk?: boolean; round?: number } = {}): M {
  const dx = c[0] - a[0], dy = c[1] - a[1];
  return b.box([Math.hypot(dx, dy), t, w], [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], { color, rot: [0, 0, Math.atan2(dy, dx) / D2R], round: o.round ?? 0.3, noInk: o.noInk });
}

/** A flat shape on a small wooden plinth (ideas: shapes). */
const plinth = (b: M, w = 0.1): M => b.box([w, 0.025, 0.05], [0, 0.0125, 0], { color: 'wood' });

/** A jar of something: filled body, lid and a paper label band. */
function jar(key: string, fill: string, lid: string, h = 0.13, dia = 0.08, band = 'paper'): M {
  return m(key)
    .cyl([dia, h * 0.84, dia], [0, h * 0.42, 0], { color: fill })
    .cyl([dia * 1.04, h * 0.16, dia * 1.04], [0, h * 0.92, 0], { color: lid })
    .cyl([dia * 1.02, h * 0.34, dia * 1.02], [0, h * 0.4, 0], { color: band });
}

/** A bottle: body, shoulder, neck and cap, with an optional label band. */
function bottle(b: M, at: V, h: number, dia: number, color: string, cap = 'white', band?: string): M {
  const [x, y, z] = at;
  b.cyl([dia, h * 0.6, dia], [x, y + h * 0.3, z], { color });
  b.cyl([dia, h * 0.15, dia], [x, y + h * 0.675, z], { color, taper: 0.4 });
  b.cyl([dia * 0.4, h * 0.15, dia * 0.4], [x, y + h * 0.825, z], { color });
  b.cyl([dia * 0.46, h * 0.1, dia * 0.46], [x, y + h * 0.95, z], { color: cap });
  if (band) b.cyl([dia * 1.03, h * 0.3, dia * 1.03], [x, y + h * 0.32, z], { color: band });
  return b;
}

/** A bowl (wider at the top) at a position, with an optional mound of food in it. */
function bowl(b: M, dia: number, color: string, food?: string, at: V = [0, 0, 0]): M {
  const [x, y, z] = at;
  b.cyl([dia * 0.62, dia * 0.36, dia * 0.62], [x, y + dia * 0.18, z], { color, taper: 1.6 });
  if (food) b.ball([dia * 0.92, dia * 0.22, dia * 0.92], [x, y + dia * 0.36, z], { color: food });
  return b;
}

/** A plate. */
const plate = (b: M, dia: number, color = 'white', at: V = [0, 0, 0]): M => b.cyl([dia, dia * 0.07, dia], [at[0], at[1] + dia * 0.035, at[2]], { color, taper: 1.15 });

/** A gem standing on its point: pavilion cone below a crown with a table. */
function gem(key: string, color: string, s = 0.08): M {
  return m(key)
    .cone([s, s * 0.55, s], [0, s * 0.275, 0], { color, rot: [180, 0, 0], segs: 8 })
    .cyl([s, s * 0.22, s], [0, s * 0.66, 0], { color, taper: 0.62, segs: 8 })
    .ball([s * 0.3, s * 0.1, s * 0.3], [0, s * 0.62, s * 0.3], { color: 'white', noInk: true });
}

export const ENTRIES: CatalogEntry[] = [
  e('raft', 'garage', 'boats', () => {
    const b = m('raft');
    b.each(6, (i) => b.cyl([0.26, 2.2, 0.26], [-0.65 + i * 0.26, 0.13, 0], { color: i % 2 ? 'wood' : 'lightwood', rot: [90, 0, 0] }));
    b.pair((s) => b.box([1.66, 0.06, 0.1], [0, 0.26, s * 0.75], { color: 'tan' }));
    b.stick([0, 0.2, -0.3], [0, 1.6, -0.3], 0.07, 'darkwood');
    b.wedge([0.9, 1.1, 0.03], [0.46, 1.0, -0.3], { color: 'cream', apex: -0.5 });
    return b.rod([-0.5, 0.3, 0.6], [-0.2, 0.3, 1.3], 0.05, 'wood').box([0.18, 0.04, 0.3], [-0.12, 0.3, 1.45], { color: 'wood', rot: [0, -25, 0] }).done();
  }),
  e('rag', 'home', 'cleaning', () => {
    const c = '#c9b892';
    const b = m('rag')
      .cyl([0.2, 0.2, 0.2], [0, 0.1, 0], { color: 'gray', taper: 1.2 })
      .torus([0.25, 0.25, 0.02], [0, 0.2, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.1 })
      .box([0.16, 0.05, 0.14], [0.02, 0.215, 0.03], { color: c, round: 0.6, rot: [0, 15, 0] })
      .box([0.15, 0.15, 0.03], [0.03, 0.15, 0.125], { color: c, round: 0.3, rot: [-6, 0, 4] })
      .box([0.05, 0.05, 0.006], [0.0, 0.17, 0.142], { color: 'denim', noInk: true, rot: [0, 0, 10] })
      .box([0.04, 0.04, 0.006], [0.07, 0.11, 0.142], { color: 'darkred', noInk: true, rot: [0, 0, -12] });
    return b.each(5, (i) => b.cone([0.025, 0.035, 0.012], [-0.03 + i * 0.03, 0.065, 0.13], { color: c, rot: [180, 0, (i - 2) * 8] })).done();
  }),
  e('ragdoll', 'toys', 'dolls', () => {
    const b = m('ragdoll')
      .cone([0.2, 0.18, 0.14], [0, 0.11, 0], { color: 'pink', taper: 0.4 })
      .box([0.04, 0.04, 0.01], [0.04, 0.09, 0.065], { color: 'yellow', noInk: true, rot: [0, 0, 15] })
      .ball(0.12, [0, 0.27, 0], { color: '#f6e0c8' })
      .ball([0.13, 0.06, 0.12], [0, 0.32, -0.01], { color: 'red' });
    b.pair((s) => {
      b.ball(0.05, [s * 0.06, 0.28, -0.01], { color: 'red' });
      b.rod([s * 0.03, 0.03, 0.02], [s * 0.05, 0.025, 0.17], 0.035, '#fff', {}).rod([s * 0.04, 0.03, 0.08], [s * 0.045, 0.028, 0.1], 0.037, 'red', { noInk: true });
      b.ball([0.05, 0.04, 0.06], [s * 0.05, 0.025, 0.19], { color: 'black' });
      b.rod([s * 0.07, 0.18, 0], [s * 0.12, 0.08, 0.04], 0.03, '#f6e0c8');
      b.cyl([0.022, 0.006, 0.022], [s * 0.024, 0.285, 0.058], { color: 'black', rot: [90, 0, 0] });
      b.ball(0.02, [s * 0.038, 0.255, 0.05], { color: 'pink', noInk: true });
    });
    return b.rod([-0.015, 0.243, 0.058], [0.015, 0.243, 0.058], 0.007, 'darkred').done();
  }),
  e('railing', 'home', 'stairs', () => {
    const b = m('railing').box([1.9, 0.07, 0.1], [0, 0.98, 0], { color: 'darkwood', round: 0.5 }).box([1.8, 0.06, 0.08], [0, 0.08, 0], { color: 'darkwood' });
    b.pair((s) => b.box([0.15, 1.05, 0.15], [s * 0.92, 0.525, 0], { color: 'darkwood' }).ball(0.17, [s * 0.92, 1.1, 0], { color: 'darkwood' }));
    b.each(9, (i) => b.stick([-0.72 + i * 0.18, 0.1, 0], [-0.72 + i * 0.18, 0.95, 0], 0.035, 'white'));
    return b.done();
  }),
  e('railroad crossing sign', 'ideas', 'road signs', () => {
    const b = m('railroad crossing sign').cyl([0.34, 0.16, 0.34], [0, 0.08, 0], { color: 'darkgray' }).stick([0, 0, 0], [0, 2.0, 0], 0.08, 'gray');
    b.label('RAILROAD', [1.1, 0.2], [0, 1.72, 0.06], { color: 'white', rot: [0, 0, 35] }).label('CROSSING', [1.1, 0.2], [0, 1.72, 0.09], { color: 'white', rot: [0, 0, -35] });
    b.box([0.75, 0.07, 0.06], [0, 1.22, 0.05], { color: 'black' });
    b.pair((s) => b.cyl([0.3, 0.04, 0.3], [s * 0.32, 1.1, 0.06], { color: 'black', rot: [90, 0, 0] }).cyl([0.2, 0.04, 0.2], [s * 0.32, 1.1, 0.09], { color: 'red', rot: [90, 0, 0], glow: true }));
    return b.done();
  }),
  e('railroad tracks', 'garage', 'trains', () => {
    const b = m('railroad tracks').box([3.0, 0.22, 2.5], [0, 0.11, 0], { color: 'stone', round: 0.3 });
    b.each(5, (i) => b.box([0.24, 0.1, 2.2], [-1.2 + i * 0.6, 0.25, 0], { color: 'darkwood', round: 0.1 }));
    b.pair((s) => b.box([3.0, 0.14, 0.08], [0, 0.37, s * 0.72], { color: 'steel', round: 0.1 }));
    return b.done();
  }),
  e('raincoat', 'wardrobe', 'coats', () => {
    const b = garment(m('raincoat'), { w: 0.55, len: 0.95, color: 'yellow', sleeve: 0.55 });
    b.ball([0.3, 0.26, 0.24], [0, 1.0, -0.06], { color: 'yellow' }).box([0.015, 0.9, 0.01], [0, 0.48, 0.112], { color: '#d9ad22', noInk: true });
    b.each(4, (i) => b.cyl([0.035, 0.015, 0.035], [0.04, 0.25 + i * 0.18, 0.115], { color: 'black', rot: [90, 0, 0] }));
    return b.pair((s) => b.box([0.14, 0.12, 0.02], [s * 0.16, 0.3, 0.115], { color: '#e6bd2e' })).done();
  }),
  e('raindrop', 'nature', 'water', () =>
    m('raindrop').ball(0.06, [0, 0.03, 0], { color: '#5fb4f0' }).cone([0.057, 0.07, 0.057], [0, 0.085, 0], { color: '#5fb4f0' }).ball(0.014, [-0.012, 0.04, 0.026], { color: 'white', noInk: true }).done(),
  ),
  e('raisin', 'food', 'dried fruit', () => {
    const b = m('raisin').box([0.07, 0.09, 0.035], [-0.02, 0.045, 0], { color: 'red', round: 0.1 }).ball([0.035, 0.035, 0.005], [-0.02, 0.055, 0.018], { color: 'yellow', noInk: true });
    for (const [x, z] of [[0.04, 0.02], [0.065, -0.005], [0.03, 0.045], [0.06, 0.04]]) b.ball([0.02, 0.014, 0.017], [x, 0.007, z], { color: '#4a2a3a' });
    return b.ball([0.02, 0.014, 0.017], [0.05, 0.02, 0.025], { color: '#5a3045' }).done();
  }),
  e('rake', 'garden', 'garden tools', () => {
    const b = m('rake').stick([0, 0.12, 0], [0, 1.5, 0], 0.04, 'wood').box([0.5, 0.11, 0.11], [0, 0.12, 0], { color: 'darkwood', round: 0.2 });
    b.pair((s) => b.rod([s * 0.2, 0.15, 0], [0, 0.4, 0], 0.02, 'wood'));
    return b.each(10, (i) => b.stick([-0.22 + i * 0.049, 0.1, 0.02], [-0.22 + i * 0.049, 0.0, 0.07], 0.018, 'lightwood')).done();
  }),
  e('ramp', 'sports', 'skate park', () => {
    const b = m('ramp').wedge([3, 1, 1.6], [0, 0.5, 0], { color: 'wood', apex: 0.5 }).box([0.5, 1, 1.6], [1.75, 0.5, 0], { color: 'darkwood', round: 0.05 });
    b.each(3, (i) => b.rod([-1.45, 0.03, -0.5 + i * 0.5], [1.45, 1.0, -0.5 + i * 0.5], 0.06, 'yellow', { noInk: true }));
    return b.stick([2.0, 1.0, -0.8], [2.0, 1.0, 0.8], 0.06, 'steel').done();
  }),
  e('raspberry bush', 'garden', 'berry bushes', () => {
    const b = m('raspberry bush');
    b.each(5, (i) => b.rod([0, 0, 0], [(i - 2) * 0.22, 0.7, ((i % 3) - 1) * 0.15], 0.05, 'bark'));
    b.ball([1.3, 1.0, 1.1], [0, 0.85, 0], { color: 'leaf' }).ball([0.7, 0.6, 0.6], [0.35, 1.2, 0.05], { color: 'darkgreen' }).ball([0.7, 0.6, 0.6], [-0.35, 1.15, -0.05], { color: 'green' });
    b.each(16, (i) => b.ball(0.08, surf([0, 0.85, 0], [0.65, 0.5, 0.55], -110 + (i * 37) % 220, -20 + ((i * 23) % 60)), { color: '#c8243c' }));
    return b.done();
  }),
  e('rattle (baby)', 'toys', 'baby toys', () =>
    m('rattle (baby)')
      .ball(0.035, [0, 0.0175, 0], { color: 'cyan' })
      .capsule([0.022, 0.09, 0.022], [0, 0.065, 0], { color: 'yellow' })
      .ball(0.075, [0, 0.135, 0], { color: 'pink' })
      .torus([0.08, 0.08, 0.015], [0, 0.135, 0], { color: 'cyan', rot: [90, 0, 0], tube: 0.2 })
      .ball(0.022, [0, 0.175, 0], { color: 'yellow' })
      .done(),
  ),
  e('ravioli', 'food', 'pasta', () => {
    const b = plate(m('ravioli'), 0.24).ball([0.16, 0.012, 0.16], [0, 0.018, 0], { color: 'tomato', noInk: true });
    for (const [x, z] of around(4, 0.048, Math.PI / 4)) b.box([0.055, 0.016, 0.055], [x, 0.026, z], { color: '#f2d98a', round: 0.5, rot: [0, 20, 0] }).ball([0.035, 0.024, 0.035], [x, 0.03, z], { color: '#f2d98a' });
    return b.ball([0.03, 0.006, 0.018], [0, 0.04, 0], { color: 'leaf', rot: [0, 30, 0] }).done();
  }),
  e('razor', 'home', 'bathroom', () =>
    m('razor')
      .cyl([0.016, 0.1, 0.016], [0, 0.05, 0], { color: 'steel' })
      .cyl([0.019, 0.01, 0.019], [0, 0.005, 0], { color: 'silver' })
      .cyl([0.012, 0.01, 0.012], [0, 0.104, 0], { color: 'silver' })
      .box([0.055, 0.016, 0.022], [0, 0.116, 0], { color: 'silver', round: 0.4 })
      .box([0.058, 0.004, 0.026], [0, 0.116, 0], { color: 'lightgray', round: 0.1 })
      .done(),
  ),
  e('reactor', 'places', 'power plants', () =>
    m('reactor')
      .cyl([4, 3, 4], [-1.6, 1.5, -1], { color: 'lightgray', taper: 0.62 })
      .cyl([2.5, 2.6, 2.5], [-1.6, 4.3, -1], { color: 'lightgray', taper: 1.25 })
      .ball([2.4, 1.3, 2.4], [-1.6, 6.0, -1], { color: 'white' })
      .ball([1.6, 1.0, 1.6], [-1.0, 6.7, -1.1], { color: 'white' })
      .cyl([2.8, 2, 2.8], [2.0, 1.0, 1.0], { color: 'cream' })
      .ball([2.8, 2.4, 2.8], [2.0, 2.0, 1.0], { color: 'cream' })
      .box([2.6, 1.6, 1.6], [0.6, 0.8, 2.2], { color: 'gray', round: 0.05 })
      .cyl([0.9, 0.05, 0.9], [2.0, 1.2, 2.42], { color: 'yellow', rot: [90, 0, 0] })
      .cyl([0.25, 0.06, 0.25], [2.0, 1.2, 2.44], { color: 'black', rot: [90, 0, 0] })
      .done(),
  ),
  e('rear view mirror', 'garage', 'car parts', () =>
    m('rear view mirror')
      .box([0.26, 0.075, 0.04], [0, 0.04, 0], { color: 'black', round: 0.6 })
      .box([0.24, 0.058, 0.01], [0, 0.04, 0.02], { color: 'glass', round: 0.6 })
      .rod([0, 0.07, -0.01], [0, 0.17, -0.03], 0.016, 'black')
      .box([0.07, 0.03, 0.05], [0, 0.18, -0.03], { color: 'darkgray' })
      .done(),
  ),
  e('recliner', 'home', 'seating', () => {
    const c = '#7a4a2e';
    const b = m('recliner')
      .box([0.8, 0.32, 0.75], [0, 0.22, 0], { color: c, round: 0.4 })
      .box([0.6, 0.16, 0.62], [0, 0.42, 0.04], { color: '#8c5a38', round: 0.6 })
      .box([0.72, 0.8, 0.25], [0, 0.75, -0.36], { color: c, round: 0.5, rot: [-16, 0, 0] })
      .box([0.55, 0.2, 0.16], [0, 1.05, -0.4], { color: '#8c5a38', round: 0.7, rot: [-16, 0, 0] })
      .box([0.6, 0.12, 0.42], [0, 0.34, 0.56], { color: c, round: 0.5, rot: [8, 0, 0] });
    return b.pair((s) => b.box([0.16, 0.38, 0.8], [s * 0.42, 0.44, 0], { color: c, round: 0.6 })).done();
  }),
  e('record', 'music', 'audio', () =>
    m('record')
      .box([0.315, 0.315, 0.04], [-0.07, 0.158, -0.03], { color: 'purple', round: 0.05 })
      .ball([0.14, 0.14, 0.004], [-0.07, 0.17, -0.008], { color: 'yellow', noInk: true })
      .cyl([0.3, 0.006, 0.3], [0.06, 0.15, 0], { color: 'black', rot: [90, 0, 0] })
      .torus([0.24, 0.24, 0.004], [0.06, 0.15, 0.004], { color: 'darkgray', noInk: true, tube: 0.03 })
      .cyl([0.1, 0.008, 0.1], [0.06, 0.15, 0.002], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.012, 0.01, 0.012], [0.06, 0.15, 0.004], { color: 'white', rot: [90, 0, 0] })
      .done(),
  ),
  e('record store', 'places', 'shops', () =>
    bld('record store', 'RECORDS', { wall: 'purple', flat: true, roof: 'black', signBg: 'yellow' })
      .cyl([1.4, 0.1, 1.4], [0, 3.95, 1.0], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.5, 0.12, 0.5], [0, 3.95, 1.02], { color: 'red', rot: [90, 0, 0] })
      .done(),
  ),
  e('recovery vehicle', 'garage', 'trucks', () => {
    const b = m('recovery vehicle', { view: 'side' })
      .box([2.1, 0.5, 6.4], [0, 0.85, 0.3], { color: 'darkgray', round: 0.2 })
      .box([2.3, 1.5, 1.8], [0, 1.75, 2.0], { color: 'orange', round: 0.3 })
      .box([2.34, 0.6, 1.22], [0, 2.05, 2.32], { color: 'glass', round: 0.3 })
      .box([2.2, 0.9, 1.0], [0, 1.35, 3.3], { color: 'orange', round: 0.3 })
      .box([2.3, 0.35, 3.6], [0, 1.25, -1.2], { color: 'orange', round: 0.2 })
      .rod([0, 1.5, -0.4], [0, 3.1, -2.6], 0.28, 'yellow')
      .stick([0, 3.1, -2.6], [0, 1.95, -2.75], 0.04, 'black')
      .torus([0.3, 0.3, 0.08], [0, 1.8, -2.75], { color: 'steel', rot: [0, 90, 0] })
      .box([1.4, 0.16, 0.3], [0, 2.58, 2.0], { color: 'orange', glow: true });
    return wheels(b, [2.8, -1.3, -2.4], 1.0, 1.0).done();
  }),
  e('rectangle', 'ideas', 'shapes', () => plinth(m('rectangle'), 0.12).box([0.16, 0.09, 0.02], [0, 0.07, 0], { color: 'blue', round: 0.05 }).done()),
  e('recycle sign', 'ideas', 'symbols', () =>
    recycleMark(m('recycle sign').box([0.8, 0.12, 0.3], [0, 0.06, 0], { color: 'gray' }).box([1.15, 1.1, 0.04], [0, 0.66, -0.06], { color: 'white', round: 0.15 }), [0, 0.62, 0], 1.0).done(),
  ),
  e('recycling bin', 'home', 'bins', () => {
    const b = m('recycling bin')
      .box([0.58, 0.92, 0.7], [0, 0.5, 0], { color: 'blue', round: 0.12 })
      .box([0.62, 0.07, 0.76], [0, 0.99, 0], { color: 'navy', name: 'lid', pivot: [0, 0.99, -0.38] })
      .box([0.4, 0.05, 0.05], [0, 0.99, 0.39], { color: 'navy', parent: 'lid' })
      .stick([-0.25, 0.9, -0.38], [0.25, 0.9, -0.38], 0.04, 'black');
    recycleMark(b, [0, 0.55, 0.355], 0.32, 'white', true);
    return b.pair((s) => b.torus([0.22, 0.22, 0.08], [s * 0.3, 0.11, -0.3], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 })).done();
  }),
  e('recycling plant', 'places', 'factories', () => {
    const b = m('recycling plant')
      .box([7, 4, 5], [0, 2, 0], { color: '#7fa58a', round: 0.03 })
      .box([7.2, 0.3, 5.2], [0, 4.15, 0], { color: 'darkgray', round: 0.1 })
      .cyl([0.8, 4, 0.8], [2.5, 6.2, -1.5], { color: 'gray' })
      .box([2.4, 2.2, 0.08], [-1.8, 1.1, 2.52], { color: 'darkgray', round: 0.05 })
      .label('RECYCLING', [3.2, 0.6], [1.4, 3.3, 2.56], { color: 'white' })
      .rod([-1.8, 0.4, 3.4], [-1.8, 2.0, 2.4], 0.4, 'black');
    recycleMark(b, [1.4, 1.6, 2.56], 1.2, 'green');
    b.box([0.8, 0.8, 0.8], [-3.0, 0.4, 3.4], { color: 'blue' }).box([0.8, 0.8, 0.8], [-2.1, 0.4, 3.6], { color: 'green' }).box([0.8, 0.8, 0.8], [-2.6, 1.2, 3.5], { color: 'yellow' });
    return b.done();
  }),
  e('red button', 'tech', 'buttons', () =>
    m('red button')
      .cyl([0.13, 0.035, 0.13], [0, 0.0175, 0], { color: 'darkgray' })
      .cyl([0.11, 0.012, 0.11], [0, 0.04, 0], { color: 'yellow' })
      .cyl([0.08, 0.025, 0.08], [0, 0.055, 0], { color: 'red' })
      .ball([0.08, 0.045, 0.08], [0, 0.066, 0], { color: 'red' })
      .ball([0.02, 0.01, 0.02], [-0.015, 0.088, 0.015], { color: 'white', noInk: true })
      .done(),
  ),
  e('red cap', 'wardrobe', 'hats', () =>
    m('red cap')
      .cyl([0.2, 0.07, 0.22], [0, 0.035, 0], { color: 'red' })
      .ball([0.2, 0.16, 0.22], [0, 0.07, 0], { color: 'red' })
      .ball([0.2, 0.02, 0.17], [0, 0.012, 0.13], { color: 'red' })
      .ball(0.025, [0, 0.15, 0], { color: 'red' })
      .ball([0.05, 0.04, 0.01], [0, 0.07, 0.11], { color: 'white', noInk: true })
      .done(),
  ),
  e('red switch', 'tech', 'buttons', () =>
    m('red switch')
      .box([0.1, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray', round: 0.3 })
      .cyl([0.035, 0.015, 0.035], [0, 0.035, 0], { color: 'silver' })
      .rod([0, 0.035, 0], [0, 0.085, 0.025], 0.016, 'red')
      .ball(0.024, [0, 0.088, 0.027], { color: 'red' })
      .done(),
  ),
  e('redwood', 'garden', 'trees', () =>
    m('redwood')
      .cyl([0.6, 2.8, 0.6], [0, 1.4, 0], { color: '#9a4a2a', taper: 0.45 })
      .cyl([0.75, 0.15, 0.75], [0, 0.07, 0], { color: '#8a4024' })
      .cone([1.5, 1.3, 1.5], [0, 2.0, 0], { color: 'darkgreen' })
      .cone([1.2, 1.2, 1.2], [0, 2.7, 0], { color: '#2f6a34' })
      .cone([0.8, 1.1, 0.8], [0, 3.35, 0], { color: 'darkgreen' })
      .done(),
  ),
  e('reed (music)', 'music', 'wind instruments', () =>
    m('reed (music)')
      .box([0.028, 0.06, 0.01], [0, 0.03, 0], { color: '#d8b46a', round: 0.3 })
      .box([0.028, 0.032, 0.005], [0, 0.074, 0.0025], { color: '#efd9a0', round: 0.3 })
      .ball([0.028, 0.014, 0.005], [0, 0.088, 0.0025], { color: '#efd9a0' })
      .done(),
  ),
  e('reef', 'sea', 'coral', () => {
    const b = m('reef').ball([1.5, 0.7, 1.1], [0, 0.18, 0], { color: '#9a8f86' }).ball([0.7, 0.5, 0.6], [-0.35, 0.4, -0.15], { color: '#8a8078' });
    for (const [x, z, h] of [[-0.45, 0.15, 0.95], [-0.25, 0.05, 0.85], [-0.6, -0.05, 0.8]]) b.rod([x, 0.45, z], [x - 0.08, h, z + 0.04], 0.07, 'pink').rod([x - 0.03, 0.62, z], [x + 0.1, h - 0.08, z], 0.06, 'pink');
    b.ball([0.36, 0.28, 0.34], [0.3, 0.5, 0.18], { color: '#e8a05a' }).box([0.45, 0.45, 0.04], [0.1, 0.78, -0.25], { color: 'purple', round: 0.9 });
    b.each(4, (i) => b.cyl([0.09, 0.25 + i * 0.06, 0.09], [0.45 + (i % 2) * 0.1, 0.5 + i * 0.03, -0.1 + i * 0.06], { color: 'orange' }));
    b.each(6, (i) => b.capsule([0.03, 0.12, 0.03], [0.05 + (i - 2.5) * 0.04, 0.55, 0.38], { color: 'lime', rot: [0, 0, (i - 2.5) * 15] }));
    return b.ball([0.14, 0.09, 0.05], [0.0, 1.0, 0.25], { color: 'yellow' }).cone([0.06, 0.07, 0.03], [-0.08, 1.0, 0.25], { color: 'yellow', rot: [0, 0, 90] }).done();
  }),
  e('reflector', 'garage', 'bike parts', () =>
    m('reflector')
      .box([0.1, 0.012, 0.04], [0, 0.006, 0], { color: 'black' })
      .stick([0, 0, 0], [0, 0.05, -0.005], 0.012, 'black')
      .cyl([0.085, 0.018, 0.085], [0, 0.07, 0], { color: 'red', rot: [90, 0, 0], segs: 6 })
      .torus([0.06, 0.06, 0.004], [0, 0.07, 0.01], { color: 'darkred', noInk: true, tube: 0.1 })
      .torus([0.03, 0.03, 0.004], [0, 0.07, 0.01], { color: 'darkred', noInk: true, tube: 0.15 })
      .done(),
  ),
  e('refrigerator', 'kitchen', 'appliances', () =>
    m('refrigerator')
      .box([0.75, 1.72, 0.66], [0, 0.88, -0.02], { color: 'white', round: 0.12 })
      .box([0.72, 0.42, 0.05], [0, 1.48, 0.33], { color: 'white', round: 0.2 })
      .box([0.72, 1.18, 0.05], [0, 0.66, 0.33], { color: 'white', round: 0.2, name: 'door', pivot: [-0.36, 0.66, 0.33] })
      .box([0.04, 0.4, 0.04], [0.29, 0.95, 0.38], { color: 'silver', parent: 'door' })
      .box([0.04, 0.22, 0.04], [0.29, 1.42, 0.38], { color: 'silver' })
      .ball([0.05, 0.05, 0.015], [-0.15, 1.52, 0.36], { color: 'red', noInk: true })
      .ball([0.04, 0.04, 0.015], [-0.05, 1.45, 0.36], { color: 'blue', noInk: true })
      .box([0.06, 0.08, 0.01], [-0.2, 1.0, 0.36], { color: 'yellow', noInk: true, rot: [0, 0, 8] })
      .done(),
  ),
  e('rehabilitation center', 'places', 'hospitals', () => {
    const b = bld('rehabilitation center', 'REHAB CENTER', { w: 6, h: 3.6, wall: 'cream', flat: true, roof: 'teal', win: 'skyblue' });
    return b.box([0.25, 0.8, 0.06], [2.3, 2.6, 1.56], { color: 'green' }).box([0.8, 0.25, 0.06], [2.3, 2.6, 1.56], { color: 'green' }).wedge([1.8, 0.25, 1.0], [-1.6, 0.125, 2.0], { color: 'lightgray', apex: 0.5 }).done();
  }),
  e('rein', 'farm', 'horse tack', () => horseBust('rein', true).done()),
  e('reins', 'farm', 'horse tack', () => horseBust('reins', false).done()),
  e('relish', 'food', 'condiments', () => {
    const b = jar('relish', '#7aa53a', 'red').ball([0.03, 0.03, 0.005], [0, 0.052, 0.042], { color: 'green', noInk: true });
    return b.each(6, (i) => b.ball(0.01, surf([0, 0.1, 0], [0.04, 0.01, 0.04], -60 + i * 24, 0), { color: '#c9d86a', noInk: true })).done();
  }),
  e('remote', 'tech', 'gadgets', () => {
    const b = m('remote').box([0.055, 0.2, 0.025], [0, 0.1, 0], { color: 'black', round: 0.4 }).cyl([0.016, 0.006, 0.016], [-0.012, 0.18, 0.013], { color: 'red', rot: [90, 0, 0] });
    b.cyl([0.03, 0.006, 0.03], [0, 0.145, 0.013], { color: 'gray', rot: [90, 0, 0] });
    for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) b.cyl([0.01, 0.005, 0.01], [c * 0.015, 0.035 + r * 0.02, 0.013], { color: 'lightgray', rot: [90, 0, 0], noInk: true });
    return b.done();
  }),
  e('remote controlled aircraft', 'toys', 'rc toys', () =>
    m('remote controlled aircraft')
      .capsule([0.12, 1.0, 0.13], [0, 0.5, 0], { color: 'red', rot: [90, 0, 0] })
      .box([1.5, 0.03, 0.26], [0, 0.54, 0.1], { color: 'white', round: 0.5 })
      .box([0.5, 0.025, 0.12], [0, 0.52, -0.44], { color: 'white', round: 0.5 })
      .box([0.025, 0.18, 0.14], [0, 0.61, -0.46], { color: 'red', round: 0.4 })
      .box([0.12, 0.06, 0.08], [0, 0.57, 0.18], { color: 'glass', round: 0.6 })
      .cone([0.07, 0.07, 0.07], [0, 0.5, 0.56], { color: 'yellow', rot: [90, 0, 0] })
      .box([0.32, 0.035, 0.012], [0, 0.5, 0.58], { color: 'black', name: 'fan' })
      .done(),
  ),
  e('remote controlled car', 'toys', 'rc toys', () => {
    const b = m('remote controlled car', { view: 'side' })
      .box([0.2, 0.06, 0.38], [0, 0.07, 0], { color: 'darkgray', round: 0.3 })
      .box([0.16, 0.06, 0.24], [0, 0.12, 0.02], { color: 'lime', round: 0.6 })
      .box([0.1, 0.04, 0.08], [0, 0.16, -0.02], { color: 'black', round: 0.5 })
      .box([0.24, 0.015, 0.06], [0, 0.17, -0.2], { color: 'lime' })
      .stick([0.05, 0.1, -0.1], [0.05, 0.32, -0.12], 0.006, 'black');
    b.pair((s) => b.stick([s * 0.07, 0.11, -0.18], [s * 0.07, 0.17, -0.2], 0.012, 'black'));
    return wheels(b, [0.13, -0.13], 0.12, 0.12, 'yellow').done();
  }),
  e('remote controlled helicopter', 'toys', 'rc toys', () => {
    const b = m('remote controlled helicopter')
      .ball([0.12, 0.12, 0.22], [0, 0.11, 0.04], { color: 'blue' })
      .ball([0.09, 0.07, 0.08], [0, 0.13, 0.11], { color: 'glass' })
      .rod([0, 0.12, -0.05], [0, 0.14, -0.3], 0.025, 'blue')
      .box([0.01, 0.07, 0.05], [0, 0.17, -0.3], { color: 'yellow' })
      .box([0.09, 0.006, 0.012], [0.012, 0.15, -0.3], { color: 'black', rot: [0, 0, 60] })
      .stick([0, 0.17, 0.03], [0, 0.21, 0.03], 0.012, 'black')
      .box([0.5, 0.008, 0.03], [0, 0.215, 0.03], { color: 'black', name: 'rotor' });
    return b.pair((s) => b.stick([s * 0.06, 0.008, -0.08], [s * 0.06, 0.008, 0.14], 0.01, 'black').stick([s * 0.06, 0.008, 0.06], [s * 0.03, 0.07, 0.06], 0.008, 'black').stick([s * 0.06, 0.008, -0.03], [s * 0.03, 0.07, -0.03], 0.008, 'black')).done();
  }),
  e('rescue helicopter', 'garage', 'aircraft', () => {
    const b = m('rescue helicopter', { view: 'side' })
      .ball([1.8, 1.8, 4.0], [0, 1.45, 0.4], { color: 'red' })
      .ball([1.6, 1.0, 1.4], [0, 1.65, 1.7], { color: 'glass' })
      .box([1.84, 0.3, 2.6], [0, 1.0, 0.3], { color: 'white', round: 0.6 })
      .cyl([0.7, 4.0, 0.7], [0, 1.75, -3.0], { color: 'red', rot: [-88, 0, 0], taper: 0.4 })
      .box([0.12, 1.2, 0.8], [0, 2.2, -4.9], { color: 'red', round: 0.4, rot: [-20, 0, 0] })
      .cyl([0.9, 0.06, 0.9], [0.12, 2.3, -4.95], { color: 'darkgray', rot: [0, 0, 90] })
      .box([0.35, 0.8, 0.04], [0.93, 1.5, 0.2], { color: 'white' })
      .box([0.8, 0.35, 0.04], [0.93, 1.5, 0.2], { color: 'white' })
      .stick([0, 2.3, 0.3], [0, 2.65, 0.3], 0.18, 'darkgray')
      .box([8, 0.06, 0.3], [0, 2.7, 0.3], { color: 'darkgray', name: 'rotor' });
    return b.pair((s) => b.stick([s * 0.7, 0.05, -1.0], [s * 0.7, 0.05, 1.8], 0.08, 'darkgray').stick([s * 0.7, 0.05, 1.0], [s * 0.5, 0.6, 1.0], 0.06, 'darkgray').stick([s * 0.7, 0.05, -0.4], [s * 0.5, 0.6, -0.4], 0.06, 'darkgray')).done();
  }),
  e('respirator', 'workshop', 'safety gear', () =>
    m('respirator')
      .ball([0.2, 0.24, 0.13], [0, 0.17, 0], { color: '#5a6148' })
      .torus([0.21, 0.25, 0.03], [0, 0.17, -0.04], { color: 'black', tube: 0.08 })
      .cyl([0.065, 0.02, 0.065], [0.05, 0.2, 0.06], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.065, 0.02, 0.065], [-0.05, 0.2, 0.06], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.05, 0.022, 0.05], [0.05, 0.2, 0.065], { color: 'glass', rot: [90, 0, 0] })
      .cyl([0.05, 0.022, 0.05], [-0.05, 0.2, 0.065], { color: 'glass', rot: [90, 0, 0] })
      .cyl([0.09, 0.08, 0.09], [0, 0.055, 0.07], { color: 'darkgray', rot: [70, 0, 0] })
      .cyl([0.07, 0.01, 0.07], [0, 0.04, 0.11], { color: 'black', rot: [70, 0, 0] })
      .done(),
  ),
  e('restaurant', 'places', 'restaurants', () => {
    const b = bld('restaurant', 'RESTAURANT', { w: 5, wall: 'cream', roof: 'darkred', signBg: 'white' });
    b.each(7, (i) => b.box([0.7, 0.08, 0.9], [-2.1 + i * 0.7, 2.0, 1.95], { color: i % 2 ? 'white' : 'red', rot: [25, 0, 0], round: 0.1 }));
    return b.cyl([0.7, 0.05, 0.7], [1.6, 0.75, 2.4], { color: 'white' }).stick([1.6, 0, 2.4], [1.6, 0.75, 2.4], 0.07, 'darkgray').done();
  }),
  e('restricted area sign', 'ideas', 'warning signs', () => {
    const b = m('restricted area sign').box([0.9, 0.5, 0.07], [0, 0.6, 0], { color: 'white', round: 0.1 }).box([0.9, 0.16, 0.075], [0, 0.78, 0.005], { color: 'red', round: 0.1 });
    b.label('DANGER', [0.6, 0.11], [0, 0.78, 0.045], { color: 'red' }).label('RESTRICTED AREA', [0.8, 0.22], [0, 0.53, 0.04], { color: 'white' });
    return b.pair((s) => b.stick([s * 0.35, 0, -0.05], [s * 0.35, 0.82, -0.05], 0.05, 'gray')).done();
  }),
  e('retro glasses', 'wardrobe', 'glasses', () => {
    const b = m('retro glasses').box([0.05, 0.018, 0.012], [0, 0.05, 0.07], { color: 'black', round: 0.4 });
    b.pair((s) => {
      b.box([0.06, 0.045, 0.014], [s * 0.042, 0.042, 0.07], { color: 'black', round: 0.45 });
      b.box([0.046, 0.032, 0.006], [s * 0.042, 0.041, 0.078], { color: '#2b3a44', round: 0.5 });
      b.rod([s * 0.07, 0.055, 0.065], [s * 0.072, 0.004, -0.07], 0.007, 'black');
    });
    return b.done();
  }),
  e('revolver', 'armory', 'guns', () =>
    m('revolver', { view: 'side' })
      .cyl([0.018, 0.13, 0.018], [0, 0.13, 0.11], { color: 'steel', rot: [90, 0, 0] })
      .box([0.012, 0.012, 0.012], [0, 0.144, 0.17], { color: 'steel' })
      .cyl([0.045, 0.045, 0.045], [0, 0.12, 0.02], { color: 'iron', rot: [90, 0, 0] })
      .box([0.025, 0.04, 0.08], [0, 0.125, -0.02], { color: 'steel', round: 0.3 })
      .rod([0, 0.11, -0.05], [0, 0.03, -0.09], 0.035, 'darkwood')
      .torus([0.04, 0.035, 0.008], [0, 0.085, 0.0], { color: 'steel', rot: [0, 90, 0], tube: 0.2 })
      .rod([0, 0.145, -0.05], [0, 0.16, -0.07], 0.01, 'steel')
      .done(),
  ),
  e('revolving door', 'home', 'doors', () => {
    const b = m('revolving door').cyl([2.2, 0.08, 2.2], [0, 0.04, 0], { color: 'darkgray' }).cyl([2.3, 0.35, 2.3], [0, 2.25, 0], { color: 'metal' }).stick([0, 0, 0], [0, 2.1, 0], 0.1, 'metal');
    b.box([2.0, 2.0, 0.05], [0, 1.08, 0], { color: 'glass', name: 'rotor' }).box([0.05, 2.0, 2.0], [0, 1.08, 0], { color: 'glass', parent: 'rotor' });
    for (const a of [-30, 0, 30]) b.pair((s) => b.box([0.55, 2.1, 0.05], [s * 1.08 * Math.cos(a * D2R), 1.1, 1.08 * Math.sin(a * D2R)], { color: 'steel', rot: [0, s * (90 - a), 0] }));
    return b.label('ENTRANCE', [1.2, 0.22], [0, 2.25, 1.16], { color: 'navy' }).done();
  }),
  e('reservoir', 'places', 'waterworks', () =>
    m('reservoir')
      .cyl([7, 2.2, 5], [0, 1.1, -0.4], { color: 'grass', taper: 0.88 })
      .cyl([5.6, 0.12, 3.8], [0, 2.2, -0.5], { color: 'water' })
      .box([3.2, 2.5, 0.6], [0, 1.25, 2.0], { color: 'stone', round: 0.06 })
      .box([3.4, 0.18, 0.8], [0, 2.55, 2.0], { color: 'lightgray', round: 0.2 })
      .box([0.9, 2.2, 0.1], [0, 1.15, 2.33], { color: '#7fc4ef', noInk: true })
      .ball([2.4, 0.3, 1.0], [0, 0.1, 2.8], { color: 'water' })
      .box([0.6, 0.7, 0.6], [1.1, 2.95, 2.0], { color: 'cream', round: 0.1 })
      .wedge([0.8, 0.35, 0.8], [1.1, 3.47, 2.0], { color: 'darkred' })
      .done(),
  ),
  e('rhombus (shape)', 'ideas', 'shapes', () =>
    plinth(m('rhombus (shape)'))
      .wedge([0.1, 0.075, 0.025], [0, 0.1375, 0], { color: 'purple' })
      .wedge([0.1, 0.075, 0.025], [0, 0.0625, 0], { color: 'purple', rot: [0, 0, 180] })
      .done(),
  ),
  e('rhubarb pie', 'food', 'pies', () => {
    const b = m('rhubarb pie')
      .cyl([0.22, 0.04, 0.22], [0, 0.02, 0], { color: 'silver', taper: 1.12 })
      .cyl([0.22, 0.02, 0.22], [0, 0.045, 0], { color: '#c0405a' })
      .torus([0.25, 0.25, 0.03], [0, 0.05, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.12 });
    b.each(3, (i) => b.box([0.22 - Math.abs(i - 1) * 0.06, 0.012, 0.025], [0, 0.058, (i - 1) * 0.06], { color: 'bread', round: 0.5 }));
    return b.each(3, (i) => b.box([0.025, 0.014, 0.22 - Math.abs(i - 1) * 0.06], [(i - 1) * 0.06, 0.062, 0], { color: 'bread', round: 0.5 })).done();
  }),
  e('ribbon', 'toys', 'party things', () => {
    const b = m('ribbon').ball([0.08, 0.08, 0.07], [0, 0.26, 0.02], { color: 'red' });
    b.pair((s) => {
      b.ball([0.17, 0.12, 0.07], [s * 0.1, 0.29, 0], { color: 'red', rot: [0, 0, s * 20] });
      b.ball([0.08, 0.05, 0.02], [s * 0.1, 0.29, 0.03], { color: 'darkred', noInk: true, rot: [0, 0, s * 20] });
      b.box([0.06, 0.24, 0.02], [s * 0.06, 0.14, 0.01], { color: 'red', rot: [0, 0, s * 18], round: 0.2 });
      b.wedge([0.06, 0.04, 0.02], [s * 0.1, 0.04, 0.012], { color: 'red', rot: [0, 0, 180 + s * 18] });
    });
    return b.done();
  }),
  e('ribcage', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('ribcage').capsule([0.045, 0.44, 0.045], [0, 0.22, -0.1], { color: bone });
    b.each(8, (i) => b.box([0.06, 0.02, 0.035], [0, 0.03 + i * 0.05, -0.115], { color: bone, round: 0.5 }));
    b.each(7, (i) => {
      const w = 0.2 + 0.12 * Math.sin(((i + 1.2) / 8) * Math.PI);
      b.torus([w, w * 0.7, 0.018], [0, 0.1 + i * 0.042, -0.1 + w * 0.35], { color: bone, rot: [100, 0, 0], tube: 0.13 });
    });
    b.box([0.04, 0.2, 0.025], [0, 0.29, 0.06], { color: bone, round: 0.4, rot: [-8, 0, 0] });
    return b.pair((s) => b.rod([s * 0.02, 0.42, 0.04], [s * 0.15, 0.43, -0.04], 0.02, bone)).done();
  }),
  e('rice', 'food', 'grains', () => {
    const b = bowl(m('rice'), 0.15, 'navy', 'white');
    b.torus([0.15, 0.15, 0.008], [0, 0.04, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06, noInk: true });
    return b.stick([-0.05, 0.065, 0.06], [0.04, 0.12, -0.1], 0.008, 'darkwood').stick([-0.03, 0.065, 0.07], [0.06, 0.12, -0.09], 0.008, 'darkwood').done();
  }),
  e('rice cake', 'food', 'snacks', () => {
    const b = m('rice cake');
    b.each(3, (i) => b.cyl([0.1, 0.02, 0.1], [i * 0.006, 0.011 + i * 0.022, i * 0.004], { color: i === 2 ? '#f3e7c6' : '#e9d9ae', rot: [0, 0, i === 2 ? 4 : 0] }));
    return b.each(8, (i) => b.ball(0.012, [Math.cos(i * 2.4) * 0.03 + 0.012, 0.067, Math.sin(i * 2.4) * 0.03], { color: '#d9c48e', noInk: true })).done();
  }),
  e('rice cooker', 'kitchen', 'appliances', () =>
    m('rice cooker')
      .cyl([0.28, 0.16, 0.26], [0, 0.08, 0], { color: 'white' })
      .ball([0.28, 0.12, 0.26], [0, 0.16, 0], { color: 'white', name: 'lid', pivot: [0, 0.17, -0.13] })
      .cyl([0.03, 0.02, 0.03], [0.04, 0.22, 0.0], { color: 'darkgray', parent: 'lid' })
      .box([0.1, 0.025, 0.03], [0, 0.23, -0.06], { color: 'gray', parent: 'lid', round: 0.5 })
      .box([0.1, 0.06, 0.03], [0, 0.07, 0.125], { color: 'darkgray', round: 0.3 })
      .ball(0.014, [-0.025, 0.07, 0.142], { color: 'red', glow: true })
      .ball(0.014, [0.025, 0.07, 0.142], { color: 'lime', glow: true })
      .done(),
  ),
  e('rickshaw', 'garage', 'cars', () => {
    const b = m('rickshaw', { view: 'side' })
      .box([1.3, 0.55, 1.7], [0, 0.6, -0.3], { color: 'green', round: 0.3 })
      .box([0.7, 0.9, 0.5], [0, 0.85, 0.85], { color: 'green', round: 0.4 })
      .box([1.4, 0.12, 2.3], [0, 1.65, -0.1], { color: 'black', round: 0.4 })
      .box([1.32, 0.75, 0.06], [0, 1.25, 0.75], { color: 'glass' })
      .box([0.9, 0.35, 0.6], [0, 1.0, -0.6], { color: 'darkred', round: 0.4 })
      .box([1.3, 0.75, 0.08], [0, 1.25, -1.15], { color: 'yellow', round: 0.2 })
      .stick([0, 1.2, 0.8], [0, 1.25, 0.5], 0.04, 'black')
      .box([0.6, 0.04, 0.04], [0, 1.25, 0.5], { color: 'black' })
      .ball([0.2, 0.15, 0.08], [0, 1.0, 1.12], { color: 'yellow', glow: true });
    b.pair((s) => b.stick([s * 0.64, 1.0, 0.72], [s * 0.64, 1.62, 0.72], 0.04, 'black'));
    b.torus([0.45, 0.45, 0.16], [0, 0.225, 1.0], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    return wheels(b, [-0.75], 0.62, 0.45).done();
  }),
  e('ricotta', 'food', 'cheese', () => {
    const b = m('ricotta').cyl([0.14, 0.07, 0.14], [0, 0.035, 0], { color: 'white', taper: 1.1 }).cyl([0.155, 0.025, 0.155], [0, 0.04, 0], { color: 'skyblue' });
    b.ball([0.14, 0.04, 0.14], [0, 0.07, 0], { color: 'milk' });
    for (const [x, z, r] of [[0, 0, 0.06], [0.035, 0.02, 0.045], [-0.035, -0.01, 0.045], [0.01, -0.035, 0.04]]) b.ball(r, [x, 0.08 + r * 0.2, z], { color: 'milk' });
    return b.cyl([0.16, 0.012, 0.16], [0.13, 0.006, 0.04], { color: 'skyblue' }).done();
  }),
  e('riding mower', 'garden', 'garden machines', () => {
    const b = m('riding mower', { view: 'side' })
      .box([0.9, 0.35, 1.5], [0, 0.45, 0], { color: 'darkgreen', round: 0.3 })
      .box([0.7, 0.35, 0.6], [0, 0.6, 0.55], { color: 'green', round: 0.4 })
      .box([1.1, 0.12, 0.9], [0, 0.18, 0.1], { color: 'darkgray', round: 0.3 })
      .box([0.45, 0.1, 0.4], [0, 0.68, -0.35], { color: 'black', round: 0.5 })
      .box([0.45, 0.35, 0.1], [0, 0.88, -0.58], { color: 'black', round: 0.5, rot: [-12, 0, 0] })
      .rod([0, 0.75, 0.3], [0, 1.0, 0.15], 0.04, 'black')
      .torus([0.3, 0.3, 0.04], [0, 1.02, 0.14], { color: 'black', rot: [70, 0, 0], tube: 0.18 })
      .ball([0.12, 0.08, 0.05], [0, 0.6, 0.86], { color: 'yellow', glow: true });
    wheels(b, [-0.45], 0.42, 0.62, 'yellow');
    return wheels(b, [0.55], 0.36, 0.36, 'yellow', false).done();
  }),
  e('rifle', 'armory', 'guns', () =>
    m('rifle', { view: 'side' })
      .cyl([0.03, 0.75, 0.03], [0, 0.36, 0.38], { color: 'iron', rot: [88, 0, 0] })
      .box([0.06, 0.08, 0.5], [0, 0.33, 0.12], { color: 'darkwood', round: 0.4, rot: [-2, 0, 0] })
      .box([0.055, 0.07, 0.25], [0, 0.36, -0.08], { color: 'iron', round: 0.3 })
      .cyl([0.05, 0.3, 0.05], [0, 0.43, -0.05], { color: 'black', rot: [90, 0, 0] })
      .box([0.11, 0.16, 0.38], [0, 0.26, -0.36], { color: 'darkwood', round: 0.4, rot: [-12, 0, 0] })
      .torus([0.07, 0.06, 0.012], [0, 0.29, -0.06], { color: 'iron', rot: [0, 90, 0], tube: 0.2 })
      .stick([0.0, 0.33, 0.45], [0.12, 0.0, 0.5], 0.02, 'black')
      .stick([0.0, 0.33, 0.45], [-0.12, 0.0, 0.5], 0.02, 'black')
      .done(),
  ),
  e('ring', 'wardrobe', 'jewellery', () =>
    m('ring')
      .box([0.065, 0.035, 0.06], [0, 0.0175, 0], { color: 'darkred', round: 0.3 })
      .box([0.065, 0.05, 0.015], [0, 0.045, -0.04], { color: 'darkred', round: 0.3, rot: [-25, 0, 0], name: 'lid', pivot: [0, 0.035, -0.03] })
      .box([0.045, 0.012, 0.04], [0, 0.036, 0], { color: 'cream', round: 0.5 })
      .torus([0.026, 0.026, 0.007], [0, 0.05, 0], { color: 'gold', tube: 0.2 })
      .cone([0.014, 0.01, 0.014], [0, 0.068, 0], { color: 'white', rot: [180, 0, 0] })
      .cyl([0.014, 0.005, 0.014], [0, 0.075, 0], { color: 'ice', taper: 0.6 })
      .done(),
  ),
  e('riot gear', 'armory', 'armour', () => who('riot gear', { top: 'black', bottom: 'black', shoes: 'black', long: true, build: 1.25, acc: [hat('helmet', 'black'), face('goggles', 'darkgray'), wear('armor', '#3a3f45'), held('shield', 'glass', 'L'), held('baton', 'black')] })),
  e('riot shield', 'armory', 'shields', () =>
    m('riot shield')
      .box([0.62, 1.2, 0.09], [0, 0.62, 0], { color: '#bfe3f2', round: 0.15 })
      .torus([0.66, 1.26, 0.1], [0, 0.62, 0], { color: 'black', tube: 0.05 })
      .label('POLICE', [0.4, 0.12], [0, 0.95, 0.05], { color: 'white' })
      .box([0.5, 0.14, 0.04], [0, 0.95, 0.04], { color: 'white', round: 0.3 })
      .box([0.15, 0.06, 0.08], [0, 0.6, -0.07], { color: 'black' })
      .done(),
  ),
  e('roach motel', 'home', 'pest control', () =>
    m('roach motel')
      .box([0.12, 0.06, 0.08], [0, 0.03, 0], { color: 'yellow', round: 0.1 })
      .wedge([0.13, 0.04, 0.09], [0, 0.08, 0], { color: 'red' })
      .box([0.025, 0.025, 0.01], [-0.03, 0.02, 0.041], { color: 'black' })
      .box([0.025, 0.025, 0.01], [0.03, 0.02, 0.041], { color: 'black' })
      .ball([0.02, 0.012, 0.035], [0.03, 0.008, 0.06], { color: 'darkbrown' })
      .rod([0.025, 0.01, 0.076], [0.015, 0.02, 0.095], 0.003, 'darkbrown')
      .rod([0.035, 0.01, 0.076], [0.045, 0.02, 0.095], 0.003, 'darkbrown')
      .done(),
  ),
  e('road', 'places', 'streets', () => {
    const b = m('road').box([2.4, 0.16, 1.4], [0, 0.08, 0], { color: '#4a4c50', round: 0.05 });
    b.pair((s) => b.box([2.4, 0.2, 0.45], [0, 0.1, s * 0.92], { color: 'grass', round: 0.1 }).box([2.4, 0.01, 0.05], [0, 0.163, s * 0.6], { color: 'white', noInk: true }));
    return b.each(4, (i) => b.box([0.35, 0.01, 0.06], [-0.9 + i * 0.6, 0.163, 0], { color: 'yellow', noInk: true })).done();
  }),
  e('road sign', 'ideas', 'road signs', () => postSign('road sign', '!', { h: 1.0, w: 0.6, bh: 0.52, bg: 'white', shape: 'tri', edge: 'red' }).done()),
  e('roadblock', 'workshop', 'road works', () => {
    const b = m('roadblock').box([1.8, 0.45, 0.35], [0, 0.225, 0], { color: 'lightgray', round: 0.1 }).box([1.8, 0.25, 0.2], [0, 0.55, 0], { color: 'lightgray', round: 0.15 });
    b.pair((s) => b.stick([s * 0.7, 0.6, 0], [s * 0.7, 1.1, 0], 0.05, 'white'));
    b.box([1.7, 0.22, 0.05], [0, 1.0, 0.03], { color: 'white', round: 0.1 });
    b.each(5, (i) => b.box([0.12, 0.3, 0.01], [-0.6 + i * 0.3, 1.0, 0.06], { color: 'orange', rot: [0, 0, 40], noInk: true }));
    return b.cyl([0.14, 0.1, 0.14], [0.7, 1.17, 0], { color: 'orange', glow: true }).done();
  }),
  e('roadwork sign', 'ideas', 'road signs', () => {
    const b = postSign('roadwork sign', 'ROAD WORK', { h: 1.4, w: 0.85, bg: 'orange', shape: 'diamond' });
    return b.ball(0.07, [0, 1.13, 0.05], { color: 'black' }).rod([0, 1.07, 0.05], [0.02, 0.92, 0.05], 0.05, 'black').rod([0.02, 0.92, 0.05], [-0.06, 0.8, 0.05], 0.04, 'black').rod([0.0, 1.04, 0.05], [0.12, 0.95, 0.05], 0.03, 'black').done();
  }),
  e('roast beef', 'food', 'meat', () => {
    const b = m('roast beef').cyl([0.34, 0.02, 0.24], [0, 0.01, 0], { color: 'white' })
      .ball([0.22, 0.13, 0.15], [-0.03, 0.08, -0.01], { color: '#6b3a22' })
      .ball([0.13, 0.11, 0.02], [0.06, 0.08, 0.04], { color: '#c9606a', rot: [0, 50, 0] });
    b.each(2, (i) => b.cyl([0.1, 0.012, 0.08], [0.1, 0.04 + i * 0.01, 0.06 - i * 0.015], { color: '#d06a70', rot: [70, 0, 0] }));
    return b.rod([-0.12, 0.05, 0.06], [-0.07, 0.07, 0.08], 0.012, 'darkgreen').done();
  }),
  e('robe', 'wardrobe', 'nightwear', () => {
    const b = garment(m('robe'), { w: 0.55, len: 1.3, color: '#7a9fd1', sleeve: 0.6 });
    b.pair((s) => b.rod([s * 0.13, 1.28, 0.1], [s * 0.02, 0.72, 0.12], 0.07, 'white'));
    b.torus([0.57, 0.24, 0.05], [0, 0.72, 0], { color: 'white', rot: [90, 0, 0], tube: 0.15 });
    return b.rod([0.05, 0.72, 0.12], [0.08, 0.45, 0.13], 0.04, 'white').rod([0.03, 0.72, 0.12], [-0.01, 0.48, 0.13], 0.04, 'white').done();
  }),
  e('robot costume', 'toys', 'costumes', () => {
    const b = m('robot costume')
      .box([0.5, 0.55, 0.35], [0, 0.95, 0], { color: 'silver', round: 0.1 })
      .box([0.34, 0.32, 0.32], [0, 1.43, 0], { color: 'silver', round: 0.1 })
      .box([0.22, 0.12, 0.04], [0, 1.45, 0.16], { color: 'skin2', round: 0.3 })
      .stick([0, 1.59, 0], [0, 1.72, 0], 0.02, 'darkgray')
      .ball(0.06, [0, 1.74, 0], { color: 'red', glow: true })
      .box([0.24, 0.18, 0.02], [0, 1.0, 0.18], { color: 'darkgray', round: 0.2 });
    b.pair((s) => {
      b.ball(0.035, [s * 0.05, 1.46, 0.18], { color: 'black', eye: true });
      b.rod([s * 0.3, 1.12, 0], [s * 0.38, 0.75, 0.05], 0.11, 'gray');
      b.box([0.12, 0.1, 0.08], [s * 0.39, 0.66, 0.06], { color: 'darkgray' });
      b.rod([s * 0.12, 0.65, 0], [s * 0.12, 0.08, 0], 0.13, 'gray');
      b.box([0.16, 0.08, 0.24], [s * 0.12, 0.04, 0.04], { color: 'darkgray', round: 0.3 });
      b.cyl([0.04, 0.02, 0.04], [s * 0.06, 1.05, 0.19], { color: s > 0 ? 'red' : 'lime', rot: [90, 0, 0], glow: true });
    });
    return b.cyl([0.06, 0.02, 0.06], [0, 0.95, 0.19], { color: 'yellow', rot: [90, 0, 0] }).done();
  }),
  e('rock candy', 'food', 'sweets', () => {
    const b = m('rock candy');
    for (const [x, c, h] of [[-0.03, 'pink', 0.24], [0.03, '#7fb8f0', 0.21]] as Array<[number, string, number]>) {
      b.stick([x, 0, 0], [x, h, 0], 0.008, 'lightwood');
      b.each(9, (i) => b.box(0.028, [x + Math.sin(i * 2.1) * 0.012, 0.03 + i * 0.012, Math.cos(i * 2.1) * 0.012], { color: c, round: 0.1, rot: [i * 37, i * 53, i * 21] }));
    }
    return b.done();
  }),
  e('rock salt', 'food', 'spices', () => {
    const b = m('rock salt').cyl([0.16, 0.03, 0.16], [0, 0.015, 0], { color: 'lightwood' });
    for (const [x, z, s] of [[0, 0, 0.05], [0.04, 0.03, 0.035], [-0.04, 0.02, 0.04], [0.02, -0.04, 0.035], [-0.03, -0.03, 0.03], [0.0, 0.01, 0.03]]) b.box(s, [x, 0.03 + s * 0.5 + (x === 0 && z === 0.01 ? 0.04 : 0), z], { color: s > 0.035 ? '#f6d6d0' : 'white', round: 0.15, rot: [x * 400, z * 500, 20] });
    return b.done();
  }),
  e('rocket', 'garage', 'spacecraft', () => {
    const b = m('rocket').cyl([0.7, 2.0, 0.7], [0, 1.25, 0], { color: 'white' }).cone([0.7, 0.8, 0.7], [0, 2.65, 0], { color: 'red' }).cyl([0.6, 0.3, 0.6], [0, 0.15, 0], { color: 'darkgray', taper: 0.7 });
    for (const [x, z] of around(3, 0.45, Math.PI / 2)) b.wedge([0.4, 0.7, 0.06], [x, 0.45, z], { color: 'red', apex: x === 0 ? 0 : 0, rot: [0, (Math.atan2(x, z) / D2R) + 90, 0] });
    b.cyl([0.24, 0.05, 0.24], [0, 1.8, 0.35], { color: 'skyblue', rot: [90, 0, 0] }).torus([0.28, 0.28, 0.05], [0, 1.8, 0.35], { color: 'silver', tube: 0.2 });
    return b.box([0.72, 0.1, 0.72], [0, 1.1, 0], { color: 'red', round: 0.8 }).done();
  }),
  e('rocket engine', 'garage', 'spacecraft', () => {
    const b = m('rocket engine')
      .cyl([2.0, 1.8, 2.0], [0, 0.9, 0], { color: 'copper', taper: 0.32 })
      .cyl([0.8, 0.7, 0.8], [0, 2.15, 0], { color: 'steel' })
      .cyl([1.2, 0.2, 1.2], [0, 2.6, 0], { color: 'darkgray' })
      .cyl([0.4, 0.6, 0.4], [0.75, 2.2, 0], { color: 'metal' });
    b.pair((s) => b.rod([s * 0.3, 2.4, 0.3], [s * 0.6, 1.4, 0.4], 0.12, 'silver'));
    return b.rod([0.75, 1.9, 0], [0.3, 1.8, 0.1], 0.1, 'silver').done();
  }),
  e('rocket launcher', 'armory', 'weapons', () =>
    m('rocket launcher', { view: 'side' })
      .cyl([0.12, 1.3, 0.12], [0, 0.4, 0], { color: 'olive', rot: [90, 0, 0] })
      .cyl([0.15, 0.12, 0.15], [0, 0.4, -0.62], { color: 'darkgreen', rot: [90, 0, 0], taper: 1.2 })
      .cone([0.11, 0.2, 0.11], [0, 0.4, 0.75], { color: 'darkgreen', rot: [90, 0, 0] })
      .box([0.04, 0.14, 0.06], [0, 0.32, 0.15], { color: 'black' })
      .box([0.04, 0.12, 0.06], [0, 0.3, -0.1], { color: 'black', rot: [15, 0, 0] })
      .box([0.03, 0.08, 0.04], [0, 0.49, 0.25], { color: 'black' })
      .stick([0.0, 0.35, 0.4], [0.12, 0.0, 0.45], 0.025, 'black')
      .stick([0.0, 0.35, 0.4], [-0.12, 0.0, 0.45], 0.025, 'black')
      .stick([0, 0.33, -0.3], [0, 0.0, -0.32], 0.03, 'black')
      .done(),
  ),
  e('rocket ship', 'garage', 'spacecraft', () => {
    const b = m('rocket ship').ball([1.2, 3.2, 1.2], [0, 2.0, 0], { color: 'silver' }).cone([0.4, 0.6, 0.4], [0, 3.65, 0], { color: 'red' });
    b.pair((s) => b.wedge([0.9, 1.4, 0.12], [s * 0.75, 0.75, 0], { color: 'red', apex: -s * 0.5 }));
    b.wedge([0.12, 1.4, 0.9], [0, 0.75, 0.0], { color: 'red', rot: [0, 90, 0], apex: 0 });
    b.each(2, (i) => b.cyl([0.3, 0.06, 0.3], [0, 2.5 - i * 0.6, 0.57 - i * 0.02], { color: 'skyblue', rot: [90, 0, 0] }).torus([0.36, 0.36, 0.06], [0, 2.5 - i * 0.6, 0.57 - i * 0.02], { color: 'red', tube: 0.18 }));
    return b.cone([0.5, 0.6, 0.5], [0, 0.35, 0], { color: 'fire', rot: [180, 0, 0], glow: true }).done();
  }),
  e('rocking chair', 'home', 'seating', () => {
    const b = m('rocking chair').box([0.5, 0.085, 0.46], [0, 0.45, 0], { color: 'wood' }).box([0.5, 0.08, 0.05], [0, 1.05, -0.28], { color: 'wood', rot: [-12, 0, 0] });
    b.pair((s) => {
      b.rod([s * 0.24, 0.07, 0.42], [s * 0.24, 0.02, 0.05], 0.04, 'darkwood').rod([s * 0.24, 0.02, 0.05], [s * 0.24, 0.02, -0.2], 0.04, 'darkwood').rod([s * 0.24, 0.02, -0.2], [s * 0.24, 0.08, -0.45], 0.04, 'darkwood');
      b.stick([s * 0.22, 0.03, 0.2], [s * 0.22, 0.44, 0.2], 0.04, 'wood').stick([s * 0.22, 0.03, -0.2], [s * 0.22, 1.08, -0.3], 0.045, 'wood');
      b.stick([s * 0.24, 0.48, 0.2], [s * 0.24, 0.7, 0.2], 0.035, 'wood').box([0.06, 0.04, 0.48], [s * 0.25, 0.71, -0.02], { color: 'wood', round: 0.5 });
    });
    return b.each(5, (i) => b.stick([-0.16 + i * 0.08, 0.48, -0.22], [-0.16 + i * 0.08, 1.03, -0.29], 0.025, 'lightwood')).done();
  }),
  e('rocking horse', 'toys', 'ride-on toys', () => {
    const b = m('rocking horse', { view: 'side' })
      .ball([0.3, 0.32, 0.75], [0, 0.6, 0], { color: 'white' })
      .rod([0, 0.68, 0.28], [0, 0.88, 0.38], 0.16, 'white')
      .box([0.15, 0.16, 0.34], [0, 0.92, 0.5], { color: 'white', round: 0.6, rot: [25, 0, 0] })
      .rod([0, 0.98, 0.32], [0, 0.66, 0.18], 0.06, 'darkbrown')
      .box([0.32, 0.06, 0.3], [0, 0.76, -0.02], { color: 'red', round: 0.4 })
      .rod([0, 0.65, -0.37], [0, 0.42, -0.45], 0.06, 'darkbrown');
    b.pair((s) => {
      b.cone([0.04, 0.08, 0.04], [s * 0.045, 1.04, 0.38], { color: 'white' });
      b.ball(0.03, [s * 0.07, 0.96, 0.5], { color: 'black', eye: true });
      b.rod([s * 0.1, 0.55, 0.22], [s * 0.14, 0.17, 0.4], 0.07, 'white').rod([s * 0.1, 0.55, -0.22], [s * 0.14, 0.17, -0.4], 0.07, 'white');
      b.rod([s * 0.14, 0.15, 0.75], [s * 0.14, 0.05, 0.4], 0.06, 'red').rod([s * 0.14, 0.05, 0.4], [s * 0.14, 0.05, -0.4], 0.06, 'red').rod([s * 0.14, 0.05, -0.4], [s * 0.14, 0.15, -0.75], 0.06, 'red');
    });
    return b.done();
  }),
  e('rod', 'sports', 'fishing', () =>
    m('rod')
      .cyl([0.26, 0.28, 0.26], [0, 0.14, 0], { color: 'blue', taper: 1.15 })
      .torus([0.3, 0.3, 0.02], [0, 0.28, 0], { color: 'navy', rot: [90, 0, 0], tube: 0.1 })
      .stick([0, 0.2, 0], [0.12, 1.6, 0.05], 0.025, 'black')
      .cyl([0.035, 0.25, 0.035], [0.025, 0.42, 0.01], { color: 'tan', rot: [0, 0, -5] })
      .cyl([0.07, 0.05, 0.07], [0.06, 0.62, 0.04], { color: 'silver', rot: [0, 0, 85] })
      .stick([0.12, 1.6, 0.05], [0.3, 0.75, 0.1], 0.004, 'white')
      .ball(0.04, [0.3, 0.73, 0.1], { color: 'red' })
      .ball(0.035, [0.3, 0.69, 0.1], { color: 'white' })
      .done(),
  ),
  e('roller-skates', 'sports', 'skating', () => {
    const b = m('roller-skates', { view: 'side' });
    b.pair((s) => {
      b.box([0.08, 0.04, 0.26], [s * 0.07, 0.07, 0.0], { color: 'white', round: 0.4 });
      b.box([0.08, 0.14, 0.11], [s * 0.07, 0.16, -0.06], { color: 'white', round: 0.4 });
      b.box([0.08, 0.06, 0.12], [s * 0.07, 0.11, 0.06], { color: 'white', round: 0.6 });
      b.box([0.06, 0.012, 0.24], [s * 0.07, 0.045, 0], { color: 'silver' });
      b.each(3, (i) => b.box([0.05, 0.008, 0.012], [s * 0.07, 0.12 + i * 0.03, 0.02 - i * 0.02], { color: 'pink', noInk: true, rot: [-30, 0, 0] }));
      b.ball(0.035, [s * 0.07, 0.035, 0.14], { color: 'pink' });
      for (const z of [0.08, -0.08]) b.pair((t) => b.cyl([0.05, 0.025, 0.05], [s * 0.07 + t * 0.03, 0.025, z], { color: 'pink', rot: [0, 0, 90] }));
    });
    return b.done();
  }),
  e('rollercoaster', 'places', 'amusement park', () => {
    const b = m('rollercoaster');
    const pts: Array<[number, number]> = [[-4.5, 0.6], [-3.5, 2.5], [-2.5, 4.5], [-1.5, 5.0], [-0.5, 4.0], [0.5, 1.5], [1.5, 0.6], [2.6, 0.6]];
    for (let i = 0; i < pts.length - 1; i++) {
      b.pair((s) => b.rod([pts[i][0], pts[i][1], s * 0.3], [pts[i + 1][0], pts[i + 1][1], s * 0.3], 0.12, 'red'));
      b.stick([pts[i][0], 0, 0], [pts[i][0], pts[i][1], 0], 0.14, 'white');
    }
    b.torus([3.2, 3.6, 0.3], [2.6, 2.4, 0], { color: 'red', tube: 0.07 }).stick([2.6, 0, 0], [2.6, 0.6, 0], 0.2, 'white');
    b.box([0.6, 0.45, 0.7], [-1.7, 5.3, 0], { color: 'yellow', round: 0.4, rot: [0, 0, 5] }).box([0.6, 0.45, 0.7], [-1.0, 5.0, 0], { color: 'blue', round: 0.4, rot: [0, 0, -30] });
    return b.box([1.8, 1.3, 1.6], [-4.2, 0.65, 0.4], { color: 'cream', round: 0.1 }).wedge([2.1, 0.7, 1.8], [-4.2, 1.65, 0.4], { color: 'blue' }).label('RIDE', [1.0, 0.35], [-4.2, 0.9, 1.21], { color: 'yellow' }).done();
  }),
  e('rolling pin', 'kitchen', 'baking', () =>
    m('rolling pin')
      .capsule([0.035, 0.12, 0.035], [0, 0.06, 0], { color: 'darkwood' })
      .cyl([0.07, 0.3, 0.07], [0, 0.27, 0], { color: 'lightwood' })
      .capsule([0.035, 0.12, 0.035], [0, 0.47, 0], { color: 'darkwood' })
      .done(),
  ),
  e('roof', 'places', 'building parts', () => {
    const b = m('roof').wedge([5.0, 3.2, 4.4], [0, 1.6, 0], { color: '#c0503a' }).box([5.0, 0.3, 4.0], [0, 0.15, 0], { color: 'cream', round: 0.1 });
    b.each(5, (i) => b.pair((s) => b.stick([s * (2.5 - i * 0.47), 0.06 + i * 0.6, -2.22], [s * (2.5 - i * 0.47), 0.06 + i * 0.6, 2.22], 0.1, 'darkred', { noInk: true })));
    b.box([0.6, 1.6, 0.6], [1.1, 2.3, -0.8], { color: '#a0503a', round: 0.1 }).box([0.7, 0.12, 0.7], [1.1, 3.12, -0.8], { color: 'darkgray', round: 0.1 });
    return b.cyl([0.7, 0.06, 0.7], [0, 1.0, 2.22], { color: 'glass', rot: [90, 0, 0] }).torus([0.8, 0.8, 0.08], [0, 1.0, 2.23], { color: 'white', tube: 0.15 }).done();
  }),
  e('root', 'garden', 'plant parts', () => {
    const b = m('root').cone([0.04, 0.16, 0.04], [0, 0.09, 0], { color: 'tan', rot: [180, 0, 0] });
    for (const [x, y, z, l] of [[0.05, 0.1, 0.02, 0.06], [-0.05, 0.12, 0.0, 0.05], [0.04, 0.06, -0.02, 0.04], [-0.04, 0.05, 0.02, 0.04], [0.0, 0.14, 0.05, 0.05]]) b.rod([0, y + 0.03, 0], [x * l * 20, y - 0.04, z], 0.008, 'tan');
    return b.rod([0, 0.17, 0], [0, 0.2, 0], 0.01, 'green').ball([0.04, 0.012, 0.02], [0.02, 0.21, 0], { color: 'leaf', rot: [0, 0, 25] }).ball([0.04, 0.012, 0.02], [-0.02, 0.21, 0], { color: 'leaf', rot: [0, 0, -25] }).done();
  }),
  e('root beer', 'food', 'drinks', () => bottle(m('root beer'), [0, 0, 0], 0.26, 0.07, '#4a2414', 'silver', 'cream').ball([0.04, 0.03, 0.01], [0, 0.085, 0.036], { color: 'darkred', noInk: true }).done()),
  e('root beer float', 'food', 'drinks', () =>
    m('root beer float')
      .cyl([0.09, 0.17, 0.09], [0, 0.085, 0], { color: '#5a2e1a', taper: 1.12 })
      .torus([0.1, 0.1, 0.012], [0, 0.17, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.12 })
      .torus([0.07, 0.1, 0.02], [0.06, 0.09, 0], { color: 'glass', tube: 0.25 })
      .ball([0.1, 0.05, 0.1], [0, 0.17, 0], { color: 'cream' })
      .ball(0.07, [0, 0.2, 0], { color: 'cream' })
      .stick([0.0, 0.15, 0], [-0.03, 0.29, -0.01], 0.008, 'red')
      .ball(0.02, [0.01, 0.24, 0.01], { color: 'darkred' })
      .done(),
  ),
  e('rope', 'workshop', 'rope & chain', () => {
    const b = m('rope').stick([0, 0, -0.08], [0, 1.6, -0.08], 0.12, 'wood').cyl([0.3, 0.06, 0.3], [0, 0.03, -0.08], { color: 'darkwood' }).rod([0, 1.35, -0.08], [0, 1.38, 0.06], 0.03, 'iron');
    b.each(5, (i) => b.torus([0.48 - i * 0.015, 0.75 - i * 0.02, 0.05], [(i - 2) * 0.01, 1.0, 0.0 + i * 0.012], { color: i % 2 ? 'tan' : '#c9a46a', tube: 0.12 }));
    return b.rod([0.14, 0.7, 0.04], [0.2, 0.3, 0.06], 0.045, 'tan').rod([0.2, 0.3, 0.06], [0.16, 0.12, 0.08], 0.045, 'tan').done();
  }),
  e('rope ladder', 'sports', 'playground', () => {
    const b = m('rope ladder').box([1.4, 0.19, 0.19], [0, 2.4, 0], { color: 'darkwood' });
    b.pair((s) => b.stick([s * 0.64, 0, 0], [s * 0.64, 2.48, 0], 0.19, 'darkwood').stick([s * 0.25, 2.35, 0.0], [s * 0.25, 0.25, 0.0], 0.035, 'tan'));
    return b.each(7, (i) => b.box([0.6, 0.04, 0.07], [0, 0.3 + i * 0.3, 0], { color: 'wood', round: 0.4 })).done();
  }),
  e('rope swing', 'sports', 'playground', () =>
    m('rope swing')
      .cyl([0.45, 3.0, 0.45], [-1.0, 1.5, -0.2], { color: 'bark', taper: 0.7 })
      .rod([-1.0, 2.6, -0.2], [0.8, 2.8, -0.1], 0.18, 'bark')
      .ball([2.8, 1.4, 2.0], [-0.6, 3.2, -0.3], { color: 'leaf' })
      .ball([1.2, 0.8, 1.0], [0.6, 3.05, 0.1], { color: 'darkgreen' })
      .stick([0.5, 2.72, -0.1], [0.5, 0.55, 0.0], 0.05, 'tan')
      .ball(0.12, [0.5, 0.55, 0.0], { color: 'tan' })
      .cyl([0.4, 0.07, 0.4], [0.5, 0.45, 0.0], { color: 'wood' })
      .done(),
  ),
  e('rosary beads', 'wardrobe', 'jewellery', () => {
    const b = m('rosary beads').box([0.24, 0.05, 0.12], [0, 0.025, -0.04], { color: 'darkwood' }).stick([0, 0.03, -0.04], [0, 0.66, -0.04], 0.03, 'darkwood').ball(0.035, [0, 0.66, -0.02], { color: 'darkwood' });
    b.each(18, (i) => {
      const a = (i / 18) * Math.PI * 2;
      b.ball(i % 6 === 0 ? 0.03 : 0.022, [Math.sin(a) * 0.11, 0.48 + Math.cos(a) * 0.17, 0.0], { color: i % 6 === 0 ? 'darkred' : 'brown' });
    });
    b.each(3, (i) => b.ball(0.022, [0, 0.27 - i * 0.04, 0.0], { color: 'brown' }));
    return b.box([0.016, 0.1, 0.012], [0, 0.11, 0.0], { color: 'gold' }).box([0.06, 0.016, 0.012], [0, 0.13, 0.0], { color: 'gold' }).done();
  }),
  e('rose', 'garden', 'flowers', () => {
    const b = m('rose').stick([0, 0, 0], [0, 0.48, 0], 0.012, 'darkgreen');
    b.pair((s) => b.ball([0.06, 0.012, 0.035], [s * 0.035, 0.25 + (s > 0 ? 0.05 : 0), 0], { color: 'leaf', rot: [0, 0, s * 25] }).cone([0.008, 0.015, 0.008], [s * 0.008, 0.15 + (s > 0 ? 0.12 : 0), 0], { color: 'darkgreen', rot: [0, 0, -s * 70] }));
    b.ball([0.08, 0.08, 0.08], [0, 0.52, 0], { color: 'red', name: 'head' });
    for (const [x, z] of around(5, 0.032)) b.ball([0.05, 0.06, 0.05], [x, 0.51, z], { color: '#c41e30', parent: 'head' });
    return b.ball([0.035, 0.03, 0.035], [0, 0.565, 0], { color: 'darkred', parent: 'head' }).cone([0.06, 0.03, 0.06], [0, 0.475, 0], { color: 'darkgreen', rot: [180, 0, 0] }).done();
  }),
  e('router', 'tech', 'computers', () => {
    const b = m('router').box([0.24, 0.045, 0.16], [0, 0.03, 0], { color: 'black', round: 0.3 });
    b.each(3, (i) => b.rod([-0.08 + i * 0.08, 0.05, -0.07], [-0.1 + i * 0.1, 0.2, -0.08], 0.012, 'black'));
    return b.each(5, (i) => b.ball(0.008, [-0.06 + i * 0.03, 0.035, 0.081], { color: 'lime', glow: true })).done();
  }),
  e('rowboat', 'garage', 'boats', () => {
    const b = hull(m('rowboat', { view: 'side' }), 2.6, 1.1, 0.68, '#4e8fd6');
    b.each(2, (i) => b.box([1.0, 0.06, 0.25], [0, 0.66, -0.9 + i * 0.8], { color: 'lightwood' }));
    return b.pair((s) => b.rod([s * 0.5, 0.7, -0.3], [s * 1.2, 0.05, 0.0], 0.04, 'wood').box([0.08, 0.02, 0.25], [s * 1.2, 0.04, 0.05], { color: 'wood', rot: [0, 0, s * 30] })).done();
  }),
  e('rowing machine', 'sports', 'gym', () =>
    m('rowing machine', { view: 'side' })
      .box([0.12, 0.08, 2.0], [0, 0.35, -0.3], { color: 'silver', rot: [-3, 0, 0] })
      .cyl([0.55, 0.22, 0.55], [0, 0.42, 0.85], { color: 'black', rot: [0, 0, 90] })
      .stick([0, 0.6, 0.8], [0, 1.0, 0.7], 0.05, 'darkgray')
      .box([0.2, 0.14, 0.04], [0, 1.05, 0.68], { color: 'black', round: 0.2 })
      .box([0.16, 0.1, 0.12], [0, 1.05, 0.66], { color: 'lime', glow: true, round: 0.2 })
      .box([0.3, 0.07, 0.3], [0, 0.44, -0.3], { color: 'black', round: 0.5 })
      .box([0.5, 0.04, 0.2], [0, 0.32, 0.45], { color: 'darkgray', rot: [40, 0, 0] })
      .stick([-0.25, 0.65, 0.55], [0.25, 0.65, 0.55], 0.035, 'black')
      .stick([0, 0.65, 0.55], [0, 0.5, 0.75], 0.01, 'darkgray')
      .stick([0, 0.31, -1.25], [0, 0, -1.25], 0.06, 'darkgray')
      .box([0.5, 0.06, 0.08], [0, 0.03, -1.25], { color: 'darkgray' })
      .box([0.5, 0.06, 0.08], [0, 0.03, 0.85], { color: 'darkgray' })
      .done(),
  ),
  e('rubber (material)', 'workshop', 'materials', () =>
    m('rubber (material)')
      .cyl([0.12, 0.3, 0.12], [0, 0.06, -0.05], { color: 'rubber', rot: [0, 0, 90] })
      .box([0.3, 0.01, 0.22], [0, 0.005, 0.1], { color: 'rubber', round: 0.1 })
      .cyl([0.03, 0.3, 0.03], [0, 0.06, -0.05], { color: 'darkgray', rot: [0, 0, 90] })
      .torus([0.07, 0.07, 0.015], [0.08, 0.03, 0.12], { color: '#e8c36a', rot: [90, 0, 0], tube: 0.2 })
      .done(),
  ),
  e('rubber band', 'study', 'office supplies', () =>
    m('rubber band')
      .torus([0.07, 0.05, 0.009], [0, 0.025, 0], { color: '#c99a5a', tube: 0.12 })
      .torus([0.06, 0.055, 0.006], [0.025, 0.0275, -0.015], { color: 'red', tube: 0.1, rot: [0, 30, 15] })
      .torus([0.05, 0.045, 0.006], [-0.02, 0.0225, 0.015], { color: 'blue', tube: 0.12, rot: [0, -25, -10] })
      .done(),
  ),
  e('rubber band gun', 'toys', 'toy guns', () =>
    m('rubber band gun', { view: 'side' })
      .box([0.025, 0.03, 0.3], [0, 0.14, 0.05], { color: 'lightwood', round: 0.2 })
      .box([0.028, 0.12, 0.05], [0, 0.07, -0.07], { color: 'wood', round: 0.3, rot: [-15, 0, 0] })
      .torus([0.04, 0.035, 0.008], [0, 0.1, -0.02], { color: 'wood', rot: [0, 90, 0], tube: 0.25 })
      .box([0.02, 0.035, 0.012], [0, 0.17, -0.07], { color: 'darkwood' })
      .stick([0, 0.157, 0.19], [0, 0.17, -0.07], 0.006, 'red')
      .stick([0.012, 0.145, 0.19], [0.012, 0.165, -0.07], 0.006, 'red')
      .done(),
  ),
  e('rubber chicken', 'toys', 'joke toys', () => {
    const y = '#f3d23a';
    const b = m('rubber chicken')
      .ball([0.12, 0.2, 0.1], [0, 0.18, 0], { color: y })
      .rod([0, 0.27, 0.0], [0.03, 0.36, 0.04], 0.035, y)
      .ball([0.055, 0.06, 0.07], [0.035, 0.38, 0.06], { color: y })
      .ball([0.02, 0.04, 0.04], [0.035, 0.42, 0.06], { color: 'red' })
      .cone([0.02, 0.05, 0.02], [0.035, 0.37, 0.11], { color: 'orange', rot: [100, 0, 0] })
      .cone([0.02, 0.04, 0.02], [0.035, 0.355, 0.1], { color: 'orange', rot: [120, 0, 0] });
    b.pair((s) => {
      b.ball(0.012, [0.035 + s * 0.022, 0.39, 0.08], { color: 'black', eye: true });
      b.ball([0.03, 0.08, 0.04], [s * 0.065, 0.2, 0.0], { color: y, rot: [0, 0, s * -20] });
      b.stick([s * 0.03, 0.09, 0], [s * 0.04, 0.0, 0.01], 0.008, 'orange');
      b.box([0.04, 0.006, 0.04], [s * 0.04, 0.003, 0.025], { color: 'orange' });
    });
    return b.done();
  }),
  e('rubber duck', 'toys', 'bath toys', () => {
    const b = m('rubber duck')
      .ball([0.09, 0.065, 0.1], [0, 0.035, -0.005], { color: 'yellow' })
      .cone([0.04, 0.04, 0.03], [0, 0.055, -0.06], { color: 'yellow', rot: [-60, 0, 0] })
      .ball(0.06, [0, 0.085, 0.018], { color: 'yellow' })
      .ball([0.04, 0.014, 0.035], [0, 0.08, 0.055], { color: 'orange' });
    return b.pair((s) => b.ball(0.012, [s * 0.017, 0.096, 0.042], { color: 'black', eye: true }).ball([0.025, 0.035, 0.05], [s * 0.04, 0.04, -0.005], { color: '#efc23a' })).done();
  }),
  e('rubber gloves', 'home', 'cleaning', () => {
    const b = m('rubber gloves');
    b.pair((s) => {
      const x = s * 0.07, z = s * 0.02;
      b.cyl([0.1, 0.12, 0.05], [x, 0.06, z], { color: 'yellow', taper: 0.85 });
      b.box([0.085, 0.09, 0.035], [x, 0.16, z], { color: 'yellow', round: 0.6 });
      b.each(4, (i) => b.capsule([0.018, 0.07 - Math.abs(i - 1.5) * 0.01, 0.018], [x - 0.03 + i * 0.02, 0.23 - Math.abs(i - 1.5) * 0.006, z], { color: 'yellow' }));
      b.rod([x - s * 0.04, 0.15, z], [x - s * 0.065, 0.2, z], 0.02, 'yellow');
    });
    return b.done();
  }),
  e('rubber stamp', 'study', 'office supplies', () =>
    m('rubber stamp')
      .box([0.06, 0.025, 0.04], [0, 0.0175, 0], { color: 'wood', round: 0.1 })
      .box([0.058, 0.006, 0.038], [0, 0.003, 0], { color: 'red', round: 0.1 })
      .cyl([0.018, 0.04, 0.018], [0, 0.05, 0], { color: 'darkwood' })
      .ball(0.035, [0, 0.085, 0], { color: 'red' })
      .box([0.07, 0.012, 0.05], [0.08, 0.006, 0.02], { color: 'darkgray', round: 0.2 })
      .box([0.06, 0.004, 0.04], [0.08, 0.013, 0.02], { color: 'darkred', noInk: true })
      .done(),
  ),
  e('rubble', 'workshop', 'debris', () => {
    const b = m('rubble');
    for (const [x, y, z, w, c, r] of [[0, 0.15, 0, 0.45, 'lightgray', 10], [0.3, 0.1, 0.15, 0.3, 'stone', 35], [-0.3, 0.1, 0.1, 0.32, 'gray', -20], [0.1, 0.3, -0.05, 0.28, 'stone', 50], [-0.15, 0.07, 0.35, 0.18, '#b5543c', 15], [0.25, 0.06, -0.3, 0.2, '#b5543c', -30], [-0.25, 0.25, -0.15, 0.25, 'lightgray', 65]] as Array<[number, number, number, number, string, number]>) b.box([w, w * 0.6, w * 0.8], [x, y, z], { color: c, round: 0.1, rot: [r, r * 1.5, r * 0.5] });
    return b.rod([0.05, 0.3, 0.0], [0.35, 0.55, 0.1], 0.025, '#8a4a2a').rod([0.0, 0.25, 0.1], [-0.2, 0.5, 0.25], 0.025, '#8a4a2a').done();
  }),
  e('ruby', 'nature', 'gems', () => gem('ruby', '#d0103a').done()),
  e('rudder', 'garage', 'boat parts', () =>
    m('rudder')
      .box([0.75, 1.2, 0.14], [0.12, 0.62, 0], { color: 'darkred', round: 0.3 })
      .stick([-0.22, 0.05, 0], [-0.22, 1.9, 0], 0.12, 'darkwood')
      .box([0.16, 0.12, 0.16], [-0.22, 1.85, 0], { color: 'darkwood' })
      .rod([-0.22, 1.85, 0], [-0.22, 1.95, 0.9], 0.08, 'wood')
      .box([0.06, 0.08, 0.18], [-0.2, 0.3, 0], { color: 'brass' })
      .box([0.06, 0.08, 0.18], [-0.2, 1.0, 0], { color: 'brass' })
      .done(),
  ),
  e('rug', 'home', 'decor', () => {
    const b = m('rug')
      .box([1.2, 0.025, 1.3], [0, 0.0125, 0.1], { color: 'darkred', round: 0.1 })
      .cyl([0.2, 1.2, 0.2], [0, 0.1, -0.6], { color: 'darkred', rot: [0, 0, 90] })
      .box([1.0, 0.004, 1.1], [0, 0.026, 0.12], { color: 'gold', noInk: true })
      .box([0.9, 0.006, 1.0], [0, 0.028, 0.12], { color: 'darkred', noInk: true })
      .ball([0.4, 0.01, 0.5], [0, 0.03, 0.12], { color: 'navy', noInk: true })
      .ball([0.18, 0.012, 0.24], [0, 0.034, 0.12], { color: 'gold', noInk: true });
    return b.each(12, (i) => b.box([0.03, 0.01, 0.08], [-0.55 + i * 0.1, 0.005, 0.79], { color: 'cream', noInk: true })).done();
  }),
  e('rugby ball', 'sports', 'balls', () =>
    m('rugby ball')
      .cyl([0.12, 0.06, 0.12], [0, 0.03, 0], { color: 'orange', taper: 0.5 })
      .ball([0.19, 0.29, 0.19], [0, 0.2, 0], { color: '#9a5a30' })
      .box([0.012, 0.09, 0.012], [0, 0.22, 0.095], { color: 'white' })
      .box([0.035, 0.008, 0.012], [0, 0.19, 0.096], { color: 'white' })
      .box([0.035, 0.008, 0.012], [0, 0.22, 0.097], { color: 'white' })
      .box([0.035, 0.008, 0.012], [0, 0.25, 0.096], { color: 'white' })
      .done(),
  ),
  e('ruin', 'places', 'ruins', () => {
    const b = m('ruin').box([6, 0.3, 3.5], [0, 0.15, 0], { color: 'grass', round: 0.1 }).box([5, 0.4, 2.6], [0, 0.45, 0], { color: 'stone', round: 0.05 });
    for (const [x, h] of [[-2, 3.4], [-0.7, 3.4], [0.7, 1.6], [2, 2.4]]) {
      b.cyl([0.55, h, 0.55], [x, 0.65 + h / 2, 0.6], { color: 'beige' }).box([0.75, 0.25, 0.75], [x, 0.75, 0.6], { color: 'beige', round: 0.05 });
      if (h > 3) b.box([0.75, 0.25, 0.75], [x, 0.65 + h + 0.12, 0.6], { color: 'beige', round: 0.05 });
    }
    b.box([2.1, 0.4, 0.7], [-1.35, 4.42, 0.6], { color: 'beige', round: 0.05 }).box([3.5, 2.0, 0.5], [0, 1.65, -0.9], { color: 'stone', round: 0.05 }).box([1.5, 0.9, 0.5], [1.0, 3.1, -0.9], { color: 'stone', round: 0.05 });
    return b.cyl([0.5, 1.4, 0.5], [1.6, 0.9, 1.5], { color: 'beige', rot: [0, 0, 90] }).box([0.5, 0.4, 0.4], [-2.4, 0.5, 1.5], { color: 'beige', rot: [0, 30, 10] }).done();
  }),
  e('ruler', 'study', 'stationery', () => {
    const b = m('ruler').box([0.09, 0.03, 0.05], [0, 0.015, 0], { color: 'darkgray', round: 0.2 }).box([0.04, 0.3, 0.01], [0, 0.17, 0], { color: 'lightwood', round: 0.1 });
    return b.each(12, (i) => b.box([i % 2 ? 0.008 : 0.016, 0.002, 0.002], [-0.016 + (i % 2 ? -0.004 : 0), 0.04 + i * 0.022, 0.006], { color: 'black', noInk: true })).done();
  }),
  e('runway', 'places', 'airport', () => {
    const b = m('runway').box([1.1, 0.22, 3.0], [0, 0.11, 0], { color: '#4a4c50', round: 0.03 });
    b.pair((s) => b.box([0.35, 0.2, 3.0], [s * 0.72, 0.1, 0], { color: 'grass', round: 0.1 }).each(5, (i) => b.ball(0.05, [s * 0.52, 0.23, -1.2 + i * 0.6], { color: 'yellow', glow: true })));
    b.each(5, (i) => b.box([0.05, 0.01, 0.3], [0, 0.222, -1.0 + i * 0.5], { color: 'white', noInk: true }));
    return b.each(6, (i) => b.box([0.06, 0.01, 0.25], [-0.38 + i * 0.152, 0.222, 1.3], { color: 'white', noInk: true })).done();
  }),
  e('rupee (nintendo)', 'toys', 'video games', () =>
    m('rupee (nintendo)')
      .box([0.05, 0.06, 0.03], [0, 0.07, 0], { color: '#2fbf4a', round: 0.05 })
      .wedge([0.05, 0.035, 0.03], [0, 0.1175, 0], { color: '#2fbf4a' })
      .wedge([0.05, 0.035, 0.03], [0, 0.0225, 0], { color: '#2fbf4a', rot: [0, 0, 180] })
      .box([0.02, 0.06, 0.01], [0, 0.07, 0.015], { color: '#8af08a', noInk: true })
      .done(),
  ),
  e('rust', 'workshop', 'materials', () => {
    const b = m('rust').cyl([0.09, 0.11, 0.09], [0, 0.055, 0], { color: '#8a4a22' }).torus([0.095, 0.095, 0.01], [0, 0.11, 0], { color: '#6a3a1a', rot: [90, 0, 0], tube: 0.12 });
    b.each(8, (i) => b.ball([0.03 + (i % 3) * 0.008, 0.025, 0.01], surf([0, 0.055, 0], [0.045, 0.04, 0.045], -80 + i * 22, ((i * 37) % 60) - 30), { color: i % 2 ? '#c8642a' : '#a85020', noInk: true, rot: [0, -80 + i * 22, 0] }));
    return b.box([0.03, 0.004, 0.02], [0.06, 0.002, 0.04], { color: '#c8642a', rot: [0, 30, 0] }).box([0.02, 0.004, 0.02], [-0.06, 0.002, 0.05], { color: '#a85020' }).done();
  }),
  e('saddle', 'farm', 'horse tack', () => {
    const b = m('saddle').box([0.14, 0.12, 0.9], [0, 0.62, 0], { color: 'wood', round: 0.2 });
    b.each(2, (i) => b.pair((s) => b.stick([0, 0.6, (i ? 1 : -1) * 0.4], [s * 0.25, 0, (i ? 1 : -1) * 0.4], 0.06, 'darkwood')));
    b.ball([0.44, 0.2, 0.6], [0, 0.72, 0], { color: 'leather' }).ball([0.3, 0.08, 0.32], [0, 0.8, -0.02], { color: '#6a4228' });
    b.box([0.32, 0.16, 0.08], [0, 0.84, -0.26], { color: 'leather', round: 0.5 }).cyl([0.06, 0.13, 0.06], [0, 0.86, 0.24], { color: 'leather' }).ball([0.1, 0.045, 0.1], [0, 0.93, 0.25], { color: '#6a4228' });
    return b.pair((s) => b.box([0.04, 0.34, 0.42], [s * 0.21, 0.55, 0], { color: '#6a4228', round: 0.3 }).stick([s * 0.24, 0.65, 0.05], [s * 0.25, 0.3, 0.05], 0.025, 'darkbrown').torus([0.11, 0.1, 0.035], [s * 0.25, 0.25, 0.05], { color: 'silver', rot: [0, 90, 0], tube: 0.22 })).done();
  }),
  e('safe', 'home', 'storage', () =>
    m('safe')
      .box([0.55, 0.6, 0.5], [0, 0.32, 0], { color: '#3a4048', round: 0.1 })
      .box([0.46, 0.5, 0.04], [0, 0.32, 0.26], { color: '#4a525c', round: 0.1, name: 'door', pivot: [-0.23, 0.32, 0.26] })
      .cyl([0.14, 0.03, 0.14], [0.02, 0.38, 0.29], { color: 'silver', rot: [90, 0, 0], parent: 'door' })
      .cyl([0.06, 0.04, 0.06], [0.02, 0.38, 0.3], { color: 'darkgray', rot: [90, 0, 0], parent: 'door' })
      .stick([0.15, 0.25, 0.29], [0.15, 0.25, 0.33], 0.02, 'silver', { parent: 'door' })
      .box([0.12, 0.025, 0.025], [0.15, 0.25, 0.335], { color: 'silver', parent: 'door' })
      .box([0.08, 0.04, 0.08], [0.2, 0.02, 0.18], { color: 'black' })
      .box([0.08, 0.04, 0.08], [-0.2, 0.02, 0.18], { color: 'black' })
      .done(),
  ),
  e('safety cone', 'workshop', 'road works', () =>
    m('safety cone')
      .box([0.42, 0.05, 0.42], [0, 0.025, 0], { color: 'black', round: 0.2 })
      .cyl([0.34, 0.68, 0.34], [0, 0.39, 0], { color: 'orange', taper: 0.14 })
      .cyl([0.26, 0.09, 0.26], [0, 0.42, 0], { color: 'white', taper: 0.72 })
      .cyl([0.18, 0.07, 0.18], [0, 0.58, 0], { color: 'white', taper: 0.7 })
      .done(),
  ),
  e('safety pin', 'wardrobe', 'sewing', () =>
    m('safety pin')
      .torus([0.016, 0.016, 0.005], [0, 0.008, 0], { color: 'silver', tube: 0.3 })
      .stick([-0.006, 0.012, 0], [-0.006, 0.075, 0], 0.0035, 'silver')
      .stick([0.006, 0.012, 0], [0.004, 0.072, 0.002], 0.0035, 'silver')
      .box([0.016, 0.018, 0.009], [-0.002, 0.08, 0], { color: 'silver', round: 0.4 })
      .done(),
  ),
  e('safety vest', 'wardrobe', 'workwear', () => {
    const b = garment(m('safety vest'), { w: 0.5, len: 0.65, color: '#d8f03a', sleeve: 0 });
    b.wedge([0.16, 0.2, 0.04], [0, 0.56, 0.09], { color: '#3a3f45', rot: [0, 0, 180] });
    b.each(2, (i) => b.box([0.52, 0.04, 0.21], [0, 0.15 + i * 0.12, 0], { color: 'silver', round: 0.3 }));
    return b.pair((s) => b.box([0.05, 0.6, 0.21], [s * 0.15, 0.33, 0.0], { color: 'silver', round: 0.3 })).done();
  }),
  e('sail', 'garage', 'boat parts', () =>
    m('sail')
      .box([1.4, 0.3, 1.0], [0, 0.15, 0], { color: 'wood', round: 0.1 })
      .stick([-0.5, 0.3, 0], [-0.5, 4.2, 0], 0.14, 'darkwood')
      .wedge([2.4, 3.6, 0.08], [0.72, 2.25, 0], { color: 'white', apex: -0.5 })
      .rod([-0.5, 0.45, 0], [1.9, 0.45, 0], 0.09, 'wood')
      .box([0.6, 0.6, 0.02], [0.0, 2.0, 0.05], { color: 'red', noInk: true, rot: [0, 0, 0] })
      .done(),
  ),
  e('sailboat', 'garage', 'boats', () => {
    const b = hull(m('sailboat', { view: 'side' }), 4.2, 1.5, 0.8, 'white', 'lightwood', 'navy');
    b.stick([0, 0.8, 0.4], [0, 5.4, 0.4], 0.12, 'silver').rod([0, 1.1, 0.4], [0, 1.1, -1.8], 0.08, 'silver');
    b.wedge([2.2, 4.1, 0.06], [0, 3.2, -0.72], { color: 'white', rot: [0, 90, 0], apex: -0.5 });
    b.wedge([1.6, 3.8, 0.06], [0, 2.95, 1.2], { color: 'skyblue', rot: [0, 90, 0], apex: 0.5 });
    return b.box([0.8, 0.4, 0.9], [0, 1.0, -0.6], { color: 'white', round: 0.4 }).done();
  }),
  e('salad', 'food', 'salads', () => {
    const b = bowl(m('salad'), 0.2, 'wood', 'lettuce');
    b.each(6, (i) => b.ball([0.06, 0.03, 0.05], surf([0, 0.075, 0], [0.07, 0.01, 0.07], i * 60, 0), { color: i % 2 ? 'lettuce' : 'green', rot: [20, i * 60, 0] }));
    for (const [x, z] of [[0.03, 0.03], [-0.04, 0.0]]) b.ball([0.035, 0.025, 0.035], [x, 0.09, z], { color: 'tomato' });
    return b.cyl([0.035, 0.008, 0.035], [0.0, 0.092, -0.04], { color: '#cfe8a0', rot: [20, 0, 0] }).cyl([0.035, 0.008, 0.035], [0.035, 0.09, -0.02], { color: '#cfe8a0', rot: [-20, 0, 10] }).done();
  }),
  e('salad dressing', 'food', 'condiments', () => bottle(m('salad dressing'), [0, 0, 0], 0.2, 0.065, 'cream', 'green', 'white').ball([0.03, 0.025, 0.006], [0, 0.065, 0.034], { color: 'leaf', noInk: true }).done()),
  e('saliva', 'clinic', 'body', () => {
    const b = m('saliva')
      .ball([0.3, 0.32, 0.28], [0, 0.36, 0], { color: 'skin2' })
      .ball([0.1, 0.06, 0.04], [0.02, 0.28, 0.13], { color: '#5a1a22' })
      .ball([0.06, 0.025, 0.03], [0.02, 0.265, 0.145], { color: 'pink' })
      .stick([0.06, 0.27, 0.14], [0.07, 0.04, 0.15], 0.018, '#8fd0f0')
      .ball([0.035, 0.045, 0.035], [0.07, 0.05, 0.15], { color: '#8fd0f0' })
      .ball([0.2, 0.02, 0.14], [0.06, 0.01, 0.12], { color: '#8fd0f0' });
    return b.pair((s) => b.ball(0.035, [s * 0.06, 0.42, 0.125], { color: 'black', eye: true }).rod([s * 0.03, 0.47, 0.13], [s * 0.09, 0.465, 0.12], 0.012, 'darkbrown')).done();
  }),
  e('salon', 'places', 'shops', () => {
    const b = bld('salon', 'SALON', { wall: 'pink', roof: 'magenta', signBg: 'white', door: 'white' });
    b.pair((s) => b.torus([0.4, 0.4, 0.08], [s * 0.25 + 0.0, 3.6, 1.55], { color: 'black', tube: 0.25 }));
    return b.rod([-0.15, 3.75, 1.55], [0.45, 4.6, 1.55], 0.12, 'silver').rod([0.15, 3.75, 1.55], [-0.45, 4.6, 1.55], 0.12, 'silver').done();
  }),
  e('salsa', 'food', 'dips', () => {
    const b = bowl(m('salsa'), 0.14, 'orange', '#c8302a');
    b.each(6, (i) => b.ball(0.012, surf([0, 0.05, 0], [0.05, 0.01, 0.05], i * 60, 30), { color: i % 2 ? 'white' : 'green', noInk: true }));
    for (const [a, r] of [[30, 0], [100, 15], [200, -10], [300, 20]]) b.wedge([0.06, 0.06, 0.006], [Math.sin(a * D2R) * 0.085, 0.035, Math.cos(a * D2R) * 0.085], { color: '#e8b84a', rot: [r, a, 20] });
    return b.done();
  }),
  e('salt', 'food', 'spices', () =>
    m('salt')
      .cyl([0.08, 0.14, 0.08], [0, 0.07, 0], { color: 'blue' })
      .cyl([0.082, 0.06, 0.082], [0, 0.07, 0], { color: 'white' })
      .box([0.025, 0.02, 0.01], [0, 0.14, 0.035], { color: 'silver' })
      .cone([0.1, 0.035, 0.08], [0.09, 0.0175, 0.05], { color: 'white' })
      .done(),
  ),
  e('salt lick', 'farm', 'farm things', () =>
    m('salt lick')
      .box([0.3, 0.06, 0.3], [0, 0.03, 0], { color: 'darkwood', round: 0.1 })
      .box([0.24, 0.2, 0.24], [0, 0.16, 0], { color: '#ecd2c8', round: 0.2 })
      .ball([0.12, 0.04, 0.12], [0.02, 0.26, 0.02], { color: '#d9b4a8', noInk: true })
      .torus([0.08, 0.08, 0.015], [0, 0.29, 0], { color: 'tan', tube: 0.2 })
      .done(),
  ),
  e('salt mine', 'places', 'mines', () => {
    const b = m('salt mine').ball([7, 6, 5], [0, 0, -0.5], { color: '#b8a690' }).ball([3, 2, 2], [2, 2.3, -0.6], { color: 'white' });
    b.box([1.6, 2.0, 0.3], [0, 1.0, 1.9], { color: 'black', round: 0.2 });
    b.pair((s) => b.box([0.25, 2.3, 0.3], [s * 0.9, 1.15, 2.05], { color: 'wood' }));
    b.box([2.1, 0.3, 0.35], [0, 2.35, 2.05], { color: 'wood' }).label('SALT MINE', [1.8, 0.4], [0, 2.75, 2.1], { color: 'cream' });
    b.pair((s) => b.stick([s * 0.4, 0.04, 1.8], [s * 0.4, 0.04, 4.2], 0.07, 'steel'));
    return b.box([1.0, 0.6, 1.1], [0, 0.55, 3.3], { color: 'iron', round: 0.2 }).ball([0.9, 0.4, 1.0], [0, 0.85, 3.3], { color: 'white' }).cyl([0.35, 0.1, 0.35], [0.5, 0.18, 3.0], { color: 'black', rot: [0, 0, 90] }).done();
  }),
  e('salt shaker', 'kitchen', 'tableware', () => {
    const b = m('salt shaker').cyl([0.05, 0.08, 0.05], [0, 0.04, 0], { color: '#d8eef7', taper: 0.9 }).cyl([0.044, 0.05, 0.044], [0, 0.03, 0], { color: 'white' })
      .cyl([0.048, 0.02, 0.048], [0, 0.09, 0], { color: 'silver' })
      .ball([0.048, 0.035, 0.048], [0, 0.1, 0], { color: 'silver' });
    return b.each(4, (i) => b.ball(0.006, surf([0, 0.1, 0], [0.024, 0.0175, 0.024], -45 + i * 30, 50), { color: 'black', noInk: true })).done();
  }),
  e('sampler', 'home', 'decor', () => {
    const b = m('sampler').box([0.22, 0.26, 0.03], [0, 0.13, 0], { color: 'darkwood', round: 0.1 }).box([0.18, 0.22, 0.01], [0, 0.13, 0.015], { color: 'beige' });
    const cs = ['red', 'blue', 'green', 'purple', 'orange'];
    b.each(5, (r) => b.each(6, (c) => b.box([0.018, 0.018, 0.004], [-0.06 + c * 0.024, 0.2 - r * 0.028, 0.021], { color: cs[(r + c) % 5], noInk: true })));
    return b.heart(0.04, [0, 0.06, 0.022], { color: 'red', noInk: true }).done();
  }),
  e('sand', 'nature', 'earth', () =>
    m('sand')
      .cyl([0.4, 0.06, 0.34], [0, 0.03, 0], { color: 'sand', taper: 0.7 })
      .ball([0.3, 0.12, 0.26], [0, 0.06, 0], { color: 'sand' })
      .torus([0.3, 0.26, 0.005], [0, 0.06, 0], { color: '#d6bd7a', rot: [90, 0, 0], tube: 0.04, noInk: true })
      .ball([0.03, 0.015, 0.025], [0.12, 0.07, 0.08], { color: 'pink' })
      .done(),
  ),
  e('sand dollar', 'sea', 'sea life', () => {
    const b = m('sand dollar').ball([0.12, 0.03, 0.08], [0, 0.01, 0], { color: 'sand' }).cyl([0.09, 0.012, 0.09], [0, 0.05, 0], { color: '#f1e6cf', rot: [90, 0, 0] });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      b.ball([0.01, 0.024, 0.004], [Math.sin(a) * 0.02, 0.05 + Math.cos(a) * 0.02, 0.007], { color: '#c9b48a', noInk: true, rot: [0, 0, (-a * 180) / Math.PI] });
    }
    return b.done();
  }),
  e('sand toy', 'toys', 'beach toys', () =>
    m('sand toy')
      .cyl([0.12, 0.13, 0.12], [0, 0.065, 0], { color: 'red', taper: 1.25 })
      .cyl([0.14, 0.02, 0.14], [0, 0.12, 0], { color: 'sand' })
      .torus([0.16, 0.12, 0.008], [0, 0.13, 0], { color: 'yellow', tube: 0.08 })
      .stick([0.03, 0.12, 0.0], [0.07, 0.24, -0.02], 0.012, 'blue')
      .box([0.05, 0.06, 0.008], [0.025, 0.1, 0.01], { color: 'blue', rot: [0, 0, -20] })
      .ball([0.04, 0.02, 0.03], [0.07, 0.25, -0.02], { color: 'blue' })
      .done(),
  ),
  e('sandal', 'wardrobe', 'shoes', () => {
    const b = m('sandal').box([0.1, 0.025, 0.26], [0, 0.0125, 0], { color: 'tan', round: 0.6 });
    for (const z of [0.06, -0.03]) b.rod([-0.045, 0.02, z], [0, 0.065, z], 0.016, 'brown').rod([0, 0.065, z], [0.045, 0.02, z], 0.016, 'brown');
    return b.rod([-0.045, 0.02, -0.1], [0, 0.07, -0.12], 0.012, 'brown').rod([0, 0.07, -0.12], [0.045, 0.02, -0.1], 0.012, 'brown').ball(0.016, [0.043, 0.03, -0.1], { color: 'gold' }).done();
  }),
  e('sandbag', 'workshop', 'construction', () => {
    const c = '#c8b07a';
    const b = m('sandbag');
    for (const [x, y] of [[-0.26, 0.09], [0.26, 0.09], [0, 0.26]]) b.box([0.5, 0.18, 0.3], [x, y, 0], { color: c, round: 0.8 }).ball([0.06, 0.07, 0.06], [x + 0.26, y, 0], { color: '#b09860' });
    return b.done();
  }),
  e('sandbox', 'sports', 'playground', () => {
    const b = m('sandbox').box([1.6, 0.18, 1.6], [0, 0.09, 0], { color: 'sand', round: 0.1 });
    b.pair((s) => b.box([1.8, 0.25, 0.1], [0, 0.125, s * 0.85], { color: 'wood' }).box([0.1, 0.25, 1.8], [s * 0.85, 0.125, 0], { color: 'wood' }));
    b.cyl([0.2, 0.2, 0.2], [0.4, 0.28, 0.2], { color: 'red', taper: 1.2 }).cyl([0.25, 0.2, 0.25], [-0.3, 0.28, -0.2], { color: 'sand', taper: 0.8 }).cyl([0.15, 0.15, 0.15], [-0.3, 0.45, -0.2], { color: 'sand', taper: 0.8 });
    return b.stick([0.1, 0.18, 0.4], [0.2, 0.45, 0.3], 0.03, 'yellow').box([0.12, 0.02, 0.15], [0.07, 0.2, 0.47], { color: 'yellow' }).done();
  }),
  e('sandcastle', 'toys', 'beach toys', () => {
    const b = m('sandcastle').cyl([1.0, 0.1, 0.8], [0, 0.05, 0], { color: 'sand' }).box([0.5, 0.25, 0.4], [0, 0.22, 0], { color: 'sand', round: 0.1 }).cyl([0.24, 0.25, 0.24], [0, 0.45, 0], { color: 'sand' });
    b.pair((s) => b.cyl([0.18, 0.35, 0.18], [s * 0.3, 0.27, 0.15], { color: 'sand', taper: 0.85 }).cone([0.2, 0.12, 0.2], [s * 0.3, 0.5, 0.15], { color: '#d9be7e' }));
    b.box([0.12, 0.14, 0.03], [0, 0.17, 0.2], { color: '#8a6a40', round: 0.6 });
    return b.stick([0, 0.55, 0], [0, 0.78, 0], 0.012, 'wood').wedge([0.12, 0.08, 0.01], [0.06, 0.74, 0], { color: 'red', rot: [0, 0, -90] }).done();
  }),
  e('sandpaper', 'workshop', 'materials', () => {
    const b = m('sandpaper').box([0.13, 0.06, 0.08], [0.06, 0.04, 0.05], { color: 'blue', round: 0.3 }).box([0.13, 0.012, 0.08], [0.06, 0.006, 0.05], { color: '#b8743a' });
    b.box([0.2, 0.26, 0.006], [-0.06, 0.13, -0.06], { color: '#b8743a', rot: [-12, 0, 0] });
    return b.each(10, (i) => b.ball(0.008, [-0.14 + (i % 5) * 0.04, 0.05 + Math.floor(i / 5) * 0.12 + (i % 2) * 0.03, -0.06 + 0.012 - (0.05 + Math.floor(i / 5) * 0.12) * 0.2], { color: '#8a5020', noInk: true })).done();
  }),
  e('sandstone', 'nature', 'rocks', () => {
    const b = m('sandstone');
    const cs = ['#d9a066', '#e8c08a', '#c88a52', '#e2b47a'];
    return b.each(4, (i) => b.box([0.16 - i * 0.015, 0.03, 0.12 - i * 0.01], [i * 0.006, 0.015 + i * 0.03, i * -0.004], { color: cs[i], round: 0.4, rot: [0, i * 6, 0] })).done();
  }),
  e('sandwich', 'food', 'sandwiches', () =>
    m('sandwich')
      .box([0.12, 0.025, 0.12], [0, 0.0125, 0], { color: 'bread', round: 0.5 })
      .box([0.13, 0.012, 0.13], [0, 0.03, 0], { color: 'lettuce', round: 0.8 })
      .box([0.12, 0.008, 0.12], [0, 0.04, 0], { color: 'pink', round: 0.5 })
      .box([0.115, 0.006, 0.115], [0, 0.047, 0], { color: 'cheese', rot: [0, 45, 0] })
      .cyl([0.05, 0.008, 0.05], [0.025, 0.054, 0.02], { color: 'tomato' })
      .box([0.12, 0.025, 0.12], [0, 0.07, 0], { color: 'bread', round: 0.5 })
      .stick([0, 0.06, 0], [0, 0.12, 0], 0.004, 'lightwood')
      .ball(0.018, [0, 0.12, 0], { color: 'olive' })
      .done(),
  ),
  e('santa hat', 'wardrobe', 'hats', () =>
    m('santa hat')
      .torus([0.22, 0.22, 0.06], [0, 0.03, 0], { color: 'white', rot: [90, 0, 0], tube: 0.3 })
      .cone([0.19, 0.2, 0.19], [0, 0.15, 0], { color: 'red', taper: 0.3 })
      .rod([0, 0.24, 0], [0.08, 0.2, 0.0], 0.05, 'red')
      .ball(0.06, [0.1, 0.18, 0], { color: 'white' })
      .done(),
  ),
  e('sapling', 'garden', 'trees', () => {
    const b = m('sapling').ball([0.4, 0.15, 0.4], [0, 0.0, 0], { color: 'dirt' }).stick([0, 0, 0], [0, 0.85, 0], 0.03, 'bark').stick([0.08, 0, -0.04], [0.08, 0.7, -0.04], 0.025, 'lightwood');
    b.rod([0, 0.6, 0], [0.12, 0.75, 0], 0.015, 'bark').rod([0, 0.5, 0], [-0.1, 0.65, 0.03], 0.015, 'bark');
    for (const [x, y, z] of [[0, 0.92, 0], [0.13, 0.8, 0.02], [-0.11, 0.7, 0.04], [0.05, 0.8, -0.06], [-0.05, 0.85, 0.05]]) b.ball([0.12, 0.1, 0.1], [x, y, z], { color: 'lime' });
    return b.torus([0.12, 0.05, 0.02], [0.04, 0.4, -0.02], { color: 'green', rot: [90, 0, 0], tube: 0.3 }).done();
  }),
  e('sapphire', 'nature', 'gems', () => gem('sapphire', '#1f4fbf').done()),
  e('sardine can', 'food', 'canned food', () => {
    const b = m('sardine can').box([0.14, 0.03, 0.09], [0, 0.015, 0], { color: 'silver', round: 0.3 }).box([0.12, 0.004, 0.07], [0, 0.03, 0], { color: '#c0402a', noInk: true });
    b.each(3, (i) => b.ball([0.11, 0.016, 0.022], [0, 0.034, -0.022 + i * 0.022], { color: i % 2 ? '#9fb0bf' : '#b8c6d2' }));
    return b.cyl([0.03, 0.12, 0.03], [0, 0.048, -0.05], { color: 'silver', rot: [0, 0, 90] }).stick([0.06, 0.048, -0.05], [0.09, 0.048, -0.05], 0.006, 'steel').torus([0.025, 0.025, 0.005], [0.1, 0.048, -0.05], { color: 'steel', tube: 0.2 }).done();
  }),
  e('sash', 'wardrobe', 'accessories', () =>
    m('sash')
      .cyl([0.05, 0.9, 0.05], [0, 0.45, 0], { color: 'darkwood' })
      .cyl([0.4, 0.05, 0.4], [0, 0.025, 0], { color: 'darkwood' })
      .box([0.42, 0.62, 0.26], [0, 1.18, 0], { color: 'cream', round: 0.6 })
      .cyl([0.1, 0.12, 0.1], [0, 1.53, 0], { color: 'darkwood' })
      .box([0.12, 0.72, 0.03], [0, 1.18, 0.12], { color: 'red', rot: [0, 0, 35], round: 0.2 })
      .box([0.12, 0.72, 0.03], [0, 1.18, -0.12], { color: 'red', rot: [0, 0, 35], round: 0.2 })
      .ball([0.1, 0.1, 0.04], [0.16, 0.92, 0.13], { color: 'gold' })
      .label('MISS', [0.08, 0.22], [0.0, 1.2, 0.14], { color: 'red', rot: [0, 0, 35] })
      .done(),
  ),
  e('satellite', 'sky', 'satellites', () => {
    const b = m('satellite').box([0.6, 0.7, 0.6], [0, 1.0, 0], { color: 'gold', round: 0.1 }).cyl([0.5, 0.12, 0.5], [0, 1.45, 0.1], { color: 'white', taper: 2.2, rot: [30, 0, 0] }).stick([0, 1.4, 0.1], [0, 1.7, 0.25], 0.03, 'gray');
    b.pair((s) => {
      b.stick([s * 0.3, 1.0, 0], [s * 0.5, 1.0, 0], 0.05, 'gray');
      b.box([1.0, 0.5, 0.04], [s * 1.0, 1.0, 0], { color: 'navy', round: 0.05 });
      b.each(3, (i) => b.box([0.012, 0.5, 0.045], [s * (0.7 + i * 0.25), 1.0, 0], { color: 'silver', noInk: true }));
    });
    return b.done();
  }),
  e('satellite dish', 'tech', 'antennas', () =>
    m('satellite dish')
      .box([0.3, 0.06, 0.3], [0, 0.03, 0], { color: 'darkgray' })
      .stick([0, 0.06, 0], [0, 0.45, 0], 0.06, 'gray')
      .cyl([0.18, 0.1, 0.18], [0, 0.5, 0.0], { color: 'white', taper: 3.4, rot: [55, 0, 0] })
      .rod([0, 0.42, 0.06], [0, 0.6, 0.38], 0.025, 'gray')
      .box([0.06, 0.06, 0.1], [0, 0.62, 0.4], { color: 'darkgray', rot: [55, 0, 0] })
      .done(),
  ),
  e('sauce', 'food', 'sauces', () =>
    m('sauce')
      .cyl([0.22, 0.012, 0.16], [0, 0.006, 0], { color: 'white' })
      .ball([0.18, 0.09, 0.1], [0, 0.055, 0], { color: 'white' })
      .ball([0.16, 0.02, 0.085], [0, 0.095, 0], { color: '#7a4a22' })
      .cone([0.06, 0.06, 0.04], [0.1, 0.09, 0], { color: 'white', rot: [0, 0, -70] })
      .torus([0.07, 0.07, 0.015], [-0.1, 0.07, 0], { color: 'white', tube: 0.25 })
      .done(),
  ),
  e('saucer', 'sky', 'ufos', () => {
    const b = m('saucer').ball([0.4, 0.08, 0.4], [0, 0.07, 0], { color: 'silver', name: 'rotor' }).ball([0.16, 0.1, 0.16], [0, 0.11, 0], { color: 'glass', parent: 'rotor' }).ball([0.06, 0.04, 0.06], [0, 0.135, 0], { color: 'lime', parent: 'rotor' });
    for (const [x, z] of around(8, 0.17)) b.ball(0.025, [x, 0.07, z], { color: 'yellow', glow: true, parent: 'rotor' });
    return b.cone([0.12, 0.05, 0.12], [0, 0.025, 0], { color: '#c8f0a0', glow: true, taper: 0.4 }).done();
  }),
  e('sauna', 'places', 'rooms', () => {
    const b = bld('sauna', 'SAUNA', { w: 3.2, h: 2.4, d: 2.4, wall: 'lightwood', roof: 'darkwood', signBg: 'cream', door: 'wood' });
    b.each(5, (i) => b.box([3.22, 0.04, 2.42], [0, 0.25 + i * 0.45, 0], { color: 'wood', noInk: true }));
    b.cyl([0.2, 1.2, 0.2], [1.0, 3.3, -0.6], { color: 'darkgray' }).ball([0.6, 0.4, 0.6], [1.0, 4.1, -0.6], { color: 'white' }).ball([0.4, 0.3, 0.4], [1.3, 4.5, -0.6], { color: 'white' });
    return b.cyl([0.35, 0.3, 0.35], [1.2, 0.15, 1.5], { color: 'wood', taper: 1.2 }).rod([1.25, 0.3, 1.5], [1.45, 0.65, 1.6], 0.04, 'wood').done();
  }),
  e('sausage', 'food', 'meat', () => {
    const b = plate(m('sausage'), 0.22);
    for (const z of [-0.03, 0.03]) b.rod([-0.07, 0.03, z], [0.0, 0.035, z + 0.01], 0.04, '#9a4a2a').rod([0.0, 0.035, z + 0.01], [0.07, 0.03, z], 0.04, '#9a4a2a');
    return b.each(3, (i) => b.box([0.006, 0.004, 0.03], [-0.04 + i * 0.04, 0.056, 0.035], { color: 'darkbrown', noInk: true, rot: [0, 30, 0] })).rod([-0.05, 0.03, -0.075], [0.05, 0.03, -0.075], 0.012, 'yellow', { noInk: true }).done();
  }),
  e('saw', 'workshop', 'hand tools', () => {
    const b = m('saw').box([0.46, 0.09, 0.008], [-0.03, 0.075, 0], { color: 'silver', round: 0.1 }).wedge([0.46, 0.06, 0.008], [-0.03, 0.15, 0], { color: 'silver', apex: 0.5 });
    b.each(12, (i) => b.cone([0.036, 0.03, 0.008], [-0.24 + i * 0.038, 0.016, 0], { color: 'steel', rot: [180, 0, 0] }));
    return b.box([0.05, 0.2, 0.045], [0.28, 0.12, 0], { color: 'wood', round: 0.4, rot: [0, 0, -12] }).torus([0.13, 0.2, 0.045], [0.24, 0.13, 0], { color: 'wood', tube: 0.3, rot: [0, 0, -12] }).done();
  }),
  e('sawblade', 'workshop', 'power tools', () => {
    const b = m('sawblade').box([0.2, 0.03, 0.12], [0, 0.015, 0], { color: 'darkgray' }).cyl([0.28, 0.02, 0.28], [0, 0.17, 0], { color: 'silver', rot: [90, 0, 0], name: 'fan' });
    b.cyl([0.08, 0.035, 0.08], [0, 0.17, 0], { color: 'steel', rot: [90, 0, 0], parent: 'fan' }).cyl([0.025, 0.04, 0.025], [0, 0.17, 0], { color: 'black', rot: [90, 0, 0], parent: 'fan' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      b.cone([0.03, 0.025, 0.012], [Math.sin(a) * 0.145, 0.17 + Math.cos(a) * 0.145, 0], { color: 'silver', parent: 'fan', rot: [0, 0, (-a * 180) / Math.PI - 20] });
    }
    return b.done();
  }),
  e('sawdust', 'workshop', 'materials', () => {
    const b = m('sawdust').cyl([0.32, 0.1, 0.28], [0, 0.05, 0], { color: '#e0be82', taper: 0.35 }).ball([0.12, 0.06, 0.11], [0, 0.1, 0], { color: '#e8c890' });
    b.each(4, (i) => b.torus([0.04, 0.03, 0.01], surf([0, 0.04, 0], [0.13, 0.03, 0.12], i * 90 + 20, 10), { color: '#c8985a', rot: [i * 40, i * 70, 0], tube: 0.2 }));
    return b.box([0.1, 0.05, 0.05], [0.14, 0.025, -0.06], { color: 'wood', rot: [0, 25, 0] }).done();
  }),
  e('sawhorse', 'workshop', 'workbenches', () => {
    const b = m('sawhorse').box([1.0, 0.1, 0.1], [0, 0.75, 0], { color: 'wood', round: 0.1 });
    b.pair((s) => b.stick([s * 0.4, 0.72, 0], [s * 0.45, 0, 0.25], 0.06, 'lightwood').stick([s * 0.4, 0.72, 0], [s * 0.45, 0, -0.25], 0.06, 'lightwood').box([0.04, 0.06, 0.38], [s * 0.43, 0.3, 0], { color: 'lightwood' }));
    return b.done();
  }),
  e('sawmill', 'places', 'factories', () => {
    const b = bld('sawmill', 'SAWMILL', { w: 4.5, h: 3, d: 3, wall: 'wood', roof: 'darkwood', signBg: 'cream' });
    b.torus([2.4, 2.4, 0.4], [-2.6, 1.3, 0.3], { color: 'darkwood', tube: 0.12, rot: [0, 90, 0] });
    b.box([0.4, 1.4, 1.4], [3.2, 1.0, 0.5], { color: 'darkwood', round: 0.1 }).cyl([1.3, 0.06, 1.3], [3.2, 1.6, 0.5], { color: 'silver', rot: [0, 0, 90] });
    for (const [x, y, z] of [[0.6, 0.25, 2.4], [1.2, 0.25, 2.4], [0.9, 0.7, 2.4]]) b.cyl([0.5, 2.2, 0.5], [x + 0.6, y, z], { color: 'bark', rot: [0, 0, 90] }).cyl([0.4, 2.22, 0.4], [x + 0.6, y, z], { color: 'lightwood', rot: [0, 0, 90] });
    return b.done();
  }),
  e('saxophone', 'music', 'wind instruments', () => {
    const b = m('saxophone')
      .cyl([0.1, 0.55, 0.1], [0, 0.42, 0], { color: 'brass', taper: 0.55 })
      .rod([0, 0.15, 0], [0.02, 0.05, 0], 0.1, 'brass')
      .rod([0.02, 0.05, 0], [0.13, 0.05, 0], 0.1, 'brass')
      .rod([0.13, 0.05, 0], [0.17, 0.15, 0], 0.1, 'brass')
      .cyl([0.1, 0.25, 0.1], [0.18, 0.27, 0.02], { color: 'brass', taper: 1.9, rot: [8, 0, -8] })
      .rod([0, 0.69, 0], [-0.03, 0.8, 0], 0.035, 'brass')
      .rod([-0.03, 0.8, 0], [-0.13, 0.8, 0], 0.03, 'brass')
      .capsule([0.025, 0.05, 0.025], [-0.16, 0.8, 0], { color: 'black', rot: [0, 0, 90] });
    return b.each(6, (i) => b.cyl([0.028, 0.008, 0.028], [0, 0.25 + i * 0.07, 0.042 + i * -0.002], { color: 'cream', rot: [90, 0, 0] })).done();
  }),
  e('scaffold', 'workshop', 'construction', () => {
    const b = m('scaffold');
    for (const [x, z] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) b.stick([x, 0, z], [x, 3.0, z], 0.07, 'steel');
    b.each(3, (i) => {
      const y = 1.0 + i * 1.0;
      b.pair((s) => b.stick([-1, y, s * 0.4], [1, y, s * 0.4], 0.05, 'steel').stick([s, y, -0.4], [s, y, 0.4], 0.05, 'steel'));
      if (i < 2) b.box([1.95, 0.06, 0.75], [0, y + 0.04, 0], { color: 'wood', round: 0.1 });
      b.stick([-1, y - 1, 0.4], [1, y, 0.4], 0.04, 'steel');
    });
    b.box([0.6, 0.3, 0.45], [0.4, 0.15, 0.8], { color: '#b5543c', round: 0.1 }).box([0.6, 0.06, 0.5], [0.4, 0.33, 0.8], { color: 'wood' });
    return b.each(5, (i) => b.box([0.4, 0.03, 0.05], [-0.6, 0.2 + i * 0.2, 0.45], { color: 'silver' })).pair((s) => b.stick([-0.6 + s * 0.2, 0, 0.45], [-0.6 + s * 0.2, 1.1, 0.45], 0.04, 'silver')).done();
  }),
  e('scale (balance)', 'study', 'lab equipment', () => {
    const b = m('scale (balance)').cyl([0.12, 0.025, 0.12], [0, 0.0125, 0], { color: 'darkwood' }).stick([0, 0.02, 0], [0, 0.24, 0], 0.016, 'brass').stick([-0.12, 0.23, 0], [0.12, 0.23, 0], 0.012, 'brass').ball(0.025, [0, 0.25, 0], { color: 'brass' });
    return b.pair((s) => b.stick([s * 0.115, 0.23, 0], [s * 0.09, 0.08, 0], 0.003, 'brass').stick([s * 0.115, 0.23, 0], [s * 0.14, 0.08, 0], 0.003, 'brass').cyl([0.08, 0.012, 0.08], [s * 0.115, 0.075, 0], { color: 'brass', taper: 1.3 })).done();
  }),
  e('scale (organic)', 'sea', 'fish parts', () => {
    const b = m('scale (organic)').box([0.14, 0.03, 0.06], [0, 0.015, 0], { color: 'darkwood', round: 0.2 }).box([0.13, 0.11, 0.012], [0, 0.085, -0.008], { color: '#5a8a9a', round: 0.1 });
    b.each(3, (r) => b.each(4, (c) => b.cyl([0.04, 0.008, 0.04], [-0.045 + c * 0.03 + (r % 2) * 0.015, 0.13 - r * 0.03, 0.0 + r * 0.004], { color: r % 2 ? '#9fd0d8' : '#b8e0e8', rot: [90, 0, 0] })));
    return b.done();
  }),
  e('scallion', 'food', 'vegetables', () => {
    const b = m('scallion');
    b.each(3, (i) => {
      const x = (i - 1) * 0.022;
      b.cyl([0.026, 0.07, 0.026], [x, 0.045, 0], { color: 'white' }).rod([x, 0.08, 0], [x + (i - 1) * 0.03, 0.3, (i % 2) * 0.02], 0.014, 'green');
      b.rod([x, 0.01, 0], [x + 0.01, 0.0, 0.02], 0.004, 'tan').rod([x, 0.01, 0], [x - 0.012, 0.0, -0.015], 0.004, 'tan');
    });
    return b.torus([0.065, 0.03, 0.012], [0, 0.07, 0], { color: 'red', rot: [90, 0, 0], tube: 0.2 }).done();
  }),
  e('scalpel', 'clinic', 'surgery tools', () =>
    m('scalpel')
      .box([0.06, 0.025, 0.04], [0, 0.0125, 0], { color: 'darkgray', round: 0.3 })
      .box([0.012, 0.11, 0.005], [0, 0.075, 0], { color: 'silver', round: 0.3 })
      .wedge([0.012, 0.04, 0.003], [0.0, 0.15, 0], { color: 'lightgray', apex: -0.5 })
      .done(),
  ),
  e('scanner', 'tech', 'computers', () =>
    m('scanner')
      .box([0.45, 0.07, 0.32], [0, 0.035, 0], { color: 'lightgray', round: 0.2 })
      .box([0.38, 0.005, 0.26], [0, 0.071, 0.01], { color: 'glass', noInk: true })
      .box([0.45, 0.03, 0.32], [0, 0.17, -0.06], { color: 'gray', round: 0.2, rot: [-35, 0, 0], name: 'lid', pivot: [0, 0.075, -0.16] })
      .box([0.38, 0.01, 0.03], [0, 0.074, 0.05], { color: 'cyan', glow: true })
      .ball(0.015, [0.18, 0.06, 0.155], { color: 'lime', glow: true })
      .done(),
  ),
  e('scarecrow', 'farm', 'farm things', () => {
    const b = m('scarecrow').stick([0, 0, 0], [0, 1.6, 0], 0.08, 'wood').box([1.3, 0.07, 0.07], [0, 1.28, -0.06], { color: 'wood' })
      .box([0.42, 0.55, 0.24], [0, 1.08, 0], { color: '#c0503a', round: 0.3 })
      .box([0.44, 0.12, 0.25], [0, 0.8, 0], { color: 'denim', round: 0.3 })
      .ball([0.26, 0.28, 0.24], [0, 1.52, 0], { color: '#d6b47a' })
      .cyl([0.5, 0.03, 0.5], [0, 1.62, 0], { color: '#e8c95a' })
      .cyl([0.26, 0.14, 0.26], [0, 1.7, 0], { color: '#e8c95a', taper: 0.8 })
      .box([0.08, 0.08, 0.01], [0.1, 1.0, 0.125], { color: 'yellow', noInk: true, rot: [0, 0, 20] })
      .rod([-0.06, 1.44, 0.12], [0.06, 1.44, 0.12], 0.01, 'black');
    b.pair((s) => {
      b.rod([s * 0.2, 1.28, 0], [s * 0.58, 1.28, 0], 0.13, '#c0503a');
      b.cone([0.08, 0.12, 0.06], [s * 0.68, 1.28, 0], { color: '#e8c95a', rot: [0, 0, s * -90] });
      b.rod([s * 0.1, 0.8, 0], [s * 0.12, 0.42, 0.03], 0.13, 'denim');
      b.cone([0.08, 0.1, 0.06], [s * 0.12, 0.33, 0.03], { color: '#e8c95a', rot: [180, 0, 0] });
      b.box([0.05, 0.05, 0.01], [s * 0.06, 1.55, 0.12], { color: 'black', rot: [0, 0, 45], noInk: true });
    });
    return b.done();
  }),
  e('scarf', 'wardrobe', 'winter wear', () => {
    const b = m('scarf').cyl([0.3, 0.04, 0.3], [0, 0.02, 0], { color: 'darkwood' }).cyl([0.12, 0.62, 0.12], [0, 0.33, 0], { color: 'beige' }).ball([0.2, 0.12, 0.18], [0, 0.66, 0], { color: 'beige' });
    b.torus([0.24, 0.24, 0.1], [0, 0.58, 0], { color: 'red', rot: [90, 0, 0], tube: 0.35 });
    b.box([0.1, 0.36, 0.03], [0.03, 0.38, 0.1], { color: 'red', round: 0.3, rot: [0, 0, -6] }).box([0.1, 0.3, 0.03], [-0.07, 0.42, 0.08], { color: 'red', round: 0.3, rot: [0, 0, 10] });
    b.each(3, (i) => b.box([0.102, 0.03, 0.032], [0.03 + i * 0.003, 0.28 + i * 0.08, 0.1], { color: 'white', round: 0.3, rot: [0, 0, -6], noInk: true }));
    return b.each(4, (i) => b.stick([-0.01 + i * 0.025, 0.2, 0.1], [-0.01 + i * 0.025, 0.15, 0.1], 0.01, 'red')).done();
  }),
  e('scepter', 'fantasy', 'royal things', () =>
    m('scepter')
      .cyl([0.22, 0.08, 0.22], [0, 0.04, 0], { color: 'darkred' })
      .ball(0.05, [0, 0.1, 0], { color: 'gold' })
      .cyl([0.03, 0.62, 0.03], [0, 0.42, 0], { color: 'gold' })
      .torus([0.06, 0.06, 0.03], [0, 0.4, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.4 })
      .cyl([0.08, 0.06, 0.08], [0, 0.74, 0], { color: 'gold', taper: 1.5 })
      .ball(0.11, [0, 0.82, 0], { color: 'purple' })
      .box([0.025, 0.1, 0.025], [0, 0.92, 0], { color: 'gold' })
      .box([0.07, 0.025, 0.025], [0, 0.93, 0], { color: 'gold' })
      .done(),
  ),
  e('school', 'places', 'schools', () => {
    const b = bld('school', 'SCHOOL', { w: 7, h: 3.4, d: 3.5, wall: '#c0603e', flat: true, roof: 'darkgray', door: 'white', signBg: 'white' });
    b.pair((s) => b.box([0.8, 0.8, 0.06], [s * 1.0, 1.5, 1.78], { color: 'glass', round: 0.1 }).box([0.8, 0.8, 0.06], [s * 1.0, 2.6, 1.78], { color: 'glass', round: 0.1 }).box([0.8, 0.8, 0.06], [s * 2.8, 2.6, 1.78], { color: 'glass', round: 0.1 }));
    b.box([1.3, 1.4, 1.3], [0, 4.2, 0], { color: '#c0603e', round: 0.05 }).wedge([1.6, 0.8, 1.6], [0, 5.3, 0], { color: 'darkred' }).cyl([0.8, 0.06, 0.8], [0, 4.25, 0.66], { color: 'white', rot: [90, 0, 0] });
    return b.stick([4.0, 0, 1.5], [4.0, 4.5, 1.5], 0.08, 'silver').box([0.06, 0.6, 0.9], [4.0, 4.1, 1.95], { color: 'red', round: 0.1 }).done();
  }),
  e('school bell', 'study', 'school things', () =>
    m('school bell')
      .box([0.4, 0.06, 0.2], [0, 0.03, 0], { color: 'darkwood' })
      .stick([0.15, 0.06, 0], [0.15, 0.48, 0], 0.04, 'wood')
      .stick([-0.15, 0.06, 0], [-0.15, 0.48, 0], 0.04, 'wood')
      .box([0.38, 0.05, 0.06], [0, 0.48, 0], { color: 'wood' })
      .cyl([0.2, 0.2, 0.2], [0, 0.32, 0], { color: 'brass', taper: 0.55 })
      .ball([0.11, 0.07, 0.11], [0, 0.42, 0], { color: 'brass' })
      .torus([0.21, 0.21, 0.02], [0, 0.225, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.15 })
      .ball(0.045, [0, 0.2, 0], { color: 'iron' })
      .stick([0.1, 0.4, 0], [0.12, 0.1, 0.05], 0.012, 'tan')
      .done(),
  ),
  e('school bus', 'garage', 'buses', () => {
    const b = m('school bus', { view: 'side' })
      .box([2.4, 2.1, 8.0], [0, 1.65, -0.5], { color: 'yellow', round: 0.15 })
      .box([2.3, 1.2, 1.6], [0, 1.15, 4.2], { color: 'yellow', round: 0.3 })
      .box([2.44, 0.12, 8.0], [0, 1.6, -0.5], { color: 'black', noInk: true })
      .box([2.44, 0.12, 8.0], [0, 1.1, -0.5], { color: 'black', noInk: true })
      .box([2.0, 0.25, 0.2], [0, 0.7, 5.0], { color: 'black', round: 0.3 })
      .box([2.0, 0.7, 0.06], [0, 2.1, 3.48], { color: 'glass' })
      .label('SCHOOL BUS', [1.6, 0.3], [0, 2.55, 3.52], { color: 'yellow' });
    b.each(7, (i) => b.box([2.44, 0.6, 0.8], [0, 2.15, -4.0 + i * 1.0], { color: 'glass', round: 0.2 }));
    b.box([0.04, 0.4, 0.4], [1.24, 1.8, 2.8], { color: 'red' });
    return wheels(b, [3.2, -2.8], 1.2, 1.0, 'black').done();
  }),
  e('school desk', 'study', 'school furniture', () => {
    const b = m('school desk').box([0.65, 0.05, 0.45], [0, 0.72, 0.15], { color: 'lightwood', round: 0.2 }).box([0.6, 0.12, 0.4], [0, 0.63, 0.15], { color: 'steel', round: 0.2 })
      .box([0.42, 0.05, 0.4], [0, 0.42, -0.35], { color: 'lightwood', round: 0.3 }).box([0.42, 0.3, 0.04], [0, 0.68, -0.56], { color: 'lightwood', round: 0.3 });
    b.pair((s) => b.stick([s * 0.28, 0, 0.3], [s * 0.28, 0.6, 0.3], 0.04, 'steel').stick([s * 0.18, 0, -0.5], [s * 0.18, 0.84, -0.54], 0.035, 'steel').stick([s * 0.18, 0, -0.2], [s * 0.18, 0.42, -0.2], 0.035, 'steel').stick([s * 0.28, 0.02, 0.3], [s * 0.18, 0.02, -0.5], 0.035, 'steel'));
    return b.box([0.2, 0.03, 0.26], [-0.1, 0.76, 0.15], { color: 'red', round: 0.2 }).stick([0.12, 0.755, 0.1], [0.24, 0.755, 0.2], 0.01, 'yellow').done();
  }),
  e('schoolhouse', 'places', 'schools', () => {
    const b = bld('schoolhouse', 'SCHOOL', { w: 4.4, h: 3, d: 4, wall: 'darkred', roof: 'darkgray', door: 'white', signBg: 'white', win: 'cream' });
    b.box([1.0, 1.0, 1.0], [0, 4.3, 1.2], { color: 'white', round: 0.05 }).cone([1.4, 1.1, 1.4], [0, 5.35, 1.2], { color: 'darkgray', segs: 4 });
    return b.cyl([0.5, 0.5, 0.5], [0, 4.25, 1.2], { color: 'brass', taper: 0.6 }).box([0.06, 0.6, 0.06], [0, 6.1, 1.2], { color: 'gold' }).done();
  }),
  e('science museum', 'places', 'museums', () => {
    const b = bld('science museum', 'SCIENCE MUSEUM', { w: 7, h: 3.4, d: 4, wall: 'white', flat: true, roof: 'teal', door: 'teal', signBg: 'navy' });
    b.cyl([3.0, 0.6, 3.0], [0, 3.8, -0.4], { color: 'lightgray' }).ball([3.0, 2.4, 3.0], [0, 4.1, -0.4], { color: 'skyblue' });
    b.cyl([0.6, 3.6, 0.6], [4.6, 2.0, 1.6], { color: 'white' }).cone([0.6, 1.0, 0.6], [4.6, 4.3, 1.6], { color: 'red' });
    for (const [x, z] of around(3, 0.45)) b.wedge([0.5, 0.8, 0.08], [4.6 + x, 0.4, 1.6 + z], { color: 'red', rot: [0, Math.atan2(x, z) / D2R + 90, 0] });
    return b.torus([1.6, 0.7, 0.08], [0, 5.6, -0.4], { color: 'gold', rot: [0, 0, 30], tube: 0.1 }).torus([1.6, 0.7, 0.08], [0, 5.6, -0.4], { color: 'gold', rot: [0, 0, -30], tube: 0.1 }).ball(0.3, [0, 5.6, -0.4], { color: 'red' }).done();
  }),
  e('scissors', 'study', 'stationery', () =>
    m('scissors')
      .rod([0.03, 0.06, 0], [-0.03, 0.2, 0], 0.016, 'silver')
      .rod([-0.03, 0.06, 0.004], [0.03, 0.2, 0.004], 0.016, 'silver')
      .cyl([0.012, 0.02, 0.012], [0, 0.1, 0.004], { color: 'darkgray', rot: [90, 0, 0] })
      .torus([0.05, 0.06, 0.016], [0.035, 0.035, 0], { color: 'red', tube: 0.25 })
      .torus([0.05, 0.06, 0.016], [-0.035, 0.035, 0.004], { color: 'red', tube: 0.25 })
      .done(),
  ),
  e('scoop', 'kitchen', 'utensils', () =>
    m('scoop')
      .ball([0.1, 0.06, 0.1], [0, 0.03, 0], { color: 'silver' })
      .torus([0.1, 0.1, 0.012], [0, 0.05, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.1 })
      .rod([-0.045, 0.05, 0], [-0.07, 0.3, 0], 0.016, 'silver')
      .torus([0.04, 0.04, 0.012], [-0.07, 0.31, 0], { color: 'silver', tube: 0.25 })
      .done(),
  ),
  e('scooter', 'garage', 'bikes', () => {
    const b = m('scooter', { view: 'side' })
      .box([0.14, 0.08, 0.62], [0, 0.11, -0.05], { color: 'blue', round: 0.4 })
      .rod([0, 0.1, 0.28], [0, 0.9, 0.32], 0.04, 'silver')
      .stick([-0.22, 0.92, 0.32], [0.22, 0.92, 0.32], 0.035, 'silver')
      .capsule([0.045, 0.1, 0.045], [0.25, 0.92, 0.32], { color: 'black', rot: [0, 0, 90] })
      .capsule([0.045, 0.1, 0.045], [-0.25, 0.92, 0.32], { color: 'black', rot: [0, 0, 90] })
      .box([0.08, 0.02, 0.16], [0, 0.16, -0.38], { color: 'darkgray', rot: [-15, 0, 0] });
    b.torus([0.2, 0.2, 0.06], [0, 0.1, 0.33], { color: 'rubber', rot: [0, 90, 0], tube: 0.4, name: 'wheel' });
    return b.torus([0.2, 0.2, 0.06], [0, 0.1, -0.38], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 }).done();
  }),
  e('scoreboard', 'sports', 'stadium things', () => {
    const b = m('scoreboard').box([2.4, 1.3, 0.25], [0, 2.3, 0], { color: 'black', round: 0.1 });
    b.pair((s) => {
      b.stick([s * 0.9, 0, -0.05], [s * 0.9, 1.7, -0.05], 0.15, 'gray');
      b.label(s > 0 ? 'GUEST' : 'HOME', [0.8, 0.2], [s * 0.6, 2.75, 0.14], { color: 'black' });
      b.box([0.7, 0.5, 0.05], [s * 0.6, 2.25, 0.13], { color: 'darkgray', round: 0.1 }).box([0.22, 0.38, 0.04], [s * 0.6 - 0.14, 2.25, 0.16], { color: 'red', glow: true }).box([0.22, 0.38, 0.04], [s * 0.6 + 0.14, 2.25, 0.16], { color: 'red', glow: true });
    });
    return b.box([0.5, 0.25, 0.05], [0, 1.8, 0.14], { color: 'yellow', glow: true }).done();
  }),
  e('scraper (tool)', 'workshop', 'hand tools', () =>
    m('scraper (tool)')
      .box([0.08, 0.08, 0.004], [0, 0.04, 0], { color: 'silver', round: 0.1 })
      .box([0.03, 0.02, 0.012], [0, 0.09, 0], { color: 'silver' })
      .capsule([0.032, 0.13, 0.028], [0, 0.17, 0], { color: 'red' })
      .done(),
  ),
  e('screen door', 'home', 'doors', () => {
    const b = m('screen door').box([1.2, 0.2, 0.4], [0, 0.1, 0.1], { color: 'stone', round: 0.1 }).box([1.1, 0.1, 0.12], [0, 2.2, 0], { color: 'white' });
    b.pair((s) => b.box([0.1, 2.1, 0.12], [s * 0.5, 1.15, 0], { color: 'white' }));
    b.box([0.85, 1.95, 0.04], [0, 1.13, 0.07], { color: '#9aa4aa', name: 'door', pivot: [-0.43, 1.13, 0.07] });
    for (const [y, h] of [[0.2, 0.12], [1.13, 0.1], [2.07, 0.08]] as Array<[number, number]>) b.box([0.86, h, 0.05], [0, y, 0.08], { color: 'wood', parent: 'door' });
    b.pair((s) => b.box([0.08, 1.95, 0.05], [s * 0.4, 1.13, 0.08], { color: 'wood', parent: 'door' }));
    return b.box([0.03, 0.12, 0.04], [0.33, 1.05, 0.12], { color: 'brass', parent: 'door' }).done();
  }),
  e('screw', 'workshop', 'hardware', () => {
    const b = m('screw').cyl([0.04, 0.012, 0.04], [0, 0.094, 0], { color: 'silver' }).box([0.03, 0.004, 0.006], [0, 0.1, 0], { color: 'darkgray' })
      .cyl([0.018, 0.06, 0.018], [0, 0.058, 0], { color: 'silver' }).cone([0.018, 0.03, 0.018], [0, 0.014, 0], { color: 'silver', rot: [180, 0, 0] });
    return b.each(6, (i) => b.torus([0.026, 0.026, 0.004], [0, 0.03 + i * 0.01, 0], { color: 'steel', rot: [82, 0, 0], tube: 0.2 })).done();
  }),
  e('screwdriver', 'workshop', 'hand tools', () =>
    m('screwdriver')
      .cyl([0.035, 0.09, 0.035], [0, 0.045, 0], { color: 'red' })
      .cyl([0.037, 0.03, 0.037], [0, 0.06, 0], { color: 'yellow' })
      .cyl([0.006, 0.1, 0.006], [0, 0.14, 0], { color: 'silver' })
      .box([0.008, 0.012, 0.002], [0, 0.195, 0], { color: 'silver' })
      .done(),
  ),
  e('scroll', 'study', 'paper things', () => {
    const b = m('scroll').box([0.2, 0.24, 0.01], [0, 0.15, 0], { color: '#efdcaa', round: 0.1 });
    for (const y of [0.025, 0.275]) b.cyl([0.035, 0.24, 0.035], [0, y, 0], { color: 'darkwood', rot: [0, 0, 90] }).pair((s) => b.ball(0.04, [s * 0.13, y, 0], { color: 'gold' }));
    b.each(6, (i) => b.box([0.14 - (i % 3) * 0.02, 0.008, 0.004], [-0.01 * (i % 2), 0.22 - i * 0.025, 0.006], { color: 'darkbrown', noInk: true }));
    return b.cyl([0.04, 0.008, 0.04], [0.05, 0.07, 0.006], { color: 'darkred', rot: [90, 0, 0] }).done();
  }),
  e('scrubs', 'wardrobe', 'workwear', () => {
    const c = '#4fa3a5';
    const b = garment(m('scrubs'), { w: 0.5, len: 0.62, y0: 0.88, color: c, sleeve: 0.22 });
    b.wedge([0.14, 0.16, 0.04], [0, 1.43, 0.09], { color: '#3a7f80', rot: [0, 0, 180] }).box([0.1, 0.1, 0.02], [0.13, 1.25, 0.105], { color: '#3a7f80' });
    return b.pair((s) => b.box([0.21, 0.9, 0.2], [s * 0.12, 0.46, 0], { color: c, round: 0.3 })).done();
  }),
  e('scuba gear', 'sports', 'diving', () => {
    const b = m('scuba gear')
      .cyl([0.2, 0.62, 0.2], [0, 0.39, -0.05], { color: 'yellow' })
      .ball([0.2, 0.1, 0.2], [0, 0.7, -0.05], { color: 'yellow' })
      .cyl([0.05, 0.08, 0.05], [0, 0.78, -0.05], { color: 'silver' })
      .box([0.08, 0.06, 0.06], [0, 0.82, -0.05], { color: 'black' })
      .box([0.3, 0.5, 0.06], [0, 0.45, 0.07], { color: 'black', round: 0.3 })
      .rod([0.04, 0.82, -0.02], [0.18, 0.7, 0.12], 0.025, 'black')
      .ball(0.06, [0.18, 0.68, 0.14], { color: 'darkgray' })
      .box([0.2, 0.08, 0.05], [0, 0.6, 0.12], { color: 'black', round: 0.5 })
      .box([0.16, 0.06, 0.03], [0, 0.6, 0.15], { color: 'glass', round: 0.5 });
    b.pair((s) => b.box([0.16, 0.02, 0.5], [s * 0.12, 0.01, 0.4], { color: 'blue', round: 0.6 }).box([0.12, 0.06, 0.12], [s * 0.12, 0.04, 0.2], { color: 'black', round: 0.5 }));
    return b.done();
  }),
  e('scythe', 'farm', 'farm tools', () =>
    m('scythe')
      .ball([0.5, 0.3, 0.4], [0, 0.0, 0], { color: 'grass' })
      .stick([0, 0, 0], [0.05, 1.65, 0], 0.045, 'wood')
      .rod([0.02, 0.55, 0], [0.14, 0.58, 0.04], 0.03, 'wood')
      .rod([0.04, 1.1, 0], [0.16, 1.15, 0.04], 0.03, 'wood')
      .rod([0.05, 1.62, 0], [-0.25, 1.7, 0.02], 0.1, 'steel')
      .rod([-0.25, 1.7, 0.02], [-0.55, 1.62, 0.04], 0.08, 'steel')
      .rod([-0.55, 1.62, 0.04], [-0.78, 1.42, 0.06], 0.05, 'steel')
      .done(),
  ),
  e('sea shell', 'sea', 'shells', () => {
    const b = m('sea shell').ball([0.1, 0.08, 0.03], [0, 0.05, -0.005], { color: 'peach' }).box([0.05, 0.02, 0.025], [0, 0.01, 0], { color: 'peach', round: 0.4 });
    b.each(7, (i) => {
      const a = (-60 + i * 20) * D2R;
      b.rod([0, 0.01, 0.008], [Math.sin(a) * 0.05, 0.01 + Math.cos(a) * 0.075, 0.008], 0.012, i % 2 ? '#f6b89a' : 'pink');
    });
    return b.done();
  }),
  e('seat belt', 'garage', 'car parts', () =>
    m('seat belt')
      .box([0.55, 0.15, 0.55], [0, 0.32, 0.05], { color: 'darkgray', round: 0.4 })
      .box([0.5, 0.18, 0.45], [0, 0.45, 0.05], { color: 'gray', round: 0.6 })
      .box([0.52, 0.75, 0.16], [0, 0.85, -0.25], { color: 'gray', round: 0.5, rot: [-10, 0, 0] })
      .box([0.3, 0.18, 0.12], [0, 1.32, -0.3], { color: 'gray', round: 0.6 })
      .stick([0, 0, 0], [0, 0.25, 0], 0.12, 'black')
      .box([0.06, 0.7, 0.02], [0.03, 0.88, -0.13], { color: 'black', rot: [-10, 0, 40] })
      .box([0.5, 0.06, 0.02], [0.0, 0.58, 0.3], { color: 'black' })
      .box([0.08, 0.05, 0.04], [-0.22, 0.58, 0.31], { color: 'silver' })
      .box([0.1, 0.12, 0.05], [-0.28, 0.52, 0.2], { color: 'black', round: 0.3 })
      .box([0.08, 0.06, 0.03], [0.24, 1.25, -0.18], { color: 'black' })
      .done(),
  ),
  e('seaweed (plant)', 'sea', 'sea plants', () => {
    const b = m('seaweed (plant)').ball([0.5, 0.25, 0.4], [0, 0.05, 0], { color: 'rock' });
    b.rod([0, 0.1, 0], [0.05, 0.5, 0], 0.04, 'olive').rod([0.05, 0.5, 0], [-0.03, 0.75, 0.02], 0.035, 'olive', { name: 'top', pivot: [0.05, 0.5, 0] }).rod([-0.03, 0.75, 0.02], [0.05, 1.0, 0], 0.03, 'olive', { parent: 'top' });
    for (const [x, y, r] of [[0.08, 0.3, -30], [-0.04, 0.42, 30], [0.1, 0.6, -30], [-0.06, 0.7, 30], [0.07, 0.88, -30]]) b.ball([0.1, 0.18, 0.03], [x, y, 0.01], { color: y > 0.5 ? 'green' : 'darkgreen', rot: [0, 0, r], parent: y > 0.5 ? 'top' : undefined });
    return b.rod([-0.1, 0.1, 0.05], [-0.15, 0.55, 0.06], 0.03, 'darkgreen').ball([0.08, 0.16, 0.03], [-0.18, 0.45, 0.07], { color: 'green', rot: [0, 0, 20] }).done();
  }),
  e('security camera', 'tech', 'gadgets', () =>
    m('security camera')
      .box([0.08, 0.2, 0.03], [0, 0.1, -0.08], { color: 'white', round: 0.2 })
      .rod([0, 0.16, -0.065], [0, 0.16, 0.0], 0.025, 'white')
      .box([0.07, 0.07, 0.18], [0, 0.15, 0.06], { color: 'white', round: 0.3, rot: [15, 0, 0] })
      .cyl([0.05, 0.02, 0.05], [0, 0.13, 0.15], { color: 'black', rot: [105, 0, 0] })
      .cyl([0.03, 0.02, 0.03], [0, 0.128, 0.16], { color: 'glass', rot: [105, 0, 0] })
      .ball(0.01, [0.025, 0.175, 0.13], { color: 'red', glow: true })
      .done(),
  ),
  e('seed', 'garden', 'plant parts', () =>
    m('seed')
      .ball([0.16, 0.06, 0.14], [0, 0.0, 0], { color: 'dirt' })
      .ball([0.05, 0.035, 0.035], [0, 0.04, 0.01], { color: '#a0683a', rot: [0, 0, 15] })
      .rod([0.01, 0.05, 0.01], [0.0, 0.085, 0.01], 0.008, 'lime')
      .ball([0.025, 0.01, 0.015], [0.014, 0.09, 0.01], { color: 'lime', rot: [0, 0, 30] })
      .ball([0.025, 0.01, 0.015], [-0.012, 0.09, 0.01], { color: 'lime', rot: [0, 0, -30] })
      .done(),
  ),
  e('seesaw', 'sports', 'playground', () => {
    const b = m('seesaw').wedge([0.5, 0.42, 0.5], [0, 0.21, 0], { color: 'red' }).box([2.6, 0.07, 0.3], [0, 0.48, 0], { color: 'yellow', rot: [0, 0, 12], round: 0.2 });
    return b.pair((s) => b.stick([s * 1.0, 0.48 + s * 0.21, -0.12], [s * 1.0, 0.68 + s * 0.21, -0.12], 0.04, 'blue').stick([s * 1.0, 0.68 + s * 0.21, -0.12], [s * 1.0, 0.68 + s * 0.21, 0.12], 0.04, 'blue').box([0.3, 0.06, 0.32], [s * 1.15, 0.53 + s * 0.245, 0], { color: 'blue', rot: [0, 0, 12], round: 0.3 })).done();
  }),
  e('semi trailer', 'garage', 'trucks', () => {
    const b = m('semi trailer', { view: 'side' })
      .box([2.5, 2.8, 8.4], [0, 2.4, -2.0], { color: 'white', round: 0.05 })
      .box([2.4, 2.4, 2.0], [0, 1.85, 4.0], { color: 'red', round: 0.25 })
      .box([2.3, 0.8, 1.2], [0, 1.05, 5.3], { color: 'red', round: 0.3 })
      .box([2.42, 0.9, 0.06], [0, 2.4, 5.02], { color: 'glass' })
      .box([2.2, 0.9, 1.4], [0, 3.4, 3.8], { color: 'red', round: 0.5 })
      .box([2.0, 0.4, 7.0], [0, 0.75, 0.6], { color: 'darkgray' })
      .box([2.0, 0.4, 0.15], [0, 0.95, 5.9], { color: 'silver' })
      .label('FREIGHT', [3.0, 0.8], [1.26, 2.5, -2.0], { color: 'white', rot: [0, 90, 0] });
    b.pair((s) => b.stick([s * 1.1, 2.6, 3.0], [s * 1.1, 4.0, 3.0], 0.15, 'silver'));
    wheels(b, [4.6], 1.15, 1.1, 'silver');
    return wheels(b, [2.9, 1.8, -4.2, -5.3], 1.15, 1.1, 'silver', false).done();
  }),
  e('septic tank', 'workshop', 'plumbing', () =>
    m('septic tank')
      .ball([3.6, 0.5, 2.0], [0, 0.0, 0], { color: 'dirt' })
      .capsule([1.4, 2.6, 1.4], [0, 0.8, 0], { color: 'darkgray', rot: [0, 0, 90] })
      .cyl([0.6, 0.5, 0.6], [-0.6, 1.6, 0], { color: 'green' })
      .cyl([0.6, 0.5, 0.6], [0.6, 1.6, 0], { color: 'green' })
      .cyl([0.66, 0.08, 0.66], [-0.6, 1.88, 0], { color: 'black' })
      .cyl([0.66, 0.08, 0.66], [0.6, 1.88, 0], { color: 'black' })
      .stick([-2.4, 1.1, 0], [-1.7, 1.1, 0], 0.18, 'white')
      .stick([1.7, 0.9, 0], [2.4, 0.9, 0], 0.18, 'white')
      .done(),
  ),
  e('sequin', 'wardrobe', 'sewing', () => {
    const b = m('sequin');
    for (const [x, y, z, c, r] of [[0, 0.025, 0, 'gold', 0], [0.035, 0.02, 0.01, 'pink', 30], [-0.035, 0.02, -0.01, 'silver', -25], [0.012, 0.012, 0.03, 'cyan', 70], [-0.015, 0.01, 0.035, 'magenta', 80]] as Array<[number, number, number, string, number]>) b.torus([0.045, 0.045, 0.008], [x, y, z], { color: c, tube: 0.42, rot: [r, r * 0.6, 0] });
    return b.done();
  }),
  e('sewer (place)', 'places', 'underground', () => {
    const brick = '#8a4a34';
    const b = m('sewer (place)').box([4, 0.3, 3], [0, 0.15, 0], { color: 'stone', round: 0.05 })
      .cyl([3.1, 0.1, 3.1], [0, 1.75, -1.2], { color: '#2a2726', rot: [90, 0, 0] })
      .torus([3.6, 3.6, 0.5], [0, 1.75, 1.1], { color: brick, tube: 0.13 })
      .torus([3.6, 3.6, 0.5], [0, 1.75, -1.1], { color: brick, tube: 0.13 })
      .box([1.4, 0.12, 2.6], [0, 0.34, 0], { color: '#5a8a5a' })
      .box([0.7, 0.4, 2.6], [1.1, 0.5, 0], { color: 'stone' })
      .box([0.7, 0.4, 2.6], [-1.1, 0.5, 0], { color: 'stone' })
      .cyl([0.9, 0.1, 0.9], [0, 1.4, -1.12], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([1.1, 0.12, 1.1], [0, 3.6, 0.3], { color: 'iron' })
      .ball([0.2, 0.12, 0.3], [-1.1, 0.76, 0.6], { color: 'gray' });
    b.pair((s) => b.box([0.3, 3.1, 2.4], [s * 1.6, 1.55, 0], { color: brick, round: 0.05 }));
    return b.stick([0.4, 0.7, 0.5], [0.4, 3.5, 0.5], 0.05, 'steel').stick([0.75, 0.7, 0.5], [0.75, 3.3, 0.5], 0.05, 'steel').each(6, (i) => b.stick([0.4, 0.9 + i * 0.4, 0.5], [0.75, 0.9 + i * 0.4, 0.5], 0.04, 'steel')).done();
  }),
  e('sewing kit', 'wardrobe', 'sewing', () => {
    const b = m('sewing kit').box([0.24, 0.06, 0.16], [0, 0.03, 0], { color: 'tan', round: 0.2 }).box([0.24, 0.12, 0.02], [0, 0.11, -0.09], { color: 'tan', round: 0.2, rot: [-15, 0, 0], name: 'lid', pivot: [0, 0.06, -0.08] });
    ['red', 'blue', 'yellow', 'green'].forEach((c, i) => b.cyl([0.03, 0.04, 0.03], [-0.08 + i * 0.035, 0.08, -0.03], { color: c }).cyl([0.036, 0.006, 0.036], [-0.08 + i * 0.035, 0.1, -0.03], { color: 'lightwood' }));
    b.ball([0.06, 0.05, 0.06], [0.08, 0.08, 0.03], { color: 'tomato' }).stick([0.08, 0.1, 0.03], [0.09, 0.13, 0.04], 0.003, 'silver').stick([0.07, 0.1, 0.03], [0.06, 0.13, 0.03], 0.003, 'silver');
    return b.ball(0.008, [0.09, 0.13, 0.04], { color: 'red' }).ball(0.008, [0.06, 0.13, 0.03], { color: 'yellow' }).done();
  }),
  e('sewing machine', 'wardrobe', 'sewing', () =>
    m('sewing machine')
      .box([0.42, 0.05, 0.2], [0, 0.025, 0], { color: 'cream', round: 0.3 })
      .box([0.1, 0.2, 0.15], [0.14, 0.15, 0], { color: 'cream', round: 0.3 })
      .box([0.38, 0.08, 0.14], [0.0, 0.27, 0], { color: 'cream', round: 0.4 })
      .box([0.07, 0.1, 0.1], [-0.15, 0.2, 0], { color: 'cream', round: 0.3 })
      .stick([-0.15, 0.15, 0.02], [-0.15, 0.06, 0.02], 0.006, 'silver')
      .box([0.4, 0.012, 0.15], [0, 0.29, 0.0], { color: 'teal', noInk: true })
      .cyl([0.12, 0.03, 0.12], [0.205, 0.23, 0], { color: 'silver', rot: [0, 0, 90] })
      .stick([0.05, 0.31, 0], [0.05, 0.36, 0], 0.008, 'silver')
      .cyl([0.03, 0.035, 0.03], [0.05, 0.345, 0], { color: 'red' })
      .done(),
  ),
  e('shackles', 'armory', 'restraints', () => {
    const b = m('shackles');
    b.pair((s) => b.torus([0.11, 0.11, 0.025], [s * 0.13, 0.055, 0], { color: 'iron', tube: 0.18 }).box([0.03, 0.035, 0.03], [s * 0.13, 0.105, 0], { color: 'steel' }));
    return b.each(5, (i) => b.torus([0.04, 0.03, 0.01], [-0.08 + i * 0.04, 0.03 + Math.abs(i - 2) * 0.012, 0.02], { color: 'steel', tube: 0.3, rot: [i % 2 ? 90 : 0, 0, 0] })).done();
  }),
  e('shampoo', 'home', 'bathroom', () =>
    m('shampoo')
      .box([0.09, 0.18, 0.05], [0, 0.11, 0], { color: 'teal', round: 0.6 })
      .box([0.06, 0.035, 0.04], [0, 0.0175, 0], { color: 'white', round: 0.4 })
      .box([0.07, 0.07, 0.005], [0, 0.11, 0.026], { color: 'white', noInk: true, round: 0.3 })
      .ball(0.04, [0.07, 0.2, 0.02], { color: 'glass' })
      .ball(0.025, [0.09, 0.24, 0.0], { color: 'glass' })
      .done(),
  ),
  e('shaver', 'home', 'bathroom', () =>
    m('shaver')
      .box([0.05, 0.13, 0.035], [0, 0.065, 0], { color: 'black', round: 0.6 })
      .box([0.045, 0.06, 0.008], [0, 0.07, 0.018], { color: 'silver', round: 0.5 })
      .ball(0.012, [0, 0.06, 0.022], { color: 'blue', glow: true })
      .box([0.07, 0.025, 0.045], [0, 0.14, 0], { color: 'darkgray', round: 0.3 })
      .capsule([0.025, 0.065, 0.03], [0, 0.16, 0], { color: 'silver', rot: [0, 0, 90] })
      .done(),
  ),
  e('shears', 'garden', 'garden tools', () =>
    m('shears')
      .rod([0.03, 0.08, 0], [0.0, 0.17, 0], 0.016, 'silver')
      .rod([0.0, 0.17, 0], [-0.02, 0.2, 0], 0.012, 'silver')
      .rod([-0.03, 0.08, 0.006], [0.015, 0.18, 0.006], 0.014, 'steel')
      .cyl([0.016, 0.02, 0.016], [0, 0.1, 0.004], { color: 'darkgray', rot: [90, 0, 0] })
      .rod([0.015, 0.09, 0], [0.06, 0.005, 0], 0.024, 'red')
      .rod([-0.015, 0.09, 0.006], [-0.06, 0.005, 0.006], 0.024, 'red')
      .done(),
  ),
  e('sheath', 'armory', 'swords', () =>
    m('sheath')
      .box([0.08, 0.03, 0.06], [0, 0.015, 0], { color: 'darkwood' })
      .cyl([0.045, 0.15, 0.025], [0, 0.1, 0], { color: 'leather', taper: 1.3 })
      .cyl([0.03, 0.025, 0.02], [0, 0.04, 0], { color: 'brass' })
      .cyl([0.062, 0.015, 0.032], [0, 0.17, 0], { color: 'brass' })
      .box([0.1, 0.015, 0.025], [0, 0.185, 0], { color: 'brass' })
      .cyl([0.02, 0.06, 0.02], [0, 0.22, 0], { color: 'darkbrown' })
      .ball(0.03, [0, 0.255, 0], { color: 'brass' })
      .done(),
  ),
  e('shed', 'places', 'sheds', () => {
    const b = m('shed').box([2.4, 2.0, 1.8], [0, 1.0, 0], { color: 'wood', round: 0.03 }).wedge([2.7, 0.9, 2.1], [0, 2.45, 0], { color: 'darkgreen' });
    b.each(7, (i) => b.box([0.03, 2.0, 0.02], [-1.05 + i * 0.35, 1.0, 0.91], { color: 'darkwood', noInk: true }));
    b.box([0.8, 1.6, 0.06], [-0.4, 0.82, 0.93], { color: 'lightwood', name: 'door', pivot: [-0.8, 0.82, 0.93] }).rod([-0.75, 0.2, 0.97], [-0.05, 1.4, 0.97], 0.06, 'darkwood', { parent: 'door' });
    b.box([0.6, 0.5, 0.06], [0.6, 1.3, 0.93], { color: 'glass', round: 0.1 }).box([0.62, 0.05, 0.08], [0.6, 1.3, 0.94], { color: 'white' });
    return b.cyl([0.35, 0.3, 0.35], [0.7, 0.15, 1.2], { color: '#c87a4a', taper: 1.2 }).ball([0.4, 0.3, 0.4], [0.7, 0.38, 1.2], { color: 'leaf' }).done();
  }),
  e('sheet music', 'music', 'music things', () => {
    const b = m('sheet music').cyl([0.35, 0.09, 0.35], [0, 0.045, 0], { color: 'black' }).stick([0, 0.06, 0], [0, 0.72, 0], 0.025, 'black').box([0.52, 0.38, 0.03], [0, 0.88, 0.02], { color: 'black', rot: [-15, 0, 0] });
    b.box([0.44, 0.32, 0.01], [-0.005, 0.89, 0.045], { color: 'paper', rot: [-15, 0, 4] });
    b.each(4, (i) => b.box([0.38, 0.004, 0.004], [0, 0.98 - i * 0.065, 0.075 - (0.98 - i * 0.065 - 0.88) * 0.27], { color: 'black', noInk: true, rot: [-15, 0, 0] }));
    return b.each(5, (i) => b.ball([0.022, 0.016, 0.006], [-0.14 + i * 0.07, 0.97 - (i % 3) * 0.06, 0.08 - (0.97 - (i % 3) * 0.06 - 0.88) * 0.27], { color: 'black', noInk: true, rot: [-15, 0, -20] })).done();
  }),
  e('shell (sea)', 'sea', 'shells', () => {
    const b = m('shell (sea)').ball([0.09, 0.07, 0.08], [0, 0.035, 0], { color: '#f6e0c8' });
    b.each(3, (i) => b.torus([0.075 - i * 0.018, 0.075 - i * 0.018, 0.022 - i * 0.004], [-0.004 * i, 0.07 + i * 0.02, -0.003 * i], { color: i % 2 ? '#f6e0c8' : '#f0c8b0', rot: [90, 0, 8], tube: 0.4 }));
    return b.cone([0.025, 0.03, 0.025], [-0.012, 0.125, -0.009], { color: 'pink', rot: [0, 0, 8] }).ball([0.035, 0.05, 0.016], [0.02, 0.035, 0.038], { color: 'pink', rot: [0, 20, -10] }).done();
  }),
  e('sherbet', 'food', 'desserts', () =>
    m('sherbet')
      .cyl([0.06, 0.01, 0.06], [0, 0.005, 0], { color: 'glass' })
      .stick([0, 0.01, 0], [0, 0.05, 0], 0.014, 'glass')
      .cyl([0.06, 0.035, 0.06], [0, 0.065, 0], { color: 'glass', taper: 1.7 })
      .ball(0.055, [-0.025, 0.1, 0.01], { color: 'orange' })
      .ball(0.055, [0.025, 0.1, 0.0], { color: 'pink' })
      .ball(0.05, [0, 0.135, -0.005], { color: 'lime' })
      .done(),
  ),
  e('sheriff hat', 'wardrobe', 'hats', () => {
    const b = m('sheriff hat').ball([0.4, 0.04, 0.34], [0, 0.03, 0], { color: 'tan' }).cyl([0.2, 0.1, 0.18], [0, 0.09, 0], { color: 'tan', taper: 0.9 }).ball([0.2, 0.06, 0.18], [0, 0.14, 0], { color: 'tan' });
    b.pair((s) => b.capsule([0.06, 0.28, 0.05], [s * 0.18, 0.06, 0], { color: 'tan', rot: [90, 0, 0] }));
    b.cyl([0.205, 0.025, 0.185], [0, 0.06, 0], { color: 'darkbrown' });
    return b.star(0.06, [0, 0.1, 0.095], { color: 'gold' }).done();
  }),
  e('shield', 'armory', 'shields', () =>
    m('shield')
      .box([0.74, 0.5, 0.08], [0, 0.75, 0], { color: 'silver', round: 0.15 })
      .wedge([0.74, 0.55, 0.08], [0, 0.275, 0], { color: 'silver', rot: [0, 0, 180] })
      .box([0.66, 0.44, 0.06], [0, 0.75, 0.02], { color: 'blue', round: 0.15 })
      .wedge([0.66, 0.48, 0.06], [0, 0.3, 0.02], { color: 'blue', rot: [0, 0, 180] })
      .box([0.1, 0.85, 0.02], [0, 0.55, 0.055], { color: 'gold', noInk: true })
      .box([0.6, 0.1, 0.02], [0, 0.72, 0.055], { color: 'gold', noInk: true })
      .done(),
  ),
  e('shingle', 'workshop', 'building materials', () => {
    const b = m('shingle').wedge([0.4, 0.25, 0.36], [0, 0.125, 0], { color: 'lightwood', apex: -0.5 });
    const ang = (-Math.atan2(0.25, 0.4) * 180) / Math.PI;
    for (const [t, c] of [[0.2, '#5c6166'], [0.47, '#6c7176'], [0.74, '#5c6166']] as Array<[number, string]>) {
      b.box([0.17, 0.014, 0.38], [-0.2 + 0.4 * t + 0.53 * 0.012, 0.25 - 0.25 * t + 0.85 * 0.012, 0], { color: c, rot: [0, 0, ang], round: 0.1 });
      b.each(3, (i) => b.box([0.12, 0.016, 0.006], [-0.2 + 0.4 * t + 0.01, 0.25 - 0.25 * t + 0.012, -0.12 + i * 0.12], { color: 'black', rot: [0, 0, ang], noInk: true }));
    }
    return b.done();
  }),
  e('shipyard', 'places', 'harbour', () => {
    const b = m('shipyard').box([7, 0.3, 5], [0, 0.15, 0], { color: 'stone' }).box([7, 0.15, 1.5], [0, 0.08, 3.2], { color: 'water' });
    b.box([1.6, 1.4, 4.4], [0, 1.0, -0.4], { color: 'darkred', round: 0.3 }).box([1.62, 0.6, 4.4], [0, 1.9, -0.4], { color: 'navy', round: 0.2 }).wedge([1.6, 1.2, 2.0], [0, 1.3, 2.4], { color: 'navy', rot: [90, 0, 0] });
    b.box([1.0, 0.8, 1.0], [0, 2.6, -1.4], { color: 'white', round: 0.2 });
    b.each(3, (i) => b.box([0.5, 0.35, 0.4], [0, 0.45, -2.0 + i * 1.6], { color: 'wood' }));
    b.pair((s) => b.stick([s * 2.4, 0.3, -2.2], [s * 2.4, 5.0, -2.2], 0.25, 'yellow').stick([s * 2.4, 0.3, 1.4], [s * 2.4, 5.0, 1.4], 0.25, 'yellow'));
    b.box([5.2, 0.4, 0.4], [0, 5.0, -2.2], { color: 'yellow' }).box([5.2, 0.4, 0.4], [0, 5.0, 1.4], { color: 'yellow' }).box([0.8, 0.6, 4.0], [1.2, 5.4, -0.4], { color: 'orange', round: 0.1 });
    return b.stick([1.2, 5.1, -0.2], [1.2, 3.0, -0.2], 0.04, 'black').box([0.3, 0.2, 0.3], [1.2, 2.9, -0.2], { color: 'iron' }).done();
  }),
  e('shirt', 'wardrobe', 'shirts', () => {
    const b = garment(m('shirt'), { w: 0.5, len: 0.65, color: 'blue', sleeve: 0.2 });
    return b.torus([0.16, 0.08, 0.04], [0, 0.63, 0.04], { color: 'navy', rot: [80, 0, 0], tube: 0.25 }).star(0.18, [0, 0.38, 0.105], { color: 'white', noInk: true, round: 0.01 }).done();
  }),
  e('shoe', 'wardrobe', 'shoes', () => sneaker(m('shoe'), 0, 'red').done()),
  e('shoe polish', 'wardrobe', 'shoes', () =>
    m('shoe polish')
      .cyl([0.08, 0.025, 0.08], [0, 0.0125, 0], { color: 'silver' })
      .cyl([0.074, 0.004, 0.074], [0, 0.026, 0], { color: 'black' })
      .cyl([0.082, 0.012, 0.082], [0.06, 0.04, -0.05], { color: 'red', rot: [60, 0, 0] })
      .box([0.16, 0.035, 0.05], [-0.04, 0.045, 0.07], { color: 'wood', round: 0.4, rot: [0, 20, 0] })
      .box([0.15, 0.03, 0.045], [-0.04, 0.015, 0.07], { color: 'black', round: 0.2, rot: [0, 20, 0] })
      .done(),
  ),
  e('shoe store', 'places', 'shops', () => sneaker(bld('shoe store', 'SHOES', { wall: 'white', flat: true, roof: 'red', signBg: 'red', door: 'red' }), 0, 'blue', 9, 3.25, 0.3).done()),
  e('shoebox', 'wardrobe', 'shoes', () =>
    m('shoebox')
      .box([0.34, 0.12, 0.21], [0, 0.06, 0], { color: 'orange', round: 0.05 })
      .box([0.35, 0.04, 0.22], [-0.02, 0.135, -0.03], { color: 'orange', round: 0.05, rot: [8, 0, -6], name: 'lid', pivot: [0, 0.12, -0.105] })
      .ball([0.2, 0.05, 0.12], [0.06, 0.12, 0.04], { color: 'white' })
      .box([0.08, 0.04, 0.005], [0.0, 0.07, 0.106], { color: 'white', noInk: true })
      .done(),
  ),
  e('shoehorn', 'wardrobe', 'shoes', () =>
    m('shoehorn')
      .box([0.06, 0.1, 0.016], [0, 0.05, 0], { color: 'brass', round: 0.5, rot: [-8, 0, 0] })
      .box([0.03, 0.12, 0.016], [0, 0.15, -0.012], { color: 'brass', round: 0.5, rot: [-4, 0, 0] })
      .torus([0.035, 0.035, 0.016], [0, 0.21, -0.016], { color: 'brass', tube: 0.3 })
      .done(),
  ),
  e('shoelace', 'wardrobe', 'shoes', () => {
    const b = m('shoelace').cyl([0.2, 0.06, 0.2], [0, 0.03, 0], { color: 'darkwood' }).stick([0, 0.05, -0.03], [0, 0.6, -0.03], 0.025, 'wood').rod([0, 0.56, -0.03], [0, 0.56, 0.04], 0.02, 'wood').ball(0.03, [0, 0.56, 0.035], { color: 'white' });
    b.pair((s) => {
      b.torus([0.1, 0.07, 0.012], [s * 0.05, 0.59, 0.035], { color: 'white', rot: [0, 0, s * 25], tube: 0.18 });
      b.rod([s * 0.01, 0.55, 0.04], [s * 0.04, 0.32, 0.06], 0.012, 'white').rod([s * 0.04, 0.32, 0.06], [s * 0.03, 0.08, 0.05], 0.012, 'white');
      b.capsule([0.016, 0.035, 0.016], [s * 0.03, 0.08, 0.05], { color: 'black' });
    });
    return b.done();
  }),
  e('shoes', 'wardrobe', 'shoes', () => sneaker(sneaker(m('shoes'), 0.065, 'blue', 1, 0, 0.02), -0.065, 'blue', 1, 0, -0.02).done()),
  e('shooting range', 'places', 'sports grounds', () => {
    const b = m('shooting range').box([3, 0.1, 3.5], [0, 0.05, 0], { color: 'sand' }).box([3, 1.4, 0.8], [0, 0.7, -1.5], { color: 'dirt', round: 0.4 }).box([3, 0.9, 0.5], [0, 0.45, 1.5], { color: 'wood', round: 0.1 });
    b.each(2, (i) => b.box([0.06, 1.2, 1.2], [-0.5 + i * 1.0, 0.7, 1.2], { color: 'lightwood' }));
    for (const x of [-1.0, 0.0, 1.0]) {
      b.stick([x, 0.1, -0.9], [x, 0.9, -0.9], 0.05, 'darkwood');
      b.cyl([0.5, 0.03, 0.5], [x, 1.1, -0.9], { color: 'white', rot: [90, 0, 0] }).cyl([0.34, 0.03, 0.34], [x, 1.1, -0.89], { color: 'red', rot: [90, 0, 0] }).cyl([0.18, 0.03, 0.18], [x, 1.1, -0.88], { color: 'white', rot: [90, 0, 0] }).cyl([0.07, 0.03, 0.07], [x, 1.1, -0.87], { color: 'red', rot: [90, 0, 0] });
    }
    return b.done();
  }),
  e('shopping bag', 'wardrobe', 'bags', () =>
    m('shopping bag')
      .box([0.3, 0.32, 0.12], [0, 0.16, 0], { color: 'magenta', round: 0.1 })
      .torus([0.12, 0.14, 0.01], [0, 0.32, 0.03], { color: 'white', tube: 0.12 })
      .torus([0.12, 0.14, 0.01], [0, 0.32, -0.03], { color: 'white', tube: 0.12 })
      .heart(0.1, [0, 0.17, 0.065], { color: 'white', noInk: true })
      .done(),
  ),
  e('shopping cart', 'home', 'shopping', () => {
    const b = m('shopping cart', { view: 'side' }).box([0.5, 0.42, 0.8], [0, 0.72, 0], { color: 'silver', round: 0.1 });
    b.each(5, (i) => b.box([0.52, 0.01, 0.82], [0, 0.55 + i * 0.07, 0], { color: 'steel', noInk: true }));
    b.each(6, (i) => b.box([0.52, 0.42, 0.01], [0, 0.72, -0.35 + i * 0.14], { color: 'steel', noInk: true }));
    b.box([0.5, 0.05, 0.05], [0, 1.0, -0.48], { color: 'red', round: 0.5 }).box([0.46, 0.12, 0.25], [0, 0.98, -0.25], { color: 'red', round: 0.3 });
    b.pair((s) => b.stick([s * 0.22, 0.08, 0.35], [s * 0.22, 0.52, 0.35], 0.03, 'steel').stick([s * 0.22, 0.08, -0.35], [s * 0.22, 0.98, -0.47], 0.03, 'steel').stick([s * 0.22, 0.08, -0.35], [s * 0.22, 0.08, 0.35], 0.03, 'steel'));
    b.torus([0.12, 0.12, 0.04], [0.22, 0.06, 0.35], { color: 'rubber', rot: [0, 90, 0], tube: 0.4, name: 'wheel' });
    for (const [x, z] of [[-0.22, 0.35], [0.22, -0.35], [-0.22, -0.35]]) b.torus([0.12, 0.12, 0.04], [x, 0.06, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 });
    return b.done();
  }),
  e('shorts', 'wardrobe', 'trousers', () => {
    const b = m('shorts').box([0.42, 0.06, 0.2], [0, 0.31, 0], { color: '#a8865a', round: 0.3 }).box([0.42, 0.12, 0.2], [0, 0.22, 0], { color: 'tan', round: 0.3 });
    b.pair((s) => b.box([0.2, 0.22, 0.19], [s * 0.11, 0.11, 0], { color: 'tan', round: 0.3, rot: [0, 0, s * -5] }).box([0.08, 0.06, 0.01], [s * 0.12, 0.2, 0.1], { color: '#a8865a', noInk: true }));
    return b.box([0.02, 0.1, 0.01], [0, 0.22, 0.1], { color: '#a8865a', noInk: true }).done();
  }),
  e('shotgun', 'armory', 'guns', () => {
    const b = m('shotgun', { view: 'side' }).box([0.25, 0.05, 0.6], [0, 0.025, 0], { color: 'darkwood' });
    b.each(2, (i) => b.stick([0, 0.05, -0.2 + i * 0.4], [0, 0.32, -0.2 + i * 0.4], 0.04, 'wood'));
    b.pair((s) => b.cyl([0.026, 0.65, 0.026], [s * 0.014, 0.38, 0.3], { color: 'iron', rot: [90, 0, 0] }));
    b.box([0.07, 0.07, 0.28], [0, 0.36, 0.05], { color: 'darkwood', round: 0.4 }).box([0.06, 0.08, 0.14], [0, 0.37, -0.15], { color: 'iron', round: 0.3 });
    return b.box([0.1, 0.13, 0.4], [0, 0.32, -0.4], { color: 'darkwood', round: 0.4, rot: [-10, 0, 0] }).torus([0.06, 0.05, 0.012], [0, 0.31, -0.15], { color: 'iron', rot: [0, 90, 0], tube: 0.2 }).done();
  }),
  e('shoulder pads', 'sports', 'protective gear', () => {
    const b = m('shoulder pads').box([0.4, 0.22, 0.12], [0, 0.11, 0.1], { color: 'white', round: 0.5 }).box([0.4, 0.22, 0.12], [0, 0.11, -0.1], { color: 'white', round: 0.5 });
    b.pair((s) => b.ball([0.22, 0.16, 0.34], [s * 0.2, 0.2, 0], { color: 'lightgray' }).ball([0.16, 0.08, 0.26], [s * 0.26, 0.15, 0], { color: 'white' }));
    return b.box([0.3, 0.03, 0.02], [0, 0.08, 0.165], { color: 'black', noInk: true }).box([0.3, 0.03, 0.02], [0, 0.14, 0.165], { color: 'black', noInk: true }).done();
  }),
  e('shovel', 'garden', 'garden tools', () =>
    m('shovel')
      .ball([0.5, 0.3, 0.4], [0, 0.0, 0], { color: 'dirt' })
      .box([0.22, 0.26, 0.03], [0, 0.18, 0], { color: 'steel', round: 0.2 })
      .stick([0, 0.3, 0], [0, 1.1, 0], 0.04, 'wood')
      .box([0.16, 0.03, 0.04], [0, 1.2, 0], { color: 'black', round: 0.5 })
      .rod([0, 1.1, 0], [0.07, 1.2, 0], 0.025, 'black')
      .rod([0, 1.1, 0], [-0.07, 1.2, 0], 0.025, 'black')
      .done(),
  ),
  e('shower', 'home', 'bathroom', () => {
    const b = m('shower').box([1.0, 0.18, 1.0], [0, 0.09, 0], { color: 'white', round: 0.2 }).box([1.0, 2.0, 0.1], [0, 1.1, -0.46], { color: '#bfe3f2', round: 0.05 });
    b.each(4, (i) => b.box([1.0, 0.012, 0.01], [0, 0.5 + i * 0.4, -0.405], { color: 'white', noInk: true }));
    b.stick([0, 1.95, -0.42], [0, 2.0, -0.15], 0.05, 'silver').cyl([0.26, 0.06, 0.26], [0, 1.96, -0.1], { color: 'silver' }).cyl([0.1, 0.05, 0.1], [0.25, 1.1, -0.4], { color: 'silver', rot: [90, 0, 0] });
    b.each(5, (i) => b.stick([-0.08 + i * 0.04, 1.92, -0.1], [-0.3 + i * 0.15, 0.2, -0.05 + (i % 2) * 0.1], 0.012, 'skyblue', { noInk: true }));
    return b.ball([0.5, 0.03, 0.4], [0, 0.185, 0], { color: 'skyblue', noInk: true }).done();
  }),
  e('shower cap', 'home', 'bathroom', () => {
    const b = m('shower cap').ball([0.24, 0.16, 0.24], [0, 0.06, 0], { color: 'pink' }).torus([0.3, 0.3, 0.06], [0, 0.03, 0], { color: 'white', rot: [90, 0, 0], tube: 0.22 });
    return b.each(8, (i) => b.ball(0.025, surf([0, 0.06, 0], [0.12, 0.08, 0.12], i * 45, 25 + (i % 2) * 25), { color: 'white', noInk: true })).done();
  }),
  e('shower curtain', 'home', 'bathroom', () => {
    const b = m('shower curtain').stick([-0.9, 2.0, 0], [0.9, 2.0, 0], 0.035, 'silver');
    b.pair((s) => b.stick([s * 0.9, 0, -0.05], [s * 0.9, 2.02, -0.05], 0.05, 'silver').cyl([0.22, 0.14, 0.22], [s * 0.9, 0.07, -0.05], { color: 'silver' }));
    b.each(8, (i) => b.box([0.22, 1.85, 0.06], [-0.77 + i * 0.22, 1.02, (i % 2) * 0.05], { color: i % 2 ? '#a8dcf0' : '#c8ecf8', round: 0.5 }).torus([0.06, 0.06, 0.012], [-0.77 + i * 0.22, 2.0, 0.02], { color: 'silver', rot: [0, 90, 0], tube: 0.2 }));
    return b.each(4, (i) => b.ball([0.12, 0.06, 0.02], [-0.5 + i * 0.35, 0.7 + (i % 2) * 0.5, 0.08], { color: 'orange', noInk: true })).done();
  }),
  e('shower head', 'home', 'bathroom', () => {
    const b = m('shower head').box([0.1, 0.3, 0.03], [0, 0.15, -0.1], { color: 'white', round: 0.2 }).rod([0, 0.27, -0.09], [0, 0.29, 0.02], 0.02, 'silver')
      .cyl([0.11, 0.03, 0.11], [0, 0.27, 0.06], { color: 'silver', rot: [-25, 0, 0] });
    return b.each(5, (i) => b.stick([-0.03 + i * 0.015, 0.255, 0.06], [-0.07 + i * 0.035, 0.0, 0.12], 0.008, 'skyblue', { noInk: true })).done();
  }),
  e('seven ball', 'sports', 'billiards', () =>
    m('seven ball')
      .ball(0.06, [0, 0.03, 0], { color: '#7a1a2a' })
      .ball([0.03, 0.03, 0.006], [0, 0.035, 0.028], { color: 'white', noInk: true })
      .box([0.014, 0.003, 0.003], [0, 0.043, 0.032], { color: 'black', noInk: true })
      .box([0.003, 0.016, 0.003], [0.002, 0.034, 0.032], { color: 'black', noInk: true, rot: [0, 0, -20] })
      .done(),
  ),
  e('shrapnel', 'armory', 'explosives', () => {
    const b = m('shrapnel');
    for (const [x, z, w, r] of [[0, 0, 0.06, 20], [0.05, 0.03, 0.04, 70], [-0.05, 0.02, 0.045, -40], [0.02, -0.05, 0.035, 120], [-0.03, -0.04, 0.03, 200]]) b.wedge([w, w * 0.9, w * 0.4], [x, w * 0.35, z], { color: r % 3 ? 'iron' : 'darkgray', rot: [r * 0.3, r, r * 0.2], apex: 0.3 });
    return b.box([0.03, 0.006, 0.02], [0.07, 0.003, -0.03], { color: 'copper', rot: [0, 30, 0] }).done();
  }),
  e('shredder', 'study', 'office machines', () =>
    m('shredder')
      .box([0.36, 0.4, 0.26], [0, 0.2, 0], { color: 'darkgray', round: 0.1 })
      .box([0.2, 0.25, 0.01], [0, 0.2, 0.13], { color: 'glass' })
      .box([0.38, 0.1, 0.28], [0, 0.45, 0], { color: 'black', round: 0.3 })
      .box([0.22, 0.2, 0.004], [0, 0.56, 0.0], { color: 'paper' })
      .box([0.012, 0.15, 0.002], [-0.06, 0.2, 0.136], { color: 'paper', noInk: true })
      .box([0.012, 0.18, 0.002], [-0.02, 0.18, 0.136], { color: 'paper', noInk: true })
      .box([0.012, 0.14, 0.002], [0.02, 0.2, 0.136], { color: 'paper', noInk: true })
      .box([0.012, 0.17, 0.002], [0.06, 0.19, 0.136], { color: 'paper', noInk: true })
      .ball(0.016, [0.15, 0.48, 0.12], { color: 'lime', glow: true })
      .done(),
  ),
  e('shrine', 'places', 'temples', () => {
    const b = m('shrine').box([2.6, 0.2, 2.4], [0, 0.1, -0.6], { color: 'stone' }).box([1.4, 1.0, 1.1], [0, 0.7, -1.1], { color: 'wood', round: 0.05 }).wedge([2.0, 0.7, 1.6], [0, 1.55, -1.1], { color: 'darkgray', rot: [0, 90, 0] });
    b.pair((s) => b.stick([s * 0.8, 0, 0.9], [s * 0.75, 1.9, 0.9], 0.14, 'red'));
    b.box([2.3, 0.14, 0.18], [0, 1.95, 0.9], { color: 'black', round: 0.3 }).box([2.0, 0.12, 0.14], [0, 2.08, 0.9], { color: 'red', round: 0.3 }).box([1.9, 0.1, 0.12], [0, 1.6, 0.9], { color: 'red' });
    return b.label('SHRINE', [0.6, 0.2], [0, 1.78, 0.98], { color: 'black' }).done();
  }),
  e('shroud', 'home', 'linens', () => {
    const c = '#e6e4dc';
    const b = m('shroud').box([1.9, 0.1, 0.62], [0, 0.55, 0], { color: 'darkbrown' });
    b.pair((s) => b.stick([s * 0.8, 0, 0], [s * 0.8, 0.52, 0], 0.08, 'darkbrown').stick([s * 0.8, 0.15, -0.25], [s * 0.8, 0.15, 0.25], 0.05, 'darkbrown'));
    b.box([1.95, 0.04, 0.66], [0, 0.62, 0], { color: c, round: 0.4 }).capsule([0.34, 1.2, 0.24], [0.15, 0.74, 0], { color: c, rot: [0, 0, 90] }).ball([0.26, 0.26, 0.24], [-0.68, 0.79, 0], { color: c });
    b.pair((s) => b.ball([0.08, 0.14, 0.08], [0.8, 0.74, s * 0.06], { color: c }));
    b.each(4, (i) => b.box([0.02, 0.3, 0.02], [-0.6 + i * 0.4, 0.48, 0.34], { color: '#cfcdc4', noInk: true }));
    return b.box([1.95, 0.22, 0.02], [0, 0.52, 0.33], { color: c, round: 0.3 }).done();
  }),
  e('shrub', 'garden', 'shrubs', () => {
    const b = m('shrub').stick([0, 0, 0], [0, 0.4, 0], 0.08, 'bark');
    for (const [x, y, z, r, c] of [[0, 0.75, 0, 0.9, 'leaf'], [0.35, 0.6, 0.15, 0.6, 'darkgreen'], [-0.35, 0.6, 0.1, 0.6, 'green'], [0.1, 1.0, -0.1, 0.6, 'green'], [-0.15, 0.55, 0.35, 0.5, 'leaf']] as Array<[number, number, number, number, string]>) b.ball(r, [x, y, z], { color: c });
    return b.done();
  }),
  e('shutter', 'home', 'windows', () => {
    const b = m('shutter').box([1.8, 1.3, 0.15], [0, 0.65, -0.1], { color: 'cream', round: 0.03 }).box([0.62, 0.82, 0.06], [0, 0.65, 0.0], { color: 'white', round: 0.1 }).box([0.52, 0.72, 0.05], [0, 0.65, 0.02], { color: 'glass' }).box([0.75, 0.06, 0.14], [0, 0.22, 0.04], { color: 'white' });
    b.box([0.04, 0.72, 0.06], [0, 0.65, 0.04], { color: 'white' }).box([0.52, 0.04, 0.06], [0, 0.65, 0.04], { color: 'white' });
    b.box([0.32, 0.84, 0.05], [-0.48, 0.65, 0.02], { color: 'darkgreen', round: 0.1, name: 'door', pivot: [-0.32, 0.65, 0.02] });
    b.box([0.32, 0.84, 0.05], [0.48, 0.65, 0.02], { color: 'darkgreen', round: 0.1 });
    return b.each(7, (i) => b.pair((s) => b.box([0.28, 0.025, 0.02], [s * 0.48, 0.32 + i * 0.11, 0.05], { color: '#2f5a2c', noInk: true, parent: s < 0 ? 'door' : undefined }))).done();
  }),
  e('sickle', 'farm', 'farm tools', () => {
    const b = m('sickle').cyl([0.05, 0.22, 0.05], [0, 0.11, 0], { color: 'wood' }).cyl([0.055, 0.03, 0.055], [0, 0.235, 0], { color: 'steel' });
    const pts: V[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = (180 - i * 40) * D2R;
      pts.push([0.16 + Math.cos(a) * 0.18, 0.4 + Math.sin(a) * 0.17, 0]);
    }
    b.rod([0, 0.24, 0], pts[0], 0.035, 'steel');
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], 0.06 - i * 0.008, 'silver');
    return b.done();
  }),
  e('sieve', 'kitchen', 'utensils', () => {
    const b = m('sieve').cyl([0.1, 0.08, 0.1], [0, 0.04, 0], { color: 'lightgray', taper: 1.8 }).torus([0.19, 0.19, 0.012], [0, 0.08, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.08 });
    b.each(4, (i) => b.torus([0.18 - i * 0.03, 0.18 - i * 0.03, 0.004], [0, 0.081, 0], { color: 'gray', rot: [90, 0, 0], tube: 0.05, noInk: true }));
    return b.rod([0.09, 0.08, 0], [0.3, 0.12, 0], 0.016, 'silver').torus([0.03, 0.03, 0.01], [0.32, 0.125, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.25 }).done();
  }),
  e('sign', 'ideas', 'signs', () => {
    const b = m('sign').box([1.3, 0.75, 0.1], [0, 1.55, 0], { color: 'wood', round: 0.15 }).label('NOTICE', [1.1, 0.55], [0, 1.55, 0.06], { color: 'cream' });
    return b.pair((s) => b.stick([s * 0.5, 0, -0.08], [s * 0.5, 1.95, -0.08], 0.15, 'darkwood').ball([0.3, 0.14, 0.3], [s * 0.5, 0.03, -0.08], { color: 'grass' })).done();
  }),
  e('signpost', 'ideas', 'road signs', () => {
    const b = m('signpost').cyl([0.6, 0.2, 0.6], [0, 0.1, 0], { color: 'grass' }).stick([0, 0, 0], [0, 2.5, 0], 0.13, 'darkwood').cone([0.17, 0.12, 0.17], [0, 2.56, 0], { color: 'darkwood' });
    for (const [y, a, t, c] of [[2.2, 20, 'NORTH', 'cream'], [1.85, 160, 'TOWN', 'lightwood'], [1.5, 60, 'LAKE', 'cream']] as Array<[number, number, string, string]>) {
      const dx = Math.cos(a * D2R), dz = -Math.sin(a * D2R);
      b.box([0.7, 0.2, 0.05], [dx * 0.4, y, dz * 0.4], { color: c, rot: [0, a, 0], round: 0.1 }).wedge([0.24, 0.12, 0.05], [dx * 0.8, y, dz * 0.8], { color: c, rot: [0, a, -90] });
      b.label(t, [0.5, 0.14], [dx * 0.4 - dz * 0.03, y, dz * 0.4 + dx * 0.03], { color: c, rot: [0, a, 0] });
    }
    return b.done();
  }),
  e('silk', 'wardrobe', 'fabrics', () => {
    const c = '#d64f9a';
    const b = m('silk').cyl([0.16, 0.5, 0.16], [0, 0.08, -0.1], { color: c, rot: [0, 0, 90] }).cyl([0.05, 0.54, 0.05], [0, 0.08, -0.1], { color: 'tan', rot: [0, 0, 90] });
    b.box([0.48, 0.012, 0.2], [0, 0.07, 0.05], { color: c, rot: [-25, 0, 0], round: 0.2 }).capsule([0.06, 0.48, 0.06], [0, 0.04, 0.18], { color: c, rot: [0, 0, 90] }).box([0.48, 0.012, 0.2], [0, 0.01, 0.3], { color: '#e870b0', round: 0.2 });
    return b.each(3, (i) => b.box([0.012, 0.004, 0.18], [-0.12 + i * 0.12, 0.018, 0.3], { color: '#f6c8e0', noInk: true })).done();
  }),
  e('silo', 'farm', 'farm buildings', () =>
    m('silo')
      .cyl([2.6, 7, 2.6], [0, 3.5, 0], { color: '#c9ccd1' })
      .ball([2.6, 1.8, 2.6], [0, 7.0, 0], { color: 'silver' })
      .torus([2.7, 2.7, 0.1], [0, 2.4, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.04 })
      .torus([2.7, 2.7, 0.1], [0, 4.8, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.04 })
      .stick([0.5, 0, 1.25], [0.5, 7.4, 1.0], 0.06, 'darkgray')
      .stick([0.8, 0, 1.18], [0.8, 7.2, 0.9], 0.06, 'darkgray')
      .box([2.4, 2.2, 1.6], [-2.0, 1.1, 0.6], { color: 'darkred', round: 0.04 })
      .wedge([2.7, 1.0, 1.9], [-2.0, 2.7, 0.6], { color: 'darkgray', rot: [0, 90, 0] })
      .rod([0, 7.5, 0], [-2.0, 3.2, 0.6], 0.25, 'gray')
      .done(),
  ),
  e('silver (material)', 'workshop', 'materials', () => {
    const b = m('silver (material)');
    for (const [x, y] of [[-0.25, 0.04], [0, 0.04], [0.25, 0.04], [-0.125, 0.12], [0.125, 0.12], [0, 0.2]]) b.box([0.24, 0.08, 0.11], [x, y, 0], { color: '#dfe3e8', round: 0.15 }).box([0.1, 0.03, 0.005], [x, y, 0.056], { color: 'gray', noInk: true });
    return b.cyl([0.07, 0.012, 0.07], [0.42, 0.006, 0.12], { color: '#dfe3e8' }).cyl([0.07, 0.012, 0.07], [0.44, 0.018, 0.09], { color: '#dfe3e8' }).done();
  }),
  e('silver bullet', 'armory', 'ammo', () =>
    m('silver bullet')
      .cyl([0.03, 0.05, 0.03], [0, 0.025, 0], { color: 'brass' })
      .cyl([0.032, 0.006, 0.032], [0, 0.003, 0], { color: 'brass' })
      .cyl([0.03, 0.02, 0.03], [0, 0.06, 0], { color: 'silver', taper: 0.85 })
      .ball([0.026, 0.04, 0.026], [0, 0.075, 0], { color: 'silver' })
      .star(0.03, [0.03, 0.09, 0.0], { color: 'white', glow: true })
      .done(),
  ),
  e('sink', 'kitchen', 'fixtures', () =>
    m('sink')
      .box([0.9, 0.82, 0.6], [0, 0.41, 0], { color: 'white', round: 0.05 })
      .box([0.94, 0.05, 0.64], [0, 0.845, 0], { color: 'darkgray', round: 0.1 })
      .box([0.6, 0.02, 0.4], [0, 0.86, 0.04], { color: 'steel', round: 0.3 })
      .box([0.52, 0.01, 0.32], [0, 0.866, 0.04], { color: '#5c6166', round: 0.3, noInk: true })
      .rod([0, 0.86, -0.22], [0, 1.15, -0.2], 0.035, 'silver')
      .rod([0, 1.15, -0.2], [0, 1.12, -0.02], 0.03, 'silver')
      .box([0.4, 0.62, 0.02], [-0.21, 0.4, 0.3], { color: 'white', round: 0.1, name: 'door', pivot: [-0.42, 0.4, 0.3] })
      .box([0.4, 0.62, 0.02], [0.21, 0.4, 0.3], { color: 'white', round: 0.1 })
      .box([0.02, 0.1, 0.03], [-0.05, 0.6, 0.32], { color: 'silver', parent: 'door' })
      .box([0.02, 0.1, 0.03], [0.05, 0.6, 0.32], { color: 'silver' })
      .done(),
  ),
  e('sinkhole', 'nature', 'landforms', () =>
    m('sinkhole')
      .box([6, 2.0, 4.5], [0, 1.0, 0], { color: 'dirt', round: 0.05 })
      .box([6.05, 0.6, 4.55], [0, 0.3, 0], { color: 'rock', round: 0.05 })
      .box([6.1, 0.3, 4.6], [0, 2.15, 0], { color: 'grass', round: 0.1 })
      .cyl([2.6, 0.06, 2.0], [0.2, 2.3, 0.2], { color: '#2a2726' })
      .torus([2.8, 2.8, 0.25], [0.2, 2.28, 0.2], { color: 'dirt', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.25, 1.4, 0.25], [-1.6, 2.9, -1.0], { color: 'bark', rot: [0, 0, 20] })
      .ball([1.0, 1.0, 1.0], [-1.85, 3.7, -1.0], { color: 'leaf' })
      .done(),
  ),
  e('skate park', 'places', 'parks', () => {
    const b = m('skate park').box([7, 0.2, 4.5], [0, 0.1, 0], { color: 'lightgray', round: 0.03 });
    b.wedge([2.0, 1.6, 4.0], [-2.4, 1.0, 0], { color: '#9aa4aa', apex: -0.5 }).wedge([2.0, 1.6, 4.0], [2.4, 1.0, 0], { color: '#9aa4aa', apex: 0.5 });
    b.pair((s) => b.stick([s * 3.4, 1.8, -2.0], [s * 3.4, 1.8, 2.0], 0.1, 'steel'));
    b.box([1.0, 0.4, 1.2], [0, 0.4, -0.8], { color: 'gray', round: 0.1 }).stick([-0.8, 0.6, 1.2], [0.8, 0.6, 1.2], 0.08, 'yellow');
    b.pair((s) => b.stick([s * 0.7, 0.2, 1.2], [s * 0.7, 0.6, 1.2], 0.06, 'yellow'));
    return b.ball([1.0, 0.5, 0.05], [-2.3, 1.0, 2.02], { color: 'magenta', noInk: true }).ball([0.8, 0.4, 0.05], [2.3, 0.8, 2.02], { color: 'lime', noInk: true }).done();
  }),
  e('skateboard', 'sports', 'skating', () => {
    const b = m('skateboard').box([0.21, 0.8, 0.025], [0, 0.42, 0], { color: 'black', round: 0.6 }).box([0.17, 0.6, 0.006], [0, 0.42, 0.014], { color: 'orange', noInk: true, round: 0.6 });
    b.star(0.12, [0, 0.42, 0.02], { color: 'yellow', noInk: true });
    for (const y of [0.17, 0.67]) {
      b.box([0.14, 0.04, 0.04], [0, y, 0.035], { color: 'silver', round: 0.3 });
      b.pair((s) => b.cyl([0.065, 0.06, 0.065], [s * 0.1, y, 0.06], { color: 'cream', rot: [0, 0, 90] }));
    }
    return b.done();
  }),
  e('skeleton', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('skeleton')
      .ball([0.2, 0.22, 0.22], [0, 1.6, 0], { color: bone })
      .box([0.13, 0.07, 0.12], [0, 1.47, 0.04], { color: bone, round: 0.5 })
      .capsule([0.04, 0.6, 0.04], [0, 1.1, -0.06], { color: bone })
      .ball([0.3, 0.14, 0.18], [0, 0.85, 0], { color: bone })
      .box([0.08, 0.025, 0.01], [0, 1.47, 0.1], { color: 'darkgray', noInk: true });
    b.each(5, (i) => b.torus([0.32 - Math.abs(i - 1.5) * 0.03, 0.2, 0.025], [0, 1.37 - i * 0.07, 0.0], { color: bone, rot: [100, 0, 0], tube: 0.12 }));
    b.pair((s) => {
      b.ball([0.06, 0.07, 0.03], [s * 0.05, 1.62, 0.1], { color: 'black' });
      b.rod([s * 0.03, 1.4, 0.03], [s * 0.2, 1.42, -0.02], 0.03, bone);
      b.rod([s * 0.21, 1.4, 0], [s * 0.25, 1.1, 0], 0.04, bone).rod([s * 0.25, 1.1, 0], [s * 0.27, 0.82, 0.04], 0.035, bone).ball([0.06, 0.08, 0.03], [s * 0.28, 0.75, 0.05], { color: bone });
      b.rod([s * 0.1, 0.82, 0], [s * 0.11, 0.46, 0.01], 0.05, bone).rod([s * 0.11, 0.46, 0.01], [s * 0.11, 0.07, 0], 0.045, bone).box([0.09, 0.04, 0.17], [s * 0.11, 0.03, 0.05], { color: bone, round: 0.5 });
    });
    return b.done();
  }),
  e('sketch', 'study', 'art supplies', () => {
    const b = m('sketch').box([0.26, 0.03, 0.08], [0, 0.015, 0.02], { color: 'wood' }).rod([0, 0.0, -0.08], [0, 0.26, -0.02], 0.015, 'wood').box([0.26, 0.02, 0.03], [0, 0.045, 0.03], { color: 'wood' });
    b.box([0.22, 0.24, 0.006], [0, 0.17, 0.01], { color: 'paper', rot: [-12, 0, 0] });
    b.torus([0.08, 0.08, 0.004], [-0.03, 0.21, 0.02], { color: 'darkgray', noInk: true, rot: [-12, 0, 0], tube: 0.06 });
    b.rod([-0.08, 0.12, 0.03], [0.07, 0.12, 0.03], 0.004, 'darkgray', { noInk: true }).rod([0.02, 0.12, 0.03], [0.05, 0.2, 0.02], 0.004, 'darkgray', { noInk: true }).rod([0.05, 0.2, 0.02], [0.08, 0.12, 0.03], 0.004, 'darkgray', { noInk: true });
    return b.stick([-0.1, 0.065, 0.05], [0.08, 0.065, 0.05], 0.01, 'yellow').cone([0.01, 0.02, 0.01], [0.09, 0.065, 0.05], { color: 'tan', rot: [0, 0, -90] }).done();
  }),
  e('skewer', 'food', 'grilled food', () => {
    const b = m('skewer').box([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'wood', round: 0.2 }).stick([0, 0.03, 0], [0, 0.32, 0], 0.006, 'silver');
    ['meat', 'green', 'meat', 'red', 'cream', 'meat'].forEach((c, i) => b.box(c === 'meat' ? 0.04 : [0.045, 0.03, 0.04], [0, 0.07 + i * 0.04, 0], { color: c === 'meat' ? '#8a4a2a' : c, round: 0.3, rot: [0, i * 35, 0] }));
    return b.done();
  }),
  e('ski hill', 'sports', 'ski resort', () => {
    const b = m('ski hill').ball([7, 6, 5], [0, 0, -0.5], { color: 'snow' }).ball([3, 3, 2.5], [-2.2, 0.5, 0.3], { color: 'snow' });
    for (const [x, z, h] of [[2.6, 0.8, 1.2], [3.1, -0.2, 1.4], [-3.2, 1.0, 1.1], [1.8, 1.6, 1.0]]) b.cone([h * 0.6, h, h * 0.6], [x, h / 2 + 0.3, z], { color: 'darkgreen' });
    b.each(4, (i) => b.stick([-0.5 + i * 0.35, 2.7 - i * 0.6, 1.2 + i * 0.4], [-0.5 + i * 0.35, 3.0 - i * 0.6, 1.2 + i * 0.4], 0.04, i % 2 ? 'red' : 'blue'));
    return b.box([1.3, 0.8, 1.0], [0.8, 0.4, 2.6], { color: 'darkwood', round: 0.05 }).wedge([1.5, 0.6, 1.2], [0.8, 1.1, 2.6], { color: 'snow' }).done();
  }),
  e('ski jump', 'sports', 'ski resort', () => {
    const b = m('ski jump').box([0.4, 0.15, 0.5], [-1.3, 1.2, 0], { color: 'darkwood' });
    plank(b, [-1.3, 1.15, 0], [0.0, 0.45, 0], 0.4, 0.06, 'snow');
    plank(b, [-0.02, 0.45, 0], [0.3, 0.5, 0], 0.4, 0.06, 'snow');
    b.each(4, (i) => b.stick([-1.3 + i * 0.4, 0, 0], [-1.3 + i * 0.4, 1.15 - i * 0.22, 0], 0.08, 'wood'));
    b.wedge([1.8, 0.4, 0.9], [1.3, 0.2, 0], { color: 'snow', apex: -0.5 });
    b.pair((s) => b.stick([-1.2, 1.25, s * 0.22], [0.0, 0.55, s * 0.22], 0.025, 'red'));
    return b.done();
  }),
  e('ski lift', 'sports', 'ski resort', () => {
    const b = m('ski lift').ball([7, 1.2, 3], [0, 0, 0], { color: 'snow' }).box([1.4, 1.4, 1.4], [3.0, 0.7, 0], { color: 'darkwood', round: 0.05 }).wedge([1.7, 0.6, 1.6], [3.0, 1.7, 0], { color: 'red' });
    for (const x of [-2.6, 0.6]) b.stick([x, 0, 0], [x, 4.0, 0], 0.18, 'steel').stick([x, 4.0, -0.7], [x, 4.0, 0.7], 0.12, 'steel');
    b.pair((s) => b.stick([-2.6, 4.0, s * 0.6], [3.0, 1.4 + 0.6, s * 0.6], 0.03, 'black'));
    for (const [x, z] of [[-1.3, 0.6], [1.6, -0.6]]) {
      const y = 4.0 - ((x + 2.6) / 5.6) * 2.0;
      b.stick([x, y, z], [x, y - 1.0, z], 0.04, 'darkgray').box([0.5, 0.06, 0.4], [x, y - 1.0, z + 0.1], { color: 'blue' }).box([0.5, 0.35, 0.06], [x, y - 0.8, z - 0.1], { color: 'blue' });
    }
    return b.done();
  }),
  e('ski mask', 'wardrobe', 'winter wear', () => {
    const b = m('ski mask').cyl([0.1, 0.06, 0.1], [0, 0.03, 0], { color: 'darkgray' }).ball([0.19, 0.25, 0.21], [0, 0.17, 0], { color: 'black' });
    b.box([0.15, 0.045, 0.04], [0, 0.19, 0.085], { color: 'skin2', round: 0.5 }).ball([0.05, 0.04, 0.02], [0, 0.11, 0.1], { color: 'skin2' });
    b.torus([0.2, 0.2, 0.03], [0, 0.24, 0], { color: 'red', rot: [90, 0, 0], tube: 0.15, noInk: true });
    return b.pair((s) => b.ball(0.025, [s * 0.035, 0.19, 0.1], { color: 'black', eye: true })).done();
  }),
  e('ski pole', 'sports', 'skiing', () => {
    const b = m('ski pole').ball([0.6, 0.3, 0.4], [0, 0, 0], { color: 'snow' });
    b.pair((s) => {
      b.stick([s * 0.12, 0.0, 0], [s * -0.18, 1.2, 0.05], 0.025, 'silver');
      b.cyl([0.04, 0.14, 0.04], [s * -0.19, 1.25, 0.05], { color: 'black', rot: [0, 0, s * 14] });
      b.torus([0.05, 0.08, 0.01], [s * -0.2, 1.18, 0.08], { color: 'red', tube: 0.2 });
      b.cyl([0.11, 0.015, 0.11], [s * 0.09, 0.2, 0.005], { color: 'red', rot: [0, 0, s * 14] });
    });
    return b.done();
  }),
  e('skin cream', 'home', 'bathroom', () =>
    m('skin cream')
      .cyl([0.09, 0.05, 0.09], [0, 0.025, 0], { color: 'white' })
      .cyl([0.08, 0.004, 0.08], [0, 0.051, 0], { color: 'cream' })
      .ball([0.04, 0.025, 0.04], [0, 0.058, 0], { color: 'cream' })
      .cone([0.015, 0.025, 0.015], [0.005, 0.078, 0], { color: 'cream', rot: [0, 0, -30] })
      .cyl([0.095, 0.022, 0.095], [0.08, 0.04, -0.03], { color: 'pink', rot: [60, 0, -20] })
      .done(),
  ),
  e('skirt', 'wardrobe', 'dresses', () => {
    const b = m('skirt').cyl([0.5, 0.52, 0.42], [0, 0.29, 0], { color: 'red', taper: 0.55 }).cyl([0.28, 0.06, 0.24], [0, 0.57, 0], { color: 'darkred' });
    return b.each(8, (i) => b.rod(surf([0, 0.55, 0], [0.135, 0, 0.115], -90 + i * 25, 0), surf([0, 0.04, 0], [0.24, 0, 0.2], -90 + i * 25, 0), 0.01, 'darkred', { noInk: true })).done();
  }),
  e('skis', 'sports', 'skiing', () => {
    const b = m('skis').ball([0.6, 0.3, 0.4], [0, 0, 0], { color: 'snow' });
    b.pair((s) => {
      b.box([0.09, 1.5, 0.025], [s * 0.06, 0.8, 0], { color: s > 0 ? 'red' : 'blue', round: 0.4 });
      b.rod([s * 0.06, 1.54, 0.0], [s * 0.06, 1.66, 0.06], 0.03, s > 0 ? 'red' : 'blue');
      b.box([0.08, 0.12, 0.06], [s * 0.06, 0.8, 0.035], { color: 'darkgray', round: 0.3 });
    });
    return b.done();
  }),
  e('skull', 'clinic', 'bones', () => {
    const bone = '#efe8d6';
    const b = m('skull').ball([0.17, 0.17, 0.2], [0, 0.13, -0.01], { color: bone }).box([0.1, 0.06, 0.09], [0, 0.04, 0.04], { color: bone, round: 0.5 });
    b.pair((s) => b.ball([0.045, 0.045, 0.02], [s * 0.035, 0.12, 0.085], { color: 'black' }));
    b.cone([0.025, 0.03, 0.01], [0, 0.08, 0.095], { color: 'black', rot: [180, 0, 0] });
    return b.each(5, (i) => b.box([0.012, 0.016, 0.006], [-0.024 + i * 0.012, 0.05, 0.087], { color: 'white' })).done();
  }),
  e('skullcap', 'wardrobe', 'hats', () =>
    m('skullcap')
      .cyl([0.2, 0.05, 0.2], [0, 0.025, 0], { color: 'navy' })
      .ball([0.2, 0.18, 0.2], [0, 0.05, 0], { color: 'navy' })
      .torus([0.21, 0.21, 0.04], [0, 0.03, 0], { color: '#3a5a9a', rot: [90, 0, 0], tube: 0.18 })
      .done(),
  ),
  e('skylight', 'home', 'windows', () => {
    const b = m('skylight').wedge([1.6, 0.9, 1.2], [0, 0.45, 0], { color: '#c0503a', apex: -0.5 });
    const ang = (-Math.atan2(0.9, 1.6) * 180) / Math.PI;
    b.box([0.6, 0.08, 0.6], [0.0 + 0.5 * 0.04, 0.45 + 0.87 * 0.04, 0], { color: 'white', rot: [0, 0, ang] });
    return b.box([0.5, 0.06, 0.5], [0.0 + 0.5 * 0.08, 0.45 + 0.87 * 0.08, 0], { color: 'glass', rot: [0, 0, ang] }).done();
  }),
  e('skyscraper', 'places', 'towers', () => {
    const g = '#3f5f8a';
    const b = m('skyscraper').box([1.0, 1.6, 1.0], [0, 0.8, 0], { color: g, round: 0 }).box([0.8, 1.0, 0.8], [0, 2.1, 0], { color: g, round: 0 }).box([0.55, 0.4, 0.55], [0, 2.8, 0], { color: g, round: 0 }).stick([0, 3.0, 0], [0, 3.5, 0], 0.03, 'silver').ball(0.05, [0, 3.5, 0], { color: 'red', glow: true });
    b.each(5, (i) => b.box([1.01, 0.04, 1.01], [0, 0.3 + i * 0.28, 0], { color: '#a9cce8', noInk: true, round: 0 }));
    b.each(3, (i) => b.box([0.81, 0.04, 0.81], [0, 1.8 + i * 0.28, 0], { color: '#a9cce8', noInk: true, round: 0 }));
    return b.box([0.3, 0.3, 0.05], [0, 0.15, 0.51], { color: 'darkgray' }).box([1.1, 0.06, 1.1], [0, 1.62, 0], { color: 'steel', round: 0 }).done();
  }),
  e('sled', 'sports', 'winter sports', () => {
    const b = m('sled', { view: 'side' }).box([0.38, 0.085, 0.62], [0, 0.13, -0.03], { color: 'wood', round: 0.3 });
    b.each(3, (i) => b.box([0.39, 0.012, 0.012], [0, 0.17, -0.2 + i * 0.16], { color: 'darkwood', noInk: true }));
    b.pair((s) => {
      b.rod([s * 0.15, 0.015, -0.4], [s * 0.15, 0.015, 0.3], 0.025, 'red').rod([s * 0.15, 0.015, 0.3], [s * 0.15, 0.13, 0.42], 0.025, 'red');
      b.stick([s * 0.15, 0.02, -0.2], [s * 0.15, 0.11, -0.2], 0.03, 'red').stick([s * 0.15, 0.02, 0.15], [s * 0.15, 0.11, 0.15], 0.03, 'red');
    });
    b.box([0.38, 0.02, 0.06], [0, 0.14, 0.32], { color: 'darkwood' });
    return b.rod([0.1, 0.13, 0.42], [0.0, 0.05, 0.6], 0.012, 'tan').rod([-0.1, 0.13, 0.42], [0.0, 0.05, 0.6], 0.012, 'tan').done();
  }),
];

void face;
void held;
void wear;
void who;
