/** Catalog chunk people-c: the words in assign/people-c.tsv. */
import { e, type CatalogEntry } from './types';
import { m } from '../dsl';
import { ani, beast, body, face, hat, held, wear, who, type Extra } from '../accessories';
import { Parts, figure } from '../kit';
import { col } from '../colors';
import { measure } from '../math';
import type { FigPart, Figure, Vec3 } from '../types';

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
const wallet = (side: 'L' | 'R' = 'R'): Extra => bit(`hand${side}`, 'box', [1.5, 1.1, 0.35], [0, -0.6, 1.0], 'darkbrown');
const mirror = (side: 'L' | 'R' = 'L'): Extra => all(stickUp(side, 1.4, 'pink'), bit(`hand${side}`, 'torus', [1.9, 1.9, 0.35], [0, 2.2, 0.4], 'pink', { tube: 0.2 }), bit(`hand${side}`, 'cyl', [1.6, 0.1, 1.6], [0, 2.2, 0.4], 'glass', { srot: [90, 0, 0] }));
const plunger = (side: 'L' | 'R' = 'L'): Extra => all(stickUp(side, -5, 'wood'), bit(`hand${side}`, 'cyl', [1.5, 0.9, 1.5], [0, -5.2, 0.4], 'red', { taper: 0.45 }));
/** A rat sitting by the feet. */
const rat: Extra = all(bit('', 'ball', [1.0, 0.8, 1.5], [3.4, 0.45, 1.4], 'gray'), bit('', 'ball', [0.7, 0.65, 0.8], [3.4, 0.6, 2.35], 'gray'),
  bit('', 'ball', [0.35, 0.35, 0.12], [3.65, 0.95, 2.2], 'pink'), bit('', 'ball', [0.35, 0.35, 0.12], [3.15, 0.95, 2.2], 'pink'), seg('', [3.4, 0.3, 0.7], [3.9, 0.15, -0.6], 0.15, 'pink'));
/** A flute or pipe held to the mouth. */
const pipe = (c = 'wood', len = 1.0): Extra => hb('capsule', [0.08, len, 0.08], [0.1, -0.42, 0.48 + len * 0.42], c, { srot: [-62, 0, 0] });
const parrot: Extra = all(bit('torso', 'ball', [0.9, 1.3, 0.9], [2.3, 7.7, -0.1], 'red'), bit('torso', 'ball', [0.75, 0.75, 0.75], [2.3, 8.55, 0.05], 'red'),
  bit('torso', 'cyl', [0.3, 0.45, 0.3], [2.3, 8.45, 0.5], 'yellow', { taper: 0, srot: [100, 0, 0] }), bit('torso', 'ball', [0.3, 1.0, 0.7], [2.75, 7.65, -0.1], 'blue'),
  bit('torso', 'capsule', [0.4, 1.4, 0.3], [2.3, 6.9, -0.55], 'blue', { srot: [-30, 0, 0] }));
const satchel = (c = 'brown'): Extra => all(bit('hips', 'box', [2.0, 1.7, 0.8], [-1.1, 0.4, 1.35], c), wear('sash', c));
const cross = (c = 'gold', y = 4.8): Extra => all(bit('torso', 'box', [0.28, 1.1, 0.15], [0, y, 1.12], c), bit('torso', 'box', [0.75, 0.28, 0.15], [0, y + 0.25, 1.14], c));
const ballChain: Extra = all(bit('', 'ball', [2.4, 2.4, 2.4], [3.2, 1.2, 1.4], 'black'), seg('', [2.4, 0.8, 1.2], [1.0, 0.6, 0.4], 0.25, 'gray'));
const xray = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [3.6, 4.4, 0.12], [0, 1.2, 1.2], '#1d2a44'), bit(`hand${side}`, 'capsule', [0.3, 3.2, 0.1], [0, 1.2, 1.3], 'white', { noInk: true }),
  ...[2.4, 1.7, 1.0, 0.3].map((y) => bit(`hand${side}`, 'capsule', [0.2, 2.4 - Math.abs(y - 1.3) * 0.4, 0.1], [0, y, 1.3], 'white', { noInk: true, srot: [0, 0, 90] })));
const laptop = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'box', [3.4, 0.25, 2.4], [0, -0.3, 1.4], 'darkgray'), bit(`hand${side}`, 'box', [3.4, 2.3, 0.2], [0, 0.8, 0.25], 'silver', { srot: [-12, 0, 0] }),
  bit(`hand${side}`, 'ball', [0.6, 0.6, 0.1], [0, 0.85, 0.37], 'white', { noInk: true }));
const hoodDown = (c: string): Extra => all(bit('torso', 'ball', [2.7, 1.3, 1.3], [0, 6.8, -1.0], c), bit('torso', 'box', [2.2, 1.1, 0.25], [0, 1.6, 1.05], c), bit('torso', 'capsule', [0.12, 1.2, 0.12], [0.4, 6.0, 1.15], 'white'), bit('torso', 'capsule', [0.12, 1.2, 0.12], [-0.4, 6.0, 1.15], 'white'));
const shoulderSpikes = (c = 'silver'): Extra => all(...[-1, 1].flatMap((s) => [0.4, 1.0].map((x) => bit('torso', 'cyl', [0.35, 0.6, 0.35], [s * (1.5 + x * 0.6), 7.2, 0], c, { taper: 0 }))));
const keyboard: Extra = all(bit('torso', 'box', [5.5, 0.5, 1.6], [0, 2.4, 1.9], 'white', { srot: [0, 0, 12] }), ...[-2, -1, 0, 1, 2].map((i) => bit('torso', 'box', [0.35, 0.2, 0.8], [i * 0.95, 2.62 + i * 0.2, 1.9], 'black', { srot: [0, 0, 12] })));
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
const rocket = (side: 'L' | 'R'): Extra => all(bit(`hand${side}`, 'cyl', [1.0, 2.6, 1.0], [0, 1.2, 1.1], 'white'), 
  bit(`hand${side}`, 'cyl', [1.0, 1.1, 1.0], [0, 3.05, 1.1], 'red', { taper: 0 }), bit(`hand${side}`, 'wedge', [2.2, 1.0, 0.15], [0, 0.2, 1.1], 'red'), bit(`hand${side}`, 'ball', [0.45, 0.45, 0.2], [0, 1.7, 1.6], 'skyblue'));
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
const flashlight = (side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [0.6, 2.4, 0.6], [0, 0.2, 1.3], 'black', { srot: [70, 0, 0] }), bit(`hand${side}`, 'cyl', [0.75, 0.2, 0.75], [0, 0.6, 2.45], 'yellow', { srot: [70, 0, 0], role: 'glow' }));
const kabuto = (c = 'black'): Extra => all(hat('helmet', c), hb('cyl', [1.45, 0.4, 1.35], [0, 0.18, -0.12], c, { taper: 0.75 }), hb('capsule', [0.08, 0.65, 0.05], [0.2, 0.9, 0.42], 'gold', { srot: [0, 0, -28] }),
  hb('capsule', [0.08, 0.65, 0.05], [-0.2, 0.9, 0.42], 'gold', { srot: [0, 0, 28] }), hb('ball', [0.16, 0.16, 0.08], [0, 0.62, 0.5], 'gold'));
const sideHair = (c: string): Extra => all(hb('ball', [0.3, 0.55, 0.7], [0.45, -0.02, -0.12], c), hb('ball', [0.3, 0.55, 0.7], [-0.45, -0.02, -0.12], c), hb('ball', [0.85, 0.5, 0.35], [0, 0.0, -0.4], c));
const plumes = (cs = ['pink', 'white']): Extra => all(hb('torus', [1.04, 0.98, 0.14], [0, 0.32, 0], 'gold', { srot: [90, 0, 0], tube: 0.3 }),
  ...[-2, -1, 0, 1, 2].map((i) => hb('capsule', [0.2, 1.2, 0.12], [Math.sin(i * 0.4) * 0.6, 0.55 + Math.cos(i * 0.4) * 0.6, -0.12], cs[Math.abs(i) % cs.length], { srot: [0, 0, -i * 23] })));
const fan = (side: 'L' | 'R', c = 'pink'): Extra => bit(`hand${side}`, 'cyl', [4.0, 0.2, 2.6], [0, 1.4, 0.8], c, { srot: [90, 0, 0], segs: 7 });
const lyre = (side: 'L' | 'R' = 'L'): Extra => all(bit(`hand${side}`, 'capsule', [0.3, 2.6, 0.3], [0.75, 1.3, 0.9], 'gold', { srot: [0, 0, -12] }), bit(`hand${side}`, 'capsule', [0.3, 2.6, 0.3], [-0.75, 1.3, 0.9], 'gold', { srot: [0, 0, 12] }),
  bit(`hand${side}`, 'capsule', [0.25, 2.2, 0.25], [0, 2.5, 0.9], 'gold', { srot: [0, 0, 90] }), bit(`hand${side}`, 'ball', [1.2, 0.6, 0.6], [0, 0.1, 0.9], 'gold'),
  ...[-0.3, 0, 0.3].map((x) => bit(`hand${side}`, 'capsule', [0.06, 2.1, 0.06], [x, 1.35, 0.9], 'white', { noInk: true })));
/** A skateboard on the ground (lift the rider 0.13 m on an adult). */
const skateboard = (c = 'red'): Extra => all(bit('', 'box', [8.5, 0.35, 2.6], [0, 1.05, 0.4], c, { round: 0.5 }), ...[[2.8, 1.3], [2.8, -0.5], [-2.8, 1.3], [-2.8, -0.5]].map(([x, z]) => bit('', 'cyl', [0.7, 0.5, 0.7], [x, 0.35, z], 'white', { srot: [90, 0, 0] })));
/** A parachute canopy above, lines to the shoulders. */
const canopy = (c = 'red', stripe = 'yellow'): Extra => (p, d) => {
  const yc = d.torsoH + d.headH * 1.2 + 0.9;
  put(p, 'torso', 'ball', [2.6, 0.9, 1.7], [0, yc, 0], c);
  put(p, 'torso', 'ball', [0.9, 0.93, 1.74], [0, yc, 0], stripe, { noInk: true });
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) rodM(p, 'torso', [sx * d.tw * 0.45, d.torsoH, 0], [sx * 1.15, yc - 0.15, sz * 0.5], 0.012, 'white');
};
const lamb: Extra = all(bit('', 'ball', [4.0, 3.0, 5.2], [4.6, 3.3, 1.0], 'wool'), bit('', 'ball', [1.6, 1.8, 2.0], [4.6, 4.6, 3.8], 'darkgray'),
  ...[[1.1, 2.6], [-1.1, 2.6], [1.1, -0.6], [-1.1, -0.6]].map(([x, z]) => bit('', 'capsule', [0.6, 2.4, 0.6], [4.6 + x, 1.2, z], 'darkgray')));
