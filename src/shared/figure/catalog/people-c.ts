/**
 * Catalog chunk people-c: the words in assign/people-c.tsv. Nearly all people, at their real size (an adult about
 * 1.7 m), each in a rest pose that fits the job, holding the tools of it, and with an act: a gesture and a line
 * that match each other and the person, and props that appear and go again. People are soft (they melt into one
 * cel body); the hard things they carry (signs, cases, carts, boards, pianos) are sharp.
 */
import { e, type CatalogEntry } from './types';
import { A, m, withAct, withSockets } from '../dsl';
import { ani, beast, body, face, hat, held, wear, who, type Extra } from '../accessories';
import { Parts, figure } from '../kit';
import { col } from '../colors';
import { apply, measure, solve } from '../math';
import type { FigPart, Figure, Vec3 } from '../types';
import type { Step } from '../../schema';

/* ----- local helpers: small custom props on a person ----- */

type Sh = FigPart['shape'];
type O = Partial<FigPart>;
const R2D = 180 / Math.PI;
/** One part on joint j ('' = the figure root); `at` in the joint's frame, metres. Names stay stable per build. */
const put = (p: Parts, j: string, shape: Sh, size: Vec3, at: Vec3, color: string, o: O = {}) =>
  p.add({ name: `x${p.list.length}`, parent: j || undefined, shape, size, at, color: col(color), layer: 4, ...o });
const k3 = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
/** A part on joint j, size and position in arm widths (about 10 cm on an adult). Torso: y 0 waist .. 7 shoulders,
 *  front at z 1.1. Hand: the fist is at the origin, +z forward. Hips: origin at the hip joint. */
const bit = (j: string, shape: Sh, size: Vec3, at: Vec3, color: string, o: O = {}): Extra => (p, d) => put(p, j, shape, k3(size, d.aw), k3(at, d.aw), color, o);
/** A part on the head, in head widths, y from the head's centre (top at 0.54, face front at z 0.48). */
const hb = (shape: Sh, size: Vec3, at: Vec3, color: string, o: O = {}): Extra => (p, d) =>
  put(p, 'head', shape, k3(size, d.headW), [at[0] * d.headW, d.headY + at[1] * d.headW, at[2] * d.headW], color, o);
/** A rod between two points on joint j, in metres. */
const rodM = (p: Parts, j: string, a: Vec3, b: Vec3, t: number, color: string, o: O = {}) => {
  const dv: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...dv) || 1e-3;
  const rx = Math.atan2(dv[2] / len, dv[1] / len) * R2D, rz = -Math.asin(Math.max(-1, Math.min(1, dv[0] / len))) * R2D;
  put(p, j, 'capsule', [t, len + t, t], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], color, { srot: [rx, 0, rz], ...o });
};
/** A rod between two points on joint j, in arm widths. */
const seg = (j: string, a: Vec3, b: Vec3, t: number, color: string, o: O = {}): Extra => (p, d) => rodM(p, j, k3(a, d.aw), k3(b, d.aw), t * d.aw, color, o);
/** A named part on joint j with its pivot (a lid's hinge, a sign's pole), in arm widths. */
const pivoted = (j: string, shape: Sh, size: Vec3, at: Vec3, pivot: Vec3, color: string, o: O = {}): Extra => (p, d) =>
  put(p, j, shape, k3(size, d.aw), k3(pivot, d.aw), color, { off: k3([at[0] - pivot[0], at[1] - pivot[1], at[2] - pivot[2]], d.aw), ...o });
const all = (...xs: Extra[]): Extra => (p, d) => xs.forEach((x) => x(p, d));
/** A printed card on the chest (numbers, letters, slogans). */
const chest = (text: string, color: string, w = 2.2, h = 1.2, y = 5): Extra => bit('torso', 'box', [w, h, 0.15], [0, y, 1.12], color, { role: 'label', text, round: 0.1 });
/** Shirt and tie showing in the V of a jacket (the jacket is the top colour). */
const front = (tie = 'red', shirt = 'white'): Extra => (p, d) => {
  put(p, 'torso', 'box', [d.tw * 0.28, d.torsoH * 0.5, d.td * 0.1], [0, d.torsoH * 0.72, d.td * 0.52], shirt, { layer: 3 });
  if (tie) put(p, 'torso', 'box', [d.tw * 0.09, d.torsoH * 0.44, d.td * 0.08], [0, d.torsoH * 0.66, d.td * 0.58], tie, { round: 0.4 });
};
const tux = (tails = 'black'): Extra => all(front('', 'white'), wear('bowtie'), bit('hips', 'box', [2.4, 3.6, 0.3], [0, -1.6, -1.15], tails));
/** Stripes around the torso. */
const bands = (c: string, n = 4): Extra => (p, d) => {
  for (let i = 0; i < n; i++) put(p, 'torso', 'cyl', [d.tw * 1.1, d.torsoH * 0.07, d.td * 1.2], [0, d.torsoH * (0.12 + (0.76 * i) / (n - 1)), 0], c, { noInk: true, layer: 3 });
};
/** A white collar at the throat: priest (small), pilgrim (wide). */
const collar = (w = 0.6, c = 'white'): Extra => bit('torso', 'box', [w, 0.45, 0.25], [0, 6.85, 1.0], c, { round: 0.3 });
const fedora = (c: string, band = 'black'): Extra => all(
  hb('cyl', [1.6, 0.05, 1.5], [0, 0.5, 0], c), hb('cyl', [0.88, 0.38, 0.82], [0, 0.7, 0], c, { taper: 0.8 }), hb('cyl', [0.9, 0.09, 0.84], [0, 0.56, 0], band));
const skullcap = (c: string): Extra => hb('ball', [1.1, 0.62, 1.06], [0, 0.32, -0.02], c);
/** A thin stick held in a fist, pointing up (+) or down (-) by len arm widths. */
const stickUp = (side: 'L' | 'R', len: number, c: string, t = 0.3): Extra => bit(`hand${side}`, 'capsule', [t, Math.abs(len), t], [0, len / 2, 0.4], c);
/** A crook (shepherd, pharaoh): a pole with a hook on top. */
const crook = (side: 'L' | 'R', len: number, c: string): Extra => all(stickUp(side, len, c), bit(`hand${side}`, 'torus', [1.8, 1.8, 0.3], [0.65, len + 0.6, 0.4], c, { tube: 0.25 }));
/** A sign on a pole with printed text. */
const placard = (text: string, c = 'white', side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'capsule', [0.32, 14, 0.32], [0, 3.5, 0.4], 'wood'), bit(`hand${side}`, 'box', [6.5, 3.6, 0.2], [0, 10.5, 0.55], c, { role: 'label', text, round: 0.1 }));
const teddy = (side: 'L' | 'R' = 'L', c = '#a8743f'): Extra => all(
  bit(`hand${side}`, 'ball', [1.8, 2, 1.5], [0, -0.8, 1.3], c), bit(`hand${side}`, 'ball', [1.4, 1.3, 1.3], [0, 0.6, 1.4], c),
  bit(`hand${side}`, 'ball', [0.55, 0.55, 0.4], [0.55, 1.2, 1.35], c), bit(`hand${side}`, 'ball', [0.55, 0.55, 0.4], [-0.55, 1.2, 1.35], c),
  bit(`hand${side}`, 'ball', [0.6, 0.45, 0.4], [0, 0.45, 2.05], 'cream'));
const pills = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'cyl', [1.0, 1.4, 1.0], [0, -0.2, 1.1], 'orange'), bit(`hand${side}`, 'cyl', [1.1, 0.45, 1.1], [0, 0.7, 1.1], 'white'));
const mirror = (side: 'L' | 'R' = 'L'): Extra => all(stickUp(side, 1.4, 'pink'), bit(`hand${side}`, 'torus', [1.9, 1.9, 0.35], [0, 2.2, 0.4], 'pink', { tube: 0.2 }), bit(`hand${side}`, 'cyl', [1.6, 0.1, 1.6], [0, 2.2, 0.4], 'glass', { srot: [90, 0, 0] }));
const plunger = (side: 'L' | 'R' = 'L'): Extra => all(stickUp(side, -5, 'wood'), bit(`hand${side}`, 'cyl', [1.5, 0.9, 1.5], [0, -5.2, 0.4], 'red', { taper: 0.45 }));
/** A rat sitting by the feet. */
const rat: Extra = all(bit('', 'ball', [1.0, 0.8, 1.5], [3.4, 0.45, 1.4], 'gray'), bit('', 'ball', [0.7, 0.65, 0.8], [3.4, 0.6, 2.35], 'gray'),
  bit('', 'ball', [0.35, 0.35, 0.12], [3.65, 0.95, 2.2], 'pink'), bit('', 'ball', [0.35, 0.35, 0.12], [3.15, 0.95, 2.2], 'pink'), seg('', [3.4, 0.3, 0.7], [3.9, 0.15, -0.6], 0.15, 'pink'));
/** A flute or pipe held to the mouth. */
const pipe = (c = 'wood', len = 1.0): Extra => hb('capsule', [0.08, len, 0.08], [0.1, -0.42, 0.48 + len * 0.42], c, { srot: [-62, 0, 0] });
const satchel = (c = 'brown'): Extra => all(bit('hips', 'box', [2.0, 1.7, 0.8], [-1.1, 0.4, 1.35], c), wear('sash', c));
const cross = (c = 'gold', y = 4.8): Extra => all(bit('torso', 'box', [0.28, 1.1, 0.15], [0, y, 1.12], c), bit('torso', 'box', [0.75, 0.28, 0.15], [0, y + 0.25, 1.14], c));
const ballChain: Extra = all(bit('', 'ball', [2.4, 2.4, 2.4], [3.2, 1.2, 1.4], 'black'), seg('', [2.4, 0.8, 1.2], [1.0, 0.6, 0.4], 0.25, 'gray'));
const xray = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [3.6, 4.4, 0.12], [0, 1.2, 1.2], '#1d2a44'), bit(`hand${side}`, 'capsule', [0.3, 3.2, 0.1], [0, 1.2, 1.3], 'white', { noInk: true }),
  ...[2.4, 1.7, 1.0, 0.3].map((y) => bit(`hand${side}`, 'capsule', [0.2, 2.4 - Math.abs(y - 1.3) * 0.4, 0.1], [0, y, 1.3], 'white', { noInk: true, srot: [0, 0, 90] })));
const laptop = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [3.4, 0.25, 2.4], [0, -0.3, 1.4], 'darkgray'), bit(`hand${side}`, 'box', [3.4, 2.3, 0.2], [0, 0.8, 0.25], 'silver', { srot: [-12, 0, 0] }),
  bit(`hand${side}`, 'ball', [0.6, 0.6, 0.1], [0, 0.85, 0.37], 'white', { noInk: true }));
const hoodDown = (c: string): Extra => all(bit('torso', 'ball', [2.7, 1.3, 1.3], [0, 6.8, -1.0], c), bit('torso', 'box', [2.2, 1.1, 0.25], [0, 1.6, 1.05], c), bit('torso', 'capsule', [0.12, 1.2, 0.12], [0.4, 6.0, 1.15], 'white'), bit('torso', 'capsule', [0.12, 1.2, 0.12], [-0.4, 6.0, 1.15], 'white'));
const shoulderSpikes = (c = 'silver'): Extra => all(...[-1, 1].flatMap((s) => [0.4, 1.0].map((x) => bit('torso', 'cyl', [0.35, 0.6, 0.35], [s * (1.5 + x * 0.6), 7.2, 0], c, { taper: 0 }))));
const walkie = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [0.9, 1.8, 0.6], [0, 0.2, 0.9], 'black'), bit(`hand${side}`, 'capsule', [0.15, 1.0, 0.15], [0.25, 1.5, 0.9], 'black'));
const helmetHeld = (c: string, side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'ball', [2.6, 2.6, 2.6], [0, -0.6, 1.3], c), bit(`hand${side}`, 'ball', [1.8, 0.9, 0.6], [0, -0.4, 2.4], '#2b3f66'));
const usflag = (side: 'L' | 'R' = 'R'): Extra => all(held('flag', 'white', side), ...[0, 1, 2].map((i) => bit(`hand${side}`, 'box', [5, 0.5, 0.15], [2.6, 10.3 - i * 1.05, 0.35], 'red', { noInk: true })),
  bit(`hand${side}`, 'box', [2.2, 1.6, 0.2], [1.3, 10.0, 0.37], 'navy', { noInk: true }));
const shell = (c = 'pink'): Extra => all(bit('torso', 'ball', [1.3, 1.1, 0.5], [0.75, 5.6, 1.0], c), bit('torso', 'ball', [1.3, 1.1, 0.5], [-0.75, 5.6, 1.0], c));
const leaves = (c = 'leaf', n = 6): Extra => all(...Array.from({ length: n }, (_, i) => bit(i % 2 ? 'torso' : 'hips', 'ball', [1.1, 0.5, 0.7], [(i % 3 - 1) * 1.3, i % 2 ? 6.6 - i * 0.4 : 0.3, 1.0], c, { srot: [0, 0, (i % 3 - 1) * 35] })));
const tricorn = (c = 'black'): Extra => all(hb('cyl', [1.6, 0.3, 1.5], [0, 0.6, 0], c, { segs: 3, taper: 0.8, srot: [0, 180, 0] }), hb('ball', [0.85, 0.42, 0.8], [0, 0.66, 0], c));
const sailorHat: Extra = all(hb('cyl', [0.95, 0.3, 0.9], [0, 0.58, 0], 'white'), hb('torus', [1.02, 0.97, 0.16], [0, 0.48, 0], 'white', { srot: [90, 0, 0], tube: 0.3 }));
const flask = (side: 'L' | 'R', liquid = 'lime'): Extra => all(bit(`hand${side}`, 'cyl', [2.1, 2.0, 2.1], [0, 0.4, 1.4], 'glass', { taper: 0.35 }), bit(`hand${side}`, 'cyl', [1.9, 1.0, 1.9], [0, -0.1, 1.4], liquid, { taper: 0.65, role: 'glow' }), bit(`hand${side}`, 'cyl', [0.7, 1.2, 0.7], [0, 1.9, 1.4], 'glass'));
const tube = (side: 'L' | 'R', liquid = 'cyan'): Extra => all(bit(`hand${side}`, 'capsule', [0.7, 3.0, 0.7], [0, 1.0, 0.9], 'glass'), bit(`hand${side}`, 'capsule', [0.6, 1.5, 0.6], [0, 0.3, 0.9], liquid, { role: 'glow' }));
const kneepads = (c = 'black'): Extra => all(bit('shinL', 'ball', [1.4, 1.2, 1.0], [0, -0.2, 0.45], c), bit('shinR', 'ball', [1.4, 1.2, 1.0], [0, -0.2, 0.45], c));
/** Roller skates: boots with four wheels each (lift the figure by 0.11 m on an adult). */
const skates = (c = 'pink'): Extra => all(...['L', 'R'].flatMap((s) => [bit(`foot${s}`, 'box', [1.8, 1.6, 2.7], [0, -0.1, 0.45], 'white'), bit(`foot${s}`, 'box', [1.2, 0.3, 2.6], [0, -0.95, 0.45], 'gray'),
  ...[[0.55, 1.2], [-0.55, 1.2], [0.55, -0.3], [-0.55, -0.3]].map(([x, z]) => bit(`foot${s}`, 'cyl', [0.8, 0.45, 0.8], [x, -1.45, z], c, { srot: [0, 0, 90] }))]));
const skis = (c = 'blue'): Extra => all(...['L', 'R'].flatMap((s) => [bit(`foot${s}`, 'box', [1.1, 0.25, 9], [0, -0.92, 1.0], c), bit(`foot${s}`, 'ball', [1.1, 0.6, 0.8], [0, -0.65, 5.4], c)]));
const poles: Extra = all(...['L', 'R'].flatMap((s) => [bit(`hand${s}`, 'capsule', [0.2, 7.5, 0.2], [0, -3.4, 0.4], 'silver'), bit(`hand${s}`, 'torus', [0.9, 0.9, 0.15], [0, -6.4, 0.4], 'black', { srot: [90, 0, 0] })]));
const flippers = (c = 'yellow'): Extra => all(...['L', 'R'].map((s) => bit(`foot${s}`, 'box', [2.0, 0.3, 4.4], [0, -0.75, 1.8], c)));
const armRings = (c: string, n = 2): Extra => all(...['L', 'R'].flatMap((s) => Array.from({ length: n }, (_, i) => bit(`arm${s}`, 'torus', [1.25, 1.25, 0.3], [0, -0.9 - i * 0.45, 0], c, { srot: [90, 0, 0], tube: 0.25 }))));
const gloves = (c: string): Extra => all(bit('handL', 'ball', [1.35, 1.45, 1.1], [0, -0.25, 0], c), bit('handR', 'ball', [1.35, 1.45, 1.1], [0, -0.25, 0], c));
const ruff = (c = 'white'): Extra => all(bit('torso', 'cyl', [4.0, 0.7, 3.4], [0, 7.0, 0.15], c), bit('torso', 'cyl', [3.6, 0.3, 3.0], [0, 7.4, 0.15], c, { noInk: true }));
const quill = (side: 'L' | 'R' = 'R'): Extra => bit(`hand${side}`, 'capsule', [0.55, 3.0, 0.12], [0.3, 1.4, 0.7], 'white', { srot: [-15, 0, -15] });
const starBadge = (c = 'gold', x = 0.9): Extra => bit('torso', 'cyl', [0.95, 0.25, 0.95], [x, 5.2, 1.25], c, { segs: 5, srot: [90, 0, 0] });
const buttons = (c = 'gold'): Extra => all(...[0, 1, 2].flatMap((i) => [0.55, -0.55].map((x) => bit('torso', 'ball', [0.3, 0.3, 0.2], [x, 2.2 + i * 1.3, 1.12], c))));
const telescope = (side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [0.5, 3.0, 0.5], [0, 0.6, 1.4], 'brass', { srot: [70, 0, 0] }), bit(`hand${side}`, 'cyl', [0.7, 1.4, 0.7], [0, 1.0, 2.9], 'darkbrown', { srot: [70, 0, 0] }));
const shoeHeld = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [1.2, 1.0, 2.4], [0, -0.6, 1.4], 'darkbrown', { round: 0.6 }), bit(`hand${side}`, 'box', [1.25, 0.25, 2.5], [0, -1.15, 1.4], 'black'));
const chisel = (side: 'L' | 'R' = 'L'): Extra => bit(`hand${side}`, 'capsule', [0.3, 2.2, 0.3], [0, 0.9, 0.6], 'silver', { srot: [30, 0, 0] });
const earpiece: Extra = hb('capsule', [0.05, 0.32, 0.05], [-0.52, -0.15, 0.05], 'black');
const kabuto = (c = 'black'): Extra => all(hat('helmet', c), hb('cyl', [1.45, 0.4, 1.35], [0, 0.18, -0.12], c, { taper: 0.75 }), hb('capsule', [0.08, 0.65, 0.05], [0.2, 0.9, 0.42], 'gold', { srot: [0, 0, -28] }),
  hb('capsule', [0.08, 0.65, 0.05], [-0.2, 0.9, 0.42], 'gold', { srot: [0, 0, 28] }), hb('ball', [0.16, 0.16, 0.08], [0, 0.62, 0.5], 'gold'));
const sideHair = (c: string): Extra => all(hb('ball', [0.3, 0.55, 0.7], [0.45, -0.02, -0.12], c), hb('ball', [0.3, 0.55, 0.7], [-0.45, -0.02, -0.12], c), hb('ball', [0.85, 0.5, 0.35], [0, 0.0, -0.4], c));
const plumes = (cs = ['pink', 'white']): Extra => all(hb('torus', [1.04, 0.98, 0.14], [0, 0.32, 0], 'gold', { srot: [90, 0, 0], tube: 0.3 }),
  ...[-2, -1, 0, 1, 2].map((i) => hb('capsule', [0.2, 1.2, 0.12], [Math.sin(i * 0.4) * 0.6, 0.55 + Math.cos(i * 0.4) * 0.6, -0.12], cs[Math.abs(i) % cs.length], { srot: [0, 0, -i * 23] })));
const fan = (side: 'L' | 'R', c = 'pink'): Extra => bit(`hand${side}`, 'cyl', [4.0, 0.2, 2.6], [0, 1.4, 0.8], c, { srot: [90, 0, 0], segs: 7 });
const lyre = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'capsule', [0.3, 2.6, 0.3], [0.75, 1.3, 0.9], 'gold', { srot: [0, 0, -12] }), bit(`hand${side}`, 'capsule', [0.3, 2.6, 0.3], [-0.75, 1.3, 0.9], 'gold', { srot: [0, 0, 12] }),
  bit(`hand${side}`, 'capsule', [0.25, 2.2, 0.25], [0, 2.5, 0.9], 'gold', { srot: [0, 0, 90] }), bit(`hand${side}`, 'ball', [1.2, 0.6, 0.6], [0, 0.1, 0.9], 'gold'),
  ...[-0.3, 0, 0.3].map((x) => bit(`hand${side}`, 'capsule', [0.06, 2.1, 0.06], [x, 1.35, 0.9], 'white', { noInk: true })));
/** A parachute canopy above, lines to the shoulders. */
const canopy = (c = 'red', stripe = 'yellow'): Extra => (p, d) => {
  const yc = d.torsoH + d.headH * 1.2 + 0.9;
  put(p, 'torso', 'ball', [2.6, 0.9, 1.7], [0, yc, 0], c);
  put(p, 'torso', 'ball', [0.9, 0.93, 1.74], [0, yc, 0], stripe, { noInk: true });
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) rodM(p, 'torso', [sx * d.tw * 0.45, d.torsoH, 0], [sx * 1.15, yc - 0.15, sz * 0.5], 0.012, 'white');
};
const bust: Extra = all(bit('', 'box', [2.4, 6, 2.4], [4.2, 3, 0.8], 'stone'), bit('', 'ball', [2.4, 1.2, 1.4], [4.2, 6.6, 0.8], 'white'), bit('', 'ball', [1.6, 1.9, 1.6], [4.2, 8.0, 0.8], 'white'));
const gourdPipe: Extra = all(pipe('tan', 0.9), hb('ball', [0.32, 0.32, 0.42], [0.1, -0.66, 1.2], 'tan'));
const sax: Extra = all(seg('torso', [0.5, 5.4, 1.8], [0.7, 1.9, 2.0], 0.85, 'brass'), bit('torso', 'ball', [1.1, 1.1, 1.1], [0.75, 1.6, 2.3], 'brass'),
  bit('torso', 'cyl', [1.5, 2.0, 1.5], [1.05, 2.6, 2.8], 'brass', { taper: 1.7, srot: [-25, 0, -10] }), seg('torso', [0.5, 5.4, 1.7], [0.1, 7.9, 1.95], 0.3, 'brass'));
const sack = (c = '#8a5a2b'): Extra => all(bit('torso', 'ball', [3.6, 4.2, 3.0], [0.6, 6.0, -2.4], c), bit('torso', 'ball', [1.0, 0.8, 1.0], [0.4, 8.2, -2.3], c));
const agal: Extra = hb('torus', [1.04, 0.97, 0.1], [0, 0.42, -0.06], 'black', { srot: [90, 0, 0], tube: 0.14 });
const starDots = (c = 'yellow'): Extra => all(...[[0.8, 5.5], [-0.9, 3.8], [0.5, 1.8]].map(([x, y]) => bit('torso', 'cyl', [0.6, 0.15, 0.6], [x, y, 1.12], c, { segs: 5, srot: [90, 0, 0], noInk: true })),
  ...[[1.2, -1.5, 1.45], [-1.0, -3.0, 1.55], [0.6, -4.5, 1.65]].map(([x, y, z]) => bit('hips', 'cyl', [0.6, 0.15, 0.6], [x, y, z], c, { segs: 5, srot: [90, 0, 0], noInk: true })));
const rifle = (c = 'darkgray', scope = false): Extra => all(seg('torso', [-2.4, 1.2, 1.7], [2.0, 6.6, 1.7], 0.5, c), seg('torso', [-2.6, 0.9, 1.7], [-1.5, 2.3, 1.7], 0.9, c === 'black' ? 'black' : 'darkwood'),
  ...(scope ? [seg('torso', [0.2, 4.6, 2.2], [1.0, 5.6, 2.2], 0.45, 'black')] : []));
