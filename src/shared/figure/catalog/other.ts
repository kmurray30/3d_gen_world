/** Catalog chunk other: the words in assign/other.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M } from '../dsl';
import { ani, beast, face, hat, held, wear, who, type Extra } from '../accessories';
import { bird } from '../kit';
import { measure } from '../math';
import { col } from '../colors';
import type { Figure, Vec3 } from '../types';

/* ----- local helpers ----- */

const D2R = Math.PI / 180;
type O = Parameters<M['ball']>[2];

/** A kit figure (person, animal, bird) with its root parts raised by dy and extra m() parts added (a plinth...). */
function lift(fig: Figure, dy: number, add: (b: M) => M): Figure {
  const extra = add(m(fig.key)).parts.list;
  const parts = fig.parts.map((p) => (p.parent ? p : { ...p, at: [p.at[0], p.at[1] + dy, p.at[2]] as Vec3 }));
  return measure({ ...fig, parts: [...parts, ...extra] });
}

/** Rods along an arc of radius r around c: in the x-y plane (angles from +x, counterclockwise) or 'zy' (from +z). */
function arc(b: M, c: Vec3, r: number, a0: number, a1: number, n: number, t: number, color: string, plane: 'xy' | 'zy' = 'xy', o: O = {}): M {
  const pt = (a: number): Vec3 =>
    plane === 'xy' ? [c[0] + Math.cos(a * D2R) * r, c[1] + Math.sin(a * D2R) * r, c[2]] : [c[0], c[1] + Math.sin(a * D2R) * r, c[2] + Math.cos(a * D2R) * r];
  for (let i = 0; i < n; i++) b.rod(pt(a0 + ((a1 - a0) * i) / n), pt(a0 + ((a1 - a0) * (i + 1)) / n), t, color, o);
  return b;
}

/** A flat box from a to b in the x-y plane (zigzags, letter strokes). */
function seg(b: M, a: Vec3, c: Vec3, t: number, dep: number, color: string, o: O = {}): M {
  const dx = c[0] - a[0], dy = c[1] - a[1];
  return b.box([t, Math.hypot(dx, dy), dep], [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], { color, round: 0.15, rot: [0, 0, -Math.atan2(dx, dy) / D2R], ...o });
}

/** A puffy cloud w wide centred at (x, y, z). */
function cloud(b: M, x: number, y: number, z: number, w: number, c = 'white', o: O = {}): M {
  return b
    .ball([w * 0.55, w * 0.48, w * 0.45], [x, y + w * 0.08, z], { color: c, ...o })
    .ball([w * 0.42, w * 0.34, w * 0.38], [x - w * 0.3, y - w * 0.01, z], { color: c, ...o })
    .ball([w * 0.42, w * 0.36, w * 0.38], [x + w * 0.28, y, z], { color: c, ...o })
    .ball([w * 0.95, w * 0.22, w * 0.36], [x, y - w * 0.08, z], { color: c, ...o });
}

/** A teardrop s wide, round end centred at (x, y, z), point up. */
function drop(b: M, x: number, y: number, z: number, s: number, c = 'water', o: O = {}): M {
  return b.ball(s, [x, y, z], { color: c, ...o }).cone([s * 0.86, s * 0.95, s * 0.86], [x, y + s * 0.47, z], { color: c, ...o });
}

/** A zigzag lightning bolt from (x, top) down to (x, top - h). */
function bolt(b: M, x: number, top: number, h: number, w: number, z = 0, c = 'yellow'): M {
  const o: O = { glow: true };
  seg(b, [x + w * 0.35, top, z], [x - w * 0.15, top - h * 0.45, z], w * 0.32, w * 0.14, c, o);
  seg(b, [x - w * 0.3, top - h * 0.42, z], [x + w * 0.3, top - h * 0.5, z], w * 0.3, w * 0.14, c, o);
  return seg(b, [x + w * 0.2, top - h * 0.48, z], [x - w * 0.2, top - h, z], w * 0.2, w * 0.14, c, o);
}

/** Trees: a pine of three cones, a round leafy tree, a palm. */
function pine(b: M, x: number, z: number, h: number, c = 'darkgreen'): M {
  return b
    .cyl([h * 0.08, h * 0.3, h * 0.08], [x, h * 0.15, z], { color: 'bark' })
    .cone([h * 0.5, h * 0.45, h * 0.5], [x, h * 0.42, z], { color: c })
    .cone([h * 0.38, h * 0.4, h * 0.38], [x, h * 0.64, z], { color: c })
    .cone([h * 0.25, h * 0.32, h * 0.25], [x, h * 0.84, z], { color: c });
}
function leafy(b: M, x: number, z: number, h: number, c = 'leaf'): M {
  return b.cyl([h * 0.1, h * 0.5, h * 0.1], [x, h * 0.25, z], { color: 'bark', taper: 0.7 }).ball([h * 0.62, h * 0.56, h * 0.62], [x, h * 0.7, z], { color: c });
}
function palm(b: M, x: number, z: number, h: number, c = 'green'): M {
  b.rod([x, 0, z], [x + h * 0.08, h * 0.5, z], h * 0.07, 'bark').rod([x + h * 0.08, h * 0.5, z], [x + h * 0.03, h * 0.92, z], h * 0.06, 'bark');
  around(6, h * 0.2, 0.3).forEach(([lx, lz], i) =>
    b.ball([h * 0.42, h * 0.035, h * 0.12], [x + h * 0.03 + lx, h * 0.88, z + lz], { color: c, rot: [0, -(0.3 + (i / 6) * Math.PI * 2) / D2R, -22] }),
  );
  return b.ball(h * 0.1, [x + h * 0.03, h * 0.93, z], { color: c });
}

/** A little house: walls, gable roof, door, two windows. */
function house(b: M, x: number, z: number, s: number, wall: string, roof: string, o: O = {}): M {
  return b
    .box([s, s * 0.75, s * 0.8], [x, s * 0.375, z], { color: wall, ...o })
    .wedge([s * 1.12, s * 0.5, s * 0.9], [x, s * 1.0, z], { color: roof, ...o })
    .box([s * 0.2, s * 0.38, 0.04], [x, s * 0.19, z + s * 0.41], { color: 'darkwood', ...o })
    .box([s * 0.18, s * 0.16, 0.04], [x - s * 0.3, s * 0.45, z + s * 0.41], { color: 'glass', ...o })
    .box([s * 0.18, s * 0.16, 0.04], [x + s * 0.3, s * 0.45, z + s * 0.41], { color: 'glass', ...o });
}

/** A building front for the places: walls, flat roof, door, windows beside it, a sign over the door. */
function bldg(b: M, w: number, h: number, d: number, wall: string, roof: string, sign: string, signColor = 'white'): M {
  b.box([w, h, d], [0, h / 2, 0], { color: wall, round: 0.04 })
    .box([w * 1.05, 0.2, d * 1.05], [0, h + 0.1, 0], { color: roof, round: 0.1 })
    .box([w * 0.2, h * 0.4, 0.08], [0, h * 0.2, d / 2], { color: 'darkwood', round: 0.1 })
    .label(sign, [w * 0.62, h * 0.14], [0, h * 0.52, d / 2 + 0.04], { color: signColor });
  for (const y of h > 2.6 ? [0.28, 0.78] : [0.3]) b.pair((s) => b.box([w * 0.2, h * 0.2, 0.06], [s * w * 0.3, h * y, d / 2], { color: 'glass', round: 0.1 }));
  return b;
}

/** A number card on a stand with counting beads in front of it. */
function num(key: string, text: string, n: number, card: string, bead: string): Figure {
  const H = 0.75, W = 0.62;
  const b = m(key).box([W + 0.12, 0.1, 0.44], [0, 0.05, 0], { color: 'wood', round: 0.2 }).label(text, [W, H], [0, 0.1 + H / 2, -0.11], { color: card });
  const rows = Math.ceil(n / 5), per = Math.ceil(n / rows), d = 0.11;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / per), c = i % per, cnt = Math.min(per, n - r * per);
    b.ball(d * 0.9, [(c - (cnt - 1) / 2) * d, 0.1 + d * 0.42, 0.03 + r * d], { color: bead });
  }
  return b.done();
}

/** A night-sky panel on a stand with stars joined by faint lines. */
function sky(key: string, pts: Array<[number, number]>, links: Array<[number, number]>, big: number[] = []): Figure {
  const b = m(key)
    .box([0.5, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' })
    .stick([0, 0.1, 0], [0, 0.22, 0], 0.08, 'darkgray')
    .box([1.15, 0.85, 0.1], [0, 0.62, -0.05], { color: 'navy', round: 0.1 });
  for (const [i, j] of links) b.stick([pts[i][0], pts[i][1], 0.005], [pts[j][0], pts[j][1], 0.005], 0.014, '#b9c8f0', { noInk: true });
  pts.forEach(([x, y], i) => (big.includes(i) ? b.star(0.14, [x, y, 0.02], { color: 'yellow', glow: true }) : b.cyl([0.075, 0.03, 0.075], [x, y, 0.015], { color: 'gold', rot: [90, 0, 0], segs: 4, glow: true })));
  return b.done();
}

/** The zodiac plinth: a navy drum with a gold rim, the sign's name on the front, two little stars. */
function zb(b: M, name: string): M {
  return b
    .cyl([0.9, 0.12, 0.9], [0, 0.06, 0], { color: 'navy' })
    .torus([0.9, 0.9, 0.04], [0, 0.12, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.06 })
    .label(name, [0.42, 0.08], [0, 0.06, 0.45], { color: 'gold' })
    .star(0.12, [-0.33, 0.18, -0.22], { color: 'gold' })
    .star(0.1, [0.34, 0.17, -0.2], { color: 'gold' });
}

/** A head-and-shoulders bust on a plinth (for hairstyles and faces). Head centre at y 0.25, front at z 0.08. */
function bust(key: string, o: { skin?: string; hair?: string; top?: string; cap?: boolean; brows?: boolean; mouth?: boolean }, add?: (b: M, hc: string) => void): Figure {
  const sk = o.skin ?? 'skin2', hc = o.hair ?? 'darkbrown';
  const b = m(key)
    .cyl([0.22, 0.035, 0.18], [0, 0.0175, 0], { color: 'darkwood' })
    .ball([0.26, 0.12, 0.13], [0, 0.09, 0], { color: o.top ?? 'teal' })
    .cyl([0.06, 0.06, 0.06], [0, 0.16, 0], { color: sk })
    .ball([0.15, 0.18, 0.16], [0, 0.25, 0], { color: sk })
    .ball([0.025, 0.03, 0.025], [0, 0.235, 0.082], { color: sk });
  b.pair((s) => {
    b.ball([0.028, 0.045, 0.025], [s * 0.075, 0.245, 0], { color: sk });
    b.ball([0.022, 0.028, 0.012], [s * 0.033, 0.265, 0.072], { color: 'black', eye: true, noInk: true });
    if (o.brows !== false) b.box([0.036, 0.009, 0.01], [s * 0.033, 0.29, 0.066], { color: hc, noInk: true });
  });
  if (o.mouth !== false) b.capsule([0.012, 0.04, 0.01], [0, 0.203, 0.073], { color: 'darkred', rot: [0, 0, 90], noInk: true });
  if (o.cap !== false) b.ball([0.163, 0.1, 0.17], [0, 0.32, -0.015], { color: hc }).ball([0.158, 0.15, 0.1], [0, 0.26, -0.04], { color: hc });
  add?.(b, hc);
  return b.done();
}

/** A simple person (for groups and scenes): h tall, standing at (x, z), feet at o.y (default 0). */
function folk(b: M, x: number, z: number, h: number, o: { shirt: string; pants: string; skin?: string; hair?: string; skirt?: string; up?: boolean; shoes?: string; y?: number }): M {
  const sk = o.skin ?? 'skin2', y0 = o.y ?? 0, Y = (k: number) => y0 + h * k;
  b.pair((s) => {
    b.rod([x + s * h * 0.05, Y(0.06), z], [x + s * h * 0.05, Y(0.42), z], h * 0.085, o.pants);
    b.box([h * 0.09, h * 0.05, h * 0.14], [x + s * h * 0.05, Y(0.025), z + h * 0.02], { color: o.shoes ?? 'darkbrown', round: 0.6 });
    const sh: Vec3 = [x + s * h * 0.14, Y(0.72), z];
    const hd: Vec3 = o.up ? [x + s * h * 0.22, Y(1.0), z] : [x + s * h * 0.17, Y(0.47), z + h * 0.02];
    b.rod(sh, hd, h * 0.075, o.shirt).ball(h * 0.075, hd, { color: sk });
  });
  b.box([h * 0.26, h * 0.32, h * 0.16], [x, Y(0.6), z], { color: o.shirt, round: 0.6 });
  if (o.skirt) b.cyl([h * 0.34, h * 0.32, h * 0.24], [x, Y(0.36), z], { color: o.skirt, taper: 0.55 });
  b.ball([h * 0.2, h * 0.21, h * 0.2], [x, Y(0.86), z], { color: sk }).ball([h * 0.215, h * 0.13, h * 0.21], [x, Y(0.925), z - h * 0.012], { color: o.hair ?? 'darkbrown' });
  return b.pair((s) => b.ball([h * 0.026, h * 0.034, h * 0.015], [x + s * h * 0.04, Y(0.86), z + h * 0.098], { color: 'black', eye: true, noInk: true }));
}

/** A snowflake s across in the x-y plane. */
function flake(b: M, x: number, y: number, z: number, s: number, c = 'white'): M {
  for (const a of [0, 60, 120]) seg(b, [x - (Math.cos(a * D2R) * s) / 2, y - (Math.sin(a * D2R) * s) / 2, z], [x + (Math.cos(a * D2R) * s) / 2, y + (Math.sin(a * D2R) * s) / 2, z], s * 0.13, s * 0.1, c);
  return b;
}

/** A round emoji face d wide on a stick, centre at y. Features go at z = d * 0.15. */
function emoji(key: string, d: number, y: number, c: string): M {
  return m(key)
    .cyl([d * 0.5, 0.04, d * 0.4], [0, 0.02, 0], { color: 'darkgray' })
    .stick([0, 0.04, 0], [0, y - d * 0.45, 0], d * 0.08, 'darkgray')
    .ball([d, d, d * 0.32], [0, y, 0], { color: c });
}

/** Custom person extras. */
const barrel: Extra = (p, d) => {
  p.add({ name: 'barrel', parent: 'hips', at: [0, 0, 0], shape: 'cyl', size: [d.tw * 1.55, d.legLen * 0.8, d.td * 2.1], off: [0, d.torsoH * 0.12, 0], color: col('wood'), layer: 5 });
  for (const k of [-0.25, 0.25]) p.add({ name: `hoop${k}`, parent: 'hips', at: [0, 0, 0], shape: 'torus', tube: 0.08, size: [d.tw * 1.6, d.td * 2.15, d.legLen * 0.06], srot: [90, 0, 0], off: [0, d.torsoH * 0.12 + d.legLen * k, 0], color: col('iron'), layer: 6 });
};
const scythe: Extra = (p, d) => {
  const a = d.aw, H = d.H;
  p.add({ name: 'scytheShaft', parent: 'handR', at: [0, 0, 0], shape: 'capsule', size: [a * 0.32, H * 1.0, a * 0.32], off: [0, H * 0.18, a * 0.35], color: col('darkwood'), layer: 4 });
  p.add({ name: 'scytheBlade', parent: 'handR', at: [0, 0, 0], shape: 'box', size: [H * 0.42, a * 0.7, a * 0.12], srot: [0, 0, -12], off: [H * 0.2, H * 0.62, a * 0.35], round: 0.6, color: col('silver'), layer: 5 });
};
const beakMask: Extra = (p, d) => {
  p.add({ name: 'beakMask', parent: 'head', at: [0, 0, 0], shape: 'cyl', taper: 0, size: [d.headW * 0.5, d.headH * 1.1, d.headW * 0.5], srot: [100, 0, 0], off: [0, d.headY - d.headH * 0.1, d.headD * 0.85], color: col('#efe6c8'), layer: 6 });
  for (const s of [1, -1]) p.add({ name: `lens${s}`, parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 0.24, d.headW * 0.24, d.headW * 0.1], off: [s * d.headW * 0.2, d.headY + d.headH * 0.08, d.headD * 0.46], color: col('#2a2726'), layer: 6 });
};
const fringe: Extra = (p, d) => {
  p.add({ name: 'fringe', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 0.6, d.headH * 0.45, d.headD * 0.3], srot: [0, 0, -25], off: [d.headW * 0.16, d.headY + d.headH * 0.14, d.headD * 0.38], color: col('black'), layer: 6 });
};

/* ----- entries ----- */