const bust: Extra = all(bit('', 'box', [2.4, 6, 2.4], [4.2, 3, 0.8], 'stone'), bit('', 'ball', [2.4, 1.2, 1.4], [4.2, 6.6, 0.8], 'white'), bit('', 'ball', [1.6, 1.9, 1.6], [4.2, 8.0, 0.8], 'white'));
const cobraBasket: Extra = all(bit('', 'cyl', [3.8, 3.0, 3.8], [4.2, 1.5, 2.0], 'tan', { taper: 1.25 }), bit('', 'torus', [4.6, 4.6, 0.6], [4.2, 3.0, 2.0], 'wood', { srot: [90, 0, 0] }), seg('', [4.2, 2.6, 2.0], [4.2, 6.0, 2.3], 0.8, 'olive'),
  bit('', 'ball', [1.8, 2.0, 0.45], [4.2, 6.1, 2.25], 'olive'), bit('', 'ball', [0.9, 0.65, 1.2], [4.2, 6.9, 2.6], 'olive'));
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
const soccerBall: Extra = all(bit('', 'ball', [2.3, 2.3, 2.3], [2.0, 1.15, 2.6], 'white'), ...[[2.0, 1.2, 3.72], [2.9, 1.5, 3.2], [1.2, 1.6, 3.3], [2.4, 0.4, 3.4]].map(([x, y, z]) => bit('', 'ball', [0.6, 0.6, 0.15], [x, y, z], 'black', { noInk: true })));
const mitt = (side: 'L' | 'R' = 'L', c = 'brown'): Extra => bit(`hand${side}`, 'ball', [1.9, 2.2, 1.2], [0, 0.2, 0.3], c);
const nightVision: Extra = all(hb('cyl', [0.14, 0.25, 0.14], [0.12, 0.38, 0.5], 'black', { srot: [90, 0, 0] }), hb('cyl', [0.14, 0.25, 0.14], [-0.12, 0.38, 0.5], 'black', { srot: [90, 0, 0] }));
const foamFinger = (side: 'L' | 'R', c = 'yellow'): Extra => all(bit(`hand${side}`, 'box', [2.0, 2.2, 0.9], [0, 1.2, 0.5], c, { role: 'label', text: '#1', round: 0.4 }), bit(`hand${side}`, 'capsule', [0.75, 2.4, 0.75], [0.4, 3.3, 0.5], c));
const binoculars = (side: 'L' | 'R' = 'R'): Extra => all(bit(`hand${side}`, 'cyl', [0.8, 1.5, 0.8], [0.45, 0.3, 1.3], 'black', { srot: [90, 0, 0] }), bit(`hand${side}`, 'cyl', [0.8, 1.5, 0.8], [-0.45, 0.3, 1.3], 'black', { srot: [90, 0, 0] }));
const clutch = (side: 'L' | 'R' = 'L', c = 'red'): Extra => bit(`hand${side}`, 'box', [1.8, 1.0, 0.5], [0, -0.3, 0.9], c, { round: 0.5 });
const cardText = (side: 'L' | 'R', text: string, c = 'white'): Extra => bit(`hand${side}`, 'box', [2.6, 1.8, 0.12], [0, 1.0, 0.8], c, { role: 'label', text, round: 0.1 });
const braces = (c = 'red'): Extra => all(bit('torso', 'box', [0.3, 6.8, 0.2], [0.8, 3.6, 1.1], c), bit('torso', 'box', [0.3, 6.8, 0.2], [-0.8, 3.6, 1.1], c));
const stoneBlock: Extra = bit('', 'box', [3.4, 2.6, 3.0], [4.0, 1.3, 1.2], 'stone', { round: 0.1 });
/** A street food cart with a striped umbrella, beside the vendor. */
const foodCart: Extra = all(bit('', 'box', [5.5, 3.6, 3.4], [5.4, 3.4, 0.6], 'red'), bit('', 'box', [5.6, 0.8, 3.5], [5.4, 4.9, 0.6], 'white'), bit('', 'torus', [2.4, 2.4, 0.6], [5.4, 1.2, 2.4], 'darkgray', { tube: 0.3 }),
  bit('', 'capsule', [0.25, 8.5, 0.25], [5.4, 9.2, 0.6], 'silver'), bit('', 'cyl', [8, 1.8, 8], [5.4, 13.0, 0.6], 'yellow', { taper: 0, segs: 8 }), bit('', 'cyl', [8.1, 0.6, 8.1], [5.4, 12.4, 0.6], 'red', { taper: 0.7, segs: 8, noInk: true }));
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
const puppy = (side: Side = 'L', c = '#c98d4a'): Extra => all(bit(`hand${side}`, 'ball', [2.2, 1.6, 1.4], [0, 0, 1.2], c), bit(`hand${side}`, 'ball', [1.3, 1.2, 1.3], [0.9, 0.9, 1.4], c), bit(`hand${side}`, 'ball', [0.6, 0.45, 0.6], [1.25, 0.75, 2.0], 'cream'),
  bit(`hand${side}`, 'ball', [0.4, 0.9, 0.3], [1.45, 0.75, 1.3], 'darkbrown'), bit(`hand${side}`, 'ball', [0.4, 0.9, 0.3], [0.35, 0.75, 1.3], 'darkbrown'));
const domino = (c = 'black'): Extra => hb('box', [0.95, 0.16, 0.3], [0, 0.05, 0.36], c, { round: 0.6 });
const bomb = (side: Side = 'L'): Extra => all(bit(`hand${side}`, 'ball', [2.0, 2.0, 2.0], [0, 0.6, 1.0], 'black'), bit(`hand${side}`, 'capsule', [0.2, 0.8, 0.2], [0.3, 1.8, 1.0], 'tan', { srot: [0, 0, -25] }), bit(`hand${side}`, 'ball', [0.45, 0.45, 0.45], [0.5, 2.2, 1.0], 'fire', { role: 'glow' }));
const fiddleBow = (side: Side = 'L'): Extra => bit(`hand${side}`, 'capsule', [0.15, 5.5, 0.15], [-1.2, 1.4, 1.0], 'darkwood', { srot: [0, 0, 55] });
const armTowel = (side: Side = 'L'): Extra => bit(`fore${side}`, 'box', [1.4, 2.4, 1.4], [0, -0.8, 0.05], 'white', { round: 0.3 });
const cloche = (side: Side = 'R'): Extra => all(held('tray', 'silver', side), bit(`hand${side}`, 'ball', [3.0, 2.2, 3.0], [0, 0.6, 1.6], 'silver'), bit(`hand${side}`, 'ball', [0.5, 0.5, 0.5], [0, 1.75, 1.6], 'silver'));
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
/** A windsurf board on the ground with a mast and sail at the rider's side (lift the rider 0.05 m). */
const windsurf: Extra = all(bit('', 'box', [16, 0.5, 3.2], [2.5, 0.25, 0.4], 'white', { round: 0.9 }), bit('', 'box', [16.1, 0.2, 3.25], [2.5, 0.3, 0.4], 'cyan', { noInk: true }), seg('', [6.5, 0.5, 0.4], [6.5, 18, 0.4], 0.35, 'silver'),
  bit('', 'wedge', [6, 16, 0.15], [9.5, 9.5, 0.4], 'orange', { apex: -0.5 }), bit('', 'wedge', [3, 8, 0.17], [8.0, 13.5, 0.4], 'yellow', { apex: -0.5, noInk: true }), seg('', [6.5, 8.5, 0.4], [12, 7.5, 0.4], 0.3, 'black'));

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
const wave = (f: Figure): Figure => pose(f, { armL: [0, 0, 135] });
/** Raise a figure (standing on skates, a skateboard, skis). */
const lift = (f: Figure, dy: number): Figure => measure({ ...f, parts: f.parts.map((p) => (p.name === 'hips' ? { ...p, at: [p.at[0], p.at[1] + dy, p.at[2]] } : p)) });
/** Recolour named parts (bare thighs under a leotard). */
const paint = (f: Figure, names: string[], c: string): Figure => ({ ...f, parts: f.parts.map((p) => (names.includes(p.name) ? { ...p, color: col(c) } : p)) });
const shorts = (skin: string) => ({ skin, legs: skin });