const mittens = (c: string): Extra => gloves(c);
const mitt = (side: 'L' | 'R' = 'L', c = 'brown'): Extra => bit(`hand${side}`, 'ball', [1.9, 2.2, 1.2], [0, 0.2, 0.3], c);
const nightVision: Extra = all(hb('cyl', [0.14, 0.25, 0.14], [0.12, 0.38, 0.5], 'black', { srot: [90, 0, 0] }), hb('cyl', [0.14, 0.25, 0.14], [-0.12, 0.38, 0.5], 'black', { srot: [90, 0, 0] }));
const foamFinger = (side: 'L' | 'R', c = 'yellow'): Extra => all(bit(`hand${side}`, 'box', [2.0, 2.2, 0.9], [0, 1.2, 0.5], c, { role: 'label', text: '#1', round: 0.4 }), bit(`hand${side}`, 'capsule', [0.75, 2.4, 0.75], [0.4, 3.3, 0.5], c));
const binoculars = (side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [0.8, 1.5, 0.8], [0.45, 0.3, 1.3], 'black', { srot: [90, 0, 0] }), bit(`hand${side}`, 'cyl', [0.8, 1.5, 0.8], [-0.45, 0.3, 1.3], 'black', { srot: [90, 0, 0] }));
const clutch = (side: 'L' | 'R' = 'L', c = 'red'): Extra => bit(`hand${side}`, 'box', [1.8, 1.0, 0.5], [0, -0.3, 0.9], c, { round: 0.5 });
const cardText = (side: 'L' | 'R', text: string, c = 'white'): Extra => bit(`hand${side}`, 'box', [2.6, 1.8, 0.12], [0, 1.0, 0.8], c, { role: 'label', text, round: 0.1 });
const braces = (c = 'red'): Extra => all(bit('torso', 'box', [0.3, 6.8, 0.2], [0.8, 3.6, 1.1], c), bit('torso', 'box', [0.3, 6.8, 0.2], [-0.8, 3.6, 1.1], c));
const dumbbell = (side: 'L' | 'R'): Extra => all(bit(`hand${side}`, 'capsule', [0.4, 4.0, 0.4], [0, -0.2, 0.3], 'iron', { srot: [90, 0, 0] }), bit(`hand${side}`, 'ball', [2.2, 2.2, 2.2], [0, -0.2, 2.2], 'black'), bit(`hand${side}`, 'ball', [2.2, 2.2, 2.2], [0, -0.2, -1.6], 'black'));
const plume = (c = 'white', gem = 'red'): Extra => all(hb('ball', [0.16, 0.16, 0.1], [0, 0.45, 0.6], gem), hb('capsule', [0.12, 0.6, 0.08], [0.05, 0.8, 0.5], c, { srot: [0, 0, -15] }));
const mawashi = (c = 'navy'): Extra => all(bit('hips', 'cyl', [3.9, 1.6, 2.7], [0, 0.1, 0], c), bit('hips', 'box', [1.2, 1.8, 0.3], [0, -1.0, 1.35], c));
const towel = (side: 'L' | 'R', c = 'cyan'): Extra => all(bit(`hand${side}`, 'box', [2.6, 3.6, 0.3], [0, -1.2, 0.8], c), bit(`hand${side}`, 'box', [2.65, 0.5, 0.32], [0, -1.6, 0.8], 'white', { noInk: true }));
const curl = (c = 'black'): Extra => hb('capsule', [0.07, 0.22, 0.07], [0.05, 0.38, 0.47], c, { srot: [0, 0, 30] });
const taps: Extra = all(bit('footL', 'box', [1.6, 0.2, 2.5], [0, -0.85, 0.45], 'silver'), bit('footR', 'box', [1.6, 0.2, 2.5], [0, -0.85, 0.45], 'silver'));
const apple = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'ball', [1.3, 1.2, 1.3], [0, 0.2, 0.9], 'red'), bit(`hand${side}`, 'capsule', [0.15, 0.5, 0.15], [0, 0.95, 0.9], 'darkbrown'));
const smallBall = (side: 'L' | 'R', c = '#d8f04a'): Extra => bit(`hand${side}`, 'ball', [0.75, 0.75, 0.75], [0, 0.1, 0.8], c);
const mjolnir = (side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'capsule', [0.45, 2.6, 0.45], [0, -1.0, 0.5], 'leather'), bit(`hand${side}`, 'box', [1.6, 1.4, 2.6], [0, -2.6, 0.5], 'steel', { round: 0.15 }));
const discs = (c = 'silver'): Extra => all(...[[0.8, 5.6], [-0.8, 5.6], [0.8, 4.2], [-0.8, 4.2]].map(([x, y]) => bit('torso', 'cyl', [0.8, 0.25, 0.8], [x, y, 1.12], c, { srot: [90, 0, 0] })));
const sphinxHead: NonNullable<Parameters<typeof beast>[1]['acc']>[number] = (p, d) => {
  const [hl, hh, hw] = d.head;
  put(p, 'head', 'ball', [hw * 1.18, hh * 0.62, hl * 1.1], [0, hh * 0.5, hl * 0.02], 'gold');
  for (const s of [1, -1]) {
    put(p, 'head', 'box', [hw * 0.3, hh * 1.0, hl * 0.25], [s * hw * 0.5, -hh * 0.1, hl * 0.12], 'gold');
    for (const y of [0.05, -0.3]) put(p, 'head', 'box', [hw * 0.32, hh * 0.09, hl * 0.27], [s * hw * 0.5, hh * y, hl * 0.12], 'blue');
  }
  put(p, 'head', 'capsule', [hw * 0.12, hh * 0.35, hw * 0.12], [0, -hh * 0.45, hl * 0.45], 'blue');
};
type Side = 'L' | 'R';
const browGoggles: Extra = all(hat('headband', 'darkbrown'), hb('torus', [0.3, 0.3, 0.12], [0.17, 0.32, 0.45], 'brass', { tube: 0.3 }), hb('torus', [0.3, 0.3, 0.12], [-0.17, 0.32, 0.45], 'brass', { tube: 0.3 }));
const pocketWatch = (side: Side = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [1.4, 0.35, 1.4], [0, 0.3, 0.9], 'gold', { srot: [90, 0, 0] }), bit(`hand${side}`, 'cyl', [1.15, 0.37, 1.15], [0, 0.3, 0.92], 'cream', { srot: [90, 0, 0], role: 'glow' }));
const hourglass = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'cyl', [1.2, 1.1, 1.2], [0, 1.25, 0.9], 'glass', { taper: 0.1, srot: [180, 0, 0] }), bit(`hand${side}`, 'cyl', [1.2, 1.1, 1.2], [0, 0.15, 0.9], 'glass', { taper: 0.1 }),
  bit(`hand${side}`, 'cyl', [1.0, 0.5, 1.0], [0, -0.15, 0.9], 'sand', { taper: 0.4 }), bit(`hand${side}`, 'cyl', [1.5, 0.25, 1.5], [0, 1.9, 0.9], 'wood'), bit(`hand${side}`, 'cyl', [1.5, 0.25, 1.5], [0, -0.5, 0.9], 'wood'));
const toothHeld = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'box', [0.9, 0.8, 0.8], [0, 0.8, 0.8], 'white', { round: 0.8 }), bit(`hand${side}`, 'capsule', [0.3, 0.7, 0.3], [0.22, 0.3, 0.8], 'white'), bit(`hand${side}`, 'capsule', [0.3, 0.7, 0.3], [-0.22, 0.3, 0.8], 'white'));
const flowerDots = (cs = ['pink', 'yellow', 'white']): Extra => all(...[[0.9, 6.0], [-0.7, 5.2], [0.4, 3.8], [-1.1, 2.6], [1.0, 1.6], [-0.2, 0.8]].map(([x, y], i) => bit('torso', 'ball', [0.65, 0.65, 0.2], [x, y, 1.1], cs[i % cs.length], { noInk: true })));
const furCrown: Extra = all(hb('cyl', [1.14, 0.3, 1.08], [0, 0.42, 0], '#6b4a2a'), hb('ball', [0.92, 0.62, 0.86], [0, 0.6, 0], 'gold'), hb('capsule', [0.07, 0.35, 0.07], [0, 1.0, 0], 'gold'), hb('capsule', [0.07, 0.2, 0.07], [0, 1.05, 0], 'gold', { srot: [0, 0, 90] }));
const orb = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'ball', [1.5, 1.5, 1.5], [0, 0.6, 0.9], 'gold'), bit(`hand${side}`, 'capsule', [0.25, 0.9, 0.25], [0, 1.6, 0.9], 'gold'));
const cage: Extra = all(...[0.16, -0.04, -0.24].map((y) => hb('capsule', [0.05, 0.62, 0.05], [0, y, 0.56], 'black', { srot: [0, 0, 90] })), hb('capsule', [0.05, 0.5, 0.05], [0.16, -0.04, 0.54], 'black'), hb('capsule', [0.05, 0.5, 0.05], [-0.16, -0.04, 0.54], 'black'));
const heartHeld = (side: Side = 'R', c = 'red'): Extra => all(bit(`hand${side}`, 'ball', [1.7, 1.7, 0.8], [0.6, 1.9, 0.9], c), bit(`hand${side}`, 'ball', [1.7, 1.7, 0.8], [-0.6, 1.9, 0.9], c), bit(`hand${side}`, 'cyl', [2.4, 1.9, 0.8], [0, 0.95, 0.9], c, { taper: 0, segs: 4, srot: [180, 0, 0] }));
const keys = (side: Side = 'R'): Extra => all(bit(`hand${side}`, 'torus', [0.8, 0.8, 0.15], [0, 0.5, 0.8], 'gold', { tube: 0.3 }), bit(`hand${side}`, 'box', [0.3, 1.0, 0.12], [0, -0.2, 0.8], 'silver'), bit(`hand${side}`, 'box', [0.8, 1.0, 0.3], [0.4, -0.6, 0.8], 'black'));
const fangs: Extra = all(hb('cyl', [0.06, 0.12, 0.06], [0.07, -0.33, 0.45], 'white', { taper: 0, srot: [180, 0, 0] }), hb('cyl', [0.06, 0.12, 0.06], [-0.07, -0.33, 0.45], 'white', { taper: 0, srot: [180, 0, 0] }));
const highCollar = (c = 'darkred'): Extra => all(bit('torso', 'box', [1.4, 2.4, 0.2], [1.1, 7.9, -0.7], c, { srot: [-10, 0, -22] }), bit('torso', 'box', [1.4, 2.4, 0.2], [-1.1, 7.9, -0.7], c, { srot: [-10, 0, 22] }));
const carrot = (side: Side = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [0.8, 2.8, 0.8], [0, -0.4, 0.9], 'orange', { taper: 0, srot: [180, 0, 0] }), ...[-20, 0, 20].map((r) => bit(`hand${side}`, 'capsule', [0.2, 1.1, 0.2], [r * 0.012, 1.4, 0.9], 'leaf', { srot: [0, 0, r] })));
const broccoli = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'capsule', [0.6, 1.4, 0.6], [0, 0.3, 0.9], 'lime'), bit(`hand${side}`, 'ball', [1.7, 1.3, 1.6], [0, 1.4, 0.9], 'darkgreen'));
const saladBowl = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'cyl', [2.8, 1.0, 2.8], [0, 0.3, 1.3], 'white', { taper: 1.4 }), ...[[-0.6, 0], [0.5, 0.3], [0, -0.5]].map(([x, z], i) => bit(`hand${side}`, 'ball', [1.0, 0.7, 1.0], [x, 0.9, 1.3 + z], ['lettuce', 'tomato', 'leaf'][i])));
const domino = (c = 'black'): Extra => hb('box', [0.95, 0.16, 0.3], [0, 0.05, 0.36], c, { round: 0.6 });
const bomb = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'ball', [2.0, 2.0, 2.0], [0, 0.6, 1.0], 'black'), bit(`hand${side}`, 'capsule', [0.2, 0.8, 0.2], [0.3, 1.8, 1.0], 'tan', { srot: [0, 0, -25] }), bit(`hand${side}`, 'ball', [0.45, 0.45, 0.45], [0.5, 2.2, 1.0], 'fire', { role: 'glow' }));
const fiddleBow = (side: Side = 'L'): Extra => bit(`hand${side}`, 'capsule', [0.15, 5.5, 0.15], [-1.2, 1.4, 1.0], 'darkwood', { srot: [0, 0, 55] });
const armTowel = (side: Side = 'L'): Extra => bit(`fore${side}`, 'box', [1.4, 2.4, 1.4], [0, -0.8, 0.05], 'white', { round: 0.3 });
const crest = (c = 'red'): Extra => hb('box', [0.14, 0.42, 1.1], [0, 0.78, -0.05], c, { round: 0.5 });
const cooler = (side: Side = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [2.8, 3.0, 2.8], [0, -1.9, 0.6], 'orange'), bit(`hand${side}`, 'cyl', [2.9, 0.45, 2.9], [0, -0.3, 0.6], 'white'));
const bottles = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'capsule', [0.8, 2.2, 0.8], [0.45, 0.2, 0.8], 'lime'), bit(`hand${side}`, 'capsule', [0.8, 2.2, 0.8], [-0.45, 0.2, 0.8], 'lime'));
const yarnBasket = (side: Side = 'R'): Extra => all(held('basket', 'tan', side), ...[[-0.8, 'red'], [0, 'skyblue'], [0.8, 'yellow']].map(([x, c]) => bit(`hand${side}`, 'ball', [1.1, 1.1, 1.1], [x as number, -0.6, 0.6], c as string)));
const headset: Extra = all(hat('headphones', 'black'), hb('capsule', [0.05, 0.5, 0.05], [-0.38, -0.22, 0.32], 'black', { srot: [40, 0, -55] }), hb('ball', [0.09, 0.09, 0.09], [-0.2, -0.33, 0.48], 'black'));
const wolfSnout = (c: string): Extra => all(hb('ball', [0.48, 0.36, 0.55], [0, -0.17, 0.45], c), hb('ball', [0.14, 0.11, 0.1], [0, -0.1, 0.72], 'black'), hb('ball', [0.3, 0.12, 0.3], [0, -0.3, 0.56], 'white', { noInk: true }));
const witchNose = (c: string): Extra => all(hb('cyl', [0.14, 0.32, 0.14], [0, -0.08, 0.6], c, { taper: 0.2, srot: [100, 0, 0] }), hb('ball', [0.07, 0.07, 0.07], [0.12, -0.15, 0.48], '#6b8a4a'));
const bracers = (c = 'silver'): Extra => all(bit('foreL', 'cyl', [1.15, 1.3, 1.15], [0, -1.4, 0], c), bit('foreR', 'cyl', [1.15, 1.3, 1.15], [0, -1.4, 0], c));
const champBelt: Extra = all(bit('hips', 'cyl', [3.8, 0.9, 2.6], [0, 0.3, 0], 'black'), bit('hips', 'box', [2.0, 1.5, 0.3], [0, 0.3, 1.35], 'gold', { round: 0.6 }), bit('hips', 'ball', [0.7, 0.7, 0.2], [0, 0.3, 1.5], 'red'));
const bat = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'ball', [0.7, 0.8, 0.6], [0, 2.4, 0.8], 'black'), bit(`hand${side}`, 'wedge', [1.4, 0.7, 0.12], [0.85, 2.5, 0.8], 'black', { apex: -0.5, srot: [0, 0, 180] }),
  bit(`hand${side}`, 'wedge', [1.4, 0.7, 0.12], [-0.85, 2.5, 0.8], 'black', { apex: 0.5, srot: [0, 0, 180] }), bit(`hand${side}`, 'cyl', [0.18, 0.3, 0.18], [0.18, 2.9, 0.8], 'black', { taper: 0 }), bit(`hand${side}`, 'cyl', [0.18, 0.3, 0.18], [-0.18, 2.9, 0.8], 'black', { taper: 0 }));
const elfEars = (c: string): Extra => all(hb('cyl', [0.13, 0.38, 0.1], [0.55, 0.02, -0.02], c, { taper: 0, srot: [0, 0, -70] }), hb('cyl', [0.13, 0.38, 0.1], [-0.55, 0.02, -0.02], c, { taper: 0, srot: [0, 0, 70] }));
const rips = (c = '#3a3a3a'): Extra => all(...[[0.8, 5.5], [-0.9, 3.2], [0.3, 1.5]].map(([x, y]) => bit('torso', 'box', [0.7, 0.5, 0.2], [x, y, 1.1], c, { noInk: true, srot: [0, 0, 25] })));
const fishBucket = (side: Side = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [2.2, 2.2, 2.2], [0, -1.8, 0.6], 'steel', { taper: 1.2 }), bit(`hand${side}`, 'ball', [0.6, 1.4, 0.5], [0.4, -0.4, 0.6], 'orange', { srot: [0, 0, 20] }), bit(`hand${side}`, 'ball', [0.6, 1.4, 0.5], [-0.4, -0.5, 0.7], 'silver', { srot: [0, 0, -15] }));

/* ----- props with parts that move (named, so acts can work them) ----- */

/** A camera at the chest: body, lens and a flash that lights. */
const flashCamera = (side: Side = 'R'): Extra => all(
  bit(`hand${side}`, 'box', [2.4, 1.6, 1.2], [0, -0.5, 0.9], '#2a2a2e', { name: 'camera', edge: 'sharp', round: 0.2 }),
  bit(`hand${side}`, 'cyl', [1.0, 0.9, 1.0], [0, -0.7, 1.9], '#4a4a50', { srot: [90, 0, 0], edge: 'sharp' }),
  bit(`hand${side}`, 'cyl', [0.75, 0.1, 0.75], [0, -0.7, 2.36], '#5aa0e0', { srot: [90, 0, 0], noInk: true }),
  bit(`hand${side}`, 'box', [0.9, 0.5, 0.5], [0.5, 0.5, 0.9], '#3a3a3e', { edge: 'sharp' }),
  bit(`hand${side}`, 'box', [0.7, 0.32, 0.12], [0.5, 0.5, 1.2], '#fffbe0', { name: 'flash', role: 'glow', mover: { kind: 'light' }, noInk: true }));
/** A wallet that can be dropped (a piece). */
const wallet2 = (side: Side = 'R'): Extra => bit(`hand${side}`, 'box', [1.5, 1.1, 0.35], [0, -0.6, 1.0], 'darkbrown', { name: 'wallet', piece: true, edge: 'sharp', round: 0.3 });
/** A grand piano (lid open on its stick) and a bench, for a seated pianist facing +x: metres, figure space. */
const grandPiano: Extra = (p) => {
  const x0 = 0.42; // front edge of the keys
  const black = '#1b1b1f';
  put(p, '', 'box', [0.36, 0.06, 0.82], [-0.06, 0.32, 0], black, { name: 'bench', edge: 'sharp', round: 0.2 });
  put(p, '', 'box', [0.38, 0.03, 0.84], [-0.06, 0.36, 0], '#3a2e2a', { edge: 'soft', round: 0.6 });
  for (const [x, z] of [[0.1, 0.36], [0.1, -0.36], [-0.22, 0.36], [-0.22, -0.36]]) rodM(p, '', [x, 0, z], [x, 0.3, z], 0.04, black);
  // the case: a curved-sided body seen from above (keyboard end wide, tail narrow), black and glossy
  const prof: Array<[number, number, number, number?]> = [[0, 0.36, 1, 0], [0.25, 0.7, 1, 0], [0.55, 0.92, 1, 0], [0.8, 1, 1, 0], [1, 1, 1, 0]];
  put(p, '', 'loft', [1.45, 0.3, 1.7], [x0 + 0.16 + 0.85, 0.83, 0], black, { profile: prof, boxy: 0.92, srot: [0, -90, 0], edge: 'sharp' });
  put(p, '', 'box', [0.16, 0.035, 1.24], [x0 + 0.08, 0.745, 0], 'white', { edge: 'sharp', round: 0.1 });
  put(p, '', 'box', [0.06, 0.09, 1.42], [x0 + 0.01, 0.7, 0], black, { edge: 'sharp', round: 0.2 });
  for (const s of [1, -1]) put(p, '', 'box', [0.2, 0.12, 0.09], [x0 + 0.08, 0.76, s * 0.665], black, { edge: 'sharp', round: 0.2 });
  for (let o = 0; o < 7; o++)
    for (const k of [1, 2, 4, 5, 6]) put(p, '', 'box', [0.09, 0.02, 0.012], [x0 + 0.12, 0.772, -0.58 + o * 0.166 + k * 0.0237], black, { noInk: true });
  put(p, '', 'box', [0.025, 0.24, 0.8], [x0 + 0.22, 1.06, 0], black, { srot: [0, 0, -14], edge: 'sharp' });
  put(p, '', 'box', [0.012, 0.2, 0.42], [x0 + 0.2, 1.07, 0], 'paper', { srot: [0, 0, -14], noInk: true });
  // the lid, hinged along the far (bass) side, open on its stick
  put(p, '', 'loft', [1.45, 0.03, 1.7], [x0 + 0.16 + 0.85, 0.995, 0], black, { name: 'lid', profile: prof, boxy: 0.95, srot: [0, -90, 0], off: [0, 0, 0.72], at: [x0 + 1.01, 0.995, -0.72], mover: { kind: 'swing', axis: 'x', amount: -42, on: true }, edge: 'sharp' } as O);
  rodM(p, 'lid', [0.1, -0.01, 0.75], [0.1, -0.31, 0.33], 0.025, black); // the stick: lands on the case when the lid is up
  for (const [x, z] of [[x0 + 0.22, 0.6], [x0 + 0.22, -0.6], [x0 + 1.55, -0.1]]) put(p, '', 'cyl', [0.1, 0.66, 0.1], [x, 0.33, z], black, { taper: 0.75, edge: 'sharp' });
  put(p, '', 'box', [0.05, 0.5, 0.16], [x0 + 0.3, 0.3, 0], black, { edge: 'sharp' });
  for (const z of [-0.07, 0, 0.07]) put(p, '', 'box', [0.1, 0.02, 0.035], [x0 + 0.22, 0.05, z], 'gold', { edge: 'sharp' });
};
/** A horse's feathered wings, folded up over its back, each a joint that can flap (wingL, wingR). */
const featherWings = (c: string, tip = c): NonNullable<Parameters<typeof beast>[1]['acc']>[number] => (p, d) => {
  const [L, Hb, W] = d.body;
  for (const s of [1, -1]) {
    const name = s > 0 ? 'wingL' : 'wingR';
    p.add({ name, parent: 'body', at: [s * W * 0.32, Hb * 0.4, L * 0.16], rot: [0, s * -18, s * 38], shape: 'ball', size: [0.95, 0.12, 0.5], off: [s * 0.45, 0, -0.05], color: col(c), layer: 2 });
    for (let i = 0; i < 5; i++) {
      const len = 0.75 + i * 0.1;
      p.add({ name: `${name}f${i}`, parent: name, at: [s * (0.25 + i * 0.17), 0, -0.12], srot: [90 - i * 8, 0, s * (-12 + i * 9)], shape: 'capsule', size: [0.17, len, 0.06], off: [s * 0.05, 0, -len * 0.42], color: col(i > 2 ? tip : c), layer: 2 });
    }
  }
};

/** A parrot on the left shoulder; its body is a joint ('parrot') so it can hop. */
const parrot2: Extra = all(
  bit('torso', 'ball', [0.9, 1.3, 0.9], [2.3, 7.7, -0.1], 'red', { name: 'parrot', piece: true }),
  bit('parrot', 'ball', [0.75, 0.75, 0.75], [0, 0.85, 0.15], 'red'),
  bit('parrot', 'cyl', [0.3, 0.45, 0.3], [0, 0.75, 0.6], 'yellow', { taper: 0, srot: [100, 0, 0] }),
  bit('parrot', 'ball', [0.16, 0.16, 0.1], [0.3, 0.95, 0.35], 'black', { noInk: true }),
  bit('parrot', 'ball', [0.16, 0.16, 0.1], [-0.3, 0.95, 0.35], 'black', { noInk: true }),
  bit('parrot', 'ball', [0.3, 1.0, 0.7], [0.45, -0.05, 0], 'blue'),
  bit('parrot', 'ball', [0.3, 1.0, 0.7], [-0.45, -0.05, 0], 'blue'),
  bit('parrot', 'capsule', [0.4, 1.4, 0.3], [0, -0.8, -0.45], 'blue', { srot: [-30, 0, 0] }));
/** The crook (right hand) and flail (left hand) of a pharaoh, held crossed on the chest (on the torso, in arm
 *  widths: the hands meet at the middle of the chest in the cross stance). */
const crookFlail: Extra = all(
  seg('torso', [-0.5, 3.0, 1.9], [1.9, 7.4, 1.75], 0.34, 'gold'),
  ...[0.25, 0.45, 0.65].map((t) => seg('torso', [-0.5 + 2.4 * t, 3.0 + 4.4 * t, 1.9], [-0.5 + 2.4 * (t + 0.07), 3.0 + 4.4 * (t + 0.07), 1.9], 0.38, 'blue')),
  bit('torso', 'arc', [1.5, 1.5, 0.34], [2.35, 7.75, 1.75], 'gold', { arc: 210, tube: 0.24, srot: [0, 0, -40] }),
  seg('torso', [0.5, 3.0, 2.0], [-1.6, 6.6, 1.85], 0.3, 'gold'),
  ...[0, 1, 2].map((i) => seg('torso', [-1.6, 6.6, 1.85 + (i - 1) * 0.15], [-2.1 - i * 0.35, 4.6 + i * 0.25, 1.95 + (i - 1) * 0.3], 0.26, i === 1 ? 'gold' : 'blue')));

/** A model rocket held in the hand; its body is a joint ('toy') so it can lift off. */
const toyRocket = (side: Side): Extra => all(
  bit(`hand${side}`, 'cyl', [1.0, 2.6, 1.0], [0, 1.2, 1.1], 'white', { name: 'toy', piece: true }),
  bit('toy', 'cyl', [1.0, 1.1, 1.0], [0, 1.85, 0], 'red', { taper: 0 }),
  bit('toy', 'wedge', [2.2, 1.0, 0.15], [0, -1.0, 0], 'red', { edge: 'sharp' }),
  bit('toy', 'wedge', [2.2, 1.0, 0.15], [0, -1.0, 0], 'red', { edge: 'sharp', srot: [0, 90, 0] }),
  bit('toy', 'ball', [0.45, 0.45, 0.2], [0, 0.5, 0.5], 'skyblue'));
