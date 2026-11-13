/** Catalog chunk other: the words in assign/other.tsv. */
import { e, type CatalogEntry } from './types';
import { A, around, m, withAct, type M } from '../dsl';
import { ani, beast, face, hat, held, wear, who, type AniExtra, type Extra } from '../accessories';
import { bird } from '../kit';
import { measure } from '../math';
import { col } from '../colors';
import type { FigPart, Figure, Vec3 } from '../types';

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

/** A puffy cloud w wide centred at (x, y, z). With o.name the first puff is named and the rest ride on it. */
function cloud(b: M, x: number, y: number, z: number, w: number, c = 'white', o: O = {}): M {
  const { name, ...rest } = o ?? {};
  const kid: O = name ? { ...rest, parent: name } : rest;
  return b
    .ball([w * 0.55, w * 0.48, w * 0.45], [x, y + w * 0.08, z], { color: c, ...rest, ...(name ? { name } : {}) })
    .ball([w * 0.42, w * 0.34, w * 0.38], [x - w * 0.3, y - w * 0.01, z], { color: c, ...kid })
    .ball([w * 0.42, w * 0.36, w * 0.38], [x + w * 0.28, y, z], { color: c, ...kid })
    .ball([w * 0.3, w * 0.26, w * 0.3], [x + w * 0.1, y + w * 0.02, z + w * 0.14], { color: c, ...kid })
    .ball([w * 0.95, w * 0.22, w * 0.36], [x, y - w * 0.08, z], { color: c, ...kid });
}

/** A teardrop s wide, round end centred at (x, y, z), point up. */
function drop(b: M, x: number, y: number, z: number, s: number, c = 'water', o: O = {}): M {
  return b.ball(s, [x, y, z], { color: c, ...o }).cone([s * 0.86, s * 0.95, s * 0.86], [x, y + s * 0.47, z], { color: c, ...o });
}

/** A zigzag lightning bolt from (x, top) down to (x, top - h). With a name, the first stroke is named (a light mover
 *  when o.mover is given) and the rest ride on it. */
function bolt(b: M, x: number, top: number, h: number, w: number, z = 0, c = 'yellow', o: O = {}): M {
  const { name, ...rest } = o ?? {};
  const first: O = { glow: true, ...rest, ...(name ? { name } : {}) };
  const kid: O = { glow: true, ...(rest.parent ? { parent: rest.parent } : {}), ...(name ? { parent: name } : {}) };
  seg(b, [x + w * 0.35, top, z], [x - w * 0.15, top - h * 0.45, z], w * 0.32, w * 0.14, c, first);
  seg(b, [x - w * 0.3, top - h * 0.42, z], [x + w * 0.3, top - h * 0.5, z], w * 0.3, w * 0.14, c, kid);
  return seg(b, [x + w * 0.2, top - h * 0.48, z], [x - w * 0.2, top - h, z], w * 0.2, w * 0.14, c, kid);
}

/** Trees: a pine of three cones, a round leafy tree, a palm. h is the real height in metres. */
function pine(b: M, x: number, z: number, h: number, c = 'darkgreen', o: O = {}): M {
  return b
    .cyl([h * 0.08, h * 0.3, h * 0.08], [x, h * 0.15, z], { color: 'bark', ...o })
    .cone([h * 0.5, h * 0.45, h * 0.5], [x, h * 0.42, z], { color: c, ...o })
    .cone([h * 0.38, h * 0.4, h * 0.38], [x, h * 0.64, z], { color: c, ...o })
    .cone([h * 0.25, h * 0.32, h * 0.25], [x, h * 0.84, z], { color: c, ...o });
}
function leafy(b: M, x: number, z: number, h: number, c = 'leaf', o: O = {}): M {
  return b
    .cyl([h * 0.1, h * 0.5, h * 0.1], [x, h * 0.25, z], { color: 'bark', taper: 0.7, ...o })
    .ball([h * 0.62, h * 0.5, h * 0.62], [x, h * 0.68, z], { color: c, ...o })
    .ball([h * 0.4, h * 0.34, h * 0.4], [x + h * 0.12, h * 0.86, z + h * 0.05], { color: c, ...o });
}
function palm(b: M, x: number, z: number, h: number, c = 'green'): M {
  b.rod([x, 0, z], [x + h * 0.08, h * 0.5, z], h * 0.07, 'bark').rod([x + h * 0.08, h * 0.5, z], [x + h * 0.03, h * 0.92, z], h * 0.06, 'bark');
  around(7, h * 0.2, 0.3).forEach(([lx, lz], i) =>
    b.ball([h * 0.42, h * 0.035, h * 0.12], [x + h * 0.03 + lx, h * 0.88, z + lz], { color: c, rot: [0, -(0.3 + (i / 7) * Math.PI * 2) / D2R, -22] }),
  );
  return b.ball(h * 0.1, [x + h * 0.03, h * 0.93, z], { color: c }).ball(h * 0.05, [x + h * 0.06, h * 0.86, z + h * 0.04], { color: 'brown' });
}

/* buildings: real-size walls facing +z, framed windows, doors that swing on their hinges */

/** A framed window on a wall whose face is at z (facing +z): frame, recessed glass, a sill, optional glazing bars. */
function win(b: M, x: number, y: number, z: number, w: number, h: number, frame = 'white', o: { bars?: boolean; parent?: string; glass?: string } = {}): M {
  const p = o.parent ? { parent: o.parent } : {};
  b.box([w + 0.16, h + 0.16, 0.08], [x, y, z + 0.01], { color: frame, round: 0.1, edge: 'sharp', ...p })
    .box([w, h, 0.04], [x, y, z + 0.035], { color: o.glass ?? 'glass', round: 0.05, edge: 'sharp', ...p })
    .box([w + 0.26, 0.07, 0.18], [x, y - h / 2 - 0.1, z + 0.07], { color: frame, round: 0.2, edge: 'sharp', ...p });
  if (o.bars) b.box([0.05, h, 0.03], [x, y, z + 0.06], { color: frame, round: 0.2, edge: 'sharp', ...p }).box([w, 0.05, 0.03], [x, y + h * 0.08, z + 0.06], { color: frame, round: 0.2, edge: 'sharp', ...p });
  return b;
}

/** A door in a wall whose face is at z: a frame and a leaf hinged on its -x edge that swings out toward +z
 *  ('door' mover), with a handle at 1 m. */
function door(b: M, x: number, z: number, o: { w?: number; h?: number; color?: string; frame?: string; name?: string; glass?: boolean; y?: number; right?: boolean; noFrame?: boolean } = {}): M {
  const w = o.w ?? 0.95, h = o.h ?? 2.1, y0 = o.y ?? 0, nm = o.name ?? 'door', k = o.right ? -1 : 1;
  if (!o.noFrame) b.box([w + 0.2, h + 0.1, 0.1], [x, y0 + (h + 0.1) / 2, z + 0.01], { color: o.frame ?? 'white', round: 0.1, edge: 'sharp' });
  b.box([w, h, 0.06], [x, y0 + h / 2, z + 0.08], { color: o.color ?? 'darkwood', round: 0.1, edge: 'sharp', name: nm, pivot: [x - (k * w) / 2, y0 + h / 2, z + 0.08], mover: { kind: 'swing', axis: 'y', amount: -100 * k } });
  if (o.glass) b.box([w * 0.62, h * 0.45, 0.02], [x, y0 + h * 0.66, z + 0.115], { color: 'glass', round: 0.1, edge: 'sharp', parent: nm });
  else b.box([w * 0.66, h * 0.32, 0.02], [x, y0 + h * 0.7, z + 0.115], { color: o.color ?? 'darkwood', round: 0.2, edge: 'sharp', parent: nm }).box([w * 0.66, h * 0.32, 0.02], [x, y0 + h * 0.28, z + 0.115], { color: o.color ?? 'darkwood', round: 0.2, edge: 'sharp', parent: nm });
  return b.ball([0.07, 0.07, 0.07], [x + k * (w / 2 - 0.12), y0 + 1.0, z + 0.14], { color: 'brass', parent: nm });
}

/** A gable roof over a w x d box whose eaves are at y: the ridge runs along z (o.alongX: along x). */
function gable(b: M, w: number, d: number, y: number, h: number, color: string, o: { alongX?: boolean; x?: number; z?: number; over?: number } = {}): M {
  const ov = o.over ?? 0.35, x = o.x ?? 0, z = o.z ?? 0;
  return o.alongX
    ? b.wedge([d + ov * 2, h, w + ov * 2], [x, y + h / 2, z], { color, rot: [0, 90, 0], edge: 'sharp' })
    : b.wedge([w + ov * 2, h, d + ov * 2], [x, y + h / 2, z], { color, edge: 'sharp' });
}

/* people and statues */

/**
 * A life-size display head (a barber's mannequin) on a turned stand: the head is 22 cm tall, its centre at y 0.265,
 * its face at z ~0.09. Everything above the stand hangs off 'bust', so the head can turn on the stand.
 */
function mannequin(key: string, o: { skin?: string; hair?: string; top?: string; cap?: boolean; brows?: boolean; ears?: boolean } = {}, add?: (b: M, hc: string, sk: string) => void): M {
  const sk = o.skin ?? 'skin2', hc = o.hair ?? 'darkbrown';
  const b = m(key)
    .cyl([0.16, 0.025, 0.16], [0, 0.0125, 0], { color: 'darkwood', edge: 'sharp', round: 0.4 })
    .cyl([0.05, 0.03, 0.05], [0, 0.04, 0], { color: 'brass' })
    .ball([0.3, 0.1, 0.17], [0, 0.095, 0], { color: o.top ?? 'teal', name: 'bust' })
    .cyl([0.095, 0.1, 0.095], [0, 0.155, 0], { color: sk, parent: 'bust' })
    .ball([0.155, 0.215, 0.19], [0, 0.265, 0], { color: sk, parent: 'bust', name: 'head' })
    .ball([0.1, 0.06, 0.09], [0, 0.19, 0.035], { color: sk, parent: 'head' })
    .ball([0.028, 0.045, 0.04], [0, 0.257, 0.093], { color: sk, parent: 'head' })
    .capsule([0.008, 0.038, 0.008], [0, 0.214, 0.084], { color: '#b8605a', rot: [0, 0, 90], parent: 'head', noInk: true });
  b.pair((s) => {
    b.ball([0.026, 0.02, 0.012], [s * 0.033, 0.282, 0.082], { color: '#2b2118', eye: true, noInk: true, parent: 'head', name: `eye${s > 0 ? 'L' : 'R'}` });
    if (o.brows !== false) b.box([0.04, 0.009, 0.012], [s * 0.034, 0.302, 0.083], { color: hc, rot: [0, 0, s * -6], parent: 'head', noInk: true, name: `brow${s > 0 ? 'L' : 'R'}` });
    if (o.ears !== false) b.ball([0.022, 0.058, 0.038], [s * 0.078, 0.262, -0.004], { color: sk, parent: 'head', name: `ear${s > 0 ? 'L' : 'R'}` });
  });
  if (o.cap !== false) b.ball([0.165, 0.12, 0.2], [0, 0.322, -0.008], { color: hc, parent: 'head', name: 'hair' }).ball([0.162, 0.17, 0.12], [0, 0.272, -0.048], { color: hc, parent: 'hair' });
  add?.(b, hc, sk);
  return b;
}

/** The zodiac plinth: a navy drum with a gold rim, the sign's name on the front, two little stars. */
function zb(b: M, name: string): M {
  return b
    .cyl([0.9, 0.12, 0.9], [0, 0.06, 0], { color: 'navy', edge: 'sharp', round: 0.3 })
    .torus([0.9, 0.9, 0.04], [0, 0.12, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.06 })
    .label(name, [0.42, 0.08], [0, 0.06, 0.45], { color: 'gold' })
    .star(0.12, [-0.33, 0.18, -0.22], { color: 'gold' })
    .star(0.1, [0.34, 0.17, -0.2], { color: 'gold' });
}

/**
 * A planetarium star board: a night-sky panel on a pedestal, tilted back a little, its stars glowing (light movers
 * named star0.., or the names given) joined by faint lines. Star positions are on the board, x -0.6..0.6, y -0.42..0.42.
 */
function starBoard(key: string, pts: Array<[number, number]>, links: Array<[number, number]>, o: { big?: number[]; names?: Record<number, string> } = {}): M {
  const cy = 1.42, tilt = -10;
  const t = tilt * D2R;
  const P = (x: number, y: number, dz: number): Vec3 => [x, cy + y * Math.cos(t) - (0.03 + dz) * Math.sin(t), -0.03 + y * Math.sin(t) + (0.03 + dz) * Math.cos(t)];
  const b = m(key, { edge: 'sharp' })
    .cyl([0.6, 0.06, 0.6], [0, 0.03, 0], { color: 'darkgray', round: 0.4 })
    .cyl([0.08, 0.92, 0.08], [0, 0.5, -0.04], { color: 'steel', edge: 'soft' })
    .box([1.4, 1.0, 0.06], [0, cy, -0.03], { color: '#0f1a3a', round: 0.08, rot: [tilt, 0, 0], name: 'board' })
    .box([1.48, 1.08, 0.04], [0, cy, -0.06], { color: 'brass', round: 0.1, rot: [tilt, 0, 0], parent: 'board' });
  for (const [i, j] of links) b.stick(P(pts[i][0], pts[i][1], 0.004), P(pts[j][0], pts[j][1], 0.004), 0.012, '#7f93c8', { noInk: true, parent: 'board' });
  pts.forEach(([x, y], i) => {
    const big = o.big?.includes(i), s = big ? 0.08 : 0.055, nm = o.names?.[i] ?? `star${i}`, c = P(x, y, 0.02);
    b.ball([s, s, s * 0.6], c, { color: big ? '#fff6c0' : '#ffe27a', glow: true, parent: 'board', name: nm, mover: { kind: 'light', on: true } });
    for (const r of [0, 90]) b.box([s * (big ? 2.6 : 2.0), s * 0.18, 0.006], c, { color: '#fff6c0', glow: true, rot: [tilt, 0, r + 45], parent: nm, noInk: true });
  });
  return b;
}

/**
 * People in a group: who() figures merged into one, each with its own part names (tag + part), standing at
 * [x, z] and turned by yaw degrees. The group is one thing, so an act moves the members' arms by name with pose
 * steps (`${tag}armR`, `${tag}foreR`, `${tag}head`...).
 */
function troupe(key: string, list: Array<{ f: Figure; at: [number, number]; yaw?: number; tag: string; y?: number }>, add?: (b: M) => M): Figure {
  const parts: FigPart[] = [];
  for (const { f, at, yaw = 0, tag, y: dy = 0 } of list) {
    const c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R);
    for (const p of f.parts) {
      const q: FigPart = { ...p, name: tag + p.name, parent: p.parent ? tag + p.parent : undefined };
      if (!p.parent) {
        const [x, y, z] = p.at;
        q.at = [at[0] + x * c + z * s, y + dy, at[1] - x * s + z * c];
        q.rot = [p.rot?.[0] ?? 0, (p.rot?.[1] ?? 0) + yaw, p.rot?.[2] ?? 0];
      }
      parts.push(q);
    }
  }
  const extra = add ? add(m(key)).parts.list : [];
  return measure({ key, view: 'front', rig: 'prop', group: 'people', parts: [...parts, ...extra], face: list[0].f.face });
}

/** Planetarium stand: a round foot, a brass column and a half ring; the globe (d across, centre at y) is 'globe'. */
function orb(key: string, d: number, y: number, color: string, o: { tilt?: number; spin?: number } = {}): M {
  const r = d / 2;
  return m(key)
    .cyl([1.3, 0.12, 1.3], [0, 0.06, 0], { color: '#2a2a3a', edge: 'sharp', round: 0.5 })
    .cyl([0.5, 0.1, 0.5], [0, 0.17, 0], { color: 'brass', edge: 'sharp', round: 0.5 })
    .cyl([0.12, y - r - 0.1, 0.12], [0, 0.22 + (y - r - 0.22) / 2, 0], { color: 'brass' })
    .arc([d + 0.3, d + 0.3, 0.06], [0, y, 0], { color: 'brass', arc: 180, tube: 0.04, rot: [-90, 90, 0], edge: 'sharp' })
    .ball(d, [0, y, 0], { color, name: 'globe', rot: [0, 0, o.tilt ?? 0], mover: { kind: 'spin', axis: 'y', amount: o.spin ?? 40, on: true } });
}

/**
 * Make a tilted part spin in its own plane: its turn (o.rot) becomes the joint's rest turn, so a spin about the
 * joint's z (a ring's axis) turns it within its plane instead of wobbling. Only for parts nothing hangs off.
 */
function spinInPlane(fig: Figure, names: string[]): Figure {
  return {
    ...fig,
    parts: fig.parts.map((p) => {
      if (!names.includes(p.name)) return p;
      if (fig.parts.some((q) => q.parent === p.name)) throw new Error(`${fig.key}: ${p.name} has parts hanging off it`);
      return { ...p, rot: p.srot, srot: undefined };
    }),
  };
}

/** A long gown from the waist to the ankles (over who()'s skirt). */
const gown = (color: string): Extra => (p, d) => {
  p.add({ name: 'gown', parent: 'hips', at: [0, 0, 0], shape: 'cyl', taper: 0.55, size: [d.tw * 1.9, d.legLen * 0.98, d.td * 2.1], off: [0, -d.legLen * 0.47, 0], color: col(color), layer: 2 });
};

/** A ghillie suit: tufts of leaves and twigs all over a soldier (camouflage). */
const ghillie: Extra = (p, d) => {
  const greens = ['#4f6b2e', '#6b7a3a', '#3f5a2a', '#7a6a40'].map((c) => col(c));
  const tufts: Array<[string, Vec3, number]> = [
    ['head', [0, d.headY + d.headH * 0.55, 0], 1.2], ['head', [d.headW * 0.45, d.headY + d.headH * 0.3, -d.headD * 0.1], 0.8], ['head', [-d.headW * 0.45, d.headY + d.headH * 0.35, 0], 0.8],
    ['torso', [d.tw * 0.45, d.torsoH * 0.95, 0], 1], ['torso', [-d.tw * 0.45, d.torsoH * 0.95, 0], 1], ['torso', [0, d.torsoH * 0.55, d.td * 0.45], 0.9],
    ['torso', [d.tw * 0.25, d.torsoH * 0.25, d.td * 0.45], 0.8], ['torso', [-d.tw * 0.3, d.torsoH * 0.4, -d.td * 0.45], 0.9], ['legL', [0, -d.legLen * 0.25, d.lw * 0.4], 0.7],
    ['legR', [0, -d.legLen * 0.3, d.lw * 0.4], 0.7], ['armL', [0, -d.upper * 0.4, 0], 0.6], ['armR', [0, -d.upper * 0.4, 0], 0.6],
  ];
  tufts.forEach(([parent, at, k], i) => p.add({ name: `tuft${i}`, parent, at, shape: 'ball', size: [d.tw * 0.45 * k, d.tw * 0.32 * k, d.tw * 0.4 * k], color: greens[i % 4], layer: 6 }));
};

/** Where a point c ends up when turned deg degrees about the x axis through p (a lid built already open). */
function aboutX(c: Vec3, p: Vec3, deg: number): Vec3 {
  const r = deg * D2R, y = c[1] - p[1], z = c[2] - p[2];
  return [c[0], p[1] + y * Math.cos(r) - z * Math.sin(r), p[2] + y * Math.sin(r) + z * Math.cos(r)];
}

/** Rods through a list of points (a smooth stroke). */
function path(b: M, pts: Vec3[], t: number, color: string, o: O = {}): M {
  for (let i = 0; i + 1 < pts.length; i++) b.rod(pts[i], pts[i + 1], t, color, o);
  return b;
}

/** Points on an ellipse in the x-y plane, angles in degrees from +x counterclockwise. */
function ell(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, z = 0): Vec3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z] as Vec3;
  });
}

/** A chunky 3D numeral (0-9) h tall drawn with round strokes, its baseline at y0, centred on x. */
function numeral(b: M, ch: string, x: number, y0: number, h: number, color: string, o: O = {}, z = 0): M {
  const t = h * 0.15, P = (px: number, py: number): Vec3 => [x + px * h, y0 + t / 2 + py * (h - t), z];
  const E = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 12) => ell(0, 0, rx, ry, a0, a1, n).map(([px, py]) => P(cx + px, cy + py));
  const S = (pts: Vec3[]) => path(b, pts, t, color, o);
  switch (ch) {
    case '0': return S(E(0, 0.5, 0.27, 0.5, 0, 360, 16));
    case '1': return S([P(-0.14, 0.78), P(0.05, 1), P(0.05, 0)]), S([P(-0.2, 0), P(0.26, 0)]);
    case '2': return S([...E(0, 0.73, 0.25, 0.27, 165, -20, 9), P(-0.26, 0), P(0.28, 0)]);
    case '3': return S(E(-0.01, 0.75, 0.22, 0.25, 155, -90, 9)), S(E(0, 0.26, 0.26, 0.26, 90, -150, 10));
    case '4': return S([P(0.14, 0), P(0.14, 1), P(-0.28, 0.32), P(0.3, 0.32)]);
    case '5': return S([P(0.25, 1), P(-0.18, 1), P(-0.21, 0.56)]), S(E(0, 0.3, 0.27, 0.3, 135, -150, 11));
    case '6': return S(E(0, 0.28, 0.26, 0.28, 0, 360, 14)), S([P(-0.26, 0.3), P(-0.23, 0.58), P(-0.12, 0.83), P(0.04, 0.97), P(0.2, 1)]);
    case '7': return S([P(-0.27, 1), P(0.28, 1), P(-0.04, 0)]);
    case '8': return S(E(0, 0.75, 0.2, 0.25, 0, 360, 12)), S(E(0, 0.26, 0.26, 0.26, 0, 360, 14));
    case '9': return S(E(0, 0.72, 0.26, 0.28, 0, 360, 14)), S([P(0.26, 0.7), P(0.23, 0.42), P(0.12, 0.17), P(-0.04, 0.03), P(-0.2, 0)]);
    default: return b;
  }
}

/**
 * A number to count with: the numeral (1 m) standing on a low wooden plinth, and n coloured balls in a row in
 * front that hop one by one as it counts.
 */
function counter(key: string, text: string, n: number, color: string, bead: string, words: string[]): M {
  const h = 1.0, w = text.length > 1 ? 1.4 : 0.9, rowW = Math.max(n * 0.13, 0.5);
  const b = m(key).box([Math.max(w, rowW) + 0.2, 0.1, 0.6], [0, 0.05, 0], { color: 'wood', edge: 'sharp', round: 0.3 });
  [...text].forEach((c, i) => numeral(b, c, text.length > 1 ? (i - 0.5) * 0.66 : 0, 0.1, h, color));
  for (let i = 0; i < n; i++) b.ball(0.1, [(i - (n - 1) / 2) * 0.13, 0.15, 0.2], { color: bead, name: `bead${i}` });
  const steps = Array.from({ length: n }, (_, i) => [A.par(A.pose(`bead${i}`, { move: [0, 0.14, 0], dur: 0.15 }), A.say(words[i] ?? `${i + 1}`, 0.6)), A.pose(`bead${i}`, { move: [0, 0, 0], dur: 0.15 })]).flat();
  return n ? b.act({ click: [steps] }) : b;
}
const COUNT = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Pose steps that raise both arms of the given troupe members (tags), or put them back with up = false. */
const armsUp = (tags: string[], up = true, dur = 0.4) => tags.flatMap((t) => [A.pose(`${t}armR`, { rot: up ? [0, 0, -150] : [0, 0, 0], dur }), A.pose(`${t}armL`, { rot: up ? [0, 0, 150] : [0, 0, 0], dur })]);
/** Pose steps that wave each member's right hand (raised) or lower it. */
const handUp = (tags: string[], up = true, dur = 0.35) => tags.flatMap((t) => [A.pose(`${t}armR`, { rot: up ? [-10, 0, -140] : [0, 0, 0], dur }), A.pose(`${t}foreR`, { rot: up ? [0, 0, 25] : [0, 0, 0], dur })]);

/** A snowflake s across in the x-y plane. */
function flake(b: M, x: number, y: number, z: number, s: number, c = 'white', o: O = {}): M {
  for (const a of [0, 60, 120]) seg(b, [x - (Math.cos(a * D2R) * s) / 2, y - (Math.sin(a * D2R) * s) / 2, z], [x + (Math.cos(a * D2R) * s) / 2, y + (Math.sin(a * D2R) * s) / 2, z], s * 0.13, s * 0.1, c, o);
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
  // A weather scene (3.5 m): a sickly cloud rains acid on a dead tree, a pitted stone head and a fizzing puddle.
  e('acid rain', 'nature', 'weather', () => {
    const b = m('acid rain')
      .cyl([4.4, 0.1, 3.4], [0, 0.05, 0], { color: '#9a9466' })
      .cyl([1.7, 0.04, 1.1], [0.7, 0.11, 0.7], { color: '#a6e03a', name: 'puddle' })
      .ball([0.5, 0.14, 0.4], [-0.2, 0.1, 1.1], { color: '#7a7a58' });
    b.cyl([0.3, 2.2, 0.3], [-1.3, 1.1, -0.5], { color: '#6a5a4a', taper: 0.55 })
      .rod([-1.3, 1.5, -0.5], [-1.9, 2.3, -0.4], 0.1, '#6a5a4a')
      .rod([-1.3, 1.9, -0.5], [-0.8, 2.55, -0.6], 0.08, '#6a5a4a')
      .rod([-1.9, 2.3, -0.4], [-2.1, 2.7, -0.3], 0.05, '#6a5a4a')
      .rod([-1.3, 2.15, -0.5], [-1.4, 2.8, -0.5], 0.06, '#6a5a4a');
    b.box([0.5, 0.6, 0.5], [1.4, 0.3, -0.7], { color: 'stone', edge: 'sharp', round: 0.1 }).ball([0.42, 0.5, 0.42], [1.4, 0.85, -0.7], { color: '#b7b29a' });
    for (const [x, y, z] of [[1.55, 0.95, -0.52], [1.3, 0.78, -0.51], [1.48, 0.7, -0.52]]) b.ball(0.08, [x, y, z], { color: '#7c7a60', noInk: true });
    for (const [x, z] of [[0.4, 0.6], [0.9, 0.8], [0.7, 0.5]]) b.ball(0.07, [x, 0.14, z], { color: '#d9f27a', noInk: true });
    cloud(b, 0, 2.95, -0.1, 2.8, '#8f9a62', { name: 'cloud' });
    for (const [x, y, z] of [[-0.8, 2.6, 0.3], [0.1, 2.2, 0.4], [0.8, 2.7, 0.2], [-0.3, 1.6, 0.5], [0.5, 1.3, 0.6], [-1.0, 1.1, 0.5]]) drop(b, x, y, z, 0.13, 'lime', { parent: 'cloud' });
    return b
      .act({
        click: [
          [A.par(A.effect('rain', { dur: 3 }), A.say('Hsssss...', 2)), A.effect('steam', { dur: 2 })],
          [A.pose('cloud', { move: [0.8, 0, 0], dur: 1.5 }), A.par(A.effect('rain', { dur: 2 }), A.effect('smoke', { dur: 1.5 })), A.pose('cloud', { move: [0, 0, 0], dur: 1.5 })],
        ],
      })
      .done();
  }),
  // A life-size barber's display head wearing an afro wig with a pick in it; the wig can come off.
  e('afro', 'wardrobe', 'hairstyles', () =>
    mannequin('afro', { skin: 'skin4', hair: '#2a1d16', top: 'orange', cap: false }, (b, hc) => {
      b.ball([0.34, 0.3, 0.3], [0, 0.385, -0.07], { color: hc, parent: 'head', name: 'afro', piece: true, edge: 'soft' })
        .box([0.035, 0.1, 0.012], [0.11, 0.5, 0.02], { color: 'red', rot: [0, 0, -25], parent: 'afro', edge: 'sharp' })
        .ball([0.045, 0.04, 0.022], [0.135, 0.55, 0.02], { color: 'red', parent: 'afro' });
    })
      .act({
        click: [
          [A.pose('afro', { scale: 1.12, dur: 0.25 }), A.pose('afro', { scale: 1, dur: 0.3 }), A.say('Boing!', 1.2)],
          [A.detach('afro', 'wig'), A.say('Whoops!', 1.2)],
          [A.reattach('afro'), A.say('Pat pat.', 1.2)],
        ],
      })
      .done(),
  ),
  // A teaching model of an amoeba on a glass slide: a jelly blob with feet (pseudopods) that reach out, a nucleus,
  // and it splits in two.
  e('amoeba', 'clinic', 'germs', () => {
    const c = '#9fd89a';
    const b = m('amoeba')
      .box([0.44, 0.012, 0.2], [0, 0.006, 0], { color: 'glass', edge: 'sharp', round: 0.3 })
      .ball([0.2, 0.06, 0.15], [0, 0.04, 0], { color: c, name: 'body' });
    ([[0.12, 0.03, 20], [-0.12, 0.02, 200], [0.03, -0.07, 290], [-0.05, 0.07, 110], [0.1, -0.05, 330]] as const).forEach(([x, z, a], i) =>
      b.ball([0.1, 0.04, 0.055], [x, 0.03, z], { color: c, rot: [0, -a, 0], parent: 'body', name: `pod${i}` }),
    );
    return b
      .ball([0.055, 0.04, 0.05], [0.015, 0.06, 0.01], { color: '#4f8a3a', parent: 'body' })
      .ball([0.03, 0.025, 0.03], [-0.055, 0.06, 0.02], { color: '#e8f8d8', parent: 'body' })
      .ball(0.018, [0.06, 0.058, -0.03], { color: '#b08a4a', parent: 'body' })
      .ball(0.014, [-0.02, 0.06, -0.045], { color: '#b08a4a', parent: 'body' })
      .act({
        click: [
          [A.par(A.pose('pod0', { move: [0.04, 0, 0.01], dur: 0.6 }), A.pose('pod2', { move: [0.01, 0, -0.03], dur: 0.6 }), A.say('Blorp!', 1.2)), A.par(A.pose('pod0', { move: [0, 0, 0], dur: 0.6 }), A.pose('pod2', { move: [0, 0, 0], dur: 0.6 }))],
          [A.anim('wobble'), A.par(A.spawn('twin', 'amoeba', { rel: 'right', of: 'self', dist: 'close' }), A.say('Blorp blorp!', 1.5)), A.wait(2), A.remove('twin', 'fade')],
        ],
      })
      .done();
  }),
  // The & sign as a chunky purple glyph (30 cm) on a wooden plinth.
  e('ampersand', 'ideas', 'symbols', () => {
    const b = m('ampersand').box([0.3, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood', edge: 'sharp', round: 0.3 });
    const c = 'purple', t = 0.042, g = (x: number, y: number): Vec3 => [x, 0.04 + y, 0];
    arc(b, g(-0.012, 0.262), 0.045, -90, 270, 10, t, c);
    arc(b, g(0.0, 0.115), 0.078, 120, 380, 10, t, c);
    return b
      .rod(g(-0.05, 0.24), g(-0.039, 0.183), t, c)
      .rod(g(0.022, 0.228), g(0.112, 0.022), t, c)
      .rod(g(0.073, 0.142), g(0.118, 0.158), t, c)
      .act({ click: [[A.par(A.anim('hop'), A.say('This & that!', 1.5))], [A.anim('spin')]] })
      .done();
  }),
  // Cartoon angry eyes on a little stand: the brows slam down and the pupils glare from side to side.
  e('angry eyes', 'ideas', 'emotions', () => {
    const b = m('angry eyes').cyl([0.16, 0.025, 0.12], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp' }).stick([0, 0.025, 0], [0, 0.18, 0], 0.025, 'darkgray');
    b.pair((s) => {
      const n = s > 0 ? 'L' : 'R';
      b.ball([0.11, 0.12, 0.07], [s * 0.058, 0.25, 0], { color: 'white' })
        .ball([0.045, 0.048, 0.02], [s * 0.05, 0.238, 0.035], { color: '#2a2726', eye: true, noInk: true, name: `pupil${n}` })
        .box([0.12, 0.03, 0.04], [s * 0.06, 0.322, 0.02], { color: '#2a2726', rot: [0, 0, s * 25], name: `brow${n}`, edge: 'sharp', round: 0.5 });
    });
    return b
      .act({
        click: [
          [A.par(A.pose('browL', { rot: [0, 0, 12], dur: 0.2 }), A.pose('browR', { rot: [0, 0, -12], dur: 0.2 }), A.anim('shake'), A.say('Grrr!', 1.5)), A.wait(0.8), A.par(A.pose('browL', { rot: [0, 0, 0] }), A.pose('browR', { rot: [0, 0, 0] }))],
          [A.par(A.pose('pupilL', { move: [-0.02, 0, 0], dur: 0.2 }), A.pose('pupilR', { move: [-0.02, 0, 0], dur: 0.2 })), A.wait(0.5), A.par(A.pose('pupilL', { move: [0.02, 0, 0], dur: 0.3 }), A.pose('pupilR', { move: [0.02, 0, 0], dur: 0.3 })), A.wait(0.5), A.par(A.pose('pupilL', { move: [0, 0, 0] }), A.pose('pupilR', { move: [0, 0, 0] }), A.say('Hmph!', 1.2))],
        ],
      })
      .done();
  }),
  // Any animal: a generic brown mammal the size of a deer, ears up, sniffing the air.
  e('animal', 'wild', 'animals', () =>
    withAct(
      beast('animal', { color: '#a0703a', body: [1.05, 0.46, 0.4], legL: 0.48, legW: 0.1, hoof: '#3a2a20', neckL: 0.28, neckLean: 30, head: [0.3, 0.25, 0.22], snout: { len: 0.13, h: 0.12, w: 0.12, color: '#e0c49a' }, ears: 'pointy', earSize: 0.13, tail: 'long', tailAngle: 140, belly: '#e8cfa5' }),
      { click: [[A.par(A.anim('look_around'), A.say('Sniff sniff?', 1.5))], [A.par(A.anim('hop'), A.say('!', 1)), A.anim('wag', 2)]] },
    ),
  ),
  // The water bearer: a statue of a person on the zodiac plinth tipping an urn of water into a basin.
  e('aquarius (stars)', 'sky', 'zodiac', () =>
    withAct(
      lift(who('aquarius (stars)', { h: 1.15, skin: 'skin3', hair: '#2a1d16', style: 'long', top: '#5a8fd0', bottom: '#5a8fd0', skirt: '#5a8fd0', shoes: 'tan', acc: [wear('toga', 'white'), hat('headband', 'gold')], pose: 'hold' }), 0.12, (b) =>
        zb(b, 'AQUARIUS')
          .ball([0.2, 0.22, 0.2], [0, 0.84, 0.3], { color: '#d98a4a', name: 'urn', pivot: [0, 0.74, 0.3], edge: 'soft' })
          .cyl([0.1, 0.1, 0.1], [0, 0.98, 0.3], { color: '#d98a4a', parent: 'urn' })
          .torus([0.13, 0.13, 0.03], [0, 1.03, 0.3], { color: 'gold', rot: [90, 0, 0], parent: 'urn' })
          .rod([0, 1.0, 0.38], [0, 0.62, 0.42], 0.05, 'skyblue', { noInk: true })
          .rod([0, 0.62, 0.42], [0, 0.22, 0.38], 0.045, 'skyblue', { noInk: true })
          .cyl([0.36, 0.08, 0.3], [0, 0.16, 0.3], { color: 'stone', edge: 'sharp', round: 0.4 })
          .cyl([0.3, 0.02, 0.24], [0, 0.2, 0.3], { color: 'water' }),
      ),
      { click: [[A.pose('urn', { rot: [40, 0, 0], dur: 0.5 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Splash!', 1.2)), A.wait(1), A.pose('urn', { rot: [0, 0, 0], dur: 0.5 })]] },
    ),
  ),
  // The ram on the zodiac plinth: lowers its curly horns and butts.
  e('aries (stars)', 'sky', 'zodiac', () =>
    withAct(
      lift(
        beast('aries (stars)', { color: 'wool', body: [0.6, 0.42, 0.4], bodyShape: 'ball', legL: 0.22, legW: 0.08, hoof: 'darkbrown', neckL: 0.1, neckLean: 40, head: [0.24, 0.2, 0.19], headColor: '#e8dcc0', snout: { len: 0.09, h: 0.1, w: 0.11, color: '#e8dcc0' }, ears: 'side', earSize: 0.1, tail: 'stub', acc: [ani.horns('gold', 'ram')] }),
        0.12,
        (b) => zb(b, 'ARIES'),
      ),
      { click: [[A.par(A.pose('neck', { rot: [30, 0, 0], dur: 0.4 }), A.say('Baa!', 1.2)), A.par(A.anim('hop'), A.effect('dust', { dur: 1 })), A.pose('neck', { rot: [0, 0, 0], dur: 0.4 })]] },
    ),
  ),
  // A studio easel (1.8 m) with a painting under a velvet cloth (it comes off: the unveiling), and a stool with a
  // palette and brushes.
  e('art', 'ideas', 'arts', () => {
    const b = m('art');
    const cy = 1.1, tz = 0.11, k = Math.sin(6 * D2R);
    const F = (x: number, y: number, dz: number): Vec3 => [x, cy + y, tz - y * k + dz];
    b.pair((s) => b.rod([s * 0.38, 0.0, 0.24], [s * 0.07, 1.8, 0.0], 0.045, 'wood'));
    b.rod([0, 0, -0.6], [0, 1.66, -0.05], 0.045, 'wood').box([0.9, 0.05, 0.14], [0, 0.79, 0.15], { color: 'wood', edge: 'sharp' }).box([0.12, 0.07, 0.08], [0, 1.43, 0.08], { color: 'darkwood', edge: 'sharp' });
    b.box([0.74, 0.58, 0.035], [0, cy, tz], { color: 'white', rot: [-6, 0, 0], name: 'canvas', edge: 'sharp', round: 0.1 })
      .box([0.7, 0.32, 0.006], F(0, 0.12, 0.02), { color: 'skyblue', rot: [-6, 0, 0], parent: 'canvas', noInk: true })
      .ball([0.7, 0.24, 0.01], F(0.0, -0.16, 0.022), { color: 'green', rot: [-6, 0, 0], parent: 'canvas', noInk: true })
      .ball([0.1, 0.1, 0.01], F(-0.2, 0.17, 0.024), { color: 'yellow', parent: 'canvas', noInk: true })
      .ball([0.12, 0.12, 0.01], F(0.18, 0.0, 0.024), { color: 'darkgreen', parent: 'canvas', noInk: true })
      .box([0.02, 0.1, 0.006], F(0.18, -0.08, 0.023), { color: 'bark', parent: 'canvas', noInk: true });
    b.box([0.8, 0.66, 0.03], F(0, 0, 0.04), { color: '#8a1f2e', rot: [-6, 0, 0], name: 'cloth', parent: 'canvas', piece: true, edge: 'soft' })
      .capsule([0.06, 0.82, 0.06], F(0, 0.33, 0.05), { color: '#8a1f2e', rot: [0, 0, 90], parent: 'cloth' })
      .capsule([0.04, 0.6, 0.04], F(-0.2, 0.0, 0.06), { color: '#7a1a28', parent: 'cloth' })
      .capsule([0.04, 0.6, 0.04], F(0.22, 0.0, 0.06), { color: '#7a1a28', parent: 'cloth' })
      .ball([0.05, 0.05, 0.03], F(0.25, 0.35, 0.06), { color: 'gold', parent: 'cloth' });
    // the stool, palette and brushes
    b.cyl([0.36, 0.05, 0.36], [0.8, 0.62, 0.25], { color: 'wood', edge: 'sharp', round: 0.4 });
    for (const a of [90, 210, 330]) b.rod([0.8 + Math.cos(a * D2R) * 0.12, 0.6, 0.25 + Math.sin(a * D2R) * 0.12], [0.8 + Math.cos(a * D2R) * 0.2, 0, 0.25 + Math.sin(a * D2R) * 0.2], 0.03, 'wood');
    b.ball([0.3, 0.02, 0.22], [0.78, 0.655, 0.25], { color: 'lightwood' });
    for (const [x, z, c] of [[0.7, 0.2, 'red'], [0.76, 0.17, 'yellow'], [0.84, 0.19, 'blue'], [0.88, 0.26, 'white'], [0.7, 0.3, 'green']] as const) b.ball([0.035, 0.015, 0.035], [x, 0.67, z], { color: c, noInk: true });
    b.cyl([0.08, 0.12, 0.08], [0.9, 0.705, 0.33], { color: 'glass' });
    for (const dx of [-0.015, 0.01, 0.025]) b.rod([0.9 + dx, 0.67, 0.33], [0.9 + dx * 3, 0.88, 0.33 + dx], 0.012, 'darkwood');
    return b
      .act({ click: [[A.detach('cloth', 'cloth'), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ta-da!', 1.5))], [A.reattach('cloth'), A.say('Shh... not yet.', 1.2)]] })
      .done();
  }),
  // Northern lights over a snowy forest (10 m): glowing curtains of green and violet that ripple and flicker, and a
  // log cabin with a lit window.
  e('aurora borealis', 'sky', 'sky lights', () => {
    const b = m('aurora borealis').cyl([13, 0.15, 8], [0, 0.075, 0], { color: 'snow' });
    for (const [x, z, w, h] of [[-3, 1.5, 3, 0.6], [3.5, 2.2, 2.4, 0.5], [0, -2.5, 5, 0.8]]) b.dome([w, h, w * 0.7], [x, h / 2 + 0.1, z], { color: 'snow' });
    for (const [x, z, h] of [[4.4, -1.6, 5.5], [-4.2, -1.0, 4.6], [2.8, 1.8, 3.4], [-5.0, 2.0, 3.6], [5.5, 0.8, 4.0]] as const) {
      pine(b, x, z, h, '#2f5a3a');
      b.cone([h * 0.3, h * 0.12, h * 0.3], [x, h * 0.6, z], { color: 'snow' }).cone([h * 0.18, h * 0.1, h * 0.18], [x, h * 0.86, z], { color: 'snow' });
    }
    // a log cabin
    b.box([3.6, 2.4, 2.8], [-1.0, 1.2, 0.6], { color: '#8a5a35', edge: 'sharp', round: 0.08 });
    gable(b, 3.6, 2.8, 2.4, 1.4, '#f4f8fb', { x: -1.0, z: 0.6 });
    b.box([0.8, 0.7, 0.06], [-0.3, 1.3, 2.02], { color: '#ffd27a', glow: true, edge: 'sharp' })
      .box([0.9, 1.9, 0.08], [-1.9, 0.95, 2.02], { color: '#5a3a22', edge: 'sharp' })
      .box([0.5, 1.2, 0.5], [-0.2, 3.8, 0.4], { color: 'stone', edge: 'sharp' });
    const cs = ['#5af2a0', '#3fd6c6', '#7af27a', '#b07af2', '#4fe0b0', '#8af2c0'];
    cs.forEach((c, i) => {
      // each curtain is a folded ribbon of three panels, brighter green along its lower edge
      const x0 = -5.6 + i * 2.1, y = 7.0 + (i % 3) * 0.4, z0 = -2.4 + (i % 2) * 0.8, h = 4.2 + (i % 2) * 1.2;
      [0, 1, 2].forEach((j) => {
        const nm = j ? `curtain${i}${'bc'[j - 1]}` : `curtain${i}`;
        b.box([1.0, h, 0.06], [x0 + j * 0.85, y, z0 + (j % 2) * 0.45], { color: c, glow: true, noInk: true, rot: [0, j % 2 ? -40 : 40, 0], round: 0.5, name: nm, mover: { kind: 'light', on: true }, ...(j ? { parent: `curtain${i}` } : {}) });
        b.box([1.0, 0.35, 0.07], [x0 + j * 0.85, y - h / 2 + 0.2, z0 + (j % 2) * 0.45], { color: '#9af27a', glow: true, noInk: true, rot: [0, j % 2 ? -40 : 40, 0], round: 0.5, parent: nm });
      });
    });
    for (const [x, y] of [[-5.5, 10.2], [0.4, 10.6], [4.4, 10.0], [-2.2, 10.4], [2.6, 10.8]]) b.ball(0.18, [x, y, -3.2], { color: 'white', glow: true });
    return b
      .act({
        click: [
          [A.operate('curtain', 'off'), A.wait(0.5), A.operate('curtain', 'on'), A.effect('sparkle', { dur: 1.5 })],
          [A.par(...[0, 1, 2, 3, 4, 5].map((i) => A.pose(`curtain${i}`, { rot: [0, i % 2 ? 25 : -25, 0], dur: 1.2 }))), A.par(...[0, 1, 2, 3, 4, 5].map((i) => A.pose(`curtain${i}`, { rot: [0, 0, 0], dur: 1.2 })))],
        ],
      })
      .done();
  }),
  // A game of backgammon open on a round cafe table: points, checkers on them, two dice that roll.
  e('backgammon', 'toys', 'board games', () => {
    const b = m('backgammon', { edge: 'sharp' });
    b.cyl([0.64, 0.035, 0.64], [0, 0.72, 0], { color: 'darkwood', round: 0.3 }).cyl([0.07, 0.68, 0.07], [0, 0.36, 0], { color: 'iron', edge: 'soft' }).cyl([0.44, 0.04, 0.44], [0, 0.02, 0], { color: 'iron', round: 0.5 });
    const y0 = 0.7375;
    b.box([0.56, 0.035, 0.4], [0, y0 + 0.0175, 0], { color: '#6b3e26', round: 0.15 })
      .box([0.25, 0.006, 0.36], [-0.14, y0 + 0.037, 0], { color: '#e8d9b0', round: 0 })
      .box([0.25, 0.006, 0.36], [0.14, y0 + 0.037, 0], { color: '#e8d9b0', round: 0 })
      .box([0.03, 0.014, 0.4], [0, y0 + 0.042, 0], { color: '#6b3e26' });
    for (const half of [-1, 1])
      for (const row of [-1, 1])
        for (let k = 0; k < 6; k++) {
          const x = half * 0.14 + (k - 2.5) * 0.04;
          b.wedge([0.034, 0.15, 0.003], [x, y0 + 0.041, row * 0.1], { color: (k + (row > 0 ? 1 : 0)) % 2 ? '#a3322a' : '#2a2726', rot: [row > 0 ? -90 : 90, 0, 0], noInk: true });
        }
    for (const [x, z, n, c] of [[-0.24, 0.16, 3, 'white'], [0.04, 0.16, 2, 'black'], [0.2, -0.16, 4, 'black'], [-0.08, -0.16, 2, 'white'], [0.24, 0.16, 2, 'white']] as const)
      for (let i = 0; i < n; i++) b.cyl([0.032, 0.009, 0.032], [x, y0 + 0.045 + i * 0.009, z], { color: c, name: x === 0.04 && i === 1 ? 'checker' : undefined, edge: 'soft' });
    return b
      .box([0.02, 0.02, 0.02], [0.12, y0 + 0.05, 0.03], { color: 'white', round: 0.3, rot: [0, 20, 0], name: 'die1' })
      .box([0.02, 0.02, 0.02], [0.16, y0 + 0.05, -0.02], { color: 'white', round: 0.3, rot: [0, -15, 0], name: 'die2' })
      .box([0.022, 0.022, 0.022], [0, y0 + 0.06, 0.1], { color: 'cream', round: 0.3 })
      .socket('top', [0, 0.79, 0], 'top', { size: 0.4 })
      .act({
        click: [
          [A.par(A.pose('die1', { rot: [720, 360, 90], dur: 0.8 }), A.pose('die2', { rot: [540, 270, 180], dur: 0.8 }), A.say('Clatter clatter!', 1.2)), A.pose('checker', { move: [-0.16, 0, 0.0], dur: 0.5 })],
          [A.par(A.pose('die1', { rot: [0, 0, 0], dur: 0.8 }), A.pose('die2', { rot: [0, 0, 0], dur: 0.8 }), A.say('Clatter!', 1)), A.pose('checker', { move: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A bay at its real size (40 m across): green headlands curving round sheltered water, a sandy beach, a
  // lighthouse on the point and a sailboat that rocks and sails out.
  e('bay', 'nature', 'landforms', () => {
    const b = m('bay').cyl([40, 0.2, 32], [0, 0.1, 0], { color: 'water' });
    b.dome([26, 1.0, 8], [0, 0.6, -12.5], { color: 'sand' });
    for (const [x, z, w, h] of [[-16, -9, 12, 8], [-17, 0, 10, 9], [-14.5, 8.5, 8, 6], [-10.5, 13, 6, 4], [16, -9, 12, 8], [17, 0, 10, 9], [14.5, 8.5, 8, 6.5], [11, 13, 6, 4.5]] as const) {
      b.dome([w * 1.06, h * 0.35, w * 0.96], [x, h * 0.175 + 0.1, z], { color: 'rock' }).dome([w, h, w * 0.9], [x, h / 2 + 0.1, z], { color: h > 7 ? 'darkgreen' : 'grass' });
    }
    // the lighthouse on the right-hand point
    const lx = 13.5, lz = 11.5, ly = 4.2;
    b.cyl([1.8, 7, 1.8], [lx, ly + 3.5, lz], { color: 'white', taper: 0.72, edge: 'sharp' });
    for (const y of [1.5, 4.2]) b.cyl([1.8 - y * 0.075, 1.0, 1.8 - y * 0.075], [lx, ly + y, lz], { color: 'red', taper: 0.95, edge: 'sharp' });
    b.cyl([1.8, 0.2, 1.8], [lx, ly + 7.1, lz], { color: 'darkgray', edge: 'sharp' })
      .ball([0.9, 1.0, 0.9], [lx, ly + 7.7, lz], { color: '#fff3a0', glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
      .cone([1.5, 0.9, 1.5], [lx, ly + 8.65, lz], { color: 'red', edge: 'sharp' });
    for (const a of [0, 90, 180, 270]) b.stick([lx + Math.cos(a * D2R) * 0.6, ly + 7.2, lz + Math.sin(a * D2R) * 0.6], [lx + Math.cos(a * D2R) * 0.6, ly + 8.2, lz + Math.sin(a * D2R) * 0.6], 0.08, 'darkgray');
    // a sailboat in the bay
    b.loft([1.8, 0.9, 5.5], [-2, 0.45, 4], [[0, 0.7, 0.8, 0.1], [0.35, 1, 1, 0], [0.75, 0.9, 1, 0], [1, 0.05, 1, 0.05]], { color: 'white', cut: 'bottom', boxy: 0.2, rot: [0, 90, 0], name: 'boat' })
      .box([4.6, 0.06, 1.5], [-2.1, 0.88, 4], { color: 'lightwood', parent: 'boat', edge: 'sharp' })
      .stick([-1.6, 0.9, 4], [-1.6, 7.4, 4], 0.12, 'silver', { parent: 'boat' })
      .wedge([3.0, 6.0, 0.04], [-2.9, 4.2, 4], { color: 'white', apex: 0.5, parent: 'boat', edge: 'sharp' });
    return b
      .act({
        click: [
          [A.par(A.pose('boat', { move: [-7, 0, 0], dur: 3 }), A.pose('boat', { rot: [0, 0, 6], dur: 1 }), A.effect('water_spray', { dur: 1.5 })), A.pose('boat', { rot: [0, 0, 0], dur: 0.8 })],
          [A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.par(A.pose('boat', { move: [0, 0, 0], dur: 3 }), A.pose('boat', { rot: [0, 0, -5], dur: 1 })), A.pose('boat', { rot: [0, 0, 0], dur: 0.8 })],
        ],
      })
      .done();
  }),
  // Beauty: a pageant queen in a long gown with a sash, a tiara and roses, waving to the crowd.
  e('beauty', 'ideas', 'abstract', () =>
    withAct(who('beauty', { h: 1.72, skin: 'skin2', hair: '#d9a441', style: 'long', top: '#d64fa0', bottom: '#d64fa0', skirt: '#d64fa0', shoes: 'silver', pose: 'wave', acc: [gown('#d64fa0'), hat('tiara', 'silver'), wear('sash', 'white'), held('bouquet', undefined, 'L')] }), {
      click: [
        [A.par(A.anim('wave'), A.say('Thank you, everyone!', 2))],
        [A.par(A.anim('bow'), A.effect('hearts', { dur: 1.5 }), A.say('I am truly honoured.', 2))],
      ],
    }),
  ),
  // The behemoth: a giant horned beast as tall as a house (8 m), with a spiny back.
  e('behemoth', 'fantasy', 'monsters', () =>
    withAct(
      beast('behemoth', { color: '#6b5a4a', body: [9, 4.4, 4.8], bodyShape: 'ball', legL: 2.2, legW: 1.4, hoof: '#3a2a20', hoofH: 0.5, neckL: 1.0, neckLean: 60, neckW: 2.4, head: [3.0, 2.4, 2.6], snout: { len: 1.2, h: 1.4, w: 2.0, color: '#8a7a6a' }, nose: '#2a2020', ears: 'side', earSize: 0.8, tail: 'tuft', belly: '#8a7a6a', acc: [ani.horns('cream', 'bull'), ani.quills('#4a3a2a')] }),
      {
        click: [
          [A.par(A.anim('shake'), A.effect('dust', { dur: 2 }), A.say('ROOOAAAR!', 2))],
          [A.par(A.pose('neck', { rot: [25, 0, 0], dur: 0.6 }), A.say('Snort!', 1.2)), A.effect('smoke', { dur: 1.5 }), A.pose('neck', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      },
    ),
  ),
  // A gym bench press at real size: a padded bench (seat 0.45 m) between rack uprights, a 2.2 m barbell with
  // plates on the hooks that goes up and down for a rep.
  e('bench press', 'sports', 'gym', () => {
    const b = m('bench press', { edge: 'sharp' });
    b.box([0.3, 0.1, 1.2], [0, 0.42, 0.15], { color: '#2a2726', round: 0.4, edge: 'soft' })
      .box([0.08, 0.06, 1.0], [0, 0.34, 0.15], { color: 'steel' })
      .box([0.06, 0.32, 0.06], [0, 0.17, 0.62], { color: 'steel' })
      .box([0.5, 0.05, 0.08], [0, 0.025, 0.64], { color: 'steel' })
      .box([0.06, 0.32, 0.06], [0, 0.17, -0.32], { color: 'steel' });
    b.pair((s) => {
      b.box([0.06, 1.3, 0.06], [s * 0.55, 0.65, -0.56], { color: 'iron' })
        .box([0.08, 0.05, 0.7], [s * 0.55, 0.025, -0.45], { color: 'iron' })
        .box([0.07, 0.12, 0.1], [s * 0.55, 1.06, -0.5], { color: 'red' })
        .box([0.07, 0.07, 0.03], [s * 0.55, 1.13, -0.44], { color: 'red' });
    });
    b.box([1.16, 0.05, 0.06], [0, 0.025, -0.8], { color: 'iron' }).box([1.16, 0.06, 0.06], [0, 1.27, -0.56], { color: 'iron' });
    b.cyl([0.03, 2.2, 0.03], [0, 1.14, -0.48], { color: 'silver', rot: [0, 0, 90], name: 'bar', edge: 'soft' });
    b.pair((s) => {
      b.cyl([0.05, 0.42, 0.05], [s * 0.89, 1.14, -0.48], { color: 'silver', rot: [0, 0, 90], parent: 'bar' })
        .cyl([0.45, 0.05, 0.45], [s * 0.74, 1.14, -0.48], { color: '#2a2726', rot: [0, 0, 90], parent: 'bar', round: 0.3 })
        .cyl([0.45, 0.05, 0.45], [s * 0.8, 1.14, -0.48], { color: '#2a2726', rot: [0, 0, 90], parent: 'bar', round: 0.3 })
        .cyl([0.1, 0.06, 0.1], [s * 0.69, 1.14, -0.48], { color: 'red', rot: [0, 0, 90], parent: 'bar' });
    });
    return b
      .socket('seat', [0, 0.47, 0.35], 'seat')
      .act({
        click: [
          [A.pose('bar', { move: [0, 0.3, 0.1], dur: 0.6 }), A.pose('bar', { move: [0, -0.25, 0.1], dur: 0.8 }), A.par(A.pose('bar', { move: [0, 0.3, 0.1], dur: 0.6 }), A.say('Hup!', 1)), A.par(A.pose('bar', { move: [0, 0, 0], dur: 0.5 }), A.say('Clank! One rep.', 1.5))],
        ],
      })
      .done();
  }),
  // The Big Dipper on a planetarium star board: seven stars, the bowl and the handle; it tips to pour.
  e('big dipper', 'sky', 'constellations', () =>
    starBoard('big dipper', [[0.42, 0.24], [0.45, -0.02], [0.18, -0.08], [0.14, 0.14], [-0.1, 0.18], [-0.3, 0.2], [-0.52, 0.06]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]])
      .act({
        click: [
          [A.par(A.pose('board', { rot: [0, 0, -14], dur: 0.6 }), A.effect('sparkle', { dur: 1.2 })), A.wait(0.8), A.pose('board', { rot: [0, 0, 0], dur: 0.6 })],
          [A.operate('star', 'off'), A.wait(0.4), A.operate('star', 'on')],
        ],
      })
      .done(),
  ),
  // In your birthday suit: a person with nothing on but a barrel and a party hat.
  e('birthday suit', 'ideas', 'sayings', () =>
    withAct(who('birthday suit', { skin: 'skin2', top: 'skin2', bottom: 'skin2', shoes: 'skin2', style: 'short', hair: 'brown', acc: [hat('party'), barrel] }), {
      click: [
        [A.par(A.anim('gasp'), A.expr('surprised'), A.say("Eek! Don't look!", 2)), A.wait(0.5), A.expr('neutral')],
        [A.par(A.anim('laugh'), A.say('Happy birthday to me!', 2))],
      ],
    }),
  ),
  // A planetarium model of a black hole (3 m): a black sphere in a glowing ring, its accretion disc turning in its
  // own plane; it swallows a shooting star.
  e('black hole', 'sky', 'space', () =>
    spinInPlane(
      m('black hole')
        .cyl([1.1, 0.1, 1.1], [0, 0.05, 0], { color: '#1a1a24', edge: 'sharp', round: 0.4 })
        .cyl([0.08, 1.2, 0.08], [0, 0.65, 0], { color: '#2a2a3a' })
        .ball(1.3, [0, 2.25, 0], { color: '#0c0b10', name: 'hole' })
        .torus([1.75, 1.75, 0.12], [0, 2.25, 0], { color: '#ffe0a0', glow: true, tube: 0.06 })
        .torus([3.4, 3.4, 0.2], [0, 2.25, 0], { color: 'orange', glow: true, tube: 0.22, rot: [76, 0, 0], name: 'disk', mover: { kind: 'spin', axis: 'z', amount: 60, on: true } })
        .torus([2.4, 2.4, 0.14], [0, 2.25, 0], { color: 'yellow', glow: true, tube: 0.18, rot: [76, 0, 0], name: 'disk2', mover: { kind: 'spin', axis: 'z', amount: 90, on: true } })
        .act({
          click: [
            [A.spawn('star', 'shooting star', { rel: 'left', of: 'self', dist: 'near' }), A.move('star', { rel: 'at', of: 'self' }, { speed: 'fly' }), A.par(A.remove('star', 'sink'), A.anim('pulse'), A.say('Slurp!', 1.2))],
            [A.par(A.pose('disk', { spin: [0, 0, 500] }), A.pose('disk2', { spin: [0, 0, 700] }), A.effect('sparkle', { dur: 2 })), A.wait(2), A.par(A.pose('disk', { spin: [0, 0, 60] }), A.pose('disk2', { spin: [0, 0, 90] }))],
          ],
        })
        .done(),
      ['disk', 'disk2'],
    ),
  ),
  // Blank: a flip chart on its tripod (1.9 m); flip the page over and the next one is blank too.
  e('blank', 'ideas', 'symbols', () => {
    const b = m('blank', { edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.42, 0, 0.2], [s * 0.3, 1.0, 0.04], 0.035, 'silver', { edge: 'soft' }));
    return b
      .rod([0, 0, -0.5], [0, 1.0, -0.04], 0.035, 'silver', { edge: 'soft' })
      .box([0.76, 1.02, 0.03], [0, 1.37, 0.0], { color: 'white', round: 0.1, rot: [-6, 0, 0] })
      .box([0.7, 0.92, 0.03], [0, 1.36, 0.035], { color: 'paper', rot: [-6, 0, 0] })
      .box([0.78, 0.05, 0.07], [0, 1.85, 0.0], { color: 'darkgray', round: 0.4 })
      .box([0.7, 0.92, 0.006], [0, 1.36, 0.056], { color: 'paper', rot: [-6, 0, 0], name: 'page', pivot: [0, 1.82, 0.03], mover: { kind: 'swing', axis: 'x', amount: -195 } })
      .box([0.74, 0.04, 0.09], [0, 0.88, 0.1], { color: 'gray' })
      .cyl([0.022, 0.14, 0.022], [0.16, 0.915, 0.11], { color: 'blue', rot: [0, 0, 90] })
      .cyl([0.022, 0.14, 0.022], [-0.1, 0.915, 0.11], { color: 'red', rot: [0, 0, 90] })
      .act({ click: [[A.operate('page', 'open'), A.wait(0.6), A.say('...', 1.5), A.wait(0.8), A.operate('page', 'close')], [A.par(A.anim('wobble'), A.say('?', 1))]] })
      .done();
  }),
  // A blizzard (4 m): a low white cloud bank, wind-driven snow streaks, drifts burying a road sign and a
  // snow-laden pine bending in the wind.
  e('blizzard', 'nature', 'weather', () => {
    const b = m('blizzard').cyl([6.4, 0.12, 4.4], [0, 0.06, 0], { color: 'snow' });
    b.dome([2.6, 0.8, 1.8], [-0.6, 0.5, 1.0], { color: 'snow' }).dome([1.8, 0.5, 1.2], [1.6, 0.35, -0.6], { color: 'snow' });
    b.stick([1.6, 0, 1.1], [1.62, 1.6, 1.1], 0.07, 'steel').label('ROAD CLOSED', [0.9, 0.32], [1.62, 1.45, 1.15], { color: 'red', rot: [0, 0, -8], edge: 'sharp' }).dome([1.1, 0.6, 0.9], [1.6, 0.35, 1.2], { color: 'snow' });
    b.cyl([0.22, 1.2, 0.22], [-1.9, 0.6, -0.9], { color: 'bark' })
      .cone([1.7, 1.2, 1.7], [-1.9, 1.45, -0.9], { color: '#2f5a3a', name: 'top', pivot: [-1.9, 1.0, -0.9] })
      .cone([1.3, 1.0, 1.3], [-1.9, 2.1, -0.9], { color: '#2f5a3a', parent: 'top' })
      .cone([0.8, 0.8, 0.8], [-1.9, 2.65, -0.9], { color: '#2f5a3a', parent: 'top' })
      .cone([1.0, 0.35, 1.0], [-1.9, 1.85, -0.9], { color: 'snow', parent: 'top' })
      .cone([0.5, 0.3, 0.5], [-1.9, 2.85, -0.9], { color: 'snow', parent: 'top' });
    cloud(b, 0.3, 2.9, -1.7, 3.4, '#c3ccd4');
    b.capsule([0.05, 1.6, 0.05], [-0.6, 2.4, 0.8], { color: 'white', rot: [0, 0, 80], name: 'gust', noInk: true });
    for (const [x, y, z, l] of [[0.8, 1.9, 1.0, 1.4], [-0.2, 1.4, 1.2, 1.8], [1.2, 0.9, 0.8, 1.2], [-1.4, 1.0, 1.4, 1.1], [0.4, 2.8, 0.5, 1.5]] as const) b.capsule([0.04, l, 0.04], [x, y, z], { color: x > 0 ? 'white' : 'skyblue', rot: [0, 0, 80], parent: 'gust', noInk: true });
    for (const [x, y, z] of [[-1.2, 2.0, 1.2], [0.2, 2.2, 1.4], [1.0, 1.4, 1.5], [-0.4, 0.8, 1.6], [0.6, 0.6, 1.3], [1.8, 2.2, 0.9], [-1.8, 1.6, 1.0], [0.0, 1.7, 1.7]]) b.ball(0.09, [x, y, z], { color: 'white', parent: 'gust' });
    return b
      .act({
        click: [
          [A.par(A.effect('snow', { dur: 3 }), A.pose('gust', { move: [1.2, 0, 0], dur: 1.5 }), A.pose('top', { rot: [0, 0, -10], dur: 0.8 }), A.say('Whoooosh!', 2)), A.par(A.pose('gust', { move: [0, 0, 0], dur: 1 }), A.pose('top', { rot: [0, 0, 0], dur: 1 }))],
        ],
      })
      .done();
  }),
  // The blue screen of death on an office desk: a monitor showing the blue screen, keyboard, mouse and the PC under
  // the desk. It reboots... to the same blue screen.
  e('blue screen of death', 'tech', 'computers', () =>
    m('blue screen of death', { edge: 'sharp' })
      .box([1.3, 0.04, 0.65], [0, 0.73, 0], { color: 'lightwood', round: 0.2 })
      .box([0.05, 0.71, 0.6], [-0.6, 0.355, 0], { color: 'darkgray' })
      .box([0.05, 0.71, 0.6], [0.6, 0.355, 0], { color: 'darkgray' })
      .box([1.15, 0.4, 0.03], [0, 0.48, -0.28], { color: 'darkgray' })
      .box([0.22, 0.012, 0.18], [-0.05, 0.756, -0.12], { color: '#2a2726' })
      .box([0.05, 0.22, 0.04], [-0.05, 0.86, -0.15], { color: '#2a2726' })
      .box([0.62, 0.39, 0.04], [-0.05, 1.13, -0.13], { color: '#2a2726', round: 0.15 })
      .box([0.57, 0.33, 0.01], [-0.05, 1.135, -0.106], { color: '#1f5fd6', glow: true, name: 'screen', mover: { kind: 'light', on: true } })
      .label(':(', [0.12, 0.1], [-0.25, 1.22, -0.098], { color: '#1f5fd6', depth: 0.003 })
      .box([0.34, 0.018, 0.004], [-0.04, 1.1, -0.099], { color: 'white', noInk: true })
      .box([0.28, 0.018, 0.004], [-0.07, 1.06, -0.099], { color: 'white', noInk: true })
      .box([0.44, 0.022, 0.14], [-0.05, 0.763, 0.12], { color: '#3a3633', round: 0.3 })
      .ball([0.06, 0.035, 0.1], [0.3, 0.768, 0.12], { color: '#3a3633' })
      .box([0.2, 0.44, 0.45], [0.4, 0.22, -0.02], { color: '#2a2726', round: 0.1 })
      .ball(0.02, [0.4, 0.38, 0.21], { color: 'lime', glow: true, name: 'power', mover: { kind: 'light', on: true } })
      .act({
        click: [
          [A.par(A.operate('screen', 'off'), A.operate('power', 'off'), A.say('Bzzt.', 1)), A.wait(1.2), A.par(A.operate('power', 'on'), A.say('Restarting...', 1.5)), A.wait(1), A.operate('screen', 'on')],
          [A.par(A.anim('shake'), A.say('Beep! Beep! Beep!', 1.5))],
        ],
      })
      .done(),
  ),
  // BOO! A little sheet ghost hides behind a garden hedge and pops up.
  e('boo', 'fantasy', 'spirits', () => {
    const b = m('boo')
      .box([2.2, 0.95, 0.65], [0, 0.475, 0.3], { color: '#3f7a3a', round: 0.6 })
      .box([2.3, 0.08, 0.75], [0, 0.04, 0.3], { color: 'dirt' });
    for (const x of [-0.8, -0.3, 0.2, 0.7]) b.ball([0.6, 0.35, 0.6], [x, 0.92, 0.3], { color: '#4a8a3f' });
    b.cyl([0.62, 0.7, 0.56], [0, 0.55, -0.3], { color: 'white', taper: 0.85, name: 'ghost', mover: { kind: 'slide', axis: 'y', amount: 0.85 } })
      .ball([0.62, 0.62, 0.56], [0, 0.98, -0.3], { color: 'white', parent: 'ghost' });
    for (const x of [-0.22, -0.07, 0.08, 0.23]) b.ball([0.18, 0.16, 0.18], [x, 0.22, -0.18], { color: 'white', parent: 'ghost' });
    b.pair((s) => b.rod([s * 0.28, 0.8, -0.3], [s * 0.48, 1.18, -0.24], 0.13, 'white', { parent: 'ghost' }).ball([0.08, 0.12, 0.03], [s * 0.11, 1.06, -0.03], { color: 'black', eye: true, noInk: true, parent: 'ghost' }));
    return b
      .ball([0.13, 0.17, 0.04], [0, 0.88, -0.03], { color: '#2a2726', noInk: true, parent: 'ghost' })
      .act({ click: [[A.operate('ghost', 'up'), A.par(A.say('BOO!', 1.5), A.anim('shake')), A.wait(1.2), A.operate('ghost', 'down')]] })
      .done();
  }),
  // Boot camp: a drill sergeant in a campaign hat, arms folded, barking orders.
  e('boot camp', 'town', 'soldiers', () =>
    withAct(who('boot camp', { top: 'olive', bottom: 'olive', shoes: 'black', long: true, style: 'short', hair: '#2a1d16', pose: 'cross', acc: [hat('cowboy', '#b08a50'), wear('belt', 'black'), wear('whistle')] }), {
      click: [
        [A.par(A.anim('point'), A.say('Drop and give me twenty!', 2))],
        [A.par(A.anim('hands_on_hips'), A.say('Move it, move it!', 2))],
      ],
    }),
  ),
  // A boutique at real size (6 m wide, two storeys): a recessed shopfront with mannequins in the window (one on a
  // turntable), a glass door, a striped awning, a sign, flower boxes upstairs.
  e('boutique', 'places', 'shops', () => {
    const W = 6, D = 6, Hg = 3.6, H = 6.6, zf = 3.0;
    const b = m('boutique', { edge: 'sharp' });
    b.box([W, H, D - 0.8], [0, H / 2, -0.4], { color: '#f4c2d7', round: 0.02 })
      .box([W, H - Hg, 0.8], [0, Hg + (H - Hg) / 2, 2.6], { color: '#f4c2d7', round: 0.02 })
      .box([W + 0.3, 0.35, D + 0.1], [0, H + 0.17, 0], { color: 'white', round: 0.1 })
      .box([W + 0.1, 0.6, 0.85], [0, 3.3, 2.6], { color: '#2a2726', round: 0.05 })
      .label('BOUTIQUE', [3.4, 0.42], [0, 3.3, zf + 0.04], { color: '#2a2726' });
    for (const x of [-2.8, 0.9, 2.8]) b.box([x === 0.9 ? 0.3 : 0.4, 3.0, 0.8], [x, 1.5, 2.6], { color: 'white', round: 0.05 });
    b.box([3.3, 0.5, 0.8], [-0.925, 0.25, 2.6], { color: 'white' })
      .box([3.3, 0.06, 0.06], [-0.925, 2.95, 2.97], { color: 'white' })
      .box([0.05, 2.4, 0.05], [-0.925, 1.75, 2.97], { color: 'white' })
      .box([3.3, 2.5, 0.02], [-0.925, 1.75, 2.21], { color: '#fff3e8' });
    door(b, 1.85, 2.2, { w: 1.0, h: 2.3, color: '#2a2726', frame: 'white', glass: true });
    // dress forms in the window, the right one on a turntable
    const form = (x: number, c: string, o: O) => {
      b.cyl([0.06, 0.4, 0.06], [x, 0.7, 2.55], { color: 'brass', ...o })
        .cyl([0.6, 0.75, 0.48], [x, 1.25, 2.55], { color: c, taper: 0.42, edge: 'soft', ...o })
        .ball([0.36, 0.5, 0.26], [x, 1.78, 2.55], { color: c, edge: 'soft', ...o })
        .cyl([0.08, 0.12, 0.08], [x, 2.07, 2.55], { color: 'cream', ...o })
        .ball([0.2, 0.24, 0.2], [x, 2.24, 2.55], { color: 'cream', edge: 'soft', ...o });
    };
    form(-1.9, '#e0473b', {});
    b.cyl([0.62, 0.06, 0.62], [-0.15, 0.53, 2.55], { color: 'gold', name: 'turntable', mover: { kind: 'spin', axis: 'y', amount: 90 } });
    form(-0.15, '#3fa7a0', { parent: 'turntable' });
    b.box([0.3, 0.06, 0.4], [-0.15 + 0.32, 1.25, 2.6], { color: 'black', parent: 'turntable', round: 0.3 });
    // awning and flower boxes
    b.box([W - 0.5, 0.06, 1.3], [0, 2.9, 3.55], { color: '#d64fa0', rot: [22, 0, 0] });
    for (const x of [-2.1, -0.7, 0.7, 2.1]) b.box([0.45, 0.07, 1.31], [x, 2.92, 3.56], { color: 'white', rot: [22, 0, 0], noInk: true });
    for (let i = 0; i < 11; i++) b.ball([0.5, 0.2, 0.06], [-2.5 + i * 0.5, 2.6, 4.15], { color: i % 2 ? 'white' : '#d64fa0' });
    b.pair((s) => {
      win(b, s * 1.4, 5.0, zf, 1.1, 1.5, 'white', { bars: true });
      b.box([1.4, 0.25, 0.3], [s * 1.4, 4.1, zf + 0.15], { color: 'darkwood' });
      for (const dx of [-0.45, -0.15, 0.15, 0.45]) b.ball([0.22, 0.2, 0.22], [s * 1.4 + dx, 4.3, zf + 0.15], { color: dx > 0 ? 'pink' : '#e86f7d', edge: 'soft' });
    });
    for (const x of [0.75, 2.95]) b.cyl([0.5, 0.55, 0.5], [x, 0.275, 3.4], { color: '#3a3633', taper: 0.85 }).stick([x, 0.55, 3.4], [x, 1.0, 3.4], 0.05, 'bark').ball(0.6, [x, 1.25, 3.4], { color: '#3f7a3a', edge: 'soft' });
    return b
      .socket('window', [-1.9, 0.5, 2.5], 'top', { size: 1.2 })
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-a-ling!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('turntable', 'on'), A.wait(3), A.operate('turntable', 'off')],
        ],
      })
      .done();
  }),
  // A display head with one thick plait over the shoulder, hinged at the nape so it swings.
  e('braid', 'wardrobe', 'hairstyles', () =>
    mannequin('braid', { skin: 'skin1', hair: '#d9a441', top: 'blue' }, (b, hc) => {
      const P: Vec3[] = [[-0.066, 0.235, -0.06], [-0.08, 0.205, -0.03], [-0.09, 0.175, 0.005], [-0.096, 0.148, 0.04], [-0.097, 0.12, 0.07], [-0.095, 0.092, 0.09]];
      b.ball([0.048, 0.045, 0.045], P[0], { color: hc, parent: 'hair', name: 'braid', pivot: [-0.06, 0.25, -0.07] });
      P.slice(1).forEach((p, i) => b.ball([0.046, 0.04, 0.04], p, { color: hc, rot: [0, 0, i % 2 ? 28 : -28], parent: 'braid' }));
      b.cyl([0.03, 0.016, 0.03], [-0.094, 0.068, 0.097], { color: 'red', parent: 'braid' }).cone([0.04, 0.045, 0.035], [-0.094, 0.04, 0.1], { color: hc, rot: [180, 0, 0], parent: 'braid' });
    })
      .act({ click: [[A.pose('braid', { rot: [0, 0, 28], dur: 0.35 }), A.pose('braid', { rot: [0, 0, -22], dur: 0.45 }), A.par(A.pose('braid', { rot: [0, 0, 0], dur: 0.35 }), A.say('Swish!', 1.2))]] })
      .done(),
  ),
  // Real size wins over the vocabulary's 0.1 m: a field-archery target (a 1.2 m straw boss on its stand) with an
  // arrow in the gold.
  e('bullseye', 'sports', 'targets', () => {
    const C: Vec3 = [0, 1.15, 0], n: Vec3 = [0, Math.cos(78 * D2R), Math.sin(78 * D2R)];
    const on = (k: number): Vec3 => [C[0] + n[0] * k, C[1] + n[1] * k, C[2] + n[2] * k];
    const b = m('bullseye');
    b.pair((s) => b.rod([s * 0.55, 0, 0.35], [s * 0.42, 1.55, -0.12], 0.05, 'wood'));
    b.rod([0, 0, -0.9], [0, 1.6, -0.2], 0.05, 'wood').box([1.1, 0.06, 0.08], [0, 0.55, 0.22], { color: 'wood', edge: 'sharp' });
    b.cyl([1.26, 0.3, 1.26], C, { color: '#d9b56a', rot: [78, 0, 0], name: 'boss' });
    ['white', '#2a2726', '#4e8fd6', '#e0473b', '#f6d24a'].forEach((c, i) => b.cyl([1.22 - i * 0.244, 0.008, 1.22 - i * 0.244], on(0.152 + i * 0.006), { color: c, rot: [78, 0, 0], noInk: true, parent: 'boss' }));
    const s0 = on(0.12), dir: Vec3 = [0.12, 0.3, 0.95], E: Vec3 = [s0[0] + dir[0] * 0.7, s0[1] + dir[1] * 0.7, s0[2] + dir[2] * 0.7];
    b.rod(s0, E, 0.014, 'darkwood', { name: 'arrow', parent: 'boss', piece: true });
    for (const a of [0, 120, 240]) b.box([0.004, 0.09, 0.03], [E[0] - dir[0] * 0.05 + Math.cos(a * D2R) * 0.015, E[1] - dir[1] * 0.05 + Math.sin(a * D2R) * 0.015, E[2] - dir[2] * 0.05], { color: a ? 'yellow' : 'red', rot: [-72, 0, a], parent: 'arrow', noInk: true });
    return b
      .act({
        click: [
          [A.par(A.anim('wobble'), A.say('Thunk! Bullseye!', 1.8))],
          [A.detach('arrow', 'arrow'), A.say('Pull!', 1)],
          [A.reattach('arrow'), A.par(A.anim('wobble'), A.say('Bullseye again!', 1.5))],
        ],
      })
      .done();
  }),
  // Buzz: a game-show buzzer on its podium; press the big red button and the lamp lights: BZZZT!
  e('buzz', 'ideas', 'sounds', () =>
    m('buzz', { edge: 'sharp' })
      .box([0.6, 0.95, 0.45], [0, 0.475, 0], { color: '#2f4f8f', round: 0.1 })
      .box([0.66, 0.06, 0.5], [0, 0.98, 0], { color: 'gold', round: 0.3 })
      .label('BUZZ', [0.46, 0.2], [0, 0.66, 0.235], { color: '#f6d24a' })
      .box([0.62, 0.08, 0.47], [0, 0.04, 0], { color: '#2a2726' })
      .cyl([0.26, 0.05, 0.26], [0, 1.035, 0.04], { color: 'silver', round: 0.4 })
      .dome([0.2, 0.08, 0.2], [0, 1.1, 0.04], { color: 'red', name: 'button', mover: { kind: 'slide', axis: 'y', amount: -0.03 }, edge: 'soft' })
      .cyl([0.04, 0.36, 0.04], [0.24, 1.19, -0.16], { color: 'steel', edge: 'soft' })
      .cyl([0.18, 0.04, 0.18], [0.24, 1.37, -0.16], { color: 'steel' })
      .ball([0.16, 0.18, 0.16], [0.24, 1.47, -0.16], { color: '#ffd24a', glow: true, name: 'lamp', mover: { kind: 'light', on: false } })
      .act({ click: [[A.par(A.operate('button', 'down'), A.operate('lamp', 'on'), A.say('BZZZZT!', 1.5)), A.wait(1.2), A.par(A.operate('button', 'up'), A.operate('lamp', 'off'))]] })
      .done(),
  ),
  // Camouflage: a soldier in a ghillie suit of leaves, sure that nobody can see them.
  e('camouflage', 'armory', 'military', () =>
    withAct(who('camouflage', { top: '#5a6b3a', bottom: '#4a5a30', shoes: '#3a2a20', long: true, skin: 'skin3', style: 'short', hair: '#2a1d16', acc: [hat('helmet', '#4f6b2e'), ghillie] }), {
      click: [
        [A.par(A.anim('cover_eyes'), A.say("You can't see me!", 2))],
        [A.par(A.anim('look_around'), A.say('All clear.', 1.5))],
      ],
    }),
  ),
  // The crab on the zodiac plinth: its pincers snip and it scuttles sideways.
  e('cancer (stars)', 'sky', 'zodiac', () => {
    const c = '#e8603c';
    const b = zb(m('cancer (stars)'), 'CANCER').ball([0.44, 0.18, 0.34], [0, 0.3, 0], { color: c, name: 'crab' });
    b.pair((s) => {
      const n = s > 0 ? 'L' : 'R';
      b.rod([s * 0.06, 0.36, 0.1], [s * 0.08, 0.47, 0.12], 0.025, c, { parent: 'crab' }).ball(0.06, [s * 0.08, 0.5, 0.12], { color: 'white', parent: 'crab' }).ball(0.03, [s * 0.08, 0.5, 0.15], { color: 'black', eye: true, noInk: true, parent: 'crab' });
      b.rod([s * 0.18, 0.32, 0.08], [s * 0.28, 0.4, 0.17], 0.05, c, { parent: 'crab' });
      b.ball([0.16, 0.12, 0.1], [s * 0.32, 0.45, 0.2], { color: c, parent: 'crab', name: `claw${n}` })
        .cone([0.06, 0.12, 0.05], [s * 0.38, 0.54, 0.2], { color: c, rot: [0, 0, s * -20], parent: `claw${n}`, name: `pincer${n}`, pivot: [s * 0.36, 0.49, 0.2] })
        .cone([0.05, 0.1, 0.045], [s * 0.3, 0.53, 0.2], { color: c, rot: [0, 0, s * 15], parent: `claw${n}` });
      for (const z of [0.05, -0.04, -0.12]) b.rod([s * 0.17, 0.28, z], [s * 0.34, 0.13, z * 1.6], 0.035, '#d9502c', { parent: 'crab' });
    });
    const snip = (a: number) => A.par(A.pose('pincerL', { rot: [0, 0, -a], dur: 0.15 }), A.pose('pincerR', { rot: [0, 0, a], dur: 0.15 }));
    return b
      .capsule([0.012, 0.06, 0.01], [0, 0.29, 0.17], { color: 'darkred', rot: [0, 0, 90], noInk: true, parent: 'crab' })
      .act({
        click: [
          [A.par(snip(35), A.say('Snip snap!', 1.5)), snip(0), snip(35), snip(0)],
          [A.pose('crab', { move: [0.15, 0, 0], dur: 0.4 }), A.pose('crab', { move: [-0.15, 0, 0], dur: 0.7 }), A.pose('crab', { move: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // The sea-goat on the zodiac plinth: a goat in front, a fish's tail behind that flicks up a splash.
  e('capricorn (stars)', 'sky', 'zodiac', () => {
    const g = '#c9a87a', t = 'teal';
    const b = zb(m('capricorn (stars)'), 'CAPRICORN').ball([0.36, 0.28, 0.24], [0.08, 0.4, 0], { color: g });
    b.pair((s) => b.rod([0.16, 0.34, s * 0.06], [0.24, 0.14, s * 0.06], 0.06, g).ball(0.06, [0.25, 0.14, s * 0.06], { color: 'darkbrown' }));
    b.rod([0.2, 0.48, 0], [0.25, 0.62, 0], 0.12, g).ball([0.17, 0.15, 0.13], [0.27, 0.66, 0], { color: g, name: 'head' }).ball([0.1, 0.08, 0.09], [0.35, 0.62, 0], { color: g, parent: 'head' });
    b.rod([0.24, 0.72, 0.03], [0.14, 0.84, 0.03], 0.035, 'cream', { parent: 'head' }).rod([0.14, 0.84, 0.03], [0.06, 0.78, 0.03], 0.03, 'cream', { parent: 'head' }).cone([0.04, 0.1, 0.04], [0.34, 0.53, 0], { color: 'cream', rot: [180, 0, 0], parent: 'head' });
    b.pair((s) => b.ball([0.03, 0.035, 0.02], [0.3, 0.69, s * 0.06], { color: 'black', eye: true, noInk: true, parent: 'head' }));
    b.ball(0.2, [-0.12, 0.36, 0], { color: t, name: 'tail', pivot: [-0.04, 0.38, 0] });
    for (const [x, y, s] of [[-0.25, 0.34, 0.16], [-0.35, 0.4, 0.13], [-0.4, 0.5, 0.11], [-0.38, 0.6, 0.09]]) b.ball(s, [x, y, 0], { color: t, parent: 'tail' });
    return b
      .cone([0.2, 0.16, 0.05], [-0.3, 0.72, 0], { color: t, rot: [0, 0, -30], parent: 'tail' })
      .cone([0.2, 0.16, 0.05], [-0.44, 0.7, 0], { color: t, rot: [0, 0, 30], parent: 'tail' })
      .act({ click: [[A.pose('tail', { rot: [0, 0, -25], dur: 0.25 }), A.par(A.pose('tail', { rot: [0, 0, 15], dur: 0.3 }), A.effect('water_spray', { dur: 1.2 }), A.say('Maa!', 1.2)), A.pose('tail', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // Checkmate on a real chess table (0.75 m): a back-rank mate; the white rook slides up the board and the black
  // king, hemmed in by his own pawns, topples.
  e('checkmate', 'toys', 'board games', () => {
    const b = m('checkmate', { edge: 'sharp' });
    b.box([0.62, 0.05, 0.62], [0, 0.705, 0], { color: 'darkwood', round: 0.2 });
    for (const [x, z] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) b.box([0.05, 0.68, 0.05], [x, 0.34, z], { color: 'darkwood' });
    const q = 0.06, y = 0.73;
    b.box([0.5, 0.012, 0.5], [0, y + 0.006, 0], { color: '#f0dcb0', round: 0 });
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) b.box([q, 0.004, q], [(i - 3.5) * q, y + 0.013, (j - 3.5) * q], { color: '#6b3e26', round: 0, noInk: true });
    const top = y + 0.015;
    const P = (i: number, j: number): [number, number] => [(i - 3.5) * q, (j - 3.5) * q];
    const piece = (kind: 'K' | 'R' | 'P', i: number, j: number, c: string, name?: string) => {
      const [x, z] = P(i, j), nm = name ?? `${kind}${i}${j}${c[1]}`;
      b.cyl([0.04, 0.012, 0.04], [x, top + 0.006, z], { color: c, name: nm, pivot: [x + 0.02, top, z], edge: 'soft' });
      if (kind === 'K') {
        b.cyl([0.026, 0.055, 0.026], [x, top + 0.04, z], { color: c, taper: 0.65, parent: nm, edge: 'soft' })
          .cyl([0.032, 0.007, 0.032], [x, top + 0.07, z], { color: c, parent: nm })
          .cyl([0.022, 0.016, 0.022], [x, top + 0.081, z], { color: c, taper: 1.3, parent: nm })
          .box([0.007, 0.022, 0.007], [x, top + 0.1, z], { color: c, parent: nm })
          .box([0.016, 0.006, 0.007], [x, top + 0.1, z], { color: c, parent: nm });
      } else if (kind === 'R') {
        b.cyl([0.03, 0.04, 0.03], [x, top + 0.032, z], { color: c, taper: 0.85, parent: nm, edge: 'soft' }).cyl([0.034, 0.014, 0.034], [x, top + 0.058, z], { color: c, parent: nm, segs: 8 });
      } else {
        b.cyl([0.022, 0.03, 0.022], [x, top + 0.026, z], { color: c, taper: 0.5, parent: nm, edge: 'soft' }).ball(0.022, [x, top + 0.048, z], { color: c, parent: nm });
      }
    };
    piece('K', 7, 0, '#2a2726', 'king');
    piece('P', 6, 1, '#2a2726');
    piece('P', 7, 1, '#2a2726');
    piece('P', 5, 1, '#2a2726');
    piece('R', 0, 7, '#f7f5ef', 'rook');
    piece('K', 4, 7, '#f7f5ef');
    piece('P', 3, 6, '#f7f5ef');
    return b
      .socket('top', [0, 0.75, 0], 'top', { size: 0.4 })
      .act({
        click: [
          [A.pose('rook', { move: [0, 0, -7 * q], dur: 1 }), A.pose('king', { rot: [0, 0, -80], dur: 0.5 }), A.par(A.say('Clack!', 1.2), A.effect('sparkle', { dur: 1.2 }))],
          [A.par(A.pose('rook', { move: [0, 0, 0], dur: 0.8 }), A.pose('king', { rot: [0, 0, 0], dur: 0.5 }))],
        ],
      })
      .done();
  }),
  // Chilly: a person bundled up in a beanie and scarf next to an outdoor thermometer reading below zero, shivering.
  e('chilly', 'nature', 'weather', () =>
    withAct(
      lift(who('chilly', { top: '#4e8fd6', bottom: 'darkgray', shoes: 'black', long: true, skin: 'skin1', hair: '#a0522d', blush: '#f08080', pose: 'cross', acc: [hat('beanie', 'red'), wear('scarf', 'red')] }), 0, (b) =>
        b
          .cyl([1.6, 0.04, 1.2], [0, 0.02, 0], { color: 'snow' })
          .stick([0.7, 0.04, -0.2], [0.7, 1.35, -0.2], 0.05, 'steel')
          .box([0.14, 0.46, 0.03], [0.7, 1.4, -0.17], { color: 'white', edge: 'sharp', round: 0.3 })
          .cyl([0.02, 0.36, 0.02], [0.7, 1.42, -0.15], { color: 'glass' })
          .ball(0.035, [0.7, 1.23, -0.15], { color: 'red' })
          .cyl([0.012, 0.05, 0.012], [0.7, 1.27, -0.145], { color: 'red' })
          .cone([0.03, 0.08, 0.03], [0.66, 1.13, -0.17], { color: 'ice', rot: [180, 0, 0] })
          .cone([0.025, 0.06, 0.025], [0.74, 1.14, -0.17], { color: 'ice', rot: [180, 0, 0] }),
      ),
      { click: [[A.par(A.anim('shake'), A.say("Brrr! It's chilly!", 2))], [A.par(A.anim('nod'), A.say('Time for hot cocoa.', 2))]] },
    ),
  ),
  // A spice-market sack of chipotles (smoked dried jalapenos), its top rolled down, with a scoop and a label.
  e('chipotle', 'food', 'spices', () => {
    const b = m('chipotle')
      .cyl([0.42, 0.42, 0.38], [0, 0.21, 0], { color: '#c9a66b', taper: 0.95 })
      .torus([0.44, 0.42, 0.08], [0, 0.42, 0], { color: '#b8945a', rot: [90, 0, 0], tube: 0.35 })
      .cyl([0.38, 0.03, 0.34], [0, 0.41, 0], { color: '#5a2a18' })
      .label('CHIPOTLE', [0.22, 0.08], [0, 0.24, 0.205], { color: '#f2e6cf', depth: 0.005 });
    ([[0.08, 0.05, 30], [-0.07, 0.08, 120], [0.02, -0.08, 70], [-0.1, -0.04, 10], [0.12, -0.04, 150], [-0.02, 0.0, 95], [0.05, 0.11, 160]] as const).forEach(([x, z, r], i) =>
      b.capsule([0.032, 0.085, 0.026], [x, 0.44, z], { color: i % 2 ? '#6b2e1a' : '#55241a', rot: [90, r, 0], name: i === 5 ? 'chili' : undefined }),
    );
    return b
      .box([0.1, 0.02, 0.13], [0.09, 0.47, -0.02], { color: 'silver', rot: [-20, 30, 0], edge: 'sharp' })
      .rod([0.11, 0.48, -0.08], [0.16, 0.6, -0.16], 0.02, 'silver')
      .act({ click: [[A.par(A.pose('chili', { move: [0, 0.18, 0], rot: [0, 0, 180], dur: 0.3 }), A.effect('smoke', { dur: 1.5 })), A.pose('chili', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.say('Achoo!', 1.2)]] })
      .done();
  }),
  // Real size wins over the vocabulary's 0.2 m: a circus big top 20 m across and 14 m to the flag, red and white,
  // with an entrance whose flaps open.
  e('circus', 'places', 'circus', () => {
    const R = 10, Hw = 4, Hr = 7.5;
    const b = m('circus').cyl([2 * R, Hw, 2 * R], [0, Hw / 2, 0], { color: 'white' });
    for (let i = 0; i < 24; i += 2) {
      const a = ((i + 0.5) / 24) * 360;
      b.box([(2 * Math.PI * R) / 24 + 0.05, Hw, 0.08], [Math.sin(a * D2R) * (R + 0.02), Hw / 2, Math.cos(a * D2R) * (R + 0.02)], { color: 'red', rot: [0, a, 0], noInk: true, edge: 'sharp' });
    }
    b.cone([2 * R + 1, Hr, 2 * R + 1], [0, Hw + Hr / 2, 0], { color: 'red' });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.rod([0, Hw + Hr, 0], [Math.sin(a) * (R + 0.5), Hw, Math.cos(a) * (R + 0.5)], 0.6, 'white');
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      b.ball([1.5, 0.8, 0.3], [Math.sin(a) * (R + 0.55), Hw - 0.2, Math.cos(a) * (R + 0.55)], { color: i % 2 ? 'yellow' : 'blue', rot: [0, (a / D2R), 0] });
    }
    b.cyl([0.3, 3.0, 0.3], [0, Hw + Hr + 1.2, 0], { color: 'silver' })
      .box([1.8, 1.1, 0.06], [0.9, Hw + Hr + 2.1, 0], { color: 'yellow', name: 'flag', pivot: [0, Hw + Hr + 2.1, 0], edge: 'sharp' })
      .ball(0.4, [0, Hw + Hr + 2.8, 0], { color: 'gold' });
    // the entrance: a striped porch with a sign and two flaps
    const zf = R + 2.8;
    b.box([4.4, 3.4, 3.2], [0, 1.7, R + 1.2], { color: 'red', edge: 'sharp', round: 0.05 }).wedge([4.8, 1.4, 3.4], [0, 4.1, R + 1.2], { color: 'white', edge: 'sharp' });
    for (const x of [-1.6, 0, 1.6]) b.box([0.5, 3.42, 3.22], [x, 1.7, R + 1.2], { color: 'white', noInk: true, edge: 'sharp' });
    b.box([3.0, 2.9, 0.04], [0, 1.45, zf + 0.02], { color: '#2a1d16', edge: 'sharp' })
      .label('BIG TOP', [3.4, 0.6], [0, 3.85, zf + 0.25], { color: 'yellow', edge: 'sharp' })
      .box([1.5, 2.9, 0.08], [-0.75, 1.45, zf + 0.08], { color: 'red', name: 'flapL', pivot: [-1.5, 1.45, zf + 0.08], mover: { kind: 'swing', axis: 'y', amount: -110 }, edge: 'soft' })
      .box([1.5, 2.9, 0.08], [0.75, 1.45, zf + 0.08], { color: 'red', name: 'flapR', pivot: [1.5, 1.45, zf + 0.08], mover: { kind: 'swing', axis: 'y', amount: 110 }, edge: 'soft' });
    for (const x of [-0.75, 0.75]) b.box([0.3, 2.92, 0.09], [x, 1.45, zf + 0.09], { color: 'white', parent: x < 0 ? 'flapL' : 'flapR', noInk: true });
    return b
      .act({
        click: [
          [A.operate('flap', 'open'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Ta-daaa!', 2)), A.wait(2), A.operate('flap', 'close')],
          [A.par(A.pose('flag', { rot: [0, 35, 0], dur: 0.4 }), A.say('Oom-pah-pah!', 2)), A.pose('flag', { rot: [0, -25, 0], dur: 0.5 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A city block at real size (towers up to 44 m): office towers with glass strips, a street with taxis, lamp posts
  // and trees; at the click the windows light up and the traffic honks.
  e('city', 'places', 'cities', () => {
    const b = m('city', { edge: 'sharp' });
    b.box([40, 0.15, 28], [0, 0.075, 0], { color: '#a3a7aa' }).box([40, 0.04, 7], [0, 0.17, 10.5], { color: '#3a3633', round: 0 });
    for (let i = 0; i < 8; i++) b.box([2.2, 0.01, 0.2], [-17 + i * 4.9, 0.195, 10.5], { color: 'white', noInk: true, round: 0 });
    const towers: Array<[number, number, number, number, number, string]> = [
      [-14, -6, 8, 9, 22, '#c9b28a'], [-4.5, -7, 8, 9, 44, '#7f9bb3'], [4.5, -5, 7, 7, 32, '#b9c2ca'], [13, -7, 9, 8, 18, '#a7856a'],
      [-13, 3.5, 9, 5, 9, '#d9c8a8'], [-3, 3.5, 7, 5, 12, '#9fb3c0'], [6, 3.5, 6, 5, 7, '#e0a080'], [14, 3.5, 8, 5, 14, '#c0c8b8'],
    ];
    towers.forEach(([x, z, w, d, h, c], i) => {
      b.box([w, h, d], [x, h / 2 + 0.15, z], { color: c, round: 0.03 }).box([w + 0.3, 0.5, d + 0.3], [x, h + 0.4, z], { color: '#5c6166', round: 0.1 });
      const strips = Math.max(2, Math.round(w / 2.6));
      for (let k = 0; k < strips; k++) b.box([w / strips - 0.7, h - 2.6, 0.06], [x - w / 2 + (k + 0.5) * (w / strips), h / 2 + 1.0, z + d / 2 + 0.02], { color: '#cfe6f2', round: 0.05 });
      b.box([w - 1.2, Math.min(3, h * 0.25), 0.07], [x, h * 0.6, z + d / 2 + 0.05], { color: '#ffe9a8', name: `lights${i}`, mover: { kind: 'light', on: false } });
      if (h < 15) door(b, x, z + d / 2, { w: 1.6, h: 2.4, color: '#2f3d52', glass: true, frame: '#5c6166', name: `entry${i}` });
    });
    b.stick([-4.5, 44.6, -7], [-4.5, 47.2, -7], 0.25, 'silver').ball(0.6, [-4.5, 47.5, -7], { color: 'red', glow: true, name: 'beacon', mover: { kind: 'light', on: true } });
    b.cyl([2.4, 2.4, 2.4], [13, 19.6, -7], { color: 'wood', taper: 1.1 }).cone([2.6, 1.0, 2.6], [13, 21.3, -7], { color: '#5c6166' });
    for (const x of [-16, -6, 4, 14]) b.stick([x, 0.15, 7.2], [x, 4.6, 7.2], 0.14, 'darkgray').box([0.9, 0.2, 0.4], [x + 0.35, 4.6, 7.2], { color: 'darkgray' }).ball([0.3, 0.15, 0.3], [x + 0.5, 4.45, 7.2], { color: '#fff3a0', glow: true });
    for (const x of [-11, 9]) b.cyl([0.3, 2.4, 0.3], [x, 1.35, 7.4], { color: 'bark', edge: 'soft' }).ball([2.4, 2.4, 2.4], [x, 3.6, 7.4], { color: 'leaf', edge: 'soft' });
    const taxi = (x: number, z: number, nm: string) => {
      b.box([4.4, 0.8, 1.8], [x, 0.75, z], { color: '#f6d24a', round: 0.3, name: nm })
        .box([2.4, 0.6, 1.7], [x - 0.2, 1.4, z], { color: '#2f3d52', round: 0.3, parent: nm })
        .box([0.6, 0.2, 0.3], [x - 0.2, 1.8, z], { color: 'white', parent: nm });
      for (const dx of [-1.4, 1.4]) for (const dz of [-0.85, 0.85]) b.cyl([0.65, 0.25, 0.65], [x + dx, 0.5, z + dz], { color: 'rubber', rot: [90, 0, 0], parent: nm, edge: 'soft', name: `wheel${nm}${dx > 0 ? 'f' : 'b'}${dz > 0 ? 'l' : 'r'}` });
    };
    taxi(-8, 9, 'taxi');
    taxi(7, 12, 'cab');
    return b
      .act({
        click: [
          [A.par(A.operate('lights', 'on'), A.pose('taxi', { move: [6, 0, 0], dur: 2 }), A.say('Honk! Honk!', 1.5)), A.operate('beacon', 'off'), A.wait(0.4), A.operate('beacon', 'on')],
          [A.par(A.operate('lights', 'off'), A.pose('taxi', { move: [0, 0, 0], dur: 2 }), A.say('Beep beep!', 1.5))],
        ],
      })
      .done();
  }),
  // A sea cliff 10 m high (a hill version; the vocabulary's 3 m is far too low for a cliff): layered rock, a grassy
  // top with a fence and a bench, waves and rocks below. A loose boulder breaks off and splashes down.
  e('cliff', 'nature', 'landforms', () => {
    const b = m('cliff');
    b.box([24, 0.3, 9], [0, 0.15, 6.5], { color: 'water', round: 0.05 });
    b.box([22, 4, 12], [0, 2.2, -4], { color: '#8f8577', round: 0.04, name: 'base' })
      .box([21.4, 3.6, 11.6], [0.2, 5.8, -4.3], { color: '#a39783', round: 0.04 })
      .box([20.8, 2.6, 11.2], [-0.2, 8.9, -4.5], { color: '#958a78', round: 0.04, name: 'top' })
      .box([21, 0.45, 11.4], [-0.2, 10.4, -4.5], { color: 'grass', round: 0.3 });
    for (const [y, c] of [[3.2, '#7f7568'], [4.6, '#b0a48e'], [7.2, '#857a6a'], [8.0, '#a89c86']] as const) b.box([21.6, 0.3, 0.1], [0, y, y < 4 ? 2.02 : y < 7.6 ? 1.47 : 1.07], { color: c, noInk: true, round: 0 });
    for (const [x, y, z, s] of [[-7, 1.5, 2.3, 1.6], [-2, 0.8, 2.6, 1.2], [4, 1.2, 2.4, 1.4], [8.5, 0.7, 2.6, 1.0], [-9, 0.6, 4.0, 1.2], [2, 0.4, 4.6, 0.9], [6, 0.5, 5.4, 1.1]]) b.ball([s * 1.3, s, s], [x, y, z], { color: 'rock' });
    for (const [x, z] of [[-8, 3.3], [-2.5, 3.4], [3, 3.5], [7.5, 3.3], [0, 5.2]]) b.ball([2.2, 0.35, 0.8], [x, 0.38, z], { color: 'white', noInk: true });
    for (let i = 0; i < 9; i++) b.stick([-8 + i * 2, 10.6, 0.3], [-8 + i * 2, 11.4, 0.3], 0.1, 'wood');
    b.box([16.2, 0.08, 0.06], [0, 11.2, 0.3], { color: 'wood' }).box([16.2, 0.08, 0.06], [0, 10.9, 0.3], { color: 'wood' });
    b.box([1.6, 0.08, 0.45], [5, 11.05, -2], { color: 'wood', edge: 'sharp' }).box([1.6, 0.4, 0.06], [5, 11.35, -2.2], { color: 'wood', edge: 'sharp' }).box([0.08, 0.4, 0.4], [4.3, 10.8, -2], { color: 'iron' }).box([0.08, 0.4, 0.4], [5.7, 10.8, -2], { color: 'iron' });
    return b
      .ball([1.3, 1.0, 1.1], [-5, 9.4, 1.0], { color: '#8a8070', name: 'boulder', parent: 'top', piece: true })
      .socket('seat', [5, 11.1, -2], 'seat')
      .act({ click: [[A.detach('boulder', 'boulder'), A.par(A.effect('dust', { dur: 2 }), A.say('Rumble... SPLASH!', 2)), A.effect('water_spray', { dur: 1.5 })], [A.reattach('boulder')]] })
      .done();
  }),
  // A display head with a comb-over: bald on top, the long side hair combed across; a gust lifts it like a lid.
  e('combover', 'wardrobe', 'hairstyles', () =>
    mannequin('combover', { cap: false, hair: '#5a3a22', top: 'navy', skin: 'skin2' }, (b, hc) => {
      b.ball([0.162, 0.12, 0.1], [0, 0.27, -0.06], { color: hc, parent: 'head' });
      b.pair((s) => b.ball([0.03, 0.07, 0.11], [s * 0.072, 0.285, -0.015], { color: hc, parent: 'head' }));
      b.ball([0.15, 0.022, 0.15], [-0.005, 0.37, 0.0], { color: hc, parent: 'head', name: 'comb', pivot: [0.075, 0.33, 0], rot: [0, 0, -4] });
      for (const z of [0.045, 0.015, -0.015, -0.045]) path(b, ell(0, 0.285, 0.08, 0.09, 15, 168, 6, z), 0.012, hc, { parent: 'comb' });
    })
      .act({ click: [[A.par(A.pose('comb', { rot: [0, 0, 70], dur: 0.3 }), A.effect('dust', { dur: 0.8 }), A.say('Whoosh!', 1.2)), A.wait(0.8), A.pose('comb', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A constellation on a planetarium star board: the W of Cassiopeia; the stars go out and come back one by one,
  // like joining the dots.
  e('constellation', 'sky', 'constellations', () =>
    starBoard('constellation', [[-0.5, 0.12], [-0.25, -0.16], [0, 0.06], [0.24, -0.22], [0.5, 0.14]], [[0, 1], [1, 2], [2, 3], [3, 4]], { big: [2] })
      .act({ click: [[A.operate('star', 'off'), A.wait(0.4), ...[0, 1, 2, 3, 4].flatMap((i) => [A.operate(`star${i}`, 'on'), A.wait(0.3)]), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // A crowd: seven people of all sorts standing together; they cheer, then wave.
  e('crowd', 'town', 'groups', () => {
    const P = (tag: string, at: [number, number], yaw: number, o: Parameters<typeof who>[1]) => ({ f: who(`crowd ${tag}`, o), at, yaw, tag });
    const list = [
      P('a', [-1.2, -0.7], 15, { h: 1.72, top: 'green', bottom: 'denim', hair: 'black', skin: 'skin3' }),
      P('b', [-0.4, -0.9], 5, { h: 1.8, top: 'purple', bottom: 'darkgray', hair: '#d9a441', skin: 'skin1', style: 'long' }),
      P('c', [0.4, -0.8], -5, { h: 1.85, top: 'orange', bottom: 'navy', hair: 'darkbrown', skin: 'skin4' }),
      P('d', [1.2, -0.6], -15, { h: 1.68, top: 'teal', bottom: 'tan', hair: 'black', skin: 'skin5', style: 'bun' }),
      P('e', [-0.8, 0.2], 10, { h: 1.62, top: 'red', bottom: 'denim', hair: 'brown', skin: 'skin2', skirt: 'red', style: 'ponytail' }),
      P('f', [0.05, 0.3], 0, { h: 1.35, top: 'yellow', bottom: 'brown', hair: 'black', skin: 'skin3', style: 'pigtails' }),
      P('g', [0.85, 0.2], -10, { h: 1.75, top: 'blue', bottom: 'tan', hair: '#a0522d', skin: 'skin2', glasses: '#2a2726' }),
    ];
    return withAct(troupe('crowd', list), {
      click: [
        [A.par(...armsUp(['a', 'c', 'e', 'g']), A.say('Hooray!', 1.5)), A.wait(1.2), A.par(...armsUp(['a', 'c', 'e', 'g'], false))],
        [A.par(...handUp(['b', 'd', 'f']), A.say('Hello!', 1.5)), A.wait(1.2), A.par(...handUp(['b', 'd', 'f'], false))],
      ],
    });
  }),
  // A culinary school (two storeys, 14 m wide): cream brick, a canopy over glass doors, kitchen windows, steaming
  // exhaust stacks and a giant chef's hat on the roof.
  e('culinary school', 'places', 'schools', () => {
    const W = 14, D = 9, H = 7.2, zf = D / 2;
    const b = m('culinary school', { edge: 'sharp' });
    b.box([W, H, D], [0, H / 2, 0], { color: '#efe6d2', round: 0.02 })
      .box([W + 0.4, 0.5, D + 0.4], [0, H + 0.25, 0], { color: '#a3322a', round: 0.1 })
      .box([W + 0.05, 0.25, 0.1], [0, 3.55, zf + 0.05], { color: '#a3322a' })
      .box([W + 0.05, 0.4, 0.1], [0, 0.2, zf + 0.05], { color: '#8f8577' })
      .label('CULINARY SCHOOL', [6, 0.7], [0, 4.25, zf + 0.06], { color: '#a3322a' });
    b.box([4.2, 0.25, 2.2], [0, 3.05, zf + 1.1], { color: 'white', round: 0.2 });
    b.pair((s) => b.cyl([0.25, 2.9, 0.25], [s * 1.9, 1.5, zf + 2.0], { color: 'white' }));
    door(b, -0.55, zf, { w: 1.05, h: 2.4, color: '#2f3d52', glass: true, frame: '#a3322a', name: 'doorL' });
    door(b, 0.55, zf, { w: 1.05, h: 2.4, color: '#2f3d52', glass: true, noFrame: true, name: 'doorR', right: true });
    for (const x of [-5.5, -3.3, 3.3, 5.5]) {
      win(b, x, 1.9, zf, 1.7, 1.8, 'white', { bars: true });
      for (let i = 0; i < 4; i++) b.box([0.48, 0.12, 0.04], [x - 0.75 + i * 0.5, 0.95, zf + 0.04], { color: i % 2 ? 'white' : '#a3322a', round: 0, noInk: true });
    }
    for (const x of [-5.5, -3.3, -1.1, 1.1, 3.3, 5.5]) win(b, x, 5.4, zf, 1.4, 1.6, 'white', { bars: true });
    for (const x of [-4.5, 4.5]) b.cyl([0.6, 2.0, 0.6], [x, H + 1.5, -2], { color: 'steel', edge: 'soft' }).cone([0.9, 0.4, 0.9], [x, H + 2.7, -2], { color: 'steel' });
    b.cyl([2.4, 1.2, 2.4], [0, H + 1.1, -1], { color: 'white', edge: 'soft' })
      .ball([3.4, 2.0, 3.0], [0, H + 2.5, -1], { color: 'white', edge: 'soft' })
      .ball([1.6, 1.4, 1.6], [-1.0, H + 3.0, -1], { color: 'white', edge: 'soft' })
      .ball([1.6, 1.4, 1.6], [1.0, H + 3.0, -1], { color: 'white', edge: 'soft' });
    return b
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 2.5 }), A.say('Ding! Order up!', 2))],
          [A.operate('door', 'open'), A.say('Clatter clatter!', 1.5), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A daisy (25 cm) in a tuft of soil: white petals round a yellow eye. It blooms; a petal comes off ("loves me...").
  e('daisy', 'garden', 'flowers', () => {
    const b = m('daisy').dome([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'dirt' }).rod([0, 0.02, 0], [0.01, 0.255, 0.005], 0.007, 'green');
    for (const a of [0, 120, 240]) b.ball([0.075, 0.01, 0.026], [Math.cos(a * D2R) * 0.04, 0.035, Math.sin(a * D2R) * 0.04], { color: 'leaf', rot: [0, -a, 12] });
    b.ball([0.05, 0.012, 0.02], [0.02, 0.12, 0], { color: 'leaf', rot: [0, 0, 30] });
    b.ball([0.032, 0.032, 0.02], [0.01, 0.27, 0.01], { color: 'yellow', name: 'head', pivot: [0.01, 0.255, 0.005] });
    for (let i = 0; i < 14; i++) {
      const a = i * (360 / 14);
      b.ball([0.011, 0.036, 0.004], [0.01 + Math.cos(a * D2R) * 0.026, 0.27 + Math.sin(a * D2R) * 0.026, 0.007], { color: 'white', rot: [0, 0, a - 90], parent: 'head', ...(i === 3 ? { name: 'petal', piece: true } : {}) });
    }
    return b
      .act({
        click: [
          [A.par(A.pose('head', { scale: 1.3, dur: 0.4 }), A.effect('sparkle', { dur: 1 })), A.pose('head', { scale: 1, dur: 0.4 })],
          [A.detach('petal', 'petal')],
          [A.reattach('petal'), A.pose('head', { rot: [15, 0, 0], dur: 0.3 }), A.pose('head', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // Death: the grim reaper, tall in a black hooded robe, scythe in hand.
  e('death', 'fantasy', 'spirits', () =>
    withAct(who('death', { h: 1.95, skin: '#efeae0', top: 'black', bottom: 'black', skirt: 'black', long: true, shoes: 'black', style: 'bald', acc: [gown('black'), hat('hood', 'black'), wear('cloak', 'black'), scythe] }), {
      click: [
        [A.par(A.anim('point'), A.say('Your time is up...', 2))],
        [A.par(A.anim('shrug'), A.say('Just kidding.', 1.5))],
      ],
    }),
  ),
  // A river delta (a 16 m stretch): the river fans out into channels between reedy islands before it meets the
  // sea; a little rowboat drifts down to the sea.
  e('delta', 'nature', 'landforms', () => {
    const b = m('delta').box([16, 0.2, 14], [0, 0.1, 0], { color: '#7a6a40', round: 0.02 });
    b.box([16, 0.06, 3.6], [0, 0.23, 5.2], { color: 'water', round: 0 }).box([2.6, 0.06, 6], [0, 0.23, -4], { color: 'water', round: 0 });
    for (const x of [-6, -3, 0, 3, 6]) {
      const dx = x, dz = 4.6, len = Math.hypot(dx, dz);
      b.box([1.1, 0.06, len], [dx / 2, 0.235, -1 + dz / 2], { color: 'water', rot: [0, Math.atan2(dx, dz) / D2R, 0], round: 0, noInk: true });
    }
    for (const [x, z] of [[-4.6, 2.0], [-1.5, 2.2], [1.5, 2.2], [4.6, 2.0], [-7, 0.5], [7, 0.5]]) b.dome([2.2, 0.45, 2.0], [x, 0.42, z], { color: '#6b9a40' });
    for (const [x, z] of [[-4.8, 1.8], [-4.3, 2.3], [-1.3, 2.0], [1.7, 2.4], [4.4, 1.9], [4.9, 2.2], [-6.8, 0.2]]) b.stick([x, 0.5, z], [x, 1.7, z], 0.03, 'darkgreen').capsule([0.06, 0.24, 0.06], [x, 1.6, z], { color: 'darkbrown' });
    leafy(b, -5.5, -5, 3.6);
    leafy(b, 5.2, -5.5, 3.2, 'darkgreen');
    leafy(b, 3.6, -4.2, 2.6);
    b.loft([0.9, 0.45, 2.4], [0, 0.4, -4], [[0, 0.6, 0.8, 0.1], [0.4, 1, 1, 0], [1, 0.2, 0.9, 0.05]], { color: '#b5814e', cut: 'bottom', boxy: 0.3, name: 'boat' })
      .box([0.8, 0.05, 0.25], [0, 0.55, -4], { color: 'darkwood', parent: 'boat', edge: 'sharp' })
      .rod([-0.5, 0.6, -4.2], [0.6, 0.6, -3.8], 0.04, 'wood', { parent: 'boat' });
    return b
      .socket('seat', [0, 0.58, -4], 'seat', { part: 'boat' })
      .act({ click: [[A.par(A.pose('boat', { move: [0, 0, 8], dur: 4 }), A.effect('water_spray', { dur: 1.2 }))], [A.pose('boat', { move: [0, 0, 0], dur: 3 })]] })
      .done();
  }),
  // An ice cream sundae (25 cm) in a tulip glass: three scoops, whipped cream, a cherry on top (it comes off), a
  // wafer and a long spoon that scoops.
  e('dessert', 'food', 'desserts', () =>
    m('dessert')
      .cyl([0.09, 0.012, 0.09], [0, 0.006, 0], { color: 'glass', edge: 'sharp' })
      .cyl([0.018, 0.05, 0.018], [0, 0.037, 0], { color: 'glass' })
      .cyl([0.075, 0.085, 0.075], [0, 0.104, 0], { color: 'glass', taper: 1.7 })
      .ball([0.085, 0.07, 0.085], [-0.022, 0.155, 0.01], { color: 'pink' })
      .ball([0.085, 0.07, 0.085], [0.025, 0.155, -0.01], { color: 'chocolate' })
      .ball([0.08, 0.07, 0.08], [0, 0.195, 0], { color: 'cream' })
      .ball([0.065, 0.05, 0.065], [0, 0.235, 0], { color: 'white', name: 'cream' })
      .capsule([0.012, 0.05, 0.01], [0.035, 0.2, 0.025], { color: 'chocolate', rot: [0, 0, 15], noInk: true })
      .ball(0.03, [0, 0.272, 0], { color: 'red', name: 'cherry', parent: 'cream', piece: true })
      .rod([0, 0.285, 0], [0.012, 0.315, 0], 0.004, 'green', { parent: 'cherry' })
      .box([0.012, 0.07, 0.028], [-0.03, 0.25, -0.015], { color: 'tan', rot: [0, 0, 20], edge: 'sharp' })
      .rod([0.03, 0.2, 0.02], [0.07, 0.33, 0.05], 0.007, 'silver', { name: 'spoon' })
      .act({
        click: [
          [A.pose('spoon', { move: [0, 0.05, 0.02], rot: [-20, 0, 0], dur: 0.3 }), A.pose('spoon', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.say('Mmm!', 1)],
          [A.detach('cherry', 'cherry')],
          [A.reattach('cherry')],
        ],
      })
      .done(),
  ),
  // Real size wins over the vocabulary's 1 m: a one-storey DMV office (12 m wide) with a queue out of the door.
  e('dmv', 'places', 'offices', () => {
    const Q = (tag: string, x: number, o: Parameters<typeof who>[1]) => ({ f: who(`dmv ${tag}`, o), at: [x, 4.3] as [number, number], yaw: -90, tag });
    return withAct(
      troupe('dmv', [Q('a', 2.3, { top: 'teal', bottom: 'denim', pose: 'cross' }), Q('b', 3.2, { top: 'orange', bottom: 'darkgray', pose: 'hips', style: 'long' }), Q('c', 4.1, { top: 'purple', bottom: 'tan', h: 1.8 })], (b) => {
        const W = 12, D = 6, H = 4.5, zf = D / 2;
        b.box([W, H, D], [0, H / 2, 0], { color: '#e6dcc4', edge: 'sharp', round: 0.02 })
          .box([W + 0.02, 0.5, D + 0.02], [0, 3.2, 0], { color: '#2f4f8f', edge: 'sharp', round: 0 })
          .box([W + 0.3, 0.35, D + 0.3], [0, H + 0.17, 0], { color: '#c9bfa6', edge: 'sharp', round: 0.1 })
          .label('DMV', [2.2, 0.9], [-2.5, 3.85, zf + 0.04], { color: '#2f4f8f', edge: 'sharp' })
          .label('MOTOR VEHICLES', [3.6, 0.4], [2.6, 3.85, zf + 0.04], { color: '#e6dcc4', edge: 'sharp' });
        door(b, 1.0, zf, { w: 1.2, h: 2.3, color: '#5c6166', glass: true, frame: '#2f4f8f' });
        for (const x of [-4.8, -2.4]) win(b, x, 1.7, zf, 1.8, 1.4, '#5c6166');
        b.stick([-6.8, 0, 3.6], [-6.8, 7, 3.6], 0.12, 'silver').box([1.6, 1.0, 0.04], [-6.0, 6.4, 3.6], { color: '#2f4f8f', name: 'flag', pivot: [-6.8, 6.4, 3.6], edge: 'sharp' });
        return b.box([0.5, 1.1, 0.5], [-0.3, 0.55, 3.6], { color: '#5c6166', edge: 'sharp' }).label('TAKE A NUMBER', [0.45, 0.3], [-0.3, 0.9, 3.86], { color: 'white' });
      }),
      {
        click: [
          [A.operate('door', 'open'), A.say('Now serving number 47!', 2), A.wait(2), A.operate('door', 'close')],
          [A.par(A.pose('ahead', { rot: [20, 0, 0], dur: 0.5 }), A.pose('chead', { rot: [0, 30, 0], dur: 0.5 }), A.say('Sigh...', 1.5)), A.wait(1), A.par(A.pose('ahead', { rot: [0, 0, 0] }), A.pose('chead', { rot: [0, 0, 0] }))],
        ],
      },
    );
  }),
  // A DNA model (1.3 m) on a lab stand: the double helix of two backbones joined by coloured base pairs; it turns.
  e('dna', 'study', 'science', () => {
    const b = m('dna').cyl([0.5, 0.06, 0.5], [0, 0.03, 0], { color: 'darkgray', edge: 'sharp', round: 0.4 }).cyl([0.04, 1.32, 0.04], [0, 0.7, 0], { color: 'silver' });
    b.ball(0.06, [0, 0.16, 0], { color: 'silver', name: 'helix', mover: { kind: 'spin', axis: 'y', amount: 90 } });
    const P = (i: number, k: number): Vec3 => [Math.cos((i * 36 + k * 180) * D2R) * 0.17, 0.2 + i * 0.09, Math.sin((i * 36 + k * 180) * D2R) * 0.17];
    const pair = ['green', 'yellow', 'orange', 'magenta'];
    for (let i = 0; i < 12; i++) {
      const a = P(i, 0), c = P(i, 1), mid: Vec3 = [(a[0] + c[0]) / 2, a[1], (a[2] + c[2]) / 2];
      b.stick(a, mid, 0.03, pair[i % 4], { parent: 'helix' }).stick(c, mid, 0.03, pair[(i + 2) % 4], { parent: 'helix' });
      b.ball(0.06, a, { color: 'blue', parent: 'helix' }).ball(0.06, c, { color: 'red', parent: 'helix' });
      if (i < 11) b.rod(a, P(i + 1, 0), 0.045, 'blue', { parent: 'helix' }).rod(c, P(i + 1, 1), 0.045, 'red', { parent: 'helix' });
    }
    return b.act({ click: [[A.operate('helix', 'on'), A.wait(3), A.operate('helix', 'off')]] }).done();
  }),
  // Double Dare's slime stunt: a contestant's pad under a gantry with a sign and a bucket of green slime that tips.
  e('double dare', 'toys', 'games', () => {
    const b = m('double dare', { edge: 'sharp' })
      .box([2.2, 0.2, 1.8], [0, 0.1, 0.2], { color: '#f6d24a', round: 0.1 })
      .box([2.22, 0.08, 1.82], [0, 0.16, 0.2], { color: '#e0473b', round: 0.1 })
      .box([0.7, 0.03, 0.12], [0, 0.215, 0.3], { color: '#e0473b', rot: [0, 45, 0] })
      .box([0.7, 0.03, 0.12], [0, 0.215, 0.3], { color: '#e0473b', rot: [0, -45, 0] })
      .dome([0.8, 0.05, 0.6], [0.3, 0.225, 0.6], { color: '#7ad83a', edge: 'soft' });
    b.pair((s) => b.box([0.16, 3.1, 0.16], [s * 1.0, 1.75, -0.4], { color: '#4e8fd6' }));
    b.box([2.2, 0.22, 0.22], [0, 3.3, -0.4], { color: '#4e8fd6' }).box([1.9, 0.5, 0.1], [0, 3.7, -0.4], { color: '#e0473b' }).label('DOUBLE DARE', [1.7, 0.36], [0, 3.7, -0.33], { color: '#e0473b' });
    b.pair((s) => b.stick([s * 0.38, 3.2, -0.4], [s * 0.38, 2.85, 0.1], 0.04, 'steel'));
    b.stick([-0.4, 2.85, 0.1], [0.4, 2.85, 0.1], 0.05, 'steel')
      .cyl([0.7, 0.6, 0.7], [0, 2.5, 0.1], { color: 'silver', taper: 1.2, name: 'bucket', pivot: [0, 2.55, 0.1], mover: { kind: 'swing', axis: 'x', amount: 125 } })
      .dome([0.72, 0.12, 0.72], [0, 2.82, 0.1], { color: '#7ad83a', parent: 'bucket', edge: 'soft' });
    for (const [x, l] of [[-0.3, 0.25], [0.05, 0.35], [0.28, 0.2]]) b.capsule([0.06, l, 0.05], [x, 2.8 - l / 2, 0.42], { color: '#7ad83a', parent: 'bucket', edge: 'soft' });
    return b.socket('pad', [0, 0.25, 0.3], 'top', { size: 1.2 })
      .act({ click: [[A.operate('bucket', 'open'), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('SPLAT!', 1.5)), A.wait(1.2), A.operate('bucket', 'close')]] }).done();
  }),
  // A display head with dreadlocks to the shoulders under a red, gold and green band; it turns and they swing.
  e('dreadlocks', 'wardrobe', 'hairstyles', () =>
    mannequin('dreadlocks', { skin: 'skin4', hair: '#3b2a1e', top: 'yellow' }, (b, hc) => {
      for (let k = 0; k < 13; k++) {
        const a = (150 + k * 20) * D2R, x = Math.cos(a) * 0.075, z = Math.sin(a) * 0.08 - 0.01;
        b.rod([x, 0.33, z], [x * 1.55, 0.12, z * 1.35 - 0.01], 0.024, hc, { parent: 'hair' });
      }
      b.pair((s) => b.rod([s * 0.065, 0.32, 0.04], [s * 0.1, 0.14, 0.07], 0.024, hc, { parent: 'hair' }));
      ['#e0473b', '#f6d24a', '#3f9a3a'].forEach((c, i) => b.torus([0.17, 0.2, 0.012], [0, 0.325 + i * 0.012, -0.008], { color: c, rot: [90, 0, 0], tube: 0.1, parent: 'hair' }));
    })
      .act({ click: [[A.pose('bust', { rot: [0, 35, 0], dur: 0.3 }), A.pose('bust', { rot: [0, -35, 0], dur: 0.5 }), A.par(A.pose('bust', { rot: [0, 0, 0], dur: 0.3 }), A.say('Swish swish!', 1.2))]] })
      .done(),
  ),
  // Ears: a display head with big ears (pink inside) that wiggle.
  e('ears', 'clinic', 'body parts', () =>
    mannequin('ears', { hair: 'brown', top: 'green', ears: false }, (b, hc, sk) => {
      b.pair((s) => {
        const n = `ear${s > 0 ? 'L' : 'R'}`;
        b.ball([0.03, 0.075, 0.05], [s * 0.085, 0.262, -0.005], { color: sk, parent: 'head', name: n, pivot: [s * 0.075, 0.262, 0.0], rot: [0, s * 25, 0] })
          .ball([0.012, 0.05, 0.03], [s * 0.098, 0.264, 0.003], { color: 'pink', rot: [0, s * 25, 0], parent: n, noInk: true });
      });
    })
      .act({ click: [[A.par(A.pose('earL', { rot: [0, 30, 0], dur: 0.2 }), A.pose('earR', { rot: [0, -30, 0], dur: 0.2 }), A.say('Wiggle wiggle!', 1.5)), A.par(A.pose('earL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('earR', { rot: [0, 0, 0], dur: 0.2 })), A.par(A.pose('earL', { rot: [0, 30, 0], dur: 0.2 }), A.pose('earR', { rot: [0, -30, 0], dur: 0.2 })), A.par(A.pose('earL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('earR', { rot: [0, 0, 0], dur: 0.2 }))]] })
      .done(),
  ),
  // A street split by an earthquake (4 m): the road cracked and heaved, a lamp post leaning, a broken hydrant, a
  // fallen fence. It shakes again.
  e('earthquake', 'nature', 'disasters', () => {
    const b = m('earthquake')
      .box([3.2, 0.3, 4.4], [-1.7, 0.16, 0], { color: '#4a4a4a', rot: [0, 0, 5], edge: 'sharp', round: 0.1 })
      .box([3.2, 0.3, 4.4], [1.7, 0.14, 0], { color: '#4a4a4a', rot: [0, 0, -7], edge: 'sharp', round: 0.1 })
      .box([0.45, 0.24, 4.5], [0, 0.1, 0], { color: '#1a1614' })
      .box([1.2, 0.02, 0.15], [-1.7, 0.32, 0.3], { color: 'yellow', rot: [0, 0, 5], noInk: true })
      .box([1.2, 0.02, 0.15], [1.7, 0.31, 0.3], { color: 'yellow', rot: [0, 0, -7], noInk: true })
      .box([6.8, 0.25, 0.9], [0, 0.12, -2.6], { color: 'lightgray', edge: 'sharp', round: 0.1 });
    for (const [x, z, s] of [[-0.15, -1.2, 0.3], [0.2, 0.4, 0.25], [-0.1, 1.5, 0.35], [0.15, -0.3, 0.2]]) b.ball([s, s * 0.8, s], [x, 0.25, z], { color: 'rock' });
    b.stick([-2.3, 0.25, -2.6], [-1.7, 3.6, -2.6], 0.12, 'darkgray', { name: 'post', pivot: [-2.3, 0.25, -2.6] })
      .box([0.8, 0.15, 0.3], [-1.5, 3.6, -2.6], { color: 'darkgray', rot: [0, 0, -11], parent: 'post', edge: 'sharp' })
      .ball([0.25, 0.15, 0.25], [-1.25, 3.48, -2.6], { color: '#fff3a0', glow: true, parent: 'post' });
    b.cyl([0.3, 0.6, 0.3], [2.2, 0.55, -2.4], { color: 'red', edge: 'sharp', rot: [0, 0, -8] }).dome([0.3, 0.15, 0.3], [2.24, 0.9, -2.4], { color: 'red', rot: [0, 0, -8] });
    for (let i = 0; i < 5; i++) b.box([0.09, 0.9, 0.03], [-2.8 + i * 0.25, 0.32, -3.4 + i * 0.05], { color: 'white', rot: [-80, 0, 4], edge: 'sharp' });
    return b
      .act({
        click: [
          [A.par(A.anim('shake'), A.effect('dust', { dur: 2.5 }), A.say('Rumble rumble!', 2)), A.pose('post', { rot: [0, 0, -12], dur: 0.5 }), A.effect('water_spray', { dur: 1.5 })],
          [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('Aftershock!', 1.5)), A.pose('post', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  e('eight', 'ideas', 'numbers', () => counter('eight', '8', 8, 'orange', 'blue', COUNT).done()),
  // A school circuit board (60 cm): a lantern battery, a knife switch, copper wires and a bulb on a little post.
  // Close the switch and the current lights the bulb.
  e('electric current', 'tech', 'electricity', () =>
    m('electric current', { edge: 'sharp' })
      .box([0.6, 0.03, 0.4], [0, 0.015, 0], { color: 'lightwood', round: 0.2 })
      .box([0.12, 0.12, 0.09], [-0.2, 0.09, -0.06], { color: '#e0473b', round: 0.15 })
      .box([0.12, 0.03, 0.09], [-0.2, 0.135, -0.06], { color: '#2a2726', round: 0.15 })
      .cyl([0.014, 0.03, 0.014], [-0.23, 0.165, -0.06], { color: 'brass' })
      .cyl([0.014, 0.03, 0.014], [-0.17, 0.165, -0.06], { color: 'brass' })
      .box([0.13, 0.012, 0.045], [0.0, 0.036, 0.1], { color: '#2a2726' })
      .box([0.012, 0.03, 0.03], [-0.045, 0.055, 0.1], { color: 'copper' })
      .box([0.012, 0.03, 0.03], [0.05, 0.055, 0.1], { color: 'copper' })
      .box([0.11, 0.008, 0.014], [0.01, 0.06, 0.1], { color: 'copper', name: 'switch', pivot: [-0.045, 0.06, 0.1], rot: [0, 0, 50], mover: { kind: 'swing', axis: 'z', amount: -50 } })
      .ball([0.02, 0.03, 0.02], [0.05, 0.065, 0.1], { color: 'black', parent: 'switch' })
      .cyl([0.06, 0.03, 0.06], [0.2, 0.045, -0.05], { color: '#2a2726' })
      .cyl([0.02, 0.17, 0.02], [0.2, 0.145, -0.05], { color: 'steel', edge: 'soft' })
      .cyl([0.04, 0.03, 0.04], [0.2, 0.245, -0.05], { color: 'brass' })
      .ball([0.07, 0.08, 0.07], [0.2, 0.29, -0.05], { color: '#fff3a0', glow: true, name: 'bulb', mover: { kind: 'light', on: false }, edge: 'soft' })
      .rod([-0.23, 0.18, -0.06], [-0.045, 0.06, 0.1], 0.008, 'red', { edge: 'soft' })
      .rod([0.05, 0.06, 0.1], [0.2, 0.06, -0.02], 0.008, 'red', { edge: 'soft' })
      .rod([0.2, 0.06, -0.08], [-0.17, 0.18, -0.06], 0.008, 'black', { edge: 'soft' })
      .act({ click: [[A.operate('switch', 'on'), A.par(A.operate('bulb', 'on'), A.effect('sparkle', { dur: 1 }), A.say('Zzzt!', 1))], [A.par(A.operate('switch', 'off'), A.operate('bulb', 'off'))]] })
      .done(),
  ),
  // An emo kid: black clothes, a side-swept fringe over one eye, a studded pink belt.
  e('emo', 'town', 'subcultures', () =>
    withAct(who('emo', { top: 'black', bottom: 'black', shoes: 'black', hair: 'black', style: 'short', skin: 'skin1', long: true, pose: 'cross', acc: [fringe, wear('belt', 'pink')] }), {
      click: [[A.par(A.anim('shrug'), A.say('Whatever.', 1.5))], [A.par(A.anim('cry'), A.expr('sad'), A.say('Nobody understands me...', 2)), A.wait(0.5), A.expr('neutral')]],
    }),
  ),
  // The enemy: a masked villain in a black cape with a sword and a shield.
  e('enemy', 'town', 'villains', () =>
    withAct(who('enemy', { top: 'darkred', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'spiky', acc: [face('mask', 'black'), wear('cape', 'black'), held('sword'), held('shield', 'darkred', 'L')] }), {
      click: [[A.par(A.anim('point'), A.say('We meet again!', 2))], [A.par(A.anim('laugh'), A.say('Mwa-ha-ha!', 2))]],
    }),
  ),
  // Evidence at a crime scene: police tape between two stands, numbered markers by muddy footprints, a dropped
  // glove, and a camera on a tripod whose flash goes off.
  e('evidence', 'study', 'law', () => {
    const b = m('evidence');
    b.pair((s) => b.cyl([0.3, 0.04, 0.3], [s * 1.2, 0.02, -0.5], { color: 'darkgray', edge: 'sharp' }).stick([s * 1.2, 0.04, -0.5], [s * 1.2, 1.0, -0.5], 0.05, 'darkgray'));
    b.box([2.4, 0.07, 0.005], [0, 0.95, -0.5], { color: 'yellow', noInk: true }).label('POLICE LINE  DO NOT CROSS', [1.6, 0.06], [0, 0.95, -0.495], { color: 'yellow', depth: 0.004 });
    [[-0.5, 0.1, '1'], [0.05, 0.3, '2'], [0.55, -0.05, '3']].forEach(([x, z, t]) => {
      b.wedge([0.1, 0.09, 0.08], [Number(x), 0.045, Number(z)], { color: 'yellow', edge: 'sharp' }).label(String(t), [0.04, 0.035], [Number(x), 0.05, Number(z) + 0.03], { color: 'yellow', rot: [-28, 0, 0], depth: 0.003 });
    });
    for (const [x, z, r] of [[-0.3, 0.2, 10], [-0.15, -0.1, -5], [0.2, 0.15, 15], [0.35, -0.2, 0]]) b.ball([0.1, 0.008, 0.27], [x, 0.004, z], { color: '#5a4a3a', rot: [0, r, 0], noInk: true });
    b.box([0.09, 0.02, 0.1], [0.75, 0.01, 0.25], { color: 'tan', round: 0.5 });
    for (const dx of [-0.03, -0.01, 0.01, 0.03]) b.capsule([0.017, 0.06, 0.012], [0.75 + dx, 0.012, 0.32], { color: 'tan', rot: [90, 0, 0] });
    for (const a of [90, 210, 330]) b.rod([1.0 + Math.cos(a * D2R) * 0.3, 0, 0.7 + Math.sin(a * D2R) * 0.3], [1.0, 1.25, 0.7], 0.025, 'darkgray');
    return b
      .box([0.16, 0.1, 0.09], [1.0, 1.33, 0.7], { color: '#2a2726', edge: 'sharp', round: 0.2 })
      .cyl([0.06, 0.06, 0.06], [1.0, 1.33, 0.77], { color: '#3a3633', rot: [90, 0, 0], edge: 'sharp' })
      .box([0.07, 0.04, 0.03], [1.04, 1.4, 0.72], { color: 'white', glow: true, name: 'flash', mover: { kind: 'light', on: false }, edge: 'sharp' })
      .act({ click: [[A.par(A.operate('flash', 'on'), A.say('Click!', 0.8)), A.wait(0.25), A.operate('flash', 'off'), A.wait(0.6), A.par(A.operate('flash', 'on'), A.say('Click!', 0.8)), A.wait(0.25), A.operate('flash', 'off')]] })
      .done();
  }),
  // An anatomical eye model (30 cm) on a stand: the eyeball with its iris, pupil, veins and optic nerve, and a lid
  // that blinks; the eye looks left and right.
  e('eye', 'clinic', 'body parts', () => {
    const c: Vec3 = [0, 0.2, 0], h = 0.09, lr = -12 * D2R;
    return m('eye')
      .cyl([0.16, 0.025, 0.16], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp', round: 0.4 })
      .rod([0, 0.025, -0.03], [0, 0.13, -0.07], 0.02, 'silver')
      .capsule([0.04, 0.1, 0.04], [0, 0.17, -0.1], { color: '#f0d9a0', rot: [-50, 0, 0] })
      .ball(0.16, c, { color: 'white', name: 'ball' })
      .cyl([0.075, 0.02, 0.075], [0, 0.2, 0.072], { color: '#4e8fd6', rot: [90, 0, 0], parent: 'ball' })
      .cyl([0.034, 0.02, 0.034], [0, 0.2, 0.08], { color: '#1d1a17', rot: [90, 0, 0], parent: 'ball', noInk: true })
      .ball(0.014, [0.016, 0.214, 0.087], { color: 'white', noInk: true, parent: 'ball' })
      .rod([-0.075, 0.22, 0.02], [-0.045, 0.21, 0.06], 0.006, 'red', { noInk: true, parent: 'ball' })
      .rod([0.075, 0.17, 0.02], [0.048, 0.185, 0.06], 0.006, 'red', { noInk: true, parent: 'ball' })
      .dome([0.172, h, 0.172], [0, c[1] + Math.cos(lr) * h / 2, Math.sin(lr) * h / 2], { color: 'skin2', rot: [-12, 0, 0], name: 'lid', pivot: c, mover: { kind: 'swing', axis: 'x', amount: 100 } })
      .act({
        click: [
          [A.pose('ball', { rot: [0, -35, 0], dur: 0.3 }), A.wait(0.5), A.pose('ball', { rot: [0, 35, 0], dur: 0.4 }), A.wait(0.5), A.pose('ball', { rot: [0, 0, 0], dur: 0.3 })],
          [A.operate('lid'), A.wait(0.3), A.operate('lid')],
        ],
      })
      .done();
  }),
  // A display head with one eyebrow arched high (the eyebrow); it goes up even higher.
  e('eyebrow', 'clinic', 'body parts', () =>
    mannequin('eyebrow', { hair: 'black', top: 'red', brows: false }, (b) => {
      b.box([0.045, 0.012, 0.014], [0.034, 0.318, 0.08], { color: 'black', rot: [0, 0, -18], parent: 'head', name: 'browL' }).box([0.04, 0.009, 0.012], [-0.034, 0.3, 0.083], { color: 'black', rot: [0, 0, 6], parent: 'head', noInk: true });
    })
      .act({ click: [[A.par(A.pose('browL', { move: [0, 0.012, 0], rot: [0, 0, -12], dur: 0.25 }), A.say('Hmm?', 1.5)), A.wait(1), A.pose('browL', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A display head with bushy eyebrows that wiggle up and down.
  e('eyebrows', 'clinic', 'body parts', () =>
    mannequin('eyebrows', { hair: '#3b2a1e', top: 'purple', brows: false }, (b) => {
      b.pair((s) => b.box([0.048, 0.016, 0.016], [s * 0.035, 0.304, 0.081], { color: '#2a1d16', rot: [0, 0, s * -8], parent: 'head', name: `brow${s > 0 ? 'L' : 'R'}`, round: 0.6 }));
    })
      .act({
        click: [
          [
            A.par(A.pose('browL', { move: [0, 0.012, 0], dur: 0.15 }), A.pose('browR', { move: [0, 0.012, 0], dur: 0.15 })),
            A.par(A.pose('browL', { move: [0, 0, 0], dur: 0.15 }), A.pose('browR', { move: [0, 0, 0], dur: 0.15 })),
            A.par(A.pose('browL', { move: [0, 0.012, 0], dur: 0.15 }), A.pose('browR', { move: [0, 0.012, 0], dur: 0.15 }), A.say('Wiggle wiggle!', 1.2)),
            A.par(A.pose('browL', { move: [0, 0, 0], dur: 0.15 }), A.pose('browR', { move: [0, 0, 0], dur: 0.15 })),
          ],
        ],
      })
      .done(),
  ),
  // A family: a dad, a mum, a boy and a little girl; they wave hello, then pose for a photo.
  e('family', 'town', 'groups', () => {
    const P = (tag: string, at: [number, number], o: Parameters<typeof who>[1]) => ({ f: who(`family ${tag}`, o), at, yaw: 0, tag });
    const list = [
      P('a', [-0.75, 0], { h: 1.82, top: '#4e8fd6', bottom: 'denim', hair: 'darkbrown', skin: 'skin2', beard: '#5a3a22' }),
      P('b', [-0.25, 0.15], { h: 1.3, top: 'red', bottom: 'navy', hair: 'darkbrown', skin: 'skin2', style: 'spiky' }),
      P('c', [0.3, 0], { h: 1.68, top: '#f2c14e', bottom: '#3d4f7a', skirt: '#55b05f', hair: '#a0522d', skin: 'skin2', style: 'long' }),
      P('d', [0.75, 0.2], { h: 'kid', top: 'pink', bottom: 'pink', skirt: 'pink', hair: '#a0522d', skin: 'skin2', style: 'pigtails' }),
    ];
    return withAct(troupe('family', list), {
      click: [
        [A.par(...handUp(['a', 'b', 'c', 'd']), A.say('Hello from all of us!', 2)), A.wait(1.2), A.par(...handUp(['a', 'b', 'c', 'd'], false))],
        [A.par(...armsUp(['b', 'd']), A.say('Say cheese!', 1.5)), A.effect('sparkle', { dur: 1 }), A.par(...armsUp(['b', 'd'], false))],
      ],
    });
  }),
  // Famine: a field of cracked, dry earth, withered stalks, an empty bowl and an empty sack.
  e('famine', 'ideas', 'hardship', () => {
    const b = m('famine').box([2.4, 0.12, 1.8], [0, 0.06, 0], { color: '#c9a26a', round: 0.08 });
    for (const [x, z, r] of [[-0.6, 0.3, 30], [0.5, -0.3, -40], [0.3, 0.5, 70], [-0.5, -0.4, -10], [0.9, 0.2, 15], [-0.9, -0.1, 80], [0.0, -0.6, 55]]) b.box([0.5, 0.012, 0.02], [x, 0.12, z], { color: '#6b4a2a', rot: [0, r, 0], noInk: true, round: 0 });
    b.ball(0.02, [-0.75, 0.13, -0.55], { color: '#8a6a40', name: 'stalks' });
    for (const [x, z, h, lean] of [[-0.8, -0.6, 0.9, 25], [-0.6, -0.65, 0.8, -30], [-0.4, -0.55, 0.7, 40], [0.6, -0.6, 0.85, -20], [0.8, -0.5, 0.75, 35]] as const) {
      const top: Vec3 = [x + Math.sin(lean * D2R) * h * 0.5, 0.12 + h * 0.8, z];
      b.rod([x, 0.12, z], top, 0.02, '#b8945a', { parent: 'stalks' }).capsule([0.035, 0.12, 0.03], [top[0] + Math.sin(lean * D2R) * 0.05, top[1] - 0.05, z], { color: '#a08050', rot: [0, 0, 180 - lean], parent: 'stalks' });
    }
    return b
      .cyl([0.24, 0.1, 0.24], [0.1, 0.17, 0.35], { color: 'wood', taper: 1.5, name: 'bowl' })
      .cyl([0.31, 0.012, 0.31], [0.1, 0.217, 0.35], { color: 'darkwood', parent: 'bowl', noInk: true })
      .rod([0.3, 0.135, 0.5], [0.42, 0.135, 0.33], 0.018, 'silver')
      .ball([0.45, 0.12, 0.35], [-0.5, 0.17, 0.4], { color: '#c9b28a' })
      .act({
        click: [
          [A.pose('bowl', { rot: [0, 0, 10], dur: 0.15 }), A.pose('bowl', { rot: [0, 0, -10], dur: 0.2 }), A.par(A.pose('bowl', { rot: [0, 0, 0], dur: 0.15 }), A.say('Clatter...', 1.5))],
          [A.par(A.effect('dust', { dur: 2 }), A.pose('stalks', { rot: [0, 0, -8], dur: 0.8 })), A.pose('stalks', { rot: [0, 0, 0], dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A fern (0.6 m): fronds arching out of a crown, leaflets down each side, and a curled fiddlehead that unrolls.
  e('fern', 'garden', 'plants', () => {
    const b = m('fern').dome([0.32, 0.06, 0.32], [0, 0.03, 0], { color: 'dirt' }).ball(0.05, [0, 0.07, 0], { color: '#3f6a2a', name: 'top' });
    for (let k = 0; k < 7; k++) {
      const a = (k * (360 / 7) + 15) * D2R, dx = Math.cos(a), dz = Math.sin(a), L = 0.38 + (k % 2) * 0.08;
      const pts: Vec3[] = [0, 0.25, 0.5, 0.75, 1].map((t) => [dx * L * t, 0.07 + Math.sin(t * Math.PI * 0.75) * 0.42 * (1 - t * 0.35), dz * L * t] as Vec3);
      path(b, pts, 0.012, '#3f7a3a', { parent: 'top' });
      pts.slice(1, 4).forEach((p, i) => b.pair((s) => b.ball([0.09 - i * 0.02, 0.008, 0.025], [p[0] - dz * s * 0.04, p[1], p[2] + dx * s * 0.04], { color: k % 2 ? '#5aa553' : '#4f9a48', rot: [0, -(a / D2R) + s * 70, 0], parent: 'top' })));
    }
    return b
      .torus([0.07, 0.07, 0.02], [0.03, 0.17, 0.05], { color: '#7ac85a', rot: [0, 90, 0], tube: 0.35, name: 'fiddle', pivot: [0.03, 0.1, 0.05] })
      .rod([0.03, 0.07, 0.05], [0.03, 0.13, 0.05], 0.014, '#7ac85a')
      .act({
        click: [
          [A.par(A.pose('fiddle', { rot: [-60, 0, 0], scale: 1.4, dur: 0.8 }), A.effect('sparkle', { dur: 1 })), A.wait(0.8), A.pose('fiddle', { rot: [0, 0, 0], scale: 1, dur: 0.8 })],
          [A.pose('top', { rot: [0, 0, 8], dur: 0.4 }), A.pose('top', { rot: [0, 0, -6], dur: 0.5 }), A.pose('top', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A campfire (0.9 m across): a ring of stones, crossed logs and flames that roar up, then die down and relight.
  e('fire', 'nature', 'elements', () => {
    const b = m('fire');
    around(9, 0.42).forEach(([x, z]) => b.ball([0.2, 0.14, 0.18], [x, 0.06, z], { color: 'stone' }));
    for (const [x, z] of [[0.3, 0.12], [-0.28, 0.16], [0.02, -0.32], [0.2, -0.22]]) b.rod([x, 0.05, z], [0, 0.22, 0], 0.09, 'bark');
    b.cyl([0.5, 0.03, 0.5], [0, 0.015, 0], { color: '#3a2a20' });
    return b
      .cone([0.4, 0.55, 0.4], [0, 0.42, 0], { color: 'orange', glow: true, name: 'flames', pivot: [0, 0.15, 0] })
      .cone([0.24, 0.38, 0.24], [0, 0.36, 0.06], { color: 'yellow', glow: true, parent: 'flames' })
      .cone([0.16, 0.32, 0.16], [0.13, 0.3, 0.02], { color: 'red', glow: true, rot: [0, 0, -15], parent: 'flames' })
      .cone([0.16, 0.3, 0.16], [-0.13, 0.29, 0.02], { color: 'red', glow: true, rot: [0, 0, 15], parent: 'flames' })
      .ball(0.05, [0.08, 0.75, 0.05], { color: 'orange', glow: true, parent: 'flames' })
      .act({
        click: [
          [A.par(A.pose('flames', { scale: 1.4, dur: 0.3 }), A.effect('fire', { dur: 2 }), A.say('Crackle! Pop!', 1.5)), A.pose('flames', { scale: 1, dur: 0.6 })],
          [A.par(A.pose('flames', { scale: 0.15, dur: 0.6 }), A.effect('smoke', { dur: 2 }), A.say('Hsss...', 1.2)), A.wait(1.5), A.pose('flames', { scale: 1, dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A magic fireball (40 cm) hanging in the air: a white-hot core in an orange ball trailing flames; it flares and
  // bursts.
  e('fireball', 'fantasy', 'magic', () =>
    m('fireball')
      .ball(0.22, [0.06, 0.2, 0], { color: 'orange', glow: true, name: 'core' })
      .ball(0.14, [0.08, 0.205, 0.04], { color: '#fff6c0', glow: true, parent: 'core' })
      .cone([0.18, 0.3, 0.18], [-0.12, 0.2, 0], { color: 'orange', glow: true, rot: [0, 0, 95], parent: 'core' })
      .cone([0.12, 0.24, 0.12], [-0.12, 0.25, 0.03], { color: 'red', glow: true, rot: [0, 0, 78], parent: 'core' })
      .cone([0.1, 0.22, 0.1], [-0.1, 0.15, -0.03], { color: 'red', glow: true, rot: [0, 0, 112], parent: 'core' })
      .cone([0.08, 0.16, 0.08], [-0.05, 0.31, 0.0], { color: 'yellow', glow: true, rot: [0, 0, 60], parent: 'core' })
      .act({
        click: [
          [A.par(A.pose('core', { scale: 1.4, dur: 0.25 }), A.effect('fire', { dur: 1.5 }), A.say('FWOOSH!', 1.5)), A.pose('core', { scale: 1, dur: 0.5 })],
          [A.par(A.effect('explosion', { dur: 1 }), A.pose('core', { scale: 0.1, dur: 0.15 }), A.say('BOOM!', 1.2)), A.wait(1.2), A.pose('core', { scale: 1, dur: 0.8 })],
        ],
      })
      .done(),
  ),
  e('five', 'ideas', 'numbers', () => counter('five', '5', 5, 'blue', 'yellow', COUNT).done()),
  // A fjord at real size (a hill version, 19 m): steep rock walls with snowy tops either side of a deep arm of the
  // sea, a waterfall, a red boathouse, and a little ferry that sounds its horn and sails in.
  e('fjord', 'nature', 'landforms', () => {
    const b = m('fjord').box([8, 0.2, 40], [0, 0.1, 0], { color: '#3f7fb0', round: 0.02 });
    b.pair((s) => {
      for (const [z, h, w] of [[-14, 18, 10], [-4, 16, 9], [6, 14, 9], [15, 11, 8]] as const) {
        b.box([w, h, 10.5], [s * (4 + w / 2 - 0.5), h / 2, z], { color: z % 2 ? '#7f7a72' : '#8a857c', round: 0.15, rot: [0, s * 8, s * 4] });
        b.dome([w * 0.7, 2.2, 8], [s * (4.6 + w / 2), h + 0.6, z], { color: 'snow' });
        b.dome([w * 0.6, 1.4, 9], [s * (4.4 + w / 2), h * 0.45, z + 0.3], { color: '#4f7a3a' });
      }
    });
    b.box([0.7, 13, 0.3], [-4.0, 7.5, -3.6], { color: 'white', noInk: true, rot: [0, 0, -8], round: 0.4 }).ball([1.6, 0.6, 1.0], [-3.4, 0.4, -3.4], { color: 'white', noInk: true });
    b.box([2.4, 1.8, 2.4], [-3.0, 1.1, 12], { color: '#a3322a', edge: 'sharp', round: 0.05 });
    gable(b, 2.4, 2.4, 2.0, 1.0, '#2a2726', { x: -3.0, z: 12 });
    b.box([0.9, 1.4, 0.05], [-2.4, 0.9, 13.22], { color: 'white', edge: 'sharp' });
    b.loft([2.2, 1.4, 7], [0.6, 0.7, 2], [[0, 0.8, 0.8, 0.05], [0.3, 1, 1, 0], [0.8, 0.95, 1, 0], [1, 0.3, 0.9, 0.08]], { color: 'white', cut: 'bottom', boxy: 0.5, name: 'boat' })
      .box([2.0, 0.6, 3.8], [0.6, 1.6, 1.4], { color: '#e0473b', parent: 'boat', edge: 'sharp', round: 0.2 })
      .box([1.4, 0.8, 1.4], [0.6, 2.3, 0.8], { color: 'white', parent: 'boat', edge: 'sharp', round: 0.2 })
      .box([1.42, 0.3, 1.0], [0.6, 2.4, 1.0], { color: '#2f3d52', parent: 'boat', edge: 'sharp' })
      .cyl([0.4, 0.8, 0.4], [0.6, 3.0, 0.4], { color: '#2a2726', parent: 'boat', edge: 'sharp' });
    return b
      .act({
        click: [
          [A.par(A.say('Toot toot!', 1.5), A.effect('smoke', { dur: 1.5 })), A.pose('boat', { move: [0, 0, -14], dur: 4 })],
          [A.pose('boat', { move: [0, 0, 0], dur: 4 }), A.effect('water_spray', { dur: 1.5 })],
        ],
      })
      .done();
  }),
  // A flame: an eternal flame burning in a bronze bowl on a short stand (40 cm); it flickers, blows out and
  // lights again.
  e('flame', 'nature', 'elements', () =>
    m('flame')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'bronze', edge: 'sharp' })
      .cyl([0.04, 0.12, 0.04], [0, 0.08, 0], { color: 'bronze' })
      .cyl([0.18, 0.05, 0.18], [0, 0.16, 0], { color: 'bronze', taper: 1.4, edge: 'sharp' })
      .ball([0.11, 0.1, 0.11], [0, 0.23, 0], { color: 'orange', glow: true, name: 'flame', pivot: [0, 0.18, 0] })
      .cone([0.1, 0.17, 0.1], [0, 0.33, 0], { color: 'orange', glow: true, parent: 'flame' })
      .ball([0.06, 0.06, 0.06], [0, 0.22, 0.02], { color: '#fff3a0', glow: true, parent: 'flame' })
      .cone([0.055, 0.1, 0.055], [0, 0.28, 0.02], { color: '#fff3a0', glow: true, parent: 'flame' })
      .act({
        click: [
          [A.pose('flame', { rot: [0, 0, 10], scale: 1.15, dur: 0.2 }), A.pose('flame', { rot: [0, 0, -8], scale: 0.95, dur: 0.25 }), A.pose('flame', { rot: [0, 0, 0], scale: 1, dur: 0.2 })],
          [A.par(A.pose('flame', { scale: 0.05, dur: 0.3 }), A.effect('smoke', { dur: 1.5 }), A.say('Pff.', 1)), A.wait(1.5), A.par(A.pose('flame', { scale: 1, dur: 0.4 }), A.effect('sparkle', { dur: 0.8 }))],
        ],
      })
      .done(),
  ),
  // The flat sign: a black 3D flat (1 m) standing on a fence-like music staff with a whole note on it; the flat
  // lowers the note a half step.
  e('flat (music)', 'music', 'music symbols', () => {
    const b = m('flat (music)');
    b.pair((s) => b.box([0.08, 1.25, 0.08], [s * 0.95, 0.625, -0.22], { color: 'darkwood', edge: 'sharp' }));
    b.box([2.0, 0.95, 0.04], [0, 0.82, -0.2], { color: 'paper', edge: 'sharp', round: 0.1 });
    for (let i = 0; i < 5; i++) b.box([1.86, 0.025, 0.02], [0, 0.5 + i * 0.16, -0.17], { color: '#2a2726', edge: 'sharp', round: 0.3, noInk: true });
    b.box([0.1, 1.05, 0.1], [-0.42, 0.62, 0.05], { color: '#2a2726', round: 0.4 });
    path(b, [[-0.42, 0.2, 0.05], [-0.3, 0.27, 0.05], [-0.17, 0.36, 0.05], [-0.13, 0.47, 0.05], [-0.2, 0.55, 0.05], [-0.34, 0.53, 0.05], [-0.42, 0.45, 0.05]], 0.09, '#2a2726');
    return b
      .ball([0.2, 0.14, 0.08], [0.45, 0.98, -0.13], { color: '#2a2726', rot: [0, 0, 20], name: 'note' })
      .ball([0.09, 0.06, 0.09], [0.45, 0.98, -0.1], { color: 'white', rot: [0, 0, 20], parent: 'note', noInk: true })
      .act({ click: [[A.par(A.pose('note', { move: [0, -0.08, 0], dur: 0.4 }), A.say('Bwaaah...', 1.5)), A.wait(1), A.pose('note', { move: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A flight school: a hangar with a curved roof and its sign, a little control tower with a windsock, and a
  // high-wing trainer plane (8 m long, 11 m wingspan) parked in front; its propeller starts.
  e('flight school', 'places', 'schools', () => {
    const b = m('flight school', { edge: 'sharp' });
    b.box([28, 0.08, 22], [0, 0.04, 0], { color: '#8f949a' })
      .box([14, 4.2, 10], [-3, 2.1, -5], { color: '#dfe8ee', round: 0.02 })
      .cyl([14, 6, 10], [-3, 4.2, -5], { color: '#c9d2d8', rot: [90, 0, 90], edge: 'soft' })
      .box([10, 4.0, 0.12], [-3, 2.0, 0.02], { color: '#9fa8b0' })
      .label('FLIGHT SCHOOL', [7, 0.9], [-3, 5.2, 0.15], { color: '#2f4f8f' });
    for (let i = 1; i < 5; i++) b.box([0.06, 3.9, 0.04], [-8 + i * 2, 2.0, 0.1], { color: '#7f8a94', noInk: true });
    b.box([3, 6, 3], [9, 3, -6], { color: '#dfe8ee' }).box([3.6, 1.6, 3.6], [9, 6.8, -6], { color: '#2f3d52', round: 0.1 }).box([4, 0.3, 4], [9, 7.75, -6], { color: 'white' });
    door(b, 9, -4.5, { w: 0.95, h: 2.1, color: '#2f4f8f' });
    b.stick([12, 0, -3], [12, 6, -3], 0.1, 'silver').cyl([0.6, 1.8, 0.6], [12.9, 5.8, -3], { color: 'orange', taper: 0.5, rot: [0, 0, -95], name: 'sock', pivot: [12, 5.8, -3] });
    // the trainer plane, nose to +x
    const px = 2, pz = 5;
    b.loft([1.2, 1.5, 8], [px, 1.45, pz], [[0, 0.15, 0.3, 0.2], [0.3, 0.75, 0.8, 0.05], [0.65, 1, 1, 0], [0.9, 0.95, 0.9, -0.05], [1, 0.55, 0.6, -0.1]], { color: 'white', rot: [0, 90, 0], name: 'plane', edge: 'soft' })
      .box([2.4, 0.1, 11], [px + 1.1, 2.3, pz], { color: 'white', parent: 'plane', round: 0.4 })
      .box([2.42, 0.11, 0.5], [px + 1.1, 2.31, pz + 5.3], { color: 'red', parent: 'plane' })
      .box([2.42, 0.11, 0.5], [px + 1.1, 2.31, pz - 5.3], { color: 'red', parent: 'plane' })
      .box([1.3, 0.7, 1.0], [px + 1.3, 1.95, pz], { color: '#2f3d52', parent: 'plane', round: 0.3 })
      .wedge([1.4, 1.5, 0.08], [px - 3.4, 2.3, pz], { color: 'red', apex: -0.4, parent: 'plane' })
      .box([1.0, 0.08, 3.2], [px - 3.5, 1.65, pz], { color: 'white', parent: 'plane' })
      .ball(0.4, [px + 4.0, 1.4, pz], { color: 'red', parent: 'plane' })
      .box([0.08, 1.9, 0.16], [px + 4.2, 1.4, pz], { color: '#2a2726', name: 'propeller', pivot: [px + 4.2, 1.4, pz], mover: { kind: 'spin', axis: 'x', amount: 900 }, parent: 'plane' });
    b.pair((s) => b.rod([px + 0.6, 0.9, pz + s * 0.5], [px + 1.1, 2.25, pz + s * 2.6], 0.06, 'silver', { parent: 'plane' }));
    for (const [x, z] of [[px + 3.2, pz], [px + 0.3, pz + 1.1], [px + 0.3, pz - 1.1]]) b.stick([x, 0.35, z], [x, 0.85, z], 0.06, 'silver', { parent: 'plane' }).cyl([0.5, 0.18, 0.5], [x, 0.25, z], { color: 'rubber', rot: [90, 0, 0], parent: 'plane', edge: 'soft', name: `wheel${x}${z}` });
    return b
      .act({
        click: [
          [A.operate('propeller', 'on'), A.par(A.say('Vrrrrm! Clear prop!', 2), A.pose('sock', { rot: [0, 25, 0], dur: 0.6 }))],
          [A.par(A.operate('propeller', 'off'), A.say('Phut phut...', 1.5), A.pose('sock', { rot: [0, 0, 0], dur: 0.8 }))],
        ],
      })
      .done();
  }),
  // A flurry (3.5 m): a few big snowflakes drifting down past a park lamp post and a bench with a dusting of snow.
  e('flurry', 'nature', 'weather', () => {
    const b = m('flurry').cyl([4, 0.06, 3], [0, 0.03, 0], { color: '#dfe8e0' });
    b.stick([1.2, 0.06, -0.5], [1.2, 3.2, -0.5], 0.1, '#2a2726').box([0.35, 0.45, 0.35], [1.2, 3.4, -0.5], { color: '#2a2726', edge: 'sharp' }).ball([0.25, 0.32, 0.25], [1.2, 3.38, -0.5], { color: '#fff3a0', glow: true }).cone([0.5, 0.25, 0.5], [1.2, 3.75, -0.5], { color: '#2a2726' });
    b.box([1.6, 0.06, 0.45], [-0.6, 0.45, -0.3], { color: 'wood', edge: 'sharp' }).box([1.6, 0.4, 0.05], [-0.6, 0.72, -0.52], { color: 'wood', edge: 'sharp' }).box([1.62, 0.04, 0.44], [-0.6, 0.5, -0.3], { color: 'snow' });
    b.pair((s) => b.box([0.06, 0.45, 0.45], [-0.6 + s * 0.7, 0.225, -0.3], { color: '#2a2726', edge: 'sharp' }));
    b.ball(0.02, [0, 2.6, 0.5], { color: 'white', name: 'flakes' });
    for (const [x, y, z, s] of [[-1.2, 2.4, 0.4, 0.22], [0.3, 2.8, 0.6, 0.26], [0.9, 1.6, 0.7, 0.2], [-0.4, 1.4, 0.8, 0.24], [-1.4, 0.9, 0.5, 0.18], [0.5, 0.8, 0.9, 0.2], [1.6, 2.2, 0.3, 0.18]]) flake(b, x, y, z, s, 'white', { parent: 'flakes' });
    return b
      .socket('seat', [-0.6, 0.49, -0.3], 'seat')
      .act({ click: [[A.par(A.pose('flakes', { move: [0.3, -0.6, 0], dur: 2.5 }), A.effect('snow', { dur: 2.5 })), A.pose('flakes', { move: [0, 0, 0], dur: 0.01 })]] })
      .done();
  }),
  // A forest at real size: tall pines (to 18 m) and broad oaks, ferns and a fallen log; the wind rustles the trees
  // and a bird sings.
  e('forest', 'nature', 'landscapes', () => {
    const b = m('forest').cyl([30, 0.15, 22], [0, 0.075, 0], { color: '#5a8a40' });
    const pines: Array<[number, number, number]> = [[-10, -5, 18], [-4, -7, 16], [3, -6, 17], [9, -4, 15], [-12, 3, 12], [12, 4, 13], [-2, 2, 11]];
    pines.forEach(([x, z, h], i) => {
      b.cyl([h * 0.06, h * 0.35, h * 0.06], [x, h * 0.175, z], { color: 'bark' });
      b.cone([h * 0.42, h * 0.45, h * 0.42], [x, h * 0.45, z], { color: i % 2 ? '#2f5a3a' : '#3f6a3a', name: `top${i}`, pivot: [x, h * 0.25, z] })
        .cone([h * 0.32, h * 0.38, h * 0.32], [x, h * 0.66, z], { color: i % 2 ? '#2f5a3a' : '#3f6a3a', parent: `top${i}` })
        .cone([h * 0.2, h * 0.28, h * 0.2], [x, h * 0.85, z], { color: i % 2 ? '#2f5a3a' : '#3f6a3a', parent: `top${i}` });
    });
    for (const [x, z, h] of [[-6, 6, 10], [6, -1, 11], [5, 7, 9]] as const) leafy(b, x, z, h, x > 0 ? 'green' : 'leaf');
    b.cyl([0.7, 6, 0.7], [-1, 0.45, 7.5], { color: 'bark', rot: [0, 30, 90] }).ball([0.3, 0.2, 0.3], [-3, 0.9, 7], { color: '#c84a3a' }).cyl([0.08, 0.18, 0.08], [-3, 0.75, 7], { color: 'cream' });
    for (const [x, z] of [[2, 9], [-8, 8], [9, 9], [-5, -1]]) for (const a of [0, 120, 240]) b.ball([0.9, 0.06, 0.25], [x + Math.cos(a * D2R) * 0.35, 0.35, z + Math.sin(a * D2R) * 0.35], { color: '#4f9a48', rot: [0, -a, 25] });
    return b
      .act({
        click: [
          [A.par(...[0, 2, 3, 5].map((i) => A.pose(`top${i}`, { rot: [0, 0, i % 2 ? 4 : -4], dur: 0.8 })), A.say('Rustle rustle...', 2)), A.par(...[0, 2, 3, 5].map((i) => A.pose(`top${i}`, { rot: [0, 0, 0], dur: 0.8 })))],
          [A.say('Tweet tweet!', 1.5), A.effect('sparkle', { dur: 1 })],
        ],
      })
      .done();
  }),
  // A fortune: a treasure chest (0.9 m) overflowing with gold coins and jewels; the lid swings open.
  e('fortune', 'ideas', 'luck', () => {
    const b = m('fortune', { edge: 'sharp' })
      .box([0.9, 0.5, 0.55], [0, 0.25, 0], { color: '#7a4a2a', round: 0.08 })
      .box([0.92, 0.06, 0.57], [0, 0.04, 0], { color: 'gold' })
      .box([0.92, 0.06, 0.57], [0, 0.47, 0], { color: 'gold' })
      .box([0.12, 0.14, 0.04], [0, 0.4, 0.29], { color: 'gold' })
      .dome([0.86, 0.12, 0.5], [0, 0.53, 0], { color: 'gold', edge: 'soft' });
    for (const [x, z] of [[-0.25, 0.1], [0.2, -0.05], [0.0, 0.15], [0.3, 0.15], [-0.1, -0.1]]) b.cyl([0.05, 0.01, 0.05], [x, 0.62, z], { color: '#f6d24a', rot: [20, 0, x * 60] });
    b.ball(0.07, [-0.2, 0.62, 0.0], { color: 'red', edge: 'soft' }).ball(0.06, [0.15, 0.61, 0.1], { color: '#3fa76a', edge: 'soft' }).ball(0.05, [0.32, 0.6, -0.1], { color: '#4e8fd6', edge: 'soft' });
    for (const [x, z, n] of [[0.6, 0.25, 5], [-0.6, 0.3, 3], [0.45, 0.45, 2]] as const) for (let k = 0; k < n; k++) b.cyl([0.05, 0.01, 0.05], [x, 0.005 + k * 0.01, z], { color: '#f6d24a' });
    const hinge: Vec3 = [0, 0.5, -0.285];
    b.box([0.92, 0.1, 0.57], aboutX([0, 0.55, 0], hinge, -75), { color: '#7a4a2a', name: 'lid', pivot: hinge, rot: [-75, 0, 0], round: 0.08 });
    return b
      .box([0.94, 0.11, 0.06], aboutX([0, 0.55, 0], hinge, -75), { color: 'gold', rot: [-75, 0, 0], parent: 'lid' })
      .socket('chest', [0, 0.45, 0], 'inside', { size: 0.5 })
      .act({
        click: [
          [A.pose('lid', { rot: [75, 0, 0], dur: 0.6 }), A.say('Clunk.', 1)],
          [A.pose('lid', { rot: [0, 0, 0], dur: 0.6 }), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ka-ching!', 1.5))],
        ],
      })
      .done();
  }),
  // The fountain of youth: a two-tier stone fountain (2.2 m) whose water glows; it bubbles over with sparkles.
  e('fountain of youth', 'fantasy', 'magic places', () => {
    const b = m('fountain of youth')
      .cyl([2.6, 0.5, 2.6], [0, 0.25, 0], { color: 'stone', edge: 'sharp', round: 0.3 })
      .cyl([2.3, 0.04, 2.3], [0, 0.5, 0], { color: '#6fe8e8', glow: true, name: 'water', mover: { kind: 'light', on: true } })
      .cyl([0.36, 1.1, 0.36], [0, 1.0, 0], { color: 'stone' })
      .cyl([1.2, 0.2, 1.2], [0, 1.5, 0], { color: 'stone', taper: 1.4, edge: 'sharp' })
      .cyl([1.2, 0.03, 1.2], [0, 1.6, 0], { color: '#6fe8e8', glow: true, name: 'water2', mover: { kind: 'light', on: true } })
      .cyl([0.2, 0.5, 0.2], [0, 1.85, 0], { color: 'stone' })
      .ball(0.3, [0, 2.15, 0], { color: 'gold', edge: 'sharp' });
    for (const a of [0, 90, 180, 270]) b.rod([Math.cos(a * D2R) * 0.55, 1.55, Math.sin(a * D2R) * 0.55], [Math.cos(a * D2R) * 0.85, 0.55, Math.sin(a * D2R) * 0.85], 0.06, '#9ff4f4', { glow: true, noInk: true });
    for (const [x, y, z, s] of [[0.8, 1.9, 0.4, 0.18], [-0.9, 2.2, 0.2, 0.14], [0.3, 2.5, 0.5, 0.12]]) b.star(s, [x, y, z], { color: 'gold', glow: true });
    return b
      .act({ click: [[A.par(A.effect('water_spray', { dur: 2 }), A.effect('sparkle', { dur: 2 }), A.say('Bloop... sparkle!', 1.5)), A.operate('water', 'off'), A.wait(0.3), A.operate('water', 'on')]] })
      .done();
  }),
  e('four', 'ideas', 'numbers', () => counter('four', '4', 4, 'green', 'red', COUNT).done()),
  // Real size wins over the vocabulary's 1 m: a fraternity house (14 m wide, 2 storeys and an attic): red brick, a
  // white columned porch with Greek letters on the pediment, a couch on the lawn.
  e('fraternity', 'places', 'houses', () => {
    const W = 14, D = 10, H = 6.6, zf = D / 2;
    const b = m('fraternity', { edge: 'sharp' });
    b.box([W, H, D], [0, H / 2, 0], { color: '#a34a3a', round: 0.02 }).box([W + 0.2, 0.3, D + 0.2], [0, 3.3, 0], { color: 'white' }).box([W + 0.6, 0.35, D + 0.6], [0, H + 0.1, 0], { color: 'white' });
    gable(b, W, D, H + 0.25, 3.4, '#4a4a52', { alongX: true });
    b.box([7, 0.35, 3], [0, 0.17, zf + 1.5], { color: 'stone' }).box([7, 0.4, 3], [0, 6.35, zf + 1.5], { color: 'white' }).wedge([7.6, 1.8, 3.2], [0, 7.45, zf + 1.5], { color: 'white' }).label('ΣΑΕ', [2.2, 0.8], [0, 7.2, zf + 3.12], { color: 'white' });
    for (const x of [-3, -1, 1, 3]) b.cyl([0.5, 6.0, 0.5], [x, 3.3, zf + 2.6], { color: 'white', edge: 'soft' });
    door(b, 0, zf, { w: 1.2, h: 2.4, color: '#2a2726', frame: 'white' });
    for (const x of [-5.5, -2.2, 2.2, 5.5]) for (const y of [1.6, 4.9]) win(b, x, y, zf, 1.2, 1.6, 'white', { bars: true });
    b.box([2.0, 0.45, 0.85], [-4.5, 0.42, zf + 4.5], { color: '#8a5fc4', round: 0.4, edge: 'soft' }).box([2.0, 0.55, 0.25], [-4.5, 0.85, zf + 4.15], { color: '#8a5fc4', round: 0.4, edge: 'soft' });
    b.pair((s) => b.box([0.25, 0.5, 0.85], [-4.5 + s * 1.1, 0.55, zf + 4.5], { color: '#8a5fc4', round: 0.4, edge: 'soft' }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.say('Toga! Toga! Toga!', 2), A.effect('sparkle', { dur: 1.5 })), A.wait(1.5), A.operate('door', 'close')],
          [A.par(A.anim('shake'), A.say('Boom-tss boom-tss!', 2))],
        ],
      })
      .done();
  }),
  // A planetarium full moon (3.2 m): a pale globe with grey seas and bright craters; at the click it glows and a
  // wolf howls far away.
  e('full moon', 'sky', 'moon', () => {
    const b = orb('full moon', 2.6, 1.85, '#ecead8', { spin: 4 });
    for (const [x, y, s] of [[-0.5, 0.45, 0.7], [0.45, 0.6, 0.45], [0.25, -0.45, 0.75], [-0.6, -0.5, 0.4], [0.85, 0.05, 0.35], [-0.05, 0.1, 0.3]]) b.ball([s, s * 0.9, 0.16], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.05], { color: '#c8c6b6', noInk: true, parent: 'globe' });
    for (const [x, y] of [[0.1, -0.9], [-0.95, 0.15], [0.6, 0.9]]) b.torus([0.2, 0.2, 0.06], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.02], { color: '#f6f4e8', noInk: true, parent: 'globe' });
    return b.act({ click: [[A.par(A.say('Awoooooo!', 2.5), A.effect('sparkle', { dur: 2 }), A.pose('globe', { spin: [0, 45, 0] })), A.wait(2), A.pose('globe', { spin: [0, 4, 0] })]] }).done();
  }),
  // A funeral: a polished casket on its bier with a spray of white flowers, a wreath on an easel and two tall
  // candles; a bell tolls and the candles flicker.
  e('funeral', 'town', 'events', () => {
    const b = m('funeral', { edge: 'sharp' })
      .box([2.1, 0.5, 0.65], [0, 0.95, 0], { color: '#5a3a22', round: 0.25 })
      .box([2.14, 0.12, 0.69], [0, 1.24, 0], { color: '#7a4a2a', round: 0.5 })
      .box([1.9, 0.08, 0.55], [0, 0.66, 0], { color: '#2a2726' });
    for (const [x, z] of [[-0.85, 0.22], [0.85, 0.22], [-0.85, -0.22], [0.85, -0.22]]) b.stick([x, 0, z], [x, 0.66, z], 0.05, 'brass');
    for (const x of [-0.6, 0, 0.6]) b.box([0.18, 0.05, 0.04], [x, 0.9, 0.34], { color: 'brass' });
    b.ball([0.6, 0.12, 0.3], [0, 1.33, 0], { color: '#3f7a3a', edge: 'soft' });
    for (const [x, z] of [[-0.2, 0.05], [-0.07, -0.05], [0.07, 0.06], [0.2, -0.04], [0, 0.1], [-0.13, 0.12], [0.14, 0.12]]) b.ball(0.11, [x, 1.4, z], { color: 'white', edge: 'soft' });
    b.pair((s) => b.rod([s * 0.25, 0, 1.15], [s * 0.08, 1.4, 0.95], 0.03, 'darkwood'));
    b.torus([0.8, 0.8, 0.14], [0, 1.25, 1.05], { color: '#3f7a3a', tube: 0.3, edge: 'soft' });
    around(10, 0.33).forEach(([x, y], i) => b.ball(0.1, [x, 1.25 + y, 1.12], { color: i % 3 ? 'white' : 'pink', edge: 'soft' }));
    b.pair((s) => b.stick([s * 1.35, 0, 0.2], [s * 1.35, 1.25, 0.2], 0.05, 'brass').cyl([0.24, 0.04, 0.24], [s * 1.35, 0.02, 0.2], { color: 'brass' }).cyl([0.08, 0.3, 0.08], [s * 1.35, 1.4, 0.2], { color: 'cream', edge: 'soft' }).cone([0.05, 0.09, 0.05], [s * 1.35, 1.6, 0.2], { color: 'flame', glow: true, name: `candle${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: true }, edge: 'soft' }));
    return b
      .act({ click: [[A.say('Dong... dong...', 2.5), A.operate('candle', 'off'), A.wait(0.3), A.operate('candle', 'on'), A.wait(0.4), A.operate('candle', 'off'), A.wait(0.3), A.operate('candle', 'on')]] })
      .done();
  }),
  // A garage sale: a folding table of odds and ends (a lamp, books, a vase, a teddy), a YARD SALE sign on a stake, a
  // FREE box, and a cash box whose lid opens.
  e('garage sale', 'town', 'events', () => {
    const b = m('garage sale', { edge: 'sharp' }).box([1.8, 0.05, 0.75], [0, 0.73, 0], { color: 'white' });
    for (const [x, z] of [[-0.82, 0.3], [0.82, 0.3], [-0.82, -0.3], [0.82, -0.3]]) b.stick([x, 0, z], [x, 0.71, z], 0.03, 'steel');
    b.cyl([0.16, 0.03, 0.16], [-0.65, 0.77, -0.1], { color: 'brass' }).stick([-0.65, 0.78, -0.1], [-0.65, 1.1, -0.1], 0.025, 'brass').cyl([0.3, 0.22, 0.3], [-0.65, 1.15, -0.1], { color: 'cream', taper: 0.6, edge: 'soft' });
    b.box([0.25, 0.06, 0.18], [-0.25, 0.785, 0.1], { color: 'blue' }).box([0.22, 0.06, 0.16], [-0.25, 0.845, 0.1], { color: 'red' }).box([0.24, 0.06, 0.17], [-0.25, 0.905, 0.1], { color: 'green' });
    b.cyl([0.14, 0.28, 0.14], [0.1, 0.895, -0.1], { color: 'teal', taper: 0.55, edge: 'soft' });
    b.ball([0.18, 0.2, 0.14], [0.4, 0.86, 0.05], { color: 'brown', edge: 'soft' }).ball(0.13, [0.4, 1.02, 0.05], { color: 'brown', edge: 'soft' }).pair((s) => b.ball(0.05, [0.4 + s * 0.06, 1.08, 0.05], { color: 'brown', edge: 'soft' }));
    b.box([0.24, 0.1, 0.16], [0.7, 0.81, 0.15], { color: '#5c6166', round: 0.15 }).box([0.24, 0.03, 0.16], [0.7, 0.875, 0.15], { color: '#5c6166', name: 'lid', pivot: [0.7, 0.86, 0.07], mover: { kind: 'swing', axis: 'x', amount: -100 } });
    for (const x of [-0.25, 0.1, 0.4]) b.box([0.06, 0.04, 0.005], [x, 0.84, 0.3], { color: 'yellow', noInk: true });
    b.stick([-1.2, 0, 0.6], [-1.2, 0.85, 0.6], 0.04, 'wood').label('YARD SALE', [0.6, 0.32], [-1.2, 0.95, 0.62], { color: 'yellow' });
    return b
      .box([0.45, 0.32, 0.36], [0.95, 0.16, 0.75], { color: 'tan' })
      .label('FREE', [0.28, 0.1], [0.95, 0.2, 0.935], { color: 'tan', depth: 0.004 })
      .socket('top', [0.1, 0.76, 0.2], 'top', { size: 0.4 })
      .act({ click: [[A.operate('lid', 'open'), A.say('Ka-ching! Sold!', 1.5), A.wait(1.2), A.operate('lid', 'close')]] })
      .done();
  }),
  // A garden in front of a white picket fence (3 m): raised beds of flowers and vegetables, a gate that swings, and a
  // watering can that tips.
  e('garden', 'garden', 'garden things', () => {
    const b = m('garden');
    b.box([3.4, 0.05, 2.6], [0, 0.025, 0], { color: 'grass' });
    for (const [x, c] of [[-0.85, 'flowers'], [0.85, 'veg']] as const) {
      b.box([1.3, 0.3, 1.6], [x, 0.17, 0.1], { color: 'wood', edge: 'sharp', round: 0.1 }).box([1.2, 0.04, 1.5], [x, 0.31, 0.1], { color: 'dirt' });
      for (let i = 0; i < 6; i++) {
        const px = x - 0.35 + (i % 3) * 0.35, pz = -0.3 + Math.floor(i / 3) * 0.7;
        if (c === 'flowers') b.rod([px, 0.32, pz], [px, 0.62, pz], 0.015, 'green').ball(0.11, [px, 0.65, pz], { color: ['red', 'yellow', 'purple', 'pink', 'orange', 'white'][i] }).ball(0.045, [px, 0.66, pz + 0.04], { color: 'yellow' });
        else b.ball(i % 2 ? [0.26, 0.2, 0.26] : [0.12, 0.06, 0.12], [px, 0.4, pz], { color: i % 2 ? '#7cc45a' : 'orange' }).cone([0.1, 0.2, 0.1], [px, 0.5, pz], { color: i % 2 ? '#5aa553' : '#3f9a3a' });
      }
    }
    for (let i = 0; i < 15; i++) {
      const x = -1.6 + i * 0.23;
      if (Math.abs(x) < 0.4) continue;
      b.box([0.09, 0.9, 0.025], [x, 0.45, -1.2], { color: 'white', edge: 'sharp' }).pyramid([0.09, 0.08, 0.025], [x, 0.94, -1.2], 4, { color: 'white', rot: [0, 45, 0], edge: 'sharp' });
    }
    b.pair((s) => b.box([1.25, 0.06, 0.03], [s * 1.0, 0.3, -1.22], { color: 'white', edge: 'sharp' }).box([1.25, 0.06, 0.03], [s * 1.0, 0.7, -1.22], { color: 'white', edge: 'sharp' }));
    b.box([0.7, 0.85, 0.04], [0, 0.48, -1.2], { color: 'white', edge: 'sharp', name: 'gate', pivot: [-0.38, 0.48, -1.2], mover: { kind: 'swing', axis: 'y', amount: 95 } });
    return b
      .cyl([0.22, 0.24, 0.16], [1.1, 0.17, 0.75], { color: 'green', name: 'can', pivot: [1.1, 0.05, 0.75] })
      .rod([1.0, 0.15, 0.75], [0.8, 0.32, 0.75], 0.03, 'green', { parent: 'can' })
      .torus([0.16, 0.14, 0.03], [1.12, 0.32, 0.75], { color: 'green', parent: 'can' })
      .act({
        click: [
          [A.par(A.pose('can', { rot: [0, 0, 35], dur: 0.5 }), A.effect('water_spray', { dur: 1.5 })), A.wait(1), A.pose('can', { rot: [0, 0, 0], dur: 0.5 })],
          [A.operate('gate', 'open'), A.say('Creak...', 1.2), A.wait(1.5), A.operate('gate', 'close')],
        ],
      })
      .done();
  }),
  // The twins on the zodiac plinth: two children alike as two peas; they wave and swap places.
  e('gemini (stars)', 'sky', 'zodiac', () => {
    const tw = (tag: string, x: number) => ({ f: who(`gemini ${tag}`, { h: 0.95, skin: 'skin1', hair: '#d9a441', style: 'short', top: 'orange', bottom: 'navy' }), at: [x, 0] as [number, number], tag, y: 0.12 });
    return withAct(troupe('gemini (stars)', [tw('a', -0.18), tw('b', 0.18)], (b) => zb(b, 'GEMINI')), {
      click: [
        [A.par(...handUp(['a', 'b']), A.say('Hi! Hi!', 1.5)), A.wait(1), A.par(...handUp(['a', 'b'], false))],
        [A.par(A.pose('ahips', { move: [0.36, 0, 0], dur: 0.8 }), A.pose('bhips', { move: [-0.36, 0, 0], dur: 0.8 }), A.say('Which is which?', 1.5)), A.par(A.pose('ahips', { move: [0, 0, 0], dur: 0.8 }), A.pose('bhips', { move: [0, 0, 0], dur: 0.8 }))],
      ],
    });
  }),
  // A genius: wild white hair, a lab coat and glasses, and a light bulb over the head that switches on with an idea.
  e('genius', 'ideas', 'abstract', () =>
    withAct(
      lift(who('genius', { h: 1.72, skin: 'skin1', hair: 'white', style: 'spiky', top: 'white', bottom: '#5c6166', shoes: 'black', long: true, glasses: '#2a2726', beard: '#d4d7da', acc: [wear('labcoat'), wear('bowtie', 'red')] }), 0, (b) =>
        b
          .ball([0.24, 0.26, 0.24], [0, 2.2, 0], { color: '#fff3a0', glow: true, name: 'bulb', mover: { kind: 'light', on: false } })
          .cyl([0.12, 0.1, 0.12], [0, 2.03, 0], { color: 'silver', edge: 'sharp' })
          .cyl([0.08, 0.04, 0.08], [0, 1.96, 0], { color: 'darkgray' }),
      ),
      {
        click: [
          [A.par(A.operate('bulb', 'on'), A.anim('point'), A.say('Eureka! I have it!', 2)), A.effect('sparkle', { dur: 1 })],
          [A.par(A.operate('bulb', 'off'), A.anim('shrug'), A.say('Hmm... back to the chalkboard.', 2))],
        ],
      },
    ),
  ),
  // A cartoon germ (15 cm) on a petri dish: a lime ball with knobbed spikes and a sneaky face; soap makes it shrink.
  e('germ', 'clinic', 'germs', () => {
    const b = m('germ').cyl([0.2, 0.02, 0.2], [0, 0.01, 0], { color: 'glass', edge: 'sharp' }).cyl([0.18, 0.006, 0.18], [0, 0.021, 0], { color: '#e8e0b0' });
    b.ball(0.11, [0, 0.09, 0], { color: 'lime', name: 'germ' });
    for (let k = 0; k < 10; k++) {
      const a = (k * 36 + 18) * D2R, dx = Math.cos(a), dy = Math.sin(a) * 0.9;
      b.rod([dx * 0.045, 0.09 + dy * 0.045, -0.01], [dx * 0.078, 0.09 + dy * 0.078, -0.01], 0.01, 'green', { parent: 'germ' }).ball(0.02, [dx * 0.08, 0.09 + dy * 0.08, -0.01], { color: 'purple', parent: 'germ' });
    }
    b.pair((s) => b.ball([0.03, 0.035, 0.015], [s * 0.022, 0.105, 0.05], { color: 'white', parent: 'germ' }).ball(0.014, [s * 0.02, 0.103, 0.058], { color: 'black', eye: true, noInk: true, parent: 'germ' }).box([0.03, 0.007, 0.006], [s * 0.022, 0.128, 0.05], { color: 'darkgreen', rot: [0, 0, s * 25], noInk: true, parent: 'germ' }));
    return b
      .capsule([0.012, 0.04, 0.008], [0, 0.075, 0.054], { color: 'darkred', rot: [0, 0, 90], noInk: true, parent: 'germ' })
      .act({
        click: [
          [A.par(A.anim('wobble'), A.say('Hehehe...', 1.5))],
          [A.par(A.effect('sparkle', { dur: 1.5 }), A.pose('germ', { scale: 0.35, dur: 0.6 }), A.say('Eek! Soap!', 1.5)), A.wait(1.2), A.pose('germ', { scale: 1, dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A ghost: a tall sheet ghost (1.8 m) floating above the ground, arms out, rattling a chain; it drifts up and wails.
  e('ghost', 'fantasy', 'spirits', () => {
    const b = m('ghost').cyl([0.6, 0.01, 0.45], [0, 0.005, 0], { color: '#9da3a8', noInk: true });
    b.ball([0.62, 0.62, 0.56], [0, 1.55, 0], { color: 'white', name: 'ghost' }).cyl([0.76, 0.95, 0.66], [0, 1.0, 0], { color: 'white', taper: 0.8, parent: 'ghost' });
    for (const x of [-0.27, -0.09, 0.09, 0.27]) b.cone([0.2, 0.22, 0.2], [x, 0.45, 0.05], { color: 'white', rot: [180, 0, 0], parent: 'ghost' });
    b.pair((s) => b.rod([s * 0.3, 1.25, 0], [s * 0.6, 1.05, 0.2], 0.13, 'white', { parent: 'ghost' }).ball([0.08, 0.14, 0.03], [s * 0.11, 1.6, 0.275], { color: 'black', eye: true, noInk: true, parent: 'ghost' }));
    b.ball([0.11, 0.16, 0.03], [0, 1.4, 0.28], { color: 'black', noInk: true, parent: 'ghost' });
    for (let i = 0; i < 5; i++) b.torus([0.08, 0.06, 0.02], [0.62 + i * 0.03, 0.98 - i * 0.09, 0.22], { color: 'iron', rot: [0, i % 2 ? 90 : 0, 0], parent: 'ghost' });
    return b
      .ball(0.14, [0.76, 0.48, 0.22], { color: 'iron', parent: 'ghost' })
      .act({
        click: [
          [A.par(A.pose('ghost', { move: [0, 0.4, 0], dur: 1 }), A.say('Woooooo...', 2)), A.pose('ghost', { move: [0, 0, 0], dur: 1 })],
          [A.par(A.anim('shake'), A.say('Rattle rattle!', 1.5))],
        ],
      })
      .done();
  }),
  // Glum: a slumped person with a little grey rain cloud hanging over their head.
  e('glum', 'ideas', 'emotions', () =>
    withAct(
      lift(who('glum', { h: 1.7, top: '#7f8a94', bottom: '#3d4f7a', shoes: '#3b2a1e', style: 'short', hair: '#5a3a22', long: true }), 0, (b) => {
        cloud(b, 0, 2.3, 0, 0.7, '#8f99a3');
        for (const [x, y] of [[-0.18, 2.05], [0.05, 1.98], [0.2, 2.08]]) drop(b, x, y, 0.05, 0.05, 'skyblue');
        return b;
      }),
      {
        click: [
          [A.par(A.anim('shake_head'), A.expr('sad'), A.say('Sigh... what a day.', 2)), A.wait(0.6), A.expr('neutral')],
          [A.par(A.effect('rain', { dur: 2 }), A.anim('cry'), A.expr('sad'), A.say('Even my cloud is sad.', 2)), A.wait(0.6), A.expr('neutral')],
        ],
      },
    ),
  ),
  // A football goal at its real size (7.32 m by 2.44 m) with its net, and a ball that gets kicked into it.
  e('goal', 'sports', 'goals', () => {
    const W = 7.32, H = 2.44, D = 2;
    const b = m('goal');
    b.pair((s) => {
      b.cyl([0.12, H, 0.12], [s * (W / 2 + 0.06), H / 2, 0], { color: 'white' });
      b.rod([s * (W / 2 + 0.06), H, 0], [s * (W / 2 + 0.06), 0.05, -D], 0.05, 'white').rod([s * (W / 2 + 0.06), 0.03, -D], [s * (W / 2 + 0.06), 0.03, 0], 0.05, 'white');
      b.wedge([D, H, 0.02], [s * (W / 2 + 0.06), H / 2, -D / 2], { color: '#e8eef2', rot: [0, 90, 0], apex: -0.5, noInk: true });
    });
    b.cyl([0.12, W + 0.24, 0.12], [0, H + 0.06, 0], { color: 'white', rot: [0, 0, 90] }).rod([-W / 2, 0.03, -D], [W / 2, 0.03, -D], 0.05, 'white');
    b.box([W, Math.hypot(H, D), 0.02], [0, H / 2, -D / 2], { color: '#e8eef2', rot: [Math.atan2(D, H) / D2R, 0, 0], noInk: true, name: 'net', pivot: [0, H, 0] });
    for (let i = 1; i < 8; i++) b.rod([-W / 2 + i * (W / 8), H, -0.02], [-W / 2 + i * (W / 8), 0.05, -D + 0.02], 0.02, '#c9d2d8', { parent: 'net', noInk: true });
    for (let i = 1; i < 4; i++) b.rod([-W / 2, H - (i * H) / 4, -(i * D) / 4 - 0.02], [W / 2, H - (i * H) / 4, -(i * D) / 4 - 0.02], 0.02, '#c9d2d8', { parent: 'net', noInk: true });
    b.box([W + 2, 0.02, 0.12], [0, 0.01, 0.06], { color: 'white', noInk: true });
    return b
      .ball(0.22, [0.6, 0.11, 3], { color: 'white', name: 'ball' })
      .ball([0.08, 0.08, 0.02], [0.6, 0.12, 3.11], { color: 'black', noInk: true, parent: 'ball' })
      .act({
        click: [
          [A.pose('ball', { move: [1.2, 1.2, -4.4], rot: [-720, 0, 0], dur: 0.6 }), A.par(A.pose('net', { rot: [-10, 0, 0], dur: 0.2 }), A.say('GOOOAL!', 2), A.effect('sparkle', { dur: 1.5 })), A.pose('net', { rot: [0, 0, 0], dur: 0.4 })],
          [A.pose('ball', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 })],
        ],
      })
      .done();
  }),
  // A display head with a goatee (a stick-on one: it can fall off).
  e('goatee', 'wardrobe', 'hairstyles', () =>
    mannequin('goatee', { hair: '#5a3a22', top: 'gray' }, (b, hc) => {
      b.cone([0.05, 0.065, 0.035], [0, 0.175, 0.074], { color: hc, rot: [180, 0, 0], parent: 'head', name: 'goatee', piece: true })
        .capsule([0.016, 0.06, 0.014], [0, 0.226, 0.086], { color: hc, rot: [0, 0, 90], parent: 'goatee' })
        .pair((s) => b.capsule([0.012, 0.04, 0.012], [s * 0.026, 0.205, 0.082], { color: hc, rot: [0, 0, s * 20], parent: 'goatee' }));
    })
      .act({ click: [[A.pose('goatee', { scale: 1.3, dur: 0.3 }), A.pose('goatee', { scale: 1, dur: 0.3 }), A.say('Hmm...', 1.2)], [A.detach('goatee', 'goatee'), A.say('Oops!', 1)], [A.reattach('goatee')]] })
      .done(),
  ),
  // A griffin (2.3 m): a lion's body, an eagle's white head and hooked beak, great feathered wings that beat.
  e('griffin', 'fantasy', 'creatures', () => {
    const wings: AniExtra = (p, d) => {
      const [L, Hb, W] = d.body;
      for (const s of [1, -1]) {
        const n = `wing${s > 0 ? 'L' : 'R'}`;
        p.add({ name: n, parent: 'body', at: [s * W * 0.35, Hb * 0.4, L * 0.15], rot: [0, 0, s * 35], shape: 'ball', size: [W * 0.25, L * 0.75, L * 0.45], off: [0, L * 0.35, -L * 0.1], color: col('#8a5a2b'), layer: 3 });
        for (let i = 0; i < 4; i++) p.add({ name: `${n}f${i}`, parent: n, at: [0, L * (0.45 + i * 0.08), -L * (0.12 + i * 0.07)], rot: [-20 - i * 14, 0, 0], shape: 'capsule', size: [W * 0.12, L * 0.4, W * 0.04], off: [0, L * 0.12, 0], color: col(i % 2 ? '#a06a35' : '#7a4a20'), layer: 3 });
      }
    };
    return withAct(
      beast('griffin', { color: '#d9a441', body: [2.0, 0.85, 0.75], legL: 0.75, legW: 0.18, neckL: 0.45, neckLean: 25, neckW: 0.4, head: [0.45, 0.42, 0.38], headColor: 'white', snout: { len: 0.26, h: 0.18, w: 0.16, color: 'gold', shape: 'cyl' }, nose: '#c08a20', ears: 'pointy', earSize: 0.16, earColor: 'white', tail: 'tuft', tailColor: '#8a5a2b', acc: [wings] }),
      {
        click: [
          [A.par(A.pose('wingL', { rot: [0, 0, 40], dur: 0.3 }), A.pose('wingR', { rot: [0, 0, -40], dur: 0.3 }), A.say('SCREEE!', 1.5)), A.par(A.pose('wingL', { rot: [0, 0, -10], dur: 0.3 }), A.pose('wingR', { rot: [0, 0, 10], dur: 0.3 })), A.par(A.pose('wingL', { rot: [0, 0, 40], dur: 0.3 }), A.pose('wingR', { rot: [0, 0, -40], dur: 0.3 })), A.par(A.pose('wingL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.4 }))],
          [A.par(A.anim('hop'), A.effect('dust', { dur: 1 }), A.say('Rrrah!', 1.2))],
        ],
      },
    );
  }),
  // A hail storm (11 m): a dark cloud pelting a parked car with hailstones the size of golf balls, ice piling on
  // the grass; the car alarm goes off.
  e('hail storm', 'nature', 'weather', () => {
    const b = m('hail storm').cyl([14, 0.12, 10], [0, 0.06, 0], { color: 'grass' });
    cloud(b, 0, 9.2, -1.5, 9, '#5f676e');
    b.ball(0.05, [0, 8, 0], { color: 'ice', name: 'hail' });
    for (const [x, y, z] of [[-3, 7.2, 0.5], [-1, 6.4, 1], [1.5, 7.0, 0.2], [3.5, 6.2, 0.8], [-2.2, 4.8, 1.5], [0.4, 4.4, 1.8], [2.6, 5.0, 1.2], [-3.6, 3.2, 1.0], [-0.6, 2.8, 2.2], [1.8, 3.0, 2.0], [3.8, 2.4, 1.5], [-1.8, 1.6, 2.6], [0.9, 1.4, 2.8]]) b.ball(0.18, [x, y, z], { color: 'ice', parent: 'hail' });
    for (const [x, z] of [[-3, 2.5], [-2.6, 2.9], [2.5, 3.2], [3.0, 2.8], [0.2, 3.6], [-4.2, 1.2], [4.4, 1.6], [-1.2, 3.8]]) b.ball(0.16, [x, 0.18, z], { color: 'ice' });
    const z = 1.2;
    b.loft([1.8, 1.45, 4.5], [0, 0.75, z], [[0, 0.85, 0.55, -0.15], [0.12, 0.95, 0.65, -0.1], [0.3, 1, 1, 0.12], [0.62, 1, 1, 0.12], [0.78, 1, 0.65, -0.08], [1, 0.9, 0.5, -0.16]], { color: '#4e8fd6', boxy: 0.7, rot: [0, 90, 0], name: 'car' })
      .box([1.6, 0.42, 1.85], [-0.15, 1.2, z], { color: '#2f3d52', parent: 'car', edge: 'sharp', round: 0.3 });
    for (const x of [-1.4, 1.4]) for (const dz of [-0.82, 0.82]) b.cyl([0.65, 0.22, 0.65], [x, 0.33, z + dz], { color: 'rubber', rot: [90, 0, 0], parent: 'car', name: `wheel${x > 0 ? 'f' : 'b'}${dz > 0 ? 'l' : 'r'}` });
    b.pair((s) => b.ball([0.08, 0.14, 0.24], [2.24, 0.75, z + s * 0.6], { color: '#ffd24a', glow: true, parent: 'car', name: `light${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false } }));
    return b
      .act({
        click: [
          [A.par(A.pose('hail', { move: [0, -1.2, 0.4], dur: 1.5 }), A.say('Clack clack clack!', 1.5)), A.par(A.operate('light', 'on'), A.say('Wee-woo! Wee-woo!', 2)), A.wait(0.4), A.operate('light', 'off'), A.wait(0.4), A.operate('light', 'on'), A.wait(0.4), A.par(A.operate('light', 'off'), A.pose('hail', { move: [0, 0, 0], dur: 0.01 }))],
        ],
      })
      .done();
  }),
  // Hang in there: a person hanging from a playground bar by both hands (bar 2.5 m up), kicking their legs.
  e('hang', 'ideas', 'sayings', () =>
    withAct(
      lift(who('hang', { h: 1.7, top: 'yellow', bottom: 'denim', hair: 'brown', skin: 'skin3', style: 'short', pose: 'arms_up' }), 0.5, (b) => {
        b.pair((s) => b.cyl([0.08, 2.7, 0.08], [s * 0.9, 1.35, 0], { color: '#4e8fd6' }).cyl([0.3, 0.06, 0.3], [s * 0.9, 0.03, 0], { color: '#4e8fd6' }));
        return b.cyl([0.05, 1.86, 0.05], [0, 2.55, 0], { color: 'silver', rot: [0, 0, 90] }).box([1.6, 0.04, 1.0], [0, 0.02, 0], { color: '#c9a26a', round: 0.3 });
      }),
      { click: [[A.par(A.pose('legL', { rot: [-45, 0, 0], dur: 0.3 }), A.pose('legR', { rot: [-45, 0, 0], dur: 0.3 }), A.say('Hang in there!', 2)), A.par(A.pose('legL', { rot: [10, 0, 0], dur: 0.4 }), A.pose('legR', { rot: [10, 0, 0], dur: 0.4 })), A.par(A.pose('legL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('legR', { rot: [0, 0, 0], dur: 0.3 }))]] },
    ),
  ),
  // Hangman as it is played in class: a chalkboard on an easel with the gallows, a stick man missing his last leg,
  // the blanks of the word and the wrong letters; the chalk draws the leg, then rubs it out.
  e('hangman', 'toys', 'word games', () => {
    const b = m('hangman', { edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.5, 0, 0.22], [s * 0.4, 1.75, 0.0], 0.045, 'wood', { edge: 'soft' }));
    b.rod([0, 0, -0.5], [0, 1.6, -0.05], 0.045, 'wood', { edge: 'soft' })
      .box([1.3, 0.95, 0.04], [0, 1.25, 0.05], { color: '#2f4a3a', round: 0.05 })
      .box([1.38, 1.03, 0.03], [0, 1.25, 0.03], { color: 'wood', round: 0.1 })
      .box([1.2, 0.04, 0.08], [0, 0.75, 0.1], { color: 'wood' });
    const z = 0.075, ch = '#f2f2ea', L = (a: Vec3, c: Vec3, o: O = {}) => b.stick(a, c, 0.014, ch, { noInk: true, ...o });
    L([-0.5, 0.9, z], [-0.2, 0.9, z]);
    L([-0.4, 0.9, z], [-0.4, 1.62, z]);
    L([-0.4, 1.62, z], [-0.1, 1.62, z]);
    L([-0.1, 1.62, z], [-0.1, 1.54, z]);
    b.torus([0.1, 0.1, 0.012], [-0.1, 1.49, z], { color: ch, tube: 0.14, noInk: true });
    L([-0.1, 1.44, z], [-0.1, 1.26, z]);
    L([-0.1, 1.4, z], [-0.17, 1.32, z]);
    L([-0.1, 1.4, z], [-0.03, 1.32, z]);
    L([-0.1, 1.26, z], [-0.16, 1.14, z]);
    L([-0.1, 1.26, z], [-0.04, 1.14, z], { name: 'leg', scale: 0 });
    for (let i = 0; i < 5; i++) L([0.08 + i * 0.1, 0.95, z], [0.15 + i * 0.1, 0.95, z]);
    b.label('A', [0.06, 0.07], [0.215, 1.0, z], { color: '#2f4a3a', depth: 0.004 }).label('Q  Z  X', [0.3, 0.07], [0.33, 1.5, z], { color: '#2f4a3a', depth: 0.004 });
    return b
      .box([0.06, 0.015, 0.015], [0.4, 0.785, 0.12], { color: 'white' })
      .act({ click: [[A.par(A.pose('leg', { scale: 1, dur: 0.6 }), A.say('Squeak squeak!', 1.2))], [A.par(A.pose('leg', { scale: 0, dur: 0.4 }), A.effect('dust', { dur: 0.8 }), A.say('Swish.', 1))]] })
      .done();
  }),
  // Heaven: pearly gates (3 m) standing on clouds, golden rays behind them and a halo above; the gates swing open.
  e('heaven', 'fantasy', 'afterlife', () => {
    const b = m('heaven');
    for (const [x, z, s] of [[-1.4, 0, 1.3], [0, 0.3, 1.6], [1.4, 0, 1.3], [-0.8, -0.6, 1.2], [0.8, -0.6, 1.2], [-2.2, 0.4, 0.9], [2.2, 0.4, 0.9]]) b.ball([s, s * 0.5, s * 0.9], [x, s * 0.2, z], { color: 'white' });
    for (let k = 0; k < 9; k++) {
      const a = (10 + k * 20) * D2R;
      b.box([0.12, 1.2, 0.03], [Math.cos(a) * 1.7, 1.5 + Math.sin(a) * 1.7, -0.6], { color: '#fff3a0', glow: true, noInk: true, rot: [0, 0, a / D2R - 90] });
    }
    b.pair((s) => b.cyl([0.35, 2.6, 0.35], [s * 1.0, 1.7, 0], { color: '#f4efe6', edge: 'sharp' }).ball(0.4, [s * 1.0, 3.1, 0], { color: 'gold', edge: 'sharp' }));
    b.arc([2.1, 1.1, 0.1], [0, 2.9, 0], { color: 'gold', tube: 0.1 });
    b.pair((s) => {
      const n = `gate${s > 0 ? 'L' : 'R'}`;
      b.box([0.82, 0.06, 0.05], [s * 0.42, 2.7, 0.0], { color: 'gold', name: n, pivot: [s * 0.82, 1.6, 0.0], mover: { kind: 'swing', axis: 'y', amount: s * 100 }, edge: 'sharp' })
        .box([0.82, 0.06, 0.05], [s * 0.42, 0.5, 0.0], { color: 'gold', parent: n, edge: 'sharp' });
      for (let i = 0; i < 5; i++) b.cyl([0.04, 2.2, 0.04], [s * (0.08 + i * 0.17), 1.6, 0.0], { color: 'gold', parent: n });
      b.heart(0.22, [s * 0.42, 1.65, 0.03], { color: 'gold', parent: n });
    });
    return b
      .torus([0.55, 0.55, 0.06], [0, 3.55, 0.2], { color: 'gold', glow: true, rot: [70, 0, 0], tube: 0.12 })
      .act({ click: [[A.operate('gate', 'open'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Ahhhhh~', 2.5)), A.wait(2.5), A.operate('gate', 'close')]] })
      .done();
  }),
  // Hell: a rocky pit (3 m across) cracked with glowing lava, jagged black spires, flames, and a devil's pitchfork
  // stuck in the ground; it flares up with a hiss.
  e('hell', 'fantasy', 'afterlife', () => {
    const b = m('hell').cyl([3.2, 0.3, 2.6], [0, 0.15, 0], { color: '#3a1a14' }).cyl([1.8, 0.04, 1.3], [0.2, 0.31, 0.2], { color: 'orange', glow: true, name: 'lava', mover: { kind: 'light', on: true } });
    for (const [x, z, r] of [[-0.9, 0.6, 30], [0.9, -0.5, -20], [1.1, 0.7, 60]]) b.box([0.9, 0.02, 0.06], [x, 0.31, z], { color: '#ff6a2a', glow: true, rot: [0, r, 0], noInk: true });
    for (const [x, z, h] of [[-1.2, -0.6, 1.6], [1.1, -0.8, 1.3], [-0.8, 0.9, 0.8], [1.3, 0.5, 0.9], [-1.4, 0.2, 1.1]]) b.cone([0.5, h, 0.5], [x, 0.3 + h / 2, z], { color: '#2a1a14', segs: 5 });
    b.cone([0.6, 1.1, 0.6], [0, 0.85, 0], { color: 'orange', glow: true, name: 'flames', pivot: [0, 0.3, 0] });
    for (const [x, z, h, c] of [[0.3, 0.2, 0.8, 'red'], [-0.3, 0.1, 0.7, 'red'], [0.1, -0.2, 0.6, 'yellow'], [-0.1, 0.35, 0.5, 'yellow']] as const) b.cone([0.35, h, 0.35], [x, 0.3 + h / 2, z], { color: c, glow: true, parent: 'flames' });
    b.stick([0.9, 0.3, 0.9], [0.8, 1.9, 0.75], 0.05, '#5a1a14');
    for (const dx of [-0.1, 0, 0.1]) b.cone([0.05, 0.22, 0.05], [0.8 + dx, 2.0, 0.75], { color: 'darkred' });
    return b
      .box([0.26, 0.04, 0.04], [0.8, 1.9, 0.75], { color: 'darkred' })
      .act({
        click: [
          [A.par(A.pose('flames', { scale: 1.5, dur: 0.3 }), A.effect('fire', { dur: 2 }), A.say('Hisssss!', 1.5)), A.pose('flames', { scale: 1, dur: 0.6 })],
          [A.operate('lava', 'off'), A.wait(0.3), A.par(A.operate('lava', 'on'), A.effect('smoke', { dur: 2 }), A.say('Blub... blub...', 1.5))],
        ],
      })
      .done();
  }),
  // A hole dug in a lawn (70 cm across): a dark pit in a ring of dirt, a heap of earth with a spade lying on it; a
  // mole pops up.
  e('hole', 'nature', 'landforms', () =>
    m('hole')
      .cyl([1.6, 0.03, 1.2], [0, 0.015, 0], { color: 'grass' })
      .cyl([0.5, 0.02, 0.5], [0, 0.03, 0], { color: '#1a1614', noInk: true })
      .torus([0.72, 0.72, 0.1], [0, 0.05, 0], { color: 'dirt', rot: [90, 0, 0], tube: 0.25 })
      .dome([0.55, 0.22, 0.45], [0.55, 0.11, -0.2], { color: 'dirt' })
      .box([0.2, 0.025, 0.24], [0.5, 0.25, -0.15], { color: 'iron', rot: [0, 30, 12], round: 0.4, edge: 'sharp' })
      .rod([0.42, 0.24, 0.0], [0.15, 0.17, 0.45], 0.035, 'wood')
      .ball([0.16, 0.14, 0.18], [0, 0.02, 0], { color: '#4a3a32', name: 'mole', mover: { kind: 'slide', axis: 'y', amount: 0.16 } })
      .ball([0.06, 0.05, 0.06], [0, 0.04, 0.09], { color: 'pink', parent: 'mole' })
      .socket('hole', [0, 0.03, 0], 'inside', { size: 0.4 })
      .act({ click: [[A.operate('mole', 'up'), A.say('!', 1), A.wait(1.2), A.operate('mole', 'down'), A.effect('dust', { dur: 0.8 })]] })
      .done(),
  ),
  // A holly tree (2.8 m): a dark, glossy, cone-shaped evergreen with spiky leaves and bunches of red berries.
  e('holly', 'garden', 'trees', () => {
    const b = m('holly').cyl([0.2, 0.6, 0.2], [0, 0.3, 0], { color: 'bark' });
    b.ball([1.7, 1.2, 1.7], [0, 1.0, 0], { color: '#2f5f2a', name: 'top', pivot: [0, 0.5, 0] });
    for (const [x, y, z, s] of [[0, 1.65, 0, 1.3], [0.1, 2.2, 0.05, 0.9], [0, 2.6, 0, 0.5], [-0.45, 1.3, 0.3, 0.9], [0.45, 1.25, -0.2, 0.9]]) b.ball([s, s * 0.85, s], [x, y, z], { color: '#2f5f2a', parent: 'top' });
    for (const [x, y, z] of [[0.6, 1.0, 0.5], [-0.5, 1.4, 0.55], [0.2, 1.8, 0.55], [0.45, 2.2, 0.25], [-0.2, 0.8, 0.75], [-0.1, 2.5, 0.2], [-0.7, 1.0, 0.0]]) {
      for (const [dx, dy] of [[0, 0], [0.06, 0.04], [-0.04, 0.06]]) b.ball(0.08, [x + dx, y + dy, z], { color: 'red', parent: 'top' });
      for (const r of [-30, 30]) b.star(0.16, [x + (r > 0 ? 0.1 : -0.1), y - 0.05, z - 0.02], { color: '#3f7a3a', rot: [70, 0, r], parent: 'top' });
    }
    return b
      .act({ click: [[A.par(A.pose('top', { rot: [0, 0, 6], dur: 0.3 }), A.effect('sparkle', { dur: 1.2 }), A.say('Fa la la la la!', 2)), A.pose('top', { rot: [0, 0, -4], dur: 0.3 }), A.pose('top', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done();
  }),
  // Homework on a child's desk: a worksheet and an open exercise book, a pencil, textbooks, a schoolbag and a desk
  // lamp. The lamp clicks on; then the dog eats the homework.
  e('homework', 'study', 'school', () => {
    const b = m('homework', { edge: 'sharp' }).box([1.0, 0.04, 0.55], [0, 0.72, 0], { color: 'lightwood' });
    for (const [x, z] of [[-0.46, 0.24], [0.46, 0.24], [-0.46, -0.24], [0.46, -0.24]]) b.box([0.04, 0.7, 0.04], [x, 0.35, z], { color: '#4e8fd6' });
    b.box([0.21, 0.005, 0.29], [-0.18, 0.743, 0.06], { color: 'white', rot: [0, 6, 0], name: 'sheet' });
    for (let i = 0; i < 5; i++) b.box([0.15, 0.002, 0.008], [-0.18, 0.747, -0.04 + i * 0.045], { color: 'skyblue', noInk: true, parent: 'sheet', rot: [0, 6, 0] });
    b.box([0.2, 0.012, 0.27], [0.06, 0.746, 0.05], { color: 'white', rot: [0, 0, 4] }).box([0.2, 0.012, 0.27], [0.25, 0.746, 0.05], { color: 'white', rot: [0, 0, -4] });
    b.cyl([0.012, 0.18, 0.012], [-0.05, 0.755, 0.15], { color: 'yellow', rot: [90, 50, 0], segs: 6, name: 'pencil' });
    b.box([0.24, 0.05, 0.18], [0.35, 0.765, -0.15], { color: 'red' }).box([0.22, 0.05, 0.17], [0.35, 0.815, -0.15], { color: 'blue' }).box([0.23, 0.04, 0.16], [0.35, 0.86, -0.15], { color: 'green' });
    b.cyl([0.14, 0.02, 0.14], [-0.38, 0.75, -0.18], { color: '#2a2726' }).rod([-0.38, 0.75, -0.18], [-0.34, 1.05, -0.2], 0.02, '#2a2726').rod([-0.34, 1.05, -0.2], [-0.24, 1.1, -0.08], 0.02, '#2a2726')
      .cyl([0.14, 0.1, 0.14], [-0.22, 1.08, -0.06], { color: '#2a2726', taper: 0.5, rot: [-30, 0, 0] })
      .ball(0.06, [-0.21, 1.03, -0.04], { color: '#fff3a0', glow: true, name: 'bulb', mover: { kind: 'light', on: false }, edge: 'soft' });
    return b
      .box([0.34, 0.42, 0.18], [-0.75, 0.21, 0.15], { color: 'orange', round: 0.4, edge: 'soft' })
      .box([0.24, 0.16, 0.05], [-0.75, 0.15, 0.25], { color: 'darkred', round: 0.4, edge: 'soft' })
      .socket('top', [0.1, 0.745, -0.1], 'top', { size: 0.3 })
      .act({
        click: [
          [A.operate('bulb', 'on'), A.par(A.pose('pencil', { move: [0.05, 0, -0.03], dur: 0.3 }), A.say('Scribble scribble...', 1.5)), A.pose('pencil', { move: [0, 0, 0], dur: 0.3 })],
          [A.spawn('dog', 'dog', { rel: 'front', of: 'self', dist: 'close' }), A.par(A.pose('sheet', { scale: 0, dur: 0.4 }), A.say('Woof! Chomp chomp!', 1.5)), A.wait(1), A.remove('dog', 'fade'), A.par(A.pose('sheet', { scale: 1, dur: 0.4 }), A.operate('bulb', 'off'))],
        ],
      })
      .done();
  }),
  // A hurricane (11 m): the spiral of cloud bands turning round a clear eye above a beach, palm trees bent double,
  // big waves and a boarded-up beach hut.
  e('hurricane', 'nature', 'weather', () => {
    const b = m('hurricane').cyl([16, 0.2, 12], [0, 0.1, 0], { color: 'water' }).dome([16, 0.6, 5], [0, 0.4, -3.5], { color: 'sand' });
    for (const [x, z] of [[-5, 3], [-1, 4], [3, 3.5], [6, 4.5]]) b.ball([2.4, 0.9, 0.9], [x, 0.4, z], { color: 'white', noInk: true });
    palm(b, -5, -4, 6, 'green');
    palm(b, 4.5, -4.5, 5.5, 'green');
    b.box([3, 2.4, 2.4], [0, 1.6, -4.2], { color: '#e8d29a', edge: 'sharp' });
    gable(b, 3, 2.4, 2.8, 1.0, '#a3322a', { z: -4.2 });
    for (const x of [-0.8, 0.8]) for (const r of [30, -30]) b.box([1.0, 0.12, 0.05], [x, 1.7, -2.98], { color: 'wood', rot: [0, 0, r], edge: 'sharp' });
    const c: Vec3 = [0, 9.2, -2];
    b.cyl([1.2, 1.0, 1.2], c, { color: '#9fb8c8', name: 'spiral', mover: { kind: 'spin', axis: 'y', amount: 60, on: true } });
    for (const k of [0, 120, 240]) {
      const pts = Array.from({ length: 9 }, (_, i) => {
        const a = (k + i * 28) * D2R, r = 0.8 + i * 0.5;
        return [c[0] + Math.cos(a) * r, c[1] - i * 0.05, c[2] + Math.sin(a) * r] as Vec3;
      });
      for (let i = 0; i + 1 < pts.length; i++) b.rod(pts[i], pts[i + 1], 1.3 - i * 0.1, i % 2 ? '#d8e2e8' : 'white', { parent: 'spiral' });
    }
    return b
      .act({ click: [[A.par(A.pose('spiral', { spin: [0, 240, 0] }), A.effect('rain', { dur: 3 }), A.say('WHOOOOOSH!', 2)), A.effect('water_spray', { dur: 1.5 }), A.wait(1.5), A.pose('spiral', { spin: [0, 60, 0] })]] })
      .done();
  }),
  // "I see what you did there": a knowing person with a smirk, pointing, then winking.
  e('i see what you did there', 'ideas', 'sayings', () =>
    withAct(who('i see what you did there', { h: 1.75, top: '#3fa7a0', bottom: '#3d4f7a', style: 'short', hair: 'black', skin: 'skin3', glasses: '#2a2726', pose: 'point' }), {
      click: [[A.par(A.anim('point'), A.say('I see what you did there.', 2))], [A.par(A.anim('wink'), A.say('Very clever.', 1.5))]],
    }),
  ),
  // The Illuminati sign: a stone pyramid (1.7 m) whose golden capstone with the all-seeing eye lifts off and glows.
  e('illuminati', 'ideas', 'symbols', () => {
    const b = m('illuminati', { edge: 'sharp' })
      .pyramid([1.4, 1.2, 1.4], [0, 0.6, 0], 4, { color: 'sand', taper: 0.36 });
    b.pyramid([0.5, 0.45, 0.5], [0, 1.45, 0], 4, { color: 'gold', name: 'cap' })
      .ball([0.16, 0.1, 0.03], [0, 1.4, 0.13], { color: 'white', rot: [-25, 0, 0], parent: 'cap', edge: 'soft' })
      .ball([0.06, 0.06, 0.02], [0, 1.4, 0.143], { color: '#2a2726', eye: true, noInk: true, parent: 'cap' });
    for (let k = 0; k < 9; k++) {
      const a = (10 + k * 20) * D2R;
      b.box([0.04, 0.35, 0.02], [Math.cos(a) * 0.55, 1.42 + Math.sin(a) * 0.55, -0.05], { color: 'yellow', glow: true, noInk: true, rot: [0, 0, a / D2R - 90], parent: 'cap', name: `ray${k}`, mover: { kind: 'light', on: false } });
    }
    return b
      .act({
        click: [
          [A.par(A.pose('cap', { move: [0, 0.35, 0], dur: 0.8 }), A.operate('ray', 'on')), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('We see you.', 2))],
          [A.par(A.pose('cap', { move: [0, 0, 0], dur: 0.8 }), A.operate('ray', 'off'))],
        ],
      })
      .done();
  }),
  // Insulin from the pharmacy: a vial with its orange cap, an insulin pen in a stand (its cap comes off and the dose
  // dial clicks) and the box.
  e('insulin', 'clinic', 'medicine', () =>
    m('insulin')
      .box([0.1, 0.08, 0.07], [-0.1, 0.04, -0.03], { color: 'white', edge: 'sharp', round: 0.1 })
      .label('INSULIN', [0.08, 0.025], [-0.1, 0.05, 0.006], { color: 'white', depth: 0.004 })
      .box([0.1, 0.015, 0.072], [-0.1, 0.06, -0.03], { color: '#4e8fd6', edge: 'sharp', round: 0 })
      .cyl([0.03, 0.05, 0.03], [0.0, 0.025, 0.04], { color: 'glass' })
      .cyl([0.031, 0.022, 0.031], [0.0, 0.03, 0.04], { color: 'white', noInk: true })
      .cyl([0.022, 0.012, 0.022], [0.0, 0.056, 0.04], { color: 'silver' })
      .cyl([0.026, 0.01, 0.026], [0.0, 0.066, 0.04], { color: 'orange' })
      .cyl([0.06, 0.02, 0.06], [0.08, 0.01, 0.0], { color: '#5c6166', edge: 'sharp' })
      .cyl([0.018, 0.13, 0.018], [0.08, 0.085, 0.0], { color: '#4e8fd6', name: 'pen' })
      .box([0.008, 0.02, 0.004], [0.08, 0.1, 0.009], { color: 'white', parent: 'pen', noInk: true })
      .cyl([0.022, 0.02, 0.022], [0.08, 0.16, 0.0], { color: 'darkgray', parent: 'pen', name: 'dial' })
      .cyl([0.02, 0.05, 0.02], [0.08, 0.195, 0.0], { color: 'lightgray', parent: 'pen', name: 'cap', piece: true })
      .act({
        click: [
          [A.detach('cap', 'cap'), A.par(A.pose('dial', { rot: [0, 180, 0], dur: 0.6 }), A.say('Click click click.', 1.5))],
          [A.reattach('cap'), A.pose('dial', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done(),
  ),
  // The letter J as a chunky blue glyph (30 cm) on a plinth; it jumps.
  e('j (letter)', 'ideas', 'letters', () => {
    const b = m('j (letter)').box([0.26, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood', edge: 'sharp', round: 0.3 });
    const t = 0.05, g = (x: number, y: number): Vec3 => [x, 0.04 + y, 0];
    path(b, [g(-0.05, 0.3), g(0.1, 0.3)], t, 'blue');
    path(b, [g(0.04, 0.3), g(0.04, 0.1), ...ell(-0.025, 0.1, 0.065, 0.075, 0, -180, 6).map(([x, y]) => g(x, y)), g(-0.09, 0.13)], t, 'blue');
    return b.act({ click: [[A.par(A.anim('hop'), A.say('J!', 1))], [A.anim('bounce', 2)]] }).done();
  }),
  // A planetarium Jupiter (3 m): banded cloud stripes and the Great Red Spot, with its four big moons on an orrery
  // arm that sets off round it.
  e('jupiter', 'sky', 'planets', () => {
    const b = orb('jupiter', 2.6, 1.85, '#e3c99a', { spin: 40 });
    for (const [h, c] of [[0.85, '#b07a4a'], [0.4, '#d9a46a'], [-0.15, '#a0623a'], [-0.65, '#c99060'], [1.15, '#c9b08a'], [-1.05, '#b88a5a']] as const) {
      const d = 2 * Math.sqrt(1.69 - h * h) + 0.03;
      b.torus([d, d, 0.24], [0, 1.85 + h, 0], { color: c, rot: [90, 0, 0], tube: 0.05, noInk: true, parent: 'globe' });
    }
    b.ball([0.55, 0.3, 0.14], [0.55, 1.55, 1.13], { color: '#c0503a', noInk: true, rot: [0, 25, 0], parent: 'globe' });
    b.cyl([0.24, 0.1, 0.24], [0, 0.4, 0], { color: 'brass', name: 'moons', mover: { kind: 'spin', axis: 'y', amount: 60 }, edge: 'sharp' });
    ([[1.0, 0.16, '#e8d070'], [1.3, 0.14, '#c8b8a0'], [1.6, 0.2, '#a09080'], [1.9, 0.18, '#706860']] as const).forEach(([r, s, c], i) => {
      const a = (i * 95 + 30) * D2R, x = Math.cos(a) * r, z = Math.sin(a) * r;
      b.stick([0, 0.4, 0], [x, 0.4, z], 0.025, 'brass', { parent: 'moons' }).stick([x, 0.4, z], [x, 0.55, z], 0.02, 'brass', { parent: 'moons' }).ball(s, [x, 0.55 + s / 2, z], { color: c, parent: 'moons' });
    });
    return b.act({ click: [[A.operate('moons', 'on'), A.par(A.pose('globe', { spin: [0, 160, 0] }), A.effect('sparkle', { dur: 1.5 })), A.wait(3), A.par(A.operate('moons', 'off'), A.pose('globe', { spin: [0, 40, 0] }))]] }).done();
  }),
  // Real size wins over the vocabulary's 1 m: Kingston, Jamaica: a Georgian great house like Devon House (white
  // walls, wide verandas, a red hipped roof) between royal palms, the flag flying on a pole.
  e('kingston', 'places', 'cities', () => {
    const W = 16, D = 10, H = 7, zf = D / 2;
    const b = m('kingston', { edge: 'sharp' });
    b.box([W + 6, 0.12, D + 8], [0, 0.06, 2], { color: '#8ab04c' }).box([3, 0.13, 8], [0, 0.065, zf + 4], { color: '#d9c8a8' });
    b.box([W, H, D], [0, H / 2 + 0.6, 0], { color: '#f7f5ef', round: 0.02 }).box([W + 0.2, 0.6, D + 0.2], [0, 0.3, 0], { color: 'stone' });
    b.pyramid([W * 1.15, 3.2, D * 1.3], [0, H + 0.6 + 1.6, 0], 4, { color: '#b5483a', rot: [0, 45, 0], taper: 0.3 });
    b.box([W - 1, 0.3, 2.4], [0, 3.6, zf + 1.2], { color: '#f7f5ef' }).box([W - 0.8, 0.25, 2.6], [0, H + 0.4, zf + 1.3], { color: '#b5483a' });
    for (let i = 0; i < 8; i++) b.cyl([0.22, H - 0.2, 0.22], [-W / 2 + 1 + i * ((W - 2) / 7), H / 2 + 0.6, zf + 2.3], { color: 'white', edge: 'soft' });
    for (const y of [4.6]) b.box([W - 1, 0.7, 0.06], [0, y, zf + 2.4], { color: 'white' });
    door(b, 0, zf, { w: 1.3, h: 2.6, y: 0.6, color: '#3f6a3a', frame: 'white' });
    for (const x of [-5.6, -3.0, 3.0, 5.6]) {
      b.box([1.2, 2.0, 0.08], [x, 1.9, zf + 0.04], { color: '#3f6a3a' });
      b.box([1.2, 1.8, 0.08], [x, 5.4, zf + 0.04], { color: '#3f6a3a' });
    }
    for (const x of [-11, 11]) {
      b.cyl([0.5, 12, 0.5], [x, 6, 4], { color: '#c9c2b0', taper: 0.7, edge: 'soft' });
      around(8, 1.6, 0.2).forEach(([lx, lz], i) => b.ball([3.4, 0.25, 0.9], [x + lx, 11.8, 4 + lz], { color: '#3f8a3a', rot: [0, -(0.2 + (i / 8) * Math.PI * 2) / D2R, -25], edge: 'soft' }));
    }
    b.stick([7, 0.12, 9], [7, 9, 9], 0.14, 'silver').box([2.4, 1.2, 0.05], [8.2, 8.3, 9], { color: '#139a43', name: 'flag', pivot: [7, 8.3, 9] });
    for (const r of [27, -27]) b.box([2.7, 0.22, 0.02], [8.2, 8.3, 9.03], { color: '#f6d24a', rot: [0, 0, r], parent: 'flag', noInk: true });
    return b
      .label('KINGSTON', [4, 0.8], [0, 1.0, zf + 7.5], { color: '#139a43' })
      .act({
        click: [
          [A.par(A.pose('flag', { rot: [0, 30, 0], dur: 0.5 }), A.say('Flap flap!', 1.5)), A.pose('flag', { rot: [0, -20, 0], dur: 0.6 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.5 })],
          [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // The kraken (12 m): a giant octopus rising from the sea, huge yellow eyes, eight tentacles curling up into the
  // air and round a little sailing ship.
  e('kraken', 'fantasy', 'sea monsters', () => {
    const k = '#b03a5a', s2 = '#d97a8a';
    const b = m('kraken').cyl([18, 0.3, 14], [0, 0.15, 0], { color: 'water' });
    b.ball([4.2, 6.5, 4.0], [0, 5.0, -2], { color: k, name: 'body' }).ball([4.4, 1.6, 4.2], [0, 1.0, -2], { color: k, parent: 'body' });
    b.pair((s) => b.ball(1.1, [s * 1.1, 3.6, -0.15], { color: 'yellow', parent: 'body' }).box([0.18, 0.7, 0.12], [s * 1.1, 3.6, 0.42], { color: 'black', eye: true, parent: 'body' }));
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 + 22) * D2R, dx = Math.cos(a), dz = Math.sin(a), n = `arm${i}`, up = i % 2 ? 1 : 0.7;
      const P = (r: number, y: number): Vec3 => [dx * r, y, -2 + dz * r];
      const pts = [P(1.8, 0.6), P(3.6, 1.6 + up), P(5.0, 4.0 * up + 1), P(5.4, 6.2 * up + 1), P(4.8, 7.6 * up + 1), P(4.2, 7.0 * up + 1)];
      b.ball(0.9, pts[0], { color: k, name: n, pivot: pts[0], parent: 'body' });
      for (let j = 0; j + 1 < pts.length; j++) b.rod(pts[j], pts[j + 1], 0.9 - j * 0.15, k, { parent: n });
      for (let j = 1; j < 4; j++) b.ball(0.25, [pts[j][0] - dx * 0.35, pts[j][1], pts[j][2] - dz * 0.35], { color: s2, parent: n, noInk: true });
    }
    b.loft([2, 1.2, 6], [5, 0.6, 4], [[0, 0.7, 0.8, 0.1], [0.4, 1, 1, 0], [1, 0.1, 1, 0.05]], { color: '#8a5a35', cut: 'bottom', boxy: 0.3, name: 'ship', rot: [0, 20, 0] })
      .stick([5, 1.1, 4], [5, 6, 4], 0.15, 'darkwood', { parent: 'ship' })
      .ball([2.4, 2.0, 0.3], [5.1, 4, 4], { color: 'cream', rot: [0, 20, 0], parent: 'ship' });
    return b
      .act({
        click: [
          [A.par(A.pose('arm1', { rot: [0, 0, 15], dur: 0.6 }), A.pose('arm3', { rot: [0, 0, -15], dur: 0.6 }), A.pose('arm5', { rot: [15, 0, 0], dur: 0.6 }), A.pose('ship', { rot: [0, 0, 12], dur: 0.6 }), A.say('RRRAAARGH!', 2), A.effect('water_spray', { dur: 2 })), A.par(A.pose('arm1', { rot: [0, 0, 0], dur: 0.8 }), A.pose('arm3', { rot: [0, 0, 0], dur: 0.8 }), A.pose('arm5', { rot: [0, 0, 0], dur: 0.8 }), A.pose('ship', { rot: [0, 0, 0], dur: 0.8 }))],
          [A.pose('body', { move: [0, -3, 0], dur: 1.2 }), A.effect('water_spray', { dur: 1 }), A.wait(1), A.pose('body', { move: [0, 0, 0], dur: 1.2 })],
        ],
      })
      .done();
  }),
  // A lake at its real size (16 m across, reeds to 1.1 m): a reedy shore, lily pads, rocks, a wooden jetty with a
  // rowboat tied up; a fish jumps.
  e('lake', 'nature', 'water', () => {
    const b = m('lake').cyl([20, 0.06, 15], [0, 0.03, 0], { color: 'grass' }).cyl([16, 0.08, 11], [0, 0.06, 0], { color: 'water' });
    for (const [x, z] of [[-7.2, 1], [-7, 2.2], [-6.6, 3.2], [6.8, -2.5], [7.2, -1.2], [-6.8, -2.8], [5, 4.6], [6, 3.8]]) for (const d of [-0.2, 0, 0.2]) b.stick([x + d, 0.06, z + d * 0.5], [x + d * 1.4, 0.85 + d, z + d * 0.5], 0.025, 'darkgreen').capsule([0.06, 0.2, 0.06], [x + d * 1.4, 0.8 + d, z + d * 0.5], { color: 'darkbrown' });
    for (const [x, z] of [[-2, 2], [-1.2, 2.6], [2.5, -1.5], [3.2, -0.6], [1.2, 3.2]]) b.cyl([0.6, 0.02, 0.6], [x, 0.11, z], { color: '#5aa553' }).ball(0.15, [x + 0.12, 0.15, z], { color: 'pink' });
    for (const [x, z, s] of [[6.5, 2, 0.8], [7.2, 1.2, 0.5], [-5.5, -3.8, 0.7]]) b.ball([s, s * 0.5, s * 0.8], [x, 0.15, z], { color: 'rock' });
    b.box([1.4, 0.1, 5], [-3.5, 0.6, -3], { color: 'wood', edge: 'sharp' });
    for (const [x, z] of [[-4.1, -5], [-2.9, -5], [-4.1, -1], [-2.9, -1]]) b.stick([x, 0, z], [x, 0.75, z], 0.15, 'darkwood');
    b.loft([1.1, 0.5, 3.2], [-1.8, 0.25, -2.4], [[0, 0.6, 0.8, 0.1], [0.4, 1, 1, 0], [1, 0.15, 0.9, 0.05]], { color: '#b5814e', cut: 'bottom', boxy: 0.3, name: 'boat' }).box([1.0, 0.05, 0.3], [-1.8, 0.45, -2.4], { color: 'darkwood', parent: 'boat', edge: 'sharp' });
    return b
      .ball([0.2, 0.18, 0.5], [1.5, -0.05, 0.5], { color: 'orange', name: 'fish' })
      .cone([0.25, 0.2, 0.05], [1.5, -0.05, 0.22], { color: 'orange', rot: [-90, 0, 0], parent: 'fish' })
      .socket('seat', [-1.8, 0.45, -2.4], 'seat', { part: 'boat' })
      .act({ click: [[A.par(A.pose('fish', { move: [0, 0.9, 0.4], rot: [-60, 0, 0], dur: 0.4 }), A.say('Splash!', 1.2)), A.pose('fish', { move: [0, 0, 0.8], rot: [60, 0, 0], dur: 0.4 }), A.effect('water_spray', { dur: 1 }), A.pose('fish', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.01 })]] })
      .done();
  }),
  // A lens flare: a camera on its tripod (1.5 m) looking at the sun, and the flare's chain of glowing coloured
  // rings floating in front of the lens, lighting up one by one as the shutter clicks.
  e('lens flare', 'sky', 'light effects', () => {
    const b = m('lens flare');
    for (const a of [90, 210, 330]) b.rod([Math.cos(a * D2R) * 0.35, 0, -0.6 + Math.sin(a * D2R) * 0.35], [0, 1.3, -0.6], 0.03, 'darkgray');
    b.box([0.18, 0.12, 0.1], [0, 1.4, -0.6], { color: '#2a2726', edge: 'sharp', round: 0.2 }).cyl([0.09, 0.1, 0.09], [0, 1.4, -0.5], { color: '#3a3633', rot: [90, 0, 0], edge: 'sharp' });
    b.ball(0.35, [1.3, 2.6, 2.2], { color: '#fff6c0', glow: true, name: 'sun', mover: { kind: 'light', on: true } });
    for (const r of [0, 45, 90, 135]) b.box([1.2, 0.03, 0.02], [1.3, 2.6, 2.2], { color: '#fff6c0', glow: true, rot: [0, 0, r], noInk: true, parent: 'sun' });
    ([[0.9, 2.15, 1.5, 0.22, '#ffd27a'], [0.55, 1.8, 0.9, 0.34, '#7af2c8'], [0.3, 1.6, 0.4, 0.16, '#c87af2'], [-0.05, 1.3, -0.2, 0.42, '#7ac8f2'], [-0.35, 1.05, -0.7, 0.2, '#f2a07a']] as const).forEach(([x, y, z, s, c], i) =>
      b.prism([s, 0.02, s], [x, y, z], 6, { color: c, glow: true, rot: [90, 0, 0], noInk: true, name: `flare${i}`, mover: { kind: 'light', on: true } }),
    );
    return b
      .act({ click: [[A.operate('flare', 'off'), A.say('Click!', 1), ...[0, 1, 2, 3, 4].flatMap((i) => [A.wait(0.2), A.operate(`flare${i}`, 'on')])]] })
      .done();
  }),
  // The lion on the zodiac plinth: a golden lion with a great mane that roars.
  e('leo (stars)', 'sky', 'zodiac', () =>
    withAct(
      lift(beast('leo (stars)', { color: '#e0a940', body: [0.62, 0.32, 0.3], legL: 0.24, legW: 0.08, neckL: 0.1, neckLean: 30, head: [0.22, 0.2, 0.2], snout: { len: 0.08, h: 0.08, w: 0.1, color: '#f0d090' }, ears: 'pointy', earSize: 0.06, tail: 'tuft', tailColor: '#8a4a1a', acc: [ani.mane('#a0522d', true)] }), 0.12, (b) => zb(b, 'LEO')),
      { click: [[A.par(A.pose('head', { rot: [-20, 0, 0], dur: 0.3 }), A.anim('shake'), A.say('ROAR!', 1.5)), A.pose('head', { rot: [0, 0, 0], dur: 0.4 })]] },
    ),
  ),
  // The scales on the zodiac plinth: a golden balance whose beam tips one way, then the other, then levels.
  e('libra (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('libra (stars)'), 'LIBRA').cyl([0.2, 0.05, 0.2], [0, 0.145, 0], { color: 'gold' }).stick([0, 0.17, 0], [0, 0.78, 0], 0.05, 'gold').ball(0.08, [0, 0.82, 0], { color: 'gold' });
    b.stick([-0.36, 0.76, 0], [0.36, 0.76, 0], 0.035, 'gold', { name: 'beam', pivot: [0, 0.76, 0] });
    b.pair((s) => b.rod([s * 0.34, 0.76, 0], [s * 0.25, 0.46, 0], 0.012, 'gold', { parent: 'beam' }).rod([s * 0.34, 0.76, 0], [s * 0.43, 0.46, 0], 0.012, 'gold', { parent: 'beam' }).cyl([0.2, 0.04, 0.2], [s * 0.34, 0.44, 0], { color: 'gold', taper: 1.6, parent: 'beam' }));
    return b
      .act({ click: [[A.pose('beam', { rot: [0, 0, 12], dur: 0.5 }), A.pose('beam', { rot: [0, 0, -10], dur: 0.6 }), A.par(A.pose('beam', { rot: [0, 0, 0], dur: 0.5 }), A.say('Balanced.', 1.2))]] })
      .done();
  }),
  // A bolt of lightning (12 m) from a storm cloud striking the ground beside a lone tree, which is scorched; it
  // flickers and cracks.
  e('lightning bolt', 'nature', 'weather', () => {
    const b = m('lightning bolt').cyl([8, 0.08, 6], [0, 0.04, 0], { color: '#5a7a40' }).cyl([1.4, 0.02, 1.2], [0.3, 0.09, 0.5], { color: '#2a2420' });
    leafy(b, -2.5, -1, 5, 'darkgreen');
    cloud(b, 0, 11, -1, 7, '#4f565c');
    bolt(b, 0.3, 10.2, 10.1, 1.8, 0.2, '#fff27a', { name: 'bolt', mover: { kind: 'light', on: true } });
    return b
      .act({ click: [[A.par(A.operate('bolt', 'off'), A.say('KRA-KOOOM!', 2)), A.wait(0.15), A.operate('bolt', 'on'), A.wait(0.15), A.operate('bolt', 'off'), A.wait(0.15), A.par(A.operate('bolt', 'on'), A.effect('smoke', { dur: 1.5 }))]] })
      .done();
  }),
  // Big glossy red lips (a lips model, 30 cm) on a stand: they pucker up and blow a kiss.
  e('lips', 'clinic', 'body parts', () =>
    m('lips')
      .cyl([0.14, 0.025, 0.12], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp', round: 0.4 })
      .stick([0, 0.025, 0], [0, 0.15, -0.01], 0.025, 'darkgray')
      .ball([0.05, 0.05, 0.05], [0, 0.2, 0], { color: '#c42a2a', name: 'lips' })
      .ball([0.1, 0.05, 0.055], [0.042, 0.222, 0.002], { color: '#d63a3a', rot: [0, 0, -8], parent: 'lips' })
      .ball([0.1, 0.05, 0.055], [-0.042, 0.222, 0.002], { color: '#d63a3a', rot: [0, 0, 8], parent: 'lips' })
      .ball([0.17, 0.065, 0.06], [0, 0.18, 0.004], { color: '#d63a3a', parent: 'lips' })
      .box([0.13, 0.006, 0.01], [0, 0.198, 0.032], { color: '#7a1a1a', noInk: true, parent: 'lips' })
      .ball([0.05, 0.014, 0.01], [0.025, 0.188, 0.034], { color: 'pink', noInk: true, parent: 'lips' })
      .act({ click: [[A.pose('lips', { scale: 0.75, dur: 0.25 }), A.par(A.pose('lips', { scale: 1.1, dur: 0.15 }), A.effect('hearts', { dur: 1.5 }), A.say('Mwah!', 1.2)), A.pose('lips', { scale: 1, dur: 0.3 })]] })
      .done(),
  ),
  // The Little Dipper on a planetarium star board, the Pole Star bright at the end of its handle; it pulses.
  e('little dipper', 'sky', 'constellations', () =>
    starBoard('little dipper', [[-0.52, 0.24], [-0.32, 0.2], [-0.13, 0.12], [0.05, 0.02], [0.36, 0.06], [0.42, -0.18], [0.12, -0.2]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], { big: [0], names: { 0: 'polaris' } })
      .act({ click: [[A.par(A.pose('polaris', { scale: 1.8, dur: 0.4 }), A.effect('sparkle', { dur: 1.2 })), A.pose('polaris', { scale: 1, dur: 0.6 })], [A.operate('star', 'off'), A.wait(0.4), A.operate('star', 'on')]] })
      .done(),
  ),
  // Magic: a magician's top hat on a little round table with a wand beside it; tap, and a white rabbit pops out.
  e('magic', 'fantasy', 'magic', () => {
    const b = m('magic').cyl([0.6, 0.03, 0.6], [0, 0.75, 0], { color: '#2a2726', edge: 'sharp' }).cyl([0.07, 0.72, 0.07], [0, 0.37, 0], { color: 'gold' }).cyl([0.4, 0.03, 0.4], [0, 0.015, 0], { color: 'gold', edge: 'sharp' });
    b.cyl([0.66, 0.25, 0.66], [0, 0.66, 0], { color: '#8a1f2e', taper: 1.1 });
    b.cyl([0.36, 0.025, 0.36], [0, 0.78, 0], { color: '#2a2726', edge: 'sharp' }).cyl([0.24, 0.24, 0.24], [0, 0.9, 0], { color: '#2a2726', edge: 'sharp' }).cyl([0.245, 0.05, 0.245], [0, 0.82, 0], { color: 'red', edge: 'sharp' });
    b.ball([0.13, 0.12, 0.12], [0, 0.96, 0], { color: 'white', name: 'rabbit', mover: { kind: 'slide', axis: 'y', amount: 0.15 } });
    b.pair((s) => b.capsule([0.04, 0.14, 0.025], [s * 0.03, 1.07, -0.01], { color: 'white', rot: [0, 0, -s * 10], parent: 'rabbit' }).ball([0.02, 0.025, 0.01], [s * 0.03, 0.975, 0.055], { color: 'black', eye: true, noInk: true, parent: 'rabbit' }));
    b.ball(0.02, [0, 0.955, 0.06], { color: 'pink', parent: 'rabbit' });
    b.stick([0.15, 0.78, 0.18], [0.36, 0.78, 0.05], 0.018, '#2a2726').stick([0.33, 0.78, 0.068], [0.36, 0.78, 0.05], 0.02, 'white');
    return b
      .socket('hat', [0, 0.9, 0], 'inside', { size: 0.2 })
      .act({
        click: [
          [A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Abracadabra!', 1.5)), A.operate('rabbit', 'up'), A.say('!', 1)],
          [A.operate('rabbit', 'down'), A.effect('smoke', { dur: 1 })],
        ],
      })
      .done();
  }),
  // A mariachi band: a singer with a guitar, a violinist and a trumpeter in black charro suits and sombreros; they
  // sway and sing.
  e('mariachi band', 'music', 'bands', () => {
    const P = (tag: string, x: number, acc: Extra[], o: Parameters<typeof who>[1] = {}) => ({ f: who(`mariachi ${tag}`, { h: 1.75, top: '#2a2726', bottom: '#2a2726', shoes: 'black', long: true, hair: 'black', skin: 'skin3', acc: [hat('sombrero', '#2a2726'), wear('bowtie', 'red'), wear('belt', 'silver'), ...acc], ...o }), at: [x, 0] as [number, number], yaw: 0, tag });
    const list = [P('a', -0.75, [held('violin')]), P('b', 0, [held('guitar')], { beard: '#2a1d16' }), P('c', 0.75, [held('trumpet')])];
    const sway = (k: number, dur = 0.4) => A.par(...['a', 'b', 'c'].map((t, i) => A.pose(`${t}torso`, { rot: [0, 0, (i % 2 ? -1 : 1) * k], dur })));
    return withAct(
      troupe('mariachi band', list, (b) => {
        for (const x of [-0.75, 0, 0.75]) for (const y of [0.55, 0.8, 1.05]) b.ball(0.03, [x + 0.13, y, 0.14], { color: 'silver' });
        return b;
      }),
      {
        click: [
          [A.par(sway(6), A.say('Ay, ay, ay, ay! Canta y no llores!', 3)), sway(-6), sway(6), sway(0)],
          [A.par(...armsUp(['c']), A.say('Olé!', 1.5)), A.wait(0.8), A.par(...armsUp(['c'], false))],
        ],
      },
    );
  }),
  // A planetarium Mars (3 m): rusty red with dark plains, a white polar cap and the great volcano; a dust storm.
  e('mars', 'sky', 'planets', () => {
    const b = orb('mars', 2.6, 1.85, '#c1440e', { spin: 30 });
    b.dome([1.1, 0.16, 1.1], [0, 3.1, 0], { color: 'white', parent: 'globe' });
    for (const [x, y, s] of [[-0.55, 0.3, 0.9], [0.45, -0.35, 0.7], [0.1, 0.65, 0.5], [-0.2, -0.75, 0.55]]) b.ball([s, s * 0.6, 0.14], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.05], { color: '#8a2e0a', noInk: true, parent: 'globe' });
    b.dome([0.32, 0.1, 0.32], [0.55, 2.0, 1.12], { color: '#d9662e', rot: [80, 25, 0], parent: 'globe' });
    return b.act({ click: [[A.par(A.effect('dust', { dur: 2.5 }), A.pose('globe', { spin: [0, 120, 0] })), A.wait(2), A.pose('globe', { spin: [0, 30, 0] })]] }).done();
  }),
  // The Mayflower at her real size (about 30 m with the bowsprit): a three-masted merchant ship with a high stern
  // castle, square sails on the fore and main masts, a lateen sail on the mizzen, flags, a stern lantern.
  e('mayflower', 'garage', 'ships', () => {
    const b = m('mayflower', { view: 'side' });
    b.loft([7.6, 5.2, 27], [0, 2.6, 0], [[0, 0.7, 0.95, 0.1], [0.12, 0.9, 1, 0.05], [0.5, 1, 0.92, 0], [0.82, 0.88, 0.95, 0.05], [1, 0.25, 1.0, 0.15]], { color: '#7a4a2a', cut: 'bottom', boxy: 0.35, name: 'hull' });
    b.box([6.6, 0.25, 22], [0, 5.0, 0.5], { color: '#a07040', parent: 'hull', edge: 'sharp' })
      .box([7.3, 0.35, 25], [0, 4.0, 0.2], { color: '#e2b23a', parent: 'hull', edge: 'sharp', noInk: true })
      .box([6.8, 4.0, 6.5], [0, 6.4, -9.8], { color: '#6a3a20', parent: 'hull', edge: 'sharp', round: 0.05 })
      .box([7.0, 0.4, 6.8], [0, 8.5, -9.8], { color: '#e2b23a', parent: 'hull', edge: 'sharp' })
      .box([5.8, 2.2, 4.5], [0, 6.0, 9.6], { color: '#6a3a20', parent: 'hull', edge: 'sharp', round: 0.05 })
      .box([3.6, 1.4, 0.1], [0, 6.6, -13.1], { color: '#e2b23a', parent: 'hull', edge: 'sharp' })
      .rod([0, 5.6, 12.5], [0, 8.4, 19.5], 0.45, 'darkwood', { parent: 'hull' })
      .ball([0.6, 0.9, 0.6], [0, 9.3, -13.0], { color: '#ffd27a', glow: true, parent: 'hull', name: 'lantern', mover: { kind: 'light', on: true } });
    b.pair((s) => { for (let i = 0; i < 5; i++) b.box([0.1, 0.6, 0.7], [s * 3.65, 3.3, -6 + i * 3.2], { color: '#2a1d16', parent: 'hull', edge: 'sharp' }); });
    const mast = (z: number, h: number, sails: number[]) => {
      b.cyl([0.55, h, 0.55], [0, 5 + h / 2, z], { color: 'darkwood', parent: 'hull' });
      sails.forEach((w, i) => {
        const y = 5 + h * (0.42 + i * 0.36);
        b.cyl([0.22, w + 1.2, 0.22], [0, y + h * 0.15, z], { color: 'darkwood', rot: [0, 0, 90], parent: 'hull' });
        b.ball([w, h * 0.3, 1.1], [0, y, z + 0.4], { color: 'cream', parent: 'hull', name: `sail${z}${i}` });
      });
      b.box([0.05, 1.2, 1.8], [0, 5 + h + 0.6, z - 0.9], { color: 'red', parent: 'hull', edge: 'sharp' });
    };
    mast(6.5, 18, [9, 6.5]);
    mast(-1, 21, [10.5, 7.5]);
    b.cyl([0.45, 14, 0.45], [0, 8.5 + 7, -9], { color: 'darkwood', parent: 'hull' }).wedge([0.08, 8, 7], [0, 15, -9.5], { color: 'cream', apex: 0.4, rot: [0, 90, 0], parent: 'hull', edge: 'sharp' });
    for (const [z0, z1, h] of [[6.5, 14, 22], [-1, -12, 25], [6.5, -1, 22]] as const) b.stick([0, 5.2, z1], [0, h, z0], 0.06, '#5a4a3a', { parent: 'hull', noInk: true });
    return b
      .socket('deck', [0, 5.15, 2], 'top', { part: 'hull', size: 4 })
      .act({
        click: [
          [A.par(A.pose('hull', { rot: [4, 0, 0], dur: 1 }), A.say('Land ho!', 2), A.effect('water_spray', { dur: 1.5 })), A.pose('hull', { rot: [-3, 0, 0], dur: 1 }), A.pose('hull', { rot: [0, 0, 0], dur: 1 })],
          [A.operate('lantern', 'off'), A.wait(0.5), A.operate('lantern', 'on'), A.say('Ding ding!', 1.2)],
        ],
      })
      .done();
  }),
  // A meadow (8 m, knee high): long grass, wildflowers of every colour and a butterfly; the breeze sets it swaying.
  e('meadow', 'nature', 'landscapes', () => {
    const b = m('meadow').cyl([8, 0.08, 6], [0, 0.04, 0], { color: 'grass' });
    b.ball(0.02, [0, 0.1, 0], { color: 'grass', name: 'sway' });
    const cs = ['red', 'yellow', 'white', 'purple', 'pink', 'orange', 'skyblue', 'yellow', 'white', 'red', 'purple', 'white'];
    cs.forEach((c, i) => {
      const a = i * 2.4, r = 0.6 + (i % 4) * 0.75, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.7, h = 0.45 + (i % 3) * 0.12;
      b.rod([x, 0.08, z], [x, h, z], 0.015, 'darkgreen', { parent: 'sway' }).ball([0.11, 0.08, 0.11], [x, h + 0.02, z], { color: c, parent: 'sway' }).ball(0.04, [x, h + 0.05, z], { color: 'yellow', parent: 'sway' });
    });
    for (let i = 0; i < 16; i++) {
      const a = i * 1.7 + 0.4, r = 0.4 + (i % 5) * 0.65, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.7;
      b.cone([0.18, 0.5 + (i % 3) * 0.12, 0.18], [x, 0.3, z], { color: i % 2 ? '#7cc45a' : '#5aa553', parent: 'sway' });
    }
    return b
      .ball([0.09, 0.06, 0.01], [0.5, 0.95, 0.4], { color: 'orange', rot: [0, 0, 30], name: 'butterfly' })
      .ball([0.09, 0.06, 0.01], [0.58, 0.95, 0.4], { color: 'orange', rot: [0, 0, -30], parent: 'butterfly' })
      .capsule([0.015, 0.06, 0.015], [0.54, 0.95, 0.4], { color: '#2a2726', parent: 'butterfly' })
      .act({
        click: [
          [A.par(A.pose('sway', { rot: [0, 0, 6], dur: 0.6 }), A.pose('butterfly', { move: [-0.6, 0.3, 0.2], dur: 1.2 })), A.par(A.pose('sway', { rot: [0, 0, -4], dur: 0.6 }), A.pose('butterfly', { move: [-1.0, 0.1, -0.3], dur: 1 })), A.par(A.pose('sway', { rot: [0, 0, 0], dur: 0.6 }), A.pose('butterfly', { move: [0, 0, 0], dur: 1.2 }))],
        ],
      })
      .done();
  }),
  // A planetarium Mercury (3 m): small, grey and covered in craters; the fastest planet, so it spins up to a blur.
  e('mercury (planet)', 'sky', 'planets', () => {
    const b = orb('mercury (planet)', 2.6, 1.85, '#9a948c', { spin: 20 });
    for (const [x, y, s] of [[-0.5, 0.3, 0.5], [0.4, 0.5, 0.35], [0.3, -0.4, 0.6], [-0.4, -0.5, 0.3], [0.75, 0.0, 0.3], [-0.1, 0.0, 0.25], [-0.8, -0.1, 0.2]]) b.torus([s, s, 0.08], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.02], { color: '#7c776f', noInk: true, tube: 0.25, parent: 'globe' });
    return b.act({ click: [[A.par(A.pose('globe', { spin: [0, 600, 0] }), A.say('Zoom!', 1.5)), A.wait(2), A.pose('globe', { spin: [0, 20, 0] })]] }).done();
  }),
  // Mildew: a courgette plant in a terracotta pot (35 cm), its broad leaves dusted with white powdery mildew; the
  // spores puff off.
  e('mildew', 'garden', 'fungi', () => {
    const b = m('mildew').cyl([0.2, 0.17, 0.2], [0, 0.085, 0], { color: '#c4673a', taper: 1.25, edge: 'sharp' }).cyl([0.24, 0.03, 0.24], [0, 0.17, 0], { color: '#b35a30', edge: 'sharp' }).cyl([0.21, 0.01, 0.21], [0, 0.17, 0], { color: 'dirt' });
    b.ball(0.02, [0, 0.18, 0], { color: 'green', name: 'top' });
    for (const [a, h] of [[20, 0.32], [140, 0.28], [260, 0.34], [80, 0.24]] as const) {
      const x = Math.cos(a * D2R) * 0.12, z = Math.sin(a * D2R) * 0.12;
      b.rod([0, 0.18, 0], [x, h, z], 0.012, 'green', { parent: 'top' }).ball([0.2, 0.02, 0.17], [x * 1.4, h + 0.01, z * 1.4], { color: '#5aa553', rot: [0, -a, 12], parent: 'top' });
      for (const [dx, dz, s] of [[0.03, 0.02, 0.06], [-0.04, -0.02, 0.05], [0.0, -0.05, 0.04]]) b.ball([s, 0.01, s * 0.8], [x * 1.4 + dx, h + 0.023, z * 1.4 + dz], { color: '#ecece2', noInk: true, parent: 'top' });
    }
    return b.act({ click: [[A.par(A.effect('dust', { dur: 1.5 }), A.pose('top', { rot: [0, 0, -8], dur: 0.6 })), A.pose('top', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // A mirage in the desert (3.6 m): dunes, a cactus, and an oasis with a palm and a shimmering pool that fades away
  // when you look again.
  e('mirage', 'nature', 'desert', () => {
    const b = m('mirage').cyl([10, 0.08, 7], [0, 0.04, 0], { color: 'sand' });
    for (const [x, z, w, h] of [[-3, -1.5, 4, 1.0], [2.8, 1.8, 3, 0.7], [3.5, -2.2, 3.4, 1.2]]) b.dome([w, h, w * 0.6], [x, h / 2, z], { color: '#e0c48a' });
    b.cyl([0.3, 1.6, 0.3], [-2.6, 0.8, 1.8], { color: '#3f8a3a', edge: 'soft' }).capsule([0.2, 0.6, 0.2], [-2.35, 1.1, 1.8], { color: '#3f8a3a', rot: [0, 0, -40] });
    b.ball(0.05, [0.6, 0.2, -0.6], { color: 'sand', name: 'oasis' });
    b.cyl([3.2, 0.04, 2.0], [0.6, 0.1, -0.6], { color: '#7ad0f0', glow: true, parent: 'oasis' });
    b.rod([1.6, 0.1, -1.2], [1.9, 1.8, -1.2], 0.18, 'bark', { parent: 'oasis' }).rod([1.9, 1.8, -1.2], [1.8, 3.3, -1.2], 0.16, 'bark', { parent: 'oasis' });
    around(7, 0.7, 0.3).forEach(([lx, lz], i) => b.ball([1.5, 0.12, 0.4], [1.8 + lx, 3.2, -1.2 + lz], { color: 'green', rot: [0, -(0.3 + (i / 7) * Math.PI * 2) / D2R, -22], parent: 'oasis' }));
    for (const y of [0.5, 0.75]) for (let i = 0; i < 5; i++) b.rod([-1.4 + i * 0.6, y + (i % 2) * 0.06, 0.8], [-1.1 + i * 0.6, y + ((i + 1) % 2) * 0.06, 0.8], 0.03, '#bfe8f8', { noInk: true, parent: 'oasis' });
    return b
      .ball(0.6, [-3.6, 3.3, -2.5], { color: '#fff3a0', glow: true })
      .act({ click: [[A.pose('oasis', { scale: 0.02, dur: 1.2 }), A.say('Shimmer...', 1.5), A.wait(1.2), A.pose('oasis', { scale: 1, dur: 1.2 })]] })
      .done();
  }),
  // Mix: a stand mixer (36 cm) on a counter mat, its beater in a bowl of cake batter; it whirrs, and its head tilts
  // back.
  e('mix', 'kitchen', 'baking', () =>
    m('mix', { edge: 'sharp' })
      .box([0.34, 0.012, 0.28], [0, 0.006, 0], { color: '#dfe8ee', round: 0.3 })
      .box([0.2, 0.06, 0.3], [0, 0.04, 0], { color: '#e0473b', round: 0.4 })
      .box([0.1, 0.26, 0.12], [0, 0.17, -0.1], { color: '#e0473b', round: 0.4 })
      .cyl([0.2, 0.15, 0.2], [0, 0.145, 0.04], { color: 'silver', taper: 1.3 })
      .cyl([0.2, 0.02, 0.2], [0, 0.215, 0.04], { color: '#f6e0b0', edge: 'soft' })
      .capsule([0.12, 0.3, 0.13], [0, 0.32, -0.02], { color: '#e0473b', rot: [90, 0, 0], name: 'head', pivot: [0, 0.3, -0.1], edge: 'soft' })
      .cyl([0.05, 0.03, 0.05], [0, 0.32, 0.14], { color: 'silver', parent: 'head' })
      .cyl([0.015, 0.06, 0.015], [0, 0.27, 0.04], { color: 'silver', parent: 'head' })
      .torus([0.09, 0.12, 0.012], [0, 0.2, 0.04], { color: 'silver', parent: 'head', name: 'beater', mover: { kind: 'spin', axis: 'y', amount: 900 } })
      .socket('bowl', [0, 0.2, 0.04], 'inside', { size: 0.15 })
      .act({
        click: [
          [A.operate('beater', 'on'), A.say('Whirrrrr!', 2), A.wait(2.5), A.operate('beater', 'off')],
          [A.pose('head', { rot: [-50, 0, 0], dur: 0.5 }), A.say('Click.', 1), A.wait(1.2), A.pose('head', { rot: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done(),
  ),
  // Mother Nature: a giant (3.4 m) in a gown of leaves with a crown of flowers, a cloak of vines and a blossoming
  // staff; she raises her arms and flowers spring up.
  e('mother nature', 'fantasy', 'spirits', () =>
    withAct(who('mother nature', { h: 3.4, skin: 'skin3', hair: '#3f7a3a', style: 'long', top: '#5aa553', bottom: '#3f7a3a', skirt: '#4f9a48', long: true, acc: [gown('#4f9a48'), hat('flower', 'pink'), wear('cape', '#2f5a2a'), held('bouquet'), held('staff', undefined, 'L')] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('Grow, my little ones!', 2)), A.spawn('f1', 'daisy', { rel: 'front', of: 'self', dist: 'close' }), A.spawn('f2', 'sprout', { rel: 'left', of: 'self', dist: 'close' }), A.effect('sparkle', { dur: 1.5 }), A.wait(2), A.remove('f1', 'sink'), A.remove('f2', 'sink')],
        [A.par(A.anim('wave'), A.effect('rain', { dur: 2 }), A.say('A little rain for the garden.', 2))],
      ],
    }),
  ),
  // A dental model of a mouth (25 cm on its stand): pink gums, two rows of teeth and a tongue; the lower jaw opens.
  e('mouth', 'clinic', 'body parts', () => {
    const b = m('mouth')
      .cyl([0.16, 0.025, 0.14], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp', round: 0.4 })
      .stick([0, 0.025, -0.06], [0, 0.17, -0.06], 0.025, 'silver')
      .arc([0.13, 0.13, 0.035], [0, 0.205, 0.0], { color: '#e88a9a', rot: [90, 0, 0], tube: 0.36 })
      .arc([0.13, 0.13, 0.035], [0, 0.17, 0.0], { color: '#e88a9a', rot: [90, 0, 0], tube: 0.36, name: 'jaw', pivot: [0, 0.18, -0.06], mover: { kind: 'swing', axis: 'x', amount: 30 } });
    for (let i = 0; i < 10; i++) {
      const a = (8 + i * 18.2) * D2R, x = Math.cos(a) * 0.052, z = Math.sin(a) * 0.052, w = i === 4 || i === 5 ? 0.014 : 0.012;
      b.box([w, 0.016, 0.012], [x, 0.19, z], { color: 'white', rot: [0, 90 - a / D2R, 0], round: 0.4, edge: 'sharp' });
      b.box([w, 0.016, 0.012], [x * 0.95, 0.185, z * 0.95], { color: 'white', rot: [0, 90 - a / D2R, 0], round: 0.4, parent: 'jaw', edge: 'sharp' });
    }
    return b
      .ball([0.06, 0.016, 0.06], [0, 0.172, 0.01], { color: '#d96a7a', parent: 'jaw' })
      .act({ click: [[A.operate('jaw', 'open'), A.say('Ahhh!', 1.5), A.wait(1), A.operate('jaw', 'close'), A.say('Chomp!', 1)]] })
      .done();
  }),
  // A display head with a mullet: short at the front, long at the back. It turns round on its stand to show the
  // party in the back.
  e('mullet (hair)', 'wardrobe', 'hairstyles', () =>
    mannequin('mullet (hair)', { hair: '#a0522d', top: 'denim' }, (b, hc) => {
      b.capsule([0.15, 0.16, 0.07], [0, 0.19, -0.075], { color: hc, parent: 'hair' });
      b.pair((s) => b.capsule([0.04, 0.12, 0.05], [s * 0.065, 0.19, -0.06], { color: hc, parent: 'hair' }));
    })
      .act({ click: [[A.pose('bust', { rot: [0, 180, 0], dur: 0.8 }), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Party in the back!', 1.5)), A.wait(0.8), A.pose('bust', { rot: [0, 0, 0], dur: 0.8 }), A.say('Business in the front.', 1.5)]] })
      .done(),
  ),
  // A muse: a Greek goddess of the arts in a white chiton with a golden laurel and sash, holding a scroll.
  e('muse', 'fantasy', 'myths', () =>
    withAct(who('muse', { top: 'white', bottom: 'white', skirt: 'white', hair: 'gold', style: 'long', skin: 'skin1', acc: [gown('white'), wear('toga', 'white'), hat('headband', 'gold'), wear('sash', 'gold'), held('scroll')] }), {
      click: [
        [A.par(A.anim('arms_up'), A.effect('sparkle', { dur: 1.5 }), A.say('Be inspired!', 2))],
        [A.par(A.anim('nod'), A.say('Yes... that is the one. Write it down!', 2))],
      ],
    }),
  ),
  // A musical note: a big black quaver (eighth note, 35 cm) on a little stand; it bounces to the beat.
  e('musical note', 'music', 'music symbols', () =>
    m('musical note')
      .box([0.2, 0.03, 0.12], [0, 0.015, 0], { color: 'white', edge: 'sharp', round: 0.3 })
      .ball([0.13, 0.095, 0.07], [-0.035, 0.08, 0], { color: '#2a2726', rot: [0, 0, 25], name: 'note' })
      .box([0.022, 0.26, 0.024], [0.022, 0.21, 0], { color: '#2a2726', parent: 'note', round: 0.4 })
      .rod([0.025, 0.33, 0], [0.085, 0.27, 0], 0.026, '#2a2726', { parent: 'note', name: 'flag', pivot: [0.025, 0.33, 0] })
      .rod([0.085, 0.27, 0], [0.08, 0.2, 0], 0.022, '#2a2726', { parent: 'flag' })
      .act({ click: [[A.par(A.anim('bounce', 2), A.say('La la la!', 1.5)), A.pose('flag', { rot: [0, 0, 15], dur: 0.2 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.2 })]] })
      .done(),
  ),
  // Natural: a farm-stand crate of fresh produce (carrots with their tops, lettuces, apples) on a trestle, with a
  // "100% NATURAL" sign and a leaf.
  e('natural', 'ideas', 'symbols', () => {
    const b = m('natural', { edge: 'sharp' });
    b.pair((s) => b.rod([s * 0.35, 0, 0.18], [s * 0.3, 0.6, 0.0], 0.04, 'wood').rod([s * 0.35, 0, -0.18], [s * 0.3, 0.6, 0.0], 0.04, 'wood'));
    b.box([0.7, 0.04, 0.4], [0, 0.62, 0], { color: 'lightwood' }).box([0.62, 0.22, 0.36], [0, 0.75, 0], { color: '#c9a26a' });
    for (const y of [0.7, 0.8]) b.box([0.63, 0.04, 0.37], [0, y, 0], { color: 'lightwood', noInk: true });
    for (const [x, z, c] of [[-0.18, 0.05, 'lettuce'], [-0.2, -0.08, '#5aa553'], [0.18, 0.08, 'red'], [0.22, -0.06, 'red'], [0.1, 0.0, '#e86f7d']] as const) b.ball(x < 0 ? 0.16 : 0.09, [x, 0.89, z], { color: c, edge: 'soft' });
    for (const [x, z] of [[0.0, 0.05], [0.04, -0.06], [-0.04, -0.02]]) b.cone([0.04, 0.2, 0.04], [x, 0.9, z], { color: 'orange', rot: [180, 0, 15], name: x === 0 ? 'carrot' : undefined, edge: 'soft' }).cone([0.06, 0.12, 0.06], [x, 1.04, z], { color: '#5aa553', parent: x === 0 ? 'carrot' : undefined, edge: 'soft' });
    b.stick([0.42, 0.62, 0.15], [0.42, 1.15, 0.15], 0.025, 'wood').label('100% NATURAL', [0.36, 0.2], [0.42, 1.2, 0.17], { color: '#3f7a3a' });
    return b
      .ball([0.16, 0.24, 0.02], [0.6, 1.32, 0.15], { color: 'lime', rot: [0, 0, -25], edge: 'soft' })
      .act({ click: [[A.par(A.pose('carrot', { move: [0, 0.2, 0], dur: 0.3 }), A.effect('sparkle', { dur: 1 }), A.say('Crunch!', 1.2)), A.pose('carrot', { move: [0, 0, 0], dur: 0.3 })]] })
      .done();
  }),
  // A neighbourhood at real size: three family houses (two storeys) side by side with front paths, mailboxes and
  // trees along a street with a crossing; every front door opens: "Hi, neighbour!"
  e('neighborhood', 'places', 'towns', () => {
    const b = m('neighborhood', { edge: 'sharp' }).box([34, 0.1, 22], [0, 0.05, 0], { color: 'grass' }).box([34, 0.04, 6], [0, 0.12, 8], { color: '#4a4a4a', round: 0 }).box([34, 0.08, 1.6], [0, 0.14, 4.4], { color: 'lightgray', round: 0 });
    for (let i = 0; i < 6; i++) b.box([0.4, 0.01, 2.2], [-3 + i * 0.8, 0.145, 8], { color: 'white', noInk: true, round: 0 });
    const home = (x: number, wall: string, roof: string, n: number) => {
      const W = 8, D = 7, H = 5.6, z = -3, zf = z + D / 2;
      b.box([W, H, D], [x, H / 2 + 0.1, z], { color: wall, round: 0.02 }).box([W + 0.1, 0.2, D + 0.1], [x, 0.2, z], { color: 'stone' });
      gable(b, W, D, H + 0.1, 2.8, roof, { x, z });
      b.box([0.8, 1.8, 0.8], [x + 2.4, H + 2, z - 1], { color: '#8a4a3a' });
      door(b, x, zf, { w: 1.0, h: 2.2, y: 0.1, color: n === 1 ? '#e0473b' : n === 2 ? '#2f4f8f' : '#3f6a3a', name: `door${n}` });
      for (const dx of [-2.6, 2.6]) win(b, x + dx, 1.6, zf, 1.3, 1.3, 'white', { bars: true });
      for (const dx of [-2.6, 0, 2.6]) win(b, x + dx, 4.3, zf, 1.1, 1.2, 'white', { bars: true });
      b.box([1.2, 0.04, 4.3], [x, 0.12, zf + 2.15], { color: '#c9bfa6', round: 0 });
      b.stick([x + 1.5, 0.1, 3.4], [x + 1.5, 1.05, 3.4], 0.08, 'wood').box([0.25, 0.25, 0.5], [x + 1.5, 1.15, 3.4], { color: '#4e8fd6', round: 0.4 }).box([0.03, 0.25, 0.08], [x + 1.65, 1.3, 3.3], { color: 'red', name: `flag${n}`, pivot: [x + 1.65, 1.2, 3.3], rot: [0, 0, 0] });
    };
    home(-10, '#f2e6cf', '#a3322a', 1);
    home(0, '#a8d8f5', '#2f4f8f', 2);
    home(10, '#f6d24a', '#6b4a2a', 3);
    for (const x of [-5, 5, 15]) b.cyl([0.35, 2.6, 0.35], [x, 1.4, 2.4], { color: 'bark', edge: 'soft' }).ball([3, 3, 3], [x, 4, 2.4], { color: 'leaf', edge: 'soft' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Hi, neighbour!', 2), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.pose('flag1', { rot: [0, 0, -90], dur: 0.4 }), A.pose('flag2', { rot: [0, 0, -90], dur: 0.4 }), A.pose('flag3', { rot: [0, 0, -90], dur: 0.4 }), A.say('Clack clack clack!', 1.5)), A.wait(1.5), A.par(A.pose('flag1', { rot: [0, 0, 0] }), A.pose('flag2', { rot: [0, 0, 0] }), A.pose('flag3', { rot: [0, 0, 0] }))],
        ],
      })
      .done();
  }),
  e('nine', 'ideas', 'numbers', () => counter('nine', '9', 9, 'purple', 'yellow', COUNT).done()),
  // The North Pole: a red and white striped pole (2.6 m) with a gold ball on top, a NORTH POLE signpost and an igloo
  // on the ice; the stripes spin like a barber's pole and it snows.
  e('north pole', 'places', 'landmarks', () => {
    const b = m('north pole').cyl([5, 0.12, 4], [0, 0.06, 0], { color: 'ice' });
    b.dome([1.4, 0.4, 1.0], [-1.4, 0.32, 0.8], { color: 'snow' }).dome([1.0, 0.3, 0.8], [1.5, 0.27, -0.6], { color: 'snow' });
    b.cyl([0.2, 2.5, 0.2], [0, 1.37, 0], { color: 'white', name: 'pole', mover: { kind: 'spin', axis: 'y', amount: 180 } });
    for (let i = 0; i < 10; i++) b.cyl([0.215, 0.1, 0.215], [0, 0.3 + i * 0.23, 0], { color: 'red', rot: [0, 0, 25], parent: 'pole', noInk: true });
    b.ball(0.32, [0, 2.75, 0], { color: 'gold', edge: 'sharp' });
    b.stick([0.9, 0.12, 0.6], [0.9, 1.8, 0.6], 0.06, 'wood').box([0.9, 0.24, 0.04], [1.2, 1.6, 0.62], { color: 'wood', edge: 'sharp' }).label('NORTH POLE', [0.8, 0.18], [1.2, 1.6, 0.645], { color: 'wood', depth: 0.005 });
    b.dome([1.8, 1.0, 1.8], [-1.5, 0.62, -1.0], { color: 'snow' }).cyl([0.7, 0.6, 0.6], [-1.5, 0.4, -0.15], { color: 'snow', rot: [90, 0, 0] }).dome([0.5, 0.35, 0.05], [-1.5, 0.12, 0.17], { color: '#2a3a4a' });
    for (let i = 0; i < 4; i++) b.torus([1.8 - i * 0.4, 1.8 - i * 0.4, 0.02], [-1.5, 0.15 + i * 0.22, -1.0], { color: '#dfe8ee', rot: [90, 0, 0], tube: 0.03, noInk: true });
    return b
      .act({ click: [[A.operate('pole', 'on'), A.par(A.effect('snow', { dur: 2.5 }), A.say('Ho ho ho!', 2)), A.wait(2.5), A.operate('pole', 'off')]] })
      .done();
  }),
  // The North Star: a big eight-pointed star (1.8 m) glowing on a slender stand above a brass ship's compass whose
  // needle swings round to point at it.
  e('north star', 'sky', 'stars', () => {
    const b = m('north star')
      .cyl([0.6, 0.12, 0.6], [0, 0.06, 0], { color: 'darkwood', edge: 'sharp', round: 0.3 })
      .cyl([0.44, 0.08, 0.44], [0, 0.16, 0], { color: 'brass', edge: 'sharp' })
      .cyl([0.38, 0.02, 0.38], [0, 0.2, 0], { color: 'cream' })
      .box([0.3, 0.012, 0.03], [0, 0.215, 0], { color: 'red', rot: [0, 30, 0], name: 'needle', edge: 'sharp' })
      .stick([0, 0.2, -0.25], [0, 1.35, -0.25], 0.04, 'brass')
      .ball([0.26, 0.26, 0.16], [0, 1.45, -0.25], { color: '#fff6c0', glow: true, name: 'star', mover: { kind: 'light', on: true } });
    for (let i = 0; i < 8; i++) {
      const a = i * 45, L = i % 2 ? 0.22 : 0.4;
      b.cone([0.12, L, 0.06], [-Math.sin(a * D2R) * (0.1 + L / 2), 1.45 + Math.cos(a * D2R) * (0.1 + L / 2), -0.25], { color: i % 2 ? '#fff3a0' : 'white', glow: true, rot: [0, 0, a], parent: 'star' });
    }
    return b
      .act({
        click: [
          [A.par(A.pose('needle', { rot: [0, 120, 0], dur: 0.4 }), A.pose('star', { scale: 1.3, dur: 0.4 })), A.par(A.pose('needle', { rot: [0, 60, 0], dur: 0.5 }), A.pose('star', { scale: 1, dur: 0.5 })), A.par(A.pose('needle', { rot: [0, 60, 0] }), A.effect('sparkle', { dur: 1.2 }), A.say('Twinkle!', 1.2))],
          [A.operate('star', 'off'), A.wait(0.3), A.operate('star', 'on'), A.pose('needle', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A novel at its real size (a 24 cm hardback; the vocabulary's 1.7 m is not a book's size), standing up, its cover
  // swinging open on the spine.
  e('novel', 'study', 'books', () =>
    m('novel', { edge: 'sharp' })
      .box([0.16, 0.235, 0.035], [0.005, 0.1175, 0], { color: 'cream', round: 0.05 })
      .box([0.012, 0.245, 0.042], [-0.08, 0.1225, 0], { color: '#8a2b3a', round: 0.4 })
      .box([0.165, 0.245, 0.004], [0.004, 0.1225, -0.019], { color: '#8a2b3a', round: 0.1 })
      .box([0.165, 0.245, 0.004], [0.004, 0.1225, 0.019], { color: '#8a2b3a', round: 0.1, name: 'cover', pivot: [-0.08, 0.1225, 0.019], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .label('A NOVEL', [0.12, 0.03], [0.004, 0.18, 0.022], { color: '#8a2b3a', depth: 0.003, parent: 'cover' })
      .box([0.09, 0.004, 0.003], [0.004, 0.15, 0.0215], { color: 'gold', noInk: true, parent: 'cover' })
      .box([0.012, 0.06, 0.002], [0.04, 0.245, 0.0], { color: 'red', noInk: true })
      .act({ click: [[A.operate('cover', 'open'), A.say('Once upon a time...', 2.5), A.wait(2.5), A.operate('cover', 'close')]] })
      .done(),
  ),
  // Numbers: three big foam number blocks (30 cm cubes) with raised numerals 1, 2, 3 stacked on a mat; they hop as
  // they count.
  e('numbers', 'ideas', 'numbers', () => {
    const b = m('numbers').box([1.0, 0.03, 0.6], [0, 0.015, 0], { color: '#55b05f', edge: 'sharp', round: 0.3 });
    ([[-0.17, 0.18, 0, '1', 'red'], [0.17, 0.18, 0, '2', 'blue'], [0, 0.49, 0.0, '3', 'green']] as const).forEach(([x, y, z, ch, c], i) => {
      b.box([0.3, 0.3, 0.3], [x, y, z], { color: c, round: 0.2, name: `block${i}`, edge: 'sharp' });
      numeral(b, ch, x, y - 0.11, 0.22, 'white', { parent: `block${i}` }, z + 0.16);
    });
    return b.act({ click: [[0, 1, 2].flatMap((i) => [A.par(A.pose(`block${i}`, { move: [0, 0.15, 0], dur: 0.2 }), A.say(COUNT[i] + '!', 0.6)), A.pose(`block${i}`, { move: [0, 0, 0], dur: 0.2 })])] }).done();
  }),
  // A nursery corner (2.5 m walls, pastel with stars): a white crib with a teddy, a mobile of stars and moons that
  // turns, a rocking chair that rocks, a rug.
  e('nursery (baby)', 'home', 'bedrooms', () => {
    const b = m('nursery (baby)', { edge: 'sharp' });
    b.box([3.4, 0.05, 3], [0, 0.025, 0], { color: '#e8dcc8' }).box([3.4, 2.5, 0.1], [0, 1.25, -1.5], { color: '#cfe6f2' }).box([0.1, 2.5, 3], [-1.7, 1.25, 0], { color: '#f6d2e0' });
    for (const [x, y] of [[-0.9, 2.0], [0.6, 2.2], [1.2, 1.6], [-0.2, 1.9]]) b.star(0.2, [x, y, -1.44], { color: 'yellow', noInk: true });
    b.cyl([1.6, 0.01, 1.2], [0.2, 0.055, 0.4], { color: '#f4a1c0', edge: 'soft' });
    // the crib
    const cx = -0.4, cz = -1.0;
    b.box([1.25, 0.12, 0.65], [cx, 0.4, cz], { color: 'white' }).box([1.2, 0.12, 0.6], [cx, 0.5, cz], { color: '#a8d8f5', round: 0.5, edge: 'soft' });
    for (const [x, z] of [[-0.62, 0.32], [0.62, 0.32], [-0.62, -0.32], [0.62, -0.32]]) b.box([0.06, 1.0, 0.06], [cx + x, 0.5, cz + z], { color: 'white' });
    for (const z of [0.32, -0.32]) {
      b.box([1.24, 0.05, 0.05], [cx, 0.98, cz + z], { color: 'white' });
      for (let i = 1; i < 9; i++) b.cyl([0.025, 0.5, 0.025], [cx - 0.62 + i * 0.138, 0.71, cz + z], { color: 'white', edge: 'soft' });
    }
    b.ball([0.2, 0.22, 0.16], [cx + 0.3, 0.66, cz], { color: 'brown', edge: 'soft' }).ball(0.16, [cx + 0.3, 0.84, cz], { color: 'brown', edge: 'soft' }).pair((s) => b.ball(0.06, [cx + 0.3 + s * 0.065, 0.92, cz], { color: 'brown', edge: 'soft' }));
    // the mobile on its arm over the crib
    b.stick([cx - 0.62, 0.98, cz], [cx - 0.62, 1.7, cz], 0.03, 'white').stick([cx - 0.62, 1.7, cz], [cx, 1.7, cz], 0.025, 'white');
    b.cyl([0.06, 0.04, 0.06], [cx, 1.66, cz], { color: 'white', name: 'mobile', mover: { kind: 'spin', axis: 'y', amount: 60 } });
    ([[0.25, 0, 'yellow'], [-0.25, 0, 'pink'], [0, 0.25, 'skyblue'], [0, -0.25, 'lime']] as const).forEach(([dx, dz, c]) => {
      b.stick([cx, 1.65, cz], [cx + dx, 1.6, cz + dz], 0.01, 'white', { parent: 'mobile' }).stick([cx + dx, 1.6, cz + dz], [cx + dx, 1.45, cz + dz], 0.006, 'gray', { parent: 'mobile', noInk: true }).star(0.12, [cx + dx, 1.4, cz + dz], { color: c, parent: 'mobile' });
    });
    // the rocking chair
    const rx = 1.0, rz = 0.2;
    b.box([0.55, 0.05, 0.5], [rx, 0.45, rz], { color: 'wood', name: 'chair', pivot: [rx, 0.0, rz] }).box([0.55, 0.65, 0.05], [rx, 0.8, rz - 0.25], { color: 'wood', parent: 'chair', rot: [-10, 0, 0] });
    b.pair((s) => path(b, [-0.42, -0.21, 0, 0.21, 0.42].map((t) => [rx + s * 0.25, 0.04 + t * t * 0.5, rz + t] as Vec3), 0.04, 'darkwood', { parent: 'chair' }).stick([rx + s * 0.25, 0.1, rz + 0.2], [rx + s * 0.25, 0.45, rz + 0.2], 0.04, 'wood', { parent: 'chair' }).stick([rx + s * 0.25, 0.1, rz - 0.2], [rx + s * 0.25, 0.45, rz - 0.2], 0.04, 'wood', { parent: 'chair' }));
    return b
      .box([0.45, 0.08, 0.4], [rx, 0.5, rz + 0.02], { color: '#f4a1c0', round: 0.6, edge: 'soft', parent: 'chair' })
      .socket('crib', [-0.4, 0.57, -1.0], 'inside', { size: 0.7 }).socket('seat', [1.0, 0.5, 0.22], 'seat', { part: 'chair' })
      .act({
        click: [
          [A.operate('mobile', 'on'), A.say('Twinkle, twinkle, little star...', 3), A.wait(3), A.operate('mobile', 'off')],
          [A.pose('chair', { rot: [8, 0, 0], dur: 0.6 }), A.pose('chair', { rot: [-8, 0, 0], dur: 0.8 }), A.pose('chair', { rot: [6, 0, 0], dur: 0.8 }), A.pose('chair', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  e('one', 'ideas', 'numbers', () => counter('one', '1', 1, 'red', 'yellow', COUNT).done()),
  // An origami paper crane (15 cm): a folded pink body, two wings raised in a V, a long neck with the head folded
  // down and a pointed tail; its wings flap.
  e('origami', 'toys', 'crafts', () => {
    const pk = '#f48fb1', lt = '#f7b3cb';
    const b = m('origami', { edge: 'sharp' })
      .pyramid([0.07, 0.03, 0.04], [0, 0.03, 0], 4, { color: pk, rot: [0, 45, 0], name: 'body' })
      .pyramid([0.07, 0.03, 0.04], [0, 0.0, 0], 4, { color: lt, rot: [180, 45, 0], parent: 'body' })
      .cyl([0.014, 0.1, 0.006], [0.055, 0.07, 0], { color: pk, taper: 0.2, segs: 3, rot: [0, 0, -40], parent: 'body' })
      .cyl([0.01, 0.03, 0.005], [0.093, 0.11, 0], { color: pk, taper: 0, segs: 3, rot: [0, 0, -125], parent: 'body' })
      .cyl([0.014, 0.1, 0.006], [-0.055, 0.07, 0], { color: pk, taper: 0.1, segs: 3, rot: [0, 0, 40], parent: 'body' });
    b.pair((s) => b.wedge([0.08, 0.075, 0.002], [0, 0.07, s * 0.022], { color: s > 0 ? lt : pk, rot: [s * 35, 0, 0], apex: -0.25, name: `wing${s > 0 ? 'L' : 'R'}`, pivot: [0, 0.035, s * 0.004], parent: 'body' }));
    return b
      .act({ click: [[A.par(A.pose('wingL', { rot: [-30, 0, 0], dur: 0.2 }), A.pose('wingR', { rot: [30, 0, 0], dur: 0.2 })), A.par(A.pose('wingL', { rot: [10, 0, 0], dur: 0.2 }), A.pose('wingR', { rot: [-10, 0, 0], dur: 0.2 })), A.par(A.pose('wingL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.2 }), A.anim('hop'))]] })
      .done();
  }),
  // Orion the hunter on a planetarium star board: red Betelgeuse and blue Rigel, and the three stars of his belt
  // that light up one after another.
  e('orion', 'sky', 'constellations', () =>
    starBoard('orion', [[-0.3, 0.28], [0.26, 0.26], [-0.1, -0.02], [0.0, -0.04], [0.1, -0.06], [-0.24, -0.34], [0.32, -0.3], [-0.02, 0.4]], [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 7], [1, 7], [0, 1]], { big: [0, 6], names: { 2: 'belt0', 3: 'belt1', 4: 'belt2' } })
      .act({
        click: [
          [A.operate('belt', 'off'), A.wait(0.4), A.operate('belt0', 'on'), A.wait(0.25), A.operate('belt1', 'on'), A.wait(0.25), A.operate('belt2', 'on'), A.effect('sparkle', { dur: 1 })],
          [A.operate('star', 'off'), A.wait(0.4), A.operate('star', 'on')],
        ],
      })
      .done(),
  ),
  // A parade: a drum major in a tall plumed hat with a baton, a drummer with a big bass drum, and two marchers
  // carrying a PARADE banner; they march on the spot to the drum.
  e('parade', 'town', 'events', () => {
    const drum: Extra = (p, d) => {
      p.add({ name: 'drum', parent: 'torso', at: [0, d.torsoH * 0.3, d.td * 0.9], shape: 'cyl', size: [d.tw * 1.6, d.td * 1.2, d.tw * 1.6], srot: [0, 0, 90], color: col('white'), layer: 6 });
      for (const s of [1, -1]) p.add({ name: `drumRim${s}`, parent: 'drum', at: [s * d.td * 0.6, 0, 0], shape: 'torus', tube: 0.1, size: [d.tw * 1.65, d.tw * 1.65, d.td * 0.15], srot: [0, 90, 0], color: col('red'), layer: 7 });
    };
    const P = (tag: string, x: number, o: Parameters<typeof who>[1]) => ({ f: who(`parade ${tag}`, { h: 1.75, bottom: 'white', shoes: 'black', long: true, ...o }), at: [x, 0] as [number, number], yaw: 0, tag });
    const list = [
      P('a', -0.6, { top: 'red', hair: 'black', skin: 'skin3', acc: [hat('military', 'red'), wear('sash', 'gold'), held('baton')] }),
      P('b', 0.6, { top: 'navy', hair: 'brown', skin: 'skin2', acc: [hat('military', 'navy'), drum] }),
      P('c', -1.0, { top: 'red', hair: 'black', skin: 'skin4', pose: 'arms_up' }),
      P('d', 1.0, { top: 'navy', hair: '#d9a441', skin: 'skin1', pose: 'arms_up' }),
    ];
    list[2].at = [-1.1, -1.0];
    list[3].at = [1.1, -1.0];
    const march = (k: number) => A.par(...['a', 'b', 'c', 'd'].flatMap((t) => [A.pose(`${t}legL`, { rot: [-k, 0, 0], dur: 0.25 }), A.pose(`${t}legR`, { rot: [k, 0, 0], dur: 0.25 })]).slice(0, 8));
    return withAct(
      troupe('parade', list, (b) => {
        b.pair((s) => b.stick([s * 1.15, 1.8, -1.0], [s * 1.15, 2.7, -1.0], 0.04, 'wood'));
        b.box([2.3, 0.6, 0.03], [0, 2.4, -1.0], { color: 'yellow', edge: 'sharp' }).label('PARADE', [1.8, 0.45], [0, 2.4, -0.98], { color: 'yellow' });
        for (const [x, c] of [[-0.6, 'pink'], [0.0, 'lime'], [0.6, 'orange']] as const) b.stick([x * 0.4, 2.7, -1.0], [x, 3.0, -1.1], 0.008, 'gray').ball([0.28, 0.33, 0.28], [x, 3.15, -1.1], { color: c });
        return b;
      }),
      { click: [[A.par(march(25), A.say('Boom! Boom! Boom!', 2)), march(-25), march(25), march(-25), march(0), A.effect('sparkle', { dur: 1 })]] },
    );
  }),
  // A party table: a birthday cake with lit candles, a gift that pops open, a bunch of balloons, party hats and
  // confetti. Surprise! Then the candles are blown out, and lit again.
  e('party', 'toys', 'party', () => {
    const b = m('party', { edge: 'sharp' }).box([1.6, 0.05, 0.8], [0, 0.73, 0], { color: '#a8d8f5' });
    for (const [x, z] of [[-0.72, 0.32], [0.72, 0.32], [-0.72, -0.32], [0.72, -0.32]]) b.stick([x, 0, z], [x, 0.71, z], 0.04, 'white');
    b.box([1.62, 0.12, 0.82], [0, 0.69, 0], { color: '#f4a1c0', round: 0.1, noInk: true });
    b.cyl([0.32, 0.14, 0.32], [-0.2, 0.83, 0], { color: 'white', edge: 'soft' }).cyl([0.33, 0.03, 0.33], [-0.2, 0.86, 0], { color: 'pink', edge: 'soft' });
    ([[-0.08, 0], [0, 0.06], [0.08, -0.02], [0.02, -0.08]] as const).forEach(([dx, dz], i) => b.cyl([0.012, 0.06, 0.012], [-0.2 + dx, 0.93, dz], { color: 'skyblue' }).ball([0.02, 0.035, 0.02], [-0.2 + dx, 0.975, dz], { color: 'flame', glow: true, name: `candle${i}`, mover: { kind: 'light', on: true }, edge: 'soft' }));
    b.box([0.22, 0.18, 0.22], [0.35, 0.845, 0.1], { color: 'purple' }).box([0.23, 0.18, 0.04], [0.35, 0.845, 0.1], { color: 'yellow', noInk: true });
    b.box([0.24, 0.05, 0.24], [0.35, 0.96, 0.1], { color: 'purple', name: 'giftlid' }).ball([0.1, 0.06, 0.05], [0.35, 1.0, 0.1], { color: 'yellow', parent: 'giftlid', edge: 'soft' });
    for (const [x, z, c] of [[0.6, -0.25, 'red'], [0.68, -0.32, 'blue'], [0.55, -0.35, 'green']] as const) b.stick([0.62, 0.76, -0.3], [x, 1.55, z], 0.006, 'gray', { noInk: true }).ball([0.26, 0.31, 0.26], [x, 1.7, z], { color: c, edge: 'soft' });
    b.cone([0.1, 0.16, 0.1], [-0.55, 0.835, 0.2], { color: 'cyan' }).cone([0.1, 0.16, 0.1], [-0.6, 0.835, -0.15], { color: 'magenta' });
    for (const [x, z, c] of [[-0.35, 0.3, 'yellow'], [0.1, 0.3, 'pink'], [0.2, -0.25, 'lime'], [-0.45, -0.2, 'cyan'], [0.5, 0.25, 'orange']] as const) b.box([0.03, 0.004, 0.03], [x, 0.757, z], { color: c, noInk: true, rot: [0, 30, 0] });
    return b
      .socket('top', [0.5, 0.76, -0.1], 'top', { size: 0.4 })
      .act({
        click: [
          [A.par(A.pose('giftlid', { move: [0, 0.25, 0], rot: [0, 0, 30], dur: 0.3 }), A.effect('sparkle', { dur: 1.5 }), A.say('Surprise!', 1.5)), A.wait(0.8), A.pose('giftlid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
          [A.par(A.operate('candle', 'off'), A.effect('smoke', { dur: 1 }), A.say('Whoosh! Happy birthday!', 2))],
          [A.operate('candle', 'on'), A.effect('sparkle', { dur: 0.8 })],
        ],
      })
      .done();
  }),
  // A garden path of stepping stones (5 m) curving across the lawn between low flowers; a cat strolls along it.
  e('path', 'garden', 'garden things', () => {
    const b = m('path').box([5.6, 0.05, 2.4], [0, 0.025, 0], { color: 'grass', round: 0.1 });
    for (let i = 0; i < 8; i++) {
      const t = i / 7, x = -2.4 + t * 4.8, z = Math.sin(t * Math.PI * 1.5) * 0.5;
      b.cyl([0.55, 0.06, 0.45], [x, 0.06, z], { color: i % 2 ? 'stone' : '#b5b3aa', segs: 7, rot: [0, i * 40, 0], edge: 'sharp' });
    }
    for (const [x, z, c] of [[-2, -0.8, 'yellow'], [-1, 0.95, 'red'], [0.1, -0.9, 'white'], [1.0, 0.85, 'purple'], [2.1, -0.7, 'pink'], [-0.4, 1.0, 'orange'], [1.6, 0.9, 'yellow']] as const)
      for (const d of [-0.12, 0, 0.12]) b.rod([x + d, 0.05, z], [x + d, 0.25, z], 0.012, 'green').ball(0.07, [x + d, 0.27, z], { color: c });
    return b
      .act({ click: [[A.spawn('cat', 'cat', { rel: 'left', of: 'self', dist: 'near' }), A.move('cat', { rel: 'right', of: 'self', dist: 'near' }, { speed: 'walk' }), A.say('Meow.', 1), A.remove('cat', 'fade')]] })
      .done();
  }),
  // The periodic table as a classroom wall chart (1.6 m) on a stand: colour blocks for the element families; a
  // teacher's pointer taps hydrogen and its tile lights up.
  e('periodic table', 'study', 'science', () => {
    const u = 0.08, X = (c: number) => -0.72 + (c - 0.5) * u, T = 1.95;
    const b = m('periodic table', { edge: 'sharp' });
    b.pair((s) => b.box([0.06, 2.1, 0.06], [s * 0.85, 1.05, -0.05], { color: 'silver' }).box([0.06, 0.04, 0.5], [s * 0.85, 0.02, -0.05], { color: 'silver' }));
    b.box([1.62, 1.0, 0.03], [0, 1.6, 0], { color: 'white', round: 0.1 }).label('PERIODIC TABLE OF THE ELEMENTS', [1.0, 0.07], [0, 2.05, 0.02], { color: 'white', depth: 0.004 });
    for (const [c0, c1, r0, r1, col0] of [[1, 1, 2, 7, '#e0473b'], [2, 2, 2, 7, '#f0923b'], [3, 12, 4, 7, '#f6d24a'], [13, 17, 2, 7, '#3fa7a0'], [18, 18, 1, 7, '#8a5fc4']] as const)
      b.box([(c1 - c0 + 1) * u - 0.008, (r1 - r0 + 1) * u - 0.008, 0.012], [(X(c0) + X(c1)) / 2, T - ((r0 + r1) / 2 - 0.5) * u, 0.02], { color: col0, round: 0.05 });
    b.box([14 * u - 0.008, 2 * u - 0.008, 0.012], [(X(4) + X(17)) / 2, T - 8.4 * u, 0.02], { color: '#55b05f', round: 0.05 });
    b.box([u - 0.008, u - 0.008, 0.016], [X(1), T - 0.5 * u, 0.022], { color: '#fff3a0', glow: true, name: 'hydrogen', mover: { kind: 'light', on: false } });
    for (let r = 2; r < 8; r++) b.box([18 * u, 0.004, 0.004], [0, T - (r - 1) * u, 0.028], { color: 'white', noInk: true, round: 0 });
    return b
      .rod([0.95, 1.0, 0.2], [0.2, 1.6, 0.25], 0.015, 'wood', { name: 'pointer', pivot: [0.95, 1.0, 0.2] })
      .act({
        click: [
          [A.pose('pointer', { rot: [0, 0, 22], dur: 0.5 }), A.par(A.operate('hydrogen', 'on'), A.say('H: hydrogen, number one!', 2)), A.wait(1.5), A.par(A.operate('hydrogen', 'off'), A.pose('pointer', { rot: [0, 0, 0], dur: 0.5 }))],
        ],
      })
      .done();
  }),
  // Pestilence: a plague doctor in a long black coat, a wide hat and the beaked mask, leaning on a cane.
  e('pestilence', 'ideas', 'hardship', () =>
    withAct(who('pestilence', { top: 'black', bottom: 'black', shoes: 'black', long: true, skin: 'skin1', style: 'short', hair: 'black', acc: [gown('#2a2726'), hat('cowboy', 'black'), wear('cloak', 'black'), beakMask, held('cane', 'black')] }), {
      click: [[A.par(A.anim('point'), A.say('Keep your distance!', 2))], [A.par(A.anim('shake_head'), A.say('Wash your hands, I beg you.', 2))]],
    }),
  ),
  // The phoenix: a fire bird of red and gold rising from a nest of flames; it beats its wings in a burst of fire.
  e('phoenix', 'fantasy', 'creatures', () =>
    withAct(
      lift(bird('phoenix', { height: 0.9, color: 'red', wing: 'orange', beak: 'gold', legs: 'darkred', comb: 'gold', tail: ['yellow', 'orange', 'red', 'orange', 'yellow'] }), 0.12, (b) => {
        b.cyl([0.6, 0.1, 0.6], [0, 0.05, 0], { color: '#3a2a20' }).torus([0.6, 0.6, 0.12], [0, 0.12, 0], { color: '#5a3a22', rot: [90, 0, 0], tube: 0.3 });
        around(7, 0.24).forEach(([x, z], i) => b.cone([0.14, 0.32 + (i % 2) * 0.14, 0.14], [x, 0.24 + (i % 2) * 0.07, z], { color: i % 2 ? 'orange' : 'yellow', glow: true }));
        return b;
      }),
      {
        click: [
          [A.par(A.anim('flap', 2), A.effect('fire', { dur: 2 }), A.say('KREEEE!', 1.5))],
          [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.5 }), A.say('Reborn from the ashes!', 2))],
        ],
      },
    ),
  ),
  // Phosphorus on the lab bench: its tile (P, 15) on a stand, a jar of the white element glowing under water, and a
  // match (phosphorus is in the head) that strikes on its box.
  e('phosphorus', 'study', 'chemistry', () =>
    m('phosphorus', { edge: 'sharp' })
      .box([0.7, 0.04, 0.4], [0, 0.02, 0], { color: '#5c6166' })
      .box([0.3, 0.3, 0.03], [-0.18, 0.25, -0.1], { color: 'orange', round: 0.1, rot: [-10, 0, 0] })
      .label('P', [0.16, 0.16], [-0.18, 0.24, -0.08], { color: 'orange', rot: [-10, 0, 0], depth: 0.004 })
      .label('15', [0.07, 0.05], [-0.27, 0.36, -0.065], { color: 'orange', rot: [-10, 0, 0], depth: 0.004 })
      .box([0.2, 0.08, 0.06], [-0.18, 0.08, -0.06], { color: 'darkwood' })
      .cyl([0.16, 0.2, 0.16], [0.16, 0.14, -0.05], { color: 'glass' })
      .cyl([0.17, 0.03, 0.17], [0.16, 0.255, -0.05], { color: 'darkgray' })
      .cyl([0.14, 0.12, 0.14], [0.16, 0.11, -0.05], { color: '#a9dcf2', edge: 'soft' })
      .ball([0.05, 0.04, 0.05], [0.14, 0.07, -0.04], { color: '#d8ffb0', glow: true, name: 'glow', mover: { kind: 'light', on: true }, edge: 'soft' })
      .ball([0.04, 0.03, 0.04], [0.19, 0.065, -0.07], { color: '#d8ffb0', glow: true, parent: 'glow', edge: 'soft' })
      .box([0.1, 0.02, 0.06], [0.05, 0.05, 0.12], { color: '#e0473b' })
      .box([0.1, 0.004, 0.02], [0.05, 0.061, 0.095], { color: '#5a3a22', noInk: true })
      .box([0.08, 0.005, 0.006], [0.12, 0.045, 0.12], { color: 'lightwood', rot: [0, -20, 0], name: 'match' })
      .ball([0.012, 0.012, 0.012], [0.157, 0.045, 0.133], { color: '#a3322a', parent: 'match', edge: 'soft' })
      .ball([0.02, 0.035, 0.02], [0.157, 0.065, 0.133], { color: 'flame', glow: true, parent: 'match', name: 'matchflame', mover: { kind: 'light', on: false }, scale: 1, edge: 'soft' })
      .act({
        click: [
          [A.pose('match', { move: [-0.06, 0.02, 0], dur: 0.2 }), A.par(A.operate('matchflame', 'on'), A.say('Scratch... fwoosh!', 1.5)), A.wait(1.5), A.par(A.operate('matchflame', 'off'), A.effect('smoke', { dur: 1 }), A.pose('match', { move: [0, 0, 0], dur: 0.3 }))],
          [A.operate('glow', 'off'), A.wait(0.4), A.operate('glow', 'on'), A.effect('sparkle', { dur: 1 })],
        ],
      })
      .done(),
  ),
  // A display head with pigtails tied with red bows; they swing.
  e('pig tail', 'wardrobe', 'hairstyles', () =>
    mannequin('pig tail', { hair: '#7a3b1e', top: 'pink', skin: 'skin1' }, (b, hc) => {
      b.pair((s) => {
        const n = `tail${s > 0 ? 'L' : 'R'}`;
        b.ball(0.035, [s * 0.09, 0.29, -0.03], { color: 'red', parent: 'hair', name: n, pivot: [s * 0.085, 0.29, -0.03] })
          .rod([s * 0.1, 0.28, -0.03], [s * 0.15, 0.17, -0.03], 0.05, hc, { parent: n })
          .rod([s * 0.15, 0.17, -0.03], [s * 0.16, 0.11, -0.02], 0.04, hc, { parent: n });
        b.pair((t) => b.ball([0.04, 0.025, 0.02], [s * 0.09 + t * 0.025, 0.3, -0.03], { color: 'red', rot: [0, 0, t * 30], parent: n }));
      });
    })
      .act({ click: [[A.par(A.pose('tailL', { rot: [0, 0, 35], dur: 0.3 }), A.pose('tailR', { rot: [0, 0, -35], dur: 0.3 }), A.say('Boing boing!', 1.2)), A.par(A.pose('tailL', { rot: [0, 0, -10], dur: 0.3 }), A.pose('tailR', { rot: [0, 0, 10], dur: 0.3 })), A.par(A.pose('tailL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('tailR', { rot: [0, 0, 0], dur: 0.3 }))]] })
      .done(),
  ),
  // The fishes on the zodiac plinth: two fish tied by a golden cord, swimming round and round the plinth's pole.
  e('pisces (stars)', 'sky', 'zodiac', () => {
    const b = zb(m('pisces (stars)'), 'PISCES').stick([0, 0.12, 0], [0, 0.85, 0], 0.03, 'gold');
    b.ball(0.06, [0, 0.55, 0], { color: 'gold', name: 'fish', mover: { kind: 'spin', axis: 'y', amount: 120 } });
    const pf = (x: number, y: number, z: number, dir: number, c: string) => {
      b.ball([0.12, 0.13, 0.3], [x, y, z], { color: c, parent: 'fish' }).cone([0.04, 0.12, 0.13], [x, y, z - dir * 0.2], { color: c, segs: 3, rot: [dir * -90, 0, 0], parent: 'fish' });
      b.pair((s) => b.ball(0.028, [x + s * 0.05, y + 0.03, z + dir * 0.1], { color: 'black', eye: true, noInk: true, parent: 'fish' }));
      b.stick([0, y, 0], [x, y, z], 0.012, 'gold', { parent: 'fish' });
    };
    pf(0.3, 0.7, 0, 1, 'teal');
    pf(-0.3, 0.4, 0, -1, 'skyblue');
    return b.act({ click: [[A.operate('fish', 'on'), A.effect('water_spray', { dur: 1.5 }), A.wait(2.5), A.operate('fish', 'off')]] }).done();
  }),
  // A plateau (a mesa, 11 m high): flat-topped with sheer banded red cliffs, scree slopes and boulders at its foot,
  // scrub on top and a hawk circling above; shout and it echoes.
  e('plateau', 'nature', 'landforms', () => {
    const b = m('plateau').cyl([36, 0.1, 28], [0, 0.05, 0], { color: '#d9b98a' });
    const blocks: Array<[number, number, number, number, number]> = [[0, 0, 20, 14, 0], [-7, 2, 10, 9, 25], [6, -2, 11, 10, -18], [2, 4, 9, 7, 40], [-4, -4, 9, 8, -35]];
    blocks.forEach(([x, z, w, d, r], i) => {
      b.box([w, 3.4, d], [x, 1.8, z], { color: '#c0703a', rot: [0, r, 0], edge: 'sharp', round: 0.05 })
        .box([w - 0.3, 3.6, d - 0.3], [x, 5.3, z], { color: i % 2 ? '#a85a30' : '#b05a30', rot: [0, r, 0], edge: 'sharp', round: 0.05 })
        .box([w - 0.6, 3.0, d - 0.6], [x, 8.6, z], { color: '#c0703a', rot: [0, r, 0], edge: 'sharp', round: 0.05 })
        .box([w - 0.5, 0.4, d - 0.5], [x, 10.3, z], { color: '#8a9a4a', rot: [0, r, 0], edge: 'sharp', round: 0.3 });
    });
    for (const [x, z, w] of [[-9, 8, 6], [8, 8, 7], [12, -6, 6], [-12, -5, 5], [0, 9.5, 8]]) b.dome([w, 2.4, w * 0.6], [x, 1.2, z], { color: '#c98a5a' });
    for (const [x, z] of [[-6, -3], [4, 2], [7, -4], [-3, 4], [0, -1], [-8, 1]]) b.ball([1.6, 1.0, 1.6], [x, 10.9, z], { color: '#5a7a3a' });
    for (const [x, z, s] of [[-14, 9, 1.6], [13, 10, 1.4], [3, 12, 1.0], [-6, 11.5, 1.2], [15, 3, 1.8]]) b.ball([s * 1.3, s, s], [x, s * 0.4, z], { color: '#a0623a' });
    b.ball(0.2, [0, 15, 0], { color: '#5a3a22', name: 'hawk', mover: { kind: 'spin', axis: 'y', amount: 30, on: true } });
    b.ball([0.3, 0.2, 0.6], [5, 15, 0], { color: '#5a3a22', parent: 'hawk' }).ball([1.8, 0.06, 0.4], [5, 15.1, 0], { color: '#7a4a2a', parent: 'hawk', rot: [0, 90, 0] });
    return b.act({ click: [[A.say('Hello... hello... hello...', 3), A.pose('hawk', { spin: [0, 120, 0] }), A.wait(2), A.pose('hawk', { spin: [0, 30, 0] })]] }).done();
  }),
  // A planetarium Pluto (3 m): pale tan with the great white heart on its face; the heart lights up, and its moon
  // Charon goes round on its arm.
  e('pluto', 'sky', 'planets', () => {
    const b = orb('pluto', 2.6, 1.85, '#d9b48f', { spin: 8 });
    b.heart(1.0, [0.25, 1.7, 1.18], { color: '#f4f0e8', noInk: true, parent: 'globe' });
    b.ball([0.3, 0.3, 0.06], [0.22, 1.66, 1.26], { color: '#fff3e8', glow: true, name: 'heart', mover: { kind: 'light', on: false }, parent: 'globe' });
    for (const [x, y, s] of [[-0.6, 0.4, 0.6], [-0.4, -0.6, 0.4]]) b.ball([s, s * 0.6, 0.12], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.05], { color: '#8a6040', noInk: true, parent: 'globe' });
    b.cyl([0.24, 0.1, 0.24], [0, 0.4, 0], { color: 'brass', name: 'charon', mover: { kind: 'spin', axis: 'y', amount: 60 }, edge: 'sharp' })
      .stick([0, 0.4, 0], [1.5, 0.4, 0.3], 0.025, 'brass', { parent: 'charon' })
      .ball(0.4, [1.5, 0.62, 0.3], { color: '#a0988c', parent: 'charon' });
    return b
      .act({
        click: [
          [A.par(A.operate('heart', 'on'), A.effect('hearts', { dur: 2 })), A.wait(2), A.operate('heart', 'off')],
          [A.operate('charon', 'on'), A.wait(3), A.operate('charon', 'off')],
        ],
      })
      .done();
  }),
  // A poem being written: a slanted writing desk with a sheet of verse, a quill in an inkwell and a candle; the quill
  // writes and a voice reads the first lines.
  e('poem', 'study', 'writing', () => {
    const b = m('poem', { edge: 'sharp' }).box([0.9, 0.04, 0.55], [0, 0.74, 0], { color: 'darkwood' });
    for (const [x, z] of [[-0.4, 0.22], [0.4, 0.22], [-0.4, -0.22], [0.4, -0.22]]) b.box([0.05, 0.72, 0.05], [x, 0.36, z], { color: 'darkwood' });
    b.box([0.55, 0.08, 0.4], [-0.08, 0.8, 0], { color: 'wood', rot: [12, 0, 0] }).box([0.3, 0.004, 0.38], [-0.1, 0.845, 0.0], { color: '#f2e6c8', rot: [12, 0, 0], round: 0 });
    for (let i = 0; i < 6; i++) b.box([i % 2 ? 0.16 : 0.22, 0.002, 0.006], [-0.12, 0.85 - i * 0.012, -0.12 + i * 0.055], { color: '#3a3633', rot: [12, 0, 0], noInk: true, round: 0 });
    b.cyl([0.07, 0.06, 0.07], [0.3, 0.79, 0.05], { color: '#2a2726' })
      .rod([0.31, 0.8, 0.05], [0.33, 1.08, -0.02], 0.006, '#5a4a3a', { name: 'quill', pivot: [0.31, 0.8, 0.05] })
      .ball([0.04, 0.2, 0.012], [0.335, 1.0, -0.01], { color: 'white', rot: [15, 0, -8], parent: 'quill' });
    b.cyl([0.1, 0.02, 0.1], [0.33, 0.77, -0.18], { color: 'brass' }).cyl([0.045, 0.14, 0.045], [0.33, 0.85, -0.18], { color: 'cream', edge: 'soft' }).cone([0.03, 0.05, 0.03], [0.33, 0.945, -0.18], { color: 'flame', glow: true, edge: 'soft' });
    return b
      .act({ click: [[A.pose('quill', { rot: [-15, 0, 30], dur: 0.4 }), A.par(A.pose('quill', { rot: [-10, 0, 40], dur: 0.6 }), A.say('Roses are red, violets are blue...', 2.5)), A.wait(1.5), A.pose('quill', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // Poison: a purple glass bottle (25 cm) with a skull and crossbones and a cork, standing on two old books, green
  // fumes curling from it; the cork pops.
  e('poison', 'fantasy', 'potions', () =>
    m('poison')
      .box([0.26, 0.05, 0.19], [0, 0.025, 0], { color: '#5a1e2a', edge: 'sharp', round: 0.2 })
      .box([0.24, 0.045, 0.17], [0.01, 0.072, 0], { color: '#2f4a3a', edge: 'sharp', round: 0.2, rot: [0, 8, 0] })
      .ball([0.16, 0.15, 0.16], [0, 0.17, 0], { color: '#8a5fc4', name: 'bottle' })
      .cyl([0.07, 0.09, 0.07], [0, 0.28, 0], { color: '#8a5fc4', parent: 'bottle' })
      .cyl([0.08, 0.015, 0.08], [0, 0.33, 0], { color: '#7a4fb4', parent: 'bottle' })
      .cyl([0.055, 0.05, 0.055], [0, 0.355, 0], { color: 'tan', taper: 1.15, parent: 'bottle', name: 'cork', piece: true })
      .ball([0.06, 0.055, 0.02], [0, 0.19, 0.075], { color: 'white', parent: 'bottle' })
      .capsule([0.016, 0.08, 0.014], [0, 0.15, 0.077], { color: 'white', rot: [0, 0, 45], parent: 'bottle' })
      .capsule([0.016, 0.08, 0.014], [0, 0.15, 0.077], { color: 'white', rot: [0, 0, -45], parent: 'bottle' })
      .ball([0.014, 0.016, 0.008], [0.012, 0.193, 0.085], { color: 'black', noInk: true, parent: 'bottle' })
      .ball([0.014, 0.016, 0.008], [-0.012, 0.193, 0.085], { color: 'black', noInk: true, parent: 'bottle' })
      .ball(0.04, [0.03, 0.42, 0], { color: 'lime', glow: true })
      .ball(0.03, [-0.02, 0.47, 0.01], { color: 'lime', glow: true })
      .act({ click: [[A.detach('cork', 'cork'), A.par(A.effect('smoke', { dur: 2 }), A.say('Pop! Hissss...', 1.5))], [A.reattach('cork')]] })
      .done(),
  ),
  // Poker at a real poker table (2 m, green felt, padded rail): a royal flush fanned out, stacks of chips, the dealer
  // button; all in!
  e('poker', 'toys', 'card games', () => {
    const b = m('poker', { edge: 'sharp' });
    b.cyl([2.0, 0.06, 1.1], [0, 0.72, 0], { color: '#2f7a3a', segs: 8, edge: 'soft' }).torus([2.05, 1.15, 0.12], [0, 0.76, 0], { color: '#3a2a20', rot: [90, 0, 0], tube: 0.12, edge: 'soft' });
    b.cyl([0.5, 0.68, 0.3], [0, 0.34, 0], { color: '#2a2726', taper: 0.6 });
    ['A', 'K', 'Q', 'J', '10'].forEach((t, i) => b.label(t, [0.063, 0.088], [-0.12 + i * 0.05, 0.756, 0.25 + Math.abs(i - 2) * -0.01], { color: 'white', rot: [-90, 0, (i - 2) * -8], depth: 0.002 }));
    b.cyl([0.06, 0.012, 0.06], [0.4, 0.759, 0.3], { color: 'white' }).label('D', [0.03, 0.03], [0.4, 0.766, 0.3], { color: 'white', rot: [-90, 0, 0], depth: 0.002 });
    b.cyl([0.04, 0.01, 0.04], [-0.55, 0.76, 0.28], { color: 'red', name: 'chips' });
    for (const [x, z, n, c] of [[-0.55, 0.28, 6, 'red'], [-0.48, 0.32, 4, 'blue'], [-0.6, 0.35, 3, 'black']] as const) for (let k = 0; k < n; k++) b.cyl([0.04, 0.009, 0.04], [x, 0.76 + k * 0.009, z], { color: c, parent: 'chips', noInk: k % 2 === 1 });
    for (const [x, z, n, c] of [[0.6, -0.3, 5, 'blue'], [0.65, -0.24, 3, 'white'], [-0.3, -0.35, 4, 'black']] as const) for (let k = 0; k < n; k++) b.cyl([0.04, 0.009, 0.04], [x, 0.76 + k * 0.009, z], { color: c });
    return b
      .socket('top', [0, 0.77, 0], 'top', { size: 0.6 })
      .act({
        click: [
          [A.pose('chips', { move: [0.5, 0, -0.25], dur: 0.6 }), A.say('All in!', 1.5)],
          [A.par(A.pose('chips', { move: [0, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 1.2 }), A.say('Royal flush!', 1.5))],
        ],
      })
      .done();
  }),
  // Real size wins over the vocabulary's 1 m: a police academy (two storeys, 16 m wide) with a big badge over the
  // doors, a flagpole, and a patrol car out front whose lights flash.
  e('police academy', 'places', 'schools', () => {
    const W = 16, D = 9, H = 7.4, zf = D / 2;
    const b = m('police academy', { edge: 'sharp' });
    b.box([W + 8, 0.08, D + 12], [0, 0.04, 3], { color: '#8f949a' });
    b.box([W, H, D], [0, H / 2, 0], { color: '#a3604a', round: 0.02 }).box([W + 0.4, 0.5, D + 0.4], [0, H + 0.25, 0], { color: '#d4d7da' }).box([W + 0.05, 0.3, D + 0.05], [0, 3.6, 0], { color: '#d4d7da' });
    b.box([5, 4.4, 0.6], [0, 2.2, zf + 0.3], { color: '#d4d7da' }).box([5.4, 0.4, 2.0], [0, 3.4, zf + 1.0], { color: '#2f4f8f' });
    door(b, -0.6, zf + 0.6, { w: 1.1, h: 2.4, color: '#2f3d52', glass: true, frame: '#2f4f8f', name: 'doorL' });
    door(b, 0.6, zf + 0.6, { w: 1.1, h: 2.4, color: '#2f3d52', glass: true, noFrame: true, name: 'doorR', right: true });
    b.star(1.6, [0, 5.4, zf + 0.12], { color: 'gold' }).label('POLICE ACADEMY', [6, 0.7], [0, 6.85, zf + 0.04], { color: '#2f4f8f' });
    for (const x of [-6.5, -4.2, 4.2, 6.5]) for (const y of [1.8, 5.4]) win(b, x, y, zf, 1.4, 1.6, 'white', { bars: true });
    b.stick([-10, 0, 6], [-10, 10, 6], 0.15, 'silver').box([2.2, 1.3, 0.05], [-8.9, 9.2, 6], { color: '#2f4f8f', name: 'flag', pivot: [-10, 9.2, 6] });
    const cx = 5, cz = 9;
    b.loft([1.85, 1.45, 4.8], [cx, 0.75, cz], [[0, 0.85, 0.55, -0.15], [0.12, 0.95, 0.65, -0.1], [0.3, 1, 1, 0.12], [0.62, 1, 1, 0.12], [0.78, 1, 0.65, -0.08], [1, 0.9, 0.5, -0.16]], { color: 'white', boxy: 0.7, rot: [0, 90, 0], name: 'car', edge: 'soft' })
      .box([4.82, 0.4, 1.86], [cx, 0.85, cz], { color: '#2a2726', parent: 'car', noInk: true })
      .box([1.7, 0.42, 1.88], [cx - 0.15, 1.2, cz], { color: '#2f3d52', parent: 'car' })
      .box([0.5, 0.15, 0.5], [cx - 0.15, 1.52, cz - 0.3], { color: '#e0473b', glow: true, parent: 'car', name: 'lightR', mover: { kind: 'light', on: false } })
      .box([0.5, 0.15, 0.5], [cx - 0.15, 1.52, cz + 0.3], { color: '#4e8fd6', glow: true, parent: 'car', name: 'lightB', mover: { kind: 'light', on: false } });
    for (const x of [-1.5, 1.5]) for (const dz of [-0.85, 0.85]) b.cyl([0.65, 0.22, 0.65], [cx + x, 0.33, cz + dz], { color: 'rubber', rot: [90, 0, 0], parent: 'car', edge: 'soft', name: `wheel${x > 0 ? 'f' : 'b'}${dz > 0 ? 'l' : 'r'}` });
    return b
      .act({
        click: [
          [A.par(A.operate('lightR', 'on'), A.say('Wee-woo! Wee-woo!', 2)), A.wait(0.3), A.par(A.operate('lightR', 'off'), A.operate('lightB', 'on')), A.wait(0.3), A.par(A.operate('lightR', 'on'), A.operate('lightB', 'off')), A.wait(0.3), A.par(A.operate('lightR', 'off'), A.operate('lightB', 'on')), A.wait(0.3), A.operate('lightB', 'off')],
          [A.operate('door', 'open'), A.say('Tweeeet!', 1.5), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A display head with a high ponytail in a scrunchie; it swishes.
  e('pony tail', 'wardrobe', 'hairstyles', () =>
    mannequin('pony tail', { hair: '#d9a441', top: 'pink', skin: 'skin2' }, (b, hc) => {
      b.torus([0.05, 0.05, 0.03], [0, 0.35, -0.085], { color: 'red', rot: [60, 0, 0], tube: 0.45, parent: 'hair', name: 'tail', pivot: [0, 0.35, -0.09] })
        .rod([0, 0.34, -0.1], [0.0, 0.25, -0.17], 0.06, hc, { parent: 'tail' })
        .rod([0.0, 0.25, -0.17], [0.02, 0.13, -0.16], 0.045, hc, { parent: 'tail' })
        .cone([0.04, 0.06, 0.04], [0.025, 0.08, -0.155], { color: hc, rot: [180, 0, 0], parent: 'tail' });
    })
      .act({ click: [[A.pose('tail', { rot: [0, 0, 30], dur: 0.25 }), A.pose('tail', { rot: [0, 0, -30], dur: 0.4 }), A.par(A.pose('tail', { rot: [0, 0, 0], dur: 0.3 }), A.say('Swish!', 1))]] })
      .done(),
  ),
  // A magic portal (2.8 m): a ring of runed standing stones on a stepped base holding a swirl of violet light that
  // turns; something drifts out of it.
  e('portal', 'fantasy', 'magic', () => {
    const b = m('portal')
      .box([3.4, 0.2, 1.4], [0, 0.1, 0], { color: 'stone', edge: 'sharp', round: 0.2 })
      .box([2.8, 0.2, 1.1], [0, 0.3, 0], { color: '#b8b8b0', edge: 'sharp', round: 0.2 })
      .torus([2.6, 2.6, 0.5], [0, 1.65, 0], { color: '#8f8c86', tube: 0.18 });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      b.box([0.36, 0.3, 0.56], [Math.sin(a) * 1.18, 1.65 + Math.cos(a) * 1.18, 0], { color: '#a7a7a0', rot: [0, 0, -a / D2R], edge: 'sharp' })
        .box([0.12, 0.12, 0.02], [Math.sin(a) * 1.18, 1.65 + Math.cos(a) * 1.18, 0.29], { color: 'cyan', glow: true, rot: [0, 0, -a / D2R + 45], noInk: true });
    }
    const fig = b
      .cyl([2.1, 0.04, 2.1], [0, 1.65, 0], { color: '#6a3fb0', glow: true, rot: [90, 0, 0] })
      .torus([1.7, 1.7, 0.06], [0, 1.65, 0.04], { color: 'magenta', glow: true, tube: 0.12, noInk: true, name: 'swirl1', mover: { kind: 'spin', axis: 'z', amount: 90, on: true } })
      .torus([1.15, 1.15, 0.06], [0, 1.65, 0.05], { color: 'cyan', glow: true, tube: 0.16, noInk: true, name: 'swirl2', mover: { kind: 'spin', axis: 'z', amount: -140, on: true } })
      .torus([0.6, 0.6, 0.06], [0, 1.65, 0.06], { color: 'white', glow: true, tube: 0.25, noInk: true, name: 'swirl3', mover: { kind: 'spin', axis: 'z', amount: 200, on: true } })
      .act({
        click: [
          [A.par(A.pose('swirl1', { spin: [0, 0, 400] }), A.pose('swirl2', { spin: [0, 0, -500] }), A.effect('sparkle', { dur: 2 }), A.say('Vwoooom!', 1.5)), A.spawn('w', 'wisp', { rel: 'front', of: 'self', dist: 'close' }), A.wait(1.5), A.remove('w', 'fade'), A.par(A.pose('swirl1', { spin: [0, 0, 90] }), A.pose('swirl2', { spin: [0, 0, -140] }))],
        ],
      })
      .done();
    return fig;
  }),
  // A glass prism (12 cm) on a black stand: a white beam of light goes in and a fan of rainbow colours comes out.
  e('prism (shape)', 'ideas', 'shapes', () => {
    const b = m('prism (shape)', { edge: 'sharp' })
      .box([0.4, 0.03, 0.2], [0, 0.015, 0], { color: '#2a2726', round: 0.3 })
      .prism([0.13, 0.1, 0.13], [0, 0.11, 0], 3, { color: 'glass', rot: [90, 0, 0] })
      .stick([-0.22, 0.07, 0], [-0.04, 0.11, 0], 0.012, 'white', { glow: true, name: 'beam', mover: { kind: 'light', on: true } });
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].forEach((c, i) => b.stick([0.04, 0.115, 0], [0.24, 0.17 - i * 0.028, 0], 0.01, c, { glow: true, noInk: true, name: `ray${i}`, mover: { kind: 'light', on: true } }));
    return b
      .act({ click: [[A.par(A.operate('beam', 'off'), A.operate('ray', 'off')), A.wait(0.6), A.operate('beam', 'on'), A.wait(0.2), ...[0, 1, 2, 3, 4, 5].map((i) => A.operate(`ray${i}`, 'on')), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A rain cloud (3.4 m): a heavy grey cloud raining on a bed of drooping flowers and a puddle; the rain makes the
  // flowers perk up.
  e('rain cloud', 'nature', 'weather', () => {
    const b = m('rain cloud').cyl([3, 0.06, 2.2], [0, 0.03, 0], { color: 'grass' }).cyl([1.2, 0.03, 0.8], [0.6, 0.075, 0.4], { color: 'water' });
    cloud(b, 0, 2.7, 0, 2.3, '#8f99a3', { name: 'cloud' });
    for (const [x, y, z] of [[-0.7, 1.9, 0.2], [-0.25, 1.5, 0.3], [0.3, 2.0, 0.1], [0.7, 1.4, 0.2], [-0.5, 1.0, 0.1], [0.1, 0.9, 0.3]]) drop(b, x, y, z, 0.16, 'water', { parent: 'cloud' });
    b.ball(0.02, [-0.5, 0.06, -0.3], { color: 'green', name: 'flowers', pivot: [-0.5, 0.05, -0.3] });
    for (const [x, z, c] of [[-0.8, -0.4, 'red'], [-0.5, -0.2, 'yellow'], [-0.2, -0.45, 'pink']] as const) b.rod([x, 0.06, z], [x + 0.1, 0.4, z], 0.02, 'green', { parent: 'flowers' }).ball([0.12, 0.08, 0.12], [x + 0.14, 0.38, z], { color: c, rot: [0, 0, -40], parent: 'flowers' });
    return b
      .act({
        click: [
          [A.par(A.effect('rain', { dur: 3 }), A.pose('cloud', { move: [0, -0.15, 0], dur: 0.6 }), A.say('Pitter patter...', 2)), A.par(A.pose('flowers', { scale: 1.3, dur: 0.8 }), A.pose('cloud', { move: [0, 0, 0], dur: 0.6 })), A.wait(1), A.pose('flowers', { scale: 1, dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A rainbow (3.8 m) arching from cloud to cloud, with a pot of gold at its foot; its bands light up one by one.
  e('rainbow', 'sky', 'light effects', () => {
    const b = m('rainbow');
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].forEach((c, i) => {
      const d = 6.0 - i * 0.42;
      b.arc([d, d, 0.12], [0, 0.4, 0], { color: c, tube: 0.07 + i * 0.005, name: `band${i}`, mover: { kind: 'light', on: true }, noInk: true });
    });
    b.pair((s) => cloud(b, s * 2.6, 0.45, 0.2, 1.8, 'white'));
    return b
      .cyl([0.5, 0.35, 0.5], [2.6, 0.18, 1.1], { color: '#2a2726', taper: 1.2 })
      .dome([0.48, 0.15, 0.48], [2.6, 0.37, 1.1], { color: 'gold' })
      .act({
        click: [
          [A.operate('band', 'off'), A.wait(0.4), ...[0, 1, 2, 3, 4, 5].flatMap((i) => [A.operate(`band${i}`, 'on'), A.wait(0.15)]), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ooooh!', 1.5))],
          [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ka-ching!', 1.5))],
        ],
      })
      .done();
  }),
  // A rainforest at real size (trees to 28 m): giant emergent trees on buttress roots, hanging lianas, huge leaves
  // in the understorey and a toucan; it pours with rain and the toucan calls.
  e('rainforest', 'nature', 'landscapes', () => {
    const b = m('rainforest').cyl([30, 0.15, 22], [0, 0.075, 0], { color: '#3f6a2a' });
    const trees: Array<[number, number, number, string]> = [[-9, -5, 28, '#2f6b2a'], [1, -7, 24, '#3f7a3a'], [9, -3, 26, '#2a5f30'], [-4, 3, 18, '#4f8f3a'], [6, 5, 16, '#3f7a3a'], [-12, 5, 14, '#2f6b2a']];
    trees.forEach(([x, z, h, c], i) => {
      b.cyl([h * 0.05, h * 0.82, h * 0.05], [x, h * 0.41, z], { color: '#8a7a5a' });
      for (const a of [0, 120, 240]) b.wedge([h * 0.08, h * 0.12, 0.25], [x + Math.cos(a * D2R) * h * 0.04, h * 0.06, z + Math.sin(a * D2R) * h * 0.04], { color: '#8a7a5a', rot: [0, -a + 90, 0], apex: -0.5 });
      b.ball([h * 0.5, h * 0.18, h * 0.45], [x, h * 0.86, z], { color: c, name: `top${i}`, pivot: [x, h * 0.75, z] }).ball([h * 0.32, h * 0.16, h * 0.3], [x + h * 0.1, h * 0.95, z - h * 0.05], { color: c, parent: `top${i}` });
      b.rod([x + h * 0.12, h * 0.82, z + 0.4], [x + h * 0.14, h * 0.35, z + 0.6], 0.12, '#5a8a3a').rod([x - h * 0.1, h * 0.8, z + 0.3], [x - h * 0.12, h * 0.45, z + 0.5], 0.1, '#5a8a3a');
    });
    for (const [x, z] of [[-6, 7], [-1, 8], [4, 8.5], [10, 7], [-10, 9]]) for (const r of [-45, 0, 45]) b.ball([0.6, 2.4, 0.1], [x + Math.sin(r * D2R) * 0.7, 1.1, z], { color: '#4f9a3a', rot: [20, 0, -r] });
    b.ball([0.3, 0.35, 0.5], [-4.6, 15.2, 3.4], { color: '#2a2726', name: 'toucan' }).cone([0.2, 0.4, 0.18], [-4.6, 15.35, 3.85], { color: 'orange', rot: [100, 0, 0], parent: 'toucan' }).ball([0.2, 0.16, 0.1], [-4.6, 15.25, 3.6], { color: 'yellow', parent: 'toucan' });
    return b
      .act({
        click: [
          [A.par(A.effect('rain', { dur: 3 }), ...[0, 1, 2].map((i) => A.pose(`top${i}`, { rot: [0, 0, i % 2 ? 3 : -3], dur: 0.8 }))), A.par(...[0, 1, 2].map((i) => A.pose(`top${i}`, { rot: [0, 0, 0], dur: 0.8 })))],
          [A.par(A.pose('toucan', { rot: [-20, 0, 0], dur: 0.3 }), A.say('Rrrk! Rrrk!', 1.5)), A.pose('toucan', { rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // Rapids (5 m of river): white water tumbling over rocks between steep banks, and an orange raft that bucks and
  // shoots through.
  e('rapids', 'nature', 'water', () => {
    const b = m('rapids').box([4, 0.1, 6], [0, 0.25, 0], { color: 'water', rot: [10, 0, 0], round: 0.1 });
    b.pair((s) => b.box([1.6, 1.2, 6.4], [s * 2.7, 0.6, 0], { color: '#8a6440', round: 0.3 }).box([1.6, 0.15, 6.4], [s * 2.7, 1.25, 0], { color: 'grass', round: 0.5 }));
    for (const [x, z, s] of [[-1, -1.5, 0.7], [0.8, -0.2, 0.6], [-0.4, 1.4, 0.5], [1.3, 2.0, 0.45], [-1.5, 0.5, 0.4]]) b.ball([s * 1.2, s * 0.8, s], [x, 0.35 - z * 0.17, z], { color: 'rock' });
    for (const [x, z] of [[-0.6, -1.7], [0.4, -1.0], [1.0, 0.2], [-0.8, 0.8], [0.0, 1.6], [1.4, 1.6], [-1.6, -0.4], [0.3, 2.4]]) b.ball([0.7, 0.18, 0.4], [x, 0.36 - z * 0.17, z], { color: 'white', noInk: true });
    b.capsule([0.9, 2.2, 0.35], [0.2, 0.62, -2.0], { color: 'orange', rot: [80, 0, 0], name: 'raft', edge: 'soft' }).capsule([0.6, 1.7, 0.2], [0.2, 0.7, -2.0], { color: '#3a3633', rot: [80, 0, 0], parent: 'raft' });
    b.rod([-0.3, 0.75, -2.3], [0.7, 0.8, -1.8], 0.04, 'yellow', { parent: 'raft' });
    return b
      .act({ click: [[A.par(A.pose('raft', { move: [0, -0.5, 3.5], rot: [10, 0, 15], dur: 1.2 }), A.effect('water_spray', { dur: 1.5 }), A.say('Splash! Whoosh!', 1.5)), A.pose('raft', { move: [0, -0.8, 4.5], rot: [-5, 0, -10], dur: 0.6 }), A.pose('raft', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.01 })]] })
      .done();
  }),
  // The rest (the X-headed bridge for the cue) in use on a corner of a pool table: the cue lies on it, lined up on
  // the white ball; it strikes. (A cut-off corner of the table so it keeps near its 0.2 m size.)
  e('rest (sports)', 'sports', 'cue sports', () => {
    const b = m('rest (sports)', { edge: 'sharp' });
    b.box([1.2, 0.08, 0.8], [0.2, 0.28, 0], { color: '#2f7a3a', round: 0.1 }).box([1.3, 0.12, 0.12], [0.2, 0.36, -0.44], { color: '#5a3a22', round: 0.3 }).box([0.12, 0.12, 0.92], [0.86, 0.36, 0], { color: '#5a3a22', round: 0.3 });
    b.box([1.28, 0.24, 0.88], [0.22, 0.12, -0.02], { color: '#5a3a22' }).cyl([0.12, 0.06, 0.12], [0.86, 0.33, -0.44], { color: '#2a2726' });
    b.stick([-0.9, 0.18, 0.15], [0.05, 0.36, 0.0], 0.022, 'wood').box([0.12, 0.012, 0.012], [0.05, 0.37, 0.0], { color: 'brass', rot: [0, 0, 45] }).box([0.12, 0.012, 0.012], [0.05, 0.37, 0.0], { color: 'brass', rot: [0, 0, -45] });
    b.rod([-0.85, 0.38, 0.06], [0.1, 0.395, 0.0], 0.022, 'lightwood', { name: 'cue', edge: 'soft' }).cyl([0.024, 0.02, 0.024], [0.11, 0.395, 0.0], { color: 'skyblue', rot: [0, 0, 90], parent: 'cue' });
    return b
      .ball(0.057, [0.3, 0.35, 0.0], { color: 'white', name: 'ball', edge: 'soft' })
      .ball(0.057, [0.6, 0.35, -0.2], { color: 'red', edge: 'soft' })
      .act({ click: [[A.pose('cue', { move: [-0.12, 0, 0], dur: 0.4 }), A.pose('cue', { move: [0.12, 0, 0], dur: 0.1 }), A.par(A.pose('ball', { move: [0.4, 0, -0.1], dur: 0.5 }), A.say('Clack!', 1)), A.wait(0.6), A.par(A.pose('cue', { move: [0, 0, 0], dur: 0.3 }), A.pose('ball', { move: [0, 0, 0], dur: 0.01 }))]] })
      .done();
  }),
  // A riddle: a big purple question mark (1 m) on a plinth; it asks one, then gives the answer.
  e('riddle', 'ideas', 'abstract', () => {
    const b = m('riddle').box([0.5, 0.12, 0.36], [0, 0.06, 0], { color: 'darkgray', edge: 'sharp', round: 0.2 });
    path(b, [...ell(0, 0.78, 0.2, 0.2, 160, -60, 9), [0.04, 0.5, 0], [0.0, 0.4, 0]], 0.12, 'purple');
    return b
      .ball(0.15, [0, 0.22, 0], { color: 'purple' })
      .act({ click: [[A.par(A.anim('wobble'), A.say("What has keys but can't open locks?", 2.5))], [A.par(A.anim('hop'), A.effect('sparkle', { dur: 1 }), A.say('A piano!', 1.5))]] })
      .done();
  }),
  // A ring of fire stunt: a 2.4 m steel hoop wreathed in flames on its stand, a ramp, and a stunt rider on a
  // motorbike who jumps right through it.
  e('ring of fire', 'sports', 'stunts', () => {
    const b = m('ring of fire').box([8, 0.06, 3], [0, 0.03, 0], { color: '#8f949a', edge: 'sharp' });
    b.pair((s) => b.box([0.15, 2.3, 0.15], [1.4, 1.15, s * 1.3], { color: 'iron', edge: 'sharp' }).box([0.6, 0.08, 0.15], [1.4, 0.04, s * 1.3], { color: 'iron', edge: 'sharp' }));
    b.torus([2.4, 2.4, 0.12], [1.4, 2.3, 0], { color: 'iron', tube: 0.08, rot: [0, 90, 0] });
    for (let k = 0; k < 12; k++) {
      const a = k * 30 + 15;
      b.cone([0.3, 0.5, 0.2], [1.4, 2.3 + Math.sin(a * D2R) * 1.25, Math.cos(a * D2R) * 1.25], { color: k % 2 ? 'orange' : 'yellow', glow: true, rot: [90 - a, 0, 0], name: k ? undefined : 'flames' });
    }
    b.wedge([3.2, 1.0, 1.6], [-2.4, 0.5, 0], { color: 'wood', apex: 0.5, rot: [0, 0, 0], edge: 'sharp' });
    const bx = -3.4, by = 0.3;
    b.cyl([0.62, 0.15, 0.62], [bx - 0.7, by, 0], { color: 'rubber', rot: [90, 0, 0], name: 'bike', edge: 'soft' })
      .cyl([0.62, 0.15, 0.62], [bx + 0.7, by, 0], { color: 'rubber', rot: [90, 0, 0], parent: 'bike', edge: 'soft' })
      .box([1.2, 0.35, 0.3], [bx, by + 0.35, 0], { color: 'red', parent: 'bike', round: 0.4 })
      .rod([bx + 0.5, by + 0.5, 0], [bx + 0.7, by, 0], 0.06, 'silver', { parent: 'bike' })
      .rod([bx + 0.45, by + 0.75, -0.3], [bx + 0.45, by + 0.75, 0.3], 0.04, 'silver', { parent: 'bike' })
      .box([0.35, 0.5, 0.35], [bx - 0.05, by + 0.85, 0], { color: 'white', parent: 'bike', round: 0.5 })
      .ball(0.32, [bx + 0.05, by + 1.25, 0], { color: 'yellow', parent: 'bike' })
      .rod([bx + 0.05, by + 1.0, 0.1], [bx + 0.42, by + 0.78, 0.25], 0.09, 'white', { parent: 'bike' });
    return b
      .act({
        click: [
          [A.par(A.effect('fire', { dur: 2 }), A.say('Vroom vroom!', 1.2)), A.pose('bike', { move: [2.6, 1.0, 0], rot: [0, 0, 15], dur: 0.7 }), A.pose('bike', { move: [4.8, 1.5, 0], rot: [0, 0, 0], dur: 0.5 }), A.pose('bike', { move: [6.4, 0, 0], rot: [0, 0, -10], dur: 0.5 }), A.par(A.say('Ta-da!', 1.5), A.effect('sparkle', { dur: 1 })), A.wait(0.8), A.pose('bike', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.01 })],
        ],
      })
      .done();
  }),
  // Riot police: an officer in a helmet with a visor, padded navy kit, a clear shield and a baton.
  e('riot', 'town', 'police', () =>
    withAct(who('riot', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('helmet', 'black'), face('goggles', 'darkgray'), held('shield', 'glass', 'L'), held('baton')] }), {
      click: [[A.par(A.anim('point'), A.say('Move back! Move back!', 2))], [A.par(A.anim('hands_on_hips'), A.say('Stay calm, everyone.', 2))]],
    }),
  ),
  // A river at its real size (a 6 m stretch, banks knee high): water winding between grassy banks with stones and
  // reeds, an arched wooden footbridge; a paper boat floats by.
  e('river', 'nature', 'water', () => {
    const b = m('river').box([7, 0.08, 6], [0, 0.04, 0], { color: 'grass', round: 0.05 });
    const pts: Array<[number, number]> = [[-0.6, -3], [0.6, -1.4], [-0.4, 0.4], [0.5, 1.8], [-0.2, 3]];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      b.box([1.8, 0.06, Math.hypot(x1 - x0, z1 - z0) + 0.9], [(x0 + x1) / 2, 0.07, (z0 + z1) / 2], { color: 'water', rot: [0, Math.atan2(x1 - x0, z1 - z0) / D2R, 0], round: 0.5, noInk: true });
    }
    for (const [x, z, s] of [[1.2, -2, 0.4], [-1.4, 1.2, 0.35], [0.9, 0.9, 0.3], [-1.0, -2.4, 0.3]]) b.ball([s, s * 0.6, s], [x, 0.1, z], { color: 'stone' });
    for (const [x, z] of [[-1.5, -0.5], [1.4, 2.4], [1.5, -0.2]]) for (const d of [-0.1, 0, 0.1]) b.stick([x + d, 0.08, z], [x + d * 2, 0.95, z], 0.02, 'darkgreen').capsule([0.05, 0.16, 0.05], [x + d * 2, 0.9, z], { color: 'darkbrown' });
    path(b, ell(0.0, -0.4, 1.6, 0.7, 180, 0, 6, 0.2).map(([x, y]) => [x, y, -0.5] as Vec3), 0.12, 'wood');
    b.pair((s) => b.stick([s * 1.6, 0, -0.5], [s * 1.6, 0.9, -0.5], 0.08, 'darkwood'));
    path(b, ell(0.0, -0.4, 1.6, 1.25, 180, 0, 6, 0.2).map(([x, y]) => [x, y, -0.5] as Vec3), 0.05, 'darkwood');
    return b
      .wedge([0.25, 0.12, 0.3], [-0.5, 0.16, -2.6], { color: 'white', name: 'boat', edge: 'sharp', rot: [0, 30, 0] })
      .act({ click: [[A.par(A.pose('boat', { move: [0.9, 0, 4.6], rot: [0, 40, 0], dur: 3.5 }), A.say('Babble babble...', 2)), A.pose('boat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.01 })]] })
      .done();
  }),
  // Real size wins over the vocabulary's 0.1 m: the River Styx, black water, and Charon the ferryman in his hooded
  // robe standing in his boat with a lantern, holding out his hand for a coin.
  e('river styx', 'fantasy', 'afterlife', () =>
    withAct(
      lift(who('river styx', { h: 1.9, skin: '#d9d4c8', top: '#2a2726', bottom: '#2a2726', skirt: '#2a2726', long: true, shoes: 'black', style: 'bald', acc: [gown('#2a2726'), hat('hood', '#2a2726'), wear('cloak', '#2a2726'), held('staff', '#5a4a3a', 'L')] }), 0.45, (b) => {
        b.cyl([6, 0.1, 4], [0, 0.05, 0], { color: '#1f2a3a' });
        b.loft([1.3, 0.7, 4.0], [0, 0.35, 0], [[0, 0.3, 1.2, 0.3], [0.15, 0.85, 1, 0], [0.85, 0.85, 1, 0], [1, 0.3, 1.2, 0.3]], { color: '#3a2a20', cut: 'bottom', boxy: 0.4 });
        b.box([1.1, 0.06, 3.4], [0, 0.42, 0], { color: '#2a1d16', edge: 'sharp' }).stick([0, 0.6, 1.9], [0, 1.6, 2.2], 0.05, '#2a1d16').ball(0.16, [0, 1.5, 2.3], { color: 'lime', glow: true });
        return b.ball([0.25, 0.08, 0.2], [1.2, 0.12, 1.0], { color: '#3a4a5a', noInk: true }).ball([0.3, 0.08, 0.2], [-1.6, 0.12, -0.8], { color: '#3a4a5a', noInk: true });
      }),
      { click: [[A.par(A.anim('point'), A.say('A coin for the ferryman...', 2.5))], [A.par(A.anim('shake_head'), A.say('No coin, no crossing.', 2))]] },
    ),
  ),
  // Roadkill: a squashed cartoon raccoon (flat as a pancake, X-ed out eyes) on a stretch of road with tyre marks
  // and a traffic cone; flies buzz round it.
  e('roadkill', 'wild', 'roadside', () => {
    const b = m('roadkill').box([1.2, 0.04, 0.8], [0, 0.02, 0], { color: '#4a4a4a', edge: 'sharp', round: 0.1 }).box([0.25, 0.004, 0.06], [-0.4, 0.042, 0], { color: 'yellow', noInk: true, round: 0 }).box([0.25, 0.004, 0.06], [0.4, 0.042, 0], { color: 'yellow', noInk: true, round: 0 });
    b.box([1.0, 0.003, 0.08], [0, 0.041, 0.2], { color: '#2a2726', noInk: true, round: 0 }).box([1.0, 0.003, 0.08], [0, 0.041, -0.25], { color: '#2a2726', noInk: true, round: 0 });
    b.ball([0.34, 0.025, 0.2], [0, 0.05, 0.05], { color: '#8a8580' }).ball([0.15, 0.025, 0.13], [0.2, 0.05, 0.05], { color: '#8a8580' }).ball([0.07, 0.02, 0.05], [0.24, 0.06, 0.05], { color: 'white', noInk: true });
    for (const [x, z] of [[0.08, 0.17], [0.08, -0.07], [-0.08, 0.17], [-0.08, -0.07]]) b.ball([0.06, 0.02, 0.05], [x, 0.05, z], { color: '#8a8580' });
    b.capsule([0.06, 0.2, 0.025], [-0.24, 0.05, 0.05], { color: '#5a5550', rot: [0, 0, 90] });
    b.pair((s) => b.box([0.035, 0.004, 0.008], [0.2, 0.066, 0.05 + s * 0.022], { color: 'black', rot: [0, 45, 0], noInk: true }).box([0.035, 0.004, 0.008], [0.2, 0.066, 0.05 + s * 0.022], { color: 'black', rot: [0, -45, 0], noInk: true }));
    b.cone([0.28, 0.45, 0.28], [-0.4, 0.265, -0.25], { color: 'orange', edge: 'sharp' }).box([0.32, 0.04, 0.32], [-0.4, 0.06, -0.25], { color: 'orange', edge: 'sharp' }).torus([0.17, 0.17, 0.02], [-0.4, 0.3, -0.25], { color: 'white', rot: [90, 0, 0], tube: 0.2 });
    b.ball(0.01, [0.05, 0.3, 0.05], { color: '#2a2726', name: 'flies', mover: { kind: 'spin', axis: 'y', amount: 300, on: true } });
    for (const [x, y, z] of [[0.15, 0.3, 0.05], [-0.05, 0.26, 0.15], [0.0, 0.34, -0.08]]) b.ball(0.02, [x, y, z], { color: '#2a2726', parent: 'flies' });
    return b.act({ click: [[A.par(A.pose('flies', { spin: [0, 900, 0] }), A.say('Bzzzz...', 1.5)), A.wait(1.5), A.pose('flies', { spin: [0, 300, 0] })]] }).done();
  }),
  // The archer on the zodiac plinth: a centaur, horse below and archer above, drawing a bow; the arrow flies.
  e('sagittarius (stars)', 'sky', 'zodiac', () =>
    withAct(
      lift(beast('sagittarius (stars)', { color: '#8a5a35', body: [0.62, 0.3, 0.26], legL: 0.3, legW: 0.07, hoof: '#3a2a20', neckL: 0.05, neckLean: 0, neckW: 0.05, head: [0.05, 0.05, 0.05], ears: 'side', earSize: 0.01, tail: 'long', tailColor: '#2a1d16' }), 0.12, (b) => {
        zb(b, 'SAGITTARIUS');
        b.box([0.2, 0.34, 0.13], [0, 0.84, 0.24], { color: 'skin3', round: 0.6 }).ball(0.15, [0, 1.08, 0.25], { color: 'skin3' }).ball([0.16, 0.09, 0.16], [0, 1.13, 0.235], { color: '#2a1d16' });
        b.pair((s) => b.ball([0.022, 0.026, 0.01], [s * 0.03, 1.09, 0.32], { color: '#2a1d16', eye: true, noInk: true }));
        b.rod([0.1, 0.96, 0.25], [0.17, 0.95, 0.5], 0.05, 'skin3').rod([-0.1, 0.96, 0.25], [0.04, 0.95, 0.33], 0.05, 'skin3');
        b.arc([0.56, 0.56, 0.03], [0.17, 0.95, 0.24], { color: '#5a3a22', arc: 130, tube: 0.08, rot: [0, -90, -90] });
        b.stick([0.17, 0.7, 0.36], [0.17, 1.2, 0.36], 0.006, 'white', { noInk: true });
        return b.rod([0.17, 0.95, 0.3], [0.17, 0.95, 0.8], 0.015, 'gold', { name: 'arrow' }).cone([0.04, 0.07, 0.02], [0.17, 0.95, 0.83], { color: 'silver', rot: [90, 0, 0], parent: 'arrow' });
      }),
      { click: [[A.say('Twang!', 1), A.pose('arrow', { move: [0, 0, 1.6], dur: 0.3 }), A.wait(0.6), A.pose('arrow', { move: [0, 0, 0], dur: 0.01 })]] },
    ),
  ),
  // A sand storm (12 m): a towering wall of brown dust rolling across the dunes towards a pair of bent palms and a
  // tent; it sweeps forward.
  e('sand storm', 'nature', 'weather', () => {
    const b = m('sand storm').cyl([20, 0.12, 14], [0, 0.06, 0], { color: 'sand' });
    for (const [x, z, w, h] of [[-5, 3, 6, 1.2], [5, 2, 7, 1.6], [0, -1, 5, 0.9]]) b.dome([w, h, w * 0.5], [x, h / 2, z], { color: '#e0c48a' });
    for (const x of [-6, -4.6]) {
      b.rod([x, 0, 4.6], [x + 0.6, 3, 4.6], 0.25, 'bark').rod([x + 0.6, 3, 4.6], [x + 1.6, 5, 4.6], 0.22, 'bark');
      for (const r of [-30, 0, 30]) b.ball([2.2, 0.15, 0.5], [x + 2.4, 5, 4.6 + r / 60], { color: 'green', rot: [0, r, -15] });
    }
    b.pyramid([2.6, 1.8, 2.2], [4, 0.9, 5], 4, { color: '#c9a66b', edge: 'sharp' });
    b.ball([14, 9, 4], [0, 5.5, -4.5], { color: '#c9a26a', name: 'wall' });
    for (const [x, y, s] of [[-5, 8, 5], [3, 9, 6], [6, 5, 5], [-6, 4, 4], [0, 10, 5]]) b.ball([s, s * 0.8, s * 0.6], [x, y, -3.2], { color: '#d9b98a', parent: 'wall' });
    for (const [x, y] of [[-3, 2.5], [1, 3.5], [4, 1.8]]) b.capsule([0.08, 3, 0.08], [x, y, 0], { color: '#e8d29a', rot: [0, 0, 80], noInk: true, parent: 'wall' });
    return b
      .act({ click: [[A.par(A.pose('wall', { move: [0, 0, 3], dur: 2 }), A.effect('dust', { dur: 3 }), A.say('Whoooosh!', 2)), A.pose('wall', { move: [0, 0, 0], dur: 2 })]] })
      .done();
  }),
  // The savanna (3.9 m): a flat-topped acacia over long golden grass, a termite mound, and two zebras grazing.
  e('savanna', 'nature', 'landscapes', () => {
    const zebra = (tag: string) => beast(`savanna ${tag}`, { color: 'white', body: [1.2, 0.55, 0.42], legL: 0.6, legW: 0.1, hoof: '#2a2726', neckL: 0.4, neckLean: 25, neckW: 0.22, head: [0.42, 0.24, 0.2], snout: { len: 0.14, h: 0.14, w: 0.14, color: '#2a2726' }, ears: 'pointy', earSize: 0.14, tail: 'tuft', tailColor: '#2a2726', acc: [ani.stripes('#2a2726', 7), ani.mane('#2a2726')] });
    return withAct(
      troupe('savanna', [{ f: zebra('a'), at: [1.8, 1.2], yaw: 70, tag: 'a' }, { f: zebra('b'), at: [-0.4, 2.4], yaw: -100, tag: 'b' }], (b) => {
        b.cyl([10, 0.08, 7], [0, 0.04, 0], { color: '#d9b450' });
        b.rod([-1.5, 0.05, -1.5], [-1.4, 2.4, -1.5], 0.25, 'bark').rod([-1.4, 2.2, -1.5], [-2.5, 3.3, -1.5], 0.14, 'bark').rod([-1.4, 2.2, -1.5], [-0.2, 3.3, -1.3], 0.14, 'bark');
        b.ball([4.4, 0.55, 2.8], [-1.4, 3.5, -1.5], { color: '#5a7a2a', name: 'crown' });
        for (let i = 0; i < 18; i++) {
          const a = i * 2.3, r = 1 + (i % 6) * 0.7;
          b.cone([0.3, 0.5 + (i % 3) * 0.2, 0.3], [Math.cos(a) * r, 0.3, Math.sin(a) * r * 0.6], { color: i % 2 ? '#c9a63a' : '#d9b85a' });
        }
        return b.cyl([0.9, 1.8, 0.9], [3.2, 0.9, -1.6], { color: '#b07a4a', taper: 0.3 }).cyl([0.4, 0.8, 0.4], [3.45, 1.4, -1.5], { color: '#b07a4a', taper: 0.2 });
      }),
      { click: [[A.par(A.pose('aneck', { rot: [45, 0, 0], dur: 0.6 }), A.pose('bneck', { rot: [45, 0, 0], dur: 0.6 }), A.say('Munch munch.', 1.5)), A.wait(1), A.par(A.pose('aneck', { rot: [0, 0, 0], dur: 0.6 }), A.pose('bneck', { rot: [0, 0, 0], dur: 0.6 }), A.say('Kwa-ha-ha!', 1.2))]] },
    );
  }),
  // The scorpion on the zodiac plinth: pincers forward, its segmented tail curled over its back; the sting strikes.
  e('scorpio (stars)', 'sky', 'zodiac', () => {
    const c = '#7a4a2a';
    const b = zb(m('scorpio (stars)'), 'SCORPIO').ball([0.22, 0.1, 0.3], [0, 0.2, 0.05], { color: c }).ball([0.14, 0.08, 0.12], [0, 0.21, 0.22], { color: c });
    b.pair((s) => {
      b.rod([s * 0.06, 0.21, 0.25], [s * 0.16, 0.23, 0.35], 0.035, c).ball([0.09, 0.06, 0.12], [s * 0.18, 0.24, 0.42], { color: c }).cone([0.04, 0.08, 0.03], [s * 0.16, 0.25, 0.5], { color: c, rot: [90, 0, 0] });
      for (const z of [0.12, 0.04, -0.04]) b.rod([s * 0.09, 0.2, z], [s * 0.25, 0.13, z * 1.3], 0.025, c);
      b.ball(0.03, [s * 0.035, 0.25, 0.27], { color: 'black', eye: true, noInk: true });
    });
    b.ball(0.08, [0, 0.24, -0.12], { color: c, name: 'tail', pivot: [0, 0.22, -0.08] });
    const pts = ell(0, 0.45, 0.25, 0.25, 250, 40, 6).map(([zz, y]) => [0, y, -0.12 + zz * -1] as Vec3);
    path(b, pts.map(([x, y, z]) => [x, y, z] as Vec3), 0.07, c, { parent: 'tail' });
    return b
      .cone([0.05, 0.1, 0.05], [0, pts[pts.length - 1][1] - 0.03, pts[pts.length - 1][2] + 0.04], { color: 'darkred', rot: [150, 0, 0], parent: 'tail' })
      .act({ click: [[A.pose('tail', { rot: [35, 0, 0], dur: 0.15 }), A.par(A.say('Tsss!', 1), A.anim('shake')), A.pose('tail', { rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A scratch: a cat's scratching post (40 cm) wrapped in sisal, frayed with claw marks, a toy mouse dangling from
  // its top; the mouse swings.
  e('scratch', 'ideas', 'marks', () => {
    const b = m('scratch').box([0.36, 0.04, 0.36], [0, 0.02, 0], { color: '#c9b28a', edge: 'sharp', round: 0.2 }).cyl([0.12, 0.32, 0.12], [0, 0.2, 0], { color: '#d9c08a' });
    for (let i = 0; i < 8; i++) b.torus([0.125, 0.125, 0.012], [0, 0.06 + i * 0.038, 0], { color: '#c4a870', rot: [90, 0, 0], tube: 0.08, noInk: true });
    for (const [a, y] of [[20, 0.22], [35, 0.2], [50, 0.23], [-30, 0.15]]) b.box([0.006, 0.09, 0.006], [Math.sin(a * D2R) * 0.062, y, Math.cos(a * D2R) * 0.062], { color: '#f2e6cf', rot: [0, a, 8], noInk: true });
    b.box([0.2, 0.025, 0.2], [0, 0.375, 0], { color: '#c9b28a', edge: 'sharp', round: 0.3 });
    return b
      .stick([0.08, 0.36, 0.08], [0.1, 0.22, 0.12], 0.004, 'gray', { name: 'toy', pivot: [0.08, 0.36, 0.08], noInk: true })
      .ball([0.04, 0.03, 0.06], [0.1, 0.2, 0.12], { color: 'gray', parent: 'toy' })
      .act({ click: [[A.pose('toy', { rot: [35, 0, 0], dur: 0.25 }), A.pose('toy', { rot: [-30, 0, 0], dur: 0.35 }), A.par(A.pose('toy', { rot: [0, 0, 0], dur: 0.3 }), A.say('Scritch scratch!', 1.2))]] })
      .done();
  }),
  // A screenplay: a bound script with brass brads and a SCRIPT cover, and a film slate (clapperboard) propped beside
  // it; the clapper snaps shut.
  e('screenplay', 'study', 'writing', () =>
    m('screenplay', { edge: 'sharp' })
      .box([0.22, 0.02, 0.28], [-0.1, 0.01, 0.02], { color: '#f2e6cf', round: 0.1, rot: [0, 10, 0] })
      .box([0.22, 0.004, 0.28], [-0.1, 0.022, 0.02], { color: '#e0473b', round: 0.1, rot: [0, 10, 0] })
      .label('SCRIPT', [0.14, 0.04], [-0.1, 0.026, 0.0], { color: '#e0473b', rot: [-90, 10, 0], depth: 0.003 })
      .cyl([0.012, 0.006, 0.012], [-0.19, 0.026, -0.06], { color: 'brass' })
      .cyl([0.012, 0.006, 0.012], [-0.21, 0.026, 0.1], { color: 'brass' })
      .box([0.28, 0.22, 0.015], [0.15, 0.12, -0.04], { color: '#2a2726', rot: [-12, 0, 0] })
      .box([0.24, 0.006, 0.004], [0.15, 0.1, -0.03], { color: 'white', rot: [-12, 0, 0], noInk: true })
      .box([0.24, 0.006, 0.004], [0.15, 0.06, -0.022], { color: 'white', rot: [-12, 0, 0], noInk: true })
      .box([0.28, 0.04, 0.016], [0.15, 0.25, -0.07], { color: 'white', rot: [-12, 0, 0] })
      .box([0.28, 0.04, 0.016], [0.15, 0.29, -0.07], { color: 'white', rot: [-12, 0, 20], name: 'clapper', pivot: [0.01, 0.27, -0.07] })
      .act({ click: [[A.say('Scene one, take one...', 1.5), A.wait(0.8), A.pose('clapper', { rot: [0, 0, -20], dur: 0.1 }), A.say('Clack! Action!', 1.5), A.wait(0.8), A.pose('clapper', { rot: [0, 0, 0], dur: 0.3 })]] })
      .done(),
  ),
  // A seafood platter (40 cm) on crushed ice: a red lobster, prawns, oysters on the half shell and lemon wedges, on
  // a two-tier stand; it steams.
  e('seafood', 'food', 'seafood', () => {
    const b = m('seafood').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'silver', edge: 'sharp' }).cyl([0.03, 0.26, 0.03], [0, 0.14, 0], { color: 'silver' });
    b.cyl([0.46, 0.03, 0.46], [0, 0.1, 0], { color: 'silver', edge: 'sharp' }).cyl([0.42, 0.03, 0.42], [0, 0.125, 0], { color: 'ice' }).cyl([0.3, 0.02, 0.3], [0, 0.26, 0], { color: 'silver', edge: 'sharp' }).cyl([0.27, 0.02, 0.27], [0, 0.275, 0], { color: 'ice' });
    b.capsule([0.07, 0.2, 0.06], [0, 0.17, 0.02], { color: '#e0473b', rot: [90, 30, 0] }).cone([0.08, 0.08, 0.03], [0.05, 0.17, -0.07], { color: '#e0473b', rot: [-90, 30, 0] });
    b.pair((s) => b.rod([-0.03 * s, 0.17, 0.1], [s * 0.1, 0.17, 0.15], 0.02, '#e0473b').ball([0.05, 0.03, 0.035], [s * 0.12, 0.17, 0.16], { color: '#e0473b' }));
    for (const a of [0, 60, 120, 180, 240, 300]) {
      const x = Math.cos(a * D2R) * 0.17, z = Math.sin(a * D2R) * 0.17;
      if (a % 120) b.ball([0.07, 0.02, 0.06], [x, 0.145, z], { color: '#9a9488' }).ball([0.04, 0.012, 0.035], [x, 0.156, z], { color: '#d8d0b8' });
      else b.cyl([0.05, 0.03, 0.025], [x, 0.15, z], { color: 'yellow', segs: 3, rot: [90, 0, a] });
    }
    for (const a of [30, 150, 270]) arc(b, [Math.cos(a * D2R) * 0.07, 0.3, Math.sin(a * D2R) * 0.07], 0.03, -60, 200, 5, 0.022, '#f08a5a');
    return b.act({ click: [[A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle...', 1.5))]] }).done();
  }),
  // Serenity: a little zen garden (2 m): raked sand, a balanced stack of stones, a stone lantern, a bonsai and a
  // basin with a lotus that opens.
  e('serenity', 'ideas', 'emotions', () => {
    const b = m('serenity').box([2.2, 0.08, 1.4], [0, 0.04, 0], { color: 'sand', round: 0.2 }).box([2.3, 0.12, 0.08], [0, 0.06, 0.72], { color: 'darkwood', edge: 'sharp' }).box([2.3, 0.12, 0.08], [0, 0.06, -0.72], { color: 'darkwood', edge: 'sharp' });
    for (let i = 0; i < 6; i++) b.box([2.0, 0.008, 0.02], [0, 0.083, -0.55 + i * 0.12], { color: '#c9b07a', noInk: true, round: 0 });
    [[0.3, 0.1], [0.24, 0.09], [0.18, 0.08], [0.13, 0.07], [0.09, 0.06]].reduce((y, [w, h]) => (b.ball([w, h, w * 0.85], [-0.55, y + h / 2, 0.15], { color: 'stone' }), y + h * 0.85), 0.08);
    b.cyl([0.18, 0.3, 0.18], [0.75, 0.23, -0.4], { color: 'stone' }).box([0.3, 0.18, 0.3], [0.75, 0.47, -0.4], { color: '#b8b8b0', edge: 'sharp' }).box([0.12, 0.08, 0.02], [0.75, 0.47, -0.25], { color: '#fff3a0', glow: true }).pyramid([0.42, 0.18, 0.42], [0.75, 0.65, -0.4], 4, { color: 'stone', rot: [0, 45, 0] });
    b.cyl([0.2, 0.08, 0.16], [-0.1, 0.12, -0.45], { color: '#5a3a22', edge: 'sharp' }).rod([-0.1, 0.15, -0.45], [-0.05, 0.35, -0.45], 0.04, 'bark').ball([0.28, 0.14, 0.2], [-0.04, 0.4, -0.45], { color: 'darkgreen' });
    b.cyl([0.5, 0.15, 0.5], [0.55, 0.15, 0.35], { color: '#8f8c86', edge: 'sharp' }).cyl([0.42, 0.02, 0.42], [0.55, 0.22, 0.35], { color: 'water' });
    b.ball(0.04, [0.55, 0.25, 0.35], { color: 'yellow', name: 'lotus' });
    for (let i = 0; i < 6; i++) b.ball([0.04, 0.08, 0.025], [0.55 + Math.cos(i * 60 * D2R) * 0.04, 0.27, 0.35 + Math.sin(i * 60 * D2R) * 0.04], { color: 'pink', rot: [Math.sin(i * 60 * D2R) * 40, 0, -Math.cos(i * 60 * D2R) * 40], parent: 'lotus' });
    return b.act({ click: [[A.par(A.pose('lotus', { scale: 1.5, dur: 1 }), A.effect('sparkle', { dur: 1.5 }), A.say('Ommm...', 2)), A.wait(1), A.pose('lotus', { scale: 1, dur: 1 })]] }).done();
  }),
  // Sesame: a tall spice jar of sesame seeds (30 cm) with a screw lid, a bagel and a seeded bun beside it.
  // Open, sesame!
  e('sesame', 'food', 'spices', () => {
    const b = m('sesame')
      .cyl([0.14, 0.24, 0.14], [0, 0.12, 0], { color: 'glass' })
      .cyl([0.125, 0.19, 0.125], [0, 0.1, 0], { color: '#f2e2b8', edge: 'soft' })
      .label('SESAME', [0.1, 0.04], [0, 0.13, 0.072], { color: '#a0623a', depth: 0.003 })
      .cyl([0.15, 0.05, 0.15], [0, 0.265, 0], { color: '#a0623a', name: 'lid', edge: 'sharp' });
    for (let i = 0; i < 10; i++) b.ball([0.012, 0.004, 0.007], [Math.cos(i * 2.4) * 0.04, 0.2, Math.sin(i * 2.4) * 0.04], { color: '#f6ead0', noInk: true });
    b.torus([0.16, 0.16, 0.06], [0.2, 0.03, 0.06], { color: 'crust', rot: [90, 0, 0], tube: 0.4 }).dome([0.13, 0.07, 0.13], [-0.2, 0.035, 0.07], { color: 'crust' });
    for (let i = 0; i < 8; i++) {
      const a = i * 137.5 * D2R, r = 0.015 + (i % 4) * 0.012;
      b.ball([0.01, 0.004, 0.006], [-0.2 + Math.cos(a) * r, 0.065 + 0.003 - r * 0.3, 0.07 + Math.sin(a) * r], { color: 'cream', rot: [0, a / D2R, 0], noInk: true });
      b.ball([0.01, 0.004, 0.006], [0.2 + Math.cos(a) * 0.055, 0.06, 0.06 + Math.sin(a) * 0.055], { color: 'cream', rot: [0, a / D2R, 0], noInk: true });
    }
    return b.act({ click: [[A.par(A.pose('lid', { move: [0, 0.15, 0], rot: [0, 180, 0], dur: 0.6 }), A.say('Open, sesame!', 1.5), A.effect('sparkle', { dur: 1.2 })), A.wait(1.2), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  e('seven', 'ideas', 'numbers', () => counter('seven', '7', 7, 'teal', 'white', COUNT).done()),
  // Sewage: a big outfall pipe (0.9 m) in a concrete wall gushing murky water into a scummy channel, a manhole cover
  // nearby; a rat pops out of the pipe.
  e('sewage', 'nature', 'water', () => {
    const b = m('sewage')
      .box([4, 2.4, 0.6], [0, 1.2, -0.6], { color: '#9a9a92', edge: 'sharp', round: 0.05 })
      .box([4, 0.1, 3], [0, 0.05, 0.9], { color: '#7a7a72', edge: 'sharp' })
      .box([2.2, 0.06, 2.8], [0, 0.11, 0.9], { color: '#6b6a3a', round: 0.2 })
      .cyl([0.95, 0.5, 0.95], [0, 1.0, -0.15], { color: '#5c6166', rot: [90, 0, 0], edge: 'sharp' })
      .torus([1.0, 1.0, 0.1], [0, 1.0, 0.1], { color: 'iron', tube: 0.12 })
      .cyl([0.8, 0.02, 0.8], [0, 1.0, 0.05], { color: '#1a1614', rot: [90, 0, 0] })
      .rod([0, 0.75, 0.12], [0, 0.45, 0.6], 0.32, '#6b7a3a', { noInk: true })
      .rod([0, 0.45, 0.6], [0.05, 0.12, 0.9], 0.28, '#6b7a3a', { noInk: true })
      .cyl([0.7, 0.03, 0.7], [1.4, 0.115, 1.2], { color: 'iron', edge: 'sharp' })
      .ball([0.12, 0.03, 0.12], [-0.6, 0.14, 1.0], { color: '#8a8a4a', noInk: true })
      .ball([0.09, 0.03, 0.09], [0.5, 0.14, 1.5], { color: '#8a8a4a', noInk: true })
      .ball([0.12, 0.1, 0.2], [0.2, 0.86, -0.05], { color: '#6a5a50', name: 'rat', mover: { kind: 'slide', axis: 'z', amount: 0.3 } })
      .ball([0.07, 0.06, 0.08], [0.2, 0.9, 0.08], { color: '#6a5a50', parent: 'rat' })
      .ball(0.015, [0.2, 0.9, 0.12], { color: 'pink', parent: 'rat' });
    b.pair((s) => b.ball([0.03, 0.04, 0.01], [0.2 + s * 0.03, 0.95, 0.06], { color: '#8a7a70', parent: 'rat' }));
    return b
      .act({ click: [[A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Glug glug...', 1.5)), A.operate('rat', 'out'), A.say('Squeak!', 1), A.wait(1), A.operate('rat', 'in')]] })
      .done();
  }),
  // A shadow: a person standing under a street lamp, their long dark shadow cast on the pavement; the lamp goes out
  // and the shadow goes with it.
  e('shadow (light)', 'ideas', 'light and shadow', () =>
    withAct(
      lift(who('shadow (light)', { h: 1.7, top: 'red', bottom: 'navy', hair: 'black', skin: 'skin3', style: 'short' }), 0.04, (b) =>
        b
          .box([4, 0.04, 2.4], [0.6, 0.02, 0], { color: '#c9c4b8', edge: 'sharp' })
          .stick([-0.9, 0.04, -0.3], [-0.9, 3.0, -0.3], 0.1, '#2a2726')
          .box([0.32, 0.35, 0.32], [-0.9, 3.15, -0.3], { color: '#2a2726', edge: 'sharp' })
          .ball([0.24, 0.28, 0.24], [-0.9, 3.12, -0.3], { color: '#fff3a0', glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
          .box([0.4, 0.008, 2.0], [1.4, 0.045, 0.0], { color: '#3a3633', rot: [0, 72, 0], noInk: true, name: 'shadow', round: 0.5 })
          .ball([0.32, 0.008, 0.36], [2.38, 0.045, 0.32], { color: '#3a3633', noInk: true, parent: 'shadow' }),
      ),
      {
        click: [
          [A.par(A.operate('lamp', 'off'), A.pose('shadow', { scale: 0, dur: 0.3 })), A.par(A.anim('gasp'), A.say('Hey! Where did my shadow go?', 2))],
          [A.par(A.operate('lamp', 'on'), A.pose('shadow', { scale: 1, dur: 0.3 })), A.par(A.anim('wave'), A.say('Oh, there you are!', 2))],
        ],
      },
    ),
  ),
  // Sharp: a kitchen knife block with four knives; the chef's knife slides out with a glint: shing!
  e('sharp', 'ideas', 'qualities', () => {
    const b = m('sharp', { edge: 'sharp' }).box([0.36, 0.03, 0.26], [0, 0.015, 0], { color: 'lightwood', round: 0.2 }).box([0.16, 0.28, 0.2], [0, 0.17, -0.02], { color: 'darkwood', rot: [-20, 0, 0], round: 0.15 });
    for (const [x, h] of [[-0.05, 0.1], [0.0, 0.11], [0.05, 0.09]]) b.box([0.022, h, 0.03], [x, 0.33 + h / 2 - 0.02, -0.08], { color: '#2a2726', rot: [-20, 0, 0], round: 0.4 });
    b.box([0.028, 0.12, 0.032], [0.0, 0.36, 0.0], { color: '#2a2726', rot: [-20, 0, 0], round: 0.4, name: 'knife', mover: { kind: 'slide', axis: 'y', amount: 0.18 } });
    return b
      .box([0.004, 0.22, 0.045], [0.0, 0.23, 0.05], { color: 'silver', rot: [-20, 0, 0], parent: 'knife' })
      .box([0.12, 0.04, 0.06], [0.22, 0.02, 0.06], { color: '#5c6166', round: 0.3 })
      .act({ click: [[A.operate('knife', 'out'), A.par(A.effect('sparkle', { dur: 1 }), A.say('Shing!', 1.2)), A.wait(1), A.operate('knife', 'in')]] })
      .done();
  }),
  // A shooting star: a bright star (40 cm) streaking down the sky trailing a glowing tail; it zooms across.
  e('shooting star', 'sky', 'stars', () => {
    const b = m('shooting star');
    b.star(0.4, [0.45, 1.5, 0], { color: 'yellow', glow: true, name: 'star' });
    b.ball([0.2, 0.2, 0.12], [0.45, 1.5, 0], { color: '#fff6c0', glow: true, parent: 'star' });
    ([[0.24, 0.75, '#fff3a0', 0], [0.16, 0.7, 'skyblue', 0.08], [0.16, 0.7, 'pink', -0.08]] as const).forEach(([w, l, c, dy]) => b.cone([w, l * 1.6, 0.06], [0.45 - 0.5 * l * 1.4, 1.5 - 0.35 * l * 1.4 + dy, -0.02], { color: c, glow: true, rot: [0, 0, 55], parent: 'star', noInk: true }));
    for (const [x, y] of [[-0.5, 0.75], [-0.2, 0.95], [-0.7, 0.55]]) b.ball(0.05, [x, y, 0], { color: 'white', glow: true, parent: 'star' });
    return b.act({ click: [[A.par(A.pose('star', { move: [1.2, -0.6, 0], dur: 0.6 }), A.effect('sparkle', { dur: 1.2 }), A.say('Whoosh!', 1.5)), A.pose('star', { move: [0, 0, 0], dur: 0.01 })]] }).done();
  }),
  // A Siamese cat at real size (30 cm at the shoulder): cream with dark brown points on its face, ears, legs and tail.
  e('siamese', 'pets', 'cats', () =>
    withAct(beast('siamese', { color: '#f2e6cf', body: [0.45, 0.17, 0.15], legL: 0.16, legW: 0.045, legColor: '#4a3428', neckL: 0.06, neckLean: 30, head: [0.13, 0.11, 0.11], headColor: '#e8d8b8', snout: { len: 0.045, h: 0.05, w: 0.06, color: '#4a3428' }, ears: 'pointy', earSize: 0.065, earColor: '#4a3428', tail: 'long', tailColor: '#4a3428', tailAngle: 40 }), {
      click: [[A.par(A.anim('look_around'), A.say('Mrrrooow?', 1.5))], [A.par(A.anim('hop'), A.say('MEOW!', 1.2))]],
    }),
  ),
  // A Siberian cat (35 cm): a big, fluffy grey tabby with a ruff, a white bib and a plumed tail.
  e('siberian', 'pets', 'cats', () =>
    withAct(beast('siberian', { color: '#8f969e', body: [0.48, 0.22, 0.22], bodyShape: 'ball', legL: 0.14, legW: 0.065, neckL: 0.05, neckLean: 30, neckW: 0.14, head: [0.15, 0.14, 0.15], snout: { len: 0.04, h: 0.05, w: 0.07, color: 'white' }, ears: 'pointy', earSize: 0.065, tail: 'fluffy', tailAngle: 45, belly: 'white', acc: [ani.stripes('#5c6166', 4), ani.mane('#b4bac0')] }), {
      click: [[A.par(A.anim('shake'), A.say('Prrrrr...', 1.5))], [A.par(A.anim('hop'), A.say('Mew!', 1))]],
    }),
  ),
  // A display head with bushy mutton-chop sideburns that grow even bushier.
  e('sideburns', 'wardrobe', 'hairstyles', () =>
    mannequin('sideburns', { hair: 'darkbrown', top: 'orange' }, (b, hc) => {
      b.ball(0.01, [0, 0.25, 0], { color: hc, parent: 'head', name: 'burns' });
      b.pair((s) => b.box([0.028, 0.1, 0.055], [s * 0.071, 0.225, 0.03], { color: hc, round: 0.6, parent: 'burns' }).ball([0.04, 0.045, 0.05], [s * 0.06, 0.18, 0.055], { color: hc, parent: 'burns' }));
    })
      .act({ click: [[A.par(A.pose('burns', { scale: 1.35, dur: 0.4 }), A.say('Mutton chops!', 1.5)), A.wait(0.8), A.pose('burns', { scale: 1, dur: 0.4 })]] })
      .done(),
  ),
  // Singing: a singer in a sparkly top with a microphone, musical notes floating up.
  e('singing', 'music', 'performing', () =>
    withAct(
      lift(who('singing', { top: 'magenta', bottom: 'black', hair: 'black', style: 'long', skin: 'skin3', shoes: 'black', acc: [held('mic')] }), 0, (b) => {
        for (const [x, y] of [[0.42, 1.75], [0.62, 1.5]]) b.ball([0.09, 0.07, 0.05], [x, y, 0.1], { color: '#2a2726', rot: [0, 0, 25] }).box([0.016, 0.2, 0.02], [x + 0.038, y + 0.1, 0.1], { color: '#2a2726' }).rod([x + 0.04, y + 0.2, 0.1], [x + 0.09, y + 0.14, 0.1], 0.02, '#2a2726');
        return b;
      }),
      { click: [[A.par(A.anim('arms_up'), A.say('La la laaa!', 2))], [A.par(A.anim('bow'), A.say('Thank you, thank you!', 2))]] },
    ),
  ),
  e('six', 'ideas', 'numbers', () => counter('six', '6', 6, 'orange', 'white', COUNT).done()),
  // A smile: a smiley-face sign (30 cm) on a stand, rosy cheeks and a big grin; it grins wider and winks.
  e('smile', 'ideas', 'emotions', () => {
    const b = emoji('smile', 0.26, 0.26, 'yellow');
    b.ball([0.03, 0.045, 0.012], [0.05, 0.29, 0.038], { color: 'black', eye: true, noInk: true, name: 'eyeL' }).ball([0.03, 0.045, 0.012], [-0.05, 0.29, 0.038], { color: 'black', eye: true, noInk: true });
    b.pair((s) => b.ball([0.04, 0.022, 0.01], [s * 0.078, 0.245, 0.036], { color: 'pink', noInk: true }));
    b.ball(0.01, [0, 0.235, 0.04], { color: 'darkbrown', name: 'mouth' });
    arc(b, [0, 0.27, 0.039], 0.07, 205, 335, 5, 0.018, 'darkbrown', 'xy', { noInk: true, parent: 'mouth' });
    return b.act({ click: [[A.par(A.pose('mouth', { scale: 1.25, dur: 0.3 }), A.pose('eyeL', { scale: 0.2, dur: 0.15 }), A.say('Cheese!', 1.2)), A.wait(0.5), A.par(A.pose('mouth', { scale: 1, dur: 0.3 }), A.pose('eyeL', { scale: 1, dur: 0.15 }))]] }).done();
  }),
  // Smoke: a doused campfire still smouldering, a column of grey smoke puffs rising 2 m and drifting.
  e('smoke', 'nature', 'elements', () => {
    const b = m('smoke');
    around(8, 0.36).forEach(([x, z]) => b.ball([0.18, 0.12, 0.16], [x, 0.06, z], { color: 'stone' }));
    b.rod([-0.25, 0.06, 0.1], [0.25, 0.08, -0.05], 0.1, 'bark').rod([-0.15, 0.06, -0.2], [0.18, 0.08, 0.18], 0.1, '#3a2a20').ball(0.08, [0, 0.12, 0], { color: 'orange', glow: true });
    b.ball(0.2, [0, 0.35, 0], { color: 'gray', name: 'puffs' });
    for (const [x, y, s, c] of [[0.08, 0.6, 0.28, 'lightgray'], [-0.04, 0.9, 0.36, 'gray'], [0.12, 1.25, 0.44, 'lightgray'], [0.02, 1.65, 0.5, '#c4c9cc'], [0.2, 2.05, 0.45, '#d4d7da']] as const) b.ball(s, [x, y, 0], { color: c, parent: 'puffs' });
    return b.act({ click: [[A.par(A.pose('puffs', { move: [0.3, 0.4, 0], scale: 1.15, dur: 1.5 }), A.effect('smoke', { dur: 2 })), A.pose('puffs', { move: [0, 0, 0], scale: 1, dur: 1 })]] }).done();
  }),
  // A snow storm (9 m): heavy grey clouds over a snowed-in cottage with a lit window, a pine bowed with snow and a
  // lamp post up to its knees in drifts; snow drives sideways.
  e('snow storm', 'nature', 'weather', () => {
    const b = m('snow storm').cyl([16, 0.12, 11], [0, 0.06, 0], { color: 'snow' });
    b.box([5, 3, 4], [-2, 1.5, -1.5], { color: '#a34a3a', edge: 'sharp' });
    gable(b, 5, 4, 3, 1.8, '#f4f8fb', { x: -2, z: -1.5 });
    b.box([1.0, 0.9, 0.08], [-1.0, 1.5, 0.52], { color: '#ffd27a', glow: true, name: 'window', mover: { kind: 'light', on: true }, edge: 'sharp' }).box([0.6, 1.4, 1.2], [-3.2, 4.3, -2], { color: 'stone', edge: 'sharp' });
    b.dome([6, 1.4, 2.4], [-2, 0.7, 1.0], { color: 'snow' }).dome([3, 1.0, 2], [4, 0.5, 2], { color: 'snow' });
    pine(b, 4.5, -2.5, 6, '#2f5a3a');
    b.cone([2.0, 0.6, 2.0], [4.5, 3.0, -2.5], { color: 'snow' }).cone([1.3, 0.5, 1.3], [4.5, 4.3, -2.5], { color: 'snow' });
    b.stick([1.6, 0, 2.4], [1.6, 3.2, 2.4], 0.1, '#2a2726').ball([0.3, 0.35, 0.3], [1.6, 3.35, 2.4], { color: '#fff3a0', glow: true });
    cloud(b, 0, 7.4, -2.5, 8, '#7f8a94');
    b.capsule([0.06, 2.2, 0.06], [0, 4.5, 2], { color: 'white', rot: [0, 0, 75], name: 'gust', noInk: true });
    for (const [x, y, z] of [[-3, 3.5, 2.5], [2, 2.5, 3], [-1, 1.8, 3.5], [3, 4.6, 1.5], [-4.5, 2.2, 2]]) b.capsule([0.05, 1.8, 0.05], [x, y, z], { color: x > 0 ? 'white' : 'skyblue', rot: [0, 0, 75], noInk: true, parent: 'gust' });
    for (const [x, y, z] of [[-3.5, 4.5, 3], [0.5, 3.5, 3.4], [2.8, 1.5, 3.2], [-1.5, 2.8, 3.6], [1.2, 5.5, 2.6], [-0.2, 1.2, 4]]) flake(b, x, y, z, 0.35, 'white', { parent: 'gust' });
    return b
      .act({
        click: [
          [A.par(A.effect('snow', { dur: 3 }), A.pose('gust', { move: [2, -0.5, 0], dur: 2 }), A.say('Whoooooo!', 2)), A.pose('gust', { move: [0, 0, 0], dur: 0.01 })],
          [A.operate('window', 'off'), A.wait(0.6), A.operate('window', 'on')],
        ],
      })
      .done();
  }),
  // Someone: a person in a grey hoodie, hood up, a question mark over their head; who could it be?
  e('someone', 'town', 'people', () =>
    withAct(
      lift(who('someone', { top: 'gray', bottom: 'darkgray', shoes: 'black', style: 'short', hair: 'darkbrown', long: true, pose: 'cross', acc: [hat('hood', 'gray')] }), 0, (b) => {
        path(b, [...ell(0, 2.15, 0.12, 0.12, 160, -60, 7), [0.03, 2.0, 0], [0.0, 1.95, 0]], 0.06, 'yellow');
        return b.ball(0.07, [0, 1.85, 0], { color: 'yellow' });
      }),
      { click: [[A.par(A.anim('shrug'), A.say("Who, me? I'm just someone.", 2))], [A.par(A.anim('wave'), A.say('Hi there!', 1.5))]] },
    ),
  ),
  // A spark: a sparkler (35 cm) stuck in a pot of sand, its tip a crackling burst of glowing sparks.
  e('spark', 'nature', 'fire', () => {
    const b = m('spark').cyl([0.1, 0.08, 0.1], [0, 0.04, 0], { color: '#c4673a', taper: 1.2, edge: 'sharp' }).cyl([0.09, 0.01, 0.09], [0, 0.08, 0], { color: 'sand' });
    b.stick([0, 0.08, 0], [0.02, 0.3, 0], 0.005, 'gray').stick([0.015, 0.25, 0], [0.025, 0.34, 0], 0.012, '#6b6a5a');
    b.ball(0.04, [0.025, 0.35, 0], { color: '#fff6c0', glow: true, name: 'burst', mover: { kind: 'light', on: true } });
    for (let i = 0; i < 8; i++) {
      const a = i * 45;
      b.box([0.004, 0.06, 0.004], [0.025 + Math.sin(a * D2R) * 0.04, 0.35 + Math.cos(a * D2R) * 0.04, 0], { color: i % 2 ? 'yellow' : 'orange', glow: true, rot: [0, 0, -a], parent: 'burst', noInk: true });
    }
    return b.act({ click: [[A.par(A.pose('burst', { scale: 1.6, dur: 0.2 }), A.effect('sparkle', { dur: 1.5 }), A.say('Fzzzzt!', 1.2)), A.pose('burst', { scale: 1, dur: 0.3, times: 2 }), A.pose('burst', { scale: 1, dur: 0.2 })]] }).done();
  }),
  // A spore cloud: a puffball mushroom (10 cm) on a mossy tuft; poke it and it puffs out a cloud of spores.
  e('spore', 'garden', 'fungi', () =>
    m('spore')
      .dome([0.2, 0.04, 0.2], [0, 0.02, 0], { color: '#5a7a3a' })
      .ball([0.1, 0.085, 0.1], [0, 0.075, 0], { color: '#efe6d2', name: 'puff', pivot: [0, 0.035, 0] })
      .cone([0.02, 0.02, 0.02], [0, 0.125, 0], { color: '#8a7a5a', parent: 'puff' })
      .ball([0.06, 0.05, 0.06], [0.08, 0.05, 0.03], { color: '#e8dcc0' })
      .ball(0.012, [0.01, 0.16, 0.01], { color: '#a08a5a', name: 'spores' })
      .ball(0.01, [-0.02, 0.19, 0.0], { color: '#a08a5a', parent: 'spores' })
      .ball(0.009, [0.025, 0.21, -0.01], { color: '#a08a5a', parent: 'spores' })
      .act({ click: [[A.pose('puff', { scale: 0.75, dur: 0.15 }), A.par(A.pose('puff', { scale: 1, dur: 0.3 }), A.effect('dust', { dur: 1.5 }), A.pose('spores', { move: [0, 0.12, 0], scale: 2, dur: 1 }), A.say('Poof!', 1)), A.pose('spores', { move: [0, 0, 0], scale: 1, dur: 0.01 })]] })
      .done(),
  ),
  // A coil spring (10 cm of steel) between two little end plates on a block; it squashes and boings.
  e('spring', 'workshop', 'hardware', () => {
    const b = m('spring').box([0.1, 0.012, 0.1], [0, 0.006, 0], { color: 'darkwood', edge: 'sharp', round: 0.3 });
    b.cyl([0.09, 0.006, 0.09], [0, 0.015, 0], { color: 'steel', edge: 'sharp', name: 'coil', pivot: [0, 0.012, 0] });
    const P = (i: number): Vec3 => [Math.cos(i * 30 * D2R) * 0.035, 0.022 + i * 0.0024, Math.sin(i * 30 * D2R) * 0.035];
    for (let i = 0; i < 36; i++) b.rod(P(i), P(i + 1), 0.009, 'steel', { parent: 'coil' });
    b.cyl([0.09, 0.006, 0.09], [0, 0.112, 0], { color: 'steel', edge: 'sharp', parent: 'coil' });
    return b.act({ click: [[A.pose('coil', { scale: 0.7, dur: 0.2 }), A.par(A.pose('coil', { scale: 1, dur: 0.15 }), A.anim('bounce', 2), A.say('Boing!', 1.2))]] }).done();
  }),
  // A sprout (10 cm): a bean seedling pushing up out of the soil, its two seed leaves just opening, the seed coat
  // still on one; it grows.
  e('sprout', 'garden', 'plants', () =>
    m('sprout')
      .dome([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'dirt' })
      .rod([0, 0.02, 0], [0.006, 0.055, 0], 0.008, '#c8e08a', { name: 'shoot', pivot: [0, 0.02, 0] })
      .rod([0.006, 0.055, 0], [-0.004, 0.08, 0], 0.008, '#c8e08a', { parent: 'shoot' })
      .ball([0.042, 0.008, 0.024], [0.02, 0.086, 0], { color: 'green', rot: [0, 0, 20], parent: 'shoot' })
      .ball([0.042, 0.008, 0.024], [-0.028, 0.086, 0], { color: 'green', rot: [0, 0, -20], parent: 'shoot' })
      .ball([0.018, 0.012, 0.014], [-0.03, 0.093, 0], { color: 'tan', parent: 'shoot' })
      .ball([0.016, 0.01, 0.014], [0.025, 0.02, 0.02], { color: 'tan' })
      .act({ click: [[A.par(A.pose('shoot', { scale: 1.4, dur: 1 }), A.effect('sparkle', { dur: 1.2 })), A.wait(1), A.pose('shoot', { scale: 1, dur: 0.6 })]] })
      .done(),
  ),
  // A star: a chunky golden five-pointed star (35 cm) on a short stand; it spins and twinkles.
  e('star', 'ideas', 'shapes', () =>
    m('star')
      .box([0.2, 0.05, 0.12], [0, 0.025, 0], { color: 'darkgray', edge: 'sharp', round: 0.3 })
      .stick([0, 0.05, 0], [0, 0.09, 0], 0.03, 'darkgray')
      .star(0.34, [0, 0.25, 0], { color: 'yellow', name: 'star', round: 0.06 })
      .act({ click: [[A.par(A.pose('star', { rot: [0, 360, 0], dur: 1 }), A.effect('sparkle', { dur: 1.2 }), A.say('Ding!', 1)), A.pose('star', { rot: [0, 0, 0], dur: 0.01 })]] })
      .done(),
  ),
  // A stir fry in a wok (35 cm) over a gas ring: peppers, broccoli, carrots and noodles, chopsticks resting on the
  // rim; it is tossed in a burst of flame.
  e('stir fry', 'food', 'dishes', () => {
    const b = m('stir fry').cyl([0.22, 0.08, 0.22], [0, 0.04, 0], { color: '#3a3633', edge: 'sharp' }).torus([0.16, 0.16, 0.02], [0, 0.085, 0], { color: '#4e8fd6', rot: [90, 0, 0], glow: true, tube: 0.2 });
    b.dome([0.38, 0.11, 0.38], [0, 0.145, 0], { color: 'iron', rot: [180, 0, 0], name: 'wok', pivot: [0, 0.09, 0] }).torus([0.38, 0.38, 0.02], [0, 0.2, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.05, parent: 'wok' }).rod([0.17, 0.17, 0], [0.32, 0.2, 0], 0.025, 'darkwood', { parent: 'wok' });
    b.ball(0.01, [0, 0.2, 0], { color: '#c99a5a', name: 'food' });
    for (const [x, z, c] of [[0.05, 0.03, 'green'], [-0.05, -0.02, 'green'], [0.0, 0.07, 'red'], [-0.06, 0.05, 'orange'], [0.07, -0.05, 'orange'], [0.02, -0.06, 'red'], [-0.03, -0.07, 'tan'], [0.04, 0.0, 'yellow']] as const) b.ball([0.04, 0.025, 0.03], [x, 0.21, z], { color: c, rot: [0, x * 900, 0], parent: 'food' });
    for (let i = 0; i < 4; i++) path(b, ell(0, 0.212, 0.06, 0.012, i * 45, i * 45 + 160, 4, 0).map(([x, y]) => [x * Math.cos(i), y, x * Math.sin(i)] as Vec3), 0.006, '#e8d29a', { parent: 'food' });
    return b
      .stick([-0.04, 0.2, 0.02], [-0.16, 0.24, 0.12], 0.007, 'lightwood')
      .stick([-0.03, 0.2, 0.04], [-0.14, 0.24, 0.15], 0.007, 'lightwood')
      .socket('wok', [0, 0.21, 0], 'inside', { size: 0.25 })
      .act({ click: [[A.par(A.pose('wok', { rot: [0, 0, -10], dur: 0.2 }), A.pose('food', { move: [0, 0.15, 0], dur: 0.25 })), A.par(A.pose('wok', { rot: [0, 0, 0], dur: 0.2 }), A.pose('food', { move: [0, 0, 0], dur: 0.25 }), A.effect('fire', { dur: 1 }), A.say('Sizzle!', 1.2))]] })
      .done();
  }),
  // A storm (7 m): a dark cloud with slanting rain over a tree bent by the wind and a weathervane spinning on its
  // post.
  e('storm', 'nature', 'weather', () => {
    const b = m('storm').cyl([10, 0.12, 7], [0, 0.06, 0], { color: 'grass' });
    cloud(b, -0.5, 6.0, -1.5, 6.5, '#4f565c');
    for (let i = 0; i < 9; i++) b.rod([-3.2 + i * 0.75, 4.6 - (i % 2) * 0.4, 0.2], [-3.8 + i * 0.75, 2.4 - (i % 2) * 0.4, 0.2], 0.06, 'skyblue', { noInk: true });
    b.rod([2.5, 0.1, 0.5], [2.8, 1.6, 0.5], 0.3, 'bark').ball([2.6, 1.6, 2.0], [3.6, 2.6, 0.5], { color: 'leaf', rot: [0, 0, -25], name: 'top', pivot: [2.8, 1.6, 0.5] });
    b.stick([-3, 0.12, 1.5], [-3, 3.2, 1.5], 0.08, '#2a2726');
    b.cyl([0.05, 0.05, 0.05], [-3, 3.25, 1.5], { color: '#2a2726', name: 'vane', mover: { kind: 'spin', axis: 'y', amount: 360 } }).box([0.9, 0.04, 0.04], [-3, 3.3, 1.5], { color: '#2a2726', parent: 'vane', edge: 'sharp' }).wedge([0.3, 0.3, 0.02], [-3.4, 3.35, 1.5], { color: '#2a2726', parent: 'vane', rot: [0, 0, 90], edge: 'sharp' }).cone([0.1, 0.2, 0.04], [-2.5, 3.3, 1.5], { color: '#2a2726', rot: [0, 0, -90], parent: 'vane', edge: 'sharp' }).ball([0.2, 0.18, 0.1], [-3, 3.45, 1.5], { color: '#2a2726', parent: 'vane' });
    return b
      .act({ click: [[A.par(A.operate('vane', 'on'), A.effect('rain', { dur: 3 }), A.pose('top', { rot: [0, 0, -10], dur: 0.6 }), A.say('Whoosh!', 1.5)), A.wait(2), A.par(A.operate('vane', 'off'), A.pose('top', { rot: [0, 0, 0], dur: 0.6 }))]] })
      .done();
  }),
  // A stunt: a BMX rider flying high off a quarter-pipe ramp (3.5 m); the rider does a backflip.
  e('stunt', 'sports', 'stunts', () => {
    const b = m('stunt').box([6, 0.06, 3], [0, 0.03, 0], { color: '#8f949a', edge: 'sharp' });
    b.wedge([3.0, 1.6, 2.4], [-1.4, 0.8, 0], { color: 'wood', apex: 0.5, edge: 'sharp' }).box([0.4, 1.6, 2.4], [0.3, 0.8, 0], { color: 'darkwood', edge: 'sharp' });
    const c: Vec3 = [1.0, 2.6, 0];
    b.ball(0.05, c, { color: 'red', name: 'rider' });
    b.torus([0.5, 0.5, 0.06], [c[0] - 0.42, c[1] - 0.25, 0], { color: 'rubber', parent: 'rider', tube: 0.2 }).torus([0.5, 0.5, 0.06], [c[0] + 0.42, c[1] - 0.25, 0], { color: 'rubber', parent: 'rider', tube: 0.2 });
    b.rod([c[0] - 0.42, c[1] - 0.25, 0], [c[0], c[1] - 0.05, 0], 0.04, 'red', { parent: 'rider' }).rod([c[0], c[1] - 0.05, 0], [c[0] + 0.42, c[1] - 0.25, 0], 0.04, 'red', { parent: 'rider' }).rod([c[0] + 0.3, c[1] + 0.1, -0.25], [c[0] + 0.3, c[1] + 0.1, 0.25], 0.03, 'silver', { parent: 'rider' });
    b.box([0.25, 0.45, 0.25], [c[0] - 0.05, c[1] + 0.3, 0], { color: 'white', round: 0.5, rot: [0, 0, -25], parent: 'rider' }).ball(0.26, [c[0] + 0.08, c[1] + 0.62, 0], { color: 'yellow', parent: 'rider' }).rod([c[0], c[1] + 0.45, 0.08], [c[0] + 0.28, c[1] + 0.12, 0.2], 0.07, 'white', { parent: 'rider' });
    b.pair((s) => b.rod([c[0] - 0.1, c[1] + 0.1, s * 0.1], [c[0] + 0.05, c[1] - 0.1, s * 0.15], 0.08, 'navy', { parent: 'rider' }));
    return b
      .act({ click: [[A.par(A.pose('rider', { rot: [0, 0, 360], dur: 1 }), A.say('Whoa! Backflip!', 1.8)), A.pose('rider', { rot: [0, 0, 0], dur: 0.01 }), A.effect('sparkle', { dur: 1 })]] })
      .done();
  }),
  // A planetarium sun (3.1 m): a glowing golden globe ringed with flame-like rays, turning slowly; a solar flare
  // bursts from it.
  e('sun', 'sky', 'stars', () => {
    const b = orb('sun', 2.4, 1.75, '#ffd24a', { spin: 15 });
    for (let k = 0; k < 12; k++) {
      const a = k * 30;
      b.cone([0.34, 0.5, 0.16], [Math.cos(a * D2R) * 1.42, 1.75 + Math.sin(a * D2R) * 1.42, 0], { color: k % 2 ? 'orange' : '#ffb03a', glow: true, rot: [0, 0, a - 90], parent: 'globe' });
    }
    for (const [x, y] of [[-0.4, 0.3], [0.35, -0.2]]) b.ball([0.25, 0.2, 0.08], [x, 1.75 + y, Math.sqrt(1.44 - x * x - y * y) - 0.03], { color: '#e0902a', noInk: true, parent: 'globe' });
    return b.act({ click: [[A.par(A.pose('globe', { scale: 1.12, dur: 0.3 }), A.effect('fire', { dur: 2 }), A.say('FWOOSH!', 1.5)), A.pose('globe', { scale: 1, dur: 0.6 })]] }).done();
  }),
  // A supernova (planetarium model, 3.2 m): a white-hot core bursting out through a shell of fiery rays, with
  // glowing shock rings; it explodes again.
  e('supernova', 'sky', 'space', () => {
    const b = m('supernova').cyl([1.1, 0.1, 1.1], [0, 0.05, 0], { color: '#1a1a24', edge: 'sharp', round: 0.4 }).cyl([0.08, 1.0, 0.08], [0, 0.55, 0], { color: '#2a2a3a' });
    b.ball(1.0, [0, 1.95, 0], { color: '#fff6c0', glow: true, name: 'core' }).ball(1.5, [0, 1.95, 0], { color: 'yellow', glow: true, parent: 'core' });
    for (let k = 0; k < 14; k++) {
      const a = k * 137.5 * D2R, y = 1 - (2 * (k + 0.5)) / 14, r = Math.sqrt(1 - y * y), d: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
      b.rod([d[0] * 0.6, 1.95 + d[1] * 0.6, d[2] * 0.6], [d[0] * 1.25, 1.95 + d[1] * 1.25, d[2] * 1.25], 0.16, k % 2 ? 'orange' : 'yellow', { glow: true, parent: 'core' });
    }
    return b
      .torus([2.6, 2.6, 0.1], [0, 1.95, 0], { color: 'magenta', glow: true, rot: [70, 0, 20], tube: 0.06 })
      .torus([2.2, 2.2, 0.1], [0, 1.95, 0], { color: 'cyan', glow: true, rot: [-30, 40, 0], tube: 0.06 })
      .act({ click: [[A.pose('core', { scale: 0.6, dur: 0.4 }), A.par(A.pose('core', { scale: 1.3, dur: 0.2 }), A.effect('explosion', { dur: 1 }), A.say('KA-BOOOM!', 1.5)), A.pose('core', { scale: 1, dur: 0.8 })]] })
      .done();
  }),
  // A swamp (3.5 m): murky green water with cypress knees and stumps hung with moss, cattails, lily pads, a rotting
  // log; an alligator surfaces.
  e('swamp', 'nature', 'landscapes', () => {
    const b = m('swamp').cyl([7, 0.1, 5], [0, 0.05, 0], { color: '#4a3a24' }).cyl([5.6, 0.04, 3.8], [0.2, 0.12, 0.2], { color: '#5a6b3a' });
    for (const [x, z, h] of [[-2, -1.2, 3.4], [1.8, -1.6, 2.8]] as const) {
      b.cyl([0.5, h, 0.5], [x, h / 2, z], { color: '#6a5a4a', taper: 0.6 }).rod([x, h * 0.8, z], [x - 0.8, h + 0.2, z], 0.12, '#6a5a4a').rod([x, h * 0.7, z], [x + 0.7, h * 0.95, z + 0.2], 0.1, '#6a5a4a');
      for (const dx of [-0.6, 0.3, 0.6]) b.capsule([0.12, 0.7, 0.06], [x + dx, h * 0.75, z + 0.1], { color: '#8a9a5a' });
    }
    for (const [x, z] of [[-1.2, -0.4], [0.8, -0.8], [-0.4, 1.4]]) b.cone([0.18, 0.4, 0.18], [x, 0.3, z], { color: '#6a5a4a' });
    for (const [x, z, h] of [[2.4, 0.8, 1.4], [2.6, 1.0, 1.2], [2.2, 1.1, 1.3], [-2.6, 1.0, 1.1]] as const) b.stick([x, 0.1, z], [x, h, z], 0.025, 'darkgreen').capsule([0.07, 0.2, 0.07], [x, h - 0.05, z], { color: 'darkbrown' });
    for (const [x, z] of [[0.2, 1.2], [1.0, 0.6], [-0.8, 0.9]]) b.cyl([0.45, 0.02, 0.45], [x, 0.15, z], { color: 'green' });
    b.rod([-2.4, 0.2, 1.6], [-0.6, 0.22, 1.9], 0.35, 'darkwood');
    b.box([0.5, 0.12, 1.4], [0.4, 0.05, 0.2], { color: '#4f5a2a', name: 'gator', round: 0.6, mover: { kind: 'slide', axis: 'y', amount: 0.16 } })
      .ball([0.12, 0.1, 0.12], [0.3, 0.12, 0.75], { color: '#4f5a2a', parent: 'gator' })
      .ball([0.12, 0.1, 0.12], [0.5, 0.12, 0.75], { color: '#4f5a2a', parent: 'gator' })
      .ball([0.04, 0.05, 0.04], [0.3, 0.16, 0.8], { color: 'yellow', parent: 'gator' })
      .ball([0.04, 0.05, 0.04], [0.5, 0.16, 0.8], { color: 'yellow', parent: 'gator' });
    return b.act({ click: [[A.operate('gator', 'up'), A.say('Snap!', 1.2), A.wait(1.2), A.operate('gator', 'down'), A.say('Ribbit.', 1)]] }).done();
  }),
  // The bull on the zodiac plinth: it paws the ground, lowers its horns and snorts.
  e('taurus (stars)', 'sky', 'zodiac', () =>
    withAct(
      lift(beast('taurus (stars)', { color: '#5a3a22', body: [0.62, 0.36, 0.34], legL: 0.22, legW: 0.09, hoof: 'black', neckL: 0.08, neckLean: 50, neckW: 0.24, head: [0.22, 0.2, 0.2], snout: { len: 0.08, h: 0.1, w: 0.13, color: '#d9a080' }, ears: 'side', earSize: 0.07, tail: 'tuft', acc: [ani.horns('cream', 'bull')] }), 0.12, (b) => zb(b, 'TAURUS')),
      { click: [[A.par(A.pose('legFL', { rot: [-30, 0, 0], dur: 0.2, times: 2 }), A.effect('dust', { dur: 1.2 })), A.par(A.pose('neck', { rot: [25, 0, 0], dur: 0.4 }), A.say('Snort! Moo!', 1.5)), A.pose('neck', { rot: [0, 0, 0], dur: 0.4 })]] },
    ),
  ),
  // A tear: a big blue teardrop (30 cm) on a little stand, shining; it rolls down and drips.
  e('tear', 'ideas', 'emotions', () => {
    const b = m('tear').cyl([0.14, 0.025, 0.1], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp' }).stick([0, 0.025, 0], [0, 0.1, 0], 0.02, 'darkgray');
    b.ball(0.15, [0, 0.18, 0], { color: 'skyblue', name: 'drop' }).cone([0.13, 0.14, 0.13], [0, 0.27, 0], { color: 'skyblue', parent: 'drop' }).ball(0.035, [-0.035, 0.21, 0.06], { color: 'white', noInk: true, parent: 'drop' });
    return b.act({ click: [[A.par(A.pose('drop', { move: [0, -0.04, 0], scale: 0.9, dur: 0.6 }), A.say('Sniff...', 1.5)), A.pose('drop', { move: [0, 0, 0], scale: 1, dur: 0.6 })]] }).done();
  }),
  // Tempo: a wooden metronome (25 cm), its pendulum arm swinging to the beat: tick, tock.
  e('tempo', 'music', 'music tools', () =>
    m('tempo', { edge: 'sharp' })
      .box([0.18, 0.03, 0.14], [0, 0.015, 0], { color: 'darkwood', round: 0.3 })
      .pyramid([0.2, 0.24, 0.16], [0, 0.15, 0], 4, { color: 'wood', taper: 0.3, rot: [0, 45, 0] })
      .box([0.07, 0.17, 0.005], [0, 0.14, 0.055], { color: 'cream', rot: [-14, 0, 0] })
      .stick([0, 0.07, 0.065], [0, 0.29, 0.065], 0.008, 'steel', { name: 'arm', pivot: [0, 0.07, 0.065] })
      .box([0.03, 0.025, 0.02], [0, 0.24, 0.07], { color: 'gold', parent: 'arm' })
      .act({ click: [[A.par(A.pose('arm', { rot: [0, 0, 28], dur: 0.45, times: 4 }), A.say('Tick, tock, tick, tock...', 3))]] })
      .done(),
  ),
  e('ten', 'ideas', 'numbers', () => counter('ten', '10', 10, 'red', 'white', COUNT).done()),
  // A test at a school desk: the paper (an A+ in red) with a pencil and an eraser, a ticking timer; pencils down!
  e('test', 'study', 'school', () => {
    const b = m('test', { edge: 'sharp' }).box([0.65, 0.03, 0.5], [0, 0.72, 0], { color: 'lightwood' }).box([0.6, 0.18, 0.45], [0, 0.6, 0], { color: '#8a8f94' });
    for (const [x, z] of [[-0.28, 0.2], [0.28, 0.2], [-0.28, -0.2], [0.28, -0.2]]) b.box([0.03, 0.52, 0.03], [x, 0.26, z], { color: '#5c6166' });
    b.box([0.21, 0.004, 0.29], [-0.05, 0.737, 0.03], { color: 'white', round: 0 });
    for (let i = 0; i < 6; i++) b.box([0.12, 0.002, 0.01], [-0.08, 0.74, -0.08 + i * 0.04], { color: 'gray', noInk: true, round: 0 }).cyl([0.012, 0.002, 0.012], [0.02, 0.74, -0.08 + i * 0.04], { color: i % 2 ? '#2a2726' : 'white', noInk: true });
    b.label('A+', [0.06, 0.04], [0.0, 0.742, 0.13], { color: 'white', rot: [-90, 0, 0], depth: 0.002 });
    b.cyl([0.012, 0.18, 0.012], [0.16, 0.745, 0.05], { color: 'yellow', rot: [90, 30, 0], segs: 6, name: 'pencil' }).box([0.05, 0.015, 0.025], [0.2, 0.744, -0.12], { color: 'pink', round: 0.4 });
    return b
      .cyl([0.08, 0.06, 0.08], [-0.22, 0.765, -0.15], { color: 'red', edge: 'soft' })
      .cyl([0.06, 0.005, 0.06], [-0.22, 0.765, -0.108], { color: 'white', rot: [90, 0, 0] })
      .act({ click: [[A.par(A.pose('pencil', { move: [-0.06, 0, 0.02], dur: 0.25, times: 3 }), A.say('Tick tick tick...', 1.5)), A.say('Pencils down!', 1.5)]] })
      .done();
  }),
  // Testimony: a witness in the witness box (a panelled stand with a rail, a microphone and a Bible), right hand
  // raised to take the oath.
  e('testimony', 'study', 'law', () =>
    withAct(
      lift(who('testimony', { h: 1.7, top: '#4e8fd6', bottom: '#3d4f7a', style: 'short', hair: '#5a3a22', skin: 'skin2', pose: 'wave' }), 0.2, (b) => {
        b.box([1.4, 0.2, 1.2], [0, 0.1, 0], { color: 'darkwood', edge: 'sharp' });
        b.box([1.4, 1.1, 0.08], [0, 0.75, 0.55], { color: 'wood', edge: 'sharp' }).box([0.08, 1.1, 1.1], [0.66, 0.75, 0], { color: 'wood', edge: 'sharp' }).box([0.08, 1.1, 1.1], [-0.66, 0.75, 0], { color: 'wood', edge: 'sharp' });
        b.box([1.5, 0.06, 0.2], [0, 1.33, 0.55], { color: 'darkwood', edge: 'sharp' });
        for (const x of [-0.35, 0.35]) b.box([0.5, 0.7, 0.02], [x, 0.75, 0.6], { color: 'darkwood', edge: 'sharp' });
        b.stick([0.35, 1.36, 0.55], [0.25, 1.6, 0.45], 0.015, '#2a2726').ball([0.05, 0.07, 0.05], [0.24, 1.63, 0.44], { color: 'darkgray' });
        return b.box([0.18, 0.05, 0.13], [-0.4, 1.385, 0.55], { color: '#2a2726', edge: 'sharp' }).box([0.012, 0.08, 0.005], [-0.4, 1.412, 0.62], { color: 'gold', rot: [90, 0, 0], noInk: true });
      }),
      { click: [[A.par(A.anim('nod'), A.say('I swear to tell the truth, the whole truth...', 2.5))], [A.par(A.anim('point'), A.say('It was him! He did it!', 2))]] },
    ),
  ),
  // The Constitution in its display case (as in a national archive): a slanted bronze-framed glass case on a
  // pedestal, the parchment inside headed "We the People"; its lights come on.
  e('the constitution', 'study', 'documents', () =>
    m('the constitution', { edge: 'sharp' })
      .box([0.9, 0.9, 0.6], [0, 0.45, 0], { color: '#5a4a3a', round: 0.05 })
      .box([1.0, 0.08, 0.7], [0, 0.94, 0], { color: 'bronze' })
      .box([0.9, 0.12, 0.62], [0, 1.03, 0], { color: 'bronze', rot: [-12, 0, 0] })
      .box([0.6, 0.004, 0.45], [0, 1.093, 0], { color: '#eadcb0', rot: [-12, 0, 0], round: 0, name: 'page' })
      .label('We the People', [0.42, 0.06], [0, 1.098, -0.12], { color: '#eadcb0', rot: [-102, 0, 0], depth: 0.002 })
      .box([0.48, 0.002, 0.008], [0, 1.098, -0.02], { color: '#8a7a5a', noInk: true, rot: [-12, 0, 0], round: 0 })
      .box([0.48, 0.002, 0.008], [0, 1.098, 0.04], { color: '#8a7a5a', noInk: true, rot: [-12, 0, 0], round: 0 })
      .box([0.4, 0.002, 0.008], [-0.04, 1.098, 0.1], { color: '#8a7a5a', noInk: true, rot: [-12, 0, 0], round: 0 })
      .box([0.84, 0.03, 0.56], [0, 1.11, 0], { color: 'glass', rot: [-12, 0, 0], name: 'glow', mover: { kind: 'light', on: false } })
      .socket('case', [0, 1.0, 0], 'inside', { size: 0.5 })
      .act({ click: [[A.operate('glow', 'on'), A.say('Ooooh.', 1.5), A.wait(2), A.operate('glow', 'off')]] })
      .done(),
  ),
  e('three', 'ideas', 'numbers', () => counter('three', '3', 3, 'yellow', 'red', COUNT).done()),
  // A thunderstorm (10 m): black clouds, sheets of rain and two forks of lightning over a farmhouse with a lit
  // window; the lightning flashes and the thunder rolls.
  e('thunderstorm', 'nature', 'weather', () => {
    const b = m('thunderstorm').cyl([14, 0.12, 10], [0, 0.06, 0], { color: 'grass' });
    b.box([4, 3, 3.5], [3.5, 1.5, -1.5], { color: 'cream', edge: 'sharp' });
    gable(b, 4, 3.5, 3, 1.6, '#a3322a', { x: 3.5, z: -1.5 });
    b.box([0.9, 0.9, 0.06], [3.0, 1.6, 0.27], { color: '#ffd27a', glow: true, edge: 'sharp' });
    cloud(b, -0.5, 8.4, -2, 9, '#3f454b');
    for (let i = 0; i < 9; i++) b.rod([-4 + i * 0.9, 7.0, 0.5], [-4.3 + i * 0.9, 4.6, 0.5], 0.06, 'skyblue', { noInk: true });
    bolt(b, -2.2, 7.5, 7.4, 1.6, 0.6, '#fff27a', { name: 'bolt1', mover: { kind: 'light', on: true } });
    bolt(b, 1.0, 7.5, 5.5, 1.2, 0.8, '#fff27a', { name: 'bolt2', mover: { kind: 'light', on: false } });
    return b
      .act({ click: [[A.par(A.operate('bolt1', 'off'), A.operate('bolt2', 'on'), A.effect('rain', { dur: 3 })), A.wait(0.2), A.par(A.operate('bolt1', 'on'), A.operate('bolt2', 'off')), A.wait(0.3), A.say('KRAKOOOOM!', 2), A.par(A.operate('bolt2', 'on')), A.wait(0.2), A.operate('bolt2', 'off')]] })
      .done();
  }),
  // A tingle: a person with sparkles fizzing round their shoulders and fingertips, a shiver running through them.
  e('tingle', 'ideas', 'feelings', () =>
    withAct(
      lift(who('tingle', { h: 1.68, top: '#8a5fc4', bottom: '#3d4f7a', skin: 'skin2', style: 'ponytail', hair: '#a0522d', pose: 'arms_up' }), 0, (b) => {
        for (const [x, y, s] of [[-0.45, 2.0, 0.14], [0.5, 2.05, 0.12], [0.3, 1.6, 0.1], [-0.35, 1.5, 0.1], [0.0, 2.25, 0.12], [0.55, 1.3, 0.08]]) b.star(s, [x, y, 0.15], { color: 'yellow', glow: true });
        return b;
      }),
      { click: [[A.par(A.anim('shake'), A.effect('sparkle', { dur: 1.5 }), A.say('Ooh, that tingles!', 2))], [A.par(A.anim('laugh'), A.say('It tickles!', 1.5))]] },
    ),
  ),
  // A slice of tiramisu (8 cm) on a white plate: layers of coffee-soaked sponge and mascarpone dusted with cocoa,
  // a coffee bean on top and a dessert fork that takes a bite.
  e('tiramisu', 'food', 'desserts', () => {
    const b = m('tiramisu').cyl([0.24, 0.012, 0.24], [0, 0.006, 0], { color: 'white', edge: 'sharp' });
    ['#7a4a2a', 'cream', '#7a4a2a', 'cream'].forEach((c, i) => b.box([0.13, 0.024, 0.1], [0, 0.024 + i * 0.024, 0], { color: c, round: 0.1 }));
    return b
      .box([0.13, 0.008, 0.1], [0, 0.112, 0], { color: 'chocolate', round: 0.2 })
      .ball([0.018, 0.012, 0.024], [0.02, 0.122, 0.01], { color: 'darkbrown' })
      .rod([-0.11, 0.016, 0.07], [0.0, 0.016, 0.1], 0.008, 'silver', { name: 'fork' })
      .act({ click: [[A.pose('fork', { move: [0.03, 0.08, -0.04], rot: [0, 0, 25], dur: 0.4 }), A.say('Mmm!', 1.2), A.pose('fork', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A tornado (11 m): a twisting grey funnel coming down from a dark cloud, tearing up a field, planks and a red
  // barn door whirling round it.
  e('tornado', 'nature', 'weather', () => {
    const b = m('tornado').cyl([14, 0.1, 10], [0, 0.05, 0], { color: '#8a9a5a' });
    cloud(b, 0, 9.6, -1, 9, '#5c6166');
    b.ball(0.2, [0, 0.4, 0], { color: '#6b737a', name: 'funnel', mover: { kind: 'spin', axis: 'y', amount: 120, on: true } });
    for (let i = 0; i < 9; i++) {
      const d = 0.8 + i * 0.6;
      b.torus([d, d, 0.7], [Math.sin(i * 0.7) * 0.25 + i * 0.05, 0.4 + i * 0.95, 0], { color: i % 2 ? '#8f969e' : '#6b737a', rot: [90, 0, 0], tube: 0.32, parent: 'funnel' });
    }
    for (const [x, y, z, s, c] of [[2.4, 2.4, 0.6, 0.6, 'wood'], [-2.2, 4.3, 0.3, 0.8, 'red'], [2.8, 6.1, -0.4, 0.5, 'wood'], [-1.4, 1.4, 1.2, 0.4, 'wood']] as const) b.box([s, s * 0.2, s * 0.4], [x, y, z], { color: c, rot: [30, 40, 10], parent: 'funnel', edge: 'sharp' });
    return b
      .dome([2.4, 0.5, 2.0], [0, 0.3, 0], { color: '#b5a48e' })
      .act({ click: [[A.par(A.pose('funnel', { spin: [0, 600, 0] }), A.effect('dust', { dur: 3 }), A.say('WHOOOOOOO!', 2.5)), A.wait(2.5), A.pose('funnel', { spin: [0, 120, 0] })]] })
      .done();
  }),
  // A treasury (11 m, a hill version of a great government building): a stepped stone base, eight columns, a
  // pediment and a TREASURY frieze, a round vault door in the middle that swings open on the gold.
  e('treasury', 'places', 'government', () => {
    const W = 18, D = 10, zf = D / 2;
    const b = m('treasury', { edge: 'sharp' });
    for (let i = 0; i < 3; i++) b.box([W + 2 - i * 0.8, 0.3, D + 2 - i * 0.6], [0, 0.15 + i * 0.3, 0], { color: i % 2 ? '#c9c4b8' : 'stone' });
    b.box([W - 2, 6.6, D - 2], [0, 4.2, -1], { color: '#e8e0cc', round: 0.02 });
    for (let i = 0; i < 8; i++) b.cyl([0.75, 6.6, 0.75], [-W / 2 + 1.6 + i * ((W - 3.2) / 7), 4.2, zf - 0.6], { color: 'white', edge: 'soft' }).box([1.0, 0.25, 1.0], [-W / 2 + 1.6 + i * ((W - 3.2) / 7), 7.6, zf - 0.6], { color: 'white' });
    b.box([W, 1.0, D], [0, 8.2, -0.1], { color: '#e8e0cc' }).label('TREASURY', [7, 0.8], [0, 8.2, zf - 0.05], { color: '#e8e0cc' }).wedge([W + 0.6, 2.4, D + 0.4], [0, 9.9, -0.1], { color: '#d8d0bc' });
    b.cyl([2.8, 0.4, 2.8], [0, 2.4, zf - 1.75], { color: '#8f99a3', rot: [90, 0, 0], name: 'vault', pivot: [-1.4, 2.4, zf - 1.75], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    b.torus([2.0, 2.0, 0.1], [0, 2.4, zf - 1.5], { color: 'silver', parent: 'vault' }).cyl([0.4, 0.2, 0.4], [0, 2.4, zf - 1.45], { color: 'silver', rot: [90, 0, 0], parent: 'vault' });
    for (const r of [0, 60, 120]) b.box([1.4, 0.08, 0.08], [0, 2.4, zf - 1.35], { color: 'silver', rot: [0, 0, r], parent: 'vault' });
    for (const [x, y] of [[-0.4, 1.0], [0.3, 1.0], [-0.05, 1.25]]) b.box([0.6, 0.22, 0.3], [x, y, zf - 2.3], { color: 'gold', round: 0.2 });
    return b
      .act({ click: [[A.operate('vault', 'open'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Ka-ching!', 1.5)), A.wait(2), A.operate('vault', 'close'), A.say('Clunk.', 1)]] })
      .done();
  }),
  // A tsunami (9 m): a giant wave curling over a beach with palms and a beach hut; it comes crashing in.
  e('tsunami', 'nature', 'disasters', () => {
    const b = m('tsunami').box([16, 0.2, 12], [0, 0.1, 0], { color: 'water' }).dome([16, 0.5, 4], [0, 0.35, 4.4], { color: 'sand' });
    palm(b, -5, 4.4, 5);
    palm(b, 4.5, 5, 4.5);
    b.box([2.4, 2, 2], [1, 1.25, 4.6], { color: '#e8d29a', edge: 'sharp' });
    gable(b, 2.4, 2, 2.25, 0.9, '#a3322a', { x: 1, z: 4.6 });
    b.box([15, 5.5, 2.2], [0, 2.9, -2.6], { color: '#3a7ac8', rot: [14, 0, 0], round: 0.4, name: 'wave', pivot: [0, 0, -3] });
    b.arc([5.2, 5.2, 14.6], [0, 5.6, -1.4], { color: '#4f9bd6', arc: 170, tube: 0.42, rot: [0, 90, 0], parent: 'wave' });
    for (let i = 0; i < 9; i++) b.ball([1.6, 0.8, 1.2], [-6.4 + i * 1.6, 8.1, -1.0 + (i % 2) * 0.3], { color: 'white', parent: 'wave' });
    for (let i = 0; i < 6; i++) b.ball([0.6, 0.6, 0.6], [-5 + i * 2, 5.6, 1.2], { color: 'white', parent: 'wave' });
    return b
      .act({ click: [[A.par(A.pose('wave', { rot: [20, 0, 0], move: [0, 0, 1.5], dur: 1.2 }), A.say('WHOOOOSH!', 2)), A.effect('water_spray', { dur: 2 }), A.pose('wave', { rot: [0, 0, 0], move: [0, 0, 0], dur: 1.2 })]] })
      .done();
  }),
  e('two', 'ideas', 'numbers', () => counter('two', '2', 2, 'pink', 'blue', COUNT).done()),
  // A planetarium Uranus (3 m): a pale cyan ice giant lying on its side, its faint rings standing upright; it rolls
  // round on its tipped axis.
  e('uranus', 'sky', 'planets', () =>
    spinInPlane(
      orb('uranus', 2.5, 1.85, '#a8e0e8', { tilt: 82, spin: 30 })
        .torus([3.5, 3.5, 0.05], [0, 1.85, 0], { color: '#d4eef2', rot: [0, 80, 8], tube: 0.06, noInk: true })
        .act({ click: [[A.par(A.pose('globe', { spin: [0, 240, 0] }), A.effect('sparkle', { dur: 1.5 })), A.wait(2), A.pose('globe', { spin: [0, 30, 0] })]] })
        .done(),
      ['globe'],
    ),
  ),
  // A planetarium Venus (3 m): a globe wrapped in swirling pale yellow clouds; it spins backwards, and steams.
  e('venus', 'sky', 'planets', () => {
    const b = orb('venus', 2.6, 1.85, '#e8d29a', { spin: -15 });
    for (const [x, y, w, c] of [[-0.3, 0.4, 1.6, '#f2e2b4'], [0.3, -0.2, 1.8, '#d9bb7a'], [0.0, -0.75, 1.2, '#f2e2b4'], [0.2, 0.85, 1.0, '#d9bb7a']] as const) b.ball([w, 0.22, 0.14], [x, 1.85 + y, Math.sqrt(1.69 - x * x - y * y) - 0.06], { color: c, noInk: true, rot: [0, 0, 8], parent: 'globe' });
    return b.act({ click: [[A.par(A.pose('globe', { spin: [0, -150, 0] }), A.effect('steam', { dur: 2 })), A.wait(2), A.pose('globe', { spin: [0, -15, 0] })]] }).done();
  }),
  // The maiden on the zodiac plinth, in white with a golden band, holding a sheaf of wheat.
  e('virgo (stars)', 'sky', 'zodiac', () =>
    withAct(lift(who('virgo (stars)', { h: 0.95, skin: 'skin1', hair: 'gold', style: 'long', top: 'white', bottom: 'white', skirt: 'white', acc: [gown('white'), held('bouquet', 'gold'), hat('headband', 'gold')] }), 0.12, (b) => zb(b, 'VIRGO')), {
      click: [[A.par(A.anim('wave'), A.say('A happy harvest to you!', 2))]],
    }),
  ),
  // Vomit: a green-faced person clutching their stomach beside a bucket, about to be sick.
  e('vomit', 'clinic', 'sickness', () =>
    withAct(
      lift(who('vomit', { h: 1.7, skin: '#b8d890', top: '#f2c14e', bottom: '#3d4f7a', style: 'short', hair: '#5a3a22', pose: 'hold' }), 0, (b) =>
        b.cyl([0.3, 0.32, 0.3], [0.1, 0.16, 0.45], { color: '#8f99a3', taper: 1.25, edge: 'sharp' }).torus([0.36, 0.36, 0.02], [0.1, 0.32, 0.45], { color: '#5c6166', rot: [90, 0, 0] }).cyl([0.3, 0.02, 0.3], [0.1, 0.28, 0.45], { color: '#c9c43a' }),
      ),
      { click: [[A.par(A.anim('gasp'), A.expr('sad'), A.say('Urp... I feel sick.', 2)), A.wait(0.5), A.expr('neutral')], [A.par(A.anim('shake'), A.effect('water_spray', { dur: 1 }), A.say('Bleurgh!', 1.5))]] },
    ),
  ),
  // War: two crossed swords behind a battered round shield and a helmet on a stone plinth (1.4 m); the blades clash.
  e('war', 'ideas', 'hardship', () => {
    const b = m('war', { edge: 'sharp' }).box([0.9, 0.5, 0.5], [0, 0.25, 0], { color: 'stone', round: 0.1 }).box([1.0, 0.08, 0.6], [0, 0.54, 0], { color: '#8f8c86' });
    b.pair((s) => {
      const n = `sword${s > 0 ? 'L' : 'R'}`;
      b.box([0.06, 0.95, 0.02], [s * 0.08, 1.1, -0.12], { color: 'silver', rot: [0, 0, s * 38], name: n, pivot: [s * 0.32, 0.75, -0.12] })
        .box([0.22, 0.05, 0.05], [s * 0.3, 0.77, -0.12], { color: 'gold', rot: [0, 0, s * 38], parent: n })
        .capsule([0.045, 0.14, 0.045], [s * 0.36, 0.68, -0.12], { color: 'darkbrown', rot: [0, 0, s * 38], parent: n })
        .ball(0.06, [s * 0.4, 0.61, -0.12], { color: 'gold', parent: n });
    });
    return b
      .cyl([0.62, 0.08, 0.62], [0, 1.0, 0.0], { color: '#8a2b3a', rot: [90, 0, 0], edge: 'soft' })
      .torus([0.62, 0.62, 0.06], [0, 1.0, 0.04], { color: 'iron', tube: 0.1 })
      .ball([0.14, 0.14, 0.08], [0, 1.0, 0.07], { color: 'iron' })
      .dome([0.34, 0.24, 0.36], [0, 0.66, 0.15], { color: 'iron', edge: 'soft' })
      .box([0.04, 0.12, 0.04], [0, 0.66, 0.33], { color: 'iron' })
      .act({ click: [[A.par(A.pose('swordL', { rot: [0, 0, -12], dur: 0.15 }), A.pose('swordR', { rot: [0, 0, 12], dur: 0.15 })), A.par(A.pose('swordL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('swordR', { rot: [0, 0, 0], dur: 0.2 }), A.effect('sparkle', { dur: 0.8 }), A.say('CLANG!', 1.2)), A.say('Boom... boom...', 1.5)]] })
      .done();
  }),
  // A warrant on the judge's desk: the paper with its court seal, an inkpad and a rubber stamp that comes down
  // (APPROVED), and a gavel that bangs.
  e('warrant', 'study', 'law', () => {
    const b = m('warrant', { edge: 'sharp' }).box([1.2, 0.05, 0.6], [0, 0.73, 0], { color: 'darkwood' }).box([1.15, 0.7, 0.5], [0, 0.35, -0.02], { color: '#5a3a22' });
    b.box([0.22, 0.004, 0.3], [-0.15, 0.757, 0.05], { color: 'cream', round: 0 }).label('WARRANT', [0.16, 0.035], [-0.15, 0.761, -0.05], { color: 'cream', rot: [-90, 0, 0], depth: 0.002 });
    for (let i = 0; i < 4; i++) b.box([0.15, 0.002, 0.008], [-0.16, 0.76, 0.0 + i * 0.03], { color: 'gray', noInk: true, round: 0 });
    b.cyl([0.06, 0.004, 0.06], [-0.1, 0.761, 0.15], { color: 'gold', noInk: true }).cyl([0.07, 0.004, 0.07], [-0.2, 0.762, 0.14], { color: 'red', noInk: true, name: 'seal', scale: 0 });
    b.box([0.1, 0.02, 0.07], [0.2, 0.765, 0.15], { color: '#2a2726' }).box([0.09, 0.005, 0.06], [0.2, 0.777, 0.15], { color: 'red', noInk: true });
    b.box([0.07, 0.03, 0.05], [-0.2, 0.86, 0.14], { color: '#2a2726', name: 'stamp', mover: { kind: 'slide', axis: 'y', amount: -0.08 } }).cyl([0.03, 0.07, 0.03], [-0.2, 0.91, 0.14], { color: 'darkwood', parent: 'stamp', edge: 'soft' }).ball(0.045, [-0.2, 0.96, 0.14], { color: 'darkwood', parent: 'stamp', edge: 'soft' });
    b.cyl([0.12, 0.03, 0.12], [0.35, 0.77, -0.12], { color: 'darkwood' });
    return b
      .cyl([0.05, 0.12, 0.05], [0.35, 0.82, -0.05], { color: 'darkwood', rot: [90, 0, 0], name: 'gavel', pivot: [0.35, 0.8, -0.32], edge: 'soft' })
      .rod([0.35, 0.82, -0.05], [0.35, 0.8, -0.32], 0.02, 'darkwood', { parent: 'gavel' })
      .act({
        click: [
          [A.operate('stamp', 'down'), A.par(A.pose('seal', { scale: 1, dur: 0.1 }), A.say('Ka-chunk! Approved.', 1.5)), A.operate('stamp', 'up')],
          [A.pose('gavel', { rot: [-25, 0, 0], dur: 0.12, times: 2 }), A.par(A.pose('seal', { scale: 0, dur: 0.1 }), A.say('Bang bang!', 1.2))],
        ],
      })
      .done();
  }),
  // A warranty: a washing machine (0.85 m) with a gold "guaranteed" seal sticker and its warranty card hanging from
  // the door; it rattles and clunks, but it is covered.
  e('warranty', 'study', 'documents', () =>
    m('warranty', { edge: 'sharp' })
      .box([0.6, 0.85, 0.6], [0, 0.425, 0], { color: 'white', round: 0.08 })
      .box([0.6, 0.12, 0.02], [0, 0.79, 0.3], { color: '#dfe8ee' })
      .cyl([0.06, 0.03, 0.06], [0.2, 0.79, 0.31], { color: '#5c6166', rot: [90, 0, 0] })
      .torus([0.42, 0.42, 0.06], [0, 0.42, 0.31], { color: 'silver', tube: 0.18, name: 'door', pivot: [-0.21, 0.42, 0.32], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .cyl([0.32, 0.02, 0.32], [0, 0.42, 0.31], { color: 'glass', rot: [90, 0, 0], parent: 'door' })
      .cyl([0.12, 0.012, 0.12], [-0.18, 0.66, 0.31], { color: 'gold', rot: [90, 0, 0] })
      .star(0.1, [-0.18, 0.66, 0.32], { color: '#f6d24a' })
      .stick([0.16, 0.42, 0.34], [0.2, 0.3, 0.36], 0.004, 'gray', { name: 'tag', pivot: [0.16, 0.42, 0.34], noInk: true, parent: 'door' })
      .box([0.12, 0.08, 0.004], [0.21, 0.26, 0.36], { color: 'white', parent: 'tag' })
      .label('WARRANTY', [0.1, 0.03], [0.21, 0.27, 0.363], { color: 'white', depth: 0.002, parent: 'tag' })
      .act({
        click: [
          [A.par(A.anim('shake'), A.say('Rattle rattle... clunk!', 1.5)), A.pose('tag', { rot: [0, 0, 25], dur: 0.25, times: 2 })],
          [A.operate('door', 'open'), A.say('Ding! Good as new.', 1.5), A.wait(1.5), A.operate('door', 'close')],
        ],
      })
      .done(),
  ),
  // Water: a drop falling into a pool (1 m across) and the crown of the splash it makes, ripples spreading.
  e('water', 'nature', 'elements', () => {
    const b = m('water').cyl([1.0, 0.03, 1.0], [0, 0.015, 0], { color: 'water' });
    for (const d of [0.4, 0.62, 0.84]) b.torus([d, d, 0.02], [0, 0.035, 0], { color: 'skyblue', rot: [90, 0, 0], tube: 0.04, noInk: true });
    b.cyl([0.16, 0.06, 0.16], [0, 0.06, 0], { color: 'skyblue', taper: 1.4 });
    around(8, 0.1).forEach(([x, z]) => b.ball(0.025, [x * 1.1, 0.12, z * 1.1], { color: 'skyblue' }));
    b.capsule([0.05, 0.12, 0.05], [0, 0.14, 0], { color: 'skyblue' }).ball(0.04, [0, 0.24, 0], { color: 'skyblue' });
    return b
      .ball(0.09, [0, 0.42, 0], { color: 'water', name: 'drop' })
      .cone([0.077, 0.085, 0.077], [0, 0.462, 0], { color: 'water', parent: 'drop' })
      .act({ click: [[A.pose('drop', { move: [0, -0.3, 0], dur: 0.4 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Plip!', 1), A.pose('drop', { scale: 0, dur: 0.05 })), A.wait(0.6), A.par(A.pose('drop', { move: [0, 0, 0], dur: 0.01 }), A.pose('drop', { scale: 1, dur: 0.3 }))]] })
      .done();
  }),
  // Webbed feet: a duck (45 cm) standing on its big orange webbed feet; it waddles and paddles them.
  e('webbed feet', 'aviary', 'bird parts', () =>
    withAct(
      lift(bird('webbed feet', { height: 0.42, color: 'white', wing: '#e8e4dc', beak: 'orange', legs: 'orange' }), 0.01, (b) => {
        b.pair((s) => {
          const n = `web${s > 0 ? 'L' : 'R'}`;
          b.wedge([0.1, 0.12, 0.008], [s * 0.04, 0.01, 0.07], { color: 'orange', rot: [-90, 0, 0], name: n, pivot: [s * 0.04, 0.01, 0.02] });
          for (const dx of [-0.045, 0, 0.045]) b.rod([s * 0.04, 0.013, 0.02], [s * 0.04 + dx, 0.013, 0.13], 0.012, '#d9732a', { parent: n });
        });
        return b;
      }),
      { click: [[A.par(A.anim('wobble'), A.say('Quack quack!', 1.5))], [A.par(A.pose('webL', { rot: [-25, 0, 0], dur: 0.2, times: 2 }), A.pose('webR', { rot: [-25, 0, 0], dur: 0.2, times: 2 }), A.say('Flap flap!', 1.2))]] },
    ),
  ),
  // A wedding: the bride in white with her veil and bouquet and the groom in a black suit, under an arch of roses;
  // "I do!", and confetti.
  e('wedding', 'town', 'events', () =>
    withAct(
      troupe('wedding', [
        { f: who('wedding bride', { h: 1.65, skin: 'skin1', hair: '#d9a441', style: 'bun', top: 'white', bottom: 'white', skirt: 'white', shoes: 'white', pose: 'hold', acc: [gown('white'), hat('veil', 'white'), held('bouquet')] }), at: [-0.35, 0], yaw: 15, tag: 'a' },
        { f: who('wedding groom', { h: 1.82, skin: 'skin3', hair: 'darkbrown', style: 'short', top: '#2a2726', bottom: '#2a2726', shoes: 'black', long: true, acc: [wear('suit', '#2a2726'), wear('bowtie', 'black')] }), at: [0.35, 0], yaw: -15, tag: 'b' },
      ], (b) => {
        b.pair((s) => b.cyl([0.12, 2.3, 0.12], [s * 1.0, 1.15, -0.4], { color: 'white' }));
        b.arc([2.24, 1.2, 0.12], [0, 2.3, -0.4], { color: 'white', tube: 0.1 });
        for (let k = 0; k < 11; k++) {
          const a = (k / 10) * Math.PI, x = Math.cos(a) * 1.0, y = 2.3 + Math.sin(a) * 0.55;
          b.ball(0.16, [x, y, -0.34], { color: k % 2 ? 'pink' : 'white' }).ball([0.2, 0.08, 0.1], [x + 0.08, y - 0.06, -0.32], { color: 'leaf' });
        }
        return b;
      }),
      { click: [[A.par(A.pose('ahead', { rot: [0, -20, 0], dur: 0.4 }), A.pose('bhead', { rot: [0, 20, 0], dur: 0.4 }), A.say('I do!', 1.5)), A.effect('hearts', { dur: 1.5 }), A.par(A.pose('ahead', { rot: [0, 0, 0] }), A.pose('bhead', { rot: [0, 0, 0] }))], [A.par(...handUp(['a', 'b']), A.effect('sparkle', { dur: 1.5 }), A.say('Just married!', 1.5)), A.wait(1), A.par(...handUp(['a', 'b'], false))]] },
    ),
  ),
  // A will-o'-the-wisp: a ghostly blue-green light (15 cm) hovering over a tuft of marsh grass; it drifts and
  // flickers.
  e('wisp', 'fantasy', 'spirits', () =>
    m('wisp')
      .dome([0.2, 0.06, 0.16], [0, 0.03, 0], { color: '#5a6b3a' })
      .cone([0.04, 0.12, 0.04], [0.04, 0.09, 0.02], { color: '#7a8a4a' })
      .cone([0.03, 0.1, 0.03], [-0.04, 0.08, -0.01], { color: '#7a8a4a' })
      .ball(0.1, [0, 0.24, 0], { color: '#7af2e0', glow: true, name: 'wisp', mover: { kind: 'light', on: true } })
      .cone([0.07, 0.1, 0.07], [0.01, 0.32, 0], { color: '#bff4ff', glow: true, rot: [0, 0, -10], parent: 'wisp' })
      .ball(0.035, [-0.07, 0.18, 0.02], { color: '#7af2e0', glow: true, parent: 'wisp' })
      .act({ click: [[A.pose('wisp', { move: [0.25, 0.08, 0], dur: 0.8 }), A.operate('wisp', 'off'), A.wait(0.3), A.operate('wisp', 'on'), A.pose('wisp', { move: [0, 0, 0], dur: 0.8 })]] })
      .done(),
  ),
  // Wisteria (2.8 m): a wooden pergola smothered in leaves, long purple flower clusters hanging down; the breeze
  // sways them and petals fall.
  e('wisteria', 'garden', 'trees', () => {
    const b = m('wisteria');
    for (const [x, z] of [[-1.2, 0.8], [1.2, 0.8], [-1.2, -0.8], [1.2, -0.8]]) b.box([0.15, 2.5, 0.15], [x, 1.25, z], { color: 'wood', edge: 'sharp' });
    for (const z of [0.8, -0.8]) b.box([2.9, 0.15, 0.15], [0, 2.55, z], { color: 'wood', edge: 'sharp' });
    for (const x of [-1.0, -0.5, 0, 0.5, 1.0]) b.box([0.1, 0.12, 2.0], [x, 2.68, 0], { color: 'wood', edge: 'sharp' });
    b.rod([-1.2, 0.2, 0.85], [-1.0, 2.5, 0.85], 0.12, 'bark').rod([-1.0, 2.5, 0.85], [0.2, 2.75, 0.5], 0.1, 'bark');
    b.ball([3.0, 0.45, 2.2], [0, 2.85, 0], { color: 'leaf' });
    b.ball(0.02, [0, 2.6, 0], { color: 'leaf', name: 'blooms' });
    for (let i = 0; i < 14; i++) b.cone([0.24, 0.6 + (i % 3) * 0.15, 0.24], [-1.15 + (i % 7) * 0.38, 2.25 - (i % 3) * 0.07, i < 7 ? 0.7 : -0.7], { color: i % 2 ? '#b48ae0' : '#9a6fd0', rot: [180, 0, 0], parent: 'blooms' });
    return b.act({ click: [[A.par(A.pose('blooms', { rot: [0, 0, 3], dur: 0.6, times: 2 }), A.effect('sparkle', { dur: 1.5 }), A.say('Rustle...', 1.2))]] }).done();
  }),
  // A wrist: an anatomical model of a forearm and hand (40 cm) wearing a wristwatch; the hand bends at the wrist and
  // the watch ticks.
  e('wrist', 'clinic', 'body parts', () =>
    m('wrist')
      .cyl([0.14, 0.025, 0.1], [0, 0.0125, 0], { color: 'darkgray', edge: 'sharp' })
      .capsule([0.065, 0.2, 0.055], [0, 0.13, 0], { color: 'skin2' })
      .torus([0.082, 0.07, 0.03], [0, 0.2, 0], { color: '#2a2726', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.045, 0.012, 0.045], [0, 0.2, 0.035], { color: 'gold', rot: [90, 0, 0], edge: 'sharp' })
      .cyl([0.035, 0.006, 0.035], [0, 0.2, 0.042], { color: 'white', rot: [90, 0, 0], noInk: true })
      .box([0.003, 0.014, 0.002], [0, 0.205, 0.046], { color: 'black', noInk: true, name: 'hand' })
      .box([0.1, 0.1, 0.045], [0, 0.28, 0], { color: 'skin2', round: 0.5, name: 'palm', pivot: [0, 0.235, 0] })
      .capsule([0.022, 0.065, 0.022], [-0.035, 0.345, 0], { color: 'skin2', parent: 'palm' })
      .capsule([0.022, 0.075, 0.022], [-0.012, 0.35, 0], { color: 'skin2', parent: 'palm' })
      .capsule([0.022, 0.07, 0.022], [0.012, 0.348, 0], { color: 'skin2', parent: 'palm' })
      .capsule([0.02, 0.055, 0.02], [0.034, 0.338, 0], { color: 'skin2', parent: 'palm' })
      .capsule([0.024, 0.06, 0.024], [0.06, 0.28, 0.01], { color: 'skin2', rot: [0, 0, -40], parent: 'palm' })
      .act({ click: [[A.par(A.pose('palm', { rot: [40, 0, 0], dur: 0.4, times: 2 }), A.pose('hand', { rot: [0, 0, -90], dur: 1 }), A.say('Tick tock.', 1.5))]] })
      .done(),
  ),
  // A yacht club on the waterfront: a white clubhouse with a blue roof and a veranda, pennants on a flagpole, a
  // marina jetty and a 12 m yacht tied up, which sounds its horn and sails out.
  e('yacht club', 'places', 'clubs', () => {
    const b = m('yacht club', { edge: 'sharp' });
    b.box([34, 0.15, 26], [0, 0.075, 0], { color: 'water' }).box([20, 0.6, 10], [-6, 0.3, -7], { color: '#c9c4b8' });
    b.box([12, 6, 7], [-7, 3.6, -8], { color: 'white', round: 0.02 }).pyramid([14, 2.6, 9], [-7, 7.9, -8], 4, { color: '#2f4f8f', rot: [0, 45, 0], taper: 0.4 });
    b.box([12, 0.25, 2.4], [-7, 3.5, -3.3], { color: 'white' }).box([12, 0.9, 0.06], [-7, 4.1, -2.2], { color: 'white' });
    for (let i = 0; i < 6; i++) b.cyl([0.18, 3.0, 0.18], [-12.5 + i * 2.2, 2.0, -2.3], { color: 'white', edge: 'soft' });
    b.label('YACHT CLUB', [5, 0.7], [-7, 5.6, -4.45], { color: '#2f4f8f' });
    door(b, -7, -4.5, { w: 1.4, h: 2.4, y: 0.6, color: '#2f4f8f', glass: true });
    for (const x of [-11, -9, -5, -3]) win(b, x, 2.0, -4.5, 1.3, 1.5, '#2f4f8f');
    b.stick([1, 0.6, -5], [1, 11, -5], 0.15, 'white').box([1.6, 0.9, 0.04], [1.85, 10.4, -5], { color: 'red', name: 'flag', pivot: [1, 10.4, -5] }).box([2.4, 0.05, 0.05], [1, 8.5, -5], { color: 'white' });
    b.box([2, 0.3, 14], [4, 0.45, 2], { color: 'wood' });
    for (const z of [-4, 0, 4, 8]) for (const x of [3.1, 4.9]) b.stick([x, 0, z], [x, 0.7, z], 0.2, 'darkwood');
    b.loft([4, 2.2, 13], [9, 1.1, 3], [[0, 0.7, 0.8, 0.15], [0.35, 1, 1, 0], [0.8, 0.85, 1, 0], [1, 0.05, 1, 0.1]], { color: 'white', cut: 'bottom', boxy: 0.3, name: 'yacht', edge: 'soft' })
      .box([3.0, 0.8, 5], [9, 2.4, 2], { color: 'white', parent: 'yacht', round: 0.3 })
      .box([3.02, 0.3, 4], [9, 2.5, 2.2], { color: '#2f3d52', parent: 'yacht' })
      .stick([9, 2.2, 4.5], [9, 16, 4.5], 0.2, 'silver', { parent: 'yacht' })
      .wedge([0.06, 12, 6], [9, 9, 1.4], { color: 'white', apex: 0.5, rot: [0, 90, 0], parent: 'yacht' });
    return b
      .socket('seat', [9, 2.1, -2.5], 'seat', { part: 'yacht' })
      .act({
        click: [
          [A.par(A.say('Toot toot!', 1.5), A.pose('flag', { rot: [0, 30, 0], dur: 0.3, times: 3 }))],
          [A.pose('yacht', { move: [0, 0, 9], dur: 3 }), A.effect('water_spray', { dur: 1 }), A.pose('yacht', { move: [0, 0, 0], dur: 3 })],
        ],
      })
      .done();
  }),
  // You: a person pointing straight out at you.
  e('you', 'ideas', 'sayings', () => {
    const f = who('you', { h: 1.78, top: '#e0473b', bottom: '#3d4f7a', shoes: 'black', style: 'short', hair: '#2a1d16', skin: 'skin2' });
    return withAct(measure({ ...f, parts: f.parts.map((p) => (p.name === 'armR' ? { ...p, rot: [-88, 0, -8] as Vec3 } : p)) }), {
      click: [[A.par(A.anim('point'), A.say('Yes, YOU!', 1.5))], [A.par(A.anim('wink'), A.say("You're awesome.", 1.5))]],
    });
  }),
  // Zero: a big round 0 (1 m) on its plinth with nothing to count; it rolls round on the spot.
  e('zero', 'ideas', 'numbers', () => counter('zero', '0', 0, 'teal', 'white', COUNT).act({ click: [[A.par(A.anim('spin'), A.say('Zero! Nothing at all.', 2))]] }).done()),
];