export const ENTRIES: CatalogEntry[] = [
  e('pediatrician', 'town', 'medical', () => who('pediatrician', { top: 'white', bottom: 'skyblue', long: true, acc: [wear('labcoat'), wear('stethoscope'), teddy('L'), hat('headband', 'white'), hb('cyl', [0.3, 0.06, 0.3], [0, 0.32, 0.5], 'silver', { srot: [80, 0, 0] })] })),
  e('pegasus', 'fantasy', 'magic horses', () => beast('pegasus', { color: 'white', body: [1.5, 0.7, 0.55], bodyShape: 'capsule', legL: 0.8, legW: 0.13, hoof: 'silver', neckL: 0.65, neckLean: 28, neckW: 0.28, head: [0.55, 0.26, 0.24], snout: { len: 0.24, h: 0.2, w: 0.18 }, ears: 'pointy', earSize: 0.1, tail: 'fluffy', tailColor: '#dfe8f5', tailAngle: 125, acc: [ani.mane('#dfe8f5'), ani.wings('#f4f8ff')] })),
  e('people', 'town', 'family', () => crowd('people', [[who('people man', { top: 'blue', bottom: 'denim', style: 'short' }), -0.55], [who('people woman', { top: 'pink', skirt: 'purple', style: 'long', h: 1.62 }), 0.05, -0.1], [who('people kid', { h: 'kid', top: 'yellow', bottom: 'navy' }), 0.6, 0.1]])),
  e('persian', 'town', 'world peoples', () => who('persian', { skin: 'skin3', hair: 'black', style: 'short', top: 'teal', bottom: '#7a2e2e', long: true, beard: 'black', acc: [wear('robe', 'teal'), wear('belt', 'gold'), face('beard', 'black'), hb('cyl', [0.95, 0.55, 0.9], [0, 0.72, 0], '#c9a227', { taper: 1.15 })] })),
  e('pharaoh', 'town', 'history', () => who('pharaoh', { skin: 'skin4', hair: 'black', style: 'short', top: 'skin4', bottom: 'white', skirt: 'white', shoes: 'gold', acc: [
    hb('ball', [1.14, 0.72, 1.08], [0, 0.22, -0.03], 'gold'), hb('box', [0.3, 1.0, 0.22], [0.47, -0.32, 0.06], 'gold'), hb('box', [0.3, 1.0, 0.22], [-0.47, -0.32, 0.06], 'gold'),
    hb('box', [0.32, 0.09, 0.24], [0.47, -0.2, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [-0.47, -0.2, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [0.47, -0.5, 0.06], 'blue'), hb('box', [0.32, 0.09, 0.24], [-0.47, -0.5, 0.06], 'blue'),
    hb('capsule', [0.12, 0.4, 0.12], [0, -0.62, 0.32], 'blue'), hb('capsule', [0.08, 0.22, 0.08], [0, 0.5, 0.48], 'gold'),
    bit('torso', 'torus', [3.4, 3.4, 0.4], [0, 6.6, 0.1], 'blue', { srot: [80, 0, 0], tube: 0.45 }), wear('belt', 'gold'), crook('R', 4, 'gold')] })),
  e('pharmacist', 'town', 'medical', () => who('pharmacist', { top: 'white', bottom: 'navy', long: true, glasses: 'black', acc: [wear('labcoat'), wear('badge', 'skyblue'), pills('L'), held('clipboard')] })),
  e('philosopher', 'town', 'history', () => who('philosopher', { skin: 'skin2', hair: 'lightgray', style: 'bald', top: 'white', bottom: 'white', shoes: 'brown', acc: [wear('toga', 'white'), wear('sash', 'skyblue'), face('longbeard', 'lightgray'), held('scroll')] })),
  e('photographer', 'town', 'arts', () => who('photographer', { top: 'black', bottom: 'denim', acc: [wear('vest', '#b9a37a'), hat('beret', 'black'), held('camera'), bit('torso', 'torus', [2.6, 2.6, 0.12], [0, 5.6, 0.2], 'black', { srot: [70, 0, 0], tube: 0.08 })] })),
  e('physical therapist', 'town', 'medical', () => who('physical therapist', { top: 'teal', bottom: 'navy', shoes: 'white', acc: [wear('badge', 'white'), held('ball', '#7fd3c3', 'L'), held('clipboard')] })),
  e('pianist', 'town', 'music', () => who('pianist', { top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'black', acc: [tux(), keyboard] })),
  e('pickpocket', 'town', 'crime', () => who('pickpocket', { top: '#5a4a3a', bottom: '#3a3a3a', long: true, acc: [hat('bowler', '#3a3a3a'), wear('scarf', 'red'), wear('coat', '#6b5a3a'), wallet('R'), bit('handL', 'box', [1.2, 0.9, 0.3], [0, -0.5, 0.9], 'gold')] })),
  e('pied piper', 'town', 'fairy tales', () => who('pied piper', { top: 'yellow', bottom: 'red', shoes: 'brown', long: true, legs: 'red', acc: [bands('red', 3), hat('beret', 'red'), hb('capsule', [0.07, 0.6, 0.07], [0.35, 0.85, -0.15], 'white', { srot: [-30, 0, -30] }), pipe('wood', 1.1), rat] })),
  e('pilgrim', 'town', 'history', () => who('pilgrim', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [collar(2.4), bit('torso', 'box', [0.8, 0.5, 0.2], [0, 0.4, 1.1], 'gold'),
    hb('cyl', [1.6, 0.05, 1.5], [0, 0.5, 0], 'black'), hb('cyl', [0.85, 0.65, 0.8], [0, 0.85, 0], 'black', { taper: 0.85 }), hb('cyl', [0.86, 0.12, 0.81], [0, 0.6, 0], 'darkgray'), hb('box', [0.28, 0.2, 0.05], [0, 0.6, 0.41], 'gold'), held('book', 'black', 'L')] })),
  e('pirate', 'town', 'sailors', () => who('pirate', { top: 'white', bottom: 'darkbrown', shoes: 'black', long: true, beard: 'black', acc: [hat('pirate'), face('eyepatch'), face('beard', 'black'), wear('vest', 'darkred'), wear('sash', 'gold'), held('sword'), parrot] })),
  e('plastic surgeon', 'town', 'medical', () => who('plastic surgeon', { top: 'white', bottom: 'skyblue', long: true, acc: [wear('labcoat'), wear('stethoscope'), held('syringe'), mirror('L'), face('glasses')] })),
  e('plumber', 'town', 'trades', () => who('plumber', { top: 'red', bottom: 'blue', shoes: 'brown', acc: [wear('overalls', 'blue'), hat('cap', 'blue'), face('mustache', 'darkbrown'), held('wrench'), plunger('L')] })),
  e('poison ivy', 'town', 'villains', () => who('poison ivy', { skin: '#e3edc8', hair: '#c0392b', style: 'long', top: 'darkgreen', bottom: 'darkgreen', shoes: 'green', long: true, acc: [leaves('leaf', 6), hb('ball', [0.35, 0.18, 0.2], [0.3, 0.5, 0.3], 'leaf'), held('bouquet', undefined, 'L')] })),
  e('police officer', 'town', 'law and order', () => who('police officer', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('police'), wear('badge'), wear('belt', 'black'), walkie('L')] })),
  e('policeman', 'town', 'law and order', () => who('policeman', { top: 'skyblue', bottom: 'navy', shoes: 'black', style: 'short', acc: [hat('police'), wear('badge'), wear('tie', 'navy'), wear('belt', 'black'), face('mustache'), held('baton', 'black')] })),
  e('policewoman', 'town', 'law and order', () => who('policewoman', { top: 'skyblue', bottom: 'navy', skirt: 'navy', shoes: 'black', style: 'bun', h: 1.65, acc: [hat('police'), wear('badge'), wear('tie', 'navy'), held('book', 'black'), walkie('L')] })),
  e('politician', 'town', 'government', () => wave(who('politician', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'gray', style: 'short', acc: [front('red'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'blue'), held('briefcase', 'black')] }))),
  e('pool boy', 'town', 'services', () => who('pool boy', { ...shorts('skin3'), top: 'white', bottom: 'skyblue', shoes: 'white', hair: 'gold', acc: [face('sunglasses'), held('net', 'skyblue')] })),
  e('pool shark', 'town', 'games', () => who('pool shark', { top: 'white', bottom: 'black', shoes: 'black', long: true, hair: 'black', acc: [wear('vest', 'black'), wear('bowtie', 'red'), bit('handR', 'capsule', [0.3, 14, 0.3], [0, 3.5, 0.5], 'wood', { srot: [0, 0, 8] }), bit('handR', 'capsule', [0.32, 0.6, 0.32], [-1.4, 10.4, 0.5], 'white'), bit('handL', 'box', [0.6, 0.6, 0.6], [0, -0.5, 0.9], 'blue')] })),
  e('poseidon', 'fantasy', 'gods', () => who('poseidon', { h: 1.95, build: 1.3, skin: 'skin3', hair: 'white', style: 'long', top: 'skin3', bottom: 'teal', skirt: 'teal', shoes: 'gold', acc: [wear('sash', 'teal'), face('longbeard', 'white'), hat('crown'), held('trident')] })),
  e('postman', 'town', 'services', () => who('postman', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), satchel('brown'), held('letter', undefined, 'L')] })),
  e('president', 'town', 'government', () => who('president', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'gray', style: 'short', acc: [front('red'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'red'), usflag('R')] })),
  e('priest', 'town', 'religion', () => who('priest', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [wear('robe', 'black'), collar(0.55), cross('gold'), held('book', 'black', 'L')] })),
  e('prince', 'town', 'royalty', () => who('prince', { top: 'blue', bottom: 'white', shoes: 'brown', long: true, style: 'short', acc: [hat('crown'), wear('cape', 'red'), wear('sash', 'gold'), wear('belt', 'brown'), held('sword')] })),
  e('princess', 'town', 'royalty', () => who('princess', { top: 'pink', skirt: 'pink', bottom: 'pink', long: true, hair: 'gold', style: 'long', h: 1.65, acc: [wear('robe', 'pink'), hat('tiara', 'gold'), wear('necklace', 'white'), held('wand', undefined, 'L')] })),
  e('princess peach', 'town', 'video game characters', () => who('princess peach', { top: '#f7a1c4', skirt: '#f7a1c4', bottom: '#f7a1c4', long: true, hair: '#f4d35e', style: 'long', skin: 'skin1', eyes: 'blue', h: 1.6, acc: [wear('robe', '#f7a1c4'), hat('crown', 'gold'), bit('torso', 'ball', [0.7, 0.7, 0.4], [0, 6.0, 1.1], 'blue'), bit('torso', 'ball', [1.3, 1.1, 1.3], [1.9, 6.6, 0], '#f7a1c4'), bit('torso', 'ball', [1.3, 1.1, 1.3], [-1.9, 6.6, 0], '#f7a1c4'), bit('hips', 'cyl', [4.6, 0.5, 3.4], [0, -2.5, 0], '#e97fab')] })),
  e('principal', 'town', 'school', () => who('principal', { top: 'darkgray', bottom: 'darkgray', shoes: 'black', long: true, hair: 'gray', style: 'short', glasses: 'black', acc: [front('navy'), face('glasses'), held('clipboard'), held('book', 'navy', 'L')] })),
  e('prisoner', 'town', 'crime', () => who('prisoner', { top: 'orange', bottom: 'orange', shoes: 'white', long: true, style: 'short', acc: [chest('24601', 'white', 2.4, 0.9), ballChain] })),
  e('prisoner of war', 'town', 'military', () => pose(who('prisoner of war', { top: '#6b7048', bottom: '#5c5f3c', shoes: 'darkbrown', long: true, style: 'short', acc: [hat('headband', 'white'), wear('necklace', 'silver'), bit('torso', 'box', [1.0, 0.6, 0.2], [-0.8, 3.0, 1.08], '#4a4c30')] }), { armL: [0, 0, 140], armR: [0, 0, -140] })),
  e('professional', 'town', 'office', () => who('professional', { top: '#3d4552', bottom: '#3d4552', shoes: 'black', long: true, acc: [front('blue'), held('briefcase'), held('phone', undefined, 'L')] })),
  e('professor', 'town', 'school', () => who('professor', { top: '#8a6a4a', bottom: 'brown', shoes: 'darkbrown', long: true, hair: 'lightgray', style: 'bald', beard: 'lightgray', acc: [wear('vest', '#6b5a3a'), wear('bowtie', 'red'), face('beard', 'lightgray'), face('glasses'), held('book', 'darkred', 'L'), held('pointer')] })),
  e('programmer', 'town', 'office', () => who('programmer', { top: '#4a4f5c', bottom: 'denim', shoes: 'white', long: true, glasses: 'black', acc: [hoodDown('#4a4f5c'), face('glasses'), hat('headphones', 'black'), laptop('L'), held('cup', 'white')] })),
  e('protester', 'town', 'activism', () => who('protester', { top: 'green', bottom: 'denim', shoes: 'white', acc: [hat('cap', 'red'), placard('PROTEST!', 'white')] })),
  e('psychologist', 'town', 'medical', () => who('psychologist', { top: '#c9b28a', bottom: 'brown', skirt: 'brown', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), held('clipboard'), held('pointer', 'black', 'L'), wear('scarf', 'teal')] })),
  e('punk rocker', 'town', 'music', () => who('punk rocker', { top: 'black', bottom: '#8a1f2a', shoes: 'black', long: true, style: 'bald', hair: 'magenta', acc: [hat('mohawk', 'magenta'), shoulderSpikes(), wear('belt', 'silver'), held('guitar', 'red')] })),
  e('puppet', 'toys', 'puppets', () => scale(who('puppet', { h: 'kid', skin: 'lightwood', hair: 'darkbrown', style: 'short', top: 'red', bottom: 'blue', shoes: 'darkbrown', blush: 'red', acc: [hat('party', 'yellow'), wear('bowtie', 'yellow'), (p, d) => {
    const yb = d.torsoH + d.headY + d.headH * 0.5 + d.H * 0.35, x = d.tw / 2 + d.aw * 0.3;
    put(p, 'torso', 'box', [d.tw * 2.2, d.aw * 0.4, d.aw * 0.4], [0, yb, 0], 'wood');
    put(p, 'torso', 'box', [d.aw * 0.4, d.aw * 0.4, d.tw * 1.4], [0, yb, 0], 'wood');
    for (const s of [1, -1]) put(p, 'torso', 'capsule', [0.012, yb - d.torsoH, 0.012], [s * x, (yb + d.torsoH) / 2, 0], 'white');
  }] }), 0.6 / 1.35)),
  e('queen', 'town', 'royalty', () => who('queen', { top: 'purple', skirt: 'purple', bottom: 'purple', long: true, hair: 'lightgray', style: 'bun', h: 1.7, acc: [wear('robe', 'purple'), wear('cape', 'darkred'), hat('crown'), wear('necklace', 'white'), held('staff', 'gold')] })),
  e('racecar driver', 'town', 'sports', () => who('racecar driver', { top: 'red', bottom: 'red', shoes: 'black', long: true, acc: [wear('sash', 'white'), chest('7', 'white', 1.0, 1.0, 5.6), wear('belt', 'black'), helmetHeld('red', 'L'), held('trophy')] })),
  e('radiologist', 'town', 'medical', () => who('radiologist', { top: 'white', bottom: 'teal', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), wear('badge', 'skyblue'), xray('L')] })),
  e('real estate agent', 'town', 'sales', () => who('real estate agent', { top: 'navy', bottom: 'tan', skirt: 'tan', long: true, style: 'bun', acc: [front('', 'white'), wear('badge', 'white'), placard('FOR SALE', '#d93a3a'), bit('handL', 'box', [0.35, 1.2, 0.15], [0, -0.4, 0.9], 'gold'), bit('handL', 'torus', [0.8, 0.8, 0.15], [0, 0.45, 0.9], 'gold', { tube: 0.3 })] })),
  e('rebel', 'town', 'activism', () => wave(who('rebel', { top: 'black', bottom: 'denim', shoes: 'black', long: true, acc: [hat('bandana', 'red'), wear('scarf', 'red'), wear('belt', 'silver'), held('flag', 'black')] }))),
  e('redcoat', 'town', 'history', () => who('redcoat', { top: 'red', bottom: 'white', shoes: 'black', long: true, hair: 'white', style: 'ponytail', acc: [tricorn(), wear('sash', 'white'), bit('torso', 'box', [0.7, 8.4, 2.4], [0, 3.5, 0], 'white', { srot: [0, 0, -35] }), wear('belt', 'white'), stickUp('R', 12, 'darkwood', 0.35), bit('handR', 'capsule', [0.2, 3, 0.2], [0, 13.2, 0.4], 'silver')] })),
  e('referee', 'town', 'sports', () => wave(who('referee', { top: 'white', bottom: 'black', shoes: 'black', acc: [bands('black', 5), wear('whistle'), bit('handL', 'box', [0.9, 1.3, 0.12], [0, 1.1, 0.6], 'yellow')] }))),
  e('revolutionary', 'town', 'history', () => who('revolutionary', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, hair: 'black', style: 'long', beard: 'black', acc: [hat('beret', 'black'), hb('ball', [0.14, 0.14, 0.06], [0.05, 0.58, 0.42], 'red'), face('beard', 'black'), wear('belt', 'darkbrown'), held('flag', 'red')] })),
  e('robot', 'fantasy', 'robots', () => who('robot', { skin: 'silver', style: 'none', top: 'steel', bottom: 'steel', shoes: 'darkgray', long: true, eyes: 'cyan', blush: 'silver', acc: [hat('antennae', 'red'), hb('cyl', [0.22, 0.15, 0.22], [0.52, 0, 0], 'darkgray', { srot: [0, 0, 90] }), hb('cyl', [0.22, 0.15, 0.22], [-0.52, 0, 0], 'darkgray', { srot: [0, 0, 90] }), bit('torso', 'box', [2.0, 1.8, 0.3], [0, 4.6, 1.05], 'darkgray'), ...['red', 'lime', 'yellow'].map((c, i) => bit('torso', 'ball', [0.4, 0.4, 0.2], [(i - 1) * 0.6, 4.9, 1.25], c, { role: 'glow' })), wear('belt', 'darkgray')] })),
  e('rock star', 'town', 'music', () => who('rock star', { top: 'black', bottom: '#4b2a6b', shoes: 'black', long: true, hair: 'gold', style: 'long', acc: [face('sunglasses'), wear('necklace', 'silver'), wear('belt', 'silver'), held('guitar', 'darkred')] })),
  e('rocket scientist', 'town', 'science', () => who('rocket scientist', { top: 'white', bottom: 'navy', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), wear('badge', 'blue'), rocket('L'), held('clipboard')] })),
  e('rogue', 'town', 'crime', () => who('rogue', { top: 'darkbrown', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', '#2f3d2f'), wear('cloak', '#2f3d2f'), face('mask', 'black'), wear('belt', 'brown'), held('knife'), held('knife', undefined, 'L')] })),
  e('roller skater', 'town', 'sports', () => lift(who('roller skater', { h: 1.7, ...shorts('skin2'), top: 'magenta', bottom: 'skyblue', style: 'ponytail', hair: 'darkbrown', acc: [hat('helmet', 'cyan'), skates('pink'), kneepads('black')] }), 0.107)),
  e('rumpelstiltskin', 'town', 'fairy tales', () => scale(who('rumpelstiltskin', { h: 'kid', skin: 'skin2', hair: '#a0522d', style: 'short', top: 'darkred', bottom: 'brown', shoes: 'darkbrown', long: true, acc: [hat('wizard', '#8a5a2b'), face('longbeard', '#a0522d'), hb('ball', [0.26, 0.22, 0.3], [0, -0.06, 0.5], 'skin2'), wear('belt', 'black'), held('ball', 'gold')] }), 1.15 / 1.35)),
  e('sailor', 'town', 'sailors', () => who('sailor', { top: 'white', bottom: 'white', shoes: 'black', style: 'short', acc: [sailorHat, bit('torso', 'box', [3.2, 1.8, 0.3], [0, 6.2, -1.1], 'navy'), wear('scarf', 'navy')] })),
  e('samurai', 'town', 'history', () => who('samurai', { top: '#2b2b40', bottom: '#3a3a5a', shoes: 'darkbrown', long: true, hair: 'black', style: 'bun', acc: [wear('armor', 'darkred'), bit('hips', 'cyl', [4.8, 5.4, 3.6], [0, -2.6, 0], '#3a3a5a', { taper: 0.75 }), wear('belt', 'white'), held('sword', 'silver'), bit('hips', 'capsule', [0.3, 4.5, 0.3], [1.6, 0.5, 0.8], 'black', { srot: [60, 0, 20] }), hat('headband', 'white')] })),
  e('sandman', 'fantasy', 'spirits', () => who('sandman', { top: 'navy', bottom: 'navy', long: true, hair: 'white', style: 'short', acc: [wear('robe', 'navy'), hat('santa', 'navy'), face('longbeard', 'white'), starDots(), bit('handL', 'ball', [2.6, 3.0, 2.2], [0, -1.6, 1.0], 'tan'), bit('handL', 'ball', [0.8, 0.7, 0.8], [0, 0, 1.0], 'tan'), ...[0, 1, 2].map((i) => bit('handR', 'ball', [0.35, 0.35, 0.35], [0, -1.0 - i * 0.9, 1.0 + i * 0.2], 'gold', { role: 'glow' }))] })),
  e('santa', 'town', 'holidays', () => who('santa', { h: 1.8, build: 1.35, skin: 'skin1', top: 'red', bottom: 'red', shoes: 'black', long: true, hair: 'white', blush: '#f08080', acc: [hat('santa'), face('longbeard', 'white'), face('mustache', 'white'), bit('torso', 'ball', [3.0, 3.6, 2.0], [0, 2.8, 0.5], 'red'), bit('torso', 'cyl', [3.9, 0.7, 2.6], [0, 0.2, 0], 'white'), wear('belt', 'black'), bit('hips', 'box', [1.0, 0.9, 0.3], [0, 0.55, 1.3], 'gold'), sack()] })),
  e('saxophonist', 'town', 'music', () => who('saxophonist', { top: 'purple', bottom: 'black', shoes: 'black', long: true, acc: [fedora('black'), face('sunglasses'), sax] })),
  e('school boy', 'town', 'school', () => who('school boy', { h: 'kid', ...shorts('skin2'), top: 'white', bottom: 'navy', shoes: 'black', style: 'short', acc: [wear('tie', 'red'), wear('backpack', 'red'), hat('cap', 'navy')] })),
  e('school girl', 'town', 'school', () => who('school girl', { h: 'kid', top: 'white', skirt: 'navy', bottom: 'navy', legs: 'white', shoes: 'black', style: 'pigtails', acc: [wear('bowtie', 'red'), wear('backpack', 'pink'), held('book', 'red')] })),
  e('science teacher', 'town', 'school', () => who('science teacher', { top: 'white', bottom: 'brown', long: true, glasses: 'black', acc: [wear('labcoat'), face('glasses'), flask('L', 'lime'), held('pointer')] })),
  e('scientist', 'town', 'science', () => who('scientist', { top: 'white', bottom: 'darkgray', long: true, hair: 'white', style: 'spiky', acc: [wear('labcoat'), face('goggles'), tube('R', 'cyan'), tube('L', 'magenta')] })),
  e('scuba diver', 'town', 'sports', () => who('scuba diver', { top: 'black', bottom: 'black', shoes: 'yellow', long: true, acc: [face('goggles', 'cyan'), face('snorkel', 'yellow'), wear('vest', '#2b4a6b'), body('jetpack', 'yellow'), flippers('yellow'), wear('belt', 'yellow')] })),
  e('sculptor', 'town', 'arts', () => who('sculptor', { top: 'cream', bottom: 'brown', long: true, beard: 'darkbrown', acc: [wear('apron', 'lightgray'), hat('beret', 'black'), face('beard', 'darkbrown'), held('hammer'), chisel('L'), bust] })),
  e('secret agent', 'town', 'spies', () => who('secret agent', { top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [front('black'), face('sunglasses'), earpiece, held('blaster', 'black')] })),
  e('secretary', 'town', 'office', () => who('secretary', { top: 'white', skirt: 'darkgray', bottom: 'darkgray', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), held('clipboard'), held('phone', undefined, 'L'), wear('necklace', 'white')] })),
  e('security guard', 'town', 'law and order', () => who('security guard', { top: 'black', bottom: 'black', shoes: 'black', build: 1.25, h: 1.78, acc: [hat('cap', 'black'), chest('SECURITY', 'yellow', 2.6, 0.8, 5.3), wear('belt', 'darkgray'), flashlight('R'), walkie('L')] })),
  e('sergeant', 'town', 'military', () => who('sergeant', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, acc: [hat('cowboy', '#8a7a4a'), armRings('yellow', 3), wear('whistle'), wear('belt', 'black'), held('clipboard')] })),
  e('serial killer', 'town', 'crime', () => who('serial killer', { top: '#3a3a3a', bottom: 'black', shoes: 'black', long: true, acc: [hat('beanie', 'black'), wear('coat', '#2a2a2a'), gloves('black'), held('knife')] })),
  e('shakespeare', 'town', 'history', () => who('shakespeare', { skin: 'skin1', top: 'black', bottom: 'black', legs: 'black', long: true, style: 'bald', hair: 'brown', acc: [ruff(), sideHair('brown'), face('mustache', 'brown'), hb('ball', [0.2, 0.2, 0.15], [0, -0.48, 0.38], 'brown'), hb('ball', [0.07, 0.07, 0.07], [-0.5, -0.2, 0], 'gold'), bit('hips', 'ball', [4.0, 2.4, 2.8], [0, -0.6, 0], 'black'), quill('R'), held('scroll', undefined, 'L')] })),
  e('sheik', 'town', 'royalty', () => who('sheik', { top: 'white', bottom: 'white', shoes: 'brown', long: true, hair: 'black', beard: 'black', acc: [wear('robe', 'white'), wear('cape', 'black'), hat('hood', 'white'), agal, face('beard', 'black'), face('mustache', 'black')] })),
  e('shepherd', 'town', 'farming', () => who('shepherd', { top: '#8a6a4a', bottom: '#8a6a4a', shoes: 'brown', long: true, beard: 'darkbrown', acc: [wear('robe', '#9a7a55'), hat('hood', 'cream'), hat('headband', 'brown'), face('beard', 'darkbrown'), crook('R', 11, 'wood'), lamb] })),
  e('sheriff', 'town', 'law and order', () => who('sheriff', { top: 'cream', bottom: 'denim', shoes: 'brown', long: true, acc: [hat('cowboy'), wear('vest', 'brown'), starBadge('gold'), face('mustache'), wear('belt', 'darkbrown'), held('blaster', 'darkgray')] })),
  e('ship captain', 'town', 'sailors', () => who('ship captain', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, hair: 'white', beard: 'white', acc: [hat('police', 'white'), hb('box', [0.25, 0.15, 0.05], [0, 0.6, 0.47], 'gold'), face('beard', 'white'), buttons(), telescope('R')] })),
  e('shoemaker', 'town', 'trades', () => who('shoemaker', { top: 'cream', bottom: 'brown', long: true, hair: 'gray', glasses: 'black', acc: [wear('apron', 'leather'), face('glasses'), held('hammer'), shoeHeld('L')] })),
  e('shogun', 'town', 'history', () => who('shogun', { top: 'black', bottom: '#4a2a2a', shoes: 'black', long: true, hair: 'black', beard: 'black', build: 1.15, acc: [wear('armor', 'gold'), kabuto('black'), face('mustache', 'black'), face('beard', 'black'), bit('hips', 'cyl', [4.8, 5.4, 3.6], [0, -2.6, 0], '#4a2a2a', { taper: 0.75 }), held('sword')] })),
  e('shopkeeper', 'town', 'shops', () => who('shopkeeper', { top: 'white', bottom: 'brown', acc: [wear('apron', 'green'), face('mustache'), held('bag', 'tan'), bit('handR', 'capsule', [0.35, 1.6, 0.35], [0.6, -0.5, 0.5], 'lettuce'), bit('handR', 'capsule', [0.5, 2.0, 0.5], [-0.5, -0.3, 0.5], 'bread')] })),
  e('showgirl', 'town', 'entertainment', () => paint(who('showgirl', { skin: 'skin2', top: 'magenta', bottom: 'magenta', legs: 'skin2', shoes: 'gold', hair: 'gold', style: 'long', acc: [plumes(), bit('hips', 'ball', [3.6, 3.0, 2.0], [0, -0.3, -2.0], 'pink'), wear('necklace', 'white'), fan('L')] }), ['legL', 'legR'], 'skin2')),
  e('singer', 'town', 'music', () => who('singer', { top: 'red', skirt: 'red', bottom: 'red', hair: 'black', style: 'long', acc: [wear('robe', 'red'), wear('necklace', 'white'), held('mic')] })),
  e('siren (monster)', 'fantasy', 'sea folk', () => who('siren (monster)', { skin: '#a8d8c8', hair: '#1d3b4a', style: 'long', top: '#a8d8c8', bottom: '#4b2d6b', shoes: '#4b2d6b', eyes: 'red', acc: [shell('purple'), body('fishtail', '#4b2d6b'), lyre('L')] })),
  e('skater', 'town', 'sports', () => lift(who('skater', { h: 1.7, top: 'teal', bottom: 'tan', shoes: 'white', acc: [hat('beanie', 'orange'), skateboard('red')] }), 0.12)),
  e('skier', 'town', 'sports', () => lift(who('skier', { h: 1.7, top: 'red', bottom: 'black', shoes: 'gray', long: true, acc: [hat('beanie', 'white'), face('goggles', 'orange'), skis('blue'), poles] }), 0.02)),
  e('skydiver', 'town', 'sports', () => who('skydiver', { top: 'orange', bottom: 'orange', shoes: 'black', long: true, acc: [hat('helmet', 'black'), face('goggles'), wear('backpack', 'navy'), canopy()] })),
  e('slacker', 'town', 'everyday people', () => who('slacker', { top: 'gray', bottom: '#5a5f66', shoes: 'darkgray', long: true, style: 'long', hair: 'brown', acc: [hoodDown('gray'), held('phone'), held('bag', 'orange', 'L')] })),
  e('snake charmer', 'town', 'entertainment', () => who('snake charmer', { skin: 'skin4', top: 'white', bottom: 'white', shoes: 'brown', long: true, beard: 'black', acc: [hat('turban', 'orange'), face('beard', 'black'), wear('vest', 'darkred'), gourdPipe, cobraBasket] })),
  e('sniper', 'town', 'military', () => who('sniper', { top: '#5c6b3a', bottom: '#4a5530', shoes: 'darkbrown', long: true, acc: [hat('straw', '#5c6b3a'), wear('vest', '#6b7a4a'), rifle('#3a3f2a', true), wear('belt', 'darkbrown')] })),
  e('snow suit kid', 'town', 'family', () => who('snow suit kid', { h: 'kid', build: 1.3, top: 'skyblue', bottom: 'skyblue', shoes: 'navy', long: true, blush: '#ff8a8a', acc: [hat('beanie', 'red'), wear('scarf', 'red'), mittens('red'), wear('belt', 'navy')] })),
  e('snowman', 'toys', 'holiday', () =>
    m('snowman')
      .ball(0.75, [0, 0.36, 0], { color: 'snow' }).ball(0.56, [0, 0.95, 0], { color: 'snow' }).ball(0.42, [0, 1.38, 0], { color: 'snow' })
      .cone([0.07, 0.24, 0.07], [0, 1.37, 0.3], { color: 'orange', rot: [90, 0, 0] })
      .ball(0.05, [0.08, 1.45, 0.18], { color: 'black' }).ball(0.05, [-0.08, 1.45, 0.18], { color: 'black' })
      .ball(0.05, [0, 1.03, 0.27], { color: 'black' }).ball(0.05, [0, 0.88, 0.28], { color: 'black' }).ball(0.05, [0, 0.55, 0.37], { color: 'black' })
      .torus([0.46, 0.46, 0.12], [0, 1.18, 0], { color: 'red', rot: [90, 0, 0], tube: 0.4 }).box([0.09, 0.28, 0.05], [0.12, 1.02, 0.22], { color: 'red', rot: [10, 0, 10] })
      .cyl([0.5, 0.025, 0.5], [0, 1.57, 0], { color: 'black' }).cyl([0.3, 0.26, 0.3], [0, 1.7, 0], { color: 'black' }).cyl([0.31, 0.05, 0.31], [0, 1.61, 0], { color: 'red' })
      .rod([0.24, 1.0, 0], [0.62, 1.25, 0], 0.035, 'bark').rod([-0.24, 1.0, 0], [-0.62, 1.25, 0], 0.035, 'bark').rod([0.52, 1.2, 0], [0.6, 1.36, 0], 0.025, 'bark')
      .done(),
  ),
  e('soccer player', 'town', 'sports', () => who('soccer player', { top: 'red', bottom: 'white', legs: 'red', shoes: 'black', acc: [chest('10', 'white', 1.2, 1.0, 5.2), soccerBall] })),
  e('socialist', 'town', 'government', () => wave(who('socialist', { top: '#c0392b', bottom: 'darkgray', shoes: 'black', long: true, acc: [hat('cap', 'darkgray'), wear('scarf', 'red'), held('flag', 'red'), held('book', 'red', 'L')] }))),
  e('socrates', 'town', 'history', () => who('socrates', { skin: 'skin2', hair: 'gray', style: 'bald', top: 'cream', bottom: 'cream', shoes: 'brown', beard: 'gray', acc: [wear('toga', 'cream'), wear('sash', 'tan'), face('beard', 'gray'), face('longbeard', 'gray'), sideHair('gray'), held('cup', 'bronze')] })),
  e('softball player', 'town', 'sports', () => who('softball player', { top: 'yellow', bottom: 'white', legs: 'navy', shoes: 'black', style: 'ponytail', acc: [hat('cap', 'navy'), chest('7', 'navy', 1.0, 1.0, 5.2), held('bat'), mitt('L')] })),
  e('soldier', 'town', 'military', () => who('soldier', { top: '#5c6b3a', bottom: '#5c6b3a', shoes: 'black', long: true, style: 'short', acc: [hat('military'), wear('backpack', '#4a5530'), wear('belt', 'darkbrown'), rifle('darkgray')] })),
  e('sorceress', 'fantasy', 'witches and wizards', () => who('sorceress', { top: 'purple', skirt: 'purple', bottom: 'purple', long: true, hair: 'black', style: 'long', acc: [wear('robe', 'purple'), wear('cape', '#3a1a4a'), hat('tiara', 'gold'), hb('ball', [0.12, 0.12, 0.08], [0, 0.42, 0.48], 'magenta'), held('staff', 'darkwood'), bit('handL', 'ball', [1.3, 1.3, 1.3], [0, 1.3, 0.8], 'magenta', { role: 'glow' })] })),
  e('special force', 'town', 'military', () => who('special force', { top: 'black', bottom: 'black', shoes: 'black', long: true, build: 1.15, acc: [hat('helmet', 'black'), nightVision, face('mask', 'black'), wear('vest', 'darkgray'), wear('belt', 'darkgray'), rifle('black')] })),
  e('sphinx (creature)', 'fantasy', 'mythic beasts', () => beast('sphinx (creature)', { color: '#d9b26a', body: [1.7, 0.75, 0.75], bodyShape: 'capsule', legL: 0.75, legW: 0.2, hoof: '#c9a25a', neckL: 0.35, neckLean: 10, neckW: 0.32, head: [0.42, 0.5, 0.42], headColor: 'skin3', ears: 'side', earSize: 0.1, tail: 'tuft', tailColor: '#8a6a3a', acc: [sphinxHead] })),
  e('sports fan', 'town', 'sports', () => wave(who('sports fan', { top: 'blue', bottom: 'denim', shoes: 'white', blush: 'blue', acc: [hat('cap', 'yellow'), wear('scarf', 'yellow'), chest('GO!', 'yellow', 1.6, 0.9, 5.2), foamFinger('L')] }))),
  e('spy', 'town', 'spies', () => who('spy', { top: 'tan', bottom: 'darkbrown', shoes: 'black', long: true, acc: [wear('coat', 'tan'), wear('belt', 'darkbrown'), fedora('#6b5a3a'), face('sunglasses'), held('magnifier'), held('book', 'paper', 'L')] })),
  e('squire', 'town', 'history', () => who('squire', { top: '#3a6ea5', bottom: 'brown', shoes: 'darkbrown', long: true, h: 'kid', style: 'short', hair: 'brown', acc: [wear('belt', 'brown'), bit('torso', 'box', [1.0, 1.0, 0.2], [0, 4.6, 1.1], 'gold'), held('shield', 'red', 'L'), helmetHeld('steel', 'R')] })),
  e('stalker', 'town', 'crime', () => who('stalker', { top: 'darkgray', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', 'darkgray'), face('sunglasses'), binoculars('R'), held('camera', undefined, 'L')] })),
  e('starlet', 'town', 'entertainment', () => who('starlet', { top: 'gold', skirt: 'gold', bottom: 'gold', hair: '#f4d35e', style: 'long', skin: 'skin1', acc: [wear('robe', 'gold'), face('sunglasses'), wear('necklace', 'white'), wear('scarf', 'white'), clutch('L', 'red')] })),
  e('steward', 'town', 'travel', () => who('steward', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, style: 'short', acc: [front('red'), hat('police', 'navy'), bit('torso', 'box', [1.0, 0.25, 0.15], [-0.9, 5.9, 1.12], 'gold'), held('tray'), bit('handR', 'cyl', [0.6, 0.8, 0.6], [0.8, 1.0, 1.6], 'white'), bit('handR', 'cyl', [0.6, 0.8, 0.6], [-0.8, 1.0, 1.6], 'white')] })),
  e('stock trader', 'town', 'office', () => who('stock trader', { top: 'white', bottom: 'navy', shoes: 'black', long: true, style: 'short', acc: [braces('red'), wear('tie', 'blue'), held('phone'), cardText('L', 'BUY!', 'lime')] })),
  e('stonemason', 'town', 'trades', () => who('stonemason', { top: 'gray', bottom: 'brown', shoes: 'darkbrown', long: true, acc: [wear('apron', 'leather'), hat('beret', 'darkgray'), held('hammer'), chisel('L'), stoneBlock] })),
  e('street vendor', 'town', 'food service', () => who('street vendor', { top: 'yellow', bottom: 'denim', shoes: 'brown', acc: [wear('apron', 'white'), hat('cap', 'red'), held('spatula'), foodCart] })),
  e('strongman', 'town', 'entertainment', () => who('strongman', { h: 1.9, build: 1.45, skin: 'skin3', top: 'skin3', bottom: '#d9a441', legs: 'skin3', shoes: 'black', style: 'bald', hair: 'black', acc: [wear('sash', '#d9a441'), wear('belt', 'black'), face('mustache', 'black'), dumbbell('R'), dumbbell('L')] })),
  e('student', 'town', 'school', () => who('student', { top: 'orange', bottom: 'denim', shoes: 'white', long: true, glasses: 'black', acc: [face('glasses'), wear('backpack', 'navy'), held('book', 'green', 'L'), held('pointer', 'yellow')] })),
  e('sultan', 'town', 'royalty', () => who('sultan', { top: 'darkred', bottom: 'gold', shoes: 'gold', long: true, beard: 'black', hair: 'black', acc: [wear('robe', 'darkred'), wear('sash', 'gold'), hat('turban', 'white'), plume('white', 'red'), face('mustache', 'black'), face('beard', 'black'), held('sword', 'gold')] })),
  e('sumo', 'town', 'sports', () => who('sumo', { h: 1.85, build: 1.55, skin: 'skin2', top: 'skin2', bottom: 'skin2', shoes: 'skin2', hair: 'black', style: 'bun', acc: [bit('torso', 'ball', [4.2, 4.6, 3.0], [0, 2.6, 0.5], 'skin2'), mawashi('navy')] })),
  e('sunbather', 'town', 'everyday people', () => paint(who('sunbather', { skin: 'skin3', top: 'teal', bottom: 'teal', legs: 'skin3', shoes: 'skin3', style: 'long', hair: 'darkbrown', acc: [hat('straw'), face('sunglasses'), towel('L', 'orange'), bit('handR', 'cyl', [0.7, 1.6, 0.7], [0, 0.3, 0.8], 'yellow')] }), ['legL', 'legR'], 'skin3')),
  e('superman', 'town', 'superheroes', () => wave(who('superman', { h: 1.9, build: 1.25, top: 'blue', bottom: 'blue', shoes: 'red', long: true, hair: 'black', style: 'short', acc: [wear('cape', 'red'), bit('hips', 'box', [3.4, 1.2, 2.2], [0, -0.3, 0], 'red'), wear('belt', 'yellow'), bit('torso', 'box', [2.0, 1.6, 0.15], [0, 5.3, 1.1], 'yellow', { srot: [0, 0, 0] }), chest('S', 'red', 1.5, 1.2, 5.3), curl()] }))),
  e('supermodel', 'town', 'fashion', () => who('supermodel', { h: 1.78, build: 0.85, top: 'black', skirt: 'black', bottom: 'black', shoes: 'red', hair: 'darkbrown', style: 'long', acc: [face('sunglasses'), wear('necklace', 'gold'), held('bag', 'red')] })),
  e('surfer', 'town', 'sports', () => who('surfer', { ...shorts('skin3'), top: 'cyan', bottom: 'orange', shoes: 'skin3', hair: '#f0d070', style: 'long', acc: [held('surfboard', 'yellow'), wear('necklace', 'white')] })),
  e('surgeon', 'town', 'medical', () => who('surgeon', { top: 'teal', bottom: 'teal', shoes: 'white', long: true, acc: [skullcap('teal'), face('mask', 'skyblue'), gloves('skyblue'), held('knife', 'silver')] })),
  e('tap dancer', 'town', 'entertainment', () => who('tap dancer', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [hat('top', 'black'), tux(), gloves('white'), held('cane', 'black'), taps] })),
  e('teacher', 'town', 'school', () => who('teacher', { top: 'green', skirt: 'brown', bottom: 'brown', long: true, style: 'bun', glasses: 'black', acc: [face('glasses'), wear('necklace', 'white'), held('book', 'blue'), apple('L')] })),
  e('teen', 'town', 'family', () => who('teen', { h: 1.62, top: 'purple', bottom: 'denim', shoes: 'white', long: true, style: 'long', acc: [hoodDown('purple'), hat('headphones', 'white'), held('phone')] })),
  e('teenager', 'town', 'family', () => who('teenager', { h: 1.65, top: 'black', bottom: 'denim', shoes: 'red', style: 'spiky', acc: [chest('MEH', 'white', 1.8, 0.8, 5.0), wear('backpack', 'lime'), held('phone'), held('skateboard', 'orange', 'L')] })),
  e('tennis player', 'town', 'sports', () => who('tennis player', { top: 'white', skirt: 'white', bottom: 'white', shoes: 'white', style: 'ponytail', acc: [hat('headband', 'lime'), held('racket'), smallBall('L')] })),
  e('terracotta warrior', 'town', 'history', () => who('terracotta warrior', { h: 1.85, skin: '#b5735a', hair: '#9a5f48', style: 'bun', top: '#a8644e', bottom: '#a8644e', skirt: '#b5735a', shoes: '#8a4f3c', long: true, eyes: '#5a3020', blush: '#b5735a', acc: [wear('armor', '#9a5f48'), wear('belt', '#8a4f3c')] })),
  e('thor', 'town', 'superheroes', () => who('thor', { h: 'tall', build: 1.3, top: '#3a3f4a', bottom: '#3a3f4a', shoes: '#3a3f4a', long: true, hair: 'gold', style: 'long', beard: 'gold', acc: [wear('cape', 'red'), discs(), face('beard', 'gold'), wear('belt', 'silver'), mjolnir('R')] })),
  e('time traveler', 'fantasy', 'sci-fi', () => who('time traveler', { top: 'cream', bottom: 'brown', shoes: 'darkbrown', long: true, hair: 'white', style: 'spiky', acc: [wear('coat', '#5a3a22'), wear('vest', '#7a2e2e'), wear('bowtie', 'black'), browGoggles, pocketWatch('R'), hourglass('L')] })),
  e('titan', 'fantasy', 'giants', () => who('titan', { h: 6, build: 1.35, skin: 'skin3', hair: 'gray', style: 'long', top: 'skin3', bottom: '#7a5a3a', skirt: '#7a5a3a', shoes: 'brown', beard: 'gray', acc: [wear('sash', '#7a5a3a'), face('longbeard', 'gray'), hat('headband', 'gold'), bit('handL', 'ball', [4.2, 3.6, 3.8], [0, -1.0, 1.8], 'stone')] })),
  e('tom jones', 'town', 'music', () => who('tom jones', { h: 1.83, skin: 'skin2', hair: '#2a1d16', style: 'short', top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [hb('ball', [1.12, 0.5, 1.05], [0, 0.32, -0.04], '#2a1d16'), front('', 'skin2'), wear('necklace', 'gold'), wear('belt', 'gold'), held('mic')] })),
  e('tooth fairy', 'fantasy', 'fairies', () => who('tooth fairy', { h: 'kid', top: 'skyblue', skirt: '#cdeefb', bottom: 'skyblue', hair: 'gold', style: 'bun', acc: [wear('tutu', '#cdeefb'), body('fairywings'), hat('tiara', 'silver'), held('wand'), toothHeld('L')] })),
  e('tots', 'town', 'family', () => crowd('tots', [[scale(who('tot one', { h: 'kid', top: 'yellow', bottom: 'blue', style: 'short' }), 0.7), -0.38], [scale(who('tot two', { h: 'kid', top: 'pink', skirt: 'magenta', style: 'pigtails' }), 0.68), 0, -0.05], [scale(who('tot three', { h: 'kid', top: 'lime', bottom: 'red', style: 'spiky' }), 0.72), 0.38]])),
  e('tour guide', 'town', 'travel', () => wave(who('tour guide', { top: 'orange', bottom: 'tan', shoes: 'brown', acc: [hat('cap', 'orange'), wear('necklace', 'blue'), wear('badge', 'white'), held('flag', 'yellow')] }))),
  e('tourist', 'town', 'travel', () => who('tourist', { ...shorts('skin1'), top: 'cyan', bottom: 'tan', shoes: 'brown', acc: [flowerDots(), hat('straw'), face('sunglasses'), held('camera'), held('map', undefined, 'L'), wear('backpack', 'orange')] })),
  e('train conductor', 'town', 'transport', () => who('train conductor', { top: 'navy', bottom: 'navy', shoes: 'black', long: true, acc: [hat('police', 'navy'), buttons('gold'), wear('whistle'), held('lantern')] })),
  e('train engineer', 'town', 'transport', () => who('train engineer', { top: 'white', bottom: 'denim', shoes: 'black', long: true, acc: [wear('overalls', '#5a7aa8'), hat('cap', '#5a7aa8'), hb('torus', [1.12, 1.1, 0.06], [0, 0.32, -0.02], 'white', { srot: [90, 0, 0], tube: 0.1 }), wear('scarf', 'red'), gloves('tan'), held('shovel')] })),
  e('transformer', 'fantasy', 'robots', () =>
    m('transformer')
      .box([0.75, 0.4, 1.1], [0.55, 0.2, 0.1], { color: 'blue' }).box([0.75, 0.4, 1.1], [-0.55, 0.2, 0.1], { color: 'blue' })
      .box([0.7, 1.3, 0.75], [0.55, 1.05, 0], { color: 'blue' }).box([0.7, 1.3, 0.75], [-0.55, 1.05, 0], { color: 'blue' })
      .torus([0.75, 0.75, 0.3], [0.97, 0.9, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 }).torus([0.75, 0.75, 0.3], [-0.97, 0.9, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 })
      .ball(0.5, [0.55, 1.8, 0.1], { color: 'silver' }).ball(0.5, [-0.55, 1.8, 0.1], { color: 'silver' })
      .box([0.55, 0.85, 0.6], [0.5, 2.25, 0], { color: 'gray' }).box([0.55, 0.85, 0.6], [-0.5, 2.25, 0], { color: 'gray' })
      .box([1.5, 0.5, 0.8], [0, 2.75, 0], { color: 'silver' }).box([1.0, 0.5, 0.7], [0, 3.15, 0], { color: 'gray' })
      .box([2.0, 1.2, 1.1], [0, 3.9, 0], { color: 'red' })
      .box([0.75, 0.55, 0.06], [0.47, 4.05, 0.56], { color: 'skyblue' }).box([0.75, 0.55, 0.06], [-0.47, 4.05, 0.56], { color: 'skyblue' })
      .box([0.9, 0.45, 0.06], [0, 3.52, 0.56], { color: 'silver' })
      .box([0.7, 0.6, 0.8], [1.35, 4.25, 0], { color: 'red' }).box([0.7, 0.6, 0.8], [-1.35, 4.25, 0], { color: 'red' })
      .box([0.45, 0.8, 0.5], [1.4, 3.6, 0], { color: 'gray' }).box([0.45, 0.8, 0.5], [-1.4, 3.6, 0], { color: 'gray' })
      .box([0.55, 0.85, 0.6], [1.45, 2.8, 0.05], { color: 'red' }).box([0.55, 0.85, 0.6], [-1.45, 2.8, 0.05], { color: 'red' })
      .box([0.45, 0.45, 0.5], [1.45, 2.2, 0.1], { color: 'gray' }).box([0.45, 0.45, 0.5], [-1.45, 2.2, 0.1], { color: 'gray' })
      .cyl([0.18, 1.0, 0.18], [0.75, 4.8, -0.4], { color: 'silver' }).cyl([0.18, 1.0, 0.18], [-0.75, 4.8, -0.4], { color: 'silver' })
      .cyl([0.35, 0.25, 0.35], [0, 4.6, 0], { color: 'gray' })
      .box([0.6, 0.65, 0.55], [0, 5.0, 0], { color: 'blue' }).box([0.38, 0.25, 0.06], [0, 4.85, 0.28], { color: 'silver' })
      .box([0.38, 0.08, 0.04], [0, 5.06, 0.29], { color: 'cyan', glow: true })
      .box([0.08, 0.38, 0.2], [0.34, 5.1, 0], { color: 'blue' }).box([0.08, 0.38, 0.2], [-0.34, 5.1, 0], { color: 'blue' }).box([0.12, 0.2, 0.3], [0, 5.38, 0.05], { color: 'blue' })
      .done(),
  ),
  e('troll', 'fantasy', 'giants', () => who('troll', { h: 2.5, build: 1.45, skin: '#8a9a6a', hair: '#5a4a2a', style: 'long', top: '#8a9a6a', bottom: '#6b4a2a', shoes: '#8a9a6a', eyes: 'yellow', acc: [wear('vest', 'brown'), hb('ball', [0.34, 0.3, 0.36], [0, -0.06, 0.52], '#8a9a6a'), elfEars('#8a9a6a'), hb('cyl', [0.08, 0.16, 0.08], [0.15, -0.33, 0.42], 'cream', { taper: 0 }), hb('cyl', [0.08, 0.16, 0.08], [-0.15, -0.33, 0.42], 'cream', { taper: 0 }), held('club')] })),
  e('trucker', 'town', 'transport', () => who('trucker', { top: 'red', bottom: 'denim', shoes: 'brown', long: true, beard: 'brown', build: 1.25, acc: [bands('darkred', 4), hat('cap', 'blue'), hb('box', [0.6, 0.3, 0.05], [0, 0.42, 0.45], 'white'), face('beard', 'brown'), wear('belt', 'brown'), held('cup', 'white')] })),
  e('trumpeter', 'town', 'music', () => who('trumpeter', { top: 'red', bottom: 'white', shoes: 'black', long: true, acc: [hat('police', 'red'), buttons('gold'), wear('sash', 'white'), held('trumpet')] })),
  e('tsar', 'town', 'royalty', () => who('tsar', { top: 'darkred', bottom: 'darkred', shoes: 'brown', long: true, hair: 'brown', beard: 'brown', build: 1.15, acc: [wear('robe', 'darkred'), wear('cape', 'gold'), bit('hips', 'cyl', [5.0, 0.6, 3.6], [0, -5.6, 0], 'white'), furCrown, face('longbeard', 'brown'), held('staff', 'gold'), orb('L')] })),
  e('twin (person)', 'town', 'family', () => who('twin (person)', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', acc: [chest('TWIN', 'white', 2.4, 1.0, 4.4)] })),
  e('twins', 'town', 'family', () => crowd('twins', [[who('twins', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', skin: 'skin2' }), -0.3], [who('twins', { h: 'kid', top: 'yellow', bottom: 'navy', style: 'short', hair: 'brown', skin: 'skin2' }), 0.3]])),
  e('umpire', 'town', 'sports', () => wave(who('umpire', { top: 'black', bottom: 'gray', shoes: 'black', long: true, build: 1.2, acc: [hat('cap', 'black'), cage, wear('vest', 'darkgray')] }))),
  e('unicorn', 'fantasy', 'magic horses', () => beast('unicorn', { color: 'white', body: [1.5, 0.7, 0.55], bodyShape: 'capsule', legL: 0.8, legW: 0.13, hoof: 'gold', neckL: 0.65, neckLean: 28, neckW: 0.28, head: [0.55, 0.26, 0.24], snout: { len: 0.24, h: 0.2, w: 0.18 }, ears: 'pointy', earSize: 0.1, tail: 'fluffy', tailColor: 'violet', tailAngle: 125, acc: [ani.mane('pink'), ani.horns('gold', 'unicorn')] })),
  e('used car salesman', 'town', 'sales', () => wave(who('used car salesman', { top: '#c98a2a', bottom: 'brown', shoes: 'white', long: true, hair: 'black', style: 'short', acc: [bands('#7a4a1a', 4), front('red'), face('mustache', 'black'), keys('R')] }))),
  e('used car saleswoman', 'town', 'sales', () => who('used car saleswoman', { top: 'magenta', skirt: 'black', bottom: 'black', shoes: 'red', long: true, style: 'long', hair: '#e8c56a', acc: [front('', 'white'), wear('necklace', 'gold'), keys('R'), cardText('L', 'DEAL!', 'yellow')] })),
  e('valentine', 'town', 'holidays', () => who('valentine', { top: 'pink', skirt: 'red', bottom: 'red', style: 'long', blush: '#ff6f8f', acc: [hat('bow', 'red'), heartHeld('R'), held('bouquet', undefined, 'L')] })),
  e('valet', 'town', 'services', () => who('valet', { top: 'white', bottom: 'black', shoes: 'black', long: true, style: 'short', acc: [wear('vest', 'red'), wear('bowtie', 'black'), hat('police', 'red'), keys('R')] })),
  e('vampire', 'fantasy', 'monsters', () => who('vampire', { skin: '#e4e0ec', hair: 'black', style: 'short', top: 'white', bottom: 'black', shoes: 'black', long: true, eyes: 'red', blush: '#e4e0ec', acc: [wear('cape', 'black'), highCollar('darkred'), wear('vest', 'black'), wear('bowtie', 'darkred'), wear('medal', 'darkred'), fangs] })),
  e('vegan', 'town', 'everyday people', () => who('vegan', { top: 'green', bottom: 'tan', shoes: 'white', acc: [chest('VEGAN', 'lime', 2.4, 0.8, 5.0), carrot('R'), broccoli('L')] })),
  e('vegetarian', 'town', 'everyday people', () => who('vegetarian', { top: 'yellow', bottom: 'denim', shoes: 'brown', style: 'ponytail', acc: [wear('apron', 'green'), saladBowl('L'), carrot('R')] })),
  e('vet', 'town', 'animal care', () => who('vet', { top: 'skyblue', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat', 'white'), wear('stethoscope'), puppy('L')] })),
  e('vice president', 'town', 'government', () => who('vice president', { top: 'darkgray', bottom: 'darkgray', shoes: 'black', long: true, hair: 'white', style: 'short', glasses: 'black', acc: [front('blue'), face('glasses'), bit('torso', 'box', [0.4, 0.28, 0.12], [1.0, 6.0, 1.12], 'blue'), held('book', 'navy'), held('briefcase', 'black', 'L')] })),
  e('vigilante', 'town', 'superheroes', () => who('vigilante', { top: 'black', bottom: 'black', shoes: 'black', long: true, acc: [hat('hood', '#2a2a2a'), domino(), wear('cloak', '#2a2a2a'), gloves('darkgray'), wear('belt', 'gold'), held('bat', 'darkgray')] })),
  e('viking', 'town', 'history', () => who('viking', { top: '#6b5a3a', bottom: '#4a3a2a', shoes: 'brown', long: true, hair: '#c0622d', style: 'long', build: 1.25, acc: [hat('viking'), face('longbeard', '#c0622d'), wear('vest', '#8a6a4a'), wear('belt', 'darkbrown'), held('axe'), held('shield', 'red', 'L')] })),
  e('villain', 'town', 'villains', () => who('villain', { top: 'black', bottom: 'purple', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [hat('top', 'black'), wear('cape', 'black'), face('mustache', 'black'), hb('ball', [0.08, 0.08, 0.08], [0.24, -0.06, 0.46], 'black'), hb('ball', [0.08, 0.08, 0.08], [-0.24, -0.06, 0.46], 'black'), gloves('white'), bomb('L')] })),
  e('violinist', 'town', 'music', () => who('violinist', { top: 'black', skirt: 'black', bottom: 'black', long: true, style: 'bun', acc: [wear('robe', 'black'), wear('necklace', 'white'), held('violin'), fiddleBow('L')] })),
  e('volleyball player', 'town', 'sports', () => who('volleyball player', { h: 1.9, build: 0.95, ...shorts('skin3'), top: 'blue', bottom: 'white', shoes: 'white', style: 'ponytail', acc: [chest('5', 'white', 1.0, 1.0, 5.2), kneepads('white'), held('ball', 'yellow', 'L')] })),
  e('waiter', 'town', 'food service', () => who('waiter', { top: 'white', bottom: 'black', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'black'), face('mustache', 'black'), armTowel('L'), cloche('R')] })),
  e('warrior', 'town', 'history', () => who('warrior', { top: 'darkred', bottom: 'brown', shoes: 'brown', skirt: 'darkred', build: 1.25, acc: [wear('armor', 'bronze'), hat('helmet', 'bronze'), crest('red'), held('spear'), held('shield', 'bronze', 'L')] })),
  e('waterboy', 'town', 'sports', () => who('waterboy', { top: 'green', bottom: 'white', shoes: 'white', acc: [hat('cap', 'green'), cooler('R'), bottles('L')] })),
  e('weaver', 'town', 'arts', () => who('weaver', { top: 'cream', skirt: '#b5543a', bottom: '#b5543a', long: true, style: 'bun', hair: 'gray', acc: [bands('#e0a040', 3), wear('scarf', 'orange'), yarnBasket('R')] })),
  e('wedding planner', 'town', 'services', () => who('wedding planner', { top: 'pink', skirt: 'white', bottom: 'white', long: true, style: 'bun', acc: [front('', 'white'), headset, held('clipboard'), held('bouquet', undefined, 'L')] })),
  e('werewolf', 'fantasy', 'monsters', () => who('werewolf', { h: 2.0, build: 1.3, skin: '#6b4a33', hair: '#4a3324', style: 'long', top: '#7a8a9a', bottom: 'navy', shoes: '#6b4a33', eyes: 'yellow', blush: '#6b4a33', acc: [wolfSnout('#6b4a33'), hat('catears', '#6b4a33'), rips('#6b4a33')] })),
  e('windsurfer (human)', 'town', 'sports', () => lift(who('windsurfer (human)', { h: 1.75, top: 'black', bottom: 'black', shoes: 'black', long: true, hair: 'gold', acc: [bands('cyan', 2), wear('lifejacket', 'yellow'), windsurf] }), 0.05)),
  e('witch', 'fantasy', 'witches and wizards', () => who('witch', { skin: '#a8d08a', hair: '#3a3a3a', style: 'long', top: 'black', skirt: 'black', bottom: 'black', legs: 'purple', shoes: 'black', long: true, acc: [wear('robe', 'black'), hat('wizard', 'black'), hb('cyl', [0.92, 0.1, 0.86], [0, 0.6, 0], 'purple'), witchNose('#a8d08a'), held('broom')] })),
  e('wizard', 'fantasy', 'witches and wizards', () => who('wizard', { top: 'blue', bottom: 'blue', shoes: 'brown', long: true, hair: 'white', style: 'long', acc: [wear('robe', 'blue'), hat('wizard', 'blue'), starDots('yellow'), face('longbeard', 'white'), held('staff')] })),
  e('wonder woman', 'town', 'superheroes', () => who('wonder woman', { h: 1.8, top: 'red', bottom: 'blue', skirt: 'blue', legs: 'red', shoes: 'red', hair: 'black', style: 'long', acc: [hat('tiara', 'gold'), hb('ball', [0.1, 0.1, 0.06], [0, 0.42, 0.5], 'red'), bit('torso', 'box', [3.0, 0.5, 0.2], [0, 5.9, 1.08], 'gold', { srot: [0, 0, 0] }), wear('belt', 'gold'), bracers('silver'), held('lasso', 'gold'), held('shield', 'red', 'L')] })),
  e('wrestler', 'town', 'sports', () => who('wrestler', { h: 1.8, build: 1.4, skin: 'skin3', top: 'skin3', bottom: 'red', legs: 'skin3', shoes: 'red', style: 'long', hair: 'gold', acc: [hat('bandana', 'red'), champBelt, face('mustache', 'gold')] })),
  e('yoshi', 'town', 'video game characters', () =>
    m('yoshi')
      .rod([0.13, 0.1, 0], [0.12, 0.45, 0], 0.13, 'lime').rod([-0.13, 0.1, 0], [-0.12, 0.45, 0], 0.13, 'lime')
      .box([0.18, 0.13, 0.3], [0.13, 0.065, 0.06], { color: 'orange', round: 0.8 }).box([0.18, 0.13, 0.3], [-0.13, 0.065, 0.06], { color: 'orange', round: 0.8 })
      .ball([0.55, 0.6, 0.5], [0, 0.72, 0], { color: 'lime' }).ball([0.4, 0.45, 0.2], [0, 0.68, 0.18], { color: 'white' })
      .ball([0.46, 0.2, 0.36], [0, 0.88, -0.18], { color: 'red' }).torus([0.48, 0.38, 0.06], [0, 0.82, -0.18], { color: 'white', rot: [90, 0, 0] })
      .rod([0, 0.6, -0.2], [0, 0.4, -0.55], 0.16, 'lime')
      .rod([0.22, 0.85, 0.08], [0.32, 0.72, 0.25], 0.08, 'lime').rod([-0.22, 0.85, 0.08], [-0.32, 0.72, 0.25], 0.08, 'lime')
      .rod([0, 0.9, 0.05], [0, 1.1, 0.12], 0.2, 'lime')
      .ball([0.4, 0.38, 0.42], [0, 1.2, 0.08], { color: 'lime' }).ball([0.36, 0.3, 0.38], [0, 1.12, 0.36], { color: 'lime' })
      .ball([0.3, 0.13, 0.3], [0, 1.03, 0.25], { color: 'white' })
      .ball([0.06, 0.05, 0.04], [0.06, 1.18, 0.54], { color: 'darkgreen' }).ball([0.06, 0.05, 0.04], [-0.06, 1.18, 0.54], { color: 'darkgreen' })
      .ball([0.12, 0.2, 0.08], [0.08, 1.38, 0.2], { color: 'white' }).ball([0.12, 0.2, 0.08], [-0.08, 1.38, 0.2], { color: 'white' })
      .ball([0.05, 0.09, 0.03], [0.08, 1.37, 0.245], { color: 'black', eye: true }).ball([0.05, 0.09, 0.03], [-0.08, 1.37, 0.245], { color: 'black', eye: true })
      .cone([0.09, 0.1, 0.06], [0, 1.4, -0.1], { color: 'red', rot: [-30, 0, 0] }).cone([0.08, 0.09, 0.06], [0, 1.3, -0.17], { color: 'red', rot: [-60, 0, 0] })
      .done(),
  ),
  e('young bruce wayne', 'town', 'superheroes', () => who('young bruce wayne', { h: 'kid', skin: 'skin1', top: 'navy', bottom: 'gray', shoes: 'black', long: true, hair: 'black', style: 'short', acc: [front('red'), bat('L')] })),
  e('zelda', 'town', 'video game characters', () => who('zelda', { skin: 'skin1', hair: '#c9a25a', style: 'long', top: 'white', skirt: 'white', bottom: 'white', long: true, h: 1.6, acc: [wear('robe', 'white'), bit('torso', 'box', [1.4, 6.0, 0.25], [0, 1.5, 1.1], 'purple'), bit('torso', 'wedge', [0.9, 0.8, 0.15], [0, 2.2, 1.25], 'gold'), hat('tiara', 'gold'), elfEars('skin1'), wear('belt', 'gold')] })),
  e('zoey', 'town', 'everyday people', () => who('zoey', { h: 1.65, top: 'pink', skirt: 'denim', bottom: 'denim', shoes: 'white', hair: 'gold', style: 'long', acc: [hat('headband', 'pink'), held('bag', 'purple'), held('phone', undefined, 'L')] })),
  e('zombie', 'fantasy', 'monsters', () => pose(who('zombie', { skin: '#9cbf8a', hair: 'darkbrown', style: 'short', top: '#7a8a9a', bottom: '#5a4a3a', shoes: 'darkgray', long: true, eyes: 'red', blush: '#9cbf8a', acc: [rips('#4a4a4a')] }), { armL: [-85, 0, 6], armR: [-85, 0, -6] })),
  e('zookeeper', 'town', 'animal care', () => who('zookeeper', { top: 'tan', bottom: '#8a7a5a', shoes: 'brown', acc: [hat('straw', 'tan'), wear('badge', 'green'), wear('belt', 'brown'), fishBucket('R')] })),
];