/** A lamb by the feet; its body is a joint ('lamb') so it can hop. */
const lamb2: Extra = all(
  bit('', 'ball', [4.0, 3.0, 5.2], [4.6, 3.3, 1.0], 'wool', { name: 'lamb', piece: true }),
  bit('lamb', 'ball', [1.6, 1.8, 2.0], [0, 1.3, 2.8], 'darkgray'),
  bit('lamb', 'ball', [1.0, 0.45, 0.6], [1.0, 1.6, 2.6], 'darkgray', { srot: [0, 0, -25] }),
  bit('lamb', 'ball', [1.0, 0.45, 0.6], [-1.0, 1.6, 2.6], 'darkgray', { srot: [0, 0, 25] }),
  bit('lamb', 'ball', [1.8, 1.0, 1.4], [0, 1.9, 2.4], 'wool'),
  ...[[1.1, 1.6], [-1.1, 1.6], [1.1, -1.6], [-1.1, -1.6]].map(([x, z]) => bit('lamb', 'capsule', [0.6, 2.4, 0.6], [x, -2.1, z], 'darkgray')));
/** A torch whose lens lights (a light mover, 'beam'). */
const torch2 = (side: Side = 'R'): Extra => all(
  bit(`hand${side}`, 'cyl', [0.6, 2.4, 0.6], [0, 0.2, 1.3], 'black', { srot: [70, 0, 0], edge: 'sharp' }),
  bit(`hand${side}`, 'cyl', [0.75, 0.2, 0.75], [0, 0.6, 2.45], '#fff3b0', { srot: [70, 0, 0], role: 'glow', name: 'beam', mover: { kind: 'light' } }));
/** A cowboy hat that can be tipped (a joint on the head, 'stetson'). */
const stetson = (c = 'brown'): Extra => (p, d) => {
  const W = d.headW, Hh = d.headH, D = d.headD, top = d.headY + Hh * 0.42;
  put(p, 'head', 'cyl', [W * 1.8, Hh * 0.05, D * 1.8], [0, top - Hh * 0.04, 0], c, { name: 'stetson', piece: true });
  put(p, 'stetson', 'ball', [W * 0.8, Hh * 0.45, D * 0.75], [0, Hh * 0.2, 0], c);
  put(p, 'stetson', 'cyl', [W * 0.82, Hh * 0.08, D * 0.77], [0, Hh * 0.06, 0], 'darkbrown');
};

/** A skateboard under the feet; the deck is a joint ('board') so it can flip. */
const skateboard2 = (c = 'red'): Extra => all(
  bit('', 'box', [8.5, 0.35, 2.6], [0, 1.05, 0.4], c, { round: 0.5, name: 'board', piece: true, edge: 'sharp' }),
  ...[[2.8, 0.9], [2.8, -0.9], [-2.8, 0.9], [-2.8, -0.9]].map(([x, z]) => bit('board', 'cyl', [0.7, 0.5, 0.7], [x, -0.7, z], 'white', { srot: [90, 0, 0] })),
  ...[2.8, -2.8].map((x) => bit('board', 'box', [0.5, 0.3, 2.0], [x, -0.35, 0], 'silver', { edge: 'sharp' })));
/** A snake basket; the cobra is a joint ('cobra') coiled inside with only its head showing, so it can rise and sway. */
const cobra2: Extra = all(
  bit('', 'cyl', [3.8, 3.0, 3.8], [4.2, 1.5, 2.0], 'tan', { taper: 1.25 }),
  bit('', 'torus', [4.6, 4.6, 0.6], [4.2, 3.0, 2.0], 'wood', { srot: [90, 0, 0] }),
  pivoted('', 'capsule', [0.8, 3.8, 0.8], [4.2, 1.9, 2.1], [4.2, 0.1, 2.0], 'olive', { name: 'cobra', piece: true, srot: [5, 0, 0] }),
  bit('cobra', 'ball', [1.8, 2.0, 0.45], [0, 3.5, 0.25], 'olive'),
  bit('cobra', 'ball', [1.0, 1.4, 0.2], [0, 3.4, 0.45], '#c9b26a', { noInk: true }),
  bit('cobra', 'ball', [0.9, 0.65, 1.2], [0, 4.3, 0.6], 'olive'),
  bit('cobra', 'ball', [0.15, 0.15, 0.1], [0.3, 4.45, 1.0], 'black', { noInk: true }),
  bit('cobra', 'ball', [0.15, 0.15, 0.1], [-0.3, 4.45, 1.0], 'black', { noInk: true }));
/** A football by the left foot; it is a joint ('ball') so it can be kicked away. */
const soccerBall2: Extra = all(
  bit('', 'ball', [2.3, 2.3, 2.3], [2.0, 1.15, 2.6], 'white', { name: 'ball', piece: true }),
  ...[[0, 0.05, 1.0], [0.8, 0.3, 0.55], [-0.72, 0.4, 0.62], [0.35, -0.68, 0.7], [0, 1.0, 0]].map(([x, y, z]) => bit('ball', 'ball', [0.62, 0.62, 0.5], [x, y, z], '#222226', { noInk: true, srot: [Math.atan2(-y, z) * R2D, Math.atan2(x, z) * R2D, 0] })));

/** A card held up in the hand that turns round (a joint, 'card'): `a` on one side, `b` on the other. */
const flipCard = (a: string, b: string, ca = 'white', cb = 'white', side: Side = 'L'): Extra => all(
  bit(`hand${side}`, 'box', [2.6, 1.8, 0.08], [0, 1.2, 0.8], ca, { name: 'card', piece: true, edge: 'sharp', round: 0.1 }),
  bit('card', 'box', [2.5, 1.7, 0.04], [0, 0, 0.06], ca, { role: 'label', text: a, round: 0.1, edge: 'sharp' }),
  bit('card', 'box', [2.5, 1.7, 0.04], [0, 0, -0.06], cb, { role: 'label', text: b, round: 0.1, srot: [0, 180, 0], edge: 'sharp' }));
/** A block of stone by the feet with a corner chip that can be knocked off (a piece). */
const stoneBlock2: Extra = all(
  bit('', 'box', [3.4, 2.6, 3.0], [4.0, 1.3, 1.2], 'stone', { round: 0.1, name: 'block', edge: 'sharp' }),
  bit('block', 'box', [1.0, 0.8, 1.0], [-1.2, 1.0, 1.0], 'stone', { name: 'chip', piece: true, round: 0.2, edge: 'sharp', srot: [10, 20, 0] }));
/** A top hat that can be tipped (a joint on the head, 'tophat'). */
const topHat = (c = 'black', band = 'red'): Extra => (p, d) => {
  const W = d.headW, Hh = d.headH, D = d.headD, top = d.headY + Hh * 0.42;
  put(p, 'head', 'cyl', [W * 1.5, Hh * 0.05, D * 1.4], [0, top, 0], c, { name: 'tophat', piece: true });
  put(p, 'tophat', 'cyl', [W * 0.85, Hh * 0.75, D * 0.8], [0, Hh * 0.38, 0], c);
  put(p, 'tophat', 'cyl', [W * 0.87, Hh * 0.1, D * 0.82], [0, Hh * 0.08, 0], band);
};
/** A hot-dog cart beside the vendor, at its real size (counter 0.9 m, 1.4 m long): metres, figure space. Steamer
 *  lid on a hinge ('lid'), two wheels, a handle, condiments and a striped umbrella. */
const hotDogCart: Extra = (p) => {
  const x = 1.15, z = 0.05;
  put(p, '', 'box', [1.3, 0.5, 0.7], [x, 0.6, z], '#d63a2f', { edge: 'sharp', round: 0.12 });
  put(p, '', 'box', [1.31, 0.08, 0.71], [x, 0.74, z], 'white', { edge: 'sharp', round: 0.1 });
  put(p, '', 'box', [0.9, 0.16, 0.02], [x, 0.53, z + 0.36], 'white', { role: 'label', text: 'HOT DOGS', edge: 'sharp' });
  put(p, '', 'box', [1.38, 0.04, 0.78], [x, 0.87, z], 'silver', { edge: 'sharp', round: 0.2 });
  put(p, '', 'box', [0.56, 0.12, 0.44], [x - 0.2, 0.93, z], 'steel', { edge: 'sharp', round: 0.2 });
  put(p, '', 'box', [0.56, 0.03, 0.44], [x - 0.2, 1.0, z], 'silver', { name: 'lid', at: [x - 0.2, 1.0, z - 0.22], off: [0, 0, 0.22], mover: { kind: 'swing', axis: 'x', amount: -100 }, edge: 'sharp', round: 0.3 } as O);
  put(p, 'lid', 'box', [0.12, 0.03, 0.03], [0, 0.03, 0.4], 'black', { edge: 'sharp' });
  put(p, '', 'cyl', [0.06, 0.18, 0.06], [x + 0.42, 0.98, z + 0.22], 'red', { edge: 'sharp', taper: 0.7 });
  put(p, '', 'cyl', [0.06, 0.18, 0.06], [x + 0.52, 0.98, z + 0.22], 'yellow', { edge: 'sharp', taper: 0.7 });
  for (const s of [1, -1]) {
    put(p, '', 'cyl', [0.46, 0.07, 0.46], [x + 0.5, 0.23, z + s * 0.4], 'rubber', { name: s > 0 ? 'wheel1' : 'wheel2', srot: [90, 0, 0] });
    put(p, '', 'cyl', [0.12, 0.08, 0.12], [x + 0.5, 0.23, z + s * 0.43], 'silver', { srot: [90, 0, 0] });
    rodM(p, '', [x - 0.6, 0.35, z + s * 0.28], [x - 0.6, 0, z + s * 0.28], 0.04, 'steel');
    rodM(p, '', [x - 0.66, 0.82, z + s * 0.25], [x - 0.86, 0.95, z + s * 0.25], 0.035, 'steel');
  }
  rodM(p, '', [x - 0.86, 0.95, z + 0.25], [x - 0.86, 0.95, z - 0.25], 0.04, 'black');
  rodM(p, '', [x + 0.3, 0.9, z - 0.2], [x + 0.3, 2.15, z - 0.2], 0.04, 'silver');
  put(p, '', 'cyl', [1.9, 0.42, 1.9], [x + 0.3, 2.17, z - 0.2], 'yellow', { taper: 0.04, segs: 8 });
  put(p, '', 'cyl', [1.92, 0.1, 1.92], [x + 0.3, 1.97, z - 0.2], 'red', { segs: 8, noInk: true });
};

/** A puppy held in the arm; its body is a joint ('pup') so it can wriggle. */
const puppy2 = (side: Side = 'L', c = '#c98d4a'): Extra => all(
  bit(`hand${side}`, 'ball', [2.2, 1.6, 1.4], [0, 0, 1.2], c, { name: 'pup', piece: true }),
  bit('pup', 'ball', [1.3, 1.2, 1.3], [0.9, 0.9, 0.2], c),
  bit('pup', 'ball', [0.6, 0.45, 0.6], [1.25, 0.75, 0.8], 'cream'),
  bit('pup', 'ball', [0.25, 0.2, 0.2], [1.25, 0.85, 1.1], 'black', { noInk: true }),
  bit('pup', 'ball', [0.4, 0.9, 0.3], [1.45, 0.75, 0.1], 'darkbrown'),
  bit('pup', 'ball', [0.4, 0.9, 0.3], [0.35, 0.75, 0.1], 'darkbrown'),
  bit('pup', 'capsule', [0.3, 1.0, 0.3], [-1.2, 0.3, -0.2], c, { srot: [0, 0, 50] }));

/** A silver tray on the palm (forearm forward, the hold stance) under a dome lid on a hinge ('lid'). Hand frame:
 *  -y is forward, +z is up. */
const cloche2 = (side: Side = 'R'): Extra => all(
  bit(`hand${side}`, 'cyl', [4.6, 0.25, 4.6], [0, -1.2, 0.75], 'silver', { srot: [90, 0, 0], edge: 'sharp' }),
  bit(`hand${side}`, 'ball', [1.2, 0.9, 0.6], [0, -1.6, 1.05], 'meat', { srot: [90, 0, 0] }),
  pivoted(`hand${side}`, 'dome', [3.4, 3.4, 2.4], [0, -1.2, 0.85], [0, 0.5, 0.85], 'silver', { name: 'lid', srot: [90, 0, 0], mover: { kind: 'swing', axis: 'x', amount: -105 }, edge: 'sharp' }),
  bit('lid', 'ball', [0.5, 0.5, 0.5], [0, -1.7, 2.45], 'silver'));
/** An upright tapestry loom beside the weaver (metres, figure space), half woven, with a shuttle ('shuttle'). */
const loom: Extra = (p) => {
  const x0 = 0.55, x1 = 1.35, z = 0.15, wood = '#8a5a35';
  for (const x of [x0, x1]) {
    put(p, '', 'box', [0.06, 1.55, 0.06], [x, 0.775, z], wood, { edge: 'sharp' });
    put(p, '', 'box', [0.08, 0.04, 0.5], [x, 0.02, z], wood, { edge: 'sharp' });
  }
  for (const y of [0.32, 1.45]) put(p, '', 'cyl', [0.06, x1 - x0 + 0.12, 0.06], [(x0 + x1) / 2, y, z], wood, { srot: [0, 0, 90], edge: 'sharp' });
  ['#c0392b', '#e0a040', '#2f6b8a', '#e8dcc0'].forEach((c, i) => put(p, '', 'box', [x1 - x0 - 0.06, 0.12, 0.02], [(x0 + x1) / 2, 0.41 + i * 0.12, z], c, { edge: 'sharp', round: 0.1 }));
  for (let i = 0; i < 12; i++) put(p, '', 'box', [0.006, 0.66, 0.006], [x0 + 0.06 + i * 0.062, 1.12, z], '#f2ead8', { noInk: true });
  put(p, '', 'box', [0.24, 0.035, 0.05], [x0 + 0.17, 0.92, z + 0.04], wood, { name: 'shuttle', piece: true, edge: 'sharp', round: 0.6 });
};
/** Claws on both hands. */
const claws = (c = 'white'): Extra => all(...(['L', 'R'] as const).flatMap((s) => [-0.4, 0, 0.4].map((x) => bit(`hand${s}`, 'cyl', [0.22, 0.6, 0.22], [x, -1.1, 0.35], c, { taper: 0, srot: [180, 0, 0] }))));
/** Shaggy fur on the shoulders and chest. */
const fur = (c: string): Extra => all(bit('torso', 'ball', [3.0, 1.2, 2.2], [0, 6.8, -0.2], c), bit('torso', 'ball', [1.4, 1.4, 0.4], [0, 5.4, 1.0], c), bit('foreL', 'ball', [1.1, 1.0, 1.1], [0, -1.6, 0], c), bit('foreR', 'ball', [1.1, 1.0, 1.1], [0, -1.6, 0], c));
/** A windsurf board (2.6 m) on the water; the rig is a joint ('mast') at the mast foot: a 4.2 m mast, the sail
 *  widest at the boom, which the rider holds at shoulder height (arm widths, from the rider's feet). */
const windsurf2: Extra = all(
  bit('', 'box', [26, 0.5, 6.0], [6, 0.25, 0.4], 'white', { round: 0.9 }),
  bit('', 'box', [26.1, 0.2, 6.05], [6, 0.3, 0.4], 'cyan', { noInk: true }),
  pivoted('', 'capsule', [0.4, 42, 0.4], [6.5, 21.5, 0.4], [6.5, 0.5, 0.4], 'silver', { name: 'mast', piece: true }),
  bit('mast', 'wedge', [18, 27.5, 0.15], [9, 26.75, 0], 'orange', { apex: -0.5, edge: 'sharp' }),
  bit('mast', 'wedge', [18, 12.5, 0.15], [9, 7.25, 0], 'orange', { apex: 0.5, srot: [0, 0, 180], edge: 'sharp' }),
  bit('mast', 'wedge', [9, 13, 0.17], [4.5, 20, 0], 'yellow', { apex: -0.5, noInk: true, edge: 'sharp' }),
  bit('mast', 'box', [16, 1.2, 0.18], [8.5, 13.5, 0], '#9fd3f0', { noInk: true, edge: 'sharp' }),
  seg('mast', [0, 13.5, 0], [18, 13.5, 0], 0.35, 'black'));

/** A sign on a pole that turns round (a joint, 'sign'): one side says `a`, the other `b`. */
const flipSign = (a: string, b: string, ca = 'white', cb = 'white', side: Side = 'R'): Extra => all(
  bit(`hand${side}`, 'capsule', [0.32, 14, 0.32], [0, 3.5, 0.4], 'wood'),
  bit(`hand${side}`, 'box', [6.5, 3.6, 0.12], [0, 10.5, 0.4], ca, { name: 'sign', piece: true, edge: 'sharp', round: 0.1 }),
  bit('sign', 'box', [6.4, 3.5, 0.06], [0, 0, 0.1], ca, { role: 'label', text: a, round: 0.1, edge: 'sharp' }),
  bit('sign', 'box', [6.4, 3.5, 0.06], [0, 0, -0.1], cb, { role: 'label', text: b, round: 0.1, srot: [0, 180, 0], edge: 'sharp' }));

/* ----- act pieces ----- */

/** Wings (wingL, wingR) to a turn about z from their rest (negative: down). */
const wings = (z: number, dur = 0.25): Step => A.par(T('wingL', [0, 0, z], dur), T('wingR', [0, 0, -z], dur));
/** n beats of the wings, then back to rest. */
const flaps = (n = 2): Step[] => [...Array.from({ length: n }, () => [wings(-45, 0.22), wings(22, 0.22)]).flat(), wings(0, 0.3)];
/** Hands on a keyboard: the forearms bob in turn. */
const playKeys = (n = 6): Step[] => Array.from({ length: n }, (_, i) => A.par(T('foreL', [i % 2 ? -14 : 6, 0, 0], 0.2), T('foreR', [i % 2 ? 6 : -14, 0, 0], 0.2)));

/** Marching on the spot: knees up in turn. */
const march = (n = 4): Step[] => [
  ...Array.from({ length: n }, (_, i) => {
    const [up, dn] = i % 2 ? ['R', 'L'] : ['L', 'R'];
    return A.par(T(`leg${up}`, [-40, 0, 0], 0.25), T(`shin${up}`, [55, 0, 0], 0.25), T(`leg${dn}`, [0, 0, 0], 0.25), T(`shin${dn}`, [0, 0, 0], 0.25));
  }),
  home('legL', 'legR', 'shinL', 'shinR'),
];
/** Hammer taps: the forearm comes down and up again. */
const knock = (side: Side, n = 3): Step[] => [...Array.from({ length: n }, () => [T(`fore${side}`, [-55, 0, 0], 0.2), T(`fore${side}`, [-10, 0, 0], 0.15)]).flat(), home(`fore${side}`)];
/** Strumming: the right forearm sweeps down and up. */
const strum = (n = 4): Step[] => [...Array.from({ length: n }, (_, i) => T('foreR', [i % 2 ? -12 : 22, 0, 0], 0.16)), home('foreR')];

/* ----- local helpers: whole figures ----- */

/** Rest-pose joint turns (an arm raised to wave, arms out like a zombie): armL [0, 0, 130] raises the left arm. */
const pose = (f: Figure, j: Record<string, Vec3>): Figure => measure({ ...f, parts: f.parts.map((p) => (j[p.name] ? { ...p, rot: j[p.name] } : p)) });
/** The same figure scaled (child proportions at toddler or puppet size). */
const scale = (f: Figure, k: number): Figure => measure({ ...f, parts: f.parts.map((p) => ({ ...p, at: k3(p.at, k), off: p.off && k3(p.off, k), size: k3(p.size, k) })) });
/** Several people side by side as one figure: a crowd, twins, toddlers. */
function crowd(key: string, list: Array<[Figure, number, number?]>): Figure {
  const ps = new Parts();
  list.forEach(([f, dx, dz = 0], i) => {
    for (const p of f.parts)
      ps.add({ ...p, name: `${p.name}~${i}`, parent: p.parent && `${p.parent}~${i}`, at: p.parent ? p.at : [p.at[0] + dx, p.at[1], p.at[2] + dz], rot: p.name === 'armL' ? [0, 0, 22] : p.name === 'armR' ? [0, 0, -22] : p.rot });
  });
  return figure(key, 'people', 'prop', 'front', ps, list[0][0].face);
}
/** Raise a figure (standing on skates, a skateboard, skis). */
const lift = (f: Figure, dy: number): Figure => measure({ ...f, parts: f.parts.map((p) => (p.name === 'hips' ? { ...p, at: [p.at[0], p.at[1] + dy, p.at[2]] } : p)) });
/** Recolour named parts (bare thighs under a leotard). */
const paint = (f: Figure, names: string[], c: string): Figure => ({ ...f, parts: f.parts.map((p) => (names.includes(p.name) ? { ...p, color: col(c) } : p)) });
const shorts = (skin: string) => ({ skin, legs: skin });

/** Every part crisp: a hard shell (a robot's metal body). */
const hard = (f: Figure): Figure => ({ ...f, edge: 'sharp' });

/** A seat on a horse's back (someone can ride it). */
const saddled = (f: Figure): Figure => {
  const body = f.parts.find((p) => p.name === 'body')!;
  const top = solve(f).get('body')!.T[1] + body.size[2] / 2; // the kit's body is a capsule lying along z: size[2] is its height
  return withSockets(f, [{ name: 'saddle', at: [0, top, -0.05], kind: 'seat', part: 'body' }]);
};

/* ----- arms: rest stances and moves ----- */

/** Arm positions as absolute joint turns of [upper arm, forearm, hand] for the right arm (the left mirrors): `down`
 *  is how every person stands; the rest are rest stances (who's poses plus a few) and moves for acts. The hand turn
 *  keeps what the hand holds the right way up (a trophy raised overhead stays upright). */
const ARMS = {
  down: [[0, 0, -6], [0, 0, 0]],
  hold: [[-18, 0, -8], [-78, 0, 4]], // forearm forward, carrying something in front
  carry: [[-6, 0, -10], [-34, 0, 0]], // forearm a little forward (a lantern, a bag)
  hip: [[-6, 0, -38], [-10, 0, 110]], // hand on the hip
  cross: [[-28, 0, -14], [-82, 0, 92]], // folded across the chest
  reach: [[-82, 0, -6], [-8, 0, 0]],
  wave: [[-15, 0, -150], [-6, 0, 18]],
  point: [[-25, 0, -87], [0, 0, -4]],
  salute: [[-12, 0, -78], [-30, 0, -118]],
  chin: [[-48, 0, -14], [-125, 0, 22]], // hand to the chin, thinking
  heart: [[-40, 0, 4], [-90, 0, 40]], // hand on the heart
  up: [[0, 0, -166], [0, 0, 0], [0, 0, 160]], // straight up overhead, what it holds kept upright (a trophy, a sign)
  raise: [[0, 0, -166], [0, 0, 0]], // the same, what it holds turning with the arm (a sword hanging down points up)
  fist: [[0, 0, -156], [0, 0, -30], [0, 0, 180]],
  offer: [[-70, 0, -6], [-10, 0, 0], [80, 0, 0]], // held out in front (a handshake, a gift)
  stop: [[-80, 0, -11], [-75, 0, 0]], // forearm up in front, palm out: halt
  eye: [[-70, 0, 24], [-100, 0, -30]], // up to the face (a camera, a telescope, a radio, a horn)
  side: [[0, 0, -91], [0, 0, 0], [0, 0, 85]], // straight out to the side
  mouth: [[-55, 0, 18], [-112, 0, -20]], // up to the mouth (a pipe, a whistle, a cup)
  flex: [[-10, 0, -86], [0, 0, -100], [0, 0, 90]], // arm out, forearm up: showing the muscles
  front: [[-40, 0, -4], [-50, 0, 0]], // hands low in front (a cue, a broom, a coiled rope)
  selfie: [[-118, 0, 22], [-18, 0, 0]], // held up high in front, looking at it (a phone)
} satisfies Record<string, [Vec3, Vec3, Vec3?]>;
type ArmKey = keyof typeof ARMS;
const mir = (v: Vec3): Vec3 => [v[0], -v[1], -v[2]];
const Z3: Vec3 = [0, 0, 0];
const sideArm = (side: Side, k: ArmKey): [Vec3, Vec3, Vec3] => {
  const [a, f, h = Z3] = ARMS[k] as [Vec3, Vec3, Vec3?];
  return side === 'R' ? [a, f, h] : [mir(a), mir(f), mir(h)];
};
/** A person standing with their arms in rest stances (each side separately). */
const rest = (f: Figure, s: { L?: ArmKey; R?: ArmKey }): Figure => {
  const j: Record<string, Vec3> = {};
  for (const side of ['L', 'R'] as const) {
    const k = s[side];
    if (!k) continue;
    const [a, fo, h] = sideArm(side, k);
    j[`arm${side}`] = a;
    j[`fore${side}`] = fo;
    if (h !== Z3) j[`hand${side}`] = h;
  }
  return pose(f, j);
};

/* ----- acts ----- */