export const ENTRIES: CatalogEntry[] = [
  e('acid rain', 'nature', 'weather', () => {
    const b = m('acid rain').cyl([0.9, 0.04, 0.6], [0, 0.02, 0], { color: '#9bc43a' }).ball(0.06, [0.15, 0.05, 0.1], { color: 'lime' }).ball(0.045, [-0.2, 0.045, -0.05], { color: 'lime' });
    cloud(b, 0, 0.88, 0, 0.85, '#7f8a70');
    for (const [x, y, z] of [[-0.25, 0.55, 0.05], [0.02, 0.38, -0.05], [0.24, 0.5, 0.08], [-0.1, 0.2, 0.12], [0.15, 0.25, -0.1]]) drop(b, x, y, z, 0.1, 'lime');
    return b.done();
  }),
  e('afro', 'wardrobe', 'hairstyles', () => bust('afro', { skin: 'skin4', hair: '#2a1d16', top: 'orange', cap: false }, (b, hc) => b.ball([0.3, 0.27, 0.25], [0, 0.3, -0.06], { color: hc }))),
  e('amoeba', 'clinic', 'germs', () => {
    const b = m('amoeba').ball([0.17, 0.08, 0.14], [0, 0.045, 0], { color: '#a6dca0' });
    around(5, 0.085, 0.4).forEach(([x, z], i) => b.ball([0.07, 0.05, 0.06], [x, 0.03, z], { color: '#a6dca0', rot: [0, -(0.4 + (i / 5) * Math.PI * 2) / D2R, 0] }));
    return b.ball([0.045, 0.035, 0.045], [0.01, 0.075, 0.02], { color: '#4f7a3a' }).ball(0.02, [-0.04, 0.07, 0.03], { color: '#d9f2c8' }).done();
  }),
  e('ampersand', 'ideas', 'symbols', () => m('ampersand').label('&', [0.22, 0.26], [0, 0.19, 0], { color: 'purple' }).box([0.28, 0.06, 0.14], [0, 0.03, 0], { color: 'wood' }).done()),
  e('angry eyes', 'ideas', 'emotions', () => {
    const b = m('angry eyes').cyl([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' }).stick([0, 0.03, 0], [0, 0.17, 0], 0.025, 'darkgray');
    return b
      .pair((s) => {
        b.ball([0.1, 0.11, 0.08], [s * 0.055, 0.22, 0], { color: 'white' }).ball([0.04, 0.04, 0.015], [s * 0.045, 0.21, 0.04], { color: 'black', eye: true, noInk: true });
        b.box([0.1, 0.028, 0.04], [s * 0.055, 0.285, 0.02], { color: 'black', rot: [0, 0, s * 28] });
      })
      .done();
  }),
  e('animal', 'wild', 'animals', () =>
    beast('animal', { color: '#a0703a', body: [0.9, 0.45, 0.4], legL: 0.35, legW: 0.11, neckL: 0.15, neckLean: 35, head: [0.3, 0.26, 0.24], snout: { len: 0.14, h: 0.12, w: 0.13, color: '#e0c49a' }, ears: 'pointy', earSize: 0.12, tail: 'long', belly: '#e8cfa5' }),
  ),
  e('aquarius (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('aquarius (stars)'), 'AQUARIUS')
      .cyl([0.14, 0.24, 0.14], [-0.15, 0.24, -0.05], { color: 'stone' })
      .ball([0.3, 0.36, 0.3], [-0.12, 0.5, -0.05], { color: '#5a8fd0', rot: [0, 0, -35] })
      .cyl([0.12, 0.16, 0.12], [0.018, 0.697, -0.05], { color: '#5a8fd0', rot: [0, 0, -35] })
      .torus([0.16, 0.16, 0.05], [0.07, 0.77, -0.05], { color: 'gold', rot: [90, 0, -35] })
      .torus([0.14, 0.18, 0.04], [-0.3, 0.55, -0.05], { color: 'gold', rot: [0, 0, -35] })
      .cyl([0.4, 0.03, 0.34], [0.2, 0.135, 0.12], { color: 'water' });
    return b.rod([0.1, 0.76, -0.05], [0.24, 0.55, 0.05], 0.05, 'skyblue', { noInk: true }).rod([0.24, 0.55, 0.05], [0.22, 0.15, 0.12], 0.05, 'skyblue', { noInk: true }).done();
  }),
  e('aries (stars)', 'sky', 'zodiac', () =>
    lift(
      beast('aries (stars)', { color: 'wool', body: [0.6, 0.42, 0.4], bodyShape: 'ball', legL: 0.22, legW: 0.08, hoof: 'darkbrown', neckL: 0.1, neckLean: 40, head: [0.24, 0.2, 0.19], headColor: '#e8dcc0', snout: { len: 0.09, h: 0.1, w: 0.11, color: '#e8dcc0' }, ears: 'side', earSize: 0.1, tail: 'stub', acc: [ani.horns('gold', 'ram')] }),
      0.12,
      (b) => zb(b, 'ARIES'),
    ),
  ),
  e('art', 'ideas', 'arts', () => {
    const b = m('art');
    b.pair((s) => b.rod([s * 0.2, 0, 0.14], [s * 0.05, 0.78, 0], 0.035, 'wood'));
    return b
      .rod([0, 0, -0.25], [0, 0.72, -0.02], 0.035, 'wood')
      .box([0.5, 0.035, 0.09], [0, 0.29, 0.1], { color: 'wood' })
      .box([0.46, 0.38, 0.06], [0, 0.5, 0.06], { color: 'white', rot: [-8, 0, 0] })
      .box([0.44, 0.14, 0.01], [0, 0.6, 0.1], { color: 'skyblue', noInk: true, rot: [-8, 0, 0] })
      .ball([0.36, 0.18, 0.02], [0.05, 0.4, 0.1], { color: 'green', noInk: true, rot: [-8, 0, 0] })
      .ball([0.08, 0.08, 0.02], [-0.13, 0.62, 0.11], { color: 'yellow', noInk: true })
      .ball([0.26, 0.03, 0.2], [0.26, 0.05, 0.22], { color: 'lightwood', rot: [0, 0, 20] })
      .ball(0.04, [0.2, 0.06, 0.26], { color: 'red', noInk: true })
      .ball(0.04, [0.29, 0.1, 0.25], { color: 'blue', noInk: true })
      .ball(0.04, [0.33, 0.13, 0.18], { color: 'yellow', noInk: true })
      .done();
  }),
  e('aurora borealis', 'sky', 'sky lights', () => {
    const b = m('aurora borealis').cyl([3.4, 0.12, 1.6], [0, 0.06, 0], { color: 'snow' }).ball([1.4, 0.6, 1.0], [-0.9, 0.12, -0.2], { color: 'snow' }).ball([1.2, 0.45, 0.9], [0.9, 0.1, 0.1], { color: 'snow' });
    pine(b, 1.2, 0.4, 0.9);
    pine(b, -0.4, 0.5, 0.7);
    const cs = ['#5af2a0', '#3fd6c6', '#7af27a', '#b07af2', '#4fe0b0'];
    cs.forEach((c, i) => b.box([0.75, 1.5 - (i % 2) * 0.3, 0.04], [-1.3 + i * 0.65, 1.95 + (i % 2) * 0.15, (i % 2 ? 0.15 : -0.15)], { color: c, glow: true, noInk: true, rot: [0, i % 2 ? -35 : 35, 0], round: 0.5 }));
    for (const [x, y] of [[-1.5, 2.9], [0.4, 3.0], [1.4, 2.8], [-0.5, 2.95]]) b.ball(0.08, [x, y, -0.3], { color: 'white', glow: true });
    return b.done();
  }),
  e('backgammon', 'toys', 'board games', () => {
    const b = m('backgammon').box([0.52, 0.04, 0.32], [0, 0.02, 0], { color: 'wood' }).box([0.52, 0.32, 0.04], [0, 0.16, -0.18], { color: 'wood' });
    for (let i = 0; i < 5; i++) {
      const x = -0.2 + i * 0.1, c = i % 2 ? 'cream' : 'darkred';
      b.wedge([0.07, 0.12, 0.006], [x, 0.043, 0.09], { color: c, rot: [-90, 0, 0], noInk: true }).wedge([0.07, 0.12, 0.006], [x, 0.043, -0.09], { color: i % 2 ? 'darkred' : 'cream', rot: [90, 0, 0], noInk: true });
      b.wedge([0.07, 0.12, 0.006], [x, 0.08, -0.157], { color: c, noInk: true }).wedge([0.07, 0.12, 0.006], [x, 0.24, -0.157], { color: i % 2 ? 'darkred' : 'cream', rot: [0, 0, 180], noInk: true });
    }
    for (const [x, z, n, c] of [[-0.2, 0.11, 3, 'white'], [0.1, 0.11, 2, 'black'], [0.2, -0.11, 3, 'black'], [-0.1, -0.11, 2, 'white']] as const) for (let k = 0; k < n; k++) b.cyl([0.06, 0.015, 0.06], [x, 0.048 + k * 0.016, z], { color: c });
    return b.box(0.035, [0.02, 0.06, 0.02], { color: 'white', rot: [0, 30, 0] }).box(0.035, [0.07, 0.06, -0.01], { color: 'white', rot: [0, 10, 0] }).done();
  }),
  e('bay', 'nature', 'landforms', () => {
    const b = m('bay').cyl([7, 0.16, 6], [0, 0.08, 0], { color: 'water' });
    [[-3, 0.3, 1.1], [-3.1, -1, 1.6], [-2.2, -2.3, 2.0], [-0.8, -2.8, 2.4], [0.8, -2.8, 2.0], [2.2, -2.2, 1.7], [3.0, -0.9, 1.3], [2.9, 0.5, 0.9]].forEach(([x, z, h]) =>
      b.ball([1.9, h, 1.6], [x, h * 0.35, z], { color: h > 1.5 ? 'darkgreen' : 'grass' }),
    );
    b.ball([1.2, 0.3, 0.9], [-2.6, 0.12, 0.8], { color: 'sand' }).ball([1.2, 0.3, 0.9], [2.5, 0.12, 0.9], { color: 'sand' }).ball([3.6, 0.3, 1.4], [0, 0.1, -1.9], { color: 'sand' });
    b.cyl([0.5, 2.2, 0.5], [2.9, 1.6, 0.6], { color: 'white', taper: 0.75 }).cyl([0.48, 0.35, 0.48], [2.9, 1.3, 0.6], { color: 'red' }).cyl([0.42, 0.3, 0.42], [2.9, 2.0, 0.6], { color: 'red' }).cyl([0.4, 0.3, 0.4], [2.9, 2.85, 0.6], { color: 'yellow', glow: true }).cone([0.5, 0.35, 0.5], [2.9, 3.17, 0.6], { color: 'red' });
    return b.box([0.3, 0.15, 0.9], [-0.4, 0.22, 0.6], { color: 'white', round: 0.6 }).wedge([0.04, 0.8, 0.6], [-0.4, 0.7, 0.6], { color: 'white', apex: -0.5 }).stick([-0.42, 0.25, 0.6], [-0.42, 1.1, 0.6], 0.04, 'wood').done();
  }),
  e('beauty', 'ideas', 'abstract', () =>
    m('beauty')
      .cyl([0.42, 0.12, 0.34], [0, 0.06, 0], { color: 'gold' })
      .stick([0, 0.1, 0], [0, 0.4, 0], 0.08, 'gold')
      .torus([0.72, 0.94, 0.16], [0, 0.84, 0], { color: 'pink', tube: 0.17 })
      .ball([0.62, 0.84, 0.03], [0, 0.82, 0], { color: 'glass' })
      .heart(0.24, [0, 1.36, 0], { color: 'magenta' })
      .star(0.16, [0.42, 1.1, 0.05], { color: 'gold', glow: true })
      .star(0.11, [-0.4, 0.55, 0.05], { color: 'gold', glow: true })
      .done(),
  ),
  e('behemoth', 'fantasy', 'monsters', () =>
    beast('behemoth', { color: '#6b5a4a', body: [5, 2.6, 2.6], bodyShape: 'ball', legL: 1.1, legW: 0.75, hoof: '#3a2a20', neckL: 0.5, neckLean: 55, neckW: 1.4, head: [1.8, 1.4, 1.5], snout: { len: 0.7, h: 0.8, w: 1.1, color: '#8a7a6a' }, ears: 'side', earSize: 0.4, tail: 'tuft', belly: '#8a7a6a', acc: [ani.horns('cream', 'bull'), ani.quills('#4a3a2a')] }),
  ),
  e('bench press', 'sports', 'gym', () => {
    const b = m('bench press').box([0.34, 0.15, 1.1], [0, 0.47, 0.1], { color: 'red', round: 0.5 });
    for (const z of [0.5, -0.3]) b.stick([0, 0, z], [0, 0.4, z], 0.07, 'steel').box([0.4, 0.04, 0.08], [0, 0.02, z], { color: 'steel' });
    b.pair((s) => {
      b.stick([s * 0.45, 0, -0.45], [s * 0.45, 1.1, -0.45], 0.07, 'darkgray').box([0.12, 0.04, 0.4], [s * 0.45, 0.02, -0.45], { color: 'darkgray' }).box([0.08, 0.1, 0.08], [s * 0.45, 0.94, -0.4], { color: 'darkgray' });
      b.cyl([0.44, 0.06, 0.44], [s * 0.68, 1.02, -0.4], { color: 'black', rot: [0, 0, 90] }).cyl([0.32, 0.05, 0.32], [s * 0.74, 1.02, -0.4], { color: 'red', rot: [0, 0, 90] });
    });
    return b.stick([-0.9, 1.02, -0.4], [0.9, 1.02, -0.4], 0.04, 'steel').done();
  }),
  e('big dipper', 'sky', 'constellations', () =>
    sky('big dipper', [[0.4, 0.8], [0.42, 0.55], [0.14, 0.5], [0.12, 0.72], [-0.1, 0.77], [-0.28, 0.74], [-0.46, 0.58]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]),
  ),
  e('birthday suit', 'ideas', 'sayings', () => who('birthday suit', { skin: 'skin2', top: 'skin2', bottom: 'skin2', shoes: 'skin2', style: 'short', hair: 'brown', acc: [hat('party'), barrel] })),
  e('black hole', 'sky', 'space', () =>
    m('black hole')
      .torus([4.2, 4.2, 0.2], [0, 2.5, 0], { color: 'orange', glow: true, rot: [72, 0, 12], tube: 0.4 })
      .torus([2.6, 2.6, 0.14], [0, 2.5, 0], { color: 'yellow', glow: true, rot: [72, 0, 12], tube: 0.25 })
      .torus([2.05, 2.05, 0.1], [0, 2.5, 0], { color: '#ffd9a0', glow: true, tube: 0.1 })
      .ball(1.8, [0, 2.5, 0], { color: '#141218' })
      .done(),
  ),
  e('blank', 'ideas', 'symbols', () => {
    const b = m('blank');
    b.pair((s) => b.rod([s * 0.25, 0, 0.12], [s * 0.12, 0.95, 0], 0.035, 'darkwood'));
    return b.rod([0, 0, -0.25], [0, 0.9, -0.02], 0.035, 'darkwood').box([0.6, 0.04, 0.09], [0, 0.18, 0.1], { color: 'darkwood' }).box([0.58, 0.72, 0.08], [0, 0.56, 0.06], { color: 'white', rot: [-7, 0, 0], round: 0.05 }).done();
  }),
  e('blizzard', 'nature', 'weather', () => {
    const b = m('blizzard').cyl([1.3, 0.08, 0.8], [0, 0.04, 0], { color: 'snow' }).ball([0.7, 0.3, 0.5], [-0.3, 0.1, 0], { color: 'snow' }).ball([0.5, 0.22, 0.4], [0.35, 0.08, 0.1], { color: 'snow' });
    cloud(b, 0, 1.0, 0, 1.0, '#aeb9c2');
    for (const y of [0.35, 0.52, 0.7]) b.rod([-0.55, y, 0.15], [0.45, y + 0.05, 0.15], 0.025, 'skyblue', { noInk: true });
    for (const [x, y, z] of [[-0.4, 0.45, 0.25], [-0.1, 0.6, 0.3], [0.25, 0.4, 0.25], [0.5, 0.62, 0], [-0.55, 0.75, 0], [0.1, 0.28, 0.3], [0.38, 0.8, 0.2], [-0.25, 0.3, -0.2]]) b.ball(0.07, [x, y, z], { color: 'white' });
    return b.done();
  }),
  e('blue screen of death', 'tech', 'computers', () =>
    m('blue screen of death')
      .box([0.26, 0.025, 0.18], [0, 0.0125, 0], { color: 'darkgray' })
      .box([0.06, 0.2, 0.04], [0, 0.12, -0.03], { color: 'darkgray' })
      .box([0.64, 0.42, 0.07], [0, 0.42, -0.015], { color: 'black', round: 0.1 })
      .box([0.58, 0.36, 0.01], [0, 0.42, 0.022], { color: '#1f5fd6', glow: true, round: 0.05 })
      .label(':(', [0.2, 0.12], [-0.12, 0.47, 0.03], { color: '#1f5fd6' })
      .box([0.3, 0.025, 0.005], [0.02, 0.36, 0.03], { color: 'white', noInk: true })
      .box([0.24, 0.025, 0.005], [-0.01, 0.32, 0.03], { color: 'white', noInk: true })
      .done(),
  ),
  e('boo', 'fantasy', 'spirits', () => {
    const b = m('boo').ball([0.5, 0.52, 0.46], [0, 0.82, 0], { color: 'white' }).cyl([0.5, 0.48, 0.46], [0, 0.52, 0], { color: 'white', taper: 0.95 });
    for (const x of [-0.18, -0.06, 0.06, 0.18]) b.ball([0.14, 0.12, 0.14], [x, 0.29, 0.13], { color: 'white' });
    b.pair((s) => {
      b.rod([s * 0.22, 0.72, 0], [s * 0.38, 1.18, 0.04], 0.1, 'white');
      b.ball([0.07, 0.11, 0.03], [s * 0.09, 0.88, 0.22], { color: 'black', eye: true, noInk: true });
    });
    return b.ball([0.1, 0.13, 0.04], [0, 0.72, 0.225], { color: 'black', noInk: true }).label('BOO!', [0.8, 0.24], [0, 1.24, 0.06], { color: 'white' }).done();
  }),
  e('boot camp', 'town', 'soldiers', () => who('boot camp', { top: 'olive', bottom: 'olive', shoes: 'black', long: true, style: 'short', hair: '#2a1d16', acc: [hat('cowboy', '#8a6a3a'), wear('belt', 'black'), wear('whistle'), held('clipboard')] })),
  e('boutique', 'places', 'shops', () => {
    const b = bldg(m('boutique'), 3, 2.6, 2.2, '#f4c2d7', 'white', 'BOUTIQUE', 'white');
    b.box([1.4, 0.06, 0.6], [0.75, 1.62, 1.35], { color: 'magenta', rot: [22, 0, 0] }).box([1.4, 0.04, 0.6], [-0.75, 1.62, 1.35], { color: 'white', rot: [22, 0, 0] });
    return b.stick([0.9, 0, 1.6], [0.9, 0.9, 1.6], 0.04, 'gold').cyl([0.24, 0.04, 0.24], [0.9, 0.02, 1.6], { color: 'gold' }).cone([0.5, 0.75, 0.4], [0.9, 0.68, 1.6], { color: 'red' }).ball([0.24, 0.26, 0.2], [0.9, 1.12, 1.6], { color: 'red' }).ball(0.12, [0.9, 1.32, 1.6], { color: 'cream' }).done();
  }),
  e('braid', 'wardrobe', 'hairstyles', () =>
    bust('braid', { skin: 'skin1', hair: '#d9a441', top: 'blue' }, (b, hc) => {
      for (let i = 0; i < 6; i++) b.ball([0.048, 0.05, 0.045], [0.078 + (i % 2 ? 0.01 : -0.01), 0.235 - i * 0.032, 0.01 + i * 0.011], { color: hc });
      b.ball(0.03, [0.083, 0.045, 0.072], { color: 'red' }).ball([0.04, 0.05, 0.035], [0.083, 0.02, 0.075], { color: hc });
    }),
  ),
  e('bullseye', 'sports', 'targets', () => {
    const b = m('bullseye');
    b.pair((s) => b.rod([s * 0.1, 0, 0.06], [s * 0.04, 0.16, -0.01], 0.018, 'wood'));
    b.rod([0, 0, -0.12], [0, 0.16, -0.03], 0.018, 'wood');
    ['white', 'red', 'white', 'red', 'yellow'].forEach((c, i) => b.cyl([0.26 - i * 0.05, 0.03, 0.26 - i * 0.05], [0, 0.2, i * 0.005], { color: c, rot: [90, 0, 0] }));
    return b.stick([0.005, 0.2, 0.02], [0.05, 0.25, 0.2], 0.01, 'darkwood').wedge([0.03, 0.04, 0.004], [0.05, 0.25, 0.2], { color: 'magenta', rot: [-50, 0, 0] }).done();
  }),
  e('buzz', 'ideas', 'sounds', () => {
    const b = m('buzz').cyl([0.3, 0.04, 0.2], [0, 0.02, 0], { color: 'darkgray' }).label('BZZZ', [0.26, 0.07], [0, 0.02, 0.105], { color: 'yellow' }).stick([-0.1, 0.04, 0], [0, 0.35, 0], 0.012, 'darkgray');
    b.ball([0.26, 0.17, 0.17], [0, 0.45, 0], { color: 'yellow' }).ball([0.13, 0.13, 0.13], [0.16, 0.47, 0], { color: 'black' }).cone([0.05, 0.08, 0.05], [-0.16, 0.45, 0], { color: 'black', rot: [0, 0, 90] });
    for (const x of [-0.04, 0.05]) b.torus([0.17, 0.17, 0.03], [x, 0.45, 0], { color: 'black', rot: [0, 90, 0], tube: 0.14, noInk: true });
    b.pair((s) => {
      b.ball([0.12, 0.17, 0.02], [0, 0.6, s * 0.05], { color: 'glass', rot: [s * 20, 0, -20] });
      b.ball([0.03, 0.03, 0.02], [0.2, 0.49, s * 0.04], { color: 'white', eye: true });
      b.rod([0.18, 0.52, s * 0.03], [0.24, 0.62, s * 0.05], 0.012, 'black');
    });
    seg(b, [-0.28, 0.55, 0], [-0.34, 0.5, 0], 0.02, 0.02, 'darkgray');
    seg(b, [-0.34, 0.5, 0], [-0.28, 0.45, 0], 0.02, 0.02, 'darkgray');
    return seg(b, [-0.28, 0.45, 0], [-0.34, 0.4, 0], 0.02, 0.02, 'darkgray').done();
  }),
  e('camouflage', 'armory', 'military', () => {
    const b = m('camouflage');
    for (const [x, y, z, s, c] of [[0, 0.32, 0, 0.62, 'darkgreen'], [-0.3, 0.22, 0.05, 0.42, 'olive'], [0.3, 0.22, 0.02, 0.44, '#6b5a3a'], [-0.15, 0.5, -0.05, 0.4, '#4f6b2e'], [0.17, 0.48, -0.03, 0.38, 'olive']] as const) b.ball([s, s * 0.85, s * 0.9], [x, y, z], { color: c });
    b.ball([0.36, 0.24, 0.36], [0, 0.66, 0.02], { color: 'olive' }).cyl([0.42, 0.03, 0.42], [0, 0.6, 0.02], { color: 'olive' });
    for (const [x, y, z, c] of [[0.08, 0.72, 0.15, '#6b5a3a'], [-0.1, 0.7, 0.13, 'tan'], [0.0, 0.77, 0.05, '#3f5a2a']] as const) b.ball([0.1, 0.05, 0.05], [x, y, z], { color: c, noInk: true });
    return b.pair((s) => b.ball(0.08, [s * 0.07, 0.52, 0.27], { color: 'white' }).ball(0.035, [s * 0.07, 0.52, 0.31], { color: 'black', eye: true, noInk: true })).done();
  }),
  e('cancer (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('cancer (stars)'), 'CANCER').ball([0.42, 0.18, 0.32], [0, 0.3, 0], { color: '#e8603c' });
    b.pair((s) => {
      b.rod([s * 0.06, 0.36, 0.1], [s * 0.08, 0.48, 0.12], 0.025, '#e8603c').ball(0.06, [s * 0.08, 0.5, 0.12], { color: 'white' }).ball(0.03, [s * 0.08, 0.5, 0.15], { color: 'black', eye: true, noInk: true });
      b.rod([s * 0.18, 0.32, 0.08], [s * 0.3, 0.42, 0.18], 0.05, '#e8603c').ball([0.16, 0.12, 0.1], [s * 0.33, 0.47, 0.2], { color: '#e8603c' }).cone([0.06, 0.1, 0.05], [s * 0.37, 0.55, 0.2], { color: '#e8603c', rot: [0, 0, s * -20] });
      for (const z of [0.05, -0.04, -0.12]) b.rod([s * 0.17, 0.28, z], [s * 0.34, 0.13, z * 1.6], 0.035, '#d9502c');
    });
    return b.capsule([0.012, 0.06, 0.01], [0, 0.29, 0.16], { color: 'darkred', rot: [0, 0, 90], noInk: true }).done();
  }),
  e('capricorn (stars)', 'sky', 'zodiac', () => {
    const g = '#c9a87a', t = 'teal';
    const b = zb(m('capricorn (stars)'), 'CAPRICORN').ball([0.36, 0.28, 0.24], [0.08, 0.4, 0], { color: g });
    b.pair((s) => b.rod([0.16, 0.34, s * 0.06], [0.24, 0.14, s * 0.06], 0.06, g).ball(0.06, [0.25, 0.14, s * 0.06], { color: 'darkbrown' }));
    b.rod([0.2, 0.48, 0], [0.25, 0.62, 0], 0.12, g).ball([0.17, 0.15, 0.13], [0.27, 0.66, 0], { color: g }).ball([0.1, 0.08, 0.09], [0.35, 0.62, 0], { color: g });
    b.rod([0.24, 0.72, 0.03], [0.14, 0.84, 0.03], 0.035, 'cream').rod([0.14, 0.84, 0.03], [0.06, 0.78, 0.03], 0.03, 'cream').cone([0.04, 0.1, 0.04], [0.34, 0.53, 0], { color: 'cream', rot: [180, 0, 0] });
    b.ball([0.03, 0.035, 0.02], [0.3, 0.69, 0.06], { color: 'black', eye: true, noInk: true });
    [[-0.12, 0.36, 0.2], [-0.25, 0.34, 0.16], [-0.35, 0.4, 0.13], [-0.4, 0.5, 0.11], [-0.38, 0.6, 0.09]].forEach(([x, y, s]) => b.ball(s, [x, y, 0], { color: t }));
    return b.cone([0.2, 0.16, 0.05], [-0.3, 0.72, 0], { color: t, rot: [0, 0, -30] }).cone([0.2, 0.16, 0.05], [-0.44, 0.7, 0], { color: t, rot: [0, 0, 30] }).done();
  }),
  e('checkmate', 'toys', 'board games', () => {
    const b = m('checkmate').box([1.0, 0.04, 0.6], [0, 0.02, 0], { color: 'darkbrown', round: 0.1 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) b.box([0.2, 0.006, 0.2], [-0.4 + i * 0.2, 0.042, -0.2 + j * 0.2], { color: 'cream', noInk: true, round: 0 });
    const k = (x: number, c: string) =>
      b.cyl([0.17, 0.05, 0.17], [x, 0.065, -0.05], { color: c }).cyl([0.13, 0.32, 0.13], [x, 0.25, -0.05], { color: c, taper: 0.5 }).cyl([0.13, 0.03, 0.13], [x, 0.42, -0.05], { color: c })
        .cyl([0.09, 0.09, 0.09], [x, 0.48, -0.05], { color: c, taper: 1.4 }).box([0.03, 0.12, 0.03], [x, 0.58, -0.05], { color: c }).box([0.09, 0.03, 0.03], [x, 0.59, -0.05], { color: c });
    k(-0.3, 'cream');
    return b
      .cyl([0.17, 0.05, 0.17], [-0.08, 0.125, 0.12], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.13, 0.32, 0.13], [0.11, 0.11, 0.12], { color: 'black', taper: 0.5, rot: [0, 0, -90] })
      .cyl([0.13, 0.03, 0.13], [0.28, 0.1, 0.12], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.09, 0.09, 0.09], [0.34, 0.1, 0.12], { color: 'black', taper: 1.4, rot: [0, 0, -90] })
      .box([0.12, 0.03, 0.03], [0.44, 0.1, 0.12], { color: 'black' })
      .box([0.03, 0.09, 0.03], [0.45, 0.1, 0.12], { color: 'black' })
      .done();
  }),
  e('chilly', 'nature', 'weather', () => {
    const b = m('chilly').cyl([0.6, 0.06, 0.4], [0, 0.03, 0], { color: 'snow' }).ball([0.3, 0.12, 0.25], [0.15, 0.06, 0.05], { color: 'snow' })
      .ball(0.18, [0, 0.16, 0], { color: 'blue' }).capsule([0.12, 0.72, 0.07], [0, 0.56, 0], { color: 'white' }).capsule([0.045, 0.18, 0.02], [0, 0.28, 0.035], { color: 'blue', noInk: true })
      .box([0.3, 0.06, 0.12], [0, 0.95, 0], { color: 'ice', round: 0.5 });
    for (const [x, l] of [[-0.12, 0.16], [-0.08, 0.1], [0.09, 0.13], [0.13, 0.08]]) b.cone([0.035, l, 0.035], [x, 0.92 - l / 2, 0.02], { color: 'ice', rot: [180, 0, 0] });
    for (let i = 0; i < 4; i++) b.box([0.04, 0.01, 0.01], [0.04, 0.4 + i * 0.12, 0.035], { color: 'darkgray', noInk: true });
    b.pair((s) => b.stick([0.32, 0.65, 0], [0.32 + s * 0.06, 0.65 + 0.1, 0], 0.02, 'skyblue').stick([0.32, 0.65, 0], [0.32 + s * 0.06, 0.55, 0], 0.02, 'skyblue'));
    return b.stick([0.2, 0.65, 0], [0.44, 0.65, 0], 0.02, 'skyblue').done();
  }),
  e('chipotle', 'food', 'spices', () =>
    m('chipotle')
      .cyl([0.16, 0.26, 0.16], [0, 0.13, 0], { color: 'red' })
      .cyl([0.165, 0.02, 0.165], [0, 0.265, 0], { color: 'silver' })
      .label('CHIPOTLE', [0.13, 0.08], [0, 0.14, 0.085], { color: 'yellow' })
      .cyl([0.12, 0.24, 0.1], [0.17, 0.11, 0.09], { color: '#5a1e14', taper: 0.2, rot: [0, 0, 55] })
      .rod([0.06, 0.2, 0.08], [0.03, 0.23, 0.08], 0.02, 'green')
      .done(),
  ),
  e('circus', 'places', 'circus', () => {
    const b = m('circus').cyl([0.5, 0.2, 0.5], [0, 0.1, 0], { color: 'white' }).cone([0.62, 0.3, 0.62], [0, 0.35, 0], { color: 'red' }).torus([0.6, 0.6, 0.04], [0, 0.205, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.08 });
    around(6, 0.245, 0.3).forEach(([x, z]) => b.box([0.05, 0.2, 0.02], [x, 0.1, z], { color: 'red', noInk: true, rot: [0, Math.atan2(x, z) / D2R, 0] }));
    return b.box([0.12, 0.15, 0.05], [0, 0.075, 0.24], { color: 'darkred' }).stick([0, 0.48, 0], [0, 0.62, 0], 0.012, 'darkgray').wedge([0.06, 0.08, 0.005], [0.04, 0.59, 0], { color: 'yellow', rot: [0, 0, -90] }).done();
  }),
  e('city', 'places', 'cities', () => {
    const b = m('city').box([7, 0.15, 3.6], [0, 0.075, 0], { color: 'darkgray' });
    for (const [x, z, w, h, c] of [[-2.6, 0.7, 1.2, 3.5, '#9db4c8'], [-1.2, 0.9, 1.1, 5.5, '#c9b28a'], [0.2, 0.1, 1.4, 8, '#7f9bb3'], [1.6, 0.9, 1.1, 4.5, '#b9c2ca'], [2.8, 0.0, 1.0, 6.2, '#8fa3b0'], [-1.8, -0.9, 1.2, 6.8, '#a7b0b8'], [1.2, -1.0, 1.3, 7.0, '#b5a48e']] as const) {
      b.box([w, h, w], [x, h / 2 + 0.15, z], { color: c, round: 0.05 });
      b.box([w * 0.72, h * 0.82, 0.02], [x, h * 0.5 + 0.2, z + w / 2 + 0.01], { color: 'glass', noInk: true, round: 0 });
    }
    return b.stick([0.2, 8.1, 0.1], [0.2, 9.0, 0.1], 0.08, 'silver').done();
  }),
  e('cliff', 'nature', 'landforms', () => {
    const b = m('cliff').box([3.6, 0.14, 1.6], [0.4, 0.07, 1.2], { color: 'water' }).box([2.6, 2.6, 1.6], [-0.2, 1.3, -0.2], { color: 'rock', round: 0.12 });
    for (const [x, y, s] of [[0.6, 0.6, 0.7], [0.75, 1.5, 0.6], [0.55, 2.2, 0.5], [-0.8, 1.0, 0.6]]) b.ball([s, s, s * 0.8], [x, y, 0.5], { color: 'stone' });
    b.box([2.7, 0.2, 1.7], [-0.2, 2.68, -0.2], { color: 'grass', round: 0.5 });
    leafy(b, -0.7, -0.4, 0.9);
    return b.ball([0.4, 0.25, 0.35], [1.4, 0.15, 1.3], { color: 'stone' }).ball([0.3, 0.2, 0.3], [-1.2, 0.12, 1.1], { color: 'stone' }).done();
  }),
  e('combover', 'wardrobe', 'hairstyles', () =>
    bust('combover', { cap: false, hair: '#5a3a22', top: 'navy', skin: 'skin2' }, (b, hc) => {
      b.ball([0.158, 0.09, 0.1], [0, 0.24, -0.045], { color: hc });
      b.pair((s) => b.ball([0.03, 0.06, 0.08], [s * 0.071, 0.27, -0.012], { color: hc }));
      for (const z of [0.03, 0, -0.03]) b.rod([0.074, 0.27, z], [0, 0.343 - Math.abs(z) * 0.3, z], 0.016, hc).rod([0, 0.343 - Math.abs(z) * 0.3, z], [-0.066, 0.305, z], 0.016, hc);
    }),
  ),
  e('constellation', 'sky', 'constellations', () => sky('constellation', [[-0.42, 0.8], [-0.2, 0.5], [0, 0.7], [0.2, 0.45], [0.42, 0.76]], [[0, 1], [1, 2], [2, 3], [3, 4]], [2])),
  e('crowd', 'town', 'groups', () => {
    const b = m('crowd');
    folk(b, -0.45, -0.3, 1.72, { shirt: 'green', pants: 'denim', hair: 'black', skin: 'skin3' });
    folk(b, 0.45, -0.3, 1.78, { shirt: 'purple', pants: 'darkgray', hair: '#d9a441', skin: 'skin1' });
    folk(b, 0, -0.45, 1.8, { shirt: 'orange', pants: 'navy', hair: 'darkbrown', skin: 'skin4', up: true });
    folk(b, -0.7, 0.25, 1.6, { shirt: 'red', pants: 'denim', hair: 'brown', skin: 'skin2', skirt: 'red' });
    folk(b, 0, 0.3, 1.66, { shirt: 'yellow', pants: 'brown', hair: 'black', skin: 'skin5' });
    return folk(b, 0.7, 0.25, 1.64, { shirt: 'blue', pants: 'tan', hair: '#a0522d', skin: 'skin2' }).done();
  }),
  e('culinary school', 'places', 'schools', () => {
    const b = bldg(m('culinary school'), 5, 3.2, 3, 'cream', 'darkred', 'CULINARY SCHOOL', 'white');
    return b.cyl([1.2, 0.6, 1.2], [0, 3.6, 0], { color: 'white' }).ball([2.0, 1.1, 1.8], [0, 4.3, 0], { color: 'white' }).ball([1.0, 0.8, 1.0], [-0.5, 4.5, 0.1], { color: 'white' }).ball([1.0, 0.8, 1.0], [0.5, 4.5, 0.1], { color: 'white' }).done();
  }),
  e('daisy', 'garden', 'flowers', () => {
    const b = m('daisy').ball([0.09, 0.04, 0.09], [0, 0.01, 0], { color: 'dirt' }).rod([0, 0.02, 0], [0, 0.19, 0], 0.012, 'green');
    b.ball([0.06, 0.015, 0.025], [0.03, 0.08, 0], { color: 'leaf', rot: [0, 0, 30] }).ball([0.05, 0.015, 0.022], [-0.025, 0.11, 0], { color: 'leaf', rot: [0, 0, -30] });
    b.ball([0.045, 0.045, 0.03], [0, 0.2, 0.01], { color: 'yellow', name: 'head' });
    for (let i = 0; i < 10; i++) {
      const a = i * 36;
      b.ball([0.022, 0.05, 0.01], [Math.cos(a * D2R) * 0.042, 0.2 + Math.sin(a * D2R) * 0.042, 0.005], { color: 'white', rot: [0, 0, a - 90], parent: 'head' });
    }
    return b.done();
  }),
  e('death', 'fantasy', 'spirits', () => who('death', { skin: '#efeae0', top: 'black', bottom: 'black', skirt: 'black', long: true, shoes: 'black', style: 'bald', acc: [hat('hood', 'black'), wear('cloak', 'black'), scythe] })),
  e('delta', 'nature', 'landforms', () => {
    const b = m('delta').box([1.2, 0.18, 1.0], [0, 0.09, 0], { color: 'dirt', round: 0.05 }).box([1.2, 0.04, 0.7], [0, 0.2, -0.15], { color: 'grass', round: 0.1 }).box([1.2, 0.03, 0.3], [0, 0.195, 0.35], { color: 'water', round: 0.1 });
    b.rod([0, 0.215, -0.5], [0, 0.215, -0.05], 0.08, 'water', { noInk: true });
    for (const x of [-0.38, -0.13, 0.13, 0.38]) b.rod([0, 0.215, -0.05], [x, 0.21, 0.24], 0.05, 'water', { noInk: true });
    leafy(b, -0.45, -0.35, 0.3);
    return leafy(b, 0.42, -0.3, 0.25, 'darkgreen').done();
  }),
  e('dessert', 'food', 'desserts', () =>
    m('dessert')
      .cyl([0.09, 0.015, 0.09], [0, 0.0075, 0], { color: 'glass' })
      .stick([0, 0.015, 0], [0, 0.06, 0], 0.02, 'glass')
      .cyl([0.07, 0.07, 0.07], [0, 0.095, 0], { color: 'glass', taper: 1.8 })
      .ball([0.085, 0.07, 0.085], [-0.025, 0.14, 0.01], { color: 'pink' })
      .ball([0.085, 0.07, 0.085], [0.03, 0.14, -0.01], { color: 'chocolate' })
      .ball([0.08, 0.07, 0.08], [0, 0.18, 0], { color: 'cream' })
      .ball([0.06, 0.05, 0.06], [0, 0.22, 0], { color: 'white' })
      .ball(0.035, [0, 0.255, 0], { color: 'red' })
      .rod([0, 0.27, 0], [0.012, 0.3, 0], 0.005, 'green')
      .done(),
  ),
  e('dmv', 'places', 'offices', () => {
    const b = bldg(m('dmv'), 4, 2.6, 2.5, 'lightgray', 'navy', 'DMV', 'skyblue');
    b.stick([-2.4, 0, 1.4], [-2.4, 3.2, 1.4], 0.06, 'silver').box([0.7, 0.45, 0.03], [-2.03, 2.9, 1.4], { color: 'blue' });
    b.box([1.0, 0.3, 0.55], [1.2, 0.3, 2.1], { color: 'red', round: 0.4 }).box([0.6, 0.24, 0.5], [1.15, 0.55, 2.1], { color: 'glass', round: 0.4 });
    for (const [x, z] of [[0.85, 1.85], [1.55, 1.85], [0.85, 2.35], [1.55, 2.35]]) b.cyl([0.24, 0.1, 0.24], [x, 0.12, z], { color: 'rubber', rot: [90, 0, 0] });
    return b.done();
  }),
  e('dna', 'study', 'science', () => {
    const b = m('dna').cyl([0.42, 0.1, 0.42], [0, 0.05, 0], { color: 'darkgray' });
    const P = (i: number, k: number): Vec3 => [Math.cos((i * 36 + k * 180) * D2R) * 0.17, 0.16 + i * 0.09, Math.sin((i * 36 + k * 180) * D2R) * 0.17];
    for (let i = 0; i < 10; i++) {
      b.stick(P(i, 0), [(P(i, 0)[0] + P(i, 1)[0]) / 2, P(i, 0)[1], (P(i, 0)[2] + P(i, 1)[2]) / 2], 0.03, i % 2 ? 'yellow' : 'green');
      b.stick(P(i, 1), [(P(i, 0)[0] + P(i, 1)[0]) / 2, P(i, 0)[1], (P(i, 0)[2] + P(i, 1)[2]) / 2], 0.03, i % 2 ? 'orange' : 'magenta');
      if (i < 9) b.rod(P(i, 0), P(i + 1, 0), 0.05, 'blue').rod(P(i, 1), P(i + 1, 1), 0.05, 'red');
    }
    return b.stick([0, 0.1, 0], [0, 0.16, 0], 0.03, 'darkgray').done();
  }),
  e('double dare', 'toys', 'games', () => {
    const b = m('double dare').box([0.6, 0.6, 0.4], [0, 0.3, 0], { color: 'red', round: 0.1 }).label('DOUBLE DARE', [0.52, 0.16], [0, 0.4, 0.21], { color: 'yellow' }).box([0.62, 0.05, 0.42], [0, 0.62, 0], { color: 'navy' });
    b.ball([0.52, 0.12, 0.38], [0, 0.66, 0], { color: 'lime' }).ball(0.08, [0.15, 0.73, 0.05], { color: 'red' });
    for (const [x, l] of [[-0.22, 0.2], [-0.05, 0.12], [0.12, 0.26], [0.25, 0.15]]) b.capsule([0.05, l, 0.04], [x, 0.64 - l / 2, 0.205], { color: 'lime' });
    return b.done();
  }),
  e('dreadlocks', 'wardrobe', 'hairstyles', () =>
    bust('dreadlocks', { skin: 'skin4', hair: '#3b2a1e', top: 'yellow' }, (b, hc) => {
      for (let k = 0; k < 11; k++) {
        const a = (170 + k * 20) * D2R, x = Math.cos(a) * 0.072, z = Math.sin(a) * 0.075;
        b.rod([x, 0.3, z], [x * 1.45, 0.11, z * 1.3], 0.03, hc);
      }
      b.pair((s) => b.rod([s * 0.06, 0.31, 0.03], [s * 0.095, 0.14, 0.06], 0.03, hc));
      b.torus([0.165, 0.17, 0.02], [0, 0.31, -0.005], { color: 'red', rot: [90, 0, 0], tube: 0.15 });
    }),
  ),
  e('ears', 'clinic', 'body parts', () =>
    bust('ears', { hair: 'brown', top: 'green' }, (b) =>
      b.pair((s) => b.ball([0.035, 0.1, 0.07], [s * 0.088, 0.25, -0.005], { color: 'skin2', rot: [0, s * 35, 0] }).ball([0.012, 0.06, 0.035], [s * 0.1, 0.25, 0.01], { color: 'pink', rot: [0, s * 35, 0], noInk: true })),
    ),
  ),
  e('earthquake', 'nature', 'disasters', () => {
    const b = m('earthquake')
      .box([0.6, 0.3, 0.7], [-0.34, 0.15, 0], { color: 'dirt', rot: [0, 0, 8] })
      .box([0.6, 0.3, 0.7], [0.34, 0.12, 0], { color: 'dirt', rot: [0, 0, -10] })
      .box([0.1, 0.24, 0.7], [0, 0.12, 0], { color: '#2a2726' })
      .box([0.6, 0.05, 0.7], [-0.36, 0.32, 0], { color: 'grass', rot: [0, 0, 8] })
      .box([0.6, 0.05, 0.7], [0.36, 0.29, 0], { color: 'grass', rot: [0, 0, -10] })
      .box([0.3, 0.25, 0.3], [-0.38, 0.47, 0], { color: 'cream', rot: [0, 0, 14] })
      .wedge([0.36, 0.18, 0.34], [-0.42, 0.66, 0], { color: 'red', rot: [0, 0, 14] })
      .box([0.08, 0.1, 0.02], [-0.36, 0.42, 0.155], { color: 'glass', rot: [0, 0, 14] });
    leafy(b, 0.4, -0.1, 0.4);
    for (const [x, y] of [[0.05, 0.4], [-0.08, 0.5], [0.14, 0.55]]) b.ball(0.07, [x, y, 0.2], { color: 'rock' });
    return b.done();
  }),
  e('eight', 'ideas', 'numbers', () =>
    m('eight').box([0.74, 0.1, 0.44], [0, 0.05, 0], { color: 'wood', round: 0.2 }).torus([0.56, 0.48, 0.16], [0, 0.33, 0], { color: 'orange', tube: 0.34 }).torus([0.46, 0.42, 0.16], [0, 0.74, 0], { color: 'orange', tube: 0.36 }).done(),
  ),
  e('electric current', 'tech', 'electricity', () => {
    const b = m('electric current').box([0.8, 0.05, 0.4], [0, 0.025, 0], { color: 'wood' })
      .cyl([0.14, 0.3, 0.14], [-0.25, 0.2, 0], { color: 'black' }).cyl([0.145, 0.08, 0.145], [-0.25, 0.31, 0], { color: 'copper' }).cyl([0.05, 0.03, 0.05], [-0.25, 0.365, 0], { color: 'silver' })
      .cyl([0.1, 0.08, 0.1], [0.25, 0.09, 0], { color: 'brass' }).ball(0.17, [0.25, 0.22, 0], { color: '#fff3a0', glow: true })
      .rod([-0.25, 0.38, 0], [0, 0.46, 0.02], 0.02, 'red').rod([0, 0.46, 0.02], [0.2, 0.1, 0.03], 0.02, 'red')
      .rod([-0.2, 0.06, 0.08], [0.25, 0.06, 0.08], 0.02, 'black').rod([0.25, 0.06, 0.08], [0.28, 0.07, 0.04], 0.02, 'black');
    return bolt(b, 0, 0.7, 0.2, 0.12, 0.02).done();
  }),
  e('emo', 'town', 'subcultures', () => who('emo', { top: 'black', bottom: 'black', shoes: 'black', hair: 'black', style: 'short', skin: 'skin1', long: true, acc: [fringe, wear('belt', 'pink')] })),
  e('enemy', 'town', 'villains', () => who('enemy', { top: 'darkred', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'spiky', acc: [face('mask', 'black'), wear('cape', 'black'), held('sword'), held('shield', 'darkred', 'L')] })),
  e('evidence', 'study', 'law', () => {
    const b = m('evidence').box([0.7, 0.05, 0.45], [0, 0.025, 0], { color: 'lightgray' })
      .wedge([0.2, 0.18, 0.18], [-0.2, 0.14, 0.05], { color: 'yellow', rot: [0, 90, 0] })
      .label('1', [0.08, 0.08], [-0.2, 0.146, 0.111], { color: 'yellow', rot: [-29, 0, 0] })
      .ball([0.05, 0.01, 0.08], [0.0, 0.055, 0.12], { color: '#4a3a2a', noInk: true })
      .ball([0.05, 0.01, 0.08], [0.06, 0.055, 0.0], { color: '#4a3a2a', noInk: true })
      .stick([0.2, 0.05, 0], [0.2, 0.2, 0], 0.03, 'darkwood')
      .torus([0.2, 0.2, 0.04], [0.2, 0.3, 0], { color: 'black', tube: 0.18, rot: [0, -20, 0] })
      .cyl([0.17, 0.01, 0.17], [0.2, 0.3, 0], { color: 'glass', rot: [90, -20, 0] });
    return b.done();
  }),
  e('eye', 'clinic', 'body parts', () =>
    m('eye')
      .cyl([0.14, 0.03, 0.12], [0, 0.015, 0], { color: 'darkgray' })
      .stick([0, 0.03, 0], [0, 0.12, 0], 0.03, 'darkgray')
      .ball(0.17, [0, 0.2, 0], { color: 'white' })
      .cyl([0.085, 0.02, 0.085], [0, 0.2, 0.075], { color: 'blue', rot: [90, 0, 0] })
      .cyl([0.04, 0.02, 0.04], [0, 0.2, 0.084], { color: 'black', rot: [90, 0, 0], eye: true })
      .ball(0.015, [0.015, 0.215, 0.093], { color: 'white', noInk: true })
      .rod([-0.08, 0.23, 0.02], [-0.05, 0.215, 0.06], 0.006, 'red', { noInk: true })
      .rod([0.08, 0.17, 0.02], [0.05, 0.18, 0.06], 0.006, 'red', { noInk: true })
      .done(),
  ),
  e('eyebrow', 'clinic', 'body parts', () =>
    bust('eyebrow', { hair: 'black', top: 'red', brows: false }, (b) => b.capsule([0.026, 0.07, 0.022], [0.035, 0.302, 0.064], { color: 'black', rot: [0, 0, 70] }).box([0.036, 0.009, 0.01], [-0.033, 0.288, 0.066], { color: 'black', noInk: true })),
  ),
  e('eyebrows', 'clinic', 'body parts', () =>
    bust('eyebrows', { hair: '#3b2a1e', top: 'purple', brows: false }, (b) => b.pair((s) => b.capsule([0.026, 0.06, 0.022], [s * 0.036, 0.296, 0.065], { color: '#2a1d16', rot: [0, 0, s * 75] }))),
  ),
  e('family', 'town', 'groups', () => {
    const b = m('family');
    folk(b, -0.7, 0, 1.82, { shirt: 'blue', pants: 'denim', hair: 'darkbrown', skin: 'skin2' });
    folk(b, -0.2, 0.1, 1.05, { shirt: 'red', pants: 'navy', hair: 'darkbrown', skin: 'skin2' });
    folk(b, 0.28, 0, 1.66, { shirt: 'yellow', pants: 'skin2', skirt: 'green', hair: '#a0522d', skin: 'skin2' });
    return folk(b, 0.72, 0.1, 0.85, { shirt: 'pink', pants: 'skin2', skirt: 'pink', hair: '#a0522d', skin: 'skin2' }).done();
  }),
  e('famine', 'ideas', 'hardship', () => {
    const b = m('famine').box([0.7, 0.2, 0.6], [0, 0.1, 0], { color: '#c9a26a', round: 0.08 });
    for (const [x, z, r] of [[-0.18, 0.1, 30], [0.2, -0.12, -40], [0.15, 0.17, 70], [-0.2, -0.15, -10]]) b.box([0.2, 0.01, 0.015], [x, 0.2, z], { color: '#6b4a2a', rot: [0, r, 0], noInk: true });
    return b
      .cyl([0.2, 0.1, 0.2], [0, 0.25, 0], { color: 'wood', taper: 1.6 })
      .cyl([0.29, 0.012, 0.29], [0, 0.296, 0], { color: 'darkwood', noInk: true })
      .rod([0.2, 0.215, 0.15], [0.3, 0.212, 0.0], 0.015, 'silver')
      .ball([0.05, 0.015, 0.04], [0.18, 0.21, 0.18], { color: 'silver' })
      .rod([-0.28, 0.2, -0.2], [-0.25, 0.42, -0.18], 0.012, 'tan')
      .rod([-0.25, 0.42, -0.18], [-0.16, 0.38, -0.15], 0.012, 'tan')
      .done();
  }),
  e('fern', 'garden', 'plants', () => {
    const b = m('fern').ball([0.3, 0.12, 0.3], [0, 0.03, 0], { color: 'dirt' });
    for (let k = 0; k < 5; k++) {
      const a = (k * 72 + 20) * D2R, dx = Math.cos(a), dz = Math.sin(a);
      const P0: Vec3 = [0, 0.06, 0], P1: Vec3 = [dx * 0.17, 0.4, dz * 0.17], P2: Vec3 = [dx * 0.4, 0.34, dz * 0.4];
      b.rod(P0, P1, 0.014, 'darkgreen').rod(P1, P2, 0.012, 'darkgreen');
      const L = (p: Vec3, q: Vec3, t: number): Vec3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
      ([[L(P0, P1, 0.55), 0.15], [L(P0, P1, 0.9), 0.15], [L(P1, P2, 0.4), 0.12], [L(P1, P2, 0.8), 0.07]] as Array<[Vec3, number]>).forEach(([p, w]) =>
        b.ball([w, 0.014, 0.045], p, { color: 'green', rot: [0, -(k * 72 + 20 + 90), 0] }),
      );
    }
    return b.done();
  }),
  e('fire', 'nature', 'elements', () => {
    const b = m('fire');
    around(7, 0.2).forEach(([x, z]) => b.ball([0.11, 0.08, 0.1], [x, 0.04, z], { color: 'stone' }));
    for (const [x, z] of [[0.16, 0.08], [-0.15, 0.1], [0, -0.17]]) b.rod([x, 0.03, z], [0, 0.2, 0], 0.05, 'bark');
    return b
      .cone([0.26, 0.4, 0.26], [0, 0.26, 0], { color: 'orange', glow: true })
      .cone([0.15, 0.28, 0.15], [0, 0.22, 0.05], { color: 'yellow', glow: true })
      .cone([0.1, 0.2, 0.1], [0.09, 0.2, 0.02], { color: 'red', glow: true, rot: [0, 0, -15] })
      .cone([0.1, 0.18, 0.1], [-0.09, 0.19, 0.02], { color: 'red', glow: true, rot: [0, 0, 15] })
      .done();
  }),
  e('fireball', 'fantasy', 'magic', () =>
    m('fireball')
      .ball(0.1, [0.05, 0.12, 0], { color: 'orange' })
      .ball(0.07, [0.06, 0.125, 0.025], { color: 'yellow', glow: true })
      .cone([0.09, 0.2, 0.09], [-0.07, 0.125, 0], { color: 'orange', glow: true, rot: [0, 0, 95] })
      .cone([0.06, 0.15, 0.06], [-0.07, 0.15, 0.02], { color: 'red', glow: true, rot: [0, 0, 80] })
      .cone([0.05, 0.12, 0.05], [-0.06, 0.09, -0.02], { color: 'red', glow: true, rot: [0, 0, 110] })
      .done(),
  ),
  e('five', 'ideas', 'numbers', () => num('five', '5', 5, 'blue', 'yellow')),
  e('fjord', 'nature', 'landforms', () => {
    const b = m('fjord').box([1.4, 0.15, 6], [0, 0.075, 0], { color: 'water' });
    b.pair((s) => {
      for (const [z, h] of [[-2.0, 4.6], [0, 4.0], [2.0, 3.2]]) {
        b.cone([2.6, h, 2.4], [s * 1.75, h / 2, z], { color: 'rock', segs: 6 }).cone([2.6 * 0.28, h * 0.28, 2.4 * 0.28], [s * 1.75, h * 0.86, z], { color: 'snow', segs: 6 });
      }
      b.ball([1.0, 0.6, 1.8], [s * 1.0, 0.3, 1.0], { color: 'darkgreen' });
    });
    return b.box([0.2, 2.0, 0.06], [0.75, 1.1, -0.9], { color: 'white', noInk: true, rot: [0, 0, -20] }).box([0.3, 0.14, 0.7], [0, 0.2, 1.8], { color: 'red', round: 0.6 }).done();
  }),
  e('flame', 'nature', 'elements', () =>
    m('flame')
      .ball([0.18, 0.07, 0.18], [0, 0.035, 0], { color: 'darkgray' })
      .ball(0.16, [0, 0.14, 0], { color: 'orange', glow: true })
      .cone([0.15, 0.24, 0.15], [0, 0.3, 0], { color: 'orange', glow: true })
      .ball(0.09, [0, 0.12, 0.04], { color: 'yellow', glow: true })
      .cone([0.08, 0.15, 0.08], [0, 0.22, 0.04], { color: 'yellow', glow: true })
      .done(),
  ),
  e('flat (music)', 'music', 'music symbols', () => {
    const b = m('flat (music)').box([0.4, 0.06, 0.25], [0, 0.03, 0], { color: 'darkwood' }).box([0.6, 0.5, 0.08], [0, 0.42, 0], { color: 'white', round: 0.1 });
    for (let i = 0; i < 5; i++) b.box([0.54, 0.008, 0.005], [0, 0.26 + i * 0.08, 0.041], { color: 'black', noInk: true, round: 0 });
    return b.box([0.035, 0.42, 0.04], [-0.06, 0.48, 0.06], { color: 'black' }).torus([0.16, 0.14, 0.04], [0.0, 0.34, 0.06], { color: 'black', tube: 0.35, rot: [0, 0, 25] }).done();
  }),
  e('flight school', 'places', 'schools', () => {
    const b = bldg(m('flight school'), 5, 3, 3, '#dfe8ee', 'navy', 'FLIGHT SCHOOL', 'white');
    b.capsule([0.5, 2.0, 0.5], [0.5, 0.6, 2.7], { color: 'white', rot: [0, 0, 90] }).box([0.45, 0.07, 2.6], [0.6, 0.62, 2.7], { color: 'red' }).wedge([0.5, 0.5, 0.06], [-0.35, 0.95, 2.7], { color: 'red', apex: -0.4 });
    b.box([0.1, 0.06, 0.8], [-0.35, 0.68, 2.7], { color: 'red' }).box([0.05, 0.8, 0.1], [1.55, 0.6, 2.7], { color: 'darkgray', name: 'fan' }).box([0.3, 0.2, 0.4], [0.9, 0.85, 2.7], { color: 'glass', round: 0.5 });
    b.stick([0.6, 0, 2.5], [0.6, 0.4, 2.5], 0.04, 'darkgray').stick([0.6, 0, 2.9], [0.6, 0.4, 2.9], 0.04, 'darkgray');
    return b.stick([-2.3, 0, 2], [-2.3, 2.6, 2], 0.06, 'silver').cyl([0.3, 0.7, 0.3], [-1.95, 2.45, 2], { color: 'orange', taper: 0.5, rot: [0, 0, -95] }).done();
  }),
  e('flurry', 'nature', 'weather', () => {
    const b = m('flurry').cyl([0.8, 0.06, 0.5], [0, 0.03, 0], { color: 'snow' }).ball([0.5, 0.2, 0.35], [0.1, 0.06, 0], { color: 'snow' });
    cloud(b, 0, 0.95, -0.05, 0.6, '#e6edf2');
    for (const [x, y, z, s] of [[-0.25, 0.3, 0.1, 0.16], [0.2, 0.42, 0.05, 0.2], [-0.05, 0.6, 0.12, 0.14], [0.3, 0.72, 0, 0.12], [-0.32, 0.65, 0, 0.13]]) flake(b, x, y, z, s);
    return b.done();
  }),
  e('forest', 'nature', 'landscapes', () => {
    const b = m('forest').cyl([6, 0.15, 4.2], [0, 0.075, 0], { color: 'grass' });
    for (const [x, z, h] of [[-2.1, -1, 5.2], [-0.6, -1.3, 5.8], [1.0, -1.0, 4.8], [2.3, -0.4, 4.2], [-2.3, 0.8, 3.6], [0.2, 0.9, 3.2]]) pine(b, x, z, h);
    for (const [x, z, h] of [[-1.1, 0.2, 4.0], [1.5, 0.8, 3.6], [0.4, -0.2, 4.4]]) leafy(b, x, z, h, x > 1 ? 'green' : 'leaf');
    return b.done();
  }),
  e('fortune', 'ideas', 'luck', () => {
    const b = m('fortune')
      .ball([0.4, 0.4, 0.36], [0, 0.22, 0], { color: 'tan' })
      .cyl([0.12, 0.06, 0.12], [0, 0.43, 0], { color: 'brown' })
      .ball([0.2, 0.1, 0.16], [0, 0.48, 0], { color: 'tan' })
      .label('$', [0.14, 0.16], [0, 0.24, 0.19], { color: 'green' });
    for (let k = 0; k < 5; k++) b.cyl([0.12, 0.022, 0.12], [0.3, 0.011 + k * 0.022, 0.08], { color: 'gold' });
    for (let k = 0; k < 3; k++) b.cyl([0.12, 0.022, 0.12], [-0.3, 0.011 + k * 0.022, 0.1], { color: 'gold' });
    b.cyl([0.12, 0.022, 0.12], [0.15, 0.04, 0.25], { color: 'gold', rot: [60, 0, 0] }).rod([-0.12, 0.0, 0.26], [-0.12, 0.12, 0.26], 0.012, 'darkgreen');
    for (const [x, y] of [[-0.15, 0.15], [-0.09, 0.15], [-0.15, 0.09], [-0.09, 0.09]]) b.ball([0.065, 0.065, 0.02], [x, y + 0.02, 0.26], { color: 'green' });
    return b.done();
  }),
  e('fountain of youth', 'fantasy', 'magic places', () => {
    const b = m('fountain of youth')
      .cyl([1.0, 0.25, 1.0], [0, 0.125, 0], { color: 'stone' })
      .cyl([0.86, 0.02, 0.86], [0, 0.25, 0], { color: 'cyan', glow: true })
      .cyl([0.16, 0.45, 0.16], [0, 0.45, 0], { color: 'stone' })
      .cyl([0.28, 0.1, 0.28], [0, 0.7, 0], { color: 'stone', taper: 1.5 })
      .rod([0, 0.76, 0], [0, 0.95, 0], 0.04, 'cyan', { glow: true });
    for (const s of [1, -1]) b.rod([0, 0.95, 0], [s * 0.2, 0.8, 0.05], 0.03, 'cyan', { glow: true }).rod([s * 0.22, 0.74, 0], [s * 0.38, 0.3, 0.05], 0.03, 'cyan', { glow: true });
    return b.star(0.12, [0.35, 0.95, 0.2], { color: 'gold', glow: true }).star(0.09, [-0.4, 1.05, 0.1], { color: 'gold', glow: true }).star(0.08, [0.15, 1.15, 0.1], { color: 'gold', glow: true }).done();
  }),
  e('four', 'ideas', 'numbers', () => num('four', '4', 4, 'green', 'white')),
  e('fraternity', 'places', 'houses', () => {
    const b = m('fraternity').box([3.2, 2.2, 2], [0, 1.1, 0], { color: 'darkred', round: 0.04 }).wedge([3.5, 0.9, 2.2], [0, 2.65, 0], { color: 'darkgray' });
    for (const x of [-1.2, -0.4, 0.4, 1.2]) b.stick([x, 0.1, 1.35], [x, 2.0, 1.35], 0.18, 'white');
    b.box([3.4, 0.12, 0.8], [0, 2.06, 1.3], { color: 'white' }).wedge([3.4, 0.5, 0.7], [0, 2.37, 1.3], { color: 'white' }).box([3.4, 0.1, 0.9], [0, 0.05, 1.3], { color: 'stone' });
    b.label('ΣΑΕ', [0.9, 0.3], [0, 2.32, 1.67], { color: 'white' }).box([0.5, 0.95, 0.06], [0, 0.55, 1.01], { color: 'darkwood' });
    b.pair((s) => b.box([0.5, 0.5, 0.06], [s * 0.85, 1.1, 1.01], { color: 'glass' }));
    return b.done();
  }),
  e('full moon', 'sky', 'moon', () => {
    const b = m('full moon').ball(3.6, [0, 2.4, 0], { color: '#ecead8' });
    for (const [x, y, s] of [[-0.6, 0.5, 0.7], [0.5, 0.7, 0.45], [0.3, -0.5, 0.8], [-0.7, -0.6, 0.4], [0.95, 0.0, 0.35]]) b.ball([s, s, 0.12], [x, 2.4 + y, Math.sqrt(3.24 - x * x - y * y) - 0.04], { color: '#c8c6b6', noInk: true });
    return b.done();
  }),
  e('funeral', 'town', 'events', () => {
    const b = m('funeral').box([1.8, 0.35, 0.6], [0, 0.75, 0], { color: 'darkwood', round: 0.15 }).box([1.84, 0.08, 0.62], [0, 0.96, 0], { color: 'darkbrown', round: 0.4 });
    for (const [x, z] of [[-0.75, 0.22], [0.75, 0.22], [-0.75, -0.22], [0.75, -0.22]]) b.stick([x, 0, z], [x, 0.58, z], 0.05, 'black');
    b.box([1.7, 0.04, 0.5], [0, 0.56, 0], { color: 'black' });
    for (const x of [-0.5, 0, 0.5]) b.box([0.16, 0.05, 0.04], [x, 0.72, 0.31], { color: 'brass' });
    b.pair((s) => b.rod([s * 0.2, 0, 0.75], [s * 0.05, 0.75, 0.6], 0.03, 'darkwood'));
    around(10, 0.2).forEach(([x, y], i) => b.ball(0.12, [x, 0.95 + y, 0.65], { color: i % 3 ? 'white' : i % 2 ? 'pink' : 'darkgreen' }));
    for (const [x, c] of [[-0.15, 'white'], [0, 'white'], [0.15, 'cream'], [-0.07, 'pink'], [0.08, 'white']] as const) b.ball(0.1, [x, 1.04, (x * 3) % 0.1], { color: c });
    b.ball([0.4, 0.04, 0.18], [0, 1.0, 0], { color: 'darkgreen' });
    b.pair((s) => b.stick([s * 1.15, 0, 0.1], [s * 1.15, 1.1, 0.1], 0.04, 'brass').cyl([0.06, 0.18, 0.06], [s * 1.15, 1.19, 0.1], { color: 'cream' }).cone([0.04, 0.07, 0.04], [s * 1.15, 1.315, 0.1], { color: 'flame', glow: true }));
    return b.done();
  }),
  e('garage sale', 'town', 'events', () => {
    const b = m('garage sale').box([1.4, 0.05, 0.6], [0, 0.72, 0], { color: 'white' });
    for (const [x, z] of [[-0.65, 0.25], [0.65, 0.25], [-0.65, -0.25], [0.65, -0.25]]) b.stick([x, 0, z], [x, 0.7, z], 0.03, 'steel');
    b.cyl([0.14, 0.03, 0.14], [-0.5, 0.76, 0], { color: 'brass' }).stick([-0.5, 0.76, 0], [-0.5, 1.05, 0], 0.025, 'brass').cyl([0.22, 0.16, 0.22], [-0.5, 1.1, 0], { color: 'cream', taper: 0.6 });
    b.box([0.25, 0.06, 0.18], [-0.15, 0.775, 0.05], { color: 'blue' }).box([0.22, 0.06, 0.16], [-0.15, 0.835, 0.05], { color: 'red' }).box([0.24, 0.06, 0.17], [-0.15, 0.895, 0.05], { color: 'green' });
    b.cyl([0.12, 0.25, 0.12], [0.2, 0.87, 0], { color: 'teal', taper: 0.6 }).ball([0.16, 0.18, 0.14], [0.5, 0.84, 0.05], { color: 'brown' }).ball(0.11, [0.5, 0.97, 0.05], { color: 'brown' });
    b.stick([-0.85, 0, 0.55], [-0.85, 0.75, 0.55], 0.04, 'wood').label('YARD SALE', [0.55, 0.3], [-0.85, 0.8, 0.58], { color: 'yellow' });
    return b.box([0.42, 0.3, 0.36], [0.55, 0.15, 0.6], { color: 'tan' }).label('FREE', [0.25, 0.1], [0.55, 0.18, 0.79], { color: 'white' }).done();
  }),
  e('garden', 'garden', 'garden things', () => {
    const b = m('garden').box([1.2, 0.2, 0.6], [0, 0.1, 0], { color: 'wood' }).box([1.12, 0.04, 0.52], [0, 0.2, 0], { color: 'dirt' });
    for (let i = 0; i < 7; i++) b.box([0.08, 0.5, 0.03], [-0.6 + i * 0.2, 0.25, -0.4], { color: 'white' }).cone([0.08, 0.06, 0.03], [-0.6 + i * 0.2, 0.53, -0.4], { color: 'white', segs: 4 });
    b.box([1.3, 0.05, 0.02], [0, 0.35, -0.42], { color: 'white' });
    ([[-0.4, 0.05, 'red'], [-0.15, -0.1, 'yellow'], [0.1, 0.08, 'purple'], [0.35, -0.08, 'pink'], [0.45, 0.12, 'orange']] as const).forEach(([x, z, c], i) => {
      const h = 0.4 + (i % 2) * 0.1;
      b.rod([x, 0.2, z], [x, h, z], 0.02, 'green').ball([0.09, 0.09, 0.05], [x, h + 0.03, z + 0.01], { color: c }).ball(0.04, [x, h + 0.03, z + 0.035], { color: 'yellow' }).ball([0.07, 0.02, 0.03], [x + 0.03, 0.3, z], { color: 'leaf', rot: [0, 0, 25] });
    });
    return b.done();
  }),
  e('gemini (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('gemini (stars)'), 'GEMINI');
    folk(b, -0.17, 0, 0.78, { shirt: 'orange', pants: 'navy', hair: 'gold', skin: 'skin1', y: 0.12 });
    return folk(b, 0.17, 0, 0.78, { shirt: 'orange', pants: 'navy', hair: 'gold', skin: 'skin1', y: 0.12 }).done();
  }),
  e('genius', 'ideas', 'abstract', () => {
    const b = m('genius')
      .cyl([0.5, 0.15, 0.5], [0, 0.075, 0], { color: 'darkgray' })
      .cyl([0.2, 0.2, 0.2], [0, 0.25, 0], { color: 'silver' })
      .torus([0.21, 0.21, 0.03], [0, 0.22, 0], { color: 'steel', rot: [90, 0, 0] })
      .torus([0.21, 0.21, 0.03], [0, 0.29, 0], { color: 'steel', rot: [90, 0, 0] })
      .cyl([0.22, 0.14, 0.22], [0, 0.42, 0], { color: '#fff6c0', taper: 1.8 })
      .ball([0.56, 0.56, 0.56], [0, 0.72, 0], { color: '#fff6c0' })
      .rod([-0.06, 0.6, 0], [0.06, 0.72, 0], 0.02, 'orange', { glow: true })
      .rod([0.06, 0.72, 0], [-0.04, 0.8, 0], 0.02, 'orange', { glow: true });
    for (const a of [0, 40, 80, 120, 160]) b.stick([Math.cos(a * D2R) * 0.36, 0.72 + Math.sin(a * D2R) * 0.36, 0], [Math.cos(a * D2R) * 0.5, 0.72 + Math.sin(a * D2R) * 0.5, 0], 0.035, 'yellow', { glow: true });
    return b.done();
  }),
  e('germ', 'clinic', 'germs', () => {
    const b = m('germ').ball(0.11, [0, 0.08, 0], { color: 'lime' });
    for (let k = 0; k < 8; k++) {
      const a = (k * 45 + 22) * D2R, dx = Math.cos(a), dy = Math.sin(a);
      b.rod([dx * 0.045, 0.08 + dy * 0.045, -0.01], [dx * 0.075, 0.08 + dy * 0.075, -0.01], 0.01, 'green').ball(0.02, [dx * 0.078, 0.08 + dy * 0.078, -0.01], { color: 'purple' });
    }
    b.pair((s) => b.ball([0.03, 0.035, 0.015], [s * 0.022, 0.095, 0.05], { color: 'white' }).ball(0.014, [s * 0.02, 0.093, 0.058], { color: 'black', eye: true, noInk: true }).box([0.03, 0.007, 0.006], [s * 0.022, 0.118, 0.05], { color: 'darkgreen', rot: [0, 0, s * 25], noInk: true }));
    return b.capsule([0.012, 0.04, 0.008], [0, 0.065, 0.054], { color: 'darkred', rot: [0, 0, 90], noInk: true }).done();
  }),
  e('ghost', 'fantasy', 'spirits', () => {
    const b = m('ghost').cyl([0.5, 0.01, 0.4], [0, 0.005, 0], { color: '#9da3a8', noInk: true }).ball([0.6, 0.6, 0.55], [0, 1.32, 0], { color: 'white' }).cyl([0.72, 0.8, 0.62], [0, 0.85, 0], { color: 'white', taper: 0.82 });
    for (const x of [-0.25, -0.08, 0.08, 0.25]) b.ball([0.2, 0.16, 0.2], [x, 0.46, 0.12], { color: 'white' });
    b.pair((s) => b.rod([s * 0.28, 1.0, 0], [s * 0.45, 0.85, 0.08], 0.12, 'white').ball([0.08, 0.13, 0.03], [s * 0.11, 1.36, 0.265], { color: 'black', eye: true, noInk: true }));
    return b.ball([0.12, 0.08, 0.03], [0, 1.2, 0.27], { color: 'black', noInk: true }).done();
  }),
  e('glum', 'ideas', 'emotions', () => {
    const b = emoji('glum', 0.5, 0.75, '#7fa8d8');
    b.pair((s) => b.ball([0.05, 0.07, 0.02], [s * 0.1, 0.8, 0.072], { color: 'black', eye: true, noInk: true }).box([0.09, 0.016, 0.01], [s * 0.1, 0.88, 0.07], { color: 'navy', rot: [0, 0, -s * 20], noInk: true }));
    arc(b, [0, 0.58, 0.072], 0.1, 35, 145, 4, 0.025, 'navy', 'xy', { noInk: true });
    drop(b, 0.15, 0.7, 0.075, 0.04, 'skyblue');
    cloud(b, 0, 1.22, 0, 0.42, 'gray');
    return drop(drop(b, -0.08, 1.05, 0, 0.05), 0.09, 1.0, 0, 0.05).done();
  }),
  e('goal', 'sports', 'goals', () => {
    const b = m('goal');
    b.pair((s) => b.stick([s * 0.9, 0, 0.3], [s * 0.9, 1.05, 0.3], 0.07, 'white').rod([s * 0.9, 1.0, 0.3], [s * 0.9, 0.02, -0.5], 0.04, 'white').rod([s * 0.9, 0.02, -0.5], [s * 0.9, 0.02, 0.3], 0.04, 'white'));
    b.stick([-0.93, 1.02, 0.3], [0.93, 1.02, 0.3], 0.07, 'white').rod([-0.9, 0.02, -0.5], [0.9, 0.02, -0.5], 0.04, 'white');
    b.box([1.8, 1.28, 0.015], [0, 0.51, -0.1], { color: 'lightgray', rot: [38.7, 0, 0], noInk: true });
    b.pair((s) => b.wedge([0.8, 1.0, 0.015], [s * 0.9, 0.5, -0.1], { color: 'lightgray', rot: [0, 90, 0], apex: -0.5 * s, noInk: true }));
    return b.ball(0.24, [0.3, 0.12, 0.5], { color: 'white' }).ball([0.08, 0.08, 0.02], [0.3, 0.13, 0.62], { color: 'black', noInk: true }).ball([0.07, 0.07, 0.02], [0.4, 0.18, 0.56], { color: 'black', noInk: true, rot: [0, 50, 0] }).done();
  }),
  e('goatee', 'wardrobe', 'hairstyles', () =>
    bust('goatee', { hair: '#5a3a22', top: 'gray' }, (b, hc) => b.cone([0.05, 0.075, 0.035], [0, 0.168, 0.052], { color: hc, rot: [180, 0, 0] }).capsule([0.018, 0.065, 0.015], [0, 0.219, 0.078], { color: hc, rot: [0, 0, 90] })),
  ),
  e('griffin', 'fantasy', 'creatures', () =>
    beast('griffin', { color: '#d9a441', body: [1.4, 0.7, 0.6], legL: 0.6, legW: 0.16, neckL: 0.4, neckLean: 25, neckW: 0.35, head: [0.4, 0.36, 0.32], headColor: 'white', snout: { len: 0.24, h: 0.15, w: 0.15, color: 'gold' }, nose: '#c08a20', ears: 'pointy', earSize: 0.16, earColor: 'white', tail: 'tuft', tailColor: '#8a5a2b', acc: [ani.wings('#8a5a2b')] }),
  ),
  e('hail storm', 'nature', 'weather', () => {
    const b = m('hail storm').cyl([3.6, 0.12, 2.4], [0, 0.06, 0], { color: 'grass' });
    cloud(b, 0, 3.3, 0, 3.0, '#6b737a');
    for (const [x, y, z] of [[-0.9, 2.3, 0.3], [0.2, 2.0, 0.5], [0.9, 2.5, 0.1], [-0.4, 1.5, 0.6], [0.6, 1.2, 0.4], [-1.1, 0.9, 0.2], [0.1, 0.7, 0.7], [1.2, 0.5, 0.3], [-0.5, 2.6, -0.3]]) b.ball(0.34, [x, y, z], { color: 'ice' });
    for (const [x, z] of [[-0.6, 0.6], [-0.45, 0.75], [0.7, 0.8], [0.85, 0.65], [0.0, 1.0], [-1.3, 0.5]]) b.ball(0.2, [x, 0.2, z], { color: 'ice' });
    return b.done();
  }),
  e('hang', 'ideas', 'sayings', () => {
    const b = m('hang');
    b.pair((s) => b.stick([s * 0.55, 0, -0.05], [s * 0.55, 1.6, -0.05], 0.06, 'blue').cyl([0.16, 0.04, 0.16], [s * 0.55, 0.02, -0.05], { color: 'blue' }));
    b.stick([-0.58, 1.55, -0.05], [0.58, 1.55, -0.05], 0.05, 'red');
    return folk(b, 0, -0.05, 1.1, { shirt: 'yellow', pants: 'denim', hair: 'brown', skin: 'skin3', up: true, y: 0.45 }).done();
  }),
  e('hangman', 'toys', 'word games', () =>
    m('hangman')
      .box([0.9, 0.13, 0.45], [0, 0.065, 0], { color: 'wood' })
      .label('_ A _ _', [0.5, 0.08], [0.1, 0.065, 0.235], { color: 'white' })
      .stick([-0.3, 0.13, 0], [-0.3, 1.62, 0], 0.07, 'wood')
      .stick([-0.34, 1.6, 0], [0.24, 1.6, 0], 0.06, 'wood')
      .stick([-0.3, 1.3, 0], [-0.05, 1.58, 0], 0.04, 'wood')
      .stick([0.2, 1.58, 0], [0.2, 1.4, 0], 0.012, 'tan')
      .torus([0.15, 0.15, 0.025], [0.2, 1.32, 0], { color: 'black', tube: 0.18 })
      .stick([0.2, 1.245, 0], [0.2, 0.9, 0], 0.025, 'black')
      .stick([0.2, 1.18, 0], [0.08, 1.0, 0], 0.025, 'black')
      .stick([0.2, 1.18, 0], [0.32, 1.0, 0], 0.025, 'black')
      .stick([0.2, 0.9, 0], [0.1, 0.65, 0], 0.025, 'black')
      .stick([0.2, 0.9, 0], [0.3, 0.65, 0], 0.025, 'black')
      .done(),
  ),
  e('heaven', 'fantasy', 'afterlife', () => {
    const b = m('heaven');
    for (const [x, z, s] of [[-0.45, 0, 0.45], [0, 0.1, 0.5], [0.45, 0, 0.45], [-0.25, -0.2, 0.4], [0.25, -0.2, 0.4]]) b.ball([s, s * 0.6, s], [x, s * 0.3, z], { color: 'white' });
    for (let k = 0; k < 7; k++) {
      const a = (25 + k * 21.7) * D2R;
      b.box([0.05, 0.5, 0.02], [Math.cos(a) * 0.62, 0.75 + Math.sin(a) * 0.62, -0.2], { color: 'yellow', glow: true, noInk: true, rot: [0, 0, (a / D2R) - 90] });
    }
    b.pair((s) => b.stick([s * 0.35, 0.2, 0], [s * 0.35, 0.85, 0], 0.07, 'gold'));
    for (const x of [-0.24, -0.12, 0, 0.12, 0.24]) b.stick([x, 0.25, 0], [x, 0.85 + 0.12 * Math.cos(x * 4), 0], 0.025, 'gold');
    arc(b, [0, 0.85, 0], 0.35, 0, 180, 6, 0.05, 'gold');
    return b.torus([0.3, 0.3, 0.05], [0, 1.35, 0], { color: 'gold', rot: [70, 0, 0], tube: 0.2 }).done();
  }),
  e('hell', 'fantasy', 'afterlife', () => {
    const b = m('hell').cyl([1.1, 0.15, 0.8], [0, 0.075, 0], { color: '#5a1a14' }).cyl([0.5, 0.02, 0.35], [0.15, 0.155, 0.1], { color: 'orange', glow: true });
    for (const [x, z, h] of [[-0.42, -0.2, 0.5], [0.4, -0.25, 0.4], [-0.3, 0.25, 0.25], [0.45, 0.2, 0.3]]) b.cone([0.22, h, 0.22], [x, 0.15 + h / 2, z], { color: '#3a1a14' });
    for (const [x, z, h, c] of [[-0.1, -0.15, 0.5, 'orange'], [0.15, -0.1, 0.42, 'red'], [-0.25, 0.0, 0.32, 'red'], [0.25, 0.1, 0.3, 'orange'], [0.0, 0.12, 0.25, 'yellow']] as const) b.cone([0.16, h, 0.16], [x, 0.15 + h / 2, z], { color: c, glow: true });
    b.stick([-0.05, 0.15, 0.3], [-0.12, 1.0, 0.25], 0.03, 'darkred');
    for (const dx of [-0.06, 0, 0.06]) b.cone([0.03, 0.14, 0.03], [-0.12 + dx, 1.05, 0.25], { color: 'red' });
    return b.box([0.16, 0.03, 0.03], [-0.12, 0.98, 0.25], { color: 'red' }).done();
  }),
  e('hole', 'nature', 'landforms', () => {
    const b = m('hole').cyl([0.24, 0.01, 0.24], [0, 0.005, 0], { color: '#1a1614', noInk: true }).torus([0.32, 0.32, 0.06], [0, 0.025, 0], { color: 'dirt', rot: [90, 0, 0], tube: 0.25 }).ball([0.2, 0.12, 0.16], [0.27, 0.04, -0.05], { color: 'dirt' });
    return b.stick([0.27, 0.06, -0.05], [0.3, 0.32, -0.08], 0.02, 'wood').box([0.07, 0.08, 0.015], [0.268, 0.07, -0.05], { color: 'iron' }).torus([0.06, 0.05, 0.015], [0.302, 0.35, -0.083], { color: 'darkwood', tube: 0.25 }).done();
  }),
  e('holly', 'garden', 'trees', () => {
    const b = m('holly').cyl([0.18, 0.4, 0.18], [0, 0.2, 0], { color: 'bark' });
    for (const [x, y, z, s] of [[0, 0.65, 0, 0.9], [-0.25, 0.95, 0.05, 0.6], [0.25, 0.95, 0, 0.6], [0, 1.2, -0.05, 0.6], [0, 1.5, 0, 0.4]]) b.ball([s, s * 0.85, s], [x, y, z], { color: '#2f5f2a' });
    for (const [x, y, z] of [[0.2, 0.7, 0.4], [-0.25, 0.85, 0.32], [0.05, 1.12, 0.3], [0.3, 1.05, 0.25], [-0.1, 0.55, 0.42], [-0.05, 1.45, 0.18]]) for (const [dx, dy] of [[0, 0], [0.05, 0.03], [-0.03, 0.05]]) b.ball(0.06, [x + dx, y + dy, z], { color: 'red' });
    return b.done();
  }),
  e('homework', 'study', 'school', () => {
    const b = m('homework').box([0.9, 0.05, 0.5], [0, 0.72, 0], { color: 'wood' });
    for (const [x, z] of [[-0.4, 0.2], [0.4, 0.2], [-0.4, -0.2], [0.4, -0.2]]) b.stick([x, 0, z], [x, 0.7, z], 0.04, 'darkwood');
    b.box([0.2, 0.012, 0.26], [-0.11, 0.752, 0.05], { color: 'white', rot: [0, 0, 4] }).box([0.2, 0.012, 0.26], [0.09, 0.752, 0.05], { color: 'white', rot: [0, 0, -4] });
    for (let i = 0; i < 4; i++) b.box([0.14, 0.004, 0.006], [-0.11, 0.76, -0.04 + i * 0.05], { color: 'skyblue', noInk: true, round: 0 });
    b.capsule([0.018, 0.2, 0.018], [0.12, 0.77, 0.1], { color: 'yellow', rot: [90, 30, 0] }).cone([0.018, 0.03, 0.018], [0.07, 0.77, 0.19], { color: 'tan', rot: [90, 30, 0] });
    b.box([0.26, 0.06, 0.2], [0.3, 0.775, -0.08], { color: 'red' }).box([0.24, 0.06, 0.19], [0.3, 0.835, -0.08], { color: 'blue' }).box([0.25, 0.05, 0.18], [0.3, 0.89, -0.08], { color: 'green' });
    return b.box([0.3, 0.38, 0.16], [-0.6, 0.19, 0.15], { color: 'orange', round: 0.4 }).box([0.22, 0.14, 0.05], [-0.6, 0.14, 0.24], { color: 'darkred', round: 0.4 }).done();
  }),
  e('hurricane', 'nature', 'weather', () => {
    const b = m('hurricane').cyl([5, 0.15, 3.5], [0, 0.075, 0], { color: 'water' });
    for (const [x, z] of [[-1.5, 0.8], [1.2, 1.0], [0.2, 1.3], [-0.6, -0.8]]) b.ball([0.6, 0.25, 0.3], [x, 0.15, z], { color: 'white' });
    palm(b, 1.8, 0.6, 1.8);
    const c: Vec3 = [-0.2, 3.2, -0.6];
    for (const k of [0, 180]) {
      let prev: Vec3 | null = null;
      for (let i = 0; i <= 8; i++) {
        const a = (k + i * 34) * D2R, r = 0.45 + i * 0.17;
        const p: Vec3 = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]];
        if (prev) b.rod(prev, p, 0.55 - i * 0.04, i % 2 ? '#c9d2d8' : 'white');
        prev = p;
      }
    }
    return b.torus([0.75, 0.75, 0.3], [c[0], c[1], c[2]], { color: 'white', tube: 0.45 }).ball([0.35, 0.35, 0.1], c, { color: 'water' }).done();
  }),
  e('i see what you did there', 'ideas', 'sayings', () => {
    const b = emoji('i see what you did there', 0.46, 0.62, 'yellow');
    b.pair((s) => b.ball([0.09, 0.09, 0.02], [s * 0.09, 0.67, 0.068], { color: 'white' }).ball([0.04, 0.045, 0.02], [s * 0.09 + 0.025, 0.66, 0.078], { color: 'black', eye: true, noInk: true }));
    b.box([0.09, 0.018, 0.012], [0.09, 0.76, 0.064], { color: 'darkbrown', rot: [0, 0, 20], noInk: true }).box([0.09, 0.018, 0.012], [-0.09, 0.73, 0.068], { color: 'darkbrown', noInk: true });
    return b.capsule([0.02, 0.12, 0.012], [0.03, 0.53, 0.068], { color: 'darkbrown', rot: [0, 0, 75], noInk: true }).done();
  }),
  e('illuminati', 'ideas', 'symbols', () => {
    const b = m('illuminati').cone([1.0, 0.8, 1.0], [0, 0.4, 0], { color: 'sand', segs: 4, rot: [0, 45, 0] }).cone([0.45, 0.36, 0.45], [0, 1.02, 0], { color: 'gold', segs: 4, rot: [0, 45, 0] });
    b.ball([0.13, 0.08, 0.03], [0, 0.98, 0.1], { color: 'white', rot: [-24, 0, 0] }).ball([0.045, 0.045, 0.02], [0, 0.98, 0.113], { color: 'black', eye: true, noInk: true });
    for (let k = 0; k < 7; k++) {
      const a = (10 + k * 26.7) * D2R;
      b.stick([Math.cos(a) * 0.3, 1.0 + Math.sin(a) * 0.3, -0.05], [Math.cos(a) * 0.5, 1.0 + Math.sin(a) * 0.5, -0.05], 0.03, 'yellow', { glow: true, noInk: true });
    }
    return b.done();
  }),
  e('insulin', 'clinic', 'medicine', () =>
    m('insulin')
      .cyl([0.055, 0.08, 0.055], [0, 0.04, 0], { color: 'glass' })
      .cyl([0.058, 0.035, 0.058], [0, 0.045, 0], { color: 'white' })
      .cyl([0.03, 0.015, 0.03], [0, 0.0875, 0], { color: 'darkgray' })
      .cyl([0.045, 0.02, 0.045], [0, 0.104, 0], { color: 'orange' })
      .capsule([0.032, 0.17, 0.032], [0.08, 0.085, 0], { color: 'blue' })
      .capsule([0.034, 0.06, 0.034], [0.08, 0.15, 0], { color: 'lightgray' })
      .cyl([0.036, 0.02, 0.036], [0.08, 0.04, 0], { color: 'gray' })
      .box([0.02, 0.03, 0.005], [0.08, 0.09, 0.016], { color: 'white', noInk: true })
      .done(),
  ),
  e('j (letter)', 'ideas', 'letters', () => {
    const b = m('j (letter)').box([0.3, 0.05, 0.16], [0, 0.025, 0], { color: 'wood' }).box([0.17, 0.045, 0.05], [0.03, 0.31, 0], { color: 'blue' }).box([0.05, 0.22, 0.05], [0.04, 0.2, 0], { color: 'blue' });
    return arc(b, [-0.015, 0.1, 0], 0.05, 0, -180, 4, 0.05, 'blue').rod([-0.065, 0.1, 0], [-0.07, 0.13, 0], 0.05, 'blue').done();
  }),
  e('jupiter', 'sky', 'planets', () => {
    const b = m('jupiter').ball(3.6, [0, 2.4, 0], { color: '#e3c99a' });
    for (const [h, c] of [[0.9, '#b07a4a'], [0.4, '#d9a46a'], [-0.2, '#a0623a'], [-0.75, '#c99060'], [1.4, '#c9b08a']] as const) {
      const d = 2 * Math.sqrt(3.24 - h * h) + 0.04;
      b.torus([d, d, 0.26], [0, 2.4 + h, 0], { color: c, rot: [90, 0, 0], tube: 0.06, noInk: true });
    }
    return b.ball([0.6, 0.34, 0.14], [0.6, 2.0, 1.66], { color: '#c0503a', noInk: true, rot: [0, 20, 0] }).done();
  }),
  e('kingston', 'places', 'cities', () => {
    const b = m('kingston').cyl([2.4, 0.08, 1.4], [0, 0.04, 0], { color: 'sand' });
    b.pair((s) => b.stick([s * 0.55, 0.08, 0.3], [s * 0.55, 1.0, 0.3], 0.07, 'wood'));
    b.label('KINGSTON', [1.4, 0.4], [0, 1.0, 0.41], { color: 'green' }).box([1.42, 0.44, 0.28], [0, 1.0, 0.26], { color: 'darkgreen' });
    palm(b, -0.85, -0.3, 1.8);
    b.stick([0.9, 0.08, -0.2], [0.9, 2.0, -0.2], 0.05, 'silver').box([0.7, 0.45, 0.04], [1.27, 1.75, -0.2], { color: '#139a43' });
    for (const r of [33, -33]) b.box([0.84, 0.07, 0.01], [1.27, 1.75, -0.175], { color: 'gold', rot: [0, 0, r], noInk: true });
    return b.done();
  }),
  e('kraken', 'fantasy', 'sea monsters', () => {
    const k = '#b03a5a';
    const b = m('kraken').cyl([5, 0.2, 4], [0, 0.1, 0], { color: 'water' }).ball([1.5, 2.6, 1.4], [0, 2.0, -0.3], { color: k }).ball([1.6, 0.5, 1.5], [0, 0.3, -0.3], { color: k });
    b.pair((s) => b.ball(0.38, [s * 0.38, 1.3, 0.25], { color: 'yellow' }).box([0.06, 0.24, 0.05], [s * 0.38, 1.3, 0.43], { color: 'black', eye: true }));
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 30) * D2R, dx = Math.cos(a), dz = Math.sin(a);
      const p0: Vec3 = [dx * 0.7, 0.3, dz * 0.6 - 0.3], p1: Vec3 = [dx * 1.5, 1.6, dz * 1.2 - 0.3], p2: Vec3 = [dx * 2.0, 2.2, dz * 1.5 - 0.3], p3: Vec3 = [dx * 2.2, 1.8, dz * 1.7 - 0.3];
      b.rod(p0, p1, 0.32, k).rod(p1, p2, 0.24, k).rod(p2, p3, 0.16, k);
    }
    return b.box([0.6, 0.3, 1.2], [1.4, 0.35, 1.3], { color: 'wood', round: 0.5 }).stick([1.4, 0.4, 1.3], [1.4, 1.5, 1.3], 0.06, 'darkwood').box([0.04, 0.6, 0.6], [1.4, 1.1, 1.3], { color: 'white' }).done();
  }),
  e('lake', 'nature', 'water', () => {
    const b = m('lake').cyl([1.0, 0.08, 0.8], [0, 0.04, 0], { color: 'grass' }).cyl([0.7, 0.02, 0.5], [0.05, 0.085, 0.05], { color: 'water' });
    for (const [x, z, h] of [[-0.38, 0.15, 0.24], [-0.42, 0.05, 0.2], [-0.35, -0.05, 0.27], [-0.4, 0.25, 0.18]]) b.stick([x, 0.08, z], [x, 0.08 + h, z], 0.01, 'darkgreen').capsule([0.025, 0.06, 0.025], [x, 0.06 + h, z], { color: 'darkbrown' });
    leafy(b, 0.3, -0.3, 0.35);
    return b.ball([0.12, 0.07, 0.1], [0.4, 0.1, 0.22], { color: 'stone' }).ball([0.08, 0.05, 0.07], [0.1, 0.1, 0.3], { color: 'rock' }).ball([0.07, 0.01, 0.07], [0.15, 0.097, 0.0], { color: 'green' }).done();
  }),
  e('lens flare', 'sky', 'light effects', () => {
    const b = m('lens flare').box([0.5, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' }).stick([0, 0.1, 0], [0, 0.22, 0], 0.08, 'darkgray').box([1.15, 0.85, 0.1], [0, 0.62, -0.05], { color: '#1a2440', round: 0.1 });
    b.ball(0.16, [-0.32, 0.82, 0.03], { color: 'white', glow: true });
    for (const r of [0, 90, 45, -45]) b.box([r % 90 ? 0.3 : 0.5, 0.02, 0.01], [-0.32, 0.82, 0.03], { color: '#fff6c0', glow: true, rot: [0, 0, r], noInk: true });
    ([[-0.08, 0.64, 0.1, '#ffd27a'], [0.08, 0.52, 0.16, '#7af2c8'], [0.22, 0.42, 0.08, '#c87af2'], [0.36, 0.32, 0.2, '#7ac8f2']] as const).forEach(([x, y, s, c]) => b.cyl([s, 0.01, s], [x, y, 0.01], { color: c, glow: true, segs: 6, rot: [90, 0, 0], noInk: true }));
    return b.done();
  }),
  e('leo (stars)', 'sky', 'zodiac', () =>
    lift(
      beast('leo (stars)', { color: '#e0a940', body: [0.62, 0.32, 0.3], legL: 0.24, legW: 0.08, neckL: 0.1, neckLean: 30, head: [0.22, 0.2, 0.2], snout: { len: 0.08, h: 0.08, w: 0.1, color: '#f0d090' }, ears: 'pointy', earSize: 0.06, tail: 'tuft', tailColor: '#8a4a1a', acc: [ani.mane('#a0522d', true)] }),
      0.12,
      (b) => zb(b, 'LEO'),
    ),
  ),
  e('libra (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('libra (stars)'), 'LIBRA').cyl([0.2, 0.05, 0.2], [0, 0.145, 0], { color: 'gold' }).stick([0, 0.17, 0], [0, 0.76, 0], 0.05, 'gold').ball(0.08, [0, 0.8, 0], { color: 'gold' }).stick([-0.34, 0.73, 0], [0.34, 0.73, 0], 0.035, 'gold');
    b.pair((s) => b.rod([s * 0.33, 0.73, 0], [s * 0.24, 0.44, 0], 0.012, 'gold').rod([s * 0.33, 0.73, 0], [s * 0.42, 0.44, 0], 0.012, 'gold').cyl([0.18, 0.04, 0.18], [s * 0.33, 0.42, 0], { color: 'gold', taper: 1.6 }));
    return b.done();
  }),
  e('lightning bolt', 'nature', 'weather', () => {
    const b = m('lightning bolt').cyl([1.2, 0.04, 0.9], [0, 0.02, 0], { color: '#3a3633' });
    cloud(b, 0, 3.3, -0.2, 2.0, '#4f565c');
    return bolt(b, 0, 3.0, 2.96, 0.9, 0).done();
  }),
  e('lips', 'clinic', 'body parts', () =>
    m('lips')
      .cyl([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' })
      .stick([0, 0.03, 0], [0, 0.15, -0.01], 0.025, 'darkgray')
      .ball([0.18, 0.045, 0.05], [0, 0.212, 0], { color: 'red' })
      .ball([0.075, 0.042, 0.05], [0.032, 0.226, 0.002], { color: 'red' })
      .ball([0.075, 0.042, 0.05], [-0.032, 0.226, 0.002], { color: 'red' })
      .ball([0.16, 0.06, 0.055], [0, 0.178, 0.004], { color: 'red' })
      .box([0.12, 0.006, 0.01], [0, 0.195, 0.028], { color: 'darkred', noInk: true })
      .ball([0.04, 0.012, 0.01], [0.02, 0.19, 0.03], { color: 'pink', noInk: true })
      .done(),
  ),
  e('little dipper', 'sky', 'constellations', () =>
    sky('little dipper', [[-0.42, 0.86], [-0.24, 0.8], [-0.08, 0.72], [0.08, 0.62], [0.32, 0.67], [0.36, 0.42], [0.1, 0.38]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], [0]),
  ),
  e('magic', 'fantasy', 'magic', () => {
    const b = m('magic').cyl([0.26, 0.3, 0.26], [0, 0.15, 0], { color: 'black' }).cyl([0.42, 0.025, 0.42], [0, 0.31, 0], { color: 'black' }).cyl([0.265, 0.05, 0.265], [0, 0.27, 0], { color: 'red' });
    b.ball([0.16, 0.14, 0.14], [0, 0.38, 0], { color: 'white' });
    b.pair((s) => b.capsule([0.05, 0.18, 0.03], [s * 0.04, 0.5, -0.01], { color: 'white', rot: [0, 0, -s * 10] }).ball([0.025, 0.03, 0.01], [s * 0.035, 0.39, 0.065], { color: 'black', eye: true, noInk: true }));
    b.ball(0.025, [0, 0.365, 0.07], { color: 'pink' });
    b.stick([0.15, 0.05, 0.25], [0.4, 0.45, 0.15], 0.03, 'black').stick([0.37, 0.4, 0.162], [0.4, 0.45, 0.15], 0.032, 'white');
    return b.star(0.12, [0.45, 0.58, 0.15], { color: 'gold', glow: true }).star(0.08, [0.28, 0.65, 0.1], { color: 'gold', glow: true }).star(0.07, [0.55, 0.45, 0.12], { color: 'gold', glow: true }).done();
  }),
  e('mariachi band', 'music', 'bands', () => {
    const b = m('mariachi band');
    for (const x of [-0.55, 0, 0.55]) {
      folk(b, x, 0, 1.7, { shirt: 'black', pants: 'black', hair: 'black', skin: 'skin3', shoes: 'black' });
      b.cyl([0.7, 0.04, 0.7], [x, 1.66, 0], { color: x ? 'tan' : 'black' }).cyl([0.24, 0.2, 0.24], [x, 1.78, 0], { color: x ? 'tan' : 'black', taper: 0.6 }).box([0.12, 0.04, 0.03], [x, 1.25, 0.14], { color: 'red', noInk: true });
      b.box([0.03, 0.5, 0.02], [x - 0.08, 0.6, 0.14], { color: 'silver', noInk: true }).box([0.03, 0.5, 0.02], [x + 0.08, 0.6, 0.14], { color: 'silver', noInk: true });
    }
    b.ball([0.34, 0.4, 0.12], [0, 0.85, 0.2], { color: 'wood' }).cyl([0.1, 0.02, 0.1], [0, 0.88, 0.26], { color: 'darkbrown', rot: [90, 0, 0] }).box([0.06, 0.5, 0.04], [0.18, 1.12, 0.22], { color: 'darkwood', rot: [0, 0, -40] });
    b.rod([-0.55, 1.42, 0.18], [-0.55, 1.36, 0.45], 0.04, 'gold').cone([0.12, 0.1, 0.12], [-0.55, 1.35, 0.5], { color: 'gold', rot: [-90, 0, 0] });
    return b.ball([0.14, 0.28, 0.07], [0.5, 1.08, 0.18], { color: 'brown', rot: [0, 0, 35] }).stick([0.35, 0.95, 0.24], [0.75, 1.15, 0.24], 0.012, 'tan').done();
  }),
  e('mars', 'sky', 'planets', () => {
    const b = m('mars').ball(3.2, [0, 2.2, 0], { color: '#c1440e' }).ball([1.2, 0.3, 1.0], [0, 3.72, 0], { color: 'white', noInk: true });
    for (const [x, y, s] of [[-0.6, 0.3, 0.9], [0.5, -0.4, 0.7], [0.1, 0.7, 0.5]]) b.ball([s, s * 0.6, 0.12], [x, 2.2 + y, Math.sqrt(2.56 - x * x - y * y) - 0.04], { color: '#8a2e0a', noInk: true });
    return b.done();
  }),
  e('mayflower', 'garage', 'ships', () => {
    const m0 = m('mayflower', { view: 'side' }).box([1.6, 1.0, 5], [0, 0.5, 0], { color: '#7a4a2a', round: 0.4 }).box([1.5, 0.8, 1.2], [0, 1.3, -1.9], { color: '#6a3a20', round: 0.2 }).box([1.3, 0.5, 0.8], [0, 1.15, 2.1], { color: '#6a3a20', round: 0.2 });
    m0.box([1.62, 0.12, 5.02], [0, 0.85, 0], { color: 'gold', noInk: true, round: 0.3 }).stick([0, 1.2, 2.6], [0, 1.6, 3.4], 0.1, 'darkwood');
    for (const [z, h] of [[1.4, 4.4], [0, 5.0], [-1.3, 3.8]]) {
      m0.stick([0, 0.9, z], [0, h, z], 0.12, 'darkwood');
      m0.ball([1.7, 1.1, 0.3], [0, h - 1.1, z + 0.1], { color: 'cream', rot: [0, 35, 0] }).ball([1.3, 0.8, 0.25], [0, h - 2.2, z + 0.1], { color: 'cream', rot: [0, 35, 0] });
    }
    return m0.box([0.04, 0.3, 0.5], [0, 4.85, 0.25], { color: 'red' }).done();
  }),
  e('meadow', 'nature', 'landscapes', () => {
    const b = m('meadow').cyl([1.2, 0.08, 0.9], [0, 0.04, 0], { color: 'grass' }).ball([1.0, 0.2, 0.7], [0, 0.1, 0], { color: 'grass' });
    ([[-0.35, 0.2, 'red'], [-0.1, 0.25, 'yellow'], [0.2, 0.18, 'white'], [0.38, 0.05, 'purple'], [-0.3, -0.15, 'yellow'], [0.05, -0.2, 'pink'], [0.3, -0.25, 'white'], [-0.05, 0.05, 'orange']] as const).forEach(([x, z, c], i) => {
      const h = 0.28 + (i % 3) * 0.05;
      b.rod([x, 0.12, z], [x, h, z], 0.012, 'darkgreen').ball([0.05, 0.05, 0.04], [x, h + 0.01, z], { color: c });
    });
    for (const [x, z] of [[-0.45, 0.0], [0.45, 0.25], [0.1, 0.32]]) b.cone([0.06, 0.18, 0.06], [x, 0.17, z], { color: 'green' });
    return b.ball([0.08, 0.06, 0.01], [0.15, 0.42, 0.1], { color: 'orange', rot: [0, 0, 30] }).ball([0.08, 0.06, 0.01], [0.21, 0.43, 0.1], { color: 'orange', rot: [0, 0, -30] }).done();
  }),
  e('mercury (planet)', 'sky', 'planets', () => {
    const b = m('mercury (planet)').ball(2.6, [0, 2.0, 0], { color: '#9a948c' });
    for (const [x, y, s] of [[-0.5, 0.3, 0.5], [0.4, 0.5, 0.35], [0.3, -0.4, 0.6], [-0.4, -0.5, 0.3], [0.75, 0.0, 0.3]]) b.ball([s, s, 0.12], [x, 2.0 + y, Math.sqrt(1.69 - x * x - y * y) - 0.04], { color: '#76716a', noInk: true });
    return b.done();
  }),
  e('mildew', 'garden', 'fungi', () => {
    const b = m('mildew').cyl([0.12, 0.1, 0.12], [0, 0.05, 0], { color: 'terracotta' }).cyl([0.11, 0.01, 0.11], [0, 0.1, 0], { color: 'dirt' }).rod([0, 0.1, 0], [0, 0.18, 0], 0.012, 'green');
    b.ball([0.18, 0.015, 0.09], [0.08, 0.19, 0.02], { color: 'leaf', rot: [0, -15, 15] }).ball([0.16, 0.015, 0.08], [-0.07, 0.21, -0.01], { color: 'leaf', rot: [0, 10, -20] });
    for (const [x, y, z, s] of [[0.06, 0.205, 0.03, 0.05], [0.12, 0.215, 0.0, 0.04], [-0.05, 0.22, 0.0, 0.05], [-0.1, 0.235, -0.02, 0.035]]) b.ball([s, 0.012, s * 0.8], [x, y, z], { color: '#e6e6dc', noInk: true });
    return b.done();
  }),
  e('mirage', 'nature', 'desert', () => {
    const b = m('mirage').cyl([1.4, 0.08, 0.9], [0, 0.04, 0], { color: 'sand' }).ball([0.6, 0.25, 0.5], [-0.4, 0.08, -0.15], { color: 'sand' }).cyl([0.5, 0.02, 0.3], [0.2, 0.09, 0.05], { color: 'skyblue', glow: true });
    palm(b, 0.35, -0.2, 0.9);
    for (const y of [0.3, 0.4]) for (let i = 0; i < 4; i++) b.rod([-0.05 + i * 0.12, y + (i % 2) * 0.03, 0.2], [0.07 + i * 0.12, y + ((i + 1) % 2) * 0.03, 0.2], 0.012, 'skyblue', { noInk: true });
    return b.ball(0.16, [-0.45, 0.85, -0.3], { color: 'yellow', glow: true }).done();
  }),
  e('mix', 'kitchen', 'baking', () => {
    const b = m('mix').cyl([0.24, 0.15, 0.24], [0, 0.075, 0], { color: 'skyblue', taper: 1.45 }).cyl([0.33, 0.02, 0.33], [0, 0.14, 0], { color: 'cream' }).torus([0.18, 0.18, 0.012], [0, 0.152, 0], { color: 'chocolate', rot: [90, 0, 0], tube: 0.15, noInk: true });
    for (const r of [0, 60, 120]) b.torus([0.1, 0.2, 0.012], [0.02, 0.22, 0], { color: 'silver', rot: [0, r, 0], tube: 0.08 });
    return b.stick([0.02, 0.28, 0], [0.02, 0.46, 0], 0.03, 'red').done();
  }),
  e('mother nature', 'fantasy', 'spirits', () => who('mother nature', { h: 3.2, skin: 'skin3', hair: 'green', style: 'long', top: 'leaf', bottom: 'darkgreen', skirt: 'green', long: true, acc: [hat('flower', 'pink'), wear('cape', 'darkgreen'), held('bouquet'), held('staff', undefined, 'L')] })),
  e('mouth', 'clinic', 'body parts', () =>
    m('mouth')
      .cyl([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' })
      .stick([0, 0.03, 0], [0, 0.14, -0.01], 0.025, 'darkgray')
      .ball([0.15, 0.09, 0.03], [0, 0.2, -0.008], { color: '#4a1a1a' })
      .torus([0.2, 0.13, 0.05], [0, 0.2, 0], { color: 'red', tube: 0.3 })
      .box([0.1, 0.022, 0.02], [0, 0.232, 0.005], { color: 'white', round: 0.4 })
      .box([0.08, 0.018, 0.02], [0, 0.17, 0.005], { color: 'white', round: 0.4 })
      .ball([0.08, 0.035, 0.03], [0, 0.185, 0.01], { color: 'pink' })
      .done(),
  ),
  e('mullet (hair)', 'wardrobe', 'hairstyles', () => bust('mullet (hair)', { hair: '#a0522d', top: 'denim' }, (b, hc) => b.capsule([0.15, 0.17, 0.07], [0, 0.17, -0.065], { color: hc }))),
  e('muse', 'fantasy', 'myths', () => who('muse', { top: 'white', bottom: 'white', skirt: 'white', hair: 'gold', style: 'long', skin: 'skin1', acc: [wear('toga', 'white'), hat('headband', 'gold'), wear('sash', 'gold'), held('scroll')] })),
  e('musical note', 'music', 'music symbols', () =>
    m('musical note')
      .box([0.2, 0.04, 0.12], [0, 0.02, 0], { color: 'white' })
      .ball([0.1, 0.075, 0.06], [-0.03, 0.085, 0], { color: 'black', rot: [0, 0, 25] })
      .box([0.018, 0.24, 0.02], [0.013, 0.2, 0], { color: 'black' })
      .rod([0.015, 0.31, 0], [0.07, 0.25, 0], 0.022, 'black')
      .rod([0.07, 0.25, 0], [0.065, 0.2, 0], 0.02, 'black')
      .done(),
  ),
  e('natural', 'ideas', 'symbols', () =>
    m('natural')
      .cyl([0.3, 0.06, 0.2], [0, 0.03, 0], { color: 'darkgray' })
      .stick([0, 0.06, 0], [0, 0.22, 0], 0.04, 'darkgray')
      .cyl([0.5, 0.08, 0.5], [0, 0.45, 0], { color: 'green', rot: [90, 0, 0] })
      .torus([0.5, 0.5, 0.05], [0, 0.45, 0.02], { color: 'darkgreen', tube: 0.08 })
      .label('NATURAL', [0.34, 0.09], [0, 0.39, 0.05], { color: 'white' })
      .ball([0.2, 0.36, 0.05], [0.04, 0.84, 0], { color: 'lime', rot: [0, 0, -20] })
      .rod([-0.02, 0.68, 0.02], [0.09, 0.98, 0.02], 0.012, 'darkgreen', { noInk: true })
      .done(),
  ),
  e('neighborhood', 'places', 'towns', () => {
    const b = m('neighborhood').box([6.4, 0.1, 3.2], [0, 0.05, 0], { color: 'grass' }).box([6.4, 0.02, 0.8], [0, 0.1, 1.1], { color: 'darkgray', round: 0 });
    for (const x of [-2.4, -0.8, 0.8, 2.4]) b.box([0.6, 0.01, 0.08], [x, 0.115, 1.1], { color: 'white', noInk: true, round: 0 });
    house(b, -2.0, -0.5, 1.4, 'cream', 'red');
    house(b, 0, -0.6, 1.6, 'skyblue', 'navy');
    house(b, 2.0, -0.5, 1.3, 'yellow', 'brown');
    leafy(b, -1.0, 0.2, 1.4);
    return leafy(b, 1.05, 0.25, 1.2, 'green').done();
  }),
  e('nine', 'ideas', 'numbers', () => num('nine', '9', 9, 'purple', 'yellow')),
  e('north pole', 'places', 'landmarks', () => {
    const b = m('north pole').cyl([1.2, 0.12, 0.9], [0, 0.06, 0], { color: 'ice' }).ball([0.5, 0.25, 0.4], [-0.35, 0.12, 0.1], { color: 'snow' }).ball([0.4, 0.2, 0.35], [0.35, 0.1, -0.1], { color: 'snow' });
    b.stick([0, 0.12, 0], [0, 1.45, 0], 0.11, 'white');
    for (let i = 0; i < 6; i++) b.torus([0.12, 0.12, 0.05], [0, 0.3 + i * 0.2, 0], { color: 'red', rot: [90, 0, 0], tube: 0.3, noInk: true });
    return b.ball(0.18, [0, 1.52, 0], { color: 'gold' }).label('NORTH POLE', [0.6, 0.16], [0.32, 1.05, 0.06], { color: 'white' }).done();
  }),
  e('north star', 'sky', 'stars', () => {
    const b = m('north star').star(0.5, [0, 0.8, 0], { color: 'yellow' });
    for (const r of [0, 90, 180, 270]) b.cone([0.08, 0.38, 0.03], [-Math.sin(r * D2R) * 0.25, 0.8 + Math.cos(r * D2R) * 0.25, -0.03], { color: 'white', glow: true, rot: [0, 0, r] });
    return b.ball([0.22, 0.22, 0.14], [0, 0.8, 0.02], { color: '#fff6c0' }).done();
  }),
  e('novel', 'study', 'books', () =>
    m('novel')
      .box([0.36, 0.5, 0.1], [0, 0.25, 0], { color: 'darkred', round: 0.1 })
      .box([0.34, 0.47, 0.085], [0.015, 0.25, 0], { color: 'cream', round: 0.05 })
      .box([0.04, 0.5, 0.104], [-0.165, 0.25, 0], { color: 'maroon', round: 0.3 })
      .label('NOVEL', [0.24, 0.08], [0.01, 0.36, 0.055], { color: 'gold' })
      .box([0.2, 0.012, 0.005], [0.01, 0.2, 0.052], { color: 'gold', noInk: true })
      .box([0.025, 0.14, 0.005], [0.08, 0.45, 0.04], { color: 'red', rot: [-10, 0, 0] })
      .done(),
  ),
  e('numbers', 'ideas', 'numbers', () =>
    m('numbers')
      .box(0.3, [-0.16, 0.15, 0], { color: 'red', round: 0.15 })
      .label('1', [0.2, 0.2], [-0.16, 0.15, 0.155], { color: 'red' })
      .box(0.3, [0.16, 0.15, 0], { color: 'blue', round: 0.15 })
      .label('2', [0.2, 0.2], [0.16, 0.15, 0.155], { color: 'blue' })
      .box(0.3, [0, 0.45, 0], { color: 'green', round: 0.15, rot: [0, 10, 0] })
      .label('3', [0.2, 0.2], [0.026, 0.45, 0.153], { color: 'green', rot: [0, 10, 0] })
      .done(),
  ),
  e('nursery (baby)', 'home', 'bedrooms', () => {
    const b = m('nursery (baby)').box([1.2, 0.14, 0.65], [0, 0.35, 0], { color: 'white' }).box([1.14, 0.1, 0.6], [0, 0.46, 0], { color: 'skyblue', round: 0.5 });
    for (const [x, z] of [[-0.58, 0.3], [0.58, 0.3], [-0.58, -0.3], [0.58, -0.3]]) b.stick([x, 0, z], [x, 0.95, z], 0.06, 'white');
    for (const z of [0.3, -0.3]) {
      b.stick([-0.58, 0.92, z], [0.58, 0.92, z], 0.04, 'white');
      for (let i = 1; i < 7; i++) b.stick([-0.58 + i * 0.166, 0.42, z], [-0.58 + i * 0.166, 0.92, z], 0.025, 'white');
    }
    b.ball([0.2, 0.2, 0.16], [0.2, 0.6, 0], { color: 'brown' }).ball(0.15, [0.2, 0.77, 0], { color: 'brown' }).pair((s) => b.ball(0.06, [0.2 + s * 0.06, 0.84, 0], { color: 'brown' }));
    b.stick([-0.58, 0.95, 0], [-0.58, 1.45, 0], 0.03, 'white').stick([-0.58, 1.45, 0], [-0.2, 1.45, 0], 0.025, 'white');
    for (const [x, c] of [[-0.42, 'yellow'], [-0.3, 'pink'], [-0.2, 'skyblue']] as const) b.stick([x, 1.45, 0], [x, 1.28, 0], 0.006, 'gray').star(0.1, [x, 1.23, 0], { color: c });
    return b.done();
  }),
  e('one', 'ideas', 'numbers', () =>
    m('one')
      .box([0.74, 0.1, 0.44], [0, 0.05, 0], { color: 'wood', round: 0.2 })
      .box([0.2, 0.9, 0.16], [0.03, 0.55, 0], { color: 'red', round: 0.15 })
      .box([0.32, 0.14, 0.16], [-0.12, 0.88, 0], { color: 'red', round: 0.15, rot: [0, 0, 35] })
      .box([0.46, 0.12, 0.16], [0.03, 0.16, 0], { color: 'red', round: 0.15 })
      .done(),
  ),
  e('origami', 'toys', 'crafts', () =>
    m('origami')
      .wedge([0.14, 0.06, 0.07], [0, 0.03, 0], { color: 'pink' })
      .wedge([0.12, 0.1, 0.006], [-0.005, 0.1, 0.035], { color: 'pink', rot: [25, 0, 0] })
      .wedge([0.12, 0.1, 0.006], [-0.005, 0.1, -0.035], { color: '#f48fb1', rot: [-25, 0, 0] })
      .stick([0.05, 0.03, 0], [0.1, 0.13, 0], 0.012, 'pink')
      .cone([0.015, 0.035, 0.012], [0.112, 0.128, 0], { color: 'pink', rot: [0, 0, -110] })
      .stick([-0.05, 0.03, 0], [-0.11, 0.11, 0], 0.012, 'pink')
      .done(),
  ),
  e('orion', 'sky', 'constellations', () =>
    sky('orion', [[-0.25, 0.86], [0.22, 0.84], [-0.08, 0.6], [0, 0.58], [0.08, 0.56], [-0.22, 0.3], [0.26, 0.32], [-0.01, 0.95]], [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 7], [1, 7]], [0, 6]),
  ),
  e('parade', 'town', 'events', () => {
    const b = m('parade');
    for (const [x, c] of [[-0.8, 'red'], [0.8, 'blue']] as const) {
      folk(b, x, 0, 1.6, { shirt: c, pants: 'white', hair: 'black', skin: 'skin3', shoes: 'black' });
      b.cyl([0.3, 0.32, 0.3], [x, 1.62, 0], { color: c }).ball(0.08, [x, 1.82, 0], { color: 'gold' });
    }
    b.pair((s) => b.stick([s * 0.53, 0.5, 0.06], [s * 0.53, 2.15, 0.06], 0.035, 'wood'));
    b.label('PARADE', [1.0, 0.32], [0, 1.85, 0.06], { color: 'yellow' });
    for (const [x, c] of [[-0.3, 'pink'], [0, 'lime'], [0.3, 'orange']] as const) b.stick([x * 0.5, 2.0, 0.06], [x, 2.3, 0.06], 0.008, 'gray').ball([0.2, 0.24, 0.2], [x, 2.42, 0.06], { color: c });
    return b.done();
  }),
  e('party', 'toys', 'party', () => {
    const b = m('party').box([0.36, 0.3, 0.36], [0, 0.15, 0], { color: 'magenta' }).box([0.07, 0.31, 0.37], [0, 0.15, 0], { color: 'yellow', noInk: true }).box([0.37, 0.31, 0.07], [0, 0.15, 0], { color: 'yellow', noInk: true });
    b.pair((s) => b.ball([0.1, 0.07, 0.05], [s * 0.05, 0.32, 0], { color: 'yellow', rot: [0, 0, s * 30] }));
    for (const [x, z, h, c] of [[-0.25, -0.05, 1.05, 'red'], [0.05, -0.1, 1.2, 'blue'], [0.28, 0.0, 0.95, 'green']] as const) b.stick([0, 0.33, 0], [x, h - 0.15, z], 0.008, 'gray').ball([0.22, 0.26, 0.22], [x, h - 0.02, z], { color: c });
    b.cone([0.14, 0.2, 0.14], [0.32, 0.1, 0.25], { color: 'cyan' }).ball(0.04, [0.32, 0.22, 0.25], { color: 'pink' });
    for (const [x, z, c] of [[-0.3, 0.25, 'yellow'], [-0.15, 0.3, 'pink'], [0.15, 0.3, 'lime'], [-0.35, 0.05, 'cyan']] as const) b.box([0.03, 0.006, 0.03], [x, 0.003, z], { color: c, noInk: true, rot: [0, 30, 0] });
    return b.done();
  }),
  e('path', 'garden', 'garden things', () => {
    const b = m('path').box([0.9, 0.08, 0.6], [0, 0.04, 0], { color: 'grass', round: 0.2 });
    for (const [x, z] of [[-0.35, 0.18], [-0.18, 0.08], [0, 0.0], [0.17, -0.1], [0.34, -0.18]]) b.cyl([0.13, 0.025, 0.11], [x, 0.09, z], { color: 'stone' });
    for (const [x, z, c] of [[-0.3, -0.15, 'yellow'], [0.25, 0.15, 'red'], [-0.05, 0.22, 'white'], [0.05, -0.22, 'purple']] as const) b.rod([x, 0.08, z], [x, 0.15, z], 0.01, 'green').ball(0.035, [x, 0.16, z], { color: c });
    return b.done();
  }),
  e('periodic table', 'study', 'science', () => {
    const u = 0.055, X = (c: number) => -0.495 + (c - 0.5) * u, T = 0.96;
    const b = m('periodic table').box([0.5, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' }).stick([0, 0.1, 0], [0, 0.25, 0], 0.08, 'darkgray').box([1.12, 0.8, 0.1], [0, 0.62, -0.05], { color: 'white', round: 0.05 });
    for (const [c0, c1, r0, r1, col0] of [[1, 1, 1, 7, 'red'], [2, 2, 2, 7, 'orange'], [3, 12, 4, 7, 'yellow'], [13, 17, 2, 7, 'teal'], [18, 18, 1, 7, 'purple']] as const)
      b.box([(c1 - c0 + 1) * u - 0.006, (r1 - r0 + 1) * u - 0.006, 0.02], [(X(c0) + X(c1)) / 2, T - ((r0 + r1) / 2 - 0.5) * u, 0.01], { color: col0, round: 0.05 });
    b.box([14 * u - 0.006, 2 * u - 0.006, 0.02], [(X(4) + X(17)) / 2, T - 8.4 * u, 0.01], { color: 'green', round: 0.05 });
    for (let r = 1; r < 7; r++) b.box([18 * u, 0.004, 0.005], [0, T - r * u, 0.022], { color: 'white', noInk: true, round: 0 });
    return b.done();
  }),
  e('pestilence', 'ideas', 'hardship', () => who('pestilence', { top: 'black', bottom: 'black', shoes: 'black', long: true, skin: 'skin1', style: 'short', hair: 'black', acc: [hat('cowboy', 'black'), wear('cloak', 'black'), beakMask, held('cane', 'black')] })),
  e('phoenix', 'fantasy', 'creatures', () =>
    lift(bird('phoenix', { height: 0.8, color: 'red', wing: 'orange', beak: 'gold', legs: 'darkred', comb: 'gold', tail: ['yellow', 'orange', 'red', 'orange', 'yellow'] }), 0.08, (b) => {
      b.cyl([0.5, 0.08, 0.5], [0, 0.04, 0], { color: '#3a2a20' });
      around(6, 0.2).forEach(([x, z], i) => b.cone([0.12, 0.28 + (i % 2) * 0.12, 0.12], [x, 0.2 + (i % 2) * 0.06, z], { color: i % 2 ? 'orange' : 'yellow', glow: true }));
      return b;
    }),
  ),
  e('phosphorus', 'study', 'chemistry', () =>
    m('phosphorus')
      .box([0.6, 0.08, 0.3], [0, 0.04, 0], { color: 'darkgray' })
      .box([0.36, 0.42, 0.08], [-0.1, 0.29, -0.05], { color: 'orange', round: 0.1 })
      .label('P', [0.2, 0.22], [-0.1, 0.27, 0.0], { color: 'orange' })
      .label('15', [0.1, 0.06], [-0.2, 0.44, 0.0], { color: 'orange' })
      .ball(0.2, [0.2, 0.18, 0.05], { color: 'glass' })
      .ball([0.17, 0.09, 0.17], [0.2, 0.13, 0.05], { color: 'lime', glow: true })
      .cyl([0.07, 0.14, 0.07], [0.2, 0.33, 0.05], { color: 'glass' })
      .done(),
  ),
  e('pig tail', 'wardrobe', 'hairstyles', () =>
    bust('pig tail', { hair: '#7a3b1e', top: 'pink', skin: 'skin1' }, (b, hc) => b.pair((s) => b.rod([s * 0.08, 0.29, -0.02], [s * 0.14, 0.17, -0.02], 0.05, hc).ball(0.032, [s * 0.085, 0.285, -0.02], { color: 'red' }))),
  ),
  e('pisces (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('pisces (stars)'), 'PISCES').stick([0, 0.12, 0], [0, 0.7, 0], 0.03, 'gold');
    const pf = (x: number, y: number, ang: number, c: string) => {
      const ca = Math.cos(ang * D2R), sa = Math.sin(ang * D2R);
      b.ball([0.32, 0.15, 0.08], [x, y, 0.03], { color: c, rot: [0, 0, ang] }).cone([0.15, 0.12, 0.03], [x - ca * 0.2, y - sa * 0.2, 0.03], { color: c, segs: 3, rot: [0, 0, ang - 90] });
      b.ball(0.03, [x + ca * 0.1, y + sa * 0.1 + 0.02, 0.07], { color: 'black', eye: true, noInk: true });
    };
    pf(-0.15, 0.6, 15, 'teal');
    pf(0.15, 0.34, 195, 'skyblue');
    return b.done();
  }),
  e('plateau', 'nature', 'landforms', () => {
    const b = m('plateau').cyl([5.2, 0.6, 4], [0, 0.3, 0], { color: 'tan', taper: 0.8 }).box([4, 2.4, 3], [0, 1.5, 0], { color: '#c0703a', round: 0.08 }).box([4.1, 0.16, 3.1], [0, 2.75, 0], { color: 'grass', round: 0.5 });
    for (const y of [1.0, 1.6, 2.2]) b.box([4.02, 0.08, 0.02], [0, y, 1.51], { color: '#9a5028', noInk: true, round: 0 });
    leafy(b, 1.2, -0.5, 0.8);
    return b.ball([0.8, 0.5, 0.6], [-2.2, 0.3, 1.4], { color: 'rock' }).done();
  }),
  e('pluto', 'sky', 'planets', () => m('pluto').ball(2.6, [0, 1.9, 0], { color: '#d9b48f' }).heart(1.0, [0.2, 1.75, 1.2], { color: 'white', noInk: true }).ball([0.6, 0.4, 0.12], [-0.6, 2.4, 1.0], { color: '#a8805a', noInk: true }).done()),
  e('poem', 'study', 'writing', () => {
    const b = m('poem').box([0.5, 0.1, 0.3], [0, 0.05, 0], { color: 'darkwood' }).box([0.4, 0.55, 0.06], [-0.05, 0.38, -0.05], { color: 'cream', rot: [-8, 0, 0], round: 0.1 });
    for (let i = 0; i < 5; i++) b.box([i % 2 ? 0.22 : 0.28, 0.008, 0.005], [-0.06, 0.55 - i * 0.07, -0.01 + i * 0.01], { color: 'darkgray', noInk: true, rot: [-8, 0, 0], round: 0 });
    return b.cyl([0.08, 0.07, 0.08], [0.2, 0.135, 0.06], { color: 'black' }).stick([0.2, 0.13, 0.06], [0.28, 0.45, 0.04], 0.008, 'darkgray').ball([0.05, 0.22, 0.015], [0.27, 0.43, 0.045], { color: 'white', rot: [0, 0, -15] }).done();
  }),
  e('poison', 'fantasy', 'potions', () =>
    m('poison')
      .ball(0.24, [0, 0.12, 0], { color: 'purple' })
      .cyl([0.08, 0.1, 0.08], [0, 0.27, 0], { color: 'purple' })
      .cyl([0.07, 0.06, 0.07], [0, 0.34, 0], { color: 'tan' })
      .ball([0.08, 0.075, 0.03], [0, 0.15, 0.112], { color: 'white' })
      .capsule([0.025, 0.12, 0.02], [0, 0.09, 0.112], { color: 'white', rot: [0, 0, 45] })
      .capsule([0.025, 0.12, 0.02], [0, 0.09, 0.112], { color: 'white', rot: [0, 0, -45] })
      .ball([0.018, 0.02, 0.01], [0.015, 0.155, 0.127], { color: 'black', noInk: true })
      .ball([0.018, 0.02, 0.01], [-0.015, 0.155, 0.127], { color: 'black', noInk: true })
      .ball(0.04, [0.03, 0.42, 0], { color: 'lime', glow: true })
      .ball(0.03, [-0.02, 0.47, 0.01], { color: 'lime', glow: true })
      .done(),
  ),
  e('poker', 'toys', 'card games', () => {
    const b = m('poker').cyl([0.7, 0.06, 0.5], [0, 0.03, 0], { color: 'darkgreen' });
    ['A', 'K', 'Q', 'J', '10'].forEach((t, i) => {
      const a = (i - 2) * 15;
      b.label(t, [0.12, 0.17], [-Math.sin(a * D2R) * 0.12, 0.08 + Math.cos(a * D2R) * 0.12, -0.05 + i * 0.006], { color: i % 2 ? 'white' : 'cream', rot: [0, 0, a] });
    });
    b.box([0.1, 0.05, 0.04], [0, 0.085, -0.06], { color: 'darkwood' });
    for (const [x, z, n, c] of [[0.24, 0.1, 5, 'red'], [-0.24, 0.12, 3, 'blue'], [0.12, 0.17, 2, 'white'], [-0.1, 0.16, 4, 'black']] as const) for (let k = 0; k < n; k++) b.cyl([0.07, 0.015, 0.07], [x, 0.0675 + k * 0.016, z], { color: c });
    return b.done();
  }),
  e('police academy', 'places', 'schools', () => {
    const b = bldg(m('police academy'), 5, 3, 3, 'lightgray', 'navy', 'POLICE ACADEMY', 'navy');
    return b.star(0.7, [0, 2.5, 1.56], { color: 'gold' }).stick([-2.9, 0, 1.4], [-2.9, 3.4, 1.4], 0.06, 'silver').box([0.7, 0.45, 0.03], [-2.53, 3.1, 1.4], { color: 'navy' }).done();
  }),
  e('pony tail', 'wardrobe', 'hairstyles', () =>
    bust('pony tail', { hair: '#d9a441', top: 'pink', skin: 'skin2' }, (b, hc) =>
      b.ball(0.035, [0, 0.33, -0.085], { color: 'red' }).rod([0, 0.32, -0.1], [0.04, 0.21, -0.16], 0.055, hc).rod([0.04, 0.21, -0.16], [0.06, 0.11, -0.15], 0.04, hc),
    ),
  ),
  e('portal', 'fantasy', 'magic', () => {
    const b = m('portal').box([2.4, 0.15, 0.7], [0, 0.075, 0], { color: 'stone' });
    b.pair((s) => b.box([0.35, 2.0, 0.45], [s * 0.9, 1.15, 0], { color: 'stone', round: 0.1 }));
    b.box([2.3, 0.35, 0.5], [0, 2.3, 0], { color: 'stone', round: 0.1 }).ball([1.4, 1.9, 0.08], [0, 1.18, 0], { color: 'purple', glow: true });
    ([[1.2, 1.6, 'magenta'], [0.8, 1.1, 'cyan'], [0.4, 0.55, 'white']] as const).forEach(([w, h, c]) => b.torus([w, h, 0.05], [0, 1.18, 0.05], { color: c, glow: true, tube: 0.1, noInk: true }));
    return b.done();
  }),
  e('prism (shape)', 'ideas', 'shapes', () => {
    const b = m('prism (shape)').box([0.36, 0.03, 0.2], [0, 0.015, 0], { color: 'darkgray' }).wedge([0.16, 0.14, 0.12], [0, 0.1, 0], { color: 'glass' }).stick([-0.22, 0.06, 0], [-0.05, 0.11, 0], 0.012, 'white', { glow: true });
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].forEach((c, i) => b.stick([0.05, 0.11, 0], [0.22, 0.17 - i * 0.025, 0], 0.01, c, { glow: true, noInk: true }));
    return b.done();
  }),
  e('rain cloud', 'nature', 'weather', () => {
    const b = m('rain cloud').cyl([1.0, 0.03, 0.7], [0, 0.015, 0], { color: 'water' });
    cloud(b, 0, 2.4, 0, 2.0, '#8f99a3');
    for (const [x, y, z] of [[-0.6, 1.7, 0.2], [-0.2, 1.3, 0.3], [0.3, 1.8, 0.1], [0.65, 1.2, 0.2], [-0.45, 0.8, 0.1], [0.1, 0.6, 0.3], [0.45, 0.35, 0.0], [-0.1, 1.95, -0.2]]) drop(b, x, y, z, 0.24, 'water');
    return b.done();
  }),
  e('rainbow', 'sky', 'light effects', () => {
    const b = m('rainbow');
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].forEach((c, i) => arc(b, [0, 0.15, 0], 0.82 - i * 0.075, 0, 180, 6, 0.085, c));
    b.pair((s) => cloud(b, s * 0.6, 0.18, 0.05, 0.5, 'white'));
    return b.done();
  }),
  e('rainforest', 'nature', 'landscapes', () => {
    const b = m('rainforest').cyl([6, 0.15, 4], [0, 0.075, 0], { color: 'darkgreen' });
    for (const [x, z, h, c] of [[-1.8, -0.8, 6.0, '#2f6b2a'], [0.3, -1.2, 6.8, '#3f7a3a'], [2.0, -0.6, 5.4, '#2a5f30'], [-0.6, 0.4, 4.2, '#4f8f3a'], [1.3, 0.6, 3.8, '#3f7a3a']] as const) {
      b.cyl([h * 0.06, h * 0.75, h * 0.06], [x, h * 0.375, z], { color: 'bark' }).ball([h * 0.45, h * 0.22, h * 0.4], [x, h * 0.82, z], { color: c }).ball([h * 0.3, h * 0.18, h * 0.3], [x + h * 0.08, h * 0.95, z], { color: c });
      b.rod([x + h * 0.15, h * 0.75, z + 0.2], [x + h * 0.17, h * 0.4, z + 0.25], 0.06, 'green');
    }
    for (const [x, z] of [[-2.3, 1.2], [-0.2, 1.4], [2.3, 1.1]]) for (const r of [-40, 0, 40]) b.ball([0.25, 1.1, 0.08], [x + Math.sin(r * D2R) * 0.35, 0.55, z], { color: 'leaf', rot: [0, 0, -r] });
    return b.done();
  }),
  e('rapids', 'nature', 'water', () => {
    const b = m('rapids').box([0.9, 0.06, 1.2], [0, 0.2, 0], { color: 'water', rot: [12, 0, 0] });
    b.pair((s) => b.box([0.35, 0.4, 1.3], [s * 0.6, 0.2, 0], { color: 'dirt', round: 0.3 }).box([0.36, 0.06, 1.3], [s * 0.6, 0.42, 0], { color: 'grass', round: 0.5 }));
    for (const [x, z, s] of [[-0.2, -0.3, 0.2], [0.18, 0.1, 0.18], [-0.1, 0.4, 0.16]]) b.ball([s, s * 0.8, s], [x, 0.26 - z * 0.2, z], { color: 'rock' });
    for (const [x, z] of [[-0.05, -0.35], [0.0, -0.25], [0.3, 0.05], [0.05, 0.15], [-0.25, 0.4], [0.05, 0.42], [-0.3, -0.1], [0.25, -0.4]]) b.ball([0.13, 0.07, 0.1], [x, 0.25 - z * 0.21, z], { color: 'white', noInk: true });
    return b.done();
  }),
  e('rest (sports)', 'sports', 'cue sports', () =>
    m('rest (sports)')
      .box([0.4, 0.12, 0.5], [0.25, 0.06, 0], { color: 'darkgreen', round: 0.2 })
      .stick([-0.5, 0.02, 0], [0.25, 0.3, 0], 0.025, 'wood')
      .ball([0.03, 0.03, 0.03], [-0.5, 0.02, 0], { color: 'black' })
      .stick([0.22, 0.26, 0], [0.32, 0.38, 0], 0.018, 'brass')
      .stick([0.33, 0.26, 0], [0.21, 0.38, 0], 0.018, 'brass')
      .ball(0.055, [0.35, 0.15, 0.12], { color: 'white' })
      .done(),
  ),
  e('riddle', 'ideas', 'abstract', () => {
    const b = m('riddle').box([0.5, 0.12, 0.35], [0, 0.06, 0], { color: 'darkgray', round: 0.15 });
    arc(b, [0, 0.74, 0], 0.2, 160, -60, 7, 0.11, 'purple');
    return b.rod([0.1, 0.567, 0], [0, 0.47, 0], 0.11, 'purple').rod([0, 0.47, 0], [0, 0.38, 0], 0.11, 'purple').ball(0.13, [0, 0.2, 0], { color: 'purple' }).done();
  }),
  e('ring of fire', 'sports', 'stunts', () => {
    const b = m('ring of fire').box([1.3, 0.15, 0.45], [0, 0.075, 0], { color: 'red' });
    b.pair((s) => b.stick([s * 0.55, 0.1, 0], [s * 0.53, 0.85, 0], 0.06, 'iron'));
    b.torus([1.0, 1.0, 0.08], [0, 0.85, 0], { color: 'iron', tube: 0.1 });
    for (let k = 0; k < 10; k++) {
      const a = k * 36 + 18;
      b.cone([0.12, 0.2, 0.08], [Math.cos(a * D2R) * 0.58, 0.85 + Math.sin(a * D2R) * 0.58, 0], { color: k % 2 ? 'orange' : 'yellow', glow: true, rot: [0, 0, a - 90] });
    }
    return b.done();
  }),
  e('riot', 'town', 'police', () => who('riot', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('helmet', 'black'), face('goggles', 'darkgray'), held('shield', 'glass', 'L'), held('baton')] })),
  e('river', 'nature', 'water', () => {
    const b = m('river').box([1.0, 0.08, 0.7], [0, 0.04, 0], { color: 'grass', round: 0.15 });
    const pts: Array<[number, number]> = [[-0.1, -0.36], [0.15, -0.12], [-0.1, 0.1], [0.08, 0.36]];
    for (let i = 0; i < 3; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      b.box([0.14, 0.02, Math.hypot(x1 - x0, z1 - z0) + 0.1], [(x0 + x1) / 2, 0.082, (z0 + z1) / 2], { color: 'water', rot: [0, Math.atan2(x1 - x0, z1 - z0) / D2R, 0], round: 0.5, noInk: true });
    }
    leafy(b, -0.35, -0.15, 0.32);
    pine(b, 0.38, 0.1, 0.3);
    return b.ball([0.08, 0.05, 0.07], [0.25, 0.09, -0.2], { color: 'stone' }).ball([0.06, 0.04, 0.06], [-0.25, 0.09, 0.2], { color: 'stone' }).done();
  }),
  e('river styx', 'fantasy', 'afterlife', () =>
    m('river styx')
      .box([0.36, 0.03, 0.2], [0, 0.015, 0], { color: '#2a3a4a', round: 0.3 })
      .box([0.2, 0.035, 0.07], [0, 0.045, 0], { color: 'darkbrown', round: 0.6 })
      .cone([0.06, 0.11, 0.06], [-0.02, 0.115, 0], { color: 'black' })
      .ball(0.045, [-0.02, 0.18, 0], { color: 'black' })
      .ball([0.025, 0.03, 0.01], [-0.02, 0.175, 0.02], { color: '#efeae0', noInk: true })
      .stick([0.03, 0.03, 0.02], [0.01, 0.25, 0.02], 0.008, 'darkwood')
      .stick([0.09, 0.06, 0], [0.09, 0.11, 0], 0.006, 'darkgray')
      .ball(0.025, [0.09, 0.12, 0], { color: 'lime', glow: true })
      .done(),
  ),
  e('roadkill', 'wild', 'roadside', () => {
    const b = m('roadkill').box([0.6, 0.04, 0.4], [0, 0.02, 0], { color: 'darkgray', round: 0.1 }).box([0.12, 0.004, 0.03], [-0.2, 0.042, 0], { color: 'yellow', noInk: true, round: 0 }).box([0.12, 0.004, 0.03], [0.2, 0.042, 0], { color: 'yellow', noInk: true, round: 0 });
    b.ball([0.2, 0.02, 0.12], [0, 0.05, 0.08], { color: 'brown' }).ball([0.08, 0.02, 0.07], [0.12, 0.05, 0.08], { color: 'brown' }).ball([0.12, 0.012, 0.025], [-0.15, 0.047, 0.1], { color: 'brown', rot: [0, 20, 0] });
    for (const [x, z] of [[0.06, 0.15], [0.06, 0.01], [-0.06, 0.15], [-0.06, 0.01]]) b.ball([0.04, 0.012, 0.03], [x, 0.046, z], { color: 'brown' });
    b.pair((s) => b.box([0.025, 0.004, 0.006], [0.13, 0.062, 0.08 + s * 0.017], { color: 'black', rot: [0, 45, 0], noInk: true }).box([0.025, 0.004, 0.006], [0.13, 0.062, 0.08 + s * 0.017], { color: 'black', rot: [0, -45, 0], noInk: true }));
    return b.cone([0.08, 0.15, 0.08], [-0.22, 0.115, -0.12], { color: 'orange' }).torus([0.06, 0.06, 0.02], [-0.22, 0.11, -0.12], { color: 'white', rot: [90, 0, 0], tube: 0.2 }).done();
  }),
  e('sagittarius (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('sagittarius (stars)'), 'SAGITTARIUS').stick([0, 0.12, -0.02], [-0.05, 0.42, -0.02], 0.04, 'gold');
    const R = (x: number, y: number): Vec3 => [x * 0.82 - y * 0.57, 0.55 + x * 0.57 + y * 0.82, 0];
    for (let i = 0; i < 6; i++) b.rod(R(-0.1 - Math.sin(((i / 6) * 180) * D2R) * 0.12, -0.3 + i * 0.1), R(-0.1 - Math.sin((((i + 1) / 6) * 180) * D2R) * 0.12, -0.3 + (i + 1) * 0.1), 0.04, 'darkwood');
    b.stick(R(-0.1, -0.3), R(-0.1, 0.3), 0.008, 'white').stick(R(-0.1, 0), R(0.36, 0), 0.025, 'wood');
    return b.cone([0.07, 0.1, 0.03], R(0.4, 0), { color: 'silver', rot: [0, 0, -90 + 35] }).wedge([0.06, 0.08, 0.005], R(-0.06, 0.03), { color: 'red', rot: [0, 0, 35] }).wedge([0.06, 0.08, 0.005], R(-0.06, -0.03), { color: 'red', rot: [0, 0, 35 + 180] }).done();
  }),
  e('sand storm', 'nature', 'weather', () => {
    const b = m('sand storm').cyl([4.4, 0.12, 3], [0, 0.06, 0], { color: 'sand' }).ball([1.6, 0.6, 1.2], [1.3, 0.15, -0.6], { color: 'sand' });
    for (let i = 0; i < 7; i++) b.torus([1.0 + i * 0.42, 1.0 + i * 0.42, 0.5], [-0.4 + Math.sin(i * 0.9) * 0.25 + i * 0.08, 0.35 + i * 0.52, 0], { color: i % 2 ? '#d9b98a' : '#c9a26a', rot: [90, 0, 0], tube: 0.32 });
    for (const [x, y, z, s] of [[-1.6, 1.2, 0.6, 0.9], [1.5, 2.2, 0.4, 1.0], [-1.4, 2.8, -0.4, 0.8]]) b.ball(s, [x, y, z], { color: '#e0c48a' });
    b.cyl([0.14, 0.7, 0.14], [1.7, 0.4, 0.9], { color: 'green' }).capsule([0.1, 0.3, 0.1], [1.8, 0.55, 0.9], { color: 'green', rot: [0, 0, -40] });
    return b.done();
  }),
  e('savanna', 'nature', 'landscapes', () => {
    const b = m('savanna').cyl([1.4, 0.06, 1.0], [0, 0.03, 0], { color: '#d9b450' });
    b.rod([0.1, 0.05, -0.1], [0.12, 0.55, -0.1], 0.06, 'bark').rod([0.12, 0.5, -0.1], [-0.1, 0.78, -0.1], 0.04, 'bark').rod([0.12, 0.5, -0.1], [0.32, 0.8, -0.1], 0.04, 'bark');
    b.ball([0.9, 0.14, 0.5], [0.1, 0.85, -0.1], { color: '#5a7a2a' });
    for (const [x, z, h] of [[-0.45, 0.25, 0.22], [-0.3, 0.35, 0.18], [0.4, 0.3, 0.2], [0.55, 0.0, 0.16], [-0.5, -0.2, 0.2], [0.0, 0.38, 0.15]]) b.cone([0.08, h, 0.08], [x, 0.05 + h / 2, z], { color: '#c9a63a' });
    return b.done();
  }),
  e('scorpio (stars)', 'sky', 'zodiac', () => {
    const c = '#7a4a2a';
    const b = zb(m('scorpio (stars)'), 'SCORPIO').ball([0.22, 0.1, 0.3], [0, 0.2, 0.05], { color: c }).ball([0.14, 0.08, 0.12], [0, 0.21, 0.22], { color: c });
    b.pair((s) => {
      b.rod([s * 0.06, 0.21, 0.25], [s * 0.16, 0.23, 0.35], 0.035, c).ball([0.09, 0.06, 0.12], [s * 0.18, 0.24, 0.42], { color: c }).cone([0.04, 0.08, 0.03], [s * 0.16, 0.25, 0.5], { color: c, rot: [90, 0, 0] });
      for (const z of [0.12, 0.04, -0.04]) b.rod([s * 0.09, 0.2, z], [s * 0.25, 0.13, z * 1.3], 0.025, c);
      b.ball(0.03, [s * 0.035, 0.25, 0.27], { color: 'black', eye: true, noInk: true });
    });
    arc(b, [0, 0.45, -0.12], 0.25, 270, 40, 6, 0.07, c, 'zy');
    return b.cone([0.05, 0.1, 0.05], [0, 0.56, 0.1], { color: 'darkred', rot: [150, 0, 0] }).done();
  }),
  e('scratch', 'ideas', 'marks', () => {
    const b = m('scratch').box([0.3, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' }).box([0.28, 0.24, 0.04], [0, 0.16, 0], { color: 'lightwood', round: 0.1 });
    for (const x of [-0.06, 0, 0.06]) b.box([0.012, 0.18, 0.006], [x, 0.17, 0.021], { color: 'darkbrown', rot: [0, 0, -20], noInk: true }).box([0.006, 0.17, 0.004], [x + 0.01, 0.17, 0.022], { color: 'cream', rot: [0, 0, -20], noInk: true });
    return b.done();
  }),
  e('screenplay', 'study', 'writing', () =>
    m('screenplay')
      .box([0.34, 0.04, 0.16], [0, 0.02, 0], { color: 'darkgray' })
      .box([0.16, 0.22, 0.035], [-0.06, 0.15, 0], { color: 'white', rot: [-6, 0, 0] })
      .label('SCRIPT', [0.11, 0.03], [-0.06, 0.2, 0.025], { color: 'white', rot: [-6, 0, 0] })
      .ball(0.014, [-0.125, 0.22, 0.02], { color: 'brass' })
      .ball(0.014, [-0.125, 0.09, 0.02], { color: 'brass' })
      .box([0.12, 0.09, 0.02], [0.1, 0.085, 0.02], { color: 'black' })
      .box([0.12, 0.022, 0.02], [0.1, 0.15, 0.02], { color: 'white', rot: [0, 0, 12] })
      .box([0.02, 0.022, 0.022], [0.075, 0.145, 0.021], { color: 'black', rot: [0, 0, 12], noInk: true })
      .box([0.02, 0.022, 0.022], [0.115, 0.153, 0.021], { color: 'black', rot: [0, 0, 12], noInk: true })
      .done(),
  ),
  e('seafood', 'food', 'seafood', () => {
    const b = m('seafood').cyl([0.32, 0.02, 0.32], [0, 0.01, 0], { color: 'white' }).ball([0.1, 0.05, 0.08], [-0.05, 0.04, -0.03], { color: 'red' });
    b.pair((s) => b.rod([-0.05 + s * 0.04, 0.04, 0.0], [-0.05 + s * 0.08, 0.05, 0.05], 0.015, 'red').ball([0.03, 0.025, 0.03], [-0.05 + s * 0.085, 0.05, 0.06], { color: 'red' }));
    arc(b, [0.07, 0.065, 0.06], 0.035, -60, 200, 5, 0.025, 'orange');
    arc(b, [0.08, 0.065, -0.06], 0.035, -60, 200, 5, 0.025, '#f08a5a');
    return b.wedge([0.06, 0.04, 0.03], [-0.08, 0.04, 0.09], { color: 'yellow' }).done();
  }),
  e('serenity', 'ideas', 'emotions', () => {
    const b = m('serenity').box([0.9, 0.06, 0.6], [0, 0.03, 0], { color: 'sand', round: 0.2 });
    for (let i = 0; i < 4; i++) b.box([0.8, 0.006, 0.012], [0, 0.062, -0.24 + i * 0.07], { color: '#c9b07a', noInk: true, round: 0 });
    [[0.22, 0.07], [0.18, 0.06], [0.14, 0.055], [0.1, 0.05], [0.07, 0.04]].reduce((y, [w, h]) => (b.ball([w, h, w * 0.85], [-0.12, y + h / 2, 0.08], { color: 'stone' }), y + h * 0.85), 0.06);
    b.cyl([0.2, 0.02, 0.16], [0.24, 0.07, 0.12], { color: 'water' });
    for (let i = 0; i < 6; i++) b.ball([0.03, 0.06, 0.02], [0.24 + Math.cos(i * 60 * D2R) * 0.03, 0.1, 0.12 + Math.sin(i * 60 * D2R) * 0.03], { color: 'pink', rot: [Math.sin(i * 60 * D2R) * 40, 0, -Math.cos(i * 60 * D2R) * 40] });
    return b.ball(0.03, [0.24, 0.1, 0.12], { color: 'yellow' }).done();
  }),
  e('sesame', 'food', 'spices', () => {
    const b = m('sesame').cyl([0.5, 0.02, 0.5], [0, 0.01, 0], { color: 'white' }).cyl([0.44, 0.08, 0.44], [0, 0.06, 0], { color: 'bread' }).ball([0.48, 0.38, 0.48], [0, 0.12, 0], { color: 'crust' });
    for (let i = 0; i < 12; i++) {
      const a = i * 137.5 * D2R, r = 0.04 + (i % 4) * 0.035, x = Math.cos(a) * r, z = Math.sin(a) * r;
      b.ball([0.03, 0.014, 0.019], [x, 0.12 + 0.19 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 0.0576)), z], { color: 'cream', rot: [0, a / D2R, 0], noInk: true });
    }
    return b.done();
  }),
  e('seven', 'ideas', 'numbers', () => num('seven', '7', 7, 'teal', 'white')),
  e('sewage', 'nature', 'water', () =>
    m('sewage')
      .box([0.9, 0.7, 0.2], [0, 0.35, -0.1], { color: 'stone', round: 0.05 })
      .cyl([0.24, 0.25, 0.24], [0, 0.45, 0.1], { color: 'darkgray', rot: [90, 0, 0] })
      .torus([0.26, 0.26, 0.04], [0, 0.45, 0.22], { color: 'iron', tube: 0.25 })
      .rod([0, 0.4, 0.22], [0, 0.32, 0.36], 0.12, '#6b7a3a')
      .rod([0, 0.32, 0.36], [0.02, 0.06, 0.42], 0.1, '#6b7a3a')
      .cyl([0.6, 0.03, 0.4], [0.02, 0.015, 0.42], { color: '#6b6a3a' })
      .ball(0.04, [0.18, 0.04, 0.45], { color: '#8a8a4a' })
      .ball(0.03, [-0.15, 0.04, 0.5], { color: '#8a8a4a' })
      .done(),
  ),
  e('shadow (light)', 'ideas', 'light and shadow', () => {
    const b = m('shadow (light)').box([1.2, 0.05, 0.6], [0, 0.025, 0], { color: 'cream' });
    b.stick([-0.5, 0.05, 0], [-0.5, 0.75, 0], 0.03, 'darkgray').cone([0.2, 0.12, 0.2], [-0.5, 0.78, 0], { color: 'darkgray' }).ball(0.1, [-0.5, 0.7, 0], { color: 'yellow', glow: true });
    folk(b, -0.1, 0, 0.55, { shirt: 'red', pants: 'navy', hair: 'black', skin: 'skin3', y: 0.05 });
    return b.ball([0.5, 0.01, 0.12], [0.35, 0.055, 0], { color: '#3a3633', noInk: true }).ball([0.12, 0.01, 0.12], [0.62, 0.055, 0], { color: '#3a3633', noInk: true }).done();
  }),
  e('sharp', 'ideas', 'qualities', () =>
    m('sharp')
      .box([0.6, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' })
      .cone([0.14, 0.4, 0.14], [-0.18, 0.3, 0], { color: 'silver' })
      .cone([0.16, 0.6, 0.16], [0, 0.4, 0], { color: 'silver' })
      .cone([0.14, 0.45, 0.14], [0.18, 0.325, 0], { color: 'silver' })
      .star(0.12, [0, 0.72, 0.03], { color: 'white', glow: true })
      .done(),
  ),
  e('shooting star', 'sky', 'stars', () =>
    m('shooting star')
      .star(0.34, [0.25, 0.78, 0], { color: 'yellow' })
      .ball([0.16, 0.16, 0.1], [0.25, 0.78, 0], { color: 'yellow' })
      .cone([0.2, 0.6, 0.06], [-0.07, 0.6, -0.02], { color: '#fff3a0', glow: true, rot: [0, 0, 60] })
      .cone([0.12, 0.5, 0.04], [-0.05, 0.5, -0.03], { color: 'skyblue', glow: true, rot: [0, 0, 55] })
      .cone([0.12, 0.5, 0.04], [-0.02, 0.7, -0.03], { color: 'pink', glow: true, rot: [0, 0, 68] })
      .done(),
  ),
  e('siamese', 'pets', 'cats', () =>
    beast('siamese', { color: 'cream', body: [0.42, 0.16, 0.14], legL: 0.12, legW: 0.045, legColor: '#4a3428', neckL: 0.05, neckLean: 30, head: [0.12, 0.11, 0.11], snout: { len: 0.04, h: 0.05, w: 0.06, color: '#4a3428' }, ears: 'pointy', earSize: 0.06, earColor: '#4a3428', tail: 'long', tailColor: '#4a3428' }),
  ),
  e('siberian', 'pets', 'cats', () =>
    beast('siberian', { color: '#8f969e', body: [0.45, 0.2, 0.2], bodyShape: 'ball', legL: 0.12, legW: 0.06, neckL: 0.05, neckLean: 30, head: [0.14, 0.13, 0.14], snout: { len: 0.04, h: 0.05, w: 0.07, color: 'white' }, ears: 'pointy', earSize: 0.06, tail: 'fluffy', belly: 'white', acc: [ani.stripes('#5c6166', 4)] }),
  ),
  e('sideburns', 'wardrobe', 'hairstyles', () => bust('sideburns', { hair: 'darkbrown', top: 'orange' }, (b, hc) => b.pair((s) => b.box([0.026, 0.09, 0.05], [s * 0.068, 0.232, 0.028], { color: hc, round: 0.5 })))),
  e('singing', 'music', 'performing', () =>
    lift(who('singing', { top: 'magenta', bottom: 'black', hair: 'black', style: 'long', skin: 'skin3', acc: [held('mic')] }), 0, (b) => {
      for (const [x, y] of [[0.42, 1.65], [0.6, 1.4]]) b.ball([0.09, 0.07, 0.05], [x, y, 0.1], { color: 'black', rot: [0, 0, 25] }).box([0.016, 0.2, 0.02], [x + 0.038, y + 0.1, 0.1], { color: 'black' }).rod([x + 0.04, y + 0.2, 0.1], [x + 0.09, y + 0.14, 0.1], 0.02, 'black');
      return b;
    }),
  ),
  e('six', 'ideas', 'numbers', () => num('six', '6', 6, 'orange', 'white')),
  e('smile', 'ideas', 'emotions', () => {
    const b = emoji('smile', 0.24, 0.25, 'yellow');
    b.pair((s) => b.ball([0.03, 0.045, 0.012], [s * 0.045, 0.28, 0.035], { color: 'black', eye: true, noInk: true }).ball([0.035, 0.02, 0.01], [s * 0.07, 0.235, 0.033], { color: 'pink', noInk: true }));
    return arc(b, [0, 0.26, 0.036], 0.065, 200, 340, 4, 0.016, 'darkbrown', 'xy', { noInk: true }).done();
  }),
  e('smoke', 'nature', 'elements', () => {
    const b = m('smoke').rod([-0.2, 0.05, 0.3], [0.2, 0.05, 0.25], 0.1, 'bark').rod([-0.15, 0.05, 0.2], [0.18, 0.05, 0.38], 0.1, 'darkwood').ball(0.08, [0, 0.1, 0.3], { color: 'orange', glow: true });
    for (const [x, y, z, s, c] of [[0, 0.3, 0.3, 0.25, 'gray'], [0.1, 0.55, 0.36, 0.32, 'lightgray'], [-0.05, 0.85, 0.44, 0.4, 'gray'], [0.12, 1.2, 0.52, 0.48, 'lightgray'], [0.0, 1.6, 0.6, 0.55, '#c4c9cc']] as const) b.ball(s, [x, y, z], { color: c });
    return b.done();
  }),
  e('snow storm', 'nature', 'weather', () => {
    const b = m('snow storm').cyl([4.2, 0.12, 2.8], [0, 0.06, 0], { color: 'snow' }).ball([1.8, 0.6, 1.2], [-1.0, 0.15, 0.3], { color: 'snow' }).ball([1.4, 0.5, 1.0], [1.2, 0.12, -0.4], { color: 'snow' });
    cloud(b, 0, 3.4, -0.2, 3.2, '#7f8a94');
    for (const [x, y, z, s] of [[-1.2, 2.3, 0.4, 0.45], [0.3, 2.5, 0.5, 0.4], [1.3, 2.0, 0.3, 0.5], [-0.5, 1.5, 0.6, 0.45], [0.8, 1.1, 0.6, 0.4], [-1.4, 0.9, 0.5, 0.35], [0.0, 0.8, 0.8, 0.35], [1.5, 2.7, 0.0, 0.35]]) flake(b, x, y, z, s);
    for (const y of [1.3, 1.9]) b.rod([-1.8, y, 0.9], [1.6, y + 0.2, 0.9], 0.06, 'skyblue', { noInk: true });
    return b.done();
  }),
  e('someone', 'town', 'people', () =>
    lift(who('someone', { top: 'gray', bottom: 'darkgray', shoes: 'black', style: 'short', hair: 'darkbrown', long: true, acc: [hat('hood', 'gray')] }), 0, (b) => b.label('?', [0.4, 0.48], [0, 2.2, 0.03], { color: 'yellow' }).box([0.42, 0.5, 0.08], [0, 2.2, -0.03], { color: 'yellow', round: 0.3 })),
  ),
  e('spark', 'nature', 'fire', () =>
    m('spark')
      .ball([0.1, 0.06, 0.08], [0, 0.03, 0], { color: 'darkgray' })
      .box([0.1, 0.012, 0.01], [0.03, 0.1, 0.02], { color: 'yellow', glow: true, rot: [0, 0, 45] })
      .box([0.1, 0.012, 0.01], [0.03, 0.1, 0.02], { color: 'yellow', glow: true, rot: [0, 0, -45] })
      .box([0.14, 0.012, 0.01], [0.03, 0.1, 0.02], { color: 'white', glow: true })
      .box([0.012, 0.12, 0.01], [0.03, 0.1, 0.02], { color: 'white', glow: true })
      .ball(0.02, [0.07, 0.14, 0.02], { color: 'orange', glow: true })
      .ball(0.015, [-0.02, 0.13, 0.02], { color: 'orange', glow: true })
      .done(),
  ),
  e('spore', 'garden', 'fungi', () => {
    const b = m('spore').ball([0.1, 0.03, 0.1], [0, 0.01, 0], { color: 'dirt' }).cyl([0.04, 0.1, 0.04], [0, 0.06, 0], { color: 'cream' }).ball([0.15, 0.08, 0.15], [0, 0.12, 0], { color: 'brown' });
    for (const [x, z] of [[0.03, 0.05], [-0.04, 0.03], [0.0, -0.05]]) b.ball([0.025, 0.01, 0.025], [x, 0.155, z], { color: 'cream', noInk: true });
    for (const [x, y, z] of [[0.04, 0.2, 0.02], [-0.03, 0.22, 0.0], [0.06, 0.26, -0.02], [-0.05, 0.28, 0.03], [0.01, 0.31, 0.01], [0.05, 0.34, 0.0]]) b.ball(0.016, [x, y, z], { color: 'tan' });
    return b.done();
  }),
  e('spring', 'workshop', 'hardware', () => {
    const b = m('spring');
    const P = (i: number): Vec3 => [Math.cos(i * 30 * D2R) * 0.04, 0.012 + i * 0.0035, Math.sin(i * 30 * D2R) * 0.04];
    for (let i = 0; i < 36; i++) b.rod(P(i), P(i + 1), 0.012, 'steel');
    return b.done();
  }),
  e('sprout', 'garden', 'plants', () =>
    m('sprout')
      .ball([0.1, 0.04, 0.1], [0, 0.01, 0], { color: 'dirt' })
      .rod([0, 0.02, 0], [0.005, 0.05, 0], 0.01, 'lime')
      .rod([0.005, 0.05, 0], [-0.005, 0.075, 0], 0.01, 'lime')
      .ball([0.04, 0.008, 0.022], [0.02, 0.083, 0], { color: 'green', rot: [0, 0, 20] })
      .ball([0.04, 0.008, 0.022], [-0.028, 0.083, 0], { color: 'green', rot: [0, 0, -20] })
      .ball([0.02, 0.012, 0.015], [0.02, 0.025, 0.02], { color: 'tan' })
      .done(),
  ),
  e('star', 'ideas', 'shapes', () => m('star').box([0.2, 0.06, 0.12], [0, 0.03, 0], { color: 'darkgray' }).star(0.32, [0, 0.18, 0], { color: 'yellow' }).done()),
  e('stir fry', 'food', 'dishes', () => {
    const b = m('stir fry').cyl([0.14, 0.07, 0.14], [0, 0.035, 0], { color: 'iron', taper: 1.9 }).stick([0.13, 0.06, 0], [0.3, 0.09, 0], 0.025, 'darkwood').cyl([0.24, 0.02, 0.24], [0, 0.065, 0], { color: '#8a5a2a' });
    for (const [x, z, c] of [[0.05, 0.03, 'green'], [-0.05, -0.02, 'green'], [0.0, 0.07, 'red'], [-0.06, 0.05, 'orange'], [0.07, -0.05, 'orange'], [0.02, -0.06, 'red'], [-0.03, -0.07, 'tan']] as const) b.ball([0.04, 0.025, 0.03], [x, 0.08, z], { color: c, rot: [0, x * 900, 0] });
    return b.stick([-0.02, 0.07, 0.02], [-0.1, 0.25, 0.05], 0.008, 'lightwood').stick([0.0, 0.07, 0.02], [-0.07, 0.25, 0.07], 0.008, 'lightwood').done();
  }),
  e('storm', 'nature', 'weather', () => {
    const b = m('storm').cyl([4, 0.12, 2.6], [0, 0.06, 0], { color: 'grass' });
    cloud(b, 0, 3.4, -0.2, 3.2, '#4f565c');
    for (let i = 0; i < 8; i++) b.rod([-1.4 + i * 0.4, 2.7 - (i % 2) * 0.3, 0.3], [-1.75 + i * 0.4, 1.6 - (i % 2) * 0.3, 0.3], 0.05, 'skyblue', { noInk: true });
    b.rod([1.2, 0.1, 0.5], [1.35, 0.8, 0.5], 0.14, 'bark').rod([1.35, 0.8, 0.5], [1.7, 1.3, 0.5], 0.1, 'bark').ball([0.9, 0.6, 0.7], [1.85, 1.45, 0.5], { color: 'leaf', rot: [0, 0, -30] });
    return bolt(b, -0.6, 2.9, 1.4, 0.5, 0.4).done();
  }),
  e('stunt', 'sports', 'stunts', () => {
    const b = m('stunt').wedge([0.7, 0.4, 0.6], [-0.4, 0.2, 0], { color: 'wood', apex: 0.5 });
    const P = (x: number, y: number): Vec3 => [x - 0.08, y - 0.2, 0];
    for (const x of [0.12, 0.6]) b.torus([0.3, 0.3, 0.07], P(x, 0.85 + (x - 0.12) * 0.25), { color: 'rubber', tube: 0.3, rot: [0, 0, 14] });
    b.rod(P(0.12, 0.85), P(0.36, 0.98), 0.05, 'red').rod(P(0.36, 0.98), P(0.6, 0.97), 0.05, 'red').box([0.3, 0.12, 0.14], P(0.36, 1.03), { color: 'red', round: 0.5, rot: [0, 0, 14] }).rod(P(0.55, 1.0), P(0.5, 1.15), 0.03, 'darkgray');
    b.box([0.12, 0.22, 0.12], P(0.33, 1.2), { color: 'white', round: 0.5, rot: [0, 0, -15] }).ball(0.13, P(0.38, 1.37), { color: 'yellow' }).rod(P(0.36, 1.25), P(0.5, 1.16), 0.04, 'white');
    return b.star(0.12, [-0.15, 0.8, 0], { color: 'gold', glow: true }).star(0.09, [0.7, 1.05, 0], { color: 'gold', glow: true }).done();
  }),
  e('sun', 'sky', 'stars', () => {
    const b = m('sun').ball(2.4, [0, 2.6, 0], { color: 'yellow' });
    for (let k = 0; k < 12; k++) {
      const a = k * 30;
      b.cone([0.4, 0.6, 0.2], [Math.cos(a * D2R) * 1.55, 2.6 + Math.sin(a * D2R) * 1.55, 0], { color: 'orange', glow: true, rot: [0, 0, a - 90] });
    }
    return b.done();
  }),
  e('supernova', 'sky', 'space', () => {
    const b = m('supernova').ball(1.2, [0, 2.4, 0], { color: '#fff6c0' }).ball(1.6, [0, 2.4, 0], { color: 'yellow', glow: true });
    for (let k = 0; k < 14; k++) {
      const a = k * 137.5 * D2R, y = 1 - (2 * (k + 0.5)) / 14, r = Math.sqrt(1 - y * y);
      const d: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
      b.rod([d[0] * 0.6, 2.4 + d[1] * 0.6, d[2] * 0.6], [d[0] * 1.6, 2.4 + d[1] * 1.6, d[2] * 1.6], 0.16, k % 2 ? 'orange' : 'yellow', { glow: true });
    }
    return b.torus([3.2, 3.2, 0.12], [0, 2.4, 0], { color: 'magenta', glow: true, rot: [70, 0, 20], tube: 0.1 }).torus([2.6, 2.6, 0.1], [0, 2.4, 0], { color: 'cyan', glow: true, rot: [-30, 40, 0], tube: 0.1 }).done();
  }),
  e('swamp', 'nature', 'landscapes', () => {
    const b = m('swamp').cyl([1.3, 0.08, 1.0], [0, 0.04, 0], { color: '#4a3a24' }).cyl([1.0, 0.03, 0.75], [0.05, 0.085, 0.05], { color: '#5a6b3a' });
    b.cyl([0.16, 0.6, 0.16], [-0.35, 0.3, -0.2], { color: 'bark', taper: 0.6 }).rod([-0.35, 0.5, -0.2], [-0.55, 0.75, -0.2], 0.04, 'bark').rod([-0.35, 0.55, -0.2], [-0.15, 0.8, -0.25], 0.035, 'bark');
    for (const [x, y] of [[-0.5, 0.62], [-0.2, 0.68]]) b.capsule([0.04, 0.2, 0.03], [x, y, -0.18], { color: '#7a8a4a' });
    for (const [x, z, h] of [[0.4, -0.25, 0.4], [0.45, -0.15, 0.32], [0.35, -0.35, 0.35]]) b.stick([x, 0.08, z], [x, 0.08 + h, z], 0.01, 'darkgreen').capsule([0.03, 0.08, 0.03], [x, 0.06 + h, z], { color: 'darkbrown' });
    for (const [x, z] of [[0.1, 0.2], [0.25, 0.1], [-0.1, 0.25]]) b.cyl([0.1, 0.01, 0.1], [x, 0.105, z], { color: 'green' });
    return b.rod([-0.1, 0.12, 0.3], [0.3, 0.12, 0.35], 0.08, 'darkwood').done();
  }),
  e('taurus (stars)', 'sky', 'zodiac', () =>
    lift(
      beast('taurus (stars)', { color: '#5a3a22', body: [0.62, 0.36, 0.34], legL: 0.22, legW: 0.09, hoof: 'black', neckL: 0.08, neckLean: 50, neckW: 0.24, head: [0.22, 0.2, 0.2], snout: { len: 0.08, h: 0.1, w: 0.13, color: '#d9a080' }, ears: 'side', earSize: 0.07, tail: 'tuft', acc: [ani.horns('cream', 'bull')] }),
      0.12,
      (b) => zb(b, 'TAURUS'),
    ),
  ),
  e('tear', 'ideas', 'emotions', () => drop(m('tear').cyl([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' }).stick([0, 0.03, 0], [0, 0.1, 0], 0.02, 'darkgray'), 0, 0.17, 0, 0.14, 'skyblue').ball(0.03, [-0.03, 0.2, 0.06], { color: 'white', noInk: true }).done()),
  e('tempo', 'music', 'music tools', () =>
    m('tempo')
      .box([0.26, 0.05, 0.18], [0, 0.025, 0], { color: 'darkwood' })
      .cyl([0.26, 0.36, 0.26], [0, 0.23, 0], { color: 'wood', segs: 4, taper: 0.35, rot: [0, 45, 0] })
      .box([0.08, 0.24, 0.01], [0, 0.22, 0.075], { color: 'cream', rot: [-14, 0, 0] })
      .stick([0, 0.1, 0.09], [0.07, 0.44, 0.085], 0.012, 'steel')
      .box([0.04, 0.035, 0.03], [0.05, 0.34, 0.09], { color: 'gold', rot: [0, 0, -12] })
      .done(),
  ),
  e('ten', 'ideas', 'numbers', () => num('ten', '10', 10, 'red', 'white')),
  e('test', 'study', 'school', () =>
    m('test')
      .box([0.5, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' })
      .box([0.42, 0.56, 0.05], [0, 0.4, -0.06], { color: 'brown', rot: [-8, 0, 0] })
      .box([0.36, 0.46, 0.01], [0, 0.39, -0.03], { color: 'white', rot: [-8, 0, 0], round: 0.05 })
      .box([0.16, 0.05, 0.04], [0, 0.66, -0.06], { color: 'silver', rot: [-8, 0, 0] })
      .label('A+', [0.14, 0.1], [0.09, 0.56, -0.005], { color: 'white', rot: [-8, 0, 0] })
      .box([0.2, 0.012, 0.005], [-0.04, 0.44, -0.015], { color: 'gray', noInk: true, rot: [-8, 0, 0] })
      .box([0.24, 0.012, 0.005], [-0.02, 0.38, -0.022], { color: 'gray', noInk: true, rot: [-8, 0, 0] })
      .box([0.2, 0.012, 0.005], [-0.04, 0.32, -0.03], { color: 'gray', noInk: true, rot: [-8, 0, 0] })
      .capsule([0.025, 0.28, 0.025], [0, 0.115, 0.1], { color: 'yellow', rot: [0, 0, 80] })
      .done(),
  ),
  e('testimony', 'study', 'law', () => {
    const b = m('testimony').box([0.8, 0.75, 0.5], [0, 0.375, 0], { color: 'wood', round: 0.05 }).box([0.86, 0.06, 0.56], [0, 0.78, 0], { color: 'darkwood' }).box([0.6, 0.45, 0.02], [0, 0.38, 0.26], { color: 'darkwood', round: 0.1 });
    b.stick([0.2, 0.81, 0.1], [0.12, 1.05, 0.18], 0.015, 'black').ball([0.05, 0.07, 0.05], [0.115, 1.08, 0.19], { color: 'darkgray' });
    return b.box([0.2, 0.05, 0.15], [-0.18, 0.835, 0.08], { color: 'black' }).box([0.012, 0.08, 0.005], [-0.18, 0.862, 0.155], { color: 'gold', noInk: true, rot: [90, 0, 0] }).done();
  }),
  e('the constitution', 'study', 'documents', () =>
    m('the constitution')
      .box([0.6, 0.1, 0.3], [0, 0.05, 0], { color: 'darkwood' })
      .box([0.5, 0.62, 0.03], [0, 0.45, -0.04], { color: '#eadcb0', rot: [-6, 0, 0] })
      .capsule([0.07, 0.56, 0.07], [0, 0.77, -0.07], { color: 'tan', rot: [0, 0, 90] })
      .capsule([0.07, 0.56, 0.07], [0, 0.15, -0.01], { color: 'tan', rot: [0, 0, 90] })
      .label('We the People', [0.38, 0.07], [0, 0.66, -0.035], { color: '#eadcb0', rot: [-6, 0, 0] })
      .box([0.36, 0.01, 0.005], [0, 0.55, -0.042], { color: '#8a7a5a', noInk: true, rot: [-6, 0, 0] })
      .box([0.36, 0.01, 0.005], [0, 0.48, -0.035], { color: '#8a7a5a', noInk: true, rot: [-6, 0, 0] })
      .box([0.3, 0.01, 0.005], [-0.03, 0.41, -0.028], { color: '#8a7a5a', noInk: true, rot: [-6, 0, 0] })
      .cyl([0.07, 0.06, 0.07], [0.22, 0.13, 0.08], { color: 'black' })
      .ball([0.04, 0.25, 0.012], [0.27, 0.3, 0.07], { color: 'white', rot: [0, 0, -15] })
      .done(),
  ),
  e('three', 'ideas', 'numbers', () => num('three', '3', 3, 'yellow', 'red')),
  e('thunderstorm', 'nature', 'weather', () => {
    const b = m('thunderstorm').cyl([4, 0.12, 2.6], [0, 0.06, 0], { color: 'grass' });
    cloud(b, 0, 3.4, -0.2, 3.4, '#3f454b');
    for (let i = 0; i < 6; i++) b.rod([-1.2 + i * 0.5, 2.6, 0.5], [-1.3 + i * 0.5, 1.9, 0.5], 0.05, 'skyblue', { noInk: true });
    bolt(b, -0.7, 2.9, 2.8, 0.7, 0.2);
    return bolt(b, 0.9, 2.9, 2.0, 0.55, 0.3).done();
  }),
  e('tingle', 'ideas', 'feelings', () => {
    const b = m('tingle').cyl([0.3, 0.06, 0.2], [0, 0.03, 0], { color: 'darkgray' }).capsule([0.1, 0.32, 0.08], [0, 0.24, 0], { color: 'skin2' }).box([0.18, 0.18, 0.07], [0, 0.46, 0], { color: 'skin2', round: 0.5 });
    for (let i = 0; i < 4; i++) b.capsule([0.04, 0.13 - Math.abs(i - 1.5) * 0.02, 0.04], [-0.06 + i * 0.04, 0.6 - Math.abs(i - 1.5) * 0.01, 0], { color: 'skin2' });
    b.capsule([0.045, 0.1, 0.045], [0.11, 0.48, 0.01], { color: 'skin2', rot: [0, 0, -45] });
    for (const [x, y, s] of [[-0.14, 0.72, 0.1], [0.06, 0.78, 0.08], [0.18, 0.66, 0.09], [-0.2, 0.55, 0.07], [0.22, 0.52, 0.06]]) b.star(s, [x, y, 0.02], { color: 'yellow', glow: true });
    return b.done();
  }),
  e('tiramisu', 'food', 'desserts', () => {
    const b = m('tiramisu').cyl([0.24, 0.012, 0.24], [0, 0.006, 0], { color: 'white' });
    ['#7a4a2a', 'cream', '#7a4a2a', 'cream'].forEach((c, i) => b.box([0.13, 0.026, 0.1], [0, 0.025 + i * 0.026, 0], { color: c, round: 0.1 }));
    return b.box([0.13, 0.008, 0.1], [0, 0.12, 0], { color: 'chocolate', round: 0.2 }).ball([0.018, 0.012, 0.024], [0.02, 0.13, 0.01], { color: 'darkbrown' }).rod([-0.1, 0.014, 0.08], [0.0, 0.014, 0.11], 0.008, 'silver').done();
  }),
  e('tornado', 'nature', 'weather', () => {
    const b = m('tornado').cyl([3.6, 0.1, 2.6], [0, 0.05, 0], { color: 'dirt' });
    for (let i = 0; i < 8; i++) {
      const d = 0.6 + i * 0.5;
      b.torus([d, d, 0.6], [Math.sin(i * 0.7) * 0.25 + i * 0.05, 0.35 + i * 0.58, 0], { color: i % 2 ? '#8f969e' : '#6b737a', rot: [90, 0, 0], tube: 0.3 });
    }
    for (const [x, y, z, s, c] of [[1.2, 1.4, 0.4, 0.25, 'wood'], [-1.1, 2.3, 0.3, 0.3, 'red'], [1.4, 3.1, -0.2, 0.2, 'wood']] as const) b.box(s, [x, y, z], { color: c, rot: [30, 40, 10] });
    return b.ball([1.0, 0.25, 0.8], [0, 0.15, 0], { color: '#b5a48e' }).done();
  }),
  e('treasury', 'places', 'government', () => {
    const b = m('treasury').box([4, 0.15, 2.6], [0, 0.075, 0], { color: 'stone' }).box([3.7, 0.15, 2.3], [0, 0.225, 0], { color: 'lightgray' }).box([3.4, 0.15, 2.0], [0, 0.375, 0], { color: 'stone' });
    b.box([3.0, 1.9, 1.2], [0, 1.4, -0.3], { color: 'cream', round: 0.04 });
    for (let i = 0; i < 6; i++) b.cyl([0.22, 1.9, 0.22], [-1.35 + i * 0.54, 1.4, 0.75], { color: 'white' });
    b.box([3.3, 0.35, 1.9], [0, 2.52, 0.0], { color: 'cream' }).wedge([3.4, 0.7, 1.95], [0, 3.05, 0], { color: 'lightgray' }).label('TREASURY', [1.6, 0.24], [0, 2.52, 0.97], { color: 'cream' });
    for (const [x, y, z] of [[-0.25, 0.5, 1.3], [0.15, 0.5, 1.3], [-0.05, 0.62, 1.3]]) b.cyl([0.36, 0.12, 0.2], [x, y, z], { color: 'gold', segs: 4, taper: 0.7, rot: [0, 45, 0] });
    return b.done();
  }),
  e('tsunami', 'nature', 'disasters', () => {
    const b = m('tsunami').box([5, 0.2, 3.4], [0, 0.1, 0], { color: 'water' });
    b.box([5, 3.6, 1.0], [0, 1.9, -0.6], { color: 'blue', rot: [16, 0, 0], round: 0.4 }).capsule([1.1, 5.2, 1.1], [0, 3.6, 0.15], { color: 'blue', rot: [0, 0, 90] }).capsule([0.7, 4.8, 0.7], [0, 3.2, 0.55], { color: 'skyblue', rot: [0, 0, 90] });
    for (let i = 0; i < 6; i++) b.ball([0.6, 0.4, 0.5], [-2.0 + i * 0.8, 4.05, 0.05 + (i % 2) * 0.15], { color: 'white' });
    return house(b, -1.3, 1.2, 0.8, 'cream', 'red').done();
  }),
  e('two', 'ideas', 'numbers', () => num('two', '2', 2, 'pink', 'blue')),
  e('uranus', 'sky', 'planets', () => m('uranus').ball(2.6, [0, 2.0, 0], { color: '#a8e0e8' }).torus([3.8, 3.8, 0.06], [0, 2.0, 0], { color: '#d4eef2', rot: [0, 72, 12], tube: 0.04 }).ball([2.0, 0.3, 0.4], [0, 2.3, 1.1], { color: '#bfeaf0', noInk: true }).done()),
  e('venus', 'sky', 'planets', () => {
    const b = m('venus').ball(2.8, [0, 2.1, 0], { color: '#e8d29a' });
    for (const [x, y, w, c] of [[-0.3, 0.4, 1.6, '#f2e2b4'], [0.3, -0.2, 1.8, '#d9bb7a'], [0.0, -0.75, 1.2, '#f2e2b4']] as const) b.ball([w, 0.22, 0.12], [x, 2.1 + y, Math.sqrt(1.96 - x * x - y * y) - 0.05], { color: c, noInk: true, rot: [0, 0, 8] });
    return b.done();
  }),
  e('virgo (stars)', 'sky', 'zodiac', () =>
    lift(who('virgo (stars)', { h: 0.95, skin: 'skin1', hair: 'gold', style: 'long', top: 'white', bottom: 'white', skirt: 'white', acc: [held('bouquet', 'gold'), hat('headband', 'gold')] }), 0.12, (b) => zb(b, 'VIRGO')),
  ),
  e('vomit', 'clinic', 'sickness', () => {
    const b = emoji('vomit', 0.42, 0.8, '#9bc45a');
    b.pair((s) => b.box([0.06, 0.012, 0.01], [s * 0.08, 0.86, 0.064], { color: 'black', rot: [0, 0, s * 20], noInk: true }));
    b.ball([0.1, 0.08, 0.03], [0, 0.72, 0.06], { color: '#4a1a1a', noInk: true });
    b.rod([0, 0.71, 0.08], [0, 0.6, 0.26], 0.07, '#c9c43a').rod([0, 0.6, 0.26], [0, 0.32, 0.34], 0.06, '#c9c43a');
    return b.cyl([0.24, 0.26, 0.24], [0, 0.13, 0.34], { color: 'gray', taper: 1.25 }).torus([0.3, 0.3, 0.02], [0, 0.26, 0.34], { color: 'darkgray', rot: [90, 0, 0] }).done();
  }),
  e('war', 'ideas', 'hardship', () => {
    const b = m('war').box([0.6, 0.12, 0.35], [0, 0.06, 0], { color: 'stone' });
    b.pair((s) => b.box([0.06, 0.85, 0.02], [s * 0.04, 0.6, -0.04], { color: 'silver', rot: [0, 0, s * 38] }).box([0.18, 0.04, 0.04], [s * 0.3, 0.27, -0.04], { color: 'gold', rot: [0, 0, s * 38] }).capsule([0.04, 0.12, 0.04], [s * 0.34, 0.2, -0.04], { color: 'darkbrown', rot: [0, 0, s * 38] }));
    return b.cyl([0.48, 0.08, 0.48], [0, 0.5, 0.04], { color: 'darkred', rot: [90, 0, 0] }).torus([0.48, 0.48, 0.05], [0, 0.5, 0.08], { color: 'gold', tube: 0.1 }).ball([0.12, 0.12, 0.07], [0, 0.5, 0.1], { color: 'gold' }).done();
  }),
  e('warrant', 'study', 'law', () =>
    m('warrant')
      .box([0.6, 0.1, 0.3], [0, 0.05, 0], { color: 'darkwood' })
      .box([0.4, 0.55, 0.03], [-0.06, 0.4, -0.04], { color: 'cream', rot: [-6, 0, 0] })
      .label('WARRANT', [0.3, 0.07], [-0.06, 0.6, -0.02], { color: 'cream', rot: [-6, 0, 0] })
      .box([0.3, 0.01, 0.005], [-0.06, 0.5, -0.02], { color: 'gray', noInk: true, rot: [-6, 0, 0] })
      .box([0.3, 0.01, 0.005], [-0.06, 0.44, -0.015], { color: 'gray', noInk: true, rot: [-6, 0, 0] })
      .box([0.03, 0.12, 0.01], [0.05, 0.19, -0.005], { color: 'red', rot: [0, 0, 15] })
      .box([0.03, 0.12, 0.01], [0.09, 0.19, -0.005], { color: 'red', rot: [0, 0, -15] })
      .cyl([0.1, 0.025, 0.1], [0.07, 0.24, -0.005], { color: 'darkred', rot: [80, 0, 0] })
      .star(0.14, [0.22, 0.18, 0.08], { color: 'gold' })
      .done(),
  ),
  e('warranty', 'study', 'documents', () =>
    m('warranty')
      .box([0.7, 0.1, 0.3], [0, 0.05, 0], { color: 'darkgray' })
      .box([0.55, 0.42, 0.03], [-0.06, 0.35, -0.05], { color: 'white', rot: [-6, 0, 0] })
      .torus([0.5, 0.37, 0.01], [-0.06, 0.35, -0.03], { color: 'gold', tube: 0.04, rot: [-6, 0, 0] })
      .label('WARRANTY', [0.34, 0.07], [-0.06, 0.47, -0.025], { color: 'white', rot: [-6, 0, 0] })
      .cyl([0.1, 0.02, 0.1], [0.1, 0.24, -0.02], { color: 'gold', rot: [84, 0, 0] })
      .box([0.2, 0.22, 0.05], [0.24, 0.26, 0.06], { color: 'green', round: 0.3 })
      .cone([0.2, 0.12, 0.05], [0.24, 0.1, 0.06], { color: 'green', segs: 4, rot: [180, 0, 0] })
      .box([0.03, 0.08, 0.02], [0.21, 0.24, 0.09], { color: 'white', rot: [0, 0, 40], noInk: true })
      .box([0.03, 0.14, 0.02], [0.26, 0.27, 0.09], { color: 'white', rot: [0, 0, -30], noInk: true })
      .done(),
  ),
  e('water', 'nature', 'elements', () => {
    const b = m('water').cyl([0.4, 0.02, 0.3], [0, 0.01, 0], { color: 'water' }).torus([0.3, 0.3, 0.03], [0, 0.025, 0], { color: 'skyblue', rot: [90, 0, 0], tube: 0.2 });
    drop(b, 0, 0.13, 0, 0.18, 'water');
    for (const [x, z] of [[0.17, 0.05], [-0.16, 0.08], [0.05, 0.15]]) b.ball(0.03, [x, 0.06, z], { color: 'skyblue' });
    return b.ball(0.035, [-0.04, 0.16, 0.08], { color: 'white', noInk: true }).done();
  }),
  e('webbed feet', 'aviary', 'bird parts', () => {
    const b = m('webbed feet').ball([0.3, 0.2, 0.26], [0, 0.42, -0.02], { color: 'white' });
    b.pair((s) => {
      b.rod([s * 0.07, 0.34, 0], [s * 0.07, 0.03, 0.01], 0.03, 'orange');
      b.wedge([0.13, 0.15, 0.012], [s * 0.07, 0.008, 0.07], { color: 'orange', rot: [-90, 0, 0] });
      for (const dx of [-0.055, 0, 0.055]) b.rod([s * 0.07, 0.016, 0.0], [s * 0.07 + dx, 0.016, 0.14], 0.016, '#d9732a');
    });
    return b.done();
  }),
  e('wedding', 'town', 'events', () => {
    const b = m('wedding');
    arc(b, [0, 0.0, -0.35], 1.0, 0, 180, 8, 0.08, 'white');
    for (let k = 1; k < 8; k++) b.ball(0.13, [Math.cos(k * 22.5 * D2R), Math.sin(k * 22.5 * D2R), -0.3], { color: k % 2 ? 'pink' : 'white' });
    folk(b, -0.3, 0, 1.6, { shirt: 'white', pants: 'white', skirt: 'white', hair: '#d9a441', skin: 'skin1', shoes: 'white' });
    b.ball([0.36, 0.5, 0.12], [-0.3, 1.25, -0.1], { color: 'white' }).ball(0.12, [-0.06, 0.78, 0.1], { color: 'pink' });
    folk(b, 0.3, 0, 1.8, { shirt: 'black', pants: 'black', hair: 'darkbrown', skin: 'skin3', shoes: 'black' });
    return b.box([0.08, 0.2, 0.02], [0.3, 1.12, 0.145], { color: 'white', noInk: true }).box([0.06, 0.03, 0.02], [0.3, 1.21, 0.155], { color: 'black', noInk: true }).done();
  }),
  e('wisp', 'fantasy', 'spirits', () =>
    m('wisp')
      .ball([0.14, 0.07, 0.12], [0, 0.035, 0], { color: '#6b7f5a' })
      .ball([0.1, 0.02, 0.08], [0.01, 0.07, 0], { color: 'green', noInk: true })
      .ball(0.09, [0, 0.2, 0], { color: 'cyan', glow: true })
      .cone([0.07, 0.14, 0.07], [0.01, 0.3, 0], { color: '#bff4ff', glow: true, rot: [0, 0, -10] })
      .ball(0.03, [-0.06, 0.13, 0.02], { color: 'cyan', glow: true })
      .ball(0.02, [-0.08, 0.09, 0.03], { color: 'cyan', glow: true })
      .done(),
  ),
  e('wisteria', 'garden', 'trees', () => {
    const b = m('wisteria');
    for (const [x, z] of [[-1, 0.6], [1, 0.6], [-1, -0.6], [1, -0.6]]) b.stick([x, 0, z], [x, 2.4, z], 0.14, 'wood');
    for (const z of [0.6, -0.6]) b.box([2.4, 0.12, 0.14], [0, 2.45, z], { color: 'wood' });
    for (const x of [-0.8, -0.27, 0.27, 0.8]) b.box([0.12, 0.1, 1.6], [x, 2.55, 0], { color: 'wood' });
    b.ball([2.4, 0.4, 1.6], [0, 2.75, 0], { color: 'leaf' });
    for (let i = 0; i < 10; i++) b.cone([0.24, 0.6 + (i % 3) * 0.15, 0.24], [-1.0 + (i % 5) * 0.5, 2.15 - (i % 3) * 0.07, i < 5 ? 0.6 : -0.6], { color: i % 2 ? '#b48ae0' : '#9a6fd0', rot: [180, 0, 0] });
    return b.done();
  }),
  e('wrist', 'clinic', 'body parts', () =>
    m('wrist')
      .cyl([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'darkgray' })
      .capsule([0.07, 0.2, 0.06], [0, 0.13, 0], { color: 'skin2' })
      .box([0.1, 0.1, 0.045], [0, 0.27, 0], { color: 'skin2', round: 0.5 })
      .capsule([0.022, 0.065, 0.022], [-0.035, 0.335, 0], { color: 'skin2' })
      .capsule([0.022, 0.075, 0.022], [-0.012, 0.34, 0], { color: 'skin2' })
      .capsule([0.022, 0.07, 0.022], [0.012, 0.338, 0], { color: 'skin2' })
      .capsule([0.02, 0.055, 0.02], [0.034, 0.328, 0], { color: 'skin2' })
      .capsule([0.024, 0.06, 0.024], [0.06, 0.27, 0.01], { color: 'skin2', rot: [0, 0, -40] })
      .torus([0.085, 0.075, 0.03], [0, 0.2, 0], { color: 'black', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.045, 0.012, 0.045], [0, 0.2, 0.037], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.035, 0.006, 0.035], [0, 0.2, 0.044], { color: 'white', rot: [90, 0, 0], noInk: true })
      .done(),
  ),
  e('yacht club', 'places', 'clubs', () => {
    const b = m('yacht club').box([5, 0.12, 4], [0, 0.06, 0], { color: 'water' }).box([3.4, 0.3, 2.0], [-0.8, 0.15, -1.0], { color: 'sand' });
    b.box([2.6, 1.6, 1.4], [-0.9, 1.1, -1.1], { color: 'white', round: 0.04 }).wedge([2.9, 0.7, 1.6], [-0.9, 2.25, -1.1], { color: 'navy' }).label('YACHT CLUB', [1.6, 0.24], [-0.9, 1.55, -0.38], { color: 'navy' });
    b.pair((s) => b.box([0.5, 0.45, 0.04], [-0.9 + s * 0.7, 1.0, -0.38], { color: 'glass' }));
    b.box([0.7, 0.1, 2.4], [1.0, 0.25, 0.5], { color: 'wood' }).stick([0.7, 0, 1.6], [0.7, 0.3, 1.6], 0.1, 'darkwood').stick([1.3, 0, 1.6], [1.3, 0.3, 1.6], 0.1, 'darkwood');
    b.box([0.4, 0.25, 1.3], [1.85, 0.2, 0.7], { color: 'white', round: 0.6 }).stick([1.85, 0.3, 0.75], [1.85, 2.2, 0.75], 0.05, 'silver').wedge([0.04, 1.6, 1.0], [1.85, 1.2, 0.35], { color: 'white', apex: 0.5, rot: [0, 90, 0] });
    return b.stick([0.5, 0.3, -1.2], [0.5, 3.0, -1.2], 0.05, 'silver').wedge([0.5, 0.3, 0.02], [0.75, 2.85, -1.2], { color: 'yellow', rot: [0, 0, -90] }).done();
  }),
  e('you', 'ideas', 'sayings', () =>
    m('you')
      .cyl([0.36, 0.06, 0.3], [0, 0.03, -0.1], { color: 'darkgray' })
      .stick([0, 0.06, -0.15], [0, 0.66, -0.15], 0.06, 'darkgray')
      .cyl([0.22, 0.3, 0.22], [0, 0.75, -0.15], { color: 'blue', rot: [90, 0, 0] })
      .cyl([0.24, 0.06, 0.24], [0, 0.75, 0.02], { color: 'white', rot: [90, 0, 0] })
      .ball([0.24, 0.22, 0.22], [0, 0.74, 0.14], { color: 'skin2' })
      .capsule([0.075, 0.26, 0.075], [0.03, 0.8, 0.32], { color: 'skin2', rot: [90, 0, 0] })
      .capsule([0.065, 0.12, 0.065], [-0.09, 0.79, 0.2], { color: 'skin2', rot: [70, 0, -30] })
      .done(),
  ),
  e('zero', 'ideas', 'numbers', () => m('zero').box([0.8, 0.1, 0.44], [0, 0.05, 0], { color: 'wood', round: 0.2 }).torus([0.7, 1.05, 0.18], [0, 0.6, 0], { color: 'teal', tube: 0.3 }).done()),
];