type Click = Step[];
/** An act: each list is one click; they take turns. */
const acts = (f: Figure, ...click: Click[]): Figure => withAct(withHands(f), { click });
/** A gesture and the line that goes with it, together. */
const G = (g: string, line: string, dur = 2.2): Step => A.par(A.anim(g), A.say(line, dur));
/** Turn a joint (degrees added to its rest pose) over dur seconds. */
const T = (part: string, rot: Vec3, dur = 0.35): Step => A.pose(part, { rot, dur });
/** Turn and shift a part at once (two poses of one part at the same time would undo each other). */
const TM = (part: string, rot: Vec3, move: Vec3, dur = 0.4): Step => A.pose(part, { rot, move, dur });
/** Shift a part (metres, in its parent's frame). */
const Mv = (part: string, move: Vec3, dur = 0.5): Step => A.pose(part, { move, dur });
/** Put parts back as they rest. */
const home = (...parts: string[]): Step => A.par(...parts.map((p) => A.pose(p, { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 })));
/** Move one arm to `to` from the rest stance it has (`from`, default hanging down). */
const arm = (side: Side, to: ArmKey, from: ArmKey = 'down', dur = 0.35): Step => {
  const [a1, f1, h1] = sideArm(side, to);
  const [a0, f0, h0] = sideArm(side, from);
  const d = (x: Vec3, y: Vec3): Vec3 => [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
  return A.par(T(`arm${side}`, d(a1, a0), dur), T(`fore${side}`, d(f1, f0), dur), T(`hand${side}`, d(h1, h0), dur));
};
/** Both arms at once. */
const arms = (to: ArmKey, from: ArmKey = 'down', dur = 0.35): Step => A.par(arm('L', to, from, dur), arm('R', to, from, dur));
/** Arms back to their rest stance. */
const armsHome = (side: Side | 'LR' = 'LR'): Step => home(...(side === 'LR' ? ['armL', 'foreL', 'handL', 'armR', 'foreR', 'handR'] : [`arm${side}`, `fore${side}`, `hand${side}`]));
const before = { rel: 'front', of: 'self', dist: 'close' } as const;
/** Something appears in front of them for a moment while they hold out a hand and say a line, then goes. */
const give = (ref: string, word: string, line: string, side: Side = 'R', from: ArmKey = 'down', how: 'pop' | 'fade' | 'sink' | 'fly_away' = 'pop'): Click => [
  A.spawn(ref, word, before), A.attach(ref, 'self', `hand${side}`), A.par(arm(side, 'offer', from), A.say(line, 2.6)), A.wait(2.4), A.par(A.remove(ref, how), armsHome(side)),
];
/** Sockets in both palms (handL, handR) that ride the hands, so things can be put in a person's hand. */
const withHands = (f: Figure): Figure => {
  if (f.rig !== 'biped' || f.sockets?.some((s) => s.name === 'handR')) return f;
  const fr = solve(f);
  const list = (['L', 'R'] as const).flatMap((s) => {
    const h = f.parts.find((p) => p.name === `hand${s}`);
    const F = fr.get(`hand${s}`);
    if (!h || !F) return [];
    const aw = h.size[0] / 1.25;
    const r = apply(F.R, [0, -aw * 0.35, aw * 0.55]);
    return [{ name: `hand${s}`, at: [F.T[0] + r[0], F.T[1] + r[1], F.T[2] + r[2]] as Vec3, kind: 'hand' as const, part: `hand${s}`, size: 0.4 }];
  });
  return withSockets(f, list);
};
/** A person sitting (on a stool, a bench, the ground): thighs forward, shins down, hips lowered to fit. */
const seated = (f: Figure): Figure => {
  const fr = solve(f);
  // thighs level: the knees come up to the hips, so the hips come down by a thigh's length to keep the feet down
  const drop = fr.get('hips')!.T[1] - fr.get('shinL')!.T[1];
  const g = pose(f, { legL: [-88, 0, 4], legR: [-88, 0, -4], shinL: [88, 0, 0], shinR: [88, 0, 0] });
  return measure({ ...g, parts: g.parts.map((p) => (p.name === 'hips' ? { ...p, at: [p.at[0], p.at[1] - drop, p.at[2]] } : p)) });
};

export const ENTRIES: CatalogEntry[] = [
  // A children's doctor: the head mirror, a teddy for the shy ones, a lollipop for the brave.
  e('pediatrician', 'town', 'medical', () => acts(
    rest(who('pediatrician', { top: 'white', bottom: 'skyblue', long: true, hair: '#5a3a22', style: 'bun', acc: [wear('labcoat'), wear('stethoscope'), teddy('L'), hat('headband', 'white'), hb('cyl', [0.3, 0.06, 0.3], [0, 0.32, 0.5], 'silver', { srot: [80, 0, 0] })] }), { L: 'hold' }),
    [G('wave', 'Hi there! Can you say "ahh"?')],
    give('pop', 'lollipop', 'A lollipop for being so brave!'),
    [A.par(arm('R', 'offer'), A.anim('nod'), A.say('Deep breath in... and out. Perfect!', 2.6)), A.wait(1.4), armsHome('R')],
  )),
  // A winged horse at a horse's size (1.6 m at the withers), feathered wings folded up over its back that flap.
  e('pegasus', 'fantasy', 'magic horses', () => acts(
    saddled(beast('pegasus', { color: 'white', body: [1.3, 0.82, 0.62], bodyShape: 'capsule', legL: 0.84, legW: 0.17, hoof: '#b8bcc8', neckL: 0.7, neckLean: 32, neckW: 0.4, head: [0.62, 0.3, 0.27], snout: { len: 0.26, h: 0.2, w: 0.18, color: '#eef0f6' }, nose: '#9aa0ae', ears: 'pointy', earSize: 0.11, tail: 'fluffy', tailColor: '#dfe8f5', tailAngle: 128, acc: [ani.mane('#dfe8f5'), featherWings('#f6f9ff', '#d8e4f6')] })),
    [A.say('Neigh!', 1.4), ...flaps(3)],
    [A.par(A.anim('hop'), wings(-50, 0.3), A.effect('sparkle', { dur: 1.6 })), ...flaps(2), A.say('Whinny!', 1.2)],
  )),
  // A family (a prop of three people): they wave together and bounce.
  e('people', 'town', 'family', () => acts(
    crowd('people', [[who('people man', { top: 'blue', bottom: 'denim', style: 'short' }), -0.55], [who('people woman', { top: 'pink', skirt: 'purple', style: 'long', h: 1.62 }), 0.05, -0.1], [who('people kid', { h: 'kid', top: 'yellow', bottom: 'navy' }), 0.6, 0.1]]),
    [A.par(T('armR~0', [0, 0, -130]), T('armL~1', [0, 0, 130]), T('armR~2', [0, 0, -130]), A.say('Hello, neighbour!', 2.2)), A.par(T('foreR~0', [0, 0, -30], 0.25), T('foreL~1', [0, 0, 30], 0.25), T('foreR~2', [0, 0, -30], 0.25)), A.par(T('foreR~0', [0, 0, 15], 0.25), T('foreL~1', [0, 0, -15], 0.25), T('foreR~2', [0, 0, 15], 0.25)), home('armR~0', 'foreR~0', 'armL~1', 'foreL~1', 'armR~2', 'foreR~2')],
    [A.par(A.anim('bounce'), Mv('hips~2', [0, 0.18, 0], 0.25), A.say('Welcome to our town!', 2.2)), Mv('hips~2', [0, 0, 0], 0.25)],
  )),
  e('persian', 'town', 'world peoples', () => acts(
    who('persian', { skin: 'skin3', hair: 'black', style: 'short', top: 'teal', bottom: '#7a2e2e', long: true, beard: 'black', acc: [wear('robe', 'teal'), wear('belt', 'gold'), face('beard', 'black'), hb('cyl', [0.95, 0.55, 0.9], [0, 0.72, 0], '#c9a227', { taper: 1.15 }), hb('cyl', [0.97, 0.08, 0.92], [0, 0.5, 0], '#7a2e2e')] }),
    [G('bow', 'Salaam! Welcome, my friend.')],
    give('tea', 'tea', 'Please, have some tea.'),
  )),
  // Arms crossed on the chest holding the crook and flail, under the striped headdress.
  e('pharaoh', 'town', 'history', () => acts(
    rest(who('pharaoh', { skin: 'skin4', hair: 'black', style: 'short', top: 'skin4', bottom: 'white', skirt: 'white', shoes: 'gold', acc: [
      hb('ball', [1.14, 0.72, 1.08], [0, 0.22, -0.03], 'gold'), hb('box', [0.3, 1.0, 0.22], [0.47, -0.32, 0.06], 'gold'), hb('box', [0.3, 1.0, 0.22], [-0.47, -0.32, 0.06], 'gold'),
      hb('box', [0.32, 0.09, 0.24], [0.47, -0.2, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [-0.47, -0.2, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [0.47, -0.5, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [-0.47, -0.5, 0.06], 'blue'),
      hb('capsule', [0.12, 0.4, 0.12], [0, -0.62, 0.32], 'blue'), hb('capsule', [0.08, 0.22, 0.08], [0, 0.5, 0.48], 'gold'),
      bit('torso', 'torus', [3.4, 3.4, 0.4], [0, 6.6, 0.1], 'blue', { srot: [80, 0, 0], tube: 0.45 }), wear('belt', 'gold'),
      crookFlail] }), { L: 'cross', R: 'cross' }),
    [A.par(A.anim('nod'), A.say('I am Pharaoh, lord of the Nile.', 2.4), A.effect('sparkle', { dur: 1.2 }))],
    [G('shake_head', 'Bigger! Build my pyramid BIGGER!')],
  )),
  e('pharmacist', 'town', 'medical', () => acts(
    rest(who('pharmacist', { top: 'white', bottom: 'navy', long: true, glasses: 'black', acc: [wear('labcoat'), wear('badge', 'skyblue'), pills('L'), held('clipboard')] }), { L: 'hold' }),
    [A.say('Shake well before use!', 2), T('foreL', [-22, 0, 0], 0.15), T('foreL', [8, 0, 0], 0.15), T('foreL', [-22, 0, 0], 0.15), T('foreL', [8, 0, 0], 0.15), home('foreL')],
    give('pill', 'pill', 'One a day, with a glass of water.'),
  )),
  e('philosopher', 'town', 'history', () => acts(
    who('philosopher', { skin: 'skin2', hair: 'lightgray', style: 'bald', top: 'white', bottom: 'white', shoes: 'brown', acc: [wear('toga', 'white'), wear('sash', 'skyblue'), face('longbeard', 'lightgray'), held('scroll', undefined, 'L')] }),
    [G('look_around', 'Hmm... but what IS a chair, really?', 2.6)],
    [G('shrug', 'The more I learn, the less I know.', 2.6)],
  )),
  // The camera comes up to the eye and the flash fires.
  e('photographer', 'town', 'arts', () => acts(
    rest(who('photographer', { top: 'black', bottom: 'denim', acc: [wear('vest', '#b9a37a'), hat('beret', 'black'), flashCamera('R'), bit('torso', 'torus', [2.6, 2.6, 0.12], [0, 5.6, 0.2], 'black', { srot: [70, 0, 0], tube: 0.08 })] }), { R: 'hold' }),
    [A.par(arm('R', 'eye', 'hold'), A.say('Say cheese!', 1.8)), A.wait(0.5), A.par(A.operate('flash', 'on'), A.effect('sparkle', { dur: 0.5 })), A.wait(0.4), A.operate('flash', 'off'), A.wait(0.3), armsHome('R')],
    [G('nod', 'Gorgeous! Hold that pose!')],
  )),
  e('physical therapist', 'town', 'medical', () => acts(
    who('physical therapist', { top: 'teal', bottom: 'navy', shoes: 'white', acc: [wear('badge', 'white'), held('ball', '#7fd3c3', 'L'), held('clipboard')] }),
    [G('arms_up', 'And stretch... reach for the sky!')],
    [G('clap', 'Great job! Same time next week.')],
  )),
  // Seated at a grand piano (side on, lid up on its stick): the hands play, a note floats up; the lid closes for a
  // break and opens again.
  e('pianist', 'town', 'music', () => acts(
    pose(seated(who('pianist', { top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [tux(), grandPiano] })), { hips: [0, 90, 0], armL: [-60, 0, 10], armR: [-60, 0, -10], foreL: [-34, 0, -8], foreR: [-34, 0, 8], head: [10, 0, 0] }),
    [A.par(A.say('♪ Plink, plonk... the Moonlight Sonata ♪', 3), A.spawn('n1', 'musical note', { rel: 'above', of: 'self', dist: 'close' })), ...playKeys(8), A.par(home('foreL', 'foreR'), A.remove('n1', 'fly_away'))],
    [A.par(T('head', [0, -65, 0], 0.4), A.anim('nod'), A.say('Thank you, thank you! Encore?', 2.4)), A.wait(0.8), home('head')],
    [A.operate('lid', 'close'), A.say('Lid down: time for a break.', 2), A.wait(2.2), A.operate('lid', 'open')],
  )),
  // The wallet is a piece: it drops, and comes back.
  e('pickpocket', 'town', 'crime', () => acts(
    who('pickpocket', { top: '#5a4a3a', bottom: '#3a3a3a', long: true, acc: [hat('bowler', '#3a3a3a'), wear('scarf', 'red'), wear('coat', '#6b5a3a'), wallet2('R'), bit('handL', 'box', [1.2, 0.9, 0.3], [0, -0.5, 0.9], 'gold', { edge: 'sharp' })] }),
    [G('look_around', 'Nothing to see here... just browsing.')],
    [A.detach('wallet', 'wallet'), G('gasp', "Oops! That one isn't mine, honest!")],
    [A.reattach('wallet'), G('laugh', 'Finders keepers!')],
  )),
  // Plays the pipe and the rats of Hamelin come running.
  e('pied piper', 'town', 'fairy tales', () => acts(
    rest(who('pied piper', { top: 'yellow', bottom: 'red', shoes: 'brown', long: true, legs: 'red', acc: [bands('red', 3), hat('beret', 'red'), hb('capsule', [0.07, 0.6, 0.07], [0.35, 0.85, -0.15], 'white', { srot: [-30, 0, -30] }), pipe('wood', 1.1), rat] }), { R: 'mouth', L: 'mouth' }),
    [A.par(A.say('♪ Tootle-tootle-too ♪', 2.4), A.spawn('r1', 'rat', { rel: 'left', of: 'self', dist: 'near' }), A.spawn('r2', 'rat', { rel: 'right', of: 'self', dist: 'near' })), A.par(A.move('r1', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), A.move('r2', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), T('torso', [0, 0, 6], 0.5)), A.par(T('torso', [0, 0, -6], 0.5), A.say('Follow me, little ones!', 2)), A.wait(1.2), A.par(A.remove('r1', 'sink'), A.remove('r2', 'sink'), home('torso'))],
    [A.par(A.anim('shake_head'), A.say('Pay the piper, Mayor of Hamelin!', 2.6))],
  )),
  e('pilgrim', 'town', 'history', () => acts(
    who('pilgrim', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [collar(2.4), bit('torso', 'box', [0.8, 0.5, 0.2], [0, 0.4, 1.1], 'gold'),
      hb('cyl', [1.6, 0.05, 1.5], [0, 0.5, 0], 'black'), hb('cyl', [0.85, 0.65, 0.8], [0, 0.85, 0], 'black', { taper: 0.85 }), hb('cyl', [0.86, 0.12, 0.81], [0, 0.6, 0], 'darkgray'), hb('box', [0.28, 0.2, 0.05], [0, 0.6, 0.41], 'gold'), held('book', 'black', 'L')] }),
    [G('bow', 'Happy Thanksgiving, neighbour!')],
    give('pie', 'pie', 'Pumpkin pie? I baked it myself.'),
  )),
  // The cutlass goes up; treasure appears and sinks; the parrot hops on the shoulder.
  e('pirate', 'town', 'sailors', () => acts(
    who('pirate', { top: 'white', bottom: 'darkbrown', shoes: 'black', long: true, beard: 'black', acc: [hat('pirate'), face('eyepatch'), face('beard', 'black'), wear('vest', 'darkred'), wear('sash', 'gold'), held('sword'), parrot2] }),
    [A.par(arm('R', 'raise'), A.say('Arr, me hearties!', 2)), A.wait(1.2), armsHome('R')],
    [A.spawn('gold', 'treasure', before), G('arms_up', 'Treasure! Yo ho ho!'), A.wait(0.8), A.remove('gold', 'sink')],
    [A.par(Mv('parrot', [0, 0.1, 0], 0.18), A.say('Squawk! Pieces of eight!', 2)), Mv('parrot', [0, 0, 0], 0.18), Mv('parrot', [0, 0.1, 0], 0.18), Mv('parrot', [0, 0, 0], 0.18)],
  )),
  e('plastic surgeon', 'town', 'medical', () => acts(
    who('plastic surgeon', { top: 'white', bottom: 'skyblue', long: true, acc: [wear('labcoat'), wear('stethoscope'), held('syringe'), mirror('L'), face('glasses')] }),
    [A.par(arm('L', 'offer'), A.say('Take a look... simply perfect!', 2.4)), A.wait(1.6), armsHome('L')],
    [G('wink', 'Not a day over twenty-five!')],
  )),
  // Plunges the drain (the plunger goes down and up) until the water sprays.
  e('plumber', 'town', 'trades', () => acts(
    who('plumber', { top: 'red', bottom: 'blue', shoes: 'brown', acc: [wear('overalls', 'blue'), hat('cap', 'blue'), face('mustache', 'darkbrown'), held('wrench'), plunger('L')] }),
    [A.say('Plunge... plunge...', 1.6), arm('L', 'front', 'down', 0.25), arm('L', 'down', 'down', 0.25), arm('L', 'front', 'down', 0.25), A.par(arm('L', 'down', 'down', 0.25), A.effect('water_spray', { dur: 1.2 })), A.say('Unclogged!', 1.5)],
    [G('thumbs_up', 'Good as new! No more leaks.')],
  )),
  e('poison ivy', 'town', 'villains', () => acts(
    who('poison ivy', { skin: '#e3edc8', hair: '#c0392b', style: 'long', top: 'darkgreen', bottom: 'darkgreen', shoes: 'green', long: true, acc: [leaves('leaf', 6), hb('ball', [0.35, 0.18, 0.2], [0.3, 0.5, 0.3], 'leaf'), held('bouquet', undefined, 'L')] }),
    [A.par(A.anim('wink'), A.say('Care for a kiss, darling?', 2.2), A.effect('hearts', { dur: 1.5 }))],
    [A.spawn('trap', 'venus flytrap', before), G('arms_up', 'Rise, my pretties!'), A.wait(1), A.remove('trap', 'sink')],
  )),
  e('police officer', 'town', 'law and order', () => acts(
    who('police officer', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('police'), wear('badge'), wear('belt', 'black'), walkie('L')] }),
    [A.par(arm('R', 'stop'), A.say('Halt! Police!', 2)), A.wait(1.2), armsHome('R')],
    [G('point', 'Move along, please. Nothing to see.')],
    [A.par(arm('L', 'eye'), A.say('Dispatch, all clear. Over.', 2.4)), A.wait(1.6), armsHome('L')],
  )),
  e('policeman', 'town', 'law and order', () => acts(
    who('policeman', { top: 'skyblue', bottom: 'navy', shoes: 'black', style: 'short', acc: [hat('police'), wear('badge'), wear('tie', 'navy'), wear('belt', 'black'), face('mustache'), held('baton', 'black')] }),
    [A.par(arm('L', 'mouth'), A.say('Tweeeet!', 1.2)), A.wait(0.5), A.par(arm('L', 'stop'), A.say('Stop right there!', 2)), A.wait(1.2), armsHome('L')],
    [G('nod', 'Evening. Everything all right here?')],
  )),
  e('policewoman', 'town', 'law and order', () => acts(
    rest(who('policewoman', { top: 'skyblue', bottom: 'navy', skirt: 'navy', shoes: 'black', style: 'bun', h: 1.65, acc: [hat('police'), wear('badge'), wear('tie', 'navy'), held('book', 'black'), walkie('L')] }), { R: 'hold' }),
    [A.par(A.anim('nod'), A.say('License and registration, please.', 2.4))],
    give('tk', 'parking ticket', "That's a parking ticket, I'm afraid.", 'R', 'hold'),
  )),
  e('politician', 'town', 'government', () => acts(
    who('politician', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'gray', style: 'short', acc: [front('red'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'blue'), held('briefcase', 'black', 'L')] }),
    [G('wave', 'Vote for me on Tuesday!')],
    [A.par(arm('R', 'offer'), A.say('Pleased to meet you! Can I count on your vote?', 2.6)), A.wait(1.8), armsHome('R')],
    [G('thumbs_up', 'Free ice cream for everyone!')],
  )),
  e('pool boy', 'town', 'services', () => acts(
    who('pool boy', { ...shorts('skin3'), top: 'white', bottom: 'skyblue', shoes: 'white', hair: 'gold', acc: [face('sunglasses'), held('net', 'skyblue')] }),
    [A.par(A.anim('thumbs_up'), A.say('Pool is sparkling clean!', 2.2), A.effect('sparkle', { dur: 1.2 }))],
    [A.spawn('ball', 'beach ball', before), G('point', 'No ball games in the pool, please.'), A.remove('ball', 'pop')],
  )),
  // Lines up the cue and sinks the ball.
  e('pool shark', 'town', 'games', () => acts(
    who('pool shark', { top: 'white', bottom: 'black', shoes: 'black', long: true, hair: 'black', acc: [wear('vest', 'black'), wear('bowtie', 'red'), bit('handR', 'capsule', [0.3, 14, 0.3], [0, 3.5, 0.5], 'wood', { srot: [0, 0, 8] }), bit('handR', 'capsule', [0.32, 0.6, 0.32], [-1.4, 10.4, 0.5], 'white'), bit('handL', 'box', [0.6, 0.6, 0.6], [0, -0.5, 0.9], 'blue')] }),
    [A.par(A.say('Eight ball, corner pocket.', 2.4), A.spawn('b8', 'pool ball', before)), A.par(arm('R', 'front', 'down', 0.15), A.move('b8', { rel: 'away', of: 'self', dist: 'near' }, { speed: 'run', style: 'slide' })), A.par(A.remove('b8', 'sink'), armsHome('R'))],
    [G('laugh', "Beginner's luck... sure.")],
  )),
  e('poseidon', 'fantasy', 'gods', () => acts(
    who('poseidon', { h: 1.95, build: 1.3, skin: 'skin3', hair: 'white', style: 'long', top: 'skin3', bottom: 'teal', skirt: 'teal', shoes: 'gold', acc: [wear('sash', 'teal'), face('longbeard', 'white'), hat('crown'), held('trident')] }),
    [A.par(arm('R', 'up'), A.say('I rule the seven seas!', 2.2), A.effect('water_spray', { dur: 2 })), A.wait(0.8), armsHome('R')],
    [A.par(A.anim('point'), A.say('Waves, be still!', 2), A.effect('rain', { dur: 2 }))],
  )),
  e('postman', 'town', 'services', () => acts(
    who('postman', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), satchel('brown')] }),
    give('mail', 'letter', 'Special delivery for you!', 'L'),
    [G('wave', 'Have a nice day!')],
  )),
  e('president', 'town', 'government', () => acts(
    who('president', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'gray', style: 'short', acc: [front('red'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'red'), usflag('L')] }),
    [G('wave', 'My fellow citizens!')],
    [G('point', 'Ask what you can do for your country!', 2.6)],
  )),
  // Blesses with a raised hand; a dove flies up.
  e('priest', 'town', 'religion', () => acts(
    who('priest', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [wear('robe', 'black'), collar(0.55), cross('gold'), held('book', 'black', 'L')] }),
    [A.par(arm('R', 'stop'), A.say('Bless you, my child.', 2.2)), A.wait(1.2), armsHome('R')],
    [A.spawn('dove', 'dove', { rel: 'above', of: 'self', dist: 'close' }), G('arms_up', 'Peace be with you.'), A.remove('dove', 'fly_away')],
  )),
  e('prince', 'town', 'royalty', () => acts(
    who('prince', { top: 'blue', bottom: 'white', shoes: 'brown', long: true, style: 'short', acc: [hat('crown'), wear('cape', 'red'), wear('sash', 'gold'), wear('belt', 'brown'), buttons('gold'), held('sword')] }),
    [G('bow', 'May I have this dance?')],
    give('slipper', 'glass slipper', 'Does this glass slipper fit you?', 'L'),
  )),
  e('princess', 'town', 'royalty', () => acts(
    who('princess', { top: 'pink', skirt: 'pink', bottom: 'pink', long: true, hair: 'gold', style: 'long', h: 1.65, acc: [wear('robe', 'pink'), hat('tiara', 'gold'), wear('necklace', 'white'), held('wand', undefined, 'L')] }),
    [G('wave', 'Hello, my loyal subjects!')],
    [A.par(arm('L', 'offer'), A.effect('sparkle', { dur: 1.5 }), A.say('Make a wish!', 2)), A.wait(1.2), armsHome('L')],
    [G('bow', 'A curtsy, just for you.')],
  )),
  e('princess peach', 'town', 'video game characters', () => acts(
    who('princess peach', { top: '#f7a1c4', skirt: '#f7a1c4', bottom: '#f7a1c4', long: true, hair: '#f4d35e', style: 'long', skin: 'skin1', eyes: 'blue', h: 1.6, acc: [wear('robe', '#f7a1c4'), hat('crown', 'gold'), bit('torso', 'ball', [0.7, 0.7, 0.4], [0, 6.0, 1.1], 'blue'), bit('torso', 'ball', [1.3, 1.1, 1.3], [1.9, 6.6, 0], '#f7a1c4'), bit('torso', 'ball', [1.3, 1.1, 1.3], [-1.9, 6.6, 0], '#f7a1c4'), bit('hips', 'cyl', [4.6, 0.5, 3.4], [0, -2.5, 0], '#e97fab'), gloves('white')] }),
    [G('wink', 'Thank you, Mario!')],
    give('cake', 'cake', 'I baked you a cake!'),
    [A.par(A.anim('hop'), A.say('Yahoo!', 1.5))],
  )),
  e('principal', 'town', 'school', () => acts(
    who('principal', { top: 'darkgray', bottom: 'darkgray', shoes: 'black', long: true, hair: 'gray', style: 'short', glasses: 'black', acc: [front('navy'), face('glasses'), held('clipboard', undefined, 'L')] }),
    [G('wave', 'Good morning, students!')],
    [G('hands_on_hips', 'Running in the halls? My office. NOW!', 2.6)],
  )),
  // Prisoner 24601, ball and chain at the ankle.
  e('prisoner', 'town', 'crime', () => acts(
    who('prisoner', { top: 'orange', bottom: 'orange', shoes: 'white', long: true, style: 'short', acc: [chest('24601', 'white', 2.4, 0.9), ballChain] }),
    [G('shake_head', "I'm innocent, I tell you!")],
    [G('cry', 'Nineteen years... for a loaf of bread!', 2.6)],
  )),
  // Hands up at rest: he has surrendered.
  e('prisoner of war', 'town', 'military', () => acts(
    rest(who('prisoner of war', { top: '#6b7048', bottom: '#5c5f3c', shoes: 'darkbrown', long: true, style: 'short', acc: [hat('headband', 'white'), wear('necklace', 'silver'), bit('torso', 'box', [1.0, 0.6, 0.2], [-0.8, 3.0, 1.08], '#4a4c30')] }), { L: 'up', R: 'up' }),
    [A.par(A.anim('shake_head'), A.say("Don't shoot! I surrender!", 2.2))],
    [A.par(A.anim('nod'), A.say('Name, rank and number. That is all I can say.', 2.8))],
  )),
  e('professional', 'town', 'office', () => acts(
    who('professional', { top: '#3d4552', bottom: '#3d4552', shoes: 'black', long: true, acc: [front('blue'), held('briefcase'), held('phone', undefined, 'L')] }),
    [A.par(arm('L', 'eye'), A.say("Let's circle back on that. Ping me.", 2.6)), A.wait(1.6), armsHome('L')],
    [G('thumbs_up', "Synergy! Let's make it happen.")],
  )),
  e('professor', 'town', 'school', () => acts(
    who('professor', { top: '#8a6a4a', bottom: 'brown', shoes: 'darkbrown', long: true, hair: 'lightgray', style: 'bald', beard: 'lightgray', acc: [wear('vest', '#6b5a3a'), wear('bowtie', 'red'), face('beard', 'lightgray'), face('glasses'), held('book', 'darkred', 'L'), held('pointer')] }),
    [G('point', 'Pop quiz! Page forty-two.')],
    [G('look_around', 'Hmm... now where did I put my glasses?', 2.6)],
  )),
  // Laptop on the left forearm; types, shrugs, cheers.
  e('programmer', 'town', 'office', () => acts(
    rest(who('programmer', { top: '#4a4f5c', bottom: 'denim', shoes: 'white', long: true, glasses: 'black', acc: [hoodDown('#4a4f5c'), face('glasses'), hat('headphones', 'black'), laptop('L')] }), { L: 'hold' }),
    [A.par(arm('R', 'hold'), A.say('Tap tap tap... clickety-clack...', 2.4)), T('foreR', [-8, 0, 0], 0.15), T('foreR', [6, 0, 0], 0.15), T('foreR', [-8, 0, 0], 0.15), T('foreR', [6, 0, 0], 0.15), armsHome('R')],
    [G('shrug', 'It works on my machine!')],
    [A.par(A.anim('nod'), A.say('It compiles! Ship it!', 2))],
  )),
  // Holds the placard up high and chants.
  e('protester', 'town', 'activism', () => acts(
    who('protester', { top: 'green', bottom: 'denim', shoes: 'white', acc: [hat('cap', 'red'), placard('SAVE THE PARK!', 'white')] }),
    [A.par(arm('R', 'fist'), A.say('What do we want? A PARK!', 2)), arm('R', 'down', 'down', 0.3), A.par(arm('R', 'fist'), A.say('When do we want it? NOW!', 2)), A.wait(0.6), armsHome('R')],
    [G('clap', 'Hey hey, ho ho! The bulldozers have to go!', 2.6)],
  )),
  e('psychologist', 'town', 'medical', () => acts(
    rest(who('psychologist', { top: '#c9b28a', bottom: 'brown', skirt: 'brown', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), held('clipboard'), wear('scarf', 'teal')] }), { R: 'hold' }),
    [A.par(A.anim('nod'), A.say('And how does that make you feel?', 2.6))],
    [A.par(arm('L', 'chin'), A.say('Hmm. Tell me about your childhood.', 2.6)), A.wait(1.6), armsHome('L')],
  )),
  // Strums the guitar and jumps.
  e('punk rocker', 'town', 'music', () => acts(
    rest(who('punk rocker', { top: 'black', bottom: '#8a1f2a', shoes: 'black', long: true, style: 'bald', hair: 'magenta', acc: [hat('mohawk', 'magenta'), shoulderSpikes(), wear('belt', 'silver'), held('guitar', 'red'), rips('#2a2a2a')] }), { R: 'hold' }),
    [A.say('Oi! Oi! Oi!', 2), ...strum(6)],
    [A.par(A.anim('hop'), A.say('Anarchy in the town square!', 2.2))],
  )),
  // A marionette (0.6 m) hanging from its control bar: it dances, and the bar tilts.
  e('puppet', 'toys', 'puppets', () => acts(
    scale(who('puppet', { h: 'kid', skin: 'lightwood', hair: 'darkbrown', style: 'short', top: 'red', bottom: 'blue', shoes: 'darkbrown', blush: 'red', acc: [hat('party', 'yellow'), wear('bowtie', 'yellow'), (p, d) => {
      const yb = d.torsoH + d.headY + d.headH * 0.5 + d.H * 0.35, x = d.tw / 2 + d.aw * 0.3;
      put(p, 'torso', 'box', [d.tw * 2.2, d.aw * 0.4, d.aw * 0.4], [0, yb, 0], 'wood', { name: 'bar', piece: true, edge: 'sharp' });
      put(p, 'bar', 'box', [d.aw * 0.4, d.aw * 0.4, d.tw * 1.4], [0, 0, 0], 'wood', { edge: 'sharp' });
      for (const s of [1, -1]) put(p, 'torso', 'capsule', [0.012, yb - d.torsoH, 0.012], [s * x, (yb + d.torsoH) / 2, 0], 'white');
    }] }), 0.6 / 1.35),
    [A.par(A.anim('dance'), A.say('Look at me, I can dance!', 2.2), T('bar', [0, 0, 18], 0.4)), T('bar', [0, 0, -18], 0.4), home('bar')],
    [A.par(A.anim('hop'), A.say("I've got no strings... oh, wait.", 2.4))],
  )),
  e('queen', 'town', 'royalty', () => acts(
    who('queen', { top: 'purple', skirt: 'purple', bottom: 'purple', long: true, hair: 'lightgray', style: 'bun', h: 1.7, acc: [wear('robe', 'purple'), wear('cape', 'darkred'), hat('crown'), wear('necklace', 'white'), gloves('white'), held('staff', 'gold')] }),
    [G('wave', 'One is most amused.')],
    [A.par(A.anim('nod'), A.say('Good day to you, loyal subject.', 2.4))],
  )),
  // The trophy goes up overhead.
  e('racecar driver', 'town', 'sports', () => acts(
    who('racecar driver', { top: 'red', bottom: 'red', shoes: 'black', long: true, acc: [wear('sash', 'white'), chest('7', 'white', 1.0, 1.0, 5.6), wear('belt', 'black'), helmetHeld('red', 'L'), held('trophy')] }),
    [A.par(arm('R', 'up'), A.say('Victory! First place!', 2.2), A.effect('sparkle', { dur: 1.5 })), A.wait(1), armsHome('R')],
    [G('thumbs_up', 'Zoom zoom! Fastest lap of the day!')],
  )),
  e('radiologist', 'town', 'medical', () => acts(
    who('radiologist', { top: 'white', bottom: 'teal', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), wear('badge', 'skyblue'), xray('L')] }),
    [A.par(arm('L', 'offer'), A.say('Good news: nothing is broken!', 2.4)), A.wait(1.6), armsHome('L')],
    [G('point', 'See that little bone? Perfectly fine.')],
  )),
  // The sign turns round from FOR SALE to SOLD!, then back while the keys are handed over.
  e('real estate agent', 'town', 'sales', () => acts(
    who('real estate agent', { top: 'navy', bottom: 'tan', skirt: 'tan', long: true, style: 'bun', acc: [front('', 'white'), wear('badge', 'white'), flipSign('FOR SALE', 'SOLD!', 'white', '#d93a3a'), bit('handL', 'box', [0.35, 1.2, 0.15], [0, -0.4, 0.9], 'gold'), bit('handL', 'torus', [0.8, 0.8, 0.15], [0, 0.45, 0.9], 'gold', { tube: 0.3 })] }),
    [A.par(T('sign', [0, 180, 0], 0.6), A.say('SOLD! Congratulations on your new home!', 2.6)), A.anim('nod')],
    [A.par(T('sign', [0, 0, 0], 0.6), arm('L', 'offer'), A.say('And here are your keys!', 2.2)), A.wait(1.4), armsHome('L')],
  )),
  e('rebel', 'town', 'activism', () => acts(
    who('rebel', { top: 'black', bottom: 'denim', shoes: 'black', long: true, acc: [hat('bandana', 'red'), wear('scarf', 'red'), wear('belt', 'silver'), held('flag', 'black')] }),
    [A.par(arm('L', 'fist'), A.say('Down with the empire!', 2.2)), A.wait(1), armsHome('L')],
    [G('point', 'To the hideout, quick!')],
  )),
  // Salutes, then marches on the spot.
  e('redcoat', 'town', 'history', () => acts(
    who('redcoat', { top: 'red', bottom: 'white', shoes: 'black', long: true, hair: 'white', style: 'ponytail', acc: [tricorn(), wear('sash', 'white'), bit('torso', 'box', [0.7, 8.4, 2.4], [0, 3.5, 0], 'white', { srot: [0, 0, -35] }), wear('belt', 'white'), buttons('gold'), stickUp('R', 12, 'darkwood', 0.35), bit('handR', 'capsule', [0.2, 3, 0.2], [0, 13.2, 0.4], 'silver')] }),
    [A.par(arm('L', 'salute'), A.say('For King and country!', 2.2)), A.wait(1), armsHome('L')],
    [A.say('Left, right, left, right!', 2.4), ...march(6)],
  )),
  // Holds up the yellow card, then points to the spot.
  e('referee', 'town', 'sports', () => acts(
    who('referee', { top: 'white', bottom: 'black', shoes: 'black', acc: [bands('black', 5), wear('whistle'), bit('handL', 'box', [0.9, 1.3, 0.12], [0, 1.1, 0.6], 'yellow', { edge: 'sharp' })] }),
    [A.par(arm('R', 'mouth'), A.say('Tweeeet!', 1)), A.wait(0.4), A.par(arm('R', 'down', 'down', 0.3), arm('L', 'up'), A.say('Foul! Yellow card!', 2.2)), A.wait(1.2), armsHome()],
    [G('point', 'Penalty! On the spot.')],
  )),
  e('revolutionary', 'town', 'history', () => acts(
    who('revolutionary', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, hair: 'black', style: 'long', beard: 'black', acc: [hat('beret', 'black'), hb('ball', [0.14, 0.14, 0.06], [0.05, 0.58, 0.42], 'red'), face('beard', 'black'), wear('belt', 'darkbrown'), held('flag', 'red')] }),
    [A.par(arm('L', 'fist'), A.say('Liberty for all!', 2.2)), A.wait(1), armsHome('L')],
    [G('arms_up', 'The people have spoken!')],
  )),
  // A robot person: a hard shell, a box head with a visor and glowing eyes, chest lights; eyes and lights all go out
  // when it powers down, and come back on.
  e('robot', 'fantasy', 'robots', () => acts(
    hard(who('robot', { skin: 'silver', style: 'none', top: 'steel', bottom: 'steel', shoes: 'darkgray', long: true, eyes: 'cyan', blush: 'silver', acc: [hat('antennae', 'red'), hb('box', [1.04, 0.98, 1.0], [0, 0.02, 0], 'silver', { round: 0.25 }), hb('box', [0.78, 0.36, 0.06], [0, 0.06, 0.5], '#2a2e36', { round: 0.3 }), ...[1, -1].map((x) => hb('ball', [0.2, 0.16, 0.06], [x * 0.19, 0.06, 0.53], 'cyan', { role: 'glow', name: `lightEye${x > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: true } })), ...[-1, 0, 1].map((x) => hb('box', [0.08, 0.1, 0.04], [x * 0.12, -0.27, 0.51], '#2a2e36')), hb('cyl', [0.22, 0.15, 0.22], [0.56, 0, 0], 'darkgray', { srot: [0, 0, 90] }), hb('cyl', [0.22, 0.15, 0.22], [-0.56, 0, 0], 'darkgray', { srot: [0, 0, 90] }), bit('torso', 'box', [2.0, 1.8, 0.3], [0, 4.6, 1.05], 'darkgray', { edge: 'sharp' }), ...['red', 'lime', 'yellow'].map((c, i) => bit('torso', 'ball', [0.4, 0.4, 0.2], [(i - 1) * 0.6, 4.9, 1.25], c, { role: 'glow', name: `light${i}`, mover: { kind: 'light', on: true } })), wear('belt', 'darkgray'), bracers('darkgray')] })),
    [A.par(A.anim('dance'), A.say('Beep boop! Robot dance!', 2.2))],
    [A.operate('light', 'off'), A.par(A.anim('wobble'), A.say('Powering down... zzt.', 1.8)), A.wait(1.6), A.operate('light', 'on'), A.par(A.anim('bounce'), A.say('Systems online!', 1.8))],
  )),
  e('rock star', 'town', 'music', () => acts(
    rest(who('rock star', { top: 'black', bottom: '#4b2a6b', shoes: 'black', long: true, hair: 'gold', style: 'long', acc: [face('sunglasses'), wear('necklace', 'silver'), wear('belt', 'silver'), held('guitar', 'darkred')] }), { R: 'hold' }),
    [A.par(A.anim('bounce'), A.say('Hello, Springfield! Are you ready to ROCK?!', 2.6))],
    [A.say('♪ Wah-wah-WAAAAH! ♪', 2.2), ...strum(6), A.anim('hop')],
  )),
  // The model rocket (a joint, 'toy') blasts off out of the hand and comes back down.
  e('rocket scientist', 'town', 'science', () => acts(
    rest(who('rocket scientist', { top: 'white', bottom: 'navy', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), wear('badge', 'blue'), toyRocket('L'), held('clipboard')] }), { L: 'carry' }),
    [A.say('Three... two... one...', 1.8), A.wait(1.4), A.par(Mv('toy', [0, 1.6, 0], 1.2), A.effect('smoke', { dur: 1.4 }), A.say('Liftoff!', 1.5)), A.wait(0.6), Mv('toy', [0, 0, 0], 0.8)],
    [G('shrug', "Well, it IS rocket science.")],
  )),
  e('rogue', 'town', 'crime', () => acts(
    who('rogue', { top: 'darkbrown', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', '#2f3d2f'), wear('cloak', '#2f3d2f'), face('mask', 'black'), wear('belt', 'brown'), held('knife'), held('knife', undefined, 'L')] }),
    [A.par(arm('L', 'mouth'), A.say('Shh...', 1.5)), A.wait(1), armsHome('L')],
    [A.par(A.anim('spin'), A.say('Now you see me...', 1.6)), A.par(A.anim('laugh'), A.say("...now you don't!", 1.6))],
  )),
  e('roller skater', 'town', 'sports', () => acts(
    lift(who('roller skater', { h: 1.7, ...shorts('skin2'), top: 'magenta', bottom: 'skyblue', style: 'ponytail', hair: 'darkbrown', acc: [hat('helmet', 'cyan'), skates('pink'), kneepads('black')] }), 0.107),
    [A.par(A.anim('spin'), A.say('Wheee!', 1.5))],
    [G('dance', 'Roller disco!')],
  )),
  // Stamps his foot; spins a bale of hay into gold.
  e('rumpelstiltskin', 'town', 'fairy tales', () => acts(
    scale(who('rumpelstiltskin', { h: 'kid', skin: 'skin2', hair: '#a0522d', style: 'short', top: 'darkred', bottom: 'brown', shoes: 'darkbrown', long: true, acc: [hat('wizard', '#8a5a2b'), face('longbeard', '#a0522d'), hb('ball', [0.26, 0.22, 0.3], [0, -0.06, 0.5], 'skin2'), wear('belt', 'black'), held('ball', 'gold')] }), 1.15 / 1.35),
    [G('hands_on_hips', 'Guess my name! You never will!')],
    [A.spawn('straw', 'hay', before), A.par(A.anim('dance'), A.say('Spin, spin, straw into gold!', 2.2), A.effect('sparkle', { dur: 1.5 })), A.morph('gold', 'straw'), A.wait(1.2), A.remove('straw', 'pop')],
  )),
  e('sailor', 'town', 'sailors', () => acts(
    who('sailor', { top: 'white', bottom: 'white', shoes: 'black', style: 'short', acc: [sailorHat, bit('torso', 'box', [3.2, 1.8, 0.3], [0, 6.2, -1.1], 'navy'), wear('scarf', 'navy')] }),
    [A.par(arm('R', 'salute'), A.say('Aye aye, captain!', 2)), A.wait(1), armsHome('R')],
    [G('dance', "♪ Yo ho, the sailor's hornpipe! ♪")],
  )),
  // Bows, then draws and raises the katana.
  e('samurai', 'town', 'history', () => acts(
    who('samurai', { top: '#2b2b40', bottom: '#3a3a5a', shoes: 'darkbrown', long: true, hair: 'black', style: 'bun', acc: [wear('armor', 'darkred'), bit('hips', 'cyl', [4.8, 5.4, 3.6], [0, -2.6, 0], '#3a3a5a', { taper: 0.75 }), wear('belt', 'white'), held('sword', 'silver'), bit('hips', 'capsule', [0.3, 4.5, 0.3], [1.6, 0.5, 0.8], 'black', { srot: [60, 0, 20] }), hat('headband', 'white')] }),
    [G('bow', 'Konnichiwa.')],
    [A.par(arm('R', 'raise'), A.say('Hai!', 1.5)), A.wait(1), armsHome('R')],
  )),
  e('sandman', 'fantasy', 'spirits', () => acts(
    who('sandman', { top: 'navy', bottom: 'navy', long: true, hair: 'white', style: 'short', acc: [wear('robe', 'navy'), hat('santa', 'navy'), face('longbeard', 'white'), starDots(), bit('handL', 'ball', [2.6, 3.0, 2.2], [0, -1.6, 1.0], 'tan'), bit('handL', 'ball', [0.8, 0.7, 0.8], [0, 0, 1.0], 'tan'), ...[0, 1, 2].map((i) => bit('handR', 'ball', [0.35, 0.35, 0.35], [0, -1.0 - i * 0.9, 1.0 + i * 0.2], 'gold', { role: 'glow' }))] }),
    [A.par(arm('R', 'offer'), A.effect('sparkle', { dur: 2 }), A.say('Sprinkle, sprinkle... sweet dreams.', 2.6)), A.wait(1.4), armsHome('R')],
    [A.par(A.expr('sleepy'), A.anim('nod'), A.say('Shh... time for bed.', 2.2))],
  )),
  e('santa', 'town', 'holidays', () => acts(
    who('santa', { h: 1.8, build: 1.35, skin: 'skin1', top: 'red', bottom: 'red', shoes: 'black', long: true, hair: 'white', blush: '#f08080', acc: [hat('santa'), face('longbeard', 'white'), face('mustache', 'white'), bit('torso', 'ball', [3.0, 3.6, 2.0], [0, 2.8, 0.5], 'red'), bit('torso', 'cyl', [3.9, 0.7, 2.6], [0, 0.2, 0], 'white'), wear('belt', 'black'), bit('hips', 'box', [1.0, 0.9, 0.3], [0, 0.55, 1.3], 'gold'), gloves('black'), sack()] }),
    [G('laugh', 'Ho ho ho!')],
    give('gift', 'gift', 'Merry Christmas! Have you been good?'),
  )),
  // Plays and sways with the music.
  e('saxophonist', 'town', 'music', () => acts(
    rest(who('saxophonist', { top: 'purple', bottom: 'black', shoes: 'black', long: true, acc: [fedora('black'), face('sunglasses'), sax] }), { L: 'hold', R: 'hold' }),
    [A.par(A.say('♪ Smooth jazz, baby... ♪', 2.6), T('torso', [0, 0, 7], 0.6)), T('torso', [0, 0, -7], 0.8), T('torso', [0, 0, 7], 0.8), home('torso')],
    [A.par(A.anim('bounce'), A.say('Be-bop-a-doo-wah!', 2.2))],
  )),
  e('school boy', 'town', 'school', () => acts(
    who('school boy', { h: 'kid', ...shorts('skin2'), top: 'white', bottom: 'navy', shoes: 'black', style: 'short', acc: [wear('tie', 'red'), wear('backpack', 'red'), hat('cap', 'navy')] }),
    [A.par(arm('R', 'up'), A.say('Ooh! Me! I know the answer!', 2.2)), A.wait(1.2), armsHome('R')],
    [G('wave', 'Bye, Mum! See you after school!')],
  )),
  e('school girl', 'town', 'school', () => acts(
    who('school girl', { h: 'kid', top: 'white', skirt: 'navy', bottom: 'navy', legs: 'white', shoes: 'black', style: 'pigtails', acc: [wear('bowtie', 'red'), wear('backpack', 'pink'), held('book', 'red')] }),
    [G('arms_up', 'Yay, recess!')],
    [A.par(A.anim('hop'), A.say('Hop, skip and a jump!', 2))],
  )),
  // The flask fizzes, then goes pop.
  e('science teacher', 'town', 'school', () => acts(
    who('science teacher', { top: 'white', bottom: 'brown', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), flask('L', 'lime'), held('pointer')] }),
    [A.par(arm('L', 'offer'), A.say('Observe the reaction, class!', 2.2), A.effect('steam', { dur: 2 })), A.wait(1.2), armsHome('L')],
    [A.par(A.effect('explosion', { dur: 0.8 }), A.anim('gasp'), A.say('Oops! Safety goggles on, everyone!', 2.4))],
  )),
  e('scientist', 'town', 'science', () => acts(
    who('scientist', { top: 'white', bottom: 'darkgray', long: true, hair: 'white', style: 'spiky', acc: [wear('labcoat'), face('goggles'), tube('R', 'cyan'), tube('L', 'magenta')] }),
    [A.par(arms('offer'), A.say('Now... just one drop of this...', 2.2)), A.wait(0.6), A.effect('sparkle', { dur: 1.2 }), armsHome()],
    [G('arms_up', 'Eureka! It works!')],
  )),
  e('scuba diver', 'town', 'sports', () => acts(
    who('scuba diver', { top: 'black', bottom: 'black', shoes: 'yellow', long: true, acc: [face('goggles', 'cyan'), face('snorkel', 'yellow'), wear('vest', '#2b4a6b'), body('jetpack', 'yellow'), flippers('yellow'), wear('belt', 'yellow')] }),
    [A.par(arms('fist'), A.say('All clear down there! O.K.!', 2)), A.wait(1), armsHome()],
    [A.spawn('bub', 'bubbles', { rel: 'above', of: 'self', dist: 'close' }), G('wave', 'Blub, blub!'), A.remove('bub', 'fly_away')],
  )),
  // Taps the chisel on the bust; dust flies.
  e('sculptor', 'town', 'arts', () => acts(
    who('sculptor', { top: 'cream', bottom: 'brown', long: true, beard: 'darkbrown', acc: [wear('apron', 'lightgray'), hat('beret', 'black'), face('beard', 'darkbrown'), held('hammer'), chisel('L'), bust] }),
    [A.say('Tap... tap... tap...', 2), ...knock('R', 3), A.par(A.effect('dust', { dur: 1 }), A.say('A masterpiece!', 1.8))],
    [G('clap', 'Magnificent, if I say so myself!')],
  )),
  e('secret agent', 'town', 'spies', () => acts(
    who('secret agent', { top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [front('black'), face('sunglasses'), earpiece, held('blaster', 'black')] }),
    [A.par(arm('L', 'eye'), A.say('Agent in position. Over.', 2.2)), A.wait(1.2), armsHome('L')],
    [G('look_around', 'The name is Agent. Secret Agent.')],
  )),
  e('secretary', 'town', 'office', () => acts(
    who('secretary', { top: 'white', skirt: 'darkgray', bottom: 'darkgray', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), held('clipboard'), held('phone', undefined, 'L'), wear('necklace', 'white')] }),
    [A.par(arm('L', 'eye'), A.say('Good morning, how may I help you?', 2.4)), A.wait(1.4), armsHome('L')],
    [A.par(A.anim('nod'), A.say("I'll put you right through.", 2.2))],
  )),
  // The torch beam switches on.
  e('security guard', 'town', 'law and order', () => acts(
    who('security guard', { top: 'black', bottom: 'black', shoes: 'black', build: 1.25, h: 1.78, acc: [hat('cap', 'black'), chest('SECURITY', 'yellow', 2.6, 0.8, 5.3), wear('belt', 'darkgray'), torch2('R'), walkie('L')] }),
    [A.par(arm('R', 'offer'), A.operate('beam', 'on'), A.say("Hello? Who's there?", 2)), A.wait(1.6), A.par(A.operate('beam', 'off'), armsHome('R'))],
    [G('hands_on_hips', "Sorry, you can't come in here.")],
  )),
  e('sergeant', 'town', 'military', () => acts(
    who('sergeant', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, acc: [hat('cowboy', '#8a7a4a'), armRings('yellow', 3), wear('whistle'), wear('belt', 'black'), held('clipboard', undefined, 'L')] }),
    [G('point', 'Drop and give me twenty!')],
    [A.par(arm('R', 'mouth'), A.say('Tweeeet! Fall in!', 2)), A.wait(0.8), armsHome('R')],
  )),
  // Kept unsettling rather than gory: gloves, a long coat, a quiet laugh.
  e('serial killer', 'town', 'crime', () => acts(
    who('serial killer', { top: '#3a3a3a', bottom: 'black', shoes: 'black', long: true, acc: [hat('beanie', 'black'), wear('coat', '#2a2a2a'), gloves('black')] }),
    [G('look_around', 'Nice night for a walk, isn\'t it?')],
    [A.par(A.anim('laugh'), A.expr('angry'), A.say('Heh... heh... heh...', 2))],
  )),
  e('shakespeare', 'town', 'history', () => acts(
    who('shakespeare', { skin: 'skin1', top: 'black', bottom: 'black', legs: 'black', long: true, style: 'bald', hair: 'brown', acc: [ruff(), sideHair('brown'), face('mustache', 'brown'), hb('ball', [0.2, 0.2, 0.15], [0, -0.48, 0.38], 'brown'), hb('ball', [0.07, 0.07, 0.07], [-0.5, -0.2, 0], 'gold'), bit('hips', 'ball', [4.0, 2.4, 2.8], [0, -0.6, 0], 'black'), quill('R'), held('scroll', undefined, 'L')] }),
    [G('look_around', 'To be, or not to be...')],
    [G('bow', "All the world's a stage!")],
  )),
  e('sheik', 'town', 'royalty', () => acts(
    who('sheik', { top: 'white', bottom: 'white', shoes: 'brown', long: true, hair: 'black', beard: 'black', acc: [wear('robe', 'white'), wear('cape', 'black'), hat('hood', 'white'), agal, face('beard', 'black'), face('mustache', 'black')] }),
    [G('bow', 'As-salamu alaykum. Welcome!')],
    [A.spawn('camel', 'camel', { rel: 'left', of: 'self', dist: 'near' }), G('point', 'Behold, my finest camel!'), A.wait(1), A.remove('camel', 'fade')],
  )),
  // The lamb (a joint) hops and bleats.
  e('shepherd', 'town', 'farming', () => acts(
    who('shepherd', { top: '#8a6a4a', bottom: '#8a6a4a', shoes: 'brown', long: true, beard: 'darkbrown', acc: [wear('robe', '#9a7a55'), hat('hood', 'cream'), hat('headband', 'brown'), face('beard', 'darkbrown'), crook('R', 11, 'wood'), lamb2] }),
    [A.par(Mv('lamb', [0, 0.22, 0], 0.22), A.say('Baa!', 1.2)), Mv('lamb', [0, 0, 0], 0.22), A.par(A.anim('nod'), A.say('There, there, little one.', 2))],
    [G('wave', 'Come by, flock! Home we go!')],
  )),
  // Tips his hat (a joint, 'stetson').
  e('sheriff', 'town', 'law and order', () => acts(
    who('sheriff', { top: 'cream', bottom: 'denim', shoes: 'brown', long: true, acc: [stetson('#8a5a2b'), wear('vest', 'brown'), starBadge('gold'), face('mustache'), wear('belt', 'darkbrown'), held('blaster', 'darkgray')] }),
    [A.par(TM('stetson', [-22, 0, 0], [0, 0.03, 0.02], 0.3), arm('L', 'salute'), A.say('Howdy, partner.', 2)), A.wait(1), A.par(home('stetson'), armsHome('L'))],
    [G('hands_on_hips', "This town ain't big enough for the two of us.", 2.8)],
  )),
  // The telescope comes up to the eye.
  e('ship captain', 'town', 'sailors', () => acts(
    who('ship captain', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'white', beard: 'white', acc: [hat('police', 'white'), hb('box', [0.25, 0.15, 0.05], [0, 0.6, 0.47], 'gold'), face('beard', 'white'), buttons(), telescope('R')] }),
    [A.par(arm('R', 'eye'), A.say('Land ho!', 2)), A.wait(1.4), armsHome('R')],
    [G('point', 'Full steam ahead!')],
  )),
  // Taps the sole with the hammer and shows the shoe; wonders who finished the others overnight.
  e('shoemaker', 'town', 'trades', () => acts(
    who('shoemaker', { top: 'cream', bottom: 'brown', long: true, hair: 'gray', glasses: 'black', acc: [wear('apron', 'leather'), face('glasses'), held('hammer'), shoeHeld('L')] }),
    [A.say('Tap, tap, tap...', 1.8), ...knock('R', 3), A.par(arm('L', 'offer'), A.say('Good as new!', 2)), A.wait(1), armsHome('L')],
    [G('look_around', 'Who finished these shoes in the night?', 2.6)],
  )),
  // Arms folded, a katana at the hip: gives orders.
  e('shogun', 'town', 'history', () => acts(
    rest(who('shogun', { top: 'black', bottom: '#4a2a2a', shoes: 'black', long: true, hair: 'black', beard: 'black', build: 1.15, acc: [wear('armor', 'gold'), kabuto('black'), face('mustache', 'black'), face('beard', 'black'), bit('hips', 'cyl', [4.8, 5.4, 3.6], [0, -2.6, 0], '#4a2a2a', { taper: 0.75 }), bit('hips', 'capsule', [0.3, 5.0, 0.3], [1.7, 0.4, 0.9], 'black', { srot: [62, 0, 20] }), bit('hips', 'box', [0.5, 0.15, 0.5], [1.55, 1.6, 0.4], 'gold', { srot: [62, 0, 20] })] }), { L: 'cross', R: 'cross' }),
    [A.par(A.anim('nod'), A.say('Kneel before the shogun.', 2.2))],
    [A.par(arm('R', 'side', 'cross'), A.say('Attack at dawn!', 2)), A.wait(1.2), armsHome('R')],
  )),
  e('shopkeeper', 'town', 'shops', () => acts(
    who('shopkeeper', { top: 'white', bottom: 'brown', acc: [wear('apron', 'green'), face('mustache'), held('bag', 'tan'), bit('handR', 'capsule', [0.35, 1.6, 0.35], [0.6, -0.5, 0.5], 'lettuce'), bit('handR', 'capsule', [0.5, 2.0, 0.5], [-0.5, -0.3, 0.5], 'bread')] }),
    [G('wave', 'Welcome in! Fresh bread today!')],
    give('loaf', 'bread', "Here you are. Mind, it's still warm!", 'L'),
  )),
  e('showgirl', 'town', 'entertainment', () => acts(
    paint(who('showgirl', { skin: 'skin2', top: 'magenta', bottom: 'magenta', legs: 'skin2', shoes: 'gold', hair: 'gold', style: 'long', acc: [plumes(), bit('hips', 'ball', [3.6, 3.0, 2.0], [0, -0.3, -2.0], 'pink'), wear('necklace', 'white'), fan('L')] }), ['legL', 'legR'], 'skin2'),
    [G('thumbs_up', 'Ta-daaa!')],
    [G('dance', 'Five, six, seven, eight!')],
  )),
  // Mic to the mouth: sings with the head thrown back; a note floats away.
  e('singer', 'town', 'music', () => acts(
    rest(who('singer', { top: 'red', skirt: 'red', bottom: 'red', hair: 'black', style: 'long', acc: [wear('robe', 'red'), wear('necklace', 'white'), held('mic')] }), { R: 'mouth' }),
    [A.par(A.say('♪ La la laaaa! ♪', 2.4), A.spawn('note', 'musical note', { rel: 'above', of: 'self', dist: 'close' }), T('head', [-16, 0, 0], 0.5)), A.wait(1), A.par(home('head'), A.remove('note', 'fly_away'))],
    [A.par(arm('L', 'side'), A.say('Thank you, goodnight!', 2.2)), A.wait(1.2), armsHome('L')],
  )),
  e('siren (monster)', 'fantasy', 'sea folk', () => acts(
    who('siren (monster)', { skin: '#a8d8c8', hair: '#1d3b4a', style: 'long', top: '#a8d8c8', bottom: '#4b2d6b', shoes: '#4b2d6b', eyes: 'red', acc: [shell('purple'), body('fishtail', '#4b2d6b'), lyre('L')] }),
    [A.par(A.say('♪ Come closer, sailor... ♪', 2.6), A.effect('hearts', { dur: 1.6 }), T('head', [0, 0, 12], 0.6)), T('head', [0, 0, -12], 0.7), home('head')],
    [A.par(A.anim('laugh'), A.say('Hee hee! Mind the rocks!', 2.2))],
  )),
  // A kickflip: the rider jumps and the board (a joint) flips under the feet.
  e('skater', 'town', 'sports', () => acts(
    lift(who('skater', { h: 1.7, top: 'teal', bottom: 'tan', shoes: 'white', acc: [hat('beanie', 'orange'), skateboard2('red')] }), 0.12),
    [A.par(Mv('hips', [0, 0.4, 0], 0.22), TM('board', [0, 0, 180], [0, 0.32, 0], 0.22)), A.par(Mv('hips', [0, 0, 0], 0.22), TM('board', [0, 0, 360], [0, 0, 0], 0.22)), A.pose('board', { rot: [0, 0, 0], dur: 0 }), A.say('Kickflip! Sick!', 1.8)],
    [A.par(A.anim('spin'), A.say('Three-sixty!', 1.6))],
  )),
  // Tucks low as the snow flies; then a jump.
  e('skier', 'town', 'sports', () => acts(
    lift(who('skier', { h: 1.7, top: 'red', bottom: 'black', shoes: 'gray', long: true, acc: [hat('beanie', 'white'), face('goggles', 'orange'), skis('blue'), poles] }), 0.02),
    [A.par(T('legL', [-35, 0, 0], 0.4), T('legR', [-35, 0, 0], 0.4), T('shinL', [55, 0, 0], 0.4), T('shinR', [55, 0, 0], 0.4), Mv('hips', [0, -0.1, 0], 0.4), T('torso', [25, 0, 0], 0.4), A.effect('snow', { dur: 2 }), A.say('Fresh powder! Whoosh!', 2)), A.wait(1.2), home('legL', 'legR', 'shinL', 'shinR', 'hips', 'torso')],
    [A.par(A.anim('hop'), A.say('Ski jump!', 1.6))],
  )),
  // Goes up under the canopy and floats down to a landing.
  e('skydiver', 'town', 'sports', () => acts(
    who('skydiver', { top: 'orange', bottom: 'orange', shoes: 'black', long: true, acc: [hat('helmet', 'black'), face('goggles'), wear('backpack', 'navy'), canopy()] }),
    [A.par(Mv('hips', [0, 4, 0], 1.0), A.say('Geronimooo!', 2)), Mv('hips', [0, 0, 0], 2.6), A.say('Perfect landing!', 1.6)],
    [G('thumbs_up', 'Best view in town!')],
  )),
  e('slacker', 'town', 'everyday people', () => acts(
    who('slacker', { top: 'gray', bottom: '#5a5f66', shoes: 'darkgray', long: true, style: 'long', hair: 'brown', acc: [hoodDown('gray'), held('phone'), held('bag', 'orange', 'L')] }),
    [G('shrug', 'Meh.', 1.5)],
    [A.par(A.expr('sleepy'), A.anim('nod'), A.say('Zzz... five more minutes...', 2.4))],
  )),
  // Plays the pipe and the cobra (a joint) rises out of the basket and sways.
  e('snake charmer', 'town', 'entertainment', () => acts(
    rest(who('snake charmer', { skin: 'skin4', top: 'white', bottom: 'white', shoes: 'brown', long: true, beard: 'black', acc: [hat('turban', 'orange'), face('beard', 'black'), wear('vest', 'darkred'), gourdPipe, cobra2] }), { L: 'mouth', R: 'mouth' }),
    [A.say('♪ Hoo-dee-doo-dee-doo ♪', 2.4), TM('cobra', [0, 0, 12], [0, 0.3, 0], 0.9), T('cobra', [0, 0, -12], 0.6), T('cobra', [0, 0, 12], 0.6), A.say('Hsss!', 1), home('cobra')],
    [A.par(A.anim('nod'), A.say('Do not worry. She is very friendly.', 2.4))],
  )),
  e('sniper', 'town', 'military', () => acts(
    who('sniper', { top: '#5c6b3a', bottom: '#4a5530', shoes: 'darkbrown', long: true, acc: [hat('straw', '#5c6b3a'), wear('vest', '#6b7a4a'), rifle('#3a3f2a', true), wear('belt', 'darkbrown'), leaves('#5c6b3a', 4)] }),
    [A.par(T('head', [12, 0, 0], 0.4), A.say('Steady... steady...', 2)), A.wait(1), home('head'), A.say('Target acquired.', 1.6)],
    [A.par(arm('L', 'mouth'), A.say('Shh. Stay low.', 1.8)), A.wait(1), armsHome('L')],
  )),
  // Snow falls; a snowball flies.
  e('snow suit kid', 'town', 'family', () => acts(
    who('snow suit kid', { h: 'kid', build: 1.3, top: 'skyblue', bottom: 'skyblue', shoes: 'navy', long: true, blush: '#ff8a8a', acc: [hat('beanie', 'red'), wear('scarf', 'red'), mittens('red'), wear('belt', 'navy')] }),
    [A.par(A.anim('arms_up'), A.effect('snow', { dur: 2 }), A.say('Snow day! Yay!', 2))],
    [A.spawn('sb', 'snowball', before), A.par(arm('R', 'fist'), A.say('Snowball fight!', 1.8)), A.par(arm('R', 'offer', 'down', 0.2), A.move('sb', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'run' })), A.par(A.remove('sb', 'pop'), armsHome('R'))],
  )),
  // Three snowballs, coal eyes and smile, a carrot nose, stick arms (joints: armL, armR), a scarf, and a top hat
  // that blows off (a piece) and goes back on.
  e('snowman', 'toys', 'holiday', () => {
    const b = m('snowman')
      .ball([0.72, 0.66, 0.72], [0, 0.33, 0], { color: 'snow', name: 'base' })
      .ball([0.54, 0.5, 0.54], [0, 0.84, 0], { color: 'snow', name: 'middle' })
      .ball([0.4, 0.38, 0.4], [0, 1.22, 0], { color: 'snow', name: 'head' })
      .cone([0.06, 0.2, 0.06], [0, 1.22, 0.28], { color: 'orange', rot: [90, 0, 0], parent: 'head' })
      .torus([0.46, 0.46, 0.1], [0, 1.05, 0], { color: 'red', rot: [90, 0, 0], tube: 0.4 })
      .box([0.09, 0.28, 0.04], [0.11, 0.93, 0.24], { color: 'red', rot: [12, 0, 12], round: 0.4 })
      .cyl([0.38, 0.025, 0.38], [0, 1.395, 0], { color: '#1e1e22', name: 'hat', parent: 'head', piece: true, edge: 'sharp' })
      .cyl([0.24, 0.24, 0.24], [0, 1.52, 0], { color: '#1e1e22', parent: 'hat', edge: 'sharp' })
      .cyl([0.245, 0.05, 0.245], [0, 1.43, 0], { color: 'red', parent: 'hat', edge: 'sharp' });
    b.pair((s) => {
      b.ball(0.05, [s * 0.07, 1.27, 0.172], { color: '#1e1e22', parent: 'head' });
      const arm = s > 0 ? 'armL' : 'armR';
      b.rod([s * 0.24, 0.92, 0], [s * 0.62, 1.16, 0], 0.035, 'bark', { name: arm, pivot: [s * 0.24, 0.92, 0], parent: 'middle' });
      b.rod([s * 0.54, 1.11, 0], [s * 0.6, 1.28, 0.02], 0.022, 'bark', { parent: arm });
      b.rod([s * 0.6, 1.15, 0], [s * 0.74, 1.2, 0], 0.022, 'bark', { parent: arm });
    });
    b.each(5, (i) => b.ball(0.035, [(i - 2) * 0.045, 1.155 + Math.abs(i - 2) * 0.014, 0.182 - Math.abs(i - 2) * 0.008], { color: '#1e1e22', parent: 'head' }));
    b.each(3, (i) => b.ball(0.05, [0, 0.92 - i * 0.08, i === 1 ? 0.266 : 0.256], { color: '#1e1e22', parent: 'middle' }));
    return b
      .act({
        click: [
          [A.par(T('armR', [0, 0, -40], 0.25), A.say('Happy holidays!', 2), A.effect('snow', { dur: 2 })), T('armR', [0, 0, 5], 0.25), T('armR', [0, 0, -40], 0.25), home('armR')],
          [A.detach('hat', 'hat'), A.say('Whoa! My hat!', 1.6)],
          [A.reattach('hat'), A.par(A.anim('wobble'), A.say('Much better!', 1.6))],
        ],
      })
      .done();
  }),
  // Kicks the ball (a joint) away and cheers.
  e('soccer player', 'town', 'sports', () => acts(
    who('soccer player', { top: 'red', bottom: 'white', legs: 'red', shoes: 'black', acc: [chest('10', 'white', 1.2, 1.0, 5.2), soccerBall2] }),
    [T('legL', [35, 0, 0], 0.3), A.par(T('legL', [-55, 0, 0], 0.15), Mv('ball', [0, 0.5, 3], 0.45)), A.par(home('legL'), A.anim('arms_up'), A.say('GOOOAL!', 2)), Mv('ball', [0, 0, 0], 0.6)],
    [A.par(A.anim('thumbs_up'), A.say('Good game, everyone!', 2))],
  )),
  e('socialist', 'town', 'government', () => acts(
    who('socialist', { top: '#c0392b', bottom: 'darkgray', shoes: 'black', long: true, acc: [hat('cap', 'darkgray'), wear('scarf', 'red'), held('flag', 'red'), held('book', 'red', 'L')] }),
    [A.par(arm('L', 'fist'), A.say('Workers of the world, unite!', 2.4)), A.wait(1), armsHome('L')],
    [G('clap', 'Fair shares for everyone!')],
  )),
  e('socrates', 'town', 'history', () => acts(
    who('socrates', { skin: 'skin2', hair: 'gray', style: 'bald', top: 'cream', bottom: 'cream', shoes: 'brown', beard: 'gray', acc: [wear('toga', 'cream'), wear('sash', 'tan'), face('beard', 'gray'), face('longbeard', 'gray'), sideHair('gray'), held('cup', 'bronze')] }),
    [G('shrug', 'All I know is that I know nothing.', 2.6)],
    [G('point', 'But tell me, friend: what is justice?', 2.6)],
  )),
  // Winds up and swings the bat.
  e('softball player', 'town', 'sports', () => acts(
    who('softball player', { top: 'yellow', bottom: 'white', legs: 'navy', shoes: 'black', style: 'ponytail', acc: [hat('cap', 'navy'), chest('7', 'navy', 1.0, 1.0, 5.2), held('bat'), mitt('L')] }),
    [A.say('Batter up!', 1.4), A.par(T('torso', [0, 35, 0], 0.4), arm('R', 'side')), A.par(T('torso', [0, -55, 0], 0.18), arm('R', 'offer', 'down', 0.18)), A.say('Crack! Home run!', 1.8), A.wait(0.5), home('torso', 'armR', 'foreR', 'handR')],
    [G('arms_up', 'Go, team, go!')],
  )),
  e('soldier', 'town', 'military', () => acts(
    who('soldier', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, style: 'short', acc: [hat('military'), wear('backpack', '#4a5530'), wear('belt', 'darkbrown'), rifle('darkgray')] }),
    [A.par(arm('R', 'salute'), A.say('Yes, sir! Reporting for duty!', 2)), A.wait(1), armsHome('R')],
    [G('look_around', 'All quiet on the front.')],
  )),
  // The orb (a light) blazes up in the raised hand, then goes dark for a moment.
  e('sorceress', 'fantasy', 'witches and wizards', () => acts(
    who('sorceress', { top: 'purple', skirt: 'purple', bottom: 'purple', long: true, hair: 'black', style: 'long', acc: [wear('robe', 'purple'), wear('cape', '#3a1a4a'), hat('tiara', 'gold'), hb('ball', [0.12, 0.12, 0.08], [0, 0.42, 0.48], 'magenta'), held('staff', 'darkwood'), bit('handL', 'ball', [1.3, 1.3, 1.3], [0, 1.3, 0.8], 'magenta', { role: 'glow', name: 'orb', mover: { kind: 'light', on: true } })] }),
    [A.par(arm('L', 'up'), A.effect('sparkle', { dur: 1.8 }), A.say('By the light of the moon!', 2.2)), A.wait(1), armsHome('L')],
    [A.operate('orb', 'off'), A.par(A.anim('laugh'), A.say('Lights out, little one!', 2)), A.wait(0.8), A.operate('orb', 'on')],
  )),
  // Two hand signals: go, and hold.
  e('special force', 'town', 'military', () => acts(
    who('special force', { top: 'black', bottom: 'black', shoes: 'black', long: true, build: 1.15, acc: [hat('helmet', 'black'), nightVision, face('mask', 'black'), wear('vest', 'darkgray'), wear('belt', 'darkgray'), rifle('black'), kneepads('darkgray')] }),
    [A.par(arm('L', 'fist'), A.say('Go, go, go!', 1.6)), A.wait(0.8), armsHome('L')],
    [A.par(arm('L', 'stop'), A.say('Hold position.', 1.8)), A.wait(1), armsHome('L')],
  )),
  // A lion's body with a woman's head under the striped headdress: asks the riddle, then answers it.
  e('sphinx (creature)', 'fantasy', 'mythic beasts', () => acts(
    beast('sphinx (creature)', { color: '#d9b26a', body: [1.5, 0.8, 0.78], bodyShape: 'capsule', legL: 0.62, legW: 0.24, hoof: '#c9a25a', neckL: 0.4, neckLean: 8, neckW: 0.36, head: [0.5, 0.6, 0.5], headColor: 'skin3', ears: 'side', earSize: 0.1, tail: 'tuft', tailColor: '#8a6a3a', acc: [sphinxHead, featherWings('#c9a25a', '#a8823e')] }),
    [A.par(A.anim('look_around'), A.say('What walks on four legs at dawn, two at noon, and three at dusk?', 4))],
    [A.par(A.anim('shake'), A.say('A person! Clever one. You may pass.', 2.6)), ...flaps(2)],
  )),
  e('sports fan', 'town', 'sports', () => acts(
    who('sports fan', { top: 'blue', bottom: 'denim', shoes: 'white', blush: 'blue', acc: [hat('cap', 'yellow'), wear('scarf', 'yellow'), chest('GO!', 'yellow', 1.6, 0.9, 5.2), foamFinger('L')] }),
    [G('arms_up', "We're number one!")],
    [G('clap', 'Go, team, go! Woo!')],
  )),
  // Peers through the magnifier; hides behind the newspaper to whisper.
  e('spy', 'town', 'spies', () => acts(
    who('spy', { top: 'tan', bottom: 'darkbrown', shoes: 'black', long: true, acc: [wear('coat', 'tan'), wear('belt', 'darkbrown'), fedora('#6b5a3a'), face('sunglasses'), held('magnifier'), held('book', 'paper', 'L')] }),
    [G('look_around', 'Curious... very curious.')],
    [A.par(arm('L', 'eye'), A.say('Psst. The eagle has landed.', 2.4)), A.wait(1.4), armsHome('L')],
  )),
  e('squire', 'town', 'history', () => acts(
    who('squire', { top: '#3a6ea5', bottom: 'brown', shoes: 'darkbrown', long: true, h: 'kid', style: 'short', hair: 'brown', acc: [wear('belt', 'brown'), bit('torso', 'box', [1.0, 1.0, 0.2], [0, 4.6, 1.1], 'gold'), held('shield', 'red', 'L'), helmetHeld('steel', 'R')] }),
    [A.par(arm('R', 'offer'), A.say('Your helmet, Sir Knight!', 2)), A.wait(1.2), armsHome('R')],
    [G('bow', "I'll polish your armour, sire.")],
  )),
  e('stalker', 'town', 'crime', () => acts(
    who('stalker', { top: 'darkgray', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', 'darkgray'), face('sunglasses'), binoculars('R'), held('camera', undefined, 'L')] }),
    [A.par(arm('R', 'eye'), A.say('I see you...', 2)), A.wait(1.4), armsHome('R')],
    [G('look_around', "Don't mind me. Just... birdwatching.", 2.6)],
  )),
  e('starlet', 'town', 'entertainment', () => acts(
    who('starlet', { top: 'gold', skirt: 'gold', bottom: 'gold', hair: '#f4d35e', style: 'long', skin: 'skin1', acc: [wear('robe', 'gold'), face('sunglasses'), wear('necklace', 'white'), wear('scarf', 'white'), clutch('L', 'red')] }),
    [A.par(A.anim('wink'), A.say('Kisses, darlings!', 2), A.effect('hearts', { dur: 1.5 }))],
    [A.par(A.anim('thumbs_up'), A.effect('sparkle', { dur: 1.5 }), A.say('No photos, please! Well... maybe one.', 2.6))],
  )),
  // A flight attendant with a tray of cups: offers drinks, points out the exits.
  e('steward', 'town', 'travel', () => acts(
    rest(who('steward', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, style: 'short', acc: [front('red'), hat('police', 'navy'), bit('torso', 'box', [1.0, 0.25, 0.15], [-0.9, 5.9, 1.12], 'gold'), held('tray'), bit('handR', 'cyl', [0.6, 0.8, 0.6], [0.8, 1.0, 1.6], 'white'), bit('handR', 'cyl', [0.6, 0.8, 0.6], [-0.8, 1.0, 1.6], 'white')] }), { R: 'hold' }),
    [A.par(A.anim('nod'), A.say('Coffee or tea?', 2))],
    [A.par(arm('L', 'side'), A.say('The exits are here...', 1.6)), A.wait(0.6), A.par(arm('L', 'offer'), A.say('...and here.', 1.4)), A.wait(0.8), armsHome('L')],
  )),
  // The card (a joint) turns from BUY! to SELL!
  e('stock trader', 'town', 'office', () => acts(
    who('stock trader', { top: 'white', bottom: 'navy', shoes: 'black', long: true, style: 'short', acc: [braces('red'), wear('tie', 'blue'), held('phone'), flipCard('BUY!', 'SELL!', 'lime', '#ff6a5a')] }),
    [A.par(arm('L', 'up'), A.say('Buy! Buy! BUY!', 1.8)), A.wait(0.8), armsHome('L')],
    [A.par(T('card', [0, 180, 0], 0.4), A.say('Sell! SELL!', 1.6)), A.anim('cover_eyes'), home('card')],
  )),
  // Chisels the block: a chip (a piece) falls off in a puff of dust, then goes back.
  e('stonemason', 'town', 'trades', () => acts(
    who('stonemason', { top: 'gray', bottom: 'brown', shoes: 'darkbrown', long: true, acc: [wear('apron', 'leather'), hat('beret', 'darkgray'), held('hammer'), chisel('L'), stoneBlock2] }),
    [A.say('Tap... tap...', 1.4), ...knock('R', 3), A.par(A.detach('chip', 'chip'), A.effect('dust', { dur: 1 })), A.say('Just a little off the corner.', 2)],
    [A.reattach('chip'), G('thumbs_up', 'Solid as a rock!')],
  )),
  // A real hot-dog cart beside the vendor: a steamer lid that opens, wheels, a striped umbrella.
  e('street vendor', 'town', 'food service', () => acts(
    withSockets(who('street vendor', { top: 'yellow', bottom: 'denim', shoes: 'brown', acc: [wear('apron', 'white'), hat('cap', 'red'), held('spatula'), hotDogCart] }), [{ name: 'counter', at: [1.55, 0.89, 0.15], kind: 'top', size: 0.4 }]),
    [A.par(A.operate('lid', 'open'), A.effect('steam', { dur: 1.5 }), A.say('Hot dogs! Get your hot dogs here!', 2.4)), A.wait(1.4), A.operate('lid', 'close')],
    give('hd', 'hot dog', 'One hot dog, extra mustard!', 'L'),
  )),
  // Lifts both dumbbells overhead, then flexes.
  e('strongman', 'town', 'entertainment', () => acts(
    who('strongman', { h: 1.9, build: 1.45, skin: 'skin3', top: 'skin3', bottom: '#d9a441', legs: 'skin3', shoes: 'black', style: 'bald', hair: 'black', acc: [wear('sash', '#d9a441'), wear('belt', 'black'), face('mustache', 'black'), dumbbell('R'), dumbbell('L')] }),
    [A.par(arms('up', 'down', 0.6), A.say('Hup!', 1.2)), A.wait(0.8), A.say('Light as a feather!', 1.8), armsHome()],
    [A.par(arms('flex'), A.say('Feel these muscles!', 2)), A.wait(1.2), armsHome()],
  )),
  e('student', 'town', 'school', () => acts(
    who('student', { top: 'orange', bottom: 'denim', shoes: 'white', long: true, glasses: 'black', acc: [face('glasses'), wear('backpack', 'navy'), held('book', 'green', 'L'), held('pointer', 'yellow')] }),
    [G('look_around', 'Exam tomorrow... better start studying.', 2.4)],
    [G('arms_up', 'Last day of term! Woo!')],
  )),
  // Claps for the servants: grapes appear.
  e('sultan', 'town', 'royalty', () => acts(
    who('sultan', { top: 'darkred', bottom: 'gold', shoes: 'gold', long: true, beard: 'black', hair: 'black', acc: [wear('robe', 'darkred'), wear('sash', 'gold'), hat('turban', 'white'), plume('white', 'red'), face('mustache', 'black'), face('beard', 'black'), held('sword', 'gold')] }),
    [A.par(A.anim('clap'), A.say('Bring me a feast!', 2)), A.spawn('g', 'grapes', before), A.wait(1.5), A.remove('g', 'pop')],
    [A.par(A.anim('nod'), A.say('You please the sultan.', 2.2))],
  )),
  // Shiko: one leg up to the side, stamp; then the other.
  e('sumo', 'town', 'sports', () => acts(
    who('sumo', { h: 1.85, build: 1.55, skin: 'skin2', top: 'skin2', bottom: 'skin2', shoes: 'skin2', hair: 'black', style: 'bun', acc: [bit('torso', 'ball', [4.2, 4.6, 3.0], [0, 2.6, 0.5], 'skin2'), mawashi('navy')] }),
    [A.par(T('legL', [0, 0, 55], 0.4), T('torso', [0, 0, -12], 0.4)), A.par(home('legL', 'torso'), A.effect('dust', { dur: 1 }), A.say('Dosukoi!', 1.6)), A.par(T('legR', [0, 0, -55], 0.4), T('torso', [0, 0, 12], 0.4)), A.par(home('legR', 'torso'), A.effect('dust', { dur: 1 }))],
    [G('clap', 'Hakkeyoi! Ready!')],
  )),
  e('sunbather', 'town', 'everyday people', () => acts(
    paint(who('sunbather', { skin: 'skin3', top: 'teal', bottom: 'teal', legs: 'skin3', shoes: 'skin3', style: 'long', hair: 'darkbrown', acc: [hat('straw'), face('sunglasses'), towel('L', 'orange'), bit('handR', 'cyl', [0.7, 1.6, 0.7], [0, 0.3, 0.8], 'yellow')] }), ['legL', 'legR'], 'skin3'),
    [A.par(arm('R', 'offer'), A.say('Sunscreen? Factor fifty!', 2)), A.wait(1.2), armsHome('R')],
    [A.par(A.anim('nod'), A.say('Ahh... perfect beach weather.', 2.2))],
  )),
  // Hands on hips at rest; a fist up and off he flies, then lands.
  e('superman', 'town', 'superheroes', () => acts(
    rest(who('superman', { h: 1.9, build: 1.25, top: 'blue', bottom: 'blue', shoes: 'red', long: true, hair: 'black', style: 'short', acc: [wear('cape', 'red'), bit('hips', 'box', [3.4, 1.2, 2.2], [0, -0.3, 0], 'red'), wear('belt', 'yellow'), bit('torso', 'box', [2.0, 1.6, 0.15], [0, 5.3, 1.1], 'yellow'), chest('S', 'red', 1.5, 1.2, 5.3), curl()] }), { L: 'hip', R: 'hip' }),
    [A.par(arm('R', 'fist', 'hip'), Mv('hips', [0, 3, 0], 1.0), A.say('Up, up and away!', 2)), A.wait(0.6), Mv('hips', [0, 0, 0], 1.0), armsHome('R')],
    [A.par(A.anim('nod'), A.say('This looks like a job for... me!', 2.4))],
  )),
  e('supermodel', 'town', 'fashion', () => acts(
    rest(who('supermodel', { h: 1.78, build: 0.85, top: 'black', skirt: 'black', bottom: 'black', shoes: 'red', hair: 'darkbrown', style: 'long', acc: [face('sunglasses'), wear('necklace', 'gold'), held('bag', 'red', 'L')] }), { R: 'hip' }),
    [A.par(A.anim('spin'), A.say('Fabulous!', 1.6))],
    [A.par(A.anim('wink'), A.effect('sparkle', { dur: 1.2 }), A.say('Work it!', 1.6))],
  )),
  e('surfer', 'town', 'sports', () => acts(
    who('surfer', { ...shorts('skin3'), top: 'cyan', bottom: 'orange', shoes: 'skin3', hair: '#f0d070', style: 'long', acc: [held('surfboard', 'yellow'), wear('necklace', 'white')] }),
    [G('thumbs_up', 'Cowabunga, dude!')],
    [A.par(A.anim('wobble'), A.effect('water_spray', { dur: 1.5 }), A.say("Surf's up!", 1.8))],
  )),
  e('surgeon', 'town', 'medical', () => acts(
    who('surgeon', { top: 'teal', bottom: 'teal', shoes: 'white', long: true, acc: [skullcap('teal'), face('mask', 'skyblue'), gloves('skyblue'), held('knife', 'silver')] }),
    [A.par(arm('L', 'offer'), A.say('Scalpel, please.', 1.6)), A.wait(1), armsHome('L')],
    [G('thumbs_up', 'The operation was a success!')],
  )),
  // Taps away, then tips the top hat (a joint).
  e('tap dancer', 'town', 'entertainment', () => acts(
    who('tap dancer', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [topHat('black'), tux(), gloves('white'), held('cane', 'black'), taps] }),
    [G('dance', 'Shuffle, ball, change!')],
    [A.par(TM('tophat', [-25, 0, 0], [0, 0.03, 0.02], 0.3), arm('L', 'salute'), A.say('Thank you, thank you!', 2)), A.wait(1), A.par(home('tophat'), armsHome('L'))],
  )),
  e('teacher', 'town', 'school', () => acts(
    who('teacher', { top: 'green', skirt: 'brown', bottom: 'brown', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), wear('necklace', 'white'), held('book', 'blue'), apple('L')] }),
    [G('point', 'Eyes on the board, please.')],
    [G('hands_on_hips', 'Settle down, class!')],
  )),
  e('teen', 'town', 'family', () => acts(
    who('teen', { h: 1.62, top: 'purple', bottom: 'denim', shoes: 'white', long: true, style: 'long', acc: [hoodDown('purple'), hat('headphones', 'white'), held('phone')] }),
    [A.par(arm('R', 'eye'), A.say('OMG, did you see that?', 2.2)), A.wait(1.2), armsHome('R')],
    [G('shrug', 'Ugh. Whatever.')],
  )),
  e('teenager', 'town', 'family', () => acts(
    who('teenager', { h: 1.65, top: 'black', bottom: 'denim', shoes: 'red', style: 'spiky', acc: [chest('MEH', 'white', 1.8, 0.8, 5.0), wear('backpack', 'lime'), held('phone'), held('skateboard', 'orange', 'L')] }),
    [G('shrug', 'Like, whatever.')],
    [A.par(A.anim('dance'), A.say('This song is SO good.', 2))],
  )),
  // Tosses the ball up and serves.
  e('tennis player', 'town', 'sports', () => acts(
    who('tennis player', { top: 'white', skirt: 'white', bottom: 'white', shoes: 'white', style: 'ponytail', acc: [hat('headband', 'lime'), held('racket'), smallBall('L')] }),
    [A.par(arm('L', 'up'), A.say('Serving...', 1.4)), A.par(arm('L', 'down', 'down', 0.2), arm('R', 'raise')), A.par(arm('R', 'offer', 'down', 0.15), A.say('Ace!', 1.4)), A.wait(0.5), armsHome()],
    [G('arms_up', 'Game, set and match!')],
  )),
  // A clay statue that creaks to life.
  e('terracotta warrior', 'town', 'history', () => acts(
    who('terracotta warrior', { h: 1.85, skin: '#b5735a', hair: '#9a5f48', style: 'bun', top: '#a8644e', bottom: '#a8644e', skirt: '#b5735a', shoes: '#8a4f3c', long: true, eyes: '#5a3020', blush: '#b5735a', acc: [wear('armor', '#9a5f48'), wear('belt', '#8a4f3c'), held('spear', '#9a5f48')] }),
    [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('*creeeak*', 1.4))],
    [A.par(A.anim('nod'), A.say('Two thousand years I have guarded the emperor.', 2.8))],
  )),
  // Raises the hammer: a storm.
  e('thor', 'town', 'superheroes', () => acts(
    who('thor', { h: 'tall', build: 1.3, top: '#3a3f4a', bottom: '#3a3f4a', shoes: '#3a3f4a', long: true, hair: 'gold', style: 'long', beard: 'gold', acc: [wear('cape', 'red'), discs(), face('beard', 'gold'), wear('belt', 'silver'), mjolnir('R')] }),
    [A.par(arm('R', 'raise'), A.effect('sparkle', { dur: 1.5 }), A.say('For Asgard!', 1.8)), A.effect('rain', { dur: 2 }), armsHome('R')],
    [G('laugh', 'Ha! Another!')],
  )),
  e('time traveler', 'fantasy', 'sci-fi', () => acts(
    who('time traveler', { top: 'cream', bottom: 'brown', shoes: 'darkbrown', long: true, hair: 'white', style: 'spiky', acc: [wear('coat', '#5a3a22'), wear('vest', '#7a2e2e'), wear('bowtie', 'black'), browGoggles, pocketWatch('R'), hourglass('L')] }),
    [A.par(arm('R', 'eye'), A.say('Great Scott! What year is it?', 2.4)), A.wait(1.2), armsHome('R')],
    [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.5 }), A.say('Back to the future!', 2))],
  )),
  // A 6 m giant (the vocabulary's 12 m would not fit the town): lifts the boulder, stamps.
  e('titan', 'fantasy', 'giants', () => acts(
    who('titan', { h: 6, build: 1.35, skin: 'skin3', hair: 'gray', style: 'long', top: 'skin3', bottom: '#7a5a3a', skirt: '#7a5a3a', shoes: 'brown', beard: 'gray', acc: [wear('sash', '#7a5a3a'), face('longbeard', 'gray'), hat('headband', 'gold'), armRings('gold', 1), bit('handL', 'ball', [4.2, 3.6, 3.8], [0, -1.0, 1.8], 'stone')] }),
    [A.par(arm('L', 'up', 'down', 0.8), A.say('I am a TITAN!', 2)), A.wait(0.8), armsHome('L')],
    [A.par(A.anim('hands_on_hips'), A.effect('dust', { dur: 1.5 }), A.say('*STOMP* Tremble, little one!', 2.4))],
  )),
  e('tom jones', 'town', 'music', () => acts(
    rest(who('tom jones', { h: 1.83, skin: 'skin2', hair: '#2a1d16', style: 'short', top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [hb('ball', [1.12, 0.5, 1.05], [0, 0.32, -0.04], '#2a1d16'), front('', 'skin2'), wear('necklace', 'gold'), wear('belt', 'gold'), held('mic')] }), { R: 'mouth' }),
    [A.par(A.anim('bounce'), A.say("♪ It's not unusual... ♪", 2.4))],
    [A.par(arm('L', 'side'), A.say("♪ What's new, pussycat? ♪", 2.2)), A.wait(1), armsHome('L')],
  )),
  // Hovers up on her wings with a sparkle and leaves a coin for the tooth.
  e('tooth fairy', 'fantasy', 'fairies', () => acts(
    who('tooth fairy', { h: 'kid', top: 'skyblue', skirt: '#cdeefb', bottom: 'skyblue', hair: 'gold', style: 'bun', acc: [wear('tutu', '#cdeefb'), body('fairywings'), hat('tiara', 'silver'), held('wand'), toothHeld('L')] }),
    [A.par(Mv('hips', [0, 0.35, 0], 0.5), A.effect('sparkle', { dur: 1.5 }), A.say('A shiny coin for your tooth!', 2.4)), A.spawn('c', 'coin (money)', before), A.wait(1), A.par(Mv('hips', [0, 0, 0], 0.5), A.remove('c', 'pop'))],
    [G('wave', 'Remember: brush twice a day!')],
  )),
  // Three toddlers (one prop): they bounce and giggle, and all reach up to be picked up.
  e('tots', 'town', 'family', () => acts(
    crowd('tots', [[scale(who('tot one', { h: 'kid', top: 'yellow', bottom: 'blue', style: 'short' }), 0.7), -0.38], [scale(who('tot two', { h: 'kid', top: 'pink', skirt: 'magenta', style: 'pigtails' }), 0.68), 0, -0.05], [scale(who('tot three', { h: 'kid', top: 'lime', bottom: 'red', style: 'spiky' }), 0.72), 0.38]]),
    [A.par(A.anim('bounce'), A.say('Hee hee hee!', 1.8))],
    [A.par(...[0, 1, 2].flatMap((i) => [T(`armL~${i}`, [0, 0, 130]), T(`armR~${i}`, [0, 0, -130])]), A.say('Uppy! Uppy!', 1.8)), A.wait(1.2), home(...[0, 1, 2].flatMap((i) => [`armL~${i}`, `armR~${i}`]))],
  )),
  // The flag goes up so the group can follow it.
  e('tour guide', 'town', 'travel', () => acts(
    who('tour guide', { top: 'orange', bottom: 'tan', shoes: 'brown', acc: [hat('cap', 'orange'), wear('necklace', 'blue'), wear('badge', 'white'), held('flag', 'yellow')] }),
    [A.par(arm('R', 'up'), A.say('Follow me, everyone! Stay together!', 2.4)), A.wait(1), armsHome('R')],
    [A.par(arm('L', 'side'), A.say('And on your left... the famous fountain!', 2.6)), A.wait(1.2), armsHome('L')],
  )),
  e('tourist', 'town', 'travel', () => acts(
    who('tourist', { ...shorts('skin1'), top: 'cyan', bottom: 'tan', shoes: 'brown', acc: [flowerDots(), hat('straw'), face('sunglasses'), held('camera'), held('map', undefined, 'L'), wear('backpack', 'orange')] }),
    [A.par(arm('R', 'eye'), A.say('Click! One more for the album.', 2.2)), A.wait(1.2), armsHome('R')],
    [G('shrug', 'Excuse me... which way is the museum?', 2.4)],
  )),
  e('train conductor', 'town', 'transport', () => acts(
    who('train conductor', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('police', 'navy'), buttons('gold'), wear('whistle'), held('lantern')] }),
    [A.par(arm('L', 'mouth'), A.say('Tweeet! All aboard!', 2.2)), A.wait(1), armsHome('L')],
    [A.par(arm('L', 'offer'), A.say('Tickets, please!', 1.8)), A.wait(1.2), armsHome('L')],
  )),
  // Pulls the whistle cord: steam and a toot.
  e('train engineer', 'town', 'transport', () => acts(
    who('train engineer', { top: 'white', bottom: 'denim', shoes: 'black', long: true, acc: [wear('overalls', '#5a7aa8'), hat('cap', '#5a7aa8'), hb('torus', [1.12, 1.1, 0.06], [0, 0.32, -0.02], 'white', { srot: [90, 0, 0], tube: 0.1 }), wear('scarf', 'red'), gloves('tan'), held('shovel')] }),
    [arm('L', 'fist', 'down', 0.3), A.par(arm('L', 'up', 'down', 0.2), A.effect('steam', { dur: 2 }), A.say('Choo choooo!', 1.8)), A.wait(0.8), armsHome('L')],
    [G('wave', 'Next stop: the seaside!')],
  )),
  // A 6 m robot built from a truck: the cab is its chest (windscreen, grille, headlights), wheels on its shins,
  // exhaust stacks behind its shoulders. Arms are joints (armL, armR). It turns into a truck and back.
  e('transformer', 'fantasy', 'robots', () => {
    const b = m('transformer', { edge: 'sharp' });
    const blue = '#2f5fb3', red = '#d23a32', gray = '#8a9098';
    b.pair((s) => {
      b.box([0.8, 0.42, 1.2], [s * 0.55, 0.21, 0.12], { color: blue, round: 0.15 });
      b.box([0.72, 1.4, 0.8], [s * 0.55, 1.1, 0], { color: blue, round: 0.12 });
      b.box([0.5, 0.5, 0.06], [s * 0.55, 1.15, 0.42], { color: 'silver', round: 0.2 });
      b.cyl([0.8, 0.32, 0.8], [s * 0.98, 0.95, 0], { color: 'rubber', rot: [0, 0, 90], edge: 'soft', name: s > 0 ? 'wheelL' : 'wheelR' });
      b.cyl([0.38, 0.34, 0.38], [s * 0.99, 0.95, 0], { color: 'silver', rot: [0, 0, 90] });
      b.ball(0.46, [s * 0.55, 1.88, 0.08], { color: 'silver' });
      b.box([0.56, 0.85, 0.62], [s * 0.5, 2.3, 0], { color: gray, round: 0.15 });
      b.box([0.7, 0.62, 0.86], [s * 1.38, 4.26, 0], { color: red, round: 0.15 });
      b.cyl([0.2, 1.1, 0.2], [s * 0.78, 4.85, -0.42], { color: 'silver' });
      const arm = s > 0 ? 'armL' : 'armR';
      b.box([0.46, 0.85, 0.5], [s * 1.42, 3.6, 0], { color: gray, round: 0.15, name: arm, pivot: [s * 1.38, 4.1, 0] });
      b.box([0.58, 0.9, 0.64], [s * 1.46, 2.8, 0.04], { color: red, round: 0.15, parent: arm });
      b.box([0.48, 0.46, 0.52], [s * 1.46, 2.2, 0.1], { color: gray, round: 0.3, parent: arm });
      b.box([0.75, 0.56, 0.06], [s * 0.48, 4.08, 0.57], { color: '#9fd3f0', round: 0.1 });
      b.ball([0.22, 0.16, 0.06], [s * 0.72, 3.48, 0.57], { color: '#fff6c8', glow: true });
    });
    b.box([1.5, 0.5, 0.82], [0, 2.78, 0], { color: 'silver', round: 0.15 })
      .box([1.0, 0.5, 0.7], [0, 3.15, 0], { color: gray, round: 0.15 })
      .box([2.0, 1.25, 1.1], [0, 3.92, 0], { color: red, round: 0.1, name: 'chest' })
      .box([0.9, 0.45, 0.06], [0, 3.5, 0.57], { color: 'silver', round: 0.1 })
      .each(4, (i) => b.box([0.8, 0.04, 0.03], [0, 3.36 + i * 0.09, 0.6], { color: '#4a4e56' }))
      .box([0.06, 0.6, 0.06], [0, 4.08, 0.58], { color: '#4a4e56' })
      .cyl([0.36, 0.25, 0.36], [0, 4.63, 0], { color: gray })
      .box([0.62, 0.66, 0.56], [0, 5.02, 0], { color: blue, round: 0.2, name: 'head' })
      .box([0.4, 0.26, 0.06], [0, 4.87, 0.29], { color: 'silver', parent: 'head' })
      .box([0.4, 0.08, 0.04], [0, 5.07, 0.3], { color: 'cyan', glow: true, parent: 'head' })
      .pair((s) => b.box([0.08, 0.42, 0.22], [s * 0.35, 5.12, 0], { color: blue, parent: 'head' }).cyl([0.06, 0.3, 0.06], [s * 0.36, 5.45, -0.05], { color: blue, parent: 'head', taper: 0.3 }))
      .box([0.14, 0.22, 0.32], [0, 5.38, 0.06], { color: blue, parent: 'head' });
    return b.act({
      click: [
        [A.par(A.anim('spin'), A.say('Robots in disguise... transform!', 2.2)), A.morph('truck'), A.wait(2.4), A.morph('transformer'), A.par(A.anim('bounce'), A.say('Roll out!', 1.6))],
        [A.par(T('armR', [0, 0, -120], 0.4), A.say('Greetings, tiny human!', 2)), T('armR', [0, 0, -100], 0.25), T('armR', [0, 0, -120], 0.25), home('armR')],
      ],
    }).done();
  }),
  e('troll', 'fantasy', 'giants', () => acts(
    who('troll', { h: 2.5, build: 1.45, skin: '#8a9a6a', hair: '#5a4a2a', style: 'long', top: '#8a9a6a', bottom: '#6b4a2a', shoes: '#8a9a6a', eyes: 'yellow', acc: [wear('vest', 'brown'), hb('ball', [0.34, 0.3, 0.36], [0, -0.06, 0.52], '#8a9a6a'), elfEars('#8a9a6a'), hb('cyl', [0.08, 0.16, 0.08], [0.15, -0.33, 0.42], 'cream', { taper: 0 }), hb('cyl', [0.08, 0.16, 0.08], [-0.15, -0.33, 0.42], 'cream', { taper: 0 }), held('club')] }),
    [G('hands_on_hips', "Who's that trip-trapping over MY bridge?!", 2.8)],
    [A.par(arm('R', 'raise'), A.say('Troll toll! Pay up!', 2)), A.wait(0.8), armsHome('R')],
  )),
  // Pumps the air-horn cord; sips coffee.
  e('trucker', 'town', 'transport', () => acts(
    who('trucker', { top: 'red', bottom: 'denim', shoes: 'brown', long: true, beard: 'brown', build: 1.25, acc: [bands('darkred', 4), hat('cap', 'blue'), hb('box', [0.6, 0.3, 0.05], [0, 0.42, 0.45], 'white'), face('beard', 'brown'), wear('belt', 'brown'), held('cup', 'white')] }),
    [arm('L', 'fist', 'down', 0.25), A.par(arm('L', 'side', 'down', 0.15), A.say('HONK HONK!', 1.6)), arm('L', 'fist', 'down', 0.15), arm('L', 'side', 'down', 0.15), armsHome('L')],
    [A.par(arm('R', 'mouth'), A.say("Ahh, coffee. Keep on truckin'!", 2.4)), A.wait(1), armsHome('R')],
  )),
  // Puts the trumpet up and plays a fanfare.
  e('trumpeter', 'town', 'music', () => acts(
    who('trumpeter', { top: 'red', bottom: 'white', shoes: 'black', long: true, acc: [hat('police', 'red'), buttons('gold'), wear('sash', 'white'), held('trumpet')] }),
    [A.par(arm('R', 'eye'), A.say('♪ Ta-ta-ta-TAAA! ♪', 2.4)), T('torso', [-8, 0, 0], 0.4), A.wait(0.8), A.par(home('torso'), armsHome('R'))],
    [G('bow', 'Thank you! The parade starts at noon.')],
  )),
  e('tsar', 'town', 'royalty', () => acts(
    who('tsar', { top: 'darkred', bottom: 'darkred', shoes: 'brown', long: true, hair: 'brown', beard: 'brown', build: 1.15, acc: [wear('robe', 'darkred'), wear('cape', 'gold'), bit('hips', 'cyl', [5.0, 0.6, 3.6], [0, -5.6, 0], 'white'), furCrown, face('longbeard', 'brown'), held('staff', 'gold'), orb('L')] }),
    [A.par(A.anim('nod'), A.say('I am the Tsar of all the Russias!', 2.6))],
    [A.par(arm('L', 'up'), A.effect('sparkle', { dur: 1.2 }), A.say('Behold the imperial orb!', 2.2)), A.wait(1), armsHome('L')],
  )),
  // Looks for the other twin, who pops up beside them.
  e('twin (person)', 'town', 'family', () => acts(
    who('twin (person)', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', acc: [chest('TWIN', 'white', 2.4, 1.0, 4.4)] }),
    [G('look_around', "Where's my twin?")],
    [A.spawn('t2', 'twin (person)', { rel: 'left', of: 'self', dist: 'close' }), G('arms_up', 'There you are!'), A.wait(1), A.remove('t2', 'fade')],
  )),
  e('twins', 'town', 'family', () => acts(
    crowd('twins', [[who('twins', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', skin: 'skin2' }), -0.3], [who('twins', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', skin: 'skin2' }), 0.3]]),
    [A.par(T('armR~0', [0, 0, -130]), T('armL~1', [0, 0, 130]), A.say("We're twins!", 1.8)), A.par(T('foreR~0', [0, 0, -30], 0.25), T('foreL~1', [0, 0, 30], 0.25)), home('armR~0', 'foreR~0', 'armL~1', 'foreL~1')],
    [A.par(A.anim('bounce'), A.say('Same, same!', 1.6))],
  )),
  e('umpire', 'town', 'sports', () => acts(
    who('umpire', { top: 'black', bottom: 'gray', shoes: 'black', long: true, build: 1.2, acc: [hat('cap', 'black'), cage, wear('vest', 'darkgray')] }),
    [A.par(arm('R', 'fist'), A.say("Strike three! You're OUT!", 2.2)), A.wait(1), armsHome('R')],
    [G('point', 'Play ball!')],
  )),
  // The same horse as the pegasus, with a golden horn: it rears with a sparkle, and leaves a rainbow.
  e('unicorn', 'fantasy', 'magic horses', () => acts(
    saddled(beast('unicorn', { color: 'white', body: [1.3, 0.82, 0.62], bodyShape: 'capsule', legL: 0.84, legW: 0.17, hoof: 'gold', neckL: 0.7, neckLean: 32, neckW: 0.4, head: [0.62, 0.3, 0.27], snout: { len: 0.26, h: 0.2, w: 0.18, color: '#fbeef6' }, nose: '#c9a0b8', ears: 'pointy', earSize: 0.11, tail: 'fluffy', tailColor: 'violet', tailAngle: 128, acc: [ani.mane('pink'), ani.horns('gold', 'unicorn')] })),
    [A.par(A.anim('hop'), A.say('Neigh!', 1.4), A.effect('sparkle', { dur: 1.5 }))],
    [A.spawn('rb', 'rainbow', { rel: 'behind', of: 'self', dist: 'near' }), A.par(A.anim('shake'), A.say('Whinny!', 1.4)), A.wait(1.5), A.remove('rb', 'fade')],
  )),
  e('used car salesman', 'town', 'sales', () => acts(
    who('used car salesman', { top: '#c98a2a', bottom: 'brown', shoes: 'white', long: true, hair: 'black', style: 'short', acc: [bands('#7a4a1a', 4), front('red'), face('mustache', 'black'), keys('R')] }),
    [G('thumbs_up', 'Have I got a deal for YOU!')],
    [A.par(A.anim('wink'), A.say('Only one careful owner!', 2.2))],
  )),
  e('used car saleswoman', 'town', 'sales', () => acts(
    who('used car saleswoman', { top: 'magenta', skirt: 'black', bottom: 'black', shoes: 'red', long: true, style: 'long', hair: '#e8c56a', acc: [front('', 'white'), wear('necklace', 'gold'), keys('R'), cardText('L', 'DEAL!', 'yellow')] }),
    [G('point', 'Sign right here, and she is all yours!', 2.4)],
    [A.par(arm('R', 'offer'), A.say('The keys! Drive safe now!', 2.2)), A.wait(1.2), armsHome('R')],
  )),
  e('valentine', 'town', 'holidays', () => acts(
    who('valentine', { top: 'pink', skirt: 'red', bottom: 'red', style: 'long', blush: '#ff6f8f', acc: [hat('bow', 'red'), heartHeld('R'), held('bouquet', undefined, 'L')] }),
    [A.par(A.anim('wink'), A.say('Will you be my valentine?', 2.4), A.effect('hearts', { dur: 2 }))],
    give('box', 'box of chocolates', 'Chocolates, for my sweetheart!', 'R'),
  )),
  // Bows, then brings the car round.
  e('valet', 'town', 'services', () => acts(
    who('valet', { top: 'white', bottom: 'black', shoes: 'black', long: true, style: 'short', acc: [wear('vest', 'red'), wear('bowtie', 'black'), hat('police', 'red'), keys('R')] }),
    [G('bow', 'Good evening. Your keys, please.')],
    [A.spawn('car', 'car', { rel: 'left', of: 'self', dist: 'near' }), G('point', 'Your car, sir. Polished and ready!'), A.wait(1.2), A.remove('car', 'fade')],
  )),
  // Spreads the arms; a bat flies off.
  e('vampire', 'fantasy', 'monsters', () => acts(
    who('vampire', { skin: '#e4e0ec', hair: 'black', style: 'short', top: 'white', bottom: 'black', shoes: 'black', long: true, eyes: 'red', blush: '#e4e0ec', acc: [wear('cape', 'black'), highCollar('darkred'), wear('vest', 'black'), wear('bowtie', 'darkred'), wear('medal', 'darkred'), fangs] }),
    [A.par(arms('side'), A.say('Bleh! I vant to suck your blood!', 2.4)), A.wait(0.8), armsHome()],
    [A.spawn('bat', 'bat (animal)', { rel: 'above', of: 'self', dist: 'close' }), A.par(A.anim('laugh'), A.say('Mwahaha! Fly, my pet!', 2)), A.remove('bat', 'fly_away')],
  )),
  e('vegan', 'town', 'everyday people', () => acts(
    who('vegan', { top: 'green', bottom: 'tan', shoes: 'white', acc: [chest('VEGAN', 'lime', 2.4, 0.8, 5.0), carrot('R'), broccoli('L')] }),
    [G('thumbs_up', 'Plants are friends AND food!')],
    [G('shake_head', 'No cheese for me, thanks!')],
  )),
  e('vegetarian', 'town', 'everyday people', () => acts(
    who('vegetarian', { top: 'yellow', bottom: 'denim', shoes: 'brown', style: 'ponytail', acc: [wear('apron', 'green'), saladBowl('L'), carrot('R')] }),
    [A.par(arm('L', 'offer'), A.say('Salad, anyone? Fresh from the garden!', 2.4)), A.wait(1.2), armsHome('L')],
    [A.par(arm('R', 'mouth'), A.say('Crunch! Mmm, carrots.', 2)), A.wait(1), armsHome('R')],
  )),
  // Cuddles the puppy (a joint, 'pup'), which wriggles.
  e('vet', 'town', 'animal care', () => acts(
    rest(who('vet', { top: 'skyblue', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat', 'white'), wear('stethoscope'), puppy2('L')] }), { L: 'hold' }),
    [A.par(A.anim('nod'), A.say("Who's a good boy? You are!", 2.2), A.effect('hearts', { dur: 1.5 }))],
    [A.par(T('pup', [0, 0, 14], 0.2), A.say('Woof! All better now.', 2)), T('pup', [0, 0, -14], 0.2), T('pup', [0, 0, 14], 0.2), home('pup')],
  )),
  e('vice president', 'town', 'government', () => acts(
    who('vice president', { top: 'darkgray', bottom: 'darkgray', shoes: 'black', long: true, hair: 'white', style: 'short', glasses: 'black', acc: [front('blue'), face('glasses'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'blue'), held('briefcase', 'black', 'L')] }),
    [A.par(A.anim('nod'), A.say('On behalf of the President...', 2.2))],
    [A.par(arm('R', 'offer'), A.say('A pleasure to meet you.', 2)), A.wait(1.2), armsHome('R')],
  )),
  e('vigilante', 'town', 'superheroes', () => acts(
    who('vigilante', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', '#2a2a2a'), domino(), wear('cloak', '#2a2a2a'), gloves('darkgray'), wear('belt', 'gold'), held('bat', 'darkgray')] }),
    [A.par(arm('R', 'raise'), A.say('Justice never sleeps!', 2)), A.wait(0.8), armsHome('R')],
    [G('look_around', 'Quiet tonight... too quiet.')],
  )),
  e('viking', 'town', 'history', () => acts(
    who('viking', { top: '#6b5a3a', bottom: '#4a3a2a', shoes: 'brown', long: true, hair: '#c0622d', style: 'long', build: 1.25, acc: [hat('viking'), face('longbeard', '#c0622d'), wear('vest', '#8a6a4a'), wear('belt', 'darkbrown'), armRings('#c9a227', 1), held('axe'), held('shield', 'red', 'L')] }),
    [A.par(arm('R', 'raise'), A.say('For Valhalla!', 1.8)), A.wait(0.6), armsHome('R')],
    [A.par(A.anim('laugh'), A.say('Skål! To the feast hall!', 2))],
  )),
  e('villain', 'town', 'villains', () => acts(
    who('villain', { top: 'black', bottom: 'purple', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [hat('top', 'black'), wear('cape', 'black'), face('mustache', 'black'), hb('ball', [0.08, 0.08, 0.08], [0.24, -0.06, 0.46], 'black'), hb('ball', [0.08, 0.08, 0.08], [-0.24, -0.06, 0.46], 'black'), gloves('white'), bomb('L')] }),
    [G('laugh', 'Mwahahaha!')],
    [A.par(A.effect('smoke', { dur: 1.5 }), A.anim('hands_on_hips'), A.say('Curses! Foiled again!', 2.2))],
  )),
  // Violin under the chin, bow in the right hand: plays, the bow arm sawing.
  e('violinist', 'town', 'music', () => acts(
    pose(who('violinist', { top: 'black', skirt: 'black', bottom: 'black', long: true, style: 'bun', acc: [wear('robe', 'black'), wear('necklace', 'white'), held('violin'), fiddleBow('R')] }), { armL: [-62, 0, 32], foreL: [-62, 0, -6], armR: [-45, 0, -32], foreR: [-75, 0, -55], head: [0, 0, 14] }),
    [A.say('♪ Vivaldi: Spring ♪', 2.6), ...Array.from({ length: 4 }, (_, i) => T('armR', [0, 0, i % 2 ? 0 : -24], 0.35)), home('armR')],
    [A.par(A.anim('nod'), A.say('Thank you! An encore?', 2))],
  )),
  e('volleyball player', 'town', 'sports', () => acts(
    who('volleyball player', { h: 1.9, build: 0.95, ...shorts('skin3'), top: 'blue', bottom: 'white', shoes: 'white', style: 'ponytail', acc: [chest('5', 'white', 1.0, 1.0, 5.2), kneepads('white'), held('ball', 'yellow', 'L')] }),
    [A.par(arms('up'), A.say('Bump, set...', 1.6)), A.wait(0.6), armsHome(), A.par(A.anim('hop'), A.say('SPIKE!', 1.4))],
    [G('clap', 'Nice serve, team!')],
  )),
  // A tray on the palm with a silver dome (a lid on a hinge) that lifts: steam, and dinner.
  e('waiter', 'town', 'food service', () => acts(
    rest(who('waiter', { top: 'white', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'black'), face('mustache', 'black'), armTowel('L'), cloche2('R')] }), { R: 'hold' }),
    [A.par(A.operate('lid', 'open'), A.effect('steam', { dur: 1.4 }), A.say('Voilà! Bon appétit!', 2.2)), A.wait(1.4), A.operate('lid', 'close')],
    [A.par(arm('L', 'side'), A.anim('nod'), A.say('Your table is ready. This way, please.', 2.4)), A.wait(1), armsHome('L')],
  )),
  e('warrior', 'town', 'history', () => acts(
    who('warrior', { top: 'darkred', bottom: 'brown', shoes: 'brown', skirt: 'darkred', build: 1.25, acc: [wear('armor', 'bronze'), hat('helmet', 'bronze'), crest('red'), bracers('bronze'), held('spear'), held('shield', 'bronze', 'L')] }),
    [A.par(arm('L', 'offer'), A.say('Shields up!', 1.6)), A.wait(0.8), armsHome('L')],
    [G('arms_up', 'For glory!')],
  )),
  e('waterboy', 'town', 'sports', () => acts(
    who('waterboy', { top: 'green', bottom: 'white', shoes: 'white', acc: [hat('cap', 'green'), cooler('R'), bottles('L')] }),
    give('wb', 'water bottle', 'Stay hydrated, champ!', 'L'),
    [G('thumbs_up', 'Water break! Everybody drink up!')],
  )),
  // Stands at an upright loom; the shuttle (a piece) runs to and fro through the warp.
  e('weaver', 'town', 'arts', () => acts(
    who('weaver', { top: 'cream', skirt: '#b5543a', bottom: '#b5543a', long: true, style: 'bun', hair: 'gray', acc: [bands('#e0a040', 3), wear('scarf', 'orange'), yarnBasket('R'), loom] }),
    [A.say('Over, under, over, under...', 2.6), Mv('shuttle', [0.5, 0, 0], 0.6), Mv('shuttle', [0, 0, 0], 0.6), Mv('shuttle', [0.5, 0, 0], 0.6), Mv('shuttle', [0, 0, 0], 0.6)],
    [G('look_around', 'Now... which colour comes next?')],
  )),
  e('wedding planner', 'town', 'services', () => acts(
    who('wedding planner', { top: 'pink', skirt: 'white', bottom: 'white', long: true, style: 'bun', acc: [front('', 'white'), headset, held('clipboard'), held('bouquet', undefined, 'L')] }),
    [G('clap', 'Places, everyone! Here comes the bride!')],
    [A.spawn('cake', 'wedding cake', before), G('thumbs_up', 'The cake has arrived! Perfect!'), A.wait(1.2), A.remove('cake', 'fade')],
  )),
  // Hunched, clawed and tailed: throws the head back and howls.
  e('werewolf', 'fantasy', 'monsters', () => acts(
    pose(rest(who('werewolf', { h: 2.0, build: 1.3, skin: '#6b4a33', hair: '#4a3324', style: 'long', top: '#7a8a9a', bottom: 'navy', shoes: '#6b4a33', eyes: 'yellow', blush: '#6b4a33', acc: [wolfSnout('#6b4a33'), hat('catears', '#6b4a33'), rips('#6b4a33'), body('tail', '#5a3e2a'), claws('#f0ead8'), fur('#5a3e2a')] }), { L: 'carry', R: 'carry' }), { torso: [12, 0, 0], head: [-10, 0, 0] }),
    [A.par(T('head', [-45, 0, 0], 0.5), A.say('Awoooooooo!', 2.4)), A.wait(1.2), home('head')],
    [A.par(arms('reach', 'carry'), A.expr('angry'), A.say('Grrrrr!', 1.6)), A.wait(0.8), armsHome()],
  )),
  // Leans the sail (a joint at the mast foot) into the wind.
  e('windsurfer (human)', 'town', 'sports', () => acts(
    rest(lift(who('windsurfer (human)', { h: 1.75, top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'gold', acc: [bands('cyan', 2), wear('lifejacket', 'yellow'), windsurf2] }), 0.05), { L: 'side' }),
    [A.par(T('mast', [0, 0, -14], 0.6), A.effect('water_spray', { dur: 1.5 }), A.say('Catch the wind!', 2)), T('mast', [0, 0, 8], 0.6), home('mast')],
    [A.par(A.anim('wobble'), A.say('Whoa! Big wave!', 1.8))],
  )),
  e('witch', 'fantasy', 'witches and wizards', () => acts(
    who('witch', { skin: '#a8d08a', hair: '#3a3a3a', style: 'long', top: 'black', skirt: 'black', bottom: 'black', legs: 'purple', shoes: 'black', long: true, acc: [wear('robe', 'black'), hat('wizard', 'black'), hb('cyl', [0.92, 0.1, 0.86], [0, 0.6, 0], 'purple'), witchNose('#a8d08a'), held('broom')] }),
    [G('laugh', "Hee hee hee! I'll get you, my pretty!", 2.6)],
    [A.spawn('frog', 'frog', before), A.par(arm('L', 'offer'), A.effect('sparkle', { dur: 1.2 }), A.say('Abraca-FROG! Oops...', 2.2)), A.wait(1.2), A.par(A.remove('frog', 'pop'), armsHome('L'))],
  )),
  // Raises the staff; conjures a fireball that bursts.
  e('wizard', 'fantasy', 'witches and wizards', () => acts(
    who('wizard', { top: 'blue', bottom: 'blue', shoes: 'brown', long: true, hair: 'white', style: 'long', acc: [wear('robe', 'blue'), hat('wizard', 'blue'), starDots('yellow'), face('longbeard', 'white'), held('staff')] }),
    [A.par(arm('R', 'up'), A.effect('sparkle', { dur: 1.5 }), A.say('You shall not pass!', 2)), A.wait(0.8), armsHome('R')],
    [A.spawn('fb', 'fireball', before), A.par(arm('L', 'offer'), A.say('Fireball!', 1.6)), A.wait(1), A.par(A.remove('fb', 'explode'), armsHome('L'))],
  )),
  e('wonder woman', 'town', 'superheroes', () => acts(
    who('wonder woman', { h: 1.8, top: 'red', bottom: 'blue', skirt: 'blue', legs: 'red', shoes: 'red', hair: 'black', style: 'long', acc: [hat('tiara', 'gold'), hb('ball', [0.1, 0.1, 0.06], [0, 0.42, 0.5], 'red'), bit('torso', 'box', [3.0, 0.5, 0.2], [0, 5.9, 1.08], 'gold'), wear('belt', 'gold'), bracers('silver'), held('lasso', 'gold'), held('shield', 'red', 'L')] }),
    [A.par(arms('stop'), A.effect('sparkle', { dur: 1 }), A.say('Ping! Ping! Nice try.', 1.8)), A.wait(0.6), armsHome()],
    [A.par(arm('R', 'fist'), A.say('Lasso of Truth: now tell me everything!', 2.6)), A.wait(1), armsHome('R')],
  )),
  e('wrestler', 'town', 'sports', () => acts(
    who('wrestler', { h: 1.8, build: 1.4, skin: 'skin3', top: 'skin3', bottom: 'red', legs: 'skin3', shoes: 'red', style: 'long', hair: 'gold', acc: [hat('bandana', 'red'), champBelt, face('mustache', 'gold'), armRings('yellow', 1)] }),
    [G('arms_up', 'Ooooh YEAH!')],
    [A.par(arms('flex'), A.say('Feel the power, brother!', 2)), A.wait(1), armsHome()],
  )),
  // A green dinosaur at 1.45 m: big round snout, white belly, red saddle, orange boots, red back spikes. The tongue
  // (a slide mover) shoots out for a melon, and an egg pops out behind.
  e('yoshi', 'town', 'video game characters', () => {
    const b = m('yoshi');
    b.pair((s) => {
      b.box([0.2, 0.15, 0.34], [s * 0.14, 0.075, 0.06], { color: 'orange', round: 0.8 });
      b.rod([s * 0.13, 0.13, 0], [s * 0.12, 0.46, 0], 0.15, 'lime');
      b.rod([s * 0.22, 0.86, 0.08], [s * 0.33, 0.74, 0.24], 0.09, 'lime');
      b.ball(0.08, [s * 0.34, 0.72, 0.27], { color: 'lime' });
      b.ball([0.14, 0.24, 0.1], [s * 0.085, 1.42, 0.2], { color: 'white' });
      b.ball([0.06, 0.1, 0.03], [s * 0.085, 1.41, 0.25], { color: 'black', eye: true });
      b.ball([0.05, 0.05, 0.03], [s * 0.06, 1.21, 0.54], { color: '#2f6b2a' });
    });
    return b
      .ball([0.56, 0.62, 0.5], [0, 0.72, 0], { color: 'lime', name: 'body' })
      .ball([0.42, 0.48, 0.22], [0, 0.68, 0.18], { color: 'white' })
      .ball([0.48, 0.2, 0.38], [0, 0.9, -0.17], { color: 'red' })
      .torus([0.5, 0.4, 0.06], [0, 0.84, -0.17], { color: 'white', rot: [90, 0, 0] })
      .socket('saddle', [0, 1.0, -0.17], 'seat')
      .rod([0, 0.58, -0.2], [0, 0.36, -0.58], 0.17, 'lime')
      .rod([0, 0.88, 0.04], [0, 1.08, 0.1], 0.22, 'lime')
      .ball([0.42, 0.42, 0.42], [0, 1.22, 0.06], { color: 'lime', name: 'head' })
      .ball([0.4, 0.32, 0.42], [0, 1.15, 0.36], { color: 'lime', parent: 'head' })
      .ball([0.32, 0.14, 0.3], [0, 1.04, 0.26], { color: 'white', parent: 'head' })
      .capsule([0.07, 0.42, 0.07], [0, 1.06, 0.33], { color: 'pink', rot: [90, 0, 0], name: 'tongue', parent: 'head', mover: { kind: 'slide', axis: 'z', amount: 0.55 } })
      .each(3, (i) => b.cone([0.1 - i * 0.015, 0.12, 0.07], [0, 1.4 - i * 0.14, -0.12 - i * 0.07], { color: 'red', rot: [-35 - i * 15, 0, 0], parent: i ? undefined : 'head' }))
      .act({
        click: [
          [A.spawn('fruit', 'melon', before), A.operate('tongue', 'out'), A.par(A.remove('fruit', 'pop'), A.operate('tongue', 'in')), A.say('Yum!', 1.4), A.spawn('egg', 'egg', { rel: 'behind', of: 'self', dist: 'close' }), A.say('Pop! An egg!', 1.6), A.wait(1.2), A.remove('egg', 'pop')],
          [A.par(A.anim('hop'), A.say('Yoshi!', 1.4))],
        ],
      })
      .done();
  }),
  e('young bruce wayne', 'town', 'superheroes', () => acts(
    who('young bruce wayne', { h: 'kid', skin: 'skin1', top: 'navy', bottom: 'gray', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [front('red'), bat('L')] }),
    [A.spawn('bat', 'bat (animal)', { rel: 'above', of: 'self', dist: 'close' }), A.par(A.anim('gasp'), A.say('Bats! Eek!', 1.6)), A.remove('bat', 'fly_away')],
    [G('hands_on_hips', "I'm not scared! One day, I'll BE the bat.", 2.6)],
  )),
  e('zelda', 'town', 'video game characters', () => acts(
    who('zelda', { skin: 'skin1', hair: '#c9a25a', style: 'long', top: 'white', skirt: 'white', bottom: 'white', long: true, h: 1.6, acc: [wear('robe', 'white'), bit('torso', 'box', [1.4, 6.0, 0.25], [0, 1.5, 1.1], 'purple'), bit('torso', 'wedge', [0.9, 0.8, 0.15], [0, 2.2, 1.25], 'gold'), hat('tiara', 'gold'), elfEars('skin1'), wear('belt', 'gold')] }),
    [G('wave', 'Link! Over here!')],
    [A.par(arm('R', 'up'), A.effect('sparkle', { dur: 1.5 }), A.say('By the Triforce of Wisdom!', 2.2)), A.wait(0.8), armsHome('R')],
  )),
  // Selfie: the phone goes up, head tilts, flash.
  e('zoey', 'town', 'everyday people', () => acts(
    who('zoey', { h: 1.65, top: 'pink', skirt: 'denim', bottom: 'denim', shoes: 'white', hair: 'gold', style: 'long', acc: [hat('headband', 'pink'), held('bag', 'purple'), held('phone', undefined, 'L')] }),
    [A.par(arm('L', 'selfie'), T('head', [-8, 0, 12], 0.35), A.say('Selfie time! Say cheese!', 2)), A.effect('sparkle', { dur: 0.4 }), A.wait(0.8), A.par(armsHome('L'), home('head'))],
    [G('wave', 'Hiii! Love your outfit!')],
  )),
  // Arms out in front at rest, head lolling.
  e('zombie', 'fantasy', 'monsters', () => acts(
    rest(who('zombie', { skin: '#9cbf8a', hair: 'darkbrown', style: 'short', top: '#7a8a9a', bottom: '#5a4a3a', shoes: 'darkgray', long: true, eyes: 'red', blush: '#9cbf8a', acc: [rips('#4a4a4a')] }), { L: 'reach', R: 'reach' }),
    [A.par(T('head', [10, 0, 25], 0.6), A.say('Braaaains...', 2.2)), A.wait(0.6), home('head')],
    [A.par(A.anim('wobble'), A.say('Uuuurrgh...', 1.8))],
  )),
  e('zookeeper', 'town', 'animal care', () => acts(
    who('zookeeper', { top: 'tan', bottom: '#8a7a5a', shoes: 'brown', acc: [hat('straw', 'tan'), wear('badge', 'green'), wear('belt', 'brown'), fishBucket('R')] }),
    [A.spawn('fish', 'fish (animal)', before), A.par(arm('L', 'offer'), A.say('Feeding time! Who wants a fish?', 2.4)), A.wait(1.2), A.par(A.remove('fish', 'pop'), armsHome('L'))],
    [G('wave', 'Welcome to the zoo! Mind the penguins.')],
  )),
];
